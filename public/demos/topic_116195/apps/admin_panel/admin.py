"""
管理员端 - Django Admin配置
合并用户管理和用户扩展信息，添加系统配置管理
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from django.utils.html import format_html
from config.admin import admin_site
from apps.users.models import UserProfile
from .models import SystemConfig


# ========== 用户管理（合并用户扩展信息） ==========

class UserProfileInline(admin.StackedInline):
    """用户扩展信息内联编辑"""
    model = UserProfile
    can_delete = False
    verbose_name = '用户扩展信息'
    verbose_name_plural = '用户扩展信息'
    fields = ('role', 'real_name', 'student_id')


class CustomUserAdmin(BaseUserAdmin):
    """自定义用户管理 - 集成扩展信息"""
    inlines = (UserProfileInline,)
    list_display = ('username', 'email', 'role_display', 'real_name_display', 'is_active', 'date_joined', 'last_login')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'date_joined', 'profile__role')
    search_fields = ('username', 'email', 'first_name', 'last_name', 'profile__real_name', 'profile__student_id')
    ordering = ('-date_joined',)

    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('个人信息', {'fields': ('first_name', 'last_name', 'email')}),
        ('权限', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('重要日期', {'fields': ('last_login', 'date_joined')}),
    )

    def role_display(self, obj):
        """显示角色 - 基于UserProfile的role字段"""
        try:
            profile = obj.profile
            role_map = {
                'admin': '<span style="color: #dc2626; font-weight: bold;">管理员</span>',
                'teacher': '<span style="color: #2563eb; font-weight: bold;">教师</span>',
                'student': '<span style="color: #16a34a;">学生</span>',
            }
            return format_html(role_map.get(profile.role, '未设置'))
        except UserProfile.DoesNotExist:
            # 如果没有Profile，根据Django权限判断
            if obj.is_superuser:
                return format_html('<span style="color: #dc2626; font-weight: bold;">管理员</span>')
            elif obj.is_staff:
                return format_html('<span style="color: #2563eb; font-weight: bold;">教师</span>')
            return format_html('<span style="color: #999;">未设置</span>')
    role_display.short_description = '角色'

    def real_name_display(self, obj):
        """显示真实姓名"""
        try:
            return obj.profile.real_name or '-'
        except UserProfile.DoesNotExist:
            return '-'
    real_name_display.short_description = '真实姓名'


# ========== 系统配置管理 ==========

class SystemConfigAdmin(admin.ModelAdmin):
    """系统配置管理"""
    list_display = ('key', 'value_preview', 'description', 'updated_at')
    search_fields = ('key', 'value', 'description')
    readonly_fields = ('updated_at',)
    ordering = ('key',)

    fieldsets = (
        ('配置信息', {
            'fields': ('key', 'value', 'description')
        }),
        ('时间信息', {
            'fields': ('updated_at',),
            'classes': ('collapse',)
        }),
    )

    def value_preview(self, obj):
        """显示配置值预览"""
        if len(obj.value) > 50:
            return obj.value[:50] + '...'
        return obj.value
    value_preview.short_description = '配置值'

    def save_model(self, request, obj, form, change):
        """保存时自动初始化常用配置"""
        super().save_model(request, obj, form, change)

        # 确保Ollama配置存在
        if not SystemConfig.objects.filter(key='ollama_base_url').exists():
            SystemConfig.set_value('ollama_base_url', 'http://localhost:11434', 'Ollama服务地址')
        if not SystemConfig.objects.filter(key='ollama_model').exists():
            SystemConfig.set_value('ollama_model', 'qwen2.5-coder:7b', 'Ollama模型名称')


# 注册模型到自定义admin站点
# 先取消User的默认注册（如果已注册）
if admin_site.is_registered(User):
    admin_site.unregister(User)

admin_site.register(User, CustomUserAdmin)
admin_site.register(SystemConfig, SystemConfigAdmin)




