import os
import django
import sys

# 设置项目路径
project_path = os.path.dirname(os.path.abspath(__file__))
sys.path.append(project_path)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_mall_backend.settings')
django.setup()

from apps.product.models import ProductCategory

category_name = '生活用品'
try:
    category = ProductCategory.objects.filter(category_name=category_name, parent=None).first()
    if category:
        children_count = ProductCategory.objects.filter(parent=category).count()
        ProductCategory.objects.filter(parent=category).delete()
        print(f'已删除 "{category_name}" 的 {children_count} 个子分类')
        category.delete()
        print(f'已删除主分类: {category_name}')
    else:
        print(f'未找到分类: {category_name}')
    
    print('\n剩余分类列表:')
    for cat in ProductCategory.objects.filter(parent=None):
        print(f'- {cat.category_name}')
except Exception as e:
    print(f'错误: {str(e)}')
