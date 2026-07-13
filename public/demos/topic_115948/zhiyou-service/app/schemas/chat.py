"""聊天相关模型"""
from datetime import datetime
from typing import Optional, List, Literal
from pydantic import BaseModel, Field


class SendMessageRequest(BaseModel):
    """发送消息请求"""
    content: str = Field(..., min_length=1, max_length=2000, description="消息内容")
    message_type: Literal["text", "image", "voice"] = Field(default="text", description="消息类型")


class MessageItem(BaseModel):
    """消息项"""
    id: str
    role: str
    content: str
    message_type: str
    created_at: datetime

    class Config:
        from_attributes = True


class ChatHistoryResponse(BaseModel):
    """聊天历史响应"""
    list: List[MessageItem]
    has_more: bool


class SendMessageResponse(BaseModel):
    """发送消息响应"""
    id: str
    role: str = "assistant"
    content: str
    message_type: str = "text"
    created_at: datetime

    class Config:
        from_attributes = True
