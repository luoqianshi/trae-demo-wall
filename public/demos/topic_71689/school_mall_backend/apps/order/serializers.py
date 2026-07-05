from rest_framework import serializers
from .models import ShoppingCart, Order, Logistics
from apps.user.models import User
from apps.product.models import Product

class ShoppingCartSerializer(serializers.ModelSerializer):
    """购物车序列化器"""
    product = serializers.StringRelatedField()
    product_detail = serializers.SerializerMethodField()
    
    class Meta:
        model = ShoppingCart
        fields = ['id', 'product', 'product_detail', 'quantity', 'is_selected', 'create_time']
        read_only_fields = ['id', 'create_time']
    
    def get_product_detail(self, obj):
        """获取商品详细信息"""
        product = obj.product
        return {
            'id': product.id,
            'product_name': product.product_name,
            'product_images': product.product_images,
            'price': str(product.price),
            'remaining_stock': product.remaining_stock
        }

class ShoppingCartCreateSerializer(serializers.ModelSerializer):
    """购物车创建序列化器"""
    class Meta:
        model = ShoppingCart
        fields = ['product', 'quantity']

class ShoppingCartUpdateSerializer(serializers.ModelSerializer):
    """购物车更新序列化器"""
    class Meta:
        model = ShoppingCart
        fields = ['quantity', 'is_selected']

class ShoppingCartSelectSerializer(serializers.Serializer):
    """购物车商品选择序列化器"""
    cart_ids = serializers.ListField(child=serializers.IntegerField())
    is_selected = serializers.BooleanField()

class OrderSerializer(serializers.ModelSerializer):
    """订单序列化器"""
    user = serializers.StringRelatedField()
    logistics = serializers.StringRelatedField()
    
    class Meta:
        model = Order
        fields = ['id', 'order_no', 'user', 'original_price', 'actual_price', 'product_info', 'payment_method', 'payment_status', 'payment_time', 'receive_time', 'logistics', 'create_time']
        read_only_fields = ['id', 'order_no', 'create_time', 'payment_time', 'receive_time']

class OrderCreateSerializer(serializers.ModelSerializer):
    """订单创建序列化器"""
    class Meta:
        model = Order
        fields = ['product_info', 'payment_method', 'actual_price']
        read_only_fields = ['original_price', 'payment_status']

class OrderDetailSerializer(serializers.ModelSerializer):
    """订单详情序列化器"""
    user = serializers.StringRelatedField()
    
    class Meta:
        model = Order
        fields = ['id', 'order_no', 'user', 'original_price', 'actual_price', 'product_info', 'payment_method', 'payment_status', 'payment_time', 'receive_time', 'create_time']
        read_only_fields = ['id', 'order_no', 'create_time', 'payment_time', 'receive_time']

class OrderStatusSerializer(serializers.ModelSerializer):
    """订单状态更新序列化器"""
    class Meta:
        model = Order
        fields = ['payment_status']

class OrderPaymentSerializer(serializers.Serializer):
    """订单支付序列化器"""
    payment_method = serializers.IntegerField(required=True)
    order_id = serializers.IntegerField(required=True)

class LogisticsSerializer(serializers.ModelSerializer):
    """物流信息序列化器"""
    order = serializers.StringRelatedField()
    
    class Meta:
        model = Logistics
        fields = ['id', 'order', 'logistics_no', 'logistics_status', 'create_time', 'arrive_time']
        read_only_fields = ['id', 'create_time', 'arrive_time']

class LogisticsCreateSerializer(serializers.ModelSerializer):
    """物流信息创建序列化器"""
    class Meta:
        model = Logistics
        fields = ['logistics_no', 'logistics_status']

class LogisticsUpdateSerializer(serializers.ModelSerializer):
    """物流信息更新序列化器"""
    class Meta:
        model = Logistics
        fields = ['logistics_status']

class OrderListSerializer(serializers.ModelSerializer):
    """订单列表序列化器"""
    product_count = serializers.SerializerMethodField()
    product_info = serializers.SerializerMethodField()
    refund_status = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = ['id', 'order_no', 'original_price', 'actual_price', 'product_count', 'product_info', 'payment_method', 'payment_status', 'refund_status', 'create_time']
        read_only_fields = ['id', 'order_no', 'create_time']

    def get_product_count(self, obj):
        """获取订单商品数量"""
        product_info = obj.product_info
        return len(product_info) if isinstance(product_info, list) else 0

    def get_product_info(self, obj):
        """获取商品信息并补充图片"""
        product_info = obj.product_info
        if not isinstance(product_info, list):
            return []

        # 提取所有商品ID
        product_ids = [item.get('product_id') for item in product_info if item.get('product_id')]
        # 批量获取商品图片信息
        products = Product.objects.filter(id__in=product_ids)
        product_image_map = {p.id: p.product_images[0] if p.product_images else '' for p in products}

        # 补充图片到 product_info
        for item in product_info:
            p_id = item.get('product_id')
            if p_id in product_image_map and not item.get('product_image'):
                item['product_image'] = product_image_map[p_id]

        return product_info

    def get_refund_status(self, obj):
        """获取订单退款状态"""
        from .models import RefundApplication
        refund_app = RefundApplication.objects.filter(order=obj).order_by('-create_time').first()
        if refund_app:
            return refund_app.status
        return None