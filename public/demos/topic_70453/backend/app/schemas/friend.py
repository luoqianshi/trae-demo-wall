"""请求/响应 Schema 定义 — 好友相关"""
from pydantic import BaseModel, Field


class FriendRequestCreate(BaseModel):
    """发送好友请求"""
    to_user_id: int = Field(..., description="接收方用户 ID")


class FriendRequestResponse(BaseModel):
    """好友请求响应"""
    id: int
    from_user_id: int
    from_username: str = ""
    from_avatar_url: str = ""
    to_user_id: int
    to_username: str = ""
    status: str
    created_at: str

    class Config:
        from_attributes = True


class FriendResponse(BaseModel):
    """好友信息响应"""
    id: int
    username: str
    avatar_url: str = ""
    status: str

    class Config:
        from_attributes = True
