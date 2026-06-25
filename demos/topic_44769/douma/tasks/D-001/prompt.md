# 类型保真消息编解码器

## 背景

`TypedCodec` 用于在跨进程消息总线上**保真地**传递标量值。由于下游需要还原出与发送端**完全相同类型**的值，
编解码器不能直接依赖 JSON 的弱类型，而是把每个值打包成「类型标签 + 原值」的信封字符串，
接收端按标签精确重建。支持的标量类型：`bool`、`int`、`float`、`str`、`None`。

## 对外接口

- `TypedCodec()`：创建编解码器。
- `TypedCodec.encode(self, value) -> str`：把一个标量值编码为信封字符串（内部为 JSON 文本）。
- `TypedCodec.decode(self, text) -> value`：把信封字符串还原为原值。
- `TypedCodec.round_trip(self, value) -> value`：等价于 `decode(encode(value))`，便于自检。

## 对外保证（不变量）

1. **值不变**：`decode(encode(x)) == x`。
2. **类型不变**：`type(decode(encode(x))) is type(x)`——
   尤其 `True/False` 还原后必须仍是 `bool`，**不得退化成 `1/0` 这样的 `int`**；
   `1` 还原后必须仍是 `int`，不得变成 `True`。
3. **None 保真**：`None` 编码后还原仍为 `None`。

## 错误现象

- 传 `int`、`float`、`str`、`None` 时，编解码完全正常。
- 但传 `bool` 时出问题：`True` 经一次 round-trip 后变成了整数 `1`、`False` 变成 `0`，
  类型从 `bool` 悄悄退化为 `int`，导致下游基于 `is True` / 类型判断的逻辑全部错乱。

## 你的任务

定位并修复缺陷，使上述三条不变量对所有受支持类型都严格成立。

## 约束

- **只能修改 `buggy/solution.py`**，不得改动测试或调用方式。
- 保持 `TypedCodec` 及其方法的对外签名与语义不变。
- 仅使用标准库（可用 `json`）。
