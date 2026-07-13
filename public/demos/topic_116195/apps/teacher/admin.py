"""
教师模块Admin配置
在Django后台管理界面注册班级和学生分配模型
"""
from django.contrib import admin
from config.admin import admin_site
from .models import Class, ClassStudent


class ClassStudentInline(admin.TabularInline):
    """
    班级学生内联编辑
    在班级编辑页面中直接管理学生
    """
    model = ClassStudent
    extra = 1
    verbose_name = '班级学生'
    verbose_name_plural = '班级学生列表'
    fields = ('student', 'joined_at', 'note')
    readonly_fields = ('joined_at',)
    autocomplete_fields = ['student']


class ClassAdmin(admin.ModelAdmin):
    """
    班级管理Admin配置
    """
    # 列表页显示字段
    list_display = ('id', 'name', 'teacher', 'academic_year', 'semester', 'student_count', 'is_active', 'created_at')

    # 列表页筛选器
    list_filter = ('is_active', 'academic_year', 'semester', 'teacher', 'created_at')

    # 搜索字段
    search_fields = ('name', 'description', 'teacher__username')

    # 只读字段
    readonly_fields = ('created_at', 'updated_at', 'student_count')

    # 每页显示数量
    list_per_page = 20

    # 日期层级导航
    date_hierarchy = 'created_at'

    # 内联编辑
    inlines = [ClassStudentInline]

    # 字段分组
    fieldsets = (
        ('基本信息', {
            'fields': ('name', 'teacher', 'is_active')
        }),
        ('学期信息', {
            'fields': ('academic_year', 'semester')
        }),
        ('详细信息', {
            'fields': ('description', 'student_count')
        }),
        ('时间信息', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def student_count(self, obj):
        """显示班级学生数量"""
        return obj.student_count
    student_count.short_description = '学生数'


class ClassStudentAdmin(admin.ModelAdmin):
    """
    班级学生关联管理Admin配置
    """
    # 列表页显示字段
    list_display = ('id', 'class_obj', 'student', 'joined_at')

    # 列表页筛选器
    list_filter = ('class_obj', 'joined_at')

    # 搜索字段
    search_fields = ('class_obj__name', 'student__username', 'student__profile__real_name')

    # 只读字段
    readonly_fields = ('joined_at',)

    # 每页显示数量
    list_per_page = 50

    # 日期层级导航
    date_hierarchy = 'joined_at'

    # 自动完成字段
    autocomplete_fields = ['student']

    # 字段分组
    fieldsets = (
        ('关联信息', {
            'fields': ('class_obj', 'student')
        }),
        ('其他信息', {
            'fields': ('note', 'joined_at')
        }),
    )


# 注册模型
admin_site.register(Class, ClassAdmin)
admin_site.register(ClassStudent, ClassStudentAdmin)
