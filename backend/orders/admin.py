from django.contrib import admin
from .models import Order, OrderItem
from django.db.models import Sum, Count
from django.utils.html import format_html


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('product_name', 'unit_price', 'quantity', 'subtotal')
    fields = ('product_name', 'product', 'unit_price', 'quantity', 'subtotal')


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'status', 'total_price', 'is_paid', 'created_at')
    list_filter = ('status', 'is_paid', 'payment_method')
    search_fields = ('user__email', 'shipping_full_name')
    list_editable = ('status',)
    inlines = [OrderItemInline]
    readonly_fields = (
        'user', 'subtotal', 'total_price', 'shipping_cost',
        'is_paid', 'paid_at', 'created_at'
    )
    fieldsets = (
        ('Order Info', {'fields': ('user', 'status', 'payment_method', 'is_paid', 'paid_at')}),
        ('Shipping', {'fields': (
            'shipping_full_name', 'shipping_street', 'shipping_city',
            'shipping_state', 'shipping_postal_code', 'shipping_country'
        )}),
        ('Financials', {'fields': ('subtotal', 'shipping_cost', 'total_price')}),
        ('Notes', {'fields': ('notes',)}),
        ('Timestamps', {'fields': ('created_at',)}),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')
