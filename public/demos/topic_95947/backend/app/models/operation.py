from sqlalchemy import Column, String, Integer, UUID, Text, ForeignKey, JSON, Float, DateTime, func
from sqlalchemy.orm import relationship
import uuid
from app.models.base import BaseModel

class OperationPlan(BaseModel):
    __tablename__ = "operation_plans"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    merchant_id = Column(UUID(as_uuid=True), ForeignKey("merchants.id"), nullable=False)
    title = Column(String(200), nullable=False)
    type = Column(String(50), nullable=False)
    content = Column(JSON)
    ai_suggestion = Column(Text)
    status = Column(Integer, default=0)
    effect_score = Column(Float, default=0.0)
    
    merchant = relationship("Merchant", back_populates="operation_plans")

class Competitor(BaseModel):
    __tablename__ = "competitors"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    merchant_id = Column(UUID(as_uuid=True), ForeignKey("merchants.id"), nullable=False)
    name = Column(String(100), nullable=False)
    type = Column(String(50))
    region = Column(String(100))
    platform = Column(String(50))
    url = Column(String(255))
    
class CompetitorData(BaseModel):
    __tablename__ = "competitor_data"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    competitor_id = Column(UUID(as_uuid=True), ForeignKey("competitors.id"), nullable=False)
    data_type = Column(String(50), nullable=False)
    content = Column(JSON)
    crawl_time = Column(DateTime(timezone=True), server_default=func.now())
