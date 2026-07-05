"""
检查优惠券数据
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_mall.settings')
django.setup()

from apps.user.models import User
from apps.coupon.models import Coupon, UserCoupon

print('=== 检查优惠券数据 ===\n')

# 1. 检查优惠券
print('1. 优惠券列表：')
coupons = Coupon.objects.all()
if coupons.exists():
    for c in coupons:
        print(f'   ID={c.id}, 名称={c.name}, 类型={c.type}, 条件={c.condition}, 价值={c.value}')
        print(f'      有效期：{c.start_time} 至 {c.end_time}')
else:
    print('   没有优惠券')

# 2. 检查用户优惠券关联
print('\n2. 用户优惠券关联：')
user_coupons = UserCoupon.objects.all()
if user_coupons.exists():
    for uc in user_coupons:
        print(f'   用户={uc.user.username}, 优惠券={uc.coupon.name}, 状态={uc.status}({uc.get_status_display()})')
        print(f'      获取时间={uc.get_time}')
else:
    print('   没有用户优惠券关联记录')

# 3. 检查学生用户的优惠券
print('\n3. 学生用户的优惠券：')
students = User.objects.filter(user_type=1)
for student in students[:5]:  # 只显示前 5 个
    my_coupons = UserCoupon.objects.filter(user=student)
    if my_coupons.exists():
        print(f'   学生 {student.username}:')
        for uc in my_coupons:
            print(f'      - {uc.coupon.name}: 状态={uc.status}, 有效期={uc.coupon.end_time}')
    else:
        print(f'   学生 {student.username}: 没有优惠券')

# 4. 测试查询
print('\n4. 测试查询（status=1 的优惠券）：')
from django.db.models import Q
test_student = students.first()
if test_student:
    query = Q(user=test_student) & Q(status=1)
    result = UserCoupon.objects.filter(query)
    print(f'   用户 {test_student.username} 的可用优惠券数量：{result.count()}')
    for uc in result:
        print(f'      - {uc.coupon.name}')
