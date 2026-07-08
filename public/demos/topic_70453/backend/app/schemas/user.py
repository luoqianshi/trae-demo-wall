"""请求/响应 Schema 定义 — 用户相关"""
from typing import Optional
from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    """注册请求"""
    account: str = Field(..., min_length=3, max_length=50, description="账号（登录用）")
    username: str = Field(..., min_length=2, max_length=50, description="昵称（显示用）")
    password: str = Field(..., min_length=6, max_length=100, description="密码")


class LoginRequest(BaseModel):
    """登录请求"""
    account: str = Field(..., description="账号")
    password: str = Field(..., description="密码")


class UpdateProfileRequest(BaseModel):
    """更新个人信息请求"""
    username: Optional[str] = Field(None, min_length=2, max_length=50, description="新昵称")


class TokenResponse(BaseModel):
    """登录成功返回的 Token"""
    access_token: str
    token_type: str = "bearer"
    user_id: int
    account: str = ""
    username: str = ""


class UserResponse(BaseModel):
    """用户信息响应"""
    id: int
    account: str
    username: str
    avatar_url: str = ""
    status: str
    created_at: str

    class Config:
        from_attributes = True
