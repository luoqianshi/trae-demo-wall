"""
公共工具模块
提供统一的JSON响应格式和装饰器
"""
from django.http import JsonResponse
from functools import wraps


def json_response(ok=True, message='success', data=None, error_code=None, status=200):
    """
    统一JSON响应格式

    Args:
        ok: 是否成功
        message: 响应消息
        data: 响应数据
        error_code: 错误代码（失败时使用）
        status: HTTP状态码

    Returns:
        JsonResponse对象
    """
    response_data = {
        'ok': ok,
        'message': message,
    }

    if data is not None:
        response_data['data'] = data

    if error_code is not None:
        response_data['error_code'] = error_code

    return JsonResponse(response_data, status=status, json_dumps_params={'ensure_ascii': False})


def success_response(message='success', data=None):
    """成功响应快捷方法"""
    return json_response(ok=True, message=message, data=data, status=200)


def error_response(message='error', error_code=None, status=400):
    """失败响应快捷方法"""
    return json_response(ok=False, message=message, error_code=error_code, status=status)


def teacher_required(view_func):
    """
    教师权限装饰器
    要求用户已登录且角色为teacher
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        # 检查是否登录
        if not request.user.is_authenticated:
            return error_response(message='请先登录', error_code='AUTH_REQUIRED', status=401)

        # 检查是否有profile
        if not hasattr(request.user, 'profile'):
            return error_response(message='用户信息不完整', error_code='PROFILE_MISSING', status=403)

        # 检查是否为教师
        if not request.user.profile.is_teacher:
            return error_response(message='需要教师权限', error_code='PERMISSION_DENIED', status=403)

        return view_func(request, *args, **kwargs)

    return wrapper


def student_required(view_func):
    """
    学生权限装饰器
    要求用户已登录且角色为student
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        # 检查是否登录
        if not request.user.is_authenticated:
            return error_response(message='请先登录', error_code='AUTH_REQUIRED', status=401)

        # 检查是否有profile
        if not hasattr(request.user, 'profile'):
            return error_response(message='用户信息不完整', error_code='PROFILE_MISSING', status=403)

        # 检查是否为学生
        if not request.user.profile.is_student:
            return error_response(message='需要学生权限', error_code='PERMISSION_DENIED', status=403)

        return view_func(request, *args, **kwargs)

    return wrapper
