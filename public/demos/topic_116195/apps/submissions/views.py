"""
提交与评测模块视图
"""
import json
import uuid
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import ensure_csrf_cookie
from apps.common.utils import success_response, error_response
from . import services
import logging

logger = logging.getLogger(__name__)


@require_http_methods(["POST"])
@login_required
@ensure_csrf_cookie
def quick_run_view(request):
    """
    快速运行代码接口（不保存提交记录）
    POST /api/submissions/quick-run

    Request Body:
    {
        "code": "n=int(input())\\nprint(n%2==0)",
        "input": "5"
    }

    Response:
    {
        "ok": true,
        "data": {
            "success": true,
            "output": "False",
            "error": null,
            "execution_time": 0.05
        }
    }
    """
    try:
        # 解析请求参数
        try:
            body = json.loads(request.body)
        except json.JSONDecodeError:
            return error_response('请求数据格式错误', error_code='INVALID_JSON')

        code = body.get('code', '')
        if code is None:
            code = ''
        code = code.strip()

        input_data = body.get('input', '')
        if input_data is None:
            input_data = ''

        if not code:
            return error_response('代码不能为空', error_code='EMPTY_CODE')

        # 执行代码
        result = services.quick_execute_code(code, input_data)

        return success_response(
            message='代码执行成功',
            data=result
        )

    except Exception as e:
        logger.error(f"Quick run error: {str(e)}", exc_info=True)
        return error_response(
            f'执行错误: {str(e)}',
            error_code='EXECUTION_ERROR'
        )


@require_http_methods(["POST"])
@login_required
@ensure_csrf_cookie
def run_submission_view(request):
    """
    提交运行结果接口
    POST /api/submissions/run

    Request Body:
    {
        "problem_id": 101,
        "code": "n=int(input())\\nprint(n%2==0)",
        "language": "python"  # 可选，默认python
    }

    Response:
    {
        "ok": true,
        "data": {
            "submission_id": 9001,
            "status": "success",  # success/fail/error
            "score": 100,
            "pass_count": 3,
            "total_count": 3,
            "pass_rate": 100.0,
            "total_time": 0.123,
            "test_results": [...],  # 详细测试结果
            "first_error": {...}    # 第一个错误（如果有）
        }
    }
    """
    try:
        # 1. 解析请求参数
        try:
            body = json.loads(request.body)
        except json.JSONDecodeError:
            return error_response('请求数据格式错误', error_code='INVALID_JSON')

        problem_id = body.get('problem_id')
        code_text = body.get('code_text') or body.get('code', '')
        code_text = code_text.strip() if code_text else ''
        language = body.get('language', 'python')

        # 2. 参数校验
        if not problem_id:
            return error_response('题目ID不能为空', error_code='MISSING_PARAM')

        if not code_text:
            return error_response('代码不能为空', error_code='EMPTY_CODE')

        if language != 'python':
            return error_response('当前仅支持Python语言', error_code='UNSUPPORTED_LANGUAGE')

        # 3. 生成trace_id用于日志追踪
        trace_id = str(uuid.uuid4())[:8]
        logger.info(f"[{trace_id}] Submission request: user={request.user.username}, "
                   f"problem_id={problem_id}, code_length={len(code_text)}")

        # 4. 执行代码并判题
        result = services.execute_and_judge_submission(
            student=request.user,
            problem_id=problem_id,
            code_text=code_text,
            language=language
        )

        if not result['success']:
            logger.warning(f"[{trace_id}] Submission failed: {result['error']}")
            return error_response(result['error'], error_code='EXECUTION_FAILED')

        # 5. 构建响应数据
        submission = result['submission']
        execution_result = result['execution_result']

        response_data = {
            'submission_id': submission.id,
            'status': submission.run_status,
            'score': submission.score,
            'pass_count': execution_result['pass_count'],
            'total_count': execution_result['total_count'],
            'pass_rate': execution_result['pass_rate'],
            'total_time': execution_result['total_time'],
            'test_results': execution_result['test_results'],
            'first_error': execution_result['first_error'],
            'trace_id': trace_id
        }

        logger.info(f"[{trace_id}] Submission success: submission_id={submission.id}, "
                   f"status={submission.run_status}, score={submission.score}")

        return success_response(
            message='提交成功',
            data=response_data
        )

    except Exception as e:
        logger.error(f"Unexpected error in run_submission_view: {str(e)}", exc_info=True)
        return error_response(
            f'系统错误: {str(e)}',
            error_code='SYSTEM_ERROR'
        )


