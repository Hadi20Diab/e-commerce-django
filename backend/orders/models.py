from django.db import models
from django.conf import settings
from django.utils import timezone
from products.models import Product


class Coupon(models.Model):
    DISCOUNT_TYPES = [('percentage', 'Percentage'), ('fixed', 'Fixed Amount')]

    code = models.CharField(max_length=50, unique=True, db_index=True)
    discount_type = models.CharField(max_length=10, choices=DISCOUNT_TYPES, default='percentage')
    discount_value = models.DecimalField(max_digits=10, decimal_places=2)
    min_order_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    max_uses = models.PositiveIntegerField(null=True, blank=True)
    times_used = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.code

    def is_valid(self, order_total):
        from decimal import Decimal
        if not self.is_active:
            return False, 'This coupon is not active.'
        if self.expires_at and self.expires_at < timezone.now():
            return False, 'This coupon has expired.'
        if self.max_uses is not None and self.times_used >= self.max_uses:
            return False, 'This coupon has reached its usage limit.'
        if Decimal(str(order_total)) < self.min_order_amount:
            return False, f'Minimum order amount for this coupon is ${self.min_order_amount}.'
        return True, None

    def calculate_discount(self, order_total):
        from decimal import Decimal
        total = Decimal(str(order_total))
        if self.discount_type == 'percentage':
            return min((self.discount_value / 100) * total, total)
        return min(self.discount_value, total)


class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('processing', 'Processing'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ]

    PAYMENT_METHOD_CHOICES = [
        ('mock', 'Mock Payment'),
        ('card', 'Credit/Debit Card'),
        ('paypal', 'PayPal'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='orders')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='mock')
    is_paid = models.BooleanField(default=False)
    paid_at = models.DateTimeField(null=True, blank=True)

    # Shipping info snapshot
    shipping_full_name = models.CharField(max_length=200)
    shipping_street = models.CharField(max_length=255)
    shipping_city = models.CharField(max_length=100)
    shipping_state = models.CharField(max_length=100)
    shipping_postal_code = models.CharField(max_length=20)
    shipping_country = models.CharField(max_length=100)

    # Stored totals (never recalculated)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    shipping_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    coupon = models.ForeignKey(Coupon, on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    total_price = models.DecimalField(max_digits=10, decimal_places=2)

    notes = models.TextField(blank=True)
    stripe_payment_intent_id = models.CharField(max_length=200, blank=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Order #{self.id} - {self.user.email if self.user else "Deleted User"}'


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    product_name = models.CharField(max_length=300)
    product_slug = models.SlugField(max_length=350, blank=True)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f'{self.quantity}x {self.product_name}'

    @property
    def subtotal(self):
        if self.unit_price is None or self.quantity is None:
            return None
        return self.unit_price * self.quantity


class StripeWebhookEvent(models.Model):
    """Tracks processed Stripe event IDs to guarantee idempotency."""
    stripe_event_id = models.CharField(max_length=200, unique=True)
    event_type = models.CharField(max_length=100)
    processed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-processed_at']

    def __str__(self):
        return f'{self.event_type} — {self.stripe_event_id}'

