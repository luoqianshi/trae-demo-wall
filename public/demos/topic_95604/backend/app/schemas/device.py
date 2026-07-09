from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class DeviceType(str, Enum):
    TEMP_HUMIDITY = "temp_humidity"
    WATER_LEVEL = "water_level"
    FIRE_DETECTOR = "fire_detector"
    EARTHQUAKE = "earthquake"
    WIND_SPEED = "wind_speed"
    CAMERA = "camera"
    RAIN_GAUGE = "rain_gauge"

class DeviceStatus(str, Enum):
    ONLINE = "online"
    OFFLINE = "offline"
    MAINTENANCE = "maintenance"
    FAULT = "fault"

class DeviceBase(BaseModel):
    name: str = Field(..., description="设备名称")
    device_type: DeviceType = Field(..., description="设备类型")
    latitude: float = Field(..., description="纬度")
    longitude: float = Field(..., description="经度")
    location: Optional[str] = Field(None, description="安装位置")
    station_id: Optional[int] = Field(None, description="监测站ID")
    station_name: Optional[str] = Field(None, description="监测站名称")

class DeviceCreate(DeviceBase):
    code: str = Field(..., description="设备编号")
    manufacturer: Optional[str] = None
    model: Optional[str] = None

class DeviceUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[DeviceStatus] = None
    location: Optional[str] = None
    latest_value: Optional[str] = None
    battery_level: Optional[int] = None

class DeviceResponse(DeviceBase):
    id: int
    code: str
    status: DeviceStatus
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    latest_value: Optional[str] = None
    latest_update: Optional[datetime] = None
    battery_level: int
    ip_address: Optional[str] = None
    stream_url: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class DeviceStatistics(BaseModel):
    total: int
    online: int
    offline: int
    by_type: dict

class DeviceListResponse(BaseModel):
    items: List[DeviceResponse]
    total: int
    page: int
    page_size: int

class CameraInfo(BaseModel):
    """摄像头信息"""
    id: str
    name: str
    status: str
    stream_url: Optional[str] = None

class StationWithCameras(BaseModel):
    """带摄像头的监测站"""
    id: int
    name: str
    latitude: float
    longitude: float
    cameras: List[CameraInfo]
