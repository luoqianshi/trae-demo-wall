"""
提交与评测模块路由配置
"""
from django.urls import path
from . import views
from apps.diagnosis import views as diagnosis_views

urlpatterns = [
    path('quick-run', views.quick_run_view, name='quick_run'),
    path('run', views.run_submission_view, name='run_submission'),
    path('mine', views.my_submissions_view, name='my_submissions'),
    path('<int:submission_id>', views.submission_detail_view, name='submission_detail'),
    path('<int:submission_id>/diagnosis', diagnosis_views.submission_diagnosis_view, name='submission_diagnosis'),
]
