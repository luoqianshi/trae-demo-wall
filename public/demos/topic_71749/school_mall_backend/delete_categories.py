import os
import django
import sys

# 设置项目路径
project_path = os.path.dirname(os.path.abspath(__file__))
sys.path.append(project_path)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_mall_backend.settings')
django.setup()

from apps.product.models import ProductCategory

def delete_categories():
    # 要删除的分类名称列表
    categories_to_delete = ['数码产品', '图书影像', '运动器材']
    
    for category_name in categories_to_delete:
        try:
            # 查找主分类
            category = ProductCategory.objects.filter(category_name=category_name, parent=None).first()
            if category:
                # 先删除子分类
                children_count = ProductCategory.objects.filter(parent=category).count()
                ProductCategory.objects.filter(parent=category).delete()
                print(f"已删除 '{category_name}' 的 {children_count} 个子分类")
                
                # 删除主分类
                category.delete()
                print(f"已删除主分类: {category_name}")
            else:
                print(f"未找到分类: {category_name}")
        except Exception as e:
            print(f"删除分类 '{category_name}' 时出错: {str(e)}")
    
    print("\n删除完成！")
    
    # 显示剩余分类
    print("\n剩余分类列表:")
    categories = ProductCategory.objects.filter(parent=None)
    for cat in categories:
        print(f"- {cat.category_name}")

if __name__ == '__main__':
    delete_categories()
