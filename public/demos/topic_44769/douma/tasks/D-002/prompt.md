# 订单状态机

## 背景

`OrderStateMachine` 描述电商订单的生命周期。订单从 `pending`（待支付）开始，经支付、发货、收货走向终态，
其间在尚未发货前允许取消。状态流转必须严格按规则进行：合法事件推进状态，非法事件一律拒绝。

## 状态与事件

状态：`pending`（待支付）、`paid`（已支付）、`shipped`（已发货）、`delivered`（已收货）、`cancelled`（已取消）。

合法转移（事件 → 目标状态）：

- `pending` --`pay`--> `paid`
- `pending` --`cancel`--> `cancelled`
- `paid` --`ship`--> `shipped`
- `paid` --`cancel`--> `cancelled`（已支付但未发货，允许取消并退款）
- `shipped` --`deliver`--> `delivered`

`delivered` 与 `cancelled` 为终态，不再接受任何事件。

## 对外接口

- `OrderStateMachine()`：创建状态机（不持有具体订单状态，仅做规则判定/推进）。
- `can(self, state, event) -> bool`：判断在 `state` 下触发 `event` 是否为合法转移。
- `apply(self, state, event) -> str`：在 `state` 下触发 `event`，返回新状态；若为非法转移则抛出 `ValueError`。
- `run(self, events) -> str`：从 `pending` 出发，依次应用 `events` 列表中的事件，返回最终状态；中途遇非法转移抛 `ValueError`。

## 对外保证（不变量）

1. **合法必通**：上述列出的每一条合法转移都必须被允许，`apply` 返回正确的目标状态。
2. **非法必拒**：未列出的任何 (状态, 事件) 组合都必须被拒绝（`can` 返回 `False`，`apply` 抛 `ValueError`）；
   尤其是已发货 (`shipped`) 之后**不得**再被取消。
3. **终态封闭**：`delivered`、`cancelled` 下触发任何事件都被拒绝。

## 错误现象

- 正常的“支付→发货→收货”主流程，以及“待支付时取消”都工作正常。
- 但用户在**已支付、尚未发货**时申请取消订单，系统却把这条本应允许的取消当成非法转移拒绝了。

## 你的任务

定位并修复缺陷，使上述三条不变量对所有 (状态, 事件) 组合都严格成立——既不漏放合法转移，也不误放非法转移。

## 约束

- **只能修改 `buggy/solution.py`**，不得改动测试或调用方式。
- 保持 `OrderStateMachine` 及其方法的对外签名与语义不变。
- 仅使用标准库。
