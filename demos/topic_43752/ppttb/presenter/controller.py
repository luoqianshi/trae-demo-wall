import io
import os
import sys
import threading

import qrcode
import requests
import win32com.client
from PySide6.QtCore import Qt, QTimer, Signal, QObject
from PySide6.QtGui import QFont, QPixmap
from PySide6.QtWidgets import (
    QApplication, QWidget, QVBoxLayout, QHBoxLayout,
    QLabel, QLineEdit, QPushButton, QFileDialog, QMessageBox,
    QGroupBox
)


class PPTController:
    def __init__(self):
        self.app = None
        self.ppt = None
        self.total = 0
        self.last_index = 0

    def open(self, ppt_path):
        self.app = win32com.client.Dispatch("PowerPoint.Application")
        self.app.Visible = True
        self.ppt = self.app.Presentations.Open(ppt_path, WithWindow=False)
        self.ppt.SlideShowSettings.Run()
        self.total = self.ppt.Slides.Count

    def close(self):
        try:
            if self.ppt:
                self.ppt.Close()
            if self.app:
                self.app.Quit()
        except Exception:
            pass
        self.ppt = None
        self.app = None

    def current_index(self):
        if not self.ppt:
            return 0
        try:
            return self.ppt.SlideShowWindow.View.Slide.SlideIndex
        except Exception:
            return 0

    def goto_next(self):
        try:
            self.ppt.SlideShowWindow.View.Next()
        except Exception:
            pass

    def goto_prev(self):
        try:
            self.ppt.SlideShowWindow.View.Previous()
        except Exception:
            pass


def upload_ppt(server_url, ppt_path):
    file_size = os.path.getsize(ppt_path)
    with open(ppt_path, "rb") as f:
        files = {"file": (os.path.basename(ppt_path), f)}
        r = requests.post(
            f"{server_url}/upload", files=files, timeout=600
        )
    if r.status_code != 200:
        try:
            err = r.json().get("error", r.text)
        except Exception:
            err = r.text
        raise RuntimeError(f"服务器返回 {r.status_code}: {err}")
    return r.json()


def make_qr_pixmap(text, size=240):
    img = qrcode.make(text)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    pix = QPixmap()
    pix.loadFromData(buf.getvalue(), "PNG")
    if not pix.isNull():
        pix = pix.scaled(
            size, size, Qt.KeepAspectRatio,
            Qt.SmoothTransformation
        )
    return pix


class UploadSignals(QObject):
    ok = Signal(dict)
    fail = Signal(str)


