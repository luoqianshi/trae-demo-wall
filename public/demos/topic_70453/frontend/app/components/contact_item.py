"""联系人列表项组件"""
import customtkinter as ctk
from ..utils.avatar import load_avatar


class ContactItem(ctk.CTkFrame):
    """显示好友用户名和在线状态指示灯"""

    def __init__(self, master, contact_id: int, username: str, status: str,
                 avatar_url: str = "", on_click=None, **kwargs):
        super().__init__(master, fg_color="transparent", height=48, **kwargs)
        self.contact_id = contact_id
        self.username = username
        self.avatar_url = avatar_url
        self.on_click = on_click

        # 头像
        avatar_img = load_avatar(avatar_url, 32)
        self.avatar_lbl = ctk.CTkLabel(
            self, text="" if avatar_img else "\U0001f464",
            image=avatar_img,
            font=("", 18) if not avatar_img else ("", 0),
            fg_color="#e0e0e0" if not avatar_img else "transparent",
            corner_radius=16 if not avatar_img else 0,
            width=32, height=32,
        )
        self.avatar_lbl.pack(side="left", padx=(8, 6))

        # 状态指示灯
        self.status_dot = ctk.CTkLabel(
            self, text="\u25cf",
            text_color="#4CAF50" if status == "online" else "#bbb",
            font=("", 12), width=16,
        )
        self.status_dot.pack(side="left")

        self.name_label = ctk.CTkLabel(
            self, text=username, anchor="w", font=("", 13),
        )
        self.name_label.pack(side="left", fill="x", expand=True, padx=4)

        for w in (self, self.avatar_lbl, self.status_dot, self.name_label):
            w.bind("<Button-1>", self._on_click)

    def _on_click(self, event=None):
        if self.on_click:
            self.on_click(self.contact_id, self.username, self.avatar_url)

    def update_status(self, status: str):
        self.status_dot.configure(
            text_color="#4CAF50" if status == "online" else "#bbb"
        )
