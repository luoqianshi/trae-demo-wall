"""UI 层样式常量 - ReadMate 设计系统（浅色高对比度）

严格遵循 readmate-ui-design 技能规范的色板、字号、圆角、间距 token。
老大反馈深色玻璃质感看不清，故改为浅色暖白底 + 深青主色 + 深灰文字，
保证在各种显示器上都有足够对比度（WCAG AA 标准）。
"""

# ============ 设计令牌（Design Tokens）============
# 三层灰阶基底（浅色版）
_BG_BASE = "#f5f2eb"           # 最底层（暖灰白）
_BG_PANEL = "#ffffff"          # 答案面板背景（纯白，最高对比度）
_BG_ELEVATED = "#ffffff"       # 悬浮卡片 / 二级容器 / 代码块底色
_BG_INPUT = "#ffffff"
_BG_INPUT_FOCUS = "#f0f4f8"

# 品牌主色（深青色，浅色底上更清晰）
_ACCENT = "#0d7377"
_ACCENT_HOVER = "#149ca1"
_ACCENT_PRESS = "#0a5c60"
_ACCENT_SOFT = "rgba(13,115,119,0.12)"
_ACCENT_SOFT_HOVER = "rgba(13,115,119,0.22)"
_ACCENT_BORDER = "rgba(13,115,119,0.30)"
_ACCENT_BORDER_STRONG = "rgba(13,115,119,0.55)"

# 文字色（深色，确保可读性）
_TEXT_PRIMARY = "#1a1a1a"
_TEXT_SECONDARY = "#4a4a4a"
_TEXT_MUTED = "#6b6b6b"
_TEXT_ON_ACCENT = "#ffffff"

# 语义色
_SUCCESS = "#2a9d5c"
_WARNING = "#c78f00"
_ERROR = "#e04e4e"
_INFO = "#2b6cb0"

# 边框
_BORDER_SUBTLE = "rgba(0,0,0,0.08)"
_BORDER_DEFAULT = "rgba(13,115,119,0.25)"

# 渐变（深青系）
_GRADIENT_ACCENT = "qlineargradient(x1:0, y1:0, x2:1, y2:1, stop:0 #0d7377, stop:1 #149ca1)"
_GRADIENT_HOVER = "qlineargradient(x1:0, y1:0, x2:1, y2:1, stop:0 #149ca1, stop:1 #1ab3b8)"

# 字体栈
_FONT_CN = '"Microsoft YaHei UI", "PingFang SC", "Noto Sans CJK SC"'
_FONT_EN = '"Inter", "Segoe UI", system-ui'
_FONT_MONO = '"Consolas", "Monaco", "JetBrains Mono", monospace'


# ============ 浮动按钮容器（floatContainer）============
STYLE_FLOAT_CONTAINER = """
QFrame#floatContainer {
    background-color: rgba(250,248,245,0.96);
    border: 1px solid %s;
    border-radius: 12px;
}
""" % _ACCENT_BORDER


# ============ 浮动按钮（floatBtn）============
STYLE_FLOAT_BTN = """
QPushButton#floatBtn {
    background-color: %s;
    color: %s;
    border: none;
    border-radius: 16px;
    padding: 7px 16px;
    font-size: 12px;
    font-weight: bold;
    font-family: %s;
}
QPushButton#floatBtn:hover {
    background-color: %s;
}
QPushButton#floatBtn:pressed {
    background-color: %s;
    padding-top: 8px;
}
""" % (_GRADIENT_ACCENT, _TEXT_ON_ACCENT, _FONT_CN, _GRADIENT_HOVER, _ACCENT_PRESS)


# ============ 动作按钮（actBtn）============
STYLE_ACTION_BTNS = """
QPushButton#actBtn {
    background-color: %s;
    color: %s;
    border: 1px solid %s;
    border-radius: 10px;
    padding: 4px 12px;
    font-size: 11px;
    font-weight: 500;
    font-family: %s;
}
QPushButton#actBtn:hover {
    background-color: %s;
    border-color: %s;
    color: %s;
}
QPushButton#actBtn:pressed {
    background-color: rgba(13,115,119,0.28);
}
""" % (_ACCENT_SOFT, _ACCENT, _ACCENT_BORDER, _FONT_CN,
       _ACCENT_SOFT_HOVER, _ACCENT_BORDER_STRONG, _ACCENT_HOVER)


# ============ 输入框 + 发送按钮（askInput / askBtn）============
STYLE_INPUT = """
QLineEdit#askInput {
    background-color: %s;
    color: %s;
    border: 1px solid %s;
    border-radius: 8px;
    padding: 5px 10px;
    font-size: 12px;
    font-family: %s;
    selection-background-color: rgba(13,115,119,0.30);
    selection-color: %s;
}
QLineEdit#askInput:hover {
    border-color: rgba(13,115,119,0.45);
    background-color: #f0f4f8;
}
QLineEdit#askInput:focus {
    border-color: %s;
    background-color: %s;
}
QPushButton#askBtn {
    background-color: %s;
    color: %s;
    border: none;
    border-radius: 8px;
    padding: 5px 14px;
    font-size: 12px;
    font-weight: bold;
    font-family: %s;
}
QPushButton#askBtn:hover {
    background-color: %s;
}
QPushButton#askBtn:pressed {
    background-color: %s;
}
QPushButton#askBtn:disabled {
    background-color: rgba(0,0,0,0.10);
    color: %s;
}
""" % (_BG_INPUT, _TEXT_PRIMARY, _ACCENT_BORDER, _FONT_CN, _TEXT_ON_ACCENT,
       _ACCENT_BORDER_STRONG, _BG_INPUT_FOCUS,
       _GRADIENT_ACCENT, _TEXT_ON_ACCENT, _FONT_CN,
       _GRADIENT_HOVER, _ACCENT_PRESS, _TEXT_MUTED)


