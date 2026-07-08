"""聊天面板 — 消息列表和输入框（支持自定义背景图）"""
from __future__ import annotations
import os
import shutil
import customtkinter as ctk
from tkinter import filedialog
from PIL import Image, ImageTk
from ..api_client import api
from ..ws_client import ws_client
from ..session import session
from ..utils.config import BG_IMAGE_DIR
from ..components.message_bubble import MessageBubble


class ChatPanel(ctk.CTkFrame):
    """一对一私信聊天面板"""

    def __init__(self, master, **kwargs):
        super().__init__(master, **kwargs)
        self.chat_user_id: int | None = None
        self.chat_username: str = ""
        self._chat_avatar_url: str = ""
        self._bg_image_path: str = ""
        self._bg_photo = None
        self._bg_image_id: int = 0
        self._build_ui()

    def _build_ui(self):
        # 顶部栏
        self.header_frame = ctk.CTkFrame(
            self, fg_color="#e8f5e9", height=44, corner_radius=0,
        )
        self.header_frame.pack(fill="x")

        self.name_label = ctk.CTkLabel(
            self.header_frame, text="选择好友开始聊天",
            font=("", 15, "bold"), text_color="#2e7d32",
        )
        self.name_label.pack(side="left", padx=15, pady=8)

        self.bg_btn = ctk.CTkButton(
            self.header_frame, text="\U0001f5bc 更换背景", width=90, height=30,
            font=("", 11), fg_color="#a5d6a7", text_color="#1b5e20",
            hover_color="#81c784",
            command=self._choose_background,
        )
        self.bg_btn.pack(side="right", padx=10, pady=6)

        # 消息滚动区域
        self.messages_frame = ctk.CTkScrollableFrame(
            self, fg_color="#ffffff", corner_radius=0,
        )
        self.messages_frame.pack(fill="both", expand=True)

        # ★ 直接操作 CTkScrollableFrame 内部的 tkinter Canvas
        self._inner_canvas = self.messages_frame._parent_canvas
        self._inner_canvas.bind("<Configure>", self._on_resize)

        # 底部输入区域
        self.input_frame = ctk.CTkFrame(
            self, fg_color="#f0f0f0", height=72, corner_radius=0,
        )
        self.input_frame.pack(fill="x")

        self.input_box = ctk.CTkTextbox(
            self.input_frame, height=56, font=("", 12),
            border_width=1, border_color="#c8e6c9", fg_color="#ffffff",
        )
        self.input_box.pack(side="left", fill="x", expand=True, padx=10, pady=8)
        self.input_box.bind("<Control-Return>", lambda e: self._send_message())

        send_btn = ctk.CTkButton(
            self.input_frame, text="发送", width=70, height=36,
            font=("", 13, "bold"),
            fg_color="#43a047", hover_color="#2e7d32",
            command=self._send_message,
        )
        send_btn.pack(side="right", padx=(0, 10), pady=8)

    # ─── 背景图管理 ───────────────────────────────
    def _choose_background(self):
        file_path = filedialog.askopenfilename(
            title="选择聊天背景图片",
            filetypes=[("图片文件", "*.png *.jpg *.jpeg *.gif *.bmp"), ("所有文件", "*.*")],
        )
        if not file_path:
            return
        self._set_background(file_path)

    def _set_background(self, source_path: str):
        ext = os.path.splitext(source_path)[1] or ".png"
        dest_path = os.path.join(BG_IMAGE_DIR, f"chat_bg{ext}")
        try:
            shutil.copy2(source_path, dest_path)
        except Exception:
            dest_path = source_path
        self._bg_image_path = dest_path
        self._draw_background()

    def _draw_background(self):
        """在 CTkScrollableFrame 的内层 Canvas 上画背景"""
        if not self._bg_image_path:
            return
        try:
            canvas = self._inner_canvas
            cw = canvas.winfo_width()
            ch = canvas.winfo_height()
            if cw < 10 or ch < 10:
                return

            # 清除旧图
            if self._bg_image_id:
                canvas.delete(self._bg_image_id)

            img = Image.open(self._bg_image_path)
            # zoom fill
            ir = img.width / img.height
            br = cw / ch
            if ir > br:
                nw = int(img.height * br)
                left = (img.width - nw) // 2
                img = img.crop((left, 0, left + nw, img.height))
            else:
                nh = int(img.width / br)
                top = (img.height - nh) // 2
                img = img.crop((0, top, img.width, top + nh))

            img = img.resize((cw, ch), Image.LANCZOS)

            # ★ 自动淡化：与白色混合，使背景柔和、不影响阅读
            overlay = Image.new("RGB", img.size, (255, 255, 255))
            img = Image.blend(img, overlay, 0.55)

            self._bg_photo = ImageTk.PhotoImage(img)

            self._bg_image_id = canvas.create_image(
                cw // 2, ch // 2, image=self._bg_photo,
            )
            canvas.tag_lower(self._bg_image_id)
        except Exception:
            pass

    def _on_resize(self, event):
        if self._bg_image_path:
            self.after(300, self._draw_background)

    def _recover_background(self):
        """恢复上次保存的背景图"""
        candidates = [f for f in os.listdir(BG_IMAGE_DIR) if f.startswith("chat_bg")]
        if candidates:
            path = os.path.join(BG_IMAGE_DIR, candidates[0])
            if os.path.isfile(path):
                self._bg_image_path = path
                self.after(500, self._draw_background)

    # ─── 聊天逻辑 ─────────────────────────────────
    def open_chat(self, user_id: int, username: str, avatar_url: str = ""):
        self.chat_user_id = user_id
        self.chat_username = username
        self._chat_avatar_url = avatar_url
        self.name_label.configure(text=f"与 {username} 的对话")
        self._clear_messages()
        self._load_history()

    def _clear_messages(self):
        for w in self.messages_frame.winfo_children():
            w.destroy()

    def _load_history(self):
        if not self.chat_user_id:
            return
        try:
            messages = api.get_messages(self.chat_user_id, limit=50)
            for msg in messages:
                is_own = msg["sender_id"] == session.user_id
                self._add_bubble(msg["content"], is_own, msg["created_at"])
        except Exception:
            pass

    def _add_bubble(self, content: str, is_own: bool, timestamp: str):
        bubble = MessageBubble(
            self.messages_frame, content=content, is_own=is_own,
            timestamp=timestamp,
            avatar_url="" if is_own else self._chat_avatar_url,
        )
        anchor = "e" if is_own else "w"
        bubble.pack(anchor=anchor, pady=3, padx=8)
        self.after(50, self._scroll_to_bottom)

    def _scroll_to_bottom(self):
        try:
            self._inner_canvas.yview_moveto(1.0)
        except Exception:
            pass

    def _send_message(self):
        if not self.chat_user_id:
            return
        content = self.input_box.get("1.0", "end-1c").strip()
        if not content:
            return
        ws_client.send_private_message(self.chat_user_id, content)
        import datetime
        now = datetime.datetime.now().isoformat()
        self._add_bubble(content, is_own=True, timestamp=now)
        self.input_box.delete("1.0", "end")

    def handle_incoming_message(self, data: dict):
        from_user_id = data.get("from_user_id", 0)
        content = data.get("content", "")
        timestamp = data.get("timestamp", "")
        if self.chat_user_id == from_user_id:
            self._add_bubble(content, is_own=False, timestamp=timestamp)
