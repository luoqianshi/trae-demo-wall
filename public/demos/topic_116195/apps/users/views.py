"""
用户认证模块视图
处理登录、登出、获取当前用户信息等接口
"""
import json
from django.contrib.auth import authenticate, login, logout
from django.middleware.csrf import get_token
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import ensure_csrf_cookie
from django.contrib.auth.decorators import login_required
from apps.common.utils import success_response, error_response


@require_http_methods(["POST"])
@ensure_csrf_cookie
def login_view(request):
    """
    用户登录接口
    POST /api/auth/login
    """
    try:
        data = json.loads(request.body)
        username = data.get('username')
        password = data.get('password')
        selected_role = data.get('role', 'student')  # 获取前端选择的角色

        if not username or not password:
            return error_response(message='用户名和密码不能为空', error_code='INVALID_PARAMS')

        # 认证用户
        user = authenticate(request, username=username, password=password)

        if user is not None:
            # 获取用户实际角色
            if user.is_superuser:
                actual_role = 'admin'
            elif user.is_staff:
                actual_role = 'teacher'
            else:
                actual_role = 'student'

            # 验证选择的角色与实际角色是否匹配
            if selected_role != actual_role:
                return error_response(message='用户名或密码错误', error_code='AUTH_FAILED', status=401)

            # 登录成功
            login(request, user)

            return success_response(
                message='登录成功',
                data={
                    'username': user.username,
                    'role': actual_role,
                    'is_staff': user.is_staff
                }
            )
        else:
            return error_response(message='用户名或密码错误', error_code='AUTH_FAILED', status=401)

    except json.JSONDecodeError:
        return error_response(message='请求数据格式错误', error_code='INVALID_JSON')
    except Exception as e:
        return error_response(message=f'登录失败: {str(e)}', error_code='SERVER_ERROR', status=500)


@require_http_methods(["POST"])
@login_required
def logout_view(request):
    """
    用户登出接口
    POST /api/auth/logout
    """
    try:
        logout(request)
        return success_response(message='登出成功')
    except Exception as e:
        return error_response(message=f'登出失败: {str(e)}', error_code='SERVER_ERROR', status=500)


@require_http_methods(["GET"])
@ensure_csrf_cookie
def csrf_view(request):
    """
    获取CSRF Token接口
    GET /api/auth/csrf
    """
    try:
        return success_response(
            message='获取CSRF Token成功',
            data={
                'csrfToken': get_token(request)
            }
        )
    except Exception as e:
        return error_response(message=f'获取CSRF Token失败: {str(e)}', error_code='SERVER_ERROR', status=500)


@require_http_methods(["GET"])
@login_required
def me_view(request):
    """
    获取当前用户信息
    GET /api/auth/me
    """
    try:
        user = request.user

        # 获取用户角色
        role = 'teacher' if user.is_staff else 'student'

        return success_response(
            message='获取用户信息成功',
            data={
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': role,
                'is_staff': user.is_staff
            }
        )
    except Exception as e:
        return error_response(message=f'获取用户信息失败: {str(e)}', error_code='SERVER_ERROR', status=500)
