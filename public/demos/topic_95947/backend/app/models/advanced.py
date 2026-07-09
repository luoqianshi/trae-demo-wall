from datetime import datetime
import uuid

from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String, Text, UUID, Index
from sqlalchemy.orm import relationship

from app.core.scoping import MerchantScopedMixin, StoreScopedMixin
from app.models.base import BaseModel


class KitchenTask(StoreScopedMixin, BaseModel):
    __tablename__ = "kitchen_tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("pos_orders.id"), nullable=True, index=True)
    order_item_id = Column(UUID(as_uuid=True), ForeignKey("pos_order_items.id"), nullable=True, index=True)
    dish_name = Column(String(120), nullable=False)
    quantity = Column(Integer, default=1, nullable=False)
    status = Column(String(30), default="pending", nullable=False, index=True)
    station = Column(String(80), nullable=True)
    urge_count = Column(Integer, default=0, nullable=False)
    last_urged_at = Column(DateTime(timezone=True), nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    served_at = Column(DateTime(timezone=True), nullable=True)
    returned_at = Column(DateTime(timezone=True), nullable=True)
    note = Column(Text)

    order = relationship("POSOrder")
    order_item = relationship("POSOrderItem")

    __table_args__ = (
        Index("ix_kitchen_tasks_merchant_store_status", "merchant_id", "store_id", "status"),
    )


class Supplier(StoreScopedMixin, BaseModel):
    __tablename__ = "suppliers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(120), nullable=False)
    contact_name = Column(String(80), nullable=True)
    phone = Column(String(40), nullable=True)
    category = Column(String(80), nullable=True)
    status = Column(String(30), default="active", nullable=False, index=True)
    remark = Column(Text)


class PurchaseOrder(StoreScopedMixin, BaseModel):
    __tablename__ = "purchase_orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_no = Column(String(50), unique=True, nullable=False, index=True)
    supplier_id = Column(UUID(as_uuid=True), ForeignKey("suppliers.id"), nullable=False, index=True)
    status = Column(String(30), default="draft", nullable=False, index=True)
    total_amount = Column(Integer, default=0, nullable=False)
    expected_date = Column(Date, nullable=True)
    received_at = Column(DateTime(timezone=True), nullable=True)
    remark = Column(Text)

    supplier = relationship("Supplier")
    items = relationship("PurchaseOrderItem", back_populates="order", cascade="all, delete-orphan")


class PurchaseOrderItem(StoreScopedMixin, BaseModel):
    __tablename__ = "purchase_order_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("purchase_orders.id"), nullable=False, index=True)
    item_name = Column(String(120), nullable=False)
    quantity = Column(Integer, default=1, nullable=False)
    unit = Column(String(30), default="份", nullable=False)
    unit_cost = Column(Integer, default=0, nullable=False)
    total_amount = Column(Integer, default=0, nullable=False)

    order = relationship("PurchaseOrder", back_populates="items")


class StockInRecord(StoreScopedMixin, BaseModel):
    __tablename__ = "stock_in_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    purchase_order_id = Column(UUID(as_uuid=True), ForeignKey("purchase_orders.id"), nullable=True, index=True)
    item_name = Column(String(120), nullable=False)
    quantity = Column(Integer, default=1, nullable=False)
    unit = Column(String(30), default="份", nullable=False)
    cost_amount = Column(Integer, default=0, nullable=False)
    stocked_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False, index=True)
    remark = Column(Text)


class PurchaseReturnRecord(StoreScopedMixin, BaseModel):
    __tablename__ = "purchase_return_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    purchase_order_id = Column(UUID(as_uuid=True), ForeignKey("purchase_orders.id"), nullable=True, index=True)
    item_name = Column(String(120), nullable=False)
    quantity = Column(Integer, default=1, nullable=False)
    amount = Column(Integer, default=0, nullable=False)
    returned_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False, index=True)
    reason = Column(Text)


class FinancialDailyReport(StoreScopedMixin, BaseModel):
    __tablename__ = "financial_daily_reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    report_date = Column(Date, nullable=False, index=True)
    revenue_amount = Column(Integer, default=0, nullable=False)
    refund_amount = Column(Integer, default=0, nullable=False)
    net_amount = Column(Integer, default=0, nullable=False)
    purchase_cost = Column(Integer, default=0, nullable=False)
    gross_profit = Column(Integer, default=0, nullable=False)
    order_count = Column(Integer, default=0, nullable=False)
    avg_order_amount = Column(Integer, default=0, nullable=False)
    channel_summary = Column(Text)


