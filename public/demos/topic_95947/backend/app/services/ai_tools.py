from collections import defaultdict
from datetime import datetime, timedelta
from typing import Any, Callable, Dict
import uuid

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.models.ai import AIActionCard
from app.models.merchant import Store, Order, Dish, Member, Inventory
from app.models.payment import DailyReconciliation, PaymentTransaction, RefundTransaction
from app.models.pos import POSOrder
from app.models.table import RestaurantTable, TableSession
from app.services.advanced_service import AdvancedService
from app.core.enums import (
    PaymentStatus,
    PosOrderStatus,
    ReconciliationStatus,
    RefundStatus,
    TableSessionStatus,
    TableStatus,
)


class AIToolRegistry:
    """Controlled business-data tools that AI features can call safely."""

    TOOL_PERMISSIONS = {
        "get_sales_summary": "merchant:data:read",
        "get_order_trend": "merchant:data:read",
        "get_dish_ranking": "merchant:dish:read",
        "get_member_summary": "merchant:member:read",
        "get_inventory_alerts": "merchant:inventory:read",
        "get_pos_summary": "merchant:data:read",
        "get_table_summary": "merchant:data:read",
        "get_payment_summary": "merchant:data:read",
        "get_advanced_summary": "merchant:data:read",
        "create_action_card_draft": "merchant:ai:write",
        "create_task_after_confirm": "merchant:ai:write",
    }

    @classmethod
    def list_tools(cls):
        return [
            {
                "name": "get_sales_summary",
                "description": "Get order and sales summary for the current merchant.",
                "parameters": {"days": "integer, optional, default 7"},
                "permission": "merchant:data:read"
            },
            {
                "name": "get_order_trend",
                "description": "Get daily order count and sales trend.",
                "parameters": {"days": "integer, optional, default 7"},
                "permission": "merchant:data:read"
            },
            {
                "name": "get_dish_ranking",
                "description": "Get dish ranking by recorded sales count.",
                "parameters": {"limit": "integer, optional, default 10"},
                "permission": "merchant:dish:read"
            },
            {
                "name": "get_member_summary",
                "description": "Get member count, value, and level distribution.",
                "parameters": {},
                "permission": "merchant:member:read"
            },
            {
                "name": "get_inventory_alerts",
                "description": "Get inventory items at or below minimum stock.",
                "parameters": {},
                "permission": "merchant:inventory:read"
            },
            {
                "name": "get_pos_summary",
                "description": "Get POS order count, paid amount, and average order value.",
                "parameters": {"days": "integer, optional, default 7"},
                "permission": "merchant:data:read"
            },
            {
                "name": "get_table_summary",
                "description": "Get restaurant table status and active dine-in sessions.",
                "parameters": {},
                "permission": "merchant:data:read"
            },
            {
                "name": "get_payment_summary",
                "description": "Get successful payment, refund, net amount, and reconciliation variance metrics.",
                "parameters": {"days": "integer, optional, default 7"},
                "permission": "merchant:data:read"
            },
            {
                "name": "get_advanced_summary",
                "description": "Get kitchen, purchase, coupon, delivery, and risk metrics from advanced restaurant modules.",
                "parameters": {},
                "permission": "merchant:data:read"
            },
            {
                "name": "create_action_card_draft",
                "description": "Create an AI action-card draft only. It does not start execution.",
                "parameters": {
                    "title": "string, required",
                    "problem": "string, optional",
                    "evidence": "array, optional",
                    "suggested_action": "object, required",
                    "priority": "high|medium|low, optional",
                    "data_range": "string, optional",
                    "expected_impact": "string, optional"
                },
                "permission": "merchant:ai:write"
            },
            {
                "name": "create_task_after_confirm",
                "description": "Move an action-card draft into todo status after explicit user confirmation.",
                "parameters": {
                    "card_id": "uuid string, required",
                    "confirmed": "boolean, must be true",
                    "assignee": "string, optional",
                    "due_date": "string, optional"
                },
                "permission": "merchant:ai:write"
            }
        ]

    @classmethod
    def execute(cls, db: Session, merchant_id: str, tool_name: str, parameters: Dict[str, Any] = None):
        parameters = parameters or {}
        tools: Dict[str, Callable[[Session, str, Dict[str, Any]], Dict[str, Any]]] = {
            "get_sales_summary": cls.get_sales_summary,
            "get_order_trend": cls.get_order_trend,
            "get_dish_ranking": cls.get_dish_ranking,
            "get_member_summary": cls.get_member_summary,
            "get_inventory_alerts": cls.get_inventory_alerts,
            "get_pos_summary": cls.get_pos_summary,
            "get_table_summary": cls.get_table_summary,
            "get_payment_summary": cls.get_payment_summary,
            "get_advanced_summary": cls.get_advanced_summary,
            "create_action_card_draft": cls.create_action_card_draft,
            "create_task_after_confirm": cls.create_task_after_confirm
        }
        if tool_name not in tools:
            raise ValueError(f"Unknown AI tool: {tool_name}")
        if not cls.has_permission(merchant_id, tool_name):
            raise PermissionError(f"Permission denied for AI tool: {tool_name}")
        return tools[tool_name](db, merchant_id, parameters)

    @classmethod
    def has_permission(cls, merchant_id: str, tool_name: str):
        # Current auth model scopes every request to the authenticated merchant.
        # This explicit check keeps a single permission gate for future RBAC.
        return bool(merchant_id) and tool_name in cls.TOOL_PERMISSIONS

    @staticmethod
    def _store_ids(db: Session, merchant_id: str):
        stores = db.query(Store).filter(Store.merchant_id == merchant_id).all()
        return [store.id for store in stores]

    @staticmethod
    def _safe_days(parameters: Dict[str, Any], default: int = 7):
        try:
            days = int(parameters.get("days", default))
        except (TypeError, ValueError):
            days = default
        return max(1, min(days, 90))

    @classmethod
    def get_sales_summary(cls, db: Session, merchant_id: str, parameters: Dict[str, Any]):
        store_ids = cls._store_ids(db, merchant_id)
        if not store_ids:
            return {"store_count": 0, "order_count": 0, "sales": 0, "average_order_value": 0}

        days = cls._safe_days(parameters)
        start = datetime.now() - timedelta(days=days - 1)
        orders = db.query(Order).filter(Order.store_id.in_(store_ids), Order.created_at >= start).all()
        sales = float(sum(order.total_amount or 0 for order in orders))
        return {
            "store_count": len(store_ids),
            "days": days,
            "order_count": len(orders),
            "sales": sales,
            "average_order_value": round(sales / len(orders), 2) if orders else 0
        }

    @classmethod
    def get_order_trend(cls, db: Session, merchant_id: str, parameters: Dict[str, Any]):
        store_ids = cls._store_ids(db, merchant_id)
        days = cls._safe_days(parameters)
        start = datetime.now() - timedelta(days=days - 1)
        buckets = defaultdict(lambda: {"orders": 0, "sales": 0})

        if store_ids:
            orders = db.query(Order).filter(Order.store_id.in_(store_ids), Order.created_at >= start).all()
            for order in orders:
                day = order.created_at.date().isoformat()
                buckets[day]["orders"] += 1
                buckets[day]["sales"] += float(order.total_amount or 0)

        trend = []
        for offset in range(days):
            day = (start + timedelta(days=offset)).date().isoformat()
            trend.append({"date": day, **buckets[day]})
        return {"days": days, "trend": trend}

    @classmethod
    def get_dish_ranking(cls, db: Session, merchant_id: str, parameters: Dict[str, Any]):
        store_ids = cls._store_ids(db, merchant_id)
        try:
            limit = int(parameters.get("limit", 10))
        except (TypeError, ValueError):
            limit = 10
        limit = max(1, min(limit, 50))

        dishes = []
        if store_ids:
            dishes = db.query(Dish).filter(Dish.store_id.in_(store_ids)).order_by(Dish.sales_count.desc()).limit(limit).all()

        return {
            "limit": limit,
            "rankings": [
                {
                    "id": str(dish.id),
                    "name": dish.name,
                    "price": dish.price,
                    "sales_count": dish.sales_count or 0
                }
                for dish in dishes
            ]
        }

    @classmethod
    def get_member_summary(cls, db: Session, merchant_id: str, parameters: Dict[str, Any]):
        store_ids = cls._store_ids(db, merchant_id)
        members = db.query(Member).filter(Member.store_id.in_(store_ids)).all() if store_ids else []
        level_distribution = defaultdict(int)
        total_spent = 0
        for member in members:
            level_distribution[str(member.level or 1)] += 1
            total_spent += member.total_spent or 0
        return {
            "member_count": len(members),
            "total_spent": float(total_spent),
            "average_spent": round(total_spent / len(members), 2) if members else 0,
            "level_distribution": dict(level_distribution)
        }

    @classmethod
    def get_inventory_alerts(cls, db: Session, merchant_id: str, parameters: Dict[str, Any]):
        store_ids = cls._store_ids(db, merchant_id)
        inventory_items = db.query(Inventory).filter(Inventory.store_id.in_(store_ids)).all() if store_ids else []
        alerts = []
        for item in inventory_items:
            if item.quantity is not None and item.min_stock is not None and item.quantity <= item.min_stock:
                alerts.append({
                    "id": str(item.id),
                    "dish_id": str(item.dish_id),
                    "quantity": item.quantity,
                    "min_stock": item.min_stock,
                    "unit": item.unit
                })
        return {"alert_count": len(alerts), "alerts": alerts}

    @classmethod
    def get_pos_summary(cls, db: Session, merchant_id: str, parameters: Dict[str, Any]):
        store_ids = cls._store_ids(db, merchant_id)
        days = cls._safe_days(parameters)
        start = datetime.now() - timedelta(days=days - 1)
        if not store_ids:
            return {"days": days, "order_count": 0, "paid_order_count": 0, "paid_amount": 0, "average_order_value": 0}

        try:
            orders = db.query(POSOrder).filter(
                POSOrder.merchant_id == merchant_id,
                POSOrder.store_id.in_(store_ids),
                POSOrder.created_at >= start,
                POSOrder.status != PosOrderStatus.CANCELLED.value
            ).all()
        except SQLAlchemyError:
            db.rollback()
            return {
                "days": days,
                "order_count": 0,
                "paid_order_count": 0,
                "paid_amount": 0,
                "average_order_value": 0,
                "fallback": "POS 数据暂不可用，已返回空指标。"
            }

        paid_statuses = {
            PosOrderStatus.PAID.value,
            PosOrderStatus.REFUNDED.value,
            PosOrderStatus.PARTIALLY_REFUNDED.value,
        }
        paid_orders = [order for order in orders if order.status in paid_statuses]
        paid_amount = sum(max((order.paid_amount or order.payable_amount or 0) - (order.refunded_amount or 0), 0) for order in paid_orders)
        return {
            "days": days,
            "order_count": len(orders),
            "paid_order_count": len(paid_orders),
            "paid_amount": round(paid_amount / 100, 2),
            "average_order_value": round(paid_amount / len(paid_orders) / 100, 2) if paid_orders else 0,
            "pending_order_count": len([order for order in orders if order.status == PosOrderStatus.PENDING_PAYMENT.value]),
            "suspended_order_count": len([order for order in orders if order.status == PosOrderStatus.SUSPENDED.value])
        }

    @classmethod
    def get_table_summary(cls, db: Session, merchant_id: str, parameters: Dict[str, Any]):
        store_ids = cls._store_ids(db, merchant_id)
        if not store_ids:
            return {"table_count": 0, "occupied_count": 0, "available_count": 0, "active_session_count": 0}

        try:
            tables = db.query(RestaurantTable).filter(
                RestaurantTable.merchant_id == merchant_id,
                RestaurantTable.store_id.in_(store_ids)
            ).all()
            active_sessions = db.query(TableSession).filter(
                TableSession.merchant_id == merchant_id,
                TableSession.store_id.in_(store_ids),
                TableSession.status == TableSessionStatus.OPEN.value
            ).all()
        except SQLAlchemyError:
            db.rollback()
            return {
                "table_count": 0,
                "occupied_count": 0,
                "available_count": 0,
                "active_session_count": 0,
                "fallback": "桌台数据暂不可用，已返回空指标。"
            }

        occupied_count = len([table for table in tables if table.status == TableStatus.OCCUPIED.value])
        available_count = len([table for table in tables if table.status == TableStatus.AVAILABLE.value])
        return {
            "table_count": len(tables),
            "occupied_count": occupied_count,
            "available_count": available_count,
            "active_session_count": len(active_sessions),
            "occupancy_rate": round(occupied_count / len(tables), 4) if tables else 0
        }

    @classmethod
    def get_payment_summary(cls, db: Session, merchant_id: str, parameters: Dict[str, Any]):
        store_ids = cls._store_ids(db, merchant_id)
        days = cls._safe_days(parameters)
        start = datetime.now() - timedelta(days=days - 1)
        if not store_ids:
            return {"days": days, "payment_count": 0, "payment_amount": 0, "refund_amount": 0, "net_amount": 0}

        try:
            payments = db.query(PaymentTransaction).filter(
                PaymentTransaction.merchant_id == merchant_id,
                PaymentTransaction.store_id.in_(store_ids),
                PaymentTransaction.status == PaymentStatus.SUCCESS.value,
                PaymentTransaction.paid_at >= start
            ).all()
            refunds = db.query(RefundTransaction).filter(
                RefundTransaction.merchant_id == merchant_id,
                RefundTransaction.store_id.in_(store_ids),
                RefundTransaction.status == RefundStatus.SUCCESS.value,
                RefundTransaction.refunded_at >= start
            ).all()
            reconciliations = db.query(DailyReconciliation).filter(
                DailyReconciliation.merchant_id == merchant_id,
                DailyReconciliation.store_id.in_(store_ids),
                DailyReconciliation.reconciliation_date >= start.date()
            ).all()
        except SQLAlchemyError:
            db.rollback()
            return {
                "days": days,
                "payment_count": 0,
                "payment_amount": 0,
                "refund_amount": 0,
                "net_amount": 0,
                "fallback": "支付或对账数据暂不可用，已返回空指标。"
            }

        payment_amount = sum(payment.amount or 0 for payment in payments)
        refund_amount = sum(refund.amount or 0 for refund in refunds)
        variance_amount = sum(abs(item.variance_amount or 0) for item in reconciliations)
        return {
            "days": days,
            "payment_count": len(payments),
            "payment_amount": round(payment_amount / 100, 2),
            "refund_count": len(refunds),
            "refund_amount": round(refund_amount / 100, 2),
            "net_amount": round((payment_amount - refund_amount) / 100, 2),
            "reconciliation_count": len(reconciliations),
            "variance_count": len([item for item in reconciliations if item.status == ReconciliationStatus.HAS_VARIANCE.value or (item.variance_amount or 0) != 0]),
            "variance_amount": round(variance_amount / 100, 2)
        }

    @classmethod
    def get_advanced_summary(cls, db: Session, merchant_id: str, parameters: Dict[str, Any]):
        try:
            summary = AdvancedService.advanced_summary(db, merchant_id)
        except SQLAlchemyError:
            db.rollback()
            return {
                "kitchen_pending": 0,
                "purchase_cost_today": 0,
                "coupon_redeemed": 0,
                "delivery_orders": 0,
                "open_risks": 0,
                "fallback": "高级餐饮模块数据暂不可用，已返回空指标。"
            }

        return {
            "kitchen_pending": summary.get("kitchen_pending", 0),
            "purchase_cost_today": round((summary.get("purchase_cost_today", 0) or 0) / 100, 2),
            "coupon_redeemed": summary.get("coupon_redeemed", 0),
            "delivery_orders": summary.get("delivery_orders", 0),
            "open_risks": summary.get("open_risks", 0)
        }

    @classmethod
    def create_action_card_draft(cls, db: Session, merchant_id: str, parameters: Dict[str, Any]):
        title = str(parameters.get("title") or "").strip()
        suggested_action = parameters.get("suggested_action") or {}
        if not title:
            raise ValueError("title is required")
        if not isinstance(suggested_action, dict) or not suggested_action.get("title"):
            raise ValueError("suggested_action.title is required")

        priority = str(parameters.get("priority") or suggested_action.get("priority") or "medium")
        if priority not in {"high", "medium", "low"}:
            priority = "medium"

        card = AIActionCard(
            id=uuid.uuid4(),
            merchant_id=merchant_id,
            title=title,
            problem=parameters.get("problem"),
            evidence=parameters.get("evidence") or [],
            suggested_action=suggested_action,
            priority=priority,
            status="draft",
            data_range=parameters.get("data_range"),
            expected_impact=parameters.get("expected_impact") or suggested_action.get("expected_impact"),
            source=parameters.get("source") or "ai_tool"
        )
        db.add(card)
        db.commit()
        db.refresh(card)
        return {
            "id": str(card.id),
            "title": card.title,
            "status": card.status,
            "requires_confirmation": True
        }

    @classmethod
    def create_task_after_confirm(cls, db: Session, merchant_id: str, parameters: Dict[str, Any]):
        if parameters.get("confirmed") is not True:
            raise ValueError("confirmed=true is required before creating a task")

        card_id = parameters.get("card_id")
        if not card_id:
            raise ValueError("card_id is required")

        card = db.query(AIActionCard).filter(
            AIActionCard.id == uuid.UUID(str(card_id)),
            AIActionCard.merchant_id == merchant_id
        ).first()
        if not card:
            raise ValueError("action card not found")
        if card.status not in {"draft", "todo"}:
            raise ValueError("only draft action cards can be turned into tasks")

        card.status = "todo"
        if parameters.get("assignee"):
            card.assignee = str(parameters.get("assignee"))
        if parameters.get("due_date"):
            card.due_date = str(parameters.get("due_date"))
        card.review_result = {
            **(card.review_result or {}),
            "task_confirmation": {
                "confirmed": True,
                "confirmed_at": datetime.now().isoformat(timespec="seconds")
            }
        }
        db.commit()
        db.refresh(card)
        return {
            "id": str(card.id),
            "title": card.title,
            "status": card.status,
            "assignee": card.assignee,
            "due_date": card.due_date
        }
