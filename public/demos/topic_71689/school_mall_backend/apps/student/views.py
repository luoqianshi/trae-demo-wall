from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import StudentInfo, StudentAddress
from .serializers import (
    StudentInfoSerializer, StudentInfoCreateSerializer,
    StudentInfoUpdateSerializer, StudentInfoCertifySerializer,
    StudentAddressSerializer, StudentAddressCreateSerializer,
    StudentAddressUpdateSerializer
)

class StudentInfoView(APIView):
    """学生信息视图"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """获取学生信息"""
        try:
            student_info = StudentInfo.objects.get(user=request.user)
            serializer = StudentInfoSerializer(student_info)
            return Response({
                'code': 200,
                'message': '获取成功',
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        except StudentInfo.DoesNotExist:
            return Response({
                'code': 404,
                'message': '学生信息不存在'
            }, status=status.HTTP_404_NOT_FOUND)
    
    def post(self, request):
        """创建学生信息"""
        try:
            # 检查是否已存在学生信息
            StudentInfo.objects.get(user=request.user)
            return Response({
                'code': 400,
                'message': '学生信息已存在'
            }, status=status.HTTP_400_BAD_REQUEST)
        except StudentInfo.DoesNotExist:
            serializer = StudentInfoCreateSerializer(data=request.data)
            if serializer.is_valid():
                student_info = serializer.save(user=request.user)
                return Response({
                    'code': 201,
                    'message': '创建成功',
                    'data': StudentInfoSerializer(student_info).data
                }, status=status.HTTP_201_CREATED)
            return Response({
                'code': 400,
                'message': '创建失败',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
    
    def put(self, request):
        """更新学生信息"""
        try:
            student_info = StudentInfo.objects.get(user=request.user)
            serializer = StudentInfoUpdateSerializer(student_info, data=request.data)
            if serializer.is_valid():
                student_info = serializer.save()
                return Response({
                    'code': 200,
                    'message': '更新成功',
                    'data': StudentInfoSerializer(student_info).data
                }, status=status.HTTP_200_OK)
            return Response({
                'code': 400,
                'message': '更新失败',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        except StudentInfo.DoesNotExist:
            return Response({
                'code': 404,
                'message': '学生信息不存在'
            }, status=status.HTTP_404_NOT_FOUND)

class StudentCertifyView(APIView):
    """学生认证视图"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """学生认证"""
        try:
            # 检查是否已存在学生信息
            try:
                student_info = StudentInfo.objects.get(user=request.user)
                # 如果已存在，则更新
                serializer = StudentInfoCreateSerializer(student_info, data=request.data)
            except StudentInfo.DoesNotExist:
                # 如果不存在，则创建
                serializer = StudentInfoCreateSerializer(data=request.data)
                
            if serializer.is_valid():
                student_info = serializer.save(user=request.user)
                
                # 更新用户的实名状态
                request.user.is_real_name = 1
                request.user.save()
                
                # 设置学生认证状态
                student_info.is_certified = 1
                student_info.save()
                
                # 学生认证成功后自动发放优惠券
                try:
                    from apps.coupon.views import CouponAutoSendView
                    # 调用自动发放优惠券的方法
                    coupon_view = CouponAutoSendView()
                    coupon_view._send_student_certify_coupon(request.user)
                except Exception as e:
                    # 记录错误但不影响认证流程
                    print(f"自动发放学生认证优惠券失败: {str(e)}")
                    
                return Response({
                    'code': 200,
                    'message': '认证成功',
                    'data': StudentInfoSerializer(student_info).data
                }, status=status.HTTP_200_OK)
            return Response({
                'code': 400,
                'message': '认证失败',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({
                'code': 500,
                'message': f'服务器错误: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class StudentAddressListView(APIView):
    """学生地址列表视图"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """获取地址列表"""
        addresses = StudentAddress.objects.filter(user=request.user)
        serializer = StudentAddressSerializer(addresses, many=True)
        return Response({
            'code': 200,
            'message': '获取成功',
            'data': serializer.data
        }, status=status.HTTP_200_OK)
    
    def post(self, request):
        """创建地址"""
        serializer = StudentAddressCreateSerializer(data=request.data)
        if serializer.is_valid():
            address = serializer.save(user=request.user)
            # 如果设置为默认地址，将其他地址设为非默认
            if address.is_default:
                StudentAddress.objects.filter(user=request.user).exclude(id=address.id).update(is_default=False)
            return Response({
                'code': 201,
                'message': '创建成功',
                'data': StudentAddressSerializer(address).data
            }, status=status.HTTP_201_CREATED)
        return Response({
            'code': 400,
            'message': '创建失败',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

class StudentAddressDetailView(APIView):
    """学生地址详情视图"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, address_id):
        """获取地址详情"""
        try:
            address = StudentAddress.objects.get(id=address_id, user=request.user)
            serializer = StudentAddressSerializer(address)
            return Response({
                'code': 200,
                'message': '获取成功',
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        except StudentAddress.DoesNotExist:
            return Response({
                'code': 404,
                'message': '地址不存在'
            }, status=status.HTTP_404_NOT_FOUND)
    
    def put(self, request, address_id):
        """更新地址"""
        try:
            address = StudentAddress.objects.get(id=address_id, user=request.user)
            serializer = StudentAddressUpdateSerializer(address, data=request.data)
            if serializer.is_valid():
                updated_address = serializer.save()
                # 如果设置为默认地址，将其他地址设为非默认
                if updated_address.is_default:
                    StudentAddress.objects.filter(user=request.user).exclude(id=address_id).update(is_default=False)
                return Response({
                    'code': 200,
                    'message': '更新成功',
                    'data': StudentAddressSerializer(updated_address).data
                }, status=status.HTTP_200_OK)
            return Response({
                'code': 400,
                'message': '更新失败',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        except StudentAddress.DoesNotExist:
            return Response({
                'code': 404,
                'message': '地址不存在'
            }, status=status.HTTP_404_NOT_FOUND)
    
    def delete(self, request, address_id):
        """删除地址"""
        try:
            address = StudentAddress.objects.get(id=address_id, user=request.user)
            address.delete()
            return Response({
                'code': 200,
                'message': '删除成功'
            }, status=status.HTTP_200_OK)
        except StudentAddress.DoesNotExist:
            return Response({
                'code': 404,
                'message': '地址不存在'
            }, status=status.HTTP_404_NOT_FOUND)
