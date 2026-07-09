from sqlalchemy import Column, Integer, String, Float, DateTime, Enum as SQLEnum, Boolean, Text
from sqlalchemy.sql import func
from ..database import Base
import enum

class DeviceType(str, enum.Enum):
    TEMP_HUMIDITY = "temp_humidity"  # 温湿度传感器
    WATER_LEVEL = "water_level"      # 水位传感器
    FIRE_DETECTOR = "fire_detector"  # 火灾探测器
    EARTHQUAKE = "earthquake"        # 地震传感器
    WIND_SPEED = "wind_speed"        # 风速传感器
    CAMERA = "camera"                # 监控摄像头
    RAIN_GAUGE = "rain_gauge"        # 雨量计

class DeviceStatus(str, enum.Enum):
    ONLINE = "online"
    OFFLINE = "offline"
    MAINTENANCE = "maintenance"
    FAULT = "fault"

class Device(Base):
    __tablename__ = "devices"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)  # 设备编号
    name = Column(String(100), nullable=False)  # 设备名称
    device_type = Column(SQLEnum(DeviceType), nullable=False)  # 设备类型
    
    # 位置信息
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    location = Column(String(200))  # 安装位置
    
    status = Column(SQLEnum(DeviceStatus), default=DeviceStatus.ONLINE)  # 状态
    
    # 设备详情
    manufacturer = Column(String(100))  # 制造商
    model = Column(String(100))  # 型号
    install_date = Column(DateTime(timezone=True), nullable=True)  # 安装日期
    
    # 最新数据
    latest_value = Column(String(100))  # 最新数据值
    latest_update = Column(DateTime(timezone=True), nullable=True)  # 最后更新时间
    
    # 电量/状态
    battery_level = Column(Integer, default=100)  # 电量百分比
    signal_strength = Column(Integer)  # 信号强度
    
    # 摄像头特有字段
    ip_address = Column(String(50), nullable=True)  # IP地址
    stream_url = Column(String(500), nullable=True)  # 视频流地址
    
    # 关联监测站
    station_id = Column(Integer, nullable=True)  # 监测站ID
    station_name = Column(String(100), nullable=True)  # 监测站名称
    
    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
