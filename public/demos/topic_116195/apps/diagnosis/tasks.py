"""
诊断任务异步处理
使用Celery实现耗时诊断任务的异步化，避免阻塞HTTP请求
"""
import logging
import time
from celery import shared_task
from django.core.cache import cache
from apps.diagnosis.models import DiagnosisRecord
from apps.diagnosis.diagnosis_service import DiagnosisService
from apps.common.monitoring import MetricsCollector

logger = logging.getLogger(__name__)


# 任务状态常量
TASK_STATUS_QUEUED = 'queued'
TASK_STATUS_RUNNING = 'running'
TASK_STATUS_SUCCESS = 'success'
TASK_STATUS_FAILED = 'failed'
TASK_STATUS_RETRY = 'retry'


@shared_task(bind=True, max_retries=3, default_retry_delay=10)
def async_generate_diagnosis(self, submission_id, force_llm=False):
    """
    异步生成诊断任务

    Args:
        submission_id: 提交ID
        force_llm: 是否强制使用LLM诊断

    Returns:
        dict: 诊断结果
    """
    task_id = self.request.id
    start_time = time.time()

    try:
        # 更新任务状态为运行中
        _update_task_status(task_id, TASK_STATUS_RUNNING, {
            'submission_id': submission_id,
            'started_at': time.time()
        })

        logger.info(f"[Celery] 开始异步诊断任务 task_id={task_id} submission_id={submission_id}")

        # 调用诊断服务
        diagnosis = DiagnosisService.generate_diagnosis(
            submission_id=submission_id,
            force_llm=force_llm
        )

        # 计算耗时
        duration_ms = (time.time() - start_time) * 1000

        # 记录监控指标
        MetricsCollector.record_diagnosis_metrics(diagnosis, duration_ms)

        # 更新任务状态为成功
        result = {
            'diagnosis_id': diagnosis.id,
            'source': diagnosis.source,
            'duration_ms': round(duration_ms, 2),
            'completed_at': time.time()
        }
        _update_task_status(task_id, TASK_STATUS_SUCCESS, result)

        logger.info(f"[Celery] 诊断任务完成 task_id={task_id} duration={duration_ms:.2f}ms")

        return result

    except Exception as e:
        logger.error(f"[Celery] 诊断任务失败 task_id={task_id} error={str(e)}", exc_info=True)

        # 更新任务状态为重试
        _update_task_status(task_id, TASK_STATUS_RETRY, {
            'error': str(e),
            'retry_count': self.request.retries
        })

        # 重试任务
        try:
            raise self.retry(exc=e)
        except self.MaxRetriesExceededError:
            # 达到最大重试次数，标记为失败
            _update_task_status(task_id, TASK_STATUS_FAILED, {
                'error': str(e),
                'retry_count': self.request.retries,
                'failed_at': time.time()
            })
            raise


@shared_task(bind=True)
def async_batch_diagnosis(self, submission_ids):
    """
    批量异步诊断任务

    Args:
        submission_ids: 提交ID列表

    Returns:
        dict: 批量诊断结果
    """
    task_id = self.request.id
    start_time = time.time()

    try:
        logger.info(f"[Celery] 开始批量诊断任务 task_id={task_id} count={len(submission_ids)}")

        results = []
        failed_count = 0

        for submission_id in submission_ids:
            try:
                diagnosis = DiagnosisService.generate_diagnosis(submission_id=submission_id)
                results.append({
                    'submission_id': submission_id,
                    'diagnosis_id': diagnosis.id,
                    'status': 'success'
                })
            except Exception as e:
                logger.error(f"[Celery] 批量诊断失败 submission_id={submission_id} error={str(e)}")
                results.append({
                    'submission_id': submission_id,
                    'status': 'failed',
                    'error': str(e)
                })
                failed_count += 1

        duration_ms = (time.time() - start_time) * 1000

        summary = {
            'total': len(submission_ids),
            'success': len(submission_ids) - failed_count,
            'failed': failed_count,
            'duration_ms': round(duration_ms, 2),
            'results': results
        }

        logger.info(f"[Celery] 批量诊断任务完成 task_id={task_id} success={summary['success']}/{summary['total']}")

        return summary

    except Exception as e:
        logger.error(f"[Celery] 批量诊断任务失败 task_id={task_id} error={str(e)}", exc_info=True)
        raise


@shared_task
def async_export_report(report_type, filters):
    """
    异步导出报表任务

    Args:
        report_type: 报表类型
        filters: 筛选条件

    Returns:
        dict: 报表文件信息
    """
    try:
        logger.info(f"[Celery] 开始异步导出报表 type={report_type}")

        # 这里可以调用教师端的报表生成服务
        # 生成后将文件保存到临时目录，返回下载链接

        # TODO: 实现报表生成逻辑

        return {
            'status': 'success',
            'file_url': '/media/reports/xxx.csv',
            'file_size': 1024
        }

    except Exception as e:
        logger.error(f"[Celery] 报表导出失败 error={str(e)}", exc_info=True)
        raise


def _update_task_status(task_id, status, data=None):
    """
    更新任务状态到缓存

    Args:
        task_id: 任务ID
        status: 任务状态
        data: 附加数据
    """
    cache_key = f"celery_task:{task_id}"
    task_info = {
        'task_id': task_id,
        'status': status,
        'updated_at': time.time()
    }

    if data:
        task_info.update(data)

    # 缓存任务状态（保留1小时）
    cache.set(cache_key, task_info, 3600)


def get_task_status(task_id):
    """
    获取任务状态

    Args:
        task_id: 任务ID

    Returns:
        dict: 任务状态信息
    """
    cache_key = f"celery_task:{task_id}"
    task_info = cache.get(cache_key)

    if not task_info:
        return {
            'task_id': task_id,
            'status': 'unknown',
            'message': '任务不存在或已过期'
        }

    return task_info
