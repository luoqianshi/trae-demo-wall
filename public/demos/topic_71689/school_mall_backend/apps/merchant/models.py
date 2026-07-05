from django.db import models
from apps.user.models import User

class Merchant(models.Model):
    """商户信息表"""
    # 商户状态常量
    STATUS_PENDING = 0
    STATUS_APPROVED = 1
    STATUS_REJECTED = 2
    
    STATUS_CHOICES = (
        (STATUS_PENDING, '待审核'),
        (STATUS_APPROVED, '审核通过'),
        (STATUS_REJECTED, '未通过'),
    )
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='merchant_info', verbose_name='关联用户')
    merchant_name = models.CharField(max_length=100, verbose_name='商户名称')
    merchant_logo = models.URLField(max_length=255, null=True, blank=True, verbose_name='商户Logo链接')
    contact_name = models.CharField(max_length=50, verbose_name='联系人姓名')
    contact_phone = models.CharField(max_length=20, verbose_name='联系人电话')
    merchant_address = models.CharField(max_length=255, verbose_name='商户地址')
    merchant_desc = models.TextField(null=True, blank=True, verbose_name='商户描述')
    status = models.SmallIntegerField(default=STATUS_PENDING, choices=STATUS_CHOICES, verbose_name='商户状态')
    audit_time = models.DateTimeField(null=True, blank=True, verbose_name='审核时间')
    create_time = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    
    class Meta:
        db_table = 'merchant'
        verbose_name = '商户信息表'
        verbose_name_plural = verbose_name
