"""
用户模块Admin配置
UserProfile已通过内联方式集成到admin_panel的User管理中
"""
from django.contrib import admin
from config.admin import admin_site
from .models import UserProfile

# UserProfile已通过内联方式在admin_panel中管理，这里不再单独注册
# 如果需要单独管理UserProfile，可以取消下面的注释

# class UserProfileAdmin(admin.ModelAdmin):
#     """用户扩展信息独立管理"""
#     list_display = ('user', 'role', 'real_name', 'student_id', 'created_at')
#     list_filter = ('role', 'created_at')
#     search_fields = ('user__username', 'real_name', 'student_id')
#     readonly_fields = ('created_at', 'updated_at')
#
#     fieldsets = (
#         ('基本信息', {
#             'fields': ('user', 'role')
#         }),
#         ('详细信息', {
#             'fields': ('real_name', 'student_id')
#         }),
#         ('时间信息', {
#             'fields': ('created_at', 'updated_at'),
#             'classes': ('collapse',)
#         }),
#     )
#
# admin_site.register(UserProfile, UserProfileAdmin)

