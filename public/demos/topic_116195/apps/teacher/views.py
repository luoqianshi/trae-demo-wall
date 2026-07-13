"""
教师端视图函数
提供统计分析、错误洞察、学生追踪等功能
"""
import json
import csv
import logging
from datetime import datetime, timedelta
from django.http import HttpResponse, JsonResponse
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from django.shortcuts import render, get_object_or_404
from django.db.models import Q
from apps.common.utils import success_response, error_response
from apps.submissions.models import Submission
from apps.diagnosis.models import DiagnosisRecord
from apps.problems.models import Problem
from .services import TeacherStatisticsService
from .models import Assignment, Class

logger = logging.getLogger(__name__)


def teacher_required(view_func):
    """教师权限装饰器"""
    def wrapper(request, *args, **kwargs):
        if not request.user.is_staff:
            return error_response('需要教师权限', error_code='PERMISSION_DENIED')
        return view_func(request, *args, **kwargs)
    return wrapper


@require_http_methods(["GET"])
@login_required
@teacher_required
def overview_statistics_view(request):
    """
    总览统计接口
    GET /api/teacher/stats/overview

    Query Parameters:
    - start_date: 开始日期 (YYYY-MM-DD)
    - end_date: 结束日期 (YYYY-MM-DD)
    - problem_id: 题目ID筛选
    - class_id: 班级ID筛选

    Response:
    {
        "ok": true,
        "data": {
            "summary": {
                "total_submissions": 100,
                "pass_rate": 65.5,
                "avg_score": 72.3,
                ...
            }
        }
    }
    """
    try:
        # 解析查询参数
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        problem_id = request.GET.get('problem_id')
        class_id = request.GET.get('class_id')

        # 日期格式转换
        if start_date:
            start_date = datetime.strptime(start_date, '%Y-%m-%d')
        if end_date:
            end_date = datetime.strptime(end_date, '%Y-%m-%d')

        # 获取统计数据
        stats = TeacherStatisticsService.get_overview_statistics(
            teacher=request.user,
            start_date=start_date,
            end_date=end_date,
            problem_id=problem_id,
            class_id=class_id
        )

        return success_response(
            message='统计数据获取成功',
            data=stats
        )

    except ValueError as e:
        return error_response(f'日期格式错误: {str(e)}', error_code='INVALID_DATE')
    except Exception as e:
        logger.error(f"获取总览统计失败: {str(e)}", exc_info=True)
        return error_response(f'系统错误: {str(e)}', error_code='SYSTEM_ERROR')


@require_http_methods(["GET"])
@login_required
@teacher_required
def trend_statistics_view(request):
    """
    趋势统计接口
    GET /api/teacher/stats/trend

    Query Parameters:
    - start_date: 开始日期
    - end_date: 结束日期
    - days: 最近N天（如果未指定start_date和end_date）
    - granularity: 粒度 (day/week)
    - class_id: 班级ID筛选
    """
    try:
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        days = request.GET.get('days')
        granularity = request.GET.get('granularity', 'day')
        class_id = request.GET.get('class_id')

        # 如果指定了days参数，自动计算日期范围
        if days and not start_date and not end_date:
            from datetime import timedelta
            end_date = datetime.now()
            start_date = end_date - timedelta(days=int(days))
        else:
            if start_date:
                start_date = datetime.strptime(start_date, '%Y-%m-%d')
            if end_date:
                end_date = datetime.strptime(end_date, '%Y-%m-%d')

        stats = TeacherStatisticsService.get_trend_statistics(
            teacher=request.user,
            start_date=start_date,
            end_date=end_date,
            granularity=granularity,
            class_id=class_id
        )

        return success_response(
            message='趋势数据获取成功',
            data=stats
        )

    except ValueError as e:
        return error_response(f'参数错误: {str(e)}', error_code='INVALID_PARAM')
    except Exception as e:
        logger.error(f"获取趋势统计失败: {str(e)}", exc_info=True)
        return error_response(f'系统错误: {str(e)}', error_code='SYSTEM_ERROR')


@require_http_methods(["GET"])
@login_required
@teacher_required
def problem_statistics_view(request):
    """
    题目统计接口
    GET /api/teacher/stats/problems

    Query Parameters:
    - start_date: 开始日期
    - end_date: 结束日期
    - limit: 返回数量限制
    - class_id: 班级ID筛选
    - difficulty: 难度筛选
    """
    try:
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        limit = int(request.GET.get('limit', 10))
        class_id = request.GET.get('class_id')
        difficulty = request.GET.get('difficulty')

        if start_date:
            start_date = datetime.strptime(start_date, '%Y-%m-%d')
        if end_date:
            end_date = datetime.strptime(end_date, '%Y-%m-%d')

        stats = TeacherStatisticsService.get_problem_statistics(
            teacher=request.user,
            start_date=start_date,
            end_date=end_date,
            limit=limit,
            class_id=class_id,
            difficulty=difficulty
        )

        return success_response(
            message='题目统计获取成功',
            data=stats
        )

    except ValueError as e:
        return error_response(f'参数错误: {str(e)}', error_code='INVALID_PARAM')
    except Exception as e:
        logger.error(f"获取题目统计失败: {str(e)}", exc_info=True)
        return error_response(f'系统错误: {str(e)}', error_code='SYSTEM_ERROR')


