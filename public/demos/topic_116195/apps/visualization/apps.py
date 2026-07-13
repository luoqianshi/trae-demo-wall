"""
可视化反馈应用配置
"""
from django.apps import AppConfig


class VisualizationConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.visualization'
    verbose_name = '可视化反馈'

    def ready(self):
        """应用启动时的初始化逻辑"""
        pass
