"""
可视化反馈视图函数
提供 API 接口返回前端可渲染的过程型反馈数据
"""
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404

from apps.submissions.models import Submission
from apps.diagnosis.models import DiagnosisRecord
from .builder_v3 import VisualizationPayloadBuilder  # Day3: 使用最终版（集成诊断融合）


@login_required
@require_http_methods(["GET"])
def get_visual_feedback(request, submission_id):
    """
    获取指定提交的可视化反馈数据

    接口: GET /api/submissions/{submission_id}/visual-feedback
    权限: 已登录用户（学生只能查看自己的提交，教师可查看所有）

    返回:
    {
        "ok": true,
        "data": {
            "payload_version": "1.0",
            "generated_at": "2026-03-07T14:32:15Z",
            "submission_id": 9001,
            "problem_id": 101,
            "summary": {...},
            "timeline": [...],
            "evidence": {...},
            "suggestions": [...]
        }
    }

    错误码:
    - VIS_001: Submission 不存在 (404)
    - VIS_002: 无权限访问 (403)
    - VIS_003: 数据生成失败 (500)
    """
    try:
        # 1. 获取 Submission 记录
        submission = get_object_or_404(Submission, id=submission_id)

        # 2. 权限检查：学生只能查看自己的提交
        if request.user.role == 'student' and submission.user_id != request.user.id:
            return JsonResponse({
                "ok": False,
                "message": "无权限访问此提交记录",
                "error_code": "VIS_002"
            }, status=403)

        # 3. 获取关联的诊断记录（如果有）
        try:
            diagnosis = DiagnosisRecord.objects.filter(
             submission_id=submission_id
            ).order_by('-created_at').first()
        except DiagnosisRecord.DoesNotExist:
            diagnosis = None

        # 4. 构建可视化反馈数据
        builder = VisualizationPayloadBuilder(submission, diagnosis)
        payload = builder.build()

        # 5. 返回 JSON 响应
        return JsonResponse({
            "ok": True,
            "message": "success",
            "data": payload.to_dict()
        }, status=200)

    except Submission.DoesNotExist:
        return JsonResponse({
            "ok": False,
            "message": "提交记录不存在",
       "error_code": "VIS_001"
        }, status=404)

    except Exception as e:
        # 记录错误日志
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"生成可视化反馈失败: submission_id={submission_id}, error={str(e)}")

        return JsonResponse({
            "ok": False,
            "message": "数据生成失败，请稍后重试",
            "error_code": "VIS_003",
            "detail": str(e) if request.user.is_staff else None
        }, status=500)


@login_required
@require_http_methods(["GET"])
def get_visual_feedback_batch(request):
    """
    批量获取可视化反馈数据（用于教师端统计分析）

    接口: GET /api/visual-feedback/batch?submission_ids=1,2,3
    权限: 仅教师

    返回:
    {
        "ok": true,
        "data": [
            {"submission_id": 1, "payload": {...}},
            {"submission_id": 2, "payload": {...}}
        ],
        "failed": [
            {"submission_id": 3, "error": "数据不存在"}
        ]
    }
    """
    # 权限检查：仅教师可用
    if request.user.role != 'teacher':
        return JsonResponse({
            "ok": False,
            "message": "仅教师可使用批量查询功能",
            "error_code": "VIS_002"
        }, status=403)

    # 解析提交ID列表
    submission_ids_str = request.GET.get('submission_ids', '')
    if not submission_ids_str:
        return JsonResponse({
            "ok": False,
            "message": "缺少 submission_ids 参数",
            "error_code": "PARAM_MISSING"
        }, status=400)

    try:
        submission_ids = [int(sid.strip()) for sid in submission_ids_str.split(',')]
    except ValueError:
        return JsonResponse({
            "ok": False,
            "message": "submission_ids 格式错误，应为逗号分隔的数字",
            "error_code": "PARAM_INVALID"
        }, status=400)

    # 限制批量查询数量
    if len(submission_ids) > 50:
        return JsonResponse({
            "ok": False,
            "message": "单次最多查询50条记录",
            "error_code": "LIMIT_EXCEEDED"
        }, status=400)

    # 批量处理
    results = []
    failed = []

    for submission_id in submission_ids:
        try:
            submission = Submission.objects.get(id=submission_id)
            diagnosis = DiagnosisRecord.objects.filter(
                submission_id=submission_id
            ).order_by('-created_at').first()

            builder = VisualizationPayloadBuilder(submission, diagnosis)
            payload = builder.build()

            results.append({
                "submission_id": submission_id,
                "payload": payload.to_dict()
            })

        except Submission.DoesNotExist:
            failed.append({
                "submission_id": submission_id,
                "error": "提交记录不存在"
            })

        except Exception as e:
            failed.append({
                "submission_id": submission_id,
                "error": str(e)
            })

    return JsonResponse({
        "ok": True,
        "message": f"成功处理 {len(results)}/{len(submission_ids)} 条记录",
        "data": results,
        "failed": failed
    }, status=200)


@login_required
@require_http_methods(["GET"])
def get_protocol_version(request):
    """
    获取当前协议版本信息

    接口: GET /api/visual-feedback/protocol-version
    权限: 已登录

    返回:
    {
        "ok": true,
        "data": {
            "version": "1.0",
            "supported_versions": ["1.0"],
            "changelog": "初始版本"
        }
    }
    """
    return JsonResponse({
        "ok": True,
        "data": {
            "version": VisualizationPayloadBuilder.PAYLOAD_VERSION,
            "supported_versions": ["1.0"],
            "changelog": "初始版本：支持基础时间线、证据和建议结构",
            "documentation_url": "/docs/visualization_protocol_v1.md"
        }
    }, status=200)


@login_required
@require_http_methods(["POST"])
def regenerate_visual_feedback(request, submission_id):
    """
    重新生成可视化反馈数据（用于数据修复或协议升级）

    接口: POST /api/submissions/{submission_id}/visual-feedback/regenerate
    权限: 仅教师

    说明:
    当前版本直接返回实时生成的数据，未来可扩展为异步任务
    """
    # 权限检查
    if request.user.role != 'teacher':
        return JsonResponse({
            "ok": False,
            "message": "仅教师可重新生成反馈数据",
            "error_code": "VIS_002"
        }, status=403)

    # 调用生成逻辑（复用 get_visual_feedback）
    return get_visual_feedback(request, submission_id)
