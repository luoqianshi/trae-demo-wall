from django.db import models
from apps.user.models import User

class Coupon(models.Model):
    """优惠券表"""
    # 优惠券类型常量
    TYPE_FULL_REDUCTION = 1
    TYPE_DISCOUNT = 2
    TYPE_NO_THRESHOLD = 3
    
    TYPE_CHOICES = (
        (TYPE_FULL_REDUCTION, '满减券'),
        (TYPE_DISCOUNT, '折扣券'),
        (TYPE_NO_THRESHOLD, '无门槛券'),
    )
    
    name = models.CharField(max_length=100, verbose_name='优惠券名称')
    type = models.SmallIntegerField(choices=TYPE_CHOICES, verbose_name='优惠券类型')
    condition = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='使用条件')
    value = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='优惠价值')
    start_time = models.DateTimeField(verbose_name='有效期开始时间')
    end_time = models.DateTimeField(verbose_name='有效期结束时间')
    create_time = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    
    class Meta:
        db_table = 'coupon'
        verbose_name = '优惠券表'
        verbose_name_plural = verbose_name

class UserCoupon(models.Model):
    """用户优惠券关联表"""
    # 状态常量
    STATUS_UNUSED = 1
    STATUS_USED = 2
    STATUS_EXPIRED = 3
    
    STATUS_CHOICES = (
        (STATUS_UNUSED, '未使用'),
        (STATUS_USED, '已使用'),
        (STATUS_EXPIRED, '已过期'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_coupons', verbose_name='关联用户')
    coupon = models.ForeignKey(Coupon, on_delete=models.CASCADE, related_name='user_coupons', verbose_name='关联优惠券')
    status = models.SmallIntegerField(default=STATUS_UNUSED, choices=STATUS_CHOICES, verbose_name='状态')
    order = models.ForeignKey('order.Order', on_delete=models.SET_NULL, null=True, blank=True, related_name='user_coupons', verbose_name='使用关联的订单')
    get_time = models.DateTimeField(auto_now_add=True, verbose_name='获取时间')
    use_time = models.DateTimeField(null=True, blank=True, verbose_name='使用时间')
    
    class Meta:
        db_table = 'user_coupon'
        verbose_name = '用户优惠券关联表'
        verbose_name_plural = verbose_name
