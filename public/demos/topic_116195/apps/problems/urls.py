"""
题目管理模块路由配置
"""
from django.urls import path
from . import views

urlpatterns = [
    path('', views.problem_list_create_view, name='problem_list_create'),
    path('<int:problem_id>', views.problem_detail_view, name='problem_detail'),
]
