from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from apps.user.permissions import IsAdminUser
from django.utils import timezone
from django.db import models
from .models import Merchant
from .serializers import (
    MerchantSerializer, MerchantCreateSerializer,
    MerchantUpdateSerializer, MerchantStatusSerializer,
    MerchantInfoSerializer
)

from apps.product.models import Product, Collection
from apps.order.models import Order
from django.db.models import Sum, Count

class MyMerchantsView(APIView):
    """获取用户收藏或购买过的商家列表"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # 1. 获取收藏商品的商家
        collected_product_ids = Collection.objects.filter(user=user).values_list('product_id', flat=True)
        merchant_ids_from_collections = Product.objects.filter(id__in=collected_product_ids).values_list('merchant_id', flat=True)
        
        # 2. 获取已购买商品的商家
        orders = Order.objects.filter(user=user, payment_status=Order.PAYMENT_SUCCESS)
        merchant_ids_from_orders = set()
        
        # 收集所有购买过的 product_id
        purchased_product_ids = set()
        for order in orders:
            if isinstance(order.product_info, list):
                for item in order.product_info:
                    if 'product_id' in item:
                        purchased_product_ids.add(item['product_id'])
        
        if purchased_product_ids:
            m_ids = Product.objects.filter(id__in=purchased_product_ids).values_list('merchant_id', flat=True)
            merchant_ids_from_orders.update(m_ids)
            
        # 合并并去重
        all_merchant_ids = set(merchant_ids_from_collections) | merchant_ids_from_orders
        
        # 获取商家详情
        merchants = Merchant.objects.filter(id__in=all_merchant_ids, status=Merchant.STATUS_APPROVED)
        serializer = MerchantInfoSerializer(merchants, many=True)
        
        return Response({
            'code': 200,
            'message': '获取成功',
            'data': serializer.data
        })

class MerchantView(APIView):
    """商户信息视图"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """获取商户信息"""
        try:
            merchant = Merchant.objects.get(user=request.user)
            serializer = MerchantSerializer(merchant)
            return Response({
                'code': 200,
                'message': '获取成功',
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        except Merchant.DoesNotExist:
            return Response({
                'code': 404,
                'message': '商户信息不存在'
            }, status=status.HTTP_200_OK)
    
    def post(self, request):
        """创建商户信息"""
        try:
            # 检查是否已存在商户信息
            Merchant.objects.get(user=request.user)
            return Response({
                'code': 400,
                'message': '商户信息已存在'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Merchant.DoesNotExist:
            serializer = MerchantCreateSerializer(data=request.data)
            if serializer.is_valid():
                merchant = serializer.save(user=request.user)
                return Response({
                    'code': 201,
                    'message': '创建成功，等待审核',
                    'data': MerchantSerializer(merchant).data
                }, status=status.HTTP_201_CREATED)
            return Response({
                'code': 400,
                'message': '创建失败',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
    
    def put(self, request):
        """更新商户信息"""
        try:
            merchant = Merchant.objects.get(user=request.user)
            serializer = MerchantUpdateSerializer(merchant, data=request.data)
            if serializer.is_valid():
                merchant = serializer.save()
                return Response({
                    'code': 200,
                    'message': '更新成功',
                    'data': MerchantSerializer(merchant).data
                }, status=status.HTTP_200_OK)
            return Response({
                'code': 400,
                'message': '更新失败',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        except Merchant.DoesNotExist:
            return Response({
                'code': 404,
                'message': '商户信息不存在'
            }, status=status.HTTP_404_NOT_FOUND)

class MerchantListView(APIView):
    """商户列表视图（管理员使用）"""
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get(self, request):
        """获取商户列表"""
        merchants = Merchant.objects.all()
        serializer = MerchantInfoSerializer(merchants, many=True)
        return Response({
            'code': 200,
            'message': '获取成功',
            'data': serializer.data
        }, status=status.HTTP_200_OK)

class MerchantDetailView(APIView):
    """商户详情视图（管理员使用）"""
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get(self, request, merchant_id):
        """获取商户详情"""
        try:
            merchant = Merchant.objects.get(id=merchant_id)
            serializer = MerchantSerializer(merchant)
            return Response({
                'code': 200,
                'message': '获取成功',
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        except Merchant.DoesNotExist:
            return Response({
                'code': 404,
                'message': '商户不存在'
            }, status=status.HTTP_404_NOT_FOUND)
    
    def put(self, request, merchant_id):
        """审核商户"""
        try:
            merchant = Merchant.objects.get(id=merchant_id)
            serializer = MerchantStatusSerializer(merchant, data=request.data)
            if serializer.is_valid():
                merchant = serializer.save(audit_time=timezone.now())
                
                # 如果审核通过，更新用户的实名状态
                if merchant.status == Merchant.STATUS_APPROVED:
                    merchant.user.is_real_name = 1
                    merchant.user.save()
                
                return Response({
                    'code': 200,
                    'message': '审核成功',
                    'data': MerchantSerializer(merchant).data
                }, status=status.HTTP_200_OK)
            return Response({
                'code': 400,
                'message': '审核失败',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        except Merchant.DoesNotExist:
            return Response({
                'code': 404,
                'message': '商户不存在'
            }, status=status.HTTP_404_NOT_FOUND)

class MerchantPublicView(APIView):
    """商户公开信息视图"""
    def get(self, request, merchant_id):
        """获取商户公开信息"""
        try:
            merchant = Merchant.objects.get(id=merchant_id, status=1)  # 只返回审核通过的商户
            serializer = MerchantInfoSerializer(merchant)
            return Response({
                'code': 200,
                'message': '获取成功',
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        except Merchant.DoesNotExist:
            return Response({
                'code': 404,
                'message': '商户不存在或未审核通过'
            }, status=status.HTTP_404_NOT_FOUND)

class MerchantDashboardStatsView(APIView):
    """商户控制台统计视图"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            merchant = Merchant.objects.get(user=request.user)

            # 获取商户所有商品ID
            product_ids = list(Product.objects.filter(merchant=merchant).values_list('id', flat=True))

            # 统计商品总数
            total_products = len(product_ids)

            # 统计总浏览量
            total_views = Product.objects.filter(merchant=merchant).aggregate(total=Sum('view_count'))['total'] or 0

            # 统计订单 - 使用 Python 循环检查订单中的商品（参考 MerchantOrderView 的实现）
            all_orders = Order.objects.all().order_by('-create_time')

            merchant_orders = []
            for order in all_orders:
                # 检查订单是否包含该商户的商品
                for item in order.product_info:
                    pid = item.get('product_id')
                    if pid in product_ids:
                        merchant_orders.append(order)
                        break

            total_orders = len(merchant_orders)

            # 计算总销售额（只统计已支付的订单）
            total_sales = 0
            for order in merchant_orders:
                if order.payment_status == 1:  # 已支付
                    # 计算该商户商品的实际销售额
                    for item in order.product_info:
                        pid = item.get('product_id')
                        if pid in product_ids:
                            quantity = item.get('quantity', 1)
                            price = float(item.get('price', 0))
                            total_sales += price * quantity

            # 最近订单
            recent_orders_data = []
            for order in merchant_orders[:5]:
                recent_orders_data.append({
                    'order_sn': order.order_no,
                    'total_amount': float(order.actual_price),
                    'status': order.payment_status,
                    'create_time': order.create_time.strftime('%Y-%m-%d %H:%M:%S')
                })

            # 热销商品
            hot_products = Product.objects.filter(merchant=merchant).order_by('-sales_count')[:5]
            hot_products_data = []
            for prod in hot_products:
                hot_products_data.append({
                    'product_name': prod.product_name,
                    'sales_count': prod.sales_count,
                    'price': float(prod.price)
                })

            return Response({
                'code': 200,
                'message': '获取成功',
                'data': {
                    'stats': {
                        'total_sales': float(total_sales),
                        'total_orders': total_orders,
                        'total_products': total_products,
                        'total_views': total_views
                    },
                    'recent_orders': recent_orders_data,
                    'hot_products': hot_products_data
                }
            })
        except Merchant.DoesNotExist:
            return Response({
                'code': 404,
                'message': '商户信息不存在'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'code': 500,
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MerchantRefundAuditView(APIView):
    """商户退款审核视图"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """获取退款申请列表"""
        try:
            merchant = Merchant.objects.get(user=request.user)
            from apps.order.models import RefundApplication

            status_filter = request.query_params.get('status', '')

            refund_apps = RefundApplication.objects.filter(merchant=merchant)
            if status_filter != '':
                refund_apps = refund_apps.filter(status=int(status_filter))

            refund_apps = refund_apps.order_by('-create_time')

            data = []
            for app in refund_apps:
                data.append({
                    'id': app.id,
                    'order_id': app.order.id,
                    'order_no': app.order.order_no,
                    'user_id': app.user.id,
                    'username': app.user.username,
                    'refund_amount': float(app.refund_amount),
                    'reason': app.reason,
                    'status': app.status,
                    'status_display': app.get_status_display(),
                    'audit_remark': app.audit_remark,
                    'audit_time': app.audit_time.strftime('%Y-%m-%d %H:%M:%S') if app.audit_time else None,
                    'create_time': app.create_time.strftime('%Y-%m-%d %H:%M:%S'),
                    'product_info': app.order.product_info
                })

            return Response({
                'code': 200,
                'message': '获取成功',
                'data': data
            })
        except Merchant.DoesNotExist:
            return Response({
                'code': 404,
                'message': '商户信息不存在'
            }, status=status.HTTP_404_NOT_FOUND)

    def post(self, request):
        """审核退款申请"""
        refund_id = request.data.get('refund_id')
        action = request.data.get('action')  # 'approve' 或 'reject'
        audit_remark = request.data.get('audit_remark', '')

        if action not in ['approve', 'reject']:
            return Response({
                'code': 400,
                'message': '操作类型错误'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            merchant = Merchant.objects.get(user=request.user)
            from apps.order.models import RefundApplication, Logistics
            from django.db import transaction

            refund_app = RefundApplication.objects.get(
                id=refund_id,
                merchant=merchant,
                status=RefundApplication.STATUS_PENDING
            )

            with transaction.atomic():
                if action == 'approve':
                    # 通过退款
                    refund_app.status = RefundApplication.STATUS_APPROVED
                    refund_app.audit_remark = audit_remark
                    refund_app.audit_time = timezone.now()
                    refund_app.save()

                    order = refund_app.order

                    # 校园卡支付需要退回余额
                    if order.payment_method == Order.PAYMENT_CAMPUS_CARD:
                        from apps.user.models import User
                        user = order.user
                        user.balance += order.actual_price
                        user.save()

                    # 更新订单状态为已退款
                    order.payment_status = Order.PAYMENT_REFUNDED
                    order.save()

                    # 恢复商品库存
                    product_info = order.product_info
                    for item in product_info:
                        product_id = item.get('product_id')
                        quantity = item.get('quantity', 0)
                        if product_id:
                            Product.objects.filter(id=product_id).update(
                                remaining_stock=models.F('remaining_stock') + quantity,
                                sales_count=models.F('sales_count') - quantity
                            )

                    # 更新物流状态
                    try:
                        logistics = Logistics.objects.get(order=order)
                        if logistics.logistics_status is None:
                            logistics.logistics_status = []
                        logistics.logistics_status.append({
                            'time': timezone.now().strftime('%Y-%m-%d %H:%M:%S'),
                            'status': '商户同意退款，交易关闭',
                            'address': '系统'
                        })
                        logistics.save()
                    except Logistics.DoesNotExist:
                        pass

                    return Response({
                        'code': 200,
                        'message': '退款申请已通过，退款已完成',
                        'data': {
                            'refund_id': refund_app.id,
                            'status': refund_app.status,
                            'status_display': refund_app.get_status_display()
                        }
                    })
                else:
                    # 拒绝退款
                    refund_app.status = RefundApplication.STATUS_REJECTED
                    refund_app.audit_remark = audit_remark
                    refund_app.audit_time = timezone.now()
                    refund_app.save()

                    # 更新物流状态
                    try:
                        logistics = Logistics.objects.get(order=refund_app.order)
                        if logistics.logistics_status is None:
                            logistics.logistics_status = []
                        logistics.logistics_status.append({
                            'time': timezone.now().strftime('%Y-%m-%d %H:%M:%S'),
                            'status': '商户拒绝退款申请',
                            'address': '系统'
                        })
                        logistics.save()
                    except Logistics.DoesNotExist:
                        pass

                    return Response({
                        'code': 200,
                        'message': '退款申请已拒绝',
                        'data': {
                            'refund_id': refund_app.id,
                            'status': refund_app.status,
                            'status_display': refund_app.get_status_display()
                        }
                    })

        except RefundApplication.DoesNotExist:
            return Response({
                'code': 404,
                'message': '退款申请不存在或已处理'
            }, status=status.HTTP_404_NOT_FOUND)
        except Merchant.DoesNotExist:
            return Response({
                'code': 404,
                'message': '商户信息不存在'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'code': 500,
                'message': f'审核失败: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
