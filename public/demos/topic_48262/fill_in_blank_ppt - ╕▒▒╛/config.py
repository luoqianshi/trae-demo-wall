"""配置参数模块 - Loop Engineering 的目标定义层"""
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

CONFIG = {
    # 目标与输入
    "template_ppt": os.path.join(BASE_DIR, "template.pptx"),
    "input_doc": os.path.join(BASE_DIR, "test_data", "sample_input.txt"),
    "output_path": os.path.join(BASE_DIR, "output.pptx"),

    # 生成参数
    "font_path": None,
    "chars_per_page": None,  # None=自动计算（基于EMU精确测量）
    "ai_mode": "mixed",          # "manual" | "ai" | "mixed"
    "ai_provider": "openai",
    "ai_model": "gpt-4o-mini",
    "ai_api_key": os.environ.get("OPENAI_API_KEY", ""),
    "max_blanks_per_paragraph": 3,

    # Loop Engineering 收敛参数
    "max_retries": 3,
    "auto_fix": True,
    "memory_dir": os.path.join(BASE_DIR, ".memory"),
    "resume_from": None,

    # PPT 布局参数（从参考PPT提取）
    "slide_width_inch": 13.33,
    "slide_height_inch": 7.50,
    "content_textbox": {
        "left": 0.6654,
        "top": 1.6299,
        "width": 11.9961,
        "height": 5.2047,
        "margin_left": 0.1,   # lIns=91440 EMU (参考PPT实际值)
        "margin_right": 0.1,  # rIns=91440 EMU
        "margin_top": 0.05,   # tIns=45720 EMU
        "margin_bottom": 0.05, # bIns=45720 EMU
    },
    "title_textbox": {
        "left": 0.6654,
        "top": 0.6654,
        "width": 11.9961,
        "height": 0.7717,
    },
    "title_image": {
        "left": 10.75,
        "top": 5.66,
        "width": 2.58,
        "height": 1.84,
    },
    "font_size_pt": 32,
    "line_spacing_pct": 130,
    "space_after_pt": 10,  # 段后间距（与 ANSWER_LST_STYLE 的 spcAft=1000 一致）

    # 字体名称
    "title_font_name": "仓耳与墨 W02",
    "body_font_name": "仓耳渔阳体 W02",

    # 主题色
    "accent1_color": "4874CB",
}


def get_config(**overrides):
    """获取配置，支持运行时覆盖"""
    cfg = CONFIG.copy()
    cfg.update(overrides)
    return cfg