@require_http_methods(["GET"])
@login_required
@teacher_required
def student_statistics_view(request):
    """
    学生统计接口
    GET /api/teacher/stats/students

    Query Parameters:
    - page: 页码
    - page_size: 每页数量
    - search: 搜索学生用户名
    - class_id: 班级ID筛选
    - assignment_id: 作业ID筛选
    """
    try:
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 20))
        search = request.GET.get('search', '')
        class_id = request.GET.get('class_id')
        assignment_id = request.GET.get('assignment_id')

        from .models import ClassStudent
        from django.db.models import Count, Avg, Max, Q

        # 如果指定了班级，从班级学生开始查询
        if class_id:
            # 获取班级中的所有学生
            class_students = ClassStudent.objects.filter(
                class_obj_id=class_id
            ).select_related('student')

            # 搜索筛选
            if search:
                class_students = class_students.filter(student__username__icontains=search)

            # 构建学生统计数据
            students = []
            for cs in class_students:
                student = cs.student

                # 查询该学生的提交记录
                submissions = Submission.objects.filter(student=student)

                # 如果指定了作业，只统计该作业的提交
                if assignment_id:
                    assignment = Assignment.objects.get(id=assignment_id)
                    problem_ids = assignment.problems.values_list('id', flat=True)
                    submissions = submissions.filter(problem_id__in=problem_ids)

                # 统计数据
                submission_count = submissions.count()
                avg_score = submissions.aggregate(Avg('score'))['score__avg'] or 0
                last_active = submissions.aggregate(Max('created_at'))['created_at__max']

                students.append({
                    'id': student.id,
                    'username': student.username,
                    'submission_count': submission_count,
                    'avg_score': round(avg_score, 1),
                    'last_active': last_active.isoformat() if last_active else None
                })

            # 按最后活跃时间排序（没有提交的排在最后）
            students.sort(key=lambda x: x['last_active'] or '', reverse=True)

            # 分页
            from django.core.paginator import Paginator
            paginator = Paginator(students, page_size)
            page_obj = paginator.get_page(page)

            return success_response(
                message='学生统计获取成功',
                data={
                    'students': list(page_obj),
                    'total': paginator.count,
                    'page': page,
                    'page_size': page_size,
                    'total_pages': paginator.num_pages
                }
            )

        # 如果没有指定班级，使用原来的逻辑（基于提交记录）
        submissions = Submission.objects.all()

        # 作业筛选
        if assignment_id:
            assignment = Assignment.objects.get(id=assignment_id)
            problem_ids = assignment.problems.values_list('id', flat=True)
            submissions = submissions.filter(problem_id__in=problem_ids)

        # 按学生分组统计
        student_stats = submissions.values(
            'student_id',
            'student__username'
        ).annotate(
            submission_count=Count('id'),
            avg_score=Avg('score'),
            last_active=Max('created_at')
        )

        # 搜索筛选
        if search:
            student_stats = student_stats.filter(student__username__icontains=search)

        # 排序
        student_stats = student_stats.order_by('-last_active')

        # 分页
        from django.core.paginator import Paginator
        paginator = Paginator(list(student_stats), page_size)
        page_obj = paginator.get_page(page)

        # 格式化数据
        students = []
        for item in page_obj:
            students.append({
                'id': item['student_id'],
                'username': item['student__username'],
                'submission_count': item['submission_count'],
                'avg_score': round(item['avg_score'] or 0, 1),
                'last_active': item['last_active'].isoformat() if item['last_active'] else None
            })

        return success_response(
            message='学生统计获取成功',
            data={
                'students': students,
                'total': paginator.count,
                'page': page,
                'page_size': page_size,
                'total_pages': paginator.num_pages
            }
        )

    except ValueError as e:
        return error_response(f'参数错误: {str(e)}', error_code='INVALID_PARAM')
    except Exception as e:
        logger.error(f"获取学生统计失败: {str(e)}", exc_info=True)
        return error_response(f'系统错误: {str(e)}', error_code='SYSTEM_ERROR')


@require_http_methods(["GET"])
@login_required
@teacher_required
def error_insights_view(request):
    """
    错误洞察接口
    GET /api/teacher/insights/errors
    """
    try:
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        problem_id = request.GET.get('problem_id')
        limit = int(request.GET.get('limit', 10))

        if start_date:
            start_date = datetime.strptime(start_date, '%Y-%m-%d')
        if end_date:
            end_date = datetime.strptime(end_date, '%Y-%m-%d')

        insights = TeacherStatisticsService.get_error_insights(
            teacher=request.user,
            start_date=start_date,
            end_date=end_date,
            problem_id=problem_id,
            limit=limit
        )

        return success_response(
            message='错误洞察获取成功',
            data=insights
        )

    except ValueError as e:
        return error_response(f'参数错误: {str(e)}', error_code='INVALID_PARAM')
    except Exception as e:
        logger.error(f"获取错误洞察失败: {str(e)}", exc_info=True)
        return error_response(f'系统错误: {str(e)}', error_code='SYSTEM_ERROR')


