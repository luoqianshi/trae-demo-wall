import type {
  AIHistoryItem,
  AlertItem,
  Batch,
  BatchDetail,
  CourseItem,
  Dashboard,
  Device,
  DiagnosisResult,
  MetricKey,
  ShedSummary,
  UserProfile,
  VoiceQAResult,
} from "@/types";

/** 模拟网络延迟 */
export const delay = (ms = 600) => new Promise((r) => setTimeout(r, ms));

// ============ 首页看板：三个菇棚（正常 / 告警 / 离线） ============

export const dashboardNormal: Dashboard = {
  shedId: "S001",
  shedName: "1号棚",
  mushroomType: "香菇",
  growthStage: "转色期",
  stageDay: 18,
  metrics: {
    temperature: { value: 22.5, unit: "°C", status: "warning", label: "略偏高", target: "18-20°C" },
    humidity: { value: 68, unit: "%", status: "normal", label: "正常", target: "60-70%" },
    co2: { value: 3200, unit: "ppm", status: "warning", label: "偏高", target: "<3000" },
    light: { value: 850, unit: "lux", status: "normal", label: "正常", target: "500-1000" },
    soilTemp: { value: 21.2, unit: "°C", status: "normal", label: "正常", target: "18-22°C" },
  },
  alerts: [
    {
      type: "co2_high",
      level: "warning",
      message: "CO₂ 浓度偏高",
      suggestion: "建议开启风机通风 30 分钟",
      timestamp: "2026-06-30T14:32:00",
    },
  ],
  status: "warning",
  updateTime: "2026-06-30 14:32:00",
};

export const dashboardAlert: Dashboard = {
  shedId: "S003",
  shedName: "3号棚",
  mushroomType: "平菇",
  growthStage: "出菇期",
  stageDay: 5,
  metrics: {
    temperature: { value: 32.5, unit: "°C", status: "danger", label: "严重超标", target: "20-24°C" },
    humidity: { value: 45, unit: "%", status: "danger", label: "过低", target: "60-70%" },
    co2: { value: 4800, unit: "ppm", status: "warning", label: "偏高", target: "<3000" },
    light: { value: 620, unit: "lux", status: "normal", label: "正常", target: "500-1000" },
    soilTemp: { value: 28.5, unit: "°C", status: "warning", label: "偏高", target: "18-22°C" },
  },
  alerts: [
    {
      type: "temp_high",
      level: "danger",
      message: "温度 32.5°C 严重超标",
      suggestion: "立即开启风机+湿帘降温！",
      timestamp: "2026-06-30T14:32:00",
    },
    {
      type: "humidity_low",
      level: "warning",
      message: "湿度仅 45%",
      suggestion: "建议开启喷雾增湿",
      timestamp: "2026-06-30T12:15:00",
    },
  ],
  status: "danger",
  updateTime: "2026-06-30 14:32:00",
};

export const dashboardOffline: Dashboard = {
  shedId: "S002",
  shedName: "2号棚",
  mushroomType: "香菇",
  growthStage: "出菇期",
  stageDay: 22,
  metrics: {
    temperature: { value: 21.0, unit: "°C", status: "offline", label: "缓存", target: "20-24°C" },
    humidity: { value: 65, unit: "%", status: "offline", label: "缓存", target: "60-70%" },
    co2: { value: 0, unit: "ppm", status: "offline", label: "无数据", target: "<3000" },
    light: { value: 0, unit: "lux", status: "offline", label: "无数据", target: "500-1000" },
    soilTemp: { value: 0, unit: "°C", status: "offline", label: "无数据", target: "18-22°C" },
  },
  alerts: [],
  status: "offline",
  updateTime: "2026-06-30 02:15:00",
  lastOnline: "2026-06-30 02:15",
  offlineDuration: "12小时",
};

export const dashboards: Record<string, Dashboard> = {
  S001: dashboardNormal,
  S002: dashboardOffline,
  S003: dashboardAlert,
};

