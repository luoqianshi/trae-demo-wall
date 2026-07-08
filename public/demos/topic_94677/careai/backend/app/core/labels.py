"""
Unified label system - Single source of truth for all care labels.

All labels, risk levels, descriptions, and categories are defined here.
inference.py, training.py, frontend, and seed.py all import from this file.

Privacy: All labels and processing are local. No cloud API calls.
Supports multi-label annotation (comma-separated).

Note: Only single-frame compatible labels are included.
Labels requiring video sequence (temporal) to judge are excluded:
  - 翻身(动态)  - needs to see transition A->B
  - 试图起身    - needs to see the action attempt
  - 挣扎/躁动   - needs to see repeated movement
  - 异常静止    - needs duration info ("how long still")
  - 攀爬护栏    - dynamic climbing action
  - 失禁        - very hard to detect from single image
"""

# Multi-dimension label categories for UI grouping
LABEL_CATEGORIES = [
    {
        "group": "体态",
        "color": "#3498DB",
        "items": [
            "仰卧",
            "左侧卧",
            "右侧卧",
            "俯卧",
            "半坐/半躺",
            "坐姿(床上)",
            "坐姿(椅子/轮椅)",
            "站立",
            "跪姿/爬行",
            "蜷缩",
        ]
    },
    {
        "group": "被子",
        "color": "#9B59B6",
        "items": [
            "被子遮盖(正常)",
            "被子盖头",
            "被子盖脚",
            "部分遮盖",
            "踢被/无遮盖",
        ]
    },
    {
        "group": "位置",
        "color": "#1ABC9C",
        "items": [
            "在床上",
            "床边(危险)",
            "椅子/轮椅上",
            "地面/床外",
            "空床",
        ]
    },
    {
        "group": "异常",
        "color": "#E74C3C",
        "items": [
            "面部被遮/窒息",
            "上半身探出床",
            "腿部探出床",
            "跌落/坠床",
        ]
    },
    {
        "group": "隐私",
        "color": "#8B0000",
        "items": [
            "上身裸露",
            "下身裸露",
            "更衣中",
        ]
    },
    {
        "group": "其他",
        "color": "#95A5A6",
        "items": [
            "其他异常",
            "模糊/无法判断",
        ]
    },
]

# Flat list of all labels (for training, validation, etc.)
ALL_LABELS = []
for cat in LABEL_CATEGORIES:
    ALL_LABELS.extend(cat["items"])

# Privacy labels: these are not used for model training.
# Frames containing only privacy labels are excluded from training;
# frames with privacy + other labels are kept, ignoring the privacy tags.
PRIVACY_LABELS = {"上身裸露", "下身裸露", "更衣中"}

# Also accept legacy labels for backward compatibility
LEGACY_LABELS = {
    "面部被遮", "异常静止", "翻身", "坐起", "疲惫/无力",
    "正常仰卧", "被子遮盖(正常)", "正常活动",
    "试图攀爬护栏", "试图起身", "挣扎/躁动", "异常静止(久不动)",
    "攀爬护栏", "失禁", "翻身(动态)", "坐于床边(危险)",
    "站立(正常)", "坐姿(椅子/轮椅)",
}
ALL_LABELS.extend([l for l in LEGACY_LABELS if l not in ALL_LABELS])

# Risk level mapping: label -> P0/P1/P2/P3
RISK_MAP = {}
_URGENT = {
    "跌落/坠床", "面部被遮/窒息", "上半身探出床",
    "床边(危险)", "地面/床外",
    # Legacy urgent
    "面部被遮", "异常静止", "试图攀爬护栏", "试图起身",
    "挣扎/躁动", "异常静止(久不动)", "攀爬护栏", "失禁",
    "腿部探出床",
}
_NORMAL = {
    "仰卧", "被子遮盖(正常)", "在床上", "椅子/轮椅上", "空床",
    # Legacy normal
    "正常仰卧", "正常活动", "站立(正常)", "坐姿(椅子/轮椅)",
}
for label in ALL_LABELS:
    if label in _URGENT:
        RISK_MAP[label] = "P0"
    elif label in _NORMAL:
        RISK_MAP[label] = "P3"
    else:
        RISK_MAP[label] = "P2"


def get_risk_level(label: str) -> str:
    """Get risk level for a label. Returns P2 for unknown labels.
    Supports comma-separated multi-label: returns highest risk among all labels."""
    if not label:
        return "P2"
    parts = [p.strip() for p in label.split(",") if p.strip()]
    if not parts:
        return "P2"
    # Return the most urgent risk level
    risk_order = {"P0": 0, "P1": 1, "P2": 2, "P3": 3}
    best = "P3"
    for p in parts:
        r = RISK_MAP.get(p, "P2")
        if risk_order.get(r, 2) < risk_order.get(best, 2):
            best = r
    return best


def get_description(label: str) -> str:
    """Get description for a label. Supports comma-separated multi-label."""
    if not label:
        return ""
    parts = [p.strip() for p in label.split(",") if p.strip()]
    return " | ".join(parts)


def is_normal(label: str) -> bool:
    """Check if a label (or all labels in a comma-separated string) represents normal state."""
    if not label:
        return False
    parts = [p.strip() for p in label.split(",") if p.strip()]
    if not parts:
        return False
    # Normal only if ALL labels are normal
    return all(p in _NORMAL for p in parts)


def is_urgent(label: str) -> bool:
    """Check if any label requires immediate notification.
    Supports comma-separated multi-label: urgent if ANY label is urgent."""
    if not label:
        return False
    parts = [p.strip() for p in label.split(",") if p.strip()]
    return any(p in _URGENT for p in parts)


def is_privacy(label: str) -> bool:
    """Check if a comma-separated label string contains any privacy label.
    Returns True if ANY of the labels is a privacy label."""
    if not label:
        return False
    parts = [p.strip() for p in label.split(",") if p.strip()]
    return any(p in PRIVACY_LABELS for p in parts)


def validate_label(label: str) -> bool:
    """Check if a label is valid.
    Supports comma-separated multi-label: all parts must be valid.
    Also accepts custom labels (non-empty strings not in predefined list)."""
    if not label or not label.strip():
        return False
    parts = [p.strip() for p in label.split(",") if p.strip()]
    if not parts:
        return False
    # All parts must be in ALL_LABELS (predefined) or be non-empty custom labels
    for p in parts:
        if not p:
            return False
    return True


def get_labels_for_frontend() -> list:
    """Return label categories for frontend rendering."""
    return LABEL_CATEGORIES
