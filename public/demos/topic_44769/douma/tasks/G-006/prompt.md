# 用户目录解析

## 背景

`Directory` 是一个进程内的用户目录：业务先注册若干用户（`id -> 名字`），
之后按 `id` 查用户、或直接解析出展示名。由于查询的 `id` 可能根本不存在（已注销、拼写错误等），
查找接口以 `(*User, error)` 形式返回——**找不到时返回 `nil` 与一个错误**，调用方必须先判错。

## 对外接口

- `NewDirectory() *Directory`：创建空目录。
- `Add(id int, name string)`：注册 / 覆盖一个用户。
- `Find(id int) (*User, error)`：按 id 查找；找到返回 `(*User, nil)`，找不到返回 `(nil, error)`。
- `DisplayName(id int) (string, error)`：解析某 id 的展示名；找到返回 `(名字, nil)`，找不到返回 `("", error)`。
- `User` 结构体含导出字段 `Name string`。

## 对外保证（不变量）

1. **错误传播**：当 `id` 不存在时，`DisplayName` 必须返回**非 nil 的 error** 且名字为 `""`，
   **绝不允许 panic**，也不得返回某个看似有效的脏名字。
2. **成功正确**：当 `id` 存在时，`DisplayName` 返回该用户的真实名字与 `nil` 错误。
3. **不解引用 nil**：任何在 `Find` 返回错误时仍去访问其 `*User` 字段的行为都是非法的。

## 错误现象

- 查询存在的 id 时一切正常。
- 但一旦查询**不存在的 id**，程序直接因空指针解引用 panic 崩溃（而不是优雅地返回错误），
  说明查找返回的错误被忽略、`nil` 指针被直接使用了。

## 你的任务

定位并修复缺陷，使上述三条不变量在任意 id（存在或不存在）下都严格成立。

## 约束

- **只能修改 `buggy/solution.go`**，不得改动测试或调用方式。
- 保持 `NewDirectory`、`Add`、`Find`、`DisplayName`、`User` 的对外签名与语义不变。
- 仅使用标准库。
