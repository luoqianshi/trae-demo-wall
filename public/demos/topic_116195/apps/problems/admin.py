"""
题目管理模块Admin配置
在Django后台管理界面注册Problem模型
"""
from django.contrib import admin
from django.contrib import messages
from config.admin import admin_site
from .models import Problem


class ProblemAdmin(admin.ModelAdmin):
    """
    题目管理Admin配置
    """
    # 列表页显示字段
    list_display = ('id', 'title', 'difficulty', 'test_cases_count', 'created_by', 'created_at', 'updated_at')

    # 列表页筛选器
    list_filter = ('difficulty', 'created_at', 'created_by')

    # 搜索字段
    search_fields = ('title', 'description')

    # 只读字段
    readonly_fields = ('created_at', 'updated_at', 'test_cases_count')

    # 每页显示数量
    list_per_page = 20

    # 日期层级导航
    date_hierarchy = 'created_at'

    # 字段分组
    fieldsets = (
        ('基本信息', {
            'fields': ('title', 'difficulty', 'created_by')
        }),
        ('题目内容', {
            'fields': ('description', 'test_cases_json')
        }),
        ('时间信息', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def test_cases_count(self, obj):
        """显示测试用例数量"""
        return obj.test_cases_count
    test_cases_count.short_description = '测试用例数'

    def delete_model(self, request, obj):
        """
        删除单个题目时，同时删除相关的提交记录和诊断记录
        """
        from apps.submissions.models import Submission
        from apps.diagnosis.models import DiagnosisRecord

        # 获取相关记录数量
        submission_count = Submission.objects.filter(problem=obj).count()
        diagnosis_count = DiagnosisRecord.objects.filter(problem=obj).count()

        # 删除相关记录
        deleted_items = []
        if submission_count > 0:
            Submission.objects.filter(problem=obj).delete()
            deleted_items.append(f'{submission_count} 条提交记录')
        if diagnosis_count > 0:
            DiagnosisRecord.objects.filter(problem=obj).delete()
            deleted_items.append(f'{diagnosis_count} 条诊断记录')

        # 删除题目
        super().delete_model(request, obj)

        # 显示消息
        if deleted_items:
            messages.info(request, f'已删除题目"{obj.title}"及其相关的 {", ".join(deleted_items)}')
        else:
            messages.info(request, f'已删除题目"{obj.title}"')

    def delete_queryset(self, request, queryset):
        """
        批量删除题目时，同时删除相关的提交记录和诊断记录
        """
        from apps.submissions.models import Submission
        from apps.diagnosis.models import DiagnosisRecord

        total_submissions = 0
        total_diagnoses = 0
        problem_count = queryset.count()

        # 遍历每个题目，删除相关记录
        for problem in queryset:
            submission_count = Submission.objects.filter(problem=problem).count()
            diagnosis_count = DiagnosisRecord.objects.filter(problem=problem).count()
            total_submissions += submission_count
            total_diagnoses += diagnosis_count
            Submission.objects.filter(problem=problem).delete()
            DiagnosisRecord.objects.filter(problem=problem).delete()

        # 删除题目
        queryset.delete()

        # 显示消息
        deleted_items = []
        if total_submissions > 0:
            deleted_items.append(f'{total_submissions} 条提交记录')
        if total_diagnoses > 0:
            deleted_items.append(f'{total_diagnoses} 条诊断记录')

        if deleted_items:
            messages.info(request, f'已删除 {problem_count} 个题目及其相关的 {", ".join(deleted_items)}')
        else:
            messages.info(request, f'已删除 {problem_count} 个题目')


# 注册Problem模型
admin_site.register(Problem, ProblemAdmin)
