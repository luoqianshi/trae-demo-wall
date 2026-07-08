"""消息气泡组件（含头像）"""
import customtkinter as ctk
from ..utils.avatar import load_avatar


class MessageBubble(ctk.CTkFrame):
    """聊天气泡 — 自己的靠右绿色，对方的靠左白色（附带对方头像）"""

    def __init__(self, master, content: str, is_own: bool, timestamp: str,
                 avatar_url: str = "", **kwargs):
        fg_color = "#c8e6c9" if is_own else "#ffffff"
        text_color = "#1b5e20" if is_own else "#333333"
        super().__init__(
            master, fg_color=fg_color, corner_radius=12,
            border_width=1,
            border_color="#bdbdbd" if not is_own else "#a5d6a7",
            **kwargs,
        )

        if not is_own and avatar_url:
            avatar_img = load_avatar(avatar_url, 30)
            if avatar_img:
                ctk.CTkLabel(self, text="", image=avatar_img).pack(
                    side="left", padx=(6, 2), pady=6,
                )

        self.content_label = ctk.CTkLabel(
            self, text=content, wraplength=380,
            text_color=text_color, justify="left", font=("", 12),
        )
        self.content_label.pack(padx=12, pady=(8, 2), anchor="w")

        self.time_label = ctk.CTkLabel(
            self, text=_format_time(timestamp),
            text_color="#999999", font=("", 9),
        )
        self.time_label.pack(padx=12, pady=(0, 6), anchor="e" if is_own else "w")


def _format_time(timestamp: str) -> str:
    """正确解析 ISO 时间戳并格式化为 HH:MM"""
    import datetime
    try:
        dt = datetime.datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
        return dt.strftime("%H:%M")
    except Exception:
        return timestamp
