from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework import status
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import Category, Product, Banner, Review
from .serializers import (
    CategorySerializer, ProductListSerializer,
    ProductDetailSerializer, BannerSerializer,
    ReviewSerializer, ReviewCreateSerializer
)
from .filters import ProductFilter


class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]


class ProductListView(generics.ListAPIView):
    serializer_class = ProductListSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = ProductFilter
    search_fields = ['name', 'description', 'category__name']
    ordering_fields = ['price', 'created_at', 'name']
    ordering = ['-created_at']

    def get_queryset(self):
        return Product.objects.filter(is_active=True).select_related('category').prefetch_related('images')


class ProductDetailView(generics.RetrieveAPIView):
    serializer_class = ProductDetailSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug'

    def get_queryset(self):
        return Product.objects.filter(is_active=True).select_related('category').prefetch_related('images')


class FeaturedProductListView(generics.ListAPIView):
    serializer_class = ProductListSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return Product.objects.filter(
            is_active=True, is_featured=True
        ).select_related('category').prefetch_related('images')[:8]


class BannerListView(generics.ListAPIView):
    queryset = Banner.objects.filter(is_active=True)
    serializer_class = BannerSerializer
    permission_classes = [permissions.AllowAny]


class ReviewListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ReviewCreateSerializer
        return ReviewSerializer

    def get_queryset(self):
        product = generics.get_object_or_404(Product, slug=self.kwargs['slug'], is_active=True)
        return Review.objects.filter(product=product, is_approved=True).select_related('user')

    def perform_create(self, serializer):
        product = generics.get_object_or_404(Product, slug=self.kwargs['slug'], is_active=True)
        # Prevent duplicate reviews
        if Review.objects.filter(product=product, user=self.request.user).exists():
            from rest_framework.exceptions import ValidationError
            raise ValidationError('You have already reviewed this product.')
        # Only verified purchasers may review
        from orders.models import Order
        has_purchased = Order.objects.filter(
            user=self.request.user,
            is_paid=True,
            items__product=product,
        ).exists()
        if not has_purchased:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('You can only review products you have purchased.')
        serializer.save(product=product, user=self.request.user)
