import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_merchant_id
from app.models.employee import Employee, EmployeeRole, EmployeeStoreAccess, Permission, RolePermission
from app.schemas.employee import (
    EmployeeCreateRequest,
    EmployeeListResponse,
    EmployeeResponse,
    EmployeeStatusRequest,
    EmployeeStoreAccessResponse,
    EmployeeStoreAssignRequest,
    EmployeeUpdateRequest,
    PermissionResponse,
    RoleCreateRequest,
    RolePermissionAssignRequest,
    RoleResponse,
)
from app.services.employee_service import EmployeeService, RolePermissionService

router = APIRouter(tags=["员工与权限"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_current_merchant_id(token: str = Depends(oauth2_scheme)) -> uuid.UUID:
    return decode_merchant_id(token)


def _permission_response(permission: Permission) -> PermissionResponse:
    return PermissionResponse(
        id=str(permission.id),
        name=permission.name,
        code=permission.code,
        module=permission.module,
        action=permission.action,
        description=permission.description,
        status=permission.status,
        created_at=permission.created_at,
        updated_at=permission.updated_at,
    )


def _role_response(role: EmployeeRole) -> RoleResponse:
    permissions = [
        _permission_response(item.permission)
        for item in role.permissions
        if item.permission is not None
    ]
    return RoleResponse(
        id=str(role.id),
        merchant_id=str(role.merchant_id),
        name=role.name,
        code=role.code,
        description=role.description,
        status=role.status,
        is_system=role.is_system,
        permissions=permissions,
        created_at=role.created_at,
        updated_at=role.updated_at,
    )


def _store_access_response(access: EmployeeStoreAccess) -> EmployeeStoreAccessResponse:
    return EmployeeStoreAccessResponse(
        id=str(access.id),
        employee_id=str(access.employee_id),
        store_id=str(access.store_id),
        store_name=access.store.name if access.store else None,
        status=access.status,
        created_at=access.created_at,
        updated_at=access.updated_at,
    )


def _employee_response(employee: Employee) -> EmployeeResponse:
    return EmployeeResponse(
        id=str(employee.id),
        merchant_id=str(employee.merchant_id),
        store_id=str(employee.store_id) if employee.store_id else None,
        store_name=employee.store.name if employee.store else None,
        role_id=str(employee.role_id) if employee.role_id else None,
        role_name=employee.role.name if employee.role else None,
        name=employee.name,
        phone=employee.phone,
        position=employee.position,
        email=employee.email,
        status=employee.status,
        remark=employee.remark,
        store_access=[
            _store_access_response(item)
            for item in employee.store_access
            if item.status == 1
        ],
        created_at=employee.created_at,
        updated_at=employee.updated_at,
    )


@router.get("/employees/", response_model=EmployeeListResponse)
def list_employees(
    store_id: Optional[str] = Query(default=None),
    status: Optional[int] = Query(default=None),
    keyword: Optional[str] = Query(default=None),
    merchant_id: uuid.UUID = Depends(get_current_merchant_id),
    db: Session = Depends(get_db),
):
    try:
        employees = EmployeeService.list_employees(db, merchant_id, store_id, status, keyword)
        return EmployeeListResponse(
            items=[_employee_response(item) for item in employees],
            total=len(employees),
        )
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.post("/employees/", response_model=EmployeeResponse)
def create_employee(
    request: EmployeeCreateRequest,
    merchant_id: uuid.UUID = Depends(get_current_merchant_id),
    db: Session = Depends(get_db),
):
    try:
        employee = EmployeeService.create_employee(db, merchant_id, request)
        return _employee_response(employee)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/employees/{employee_id}", response_model=EmployeeResponse)
def update_employee(
    employee_id: str,
    request: EmployeeUpdateRequest,
    merchant_id: uuid.UUID = Depends(get_current_merchant_id),
    db: Session = Depends(get_db),
):
    try:
        employee = EmployeeService.update_employee(db, merchant_id, employee_id, request)
        return _employee_response(employee)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.patch("/employees/{employee_id}/status", response_model=EmployeeResponse)
def set_employee_status(
    employee_id: str,
    request: EmployeeStatusRequest,
    merchant_id: uuid.UUID = Depends(get_current_merchant_id),
    db: Session = Depends(get_db),
):
    try:
        employee = EmployeeService.set_employee_status(db, merchant_id, employee_id, request.status)
        return _employee_response(employee)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/employees/{employee_id}/stores", response_model=EmployeeResponse)
def assign_employee_stores(
    employee_id: str,
    request: EmployeeStoreAssignRequest,
    merchant_id: uuid.UUID = Depends(get_current_merchant_id),
    db: Session = Depends(get_db),
):
    try:
        employee = EmployeeService.assign_stores(db, merchant_id, employee_id, request.store_ids)
        return _employee_response(employee)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/roles/", response_model=List[RoleResponse])
def list_roles(
    merchant_id: uuid.UUID = Depends(get_current_merchant_id),
    db: Session = Depends(get_db),
):
    try:
        return [_role_response(role) for role in RolePermissionService.list_roles(db, merchant_id)]
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.post("/roles/", response_model=RoleResponse)
def create_role(
    request: RoleCreateRequest,
    merchant_id: uuid.UUID = Depends(get_current_merchant_id),
    db: Session = Depends(get_db),
):
    try:
        role = RolePermissionService.create_role(db, merchant_id, request)
        return _role_response(role)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/permissions/", response_model=List[PermissionResponse])
def list_permissions(
    module: Optional[str] = Query(default=None),
    merchant_id: uuid.UUID = Depends(get_current_merchant_id),
    db: Session = Depends(get_db),
):
    try:
        return [
            _permission_response(permission)
            for permission in RolePermissionService.list_permissions(db, module)
        ]
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/roles/{role_id}/permissions", response_model=RoleResponse)
def assign_role_permissions(
    role_id: str,
    request: RolePermissionAssignRequest,
    merchant_id: uuid.UUID = Depends(get_current_merchant_id),
    db: Session = Depends(get_db),
):
    try:
        role = RolePermissionService.assign_role_permissions(
            db,
            merchant_id,
            role_id,
            request.permission_ids,
        )
        return _role_response(role)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
