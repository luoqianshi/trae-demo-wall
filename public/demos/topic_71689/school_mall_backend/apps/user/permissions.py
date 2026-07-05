from rest_framework.permissions import BasePermission


class IsAdminUser(BasePermission):
    """
    自定义管理员权限类
    允许 user_type == 3 (系统管理员) 的用户访问
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.user_type == 3
        )
