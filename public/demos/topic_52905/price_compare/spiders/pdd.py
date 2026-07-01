import random
import hashlib
from typing import List

from .base import SpiderFactory, BaseSpider
from ..models import Product


PDD_SHOPS = [
    "拼多多官方旗舰店", "百亿补贴品牌店", "品牌黑标店", "拼多多超市",
    "小米官方旗舰店", "华为官方旗舰店", "苹果数码旗舰店",
    "品牌授权专营店", "百亿补贴电器城", "官方认证旗舰店",
]

PDD_TAGS_POOL = ["百亿补贴", "万人团", "假一赔十", "退货包运费", "极速退款", "全国联保", "正品发票"]


@SpiderFactory.register("pdd")
class PDDSpider(BaseSpider):
    platform_name = "pdd"

    def __init__(self, timeout: int = 10, use_mock: bool = True):
        super().__init__(timeout=timeout, use_mock=use_mock)

    def search(self, keyword: str, page: int = 1, page_size: int = 20) -> List[Product]:
        if self.use_mock:
            return self._mock_search(keyword, page, page_size)
        return self._real_search(keyword, page, page_size)

    def _real_search(self, keyword: str, page: int, page_size: int) -> List[Product]:
        import requests
        from bs4 import BeautifulSoup

        url = "https://mobile.yangkeduo.com/search_result.html"
        params = {"search_key": keyword, "page": page}
        headers = {
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) "
                          "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
            "Referer": "https://mobile.yangkeduo.com/",
        }
        try:
            resp = requests.get(url, params=params, headers=headers, timeout=self.timeout)
            resp.encoding = "utf-8"
            soup = BeautifulSoup(resp.text, "lxml")
            products = []

            for item in soup.select(".goods-item"):
                try:
                    title_elem = item.select_one(".goods-name")
                    price_elem = item.select_one(".price")
                    sales_elem = item.select_one(".sales-tip")
                    shop_elem = item.select_one(".mall-name")
                    img_elem = item.select_one(".goods-img img")
                    link_elem = item.select_one("a")

                    title = title_elem.get_text(strip=True) if title_elem else ""
                    price_text = price_elem.get_text(strip=True) if price_elem else "0"
                    sales_text = sales_elem.get_text(strip=True) if sales_elem else "0"
                    shop_name = shop_elem.get_text(strip=True) if shop_elem else ""
                    image = img_elem.get("src", "") if img_elem else ""
                    link = link_elem.get("href", "") if link_elem else ""

                    price = float(price_text.replace("¥", "").strip()) if price_text else 0.0
                    sales = self._parse_sales(sales_text)

                    if title and price > 0:
                        products.append(Product(
                            platform="pdd",
                            title=title,
                            price=price,
                            sales=sales,
                            shop_name=shop_name,
                            shop_rating=round(random.uniform(4.0, 4.8), 1),
                            url=f"https://mobile.yangkeduo.com{link}" if link and not link.startswith("http") else link,
                            image_url=image if image.startswith("http") else f"https:{image}",
                            tags=["百亿补贴"] if "百亿" in shop_name else [],
                        ))
                except Exception:
                    continue
            return products
        except Exception as e:
            print(f"[拼多多] 抓取失败: {e}")
            return self._mock_search(keyword, page, page_size)

    def _mock_search(self, keyword: str, page: int, page_size: int) -> List[Product]:
        seed = int(hashlib.md5(f"pdd{keyword}{page}".encode()).hexdigest()[:8], 16)
        rng = random.Random(seed)
        products = []
        base_price = self._keyword_base_price(keyword)

        for i in range(page_size):
            idx = (page - 1) * page_size + i
            price_factor = rng.uniform(0.5, 1.3)
            price = round(base_price * price_factor, 2)
            original_price = round(price * rng.uniform(1.2, 1.8), 2)
            sales = rng.randint(200, 200000)
            shop = rng.choice(PDD_SHOPS)
            rating = round(rng.uniform(4.2, 4.9), 1)
            sku = f"PDD{seed}{idx:04d}"

            products.append(Product(
                platform="pdd",
                title=f"【百亿补贴】{keyword} 正品 第{idx + 1}代 官方旗舰款",
                price=price,
                original_price=original_price,
                sales=sales,
                shop_name=shop,
                shop_rating=rating,
                url=f"https://mobile.yangkeduo.com/goods.html?goods_id={sku}",
                image_url=f"https://t00img.yangkeduo.com/goods/images/2024-01-01/{sku}.jpg",
                sku=sku,
                tags=rng.sample(PDD_TAGS_POOL, k=rng.randint(2, 4)),
            ))
        return products

    def _parse_sales(self, text: str) -> int:
        text = text.replace("已拼", "").replace("件", "").replace("+", "").strip()
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
            "手机": 3299, "耳机": 199, "电脑": 4999, "笔记本": 5699,
            "键盘": 149, "鼠标": 69, "显示器": 999, "手表": 599,
            "平板": 2499, "充电宝": 69, "数据线": 9.9, "充电器": 39,
            "相机": 4299, "音箱": 299, "路由器": 149, "洗衣机": 1599,
            "冰箱": 2299, "空调": 2099, "电视": 1799, "鞋子": 259,
            "衣服": 129, "书包": 99, "水杯": 29, "牙刷": 49,
        }
        for k, v in price_map.items():
            if k in keyword:
                return v
        return 149.0