class PresenterWindow(QWidget):
    def __init__(self):
        super().__init__()
        self.controller = PPTController()
        self.ppt_path = ""
        self.session_id = ""
        self.server_url = "http://127.0.0.1:8427"
        self.upload_signals = UploadSignals()
        self.upload_signals.ok.connect(self.on_upload_ok)
        self.upload_signals.fail.connect(self.on_upload_fail)
        self._build_ui()
        self._build_timer()

    def _build_ui(self):
        self.setWindowTitle("PPT 同步 - 演讲者端")
        self.resize(520, 820)
        self._apply_style()

        self.server_edit = QLineEdit(self.server_url)
        self.server_edit.setPlaceholderText("如 http://192.168.1.100:8427")

        self.file_label = QLabel("未选择 PPT 文件")
        self.file_label.setObjectName("fileLabel")
        self.file_label.setWordWrap(True)

        self.status_label = QLabel("准备就绪")
        self.status_label.setObjectName("statusLabel")
        self.status_label.setWordWrap(True)
        self.status_label.setAlignment(Qt.AlignCenter)

        self.choose_btn = QPushButton("选择 PPT")
        self.upload_btn = QPushButton("上传并生成二维码")
        self.upload_btn.setObjectName("primaryBtn")
        self.start_btn = QPushButton("开始放映")
        self.start_btn.setObjectName("primaryBtn")
        self.prev_btn = QPushButton("上一页")
        self.next_btn = QPushButton("下一页")
        self.end_btn = QPushButton("结束放映")
        self.end_btn.setObjectName("dangerBtn")
        self.resync_btn = QPushButton("重连同步")

        self.qr_label = QLabel("上传后将显示二维码")
        self.qr_label.setObjectName("qrPlaceholder")
        self.qr_label.setAlignment(Qt.AlignCenter)
        self.qr_label.setFixedSize(240, 240)

        self.url_label = QLabel()
        self.url_label.setObjectName("urlLabel")
        self.url_label.setAlignment(Qt.AlignCenter)
        self.url_label.setWordWrap(True)
        self.url_label.setTextInteractionFlags(Qt.TextSelectableByMouse)

        self.choose_btn.clicked.connect(self.on_choose)
        self.upload_btn.clicked.connect(self.on_upload)
        self.start_btn.clicked.connect(self.on_start)
        self.prev_btn.clicked.connect(self.on_prev)
        self.next_btn.clicked.connect(self.on_next)
        self.end_btn.clicked.connect(self.on_end)
        self.resync_btn.clicked.connect(self.on_resync)

        root = QVBoxLayout(self)
        root.setContentsMargins(20, 20, 20, 20)
        root.setSpacing(16)

        root.addWidget(self._title())
        root.addWidget(self._config_card())
        root.addWidget(self._action_card())
        root.addWidget(self.status_label)
        root.addWidget(self._qr_card(), 1)

        self.upload_btn.setEnabled(False)
        self.start_btn.setEnabled(False)
        self.prev_btn.setEnabled(False)
        self.next_btn.setEnabled(False)
        self.end_btn.setEnabled(False)
        self.resync_btn.setEnabled(False)

    def _title(self):
        title = QLabel("PPT 同步控制台")
        title.setObjectName("appTitle")
        title.setAlignment(Qt.AlignCenter)
        return title

    def _config_card(self):
        box = QGroupBox("配置")
        form = QVBoxLayout(box)
        form.setSpacing(10)

        server_row = QHBoxLayout()
        server_row.addWidget(QLabel("服务器"))
        server_row.addWidget(self.server_edit, 1)
        form.addLayout(server_row)

        file_row = QHBoxLayout()
        file_row.addWidget(self.file_label, 1)
        file_row.addWidget(self.choose_btn)
        form.addLayout(file_row)
        return box

    def _action_card(self):
        box = QGroupBox("操作")
        v = QVBoxLayout(box)
        v.setSpacing(10)

        v.addWidget(self.upload_btn)
        v.addWidget(self.start_btn)

        nav = QHBoxLayout()
        nav.setSpacing(8)
        nav.addWidget(self.prev_btn)
        nav.addWidget(self.next_btn)
        nav.addWidget(self.resync_btn)
        nav.addWidget(self.end_btn)
        v.addLayout(nav)
        return box

    def _qr_card(self):
        box = QGroupBox("观众入口")
        v = QVBoxLayout(box)
        v.setSpacing(8)
        v.setAlignment(Qt.AlignCenter)
        v.addWidget(self.url_label, alignment=Qt.AlignCenter)
        v.addWidget(self.qr_label, alignment=Qt.AlignCenter)
        v.addStretch(1)
        return box

    def _apply_style(self):
        self.setStyleSheet("""
            QWidget {
                background: #f4f6f8;
                color: #1f2933;
                font-size: 14px;
            }
            QLabel#appTitle {
                font-size: 22px;
                font-weight: 600;
                color: #16a34a;
                padding: 4px;
            }
            QGroupBox {
                background: #ffffff;
                border: 1px solid #e4e7eb;
                border-radius: 10px;
                margin-top: 16px;
                padding: 14px 12px 10px 12px;
                font-weight: 600;
                color: #3e4c59;
            }
            QGroupBox::title {
                subcontrol-origin: margin;
                left: 14px;
                padding: 0 6px;
            }
            QLabel {
                background: transparent;
            }
            QLabel#fileLabel {
                color: #6b7280;
                font-size: 13px;
            }
            QLabel#statusLabel {
                background: #eef5ee;
                border: 1px solid #cfe8d5;
                border-radius: 8px;
                padding: 8px;
                color: #2d7d46;
                font-weight: 500;
            }
            QLabel#qrPlaceholder {
                color: #9aa5b1;
                font-size: 15px;
                background: #fafbfc;
                border: 1px dashed #cbd2d9;
                border-radius: 8px;
            }
            QLabel#urlLabel {
                color: #4b5563;
                font-size: 13px;
            }
            QLineEdit {
                background: #ffffff;
                border: 1px solid #cbd2d9;
                border-radius: 6px;
                padding: 7px 9px;
                selection-background-color: #16a34a;
            }
            QLineEdit:focus {
                border: 1px solid #16a34a;
            }
            QPushButton {
                background: #ffffff;
                border: 1px solid #cbd2d9;
                border-radius: 6px;
                padding: 8px 14px;
                color: #3e4c59;
            }
            QPushButton:hover {
                background: #f0f4f8;
                border-color: #9aa5b1;
            }
            QPushButton:pressed {
                background: #e4e7eb;
            }
            QPushButton:disabled {
                color: #b0b7c0;
                background: #f3f5f7;
                border-color: #e4e7eb;
            }
            QPushButton#primaryBtn {
                background: #16a34a;
                border: 1px solid #16a34a;
                color: #ffffff;
                font-weight: 600;
            }
            QPushButton#primaryBtn:hover {
                background: #138a40;
                border-color: #138a40;
            }
            QPushButton#primaryBtn:disabled {
                background: #c7e7d2;
                border-color: #c7e7d2;
                color: #ffffff;
            }
            QPushButton#dangerBtn {
                background: #ffffff;
                border: 1px solid #f0a9a0;
                color: #c0392b;
            }
            QPushButton#dangerBtn:hover {
                background: #fdecea;
                border-color: #e5736b;
            }
            QPushButton#dangerBtn:disabled {
                color: #d6b0ab;
                border-color: #f0d9d5;
                background: #fbf6f5;
            }
        """)

    def _build_timer(self):
        self.timer = QTimer(self)
        self.timer.setInterval(500)
        self.timer.timeout.connect(self.on_tick)

    def on_choose(self):
        path, _ = QFileDialog.getOpenFileName(
            self, "选择 PPT", "", "PowerPoint (*.ppt *.pptx)"
        )
        if path:
            self.ppt_path = path
            self.file_label.setText(path)
            self.upload_btn.setEnabled(True)

    def on_upload(self):
        if not self.ppt_path:
            QMessageBox.warning(self, "提示", "请先选择 PPT 文件")
            return
        self.server_url = self.server_edit.text().strip().rstrip("/")
        self.upload_btn.setEnabled(False)
        self.status_label.setText(
            "正在上传并转换...（大文件可能需要 1-2 分钟，请勿关闭）"
        )

        def worker():
            try:
                data = upload_ppt(self.server_url, self.ppt_path)
                self.upload_signals.ok.emit(data)
            except Exception as e:
                self.upload_signals.fail.emit(str(e))

        threading.Thread(target=worker, daemon=True).start()

    def on_upload_ok(self, data):
        self.session_id = data["session_id"]
        total = data["total"]
        audience_url = f"{self.server_url}/audience/{self.session_id}"
        self.qr_label.setPixmap(make_qr_pixmap(audience_url))
        self.url_label.setText(
            f"观众链接（共 {total} 页）：\n{audience_url}"
        )
        self.status_label.setText("上传成功，可开始放映")
        self.start_btn.setEnabled(True)
        self.resync_btn.setEnabled(True)

    def on_upload_fail(self, msg):
        self.status_label.setText(f"上传失败: {msg}")
        self.upload_btn.setEnabled(True)

    def on_start(self):
        if not self.session_id:
            QMessageBox.warning(self, "提示", "请先上传 PPT")
            return
        try:
            self.controller.open(self.ppt_path)
        except Exception as e:
            QMessageBox.critical(self, "错误", f"打开 PPT 失败: {e}")
            return
        self.prev_btn.setEnabled(True)
        self.next_btn.setEnabled(True)
        self.end_btn.setEnabled(True)
        self.start_btn.setEnabled(False)
        self.choose_btn.setEnabled(False)
        self.upload_btn.setEnabled(False)
        self.timer.start()
        self.status_label.setText("放映已开始，自动同步中")

    def on_prev(self):
        self.controller.goto_prev()

    def on_next(self):
        self.controller.goto_next()

    def on_end(self):
        self.timer.stop()
        try:
            requests.post(
                f"{self.server_url}/end/{self.session_id}", timeout=3
            )
        except Exception as e:
            self.status_label.setText(f"通知结束失败: {e}")
        self.controller.close()
        self.prev_btn.setEnabled(False)
        self.next_btn.setEnabled(False)
        self.end_btn.setEnabled(False)
        self.start_btn.setEnabled(True)
        self.choose_btn.setEnabled(True)
        self.upload_btn.setEnabled(True)
        self.status_label.setText("放映已结束")

    def on_resync(self):
        idx = self.controller.current_index()
        if not idx:
            self.status_label.setText("无法读取当前页码，请确认放映中")
            return
        self.controller.last_index = idx
        try:
            requests.post(
                f"{self.server_url}/sync/{self.session_id}",
                params={"index": idx}, timeout=3
            )
            self.status_label.setText(f"已重连同步，当前第 {idx} 页")
        except Exception as e:
            self.status_label.setText(f"重连失败: {e}")

    def on_tick(self):
        idx = self.controller.current_index()
        if idx and idx != self.controller.last_index:
            self.controller.last_index = idx
            self.sync_to_server(idx)

    def sync_to_server(self, index):
        try:
            requests.post(
                f"{self.server_url}/sync/{self.session_id}",
                params={"index": index}, timeout=2
            )
        except Exception as e:
            self.status_label.setText(f"同步失败: {e}")

    def closeEvent(self, event):
        self.timer.stop()
        self.controller.close()
        super().closeEvent(event)


def main():
    app = QApplication(sys.argv)
    win = PresenterWindow()
    win.show()
    sys.exit(app.exec())


if __name__ == "__main__":
    main()
