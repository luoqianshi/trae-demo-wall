"""
教师端URL路由配置
"""
from django.urls import path
from . import views

urlpatterns = [
    # ========== 页面路由 ==========
    path('dashboard', views.teacher_dashboard_view, name='teacher_dashboard'),
    path('students/<int:student_id>/submissions', views.student_submissions_view, name='student_submissions'),
    path('students', views.teacher_students_view, name='teacher_students'),
    path('insights', views.teacher_insights_view, name='teacher_insights'),
    path('problems/create', views.teacher_create_problem_view, name='teacher_create_problem_page'),
    path('problems', views.teacher_problems_view, name='teacher_problems_page'),
    path('assignments/create', views.teacher_create_assignment_view, name='teacher_create_assignment_page'),
    path('assignments', views.teacher_assignments_view, name='teacher_assignments_page'),
    path('submissions/<int:submission_id>/feedback', views.teacher_feedback_view, name='teacher_feedback'),
    path('submissions/<int:submission_id>/review', views.submission_review_view, name='submission_review'),

    # ========== API接口 ==========
    # 统计分析
    path('api/stats/overview', views.overview_statistics_view, name='teacher_stats_overview'),
    path('api/stats/trend', views.trend_statistics_view, name='teacher_stats_trend'),
    path('api/stats/problems', views.problem_statistics_view, name='teacher_stats_problems'),
    path('api/stats/students', views.student_statistics_view, name='teacher_stats_students'),

    # 错误洞察
    path('api/insights/errors', views.error_insights_view, name='teacher_insights_errors'),
    path('api/insights/diagnosis', views.diagnosis_insights_view, name='teacher_insights_diagnosis'),

    # 报表导出
    path('api/export/report', views.export_report_view, name='teacher_export_report'),

    # 作业管理API
    path('api/assignments/create', views.create_assignment_view, name='create_assignment'),
    path('api/assignments/assign-problem', views.assign_problem_to_classes_view, name='assign_problem'),
    path('api/assignments/<int:assignment_id>/update', views.update_assignment_view, name='update_assignment'),
    path('api/assignments/<int:assignment_id>/delete', views.delete_assignment_view, name='delete_assignment'),
    path('api/assignments/<int:assignment_id>', views.assignment_detail_view, name='assignment_detail'),
    path('api/assignments', views.list_assignments_view, name='list_assignments'),

    # 题目管理API
    path('api/problems/create', views.create_problem_view, name='create_teacher_problem'),
    path('api/problems', views.list_teacher_problems_view, name='list_teacher_problems'),

    # 班级管理API
    path('api/classes', views.list_classes_view, name='list_classes'),

    # 提交评分API
    path('api/submissions/<int:submission_id>/review', views.save_submission_review, name='save_submission_review'),
    path('api/submissions', views.teacher_submissions_view, name='teacher_submissions'),
]
