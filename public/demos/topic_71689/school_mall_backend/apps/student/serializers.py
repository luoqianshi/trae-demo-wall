from rest_framework import serializers
from .models import StudentInfo, StudentAddress
from apps.user.models import User

class StudentInfoSerializer(serializers.ModelSerializer):
    """学生信息序列化器"""
    class Meta:
        model = StudentInfo
        fields = ['id', 'student_name', 'student_no', 'school_name', 'department', 'grade', 'class_field', 'phone', 'student_card_image', 'is_certified', 'create_time']
        read_only_fields = ['id', 'create_time']

class StudentInfoCreateSerializer(serializers.ModelSerializer):
    """学生信息创建序列化器"""
    class Meta:
        model = StudentInfo
        fields = ['student_name', 'student_no', 'school_name', 'department', 'grade', 'class_field', 'phone', 'student_card_image']

class StudentInfoUpdateSerializer(serializers.ModelSerializer):
    """学生信息更新序列化器"""
    class Meta:
        model = StudentInfo
        fields = ['phone', 'department', 'grade', 'class_field']

class StudentInfoCertifySerializer(serializers.Serializer):
    """学生认证序列化器"""
    pass

class StudentAddressSerializer(serializers.ModelSerializer):
    """学生地址序列化器"""
    class Meta:
        model = StudentAddress
        fields = ['id', 'receiver', 'phone', 'address', 'is_default', 'create_time']
        read_only_fields = ['id', 'create_time']

class StudentAddressCreateSerializer(serializers.ModelSerializer):
    """学生地址创建序列化器"""
    class Meta:
        model = StudentAddress
        fields = ['receiver', 'phone', 'address', 'is_default']

class StudentAddressUpdateSerializer(serializers.ModelSerializer):
    """学生地址更新序列化器"""
    class Meta:
        model = StudentAddress
        fields = ['receiver', 'phone', 'address', 'is_default']