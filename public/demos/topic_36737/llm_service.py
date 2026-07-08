import json
import os
import re
from typing import Any

from openai import AsyncOpenAI

import database


RECOMMEND_PROMPT = """你是「寻味岭南」粤菜点餐助手。请根据用户需求，从候选菜品中智能搭配一桌菜。

候选菜品 JSON（共{dish_count}道）:
{dishes_json}

用户需求:
{user_input}

## 推荐策略
1. **解析意图**：从用户输入中提取人数、预算、口味偏好、场景（聚餐/约会/一人食/家庭）、忌口等。
2. **按人数配餐**：1人→1-2道；2人→2-3道；3-4人→3-4道；5人以上→4-6道。确保荤素搭配、品类多样（避免全是烧味或全是点心）。
3. **预算控制**：如果用户提到预算，总价不超过预算的90%为佳，留有余量。如果没有预算限制，按人均60-120元合理搭配。
4. **口味匹配**：优先匹配用户提到的口味标签（清淡/辣/甜/养生等），未指定时默认均衡搭配。
5. **多样性**：尽量覆盖不同分类（烧味/点心/小炒/汤品/主食/海鲜/煲仔/凉菜/甜品），同一分类最多选2道。
6. **理由个性化**：每道菜的 reason 要结合用户具体需求说明为什么推荐这道菜，不要写泛泛的描述。
7. **summary 要自然**：像朋友推荐一样说话，包含人数、总价、搭配思路，例如「3个人200元预算，帮你搭了一荤一素一汤一主食，总共¥186，吃得舒服又不浪费」。

请只返回严格 JSON，不要使用 Markdown。格式:
{{
  "recommended_dishes": [
    {{"id": 1, "reason": "结合用户需求的推荐理由"}}
  ],
  "total_price": 0,
  "summary": "自然的推荐说明"
}}

注意: total_price 必须等于推荐菜品价格之和。不要推荐候选列表之外的菜。
"""

TASTE_KEYWORDS = {
    "清淡": ["清淡", "不油", "少油", "清爽", "健康"],
    "辣": ["辣", "微辣", "重口", "开胃"],
    "甜": ["甜", "甜品", "糖水", "小朋友"],
    "招牌": ["招牌", "推荐", "拿手", "特色"],
    "经典": ["经典", "传统", "地道", "正宗"],
    "养生": ["养生", "滋补", "汤", "补", "润"],
    "下饭": ["下饭", "配饭", "米饭", "饱"],
    "快手": ["快", "快手", "简单", "赶时间"],
}


def _extract_json(content: str) -> dict[str, Any]:
    text = content.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    return json.loads(text)


def _enrich_response(response: dict[str, Any], user_input: str) -> dict[str, Any]:
    enriched = []
    total_price = 0

    for item in response.get("recommended_dishes", []):
        dish_id = item.get("id") if isinstance(item, dict) else item
        try:
            dish = database.get_dish_by_id(int(dish_id))
        except (TypeError, ValueError):
            dish = None
        if not dish:
            continue

        reason = item.get("reason", "") if isinstance(item, dict) else ""
        dish["reason"] = reason
        total_price += int(dish["price"])
        enriched.append(dish)

    result = {
        "recommended_dishes": enriched,
        "total_price": total_price,
        "summary": response.get("summary", "已根据你的需求推荐粤菜组合。"),
    }
    database.save_order_history(user_input, enriched, total_price)
    return result


GREETING_KEYWORDS = [
    "你好", "您好", "hi", "hello", "嗨", "hey",
    "在吗", "在不在", "喂", "哈喽",
]

FAREWELL_KEYWORDS = [
    "谢谢", "感谢", "拜拜", "再见", "bye", "thanks",
    "好的", "知道了", "明白了", "ok", "没事了",
]

# 和点餐/美食相关的关键词，命中任意一个就认为是点餐意图
FOOD_KEYWORDS = [
    "吃", "菜", "饭", "餐", "点", "推荐", "搭配", "口味",
    "预算", "人数", "几个人", "个人", "位", "桌", "饿", "想吃",
    "清淡", "辣", "甜", "汤", "粥", "粉", "面", "鸡",
    "鸭", "鹅", "鱼", "虾", "蟹", "煲", "蒸", "炒",
    "烧", "卤", "点心", "糖水", "甜品", "主食", "小食",
    "招牌", "特色", "经典", "养生", "下饭", "快手",
    "早餐", "午餐", "晚餐", "宵夜", "下午茶",
    "粤菜", "广东", "广式", "茶楼", "酒楼",
    "元", "块", "钱",
]

# 匹配「数字+人/元/块」等点餐相关模式
FOOD_PATTERNS = [
    r"\d+\s*[人位个]",
    r"\d+\s*[元块钱]",
    r"预算\s*\d+",
]


def _is_greeting(user_input: str) -> bool:
    text = user_input.strip()
    # 短输入才做关键词匹配，避免长句误命中
    if len(text) > 10:
        return False
    text_lower = text.lower()
    for kw in GREETING_KEYWORDS + FAREWELL_KEYWORDS:
        if kw.lower() == text_lower:
            return True
    cleaned = re.sub(r"[^\w\u4e00-\u9fff]", "", text)
    if len(cleaned) <= 1:
        return True
    return False


