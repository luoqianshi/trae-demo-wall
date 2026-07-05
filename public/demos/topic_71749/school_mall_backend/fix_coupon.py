import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_mall_backend.settings')
django.setup()

from apps.user.models import User
from apps.student.models import StudentInfo
from apps.coupon.models import Coupon, UserCoupon
from django.utils import timezone
from datetime import timedelta

print("=" * 60)
print("一键修复优惠券系统")
print("=" * 60)

# 1. 给所有学生创建 StudentInfo 并认证
print("\n[1] 认证所有学生用户...")
students = User.objects.filter(user_type=1)
for s in students:
    info, created = StudentInfo.objects.get_or_create(
        user=s,
        defaults={
            'student_name': s.username,
            'student_no': 'STU{:06d}'.format(s.id),
            'school_name': '测试大学',
            'department': '计算机学院',
            'grade': '2024',
            'class_field': '1班',
            'is_certified': 1
        }
    )
    if not created and info.is_certified == 0:
        info.is_certified = 1
        info.save()
    print("    {} {}: is_certified=1".format('created' if created else 'updated', s.username))

# 2. 创建新的未过期优惠券
print("\n[2] 创建新优惠券...")
now = timezone.now()
new_coupon = Coupon.objects.create(
    name='新人专享券',
    type=1,
    condition=50.00,
    value=10.00,
    start_time=now,
    end_time=now + timedelta(days=30)
)
print("    已创建: {} (满{}减{}, 有效期至 {})".format(
    new_coupon.name, new_coupon.condition, new_coupon.value,
    new_coupon.end_time.strftime('%Y-%m-%d')
))

# 3. 发放给所有学生
print("\n[3] 发放优惠券给所有学生...")
count = 0
for s in students:
    if not UserCoupon.objects.filter(user=s, coupon=new_coupon).exists():
        UserCoupon.objects.create(user=s, coupon=new_coupon)
        count += 1
        print("    发放给: {}".format(s.username))
print("    共发放 {} 人".format(count))

# 4. 验证
print("\n[4] 验证结果...")
for s in students:
    my_coupons = UserCoupon.objects.filter(user=s, coupon=new_coupon, status=1)
    print("    {}: {} 张可用优惠券".format(s.username, my_coupons.count()))

print("\n" + "=" * 60)
print("修复完成! 请重启后端服务后测试。")
print("=" * 60)