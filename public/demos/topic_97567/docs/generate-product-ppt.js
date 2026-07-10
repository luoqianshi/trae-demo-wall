const pptxgen = require("pptxgenjs");
const fs = require("fs");
const path = require("path");

// ============================================================
// 雪球日记 · 产品介绍 PPT 生成器
// 配色方案：温暖柔和，与产品 UI 一致
// ============================================================

const P = new pptxgen();
P.layout = "LAYOUT_16x9";
P.author = "雪球日记团队";
P.title = "雪球日记 — 微成功记录助手";
P.subject = "产品介绍";

// ---- 色彩系统（与 App UI 保持一致）----
const C = {
  rose:       "F5A2A2",   // 主粉色（按钮、强调）
  blush:      "FFB5B5",   // 浅粉
  sky:        "7EC8E3",   // 天蓝色（渐变右端）
  ocean:      "5BA3C6",   // 深蓝
  mint:       "A8E6CF",   // 薄荷绿
  gold:       "FFD166",   // 金色（星星）
  cream:      "FFF8F0",   // 奶油白背景
  white:      "FFFFFF",
  ink:        "2D3436",   // 深色文字
  charcoal:   "4A5568",
  slate:      "718096",
  lightBg:    "FAFAFA",
};

// 辅助：柔阴影工厂
function softShadow() {
  return { type: "outer", blur: 8, offset: 2, angle: 135, opacity: 0.12 };
}

function medShadow() {
  return { type: "outer", blur: 12, offset: 3, angle: 135, opacity: 0.15 };
}

// 图片目录
const IMG_DIR = path.join(__dirname, "screenshots");

// ============================================================
// SLIDE 1 — 封面页
// ============================================================
let s1 = P.addSlide();
// 渐变背景（用两个大圆形模拟）
s1.background = { color: C.cream };
s1.addShape(P.shapes.OVAL, { x: -2, y: -2, w: 7, h: 7, fill: { color: C.rose, transparency: 85 } });
s1.addShape(P.shapes.OVAL, { x: 6.5, y: 2, w: 6, h: 6, fill: { color: C.sky, transparency: 85 } });
s1.addShape(P.shapes.OVAL, { x: 7.5, y: -1.5, w: 4, h: 4, fill: { color: C.mint, transparency: 88 } });

// 品牌标识
s1.addText("❄️", { x: 0, y: 1.6, w: 10, h: 0.9, fontSize: 48, align: "center" });
s1.addText("雪 球 日 记", {
  x: 0.5, y: 2.5, w: 9, h: 0.9,
  fontSize: 48, fontFace: "Microsoft YaHei", bold: true,
  color: C.ink, align: "center",
});
s1.addText("Snowball Diary", {
  x: 0.5, y: 3.35, w: 9, h: 0.5,
  fontSize: 22, fontFace: "Arial", color: C.slate, align: "center",
});
// 副标题标签
s1.addShape(P.shapes.ROUNDED_RECTANGLE, {
  x: 3.0, y: 4.0, w: 4.0, h: 0.5,
  fill: { color: C.rose, transparency: 75 }, rectRadius: 0.25,
});
s1.addText("微成功记录助手", {
  x: 3.0, y: 4.05, w: 4.0, h: 0.42,
  fontSize: 17, fontFace: "Microsoft YaHei", color: C.ink, align: "center",
});
// 底部信息
s1.addText("让每一天的微小进步都被看见", {
  x: 0.5, y: 4.8, w: 9, h: 0.4,
  fontSize: 14, fontFace: "Microsoft YaHei", color: C.slate, align: "center",
});

// ============================================================
// SLIDE 2 — 产品概述
// ============================================================
let s2 = P.addSlide();
s2.background = { color: C.white };

// 顶部装饰条
s2.addShape(P.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.rose } });

s2.addShape(P.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: 0.35, w: 1.5, h: 0.32, fill: { color: C.rose }, rectRadius: 0.05 });
s2.addText("OVERVIEW", { x: 0.5, y: 0.36, w: 1.5, h: 0.30, fontSize: 8, fontFace: "Arial", bold: true, color: C.white, align: "center" });
s2.addText("什么是雪球日记？", { x: 0.5, y: 0.78, w: 8, h: 0.55, fontSize: 26, fontFace: "Microsoft YaHei", bold: true, color: C.ink });

// 产品简介卡片
s2.addShape(P.shapes.RECTANGLE, {
  x: 0.5, y: 1.45, w: 9, h: 1.5,
  fill: { color: C.cream }, rectRadius: 0.12, shadow: softShadow(),
});
s2.addShape(P.shapes.RECTANGLE, { x: 0.5, y: 1.45, w: 0.07, h: 1.5, fill: { color: C.rose } });
s2.addText([
  { text: "「雪球日记」是一款以", options: { fontSize: 14, fontFace: "Microsoft YaHei", color: C.charcoal } },
  { text: "「微成功」", options: { fontSize: 14, fontFace: "Microsoft YaHei", bold: true, color: C.rose } },
  { text: "为核心的 AI 日记应用\n\n", options: { fontSize: 14, fontFace: "Microsoft YaHei", color: C.charcoal } },
  { text: "灵感来源于「雪球效应」——每一个微小的进步都像滚雪球一样，越滚越大。\n用户通过记录生活中的小成功、小确幸，在 AI 的温暖引导下养成积极记录的习惯，见证自己每一天的成长轨迹。", options: { fontSize: 13, fontFace: "Microsoft YaHei", color: C.charcoal } },
], { x: 0.75, y: 1.58, w: 8.5, h: 1.3, valign: "top", lineSpacingMultiple: 1.3 });

