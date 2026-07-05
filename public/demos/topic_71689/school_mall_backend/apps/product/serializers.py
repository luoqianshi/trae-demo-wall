from rest_framework import serializers
from .models import ProductCategory, Product, Collection, ProductReview
from apps.merchant.models import Merchant
from apps.merchant.serializers import MerchantSerializer

class ProductCategorySerializer(serializers.ModelSerializer):
    """商品分类序列化器"""
    children = serializers.SerializerMethodField()

    class Meta:
        model = ProductCategory
        fields = ['id', 'category_name', 'sort', 'status', 'parent', 'children']
        read_only_fields = ['id']

    def get_children(self, obj):
        if obj.children.exists():
            return ProductCategorySerializer(obj.children.all().order_by('-sort'), many=True).data
        return []

class ProductCategoryCreateSerializer(serializers.ModelSerializer):
    """商品分类创建序列化器"""
    class Meta:
        model = ProductCategory
        fields = ['category_name', 'sort', 'status']

class ProductCategoryUpdateSerializer(serializers.ModelSerializer):
    """商品分类更新序列化器"""
    class Meta:
        model = ProductCategory
        fields = ['category_name', 'sort', 'status']

class ProductSerializer(serializers.ModelSerializer):
    """商品序列化器"""
    merchant_name = serializers.CharField(source='merchant.merchant_name', read_only=True)
    merchant_id = serializers.IntegerField(source='merchant.id', read_only=True)
    category = serializers.StringRelatedField()
    
    class Meta:
        model = Product
        fields = ['id', 'merchant_id', 'merchant_name', 'category', 'product_name', 'product_desc', 'product_images', 'price', 'original_price', 'status', 'total_stock', 'remaining_stock', 'sales_count', 'view_count', 'collect_count', 'is_recommend', 'create_time']
        read_only_fields = ['id', 'sales_count', 'view_count', 'collect_count', 'create_time']

class ProductCreateSerializer(serializers.ModelSerializer):
    """商品创建序列化器"""
    class Meta:
        model = Product
        fields = ['category', 'product_name', 'product_desc', 'product_images', 'price', 'total_stock', 'remaining_stock', 'is_recommend']

class ProductUpdateSerializer(serializers.ModelSerializer):
    """商品更新序列化器"""
    class Meta:
        model = Product
        fields = ['category', 'product_desc', 'product_images', 'price', 'total_stock', 'remaining_stock', 'is_recommend', 'status']

class ProductListSerializer(serializers.ModelSerializer):
    """商品列表序列化器"""
    merchant_name = serializers.CharField(source='merchant.merchant_name', read_only=True)
    merchant_id = serializers.IntegerField(source='merchant.id', read_only=True)
    category = serializers.StringRelatedField()
    name = serializers.CharField(source='product_name')
    image = serializers.SerializerMethodField()
    tags = serializers.SerializerMethodField()
    originalPrice = serializers.DecimalField(source='original_price', max_digits=10, decimal_places=2, allow_null=True)
    
    class Meta:
        model = Product
        fields = ['id', 'merchant_id', 'merchant_name', 'category', 'name', 'product_images', 'image', 'price', 'originalPrice', 'tags', 'sales_count', 'view_count', 'status', 'is_recommend', 'create_time']
        read_only_fields = ['id', 'sales_count', 'view_count', 'create_time']

    def get_image(self, obj):
        if obj.product_images and isinstance(obj.product_images, list) and len(obj.product_images) > 0:
            return obj.product_images[0]
        # 返回一个默认图
        return 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&h=300&fit=crop'

    def get_tags(self, obj):
        tags = []
        if obj.is_recommend == 1:
            tags.append({'text': '推荐', 'type': 'red'})
        if obj.sales_count > 100:
            tags.append({'text': '热销', 'type': 'green'})
        if obj.status == 1:
            tags.append({'text': '正品', 'type': 'blue'})
        return tags

class ProductDetailSerializer(serializers.ModelSerializer):
    """商品详情序列化器"""
    merchant = MerchantSerializer()
    category = serializers.StringRelatedField()
    originalPrice = serializers.DecimalField(source='original_price', max_digits=10, decimal_places=2, allow_null=True)
    
    class Meta:
        model = Product
        fields = ['id', 'merchant', 'category', 'product_name', 'product_desc', 'product_images', 'price', 'originalPrice', 'status', 'total_stock', 'remaining_stock', 'sales_count', 'view_count', 'collect_count', 'is_recommend', 'create_time']
        read_only_fields = ['id', 'sales_count', 'view_count', 'collect_count', 'create_time']

class ProductReviewSerializer(serializers.ModelSerializer):
    """商品评价序列化器"""
    user_name = serializers.CharField(source='user.username', read_only=True)
    user_avatar = serializers.CharField(source='user.avatar', read_only=True)
    
    class Meta:
        model = ProductReview
        fields = ['id', 'product', 'user_name', 'user_avatar', 'content', 'rating', 'images', 'create_time']
        read_only_fields = ['id', 'product', 'create_time', 'user_name', 'user_avatar']

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("评分必须在1-5之间")
        return value

class CollectionSerializer(serializers.ModelSerializer):
    """商品收藏序列化器"""
    product = ProductListSerializer()
    
    class Meta:
        model = Collection
        fields = ['id', 'product', 'create_time']
        read_only_fields = ['id', 'create_time']

class CollectionCreateSerializer(serializers.ModelSerializer):
    """商品收藏创建序列化器"""
    class Meta:
        model = Collection
        fields = ['product']

class ProductStatusSerializer(serializers.ModelSerializer):
    """商品状态更新序列化器"""
    class Meta:
        model = Product
        fields = ['status']