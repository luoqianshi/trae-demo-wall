# Phase 5 — API 设计

## 执行流程
1. **写 Prompt 文件**：根据数据库设计和业务需求，动态生成 Prompt 内容，写入 `docs/prompts/phase_5_API设计_prompt.md`
2. **读 Prompt 文件**：读取 `docs/prompts/phase_5_API设计_prompt.md`
3. **执行作业**：根据 Prompt 文件的指令执行

## Prompt 模板（必要条件）

```markdown
任务：生成 API 设计文档与可追溯性报告。

必填结构：
1) 输入：
   - docs/需求/需求规格说明书.md
   - docs/架构设计/架构设计文档.md
   - docs/详细需求/模块/*.md
   - docs/数据库设计/数据库设计文档.md
2) 输出：
   - docs/API设计/API设计文档.md
   - docs/API设计/API可追溯性报告.md

API设计文档.md 结构要求：
- API 风格与规范
- 认证与鉴权方案
- 错误码规范
- 接口清单（按模块分组），每个接口包含：
  - 路径、方法、描述
  - 请求参数
  - 请求示例（JSON）
  - 响应结构与示例
  - 关联数据表
- 接口依赖关系
- 限流与幂等性
- 变更与版本演进

API可追溯性报告.md 必须包含：
- 输入引用清单
- 输出 → 输入映射表（接口 → REQ 编号 → 模块 → 数据表）
- 符合项核对清单：
  ✅ 是否符合项目需求
  ✅ 是否依据需求点
  ✅ 是否符合架构设计
  ✅ 是否符合数据库设计
- 差异与风险

动态内容补充（根据业务需求）：
- 针对所选技术栈的 API 设计规范
- 业务流程的接口编排
- 性能和安全方面的接口设计
```

## 产出
- `docs/prompts/phase_5_API设计_prompt.md`（动态生成的 Prompt 文件）
- `docs/API设计/API设计文档.md`
- `docs/API设计/API可追溯性报告.md`