// 三大核心创意
s2.addText("三大核心创意", { x: 0.5, y: 3.12, w: 5, h: 0.4, fontSize: 18, fontFace: "Microsoft YaHei", bold: true, color: C.ink });

const coreIdeas = [
  { icon: "❄️", title: "微成功 + 游戏化成长", desc: "小成功记录与雪球成长可视化结合，每一笔记录推动雪球变大", color: C.rose },
  { icon: "🤖", title: "AI 智能引导", desc: "「雪球问你」根据时间和行为自动生成个性化引导问题", color: C.sky },
  { icon: "🏆", title: "三级挑战体系", desc: "青铜/白银/金挑战系统，让记录习惯养成更有成就感", color: C.gold },
];
coreIdeas.forEach((idea, i) => {
  const x = 0.5 + i * 3.08;
  s2.addShape(P.shapes.RECTANGLE, {
    x: x, y: 3.58, w: 2.92, h: 1.82,
    fill: { color: C.white }, rectRadius: 0.1,
    shadow: softShadow(), line: { color: idea.color, width: 1.2, transparency: 70 },
  });
  s2.addText(idea.icon, { x: x, y: 3.7, w: 2.92, h: 0.46, fontSize: 24, align: "center" });
  s2.addText(idea.title, { x: x + 0.12, y: 4.2, w: 2.68, h: 0.38, fontSize: 13, fontFace: "Microsoft YaHei", bold: true, color: C.ink, align: "center" });
  s2.addText(idea.desc, { x: x + 0.12, y: 4.58, w: 2.68, h: 0.72, fontSize: 10.5, fontFace: "Microsoft YaHei", color: C.slate, align: "center" });
});

// ============================================================
// SLIDE 3 — 痛点与目标人群
// ============================================================
let s3 = P.addSlide();
s3.background = { color: C.lightBg };

s3.addShape(P.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: 0.35, w: 1.8, h: 0.32, fill: { color: C.ocean }, rectRadius: 0.05 });
s3.addText("PROBLEM & AUDIENCE", { x: 0.5, y: 0.36, w: 1.8, h: 0.30, fontSize: 7, fontFace: "Arial", bold: true, color: C.white, align: "center" });
s3.addText("痛点与目标人群", { x: 0.5, y: 0.78, w: 8, h: 0.55, fontSize: 26, fontFace: "Microsoft YaHei", bold: true, color: C.ink });

// 左侧：痛点
s3.addText("用户痛点", { x: 0.5, y: 1.4, w: 4, h: 0.38, fontSize: 16, fontFace: "Microsoft YaHei", bold: true, color: C.rose });

const pains = [
  { text: "只关注\"大目标\"，忽略日常微小进步" },
  { text: "容易陷入自我否定，忽视自身成长" },
  { text: "传统日记门槛太高，缺乏持续动力" },
  { text: "没有有效反馈机制，难形成正向循环" },
  { text: "缺少个性化引导，不知道记什么" },
];
pains.forEach((p, i) => {
  const y = 1.85 + i * 0.62;
  s3.addShape(P.shapes.RECTANGLE, {
    x: 0.5, y: y, w: 4.4, h: 0.52,
    fill: { color: C.white }, rectRadius: 0.06, shadow: softShadow(),
  });
  s3.addShape(P.shapes.RECTANGLE, { x: 0.5, y: y, w: 0.05, h: 0.52, fill: { color: C.rose } });
  s3.addText(p.text, { x: 0.68, y: y + 0.12, w: 4.1, h: 0.32, fontSize: 11.5, fontFace: "Microsoft YaHei", color: C.charcoal });
});

// 右侧：目标人群
s3.addText("目标人群", { x: 5.2, y: 1.4, w: 4, h: 0.38, fontSize: 16, fontFace: "Microsoft YaHei", bold: true, color: C.sky });

const audiences = [
  { icon: "📝", label: "想培养记录习惯但坚持不下来的年轻人" },
  { icon: "📈", label: "关注自我成长、希望看到进步轨迹的用户" },
  { icon: "🎮", label: "喜欢游戏化互动体验的日记初学者" },
  { icon: "💝", label: "需要情绪支持和正向引导的群体" },
];
audiences.forEach((a, i) => {
  const y = 1.85 + i * 0.78;
  s3.addShape(P.shapes.RECTANGLE, {
    x: 5.2, y: y, w: 4.4, h: 0.66,
    fill: { color: C.white }, rectRadius: 0.06, shadow: softShadow(),
  });
  s3.addText(a.icon, { x: 5.35, y: y + 0.13, w: 0.4, h: 0.4, fontSize: 18, align: "center" });
  s3.addText(a.label, { x: 5.85, y: y + 0.18, w: 3.6, h: 0.36, fontSize: 11.5, fontFace: "Microsoft YaHei", color: C.charcoal });
});

// 解决思路（底部横条）
s3.addShape(P.shapes.RECTANGLE, { x: 0.5, y: 4.72, w: 9, h: 0.74, fill: { color: C.ink }, rectRadius: 0.08 });
s3.addText("解决思路：降低记录门槛 + AI智能引导 + 游戏化激励 → 让每一份微小进步都被看见和积累", {
  x: 0.7, y: 4.88, w: 8.6, h: 0.42,
  fontSize: 13, fontFace: "Microsoft YaHei", color: C.white, align: "center",
});

