"""
诊断模块Service层
封装诊断记录相关的业务逻辑和数据访问
"""
import time
import logging
from typing import Dict, Any, Optional
from django.conf import settings
from django.db.models import Count, Avg
from .models import DiagnosisRecord
from apps.submissions.models import Submission

logger = logging.getLogger(__name__)


def create_diagnosis_record(submission_id, diagnosis_text, source='template', latency_ms=0):
    """
    创建诊断记录

    Args:
        submission_id: 提交ID
        diagnosis_text: 诊断内容
        source: 诊断来源（llm/template/cache）
        latency_ms: 响应延迟（毫秒）

    Returns:
        DiagnosisRecord对象或None
    """
    try:
        submission = Submission.objects.select_related('problem', 'student').get(id=submission_id)

        # 生成代码哈希
        code_hash = DiagnosisRecord.generate_code_hash(
            submission.code_text,
            submission.error_type or ''
        )

        diagnosis = DiagnosisRecord.objects.create(
            submission=submission,
            problem=submission.problem,
            student=submission.student,
            code_hash=code_hash,
            error_type=submission.error_type,
            diagnosis_text=diagnosis_text,
            source=source,
            latency_ms=latency_ms
        )
        return diagnosis
    except Submission.DoesNotExist:
        return None


def find_cached_diagnosis(code_text, error_type):
    """
    查找缓存的诊断记录

    Args:
        code_text: 代码文本
        error_type: 错误类型

    Returns:
        DiagnosisRecord对象或None
    """
    code_hash = DiagnosisRecord.generate_code_hash(code_text, error_type or '')
    return DiagnosisRecord.find_cached_diagnosis(code_hash, error_type)


def list_diagnosis_history(student, problem_id=None, page=1, page_size=20):
    """
    获取学生的诊断历史

    Args:
        student: 学生User对象
        problem_id: 题目ID（可选）
        page: 页码
        page_size: 每页数量

    Returns:
        dict: {
            'diagnoses': 诊断列表,
            'total': 总数量,
            'page': 当前页,
            'page_size': 每页数量,
            'total_pages': 总页数
        }
    """
    queryset = DiagnosisRecord.objects.filter(student=student)

    # 题目筛选
    if problem_id:
        queryset = queryset.filter(problem_id=problem_id)

    # 统计总数
    total = queryset.count()

    # 分页
    start = (page - 1) * page_size
    end = start + page_size
    diagnoses = list(queryset.select_related('problem', 'submission')[start:end])

    # 计算总页数
    total_pages = (total + page_size - 1) // page_size

    return {
        'diagnoses': diagnoses,
        'total': total,
        'page': page,
        'page_size': page_size,
        'total_pages': total_pages
    }


def get_diagnosis_detail(diagnosis_id):
    """
    获取诊断详情

    Args:
        diagnosis_id: 诊断ID

    Returns:
        DiagnosisRecord对象或None
    """
    try:
        return DiagnosisRecord.objects.select_related(
            'student', 'problem', 'submission'
        ).get(id=diagnosis_id)
    except DiagnosisRecord.DoesNotExist:
        return None


def get_diagnosis_statistics():
    """
    获取诊断统计信息

    Returns:
        dict: {
            'total': 总诊断数,
            'by_source': 按来源统计,
            'avg_latency': 平均延迟,
            'top_errors': 常见错误类型
        }
    """
    total = DiagnosisRecord.objects.count()

    # 按来源统计
    by_source = DiagnosisRecord.objects.values('source').annotate(
        count=Count('id')
    )

    # 平均延迟
    avg_latency = DiagnosisRecord.objects.aggregate(
        Avg('latency_ms')
    )['latency_ms__avg'] or 0

    # 常见错误类型
    top_errors = DiagnosisRecord.objects.filter(
        error_type__isnull=False
    ).values('error_type').annotate(
        count=Count('id')
    ).order_by('-count')[:10]

    return {
        'total': total,
        'by_source': list(by_source),
        'avg_latency': round(avg_latency, 2),
        'top_errors': list(top_errors)
    }


def get_problem_diagnosis_statistics(problem_id):
    """
    获取某题的诊断统计

    Args:
        problem_id: 题目ID

    Returns:
        dict: 统计信息
    """
    diagnoses = DiagnosisRecord.objects.filter(problem_id=problem_id)

    total = diagnoses.count()

    # 错误类型分布
    error_distribution = diagnoses.filter(
        error_type__isnull=False
    ).values('error_type').annotate(
        count=Count('id')
    ).order_by('-count')

    # 诊断来源分布
    source_distribution = diagnoses.values('source').annotate(
        count=Count('id')
    )

    return {
        'total_diagnoses': total,
        'error_distribution': list(error_distribution),
        'source_distribution': list(source_distribution)
    }


def get_cache_hit_rate():
    """
    获取诊断缓存命中率

    Returns:
        dict: {
            'total': 总诊断数,
            'cache_hits': 缓存命中数,
            'hit_rate': 命中率（百分比）
        }
    """
    total = DiagnosisRecord.objects.count()
    cache_hits = DiagnosisRecord.objects.filter(source='cache').count()
    hit_rate = (cache_hits / total * 100) if total > 0 else 0

    return {
        'total': total,
        'cache_hits': cache_hits,
        'hit_rate': round(hit_rate, 2)
    }
