"""类型保真编解码器：把标量值打包成「类型标签+原值」信封，保证 round-trip 类型不变。"""
import json


class TypedCodec:
    """按类型标签精确编解码标量值。"""

    def _tag_of(self, value):
        # 关键：bool 是 int 的子类，必须在 int 之前判定，否则 True/False 会被误打成 int 标签。
        if value is None:
            return "null"
        if isinstance(value, bool):
            return "bool"
        if isinstance(value, int):
            return "int"
        if isinstance(value, float):
            return "float"
        if isinstance(value, str):
            return "str"
        raise TypeError(f"不支持的类型: {type(value).__name__}")

    def encode(self, value):
        tag = self._tag_of(value)
        # 信封：{"t": 标签, "v": 原值}，用 JSON 文本承载。
        return json.dumps({"t": tag, "v": value})

    def decode(self, text):
        env = json.loads(text)
        tag, raw = env["t"], env["v"]
        # 按标签精确重建类型，确保 bool 不退化为 int。
        rebuild = {
            "null": lambda v: None,
            "bool": lambda v: bool(v),
            "int": lambda v: int(v),
            "float": lambda v: float(v),
            "str": lambda v: str(v),
        }
        if tag not in rebuild:
            raise ValueError(f"未知标签: {tag}")
        return rebuild[tag](raw)

    def round_trip(self, value):
        return self.decode(self.encode(value))
