from datetime import datetime
import uuid

from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String, Text, UUID, Index, UniqueConstraint
from sqlalchemy.orm import relationship

from app.core.enums import PaymentChannel, PaymentStatus, ReconciliationStatus, RefundStatus
from app.core.scoping import StoreScopedMixin
from app.models.base import BaseModel


class PaymentTransaction(StoreScopedMixin, BaseModel):
    __tablename__ = "payment_transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    payment_no = Column(String(50), unique=True, nullable=False, index=True)
    order_id = Column(UUID(as_uuid=True), ForeignKey("pos_orders.id"), nullable=False, index=True)
    channel = Column(String(30), default=PaymentChannel.CASH.value, nullable=False, index=True)
    amount = Column(Integer, nullable=False)
    status = Column(String(30), default=PaymentStatus.SUCCESS.value, nullable=False, index=True)
    paid_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False, index=True)
    external_trade_no = Column(String(100), nullable=True, index=True)
    operator_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    remark = Column(Text)

    order = relationship("POSOrder", back_populates="payments")
    refunds = relationship("RefundTransaction", back_populates="payment", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_payment_transactions_merchant_store_channel", "merchant_id", "store_id", "channel"),
        Index("ix_payment_transactions_merchant_order", "merchant_id", "order_id"),
        Index("ix_payment_transactions_merchant_paid_at", "merchant_id", "paid_at"),
    )


class RefundTransaction(StoreScopedMixin, BaseModel):
    __tablename__ = "refund_transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    refund_no = Column(String(50), unique=True, nullable=False, index=True)
    payment_id = Column(UUID(as_uuid=True), ForeignKey("payment_transactions.id"), nullable=False, index=True)
    order_id = Column(UUID(as_uuid=True), ForeignKey("pos_orders.id"), nullable=False, index=True)
    channel = Column(String(30), default=PaymentChannel.CASH.value, nullable=False, index=True)
    amount = Column(Integer, nullable=False)
    status = Column(String(30), default=RefundStatus.SUCCESS.value, nullable=False, index=True)
    refunded_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False, index=True)
    external_refund_no = Column(String(100), nullable=True, index=True)
    operator_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    reason = Column(Text)

    payment = relationship("PaymentTransaction", back_populates="refunds")
    order = relationship("POSOrder", back_populates="payment_refunds")

    __table_args__ = (
        Index("ix_refund_transactions_merchant_store_channel", "merchant_id", "store_id", "channel"),
        Index("ix_refund_transactions_merchant_order", "merchant_id", "order_id"),
        Index("ix_refund_transactions_merchant_refunded_at", "merchant_id", "refunded_at"),
    )


class DailyReconciliation(StoreScopedMixin, BaseModel):
    __tablename__ = "daily_reconciliations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    reconciliation_date = Column(Date, nullable=False, index=True)
    channel = Column(String(30), default=PaymentChannel.CASH.value, nullable=False, index=True)
    payment_amount = Column(Integer, default=0, nullable=False)
    payment_count = Column(Integer, default=0, nullable=False)
    refund_amount = Column(Integer, default=0, nullable=False)
    refund_count = Column(Integer, default=0, nullable=False)
    net_amount = Column(Integer, default=0, nullable=False)
    variance_amount = Column(Integer, default=0, nullable=False)
    status = Column(String(30), default=ReconciliationStatus.DRAFT.value, nullable=False, index=True)
    generated_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    confirmed_at = Column(DateTime(timezone=True), nullable=True)
    remark = Column(Text)

    variances = relationship("ReconciliationVariance", back_populates="reconciliation", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("merchant_id", "store_id", "reconciliation_date", "channel", name="uq_daily_reconciliation_scope_channel"),
        Index("ix_daily_reconciliations_merchant_date", "merchant_id", "reconciliation_date"),
        Index("ix_daily_reconciliations_merchant_store_date", "merchant_id", "store_id", "reconciliation_date"),
    )


class ReconciliationVariance(StoreScopedMixin, BaseModel):
    __tablename__ = "reconciliation_variances"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    reconciliation_id = Column(UUID(as_uuid=True), ForeignKey("daily_reconciliations.id"), nullable=False, index=True)
    channel = Column(String(30), default=PaymentChannel.CASH.value, nullable=False, index=True)
    expected_amount = Column(Integer, default=0, nullable=False)
    actual_amount = Column(Integer, default=0, nullable=False)
    variance_amount = Column(Integer, default=0, nullable=False)
    status = Column(String(30), default=ReconciliationStatus.HAS_VARIANCE.value, nullable=False, index=True)
    reason = Column(Text)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    remark = Column(Text)

    reconciliation = relationship("DailyReconciliation", back_populates="variances")

    __table_args__ = (
        Index("ix_reconciliation_variances_merchant_reconciliation", "merchant_id", "reconciliation_id"),
        Index("ix_reconciliation_variances_merchant_status", "merchant_id", "status"),
    )
