const pptxgen = require("pptxgenjs");
const path = require("path");
const fs = require("fs");

// ============================================================
// 精致配色方案 - 深沉优雅，非模板感
// ============================================================
const C = {
  // 主色系 - 玫瑰粉 + 天空蓝 渐变感
  rose: "E85D75",        // 玫瑰红（主强调）
  blush: "FFB5C2",       // 腮红粉（柔和主色）
  sky: "7EC8E3",         // 天空蓝（辅色）
  ocean: "4A90A4",       // 海洋蓝（深辅色）
  mint: "6BCB9A",        // 薄荷绿（成长/成就）
  gold: "F0C65D",        // 暖金（高亮）
  
  // 中性色
  ink: "1A1B2E",         // 墨黑（标题/深色背景文字）
  charcoal: "3D405B",     // 炭灰（副标题）
  slate: "5C6378",       // 石板灰（正文）
  fog: "E8EAED",         // 雾白（浅背景）
  cream: "FAF7F2",       // 奶油白（暖背景）
  white: "FFFFFF",
};

const SHADOW = () => ({ type: "outer", blur: 8, offset: 3, angle: 135, opacity: 0.10 });
const SOFT_SHADOW = () => ({ type: "outer", blur: 12, offset: 4, angle: 135, opacity: 0.06 });
const IMG_DIR = path.join(__dirname, "screenshots");
const OUT = path.join(__dirname, "雪球日记_产品介绍.pptx");

const P = new pptxgen();
P.layout = "LAYOUT_16x9";
P.author = "雪球日记";
P.title = "雪球日记 · 产品介绍";

// ============================================================
// SLIDE 1 — 封面（全屏冲击力）
// ============================================================
let s1 = P.addSlide();
s1.background = { color: C.ink };

// 右侧大渐变圆形装饰
s1.addShape(P.shapes.OVAL, { x: 6.2, y: -1.5, w: 6, h: 6, fill: { color: C.rose, transparency: 85 } });
s1.addShape(P.shapes.OVAL, { x: 7.5, y: 1.5, w: 4.5, h: 4.5, fill: { color: C.sky, transparency: 88 } });
s1.addShape(P.shapes.OVAL, { x: -1, y: 3.2, w: 3.5, h: 3.5, fill: { color: C.mint, transparency: 90 } });

// 左上角小标签
s1.addShape(P.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: 0.5, w: 1.6, h: 0.38, fill: { color: C.rose }, rectRadius: 0.06 });
s1.addText("PRODUCT INTRO", { x: 0.5, y: 0.52, w: 1.6, h: 0.34, fontSize: 9, fontFace: "Arial", bold: true, color: C.white, align: "center", charSpacing: 1 });

// 主标题
s1.addText("雪球日记", {
  x: 0.5, y: 1.6, w: 7, h: 1.2,
  fontSize: 56, fontFace: "Microsoft YaHei", bold: true, color: C.white
});
// 副标题
s1.addText("让微小的成功被看见", {
  x: 0.5, y: 2.75, w: 7, h: 0.7,
  fontSize: 26, fontFace: "Microsoft YaHei", color: C.blush
});
// 分隔线
s1.addShape(P.shapes.RECTANGLE, { x: 0.5, y: 3.55, w: 1.8, h: 0.05, fill: { color: C.rose } });
// 描述
s1.addText("AI 陪伴驱动 × 可视化成长轨迹 × 正向反馈循环", {
  x: 0.5, y: 3.75, w: 7, h: 0.5,
  fontSize: 15, fontFace: "Microsoft YaHei", color: "999BB3"
});
// 底部信息
s1.addText("Snowball Diary · V3.0", {
  x: 0.5, y: 5.0, w: 4, h: 0.35,
  fontSize: 11, fontFace: "Arial", color: "666880"
});

// ============================================================
// SLIDE 2 — 目录（简洁双列）
// ============================================================
let s2 = P.addSlide();
s2.background = { color: C.cream };

// 顶部装饰条
s2.addShape(P.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.rose } });

s2.addText("CONTENTS", { x: 0.6, y: 0.4, w: 3, h: 0.35, fontSize: 11, fontFace: "Arial", bold: true, color: C.rose, charSpacing: 2 });
s2.addText("内容概览", { x: 0.6, y: 0.72, w: 5, h: 0.55, fontSize: 28, fontFace: "Microsoft YaHei", bold: true, color: C.ink });

const toc = [
  { n: "01", t: "产品概述与价值主张" },
  { n: "02", t: "功能展示与核心特性" },
  { n: "03", t: "技术架构设计" },
  { n: "04", t: "技术栈与实现细节" },
  { n: "05", t: "产品亮点与优势" },
  { n: "06", t: "未来规划路线图" },
];
toc.forEach((item, i) => {
  const col = i % 2;
  const row = Math.floor(i / 2);
  const x = col === 0 ? 0.8 : 5.2;
  const y = 1.55 + row * 1.25;

  // 数字
  s2.addText(item.n, { x: x, y: y, w: 0.65, h: 0.55, fontSize: 22, fontFace: "Arial", bold: true, color: C.rose });
  // 标题
  s2.addText(item.t, { x: x + 0.75, y: y + 0.08, w: 3.8, h: 0.45, fontSize: 17, fontFace: "Microsoft YaHei", color: C.charcoal });
  // 分隔线
  if (i < toc.length - 1) {
    s2.addShape(P.shapes.RECTANGLE, { x: x, y: y + 0.65, w: 4.2, h: 0.01, fill: { color: "DDDDE5" } });
  }
});

// 右下角装饰
s2.addShape(P.shapes.OVAL, { x: 8.3, y: 3.8, w: 2.5, h: 2.5, fill: { color: C.sky, transparency: 90 } });

// ============================================================
// SLIDE 3 — 问题痛点（大字冲击 + 卡片）
// ============================================================
let s3 = P.addSlide();
s3.background = { color: C.white };

