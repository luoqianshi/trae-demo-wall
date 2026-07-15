"""ReadMate 应用入口 - 整合 core/agents/tools/services/ui/infra 各层"""
import sys
import signal
import time
from typing import Optional, List

from PyQt6.QtWidgets import (
    QApplication, QSystemTrayIcon, QMenu
)
from PyQt6.QtGui import QIcon, QPixmap, QPainter, QColor, QAction
from PyQt6.QtCore import Qt, QObject, pyqtSignal, QPoint, QTimer

from .core.config import get_config
from .core.logger import get_logger
from .core.exceptions import ReadMateError
from .infra.memory import ScreenMemory
from .infra.selection import SelectionMonitor
from .infra.history import HistoryStore
from .ui.float_button import FloatButton
from .ui.answer_panel import AnswerPanel
from .settings_dialog import SettingsDialog
from .onboarding import (
    OnboardingFlow, ApiKeyHintBubble, OnboardingOverlay,
    has_seen_onboarding, mark_onboarding_seen, api_key_is_configured
)
from .tools import get_tool_registry
from .tools.memory_search import MemorySearchTool
from .tools.clipboard import ClipboardTool

logger = get_logger(__name__)

# 全局屏幕记忆引用
_memory: Optional[ScreenMemory] = None
_history: Optional[HistoryStore] = None


def get_memory() -> Optional[ScreenMemory]:
    """获取全局屏幕记忆实例"""
    return _memory


def get_history() -> Optional[HistoryStore]:
    """获取全局历史记录实例"""
    return _history


class SelectionBridge(QObject):
    """跨线程信号桥接：选区监听线程 → 主线程"""
    selection_signal = pyqtSignal(str, int, int)
    deselection_signal = pyqtSignal()

    def __init__(self, on_selection, on_deselection):
        super().__init__()
        self.on_selection = on_selection
        self.on_deselection = on_deselection
        self.selection_signal.connect(self._handle_selection)
        self.deselection_signal.connect(self._handle_deselection)

    def emit_selection(self, text, x, y):
        self.selection_signal.emit(text, x, y)

    def emit_deselection(self):
        self.deselection_signal.emit()

    def _handle_selection(self, text, x, y):
        self.on_selection(text, x, y)

    def _handle_deselection(self):
        self.on_deselection()


