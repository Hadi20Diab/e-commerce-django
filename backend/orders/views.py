from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import transaction, models
from django.conf import settings
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.core.mail import EmailMultiAlternatives
from decimal import Decimal
import requests as http_requests
import logging

logger = logging.getLogger(__name__)


# ── Order confirmation email ───────────────────────────────────────────────────

def _send_order_confirmation_task(order):
    """Internal: actually send the email. Runs in a background thread."""
    if not order.user or not order.user.email:
        return
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@luxe.com')
    recipient = order.user.email
    subject = f"Order Confirmed — #{order.id} | Luxe Store"

    items_text = '\n'.join(
        f"  • {item.product_name} × {item.quantity}  @ ${item.unit_price}"
        for item in order.items.all()
    )
    items_html = ''.join(
        f"<tr><td style='padding:8px 12px;border-bottom:1px solid #eee'>{item.product_name}</td>"
        f"<td style='padding:8px 12px;border-bottom:1px solid #eee;text-align:center'>{item.quantity}</td>"
        f"<td style='padding:8px 12px;border-bottom:1px solid #eee;text-align:right'>${item.unit_price}</td></tr>"
        for item in order.items.all()
    )

    text_body = (
        f"Hi {order.shipping_full_name},\n\n"
        f"Thank you for your order! Here are your order details:\n\n"
        f"Order #{order.id}\n"
        f"{'─' * 30}\n"
        f"{items_text}\n"
        f"{'─' * 30}\n"
        f"Subtotal:  ${order.subtotal}\n"
        f"Shipping:  ${order.shipping_cost}\n"
        f"Total:     ${order.total_price}\n\n"
        f"Shipping to:\n"
        f"  {order.shipping_full_name}\n"
        f"  {order.shipping_street}, {order.shipping_city}\n"
        f"  {order.shipping_state} {order.shipping_postal_code}, {order.shipping_country}\n\n"
        f"We'll notify you when your order ships.\n\n"
        f"Best regards,\nLuxe Store Team"
    )

    html_body = f"""
<html><body style="font-family:Arial,sans-serif;color:#333;max-width:600px;margin:0 auto">
  <div style="background:#ff5722;padding:24px 32px;border-radius:8px 8px 0 0">
    <h1 style="color:#fff;margin:0;font-size:1.5rem">Order Confirmed!</h1>
    <p style="color:rgba(255,255,255,0.85);margin:4px 0 0">Order #{order.id}</p>
  </div>
  <div style="border:1px solid #eee;border-top:none;padding:24px 32px;border-radius:0 0 8px 8px">
    <p>Hi <strong>{order.shipping_full_name}</strong>,</p>
    <p>Thank you for your purchase! We're getting your order ready.</p>

    <h3 style="border-bottom:2px solid #ff5722;padding-bottom:8px">Order Summary</h3>
    <table style="width:100%;border-collapse:collapse">
      <thead>
        <tr style="background:#f9f9f9">
          <th style="padding:8px 12px;text-align:left">Product</th>
          <th style="padding:8px 12px;text-align:center">Qty</th>
          <th style="padding:8px 12px;text-align:right">Price</th>
        </tr>
      </thead>
      <tbody>{items_html}</tbody>
    </table>
    <table style="width:100%;margin-top:12px">
      <tr><td style="padding:4px 12px;color:#666">Subtotal</td><td style="padding:4px 12px;text-align:right">${order.subtotal}</td></tr>
      <tr><td style="padding:4px 12px;color:#666">Shipping</td><td style="padding:4px 12px;text-align:right">${order.shipping_cost}</td></tr>
      <tr style="font-weight:bold;font-size:1.05rem">
        <td style="padding:8px 12px;border-top:2px solid #333">Total</td>
        <td style="padding:8px 12px;border-top:2px solid #333;text-align:right;color:#ff5722">${order.total_price}</td>
      </tr>
    </table>

    <h3 style="border-bottom:2px solid #ff5722;padding-bottom:8px;margin-top:24px">Shipping Address</h3>
    <p style="margin:0;line-height:1.8">
      {order.shipping_full_name}<br>
      {order.shipping_street}<br>
      {order.shipping_city}, {order.shipping_state} {order.shipping_postal_code}<br>
      {order.shipping_country}
    </p>

    <div style="margin-top:32px;padding-top:16px;border-top:1px solid #eee;font-size:0.85rem;color:#999">
      <p>Questions? Reply to this email or visit our <a href="http://localhost:3000/contact" style="color:#ff5722">contact page</a>.</p>
      <p>Luxe Store — Premium Products & Style</p>
    </div>
  </div>
</body></html>"""

    try:
        msg = EmailMultiAlternatives(subject, text_body, from_email, [recipient])
        msg.attach_alternative(html_body, 'text/html')
        msg.send(fail_silently=True)
    except Exception:
        logger.exception('Failed to send order confirmation email for order %s', order.id)