// 顶部标签
s3.addShape(P.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 0.45, w: 1.3, h: 0.34, fill: { color: C.rose }, rectRadius: 0.05 });
s3.addText("CHAPTER 01", { x: 0.6, y: 0.46, w: 1.3, h: 0.32, fontSize: 8, fontFace: "Arial", bold: true, color: C.white, align: "center" });
s3.addText("为什么你需要雪球日记？", { x: 0.6, y: 0.95, w: 8, h: 0.6, fontSize: 26, fontFace: "Microsoft YaHei", bold: true, color: C.ink });

const pains = [
  { icon: "🔍", title: "进步不可见", sub: "每天都在努力，却感觉不到变化" },
  { icon: "🔋", title: "动力枯竭", sub: "缺乏正向反馈，容易半途而废" },
  { icon: "😵‍💫", title: "拖延成瘾", sub: "目标太大，不知道从哪开始" },
  { icon: "📈", title: "习惯难养", sub: "缺少持续记录与追踪机制" },
];
pains.forEach((p, i) => {
  const x = 0.55 + i * 2.35;
  // 卡片
  s3.addShape(P.shapes.RECTANGLE, {
    x: x, y: 1.85, w: 2.2, h: 3.3,
    fill: { color: C.cream }, rectRadius: 0.14, shadow: SOFT_SHADOW()
  });
  // 顶部色条
  s3.addShape(P.shapes.RECTANGLE, { x: x, y: 1.85, w: 2.2, h: 0.07, fill: { color: [C.rose, C.sky, C.mint, C.gold][i] } });
  // 图标圆圈
  s3.addShape(P.shapes.OVAL, { x: x + 0.7, y: 2.15, w: 0.8, h: 0.8, fill: { color: C.white }, line: { color: "E0E0E0", width: 1 } });
  s3.addText(p.icon, { x: x + 0.7, y: 2.27, w: 0.8, h: 0.56, fontSize: 24, align: "center" });
  // 文字
  s3.addText(p.title, { x: x + 0.1, y: 3.1, w: 2.0, h: 0.42, fontSize: 16, fontFace: "Microsoft YaHei", bold: true, color: C.ink, align: "center" });
  s3.addText(p.sub, { x: x + 0.15, y: 3.55, w: 1.9, h: 0.9, fontSize: 11, fontFace: "Microsoft YaHei", color: C.slate, align: "center", valign: "top" });
});

// 底部引言
s3.addShape(P.shapes.RECTANGLE, { x: 1.5, y: 5.3, w: 7, h: 0.02, fill: { color: C.fog } });

// ============================================================
// SLIDE 4 — 解决方案（深色背景 + 流程图）
// ============================================================
let s4 = P.addSlide();
s4.background = { color: C.ink };

s4.addText("解决方案", { x: 0.6, y: 0.4, w: 5, h: 0.45, fontSize: 12, fontFace: "Arial", bold: true, color: C.blush, charSpacing: 2 });
s4.addText("滚雪球式成长引擎", { x: 0.6, y: 0.82, w: 8, h: 0.7, fontSize: 30, fontFace: "Microsoft YaHei", bold: true, color: C.white });

// 流程节点
const flow = [
  { label: "记录\n小成功", c: C.rose },
  { label: "雪球\n变大", c: C.sky },
  { label: "解锁\n成就", c: C.mint },
  { label: "获得\n动力", c: C.gold },
];
flow.forEach((f, i) => {
  const x = 0.6 + i * 2.38;
  // 圆形节点
  s4.addShape(P.shapes.OVAL, { x: x, y: 1.85, w: 1.85, h: 1.85, fill: { color: f.c }, shadow: { type: "outer", blur: 12, offset: 3, angle: 135, opacity: 0.2 } });
  s4.addText(f.label, { x: x, y: 2.35, w: 1.85, h: 0.85, fontSize: 14, fontFace: "Microsoft YaHei", bold: true, color: C.ink, align: "center", valign: "middle" });
  if (i < 3) {
    s4.addShape(P.shapes.RIGHT_ARROW, { x: x + 1.92, y: 2.58, w: 0.42, h: 0.38, fill: { color: "FFFFFF", transparency: 70 } });
  }
});
// 回环弧线提示
s4.addShape(P.shapes.ARC, { x: 0.3, y: 3.85, w: 9.4, h: 1.5, line: { color: "FFFFFF", width: 1, dashType: "dash" }, transparency: 60 });

// Slogan
s4.addText([
  { text: '"', options: { fontSize: 40, color: C.rose, fontFace: "Georgia", italic: true } },
  { text: "每天记录一个小成功，雪球会越来越大", options: { fontSize: 22, color: C.white, fontFace: "Microsoft YaHei", breakLine: true } },
  { text: '"', options: { fontSize: 40, color: C.rose, fontFace: "Georgia", italic: true } },
], { x: 0.6, y: 4.15, w: 8.8, h: 1.2, align: "center", valign: "middle" });

// ============================================================
// SLIDE 5 — 功能总览（图标网格）
// ============================================================
let s5 = P.addSlide();
s5.background = { color: C.cream };

s5.addShape(P.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 0.4, w: 1.2, h: 0.32, fill: { color: C.sky }, rectRadius: 0.05 });
s5.addText("CHAPTER 02", { x: 0.6, y: 0.41, w: 1.2, h: 0.30, fontSize: 8, fontFace: "Arial", bold: true, color: C.white, align: "center" });
s5.addText("六大核心功能模块", { x: 0.6, y: 0.85, w: 8, h: 0.55, fontSize: 26, fontFace: "Microsoft YaHei", bold: true, color: C.ink });