class TrayIcon:
    """系统托盘图标"""

    def __init__(self, app: QApplication, on_quit):
        self.app = app
        self.on_quit = on_quit
        self._icon = self._make_icon()
        self._tray = QSystemTrayIcon(self._icon, app)
        self._tray.setToolTip("ReadMate - 屏幕阅读伴侣")
        self._history_win = None
        self._build_menu()
        self._tray.show()

    def _make_icon(self):
        pix = QPixmap(32, 32)
        pix.fill(Qt.GlobalColor.transparent)
        p = QPainter(pix)
        p.setRenderHint(QPainter.RenderHint.Antialiasing)
        p.setBrush(QColor("#4dfff3"))
        p.setPen(Qt.PenStyle.NoPen)
        p.drawEllipse(4, 4, 24, 24)
        p.setBrush(QColor("#0a0e1a"))
        p.drawEllipse(11, 11, 10, 10)
        p.end()
        return QIcon(pix)

    def _build_menu(self):
        menu = QMenu()
        title = QAction("ReadMate 运行中", menu)
        title.setEnabled(False)
        menu.addAction(title)
        menu.addSeparator()

        status = QAction("屏幕记忆: 已启动", menu)
        status.setEnabled(False)
        menu.addAction(status)

        act_key = QAction("设置（API Key）", menu)
        act_key.triggered.connect(self._show_settings_dialog)
        menu.addAction(act_key)

        menu.addSeparator()

        act_history = QAction("查看历史记录", menu)
        act_history.triggered.connect(self._show_history)
        menu.addAction(act_history)

        act_stats = QAction("统计信息", menu)
        act_stats.triggered.connect(self._show_stats)
        menu.addAction(act_stats)

        act_clear = QAction("清空历史记录", menu)
        act_clear.triggered.connect(self._clear_history)
        menu.addAction(act_clear)

        menu.addSeparator()
        act_quit = QAction("退出", menu)
        act_quit.triggered.connect(self.on_quit)
        menu.addAction(act_quit)

        self._tray.setContextMenu(menu)

    def _open_config_file(self):
        """保留作为后备：直接用记事本打开配置文件"""
        import subprocess
        from .core.config import Config
        cfg = get_config()
        config_path = cfg._config_path
        config_path.parent.mkdir(parents=True, exist_ok=True)
        if not config_path.exists():
            cfg.save()
        subprocess.Popen(["notepad", str(config_path)])

    def _show_settings_dialog(self):
        """打开 GUI 设置对话框"""
        cfg = get_config()
        try:
            dlg = SettingsDialog(cfg)
            # 用 exec() 模态对话框，关闭后 Key 已自动写入配置
            result = dlg.exec()
            if result:
                self.logger.info("API Key 已更新")
                from PyQt6.QtWidgets import QMessageBox
                QMessageBox.information(
                    None,
                    "设置已保存",
                    "API Key 已更新。\n下次提问时自动生效，无需重启。",
                )
        except Exception as e:
            self.logger.error(f"设置对话框打开失败: {e}")

    def maybe_show_onboarding(self):
        """首启引导：3 步提示卡 + 未配 Key 提示 + 半透明蒙层"""
        # 1. 半透明蒙层（首次启动 + 未配 Key 时最强引导）
        if not has_seen_onboarding():
            try:
                # 高亮系统托盘图标附近
                from PyQt6.QtCore import QRect
                from PyQt6.QtGui import QCursor
                screen_geo = QApplication.primaryScreen().availableGeometry()
                # 默认高亮屏幕右下角（系统托盘位置）
                highlight = QRect(
                    screen_geo.x() + screen_geo.width() - 240,
                    screen_geo.y() + screen_geo.height() - 80,
                    200, 60
                )
                overlay = OnboardingOverlay(
                    highlight,
                    "👋 ReadMate 首次使用引导"
                )
                overlay.show()
                mark_onboarding_seen()
            except Exception as e:
                self.logger.warning(f"onboarding overlay 失败: {e}")

        # 2. 未配 Key 提示气泡（无论是否首启都提示，直到配置 Key 为止）
        if not api_key_is_configured():
            try:
                # 找到浮动按钮作为锚点
                anchor = getattr(self, "_float_button", None)
                if anchor is not None:
                    QTimer.singleShot(
                        1500,
                        lambda: self._show_key_hint(anchor)
                    )
            except Exception as e:
                self.logger.warning(f"api key hint 失败: {e}")

        # 3. 3 步提示卡（首启展示 5.5 秒）
        if not has_seen_onboarding():
            try:
                flow = OnboardingFlow()
                QTimer.singleShot(800, flow.start)
            except Exception as e:
                self.logger.warning(f"onboarding flow 失败: {e}")

    def _show_key_hint(self, anchor):
        """显示未配 Key 提示气泡"""
        try:
            self._key_hint = ApiKeyHintBubble(anchor)
            self._key_hint.show()
            # 8 秒后自动消失
            QTimer.singleShot(8000, self._key_hint.fade_out_and_close)
        except Exception as e:
            self.logger.warning(f"key hint 显示失败: {e}")

    def _show_history(self):
        """显示最近的历史记录"""
        if not _history:
            return
        records = _history.get_recent_records(20)
        if not records:
            self._tray.showMessage(
                "历史记录", "暂无记录", QSystemTrayIcon.MessageIcon.Information, 2000
            )
            return
        from PyQt6.QtWidgets import QWidget, QVBoxLayout, QTextEdit, QPushButton, QHBoxLayout
        self._history_win = QWidget()
        self._history_win.setWindowTitle("ReadMate 历史记录")
        self._history_win.resize(600, 500)
        lay = QVBoxLayout(self._history_win)
        view = QTextEdit()
        view.setReadOnly(True)
        lines = []
        for r in records:
            lines.append(
                f"<b>#{r['id']} [{r['action']}]</b> <span style='color:#888'>{r['created_at']}</span><br>"
                f"<i>选中:</i> {r['selected_text'][:80]}<br>"
                f"<i>回答:</i> {r['answer'][:200]}<br><hr>"
            )
        view.setHtml("".join(lines))
        lay.addWidget(view)
        btn_row = QHBoxLayout()
        btn_close = QPushButton("关闭")
        btn_close.clicked.connect(self._history_win.close)
        btn_row.addStretch()
        btn_row.addWidget(btn_close)
        lay.addLayout(btn_row)
        self._history_win.show()

    def _show_stats(self):
        """显示统计信息"""
        if not _history:
            return
        stats = _history.get_stats()
        self._tray.showMessage(
            "ReadMate 统计",
            f"累计问答: {stats['total']} 次\n今日问答: {stats['today']} 次",
            QSystemTrayIcon.MessageIcon.Information, 4000
        )

    def _clear_history(self):
        """清空历史记录"""
        if not _history:
            return
        _history.clear_all()
        self._tray.showMessage(
            "历史记录", "已清空所有历史记录", QSystemTrayIcon.MessageIcon.Information, 2000
        )

    def notify(self, title: str, message: str):
        self._tray.showMessage(title, message, QSystemTrayIcon.MessageIcon.Information, 3000)


