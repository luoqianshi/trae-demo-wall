from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from apps.user.permissions import IsAdminUser
from django.db.models import Q
from django.utils import timezone
from datetime import timedelta
from .models import Coupon, UserCoupon
from .serializers import (
    CouponSerializer, CouponCreateSerializer, UserCouponSerializer,
    UserCouponCreateSerializer, UserCouponUseSerializer
)
from apps.user.models import User
from apps.student.models import StudentInfo

class CouponView(APIView):
    """优惠券管理视图（管理员）"""
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get(self, request):
        """获取优惠券列表"""
        coupons = Coupon.objects.all().order_by('-create_time')
        serializer = CouponSerializer(coupons, many=True)
        return Response({
            'code': 200,
            'message': '获取成功',
            'data': serializer.data
        }, status=status.HTTP_200_OK)
    
    def post(self, request):
        """创建优惠券"""
        serializer = CouponCreateSerializer(data=request.data)
        if serializer.is_valid():
            coupon = serializer.save()
            return Response({
                'code': 201,
                'message': '创建成功',
                'data': CouponSerializer(coupon).data
            }, status=status.HTTP_201_CREATED)
        return Response({
            'code': 400,
            'message': '创建失败',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

class CouponDetailView(APIView):
    """优惠券详情视图（管理员）"""
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get(self, request, coupon_id):
        """获取优惠券详情"""
        try:
            coupon = Coupon.objects.get(id=coupon_id)
            serializer = CouponSerializer(coupon)
            return Response({
                'code': 200,
                'message': '获取成功',
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        except Coupon.DoesNotExist:
            return Response({
                'code': 404,
                'message': '优惠券不存在'
            }, status=status.HTTP_404_NOT_FOUND)
    
    def put(self, request, coupon_id):
        """更新优惠券"""
        try:
            coupon = Coupon.objects.get(id=coupon_id)
            serializer = CouponCreateSerializer(coupon, data=request.data)
            if serializer.is_valid():
                coupon = serializer.save()
                return Response({
                    'code': 200,
                    'message': '更新成功',
                    'data': CouponSerializer(coupon).data
                }, status=status.HTTP_200_OK)
            return Response({
                'code': 400,
                'message': '更新失败',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        except Coupon.DoesNotExist:
            return Response({
                'code': 404,
                'message': '优惠券不存在'
            }, status=status.HTTP_404_NOT_FOUND)
    
    def delete(self, request, coupon_id):
        """删除优惠券"""
        try:
            coupon = Coupon.objects.get(id=coupon_id)
            coupon.delete()
            return Response({
                'code': 200,
                'message': '删除成功'
            }, status=status.HTTP_200_OK)
        except Coupon.DoesNotExist:
            return Response({
                'code': 404,
                'message': '优惠券不存在'
            }, status=status.HTTP_404_NOT_FOUND)

class UserCouponView(APIView):
    """用户优惠券视图"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """获取用户优惠券列表"""
        # 获取查询参数
        coupon_status = request.query_params.get('status')
        
        # 构建查询条件
        query = Q(user=request.user)
        if coupon_status is not None:
            query &= Q(status=coupon_status)
        
        user_coupons = UserCoupon.objects.filter(query).order_by('-get_time')
        serializer = UserCouponSerializer(user_coupons, many=True)
        return Response({
            'code': 200,
            'message': '获取成功',
            'data': serializer.data
        }, status=status.HTTP_200_OK)
    
    def post(self, request):
        """发放优惠券给用户（管理员）"""
        if not request.user.is_superuser:
            return Response({
                'code': 403,
                'message': '没有权限执行此操作'
            }, status=status.HTTP_403_FORBIDDEN)
        
        coupon_id = request.data.get('coupon_id')
        scope = request.data.get('scope', 'all')  # all: 全部用户，student: 仅认证学生
        
        if not coupon_id:
            return Response({
                'code': 400,
                'message': '优惠券 ID 不能为空'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            coupon = Coupon.objects.get(id=coupon_id)
        except Coupon.DoesNotExist:
            return Response({
                'code': 404,
                'message': '优惠券不存在'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # 根据 scope 获取用户列表
        if scope == 'student':
            # 仅发放给已实名认证的学生用户
            from apps.student.models import StudentInfo
            student_users = StudentInfo.objects.filter(is_certified=1).values_list('user_id', flat=True)
            users = User.objects.filter(id__in=student_users, user_type=1)
        else:
            # 发放给所有学生用户
            users = User.objects.filter(user_type=1)
        
        if not users.exists():
            return Response({
                'code': 400,
                'message': '没有符合条件的用户，请先让学生用户进行实名认证'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 批量发放优惠券
        count = 0
        for user in users:
            # 检查用户是否已拥有该优惠券
            if not UserCoupon.objects.filter(user=user, coupon=coupon).exists():
                UserCoupon.objects.create(
                    user=user,
                    coupon=coupon
                )
                count += 1
        
        return Response({
            'code': 200,
            'message': f'发放成功，共发放给 {count} 个用户'
        }, status=status.HTTP_200_OK)

class UserCouponDetailView(APIView):
    """用户优惠券详情视图"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, user_coupon_id):
        """获取用户优惠券详情"""
        try:
            user_coupon = UserCoupon.objects.get(id=user_coupon_id)
            # 检查权限，普通用户只能查看自己的优惠券
            if not request.user.is_superuser and user_coupon.user != request.user:
                return Response({
                    'code': 403,
                    'message': '没有权限访问该优惠券'
                }, status=status.HTTP_403_FORBIDDEN)
            
            serializer = UserCouponSerializer(user_coupon)
            return Response({
                'code': 200,
                'message': '获取成功',
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        except UserCoupon.DoesNotExist:
            return Response({
                'code': 404,
                'message': '优惠券不存在'
            }, status=status.HTTP_404_NOT_FOUND)
    
    def put(self, request, user_coupon_id):
        """使用优惠券"""
        try:
            user_coupon = UserCoupon.objects.get(id=user_coupon_id, user=request.user, status=UserCoupon.STATUS_UNUSED)
            
            # 检查优惠券是否过期
            if user_coupon.coupon.end_time < timezone.now():
                # 更新为过期状态
                user_coupon.status = UserCoupon.STATUS_EXPIRED
                user_coupon.save()
                return Response({
                    'code': 400,
                    'message': '优惠券已过期'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            serializer = UserCouponUseSerializer(user_coupon, data=request.data)
            if serializer.is_valid():
                # 更新优惠券状态为已使用
                user_coupon.status = UserCoupon.STATUS_USED
                user_coupon.use_time = timezone.now()
                user_coupon = serializer.save()
                return Response({
                    'code': 200,
                    'message': '使用成功',
                    'data': UserCouponSerializer(user_coupon).data
                }, status=status.HTTP_200_OK)
            return Response({
                'code': 400,
                'message': '使用失败',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        except UserCoupon.DoesNotExist:
            return Response({
                'code': 404,
                'message': '优惠券不存在或已使用'
            }, status=status.HTTP_404_NOT_FOUND)

class CouponAutoSendView(APIView):
    """自动发放优惠券视图（供其他模块调用）"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """自动发放优惠券给用户"""
        # 获取用户信息
        user = request.user
        
        # 根据触发类型发放不同的优惠券
        trigger_type = request.data.get('trigger_type', 'login')
        
        if trigger_type == 'login':
            # 登录时发放优惠券
            self._send_login_coupon(user)
        elif trigger_type == 'student_certify':
            # 学生认证成功时发放优惠券
            self._send_student_certify_coupon(user)
        else:
            return Response({
                'code': 400,
                'message': '无效的触发类型'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            'code': 200,
            'message': '优惠券发放成功'
        }, status=status.HTTP_200_OK)
    
    def _send_login_coupon(self, user):
        """登录时发放优惠券"""
        # 检查用户是否已领取过登录优惠券（最近7天内）
        seven_days_ago = timezone.now() - timedelta(days=7)
        if UserCoupon.objects.filter(
            user=user, 
            get_time__gte=seven_days_ago,
            coupon__name__contains='登录'
        ).exists():
            return
        
        # 创建登录优惠券（如果不存在）
        login_coupon, created = Coupon.objects.get_or_create(
            name='登录优惠券',
            defaults={
                'type': Coupon.TYPE_NO_THRESHOLD,
                'condition': 0,
                'value': 5.00,
                'start_time': timezone.now(),
                'end_time': timezone.now() + timedelta(days=30)
            }
        )
        
        # 发放优惠券给用户
        self._send_coupon_to_user(user, login_coupon)
    
    def _send_student_certify_coupon(self, user):
        """学生认证成功时发放优惠券"""
        # 检查用户是否为学生
        if not hasattr(user, 'studentinfo'):
            return
        
        # 检查用户是否已领取过学生认证优惠券
        if UserCoupon.objects.filter(
            user=user,
            coupon__name__contains='学生认证'
        ).exists():
            return
        
        # 获取或创建学生认证优惠券
        # 按照用户要求：100元无门槛券
        student_coupon, created = Coupon.objects.get_or_create(
            name='学生认证专享券',
            defaults={
                'type': Coupon.TYPE_NO_THRESHOLD,
                'condition': 0,
                'value': 100.00,
                'start_time': timezone.now(),
                'end_time': timezone.now() + timedelta(days=365) # 有效期设长一点，比如一年
            }
        )
        
        # 发放5张优惠券给用户
        for _ in range(5):
            UserCoupon.objects.create(
                user=user,
                coupon=student_coupon
            )
    
    def _send_coupon_to_user(self, user, coupon):
        """发放优惠券给用户"""
        # 检查用户是否已拥有该优惠券
        if UserCoupon.objects.filter(user=user, coupon=coupon).exists():
            return
        
        # 创建用户优惠券关联
        UserCoupon.objects.create(
            user=user,
            coupon=coupon
        )

class CouponSendView(APIView):
    """发放优惠券视图（管理员）"""
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def post(self, request):
        """按范围发放优惠券"""
        coupon_id = request.data.get('coupon_id')
        scope = request.data.get('scope', 'all')
        user_ids = request.data.get('user_ids', [])
        
        if not coupon_id:
            return Response({
                'code': 400,
                'message': '请提供优惠券ID'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            coupon = Coupon.objects.get(id=coupon_id)
        except Coupon.DoesNotExist:
            return Response({
                'code': 404,
                'message': '优惠券不存在'
            }, status=status.HTTP_404_NOT_FOUND)
        
        if scope == 'all':
            users = User.objects.filter(user_type=1)
        elif scope == 'student':
            users = User.objects.filter(
                user_type=1,
                student_info__is_certified=1
            )
        elif scope == 'specific':
            if not user_ids:
                return Response({
                    'code': 400,
                    'message': '请提供用户ID列表'
                }, status=status.HTTP_400_BAD_REQUEST)
            users = User.objects.filter(id__in=user_ids)
        else:
            return Response({
                'code': 400,
                'message': '无效的发放范围'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not users.exists():
            return Response({
                'code': 400,
                'message': '没有符合条件的用户，请先让学生用户进行实名认证'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        sent_count = 0
        for user in users:
            if not UserCoupon.objects.filter(user=user, coupon=coupon).exists():
                UserCoupon.objects.create(
                    user=user,
                    coupon=coupon
                )
                sent_count += 1
            
        return Response({
            'code': 200,
            'message': f'成功向 {sent_count} 名用户发放了优惠券',
            'data': {'sent_count': sent_count}
        }, status=status.HTTP_200_OK)
