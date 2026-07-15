"""
生成聚宝盆小程序 TabBar 图标 (81x81 PNG)
- 未选中: #95A5A6
- 选中:   #3498DB
"""
from PIL import Image, ImageDraw

SIZE = 81
C_INACTIVE = (149, 165, 166, 255)   # #95A5A6
C_ACTIVE   = (52, 152, 219, 255)   # #3498DB
STROKE = 5


def base():
    return Image.new('RGBA', (SIZE, SIZE), (255, 255, 255, 0))


def stroke_width():
    return max(3, SIZE // 16)


# 1) 首页 Home - 屋顶 + 房身
def draw_home(color, sw):
    img = base()
    d = ImageDraw.Draw(img)
    # 屋顶
    d.polygon([(10, 38), (40, 12), (70, 38)], outline=color, width=sw)
    # 房身
    d.rectangle([(18, 36), (62, 70)], outline=color, width=sw)
    # 门
    d.rectangle([(33, 52), (47, 70)], outline=color, width=sw)
    return img


# 2) 红包 RedPacket - 圆角矩形 + 圆形封口
def draw_redpacket(color, sw):
    img = base()
    d = ImageDraw.Draw(img)
    # 红包主体（圆角矩形用大圆角近似）
    d.rounded_rectangle([(15, 18), (66, 70)], radius=8, outline=color, width=sw)
    # 顶部封口横线
    d.line([(15, 32), (66, 32)], fill=color, width=sw)
    # 中心圆
    d.ellipse([(30, 38), (51, 59)], outline=color, width=sw)
    # ¥ 符号 - 两条横线
    d.line([(34, 48), (47, 48)], fill=color, width=2)
    d.line([(34, 52), (47, 52)], fill=color, width=2)
    return img


# 3) 优惠 Discount - 购物车
def draw_discount(color, sw):
    img = base()
    d = ImageDraw.Draw(img)
    # 购物车主体
    d.rounded_rectangle([(16, 26), (66, 60)], radius=4, outline=color, width=sw)
    # 把手
    d.arc([(8, 18), (28, 38)], start=180, end=270, fill=color, width=sw)
    # 左侧轮子
    d.ellipse([(22, 64), (32, 74)], outline=color, width=sw)
    # 右侧轮子
    d.ellipse([(50, 64), (60, 74)], outline=color, width=sw)
    # 顶部横线
    d.line([(16, 26), (66, 26)], fill=color, width=sw)
    return img


# 4) 返现 Cashback - 美元符号 $ （用 ¥ 类似表示现金）
def draw_cashback(color, sw):
    img = base()
    d = ImageDraw.Draw(img)
    # 外圈圆
    d.ellipse([(12, 12), (69, 69)], outline=color, width=sw)
    # 中间横线
    d.line([(25, 41), (56, 41)], fill=color, width=sw)
    d.line([(25, 48), (56, 48)], fill=color, width=sw)
    # 竖线
    d.line([(40, 18), (40, 63)], fill=color, width=sw)
    return img


# 5) 我的 Profile - 头像 + 肩膀
def draw_profile(color, sw):
    img = base()
    d = ImageDraw.Draw(img)
    # 头
    d.ellipse([(28, 14), (54, 40)], outline=color, width=sw)
    # 肩膀（半圆）
    d.arc([(15, 42), (66, 78)], start=180, end=360, fill=color, width=sw)
    return img


ICONS = [
    ('home', draw_home),
    ('redpacket', draw_redpacket),
    ('discount', draw_discount),
    ('cashback', draw_cashback),
    ('profile', draw_profile),
]

import os
OUT = r'e:\TareWorkspace\JuBaoPen\JuBaoPenMiniApp\images'
os.makedirs(OUT, exist_ok=True)

for name, fn in ICONS:
    sw = stroke_width()
    fn(C_INACTIVE, sw).save(os.path.join(OUT, f'tab_{name}.png'))
    fn(C_ACTIVE, sw).save(os.path.join(OUT, f'tab_{name}_active.png'))
    print(f'Generated tab_{name}.png & tab_{name}_active.png')

print('All done.')
