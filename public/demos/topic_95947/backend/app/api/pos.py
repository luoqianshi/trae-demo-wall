import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_merchant_id
from app.models.pos import POSOrder, POSOrderItem, POSOrderLog, POSRefund
from app.schemas.pos import (
    POSAddDishRequest,
    POSAdjustItemQuantityRequest,
    POSCancelOrderRequest,
    POSCheckoutRequest,
    POSOrderCreateRequest,
    POSOrderItemResponse,
    POSOrderListResponse,
    POSOrderLogResponse,
    POSOrderResponse,
    POSRefundRequest,
    POSRefundResponse,
    POSSuspendOrderRequest,
)
from app.services.pos_service import POSService

router = APIRouter(prefix="/pos", tags=["POS收银"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_current_merchant_id(token: str = Depends(oauth2_scheme)) -> uuid.UUID:
    return decode_merchant_id(token)


def _item_response(item: POSOrderItem) -> POSOrderItemResponse:
    return POSOrderItemResponse(
        id=str(item.id),
        merchant_id=str(item.merchant_id),
        store_id=str(item.store_id),
        order_id=str(item.order_id),
        dish_id=str(item.dish_id),
        dish_name=item.dish_name,
        unit_price=item.unit_price,
        quantity=item.quantity,
        subtotal_amount=item.subtotal_amount,
        discount_amount=item.discount_amount,
        total_amount=item.total_amount,
        note=item.note,
        created_at=item.created_at,
        updated_at=item.updated_at,
    )


def _order_response(order: POSOrder) -> POSOrderResponse:
    return POSOrderResponse(
        id=str(order.id),
        order_no=order.order_no,
        merchant_id=str(order.merchant_id),
        store_id=str(order.store_id),
        table_id=str(order.table_id) if order.table_id else None,
        table_no=order.table.table_no if order.table else None,
        table_name=order.table.name if order.table else None,
        table_session_id=str(order.table_session_id) if order.table_session_id else None,
        status=order.status,
        party_size=order.party_size,
        subtotal_amount=order.subtotal_amount,
        discount_amount=order.discount_amount,
        rounding_amount=order.rounding_amount,
        payable_amount=order.payable_amount,
        paid_amount=order.paid_amount,
        refunded_amount=order.refunded_amount,
        note=order.note,
        cancelled_reason=order.cancelled_reason,
        suspended_at=order.suspended_at,
        paid_at=order.paid_at,
        cancelled_at=order.cancelled_at,
        items=[_item_response(item) for item in order.items],
        created_at=order.created_at,
        updated_at=order.updated_at,
    )


def _refund_response(refund: POSRefund) -> POSRefundResponse:
    return POSRefundResponse(
        id=str(refund.id),
        refund_no=refund.refund_no,
        merchant_id=str(refund.merchant_id),
        store_id=str(refund.store_id),
        order_id=str(refund.order_id),
        amount=refund.amount,
        status=refund.status,
        reason=refund.reason,
        operator_id=str(refund.operator_id) if refund.operator_id else None,
        created_at=refund.created_at,
        updated_at=refund.updated_at,
    )


def _log_response(log: POSOrderLog) -> POSOrderLogResponse:
    return POSOrderLogResponse(
        id=str(log.id),
        merchant_id=str(log.merchant_id),
        store_id=str(log.store_id),
        order_id=str(log.order_id),
        operator_id=str(log.operator_id) if log.operator_id else None,
        action=log.action,
        before_status=log.before_status,
        after_status=log.after_status,
        detail=log.detail,
        created_at=log.created_at,
        updated_at=log.updated_at,
    )


@router.get("/orders/", response_model=POSOrderListResponse)
def list_pos_orders(
    store_id: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    merchant_id: uuid.UUID = Depends(get_current_merchant_id),
    db: Session = Depends(get_db),
):
    try:
        orders = POSService.list_orders(db, merchant_id, store_id, status)
        return POSOrderListResponse(items=[_order_response(item) for item in orders], total=len(orders))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/orders/", response_model=POSOrderResponse)
def create_pos_order(
    request: POSOrderCreateRequest,
    merchant_id: uuid.UUID = Depends(get_current_merchant_id),
    db: Session = Depends(get_db),
):
    try:
        return _order_response(POSService.create_order(db, merchant_id, request))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/orders/{order_id}", response_model=POSOrderResponse)
def get_pos_order(
    order_id: str,
    merchant_id: uuid.UUID = Depends(get_current_merchant_id),
    db: Session = Depends(get_db),
):
    try:
        return _order_response(POSService._get_order(db, merchant_id, order_id))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/orders/{order_id}/items", response_model=POSOrderResponse)
def add_pos_order_item(
    order_id: str,
    request: POSAddDishRequest,
    merchant_id: uuid.UUID = Depends(get_current_merchant_id),
    db: Session = Depends(get_db),
):
    try:
        return _order_response(POSService.add_dish(db, merchant_id, order_id, request))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/orders/{order_id}/items/{item_id}", response_model=POSOrderResponse)
def adjust_pos_order_item_quantity(
    order_id: str,
    item_id: str,
    request: POSAdjustItemQuantityRequest,
    merchant_id: uuid.UUID = Depends(get_current_merchant_id),
    db: Session = Depends(get_db),
):
    try:
        return _order_response(POSService.adjust_quantity(db, merchant_id, order_id, item_id, request))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/orders/{order_id}/suspend", response_model=POSOrderResponse)
def suspend_pos_order(
    order_id: str,
    request: POSSuspendOrderRequest,
    merchant_id: uuid.UUID = Depends(get_current_merchant_id),
    db: Session = Depends(get_db),
):
    try:
        return _order_response(POSService.suspend_order(db, merchant_id, order_id, request))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/orders/{order_id}/cancel", response_model=POSOrderResponse)
def cancel_pos_order(
    order_id: str,
    request: POSCancelOrderRequest,
    merchant_id: uuid.UUID = Depends(get_current_merchant_id),
    db: Session = Depends(get_db),
):
    try:
        return _order_response(POSService.cancel_order(db, merchant_id, order_id, request))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/orders/{order_id}/checkout", response_model=POSOrderResponse)
def checkout_pos_order(
    order_id: str,
    request: POSCheckoutRequest,
    merchant_id: uuid.UUID = Depends(get_current_merchant_id),
    db: Session = Depends(get_db),
):
    try:
        return _order_response(POSService.checkout_order(db, merchant_id, order_id, request))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/orders/{order_id}/refunds", response_model=POSRefundResponse)
def refund_pos_order(
    order_id: str,
    request: POSRefundRequest,
    merchant_id: uuid.UUID = Depends(get_current_merchant_id),
    db: Session = Depends(get_db),
):
    try:
        return _refund_response(POSService.refund_order(db, merchant_id, order_id, request))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/order-logs/", response_model=List[POSOrderLogResponse])
def list_pos_order_logs(
    order_id: Optional[str] = Query(default=None),
    store_id: Optional[str] = Query(default=None),
    merchant_id: uuid.UUID = Depends(get_current_merchant_id),
    db: Session = Depends(get_db),
):
    try:
        return [_log_response(item) for item in POSService.list_logs(db, merchant_id, order_id, store_id)]
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