const feats = [
  { icon: "✍️", name: "快速记录", desc: "3秒完成，AI自动打标", c: C.rose },
  { icon: "❄️", name: "雪球成长", desc: "可视化进化，庆祝动画", c: C.sky },
  { icon: "🎯", name: "任务管理", desc: "四象限优先级系统", c: C.mint },
  { icon: "🏆", name: "成就体系", desc: "37个成就持续激励", c: C.gold },
  { icon: "🤖", name: "AI陪伴", desc: "智能反馈+拖延急救", c: C.rose },
  { icon: "📊", name: "成长洞察", desc: "时间线+数据分析", c: C.sky },
];
feats.forEach((f, i) => {
  const col = i % 3;
  const row = Math.floor(i / 3);
  const x = 0.55 + col * 3.12;
  const y = 1.55 + row * 1.95;
  // 白底卡片
  s5.addShape(P.shapes.RECTANGLE, {
    x: x, y: y, w: 2.95, h: 1.78,
    fill: { color: C.white }, rectRadius: 0.12, shadow: SOFT_SHADOW()
  });
  // 左侧彩色竖线
  s5.addShape(P.shapes.RECTANGLE, { x: x, y: y + 0.2, w: 0.06, h: 0.9, fill: { color: f.c } });
  // 图标
  s5.addText(f.icon, { x: x + 0.2, y: y + 0.25, w: 0.6, h: 0.55, fontSize: 26, align: "center" });
  // 名称
  s5.addText(f.name, { x: x + 0.85, y: y + 0.28, w: 1.9, h: 0.38, fontSize: 16, fontFace: "Microsoft YaHei", bold: true, color: C.ink });
  // 描述
  s5.addText(f.desc, { x: x + 0.2, y: y + 1.1, w: 2.55, h: 0.5, fontSize: 11, fontFace: "Microsoft YaHei", color: C.slate, align: "center" });
});

// ============================================================
// SLIDE 6 — 首页截图（全屏展示 + 说明）
// ============================================================
let s6 = P.addSlide();
s6.background = { color: C.fog };

// 顶部标签区
s6.addShape(P.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 1.0, fill: { color: C.white } });
s6.addShape(P.shapes.RECTANGLE, { x: 0, y: 0.96, w: 10, h: 0.04, fill: { color: C.rose } });
s6.addText("产品首页", { x: 0.6, y: 0.28, w: 4, h: 0.45, fontSize: 20, fontFace: "Microsoft YaHei", bold: true, color: C.ink });
s6.addText("温暖视觉设计 · 清晰功能入口 · 雪球角色陪伴", { x: 0.6, y: 0.62, w: 6, h: 0.3, fontSize: 11, fontFace: "Microsoft YaHei", color: C.slate });

// 截图容器（圆角白色卡片）
const hp = path.join(IMG_DIR, "homepage.png");
if (fs.existsSync(hp)) {
  // 外框阴影效果
  s6.addShape(P.shapes.RECTANGLE, {
    x: 0.5, y: 1.2, w: 9.0, h: 4.15,
    fill: { color: C.white }, rectRadius: 0.12, shadow: { type: "outer", blur: 20, offset: 5, angle: 135, opacity: 0.08 }
  });
  s6.addImage({ path: hp, x: 0.65, y: 1.35, w: 8.7, h: 3.85, sizing: { type: "contain", w: 8.7, h: 3.85 } });
}

// ============================================================
// SLIDE 7 — 任务管理（左图右文）
// ============================================================
let s7 = P.addSlide();
s7.background = { color: C.white };

s7.addShape(P.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 0.35, w: 1.4, h: 0.32, fill: { color: C.mint }, rectRadius: 0.05 });
s7.addText("TASK SYSTEM", { x: 0.6, y: 0.36, w: 1.4, h: 0.30, fontSize: 8, fontFace: "Arial", bold: true, color: C.white, align: "center" });
s7.addText("任务管理系统", { x: 0.6, y: 0.78, w: 5, h: 0.55, fontSize: 24, fontFace: "Microsoft YaHei", bold: true, color: C.ink });

// 左侧截图
const tp = path.join(IMG_DIR, "tasks.png");
if (fs.existsSync(tp)) {
  s7.addShape(P.shapes.RECTANGLE, {
    x: 0.4, y: 1.4, w: 5.4, h: 4.0,
    fill: { color: C.fog }, rectRadius: 0.1, shadow: SOFT_SHADOW()
  });
  s7.addImage({ path: tp, x: 0.55, y: 1.55, w: 5.1, h: 3.7, sizing: { type: "contain", w: 5.1, h: 3.7 } });
}

// 右侧功能列表
const taskFeats = [
  { title: "四象限优先级", desc: "按紧急/重要程度智能分类任务", icon: "🎯" },
  { title: "长任务分解", desc: "将大目标拆解为可执行的小步骤", icon: "🔨" },
  { title: "习惯打卡追踪", desc: "每日/每周重复，培养好习惯", icon: "✅" },
  { title: "快速随手记", desc: "简单事项一键创建立即完成", icon: "⚡" },
];
taskFeats.forEach((tf, i) => {
  const y = 1.4 + i * 1.02;
  s7.addShape(P.shapes.RECTANGLE, {
    x: 6.05, y: y, w: 3.55, h: 0.9,
    fill: { color: C.cream }, rectRadius: 0.08, shadow: SHADOW()
  });
  s7.addText(tf.icon, { x: 6.2, y: y + 0.18, w: 0.5, h: 0.5, fontSize: 20, align: "center" });
  s7.addText(tf.title, { x: 6.78, y: y + 0.12, w: 2.65, h: 0.36, fontSize: 13, fontFace: "Microsoft YaHei", bold: true, color: C.ink });
  s7.addText(tf.desc, { x: 6.78, y: y + 0.48, w: 2.65, h: 0.32, fontSize: 10, fontFace: "Microsoft YaHei", color: C.slate });
});

// ============================================================
// SLIDE 8 — 记录系统（左图右文）
// ============================================================
let s8 = P.addSlide();
s8.background = { color: C.cream };

