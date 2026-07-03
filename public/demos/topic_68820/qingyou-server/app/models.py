"""数据库模型定义（独立 SQLAlchemy，不依赖 Flask-SQLAlchemy）"""
from datetime import datetime

from sqlalchemy import Column, Integer, String, JSON, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class City(Base):
    """城市表"""
    __tablename__ = 'cities'

    id = Column(Integer, primary_key=True)
    name = Column(String(50), unique=True, nullable=False)

    aliases = relationship('CityAlias', backref='city_ref',
                           cascade='all, delete-orphan')

    def to_dict(self):
        return {'id': self.id, 'name': self.name}


class CityAlias(Base):
    """城市别称表（用于智能匹配拼音/简称/别称）"""
    __tablename__ = 'city_aliases'

    id = Column(Integer, primary_key=True)
    city_name = Column(String(50), ForeignKey('cities.name'), nullable=False)
    alias = Column(String(50), nullable=False)


class Weather(Base):
    """城市天气模拟数据表"""
    __tablename__ = 'weather'

    id = Column(Integer, primary_key=True)
    city = Column(String(50), unique=True, nullable=False)
    text = Column(String(20), nullable=False)
    temp = Column(String(20), nullable=False)
    icon = Column(String(10), nullable=False)

    def to_dict(self):
        return {'text': self.text, 'temp': self.temp, 'icon': self.icon}


class Activity(Base):
    """活动库表"""
    __tablename__ = 'activities'

    id = Column(String(10), primary_key=True)
    name = Column(String(100), nullable=False)
    type = Column(String(20), nullable=False)
    mood = Column(JSON, nullable=False)
    energy = Column(JSON, nullable=False)
    interests = Column(JSON, nullable=False)
    city = Column(JSON, nullable=False)
    duration = Column(Integer, nullable=False)
    cost = Column(Integer, nullable=False)
    slot = Column(String(20), nullable=False)
    tip = Column(Text)
    location = Column(String(100))  # 具体地点名称
    address = Column(String(200))   # 具体地址/街区
    # 适配人群（独行/情侣/带长辈/带小孩/朋友结伴）
    groups = Column(JSON, nullable=False, default=list)
    # 交通方式（自驾/公交/步行）
    transport = Column(JSON, nullable=False, default=list)
    # 出行强度 1-4（用于按人群筛选）
    intensity = Column(Integer, nullable=False, default=2)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'type': self.type,
            'mood': self.mood,
            'energy': self.energy,
            'interests': self.interests,
            'city': self.city,
            'duration': self.duration,
            'cost': self.cost,
            'slot': self.slot,
            'tip': self.tip,
            'location': self.location,
            'address': self.address,
            'groups': self.groups,
            'transport': self.transport,
            'intensity': self.intensity,
        }


class Plan(Base):
    """已保存的方案表"""
    __tablename__ = 'plans'

    id = Column(Integer, primary_key=True, autoincrement=True)
    mood = Column(String(20))  # 选填增强
    energy = Column(String(20))  # 选填增强
    days = Column(Integer, nullable=False)
    interests = Column(JSON, nullable=False)
    city = Column(String(50), nullable=False)  # 必填：出发地
    plan_data = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    # 必填三件套扩展
    group = Column(String(20), nullable=False)  # 人数构成
    depart_time = Column(String(10))  # 可出发时间
    return_time = Column(String(10))  # 必须返回时间
    # 选填增强
    budget_ceiling = Column(Integer)  # 预算上限
    transport = Column(String(20))  # 交通方式

    def to_dict(self):
        return {
            'id': self.id,
            'mood': self.mood,
            'energy': self.energy,
            'days': self.days,
            'interests': self.interests,
            'city': self.city,
            'plan_data': self.plan_data,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'group': self.group,
            'depart_time': self.depart_time,
            'return_time': self.return_time,
            'budget_ceiling': self.budget_ceiling,
            'transport': self.transport,
        }
