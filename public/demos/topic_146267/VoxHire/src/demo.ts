import type { InterviewReport, TranscriptEntry } from "./types";

export const demoQuestions = [
  "请用两分钟介绍你自己，并说明为什么想应聘后端工程师。",
  "在 Python 服务开发中，哪些环节最容易影响线上质量？",
  "请说明一次你定位并解决复杂技术问题的过程。",
  "请选择一个代表项目，说明你的个人贡献与关键取舍。",
  "假设业务流量增长十倍，你会如何保障系统稳定性？",
];

const demoAnswers = [
  "我有三年后端开发经验，主要使用 Python 和 FastAPI，关注高并发服务与可观测性。我希望在更复杂的业务场景中继续提升系统设计能力。",
  "我会重点关注输入校验、异常处理、数据库连接池、接口超时和监控告警。上线前通过压测确认瓶颈，并为关键路径准备降级策略。",
  "一次接口延迟升高时，我先从监控确认问题集中在数据库调用，再通过慢查询和链路追踪定位索引缺失，补充索引并验证压测结果。",
  "在订单服务项目中，我负责接口设计、异步任务和日志体系。面对峰值流量，我选择消息队列削峰，并通过幂等键避免重复处理。",
  "我会先做容量评估，将无状态服务水平扩展；随后增加缓存和消息队列，并围绕数据库读写、限流、熔断和监控逐步完善。",
];

export const demoTranscript: TranscriptEntry[] = demoQuestions.flatMap((question, index) => [
  { role: "assistant" as const, text: question },
  { role: "user" as const, text: demoAnswers[index] },
]);

export const demoReport: InterviewReport = {
  session_id: "demo-session",
  overall_score: 78,
  recommendation: "系统设计与项目深挖已经具备扎实基础，下一轮可强化技术原理的表达深度。",
  summary: "候选人能够以具体项目案例支撑观点，表达结构清晰，并覆盖了稳定性与可观测性等工程实践。",
  dimensions: [
    { key: "technical_accuracy", label: "技术准确性", score: 8, evidence: "能说明连接池、索引、幂等和限流等关键技术点。", suggestion: "补充选型原理与适用边界，形成更有说服力的回答。" },
    { key: "project_depth", label: "项目深度", score: 8, evidence: "项目回答包含个人职责、挑战和最终取舍。", suggestion: "继续量化性能改善或业务收益。" },
    { key: "problem_analysis", label: "问题分析", score: 8, evidence: "排障过程遵循监控、假设、验证和修复的顺序。", suggestion: "说明如何避免同类问题再次发生。" },
    { key: "system_design", label: "系统设计", score: 7, evidence: "能够覆盖扩容、缓存、消息队列和数据库。", suggestion: "进一步说明一致性方案、容量指标和故障演练。" },
    { key: "communication_clarity", label: "表达清晰度", score: 8, evidence: "回答先给结论，再补充技术依据。", suggestion: "面对复杂问题时可增加更明确的小结。" },
    { key: "collaboration", label: "沟通协作", score: 7, evidence: "回答体现了通过监控与验证推动问题解决。", suggestion: "增加与产品、测试协同决策的具体案例。" },
    { key: "improvement", label: "改进建议", score: 8, evidence: "具备稳定性意识和持续复盘的习惯。", suggestion: "下一次重点练习系统设计中的数据一致性表达。" },
  ],
};