s8.addShape(P.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 0.35, w: 1.4, h: 0.32, fill: { color: C.sky }, rectRadius: 0.05 });
s8.addText("RECORD SYSTEM", { x: 0.6, y: 0.36, w: 1.4, h: 0.30, fontSize: 8, fontFace: "Arial", bold: true, color: C.white, align: "center" });
s8.addText("记录系统", { x: 0.6, y: 0.78, w: 5, h: 0.55, fontSize: 24, fontFace: "Microsoft YaHei", bold: true, color: C.ink });

const rp = path.join(IMG_DIR, "records.png");
if (fs.existsSync(rp)) {
  s8.addShape(P.shapes.RECTANGLE, {
    x: 0.4, y: 1.4, w: 5.4, h: 4.0,
    fill: { color: C.white }, rectRadius: 0.1, shadow: SOFT_SHADOW()
  });
  s8.addImage({ path: rp, x: 0.55, y: 1.55, w: 5.1, h: 3.7, sizing: { type: "contain", w: 5.1, h: 3.7 } });
}

const recFeats = [
  { title: "3秒快速记录", desc: "一句话记下今日小成功", icon: "⚡" },
  { title: "AI智能打标", desc: "自动分析内容生成标签", icon: "🏷️" },
  { title: "情感分析识别", desc: "感知情绪状态提供反馈", icon: "💭" },
  { title: "每日引导提问", desc: "激发深度自我反思", icon: "❓" },
];
recFeats.forEach((rf, i) => {
  const y = 1.4 + i * 1.02;
  s8.addShape(P.shapes.RECTANGLE, {
    x: 6.05, y: y, w: 3.55, h: 0.9,
    fill: { color: C.white }, rectRadius: 0.08, shadow: SHADOW()
  });
  s8.addText(rf.icon, { x: 6.2, y: y + 0.18, w: 0.5, h: 0.5, fontSize: 20, align: "center" });
  s8.addText(rf.title, { x: 6.78, y: y + 0.12, w: 2.65, h: 0.36, fontSize: 13, fontFace: "Microsoft YaHei", bold: true, color: C.ink });
  s8.addText(rf.desc, { x: 6.78, y: y + 0.48, w: 2.65, h: 0.32, fontSize: 10, fontFace: "Microsoft YaHei", color: C.slate });
});

// ============================================================
// SLIDE 9 — 成就体系（左图右数据）
// ============================================================
let s9 = P.addSlide();
s9.background = { color: C.white };

s9.addShape(P.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 0.35, w: 1.4, h: 0.32, fill: { color: C.gold }, rectRadius: 0.05 });
s9.addText("ACHIEVEMENTS", { x: 0.6, y: 0.36, w: 1.4, h: 0.30, fontSize: 8, fontFace: "Arial", bold: true, color: C.ink, align: "center" });
s9.addText("成就体系", { x: 0.6, y: 0.78, w: 5, h: 0.55, fontSize: 24, fontFace: "Microsoft YaHei", bold: true, color: C.ink });

const pp = path.join(IMG_DIR, "profile.png");
if (fs.existsSync(pp)) {
  s9.addShape(P.shapes.RECTANGLE, {
    x: 0.4, y: 1.4, w: 5.4, h: 4.0,
    fill: { color: C.fog }, rectRadius: 0.1, shadow: SOFT_SHADOW()
  });
  s9.addImage({ path: pp, x: 0.55, y: 1.55, w: 5.1, h: 3.7, sizing: { type: "contain", w: 5.1, h: 3.7 } });
}

// 右侧数据面板
s9.addText("37 个成就 · 7 大分类", { x: 6.0, y: 1.35, w: 3.6, h: 0.4, fontSize: 16, fontFace: "Microsoft YaHei", bold: true, color: C.gold, align: "center" });

const achCats = [
  { cat: "记录里程碑", n: 8 }, { cat: "连续天数奖", n: 8 },
  { cat: "挑战类成就", n: 5 }, { cat: "任务类成就", n: 2 },
  { cat: "互动类成就", n: 3 }, { cat: "隐藏成就", n: 3 },
  { cat: "大师级成就", n: 1 },
];
achCats.forEach((ac, i) => {
  const y = 1.85 + i * 0.5;
  s9.addText(ac.cat, { x: 6.1, y: y, w: 2.2, h: 0.35, fontSize: 11, fontFace: "Microsoft YaHei", color: C.charcoal });
  s9.addText(String(ac.n), { x: 8.5, y: y, w: 0.8, h: 0.35, fontSize: 12, fontFace: "Arial", bold: true, color: C.rose, align: "right" });
  // 进度条
  s9.addShape(P.shapes.RECTANGLE, { x: 6.1, y: y + 0.32, w: 3.2, h: 0.08, fill: { color: "F0F0F0" } });
  s9.addShape(P.shapes.RECTANGLE, { x: 6.1, y: y + 0.32, w: (ac.n / 8) * 3.2, h: 0.08, fill: { color: C.rose } });
});

// ============================================================
// SLIDE 10 — 雪球成长系统（三阶段可视化）
// ============================================================
let s10 = P.addSlide();
s10.background = { color: C.cream };

s10.addShape(P.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 0.35, w: 1.8, h: 0.32, fill: { color: C.sky }, rectRadius: 0.05 });
s10.addText("SNOWBALL GROWTH", { x: 0.6, y: 0.36, w: 1.8, h: 0.30, fontSize: 8, fontFace: "Arial", bold: true, color: C.white, align: "center" });
s10.addText("雪球成长系统", { x: 0.6, y: 0.78, w: 6, h: 0.55, fontSize: 24, fontFace: "Microsoft YaHei", bold: true, color: C.ink });

