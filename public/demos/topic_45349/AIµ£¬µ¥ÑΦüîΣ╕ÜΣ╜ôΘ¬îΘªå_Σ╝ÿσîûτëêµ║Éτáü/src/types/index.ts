// 用户画像
export interface UserProfile {
  gender?: "male" | "female" | "other";
  interests: string[];
  personality: {
    rational: number;      // 理性(0)-感性(100)
    introvert: number;     // 内向(0)-外向(100)
    stable: number;        // 稳定(0)-冒险(100)
    creative: number;      // 务实(0)-创造(100)
    collaborative: number; // 独立(0)-协作(100)
  };
  strongSubjects: string[];
  dislikedWork: string[];
  futureExpectation: string;
}

// 一天时间线时段
export interface DayTimelineItem {
  time: string;
  title: string;
  desc: string;
  mood: number; // 0-100
  icon: string;
}

// 学习路线阶段
export interface RoadmapStage {
  stage: string;
  title: string;
  duration: string;
  items: string[];
}

// 能力项
export interface Ability {
  name: string;
  level: number; // 0-100
}

// 风险项
export interface CareerRisk {
  title: string;
  desc: string;
  mitigation: string;
}

// 职业卡通形象配置
export interface CareerAvatar {
  costume: string;        // 服装主色 hex
  accessory: string;      // lucide 图标名（眼镜/帽子/耳机等）
  hairStyle: "short" | "long" | "bun" | "curly";
}

// 工作场景
export interface WorkScene {
  id: string;
  time: string;        // "09:30"
  title: string;       // "晨会头脑风暴"
  location: string;    // "开放办公区"
  desc: string;        // 沉浸式场景描述（第二人称）
  mood: "focus" | "creative" | "stress" | "relax" | "social" | "tired";
  highlight: string;   // "白板上贴满彩色便签"
}

// 职业装备
export interface Gear {
  name: string;
  icon: string;        // lucide 图标名
  desc: string;
  rarity: "daily" | "pro" | "legendary";
}

// 职业挑战题
export interface CareerChallenge {
  title: string;
  desc: string;
  options: { text: string; correct: boolean; feedback: string }[];
}

// 职业人格画像
export interface PersonalityFit {
  trait: string;       // "共情型创造者"
  desc: string;
}

// 职业数据
export interface Career {
  id: string;
  name: string;
  enName: string;
  icon: string;
  tagline: string;
  tags: string[];
  accentColor: "cyan" | "magenta" | "gold" | "green";
  matchWeights: {
    interests: Record<string, number>;
    subjects: Record<string, number>;
    personality: {
      rational: number;
      introvert: number;
      stable: number;
      creative: number;
      collaborative: number;
    };
    avoidDislike: string[];
  };
  reason: string;
  abilities: Ability[];
  dayTimeline: DayTimelineItem[];
  roadmap: RoadmapStage[];
  starterProject: {
    name: string;
    desc: string;
    steps: string[];
  };
  risks: CareerRisk[];
  // ===== 沉浸剧场扩展字段（可选，逐步补全）=====
  avatar?: CareerAvatar;
  workScenes?: WorkScene[];
  gears?: Gear[];
  challenge?: CareerChallenge;
  personalityFit?: PersonalityFit[];
  openingLine?: string;  // 角色开场台词
}

// 推荐结果
export interface Recommendation {
  career: Career;
  matchScore: number;
  reason: string;
  scoreBreakdown?: {
    interests: number;
    subjects: number;
    personality: number;
    dislike: number;
    composite: number;
  };
}

// 报告
export interface CareerReport {
  userProfile: UserProfile;
  recommendations: Recommendation[];
  selectedCareerId: string;
  generatedAt: string;
  actionPlan: {
    short: string[];
    mid: string[];
    long: string[];
  };
}

// 选项常量
export const INTEREST_OPTIONS = [
  { id: "tech", label: "科技", icon: "Cpu" },
  { id: "art", label: "艺术", icon: "Palette" },
  { id: "business", label: "商业", icon: "TrendingUp" },
  { id: "nature", label: "自然", icon: "Leaf" },
  { id: "humanities", label: "人文", icon: "BookOpen" },
  { id: "sports", label: "运动", icon: "Dumbbell" },
  { id: "medicine", label: "医学", icon: "HeartPulse" },
  { id: "space", label: "航天", icon: "Rocket" },
  { id: "design", label: "设计", icon: "PenTool" },
  { id: "music", label: "音乐", icon: "Music" },
  { id: "writing", label: "写作", icon: "Feather" },
  { id: "gaming", label: "游戏", icon: "Gamepad2" },
];

export const SUBJECT_OPTIONS = [
  { id: "math", label: "数学" },
  { id: "physics", label: "物理" },
  { id: "chemistry", label: "化学" },
  { id: "biology", label: "生物" },
  { id: "chinese", label: "语文" },
  { id: "english", label: "英语" },
  { id: "cs", label: "计算机" },
  { id: "history", label: "历史" },
  { id: "geography", label: "地理" },
  { id: "politics", label: "政治" },
  { id: "art", label: "美术" },
  { id: "pe", label: "体育" },
];

export const DISLIKED_WORK_OPTIONS = [
  { id: "repetitive", label: "重复劳动", icon: "RefreshCw" },
  { id: "outdoor", label: "户外作业", icon: "Sun" },
  { id: "social", label: "人际应酬", icon: "Users" },
  { id: "data", label: "数据报表", icon: "Table" },
  { id: "physical", label: "体力劳动", icon: "HardHat" },
  { id: "sitting", label: "久坐办公", icon: "Armchair" },
  { id: "highpressure", label: "高压环境", icon: "Zap" },
  { id: "travel", label: "频繁出差", icon: "Plane" },
  { id: "nightshift", label: "夜班熬夜", icon: "Moon" },
  { id: "detail", label: "琐碎细节", icon: "ListChecks" },
];

export const PERSONALITY_DIMENSIONS = [
  { key: "rational", leftLabel: "理性", rightLabel: "感性" },
  { key: "introvert", leftLabel: "内向", rightLabel: "外向" },
  { key: "stable", leftLabel: "稳定", rightLabel: "冒险" },
  { key: "creative", leftLabel: "务实", rightLabel: "创造" },
  { key: "collaborative", leftLabel: "独立", rightLabel: "协作" },
] as const;
