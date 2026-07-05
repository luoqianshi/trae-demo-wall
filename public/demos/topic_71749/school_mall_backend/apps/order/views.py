from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from apps.user.permissions import IsAdminUser
from django.db import transaction, models
from django.utils import timezone
from datetime import datetime
import random
import string
import json
from .models import ShoppingCart, Order, Logistics
from .serializers import (
    ShoppingCartSerializer, ShoppingCartCreateSerializer, ShoppingCartUpdateSerializer,
    ShoppingCartSelectSerializer, OrderSerializer, OrderCreateSerializer,
    OrderDetailSerializer, OrderStatusSerializer, OrderPaymentSerializer,
    LogisticsSerializer, LogisticsCreateSerializer, LogisticsUpdateSerializer,
    OrderListSerializer
)
from apps.product.models import Product
from apps.student.models import StudentAddress
from apps.merchant.models import Merchant
from utils.alipay import alipay_service

class ShoppingCartView(APIView):
    """购物车视图"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """获取购物车列表"""
        cart_items = ShoppingCart.objects.filter(user=request.user)
        serializer = ShoppingCartSerializer(cart_items, many=True)
        return Response({
            'code': 200,
            'message': '获取成功',
            'data': serializer.data
        }, status=status.HTTP_200_OK)
    
    def post(self, request):
        """添加商品到购物车"""
        serializer = ShoppingCartCreateSerializer(data=request.data)
        if serializer.is_valid():
            product = serializer.validated_data['product']
            quantity = serializer.validated_data['quantity']
            
            # 检查商品库存
            if product.remaining_stock < quantity:
                return Response({
                    'code': 400,
                    'message': '商品库存不足'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # 检查购物车中是否已存在该商品
            cart_item, created = ShoppingCart.objects.get_or_create(
                user=request.user,
                product=product,
                defaults={'quantity': quantity}
            )
            
            if not created:
                # 更新数量
                new_quantity = cart_item.quantity + quantity
                if product.remaining_stock < new_quantity:
                    return Response({
                        'code': 400,
                        'message': '商品库存不足'
                    }, status=status.HTTP_400_BAD_REQUEST)
                cart_item.quantity = new_quantity
                cart_item.save()
            
            return Response({
                'code': 201,
                'message': '添加成功',
                'data': ShoppingCartSerializer(cart_item).data
            }, status=status.HTTP_201_CREATED)
        return Response({
            'code': 400,
            'message': '添加失败',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

class ShoppingCartDetailView(APIView):
    """购物车详情视图"""
    permission_classes = [IsAuthenticated]
    
    def put(self, request, cart_id):
        """更新购物车商品"""
        try:
            cart_item = ShoppingCart.objects.get(id=cart_id, user=request.user)
            serializer = ShoppingCartUpdateSerializer(cart_item, data=request.data)
            if serializer.is_valid():
                quantity = serializer.validated_data.get('quantity', cart_item.quantity)
                
                # 检查库存
                if cart_item.product.remaining_stock < quantity:
                    return Response({
                        'code': 400,
                        'message': '商品库存不足'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                cart_item = serializer.save()
                return Response({
                    'code': 200,
                    'message': '更新成功',
                    'data': ShoppingCartSerializer(cart_item).data
                }, status=status.HTTP_200_OK)
            return Response({
                'code': 400,
                'message': '更新失败',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        except ShoppingCart.DoesNotExist:
            return Response({
                'code': 404,
                'message': '购物车商品不存在'
            }, status=status.HTTP_404_NOT_FOUND)
    
    def delete(self, request, cart_id):
        """删除购物车商品"""
        try:
            cart_item = ShoppingCart.objects.get(id=cart_id, user=request.user)
            cart_item.delete()
            return Response({
                'code': 200,
                'message': '删除成功'
            }, status=status.HTTP_200_OK)
        except ShoppingCart.DoesNotExist:
            return Response({
                'code': 404,
                'message': '购物车商品不存在'
            }, status=status.HTTP_404_NOT_FOUND)

class ShoppingCartSelectView(APIView):
    """购物车商品选择视图"""
    permission_classes = [IsAuthenticated]
    
    def put(self, request):
        """批量选择购物车商品"""
        serializer = ShoppingCartSelectSerializer(data=request.data)
        if serializer.is_valid():
            cart_ids = serializer.validated_data['cart_ids']
            is_selected = serializer.validated_data['is_selected']
            
            updated_count = ShoppingCart.objects.filter(
                id__in=cart_ids, user=request.user
            ).update(is_selected=is_selected)
            
            return Response({
                'code': 200,
                'message': f'成功更新{updated_count}个商品的选择状态'
            }, status=status.HTTP_200_OK)
        return Response({
            'code': 400,
            'message': '更新失败',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

class ShoppingCartClearView(APIView):
    """清空购物车视图"""
    permission_classes = [IsAuthenticated]
    
    def delete(self, request):
        """清空购物车"""
        deleted_count = ShoppingCart.objects.filter(user=request.user).delete()[0]
        return Response({
            'code': 200,
            'message': f'成功清空{deleted_count}个购物车商品'
        }, status=status.HTTP_200_OK)

class OrderView(APIView):
    """订单视图"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """获取订单列表"""
        orders = Order.objects.filter(user=request.user).order_by('-create_time')
        serializer = OrderListSerializer(orders, many=True)
        return Response({
            'code': 200,
            'message': '获取成功',
            'data': serializer.data
        }, status=status.HTTP_200_OK)
    
    def post(self, request):
        """创建订单"""
        try:
            # 获取商品信息
            product_info = request.data.get('product_info', [])
            payment_method = request.data.get('payment_method')
            address_id = request.data.get('address_id')
            user_coupon_id = request.data.get('user_coupon_id')
            
            if not product_info:
                return Response({
                    'code': 400,
                    'message': '请选择商品'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # 验证收货地址
            try:
                address = StudentAddress.objects.get(id=address_id, user=request.user)
            except StudentAddress.DoesNotExist:
                return Response({
                    'code': 404,
                    'message': '收货地址不存在'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # 计算订单金额
            original_price = 0
            products = []
            
            for item in product_info:
                product_id = item.get('product_id')
                quantity = item.get('quantity', 1)
                
                try:
                    product = Product.objects.get(id=product_id, status=1)
                    # 检查库存
                    if product.remaining_stock < quantity:
                        return Response({
                            'code': 400,
                            'message': f'商品 {product.product_name} 库存不足'
                        }, status=status.HTTP_400_BAD_REQUEST)
                    # 计算价格
                    original_price += float(product.price) * quantity
                    products.append({
                        'product': product,
                        'quantity': quantity
                    })
                except Product.DoesNotExist:
                    return Response({
                        'code': 404,
                        'message': f'商品ID {product_id} 不存在'
                    }, status=status.HTTP_404_NOT_FOUND)
            
            # 处理优惠券
            actual_price = original_price
            user_coupon = None
            if user_coupon_id:
                try:
                    from apps.coupon.models import UserCoupon, Coupon
                    user_coupon = UserCoupon.objects.get(
                        id=user_coupon_id, 
                        user=request.user, 
                        status=UserCoupon.STATUS_UNUSED
                    )
                    # 检查使用条件
                    if original_price < float(user_coupon.coupon.condition):
                        return Response({
                            'code': 400,
                            'message': f'优惠券使用条件不足，需满 {user_coupon.coupon.condition} 元'
                        }, status=status.HTTP_400_BAD_REQUEST)
                    
                    # 检查有效期
                    now = timezone.now()
                    if user_coupon.coupon.start_time > now or user_coupon.coupon.end_time < now:
                        return Response({
                            'code': 400,
                            'message': '优惠券不在有效期内'
                        }, status=status.HTTP_400_BAD_REQUEST)
                    
                    # 计算优惠金额
                    if user_coupon.coupon.type == Coupon.TYPE_FULL_REDUCTION:
                        actual_price -= float(user_coupon.coupon.value)
                    elif user_coupon.coupon.type == Coupon.TYPE_DISCOUNT:
                        actual_price *= (float(user_coupon.coupon.value) / 10.0)
                    elif user_coupon.coupon.type == Coupon.TYPE_NO_THRESHOLD:
                        actual_price -= float(user_coupon.coupon.value)
                    
                    if actual_price < 0:
                        actual_price = 0
                except UserCoupon.DoesNotExist:
                    return Response({
                        'code': 404,
                        'message': '优惠券不存在或已使用'
                    }, status=status.HTTP_404_NOT_FOUND)
            
            # 生成订单号
            order_no = self.generate_order_no()
            
            # 创建订单（使用事务）
            with transaction.atomic():
                # 创建订单记录
                order = Order.objects.create(
                    order_no=order_no,
                    user=request.user,
                    original_price=original_price,
                    actual_price=actual_price,
                    product_info=product_info,
                    payment_method=payment_method
                )
                
                # 如果使用了优惠券，更新优惠券状态
                if user_coupon:
                    user_coupon.status = UserCoupon.STATUS_USED
                    user_coupon.order = order
                    user_coupon.use_time = timezone.now()
                    user_coupon.save()
                
                # 减少商品库存
                for item in products:
                    product = item['product']
                    quantity = item['quantity']
                    product.remaining_stock -= quantity
                    product.sales_count += quantity
                    product.save()
                
                # 从购物车中删除已购买的商品
                cart_ids = [item['product'].id for item in products]
                ShoppingCart.objects.filter(user=request.user, product_id__in=cart_ids).delete()
            
            return Response({
                'code': 201,
                'message': '订单创建成功',
                'data': {
                    'order_id': order.id,
                    'order_no': order.order_no,
                    'total_price': order.actual_price
                }
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({
                'code': 500,
                'message': f'订单创建失败: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def generate_order_no(self):
        """生成订单号"""
        now = datetime.now()
        date_str = now.strftime('%Y%m%d%H%M%S')
        random_str = ''.join(random.choices(string.digits, k=6))
        return f'{date_str}{random_str}'

class OrderDetailView(APIView):
    """订单详情视图"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, order_id):
        """获取订单详情"""
        try:
            order = Order.objects.get(id=order_id, user=request.user)
            serializer = OrderDetailSerializer(order)
            return Response({
                'code': 200,
                'message': '获取成功',
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        except Order.DoesNotExist:
            return Response({
                'code': 404,
                'message': '订单不存在'
            }, status=status.HTTP_404_NOT_FOUND)
    
    def delete(self, request, order_id):
        """取消订单（仅限待支付订单）"""
        try:
            order = Order.objects.get(id=order_id, user=request.user)
            
            # 只能取消待支付的订单
            if order.payment_status != 0:
                return Response({
                    'code': 400,
                    'message': '只能取消待支付的订单'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # 恢复商品库存
            product_info = order.product_info
            for item in product_info:
                product_id = item.get('product_id')
                quantity = item.get('quantity', 1)
                try:
                    product = Product.objects.get(id=product_id)
                    product.remaining_stock += quantity
                    product.save()
                except Product.DoesNotExist:
                    pass
            
            # 删除订单
            order.delete()
            
            return Response({
                'code': 200,
                'message': '订单取消成功'
            }, status=status.HTTP_200_OK)
            
        except Order.DoesNotExist:
            return Response({
                'code': 404,
                'message': '订单不存在'
            }, status=status.HTTP_404_NOT_FOUND)

class OrderPaymentView(APIView):
    """订单支付视图"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """支付订单"""
        serializer = OrderPaymentSerializer(data=request.data)
        if serializer.is_valid():
            order_id = serializer.validated_data['order_id']
            payment_method = serializer.validated_data['payment_method']

            try:
                with transaction.atomic():
                    order = Order.objects.get(id=order_id, user=request.user, payment_status=0)

                    # 校园卡支付（余额支付）
                    if payment_method == 2:
                        user = request.user
                        if user.balance < order.actual_price:
                            return Response({
                                'code': 400,
                                'message': f'余额不足，当前余额: ¥{user.balance}，需要: ¥{order.actual_price}'
                            }, status=status.HTTP_400_BAD_REQUEST)

                        # 扣减余额
                        user.balance -= order.actual_price
                        user.save()

                        # 更新订单支付状态
                        order.payment_status = 1
                        order.payment_method = payment_method
                        order.payment_time = timezone.now()
                        order.save()

                        # 创建物流记录
                        logistics = Logistics.objects.create(
                            order=order,
                            logistics_no=OrderPaymentView.generate_logistics_no(),
                            logistics_status=[{
                                'time': timezone.now().strftime('%Y-%m-%d %H:%M:%S'),
                                'status': '订单已支付，等待商家发货',
                                'address': '系统'
                            }]
                        )

                        return Response({
                            'code': 200,
                            'message': '支付成功',
                            'data': {
                                'order_id': order.id,
                                'order_no': order.order_no,
                                'payment_status': order.payment_status,
                                'balance': float(request.user.balance)
                            }
                        }, status=status.HTTP_200_OK)

                    # 支付宝支付（仅生成支付链接，不修改状态）
                    elif payment_method == 1:
                        from utils.alipay import alipay_service
                        
                        if not alipay_service.is_configured():
                            return Response({
                                'code': 500,
                                'message': '支付宝支付未配置，请联系管理员'
                            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

                        # 生成支付宝支付链接
                        pay_url = alipay_service.create_pc_payment(
                            order_no=order.order_no,
                            total_amount=float(order.actual_price),
                            subject=f'订单{order.order_no}',
                            body='校园商城订单支付'
                        )

                        return Response({
                            'code': 200,
                            'message': '支付链接生成成功',
                            'data': {
                                'order_id': order.id,
                                'order_no': order.order_no,
                                'payment_method': payment_method,
                                'pay_url': pay_url,
                                'payment_status': order.payment_status
                            }
                        }, status=status.HTTP_200_OK)

                return Response({
                    'code': 400,
                    'message': '不支持的支付方式'
                }, status=status.HTTP_400_BAD_REQUEST)
            except Order.DoesNotExist:
                return Response({
                    'code': 404,
                    'message': '订单不存在或已支付'
                }, status=status.HTTP_404_NOT_FOUND)
        return Response({
            'code': 400,
            'message': '支付失败',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    @staticmethod
    def generate_logistics_no():
        """生成物流单号"""
        prefix = 'LOG'
        now = datetime.now()
        date_str = now.strftime('%Y%m%d')
        random_str = ''.join(random.choices(string.digits, k=8))
        return f'{prefix}{date_str}{random_str}'


class OrderPaymentStatusView(APIView):
    """订单支付状态查询视图"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, order_id):
        """查询订单支付状态（主动查询支付宝）"""
        try:
            order = Order.objects.get(id=order_id, user=request.user)
            
            # 如果订单已经是支付成功状态，直接返回
            if order.payment_status == 1:
                return Response({
                    'code': 200,
                    'message': '订单已支付',
                    'data': {
                        'order_id': order.id,
                        'order_no': order.order_no,
                        'payment_status': order.payment_status,
                        'alipay_status': 'paid'
                    }
                }, status=status.HTTP_200_OK)
            
            # 如果订单是待支付状态，查询支付宝真实状态
            from utils.alipay import alipay_service
            
            if not alipay_service.is_configured():
                return Response({
                    'code': 200,
                    'message': '查询成功',
                    'data': {
                        'order_id': order.id,
                        'order_no': order.order_no,
                        'payment_status': order.payment_status,
                        'alipay_status': 'unknown'
                    }
                }, status=status.HTTP_200_OK)
            
            # 查询支付宝订单状态
            alipay_result = alipay_service.query_order(order.order_no)
            
            # 解析支付宝返回的状态
            trade_status = alipay_result.get('trade_status', '')
            
            # 支付宝交易状态映射
            # WAIT_BUYER_PAY - 交易创建，等待买家付款
            # TRADE_CLOSED - 交易关闭（未付款超时）
            # TRADE_SUCCESS - 交易成功（已付款）
            # TRADE_FINISHED - 交易结束（已付款且不可退款）
            
            alipay_status = 'unknown'
            if trade_status == 'WAIT_BUYER_PAY':
                alipay_status = 'waiting'
            elif trade_status == 'TRADE_CLOSED':
                alipay_status = 'closed'
            elif trade_status in ['TRADE_SUCCESS', 'TRADE_FINISHED']:
                alipay_status = 'paid'
                
                # 如果支付宝显示已支付，但本地订单还是待支付，更新本地订单状态
                if order.payment_status == 0:
                    order.payment_status = 1
                    order.payment_method = 1  # 支付宝支付
                    order.payment_time = timezone.now()
                    order.save()
                    
                    # 创建物流记录
                    Logistics.objects.create(
                        order=order,
                        logistics_no=OrderPaymentView.generate_logistics_no(),
                        logistics_status=[{
                            'time': timezone.now().strftime('%Y-%m-%d %H:%M:%S'),
                            'status': '订单已支付，等待商家发货',
                            'address': '系统'
                        }]
                    )
                    
                    print(f'[支付状态同步] 订单 {order.order_no} 已从支付宝同步为支付成功')
            
            return Response({
                'code': 200,
                'message': '查询成功',
                'data': {
                    'order_id': order.id,
                    'order_no': order.order_no,
                    'payment_status': order.payment_status,
                    'alipay_status': alipay_status,
                    'alipay_trade_no': alipay_result.get('trade_no', ''),
                    'alipay_response': alipay_result
                }
            }, status=status.HTTP_200_OK)
            
        except Order.DoesNotExist:
            return Response({
                'code': 404,
                'message': '订单不存在'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(f'[支付状态查询异常] {str(e)}')
            return Response({
                'code': 500,
                'message': f'查询失败: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class OrderReceiveView(APIView):
    """订单确认收货视图"""
    permission_classes = [IsAuthenticated]
    
    def put(self, request, order_id):
        """确认收货"""
        try:
            order = Order.objects.get(id=order_id, user=request.user, payment_status=1)
            order.receive_time = timezone.now()
            order.save()
            
            # 更新物流状态
            logistics = Logistics.objects.get(order=order)
            logistics.logistics_status.append({
                'time': timezone.now().strftime('%Y-%m-%d %H:%M:%S'),
                'status': '订单已签收',
                'address': '系统'
            })
            logistics.arrive_time = timezone.now()
            logistics.save()
            
            return Response({
                'code': 200,
                'message': '确认收货成功'
            }, status=status.HTTP_200_OK)
        except Order.DoesNotExist:
            return Response({
                'code': 404,
                'message': '订单不存在或状态不正确'
            }, status=status.HTTP_404_NOT_FOUND)
        except Logistics.DoesNotExist:
            return Response({
                'code': 404,
                'message': '物流信息不存在'
            }, status=status.HTTP_404_NOT_FOUND)

class OrderRefundView(APIView):
    """订单退款申请视图"""
    permission_classes = [IsAuthenticated]

    def post(self, request, order_id):
        """提交退款申请"""
        reason = request.data.get('reason', '')

        try:
            order = Order.objects.get(id=order_id, user=request.user, payment_status=1)

            # 检查是否已有待审核的退款申请
            from .models import RefundApplication
            existing_app = RefundApplication.objects.filter(
                order=order,
                status=RefundApplication.STATUS_PENDING
            ).first()
            if existing_app:
                return Response({
                    'code': 400,
                    'message': '该订单已有待审核的退款申请，请勿重复提交'
                }, status=status.HTTP_400_BAD_REQUEST)

            # 获取订单中的商户信息（从第一个商品获取）
            product_info = order.product_info
            if not product_info:
                return Response({
                    'code': 400,
                    'message': '订单商品信息异常'
                }, status=status.HTTP_400_BAD_REQUEST)

            # 获取商品对应的商户
            from apps.product.models import Product
            from apps.merchant.models import Merchant

            first_product_id = product_info[0].get('product_id')
            try:
                product = Product.objects.get(id=first_product_id)
                merchant = product.merchant
            except (Product.DoesNotExist, AttributeError):
                return Response({
                    'code': 400,
                    'message': '无法获取订单商户信息'
                }, status=status.HTTP_400_BAD_REQUEST)

            # 创建退款申请
            refund_app = RefundApplication.objects.create(
                order=order,
                user=request.user,
                merchant=merchant,
                refund_amount=order.actual_price,
                reason=reason,
                status=RefundApplication.STATUS_PENDING
            )

            # 更新物流状态
            try:
                logistics = Logistics.objects.get(order=order)
                if logistics.logistics_status is None:
                    logistics.logistics_status = []
                logistics.logistics_status.append({
                    'time': timezone.now().strftime('%Y-%m-%d %H:%M:%S'),
                    'status': '用户申请退款，等待商户审核',
                    'address': '系统'
                })
                logistics.save()
            except Logistics.DoesNotExist:
                pass

            return Response({
                'code': 200,
                'message': '退款申请已提交，等待商户审核',
                'data': {
                    'refund_id': refund_app.id,
                    'status': refund_app.status,
                    'status_display': refund_app.get_status_display()
                }
            }, status=status.HTTP_200_OK)
        except Order.DoesNotExist:
            return Response({
                'code': 404,
                'message': '订单不存在或不可退款'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'code': 500,
                'message': f'退款申请失败: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class OrderRefundStatusView(APIView):
    """订单退款状态查询视图"""
    permission_classes = [IsAuthenticated]

    def get(self, request, order_id):
        """获取订单退款状态"""
        try:
            order = Order.objects.get(id=order_id, user=request.user)
            from .models import RefundApplication

            refund_apps = RefundApplication.objects.filter(order=order).order_by('-create_time')

            data = []
            for app in refund_apps:
                data.append({
                    'id': app.id,
                    'refund_amount': float(app.refund_amount),
                    'reason': app.reason,
                    'status': app.status,
                    'status_display': app.get_status_display(),
                    'audit_remark': app.audit_remark,
                    'audit_time': app.audit_time.strftime('%Y-%m-%d %H:%M:%S') if app.audit_time else None,
                    'create_time': app.create_time.strftime('%Y-%m-%d %H:%M:%S')
                })

            return Response({
                'code': 200,
                'message': '获取成功',
                'data': {
                    'order_id': order.id,
                    'payment_status': order.payment_status,
                    'refund_applications': data
                }
            }, status=status.HTTP_200_OK)
        except Order.DoesNotExist:
            return Response({
                'code': 404,
                'message': '订单不存在'
            }, status=status.HTTP_404_NOT_FOUND)

class LogisticsView(APIView):
    """物流信息视图"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, order_id):
        """获取物流信息"""
        try:
            order = Order.objects.get(id=order_id, user=request.user)
            logistics = Logistics.objects.get(order=order)
            serializer = LogisticsSerializer(logistics)
            return Response({
                'code': 200,
                'message': '获取成功',
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        except Order.DoesNotExist:
            return Response({
                'code': 404,
                'message': '订单不存在'
            }, status=status.HTTP_404_NOT_FOUND)
        except Logistics.DoesNotExist:
            return Response({
                'code': 404,
                'message': '物流信息不存在'
            }, status=status.HTTP_404_NOT_FOUND)

class MerchantOrderView(APIView):
    """商户订单视图"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """获取商户订单列表"""
        try:
            merchant = Merchant.objects.get(user=request.user)
            # 获取该商户的所有商品ID
            product_ids = list(Product.objects.filter(merchant=merchant).values_list('id', flat=True))
            
            if not product_ids:
                return Response({
                    'code': 200,
                    'message': '获取成功',
                    'data': []
                })

            # 查询所有订单，并在 Python 中过滤（解决 JSONField 过滤的兼容性问题）
            # 如果订单量极大，建议后续优化为专门的 OrderItem 表
            all_orders = Order.objects.all().order_by('-create_time')
            
            # 支持订单号和状态初步筛选
            order_sn = request.query_params.get('order_sn')
            status_val = request.query_params.get('status')
            
            if order_sn:
                all_orders = all_orders.filter(order_no__icontains=order_sn)
            if status_val is not None and status_val != '':
                all_orders = all_orders.filter(payment_status=status_val)
            
            results = []
            for order in all_orders:
                # 检查订单是否包含该商户的商品
                merchant_products = []
                is_merchant_order = False
                
                for item in order.product_info:
                    pid = item.get('product_id')
                    if pid in product_ids:
                        is_merchant_order = True
                        # 补充商品图片等信息
                        try:
                            prod = Product.objects.get(id=pid)
                            item['image'] = prod.product_images[0] if prod.product_images else ''
                            item['product_name'] = prod.product_name
                        except Product.DoesNotExist:
                            pass
                        merchant_products.append(item)
                
                if is_merchant_order:
                    results.append({
                        'id': order.id,
                        'order_sn': order.order_no,
                        'total_amount': float(order.actual_price),
                        'status': order.payment_status,
                        'create_time': order.create_time.strftime('%Y-%m-%d %H:%M:%S'),
                        'product_info': merchant_products,
                        'receiver_name': '用户', # 实际应从收货地址获取
                        'receiver_phone': '',
                        'receiver_address': '',
                        'order_remark': ''
                    })
                
            return Response({
                'code': 200,
                'message': '获取成功',
                'data': results
            }, status=status.HTTP_200_OK)
        except Merchant.DoesNotExist:
            return Response({
                'code': 404,
                'message': '商户信息不存在'
            }, status=status.HTTP_404_NOT_FOUND)
    
    def delete(self, request, order_id):
        """商户删除订单"""
        try:
            merchant = Merchant.objects.get(user=request.user)
            order = Order.objects.get(id=order_id)
            
            # 验证订单是否属于该商户
            product_info = order.product_info
            product_ids = [item.get('product_id') for item in product_info]
            products = Product.objects.filter(id__in=product_ids, merchant=merchant)
            if not products.exists():
                return Response({
                    'code': 403,
                    'message': '无权删除该订单'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # 只能删除已完成的订单
            if order.payment_status not in [2, 3]:
                return Response({
                    'code': 400,
                    'message': '只能删除已完成或已取消的订单'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            order.delete()
            
            return Response({
                'code': 200,
                'message': '订单删除成功'
            }, status=status.HTTP_200_OK)
            
        except (Merchant.DoesNotExist, Order.DoesNotExist):
            return Response({
                'code': 404,
                'message': '订单或商户不存在'
            }, status=status.HTTP_404_NOT_FOUND)

class MerchantOrderShipView(APIView):
    """商户发货视图"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, order_id):
        try:
            merchant = Merchant.objects.get(user=request.user)
            order = Order.objects.get(id=order_id)
            
            # 更新状态为已发货 (payment_status=2)
            # 假设 0:待支付, 1:待发货, 2:已发货, 3:已取消
            if order.payment_status == 1:
                order.payment_status = 2
                order.save()
                
                # 更新物流信息
                try:
                    logistics = Logistics.objects.get(order=order)
                    logistics.logistics_status.append({
                        'time': timezone.now().strftime('%Y-%m-%d %H:%M:%S'),
                        'status': '商家已发货',
                        'address': '商户'
                    })
                    logistics.save()
                except Logistics.DoesNotExist:
                    pass
                    
                return Response({
                    'code': 200,
                    'message': '发货成功'
                })
            else:
                return Response({
                    'code': 400,
                    'message': '订单状态不正确，无法发货'
                })
        except (Merchant.DoesNotExist, Order.DoesNotExist):
            return Response({
                'code': 404,
                'message': '订单或商户不存在'
            }, status=status.HTTP_404_NOT_FOUND)

class MerchantShipView(APIView):
    """商户发货视图"""
    permission_classes = [IsAuthenticated]
    
    def put(self, request, order_id):
        """商户发货"""
        try:
            merchant = Merchant.objects.get(user=request.user)
            order = Order.objects.get(id=order_id, payment_status=1)
            
            # 验证订单是否属于该商户
            product_info = order.product_info
            product_ids = [item.get('product_id') for item in product_info]
            products = Product.objects.filter(id__in=product_ids, merchant=merchant)
            if not products.exists():
                return Response({
                    'code': 403,
                    'message': '无权操作该订单'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # 创建或更新物流信息
            logistics, created = Logistics.objects.get_or_create(order=order)
            
            # 更新物流状态
            if created:
                logistics.logistics_no = self.generate_logistics_no()
                logistics.logistics_status = [
                    {
                        'time': timezone.now().strftime('%Y-%m-%d %H:%M:%S'),
                        'status': '商家已发货',
                        'address': merchant.merchant_name
                    }
                ]
            else:
                logistics.logistics_status.append({
                    'time': timezone.now().strftime('%Y-%m-%d %H:%M:%S'),
                    'status': '商家已发货',
                    'address': merchant.merchant_name
                })
            logistics.save()
            
            return Response({
                'code': 200,
                'message': '发货成功',
                'data': {
                    'order_id': order.id,
                    'logistics_no': logistics.logistics_no
                }
            }, status=status.HTTP_200_OK)
        except (Merchant.DoesNotExist, Order.DoesNotExist):
            return Response({
                'code': 404,
                'message': '商户或订单不存在'
            }, status=status.HTTP_404_NOT_FOUND)
    
    def generate_logistics_no(self):
        """生成物流单号"""
        prefix = 'LOG'
        now = datetime.now()
        date_str = now.strftime('%Y%m%d')
        random_str = ''.join(random.choices(string.digits, k=8))
        return f'{prefix}{date_str}{random_str}'


class MerchantLogisticsUpdateView(APIView):
    """商户物流位置更新视图"""
    permission_classes = [IsAuthenticated]

    def post(self, request, order_id):
        """更新物流位置"""
        try:
            merchant = Merchant.objects.get(user=request.user)
            order = Order.objects.get(id=order_id)

            # 验证订单是否属于该商户
            product_info = order.product_info
            product_ids = [item.get('product_id') for item in product_info]
            products = Product.objects.filter(id__in=product_ids, merchant=merchant)
            if not products.exists():
                return Response({
                    'code': 403,
                    'message': '无权操作该订单'
                }, status=status.HTTP_403_FORBIDDEN)

            # 获取物流位置信息
            location = request.data.get('location', '').strip()
            remark = request.data.get('remark', '').strip()

            if not location:
                return Response({
                    'code': 400,
                    'message': '请输入物流位置'
                }, status=status.HTTP_400_BAD_REQUEST)

            # 获取或创建物流信息
            logistics, created = Logistics.objects.get_or_create(order=order)

            # 初始化物流状态列表
            if logistics.logistics_status is None:
                logistics.logistics_status = []

            # 添加新的物流位置记录
            logistics.logistics_status.append({
                'time': timezone.now().strftime('%Y-%m-%d %H:%M:%S'),
                'status': f'包裹已到达 {location}',
                'location': location,
                'remark': remark,
                'operator': merchant.merchant_name
            })
            logistics.save()

            return Response({
                'code': 200,
                'message': '物流位置更新成功',
                'data': {
                    'order_id': order.id,
                    'logistics_no': logistics.logistics_no,
                    'location': location,
                    'update_time': timezone.now().strftime('%Y-%m-%d %H:%M:%S')
                }
            }, status=status.HTTP_200_OK)

        except Merchant.DoesNotExist:
            return Response({
                'code': 404,
                'message': '商户不存在'
            }, status=status.HTTP_404_NOT_FOUND)
        except Order.DoesNotExist:
            return Response({
                'code': 404,
                'message': '订单不存在'
            }, status=status.HTTP_404_NOT_FOUND)

    def get(self, request, order_id):
        """获取订单物流信息"""
        try:
            merchant = Merchant.objects.get(user=request.user)
            order = Order.objects.get(id=order_id)

            # 验证订单是否属于该商户
            product_info = order.product_info
            product_ids = [item.get('product_id') for item in product_info]
            products = Product.objects.filter(id__in=product_ids, merchant=merchant)
            if not products.exists():
                return Response({
                    'code': 403,
                    'message': '无权查看该订单'
                }, status=status.HTTP_403_FORBIDDEN)

            # 获取物流信息
            try:
                logistics = Logistics.objects.get(order=order)
                return Response({
                    'code': 200,
                    'message': '获取成功',
                    'data': {
                        'order_id': order.id,
                        'order_no': order.order_no,
                        'logistics_no': logistics.logistics_no,
                        'logistics_status': logistics.logistics_status or [],
                        'arrive_time': logistics.arrive_time.strftime('%Y-%m-%d %H:%M:%S') if logistics.arrive_time else None,
                        'create_time': logistics.create_time.strftime('%Y-%m-%d %H:%M:%S')
                    }
                }, status=status.HTTP_200_OK)
            except Logistics.DoesNotExist:
                return Response({
                    'code': 404,
                    'message': '物流信息不存在'
                }, status=status.HTTP_404_NOT_FOUND)

        except Merchant.DoesNotExist:
            return Response({
                'code': 404,
                'message': '商户不存在'
            }, status=status.HTTP_404_NOT_FOUND)
        except Order.DoesNotExist:
            return Response({
                'code': 404,
                'message': '订单不存在'
            }, status=status.HTTP_404_NOT_FOUND)


class AdminOrderView(APIView):
    """管理员订单视图"""
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get(self, request):
        """获取所有订单列表"""
        orders = Order.objects.all().order_by('-create_time')
        serializer = OrderListSerializer(orders, many=True)
        return Response({
            'code': 200,
            'message': '获取成功',
            'data': serializer.data
        }, status=status.HTTP_200_OK)

class AdminOrderDetailView(APIView):
    """管理员订单详情视图"""
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get(self, request, order_id):
        """获取订单详情"""
        try:
            order = Order.objects.get(id=order_id)
            serializer = OrderDetailSerializer(order)
            return Response({
                'code': 200,
                'message': '获取成功',
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        except Order.DoesNotExist:
            return Response({
                'code': 404,
                'message': '订单不存在'
            }, status=status.HTTP_404_NOT_FOUND)
    
    def delete(self, request, order_id):
        """管理员删除订单"""
        try:
            order = Order.objects.get(id=order_id)
            
            # 恢复商品库存
            product_info = order.product_info
            for item in product_info:
                product_id = item.get('product_id')
                quantity = item.get('quantity', 1)
                try:
                    product = Product.objects.get(id=product_id)
                    product.remaining_stock += quantity
                    product.save()
                except Product.DoesNotExist:
                    pass
            
            order.delete()
            
            return Response({
                'code': 200,
                'message': '订单删除成功'
            }, status=status.HTTP_200_OK)
            
        except Order.DoesNotExist:
            return Response({
                'code': 404,
                'message': '订单不存在'
            }, status=status.HTTP_404_NOT_FOUND)

class AdminLogisticsView(APIView):
    """管理员物流视图"""
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def put(self, request, logistics_id):
        """更新物流状态"""
        try:
            logistics = Logistics.objects.get(id=logistics_id)
            serializer = LogisticsUpdateSerializer(logistics, data=request.data)
            if serializer.is_valid():
                logistics = serializer.save()
                return Response({
                    'code': 200,
                    'message': '物流状态更新成功',
                    'data': LogisticsSerializer(logistics).data
                }, status=status.HTTP_200_OK)
            return Response({
                'code': 400,
                'message': '更新失败',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        except Logistics.DoesNotExist:
            return Response({
                'code': 404,
                'message': '物流信息不存在'
            }, status=status.HTTP_404_NOT_FOUND)


class AlipayPaymentView(APIView):
    """支付宝支付视图"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        创建支付宝支付订单

        请求参数:
        - order_id: 订单ID
        - payment_type: 支付类型 (pc: 电脑网站支付, wap: 手机网站支付)
        """
        # 检查支付宝配置
        if not alipay_service.is_configured():
            return Response({
                'code': 500,
                'message': '支付宝支付未配置，请联系管理员'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        order_id = request.data.get('order_id')
        payment_type = request.data.get('payment_type', 'pc')

        if not order_id:
            return Response({
                'code': 400,
                'message': '订单ID不能为空'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            # 获取订单
            order = Order.objects.get(id=order_id, user=request.user, payment_status=0)

            # 构建商品标题
            product_names = [item.get('product_name', '商品') for item in order.product_info]
            subject = f"校园商城-{product_names[0]}" if product_names else "校园商城订单"
            if len(product_names) > 1:
                subject += f"等{len(product_names)}件商品"

            # 创建支付宝支付
            if payment_type == 'wap':
                pay_url = alipay_service.create_wap_payment(
                    order_no=order.order_no,
                    total_amount=float(order.actual_price),
                    subject=subject,
                    body=f"订单号: {order.order_no}"
                )
            else:
                pay_url = alipay_service.create_pc_payment(
                    order_no=order.order_no,
                    total_amount=float(order.actual_price),
                    subject=subject,
                    body=f"订单号: {order.order_no}"
                )

            return Response({
                'code': 200,
                'message': '支付订单创建成功',
                'data': {
                    'order_id': order.id,
                    'order_no': order.order_no,
                    'pay_url': pay_url
                }
            }, status=status.HTTP_200_OK)

        except Order.DoesNotExist:
            return Response({
                'code': 404,
                'message': '订单不存在或已支付'
            }, status=status.HTTP_404_NOT_FOUND)
        except ValueError as e:
            return Response({
                'code': 500,
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            return Response({
                'code': 500,
                'message': f'创建支付订单失败: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AlipayNotifyView(APIView):
    """支付宝异步通知视图"""
    permission_classes = []
    
    def post(self, request):
        """
        处理支付宝异步通知
        支付宝会在支付完成后异步通知此接口
        """
        # 获取通知参数
        data = request.data.dict() if hasattr(request.data, 'dict') else request.data
        
        try:
            # 验证签名
            # TODO: 生产环境需要验证签名
            # if not alipay_service.verify_notify(data.copy()):
            #     return Response({'code': 'fail', 'msg': '验签失败'})
            
            # 获取订单信息
            order_no = data.get('out_trade_no')
            trade_status = data.get('trade_status')
            trade_no = data.get('trade_no')  # 支付宝交易号
            
            # 验证订单是否存在
            order = Order.objects.get(order_no=order_no)
            
            # 处理支付成功状态
            if trade_status in ['TRADE_SUCCESS', 'TRADE_FINISHED']:
                with transaction.atomic():
                    # 更新订单状态
                    if order.payment_status == 0:
                        order.payment_status = 1
                        order.payment_method = 3  # 支付宝
                        order.payment_time = timezone.now()
                        order.save()
                        
                        # 创建物流记录
                        Logistics.objects.get_or_create(
                            order=order,
                            defaults={
                                'logistics_no': f"LOG{datetime.now().strftime('%Y%m%d')}{random.randint(10000000, 99999999)}",
                                'logistics_status': [{
                                    'time': timezone.now().strftime('%Y-%m-%d %H:%M:%S'),
                                    'status': '订单已支付，等待商家发货',
                                    'address': '系统'
                                }]
                            }
                        )
                
                return Response({'code': 'success', 'msg': '处理成功'})
            
            return Response({'code': 'success', 'msg': '通知已接收'})
            
        except Order.DoesNotExist:
            return Response({'code': 'fail', 'msg': '订单不存在'})
        except Exception as e:
            print(f'支付宝通知处理异常: {str(e)}')
            return Response({'code': 'fail', 'msg': '处理异常'})


class AlipayQueryView(APIView):
    """支付宝订单查询视图"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        查询支付宝订单支付状态

        请求参数:
        - order_id: 订单ID
        """
        # 检查支付宝配置
        if not alipay_service.is_configured():
            return Response({
                'code': 500,
                'message': '支付宝支付未配置，请联系管理员'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        order_id = request.query_params.get('order_id')

        if not order_id:
            return Response({
                'code': 400,
                'message': '订单ID不能为空'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            # 获取订单
            order = Order.objects.get(id=order_id, user=request.user)

            # 查询支付宝订单状态
            result = alipay_service.query_order(order.order_no)

            trade_status = result.get('trade_status', '')

            # 如果支付宝显示支付成功但本地未更新，则更新本地状态
            if trade_status in ['TRADE_SUCCESS', 'TRADE_FINISHED'] and order.payment_status == 0:
                with transaction.atomic():
                    order.payment_status = 1
                    order.payment_method = 3
                    order.payment_time = timezone.now()
                    order.save()

                    # 创建物流记录
                    Logistics.objects.get_or_create(
                        order=order,
                        defaults={
                            'logistics_no': f"LOG{datetime.now().strftime('%Y%m%d')}{random.randint(10000000, 99999999)}",
                            'logistics_status': [{
                                'time': timezone.now().strftime('%Y-%m-%d %H:%M:%S'),
                                'status': '订单已支付，等待商家发货',
                                'address': '系统'
                            }]
                        }
                    )

            return Response({
                'code': 200,
                'message': '查询成功',
                'data': {
                    'order_id': order.id,
                    'order_no': order.order_no,
                    'payment_status': order.payment_status,
                    'alipay_trade_status': trade_status,
                    'alipay_response': result
                }
            }, status=status.HTTP_200_OK)

        except Order.DoesNotExist:
            return Response({
                'code': 404,
                'message': '订单不存在'
            }, status=status.HTTP_404_NOT_FOUND)
        except ValueError as e:
            return Response({
                'code': 500,
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            return Response({
                'code': 500,
                'message': f'查询失败: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