// 三阶段进化图
const stages = [
  { name: "Snowflake", cn: "雪粒", range: "0-49 分", tip: "初生可爱小云朵", color: "C5D5E8", r: 0.85 },
  { name: "Small Ball", cn: "小雪球", range: "50-199 分", tip: "开始积累能量", color: C.sky, r: 1.1 },
  { name: "Snow Ball", cn: "雪球", range: "200+ 分", tip: "已经很有分量啦", color: C.ocean, r: 1.35 },
];
stages.forEach((st, i) => {
  const x = 0.9 + i * 3.1;
  // 雪球圆形
  s10.addShape(P.shapes.OVAL, {
    x: x + 0.7 - st.r / 2, y: 1.5, w: st.r, h: st.r,
    fill: { color: st.color }, shadow: { type: "outer", blur: 10, offset: 2, angle: 135, opacity: 0.15 }
  });
  // 名称
  s10.addText(st.cn, { x: x, y: 2.65, w: 2.6, h: 0.4, fontSize: 20, fontFace: "Microsoft YaHei", bold: true, color: C.ink, align: "center" });
  s10.addText(st.name, { x: x, y: 3.0, w: 2.6, h: 0.28, fontSize: 11, fontFace: "Arial", color: C.slate, align: "center" });
  // 分数范围标签
  s10.addShape(P.shapes.ROUNDED_RECTANGLE, { x: x + 0.55, y: 3.32, w: 1.5, h: 0.34, fill: { color: st.color, transparency: 80 }, rectRadius: 0.06 });
  s10.addText(st.range, { x: x + 0.55, y: 3.34, w: 1.5, h: 0.30, fontSize: 11, fontFace: "Arial", bold: true, color: C.ink, align: "center" });
  // 描述
  s10.addText(st.tip, { x: x, y: 3.72, w: 2.6, h: 0.28, fontSize: 11, fontFace: "Microsoft YaHei", color: C.slate, align: "center" });
  // 箭头
  if (i < 2) {
    s10.addShape(P.shapes.RIGHT_ARROW, { x: x + 2.55, y: 1.95, w: 0.48, h: 0.35, fill: { color: C.gold } });
  }
});

// 分数规则表
s10.addText("Score Rules", { x: 0.6, y: 4.2, w: 3, h: 0.32, fontSize: 12, fontFace: "Arial", bold: true, color: C.ocean });
const scoreData = [
  [{ text: "行为动作", options: { fill: { color: C.ocean }, color: C.white, bold: true, align: "center" } },
   { text: "获得分数", options: { fill: { color: C.ocean }, color: C.white, bold: true, align: "center" } }],
  ["创建一条记录", "+5"],
  ["完成普通任务", "+5"],
  ["完成快速任务", "+2"],
  ["习惯打卡成功", "+5"],
  ["完成长任务目标", "+10"],
];
s10.addTable(scoreData, {
  x: 0.6, y: 4.55, w: 8.8, h: 0.95,
  colW: [6.0, 2.8],
  border: { pt: 0.5, color: "E0E0E0" },
  fontFace: "Microsoft YaHei",
  fontSize: 11,
  color: C.charcoal,
  align: "center", valign: "middle",
  rowH: [0.28, 0.134, 0.134, 0.134, 0.134, 0.134],
  fill: { color: C.white },
});

// ============================================================
// SLIDE 11 — 四象限管理（经典矩阵）
// ============================================================
let s11 = P.addSlide();
s11.background = { color: C.white };

s11.addShape(P.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 0.35, w: 1.6, h: 0.32, fill: { color: C.mint }, rectRadius: 0.05 });
s11.addText("QUADRANT MATRIX", { x: 0.6, y: 0.36, w: 1.6, h: 0.30, fontSize: 8, fontFace: "Arial", bold: true, color: C.white, align: "center" });
s11.addText("四象限任务管理", { x: 0.6, y: 0.78, w: 6, h: 0.55, fontSize: 24, fontFace: "Microsoft YaHei", bold: true, color: C.ink });

// 坐标轴标签
s11.addText("重要 →", { x: 4.2, y: 1.05, w: 2, h: 0.3, fontSize: 10, fontFace: "Microsoft YaHei", color: C.slate, align: "center" });
s11.addText("↑ 紧急", { x: 0.3, y: 2.8, w: 0.6, h: 0.3, fontSize: 10, fontFace: "Microsoft YaHei", color: C.slate, align: "center" });

const quads = [
  { q: "Q1", label: "紧急且重要", action: "立即处理", color: "E57373", x: 5.1, y: 1.35, tags: ["截止任务", "紧急修复"] },
  { q: "Q2", label: "重要不紧急", action: "计划安排", color: "81C784", x: 5.1, y: 3.0, tags: ["学习计划", "长线目标"] },
  { q: "Q3", label: "紧急不重要", action: "委托/速办", color: "FFB74D", x: 0.6, y: 1.35, tags: ["快速任务", "日常杂事"] },
  { q: "Q4", label: "不紧急不重要", action: "考虑删除", color: "B0BEC5", x: 0.6, y: 3.0, tags: ["可推迟项"] },
];
quads.forEach((q) => {
  s11.addShape(P.shapes.RECTANGLE, {
    x: q.x, y: q.y, w: 4.3, h: 1.55,
    fill: { color: q.color, transparency: 88 }, rectRadius: 0.12,
    line: { color: q.color, width: 1.5 }
  });
  // Q标识圆
  s11.addShape(P.shapes.OVAL, { x: q.x + 0.15, y: q.y + 0.15, w: 0.6, h: 0.6, fill: { color: q.color } });
  s11.addText(q.q, { x: q.x + 0.15, y: q.y + 0.26, w: 0.6, h: 0.4, fontSize: 15, fontFace: "Arial", bold: true, color: C.white, align: "center" });
  // 标题和描述
  s11.addText(q.label, { x: q.x + 0.85, y: q.y + 0.2, w: 2.8, h: 0.38, fontSize: 15, fontFace: "Microsoft YaHei", bold: true, color: C.ink });
  s11.addText(q.action, { x: q.x + 0.85, y: q.y + 0.56, w: 2.0, h: 0.3, fontSize: 11, fontFace: "Microsoft YaHei", color: C.slate });
  // 标签
  q.tags.forEach((tag, ti) => {
    s11.addShape(P.shapes.ROUNDED_RECTANGLE, {
      x: q.x + 0.2 + ti * 1.9, y: q.y + 1.0, w: 1.75, h: 0.4,
      fill: { color: q.color, transparency: 70 }, rectRadius: 0.05
    });
    s11.addText(tag, { x: q.x + 0.2 + ti * 1.9, y: q.y + 1.04, w: 1.75, h: 0.33, fontSize: 10, fontFace: "Microsoft YaHei", color: C.charcoal, align: "center" });
  });
});

