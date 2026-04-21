from django.urls import path
from . import views

urlpatterns = [
    path('', views.OrderListView.as_view(), name='order_list'),
    path('create/', views.CreateOrderView.as_view(), name='create_order'),
    path('<int:pk>/', views.OrderDetailView.as_view(), name='order_detail'),
    # Stripe
    path('stripe/create-intent/', views.StripeCreateIntentView.as_view(), name='stripe_create_intent'),
    # PayPal
    path('paypal/create-order/', views.PayPalCreateOrderView.as_view(), name='paypal_create_order'),
    path('paypal/capture/', views.PayPalCaptureView.as_view(), name='paypal_capture'),
]
