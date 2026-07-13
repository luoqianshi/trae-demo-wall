"""
安全中间件
提供接口限流、代码安全审计、请求日志等功能
"""
import time
import hashlib
import re
from django.core.cache import cache
from django.http import JsonResponse
from apps.common.utils import error_response
import logging

logger = logging.getLogger(__name__)


class RateLimitMiddleware:
    """
    接口限流中间件
    基于用户ID和IP地址进行限流控制
    """

    def __init__(self, get_response):
        self.get_response = get_response

        # 限流配置：{路径模式: (时间窗口秒, 最大请求数)}
        self.rate_limits = {
            '/api/submissions/run': (60, 10),  # 提交接口：60秒内最多10次
            '/api/diagnosis/generate': (60, 5),  # 诊断接口：60秒内最多5次
            '/api/teacher/export/report': (300, 3),  # 导出接口：5分钟内最多3次
        }

    def __call__(self, request):
        # 检查是否需要限流
        if self._should_rate_limit(request):
            rate_limit_key = self._get_rate_limit_key(request)
            limit_config = self._get_limit_config(request.path)

            if limit_config and not self._check_rate_limit(rate_limit_key, *limit_config):
                logger.warning(
                    f"Rate limit exceeded: user={getattr(request.user, 'username', 'anonymous')}, "
                    f"ip={self._get_client_ip(request)}, path={request.path}"
                )
                return JsonResponse({
                    'ok': False,
                    'message': '请求过于频繁，请稍后再试',
                    'error_code': 'RATE_LIMIT_EXCEEDED'
                }, status=429)

        response = self.get_response(request)
        return response

    def _should_rate_limit(self, request):
        """判断是否需要限流"""
        # 只对POST请求限流
        if request.method != 'POST':
            return False

        # 检查路径是否在限流列表中
        return any(request.path.startswith(pattern) for pattern in self.rate_limits.keys())

    def _get_limit_config(self, path):
        """获取限流配置"""
        for pattern, config in self.rate_limits.items():
            if path.startswith(pattern):
                return config
        return None

    def _get_rate_limit_key(self, request):
        """生成限流键"""
        user_id = request.user.id if request.user.is_authenticated else 'anonymous'
        client_ip = self._get_client_ip(request)
        path = request.path

        # 组合键：用户ID + IP + 路径
        key_str = f"{user_id}:{client_ip}:{path}"
        return f"rate_limit:{hashlib.md5(key_str.encode()).hexdigest()}"

    def _check_rate_limit(self, key, window_seconds, max_requests):
        """
        检查是否超过限流阈值

        Args:
            key: 限流键
            window_seconds: 时间窗口（秒）
            max_requests: 最大请求数

        Returns:
            bool: True表示未超限，False表示超限
        """
        current_time = int(time.time())
        window_key = f"{key}:{current_time // window_seconds}"

        # 获取当前窗口的请求计数
        count = cache.get(window_key, 0)

        if count >= max_requests:
            return False

        # 增加计数并设置过期时间
        cache.set(window_key, count + 1, window_seconds)
        return True

    def _get_client_ip(self, request):
        """获取客户端IP地址"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class CodeSecurityMiddleware:
    """
    代码安全审计中间件
    检测提交的代码中是否包含危险操作
    """

    def __init__(self, get_response):
        self.get_response = get_response

        # 危险关键字列表
        self.dangerous_keywords = [
            # 文件操作
            r'\bopen\s*\(',
            r'\bfile\s*\(',
            r'\bos\.remove',
            r'\bos\.unlink',
            r'\bshutil\.',

            # 系统命令
            r'\bos\.system',
            r'\bsubprocess\.',
            r'\beval\s*\(',
            r'\bexec\s*\(',
            r'\b__import__',

            # 网络操作
            r'\burllib',
            r'\brequests\.',
            r'\bsocket\.',
            r'\bhttplib',

            # 其他危险操作
            r'\bcompile\s*\(',
            r'\bglobals\s*\(',
            r'\blocals\s*\(',
            r'\b__builtins__',
        ]

        # 编译正则表达式
        self.dangerous_patterns = [re.compile(pattern, re.IGNORECASE) for pattern in self.dangerous_keywords]

    def __call__(self, request):
        # 只检查提交代码的接口
        if request.path == '/api/submissions/run' and request.method == 'POST':
            try:
                import json
                body = json.loads(request.body)
                code_text = body.get('code_text', '')

                # 检查代码安全性
                is_safe, dangerous_items = self._check_code_safety(code_text)

                if not is_safe:
                    logger.warning(
                        f"Dangerous code detected: user={getattr(request.user, 'username', 'anonymous')}, "
                        f"dangerous_items={dangerous_items}"
                    )
                    return JsonResponse({
                        'ok': False,
                        'message': f'代码包含不安全的操作：{", ".join(dangerous_items)}',
                        'error_code': 'UNSAFE_CODE'
                    }, status=400)

            except Exception as e:
                logger.error(f"Code security check failed: {str(e)}")

        response = self.get_response(request)
        return response

    def _check_code_safety(self, code_text):
        """
        检查代码安全性

        Args:
            code_text: 代码文本

        Returns:
            tuple: (是否安全, 危险项列表)
        """
        dangerous_items = []

        for pattern in self.dangerous_patterns:
            matches = pattern.findall(code_text)
            if matches:
                dangerous_items.extend(matches)

        # 检查代码长度
        if len(code_text) > 10000:  # 限制代码长度为10KB
            dangerous_items.append('代码长度超限')

        return len(dangerous_items) == 0, dangerous_items


class RequestLoggingMiddleware:
    """
    请求日志中间件
    记录所有API请求的详细信息
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # 记录请求开始时间
        start_time = time.time()

        # 生成trace_id
        trace_id = self._generate_trace_id(request)
        request.trace_id = trace_id

        # 记录请求信息
        self._log_request(request, trace_id)

        # 处理请求
        response = self.get_response(request)

        # 计算请求耗时
        duration_ms = int((time.time() - start_time) * 1000)

        # 记录响应信息
        self._log_response(request, response, trace_id, duration_ms)

        # 将trace_id添加到响应头
        response['X-Trace-ID'] = trace_id

        return response

    def _generate_trace_id(self, request):
        """生成trace_id"""
        timestamp = str(int(time.time() * 1000))
        user_id = str(request.user.id) if request.user.is_authenticated else '0'
        random_str = hashlib.md5(f"{timestamp}{user_id}".encode()).hexdigest()[:8]
        return f"{timestamp}-{random_str}"

    def _log_request(self, request, trace_id):
        """记录请求信息"""
        # 只记录API请求
        if not request.path.startswith('/api/'):
            return

        user_info = request.user.username if request.user.is_authenticated else 'anonymous'

        logger.info(
            f"[REQUEST] trace_id={trace_id} "
            f"method={request.method} "
            f"path={request.path} "
            f"user={user_info} "
            f"ip={self._get_client_ip(request)}"
        )

    def _log_response(self, request, response, trace_id, duration_ms):
        """记录响应信息"""
        # 只记录API请求
        if not request.path.startswith('/api/'):
            return

        user_info = request.user.username if request.user.is_authenticated else 'anonymous'

        log_level = logging.INFO if response.status_code < 400 else logging.WARNING

        logger.log(
            log_level,
            f"[RESPONSE] trace_id={trace_id} "
            f"method={request.method} "
            f"path={request.path} "
            f"user={user_info} "
            f"status={response.status_code} "
            f"duration_ms={duration_ms}"
        )

    def _get_client_ip(self, request):
        """获取客户端IP地址"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class PerformanceMonitoringMiddleware:
    """
    性能监控中间件
    收集接口性能指标
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start_time = time.time()

        response = self.get_response(request)

        # 计算请求耗时
        duration_ms = int((time.time() - start_time) * 1000)

        # 记录性能指标
        self._record_metrics(request, response, duration_ms)

        return response

    def _record_metrics(self, request, response, duration_ms):
        """记录性能指标到缓存"""
        # 只记录API请求
        if not request.path.startswith('/api/'):
            return

        # 生成指标键
        metric_key = f"metrics:{request.path}:{request.method}"

        # 获取现有指标
        metrics = cache.get(metric_key, {
            'count': 0,
            'total_duration': 0,
            'success_count': 0,
            'error_count': 0,
            'max_duration': 0,
            'min_duration': float('inf')
        })

        # 更新指标
        metrics['count'] += 1
        metrics['total_duration'] += duration_ms
        metrics['max_duration'] = max(metrics['max_duration'], duration_ms)
        metrics['min_duration'] = min(metrics['min_duration'], duration_ms)

        if response.status_code < 400:
            metrics['success_count'] += 1
        else:
            metrics['error_count'] += 1

        # 保存指标（保留1小时）
        cache.set(metric_key, metrics, 3600)

        # 如果请求耗时超过阈值，记录警告日志
        if duration_ms > 3000:  # 超过3秒
            logger.warning(
                f"Slow request detected: path={request.path} "
                f"method={request.method} "
                f"duration_ms={duration_ms}"
            )