@require_http_methods(["GET"])
@login_required
@teacher_required
def diagnosis_insights_view(request):
    """
    诊断洞察接口
    GET /api/teacher/insights/diagnosis
    """
    try:
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        limit = int(request.GET.get('limit', 10))

        if start_date:
            start_date = datetime.strptime(start_date, '%Y-%m-%d')
        if end_date:
            end_date = datetime.strptime(end_date, '%Y-%m-%d')

        insights = TeacherStatisticsService.get_diagnosis_insights(
            teacher=request.user,
            start_date=start_date,
            end_date=end_date,
            limit=limit
        )

        return success_response(
            message='诊断洞察获取成功',
            data=insights
        )

    except ValueError as e:
        return error_response(f'参数错误: {str(e)}', error_code='INVALID_PARAM')
    except Exception as e:
        logger.error(f"获取诊断洞察失败: {str(e)}", exc_info=True)
        return error_response(f'系统错误: {str(e)}', error_code='SYSTEM_ERROR')


@require_http_methods(["GET"])
@login_required
@teacher_required
def export_report_view(request):
    """
    导出报表接口
    GET /api/teacher/export/report

    Query Parameters:
    - format: 导出格式 (csv/excel)
    - report_type: 报表类型 (overview/problems/students/errors)
    - start_date: 开始日期
    - end_date: 结束日期
    """
    try:
        export_format = request.GET.get('format', 'csv')
        report_type = request.GET.get('report_type', 'overview')
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')

        if start_date:
            start_date = datetime.strptime(start_date, '%Y-%m-%d')
        if end_date:
            end_date = datetime.strptime(end_date, '%Y-%m-%d')

        # 根据报表类型获取数据
        if report_type == 'overview':
            data = TeacherStatisticsService.get_overview_statistics(
                teacher=request.user,
                start_date=start_date,
                end_date=end_date
            )
            filename = f'overview_report_{datetime.now().strftime("%Y%m%d")}.csv'
            rows = _format_overview_for_export(data)

        elif report_type == 'problems':
            data = TeacherStatisticsService.get_problem_statistics(
                teacher=request.user,
                start_date=start_date,
                end_date=end_date,
                limit=100
            )
            filename = f'problems_report_{datetime.now().strftime("%Y%m%d")}.csv'
            rows = _format_problems_for_export(data)

        elif report_type == 'students':
            data = TeacherStatisticsService.get_student_statistics(
                teacher=request.user,
                start_date=start_date,
                end_date=end_date,
                limit=100
            )
            filename = f'students_report_{datetime.now().strftime("%Y%m%d")}.csv'
            rows = _format_students_for_export(data)

        elif report_type == 'errors':
            data = TeacherStatisticsService.get_error_insights(
                teacher=request.user,
                start_date=start_date,
                end_date=end_date,
                limit=100
            )
            filename = f'errors_report_{datetime.now().strftime("%Y%m%d")}.csv'
            rows = _format_errors_for_export(data)

        else:
            return error_response('不支持的报表类型', error_code='INVALID_REPORT_TYPE')

        # 生成CSV文件
        if export_format == 'csv':
            response = HttpResponse(content_type='text/csv; charset=utf-8-sig')
            response['Content-Disposition'] = f'attachment; filename="{filename}"'

            writer = csv.writer(response)
            for row in rows:
                writer.writerow(row)

            return response

        else:
            return error_response('暂不支持Excel格式', error_code='FORMAT_NOT_SUPPORTED')

    except ValueError as e:
        return error_response(f'参数错误: {str(e)}', error_code='INVALID_PARAM')
    except Exception as e:
        logger.error(f"导出报表失败: {str(e)}", exc_info=True)
        return error_response(f'系统错误: {str(e)}', error_code='SYSTEM_ERROR')


def _format_overview_for_export(data):
    """格式化总览数据为CSV行"""
    summary = data['summary']
    rows = [
        ['指标', '数值'],
        ['总提交数', summary['total_submissions']],
        ['成功提交数', summary['success_submissions']],
        ['失败提交数', summary['fail_submissions']],
        ['错误提交数', summary['error_submissions']],
        ['通过率(%)', summary['pass_rate']],
        ['平均得分', summary['avg_score']],
        ['活跃学生数', summary['active_students']],
        ['活跃题目数', summary['active_problems']],
        ['诊断总数', summary['total_diagnoses']],
        ['诊断触发率(%)', summary['diagnosis_rate']],
    ]
    return rows


def _format_problems_for_export(data):
    """格式化题目数据为CSV行"""
    rows = [['题目ID', '题目标题', '难度', '总提交数', '成功数', '失败数', '错误数', '通过率(%)', '平均得分', '参与学生数']]

    for problem in data['problems']:
        rows.append([
            problem['problem_id'],
            problem['problem_title'],
            problem['difficulty'],
            problem['total_submissions'],
            problem['success_count'],
            problem['fail_count'],
            problem['error_count'],
            problem['pass_rate'],
            problem['avg_score'],
            problem['unique_students']
        ])

    return rows


