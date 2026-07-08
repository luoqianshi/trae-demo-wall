"""好友请求面板"""
import customtkinter as ctk
from ..api_client import api


class FriendRequestsPanel(ctk.CTkFrame):
    """显示和处理好友请求"""

    def __init__(self, master, on_accepted=None, **kwargs):
        super().__init__(master, **kwargs)
        self.on_accepted = on_accepted
        self._build_ui()

    def _build_ui(self):
        # 标题
        header = ctk.CTkFrame(self, fg_color="transparent")
        header.pack(fill="x", padx=10, pady=(10, 5))

        ctk.CTkLabel(
            header, text="好友请求",
            font=("", 15, "bold"),
        ).pack(side="left")

        close_btn = ctk.CTkButton(
            header, text="✕", width=30, height=30,
            fg_color="transparent", text_color=("gray50", "gray60"),
            hover_color=("gray85", "gray25"),
            command=lambda: self.place_forget(),
        )
        close_btn.pack(side="right")

        # 请求列表
        self.requests_frame = ctk.CTkScrollableFrame(self)
        self.requests_frame.pack(fill="both", expand=True, padx=10, pady=(5, 10))

    def refresh(self):
        """刷新请求列表"""
        for w in self.requests_frame.winfo_children():
            w.destroy()

        try:
            requests = api.get_friend_requests()
            if not requests:
                ctk.CTkLabel(
                    self.requests_frame,
                    text="暂无待处理的好友请求",
                    text_color=("gray50", "gray60"),
                ).pack(pady=30)
                return

            for req in requests:
                self._add_request_row(req)
        except Exception as e:
            ctk.CTkLabel(
                self.requests_frame,
                text=f"加载失败: {e}",
                text_color="red",
            ).pack(pady=10)

    def _add_request_row(self, req: dict):
        """添加请求行"""
        frame = ctk.CTkFrame(self.requests_frame, fg_color="transparent", height=45)
        frame.pack(fill="x", pady=3)

        ctk.CTkLabel(
            frame,
            text=f"来自: {req.get('from_username', req['from_user_id'])}",
            anchor="w",
            font=("", 12),
        ).pack(side="left", fill="x", expand=True, padx=5)

        reject_btn = ctk.CTkButton(
            frame, text="拒绝", width=55, height=28,
            font=("", 11),
            fg_color=("gray75", "gray35"),
            command=lambda rid=req["id"]: self._reject(rid),
        )
        reject_btn.pack(side="right", padx=3)

        accept_btn = ctk.CTkButton(
            frame, text="接受", width=55, height=28,
            font=("", 11),
            fg_color="#4CAF50",
            hover_color="#388E3C",
            command=lambda rid=req["id"]: self._accept(rid),
        )
        accept_btn.pack(side="right", padx=3)

    def _accept(self, request_id: int):
        try:
            api.accept_friend_request(request_id)
            self.refresh()
            if self.on_accepted:
                self.on_accepted()
        except Exception:
            pass

    def _reject(self, request_id: int):
        try:
            api.reject_friend_request(request_id)
            self.refresh()
        except Exception:
            pass