// ============================================================
// SLIDE 12 — 拖延急救（流程步骤）
// ============================================================
let s12 = P.addSlide();
s12.background = { color: C.ink };

s12.addText("PROCRASTINATION FIRST AID", { x: 0.6, y: 0.3, w: 6, h: 0.3, fontSize: 10, fontFace: "Arial", bold: true, color: C.blush, charSpacing: 1.5 });
s12.addText("拖延急救 · AI 魔法分解术", { x: 0.6, y: 0.62, w: 8, h: 0.6, fontSize: 28, fontFace: "Microsoft YaHei", bold: true, color: C.white });

// 步骤流
const steps = [
  { num: "1", title: "当前状态", desc: "选择你现在的状态", c: C.rose },
  { num: "2", title: "选择目标", desc: "想达成的场景", c: C.sky },
  { num: "3", title: "AI分解", desc: "生成可执行步骤", c: C.mint },
  { num: "4", title: "逐步执行", desc: "一步一步来", c: C.gold },
  { num: "5", title: "达成目标", desc: "完成！", c: C.rose },
];
steps.forEach((sp, i) => {
  const x = 0.35 + i * 1.93;
  // 圆形编号
  s12.addShape(P.shapes.OVAL, { x: x + 0.5, y: 1.5, w: 0.72, h: 0.72, fill: { color: sp.c } });
  s12.addText(sp.num, { x: x + 0.5, y: 1.63, w: 0.72, h: 0.46, fontSize: 20, fontFace: "Arial", bold: true, color: C.white, align: "center" });
  // 标题
  s12.addText(sp.title, { x: x, y: 2.35, w: 1.72, h: 0.36, fontSize: 13, fontFace: "Microsoft YaHei", bold: true, color: C.white, align: "center" });
  s12.addText(sp.desc, { x: x, y: 2.68, w: 1.72, h: 0.3, fontSize: 10, fontFace: "Microsoft YaHei", color: "99A0B8", align: "center" });
  if (i < 4) {
    s12.addShape(P.shapes.RIGHT_ARROW, { x: x + 1.72, y: 1.73, w: 0.35, h: 0.28, fill: { color: "FFFFFF", transparency: 65 } });
  }
});

// 支持场景
s12.addText("支持的场景转换", { x: 0.6, y: 3.25, w: 5, h: 0.35, fontSize: 14, fontFace: "Microsoft YaHei", bold: true, color: C.blush });
const scenes = [
  { from: "躺平刷手机", to: "去图书馆学习" },
  { from: "躺着不想动", to: "去运动锻炼" },
  { from: "发呆走神", to: "去做饭做家务" },
  { from: "短视频停不下", to: "开始工作学习" },
  { from: "游戏入迷", to: "去睡觉休息" },
];
scenes.forEach((sc, i) => {
  const col = i % 3;
  const row = Math.floor(i / 3);
  const x = 0.55 + col * 3.1;
  const y = 3.68 + row * 0.95;
  s12.addShape(P.shapes.RECTANGLE, {
    x: x, y: y, w: 2.95, h: 0.82,
    fill: { color: "FFFFFF", transparency: 92 }, rectRadius: 0.08,
    line: { color: "FFFFFF", width: 0.5, transparency: 70 }
  });
  s12.addText(sc.from, { x: x + 0.1, y: y + 0.1, w: 1.3, h: 0.28, fontSize: 10, fontFace: "Microsoft YaHei", color: "99A0B8", align: "center" });
  s12.addText("→", { x: x + 1.3, y: y + 0.1, w: 0.35, h: 0.28, fontSize: 12, color: C.mint, align: "center" });
  s12.addText(sc.to, { x: x + 1.55, y: y + 0.1, w: 1.3, h: 0.28, fontSize: 10, fontFace: "Microsoft YaHei", bold: true, color: C.white, align: "center" });
});

// ============================================================
// SLIDE 13 — 技术架构（深色分层）
// ============================================================
let s13 = P.addSlide();
s13.background = { color: C.ink };

s13.addText("TECH ARCHITECTURE", { x: 0.6, y: 0.3, w: 5, h: 0.3, fontSize: 10, fontFace: "Arial", bold: true, color: C.sky, charSpacing: 1.5 });
s13.addText("技术架构设计", { x: 0.6, y: 0.62, w: 8, h: 0.55, fontSize: 28, fontFace: "Microsoft YaHei", bold: true, color: C.white });

