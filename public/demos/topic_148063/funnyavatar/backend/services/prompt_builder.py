"""Prompt 构造：根据用户输入和需求分析，生成图像生成 Prompt。

输出英文 Prompt + negative prompt，自动补充头像生成的通用修饰词。
"""
from __future__ import annotations

from schemas import Analysis


# 风格 / 颜色 / 主体 / 用途 的中英文映射
STYLE_EN = {
    "赛博朋克": "cyberpunk",
    "科技感": "tech style",
    "未来感": "futuristic",
    "治愈系": "healing, soft and cute",
    "极简": "minimalist",
    "像素风": "pixel art",
    "游戏风": "game art style",
    "二次元": "anime style",
    "职业头像": "professional avatar",
    "团队头像": "team avatar",
    "个性化": "personalized",
    "社交头像": "social avatar",
}

COLOR_EN = {
    "蓝色": "blue",
    "紫色": "purple",
    "粉色": "pink",
    "黑白": "black and white",
    "绿色": "green",
    "高饱和": "high saturation",
    "暖色": "warm tone",
    "冷色": "cool tone",
    "智能配色": "harmonious color palette",
}

SUBJECT_EN = {
    "猫猫": "cat",
    "狗狗": "dog",
    "机器人": "robot",
    "程序员": "programmer",
    "设计师": "designer",
    "AI 开发者": "AI developer",
    "虚拟人物": "virtual character",
    "动漫角色": "anime character",
    "植物": "plant",
}

USAGE_EN = {
    "微信": "WeChat",
    "QQ": "QQ",
    "GitHub": "GitHub",
    "博客": "blog",
    "Discord": "Discord",
    "Telegram": "Telegram",
    "论坛": "forum",
    "游戏": "game",
    "社交平台": "social platform",
    "个人主页": "personal homepage",
    "通用头像": "general profile",
}

# 头像通用修饰词：保证生成结果适合作为头像（已内联到 build_prompt 的 fragments 中）

# 负向 prompt：明确要避免的内容
DEFAULT_NEGATIVE = [
    "blurry", "low quality", "extra fingers", "watermark",
    "text", "logo", "copyright character", "complex background",
    "multiple people", "cropped",
]


def _map_list(items: list[str], table: dict[str, str]) -> list[str]:
    return [table.get(x, x) for x in items]


def build_prompt(text: str, analysis: Analysis) -> tuple[str, str]:
    """构造图像生成 Prompt。

    返回 (prompt, negative_prompt)。
    """
    style_parts = _map_list(analysis.styles, STYLE_EN)
    color_parts = _map_list(analysis.colors, COLOR_EN)
    subject_parts = _map_list(analysis.subjects, SUBJECT_EN)
    usage_parts = _map_list(analysis.usages, USAGE_EN)

    fragments: list[str] = []
    fragments.append("a square avatar illustration")
    if subject_parts:
        fragments.append(f"of a {', '.join(subject_parts)}")
    if style_parts:
        fragments.append(f"in {', '.join(style_parts)} style")
    if color_parts:
        fragments.append(f"with {', '.join(color_parts)} color palette")
    fragments.append("centered composition, clean background, high detail, sharp focus")
    fragments.append(f"suitable for {', '.join(usage_parts)} profile photo")
    fragments.append("square image, no text, no watermark, trending art style, 4k")

    prompt = ", ".join(fragments)
    negative_prompt = ", ".join(DEFAULT_NEGATIVE)
    return prompt, negative_prompt


def build_search_query(text: str, analysis: Analysis) -> str:
    """根据中文描述生成英文搜索关键词，用于头像搜索。"""
    parts: list[str] = []
    subject_parts = _map_list(analysis.subjects, SUBJECT_EN)
    style_parts = _map_list(analysis.styles, STYLE_EN)

    if subject_parts:
        parts.append(subject_parts[0])
    if style_parts:
        parts.append(style_parts[0])
    parts.append("avatar")
    return " ".join(parts[:3])
