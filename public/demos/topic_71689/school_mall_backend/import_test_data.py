import os
import django
import sys

# 设置项目路径
project_path = os.path.dirname(os.path.abspath(__file__))
sys.path.append(project_path)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_mall_backend.settings')
django.setup()

from apps.user.models import User
from apps.merchant.models import Merchant
from apps.product.models import Product, ProductCategory
from django.core.files.base import ContentFile
import decimal

def init_data():
    # 1. 创建管理员用户 (如果不存在)
    admin_email = 'admin@example.com'
    admin_user, created = User.objects.get_or_create(
        username=admin_email,
        defaults={
            'email': admin_email,
            'is_staff': True,
            'is_superuser': True,
            'is_real_name': 1
        }
    )
    if created:
        admin_user.set_password('admin123')
        admin_user.save()
        print(f"Created admin user: {admin_email}")
    else:
        print(f"Admin user already exists: {admin_email}")

    # 2. 创建官方商户 (如果不存在)
    merchant, created = Merchant.objects.get_or_create(
        user=admin_user,
        defaults={
            'merchant_name': '校园官方旗舰店',
            'merchant_desc': '校园自营，品质保证',
            'status': 1
        }
    )
    if created:
        print(f"Created merchant: {merchant.merchant_name}")
    else:
        print(f"Merchant already exists: {merchant.merchant_name}")

    # 3. 获取或创建分类
    def get_or_create_category(name, parent=None):
        cat, _ = ProductCategory.objects.get_or_create(
            category_name=name,
            parent=parent,
            defaults={'status': 1}
        )
        return cat

    cat_digital = get_or_create_category('数码科技')
    cat_phone = get_or_create_category('智能手机', cat_digital)
    cat_laptop = get_or_create_category('笔记本电脑', cat_digital)
    
    cat_life = get_or_create_category('居家生活')
    cat_food = get_or_create_category('食品零食', cat_life)
    
    cat_fashion = get_or_create_category('潮流服饰')
    cat_shoes = get_or_create_category('运动鞋', cat_fashion)

    # 4. 导入测试商品数据 (模仿 Home.vue 之前的风格)
    test_products = [
        {
            'name': 'Apple iPhone 15 Pro',
            'price': 7999.00,
            'original_price': 8999.00,
            'category': cat_phone,
            'desc': '钛金属设计，A17 Pro 芯片，4800 万像素主摄。',
            'images': ['https://images.unsplash.com/photo-1696446701796-da61225697cc?w=500&h=500&fit=crop'],
            'is_recommend': 1,
            'stock': 100,
            'sales': 500
        },
        {
            'name': 'MacBook Air M3 芯片',
            'price': 8999.00,
            'original_price': 9499.00,
            'category': cat_laptop,
            'desc': '轻薄强劲，M3 芯片加持，全天续航。',
            'images': ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&h=500&fit=crop'],
            'is_recommend': 1,
            'stock': 50,
            'sales': 200
        },
        {
            'name': '索尼 WH-1000XM5 降噪耳机',
            'price': 2499.00,
            'original_price': 2999.00,
            'category': cat_digital,
            'desc': '行业领先的降噪技术，高品质音效。',
            'images': ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop'],
            'is_recommend': 1,
            'stock': 150,
            'sales': 800
        },
        {
            'name': '三只松鼠 坚果礼包',
            'price': 129.00,
            'original_price': 159.00,
            'category': cat_food,
            'desc': '多种坚果组合，营养美味。',
            'images': ['https://images.unsplash.com/photo-1536627217148-d4ac5224d459?w=500&h=500&fit=crop'],
            'is_recommend': 1,
            'stock': 1000,
            'sales': 5000
        },
        {
            'name': '耐克 Air Jordan 1',
            'price': 1299.00,
            'original_price': 1499.00,
            'category': cat_shoes,
            'desc': '经典复刻，潮流必备。',
            'images': ['https://images.unsplash.com/photo-1584735175315-9d5df23860e6?w=500&h=500&fit=crop'],
            'is_recommend': 1,
            'stock': 80,
            'sales': 300
        }
    ]

    for p_data in test_products:
        product, created = Product.objects.get_or_create(
            product_name=p_data['name'],
            merchant=merchant,
            defaults={
                'category': p_data['category'],
                'product_desc': p_data['desc'],
                'product_images': p_data['images'],
                'price': p_data['price'],
                'original_price': p_data['original_price'],
                'total_stock': p_data['stock'],
                'remaining_stock': p_data['stock'],
                'sales_count': p_data['sales'],
                'is_recommend': p_data['is_recommend'],
                'status': 1
            }
        )
        if created:
            print(f"Imported product: {product.product_name}")
        else:
            # 更新现有数据
            product.original_price = p_data['original_price']
            product.is_recommend = 1
            product.status = 1
            product.save()
            print(f"Updated product: {product.product_name}")

if __name__ == '__main__':
    init_data()