def _format_students_for_export(data):
    """格式化学生数据为CSV行（匿名化处理）"""
    rows = [['学生ID', '姓名', '总提交数', '成功数', '失败数', '错误数', '通过率(%)', '平均得分', '参与题目数', '风险等级', '最后提交时间']]

    for student in data['students']:
        # 数据脱敏：使用匿名ID
        anonymous_id = f"S{student['student_id']:04d}"
        anonymous_name = f"学生{student['student_id']}"

        rows.append([
            anonymous_id,
            anonymous_name,
            student['total_submissions'],
            student['success_count'],
            student['fail_count'],
            student['error_count'],
            student['pass_rate'],
            student['avg_score'],
            student['unique_problems'],
            student['risk_level'],
            student['last_submit_time'] or ''
        ])

    return rows


def _format_errors_for_export(data):
    """格式化错误数据为CSV行"""
    rows = [['错误类型', '出现次数', '占比(%)', '影响学生数', '涉及题目数']]

    for error in data['errors']:
        rows.append([
            error['error_type'],
            error['count'],
            error['percentage'],
            error['unique_students'],
            error['unique_problems']
        ])

    return rows


# ========== 教师端页面视图 ==========

@login_required
@teacher_required
def teacher_dashboard_view(request):
    """
    教师端总览页面
    GET /teacher/dashboard
    """
    return render(request, 'teacher/dashboard.html')


@login_required
@teacher_required
def teacher_problems_view(request):
    """
    教师端题目分析页面
    GET /teacher/problems
    """
    return render(request, 'teacher/problems.html')


@login_required
@teacher_required
def teacher_students_view(request):
    """
    教师端学生追踪页面
    GET /teacher/students
    """
    return render(request, 'teacher/students.html')


@login_required
@teacher_required
def teacher_insights_view(request):
    """
    教师端错误洞察页面
    GET /teacher/insights
    """
    return render(request, 'teacher/insights.html')


@login_required
@teacher_required
def teacher_assignments_view(request):
    """
    教师端作业管理页面
    GET /teacher/assignments
    """
    return render(request, 'teacher/assignments.html')


@login_required
@teacher_required
def teacher_create_problem_view(request):
    """
    教师端创建题目页面
    GET /teacher/problems/create
    """
    return render(request, 'teacher/create_problem.html')


@require_http_methods(["GET"])
@login_required
@teacher_required
def teacher_create_assignment_view(request):
    """
    教师端创建作业页面
    GET /teacher/assignments/create
    """
    return render(request, 'teacher/create_assignment.html')


# ========== 兼容旧接口 ==========

@require_http_methods(["GET"])
@login_required
@teacher_required
def teacher_submissions_view(request):
    """
    教师查看所有学生提交列表接口
    GET /api/teacher/submissions

    Query Parameters:
    - page: 页码（默认1）
    - page_size: 每页数量（默认10）

    Returns:
        包含提交列表的JSON响应
    """
    try:
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 10))
        student_id = request.GET.get('student_id')

        # 获取提交记录，按创建时间倒序
        submissions = Submission.objects.select_related(
            'student', 'problem'
        )

        if student_id:
            submissions = submissions.filter(student_id=student_id)

        submissions = submissions.order_by('-created_at')

        # 分页
        from django.core.paginator import Paginator
        paginator = Paginator(submissions, page_size)
        page_obj = paginator.get_page(page)

        # 构建返回数据
        submission_list = []
        for sub in page_obj:
            submission_list.append({
                'id': sub.id,
                'student_id': sub.student.id,
                'student_name': sub.student.get_full_name() or sub.student.username,
                'student_username': sub.student.username,
                'problem_id': sub.problem.id,
                'problem_title': sub.problem.title,
                'status': sub.run_status,
                'run_status': sub.run_status,
                'run_status_display': sub.get_run_status_display(),
                'score': sub.score,
                'error_type': sub.error_type or '',
                'created_at': sub.created_at.isoformat(),
            })

        return success_response(
            message='提交列表获取成功',
            data={
                'submissions': submission_list,
                'total': paginator.count,
                'page': page,
                'page_size': page_size,
                'total_pages': paginator.num_pages
            }
        )

    except Exception as e:
        logger.error(f"获取提交列表失败: {str(e)}", exc_info=True)
        return error_response(f'系统错误: {str(e)}', error_code='SYSTEM_ERROR')


@require_http_methods(["GET"])
@login_required
@teacher_required
def teacher_overview_view(request):
    """
    教师总览统计接口（兼容）
    GET /api/teacher/stats/overview
    """
    return overview_statistics_view(request)


# ========== 学生提交查看功能 ==========

@login_required
def student_submissions_view(request, student_id):
    """
    教师查看学生的提交历史页面
    GET /teacher/students/<student_id>/submissions
    """
    if not request.user.is_staff:
        from django.http import Http404
        raise Http404("无权访问")

    from django.contrib.auth.models import User
    student = get_object_or_404(User, id=student_id)

    return render(request, 'teacher/student_submissions.html', {
        'student': student
    })


@login_required
def submission_review_view(request, submission_id):
    """
    教师审阅学生提交页面
    GET /teacher/submissions/<submission_id>/review
    """
    if not request.user.is_staff:
        from django.http import Http404
        raise Http404("无权访问")

    submission = get_object_or_404(Submission, id=submission_id)

    # 获取诊断记录（如果有）
    try:
        diagnosis = DiagnosisRecord.objects.filter(submission=submission).first()
    except:
        diagnosis = None

    return render(request, 'teacher/submission_review.html', {
        'submission': submission,
        'diagnosis': diagnosis
    })


