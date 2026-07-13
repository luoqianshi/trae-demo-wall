"""
自定义Django管理后台配置
"""
from django.contrib import admin


class CustomAdminSite(admin.AdminSite):
    """
    自定义管理后台站点
    配置站点标题和"查看站点"链接
    """
    site_header = '学生代码诊断平台 - 管理后台'
    site_title = '管理后台'
    index_title = '欢迎使用管理后台'
    site_url = '/teacher/dashboard'  # 点击"查看站点"跳转到教师端仪表板


# 创建自定义admin站点实例
admin_site = CustomAdminSite(name='custom_admin')
