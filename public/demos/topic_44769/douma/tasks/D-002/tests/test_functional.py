"""功能测试：含 paid->cancel 在内的全部合法转移都必须被允许并返回正确目标。"""
import pytest
from solution import OrderStateMachine


def test_all_legal_transitions():
    m = OrderStateMachine()
    legal = [
        ("pending", "pay", "paid"),
        ("pending", "cancel", "cancelled"),
        ("paid", "ship", "shipped"),
        ("paid", "cancel", "cancelled"),   # 已支付未发货取消：本题考点
        ("shipped", "deliver", "delivered"),
    ]
    for state, event, target in legal:
        assert m.can(state, event) is True, f"{state}--{event} 应合法"
        assert m.apply(state, event) == target, f"{state}--{event} 应到 {target}"


def test_paid_then_cancel_flow():
    m = OrderStateMachine()
    # 下单 -> 支付 -> 取消（退款），最终为 cancelled
    assert m.run(["pay", "cancel"]) == "cancelled"
