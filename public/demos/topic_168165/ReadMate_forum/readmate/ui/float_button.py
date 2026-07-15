"""浮动按钮 - 用户选中文本后出现，提供预设动作和自定义提问入口"""
from typing import Optional

from PyQt6.QtWidgets import (
    QWidget, QPushButton, QLabel, QVBoxLayout, QHBoxLayout,
    QApplication, QFrame, QLineEdit
)
from PyQt6.QtCore import Qt, QTimer, QPropertyAnimation, QEasingCurve, QRect
from PyQt6.QtGui import QColor, QCursor, QKeyEvent

from .styles import (
    STYLE_FLOAT_BTN, STYLE_ACTION_BTNS, STYLE_INPUT, STYLE_FLOAT_CONTAINER
)
from .answer_panel import AnswerPanel
from ..core.logger import get_logger
from ..core.config import get_config

logger = get_logger(__name__)


class FloatButton(QWidget):
    ACTIONS = ["解释", "翻译", "总结", "分析"]

    def __init__(self, selected_text: str, app: QApplication, on_panel_created=None):
        super().__init__()
        self.selected_text = selected_text
        self._app = app
        self._on_panel_created = on_panel_created
        self._answer_panel: Optional["AnswerPanel"] = None
        self._destroyed = False
        self._init_ui()
        self._timer = QTimer(self)
        self._timer.setSingleShot(True)
        self._timer.timeout.connect(self.close_self)
        cfg = get_config()
        self._timer.start(int(cfg.get("popup_timeout", 5.0) * 1000))

    def _init_ui(self):
        self.setWindowFlags(
            Qt.WindowType.FramelessWindowHint
            | Qt.WindowType.WindowStaysOnTopHint
            | Qt.WindowType.Tool
            | Qt.WindowType.NoDropShadowWindowHint
        )
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground)
        # 关键：显示时不激活窗口，不抢走原应用焦点
        self.setAttribute(Qt.WidgetAttribute.WA_ShowWithoutActivating)
        self.setFocusPolicy(Qt.FocusPolicy.NoFocus)

        container = QFrame(self)
        container.setObjectName("floatContainer")
        container.setStyleSheet(STYLE_FLOAT_CONTAINER)
        # 移除 QGraphicsDropShadowEffect：
        # PyQt6 在 WA_TranslucentBackground 启用时 + QGraphicsDropShadowEffect 一起工作，
        # 会在容器内部额外画一个黑色矩形作为阴影"源"，导致浮动按钮显示为黑色背景版。
        # 靠容器本身的 1px 边框 + 浮窗本身在桌面上的层级，已经足够分离背景。

        outer = QVBoxLayout(self)
        outer.setContentsMargins(0, 0, 0, 0)
        outer.addWidget(container)

        layout = QVBoxLayout(container)
        layout.setContentsMargins(6, 6, 6, 6)
        layout.setSpacing(5)

        self._btn = QPushButton("问一问", container)
        self._btn.setObjectName("floatBtn")
        self._btn.setStyleSheet(STYLE_FLOAT_BTN)
        self._btn.setCursor(QCursor(Qt.CursorShape.PointingHandCursor))
        self._btn.clicked.connect(self._toggle_actions)
        self._btn.setFixedHeight(34)
        layout.addWidget(self._btn)

        self._action_row = QWidget(container)
        action_layout = QVBoxLayout(self._action_row)
        action_layout.setContentsMargins(2, 0, 2, 0)
        action_layout.setSpacing(4)

        # 预设动作按钮行
        btn_row = QWidget(self._action_row)
        btn_layout = QHBoxLayout(btn_row)
        btn_layout.setContentsMargins(0, 0, 0, 0)
        btn_layout.setSpacing(4)
        for act in self.ACTIONS:
            ab = QPushButton(act, btn_row)
            ab.setObjectName("actBtn")
            ab.setStyleSheet(STYLE_ACTION_BTNS)
            ab.setCursor(QCursor(Qt.CursorShape.PointingHandCursor))
            ab.setFixedHeight(28)
            ab.clicked.connect(lambda _, a=act: self._ask(a))
            btn_layout.addWidget(ab)
        action_layout.addWidget(btn_row)

        # 自定义提问输入行
        custom_row = QWidget(self._action_row)
        custom_layout = QHBoxLayout(custom_row)
        custom_layout.setContentsMargins(0, 0, 0, 0)
        custom_layout.setSpacing(4)
        self._custom_input = QLineEdit(custom_row)
        self._custom_input.setObjectName("askInput")
        self._custom_input.setStyleSheet(STYLE_INPUT)
        self._custom_input.setPlaceholderText("自定义提问…")
        self._custom_input.setFixedHeight(28)
        self._custom_input.returnPressed.connect(self._ask_custom)
        custom_layout.addWidget(self._custom_input, 1)
        self._custom_btn = QPushButton("→", custom_row)
        self._custom_btn.setObjectName("askBtn")
        self._custom_btn.setStyleSheet(STYLE_INPUT)
        self._custom_btn.setFixedSize(36, 28)
        self._custom_btn.setCursor(QCursor(Qt.CursorShape.PointingHandCursor))
        self._custom_btn.clicked.connect(self._ask_custom)
        custom_layout.addWidget(self._custom_btn)
        action_layout.addWidget(custom_row)

        self._action_row.setVisible(False)
        layout.addWidget(self._action_row)

        self.adjustSize()
        self._actions_shown = False

    def _toggle_actions(self):
        self._actions_shown = not self._actions_shown
        self._action_row.setVisible(self._actions_shown)
        self.adjustSize()
        if self._actions_shown:
            self._reposition()
            self._timer.stop()
        else:
            self._timer.start(3000)

    def _reposition(self):
        screen = self._app.primaryScreen().availableGeometry()
        w = self.width()
        h = self.height()
        x = self.x()
        y = self.y()
        if x + w > screen.right():
            x = screen.right() - w
        if y + h > screen.bottom():
            y = self.y() - h - 40
        if x < screen.left():
            x = screen.left() + 8
        if y < screen.top():
            y = screen.top() + 8
        self.move(x, y)

    def _ask(self, action: str):
        self._timer.stop()
        # 顶层窗口的 geometry() 已经是屏幕坐标，直接使用，不要再 mapToGlobal
        btn_global_rect = self.geometry()
        
        self._destroyed = True
        self.hide()
        
        self._answer_panel = AnswerPanel(
            self.selected_text, action,
            origin_rect=btn_global_rect,
            app=self._app,
        )
        if self._on_panel_created:
            self._on_panel_created(self._answer_panel)
        self._answer_panel.start_expand()

    def _ask_custom(self):
        """自定义提问"""
        question = self._custom_input.text().strip()
        if not question:
            return
        self._timer.stop()
        btn_global_rect = self.geometry()
        
        self._destroyed = True
        self.hide()
        
        self._answer_panel = AnswerPanel(
            self.selected_text, "自定义",
            origin_rect=btn_global_rect,
            app=self._app,
            custom_question=question,
        )
        if self._on_panel_created:
            self._on_panel_created(self._answer_panel)
        self._answer_panel.start_expand()

    def schedule_close(self, delay_ms: int):
        """延迟关闭；如果已经展开动作按钮则不关闭"""
        if self._destroyed or self._actions_shown:
            return
        self._timer.stop()
        self._timer.start(delay_ms)

    def cancel_close(self):
        self._timer.stop()

    def close_self(self):
        if self._destroyed:
            return
        self._destroyed = True
        self._timer.stop()
        self.hide()
        self.deleteLater()

    def keyPressEvent(self, event: QKeyEvent):
        if event.key() == Qt.Key.Key_Escape:
            self.close_self()
        else:
            super().keyPressEvent(event)

    def focusOutEvent(self, event):
        # 不再因失去焦点而自动关闭
        # （点击按钮/输入框会触发 focusOut，但此时不应关闭）
        super().focusOutEvent(event)

    def show_at(self, x: int, y: int):
        self.move(x, y)
        # 不调用 activateWindow()，避免抢走原应用焦点
        self.show()
        self.raise_()
        # 临时诊断：禁用 DWM 毛玻璃 API（ctypes 私有调用在某些 Windows 环境下会栈溢出崩溃）
        # self._enable_blur_behind()
        self.setWindowOpacity(0.0)
        self._fade_in = QPropertyAnimation(self, b"windowOpacity", self)
        self._fade_in.setDuration(180)
        self._fade_in.setStartValue(0.0)
        self._fade_in.setEndValue(1.0)
        self._fade_in.setEasingCurve(QEasingCurve.Type.OutCubic)
        self._fade_in.start(QPropertyAnimation.DeletionPolicy.KeepWhenStopped)
        QTimer.singleShot(10, self._reposition)

    def _enable_blur_behind(self):
        """Windows 10/11: 调用 DWM API 启用真毛玻璃。失败时静默降级为 QSS 半透明。"""
        try:
            import ctypes

            class ACCENTPOLICY(ctypes.Structure):
                _fields_ = [
                    ("nAccentState", ctypes.c_int),
                    ("nFlags", ctypes.c_uint),
                    ("nColor", ctypes.c_uint),
                    ("nAnimationId", ctypes.c_uint),
                ]

            class WINCOMPATTRDATA(ctypes.Structure):
                _fields_ = [
                    ("nAttribute", ctypes.c_int),
                    ("pData", ctypes.c_void_p),
                    ("ulDataSize", ctypes.c_ulong),
                ]

            attr = 19
            # ARGB：alpha=0xB8(≈72% 与 QSS 一致)，RGB=暖灰黑 #1e2026
            for accent_state in (4, 3):
                accent = ACCENTPOLICY(
                    nAccentState=accent_state,
                    nFlags=0,
                    nColor=0xB826201E,
                    nAnimationId=0,
                )
                data = WINCOMPATTRDATA(
                    nAttribute=attr,
                    pData=ctypes.cast(ctypes.pointer(accent), ctypes.c_void_p),
                    ulDataSize=ctypes.sizeof(accent),
                )
                hwnd = int(self.winId())
                result = ctypes.windll.user32.SetWindowCompositionAttribute(
                    hwnd, ctypes.byref(data)
                )
                if result:
                    return
        except Exception:
            pass