// ============================================================
// SLIDE 4 — 功能介绍：雪球问你 AI 引导（配图1）
// ============================================================
let s4 = P.addSlide();
s4.background = { color: C.cream };

s4.addShape(P.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: 0.3, w: 1.65, h: 0.3, fill: { color: C.rose }, rectRadius: 0.05 });
s4.addText("AI GUIDANCE", { x: 0.5, y: 0.31, w: 1.65, h: 0.28, fontSize: 8, fontFace: "Arial", bold: true, color: C.white, align: "center" });
s4.addText("核心功能 · 雪球问你", { x: 0.5, y: 0.68, w: 8, h: 0.5, fontSize: 24, fontFace: "Microsoft YaHei", bold: true, color: C.ink });

// 左侧文字说明
s4.addText("基于智谱 GLM-4-Flash 的 AI 提问引擎", {
  x: 0.5, y: 1.25, w: 4.3, h: 0.34, fontSize: 13, fontFace: "Microsoft YaHei", bold: true, color: C.rose,
});

const aiFeatures = [
  { time: "早晨", q: "\"今天有什么小事是你想做的？\"", icon: "🌅" },
  { time: "中午", q: "\"上午有没有哪个瞬间让你觉得还不错？\"", icon: "☀️" },
  { time: "晚上", q: "\"今天最让你惊喜的一件小事是什么？\"", icon: "🌙" },
];
aiFeatures.forEach((f, i) => {
  const y = 1.68 + i * 0.84;
  s4.addShape(P.shapes.RECTANGLE, {
    x: 0.5, y: y, w: 4.3, h: 0.74,
    fill: { color: C.white }, rectRadius: 0.08, shadow: softShadow(),
  });
  s4.addText(f.icon, { x: 0.65, y: y + 0.15, w: 0.4, h: 0.4, fontSize: 18, align: "center" });
  s4.addText(f.time, { x: 1.1, y: y + 0.1, w: 0.8, h: 0.26, fontSize: 11, fontFace: "Microsoft YaHei", bold: true, color: C.sky });
  s4.addText(f.q, { x: 1.1, y: y + 0.38, w: 3.5, h: 0.3, fontSize: 10.5, fontFace: "Microsoft YaHei", color: C.charcoal });
});

s4.addText([
  { text: "✦ ", options: { fontSize: 12, color: C.rose } },
  { text: "回答后自动生成记录，支持追问深入挖掘故事", options: { fontSize: 11, fontFace: "Microsoft YaHei", color: C.slate } },
], { x: 0.5, y: 4.28, w: 4.3, h: 0.32 });

// 右侧：产品截图
const img1Path = path.join(IMG_DIR, "img1_snowball_ask.png");
if (fs.existsSync(img1Path)) {
  s4.addImage({ path: img1Path, x: 5.0, y: 1.1, w: 4.6, h: 3.7, sizing: { type: "contain", w: 4.6, h: 3.7 }, shadow: medShadow() });
} else {
  // 占位卡片
  s4.addShape(P.shapes.RECTANGLE, {
    x: 5.0, y: 1.1, w: 4.6, h: 3.7,
    fill: { color: "F0F0F0" }, rectRadius: 0.12,
    line: { color: "DDDDDD", width: 1, dashType: "dash" },
  });
  s4.addText("[雪球问你 · 产品截图]", { x: 5.0, y: 2.7, w: 4.6, h: 0.4, fontSize: 12, fontFace: "Microsoft YaHei", color: C.slate, align: "center" });
}

// ============================================================
// SLIDE 5 — 功能介绍：任务管理系统（配图2）
// ============================================================
let s5 = P.addSlide();
s5.background = { color: C.white };

s5.addShape(P.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: 0.3, w: 1.7, h: 0.3, fill: { color: C.sky }, rectRadius: 0.05 });
s5.addText("TASK SYSTEM", { x: 0.5, y: 0.31, w: 1.7, h: 0.28, fontSize: 8, fontFace: "Arial", bold: true, color: C.white, align: "center" });
s5.addText("核心功能 · 任务管理", { x: 0.5, y: 0.68, w: 8, h: 0.5, fontSize: 24, fontFace: "Microsoft YaHei", bold: true, color: C.ink });

// 左侧：任务类型表格
const taskTypes = [
  [{ text: "任务类型", options: { fill: { color: C.sky }, color: C.white, bold: true, align: "center" } },
   { text: "说明", options: { fill: { color: C.sky }, color: C.white, bold: true, align: "center" } },
   { text: "加分", options: { fill: { color: C.sky }, color: C.white, bold: true, align: "center" } }],
  [{ text: "⚡ 快速任务", options: { bold: true } }, "随手想做的事", "+2 分"],
  [{ text: "📋 普通任务", options: { bold: true } }, "日常待办事项", "+5 分"],
  [{ text: "🎯 长任务", options: { bold: true } }, "可拆解的大目标（AI辅助拆分）", "+10 分"],
  [{ text: "🔄 习惯打卡", options: { bold: true } }, "每日习惯追踪+连续天数统计", "+5 分"],
];
s5.addTable(taskTypes, {
  x: 0.5, y: 1.25, w: 4.5, h: 2.0,
  colW: [1.5, 2.0, 1.0],
  border: { pt: 0.5, color: "E0E0E0" },
  fontFace: "Microsoft YaHei",
  fontSize: 11,
  color: C.charcoal,
  align: "center", valign: "middle",
  rowH: [0.36, 0.41, 0.41, 0.41, 0.41],
  fill: { color: C.white },
});

