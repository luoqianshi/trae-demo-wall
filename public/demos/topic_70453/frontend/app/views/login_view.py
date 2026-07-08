"""登录界面"""
import customtkinter as ctk
from ..api_client import api
from ..session import session


class LoginView(ctk.CTkFrame):
    def __init__(self, master, on_login_success, on_go_register, **kwargs):
        super().__init__(master, **kwargs)
        self.on_login_success = on_login_success
        self.on_go_register = on_go_register
        self._build_ui()

    def _build_ui(self):
        title = ctk.CTkLabel(self, text="登录 Chat Platform", font=("", 24, "bold"))
        title.pack(pady=(80, 30))

        ctk.CTkLabel(self, text="账号", font=("", 13)).pack()
        self.account_entry = ctk.CTkEntry(self, width=300, height=36)
        self.account_entry.pack(pady=(5, 15))

        ctk.CTkLabel(self, text="密码", font=("", 13)).pack()
        self.password_entry = ctk.CTkEntry(self, width=300, height=36, show="*")
        self.password_entry.pack(pady=(5, 10))
        self.password_entry.bind("<Return>", lambda e: self._on_login())

        self.error_label = ctk.CTkLabel(self, text="", text_color="red", font=("", 12))
        self.error_label.pack(pady=(5, 5))

        login_btn = ctk.CTkButton(
            self, text="登 录", width=300, height=38, command=self._on_login,
        )
        login_btn.pack(pady=(10, 20))

        register_btn = ctk.CTkButton(
            self, text="没有账号？去注册",
            fg_color="transparent", text_color=("gray50", "gray60"),
            hover_color=("gray85", "gray25"),
            command=self.on_go_register,
        )
        register_btn.pack()

    def _on_login(self):
        account = self.account_entry.get().strip()
        password = self.password_entry.get().strip()
        if not account or not password:
            self.error_label.configure(text="请输入账号和密码")
            return
        try:
            result = api.login(account, password)
            session.set_login(
                access_token=result["access_token"],
                user_id=result["user_id"],
                account=result.get("account", account),
                username=result["username"],
            )
            # 拉取完整信息（含 avatar_url）
            try:
                me = api.get_me()
                session.avatar_url = me.get("avatar_url", "")
            except Exception:
                pass
            self.on_login_success()
        except Exception as e:
            self.error_label.configure(text=str(e))