export const shedSummaries: ShedSummary[] = [
  { id: "S001", name: "1号棚", mushroomType: "香菇", temp: 22.5, humidity: 68, status: "warning", alertCount: 1 },
  { id: "S003", name: "3号棚", mushroomType: "平菇", temp: 32.5, humidity: 45, status: "danger", alertCount: 2 },
  { id: "S002", name: "2号棚", mushroomType: "香菇", temp: 0, humidity: 0, status: "offline", alertCount: 0, offlineDuration: "12 小时" },
];

// ============ AI 诊断 & 语音 ============

export const diagnosisResult: DiagnosisResult = {
  diagnosisId: "D20260630001",
  imageUrl: "https://cdn.example.com/img/001.jpg",
  diseaseName: "绿霉病",
  diseaseEn: "Trichoderma",
  confidence: 0.92,
  confidenceLevel: "high",
  symptoms: "菌棒表面出现绿色粉末状霉层，伴有酸臭味。霉菌扩散速度快，需立即处理。",
  cause: "高温高湿环境下，灭菌不彻底或接种时污染",
  treatment: {
    immediate: ["立即移除受感染菌棒，隔离处理", "用 75% 酒精喷洒消毒工具和双手"],
    medication: {
      name: "多菌灵",
      dosage: "1:500 稀释",
      method: "喷洒菌棒表面，每日一次",
      duration: "连续 3 天",
    },
    prevention: ["加强菇棚通风，降低湿度", "接种时严格无菌操作", "定期检查，早发现早处理"],
  },
  severity: "medium",
  humanReview: false,
  timestamp: "2026-06-30T10:23:00+08:00",
};

export const voiceQAResult: VoiceQAResult = {
  question: "菌棒出水了怎么办",
  answer:
    "菌棒出水通常是湿度过高或菌丝代谢旺盛导致的。建议：1. 降低菇棚湿度至60%以下；2. 加强通风；3. 检查是否有局部积水。如果伴随异味，需警惕细菌性感染，可拍照让 AI 诊断一下。",
  relatedVideos: ["V001", "V002"],
  source: "知识图谱 + 专家经验库",
  timestamp: "2026-06-29T18:45:00+08:00",
};

export const aiHistory: AIHistoryItem[] = [
  { id: "H001", kind: "diagnosis", icon: "📸", title: "绿霉病诊断", time: "今天 10:23", confidence: 92 },
  { id: "H002", kind: "voice", icon: "🎤", title: '"菌棒出水怎么办"', time: "昨天 18:45" },
];

export const knowledgeTags = [
  { name: "香菇种植", hot: true },
  { name: "病害防治", hot: true },
  { name: "环境管理", hot: true },
  { name: "采收技巧", hot: true },
  { name: "农药使用", hot: false },
  { name: "设备维护", hot: false },
];

// ============ 种植档案 ============

export const batches: Batch[] = [
  {
    batchId: "2026-A001",
    mushroomType: "香菇",
    variety: "808",
    shedName: "1号棚",
    quantity: 2000,
    startDate: "2026-06-12",
    currentStage: "转色期",
    stageDay: 18,
    expectedHarvest: "2026-07-20",
    status: "growing",
    lastAction: "06-30 10:23 绿霉病防治处理",
  },
  {
    batchId: "2026-A002",
    mushroomType: "平菇",
    variety: "黑平",
    shedName: "3号棚",
    quantity: 1500,
    startDate: "2026-06-01",
    currentStage: "出菇期",
    stageDay: 29,
    expectedHarvest: "2026-07-05",
    status: "growing",
    lastAction: "06-29 16:00 开启喷雾增湿",
  },
  {
    batchId: "2026-A003",
    mushroomType: "香菇",
    variety: "808",
    shedName: "2号棚",
    quantity: 1800,
    startDate: "2026-04-10",
    currentStage: "已采收",
    stageDay: 66,
    expectedHarvest: "2026-06-15",
    status: "harvested",
    lastAction: "06-15 采收完成 · 850斤",
    yield: 850,
    unitCost: 2.3,
  },
];

