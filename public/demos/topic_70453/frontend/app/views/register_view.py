"""注册界面"""
import customtkinter as ctk
from ..api_client import api


class RegisterView(ctk.CTkFrame):
    def __init__(self, master, on_register_success, on_go_login, **kwargs):
        super().__init__(master, **kwargs)
        self.on_register_success = on_register_success
        self.on_go_login = on_go_login
        self._build_ui()

    def _build_ui(self):
        ctk.CTkLabel(self, text="注册新账号", font=("", 24, "bold")).pack(pady=(60, 25))

        ctk.CTkLabel(self, text="账号（用于登录）", font=("", 12)).pack()
        self.account_entry = ctk.CTkEntry(self, width=300, height=34)
        self.account_entry.pack(pady=(5, 12))

        ctk.CTkLabel(self, text="昵称（用于显示）", font=("", 12)).pack()
        self.username_entry = ctk.CTkEntry(self, width=300, height=34)
        self.username_entry.pack(pady=(5, 12))

        ctk.CTkLabel(self, text="密码", font=("", 12)).pack()
        self.password_entry = ctk.CTkEntry(self, width=300, height=34, show="*")
        self.password_entry.pack(pady=(5, 12))

        ctk.CTkLabel(self, text="确认密码", font=("", 12)).pack()
        self.confirm_entry = ctk.CTkEntry(self, width=300, height=34, show="*")
        self.confirm_entry.pack(pady=(5, 8))
        self.confirm_entry.bind("<Return>", lambda e: self._on_register())

        self.info_label = ctk.CTkLabel(self, text="", font=("", 12))
        self.info_label.pack(pady=(3, 3))

        ctk.CTkButton(
            self, text="注 册", width=300, height=36, command=self._on_register,
        ).pack(pady=(8, 15))

        ctk.CTkButton(
            self, text="已有账号？去登录",
            fg_color="transparent", text_color=("gray50", "gray60"),
            hover_color=("gray85", "gray25"),
            command=self.on_go_login,
        ).pack()

    def _on_register(self):
        account = self.account_entry.get().strip()
        username = self.username_entry.get().strip()
        password = self.password_entry.get().strip()
        confirm = self.confirm_entry.get().strip()

        if not account or not username or not password:
            self.info_label.configure(text="请填写所有字段", text_color="red")
            return
        if len(account) < 3:
            self.info_label.configure(text="账号至少 3 个字符", text_color="red")
            return
        if len(username) < 2:
            self.info_label.configure(text="昵称至少 2 个字符", text_color="red")
            return
        if len(password) < 6:
            self.info_label.configure(text="密码至少 6 个字符", text_color="red")
            return
        if password != confirm:
            self.info_label.configure(text="两次密码不一致", text_color="red")
            return
        try:
            api.register(account, username, password)
            self.info_label.configure(text="注册成功！请返回登录", text_color="green")
            self.after(1500, self.on_register_success)
        except Exception as e:
            self.info_label.configure(text=str(e), text_color="red")
