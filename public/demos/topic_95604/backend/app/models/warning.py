from sqlalchemy import Column, Integer, String, Float, DateTime, Enum as SQLEnum, Text
from sqlalchemy.sql import func
from ..database import Base
import enum

class WarningLevel(str, enum.Enum):
    RED = "red"      # 红色 - 特别严重
    ORANGE = "orange"  # 橙色 - 严重
    YELLOW = "yellow"  # 黄色 - 较重
    BLUE = "blue"    # 蓝色 - 一般

class WarningType(str, enum.Enum):
    FIRE = "fire"          # 火灾
    FLOOD = "flood"        # 洪水
    EARTHQUAKE = "earthquake"  # 地震
    LANDSLIDE = "landslide"    # 滑坡
    TYPHOON = "typhoon"        # 台风
    DROUGHT = "drought"        # 干旱
    DEBRIS_FLOW = "debris_flow"  # 泥石流

class WarningStatus(str, enum.Enum):
    ACTIVE = "active"      # 进行中
    HANDLED = "handled"    # 已处理
    RESOLVED = "resolved"   # 已解除

class Warning(Base):
    __tablename__ = "warnings"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)  # 预警编号
    title = Column(String(200), nullable=False)  # 预警标题
    description = Column(Text)  # 预警描述
    
    level = Column(SQLEnum(WarningLevel), nullable=False)  # 预警等级
    warning_type = Column(SQLEnum(WarningType), nullable=False)  # 预警类型
    status = Column(SQLEnum(WarningStatus), default=WarningStatus.ACTIVE)  # 状态
    
    # 位置信息
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    location = Column(String(200))  # 位置描述
    
    # 建议措施
    measures = Column(Text)
    
    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    handled_at = Column(DateTime(timezone=True), nullable=True)  # 处理时间
