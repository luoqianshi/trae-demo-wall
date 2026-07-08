"""本地会话管理 — 存储和读取 Token 及用户信息"""
from dataclasses import dataclass


@dataclass
class Session:
    """当前用户会话数据"""
    access_token: str = ""
    user_id: int = 0
    account: str = ""
    username: str = ""
    avatar_url: str = ""

    @property
    def is_logged_in(self) -> bool:
        return bool(self.access_token)

    def set_login(self, access_token: str, user_id: int, account: str, username: str):
        self.access_token = access_token
        self.user_id = user_id
        self.account = account
        self.username = username

    def logout(self):
        self.access_token = ""
        self.user_id = 0
        self.account = ""
        self.username = ""
        self.avatar_url = ""


session = Session()