// 视图模式
s5.addText("三种视图模式", { x: 0.5, y: 3.4, w: 3, h: 0.32, fontSize: 13, fontFace: "Microsoft YaHei", bold: true, color: C.ink });
const views = ["📝 列表视图", "📋 看板视图", "📊 四象限视图"];
views.forEach((v, i) => {
  s5.addShape(P.shapes.ROUNDED_RECTANGLE, {
    x: 0.5 + i * 1.52, y: 3.78, w: 1.42, h: 0.44,
    fill: { color: C.sky, transparency: 80 + i * 5 }, rectRadius: 0.06,
  });
  s5.addText(v, { x: 0.5 + i * 1.52, y: 3.83, w: 1.42, h: 0.36, fontSize: 10, fontFace: "Microsoft YaHei", color: C.ink, align: "center" });
});

// 右侧截图
const img2Path = path.join(IMG_DIR, "img2_tasks.png");
if (fs.existsSync(img2Path)) {
  s5.addImage({ path: img2Path, x: 5.2, y: 1.1, w: 4.5, h: 3.6, sizing: { type: "contain", w: 4.5, h: 3.6 }, shadow: medShadow() });
} else {
  s5.addShape(P.shapes.RECTANGLE, {
    x: 5.2, y: 1.1, w: 4.5, h: 3.6,
    fill: { color: "F0F0F0" }, rectRadius: 0.12,
    line: { color: "DDDDDD", width: 1, dashType: "dash" },
  });
  s5.addText("[任务管理 · 产品截图]", { x: 5.2, y: 2.65, w: 4.5, h: 0.4, fontSize: 12, fontFace: "Microsoft YaHei", color: C.slate, align: "center" });
}

// ============================================================
// SLIDE 6 — 功能介绍：挑战体系（配图3）
// ============================================================
let s6 = P.addSlide();
s6.background = { color: C.cream };

s6.addShape(P.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: 0.3, w: 1.55, h: 0.3, fill: { color: C.gold }, rectRadius: 0.05 });
s6.addText("CHALLENGES", { x: 0.5, y: 0.31, w: 1.55, h: 0.28, fontSize: 8, fontFace: "Arial", bold: true, color: C.ink, align: "center" });
s6.addText("核心功能 · 挑战体系", { x: 0.5, y: 0.68, w: 8, h: 0.5, fontSize: 24, fontFace: "Microsoft YaHei", bold: true, color: C.ink });

// 三级挑战卡片
const challenges = [
  { level: "🥉 青铜挑战", desc: "每日随机主题", examples: ["感恩瞬间", "学习收获", "运动打卡"], color: "CD7F32", bgY: 1.2 },
  { level: "🥈 白银挑战", desc: "7-21天主题挑战", examples: ["坚持记录", "连续运动", "早起计划"], color: "C0C0C0", bgY: 2.55 },
  { level: "🥇 黄金挑战", desc: "高难度长期挑战", examples: ["21天突破舒适圈"], color: "FFD700", bgY: 3.9 },
];
challenges.forEach((ch) => {
  s6.addShape(P.shapes.RECTANGLE, {
    x: 0.5, y: ch.bgY, w: 4.4, h: 1.22,
    fill: { color: C.white }, rectRadius: 0.1, shadow: softShadow(),
  });
  s6.addShape(P.shapes.RECTANGLE, { x: 0.5, y: ch.bgY, w: 0.07, h: 1.22, fill: { color: ch.color } });
  s6.addText(ch.level, { x: 0.72, y: ch.bgY + 0.12, w: 3.5, h: 0.36, fontSize: 15, fontFace: "Microsoft YaHei", bold: true, color: C.ink });
  s6.addText(ch.desc, { x: 0.72, y: ch.bgY + 0.48, w: 3.5, h: 0.26, fontSize: 11, fontFace: "Microsoft YaHei", color: C.slate });
  ch.examples.forEach((ex, ei) => {
    s6.addShape(P.shapes.ROUNDED_RECTANGLE, {
      x: 0.72 + ei * 1.38, y: ch.bgY + 0.8, w: 1.28, h: 0.32,
      fill: { color: ch.color, transparency: 82 }, rectRadius: 0.04,
    });
    s6.addText(ex, { x: 0.72 + ei * 1.38, y: ch.bgY + 0.83, w: 1.28, h: 0.26, fontSize: 9, fontFace: "Microsoft YaHei", color: C.charcoal, align: "center" });
  });
});

// 右侧截图
const img3Path = path.join(IMG_DIR, "img3_challenges.png");
if (fs.existsSync(img3Path)) {
  s6.addImage({ path: img3Path, x: 5.1, y: 1.1, w: 4.6, h: 3.8, sizing: { type: "contain", w: 4.6, h: 3.8 }, shadow: medShadow() });
} else {
  s6.addShape(P.shapes.RECTANGLE, {
    x: 5.1, y: 1.1, w: 4.6, h: 3.8,
    fill: { color: "F0F0F0" }, rectRadius: 0.12,
    line: { color: "DDDDDD", width: 1, dashType: "dash" },
  });
  s6.addText("[挑战体系 · 产品截图]", { x: 5.1, y: 2.8, w: 4.6, h: 0.4, fontSize: 12, fontFace: "Microsoft YaHei", color: C.slate, align: "center" });
}

