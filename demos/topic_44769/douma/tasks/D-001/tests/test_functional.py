"""功能测试：bool 必须保真，不得退化为 int，且与 int 互不混淆。"""
from solution import TypedCodec


def test_bool_round_trip_keeps_type():
    c = TypedCodec()
    for v in (True, False):
        out = c.round_trip(v)
        assert out == v
        # 类型必须仍是 bool，绝不能变成 1/0
        assert type(out) is bool, f"{v!r} 退化为 {type(out).__name__}"


def test_bool_not_confused_with_int():
    c = TypedCodec()
    # int 1 还原后应仍是 int，不能变成 True
    out = c.round_trip(1)
    assert out == 1
    assert type(out) is int
    # True 还原后应仍是 bool
    out2 = c.round_trip(True)
    assert type(out2) is bool
    # 两者类型严格区分
    assert type(c.round_trip(0)) is int
    assert type(c.round_trip(False)) is bool
