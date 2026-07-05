from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin

class UserManager(BaseUserManager):
    def create_user(self, email, username, password=None, **extra_fields):
        if not email:
            raise ValueError('用户必须有邮箱地址')
        email = self.normalize_email(email)
        user = self.model(email=email, username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, username, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('user_type', 3)
        return self.create_user(email, username, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    """用户基础信息表"""
    # 用户类型常量
    USER_TYPE_STUDENT = 1
    USER_TYPE_MERCHANT = 2
    USER_TYPE_ADMIN = 3
    
    USER_TYPE_CHOICES = (
        (USER_TYPE_STUDENT, '学生'),
        (USER_TYPE_MERCHANT, '商户'),
        (USER_TYPE_ADMIN, '系统管理员'),
    )
    
    # 用户状态常量
    STATUS_DISABLED = 0
    STATUS_ENABLED = 1
    
    STATUS_CHOICES = (
        (STATUS_DISABLED, '封禁'),
        (STATUS_ENABLED, '启用'),
    )
    
    username = models.CharField(max_length=50, unique=True, verbose_name='用户名')
    email = models.EmailField(max_length=100, unique=True, verbose_name='邮箱')
    avatar = models.URLField(max_length=255, null=True, blank=True, verbose_name='头像图片链接')
    status = models.SmallIntegerField(default=STATUS_ENABLED, choices=STATUS_CHOICES, verbose_name='用户状态')
    user_type = models.SmallIntegerField(choices=USER_TYPE_CHOICES, verbose_name='用户类型', default=1)
    last_login_time = models.DateTimeField(null=True, blank=True, verbose_name='上次登录时间')
    register_time = models.DateTimeField(auto_now_add=True, verbose_name='注册时间')
    is_real_name = models.SmallIntegerField(default=0, choices=((0, '未实名'), (1, '已实名')), verbose_name='是否实名')
    balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, verbose_name='账户余额')

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        db_table = 'user'
        verbose_name = '用户基础信息表'
        verbose_name_plural = verbose_name


class RechargeRecord(models.Model):
    """充值记录表"""
    STATUS_PENDING = 'pending'
    STATUS_SUCCESS = 'success'
    STATUS_FAILED = 'failed'
    
    STATUS_CHOICES = (
        (STATUS_PENDING, '处理中'),
        (STATUS_SUCCESS, '成功'),
        (STATUS_FAILED, '失败'),
    )
    
    PAYMENT_ALIPAY = 'alipay'
    PAYMENT_WECHAT = 'wechat'
    
    PAYMENT_CHOICES = (
        (PAYMENT_ALIPAY, '支付宝'),
        (PAYMENT_WECHAT, '微信支付'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='用户')
    amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='充值金额')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_CHOICES, verbose_name='支付方式')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING, verbose_name='状态')
    trade_no = models.CharField(max_length=100, blank=True, verbose_name='交易号')
    remark = models.CharField(max_length=255, blank=True, verbose_name='备注')
    create_time = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    update_time = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    
    class Meta:
        db_table = 'recharge_record'
        verbose_name = '充值记录'
        verbose_name_plural = verbose_name
        ordering = ['-create_time']

class ContactMessage(models.Model):
    """联系管理员消息表"""
    STATUS_UNREAD = 0
    STATUS_READ = 1
    STATUS_REPLIED = 2
    
    STATUS_CHOICES = (
        (STATUS_UNREAD, '未读'),
        (STATUS_READ, '已读'),
        (STATUS_REPLIED, '已回复'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='用户')
    subject = models.CharField(max_length=200, verbose_name='主题')
    content = models.TextField(verbose_name='消息内容')
    status = models.SmallIntegerField(default=STATUS_UNREAD, choices=STATUS_CHOICES, verbose_name='状态')
    reply = models.TextField(null=True, blank=True, verbose_name='管理员回复')
    create_time = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    update_time = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    
    class Meta:
        db_table = 'contact_message'
        verbose_name = '联系管理员消息'
        verbose_name_plural = verbose_name
        ordering = ['-create_time']
