---
title: "Schedule: 复利思维"
created: "2026-07-13"
updated: "2026-07-13"
tags: [learning, schedule, 复利思维]
status: "active"
---

# 复利思维 复习调度

## 今日到期（2026-07-13）

- topic: "复利公式基础"
  path_id: "compounding-basics"
  review_count: 1
  interval: 1天
  strength: 轻
  last_correct_rate: 0.60
  action: "运行 /review 复利公式基础"

- topic: "72法则"
  path_id: "rule-of-72"
  review_count: 1
  interval: 1天
  strength: 轻
  last_correct_rate: 0.50
  error_priority: true
  action: "运行 /review 72法则"

## 未来到期

- topic: "复利公式基础"
  path_id: "compounding-basics"
  due_date: "2026-07-16"
  review_count: 2
  interval: 3天
  strength: 轻
  notes: "错题重做节点，关联 ERR-0001"

- topic: "指数函数"
  path_id: "exponential-function"
  due_date: "2026-07-20"
  review_count: 3
  interval: 7天
  strength: 中
  notes: "mastery=3，按常规曲线推进"

## 调度历史

- 2026-07-13: 复习"复利公式基础" → 正确率0.60 → 回退至1天后（正确率<80%未达下一间隔，按V1规则重复当前间隔1天）
- 2026-07-13: 复习"72法则" → 正确率0.50 → 回退至1天后（正确率<60%触发回退，关联ERR-0002）
- 2026-07-10: 外部自测"指数函数" → 正确率0.85 → 推进至7天后（正确率≥80%进入下一间隔）

### V1简化调度规则

| 复习次数 | 间隔 | 强度 |
|---|---|---|
| 第1次 | 1天 | 轻 |
| 第2次 | 3天 | 轻 |
| 第3次 | 7天 | 中 |
| 第4次 | 15天 | 中 |
| 第5次 | 30天 | 重 |

调整规则：
- 正确率≥80% → 进入下一间隔
- 正确率60-80% → 重复当前间隔
- 正确率<60% → 回退一级间隔
