"""
学生端页面视图
负责渲染学生端的HTML页面
"""
from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.http import Http404, JsonResponse
from django.views.decorators.http import require_http_methods
from apps.problems.models import Problem
from apps.submissions.models import Submission
from apps.diagnosis.models import DiagnosisRecord
from apps.teacher.models import Assignment, ClassStudent
import json


def login_page_view(request):
    """
    登录页面
    GET /login

    如果用户已登录，重定向到题目列表页
    """
    if request.user.is_authenticated:
        return redirect('/problems')

    return render(request, 'student/login.html')


@login_required
def problem_solve_view(request, problem_id):
    """
    题目作答页
    GET /problems/{problem_id}/solve

    展示题目详情和代码编辑器，学生可以编写和提交代码
    """
    problem = get_object_or_404(Problem, id=problem_id)

    context = {
        'problem': problem,
    }

    return render(request, 'student/solve.html', context)


@login_required
def submission_feedback_view(request, submission_id):
    """
    提交反馈页
    GET /submissions/{submission_id}/feedback

    展示提交结果、测试通过率、错误信息和诊断建议
    """
    submission = get_object_or_404(Submission, id=submission_id)

    # 权限检查：只能查看自己的提交
    if submission.student != request.user and not request.user.is_staff:
        raise Http404("提交不存在")

    # 获取最新的诊断记录（如果有）
    diagnosis = DiagnosisRecord.objects.filter(
        submission=submission
    ).order_by('-created_at').first()

    context = {
        'submission': submission,
        'diagnosis': diagnosis,
    }

    return render(request, 'student/feedback.html', context)


@login_required
def history_view(request):
    """
    历史记录页
    GET /history

    展示学生的所有提交历史，支持筛选和查看代码快照
    """
    return render(request, 'student/history.html')


@login_required
def problems_list_view(request):
    """
    题目列表页
    GET /problems

    展示所有可用的题目列表和作业列表
    """
    problems = Problem.objects.all().order_by('-created_at')

    context = {
        'problems': problems,
    }

    return render(request, 'student/problems_list.html', context)


@require_http_methods(["GET"])
@login_required
def student_assignments_api(request):
    """
    学生作业列表API
    GET /api/student/assignments

    返回学生所在班级的已发布作业
    """
    try:
        # 获取学生所在的班级
        student_classes = ClassStudent.objects.filter(
            student=request.user
        ).values_list('class_obj_id', flat=True)

        # 获取这些班级的已发布作业
        assignments = Assignment.objects.filter(
            class_obj_id__in=student_classes,
            is_published=True
        ).select_related('class_obj').prefetch_related('problems').order_by('-created_at')

        # 格式化数据
        assignments_data = []
        for assignment in assignments:
            assignments_data.append({
                'id': assignment.id,
                'title': assignment.title,
                'description': assignment.description,
                'class_name': assignment.class_obj.name,
                'problem_count': assignment.problem_count,
                'deadline': assignment.deadline.isoformat() if assignment.deadline else None,
                'is_overdue': assignment.is_overdue,
                'created_at': assignment.created_at.isoformat(),
                'problems': [
                    {
                        'id': p.id,
                        'title': p.title,
                        'difficulty': p.difficulty,
                        'difficulty_display': p.get_difficulty_display()
                    }
                    for p in assignment.problems.all()
                ]
            })

        return JsonResponse({
            'ok': True,
            'data': {
                'assignments': assignments_data,
                'total': len(assignments_data)
            }
        })

    except Exception as e:
        return JsonResponse({
            'ok': False,
            'error': str(e)
        }, status=500)