export const batchDetails: Record<string, BatchDetail> = {
  "2026-A001": {
    ...batches[0],
    timeline: [
      { date: "06-12", event: "进棚接种", detail: "菌种：香菇 808 · 数量 2000 棒" },
      { date: "06-20", event: "菌丝长满", detail: "进入转色期，温度调至 18-20°C" },
      { date: "06-30", event: "绿霉病防治", detail: "AI 诊断后喷洒多菌灵 1:500" },
      { date: "07-20", event: "预计采收", detail: "预计产量 900 斤", expected: true },
    ],
    envAvg7d: { temp: 21.8, humidity: 66, co2Peak: 4200 },
    alertCount: 3,
  },
  "2026-A002": {
    ...batches[1],
    timeline: [
      { date: "06-01", event: "进棚接种", detail: "菌种：黑平 · 数量 1500 棒" },
      { date: "06-15", event: "菌丝长满", detail: "进入出菇期" },
      { date: "06-29", event: "开启喷雾", detail: "湿度偏低，喷雾增湿" },
      { date: "07-05", event: "预计采收", detail: "预计产量 700 斤", expected: true },
    ],
    envAvg7d: { temp: 24.2, humidity: 58, co2Peak: 3800 },
    alertCount: 5,
  },
  "2026-A003": {
    ...batches[2],
    timeline: [
      { date: "04-10", event: "进棚接种", detail: "菌种：香菇 808 · 数量 1800 棒" },
      { date: "04-28", event: "菌丝长满", detail: "进入转色期" },
      { date: "05-20", event: "进入出菇期", detail: "温度调至 20-24°C" },
      { date: "06-15", event: "采收完成", detail: "总产量 850 斤" },
    ],
    envAvg7d: { temp: 22.0, humidity: 64, co2Peak: 3500 },
    alertCount: 2,
  },
};

// ============ 告警列表 ============

export const alerts: AlertItem[] = [
  {
    alertId: "A001",
    type: "temp_high",
    level: "danger",
    shedName: "3号棚",
    message: "温度 32.5°C，超过阈值 28°C",
    suggestion: "立即开启风机+湿帘降温",
    status: "pending",
    createdAt: "2026-06-30T14:32:00",
    timestamp: "今天 14:32",
  },
  {
    alertId: "A002",
    type: "humidity_low",
    level: "warning",
    shedName: "3号棚",
    message: "湿度 45%，低于阈值 50%",
    suggestion: "建议开启喷雾增湿",
    status: "resolved",
    createdAt: "2026-06-30T12:15:00",
    resolvedAt: "2026-06-30T12:30:00",
    timestamp: "今天 12:15",
  },
  {
    alertId: "A003",
    type: "co2_high",
    level: "warning",
    shedName: "1号棚",
    message: "CO₂ 3200ppm，超过阈值 3000",
    suggestion: "自动通风",
    status: "resolved",
    createdAt: "2026-06-29T22:08:00",
    resolvedAt: "2026-06-29T22:20:00",
    timestamp: "昨天 22:08",
  },
];

// ============ 设备 ============

export const devices: Device[] = [
  {
    id: "D001",
    name: "1号棚传感器",
    shed: "S001",
    status: "online",
    battery: 78,
    signal: 85,
    lastUpdate: "2026-06-30T14:32:00",
    model: "GGJ-Pro 2024",
    firmware: "v2.1.3",
    otaAvailable: true,
  },
  {
    id: "D002",
    name: "3号棚传感器",
    shed: "S003",
    status: "online",
    battery: 45,
    signal: 62,
    lastUpdate: "2026-06-30T14:30:00",
    model: "GGJ-Pro 2024",
    firmware: "v2.1.3",
    otaAvailable: true,
  },
  {
    id: "D003",
    name: "2号棚传感器",
    shed: "S002",
    status: "offline",
    battery: 12,
    signal: 0,
    lastUpdate: "2026-06-30T02:15:00",
    model: "GGJ-Lite 2023",
    firmware: "v1.8.0",
    otaAvailable: false,
  },
];

