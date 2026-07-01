from abc import ABC, abstractmethod
from typing import List

from ..models import Product


class BaseSpider(ABC):
    platform_name: str = "base"

    def __init__(self, timeout: int = 10, use_mock: bool = False):
        self.timeout = timeout
        self.use_mock = use_mock

    @abstractmethod
    def search(self, keyword: str, page: int = 1, page_size: int = 20) -> List[Product]:
        pass

    def batch_search(self, keyword: str, max_pages: int = 3) -> List[Product]:
        all_products = []
        for page in range(1, max_pages + 1):
            try:
                products = self.search(keyword, page=page)
                if not products:
                    break
                all_products.extend(products)
            except Exception as e:
                print(f"[{self.platform_name}] 第 {page} 页抓取失败: {e}")
                break
        return all_products


class SpiderFactory:
    _spiders = {}

    @classmethod
    def register(cls, name: str):
        def decorator(spider_cls):
            cls._spiders[name] = spider_cls
            return spider_cls
        return decorator

    @classmethod
    def get(cls, name: str, **kwargs) -> BaseSpider:
        if name not in cls._spiders:
            raise ValueError(f"未知平台: {name}，可用平台: {list(cls._spiders.keys())}")
        return cls._spiders[name](**kwargs)

    @classmethod
    def available(cls) -> List[str]:
        return list(cls._spiders.keys())


def get_spider(platform: str, **kwargs) -> BaseSpider:
    return SpiderFactory.get(platform, **kwargs)


def available_platforms() -> List[str]:
    return SpiderFactory.available()
