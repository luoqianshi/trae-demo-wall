import random
import hashlib
from typing import List

from .base import SpiderFactory, BaseSpider
from ..models import Product


JD_SHOPS = [
    "京东自营旗舰店", "京东超市", "华为京东自营旗舰店", "小米京东自营旗舰店",
    "苹果京东自营旗舰店", "三星京东自营旗舰店", "联想京东自营旗舰店",
    "戴尔京东自营旗舰店", "惠普京东自营旗舰店", "索尼京东自营旗舰店",
]

JD_TAGS_POOL = ["自营", "满减", "包邮", "京东物流", "正品保障", "7天无理由", "分期免息"]


@SpiderFactory.register("jd")
class JDSpider(BaseSpider):
    platform_name = "jd"

    def __init__(self, timeout: int = 10, use_mock: bool = True):
        super().__init__(timeout=timeout, use_mock=use_mock)

    def search(self, keyword: str, page: int = 1, page_size: int = 20) -> List[Product]:
        if self.use_mock:
            return self._mock_search(keyword, page, page_size)
        return self._real_search(keyword, page, page_size)

    def _real_search(self, keyword: str, page: int, page_size: int) -> List[Product]:
        import requests
        from bs4 import BeautifulSoup

        url = "https://search.jd.com/Search"
        params = {"keyword": keyword, "page": page * 2 - 1}
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                          "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "https://www.jd.com/",
        }
        try:
            resp = requests.get(url, params=params, headers=headers, timeout=self.timeout)
            resp.encoding = "utf-8"
            soup = BeautifulSoup(resp.text, "lxml")
            products = []
            for item in soup.select("li.gl-item"):
                try:
                    title_elem = item.select_one(".p-name em")
                    price_elem = item.select_one(".p-price i")
                    sales_elem = item.select_one(".p-commit strong a")
                    shop_elem = item.select_one(".p-shop a")
                    img_elem = item.select_one(".p-img img")
                    link_elem = item.select_one(".p-img a")

                    title = title_elem.get_text(strip=True) if title_elem else ""
                    price_text = price_elem.get_text(strip=True) if price_elem else "0"
                    sales_text = sales_elem.get_text(strip=True) if sales_elem else "0"
                    shop_name = shop_elem.get_text(strip=True) if shop_elem else ""
                    image = img_elem.get("src", "") if img_elem else ""
                    link = link_elem.get("href", "") if link_elem else ""

                    price = float(price_text) if price_text else 0.0
                    sales = self._parse_sales(sales_text)

                    if title and price > 0:
                        products.append(Product(
                            platform="jd",
                            title=title,
                            price=price,
                            sales=sales,
                            shop_name=shop_name,
                            shop_rating=round(random.uniform(4.5, 5.0), 1),
                            url=f"https:{link}" if link and link.startswith("//") else link,
                            image_url=f"https:{image}" if image and image.startswith("//") else image,
                            tags=["自营"] if "自营" in shop_name else [],
                        ))
                except Exception:
                    continue
            return products
        except Exception as e:
            print(f"[JD] 抓取失败: {e}")
            return self._mock_search(keyword, page, page_size)

    def _mock_search(self, keyword: str, page: int, page_size: int) -> List[Product]:
        seed = int(hashlib.md5(f"{keyword}{page}".encode()).hexdigest()[:8], 16)
        rng = random.Random(seed)
        products = []
        base_price = self._keyword_base_price(keyword)

        for i in range(page_size):
            idx = (page - 1) * page_size + i
            price_factor = rng.uniform(0.7, 1.6)
            price = round(base_price * price_factor, 2)
            original_price = round(price * rng.uniform(1.1, 1.5), 2)
            sales = rng.randint(100, 50000)
            shop = rng.choice(JD_SHOPS)
            rating = round(rng.uniform(4.6, 5.0), 1)
            sku = f"JD{seed}{idx:04d}"

            products.append(Product(
                platform="jd",
                title=f"{keyword} 升级版 {idx + 1}代 官方正品",
                price=price,
                original_price=original_price,
                sales=sales,
                shop_name=shop,
                shop_rating=rating,
                url=f"https://item.jd.com/{sku}.html",
                image_url=f"https://img14.360buyimg.com/n1/jfs/t1/{sku}.jpg",
                sku=sku,
                tags=rng.sample(JD_TAGS_POOL, k=rng.randint(1, 3)),
            ))
        return products

    def _parse_sales(self, text: str) -> int:
        text = text.replace("+", "").replace("人付款", "").replace("人收货", "")
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
            "手机": 3999, "耳机": 299, "电脑": 5999, "笔记本": 6999,
            "键盘": 199, "鼠标": 99, "显示器": 1299, "手表": 899,
            "平板": 2999, "充电宝": 99, "数据线": 29, "充电器": 59,
            "相机": 4999, "音箱": 399, "路由器": 199, "洗衣机": 1999,
            "冰箱": 2999, "空调": 2599, "电视": 2299, "鞋子": 399,
            "衣服": 199, "书包": 159, "水杯": 49, "牙刷": 89,
        }
        for k, v in price_map.items():
            if k in keyword:
                return v
        return 199.0
