/* ============================================================
 * 武林秘籍 · 成绩修炼系统 — 配置数据
 * 暴露全局对象 window.WL
 * ============================================================ */
(function () {
  'use strict';

  const WL = {};

  /* ---------- 学科定义（含全称、配色、满分基准） ---------- */
  const SUBJECTS = {
    chinese:  { name: '语文', color: '#c23a2b' },
    math:     { name: '数学', color: '#2b4c7e' },
    english:  { name: '英语', color: '#b8860b' },
    physics:  { name: '物理', color: '#4a6fa5' },
    chemistry:{ name: '化学', color: '#4a7c6f' },
    biology:  { name: '生物', color: '#5a8f7b' },
    politics: { name: '道法', color: '#a04040' },
    history:  { name: '历史', color: '#8b3a3a' },
    geography:{ name: '地理', color: '#6b8e6b' },
    science:  { name: '科学', color: '#4a7c6f' }
  };

  /* 学段 → 年级 → 学科 + 满分（major 大考 / minor 小考）
   * 统一接口：subjectsFor(grade, selectedOpts) / fullFor(grade, examType)
   * 小学一二年级仅语文、数学；三至六年级为语文、数学、英语、科学、道法
   * 初中初一7门（无物理化学），初二加物理，初三加化学
   * 高中高一上9门，高一下及以后可选科（小六门选3或6门）
   */
  const PRIMARY_LOW = ['chinese', 'math'];
  const PRIMARY_HIGH = ['chinese', 'math', 'english', 'science', 'politics'];
  const PRIMARY_LOW_FULL = { chinese: 100, math: 100 };
  const PRIMARY_HIGH_FULL = { chinese: 100, math: 100, english: 100, science: 100, politics: 100 };

  const MIDDLE_MAJOR_FULL = { chinese: 120, math: 120, english: 120, physics: 100, chemistry: 100, biology: 100, politics: 100, history: 100, geography: 100 };
  const MIDDLE_MINOR_FULL = { chinese: 100, math: 100, english: 100, physics: 100, chemistry: 100, biology: 100, politics: 100, history: 100, geography: 100 };

  const HIGH_MAJOR_FULL = { chinese: 150, math: 150, english: 150, physics: 100, chemistry: 100, biology: 100, politics: 100, history: 100, geography: 100 };
  const HIGH_MINOR_FULL = { chinese: 100, math: 100, english: 100, physics: 100, chemistry: 100, biology: 100, politics: 100, history: 100, geography: 100 };

  /* 小六门（选考科目） */
  const HIGH_ELECTIVES = ['physics', 'chemistry', 'biology', 'politics', 'history', 'geography'];
  const HIGH_CORE = ['chinese', 'math', 'english'];

  const STAGES = {
    primary: {
      label: '小学',
      grades: ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'],
      subjectsFor(grade) { return (grade === '一年级' || grade === '二年级') ? PRIMARY_LOW.slice() : PRIMARY_HIGH.slice(); },
      fullFor(grade, examType) { return (grade === '一年级' || grade === '二年级') ? Object.assign({}, PRIMARY_LOW_FULL) : Object.assign({}, PRIMARY_HIGH_FULL); }
    },
    middle: {
      label: '初中',
      grades: ['初一', '初二', '初三'],
      subjectsFor(grade) {
        const base = ['chinese', 'math', 'english', 'biology', 'politics', 'history', 'geography'];
        if (grade === '初二' || grade === '初三') base.push('physics');
        if (grade === '初三') base.push('chemistry');
        return base;
      },
      fullFor(grade, examType) {
        const src = examType === 'minor' ? MIDDLE_MINOR_FULL : MIDDLE_MAJOR_FULL;
        const subs = this.subjectsFor(grade);
        const out = {};
        subs.forEach(s => { out[s] = src[s]; });
        return out;
      }
    },
    high: {
      label: '高中',
      grades: ['高一', '高二', '高三'],
      hasElectives: true,
      subjectsFor(grade, selectedOpts) {
        const opts = selectedOpts && selectedOpts.length ? selectedOpts : HIGH_ELECTIVES;
        return HIGH_CORE.concat(opts);
      },
      fullFor(grade, examType, selectedOpts) {
        const src = examType === 'minor' ? HIGH_MINOR_FULL : HIGH_MAJOR_FULL;
        const subs = this.subjectsFor(grade, selectedOpts);
        const out = {};
        subs.forEach(s => { out[s] = src[s]; });
        return out;
      },
      electives: HIGH_ELECTIVES
    }
  };

  const EXAM_TYPES = {
    major: { label: '大考', desc: '期中 / 期末 / 月考' },
    minor: { label: '小考', desc: '随堂 / 单元测验' }
  };

  /* 等级判定：正确率 → S/A/B/C/D */
  function gradeOf(avgPercent) {
    if (avgPercent >= 95) return { level: 'S', color: '#c23a2b' };
    if (avgPercent >= 85) return { level: 'A', color: '#b8860b' };
    if (avgPercent >= 75) return { level: 'B', color: '#4a7c6f' };
    if (avgPercent >= 60) return { level: 'C', color: '#2b4c7e' };
    return { level: 'D', color: '#8c7e6a' };
  }

  /* ---------- 35 修为境界 ---------- */
  const REALMS = [
    { name: '懵懂顽童', min: 0,     icon: '👶' },
    { name: '初识文字', min: 80,    icon: '📚' },
    { name: '读书种子', min: 200,   icon: '🌱' },
    { name: '蒙学初启', min: 380,   icon: '📖' },
    { name: '开蒙启智', min: 600,   icon: '✍️' },
    { name: '通灵开窍', min: 880,   icon: '✨' },
    { name: '灵根初显', min: 1200,  icon: '🌿' },
    { name: '练气一层', min: 1600,  icon: '💨' },
    { name: '练气三层', min: 2100,  icon: '💨' },
    { name: '练气五层', min: 2700,  icon: '💨' },
    { name: '练气七层', min: 3400,  icon: '🌬️' },
    { name: '练气九层', min: 4200,  icon: '🌬️' },
    { name: '练气圆满', min: 5100,  icon: '🌬️' },
    { name: '筑基初期', min: 6100,  icon: '🏔️' },
    { name: '筑基中期', min: 7200,  icon: '🏔️' },
    { name: '筑基后期', min: 8400,  icon: '🏔️' },
    { name: '筑基圆满', min: 9700,  icon: '🏔️' },
    { name: '金丹初成', min: 11000, icon: '💎' },
    { name: '金丹中期', min: 12500, icon: '💎' },
    { name: '金丹后期', min: 14000, icon: '💎' },
    { name: '金丹大圆满', min: 15600, icon: '💎' },
    { name: '元婴初期', min: 17300, icon: '👑' },
    { name: '元婴中期', min: 19000, icon: '👑' },
    { name: '元婴后期', min: 20800, icon: '👑' },
    { name: '元婴大圆满', min: 22700, icon: '👑' },
    { name: '化神初期', min: 24700, icon: '🔥' },
    { name: '化神中期', min: 26800, icon: '🔥' },
    { name: '化神后期', min: 29000, icon: '🔥' },
    { name: '化神大圆满', min: 31300, icon: '🔥' },
    { name: '炼虚初期', min: 33700, icon: '🌌' },
    { name: '炼虚大圆满', min: 36200, icon: '🌌' },
    { name: '合体期', min: 38800,   icon: '⚡' },
    { name: '大乘期', min: 41500,   icon: '🌠' },
    { name: '圣人之境', min: 44300, icon: '✡️' },
    { name: '天道化身', min: 48000, icon: '🔱' }
  ];
  const MAX_EXP = 50000;

  function realmByExp(exp) {
    let idx = 0;
    for (let i = 0; i < REALMS.length; i++) {
      if (exp >= REALMS[i].min) idx = i; else break;
    }
    const cur = REALMS[idx];
    const next = REALMS[idx + 1] || null;
    const floor = cur.min;
    const ceil = next ? next.min : MAX_EXP;
    const pct = next ? Math.min(100, ((exp - floor) / (ceil - floor)) * 100) : 100;
    return { idx, cur, next, floor, ceil, pct, isTop: !next };
  }

  /* ---------- 62 成就（10 分类） ---------- */
  // condition(state) => boolean；state 含 examHistory/achievements/focusHistory/errorHistory/cultivationExp/chartViews/rank
  const ACHIEVEMENTS = [
    /* 成绩基础 5 */
    { id:'a_first',    cat:'成绩基础', icon:'📝', name:'初出茅庐', desc:'首次记录成绩', check:s=>s.examHistory.length>=1 },
    { id:'a_three',    cat:'成绩基础', icon:'📈', name:'渐入佳境', desc:'累计记录 5 次成绩', check:s=>s.examHistory.length>=5 },
    { id:'a_ten',      cat:'成绩基础', icon:'🎯', name:'持之以恒', desc:'累计记录 25 次成绩', check:s=>s.examHistory.length>=25 },
    { id:'a_major',    cat:'成绩基础', icon:'🏫', name:'大考初体验', desc:'首次记录大考', check:s=>s.examHistory.some(e=>e.examType==='major') },
    { id:'a_minor',    cat:'成绩基础', icon:'📋', name:'细水长流', desc:'首次记录小考', check:s=>s.examHistory.some(e=>e.examType==='minor') },

    /* 成绩卓越 9 */
    { id:'a_full_one', cat:'成绩卓越', icon:'💯', name:'登峰造极', desc:'单科获得满分', check:s=>s.examHistory.some(e=>Object.keys(e.scores).some(k=>e.full[k]&&e.scores[k]>=e.full[k])) },
    { id:'a_s',        cat:'成绩卓越', icon:'🌟', name:'学霸降临', desc:'获得 S 等级（正确率≥97%）', check:s=>s.examHistory.some(e=>e.avgPercent>=97) },
    { id:'a_a',        cat:'成绩卓越', icon:'🎖️', name:'稳扎稳打', desc:'获得 A 等级（正确率≥88%）', check:s=>s.examHistory.some(e=>e.avgPercent>=88) },
    { id:'a_math_full',cat:'成绩卓越', icon:'📐', name:'数学天才', desc:'数学满分', check:s=>s.examHistory.some(e=>e.full.math&&e.scores.math>=e.full.math) },
    { id:'a_chi_full', cat:'成绩卓越', icon:'🖋️', name:'文采斐然', desc:'语文满分', check:s=>s.examHistory.some(e=>e.full.chinese&&e.scores.chinese>=e.full.chinese) },
    { id:'a_eng_full', cat:'成绩卓越', icon:'🌍', name:'语通四海', desc:'英语满分', check:s=>s.examHistory.some(e=>e.full.english&&e.scores.english>=e.full.english) },
    { id:'a_all_a',    cat:'成绩卓越', icon:'🏆', name:'全能学霸', desc:'全科 A 以上（5科+）', check:s=>s.examHistory.some(e=>e.avgPercent>=88&&Object.keys(e.scores).length>=5) },
    { id:'a_total_hi', cat:'成绩卓越', icon:'🚀', name:'总分破纪录', desc:'单次总分 ≥ 650', check:s=>s.examHistory.some(e=>e.total>=650) },
    { id:'a_s3',       cat:'成绩卓越', icon:'👑', name:'王者之姿', desc:'获得 5 次 S 等级', check:s=>s.examHistory.filter(e=>e.avgPercent>=97).length>=5 },

    /* 学习坚持 4 */
    { id:'a_streak7',  cat:'学习坚持', icon:'📅', name:'天道酬勤', desc:'连续 14 天记录', check:s=>s.streak>=14 },
    { id:'a_streak30', cat:'学习坚持', icon:'🔥', name:'勤学苦练', desc:'连续 60 天记录', check:s=>s.streak>=60 },
    { id:'a_sum30',    cat:'学习坚持', icon:'📚', name:'积少成多', desc:'累计 50 次记录', check:s=>s.examHistory.length>=50 },
    { id:'a_sum50',    cat:'学习坚持', icon:'💎', name:'半百之约', desc:'累计 100 次记录', check:s=>s.examHistory.length>=100 },

    /* 进步突破 4 */
    { id:'a_prog20',   cat:'进步突破', icon:'⚡', name:'突飞猛进', desc:'单次进步 30+ 分', check:s=>s.maxProgress>=30 },
    { id:'a_prog50',   cat:'进步突破', icon:'🚀', name:'一日千里', desc:'单次进步 80+ 分', check:s=>s.maxProgress>=80 },
    { id:'a_d2a',      cat:'进步突破', icon:'🔄', name:'绝地反击', desc:'从 D 到 A', check:s=>s.dToA },
    { id:'a_prog3',    cat:'进步突破', icon:'📈', name:'步步高升', desc:'连续 5 次进步', check:s=>s.consecProg>=5 },

    /* 排行榜 6 */
    { id:'r_top1',     cat:'排行榜', icon:'🥇', name:'独占鳌头', desc:'登顶榜首', check:s=>s.bestRank<=1 },
    { id:'r_top3',     cat:'排行榜', icon:'🥉', name:'名列前茅', desc:'进入前三', check:s=>s.bestRank<=3 },
    { id:'r_top5',     cat:'排行榜', icon:'🏅', name:'锋芒初露', desc:'进入前五', check:s=>s.bestRank<=5 },
    { id:'r_top10',    cat:'排行榜', icon:'🎖️', name:'十强之列', desc:'进入前十', check:s=>s.bestRank<=10 },
    { id:'r_acc1',     cat:'排行榜', icon:'🎯', name:'精度之王', desc:'正确率榜登顶', check:s=>s.bestAccRank<=1 },
    { id:'r_beat5',    cat:'排行榜', icon:'⚔️', name:'群雄逐鹿', desc:'超越 5 名对手', check:s=>s.beaten>=5 },

    /* 图表探索 3 */
    { id:'c_radar',    cat:'图表探索', icon:'📡', name:'洞察之眼', desc:'查看能力图谱 3 次', check:s=>(s.chartViews.radar||0)>=3 },
    { id:'c_bar',      cat:'图表探索', icon:'📊', name:'条分缕析', desc:'查看分科对比 3 次', check:s=>(s.chartViews.bar||0)>=3 },
    { id:'c_all',      cat:'图表探索', icon:'🔍', name:'博观约取', desc:'查看全部 5 种图表各 3 次', check:s=>['radar','bar','line','pie','subject'].every(t=>(s.chartViews[t]||0)>=3) },

    /* 成就收集 3 */
    { id:'col_10',     cat:'成就收集', icon:'📦', name:'收藏家', desc:'解锁 15 个成就', check:s=>s.unlockedCount>=15 },
    { id:'col_30',     cat:'成就收集', icon:'🗃️', name:'成就大师', desc:'解锁 35 个成就', check:s=>s.unlockedCount>=35 },
    { id:'col_all',    cat:'成就收集', icon:'👑', name:'功德圆满', desc:'解锁全部成就', check:s=>s.unlockedCount>=ACHIEVEMENTS_LENGTH },

    /* 时间节点 4 */
    { id:'t_night',    cat:'时间节点', icon:'🌙', name:'夜猫子', desc:'22:00 后记录 3 次', check:s=>s.nightRecord },
    { id:'t_morning',  cat:'时间节点', icon:'🌅', name:'早起鸟', desc:'7:00 前记录 3 次', check:s=>s.morningRecord },
    { id:'t_noon',     cat:'时间节点', icon:'☀️', name:'午间精进', desc:'12:00-14:00 记录 3 次', check:s=>s.noonRecord },
    { id:'t_weekend',  cat:'时间节点', icon:'🍃', name:'偷得浮生', desc:'周末记录 3 次', check:s=>s.weekendRecord },

    /* 专注修炼 12 */
    { id:'f_first',    cat:'专注修炼', icon:'🧘', name:'初入禅定', desc:'首次专注修炼', check:s=>s.focusHistory.length>=1 },
    { id:'f_15',       cat:'专注修炼', icon:'⏱️', name:'小试身手', desc:'专注 15 分钟', check:s=>s.focusHistory.some(f=>f.duration>=15) },
    { id:'f_25',       cat:'专注修炼', icon:'🍅', name:'番茄达人', desc:'专注 25 分钟', check:s=>s.focusHistory.some(f=>f.duration>=25) },
    { id:'f_45',       cat:'专注修炼', icon:'📖', name:'沉浸学习', desc:'专注 45 分钟', check:s=>s.focusHistory.some(f=>f.duration>=45) },
    { id:'f_90',       cat:'专注修炼', icon:'🏔️', name:'闭关大能', desc:'专注 90 分钟', check:s=>s.focusHistory.some(f=>f.duration>=90) },
    { id:'f_count10',  cat:'专注修炼', icon:'🔁', name:'坚持不懈', desc:'累计专注 20 次', check:s=>s.focusHistory.length>=20 },
    { id:'f_count30',  cat:'专注修炼', icon:'💎', name:'禅定大师', desc:'累计专注 50 次', check:s=>s.focusHistory.length>=50 },
    { id:'f_time120',  cat:'专注修炼', icon:'⌛', name:'两时辰功', desc:'累计专注 300 分钟', check:s=>s.focusTotal>=300 },
    { id:'f_time600',  cat:'专注修炼', icon:'🌙', name:'修仙不眠', desc:'累计专注 1200 分钟', check:s=>s.focusTotal>=1200 },
    { id:'f_streak3',  cat:'专注修炼', icon:'🔥', name:'三连修炼', desc:'连续 5 天专注', check:s=>s.focusStreak>=5 },
    { id:'f_streak7',  cat:'专注修炼', icon:'⚡', name:'七日不辍', desc:'连续 14 天专注', check:s=>s.focusStreak>=14 },
    { id:'f_today',    cat:'专注修炼', icon:'🌸', name:'今日精进', desc:'今日完成专注', check:s=>s.focusToday>0 },

    /* 错题整理 12 */
    { id:'e_first',    cat:'错题整理', icon:'📝', name:'知错能改', desc:'首次录入错题', check:s=>s.errorHistory.length>=1 },
    { id:'e_5',        cat:'错题整理', icon:'📒', name:'集腋成裘', desc:'录入 10 道错题', check:s=>s.errorHistory.length>=10 },
    { id:'e_20',       cat:'错题整理', icon:'📚', name:'错题达人', desc:'录入 40 道错题', check:s=>s.errorHistory.length>=40 },
    { id:'e_50',       cat:'错题整理', icon:'🗃️', name:'错题宝库', desc:'录入 80 道错题', check:s=>s.errorHistory.length>=80 },
    { id:'e_master1',  cat:'错题整理', icon:'✅', name:'融会贯通', desc:'标记 1 道已掌握', check:s=>s.errorHistory.some(e=>e.mastered) },
    { id:'e_master10', cat:'错题整理', icon:'🎯', name:'举一反三', desc:'标记 20 道已掌握', check:s=>s.errorHistory.filter(e=>e.mastered).length>=20 },
    { id:'e_prac',     cat:'错题整理', icon:'✍️', name:'勤思善练', desc:'完成首次举一反三', check:s=>s.practiceDone>=1 },
    { id:'e_prac_full',cat:'错题整理', icon:'🌟', name:'满分通关', desc:'练习全部正确', check:s=>s.practiceFull },
    { id:'e_prac10',   cat:'错题整理', icon:'🔢', name:'熟能生巧', desc:'完成 20 次练习', check:s=>s.practiceDone>=20 },
    { id:'e_multi',    cat:'错题整理', icon:'🌈', name:'博学多闻', desc:'整理 5 个学科错题', check:s=>new Set(s.errorHistory.map(e=>e.subject)).size>=5 },
    { id:'e_allmaster',cat:'错题整理', icon:'🏅', name:'尽在掌握', desc:'全部错题已掌握（5道+）', check:s=>s.errorHistory.length>=5&&s.errorHistory.every(e=>e.mastered) },
    { id:'e_review',   cat:'错题整理', icon:'🔁', name:'温故知新', desc:'错题本查看 10 次', check:s=>(s.errorViews||0)>=10 }
  ];
  const ACHIEVEMENTS_LENGTH = ACHIEVEMENTS.length;

  const ACH_CATS = ['成绩基础','成绩卓越','学习坚持','进步突破','排行榜','图表探索','成就收集','时间节点','专注修炼','错题整理'];

  /* ---------- 模拟对手（排行榜） ---------- */
  const MOCK_OPPONENTS = [
    { name:'清风明月', avatar:'🌿', scores:[{total:642,avg:91.2},{total:630,avg:89.8}], exp:3200, errors:28, focus:580, achs:22 },
    { name:'剑影流光', avatar:'⚔️', scores:[{total:658,avg:93.5},{total:610,avg:86.4}], exp:5100, errors:45, focus:920, achs:31 },
    { name:'青云直上', avatar:'☁️', scores:[{total:595,avg:84.7},{total:620,avg:88.1}], exp:1800, errors:18, focus:350, achs:15 },
    { name:'墨染千秋', avatar:'🖋️', scores:[{total:608,avg:86.6},{total:582,avg:82.9}], exp:2400, errors:33, focus:410, achs:19 },
    { name:'听雪楼主', avatar:'❄️', scores:[{total:635,avg:90.2},{total:648,avg:92.0}], exp:4200, errors:52, focus:760, achs:27 },
    { name:'一苇渡江', avatar:'🍃', scores:[{total:570,avg:81.1},{total:590,avg:83.9}], exp:1200, errors:12, focus:220, achs:11 },
    { name:'星河璀璨', avatar:'✨', scores:[{total:666,avg:94.6},{total:640,avg:90.9}], exp:6800, errors:38, focus:1100, achs:35 },
    { name:'半山听雨', avatar:'⛰️', scores:[{total:588,avg:83.6},{total:601,avg:85.4}], exp:2100, errors:25, focus:480, achs:17 },
    { name:'落霞与孤鹜', avatar:'🌅', scores:[{total:615,avg:87.4},{total:622,avg:88.3}], exp:3700, errors:41, focus:650, achs:24 },
    { name:'九霄云外', avatar:'🐉', scores:[{total:652,avg:92.6},{total:660,avg:93.8}], exp:8900, errors:60, focus:1350, achs:40 }
  ];

  /* ---------- 智谱 AI API 配置 ---------- */
  const AI_CONFIG = {
    endpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    model: 'glm-4-flash',
    defaultKey: '05676c0c13f24268ade15ea2107a8be8.ckjzWj4dIkuaqpYh'
  };

  /* ---------- AI 生成练习题 Prompt 模板 ---------- */
  function buildPracticePrompt(subject, errorQuestion, errorAnswer, errorAnalysis, askedQuestions) {
    const subjectNames = {
      math: '数学', chinese: '语文', english: '英语', physics: '物理',
      chemistry: '化学', biology: '生物', politics: '道法',
      history: '历史', geography: '地理', science: '科学'
    };
    const subName = subjectNames[subject] || subject;
    let askedSection = '';
    if (askedQuestions && askedQuestions.length) {
      askedSection = `\n\n注意：以下题目已经出过，请不要重复出相同或高度相似的题目：\n${askedQuestions.map((q,i)=>`${i+1}. ${q}`).join('\n')}`;
    }
    return `你是一位${subName}学科的资深教师，正在给学生出填空练习题。学生有一道错题：
题目：${errorQuestion}
答案：${errorAnswer}
解析：${errorAnalysis || '无'}
${askedSection}

请根据这道错题的知识点和易错点，生成3道填空题帮助学生举一反三。

【出题规则】（必须严格遵守）：
1. 每道题必须是填空题，用 ___ 表示空缺处
2. 题目必须明确，不能有歧义
3. answer字段是标准答案，必须是确定的值，不能有多个答案
4. 如果是数学计算题，你必须亲自计算确认答案正确
5. 如果是语文/英语等知识题，你必须确认答案准确无误
6. ex字段是解析，必须包含两部分：
   - 简要说明为什么答案正确
   - 详尽指出易错点和常见错误，让学生理解错在哪里
   解析要尽可能详细，因为无论学生答对答错都会看到解析

请严格按照以下JSON格式输出，不要添加任何其他文字：
{
  "questions": [
    {
      "q": "题目内容（用___表示空）",
      "answer": "标准答案",
      "ex": "解析内容"
    }
  ]
}`;
  }

  /* ---------- 验证题目的 Prompt ---------- */
  function buildVerifyPrompt(subject, questions) {
    const subjectNames = {
      math: '数学', chinese: '语文', english: '英语', physics: '物理',
      chemistry: '化学', biology: '生物', politics: '道法',
      history: '历史', geography: '地理', science: '科学'
    };
    const subName = subjectNames[subject] || subject;
    return `你是一位${subName}学科的教师，请逐题审查以下填空练习题，找出其中的错误并修正。

审查要点：
1. 标准答案是否确实正确？
2. 题目是否有歧义？
3. 解析逻辑是否自洽，有无矛盾？
4. 如果是计算题，请重新计算确认答案

待审查的题目：
${JSON.stringify(questions, null, 2)}

请逐题审查。如果全部正确，原样输出；如有错误，修正后输出。
请严格按照以下JSON格式输出，不要添加任何其他文字：
{
  "questions": [
    {
      "q": "题目内容（用___表示空）",
      "answer": "标准答案",
      "ex": "解析内容"
    }
  ]
}`;
  }

  /* ---------- 举一反三练习题库（备用，当 API 不可用时） ---------- */
  const PRACTICE = {
    math: [
      { q:'解方程：2x² - 8 = 0，则 x = ___', answer:'±2', ex:'2x²=8 ⇒ x²=4 ⇒ x=±2' },
      { q:'一个直角三角形两直角边为 3、4，斜边长为 ___', answer:'5', ex:'勾股定理：√(3²+4²)=5' },
      { q:'若 (x-1)(x+2)=0，则 x 的解为 ___', answer:'1 或 -2', ex:'分别令各因式为 0，得 x=1 或 x=-2' }
    ],
    chinese: [
      { q:'"学而时习之"出自《___》', answer:'论语', ex:'《论语·学而》开篇' },
      { q:'"床前明月光"的作者是 ___', answer:'李白', ex:'李白《静夜思》' },
      { q:'"走___无路"中应填的字是 ___', answer:'投', ex:'"投"指投奔，走投无路为正确写法' }
    ],
    english: [
      { q:'She ___ (go) to school every day.（填正确形式）', answer:'goes', ex:'第三人称单数加 -es' },
      { q:'被动语态：They build a house. → A house ___.', answer:'is built', ex:'被动语态 be + 过去分词' },
      { q:'write 的过去式是 ___', answer:'wrote', ex:'write-wrote-written，不规则变化' }
    ],
    physics: [
      { q:'自由落体第 1 秒下落距离约为 ___ m（g=10m/s²）', answer:'5', ex:'h=½gt²=½×10×1=5m' },
      { q:'牛顿第一定律又称 ___ 定律', answer:'惯性', ex:'即惯性定律' },
      { q:'1 标准大气压约为 ___×10⁵ Pa', answer:'1.01', ex:'约 101325 Pa' }
    ],
    chemistry: [
      { q:'水的化学式是 ___', answer:'H₂O', ex:'两个氢一个氧' },
      { q:'pH=7 的溶液呈 ___ 性', answer:'中', ex:'pH=7 为中性' },
      { q:'氧气分子由 ___ 个氧原子构成', answer:'2', ex:'氧气分子式为 O₂' }
    ],
    biology: [
      { q:'光合作用主要发生在细胞的 ___ 中', answer:'叶绿体', ex:'叶绿体进行光合作用' },
      { q:'人体最大的器官是 ___', answer:'皮肤', ex:'皮肤是最大器官' },
      { q:'DNA 的中文全称是脱氧 ___ 核酸', answer:'核糖', ex:'脱氧核糖核酸' }
    ],
    politics: [
      { q:'依法治国的核心是 ___ 治国', answer:'依宪', ex:'依宪治国是核心' },
      { q:'我国根本政治制度是人民代表大会 ___', answer:'制度', ex:'人民代表大会制度' },
      { q:'社会主义核心价值观国家层面包括富强、民主、文明、___', answer:'和谐', ex:'国家层面四词：富强民主文明和谐' }
    ],
    history: [
      { q:'中国历史上第一个统一王朝是 ___ 朝', answer:'秦', ex:'公元前 221 年秦统一' },
      { q:'"贞观之治"是 ___ 在位时期', answer:'李世民', ex:'唐太宗李世民' },
      { q:'鸦片战争爆发于 ___ 年', answer:'1840', ex:'1840 年鸦片战争' }
    ],
    geography: [
      { q:'地球自转一周的时间约为 ___ 小时', answer:'24', ex:'约 24 小时一天' },
      { q:'世界最大的大洋是 ___ 洋', answer:'太平', ex:'太平洋最大' },
      { q:'我国领土最南端是 ___ 暗沙', answer:'曾母', ex:'曾母暗沙' }
    ],
    science: [
      { q:'下列可再生能源中，最常见的是 ___ 能', answer:'太阳', ex:'太阳能可再生' },
      { q:'声音不能在 ___ 中传播', answer:'真空', ex:'声音需介质传播' },
      { q:'光在真空中的速度约为 ___×10⁸ m/s', answer:'3', ex:'约 30 万 km/s' }
    ]
  };

  /* 专注时长档位 → 修为 */
  const FOCUS_OPTIONS = [
    { mins:15, exp:8,   label:'初窥门径' },
    { mins:25, exp:15,  label:'标准番茄' },
    { mins:30, exp:20,  label:'渐入佳境' },
    { mins:45, exp:30,  label:'深度修炼' },
    { mins:60, exp:45,  label:'心无旁骛' },
    { mins:90, exp:75,  label:'闭关大定' }
  ];

  /* 修为奖励规则（用于显示） */
  const EXP_RULES = [
    { act:'记录成绩', exp:'5 + 分数加成' },
    { act:'成绩进步', exp:'+8' },
    { act:'单科满分', exp:'+6' },
    { act:'录入错题', exp:'+8' },
    { act:'标记已掌握', exp:'+4' },
    { act:'练习全对', exp:'+12' },
    { act:'练习≥60%', exp:'+6' },
    { act:'练习<60%', exp:'+2' },
    { act:'专注≥5分', exp:'每分钟+1' }
  ];

  /* ---------- 演示数据（首次加载注入） ---------- */
  function demoData() {
    const today = new Date();
    const d = (n) => { const x = new Date(today); x.setDate(x.getDate()-n); return x.toISOString().slice(0,10); };
    return {
      currentStage: 'middle',
      currentGrade: '初二',
      examType: 'major',
      selectedElectives: ['physics','chemistry','biology'],
      cultivationExp: 480,
      achievements: ['a_first','a_major','a_minor','f_first','f_25','e_first'],
      chartViews: { radar:1, bar:0, line:0, pie:0, subject:0 },
      timeFlags: { morning:1 },
      focusHistory: [
        { id:1, duration:25, completed:true, date:d(2) },
        { id:2, duration:25, completed:true, date:d(0) }
      ],
      errorHistory: [
        { id:1, subject:'math', question:'一元二次方程 x²-5x+6=0 的解', answer:'x=2 或 x=3', analysis:'因式分解 (x-2)(x-3)=0', mastered:false, date:d(2) },
        { id:2, subject:'english', question:'She ___ (go) to school.', answer:'goes', analysis:'第三人称单数', mastered:false, date:d(1) },
        { id:3, subject:'physics', question:'计算 5N 力作用 2kg 物体的加速度', answer:'2.5 m/s²', analysis:'F=ma ⇒ a=F/m', mastered:false, date:d(0) }
      ],
      examHistory: [
        { id:1, date:d(21), stage:'middle', grade:'初二', examType:'major',
          scores:{ chinese:102, math:95, english:108, physics:88, biology:92, politics:85, history:88, geography:91 },
          full:{chinese:120,math:120,english:120,physics:100,biology:100,politics:100,history:100,geography:100},
          total:749, avgPercent:83.9 },
        { id:2, date:d(7), stage:'middle', grade:'初二', examType:'major',
          scores:{ chinese:108, math:104, english:112, physics:92, biology:95, politics:88, history:90, geography:94 },
          full:{chinese:120,math:120,english:120,physics:100,biology:100,politics:100,history:100,geography:100},
          total:783, avgPercent:87.7 },
        { id:3, date:d(2), stage:'middle', grade:'初二', examType:'minor',
          scores:{ math:92 },
          full:{math:100},
          total:92, avgPercent:92.0 }
      ]
    };
  }

  /* 暴露 */
  WL.SUBJECTS = SUBJECTS;
  WL.STAGES = STAGES;
  WL.EXAM_TYPES = EXAM_TYPES;
  WL.gradeOf = gradeOf;
  WL.REALMS = REALMS;
  WL.MAX_EXP = MAX_EXP;
  WL.realmByExp = realmByExp;
  WL.ACHIEVEMENTS = ACHIEVEMENTS;
  WL.ACH_CATS = ACH_CATS;
  WL.MOCK_OPPONENTS = MOCK_OPPONENTS;
  WL.PRACTICE = PRACTICE;
  WL.FOCUS_OPTIONS = FOCUS_OPTIONS;
  WL.EXP_RULES = EXP_RULES;
  WL.AI_CONFIG = AI_CONFIG;
  WL.buildPracticePrompt = buildPracticePrompt;
  WL.buildVerifyPrompt = buildVerifyPrompt;
  WL.demoData = demoData;

  window.WL = WL;
})();