// ============================================================
// SLIDE 7 — 功能介绍：雪球成长可视化（配图4）
// ============================================================
let s7 = P.addSlide();
s7.background = { color: C.white };

s7.addShape(P.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: 0.3, w: 1.8, h: 0.3, fill: { color: C.sky }, rectRadius: 0.05 });
s7.addText("SNOWBALL GROWTH", { x: 0.5, y: 0.31, w: 1.8, h: 0.28, fontSize: 7, fontFace: "Arial", bold: true, color: C.white, align: "center" });
s7.addText("核心功能 · 雪球成长可视化", { x: 0.5, y: 0.68, w: 8, h: 0.5, fontSize: 24, fontFace: "Microsoft YaHei", bold: true, color: C.ink });

// 三阶段进化
const stages = [
  { name: "雪粒", en: "Snowflake", range: "0-49 分", tip: "初生的可爱小云朵", color: "C5D5E8", size: 0.85 },
  { name: "小雪球", en: "Small Ball", range: "50-199 分", tip: "开始积累能量", color: C.sky, size: 1.05 },
  { name: "雪球", en: "Snow Ball", range: "200+ 分", tip: "已经很有分量啦！", color: C.ocean, size: 1.28 },
];
stages.forEach((st, i) => {
  const x = 0.6 + i * 3.08;
  // 雪球圆形
  s7.addShape(P.shapes.OVAL, {
    x: x + 0.85 - st.size / 2, y: 1.35, w: st.size, h: st.size,
    fill: { color: st.color }, shadow: softShadow(),
  });
  s7.addText(st.name, { x: x, y: 2.38, w: 2.7, h: 0.38, fontSize: 18, fontFace: "Microsoft YaHei", bold: true, color: C.ink, align: "center" });
  s7.addText(st.en, { x: x, y: 2.72, w: 2.7, h: 0.26, fontSize: 10, fontFace: "Arial", color: C.slate, align: "center" });
  // 分数范围
  s7.addShape(P.shapes.ROUNDED_RECTANGLE, { x: x + 0.55, y: 3.02, w: 1.6, h: 0.32, fill: { color: st.color, transparency: 78 }, rectRadius: 0.06 });
  s7.addText(st.range, { x: x + 0.55, y: 3.04, w: 1.6, h: 0.28, fontSize: 11, fontFace: "Arial", bold: true, color: C.ink, align: "center" });
  s7.addText(st.tip, { x: x, y: 3.4, w: 2.7, h: 0.26, fontSize: 10.5, fontFace: "Microsoft YaHei", color: C.slate, align: "center" });
  if (i < 2) {
    s7.addShape(P.shapes.RIGHT_ARROW, { x: x + 2.52, y: 1.75, w: 0.44, h: 0.32, fill: { color: C.gold } });
  }
});

// 特效说明
s7.addText("每次加分都有雪球放大动画和粒子特效，首页雪球角色可交互点击，不同阶段有不同对话文本", {
  x: 0.5, y: 3.85, w: 5.5, h: 0.4, fontSize: 11, fontFace: "Microsoft YaHei", color: C.slate,
});
s7.addText("✨ 成长看得见！", { x: 0.5, y: 4.25, w: 5.5, h: 0.32, fontSize: 13, fontFace: "Microsoft YaHei", bold: true, color: C.rose });

// 右侧截图
const img4Path = path.join(IMG_DIR, "img4_growth.png");
if (fs.existsSync(img4Path)) {
  s7.addImage({ path: img4Path, x: 5.1, y: 1.15, w: 4.6, h: 3.7, sizing: { type: "contain", w: 4.6, h: 3.7 }, shadow: medShadow() });
} else {
  s7.addShape(P.shapes.RECTANGLE, {
    x: 5.1, y: 1.15, w: 4.6, h: 3.7,
    fill: { color: "F0F0F0" }, rectRadius: 0.12,
    line: { color: "DDDDDD", width: 1, dashType: "dash" },
  });
  s7.addText("[雪球成长 · 产品截图]", { x: 5.1, y: 2.7, w: 4.6, h: 0.4, fontSize: 12, fontFace: "Microsoft YaHei", color: C.slate, align: "center" });
}

// ============================================================
// SLIDE 8 — 功能介绍：成就系统（配图5）
// ============================================================
let s8 = P.addSlide();
s8.background = { color: C.cream };

s8.addShape(P.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: 0.3, w: 1.5, h: 0.3, fill: { color: C.mint }, rectRadius: 0.05 });
s8.addText("ACHIEVEMENTS", { x: 0.5, y: 0.31, w: 1.5, h: 0.28, fontSize: 7, fontFace: "Arial", bold: true, color: C.ink, align: "center" });
s8.addText("核心功能 · 成就系统", { x: 0.5, y: 0.68, w: 8, h: 0.5, fontSize: 24, fontFace: "Microsoft YaHei", bold: true, color: C.ink });

// 左侧说明
s8.addText("内置 20+ 成就徽章，覆盖多个维度", {
  x: 0.5, y: 1.2, w: 4.5, h: 0.34, fontSize: 14, fontFace: "Microsoft YaHei", bold: true, color: C.ink,
});

