"""
测试优惠券发放功能
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_mall.settings')
django.setup()

from apps.user.models import User
from apps.coupon.models import Coupon, UserCoupon
from django.utils import timezone
from datetime import timedelta

# 1. 创建测试优惠券
print('=== 创建测试优惠券 ===')
coupon = Coupon.objects.create(
    name='测试优惠券',
    type=1,  # 满减券
    condition=50.00,  # 满 50 元可用
    value=10.00,  # 减 10 元
    start_time=timezone.now(),
    end_time=timezone.now() + timedelta(days=30)
)
print(f'创建优惠券：{coupon.name} (ID={coupon.id})')

# 2. 获取所有学生用户
print('\n=== 获取学生用户 ===')
students = User.objects.filter(user_type=1)
print(f'找到 {students.count()} 个学生用户')
for student in students:
    print(f'  - {student.username} ({student.email})')

# 3. 发放优惠券给所有学生
print('\n=== 发放优惠券 ===')
count = 0
for student in students:
    if not UserCoupon.objects.filter(user=student, coupon=coupon).exists():
        UserCoupon.objects.create(
            user=student,
            coupon=coupon
        )
        count += 1
        print(f'✓ 发放给 {student.username}')
    else:
        print(f'✗ {student.username} 已拥有该优惠券')

print(f'\n发放完成！共发放给 {count} 个用户')

# 4. 验证发放结果
print('\n=== 验证发放结果 ===')
user_coupons = UserCoupon.objects.filter(coupon=coupon)
print(f'优惠券发放记录数：{user_coupons.count()}')
for uc in user_coupons:
    print(f'  - {uc.user.username}: 状态={uc.get_status_display()}, 获取时间={uc.get_time}')

# 5. 测试学生查询优惠券
if students.exists():
    print(f'\n=== 测试学生查询优惠券 ===')
    test_student = students.first()
    print(f'测试用户：{test_student.username}')
    
    my_coupons = UserCoupon.objects.filter(user=test_student, status=1)
    print(f'可用优惠券数量：{my_coupons.count()}')
    for coupon in my_coupons:
        print(f'  - {coupon.coupon.name}: 满{coupon.coupon.condition}减{coupon.coupon.value}')

print('\n=== 测试完成 ===')
