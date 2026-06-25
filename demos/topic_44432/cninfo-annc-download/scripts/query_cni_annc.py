import argparse
import json
import re
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, List, Dict, Optional

import requests


__version__ = "1.0.5"

CNINFO_QUERY_URL = "https://www.cninfo.com.cn/new/hisAnnouncement/query"
CNINFO_STATIC_URL = "https://static.cninfo.com.cn/"

DEFAULT_FORM_DATA = {
    "pageNum": "1",
    "pageSize": "30",
    "column": "szse",
    "tabName": "fulltext",
    "plate": "sz;szmb;szcy;sh;shmb;shkcp;bj",
    "stock": "",
    "searchkey": "",
    "secid": "",
    "category": "",
    "trade": "",
    "seDate": "",
    "sortName": "",
    "sortType": "",
    "isHLtitle": "true",
}

# Industry field: empty trade or ALL_TRADES queries all industries
ALL_TRADES = "all"

HEADERS = {
    "Accept": "application/json, text/plain, */*",
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    "Origin": "https://www.cninfo.com.cn",
    "Referer": "https://www.cninfo.com.cn/new/commonUrl/pageOfSearch?url=disclosure/list/search",
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    ),
}

EXCEL_HEADERS = [
    "Sec Code",
    "Sec Name",
    "Announcement Title",
    "Announcement Date",
    "Download URL",
    "Status",
]

EXCLUDE_KEYWORDS = [
    "付息", "派息", "股息","制度"
]

INCLUDE_KEYWORDS = [
    "定增", "配股", "发债", "债券", "融资",
    "增资", "减持", "增持", "质押",
    "高管变动", "董事长", "总经理", "副总",
    "组织架构", "营业部", "子公司",
    "资质", "牌照", "批复",
    "股权变动", "股权转让","发行","回购"
]

TYPE_MAP = {
    "定增": "融资类", "配股": "融资类", "发债": "融资类",
    "债券": "融资类", "融资": "融资类", "增资": "融资类",
    "减持": "股权变动", "增持": "股权变动", "质押": "股权变动",
    "股权变动": "股权变动", "股权转让": "股权变动","发行":"发行","回购":"回购",
    "高管变动": "高管变动", "董事长": "高管变动",
    "总经理": "高管变动", "副总": "高管变动",
    "组织架构": "组织架构", "营业部": "组织架构",
    "子公司": "组织架构",
    "资质": "资质获批", "牌照": "资质获批", "批复": "资质获批"
}

# Categories loaded dynamically from categories.json
DEFAULT_CATEGORIES_FILE = Path(__file__).parent.parent / "categories.json"

_CATEGORY_NAME_TO_CODE: Dict[str, str] = {}
_CATEGORY_CODE_TO_NAME: Dict[str, str] = {}
_ALL_CATEGORIES_CODES: List[str] = []


def _init_categories(categories_file: Path | None = None) -> None:
    """Load categories from JSON file and populate module-level lookup tables.

    Safe to call multiple times; subsequent calls reload from the file.
    """
    global _CATEGORY_NAME_TO_CODE, _CATEGORY_CODE_TO_NAME, _ALL_CATEGORIES_CODES

    if categories_file is None:
        categories_file = DEFAULT_CATEGORIES_FILE

    try:
        with open(categories_file, "r", encoding="utf-8") as f:
            data = json.load(f)
        raw: List[Dict[str, str]] = data.get("categories", [])
    except Exception as e:
        print(f"[WARN] Failed to load categories from {categories_file}: {e}", file=sys.stderr)
        _CATEGORY_NAME_TO_CODE = {}
        _CATEGORY_CODE_TO_NAME = {}
        _ALL_CATEGORIES_CODES = []
        return

    _CATEGORY_NAME_TO_CODE = {}
    _CATEGORY_CODE_TO_NAME = {}
    for item in raw:
        name = item.get("category_name", "")
        code = item.get("category_code", "")
        if name and code:
            _CATEGORY_NAME_TO_CODE[name] = code
            _CATEGORY_CODE_TO_NAME[code] = name

    # _ALL_CATEGORIES_CODES = all codes in file order (regardless of query flag)
    _ALL_CATEGORIES_CODES = [
        item["category_code"]
        for item in raw
        if item.get("category_code")
    ]


def get_active_categories(categories_file: Path | None = None) -> tuple[List[str], List[str]]:
    """Return (codes, names) for categories where query == 'Y'.

    codes are joined with ';' for the cninfo API.
    """
    if not _CATEGORY_NAME_TO_CODE:
        _init_categories(categories_file)

    codes, names = [], []
    for item in _load_raw_categories(categories_file):
        if item.get("query", "").strip().upper() == "Y":
            code = item.get("category_code", "")
            name = item.get("category_name", "")
            if code:
                codes.append(code)
            if name:
                names.append(name)
    return codes, names


