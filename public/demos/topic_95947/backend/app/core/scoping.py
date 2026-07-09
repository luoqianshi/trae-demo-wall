import uuid
from typing import Any, Optional

from sqlalchemy import Column, ForeignKey, UUID
from sqlalchemy.orm import Session, declared_attr


class MerchantScopedMixin:
    """商户级数据隔离字段，供后续 P0 新模型复用。"""

    @declared_attr
    def merchant_id(cls):
        return Column(UUID(as_uuid=True), ForeignKey("merchants.id"), nullable=False, index=True)


class StoreScopedMixin(MerchantScopedMixin):
    """门店级数据隔离字段，显式保留 merchant_id 以降低跨店关联风险。"""

    @declared_attr
    def store_id(cls):
        return Column(UUID(as_uuid=True), ForeignKey("stores.id"), nullable=False, index=True)


def to_uuid(value: Any, field_name: str = "ID") -> uuid.UUID:
    """将外部输入统一转换为 UUID。"""

    try:
        return value if isinstance(value, uuid.UUID) else uuid.UUID(str(value))
    except (TypeError, ValueError, AttributeError):
        raise ValueError(f"无效的{field_name}")


def require_merchant_id(merchant_id: Any) -> uuid.UUID:
    """要求请求上下文必须带有商户身份。"""

    if not merchant_id:
        raise ValueError("缺少商户范围")
    return to_uuid(merchant_id, "商户ID")


def require_store_id(store_id: Any) -> uuid.UUID:
    """要求请求上下文必须带有门店身份。"""

    if not store_id:
        raise ValueError("缺少门店范围")
    return to_uuid(store_id, "门店ID")


def apply_merchant_scope(query, model, merchant_id: Any):
    """为包含 merchant_id 字段的查询追加商户隔离条件。"""

    merchant_uuid = require_merchant_id(merchant_id)
    if not hasattr(model, "merchant_id"):
        raise ValueError(f"{model.__name__} 未声明 merchant_id，无法执行商户隔离")
    return query.filter(model.merchant_id == merchant_uuid)


def apply_store_scope(query, model, store_id: Optional[Any] = None):
    """为包含 store_id 字段的查询追加门店过滤条件。"""

    if store_id is None:
        return query
    if not hasattr(model, "store_id"):
        raise ValueError(f"{model.__name__} 未声明 store_id，无法执行门店过滤")
    return query.filter(model.store_id == require_store_id(store_id))


def validate_store_scope(db: Session, merchant_id: Any, store_id: Any) -> uuid.UUID:
    """校验门店是否属于当前商户，并返回规范化后的门店 UUID。"""

    from app.models.merchant import Store

    merchant_uuid = require_merchant_id(merchant_id)
    store_uuid = require_store_id(store_id)
    store = (
        db.query(Store)
        .filter(Store.id == store_uuid, Store.merchant_id == merchant_uuid)
        .first()
    )
    if not store:
        raise ValueError("门店不存在或无权访问")
    return store_uuid
