"""联系人面板 — 好友列表侧边栏"""
import customtkinter as ctk
from ..api_client import api
from ..components.contact_item import ContactItem
from ..views.search_dialog import SearchDialog
from ..views.friend_requests_panel import FriendRequestsPanel


class ContactsPanel(ctk.CTkFrame):
    """左侧栏：好友列表 + 操作按钮"""

    def __init__(self, master, on_chat_open, on_requests_count_change=None, **kwargs):
        kwargs.setdefault("width", 250)
        super().__init__(master, **kwargs)
        self.on_chat_open = on_chat_open
        self.on_requests_count_change = on_requests_count_change
        self.contact_items: dict[int, ContactItem] = {}
        self._build_ui()

    def _build_ui(self):
        # 标题
        header = ctk.CTkFrame(self, fg_color="transparent")
        header.pack(fill="x", padx=10, pady=(10, 8))

        ctk.CTkLabel(
            header, text="联系人",
            font=("", 16, "bold"),
        ).pack(side="left")

        # 好友请求按钮
        self.requests_btn = ctk.CTkButton(
            header, text="📨", width=36, height=30,
            font=("", 12),
            fg_color="transparent",
            hover_color=("gray85", "gray25"),
            command=self._toggle_requests_panel,
        )
        self.requests_btn.pack(side="right", padx=(0, 5))

        # 添加好友按钮
        add_btn = ctk.CTkButton(
            header, text="+", width=30, height=30,
            font=("", 16),
            fg_color="transparent",
            hover_color=("gray85", "gray25"),
            command=self._open_search_dialog,
        )
        add_btn.pack(side="right", padx=(0, 5))

        # 联系人列表
        self.contacts_frame = ctk.CTkScrollableFrame(self)
        self.contacts_frame.pack(fill="both", expand=True, padx=5, pady=(0, 5))

        # 好友请求面板（初始隐藏，绝对定位遮盖联系人列表）
        self.requests_panel = FriendRequestsPanel(
            self, on_accepted=self.refresh,
        )

    def _toggle_requests_panel(self):
        """切换好友请求面板的显示"""
        if self.requests_panel.winfo_ismapped():
            self.requests_panel.place_forget()
        else:
            self.requests_panel.place(x=0, y=80, relwidth=1, relheight=0.88)
            self.requests_panel.lift()
            self.requests_panel.refresh()

    def _open_search_dialog(self):
        SearchDialog(self, on_request_sent=None)

    def refresh(self):
        """刷新好友列表"""
        # 保存当前选择
        for w in self.contacts_frame.winfo_children():
            w.destroy()
        self.contact_items.clear()

        try:
            friends = api.get_friends()
            for friend in friends:
                item = ContactItem(
                    self.contacts_frame,
                    contact_id=friend["id"],
                    username=friend["username"],
                    status=friend.get("status", "offline"),
                    avatar_url=friend.get("avatar_url", ""),
                    on_click=self._on_contact_click,
                )
                item.pack(fill="x", pady=1, padx=3)
                self.contact_items[friend["id"]] = item

            if not friends:
                ctk.CTkLabel(
                    self.contacts_frame,
                    text="暂无好友\n点击 + 添加好友",
                    text_color=("gray50", "gray60"),
                    font=("", 12),
                ).pack(pady=40)
        except Exception as e:
            ctk.CTkLabel(
                self.contacts_frame,
                text=f"加载失败: {e}",
                text_color="red",
            ).pack(pady=10)

    def _on_contact_click(self, contact_id: int, username: str, avatar_url: str = ""):
        """点击联系人"""
        self.on_chat_open(contact_id, username, avatar_url)

    def update_status(self, user_id: int, status: str):
        """更新联系人在线状态"""
        item = self.contact_items.get(user_id)
        if item:
            item.update_status(status)
