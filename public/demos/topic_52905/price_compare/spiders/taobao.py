import random
import hashlib
from typing import List

from .base import SpiderFactory, BaseSpider
from ..models import Product


TAOBAO_SHOPS = [
    "天猫超市", "天猫官方旗舰店", "品牌直营旗舰店", "淘宝心选",
    "小米官方旗舰店", "华为官方旗舰店", "苹果官方旗舰店",
    "苏宁易购官方旗舰店", "网易严选旗舰店", "良品铺子旗舰店",
]

TAOBAO_TAGS_POOL = ["天猫", "包邮", "7天无理由", "运费险", "正品保证", "极速退款", "花呗分期"]


@SpiderFactory.register("taobao")
class TaobaoSpider(BaseSpider):
    platform_name = "taobao"

    def __init__(self, timeout: int = 10, use_mock: bool = True):
        super().__init__(timeout=timeout, use_mock=use_mock)

    def search(self, keyword: str, page: int = 1, page_size: int = 20) -> List[Product]:
        if self.use_mock:
            return self._mock_search(keyword, page, page_size)
        return self._real_search(keyword, page, page_size)

    def _real_search(self, keyword: str, page: int, page_size: int) -> List[Product]:
        import requests
        from bs4 import BeautifulSoup

        url = "https://s.taobao.com/search"
        params = {"q": keyword, "s": (page - 1) * 44}
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                          "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Cookie": "thw=cn; v=0; t=abc123def456ghi789jkl012mno345pqr",
        }
        try:
            resp = requests.get(url, params=params, headers=headers, timeout=self.timeout)
            resp.encoding = "utf-8"
            soup = BeautifulSoup(resp.text, "lxml")
            products = []

            for item in soup.select(".items .item"):
                try:
                    title_elem = item.select_one(".title")
                    price_elem = item.select_one(".price strong")
                    sales_elem = item.select_one(".deal-cnt")
                    shop_elem = item.select_one(".shop")
                    img_elem = item.select_one(".pic img")
                    link_elem = item.select_one(".pic a")

                    title = title_elem.get_text(strip=True) if title_elem else ""
                    price = float(price_elem.get_text(strip=True)) if price_elem else 0.0
                    sales_text = sales_elem.get_text(strip=True) if sales_elem else "0"
                    shop_name = shop_elem.get_text(strip=True) if shop_elem else ""
                    image = img_elem.get("src", "") if img_elem else ""
                    link = link_elem.get("href", "") if link_elem else ""

                    sales = self._parse_sales(sales_text)

                    if title and price > 0:
                        products.append(Product(
                            platform="taobao",
                            title=title,
                            price=price,
                            sales=sales,
                            shop_name=shop_name,
                            shop_rating=round(random.uniform(4.3, 4.9), 1),
                            url=link if link.startswith("http") else f"https:{link}",
                            image_url=image if image.startswith("http") else f"https:{image}",
                            tags=["天猫"] if "天猫" in shop_name else [],
                        ))
                except Exception:
                    continue
            return products
        except Exception as e:
            print(f"[淘宝] 抓取失败: {e}")
            return self._mock_search(keyword, page, page_size)

    def _mock_search(self, keyword: str, page: int, page_size: int) -> List[Product]:
        seed = int(hashlib.md5(f"tb{keyword}{page}".encode()).hexdigest()[:8], 16)
        rng = random.Random(seed)
        products = []
        base_price = self._keyword_base_price(keyword)

        for i in range(page_size):
            idx = (page - 1) * page_size + i
            price_factor = rng.uniform(0.6, 1.5)
            price = round(base_price * price_factor, 2)
            original_price = round(price * rng.uniform(1.0, 1.4), 2)
            sales = rng.randint(50, 100000)
            shop = rng.choice(TAOBAO_SHOPS)
            rating = round(rng.uniform(4.4, 4.9), 1)
            sku = f"TB{seed}{idx:04d}"

            products.append(Product(
                platform="taobao",
                title=f"【官方直营】{keyword} 全新款 第{idx + 1}代 正品保障",
                price=price,
                original_price=original_price,
                sales=sales,
                shop_name=shop,
                shop_rating=rating,
                url=f"https://item.taobao.com/item.htm?id={sku}",
                image_url=f"https://img.alicdn.com/imgextra/i1/{sku}_0.jpg",
                sku=sku,
                tags=rng.sample(TAOBAO_TAGS_POOL, k=rng.randint(1, 4)),
            ))
        return products

    def _parse_sales(self, text: str) -> int:
        text = text.replace("人收货", "").replace("人付款", "").replace("+", "").strip()
        if "万" in text:
            try:
                return int(float(text.replace("万", "")) * 10000)
            except ValueError:
                return 0
        try:
            return int(text)
        except ValueError:
            return 0

    def _keyword_base_price(self, keyword: str) -> float:
        price_map = {
            "手机": 3599, "耳机": 259, "电脑": 5499, "笔记本": 6299,
            "键盘": 179, "鼠标": 89, "显示器": 1199, "手表": 799,
            "平板": 2799, "充电宝": 89, "数据线": 19, "充电器": 49,
            "相机": 4599, "音箱": 349, "路由器": 179, "洗衣机": 1799,
            "冰箱": 2599, "空调": 2399, "电视": 1999, "鞋子": 349,
            "衣服": 159, "书包": 129, "水杯": 39, "牙刷": 69,
        }
        for k, v in price_map.items():
            if k in keyword:
                return v
        return 179.0
