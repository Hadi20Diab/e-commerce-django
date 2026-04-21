from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import transaction
from cart.models import Cart
from .models import Order, OrderItem
from .serializers import OrderSerializer, CreateOrderSerializer

SHIPPING_COST = 10.00


class CreateOrderView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        serializer = CreateOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            cart = Cart.objects.prefetch_related('items__product').get(user=request.user)
        except Cart.DoesNotExist:
            return Response({'detail': 'Cart not found.'}, status=status.HTTP_400_BAD_REQUEST)

        cart_items = cart.items.all()
        if not cart_items.exists():
            return Response({'detail': 'Cart is empty.'}, status=status.HTTP_400_BAD_REQUEST)

        # Validate stock and calculate totals
        for item in cart_items:
            if item.product.stock < item.quantity:
                return Response(
                    {'detail': f'Insufficient stock for "{item.product.name}". Only {item.product.stock} left.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        subtotal = sum(item.subtotal for item in cart_items)
        shipping_cost = SHIPPING_COST
        total_price = subtotal + shipping_cost

        order = Order.objects.create(
            user=request.user,
            payment_method=data['payment_method'],
            shipping_full_name=data['shipping_full_name'],
            shipping_street=data['shipping_street'],
            shipping_city=data['shipping_city'],
            shipping_state=data['shipping_state'],
            shipping_postal_code=data['shipping_postal_code'],
            shipping_country=data['shipping_country'],
            notes=data.get('notes', ''),
            subtotal=subtotal,
            shipping_cost=shipping_cost,
            total_price=total_price,
        )

        # Create order items and deduct stock
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

        # Mock payment: mark as paid immediately
        if data['payment_method'] == 'mock':
            from django.utils import timezone
            order.is_paid = True
            order.paid_at = timezone.now()
            order.status = 'paid'
            order.save()

        # Clear the cart
        cart.items.all().delete()

        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


class OrderListView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).prefetch_related('items__product')


class OrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).prefetch_related('items__product')
