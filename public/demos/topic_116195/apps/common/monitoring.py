"""
监控指标收集服务
提供系统性能指标的收集和查询功能
"""
from django.core.cache import cache
from django.db.models import Count, Avg, Max, Min
from apps.submissions.models import Submission
from apps.diagnosis.models import DiagnosisRecord
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


class MetricsCollector:
    """指标收集器"""

    @staticmethod
    def record_submission_metrics(submission, duration_ms):
        """
        记录提交相关指标

        Args:
            submission: 提交对象
            duration_ms: 执行耗时（毫秒）
        """
        try:
            # 记录提交耗时
            MetricsCollector._record_duration('submission', duration_ms)

            # 记录提交状态
            MetricsCollector._increment_counter(f'submission_status_{submission.run_status}')

            # 记录总提交数
            MetricsCollector._increment_counter('submission_total')

        except Exception as e:
            logger.error(f"Failed to record submission metrics: {str(e)}")

    @staticmethod
    def record_diagnosis_metrics(diagnosis, duration_ms):
        """
        记录诊断相关指标

        Args:
            diagnosis: 诊断对象
            duration_ms: 诊断耗时（毫秒）
        """
        try:
            # 记录诊断耗时
            MetricsCollector._record_duration('diagnosis', duration_ms)

            # 记录诊断来源
            MetricsCollector._increment_counter(f'diagnosis_source_{diagnosis.source}')

            # 记录诊断状态
            MetricsCollector._increment_counter(f'diagnosis_status_{diagnosis.status}')

            # 记录总诊断数
            MetricsCollector._increment_counter('diagnosis_total')

            # 如果是LLM诊断，记录超时情况
            if diagnosis.source == 'llm' and duration_ms > 30000:  # 超过30秒
                MetricsCollector._increment_counter('diagnosis_timeout')

        except Exception as e:
            logger.error(f"Failed to record diagnosis metrics: {str(e)}")

    @staticmethod
    def record_api_metrics(path, method, status_code, duration_ms):
        """
        记录API请求指标

        Args:
            path: 请求路径
            method: 请求方法
            status_code: 响应状态码
            duration_ms: 请求耗时（毫秒）
        """
        try:
            # 生成指标键
            metric_key = f"api:{path}:{method}"

            # 记录请求耗时
            MetricsCollector._record_duration(metric_key, duration_ms)

            # 记录请求计数
            MetricsCollector._increment_counter(f"{metric_key}:count")

            # 记录成功/失败
            if status_code < 400:
                MetricsCollector._increment_counter(f"{metric_key}:success")
            else:
                MetricsCollector._increment_counter(f"{metric_key}:error")

        except Exception as e:
            logger.error(f"Failed to record API metrics: {str(e)}")

    @staticmethod
    def _record_duration(metric_name, duration_ms):
        """记录耗时指标"""
        key = f"metrics:duration:{metric_name}"

        # 获取现有数据
        data = cache.get(key, {
            'count': 0,
            'total': 0,
            'max': 0,
            'min': float('inf'),
            'samples': []
        })

        # 更新数据
        data['count'] += 1
        data['total'] += duration_ms
        data['max'] = max(data['max'], duration_ms)
        data['min'] = min(data['min'], duration_ms)

        # 保留最近100个样本用于计算P95
        data['samples'].append(duration_ms)
        if len(data['samples']) > 100:
            data['samples'] = data['samples'][-100:]

        # 保存数据（保留1小时）
        cache.set(key, data, 3600)

    @staticmethod
    def _increment_counter(metric_name):
        """增加计数器"""
        key = f"metrics:counter:{metric_name}"
        count = cache.get(key, 0)
        cache.set(key, count + 1, 3600)  # 保留1小时

    @staticmethod
    def get_metrics_summary():
        """
        获取指标摘要

        Returns:
            dict: 指标摘要数据
        """
        try:
            # 获取提交指标
            submission_metrics = MetricsCollector._get_duration_metrics('submission')
            submission_total = cache.get('metrics:counter:submission_total', 0)
            submission_success = cache.get('metrics:counter:submission_status_success', 0)
            submission_fail = cache.get('metrics:counter:submission_status_fail', 0)
            submission_error = cache.get('metrics:counter:submission_status_error', 0)

            # 获取诊断指标
            diagnosis_metrics = MetricsCollector._get_duration_metrics('diagnosis')
            diagnosis_total = cache.get('metrics:counter:diagnosis_total', 0)
            diagnosis_llm = cache.get('metrics:counter:diagnosis_source_llm', 0)
            diagnosis_template = cache.get('metrics:counter:diagnosis_source_template', 0)
            diagnosis_cache = cache.get('metrics:counter:diagnosis_source_cache', 0)
            diagnosis_timeout = cache.get('metrics:counter:diagnosis_timeout', 0)

            # 计算成功率
            submission_success_rate = (submission_success / submission_total * 100) if submission_total > 0 else 0
            diagnosis_timeout_rate = (diagnosis_timeout / diagnosis_llm * 100) if diagnosis_llm > 0 else 0

            return {
                'submission': {
                    'total': submission_total,
                    'success': submission_success,
                    'fail': submission_fail,
                    'error': submission_error,
                    'success_rate': round(submission_success_rate, 2),
                    'duration': submission_metrics
                },
                'diagnosis': {
                    'total': diagnosis_total,
                    'llm': diagnosis_llm,
                    'template': diagnosis_template,
                    'cache': diagnosis_cache,
                    'timeout': diagnosis_timeout,
                    'timeout_rate': round(diagnosis_timeout_rate, 2),
                    'duration': diagnosis_metrics
                },
                'timestamp': datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Failed to get metrics summary: {str(e)}")
            return {}

    @staticmethod
    def _get_duration_metrics(metric_name):
        """获取耗时指标"""
        key = f"metrics:duration:{metric_name}"
        data = cache.get(key, {})

        if not data or data.get('count', 0) == 0:
            return {
                'avg_ms': 0,
                'max_ms': 0,
                'min_ms': 0,
                'p95_ms': 0,
                'count': 0
            }

        # 计算平均值
        avg_ms = data['total'] / data['count']

        # 计算P95
        samples = sorted(data.get('samples', []))
        p95_index = int(len(samples) * 0.95)
        p95_ms = samples[p95_index] if samples else 0

        return {
            'avg_ms': round(avg_ms, 2),
            'max_ms': data['max'],
            'min_ms': data['min'] if data['min'] != float('inf') else 0,
            'p95_ms': round(p95_ms, 2),
            'count': data['count']
        }

    @staticmethod
    def get_database_metrics():
        """
        获取数据库相关指标

        Returns:
            dict: 数据库指标
        """
        try:
            # 最近1小时的提交统计
            one_hour_ago = datetime.now() - timedelta(hours=1)

            recent_submissions = Submission.objects.filter(
                created_at__gte=one_hour_ago
            ).aggregate(
                total=Count('id'),
                avg_score=Avg('score')
            )

            recent_diagnoses = DiagnosisRecord.objects.filter(
                created_at__gte=one_hour_ago
            ).aggregate(
                total=Count('id'),
                avg_latency=Avg('latency_ms')
            )

            return {
                'recent_submissions': {
                    'total': recent_submissions['total'] or 0,
                    'avg_score': round(recent_submissions['avg_score'] or 0, 2)
                },
                'recent_diagnoses': {
                    'total': recent_diagnoses['total'] or 0,
                    'avg_latency_ms': round(recent_diagnoses['avg_latency'] or 0, 2)
                }
            }

        except Exception as e:
            logger.error(f"Failed to get database metrics: {str(e)}")
            return {}


class HealthChecker:
    """健康检查器"""

    @staticmethod
    def check_system_health():
        """
        检查系统健康状态

        Returns:
            dict: 健康状态信息
        """
        health_status = {
            'status': 'healthy',
            'checks': {},
            'timestamp': datetime.now().isoformat()
        }

        # 检查数据库
        db_health = HealthChecker._check_database()
        health_status['checks']['database'] = db_health

        # 检查缓存
        cache_health = HealthChecker._check_cache()
        health_status['checks']['cache'] = cache_health

        # 检查指标
        metrics_health = HealthChecker._check_metrics()
        health_status['checks']['metrics'] = metrics_health

        # 判断整体状态
        if not all(check['status'] == 'ok' for check in health_status['checks'].values()):
            health_status['status'] = 'degraded'

        return health_status

    @staticmethod
    def _check_database():
        """检查数据库连接"""
        try:
            # 执行简单查询
            Submission.objects.count()
            return {'status': 'ok', 'message': 'Database connection is healthy'}
        except Exception as e:
            logger.error(f"Database health check failed: {str(e)}")
            return {'status': 'error', 'message': str(e)}

    @staticmethod
    def _check_cache():
        """检查缓存服务"""
        try:
            # 测试缓存读写
            test_key = 'health_check_test'
            cache.set(test_key, 'ok', 10)
            value = cache.get(test_key)

            if value == 'ok':
                return {'status': 'ok', 'message': 'Cache is healthy'}
            else:
                return {'status': 'error', 'message': 'Cache read/write failed'}

        except Exception as e:
            logger.error(f"Cache health check failed: {str(e)}")
            return {'status': 'error', 'message': str(e)}

    @staticmethod
    def _check_metrics():
        """检查指标收集"""
        try:
            metrics = MetricsCollector.get_metrics_summary()

            # 检查是否有异常指标
            warnings = []

            # 检查提交成功率
            if metrics.get('submission', {}).get('success_rate', 100) < 50:
                warnings.append('Submission success rate is low')

            # 检查诊断超时率
            if metrics.get('diagnosis', {}).get('timeout_rate', 0) > 30:
                warnings.append('Diagnosis timeout rate is high')

            if warnings:
                return {'status': 'warning', 'message': '; '.join(warnings)}
            else:
                return {'status': 'ok', 'message': 'Metrics are healthy'}

        except Exception as e:
            logger.error(f"Metrics health check failed: {str(e)}")
            return {'status': 'error', 'message': str(e)}
