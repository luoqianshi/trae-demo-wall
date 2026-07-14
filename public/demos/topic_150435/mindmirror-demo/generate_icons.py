"""
心镜 MindMirror — Logo PNG 生成器
直接用 Pillow 绘制多尺寸 PNG，不依赖 cairosvg
"""
from PIL import Image, ImageDraw
import math
import os

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "static")

# 品牌色
SAGE = (107, 144, 128)    # #6B9080
BLUE = (91, 123, 154)     # #5B7B9A
SAGE_LIGHT = (157, 188, 176)  # #9DBCB0 深底单色版
BLUE_LIGHT = (157, 181, 208)  # #9DB5D0


def lerp_color(c1, c2, t):
    """线性插值两个颜色"""
    return tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(3))


def draw_mirror_heart(draw, size, light_version=False):
    """在 size×size 画布上绘制镜心 logo"""
    cx = size / 2
    cy = size / 2

    if light_version:
        ring_color = BLUE_LIGHT
        heart_color = SAGE_LIGHT
        ripple_opacity = 0.5
    else:
        ring_color = BLUE
        heart_color = SAGE
        ripple_opacity = 0.45

    # 涟漪（外两层，半透明）
    # 外层 r=54/120*size，stroke=1
    r_outer = 54 / 120 * size
    r_inner = 44 / 120 * size
    # 半透明圆环用合成绘制：先画到临时层
    if size >= 32:  # 太小不画涟漪
        # 外层涟漪
        bbox_o = [cx - r_outer, cy - r_outer, cx + r_outer, cy + r_outer]
        draw.ellipse(bbox_o, outline=ring_color, width=max(1, int(size / 120)))
        # 内层涟漪
        bbox_i = [cx - r_inner, cy - r_inner, cx + r_inner, cy + r_inner]
        draw.ellipse(bbox_i, outline=ring_color, width=max(1, int(size / 120 * 1.2)))

    # 镜面圆 r=34
    r_mirror = 34 / 120 * size
    bbox_m = [cx - r_mirror, cy - r_mirror, cx + r_mirror, cy + r_mirror]
    # 用渐变描边：简化为 sage 色
    mirror_stroke = SAGE if not light_version else SAGE_LIGHT
    sw = max(2, int(size / 120 * 2.5))
    draw.ellipse(bbox_m, outline=mirror_stroke, width=sw)

    # 心形：用参数方程绘制
    # 心形参数方程: x=16sin^3(t), y=-(13cos(t)-5cos(2t)-2cos(3t)-cos(4t))
    # 缩放到 size 的 40%
    heart_scale = size * 0.32 / 16  # 16 是心形参数方程的基准
    # 原始 logo 心形中心在 (60, 60)，顶点在 y=78（向下），尖端在 y=40
    # 调整：让心形在镜面圆内，中心略偏下
    heart_cx = cx
    heart_cy = cy + size * 0.05  # 略向下偏移

    points = []
    n = 80
    for i in range(n + 1):
        t = -math.pi / 2 + i * 2 * math.pi / n  # 从顶部开始
        # 标准心形参数方程（y 轴向上为正）
        x = 16 * math.sin(t) ** 3
        y = -(13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t))
        # 缩放并平移
        px = heart_cx + x * heart_scale
        py = heart_cy - y * heart_scale  # y 翻转（屏幕坐标 y 向下）
        points.append((px, py))

    # 绘制心形填充
    heart_fill = SAGE if not light_version else SAGE_LIGHT
    draw.polygon(points, fill=heart_fill)

    # 高光（仅大尺寸时绘制）
    if size >= 64:
        # 心形上方弧形高光
        hl_color = (255, 255, 255, 180) if not light_version else (255, 255, 255, 160)
        # 创建临时图层处理透明度
        overlay = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        overlay_draw = ImageDraw.Draw(overlay)
        # 高光弧线：从心形左上到右上的弧
        hl_r = size * 0.22
        bbox_hl = [heart_cx - hl_r, heart_cy - hl_r - size * 0.08,
                   heart_cx + hl_r, heart_cy + hl_r - size * 0.08]
        # 画上半圆弧
        overlay_draw.arc(bbox_hl, 200, 340, fill=hl_color,
                         width=max(1, int(size / 120 * 1.5)))
        return overlay
    return None


def generate_favicon(size, path, light_version=False):
    """生成 favicon（带透明背景）"""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    overlay = draw_mirror_heart(draw, size, light_version)
    if overlay:
        img = Image.alpha_composite(img, overlay)
    img.save(path, "PNG")
    print(f"  ✓ {path}  ({size}×{size})")


def generate_app_icon(size, path):
    """生成 App Icon（圆角方形带背景色）"""
    # 深色背景圆角方形
    bg_color = (42, 37, 32)  # #2A2520 深棕
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 圆角矩形背景
    radius = int(size * 0.22)
    draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=bg_color)

    # 绘制 logo（light version，适配深色背景）
    overlay = draw_mirror_heart(draw, size, light_version=True)
    if overlay:
        img = Image.alpha_composite(img, overlay)
    img.save(path, "PNG")
    print(f"  ✓ {path}  ({size}×{size})")


def generate_favicon_ico(path):
    """生成多尺寸 .ico favicon"""
    sizes = [16, 32, 48]
    imgs = []
    for s in sizes:
        img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        draw_mirror_heart(draw, s, light_version=False)
        imgs.append(img)
    imgs[0].save(path, format="ICO", sizes=[(s, s) for s in sizes],
                 append_images=imgs[1:])
    print(f"  ✓ {path}  (multi-size ICO)")


if __name__ == "__main__":
    print("生成心镜 MindMirror logo 图标...")

    # favicon ICO（浏览器标签页）
    generate_favicon_ico(os.path.join(OUTPUT_DIR, "favicon.ico"))

    # PNG favicon 多尺寸
    for s in [16, 32, 48]:
        generate_favicon(s, os.path.join(OUTPUT_DIR, f"favicon-{s}.png"))

    # App Icon 多尺寸（深底）
    for s in [180, 512]:
        generate_app_icon(s, os.path.join(OUTPUT_DIR, f"app-icon-{s}.png"))

    print("\n全部完成！文件位于 static/ 目录")
