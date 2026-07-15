"""
behavior_config.py — 行为认知引擎配置表

三张核心配置表：
1. APP_CATEGORIES — 应用名 → 分类 + 权重
2. KEYWORD_CATEGORIES — 关键词 → 分类 + 权重
3. THRESHOLDS — 所有阈值参数

所有规则可配置，可热更新。
"""

from typing import Dict, Optional

# ============================================================
# 活动分类（9 种）
# ============================================================

ACTIVITY_CATEGORIES = [
    "deep_work",              # 深度工作
    "light_work",             # 轻度工作
    "communication",          # 沟通交流
    "learning",               # 学习研究
    "entertainment_active",   # 主动娱乐
    "entertainment_passive",  # 被动娱乐
    "rest",                   # 休息
    "away",                   # 离开
    "unknown",                # 未知
]

CATEGORY_LABELS: Dict[str, str] = {
    "deep_work": "深度工作",
    "light_work": "轻度工作",
    "communication": "沟通交流",
    "learning": "学习研究",
    "entertainment_active": "主动娱乐",
    "entertainment_passive": "被动娱乐",
    "rest": "休息",
    "away": "离开",
    "unknown": "未知",
}

CATEGORY_COLORS: Dict[str, str] = {
    "deep_work": "#4A90D9",
    "light_work": "#7BB3E8",
    "communication": "#F5A623",
    "learning": "#9B7ED8",
    "entertainment_active": "#E57373",
    "entertainment_passive": "#EF9A9A",
    "rest": "#66BB6A",
    "away": "#BDBDBD",
    "unknown": "#E0E0E0",
}

CATEGORY_ICONS: Dict[str, str] = {
    "deep_work": "\U0001F4A1",
    "light_work": "\U0001F4DD",
    "communication": "\U0001F4AC",
    "learning": "\U0001F4DA",
    "entertainment_active": "\U0001F3AE",
    "entertainment_passive": "\U0001F3AC",
    "rest": "\U0001F37C",
    "away": "\U0001F4A4",
    "unknown": "\u2753",
}

# ============================================================
# 1. 应用分类表
# ============================================================

APP_CATEGORIES: Dict[str, str] = {
    # ---- 深度工作 ----
    "Code": "deep_work",
    "Visual Studio Code": "deep_work",
    "VSCode": "deep_work",
    "PyCharm": "deep_work",
    "IntelliJ IDEA": "deep_work",
    "WebStorm": "deep_work",
    "Figma": "deep_work",
    "Sketch": "deep_work",
    "Photoshop": "deep_work",
    "Adobe Photoshop": "deep_work",
    "Illustrator": "deep_work",
    "After Effects": "deep_work",
    "Blender": "deep_work",
    "Unity": "deep_work",
    "Unreal Engine": "deep_work",
    "Android Studio": "deep_work",
    "Xcode": "deep_work",
    "Terminal": "deep_work",
    "PowerShell": "deep_work",
    "cmd": "deep_work",
    "Windows Terminal": "deep_work",
    " iTerm": "deep_work",
    "Git": "deep_work",
    "GitHub Desktop": "deep_work",
    "Docker": "deep_work",

    # ---- 轻度工作 ----
    "Word": "light_work",
    "Excel": "light_work",
    "PowerPoint": "light_work",
    "WPS": "light_work",
    "WPS文字": "light_work",
    "WPS表格": "light_work",
    "WPS演示": "light_work",
    "Notion": "light_work",
    "Obsidian": "learning",
    "Typora": "light_work",
    "飞书文档": "light_work",
    "腾讯文档": "light_work",
    "石墨文档": "light_work",
    "语雀": "light_work",

    # ---- 学习研究 ----
    "Anki": "learning",
    "MarginNote": "learning",
    "GoodNotes": "learning",
    "Notability": "learning",
    "DevDocs": "learning",
    "Dash": "learning",

    # ---- 沟通交流 ----
    "微信": "communication",
    "WeChat": "communication",
    "飞书": "communication",
    "Lark": "communication",
    "钉钉": "communication",
    "DingTalk": "communication",
    "QQ": "communication",
    "Slack": "communication",
    "Discord": "communication",
    "Telegram": "communication",
    "Teams": "communication",
    "Microsoft Teams": "communication",
    "企业微信": "communication",
    "Outlook": "communication",
    "Foxmail": "communication",

    # ---- 被动娱乐 ----
    "Bilibili": "entertainment_passive",
    "哔哩哔哩": "entertainment_passive",
    "YouTube": "entertainment_passive",
    "Netflix": "entertainment_passive",
    "爱奇艺": "entertainment_passive",
    "优酷": "entertainment_passive",
    "腾讯视频": "entertainment_passive",
    "Spotify": "entertainment_passive",
    "网易云": "entertainment_passive",
    "网易云音乐": "entertainment_passive",
    "QQ音乐": "entertainment_passive",

    # ---- 主动娱乐 ----
    "抖音": "entertainment_active",
    "Douyin": "entertainment_active",
    "TikTok": "entertainment_active",
    "快手": "entertainment_active",
    "小红书": "entertainment_active",
    "Steam": "entertainment_active",
    "微博": "entertainment_active",
    "知乎": "entertainment_active",
    "Twitter": "entertainment_active",
    "Instagram": "entertainment_active",

    # ---- 浏览器（需根据标题再判断）----
    "Chrome": "unknown",
    "Google Chrome": "unknown",
    "Safari": "unknown",
    "Edge": "unknown",
    "Microsoft Edge": "unknown",
    "Firefox": "unknown",
    "Arc": "unknown",
    "Brave": "unknown",

    # ---- 系统工具 ----
    "资源管理器": "light_work",
    "Explorer": "light_work",
    "Finder": "light_work",
    "Settings": "light_work",
    "设置": "light_work",
    "计算器": "light_work",
    "Calculator": "light_work",
}


