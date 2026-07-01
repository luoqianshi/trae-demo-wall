from .base import SpiderFactory, get_spider, available_platforms, BaseSpider
from . import jd, taobao, pdd, mock  # noqa: F401

__all__ = ["SpiderFactory", "get_spider", "available_platforms", "BaseSpider"]
