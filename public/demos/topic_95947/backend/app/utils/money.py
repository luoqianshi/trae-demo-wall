from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from typing import Iterable, Mapping


FEN_PER_YUAN = Decimal("100")
CENT_QUANT = Decimal("0.01")


def _to_decimal(value, field_name: str = "金额") -> Decimal:
    try:
        amount = Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError):
        raise ValueError(f"{field_name}格式不正确")
    if not amount.is_finite():
        raise ValueError(f"{field_name}格式不正确")
    return amount


def ensure_non_negative_amount(value, field_name: str = "金额") -> Decimal:
    """校验金额不能为负数。"""

    amount = _to_decimal(value, field_name)
    if amount < 0:
        raise ValueError(f"{field_name}不能小于0")
    return amount


def yuan_to_fen(value, field_name: str = "金额") -> int:
    """将元转换为分，按四舍五入保留到分。"""

    amount = ensure_non_negative_amount(value, field_name)
    return int((amount * FEN_PER_YUAN).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def fen_to_yuan(value, field_name: str = "金额") -> Decimal:
    """将分转换为元，返回 Decimal，避免浮点精度误差。"""

    amount = ensure_non_negative_amount(value, field_name)
    return (amount / FEN_PER_YUAN).quantize(CENT_QUANT, rounding=ROUND_HALF_UP)


def normalize_amount_fen(value, field_name: str = "金额") -> int:
    """规范化数据库金额字段，统一使用整数分。"""

    amount = ensure_non_negative_amount(value, field_name)
    if amount != amount.to_integral_value():
        raise ValueError(f"{field_name}必须为整数分")
    return int(amount)


def calculate_line_amount(unit_price_fen, quantity, discount_fen=0) -> int:
    """计算单行金额：单价分 * 数量 - 优惠分。"""

    price = normalize_amount_fen(unit_price_fen, "单价")
    qty = _to_decimal(quantity, "数量")
    if qty <= 0:
        raise ValueError("数量必须大于0")
    discount = normalize_amount_fen(discount_fen, "优惠金额")
    subtotal = (Decimal(price) * qty).quantize(Decimal("1"), rounding=ROUND_HALF_UP)
    total = int(subtotal) - discount
    if total < 0:
        raise ValueError("行项目金额不能小于0")
    return total


def calculate_order_amount(items: Iterable[Mapping], discount_fen=0, rounding_fen=0) -> int:
    """汇总订单金额，items 需包含 unit_price_fen 与 quantity。"""

    subtotal = 0
    for item in items:
        subtotal += calculate_line_amount(
            item.get("unit_price_fen", 0),
            item.get("quantity", 0),
            item.get("discount_fen", 0),
        )
    discount = normalize_amount_fen(discount_fen, "订单优惠金额")
    rounding = normalize_amount_fen(rounding_fen, "抹零金额")
    total = subtotal - discount - rounding
    if total < 0:
        raise ValueError("订单金额不能小于0")
    return total


def calculate_net_amount(received_fen, refund_fen=0) -> int:
    """计算净收款金额。"""

    received = normalize_amount_fen(received_fen, "收款金额")
    refund = normalize_amount_fen(refund_fen, "退款金额")
    net_amount = received - refund
    if net_amount < 0:
        raise ValueError("净收款金额不能小于0")
    return net_amount
