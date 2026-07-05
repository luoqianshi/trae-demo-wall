"""
测试优惠券 API 接口
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_mall.settings')
django.setup()

from apps.user.models import User
from apps.coupon.models import Coupon, UserCoupon
from apps.coupon.serializers import UserCouponSerializer
from django.utils import timezone
from datetime import timedelta

print('=== 测试优惠券数据 ===')

# 获取第一个学生用户
student = User.objects.filter(user_type=1).first()
if not student:
    print('没有找到学生用户')
    exit()

print(f'测试用户：{student.username} (ID={student.id})')

# 查询该用户的优惠券
user_coupons = UserCoupon.objects.filter(user=student, status=1).order_by('-get_time')
print(f'\n用户可用优惠券数量：{user_coupons.count()}')

if user_coupons.exists():
    print('\n优惠券列表：')
    serializer = UserCouponSerializer(user_coupons, many=True)
    for i, data in enumerate(serializer.data, 1):
        print(f'\n{i}. 优惠券数据：')
        for key, value in data.items():
            print(f'   {key}: {value}')
else:
    print('\n该用户没有可用优惠券')
    print('\n创建测试优惠券...')
    
    # 创建测试优惠券
    coupon = Coupon.objects.create(
        name='测试优惠券',
        type=1,
        condition=50.00,
        value=10.00,
        start_time=timezone.now(),
        end_time=timezone.now() + timedelta(days=30)
    )
    
    # 发放给用户
    user_coupon = UserCoupon.objects.create(
        user=student,
        coupon=coupon
    )
    
    print(f'已创建优惠券并发放给用户')
    
    # 序列化数据
    serializer = UserCouponSerializer(user_coupon)
    print('\n序列化后的数据：')
    for key, value in serializer.data.items():
        print(f'   {key}: {value}')
