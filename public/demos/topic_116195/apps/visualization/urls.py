"""
可视化反馈模块 URL 路由配置
"""
from django.urls import path
from . import views

app_name = 'visualization'

urlpatterns = [
    # 获取单个提交的可视化反馈
    path(
        'submissions/<int:submission_id>/visual-feedback',
        views.get_visual_feedback,
        name='get_visual_feedback'
    ),

    # 批量获取可视化反馈（教师端）
    path(
        'visual-feedback/batch',
        views.get_visual_feedback_batch,
        name='get_visual_feedback_batch'
    ),

    # 获取协议版本信息
    path(
        'visual-feedback/protocol-version',
        views.get_protocol_version,
        name='get_protocol_version'
    ),

    # 重新生成可视化反馈（教师端）
    path(
        'submissions/<int:submission_id>/visual-feedback/regenerate',
        views.regenerate_visual_feedback,
        name='regenerate_visual_feedback'
    ),
]