@require_http_methods(["POST"])
@login_required
def save_submission_review(request, submission_id):
    """
    保存教师对提交的评分和评语
    POST /teacher/api/submissions/<submission_id>/review
    """
    if not request.user.is_staff:
        return JsonResponse({'ok': False, 'message': '无权访问'}, status=403)

    try:
        submission = get_object_or_404(Submission, id=submission_id)
        data = json.loads(request.body)

        submission.teacher_score = data.get('teacher_score')
        submission.teacher_comment = data.get('teacher_comment', '')
        submission.save()

        return JsonResponse({
            'ok': True,
            'message': '保存成功'
        })
    except Exception as e:
        logger.error(f"保存教师评分失败: {str(e)}", exc_info=True)
        return JsonResponse({
            'ok': False,
            'message': str(e)
        }, status=500)


@login_required
def teacher_feedback_view(request, submission_id):
    """
    教师端提交反馈页面
    GET /teacher/submissions/<submission_id>/feedback
    """
    if not request.user.is_staff:
        from django.http import Http404
        raise Http404("无权访问")

    submission = get_object_or_404(Submission, id=submission_id)

    # 获取最新的诊断记录（如果有）
    diagnosis = DiagnosisRecord.objects.filter(
        submission=submission
    ).order_by('-created_at').first()

    return render(request, 'teacher/feedback.html', {
        'submission': submission,
        'diagnosis': diagnosis
    })


# ========== 作业管理API ==========

@require_http_methods(["POST"])
@login_required
@teacher_required
def create_assignment_view(request):
    """
    创建作业
    POST /api/teacher/assignments

    Body:
    {
        "title": "作业标题",  // 当选择了现有题目时可选
        "description": "作业描述",  // 当选择了现有题目时可选
        "class_id": 1,  // 必填
        "problem_ids": [1, 2, 3],  // 选填，但选择后可忽略title等必填项
        "deadline": "2024-12-31T23:59:59",  // 必填
        "instructions": "作业说明",  // 当选择了现有题目时可选
        "is_published": false
    }
    """
    try:
        data = json.loads(request.body)

        # 验证班级和截止时间（始终必填）
        if not data.get('class_id'):
            return error_response('必须指定班级', error_code='MISSING_CLASS')
        if not data.get('deadline'):
            return error_response('必须指定截止时间', error_code='MISSING_DEADLINE')

        # 获取班级
        class_obj = get_object_or_404(Class, id=data['class_id'])

        # 检查是否选择了现有题目
        problem_ids = data.get('problem_ids', [])
        has_problems = problem_ids and len(problem_ids) > 0

        # 如果没有选择题目，则标题、描述、说明为必填
        if not has_problems:
            if not data.get('title'):
                return error_response('未选择题目时，作业标题不能为空', error_code='MISSING_TITLE')
            if not data.get('description'):
                return error_response('未选择题目时，作业描述不能为空', error_code='MISSING_DESCRIPTION')
            if not data.get('instructions'):
                return error_response('未选择题目时，作业说明不能为空', error_code='MISSING_INSTRUCTIONS')

        # 如果选择了题目，使用题目标题作为作业标题（如果未提供）
        title = data.get('title', '')
        if has_problems and not title:
            # 使用第一个题目的标题
            first_problem = Problem.objects.filter(id=problem_ids[0]).first()
            if first_problem:
                title = f"{first_problem.title}"
                if len(problem_ids) > 1:
                    title += f" 等{len(problem_ids)}道题"

        # 创建作业
        assignment = Assignment.objects.create(
            title=title or '未命名作业',
            description=data.get('description', ''),
            class_obj=class_obj,
            created_by=request.user,
            deadline=data.get('deadline'),
            instructions=data.get('instructions', ''),
            is_published=data.get('is_published', False)
        )

        # 添加题目
        if has_problems:
            problems = Problem.objects.filter(id__in=problem_ids)
            assignment.problems.set(problems)

        return success_response(
            message='作业创建成功',
            data={
                'id': assignment.id,
                'title': assignment.title,
                'class_name': assignment.class_obj.name,
                'problem_count': assignment.problem_count,
                'is_published': assignment.is_published,
                'created_at': assignment.created_at.isoformat()
            }
        )

    except Exception as e:
        logger.error(f"创建作业失败: {str(e)}", exc_info=True)
        return error_response(f'创建失败: {str(e)}', error_code='CREATE_FAILED')


