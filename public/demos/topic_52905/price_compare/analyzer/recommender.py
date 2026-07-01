from dataclasses import dataclass, field
from typing import List, Tuple

from ..models import Product
from .comparator import ComparisonReport


@dataclass
class RecommendationResult:
    best_value: Product
    cheapest: Product
    premium: Product
    popular: Product
    alternatives: List[Product] = field(default_factory=list)
    summary: str = ""

    def to_dict(self):
        return {
            "best_value": self.best_value.to_dict() if self.best_value else None,
            "cheapest": self.cheapest.to_dict() if self.cheapest else None,
            "premium": self.premium.to_dict() if self.premium else None,
            "popular": self.popular.to_dict() if self.popular else None,
            "alternatives": [p.to_dict() for p in self.alternatives],
            "summary": self.summary,
        }


def recommend(products: List[Product], report: ComparisonReport = None) -> RecommendationResult:
    from .comparator import compare_products

    if not products:
        return RecommendationResult(
            best_value=None, cheapest=None, premium=None, popular=None,
            summary="暂无商品数据",
        )

    if report is None:
        report = compare_products(products)

    sorted_by_price = sorted(products, key=lambda x: x.price)
    cheapest = sorted_by_price[0]
    popular = max(products, key=lambda x: x.sales)

    mid_price = report.price_quartiles[2]
    upper_quartile = report.price_quartiles[3]

    premium_candidates = [p for p in sorted_by_price if p.price >= upper_quartile]
    premium = max(premium_candidates, key=lambda x: (x.shop_rating, x.sales)) if premium_candidates else sorted_by_price[-1]

    best_value = report.best_value if report.best_value else _calc_best_value(products, report)

    alternatives = []
    seen_platforms = set()
    for p in sorted_by_price:
        if p is best_value or p is cheapest or p is premium or p is popular:
            continue
        if p.platform in seen_platforms:
            continue
        seen_platforms.add(p.platform)
        if abs(p.price - mid_price) / max(mid_price, 0.01) < 0.3:
            alternatives.append(p)
        if len(alternatives) >= 3:
            break

    summary = _generate_summary(cheapest, best_value, premium, popular, report)

    return RecommendationResult(
        best_value=best_value,
        cheapest=cheapest,
        premium=premium,
        popular=popular,
        alternatives=alternatives,
        summary=summary,
    )


def _calc_best_value(products: List[Product], report: ComparisonReport) -> Product:
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
        rating_score = p.shop_rating / max_rating
        score = price_score * 0.4 + sales_score * 0.3 + rating_score * 0.3
        if score > best_score:
            best_score = score
            best = p
    return best


def _generate_summary(cheapest, best_value, premium, popular, report) -> str:
    parts = []
    parts.append(f"共找到 {report.total_products} 款商品，来自 {len(report.platforms)} 个平台。")
    if cheapest:
        parts.append(f"最低价 ¥{cheapest.price:.2f}（{cheapest.shop_name}）。")
    if best_value:
        parts.append(f"性价比首选 ¥{best_value.price:.2f}（{best_value.shop_name}，评分 {best_value.shop_rating}）。")
    if premium and premium is not best_value:
        parts.append(f"高端之选 ¥{premium.price:.2f}（{premium.shop_name}）。")
    if popular and popular is not best_value and popular is not cheapest:
        parts.append(f"销量冠军 {popular.sales} 件（{popular.shop_name}）。")
    return " ".join(parts)