def _send_order_confirmation(order):
    """Send order confirmation email in a background thread so it never blocks the HTTP response."""
    import threading
    t = threading.Thread(target=_send_order_confirmation_task, args=(order,), daemon=True)
    t.start()


try:
    import stripe
except ImportError:
    stripe = None

from cart.models import Cart
from .models import Order, OrderItem, StripeWebhookEvent, Coupon
from .serializers import OrderSerializer, CreateOrderSerializer, CouponSerializer

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
    """Validate cart, apply coupon, and return an unsaved Order + cart + items."""
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
    total_before_discount = subtotal + SHIPPING_COST

    # Apply coupon if provided
    coupon_obj = None
    discount_amount = Decimal('0')
    coupon_code = form_data.get('coupon_code', '').strip().upper()
    if coupon_code:
        try:
            coupon_obj = Coupon.objects.get(code__iexact=coupon_code)
            valid, error = coupon_obj.is_valid(total_before_discount)
            if valid:
                discount_amount = coupon_obj.calculate_discount(total_before_discount)
            else:
                raise ValueError(f'Coupon error: {error}')
        except Coupon.DoesNotExist:
            raise ValueError('Invalid coupon code.')

    total_price = total_before_discount - discount_amount

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
        discount_amount=discount_amount,
        coupon=coupon_obj,
        total_price=total_price,
    )
    return order, cart, cart_items, coupon_obj


def _save_order(order, cart, cart_items):
    """Persist order, create OrderItems, deduct stock, increment coupon usage, and clear the cart."""
    order.save()
    if order.coupon_id:
        Coupon.objects.filter(pk=order.coupon_id).update(
            times_used=models.F('times_used') + 1
        )
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
            order, cart, cart_items, _ = _build_order(request.user, data)
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
            _send_order_confirmation(order)
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
            order.stripe_payment_intent_id = payment_intent_id
            _save_order(order, cart, cart_items)
            _send_order_confirmation(order)
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
            order, cart, cart_items, _ = _build_order(request.user, form_data)
        except Cart.DoesNotExist:
            return Response({'detail': 'Cart not found.'}, status=status.HTTP_400_BAD_REQUEST)
        except ValueError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        order.is_paid = True
        order.paid_at = timezone.now()
        order.status = 'paid'
        _save_order(order, cart, cart_items)
        _send_order_confirmation(order)

        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


