"""回归测试：标准主流程（不触发 paid->cancel 这条漏配的转移）的干净基线。"""
import pytest
from solution import OrderStateMachine


def test_happy_path_to_delivered():
    m = OrderStateMachine()
    # 支付 -> 发货 -> 收货
    assert m.run(["pay", "ship", "deliver"]) == "delivered"


def test_cancel_before_pay():
    m = OrderStateMachine()
    # 待支付时取消（这条转移 buggy 也支持，属干净基线）
    assert m.run(["cancel"]) == "cancelled"
    assert m.can("pending", "cancel") is True


def test_step_targets():
    m = OrderStateMachine()
    assert m.apply("pending", "pay") == "paid"
    assert m.apply("paid", "ship") == "shipped"
    assert m.apply("shipped", "deliver") == "delivered"
