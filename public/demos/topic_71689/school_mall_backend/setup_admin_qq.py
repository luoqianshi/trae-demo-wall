import os
import django
import sys

project_path = os.path.dirname(os.path.abspath(__file__))
sys.path.append(project_path)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_mall_backend.settings')
django.setup()

from apps.user.models import User

def setup_admin():
    email = 'admin@qq.com'
    password = 'admin123'
    
    try:
        user = User.objects.get(email=email)
        # 更新为管理员权限
        user.user_type = 3  # 系统管理员
        user.is_staff = True
        user.is_superuser = True
        user.set_password(password)
        user.save()
        print(f'管理员账号已更新: {email}')
        print(f'密码已设置为: {password}')
        print(f'用户类型: {user.user_type} (系统管理员)')
    except User.DoesNotExist:
        # 创建新管理员
        user = User.objects.create(
            email=email,
            username=email,
            user_type=3,  # 系统管理员
            is_staff=True,
            is_superuser=True,
            status=1
        )
        user.set_password(password)
        user.save()
        print(f'管理员账号已创建: {email}')
        print(f'密码: {password}')

if __name__ == '__main__':
    setup_admin()
