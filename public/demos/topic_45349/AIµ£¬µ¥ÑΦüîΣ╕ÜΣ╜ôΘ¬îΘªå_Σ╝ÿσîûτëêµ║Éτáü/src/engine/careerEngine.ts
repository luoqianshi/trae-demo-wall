import type { UserProfile, Recommendation, Career } from "@/types";
import { CAREERS } from "@/data/careers";

/**
 * AI 模拟推荐引擎
 * 基于兴趣(30%) + 科目(25%) + 性格(25%) + 讨厌项惩罚(20%) 的加权评分
 */

// 兴趣匹配得分 (0-1)
function scoreInterests(profile: UserProfile, career: Career): number {
  const weights = career.matchWeights.interests;
  const userInterests = profile.interests;
  if (userInterests.length === 0) return 0.5;

  let totalWeight = 0;
  let matchedWeight = 0;
  for (const [key, weight] of Object.entries(weights)) {
    totalWeight += weight;
    if (userInterests.includes(key)) {
      matchedWeight += weight;
    }
  }

  if (totalWeight === 0) return 0.5;
  // 用户兴趣命中率
  const hitRate = matchedWeight / totalWeight;
  // 同时考虑用户兴趣覆盖度
  const coverage = userInterests.filter((i) => weights[i]).length / userInterests.length;
  return hitRate * 0.6 + coverage * 0.4;
}

// 科目匹配得分 (0-1)
function scoreSubjects(profile: UserProfile, career: Career): number {
  const weights = career.matchWeights.subjects;
  const userSubjects = profile.strongSubjects;
  if (userSubjects.length === 0) return 0.5;

  let totalWeight = 0;
  let matchedWeight = 0;
  for (const [key, weight] of Object.entries(weights)) {
    totalWeight += weight;
    if (userSubjects.includes(key)) {
      matchedWeight += weight;
    }
  }

  if (totalWeight === 0) return 0.5;
  const hitRate = matchedWeight / totalWeight;
  const coverage = userSubjects.filter((s) => weights[s]).length / userSubjects.length;
  return hitRate * 0.6 + coverage * 0.4;
}

// 性格匹配得分 (0-1)，基于欧氏距离归一化
function scorePersonality(profile: UserProfile, career: Career): number {
  const target = career.matchWeights.personality;
  const user = profile.personality;
  const dims: (keyof typeof target)[] = [
    "rational",
    "introvert",
    "stable",
    "creative",
    "collaborative",
  ];

  let sumSquares = 0;
  for (const dim of dims) {
    const diff = user[dim] - target[dim];
    sumSquares += diff * diff;
  }

  const distance = Math.sqrt(sumSquares);
  // 最大可能距离 = sqrt(5 * 100^2) ≈ 223.6
  const maxDistance = Math.sqrt(5 * 100 * 100);
  const normalized = 1 - distance / maxDistance;
  // 加一点基础分，避免过低
  return 0.4 + normalized * 0.6;
}

// 讨厌项惩罚得分 (0-1)，1 表示无惩罚
function scoreDislike(profile: UserProfile, career: Career): number {
  const avoidDislike = career.matchWeights.avoidDislike;
  const userDisliked = profile.dislikedWork;
  if (userDisliked.length === 0) return 1;

  const conflictCount = avoidDislike.filter((d) => userDisliked.includes(d)).length;
  // 每个冲突项扣 0.25，最低 0.1
  return Math.max(0.1, 1 - conflictCount * 0.25);
}

