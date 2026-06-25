export const LANGUAGE_LABELS = {
  zh: "中文",
  en: "English",
  ja: "日本语",
  ar: "العربية",
};

export const LANGUAGE_PAIRS = [
  { id: "en-zh", sourceLang: "en", targetLang: "zh", short: "English -> 中文" },
  { id: "zh-en", sourceLang: "zh", targetLang: "en", short: "中文 -> English" },
  { id: "ja-zh", sourceLang: "ja", targetLang: "zh", short: "日本语 -> 中文" },
  { id: "zh-ja", sourceLang: "zh", targetLang: "ja", short: "中文 -> 日本语" },
  { id: "ar-zh", sourceLang: "ar", targetLang: "zh", short: "العربية -> 中文" },
  { id: "zh-ar", sourceLang: "zh", targetLang: "ar", short: "中文 -> العربية" },
];

export const SCENE_TEMPLATES = [
  {
    id: "classroom",
    name: "课堂模式",
    tagline: "一键开讲，弱化参数",
    description: "适合单人讲解和教学演示，优先保证稳定可读。",
    draftIntensity: "balanced",
    revisionAggressiveness: "moderate",
    finalizationSpeed: "steady",
    subtitleSize: "large",
    micStrategy: "近讲者收音",
    pairId: "en-zh",
    notes: ["Draft 保留", "Final 优先展示", "适合手机快速启动"],
  },
  {
    id: "meeting",
    name: "会议模式",
    tagline: "兼顾速度与复盘",
    description: "适合多轮发言和记录诉求，保留更多修订轨迹。",
    draftIntensity: "full",
    revisionAggressiveness: "aggressive",
    finalizationSpeed: "deliberate",
    subtitleSize: "medium",
    micStrategy: "桌面居中收音",
    pairId: "zh-en",
    notes: ["观察端信息更多", "待确认内容单独标记", "会后导出优先"],
  },
  {
    id: "dialogue",
    name: "双人沟通模式",
    tagline: "连续对话不中断",
    description: "适合展会接待和商务交流，强调低延迟与快速纠正。",
    draftIntensity: "high",
    revisionAggressiveness: "aggressive",
    finalizationSpeed: "fast",
    subtitleSize: "large",
    micStrategy: "轮流近场收音",
    pairId: "zh-ja",
    notes: ["Draft 强提示", "句尾更快定稿", "适合复杂环境"],
  },
  {
    id: "video",
    name: "外放视频模式",
    tagline: "面向远场音源",
    description: "适合播放视频或直播内容，优先稳定收音与后处理。",
    draftIntensity: "soft",
    revisionAggressiveness: "moderate",
    finalizationSpeed: "steady",
    subtitleSize: "xlarge",
    micStrategy: "远场外放收音",
    pairId: "ja-zh",
    notes: ["Final 字幕更大", "Draft 可弱化", "更适合投屏展示"],
  },
];

export const ROLE_VIEWS = [
  { id: "control", name: "主控端", summary: "开始、暂停、停止与实时状态" },
  { id: "display", name: "展示端", summary: "突出 Final，可弱化 Draft" },
  { id: "observer", name: "观察端", summary: "同时看 Draft、Final 与修订过程" },
  { id: "record", name: "记录端", summary: "完整时间轴与会后复盘" },
];

export const SCREEN_ROLE_VIEWS = ROLE_VIEWS.filter((role) => role.id !== "control");

export const EXPORT_FORMATS = [
  { id: "bilingual", name: "最终双语稿", detail: "只保留 Final 结果，适合整理纪要" },
  { id: "subtitle", name: "时间戳字幕文件", detail: "按句保留时间信息，适合回放" },
  { id: "revision", name: "重点确认摘要", detail: "整理可能需要人工确认的内容" },
  { id: "uncertain", name: "待确认清单", detail: "导出需要人工确认的句子" },
];

export const EXPORT_RANGES = [
  { id: "all", name: "整场内容" },
  { id: "finalOnly", name: "仅定稿内容" },
  { id: "volatileOnly", name: "仅待确认内容" },
];

export const REVIEW_ROLES = [
  { id: "speaker", name: "主讲人", focus: "先看可信结果与关键术语" },
  { id: "recorder", name: "记录员", focus: "先看完整时间轴与待复核句" },
  { id: "reviewer", name: "复盘者", focus: "先看摘要、风险与修订统计" },
  { id: "display", name: "展示端", focus: "只看可直接展示的稳定内容" },
];

export const APP_TABS = [
  { id: "live", name: "同传" },
  { id: "view", name: "查看" },
  { id: "review", name: "回看" },
  { id: "export", name: "导出" },
];
