from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class SensorDataBase(BaseModel):
    device_id: int
    device_code: str
    sensor_type: str
    value: float
    unit: str
    latitude: float
    longitude: float

class SensorDataCreate(SensorDataBase):
    timestamp: Optional[datetime] = None

class SensorDataResponse(SensorDataBase):
    id: int
    timestamp: datetime
    
    class Config:
        from_attributes = True

class SensorDataListResponse(BaseModel):
    items: List[SensorDataResponse]
    total: int

class RealTimeData(BaseModel):
    """实时传感器数据"""
    device_code: str
    device_name: str
    device_type: str
    data: Dict[str, Any]  # 包含温度、湿度、气压等
    timestamp: datetime

class HistoricalDataRequest(BaseModel):
    device_code: str
    start_time: datetime
    end_time: datetime
    sensor_types: Optional[List[str]] = None

class HistoricalDataResponse(BaseModel):
    device_code: str
    data: List[Dict[str, Any]]
