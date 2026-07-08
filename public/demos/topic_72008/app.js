/* =========================================================
 * 朝夕能量校准 · AI 助手
 * 纯前端实现：八字 → 五行 → 能量仪表盘 → 朝夕建议 → 补给
 * 数据全部保存到 LocalStorage，不上传任何服务器
 * ========================================================= */
(function () {
  'use strict';

  // ---------- 常量 ----------
  const ELEMENTS = ['木', '火', '土', '金', '水'];
  const ELEMENT_META = {
    木: { color: 'var(--c-jade)', soft: 'var(--c-jade-soft)', trait: '生发 · 舒展', organ: '肝 · 筋' },
    火: { color: 'var(--c-rose)', soft: 'var(--c-rose-soft)', trait: '温煦 · 照耀', organ: '心 · 血脉' },
    土: { color: 'var(--c-amber)', soft: 'var(--c-amber-soft)', trait: '承载 · 化育', organ: '脾 · 肌肉' },
    金: { color: 'var(--c-gold)', soft: 'var(--c-gold-soft)', trait: '收敛 · 沉降', organ: '肺 · 皮毛' },
    水: { color: 'var(--c-cyan)', soft: 'var(--c-cyan-soft)', trait: '润下 · 寒凉', organ: '肾 · 骨' },
  };

  const STEMS = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
  const STEM_ELEM = { 甲:'木', 乙:'木', 丙:'火', 丁:'火', 戊:'土', 己:'土', 庚:'金', 辛:'金', 壬:'水', 癸:'水' };
  const BRANCHES = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  const BRANCH_ELEM = { 子:'水', 丑:'土', 寅:'木', 卯:'木', 辰:'土', 巳:'火', 午:'火', 未:'土', 申:'金', 酉:'金', 戌:'土', 亥:'水' };

  const HOUR_TO_BRANCH = {
    0:'子',1:'丑',3:'寅',5:'卯',7:'辰',9:'巳',11:'午',13:'未',15:'申',17:'酉',19:'戌',21:'亥'
  };

  // 时辰序号（子=0, 丑=1, ... 亥=11），用于 lunar-javascript 的时柱推算
  const HOUR_TO_ZHI_INDEX = {
    23:0, 0:0, 1:1, 2:1, 3:2, 4:2, 5:3, 6:3, 7:4, 8:4, 9:5, 10:5,
    11:6, 12:6, 13:7, 14:7, 15:8, 16:8, 17:9, 18:9, 19:10, 20:10, 21:11, 22:11
  };

  // 节气 → 月支映射（简化：以公历月近似月支，仅作为 fallback）
  // 寅(2月)~卯(3月)~辰(4月)~巳(5月)~午(6月)~未(7月)~申(8月)~酉(9月)~戌(10月)~亥(11月)~子(12月)~丑(1月)
  const MONTH_BRANCH = ['丑','寅','卯','辰','巳','午','未','申','酉','戌','亥','子']; // month-1 索引

  // ---------- 工具 ----------
  const $ = (s, root) => (root || document).querySelector(s);
  const $$ = (s, root) => Array.from((root || document).querySelectorAll(s));
  const STORAGE_KEY = 'zhaoxi.user.v1';

  function pad2(n) { return String(n).padStart(2, '0'); }
  function todayKey(d) { d = d || new Date(); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
  function dateLabel(d) {
    d = d || new Date();
    const wk = ['日','一','二','三','四','五','六'][d.getDay()];
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 · 周${wk}`;
  }
  function isMorning(d) { d = d || new Date(); const h = d.getHours(); return h >= 5 && h < 19; }
  function isMorningNow() { return isMorning(new Date()); }

  function getYearStem(y) { return STEMS[((y - 4) % 10 + 10) % 10]; }
  function getYearBranch(y) { return BRANCHES[((y - 4) % 12 + 12) % 12]; }
  function getMonthBranch(m) { return MONTH_BRANCH[(m - 1 + 12) % 12]; }

  // 日干推算（fallback：以 1970-01-01 为基准的简化算法）
  function getDayStemBranch(y, m, d) {
    const base = new Date(1970, 0, 1);
    const target = new Date(y, m - 1, d);
    const diff = Math.round((target - base) / 86400000);
    const stem = STEMS[((diff % 10) + 10) % 10];
    const branch = BRANCHES[((diff % 12) + 12) % 12];
    return { stem, branch };
  }

  // ---------- 真实八字推算（基于 lunar-javascript） ----------
  // 输入：profile { year, month, day, hour, calendar }
  //   calendar: 'solar'(公历,默认) 或 'lunar'(农历)
  //   hour 为 0-23 小时
  // 输出：{ year, month, day, hour } 四柱（每柱为天干+地支的 2 字符串）
  function calcBazi(profile) {
    const { year, month, day, hour } = profile;
    const calendar = profile.calendar || 'solar';

    // 检测 lunar-javascript 是否加载（浏览器中 Solar/Lunar 直接挂到 window）
    const SolarLib = (typeof Solar !== 'undefined') ? Solar : null;
    const LunarLib = (typeof Lunar !== 'undefined') ? Lunar : null;

    // 兜底：如果 lunar-javascript 未加载，使用 fallback 简化算法（仅支持公历）
    if (!SolarLib || (calendar === 'lunar' && !LunarLib)) {
      const yStem = getYearStem(year);
      const yBranch = getYearBranch(year);
      const mBranch = getMonthBranch(month);
      const dPair = getDayStemBranch(year, month, day);
      const hBranch = HOUR_TO_BRANCH[hour] || '子';
      const STEM_BY_YEAR = { 甲:'丙', 己:'丙', 乙:'戊', 庚:'戊', 丙:'庚', 辛:'庚', 丁:'壬', 壬:'壬', 戊:'甲', 癸:'甲' };
      const STEM_BY_DAY  = { 甲:'甲', 己:'甲', 乙:'丙', 庚:'丙', 丙:'戊', 辛:'戊', 丁:'庚', 壬:'庚', 戊:'壬', 癸:'壬' };
      return {
        year:  yStem + yBranch,
        month: (STEM_BY_YEAR[yStem] || '甲') + mBranch,
        day:   dPair.stem + dPair.branch,
        hour:  (STEM_BY_DAY[dPair.stem] || '甲') + hBranch,
        _fallback: true,
      };
    }

    // 真实推算：lunar-javascript
    // 时柱地支序号（子=0...亥=11）
    const zhiIndex = HOUR_TO_ZHI_INDEX[hour] !== undefined ? HOUR_TO_ZHI_INDEX[hour] : 0;
    // lunar-javascript 的 LunarTime 时辰需要 1-12 范围（子=1, 丑=2, ... 亥=12）
    const lunarHour = zhiIndex + 1;
    const hForSolar = hour >= 23 ? 23 : hour;

    let solarDate;
    if (calendar === 'lunar') {
      // 农历输入：用 Lunar.fromYmdHms 创建，再转 Solar 取八字
      // 注意：农历闰月用负数表示（如 -5 表示闰五月）
      const lunarDate = LunarLib.fromYmdHms(year, month, day, lunarHour, 0, 0);
      solarDate = lunarDate.getSolar();
    } else {
      // 公历输入
      solarDate = SolarLib.fromYmdHms(year, month, day, hForSolar, 0, 0);
    }
    const eightChar = solarDate.getLunar().getEightChar();

    return {
      year:  eightChar.getYear(),   // 如 "甲子"
      month: eightChar.getMonth(),  // 如 "丙寅"
      day:   eightChar.getDay(),    // 如 "戊午"
      hour:  eightChar.getTime(),   // 如 "甲子"
      _fallback: false,
    };
  }

  // ---------- 八字五行强度权重（先天底盘，终身不变） ----------
  // 返回 { 木: 2, 火: -1, ... }，范围 -2 ~ +2
  // +2 = 偏旺（天生易亢），0 = 平，-2 = 偏弱（天生易虚）
  function calcBaziStrength(profile) {
    const pillars = calcBazi(profile);
    const yStem = pillars.year[0];   const yBranch = pillars.year[1];
    const mStem = pillars.month[0];  const mBranch = pillars.month[1];
    const dStem = pillars.day[0];    const dBranch = pillars.day[1];
    const hStem = pillars.hour[0];   const hBranch = pillars.hour[1];

    const refs = [
      { el: STEM_ELEM[yStem],   w: 1.2 },
      { el: BRANCH_ELEM[yBranch], w: 1.0 },
      { el: STEM_ELEM[mStem],   w: 1.4 },
      { el: BRANCH_ELEM[mBranch], w: 1.4 },
      { el: STEM_ELEM[dStem],   w: 2.0 }, // 日主最重
      { el: BRANCH_ELEM[dBranch], w: 1.0 },
      { el: STEM_ELEM[hStem],   w: 1.0 },
      { el: BRANCH_ELEM[hBranch], w: 1.0 },
    ];

    const raw = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
    refs.forEach(r => { raw[r.el] += r.w; });
    const total = ELEMENTS.reduce((s, el) => s + raw[el], 0);
    const avg = total / ELEMENTS.length;

    // 偏离均值 → 归一化到 -2 ~ +2
    const strength = {};
    ELEMENTS.forEach(el => {
      const diff = raw[el] - avg;            // 大约 -3 ~ +3
      let s = Math.round(diff / 1.2);         // 粗映射到 -2~+2
      s = Math.max(-2, Math.min(2, s));
      strength[el] = s;
    });
    return { strength, pillars, raw, dayMaster: { stem: dStem, elem: STEM_ELEM[dStem], branch: dBranch } };
  }

  // ---------- 问卷当下能量快照（每天变） ----------
  // 仅基于问卷答案，不依赖八字
  // 返回 { elScore, total, level, dominantTag, levelColor }
  function calcQuizSnapshot(quizAnswers) {
    const elScore = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
    let total = 0;
    if (quizAnswers && quizAnswers.length) {
      quizAnswers.forEach(a => {
        if (a.el && elScore[a.el] !== undefined) {
          elScore[a.el] += a.value;
          total += a.value;
        }
      });
    }
    // 当下能量等级（按总分）
    let level, levelColor;
    if (total >= 8)       { level = '充盈'; levelColor = 'green'; }
    else if (total >= 4)  { level = '良好'; levelColor = 'blue'; }
    else if (total >= -2) { level = '一般'; levelColor = 'yellow'; }
    else if (total >= -8) { level = '偏低'; levelColor = 'orange'; }
    else                  { level = '亏空'; levelColor = 'red'; }

    // 主导激活 tag：得分最低（最失衡）的五行
    let dominantTag = null;
    let minScore = Infinity;
    ELEMENTS.forEach(el => {
      if (elScore[el] < minScore) { minScore = elScore[el]; dominantTag = el; }
    });
    if (minScore >= 0) dominantTag = null; // 都没失失衡则无主导

    return { elScore, total, level, levelColor, dominantTag };
  }

  // ---------- 核心算法：先天底盘 × 当下激活 = 融合能量 ----------
  // 两层关系：
  //   八字 = 先天底盘（终身不变，决定"你容易在哪一行出问题"）
  //   问卷 = 当下快照（每天变，决定"今天你正好在哪一行出事了"）
  // 融合公式：final = base_bazi + quiz_delta × (1 + bazi_strength[tag] × 0.15)
  //   - base_bazi：八字先天能量（25-95）
  //   - quiz_delta：问卷得分映射的能量偏移
  //   - 乘法系数：八字该行越偏旺，同样分值影响越大（老毛病更严重）
  function calcEnergies(profile, refDate, quizAnswers) {
    const bazi = calcBaziStrength(profile);
    const { strength, pillars, dayMaster } = bazi;

    // 第一层：八字先天底盘能量（25-95）
    const base = { 木: 50, 火: 50, 土: 50, 金: 50, 水: 50 };
    bazi.raw && ELEMENTS.forEach(el => { base[el] += bazi.raw[el] * 6; });

    // 当日 / 当季流转（先天到今天的流转情况）
    const seasonal = { 1:'水', 2:'木', 3:'木', 4:'木', 5:'火', 6:'火', 7:'火', 8:'土', 9:'金', 10:'金', 11:'金', 12:'水' }[refDate.getMonth() + 1];
    const dayElem = dayMaster.elem;
    base[seasonal] += 6;
    base[dayElem] += 4;

    const cycle = { 木:'火', 火:'土', 土:'金', 金:'水', 水:'木' };
    const reverse = { 木:'水', 火:'木', 土:'火', 金:'土', 水:'金' };
    base[cycle[dayElem]] += 3;
    base[reverse[dayElem]] -= 4;

    // 当日确定性小幅波动
    const seed = refDate.getFullYear() * 10000 + (refDate.getMonth() + 1) * 100 + refDate.getDate();
    ELEMENTS.forEach((el, i) => {
      const v = ((seed >> (i * 3)) ^ (seed * (i + 3))) & 0xff;
      base[el] += ((v % 11) - 5);
    });

    // 先天底盘能量（保留一份作为"先天流转"展示）
    const innateClamp = (v) => Math.max(25, Math.min(95, Math.round(v)));
    const innate = {};
    ELEMENTS.forEach(el => { innate[el] = innateClamp(base[el]); });

    // 第二层：问卷当下激活 + 乘法融合
    const snapshot = calcQuizSnapshot(quizAnswers);
    const fused = {};
    ELEMENTS.forEach(el => {
      const quizDelta = snapshot.elScore[el] * 3;        // 问卷分值 → 能量偏移（-3~+2 → -9~+6）
      // 乘法融合：八字该行越偏旺，同样分值影响越大
      const modifier = 1 + strength[el] * 0.15;           // 0.7 ~ 1.3
      const adjusted = quizDelta * modifier;
      fused[el] = innateClamp(base[el] + adjusted);
    });

    return {
      energies: fused,              // 融合后能量（展示主值）
      innate,                        // 先天底盘能量（对比展示）
      dayMaster,
      pillars,
      strength,                      // 八字五行强度权重（-2~+2）
      quiz: snapshot,                // 问卷当下快照
      _fallback: pillars._fallback,
    };
  }

  // 找出最弱的两项作为补给目标
  function pickDeficiencies(energies) {
    return ELEMENTS.slice().sort((a, b) => energies[a] - energies[b]).slice(0, 2);
  }

  // ---------- 内容库 ----------
  // ---------- 补/泄建议矩阵（tag × 八字旺弱） ----------
  // tag = 问卷激活的五行（今天哪扇门开了）
  // 八字对该行旺弱 → 决定"补"还是"泄"
  //   旺（strength ≥ 1）+ tag 激活 → 老毛病亢盛 → 泄（疏导、收敛）
  //   弱（strength ≤ -1）+ tag 激活 → 新伤耗损 → 补（滋养、培固）
  //   平（strength = 0）→ 中性调和
  const ADVICE_MATRIX = {
    木: {
      旺: { dir: '泄', desc: '木亢老毛病 · 疏肝泄木',
            tips: ['午间离工位散步 10 分钟', '看看窗外绿植', '下午少喝咖啡', '忌发怒、忌油腻'],
            eveningTips: ['睡前远离屏幕 30 分钟', '温热甘菊茶 1 杯', '闭目调息 6 次', '忌深夜争论'] },
      平: { dir: '调', desc: '木气不调 · 理气疏肝',
            tips: ['早起舒展 5 分钟', '菊花枸杞茶', '深呼吸 6 次'],
            eveningTips: ['睡前 5 分钟拉伸肝经', '温热玫瑰花茶', '侧卧默数呼吸 6 次'] },
      弱: { dir: '补', desc: '木虚新伤 · 养血柔肝',
            tips: ['23 点前入睡', '酸味水果 · 菠菜', '避风寒', '减少决策类工作'],
            eveningTips: ['22:30 前关灯', '温牛奶 1 小杯', '左侧卧舒肝', '忌夜间加班'] },
    },
    火: {
      旺: { dir: '泄', desc: '火亢扰动 · 清心降火',
            tips: ['少晒太阳', '忌辛辣', '21 点后收光', '冷水洁面'],
            eveningTips: ['21 点后全屋低光', '薄荷柠檬温水', '静坐观息 8 分钟', '忌夜宵辛辣'] },
      平: { dir: '调', desc: '火气不稳 · 安神定志',
            tips: ['10 分钟轻瑜伽', '红枣枸杞茶', '午间小憩 15 分钟'],
            eveningTips: ['5 分钟温和瑜伽', '桂圆红枣茶 1 杯', '4-7-8 呼吸法 4 轮'] },
      弱: { dir: '补', desc: '火虚无力 · 温阳养心',
            tips: ['晒太阳 15 分钟', '红枣 · 樱桃', '午休 15 分钟', '避免熬夜'],
            eveningTips: ['睡前暖光台灯 15 分钟', '温热红枣水 1 杯', '掌心捂心口 3 分钟', '忌深夜刷屏'] },
    },
    土: {
      旺: { dir: '泄', desc: '土滞壅塞 · 运脾化湿',
            tips: ['饭后快走 10 分钟', '忌甜腻', '揉腹 36 圈', '赤足踩地'],
            eveningTips: ['睡前揉腹 36 圈', '陈皮普洱茶 1 杯', '忌夜宵甜腻', '赤足踩地 1 分钟'] },
      平: { dir: '调', desc: '土气不和 · 健脾和中',
            tips: ['小米粥 · 山药', '规律三餐', '陈皮普洱'],
            eveningTips: ['顺时针揉腹 5 分钟', '温热陈皮水 1 杯', '规律就寝时间'] },
      弱: { dir: '补', desc: '土虚乏力 · 培土固本',
            tips: ['山药 · 小米粥', '南瓜 · 黄豆', '规律三餐', '忌生冷'],
            eveningTips: ['温热小米米浆 1 小杯', '揉腹 5 分钟', '21 点前完成晚餐', '忌夜间生冷'] },
    },
    金: {
      旺: { dir: '泄', desc: '金燥亢盛 · 润肺生津',
            tips: ['雪梨 · 银耳', '少说话', '卧室加湿', '薄荷柠檬水'],
            eveningTips: ['卧室加湿器开 1 小时', '温热蜂蜜水 1 小杯', '少语静默 10 分钟', '忌深夜高声'] },
      平: { dir: '调', desc: '金气不收 · 敛肺固表',
            tips: ['深呼吸 8 次', '白萝卜 · 山药', '拉伸肩颈 3 分钟'],
            eveningTips: ['睡前深呼吸 8 次', '温热百合水 1 杯', '肩颈拉伸 3 分钟'] },
      弱: { dir: '补', desc: '金虚陷落 · 补益肺气',
            tips: ['白色食物 · 百合', '深呼吸练习', '清晨冷水洗面', '避风寒'],
            eveningTips: ['睡前深呼吸 8 次', '温热银耳莲子汤 1 小碗', '颈部保暖', '忌空调直吹'] },
    },
    水: {
      旺: { dir: '泄', desc: '水寒偏盛 · 温阳化气',
            tips: ['姜茶 · 桂圆', '避冷水', '适度出汗', '忌冷饮'],
            eveningTips: ['温水泡脚 15 分钟', '温热姜枣茶 1 杯', '忌夜间冷水', '关窗避风'] },
      平: { dir: '调', desc: '水气不涵 · 滋阴潜阳',
            tips: ['黑芝麻 · 黑豆', '睡前冥想 10 分钟', '泡脚 15 分钟'],
            eveningTips: ['泡脚 15 分钟', '温热黑芝麻糊 1 小杯', '冥想 10 分钟', '听雨声白噪音'] },
      弱: { dir: '补', desc: '水虚不足 · 滋阴补肾',
            tips: ['黑芝麻 · 黑豆 · 桑葚', '泡脚 15 分钟', '22 点前入眠', '右侧卧'],
            eveningTips: ['热水泡脚 15 分钟', '温热黑豆水 1 小杯', '22 点前关灯', '右侧卧默息'] },
    },
  };

  // 根据 tag + 八字强度 + 模式，返回该行的建议方向
  function lookupAdvice(tag, strengthVal, mode) {
    const m = ADVICE_MATRIX[tag];
    if (!m) return null;
    let key;
    if (strengthVal >= 1) key = '旺';
    else if (strengthVal <= -1) key = '弱';
    else key = '平';
    const entry = m[key];
    const tips = (mode === 'evening' && entry.eveningTips) ? entry.eveningTips : entry.tips;
    return Object.assign({ tag, strengthKey: key }, entry, { tips });
  }

  const REMEDIES = {
    木: {
      食: ['菠菜 · 芹菜 · 绿豆', '青苹果 · 猕猴桃', '菊花枸杞茶'],
      饮: ['温热甘菊茶 1 杯', '玫瑰花茶 1 杯', '温牛奶 1 小杯'],
      动: ['早起舒展 5 分钟', '靠窗远眺', '公园轻步 20 分钟'],
      色: '青绿、翠色',
      方: '东方',
      音: '角音 · 轻扬的木质感',
      眠: '23 点前入睡 · 左侧卧',
    },
    火: {
      食: ['红枣 · 枸杞', '番茄 · 樱桃', '温性的红茶 / 玫瑰花茶'],
      饮: ['桂圆红枣茶 1 杯', '温热红枣水 1 杯', '薄荷柠檬温水'],
      动: ['10 分钟轻瑜伽', '深呼吸 6 次', '午间小憩 15 分钟'],
      色: '朱红、暖橘',
      方: '南方',
      音: '徵音 · 温润上扬',
      眠: '避免熬夜 · 22:30 收光',
    },
    土: {
      食: ['小米粥 · 山药', '南瓜 · 黄豆', '陈皮普洱'],
      饮: ['温热陈皮水 1 杯', '温热小米米浆 1 小杯', '陈皮普洱 1 杯'],
      动: ['饭后慢走 10 分钟', '揉腹 36 圈', '赤足踩草地'],
      色: '姜黄、暖米',
      方: '中央',
      音: '宫音 · 沉稳中正',
      眠: '睡前 30 分钟远离屏幕',
    },
    金: {
      食: ['雪梨 · 银耳', '白萝卜 · 山药', '薄荷柠檬水'],
      饮: ['温热蜂蜜水 1 小杯', '温热百合水 1 杯', '温热银耳莲子汤 1 小碗'],
      动: ['深呼吸 8 次', '清晨冷水洗面', '拉伸肩颈 3 分钟'],
      色: '白金、香槟',
      方: '西方',
      音: '商音 · 清亮收敛',
      眠: '保持卧室微凉 · 21 点后少语',
    },
    水: {
      食: ['黑芝麻 · 黑豆', '桑葚 · 蓝莓', '温白开 / 桂圆红枣茶'],
      饮: ['温热姜枣茶 1 杯', '温热黑芝麻糊 1 小杯', '温热黑豆水 1 小杯'],
      动: ['睡前冥想 10 分钟', '泡脚 15 分钟', '听雨声白噪音'],
      色: '墨黑、远山蓝',
      方: '北方',
      音: '羽音 · 沉静下行',
      眠: '22 点前入眠 · 右侧卧',
    },
  };

  const SESSIONS = {
    morning: {
      title: '晨间校准',
      sub: '醒神 · 调息 · 立念',
      poems: [
        '晨光初照，调息为上。',
        '日出东方，肝木初醒。',
        '一呼一吸，便是新的一天。',
        '晨起先问己身，再问世界。',
      ],
      leads: [
        '清晨是肝木生发、心火初燃的时辰。建议你用 3 分钟完成一次呼吸校准：',
        '早晨五行以木、火为主气，把这一天的"基调"调高，整日都会有支撑：',
      ],
      rituals: [
        { k: '呼吸', v: '4-7-8 呼吸 × 4 轮' },
        { k: '伸展', v: '颈部 + 侧腰 × 3 分钟' },
        { k: '一杯水', v: '温白开 200ml' },
        { k: '一念', v: '写下今日一件想完成的小事' },
      ],
    },
    evening: {
      title: '睡前校准',
      sub: '回收 · 静心 · 入眠',
      poems: [
        '夜阑如水，收光为上。',
        '静坐一刻，万事可歇。',
        '把今日还给今日。',
        '月光不问归人，先安自己。',
      ],
      leads: [
        '夜属水、主静。睡前 30 分钟，是让金水回收、身心沉降的关键窗口：',
        '把今日的疲惫轻柔放下，给明晨的苏醒留出空间：',
      ],
      rituals: [
        { k: '收光', v: '调暗室内灯，关闭蓝光屏' },
        { k: '泡脚', v: '温水 15 分钟（水虚者加艾草）' },
        { k: '呼吸', v: '腹式呼吸 6 轮' },
        { k: '一句结语', v: '对自己说一句温柔的"今天辛苦了"' },
      ],
    },
  };

  const VERSES = [
    '不求万事皆顺，只愿身心有安。',
    '把今日还给今日，把明天留给明天。',
    '呼吸之间，便是归处。',
    '心若安住，何处不是朝起夕归。',
    '忙中作序，静中得养。',
    '今日不争不躁，便已胜过昨日。',
    '吃好一顿饭，睡好一觉，便是修行。',
    '温柔待己，五行自和。',
    '事来则应，事去则忘。',
    '一身轻装，便可远行。',
    '晨起问心，夜寐问身。',
    '愿你今日，少一点紧绷，多一点呼吸。',
  ];

  // ---------- 问题库（晨间20题 + 睡前20题） ----------
  // 每题：{ id, dim, text, opts:[{t, v}], el }
  // dim: emotion 情绪 / body 身体 / mind 精神 / social 社交(晨)或 sleep 睡眠(夜)
  // el: 五行关联标签
  const QUESTIONS = {
    morning: [
      // 维度A：情绪状态
      { id:'M01', dim:'emotion', el:'木', text:'睁开眼的第一瞬间，你心里的感觉是？',
        opts:[{t:'平静安稳',v:2},{t:'有点抗拒',v:-1},{t:'莫名烦躁',v:-2},{t:'一片空白',v:0}] },
      { id:'M02', dim:'emotion', el:'火', text:'想到今天要做的事，你的第一反应是？',
        opts:[{t:'有点期待',v:2},{t:'无所谓',v:0},{t:'压力山大',v:-2},{t:'想逃避',v:-3}] },
      { id:'M03', dim:'emotion', el:'水', text:'昨晚睡得好吗？现在的情绪基调是？',
        opts:[{t:'休息充分',v:2},{t:'还行吧',v:1},{t:'有点累',v:-1},{t:'非常疲惫',v:-2}] },
      { id:'M04', dim:'emotion', el:'金', text:'今早有没有特别让你开心或不开心的事？',
        opts:[{t:'有开心事',v:2},{t:'没什么特别',v:0},{t:'有点烦心事',v:-1},{t:'糟透了',v:-3}] },
      { id:'M05', dim:'emotion', el:'土', text:'你对今天的自己有多少信心？',
        opts:[{t:'信心满满',v:2},{t:'还可以',v:1},{t:'有点虚',v:-1},{t:'很没底',v:-2}] },
      // 维度B：身体感受
      { id:'M06', dim:'body', el:'土', text:'起床后，身体的轻盈程度如何？',
        opts:[{t:'轻松有力',v:2},{t:'稍微沉重',v:0},{t:'明显酸痛',v:-1},{t:'像被压住',v:-2}] },
      { id:'M07', dim:'body', el:'木', text:'你的头部感觉怎么样？',
        opts:[{t:'清醒舒服',v:2},{t:'微微发紧',v:-1},{t:'昏沉胀痛',v:-2},{t:'眩晕恶心',v:-3}] },
      { id:'M08', dim:'body', el:'火', text:'眼睛睁开后，舒适度如何？',
        opts:[{t:'明亮润泽',v:2},{t:'有点干涩',v:-1},{t:'睁不开',v:-2},{t:'刺痛流泪',v:-3}] },
      { id:'M09', dim:'body', el:'金', text:'喉咙和口腔的感觉是？',
        opts:[{t:'清爽无异味',v:2},{t:'微干',v:0},{t:'口苦黏腻',v:-1},{t:'咽喉肿痛',v:-2}] },
      { id:'M10', dim:'body', el:'水', text:'肠胃有没有不适感？',
        opts:[{t:'一切正常',v:2},{t:'有点饿',v:0},{t:'腹胀反酸',v:-1},{t:'腹痛腹泻',v:-2}] },
      // 维度C：精神状态
      { id:'M11', dim:'mind', el:'火', text:'现在让你回忆昨天做过的事，你能想起多少？',
        opts:[{t:'大部分记得',v:2},{t:'一些模糊',v:0},{t:'几乎忘了',v:-1},{t:'完全不记得',v:-2}] },
      { id:'M12', dim:'mind', el:'金', text:'如果现在给你一本书，你能看进去吗？',
        opts:[{t:'能专注阅读',v:2},{t:'勉强看看',v:0},{t:'走神严重',v:-1},{t:'看不下去',v:-2}] },
      { id:'M13', dim:'mind', el:'木', text:'你的大脑运转速度感觉如何？',
        opts:[{t:'思维敏捷',v:2},{t:'正常速度',v:0},{t:'有点卡顿',v:-1},{t:'一团浆糊',v:-2}] },
      { id:'M14', dim:'mind', el:'水', text:'对新信息的接受意愿有多强？',
        opts:[{t:'很想学习',v:2},{t:'可以接受',v:1},{t:'懒得动脑',v:-1},{t:'排斥信息',v:-2}] },
      { id:'M15', dim:'mind', el:'火', text:'你觉得自己今天创造力怎么样？',
        opts:[{t:'灵感很多',v:2},{t:'一般般',v:0},{t:'没什么想法',v:-1},{t:'脑子空空',v:-2}] },
      // 维度D：社交准备
      { id:'M16', dim:'social', el:'火', text:'今天你想跟人交流吗？',
        opts:[{t:'很想聊天',v:2},{t:'正常交流',v:0},{t:'尽量少说',v:-1},{t:'别跟我说话',v:-2}] },
      { id:'M17', dim:'social', el:'木', text:'如果有同事跟你打招呼，你会怎么回应？',
        opts:[{t:'热情回应',v:2},{t:'礼貌微笑',v:1},{t:'点头示意',v:0},{t:'假装没看见',v:-2}] },
      { id:'M18', dim:'social', el:'金', text:'你今天愿意主动发起对话吗？',
        opts:[{t:'会主动',v:2},{t:'看情况',v:0},{t:'不太会',v:-1},{t:'绝对不会',v:-2}] },
      { id:'M19', dim:'social', el:'土', text:'对团队合作的态度是？',
        opts:[{t:'很乐意',v:2},{t:'可以配合',v:1},{t:'只想独处',v:-1},{t:'讨厌协作',v:-2}] },
      { id:'M20', dim:'social', el:'水', text:'如果有人找你帮忙，你的第一反应是？',
        opts:[{t:'当然可以',v:2},{t:'看忙不忙',v:0},{t:'有点烦',v:-1},{t:'别找我',v:-2}] },
    ],
    evening: [
      // 维度A：情绪状态
      { id:'N01', dim:'emotion', el:'木', text:'回想今天，你整体的心情是？',
        opts:[{t:'充实愉快',v:2},{t:'平平淡淡',v:0},{t:'有些郁闷',v:-1},{t:'糟糕透顶',v:-3}] },
      { id:'N02', dim:'emotion', el:'火', text:'今天有没有让你反复纠结的事情？',
        opts:[{t:'完全没有',v:2},{t:'偶尔闪过',v:-1},{t:'想了好几次',v:-2},{t:'一直放不下',v:-3}] },
      { id:'N03', dim:'emotion', el:'土', text:'你对今天自己的表现满意吗？',
        opts:[{t:'很满意',v:2},{t:'还行',v:1},{t:'不太满意',v:-1},{t:'很差劲',v:-2}] },
      { id:'N04', dim:'emotion', el:'金', text:'今天有没有感受到温暖或被理解？',
        opts:[{t:'有，很感动',v:2},{t:'一点点',v:1},{t:'没有',v:-1},{t:'反而受伤了',v:-3}] },
      { id:'N05', dim:'emotion', el:'水', text:'此刻内心的平静程度如何？',
        opts:[{t:'非常安宁',v:2},{t:'还算平静',v:1},{t:'有点不安',v:-1},{t:'焦躁难安',v:-2}] },
      // 维度B：身体感受
      { id:'N06', dim:'body', el:'土', text:'现在身体的疲劳程度是？',
        opts:[{t:'适度疲劳',v:1},{t:'有点累',v:0},{t:'非常疲惫',v:-1},{t:'虚脱感',v:-2}] },
      { id:'N07', dim:'body', el:'木', text:'肩膀和脖子的感觉如何？',
        opts:[{t:'放松柔软',v:2},{t:'微微发紧',v:-1},{t:'僵硬酸痛',v:-2},{t:'头痛欲裂',v:-3}] },
      { id:'N08', dim:'body', el:'水', text:'腿脚有没有浮肿或沉重感？',
        opts:[{t:'轻松无感',v:2},{t:'略微沉重',v:0},{t:'明显浮肿',v:-1},{t:'酸胀难忍',v:-2}] },
      { id:'N09', dim:'body', el:'金', text:'皮肤有没有不舒服？',
        opts:[{t:'光滑舒适',v:2},{t:'有点干燥',v:-1},{t:'发痒起疹',v:-2},{t:'刺痛灼热',v:-3}] },
      { id:'N10', dim:'body', el:'金', text:'呼吸是否顺畅？',
        opts:[{t:'深长平稳',v:2},{t:'稍微急促',v:0},{t:'胸闷气短',v:-1},{t:'呼吸困难',v:-3}] },
      // 维度C：精神消耗
      { id:'N11', dim:'mind', el:'火', text:'今天用脑过度了吗？',
        opts:[{t:'刚刚好',v:2},{t:'有点累',v:0},{t:'很透支',v:-1},{t:'脑力耗尽',v:-2}] },
      { id:'N12', dim:'mind', el:'木', text:'今天有没有做什么决定？',
        opts:[{t:'果断决策',v:2},{t:'小事而已',v:0},{t:'犹豫很久',v:-1},{t:'什么都没定',v:-2}] },
      { id:'N13', dim:'mind', el:'水', text:'今天接收的信息量感觉如何？',
        opts:[{t:'适量有益',v:2},{t:'正常范围',v:0},{t:'太多了',v:-1},{t:'信息爆炸',v:-2}] },
      { id:'N14', dim:'mind', el:'金', text:'今天有没有让你意外或冲击的事？',
        opts:[{t:'没有，很平稳',v:2},{t:'小事一件',v:0},{t:'有点震惊',v:-1},{t:'打击很大',v:-3}] },
      { id:'N15', dim:'mind', el:'土', text:'今天有没有完成什么有意义的事？',
        opts:[{t:'完成了重要的事',v:2},{t:'日常琐事',v:0},{t:'没什么进展',v:-1},{t:'一事无成',v:-2}] },
      // 维度D：睡眠准备
      { id:'N16', dim:'sleep', el:'水', text:'现在闭上眼睛，你能多久睡着？',
        opts:[{t:'很快就能',v:2},{t:'可能需要一会儿',v:0},{t:'肯定会失眠',v:-1},{t:'完全睡不着',v:-2}] },
      { id:'N17', dim:'sleep', el:'火', text:'今晚有没有让你兴奋或担心明天的事？',
        opts:[{t:'完全没有',v:2},{t:'有一点点',v:-1},{t:'挺担心的',v:-2},{t:'焦虑到睡不着',v:-3}] },
      { id:'N18', dim:'sleep', el:'金', text:'房间的温度和光线让你感觉？',
        opts:[{t:'非常舒适',v:2},{t:'还可以',v:0},{t:'有点不舒服',v:-1},{t:'完全不适合',v:-2}] },
      { id:'N19', dim:'sleep', el:'木', text:'今天有没有喝咖啡、茶或酒精？',
        opts:[{t:'都没有',v:2},{t:'少量淡茶',v:1},{t:'一杯咖啡',v:0},{t:'咖啡+酒',v:-2}] },
      { id:'N20', dim:'sleep', el:'土', text:'你睡前最后一件事是？',
        opts:[{t:'冥想/阅读',v:2},{t:'听音乐',v:1},{t:'刷手机',v:0},{t:'处理工作',v:-2}] },
    ],
  };

  // 每个场景抽取的题目数（共 10 题：每维度 2-3 题）
  const QUIZ_COUNT = 10;
  const DIMENSIONS = ['emotion', 'body', 'mind', 'social', 'sleep'];

  // 问卷调度：每维度按权重抽取，共 QUIZ_COUNT 题
  function pickQuizQuestions(mode) {
    const pool = QUESTIONS[mode] || QUESTIONS.morning;
    // 按维度分组
    const byDim = {};
    pool.forEach(q => { (byDim[q.dim] = byDim[q.dim] || []).push(q); });
    // 每维度先各抽 2 题 = 8 题，再从剩余题目随机抽 2 题补足
    const picked = [];
    const remaining = [];
    DIMENSIONS.forEach(d => {
      const arr = (byDim[d] || []).slice();
      // 随机洗牌
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      // 该维度取 2 题
      const take = Math.min(2, arr.length);
      picked.push(...arr.slice(0, take));
      remaining.push(...arr.slice(take));
    });
    // 补足到 QUIZ_COUNT
    for (let i = remaining.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
    }
    let k = 0;
    while (picked.length < QUIZ_COUNT && k < remaining.length) {
      picked.push(remaining[k++]);
    }
    // 整体洗牌（避免同维度连续）
    for (let i = picked.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [picked[i], picked[j]] = [picked[j], picked[i]];
    }
    // 防止同维度连续：相邻同维度则与后面交换
    for (let i = 1; i < picked.length - 1; i++) {
      if (picked[i].dim === picked[i - 1].dim) {
        // 找后面不同维度的换
        for (let j = i + 1; j < picked.length; j++) {
          if (picked[j].dim !== picked[i - 1].dim) {
            [picked[i], picked[j]] = [picked[j], picked[i]];
            break;
          }
        }
      }
    }
    return picked.slice(0, QUIZ_COUNT);
  }

  // ---------- 状态 ----------
  const state = {
    profile: null,        // { year, month, day, hour, calendar:'solar'|'lunar', nickname, city }
    mode: 'morning',      // morning | evening
    energies: null,       // { 木:80, 火:60, ... }
    dayInfo: null,        // { dayMaster, refsText }
    deficiency: null,     // [el1, el2]
    verse: '',
    // 问卷状态
    quiz: {
      questions: [],      // 本次抽到的题目
      idx: 0,             // 当前题目索引
      answers: [],        // [{ qid, dim, el, value }]
      done: false,        // 是否完成
    },
  };

  // 问卷当日缓存 key（按日 + 场景）
  function quizStorageKey(mode, d) {
    d = d || new Date();
    return 'zhaoxi.quiz.' + (mode || state.mode) + '.' + todayKey(d);
  }

  // 保存当日问卷
  function saveQuiz(mode, answers) {
    try {
      localStorage.setItem(quizStorageKey(mode), JSON.stringify({ answers, savedAt: Date.now() }));
    } catch (e) {}
  }
  // 读取当日问卷（返回 answers 数组或 null）
  function loadQuiz(mode) {
    try {
      const raw = localStorage.getItem(quizStorageKey(mode));
      if (!raw) return null;
      const obj = JSON.parse(raw);
      if (obj && Array.isArray(obj.answers)) return obj.answers;
    } catch (e) {}
    return null;
  }

  // ---------- 持久化 ----------
  function loadProfile() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const obj = JSON.parse(raw);
      if (obj && obj.profile) return obj;
    } catch (e) { /* ignore */ }
    return null;
  }
  function saveProfile(profile) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ profile, savedAt: Date.now() })); }
    catch (e) { /* ignore */ }
  }
  function clearProfile() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
  }

  // ---------- 渲染 ----------
  function renderMeter(energies) {
    const list = $('#meterList');
    list.innerHTML = '';
    ELEMENTS.forEach(el => {
      const row = document.createElement('li');
      row.className = 'meter__row';
      row.dataset.el = el;
      row.innerHTML = `
        <div class="meter__icon" data-el="${el}">${el}</div>
        <div>
          <div class="meter__label">
            <span class="meter__name">${el}</span>
            <span>${ELEMENT_META[el].trait}</span>
          </div>
          <div class="meter__bar">
            <div class="meter__fill" data-fill></div>
            <div class="meter__innate" data-innate title="先天底盘"></div>
          </div>
        </div>
        <div class="meter__value" data-val>0</div>
      `;
      list.appendChild(row);
    });

    // 显式四柱
    if (state.dayInfo && state.dayInfo.pillars) {
      $('#pillarYear').textContent  = state.dayInfo.pillars.year;
      $('#pillarMonth').textContent = state.dayInfo.pillars.month;
      $('#pillarDay').textContent   = state.dayInfo.pillars.day;
      $('#pillarHour').textContent  = state.dayInfo.pillars.hour;
    }

    // 触发动画：显示融合能量，同时标注先天底盘
    requestAnimationFrame(() => {
      $$('.meter__row', list).forEach(row => {
        const el = row.dataset.el;
        const v = energies[el];
        const innateV = (state.energies_innate && state.energies_innate[el]) || v;
        row.querySelector('[data-fill]').style.width = v + '%';
        row.querySelector('[data-val]').textContent = v;
        // 先天底盘标记（小三角/刻度）
        const innateMark = row.querySelector('[data-innate]');
        if (innateMark) {
          innateMark.style.left = innateV + '%';
          innateMark.title = '先天底盘 ' + innateV;
        }
      });
    });

    // 头部副标题：区分"当下激活"与"先天底盘"
    const deficient = pickDeficiencies(energies);
    const strongest = ELEMENTS.slice().sort((a, b) => energies[b] - energies[a])[0];
    const quiz = state.quizSnapshot;
    const quizLine = quiz ? ` · 当下${quiz.level}` : '';
    $('#meterSub').textContent =
      `先天 ${strongest} 偏旺 · ${deficient.join('、')} 偏弱${quizLine}`;
  }

  // 渲染"当下快照 vs 先天流转 vs 融合结果"对比摘要
  function renderFusionSummary() {
    const box = $('#fusionSummary');
    if (!box) return;
    const quiz = state.quizSnapshot;
    const strength = state.strength || {};
    const energies = state.energies || {};
    const innate = state.energies_innate || {};

    if (!quiz) { box.hidden = true; return; }
    box.hidden = false;

    // 当下快照
    $('#fusionQuizLevel').textContent = quiz.level;
    $('#fusionQuizLevel').className = 'fusion__value fusion__value--' + quiz.levelColor;
    $('#fusionQuizHint').textContent = quiz.dominantTag
      ? `今日 ${quiz.dominantTag} 被激活（${quiz.total > 0 ? '+' : ''}${quiz.total} 分）`
      : `总分 ${quiz.total > 0 ? '+' : ''}${quiz.total}，无明显失衡`;

    // 先天流转
    const innateStrong = ELEMENTS.slice().sort((a, b) => (innate[b] || 0) - (innate[a] || 0))[0];
    const innateWeak = ELEMENTS.slice().sort((a, b) => (innate[a] || 0) - (innate[b] || 0))[0];
    const dayMaster = state.dayInfo && state.dayInfo.dayMaster;
    $('#fusionInnate').textContent = dayMaster ? `${dayMaster.stem}（${dayMaster.elem}）` : '—';
    $('#fusionInnate').className = 'fusion__value';
    $('#fusionInnateHint').textContent = `先天 ${innateStrong} 偏旺 · ${innateWeak} 偏弱`;

    // 融合结果
    const fusedStrong = ELEMENTS.slice().sort((a, b) => energies[b] - energies[a])[0];
    const fusedWeak = ELEMENTS.slice().sort((a, b) => energies[a] - energies[b])[0];
    const fusedAvg = Math.round(ELEMENTS.reduce((s, el) => s + energies[el], 0) / ELEMENTS.length);
    let fusedLevel = '一般', fusedColor = 'yellow';
    if (fusedAvg >= 70) { fusedLevel = '充盈'; fusedColor = 'green'; }
    else if (fusedAvg >= 60) { fusedLevel = '良好'; fusedColor = 'blue'; }
    else if (fusedAvg >= 45) { fusedLevel = '一般'; fusedColor = 'yellow'; }
    else if (fusedAvg >= 35) { fusedLevel = '偏低'; fusedColor = 'orange'; }
    else { fusedLevel = '亏空'; fusedColor = 'red'; }
    $('#fusionFinal').textContent = fusedLevel;
    $('#fusionFinal').className = 'fusion__value fusion__value--' + fusedColor;
    $('#fusionFinalHint').textContent = `均 ${fusedAvg} · ${fusedStrong} 旺 / ${fusedWeak} 弱`;
  }

  function renderSession() {
    const m = state.mode;
    const s = SESSIONS[m];
    const energies = state.energies;
    const def = state.deficiency;
    const day = state.dayInfo.dayMaster;
    const quiz = state.quizSnapshot;
    const strength = state.strength || {};
    const isEvening = m === 'evening';

    // 标题
    $('#sessionTitle').textContent = s.title;
    $('#sessionSub').textContent = s.sub;

    // 引导文
    const poem = s.poems[(day.stem.charCodeAt(0) + new Date().getDate()) % s.poems.length];
    const lead = s.leads[(new Date().getDate()) % s.leads.length];

    // 动态宜 / 忌：基于 tag + 八字旺弱
    const want = def.slice().reverse(); // 最弱在前
    const avoid = ELEMENTS.slice().sort((a, b) => energies[b] - energies[a])[0]; // 最旺者避
    const affordHtml = s.rituals.map(r => `
      <li class="afford__item ${r.k === '呼吸' || r.k === '一句结语' ? 'afford__item--wide' : ''}">
        <span class="afford__k">${r.k}</span>
        <span class="afford__v">${r.v}</span>
      </li>
    `).join('');

    // 当下激活 tag 的提醒
    let tagHint = '';
    if (quiz && quiz.dominantTag) {
      const advice = lookupAdvice(quiz.dominantTag, strength[quiz.dominantTag] || 0, m);
      if (advice) {
        tagHint = `<p class="session__tag">${isEvening ? '睡前' : '今日'} <b>${quiz.dominantTag}</b> 气被激活，八字该行<b>${advice.strengthKey === '旺' ? '偏旺（老毛病）' : advice.strengthKey === '弱' ? '偏弱（新伤）' : '平和'}</b>，宜<b>${advice.dir}</b>：${advice.tips.slice(0, 2).join('、')}。</p>`;
      }
    }

    const body = $('#sessionBody');
    body.innerHTML = `
      <div class="session__lead">
        <p class="poem">${poem}</p>
        <p>${lead}你今日的日主为 <b>${day.stem}（${day.elem}）</b>，
        偏弱元素为 <b>${want.join('、')}</b>，建议在${m === 'morning' ? '早间 7-9 点' : '睡前 21-23 点'}顺势补给。</p>
        ${tagHint}
        <p>${m === 'morning' ? '避免' : '睡前少做'}高强度的 <b>${avoid}</b> 属活动（如
        ${avoid === '木' ? '高强度运动' : avoid === '火' ? '辛辣刺激' : avoid === '土' ? '暴饮暴食' : avoid === '金' ? '大声争吵' : '熬夜刷屏'}）。</p>
      </div>
      <ul class="afford">${affordHtml}</ul>
    `;
  }

  function renderRemedy() {
    const def = state.deficiency;
    const strength = state.strength || {};
    const quiz = state.quizSnapshot;
    const m = state.mode;
    const isEvening = m === 'evening';
    // 主建议：优先选"当下激活 tag + 最弱项"的并集（去重）
    const focusEls = [];
    if (quiz && quiz.dominantTag) focusEls.push(quiz.dominantTag);
    def.forEach(el => { if (!focusEls.includes(el)) focusEls.push(el); });
    const cards = focusEls.slice(0, 2).map(el => {
      const r = REMEDIES[el];
      const advice = lookupAdvice(el, strength[el] || 0, m);
      const dirLabel = advice ? `${advice.dir} ${el} · ${advice.desc}` : `补 ${el} · ${ELEMENT_META[el].trait}`;
      const tipsHtml = advice ? `<div class="remedy__tips">${advice.tips.map(t => `<span class="tag tag--${advice.dir}">${escapeHtml(t)}</span>`).join('')}</div>` : '';
      // evening 场景：把"食"替换为"饮"（取茶饮类），并精简标签
      const foodLabel = isEvening ? '饮' : '食';
      const foodVal = isEvening ? (r.饮 ? r.饮[0] : r.食[r.食.length - 1]) : r.食[0];
      const moveVal = isEvening ? (r.眠 ? r.眠 : r.动[0]) : r.动[0];
      return `
        <article class="remedy__card" data-el="${el}" data-dir="${advice ? advice.dir : '补'}">
          <header class="remedy__head">
            <span class="remedy__dot"></span>
            <span>${escapeHtml(dirLabel)}</span>
          </header>
          <div class="remedy__body">
            <div>${ELEMENT_META[el].organ} · 主${ELEMENT_META[el].trait} · 八字${strength[el] >= 1 ? '偏旺' : strength[el] <= -1 ? '偏弱' : '平和'}</div>
          </div>
          ${tipsHtml}
          <div class="remedy__tags">
            <span class="tag">${foodLabel}：${foodVal}</span>
            <span class="tag">动：${moveVal}</span>
            ${isEvening ? '' : `<span class="tag">色：${r.色}</span>`}
            ${isEvening ? '' : `<span class="tag">方：${r.方}</span>`}
            ${isEvening ? '' : `<span class="tag">音：${r.音}</span>`}
            <span class="tag">眠：${r.眠}</span>
          </div>
        </article>
      `;
    }).join('');

    $('#remedyBody').innerHTML = `<div class="remedy__grid">${cards}</div>`;
    // 副标题：体现 tag + 旺弱
    const mainTag = quiz && quiz.dominantTag ? quiz.dominantTag : def[0];
    const mainAdvice = mainTag ? lookupAdvice(mainTag, strength[mainTag] || 0, m) : null;
    $('#remedySub').textContent = mainAdvice
      ? `${isEvening ? '睡前' : '今日'}重点：${mainTag}（${mainAdvice.strengthKey === '旺' ? '老毛病亢盛' : mainAdvice.strengthKey === '弱' ? '新伤耗损' : '需调和'}）· 宜${mainAdvice.dir}`
      : `${isEvening ? '睡前' : '今日'}最需关注：${def.join(' · ')}`;
  }

  function pickVerse() {
    const idx = (new Date().getDate() + (state.profile ? state.profile.year : 0)) % VERSES.length;
    state.verse = VERSES[idx];
    $('#verseText').textContent = state.verse;
  }
  function setVerse(text) { state.verse = text; $('#verseText').textContent = text; }

  // ---------- 主流程 ----------
  function showView(name) {
    const onb = $('#viewOnboard');
    const db = $('#viewDashboard');
    if (name === 'onboard') {
      onb.hidden = false; db.hidden = true;
    } else {
      onb.hidden = true; db.hidden = false;
    }
  }

  // onboard 内部四步切换：intro / quiz / snapshot / bazi
  function showOnboardStep(step) {
    const intro = $('#onboardIntro');
    const quiz = $('#onboardQuiz');
    const snap = $('#onboardSnapshot');
    const bazi = $('#onboardBazi');
    intro.hidden = step !== 'intro';
    quiz.hidden = step !== 'quiz';
    snap.hidden = step !== 'snapshot';
    bazi.hidden = step !== 'bazi';
  }

  // 开始问卷流程（用户点击"开始 10 题自测"）
  function startQuizFlow() {
    state.mode = isMorningNow() ? 'morning' : 'evening';
    state.quiz.questions = pickQuizQuestions(state.mode);
    state.quiz.idx = 0;
    state.quiz.answers = [];
    state.quiz.done = false;
    showOnboardStep('quiz');
    renderQuestion();
  }

  // 渲染当前题目
  const DIM_LABEL = { emotion:'情绪', body:'身体', mind:'精神', social:'社交', sleep:'睡眠' };
  function renderQuestion() {
    const idx = state.quiz.idx;
    const q = state.quiz.questions[idx];
    if (!q) return;
    const total = state.quiz.questions.length;
    // 进度
    $('#quizCount').textContent = (idx + 1) + ' / ' + total;
    $('#quizFill').style.width = ((idx + 1) / total * 100) + '%';
    $('#quizDim').textContent = DIM_LABEL[q.dim] || q.dim;
    $('#quizText').textContent = q.text;
    $('#quizBack').hidden = idx === 0;
    // 选项
    const optsBox = $('#quizOpts');
    optsBox.innerHTML = '';
    q.opts.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'quiz__opt';
      btn.dataset.idx = i;
      btn.innerHTML = `<span class="quiz__opt-key">${'ABCD'[i]}</span><span class="quiz__opt-text">${escapeHtml(opt.t)}</span>`;
      btn.addEventListener('click', () => answerQuestion(opt));
      optsBox.appendChild(btn);
    });
  }

  // 选中某个选项
  function answerQuestion(opt) {
    const idx = state.quiz.idx;
    const q = state.quiz.questions[idx];
    // 高亮选中
    $$('#quizOpts .quiz__opt').forEach((b, i) => {
      b.classList.toggle('quiz__opt--selected', i === q.opts.indexOf(opt));
      b.disabled = true;
    });
    // 记录答案（覆盖该位置原答案）
    state.quiz.answers[idx] = { qid: q.id, dim: q.dim, el: q.el, value: opt.v };
    // 0.32s 后进入下一题或八字录入
    setTimeout(() => {
      if (state.quiz.idx < state.quiz.questions.length - 1) {
        state.quiz.idx++;
        renderQuestion();
      } else {
        finishQuiz();
      }
    }, 320);
  }

  // 问卷完成 → 显示当下能量快照（不依赖八字）
  function finishQuiz() {
    state.quiz.done = true;
    saveQuiz(state.mode, state.quiz.answers);
    state.quizSnapshot = calcQuizSnapshot(state.quiz.answers);
    renderSnapshot();
    showOnboardStep('snapshot');
  }

  // 渲染当下能量快照
  const LEVEL_DESC = {
    '充盈': '身心饱满，今天的你状态很好，保持节奏即可。',
    '良好': '状态不错，略有空间可以更好。',
    '一般': '中规中矩，建议关注下方失衡的五行做点小调整。',
    '偏低': '能量偏低，今天别安排太多硬任务，给自己留缓冲。',
    '亏空': '今日亏空明显，先照顾好自己，必要的事再处理。',
  };
  function renderSnapshot() {
    const snap = state.quizSnapshot;
    if (!snap) return;
    // 等级
    const lvlEl = $('#snapLevel');
    lvlEl.textContent = snap.level;
    lvlEl.className = 'snap__level snap__level--' + snap.levelColor;
    $('#snapDesc').textContent = LEVEL_DESC[snap.level] || '';

    // 五行激活情况
    const grid = $('#snapGrid');
    grid.innerHTML = '';
    ELEMENTS.forEach(el => {
      const score = snap.elScore[el] || 0;
      const max = 8; // 视觉最大刻度
      const pct = Math.max(0, Math.min(100, (score / max) * 50 + 50)); // 0分→50%
      const card = document.createElement('div');
      card.className = 'snap__card';
      card.innerHTML = `
        <div class="snap__card-head">
          <span class="snap__card-el">${el}</span>
          <span class="snap__card-score">${score > 0 ? '+' : ''}${score}</span>
        </div>
        <div class="snap__card-bar"><div class="snap__card-fill" style="width:${pct}%"></div></div>
        <div class="snap__card-trait">${ELEMENT_META[el].trait}</div>
      `;
      grid.appendChild(card);
    });

    // 主导失衡 tag
    const dom = $('#snapDominant');
    if (snap.dominantTag) {
      dom.hidden = false;
      $('#snapDominantTag').textContent = snap.dominantTag + '（' + ELEMENT_META[snap.dominantTag].trait + '）';
      $('#snapDominantHint').textContent = '今天这一宫最需要关注，输入八字后可见"补还是泄"';
    } else {
      dom.hidden = true;
    }
  }

  // 上一题
  function prevQuestion() {
    if (state.quiz.idx > 0) {
      state.quiz.idx--;
      renderQuestion();
    }
  }

  function startWithProfile(profile) {
    state.profile = profile;
    state.mode = isMorningNow() ? 'morning' : 'evening';
    document.body.dataset.mode = state.mode;
    $$('.seg').forEach(b => b.classList.toggle('seg--active', b.dataset.mode === state.mode));
    saveProfile(profile);
    // 当日该模式问卷已做 → 直接进仪表盘；否则回到问卷开始
    const savedAnswers = loadQuiz(state.mode);
    if (savedAnswers && savedAnswers.length) {
      state.quiz.answers = savedAnswers;
      state.quiz.done = true;
      state.quizSnapshot = calcQuizSnapshot(savedAnswers);
      recalc();
      showView('dashboard');
    } else {
      state.quiz = { questions: pickQuizQuestions(state.mode), idx: 0, answers: [], done: false };
      state.quizSnapshot = null;
      showView('onboard');
      showOnboardStep('quiz');
      renderQuestion();
    }
  }

  function recalc() {
    if (!state.profile) return;
    // 优先使用当日问卷答案
    let quizAnswers = state.quiz.done ? state.quiz.answers : loadQuiz(state.mode);
    if (!quizAnswers || !quizAnswers.length) quizAnswers = null;
    const result = calcEnergies(state.profile, new Date(), quizAnswers);
    state.energies = result.energies;
    state.dayInfo = { dayMaster: result.dayMaster, pillars: result.pillars };
    state.deficiency = pickDeficiencies(result.energies);
    state.energies_innate = result.innate;       // 先天底盘能量
    state.strength = result.strength;            // 八字五行强度权重（-2~+2）
    state.quizSnapshot = result.quiz;            // 问卷当下快照
    renderMeter(result.energies);
    renderFusionSummary();
    renderSession();
    renderRemedy();
    if (!state.verse) pickVerse();

    // 问候语
    $('#nicknameSpan').textContent = state.profile.nickname ? state.profile.nickname : '你好';
    $('#dateLine').textContent = dateLabel(new Date());
    $('#modeLine').textContent = state.mode === 'morning' ? '晨光宜醒神' : '月光宜安神';
  }

  function isMorningNow() { return isMorning(new Date()); }

  function setMode(mode, recalcFlag) {
    state.mode = mode;
    document.body.dataset.mode = mode;
    $$('.seg').forEach(b => b.classList.toggle('seg--active', b.dataset.mode === mode));

    // 数据隔离：切换到新模式时，若该模式当日问卷未做，回到问卷开始页（保留 profile）
    if (state.profile && recalcFlag !== false) {
      const savedAnswers = loadQuiz(mode);
      if (!savedAnswers || !savedAnswers.length) {
        // 该模式未做问卷 → 重置 quiz 状态，回到 onboard 问卷开始
        state.quiz = { questions: pickQuizQuestions(mode), idx: 0, answers: [], done: false };
        state.quizSnapshot = null;
        showView('onboard');
        showOnboardStep('quiz');
        renderQuestion();
        return;
      } else {
        // 该模式已做问卷 → 加载并重算
        state.quiz.answers = savedAnswers;
        state.quiz.done = true;
        state.quizSnapshot = calcQuizSnapshot(savedAnswers);
        recalc();
        showView('dashboard');
        return;
      }
    }
    if (recalcFlag !== false) renderSession();
  }

  // ---------- 聊天：轻量 AI 助手 ----------
  const CHAT_GREET = [
    '你好，我是你的能量助手。',
    '想了解今日适合吃什么、做什么、或怎么补哪一种五行，都可以问我。',
  ];

  function chatPush(text, who, suggestions) {
    const body = $('#chatBody');
    const el = document.createElement('div');
    el.className = 'msg ' + (who === 'user' ? 'msg--user' : 'msg--bot');
    el.innerHTML = `<div>${escapeHtml(text)}</div>` +
      (suggestions && suggestions.length
        ? `<div class="msg__suggest">${suggestions.map(s => `<button type="button" data-q="${escapeAttr(s)}">${escapeHtml(s)}</button>`).join('')}</div>`
        : '');
    body.appendChild(el);
    body.scrollTop = body.scrollHeight;
    el.querySelectorAll('[data-q]').forEach(b => {
      b.addEventListener('click', () => {
        const q = b.dataset.q;
        handleUserInput(q);
      });
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  }
  function escapeAttr(s) { return escapeHtml(s); }

  function handleUserInput(text) {
    if (!text) return;
    chatPush(text, 'user');
    setTimeout(() => {
      const reply = aiReply(text);
      chatPush(reply.text, 'bot', reply.suggest);
    }, 420);
  }

  function aiReply(text) {
    const t = text.trim();
    const def = state.deficiency || [];
    const en = state.energies || {};
    const low = def[0];
    const high = ELEMENTS.slice().sort((a, b) => (en[b] || 0) - (en[a] || 0))[0];

    // 未录入八字时的兜底
    if (!state.profile || !low || !en[low]) {
      return {
        text: '请先在主界面输入生辰八字，我再为你做五行补给建议。也可以问我一些通用问题，比如"晨间怎么调息"。',
        suggest: ['晨间怎么调息', '睡前怎么收光', '五行是什么'],
      };
    }

    // 关键词
    if (/吃|食|餐|茶|喝|饮/.test(t)) {
      const r = REMEDIES[low];
      return {
        text: `今日${low}偏弱，建议多吃：${r.食.slice(0, 2).join('、')}；少碰 ${high} 属的过旺刺激。`,
        suggest: ['还能喝什么？', '有没有简单食谱？'],
      };
    }
    if (/动|运动|练|瑜伽|跑步|走/.test(t)) {
      const r = REMEDIES[low];
      return {
        text: `今日${state.mode === 'morning' ? '晨间' : '睡前'}适合：${r.动[0]}。${state.mode === 'morning' ? '不宜剧烈出汗' : '不宜高强度运动'}。`,
        suggest: ['多久合适？', '能不能在办公室做？'],
      };
    }
    if (/睡|眠|失眠|累|疲惫|累垮/.test(t)) {
      const r = REMEDIES[low];
      return {
        text: `${low}虚易倦。${r.眠}。${state.mode === 'evening' ? '现在正是回收的好时机。' : '今晚记得提前收光。'}`,
        suggest: ['推荐睡前仪式', '我总是睡不着'],
      };
    }
    if (/五行|缺|补|能量|状态/.test(t)) {
      const line = ELEMENTS.map(e => `${e} ${en[e] || '--'}`).join(' · ');
      return {
        text: `今日五行能量：${line}。你目前最弱的是 ${def.join('、')}，建议先从这里补给。`,
        suggest: ['怎么补？', '适合穿什么颜色？'],
      };
    }
    if (/颜色|穿|色/.test(t)) {
      const r = REMEDIES[low];
      return { text: `今日宜 ${r.色}，避开 ${REMEDIES[high].色} 过多。`, suggest: ['配饰怎么搭？'] };
    }
    if (/方向|方位|去哪/.test(t)) {
      const r = REMEDIES[low];
      return { text: `今日顺 ${r.方} 走，避开 ${REMEDIES[high].方} 的硬冲。`, suggest: ['还能做点什么？'] };
    }
    if (/晨间|早起|清晨|醒神/.test(t)) {
      return {
        text: '晨间宜做 4-7-8 呼吸 4 轮（吸 4 秒 / 屏 7 秒 / 呼 8 秒），随后颈部 + 侧腰轻伸展 3 分钟，配 200ml 温白开。',
        suggest: ['今日适合吃什么', '五行能量怎么样'],
      };
    }
    if (/睡前|收光|入眠/.test(t)) {
      return {
        text: '睡前 30 分钟调暗灯光、远离蓝光屏；温水泡脚 15 分钟；腹式呼吸 6 轮；最后对自己说一句"今天辛苦了"。',
        suggest: ['今日适合吃什么', '五行能量怎么样'],
      };
    }
    if (/五行是什么|什么是五行/.test(t)) {
      return {
        text: '五行是木、火、土、金、水五种基本能量态。木主生发、火主温煦、土主承载、金主收敛、水主润下，对应人体五脏与四季流转。',
        suggest: ['今日我五行怎么样', '怎么补？'],
      };
    }
    if (/你叫什么|名字|谁|hi|hello|你好|嗨/.test(t)) {
      return { text: '我是朝夕能量助手，专注五行调养与日常补给。', suggest: ['我今天很累', '今日适合吃什么？'] };
    }

    // 默认回复
    return {
      text: `${t.length > 4 ? '收到你的问题。' : ''}可以试试问我："今日适合吃什么"、"今天很累怎么办"、"五行能量怎么样"等。`,
      suggest: ['今日适合吃什么', '我今天很累', '五行能量怎么样'],
    };
  }

  // ---------- Toast ----------
  let toastTimer = null;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 1800);
  }

  // ---------- 事件绑定 ----------
  function bind() {
    // 开始问卷
    $('#startQuiz').addEventListener('click', startQuizFlow);
    // 问卷上一题
    $('#quizBack').addEventListener('click', prevQuestion);
    // 快照页：进入八字录入
    $('#goBazi').addEventListener('click', () => showOnboardStep('bazi'));
    // 快照页：重新回答
    $('#snapRetake').addEventListener('click', () => {
      state.quiz.idx = 0;
      state.quiz.answers = [];
      state.quiz.done = false;
      showOnboardStep('quiz');
      renderQuestion();
    });
    // 八字录入页"返回快照"
    $('#baziBack').addEventListener('click', () => {
      showOnboardStep('snapshot');
    });

    // 八字表单提交
    $('#baziForm').addEventListener('submit', e => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const profile = {
        year: parseInt(fd.get('year'), 10),
        month: parseInt(fd.get('month'), 10),
        day: parseInt(fd.get('day'), 10),
        hour: parseInt(fd.get('hour'), 10),
        calendar: fd.get('calendar') === 'lunar' ? 'lunar' : 'solar',
        nickname: (fd.get('nickname') || '').toString().trim(),
        city: (fd.get('city') || '').toString().trim(),
      };
      if (!profile.year || !profile.month || !profile.day || isNaN(profile.hour)) {
        toast('请填写完整的年、月、日、时');
        return;
      }
      startWithProfile(profile);
      toast('校准完成 · 今日能量已就绪');
    });

    // 重新测算（回到 onboard 第一步：欢迎页）
    $('#editBazi').addEventListener('click', () => {
      showView('onboard');
      showOnboardStep('intro');
      const f = $('#baziForm');
      f.year.value = state.profile?.year || '';
      f.month.value = state.profile?.month || '';
      f.day.value = state.profile?.day || '';
      f.hour.value = state.profile?.hour ?? '';
      if (state.profile?.calendar === 'lunar') {
        f.querySelector('input[name="calendar"][value="lunar"]').checked = true;
      } else {
        f.querySelector('input[name="calendar"][value="solar"]').checked = true;
      }
      f.nickname.value = state.profile?.nickname || '';
      f.city.value = state.profile?.city || '';
    });

    // 朝 / 夕 切换
    $$('.seg').forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));

    // 复制卡语
    $('#copyVerse').addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(state.verse);
        toast('已复制到剪贴板');
      } catch (e) {
        toast('复制失败，请手动选择');
      }
    });
    // 换一句
    $('#regenVerse').addEventListener('click', () => {
      let next = state.verse;
      for (let i = 0; i < 4 && next === state.verse; i++) {
        next = VERSES[Math.floor(Math.random() * VERSES.length)];
      }
      setVerse(next);
    });

    // 聊天
    $('#openChat').addEventListener('click', openChat);
    $('#closeChat').addEventListener('click', closeChat);
    $('#chatForm').addEventListener('submit', e => {
      e.preventDefault();
      const input = $('#chatText');
      const v = input.value.trim();
      if (!v) return;
      input.value = '';
      handleUserInput(v);
    });

    // ESC 键关闭聊天
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !$('#chatDrawer').hidden) {
        closeChat();
      }
    });

    // 点击背景层关闭聊天
    $('#chatBackdrop').addEventListener('click', () => closeChat());
  }

  function openChat() {
    const dr = $('#chatDrawer');
    const bd = $('#chatBackdrop');
    dr.hidden = false;
    if (bd) bd.hidden = false;
    if (!$('#chatBody').children.length) {
      CHAT_GREET.forEach((t, i) => setTimeout(() => chatPush(t, 'bot', i === CHAT_GREET.length - 1 ? ['今日适合吃什么', '五行能量怎么样', '我今天很累'] : null), i * 380));
    }
  }
  function closeChat() {
    const dr = $('#chatDrawer');
    const bd = $('#chatBackdrop');
    dr.hidden = true;
    if (bd) bd.hidden = true;
  }

  // ---------- 启动 ----------
  function boot() {
    bind();
    const saved = loadProfile();
    if (saved && saved.profile) {
      startWithProfile(saved.profile);
    } else {
      showView('onboard');
      showOnboardStep('intro');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
