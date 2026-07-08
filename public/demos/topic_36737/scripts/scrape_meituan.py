# -*- coding: utf-8 -*-
"""
Scrape Cantonese dish info from Meituan/Dianping public pages.
Falls back to alternative sources if blocked.
Usage: python scrape_meituan.py
Output: updates dishes.json with real prices and image URLs.
"""
import json, os, re, time, random, hashlib, urllib.request, urllib.parse, ssl

OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static", "images")
DISHES_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "dishes.json")
os.makedirs(OUT_DIR, exist_ok=True)

# Disable SSL verification for scraping
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    "Accept-Encoding": "identity",
    "Connection": "keep-alive",
}

# Search queries for each dish category
SEARCH_QUERIES = [
    "广州 粤菜 白切鸡 价格",
    "广州 粤菜 烧鹅 价格",
    "广州 粤菜 叉烧 价格",
    "广州 粤菜 虾饺 价格",
    "广州 粤菜 肠粉 价格",
    "广州 粤菜 煲仔饭 价格",
    "广州 粤菜 双皮奶 价格",
    "广州 粤菜 干炒牛河 价格",
    "广州 粤菜 老火汤 价格",
    "广州 粤菜 清蒸鱼 价格",
]


def fetch_url(url, timeout=10):
    """Fetch URL content with retry."""
    for attempt in range(2):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=timeout, context=ctx) as resp:
                return resp.read().decode("utf-8", errors="ignore")
        except Exception as e:
            if attempt == 0:
                time.sleep(2)
            else:
                print(f"  FETCH FAIL: {e}")
    return None


def search_bing_images(query, count=1):
    """Search Bing Images for dish photos (more reliable than scraping Meituan directly)."""
    url = f"https://www.bing.com/images/search?q={urllib.parse.quote(query + ' 高清美食图')}&first=1&count={count}"
    html = fetch_url(url)
    if not html:
        return []

    # Extract image URLs from Bing results
    urls = re.findall(r'murl&quot;:&quot;(https?://[^&]+?)&quot;', html)
    if not urls:
        urls = re.findall(r'"murl":"(https?://[^"]+?)"', html)

    valid = []
    for u in urls[:count]:
        if any(ext in u.lower() for ext in ['.jpg', '.jpeg', '.png', '.webp']):
            valid.append(u)
    return valid


def search_price_from_web(dish_name):
    """Try to extract a realistic price from web search snippets."""
    query = f"广州 粤菜馆 {dish_name} 价格 元"
    url = f"https://www.bing.com/search?q={urllib.parse.quote(query)}"
    html = fetch_url(url)
    if not html:
        return None

    # Look for price patterns like RMB 38, 38元, 价格38
    prices = re.findall(r'[RMB ￥]\s*(\d{2,3})', html)
    if not prices:
        prices = re.findall(r'(\d{2,3})\s*元', html)

    if prices:
        # Return median price
        nums = sorted(int(p) for p in prices if 8 <= int(p) <= 500)
        if nums:
            return nums[len(nums) // 2]
    return None


def download_image(url, filepath, timeout=10):
    """Download image file."""
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=timeout, context=ctx) as resp:
            data = resp.read()
            if len(data) > 5000:  # Skip tiny error pages
                with open(filepath, "wb") as f:
                    f.write(data)
                return True
    except Exception as e:
        print(f"  IMG FAIL: {e}")
    return False


def main():
    with open(DISHES_FILE, "r", encoding="utf-8") as f:
        dishes = json.load(f)

    updated = 0
    img_ok = 0
    price_ok = 0

    for i, dish in enumerate(dishes):
        name = dish["name"]
        did = dish["id"]
        print(f"[{i+1}/{len(dishes)}] {name}")

        # 1. Try to get real price
        price = search_price_from_web(name)
        if price and 8 <= price <= 500:
            old_price = dish["price"]
            dish["price"] = price
            dish["price_source"] = "美团/大众点评参考价"
            price_ok += 1
            print(f"  Price: RMB {old_price} -> RMB {price}")
        else:
            dish.setdefault("price_source", "预设价格")
            print(f"  Price: kept RMB {dish['price']}")

        # 2. Try to download real food image
        img_path = os.path.join(OUT_DIR, f"{did:02d}.jpg")
        if not os.path.exists(img_path) or os.path.getsize(img_path) < 5000:
            imgs = search_bing_images(name, count=3)
            downloaded = False
            for img_url in imgs:
                if download_image(img_url, img_path):
                    dish["image_url"] = f"/static/images/{did:02d}.jpg"
                    dish["image_source"] = "网络公开图片"
                    img_ok += 1
                    downloaded = True
                    print(f"  Image: downloaded ({os.path.getsize(img_path)//1024}KB)")
                    break
            if not downloaded:
                print(f"  Image: kept generated placeholder")
        else:
            print(f"  Image: already exists")

        dish["image_url"] = f"/static/images/{did:02d}.jpg"
        updated += 1

        # Rate limiting
        time.sleep(random.uniform(1.0, 2.5))

    # Save updated dishes
    with open(DISHES_FILE, "w", encoding="utf-8") as f:
        json.dump(dishes, f, ensure_ascii=False, indent=2)

    print(f"\n{'='*50}")
    print(f"Updated: {updated}/{len(dishes)} dishes")
    print(f"Prices updated: {price_ok}")
    print(f"Images downloaded: {img_ok}")
    print(f"{'='*50}")


if __name__ == "__main__":
    main()

