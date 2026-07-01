from typing import List, Dict, Any
from collections import defaultdict

from ..models import Product
from ..analyzer.comparator import ComparisonReport


PLATFORM_COLORS = {
    "jd": "#E2231A",
    "taobao": "#FF5000",
    "pdd": "#E02E24",
    "mock": "#6C5CE7",
}

PLATFORM_NAMES = {
    "jd": "京东",
    "taobao": "淘宝",
    "pdd": "拼多多",
    "mock": "模拟",
}


def generate_price_chart_config(products: List[Product], report: ComparisonReport = None) -> Dict[str, Any]:
    if not products:
        return {"type": "bar", "data": {"labels": [], "datasets": []}, "options": {}}

    sorted_products = sorted(products, key=lambda x: x.price)
    top_n = min(len(sorted_products), 30)
    top_products = sorted_products[:top_n]

    labels = [_short_title(p.title, 20) for p in top_products]
    prices = [p.price for p in top_products]
    colors = [PLATFORM_COLORS.get(p.platform, "#666") for p in top_products]

    datasets = [{
        "label": "价格 (元)",
        "data": prices,
        "backgroundColor": colors,
        "borderColor": colors,
        "borderWidth": 1,
        "borderRadius": 4,
    }]

    return {
        "type": "bar",
        "data": {"labels": labels, "datasets": datasets},
        "options": {
            "indexAxis": "y",
            "responsive": True,
            "maintainAspectRatio": False,
            "plugins": {
                "legend": {"display": False},
                "title": {"display": True, "text": "商品价格对比（最低价前30名）"},
                "tooltip": {
                    "callbacks": {
                        "label": f"function(ctx) {{ return '¥' + ctx.raw.toFixed(2); }}",
                    }
                }
            },
            "scales": {
                "x": {"beginAtZero": True, "title": {"display": True, "text": "价格 (元)"}},
                "y": {"title": {"display": False}},
            }
        }
    }


def generate_platform_chart_config(report: ComparisonReport) -> Dict[str, Any]:
    if not report or not report.platform_stats:
        return {"type": "doughnut", "data": {"labels": [], "datasets": []}, "options": {}}

    labels = []
    avg_prices = []
    counts = []
    colors = []

    for plat, stats in report.platform_stats.items():
        labels.append(PLATFORM_NAMES.get(plat, plat))
        avg_prices.append(stats.avg_price)
        counts.append(stats.count)
        colors.append(PLATFORM_COLORS.get(plat, "#666"))

    return {
        "price_comparison": {
            "type": "bar",
            "data": {
                "labels": labels,
                "datasets": [
                    {
                        "label": "平均价格 (元)",
                        "data": avg_prices,
                        "backgroundColor": colors,
                        "borderColor": colors,
                        "borderWidth": 1,
                        "borderRadius": 6,
                    }
                ]
            },
            "options": {
                "responsive": True,
                "plugins": {
                    "legend": {"display": False},
                    "title": {"display": True, "text": "各平台平均价格对比"},
                },
                "scales": {
                    "y": {"beginAtZero": True, "title": {"display": True, "text": "平均价格 (元)"}},
                }
            }
        },
        "count_distribution": {
            "type": "doughnut",
            "data": {
                "labels": labels,
                "datasets": [
                    {
                        "data": counts,
                        "backgroundColor": colors,
                        "borderWidth": 2,
                        "borderColor": "#fff",
                    }
                ]
            },
            "options": {
                "responsive": True,
                "plugins": {
                    "title": {"display": True, "text": "各平台商品数量分布"},
                    "legend": {"position": "bottom"},
                }
            }
        },
    }


def generate_boxplot_data(report: ComparisonReport) -> Dict[str, Any]:
    if not report or not report.platform_stats:
        return {}

    platform_data = {}
    products_by_platform = defaultdict(list)
    for p in report.sorted_by_price:
        products_by_platform[p.platform].append(p.price)

    for plat, prices in products_by_platform.items():
        prices.sort()
        n = len(prices)
        if n == 0:
            continue

        def percentile(p):
            k = (n - 1) * p
            f = int(k)
            c = min(f + 1, n - 1)
            return prices[f] + (k - f) * (prices[c] - prices[f])

        platform_data[PLATFORM_NAMES.get(plat, plat)] = {
            "min": prices[0],
            "q1": round(percentile(0.25), 2),
            "median": round(percentile(0.5), 2),
            "q3": round(percentile(0.75), 2),
            "max": prices[-1],
            "color": PLATFORM_COLORS.get(plat, "#666"),
        }

    return platform_data


def _short_title(title: str, max_len: int = 20) -> str:
    if len(title) <= max_len:
        return title
    return title[:max_len] + "..."
