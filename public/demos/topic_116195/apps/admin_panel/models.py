"""
管理员端模型
"""
from django.db import models


class SystemConfig(models.Model):
    """系统配置模型"""

    # 配置键
    key = models.CharField(
        max_length=100,
        unique=True,
        verbose_name='配置键'
    )

    # 配置值
    value = models.TextField(
        verbose_name='配置值'
    )

    # 配置描述
    description = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='描述'
    )

    # 更新时间
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='更新时间'
    )

    class Meta:
        db_table = 'system_config'
        verbose_name = '系统配置'
        verbose_name_plural = verbose_name
        ordering = ['key']

    def __str__(self):
        return f"{self.key}: {self.value}"

    @classmethod
    def get_value(cls, key, default=''):
        """获取配置值"""
        try:
            return cls.objects.get(key=key).value
        except cls.DoesNotExist:
            return default

    @classmethod
    def set_value(cls, key, value, description=''):
        """设置配置值"""
        obj, created = cls.objects.update_or_create(
            key=key,
            defaults={'value': value, 'description': description}
        )
        return obj