// 生成个性化推荐理由
function generateReason(profile: UserProfile, career: Career, scores: ReturnType<typeof computeMatchScores>): string {
  const reasons: string[] = [];

  // 兴趣相关
  if (scores.interests > 0.6) {
    const matchedInterests = profile.interests.filter((i) => career.matchWeights.interests[i]);
    if (matchedInterests.length > 0) {
      const interestMap: Record<string, string> = {
        tech: "科技", art: "艺术", business: "商业", nature: "自然",
        humanities: "人文", sports: "运动", medicine: "医学", space: "航天",
        design: "设计", music: "音乐", writing: "写作", gaming: "游戏",
      };
      const labels = matchedInterests.map((i) => interestMap[i] || i).join("、");
      reasons.push(`你对${labels}的热爱与该职业高度契合`);
    }
  }

  // 性格相关
  const target = career.matchWeights.personality;
  const user = profile.personality;
  if (Math.abs(user.creative - target.creative) < 25) {
    reasons.push(user.creative > 60 ? "你的创造力能在此充分发挥" : "你的务实特质能稳健推进工作");
  }
  if (Math.abs(user.rational - target.rational) < 25) {
    reasons.push(user.rational > 60 ? "理性思维助你应对复杂问题" : "感性视角让你看见数据之外的世界");
  }
  if (Math.abs(user.collaborative - target.collaborative) < 25) {
    reasons.push(user.collaborative > 60 ? "协作精神让你在团队中如鱼得水" : "独立特质让你能深耕专业领域");
  }

  // 科目相关
  if (scores.subjects > 0.6) {
    const subjectMap: Record<string, string> = {
      math: "数学", physics: "物理", chemistry: "化学", biology: "生物",
      chinese: "语文", english: "英语", cs: "计算机", history: "历史",
      geography: "地理", politics: "政治", art: "美术", pe: "体育",
    };
    const matchedSubjects = profile.strongSubjects.filter((s) => career.matchWeights.subjects[s]);
    if (matchedSubjects.length > 0) {
      const labels = matchedSubjects.map((s) => subjectMap[s] || s).join("、");
      reasons.push(`你擅长的${labels}为该职业奠定坚实基础`);
    }
  }

  // 未来期待
  if (profile.futureExpectation) {
    const expectation = profile.futureExpectation.toLowerCase();
    if (expectation.includes("钱") || expectation.includes("薪") || expectation.includes("收入")) {
      if (career.tags.includes("高薪")) reasons.push("该职业的薪资天花板较高，符合你的经济期待");
    }
    if (expectation.includes("自由") || expectation.includes("独立")) {
      if (career.tags.includes("独立") || career.tags.includes("自由")) reasons.push("该职业的工作方式能给你想要的自由度");
    }
    if (expectation.includes("影响") || expectation.includes("改变") || expectation.includes("价值")) {
      if (career.tags.includes("影响力") || career.tags.includes("前沿")) reasons.push("该职业能让你创造深远的社会影响力");
    }
  }

  // 兜底
  if (reasons.length === 0) {
    reasons.push(career.reason);
  }

  return reasons.slice(0, 3).join("；") + "。";
}

export function computeMatchScores(profile: UserProfile, career: Career) {
  return {
    interests: scoreInterests(profile, career),
    subjects: scoreSubjects(profile, career),
    personality: scorePersonality(profile, career),
    dislike: scoreDislike(profile, career),
  };
}

export function recommendCareers(profile: UserProfile): Recommendation[] {
  const scored = CAREERS.map((career) => {
    const scores = computeMatchScores(profile, career);
    // 加权综合分
    const composite =
      scores.interests * 0.3 +
      scores.subjects * 0.25 +
      scores.personality * 0.25 +
      scores.dislike * 0.2;

    // 匹配度 60-99 区间，保留 1 位小数
    const matchScore = Math.round((60 + composite * 39) * 10) / 10;

    return {
      career,
      matchScore,
      reason: generateReason(profile, career, scores),
      scoreBreakdown: {
        interests: Math.round(scores.interests * 100),
        subjects: Math.round(scores.subjects * 100),
        personality: Math.round(scores.personality * 100),
        dislike: Math.round(scores.dislike * 100),
        composite: Math.round(composite * 100),
      },
      _composite: composite,
    };
  });

  // 按综合分排序，取 Top 3
  scored.sort((a, b) => b._composite - a._composite);
  const top3 = scored.slice(0, 3);

  return top3.map(({ career, matchScore, reason, scoreBreakdown }) => ({
    career,
    matchScore,
    reason,
    scoreBreakdown,
  }));
}

// 生成行动建议
export function generateActionPlan(recommendations: Recommendation[]): {
  short: string[];
  mid: string[];
  long: string[];
} {
  const topCareer = recommendations[0]?.career;

  return {
    short: [
      `深入了解「${topCareer?.name}」的日常工作与行业现状`,
      "关注 3 位该领域的从业者，阅读他们的内容",
      "完成该职业的入门项目，验证兴趣与适配度",
      "梳理你现有的可迁移技能，找出差距",
    ],
    mid: [
      `系统学习「${topCareer?.name}」所需的核心能力`,
      "参与相关开源项目或社区，积累实战经验",
      "寻找该领域的导师或同行，建立学习圈",
      "在垂直平台输出学习笔记，建立个人品牌",
    ],
    long: [
      "构建完整作品集，准备求职或独立项目",
      "持续追踪行业前沿，保持技术敏锐度",
      "培养跨领域能力，形成差异化竞争力",
      "规划 5 年职业路径，定期复盘与调整",
    ],
  };
}
