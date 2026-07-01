from .models import Product, SearchResult
from .spiders import get_spider, available_platforms
from .analyzer.cleaner import clean_and_deduplicate
from .analyzer.comparator import compare_products
from .analyzer.recommender import recommend
from .visualizer.charts import generate_price_chart_config

__version__ = "1.0.0"
__all__ = [
    "Product",
    "SearchResult",
    "get_spider",
    "available_platforms",
    "clean_and_deduplicate",
    "compare_products",
    "recommend",
    "generate_price_chart_config",
]
