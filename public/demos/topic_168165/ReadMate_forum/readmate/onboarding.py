"""ReadMate 用户引导模块 - 首启 3 步提示 + 未配 Key 提示 + 半透明蒙层"""
from PyQt6.QtWidgets import (
    QWidget, QDialog, QLabel, QPushButton, QVBoxLayout, QHBoxLayout,
    QGraphicsOpacityEffect, QApplication
)
from PyQt6.QtCore import (
    Qt, QTimer, QPropertyAnimation, QEasingCurve, QPoint, QRect, QSize
)
from PyQt6.QtGui import (
    QPainter, QPainterPath, QRegion, QColor, QFont, QPen, QBrush,
    QMouseEvent
)


# ========== 1. 首启 3 步提示卡 ==========

class OnboardingTipCard(QWidget):
    """底部浮出的引导卡 - iOS 风格白卡 + iOS 蓝按钮"""

    def __init__(self, step_num, total, title, desc, parent=None):
        super().__init__(parent)
        self._step_num = step_num
        self._total = total

        # 窗口设置 - 与答案面板同款（白卡 + 圆角 mask）
        self.setWindowFlags(
            Qt.WindowType.FramelessWindowHint
            | Qt.WindowType.WindowStaysOnTopHint
            | Qt.WindowType.Tool
            | Qt.WindowType.NoDropShadowWindowHint
        )
        self.setAttribute(Qt.WidgetAttribute.WA_ShowWithoutActivating)
        self.setAttribute(Qt.WidgetAttribute.WA_OpaquePaintEvent, True)
        self.setAutoFillBackground(True)

        self.setObjectName("onboardingTip")
        self.setStyleSheet("""
            QWidget#onboardingTip {
                background-color: #ffffff;
                border: 1px solid rgba(0, 0, 0, 0.06);
                border-radius: 14px;
            }
            QLabel {
                color: #1a1a1a;
                font-family: "Segoe UI Variable", "Segoe UI", "Microsoft YaHei UI", system-ui;
            }
            QPushButton#closeBtn {
                background: transparent;
                color: #6b7280;
                border: none;
                font-size: 14px;
                padding: 4px 8px;
            }
            QPushButton#closeBtn:hover {
                color: #1a1a1a;
            }
        """)

        self.setFixedSize(380, 140)
        self._apply_mask()

        # 初始化内容
        layout = QVBoxLayout(self)
        layout.setContentsMargins(20, 16, 16, 16)
        layout.setSpacing(8)

        # 顶部：步骤标签 + 关闭按钮
        top = QHBoxLayout()
        top.setSpacing(8)
        step_label = QLabel(f"第 {step_num}/{total} 步", self)
        step_label.setStyleSheet("color: #007AFF; font-size: 11px; font-weight: 700;")
        top.addWidget(step_label)
        top.addStretch(1)

        close_btn = QPushButton("×", self)
        close_btn.setObjectName("closeBtn")
        close_btn.setFixedSize(24, 24)
        close_btn.clicked.connect(self._on_close)
        top.addWidget(close_btn)
        layout.addLayout(top)

        # 标题
        title_label = QLabel(title, self)
        title_label.setStyleSheet("font-size: 15px; font-weight: 700;")
        title_label.setWordWrap(True)
        layout.addWidget(title_label)

        # 描述
        desc_label = QLabel(desc, self)
        desc_label.setStyleSheet("color: #6b7280; font-size: 12px;")
        desc_label.setWordWrap(True)
        layout.addWidget(desc_label)

        layout.addStretch(1)

        # 底部进度点
        dots = QHBoxLayout()
        dots.setSpacing(6)
        for i in range(1, total + 1):
            dot = QLabel(self)
            if i == step_num:
                dot.setStyleSheet(
                    "background-color: #007AFF; border-radius: 3px;"
                )
                dot.setFixedSize(18, 6)
            else:
                dot.setStyleSheet(
                    "background-color: rgba(0, 0, 0, 0.15); border-radius: 3px;"
                )
                dot.setFixedSize(6, 6)
            dots.addWidget(dot)
        dots.addStretch(1)
        layout.addLayout(dots)

        # 入场动画 - 从底部 200ms 滑入
        self._fade_anim = None
        self._fade_in()

    def _apply_mask(self):
        radius = 14
        rect = self.rect()
        path = QPainterPath()
        path.addRoundedRect(0, 0, rect.width(), rect.height(), radius, radius)
        self.setMask(QRegion(path.toFillPolygon().toPolygon()))

    def resizeEvent(self, event):
        super().resizeEvent(event)
        self._apply_mask()

    def _fade_in(self):
        """淡入 + 滑入动画"""
        effect = QGraphicsOpacityEffect(self)
        self.setGraphicsEffect(effect)
        self._fade_anim = QPropertyAnimation(effect, b"opacity")
        self._fade_anim.setDuration(280)
        self._fade_anim.setStartValue(0.0)
        self._fade_anim.setEndValue(1.0)
        self._fade_anim.setEasingCurve(QEasingCurve.Type.OutCubic)
        self._fade_anim.start()

    def _fade_out(self, callback=None):
        """淡出动画"""
        effect = self.graphicsEffect()
        if effect is None:
            effect = QGraphicsOpacityEffect(self)
            self.setGraphicsEffect(effect)
        anim = QPropertyAnimation(effect, b"opacity")
        anim.setDuration(220)
        anim.setStartValue(1.0)
        anim.setEndValue(0.0)
        anim.setEasingCurve(QEasingCurve.Type.InCubic)
        if callback:
            anim.finished.connect(callback)
        anim.start()
        self._fade_anim = anim

    def _on_close(self):
        self._fade_out(self.close)


