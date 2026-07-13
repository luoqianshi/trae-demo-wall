"""
异常降级与容错机制
提供系统各模块的降级策略和容错处理
"""
import logging
import time
from functools import wraps
from django.core.cache import cache
from django.conf import settings

logger = logging.getLogger(__name__)


class CircuitBreaker:
    """
    熔断器模式实现
    当服务连续失败达到阈值时，自动熔断，避免雪崩效应
    """

    def __init__(self, failure_threshold=5, timeout=60, expected_exception=Exception):
        """
        Args:
            failure_threshold: 失败阈值
            timeout: 熔断超时时间（秒）
            expected_exception: 预期的异常类型
        """
        self.failure_threshold = failure_threshold
        self.timeout = timeout
        self.expected_exception = expected_exception

    def __call__(self, func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            cache_key = f"circuit_breaker:{func.__module__}.{func.__name__}"

            # 检查熔断状态
            breaker_state = cache.get(cache_key, {'failures': 0, 'last_failure_time': 0, 'state': 'closed'})

            # 如果熔断器打开，检查是否可以尝试恢复
            if breaker_state['state'] == 'open':
                if time.time() - breaker_state['last_failure_time'] < self.timeout:
                    logger.warning(f"熔断器打开，拒绝调用 {func.__name__}")
                    raise Exception(f"服务熔断中，请稍后重试")
                else:
                    # 尝试半开状态
                    breaker_state['state'] = 'half_open'
                    logger.info(f"熔断器进入半开状态 {func.__name__}")

            try:
                # 执行函数
                result = func(*args, **kwargs)

                # 成功后重置熔断器
                if breaker_state['state'] == 'half_open':
                    breaker_state = {'failures': 0, 'last_failure_time': 0, 'state': 'closed'}
                    cache.set(cache_key, breaker_state, self.timeout * 2)
                    logger.info(f"熔断器关闭 {func.__name__}")

                return result

            except self.expected_exception as e:
                # 记录失败
                breaker_state['failures'] += 1
                breaker_state['last_failure_time'] = time.time()

                # 检查是否达到阈值
                if breaker_state['failures'] >= self.failure_threshold:
                    breaker_state['state'] = 'open'
                    logger.error(f"熔断器打开 {func.__name__} failures={breaker_state['failures']}")

                cache.set(cache_key, breaker_state, self.timeout * 2)
                raise

        return wrapper


def with_fallback(fallback_func):
    """
    降级装饰器：当主函数失败时，自动调用降级函数

    Usage:
        @with_fallback(fallback_func=get_template_diagnosis)
        def get_llm_diagnosis(submission):
            ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                logger.warning(f"{func.__name__} 失败，启用降级策略: {str(e)}")
                try:
                    return fallback_func(*args, **kwargs)
                except Exception as fallback_error:
                    logger.error(f"降级策略也失败: {str(fallback_error)}")
                    raise e  # 抛出原始异常
        return wrapper
    return decorator


def with_retry(max_retries=3, delay=1, backoff=2, exceptions=(Exception,)):
    """
    重试装饰器：自动重试失败的操作

    Args:
        max_retries: 最大重试次数
        delay: 初始延迟时间（秒）
        backoff: 延迟倍数
        exceptions: 需要重试的异常类型
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            current_delay = delay
            last_exception = None

            for attempt in range(max_retries + 1):
                try:
                    return func(*args, **kwargs)
                except exceptions as e:
                    last_exception = e
                    if attempt < max_retries:
                        logger.warning(
                            f"{func.__name__} 失败，{current_delay}秒后重试 "
                            f"(attempt {attempt + 1}/{max_retries}): {str(e)}"
                        )
                        time.sleep(current_delay)
                        current_delay *= backoff
                    else:
                        logger.error(f"{func.__name__} 达到最大重试次数: {str(e)}")

            raise last_exception

        return wrapper
    return decorator


def with_timeout(timeout_seconds):
    """
    超时装饰器：限制函数执行时间

    Args:
        timeout_seconds: 超时时间（秒）
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            import signal

            def timeout_handler(signum, frame):
                raise TimeoutError(f"{func.__name__} 执行超时 ({timeout_seconds}秒)")

            # 设置超时信号（仅Unix系统）
            if hasattr(signal, 'SIGALRM'):
                signal.signal(signal.SIGALRM, timeout_handler)
                signal.alarm(timeout_seconds)

            try:
                result = func(*args, **kwargs)
            finally:
                if hasattr(signal, 'SIGALRM'):
                    signal.alarm(0)  # 取消超时

            return result

        return wrapper
    return decorator


class DegradationManager:
    """
    降级管理器：统一管理系统降级策略
    """

    @staticmethod
    def get_llm_diagnosis_with_fallback(submission):
        """
        LLM诊断降级策略：LLM失败 -> 模板诊断 -> 空诊断
        """
        from apps.diagnosis.services import DiagnosisService

        try:
            # 尝试LLM诊断
            return DiagnosisService.generate_llm_diagnosis(submission)
        except Exception as e:
            logger.warning(f"LLM诊断失败，降级到模板诊断: {str(e)}")

            try:
                # 降级到模板诊断
                return DiagnosisService.generate_template_diagnosis(submission)
            except Exception as template_error:
                logger.error(f"模板诊断也失败，返回空诊断: {str(template_error)}")

                # 最终降级：返回空诊断
                return {
                    'status': 'fallback',
                    'source': 'empty',
                    'diagnosis_text': '诊断服务暂时不可用，请稍后重试',
                    'diagnosis_data': {}
                }

    @staticmethod
    def get_cached_or_compute(cache_key, compute_func, ttl=300, fallback_value=None):
        """
        缓存降级策略：优先从缓存获取，失败则计算，计算失败返回降级值

        Args:
            cache_key: 缓存键
            compute_func: 计算函数
            ttl: 缓存过期时间（秒）
            fallback_value: 降级值
        """
        try:
            # 尝试从缓存获取
            cached_value = cache.get(cache_key)
            if cached_value is not None:
                return cached_value

            # 缓存未命中，执行计算
            computed_value = compute_func()

            # 保存到缓存
            try:
                cache.set(cache_key, computed_value, ttl)
            except Exception as cache_error:
                logger.warning(f"缓存保存失败: {str(cache_error)}")

            return computed_value

        except Exception as e:
            logger.error(f"计算失败，返回降级值: {str(e)}")
            return fallback_value

    @staticmethod
    def handle_database_failure(operation_name, fallback_data=None):
        """
        数据库降级策略：数据库失败时返回降级数据

        Args:
            operation_name: 操作名称
            fallback_data: 降级数据
        """
        logger.error(f"数据库操作失败: {operation_name}")

        if fallback_data is not None:
            return fallback_data

        # 默认降级数据
        return {
            'status': 'degraded',
            'message': '数据服务暂时不可用，请稍后重试',
            'data': []
        }

    @staticmethod
    def handle_queue_failure(task_name, fallback_sync=False):
        """
        队列降级策略：队列失败时同步执行或跳过

        Args:
            task_name: 任务名称
            fallback_sync: 是否降级到同步执行
        """
        logger.error(f"任务队列失败: {task_name}")

        if fallback_sync:
            logger.info(f"降级到同步执行: {task_name}")
            return 'sync'
        else:
            logger.info(f"跳过任务: {task_name}")
            return 'skip'


# 预定义的降级策略
class FallbackStrategies:
    """预定义的降级策略"""

    @staticmethod
    def empty_diagnosis():
        """空诊断降级"""
        return {
            'status': 'fallback',
            'source': 'empty',
            'diagnosis_text': '诊断服务暂时不可用',
            'diagnosis_data': {}
        }

    @staticmethod
    def empty_statistics():
        """空统计降级"""
        return {
            'total': 0,
            'data': [],
            'message': '统计服务暂时不可用'
        }

    @staticmethod
    def cached_response(cache_key, default_value=None):
        """从缓存获取降级数据"""
        try:
            cached = cache.get(cache_key)
            return cached if cached is not None else default_value
        except Exception:
            return default_value
