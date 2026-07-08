"""搜索用户弹窗"""
import customtkinter as ctk
from ..api_client import api


class SearchDialog(ctk.CTkToplevel):
    """搜索用户并发送好友请求的弹窗"""

    def __init__(self, master, on_request_sent=None, **kwargs):
        super().__init__(master, **kwargs)
        self.title("添加好友")
        self.geometry("380x420")
        self.resizable(False, False)
        self.on_request_sent_cb = on_request_sent

        # 模态
        self.grab_set()
        self._build_ui()

    def _build_ui(self):
        # 搜索区域
        search_frame = ctk.CTkFrame(self, fg_color="transparent")
        search_frame.pack(fill="x", padx=15, pady=(15, 5))

        self.search_entry = ctk.CTkEntry(
            search_frame, placeholder_text="输入用户名搜索...",
            height=34,
        )
        self.search_entry.pack(side="left", fill="x", expand=True, padx=(0, 8))
        self.search_entry.bind("<Return>", lambda e: self._do_search())

        search_btn = ctk.CTkButton(
            search_frame, text="搜索", width=70, height=34,
            command=self._do_search,
        )
        search_btn.pack(side="right")

        # 提示
        self.info_label = ctk.CTkLabel(self, text="", font=("", 12))
        self.info_label.pack(pady=(0, 5))

        # 结果列表
        self.results_frame = ctk.CTkScrollableFrame(self, height=260)
        self.results_frame.pack(fill="both", expand=True, padx=15, pady=(5, 15))

    def _do_search(self):
        query = self.search_entry.get().strip()
        if not query:
            self.info_label.configure(text="请输入搜索关键词", text_color="red")
            return

        # 清空旧结果
        for w in self.results_frame.winfo_children():
            w.destroy()

        try:
            users = api.search_users(query)
            if not users:
                self.info_label.configure(text="未找到匹配用户", text_color="gray")
                return
            self.info_label.configure(text=f"找到 {len(users)} 个用户", text_color="green")

            for user in users:
                self._add_user_row(user)
        except Exception as e:
            self.info_label.configure(text=str(e), text_color="red")

    def _add_user_row(self, user: dict):
        """添加搜索结果行"""
        frame = ctk.CTkFrame(self.results_frame, fg_color="transparent", height=40)
        frame.pack(fill="x", pady=3)

        ctk.CTkLabel(
            frame, text=user["username"],
            anchor="w", font=("", 13),
        ).pack(side="left", fill="x", expand=True, padx=5)

        add_btn = ctk.CTkButton(
            frame, text="添加好友", width=85, height=30,
            font=("", 11),
            command=lambda uid=user["id"]: self._send_request(uid),
        )
        add_btn.pack(side="right", padx=5)

    def _send_request(self, to_user_id: int):
        try:
            api.send_friend_request(to_user_id)
            self.info_label.configure(text="好友请求已发送！", text_color="green")
            if self.on_request_sent_cb:
                self.on_request_sent_cb()
        except Exception as e:
            self.info_label.configure(text=str(e), text_color="red")
