from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class CameraCreate(BaseModel):
    name: str
    rtsp_url: str
    resolution: str = "1920x1080"
    sample_interval: int = 2


class CameraOut(CameraCreate):
    id: int
    status: str
    created_at: datetime
    class Config:
        from_attributes = True


class AnnotationCreate(BaseModel):
    frame_id: int
    label: str
    source: str = "manual"
    confidence: float = 1.0


class AnnotationOut(AnnotationCreate):
    id: int
    annotated_by: str
    created_at: datetime
    class Config:
        from_attributes = True


class EventOut(BaseModel):
    id: int
    event_type: str
    risk_level: str
    description: Optional[str]
    confidence: Optional[float]
    image_path: Optional[str]
    camera_id: Optional[int]
    created_at: datetime
    is_notified: bool
    class Config:
        from_attributes = True


class ModelVersionOut(BaseModel):
    id: int
    name: str
    accuracy: Optional[float]
    num_samples: Optional[int]
    num_labels: Optional[int]
    is_active: bool
    status: str
    created_at: datetime
    class Config:
        from_attributes = True


class AlertRuleOut(BaseModel):
    id: int
    state_name: str
    risk_level: str
    trigger_condition: str
    notify_method: str
    notify_targets: str
    is_enabled: bool
    class Config:
        from_attributes = True


class DashboardStats(BaseModel):
    today_events: int
    model_accuracy: float
    annotated_samples: int
    online_cameras: str