const badgeLevels = [
  { level: "micro", label: "微", color: C.mint },
  { level: "minor", label: "小", color: C.sky },
  { level: "growth", label: "成", color: C.gold },
  { level: "major", label: "大", color: C.rose },
  { level: "transformation", label: "蜕变", color: C.ocean },
];
badgeLevels.forEach((bl, i) => {
  const col = i % 3;
  const row = Math.floor(i / 3);
  const x = 0.5 + col * 1.48;
  const y = 1.6 + row * 0.7;
  s8.addShape(P.shapes.OVAL, { x: x + 0.1, y: y, w: 0.5, h: 0.5, fill: { color: bl.color, transparency: 20 }, line: { color: bl.color, width: 1.5 } });
  s8.addText(bl.label, { x: x + 0.1, y: y + 0.1, w: 0.5, h: 0.32, fontSize: 11, fontFace: "Microsoft YaHei", bold: true, color: bl.color, align: "center" });
  s8.addText(bl.level, { x: x, y: y + 0.52, w: 1.28, h: 0.2, fontSize: 8, fontFace: "Arial", color: C.slate, align: "center" });
});

// 成就分类
const categories = ["记录类", "任务类", "挑战类", "交互类"];
categories.forEach((cat, i) => {
  s8.addShape(P.shapes.ROUNDED_RECTANGLE, {
    x: 0.5 + i * 1.15, y: 3.05, w: 1.05, h: 0.36,
    fill: { color: C.mint, transparency: 75 + i * 3 }, rectRadius: 0.05,
  });
  s8.addText(cat, { x: 0.5 + i * 1.15, y: 3.09, w: 1.05, h: 0.28, fontSize: 10, fontFace: "Microsoft YaHei", color: C.ink, align: "center" });
});

s8.addText("解锁成就时有特殊庆祝效果和成就消息推送", {
  x: 0.5, y: 3.55, w: 4.5, h: 0.3, fontSize: 11, fontFace: "Microsoft YaHei", color: C.slate,
});
s8.addText("🏆 每一个里程碑都值得被庆祝！", {
  x: 0.5, y: 3.95, w: 4.5, h: 0.32, fontSize: 13, fontFace: "Microsoft YaHei", bold: true, color: C.mint,
});

// 右侧截图
const img5Path = path.join(IMG_DIR, "img5_achievements.png");
if (fs.existsSync(img5Path)) {
  s8.addImage({ path: img5Path, x: 5.1, y: 1.1, w: 4.6, h: 3.8, sizing: { type: "contain", w: 4.6, h: 3.8 }, shadow: medShadow() });
} else {
  s8.addShape(P.shapes.RECTANGLE, {
    x: 5.1, y: 1.1, w: 4.6, h: 3.8,
    fill: { color: "F0F0F0" }, rectRadius: 0.12,
    line: { color: "DDDDDD", width: 1, dashType: "dash" },
  });
  s8.addText("[成就系统 · 产品截图]", { x: 5.1, y: 2.8, w: 4.6, h: 0.4, fontSize: 12, fontFace: "Microsoft YaHei", color: C.slate, align: "center" });
}

// ============================================================
// SLIDE 9 — 更多功能一览
// ============================================================
let s9 = P.addSlide();
s9.background = { color: C.white };

s9.addShape(P.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: 0.35, w: 1.5, h: 0.32, fill: { color: C.rose }, rectRadius: 0.05 });
s9.addText("MORE FEATURES", { x: 0.5, y: 0.36, w: 1.5, h: 0.30, fontSize: 7, fontFace: "Arial", bold: true, color: C.white, align: "center" });
s9.addText("更多精彩功能", { x: 0.5, y: 0.78, w: 8, h: 0.55, fontSize: 26, fontFace: "Microsoft YaHei", bold: true, color: C.ink });

const moreFeatures = [
  { icon: "💬", title: "AI 智能反馈与对话", desc: "记录完成后自动生成个性化反馈，支持连续对话深入交流，对话历史完整保存形成思考脉络", color: C.rose },
  { icon: "📊", title: "数据分析与回顾", desc: "提供成长时间线、情绪趋势分析、记录频率统计等可视化数据，直观呈现成长轨迹和变化趋势", color: C.sky },
  { icon: "🎉", title: "每日首次记录庆祝", desc: "每天第一次记录时触发特殊庆祝效果，让开启每一天的记录充满仪式感", color: C.gold },
  { icon: "🏠", title: "拖延急救功能", desc: "当用户想要拖延时，AI 帮助将大目标拆分为可执行的小步骤，逐步克服拖延", color: C.mint },
];
moreFeatures.forEach((mf, i) => {
  const col = i % 2;
  const row = Math.floor(i / 2);
  const x = 0.5 + col * 4.7;
  const y = 1.4 + row * 2.0;
  s9.addShape(P.shapes.RECTANGLE, {
    x: x, y: y, w: 4.5, h: 1.85,
    fill: { color: C.lightBg }, rectRadius: 0.1, shadow: softShadow(),
  });
  s9.addShape(P.shapes.RECTANGLE, { x: x, y: y, w: 0.07, h: 1.85, fill: { color: mf.color } });
  s9.addText(mf.icon, { x: x + 0.2, y: y + 0.15, w: 0.5, h: 0.5, fontSize: 24, align: "center" });
  s9.addText(mf.title, { x: x + 0.75, y: y + 0.2, w: 3.5, h: 0.36, fontSize: 15, fontFace: "Microsoft YaHei", bold: true, color: C.ink });
  s9.addText(mf.desc, { x: x + 0.2, y: y + 0.65, w: 4.1, h: 1.05, fontSize: 11.5, fontFace: "Microsoft YaHei", color: C.charcoal, valign: "top" });
});

