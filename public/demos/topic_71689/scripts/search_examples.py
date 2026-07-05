#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
商品图片搜索示例脚本
展示如何使用通配符搜索商品
"""

from product_image_search import ProductImageSearcher


def example_basic_search():
    """基本搜索示例"""
    print("=" * 60)
    print("示例1: 基本搜索 - 获取前20个商品")
    print("=" * 60)

    searcher = ProductImageSearcher('../hmall.sql')

    # 不设置关键词，获取前20个商品
    products = searcher.parse_sql_file(limit=20)

    print(f"找到 {len(products)} 个商品:\n")
    for p in products:
        print(f"  ID: {p['id']}")
        print(f"  名称: {p['name']}")
        print(f"  分类: {p['category']}")
        print(f"  品牌: {p['brand']}")
        print(f"  价格: ¥{p['price']}")
        print("-" * 40)


def example_fuzzy_search():
    """模糊搜索示例"""
    print("\n" + "=" * 60)
    print("示例2: 模糊搜索 - 搜索手机相关商品")
    print("=" * 60)

    searcher = ProductImageSearcher('../hmall.sql')

    # 使用通配符 * 匹配任意字符
    # 搜索包含"手机"的商品
    products = searcher.parse_sql_file(limit=10, keyword='*手机*')

    print(f"找到 {len(products)} 个手机相关商品:\n")
    for p in products:
        print(f"  名称: {p['name']}")
        print(f"  分类: {p['category']}")
        print("-" * 40)


def example_brand_search():
    """品牌搜索示例"""
    print("\n" + "=" * 60)
    print("示例3: 品牌搜索 - 搜索华为商品")
    print("=" * 60)

    searcher = ProductImageSearcher('../hmall.sql')

    # 搜索华为品牌的商品
    products = searcher.parse_sql_file(limit=10, keyword='*华为*')

    print(f"找到 {len(products)} 个华为商品:\n")
    for p in products:
        print(f"  名称: {p['name']}")
        print(f"  价格: ¥{p['price']}")
        print("-" * 40)


def example_category_search():
    """分类搜索示例"""
    print("\n" + "=" * 60)
    print("示例4: 分类搜索 - 搜索拉杆箱")
    print("=" * 60)

    searcher = ProductImageSearcher('../hmall.sql')

    # 搜索拉杆箱
    products = searcher.parse_sql_file(limit=10, keyword='*拉杆箱*')

    print(f"找到 {len(products)} 个拉杆箱:\n")
    for p in products:
        print(f"  名称: {p['name']}")
        print(f"  品牌: {p['brand']}")
        print("-" * 40)


def example_generate_sql():
    """生成SQL示例"""
    print("\n" + "=" * 60)
    print("示例5: 生成SQL - 搜索并生成插入语句")
    print("=" * 60)

    searcher = ProductImageSearcher('../hmall.sql')

    # 搜索休闲鞋并生成SQL
    products = searcher.parse_sql_file(limit=5, keyword='*鞋*')

    print(f"找到 {len(products)} 个鞋类商品，生成SQL:\n")

    for p in products:
        # 提取搜索关键词
        keywords = searcher.extract_search_keywords(p['name'])
        print(f"商品: {p['name']}")
        print(f"搜索关键词: {keywords}")

        # 获取默认图片
        images = searcher._get_default_images(3)

        # 生成SQL
        sql = searcher.generate_product_sql(p, images)
        print(f"生成的SQL:\n{sql}")
        print("=" * 60)


def show_usage():
    """显示使用说明"""
    print("""
通配符使用说明:
================
*  - 匹配任意数量的字符
?  - 匹配单个字符

示例:
  *手机*     - 匹配包含"手机"的任何商品
  华为*      - 匹配以"华为"开头的商品
  *拉杆箱    - 匹配以"拉杆箱"结尾的商品
  华为?为    - 匹配"华为X为"格式的商品

常用分类关键词:
================
  手机、拉杆箱、牛仔裤、休闲鞋、老花镜
  真皮包、拉拉裤、运动鞋、T恤、外套

使用命令行:
================
python product_image_search.py --keyword "*手机*" --limit 20
python product_image_search.py --keyword "*华为*" --limit 10 --output huawei_products.sql
python product_image_search.py --keyword "*拉杆箱*" --limit 15 --source unsplash
    """)


if __name__ == '__main__':
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == '--help':
        show_usage()
    else:
        # 运行所有示例
        example_basic_search()
        example_fuzzy_search()
        example_brand_search()
        example_category_search()
        example_generate_sql()

        print("\n" + "=" * 60)
        print("所有示例运行完成！")
        print("运行 python search_examples.py --help 查看使用说明")
        print("=" * 60)