def _load_raw_categories(categories_file: Path | None = None) -> List[Dict[str, str]]:
    """Load raw category list from JSON (for CLI override logic)."""
    if categories_file is None:
        categories_file = DEFAULT_CATEGORIES_FILE
    try:
        with open(categories_file, "r", encoding="utf-8") as f:
            return json.load(f).get("categories", [])
    except Exception:
        return []


def load_companies(companies_file: Path) -> List[Dict]:
    try:
        with open(companies_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return data.get('companies', [])
    except Exception as e:
        print(f"Failed to load companies list: {e}", file=sys.stderr)
        return []


def is_company_in_list(sec_code: str, companies: List[Dict]) -> bool:
    for company in companies:
        code = company.get('code', '')
        if code and sec_code and (sec_code == code or sec_code == code.replace('.SH', '').replace('.SZ', '')):
            return True
    return False


def clean_html(value: Any) -> str:
    if value is None:
        return ""
    return re.sub(r"<[^>]+>", "", str(value)).strip()


def format_timestamp(value: Any) -> str:
    if value in (None, ""):
        return ""
    try:
        return datetime.fromtimestamp(int(value) / 1000).strftime("%Y-%m-%d %H:%M:%S")
    except (TypeError, ValueError, OSError):
        return str(value)


def build_download_url(adjunct_url: Any) -> str:
    if not adjunct_url:
        return ""
    text = str(adjunct_url).strip()
    if text.startswith(("http://", "https://")):
        return text
    return f"{CNINFO_STATIC_URL}{text.lstrip('/')}"


def get_exclude_reason(title: str) -> str:
    for keyword in EXCLUDE_KEYWORDS:
        if keyword in title:
            if keyword in ["定期报告", "年报", "季报", "半年报"]:
                return "routine periodic report"
            elif keyword in ["独立董事", "监事", "董事"]:
                return "non-key executive change"
            elif keyword in ["风险提示", "更正公告", "补充公告"]:
                return "routine risk notice"
            elif keyword in ["例行会议", "临时股东大会","制度"]:
                return "routine meeting materials or policy update"
            elif keyword in ["跟踪评级", "信用评级"]:
                return "rating report"
            elif keyword in ["付息", "派息", "股息"]:
                return "dividend distribution"
    return ""


def classify_type(title: str) -> str:
    for keyword in INCLUDE_KEYWORDS:
        if keyword in title:
            return TYPE_MAP.get(keyword, "other")
    return "other"


def query_cninfo(
    date_range: str,
    timeout: int,
    trade: str = "",
    category: str = "",
    max_pages: int = 100,
) -> dict[str, Any]:
    page_size = int(DEFAULT_FORM_DATA.get("pageSize", "30"))

    # trade is empty or "all" -> pass empty string so cninfo API ignores it
    trade_value = "" if not trade or trade == ALL_TRADES else trade

    all_announcements = []
    total_record_num = 0
    total_pages = max_pages
    empty_page_count = 0
    max_empty_pages = 3
    max_retries = 3

    with requests.Session() as session:
        # First request to establish session and get required cookies
        try:
            session.get(
                "https://www.cninfo.com.cn/new/commonUrl/pageOfSearch?url=disclosure/list/search",
                headers=HEADERS,
                timeout=timeout,
            )
        except Exception:
            pass

        for page_num in range(1, max_pages + 1):
            # Each page builds its own complete form to avoid state pollution
            page_form = {
                "pageNum": str(page_num),
                "pageSize": str(page_size),
                "column": DEFAULT_FORM_DATA["column"],
                "tabName": DEFAULT_FORM_DATA["tabName"],
                "plate": DEFAULT_FORM_DATA["plate"],
                "stock": "",
                "searchkey": "",
                "secid": "",
                "category": category,
                "trade": trade_value,
                "seDate": date_range,
                "sortName": "",
                "sortType": "",
                "isHLtitle": DEFAULT_FORM_DATA["isHLtitle"],
            }
            
            result = None
            for attempt in range(1, max_retries + 1):
                try:
                    response = session.post(
                        CNINFO_QUERY_URL,
                        headers=HEADERS,
                        data=page_form,
                        timeout=timeout,
                    )
                    response.raise_for_status()
                    result = response.json()
                    break
                except Exception as e:
                    print(f"Page {page_num} attempt {attempt} failed: {e}", file=sys.stderr)
                    if attempt >= max_retries:
                        empty_page_count += 1
                        if empty_page_count >= max_empty_pages:
                            print(f"{max_empty_pages} consecutive page failures, stopping", file=sys.stderr)
                            return {
                                "announcements": all_announcements,
                                "totalAnnouncement": len(all_announcements),
                                "totalRecordNum": total_record_num,
                            }
                    else:
                        time.sleep(0.5 * attempt)
            
            if result is None:
                continue
            
            announcements = result.get("announcements") or []
            page_count = len(announcements)
            
            if page_num == 1:
                total_record_num = result.get("totalRecordNum", 0)
                actual_page_size = page_count if page_count > 0 else page_size
                if actual_page_size > 0:
                    total_pages = (total_record_num // actual_page_size) + (1 if total_record_num % actual_page_size else 0)
                print(f"Total {total_record_num} records, {actual_page_size} per page, est. {total_pages} pages")

            print(f"Page {page_num}: {page_count} records")
            
            if page_count > 0:
                all_announcements.extend(announcements)
                empty_page_count = 0
            else:
                empty_page_count += 1
                print(f"Page {page_num} is empty", file=sys.stderr)
            
            if total_record_num > 0 and len(all_announcements) >= total_record_num:
                print(f"Retrieved all {len(all_announcements)} records, stopping")
                break
            
            if empty_page_count >= max_empty_pages:
                print(f"{max_empty_pages} consecutive empty pages, stopping", file=sys.stderr)
                break
            
            if page_num >= total_pages:
                break
            
            time.sleep(0.3)
        
        return {
            "announcements": all_announcements,
            "totalAnnouncement": len(all_announcements),
            "totalRecordNum": total_record_num
        }


def filter_announcements(
    result: dict[str, Any],
    companies: List[Dict],
    apply_keyword_filter: bool = True,
) -> tuple[List[Dict], List[Dict]]:
    announcements = result.get("announcements") or []
    included = []
    excluded = []

    for item in announcements:
        sec_code = item.get("secCode", "")
        title = clean_html(item.get("announcementTitle", ""))
        announcement_time = format_timestamp(item.get("announcementTime"))
        download_url = build_download_url(item.get("adjunctUrl", ""))
        base_meta = {
            "secCode": sec_code,
            "company": item.get("secName", ""),
            "title": title,
            "announcementTime": announcement_time,
            "downloadUrl": download_url,
        }

        # When companies list is non-empty, filter by it; otherwise do not filter by company
        if companies and not is_company_in_list(sec_code, companies):
            excluded.append({**base_meta, "reason": "not in monitored companies"})
            continue

        if not apply_keyword_filter:
            included.append({
                **base_meta,
                "content": "",
                "type": "",
            })
            continue

        exclude_reason = get_exclude_reason(title)
        if exclude_reason:
            excluded.append({**base_meta, "reason": exclude_reason})
            continue

        matched_keyword = False
        for keyword in INCLUDE_KEYWORDS:
            if keyword in title:
                matched_keyword = True
                break

        included.append({
            **base_meta,
            "content": "",
            "type": classify_type(title) if matched_keyword else "",
        })

    return included, excluded


def write_markdown(
    output_file: Path,
    included: Optional[List[Dict]] = None,
    excluded: Optional[List[Dict]] = None,
) -> int:
    def _escape(value: Any) -> str:
        return str(value or "").replace("|", "\\|").replace("\n", " ").strip()

    def _row(item: Dict, status: str) -> str:
        return "| " + " | ".join([
            _escape(item.get("secCode", "")),
            _escape(item.get("company", "")),
            _escape(item.get("title", "")),
            _escape(item.get("announcementTime", "")),
            _escape(item.get("downloadUrl", "")),
            _escape(status),
        ]) + " |"

    lines = []
    lines.append("| " + " | ".join(EXCEL_HEADERS) + " |")
    lines.append("| " + " | ".join(["---"] * len(EXCEL_HEADERS)) + " |")

    total = 0
    for item in (included or []):
        lines.append(_row(item, "include"))
        total += 1
    for item in (excluded or []):
        lines.append(_row(item, item.get("reason", "")))
        total += 1

    output_file.parent.mkdir(parents=True, exist_ok=True)
    output_file.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return total


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="POST call cninfo announcement query API and export Markdown.",
    )
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        default=None,
        help="Output Markdown path. Default auto-generated from trade and date.",
    )
    parser.add_argument("--timeout", type=int, default=20, help="Request timeout in seconds.")
    parser.add_argument(
        "--date",
        type=str,
        help="Query date range, e.g. 2026-06-12 or 2026-06-01~2026-06-12. "
             "Default: today + tomorrow.",
    )
    parser.add_argument(
        "--companies",
        type=Path,
        default=None,
        help="Companies JSON file. Omit to skip company filter.",
    )
    parser.add_argument(
        "--categories-file",
        type=Path,
        default=None,
        dest="categories_file",
        help="Categories JSON file. Default: categories.json next to the script.",
    )
    parser.add_argument(
        "--trade",
        type=str,
        default="金融业",
        help="Trade filter for cninfo API, e.g. 金融业, 制造业. Default: 金融业.",
    )
    parser.add_argument(
        "--no-keyword-filter",
        action="store_true",
        help="Skip keyword filter, only apply company filter.",
    )
    parser.add_argument(
        "--category",
        type=str,
        default=None,
        help="Override category filter with comma/semicolon-separated Chinese names. "
             "Omit to use the query flags in categories.json.",
    )
    parser.add_argument(
        "--max-pages",
        type=int,
        default=500,
        help="Max pages to paginate, default 500.",
    )
    return parser.parse_args()


