from django.urls import path
from . import views

urlpatterns = [
    path('', views.CartView.as_view(), name='cart'),
    path('add/', views.CartItemAddView.as_view(), name='cart_add'),
    path('items/<int:item_id>/', views.CartItemUpdateView.as_view(), name='cart_item'),
]