def classify_app(app_name: str) -> str:
    """根据应用名返回分类，支持模糊匹配"""
    if not app_name:
        return "unknown"
    # 精确匹配
    if app_name in APP_CATEGORIES:
        return APP_CATEGORIES[app_name]
    # 模糊匹配（包含关系）
    for key, cat in APP_CATEGORIES.items():
        if key.lower() in app_name.lower() or app_name.lower() in key.lower():
            return cat
    return "unknown"


# ============================================================
# 2. 关键词分类表
# ============================================================

KEYWORD_CATEGORIES: Dict[str, str] = {
    # 工作关键词
    "代码": "deep_work", "code": "deep_work", "编程": "deep_work",
    "设计": "deep_work", "原型": "deep_work", "UI": "deep_work",
    "API": "deep_work", "调试": "deep_work", "debug": "deep_work",
    "数据库": "deep_work", "server": "deep_work", "部署": "deep_work",
    "模型": "deep_work", "算法": "deep_work", "figma": "deep_work",

    # 轻度工作
    "文档": "light_work", "报告": "light_work", "总结": "light_work",
    "表格": "light_work", "PPT": "light_work", "演示": "light_work",
    "会议": "light_work", "纪要": "light_work", "计划": "light_work",
    "notion": "light_work", "笔记": "light_work",

    # 学习
    "教程": "learning", "课程": "learning", "学习": "learning",
    "文档": "learning", "research": "learning", "论文": "learning",
    "阅读": "learning", "study": "learning",

    # 沟通
    "消息": "communication", "聊天": "communication", "回复": "communication",
    "邮件": "communication", "email": "communication", "群": "communication",

    # 娱乐
    "视频": "entertainment_passive", "直播": "entertainment_passive",
    "音乐": "entertainment_passive", "播放": "entertainment_passive",
    "动漫": "entertainment_passive", "追剧": "entertainment_passive",

    "购物": "entertainment_active", "刷": "entertainment_active",
    "游戏": "entertainment_active", "直播": "entertainment_active",

    # 休息
    "休息": "rest", "吃饭": "rest", "午餐": "rest", "晚餐": "rest",
    "午休": "rest", "空闲": "rest",
}


def classify_keywords(keywords: list) -> str:
    """根据关键词列表返回最可能的分类"""
    if not keywords:
        return "unknown"
    counts: Dict[str, int] = {}
    for kw in keywords:
        kw_lower = kw.lower().strip()
        for key, cat in KEYWORD_CATEGORIES.items():
            if key.lower() in kw_lower:
                counts[cat] = counts.get(cat, 0) + 1
                break
    if not counts:
        return "unknown"
    return max(counts, key=counts.get)


# ============================================================
# 3. 阈值参数表
# ============================================================

THRESHOLDS = {
    "work_continuity": {
        "high": 0.8,
        "medium": 0.6,
        "low": 0.4,
        "same_app_min_duration": 600,       # 10 分钟
        "short_switch_threshold": 120,       # 2 分钟
        "keyword_overlap_high": 0.6,
        "keyword_overlap_medium": 0.4,
        "communication_interruption_max": 300,  # 5 分钟
    },
    "multi_task": {
        "l4": 0.7,
        "l3": 0.5,
        "l2": 0.3,
        "very_high_switch_rate": 8,
        "high_switch_rate": 4,
        "low_switch_rate": 2,
        "no_focus_duration": 600,
        "long_focus_duration": 2700,        # 45 分钟
    },
    "rest": {
        "active_min_duration": 180,         # 3 分钟
        "passive_min_duration": 300,        # 5 分钟
        "micro_max_duration": 180,          # 3 分钟
        "meal_time_window": 90,
    },
    "away": {
        "afk_threshold": 90,                # 90 秒
        "short_away": 180,                  # 3 分钟
        "medium_away": 600,                 # 10 分钟
        "long_away": 1200,                  # 20 分钟
    },
    "time": {
        "breakfast_start": 7,
        "breakfast_end": 9,
        "lunch_start": 11.5,
        "lunch_end": 13,
        "dinner_start": 17.5,
        "dinner_end": 19,
        "work_start": 9,
        "work_end": 18,
        "sleep_start": 23,
        "sleep_end": 7,
    },
    "biological": {
        "hunger_after_meal_hours": 4,
        "fatigue_per_hour": 0.15,
        "rest_recovery": 0.3,
        "afternoon_dip_start": 13,
        "afternoon_dip_end": 15,
        "late_night_start": 23,
        "max_consecutive_work_hours": 4,
    },
    "ai_review": {
        "confidence_threshold": 0.8,        # 低于此值交 AI 复核（设计文档原则一：>0.8 直接输出）
        "max_calls_per_2min": 1,            # 2 分钟内最多调用 1 次
        "cache_duration": 300,              # 缓存 5 分钟
        "consecutive_low_confidence": 3,    # 连续 3 次低置信度触发
    },
}


def get_threshold(section: str, key: str, default=None):
    """获取阈值参数"""
    return THRESHOLDS.get(section, {}).get(key, default)
