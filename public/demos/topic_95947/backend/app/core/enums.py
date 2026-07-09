from enum import Enum, IntEnum


class StrValueEnum(str, Enum):
    """字符串枚举基类，便于 API、Schema 与数据库状态值保持一致。"""

    def __str__(self) -> str:
        return self.value


class RecordStatus(IntEnum):
    """通用启停状态。"""

    DISABLED = 0
    ENABLED = 1


class EmployeeStatus(IntEnum):
    """员工账号状态。"""

    DISABLED = 0
    ACTIVE = 1
    LOCKED = 2


class PermissionAction(StrValueEnum):
    """权限动作枚举。"""

    READ = "read"
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"
    APPROVE = "approve"
    EXPORT = "export"


class TableStatus(StrValueEnum):
    """桌台当前状态。"""

    AVAILABLE = "available"
    OCCUPIED = "occupied"
    RESERVED = "reserved"
    CLEANING = "cleaning"
    DISABLED = "disabled"


class TableSessionStatus(StrValueEnum):
    """堂食开台会话状态。"""

    OPEN = "open"
    LOCKED = "locked"
    CLOSED = "closed"
    CANCELLED = "cancelled"


class PosOrderStatus(StrValueEnum):
    """POS 订单状态。"""

    DRAFT = "draft"
    PENDING_PAYMENT = "pending_payment"
    SUSPENDED = "suspended"
    PAID = "paid"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"
    PARTIALLY_REFUNDED = "partially_refunded"


class PaymentChannel(StrValueEnum):
    """支付渠道。"""

    CASH = "cash"
    WECHAT = "wechat"
    ALIPAY = "alipay"
    STORED_VALUE = "stored_value"
    BANK_CARD = "bank_card"
    OTHER = "other"


class PaymentStatus(StrValueEnum):
    """支付流水状态。"""

    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"
    PARTIALLY_REFUNDED = "partially_refunded"


class RefundStatus(StrValueEnum):
    """退款流水状态。"""

    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"
    CANCELLED = "cancelled"


class ReconciliationStatus(StrValueEnum):
    """日对账状态。"""

    DRAFT = "draft"
    CONFIRMED = "confirmed"
    HAS_VARIANCE = "has_variance"
    CLOSED = "closed"
