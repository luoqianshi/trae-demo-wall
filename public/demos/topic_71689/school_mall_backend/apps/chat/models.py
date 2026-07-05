from django.db import models
from apps.user.models import User

class Conversation(models.Model):
    """会话表"""
    # 状态常量
    STATUS_CLOSED = 0
    STATUS_NORMAL = 1
    
    STATUS_CHOICES = (
        (STATUS_CLOSED, '已关闭'),
        (STATUS_NORMAL, '正常'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='conversations', verbose_name='关联用户')
    merchant = models.ForeignKey('merchant.Merchant', on_delete=models.CASCADE, related_name='conversations', verbose_name='关联商户')
    last_message = models.CharField(max_length=255, null=True, blank=True, verbose_name='最后一条消息内容')
    last_message_time = models.DateTimeField(auto_now=True, verbose_name='最后一条消息时间')
    status = models.SmallIntegerField(default=STATUS_NORMAL, choices=STATUS_CHOICES, verbose_name='状态')
    create_time = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    
    class Meta:
        db_table = 'conversation'
        verbose_name = '会话表'
        verbose_name_plural = verbose_name
        unique_together = ('user', 'merchant')

class Message(models.Model):
    """消息表"""
    # 消息类型常量
    MESSAGE_TYPE_TEXT = 1
    MESSAGE_TYPE_IMAGE = 2
    
    MESSAGE_TYPE_CHOICES = (
        (MESSAGE_TYPE_TEXT, '文本'),
        (MESSAGE_TYPE_IMAGE, '图片'),
    )
    
    # 状态常量
    STATUS_UNREAD = 1
    STATUS_READ = 2
    
    STATUS_CHOICES = (
        (STATUS_UNREAD, '未读'),
        (STATUS_READ, '已读'),
    )
    
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages', verbose_name='关联会话')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages', verbose_name='发送者')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages', verbose_name='接收者')
    content = models.TextField(verbose_name='消息内容')
    message_type = models.SmallIntegerField(default=MESSAGE_TYPE_TEXT, choices=MESSAGE_TYPE_CHOICES, verbose_name='消息类型')
    status = models.SmallIntegerField(default=STATUS_UNREAD, choices=STATUS_CHOICES, verbose_name='状态')
    create_time = models.DateTimeField(auto_now_add=True, verbose_name='发送时间')
    
    class Meta:
        db_table = 'message'
        verbose_name = '消息表'
        verbose_name_plural = verbose_name
