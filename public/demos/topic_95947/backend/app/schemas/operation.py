from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class OperationPlanCreateRequest(BaseModel):
    title: str = Field(..., max_length=200)
    type: str = Field(..., max_length=50)
    content: Optional[dict] = None
    ai_suggestion: Optional[str] = None

class OperationPlanResponse(BaseModel):
    id: str
    merchant_id: str
    title: str
    type: str
    content: Optional[dict]
    ai_suggestion: Optional[str]
    status: int
    effect_score: float
    created_at: datetime
    updated_at: datetime

class GenerateCopyRequest(BaseModel):
    dish_name: str = Field(..., max_length=100)
    features: str = Field(...)
    target_audience: Optional[str] = None
    platform: Optional[str] = "wechat"

class GenerateCopyResponse(BaseModel):
    copy_text: str
    platform: str

class MenuOptimizeRequest(BaseModel):
    store_id: str
    current_menu: List[dict]
    sales_data: Optional[List[dict]] = None

class MenuOptimizeResponse(BaseModel):
    suggestions: List[dict]
    optimized_menu: List[dict]
