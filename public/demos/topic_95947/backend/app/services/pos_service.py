from datetime import datetime
import uuid
from typing import Optional

from sqlalchemy.orm import Session, joinedload

from app.core.enums import PosOrderStatus, RecordStatus, RefundStatus, TableSessionStatus
from app.core.scoping import (
    apply_merchant_scope,
    apply_store_scope,
    require_merchant_id,
    to_uuid,
    validate_store_scope,
)
from app.core.status import POS_ORDER_ALLOWED_TRANSITIONS, is_transition_allowed
from app.models.merchant import Dish, Store
from app.models.pos import POSOrder, POSOrderItem, POSOrderLog, POSRefund
from app.models.table import RestaurantTable, TableSession
from app.utils.money import calculate_line_amount, calculate_order_amount, normalize_amount_fen


class POSService:
    EDITABLE_STATUSES = {
        PosOrderStatus.DRAFT.value,
        PosOrderStatus.PENDING_PAYMENT.value,
        PosOrderStatus.SUSPENDED.value,
    }

    @staticmethod
    def _payload(data) -> dict:
        return data.model_dump(exclude_unset=True) if hasattr(data, "model_dump") else dict(data)

    @staticmethod
    def _order_no() -> str:
        return f"POS{datetime.utcnow().strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:6].upper()}"

    @staticmethod
    def _refund_no() -> str:
        return f"RF{datetime.utcnow().strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:6].upper()}"

    @staticmethod
    def _get_order(db: Session, merchant_id, order_id) -> POSOrder:
        order = (
            apply_merchant_scope(
                db.query(POSOrder).options(
                    joinedload(POSOrder.items),
                    joinedload(POSOrder.table),
                    joinedload(POSOrder.table_session),
                ),
                POSOrder,
                merchant_id,
            )
            .filter(POSOrder.id == to_uuid(order_id, "POS订单ID"))
            .first()
        )
        if not order:
            raise ValueError("POS订单不存在或无权访问")
        return order

    @staticmethod
    def _get_table(db: Session, merchant_id, table_id, store_id) -> RestaurantTable:
        table = (
            apply_merchant_scope(db.query(RestaurantTable), RestaurantTable, merchant_id)
            .filter(
                RestaurantTable.id == to_uuid(table_id, "桌台ID"),
                RestaurantTable.store_id == to_uuid(store_id, "门店ID"),
            )
            .first()
        )
        if not table:
            raise ValueError("桌台不存在、跨门店或无权访问")
        if table.enabled != RecordStatus.ENABLED.value:
            raise ValueError("桌台已停用")
        return table

    @staticmethod
    def _get_session(db: Session, merchant_id, session_id, table: RestaurantTable) -> TableSession:
        session = (
            apply_merchant_scope(db.query(TableSession), TableSession, merchant_id)
            .filter(
                TableSession.id == to_uuid(session_id, "开台记录ID"),
                TableSession.store_id == table.store_id,
                TableSession.table_id == table.id,
            )
            .first()
        )
        if not session:
            raise ValueError("开台记录不存在、跨桌台或无权访问")
        if session.status != TableSessionStatus.OPEN.value:
            raise ValueError("只能关联开台中的堂食记录")
        return session

    @staticmethod
    def _get_dish(db: Session, merchant_id, store_id, dish_id) -> Dish:
        dish = (
            db.query(Dish)
            .join(Store, Dish.store_id == Store.id)
            .filter(
                Store.merchant_id == require_merchant_id(merchant_id),
                Dish.store_id == to_uuid(store_id, "门店ID"),
                Dish.id == to_uuid(dish_id, "菜品ID"),
            )
            .first()
        )
        if not dish:
            raise ValueError("菜品不存在、跨门店或无权访问")
        if dish.status != RecordStatus.ENABLED.value:
            raise ValueError("菜品已下架，不能加入订单")
        return dish

    @staticmethod
    def _write_log(
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
    def _ensure_editable(order: POSOrder) -> None:
        if order.status not in POSService.EDITABLE_STATUSES:
            raise ValueError("当前订单状态不允许编辑菜品")

    @staticmethod
    def _set_status(order: POSOrder, target_status: PosOrderStatus) -> None:
        current = PosOrderStatus(order.status)
        if current == target_status:
            return
        if not is_transition_allowed(POS_ORDER_ALLOWED_TRANSITIONS, current, target_status):
            raise ValueError("POS订单状态不允许该流转")
        order.status = target_status.value

    @staticmethod
    def _recalculate(order: POSOrder) -> None:
        item_mappings = []
        subtotal = 0
        for item in order.items:
            item.unit_price = normalize_amount_fen(item.unit_price, "菜品单价")
            item.quantity = int(item.quantity)
            if item.quantity <= 0:
                raise ValueError("菜品数量必须大于0")
            item.subtotal_amount = calculate_line_amount(item.unit_price, item.quantity, 0)
            item.total_amount = calculate_line_amount(item.unit_price, item.quantity, item.discount_amount or 0)
            subtotal += item.subtotal_amount
            item_mappings.append(
                {
                    "unit_price_fen": item.unit_price,
                    "quantity": item.quantity,
                    "discount_fen": item.discount_amount or 0,
                }
            )
        order.subtotal_amount = subtotal
        order.discount_amount = normalize_amount_fen(order.discount_amount or 0, "订单优惠金额")
        order.rounding_amount = normalize_amount_fen(order.rounding_amount or 0, "抹零金额")
        order.payable_amount = calculate_order_amount(
            item_mappings,
            discount_fen=order.discount_amount,
            rounding_fen=order.rounding_amount,
        )

    @staticmethod
    def _attach_table_order(db: Session, order: POSOrder, table: Optional[RestaurantTable], session: Optional[TableSession]) -> None:
        if table:
            if table.current_pos_order_id and table.current_pos_order_id != order.id:
                raise ValueError("桌台已关联其它POS订单")
            table.current_pos_order_id = order.id
        if session:
            if session.current_pos_order_id and session.current_pos_order_id != order.id:
                raise ValueError("开台记录已关联其它POS订单")
            session.current_pos_order_id = order.id
            session.order_count = (session.order_count or 0) + 1

    @staticmethod
    def _detach_table_order(db: Session, order: POSOrder) -> None:
        if order.table_id:
            table = db.query(RestaurantTable).filter(RestaurantTable.id == order.table_id).first()
            if table and table.current_pos_order_id == order.id:
                table.current_pos_order_id = None
        if order.table_session_id:
            session = db.query(TableSession).filter(TableSession.id == order.table_session_id).first()
            if session and session.current_pos_order_id == order.id:
                session.current_pos_order_id = None

    @staticmethod
    def list_orders(db: Session, merchant_id, store_id: Optional[str] = None, status: Optional[str] = None) -> list[POSOrder]:
        query = apply_merchant_scope(
            db.query(POSOrder).options(joinedload(POSOrder.items), joinedload(POSOrder.table)),
            POSOrder,
            merchant_id,
        )
        query = apply_store_scope(query, POSOrder, store_id)
        if status:
            if status not in {item.value for item in PosOrderStatus}:
                raise ValueError("无效的POS订单状态")
            query = query.filter(POSOrder.status == status)
        return query.order_by(POSOrder.created_at.desc()).all()

    @staticmethod
    def create_order(db: Session, merchant_id, data) -> POSOrder:
        merchant_uuid = require_merchant_id(merchant_id)
        payload = POSService._payload(data)
        store_uuid = validate_store_scope(db, merchant_uuid, payload["store_id"])
        table = None
        session = None
        if payload.get("table_id"):
            table = POSService._get_table(db, merchant_uuid, payload["table_id"], store_uuid)
            session_id = payload.get("table_session_id") or table.current_session_id
            if session_id:
                session = POSService._get_session(db, merchant_uuid, session_id, table)
        order = POSOrder(
            id=uuid.uuid4(),
            order_no=POSService._order_no(),
            merchant_id=merchant_uuid,
            store_id=store_uuid,
            table_id=table.id if table else None,
            table_session_id=session.id if session else None,
            party_size=payload.get("party_size", 1),
            note=payload.get("note"),
            status=PosOrderStatus.DRAFT.value,
        )
        db.add(order)
        db.flush()
        POSService._attach_table_order(db, order, table, session)
        for item in payload.get("items", []):
            POSService._add_dish_without_commit(db, order, item)
        POSService._recalculate(order)
        POSService._write_log(db, order, "create", None, order.status, "创建POS订单")
        db.commit()
        db.refresh(order)
        return POSService._get_order(db, merchant_uuid, order.id)

    @staticmethod
    def _add_dish_without_commit(db: Session, order: POSOrder, item_data) -> POSOrderItem:
        payload = POSService._payload(item_data)
        dish = POSService._get_dish(db, order.merchant_id, order.store_id, payload["dish_id"])
        quantity = int(payload.get("quantity", 1))
        if quantity <= 0:
            raise ValueError("菜品数量必须大于0")
        existing = next((item for item in order.items if item.dish_id == dish.id), None)
        if existing:
            existing.quantity += quantity
            if payload.get("note"):
                existing.note = payload.get("note")
            return existing
        order_item = POSOrderItem(
            id=uuid.uuid4(),
            merchant_id=order.merchant_id,
            store_id=order.store_id,
            order_id=order.id,
            dish_id=dish.id,
            dish_name=dish.name,
            unit_price=normalize_amount_fen(dish.price, "菜品价格"),
            quantity=quantity,
            discount_amount=0,
            note=payload.get("note"),
        )
        db.add(order_item)
        order.items.append(order_item)
        return order_item

    @staticmethod
    def add_dish(db: Session, merchant_id, order_id, data) -> POSOrder:
        order = POSService._get_order(db, merchant_id, order_id)
        POSService._ensure_editable(order)
        POSService._add_dish_without_commit(db, order, data)
        POSService._recalculate(order)
        POSService._write_log(db, order, "add_dish", order.status, order.status, "添加菜品")
        db.commit()
        db.refresh(order)
        return POSService._get_order(db, merchant_id, order.id)

    @staticmethod
    def adjust_quantity(db: Session, merchant_id, order_id, item_id, data) -> POSOrder:
        order = POSService._get_order(db, merchant_id, order_id)
        POSService._ensure_editable(order)
        payload = POSService._payload(data)
        quantity = int(payload["quantity"])
        item_uuid = to_uuid(item_id, "POS订单项ID")
        item = next((item for item in order.items if item.id == item_uuid), None)
        if not item:
            raise ValueError("POS订单项不存在或无权访问")
        if quantity == 0:
            db.delete(item)
            order.items = [order_item for order_item in order.items if order_item.id != item_uuid]
        else:
            item.quantity = quantity
        POSService._recalculate(order)
        POSService._write_log(db, order, "adjust_quantity", order.status, order.status, f"调整数量为：{quantity}")
        db.commit()
        db.refresh(order)
        return POSService._get_order(db, merchant_id, order.id)

    @staticmethod
    def suspend_order(db: Session, merchant_id, order_id, data=None) -> POSOrder:
        order = POSService._get_order(db, merchant_id, order_id)
        if order.status not in {PosOrderStatus.DRAFT.value, PosOrderStatus.PENDING_PAYMENT.value}:
            raise ValueError("当前订单状态不允许挂单")
        before = order.status
        POSService._set_status(order, PosOrderStatus.SUSPENDED)
        order.suspended_at = datetime.utcnow()
        payload = POSService._payload(data) if data is not None else {}
        if payload.get("note"):
            order.note = f"{order.note or ''}\n挂单备注：{payload['note']}".strip()
        POSService._write_log(db, order, "suspend", before, order.status, payload.get("note") or "挂单")
        db.commit()
        db.refresh(order)
        return POSService._get_order(db, merchant_id, order.id)

    @staticmethod
    def cancel_order(db: Session, merchant_id, order_id, data=None) -> POSOrder:
        order = POSService._get_order(db, merchant_id, order_id)
        if order.status in {PosOrderStatus.PAID.value, PosOrderStatus.PARTIALLY_REFUNDED.value, PosOrderStatus.REFUNDED.value}:
            raise ValueError("已支付或已退款订单不能取消")
        before = order.status
        POSService._set_status(order, PosOrderStatus.CANCELLED)
        payload = POSService._payload(data) if data is not None else {}
        order.cancelled_reason = payload.get("reason")
        order.cancelled_at = datetime.utcnow()
        POSService._detach_table_order(db, order)
        POSService._write_log(db, order, "cancel", before, order.status, order.cancelled_reason or "取消订单")
        db.commit()
        db.refresh(order)
        return POSService._get_order(db, merchant_id, order.id)

    @staticmethod
    def checkout_order(db: Session, merchant_id, order_id, data=None) -> POSOrder:
        order = POSService._get_order(db, merchant_id, order_id)
        if order.status not in POSService.EDITABLE_STATUSES:
            raise ValueError("当前订单状态不允许结账")
        if not order.items:
            raise ValueError("订单没有菜品，不能结账")
        before = order.status
        if order.status == PosOrderStatus.DRAFT.value:
            POSService._set_status(order, PosOrderStatus.PENDING_PAYMENT)
        if order.status == PosOrderStatus.SUSPENDED.value:
            POSService._set_status(order, PosOrderStatus.PENDING_PAYMENT)
        POSService._recalculate(order)
        payload = POSService._payload(data) if data is not None else {}
        payment_method = payload.get("payment_method")
        if payment_method:
            from app.services.payment_service import PaymentService

            PaymentService.create_payment(
                db,
                merchant_id,
                {
                    "store_id": str(order.store_id),
                    "order_id": str(order.id),
                    "channel": payment_method,
                    "amount_fen": payload.get("payment_amount_fen"),
                    "external_trade_no": payload.get("external_trade_no"),
                    "operator_id": payload.get("operator_id"),
                    "remark": payload.get("note"),
                },
                commit=False,
            )
        else:
            POSService._set_status(order, PosOrderStatus.PAID)
            order.paid_amount = order.payable_amount
            order.paid_at = datetime.utcnow()
        if payload.get("note"):
            order.note = f"{order.note or ''}\n结账备注：{payload['note']}".strip()
        POSService._detach_table_order(db, order)
        POSService._write_log(db, order, "checkout", before, order.status, "POS订单结账")
        db.commit()
        db.refresh(order)
        return POSService._get_order(db, merchant_id, order.id)

    @staticmethod
    def refund_order(db: Session, merchant_id, order_id, data) -> POSRefund:
        order = POSService._get_order(db, merchant_id, order_id)
        if order.status not in {PosOrderStatus.PAID.value, PosOrderStatus.PARTIALLY_REFUNDED.value}:
            raise ValueError("只有已支付订单可以退款")
        payload = POSService._payload(data)
        refundable = order.paid_amount - order.refunded_amount
        amount = payload.get("amount_fen")
        refund_amount = refundable if amount is None else normalize_amount_fen(amount, "退款金额")
        if refund_amount <= 0:
            raise ValueError("退款金额必须大于0")
        if refund_amount > refundable:
            raise ValueError("退款金额不能超过可退金额")
        before = order.status
        refund = POSRefund(
            id=uuid.uuid4(),
            refund_no=POSService._refund_no(),
            merchant_id=order.merchant_id,
            store_id=order.store_id,
            order_id=order.id,
            amount=refund_amount,
            status=RefundStatus.SUCCESS.value,
            reason=payload.get("reason"),
        )
        db.add(refund)
        order.refunded_amount += refund_amount
        target = PosOrderStatus.REFUNDED if order.refunded_amount == order.paid_amount else PosOrderStatus.PARTIALLY_REFUNDED
        POSService._set_status(order, target)
        POSService._write_log(db, order, "refund", before, order.status, f"退款金额：{refund_amount}")
        from app.services.payment_service import PaymentService

        PaymentService.create_order_refund_for_latest_payment(
            db,
            merchant_id,
            order,
            refund_amount,
            reason=payload.get("reason"),
            commit=False,
        )
        db.commit()
        db.refresh(refund)
        return refund

    @staticmethod
    def list_logs(db: Session, merchant_id, order_id: Optional[str] = None, store_id: Optional[str] = None) -> list[POSOrderLog]:
        query = apply_merchant_scope(db.query(POSOrderLog), POSOrderLog, merchant_id)
        query = apply_store_scope(query, POSOrderLog, store_id)
        if order_id:
            query = query.filter(POSOrderLog.order_id == to_uuid(order_id, "POS订单ID"))
        return query.order_by(POSOrderLog.created_at.desc()).all()
