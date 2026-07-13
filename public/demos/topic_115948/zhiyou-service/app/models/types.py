"""跨数据库兼容类型"""
import uuid
import json
from sqlalchemy import String, TypeDecorator
from sqlalchemy.dialects.postgresql import UUID, JSONB


class Guid(TypeDecorator):
    """跨数据库 UUID 类型"""
    impl = String(36)
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        if dialect.name == "postgresql":
            return value if isinstance(value, uuid.UUID) else uuid.UUID(str(value))
        return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        if isinstance(value, uuid.UUID):
            return value
        return uuid.UUID(str(value)) if value else None


class Json(TypeDecorator):
    """跨数据库 JSON 类型"""
    impl = String(65535)
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        return json.dumps(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        if isinstance(value, str):
            return json.loads(value)
        return value
