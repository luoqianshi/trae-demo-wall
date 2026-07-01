from dataclasses import dataclass, field
from typing import List, Dict, Tuple
from collections import defaultdict
import statistics

from ..models import Product


@dataclass
class PlatformStats:
    platform: str
    count: int = 0
    min_price: float = 0.0
    max_price: float = 0.0
    avg_price: float = 0.0
    median_price: float = 0.0
    avg_rating: float = 0.0
    total_sales: int = 0


@dataclass
class ComparisonReport:
    keyword: str
    total_products: int
    platforms: List[str]
    platform_stats: Dict[str, PlatformStats] = field(default_factory=dict)
    cheapest: Product = None
    most_sold: Product = None
    highest_rated_shop: Product = None
    best_value: Product = None
    price_quartiles: Tuple[float, float, float, float, float] = (0, 0, 0, 0, 0)
    sorted_by_price: List[Product] = field(default_factory=list)

    def to_dict(self):
        return {
            "keyword": self.keyword,
            "total_products": self.total_products,
            "platforms": self.platforms,
            "platform_stats": {k: v.__dict__ for k, v in self.platform_stats.items()},
            "cheapest": self.cheapest.to_dict() if self.cheapest else None,
            "most_sold": self.most_sold.to_dict() if self.most_sold else None,
            "highest_rated_shop": self.highest_rated_shop.to_dict() if self.highest_rated_shop else None,
            "best_value": self.best_value.to_dict() if self.best_value else None,
            "price_quartiles": list(self.price_quartiles),
            "sorted_by_price": [p.to_dict() for p in self.sorted_by_price],
        }


def compare_products(products: List[Product], keyword: str = "") -> ComparisonReport:
    if not products:
        return ComparisonReport(keyword=keyword, total_products=0, platforms=[])

    sorted_by_price = sorted(products, key=lambda x: x.price)
    prices = [p.price for p in sorted_by_price]

    platform_map: Dict[str, List[Product]] = defaultdict(list)
    for p in products:
        platform_map[p.platform].append(p)

    platform_stats = {}
    for plat, plist in platform_map.items():
        pprices = [p.price for p in plist]
        pratings = [p.shop_rating for p in plist if p.shop_rating > 0]
        platform_stats[plat] = PlatformStats(
            platform=plat,
            count=len(plist),
            min_price=min(pprices),
            max_price=max(pprices),
            avg_price=round(statistics.mean(pprices), 2),
            median_price=round(statistics.median(pprices), 2),
            avg_rating=round(statistics.mean(pratings), 2) if pratings else 0.0,
            total_sales=sum(p.sales for p in plist),
        )

    cheapest = min(products, key=lambda x: x.price)
    most_sold = max(products, key=lambda x: x.sales)
    highest_rated = max(products, key=lambda x: x.shop_rating)

    quartiles = _calc_quartiles(prices)

    report = ComparisonReport(
        keyword=keyword,
        total_products=len(products),
        platforms=list(platform_map.keys()),
        platform_stats=platform_stats,
        cheapest=cheapest,
        most_sold=most_sold,
        highest_rated_shop=highest_rated,
        price_quartiles=quartiles,
        sorted_by_price=sorted_by_price,
    )

    report.best_value = _find_best_value(products, report)
    return report


def _calc_quartiles(prices: List[float]) -> Tuple[float, float, float, float, float]:
    sorted_prices = sorted(prices)
    n = len(sorted_prices)
    if n == 0:
        return (0, 0, 0, 0, 0)
    if n == 1:
        v = sorted_prices[0]
        return (v, v, v, v, v)

    def percentile(data, p):
        k = (len(data) - 1) * p
        f = int(k)
        c = f + 1 if f + 1 < len(data) else f
        return data[f] + (k - f) * (data[c] - data[f])

    q1 = round(percentile(sorted_prices, 0.25), 2)
    q2 = round(percentile(sorted_prices, 0.5), 2)
    q3 = round(percentile(sorted_prices, 0.75), 2)
    return (sorted_prices[0], q1, q2, q3, sorted_prices[-1])


def _find_best_value(products: List[Product], report: ComparisonReport) -> Product:
    max_sales = max(p.sales for p in products) or 1
    max_rating = max(p.shop_rating for p in products) or 5.0
    price_range = report.price_quartiles[4] - report.price_quartiles[0]
    if price_range == 0:
        price_range = 1

    best = None
    best_score = -1
    for p in products:
        price_score = 1 - (p.price - report.price_quartiles[0]) / price_range
        sales_score = p.sales / max_sales
        rating_score = p.shop_rating / max_rating if max_rating > 0 else 0
        score = price_score * 0.4 + sales_score * 0.3 + rating_score * 0.3
        if score > best_score:
            best_score = score
            best = p
    return best
