from datetime import date, datetime, time, timedelta
import json
import uuid
from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.scoping import apply_merchant_scope, apply_store_scope, require_merchant_id, to_uuid, validate_store_scope
from app.models.advanced import (
    AuditLog,
    CouponInstance,
    CouponRedemption,
    CouponTemplate,
    DeliveryPlatformOrder,
    DeliveryPlatformStore,
    DeliveryVoucherRedemption,
    FinancialDailyReport,
    KitchenTask,
    PurchaseOrder,
    PurchaseOrderItem,
    PurchaseReturnRecord,
    RiskAlert,
    StockInRecord,
    Supplier,
)
from app.models.payment import PaymentTransaction, RefundTransaction
from app.models.pos import POSOrder
from app.utils.money import normalize_amount_fen


class AdvancedService:
    KITCHEN_STATUSES = {"pending", "cooking", "served", "returned"}

    @staticmethod
    def _payload(data) -> dict:
        if hasattr(data, "model_dump"):
            return data.model_dump()
        if hasattr(data, "dict"):
            return data.dict()
        return dict(data or {})

    @staticmethod
    def _order_no(prefix: str) -> str:
        return f"{prefix}{datetime.utcnow().strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:6].upper()}"

    @staticmethod
    def _serialize(model) -> dict:
        result = {}
        for column in model.__table__.columns:
            value = getattr(model, column.name)
            if isinstance(value, uuid.UUID):
                value = str(value)
            elif isinstance(value, datetime):
                value = value.isoformat()
            elif isinstance(value, date):
                value = value.isoformat()
            result[column.name] = value
        return result

    @staticmethod
    def _list(db: Session, model, merchant_id, store_id: Optional[str] = None, status: Optional[str] = None):
        query = apply_merchant_scope(db.query(model), model, merchant_id)
        query = apply_store_scope(query, model, store_id)
        if status and hasattr(model, "status"):
            query = query.filter(model.status == status)
        return query.order_by(model.created_at.desc()).all()

    @staticmethod
    def list_kitchen_tasks(db: Session, merchant_id, store_id=None, status=None) -> list[KitchenTask]:
        return AdvancedService._list(db, KitchenTask, merchant_id, store_id, status)

    @staticmethod
    def create_kitchen_task(db: Session, merchant_id, data) -> KitchenTask:
        merchant_uuid = require_merchant_id(merchant_id)
        payload = AdvancedService._payload(data)
        store_uuid = validate_store_scope(db, merchant_uuid, payload["store_id"])
        task = KitchenTask(
            id=uuid.uuid4(),
            merchant_id=merchant_uuid,
            store_id=store_uuid,
            order_id=to_uuid(payload["order_id"], "POS订单ID") if payload.get("order_id") else None,
            order_item_id=to_uuid(payload["order_item_id"], "POS订单项ID") if payload.get("order_item_id") else None,
            dish_name=payload["dish_name"],
            quantity=payload.get("quantity") or 1,
            station=payload.get("station"),
            note=payload.get("note"),
        )
        db.add(task)
        db.commit()
        db.refresh(task)
        return task

    @staticmethod
    def update_kitchen_status(db: Session, merchant_id, task_id, data) -> KitchenTask:
        payload = AdvancedService._payload(data)
        status = payload.get("status")
        if status not in AdvancedService.KITCHEN_STATUSES:
            raise ValueError("无效的厨房任务状态")
        task = apply_merchant_scope(db.query(KitchenTask), KitchenTask, merchant_id).filter(KitchenTask.id == to_uuid(task_id, "厨房任务ID")).first()
        if not task:
            raise ValueError("厨房任务不存在或无权访问")
        task.status = status
        task.note = payload.get("note") or task.note
        now = datetime.utcnow()
        if status == "cooking":
            task.started_at = task.started_at or now
        elif status == "served":
            task.served_at = now
        elif status == "returned":
            task.returned_at = now
        db.commit()
        db.refresh(task)
        return task

    @staticmethod
    def urge_kitchen_task(db: Session, merchant_id, task_id) -> KitchenTask:
        task = apply_merchant_scope(db.query(KitchenTask), KitchenTask, merchant_id).filter(KitchenTask.id == to_uuid(task_id, "厨房任务ID")).first()
        if not task:
            raise ValueError("厨房任务不存在或无权访问")
        task.urge_count += 1
        task.last_urged_at = datetime.utcnow()
        db.commit()
        db.refresh(task)
        return task

    @staticmethod
    def list_suppliers(db: Session, merchant_id, store_id=None, status=None) -> list[Supplier]:
        return AdvancedService._list(db, Supplier, merchant_id, store_id, status)

    @staticmethod
    def create_supplier(db: Session, merchant_id, data) -> Supplier:
        merchant_uuid = require_merchant_id(merchant_id)
        payload = AdvancedService._payload(data)
        supplier = Supplier(id=uuid.uuid4(), merchant_id=merchant_uuid, store_id=validate_store_scope(db, merchant_uuid, payload["store_id"]), **{k: payload.get(k) for k in ["name", "contact_name", "phone", "category", "remark"]})
        db.add(supplier)
        db.commit()
        db.refresh(supplier)
        return supplier

    @staticmethod
    def create_purchase_order(db: Session, merchant_id, data) -> PurchaseOrder:
        merchant_uuid = require_merchant_id(merchant_id)
        payload = AdvancedService._payload(data)
        store_uuid = validate_store_scope(db, merchant_uuid, payload["store_id"])
        supplier_id = to_uuid(payload["supplier_id"], "供应商ID")
        supplier = apply_merchant_scope(db.query(Supplier), Supplier, merchant_uuid).filter(Supplier.id == supplier_id, Supplier.store_id == store_uuid).first()
        if not supplier:
            raise ValueError("供应商不存在或无权访问")
        order = PurchaseOrder(id=uuid.uuid4(), merchant_id=merchant_uuid, store_id=store_uuid, order_no=AdvancedService._order_no("PO"), supplier_id=supplier_id, expected_date=payload.get("expected_date"), remark=payload.get("remark"))
        db.add(order)
        total = 0
        for item in payload.get("items") or []:
            qty = int(item.get("quantity") or 1)
            unit_cost = normalize_amount_fen(item.get("unit_cost") or 0, "采购单价")
            amount = qty * unit_cost
            total += amount
            db.add(PurchaseOrderItem(id=uuid.uuid4(), merchant_id=merchant_uuid, store_id=store_uuid, order=order, item_name=item["item_name"], quantity=qty, unit=item.get("unit") or "份", unit_cost=unit_cost, total_amount=amount))
        order.total_amount = total
        db.commit()
        db.refresh(order)
        return order

    @staticmethod
    def receive_purchase_order(db: Session, merchant_id, order_id) -> PurchaseOrder:
        order = apply_merchant_scope(db.query(PurchaseOrder), PurchaseOrder, merchant_id).filter(PurchaseOrder.id == to_uuid(order_id, "采购单ID")).first()
        if not order:
            raise ValueError("采购单不存在或无权访问")
        order.status = "received"
        order.received_at = datetime.utcnow()
        for item in order.items:
            db.add(StockInRecord(id=uuid.uuid4(), merchant_id=order.merchant_id, store_id=order.store_id, purchase_order_id=order.id, item_name=item.item_name, quantity=item.quantity, unit=item.unit, cost_amount=item.total_amount, remark="采购单入库"))
        db.commit()
        db.refresh(order)
        return order

    @staticmethod
    def list_purchase_orders(db: Session, merchant_id, store_id=None, status=None) -> list[PurchaseOrder]:
        return AdvancedService._list(db, PurchaseOrder, merchant_id, store_id, status)

    @staticmethod
    def create_stock_in(db: Session, merchant_id, data) -> StockInRecord:
        merchant_uuid = require_merchant_id(merchant_id)
        payload = AdvancedService._payload(data)
        record = StockInRecord(id=uuid.uuid4(), merchant_id=merchant_uuid, store_id=validate_store_scope(db, merchant_uuid, payload["store_id"]), purchase_order_id=to_uuid(payload["purchase_order_id"], "采购单ID") if payload.get("purchase_order_id") else None, item_name=payload["item_name"], quantity=payload.get("quantity") or 1, unit=payload.get("unit") or "份", cost_amount=normalize_amount_fen(payload.get("cost_amount") or 0, "入库成本"), remark=payload.get("remark"))
        db.add(record)
        db.commit()
        db.refresh(record)
        return record

    @staticmethod
    def create_purchase_return(db: Session, merchant_id, data) -> PurchaseReturnRecord:
        merchant_uuid = require_merchant_id(merchant_id)
        payload = AdvancedService._payload(data)
        store_uuid = validate_store_scope(db, merchant_uuid, payload["store_id"])
        purchase_order_id = to_uuid(payload["purchase_order_id"], "采购单ID") if payload.get("purchase_order_id") else None
        if purchase_order_id:
            order = apply_merchant_scope(db.query(PurchaseOrder), PurchaseOrder, merchant_uuid).filter(PurchaseOrder.id == purchase_order_id, PurchaseOrder.store_id == store_uuid).first()
            if not order:
                raise ValueError("采购单不存在或无权访问")
        record = PurchaseReturnRecord(
            id=uuid.uuid4(),
            merchant_id=merchant_uuid,
            store_id=store_uuid,
            purchase_order_id=purchase_order_id,
            item_name=payload["item_name"],
            quantity=payload.get("quantity") or 1,
            amount=normalize_amount_fen(payload.get("amount") or 0, "退货金额"),
            reason=payload.get("reason"),
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return record

    @staticmethod
    def financial_daily(db: Session, merchant_id, report_date: date, store_id: Optional[str] = None) -> list[dict]:
        merchant_uuid = require_merchant_id(merchant_id)
        store_uuid = validate_store_scope(db, merchant_uuid, store_id) if store_id else None
        start = datetime.combine(report_date, time.min)
        end = start + timedelta(days=1)
        payment_q = apply_merchant_scope(db.query(PaymentTransaction), PaymentTransaction, merchant_uuid)
        refund_q = apply_merchant_scope(db.query(RefundTransaction), RefundTransaction, merchant_uuid)
        purchase_q = apply_merchant_scope(db.query(StockInRecord), StockInRecord, merchant_uuid)
        order_q = apply_merchant_scope(db.query(POSOrder), POSOrder, merchant_uuid)
        for name in ("PaymentTransaction",):
            pass
        payment_q = apply_store_scope(payment_q, PaymentTransaction, store_uuid).filter(PaymentTransaction.paid_at >= start, PaymentTransaction.paid_at < end)
        refund_q = apply_store_scope(refund_q, RefundTransaction, store_uuid).filter(RefundTransaction.refunded_at >= start, RefundTransaction.refunded_at < end)
        purchase_q = apply_store_scope(purchase_q, StockInRecord, store_uuid).filter(StockInRecord.stocked_at >= start, StockInRecord.stocked_at < end)
        order_q = apply_store_scope(order_q, POSOrder, store_uuid).filter(POSOrder.created_at >= start, POSOrder.created_at < end)
        revenue = int(payment_q.with_entities(func.coalesce(func.sum(PaymentTransaction.amount), 0)).scalar() or 0)
        refund = int(refund_q.with_entities(func.coalesce(func.sum(RefundTransaction.amount), 0)).scalar() or 0)
        purchase_cost = int(purchase_q.with_entities(func.coalesce(func.sum(StockInRecord.cost_amount), 0)).scalar() or 0)
        order_count = int(order_q.count() or 0)
        net = max(revenue - refund, 0)
        return [{
            "merchant_id": str(merchant_uuid),
            "store_id": str(store_uuid) if store_uuid else None,
            "report_date": report_date.isoformat(),
            "revenue_amount": revenue,
            "refund_amount": refund,
            "net_amount": net,
            "purchase_cost": purchase_cost,
            "gross_profit": net - purchase_cost,
            "order_count": order_count,
            "avg_order_amount": int(net / order_count) if order_count else 0,
        }]

    @staticmethod
    def create_coupon_template(db: Session, merchant_id, data) -> CouponTemplate:
        merchant_uuid = require_merchant_id(merchant_id)
        payload = AdvancedService._payload(data)
        template = CouponTemplate(id=uuid.uuid4(), merchant_id=merchant_uuid, store_id=validate_store_scope(db, merchant_uuid, payload["store_id"]), name=payload["name"], coupon_type=payload.get("coupon_type") or "cash", threshold_amount=normalize_amount_fen(payload.get("threshold_amount") or 0, "使用门槛"), discount_amount=normalize_amount_fen(payload.get("discount_amount") or 0, "优惠金额"), discount_rate=payload.get("discount_rate") or 100, rules=payload.get("rules"))
        db.add(template)
        db.commit()
        db.refresh(template)
        return template

    @staticmethod
    def list_coupon_templates(db: Session, merchant_id, store_id=None, status=None) -> list[CouponTemplate]:
        return AdvancedService._list(db, CouponTemplate, merchant_id, store_id, status)

    @staticmethod
    def issue_coupon(db: Session, merchant_id, data) -> list[CouponInstance]:
        merchant_uuid = require_merchant_id(merchant_id)
        payload = AdvancedService._payload(data)
        store_uuid = validate_store_scope(db, merchant_uuid, payload["store_id"])
        template = apply_merchant_scope(db.query(CouponTemplate), CouponTemplate, merchant_uuid).filter(CouponTemplate.id == to_uuid(payload["template_id"], "优惠券模板ID"), CouponTemplate.store_id == store_uuid).first()
        if not template:
            raise ValueError("优惠券模板不存在或无权访问")
        coupons = []
        for _ in range(payload.get("count") or 1):
            coupon = CouponInstance(id=uuid.uuid4(), merchant_id=merchant_uuid, store_id=store_uuid, template_id=template.id, coupon_code=AdvancedService._order_no("CP"), member_id=to_uuid(payload["member_id"], "会员ID") if payload.get("member_id") else None)
            db.add(coupon)
            coupons.append(coupon)
        db.commit()
        return coupons

    @staticmethod
    def quote_coupon(db: Session, merchant_id, data) -> dict:
        payload = AdvancedService._payload(data)
        coupon = apply_merchant_scope(db.query(CouponInstance), CouponInstance, merchant_id).filter(CouponInstance.id == to_uuid(payload["coupon_id"], "优惠券ID")).first()
        if not coupon or coupon.status != "issued":
            raise ValueError("优惠券不可用")
        amount = normalize_amount_fen(payload.get("order_amount") or 0, "订单金额")
        template = coupon.template
        if amount < template.threshold_amount:
            discount = 0
        elif template.coupon_type == "discount":
            discount = int(amount * (100 - template.discount_rate) / 100)
        else:
            discount = min(template.discount_amount, amount)
        return {"coupon_id": str(coupon.id), "order_amount": amount, "discount_amount": max(discount, 0), "payable_amount": max(amount - discount, 0)}

    @staticmethod
    def redeem_coupon(db: Session, merchant_id, data) -> CouponRedemption:
        payload = AdvancedService._payload(data)
        quote = AdvancedService.quote_coupon(db, merchant_id, payload)
        coupon = apply_merchant_scope(db.query(CouponInstance), CouponInstance, merchant_id).filter(CouponInstance.id == to_uuid(payload["coupon_id"], "优惠券ID")).first()
        record = CouponRedemption(id=uuid.uuid4(), merchant_id=coupon.merchant_id, store_id=coupon.store_id, coupon_id=coupon.id, order_id=to_uuid(payload["order_id"], "POS订单ID"), discount_amount=quote["discount_amount"], remark=payload.get("remark"))
        coupon.status = "used"
        coupon.used_at = datetime.utcnow()
        db.add(record)
        db.commit()
        db.refresh(record)
        return record

    @staticmethod
    def create_delivery_store(db: Session, merchant_id, data) -> DeliveryPlatformStore:
        merchant_uuid = require_merchant_id(merchant_id)
        payload = AdvancedService._payload(data)
        store = DeliveryPlatformStore(id=uuid.uuid4(), merchant_id=merchant_uuid, store_id=validate_store_scope(db, merchant_uuid, payload["store_id"]), platform=payload["platform"], platform_store_id=payload["platform_store_id"], name=payload["name"], remark=payload.get("remark"))
        db.add(store)
        db.commit()
        db.refresh(store)
        return store

    @staticmethod
    def create_delivery_order(db: Session, merchant_id, data) -> DeliveryPlatformOrder:
        merchant_uuid = require_merchant_id(merchant_id)
        payload = AdvancedService._payload(data)
        order = DeliveryPlatformOrder(id=uuid.uuid4(), merchant_id=merchant_uuid, store_id=validate_store_scope(db, merchant_uuid, payload["store_id"]), platform=payload["platform"], platform_order_no=payload["platform_order_no"], platform_store_id=to_uuid(payload["platform_store_id"], "平台店铺ID") if payload.get("platform_store_id") else None, amount=normalize_amount_fen(payload.get("amount") or 0, "平台订单金额"), status=payload.get("status") or "pending", voucher_code=payload.get("voucher_code"), remark=payload.get("remark"))
        db.add(order)
        db.commit()
        db.refresh(order)
        return order

    @staticmethod
    def redeem_delivery_voucher(db: Session, merchant_id, data) -> DeliveryVoucherRedemption:
        merchant_uuid = require_merchant_id(merchant_id)
        payload = AdvancedService._payload(data)
        store_uuid = validate_store_scope(db, merchant_uuid, payload["store_id"])
        platform_order_id = to_uuid(payload["platform_order_id"], "平台订单ID")
        order = apply_merchant_scope(db.query(DeliveryPlatformOrder), DeliveryPlatformOrder, merchant_uuid).filter(DeliveryPlatformOrder.id == platform_order_id, DeliveryPlatformOrder.store_id == store_uuid).first()
        if not order:
            raise ValueError("平台订单不存在或无权访问")
        record = DeliveryVoucherRedemption(
            id=uuid.uuid4(),
            merchant_id=merchant_uuid,
            store_id=store_uuid,
            platform_order_id=platform_order_id,
            voucher_code=payload["voucher_code"],
            amount=normalize_amount_fen(payload.get("amount") or order.amount or 0, "券核销金额"),
            remark=payload.get("remark"),
        )
        order.status = "redeemed"
        db.add(record)
        db.commit()
        db.refresh(record)
        return record

    @staticmethod
    def create_audit_log(db: Session, merchant_id, data) -> AuditLog:
        merchant_uuid = require_merchant_id(merchant_id)
        payload = AdvancedService._payload(data)
        log = AuditLog(id=uuid.uuid4(), merchant_id=merchant_uuid, store_id=validate_store_scope(db, merchant_uuid, payload["store_id"]), operator_id=to_uuid(payload["operator_id"], "操作员ID") if payload.get("operator_id") else None, action=payload["action"], target_type=payload["target_type"], target_id=payload.get("target_id"), before_value=payload.get("before_value"), after_value=payload.get("after_value"), reason=payload.get("reason"), risk_level=payload.get("risk_level") or "low")
        db.add(log)
        db.commit()
        db.refresh(log)
        return log

    @staticmethod
    def create_risk_alert(db: Session, merchant_id, data) -> RiskAlert:
        merchant_uuid = require_merchant_id(merchant_id)
        payload = AdvancedService._payload(data)
        store_uuid = validate_store_scope(db, merchant_uuid, payload["store_id"]) if payload.get("store_id") else None
        alert = RiskAlert(id=uuid.uuid4(), merchant_id=merchant_uuid, store_id=store_uuid, alert_type=payload["alert_type"], title=payload["title"], description=payload.get("description"), risk_level=payload.get("risk_level") or "medium", evidence=payload.get("evidence"))
        db.add(alert)
        db.commit()
        db.refresh(alert)
        return alert

    @staticmethod
    def advanced_summary(db: Session, merchant_id) -> dict:
        merchant_uuid = require_merchant_id(merchant_id)
        return {
            "kitchen_pending": apply_merchant_scope(db.query(KitchenTask), KitchenTask, merchant_uuid).filter(KitchenTask.status.in_(["pending", "cooking"])).count(),
            "purchase_cost_today": AdvancedService.financial_daily(db, merchant_uuid, date.today())[0]["purchase_cost"],
            "coupon_redeemed": apply_merchant_scope(db.query(CouponRedemption), CouponRedemption, merchant_uuid).count(),
            "delivery_orders": apply_merchant_scope(db.query(DeliveryPlatformOrder), DeliveryPlatformOrder, merchant_uuid).count(),
            "open_risks": apply_merchant_scope(db.query(RiskAlert), RiskAlert, merchant_uuid).filter(RiskAlert.status == "open").count(),
        }

    @staticmethod
    def serialize_list(items) -> list[dict]:
        return [AdvancedService._serialize(item) for item in items]
