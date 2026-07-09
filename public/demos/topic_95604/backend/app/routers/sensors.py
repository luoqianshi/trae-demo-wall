from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from ..database import get_db
from ..schemas.sensor import (
    SensorDataCreate, SensorDataResponse, SensorDataListResponse,
    RealTimeData, HistoricalDataRequest, HistoricalDataResponse
)

router = APIRouter(prefix="/sensors", tags=["传感器数据"])

# 模拟传感器数据存储
MOCK_SENSOR_DATA = []

@router.get("/realtime")
def get_realtime_data():
    """获取实时传感器数据"""
    # 模拟数据
    data = [
        {
            "device_code": "TH-1024-001",
            "device_name": "温湿度传感器 TH-1024",
            "device_type": "temp_humidity",
            "data": {
                "temperature": 32.5,
                "humidity": 45.0,
                "pressure": 1013.0
            },
            "timestamp": datetime.now().isoformat()
        },
        {
            "device_code": "WL-2031-002",
            "device_name": "水位传感器 WL-2031",
            "device_type": "water_level",
            "data": {
                "level": 2.3,
                "flow": 450.0,
                "alert": False
            },
            "timestamp": datetime.now().isoformat()
        },
        {
            "device_code": "EQ-3056-003",
            "device_name": "地震传感器 EQ-3056",
            "device_type": "earthquake",
            "data": {
                "magnitude": 0.0,
                "max_magnitude": 5.2
            },
            "timestamp": datetime.now().isoformat()
        }
    ]
    return data

@router.get("/history")
def get_historical_data(
    device_code: str = Query(...),
    start_time: Optional[str] = None,
    end_time: Optional[str] = None,
    limit: int = Query(100, ge=1, le=1000)
):
    """获取历史传感器数据"""
    # 模拟历史数据
    now = datetime.now()
    data = []
    for i in range(limit):
        timestamp = now - timedelta(minutes=i * 5)
        data.append({
            "device_code": device_code,
            "timestamp": timestamp.isoformat(),
            "temperature": 25.0 + (i % 10) * 0.5,
            "humidity": 50.0 + (i % 20)
        })
    return {"device_code": device_code, "data": data}

@router.post("/data", response_model=SensorDataResponse)
def create_sensor_data(
    sensor_data: SensorDataCreate,
    db: Session = Depends(get_db)
):
    """创建传感器数据记录"""
    # 在实际应用中，这里应该保存到数据库
    MOCK_SENSOR_DATA.append(sensor_data)
    return {
        "id": len(MOCK_SENSOR_DATA),
        **sensor_data.model_dump(),
        "timestamp": datetime.now()
    }

@router.get("/latest/{device_code}")
def get_latest_sensor_data(device_code: str):
    """获取设备最新数据"""
    # 模拟数据
    return {
        "device_code": device_code,
        "timestamp": datetime.now().isoformat(),
        "data": {
            "temperature": 32.5,
            "humidity": 45.0,
            "pressure": 1013.0
        }
    }