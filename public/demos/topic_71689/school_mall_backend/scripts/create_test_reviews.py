import os
import django
import random
import sys

# 将项目根目录添加到 sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# 设置 Django 环境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_mall_backend.settings')
django.setup()

from apps.product.models import Product, ProductReview
from apps.user.models import User
from apps.merchant.models import Merchant

def create_test_reviews():
    products = Product.objects.all()
    users = User.objects.all()
    
    if not products or not users:
        print("没有商品或用户，无法创建评价")
        return

    contents = [
        "非常实用的东西，价格也很公道，校园配送非常快，好评！",
        "质量超出预期，真的很好用，推荐学弟学妹们购买。",
        "学长推荐的，确实不错，卖家态度也很好。",
        "性价比极高，这个价格能买到这种质量的真的很划算。",
        "送货速度很快，包装也很完整，非常满意的一次购物。",
        "东西很好，是正品，已经在用了。",
        "校园网配送就是快，下单不到一小时就送到了，厉害！",
        "稍微有一点色差，但整体不影响使用，还是很喜欢的。"
    ]

    for product in products:
        # 每个商品创建 2-5 条评价
        num_reviews = random.randint(2, 5)
        for _ in range(num_reviews):
            user = random.choice(users)
            ProductReview.objects.create(
                product=product,
                user=user,
                content=random.choice(contents),
                rating=random.randint(4, 5)  # 大部分是好评
            )
        print(f"为商品 {product.product_name} 创建了 {num_reviews} 条评价")

def update_merchant_logos():
    merchants = Merchant.objects.all()
    logos = [
        "https://images.unsplash.com/photo-1594179047519-f347310d3322?w=100&h=100&fit=crop",
        "https://images.unsplash.com/photo-1534723328310-e82dad3ee43f?w=100&h=100&fit=crop",
        "https://images.unsplash.com/photo-1511317559916-56d5ddb62563?w=100&h=100&fit=crop"
    ]
    
    for i, merchant in enumerate(merchants):
        merchant.merchant_logo = logos[i % len(logos)]
        merchant.save()
        print(f"已更新商户 {merchant.merchant_name} 的 Logo")

if __name__ == "__main__":
    create_test_reviews()
    update_merchant_logos()
    print("测试数据更新完成！")
