"""通用响应模型"""
from typing import Optional, Any, Generic, TypeVar
from pydantic import BaseModel

T = TypeVar("T")


class BaseResponse(BaseModel, Generic[T]):
    """基础响应"""
    code: int = 0
    message: str = "success"
    data: Optional[T] = None


class PageResponse(BaseModel, Generic[T]):
    """分页响应"""
    code: int = 0
    message: str = "success"
    data: Optional["PageData[T]"] = None


class PageData(BaseModel, Generic[T]):
    """分页数据"""
    list: list[T]
    total: int
    page: int
    page_size: int
