"""
通用功能视图函数
提供监控指标和健康检查接口
"""
import logging
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from .monitoring import MetricsCollector, HealthChecker
from .utils import success_response, error_response

logger = logging.getLogger(__name__)


@require_http_methods(["GET"])
def health_check_view(request):
    """
    健康检查接口
    GET /api/common/health

    Response:
    {
        "status": "healthy",
        "checks": {
            "database": {"status": "ok", "message": "..."},
            "cache": {"status": "ok", "message": "..."},
            "metrics": {"status": "ok", "message": "..."}
        },
        "timestamp": "2026-03-07T10:30:00Z"
    }
    """
    try:
        health_status = HealthChecker.check_system_health()
        return JsonResponse(health_status)

    except Exception as e:
        logger.error(f"健康检查失败: {str(e)}", exc_info=True)
        return JsonResponse({
            'status': 'error',
            'message': str(e),
            'timestamp': None
        }, status=500)


@require_http_methods(["GET"])
@login_required
def metrics_view(request):
    """
    监控指标接口
    GET /api/common/metrics

    Query Parameters:
    - include_db: 是否包含数据库指标 (true/false)

    Response:
    {
        "ok": true,
        "data": {
            "submission": {
                "total": 150,
                "success_rate": 60.0,
                "duration": {
                    "avg_ms": 1234.5,
                    "p95_ms": 2500.0,
                    "max_ms": 5000,
                    "min_ms": 100
                }
            },
            "diagnosis": {...},
            "database": {...}  // 可选
        }
    }
    """
    try:
        # 获取缓存指标
        metrics = MetricsCollector.get_metrics_summary()

        # 是否包含数据库指标
        include_db = request.GET.get('include_db', 'false').lower() == 'true'
        if include_db:
            db_metrics = MetricsCollector.get_database_metrics()
            metrics['database'] = db_metrics

        return success_response(
            message='监控指标获取成功',
            data=metrics
        )

    except Exception as e:
        logger.error(f"获取监控指标失败: {str(e)}", exc_info=True)
        return error_response(f'系统错误: {str(e)}', error_code='SYSTEM_ERROR')


@require_http_methods(["GET"])
@login_required
def metrics_dashboard_view(request):
    """
    监控仪表盘页面（可选）
    GET /common/metrics/dashboard
    """
    # 如果需要前端页面，可以在这里渲染
    from django.shortcuts import render
    return render(request, 'common/metrics_dashboard.html')
