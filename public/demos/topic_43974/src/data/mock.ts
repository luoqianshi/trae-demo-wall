// AI 药管家 Demo 模拟数据

export interface Medicine {
  id: number;
  name: string;
  genericName: string;
  ingredients: string;
  indication: string;
  dosage: string;
  manufacturer: string;
  approvalNumber: string;
  image: string;
}

export interface CabinetItem {
  id: number;
  medicine: Medicine;
  quantity: number;
  stockThreshold: number;
  expiryDate: string;
  daysToExpiry: number;
  status: "normal" | "expiring" | "expired" | "low-stock";
  owner: string;
}

export interface Reminder {
  id: number;
  medicineName: string;
  dosage: string;
  time: string;
  status: "pending" | "taken" | "missed";
  owner: string;
  ownerAvatar: string;
}

export interface FamilyMember {
  id: number;
  name: string;
  role: string;
  avatar: string;
  status: "online" | "offline";
  todayReminders: number;
  takenCount: number;
  missedCount: number;
}

// 药品数据
export const medicines: Medicine[] = [
  {
    id: 1,
    name: "拜阿司匹灵肠溶片",
    genericName: "阿司匹林肠溶片",
    ingredients: "阿司匹林 100mg",
    indication: "抑制血小板聚集，预防心脑血管疾病",
    dosage: "每日1次，每次1片，饭后服用",
    manufacturer: "拜耳医药保健有限公司",
    approvalNumber: "国药准字J20130078",
    image: "💊",
  },
  {
    id: 2,
    name: "络活喜苯磺酸氨氯地平片",
    genericName: "苯磺酸氨氯地平片",
    ingredients: "苯磺酸氨氯地平 5mg",
    indication: "高血压、稳定性心绞痛",
    dosage: "每日1次，每次1片，晨起服用",
    manufacturer: "辉瑞制药有限公司",
    approvalNumber: "国药准字H10950224",
    image: "💊",
  },
  {
    id: 3,
    name: "立普妥阿托伐他汀钙片",
    genericName: "阿托伐他汀钙片",
    ingredients: "阿托伐他汀钙 20mg",
    indication: "高胆固醇血症、冠心病",
    dosage: "每日1次，每次1片，睡前服用",
    manufacturer: "辉瑞制药有限公司",
    approvalNumber: "国药准字H20051408",
    image: "💊",
  },
  {
    id: 4,
    name: "美林布洛芬混悬液",
    genericName: "布洛芬混悬液",
    ingredients: "布洛芬 100mg/5ml",
    indication: "儿童普通感冒或流行性感冒引起的发热",
    dosage: "按体重计算，5-10mg/kg/次",
    manufacturer: "上海强生制药有限公司",
    approvalNumber: "国药准字H19991012",
    image: "🧴",
  },
];

// 药箱数据
export const cabinetItems: CabinetItem[] = [
  {
    id: 1,
    medicine: medicines[0],
    quantity: 14,
    stockThreshold: 7,
    expiryDate: "2027-03-15",
    daysToExpiry: 630,
    status: "normal",
    owner: "爷爷",
  },
  {
    id: 2,
    medicine: medicines[1],
    quantity: 5,
    stockThreshold: 7,
    expiryDate: "2026-12-20",
    daysToExpiry: 180,
    status: "low-stock",
    owner: "爷爷",
  },
  {
    id: 3,
    medicine: medicines[2],
    quantity: 10,
    stockThreshold: 7,
    expiryDate: "2026-07-15",
    daysToExpiry: 22,
    status: "expiring",
    owner: "奶奶",
  },
  {
    id: 4,
    medicine: medicines[3],
    quantity: 1,
    stockThreshold: 2,
    expiryDate: "2027-06-01",
    daysToExpiry: 710,
    status: "low-stock",
    owner: "宝宝",
  },
];

// 今日提醒
export const todayReminders: Reminder[] = [
  {
    id: 1,
    medicineName: "苯磺酸氨氯地平片",
    dosage: "1片 (5mg)",
    time: "08:00",
    status: "taken",
    owner: "爷爷",
    ownerAvatar: "👴",
  },
  {
    id: 2,
    medicineName: "阿司匹林肠溶片",
    dosage: "1片 (100mg)",
    time: "09:00",
    status: "taken",
    owner: "爷爷",
    ownerAvatar: "👴",
  },
  {
    id: 3,
    medicineName: "阿托伐他汀钙片",
    dosage: "1片 (20mg)",
    time: "12:00",
    status: "pending",
    owner: "奶奶",
    ownerAvatar: "👵",
  },
  {
    id: 4,
    medicineName: "苯磺酸氨氯地平片",
    dosage: "1片 (5mg)",
    time: "18:00",
    status: "pending",
    owner: "爷爷",
    ownerAvatar: "👴",
  },
  {
    id: 5,
    medicineName: "阿托伐他汀钙片",
    dosage: "1片 (20mg)",
    time: "21:00",
    status: "pending",
    owner: "奶奶",
    ownerAvatar: "👵",
  },
];

// 家庭成员
export const familyMembers: FamilyMember[] = [
  {
    id: 1,
    name: "爷爷",
    role: "父亲 · 68岁",
    avatar: "👴",
    status: "online",
    todayReminders: 3,
    takenCount: 2,
    missedCount: 0,
  },
  {
    id: 2,
    name: "奶奶",
    role: "母亲 · 65岁",
    avatar: "👵",
    status: "online",
    todayReminders: 2,
    takenCount: 0,
    missedCount: 0,
  },
  {
    id: 3,
    name: "宝宝",
    role: "儿子 · 3岁",
    avatar: "👶",
    status: "offline",
    todayReminders: 0,
    takenCount: 0,
    missedCount: 0,
  },
];

// 药物冲突检测结果
export const interactionWarnings = [
  {
    medicineA: "阿司匹林肠溶片",
    medicineB: "布洛芬混悬液",
    severity: "慎用" as const,
    description: "两者均为 NSAIDs 类药物，合用可能增加胃肠道出血风险",
  },
];
