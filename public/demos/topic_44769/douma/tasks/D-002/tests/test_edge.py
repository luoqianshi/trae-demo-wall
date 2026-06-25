"""边界测试：合法的 paid->cancel 必须放行，且 shipped 之后的取消等非法转移必须拒绝。"""
import pytest
from solution import OrderStateMachine


def test_paid_cancel_must_be_allowed():
    m = OrderStateMachine()
    # 关键边界：已支付未发货取消，合法转移不得被拒
    assert m.can("paid", "cancel") is True
    assert m.apply("paid", "cancel") == "cancelled"
    assert m.run(["pay", "cancel"]) == "cancelled"


def test_shipped_cancel_must_be_rejected():
    m = OrderStateMachine()
    # 已发货之后不得取消（防止把修复做成"对所有状态放开 cancel"的半修复）
    assert m.can("shipped", "cancel") is False
    with pytest.raises(ValueError):
        m.apply("shipped", "cancel")
    with pytest.raises(ValueError):
        m.run(["pay", "ship", "cancel"])


def test_terminal_states_closed():
    m = OrderStateMachine()
    for terminal in ("delivered", "cancelled"):
        for event in ("pay", "ship", "cancel", "deliver"):
            assert m.can(terminal, event) is False, f"{terminal} 应为终态"
            with pytest.raises(ValueError):
                m.apply(terminal, event)


def test_other_illegal_transitions_rejected():
    m = OrderStateMachine()
    illegal = [
        ("pending", "ship"),
        ("pending", "deliver"),
        ("paid", "pay"),
        ("paid", "deliver"),
        ("shipped", "pay"),
        ("shipped", "ship"),
    ]
    for state, event in illegal:
        assert m.can(state, event) is False
        with pytest.raises(ValueError):
            m.apply(state, event)
    # 双重取消应在第二次 cancel 时失败（cancelled 为终态）
    with pytest.raises(ValueError):
        m.run(["cancel", "cancel"])
