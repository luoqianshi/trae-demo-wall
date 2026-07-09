from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class MerchantResponse(BaseModel):
    id: str
    name: str
    type: str
    industry: str
    region: str
    status: int
    email: str
    phone: Optional[str]
    description: Optional[str]
    created_at: datetime
    updated_at: datetime

class StoreCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    address: Optional[str] = None
    phone: Optional[str] = None
    business_hours: Optional[str] = None
    latitude: Optional[str] = None
    longitude: Optional[str] = None

class StoreResponse(BaseModel):
    id: str
    merchant_id: str
    name: str
    address: Optional[str]
    phone: Optional[str]
    business_hours: Optional[str]
    status: int
    latitude: Optional[str]
    longitude: Optional[str]
    created_at: datetime
    updated_at: datetime
