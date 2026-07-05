from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth.hashers import check_password
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from django.http import HttpResponse
from .models import User, RechargeRecord, ContactMessage
from .serializers import (
    UserSerializer, UserRegisterSerializer, UserLoginSerializer,
    UserUpdateSerializer, UserPasswordSerializer, ContactMessageSerializer
)
from decimal import Decimal
from utils.alipay import alipay_service

class UserRegisterView(APIView):
    """用户注册视图"""
    permission_classes = [AllowAny]
    def post(self, request):
        serializer = UserRegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                'code': 201,
                'message': '注册成功',
                'data': {
                    'user_id': user.id,
                    'username': user.username,
                    'email': user.email
                }
            }, status=status.HTTP_201_CREATED)
        return Response({
            'code': 400,
            'message': '注册失败',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

class UserLoginView(APIView):
    """用户登录视图"""
    permission_classes = [AllowAny]
    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            password = serializer.validated_data['password']
            
            try:
                user = User.objects.get(email=email)
                if check_password(password, user.password):
                    # 检查用户状态
                    if user.status == User.STATUS_DISABLED:
                        return Response({
                            'code': 403,
                            'message': '账号已被封禁'
                        }, status=status.HTTP_403_FORBIDDEN)

                    # 生成JWT令牌
                    refresh = RefreshToken.for_user(user)
                    # 更新最后登录时间
                    user.last_login_time = timezone.now()
                    user.save()
                    
                    # 登录成功后自动发放优惠券
                    try:
                        from apps.coupon.views import CouponAutoSendView
                        # 创建一个模拟请求对象
                        from django.http import HttpRequest
                        auto_send_request = HttpRequest()
                        auto_send_request.user = user
                        auto_send_request.data = {'trigger_type': 'login'}
                        # 调用自动发放优惠券的方法
                        coupon_view = CouponAutoSendView()
                        coupon_view._send_login_coupon(user)
                    except Exception as e:
                        # 记录错误但不影响登录流程
                        print(f"自动发放优惠券失败: {str(e)}")
                    
                    return Response({
                        'code': 200,
                        'message': '登录成功',
                        'data': {
                            'user': UserSerializer(user).data,
                            'tokens': {
                                'refresh': str(refresh),
                                'access': str(refresh.access_token)
                            }
                        }
                    }, status=status.HTTP_200_OK)
                else:
                    return Response({
                        'code': 401,
                        'message': '邮箱或密码错误'
                    }, status=status.HTTP_401_UNAUTHORIZED)
            except User.DoesNotExist:
                return Response({
                    'code': 401,
                    'message': '邮箱或密码错误'
                }, status=status.HTTP_401_UNAUTHORIZED)
        return Response({
            'code': 400,
            'message': '登录失败',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

class UserInfoView(APIView):
    """用户信息视图"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """获取用户信息"""
        user = request.user
        serializer = UserSerializer(user)
        return Response({
            'code': 200,
            'message': '获取成功',
            'data': serializer.data
        }, status=status.HTTP_200_OK)
    
    def put(self, request):
        """更新用户信息"""
        user = request.user
        serializer = UserUpdateSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                'code': 200,
                'message': '更新成功',
                'data': UserSerializer(user).data
            }, status=status.HTTP_200_OK)
        return Response({
            'code': 400,
            'message': '更新失败',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

class UserPasswordView(APIView):
    """用户密码修改视图"""
    permission_classes = [IsAuthenticated]
    
    def put(self, request):
        serializer = UserPasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            old_password = serializer.validated_data['old_password']
            new_password = serializer.validated_data['new_password']
            
            if user.check_password(old_password):
                user.set_password(new_password)
                user.save()
                return Response({
                    'code': 200,
                    'message': '密码修改成功'
                }, status=status.HTTP_200_OK)
            return Response({
                'code': 401,
                'message': '原密码错误'
            }, status=status.HTTP_401_UNAUTHORIZED)
        return Response({
            'code': 400,
            'message': '密码修改失败',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class UserBalanceView(APIView):
    """用户余额视图"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """获取用户余额"""
        user = request.user
        return Response({
            'code': 200,
            'message': '获取成功',
            'data': {
                'balance': float(user.balance)
            }
        }, status=status.HTTP_200_OK)


class UserRechargeView(APIView):
    """用户充值视图"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """创建充值订单"""
        amount = request.data.get('amount', 0)
        payment_method = request.data.get('payment_method', 'alipay')
        payment_type = request.data.get('payment_type', 'pc')  # pc: 电脑网站支付, wap: 手机网站支付

        # 验证金额
        try:
            amount = Decimal(str(amount))
            if amount <= 0 or amount > 10000:
                return Response({
                    'code': 400,
                    'message': '充值金额必须在 0.01-10000 元之间'
                }, status=status.HTTP_400_BAD_REQUEST)
        except (ValueError, TypeError):
            return Response({
                'code': 400,
                'message': '金额格式错误'
            }, status=status.HTTP_400_BAD_REQUEST)

        # 验证支付方式
        if payment_method not in ['alipay', 'wechat']:
            return Response({
                'code': 400,
                'message': '支付方式错误'
            }, status=status.HTTP_400_BAD_REQUEST)

        # 创建充值记录
        record = RechargeRecord.objects.create(
            user=request.user,
            amount=amount,
            payment_method=payment_method,
            status=RechargeRecord.STATUS_PENDING
        )

        # 如果是支付宝支付，创建支付宝支付链接
        if payment_method == 'alipay':
            if not alipay_service.is_configured():
                return Response({
                    'code': 500,
                    'message': '支付宝支付未配置，请联系管理员'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            try:
                # 生成充值订单号
                recharge_no = f"RC{record.id}{timezone.now().strftime('%Y%m%d%H%M%S')}"
                record.trade_no = recharge_no
                record.save()

                # 充值专用通知地址
                recharge_notify_url = alipay_service.NOTIFY_URL.replace('/api/order/alipay/notify/', '/api/user/recharge/alipay/notify/')
                
                # 创建支付宝支付
                if payment_type == 'wap':
                    pay_url = alipay_service.create_wap_payment(
                        order_no=recharge_no,
                        total_amount=float(amount),
                        subject='校园卡充值',
                        body=f'充值金额: ¥{amount}',
                        notify_url=recharge_notify_url
                    )
                else:
                    pay_url = alipay_service.create_pc_payment(
                        order_no=recharge_no,
                        total_amount=float(amount),
                        subject='校园卡充值',
                        body=f'充值金额: ¥{amount}',
                        notify_url=recharge_notify_url
                    )

                return Response({
                    'code': 200,
                    'message': '充值订单创建成功',
                    'data': {
                        'record_id': record.id,
                        'amount': float(amount),
                        'payment_method': payment_method,
                        'status': record.status,
                        'pay_url': pay_url
                    }
                }, status=status.HTTP_200_OK)
            except Exception as e:
                return Response({
                    'code': 500,
                    'message': f'创建支付宝支付失败: {str(e)}'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({
            'code': 200,
            'message': '充值订单创建成功',
            'data': {
                'record_id': record.id,
                'amount': float(amount),
                'payment_method': payment_method,
                'status': record.status
            }
        }, status=status.HTTP_200_OK)


class UserRechargeConfirmView(APIView):
    """用户充值确认视图（支付回调）"""
    permission_classes = [IsAuthenticated]

    def post(self, request, record_id):
        """确认充值成功"""
        try:
            record = RechargeRecord.objects.get(id=record_id, user=request.user)

            if record.status == RechargeRecord.STATUS_SUCCESS:
                return Response({
                    'code': 200,
                    'message': '充值已成功',
                    'data': {
                        'balance': float(request.user.balance)
                    }
                })

            # 更新充值记录状态
            record.status = RechargeRecord.STATUS_SUCCESS
            record.save()

            # 增加用户余额
            user = request.user
            print(f'充值前余额: {user.balance}, 充值金额: {record.amount}')
            
            user.balance = user.balance + record.amount
            user.save(update_fields=['balance'])
            
            # 重新获取用户余额确保更新成功
            user.refresh_from_db()
            print(f'充值后余额: {user.balance}')

            return Response({
                'code': 200,
                'message': '充值成功',
                'data': {
                    'amount': float(record.amount),
                    'balance': float(user.balance)
                }
            })
        except RechargeRecord.DoesNotExist:
            return Response({
                'code': 404,
                'message': '充值记录不存在'
            }, status=status.HTTP_404_NOT_FOUND)


class RechargeAlipayNotifyView(APIView):
    """充值支付宝异步通知视图"""
    permission_classes = []
    authentication_classes = []

    def post(self, request):
        """
        处理支付宝异步通知
        支付宝会在支付完成后异步通知此接口
        """
        try:
            # 获取支付宝通知数据
            data = request.POST.dict()

            # 验证签名（生产环境需要开启）
            # if not alipay_service.verify_notify(data.copy()):
            #     return HttpResponse('fail')

            # 获取交易信息
            trade_no = data.get('trade_no')  # 支付宝交易号
            out_trade_no = data.get('out_trade_no')  # 商户订单号（充值记录trade_no）
            trade_status = data.get('trade_status')  # 交易状态

            # 只处理支付成功的通知
            if trade_status in ['TRADE_SUCCESS', 'TRADE_FINISHED']:
                try:
                    # 查找充值记录
                    record = RechargeRecord.objects.get(trade_no=out_trade_no, status=RechargeRecord.STATUS_PENDING)

                    # 更新充值记录
                    record.status = RechargeRecord.STATUS_SUCCESS
                    record.save()

                    # 增加用户余额
                    user = record.user
                    user.balance += record.amount
                    user.save()

                    print(f'充值支付成功: 用户={user.username}, 金额={record.amount}')

                except RechargeRecord.DoesNotExist:
                    print(f'充值记录不存在: {out_trade_no}')
                    pass

            return HttpResponse('success')
        except Exception as e:
            print(f'支付宝通知处理异常: {str(e)}')
            return HttpResponse('fail')


class UserRechargeRecordsView(APIView):
    """用户充值记录视图"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """获取充值记录列表"""
        records = RechargeRecord.objects.filter(user=request.user)[:20]

        data = []
        for record in records:
            data.append({
                'id': record.id,
                'amount': float(record.amount),
                'payment_method': record.payment_method,
                'status': record.status,
                'trade_no': record.trade_no,
                'create_time': record.create_time.strftime('%Y-%m-%d %H:%M:%S')
            })

        return Response({
            'code': 200,
            'message': '获取成功',
            'data': data
        })

class RechargePaymentStatusView(APIView):
    """充值支付状态查询视图"""
    permission_classes = [IsAuthenticated]

    def get(self, request, record_id):
        """查询充值支付状态（主动查询支付宝）"""
        try:
            record = RechargeRecord.objects.get(id=record_id, user=request.user)
            
            # 如果充值记录已经是成功状态，直接返回
            if record.status == RechargeRecord.STATUS_SUCCESS:
                return Response({
                    'code': 200,
                    'message': '充值已成功',
                    'data': {
                        'record_id': record.id,
                        'status': record.status,
                        'alipay_status': 'paid',
                        'balance': float(request.user.balance)
                    }
                }, status=status.HTTP_200_OK)
            
            # 查询支付宝订单状态
            from utils.alipay import alipay_service
            
            if not alipay_service.is_configured() or not record.trade_no:
                return Response({
                    'code': 200,
                    'message': '查询成功',
                    'data': {
                        'record_id': record.id,
                        'status': record.status,
                        'alipay_status': 'unknown'
                    }
                }, status=status.HTTP_200_OK)
            
            # 查询支付宝订单状态
            alipay_result = alipay_service.query_order(record.trade_no)
            trade_status = alipay_result.get('trade_status', '')
            
            alipay_status = 'unknown'
            if trade_status == 'WAIT_BUYER_PAY':
                alipay_status = 'waiting'
            elif trade_status == 'TRADE_CLOSED':
                alipay_status = 'closed'
            elif trade_status in ['TRADE_SUCCESS', 'TRADE_FINISHED']:
                alipay_status = 'paid'
                
                # 如果支付宝显示已支付，但本地记录还是待处理，更新本地记录
                if record.status == RechargeRecord.STATUS_PENDING:
                    record.status = RechargeRecord.STATUS_SUCCESS
                    record.save()
                    
                    # 增加用户余额
                    user = record.user
                    user.balance = user.balance + record.amount
                    user.save(update_fields=['balance'])
                    user.refresh_from_db()
                    
                    print(f'[充值状态同步] 用户 {user.username} 的充值记录 {record.trade_no} 已同步为成功')
            
            return Response({
                'code': 200,
                'message': '查询成功',
                'data': {
                    'record_id': record.id,
                    'status': record.status,
                    'alipay_status': alipay_status,
                    'alipay_trade_no': alipay_result.get('trade_no', ''),
                    'balance': float(request.user.balance) if record.status == RechargeRecord.STATUS_SUCCESS else None
                }
            }, status=status.HTTP_200_OK)
            
        except RechargeRecord.DoesNotExist:
            return Response({
                'code': 404,
                'message': '充值记录不存在'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(f'[充值状态查询异常] {str(e)}')
            return Response({
                'code': 500,
                'message': f'查询失败: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ContactAdminView(APIView):
    """联系管理员视图"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """发送消息给管理员"""
        serializer = ContactMessageSerializer(data=request.data)
        if serializer.is_valid():
            # 保存消息，关联当前用户
            message = serializer.save(user=request.user)
            
            return Response({
                'code': 200,
                'message': '消息已发送给管理员',
                'data': {
                    'id': message.id,
                    'subject': message.subject,
                    'create_time': message.create_time.strftime('%Y-%m-%d %H:%M:%S')
                }
            }, status=status.HTTP_200_OK)
        
        return Response({
            'code': 400,
            'message': '发送失败',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request):
        """获取用户发送的消息列表"""
        messages = ContactMessage.objects.filter(user=request.user)[:20]
        serializer = ContactMessageSerializer(messages, many=True)
        
        return Response({
            'code': 200,
            'message': '获取成功',
            'data': serializer.data
        })