class ApplyCouponView(APIView):
    """Validate a coupon code and return discount info."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        code = request.data.get('code', '').strip().upper()
        order_total = request.data.get('order_total', 0)

        if not code:
            return Response({'error': 'Please enter a coupon code.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            coupon = Coupon.objects.get(code__iexact=code, is_active=True)
        except Coupon.DoesNotExist:
            return Response({'error': 'Invalid coupon code.'}, status=status.HTTP_400_BAD_REQUEST)

        valid, error = coupon.is_valid(Decimal(str(order_total)))
        if not valid:
            return Response({'error': error}, status=status.HTTP_400_BAD_REQUEST)

        discount = coupon.calculate_discount(Decimal(str(order_total)))
        return Response({
            'code': coupon.code,
            'discount_type': coupon.discount_type,
            'discount_value': str(coupon.discount_value),
            'discount_amount': str(discount),
        })


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


@method_decorator(csrf_exempt, name='dispatch')
class StripeWebhookView(APIView):
    """
    Stripe sends signed events here.  Verify the signature, then process
    whichever event type arrived.  All event processing is idempotent —
    duplicate deliveries are silently skipped.
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes = []   # no JWT / session needed

    def post(self, request):
        if stripe is None:
            return Response({'detail': 'Stripe not installed.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        webhook_secret = getattr(settings, 'STRIPE_WEBHOOK_SECRET', '')
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE', '')
        payload = request.body

        if webhook_secret:
            try:
                event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
            except stripe.error.SignatureVerificationError:
                return Response({'detail': 'Invalid signature.'}, status=status.HTTP_400_BAD_REQUEST)
            except Exception:
                return Response({'detail': 'Webhook error.'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            # No secret configured — parse event without verification (dev only)
            import json
            try:
                event = stripe.Event.construct_from(json.loads(payload), stripe.api_key)
            except Exception:
                return Response({'detail': 'Invalid payload.'}, status=status.HTTP_400_BAD_REQUEST)

        # Idempotency: skip if we already processed this event
        _, created = StripeWebhookEvent.objects.get_or_create(
            stripe_event_id=event['id'],
            defaults={'event_type': event['type']},
        )
        if not created:
            return Response({'detail': 'Already processed.'}, status=status.HTTP_200_OK)

        event_type = event['type']
        data_obj = event['data']['object']

        try:
            if event_type == 'payment_intent.succeeded':
                self._handle_pi_succeeded(data_obj)

            elif event_type == 'payment_intent.payment_failed':
                self._handle_pi_failed(data_obj)

            elif event_type == 'payment_intent.canceled':
                self._handle_pi_canceled(data_obj)

            elif event_type == 'payment_intent.amount_capturable_updated':
                # PaymentIntent awaiting manual capture — log only
                pi_id = data_obj['id'] if 'id' in data_obj else ''
                logger.info('Stripe: amount_capturable_updated for %s', pi_id)

            elif event_type == 'charge.refunded':
                self._handle_charge_refunded(data_obj)

            elif event_type in ('charge.dispute.created', 'charge.dispute.updated'):
                self._handle_dispute(event_type, data_obj)

            elif event_type == 'checkout.session.completed':
                self._handle_checkout_completed(data_obj)

        except Exception:
            logger.exception('Stripe webhook handler raised for event %s', event['id'])
            # Return 200 so Stripe doesn't keep retrying transient errors.
            # The event is already logged in StripeWebhookEvent.

        return Response({'detail': 'ok'}, status=status.HTTP_200_OK)

    # ── Event handlers ────────────────────────────────────────────────────────

    def _handle_pi_succeeded(self, pi):
        pi_id = pi['id'] if 'id' in pi else ''
        order = Order.objects.filter(stripe_payment_intent_id=pi_id).first()
        if not order:
            logger.info('Stripe webhook: no order found for PI %s (may be handled by checkout flow)', pi_id)
            return
        if order.is_paid:
            return  # already marked paid via checkout flow
        order.is_paid = True
        order.paid_at = timezone.now()
        order.status = 'paid'
        order.save(update_fields=['is_paid', 'paid_at', 'status', 'updated_at'])
        logger.info('Stripe webhook: order %s marked paid (PI %s)', order.id, pi_id)

    def _handle_pi_failed(self, pi):
        pi_id = pi['id'] if 'id' in pi else ''
        order = Order.objects.filter(stripe_payment_intent_id=pi_id, is_paid=False).first()
        if not order:
            return
        order.status = 'cancelled'
        order.save(update_fields=['status', 'updated_at'])
        logger.info('Stripe webhook: order %s cancelled — payment failed (PI %s)', order.id, pi_id)

    def _handle_pi_canceled(self, pi):
        pi_id = pi['id'] if 'id' in pi else ''
        order = Order.objects.filter(stripe_payment_intent_id=pi_id, is_paid=False).first()
        if not order:
            return
        order.status = 'cancelled'
        order.save(update_fields=['status', 'updated_at'])
        logger.info('Stripe webhook: order %s cancelled (PI %s)', order.id, pi_id)

    def _handle_charge_refunded(self, charge):
        pi_id = charge['payment_intent'] if 'payment_intent' in charge else ''
        if not pi_id:
            return
        order = Order.objects.filter(stripe_payment_intent_id=pi_id).first()
        if not order:
            return
        order.status = 'cancelled'
        order.save(update_fields=['status', 'updated_at'])
        logger.info('Stripe webhook: order %s marked cancelled — charge refunded (PI %s)', order.id, pi_id)

    def _handle_dispute(self, event_type, dispute):
        charge_id = dispute['charge'] if 'charge' in dispute else ''
        logger.warning('Stripe webhook: dispute %s on charge %s', event_type, charge_id)

    def _handle_checkout_completed(self, session):
        pi_id = session['payment_intent'] if 'payment_intent' in session else ''
        if not pi_id:
            return
        order = Order.objects.filter(stripe_payment_intent_id=pi_id).first()
        if not order:
            return
        if order.is_paid:
            return
        order.is_paid = True
        order.paid_at = timezone.now()
        order.status = 'paid'
        order.save(update_fields=['is_paid', 'paid_at', 'status', 'updated_at'])
        logger.info('Stripe webhook: order %s marked paid via checkout.session.completed (PI %s)', order.id, pi_id)

