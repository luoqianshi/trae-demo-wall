"""需求理解：把用户的一句话拆解为风格 / 颜色 / 主体 / 用途 / 推荐方向 / 负向关键词。

基于关键词正则匹配，结构稳定、可扩展。识别中文输入。
"""
from __future__ import annotations

import re
from schemas import Analysis


# ===== 关键词词典 =====
# 每条：(正则, 命中后写入的标签)
STYLE_RULES: list[tuple[str, str]] = [
    (r"赛博|cyber|朋克", "赛博朋克"),
    (r"科技|ai|未来|程序|开发", "科技感"),
    (r"未来|future", "未来感"),
    (r"治愈|温柔|可爱|猫|猫猫|萌", "治愈系"),
    (r"极简|简洁|黑白", "极简"),
    (r"像素|pixel", "像素风"),
    (r"游戏|game", "游戏风"),
    (r"二次元|动漫|漫画|anime", "二次元"),
    (r"职业|开发者|程序员|设计师", "职业头像"),
    (r"团队|公司|组", "团队头像"),
]

COLOR_RULES: list[tuple[str, str]] = [
    (r"蓝|blue", "蓝色"),
    (r"紫|赛博", "紫色"),
    (r"粉|温柔|治愈|可爱", "粉色"),
    (r"黑白|极简|github", "黑白"),
    (r"绿|自然|清新", "绿色"),
    (r"鲜艳|高饱和|像素|游戏", "高饱和"),
    (r"暖|橙|红|黄", "暖色"),
    (r"冷|蓝|紫|青", "冷色"),
]

# 主体（人物类型）
SUBJECT_RULES: list[tuple[str, str]] = [
    (r"猫|猫猫|喵", "猫猫"),
    (r"狗|狗狗|汪", "狗狗"),
    (r"机器人|bot|robot", "机器人"),
    (r"程序员|开发者|coder", "程序员"),
    (r"设计师", "设计师"),
    (r"ai ?开发者|人工智能", "AI 开发者"),
    (r"虚拟人物|虚拟身份", "虚拟人物"),
    (r"女孩|少女|boy|girl", "动漫角色"),
    (r"叶子|植物|花", "植物"),
]

USAGE_RULES: list[tuple[str, str]] = [
    (r"微信", "微信"),
    (r"qq", "QQ"),
    (r"github", "GitHub"),
    (r"博客|blog", "博客"),
    (r"discord", "Discord"),
    (r"telegram", "Telegram"),
    (r"论坛|forum", "论坛"),
    (r"游戏|game", "游戏"),
    (r"社交", "社交平台"),
    (r"主页|个人主页", "个人主页"),
]

# 调色板 key，用于图像生成风格派发（与前端概念对齐）
PALETTE_RULES: list[tuple[str, str]] = [
    (r"赛博|cyber|朋克", "cyber"),
    (r"像素|pixel", "pixel"),
    (r"二次元|动漫|anime", "anime"),
    (r"自然|清新|植物|叶子|绿", "nature"),
    (r"治愈|温柔|可爱|猫|猫猫|萌", "warm"),
    (r"极简|简洁|黑白", "mono"),
    (r"科技|ai|未来|程序|开发", "tech"),
]


def _match(rules: list[tuple[str, str]], text: str) -> list[str]:
    t = text.lower()
    out: list[str] = []
    for pat, label in rules:
        if re.search(pat, t) and label not in out:
            out.append(label)
    return out


def _detect_palette(text: str) -> str:
    t = text.lower()
    for pat, key in PALETTE_RULES:
        if re.search(pat, t):
            return key
    return "purple"


def _build_directions(styles: list[str], palette: str) -> list[str]:
    """推荐方向：按视觉特异性优先级生成，directions[0] 与调色板一致。"""
    d: list[str] = []
    if "赛博朋克" in styles: d.append("赛博朋克头像")
    if "像素风" in styles: d.append("像素游戏头像")
    if "二次元" in styles: d.append("二次元动漫头像")
    if "自然清新" in styles or palette == "nature": d.append("清新自然头像")
    if "治愈系" in styles: d.append("治愈猫猫头像")
    if "极简" in styles: d.append("极简 GitHub 头像")
    if "科技感" in styles or "未来感" in styles: d.append("赛博程序员头像")
    if not d: d.append("虚拟身份头像")
    return d


def analyze(text: str) -> Analysis:
    """主入口：分析用户输入，返回结构化需求。"""
    styles = _match(STYLE_RULES, text)
    if not styles:
        styles = ["个性化", "社交头像"]

    colors = _match(COLOR_RULES, text)
    if not colors:
        colors = ["智能配色"]

    subjects = _match(SUBJECT_RULES, text)
    if not subjects:
        subjects = ["虚拟人物"]

    usages = _match(USAGE_RULES, text)
    if not usages:
        usages = ["通用头像"]

    palette = _detect_palette(text)
    directions = _build_directions(styles, palette)

    # 负向关键词：明确要避免的内容
    negative_keywords = [
        "低清晰度", "版权不明", "复杂背景", "水印", "文字", "logo",
        "模糊", "多余手指", "低质量",
    ]

    return Analysis(
        styles=styles,
        colors=colors,
        subjects=subjects,
        usages=usages,
        directions=directions,
        negative_keywords=negative_keywords,
    )


def detect_palette(text: str) -> str:
    """供 image_generator 使用的调色板 key。"""
    return _detect_palette(text)
