"""智友相关模型"""
from datetime import datetime
from typing import Optional, List, Literal
from pydantic import BaseModel, Field


class AvatarConfig(BaseModel):
    """形象配置"""
    hairstyle: str = "short_hair"
    face_shape: str = "round"
    clothing: str = "casual"
    color: str = "#FF6B6B"


class CreateFriendRequest(BaseModel):
    """创建智友请求"""
    name: str = Field(..., min_length=2, max_length=20, description="智友名称")
    description: Optional[str] = Field(None, max_length=255, description="一句话描述")
    identity: Literal["friend", "bestie", "teacher", "doctor", "lawyer", "counselor"] = Field(..., description="身份类型")
    avatar_config: AvatarConfig = Field(default_factory=AvatarConfig, description="形象配置")
    personality_traits: List[str] = Field(default=[], description="性格特点标签")
    speaking_style: Literal["gentle", "humorous", "professional", "warm", "calm", "normal"] = Field(default="normal", description="说话风格")


class UpdateFriendRequest(BaseModel):
    """更新智友请求"""
    name: Optional[str] = Field(None, min_length=2, max_length=20)
    description: Optional[str] = Field(None, max_length=255)
    avatar_config: Optional[AvatarConfig] = None
    personality_traits: Optional[List[str]] = None
    speaking_style: Optional[Literal["gentle", "humorous", "professional", "warm", "calm", "normal"]] = None
    is_default: Optional[bool] = None


class FriendListItem(BaseModel):
    """智友列表项"""
    id: str
    name: str
    identity: str
    identity_label: str
    avatar_config: AvatarConfig
    last_message: Optional[str] = None
    last_message_at: Optional[datetime] = None
    unread_count: int = 0

    class Config:
        from_attributes = True


class FriendDetail(BaseModel):
    """智友详情"""
    id: str
    name: str
    description: Optional[str] = None
    identity: str
    identity_label: str
    avatar_config: AvatarConfig
    personality_traits: List[str]
    speaking_style: str
    speaking_style_label: str
    companion_days: int
    chat_count: int
    memory_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class FriendResponse(BaseModel):
    """智友响应"""
    id: str
    name: str
    identity: str
    identity_label: str
    avatar_config: AvatarConfig
    last_message: Optional[str] = None
    last_message_at: Optional[datetime] = None
    unread_count: int = 0
    companion_days: int = 0
    chat_count: int = 0
    memory_count: int = 0

    class Config:
        from_attributes = True