class CouponTemplate(StoreScopedMixin, BaseModel):
    __tablename__ = "coupon_templates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(120), nullable=False)
    coupon_type = Column(String(30), default="cash", nullable=False, index=True)
    threshold_amount = Column(Integer, default=0, nullable=False)
    discount_amount = Column(Integer, default=0, nullable=False)
    discount_rate = Column(Integer, default=100, nullable=False)
    status = Column(String(30), default="active", nullable=False, index=True)
    valid_from = Column(DateTime(timezone=True), nullable=True)
    valid_to = Column(DateTime(timezone=True), nullable=True)
    rules = Column(Text)


class CouponInstance(StoreScopedMixin, BaseModel):
    __tablename__ = "coupon_instances"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    template_id = Column(UUID(as_uuid=True), ForeignKey("coupon_templates.id"), nullable=False, index=True)
    coupon_code = Column(String(80), unique=True, nullable=False, index=True)
    member_id = Column(UUID(as_uuid=True), ForeignKey("members.id"), nullable=True, index=True)
    status = Column(String(30), default="issued", nullable=False, index=True)
    issued_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    used_at = Column(DateTime(timezone=True), nullable=True)

    template = relationship("CouponTemplate")


class CouponRedemption(StoreScopedMixin, BaseModel):
    __tablename__ = "coupon_redemptions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    coupon_id = Column(UUID(as_uuid=True), ForeignKey("coupon_instances.id"), nullable=False, index=True)
    order_id = Column(UUID(as_uuid=True), ForeignKey("pos_orders.id"), nullable=False, index=True)
    discount_amount = Column(Integer, default=0, nullable=False)
    redeemed_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    remark = Column(Text)


class DeliveryPlatformStore(StoreScopedMixin, BaseModel):
    __tablename__ = "delivery_platform_stores"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    platform = Column(String(40), nullable=False, index=True)
    platform_store_id = Column(String(100), nullable=False, index=True)
    name = Column(String(120), nullable=False)
    status = Column(String(30), default="active", nullable=False, index=True)
    remark = Column(Text)


class DeliveryPlatformOrder(StoreScopedMixin, BaseModel):
    __tablename__ = "delivery_platform_orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    platform = Column(String(40), nullable=False, index=True)
    platform_order_no = Column(String(120), nullable=False, index=True)
    platform_store_id = Column(UUID(as_uuid=True), ForeignKey("delivery_platform_stores.id"), nullable=True, index=True)
    amount = Column(Integer, default=0, nullable=False)
    status = Column(String(30), default="pending", nullable=False, index=True)
    voucher_code = Column(String(120), nullable=True, index=True)
    imported_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    remark = Column(Text)


class DeliveryVoucherRedemption(StoreScopedMixin, BaseModel):
    __tablename__ = "delivery_voucher_redemptions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    platform_order_id = Column(UUID(as_uuid=True), ForeignKey("delivery_platform_orders.id"), nullable=False, index=True)
    voucher_code = Column(String(120), nullable=False, index=True)
    amount = Column(Integer, default=0, nullable=False)
    redeemed_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    remark = Column(Text)


class AuditLog(StoreScopedMixin, BaseModel):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    operator_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    action = Column(String(80), nullable=False, index=True)
    target_type = Column(String(80), nullable=False, index=True)
    target_id = Column(String(120), nullable=True, index=True)
    before_value = Column(Text)
    after_value = Column(Text)
    reason = Column(Text)
    risk_level = Column(String(30), default="low", nullable=False, index=True)


class RiskAlert(MerchantScopedMixin, BaseModel):
    __tablename__ = "risk_alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    store_id = Column(UUID(as_uuid=True), ForeignKey("stores.id"), nullable=True, index=True)
    alert_type = Column(String(80), nullable=False, index=True)
    title = Column(String(160), nullable=False)
    description = Column(Text)
    risk_level = Column(String(30), default="medium", nullable=False, index=True)
    status = Column(String(30), default="open", nullable=False, index=True)
    evidence = Column(Text)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
