"""
用户模块数据模型
扩展Django内置User模型，添加角色字段
"""
from django.db import models
from django.contrib.auth.models import User


class UserProfile(models.Model):
    """
    用户扩展信息模型
    通过OneToOne关联Django内置User，添加角色等自定义字段
    """

    # 角色选择
    ROLE_CHOICES = [
        ('student', '学生'),
        ('teacher', '教师'),
        ('admin', '管理员'),
    ]

    # 关联Django内置User（一对一关系）
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='profile',
        verbose_name='关联用户'
    )

    # 用户角色（学生/教师）
    role = models.CharField(
        max_length=10,
        choices=ROLE_CHOICES,
        default='student',
        verbose_name='用户角色'
    )

    # 真实姓名（可选）
    real_name = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='真实姓名'
    )

    # 学号/工号（可选）
    student_id = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name='学号/工号'
    )

    # 创建时间
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='创建时间'
    )

    # 更新时间
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='更新时间'
    )

    class Meta:
        db_table = 'user_profile'
        verbose_name = '用户扩展信息'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} ({self.get_role_display()})"

    @property
    def is_teacher(self):
        """判断是否为教师"""
        return self.role == 'teacher'

    @property
    def is_student(self):
        """判断是否为学生"""
        return self.role == 'student'

    @property
    def is_admin(self):
        """判断是否为管理员"""
        return self.role == 'admin'

    def save(self, *args, **kwargs):
        """保存时自动同步User权限"""
        super().save(*args, **kwargs)

        # 根据角色设置User权限
        user = self.user
        if self.role == 'admin':
            user.is_staff = True
            user.is_superuser = True
        elif self.role == 'teacher':
            user.is_staff = True
            user.is_superuser = False
        else:  # student
            user.is_staff = False
            user.is_superuser = False
        user.save()
