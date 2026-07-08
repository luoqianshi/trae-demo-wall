"""主视图 — 左右分栏布局"""
import customtkinter as ctk
from ..session import session
from ..ws_client import ws_client
from ..utils.avatar import load_avatar
from .contacts_panel import ContactsPanel
from .chat_panel import ChatPanel
from .profile_view import ProfileView


class MainView(ctk.CTkFrame):
    """登录后的主窗口"""

    def __init__(self, master, on_logout, **kwargs):
        super().__init__(master, **kwargs)
        self.on_logout = on_logout
        self._avatar_cache = {}
        self._profile_window = None
        self._build_ui()

        ws_client.add_handler(self._on_ws_message)
        ws_client.on_token_expired(self._do_logout)
        ws_client.start()

    def _build_ui(self):
        top_bar = ctk.CTkFrame(self, fg_color="transparent", height=42)
        top_bar.pack(fill="x")

        ctk.CTkLabel(
            top_bar, text="\U0001f4ac Chat Platform", font=("", 17, "bold"),
        ).pack(side="left", padx=15, pady=8)

        user_frame = ctk.CTkFrame(top_bar, fg_color="transparent")
        user_frame.pack(side="right", padx=15)

        # 头像（可点击打开"我"）
        self.mini_avatar = ctk.CTkLabel(
            user_frame, text="\U0001f464", font=("", 16),
            fg_color="#e0e0e0", corner_radius=14, width=28, height=28,
        )
        self.mini_avatar.pack(side="left", padx=(0, 6))
        self.mini_avatar.bind("<Button-1>", lambda e: self._open_profile())
        self._refresh_mini_avatar()

        ctk.CTkLabel(
            user_frame, text=session.username, font=("", 12),
        ).pack(side="left", padx=(0, 8))

        # "我" 按钮
        me_btn = ctk.CTkButton(
            user_frame, text="我", width=40, height=26, font=("", 11),
            fg_color="#a5d6a7", text_color="#1b5e20", hover_color="#81c784",
            command=self._open_profile,
        )
        me_btn.pack(side="left", padx=(0, 8))

        logout_btn = ctk.CTkButton(
            user_frame, text="退出", width=50, height=26, font=("", 11),
            fg_color=("gray75", "gray35"), command=self._do_logout,
        )
        logout_btn.pack(side="right")

        ctk.CTkFrame(self, height=1, fg_color=("gray80", "gray30")).pack(fill="x")

        content = ctk.CTkFrame(self, fg_color="transparent")
        content.pack(fill="both", expand=True)

        self.contacts_panel = ContactsPanel(
            content, on_chat_open=self._on_chat_open, width=260,
        )
        self.contacts_panel.pack(side="left", fill="y")
        self.contacts_panel.pack_propagate(False)

        v_sep = ctk.CTkFrame(content, width=2, fg_color=("gray80", "gray30"))
        v_sep.pack(side="left", fill="y")

        self.chat_panel = ChatPanel(content)
        self.chat_panel.pack(side="left", fill="both", expand=True)

    def _refresh_mini_avatar(self):
        ctk_img = load_avatar(session.avatar_url, 28)
        if ctk_img:
            self.mini_avatar.configure(image=ctk_img, text="")
        else:
            self.mini_avatar.configure(image=None, text="\U0001f464")

    def _open_profile(self):
        if self._profile_window is not None and self._profile_window.winfo_exists():
            self._profile_window.focus()
            return
        def on_updated():
            self._profile_window = None
            self._refresh_mini_avatar()
            self.contacts_panel.refresh()
        self._profile_window = ProfileView(self, on_profile_updated=on_updated)

    def _on_chat_open(self, user_id: int, username: str, avatar_url: str = ""):
        self.chat_panel.open_chat(user_id, username, avatar_url)

    def _on_ws_message(self, data: dict):
        msg_type = data.get("type")
        if msg_type == "private_message":
            from_user_id = data.get("from_user_id", 0)
            self.chat_panel.after(0, lambda d=data: self.chat_panel.handle_incoming_message(d))
        elif msg_type == "status_change":
            user_id = data.get("user_id", 0)
            status = data.get("status", "offline")
            self.contacts_panel.after(
                0, lambda uid=user_id, s=status: self.contacts_panel.update_status(uid, s)
            )
        elif msg_type == "friend_accepted":
            self.contacts_panel.after(0, self.contacts_panel.refresh)

    def _do_logout(self):
        ws_client.stop()
        session.logout()
        self.destroy()
        self.on_logout()

    def on_show(self):
        self.contacts_panel.refresh()
        if not ws_client._running:
            ws_client.start()
        self.chat_panel._recover_background()
