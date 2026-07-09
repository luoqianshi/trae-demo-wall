from datetime import datetime
import uuid
from typing import Optional

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.core.enums import RecordStatus, TableSessionStatus, TableStatus
from app.core.scoping import (
    apply_merchant_scope,
    apply_store_scope,
    require_merchant_id,
    to_uuid,
    validate_store_scope,
)
from app.core.status import TABLE_ALLOWED_TRANSITIONS, is_transition_allowed
from app.models.table import RestaurantTable, TableArea, TableOperationLog, TableSession


class TableService:
    @staticmethod
    def _payload(data) -> dict:
        return data.model_dump(exclude_unset=True) if hasattr(data, "model_dump") else dict(data)

    @staticmethod
    def _session_no() -> str:
        return f"TS{datetime.utcnow().strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:6].upper()}"

    @staticmethod
    def _get_area(db: Session, merchant_id, area_id) -> TableArea:
        area = (
            apply_merchant_scope(db.query(TableArea), TableArea, merchant_id)
            .filter(TableArea.id == to_uuid(area_id, "桌台区域ID"))
            .first()
        )
        if not area:
            raise ValueError("桌台区域不存在或无权访问")
        return area

    @staticmethod
    def _validate_area_scope(db: Session, merchant_id, store_id, area_id) -> Optional[uuid.UUID]:
        if not area_id:
            return None
        area = TableService._get_area(db, merchant_id, area_id)
        if area.store_id != validate_store_scope(db, merchant_id, store_id):
            raise ValueError("桌台区域不属于当前门店")
        if area.status != RecordStatus.ENABLED.value:
            raise ValueError("桌台区域已停用")
        return area.id

    @staticmethod
    def _get_table(db: Session, merchant_id, table_id) -> RestaurantTable:
        table = (
            apply_merchant_scope(
                db.query(RestaurantTable).options(
                    joinedload(RestaurantTable.area),
                    joinedload(RestaurantTable.sessions),
                ),
                RestaurantTable,
                merchant_id,
            )
            .filter(RestaurantTable.id == to_uuid(table_id, "桌台ID"))
            .first()
        )
        if not table:
            raise ValueError("桌台不存在或无权访问")
        return table

    @staticmethod
    def _get_open_session(db: Session, table: RestaurantTable) -> Optional[TableSession]:
        if not table.current_session_id:
            return None
        return (
            db.query(TableSession)
            .filter(
                TableSession.id == table.current_session_id,
                TableSession.merchant_id == table.merchant_id,
                TableSession.table_id == table.id,
                TableSession.status == TableSessionStatus.OPEN.value,
            )
            .first()
        )

    @staticmethod
    def _write_log(
        db: Session,
        table: RestaurantTable,
        action: str,
        before_status: Optional[str] = None,
        after_status: Optional[str] = None,
        session_id=None,
        target_table_id=None,
        detail: Optional[str] = None,
    ) -> TableOperationLog:
        log = TableOperationLog(
            id=uuid.uuid4(),
            merchant_id=table.merchant_id,
            store_id=table.store_id,
            table_id=table.id,
            session_id=session_id,
            target_table_id=target_table_id,
            action=action,
            before_status=before_status,
            after_status=after_status,
            detail=detail,
        )
        db.add(log)
        return log

    @staticmethod
    def list_areas(db: Session, merchant_id, store_id: Optional[str] = None, status: Optional[int] = None) -> list[TableArea]:
        query = apply_merchant_scope(db.query(TableArea), TableArea, merchant_id)
        query = apply_store_scope(query, TableArea, store_id)
        if status is not None:
            query = query.filter(TableArea.status == status)
        return query.order_by(TableArea.sort_order.asc(), TableArea.created_at.asc()).all()

    @staticmethod
    def create_area(db: Session, merchant_id, data) -> TableArea:
        merchant_uuid = require_merchant_id(merchant_id)
        payload = TableService._payload(data)
        store_uuid = validate_store_scope(db, merchant_uuid, payload["store_id"])
        area = TableArea(
            id=uuid.uuid4(),
            merchant_id=merchant_uuid,
            store_id=store_uuid,
            name=payload["name"],
            code=payload["code"],
            sort_order=payload.get("sort_order", 0),
            description=payload.get("description"),
            status=RecordStatus.ENABLED.value,
        )
        db.add(area)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            raise ValueError("桌台区域编码在当前门店下已存在")
        db.refresh(area)
        return area

    @staticmethod
    def update_area(db: Session, merchant_id, area_id, data) -> TableArea:
        area = TableService._get_area(db, merchant_id, area_id)
        payload = TableService._payload(data)
        for field in ("name", "code", "sort_order", "description"):
            if field in payload:
                setattr(area, field, payload[field])
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            raise ValueError("桌台区域编码在当前门店下已存在")
        db.refresh(area)
        return area

    @staticmethod
    def set_area_status(db: Session, merchant_id, area_id, status: int) -> TableArea:
        if status not in {item.value for item in RecordStatus}:
            raise ValueError("无效的启停状态")
        area = TableService._get_area(db, merchant_id, area_id)
        area.status = status
        db.commit()
        db.refresh(area)
        return area

    @staticmethod
    def list_tables(
        db: Session,
        merchant_id,
        store_id: Optional[str] = None,
        area_id: Optional[str] = None,
        status: Optional[str] = None,
        enabled: Optional[int] = None,
    ) -> list[RestaurantTable]:
        query = apply_merchant_scope(
            db.query(RestaurantTable).options(joinedload(RestaurantTable.area), joinedload(RestaurantTable.sessions)),
            RestaurantTable,
            merchant_id,
        )
        query = apply_store_scope(query, RestaurantTable, store_id)
        if area_id:
            query = query.filter(RestaurantTable.area_id == to_uuid(area_id, "桌台区域ID"))
        if status:
            if status not in {item.value for item in TableStatus}:
                raise ValueError("无效的桌台状态")
            query = query.filter(RestaurantTable.status == status)
        if enabled is not None:
            query = query.filter(RestaurantTable.enabled == enabled)
        return query.order_by(RestaurantTable.sort_order.asc(), RestaurantTable.created_at.asc()).all()

    @staticmethod
    def create_table(db: Session, merchant_id, data) -> RestaurantTable:
        merchant_uuid = require_merchant_id(merchant_id)
        payload = TableService._payload(data)
        store_uuid = validate_store_scope(db, merchant_uuid, payload["store_id"])
        area_uuid = TableService._validate_area_scope(db, merchant_uuid, store_uuid, payload.get("area_id"))
        table = RestaurantTable(
            id=uuid.uuid4(),
            merchant_id=merchant_uuid,
            store_id=store_uuid,
            area_id=area_uuid,
            table_no=payload["table_no"],
            name=payload["name"],
            seats=payload.get("seats", 1),
            sort_order=payload.get("sort_order", 0),
            remark=payload.get("remark"),
            status=TableStatus.AVAILABLE.value,
            enabled=RecordStatus.ENABLED.value,
        )
        db.add(table)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            raise ValueError("桌台编号在当前门店下已存在")
        db.refresh(table)
        return TableService._get_table(db, merchant_uuid, table.id)

    @staticmethod
    def update_table(db: Session, merchant_id, table_id, data) -> RestaurantTable:
        table = TableService._get_table(db, merchant_id, table_id)
        payload = TableService._payload(data)
        if "area_id" in payload:
            table.area_id = TableService._validate_area_scope(db, merchant_id, table.store_id, payload.get("area_id"))
        for field in ("table_no", "name", "seats", "sort_order", "remark"):
            if field in payload:
                setattr(table, field, payload[field])
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            raise ValueError("桌台编号在当前门店下已存在")
        db.refresh(table)
        return TableService._get_table(db, merchant_id, table.id)

    @staticmethod
    def set_table_status(db: Session, merchant_id, table_id, enabled: int) -> RestaurantTable:
        if enabled not in {item.value for item in RecordStatus}:
            raise ValueError("无效的启停状态")
        table = TableService._get_table(db, merchant_id, table_id)
        before = table.status
        if enabled == RecordStatus.DISABLED.value:
            if table.status == TableStatus.OCCUPIED.value:
                raise ValueError("使用中的桌台不能停用")
            target = TableStatus.DISABLED.value
        else:
            target = TableStatus.AVAILABLE.value if table.status == TableStatus.DISABLED.value else table.status
        if before != target and not is_transition_allowed(TABLE_ALLOWED_TRANSITIONS, TableStatus(before), TableStatus(target)):
            raise ValueError("桌台状态不允许该流转")
        table.enabled = enabled
        table.status = target
        TableService._write_log(db, table, "status", before, target, detail=f"桌台启停变更为：{enabled}")
        db.commit()
        db.refresh(table)
        return TableService._get_table(db, merchant_id, table.id)

    @staticmethod
    def open_table(db: Session, merchant_id, table_id, data) -> TableSession:
        table = TableService._get_table(db, merchant_id, table_id)
        if table.enabled != RecordStatus.ENABLED.value or table.status == TableStatus.DISABLED.value:
            raise ValueError("桌台已停用，不能开台")
        if table.status != TableStatus.AVAILABLE.value:
            raise ValueError("只有空闲桌台可以开台")
        payload = TableService._payload(data)
        before = table.status
        session = TableSession(
            id=uuid.uuid4(),
            session_no=TableService._session_no(),
            merchant_id=table.merchant_id,
            store_id=table.store_id,
            table_id=table.id,
            party_size=payload["party_size"],
            note=payload.get("note"),
            status=TableSessionStatus.OPEN.value,
        )
        db.add(session)
        db.flush()
        table.status = TableStatus.OCCUPIED.value
        table.current_session_id = session.id
        table.current_pos_order_id = session.current_pos_order_id
        TableService._write_log(db, table, "open", before, table.status, session_id=session.id, detail=f"开台人数：{session.party_size}")
        db.commit()
        db.refresh(session)
        return session

    @staticmethod
    def clear_table(db: Session, merchant_id, table_id, data=None) -> RestaurantTable:
        table = TableService._get_table(db, merchant_id, table_id)
        if table.status != TableStatus.OCCUPIED.value:
            raise ValueError("只有使用中的桌台可以清台")
        session = TableService._get_open_session(db, table)
        if not session:
            raise ValueError("未找到开台记录，不能清台")
        if table.current_pos_order_id or session.current_pos_order_id:
            raise ValueError("桌台仍关联POS订单，不能清台")
        before = table.status
        payload = TableService._payload(data) if data is not None else {}
        session.status = TableSessionStatus.CLOSED.value
        session.closed_at = datetime.utcnow()
        if payload.get("note"):
            session.note = f"{session.note or ''}\n清台备注：{payload['note']}".strip()
        table.status = TableStatus.AVAILABLE.value
        table.current_session_id = None
        table.current_pos_order_id = None
        TableService._write_log(db, table, "clear", before, table.status, session_id=session.id, detail=payload.get("note") or "清台")
        db.commit()
        db.refresh(table)
        return TableService._get_table(db, merchant_id, table.id)

    @staticmethod
    def transfer_table(db: Session, merchant_id, table_id, data) -> RestaurantTable:
        source = TableService._get_table(db, merchant_id, table_id)
        target = TableService._get_table(db, merchant_id, data.target_table_id)
        if source.store_id != target.store_id:
            raise ValueError("只能在同一门店内换台")
        if source.status != TableStatus.OCCUPIED.value:
            raise ValueError("只有使用中的桌台可以换台")
        if target.enabled != RecordStatus.ENABLED.value or target.status != TableStatus.AVAILABLE.value:
            raise ValueError("目标桌台必须为空闲且启用")
        session = TableService._get_open_session(db, source)
        if not session:
            raise ValueError("未找到开台记录，不能换台")
        payload = TableService._payload(data)
        before_source = source.status
        before_target = target.status
        session.table_id = target.id
        target.status = TableStatus.OCCUPIED.value
        target.current_session_id = session.id
        target.current_pos_order_id = source.current_pos_order_id
        source.status = TableStatus.AVAILABLE.value
        source.current_session_id = None
        source.current_pos_order_id = None
        TableService._write_log(
            db,
            source,
            "transfer_out",
            before_source,
            source.status,
            session_id=session.id,
            target_table_id=target.id,
            detail=payload.get("note") or f"换至桌台：{target.table_no}",
        )
        TableService._write_log(
            db,
            target,
            "transfer_in",
            before_target,
            target.status,
            session_id=session.id,
            target_table_id=source.id,
            detail=payload.get("note") or f"从桌台：{source.table_no} 换入",
        )
        db.commit()
        db.refresh(target)
        return TableService._get_table(db, merchant_id, target.id)

    @staticmethod
    def list_logs(db: Session, merchant_id, table_id: Optional[str] = None, store_id: Optional[str] = None) -> list[TableOperationLog]:
        query = apply_merchant_scope(db.query(TableOperationLog), TableOperationLog, merchant_id)
        query = apply_store_scope(query, TableOperationLog, store_id)
        if table_id:
            query = query.filter(TableOperationLog.table_id == to_uuid(table_id, "桌台ID"))
        return query.order_by(TableOperationLog.created_at.desc()).all()