const layers = [
  { name: "Frontend Layer", cn: "前端应用层", items: ["Pages 页面路由", "Components UI组件", "Contexts 全局状态", "Hooks 自定义Hook"], c: C.rose, y: 1.3, h: 0.95 },
  { name: "API Gateway", cn: "API网关层", items: ["Next.js App Router API Routes"], c: C.sky, y: 2.4, h: 0.55 },
  { name: "Business Logic", cn: "业务逻辑层", items: ["local-db.ts 数据持久化", "snowball-score.ts 分数引擎", "achievement-engine.ts 成就系统", "quadrant-utils.ts 四象限计算"], c: C.mint, y: 3.05, h: 1.05 },
  { name: "Data Storage", cn: "数据存储层", items: ["local-db.json 本地JSON文件"], c: C.gold, y: 4.2, h: 0.55 },
];
layers.forEach((ly) => {
  // 层名标签
  s13.addShape(P.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: ly.y, w: 2.0, h: ly.h > 0.7 ? 0.45 : ly.h, fill: { color: ly.c }, rectRadius: 0.06 });
  s13.addText(ly.cn, { x: 0.5, y: ly.y + 0.08, w: 2.0, h: ly.h > 0.7 ? 0.32 : ly.h - 0.08, fontSize: 12, fontFace: "Microsoft YaHei", bold: true, color: C.ink, align: "center" });
  // 内容区
  s13.addShape(P.shapes.RECTANGLE, {
    x: 2.65, y: ly.y, w: 6.9, h: ly.h,
    fill: { color: "FFFFFF", transparency: 94 }, rectRadius: 0.06,
    line: { color: ly.c, width: 0.75, dashType: "dash" }
  });
  ly.items.forEach((item, ii) => {
    s13.addText("▸ " + item, { x: 2.8, y: ly.y + 0.08 + ii * (ly.h > 0.7 ? 0.22 : 0.28), w: 6.4, h: 0.22, fontSize: 10.5, fontFace: "Microsoft YaHei", color: "BBC0CF" });
  });
});

// ============================================================
// SLIDE 14 — 技术栈（精致卡片网格）
// ============================================================
let s14 = P.addSlide();
s14.background = { color: C.cream };

s14.addShape(P.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 0.35, w: 1.4, h: 0.32, fill: { color: C.ocean }, rectRadius: 0.05 });
s14.addText("TECH STACK", { x: 0.6, y: 0.36, w: 1.4, h: 0.30, fontSize: 8, fontFace: "Arial", bold: true, color: C.white, align: "center" });
s14.addText("技术栈与实现", { x: 0.6, y: 0.78, w: 6, h: 0.55, fontSize: 24, fontFace: "Microsoft YaHei", bold: true, color: C.ink });

const techs = [
  { icon: "⚛️", cat: "框架", items: ["Next.js 16.2", "React 19.2"], c: C.rose },
  { icon: "🎨", cat: "样式", items: ["Tailwind CSS 4", "原子化CSS"], c: C.sky },
  { icon: "✨", cat: "动画", items: ["Framer Motion 12", "流畅交互"], c: C.mint },
  { icon: "📊", cat: "图表", items: ["Recharts 3.8", "数据可视化"], c: C.gold },
  { icon: "📘", cat: "语言", items: ["TypeScript 5+", "类型安全"], c: C.rose },
  { icon: "🧪", cat: "测试", items: ["Vitest 4.1", "单元测试"], c: C.sky },
  { icon: "💾", cat: "存储", items: ["本地JSON", "零配置"], c: C.mint },
  { icon: "🤖", cat: "AI", items: ["智谱GLM-4", "智能反馈"], c: C.gold },
];
techs.forEach((tc, i) => {
  const col = i % 4;
  const row = Math.floor(i / 4);
  const x = 0.5 + col * 2.36;
  const y = 1.4 + row * 2.05;
  s14.addShape(P.shapes.RECTANGLE, {
    x: x, y: y, w: 2.22, h: 1.9,
    fill: { color: C.white }, rectRadius: 0.1, shadow: SOFT_SHADOW()
  });
  // 顶部细线
  s14.addShape(P.shapes.RECTANGLE, { x: x, y: y, w: 2.22, h: 0.05, fill: { color: tc.c } });
  s14.addText(tc.icon, { x: x, y: y + 0.18, w: 2.22, h: 0.5, fontSize: 24, align: "center" });
  s14.addText(tc.cat, { x: x, y: y + 0.68, w: 2.22, h: 0.32, fontSize: 12, fontFace: "Microsoft YaHei", bold: true, color: tc.c, align: "center" });
  tc.items.forEach((it, ii) => {
    s14.addText(it, { x: x + 0.1, y: y + 1.05 + ii * 0.32, w: 2.02, h: 0.28, fontSize: 10, fontFace: "Microsoft YaHei", color: C.slate, align: "center" });
  });
});

// ============================================================
// SLIDE 15 — 产品亮点（深色卡片墙）
// ============================================================
let s15 = P.addSlide();
s15.background = { color: C.ink };

s15.addText("HIGHLIGHTS", { x: 0.6, y: 0.3, w: 4, h: 0.3, fontSize: 10, fontFace: "Arial", bold: true, color: C.blush, charSpacing: 2 });
s15.addText("产品亮点与优势", { x: 0.6, y: 0.62, w: 8, h: 0.55, fontSize: 28, fontFace: "Microsoft YaHei", bold: true, color: C.white });

const hlts = [
  { icon: "✨", t: "极简设计", d: "界面清爽，3秒记录", c: C.rose },
  { icon: "❄️", t: "雪球成长", d: "可视化进化过程", c: C.sky },
  { icon: "🎨", t: "精美动画", d: "流畅交互体验", c: C.mint },
  { icon: "🤖", t: "AI陪伴", d: "智能反馈急救", c: C.gold },
  { icon: "🎯", t: "任务分解", d: "四象限+习惯追踪", c: C.rose },
  { icon: "🏆", t: "成就激励", d: "37个正向成就", c: C.sky },
  { icon: "📊", t: "数据洞察", d: "时间线统计分析", c: C.mint },
  { icon: "🔒", t: "隐私安全", d: "本地数据完全掌控", c: C.gold },
];
hlts.forEach((h, i) => {
  const col = i % 4;
  const row = Math.floor(i / 4);
  const x = 0.45 + col * 2.38;
  const y = 1.3 + row * 2.1;
  s15.addShape(P.shapes.RECTANGLE, {
    x: x, y: y, w: 2.22, h: 1.95,
    fill: { color: "FFFFFF", transparency: 94 }, rectRadius: 0.1,
    line: { color: h.c, width: 1 }
  });
  s15.addText(h.icon, { x: x, y: y + 0.15, w: 2.22, h: 0.5, fontSize: 24, align: "center" });
  s15.addText(h.t, { x: x, y: y + 0.68, w: 2.22, h: 0.36, fontSize: 14, fontFace: "Microsoft YaHei", bold: true, color: C.white, align: "center" });
  s15.addText(h.d, { x: x + 0.1, y: y + 1.08, w: 2.02, h: 0.65, fontSize: 10, fontFace: "Microsoft YaHei", color: "99A0B8", align: "center" });
});