def deduplicate_announcements(announcements: List[Dict]) -> List[Dict]:
    seen = set()
    unique = []
    for item in announcements:
        key = (item.get("secCode", ""), item.get("announcementId", ""), item.get("announcementTitle", ""))
        if key not in seen:
            seen.add(key)
            unique.append(item)
    return unique


def main() -> None:
    args = parse_args()

    date_range = args.date
    if not date_range:
        today = datetime.now(timezone(timedelta(hours=8)))
        tomorrow = today + timedelta(days=1)
        date_range = f"{today.strftime('%Y-%m-%d')}~{tomorrow.strftime('%Y-%m-%d')}"

    # Resolve categories file and initialise lookup tables
    categories_file = args.categories_file or DEFAULT_CATEGORIES_FILE
    _init_categories(categories_file)

    # Parse category filter: CLI override > JSON query flags
    category_input = (args.category or "").strip()
    if category_input:
        parts = [p for p in re.split(r"[,，;；\s]+", category_input) if p]
        invalid = [n for n in parts if n not in _CATEGORY_NAME_TO_CODE]
        if invalid:
            print(
                f"[ERROR] Unknown category name(s): {invalid}\n"
                f"Available: {list(_CATEGORY_NAME_TO_CODE.keys())}",
                file=sys.stderr,
            )
            return
        category_codes = [_CATEGORY_NAME_TO_CODE[n] for n in parts]
        category_value = ";".join(category_codes)
        category_label = "、".join(parts)
        print(f"[INFO] Category override: {category_label}")
    else:
        active_codes, active_names = get_active_categories(categories_file)
        if not active_codes:
            print(
                f"[WARN] No categories have query=Y in {categories_file}. "
                f"Nothing to query. Set query=Y for at least one category.",
                file=sys.stderr,
            )
            return
        category_value = ";".join(active_codes)
        category_label = "、" .join(active_names) if active_names else "all"
        print(f"[INFO] Categories from config ({categories_file}): {category_label}")

    result = query_cninfo(
        date_range=date_range,
        timeout=args.timeout,
        trade=args.trade,
        category=category_value,
        max_pages=args.max_pages,
    )

    announcements = result.get("announcements", [])
    trade_display = args.trade if args.trade else "all"
    print(f"[INFO] Query done (trade={trade_display}): {len(announcements)} records")

    included: Optional[List[Dict]] = None
    excluded: Optional[List[Dict]] = None

    companies: List[Dict] = []
    if args.companies:
        companies = load_companies(args.companies)
        if not companies:
            print(f"[WARN] Companies file {args.companies} is empty; company filter skipped.", file=sys.stderr)

    need_filter = bool(companies) or not args.no_keyword_filter
    if need_filter:
        included, excluded = filter_announcements(
            result,
            companies,
            apply_keyword_filter=not args.no_keyword_filter,
        )
        print(
            f"[INFO] Filter done: keep {len(included)}, exclude {len(excluded)} "
            f"(total: {len(included) + len(excluded)})"
        )
        if included:
            print("\n=== INCLUDED ===")
            for item in included:
                print(f"  [{item['company']}] {item['title']}")
        if excluded:
            print("\n=== EXCLUDED ===")
            for item in excluded:
                print(f"  [{item['company']}] {item['title']} | {item['reason']}")
    else:
        included = []
        for item in announcements:
            included.append({
                "secCode": item.get("secCode", ""),
                "company": item.get("secName", ""),
                "title": clean_html(item.get("announcementTitle", "")),
                "announcementTime": format_timestamp(item.get("announcementTime")),
                "downloadUrl": build_download_url(item.get("adjunctUrl", "")),
                "type": "",
            })
        print(f"[INFO] All filters disabled: exporting {len(included)} raw records")

    output_file = args.output
    if output_file is None:
        date_str = date_range.replace("~", "_")
        trade_label = args.trade if args.trade and args.trade != ALL_TRADES else "all"
        trade_safe = re.sub(r'[\\/:*?"<>|]', "_", trade_label)
        output_file = Path.cwd() / f"cninfo_{trade_safe}_{date_str}.md"

    count = write_markdown(
        output_file=output_file,
        included=included,
        excluded=excluded,
    )
    print(f"[INFO] Export done: {output_file.resolve()}, {count} rows")


if __name__ == "__main__":
    main()
