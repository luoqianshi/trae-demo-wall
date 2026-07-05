import os
import django
import sys

project_path = os.path.dirname(os.path.abspath(__file__))
sys.path.append(project_path)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_mall_backend.settings')
django.setup()

from apps.user.models import User
from decimal import Decimal

def update_balance():
    # 在这里修改用户邮箱和余额
    user_email = 'user@example.com'  # 修改为目标用户邮箱
    new_balance = Decimal('100.00')  # 修改为目标余额
    
    try:
        user = User.objects.get(email=user_email)
        old_balance = user.balance
        user.balance = new_balance
        user.save()
        print(f'用户 {user_email} 余额已修改')
        print(f'原余额: ¥{old_balance}')
        print(f'新余额: ¥{user.balance}')
    except User.DoesNotExist:
        print(f'用户不存在: {user_email}')
        print('\n现有用户列表:')
        for u in User.objects.all()[:10]:
            print(f'  - {u.email} (余额: ¥{u.balance})')

if __name__ == '__main__':
    update_balance()
