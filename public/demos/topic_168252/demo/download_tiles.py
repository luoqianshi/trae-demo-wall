import urllib.request
import os
import math
import sys

CENTER_LAT = 34.2600
CENTER_LNG = 108.9425

def latlng_to_tile(lat, lng, zoom):
    n = 2 ** zoom
    x = int((lng + 180) / 360 * n)
    lat_rad = math.radians(lat)
    y = int((1 - math.log(math.tan(lat_rad) + 1/math.cos(lat_rad)) / math.pi) / 2 * n)
    return x, y

# 需要下载的缩放级别
ZOOMS = [13, 14, 15, 16, 17]
# 各级别的网格半径（核心区域即可，展示用）
RANGES = {
    13: 1,  # 3x3
    14: 2,  # 5x5
    15: 2,  # 5x5
    16: 3,  # 7x7
    17: 3,  # 7x7
}

os.makedirs('tiles', exist_ok=True)

total = 0
success = 0

for zoom in ZOOMS:
    cx, cy = latlng_to_tile(CENTER_LAT, CENTER_LNG, zoom)
    r = RANGES.get(zoom, 2)
    print(f"\n=== Zoom {zoom} | 中心: x={cx}, y={cy} | 范围: ±{r} ===")

    for dx in range(-r, r + 1):
        for dy in range(-r, r + 1):
            x = cx + dx
            y = cy + dy
            z = zoom

            tile_dir = f'tiles/{z}/{x}'
            os.makedirs(tile_dir, exist_ok=True)
            tile_path = f'{tile_dir}/{y}.png'

            if os.path.exists(tile_path) and os.path.getsize(tile_path) > 100:
                total += 1
                success += 1
                continue

            # 高德瓦片 - 轮询子域名
            subdomain = str((x + y) % 4 + 1)
            url = f'https://webrd0{subdomain}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}'
            try:
                req = urllib.request.Request(url, headers={
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Referer': 'https://localhost:8080/'
                })
                with urllib.request.urlopen(req, timeout=15) as response:
                    data = response.read()
                    if len(data) > 100:
                        with open(tile_path, 'wb') as f:
                            f.write(data)
                        print(f'  ✓ {z}/{x}/{y}.png ({len(data)} bytes)')
                        success += 1
                    else:
                        print(f'  ✗ {z}/{x}/{y} - 数据太小 ({len(data)})')
            except Exception as e:
                print(f'  ✗ {z}/{x}/{y} - {str(e)[:50]}')
            total += 1

    # 每级完成后刷新磁盘
    sys.stdout.flush()

print(f'\n下载完成: {success}/{total} 张瓦片')