// ============ 用户 ============

export const userProfile: UserProfile = {
  userId: "U001",
  name: "王大叔",
  phone: "137****5678",
  plan: "professional",
  planName: "专业版",
  expiresAt: "2027-06-30",
  devices,
  alertSettings: {
    tempMax: 28,
    tempMin: 15,
    humidityMax: 95,
    humidityMin: 50,
    co2Max: 4000,
    notifyPush: true,
    notifySMS: false,
    notifyCall: false,
  },
};

// ============ 农技课堂 ============

export const courses: CourseItem[] = [
  {
    id: "C001",
    title: "香菇转色期管理要点",
    category: "视频教程",
    cover: "mushroom-color",
    duration: "12:30",
    views: 2860,
  },
  {
    id: "C002",
    title: "常见病害图鉴：绿霉病识别与防治",
    category: "病害图鉴",
    cover: "disease-green",
    views: 1520,
  },
  {
    id: "C003",
    title: "专家直播：夏季菇棚降温技巧",
    category: "专家直播",
    cover: "live-cool",
    views: 890,
    live: true,
  },
  {
    id: "C004",
    title: "平菇出菇期水分控制",
    category: "视频教程",
    cover: "oyster-water",
    duration: "08:45",
    views: 1340,
  },
  {
    id: "C005",
    title: "菌棒污染的十大原因",
    category: "病害图鉴",
    cover: "contamination",
    views: 980,
  },
];

// ============ 历史曲线 Mock ============

export const metricLabels: Record<MetricKey, string> = {
  temperature: "温度",
  humidity: "湿度",
  co2: "CO₂",
  light: "光照",
  soilTemp: "土壤温",
};

export const metricUnits: Record<MetricKey, string> = {
  temperature: "°C",
  humidity: "%",
  co2: "ppm",
  light: "lux",
  soilTemp: "°C",
};

/** 生成 24h 趋势数据 */
function gen24h(base: number, amplitude: number): { label: string; value: number }[] {
  const out: { label: string; value: number }[] = [];
  for (let h = 0; h < 24; h++) {
    const v = base + Math.sin((h / 24) * Math.PI * 2 - 1.2) * amplitude + (Math.random() - 0.5) * amplitude * 0.3;
    out.push({ label: `${String(h).padStart(2, "0")}:00`, value: Number(v.toFixed(1)) });
  }
  return out;
}

/** 生成 7d 趋势数据 */
function gen7d(base: number, amplitude: number): { label: string; value: number }[] {
  const days = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
  return days.map((d) => ({
    label: d,
    value: Number((base + (Math.random() - 0.5) * amplitude * 2).toFixed(1)),
  }));
}

/** 生成 30d 趋势数据 */
function gen30d(base: number, amplitude: number): { label: string; value: number }[] {
  const out: { label: string; value: number }[] = [];
  for (let i = 30; i >= 1; i--) {
    out.push({
      label: `${i}天前`,
      value: Number((base + (Math.random() - 0.5) * amplitude * 2).toFixed(1)),
    });
  }
  return out;
}

export const chartDataByMetric: Record<
  MetricKey,
  { "24h": { label: string; value: number }[]; "7d": { label: string; value: number }[]; "30d": { label: string; value: number }[] }
> = {
  temperature: { "24h": gen24h(21, 2.5), "7d": gen7d(21.5, 2), "30d": gen30d(21.8, 3) },
  humidity: { "24h": gen24h(66, 6), "7d": gen7d(65, 5), "30d": gen30d(66, 8) },
  co2: { "24h": gen24h(2800, 600), "7d": gen7d(3000, 500), "30d": gen30d(3100, 800) },
  light: { "24h": gen24h(780, 200), "7d": gen7d(800, 180), "30d": gen30d(820, 220) },
  soilTemp: { "24h": gen24h(20.5, 1.5), "7d": gen7d(20.8, 1.2), "30d": gen30d(21, 2) },
};
