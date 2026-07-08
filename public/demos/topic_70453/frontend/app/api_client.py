"""REST API 调用封装"""
from __future__ import annotations
import requests
from .session import session
from .utils.config import API_BASE_URL


class APIClient:
    """封装所有 REST API 调用"""

    def __init__(self):
        self.base_url = API_BASE_URL

    def _auth_headers(self) -> dict:
        headers = {}
        if session.access_token:
            headers["Authorization"] = f"Bearer {session.access_token}"
        return headers

    def _handle_response(self, response) -> dict | list:
        if response.status_code in (200, 201):
            return response.json()
        try:
            detail = response.json().get("detail", "请求失败")
        except Exception:
            detail = f"HTTP {response.status_code}"
        raise Exception(detail)

    # ── 认证 ──
    def register(self, account: str, username: str, password: str) -> dict:
        resp = requests.post(
            f"{self.base_url}/api/auth/register",
            json={"account": account, "username": username, "password": password},
        )
        return self._handle_response(resp)

    def login(self, account: str, password: str) -> dict:
        resp = requests.post(
            f"{self.base_url}/api/auth/login",
            json={"account": account, "password": password},
        )
        return self._handle_response(resp)

    # ── 用户 ──
    def get_me(self) -> dict:
        resp = requests.get(
            f"{self.base_url}/api/users/me", headers=self._auth_headers(),
        )
        return self._handle_response(resp)

    def update_profile(self, username: str) -> dict:
        resp = requests.put(
            f"{self.base_url}/api/users/me/profile",
            json={"username": username},
            headers=self._auth_headers(),
        )
        return self._handle_response(resp)

    def upload_avatar(self, file_path: str) -> dict:
        with open(file_path, "rb") as f:
            resp = requests.post(
                f"{self.base_url}/api/users/me/avatar",
                files={"file": f},
                headers={"Authorization": self._auth_headers()["Authorization"]},
            )
        return self._handle_response(resp)

    def search_users(self, query: str) -> list:
        resp = requests.get(
            f"{self.base_url}/api/users/search",
            params={"q": query},
            headers=self._auth_headers(),
        )
        return self._handle_response(resp)

    # ── 好友 ──
    def get_friends(self) -> list:
        resp = requests.get(
            f"{self.base_url}/api/friends", headers=self._auth_headers(),
        )
        return self._handle_response(resp)

    def send_friend_request(self, to_user_id: int) -> dict:
        resp = requests.post(
            f"{self.base_url}/api/friends/requests",
            json={"to_user_id": to_user_id},
            headers=self._auth_headers(),
        )
        return self._handle_response(resp)

    def get_friend_requests(self) -> list:
        resp = requests.get(
            f"{self.base_url}/api/friends/requests", headers=self._auth_headers(),
        )
        return self._handle_response(resp)

    def accept_friend_request(self, request_id: int) -> dict:
        resp = requests.post(
            f"{self.base_url}/api/friends/requests/{request_id}/accept",
            headers=self._auth_headers(),
        )
        return self._handle_response(resp)

    def reject_friend_request(self, request_id: int) -> dict:
        resp = requests.post(
            f"{self.base_url}/api/friends/requests/{request_id}/reject",
            headers=self._auth_headers(),
        )
        return self._handle_response(resp)

    # ── 消息 ──
    def get_messages(self, user_id: int, limit: int = 50, offset: int = 0) -> list:
        resp = requests.get(
            f"{self.base_url}/api/messages/{user_id}",
            params={"limit": limit, "offset": offset},
            headers=self._auth_headers(),
        )
        return self._handle_response(resp)


api = APIClient()