class ReadMateApp:
    """ReadMate 主应用"""

    def __init__(self):
        global _memory, _history

        self.app = QApplication(sys.argv)
        self.app.setQuitOnLastWindowClosed(False)

        # 检查 API Key
        cfg = get_config()
        api_key = cfg.get("minimax_api_key", "")
        if not api_key or api_key == 'placeholder_for_ui_test':
            logger.warning("未配置 MiniMax API Key，请运行: python -m readmate.set_key YOUR_KEY")

        # 初始化基础设施
        _memory = ScreenMemory()
        _memory.start()

        _history = HistoryStore()
        _history.init_db()

        # 注册工具
        registry = get_tool_registry()
        registry.register(MemorySearchTool())
        registry.register(ClipboardTool())

        # 选区监听
        self.bridge = SelectionBridge(self._on_selection, self._on_deselection)
        self.monitor = SelectionMonitor(self.bridge.emit_selection, self.bridge.emit_deselection)
        self.monitor.start()

        # UI 状态
        self._current_float: Optional[FloatButton] = None
        self._active_panels: List[AnswerPanel] = []

        # 系统托盘
        self.tray = TrayIcon(self.app, self._quit)
        self.tray.notify("ReadMate 已启动", "在任意应用选中文字试试看~")

        logger.info("ReadMate 应用已启动")

    def _on_selection(self, text: str, x: int, y: int):
        """主线程处理选区信号"""
        now = time.time()
        if hasattr(self, '_last_selection_time') and now - self._last_selection_time < 0.15:
            return
        self._last_selection_time = now

        # 仅关闭浮动按钮，不关闭已展开的答案面板（答案面板由用户主动关闭）
        if self._current_float:
            try:
                self._current_float.close_self()
            except Exception:
                pass
            self._current_float = None

        try:
            x, y = self._physical_to_logical(x, y)
            self._current_float = FloatButton(text, self.app, on_panel_created=self._register_panel)
            self._current_float.show_at(x + 12, y + 18)
        except Exception as e:
            logger.error(f"创建浮动按钮失败: {e}")
            self._current_float = None

    def _physical_to_logical(self, x: int, y: int):
        """物理像素转逻辑像素（高 DPI 适配）"""
        screen = self.app.screenAt(QPoint(int(x), int(y))) or self.app.primaryScreen()
        dpr = screen.devicePixelRatio() if screen else 1.0
        if dpr <= 0:
            dpr = 1.0
        return int(x / dpr), int(y / dpr)

    def _on_deselection(self):
        """取消文本选择后立即关闭浮动按钮

        点击 ReadMate 自己的窗口时，pynput 已通过 _is_click_on_self_window 过滤，
        不会触发此回调，因此无需检查 _actions_shown——能到达这里的 deselection
        事件一定是用户点击了外部区域，应该立即关闭浮动按钮。
        """
        if self._current_float:
            try:
                self._current_float.close_self()
                self._current_float = None
            except Exception as e:
                logger.error(f"关闭浮动按钮失败: {e}")
                self._current_float = None

    def _close_all_panels(self):
        """关闭所有浮动窗口"""
        if self._current_float:
            try:
                self._current_float.close_self()
            except Exception:
                pass
            self._current_float = None
        for panel in self._active_panels:
            try:
                panel._force_close()
            except Exception:
                pass
        self._active_panels.clear()

    def _register_panel(self, panel: AnswerPanel):
        self._active_panels.append(panel)

    def _quit(self):
        """退出应用"""
        global _memory
        self._close_all_panels()
        if _memory:
            _memory.stop()
        self.monitor.stop()
        self.app.quit()

    def run(self):
        signal.signal(signal.SIGINT, signal.SIG_DFL)
        return self.app.exec()


