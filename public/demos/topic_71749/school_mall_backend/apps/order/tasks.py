"""
支付状态定时轮询任务
每30秒轮询一次待支付订单和待处理充值记录，查询支付宝真实支付状态
"""
import time
import threading
from django.utils import timezone
from datetime import timedelta


class PaymentStatusPollingTask:
    """支付状态轮询任务"""
    
    def __init__(self):
        self._running = False
        self._thread = None
        self._interval = 30  # 轮询间隔30秒
    
    def start(self):
        """启动定时轮询任务"""
        if self._running:
            print('[支付轮询] 任务已在运行中')
            return
        
        self._running = True
        self._thread = threading.Thread(target=self._run, daemon=True)
        self._thread.start()
        print('[支付轮询] 定时轮询任务已启动，间隔30秒')
    
    def stop(self):
        """停止定时轮询任务"""
        self._running = False
        if self._thread:
            self._thread.join(timeout=5)
        print('[支付轮询] 定时轮询任务已停止')
    
    def _run(self):
        """运行轮询任务"""
        while self._running:
            try:
                self._poll_pending_orders()
                self._poll_pending_recharges()
            except Exception as e:
                print(f'[支付轮询] 轮询异常: {str(e)}')
            
            # 等待30秒
            time.sleep(self._interval)
    
    def _poll_pending_orders(self):
        """轮询待支付订单"""
        try:
            # 延迟导入，避免循环依赖
            from apps.order.models import Order
            from utils.alipay import alipay_service
            
            # 获取所有待支付订单（创建时间超过15分钟的订单）- 直接删除
            fifteen_minutes_ago = timezone.now() - timedelta(minutes=15)
            expired_orders = Order.objects.filter(
                payment_status=0,
                create_time__lte=fifteen_minutes_ago
            )
            
            if expired_orders.exists():
                count = expired_orders.count()
                order_nos = list(expired_orders.values_list('order_no', flat=True))
                expired_orders.delete()
                print(f'[支付轮询] 发现 {count} 个超时未支付订单（超过15分钟），已删除: {order_nos}')
            
            # 获取所有待支付订单（1-15分钟内的订单）- 查询支付宝状态
            one_minute_ago = timezone.now() - timedelta(minutes=1)
            pending_orders = Order.objects.filter(
                payment_status=0,
                create_time__gt=one_minute_ago,
                create_time__lte=fifteen_minutes_ago
            )
            
            if not pending_orders.exists():
                return
            
            print(f'[支付轮询] 发现 {pending_orders.count()} 个待支付订单（15分钟内），查询支付宝状态')
            
            for order in pending_orders:
                try:
                    # 查询支付宝订单状态
                    alipay_result = alipay_service.query_order(order.order_no)
                    trade_status = alipay_result.get('trade_status', '')
                    
                    # 如果支付宝显示已支付，更新本地订单状态
                    if trade_status in ['TRADE_SUCCESS', 'TRADE_FINISHED']:
                        order.payment_status = 1
                        order.payment_method = 1  # 支付宝支付
                        order.payment_time = timezone.now()
                        order.save()
                        
                        # 创建物流记录
                        from apps.order.models import Logistics
                        Logistics.objects.create(
                            order=order,
                            logistics_no=f'LOG{timezone.now().strftime("%Y%m%d%H%M%S")}{order.id}',
                            logistics_status=[{
                                'time': timezone.now().strftime('%Y-%m-%d %H:%M:%S'),
                                'status': '订单已支付，等待商家发货',
                                'address': '系统'
                            }]
                        )
                        
                        print(f'[支付轮询] 订单 {order.order_no} 已同步为支付成功')
                    
                except Exception as e:
                    print(f'[支付轮询] 查询订单 {order.order_no} 状态失败: {str(e)}')
                    continue
                    
        except Exception as e:
            print(f'[支付轮询] 获取待支付订单失败: {str(e)}')
    
    def _poll_pending_recharges(self):
        """轮询待处理充值记录"""
        try:
            # 延迟导入，避免循环依赖
            from apps.user.models import RechargeRecord
            from utils.alipay import alipay_service
            
            # 获取所有待处理充值记录（创建时间超过15分钟的记录）- 标记为失败
            fifteen_minutes_ago = timezone.now() - timedelta(minutes=15)
            expired_records = RechargeRecord.objects.filter(
                status=RechargeRecord.STATUS_PENDING,
                create_time__lte=fifteen_minutes_ago
            ).exclude(trade_no='')
            
            if expired_records.exists():
                count = expired_records.count()
                for record in expired_records:
                    record.status = RechargeRecord.STATUS_FAILED
                    record.save()
                print(f'[充值轮询] 发现 {count} 个超时未支付充值记录（超过15分钟），已标记为失败')
            
            # 获取所有待处理充值记录（1-15分钟内的记录）- 查询支付宝状态
            one_minute_ago = timezone.now() - timedelta(minutes=1)
            pending_recharges = RechargeRecord.objects.filter(
                status=RechargeRecord.STATUS_PENDING,
                create_time__gt=one_minute_ago,
                create_time__lte=fifteen_minutes_ago
            ).exclude(trade_no='')
            
            if not pending_recharges.exists():
                return
            
            print(f'[充值轮询] 发现 {pending_recharges.count()} 个待处理充值记录（15分钟内），查询支付宝状态')
            
            for record in pending_recharges:
                try:
                    # 查询支付宝订单状态
                    alipay_result = alipay_service.query_order(record.trade_no)
                    trade_status = alipay_result.get('trade_status', '')
                    
                    # 如果支付宝显示已支付，更新本地充值记录
                    if trade_status in ['TRADE_SUCCESS', 'TRADE_FINISHED']:
                        record.status = RechargeRecord.STATUS_SUCCESS
                        record.save()
                        
                        # 增加用户余额
                        user = record.user
                        user.balance = user.balance + record.amount
                        user.save(update_fields=['balance'])
                        user.refresh_from_db()
                        
                        print(f'[充值轮询] 用户 {user.username} 的充值记录 {record.trade_no} 已同步为成功')
                    
                except Exception as e:
                    print(f'[充值轮询] 查询充值记录 {record.trade_no} 状态失败: {str(e)}')
                    continue
                    
        except Exception as e:
            print(f'[充值轮询] 获取待处理充值记录失败: {str(e)}')


# 单例模式
payment_polling_task = PaymentStatusPollingTask()
