from datetime import date, datetime, time, timedelta
import uuid
from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.enums import PaymentChannel, PaymentStatus, ReconciliationStatus, RefundStatus
from app.core.scoping import apply_merchant_scope, apply_store_scope, require_merchant_id, to_uuid, validate_store_scope
from app.models.payment import DailyReconciliation, PaymentTransaction, ReconciliationVariance, RefundTransaction


class ReconciliationService:
    @staticmethod
    def _validate_channel(channel: Optional[str]) -> Optional[str]:
        if channel is None:
            return None
        if channel not in {item.value for item in PaymentChannel}:
            raise ValueError("无效的支付渠道")
        return channel

    @staticmethod
    def _day_range(target_date: date) -> tuple[datetime, datetime]:
        start = datetime.combine(target_date, time.min)
        return start, start + timedelta(days=1)

    @staticmethod
    def _empty_summary(merchant_id, store_id, target_date: date, channel: str) -> dict:
        return {
            "merchant_id": str(merchant_id),
            "store_id": str(store_id),
            "reconciliation_date": target_date,
            "channel": channel,
            "payment_amount": 0,
            "payment_count": 0,
            "refund_amount": 0,
            "refund_count": 0,
            "net_amount": 0,
            "variance_amount": 0,
            "status": ReconciliationStatus.DRAFT.value,
        }

    @staticmethod
    def aggregate_daily(
        db: Session,
        merchant_id,
        target_date: date,
        store_id: Optional[str] = None,
        channel: Optional[str] = None,
    ) -> list[dict]:
        merchant_uuid = require_merchant_id(merchant_id)
        store_uuid = validate_store_scope(db, merchant_uuid, store_id) if store_id else None
        channel = ReconciliationService._validate_channel(channel)
        start, end = ReconciliationService._day_range(target_date)

        payment_query = apply_merchant_scope(db.query(PaymentTransaction), PaymentTransaction, merchant_uuid)
        payment_query = apply_store_scope(payment_query, PaymentTransaction, store_uuid)
        payment_query = payment_query.filter(
            PaymentTransaction.status.in_(
                [
                    PaymentStatus.SUCCESS.value,
                    PaymentStatus.PARTIALLY_REFUNDED.value,
                    PaymentStatus.REFUNDED.value,
                ]
            ),
            PaymentTransaction.paid_at >= start,
            PaymentTransaction.paid_at < end,
        )
        if channel:
            payment_query = payment_query.filter(PaymentTransaction.channel == channel)
        payment_rows = (
            payment_query.with_entities(
                PaymentTransaction.store_id,
                PaymentTransaction.channel,
                func.coalesce(func.sum(PaymentTransaction.amount), 0),
                func.count(PaymentTransaction.id),
            )
            .group_by(PaymentTransaction.store_id, PaymentTransaction.channel)
            .all()
        )

        refund_query = apply_merchant_scope(db.query(RefundTransaction), RefundTransaction, merchant_uuid)
        refund_query = apply_store_scope(refund_query, RefundTransaction, store_uuid)
        refund_query = refund_query.filter(
            RefundTransaction.status == RefundStatus.SUCCESS.value,
            RefundTransaction.refunded_at >= start,
            RefundTransaction.refunded_at < end,
        )
        if channel:
            refund_query = refund_query.filter(RefundTransaction.channel == channel)
        refund_rows = (
            refund_query.with_entities(
                RefundTransaction.store_id,
                RefundTransaction.channel,
                func.coalesce(func.sum(RefundTransaction.amount), 0),
                func.count(RefundTransaction.id),
            )
            .group_by(RefundTransaction.store_id, RefundTransaction.channel)
            .all()
        )

        summary_map: dict[tuple[uuid.UUID, str], dict] = {}
        for row_store_id, row_channel, amount, count in payment_rows:
            key = (row_store_id, row_channel)
            summary_map[key] = ReconciliationService._empty_summary(merchant_uuid, row_store_id, target_date, row_channel)
            summary_map[key]["payment_amount"] = int(amount or 0)
            summary_map[key]["payment_count"] = int(count or 0)
        for row_store_id, row_channel, amount, count in refund_rows:
            key = (row_store_id, row_channel)
            if key not in summary_map:
                summary_map[key] = ReconciliationService._empty_summary(merchant_uuid, row_store_id, target_date, row_channel)
            summary_map[key]["refund_amount"] = int(amount or 0)
            summary_map[key]["refund_count"] = int(count or 0)
        for item in summary_map.values():
            item["net_amount"] = item["payment_amount"] - item["refund_amount"]

        if store_uuid and channel and not summary_map:
            summary_map[(store_uuid, channel)] = ReconciliationService._empty_summary(merchant_uuid, store_uuid, target_date, channel)
        return sorted(summary_map.values(), key=lambda item: (item["store_id"], item["channel"]))

    @staticmethod
    def generate_daily(
        db: Session,
        merchant_id,
        target_date: date,
        store_id: Optional[str] = None,
        channel: Optional[str] = None,
    ) -> list[DailyReconciliation]:
        merchant_uuid = require_merchant_id(merchant_id)
        summaries = ReconciliationService.aggregate_daily(db, merchant_uuid, target_date, store_id, channel)
        records: list[DailyReconciliation] = []
        for item in summaries:
            record = (
                apply_merchant_scope(db.query(DailyReconciliation), DailyReconciliation, merchant_uuid)
                .filter(
                    DailyReconciliation.store_id == to_uuid(item["store_id"], "门店ID"),
                    DailyReconciliation.reconciliation_date == target_date,
                    DailyReconciliation.channel == item["channel"],
                )
                .first()
            )
            if not record:
                record = DailyReconciliation(
                    id=uuid.uuid4(),
                    merchant_id=merchant_uuid,
                    store_id=to_uuid(item["store_id"], "门店ID"),
                    reconciliation_date=target_date,
                    channel=item["channel"],
                )
                db.add(record)
            record.payment_amount = item["payment_amount"]
            record.payment_count = item["payment_count"]
            record.refund_amount = item["refund_amount"]
            record.refund_count = item["refund_count"]
            record.net_amount = item["net_amount"]
            record.variance_amount = item.get("variance_amount", 0)
            record.status = item.get("status", ReconciliationStatus.DRAFT.value)
            record.generated_at = datetime.utcnow()
            records.append(record)
        db.commit()
        for record in records:
            db.refresh(record)
        return records

    @staticmethod
    def list_daily_records(
        db: Session,
        merchant_id,
        target_date: Optional[date] = None,
        store_id: Optional[str] = None,
        channel: Optional[str] = None,
    ) -> list[DailyReconciliation]:
        query = apply_merchant_scope(db.query(DailyReconciliation), DailyReconciliation, merchant_id)
        query = apply_store_scope(query, DailyReconciliation, store_id)
        if target_date:
            query = query.filter(DailyReconciliation.reconciliation_date == target_date)
        if channel:
            query = query.filter(DailyReconciliation.channel == ReconciliationService._validate_channel(channel))
        return query.order_by(DailyReconciliation.reconciliation_date.desc(), DailyReconciliation.channel.asc()).all()

    @staticmethod
    def list_variances(
        db: Session,
        merchant_id,
        store_id: Optional[str] = None,
        reconciliation_id: Optional[str] = None,
        status: Optional[str] = None,
    ) -> list[ReconciliationVariance]:
        query = apply_merchant_scope(db.query(ReconciliationVariance), ReconciliationVariance, merchant_id)
        query = apply_store_scope(query, ReconciliationVariance, store_id)
        if reconciliation_id:
            query = query.filter(ReconciliationVariance.reconciliation_id == to_uuid(reconciliation_id, "日对账ID"))
        if status:
            query = query.filter(ReconciliationVariance.status == status)
        return query.order_by(ReconciliationVariance.created_at.desc()).all()
