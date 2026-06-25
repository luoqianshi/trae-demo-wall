"""边界测试：放大 bool/int 边界混淆 —— 大整数、bool/int 区分、混合序列。"""
from solution import TypedCodec


def test_large_int_and_bool_boundary():
    c = TypedCodec()
    # 大整数仍是 int
    big = 10 ** 18 + 7
    out = c.round_trip(big)
    assert out == big and type(out) is int

    # True 与 1 严格区分：not (True is 1 之类的退化)
    rt_true = c.round_trip(True)
    rt_one = c.round_trip(1)
    assert rt_true is True, f"True 退化: {rt_true!r}"
    assert rt_one == 1 and type(rt_one) is int
    # 关键：True 还原值不能等价于裸 int 1 的类型
    assert type(rt_true) is not int


def test_each_supported_type_preserved():
    c = TypedCodec()
    cases = [True, False, 0, 1, 100, -100, 2.5, "True", "1", None]
    for v in cases:
        out = c.round_trip(v)
        assert out == v, f"值改变: {v!r} -> {out!r}"
        assert type(out) is type(v), f"类型改变: {v!r} 得到 {type(out).__name__}"


def test_string_true_vs_bool_true():
    c = TypedCodec()
    # 字符串 "True" 与布尔 True 不能互相串
    assert type(c.round_trip("True")) is str
    assert type(c.round_trip(True)) is bool