// ============================================================
// SLIDE 10 — 技术架构
// ============================================================
let s10 = P.addSlide();
s10.background = { color: C.ink };

s10.addText("TECH ARCHITECTURE", { x: 0.5, y: 0.28, w: 5, h: 0.28, fontSize: 9, fontFace: "Arial", bold: true, color: C.sky, charSpacing: 1.5 });
s10.addText("技术架构", { x: 0.5, y: 0.58, w: 8, h: 0.5, fontSize: 26, fontFace: "Microsoft YaHei", bold: true, color: C.white });

// 架构分层
const layers = [
  { name: "前端展示层", items: ["Next.js 16 App Router", "React 19 + TypeScript", "Framer Motion 动画", "Recharts 数据可视化"], c: C.rose, y: 1.2, h: 1.02 },
  { name: "API 路由层", items: ["Next.js API Routes", "服务端逻辑处理"], c: C.sky, y: 2.32, h: 0.62 },
  { name: "业务逻辑层", items: ["local-db.ts 本地数据持久化", "score-engine.ts 积分事件引擎", "achievement-engine.ts 成就系统", "AI 对话模块 (GLM-4-Flash)"], c: C.mint, y: 3.0, h: 1.02 },
  { name: "数据存储层", items: ["本地 JSON 文件系统", "纯事件驱动加分架构"], c: C.gold, y: 4.08, h: 0.56 },
];
layers.forEach((ly) => {
  // 层名
  s10.addShape(P.shapes.ROUNDED_RECTANGLE, { x: 0.45, y: ly.y, w: 1.85, h: ly.h > 0.7 ? 0.42 : ly.h * 0.78, fill: { color: ly.c }, rectRadius: 0.06 });
  s10.addText(ly.name, { x: 0.45, y: ly.y + 0.07, w: 1.85, h: ly.h > 0.7 ? 0.3 : ly.h * 0.78 - 0.08, fontSize: 11.5, fontFace: "Microsoft YaHei", bold: true, color: C.ink, align: "center" });
  // 内容区
  s10.addShape(P.shapes.RECTANGLE, {
    x: 2.45, y: ly.y, w: 7.1, h: ly.h,
    fill: { color: "FFFFFF", transparency: 94 }, rectRadius: 0.06,
    line: { color: ly.c, width: 0.75, dashType: "dash" },
  });
  ly.items.forEach((item, ii) => {
    s10.addText("▸ " + item, { x: 2.6, y: ly.y + 0.1 + ii * (ly.h > 0.7 ? 0.22 : 0.24), w: 6.6, h: 0.21, fontSize: 10.5, fontFace: "Microsoft YaHei", color: "BBC0CF" });
  });
});

// ============================================================
// SLIDE 11 — 技术栈详情
// ============================================================
let s11 = P.addSlide();
s11.background = { color: C.cream };

s11.addShape(P.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: 0.35, w: 1.4, h: 0.32, fill: { color: C.ocean }, rectRadius: 0.05 });
s11.addText("TECH STACK", { x: 0.5, y: 0.36, w: 1.4, h: 0.30, fontSize: 8, fontFace: "Arial", bold: true, color: C.white, align: "center" });
s11.addText("技术栈详情", { x: 0.5, y: 0.78, w: 6, h: 0.55, fontSize: 24, fontFace: "Microsoft YaHei", bold: true, color: C.ink });

const techStack = [
  { cat: "框架", items: ["Next.js 16", "React 19", "App Router"], c: C.rose },
  { cat: "语言", items: ["TypeScript 5+", "类型安全"], c: C.rose },
  { cat: "动画", items: ["Framer Motion", "流畅交互"], c: C.sky },
  { cat: "图表", items: ["Recharts", "数据可视化"], c: C.sky },
  { cat: "AI", items: ["智谱 GLM-4-Flash", "智能对话"], c: C.mint },
  { cat: "测试", items: ["Vitest", "612 个用例"], c: C.mint },
  { cat: "存储", items: ["本地 JSON", "零配置部署"], c: C.gold },
  { cat: "工具", items: ["Trae AI", "全程辅助开发"], c: C.gold },
];
techStack.forEach((ts, i) => {
  const col = i % 4;
  const row = Math.floor(i / 4);
  const x = 0.5 + col * 2.36;
  const y = 1.4 + row * 2.05;
  s11.addShape(P.shapes.RECTANGLE, {
    x: x, y: y, w: 2.22, h: 1.9,
    fill: { color: C.white }, rectRadius: 0.1, shadow: softShadow(),
  });
  s11.addShape(P.shapes.RECTANGLE, { x: x, y: y, w: 2.22, h: 0.05, fill: { color: ts.c } });
  s11.addText(ts.cat, { x: x, y: y + 0.18, w: 2.22, h: 0.34, fontSize: 13, fontFace: "Microsoft YaHei", bold: true, color: ts.c, align: "center" });
  ts.items.forEach((it, ii) => {
    s11.addText(it, { x: x + 0.1, y: y + 0.58 + ii * 0.38, w: 2.02, h: 0.34, fontSize: 11, fontFace: "Microsoft YaHei", color: C.slate, align: "center" });
  });
});