class OnboardingFlow:
    """首启引导流程控制器 - 顺序播放 3 步提示"""

    def __init__(self, parent=None):
        self._parent = parent
        self._steps = [
            ("选中文本试试",
             "在任何应用里用鼠标选中一段文字（5-30 词），ReadMate 会在 0.5 秒内自动浮出「问一问」按钮。"),
            ("点 Ask ReadMate 提问",
             "浮窗上点击「Ask ReadMate」或 4 个快捷动作（解释 / 翻译 / 总结 / 分析）即可触发 AI 回答。"),
            ("AI 答案 + 追问",
             "答案面板会从浮动按钮位置优雅展开，逐字流式输出。继续在底部输入框追问，AI 会保留上下文。"),
        ]
        self._idx = 0
        self._card = None
        self._timer = QTimer()
        self._timer.setSingleShot(True)
        self._timer.timeout.connect(self._next)

    def start(self):
        self._idx = 0
        self._show_current()

    def _show_current(self):
        if self._idx >= len(self._steps):
            return
        title, desc = self._steps[self._idx]
        self._card = OnboardingTipCard(
            self._idx + 1, len(self._steps), title, desc, self._parent
        )
        # 屏幕底部居中
        screen = QApplication.primaryScreen()
        if screen:
            geo = screen.availableGeometry()
            x = geo.x() + (geo.width() - self._card.width()) // 2
            y = geo.y() + geo.height() - self._card.height() - 80
            self._card.move(x, y)
        self._card.show()
        # 5.5 秒后下一步
        self._timer.start(5500)

    def _next(self):
        if self._card is not None:
            old = self._card
            self._card = None
            old._fade_out(old.deleteLater)
        self._idx += 1
        if self._idx < len(self._steps):
            # 200ms 间隔
            QTimer.singleShot(200, self._show_current)


# ========== 2. 未配 Key 主动提示 ==========

