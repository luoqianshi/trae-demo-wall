from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from app.core.enums import EmployeeStatus, PermissionAction, RecordStatus


class PermissionResponse(BaseModel):
    id: str
    name: str
    code: str
    module: str
    action: str
    description: Optional[str] = None
    status: int
    created_at: datetime
    updated_at: datetime


class RoleCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=80)
    code: str = Field(..., min_length=1, max_length=80)
    description: Optional[str] = None


class RoleUpdateRequest(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=80)
    description: Optional[str] = None
    status: Optional[int] = Field(default=None, ge=RecordStatus.DISABLED.value, le=RecordStatus.ENABLED.value)


class RolePermissionAssignRequest(BaseModel):
    permission_ids: List[str] = Field(default_factory=list)


class RoleResponse(BaseModel):
    id: str
    merchant_id: str
    name: str
    code: str
    description: Optional[str] = None
    status: int
    is_system: bool
    permissions: List[PermissionResponse] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime


class EmployeeStoreAccessResponse(BaseModel):
    id: str
    employee_id: str
    store_id: str
    store_name: Optional[str] = None
    status: int
    created_at: datetime
    updated_at: datetime


class EmployeeCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=80)
    phone: str = Field(..., min_length=3, max_length=20)
    position: Optional[str] = Field(default=None, max_length=80)
    email: Optional[str] = Field(default=None, max_length=120)
    role_id: Optional[str] = None
    store_id: Optional[str] = None
    store_ids: List[str] = Field(default_factory=list)
    remark: Optional[str] = None


class EmployeeUpdateRequest(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=80)
    phone: Optional[str] = Field(default=None, min_length=3, max_length=20)
    position: Optional[str] = Field(default=None, max_length=80)
    email: Optional[str] = Field(default=None, max_length=120)
    role_id: Optional[str] = None
    store_id: Optional[str] = None
    remark: Optional[str] = None


class EmployeeStatusRequest(BaseModel):
    status: int = Field(..., ge=EmployeeStatus.DISABLED.value, le=EmployeeStatus.LOCKED.value)


class EmployeeStoreAssignRequest(BaseModel):
    store_ids: List[str] = Field(..., min_length=1)


class EmployeeResponse(BaseModel):
    id: str
    merchant_id: str
    store_id: Optional[str] = None
    store_name: Optional[str] = None
    role_id: Optional[str] = None
    role_name: Optional[str] = None
    name: str
    phone: str
    position: Optional[str] = None
    email: Optional[str] = None
    status: int
    remark: Optional[str] = None
    store_access: List[EmployeeStoreAccessResponse] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime


class EmployeeListResponse(BaseModel):
    items: List[EmployeeResponse]
    total: int


class OperationLogResponse(BaseModel):
    id: str
    merchant_id: str
    employee_id: Optional[str] = None
    store_id: Optional[str] = None
    operator_id: Optional[str] = None
    action: str
    target_type: str
    target_id: Optional[str] = None
    detail: Optional[str] = None
    created_at: datetime
    updated_at: datetime
