from app.core.enums import (
    EmployeeStatus,
    PaymentStatus,
    PosOrderStatus,
    RecordStatus,
    RefundStatus,
    ReconciliationStatus,
    TableSessionStatus,
    TableStatus,
)


RECORD_STATUS_LABELS = {
    RecordStatus.DISABLED: "停用",
    RecordStatus.ENABLED: "启用",
}

EMPLOYEE_STATUS_LABELS = {
    EmployeeStatus.DISABLED: "停用",
    EmployeeStatus.ACTIVE: "正常",
    EmployeeStatus.LOCKED: "锁定",
}

TABLE_STATUS_LABELS = {
    TableStatus.AVAILABLE: "空闲",
    TableStatus.OCCUPIED: "使用中",
    TableStatus.RESERVED: "已预订",
    TableStatus.CLEANING: "清洁中",
    TableStatus.DISABLED: "停用",
}

TABLE_SESSION_STATUS_LABELS = {
    TableSessionStatus.OPEN: "开台中",
    TableSessionStatus.LOCKED: "锁定",
    TableSessionStatus.CLOSED: "已清台",
    TableSessionStatus.CANCELLED: "已取消",
}

POS_ORDER_STATUS_LABELS = {
    PosOrderStatus.DRAFT: "草稿",
    PosOrderStatus.PENDING_PAYMENT: "待支付",
    PosOrderStatus.SUSPENDED: "挂单",
    PosOrderStatus.PAID: "已支付",
    PosOrderStatus.CANCELLED: "已取消",
    PosOrderStatus.REFUNDED: "已退款",
    PosOrderStatus.PARTIALLY_REFUNDED: "部分退款",
}

PAYMENT_STATUS_LABELS = {
    PaymentStatus.PENDING: "待确认",
    PaymentStatus.SUCCESS: "支付成功",
    PaymentStatus.FAILED: "支付失败",
    PaymentStatus.CANCELLED: "已取消",
    PaymentStatus.REFUNDED: "已退款",
    PaymentStatus.PARTIALLY_REFUNDED: "部分退款",
}

REFUND_STATUS_LABELS = {
    RefundStatus.PENDING: "待处理",
    RefundStatus.SUCCESS: "退款成功",
    RefundStatus.FAILED: "退款失败",
    RefundStatus.CANCELLED: "已取消",
}

RECONCILIATION_STATUS_LABELS = {
    ReconciliationStatus.DRAFT: "待对账",
    ReconciliationStatus.CONFIRMED: "已确认",
    ReconciliationStatus.HAS_VARIANCE: "存在差异",
    ReconciliationStatus.CLOSED: "已结账",
}

POS_ORDER_ALLOWED_TRANSITIONS = {
    PosOrderStatus.DRAFT: {
        PosOrderStatus.PENDING_PAYMENT,
        PosOrderStatus.SUSPENDED,
        PosOrderStatus.CANCELLED,
    },
    PosOrderStatus.SUSPENDED: {
        PosOrderStatus.PENDING_PAYMENT,
        PosOrderStatus.CANCELLED,
    },
    PosOrderStatus.PENDING_PAYMENT: {
        PosOrderStatus.PAID,
        PosOrderStatus.SUSPENDED,
        PosOrderStatus.CANCELLED,
    },
    PosOrderStatus.PAID: {
        PosOrderStatus.PARTIALLY_REFUNDED,
        PosOrderStatus.REFUNDED,
    },
    PosOrderStatus.PARTIALLY_REFUNDED: {
        PosOrderStatus.REFUNDED,
    },
    PosOrderStatus.CANCELLED: set(),
    PosOrderStatus.REFUNDED: set(),
}

TABLE_ALLOWED_TRANSITIONS = {
    TableStatus.AVAILABLE: {
        TableStatus.OCCUPIED,
        TableStatus.RESERVED,
        TableStatus.CLEANING,
        TableStatus.DISABLED,
    },
    TableStatus.OCCUPIED: {
        TableStatus.CLEANING,
        TableStatus.AVAILABLE,
    },
    TableStatus.RESERVED: {
        TableStatus.OCCUPIED,
        TableStatus.AVAILABLE,
    },
    TableStatus.CLEANING: {
        TableStatus.AVAILABLE,
        TableStatus.DISABLED,
    },
    TableStatus.DISABLED: {
        TableStatus.AVAILABLE,
    },
}


def get_status_label(label_map: dict, status, default: str = "未知") -> str:
    """从状态字典中获取中文标签，兼容枚举值与原始值。"""

    if status in label_map:
        return label_map[status]
    for key, label in label_map.items():
        if getattr(key, "value", key) == status:
            return label
    return default


def is_transition_allowed(transitions: dict, current_status, target_status) -> bool:
    """校验状态流转是否合法。"""

    return target_status in transitions.get(current_status, set())
