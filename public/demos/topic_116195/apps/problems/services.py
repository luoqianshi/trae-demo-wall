"""
题目管理模块Service层
封装题目相关的业务逻辑和数据访问
"""
from django.db.models import Count, Q
from .models import Problem


def get_problem_list(difficulty=None, keyword=None, page=1, page_size=20):
    """
    获取题目列表

    Args:
        difficulty: 难度筛选（easy/medium/hard）
        keyword: 关键词搜索（标题或描述）
        page: 页码
        page_size: 每页数量

    Returns:
        dict: {
            'problems': 题目列表,
            'total': 总数量,
            'page': 当前页,
            'page_size': 每页数量,
            'total_pages': 总页数
        }
    """
    queryset = Problem.objects.all()

    # 难度筛选
    if difficulty:
        queryset = queryset.filter(difficulty=difficulty)

    # 关键词搜索
    if keyword:
        queryset = queryset.filter(
            Q(title__icontains=keyword) | Q(description__icontains=keyword)
        )

    # 统计总数
    total = queryset.count()

    # 分页
    start = (page - 1) * page_size
    end = start + page_size
    problems = list(queryset[start:end])

    # 计算总页数
    total_pages = (total + page_size - 1) // page_size

    return {
        'problems': problems,
        'total': total,
        'page': page,
        'page_size': page_size,
        'total_pages': total_pages
    }


def get_problem_detail(problem_id):
    """
    获取题目详情

    Args:
        problem_id: 题目ID

    Returns:
        Problem对象或None
    """
    try:
        return Problem.objects.get(id=problem_id)
    except Problem.DoesNotExist:
        return None


def create_problem(title, description, difficulty, test_cases, created_by=None,
                   class_ids=None, deadline=None, instructions=None, is_published=True):
    """
    创建题目

    Args:
        title: 题目标题
        description: 题目描述
        difficulty: 难度
        test_cases: 测试用例列表
        created_by: 创建者（User对象）
        class_ids: 班级ID列表（可选）
        deadline: 截止时间（可选）
        instructions: 题目说明（可选）
        is_published: 是否发布（默认True）

    Returns:
        Problem对象
    """
    problem = Problem.objects.create(
        title=title,
        description=description,
        difficulty=difficulty,
        created_by=created_by,
        deadline=deadline,
        instructions=instructions,
        is_published=is_published
    )
    problem.test_cases = test_cases
    problem.save()

    # 关联班级
    if class_ids:
        problem.classes.set(class_ids)

    return problem


def update_problem(problem_id, **kwargs):
    """
    更新题目

    Args:
        problem_id: 题目ID
        **kwargs: 要更新的字段

    Returns:
        更新后的Problem对象或None
    """
    try:
        problem = Problem.objects.get(id=problem_id)

        # 更新字段
        for key, value in kwargs.items():
            if key == 'test_cases':
                problem.test_cases = value
            elif hasattr(problem, key):
                setattr(problem, key, value)

        problem.save()
        return problem
    except Problem.DoesNotExist:
        return None


def delete_problem(problem_id):
    """
    删除题目

    Args:
        problem_id: 题目ID

    Returns:
        bool: 是否删除成功
    """
    try:
        problem = Problem.objects.get(id=problem_id)
        problem.delete()
        return True
    except Problem.DoesNotExist:
        return False


def get_problem_statistics():
    """
    获取题目统计信息

    Returns:
        dict: {
            'total': 总题目数,
            'by_difficulty': 按难度统计,
            'recent_count': 最近7天新增数量
        }
    """
    from django.utils import timezone
    from datetime import timedelta

    total = Problem.objects.count()

    # 按难度统计
    by_difficulty = Problem.objects.values('difficulty').annotate(
        count=Count('id')
    )

    # 最近7天新增
    seven_days_ago = timezone.now() - timedelta(days=7)
    recent_count = Problem.objects.filter(created_at__gte=seven_days_ago).count()

    return {
        'total': total,
        'by_difficulty': list(by_difficulty),
        'recent_count': recent_count
    }
