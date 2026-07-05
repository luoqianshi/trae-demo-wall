from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer
from apps.merchant.models import Merchant

class ConversationViewSet(viewsets.ModelViewSet):
    """会话管理视图集"""
    queryset = Conversation.objects.all()
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """根据登录用户类型返回不同的会话列表"""
        user = self.request.user
        if hasattr(user, 'merchant'):
            # 商户视角：返回该商户的所有会话
            return Conversation.objects.filter(merchant=user.merchant).order_by('-last_message_time')
        else:
            # 用户视角：返回该用户的所有会话
            return Conversation.objects.filter(user=user).order_by('-last_message_time')
    
    def create(self, request, *args, **kwargs):
        """创建会话（如果不存在则创建，存在则返回）"""
        user = request.user
        merchant_id = request.data.get('merchant_id')
        
        if not merchant_id:
            return Response({'detail': '商户ID不能为空'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            merchant = Merchant.objects.get(id=merchant_id)
        except Merchant.DoesNotExist:
            return Response({'detail': '商户不存在'}, status=status.HTTP_404_NOT_FOUND)
        
        # 检查会话是否已存在
        conversation, created = Conversation.objects.get_or_create(
            user=user,
            merchant=merchant
        )
        
        serializer = self.get_serializer(conversation, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
    
    @action(detail=True, methods=['get'], url_path='messages')
    def list_messages(self, request, pk=None):
        """获取会话的消息列表"""
        try:
            conversation = self.get_object()
        except Conversation.DoesNotExist:
            return Response({'detail': '会话不存在'}, status=status.HTTP_404_NOT_FOUND)
        
        # 标记消息为已读
        messages = conversation.messages.filter(receiver=request.user, status=Message.STATUS_UNREAD)
        if messages.exists():
            messages.update(status=Message.STATUS_READ)
        
        # 获取消息列表，按时间倒序
        messages = conversation.messages.order_by('create_time')
        serializer = MessageSerializer(messages, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], url_path='send-message')
    def send_message(self, request, pk=None):
        """发送消息"""
        try:
            conversation = self.get_object()
        except Conversation.DoesNotExist:
            return Response({'detail': '会话不存在'}, status=status.HTTP_404_NOT_FOUND)
        
        content = request.data.get('content')
        message_type = request.data.get('message_type', Message.MESSAGE_TYPE_TEXT)
        
        if not content:
            return Response({'detail': '消息内容不能为空'}, status=status.HTTP_400_BAD_REQUEST)
        
        # 确定接收者
        sender = request.user
        if hasattr(sender, 'merchant_info'):
            # 商户发送消息给用户
            receiver = conversation.user
        else:
            # 用户发送消息给商户
            receiver = conversation.merchant.user
        
        # 创建消息
        message = Message.objects.create(
            conversation=conversation,
            sender=sender,
            receiver=receiver,
            content=content,
            message_type=message_type
        )
        
        # 更新会话的最后一条消息
        conversation.last_message = content
        conversation.save()
        
        serializer = MessageSerializer(message, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'], url_path='mark-read')
    def mark_read(self, request, pk=None):
        """标记会话消息为已读"""
        try:
            conversation = self.get_object()
        except Conversation.DoesNotExist:
            return Response({'detail': '会话不存在'}, status=status.HTTP_404_NOT_FOUND)
        
        # 标记消息为已读
        messages = conversation.messages.filter(receiver=request.user, status=Message.STATUS_UNREAD)
        messages.update(status=Message.STATUS_READ)
        
        return Response({'detail': '已标记为已读'}, status=status.HTTP_200_OK)

class MessageViewSet(viewsets.ModelViewSet):
    """消息管理视图集"""
    queryset = Message.objects.all()
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """只能查看自己发送或接收的消息"""
        user = self.request.user
        return Message.objects.filter(Q(sender=user) | Q(receiver=user)).order_by('-create_time')
