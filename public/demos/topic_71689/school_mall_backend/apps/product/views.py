from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from apps.user.permissions import IsAdminUser
from django.db.models import Q
from django.core.paginator import Paginator
from .models import ProductCategory, Product, Collection
from .serializers import (
    ProductCategorySerializer, ProductCategoryCreateSerializer,
    ProductCategoryUpdateSerializer, ProductSerializer, ProductCreateSerializer,
    ProductUpdateSerializer, ProductListSerializer, ProductDetailSerializer,
    CollectionSerializer, CollectionCreateSerializer, ProductStatusSerializer,
    ProductReviewSerializer
)
from apps.merchant.serializers import MerchantInfoSerializer
from apps.merchant.models import Merchant
from .models import ProductCategory, Product, Collection, ProductReview
from apps.order.models import Order

class ProductCategoryView(APIView):
    """商品分类管理视图（管理员）"""
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get(self, request):
        """获取商品分类列表"""
        categories = ProductCategory.objects.filter(parent__isnull=True).order_by('-sort', 'id')
        serializer = ProductCategorySerializer(categories, many=True)
        return Response({
            'code': 200,
            'message': '获取成功',
            'data': serializer.data
        }, status=status.HTTP_200_OK)
    
    def post(self, request):
        """创建商品分类"""
        serializer = ProductCategoryCreateSerializer(data=request.data)
        if serializer.is_valid():
            category = serializer.save()
            return Response({
                'code': 201,
                'message': '创建成功',
                'data': ProductCategorySerializer(category).data
            }, status=status.HTTP_201_CREATED)
        return Response({
            'code': 400,
            'message': '创建失败',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

class ProductCategoryDetailView(APIView):
    """商品分类详情视图（管理员）"""
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get(self, request, category_id):
        """获取商品分类详情"""
        try:
            category = ProductCategory.objects.get(id=category_id)
            serializer = ProductCategorySerializer(category)
            return Response({
                'code': 200,
                'message': '获取成功',
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        except ProductCategory.DoesNotExist:
            return Response({
                'code': 404,
                'message': '分类不存在'
            }, status=status.HTTP_404_NOT_FOUND)
    
    def put(self, request, category_id):
        """更新商品分类"""
        try:
            category = ProductCategory.objects.get(id=category_id)
            serializer = ProductCategoryUpdateSerializer(category, data=request.data)
            if serializer.is_valid():
                category = serializer.save()
                return Response({
                    'code': 200,
                    'message': '更新成功',
                    'data': ProductCategorySerializer(category).data
                }, status=status.HTTP_200_OK)
            return Response({
                'code': 400,
                'message': '更新失败',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        except ProductCategory.DoesNotExist:
            return Response({
                'code': 404,
                'message': '分类不存在'
            }, status=status.HTTP_404_NOT_FOUND)

class ProductCategoryListView(APIView):
    """商品分类列表视图（公开）"""
    permission_classes = [AllowAny]
    authentication_classes = []
    
    def get(self, request):
        """获取启用的商品分类列表"""
        categories = ProductCategory.objects.filter(status=1, parent__isnull=True).order_by('-sort', 'id')
        serializer = ProductCategorySerializer(categories, many=True)
        return Response({
            'code': 200,
            'message': '获取成功',
            'data': serializer.data
        }, status=status.HTTP_200_OK)

class ProductView(APIView):
    """商户商品管理视图"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """获取商户商品列表（支持分页和搜索）"""
        try:
            merchant = Merchant.objects.get(user=request.user)
            
            # 获取查询参数
            keyword = request.query_params.get('keyword', '')
            category_id = request.query_params.get('category', '')
            page = int(request.query_params.get('page', 1))
            page_size = int(request.query_params.get('page_size', 10))
            
            query = Q(merchant=merchant)
            if keyword:
                query &= Q(product_name__icontains=keyword)
            if category_id:
                query &= Q(category_id=category_id)
                
            products = Product.objects.filter(query).order_by('-create_time')
            
            # 分页处理
            paginator = Paginator(products, page_size)
            total = paginator.count
            page_obj = paginator.get_page(page)
            
            # 转换数据格式以适配前端
            results = []
            for p in page_obj:
                results.append({
                    'id': p.id,
                    'product_name': p.product_name,
                    'price': float(p.price),
                    'stock': p.remaining_stock,
                    'sales_count': p.sales_count,
                    'status': p.status,
                    'create_time': p.create_time.strftime('%Y-%m-%d %H:%M:%S'),
                    'image': p.product_images[0] if p.product_images and len(p.product_images) > 0 else 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&h=300&fit=crop'
                })
                
            return Response({
                'code': 200,
                'message': '获取成功',
                'data': {
                    'results': results,
                    'total': total,
                    'page': page,
                    'page_size': page_size
                }
            }, status=status.HTTP_200_OK)
        except Merchant.DoesNotExist:
            return Response({
                'code': 404,
                'message': '商户信息不存在'
            }, status=status.HTTP_404_NOT_FOUND)
    
    def post(self, request):
        """创建商品"""
        try:
            merchant = Merchant.objects.get(user=request.user)
            
            # 检查是否审核通过
            if merchant.status != 1:
                return Response({
                    'code': 403,
                    'message': '商户尚未审核通过，无法发布商品'
                }, status=status.HTTP_403_FORBIDDEN)
            
            data = request.data
            category_id = data.get('category_id') or data.get('category')
            
            # 转换前端字段到后端字段
            product = Product.objects.create(
                merchant=merchant,
                category_id=category_id,
                product_name=data.get('product_name'),
                product_desc=data.get('product_desc'),
                product_images=[data.get('image')] if data.get('image') else [],
                price=data.get('price'),
                original_price=data.get('original_price'),
                total_stock=data.get('stock', 0),
                remaining_stock=data.get('stock', 0),
                status=data.get('status', 1),
                is_recommend=data.get('is_recommend', 0)
            )
            
            return Response({
                'code': 201,
                'message': '创建成功',
                'data': {'id': product.id}
            }, status=status.HTTP_201_CREATED)
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

class MerchantProductStatusView(APIView):
    """商户商品状态管理视图"""
    permission_classes = [IsAuthenticated]
    
    def put(self, request, product_id):
        try:
            merchant = Merchant.objects.get(user=request.user)
            product = Product.objects.get(id=product_id, merchant=merchant)
            
            status_val = request.data.get('status')
            if status_val is not None:
                product.status = status_val
                product.save()
                
            return Response({
                'code': 200,
                'message': '状态更新成功'
            })
        except (Merchant.DoesNotExist, Product.DoesNotExist):
            return Response({
                'code': 404,
                'message': '商品不存在'
            }, status=status.HTTP_404_NOT_FOUND)

class MerchantProductDetailView(APIView):
    """商户商品详情管理视图"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, product_id):
        try:
            merchant = Merchant.objects.get(user=request.user)
            product = Product.objects.get(id=product_id, merchant=merchant)
            
            data = {
                'id': product.id,
                'product_name': product.product_name,
                'product_desc': product.product_desc,
                'price': float(product.price),
                'original_price': float(product.original_price) if product.original_price else 0,
                'stock': product.remaining_stock,
                'category_id': product.category_id,
                'status': product.status,
                'is_recommend': product.is_recommend,
                'image': product.product_images[0] if product.product_images and len(product.product_images) > 0 else ''
            }
            
            return Response({
                'code': 200,
                'message': '获取成功',
                'data': data
            })
        except (Merchant.DoesNotExist, Product.DoesNotExist):
            return Response({
                'code': 404,
                'message': '商品不存在'
            }, status=status.HTTP_404_NOT_FOUND)
            
    def put(self, request, product_id):
        try:
            merchant = Merchant.objects.get(user=request.user)
            product = Product.objects.get(id=product_id, merchant=merchant)
            
            data = request.data
            product.product_name = data.get('product_name', product.product_name)
            product.product_desc = data.get('product_desc', product.product_desc)
            product.price = data.get('price', product.price)
            product.original_price = data.get('original_price', product.original_price)
            product.remaining_stock = data.get('stock', product.remaining_stock)
            product.category_id = data.get('category_id') or data.get('category') or product.category_id
            product.status = data.get('status', product.status)
            product.is_recommend = data.get('is_recommend', product.is_recommend)
            
            if data.get('image'):
                product.product_images = [data.get('image')]
                
            product.save()
            
            return Response({
                'code': 200,
                'message': '修改成功'
            })
        except (Merchant.DoesNotExist, Product.DoesNotExist):
            return Response({
                'code': 404,
                'message': '商品不存在'
            }, status=status.HTTP_404_NOT_FOUND)
            
    def delete(self, request, product_id):
        try:
            merchant = Merchant.objects.get(user=request.user)
            product = Product.objects.get(id=product_id, merchant=merchant)
            product.delete()
            return Response({
                'code': 200,
                'message': '删除成功'
            })
        except (Merchant.DoesNotExist, Product.DoesNotExist):
            return Response({
                'code': 404,
                'message': '商品不存在'
            }, status=status.HTTP_404_NOT_FOUND)

class ProductPublicListView(APIView):
    """商品列表视图（公开）"""
    permission_classes = [AllowAny]
    authentication_classes = []
    
    def get(self, request):
        """获取商品列表，支持搜索和筛选"""
        # 获取查询参数
        keyword = request.query_params.get('keyword', '')
        category_id = request.query_params.get('category_id', None)
        merchant_id = request.query_params.get('merchant_id', None)
        min_price = request.query_params.get('min_price', None)
        max_price = request.query_params.get('max_price', None)
        sort = request.query_params.get('sort', 'id')
        
        # 构建查询条件
        query = Q(status=1)  # 只显示上架商品
        
        if keyword:
            query &= Q(product_name__icontains=keyword) | Q(product_desc__icontains=keyword)
        if category_id:
            query &= Q(category_id=category_id)
        if merchant_id:
            query &= Q(merchant_id=merchant_id)
        if min_price:
            query &= Q(price__gte=min_price)
        if max_price:
            query &= Q(price__lte=max_price)
        
        # 处理排序
        if sort == 'price_asc':
            order_by = 'price'
        elif sort == 'price_desc':
            order_by = '-price'
        elif sort == 'sales':
            order_by = '-sales_count'
        elif sort == 'view':
            order_by = '-view_count'
        elif sort == 'create':
            order_by = '-create_time'
        else:
            order_by = '-id'
        
        products = Product.objects.filter(query).order_by(order_by)
        serializer = ProductListSerializer(products, many=True)
        return Response({
            'code': 200,
            'message': '获取成功',
            'data': serializer.data
        }, status=status.HTTP_200_OK)

class ProductPublicDetailView(APIView):
    """商品详情视图（公开）"""
    permission_classes = [AllowAny]

    def get(self, request, product_id):
        """获取商品详情"""
        try:
            # 先不限制 status=1，方便测试，但如果未上架可以在前端提示
            product = Product.objects.get(id=product_id)
            # 增加浏览量
            product.view_count += 1
            product.save()
            serializer = ProductDetailSerializer(product)
            data = serializer.data
            
            # 检查是否已收藏
            is_collected = False
            if request.user.is_authenticated:
                is_collected = Collection.objects.filter(user=request.user, product=product).exists()
            data['is_collected'] = is_collected
            
            return Response({
                'code': 200,
                'message': '获取成功',
                'data': data
            }, status=status.HTTP_200_OK)
        except Product.DoesNotExist:
            return Response({
                'code': 404,
                'message': '商品不存在或已下架'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            import traceback
            print(f"获取商品详情异常: {str(e)}")
            traceback.print_exc()
            return Response({
                'code': 500,
                'message': f'服务器内部错误: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class MerchantCategoryListView(APIView):
    """获取指定商户的商品分类列表"""
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request, merchant_id):
        try:
            # 获取该商户下所有商品所关联的分类ID
            category_ids = Product.objects.filter(merchant_id=merchant_id, status=1).values_list('category_id', flat=True).distinct()
            # 获取对应的分类对象
            categories = ProductCategory.objects.filter(id__in=category_ids)
            serializer = ProductCategorySerializer(categories, many=True)
            return Response({
                'code': 200,
                'message': '获取成功',
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'code': 500,
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ProductRecommendView(APIView):
    """推荐商品视图"""
    permission_classes = [AllowAny]
    authentication_classes = []
    
    def get(self, request):
        """获取推荐商品（支持随机排序和分页）"""
        # 获取分页参数
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 10))
        random_order = request.query_params.get('random', 'true').lower() == 'true'
        
        # 获取推荐的商品
        products_query = Product.objects.filter(status=1, is_recommend=1)
        
        # 随机排序
        if random_order:
            products_query = products_query.order_by('?')
        else:
            products_query = products_query.order_by('-sales_count')
        
        # 分页处理
        paginator = Paginator(products_query, page_size)
        total = paginator.count
        page_obj = paginator.get_page(page)
        
        serializer = ProductListSerializer(page_obj, many=True)
        
        return Response({
            'code': 200,
            'message': '获取成功',
            'data': {
                'results': serializer.data,
                'total': total,
                'page': page,
                'page_size': page_size
            }
        }, status=status.HTTP_200_OK)

class ProductHotView(APIView):
    """热门商品视图"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        """获取热门商品（按销量排序）"""
        products = Product.objects.filter(status=1).order_by('-sales_count')[:10]
        serializer = ProductListSerializer(products, many=True)
        return Response({
            'code': 200,
            'message': '获取成功',
            'data': serializer.data
        }, status=status.HTTP_200_OK)

class CollectionView(APIView):
    """商品收藏视图"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """获取收藏列表"""
        collections = Collection.objects.filter(user=request.user)
        serializer = CollectionSerializer(collections, many=True)
        return Response({
            'code': 200,
            'message': '获取成功',
            'data': serializer.data
        }, status=status.HTTP_200_OK)
    
    def post(self, request):
        """创建收藏"""
        serializer = CollectionCreateSerializer(data=request.data)
        if serializer.is_valid():
            product = serializer.validated_data['product']
            # 检查是否已收藏
            if Collection.objects.filter(user=request.user, product=product).exists():
                return Response({
                    'code': 400,
                    'message': '已收藏该商品'
                }, status=status.HTTP_400_BAD_REQUEST)
            # 创建收藏
            collection = serializer.save(user=request.user)
            # 增加商品收藏数
            product.collect_count += 1
            product.save()
            return Response({
                'code': 201,
                'message': '收藏成功',
                'data': CollectionSerializer(collection).data
            }, status=status.HTTP_201_CREATED)
        return Response({
            'code': 400,
            'message': '收藏失败',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request):
        """取消收藏（通过 product_id）"""
        product_id = request.query_params.get('product_id')
        if not product_id:
            return Response({
                'code': 400,
                'message': '缺少商品ID'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            collection = Collection.objects.get(user=request.user, product_id=product_id)
            product = collection.product
            collection.delete()
            # 减少商品收藏数
            if product.collect_count > 0:
                product.collect_count -= 1
                product.save()
            return Response({
                'code': 200,
                'message': '取消收藏成功'
            }, status=status.HTTP_200_OK)
        except Collection.DoesNotExist:
            return Response({
                'code': 404,
                'message': '尚未收藏该商品'
            }, status=status.HTTP_404_NOT_FOUND)

class ProductReviewView(APIView):
    """商品评价视图"""
    permission_classes = [AllowAny]
    
    def get(self, request, product_id):
        """获取商品评价列表"""
        reviews = ProductReview.objects.filter(product_id=product_id)
        serializer = ProductReviewSerializer(reviews, many=True)
        return Response({
            'code': 200,
            'message': '获取成功',
            'data': serializer.data
        }, status=status.HTTP_200_OK)

    def post(self, request, product_id):
        """提交商品评价"""
        if not request.user.is_authenticated:
            return Response({
                'code': 401,
                'message': '请先登录'
            }, status=status.HTTP_401_UNAUTHORIZED)
            
        # 检查是否购买过该商品
        # 通过查询该用户已支付成功的订单，并检查 product_info JSON 字段
        has_purchased = False
        orders = Order.objects.filter(user=request.user, payment_status=1)
        for order in orders:
            if isinstance(order.product_info, list):
                for item in order.product_info:
                    if str(item.get('product_id')) == str(product_id):
                        has_purchased = True
                        break
            if has_purchased:
                break
        
        if not has_purchased:
            return Response({
                'code': 403,
                'message': '只有购买过该商品的用户才能评价'
            }, status=status.HTTP_403_FORBIDDEN)
            
        serializer = ProductReviewSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user, product_id=product_id)
            return Response({
                'code': 201,
                'message': '评价成功',
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)
        return Response({
            'code': 400,
            'message': '评价失败',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

class CollectionDetailView(APIView):
    """收藏详情视图"""
    permission_classes = [IsAuthenticated]
    
    def delete(self, request, collection_id):
        """取消收藏"""
        try:
            collection = Collection.objects.get(id=collection_id, user=request.user)
            product = collection.product
            # 删除收藏
            collection.delete()
            # 减少商品收藏数
            if product.collect_count > 0:
                product.collect_count -= 1
                product.save()
            return Response({
                'code': 200,
                'message': '取消收藏成功'
            }, status=status.HTTP_200_OK)
        except Collection.DoesNotExist:
            return Response({
                'code': 404,
                'message': '收藏不存在'
            }, status=status.HTTP_404_NOT_FOUND)

class GlobalSearchView(APIView):
    """综合搜索视图"""
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        keyword = request.query_params.get('keyword', '').strip()
        category_id = request.query_params.get('category_id')
        
        if not keyword and not category_id:
            return Response({
                'code': 200,
                'message': '请输入关键词搜索',
                'data': {
                    'products': [],
                    'merchants': [],
                    'categories': [],
                    'all': []
                }
            })

        # 1. 搜索商品 (模糊匹配名称、描述或所属分类名称)
        product_query = Q(status=1)
        if keyword:
            product_query &= (
                Q(product_name__icontains=keyword) | 
                Q(product_desc__icontains=keyword) |
                Q(category__category_name__icontains=keyword)
            )
        if category_id:
            product_query &= Q(category_id=category_id)
            
        products = Product.objects.filter(product_query).order_by('-sales_count')[:40]
        product_data = ProductListSerializer(products, many=True).data
        for item in product_data:
            item['search_type'] = 'product'

        # 2. 搜索商家 (模糊匹配商户名称)
        merchant_data = []
        if keyword:
            merchants = Merchant.objects.filter(
                merchant_name__icontains=keyword,
                status=1
            )[:10]
            merchant_data = MerchantInfoSerializer(merchants, many=True).data
            for item in merchant_data:
                item['search_type'] = 'merchant'

        # 3. 搜索“分类”下的商品 (即通过关键词匹配分类名，返回该分类下的商品)
        category_product_data = []
        if keyword:
            category_products = Product.objects.filter(
                category__category_name__icontains=keyword,
                status=1
            ).order_by('-sales_count')[:20]
            category_product_data = ProductListSerializer(category_products, many=True).data
            for item in category_product_data:
                item['search_type'] = 'product'

        # 合并全部结果并随机排序
        import random
        all_results = product_data + merchant_data
        # 避免重复商品（如果既匹配了名字又匹配了分类）
        seen_ids = set()
        unique_all_results = []
        for item in all_results:
            if item['search_type'] == 'product':
                if item['id'] not in seen_ids:
                    seen_ids.add(item['id'])
                    unique_all_results.append(item)
            else:
                unique_all_results.append(item)
        
        random.shuffle(unique_all_results)

        return Response({
            'code': 200,
            'message': '搜索成功',
            'data': {
                'products': product_data,
                'merchants': merchant_data,
                'categories': category_product_data, # 这里现在返回的是该分类下的商品
                'all': unique_all_results
            }
        })
