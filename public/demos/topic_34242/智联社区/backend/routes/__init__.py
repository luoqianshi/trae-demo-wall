"""
邻里智联 - 路由模块
"""
from .auth import auth_bp
from .workorders import workorder_bp
from .appeals import appeal_bp
from .shares import share_bp
from .notices import notice_bp
from .dashboard import dashboard_bp
from .elderly import elderly_bp
from .points import points_bp
from .complaints import complaint_bp, admin_complaint_bp

__all__ = [
    'auth_bp', 'workorder_bp', 'appeal_bp',
    'share_bp', 'notice_bp', 'dashboard_bp', 'elderly_bp', 'points_bp',
    'complaint_bp', 'admin_complaint_bp'
]
