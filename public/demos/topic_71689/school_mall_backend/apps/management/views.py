from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from apps.user.permissions import IsAdminUser
from django.db.models import Sum, Count
from apps.user.models import User
from apps.merchant.models import Merchant
from apps.order.models import Order
from apps.product.models import Product, ProductCategory
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

class AdminDashboardStatsView(APIView):
    """管理员控制台统计视图"""
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        try:
            # 基础统计
            total_users = User.objects.count()
            total_merchants = Merchant.objects.count()
            total_products = Product.objects.count()
            total_orders = Order.objects.count()
            
            # 销售统计 (支付状态为1的订单)
            total_sales = Order.objects.filter(payment_status=1).aggregate(total=Sum('actual_price'))['total'] or 0
            
            # 获取当前本地时间
            now = timezone.now()
            today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            
            # 今日统计
            today_orders = Order.objects.filter(create_time__gte=today_start).count()
            today_sales = Order.objects.filter(create_time__gte=today_start, payment_status=1).aggregate(total=Sum('actual_price'))['total'] or 0
            today_new_users = User.objects.filter(register_time__gte=today_start).count()
            
            # 待审核统计
            pending_merchants = Merchant.objects.filter(status=0).count() # 假设0为待审核
            
            # 最近7天销售趋势
            sales_trend = []
            for i in range(6, -1, -1):
                start_date = today_start - timedelta(days=i)
                end_date = start_date + timedelta(days=1)
                
                day_sales = Order.objects.filter(
                    create_time__gte=start_date,
                    create_time__lt=end_date,
                    payment_status=1
                ).aggregate(total=Sum('actual_price'))['total'] or 0
                
                sales_trend.append({
                    'date': start_date.strftime('%m-%d'),
                    'value': float(day_sales)
                })

            return Response({
                'code': 200,
                'message': '获取成功',
                'data': {
                    'base_stats': {
                        'total_users': total_users,
                        'total_merchants': total_merchants,
                        'total_products': total_products,
                        'total_orders': total_orders,
                        'total_sales': float(total_sales)
                    },
                    'today_stats': {
                        'orders': today_orders,
                        'sales': float(today_sales),
                        'new_users': today_new_users
                    },
                    'pending_stats': {
                        'merchants': pending_merchants
                    },
                    'sales_trend': sales_trend
                }
            })
        except Exception as e:
            return Response({
                'code': 500,
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UserManagementView(APIView):
    """用户管理视图"""
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        """获取用户列表"""
        keyword = request.query_params.get('keyword', '')
        user_type = request.query_params.get('role', '') # 前端传role作为过滤参数
        
        users = User.objects.all()
        if keyword:
            users = users.filter(username__icontains=keyword) | users.filter(email__icontains=keyword)
        if user_type:
            # 角色映射转换
            role_map = {'student': 1, 'merchant': 2, 'admin': 3}
            if user_type in role_map:
                users = users.filter(user_type=role_map[user_type])
            
        users = users.order_by('-register_time')
        
        data = []
        for user in users:
            # 转换角色标识给前端
            role_display = {1: 'student', 2: 'merchant', 3: 'admin'}.get(user.user_type, 'student')
            data.append({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': role_display,
                'is_active': user.status == 1,
                'balance': float(user.balance),
                'date_joined': user.register_time.strftime('%Y-%m-%d %H:%M:%S'),
                'is_staff': user.is_staff or user.user_type == 3
            })

        return Response({
            'code': 200,
            'message': '获取成功',
            'data': data
        })

    def post(self, request):
        """禁用/启用账号"""
        user_id = request.data.get('user_id')
        is_active = request.data.get('is_active')
        
        try:
            user = User.objects.get(id=user_id)
            if user.is_superuser or user.user_type == 3:
                return Response({'code': 400, 'message': '不能修改管理员状态'})
            user.status = 1 if is_active else 0
            user.save()
            return Response({'code': 200, 'message': '操作成功'})
        except User.DoesNotExist:
            return Response({'code': 404, 'message': '用户不存在'})


class UserBalanceManagementView(APIView):
    """用户余额管理视图"""
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request, user_id):
        """获取用户余额详情"""
        try:
            user = User.objects.get(id=user_id)
            return Response({
                'code': 200,
                'message': '获取成功',
                'data': {
                    'user_id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'balance': float(user.balance)
                }
            })
        except User.DoesNotExist:
            return Response({'code': 404, 'message': '用户不存在'})

    def post(self, request, user_id):
        """修改用户余额"""
        action = request.data.get('action')  # 'add': 增加, 'subtract': 扣减, 'set': 设置
        amount = request.data.get('amount', 0)
        reason = request.data.get('reason', '')

        if action not in ['add', 'subtract', 'set']:
            return Response({'code': 400, 'message': '操作类型错误'})

        try:
            amount = Decimal(str(amount))
            if amount < 0:
                return Response({'code': 400, 'message': '金额不能为负数'})
        except (ValueError, TypeError):
            return Response({'code': 400, 'message': '金额格式错误'})

        try:
            user = User.objects.get(id=user_id)

            # 不能修改管理员余额
            if user.is_superuser or user.user_type == 3:
                return Response({'code': 400, 'message': '不能修改管理员余额'})

            old_balance = float(user.balance)

            if action == 'add':
                user.balance += amount
            elif action == 'subtract':
                if user.balance < amount:
                    return Response({
                        'code': 400,
                        'message': f'余额不足，当前余额: ¥{user.balance}，需要扣减: ¥{amount}'
                    })
                user.balance -= amount
            elif action == 'set':
                user.balance = amount

            user.save()

            return Response({
                'code': 200,
                'message': '余额修改成功',
                'data': {
                    'user_id': user.id,
                    'username': user.username,
                    'old_balance': old_balance,
                    'new_balance': float(user.balance),
                    'action': action,
                    'amount': amount,
                    'reason': reason
                }
            })
        except User.DoesNotExist:
            return Response({'code': 404, 'message': '用户不存在'})


class MerchantAuditView(APIView):
    """商家审核视图"""
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        """获取待审核/所有商家列表"""
        status_filter = request.query_params.get('status', '') # 0: 待审核, 1: 已通过, 2: 已驳回
        
        merchants = Merchant.objects.all()
        if status_filter != '':
            merchants = merchants.filter(status=status_filter)
            
        merchants = merchants.order_by('-create_time')
        
        data = []
        for m in merchants:
            data.append({
                'id': m.id,
                'user_id': m.user.id,
                'username': m.user.username,
                'merchant_name': m.merchant_name,
                'contact_name': m.contact_name,
                'contact_phone': m.contact_phone,
                'merchant_address': m.merchant_address,
                'status': m.status,
                'create_time': m.create_time.strftime('%Y-%m-%d %H:%M:%S')
            })
            
        return Response({
            'code': 200,
            'message': '获取成功',
            'data': data
        })

    def post(self, request):
        """审核操作"""
        merchant_id = request.data.get('merchant_id')
        new_status = request.data.get('status') # 1: 通过, 2: 驳回
        audit_opinion = request.data.get('audit_opinion', '')
        
        try:
            merchant = Merchant.objects.get(id=merchant_id)
            merchant.status = new_status
            # 假设模型中有 audit_opinion 字段，如果没有，可能需要加或者简化
            # 这里简化处理，只更新状态
            merchant.save()
            
            # 如果审核通过，确保用户的角色是 merchant
            if new_status == 1:
                user = merchant.user
                user.user_type = 2
                user.save()
                
            return Response({'code': 200, 'message': '审核操作成功'})
        except Merchant.DoesNotExist:
            return Response({'code': 404, 'message': '商家信息不存在'})

class CategoryManagementView(APIView):
    """分类管理视图"""
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        categories = ProductCategory.objects.all().order_by('sort')
        data = []
        for c in categories:
            data.append({
                'id': c.id,
                'category_name': c.category_name,
                'sort_order': c.sort,
                'parent_id': c.parent_id if hasattr(c, 'parent_id') else None
            })
        return Response({'code': 200, 'data': data})

    def post(self, request):
        name = request.data.get('category_name')
        sort = request.data.get('sort_order', 0)
        parent_id = request.data.get('parent_id')
        
        category = ProductCategory.objects.create(
            category_name=name,
            sort=sort,
            parent_id=parent_id
        )
        return Response({'code': 200, 'message': '创建成功'})

    def put(self, request):
        cat_id = request.data.get('id')
        name = request.data.get('category_name')
        sort = request.data.get('sort_order')
        
        try:
            category = ProductCategory.objects.get(id=cat_id)
            if name: category.category_name = name
            if sort is not None: category.sort = sort
            category.save()
            return Response({'code': 200, 'message': '更新成功'})
        except ProductCategory.DoesNotExist:
            return Response({'code': 404, 'message': '分类不存在'})

    def delete(self, request):
        cat_id = request.query_params.get('id')
        try:
            category = ProductCategory.objects.get(id=cat_id)
            # 检查是否有商品使用该分类
            if Product.objects.filter(category=category).exists():
                return Response({'code': 400, 'message': '该分类下已有商品，不能删除'})
            category.delete()
            return Response({'code': 200, 'message': '删除成功'})
        except ProductCategory.DoesNotExist:
            return Response({'code': 404, 'message': '分类不存在'})

class AdminProductManagementView(APIView):
    """平台商品管理视图"""
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        keyword = request.query_params.get('keyword', '')
        status_filter = request.query_params.get('status', '')
        
        products = Product.objects.all()
        if keyword:
            products = products.filter(product_name__icontains=keyword)
        if status_filter != '':
            products = products.filter(status=status_filter)
            
        products = products.order_by('-create_time')
        
        data = []
        for p in products:
            data.append({
                'id': p.id,
                'product_name': p.product_name,
                'merchant_name': p.merchant.merchant_name if p.merchant else '未知商家',
                'price': float(p.price),
                'stock': p.remaining_stock,
                'sales_count': p.sales_count,
                'status': p.status,
                'create_time': p.create_time.strftime('%Y-%m-%d %H:%M:%S')
            })
        return Response({'code': 200, 'data': data})

    def post(self, request):
        """下架违规商品"""
        product_id = request.data.get('product_id')
        new_status = request.data.get('status', 0) # 0: 下架/仓库
        
        try:
            product = Product.objects.get(id=product_id)
            product.status = new_status
            product.save()
            return Response({'code': 200, 'message': '操作成功'})
        except Product.DoesNotExist:
            return Response({'code': 404, 'message': '商品不存在'})

class AdminOrderManagementView(APIView):
    """平台订单管理视图"""
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        order_no = request.query_params.get('order_no', '')
        status_filter = request.query_params.get('status', '')
        
        orders = Order.objects.all()
        if order_no:
            orders = orders.filter(order_no__icontains=order_no)
        if status_filter != '':
            orders = orders.filter(payment_status=status_filter)
            
        orders = orders.order_by('-create_time')
        
        data = []
        for o in orders:
            data.append({
                'id': o.id,
                'order_no': o.order_no,
                'username': o.user.username,
                'total_price': float(o.original_price),
                'actual_price': float(o.actual_price),
                'status': o.payment_status,
                'create_time': o.create_time.strftime('%Y-%m-%d %H:%M:%S')
            })
        return Response({'code': 200, 'data': data})

class CouponManagementView(APIView):
    """平台优惠券管理视图"""
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        from apps.coupon.models import Coupon
        coupons = Coupon.objects.all().order_by('-create_time')
        data = []
        for c in coupons:
            data.append({
                'id': c.id,
                'name': c.name,
                'type': c.type,
                'condition': float(c.condition),
                'value': float(c.value),
                'start_time': c.start_time.strftime('%Y-%m-%d %H:%M:%S'),
                'end_time': c.end_time.strftime('%Y-%m-%d %H:%M:%S'),
                'create_time': c.create_time.strftime('%Y-%m-%d %H:%M:%S')
            })
        return Response({'code': 200, 'data': data})

    def post(self, request):
        from apps.coupon.models import Coupon
        name = request.data.get('name')
        c_type = request.data.get('type')
        condition = request.data.get('condition', 0)
        value = request.data.get('value')
        start_time = request.data.get('start_time')
        end_time = request.data.get('end_time')
        
        Coupon.objects.create(
            name=name,
            type=c_type,
            condition=condition,
            value=value,
            start_time=start_time,
            end_time=end_time
        )
        return Response({'code': 200, 'message': '创建成功'})

    def delete(self, request):
        from apps.coupon.models import Coupon
        c_id = request.query_params.get('id')
        try:
            coupon = Coupon.objects.get(id=c_id)
            coupon.delete()
            return Response({'code': 200, 'message': '删除成功'})
        except Coupon.DoesNotExist:
            return Response({'code': 404, 'message': '优惠券不存在'})

class AdminReviewManagementView(APIView):
    """平台评价管理视图"""
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        from apps.product.models import ProductReview
        reviews = ProductReview.objects.all().order_by('-create_time')
        data = []
        for r in reviews:
            data.append({
                'id': r.id,
                'username': r.user.username,
                'product_name': r.product.product_name,
                'content': r.content,
                'rating': r.rating,
                'create_time': r.create_time.strftime('%Y-%m-%d %H:%M:%S')
            })
        return Response({'code': 200, 'data': data})

    def delete(self, request):
        """删除(隐藏)评价"""
        from apps.product.models import ProductReview
        r_id = request.query_params.get('id')
        try:
            review = ProductReview.objects.get(id=r_id)
            review.delete()
            return Response({'code': 200, 'message': '操作成功'})
        except ProductReview.DoesNotExist:
            return Response({'code': 404, 'message': '评价不存在'})