def _is_food_related(user_input: str) -> bool:
    """判断用户输入是否和点餐/美食相关"""
    text = user_input.strip()
    for kw in FOOD_KEYWORDS:
        if kw in text:
            return True
    # 正则模式匹配（如「4个人」「500元」）
    for pattern in FOOD_PATTERNS:
        if re.search(pattern, text):
            return True
    return False


async def recommend(user_input: str) -> dict[str, Any]:
    # 1. 打招呼/告别 → 友好回复
    if _is_greeting(user_input):
        return {
            "recommended_dishes": [],
            "total_price": 0,
            "summary": "你好呀！我是粤菜点餐助手 🍽️ 告诉我人数、口味偏好或预算，我来帮你搭配一桌好菜。",
        }

    # 2. 完全无关话题 → 礼貌引导回点餐
    if not _is_food_related(user_input):
        return {
            "recommended_dishes": [],
            "total_price": 0,
            "summary": "这个问题我不太擅长哦 😅 我是粤菜点餐助手，可以帮你推荐菜品、搭配套餐。试试告诉我：几个人吃饭、喜欢什么口味、预算多少？",
        }

    # 3. 点餐相关 → 正常走推荐流程
    try:
        dishes = database.get_all_dishes()
        dishes_for_prompt = [
            {
                "id": dish["id"],
                "name": dish["name"],
                "price": dish["price"],
                "category": dish["category"],
                "tags": dish["tags"],
            }
            for dish in dishes
        ]
        dishes_json = json.dumps(dishes_for_prompt, ensure_ascii=False)

        client = AsyncOpenAI(
            api_key=os.getenv("OPENAI_API_KEY"),
            base_url=os.getenv("OPENAI_BASE_URL"),
        )
        completion = await client.chat.completions.create(
            model=os.getenv("LLM_MODEL", "deepseek-chat"),
            messages=[
                {
                    "role": "user",
                    "content": RECOMMEND_PROMPT.format(
                        dish_count=len(dishes),
                        dishes_json=dishes_json,
                        user_input=user_input,
                    ),
                }
            ],
            temperature=0.3,
            response_format={"type": "json_object"},
        )
        content = completion.choices[0].message.content or "{}"
        parsed = _extract_json(content)
        result = _enrich_response(parsed, user_input)
        if result["recommended_dishes"]:
            return result
    except Exception:
        pass

    return rule_based_recommend(user_input)


def _extract_budget(user_input: str) -> int | None:
    patterns = [
        r"(?:预算|不超过|以内|控制在|最多|低于)\s*(\d+)",
        r"(\d+)\s*(?:元|块|以内|左右)",
    ]
    for pattern in patterns:
        match = re.search(pattern, user_input)
        if match:
            return int(match.group(1))
    return None


def _matched_tags(user_input: str) -> set[str]:
    matched = set()
    for tag, keywords in TASTE_KEYWORDS.items():
        if any(keyword in user_input for keyword in keywords):
            matched.add(tag)
    return matched


def _extract_people_count(user_input: str) -> int | None:
    patterns = [
        r"(\d+)\s*[人位个]",
        r"(\d+)\s*(?:个人|位|人吃)",
    ]
    for pattern in patterns:
        match = re.search(pattern, user_input)
        if match:
            return int(match.group(1))
    return None


def rule_based_recommend(user_input: str) -> dict[str, Any]:
    dishes = database.get_all_dishes()
    budget = _extract_budget(user_input)
    people = _extract_people_count(user_input) or 2
    matched_tags = _matched_tags(user_input)

    # 按人数决定推荐数量
    target_count = min(max(people, 1), 6)
    if target_count == 1:
        target_count = 2
    elif target_count == 2:
        target_count = 3
    elif target_count >= 5:
        target_count = min(target_count + 1, 6)

    # 评分：标签匹配 + 名称/分类命中 + 价格合理性
    scored = []
    for dish in dishes:
        tags = set(dish.get("tags", []))
        score = len(tags & matched_tags) * 3
        if dish["category"] in user_input or dish["name"] in user_input:
            score += 5
        # 预算内加分
        price = int(dish["price"])
        if budget is not None and price <= budget // target_count:
            score += 2
        scored.append((score, price, dish))

    scored.sort(key=lambda item: (-item[0], item[1], item[2]["id"]))

    # 选择时保证分类多样性
    selected = []
    total_price = 0
    used_categories = {}
    for _, _, dish in scored:
        price = int(dish["price"])
        cat = dish["category"]
        if budget is not None and total_price + price > budget:
            continue
        # 同分类最多选2道
        if used_categories.get(cat, 0) >= 2:
            continue
        selected.append({**dish, "reason": f"{cat}类代表菜品，适合{people}人用餐。"})
        total_price += price
        used_categories[cat] = used_categories.get(cat, 0) + 1
        if len(selected) >= target_count:
            break

    if not selected:
        affordable = [d for d in dishes if budget is None or int(d["price"]) <= budget]
        pool = affordable or dishes
        selected = [
            {**d, "reason": "经典粤菜推荐。"}
            for d in sorted(pool, key=lambda x: x["price"])[:target_count]
        ]
        total_price = sum(int(d["price"]) for d in selected)

    budget_text = f"，预算¥{budget}" if budget else ""
    summary = f"{people}人用餐{budget_text}，为你搭配了{len(selected)}道菜，合计¥{total_price}。"

    result = {
        "recommended_dishes": selected,
        "total_price": total_price,
        "summary": summary,
    }
    database.save_order_history(user_input, selected, total_price)
    return result
