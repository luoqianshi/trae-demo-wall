"""
诊断模块视图
"""
import json
import logging
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import ensure_csrf_cookie
from apps.common.utils import success_response, error_response
from . import services
from .diagnosis_service import get_diagnosis_service
from .tasks import async_generate_diagnosis, get_task_status

logger = logging.getLogger(__name__)


@require_http_methods(["POST"])
@login_required
@ensure_csrf_cookie
def generate_diagnosis_view(request):
    """
    生成诊断接口
    POST /api/diagnosis/run

    Request Body:
    {
        "submission_id": 7,
        "force_new": false  # 可选，是否强制生成新诊断
    }

    Response:
    {
        "ok": true,
        "data": {
            "diagnosis_id": 1,
            "status": "success",  # success/fallback/failed
            "source": "llm",      # llm/template/cache
            "diagnosis_text": "...",
            "diagnosis_data": {...},
            "latency_ms": 4500,
            "provider": "ollama",
            "model": "qwen2.5-coder:7b"
        }
    }
    """
    try:
        # 1. 解析请求参数
        try:
            body = json.loads(request.body)
        except json.JSONDecodeError:
            return error_response('请求数据格式错误', error_code='INVALID_JSON')

        submission_id = body.get('submission_id')
        force_new = body.get('force_new', False)
        diagnosis_type = body.get('diagnosis_type', 'error')  # 默认为错误诊断

        # 2. 参数校验
        if not submission_id:
            return error_response('提交ID不能为空', error_code='MISSING_PARAM')

        # 3. 执行诊断
        try:
            diagnosis_service = get_diagnosis_service()
            diagnosis_record = diagnosis_service.diagnose(
                submission_id,
                force_new=force_new,
                diagnosis_type=diagnosis_type
            )
        except ValueError as e:
            return error_response(str(e), error_code='INVALID_SUBMISSION')
        except Exception as e:
            logger.error(f"Diagnosis failed: {str(e)}", exc_info=True)
            return error_response(f'诊断失败: {str(e)}', error_code='DIAGNOSIS_FAILED')

        # 4. 构建响应数据
        response_data = {
            'diagnosis_id': diagnosis_record.id,
            'status': diagnosis_record.status,
            'source': diagnosis_record.source,
            'diagnosis_text': diagnosis_record.diagnosis_text,
            'diagnosis_data': diagnosis_record.diagnosis_data,
            'latency_ms': diagnosis_record.latency_ms,
            'provider': diagnosis_record.provider,
            'model': diagnosis_record.model_name,
            'created_at': diagnosis_record.created_at.isoformat()
        }

        logger.info(f"Diagnosis generated: id={diagnosis_record.id}, status={diagnosis_record.status}")

        return success_response(
            message='诊断生成成功',
            data=response_data
        )

    except Exception as e:
        logger.error(f"Unexpected error in generate_diagnosis_view: {str(e)}", exc_info=True)
        return error_response(
            f'系统错误: {str(e)}',
            error_code='SYSTEM_ERROR'
        )


@require_http_methods(["GET"])
@login_required
def diagnosis_history_view(request):
    """
    诊断历史接口
    GET /api/diagnosis/history?problem_id=1&page=1&page_size=20

    Query Parameters:
    - problem_id: 题目ID（可选）
    - page: 页码（可选，默认1）
    - page_size: 每页数量（可选，默认20）

    Response:
    {
        "ok": true,
        "data": {
            "diagnoses": [
                {
                    "id": 1,
                    "submission_id": 7,
                    "problem_title": "判断偶数",
                    "status": "success",
                    "source": "llm",
                    "diagnosis_preview": "...",
                    "created_at": "2026-03-07T20:00:00Z"
                }
            ],
            "total": 10,
            "page": 1,
            "page_size": 20,
            "total_pages": 1
        }
    }
    """
    try:
        # 1. 解析查询参数
        problem_id = request.GET.get('problem_id')
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 20))

        # 参数校验
        if page < 1:
            page = 1
        if page_size < 1 or page_size > 100:
            page_size = 20

        # 2. 获取诊断历史
        result = services.list_diagnosis_history(
            student=request.user,
            problem_id=problem_id,
            page=page,
            page_size=page_size
        )

        # 3. 构建响应数据
        diagnoses_data = []
        for diagnosis in result['diagnoses']:
            diagnoses_data.append({
                'id': diagnosis.id,
                'submission_id': diagnosis.submission.id,
                'problem_id': diagnosis.problem.id,
                'problem_title': diagnosis.problem.title,
                'status': diagnosis.status,
                'source': diagnosis.source,
                'diagnosis_preview': diagnosis.get_diagnosis_preview(100),
                'latency_ms': diagnosis.latency_ms,
                'created_at': diagnosis.created_at.isoformat()
            })

        response_data = {
            'diagnoses': diagnoses_data,
            'total': result['total'],
            'page': result['page'],
            'page_size': result['page_size'],
            'total_pages': result['total_pages']
        }

        return success_response(
            message='Diagnosis history retrieved successfully',
            data=response_data
        )

    except ValueError as e:
        return error_response(f'Invalid parameter: {str(e)}', error_code='INVALID_PARAM')
    except Exception as e:
        logger.error(f"Unexpected error in diagnosis_history_view: {str(e)}", exc_info=True)
        return error_response(
            f'System error: {str(e)}',
            error_code='SYSTEM_ERROR'
        )