// ============================================================
// SLIDE 12 — 项目亮点
// ============================================================
let s12 = P.addSlide();
s12.background = { color: C.ink };

s12.addText("HIGHLIGHTS", { x: 0.5, y: 0.28, w: 4, h: 0.28, fontSize: 9, fontFace: "Arial", bold: true, color: C.blush, charSpacing: 2 });
s12.addText("项目亮点", { x: 0.5, y: 0.58, w: 8, h: 0.5, fontSize: 26, fontFace: "Microsoft YaHei", bold: true, color: C.white });

const highlights = [
  { icon: "🤖", t: "纯 AI 辅助开发", d: "全部代码通过 Trae AI 编程助手编写，体现 AI 编程效率", c: C.rose },
  { icon: "✅", t: "完整测试覆盖", d: "25 个测试文件、612 个测试用例，全部通过", c: C.sky },
  { icon: "⚡", t: "纯事件驱动架构", d: "积分系统彻底的事件驱动设计，消除双倍加分和数据不一致", c: C.mint },
  { icon: "💝", t: "温暖设计理念", d: "从交互到文案，始终传递\"每一份进步都值得被看见\"", c: C.gold },
  { icon: "🎮", t: "游戏化体验", d: "雪球成长 + 等级挑战 + 成就徽章，让记录变成有趣的游戏", c: C.rose },
  { icon: "🔒", t: "隐私优先", d: "本地数据存储，用户完全掌控自己的数据", c: C.sky },
  { icon: "🔄", t: "持续迭代", d: "多次重构优化，从基础功能到完整产品的演进", c: C.mint },
  { icon: "📱", t: "响应式设计", d: "适配多端设备，随时随地记录微成功", c: C.gold },
];
highlights.forEach((h, i) => {
  const col = i % 4;
  const row = Math.floor(i / 4);
  const x = 0.42 + col * 2.38;
  const y = 1.2 + row * 2.15;
  s12.addShape(P.shapes.RECTANGLE, {
    x: x, y: y, w: 2.22, h: 2.0,
    fill: { color: "FFFFFF", transparency: 94 }, rectRadius: 0.1,
    line: { color: h.c, width: 1 },
  });
  s12.addText(h.icon, { x: x, y: y + 0.15, w: 2.22, h: 0.46, fontSize: 24, align: "center" });
  s12.addText(h.t, { x: x, y: y + 0.66, w: 2.22, h: 0.36, fontSize: 13, fontFace: "Microsoft YaHei", bold: true, color: C.white, align: "center" });
  s12.addText(h.d, { x: x + 0.1, y: y + 1.08, w: 2.02, h: 0.78, fontSize: 9.5, fontFace: "Microsoft YaHei", color: "99A0B8", align: "center" });
});

// ============================================================
// SLIDE 13 — 结束页
// ============================================================
let s13 = P.addSlide();
s13.background = { color: C.ink };

// 装饰圆
s13.addShape(P.shapes.OVAL, { x: -1.8, y: 2.8, w: 5, h: 5, fill: { color: C.rose, transparency: 90 } });
s13.addShape(P.shapes.OVAL, { x: 7.5, y: -1.5, w: 4, h: 4, fill: { color: C.sky, transparency: 90 } });
s13.addShape(P.shapes.OVAL, { x: 8.0, y: 3.5, w: 3, h: 3, fill: { color: C.mint, transparency: 92 } });

// Thank You
s13.addText("Thank You", {
  x: 0.5, y: 1.3, w: 9, h: 0.95,
  fontSize: 50, fontFace: "Georgia", bold: true, color: C.white, align: "center",
});
s13.addText("谢谢观看", {
  x: 0.5, y: 2.22, w: 9, h: 0.55,
  fontSize: 24, fontFace: "Microsoft YaHei", color: C.blush, align: "center",
});
s13.addText("让每一天的努力都被看见", {
  x: 0.5, y: 2.95, w: 9, h: 0.45,
  fontSize: 16, fontFace: "Microsoft YaHei", color: "888AA0", align: "center",
});
// 分隔线
s13.addShape(P.shapes.RECTANGLE, { x: 3.8, y: 3.55, w: 2.4, h: 0.034, fill: { color: C.rose } });
// 品牌
s13.addText("❄️ 雪球日记 · Snowball Diary", {
  x: 0.5, y: 3.72, w: 9, h: 0.38,
  fontSize: 13, fontFace: "Microsoft YaHei", color: "666880", align: "center",
});
s13.addText("© 2026 Snowball Diary · 微成功记录助手", {
  x: 0.5, y: 5.15, w: 9, h: 0.28,
  fontSize: 9, fontFace: "Arial", color: "555670", align: "center",
});

// ============================================================
// 输出
// ============================================================
const OUT_PATH = path.join(__dirname, "雪球日记_产品介绍.pptx");
console.log(`Generating PPT: ${OUT_PATH} (${P.slides.length} slides)...`);
P.writeFile({ fileName: OUT_PATH })
  .then(f => console.log(`\nDone! Generated: ${f}\nTotal slides: ${P.slides.length}`))
  .catch(e => console.error("Error:", e));