// ============================================================
// SLIDE 16 — 未来规划（时间线）
// ============================================================
let s16 = P.addSlide();
s16.background = { color: C.white };

s16.addShape(P.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 0.35, w: 1.4, h: 0.32, fill: { color: C.gold }, rectRadius: 0.05 });
s16.addText("ROADMAP", { x: 0.6, y: 0.36, w: 1.4, h: 0.30, fontSize: 8, fontFace: "Arial", bold: true, color: C.ink, align: "center" });
s16.addText("未来规划路线图", { x: 0.6, y: 0.78, w: 6, h: 0.55, fontSize: 24, fontFace: "Microsoft YaHei", bold: true, color: C.ink });

const roadmap = [
  { ver: "V1.0 – V3.0", status: "已完成", statusIcon: "✅", features: "基础记录、任务管理、雪球成长、成就系统、AI反馈、拖延急救、挑战系统、成长时间线", c: C.mint },
  { ver: "V4.0", status: "开发中", statusIcon: "🛠️", features: "云端同步、多设备支持、社区互动功能、数据备份恢复", c: C.sky },
  { ver: "V5.0", status: "远期规划", statusIcon: "📋", features: "移动端原生APP、数据导出报告、高级AI分析、团队协作模式", c: C.rose },
];
roadmap.forEach((rm, i) => {
  const y = 1.25 + i * 1.4;
  // 时间点
  s16.addShape(P.shapes.OVAL, { x: 0.7, y: y + 0.15, w: 0.38, h: 0.38, fill: { color: rm.c } });
  s16.addText(rm.statusIcon, { x: 0.7, y: y + 0.2, w: 0.38, h: 0.28, fontSize: 12, align: "center" });
  // 连接线
  if (i < 2) {
    s16.addShape(P.shapes.LINE, { x: 0.89, y: y + 0.58, w: 0, h: 1.03, line: { color: "E0E0E0", width: 2, dashType: "dash" } });
  }
  // 卡片
  s16.addShape(P.shapes.RECTANGLE, {
    x: 1.3, y: y, w: 8.3, h: 1.25,
    fill: { color: C.cream }, rectRadius: 0.1, shadow: SOFT_SHADOW()
  });
  s16.addShape(P.shapes.RECTANGLE, { x: 1.3, y: y, w: 0.07, h: 1.25, fill: { color: rm.c } });
  s16.addText(rm.ver, { x: 1.55, y: y + 0.12, w: 2.0, h: 0.36, fontSize: 16, fontFace: "Microsoft YaHei", bold: true, color: rm.c });
  s16.addText(rm.status, { x: 3.65, y: y + 0.16, w: 1.3, h: 0.3, fontSize: 11, fontFace: "Microsoft YaHei", color: C.slate });
  s16.addText(rm.features, { x: 1.55, y: y + 0.55, w: 7.85, h: 0.55, fontSize: 11, fontFace: "Microsoft YaHei", color: C.charcoal });
});

// ============================================================
// SLIDE 17 — 结束页（大气简洁）
// ============================================================
let s17 = P.addSlide();
s17.background = { color: C.ink };

// 装饰圆形
s17.addShape(P.shapes.OVAL, { x: -1.5, y: 3.0, w: 4.5, h: 4.5, fill: { color: C.rose, transparency: 90 } });
s17.addShape(P.shapes.OVAL, { x: 7.5, y: -1.5, w: 4, h: 4, fill: { color: C.sky, transparency: 90 } });
s17.addShape(P.shapes.OVAL, { x: 8.0, y: 3.5, w: 3, h: 3, fill: { color: C.mint, transparency: 92 } });

// 主文字
s17.addText("Thank You", {
  x: 0.5, y: 1.4, w: 9, h: 1.0,
  fontSize: 52, fontFace: "Georgia", bold: true, color: C.white, align: "center"
});
// 中文
s17.addText("谢谢观看", {
  x: 0.5, y: 2.35, w: 9, h: 0.6,
  fontSize: 24, fontFace: "Microsoft YaHei", color: C.blush, align: "center"
});
// Slogan
s17.addText("让每一天的努力都被看见", {
  x: 0.5, y: 3.15, w: 9, h: 0.5,
  fontSize: 16, fontFace: "Microsoft YaHei", color: "888AA0", align: "center"
});
// 品牌名
s17.addShape(P.shapes.RECTANGLE, { x: 3.8, y: 3.85, w: 2.4, h: 0.035, fill: { color: C.rose } });
s17.addText("❄️ 雪球日记 · Snowball Diary", {
  x: 0.5, y: 4.05, w: 9, h: 0.4,
  fontSize: 13, fontFace: "Microsoft YaHei", color: "666880", align: "center"
});
// 版权
s17.addText("© 2026 Snowball Diary · All Rights Reserved", {
  x: 0.5, y: 5.15, w: 9, h: 0.3,
  fontSize: 9, fontFace: "Arial", color: "555670", align: "center"
});

// ============================================================
// WRITE
// ============================================================
console.log("Generating精美版 PPTX...");
P.writeFile({ fileName: OUT })
  .then(f => console.log(`\nDone! ${f} (${P.slides.length} slides)`))
  .catch(e => console.error("Error:", e));
