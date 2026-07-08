import json

with open('app/data/scenarios.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

scenarios = data['scenarios']

# 补充映射（包括各种emoji变体）
ICON_TO_INTEREST = {
    '🚇': '地铁',
    '🦖': '恐龙',
    '🧩': '乐高',
    '🧱': '乐高',  # 补充这个
    '🌊': '海洋',
    '🐢': '海洋',
    '🪸': '海洋',
    '🐬': '海洋',
    '🐧': '海洋',
    '🐠': '海洋',
    '🚀': '太空',
}

# 公园关键词
PARK_KEYWORDS = ['公园', '花园', '草地', '游乐场']

fixed_count = 0
for s in scenarios:
    # 1. 如果没有 interest 字段，根据 sceneIcon 补充
    if not s.get('interest'):
        icon = s.get('sceneIcon', '')
        if icon in ICON_TO_INTEREST:
            s['interest'] = ICON_TO_INTEREST[icon]
            fixed_count += 1
            print(f"  [icon] 修复: {icon} -> {s['interest']}")
            continue
        
        # 2. 检查是否是公园场景
        scene = s.get('scene', '')
        if any(kw in scene for kw in PARK_KEYWORDS):
            s['interest'] = '公园'
            fixed_count += 1
            print(f"  [keyword] 修复: 公园 <- {scene[:40]}...")
            continue

print(f"\n共修复 {fixed_count} 道题的 interest 字段")

# 统计各 interest 的题数
interest_counts = {}
for s in scenarios:
    interest = s.get('interest', 'unknown')
    interest_counts[interest] = interest_counts.get(interest, 0) + 1

PREGEN_TOPICS = ['地铁', '恐龙', '乐高', '海洋', '太空', '汽车', '动物', '公园']

print("\n【修复后的 interest 分布】")
for interest, count in sorted(interest_counts.items(), key=lambda x: -x[1]):
    marker = " ⭐预置" if interest in PREGEN_TOPICS else ""
    print(f"  {interest}: {count}题{marker}")

# 检查8个预置主题是否都有题
print("\n【8个预置主题检查】")
all_covered = True
for topic in PREGEN_TOPICS:
    count = interest_counts.get(topic, 0)
    status = "✅" if count > 0 else "❌"
    print(f"  {topic}: {count}题 {status}")
    if count == 0:
        all_covered = False

if all_covered:
    print("\n✅ 所有预置主题都有题目！")
else:
    print("\n⚠️ 部分预置主题仍无题目")

# 写回文件
with open('app/data/scenarios.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("\n✅ scenarios.json 已更新")
