import uuid
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_merchant_id
from app.models.payment import DailyReconciliation, PaymentTransaction, ReconciliationVariance, RefundTransaction
from app.schemas.payment import (
    DailyReconciliationListResponse,
    DailyReconciliationResponse,
    PaymentCreateRequest,
    PaymentTransactionListResponse,
    PaymentTransactionResponse,
    ReconciliationGenerateRequest,
    ReconciliationVarianceResponse,
    RefundCreateRequest,
    RefundTransactionListResponse,
    RefundTransactionResponse,
)
from app.services.payment_service import PaymentService
from app.services.reconciliation_service import ReconciliationService

router = APIRouter(prefix="/payments", tags=["支付与对账"])
reconciliation_router = APIRouter(prefix="/reconciliations", tags=["支付与对账"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_current_merchant_id(token: str = Depends(oauth2_scheme)) -> uuid.UUID:
    return decode_merchant_id(token)


def _payment_response(payment: PaymentTransaction) -> PaymentTransactionResponse:
    return PaymentTransactionResponse(
        id=str(payment.id),
        payment_no=payment.payment_no,
        merchant_id=str(payment.merchant_id),
        store_id=str(payment.store_id),
        order_id=str(payment.order_id),
        channel=payment.channel,
        amount=payment.amount,
        status=payment.status,
        paid_at=payment.paid_at,
        external_trade_no=payment.external_trade_no,
        operator_id=str(payment.operator_id) if payment.operator_id else None,
        remark=payment.remark,
        created_at=payment.created_at,
        updated_at=payment.updated_at,
    )


def _refund_response(refund: RefundTransaction) -> RefundTransactionResponse:
    return RefundTransactionResponse(
        id=str(refund.id),
        refund_no=refund.refund_no,
        merchant_id=str(refund.merchant_id),
        store_id=str(refund.store_id),
        payment_id=str(refund.payment_id),
        order_id=str(refund.order_id),
        channel=refund.channel,
        amount=refund.amount,
        status=refund.status,
        refunded_at=refund.refunded_at,
        external_refund_no=refund.external_refund_no,
        operator_id=str(refund.operator_id) if refund.operator_id else None,
        reason=refund.reason,
        created_at=refund.created_at,
        updated_at=refund.updated_at,
    )


def _daily_response(record) -> DailyReconciliationResponse:
    if isinstance(record, DailyReconciliation):
        return DailyReconciliationResponse(
            id=str(record.id),
            merchant_id=str(record.merchant_id),
            store_id=str(record.store_id),
            reconciliation_date=record.reconciliation_date,
            channel=record.channel,
            payment_amount=record.payment_amount,
            payment_count=record.payment_count,
            refund_amount=record.refund_amount,
            refund_count=record.refund_count,
            net_amount=record.net_amount,
            variance_amount=record.variance_amount,
            status=record.status,
            generated_at=record.generated_at,
            confirmed_at=record.confirmed_at,
            remark=record.remark,
        )
    return DailyReconciliationResponse(**record)


def _variance_response(variance: ReconciliationVariance) -> ReconciliationVarianceResponse:
    return ReconciliationVarianceResponse(
        id=str(variance.id),
        merchant_id=str(variance.merchant_id),
        store_id=str(variance.store_id),
        reconciliation_id=str(variance.reconciliation_id),
        channel=variance.channel,
        expected_amount=variance.expected_amount,
        actual_amount=variance.actual_amount,
        variance_amount=variance.variance_amount,
        status=variance.status,
        reason=variance.reason,
        resolved_at=variance.resolved_at,
        remark=variance.remark,
        created_at=variance.created_at,
        updated_at=variance.updated_at,
    )


@router.get("/", response_model=PaymentTransactionListResponse)
def list_payments(
    store_id: Optional[str] = Query(default=None),
    order_id: Optional[str] = Query(default=None),
    channel: Optional[str] = Query(default=None),
    merchant_id: uuid.UUID = Depends(get_current_merchant_id),
    db: Session = Depends(get_db),
):
    try:
        payments = PaymentService.list_payments(db, merchant_id, store_id, order_id, channel)
        return PaymentTransactionListResponse(items=[_payment_response(item) for item in payments], total=len(payments))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/", response_model=PaymentTransactionResponse)
def create_payment(
    request: PaymentCreateRequest,
    merchant_id: uuid.UUID = Depends(get_current_merchant_id),
    db: Session = Depends(get_db),
):
    try:
        return _payment_response(PaymentService.create_payment(db, merchant_id, request))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/refunds/", response_model=RefundTransactionListResponse)
def list_refunds(
    store_id: Optional[str] = Query(default=None),
    order_id: Optional[str] = Query(default=None),
    channel: Optional[str] = Query(default=None),
    merchant_id: uuid.UUID = Depends(get_current_merchant_id),
    db: Session = Depends(get_db),
):
    try:
        refunds = PaymentService.list_refunds(db, merchant_id, store_id, order_id, channel)
        return RefundTransactionListResponse(items=[_refund_response(item) for item in refunds], total=len(refunds))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{payment_id}/refunds", response_model=RefundTransactionResponse)
def create_payment_refund(
    payment_id: str,
    request: RefundCreateRequest,
    merchant_id: uuid.UUID = Depends(get_current_merchant_id),
    db: Session = Depends(get_db),
):
    try:
        return _refund_response(PaymentService.create_refund(db, merchant_id, payment_id, request))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@reconciliation_router.get("/daily", response_model=DailyReconciliationListResponse)
def get_daily_reconciliation_summary(
    reconciliation_date: date = Query(...),
    store_id: Optional[str] = Query(default=None),
    channel: Optional[str] = Query(default=None),
    merchant_id: uuid.UUID = Depends(get_current_merchant_id),
    db: Session = Depends(get_db),
):
    try:
        items = ReconciliationService.aggregate_daily(db, merchant_id, reconciliation_date, store_id, channel)
        return DailyReconciliationListResponse(items=[_daily_response(item) for item in items], total=len(items))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@reconciliation_router.post("/daily/generate", response_model=DailyReconciliationListResponse)
def generate_daily_reconciliation(
    request: ReconciliationGenerateRequest,
    merchant_id: uuid.UUID = Depends(get_current_merchant_id),
    db: Session = Depends(get_db),
):
    try:
        records = ReconciliationService.generate_daily(
            db,
            merchant_id,
            request.reconciliation_date,
            request.store_id,
            request.channel,
        )
        return DailyReconciliationListResponse(items=[_daily_response(item) for item in records], total=len(records))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@reconciliation_router.get("/daily/records", response_model=DailyReconciliationListResponse)
def list_daily_reconciliation_records(
    reconciliation_date: Optional[date] = Query(default=None),
    store_id: Optional[str] = Query(default=None),
    channel: Optional[str] = Query(default=None),
    merchant_id: uuid.UUID = Depends(get_current_merchant_id),
    db: Session = Depends(get_db),
):
    try:
        records = ReconciliationService.list_daily_records(db, merchant_id, reconciliation_date, store_id, channel)
        return DailyReconciliationListResponse(items=[_daily_response(item) for item in records], total=len(records))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@reconciliation_router.get("/variances", response_model=list[ReconciliationVarianceResponse])
def list_reconciliation_variances(
    store_id: Optional[str] = Query(default=None),
    reconciliation_id: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    merchant_id: uuid.UUID = Depends(get_current_merchant_id),
    db: Session = Depends(get_db),
):
    try:
        return [
            _variance_response(item)
            for item in ReconciliationService.list_variances(db, merchant_id, store_id, reconciliation_id, status)
        ]
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
