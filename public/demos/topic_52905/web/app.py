import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import Flask, render_template, request, jsonify

from price_compare.spiders import get_spider, available_platforms
from price_compare.analyzer.cleaner import clean_and_deduplicate
from price_compare.analyzer.comparator import compare_products
from price_compare.analyzer.recommender import recommend
from price_compare.visualizer.charts import (
    generate_price_chart_config,
    generate_platform_chart_config,
    generate_boxplot_data,
    PLATFORM_NAMES,
)

app = Flask(__name__, template_folder="templates", static_folder="static")


@app.route("/")
def index():
    return render_template("index.html", platforms=available_platforms(),
                           platform_names=PLATFORM_NAMES)


@app.route("/api/search", methods=["POST"])
def api_search():
    data = request.get_json() or {}
    keyword = data.get("keyword", "").strip()
    platforms = data.get("platforms", ["jd", "taobao", "pdd"])
    pages = int(data.get("pages", 2))
    use_mock = data.get("use_mock", True)

    if not keyword:
        return jsonify({"error": "关键词不能为空"}), 400

    all_products = []
    errors = []
    for plat in platforms:
        try:
            spider = get_spider(plat, use_mock=use_mock)
            products = spider.batch_search(keyword, max_pages=pages)
            all_products.extend(products)
        except Exception as e:
            errors.append(f"{PLATFORM_NAMES.get(plat, plat)}: {str(e)}")

    cleaned = clean_and_deduplicate(all_products)
    report = compare_products(cleaned, keyword=keyword)
    rec = recommend(cleaned, report)

    price_chart = generate_price_chart_config(cleaned, report)
    platform_charts = generate_platform_chart_config(report)
    boxplot_data = generate_boxplot_data(report)

    return jsonify({
        "keyword": keyword,
        "total_raw": len(all_products),
        "total_cleaned": len(cleaned),
        "report": report.to_dict(),
        "recommendation": rec.to_dict(),
        "charts": {
            "price_bar": price_chart,
            "platform_price": platform_charts.get("price_comparison", {}),
            "platform_count": platform_charts.get("count_distribution", {}),
            "boxplot": boxplot_data,
        },
        "errors": errors,
    })


@app.route("/api/platforms")
def api_platforms():
    return jsonify({
        "platforms": available_platforms(),
        "names": PLATFORM_NAMES,
    })


def run_demo():
    print("启动电商价格对比演示网页...")
    print("访问 http://127.0.0.1:5000 查看演示")
    print("按 Ctrl+C 停止")
    print()
    app.run(debug=True, host="0.0.0.0", port=5000)


if __name__ == "__main__":
    run_demo()
