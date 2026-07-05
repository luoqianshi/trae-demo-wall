from django.db import models
from apps.merchant.models import Merchant

class ProductCategory(models.Model):
    """商品分类表"""
    # 状态常量
    STATUS_DISABLED = 0
    STATUS_ENABLED = 1
    
    STATUS_CHOICES = (
        (STATUS_DISABLED, '禁用'),
        (STATUS_ENABLED, '启用'),
    )
    
    category_name = models.CharField(max_length=50, verbose_name='分类名称')
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='children', verbose_name='父级分类')
    sort = models.IntegerField(default=0, verbose_name='排序')
    status = models.SmallIntegerField(default=STATUS_ENABLED, choices=STATUS_CHOICES, verbose_name='状态')
    
    class Meta:
        db_table = 'product_category'
        verbose_name = '商品分类表'
        verbose_name_plural = verbose_name

    def __str__(self):
        return self.category_name

class Product(models.Model):
    """商品表"""
    # 状态常量
    STATUS_OFF = 0
    STATUS_ON = 1
    
    STATUS_CHOICES = (
        (STATUS_OFF, '下架'),
        (STATUS_ON, '上架'),
    )
    
    # 推荐常量
    NOT_RECOMMEND = 0
    IS_RECOMMEND = 1
    
    RECOMMEND_CHOICES = (
        (NOT_RECOMMEND, '否'),
        (IS_RECOMMEND, '是'),
    )
    
    merchant = models.ForeignKey(Merchant, on_delete=models.CASCADE, related_name='products', verbose_name='关联商户')
    category = models.ForeignKey(ProductCategory, on_delete=models.CASCADE, related_name='products', verbose_name='关联分类')
    product_name = models.CharField(max_length=100, verbose_name='商品名称')
    product_desc = models.TextField(null=True, blank=True, verbose_name='商品描述')
    product_images = models.JSONField(null=True, blank=True, verbose_name='商品图片')
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='商品售价')
    original_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name='商品原价')
    status = models.SmallIntegerField(default=STATUS_ON, choices=STATUS_CHOICES, verbose_name='状态')
    total_stock = models.IntegerField(default=0, verbose_name='总库存数量')
    remaining_stock = models.IntegerField(default=0, verbose_name='剩余库存数量')
    sales_count = models.IntegerField(default=0, verbose_name='销量')
    view_count = models.IntegerField(default=0, verbose_name='浏览量')
    collect_count = models.IntegerField(default=0, verbose_name='收藏量')
    is_recommend = models.SmallIntegerField(default=NOT_RECOMMEND, choices=RECOMMEND_CHOICES, verbose_name='是否推荐')
    create_time = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    
    class Meta:
        db_table = 'product'
        verbose_name = '商品表'
        verbose_name_plural = verbose_name

class Collection(models.Model):
    """商品收藏表"""
    user = models.ForeignKey('user.User', on_delete=models.CASCADE, related_name='collections', verbose_name='关联用户')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='collections', verbose_name='关联商品')
    create_time = models.DateTimeField(auto_now_add=True, verbose_name='收藏时间')
    
    class Meta:
        db_table = 'collection'
        verbose_name = '商品收藏表'
        verbose_name_plural = verbose_name
        unique_together = ('user', 'product')

class ProductReview(models.Model):
    """商品评价表"""
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews', verbose_name='关联商品')
    user = models.ForeignKey('user.User', on_delete=models.CASCADE, related_name='reviews', verbose_name='关联用户')
    content = models.TextField(verbose_name='评价内容')
    rating = models.IntegerField(default=5, verbose_name='评分(1-5)')
    images = models.JSONField(null=True, blank=True, verbose_name='评价图片')
    create_time = models.DateTimeField(auto_now_add=True, verbose_name='评价时间')

    class Meta:
        db_table = 'product_review'
        verbose_name = '商品评价表'
        verbose_name_plural = verbose_name
        ordering = ['-create_time']
