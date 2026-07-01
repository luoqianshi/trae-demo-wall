from .base import SpiderFactory, BaseSpider
from ..models import Product
from typing import List


@SpiderFactory.register("mock")
class MockSpider(BaseSpider):
    platform_name = "mock"

    def __init__(self, timeout: int = 10, use_mock: bool = True):
        super().__init__(timeout=timeout, use_mock=use_mock)

    def search(self, keyword: str, page: int = 1, page_size: int = 20) -> List[Product]:
        from .jd import JDSpider
        from .taobao import TaobaoSpider
        from .pdd import PDDSpider

        all_products = []
        for spider_cls in [JDSpider, TaobaoSpider, PDDSpider]:
            spider = spider_cls(use_mock=True)
            all_products.extend(spider.search(keyword, page=page, page_size=page_size // 3 + 1))
        return all_products[:page_size]
