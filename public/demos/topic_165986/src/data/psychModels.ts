export interface PsychDimension {
  key: string;
  label: string;
  description: string;
  keywords: string[];
}

export interface PsychModel {
  key: string;
  name: string;
  subtitle: string;
  description: string;
  dimensions: PsychDimension[];
}

export const psychModels: PsychModel[] = [
  {
    key: "bigFive",
    name: "大五人格",
    subtitle: "Big Five Personality Traits",
    description: "从写作中观察你在五个维度上的倾向。这不是诊断，而是自我觉察的参考。",
    dimensions: [
      {
        key: "openness",
        label: "开放性",
        description: "对新体验、创意和抽象思考的接受度",
        keywords: ["探索", "好奇", "想", "为什么", "如果", "也许", "可能", "尝试", "不一样", "新"],
      },
      {
        key: "conscientiousness",
        label: "尽责性",
        description: "目标的坚持和自我管理的倾向",
        keywords: ["计划", "目标", "坚持", "完成", "应该", "需要", "努力", "决心", "习惯", "自律"],
      },
      {
        key: "extraversion",
        label: "外向性",
        description: "对外部互动和表达的倾向",
        keywords: ["朋友", "交流", "分享", "表达", "说话", "一起", "讨论", "社交", "陪伴", "倾诉"],
      },
      {
        key: "agreeableness",
        label: "宜人性",
        description: "对他人感受的关注和包容倾向",
        keywords: ["理解", "体谅", "关心", "温柔", "包容", "感谢", "抱歉", "在意", "尊重", "共情"],
      },
      {
        key: "neuroticism",
        label: "神经质",
        description: "情绪波动和内在焦虑的倾向",
        keywords: ["焦虑", "担心", "害怕", "紧张", "不安", "压力", "累", "崩溃", "无力", "迷茫"],
      },
    ],
  },
  {
    key: "emotionWheel",
    name: "情绪轮盘",
    subtitle: "Plutchik's Wheel of Emotions",
    description: "将你的文字映射到基本情绪维度，观察情绪的丰富度和分布。",
    dimensions: [
      {
        key: "joy",
        label: "喜悦",
        description: "快乐、满足、期待",
        keywords: ["开心", "快乐", "满足", "期待", "兴奋", "希望", "喜悦", "成就感", "幸福", "美好"],
      },
      {
        key: "trust",
        label: "信任",
        description: "安全感、接纳、依赖",
        keywords: ["信任", "安全", "依赖", "接纳", "踏实", "放心", "相信", "可靠", "温暖", "归属"],
      },
      {
        key: "fear",
        label: "恐惧",
        description: "焦虑、担忧、不安",
        keywords: ["害怕", "恐惧", "担心", "焦虑", "不安", "紧张", "慌", "怕", "忧虑", "惶恐"],
      },
      {
        key: "surprise",
        label: "惊讶",
        description: "意外、好奇、困惑",
        keywords: ["意外", "惊讶", "没想到", "突然", "奇怪", "好奇", "疑惑", "震惊", "不可思议", "竟然"],
      },
      {
        key: "sadness",
        label: "悲伤",
        description: "低落、失落、孤独",
        keywords: ["难过", "悲伤", "失落", "孤独", "空虚", "绝望", "哭泣", "心痛", "遗憾", "无力"],
      },
      {
        key: "disgust",
        label: "厌恶",
        description: "排斥、不满、反感",
        keywords: ["讨厌", "厌恶", "烦", "受不了", "反感", "排斥", "嫌弃", "恶心", "抵触", "不耐烦"],
      },
      {
        key: "anger",
        label: "愤怒",
        description: "愤怒、挫败、不满",
        keywords: ["生气", "愤怒", "恼火", "烦", "暴躁", "崩溃", "受够了", "不公平", "凭什么", "气"],
      },
      {
        key: "anticipation",
        label: "期待",
        description: "展望、希望、动力",
        keywords: ["期待", "希望", "未来", "计划", "想要", "渴望", "梦想", "目标", "向往", "憧憬"],
      },
    ],
  },
  {
    key: "maslow",
    name: "需求层次",
    subtitle: "Maslow's Hierarchy of Needs",
    description: "从写作中识别你当前关注的需求层次，了解内在动力的来源。",
    dimensions: [
      {
        key: "physiological",
        label: "生理需求",
        description: "睡眠、饮食、身体感受",
        keywords: ["累", "困", "饿", "睡", "身体", "疲惫", "休息", "健康", "生病", "体力"],
      },
      {
        key: "safety",
        label: "安全需求",
        description: "安全感、稳定、经济保障",
        keywords: ["安全", "稳定", "钱", "工作", "收入", "保障", "风险", "害怕失去", "不确定", "未来"],
      },
      {
        key: "love",
        label: "归属与爱",
        description: "关系、陪伴、接纳",
        keywords: ["朋友", "家人", "关系", "孤独", "陪伴", "理解", "爱", "归属", "亲密", "连接"],
      },
      {
        key: "esteem",
        label: "尊重需求",
        description: "自我价值、认可、成就",
        keywords: ["价值", "认可", "成就", "证明", "尊重", "自信", "能力", "面子", "骄傲", "自卑"],
      },
      {
        key: "selfActualization",
        label: "自我实现",
        description: "成长、意义、创造",
        keywords: ["意义", "成长", "梦想", "创造", "潜能", "突破", "真实", "使命", "热爱", "成为"],
      },
    ],
  },
  {
    key: "cbt",
    name: "认知模式",
    subtitle: "CBT Cognitive Distortions",
    description: "识别写作中可能存在的认知扭曲，帮助你更客观地看待自己。",
    dimensions: [
      {
        key: "overthinking",
        label: "过度思考",
        description: "反复分析同一件事",
        keywords: ["想", "思考", "分析", "到底", "为什么", "反复", "一直想", "纠结", "琢磨", "想不通"],
      },
      {
        key: "catastrophizing",
        label: "灾难化",
        description: "预设最坏结果",
        keywords: ["完蛋", "完了", "不行", "做不到", "不可能", "糟糕", "毁了", "没救", "太迟了", "来不及"],
      },
      {
        key: "shouldStatements",
        label: "应该思维",
        description: "用'应该'绑架自己",
        keywords: ["应该", "必须", "不得不", "不该", "本应", "理应", "一定要", "不能不", "应该要", "本该"],
      },
      {
        key: "personalization",
        label: "个人化归因",
        description: "把外部问题归因于自己",
        keywords: ["都怪我", "是我的错", "因为我", "都怪自己", "怪自己", "我不够好", "是我害的", "是我问题", "是我造成", "是我导致"],
      },
      {
        key: "blackWhite",
        label: "非黑即白",
        description: "极端化判断",
        keywords: ["总是", "从来不", "永远", "完全", "彻底", "一点都", "要么", "要么就", "绝不", "绝对"],
      },
      {
        key: "labeling",
        label: "标签化",
        description: "给自己贴固定标签",
        keywords: ["我就是", "我这个人", "我天生", "我就是个", "我这种人", "我就是这样", "改不了", "天生就", "注定", "我就是太"],
      },
    ],
  },
];

export function analyzePsychModel(
  modelKey: string,
  entries: { content: string; mood: { key: string } }[]
): { dimension: string; label: string; description: string; score: number; count: number }[] {
  const model = psychModels.find(m => m.key === modelKey);
  if (!model) return [];

  const allText = entries.map(e => e.content).join(" ");

  return model.dimensions.map(dim => {
    const count = dim.keywords.reduce((acc, kw) => {
      const matches = allText.match(new RegExp(kw, "g"));
      return acc + (matches ? matches.length : 0);
    }, 0);

    const totalKeywords = model.dimensions.reduce(
      (sum, d) => sum + d.keywords.reduce((s, kw) => {
        const matches = allText.match(new RegExp(kw, "g"));
        return s + (matches ? matches.length : 0);
      }, 0),
      0
    );

    const score = totalKeywords > 0 ? Math.round((count / totalKeywords) * 100) : 0;

    return {
      dimension: dim.key,
      label: dim.label,
      description: dim.description,
      score,
      count,
    };
  }).sort((a, b) => b.score - a.score);
}
