"""Schema 导出"""
from app.schemas.common import BaseResponse, PageResponse, PageData
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    UserInfo,
    RefreshTokenRequest,
)
from app.schemas.friend import (
    AvatarConfig,
    CreateFriendRequest,
    UpdateFriendRequest,
    FriendListItem,
    FriendDetail,
    FriendResponse,
)
from app.schemas.chat import (
    SendMessageRequest,
    MessageItem,
    ChatHistoryResponse,
    SendMessageResponse,
)
from app.schemas.memory import MemoryItem, MemoryResponse

__all__ = [
    "BaseResponse",
    "PageResponse",
    "PageData",
    "RegisterRequest",
    "LoginRequest",
    "TokenResponse",
    "UserInfo",
    "RefreshTokenRequest",
    "AvatarConfig",
    "CreateFriendRequest",
    "UpdateFriendRequest",
    "FriendListItem",
    "FriendDetail",
    "FriendResponse",
    "SendMessageRequest",
    "MessageItem",
    "ChatHistoryResponse",
    "SendMessageResponse",
    "MemoryItem",
    "MemoryResponse",
]
