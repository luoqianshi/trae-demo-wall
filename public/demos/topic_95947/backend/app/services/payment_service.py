from datetime import datetime
import uuid
from typing import Optional

from sqlalchemy.orm import Session, joinedload

from app.core.enums import PaymentChannel, PaymentStatus, PosOrderStatus, RefundStatus
from app.core.scoping import (
    apply_merchant_scope,
    apply_store_scope,
    require_merchant_id,
    to_uuid,
    validate_store_scope,
)
from app.models.payment import PaymentTransaction, RefundTransaction
from app.models.pos import POSOrder, POSOrderLog, POSRefund
from app.models.table import RestaurantTable, TableSession
from app.utils.money import normalize_amount_fen


class PaymentService:
    @staticmethod
    def _payload(data) -> dict:
        return data.model_dump(exclude_unset=True) if hasattr(data, "model_dump") else dict(data)

    @staticmethod
    def _payment_no() -> str:
        return f"PAY{datetime.utcnow().strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:6].upper()}"

    @staticmethod
    def _refund_no() -> str:
        return f"PRF{datetime.utcnow().strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:6].upper()}"

    @staticmethod
    def _pos_refund_no() -> str:
        return f"RF{datetime.utcnow().strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:6].upper()}"

    @staticmethod
    def _validate_channel(channel: str) -> str:
        if channel not in {item.value for item in PaymentChannel}:
            raise ValueError("无效的支付渠道")
        return channel

    @staticmethod
    def _get_order(db: Session, merchant_id, order_id, store_id=None) -> POSOrder:
        query = apply_merchant_scope(
            db.query(POSOrder).options(joinedload(POSOrder.items)),
            POSOrder,
            merchant_id,
        ).filter(POSOrder.id == to_uuid(order_id, "POS订单ID"))
        if store_id:
            query = query.filter(POSOrder.store_id == to_uuid(store_id, "门店ID"))
        order = query.first()
        if not order:
            raise ValueError("POS订单不存在、跨门店或无权访问")
        return order

    @staticmethod
    def _get_payment(db: Session, merchant_id, payment_id) -> PaymentTransaction:
        payment = (
            apply_merchant_scope(
                db.query(PaymentTransaction).options(joinedload(PaymentTransaction.refunds)),
                PaymentTransaction,
                merchant_id,
            )
            .filter(PaymentTransaction.id == to_uuid(payment_id, "支付流水ID"))
            .first()
        )
        if not payment:
            raise ValueError("支付流水不存在或无权访问")
        return payment

    @staticmethod
    def _write_order_log(
        db: Session,
        order: POSOrder,
        action: str,
        before_status: Optional[str] = None,
        after_status: Optional[str] = None,
        detail: Optional[str] = None,
        operator_id=None,
    ) -> POSOrderLog:
        log = POSOrderLog(
            id=uuid.uuid4(),
            merchant_id=order.merchant_id,
            store_id=order.store_id,
            order_id=order.id,
            operator_id=to_uuid(operator_id, "操作员ID") if operator_id else None,
            action=action,
            before_status=before_status,
            after_status=after_status,
            detail=detail,
        )
        db.add(log)
        return log

    @staticmethod
    def _detach_order_table(db: Session, order: POSOrder) -> None:
        if order.table_id:
            table = db.query(RestaurantTable).filter(RestaurantTable.id == order.table_id).first()
            if table and table.current_pos_order_id == order.id:
                table.current_pos_order_id = None
        if order.table_session_id:
            session = db.query(TableSession).filter(TableSession.id == order.table_session_id).first()
            if session and session.current_pos_order_id == order.id:
                session.current_pos_order_id = None

    @staticmethod
    def list_payments(
        db: Session,
        merchant_id,
        store_id: Optional[str] = None,
        order_id: Optional[str] = None,
        channel: Optional[str] = None,
    ) -> list[PaymentTransaction]:
        query = apply_merchant_scope(db.query(PaymentTransaction), PaymentTransaction, merchant_id)
        query = apply_store_scope(query, PaymentTransaction, store_id)
        if order_id:
            query = query.filter(PaymentTransaction.order_id == to_uuid(order_id, "POS订单ID"))
        if channel:
            query = query.filter(PaymentTransaction.channel == PaymentService._validate_channel(channel))
        return query.order_by(PaymentTransaction.paid_at.desc(), PaymentTransaction.created_at.desc()).all()

    @staticmethod
    def create_payment(db: Session, merchant_id, data, commit: bool = True) -> PaymentTransaction:
        merchant_uuid = require_merchant_id(merchant_id)
        payload = PaymentService._payload(data)
        store_uuid = validate_store_scope(db, merchant_uuid, payload["store_id"])
        channel = PaymentService._validate_channel(payload["channel"])
        order = PaymentService._get_order(db, merchant_uuid, payload["order_id"], store_uuid)
        if order.status in {PosOrderStatus.CANCELLED.value, PosOrderStatus.REFUNDED.value}:
            raise ValueError("已取消或已全额退款的订单不能记录支付")
        if not order.items:
            raise ValueError("POS订单没有菜品，不能记录支付")
        outstanding = order.payable_amount - order.paid_amount
        amount = outstanding if payload.get("amount_fen") is None else normalize_amount_fen(payload.get("amount_fen"), "支付金额")
        if amount <= 0:
            raise ValueError("支付金额必须大于0")
        if amount > outstanding:
            raise ValueError("支付金额不能超过订单待支付金额")
        before = order.status
        payment = PaymentTransaction(
            id=uuid.uuid4(),
            payment_no=PaymentService._payment_no(),
            merchant_id=merchant_uuid,
            store_id=store_uuid,
            order_id=order.id,
            channel=channel,
            amount=amount,
            status=PaymentStatus.SUCCESS.value,
            paid_at=datetime.utcnow(),
            external_trade_no=payload.get("external_trade_no"),
            operator_id=to_uuid(payload.get("operator_id"), "操作员ID") if payload.get("operator_id") else None,
            remark=payload.get("remark"),
        )
        db.add(payment)
        order.paid_amount += amount
        if order.paid_amount >= order.payable_amount:
            order.status = PosOrderStatus.PAID.value
            order.paid_at = payment.paid_at
            PaymentService._detach_order_table(db, order)
        elif order.status in {PosOrderStatus.DRAFT.value, PosOrderStatus.SUSPENDED.value}:
            order.status = PosOrderStatus.PENDING_PAYMENT.value
        PaymentService._write_order_log(
            db,
            order,
            "payment",
            before,
            order.status,
            f"支付渠道：{channel}，支付金额：{amount}",
            payload.get("operator_id"),
        )
        if commit:
            db.commit()
            db.refresh(payment)
        return payment

    @staticmethod
    def list_refunds(
        db: Session,
        merchant_id,
        store_id: Optional[str] = None,
        order_id: Optional[str] = None,
        channel: Optional[str] = None,
    ) -> list[RefundTransaction]:
        query = apply_merchant_scope(db.query(RefundTransaction), RefundTransaction, merchant_id)
        query = apply_store_scope(query, RefundTransaction, store_id)
        if order_id:
            query = query.filter(RefundTransaction.order_id == to_uuid(order_id, "POS订单ID"))
        if channel:
            query = query.filter(RefundTransaction.channel == PaymentService._validate_channel(channel))
        return query.order_by(RefundTransaction.refunded_at.desc(), RefundTransaction.created_at.desc()).all()

    @staticmethod
    def create_refund(
        db: Session,
        merchant_id,
        payment_id,
        data,
        commit: bool = True,
        update_order: bool = True,
        create_pos_refund: bool = True,
    ) -> RefundTransaction:
        payment = PaymentService._get_payment(db, merchant_id, payment_id)
        if payment.status not in {PaymentStatus.SUCCESS.value, PaymentStatus.PARTIALLY_REFUNDED.value}:
            raise ValueError("当前支付流水状态不允许退款")
        payload = PaymentService._payload(data)
        refunded = sum(item.amount for item in payment.refunds if item.status == RefundStatus.SUCCESS.value)
        refundable = payment.amount - refunded
        amount = refundable if payload.get("amount_fen") is None else normalize_amount_fen(payload.get("amount_fen"), "退款金额")
        if amount <= 0:
            raise ValueError("退款金额必须大于0")
        if amount > refundable:
            raise ValueError("退款金额不能超过支付流水可退金额")
        order = PaymentService._get_order(db, payment.merchant_id, payment.order_id, payment.store_id)
        before = order.status
        refund = RefundTransaction(
            id=uuid.uuid4(),
            refund_no=PaymentService._refund_no(),
            merchant_id=payment.merchant_id,
            store_id=payment.store_id,
            payment_id=payment.id,
            order_id=payment.order_id,
            channel=payment.channel,
            amount=amount,
            status=RefundStatus.SUCCESS.value,
            refunded_at=datetime.utcnow(),
            external_refund_no=payload.get("external_refund_no"),
            operator_id=to_uuid(payload.get("operator_id"), "操作员ID") if payload.get("operator_id") else None,
            reason=payload.get("reason"),
        )
        db.add(refund)
        total_payment_refunded = refunded + amount
        payment.status = PaymentStatus.REFUNDED.value if total_payment_refunded == payment.amount else PaymentStatus.PARTIALLY_REFUNDED.value
        if update_order:
            order.refunded_amount += amount
            order.status = (
                PosOrderStatus.REFUNDED.value
                if order.refunded_amount >= order.paid_amount
                else PosOrderStatus.PARTIALLY_REFUNDED.value
            )
        if create_pos_refund:
            db.add(
                POSRefund(
                    id=uuid.uuid4(),
                    refund_no=PaymentService._pos_refund_no(),
                    merchant_id=order.merchant_id,
                    store_id=order.store_id,
                    order_id=order.id,
                    amount=amount,
                    status=RefundStatus.SUCCESS.value,
                    reason=payload.get("reason"),
                    operator_id=to_uuid(payload.get("operator_id"), "操作员ID") if payload.get("operator_id") else None,
                )
            )
        PaymentService._write_order_log(
            db,
            order,
            "payment_refund",
            before,
            order.status,
            f"支付退款渠道：{payment.channel}，退款金额：{amount}",
            payload.get("operator_id"),
        )
        if commit:
            db.commit()
            db.refresh(refund)
        return refund

    @staticmethod
    def create_order_refund_for_latest_payment(
        db: Session,
        merchant_id,
        order: POSOrder,
        amount: int,
        reason: Optional[str] = None,
        operator_id=None,
        commit: bool = False,
    ) -> list[RefundTransaction]:
        remaining = normalize_amount_fen(amount, "退款金额")
        refunds: list[RefundTransaction] = []
        payments = (
            apply_merchant_scope(db.query(PaymentTransaction), PaymentTransaction, merchant_id)
            .filter(
                PaymentTransaction.order_id == order.id,
                PaymentTransaction.status.in_([PaymentStatus.SUCCESS.value, PaymentStatus.PARTIALLY_REFUNDED.value]),
            )
            .order_by(PaymentTransaction.paid_at.desc())
            .all()
        )
        for payment in payments:
            refunded = sum(item.amount for item in payment.refunds if item.status == RefundStatus.SUCCESS.value)
            refundable = payment.amount - refunded
            if refundable <= 0:
                continue
            refund_amount = min(remaining, refundable)
            refunds.append(
                PaymentService.create_refund(
                    db,
                    merchant_id,
                    payment.id,
                    {"amount_fen": refund_amount, "reason": reason, "operator_id": operator_id},
                    commit=False,
                    update_order=False,
                    create_pos_refund=False,
                )
            )
            remaining -= refund_amount
            if remaining == 0:
                break
        if remaining > 0:
            raise ValueError("未找到足够可退的支付流水")
        if commit:
            db.commit()
        return refunds
