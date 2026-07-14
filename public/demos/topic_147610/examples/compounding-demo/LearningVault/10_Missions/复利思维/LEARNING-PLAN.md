---
title: "学习计划"
created: "2026-07-13"
updated: "2026-07-13"
tags: [learning-plan, schedule, daily-input, 复利思维]
status: "active"
---

# 学习计划

## 计划元数据
- plan_id: "PLAN-2026-001"
- topic: "复利思维"
- generated_date: "2026-07-13"
- plan_period: "3天"
- start_date: "2026-07-13"
- end_date: "2026-07-15"
- source_inputs: ["MISSION.md", "MASTERY-MAP.md", "LEARNER-PROFILE.md", "LEARNING-PATH.md"]

## 阶段目标

- stage: 1
  name: "基础阶段"
  date_range: "2026-07-13"
  goal: "掌握复利公式与72法则"
  success_criteria: "5个知识点mastery≥2"

- stage: 2
  name: "应用阶段"
  date_range: "2026-07-14 ~ 2026-07-15"
  goal: "掌握投资应用与跨领域应用"
  success_criteria: "investment-application mastery≥3"

## 每日任务分配

- date: "2026-07-13"
  stage: 1
  tasks:
    - topic: "复利计算"
      path_id: "compound-interest-calc"
      type: teach
      est_time: 20min
      time_slot: "20:00-20:20"
    - topic: "复利公式基础"
      path_id: "compounding-basics"
      type: review
      est_time: 10min
      time_slot: "20:20-20:30"

- date: "2026-07-14"
  stage: 2
  tasks:
    - topic: "72法则"
      path_id: "rule-of-72"
      type: teach
      est_time: 15min
      time_slot: "20:00-20:15"
    - topic: "投资应用"
      path_id: "investment-application"
      type: teach
      est_time: 25min
      time_slot: "20:15-20:40"

- date: "2026-07-15"
  stage: 2
  tasks:
    - topic: "投资应用"
      path_id: "investment-application"
      type: assess
      est_time: 15min
      time_slot: "20:00-20:15"
    - topic: "跨领域应用"
      path_id: "cross-domain-application"
      type: teach
      est_time: 25min
      time_slot: "20:15-20:40"

## 关键路径节点
critical_path_topics:
  - path_id: "compounding-basics"
    estimated_hours: 2.0
  - path_id: "compound-interest-calc"
    estimated_hours: 1.5
  - path_id: "investment-application"
    estimated_hours: 3.0
  - path_id: "cross-domain-application"
    estimated_hours: 2.0

## 动态调整记录
adjustments: []
