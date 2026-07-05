#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
黑马商城商品图片搜索脚本
从SQL文件中提取商品信息，使用通配符搜索匹配的图片
"""

import re
import json
import requests
import time
from urllib.parse import quote
from typing import List, Dict, Optional


class ProductImageSearcher:
    """商品图片搜索器"""

    def __init__(self, sql_file_path: str):
        self.sql_file_path = sql_file_path
        self.products = []

    def parse_sql_file(self, limit: int = 20, keyword: str = None, remove_duplicates: bool = True) -> List[Dict]:
        """
        解析SQL文件，提取商品信息

        Args:
            limit: 限制返回的商品数量
            keyword: 搜索关键词（支持通配符模糊匹配）
            remove_duplicates: 是否去重（根据商品名称）

        Returns:
            商品列表
        """
        products = []
        seen_names = set()  # 用于去重

        with open(self.sql_file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # 匹配INSERT语句中的商品数据
        # 格式: (id, 'name', price, stock, 'image', 'category', 'brand', 'spec', ...)
        pattern = r"\((\d+),\s*'([^']+)',\s*(\d+),\s*(\d+),\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)'"

        matches = re.findall(pattern, content)

        for match in matches:
            product_id, name, price, stock, image, category, brand, spec = match

            # 如果有关键词，进行模糊匹配
            if keyword:
                # 将通配符转换为正则表达式
                pattern_keyword = keyword.replace('*', '.*').replace('?', '.')
                if not re.search(pattern_keyword, name, re.IGNORECASE):
                    continue

            # 去重处理：根据商品名称
            if remove_duplicates:
                # 使用清理后的名称作为去重键
                clean_name = self._get_product_key(name)
                if clean_name in seen_names:
                    continue
                seen_names.add(clean_name)

            products.append({
                'id': product_id,
                'name': name,
                'price': int(price) / 100,  # 转换为元
                'stock': int(stock),
                'image': image,
                'category': category,
                'brand': brand,
                'spec': spec
            })

            if len(products) >= limit:
                break

        self.products = products
        return products

    def _get_product_key(self, name: str) -> str:
        """
        获取商品去重键，清理规格信息后返回核心名称
        
        Args:
            name: 商品名称
            
        Returns:
            去重键
        """
        # 移除尺寸、颜色等规格信息
        key = re.sub(r'\d+寸|\d+英寸|\d+cm|\d+度|\d+GB|\d+G|\d+号', '', name)
        key = re.sub(r'黑色|白色|红色|蓝色|绿色|黄色|粉色|灰色|金色|银色|紫色|深灰|浅灰', '', key)
        key = re.sub(r'\s+', ' ', key).strip()
        return key.lower()

    def search_images_unsplash(self, query: str, count: int = 3) -> List[str]:
        """
        使用Unsplash API搜索图片
        注意：需要配置UNSPLASH_ACCESS_KEY环境变量

        Args:
            query: 搜索关键词
            count: 返回图片数量

        Returns:
            图片URL列表
        """
        import os

        access_key = os.getenv('UNSPLASH_ACCESS_KEY')
        if not access_key:
            print(f"  警告: 未设置UNSPLASH_ACCESS_KEY，使用关键词 '{query}' 搜索默认图片")
            return self._get_search_based_default_images(query, count)

        url = "https://api.unsplash.com/search/photos"
        headers = {
            "Authorization": f"Client-ID {access_key}"
        }
        params = {
            "query": query,
            "per_page": count,
            "orientation": "squarish"  # 方形图片更适合商品展示
        }

        try:
            response = requests.get(url, headers=headers, params=params, timeout=10)
            if response.status_code == 200:
                data = response.json()
                images = []
                for photo in data.get('results', []):
                    # 使用中等尺寸图片
                    img_url = photo.get('urls', {}).get('small')
                    if img_url:
                        images.append(img_url)
                if images:
                    print(f"  从Unsplash获取到 {len(images)} 张图片")
                    return images
                else:
                    print(f"  Unsplash未找到图片，使用默认图片")
                    return self._get_search_based_default_images(query, count)
            else:
                print(f"  Unsplash API错误: {response.status_code}，使用默认图片")
                return self._get_search_based_default_images(query, count)
        except Exception as e:
            print(f"  搜索图片失败: {e}，使用默认图片")
            return self._get_search_based_default_images(query, count)

    def search_images_pexels(self, query: str, count: int = 3) -> List[str]:
        """
        使用Pexels API搜索图片
        注意：需要配置PEXELS_API_KEY环境变量

        Args:
            query: 搜索关键词
            count: 返回图片数量

        Returns:
            图片URL列表
        """
        import os

        api_key = os.getenv('PEXELS_API_KEY')
        if not api_key:
            print("警告: 未设置PEXELS_API_KEY环境变量，使用默认图片")
            return self._get_default_images(count)

        url = "https://api.pexels.com/v1/search"
        headers = {
            "Authorization": api_key
        }
        params = {
            "query": query,
            "per_page": count,
            "orientation": "square"
        }

        try:
            response = requests.get(url, headers=headers, params=params, timeout=10)
            if response.status_code == 200:
                data = response.json()
                images = []
                for photo in data.get('photos', []):
                    # 使用中等尺寸图片
                    img_url = photo.get('src', {}).get('medium')
                    if img_url:
                        images.append(img_url)
                return images if images else self._get_default_images(count)
            else:
                print(f"Pexels API错误: {response.status_code}")
                return self._get_default_images(count)
        except Exception as e:
            print(f"搜索图片失败: {e}")
            return self._get_default_images(count)

    def _get_default_images(self, count: int = 3) -> List[str]:
        """获取默认图片URL列表"""
        defaults = [
            "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop",
            "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop",
            "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&h=800&fit=crop",
            "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=800&h=800&fit=crop",
            "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop"
        ]
        return defaults[:count]

    def _get_search_based_default_images(self, query: str, count: int = 3) -> List[str]:
        """
        根据搜索关键词返回相关的默认图片
        使用Unsplash Source服务根据关键词获取相关图片
        """
        import hashlib

        # 根据关键词生成一个稳定的随机种子
        seed = int(hashlib.md5(query.encode()).hexdigest(), 16)

        # 为不同类别定义图片集合
        image_categories = {
            'luggage': [
                "https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?w=800&h=800&fit=crop",
                "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=800&fit=crop",
                "https://images.unsplash.com/photo-1562155847-c05f7386b207?w=800&h=800&fit=crop",
                "https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?w=800&h=800&fit=crop",
                "https://images.unsplash.com/photo-1553531384-cc64ac80f931?w=800&h=800&fit=crop",
                "https://images.unsplash.com/photo-1562155847-c05f7386b207?w=800&h=800&fit=crop",
                "https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?w=800&h=800&fit=crop",
                "https://images.unsplash.com/photo-1553531384-cc64ac80f931?w=800&h=800&fit=crop",
            ],
            'phone': [
                "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=800&fit=crop",
                "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&h=800&fit=crop",
                "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=800&h=800&fit=crop",
                "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=800&h=800&fit=crop",
                "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&h=800&fit=crop",
                "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&h=800&fit=crop",
            ],
            'shoes': [
                "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop",
                "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&h=800&fit=crop",
                "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=800&fit=crop",
                "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&h=800&fit=crop",
                "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&h=800&fit=crop",
                "https://images.unsplash.com/photo-1560769629-975e13f0c470?w=800&h=800&fit=crop",
            ],
            'clothes': [
                "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop",
                "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&h=800&fit=crop",
                "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800&h=800&fit=crop",
                "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800&h=800&fit=crop",
                "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&h=800&fit=crop",
            ],
            'bag': [
                "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&h=800&fit=crop",
                "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&h=800&fit=crop",
                "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=800&fit=crop",
                "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=800&fit=crop",
                "https://images.unsplash.com/photo-1547949003-9792a18a2601?w=800&h=800&fit=crop",
            ],
            'default': [
                "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop",
                "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop",
                "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&h=800&fit=crop",
                "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=800&h=800&fit=crop",
                "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop",
                "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&h=800&fit=crop",
                "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&h=800&fit=crop",
                "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&h=800&fit=crop",
            ]
        }

        # 根据关键词判断类别
        query_lower = query.lower()
        category = 'default'

        if any(word in query_lower for word in ['luggage', 'suitcase', '拉杆箱', '行李箱', '旅行箱', 'rimowa', '美旅']):
            category = 'luggage'
        elif any(word in query_lower for word in ['phone', 'mobile', '手机', '华为', 'iphone', 'samsung', '小米']):
            category = 'phone'
        elif any(word in query_lower for word in ['shoe', 'shoes', '鞋', '运动鞋', '休闲鞋', '皮鞋']):
            category = 'shoes'
        elif any(word in query_lower for word in ['jeans', 't-shirt', 'clothes', '牛仔裤', '衣服', '裤子']):
            category = 'clothes'
        elif any(word in query_lower for word in ['bag', 'pack', '包', '背包', '手提包']):
            category = 'bag'

        # 根据种子选择图片，确保同一关键词总是返回相同图片
        images = image_categories[category]
        selected = []
        for i in range(count):
            idx = (seed + i) % len(images)
            selected.append(images[idx])

        return selected

    def extract_search_keywords(self, product_name: str) -> str:
        """
        从商品名称中提取搜索关键词
        去除品牌名、规格等，保留核心产品词

        Args:
            product_name: 商品名称

        Returns:
            搜索关键词
        """
        # 常见需要过滤的词
        filter_words = [
            '男', '女', '男士', '女士', '新款', '正品', '包邮', '特价',
            '大码', '小码', '加大', '加小', '标准', '通用',
            '黑色', '白色', '红色', '蓝色', '绿色', '黄色', '粉色', '灰色', '金色', '银色',
            '大号', '小号', '中号', '特大', '特小',
            '春季', '夏季', '秋季', '冬季', '春秋', '秋冬',
            '韩版', '欧美', '日系', '中式',
            '时尚', '潮流', '经典', '简约', '休闲', '商务', '运动',
            '2018', '2019', '2020', '2021', '2022', '2023', '2024'
        ]

        # 提取核心产品词（通常是名词）
        # 简单策略：取商品名称的前2-4个词
        words = product_name.split()

        # 过滤掉包含数字和过滤词的词
        keywords = []
        for word in words[:4]:  # 只取前4个词
            # 跳过纯数字
            if word.isdigit():
                continue
            # 跳过包含过滤词的
            if any(fw in word for fw in filter_words):
                continue
            # 跳过纯英文型号（如 SM-G9600）
            if re.match(r'^[A-Z0-9\-]+$', word):
                continue
            keywords.append(word)

        # 如果没有提取到关键词，使用商品名称前10个字符
        if not keywords:
            return product_name[:10]

        return ' '.join(keywords[:2])  # 最多取2个关键词

    def generate_product_sql(self, product: Dict, new_images: List[str]) -> str:
        """
        生成商品INSERT SQL语句

        Args:
            product: 商品信息字典
            new_images: 新图片URL列表

        Returns:
            SQL语句
        """
        # 构建product_images JSON数组
        images_json = json.dumps(new_images, ensure_ascii=False)

        # 当前时间
        from datetime import datetime
        now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        # 构建SQL - 适配你的数据库结构
        sql = f'''INSERT INTO `product` (
    `product_name`, `product_desc`, `product_images`, `price`, 
    `status`, `total_stock`, `remaining_stock`, `sales_count`, 
    `view_count`, `collect_count`, `is_recommend`, `create_time`, 
    `category_id`, `merchant_id`, `original_price`
) VALUES (
    '{product['name']}', 
    '{product['brand']}品牌{product['category']}，品质保证。',
    '{images_json}',
    {product['price']},
    1,
    {product['stock']},
    {product['stock']},
    0,
    0,
    0,
    1,
    '{now}',
    1,
    2,
    {product['price'] * 1.2}
);'''

        return sql

    def process_products(self, keyword: str = None, limit: int = 20, 
                        image_source: str = 'original') -> List[str]:
        """
        处理商品，使用原始图片或搜索图片并生成SQL

        Args:
            keyword: 搜索关键词（支持通配符）
            limit: 限制处理的商品数量
            image_source: 图片来源 ('original'=使用原始SQL中的图片, 'unsplash', 'pexels', 'default')

        Returns:
            SQL语句列表
        """
        # 解析SQL获取商品（自动去重）
        products = self.parse_sql_file(limit=limit, keyword=keyword, remove_duplicates=True)
        print(f"找到 {len(products)} 个商品（已去重）")

        sql_statements = []

        for i, product in enumerate(products):
            print(f"\n处理商品 {i+1}/{len(products)}: {product['name']}")

            # 获取图片
            if image_source == 'original':
                # 使用原始SQL中的图片
                images = self._get_original_images(product)
                print(f"  使用原始图片: {len(images)} 张")
            elif image_source == 'unsplash':
                search_query = self._build_search_query(product)
                images = self.search_images_unsplash(search_query)
                print(f"  从Unsplash获取: {len(images)} 张")
            elif image_source == 'pexels':
                search_query = self._build_search_query(product)
                images = self.search_images_pexels(search_query)
                print(f"  从Pexels获取: {len(images)} 张")
            else:
                search_query = self._build_search_query(product)
                images = self._get_search_based_default_images(search_query, 3)
                print(f"  使用默认图片: {len(images)} 张")

            # 生成SQL
            sql = self.generate_product_sql(product, images)
            sql_statements.append(sql)

            # 避免请求过快
            if image_source in ['unsplash', 'pexels']:
                time.sleep(0.5)

        return sql_statements

    def _get_original_images(self, product: Dict) -> List[str]:
        """
        从原始商品数据中提取图片URL
        
        Args:
            product: 商品信息字典
            
        Returns:
            图片URL列表
        """
        image_str = product.get('image', '')
        if not image_str:
            # 如果没有图片，使用基于类别的默认图片
            return self._get_search_based_default_images(product.get('category', ''), 3)
        
        # 如果图片是JSON数组格式
        if image_str.startswith('['):
            try:
                images = json.loads(image_str)
                if isinstance(images, list) and len(images) > 0:
                    return images[:3]  # 最多3张
            except:
                pass
        
        # 如果图片是逗号分隔的URL
        if ',' in image_str:
            images = [url.strip() for url in image_str.split(',') if url.strip()]
            return images[:3]
        
        # 单张图片
        return [image_str] if image_str else self._get_search_based_default_images(product.get('category', ''), 3)

    def _build_search_query(self, product: Dict) -> str:
        """
        构建搜索查询词，根据商品信息生成最相关的搜索词
        
        Args:
            product: 商品信息字典
            
        Returns:
            搜索查询词
        """
        name = product['name']
        category = product['category']
        brand = product['brand']
        
        # 清理商品名称，移除规格信息
        # 移除尺寸、颜色等规格
        cleaned_name = re.sub(r'\d+寸|\d+英寸|\d+cm|\d+度|\d+GB|\d+G|\d+号', '', name)
        cleaned_name = re.sub(r'黑色|白色|红色|蓝色|绿色|黄色|粉色|灰色|金色|银色|紫色', '', cleaned_name)
        cleaned_name = re.sub(r'\d+', '', cleaned_name)  # 移除纯数字
        cleaned_name = cleaned_name.strip()
        
        # 构建搜索词：品牌 + 类别 + 核心产品词
        search_parts = []
        
        # 添加品牌（如果不是"其他"）
        if brand and brand != '其他' and len(brand) < 20:
            search_parts.append(brand)
        
        # 添加类别
        if category:
            search_parts.append(category)
        
        # 如果清理后的名称还有内容，添加核心词
        if cleaned_name:
            # 取前3个词作为核心产品词
            words = cleaned_name.split()[:3]
            core_words = ' '.join(words)
            if core_words and core_words not in ' '.join(search_parts):
                search_parts.append(core_words)
        
        # 组合搜索词
        if search_parts:
            query = ' '.join(search_parts[:3])  # 最多3个部分
        else:
            query = category if category else name[:20]
        
        return query.strip()


def main():
    """主函数"""
    import argparse

    parser = argparse.ArgumentParser(description='黑马商城商品图片搜索工具')
    parser.add_argument('--sql-file', default='../hmall.sql', 
                       help='SQL文件路径')
    parser.add_argument('--keyword', default=None,
                       help='搜索关键词（支持通配符 * 和 ?）')
    parser.add_argument('--limit', type=int, default=20,
                       help='限制处理的商品数量')
    parser.add_argument('--source', choices=['original', 'unsplash', 'pexels', 'default'], 
                       default='original',
                       help='图片来源 (original=使用SQL中的原始图片, default=使用分类默认图片)')
    parser.add_argument('--output', default='product_insert.sql',
                       help='输出SQL文件')

    args = parser.parse_args()

    # 创建搜索器
    searcher = ProductImageSearcher(args.sql_file)

    # 处理商品
    print(f"开始处理商品...")
    print(f"关键词: {args.keyword or '无'}")
    print(f"数量限制: {args.limit}")
    print(f"图片来源: {args.source}")
    print("-" * 50)

    sql_statements = searcher.process_products(
        keyword=args.keyword,
        limit=args.limit,
        image_source=args.source
    )

    # 保存SQL文件
    with open(args.output, 'w', encoding='utf-8') as f:
        f.write("-- 自动生成的商品数据\n")
        f.write(f"-- 来源: {args.sql_file}\n")
        f.write(f"-- 关键词: {args.keyword or '无'}\n")
        f.write(f"-- 数量: {len(sql_statements)}\n")
        f.write("-" * 50 + "\n\n")

        for sql in sql_statements:
            f.write(sql + "\n\n")

    print(f"\n{'='*50}")
    print(f"完成！生成了 {len(sql_statements)} 条SQL语句")
    print(f"输出文件: {args.output}")


if __name__ == '__main__':
    main()
