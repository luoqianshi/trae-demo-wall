"""
学生端URL路由配置
"""
from django.urls import path
from django.shortcuts import redirect
from . import views


def root_redirect(request):
    """根路径重定向到登录页"""
    return redirect('/login')


urlpatterns = [
    # 根路径重定向
    path('', root_redirect, name='root'),

    # 登录页面
    path('login', views.login_page_view, name='login_page'),

    # 题目列表页
    path('problems', views.problems_list_view, name='problems_list'),

    # 题目作答页
    path('problems/<int:problem_id>/solve', views.problem_solve_view, name='problem_solve'),

    # 提交反馈页
    path('submissions/<int:submission_id>/feedback', views.submission_feedback_view, name='submission_feedback'),

    # 历史记录页
    path('history', views.history_view, name='history'),

    # 学生作业列表API
    path('api/student/assignments', views.student_assignments_api, name='student_assignments_api'),
]