@require_http_methods(["GET"])
@login_required
@teacher_required
def list_assignments_view(request):
    """
    获取作业列表（现在查询Problem模型中有班级关联的题目）
    GET /api/teacher/assignments

    Query Parameters:
    - page: 页码（默认1）
    - page_size: 每页数量（默认10）
    - class_id: 班级ID筛选
    - is_published: 是否已发布筛选
    """
    try:
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 10))
        class_id = request.GET.get('class_id')
        is_published = request.GET.get('is_published')

        # 构建查询：查询分配到当前教师班级的所有题目（作业）
        from apps.teacher.models import Class
        from apps.problems.models import Problem

        teacher_classes = Class.objects.filter(teacher=request.user).values_list('id', flat=True)

        # 查询有班级关联的题目（作业），包括教师自己创建的和选择的公共题目
        problems = Problem.objects.prefetch_related('classes').filter(
            classes__id__in=teacher_classes
        ).distinct()

        # 筛选条件
        if class_id:
            problems = problems.filter(classes__id=class_id)
        if is_published is not None:
            problems = problems.filter(is_published=is_published.lower() == 'true')

        # 按创建时间倒序
        problems = problems.order_by('-created_at')

        # 分页
        from django.core.paginator import Paginator
        paginator = Paginator(problems, page_size)
        page_obj = paginator.get_page(page)

        # 构建返回数据
        assignment_list = []
        for problem in page_obj:
            assignment_list.append({
                'id': problem.id,
                'title': problem.title,
                'description': problem.description,
                'difficulty': problem.difficulty,
                'difficulty_display': problem.get_difficulty_display(),
                'class_names': problem.class_names,
                'test_case_count': problem.test_cases_count,
                'deadline': problem.deadline.isoformat() if problem.deadline else None,
                'is_published': problem.is_published,
                'is_overdue': problem.is_overdue,
                'created_at': problem.created_at.isoformat()
            })

        return success_response(
            message='作业列表获取成功',
            data={
                'assignments': assignment_list,
                'total': paginator.count,
                'page': page,
                'page_size': page_size,
                'total_pages': paginator.num_pages
            }
        )

    except Exception as e:
        logger.error(f"获取作业列表失败: {str(e)}", exc_info=True)
        return error_response(f'获取失败: {str(e)}', error_code='LIST_FAILED')


@require_http_methods(["GET"])
@login_required
@teacher_required
def assignment_detail_view(request, assignment_id):
    """
    获取作业详情（获取Problem详情）
    GET /api/teacher/assignments/<assignment_id>
    """
    try:
        from apps.problems.models import Problem

        problem = get_object_or_404(
            Problem.objects.prefetch_related('classes'),
            id=assignment_id,
            created_by=request.user
        )

        # 构建班级列表
        classes = []
        for cls in problem.classes.all():
            classes.append({
                'id': cls.id,
                'name': cls.name
            })

        return success_response(
            message='作业详情获取成功',
            data={
                'id': problem.id,
                'title': problem.title,
                'description': problem.description,
                'difficulty': problem.difficulty,
                'difficulty_display': problem.get_difficulty_display(),
                'classes': classes,
                'class_names': problem.class_names,
                'test_cases': problem.test_cases,
                'test_case_count': problem.test_cases_count,
                'deadline': problem.deadline.isoformat() if problem.deadline else None,
                'instructions': problem.instructions,
                'is_published': problem.is_published,
                'is_overdue': problem.is_overdue,
                'created_by': problem.created_by.username if problem.created_by else 'admin',
                'created_at': problem.created_at.isoformat()
            }
        )

    except Exception as e:
        logger.error(f"获取作业详情失败: {str(e)}", exc_info=True)
        return error_response(f'获取失败: {str(e)}', error_code='DETAIL_FAILED')


@require_http_methods(["PUT"])
@login_required
@teacher_required
def update_assignment_view(request, assignment_id):
    """
    更新作业（更新Problem）
    PUT /api/teacher/assignments/<assignment_id>

    Body:
    {
        "title": "新标题",
        "description": "新描述",
        "difficulty": "medium",
        "class_ids": [1, 2],
        "deadline": "2024-12-31T23:59:59",
        "instructions": "新说明",
        "is_published": true
    }
    """
    try:
        from apps.problems.models import Problem
        from apps.teacher.models import Class

        # 获取题目（作业），验证是否分配到教师的班级
        teacher_classes = Class.objects.filter(teacher=request.user).values_list('id', flat=True)

        try:
            problem = Problem.objects.filter(
                id=assignment_id,
                classes__id__in=teacher_classes
            ).distinct().get()
        except Problem.DoesNotExist:
            return error_response('作业不存在或无权编辑', error_code='PROBLEM_NOT_FOUND')

        data = json.loads(request.body)

        # 只有教师自己创建的题目才能修改内容
        if problem.created_by == request.user:
            # 更新字段
            if 'title' in data:
                problem.title = data['title']
            if 'description' in data:
                problem.description = data['description']
            if 'difficulty' in data:
                problem.difficulty = data['difficulty']
            if 'deadline' in data:
                problem.deadline = data['deadline']
            if 'instructions' in data:
                problem.instructions = data['instructions']
            if 'is_published' in data:
                problem.is_published = data['is_published']

            problem.save()

            # 更新班级列表
            if 'class_ids' in data:
                classes = Class.objects.filter(id__in=data['class_ids'], teacher=request.user)
                problem.classes.set(classes)
        else:
            # 公共题目只能修改班级关联和截止时间
            if 'deadline' in data:
                problem.deadline = data['deadline']
                problem.save()

            if 'class_ids' in data:
                # 只能修改自己班级的关联
                current_teacher_classes = problem.classes.filter(teacher=request.user)
                other_classes = problem.classes.exclude(teacher=request.user)
                new_teacher_classes = Class.objects.filter(id__in=data['class_ids'], teacher=request.user)

                # 保留其他教师的班级，更新当前教师的班级
                problem.classes.set(list(other_classes) + list(new_teacher_classes))

        return success_response(
            message='作业更新成功',
            data={
                'id': problem.id,
                'title': problem.title,
                'difficulty': problem.difficulty,
                'class_names': problem.class_names,
                'is_published': problem.is_published,
                'created_at': problem.created_at.isoformat()
            }
        )

    except Exception as e:
        logger.error(f"更新作业失败: {str(e)}", exc_info=True)
        return error_response(f'更新失败: {str(e)}', error_code='UPDATE_FAILED')


