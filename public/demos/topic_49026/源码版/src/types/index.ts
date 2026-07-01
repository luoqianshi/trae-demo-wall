// 核心类型定义 v2 — 企业级实体关系图谱 + 多维度画像

// === 人物档案（丰满版） ===

export interface Person {
  id: string;
  name: string;
  // 基础关系分类
  relationship: 'spouse' | 'family' | 'colleague' | 'friend' | 'leader' | 'mentor' | 'subordinate' | 'client' | 'rival' | 'other';
  // 关系强度（动态变化）
  sentiment: number; // -100 to 100
  sentimentHistory: SentimentPoint[]; // 关系温度时间线

  // === 多维度画像 ===
  profile: PersonProfile;

  // === 时间线事件 ===
  timeline: TimelineEvent[];

  // === 实体关系图谱 ===
  connections: PersonConnection[]; // 与该人物相关的其他人物/实体

  // === 记忆标签 ===
  traits: string[];
  tags: string[]; // 自动提取的标签

  // === 互动统计 ===
  interactionStats: {
    totalCount: number;
    lastInteractionAt: number;
    avgSentiment: number;
    topics: string[]; // 最常讨论的话题
  };

  createdAt: number;
  updatedAt: number;
  isDemo?: number;
}

export interface PersonProfile {
  // 身份信息
  identity: {
    fullName?: string;
    nicknames: string[];
    gender?: 'male' | 'female' | 'other';
    age?: number;
    birthday?: string; // MM-DD
    zodiac?: string;
    hometown?: string;
    currentCity?: string;
  };

  // 职业信息
  career: {
    company?: string;
    title?: string;
    department?: string;
    industry?: string;
    workStyle?: string; // 工作风格描述
    strengths: string[];
    weaknesses: string[];
    careerHistory: CareerEntry[];
  };

  // 性格特质（大五人格简化版）
  personality: {
    openness: number;      // 开放性 0-100
    conscientiousness: number; // 尽责性 0-100
    extraversion: number;  // 外向性 0-100
    agreeableness: number; // 宜人性 0-100
    neuroticism: number;   // 神经质 0-100
    mbti?: string;         // 如 "INTJ"
    description: string;   // AI生成的性格描述
  };

  // 偏好与习惯
  preferences: {
    likes: string[];
    dislikes: string[];
    allergies: string[];
    dietary: string[];
    hobbies: string[];
    communicationStyle: string; // 沟通风格
  };

  // 价值观与信念
  values: {
    coreValues: string[];  // 核心价值观
    motivations: string[]; // 驱动因素
    fears: string[];       // 担忧/恐惧
    goals: string[];       // 目标/愿望
  };

  // 关系网络中的角色
  socialRole: {
    roleInMyLife: string;  // 在我生活中的角色
    myRoleInTheirLife: string; // 我在他们生活中的角色
    powerDynamic: 'equal' | 'superior' | 'subordinate' | 'complex'; // 权力关系
    trustLevel: number;    // 信任度 0-100
    intimacyLevel: number; // 亲密度 0-100
  };

  // 共同经历
  sharedExperiences: SharedExperience[];
}

export interface CareerEntry {
  company: string;
  title: string;
  period: string; // "2020-2023"
  highlights: string[];
}

export interface SharedExperience {
  id: string;
  title: string;
  description: string;
  date: string;
  category: 'travel' | 'work' | 'family' | 'crisis' | 'celebration' | 'daily';
  sentiment: number;
}

export interface SentimentPoint {
  timestamp: number;
  value: number;
  reason: string; // 为什么变化
}

export interface TimelineEvent {
  id: string;
  timestamp: number;
  type: 'first_met' | 'milestone' | 'conflict' | 'reconciliation' | 'shared_experience' | 'commitment' | 'observation';
  title: string;
  description: string;
  sentiment: number;
  relatedMemoryIds: string[];
}

export interface PersonConnection {
  targetPersonId: string;
  targetPersonName: string;
  relationType: 'family' | 'colleague' | 'friend' | 'partner' | 'rival' | 'introduced_by' | 'other';
  strength: number; // 0-100
  description: string;
  favorBalance?: number; // 人情余额：正=对方欠我，负=我欠对方
}

// === 互动记录 ===

export interface Interaction {
  id: string;
  timestamp: number;
  type: 'conversation' | 'diary' | 'idea' | 'reminder' | 'observation';
  participants: string[]; // person IDs
  content: string;
  summary: string;
  extracted: {
    commitments: string[];
    emotions: string[];
    topics: string[];
    people: string[];
    entities: ExtractedEntity[]; // 新增：实体抽取
  };
  privacy: 'normal' | 'sensitive' | 'destroy';
  isDemo?: number;
}

export interface ExtractedEntity {
  text: string;
  type: 'person' | 'organization' | 'location' | 'time' | 'event' | 'concept';
  confidence: number;
}

