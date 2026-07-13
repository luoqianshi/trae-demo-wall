"""
通用功能URL路由配置
"""
from django.urls import path
from . import views

urlpatterns = [
    # 监控指标接口
    path('metrics', views.metrics_view, name='common_metrics'),

    # 健康检查接口
    path('health', views.health_check_view, name='common_health'),
]
