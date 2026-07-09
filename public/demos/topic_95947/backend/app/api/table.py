import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_merchant_id
from app.models.table import RestaurantTable, TableArea, TableOperationLog, TableSession
from app.schemas.table import (
    ClearTableRequest,
    OpenTableRequest,
    TableAreaCreateRequest,
    TableAreaResponse,
    TableAreaStatusRequest,
    TableAreaUpdateRequest,
    TableCreateRequest,
    TableListResponse,
    TableOperationLogResponse,
    TableResponse,
    TableSessionResponse,
    TableStatusRequest,
    TableUpdateRequest,
    TransferTableRequest,
)
from app.services.table_service import TableService

router = APIRouter(tags=["桌台/堂食"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_current_merchant_id(token: str = Depends(oauth2_scheme)) -> uuid.UUID:
    return decode_merchant_id(token)


def _area_response(area: TableArea) -> TableAreaResponse:
    return TableAreaResponse(
        id=str(area.id),
        merchant_id=str(area.merchant_id),
        store_id=str(area.store_id),
        name=area.name,
        code=area.code,
        sort_order=area.sort_order,
        status=area.status,
        description=area.description,
        created_at=area.created_at,
        updated_at=area.updated_at,
    )


def _session_response(session: TableSession) -> TableSessionResponse:
    return TableSessionResponse(
        id=str(session.id),
        session_no=session.session_no,
        merchant_id=str(session.merchant_id),
        store_id=str(session.store_id),
        table_id=str(session.table_id),
        table_no=session.table.table_no if session.table else None,
        table_name=session.table.name if session.table else None,
        party_size=session.party_size,
        status=session.status,
        opened_at=session.opened_at,
        closed_at=session.closed_at,
        current_pos_order_id=str(session.current_pos_order_id) if session.current_pos_order_id else None,
        order_count=session.order_count,
        note=session.note,
        created_at=session.created_at,
        updated_at=session.updated_at,
    )


def _table_response(table: RestaurantTable) -> TableResponse:
    active_session = None
    if table.current_session_id:
        for session in table.sessions:
            if session.id == table.current_session_id:
                active_session = _session_response(session)
                break
    return TableResponse(
        id=str(table.id),
        merchant_id=str(table.merchant_id),
        store_id=str(table.store_id),
        area_id=str(table.area_id) if table.area_id else None,
        area_name=table.area.name if table.area else None,
        table_no=table.table_no,
        name=table.name,
        seats=table.seats,
        status=table.status,
        enabled=table.enabled,
        sort_order=table.sort_order,
        current_session_id=str(table.current_session_id) if table.current_session_id else None,
        current_pos_order_id=str(table.current_pos_order_id) if table.current_pos_order_id else None,
        remark=table.remark,
        active_session=active_session,
        created_at=table.created_at,
        updated_at=table.updated_at,
    )


def _log_response(log: TableOperationLog) -> TableOperationLogResponse:
    return TableOperationLogResponse(
        id=str(log.id),
        merchant_id=str(log.merchant_id),
        store_id=str(log.store_id),
        table_id=str(log.table_id),
        session_id=str(log.session_id) if log.session_id else None,
        target_table_id=str(log.target_table_id) if log.target_table_id else None,
        operator_id=str(log.operator_id) if log.operator_id else None,
        action=log.action,
        before_status=log.before_status,
        after_status=log.after_status,
        detail=log.detail,
        created_at=log.created_at,
        updated_at=log.updated_at,
    )


@router.get("/table-areas/", response_model=List[TableAreaResponse])
def list_table_areas(
    store_id: Optional[str] = Query(default=None),
    status: Optional[int] = Query(default=None),
    merchant_id: uuid.UUID = Depends(get_current_merchant_id),
    db: Session = Depends(get_db),
):
    try:
        return [_area_response(item) for item in TableService.list_areas(db, merchant_id, store_id, status)]
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.post("/table-areas/", response_model=TableAreaResponse)
def create_table_area(
    request: TableAreaCreateRequest,
    merchant_id: uuid.UUID = Depends(get_current_merchant_id),
    db: Session = Depends(get_db),
):
    try:
        return _area_response(TableService.create_area(db, merchant_id, request))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/table-areas/{area_id}", response_model=TableAreaResponse)
def update_table_area(
    area_id: str,
    request: TableAreaUpdateRequest,
    merchant_id: uuid.UUID = Depends(get_current_merchant_id),
    db: Session = Depends(get_db),
):
    try:
        return _area_response(TableService.update_area(db, merchant_id, area_id, request))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/table-areas/{area_id}/status", response_model=TableAreaResponse)
def set_table_area_status(
    area_id: str,
    request: TableAreaStatusRequest,
    merchant_id: uuid.UUID = Depends(get_current_merchant_id),
    db: Session = Depends(get_db),
):
    try:
        return _area_response(TableService.set_area_status(db, merchant_id, area_id, request.status))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/tables/", response_model=TableListResponse)
def list_tables(
    store_id: Optional[str] = Query(default=None),
    area_id: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    enabled: Optional[int] = Query(default=None),
    merchant_id: uuid.UUID = Depends(get_current_merchant_id),
    db: Session = Depends(get_db),
):
    try:
        tables = TableService.list_tables(db, merchant_id, store_id, area_id, status, enabled)
        return TableListResponse(items=[_table_response(item) for item in tables], total=len(tables))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/tables/", response_model=TableResponse)
def create_table(
    request: TableCreateRequest,
    merchant_id: uuid.UUID = Depends(get_current_merchant_id),
    db: Session = Depends(get_db),
):
    try:
        return _table_response(TableService.create_table(db, merchant_id, request))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/tables/{table_id}", response_model=TableResponse)
def update_table(
    table_id: str,
    request: TableUpdateRequest,
    merchant_id: uuid.UUID = Depends(get_current_merchant_id),
    db: Session = Depends(get_db),
):
    try:
        return _table_response(TableService.update_table(db, merchant_id, table_id, request))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/tables/{table_id}/status", response_model=TableResponse)
def set_table_status(
    table_id: str,
    request: TableStatusRequest,
    merchant_id: uuid.UUID = Depends(get_current_merchant_id),
    db: Session = Depends(get_db),
):
    try:
        return _table_response(TableService.set_table_status(db, merchant_id, table_id, request.enabled))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/tables/{table_id}/open", response_model=TableSessionResponse)
def open_table(
    table_id: str,
    request: OpenTableRequest,
    merchant_id: uuid.UUID = Depends(get_current_merchant_id),
    db: Session = Depends(get_db),
):
    try:
        return _session_response(TableService.open_table(db, merchant_id, table_id, request))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/tables/{table_id}/clear", response_model=TableResponse)
def clear_table(
    table_id: str,
    request: ClearTableRequest,
    merchant_id: uuid.UUID = Depends(get_current_merchant_id),
    db: Session = Depends(get_db),
):
    try:
        return _table_response(TableService.clear_table(db, merchant_id, table_id, request))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/tables/{table_id}/transfer", response_model=TableResponse)
def transfer_table(
    table_id: str,
    request: TransferTableRequest,
    merchant_id: uuid.UUID = Depends(get_current_merchant_id),
    db: Session = Depends(get_db),
):
    try:
        return _table_response(TableService.transfer_table(db, merchant_id, table_id, request))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/table-operation-logs/", response_model=List[TableOperationLogResponse])
def list_table_logs(
    table_id: Optional[str] = Query(default=None),
    store_id: Optional[str] = Query(default=None),
    merchant_id: uuid.UUID = Depends(get_current_merchant_id),
    db: Session = Depends(get_db),
):
    try:
        return [_log_response(item) for item in TableService.list_logs(db, merchant_id, table_id, store_id)]
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
