from datetime import datetime
import uuid

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, UUID, Index
from sqlalchemy.orm import relationship

from app.core.enums import PosOrderStatus, RefundStatus
from app.core.scoping import StoreScopedMixin
from app.models.base import BaseModel


class POSOrder(StoreScopedMixin, BaseModel):
    __tablename__ = "pos_orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_no = Column(String(50), unique=True, nullable=False, index=True)
    table_id = Column(UUID(as_uuid=True), ForeignKey("restaurant_tables.id"), nullable=True, index=True)
    table_session_id = Column(UUID(as_uuid=True), ForeignKey("table_sessions.id"), nullable=True, index=True)
    status = Column(String(30), default=PosOrderStatus.DRAFT.value, nullable=False, index=True)
    party_size = Column(Integer, default=1, nullable=False)
    subtotal_amount = Column(Integer, default=0, nullable=False)
    discount_amount = Column(Integer, default=0, nullable=False)
    rounding_amount = Column(Integer, default=0, nullable=False)
    payable_amount = Column(Integer, default=0, nullable=False)
    paid_amount = Column(Integer, default=0, nullable=False)
    refunded_amount = Column(Integer, default=0, nullable=False)
    note = Column(Text)
    cancelled_reason = Column(Text)
    suspended_at = Column(DateTime(timezone=True), nullable=True)
    paid_at = Column(DateTime(timezone=True), nullable=True)
    cancelled_at = Column(DateTime(timezone=True), nullable=True)

    store = relationship("Store")
    table = relationship("RestaurantTable")
    table_session = relationship("TableSession")
    items = relationship("POSOrderItem", back_populates="order", cascade="all, delete-orphan")
    refunds = relationship("POSRefund", back_populates="order", cascade="all, delete-orphan")
    payments = relationship("PaymentTransaction", back_populates="order", cascade="all, delete-orphan")
    payment_refunds = relationship("RefundTransaction", back_populates="order", cascade="all, delete-orphan")
    operation_logs = relationship("POSOrderLog", back_populates="order", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_pos_orders_merchant_store_status", "merchant_id", "store_id", "status"),
        Index("ix_pos_orders_merchant_table", "merchant_id", "table_id"),
    )


class POSOrderItem(StoreScopedMixin, BaseModel):
    __tablename__ = "pos_order_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("pos_orders.id"), nullable=False, index=True)
    dish_id = Column(UUID(as_uuid=True), ForeignKey("dishes.id"), nullable=False, index=True)
    dish_name = Column(String(100), nullable=False)
    unit_price = Column(Integer, nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    subtotal_amount = Column(Integer, nullable=False, default=0)
    discount_amount = Column(Integer, nullable=False, default=0)
    total_amount = Column(Integer, nullable=False, default=0)
    note = Column(Text)

    order = relationship("POSOrder", back_populates="items")
    dish = relationship("Dish")

    __table_args__ = (
        Index("ix_pos_order_items_merchant_order", "merchant_id", "order_id"),
    )


class POSRefund(StoreScopedMixin, BaseModel):
    __tablename__ = "pos_refunds"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    refund_no = Column(String(50), unique=True, nullable=False, index=True)
    order_id = Column(UUID(as_uuid=True), ForeignKey("pos_orders.id"), nullable=False, index=True)
    amount = Column(Integer, nullable=False)
    status = Column(String(30), default=RefundStatus.SUCCESS.value, nullable=False, index=True)
    reason = Column(Text)
    operator_id = Column(UUID(as_uuid=True), nullable=True, index=True)

    order = relationship("POSOrder", back_populates="refunds")

    __table_args__ = (
        Index("ix_pos_refunds_merchant_order", "merchant_id", "order_id"),
    )


class POSOrderLog(StoreScopedMixin, BaseModel):
    __tablename__ = "pos_order_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("pos_orders.id"), nullable=False, index=True)
    operator_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    action = Column(String(50), nullable=False, index=True)
    before_status = Column(String(30), nullable=True)
    after_status = Column(String(30), nullable=True)
    detail = Column(Text)

    order = relationship("POSOrder", back_populates="operation_logs")

    __table_args__ = (
        Index("ix_pos_order_logs_merchant_order", "merchant_id", "order_id"),
        Index("ix_pos_order_logs_merchant_action", "merchant_id", "action"),
    )
