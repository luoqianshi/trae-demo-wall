from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# 鉴别相关
class IdentifyRequest(BaseModel):
    jade_type: str = "和田玉"
    light_mode: str = "side_45"


class IdentifyResponse(BaseModel):
    id: int
    image_url: str
    jade_type: str
    light_mode: str
    is_authentic: Optional[bool] = None
    confidence: Optional[float] = None
    features: Optional[str] = None
    suggestion: Optional[str] = None
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class IdentifyResult(BaseModel):
    is_authentic: bool
    confidence: float
    features: str
    suggestion: str


# 用户相关
class UserBase(BaseModel):
    phone: Optional[str] = None
    nickname: Optional[str] = None
    avatar_url: Optional[str] = None


class UserCreate(UserBase):
    password: Optional[str] = None


class UserResponse(UserBase):
    id: int
    is_active: bool
    free_quota: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class LoginRequest(BaseModel):
    phone: str
    code: str


# 管理员相关
class AdminLoginRequest(BaseModel):
    username: str
    password: str


class AdminResponse(BaseModel):
    id: int
    username: str
    nickname: str
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# 统计相关
class StatsResponse(BaseModel):
    total_identifies: int
    today_identifies: int
    total_users: int
    ai_accuracy: float