class ApiKeyHintBubble(QWidget):
    """浮动按钮上的小红点 + 提示气泡"""

    def __init__(self, anchor_widget, parent=None):
        super().__init__(parent)
        self._anchor = anchor_widget

        self.setWindowFlags(
            Qt.WindowType.FramelessWindowHint
            | Qt.WindowType.WindowStaysOnTopHint
            | Qt.WindowType.Tool
            | Qt.WindowType.NoDropShadowWindowHint
        )
        self.setAttribute(Qt.WidgetAttribute.WA_ShowWithoutActivating)
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground, True)

        self.setFixedSize(260, 70)
        self._init_ui()
        self._position_to_anchor()
        self._fade_in()

    def _init_ui(self):
        layout = QHBoxLayout(self)
        layout.setContentsMargins(12, 10, 12, 10)
        layout.setSpacing(10)

        # 红点
        dot = QLabel("●", self)
        dot.setStyleSheet("color: #FF453A; font-size: 16px;")
        layout.addWidget(dot)

        # 文字
        text_layout = QVBoxLayout()
        text_layout.setSpacing(2)
        title = QLabel("先配置 API Key", self)
        title.setStyleSheet(
            "color: #1a1a1a; font-size: 12px; font-weight: 700;"
            "font-family: 'Segoe UI Variable', 'Segoe UI', 'Microsoft YaHei UI', system-ui;"
        )
        text_layout.addWidget(title)

        desc = QLabel("右键托盘 → 设置（API Key）", self)
        desc.setStyleSheet(
            "color: #6b7280; font-size: 11px;"
            "font-family: 'Segoe UI Variable', 'Segoe UI', 'Microsoft YaHei UI', system-ui;"
        )
        text_layout.addWidget(desc)
        layout.addLayout(text_layout, 1)

        # 背景 - 圆角白卡
        self.setStyleSheet("""
            QWidget {
                background-color: #ffffff;
                border: 1px solid rgba(0, 0, 0, 0.08);
                border-radius: 12px;
            }
        """)

    def _apply_mask(self):
        radius = 12
        rect = self.rect()
        path = QPainterPath()
        path.addRoundedRect(0, 0, rect.width(), rect.height(), radius, radius)
        self.setMask(QRegion(path.toFillPolygon().toPolygon()))

    def resizeEvent(self, event):
        super().resizeEvent(event)
        self._apply_mask()

    def _position_to_anchor(self):
        """定位到浮动按钮旁边"""
        if self._anchor is None:
            return
        try:
            anchor_pos = self._anchor.mapToGlobal(QPoint(0, 0))
            x = anchor_pos.x() + self._anchor.width() + 8
            y = anchor_pos.y() + (self._anchor.height() - self.height()) // 2
            self.move(x, y)
        except Exception:
            pass

    def _fade_in(self):
        effect = QGraphicsOpacityEffect(self)
        self.setGraphicsEffect(effect)
        anim = QPropertyAnimation(effect, b"opacity")
        anim.setDuration(300)
        anim.setStartValue(0.0)
        anim.setEndValue(1.0)
        anim.setEasingCurve(QEasingCurve.Type.OutCubic)
        anim.start()

    def fade_out_and_close(self):
        effect = self.graphicsEffect()
        if effect is None:
            self.close()
            return
        anim = QPropertyAnimation(effect, b"opacity")
        anim.setDuration(220)
        anim.setStartValue(1.0)
        anim.setEndValue(0.0)
        anim.setEasingCurve(QEasingCurve.Type.InCubic)
        anim.finished.connect(self.close)
        anim.start()


# ========== 3. 半透明蒙层首启引导 ==========