# ============ 答案面板（answerPanel）============
STYLE_PANEL = """
QFrame#answerPanel {
    background-color: #ffffff;
    border: 1px solid %s;
    border-radius: 20px;
}
""" % _ACCENT_BORDER


# ============ 标题栏（titleBar）============
STYLE_TITLE_BAR = """
QFrame#titleBar {
    background-color: transparent;
    border: none;
    border-bottom: 1px solid %s;
    border-radius: 0;
}
QFrame#titleBar:hover {
    background-color: %s;
}
""" % (_ACCENT_BORDER, _ACCENT_SOFT)


# ============ 控制按钮（− □）============
STYLE_CTRL_BTN = """
QPushButton {
    background: transparent;
    color: %s;
    border: none;
    border-radius: 7px;
    font-size: 14px;
    font-weight: 700;
    padding: 0;
    font-family: %s;
}
QPushButton:hover {
    background-color: %s;
    color: %s;
}
QPushButton:pressed {
    background-color: %s;
}
""" % (_TEXT_MUTED, _FONT_CN, _ACCENT_SOFT, _ACCENT, _ACCENT_SOFT_HOVER)


# ============ Mock 演示模式提示条 ============
STYLE_MOCK_BANNER = """
QLabel#mockBanner {
    background-color: rgba(255, 193, 7, 0.22);
    color: #c78f00;
    border: 1px solid rgba(255, 193, 7, 0.55);
    border-radius: 6px;
    padding: 4px 10px;
    font-size: 11px;
    font-weight: 600;
    font-family: %s;
}
""" % _FONT_CN


# ============ 关闭按钮 × ============
STYLE_CLOSE_BTN = """
QPushButton {
    background: transparent;
    color: %s;
    border: none;
    font-size: 18px;
}
QPushButton:hover {
    color: %s;
}
QPushButton:pressed {
    color: #cc4747;
}
""" % (_TEXT_MUTED, _ERROR)


# ============ 正文区 QTextEdit ============
STYLE_BODY = """
QTextEdit#answerBody {
    background: transparent;
    color: %s;
    border: none;
    font-size: 13px;
    font-family: %s;
    selection-background-color: rgba(13,115,119,0.30);
    selection-color: %s;
}
QTextEdit#answerBody QScrollBar:vertical {
    background: transparent;
    width: 8px;
    margin: 0;
}
QTextEdit#answerBody QScrollBar::handle:vertical {
    background: rgba(13,115,119,0.35);
    border-radius: 4px;
    min-height: 30px;
}
QTextEdit#answerBody QScrollBar::handle:vertical:hover {
    background: rgba(13,115,119,0.55);
}
QTextEdit#answerBody QScrollBar::add-line:vertical,
QTextEdit#answerBody QScrollBar::sub-line:vertical {
    height: 0;
    background: none;
}
QTextEdit#answerBody QScrollBar::add-page:vertical,
QTextEdit#answerBody QScrollBar::sub-page:vertical {
    background: transparent;
}
""" % (_TEXT_PRIMARY, _FONT_CN, _TEXT_ON_ACCENT)


# ============ 设置对话框（settingsDialog）============
STYLE_SETTING_DIALOG = """
QDialog#settingsDialog {
    background-color: %s;
    border: 1px solid %s;
    border-radius: 14px;
}
""" % (_BG_PANEL, _ACCENT_BORDER)

STYLE_SETTING_TITLE = """
QLabel {
    color: %s;
    font-size: 14px;
    font-weight: 700;
    font-family: %s;
}
""" % (_TEXT_PRIMARY, _FONT_CN)

STYLE_SETTING_DESC = """
QLabel {
    color: %s;
    font-size: 11px;
    line-height: 1.4;
    font-family: %s;
}
""" % (_TEXT_SECONDARY, _FONT_CN)

STYLE_INPUT_SETTING = """
QLineEdit {
    background-color: %s;
    color: %s;
    border: 1px solid %s;
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 13px;
    font-family: %s;
    selection-background-color: rgba(13,115,119,0.30);
}
QLineEdit:focus {
    border: 1px solid %s;
    background-color: %s;
}
""" % (_BG_INPUT, _TEXT_PRIMARY, _BORDER_SUBTLE, _FONT_MONO,
       _ACCENT_BORDER_STRONG, _BG_INPUT_FOCUS)

STYLE_BTN_PRIMARY = """
QPushButton {
    background-color: %s;
    color: %s;
    border: none;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    padding: 0 16px;
    font-family: %s;
}
QPushButton:hover {
    background-color: %s;
}
QPushButton:pressed {
    background-color: %s;
}
""" % (_GRADIENT_ACCENT, _TEXT_ON_ACCENT, _FONT_CN, _GRADIENT_HOVER, _ACCENT_PRESS)

STYLE_BTN_SECONDARY = """
QPushButton {
    background-color: %s;
    color: %s;
    border: none;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    padding: 0 16px;
    font-family: %s;
}
QPushButton:hover {
    background-color: %s;
}
QPushButton:pressed {
    background-color: #e8e4dc;
}
""" % (_BG_ELEVATED, _TEXT_PRIMARY, _FONT_CN, _ACCENT_SOFT)