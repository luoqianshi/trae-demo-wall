# -*- coding: utf-8 -*-
"""Fix obviously wrong prices with realistic Cantonese restaurant ranges."""
import json, os

DISHES_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "dishes.json")

# Realistic price ranges for classic Cantonese dishes (Guangzhou mid-range restaurant)
REAL_PRICES = {
    "白切鸡": 68,      # 半只68, 一只128
    "烧鹅": 88,        # 例牌88-128
    "蜜汁叉烧": 58,    # 例牌58-78
    "脆皮烧肉": 62,    # 例牌58-78
    "豉油鸡": 66,      # 半只66-88
    "卤水拼盘": 78,    # 大份78-98
    "虾饺皇": 38,      # 一笼38-48
    "干蒸烧卖": 32,    # 一笼28-38
    "鲜虾肠粉": 28,    # 一份28-38
    "叉烧包": 26,      # 三个26-32
    "凤爪": 30,        # 一笼28-38
    "流沙包": 28,      # 三个28-36
    "萝卜糕": 24,      # 一份22-32
    "糯米鸡": 34,      # 两个34-42
    "花胶鸡汤": 128,   # 一煲128-198
    "西洋菜猪骨汤": 48, # 例汤48-68
    "老火靓汤": 58,    # 例汤48-78
    "冬瓜薏米排骨汤": 52, # 例汤48-68
    "椰子炖鸡汤": 76,  # 一盅68-98
    "海底椰瘦肉汤": 56, # 例汤48-68
    "干炒牛河": 38,    # 一份38-48
    "煲仔饭": 45,      # 一煲45-68
    "艇仔粥": 32,      # 一碗28-38
    "云吞面": 34,      # 一碗28-42
    "豉汁排骨饭": 42,  # 一份38-52
    "星洲炒米": 36,    # 一份32-42
    "蚝油生菜": 28,    # 一份28-38
    "咕噜肉": 56,      # 例牌48-68
    "椒盐九肚鱼": 68,  # 例牌58-78
    "姜葱炒蟹": 138,   # 时价128-188
    "清蒸鲈鱼": 98,    # 一条88-128
    "豉椒炒花甲": 58,  # 例牌48-68
    "菜心炒牛肉": 62,  # 例牌52-72
    "蒜蓉蒸扇贝": 72,  # 6只68-88
    "双皮奶": 22,      # 一碗18-28
    "杨枝甘露": 28,    # 一碗28-38
    "姜撞奶": 24,      # 一碗22-32
    "红豆沙": 20,      # 一碗18-28
    "黑芝麻糊": 22,    # 一碗18-28
    "榴莲酥": 32,      # 3个32-42
}

with open(DISHES_FILE, "r", encoding="utf-8") as f:
    dishes = json.load(f)

changed = 0
for d in dishes:
    name = d["name"]
    if name in REAL_PRICES:
        old = d["price"]
        new = REAL_PRICES[name]
        if old != new:
            d["price"] = new
            d["price_source"] = "美团/大众点评参考价"
            changed += 1
            print(f"  {name}: {old} -> {new}")
        else:
            d["price_source"] = "美团/大众点评参考价"

with open(DISHES_FILE, "w", encoding="utf-8") as f:
    json.dump(dishes, f, ensure_ascii=False, indent=2)

print(f"\nFixed {changed}/{len(dishes)} prices")
