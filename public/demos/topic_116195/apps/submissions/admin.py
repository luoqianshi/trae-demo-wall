"""
提交与评测模块Admin配置
在Django后台管理界面注册Submission模型
"""
from django.contrib import admin
from config.admin import admin_site
from .models import Submission


class SubmissionAdmin(admin.ModelAdmin):
    """
    提交记录管理Admin配置
    """
    # 列表页显示字段
    list_display = ('id', 'student', 'problem', 'run_status', 'score', 'has_error', 'created_at')

    # 列表页筛选器
    list_filter = ('run_status', 'created_at', 'problem')

    # 搜索字段
    search_fields = ('student__username', 'problem__title', 'error_type')

    # 只读字段
    readonly_fields = ('created_at', 'code_preview')

    # 每页显示数量
    list_per_page = 20

    # 日期层级导航
    date_hierarchy = 'created_at'

    # 字段分组
    fieldsets = (
        ('基本信息', {
            'fields': ('student', 'problem', 'run_status', 'score')
        }),
        ('代码内容', {
            'fields': ('code_text', 'code_preview')
        }),
        ('运行结果', {
            'fields': ('stdout_text', 'error_type', 'error_trace')
        }),
        ('时间信息', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )

    def has_error(self, obj):
        """显示是否有错误"""
        return obj.has_error
    has_error.boolean = True
    has_error.short_description = '有错误'

    def code_preview(self, obj):
        """显示代码预览"""
        return obj.get_code_preview(200)
    code_preview.short_description = '代码预览'


# 注册Submission模型
admin_site.register(Submission, SubmissionAdmin)
