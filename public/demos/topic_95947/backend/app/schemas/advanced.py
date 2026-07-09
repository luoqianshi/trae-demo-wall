from datetime import date, datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class AdvancedCreateRequest(BaseModel):
    store_id: Optional[str] = None
    name: Optional[str] = None
    status: Optional[str] = None
    payload: Dict[str, Any] = Field(default_factory=dict)


class KitchenTaskCreateRequest(BaseModel):
    store_id: str
    order_id: Optional[str] = None
    order_item_id: Optional[str] = None
    dish_name: str
    quantity: int = Field(default=1, ge=1)
    station: Optional[str] = None
    note: Optional[str] = None


class KitchenTaskStatusRequest(BaseModel):
    status: str
    note: Optional[str] = None


class SupplierCreateRequest(BaseModel):
    store_id: str
    name: str
    contact_name: Optional[str] = None
    phone: Optional[str] = None
    category: Optional[str] = None
    remark: Optional[str] = None


class PurchaseOrderItemRequest(BaseModel):
    item_name: str
    quantity: int = Field(default=1, ge=1)
    unit: str = "份"
    unit_cost: int = Field(default=0, ge=0)


class PurchaseOrderCreateRequest(BaseModel):
    store_id: str
    supplier_id: str
    expected_date: Optional[date] = None
    remark: Optional[str] = None
    items: List[PurchaseOrderItemRequest] = Field(default_factory=list)


class StockInCreateRequest(BaseModel):
    store_id: str
    purchase_order_id: Optional[str] = None
    item_name: str
    quantity: int = Field(default=1, ge=1)
    unit: str = "份"
    cost_amount: int = Field(default=0, ge=0)
    remark: Optional[str] = None


class PurchaseReturnCreateRequest(BaseModel):
    store_id: str
    purchase_order_id: Optional[str] = None
    item_name: str
    quantity: int = Field(default=1, ge=1)
    amount: int = Field(default=0, ge=0)
    reason: Optional[str] = None


class CouponTemplateCreateRequest(BaseModel):
    store_id: str
    name: str
    coupon_type: str = "cash"
    threshold_amount: int = Field(default=0, ge=0)
    discount_amount: int = Field(default=0, ge=0)
    discount_rate: int = Field(default=100, ge=1, le=100)
    rules: Optional[str] = None


class CouponIssueRequest(BaseModel):
    store_id: str
    template_id: str
    member_id: Optional[str] = None
    count: int = Field(default=1, ge=1, le=100)


class CouponQuoteRequest(BaseModel):
    store_id: str
    coupon_id: str
    order_amount: int = Field(default=0, ge=0)


class CouponRedeemRequest(BaseModel):
    store_id: str
    coupon_id: str
    order_id: str
    order_amount: int = Field(default=0, ge=0)
    remark: Optional[str] = None


class DeliveryStoreCreateRequest(BaseModel):
    store_id: str
    platform: str
    platform_store_id: str
    name: str
    remark: Optional[str] = None


class DeliveryOrderCreateRequest(BaseModel):
    store_id: str
    platform: str
    platform_order_no: str
    platform_store_id: Optional[str] = None
    amount: int = Field(default=0, ge=0)
    status: str = "pending"
    voucher_code: Optional[str] = None
    remark: Optional[str] = None


class DeliveryVoucherRedeemRequest(BaseModel):
    store_id: str
    platform_order_id: str
    voucher_code: str
    amount: int = Field(default=0, ge=0)
    remark: Optional[str] = None


class AuditLogCreateRequest(BaseModel):
    store_id: str
    operator_id: Optional[str] = None
    action: str
    target_type: str
    target_id: Optional[str] = None
    before_value: Optional[str] = None
    after_value: Optional[str] = None
    reason: Optional[str] = None
    risk_level: str = "low"


class RiskAlertCreateRequest(BaseModel):
    store_id: Optional[str] = None
    alert_type: str
    title: str
    description: Optional[str] = None
    risk_level: str = "medium"
    evidence: Optional[str] = None


class AdvancedListResponse(BaseModel):
    items: List[Dict[str, Any]]
    total: int


class FinancialDailyQueryResponse(BaseModel):
    items: List[Dict[str, Any]]
    total: int
