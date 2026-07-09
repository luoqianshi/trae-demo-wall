from datetime import datetime
import uuid

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, UUID, UniqueConstraint
from sqlalchemy.orm import relationship

from app.core.enums import RecordStatus, TableSessionStatus, TableStatus
from app.core.scoping import StoreScopedMixin
from app.models.base import BaseModel


class TableArea(StoreScopedMixin, BaseModel):
    __tablename__ = "table_areas"
    __table_args__ = (
        UniqueConstraint("merchant_id", "store_id", "code", name="uq_table_area_store_code"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(80), nullable=False)
    code = Column(String(80), nullable=False)
    sort_order = Column(Integer, default=0, nullable=False)
    status = Column(Integer, default=RecordStatus.ENABLED.value, nullable=False)
    description = Column(Text)

    store = relationship("Store")
    tables = relationship("RestaurantTable", back_populates="area")


class RestaurantTable(StoreScopedMixin, BaseModel):
    __tablename__ = "restaurant_tables"
    __table_args__ = (
        UniqueConstraint("merchant_id", "store_id", "table_no", name="uq_restaurant_table_store_no"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    area_id = Column(UUID(as_uuid=True), ForeignKey("table_areas.id"), nullable=True, index=True)
    table_no = Column(String(50), nullable=False)
    name = Column(String(80), nullable=False)
    seats = Column(Integer, default=1, nullable=False)
    status = Column(String(30), default=TableStatus.AVAILABLE.value, nullable=False, index=True)
    enabled = Column(Integer, default=RecordStatus.ENABLED.value, nullable=False, index=True)
    sort_order = Column(Integer, default=0, nullable=False)
    current_session_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    current_pos_order_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    remark = Column(Text)

    store = relationship("Store")
    area = relationship("TableArea", back_populates="tables")
    sessions = relationship("TableSession", back_populates="table", foreign_keys="TableSession.table_id")
    operation_logs = relationship("TableOperationLog", back_populates="table", foreign_keys="TableOperationLog.table_id")


class TableSession(StoreScopedMixin, BaseModel):
    __tablename__ = "table_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_no = Column(String(50), unique=True, nullable=False, index=True)
    table_id = Column(UUID(as_uuid=True), ForeignKey("restaurant_tables.id"), nullable=False, index=True)
    party_size = Column(Integer, default=1, nullable=False)
    status = Column(String(30), default=TableSessionStatus.OPEN.value, nullable=False, index=True)
    opened_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    closed_at = Column(DateTime(timezone=True), nullable=True)
    current_pos_order_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    order_count = Column(Integer, default=0, nullable=False)
    note = Column(Text)

    store = relationship("Store")
    table = relationship("RestaurantTable", back_populates="sessions", foreign_keys=[table_id])
    operation_logs = relationship("TableOperationLog", back_populates="session")


class TableOperationLog(StoreScopedMixin, BaseModel):
    __tablename__ = "table_operation_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    table_id = Column(UUID(as_uuid=True), ForeignKey("restaurant_tables.id"), nullable=False, index=True)
    session_id = Column(UUID(as_uuid=True), ForeignKey("table_sessions.id"), nullable=True, index=True)
    target_table_id = Column(UUID(as_uuid=True), ForeignKey("restaurant_tables.id"), nullable=True, index=True)
    operator_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    action = Column(String(50), nullable=False, index=True)
    before_status = Column(String(30), nullable=True)
    after_status = Column(String(30), nullable=True)
    detail = Column(Text)

    store = relationship("Store")
    table = relationship("RestaurantTable", back_populates="operation_logs", foreign_keys=[table_id])
    target_table = relationship("RestaurantTable", foreign_keys=[target_table_id])
    session = relationship("TableSession", back_populates="operation_logs")
