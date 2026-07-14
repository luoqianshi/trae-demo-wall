---
title: "学习路径"
created: "2026-07-13"
updated: "2026-07-13"
tags: [learning-path, dependency-graph, plan, 复利思维]
status: "active"
---

# 学习路径

## 知识点依赖图

- topic: "复利公式基础"
  id: "compounding-basics"
  prerequisites: []
  dependents: ["compound-interest-calc", "rule-of-72"]
  estimated_hours: 2.0
  difficulty: 1
  resource_type: "video"

- topic: "复利计算"
  id: "compound-interest-calc"
  prerequisites: ["compounding-basics"]
  dependents: ["investment-application"]
  estimated_hours: 1.5
  difficulty: 2
  resource_type: "interactive"

- topic: "72法则"
  id: "rule-of-72"
  prerequisites: ["compounding-basics"]
  dependents: ["investment-application"]
  estimated_hours: 1.0
  difficulty: 1
  resource_type: "text"

- topic: "指数函数"
  id: "exponential-function"
  prerequisites: []
  dependents: ["compound-interest-calc"]
  estimated_hours: 1.5
  difficulty: 2
  resource_type: "video"

- topic: "投资应用"
  id: "investment-application"
  prerequisites: ["compound-interest-calc", "rule-of-72"]
  dependents: ["cross-domain-application"]
  estimated_hours: 3.0
  difficulty: 3
  resource_type: "practice"

- topic: "跨领域应用"
  id: "cross-domain-application"
  prerequisites: ["investment-application"]
  dependents: []
  estimated_hours: 2.0
  difficulty: 3
  resource_type: "practice"

## 关键路径
critical_path: ["compounding-basics", "compound-interest-calc", "investment-application", "cross-domain-application"]
total_estimated_hours: 8.5

## 并行可学节点
parallel_groups:
  - group: 1
    nodes: ["exponential-function"]
    condition: "可与 compounding-basics 并行（无前置依赖）"
  - group: 2
    nodes: ["compound-interest-calc", "rule-of-72"]
    condition: "完成 compounding-basics 后可并行（两者均只依赖 compounding-basics）"