@require_http_methods(["GET"])
@login_required
def submission_diagnosis_view(request, submission_id):
    """
    获取提交的最新诊断
    GET /api/submissions/{submission_id}/diagnosis

    Response:
    {
        "ok": true,
        "data": {
            "diagnosis_id": 1,
            "status": "success",
            "diagnosis_text": "...",
            "diagnosis_data": {...},
            "source": "llm",
            "created_at": "2026-03-07T20:00:00Z"
        }
    }
    """
    try:
        # 获取该提交的最新诊断
        from .models import DiagnosisRecord
        diagnosis = DiagnosisRecord.objects.filter(
            submission_id=submission_id
        ).order_by('-created_at').first()

        if not diagnosis:
            return error_response('No diagnosis found for this submission', error_code='NOT_FOUND')

        # 权限检查：只能查看自己的诊断
        if diagnosis.student != request.user and not request.user.is_staff:
            return error_response('Permission denied', error_code='PERMISSION_DENIED')

        # 构建响应数据
        data = {
            'diagnosis_id': diagnosis.id,
            'submission_id': diagnosis.submission.id,
            'status': diagnosis.status,
            'source': diagnosis.source,
            'diagnosis_text': diagnosis.diagnosis_text,
            'diagnosis_data': diagnosis.diagnosis_data,
            'latency_ms': diagnosis.latency_ms,
            'provider': diagnosis.provider,
            'model': diagnosis.model_name,
            'created_at': diagnosis.created_at.isoformat()
        }

        return success_response(
            message='Diagnosis retrieved successfully',
            data=data
        )

    except Exception as e:
        logger.error(f"Unexpected error in submission_diagnosis_view: {str(e)}", exc_info=True)
        return error_response(
            f'System error: {str(e)}',
            error_code='SYSTEM_ERROR'
        )


@require_http_methods(["POST"])
@login_required
@ensure_csrf_cookie
def async_diagnosis_view(request):
    """
    异步诊断接口（第8阶段新增）
    POST /api/diagnosis/async/generate

    Request Body:
    {
        "submission_id": 7,
        "force_llm": false
    }

    Response:
    {
        "ok": true,
        "data": {
            "task_id": "abc123-def456-...",
            "status": "queued",
            "message": "诊断任务已提交，请使用task_id查询结果"
        }
    }
    """
    try:
        # 解析请求参数
        try:
            body = json.loads(request.body)
        except json.JSONDecodeError:
            return error_response('请求数据格式错误', error_code='INVALID_JSON')

        submission_id = body.get('submission_id')
        force_llm = body.get('force_llm', False)

        if not submission_id:
            return error_response('提交ID不能为空', error_code='MISSING_PARAM')

        # 提交异步任务
        task = async_generate_diagnosis.delay(submission_id, force_llm)

        logger.info(f"异步诊断任务已提交 task_id={task.id} submission_id={submission_id}")

        return success_response(
            message='诊断任务已提交',
            data={
                'task_id': task.id,
                'status': 'queued',
                'submission_id': submission_id
            }
        )

    except Exception as e:
        logger.error(f"提交异步诊断任务失败: {str(e)}", exc_info=True)
        return error_response(f'系统错误: {str(e)}', error_code='SYSTEM_ERROR')


@require_http_methods(["GET"])
@login_required
def async_task_status_view(request, task_id):
    """
    查询异步任务状态
    GET /api/diagnosis/async/status/{task_id}

    Response:
    {
        "ok": true,
        "data": {
            "task_id": "abc123-def456-...",
            "status": "success",  # queued/running/success/failed/retry
            "diagnosis_id": 123,
            "duration_ms": 4500,
            "completed_at": 1234567890.123
        }
    }
    """
    try:
        # 获取任务状态
        task_info = get_task_status(task_id)

        return success_response(
            message='任务状态查询成功',
            data=task_info
        )

    except Exception as e:
        logger.error(f"查询任务状态失败: {str(e)}", exc_info=True)
        return error_response(f'系统错误: {str(e)}', error_code='SYSTEM_ERROR')

