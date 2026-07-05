from rest_framework import serializers
from .models import Merchant
from apps.user.models import User

class MerchantSerializer(serializers.ModelSerializer):
    """商户序列化器"""
    class Meta:
        model = Merchant
        fields = ['id', 'merchant_name', 'merchant_logo', 'contact_name', 'contact_phone', 'merchant_address', 'merchant_desc', 'status', 'audit_time', 'create_time']
        read_only_fields = ['id', 'audit_time', 'create_time']

class MerchantCreateSerializer(serializers.ModelSerializer):
    """商户创建序列化器"""
    class Meta:
        model = Merchant
        fields = ['merchant_name', 'merchant_logo', 'contact_name', 'contact_phone', 'merchant_address', 'merchant_desc']

class MerchantUpdateSerializer(serializers.ModelSerializer):
    """商户更新序列化器"""
    class Meta:
        model = Merchant
        fields = ['merchant_logo', 'contact_phone', 'merchant_address', 'merchant_desc']

class MerchantStatusSerializer(serializers.ModelSerializer):
    """商户状态更新序列化器"""
    class Meta:
        model = Merchant
        fields = ['status']

class MerchantInfoSerializer(serializers.ModelSerializer):
    """商户信息序列化器（用于列表展示）"""
    class Meta:
        model = Merchant
        fields = ['id', 'merchant_name', 'merchant_logo', 'contact_name', 'contact_phone', 'merchant_address', 'status', 'create_time']
        read_only_fields = ['id', 'create_time']