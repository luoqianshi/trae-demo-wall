from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class WarningLevel(str, Enum):
    RED = "red"
    ORANGE = "orange"
    YELLOW = "yellow"
    BLUE = "blue"

class WarningType(str, Enum):
    FIRE = "fire"
    FLOOD = "flood"
    EARTHQUAKE = "earthquake"
    LANDSLIDE = "landslide"
    TYPHOON = "typhoon"
    DROUGHT = "drought"
    DEBRIS_FLOW = "debris_flow"

class WarningStatus(str, Enum):
    ACTIVE = "active"
    HANDLED = "handled"
    RESOLVED = "resolved"

class WarningBase(BaseModel):
    title: str = Field(..., description="预警标题")
    description: Optional[str] = Field(None, description="预警描述")
    level: WarningLevel = Field(..., description="预警等级")
    warning_type: WarningType = Field(..., description="预警类型")
    latitude: float = Field(..., description="纬度")
    longitude: float = Field(..., description="经度")
    location: Optional[str] = Field(None, description="位置描述")
    measures: Optional[str] = Field(None, description="建议措施")

class WarningCreate(WarningBase):
    pass

class WarningUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    level: Optional[WarningLevel] = None
    status: Optional[WarningStatus] = None
    measures: Optional[str] = None

class WarningResponse(WarningBase):
    id: int
    code: str
    status: WarningStatus
    created_at: datetime
    updated_at: Optional[datetime] = None
    handled_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class WarningStatistics(BaseModel):
    total: int
    by_level: dict
    by_type: dict
    by_status: dict

class WarningListResponse(BaseModel):
    items: List[WarningResponse]
    total: int
    page: int
    page_size: int
