from django.db import models
from apps.user.models import User

class StudentInfo(models.Model):
    """学生详细信息表"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_info', verbose_name='关联用户')
    student_name = models.CharField(max_length=50, verbose_name='学生真实姓名')
    student_no = models.CharField(max_length=20, unique=True, verbose_name='学号')
    school_name = models.CharField(max_length=100, verbose_name='学校名称')
    department = models.CharField(max_length=100, verbose_name='院系')
    grade = models.CharField(max_length=20, verbose_name='年级')
    class_field = models.CharField(max_length=20, db_column='class', verbose_name='班级')
    phone = models.CharField(max_length=20, null=True, blank=True, verbose_name='联系电话')
    student_card_image = models.URLField(max_length=255, null=True, blank=True, verbose_name='学生证照片链接')
    is_certified = models.SmallIntegerField(default=0, choices=((0, '未认证'), (1, '已认证')), verbose_name='是否认证')
    create_time = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    
    class Meta:
        db_table = 'student_info'
        verbose_name = '学生详细信息表'
        verbose_name_plural = verbose_name

class StudentAddress(models.Model):
    """学生收货地址表"""
    # 默认地址常量
    NOT_DEFAULT = 0
    IS_DEFAULT = 1
    
    DEFAULT_CHOICES = (
        (NOT_DEFAULT, '否'),
        (IS_DEFAULT, '是'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='addresses', verbose_name='关联用户')
    receiver = models.CharField(max_length=50, verbose_name='收货人姓名')
    phone = models.CharField(max_length=20, verbose_name='收货人电话')
    address = models.CharField(max_length=255, verbose_name='详细地址')
    is_default = models.SmallIntegerField(default=NOT_DEFAULT, choices=DEFAULT_CHOICES, verbose_name='是否默认地址')
    create_time = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    
    class Meta:
        db_table = 'student_address'
        verbose_name = '学生收货地址表'
        verbose_name_plural = verbose_name
