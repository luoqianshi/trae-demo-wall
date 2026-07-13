"""
教师端统计分析服务
提供班级、题目、学生维度的数据聚合与分析功能
"""
from django.db.models import Count, Avg, Q, F, Sum, Max, Min
from django.db.models.functions import TruncDate, TruncWeek
from django.contrib.auth.models import User
from apps.submissions.models import Submission
from apps.diagnosis.models import DiagnosisRecord
from apps.problems.models import Problem
from apps.teacher.models import ClassStudent
from datetime import datetime, timedelta, date
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)


class TeacherStatisticsService:
    """教师端统计分析服务"""

    @staticmethod
    def get_overview_statistics(teacher=None, start_date=None, end_date=None, problem_id=None, class_id=None):
        """
        获取总览统计数据

        Args:
            teacher: 教师用户对象（可选，管理员可查看全部）
            start_date: 开始日期（可选）
            end_date: 结束日期（可选）
            problem_id: 题目ID（可选）
            class_id: 班级ID（可选，指定班级时只统计该班级）

        Returns:
            dict: 包含总览统计数据
        """
        # 构建基础查询
        submissions = Submission.objects.all()

        # 教师权限筛选
        if teacher:
            if class_id:
                # 指定班级：只统计该班级的学生
                student_ids = ClassStudent.objects.filter(
                    class_obj_id=class_id
                ).values_list('student_id', flat=True)
            else:
                # 未指定班级：统计教师所有班级的学生
                teacher_classes = teacher.teaching_classes.filter(is_active=True)
                student_ids = ClassStudent.objects.filter(
                    class_obj__in=teacher_classes
                ).values_list('student_id', flat=True)

            submissions = submissions.filter(student_id__in=student_ids)

        # 时间筛选
        if start_date:
            submissions = submissions.filter(created_at__gte=start_date)
        if end_date:
            submissions = submissions.filter(created_at__lte=end_date)

        # 题目筛选
        if problem_id:
            submissions = submissions.filter(problem_id=problem_id)

        # 计算核心指标
        total_submissions = submissions.count()
        success_submissions = submissions.filter(run_status='success').count()
        fail_submissions = submissions.filter(run_status='fail').count()
        error_submissions = submissions.filter(run_status='error').count()

        # 计算通过率
        pass_rate = (success_submissions / total_submissions * 100) if total_submissions > 0 else 0

        # 计算平均得分
        avg_score = submissions.aggregate(avg=Avg('score'))['avg'] or 0

        # 活跃学生数（有提交记录的学生）
        active_students = submissions.values('student').distinct().count()

        # 班级学生总数
        if teacher:
            if class_id:
                total_students = ClassStudent.objects.filter(class_obj_id=class_id).count()
            else:
                teacher_classes = teacher.teaching_classes.filter(is_active=True)
                total_students = ClassStudent.objects.filter(class_obj__in=teacher_classes).count()
        else:
            total_students = active_students

        # 活跃题目数
        active_problems = submissions.values('problem').distinct().count()

        # 诊断触发率
        total_diagnoses = DiagnosisRecord.objects.filter(
            submission__in=submissions
        ).count()
        diagnosis_rate = (total_diagnoses / total_submissions * 100) if total_submissions > 0 else 0

        return {
            'summary': {
                'total_submissions': total_submissions,
                'success_submissions': success_submissions,
                'fail_submissions': fail_submissions,
                'error_submissions': error_submissions,
                'pass_rate': round(pass_rate, 2),
                'avg_score': round(avg_score, 2),
                'active_students': active_students,
                'total_students': total_students,
                'active_problems': active_problems,
                'total_diagnoses': total_diagnoses,
                'diagnosis_rate': round(diagnosis_rate, 2),
            }
        }

    @staticmethod
    def get_trend_statistics(teacher=None, start_date=None, end_date=None, granularity='day', class_id=None):
        """
        获取趋势统计数据

        Args:
            teacher: 教师用户对象
            start_date: 开始日期
            end_date: 结束日期
            granularity: 粒度（day/week）
            class_id: 班级ID（可选）

        Returns:
            dict: 包含趋势数据
        """
        # 默认最近7天
        if not end_date:
            end_date = datetime.now()
        if not start_date:
            start_date = end_date - timedelta(days=7)

        submissions = Submission.objects.filter(
            created_at__gte=start_date,
            created_at__lte=end_date
        )

        # 教师权限筛选
        if teacher:
            if class_id:
                student_ids = ClassStudent.objects.filter(
                    class_obj_id=class_id
                ).values_list('student_id', flat=True)
            else:
                teacher_classes = teacher.teaching_classes.filter(is_active=True)
                student_ids = ClassStudent.objects.filter(
                    class_obj__in=teacher_classes
                ).values_list('student_id', flat=True)

            submissions = submissions.filter(student_id__in=student_ids)

        # 按日期分组
        if granularity == 'week':
            trunc_func = TruncWeek
        else:
            trunc_func = TruncDate

        trend_data = submissions.annotate(
            date=trunc_func('created_at')
        ).values('date').annotate(
            total=Count('id'),
            success=Count('id', filter=Q(run_status='success')),
            fail=Count('id', filter=Q(run_status='fail')),
            error=Count('id', filter=Q(run_status='error')),
            avg_score=Avg('score')
        ).order_by('date')

        # 生成完整的日期范围列表
        date_range = []
        current_date = start_date.date() if isinstance(start_date, datetime) else start_date
        end = end_date.date() if isinstance(end_date, datetime) else end_date
        while current_date <= end:
            date_range.append(current_date)
            current_date += timedelta(days=1)

        # 创建日期到数据的映射
        data_map = {}
        for item in trend_data:
            date_key = item['date'] if isinstance(item['date'], date) else item['date'].date()
            data_map[date_key] = item

        # 填充完整的趋势列表（确保所有日期都有数据）
        trend_list = []
        for date_item in date_range:
            if date_item in data_map:
                item = data_map[date_item]
                trend_list.append({
                    'date': date_item.strftime('%Y-%m-%d'),
                    'total': item['total'],
                    'success': item['success'],
                    'fail': item['fail'],
                    'error': item['error'],
                    'avg_score': round(item['avg_score'] or 0, 2),
                    'pass_rate': round((item['success'] / item['total'] * 100) if item['total'] > 0 else 0, 2)
                })
            else:
                # 填充0值数据
                trend_list.append({
                    'date': date_item.strftime('%Y-%m-%d'),
                    'total': 0,
                    'success': 0,
                    'fail': 0,
                    'error': 0,
                    'avg_score': 0,
                    'pass_rate': 0
                })

        return {
            'trend': trend_list,
            'granularity': granularity,
            'start_date': start_date.strftime('%Y-%m-%d') if isinstance(start_date, datetime) else start_date.strftime('%Y-%m-%d'),
            'end_date': end_date.strftime('%Y-%m-%d') if isinstance(end_date, datetime) else end_date.strftime('%Y-%m-%d')
        }

    @staticmethod
    def get_problem_statistics(teacher=None, start_date=None, end_date=None, limit=10, class_id=None, difficulty=None):
        """
        获取题目维度统计

        Args:
            teacher: 教师用户对象
            start_date: 开始日期
            end_date: 结束日期
            limit: 返回题目数量限制
            class_id: 班级ID（可选）
            difficulty: 难度筛选（可选）

        Returns:
            dict: 包含题目统计数据
        """
        submissions = Submission.objects.all()

        # 教师权限筛选
        if teacher:
            if class_id:
                student_ids = ClassStudent.objects.filter(
                    class_obj_id=class_id
                ).values_list('student_id', flat=True)
            else:
                teacher_classes = teacher.teaching_classes.filter(is_active=True)
                student_ids = ClassStudent.objects.filter(
                    class_obj__in=teacher_classes
                ).values_list('student_id', flat=True)

            submissions = submissions.filter(student_id__in=student_ids)

        if start_date:
            submissions = submissions.filter(created_at__gte=start_date)
        if end_date:
            submissions = submissions.filter(created_at__lte=end_date)

        # 按题目分组统计
        problem_stats = submissions.values(
            'problem_id',
            'problem__title',
            'problem__difficulty'
        ).annotate(
            total_submissions=Count('id'),
            success_count=Count('id', filter=Q(run_status='success')),
            fail_count=Count('id', filter=Q(run_status='fail')),
            error_count=Count('id', filter=Q(run_status='error')),
            avg_score=Avg('score'),
            unique_students=Count('student', distinct=True)
        )

        # 难度筛选
        if difficulty:
            problem_stats = problem_stats.filter(problem__difficulty=difficulty)

        problem_stats = problem_stats.order_by('-total_submissions')[:limit]

        # 格式化返回数据
        problem_list = []
        for item in problem_stats:
            total = item['total_submissions']
            pass_rate = (item['success_count'] / total * 100) if total > 0 else 0

            problem_list.append({
                'problem_id': item['problem_id'],
                'problem_title': item['problem__title'],
                'difficulty': item['problem__difficulty'],
                'total_submissions': total,
                'success_count': item['success_count'],
                'fail_count': item['fail_count'],
                'error_count': item['error_count'],
                'pass_rate': round(pass_rate, 2),
                'avg_score': round(item['avg_score'] or 0, 2),
                'unique_students': item['unique_students']
            })

        return {
            'problems': problem_list,
            'total_problems': Problem.objects.count()
        }

    @staticmethod
    def get_student_statistics(teacher=None, start_date=None, end_date=None,
                               problem_id=None, order_by='-total_submissions', limit=50):
        """
        获取学生维度统计

        Args:
            teacher: 教师用户对象
            start_date: 开始日期
            end_date: 结束日期
            problem_id: 题目ID筛选
            order_by: 排序字段
            limit: 返回学生数量限制

        Returns:
            dict: 包含学生统计数据
        """
        submissions = Submission.objects.all()

        if start_date:
            submissions = submissions.filter(created_at__gte=start_date)
        if end_date:
            submissions = submissions.filter(created_at__lte=end_date)
        if problem_id:
            submissions = submissions.filter(problem_id=problem_id)

        # 按学生分组统计
        student_stats = submissions.values(
            'student_id',
            'student__username',
            'student__first_name',
            'student__last_name'
        ).annotate(
            total_submissions=Count('id'),
            success_count=Count('id', filter=Q(run_status='success')),
            fail_count=Count('id', filter=Q(run_status='fail')),
            error_count=Count('id', filter=Q(run_status='error')),
            avg_score=Avg('score'),
            unique_problems=Count('problem', distinct=True),
            last_submit_time=Max('created_at')
        ).order_by(order_by)[:limit]

        # 格式化返回数据并添加风险标记
        student_list = []
        for item in student_stats:
            total = item['total_submissions']
            pass_rate = (item['success_count'] / total * 100) if total > 0 else 0

            # 风险标记逻辑
            risk_level = 'normal'
            risk_reasons = []

            if pass_rate < 30:
                risk_level = 'high'
                risk_reasons.append('通过率过低')
            elif pass_rate < 50:
                risk_level = 'medium'
                risk_reasons.append('通过率偏低')

            if item['error_count'] > total * 0.5:
                risk_level = 'high'
                risk_reasons.append('错误率过高')

            # 检查最近活跃度
            if item['last_submit_time']:
                days_since_last = (datetime.now().date() - item['last_submit_time'].date()).days
                if days_since_last > 7:
                    risk_reasons.append('长时间未提交')

            student_list.append({
                'student_id': item['student_id'],
                'username': item['student__username'],
                'display_name': f"{item['student__last_name']}{item['student__first_name']}"
                               if item['student__first_name'] else item['student__username'],
                'total_submissions': total,
                'success_count': item['success_count'],
                'fail_count': item['fail_count'],
                'error_count': item['error_count'],
                'pass_rate': round(pass_rate, 2),
                'avg_score': round(item['avg_score'] or 0, 2),
                'unique_problems': item['unique_problems'],
                'last_submit_time': item['last_submit_time'].isoformat() if item['last_submit_time'] else None,
                'risk_level': risk_level,
                'risk_reasons': risk_reasons
            })

        return {
            'students': student_list,
            'total_students': User.objects.filter(is_staff=False).count()
        }

    @staticmethod
    def get_error_insights(teacher=None, start_date=None, end_date=None,
                          problem_id=None, limit=10):
        """
        获取共性错误洞察

        Args:
            teacher: 教师用户对象
            start_date: 开始日期
            end_date: 结束日期
            problem_id: 题目ID筛选
            limit: 返回错误类型数量限制

        Returns:
            dict: 包含错误洞察数据
        """
        submissions = Submission.objects.filter(
            error_type__isnull=False
        ).exclude(error_type='')

        if start_date:
            submissions = submissions.filter(created_at__gte=start_date)
        if end_date:
            submissions = submissions.filter(created_at__lte=end_date)
        if problem_id:
            submissions = submissions.filter(problem_id=problem_id)

        # 统计错误类型分布
        error_stats = submissions.values('error_type').annotate(
            count=Count('id'),
            unique_students=Count('student', distinct=True),
            unique_problems=Count('problem', distinct=True)
        ).order_by('-count')[:limit]

        # 格式化返回数据
        error_list = []
        total_errors = submissions.count()

        for item in error_stats:
            percentage = (item['count'] / total_errors * 100) if total_errors > 0 else 0

            # 获取该错误类型的典型样例
            sample_submission = submissions.filter(
                error_type=item['error_type']
            ).first()

            error_list.append({
                'error_type': item['error_type'],
                'count': item['count'],
                'percentage': round(percentage, 2),
                'unique_students': item['unique_students'],
                'unique_problems': item['unique_problems'],
                'sample_submission_id': sample_submission.id if sample_submission else None
            })

        return {
            'errors': error_list,
            'total_error_submissions': total_errors
        }

    @staticmethod
    def get_diagnosis_insights(teacher=None, start_date=None, end_date=None, limit=10):
        """
        获取诊断洞察数据

        Args:
            teacher: 教师用户对象
            start_date: 开始日期
            end_date: 结束日期
            limit: 返回数量限制

        Returns:
            dict: 包含诊断洞察数据
        """
        diagnoses = DiagnosisRecord.objects.all()

        if start_date:
            diagnoses = diagnoses.filter(created_at__gte=start_date)
        if end_date:
            diagnoses = diagnoses.filter(created_at__lte=end_date)

        # 统计诊断来源分布
        source_stats = diagnoses.values('source').annotate(
            count=Count('id')
        ).order_by('-count')

        # 统计平均响应时间
        avg_latency = diagnoses.aggregate(avg=Avg('latency_ms'))['avg'] or 0

        # 统计诊断状态分布
        status_stats = diagnoses.values('status').annotate(
            count=Count('id')
        ).order_by('-count')

        return {
            'source_distribution': list(source_stats),
            'status_distribution': list(status_stats),
            'avg_latency_ms': round(avg_latency, 2),
            'total_diagnoses': diagnoses.count()
        }
