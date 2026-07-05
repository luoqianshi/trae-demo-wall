"""
优惠券诊断 + 一键修复脚本
用法: python manage.py shell < diagnose_and_fix.py
"""
import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_mall_backend.settings')
django.setup()

from apps.user.models import User
from apps.student.models import StudentInfo
from apps.coupon.models import Coupon, UserCoupon
from django.utils import timezone
from datetime import timedelta

print("=" * 60)
print("优惠券系统诊断")
print("=" * 60)

# 1. 检查学生用户
print("\n[1] 学生用户 (user_type=1):")
students = User.objects.filter(user_type=1)
print(f"    总数: {students.count()}")
for s in students:
    has_info = hasattr(s, 'student_info')
    certified = s.student_info.is_certified if has_info else 'N/A'
    print(f"    - {s.username} | 有StudentInfo: {has_info} | 已认证: {certified}")

# 2. 检查 StudentInfo
print("\n[2] StudentInfo 表:")
all_infos = StudentInfo.objects.all()
print(f"    总记录数: {all_infos.count()}")
certified = StudentInfo.objects.filter(is_certified=1)
print(f"    已认证数: {certified.count()}")
for info in all_infos:
    print(f"    - {info.user.username}: is_certified={info.is_certified}")

# 3. 检查优惠券
print("\n[3] 优惠券表:")
coupons = Coupon.objects.all()
print(f"    总数: {coupons.count()}")
for c in coupons:
    print(f"    - ID={c.id} {c.name} | 满{c.condition}减{c.value} | {c.start_time}~{c.end_time}")

# 4. 检查用户优惠券关联
print("\n[4] 用户优惠券关联:")
user_coupons = UserCoupon.objects.all()
print(f"    总数: {user_coupons.count()}")
for uc in user_coupons:
    print(f"    - {uc.user.username}: {uc.coupon.name} status={uc.status}")

# 5. 模拟 CouponSendView 查询
print("\n[5] 模拟 CouponSendView 查询:")
print("    scope='all':")
all_users = User.objects.filter(user_type=1)
print(f"      结果: {all_users.count()} 人")

print("    scope='student' (student_info__is_certified=1):")
cert_users = User.objects.filter(user_type=1, student_info__is_certified=1)
print(f"      结果: {cert_users.count()} 人")
for u in cert_users:
    print(f"      - {u.username}")

# 6. 模拟前端 API 调用
print("\n[6] 模拟前端 GET /api/coupon/user/list/?status=1:")
if students.exists():
    test_student = students.first()
    from django.db.models import Q
    query = Q(user=test_student) & Q(status=1)
    result = UserCoupon.objects.filter(query)
    print(f"    用户 {test_student.username} 的可用优惠券: {result.count()} 个")
    for uc in result:
        print(f"      - {uc.coupon.name} (到期: {uc.coupon.end_time})")

print("\n" + "=" * 60)
print("诊断完成")
print("=" * 60)

# 自动修复
if certified.count() == 0 and students.exists():
    print("\n⚠️ 没有已认证学生！正在自动修复...")
    for s in students:
        info, created = StudentInfo.objects.get_or_create(
            user=s,
            defaults={
                'student_name': s.username,
                'student_no': f'STU{s.id:06d}',
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
        print(f"    ✓ {s.username} 已设为认证学生")

if coupons.count() == 0:
    print("\n⚠️ 没有优惠券！正在创建...")
    c = Coupon.objects.create(
        name='新人专享券',
        type=1,
        condition=50.00,
        value=10.00,
        start_time=timezone.now(),
        end_time=timezone.now() + timedelta(days=30)
    )
    print(f"    ✓ 已创建: {c.name}")

if user_coupons.count() == 0 and coupons.exists() and students.exists():
    print("\n⚠️ 没有发放记录！正在发放...")
    coupon = coupons.first()
    for s in students:
        if not UserCoupon.objects.filter(user=s, coupon=coupon).exists():
            UserCoupon.objects.create(user=s, coupon=coupon)
    print(f"    ✓ 已发放给所有学生")

print("\n✅ 修复完成！请重启后端服务后测试。")