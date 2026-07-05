"""
优惠券功能测试指南

请在 Django shell 中执行以下命令：

python manage.py shell

然后复制粘贴以下代码：
"""

from apps.user.models import User
from apps.coupon.models import Coupon, UserCoupon
from django.utils import timezone
from datetime import timedelta

print("=" * 60)
print("优惠券功能测试指南")
print("=" * 60)

# 步骤 1：检查是否有学生用户
print("\n1. 检查学生用户...")
students = User.objects.filter(user_type=1)
print(f"   找到 {students.count()} 个学生用户")
if students.exists():
    for s in students[:3]:
        print(f"   - {s.username} ({s.email})")

# 步骤 2：检查是否有优惠券
print("\n2. 检查优惠券...")
coupons = Coupon.objects.all()
print(f"   找到 {coupons.count()} 个优惠券")
if coupons.exists():
    for c in coupons:
        print(f"   - {c.name} (满{c.condition}减{c.value})")
else:
    print("   没有优惠券，需要创建一个测试优惠券")
    coupon = Coupon.objects.create(
        name='测试优惠券',
        type=1,  # 满减券
        condition=50.00,
        value=10.00,
        start_time=timezone.now(),
        end_time=timezone.now() + timedelta(days=30)
    )
    print(f"   已创建：{coupon.name}")
    coupons = Coupon.objects.all()

# 步骤 3：检查用户优惠券关联
print("\n3. 检查用户优惠券关联...")
if students.exists() and coupons.exists():
    student = students.first()
    coupon = coupons.first()
    
    user_coupons = UserCoupon.objects.filter(user=student, coupon=coupon)
    if user_coupons.exists():
        print(f"   ✓ 用户 {student.username} 已有优惠券 {coupon.name}")
    else:
        print(f"   ✗ 用户 {student.username} 没有优惠券 {coupon.name}")
        print("   正在发放优惠券...")
        UserCoupon.objects.create(user=student, coupon=coupon)
        print(f"   ✓ 已发放给 {student.username}")
    
    # 检查该用户的所有优惠券
    all_my_coupons = UserCoupon.objects.filter(user=student).order_by('-get_time')
    print(f"\n   用户 {student.username} 的所有优惠券:")
    for uc in all_my_coupons:
        print(f"   - {uc.coupon.name}: 状态={uc.get_status_display()}, 有效期={uc.coupon.end_time}")
else:
    print("   无法测试，缺少学生用户或优惠券")

# 步骤 4：测试 API 查询
print("\n4. 测试 API 查询（模拟前端调用）...")
if students.exists():
    student = students.first()
    from django.db.models import Q
    
    # 模拟前端请求：GET /api/coupon/user/list/?status=1
    query = Q(user=student) & Q(status=1)  # status=1 表示未使用
    available_coupons = UserCoupon.objects.filter(query).order_by('-get_time')
    
    print(f"   查询条件：user={student.username}, status=1(未使用)")
    print(f"   查询结果：{available_coupons.count()} 个可用优惠券")
    
    if available_coupons.exists():
        for uc in available_coupons:
            print(f"   ✓ {uc.coupon.name}: 满{uc.coupon.condition}减{uc.coupon.value}")
            print(f"      有效期：{uc.coupon.start_time} 至 {uc.coupon.end_time}")
    else:
        print("   ✗ 没有可用优惠券")
        print("   可能原因：")
        print("   - 优惠券状态不是'未使用'(status!=1)")
        print("   - 优惠券已过期")
        print("   - 用户确实没有优惠券")

print("\n" + "=" * 60)
print("测试完成！")
print("=" * 60)
print("\n如果以上测试都正常，但前端仍然看不到优惠券，请检查：")
print("1. 前端是否正确调用 API：GET /api/coupon/user/list/?status=1")
print("2. 浏览器控制台是否有错误信息")
print("3. 用户是否登录（需要有效的 token）")
print("4. 优惠券的有效期是否包含当前时间")
