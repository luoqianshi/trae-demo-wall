"""
创建测试用户的管理命令
使用方法: python manage.py create_test_users
"""
import sys
import io
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from apps.users.models import UserProfile


class Command(BaseCommand):
    help = 'Create test users (students and teachers)'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # 设置stdout为UTF-8编码，避免Windows控制台乱码
        if sys.platform == 'win32':
            try:
                sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
            except:
                pass  # 如果设置失败，使用默认编码

    def handle(self, *args, **options):
        # 创建学生用户
        student_user, created = User.objects.get_or_create(
            username='student001',
            defaults={
                'email': 'student001@example.com',
                'first_name': 'Zhang',
                'last_name': 'San'
            }
        )
        if created:
            student_user.set_password('123456')
            student_user.save()
            UserProfile.objects.create(
                user=student_user,
                role='student',
                real_name='张三',
                student_id='2024001'
            )
            self.stdout.write(self.style.SUCCESS('[OK] Created student user: student001 (password: 123456)'))
        else:
            self.stdout.write(self.style.WARNING('Student user student001 already exists'))

        # 创建教师用户
        teacher_user, created = User.objects.get_or_create(
            username='teacher001',
            defaults={
                'email': 'teacher001@example.com',
                'first_name': 'Li',
                'last_name': 'Teacher'
            }
        )
        if created:
            teacher_user.set_password('123456')
            teacher_user.save()
            UserProfile.objects.create(
                user=teacher_user,
                role='teacher',
                real_name='李老师',
                student_id='T2024001'
            )
            self.stdout.write(self.style.SUCCESS('[OK] Created teacher user: teacher001 (password: 123456)'))
        else:
            self.stdout.write(self.style.WARNING('Teacher user teacher001 already exists'))

        # 创建超级管理员
        admin_user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@example.com',
                'is_staff': True,
                'is_superuser': True
            }
        )
        if created:
            admin_user.set_password('admin123')
            admin_user.save()
            UserProfile.objects.create(
                user=admin_user,
                role='teacher',
                real_name='系统管理员'
            )
            self.stdout.write(self.style.SUCCESS('[OK] Created admin user: admin (password: admin123)'))
        else:
            self.stdout.write(self.style.WARNING('Admin user admin already exists'))

        self.stdout.write(self.style.SUCCESS('\nTest users created successfully!'))
        self.stdout.write('Note: Chinese names are stored in database but displayed in English to avoid console encoding issues.')
