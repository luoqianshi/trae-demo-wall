"""
诊断模块Admin配置
在Django后台管理界面注册DiagnosisRecord模型
"""
from django.contrib import admin
from .models import DiagnosisRecord


@admin.register(DiagnosisRecord)
class DiagnosisRecordAdmin(admin.ModelAdmin):
    """
    诊断记录管理Admin配置
    """
    # 列表页显示字段
    list_display = ('id', 'student', 'problem', 'error_type', 'source', 'latency_ms', 'created_at')

    # 列表页筛选器
    list_filter = ('source', 'error_type', 'created_at', 'problem')

    # 搜索字段
    search_fields = ('student__username', 'problem__title', 'error_type', 'diagnosis_text')

    # 只读字段
    readonly_fields = ('created_at', 'diagnosis_preview')

    # 每页显示数量
    list_per_page = 20

    # 日期层级导航
    date_hierarchy = 'created_at'

    # 字段分组
    fieldsets = (
        ('基本信息', {
            'fields': ('student', 'problem', 'submission')
        }),
        ('诊断信息', {
            'fields': ('error_type', 'diagnosis_text', 'diagnosis_preview')
        }),
        ('元数据', {
            'fields': ('code_hash', 'source', 'latency_ms')
        }),
        ('时间信息', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )

    def diagnosis_preview(self, obj):
        """显示诊断内容预览"""
        return obj.get_diagnosis_preview(200)
    diagnosis_preview.short_description = '诊断预览'
