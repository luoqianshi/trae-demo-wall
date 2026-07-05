from django.db import models
from apps.user.models import User

class ShoppingCart(models.Model):
    """购物车表"""
    # 选中状态常量
    NOT_SELECTED = 0
    IS_SELECTED = 1
    
    SELECTED_CHOICES = (
        (NOT_SELECTED, '否'),
        (IS_SELECTED, '是'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='cart_items', verbose_name='关联用户')
    product = models.ForeignKey('product.Product', on_delete=models.CASCADE, related_name='cart_items', verbose_name='关联商品')
    quantity = models.IntegerField(default=1, verbose_name='商品数量')
    is_selected = models.SmallIntegerField(default=IS_SELECTED, choices=SELECTED_CHOICES, verbose_name='是否选中')
    create_time = models.DateTimeField(auto_now_add=True, verbose_name='添加时间')
    
    class Meta:
        db_table = 'shopping_cart'
        verbose_name = '购物车表'
        verbose_name_plural = verbose_name
        unique_together = ('user', 'product')

class Order(models.Model):
    """订单表"""
    # 支付方式常量
    PAYMENT_WECHAT = 1
    PAYMENT_CAMPUS_CARD = 2
    PAYMENT_ALIPAY = 3
    
    PAYMENT_METHOD_CHOICES = (
        (PAYMENT_WECHAT, '微信'),
        (PAYMENT_CAMPUS_CARD, '校园卡'),
        (PAYMENT_ALIPAY, '支付宝'),
    )
    
    # 支付状态常量
    PAYMENT_PENDING = 0
    PAYMENT_SUCCESS = 1
    PAYMENT_REFUNDED = 2
    
    PAYMENT_STATUS_CHOICES = (
        (PAYMENT_PENDING, '待支付'),
        (PAYMENT_SUCCESS, '支付成功'),
        (PAYMENT_REFUNDED, '已退款'),
    )
    
    order_no = models.CharField(max_length=50, unique=True, verbose_name='订单编号')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders', verbose_name='关联用户')
    original_price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='订单原价')
    actual_price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='实际支付价格')
    product_info = models.JSONField(verbose_name='购买商品信息')
    payment_method = models.SmallIntegerField(choices=PAYMENT_METHOD_CHOICES, verbose_name='支付方式')
    payment_status = models.SmallIntegerField(default=PAYMENT_PENDING, choices=PAYMENT_STATUS_CHOICES, verbose_name='支付状态')
    payment_time = models.DateTimeField(null=True, blank=True, verbose_name='支付时间')
    receive_time = models.DateTimeField(null=True, blank=True, verbose_name='收货时间')
    create_time = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    
    class Meta:
        db_table = 'order'
        verbose_name = '订单表'
        verbose_name_plural = verbose_name

class Logistics(models.Model):
    """物流信息表"""
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='logistics', verbose_name='关联订单')
    logistics_no = models.CharField(max_length=100, null=True, blank=True, verbose_name='物流单号')
    logistics_status = models.JSONField(null=True, blank=True, verbose_name='物流状态')
    create_time = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    arrive_time = models.DateTimeField(null=True, blank=True, verbose_name='送达时间')
    
    class Meta:
        db_table = 'logistics'
        verbose_name = '物流信息表'
        verbose_name_plural = verbose_name


class RefundApplication(models.Model):
    """退款申请表"""
    # 退款状态常量
    STATUS_PENDING = 0  # 待审核
    STATUS_APPROVED = 1  # 已通过
    STATUS_REJECTED = 2  # 已拒绝
    
    STATUS_CHOICES = (
        (STATUS_PENDING, '待审核'),
        (STATUS_APPROVED, '已通过'),
        (STATUS_REJECTED, '已拒绝'),
    )
    
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='refund_applications', verbose_name='关联订单')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='refund_applications', verbose_name='申请人')
    merchant = models.ForeignKey('merchant.Merchant', on_delete=models.CASCADE, related_name='refund_applications', verbose_name='关联商户')
    refund_amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='退款金额')
    reason = models.TextField(null=True, blank=True, verbose_name='退款原因')
    status = models.SmallIntegerField(default=STATUS_PENDING, choices=STATUS_CHOICES, verbose_name='审核状态')
    audit_remark = models.TextField(null=True, blank=True, verbose_name='审核备注')
    audit_time = models.DateTimeField(null=True, blank=True, verbose_name='审核时间')
    create_time = models.DateTimeField(auto_now_add=True, verbose_name='申请时间')
    
    class Meta:
        db_table = 'refund_application'
        verbose_name = '退款申请表'
        verbose_name_plural = verbose_name
        ordering = ['-create_time']
