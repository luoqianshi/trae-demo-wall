from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class POSOrderCreateItem(BaseModel):
    dish_id: str
    quantity: int = Field(default=1, ge=1)
    note: Optional[str] = None


class POSOrderCreateRequest(BaseModel):
    store_id: str
    table_id: Optional[str] = None
    table_session_id: Optional[str] = None
    party_size: int = Field(default=1, ge=1)
    note: Optional[str] = None
    items: List[POSOrderCreateItem] = Field(default_factory=list)


class POSAddDishRequest(BaseModel):
    dish_id: str
    quantity: int = Field(default=1, ge=1)
    note: Optional[str] = None


class POSAdjustItemQuantityRequest(BaseModel):
    quantity: int = Field(..., ge=0)


class POSSuspendOrderRequest(BaseModel):
    note: Optional[str] = None


class POSCancelOrderRequest(BaseModel):
    reason: Optional[str] = None


class POSCheckoutRequest(BaseModel):
    payment_method: Optional[str] = None
    payment_amount_fen: Optional[int] = Field(default=None, ge=0)
    external_trade_no: Optional[str] = None
    operator_id: Optional[str] = None
    note: Optional[str] = None


class POSRefundRequest(BaseModel):
    amount_fen: Optional[int] = Field(default=None, ge=0)
    reason: Optional[str] = None


class POSOrderItemResponse(BaseModel):
    id: str
    merchant_id: str
    store_id: str
    order_id: str
    dish_id: str
    dish_name: str
    unit_price: int
    quantity: int
    subtotal_amount: int
    discount_amount: int
    total_amount: int
    note: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class POSRefundResponse(BaseModel):
    id: str
    refund_no: str
    merchant_id: str
    store_id: str
    order_id: str
    amount: int
    status: str
    reason: Optional[str] = None
    operator_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class POSOrderLogResponse(BaseModel):
    id: str
    merchant_id: str
    store_id: str
    order_id: str
    operator_id: Optional[str] = None
    action: str
    before_status: Optional[str] = None
    after_status: Optional[str] = None
    detail: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class POSOrderResponse(BaseModel):
    id: str
    order_no: str
    merchant_id: str
    store_id: str
    table_id: Optional[str] = None
    table_no: Optional[str] = None
    table_name: Optional[str] = None
    table_session_id: Optional[str] = None
    status: str
    party_size: int
    subtotal_amount: int
    discount_amount: int
    rounding_amount: int
    payable_amount: int
    paid_amount: int
    refunded_amount: int
    note: Optional[str] = None
    cancelled_reason: Optional[str] = None
    suspended_at: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    items: List[POSOrderItemResponse] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime


class POSOrderListResponse(BaseModel):
    items: List[POSOrderResponse]
    total: int
