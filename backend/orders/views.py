from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import transaction
from django.conf import settings
from django.utils import timezone
from decimal import Decimal
import requests as http_requests

try:
    import stripe
except ImportError:
    stripe = None

from cart.models import Cart
from .models import Order, OrderItem
from .serializers import OrderSerializer, CreateOrderSerializer

SHIPPING_COST = Decimal('10.00')


# ── PayPal helpers ─────────────────────────────────────────────────────────────

def _paypal_base_url():
    mode = getattr(settings, 'PAYPAL_MODE', 'sandbox')
    return (
        'https://api-m.sandbox.paypal.com'
        if mode == 'sandbox'
        else 'https://api-m.paypal.com'
    )


def _get_paypal_token():
    client_id = getattr(settings, 'PAYPAL_CLIENT_ID', '')
    secret = getattr(settings, 'PAYPAL_SECRET', '')
    if not (client_id and secret):
        return None
    try:
        resp = http_requests.post(
            f"{_paypal_base_url()}/v1/oauth2/token",
            auth=(client_id, secret),
            data={'grant_type': 'client_credentials'},
            headers={'Accept': 'application/json'},
            timeout=10,
        )
        resp.raise_for_status()
        return resp.json().get('access_token')
    except Exception:
        return None


# ── Cart / order helpers ───────────────────────────────────────────────────────

def _build_order(user, form_data):
    """Validate cart and return an unsaved Order + cart + items. Raises on failure."""
    cart = Cart.objects.prefetch_related('items__product').get(user=user)
    cart_items = list(cart.items.all())

    if not cart_items:
        raise ValueError('Cart is empty.')

    for item in cart_items:
        if item.product.stock < item.quantity:
            raise ValueError(
                f'Insufficient stock for "{item.product.name}". '
                f'Only {item.product.stock} left.'
            )

    subtotal = sum(item.subtotal for item in cart_items)
    total_price = subtotal + SHIPPING_COST

    order = Order(
        user=user,
        payment_method=form_data['payment_method'],
        shipping_full_name=form_data['shipping_full_name'],
        shipping_street=form_data['shipping_street'],
        shipping_city=form_data['shipping_city'],
        shipping_state=form_data['shipping_state'],
        shipping_postal_code=form_data['shipping_postal_code'],
        shipping_country=form_data['shipping_country'],
        notes=form_data.get('notes', ''),
        subtotal=subtotal,
        shipping_cost=SHIPPING_COST,
        total_price=total_price,
    )
    return order, cart, cart_items


def _save_order(order, cart, cart_items):
    """Persist order, create OrderItems, deduct stock, and clear the cart."""
    order.save()
    for item in cart_items:
        OrderItem.objects.create(
            order=order,
            product=item.product,
            product_name=item.product.name,
            product_slug=item.product.slug,
            quantity=item.quantity,
            unit_price=item.product.price,
        )
        item.product.stock -= item.quantity
        item.product.save()
    cart.items.all().delete()


# ── Views ──────────────────────────────────────────────────────────────────────

