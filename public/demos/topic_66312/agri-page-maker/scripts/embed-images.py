"""
读取指定目录下所有 jpg，转 base64，生成 self-contained HTML。
用法：python3 embed-images.py <产品目录>
"""
import os
import base64
import re
import sys


def to_data_url(path):
    """读取图片 → base64 → data URL

    关键：Python 的 base64.b64encode 默认按 76 字符换行，会破坏 data URL。
    必须 .replace("\\n", "").replace("\\r", "") 去除所有换行。
    """
    with open(path, "rb") as f:
        data = f.read()
    b64 = base64.b64encode(data).decode("ascii").replace("\n", "").replace("\r", "")
    return f"data:image/jpeg;base64,{b64}"


def main():
    product_dir = sys.argv[1] if len(sys.argv) > 1 else "."
    assets_dir = os.path.join(product_dir, "assets")
    html_path = os.path.join(product_dir, "index.html")

    if not os.path.exists(html_path):
        print(f"✗ HTML 不存在：{html_path}")
        return
    if not os.path.exists(assets_dir):
        print(f"✗ assets 目录不存在：{assets_dir}")
        return

    # 1. 读取所有图片为 base64
    images = {}
    for f in sorted(os.listdir(assets_dir)):
        if f.endswith(".jpg") or f.endswith(".png"):
            images[f] = to_data_url(os.path.join(assets_dir, f))
            size_kb = len(images[f]) // 1024
            print(f"  ✓ {f:20s}  {size_kb} KB (base64)")

    total_kb = sum(len(v) for v in images.values()) // 1024
    print(f"\n  总 base64 体积：{total_kb} KB ({len(images)} 张)")

    # 2. 读取 HTML 模板，替换 src 为 data URL
    with open(html_path, "r", encoding="utf-8") as f:
        html = f.read()

    def replace(m):
        filename = m.group(1)
        if filename in images:
            # ⚠ 关键：replacement 必须包含 src=\" 前缀，
            # 否则匹配到的 src=\"assets/... 会被替换成裸 data URL，
            # HTML 变成 <img data:image/...> 缺 src=，浏览器无法识别
            return f'src="{images[filename]}"'
        return m.group(0)

    new_html = re.sub(r'src="assets/([^"]+\.(?:jpg|png))"', replace, html)

    # 3. 写回
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(new_html)

    size_kb = os.path.getsize(html_path) // 1024
    print(f"\n  ✓ index.html 已更新为自包含版本")
    print(f"  文件大小：{size_kb} KB")


if __name__ == "__main__":
    main()
