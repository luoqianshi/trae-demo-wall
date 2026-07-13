"""记忆相关模型"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class MemoryItem(BaseModel):
    """记忆项"""
    id: str
    content: str
    recorded_at: datetime
    source: str
    importance: int

    class Config:
        from_attributes = True


class MemoryResponse(BaseModel):
    """记忆响应"""
    list: List[MemoryItem]
    total: int
    page: int
    page_size: int
