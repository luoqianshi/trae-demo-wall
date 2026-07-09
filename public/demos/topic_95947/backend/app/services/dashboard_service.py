from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from app.models.merchant import Store, Order, Member
from app.models.payment import PaymentTransaction, RefundTransaction
from app.models.pos import POSOrder
from app.schemas.dashboard import SalesSummary, RevenueTrend, CustomerAnalysis, PeakHourData, DashboardResponse
from datetime import datetime, timedelta
from typing import List
from app.core.enums import PaymentStatus, PosOrderStatus, RefundStatus

class DashboardService:
    @staticmethod
    def _legacy_orders(db: Session, store_ids: list, start: datetime, end: datetime = None):
        if not store_ids:
            return []
        query = db.query(Order).filter(
            Order.store_id.in_(store_ids),
            Order.created_at >= start
        )
        if end:
            query = query.filter(Order.created_at < end)
        return query.all()

    @staticmethod
    def _restaurant_metrics(db: Session, merchant_id: str, store_ids: list, start: datetime, end: datetime = None):
        """优先使用支付净收款，其次使用 POS 已收金额；表不存在或无数据时返回空指标。"""
        empty = {"orders": None, "sales_cents": None, "source": "legacy"}
        if not store_ids:
            return empty

        try:
            payment_query = db.query(PaymentTransaction).filter(
                PaymentTransaction.merchant_id == merchant_id,
                PaymentTransaction.store_id.in_(store_ids),
                PaymentTransaction.status == PaymentStatus.SUCCESS.value,
                PaymentTransaction.paid_at >= start
            )
            refund_query = db.query(RefundTransaction).filter(
                RefundTransaction.merchant_id == merchant_id,
                RefundTransaction.store_id.in_(store_ids),
                RefundTransaction.status == RefundStatus.SUCCESS.value,
                RefundTransaction.refunded_at >= start
            )
            pos_query = db.query(POSOrder).filter(
                POSOrder.merchant_id == merchant_id,
                POSOrder.store_id.in_(store_ids),
                POSOrder.created_at >= start,
                POSOrder.status != PosOrderStatus.CANCELLED.value
            )
            if end:
                payment_query = payment_query.filter(PaymentTransaction.paid_at < end)
                refund_query = refund_query.filter(RefundTransaction.refunded_at < end)
                pos_query = pos_query.filter(POSOrder.created_at < end)

            payments = payment_query.all()
            refunds = refund_query.all()
            pos_orders = pos_query.all()

            if payments:
                paid_order_ids = {payment.order_id for payment in payments}
                sales_cents = sum(payment.amount or 0 for payment in payments) - sum(refund.amount or 0 for refund in refunds)
                return {
                    "orders": len(paid_order_ids),
                    "sales_cents": max(sales_cents, 0),
                    "source": "payment"
                }

            if pos_orders:
                sales_cents = sum(
                    ((order.paid_amount or 0) - (order.refunded_amount or 0))
                    if (order.paid_amount or 0) > 0
                    else (order.payable_amount or 0)
                    for order in pos_orders
                    if order.status in {
                        PosOrderStatus.PAID.value,
                        PosOrderStatus.REFUNDED.value,
                        PosOrderStatus.PARTIALLY_REFUNDED.value,
                    }
                )
                return {
                    "orders": len(pos_orders),
                    "sales_cents": max(sales_cents, 0),
                    "source": "pos"
                }
        except SQLAlchemyError:
            db.rollback()

        return empty

    @staticmethod
    def _business_metrics(db: Session, merchant_id: str, store_ids: list, start: datetime, end: datetime = None):
        restaurant = DashboardService._restaurant_metrics(db, merchant_id, store_ids, start, end)
        if restaurant["orders"] is not None and restaurant["sales_cents"] is not None:
            return restaurant

        legacy_orders = DashboardService._legacy_orders(db, store_ids, start, end)
        return {
            "orders": len(legacy_orders),
            "sales_cents": sum(order.total_amount or 0 for order in legacy_orders),
            "source": "legacy"
        }

    @staticmethod
    def get_dashboard_data(db: Session, merchant_id: str) -> DashboardResponse:
        stores = db.query(Store).filter(Store.merchant_id == merchant_id).all()
        store_ids = [store.id for store in stores]
        
        today = datetime.now().date()
        week_start = today - timedelta(days=today.weekday())
        month_start = today.replace(day=1)
        
        today_start = datetime(today.year, today.month, today.day)
        week_start_at = datetime(week_start.year, week_start.month, week_start.day)
        month_start_at = datetime(month_start.year, month_start.month, month_start.day)

        today_metrics = DashboardService._business_metrics(db, merchant_id, store_ids, today_start)
        week_metrics = DashboardService._business_metrics(db, merchant_id, store_ids, week_start_at)
        month_metrics = DashboardService._business_metrics(db, merchant_id, store_ids, month_start_at)

        today_sales = today_metrics["sales_cents"]
        week_sales = week_metrics["sales_cents"]
        month_sales = month_metrics["sales_cents"]
        today_order_count = today_metrics["orders"]
        
        sales_summary = SalesSummary(
            today_sales=today_sales / 100 if today_sales else 0,
            week_sales=week_sales / 100 if week_sales else 0,
            month_sales=month_sales / 100 if month_sales else 0,
            today_orders=today_order_count,
            week_orders=week_metrics["orders"],
            month_orders=month_metrics["orders"],
            avg_order_value=(today_sales / today_order_count / 100) if today_order_count else 0,
            conversion_rate=0.15
        )
        
        revenue_trend = []
        for i in range(7):
            date = today - timedelta(days=i)
            date_start = datetime(date.year, date.month, date.day)
            daily_metrics = DashboardService._business_metrics(
                db,
                merchant_id,
                store_ids,
                date_start,
                date_start + timedelta(days=1)
            )
            revenue_trend.append(RevenueTrend(
                date=date.strftime("%m-%d"),
                sales=daily_metrics["sales_cents"] / 100 if daily_metrics["sales_cents"] else 0,
                orders=daily_metrics["orders"]
            ))
        revenue_trend.reverse()
        
        members = db.query(Member).filter(Member.store_id.in_(store_ids)).all()
        customer_analysis = CustomerAnalysis(
            new_customers=len([m for m in members if m.created_at >= datetime(today.year, today.month, today.day)]),
            returning_customers=0,
            customer_retention_rate=0.72,
            avg_visit_frequency=2.3
        )
        
        peak_hours = []
        for hour in range(9, 22):
            hour_start = datetime(today.year, today.month, today.day, hour, 0, 0)
            hourly_metrics = DashboardService._business_metrics(
                db,
                merchant_id,
                store_ids,
                hour_start,
                hour_start + timedelta(hours=1)
            )
            peak_hours.append(PeakHourData(
                hour=f"{hour}:00",
                count=hourly_metrics["orders"]
            ))
        
        return DashboardResponse(
            sales_summary=sales_summary,
            revenue_trend=revenue_trend,
            customer_analysis=customer_analysis,
            peak_hours=peak_hours
        )
    
    @staticmethod
    def get_sales_summary(db: Session, merchant_id: str) -> SalesSummary:
        stores = db.query(Store).filter(Store.merchant_id == merchant_id).all()
        store_ids = [store.id for store in stores]
        
        today = datetime.now().date()
        week_start = today - timedelta(days=today.weekday())
        month_start = today.replace(day=1)
        
        today_start = datetime(today.year, today.month, today.day)
        today_metrics = DashboardService._business_metrics(db, merchant_id, store_ids, today_start)
        week_metrics = DashboardService._business_metrics(
            db, merchant_id, store_ids, datetime(week_start.year, week_start.month, week_start.day)
        )
        month_metrics = DashboardService._business_metrics(
            db, merchant_id, store_ids, datetime(month_start.year, month_start.month, month_start.day)
        )
        
        return SalesSummary(
            today_sales=today_metrics["sales_cents"] / 100 if today_metrics["sales_cents"] else 0,
            week_sales=week_metrics["sales_cents"] / 100 if week_metrics["sales_cents"] else 0,
            month_sales=month_metrics["sales_cents"] / 100 if month_metrics["sales_cents"] else 0,
            today_orders=today_metrics["orders"],
            week_orders=week_metrics["orders"],
            month_orders=month_metrics["orders"],
            avg_order_value=(today_metrics["sales_cents"] / today_metrics["orders"] / 100) if today_metrics["orders"] else 0,
            conversion_rate=0.15
        )
    
    @staticmethod
    def get_revenue_trend(db: Session, merchant_id: str, days: int = 7) -> List[RevenueTrend]:
        stores = db.query(Store).filter(Store.merchant_id == merchant_id).all()
        store_ids = [store.id for store in stores]
        
        today = datetime.now().date()
        trend = []
        
        for i in range(days):
            date = today - timedelta(days=i)
            date_start = datetime(date.year, date.month, date.day)
            daily_metrics = DashboardService._business_metrics(
                db,
                merchant_id,
                store_ids,
                date_start,
                date_start + timedelta(days=1)
            )
            trend.append(RevenueTrend(
                date=date.strftime("%m-%d"),
                sales=daily_metrics["sales_cents"] / 100 if daily_metrics["sales_cents"] else 0,
                orders=daily_metrics["orders"]
            ))
        
        return trend[::-1]