class OnboardingOverlay(QWidget):
    """首次启动时的半透明蒙层 - 高亮浮动按钮区域"""

    def __init__(self, target_rect, hint_text, parent=None):
        super().__init__(parent)
        self._target_rect = target_rect  # 在屏幕坐标中的高亮区域

        # 全屏透明蒙层
        self.setWindowFlags(
            Qt.WindowType.FramelessWindowHint
            | Qt.WindowType.WindowStaysOnTopHint
            | Qt.WindowType.Tool
        )
        self.setAttribute(Qt.WidgetAttribute.WA_ShowWithoutActivating)
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground, True)

        screen = QApplication.primaryScreen()
        if screen:
            geo = screen.availableGeometry()
            self.setGeometry(geo)
            self._screen_geo = geo
        else:
            self.setGeometry(0, 0, 1920, 1080)
            self._screen_geo = QRect(0, 0, 1920, 1080)

        # 6 秒自动关闭
        self._timer = QTimer()
        self._timer.setSingleShot(True)
        self._timer.timeout.connect(self._fade_out_and_close)
        self._timer.start(6000)

        self._fade_in()

    def paintEvent(self, event):
        """画蒙层 + 高亮框 + 提示文字"""
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)

        # 半透明黑色蒙层
        overlay_color = QColor(0, 0, 0, 140)  # alpha=140/255≈55%
        painter.fillRect(self.rect(), overlay_color)

        # 在高亮区域"挖洞" - 显示背景
        if not self._target_rect.isNull():
            # 转 target_rect 到 widget 坐标
            target = QRect(
                self._target_rect.x() - self._screen_geo.x(),
                self._target_rect.y() - self._screen_geo.y(),
                self._target_rect.width(),
                self._target_rect.height(),
            )
            painter.setCompositionMode(
                QPainter.CompositionMode.CompositionMode_Clear
            )
            path = QPainterPath()
            # 给高亮区域加点 padding 让"洞"更大
            pad = 12
            target_padded = target.adjusted(-pad, -pad, pad, pad)
            path.addRoundedRect(
                target_padded.x(), target_padded.y(),
                target_padded.width(), target_padded.height(),
                16, 16
            )
            painter.fillPath(path, Qt.GlobalColor.transparent)
            painter.setCompositionMode(
                QPainter.CompositionMode.CompositionMode_SourceOver
            )

            # 蓝色高亮描边
            pen = QPen(QColor(0, 122, 255), 3)
            painter.setPen(pen)
            painter.setBrush(Qt.BrushStyle.NoBrush)
            painter.drawRoundedRect(
                target_padded.x(), target_padded.y(),
                target_padded.width(), target_padded.height(),
                16, 16
            )

    def mousePressEvent(self, event: QMouseEvent):
        """点击蒙层直接关闭"""
        self._fade_out_and_close()

    def _fade_in(self):
        effect = QGraphicsOpacityEffect(self)
        self.setGraphicsEffect(effect)
        anim = QPropertyAnimation(effect, b"opacity")
        anim.setDuration(300)
        anim.setStartValue(0.0)
        anim.setEndValue(1.0)
        anim.setEasingCurve(QEasingCurve.Type.OutCubic)
        anim.start()

    def _fade_out_and_close(self):
        effect = self.graphicsEffect()
        if effect is None:
            self.close()
            return
        anim = QPropertyAnimation(effect, b"opacity")
        anim.setDuration(220)
        anim.setStartValue(1.0)
        anim.setEndValue(0.0)
        anim.setEasingCurve(QEasingCurve.Type.InCubic)
        anim.finished.connect(self.close)
        anim.start()
        self._timer.stop()


def has_seen_onboarding():
    """检查是否看过引导"""
    from pathlib import Path
    import json
    flag_path = Path.home() / ".readmate" / "onboarding_seen.json"
    if not flag_path.exists():
        return False
    try:
        return json.loads(flag_path.read_text()).get("seen", False)
    except Exception:
        return False


def mark_onboarding_seen():
    """标记已看过引导"""
    from pathlib import Path
    import json
    flag_path = Path.home() / ".readmate" / "onboarding_seen.json"
    flag_path.parent.mkdir(parents=True, exist_ok=True)
    flag_path.write_text(json.dumps({"seen": True, "version": 1}))


def api_key_is_configured():
    """检查 API Key 是否已配置"""
    from .core.config import get_config
    cfg = get_config()
    key = cfg.get("minimax_api_key", "")
    return bool(key) and key != "placeholder_for_ui_test"