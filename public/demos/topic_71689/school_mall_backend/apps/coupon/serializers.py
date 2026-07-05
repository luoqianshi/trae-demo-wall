from rest_framework import serializers
from .models import Coupon, UserCoupon
from apps.user.models import User

class CouponSerializer(serializers.ModelSerializer):
    """优惠券序列化器"""
    class Meta:
        model = Coupon
        fields = ['id', 'name', 'type', 'condition', 'value', 'start_time', 'end_time', 'create_time']

class CouponCreateSerializer(serializers.ModelSerializer):
    """创建优惠券序列化器"""
    class Meta:
        model = Coupon
        fields = ['name', 'type', 'condition', 'value', 'start_time', 'end_time']

class UserCouponSerializer(serializers.ModelSerializer):
    """用户优惠券序列化器"""
    coupon_name = serializers.SerializerMethodField()
    coupon_type = serializers.SerializerMethodField()
    coupon_value = serializers.SerializerMethodField()
    coupon_condition = serializers.SerializerMethodField()
    coupon_start_time = serializers.SerializerMethodField()
    coupon_end_time = serializers.SerializerMethodField()
    user_name = serializers.SerializerMethodField()
    order_no = serializers.SerializerMethodField()
    
    class Meta:
        model = UserCoupon
        fields = ['id', 'user', 'user_name', 'coupon', 'coupon_name', 'coupon_type', 'coupon_value', 
                 'coupon_condition', 'coupon_start_time', 'coupon_end_time', 'status', 'order', 'order_no', 
                 'get_time', 'use_time']
    
    def get_coupon_name(self, obj):
        return obj.coupon.name
    
    def get_coupon_type(self, obj):
        return obj.coupon.type
    
    def get_coupon_value(self, obj):
        return obj.coupon.value
    
    def get_coupon_condition(self, obj):
        return obj.coupon.condition
    
    def get_coupon_start_time(self, obj):
        return obj.coupon.start_time
    
    def get_coupon_end_time(self, obj):
        return obj.coupon.end_time
    
    def get_user_name(self, obj):
        return obj.user.username
    
    def get_order_no(self, obj):
        return obj.order.order_no if obj.order else None

class UserCouponCreateSerializer(serializers.Serializer):
    """创建用户优惠券关联序列化器"""
    coupon_id = serializers.IntegerField(write_only=True)
    user_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        fields = ['coupon_id', 'user_id']
    
    def validate(self, attrs):
        # 验证优惠券是否存在
        coupon_id = attrs.get('coupon_id')
        if not Coupon.objects.filter(id=coupon_id).exists():
            raise serializers.ValidationError({'coupon_id': '优惠券不存在'})
        
        # 验证用户是否存在
        user_id = attrs.get('user_id')
        if not User.objects.filter(id=user_id).exists():
            raise serializers.ValidationError({'user_id': '用户不存在'})
        
        return attrs

class UserCouponUseSerializer(serializers.ModelSerializer):
    """使用优惠券序列化器"""
    class Meta:
        model = UserCoupon
        fields = ['order']
