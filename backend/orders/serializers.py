from rest_framework import serializers
from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = ('id', 'product', 'product_name', 'product_slug', 'quantity', 'unit_price', 'subtotal')


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Order
        fields = (
            'id', 'status', 'status_display', 'payment_method', 'is_paid', 'paid_at',
            'shipping_full_name', 'shipping_street', 'shipping_city',
            'shipping_state', 'shipping_postal_code', 'shipping_country',
            'subtotal', 'shipping_cost', 'total_price',
            'notes', 'items', 'created_at'
        )
        read_only_fields = ('id', 'status', 'is_paid', 'paid_at', 'subtotal', 'total_price', 'created_at')


class CreateOrderSerializer(serializers.Serializer):
    shipping_full_name = serializers.CharField(max_length=200)
    shipping_street = serializers.CharField(max_length=255)
    shipping_city = serializers.CharField(max_length=100)
    shipping_state = serializers.CharField(max_length=100)
    shipping_postal_code = serializers.CharField(max_length=20)
    shipping_country = serializers.CharField(max_length=100)
    payment_method = serializers.ChoiceField(choices=['mock', 'card', 'paypal'], default='mock')
    notes = serializers.CharField(required=False, allow_blank=True)
    stripe_payment_intent_id = serializers.CharField(required=False, allow_blank=True, default='')
    paypal_order_id = serializers.CharField(required=False, allow_blank=True, default='')
