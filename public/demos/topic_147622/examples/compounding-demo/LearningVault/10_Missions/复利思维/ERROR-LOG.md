---
title: "Error Log: 复利思维"
created: "2026-07-13"
updated: "2026-07-13"
tags: [learning, error-log, 复利思维]
status: "active"
---

# 复利思维 错题集

## 未通过错题（retry_passed = null | false）

- id: ERR-0001
  date: "2026-07-13"
  question_id: ASSESS-0001
  topic: "复利公式基础"
  error_type: 概念混淆
  root_cause: "用户将复利公式中的指数位置 n（期数）与本金 P 混淆，误选"本金金额"。深层原因是将"本金+利息"的模式与"本金×利率"混淆，对指数位置的语义未建立直觉。"
  related_lr: LR-0001
  remediation:
    - "重学 lessons/0001-compounding-intuition.html 的核心知识部分，重点关注公式各变量含义"
    - "生成针对性练习题3道，强化 n/期数 与 P/本金 的区分"
  retry_date: "2026-07-16"
  retry_passed: null
  retry_count: 0

- id: ERR-0002
  date: "2026-07-13"
  question_id: ASSESS-0002
  topic: "72法则"
  error_type: 计算错误
  root_cause: "用户用69.3而非72进行速算，得到 69.3÷6=11.5 而非 72÷6=12。混淆了72法则（速算工具，用72）与精确值 ln(2)≈0.693（对应69.3）。虽然69.3更精确，但72法则的速算定义明确使用72。"
  related_lr: LR-0001
  remediation:
    - "生成针对性练习题3道，用不同利率反复练习 72÷利率 的速算"
    - "强调72法则的"速算"定位：用72是因为能被2/3/4/6/8/9/12等多数整数整除，便于心算"
  retry_date: "2026-07-16"
  retry_passed: null
  retry_count: 0

## 已通过错题（retry_passed = true）

- id: ERR-0003
  date: "2026-07-10"
  question_id: ASSESS-0005
  topic: "指数函数"
  error_type: 计算错误
  root_cause: "在2026-07-10的外部自测中，将指数增长与线性增长混淆，误选"每月固定存入1000元"为指数增长。"
  related_lr: null
  remediation:
    - "观看3Blue1Brown指数函数可视化视频，建立指数增长的视觉直觉"
    - "完成"指数增长vs线性增长"对比练习2道"
  retry_date: "2026-07-13"
  retry_passed: true
  retry_count: 1
  passed_date: "2026-07-13"

## 错误模式归纳

- 模式1：公式记忆不牢 → 出现2次（ERR-0001概念混淆 + ERR-0003计算错误） → 已生成 reference/compounding-cheatsheet.html（复利思维速查表，含公式速查与常见错误提示）
- 模式2：72法则与精确值混淆 → 出现1次（ERR-0002） → 已在速查表中标注"72 vs 69.3"常见错误提示
- 备注：用户错误类型集中在概念混淆（0.40）与计算错误（0.25），与应用失误（0.20）和遗忘（0.15）相比占比更高，符合 LEARNER-PROFILE.md 的错误模式画像。
