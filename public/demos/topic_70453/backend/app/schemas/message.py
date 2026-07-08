"""请求/响应 Schema 定义 — 消息相关"""
from pydantic import BaseModel, Field


class MessageResponse(BaseModel):
    """消息响应"""
    id: int
    sender_id: int
    receiver_id: int
    content: str
    is_read: bool
    created_at: str

    class Config:
        from_attributes = True