def _global_exception_hook(exc_type, exc_value, exc_traceback):
    """全局异常兜底"""
    if issubclass(exc_type, KeyboardInterrupt):
        sys.__excepthook__(exc_type, exc_value, exc_traceback)
        return
    logger.error("未捕获异常", exc_info=(exc_type, exc_value, exc_traceback))


def main():
    """应用入口"""
    sys.excepthook = _global_exception_hook
    app = ReadMateApp()
    # 启动后异步触发引导流程（不影响主循环）
    QTimer.singleShot(800, lambda: app.tray.maybe_show_onboarding())
    # 开发调试参数
    if "--show-settings" in sys.argv:
        QTimer.singleShot(1500, lambda: app.tray._show_settings_dialog())
    # 圆角 mask 一次性测试：直接弹出测试面板看效果，不依赖选中文本触发
    if "--test-mask" in sys.argv:
        QTimer.singleShot(1500, _launch_mask_test)
    sys.exit(app.run())


def _launch_mask_test():
    """独立圆角测试面板：跟 AnswerPanel 同尺寸，同 mask 半径。
    弹出后老大肉眼一眼看出 mask 是否真的生效。"""
    import math
    from PyQt6.QtWidgets import QFrame, QLabel, QVBoxLayout
    from PyQt6.QtGui import QPainterPath, QRegion
    from .ui.styles import STYLE_PANEL

    w, h, radius = 440, 280, 20

    def rounded_path(width, height, r, segs=64):
        p = QPainterPath()
        p.moveTo(r, 0)
        p.lineTo(width - r, 0)
        for i in range(1, segs + 1):
            a = -math.pi / 2 + (math.pi / 2) * i / segs
            p.lineTo(width - r + r * math.cos(a), r + r * math.sin(a))
        for i in range(1, segs + 1):
            a = 0 + (math.pi / 2) * i / segs
            p.lineTo(width - r + r * math.cos(a), height - r + r * math.sin(a))
        for i in range(1, segs + 1):
            a = math.pi / 2 + (math.pi / 2) * i / segs
            p.lineTo(r + r * math.cos(a), height - r + r * math.sin(a))
        for i in range(1, segs + 1):
            a = math.pi + (math.pi / 2) * i / segs
            p.lineTo(r + r * math.cos(a), r + r * math.sin(a))
        p.closeSubpath()
        return p

    frame = QFrame()
    frame.setWindowFlags(Qt.WindowType.FramelessWindowHint | Qt.WindowType.Tool | Qt.WindowType.WindowStaysOnTopHint)
    frame.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground)
    frame.setStyleSheet(STYLE_PANEL)
    frame.resize(w, h)

    # 验证 mask 是否能赋值
    path = rounded_path(w, h, radius, 64)
    poly = path.toFillPolygon().toPolygon()
    mask = QRegion(poly)
    print(f"[--test-mask] poly points={len(poly)}, mask empty={mask.isEmpty()}, mask bound={mask.boundingRect()}")
    frame.setMask(mask)

    layout = QVBoxLayout(frame)
    layout.setContentsMargins(20, 20, 20, 20)
    title = QLabel("ReadMate · 圆角测试")
    title.setStyleSheet("color:#4dfff3; font-size:14px; font-weight:700;")
    body = QLabel(
        "如果四个角是圆弧 → mask 工作正常\n\n"
        "如果还是尖角 → 说明 PyQt6 的 mask 在 WA_TranslucentBackground 下无效，\n"
        "需要换方案（比如用 splash screen 或 DWM 蒙版）"
    )
    body.setStyleSheet("color:#e8eaf2; font-size:12px; line-height:1.6;")
    body.setWordWrap(True)
    layout.addWidget(title)
    layout.addWidget(body)
    layout.addStretch()

    screen = QApplication.primaryScreen().geometry()
    frame.move(screen.center().x() - w // 2, screen.center().y() - h // 2)
    frame.show()
    print(f"[--test-mask] 测试面板已弹出，位置 {frame.pos()}，尺寸 {frame.size()}")


if __name__ == "__main__":
    main()
