from dataclasses import dataclass, field, asdict
from typing import List, Optional


@dataclass
class Product:
    platform: str
    title: str
    price: float
    original_price: Optional[float] = None
    sales: int = 0
    shop_name: str = ""
    shop_rating: float = 0.0
    url: str = ""
    image_url: str = ""
    sku: str = ""
    tags: List[str] = field(default_factory=list)
    price_per_unit: Optional[float] = None

    def to_dict(self):
        return asdict(self)


@dataclass
class SearchResult:
    keyword: str
    products: List[Product]
    total_count: int = 0
    source_platforms: List[str] = field(default_factory=list)

    def to_dict(self):
        return {
            "keyword": self.keyword,
            "products": [p.to_dict() for p in self.products],
            "total_count": self.total_count,
            "source_platforms": self.source_platforms,
        }
