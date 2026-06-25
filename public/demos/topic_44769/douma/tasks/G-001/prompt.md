# 批量记录解析器

## 背景

`BatchParser` 是一个批处理解析组件：上游送来一批字符串记录，逐条解析为**非负整数**。
由于数据源不可靠，单条记录可能格式非法（非数字、负数、空值等）。
解析器要做到「**坏记录不拖垮整批**」——把能解析的都解析出来，
同时把每条失败记录**如实登记**，供调用方对账、重试、告警。

## 对外接口

- `BatchParser()`：创建解析器。
- `BatchParser.parse(self, records) -> BatchResult`：解析整批记录。
- `BatchResult.results -> list[int]`：成功解析出的值，顺序与输入中成功项的相对顺序一致。
- `BatchResult.errors -> list[tuple]`：失败记录列表，每项为 `(下标, 原始值, 原因字符串)`。
- `BatchResult.ok_count -> int` / `BatchResult.error_count -> int`：成功 / 失败条数。

## 对外保证（不变量）

1. **守恒**：对任意输入，`ok_count + error_count == len(records)`——
   每条记录要么进 `results`，要么进 `errors`，**绝不允许凭空消失**。
2. **失败可见**：任何解析失败都必须在 `errors` 中留下一条记录（含其在输入中的下标与原始值），
   **不得被静默吞掉**。
3. **成功正确**：`results` 中的值与对应输入逐一对应、解析正确；合法记录不受坏记录影响。

## 错误现象

- 整批记录全部合法时，结果完全正确。
- 但当批次中混入非法记录时，这些坏记录既没出现在 `results`，也**没出现在 `errors` 里**——
  它们仿佛被悄悄丢弃，导致 `ok_count + error_count` 比实际记录数还少，对账时数量对不上。

## 你的任务

定位并修复缺陷，使上述三条不变量在任意输入下都严格成立。

## 约束

- **只能修改 `buggy/solution.py`**，不得改动测试或调用方式。
- 保持 `BatchParser`、`BatchResult` 及其属性 / 方法的对外签名与语义不变。
- 仅使用标准库。
