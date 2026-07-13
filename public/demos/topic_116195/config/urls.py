"""
项目主路由配置
将所有API路由统一挂载到/api前缀下
"""
from django.urls import path, include
from django.http import JsonResponse, HttpResponse
from django.shortcuts import redirect
from .admin import admin_site


def health_check(request):
    """健康检查接口"""
    return JsonResponse({
        'ok': True,
        'message': '服务运行正常',
        'version': '1.0.0'
    })


def favicon_view(request):
    """返回空的favicon，避免404警告"""
    return HttpResponse(status=204)


def root_redirect(request):
    """根路径重定向到登录页"""
    return redirect('/login')


urlpatterns = [
    # Django管理后台
    path('admin/', admin_site.urls),

    # Favicon处理
    path('favicon.ico', favicon_view, name='favicon'),

    # 健康检查接口
    path('api/health', health_check, name='health_check'),

    # 用户认证模块
    path('api/auth/', include('apps.users.urls')),

    # 题目管理模块
    path('api/problems/', include('apps.problems.urls')),

    # 提交与评测模块
    path('api/submissions/', include('apps.submissions.urls')),

    # 诊断模块
    path('api/diagnosis/', include('apps.diagnosis.urls')),

    # 教师端路由（包含页面和API）
    path('teacher/', include('apps.teacher.urls')),

    # 通用功能模块（监控、健康检查）
    path('api/common/', include('apps.common.urls')),

    # 学生端页面路由
    path('', include('apps.students.urls')),
]
