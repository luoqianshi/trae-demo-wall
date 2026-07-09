import uuid
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_merchant_id
from app.models.advanced import (
    AuditLog,
    DeliveryPlatformOrder,
    DeliveryPlatformStore,
    DeliveryVoucherRedemption,
    PurchaseReturnRecord,
    RiskAlert,
    StockInRecord,
    Supplier,
)
from app.schemas.advanced import (
    AdvancedListResponse,
    AuditLogCreateRequest,
    CouponIssueRequest,
    CouponQuoteRequest,
    CouponRedeemRequest,
    CouponTemplateCreateRequest,
    DeliveryOrderCreateRequest,
    DeliveryStoreCreateRequest,
    DeliveryVoucherRedeemRequest,
    FinancialDailyQueryResponse,
    KitchenTaskCreateRequest,
    KitchenTaskStatusRequest,
    PurchaseOrderCreateRequest,
    PurchaseReturnCreateRequest,
    RiskAlertCreateRequest,
    StockInCreateRequest,
    SupplierCreateRequest,
)
from app.services.advanced_service import AdvancedService

router = APIRouter(prefix="/advanced", tags=["高级餐饮模块"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_current_merchant_id(token: str = Depends(oauth2_scheme)) -> uuid.UUID:
    return decode_merchant_id(token)


def _response(items) -> AdvancedListResponse:
    return AdvancedListResponse(items=AdvancedService.serialize_list(items), total=len(items))


@router.get("/kitchen/tasks", response_model=AdvancedListResponse)
def list_kitchen_tasks(
    store_id: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    merchant_id: uuid.UUID = Depends(get_current_merchant_id),
    db: Session = Depends(get_db),
):
    return _response(AdvancedService.list_kitchen_tasks(db, merchant_id, store_id, status))


@router.post("/kitchen/tasks")
def create_kitchen_task(
    request: KitchenTaskCreateRequest,
    merchant_id: uuid.UUID = Depends(get_current_merchant_id),
    db: Session = Depends(get_db),
):
    try:
        return AdvancedService._serialize(AdvancedService.create_kitchen_task(db, merchant_id, request))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/kitchen/tasks/{task_id}/status")
def update_kitchen_task_status(
    task_id: str,
    request: KitchenTaskStatusRequest,
    merchant_id: uuid.UUID = Depends(get_current_merchant_id),
    db: Session = Depends(get_db),
):
    try:
        return AdvancedService._serialize(AdvancedService.update_kitchen_status(db, merchant_id, task_id, request))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/kitchen/tasks/{task_id}/urge")
def urge_kitchen_task(
    task_id: str,
    merchant_id: uuid.UUID = Depends(get_current_merchant_id),
    db: Session = Depends(get_db),
):
    try:
        return AdvancedService._serialize(AdvancedService.urge_kitchen_task(db, merchant_id, task_id))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/suppliers", response_model=AdvancedListResponse)
def list_suppliers(
    store_id: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    merchant_id: uuid.UUID = Depends(get_current_merchant_id),
    db: Session = Depends(get_db),
):
    return _response(AdvancedService.list_suppliers(db, merchant_id, store_id, status))


@router.post("/suppliers")
def create_supplier(
    request: SupplierCreateRequest,
    merchant_id: uuid.UUID = Depends(get_current_merchant_id),
    db: Session = Depends(get_db),
):
    try:
        return AdvancedService._serialize(AdvancedService.create_supplier(db, merchant_id, request))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/purchases", response_model=AdvancedListResponse)
def list_purchase_orders(
    store_id: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    merchant_id: uuid.UUID = Depends(get_current_merchant_id),
    db: Session = Depends(get_db),
):
    return _response(AdvancedService.list_purchase_orders(db, merchant_id, store_id, status))


@router.post("/purchases")
def create_purchase_order(
    request: PurchaseOrderCreateRequest,
    merchant_id: uuid.UUID = Depends(get_current_merchant_id),
    db: Session = Depends(get_db),
):
    try:
        return AdvancedService._serialize(AdvancedService.create_purchase_order(db, merchant_id, request))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/purchases/{order_id}/receive")
def receive_purchase_order(
    order_id: str,
    merchant_id: uuid.UUID = Depends(get_current_merchant_id),
    db: Session = Depends(get_db),
):
    try:
        return AdvancedService._serialize(AdvancedService.receive_purchase_order(db, merchant_id, order_id))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/stock-in")
def create_stock_in(
    request: StockInCreateRequest,
    merchant_id: uuid.UUID = Depends(get_current_merchant_id),
    db: Session = Depends(get_db),
):
    try:
        return AdvancedService._serialize(AdvancedService.create_stock_in(db, merchant_id, request))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/stock-in", response_model=AdvancedListResponse)
def list_stock_in(
    store_id: Optional[str] = Query(default=None),
    merchant_id: uuid.UUID = Depends(get_current_merchant_id),
    db: Session = Depends(get_db),
):
    return _response(AdvancedService._list(db, StockInRecord, merchant_id, store_id))


@router.get("/purchase-returns", response_model=AdvancedListResponse)
def list_purchase_returns(
    store_id: Optional[str] = Query(default=None),
    merchant_id: uuid.UUID = Depends(get_current_merchant_id),
    db: Session = Depends(get_db),
):
    return _response(AdvancedService._list(db, PurchaseReturnRecord, merchant_id, store_id))


@router.post("/purchase-returns")
def create_purchase_return(
    request: PurchaseReturnCreateRequest,
    merchant_id: uuid.UUID = Depends(get_current_merchant_id),
    db: Session = Depends(get_db),
):
    try:
        return AdvancedService._serialize(AdvancedService.create_purchase_return(db, merchant_id, request))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/finance/daily", response_model=FinancialDailyQueryResponse)
def get_financial_daily(
    report_date: date = Query(...),
    store_id: Optional[str] = Query(default=None),
    merchant_id: uuid.UUID = Depends(get_current_merchant_id),
    db: Session = Depends(get_db),
):
    items = AdvancedService.financial_daily(db, merchant_id, report_date, store_id)
    return FinancialDailyQueryResponse(items=items, total=len(items))


@router.get("/coupons/templates", response_model=AdvancedListResponse)
def list_coupon_templates(
    store_id: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    merchant_id: uuid.UUID = Depends(get_current_merchant_id),
    db: Session = Depends(get_db),
):
    return _response(AdvancedService.list_coupon_templates(db, merchant_id, store_id, status))


@router.post("/coupons/templates")
def create_coupon_template(
    request: CouponTemplateCreateRequest,
    merchant_id: uuid.UUID = Depends(get_current_merchant_id),
    db: Session = Depends(get_db),
):
    try:
        return AdvancedService._serialize(AdvancedService.create_coupon_template(db, merchant_id, request))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/coupons/issue", response_model=AdvancedListResponse)
def issue_coupon(
    request: CouponIssueRequest,
    merchant_id: uuid.UUID = Depends(get_current_merchant_id),
    db: Session = Depends(get_db),
):
    try:
        return _response(AdvancedService.issue_coupon(db, merchant_id, request))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/coupons/quote")
def quote_coupon(
    request: CouponQuoteRequest,
    merchant_id: uuid.UUID = Depends(get_current_merchant_id),
    db: Session = Depends(get_db),
):
    try:
        return AdvancedService.quote_coupon(db, merchant_id, request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/coupons/redeem")
def redeem_coupon(
    request: CouponRedeemRequest,
    merchant_id: uuid.UUID = Depends(get_current_merchant_id),
    db: Session = Depends(get_db),
):
    try:
        return AdvancedService._serialize(AdvancedService.redeem_coupon(db, merchant_id, request))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/delivery/stores", response_model=AdvancedListResponse)
def list_delivery_stores(
    store_id: Optional[str] = Query(default=None),
    merchant_id: uuid.UUID = Depends(get_current_merchant_id),
    db: Session = Depends(get_db),
):
    return _response(AdvancedService._list(db, DeliveryPlatformStore, merchant_id, store_id))


@router.post("/delivery/stores")
def create_delivery_store(
    request: DeliveryStoreCreateRequest,
    merchant_id: uuid.UUID = Depends(get_current_merchant_id),
    db: Session = Depends(get_db),
):
    try:
        return AdvancedService._serialize(AdvancedService.create_delivery_store(db, merchant_id, request))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/delivery/orders", response_model=AdvancedListResponse)
def list_delivery_orders(
    store_id: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    merchant_id: uuid.UUID = Depends(get_current_merchant_id),
    db: Session = Depends(get_db),
):
    return _response(AdvancedService._list(db, DeliveryPlatformOrder, merchant_id, store_id, status))


@router.post("/delivery/orders")
def create_delivery_order(
    request: DeliveryOrderCreateRequest,
    merchant_id: uuid.UUID = Depends(get_current_merchant_id),
    db: Session = Depends(get_db),
):
    try:
        return AdvancedService._serialize(AdvancedService.create_delivery_order(db, merchant_id, request))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/delivery/voucher-redemptions", response_model=AdvancedListResponse)
def list_delivery_voucher_redemptions(
    store_id: Optional[str] = Query(default=None),
    merchant_id: uuid.UUID = Depends(get_current_merchant_id),
    db: Session = Depends(get_db),
):
    return _response(AdvancedService._list(db, DeliveryVoucherRedemption, merchant_id, store_id))


@router.post("/delivery/voucher-redemptions")
def redeem_delivery_voucher(
    request: DeliveryVoucherRedeemRequest,
    merchant_id: uuid.UUID = Depends(get_current_merchant_id),
    db: Session = Depends(get_db),
):
    try:
        return AdvancedService._serialize(AdvancedService.redeem_delivery_voucher(db, merchant_id, request))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/audits", response_model=AdvancedListResponse)
def list_audit_logs(
    store_id: Optional[str] = Query(default=None),
    merchant_id: uuid.UUID = Depends(get_current_merchant_id),
    db: Session = Depends(get_db),
):
    return _response(AdvancedService._list(db, AuditLog, merchant_id, store_id))


@router.post("/audits")
def create_audit_log(
    request: AuditLogCreateRequest,
    merchant_id: uuid.UUID = Depends(get_current_merchant_id),
    db: Session = Depends(get_db),
):
    try:
        return AdvancedService._serialize(AdvancedService.create_audit_log(db, merchant_id, request))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/risks", response_model=AdvancedListResponse)
def list_risk_alerts(
    store_id: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    merchant_id: uuid.UUID = Depends(get_current_merchant_id),
    db: Session = Depends(get_db),
):
    query = AdvancedService._list(db, RiskAlert, merchant_id, store_id, status)
    return _response(query)


@router.post("/risks")
def create_risk_alert(
    request: RiskAlertCreateRequest,
    merchant_id: uuid.UUID = Depends(get_current_merchant_id),
    db: Session = Depends(get_db),
):
    try:
        return AdvancedService._serialize(AdvancedService.create_risk_alert(db, merchant_id, request))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/summary")
def get_advanced_summary(
    merchant_id: uuid.UUID = Depends(get_current_merchant_id),
    db: Session = Depends(get_db),
):
    return AdvancedService.advanced_summary(db, merchant_id)
