"""个人资料编辑界面"""
import os
import customtkinter as ctk
from tkinter import filedialog
from ..api_client import api
from ..session import session
from ..utils.avatar import load_avatar


class ProfileView(ctk.CTkToplevel):
    """修改头像和昵称"""

    def __init__(self, master, on_profile_updated=None, **kwargs):
        super().__init__(master, **kwargs)
        self.title("个人资料")
        self.geometry("360x420")
        self.resizable(False, False)
        self.grab_set()
        self.on_profile_updated = on_profile_updated
        self._build_ui()

    def _build_ui(self):
        ctk.CTkLabel(self, text="个人资料", font=("", 18, "bold")).pack(pady=(20, 15))

        # 头像
        self.avatar_label = ctk.CTkLabel(self, text="", width=100, height=100)
        self.avatar_label.pack(pady=(5, 8))
        self._refresh_avatar()

        upload_btn = ctk.CTkButton(
            self, text="更换头像", width=120, height=30, font=("", 11),
            fg_color="#a5d6a7", text_color="#1b5e20", hover_color="#81c784",
            command=self._choose_avatar,
        )
        upload_btn.pack(pady=(0, 15))

        # 分隔
        ctk.CTkFrame(self, height=1, fg_color="#e0e0e0").pack(fill="x", padx=30)

        # 账号（只读）
        ctk.CTkLabel(self, text="账号", font=("", 12), text_color="gray").pack(pady=(15, 2))
        self.account_label = ctk.CTkLabel(self, text=session.account, font=("", 13, "bold"))
        self.account_label.pack()

        # 昵称（可改）
        ctk.CTkLabel(self, text="昵称", font=("", 12), text_color="gray").pack(pady=(12, 2))
        self.username_entry = ctk.CTkEntry(self, width=220, height=32)
        self.username_entry.insert(0, session.username)
        self.username_entry.pack(pady=(3, 5))

        self.info_label = ctk.CTkLabel(self, text="", font=("", 11))
        self.info_label.pack()

        save_btn = ctk.CTkButton(
            self, text="保存昵称", width=140, height=32, font=("", 12),
            fg_color="#43a047", hover_color="#2e7d32",
            command=self._save_username,
        )
        save_btn.pack(pady=(8, 10))

    def _refresh_avatar(self):
        ctk_img = load_avatar(session.avatar_url, 100)
        if ctk_img:
            self.avatar_label.configure(image=ctk_img, text="")
        else:
            self.avatar_label.configure(
                text="\U0001f464", image=None, font=("", 48),
                fg_color="#e0e0e0", corner_radius=50,
            )

    def _choose_avatar(self):
        file_path = filedialog.askopenfilename(
            title="选择头像图片",
            filetypes=[("图片文件", "*.png *.jpg *.jpeg *.bmp")],
        )
        if not file_path:
            return
        try:
            result = api.upload_avatar(file_path)
            session.avatar_url = result["avatar_url"]
            self._refresh_avatar()
            self.info_label.configure(text="头像已更新", text_color="green")
            if self.on_profile_updated:
                self.on_profile_updated()
        except Exception as e:
            self.info_label.configure(text=str(e), text_color="red")

    def _save_username(self):
        new_name = self.username_entry.get().strip()
        if not new_name or len(new_name) < 2:
            self.info_label.configure(text="昵称至少 2 个字符", text_color="red")
            return
        if new_name == session.username:
            return
        try:
            result = api.update_profile(new_name)
            session.username = result["username"]
            self.info_label.configure(text="昵称已保存", text_color="green")
            if self.on_profile_updated:
                self.on_profile_updated()
        except Exception as e:
            self.info_label.configure(text=str(e), text_color="red")
