from rest_framework import serializers
from .models import Category, Product, ProductImage, Banner, Review


class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ('id', 'name', 'slug', 'description', 'image', 'product_count')

    def get_product_count(self, obj):
        return obj.products.filter(is_active=True).count()


class ProductImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ('id', 'image', 'alt_text', 'is_primary')

    def get_image(self, obj):
        # Prefer external_url (CDN, always available) over a local file.
        # Fall back to local file only if no external_url is set.
        if obj.external_url:
            return obj.external_url
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class ProductListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    main_image = ProductImageSerializer(read_only=True)
    is_in_stock = serializers.BooleanField(read_only=True)
    discount_percentage = serializers.IntegerField(read_only=True)
    avg_rating = serializers.FloatField(read_only=True)
    review_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Product
        fields = (
            'id', 'name', 'slug', 'price', 'compare_price',
            'category_name', 'main_image', 'is_in_stock',
            'discount_percentage', 'is_featured', 'stock',
            'avg_rating', 'review_count',
        )


class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = ('id', 'user_name', 'rating', 'title', 'body', 'created_at')
        read_only_fields = ('id', 'user_name', 'created_at')

    def get_user_name(self, obj):
        if obj.user:
            name = obj.user.get_full_name()
            return name if name else obj.user.email.split('@')[0]
        return 'Anonymous'


class ReviewCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ('rating', 'title', 'body')


class ProductDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    is_in_stock = serializers.BooleanField(read_only=True)
    discount_percentage = serializers.IntegerField(read_only=True)
    avg_rating = serializers.FloatField(read_only=True)
    review_count = serializers.IntegerField(read_only=True)
    user_has_purchased = serializers.SerializerMethodField()
    user_has_reviewed = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            'id', 'name', 'slug', 'description', 'price', 'compare_price',
            'stock', 'category', 'images', 'is_in_stock',
            'discount_percentage', 'is_featured', 'created_at',
            'avg_rating', 'review_count',
            'user_has_purchased', 'user_has_reviewed',
        )

    def get_user_has_purchased(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        from orders.models import Order
        return Order.objects.filter(
            user=request.user,
            is_paid=True,
            items__product=obj,
        ).exists()

    def get_user_has_reviewed(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.reviews.filter(user=request.user).exists()


class BannerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Banner
        fields = ('id', 'title', 'subtitle', 'image', 'link')
