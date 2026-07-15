"""ReadMate 设置对话框 - 真正可用的 GUI 设置面板

核心设计原则：
1. 服务商下拉 - 用户能选 MiniMax / OpenAI / DeepSeek / 自定义
2. 选完服务商 - 自动填 base_url + model + 显示 Key 获取链接
3. 测试连接按钮 - 立刻知道 Key 有没有用
4. 实时状态显示 - 不用问"有没有连上"
"""
import sys
import threading
from pathlib import Path

from PyQt6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QLabel, QLineEdit, QPushButton,
    QComboBox, QFrame, QApplication, QWidget, QFormLayout, QSizePolicy
)
from PyQt6.QtCore import Qt, QPoint, QRect, QTimer, pyqtSignal, QObject
from PyQt6.QtGui import QPainter, QPainterPath, QRegion, QColor, QMouseEvent, QCursor

from .ui.styles import STYLE_SETTING_TITLE


class _Signaler(QObject):
    """线程安全地把测试连接结果发回主线程"""
    result = pyqtSignal(bool, str)  # (success, message)


class SettingsDialog(QDialog):
    """iOS 风格设置对话框 - 让用户清楚知道怎么配 API Key"""

    def __init__(self, cfg, parent=None):
        super().__init__(parent)
        self._cfg = cfg
        self._drag_pos = None
        self._signaler = _Signaler()
        self._signaler.result.connect(self._on_test_finished)

        self.setWindowFlags(
            Qt.WindowType.FramelessWindowHint
            | Qt.WindowType.WindowStaysOnTopHint
            | Qt.WindowType.SplashScreen
            | Qt.WindowType.NoDropShadowWindowHint
        )
        self.setObjectName("settingsDialog")
        self.setStyleSheet("""
            QDialog#settingsDialog {
                background-color: #ffffff;
                border: 1px solid rgba(0, 0, 0, 0.06);
                border-radius: 14px;
            }
            QLabel {
                color: #1a1a1a;
                font-family: "Segoe UI Variable", "Segoe UI", "Microsoft YaHei UI", system-ui;
            }
            QLabel.hint {
                color: #6b7280;
                font-size: 11px;
            }
            QLabel.title {
                color: #1a1a1a;
                font-size: 13px;
                font-weight: 700;
            }
            QLineEdit {
                background-color: rgba(0, 0, 0, 0.04);
                color: #1a1a1a;
                border: 1px solid rgba(0, 0, 0, 0.08);
                border-radius: 8px;
                padding: 8px 12px;
                font-size: 13px;
                font-family: Consolas, Monaco, "Courier New", monospace;
                selection-background-color: rgba(0, 122, 255, 0.30);
            }
            QLineEdit:focus {
                border: 1px solid #007AFF;
                background-color: #ffffff;
            }
            QComboBox {
                background-color: rgba(0, 0, 0, 0.04);
                color: #1a1a1a;
                border: 1px solid rgba(0, 0, 0, 0.08);
                border-radius: 8px;
                padding: 8px 12px;
                font-size: 13px;
            }
            QComboBox:hover {
                border: 1px solid rgba(0, 0, 0, 0.15);
            }
            QComboBox:focus {
                border: 1px solid #007AFF;
            }
            QComboBox::drop-down {
                border: none;
                width: 20px;
            }
        """)

        self.setAttribute(Qt.WidgetAttribute.WA_ShowWithoutActivating)
        self.setAttribute(Qt.WidgetAttribute.WA_OpaquePaintEvent, True)
        self.setAutoFillBackground(True)

        # 高度从 380 → 540 增加以容纳更多控件
        self.resize(520, 540)

        self._init_ui()
        self._apply_rounded_mask()
        self._center_to_screen()

    def _init_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(0)

        # === 标题栏 ===
        title_bar = QFrame(self)
        title_bar.setObjectName("titleBar")
        title_bar.setFixedHeight(48)
        title_bar_layout = QHBoxLayout(title_bar)
        title_bar_layout.setContentsMargins(20, 0, 12, 0)

        title_label = QLabel("ReadMate · 设置", title_bar)
        title_label.setStyleSheet("color: #1a1a1a; font-size: 15px; font-weight: 700;")
        title_bar_layout.addWidget(title_label)
        title_bar_layout.addStretch(1)

        close_btn = QPushButton("×", title_bar)
        close_btn.setFixedSize(28, 28)
        close_btn.setStyleSheet("""
            QPushButton {
                background-color: transparent;
                color: #6b7280;
                border: none;
                border-radius: 6px;
                font-size: 18px;
                font-weight: 600;
            }
            QPushButton:hover {
                background-color: #FF453A;
                color: white;
            }
        """)
        close_btn.clicked.connect(self.reject)
        title_bar_layout.addWidget(close_btn)
        layout.addWidget(title_bar)

        # 分隔线
        sep = QFrame(self)
        sep.setFixedHeight(1)
        sep.setStyleSheet("background-color: rgba(0, 0, 0, 0.08);")
        layout.addWidget(sep)

        # === 内容区 ===
        content = QFrame(self)
        content_layout = QVBoxLayout(content)
        content_layout.setContentsMargins(24, 20, 24, 16)
        content_layout.setSpacing(14)

        # ---- 1. 服务商选择 ----
        section1_label = QLabel("1. 选择你的 LLM 服务商", content)
        section1_label.setStyleSheet("color: #007AFF; font-size: 11px; font-weight: 700;")
        content_layout.addWidget(section1_label)

        provider_layout = QHBoxLayout()
        provider_layout.setSpacing(8)

        provider_label = QLabel("服务商", content)
        provider_label.setStyleSheet("color: #1a1a1a; font-size: 13px;")
        provider_label.setFixedWidth(70)
        provider_layout.addWidget(provider_label)

        self._provider_combo = QComboBox(content)
        self._provider_combo.addItem("MiniMax（默认）", "minimaxi")
        self._provider_combo.addItem("OpenAI（ChatGPT）", "openai")
        self._provider_combo.addItem("DeepSeek（国产平价）", "deepseek")
        self._provider_combo.addItem("自定义（兼容 OpenAI 协议）", "custom")
        # 初始化选中
        current_provider = self._cfg.get("provider", "minimaxi")
        idx = max(0, self._provider_combo.findData(current_provider))
        self._provider_combo.setCurrentIndex(idx)
        self._provider_combo.currentIndexChanged.connect(self._on_provider_changed)
        provider_layout.addWidget(self._provider_combo, 1)
        content_layout.addLayout(provider_layout)

        # 服务商说明（动态）
        self._provider_hint = QLabel(content)
        self._provider_hint.setStyleSheet(
            "color: #6b7280; font-size: 11px; line-height: 1.5;"
        )
        self._provider_hint.setWordWrap(True)
        content_layout.addWidget(self._provider_hint)

        # ---- 2. API Key ----
        section2_label = QLabel("2. 输入 API Key", content)
        section2_label.setStyleSheet("color: #007AFF; font-size: 11px; font-weight: 700;")
        content_layout.addWidget(section2_label)

        key_layout = QHBoxLayout()
        key_layout.setSpacing(8)

        self._api_input = QLineEdit(content)
        self._api_input.setPlaceholderText("从服务商后台复制的 Key")
        self._api_input.setEchoMode(QLineEdit.EchoMode.Password)
        self._api_input.setText(self._cfg.get("minimax_api_key", ""))
        key_layout.addWidget(self._api_input, 1)

        show_btn = QPushButton("👁", content)
        show_btn.setFixedSize(36, 36)
        show_btn.setToolTip("显示 / 隐藏 Key")
        show_btn.setStyleSheet("""
            QPushButton {
                background-color: rgba(0, 0, 0, 0.05);
                border: none;
                border-radius: 8px;
                font-size: 14px;
            }
            QPushButton:hover {
                background-color: rgba(0, 0, 0, 0.10);
            }
        """)
        show_btn.setCheckable(True)
        show_btn.toggled.connect(self._toggle_password_visibility)
        key_layout.addWidget(show_btn)

        content_layout.addLayout(key_layout)

        # Key 获取链接（动态）
        self._key_link = QLabel(content)
        self._key_link.setOpenExternalLinks(True)
        self._key_link.setTextFormat(Qt.TextFormat.RichText)
        self._key_link.setStyleSheet("color: #007AFF; font-size: 11px;")
        content_layout.addWidget(self._key_link)

        # ---- 3. 高级选项（base_url / model）----
        self._advanced_toggle = QPushButton("▸ 高级选项（自定义 API 地址）", content)
        self._advanced_toggle.setCheckable(True)
        self._advanced_toggle.setStyleSheet("""
            QPushButton {
                background-color: transparent;
                color: #6b7280;
                border: none;
                text-align: left;
                padding: 4px 0;
                font-size: 11px;
            }
            QPushButton:hover {
                color: #1a1a1a;
            }
        """)
        self._advanced_toggle.toggled.connect(self._toggle_advanced)
        content_layout.addWidget(self._advanced_toggle)

        self._advanced_panel = QFrame(content)
        self._advanced_panel.setVisible(False)
        advanced_layout = QVBoxLayout(self._advanced_panel)
        advanced_layout.setContentsMargins(0, 4, 0, 4)
        advanced_layout.setSpacing(8)

        url_label = QLabel("API 地址（Base URL）", self._advanced_panel)
        url_label.setStyleSheet("color: #6b7280; font-size: 11px;")
        advanced_layout.addWidget(url_label)
        self._url_input = QLineEdit(self._advanced_panel)
        self._url_input.setPlaceholderText("https://api.example.com/v1")
        self._url_input.setText(self._cfg.get("base_url", "https://api.minimaxi.com/v1"))
        advanced_layout.addWidget(self._url_input)

        model_label = QLabel("模型名称", self._advanced_panel)
        model_label.setStyleSheet("color: #6b7280; font-size: 11px;")
        advanced_layout.addWidget(model_label)
        self._model_input = QLineEdit(self._advanced_panel)
        self._model_input.setPlaceholderText("例如 MiniMax-M3 / gpt-4o-mini / deepseek-chat")
        self._model_input.setText(self._cfg.get("minimax_model", "MiniMax-M3"))
        advanced_layout.addWidget(self._model_input)

        content_layout.addWidget(self._advanced_panel)

        # ---- 4. 状态 + 测试按钮 ----
        status_layout = QHBoxLayout()
        status_layout.setSpacing(10)
        status_layout.setContentsMargins(0, 4, 0, 0)

        self._status_label = QLabel("未测试", content)
        self._status_label.setStyleSheet("color: #6b7280; font-size: 12px; font-weight: 600;")
        status_layout.addWidget(self._status_label)
        status_layout.addStretch(1)

        self._test_btn = QPushButton("🔌 测试连接", content)
        self._test_btn.setFixedHeight(32)
        self._test_btn.setStyleSheet("""
            QPushButton {
                background-color: #ffffff;
                color: #007AFF;
                border: 1px solid #007AFF;
                border-radius: 8px;
                padding: 0 14px;
                font-size: 12px;
                font-weight: 600;
            }
            QPushButton:hover {
                background-color: rgba(0, 122, 255, 0.08);
            }
            QPushButton:pressed {
                background-color: rgba(0, 122, 255, 0.15);
            }
            QPushButton:disabled {
                color: #6b7280;
                border-color: rgba(0, 0, 0, 0.10);
                background-color: rgba(0, 0, 0, 0.03);
            }
        """)
        self._test_btn.clicked.connect(self._on_test_click)
        status_layout.addWidget(self._test_btn)

        content_layout.addLayout(status_layout)
        content_layout.addStretch(1)

        # === 底部按钮 ===
        btn_row = QHBoxLayout()
        btn_row.setContentsMargins(24, 12, 24, 16)
        btn_row.setSpacing(10)

        cancel_btn = QPushButton("取消", self)
        cancel_btn.setFixedHeight(36)
        cancel_btn.setStyleSheet("""
            QPushButton {
                background-color: rgba(0, 0, 0, 0.05);
                color: #1a1a1a;
                border: none;
                border-radius: 8px;
                font-size: 13px;
                font-weight: 600;
                padding: 0 16px;
            }
            QPushButton:hover {
                background-color: rgba(0, 0, 0, 0.10);
            }
        """)
        cancel_btn.clicked.connect(self.reject)
        btn_row.addWidget(cancel_btn)

        save_btn = QPushButton("保存", self)
        save_btn.setFixedHeight(36)
        save_btn.setStyleSheet("""
            QPushButton {
                background-color: #007AFF;
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 13px;
                font-weight: 600;
                padding: 0 16px;
            }
            QPushButton:hover {
                background-color: #0066d6;
            }
            QPushButton:pressed {
                background-color: #0051b3;
            }
        """)
        save_btn.setDefault(True)
        save_btn.clicked.connect(self._on_save)
        btn_row.addWidget(save_btn)

        layout.addWidget(content, 1)
        layout.addLayout(btn_row)

        # 初始化服务商说明
        self._on_provider_changed(self._provider_combo.currentIndex())

    def _on_provider_changed(self, idx):
        """服务商变化时，自动填 base_url + model + 提示"""
        from .core.config import PROVIDER_PRESETS
        code = self._provider_combo.currentData()
        preset = PROVIDER_PRESETS.get(code, {})
        label = preset.get("label", code)
        hint_url = preset.get("key_hint_url", "")
        key_prefix = preset.get("key_prefix", "")

        # 说明
        if code == "custom":
            self._provider_hint.setText(
                "兼容 OpenAI Chat Completions 协议的服务（如 Ollama / vLLM / Azure OpenAI 等），"
                "需在高级选项里手动填 API 地址和模型。"
            )
            self._key_link.setText("")
        else:
            self._provider_hint.setText(
                f"{label} 是国内/国际主流 LLM 服务商。注册后在服务商后台生成 API Key，"
                "填到下方输入框即可。"
            )
            if hint_url:
                self._key_link.setText(
                    f'🔗 <a href="{hint_url}" style="color:#007AFF;">'
                    f'点这里去 {label} 后台拿 Key</a>'
                )

        # 自动填 base_url（如果用户没改过）
        base_url = preset.get("base_url", "")
        model = preset.get("model", "")
        if base_url and not self._cfg.get("base_url_customized", False):
            self._url_input.setText(base_url)
        if model and not self._cfg.get("model_customized", False):
            self._model_input.setText(model)

        # 更新 placeholder 提示前缀
        if key_prefix:
            self._api_input.setPlaceholderText(f"Key 通常以 {key_prefix} 开头")
        else:
            self._api_input.setPlaceholderText("从服务商后台复制的 Key")

    def _toggle_password_visibility(self, checked):
        if checked:
            self._api_input.setEchoMode(QLineEdit.EchoMode.Normal)
        else:
            self._api_input.setEchoMode(QLineEdit.EchoMode.Password)

    def _toggle_advanced(self, checked):
        self._advanced_panel.setVisible(checked)
        if checked:
            self._advanced_toggle.setText("▾ 高级选项（自定义 API 地址）")
            self.resize(520, 620)
        else:
            self._advanced_toggle.setText("▸ 高级选项（自定义 API 地址）")
            self.resize(520, 540)
        self._apply_rounded_mask()

    def _on_test_click(self):
        """测试连接"""
        key = self._api_input.text().strip()
        base_url = self._url_input.text().strip()
        if not key:
            self._set_status("⚠️ 请先填 API Key", "#FF3B30")
            return
        if not base_url:
            self._set_status("⚠️ 请填 API 地址（高级选项里）", "#FF3B30")
            return
        if not base_url.startswith("http"):
            self._set_status("⚠️ API 地址应以 http / https 开头", "#FF3B30")
            return

        self._set_status("⏳ 正在连接…", "#FF9500")
        self._test_btn.setEnabled(False)

        # 后台线程测试，不卡 UI
        def do_test():
            try:
                # 用最轻的接口测试：models.list（OpenAI 兼容协议都支持）
                from openai import OpenAI
                client = OpenAI(api_key=key, base_url=base_url, timeout=8.0)
                models = client.models.list()
                n = len(models.data) if hasattr(models, "data") else "?"
                self._signaler.result.emit(
                    True, f"✓ 连接成功（{n} 个模型可用）"
                )
            except Exception as e:
                msg = str(e)
                # 简化错误信息
                if "401" in msg or "Unauthorized" in msg:
                    msg = "Key 无效或已过期"
                elif "404" in msg:
                    msg = "API 地址不对，或服务端不支持此接口"
                elif "timeout" in msg.lower() or "timed out" in msg.lower():
                    msg = "连接超时（检查网络 / 代理）"
                elif "Connection" in msg:
                    msg = "无法连接到服务端（检查 URL / 网络）"
                self._signaler.result.emit(False, f"✗ {msg}")

        threading.Thread(target=do_test, daemon=True).start()

    def _on_test_finished(self, success, message):
        self._test_btn.setEnabled(True)
        if success:
            self._set_status(message, "#34C759")
        else:
            self._set_status(message, "#FF3B30")

    def _set_status(self, text, color):
        self._status_label.setText(text)
        self._status_label.setStyleSheet(
            f"color: {color}; font-size: 12px; font-weight: 600;"
        )

    def _on_save(self):
        """保存设置"""
        key = self._api_input.text().strip()
        if not key:
            self._set_status("⚠️ API Key 不能为空", "#FF3B30")
            return

        provider = self._provider_combo.currentData()
        base_url = self._url_input.text().strip()
        model = self._model_input.text().strip()

        self._cfg.set("provider", provider)
        self._cfg.set("minimax_api_key", key)
        if base_url:
            self._cfg.set("base_url", base_url)
            self._cfg.set("minimax_base_url", base_url)
        if model:
            self._cfg.set("minimax_model", model)

        self.accept()

    # === 通用：圆角 mask + 拖动 ===
    def _apply_rounded_mask(self):
        radius = 14
        rect = self.rect()
        path = QPainterPath()
        path.addRoundedRect(0, 0, rect.width(), rect.height(), radius, radius)
        self.setMask(QRegion(path.toFillPolygon().toPolygon()))

    def _center_to_screen(self):
        screen = QApplication.primaryScreen()
        if screen:
            geo = screen.availableGeometry()
            x = geo.x() + (geo.width() - self.width()) // 2
            y = geo.y() + (geo.height() - self.height()) // 2
            self.move(x, y)

    def resizeEvent(self, event):
        super().resizeEvent(event)
        self._apply_rounded_mask()

    def mousePressEvent(self, event: QMouseEvent):
        if (event.button() == Qt.MouseButton.LeftButton
                and event.position().y() < 48):
            self._drag_pos = (
                event.globalPosition().toPoint() - self.frameGeometry().topLeft()
            )
            event.accept()

    def mouseMoveEvent(self, event: QMouseEvent):
        if self._drag_pos and event.buttons() & Qt.MouseButton.LeftButton:
            self.move(event.globalPosition().toPoint() - self._drag_pos)
            event.accept()

    def mouseReleaseEvent(self, event: QMouseEvent):
        self._drag_pos = None