from rest_framework import serializers
from .models import Conversation, Message
from apps.user.models import User
from apps.merchant.models import Merchant

class UserSerializer(serializers.ModelSerializer):
    """用户序列化器"""
    class Meta:
        model = User
        fields = ['id', 'username', 'avatar']

class MerchantSerializer(serializers.ModelSerializer):
    """商户序列化器"""
    class Meta:
        model = Merchant
        fields = ['id', 'merchant_name', 'merchant_logo']

class ConversationSerializer(serializers.ModelSerializer):
    """会话序列化器"""
    user = UserSerializer(read_only=True)
    merchant = MerchantSerializer(read_only=True)
    unread_count = serializers.SerializerMethodField()
    
    def get_unread_count(self, obj):
        """获取未读消息数量"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return 0
        # 根据当前登录用户类型返回对应的未读消息数量
        if hasattr(request.user, 'merchant_info'):
            # 商户视角：获取用户发送的未读消息
            return obj.messages.filter(sender__user_type=User.USER_TYPE_STUDENT, status=Message.STATUS_UNREAD).count()
        else:
            # 用户视角：获取商户发送的未读消息
            return obj.messages.filter(sender__user_type=User.USER_TYPE_MERCHANT, status=Message.STATUS_UNREAD).count()
    
    class Meta:
        model = Conversation
        fields = ['id', 'user', 'merchant', 'last_message', 'last_message_time', 'status', 'create_time', 'unread_count']
        read_only_fields = ['id', 'last_message', 'last_message_time', 'create_time']

class MessageSerializer(serializers.ModelSerializer):
    """消息序列化器"""
    sender = UserSerializer(read_only=True)
    receiver = UserSerializer(read_only=True)
    
    class Meta:
        model = Message
        fields = ['id', 'conversation', 'sender', 'receiver', 'content', 'message_type', 'status', 'create_time']
        read_only_fields = ['id', 'sender', 'receiver', 'create_time']
