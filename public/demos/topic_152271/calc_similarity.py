import json
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parent
POEMS_PATH = ROOT / "poems.json"
OUTPUT_PATH = ROOT / "similarity_matrix.json"

STYLE_TABLE = {
    "婉约": {"婉约": 1.0, "豪放": 0.35, "沉郁": 0.45, "朴实": 0.55, "哲理": 0.4},
    "豪放": {"婉约": 0.35, "豪放": 1.0, "沉郁": 0.6, "朴实": 0.45, "哲理": 0.5},
    "沉郁": {"婉约": 0.45, "豪放": 0.6, "沉郁": 1.0, "朴实": 0.4, "哲理": 0.55},
    "朴实": {"婉约": 0.55, "豪放": 0.45, "沉郁": 0.4, "朴实": 1.0, "哲理": 0.5},
    "哲理": {"婉约": 0.4, "豪放": 0.5, "沉郁": 0.55, "朴实": 0.5, "哲理": 1.0},
}

CHAR_STOP = set("，。！？；：、,.!?;: \n\t")


def load_poems():
    data = json.loads(POEMS_PATH.read_text(encoding="utf-8"))
    poems = []
    for group in data["groups"]:
        for poem in group["poems"]:
            poem_copy = dict(poem)
            poem_copy["group"] = group["name"]
            poems.append(poem_copy)
    if len(poems) != 30:
        raise ValueError(f"Expected 30 poems, found {len(poems)}")
    return poems


def normalize_keyword(keyword):
    aliases = {
        "故乡": "思乡",
        "乡音": "思乡",
        "归乡": "思乡",
        "异乡": "思乡",
        "客愁": "思乡",
        "相思": "相思",
        "知己": "友情",
        "故人": "友情",
        "友情": "友情",
        "离别": "离别",
        "玉门关": "边塞",
        "孤城": "边塞",
        "黄河": "黄河",
        "明月": "明月",
        "月夜": "明月",
        "月落": "明月",
        "月近": "明月",
        "月黑": "明月",
        "山水": "山水",
        "春山": "山水",
        "庐山": "山水",
        "瀑布": "山水",
        "烽火": "历史",
        "山河破碎": "历史",
        "国破": "历史",
        "丹心": "历史",
        "清白": "品格",
        "清气": "品格",
        "辛苦": "民生",
        "农人": "民生",
        "盘中餐": "民生",
    }
    return aliases.get(keyword, keyword)


def keyword_set(poem):
    return {normalize_keyword(keyword) for keyword in poem["keywords"]}


def jaccard_similarity(poem_a, poem_b):
    set_a = keyword_set(poem_a)
    set_b = keyword_set(poem_b)
    union = set_a | set_b
    if not union:
        return 0.0, []
    shared = sorted(set_a & set_b)
    return len(shared) / len(union), shared


def char_counter(text):
    filtered = [char for char in text if char not in CHAR_STOP]
    return Counter(filtered)


def char_overlap(poem_a, poem_b):
    counter_a = char_counter(poem_a["content"])
    counter_b = char_counter(poem_b["content"])
    all_chars = set(counter_a) | set(counter_b)
    if not all_chars:
        return 0.0
    overlap = sum(min(counter_a[ch], counter_b[ch]) for ch in all_chars)
    total = sum(max(counter_a[ch], counter_b[ch]) for ch in all_chars)
    return overlap / total if total else 0.0


def style_similarity(poem_a, poem_b):
    return STYLE_TABLE[poem_a["style"]][poem_b["style"]]


def author_similarity(poem_a, poem_b):
    return 1.0 if poem_a["author"] == poem_b["author"] else 0.0


def imagery_similarity(poem_a, poem_b):
    return 1.0 if poem_a["imagery"] == poem_b["imagery"] else 0.0


def build_reason(poem_a, poem_b, shared_keywords, weighted_parts):
    if poem_a["id"] == poem_b["id"]:
        return "同一首诗，作为流转起点与回环锚点。"

    ranked = sorted(weighted_parts.items(), key=lambda item: item[1], reverse=True)
    lead_key, _ = ranked[0]

    reason_map = {
        "keywords": lambda: (
            f"共享关键词“{'、'.join(shared_keywords[:3])}”，诗意意象衔接最强。"
            if shared_keywords
            else "关键词场域接近，能形成自然的意象延展。"
        ),
        "semantic": lambda: "字词语气和意境重合度高，读感衔接顺滑。",
        "style": lambda: f"同属或接近“{poem_a['style']} / {poem_b['style']}”风格，情绪调性相连。",
        "author": lambda: f"同为{poem_a['author']}作品，语汇与气质彼此呼应。",
        "imagery": lambda: f"同属“{poem_a['imagery']}”意象类别，画面切换保持连贯。",
    }

    parts = [reason_map[lead_key]()]
    if shared_keywords and lead_key != "keywords":
        parts.append(f"并共享“{'、'.join(shared_keywords[:2])}”等关键词。")
    if author_similarity(poem_a, poem_b) and lead_key != "author":
        parts.append("作者一致，形成个人风格回响。")
    if imagery_similarity(poem_a, poem_b) and lead_key != "imagery":
        parts.append(f"意象同属“{poem_a['imagery']}”，流转更自然。")
    return "".join(parts)


def score_pair(poem_a, poem_b):
    keyword_score, shared_keywords = jaccard_similarity(poem_a, poem_b)
    semantic_score = char_overlap(poem_a, poem_b)
    style_score = style_similarity(poem_a, poem_b)
    author_score = author_similarity(poem_a, poem_b)
    imagery_score = imagery_similarity(poem_a, poem_b)

    weighted_parts = {
        "keywords": keyword_score * 0.40,
        "semantic": semantic_score * 0.25,
        "style": style_score * 0.15,
        "author": author_score * 0.10,
        "imagery": imagery_score * 0.10,
    }
    total_score = sum(weighted_parts.values())
    reason = build_reason(poem_a, poem_b, shared_keywords, weighted_parts)
    return round(total_score, 4), reason


def build_output(poems):
    size = len(poems)
    matrix = []
    reasons = []
    for row in range(size):
        matrix_row = []
        reason_row = []
        for col in range(size):
            score, reason = score_pair(poems[row], poems[col])
            matrix_row.append(score)
            reason_row.append(reason)
        matrix.append(matrix_row)
        reasons.append(reason_row)
    return {"poems": poems, "matrix": matrix, "reasons": reasons}


def main():
    poems = load_poems()
    result = build_output(poems)
    OUTPUT_PATH.write_text(
        json.dumps(result, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"Generated {OUTPUT_PATH.name} for {len(poems)} poems.")


if __name__ == "__main__":
    main()
