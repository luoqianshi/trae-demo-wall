---
title: "Assessments: 复利思维"
created: "2026-07-13"
updated: "2026-07-13"
tags: [learning, assessments, 复利思维]
status: "active"
---

# 复利思维 题库与答题记录

## 题库

- id: ASSESS-0001
  source: obsidian-ai
  topic: "复利公式基础"
  type: choice
  difficulty: 1
  question: "复利公式 A = P(1+r)^n 中，指数位置 n 代表什么？"
  options:
    - "本金金额"
    - "期数（计息周期数）"
    - "年利率"
    - "终值"
  answer: "期数（计息周期数）"
  explanation: "在复利公式 A=P(1+r)^n 中，P是本金，r是每期利率，n是期数（计息周期数），A是终值。n位于指数位置，表示复利计算的累计周期数，体现了"利滚利"的次数。"
  related_note: "[[复利公式与直觉建立]]"
  created: "2026-07-13"
  last_used: "2026-07-13"
  correct_rate: 0.0
  times_used: 1

- id: ASSESS-0002
  source: obsidian-ai
  topic: "72法则"
  type: fill
  difficulty: 2
  question: "用72法则计算：年利率6%的投资，本金翻倍需要___年。（填写整数）"
  answer: "12"
  explanation: "72法则：翻倍年数 ≈ 72 ÷ 年利率（百分数）。72 ÷ 6 = 12年。注意：72法则用的是数字72，不是69.3（69.3是 ln(100)≈4.605 对应的更精确值，但72因能被多数整数整除而作为速算工具）。"
  related_note: "[[复利公式与直觉建立]]"
  created: "2026-07-13"
  last_used: "2026-07-13"
  correct_rate: 0.0
  times_used: 1

- id: ASSESS-0003
  source: obsidian-ai
  topic: "复利公式基础"
  type: short-answer
  difficulty: 2
  question: "请用2-3句话说明复利与单利的核心区别。"
  answer: "单利每期利息仅基于原始本金计算，利息不并入本金再生息；复利每期利息基于上一期末的本息和计算，即"利滚利"。长期来看，复利的终值呈指数增长，远高于单利的线性增长。"
  explanation: "核心区别在于计息基数：单利始终用原始本金 P 计息，复利用上期末本息和 P(1+r)^(n-1) 计息。这导致复利终值 A=P(1+r)^n 与单利终值 A=P(1+rn) 在长期差距巨大。"
  related_note: "[[复利公式与直觉建立]]"
  created: "2026-07-13"
  last_used: "2026-07-13"
  correct_rate: 1.0
  times_used: 1

- id: ASSESS-0004
  source: obsidian-ai
  topic: "投资应用"
  type: application
  difficulty: 3
  question: "小明将10000元存入年利率5%的复利账户，每年计息一次。3年后账户余额是多少？请写出计算过程。"
  answer: "11576.25元。计算过程：A = P(1+r)^n = 10000 × (1+0.05)^3 = 10000 × 1.157625 = 11576.25元。"
  explanation: "代入复利公式：P=10000，r=0.05，n=3。(1.05)^3 = 1.157625，因此终值 A = 10000 × 1.157625 = 11576.25元。相比单利（10000×(1+0.05×3)=11500元），复利多出76.25元。"
  related_note: "[[复利公式与直觉建立]]"
  created: "2026-07-13"
  last_used: "2026-07-13"
  correct_rate: 1.0
  times_used: 1

- id: ASSESS-0005
  source: obsidian-ai
  topic: "指数函数"
  type: choice
  difficulty: 2
  question: "以下哪个现象最典型地体现了"指数增长"特征？"
  options:
    - "每月固定存入1000元的储蓄总额增长"
    - "年利率8%的复利投资的本息增长"
    - "匀速行驶的汽车累计里程"
    - "每天阅读30页的累计页数"
  answer: "年利率8%的复利投资的本息增长"
  explanation: "指数增长的特征是"增长速率与当前值成正比"，即每期增长基于当前总量而非固定基数。复利投资每期利息基于上期末本息和，符合指数增长定义。其他选项均为线性增长（每期增量固定）。"
  related_note: "[[复利公式与直觉建立]]"
  created: "2026-07-13"
  last_used: "2026-07-13"
  correct_rate: 1.0
  times_used: 1

## 答题记录

### 2026-07-13 测试session

- session_id: SESS-0001
  date: "2026-07-13"
  knowledge_point: "复利公式基础"
  question_ids: [ASSESS-0001, ASSESS-0002, ASSESS-0003, ASSESS-0004, ASSESS-0005]
  results:
    - question_id: ASSESS-0001
      user_answer: "本金金额"
      correct: false
      time_spent: 25s
      error_id: ERR-0001
    - question_id: ASSESS-0002
      user_answer: "11.5"
      correct: false
      time_spent: 40s
      error_id: ERR-0002
    - question_id: ASSESS-0003
      user_answer: "单利利息不滚存，复利利息滚存。复利长期收益更高。"
      correct: true
      time_spent: 60s
    - question_id: ASSESS-0004
      user_answer: "A = 10000 × (1.05)^3 = 10000 × 1.157625 = 11576.25元"
      correct: true
      time_spent: 90s
    - question_id: ASSESS-0005
      user_answer: "年利率8%的复利投资的本息增长"
      correct: true
      time_spent: 30s
  summary:
    total: 5
    correct: 3
    correct_rate: 0.60
    duration: 245s
