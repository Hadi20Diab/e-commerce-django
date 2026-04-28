from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('change-password/', views.ChangePasswordView.as_view(), name='change_password'),
    path('addresses/', views.AddressListCreateView.as_view(), name='address_list'),
    path('addresses/<int:pk>/', views.AddressDetailView.as_view(), name='address_detail'),
    # Wishlist
    path('wishlist/', views.WishlistView.as_view(), name='wishlist'),
    path('wishlist/<int:product_id>/remove/', views.WishlistRemoveView.as_view(), name='wishlist_remove'),
    path('wishlist/<int:product_id>/check/', views.WishlistCheckView.as_view(), name='wishlist_check'),
]
