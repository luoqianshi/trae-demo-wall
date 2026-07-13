"""
诊断模块路由配置
"""
from django.urls import path
from . import views

urlpatterns = [
    path('generate', views.generate_diagnosis_view, name='generate_diagnosis'),
    path('run', views.generate_diagnosis_view, name='generate_diagnosis_alias'),  # 兼容旧接口
    path('history', views.diagnosis_history_view, name='diagnosis_history'),

    # 异步诊断接口（第8阶段新增）
    path('async/generate', views.async_diagnosis_view, name='async_diagnosis'),
    path('async/status/<str:task_id>', views.async_task_status_view, name='async_task_status'),
]