// === 记忆 ===

export interface Memory {
  id: string;
  type: 'preference' | 'commitment' | 'event' | 'insight' | 'emotion' | 'habit' | 'goal' | 'fear' | 'value' | 'health';
  content: string;
  source: string; // interaction ID
  confidence: 'high' | 'medium' | 'low';
  confirmed: boolean;
  // 新增：记忆关联
  relatedPersonIds: string[];
  relatedMemoryIds: string[];
  tags: string[];
  expiresAt?: number;
  createdAt: number;
  isDemo?: number;
}

// === 日记 ===

export interface DiaryEntry {
  id: string;
  timestamp: number;
  content: string;
  type: 'text' | 'audio';
  audioUrl?: string;
  emotions: string[];
  tags: string[];
  // 新增：日记分析
  analysis?: {
    moodScore: number; // -100 to 100
    keyTopics: string[];
    mentionedPeople: string[];
    insights: string[];
  };
  isDemo?: number;
}

// === Agent ===

export interface Agent {
  id: string;
  name: string;
  role: string;
  description: string;
  capabilities: string[]; // 能力列表
  tools: string[]; // 可用工具
  status: 'idle' | 'running' | 'waiting' | 'done' | 'error';
  avatar: string;
  color: string;
  // 新增：Agent性能统计
  stats: {
    totalCalls: number;
    avgLatency: number;
    successRate: number;
    lastActiveAt: number;
  };
}

// === Agent任务 ===

export interface AgentTask {
  id: string;
  type: 'chat' | 'memory_extract' | 'review' | 'reminder' | 'analysis' | 'search' | 'profile_update';
  agentId: string;
  input: string;
  output?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: number;
  completedAt?: number;
  error?: string;
  parentTaskId?: string; // 父任务ID（用于任务链）
  subTaskIds: string[]; // 子任务ID
}

// === 审核步骤 ===

export interface ReviewStep {
  step: number;
  agentId: string;
  agentName: string;
  action: 'generate' | 'audit' | 'revise' | 'final' | 'research' | 'synthesize';
  content: string;
  verdict?: 'pass' | 'revise' | 'reject';
  // 新增：步骤元数据
  metadata?: {
    sources: string[];
    confidence: number;
    reasoning: string;
  };
}

// === 对话 ===

export interface Conversation {
  id?: number;
  timestamp: number;
  title: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
    // 新增：消息元数据
    metadata?: {
      agentId?: string;
      retrievalInfo?: {
        method: string;
        memoryCount: number;
        peopleCount: number;
      };
      pluginIds?: string[];
    };
  }>;
}

// === 用户画像 ===

/** 用户价值体系 — 描述用户本人的思维方式、处世哲学和价值取向 */
export interface UserValueSystem {
  /** 义利取向：重义还是重利 */
  justiceProfitOrientation?: 'justice' | 'profit' | 'balanced'
  /** 边界感：人际边界的清晰程度 */
  boundaryStyle?: 'permeable' | 'clear' | 'flexible'
  /** 处世哲学：整体的人生态度 */
  lifePhilosophy?: 'forgiving' | 'reciprocal' | 'pragmatic' | 'idealistic'
  /** 决策模式：如何做决定 */
  decisionPhilosophy?: 'analytical' | 'intuitive' | 'consultative' | 'autonomous'
  /** 人际取向：关系优先还是任务优先 */
  relationshipOrientation?: 'relationship_first' | 'task_first' | 'balanced'
  /** 冲突处理风格 */
  conflictStyle?: 'avoidant' | 'collaborative' | 'competitive' | 'accommodating'
  /** 价值关键词（从对话中自由提取，如"仁义""忠孝""效率""自由"） */
  valueKeywords: string[]
  /** 处事原则（从对话中自由提取，如"不占人便宜""帮人帮到底"） */
  principles: string[]
  /** 最近一次更新时间 */
  updatedAt?: number
}

export interface UserProfile {
  name: string;
  age: string;
  gender: string;
  city: string;
  occupation: string;
  education: string;
  workYears: string;
  income: string;
  family: string;
  finance: string;
  health: string;
  currentChallenges: string;
  /** 用户价值体系（思维方式、处世哲学） */
  valueSystem?: UserValueSystem;
}

// === 知识图谱 ===

export interface KnowledgeGraph {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
}

export interface KnowledgeNode {
  id: string;
  type: 'person' | 'memory' | 'event' | 'concept' | 'place' | 'time';
  label: string;
  data: any;
  importance: number; // PageRank分数
}

export interface KnowledgeEdge {
  source: string;
  target: string;
  type: 'related_to' | 'caused' | 'part_of' | 'mentions' | 'occurred_at' | 'involves';
  weight: number;
  evidence: string;
}