@require_http_methods(["DELETE"])
@login_required
@teacher_required
def delete_assignment_view(request, assignment_id):
    """
    删除作业
    - 如果是教师自己创建的题目：完全删除题目及其相关记录
    - 如果是公共题目（管理员创建）：只取消班级关联
    DELETE /api/teacher/assignments/<assignment_id>
    """
    try:
        from apps.problems.models import Problem
        from apps.submissions.models import Submission
        from apps.diagnosis.models import DiagnosisRecord

        # 获取题目（作业），验证是否分配到教师的班级
        from apps.teacher.models import Class
        teacher_classes = Class.objects.filter(teacher=request.user).values_list('id', flat=True)

        try:
            problem = Problem.objects.filter(
                id=assignment_id,
                classes__id__in=teacher_classes
            ).distinct().get()
        except Problem.DoesNotExist:
            return error_response('作业不存在或无权删除', error_code='PROBLEM_NOT_FOUND')

        problem_title = problem.title

        # 判断是否是教师自己创建的题目
        if problem.created_by == request.user:
            # 教师自己创建的题目：完全删除
            submission_count = Submission.objects.filter(problem=problem).count()
            diagnosis_count = DiagnosisRecord.objects.filter(problem=problem).count()

            if submission_count > 0:
                Submission.objects.filter(problem=problem).delete()
            if diagnosis_count > 0:
                DiagnosisRecord.objects.filter(problem=problem).delete()

            problem.delete()
            return success_response(message=f'作业"{problem_title}"已删除')
        else:
            # 公共题目：只取消班级关联
            teacher_class_objs = Class.objects.filter(teacher=request.user)
            problem.classes.remove(*teacher_class_objs)
            return success_response(message=f'作业"{problem_title}"已从您的班级中移除')

    except Exception as e:
        logger.error(f"删除作业失败: {str(e)}", exc_info=True)
        return error_response(f'删除失败: {str(e)}', error_code='DELETE_FAILED')


# ========== 题目管理API（新）==========

@require_http_methods(["POST"])
@login_required
@teacher_required
def create_problem_view(request):
    """
    创建题目
    POST /api/teacher/problems

    Body:
    {
        "title": "题目标题",  // 必填
        "description": "题目描述",  // 必填
        "difficulty": "easy",  // 必填: easy/medium/hard
        "class_ids": [1, 2],  // 选填，指定哪些班级可见，留空表示所有学生可见
        "deadline": "2024-12-31T23:59:59",  // 选填
        "instructions": "题目说明",  // 选填
        "test_cases": [  // 必填
            {"input": "5", "output": "True", "description": "测试偶数"}
        ],
        "is_published": true  // 选填，默认true
    }
    """
    try:
        data = json.loads(request.body)

        # 验证必填字段
        if not data.get('title'):
            return error_response('题目标题不能为空', error_code='MISSING_TITLE')
        if not data.get('description'):
            return error_response('题目描述不能为空', error_code='MISSING_DESCRIPTION')
        if not data.get('difficulty'):
            return error_response('必须指定难度', error_code='MISSING_DIFFICULTY')
        if not data.get('test_cases'):
            return error_response('必须提供测试用例', error_code='MISSING_TEST_CASES')

        # 验证难度值
        if data['difficulty'] not in ['easy', 'medium', 'hard']:
            return error_response('难度值无效', error_code='INVALID_DIFFICULTY')

        # 验证班级ID
        class_ids = data.get('class_ids', [])
        if class_ids:
            # 验证班级是否存在且属于当前教师
            classes = Class.objects.filter(id__in=class_ids, teacher=request.user)
            if classes.count() != len(class_ids):
                return error_response('部分班级不存在或不属于您', error_code='INVALID_CLASS')

        # 创建题目
        from apps.problems.services import create_problem
        problem = create_problem(
            title=data['title'],
            description=data['description'],
            difficulty=data['difficulty'],
            test_cases=data['test_cases'],
            created_by=request.user,
            class_ids=class_ids if class_ids else None,
            deadline=data.get('deadline'),
            instructions=data.get('instructions'),
            is_published=data.get('is_published', True)
        )

        return success_response(
            message='题目创建成功',
            data={
                'id': problem.id,
                'title': problem.title,
                'difficulty': problem.difficulty,
                'difficulty_display': problem.get_difficulty_display(),
                'class_names': problem.class_names,
                'is_published': problem.is_published,
                'created_at': problem.created_at.isoformat()
            }
        )

    except Exception as e:
        logger.error(f"创建题目失败: {str(e)}", exc_info=True)
        return error_response(f'创建失败: {str(e)}', error_code='CREATE_FAILED')


