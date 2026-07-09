from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class PaymentCreateRequest(BaseModel):
    store_id: str
    order_id: str
    channel: str = Field(..., description="cash/wechat/alipay/stored_value/bank_card/other")
    amount_fen: Optional[int] = Field(default=None, ge=0)
    external_trade_no: Optional[str] = None
    operator_id: Optional[str] = None
    remark: Optional[str] = None


class RefundCreateRequest(BaseModel):
    amount_fen: Optional[int] = Field(default=None, ge=0)
    reason: Optional[str] = None
    external_refund_no: Optional[str] = None
    operator_id: Optional[str] = None


class PaymentTransactionResponse(BaseModel):
    id: str
    payment_no: str
    merchant_id: str
    store_id: str
    order_id: str
    channel: str
    amount: int
    status: str
    paid_at: datetime
    external_trade_no: Optional[str] = None
    operator_id: Optional[str] = None
    remark: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class RefundTransactionResponse(BaseModel):
    id: str
    refund_no: str
    merchant_id: str
    store_id: str
    payment_id: str
    order_id: str
    channel: str
    amount: int
    status: str
    refunded_at: datetime
    external_refund_no: Optional[str] = None
    operator_id: Optional[str] = None
    reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class PaymentTransactionListResponse(BaseModel):
    items: List[PaymentTransactionResponse]
    total: int


class RefundTransactionListResponse(BaseModel):
    items: List[RefundTransactionResponse]
    total: int


class ReconciliationGenerateRequest(BaseModel):
    reconciliation_date: date
    store_id: Optional[str] = None
    channel: Optional[str] = None


class DailyReconciliationResponse(BaseModel):
    id: Optional[str] = None
    merchant_id: str
    store_id: str
    reconciliation_date: date
    channel: str
    payment_amount: int
    payment_count: int
    refund_amount: int
    refund_count: int
    net_amount: int
    variance_amount: int = 0
    status: str
    generated_at: Optional[datetime] = None
    confirmed_at: Optional[datetime] = None
    remark: Optional[str] = None


class DailyReconciliationListResponse(BaseModel):
    items: List[DailyReconciliationResponse]
    total: int


class ReconciliationVarianceResponse(BaseModel):
    id: str
    merchant_id: str
    store_id: str
    reconciliation_id: str
    channel: str
    expected_amount: int
    actual_amount: int
    variance_amount: int
    status: str
    reason: Optional[str] = None
    resolved_at: Optional[datetime] = None
    remark: Optional[str] = None
    created_at: datetime
    updated_at: datetime
