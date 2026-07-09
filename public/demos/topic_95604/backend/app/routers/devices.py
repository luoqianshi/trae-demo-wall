from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models.device import Device, DeviceType, DeviceStatus
from ..schemas.device import (
    DeviceCreate, DeviceUpdate, DeviceResponse,
    DeviceStatistics, DeviceListResponse, CameraInfo, StationWithCameras
)

router = APIRouter(prefix="/devices", tags=["设备管理"])

@router.get("/", response_model=DeviceListResponse)
def get_devices(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    device_type: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Device)
    
    if device_type:
        query = query.filter(Device.device_type == device_type)
    if status:
        query = query.filter(Device.status == status)
    if search:
        query = query.filter(
            (Device.name.contains(search)) |
            (Device.code.contains(search)) |
            (Device.location.contains(search))
        )
    
    total = query.count()
    items = query.order_by(Device.created_at.desc())\
                  .offset((page - 1) * page_size)\
                  .limit(page_size)\
                  .all()
    
    return DeviceListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size
    )

@router.get("/statistics", response_model=DeviceStatistics)
def get_device_statistics(db: Session = Depends(get_db)):
    total = db.query(Device).count()
    online = db.query(Device).filter(Device.status == DeviceStatus.ONLINE).count()
    offline = db.query(Device).filter(Device.status == DeviceStatus.OFFLINE).count()
    
    by_type = {}
    for dtype in DeviceType:
        count = db.query(Device).filter(Device.device_type == dtype).count()
        by_type[dtype.value] = count
    
    return DeviceStatistics(
        total=total,
        online=online,
        offline=offline,
        by_type=by_type
    )

@router.get("/stations")
def get_stations_with_cameras(db: Session = Depends(get_db)):
    """获取所有监测站及其摄像头信息"""
    # 模拟数据，实际应从数据库查询
    stations = [
        {
            "id": 1,
            "name": "北京监测站",
            "latitude": 39.90,
            "longitude": 116.40,
            "cameras": [
                {"id": "CAM-BJ-001", "name": "东门摄像头", "status": "online"},
                {"id": "CAM-BJ-002", "name": "西门摄像头", "status": "online"},
                {"id": "CAM-BJ-003", "name": "北门摄像头", "status": "offline"}
            ]
        },
        {
            "id": 2,
            "name": "上海监测站",
            "latitude": 31.23,
            "longitude": 121.47,
            "cameras": [
                {"id": "CAM-SH-001", "name": "园区入口", "status": "online"},
                {"id": "CAM-SH-002", "name": "仓库监控", "status": "online"}
            ]
        },
        {
            "id": 3,
            "name": "深圳监测站",
            "latitude": 22.54,
            "longitude": 114.06,
            "cameras": [
                {"id": "CAM-SZ-001", "name": "海岸线监控", "status": "online"},
                {"id": "CAM-SZ-002", "name": "港口监控", "status": "online"},
                {"id": "CAM-SZ-003", "name": "气象站监控", "status": "online"}
            ]
        },
        {
            "id": 4,
            "name": "重庆监测站",
            "latitude": 29.56,
            "longitude": 106.55,
            "cameras": [
                {"id": "CAM-CQ-001", "name": "山体监测A", "status": "online"},
                {"id": "CAM-CQ-002", "name": "山体监测B", "status": "offline"}
            ]
        }
    ]
    return stations

@router.get("/cameras/{camera_id}")
def get_camera_stream(camera_id: str, db: Session = Depends(get_db)):
    """获取摄像头视频流地址"""
    # 模拟数据，实际应从数据库查询
    cameras = {
        "CAM-BJ-001": {"stream_url": "rtsp://example.com/bj-001", "status": "online"},
        "CAM-BJ-002": {"stream_url": "rtsp://example.com/bj-002", "status": "online"},
        "CAM-SH-001": {"stream_url": "rtsp://example.com/sh-001", "status": "online"},
        "CAM-SZ-001": {"stream_url": "rtsp://example.com/sz-001", "status": "online"},
    }
    
    if camera_id not in cameras:
        raise HTTPException(status_code=404, detail="摄像头不存在")
    
    return cameras[camera_id]

@router.get("/{device_id}", response_model=DeviceResponse)
def get_device(device_id: int, db: Session = Depends(get_db)):
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="设备不存在")
    return device

@router.post("/", response_model=DeviceResponse)
def create_device(device_data: DeviceCreate, db: Session = Depends(get_db)):
    # 检查设备编号是否已存在
    existing = db.query(Device).filter(Device.code == device_data.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="设备编号已存在")
    
    db_device = Device(
        code=device_data.code,
        name=device_data.name,
        device_type=device_data.device_type,
        latitude=device_data.latitude,
        longitude=device_data.longitude,
        location=device_data.location,
        station_id=device_data.station_id,
        station_name=device_data.station_name,
        manufacturer=device_data.manufacturer,
        model=device_data.model,
        status=DeviceStatus.ONLINE
    )
    db.add(db_device)
    db.commit()
    db.refresh(db_device)
    return db_device

@router.put("/{device_id}", response_model=DeviceResponse)
def update_device(
    device_id: int,
    device_data: DeviceUpdate,
    db: Session = Depends(get_db)
):
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="设备不存在")
    
    update_data = device_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(device, key, value)
    
    db.commit()
    db.refresh(device)
    return device

@router.delete("/{device_id}")
def delete_device(device_id: int, db: Session = Depends(get_db)):
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="设备不存在")
    
    db.delete(device)
    db.commit()
    return {"message": "设备删除成功"}
