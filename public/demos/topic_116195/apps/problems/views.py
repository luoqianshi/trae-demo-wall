"""
题目管理模块视图
"""
from django.views.decorators.http import require_http_methods
from django.core.paginator import Paginator
from django.db.models import Q, Count, Avg
from apps.common.utils import success_response, error_response
from .models import Problem


@require_http_methods(["GET", "POST"])
def problem_list_create_view(request):
    """
    题目列表与创建接口
    GET /api/problems/ - 获取题目列表
    POST /api/problems/ - 创建新题目（教师）
    """
    if request.method == 'GET':
        # 获取查询参数
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 20))
        difficulty = request.GET.get('difficulty', '')
        search = request.GET.get('search', '')

        # 构建查询：只显示已发布的题目
        queryset = Problem.objects.filter(is_published=True)

        # 如果是学生，只显示其班级的题目（不包括公共题目）
        if request.user.is_authenticated and not request.user.is_staff:
            from apps.teacher.models import ClassStudent
            # 获取学生所在的班级
            student_classes = ClassStudent.objects.filter(
                student=request.user
            ).values_list('class_obj_id', flat=True)

            # 只筛选班级题目
            queryset = queryset.filter(classes__id__in=student_classes).distinct()

        # 难度筛选
        if difficulty:
            queryset = queryset.filter(difficulty=difficulty)

        # 搜索（标题或描述）
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | Q(description__icontains=search)
            )

        # 添加统计信息
        queryset = queryset.annotate(
            submission_count=Count('submissions'),
            avg_score=Avg('submissions__score')
        )

        # 分页
        paginator = Paginator(queryset, page_size)
        page_obj = paginator.get_page(page)

        # 构建返回数据
        problems = []
        for problem in page_obj:
            # 计算通过率
            total_submissions = problem.submission_count
            if total_submissions > 0:
                pass_rate = problem.avg_score or 0
            else:
                pass_rate = 0

            problems.append({
                'id': problem.id,
                'title': problem.title,
                'description': problem.description,
                'difficulty': problem.difficulty,
                'test_cases_count': problem.test_cases_count,
                'submission_count': total_submissions,
                'pass_rate': pass_rate,
                'created_at': problem.created_at.isoformat(),
                'updated_at': problem.updated_at.isoformat(),
            })

        return success_response(
            message='获取题目列表成功',
            data={
                'problems': problems,
                'total': paginator.count,
                'page': page,
                'page_size': page_size,
                'total_pages': paginator.num_pages,
            }
        )
    else:
        return success_response(
            message='创建题目成功（占位）',
            data={'id': 1}
        )


@require_http_methods(["GET", "PUT", "DELETE"])
def problem_detail_view(request, problem_id):
    """
    题目详情接口（占位）
    GET /api/problems/<id> - 获取题目详情
    PUT /api/problems/<id> - 更新题目（教师）
    DELETE /api/problems/<id> - 删除题目（教师）
    """
    return success_response(
        message=f'题目{problem_id}操作成功（占位）',
        data={'id': problem_id}
    )
