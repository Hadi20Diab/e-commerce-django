from django.urls import path
from . import views

urlpatterns = [
    path('', views.ProductListView.as_view(), name='product_list'),
    path('featured/', views.FeaturedProductListView.as_view(), name='featured_products'),
    path('categories/', views.CategoryListView.as_view(), name='category_list'),
    path('banners/', views.BannerListView.as_view(), name='banner_list'),
    path('<slug:slug>/reviews/', views.ReviewListCreateView.as_view(), name='product_reviews'),
    path('<slug:slug>/', views.ProductDetailView.as_view(), name='product_detail'),
]