@require_http_methods(["GET"])
@login_required
def my_submissions_view(request):
    """
    我的提交记录接口
    GET /api/submissions/mine?problem_id=101&status=success&page=1&page_size=20

    Query Parameters:
    - problem_id: 题目ID（可选）
    - status: 运行状态筛选（可选）：pending/success/fail/error
    - page: 页码（可选，默认1）
    - page_size: 每页数量（可选，默认20）

    Response:
    {
        "ok": true,
        "data": {
            "submissions": [
                {
                    "id": 9001,
                    "problem_id": 101,
                    "problem_title": "两数之和",
                    "status": "success",
                    "score": 100,
                    "code_preview": "n=int(input())...",
                    "error_type": "",
                    "created_at": "2026-03-07T10:30:00Z"
                }
            ],
            "total": 50,
            "page": 1,
            "page_size": 20,
            "total_pages": 3
        }
    }
    """
    try:
        # 1. 解析查询参数
        problem_id = request.GET.get('problem_id')
        run_status = request.GET.get('status')
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 20))

        # 参数校验
        if page < 1:
            page = 1
        if page_size < 1 or page_size > 100:
            page_size = 20

        # 2. 获取提交列表
        result = services.list_student_submissions(
            student=request.user,
            problem_id=problem_id,
            run_status=run_status,
            page=page,
            page_size=page_size
        )

        # 3. 构建响应数据
        submissions_data = []
        for submission in result['submissions']:
            submissions_data.append({
                'id': submission.id,
                'problem_id': submission.problem.id,
                'problem_title': submission.problem.title,
                'status': submission.run_status,
                'score': submission.score,
                'code_preview': submission.get_code_preview(100),
                'error_type': submission.error_type or '',
                'created_at': submission.created_at.isoformat()
            })

        response_data = {
            'submissions': submissions_data,
            'total': result['total'],
            'page': result['page'],
            'page_size': result['page_size'],
            'total_pages': result['total_pages']
        }

        return success_response(
            message='Submissions retrieved successfully',
            data=response_data
        )

    except ValueError as e:
        return error_response(f'Invalid parameter: {str(e)}', error_code='INVALID_PARAM')
    except Exception as e:
        logger.error(f"Unexpected error in my_submissions_view: {str(e)}", exc_info=True)
        return error_response(
            f'System error: {str(e)}',
            error_code='SYSTEM_ERROR'
        )


@require_http_methods(["GET"])
@login_required
def submission_detail_view(request, submission_id):
    """
    获取提交详情接口
    GET /api/submissions/{submission_id}

    Response:
    {
        "ok": true,
        "data": {
            "id": 9001,
            "problem": {...},
            "code": "...",
            "status": "success",
            "score": 100,
            "stdout": "...",
            "error_type": "",
            "error_trace": "",
            "created_at": "2026-03-07T10:30:00Z"
        }
    }
    """
    try:
        submission = services.get_submission_detail(submission_id)

        if not submission:
            return error_response('Submission not found', error_code='NOT_FOUND')

        # 权限检查：只能查看自己的提交（或教师可以查看所有）
        if submission.student != request.user and not request.user.is_staff:
            return error_response('Permission denied', error_code='PERMISSION_DENIED')

        # 构建响应数据
        data = {
            'id': submission.id,
            'problem': {
                'id': submission.problem.id,
                'title': submission.problem.title,
                'difficulty': submission.problem.difficulty
            },
            'code': submission.code_text,
            'status': submission.run_status,
            'score': submission.score,
            'stdout': submission.stdout_text or '',
            'error_type': submission.error_type or '',
            'error_trace': submission.error_trace or '',
            'created_at': submission.created_at.isoformat()
        }

        return success_response(
            message='Submission detail retrieved successfully',
            data=data
        )

    except Exception as e:
        logger.error(f"Unexpected error in submission_detail_view: {str(e)}", exc_info=True)
        return error_response(
            f'System error: {str(e)}',
            error_code='SYSTEM_ERROR'
        )

