import re
from difflib import SequenceMatcher
from typing import List, Tuple

from ..models import Product


def clean_and_deduplicate(products: List[Product], similarity_threshold: float = 0.85) -> List[Product]:
    cleaned = []
    seen = set()
    deduped = []

    for p in products:
        if p.price <= 0 or not p.title.strip():
            continue

        clean_title = _normalize_title(p.title)
        key = (p.platform, clean_title[:30], round(p.price, -1))
        if key in seen:
            continue
        seen.add(key)

        cleaned_p = Product(
            platform=p.platform,
            title=clean_title,
            price=round(p.price, 2),
            original_price=round(p.original_price, 2) if p.original_price else None,
            sales=p.sales if p.sales >= 0 else 0,
            shop_name=p.shop_name.strip(),
            shop_rating=round(p.shop_rating, 1) if p.shop_rating else 0.0,
            url=p.url,
            image_url=p.image_url,
            sku=p.sku,
            tags=list(set(p.tags)) if p.tags else [],
            price_per_unit=p.price_per_unit,
        )
        cleaned.append(cleaned_p)

    cleaned.sort(key=lambda x: x.price)

    skip = set()
    for i, p1 in enumerate(cleaned):
        if i in skip:
            continue
        group = [p1]
        for j in range(i + 1, len(cleaned)):
            if j in skip:
                continue
            p2 = cleaned[j]
            if p1.platform != p2.platform:
                continue
            sim = _title_similarity(p1.title, p2.title)
            if sim >= similarity_threshold and abs(p1.price - p2.price) / max(p1.price, 0.01) < 0.05:
                skip.add(j)
                group.append(p2)
        best = max(group, key=lambda x: (x.sales, x.shop_rating))
        deduped.append(best)

    deduped.sort(key=lambda x: x.price)
    return deduped


def _normalize_title(title: str) -> str:
    title = re.sub(r'[【\[].*?[】\]]', '', title)
    title = re.sub(r'[^\w\u4e00-\u9fa5\s]', ' ', title)
    title = re.sub(r'\s+', ' ', title)
    return title.strip()


def _title_similarity(t1: str, t2: str) -> float:
    return SequenceMatcher(None, t1, t2).ratio()


def price_range(products: List[Product]) -> Tuple[float, float]:
    if not products:
        return (0.0, 0.0)
    prices = [p.price for p in products]
    return (min(prices), max(prices))
