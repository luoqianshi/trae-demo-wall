from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from app.core.enums import RecordStatus, TableStatus


class TableAreaCreateRequest(BaseModel):
    store_id: str
    name: str = Field(..., min_length=1, max_length=80)
    code: str = Field(..., min_length=1, max_length=80)
    sort_order: int = 0
    description: Optional[str] = None


class TableAreaUpdateRequest(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=80)
    code: Optional[str] = Field(default=None, min_length=1, max_length=80)
    sort_order: Optional[int] = None
    description: Optional[str] = None


class TableAreaStatusRequest(BaseModel):
    status: int = Field(..., ge=RecordStatus.DISABLED.value, le=RecordStatus.ENABLED.value)


class TableAreaResponse(BaseModel):
    id: str
    merchant_id: str
    store_id: str
    name: str
    code: str
    sort_order: int
    status: int
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class TableCreateRequest(BaseModel):
    store_id: str
    area_id: Optional[str] = None
    table_no: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=1, max_length=80)
    seats: int = Field(default=1, ge=1)
    sort_order: int = 0
    remark: Optional[str] = None


class TableUpdateRequest(BaseModel):
    area_id: Optional[str] = None
    table_no: Optional[str] = Field(default=None, min_length=1, max_length=50)
    name: Optional[str] = Field(default=None, min_length=1, max_length=80)
    seats: Optional[int] = Field(default=None, ge=1)
    sort_order: Optional[int] = None
    remark: Optional[str] = None


class TableStatusRequest(BaseModel):
    enabled: int = Field(..., ge=RecordStatus.DISABLED.value, le=RecordStatus.ENABLED.value)


class OpenTableRequest(BaseModel):
    party_size: int = Field(..., ge=1)
    note: Optional[str] = None


class ClearTableRequest(BaseModel):
    note: Optional[str] = None


class TransferTableRequest(BaseModel):
    target_table_id: str
    note: Optional[str] = None


class TableSessionResponse(BaseModel):
    id: str
    session_no: str
    merchant_id: str
    store_id: str
    table_id: str
    table_no: Optional[str] = None
    table_name: Optional[str] = None
    party_size: int
    status: str
    opened_at: datetime
    closed_at: Optional[datetime] = None
    current_pos_order_id: Optional[str] = None
    order_count: int
    note: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class TableResponse(BaseModel):
    id: str
    merchant_id: str
    store_id: str
    area_id: Optional[str] = None
    area_name: Optional[str] = None
    table_no: str
    name: str
    seats: int
    status: str
    enabled: int
    sort_order: int
    current_session_id: Optional[str] = None
    current_pos_order_id: Optional[str] = None
    remark: Optional[str] = None
    active_session: Optional[TableSessionResponse] = None
    created_at: datetime
    updated_at: datetime


class TableListResponse(BaseModel):
    items: List[TableResponse]
    total: int


class TableOperationLogResponse(BaseModel):
    id: str
    merchant_id: str
    store_id: str
    table_id: str
    session_id: Optional[str] = None
    target_table_id: Optional[str] = None
    operator_id: Optional[str] = None
    action: str
    before_status: Optional[str] = None
    after_status: Optional[str] = None
    detail: Optional[str] = None
    created_at: datetime
    updated_at: datetime
