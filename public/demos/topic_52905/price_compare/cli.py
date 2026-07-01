import argparse
import json
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from price_compare.spiders import get_spider, available_platforms
from price_compare.analyzer.cleaner import clean_and_deduplicate
from price_compare.analyzer.comparator import compare_products
from price_compare.analyzer.recommender import recommend
from price_compare.visualizer.charts import (
    generate_price_chart_config,
    generate_platform_chart_config,
    PLATFORM_NAMES,
)


def main():
    parser = argparse.ArgumentParser(
        description="电商商品价格自动化采集与对比工具",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  python -m price_compare.cli search "无线耳机"
  python -m price_compare.cli search "手机" -p jd taobao --pages 2
  python -m price_compare.cli search "键盘" -o result.json
  python -m price_compare.cli platforms
        """,
    )
    subparsers = parser.add_subparsers(dest="command", help="可用命令")

    search_parser = subparsers.add_parser("search", help="按关键词搜索并对比商品")
    search_parser.add_argument("keyword", help="搜索关键词")
    search_parser.add_argument(
        "-p", "--platforms",
        nargs="+",
        default=["jd", "taobao", "pdd"],
        help=f"要采集的平台，可用: {', '.join(available_platforms())} (默认: jd taobao pdd)",
    )
    search_parser.add_argument("--pages", type=int, default=2, help="每个平台采集页数 (默认: 2)")
    search_parser.add_argument("--page-size", type=int, default=20, help="每页商品数 (默认: 20)")
    search_parser.add_argument("--use-mock", action="store_true", default=True, help="使用模拟数据 (默认开启)")
    search_parser.add_argument("--real", action="store_true", help="使用真实爬虫 (需注意反爬限制)")
    search_parser.add_argument("-o", "--output", help="输出 JSON 结果到文件")
    search_parser.add_argument("--no-chart", action="store_true", help="不输出图表配置")
    search_parser.add_argument("--top", type=int, default=10, help="显示前 N 个商品 (默认: 10)")

    subparsers.add_parser("platforms", help="列出所有支持的平台")

    args = parser.parse_args()

    if args.command == "platforms":
        print("支持的平台:")
        for p in available_platforms():
            print(f"  - {p} ({PLATFORM_NAMES.get(p, p)})")
        return

    if args.command == "search":
        use_mock = not args.real
        run_search(args.keyword, args.platforms, args.pages, args.page_size,
                   use_mock, args.output, args.no_chart, args.top)
    else:
        parser.print_help()


def run_search(keyword, platforms, pages, page_size, use_mock, output, no_chart, top_n):
    print(f"\n{'='*60}")
    print(f"  电商价格对比工具 - 搜索: {keyword}")
    print(f"  平台: {', '.join(platforms)} | 页数: {pages} | 模拟数据: {'是' if use_mock else '否'}")
    print(f"{'='*60}\n")

    all_products = []
    for plat in platforms:
        print(f"[{PLATFORM_NAMES.get(plat, plat)}] 正在采集...", end=" ", flush=True)
        try:
            spider = get_spider(plat, use_mock=use_mock)
            products = spider.batch_search(keyword, max_pages=pages)
            print(f"获取 {len(products)} 个商品")
            all_products.extend(products)
        except Exception as e:
            print(f"失败: {e}")

    print(f"\n共采集 {len(all_products)} 个商品，正在清洗去重...", end=" ", flush=True)
    cleaned = clean_and_deduplicate(all_products)
    print(f"剩余 {len(cleaned)} 个")

    print("正在分析对比...", end=" ", flush=True)
    report = compare_products(cleaned, keyword=keyword)
    rec = recommend(cleaned, report)
    print("完成\n")

    print_report(report, rec, top_n)

    chart_config = None
    if not no_chart:
        chart_config = {
            "price_chart": generate_price_chart_config(cleaned, report),
            "platform_charts": generate_platform_chart_config(report),
        }

    if output:
        result = {
            "keyword": keyword,
            "report": report.to_dict(),
            "recommendation": rec.to_dict(),
            "chart_config": chart_config,
        }
        with open(output, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        print(f"\n结果已保存到: {output}")

    return report, rec, chart_config


def print_report(report, rec, top_n):
    print("━" * 60)
    print("  📊 价格对比报告")
    print("━" * 60)
    print(f"  关键词: {report.keyword}")
    print(f"  商品总数: {report.total_products}")
    print(f"  价格区间: ¥{report.price_quartiles[0]:.2f} ~ ¥{report.price_quartiles[4]:.2f}")
    print(f"  价格中位数: ¥{report.price_quartiles[2]:.2f}")
    print()

    print("  🏪 各平台统计:")
    for plat, stats in report.platform_stats.items():
        name = PLATFORM_NAMES.get(plat, plat)
        print(f"    {name}: {stats.count} 款 | 均价 ¥{stats.avg_price:.2f} | "
              f"最低 ¥{stats.min_price:.2f} | 最高 ¥{stats.max_price:.2f} | "
              f"评分 {stats.avg_rating}")
    print()

    print("  🏆 推荐榜:")
    if rec.cheapest:
        print(f"    💰 最低价:     ¥{rec.cheapest.price:.2f} - {rec.cheapest.title[:30]}... ({PLATFORM_NAMES.get(rec.cheapest.platform, rec.cheapest.platform)})")
    else:
        print(f"    💰 最低价:     暂无数据")
    if rec.best_value:
        print(f"    ⭐ 性价比首选: ¥{rec.best_value.price:.2f} - {rec.best_value.title[:30]}... ({PLATFORM_NAMES.get(rec.best_value.platform, rec.best_value.platform)})")
    else:
        print(f"    ⭐ 性价比首选: 暂无数据")
    if rec.popular:
        print(f"    🔥 销量冠军:   {rec.popular.sales} 件 - {rec.popular.title[:30]}... ({PLATFORM_NAMES.get(rec.popular.platform, rec.popular.platform)})")
    else:
        print(f"    🔥 销量冠军:   暂无数据")
    if rec.premium:
        print(f"    💎 高端之选:   ¥{rec.premium.price:.2f} - {rec.premium.title[:30]}... ({PLATFORM_NAMES.get(rec.premium.platform, rec.premium.platform)})")
    else:
        print(f"    💎 高端之选:   暂无数据")
    print()

    print(f"  📋 价格最低 TOP {top_n}:")
    print(f"    {'排名':<4} {'价格':<10} {'平台':<6} {'销量':<10} {'评分':<6} {'商品名称'}")
    print(f"    {'-'*4} {'-'*10} {'-'*6} {'-'*10} {'-'*6} {'-'*30}")
    for i, p in enumerate(report.sorted_by_price[:top_n], 1):
        plat_name = PLATFORM_NAMES.get(p.platform, p.platform)
        title_short = p.title[:30] + "..." if len(p.title) > 30 else p.title
        print(f"    {i:<4} ¥{p.price:<8.2f} {plat_name:<6} {p.sales:<10} {p.shop_rating:<6} {title_short}")
    print()

    print("  💡 总结:")
    print(f"    {rec.summary}")
    print("━" * 60)


if __name__ == "__main__":
    main()