@require_http_methods(["POST"])
@login_required
@teacher_required
def assign_problem_to_classes_view(request):
    """
    将公共题目分配到班级（作为作业）
    POST /api/teacher/assignments/assign-problem

    Body:
    {
        "problem_id": 1,
        "class_ids": [1, 2],
        "is_published": true
    }
    """
    try:
        data = json.loads(request.body)

        problem_id = data.get('problem_id')
        class_ids = data.get('class_ids', [])
        is_published = data.get('is_published', True)

        if not problem_id:
            return error_response('题目ID不能为空', error_code='MISSING_PROBLEM_ID')

        if not class_ids:
            return error_response('请至少选择一个班级', error_code='MISSING_CLASS_IDS')

        # 验证题目是否存在
        try:
            problem = Problem.objects.get(id=problem_id)
        except Problem.DoesNotExist:
            return error_response('题目不存在', error_code='PROBLEM_NOT_FOUND')

        # 验证班级是否存在且属于当前教师
        classes = Class.objects.filter(id__in=class_ids, teacher=request.user)
        if classes.count() != len(class_ids):
            return error_response('部分班级不存在或不属于您', error_code='INVALID_CLASS')

        # 将题目关联到班级
        problem.classes.add(*classes)

        # 更新发布状态
        if not problem.is_published and is_published:
            problem.is_published = True
            problem.save()

        return success_response(
            message='作业发布成功',
            data={
                'problem_id': problem.id,
                'title': problem.title,
                'class_count': len(class_ids)
            }
        )

    except Exception as e:
        logger.error(f"分配题目失败: {str(e)}", exc_info=True)
        return error_response(f'分配失败: {str(e)}', error_code='ASSIGN_FAILED')


@require_http_methods(["GET"])
@login_required
@teacher_required
def list_teacher_problems_view(request):
    """
    获取教师创建的题目列表
    GET /api/teacher/problems

    Query Parameters:
    - page: 页码（默认1）
    - page_size: 每页数量（默认10）
    - class_id: 班级ID筛选
    - difficulty: 难度筛选
    - is_published: 是否已发布筛选
    """
    try:
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 10))
        class_id = request.GET.get('class_id')
        difficulty = request.GET.get('difficulty')
        is_published = request.GET.get('is_published')

        # 基础查询：查询当前教师创建的题目 或 教师所带班级的题目（不包括公共题目）
        from apps.teacher.models import Class
        teacher_classes = Class.objects.filter(teacher=request.user).values_list('id', flat=True)

        queryset = Problem.objects.filter(
            Q(created_by=request.user) | Q(classes__id__in=teacher_classes)
        ).distinct().prefetch_related('classes')

        # 班级筛选：如果指定了class_id，只显示该班级的题目
        if class_id:
            queryset = queryset.filter(classes__id=class_id)

        # 难度筛选
        if difficulty:
            queryset = queryset.filter(difficulty=difficulty)

        # 发布状态筛选
        if is_published:
            is_pub = is_published.lower() == 'true'
            queryset = queryset.filter(is_published=is_pub)

        # 排序
        queryset = queryset.order_by('-created_at')

        # 分页
        from django.core.paginator import Paginator
        paginator = Paginator(queryset, page_size)
        page_obj = paginator.get_page(page)

        # 格式化数据
        problems = []
        for problem in page_obj:
            problems.append({
                'id': problem.id,
                'title': problem.title,
                'description': problem.description,
                'difficulty': problem.difficulty,
                'difficulty_display': problem.get_difficulty_display(),
                'test_cases_count': problem.test_cases_count,
                'class_names': problem.class_names,
                'deadline': problem.deadline.isoformat() if problem.deadline else None,
                'is_overdue': problem.is_overdue,
                'is_published': problem.is_published,
                'created_at': problem.created_at.isoformat()
            })

        return success_response(
            message='获取题目列表成功',
            data={
                'problems': problems,
                'total': paginator.count,
                'page': page,
                'page_size': page_size,
                'total_pages': paginator.num_pages
            }
        )

    except Exception as e:
        logger.error(f"获取题目列表失败: {str(e)}", exc_info=True)
        return error_response(f'获取失败: {str(e)}', error_code='LIST_FAILED')


# ========== 班级管理API ==========

@require_http_methods(["GET"])
@login_required
@teacher_required
def list_classes_view(request):
    """
    获取当前教师的班级列表
    GET /api/teacher/api/classes
    """
    try:
        classes = Class.objects.filter(teacher=request.user, is_active=True).order_by('name')

        class_list = []
        for cls in classes:
            class_list.append({
                'id': cls.id,
                'name': cls.name,
                'code': cls.code,
                'description': cls.description,
                'teacher_name': cls.teacher.username if cls.teacher else None,
                'academic_year': cls.academic_year,
                'semester': cls.semester,
                'created_at': cls.created_at.isoformat()
            })

        return success_response(
            message='班级列表获取成功',
            data={'classes': class_list}
        )

    except Exception as e:
        logger.error(f"获取班级列表失败: {str(e)}", exc_info=True)
        return error_response(f'获取失败: {str(e)}', error_code='LIST_FAILED')