class CreateOrderView(APIView):
    """Handles mock and card (Stripe) orders. PayPal uses PayPalCaptureView."""
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        serializer = CreateOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            order, cart, cart_items = _build_order(request.user, data)
        except Cart.DoesNotExist:
            return Response({'detail': 'Cart not found.'}, status=status.HTTP_400_BAD_REQUEST)
        except ValueError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        payment_method = data['payment_method']

        # ── Mock ──────────────────────────────────────────────────────────────
        if payment_method == 'mock':
            order.is_paid = True
            order.paid_at = timezone.now()
            order.status = 'paid'
            _save_order(order, cart, cart_items)
            return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)

        # ── Stripe card ───────────────────────────────────────────────────────
        if payment_method == 'card':
            if not getattr(settings, 'STRIPE_SECRET_KEY', ''):
                return Response(
                    {'detail': 'Card payments are not configured on this server.'},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )
            payment_intent_id = data.get('stripe_payment_intent_id', '').strip()
            if not payment_intent_id:
                return Response(
                    {'detail': 'stripe_payment_intent_id is required for card payments.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            stripe.api_key = settings.STRIPE_SECRET_KEY
            try:
                intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            except stripe.error.StripeError as exc:
                return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

            if intent.status != 'succeeded':
                return Response(
                    {'detail': 'Payment has not been completed.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            order.is_paid = True
            order.paid_at = timezone.now()
            order.status = 'paid'
            _save_order(order, cart, cart_items)
            return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)

        return Response(
            {'detail': 'Use /orders/paypal/capture/ for PayPal payments.'},
            status=status.HTTP_400_BAD_REQUEST,
        )


class StripeCreateIntentView(APIView):
    """Create a Stripe PaymentIntent for the current cart total."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if not getattr(settings, 'STRIPE_SECRET_KEY', ''):
            return Response(
                {'detail': 'Card payments are not configured on this server.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        try:
            cart = Cart.objects.prefetch_related('items__product').get(user=request.user)
        except Cart.DoesNotExist:
            return Response({'detail': 'Cart not found.'}, status=status.HTTP_400_BAD_REQUEST)

        cart_items = cart.items.all()
        if not cart_items.exists():
            return Response({'detail': 'Cart is empty.'}, status=status.HTTP_400_BAD_REQUEST)

        subtotal = sum(item.subtotal for item in cart_items)
        total_price = subtotal + SHIPPING_COST
        amount_cents = int(total_price * 100)

        stripe.api_key = settings.STRIPE_SECRET_KEY
        try:
            intent = stripe.PaymentIntent.create(
                amount=amount_cents,
                currency='usd',
                metadata={'user_id': str(request.user.id)},
                automatic_payment_methods={'enabled': True, 'allow_redirects': 'never'},
            )
        except stripe.error.StripeError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({
            'client_secret': intent.client_secret,
            'payment_intent_id': intent.id,
            'amount_cents': amount_cents,
        })


class PayPalCreateOrderView(APIView):
    """Create a PayPal order for the current cart. Returns {paypal_order_id}."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if not (getattr(settings, 'PAYPAL_CLIENT_ID', '') and
                getattr(settings, 'PAYPAL_SECRET', '')):
            return Response(
                {'detail': 'PayPal payments are not configured on this server.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        try:
            cart = Cart.objects.prefetch_related('items__product').get(user=request.user)
        except Cart.DoesNotExist:
            return Response({'detail': 'Cart not found.'}, status=status.HTTP_400_BAD_REQUEST)

        cart_items = cart.items.all()
        if not cart_items.exists():
            return Response({'detail': 'Cart is empty.'}, status=status.HTTP_400_BAD_REQUEST)

        subtotal = sum(item.subtotal for item in cart_items)
        total_price = subtotal + SHIPPING_COST

        access_token = _get_paypal_token()
        if not access_token:
            return Response(
                {'detail': 'Could not connect to PayPal.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        try:
            resp = http_requests.post(
                f"{_paypal_base_url()}/v2/checkout/orders",
                headers={
                    'Content-Type': 'application/json',
                    'Authorization': f'Bearer {access_token}',
                },
                json={
                    'intent': 'CAPTURE',
                    'purchase_units': [{'amount': {
                        'currency_code': 'USD',
                        'value': f'{total_price:.2f}',
                    }}],
                },
                timeout=10,
            )
            resp.raise_for_status()
        except Exception:
            return Response(
                {'detail': 'PayPal connection error.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        pp_data = resp.json()
        if 'id' not in pp_data:
            return Response(
                {'detail': 'Failed to create PayPal order.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        return Response({'paypal_order_id': pp_data['id']})


class PayPalCaptureView(APIView):
    """Capture a PayPal payment and atomically create the Django Order."""
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        if not (getattr(settings, 'PAYPAL_CLIENT_ID', '') and
                getattr(settings, 'PAYPAL_SECRET', '')):
            return Response(
                {'detail': 'PayPal payments are not configured on this server.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        paypal_order_id = request.data.get('paypal_order_id', '').strip()
        if not paypal_order_id:
            return Response(
                {'detail': 'paypal_order_id is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = CreateOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        form_data = serializer.validated_data
        form_data['payment_method'] = 'paypal'

        access_token = _get_paypal_token()
        if not access_token:
            return Response(
                {'detail': 'Could not connect to PayPal.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        try:
            resp = http_requests.post(
                f"{_paypal_base_url()}/v2/checkout/orders/{paypal_order_id}/capture",
                headers={
                    'Content-Type': 'application/json',
                    'Authorization': f'Bearer {access_token}',
                },
                timeout=10,
            )
            resp.raise_for_status()
        except Exception:
            return Response(
                {'detail': 'PayPal capture request failed.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        result = resp.json()
        if result.get('status') != 'COMPLETED':
            return Response(
                {'detail': 'PayPal payment was not completed.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            order, cart, cart_items = _build_order(request.user, form_data)
        except Cart.DoesNotExist:
            return Response({'detail': 'Cart not found.'}, status=status.HTTP_400_BAD_REQUEST)
        except ValueError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        order.is_paid = True
        order.paid_at = timezone.now()
        order.status = 'paid'
        _save_order(order, cart, cart_items)

        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


class OrderListView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(
            user=self.request.user
        ).prefetch_related('items__product')


class OrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(
            user=self.request.user
        ).prefetch_related('items__product')
