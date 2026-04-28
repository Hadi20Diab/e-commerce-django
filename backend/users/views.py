from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from .serializers import (
    RegisterSerializer, UserSerializer, UpdateProfileSerializer,
    ChangePasswordSerializer, AddressSerializer, WishlistItemSerializer
)
from .models import Address, WishlistItem

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_201_CREATED)


class ProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return UpdateProfileSerializer
        return UserSerializer

    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()
        return Response({'detail': 'Password updated successfully.'})


class AddressListCreateView(generics.ListCreateAPIView):
    serializer_class = AddressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class AddressDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AddressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)


class WishlistView(generics.ListCreateAPIView):
    serializer_class = WishlistItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return WishlistItem.objects.filter(user=self.request.user).select_related('product__category').prefetch_related('product__images')

    def perform_create(self, serializer):
        from products.models import Product
        product_id = self.request.data.get('product_id')
        product = generics.get_object_or_404(Product, pk=product_id)
        # Idempotent: return existing if already wishlisted
        item, created = WishlistItem.objects.get_or_create(user=self.request.user, product=product)
        if not created:
            # Already exists — return it without creating
            pass
        serializer.instance = item

    def create(self, request, *args, **kwargs):
        from products.models import Product
        product_id = request.data.get('product_id')
        if not product_id:
            return Response({'error': 'product_id is required.'}, status=status.HTTP_400_BAD_REQUEST)
        product = generics.get_object_or_404(Product, pk=product_id)
        item, created = WishlistItem.objects.get_or_create(user=request.user, product=product)
        serializer = self.get_serializer(item)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class WishlistRemoveView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, product_id):
        deleted, _ = WishlistItem.objects.filter(user=request.user, product_id=product_id).delete()
        if deleted:
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response({'error': 'Item not in wishlist.'}, status=status.HTTP_404_NOT_FOUND)


class WishlistCheckView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, product_id):
        exists = WishlistItem.objects.filter(user=request.user, product_id=product_id).exists()
        return Response({'wishlisted': exists})
