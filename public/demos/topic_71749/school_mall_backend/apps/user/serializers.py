from rest_framework import serializers
from .models import User, ContactMessage
from django.contrib.auth.hashers import make_password
from apps.student.models import StudentInfo
from apps.merchant.models import Merchant

class StudentInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentInfo
        fields = ['student_name', 'student_no', 'school_name', 'department', 'grade', 'class_field', 'phone', 'student_card_image', 'is_certified']

class MerchantInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Merchant
        fields = ['merchant_name', 'merchant_logo', 'contact_name', 'contact_phone', 'merchant_address', 'merchant_desc', 'status']

class UserSerializer(serializers.ModelSerializer):
    """用户序列化器"""
    student_info = StudentInfoSerializer(read_only=True)
    merchant_info = MerchantInfoSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'avatar', 'status', 'user_type', 'is_real_name', 'is_staff', 'balance', 'last_login_time', 'register_time', 'student_info', 'merchant_info']
        read_only_fields = ['id', 'last_login_time', 'register_time', 'is_real_name', 'balance', 'is_staff']

class UserRegisterSerializer(serializers.ModelSerializer):
    """用户注册序列化器"""
    class Meta:
        model = User
        fields = ['username', 'password', 'email', 'user_type']
        extra_kwargs = {
            'password': {'write_only': True},
            'email': {'required': True}
        }
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("该邮箱已被注册")
        return value

    def create(self, validated_data):
        # 密码加密
        validated_data['password'] = make_password(validated_data['password'])
        return super().create(validated_data)

class UserLoginSerializer(serializers.Serializer):
    """用户登录序列化器"""
    email = serializers.EmailField(max_length=100, required=True)
    password = serializers.CharField(max_length=100, required=True, write_only=True)

class UserUpdateSerializer(serializers.ModelSerializer):
    """用户信息更新序列化器"""
    class Meta:
        model = User
        fields = ['username', 'email', 'avatar']
        extra_kwargs = {
            'username': {'required': False},
            'email': {'required': False},
            'avatar': {'required': False},
        }

class UserPasswordSerializer(serializers.Serializer):
    """用户密码修改序列化器"""
    old_password = serializers.CharField(max_length=100, required=True, write_only=True)
    new_password = serializers.CharField(max_length=100, required=True, write_only=True)

class ContactMessageSerializer(serializers.ModelSerializer):
    """联系管理员消息序列化器"""
    username = serializers.CharField(source='user.username', read_only=True)
    user_type = serializers.IntegerField(source='user.user_type', read_only=True)
    
    class Meta:
        model = ContactMessage
        fields = ['id', 'user', 'username', 'user_type', 'subject', 'content', 'status', 'reply', 'create_time', 'update_time']
        read_only_fields = ['id', 'user', 'status', 'reply', 'create_time', 'update_time']