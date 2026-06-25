"""回归测试：干净基线 —— 非 bool 标量（int/float/str/None）round-trip 正常。"""
from solution import TypedCodec


def test_non_bool_scalars():
    c = TypedCodec()
    samples = [0, 42, -7, 3.14, -0.5, "hello", "", None]
    for v in samples:
        out = c.round_trip(v)
        assert out == v, f"值改变: {v!r} -> {out!r}"
        assert type(out) is type(v), f"类型改变: {type(v)} -> {type(out)}"


def test_encode_decode_separately():
    c = TypedCodec()
    text = c.encode(123)
    assert isinstance(text, str)
    assert c.decode(text) == 123
    assert type(c.decode(text)) is int
