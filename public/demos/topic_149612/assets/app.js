(() => {
  'use strict';

  /** =========================
   *  小息指南 · 规则推荐 Demo
   *  - 仅本地运行：不上传输入
   *  - 推荐逻辑：关键词 + 场景 + 时长 → 匹配预设方案
   *  ========================= */

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const els = {
    demandInput: $('#demandInput'),
    btnGenerate: $('#btnGenerate'),
    btnExample: $('#btnExample'),
    btnReset: $('#btnReset'),

    minutesNumber: $('#minutesNumber'),
    minutesRange: $('#minutesRange'),

    riskBox: $('#riskBox'),

    planBox: $('#planBox'),
    planTitle: $('#planTitle'),
    planSubtitle: $('#planSubtitle'),
    planMeta: $('#planMeta'),
    steps: $('#steps'),

    timerBox: $('#timerBox'),
    timerLabel: $('#timerLabel'),
    timerBig: $('#timerBig'),
    progressBar: $('#progressBar'),
    btnStart: $('#btnStart'),
    btnPause: $('#btnPause'),
    btnNext: $('#btnNext'),
    btnStop: $('#btnStop'),

    feedbackBox: $('#feedbackBox'),
    fbCountdown: $('#fbCountdown'),
    fbSaved: $('#fbSaved'),

    iconModal: $('#iconModal'),
    iconModalTitle: $('#iconModalTitle'),
    iconModalSvg: $('#iconModalSvg'),
    iconModalTips: $('#iconModalTips'),

    actionFilters: $('#actionFilters'),
    musicFilters: $('#musicFilters'),
    textFilters: $('#textFilters'),
    actionCard: $('#actionCard'),
    musicCard: $('#musicCard'),
    textCard: $('#textCard'),
  };

  /** ---------- 状态 ---------- */
  const state = {
    pickedScene: 'any',
    pickedMinutes: 5,
    minutesLocked: false, // 用户手动改过时长后，优先用手动值；编辑输入框会自动解锁
    posture: 'sit', // sit | stand | lie
    place: 'indoor', // indoor | outdoor | any
    postureLocked: false,
    placeLocked: false,
    relaxMode: { action: 'auto', music: 'auto', text: 'auto' },
    relaxFilter: { action: 'auto', music: 'auto', text: 'auto' },
    relaxChoiceIndex: { action: 0, music: 0, text: 0 },
    lastParsed: null,
    currentPlan: null,

    // 计时器
    running: false,
    paused: false,
    stepIndex: 0,
    stepRemainSec: 0,
    totalRemainSec: 0,
    ticker: null,
    totalPlannedSec: 0,

    // 反馈
    fbTimer: null,
    fbRemain: 0,
  };

  /** ---------- 方案库（首版 6 类） ---------- */
  const CATEGORIES = [
    { id: 'eye', name: '眼疲劳', emoji: '👁' },
    { id: 'neck', name: '肩颈僵硬', emoji: '🧍' },
    { id: 'focus', name: '注意力涣散', emoji: '🎯' },
    { id: 'nervous', name: '会前考前紧张', emoji: '🫧' },
    { id: 'mood', name: '心烦低落', emoji: '🌿' },
    { id: 'sleep', name: '睡前放松', emoji: '🌙' },
    { id: 'reset', name: '通用重启', emoji: '🔄' },
  ];

  /** ---------- 第四块：放松小技巧 ---------- */
  const RELAX_FILTERS = {
    action: [
      { id: 'auto', label: '看看推荐' },
      { id: 'stretch', label: '舒缓拉伸' },
      { id: 'breath', label: '呼吸放松' },
      { id: 'baduanjin', label: '八段锦节选' },
      { id: 'lightmove', label: '轻运动' },
    ],
    music: [
      { id: 'auto', label: '看看推荐' },
      { id: 'whitenoise', label: '白噪音' },
      { id: 'nature', label: '自然声' },
      { id: 'piano', label: '轻音乐' },
      { id: 'steady', label: '稳定节律' },
    ],
    text: [
      { id: 'auto', label: '看看推荐' },
      { id: 'joke', label: '轻松一下' },
      { id: 'warm', label: '温柔短句' },
      { id: 'reset', label: '清醒一下' },
    ],
  };

  const RELAX_MAP = {
    eye: { action: 'stretch', music: 'nature', text: 'joke' },
    neck: { action: 'stretch', music: 'steady', text: 'reset' },
    focus: { action: 'lightmove', music: 'whitenoise', text: 'reset' },
    nervous: { action: 'breath', music: 'steady', text: 'warm' },
    mood: { action: 'breath', music: 'piano', text: 'warm' },
    sleep: { action: 'baduanjin', music: 'nature', text: 'warm' },
    reset: { action: 'stretch', music: 'whitenoise', text: 'joke' },
  };

  const RELAX_LIBRARY = {
    action: {
      stretch: [
        { title: '肩颈轻松版', badge: '舒缓拉伸', desc: '坐姿耸肩-放下 6 次，再做 1 轮侧颈拉伸。', meta: '约 1-2 分钟', bullets: ['肩不要耸着拉脖子', '只拉到“舒服紧”'] },
        { title: '坐姿开胸', badge: '舒缓拉伸', desc: '双手轻放胸前，肘往两侧打开 6 次，像把胸口腾出一点空间。', meta: '适合久坐后胸闷、含胸', bullets: ['肩保持下沉', '动作小一点更自然'] },
        { title: '眼肩一起松', badge: '舒缓拉伸', desc: '先看远 30 秒，再把肩轻轻放下，做 3 次长呼气。', meta: '适合看屏后发紧', bullets: ['先离屏', '不要边看手机边放松'] },
      ],
      breath: [
        { title: '4-6 呼吸', badge: '呼吸放松', desc: '吸气 4 拍，呼气 6 拍，先做 6 轮。', meta: '适合紧张、心烦、脑子转太快', bullets: ['呼气比吸气长', '不追求很深，只求平稳'] },
        { title: '手放心口和腹部', badge: '呼吸放松', desc: '一手放胸口，一手放腹部，呼气时只提醒自己“慢一点”。', meta: '适合情绪上头时先缓一下', bullets: ['肩放松', '不要憋气'] },
        { title: '闭眼 3 次长呼气', badge: '呼吸放松', desc: '不用数拍子，只做 3 次刻意放长的呼气。', meta: '适合只有几十秒空档时', bullets: ['呼气慢慢吐完', '做完再决定下一步'] },
      ],
      baduanjin: [
        { title: '八段锦节选：左右开弓感', badge: '八段锦节选', desc: '坐姿或站姿都可，双臂向两侧轻轻打开，再回到胸前。', meta: '简化版，不求标准套路', bullets: ['重在打开肩胸，不在用力', '做 6 次即可'] },
        { title: '八段锦节选：托举伸展感', badge: '八段锦节选', desc: '双手向上轻轻托举，再缓缓放下，配合慢呼气。', meta: '适合久坐后想“拉长身体”', bullets: ['肩不要顶住耳朵', '动作慢一些'] },
        { title: '八段锦节选：回头松颈感', badge: '八段锦节选', desc: '头轻轻转向一侧，再回中；换边重复。', meta: '适合肩颈发僵时做简化版', bullets: ['只转到舒服范围', '别猛转'] },
      ],
      lightmove: [
        { title: '慢走一分钟', badge: '轻运动', desc: '站起来慢走一小圈，不看手机，只数脚步。', meta: '适合脑子糊、卡住、坐太久', bullets: ['走得慢一点', '注意力放脚底'] },
        { title: '原地醒脑版', badge: '轻运动', desc: '脚掌踩地，脚趾用力 2 秒再放松，重复 8 次。', meta: '不方便走动时可替代', bullets: ['坐着也能做', '不要用力过猛'] },
        { title: '手脚轻活动', badge: '轻运动', desc: '转转脚踝、活动手指，再做 2 次长呼气。', meta: '适合状态低、想“启动一下”', bullets: ['小动作就够', '不要追求完整热身'] },
      ],
    },
    music: {
      whitenoise: [
        { title: '空调白噪音', badge: '白噪音', desc: '适合屏蔽零碎环境声，让脑子别再处理太多信息。', meta: '推荐时长：5-15 分钟', bullets: ['适合注意力涣散', '不用很大声'] },
        { title: '棕噪音', badge: '白噪音', desc: '比白噪音更厚一点，包裹感更强。', meta: '适合烦躁、想降刺激', bullets: ['适合戴耳机低音量', '不建议一直循环太久'] },
        { title: '键盘雨点声', badge: '白噪音', desc: '介于环境声和节律声之间，存在感低，不抢注意力。', meta: '适合工作间隙或轻恢复', bullets: ['适合办公室', '不必盯着选太久'] },
      ],
      nature: [
        { title: '雨声', badge: '自然声', desc: '比较稳，容易让节奏慢下来。', meta: '适合睡前、心烦、想降速', bullets: ['适合搭配长呼气', '小音量更自然'] },
        { title: '溪流声', badge: '自然声', desc: '比雨声更亮一点，适合想缓但不想太困。', meta: '适合眼疲劳或午后发紧', bullets: ['适合 5-10 分钟短放松', '配合看远更舒服'] },
        { title: '森林环境声', badge: '自然声', desc: '存在感轻，不容易听腻。', meta: '适合想从工位“抽离一下”', bullets: ['适合自然派用户', '不要来回换很多首'] },
      ],
      piano: [
        { title: '轻钢琴', badge: '轻音乐', desc: '旋律简单一点的纯音乐，不容易抢情绪。', meta: '适合低落、心烦、想被轻轻安抚', bullets: ['别选情绪太重的曲子', '保持低音量'] },
        { title: 'Lo-fi 慢节奏', badge: '轻音乐', desc: '比纯白噪音多一点陪伴感。', meta: '适合想缓和但不想太安静', bullets: ['适合学习/工作间隙', '避免节奏太明显'] },
        { title: '氛围系轻音乐', badge: '轻音乐', desc: '没有歌词，更容易把注意力放回身体。', meta: '适合心烦或睡前降刺激', bullets: ['不建议一边刷短视频一边听'] },
      ],
      steady: [
        { title: '稳定鼓点 / 轻节律', badge: '稳定节律', desc: '节奏感清楚，但不过度兴奋。', meta: '适合紧张、会前、考前稳住自己', bullets: ['让呼吸跟着慢一点', '不要选太燃的'] },
        { title: '均匀环境节拍', badge: '稳定节律', desc: '适合帮助身体找回“规律感”。', meta: '适合慌、乱、注意力掉线', bullets: ['不求沉浸，只求稳'] },
        { title: '规律感背景音', badge: '稳定节律', desc: '比纯音乐更像“节奏扶手”。', meta: '适合工作前重启状态', bullets: ['先听 3-5 分钟就够'] },
      ],
    },
    text: {
      joke: [
        { title: '轻松一下', badge: '冷笑话型', desc: '你不是效率低，你只是大脑在申请一个“重新连接中”的转圈圈。', meta: '适合别太严肃地对待当下卡顿', bullets: ['先笑一下', '再决定下一步'] },
        { title: '轻松一下', badge: '冷笑话型', desc: '你的肩膀不是衣架，不用一直挂着今天所有任务。', meta: '适合肩颈紧的时候', bullets: ['把肩先放下', '别连情绪也一起耸着'] },
        { title: '轻松一下', badge: '冷笑话型', desc: '休息 5 分钟不叫偷懒，叫给系统打一个不情不愿但必要的补丁。', meta: '适合容易内疚的人', bullets: ['补丁打完再继续', '别一边补一边刷屏'] },
      ],
      warm: [
        { title: '温柔短句', badge: '陪伴型', desc: '你现在不用立刻变好，先让身体松一点就已经很好。', meta: '适合低落、心烦、想被温柔对待一下', bullets: ['先缓一下', '不用马上证明自己'] },
        { title: '温柔短句', badge: '陪伴型', desc: '今天很吵也没关系，先把注意力放回呼气这一件小事。', meta: '适合焦虑或外界太满的时候', bullets: ['只做这一件也算完成'] },
        { title: '温柔短句', badge: '陪伴型', desc: '你不是在掉队，你只是需要一小段安静把自己捡回来。', meta: '适合压力大、内耗时', bullets: ['慢一点不等于退后'] },
      ],
      reset: [
        { title: '清醒一下', badge: '重启型', desc: '别想着把今天一次性救回来，先救下一个 2 分钟。', meta: '适合拖延、脑子糊、状态散', bullets: ['下一步越小越容易开始'] },
        { title: '清醒一下', badge: '重启型', desc: '注意力不是消失了，只是被你派去别处打工了，现在把它叫回来。', meta: '适合分心、走神', bullets: ['先停，再拉回'] },
        { title: '清醒一下', badge: '重启型', desc: '你现在最需要的，不是燃起来，是先稳定下来。', meta: '适合会前、考前、情绪上头时', bullets: ['稳住比打鸡血更有用'] },
      ],
    },
  };

  // 关键词命中：越前面越强
  const KEYWORDS = {
    eye: [
      '眼睛好痛', '眼睛痛', '眼睛疼', '眼痛', '眼疼',
      '看电脑', '电脑看久', '电脑看太久', '屏幕看久',
      '眼睛酸', '眼酸', '眼疲劳', '眼干', '眼涩', '看屏幕', '用眼', '视疲劳', '流泪', '眼眶', '头疼',
      'eye strain', 'dry eyes', 'sore eyes', 'tired eyes'
    ],
    neck: [
      '肩颈', '肩颈痛', '肩颈酸', '脖子', '脖子痛', '脖子酸', '颈椎', '落枕', '肩膀', '肩膀酸', '肩膀痛',
      '颈', '肩', '僵', '酸痛', '坐太久', '后背', '腰', '手腕', '鼠标手',
      'neck', 'shoulder', 'stiff', 'stiff neck', 'neck pain', 'shoulder pain', 'back pain'
    ],
    focus: [
      '注意力', '注意力不集中', '走神', '分心', '专注', '专注不了', '效率低', '脑子糊', '脑子乱', '发呆',
      '脑袋晕', '头晕', '晕乎乎', '昏昏沉沉',
      '刷题', '写不下去', '写不动', '看不进去', '拖延',
      'distracted', 'can’t focus', "can't focus", 'focus', 'brain fog', 'procrastination'
    ],
    nervous: [
      '紧张', '焦虑', '慌', '心慌', '心跳', '发抖', '临场', '上场', '开会', '汇报', '面试', '考试', '上台', '演讲',
      'nervous', 'anxious', 'meeting', 'presentation', 'interview', 'exam', 'test'
    ],
    mood: [
      '心烦', '烦', '烦躁', '低落', '难受', '压力', '压力大', '崩溃', '郁闷', '委屈', '想哭', '内耗', '生气', 'emo',
      'stressed', 'overwhelmed', 'down', 'sad', 'upset', 'irritated'
    ],
    sleep: [
      '睡前', '入睡', '入睡困难', '失眠', '放松', '安静下来', '越刷越清醒', '睡不着', '夜里', '躺下', '想睡',
      'sleep', 'bedtime', 'insomnia', 'can’t sleep', "can't sleep"
    ],
  };

  const SCENE_NAMES = {
    desk: '工位/办公室',
    library: '自习室/图书馆',
    meeting: '会前',
    exam: '考前',
    bed: '睡前',
    any: '通用',
  };

  const SCENE_HINTS = {
    desk: ['工位', '办公室', '公司', '上班', '座位', '电脑前', 'desk', 'office', 'work', 'workstation'],
    library: ['图书馆', '自习室', '教室', '安静', '同学', '复习', 'library', 'study room', 'classroom'],
    meeting: ['开会', '会议', '汇报', '上台', '面试', 'meeting', 'presentation', 'interview'],
    exam: ['考试', '考前', '进考场', '监考', '答题', 'exam', 'test'],
    bed: ['睡前', '躺下', '床', '入睡', '失眠', 'bed', 'bedtime', 'sleep'],
  };

  const CONSTRAINT_HINTS = {
    noStand: [
      '不能起身', '不方便起身', '不想起身', '起不了身', '走不开', '不方便走动', '不能站', '不方便站',
      'stay seated', 'cannot stand', "can't stand"
    ],
    noLie: [
      '不能躺', '不方便躺', '没地方躺', '不能躺下', '不方便躺下',
      'cannot lie', "can't lie", 'no place to lie'
    ],
    noSound: [
      '不能出声', '不方便出声', '不能说话', '不方便说话', '要安静', '需要安静', '不出声', '静音',
      'cannot talk', "can't talk", 'be quiet', 'silent'
    ],
  };

  const CONTEXT_HINTS = {
    posture: {
      sit: ['坐着', '坐下', '在座位', '工位', 'desk', 'seated', 'sit'],
      stand: ['站着', '站立', '站一会', 'stand', 'standing'],
      lie: ['躺着', '躺下', '在床', 'bed', 'lying', 'lie down'],
    },
    place: {
      indoor: ['室内', '室里', '屋里', 'in door', 'indoor', 'inside'],
      outdoor: ['室外', '户外', '外面', 'outside', 'outdoor'],
    },
  };

  function inferPostureFromText(text) {
    if (containsAny(text, CONTEXT_HINTS.posture.lie)) return 'lie';
    if (containsAny(text, CONTEXT_HINTS.posture.stand)) return 'stand';
    if (containsAny(text, CONTEXT_HINTS.posture.sit)) return 'sit';
    return null;
  }

  function inferPlaceFromText(text) {
    if (containsAny(text, CONTEXT_HINTS.place.outdoor)) return 'outdoor';
    if (containsAny(text, CONTEXT_HINTS.place.indoor)) return 'indoor';
    return null;
  }

  function constraintsFromContext(text, scene, posture, place) {
    // 内部推断：仍然转成“限制”，供模板分支使用，但 UI 不再让用户从“限制”出发
    const c = { noStand: false, noLie: false, noSound: false };

    // 姿势带来的限制
    if (posture === 'sit' || posture === 'lie') c.noStand = true;
    if (posture !== 'lie') c.noLie = true;

    // 场景默认（更可靠）
    if (scene === 'meeting' || scene === 'exam') c.noStand = true;
    if (scene === 'desk' || scene === 'library' || scene === 'meeting' || scene === 'exam') c.noLie = true;
    if (scene === 'library' || scene === 'meeting' || scene === 'exam') c.noSound = true;

    // 地点：室外通常不要求无声
    if (place === 'outdoor') c.noSound = false;

    // 文本显式限制仍然生效
    if (containsAny(text, CONSTRAINT_HINTS.noStand)) c.noStand = true;
    if (containsAny(text, CONSTRAINT_HINTS.noLie)) c.noLie = true;
    if (containsAny(text, CONSTRAINT_HINTS.noSound)) c.noSound = true;

    return c;
  }

  /** ---------- 方案库（6 类 × 3/5/7/10min 各 1 套 + 通用重启 2 套） ---------- */
  const v = (when, text) => ({ when, text });
  const step = (durationSec, variants) => ({ durationSec, variants });

  function pickVariant(variants, ctx) {
    for (const it of variants) {
      try {
        if (it.when(ctx)) return it.text;
      } catch {
        // ignore
      }
    }
    return variants[variants.length - 1]?.text || '';
  }

  function resolvePlanTemplate(tpl, ctx) {
    return {
      ...tpl,
      steps: tpl.steps.map((s) => ({
        durationSec: s.durationSec,
        text: pickVariant(s.variants, ctx),
      })),
    };
  }

  /** ---------- 动作示意（高频 + 复杂动作优先） ---------- */
  const ICONS = {
    sitPosture: {
      title: '坐稳/坐直（姿势重置）',
      img: './assets/u_sitposture.jpg',
      smallSvg:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4h8"/><path d="M12 4v8"/><path d="M8 20v-4a4 4 0 0 1 4-4 4 4 0 0 1 4 4v4"/><path d="M7 11h10"/></svg>',
      tips: ['脚掌踩实，背轻靠稳，肩放下。'],
    },
    pauseScreen: {
      title: '离屏/暂停一下',
      img: './assets/u_pausescreen.jpg',
      smallSvg:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="13" y="6" width="7" height="5" rx="1"/><path d="M11 8H4"/><path d="M9 6L7 8l2 2"/></svg>',
      tips: ['先离开屏幕/文字，把眼睛和手都停一下。'],
    },
    scapula: {
      title: '肩胛骨“向后下”放松',
      img: './assets/u_scapula.jpg',
      smallSvg:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5.5" r="2.2"/><path d="M12 8v5"/><path d="M8.2 12.2c1.2-1.2 2.4-1.7 3.8-1.7s2.6.5 3.8 1.7"/><path d="M7 19v-4c0-1.6 1.2-2.8 2.8-2.8h4.4c1.6 0 2.8 1.2 2.8 2.8v4"/><path d="M9 14l-1.5 1.5"/><path d="M15 14l1.5 1.5"/></svg>',
      tips: [
        '想象肩胛骨在背上“向后、向下滑”，不是耸肩。',
        '用力只到 20%：轻轻收一下 → 放开更重要。',
        '若脖子紧，先把下巴微收、肩放下再做。',
      ],
    },
    chinTuck: {
      title: '下巴回收（颈椎回中立）',
      img: './assets/u_chintuck.jpg',
      smallSvg:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="6" r="2.2"/><path d="M12 8.5v4.5"/><path d="M8 21v-5c0-1.8 1.4-3.2 3.2-3.2h1.6c1.8 0 3.2 1.4 3.2 3.2v5"/><path d="M14.8 7.2l2.2 0"/><path d="M14.8 7.2l1.4-1.4"/><path d="M14.8 7.2l1.4 1.4"/><path d="M9.4 7.2l-1.6 0"/></svg>',
      tips: [
        '像把后脑勺轻推向墙：头不前伸、下巴微收。',
        '不要低头；眼睛平视，脖子“变长”。',
      ],
    },
    shrug: {
      title: '耸肩-放下（肩放松）',
      img: './assets/u_shrug.jpg',
      smallSvg:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 20c0-5 2-8 5-8s5 3 5 8"/><path d="M8 9c1 2 2 3 4 3s3-1 4-3"/><path d="M9 5l-2 2"/><path d="M15 5l2 2"/><path d="M7 7v4"/><path d="M17 7v4"/></svg>',
      tips: [
        '吸气耸肩 → 呼气放下更慢更长。',
        '放下时想象肩膀“融化”到椅背里。',
      ],
    },
    neckStretch: {
      title: '侧颈拉伸（不抬肩）',
      img: './assets/u_neckstretch.jpg',
      smallSvg:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6c2-2 6-2 8 0"/><path d="M10 9c1.5 1.2 4.5 1.2 6 0"/><path d="M8 20c0-4 1.8-7 4-7s4 3 4 7"/><path d="M9 11c0 3-1 5-3 6"/><path d="M6 17l-2-1"/><path d="M6 17l-2 1"/></svg>',
      tips: [
        '头往一侧“靠近”，肩要保持下沉。',
        '只拉到“舒服紧”，不要拉到痛。',
      ],
    },
    breathing: {
      title: '呼吸节奏（吸 4 / 呼 6）',
      img: './assets/u_breathing.jpg',
      smallSvg:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14c2-6 4-6 6 0s4 6 6 0 4-6 4 0"/><path d="M12 4v3"/><path d="M12 17v3"/></svg>',
      tips: [
        '呼气比吸气更慢更长，身体会更快“慢下来”。',
        '不憋气，不追求深呼吸，追求平稳。',
      ],
    },
    lookFar: {
      title: '远眺/看远（放松对焦）',
      img: './assets/u_lookfar.jpg',
      smallSvg:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-5 10-5 10 5 10 5-3 5-10 5S2 12 2 12z"/><path d="M12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/><path d="M18 6l4-2"/><path d="M18 18l4 2"/></svg>',
      tips: [
        '找 6 米外一个固定点，不用“瞪”，轻轻眨眼。',
        '如果室内没远处，就看窗外/走廊尽头。',
      ],
    },
    eyeHeat: {
      title: '热敷眼眶（不压眼球）',
      img: './assets/u_eyeheat.jpg',
      smallSvg:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12s3-4 9-4 9 4 9 4-3 4-9 4-9-4-9-4z"/><path d="M12 10.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"/><path d="M7 19c2-1 8-1 10 0"/><path d="M8 17l-1 2"/><path d="M16 17l1 2"/></svg>',
      tips: [
        '手掌搓热后“盖在眼眶上”，不要压眼球。',
        '有隐形眼镜不舒服时，先眨眼润一下再闭眼。',
      ],
    },
    fistRelax: {
      title: '握拳-放松（释放紧张）',
      img: './assets/u_fistrelax_clean.jpg',
      smallSvg:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 13v-2a2 2 0 0 1 4 0v2"/><path d="M12 13v-2a2 2 0 0 1 4 0v3"/><path d="M8 13v1a5 5 0 0 0 10 0v-1"/><path d="M6 12c0-3 2-5 5-5"/></svg>',
      tips: [
        '用力 2 秒→放松 6 秒，放松时感受手指“变热/变轻”。',
        '如果手麻/痛，力度更小一点。',
      ],
    },
    walk: {
      title: '慢走/走动（不看手机）',
      img: './assets/u_walk.jpg',
      smallSvg:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M13 5a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"/><path d="M9 21l2-6 3-3"/><path d="M7 12l4-2 3 2 2 6"/><path d="M16 21l-2-5"/></svg>',
      tips: [
        '慢一点，注意力放在脚步/呼气上，别看手机。',
        '不方便走动时，可替换成“脚趾用力→放松”。',
      ],
    },
    chestOpen: {
      title: '胸打开/肩打开',
      img: './assets/u_chestopen.jpg',
      smallSvg:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M7 9l-3 3 3 3"/><path d="M17 9l3 3-3 3"/><path d="M9 12h6"/></svg>',
      tips: ['肩放下，胸口轻轻打开，不要顶腰。'],
    },
    grounding: {
      title: '身体扫描/落地稳定',
      img: './assets/u_grounding_clean.jpg',
      smallSvg:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v16"/><path d="M8 8h8"/><path d="M9 15h6"/><path d="M7 20h10"/></svg>',
      tips: ['把注意力放回身体：胸口、腹部、脚底触地感。'],
    },
    progressive: {
      title: '渐进放松',
      img: './assets/u_progressive.jpg',
      smallSvg:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14h16"/><path d="M6 12c2-2 4-2 6 0"/><path d="M12 12c2-2 4-2 6 0"/></svg>',
      tips: ['一段一段地紧一下、松一下，让身体降下来。'],
    },
    write: {
      title: '写一行（下一步最小动作）',
      img: './assets/u_write_clean.jpg',
      smallSvg:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16"/><path d="M6 16l10-10 2 2-10 10H6v-2z"/><path d="M14 6l2 2"/></svg>',
      tips: [
        '只写一句：“下一步我只做____”。越小越好。',
        '写完立刻做 1 个最小动作，避免又陷入拖延。',
      ],
    },
    default: {
      title: '动作示意',
      img: './assets/u_sitposture.jpg',
      smallSvg:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18"/><path d="M3 12h18"/></svg>',
      tips: ['点击其他带图标的步骤，可查看对应动作示意。'],
    },
  };

  function detectActionKey(text) {
    const t = String(text || '');
    if (t.includes('离屏') || t.includes('屏幕退出') || t.startsWith('停：') || t.includes('手机翻面')) return 'pauseScreen';
    if (t.includes('坐稳') || t.includes('坐直') || t.includes('背轻靠') || t.includes('重置坐姿') || t.includes('脚掌踩实') || t.includes('落地')) return 'sitPosture';
    if (t.includes('肩胛')) return 'scapula';
    if (t.includes('下巴回收') || t.includes('后脑勺')) return 'chinTuck';
    if (t.includes('耸肩')) return 'shrug';
    if (t.includes('胸打开') || t.includes('肩后展') || t.includes('开门') || t.includes('肘向两侧打开') || t.includes('向后扣椅背') || t.includes('后脑勺')) return 'chestOpen';
    if (t.includes('侧颈') || t.includes('右耳') || t.includes('左耳')) return 'neckStretch';
    if (t.includes('热敷')) return 'eyeHeat';
    if (t.includes('远眺') || t.includes('看远') || t.includes('眨眼') || t.includes('眼球')) return 'lookFar';
    if (t.includes('闭眼')) return 'grounding';
    if (t.includes('身体扫描') || t.includes('触感') || t.includes('5-4-3-2-1') || t.includes('感官锚定') || t.includes('命名')) return 'grounding';
    if (t.includes('呼吸') || (t.includes('吸') && t.includes('呼'))) return 'breathing';
    if (t.includes('握拳')) return 'fistRelax';
    if (t.includes('慢走') || t.includes('走')) return 'walk';
    if (t.includes('渐进放松') || t.includes('腹式呼吸')) return 'progressive';
    if (t.includes('写') || t.includes('便签')) return 'write';
    return 'default';
  }

  const ALL_SCENES = ['any', 'desk', 'library', 'meeting', 'exam', 'bed'];
  const NON_BED_SCENES = ['any', 'desk', 'library', 'meeting', 'exam'];

  const PLAN_LIBRARY = [
    // ===== 眼疲劳 =====
    {
      id: 'eye_3',
      category: 'eye',
      title: '眼睛急救 · 3 分钟',
      subtitle: '离屏、放松对焦、缓一下酸胀',
      scenes: ALL_SCENES,
      idealMin: 3,
      steps: [
        step(15, [v(() => true, '离屏：把视线从文字/屏幕移开。')]),
        step(75, [
          v((c) => !c.noStand && c.scene !== 'meeting' && c.scene !== 'exam', '若方便起身：走到窗边/门口，远眺 1 分钟，轻眨眼。'),
          v(() => true, '坐直：看远处一点，轻眨眼 1 分钟（肩自然下沉）。'),
        ]),
        step(60, [v(() => true, '闭眼 1 分钟：把呼气放慢（不憋气）。')]),
        step(30, [v(() => true, '收尾：回到任务前先做 1 个最小动作（比如保存/合上盖子）。')]),
      ],
    },
    {
      id: 'eye_5',
      category: 'eye',
      title: '眼睛回血 · 5 分钟',
      subtitle: '从“持续对焦”切回“柔和恢复”',
      scenes: ALL_SCENES,
      idealMin: 5,
      steps: [
        step(20, [v(() => true, '离屏：把手机翻面或放包里，屏幕先离你远一点。')]),
        step(80, [
          v((c) => !c.noStand && c.scene !== 'meeting' && c.scene !== 'exam', '若方便起身：去远眺 80 秒（看 6 米外固定点，轻眨眼）。'),
          v(() => true, '远眺：看 6 米外固定点 80 秒，轻眨眼（不憋气）。'),
        ]),
        step(70, [v(() => true, '热敷：双手搓热，掌心轻盖眼眶 70 秒（不压眼球）。')]),
        step(70, [v(() => true, '眼球轻转：顺时针 6 圈、逆时针 6 圈（慢、柔）。')]),
        step(60, [v(() => true, '收尾：做 3 次长呼气（比吸气更慢），肩放下。')]),
      ],
    },
    {
      id: 'eye_7',
      category: 'eye',
      title: '眼睛舒缓 · 7 分钟',
      subtitle: '补一点“远近切换”和“眨眼润滑”',
      scenes: ALL_SCENES,
      idealMin: 7,
      steps: [
        step(25, [v(() => true, '离屏：把屏幕内容停在可恢复的位置，手离开鼠标/键盘。')]),
        step(95, [
          v((c) => !c.noStand && c.scene !== 'meeting' && c.scene !== 'exam', '若方便起身：找远处自然光处远眺 95 秒，轻眨眼。'),
          v(() => true, '远眺：看远处一点 95 秒，轻眨眼（像给眼睛“滴润滑”）。'),
        ]),
        step(90, [v(() => true, '眨眼训练：每 5 秒慢眨一次（不挤眼），持续 90 秒。')]),
        step(90, [v(() => true, '热敷：搓热掌心，轻盖眼眶 90 秒。')]),
        step(70, [v(() => true, '眼球轻转：顺 8 圈、逆 8 圈；最后闭眼 10 秒。')]),
        step(50, [v(() => true, '收尾：喝一口水/润润喉，回到任务做 1 个最小动作。')]),
      ],
    },
    {
      id: 'eye_10',
      category: 'eye',
      title: '眼睛恢复 · 10 分钟',
      subtitle: '更完整的“离屏 + 远眺 + 放松 + 收尾重启”',
      scenes: ALL_SCENES,
      idealMin: 10,
      steps: [
        step(30, [v(() => true, '离屏：把屏幕停住，关闭无关通知（避免刷屏）。')]),
        step(120, [
          v((c) => !c.noStand && c.scene !== 'meeting' && c.scene !== 'exam', '若方便起身：慢走 1 分钟到窗边，再远眺 1 分钟。'),
          v(() => true, '不便起身：先看远 1 分钟，再闭眼 1 分钟（呼气更慢）。'),
        ]),
        step(120, [v(() => true, '热敷 + 轻按眉骨：掌心热敷 90 秒，眉骨外侧轻按 30 秒（轻柔）。')]),
        step(120, [v(() => true, '眼球活动：顺/逆各 10 圈；最后上下左右各看 5 秒。')]),
        step(150, [
          v((c) => !c.noStand && c.scene !== 'meeting' && c.scene !== 'exam', '若方便起身：做 2 轮“肩后展 + 胸打开”（轻轻伸展）。'),
          v(() => true, '不便起身：坐姿肩胛骨向后夹 2 秒→放松 6 秒，做 10 次。'),
        ]),
        step(60, [v(() => true, '收尾：回到任务前，先做 2 分钟“最小动作”，别一下冲太满。')]),
      ],
    },

    // ===== 肩颈僵硬 =====
    {
      id: 'neck_3',
      category: 'neck',
      title: '肩颈松一下 · 3 分钟',
      subtitle: '快速把“耸肩/前伸脖子”拉回中立位',
      scenes: ALL_SCENES,
      idealMin: 3,
      steps: [
        step(30, [v(() => true, '坐稳：脚掌踩实地面，肩自然下沉。')]),
        step(70, [v(() => true, '耸肩-放下：吸气耸肩 2 秒；呼气放下 4 秒（做 6 次）。')]),
        step(60, [v(() => true, '下巴回收：像把后脑勺轻推向墙，保持 3 秒→放松（做 8 次）。')]),
        step(20, [v(() => true, '收尾：抬眼看远 10 秒，肩胛骨轻夹一下再放开。')]),
      ],
    },
    {
      id: 'neck_5',
      category: 'neck',
      title: '肩颈松开 · 5 分钟',
      subtitle: '不影响周围人的安静版放松',
      scenes: ALL_SCENES,
      idealMin: 5,
      steps: [
        step(30, [v(() => true, '坐稳：脚掌踩实地面，背轻靠椅背，肩放松。')]),
        step(70, [v(() => true, '耸肩-放下：吸气耸肩 2 秒；呼气放下 4 秒（做 6 次）。')]),
        step(80, [v(() => true, '下巴回收：后脑勺轻推向墙，保持 3 秒放松（做 8 次）。')]),
        step(70, [v(() => true, '侧颈拉伸：右耳靠近右肩（不抬肩）20 秒，换边。')]),
        step(50, [v(() => true, '收尾：肩胛骨向后“轻轻夹一下”再放开，重复 6 次。')]),
      ],
    },
    {
      id: 'neck_7',
      category: 'neck',
      title: '肩颈舒展 · 7 分钟',
      subtitle: '加一点胸背打开，缓解久坐前倾',
      scenes: ALL_SCENES,
      idealMin: 7,
      steps: [
        step(40, [v(() => true, '重置坐姿：坐到椅子 2/3 处，脚踩实，肩放下。')]),
        step(90, [v(() => true, '耸肩-放下：吸 2 秒、呼 4 秒（做 10 次）。')]),
        step(90, [v(() => true, '下巴回收：保持 3 秒→放松（做 10 次）。')]),
        step(110, [
          v((c) => !c.noStand && c.scene !== 'meeting' && c.scene !== 'exam', '若方便起身：站姿抱臂含胸 10 秒→打开胸 10 秒，做 5 轮。'),
          v(() => true, '不便起身：坐姿双手扣住后脑勺，肘向两侧打开 10 秒→放松 10 秒，做 5 轮。'),
        ]),
        step(80, [v(() => true, '侧颈拉伸：左右各 25 秒；最后轻轻点头 6 次。')]),
        step(30, [v(() => true, '收尾：喝一口水，肩放下再开始下一段。')]),
      ],
    },
    {
      id: 'neck_10',
      category: 'neck',
      title: '肩颈恢复 · 10 分钟',
      subtitle: '更完整的“松-伸-回中立”',
      scenes: ALL_SCENES,
      idealMin: 10,
      steps: [
        step(45, [v(() => true, '重置：脚踩实，想象头顶被轻轻向上提。')]),
        step(120, [v(() => true, '耸肩-放下：吸 2 秒、呼 4 秒（做 15 次）。')]),
        step(120, [v(() => true, '下巴回收：保持 3 秒→放松（做 12 次）。')]),
        step(160, [
          v((c) => !c.noStand && c.scene !== 'meeting' && c.scene !== 'exam', '若方便起身：站姿“开门”拉伸（胸打开）左右各 40 秒。'),
          v(() => true, '不便起身：坐姿双手向后扣椅背/交叉放背后，胸打开 40 秒；换方向再 40 秒。'),
        ]),
        step(120, [v(() => true, '肩胛控制：肩胛骨向后下“收一下”2 秒→放松 6 秒（做 12 次）。')]),
        step(35, [v(() => true, '收尾：回到屏幕前先把肩放下，再继续。')]),
      ],
    },

    // ===== 注意力涣散 =====
    {
      id: 'focus_3',
      category: 'focus',
      title: '注意力拉回 · 3 分钟',
      subtitle: '先止损，再回到下一步',
      scenes: ALL_SCENES,
      idealMin: 3,
      steps: [
        step(20, [v(() => true, '停：把当前页面停在“可恢复”的位置（不用清空）。')]),
        step(80, [v(() => true, '呼气更慢：吸 4、呼 6（做 6 轮）。')]),
        step(60, [v(() => true, '写一句：只写“下一步最小动作是什么”。')]),
        step(20, [v(() => true, '收尾：立刻做 1 个最小动作（30 秒就行）。')]),
      ],
    },
    {
      id: 'focus_5',
      category: 'focus',
      title: '注意力重启 · 5 分钟',
      subtitle: '把“乱”变成“可继续”',
      scenes: ALL_SCENES,
      idealMin: 5,
      steps: [
        step(20, [v(() => true, '停：把当前页面停在一个“可恢复”的位置（不用清空）。')]),
        step(60, [v(() => true, '降噪：闭眼 10 秒，然后只听周围环境 10 秒（循环 3 次）。')]),
        step(90, [v(() => true, '写一行：用纸/便签写下“下一步只做什么”（只写 1 行）。')]),
        step(90, [v(() => true, '30-30：盯着一个小点 30 秒，再看远处 30 秒，做 3 轮。')]),
        step(40, [v(() => true, '收尾：回到任务，先做 2 分钟的最小动作（不要贪多）。')]),
      ],
    },
    {
      id: 'focus_7',
      category: 'focus',
      title: '注意力续航 · 7 分钟',
      subtitle: '把身体“唤醒一点”，大脑就更容易回来',
      scenes: ALL_SCENES,
      idealMin: 7,
      steps: [
        step(25, [v(() => true, '停：把当前任务停在一个“可恢复点”（不做清理）。')]),
        step(120, [
          v((c) => !c.noStand && c.scene !== 'meeting' && c.scene !== 'exam', '若方便起身：慢走 2 分钟（不看手机），只感受脚步。'),
          v(() => true, '不便起身：脚掌踩地，脚趾用力 2 秒→放松 6 秒（做 12 次）。'),
        ]),
        step(120, [v(() => true, '降噪呼吸：吸 4、呼 6（做 8 轮）。')]),
        step(120, [v(() => true, '写两行：1）下一步最小动作 2）完成标准（一句话）。')]),
        step(35, [v(() => true, '收尾：先做 2 分钟最小动作，再决定要不要继续。')]),
      ],
    },
    {
      id: 'focus_10',
      category: 'focus',
      title: '注意力找回 · 10 分钟',
      subtitle: '更完整的“降噪 + 清晰下一步 + 轻恢复”',
      scenes: ALL_SCENES,
      idealMin: 10,
      steps: [
        step(30, [v(() => true, '停：把当前任务停住（保存/标记），先别硬扛。')]),
        step(180, [
          v((c) => !c.noStand && c.scene !== 'meeting' && c.scene !== 'exam', '若方便起身：慢走 3 分钟（不看手机），回座位再坐稳。'),
          v(() => true, '不便起身：做 3 轮“看远 30 秒 + 闭眼 30 秒”。'),
        ]),
        step(150, [v(() => true, '降噪：吸 4、呼 6（做 10 轮）。')]),
        step(150, [v(() => true, '写三行：①下一步最小动作 ②完成标准 ③完成后奖励（很小也行）。')]),
        step(90, [v(() => true, '收尾：回来只做 5 分钟“最小动作”，不要直接加码。')]),
      ],
    },

    // ===== 会前/考前紧张 =====
    {
      id: 'nervous_3',
      category: 'nervous',
      title: '会前/考前稳住 · 3 分钟',
      subtitle: '不出声也能把身体慢下来',
      scenes: ALL_SCENES,
      idealMin: 3,
      steps: [
        step(20, [v(() => true, '脚掌踩实：把注意力放在脚底触地感。')]),
        step(80, [v(() => true, '4-6 呼吸：吸气 4 拍，呼气 6 拍（做 6 轮）。')]),
        step(50, [v(() => true, '放松下巴：上下牙轻分开，舌尖轻触上颚。')]),
        step(30, [v(() => true, '收尾一句：在心里默念“我只需要完成下一步”。')]),
      ],
    },
    {
      id: 'nervous_5',
      category: 'nervous',
      title: '紧张缓冲 · 5 分钟',
      subtitle: '把“快”压慢，恢复可控感',
      scenes: ALL_SCENES,
      idealMin: 5,
      steps: [
        step(30, [v(() => true, '落地：脚踩实，肩放下，眼睛看一个固定点。')]),
        step(120, [v(() => true, '呼吸：吸 4、呼 6（做 10 轮）。')]),
        step(90, [
          v((c) => !c.noSound, '若方便出声：轻轻“嗯——”哼气 6 次（声音很小即可）。'),
          v(() => true, '不便出声：无声呼气更慢，做 6 次。'),
        ]),
        step(40, [v(() => true, '放松手：握拳 2 秒→放松 6 秒（做 6 次）。')]),
        step(20, [v(() => true, '收尾：在心里说一句“按流程来”。')]),
      ],
    },
    {
      id: 'nervous_7',
      category: 'nervous',
      title: '稳住与聚焦 · 7 分钟',
      subtitle: '把注意力从“结果”拉回“步骤”',
      scenes: ALL_SCENES,
      idealMin: 7,
      steps: [
        step(30, [v(() => true, '落地：脚踩实，背靠稳，肩放下。')]),
        step(150, [v(() => true, '呼吸：吸 4、呼 6（做 12 轮）。')]),
        step(120, [v(() => true, '5-4-3-2-1：看 5 个物体→摸 4 个触感→听 3 个声音→闻 2 个气味→感 1 个身体点。')]),
        step(90, [v(() => true, '“下一步清单”：写/想 3 个你能控制的动作（很小也行）。')]),
        step(30, [v(() => true, '收尾：把注意力放回呼气，做 3 次更慢的呼气。')]),
      ],
    },
    {
      id: 'nervous_10',
      category: 'nervous',
      title: '紧张重置 · 10 分钟',
      subtitle: '给身体一个完整的“降速”过程',
      scenes: ALL_SCENES,
      idealMin: 10,
      steps: [
        step(40, [v(() => true, '落地：脚踩实，肩放下，眼睛看固定点 10 秒。')]),
        step(210, [v(() => true, '呼吸：吸 4、呼 6（做 15 轮）。')]),
        step(180, [
          v((c) => !c.noStand && c.scene !== 'meeting' && c.scene !== 'exam', '若方便起身：慢走 3 分钟（不看手机），只数呼气次数。'),
          v(() => true, '不便起身：做 3 轮“闭眼 30 秒 + 看远 30 秒”。'),
        ]),
        step(120, [v(() => true, '手部放松：握拳→放松（做 12 次），最后抖抖手指。')]),
        step(50, [v(() => true, '收尾：只关注“第一句话/第一题/第一步”。')]),
      ],
    },

    // ===== 心烦低落 =====
    {
      id: 'mood_3',
      category: 'mood',
      title: '情绪缓冲 · 3 分钟',
      subtitle: '让情绪先“靠边停一下”',
      scenes: ALL_SCENES,
      idealMin: 3,
      steps: [
        step(30, [v(() => true, '命名：在心里说一句“我现在是（烦/累/难受）”。')]),
        step(90, [v(() => true, '长呼气：呼气比吸气慢一倍（不憋气）。')]),
        step(60, [v(() => true, '触感锚点：用手指摸摸桌面/衣角，感受纹理 60 秒。')]),
        step(20, [v(() => true, '收尾：对自己说一句“我先缓一下再继续”。')]),
      ],
    },
    {
      id: 'mood_5',
      category: 'mood',
      title: '心烦低落缓冲 · 5 分钟',
      subtitle: '给情绪一个“安全靠边”的位置',
      scenes: ALL_SCENES,
      idealMin: 5,
      steps: [
        step(30, [v(() => true, '命名：在心里说一句“我现在是（烦/累/难受）”。')]),
        step(90, [v(() => true, '身体扫描：从额头到肩、到手指，逐段“松一下”。')]),
        step(90, [v(() => true, '3-2-1：找 3 个你能看到的物体，2 个触感，1 个声音。')]),
        step(80, [v(() => true, '长呼气：呼气比吸气慢一倍（不憋气）。')]),
        step(30, [v(() => true, '收尾：给自己一句允许，比如“我可以慢一点”。')]),
      ],
    },
    {
      id: 'mood_7',
      category: 'mood',
      title: '情绪回稳 · 7 分钟',
      subtitle: '把注意力从“内耗循环”挪开一点点',
      scenes: ALL_SCENES,
      idealMin: 7,
      steps: [
        step(30, [v(() => true, '命名：把情绪说清楚（烦/委屈/压力/低落）。')]),
        step(120, [v(() => true, '呼气更慢：吸 4、呼 6（做 10 轮）。')]),
        step(120, [v(() => true, '身体扫描：额头→肩→手→腹部，哪里紧就松哪里。')]),
        step(120, [
          v((c) => !c.noStand && c.scene !== 'meeting' && c.scene !== 'exam', '若方便起身：慢走 2 分钟，只数脚步。'),
          v(() => true, '不便起身：轻轻转动脚踝、活动手指 2 分钟。'),
        ]),
        step(60, [v(() => true, '收尾：写/想一句“下一步我只做……”。')]),
      ],
    },
    {
      id: 'mood_10',
      category: 'mood',
      title: '情绪恢复 · 10 分钟',
      subtitle: '更完整的“缓冲 → 回稳 → 回到下一步”',
      scenes: ALL_SCENES,
      idealMin: 10,
      steps: [
        step(40, [v(() => true, '命名：我现在是（烦/压力/低落/生气）。')]),
        step(180, [v(() => true, '呼吸：吸 4、呼 6（做 15 轮）。')]),
        step(180, [v(() => true, '5-4-3-2-1：把注意力移到外界，做一轮完整的感官锚定。')]),
        step(180, [
          v((c) => !c.noStand && c.scene !== 'meeting' && c.scene !== 'exam', '若方便起身：慢走 3 分钟（不看手机），回来坐稳。'),
          v(() => true, '不便起身：做 3 轮“握拳 2 秒→放松 6 秒 + 肩放下”。'),
        ]),
        step(60, [v(() => true, '收尾：给自己一句温柔但具体的承诺：“我先做 5 分钟最小动作”。')]),
      ],
    },

    // ===== 睡前放松 =====
    {
      id: 'sleep_3',
      category: 'sleep',
      title: '睡前降刺激 · 3 分钟',
      subtitle: '把大脑从“刷屏兴奋”切到“入睡准备”',
      scenes: ALL_SCENES,
      idealMin: 3,
      steps: [
        step(30, [v(() => true, '屏幕退出：把手机放远一点（或开飞行模式）。')]),
        step(110, [
          v((c) => !c.noLie, '若可以躺下：躺好，把一只手放在腹部，呼气更慢。'),
          v(() => true, '若不能躺：坐靠稳，手放腹部，呼气更慢。'),
        ]),
        step(40, [v(() => true, '收尾：只做一件事——闭眼，呼气再慢一点。')]),
      ],
    },
    {
      id: 'sleep_5',
      category: 'sleep',
      title: '睡前放松 · 5 分钟',
      subtitle: '低刺激、无负担的入睡准备',
      scenes: ALL_SCENES,
      idealMin: 5,
      steps: [
        step(40, [v(() => true, '屏幕退出：把手机放远/调暗/静音。')]),
        step(140, [
          v((c) => !c.noLie, '若可以躺下：腹式呼吸 2 分钟（吸气腹部轻鼓，呼气慢慢回落）。'),
          v(() => true, '若不能躺：坐靠稳做腹式呼吸 2 分钟。'),
        ]),
        step(90, [v(() => true, '渐进放松：握拳 2 秒→放松 6 秒；做 10 次。')]),
        step(30, [v(() => true, '收尾：把注意力放在呼气，做 3 次更慢的呼气。')]),
      ],
    },
    {
      id: 'sleep_7',
      category: 'sleep',
      title: '睡前放松 · 7 分钟',
      subtitle: '更完整的“呼吸 + 渐进放松”',
      scenes: ALL_SCENES,
      idealMin: 7,
      steps: [
        step(30, [v(() => true, '屏幕退出：把手机放到够不着的位置（或开飞行模式）。')]),
        step(120, [
          v((c) => !c.noLie, '若可以躺下：腹式呼吸 2 分钟（手放腹部）。'),
          v(() => true, '若不能躺：坐靠稳做腹式呼吸 2 分钟。'),
        ]),
        step(140, [
          v((c) => !c.noLie, '若可以躺下：渐进放松（脚趾→小腿→大腿→腹→肩），每段用力 2 秒→放松 6 秒。'),
          v(() => true, '若不能躺：只做上肢渐进放松（握拳→前臂→肩），每段用力 2 秒→放松 6 秒。'),
        ]),
        step(80, [v(() => true, '“今天到此为止”：把今天的事放进一个盒子，盖上盖子。')]),
        step(50, [v(() => true, '收尾：闭眼，呼气更慢一点。')]),
      ],
    },
    {
      id: 'sleep_10',
      category: 'sleep',
      title: '睡前深放松 · 10 分钟',
      subtitle: '给身体一个完整的“降档”过程',
      scenes: ALL_SCENES,
      idealMin: 10,
      steps: [
        step(45, [v(() => true, '屏幕退出：把手机放远/静音/不再看信息。')]),
        step(180, [
          v((c) => !c.noLie, '若可以躺下：腹式呼吸 3 分钟（呼气更慢）。'),
          v(() => true, '若不能躺：坐靠稳做腹式呼吸 3 分钟。'),
        ]),
        step(240, [
          v((c) => !c.noLie, '若可以躺下：渐进放松全身（脚趾到肩），每段用力 2 秒→放松 6 秒。'),
          v(() => true, '若不能躺：渐进放松上半身（手→前臂→肩→下巴），每段用力 2 秒→放松 6 秒。'),
        ]),
        step(90, [v(() => true, '收尾：把注意力放在呼气末端的“松一下”。')]),
        step(45, [v(() => true, '最后：只做一件事——闭眼，允许自己睡。')]),
      ],
    },

    // ===== 通用重启（兜底 2 套） =====
    {
      id: 'reset_3',
      category: 'reset',
      title: '通用重启 · 3 分钟',
      subtitle: '当你说不清哪里累，但确实需要缓一下',
      scenes: ALL_SCENES,
      idealMin: 3,
      steps: [
        step(20, [v(() => true, '停：手离开键盘/笔，眼睛离开屏幕。')]),
        step(80, [v(() => true, '呼气更慢：吸 4、呼 6（做 6 轮）。')]),
        step(60, [v(() => true, '看远 + 轻眨：看远处一点，轻眨眼，肩放下。')]),
        step(20, [v(() => true, '收尾：回来只做“下一步最小动作”。')]),
      ],
    },
    {
      id: 'reset_10',
      category: 'reset',
      title: '通用重启 · 10 分钟',
      subtitle: '更完整的“降噪 + 放松 + 回到下一步”',
      scenes: ALL_SCENES,
      idealMin: 10,
      steps: [
        step(30, [v(() => true, '停：放下正在做的事，先别刷手机。')]),
        step(180, [
          v((c) => !c.noStand && c.scene !== 'meeting' && c.scene !== 'exam', '若方便起身：慢走 3 分钟（不看手机），回来坐稳。'),
          v(() => true, '不便起身：做 3 轮“看远 30 秒 + 闭眼 30 秒”。'),
        ]),
        step(180, [v(() => true, '呼吸：吸 4、呼 6（做 15 轮）。')]),
        step(180, [v(() => true, '手部放松：握拳 2 秒→放松 6 秒（做 20 次）。')]),
        step(30, [v(() => true, '收尾：回来只做“下一步最小动作”。')]),
      ],
    },
  ];

  /** ---------- 危机识别（极简规则，仅提示引导） ---------- */
  const RISK_KEYWORDS = [
    '想死', '不想活', '活不下去', '自杀', '结束生命', '伤害自己', '自残', '割腕',
    'suicide', 'kill myself', 'self harm', 'self-harm'
  ];

  /** ---------- 工具函数 ---------- */
  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

  function fmtMMSS(sec) {
    const s = Math.max(0, Math.floor(sec));
    const mm = String(Math.floor(s / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  }

  function sumStepsSec(steps) {
    return steps.reduce((acc, s) => acc + (s.durationSec || 0), 0);
  }

  function containsAny(text, words) {
    return words.some((w) => text.includes(w));
  }

  function scoreCategory(text) {
    const scores = {};
    Object.keys(KEYWORDS).forEach((cat) => {
      const list = KEYWORDS[cat];
      let s = 0;
      list.forEach((kw, idx) => {
        if (text.includes(kw)) {
          // 越靠前越强；同一类多命中叠加
          s += (list.length - idx) * 2;
        }
      });
      scores[cat] = s;
    });

    // 轻量语义兜底（避免“眼睛好痛”这类被拆开导致漏判）
    // 规则：出现“眼睛/眼”且出现“痛/疼”，给眼疲劳加分
    if ((text.includes('眼睛') || text.includes('眼')) && (text.includes('痛') || text.includes('疼'))) {
      scores.eye = (scores.eye || 0) + 10;
    }

    // 选最高
    let best = { id: 'reset', score: 0 };
    Object.entries(scores).forEach(([id, sc]) => {
      if (sc > best.score) best = { id, score: sc };
    });
    // 低于阈值则 reset
    if (best.score < 6) return { id: 'reset', score: 0 };
    return best;
  }

  function parseChineseNumberUpTo30(s) {
    // 仅覆盖 1-30：一二三四五六七八九十两 + 十一/二十/二十五/三十
    const map = { '零': 0, '一': 1, '二': 2, '两': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9 };
    if (!s) return null;
    if (s === '十') return 10;
    if (s === '三十') return 30;
    if (s.includes('十')) {
      const parts = s.split('十');
      const tens = parts[0] === '' ? 1 : (map[parts[0]] ?? null);
      const ones = parts[1] ? (map[parts[1]] ?? null) : 0;
      if (tens == null || ones == null) return null;
      const v = tens * 10 + ones;
      return v >= 1 && v <= 30 ? v : null;
    }
    // 单位数
    const v = map[s];
    if (typeof v === 'number' && v >= 1 && v <= 30) return v;
    return null;
  }

  function parseMinutesFromText(text) {
    // 支持：4分钟 / 4 分钟 / 4min / 4 mins / 4 minutes / 4m / 4 分
    // 备注：中文不是 \w 字符，不能用 \b；这里用更宽松的匹配
    const m1 = text.match(/(\d{1,2})\s*(分钟|分|min|mins|minute|minutes|m)/i);
    if (m1) return { found: true, value: clamp(parseInt(m1[1], 10), 1, 30), raw: m1[0] };
    // 支持：四分钟 / 十分钟 / 二十五分钟
    const m2 = text.match(/([零一二两三四五六七八九十]{1,3})\s*(分钟|分)/);
    if (m2) {
      const v = parseChineseNumberUpTo30(m2[1]);
      if (v != null) return { found: true, value: clamp(v, 1, 30), raw: m2[0] };
    }
    return { found: false, value: null, raw: null };
  }

  function detectSceneFromText(text) {
    const entries = Object.entries(SCENE_HINTS);
    for (const [scene, hints] of entries) {
      if (containsAny(text, hints)) return scene;
    }
    return 'any';
  }

  function normalizeText(s) {
    const raw = String(s || '').trim();
    const norm = raw
      .replaceAll('｜', '|')
      .replaceAll('，', ',')
      .replaceAll('。', '.')
      .replaceAll('：', ':')
      .replaceAll('；', ';')
      .toLowerCase();
    return { raw, norm };
  }

  function setMinutes(min, opts = {}) {
    const { lock = true, regen = false, silent = false } = opts;
    const v = clamp(parseInt(String(min || '0'), 10), 1, 30);
    state.pickedMinutes = v;
    if (lock) state.minutesLocked = true;

    if (els.minutesNumber) els.minutesNumber.value = String(v);
    if (els.minutesRange) els.minutesRange.value = String(v);

    // 预设按钮高亮：仅当刚好命中预设值
    setPressed('.chip[data-minutes]', (b) => parseInt(b.dataset.minutes || '0', 10) === v);

    if (!silent && regen) debouncedGenerate();
  }

  let _regenTimer = null;
  function debouncedGenerate() {
    if (!state.lastParsed && els.planBox?.style?.display !== 'block') return;
    if (_regenTimer) window.clearTimeout(_regenTimer);
    _regenTimer = window.setTimeout(() => generate(), 220);
  }

  function pickPlan(categoryId, scene, minutes) {
    const candidates = PLAN_LIBRARY
      .filter((p) => p.category === categoryId)
      .filter((p) => p.scenes.includes(scene) || p.scenes.includes('any'));

    // 如果某类没有匹配到，就退回通用
    const pool = candidates.length ? candidates : PLAN_LIBRARY.filter((p) => p.category === 'reset');

    // 优先：idealMin <= minutes 且越接近越好；其次：最短可完成
    const target = minutes;
    const scored = pool.map((p) => {
      const dist = Math.abs((p.idealMin || 0) - target);
      const total = sumStepsSec(p.steps);
      // 惩罚：总时长明显超过目标
      const overflow = Math.max(0, Math.round(total / 60) - target);
      return { p, dist, overflow, total };
    });
    scored.sort((a, b) => (a.overflow - b.overflow) || (a.dist - b.dist) || (a.total - b.total));
    return scored[0].p;
  }

  function fitToDuration(plan, minutes) {
    const maxSec = minutes * 60;
    const steps = plan.steps.map((s) => ({ ...s }));
    const total = sumStepsSec(steps);
    if (total <= maxSec) return { ...plan, steps, fitted: { trimmed: false, maxSec } };

    // 简单裁剪：从最后一步开始缩短；最低每步保留 15 秒
    let overflow = total - maxSec;
    for (let i = steps.length - 1; i >= 0 && overflow > 0; i--) {
      const keepMin = 15;
      const canCut = Math.max(0, steps[i].durationSec - keepMin);
      const cut = Math.min(canCut, overflow);
      steps[i].durationSec -= cut;
      overflow -= cut;
    }
    // 若仍超（极端情况），就截断步骤
    while (sumStepsSec(steps) > maxSec && steps.length > 1) steps.pop();
    return { ...plan, steps, fitted: { trimmed: true, maxSec } };
  }

  /** ---------- 渲染 ---------- */
  function renderRisk(text) {
    const hit = RISK_KEYWORDS.find((w) => text.includes(w));
    if (!hit) {
      els.riskBox.style.display = 'none';
      els.riskBox.innerHTML = '';
      return false;
    }
    els.riskBox.style.display = 'block';
    els.riskBox.innerHTML = `
      <strong>检测到你提到可能的危机/自伤相关内容。</strong>
      <div class="muted" style="margin-top:.35rem;font-size:.92rem">
        这个工具只能给轻量的小息建议，无法替代专业帮助。
        如果你处于紧急危险，请立刻联系当地紧急服务或身边可信的人；
        也建议尽快联系专业心理/医疗支持。
      </div>
    `;
    return true;
  }

  function setPressed(groupSelector, predicate) {
    $$(groupSelector).forEach((btn) => {
      btn.setAttribute('aria-pressed', predicate(btn) ? 'true' : 'false');
    });
  }

  function renderPlan(parsed, plan) {
    els.planBox.style.display = 'block';
    els.timerBox.style.display = 'block';
    els.feedbackBox.style.display = 'none';
    els.fbSaved.style.display = 'none';

    const cat = CATEGORIES.find((c) => c.id === plan.category) || CATEGORIES.find((c) => c.id === 'reset');
    els.planTitle.textContent = `${cat ? cat.name : '方案'} · ${plan.title}`;
    els.planSubtitle.textContent = plan.subtitle || '';

    els.planMeta.innerHTML = '';
    const metaItems = [
      { k: '场景', v: `${SCENE_NAMES[parsed.sceneUsed] || '通用'}${parsed.sceneLocked ? '（手动）' : '（自动）'}` },
      { k: '姿势', v: `${({ sit: '坐着', stand: '站着', lie: '躺着' }[parsed.postureUsed] || '坐着')}${parsed.postureLocked ? '（手动）' : '（自动）'}` },
      { k: '地点', v: `${({ indoor: '室内', outdoor: '室外', any: '不确定' }[parsed.placeUsed] || '室内')}${parsed.placeLocked ? '（手动）' : '（自动）'}` },
      { k: '时长', v: `${parsed.minutesUsed} 分钟${parsed.minutesLocked ? '（手动）' : (parsed.minutesDetected ? '（从输入识别）' : '')}` },
      { k: '命中', v: parsed.hit ? `“${parsed.hit}”` : '低置信度 → 通用重启' },
      { k: '方式', v: plan.fitted?.trimmed ? '已自动压缩以做得完' : '完整方案' },
    ];

    // 仍保留“限制”做透明解释（由姿势/地点/场景推断而来）
    const c = parsed.constraintsUsed || { noStand: false, noLie: false, noSound: false };
    const cLabels = [];
    if (c.noStand) cLabels.push('不能起身');
    if (c.noLie) cLabels.push('不能躺');
    if (c.noSound) cLabels.push('不能出声');
    metaItems.splice(2, 0, { k: '推断限制', v: cLabels.length ? cLabels.join(' / ') : '无' });

    if (parsed.sceneDetected) {
      if (parsed.sceneDetected === 'any' && !parsed.sceneLocked) {
        metaItems.splice(1, 0, { k: '识别场景', v: '未识别（已用通用）' });
      } else if (parsed.sceneDetected !== parsed.sceneUsed && parsed.sceneDetected !== 'any') {
        metaItems.splice(1, 0, { k: '识别场景', v: SCENE_NAMES[parsed.sceneDetected] || '通用' });
      }
    }
    if (parsed.minutesDetected && parsed.minutesDetected !== parsed.minutesUsed) {
      metaItems.splice(2, 0, { k: '识别时长', v: `${parsed.minutesDetected} 分钟` });
    }

    metaItems.forEach(({ k, v }) => {
      const span = document.createElement('span');
      span.className = 'pill';
      span.innerHTML = `<span class="muted">${k}</span><strong>${escapeHtml(v)}</strong>`;
      els.planMeta.appendChild(span);
    });

    els.steps.innerHTML = '';
    plan.steps.forEach((s, idx) => {
      const actionKey = detectActionKey(s.text);
      const icon = ICONS[actionKey] || ICONS.default;
      const div = document.createElement('div');
      div.className = 'step';
      div.dataset.idx = String(idx);
      const iconInner = icon.img
        ? `<img src="${icon.img}" alt="${escapeHtml(icon.title || '动作示意')}">`
        : (icon.smallSvg || '');
      div.innerHTML = `
        <div class="idx">${idx + 1}</div>
        <button class="step-icon" type="button" data-action="${escapeHtml(actionKey)}" aria-label="查看动作示意" title="点开动作示意：${escapeHtml(icon.title || '动作示意')}">${iconInner}</button>
        <div style="flex:1">
          <div>${escapeHtml(s.text)}</div>
          <div class="dur">${Math.max(15, s.durationSec)} 秒</div>
        </div>
      `;
      els.steps.appendChild(div);
    });

    // 绑定示意图弹窗
    $$('#steps .step-icon').forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.action || 'default';
        openIconModal(key);
      });
    });

    // 计时器初始态
    stopTimer(false);
    state.currentPlan = plan;
    state.totalPlannedSec = sumStepsSec(plan.steps);
    state.totalRemainSec = state.totalPlannedSec;
    state.stepIndex = 0;
    state.stepRemainSec = plan.steps[0]?.durationSec || 0;
    highlightStep(0);
    renderClock('准备开始', state.totalRemainSec, 0);

    setTimerButtons({ canStart: true, canPause: false, canNext: false, canStop: false });
    renderRelaxSection(parsed.category);
  }

  function getRelaxEffectiveFilter(kind, categoryId) {
    if (state.relaxMode[kind] === 'manual' && state.relaxFilter[kind] !== 'auto') return state.relaxFilter[kind];
    return RELAX_MAP[categoryId]?.[kind] || RELAX_MAP.reset[kind];
  }

  function renderRelaxFilters(kind, categoryId) {
    const host = els[`${kind}Filters`];
    if (!host) return;
    const effective = getRelaxEffectiveFilter(kind, categoryId);
    const options = RELAX_FILTERS[kind] || [];
    host.innerHTML = options.map((it) => {
      const active = state.relaxMode[kind] === 'auto'
        ? it.id === 'auto'
        : it.id === state.relaxFilter[kind];
      const label = it.id === 'auto' ? `${it.label}：${(RELAX_FILTERS[kind].find(x => x.id === effective)?.label) || effective}` : it.label;
      return `<button class="relax-chip" type="button" data-relax-kind="${kind}" data-relax-filter="${it.id}" aria-pressed="${active ? 'true' : 'false'}">${escapeHtml(label)}</button>`;
    }).join('');
  }

  function getRelaxItems(kind, categoryId) {
    const key = getRelaxEffectiveFilter(kind, categoryId);
    return RELAX_LIBRARY[kind]?.[key] || [];
  }

  function renderRelaxCard(kind, categoryId) {
    const host = els[`${kind}Card`];
    if (!host) return;
    const items = getRelaxItems(kind, categoryId);
    if (!items.length) {
      host.innerHTML = `<div class="muted">这里还在整理中。</div>`;
      return;
    }
    const idx = Math.max(0, Math.min(state.relaxChoiceIndex[kind] || 0, items.length - 1));
    const item = items[idx];
    host.innerHTML = `
      <div class="relax-item-head">
        <div class="relax-name">${escapeHtml(item.title)}</div>
      </div>
      <div class="relax-copy">${escapeHtml(item.desc)}</div>
      <div class="relax-meta">${escapeHtml(item.meta)}</div>
      <ul class="relax-bullets">
        ${(item.bullets || []).map((b) => `<li>${escapeHtml(b)}</li>`).join('')}
      </ul>
    `;
  }

  function renderRelaxSection(categoryId = 'reset') {
    ['action', 'music', 'text'].forEach((kind) => {
      $$(`[data-mode][data-kind="${kind}"]`).forEach((btn) => {
        btn.classList.toggle('primary', state.relaxMode[kind] === 'auto');
      });
      renderRelaxFilters(kind, categoryId);
      const items = getRelaxItems(kind, categoryId);
      if ((state.relaxChoiceIndex[kind] || 0) >= items.length) state.relaxChoiceIndex[kind] = 0;
      renderRelaxCard(kind, categoryId);
    });
  }

  function randomizeRelax(kind, categoryId) {
    const items = getRelaxItems(kind, categoryId);
    if (!items.length) return;
    if (items.length === 1) {
      state.relaxChoiceIndex[kind] = 0;
    } else {
      let next = Math.floor(Math.random() * items.length);
      if (next === state.relaxChoiceIndex[kind]) next = (next + 1) % items.length;
      state.relaxChoiceIndex[kind] = next;
    }
    renderRelaxCard(kind, categoryId);
  }

  function openIconModal(actionKey) {
    const icon = ICONS[actionKey] || ICONS.default;
    if (!els.iconModal) return;
    if (els.iconModalTitle) els.iconModalTitle.textContent = icon.title || '动作示意';
    if (els.iconModalSvg) {
      els.iconModalSvg.style.color = 'rgba(31,41,55,.85)';
      if (icon.img) {
        els.iconModalSvg.innerHTML = `<img src="${icon.img}" alt="${escapeHtml(icon.title || '动作示意')}" style="width:100%;height:auto;max-height:70vh;object-fit:contain;border-radius:12px">`;
      } else if (icon.correctSvg && icon.wrongSvg) {
        els.iconModalSvg.innerHTML = `
          <div class="icon-compare">
            <div class="icon-fig">
              <div class="icon-cap"><span class="cap-good">正确</span><span class="muted">照着做</span></div>
              ${icon.correctSvg}
            </div>
            <div class="icon-fig">
              <div class="icon-cap"><span class="cap-bad">常见错误</span><span class="muted">容易越做越紧</span></div>
              ${icon.wrongSvg}
            </div>
          </div>
        `;
      } else {
        els.iconModalSvg.innerHTML = icon.largeSvg || icon.correctSvg || '';
      }
    }
    if (els.iconModalTips) {
      const tips = Array.isArray(icon.tips) ? icon.tips : [];
      const wrongTips = Array.isArray(icon.wrongTips) ? icon.wrongTips : [];
      const left = tips.length
        ? `<div style="font-weight:850;margin:.2rem 0 .35rem;color:rgba(31,41,55,.82)">要点</div><ul>${tips.map((t) => `<li>${escapeHtml(t)}</li>`).join('')}</ul>`
        : '';
      const right = wrongTips.length
        ? `<div style="font-weight:850;margin:.75rem 0 .35rem;color:rgba(31,41,55,.82)">别这样做</div><ul>${wrongTips.map((t) => `<li>${escapeHtml(t)}</li>`).join('')}</ul>`
        : '';
      els.iconModalTips.innerHTML = (left || right) ? (left + right) : '';
    }
    els.iconModal.classList.add('open');
    els.iconModal.setAttribute('aria-hidden', 'false');
  }

  function closeIconModal() {
    if (!els.iconModal) return;
    els.iconModal.classList.remove('open');
    els.iconModal.setAttribute('aria-hidden', 'true');
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function highlightStep(idx) {
    $$('#steps .step').forEach((el) => {
      el.classList.toggle('active', parseInt(el.dataset.idx, 10) === idx);
    });
  }

  function setTimerButtons({ canStart, canPause, canNext, canStop }) {
    els.btnStart.disabled = !canStart;
    els.btnPause.disabled = !canPause;
    els.btnNext.disabled = !canNext;
    els.btnStop.disabled = !canStop;
  }

  function renderClock(label, totalRemainSec, totalPlannedSecDone) {
    els.timerLabel.textContent = label;
    els.timerBig.textContent = fmtMMSS(totalRemainSec);
    const pct = state.totalPlannedSec > 0
      ? clamp(Math.round((totalPlannedSecDone / state.totalPlannedSec) * 100), 0, 100)
      : 0;
    els.progressBar.style.width = `${pct}%`;
  }

  /** ---------- 计时器 ---------- */
  function startTimer() {
    if (!state.currentPlan) return;
    if (state.running) return;
    state.running = true;
    state.paused = false;

    setTimerButtons({ canStart: false, canPause: true, canNext: true, canStop: true });
    els.btnPause.textContent = '暂停';

    state.ticker = window.setInterval(() => tick(), 250);
  }

  function pauseResume() {
    if (!state.running) return;
    state.paused = !state.paused;
    els.btnPause.textContent = state.paused ? '继续' : '暂停';
  }

  function nextStep() {
    if (!state.currentPlan) return;
    // 跳到下一步：直接扣掉当前剩余
    const currRemain = state.stepRemainSec;
    state.totalRemainSec = Math.max(0, state.totalRemainSec - currRemain);
    state.stepRemainSec = 0;
    advanceStepIfNeeded(true);
  }

  function stopTimer(showFeedback) {
    if (state.ticker) {
      window.clearInterval(state.ticker);
      state.ticker = null;
    }
    state.running = false;
    state.paused = false;

    // 仅 UI 状态
    setTimerButtons({ canStart: true, canPause: false, canNext: false, canStop: false });
    els.btnPause.textContent = '暂停';

    if (showFeedback) showFeedbackBox();
  }

  function tick() {
    if (!state.currentPlan) return;
    if (!state.running) return;
    if (state.paused) {
      renderClock('暂停中', state.totalRemainSec, state.totalPlannedSec - state.totalRemainSec);
      return;
    }

    // 以 1 秒为单位递减：用时间戳避免 setInterval 漂移
    // 简化：每 250ms 检查一次，仅当跨过下一秒时减 1
    if (!state._last) state._last = Date.now();
    const now = Date.now();
    const delta = now - state._last;
    if (delta < 1000) {
      renderClock(stepLabel(), state.totalRemainSec, state.totalPlannedSec - state.totalRemainSec);
      return;
    }
    const step = Math.floor(delta / 1000);
    state._last = now;

    for (let i = 0; i < step; i++) {
      if (state.totalRemainSec <= 0) break;
      state.totalRemainSec -= 1;
      state.stepRemainSec = Math.max(0, state.stepRemainSec - 1);
      advanceStepIfNeeded(false);
    }
    renderClock(stepLabel(), state.totalRemainSec, state.totalPlannedSec - state.totalRemainSec);

    if (state.totalRemainSec <= 0) {
      // 结束
      announce('小息完成。');
      stopTimer(true);
    }
  }

  function stepLabel() {
    const s = state.currentPlan?.steps?.[state.stepIndex];
    if (!s) return '进行中';
    return `第 ${state.stepIndex + 1} 步（剩余 ${fmtMMSS(state.stepRemainSec)}）`;
  }

  function advanceStepIfNeeded(force) {
    if (!state.currentPlan) return;
    if (state.stepRemainSec > 0 && !force) return;

    const nextIdx = state.stepIndex + 1;
    if (nextIdx >= state.currentPlan.steps.length) {
      // 已无下一步：totalRemainSec 会倒到 0
      state.stepIndex = state.currentPlan.steps.length - 1;
      state.stepRemainSec = 0;
      highlightStep(state.stepIndex);
      return;
    }

    state.stepIndex = nextIdx;
    state.stepRemainSec = state.currentPlan.steps[nextIdx].durationSec;
    highlightStep(nextIdx);
    announce(`进入第 ${nextIdx + 1} 步。`);
  }

  function announce(text) {
    // 轻提示：仅更新标题；不发声
    document.title = `${text} · 小息指南`;
  }

  /** ---------- 反馈（3 秒自动收起） ---------- */
  function showFeedbackBox() {
    els.feedbackBox.style.display = 'block';
    els.fbSaved.style.display = 'none';
    els.fbCountdown.textContent = '3';
    state.fbRemain = 3;
    if (state.fbTimer) window.clearInterval(state.fbTimer);
    state.fbTimer = window.setInterval(() => {
      state.fbRemain -= 1;
      els.fbCountdown.textContent = String(Math.max(0, state.fbRemain));
      if (state.fbRemain <= 0) {
        window.clearInterval(state.fbTimer);
        state.fbTimer = null;
        els.feedbackBox.style.display = 'none';
      }
    }, 1000);
  }

  function saveFeedback(value) {
    // Demo：用 localStorage 累计计数
    const key = 'xiaoxi_demo_feedback';
    const raw = localStorage.getItem(key);
    const obj = raw ? safeJsonParse(raw, {}) : {};
    obj[value] = (obj[value] || 0) + 1;
    obj._lastAt = new Date().toISOString();
    localStorage.setItem(key, JSON.stringify(obj));
    els.fbSaved.style.display = 'block';
    // 不阻止倒计时自动收起
  }

  function safeJsonParse(s, fallback) {
    try { return JSON.parse(s); } catch { return fallback; }
  }

  /** ---------- 生成方案 ---------- */
  function generate() {
    const { raw, norm } = normalizeText(els.demandInput.value || '');

    const hasRisk = renderRisk(norm);
    // 即使风险命中，也允许生成“缓冲”方案；但 UI 已提示
    const minutesParsed = parseMinutesFromText(norm);
    if (!state.minutesLocked && minutesParsed.found) {
      setMinutes(minutesParsed.value, { lock: false, regen: false, silent: true });
    }
    // 使用时长：优先 UI（用户可随意调整）；如果没锁定且从输入识别到了，就已同步进 UI
    const minutesUsed = state.pickedMinutes;

    const sceneDetected = detectSceneFromText(norm);
    const sceneLocked = state.pickedScene !== 'any';
    const sceneUsed = sceneLocked ? state.pickedScene : sceneDetected;

    // 用户状态：姿势/地点（用户选择优先；否则从文本推断；最后用默认）
    const postureDetected = inferPostureFromText(norm);
    const placeDetected = inferPlaceFromText(norm);
    const postureUsed = state.postureLocked ? state.posture : (postureDetected || state.posture);
    const placeUsed = state.placeLocked ? state.place : (placeDetected || state.place);

    // 同步 UI（仅在未锁定时）
    if (!state.postureLocked) {
      state.posture = postureUsed;
      setPressed('.chip[data-posture]', (b) => (b.dataset.posture || 'sit') === postureUsed);
    }
    if (!state.placeLocked) {
      state.place = placeUsed;
      setPressed('.chip[data-place]', (b) => (b.dataset.place || 'indoor') === placeUsed);
    }

    const constraintsUsed = constraintsFromContext(norm, sceneUsed, postureUsed, placeUsed);

    const cat = scoreCategory(norm);

    const ctx = { scene: sceneUsed, posture: postureUsed, place: placeUsed, ...constraintsUsed };
    const baseTpl = pickPlan(cat.id, sceneUsed, minutesUsed);
    const resolved = resolvePlanTemplate(baseTpl, ctx);
    const fitted = fitToDuration(resolved, minutesUsed);

    state.lastParsed = {
      raw,
      text: norm,
      minutesUsed,
      minutesDetected: minutesParsed.found ? minutesParsed.value : null,
      minutesLocked: state.minutesLocked,
      sceneUsed,
      sceneDetected,
      sceneLocked,
      constraintsUsed,
      postureUsed,
      placeUsed,
      postureLocked: state.postureLocked,
      placeLocked: state.placeLocked,
      category: cat.id,
      hit: findFirstHitKeyword(norm, cat.id),
      risk: hasRisk,
    };

    renderPlan(state.lastParsed, fitted);
  }

  function findFirstHitKeyword(text, catId) {
    const list = KEYWORDS[catId];
    if (!list) return null;
    return list.find((kw) => text.includes(kw)) || null;
  }

  /** ---------- 交互绑定 ---------- */
  function bindChips() {
    // 场景
    $$('.chip[data-scene]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.pickedScene = btn.dataset.scene || 'any';
        setPressed('.chip[data-scene]', (b) => (b.dataset.scene || 'any') === state.pickedScene);
        // 场景变了，若已有方案则重算（时长保持当前 UI）
        if (els.planBox && els.planBox.style.display === 'block') debouncedGenerate();
      });
    });
    setPressed('.chip[data-scene]', (b) => (b.dataset.scene || 'any') === state.pickedScene);

    // 姿势（单选）：一旦用户点过，就锁定为手动
    $$('.chip[data-posture]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.posture = btn.dataset.posture || 'sit';
        state.postureLocked = true;
        setPressed('.chip[data-posture]', (b) => (b.dataset.posture || 'sit') === state.posture);
        if (els.planBox && els.planBox.style.display === 'block') debouncedGenerate();
      });
    });
    setPressed('.chip[data-posture]', (b) => (b.dataset.posture || 'sit') === state.posture);

    // 地点（单选）：一旦用户点过，就锁定为手动
    $$('.chip[data-place]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.place = btn.dataset.place || 'indoor';
        state.placeLocked = true;
        setPressed('.chip[data-place]', (b) => (b.dataset.place || 'indoor') === state.place);
        if (els.planBox && els.planBox.style.display === 'block') debouncedGenerate();
      });
    });
    setPressed('.chip[data-place]', (b) => (b.dataset.place || 'indoor') === state.place);

    // 时长
    $$('.chip[data-minutes]').forEach((btn) => {
      btn.addEventListener('click', () => {
        setMinutes(btn.dataset.minutes || '5', { lock: true, regen: true });
      });
    });
    setMinutes(state.pickedMinutes, { lock: false, regen: false, silent: true });

    // 自定义时长控件
    if (els.minutesNumber) {
      els.minutesNumber.addEventListener('input', () => {
        setMinutes(els.minutesNumber.value, { lock: true, regen: true });
      });
    }
    if (els.minutesRange) {
      els.minutesRange.addEventListener('input', () => {
        setMinutes(els.minutesRange.value, { lock: true, regen: true });
      });
    }
  }

  function bindActions() {
    els.btnGenerate.addEventListener('click', () => generate());
    els.btnExample.addEventListener('click', () => {
      const seed = (els.demandInput.value || '').trim();
      const built = buildExampleFromSeed(seed);
      if (built.text) els.demandInput.value = built.text;

      // 同步 UI（不锁定，方便用户再改）
      state.minutesLocked = false;
      state.postureLocked = false;
      state.placeLocked = false;

      if (built.scene) {
        state.pickedScene = built.scene;
        setPressed('.chip[data-scene]', (b) => (b.dataset.scene || 'any') === state.pickedScene);
      }
      if (built.posture) {
        state.posture = built.posture;
        setPressed('.chip[data-posture]', (b) => (b.dataset.posture || 'sit') === state.posture);
      }
      if (built.place) {
        state.place = built.place;
        setPressed('.chip[data-place]', (b) => (b.dataset.place || 'indoor') === state.place);
      }
      if (typeof built.minutes === 'number') {
        setMinutes(built.minutes, { lock: false, regen: false, silent: true });
      }

      generate();
    });
    els.btnReset.addEventListener('click', () => {
      els.demandInput.value = '';
      renderRisk('');
      els.planBox.style.display = 'none';
      state.minutesLocked = false;
      state.postureLocked = false;
      state.placeLocked = false;
      state.posture = 'sit';
      state.place = 'indoor';
      setPressed('.chip[data-posture]', (b) => (b.dataset.posture || 'sit') === state.posture);
      setPressed('.chip[data-place]', (b) => (b.dataset.place || 'indoor') === state.place);
      stopTimer(false);
      state.relaxMode = { action: 'auto', music: 'auto', text: 'auto' };
      state.relaxFilter = { action: 'auto', music: 'auto', text: 'auto' };
      state.relaxChoiceIndex = { action: 0, music: 0, text: 0 };
      renderRelaxSection('reset');
    });

    // 计时按钮
    els.btnStart.addEventListener('click', () => startTimer());
    els.btnPause.addEventListener('click', () => pauseResume());
    els.btnNext.addEventListener('click', () => nextStep());
    els.btnStop.addEventListener('click', () => {
      announce('已结束。');
      stopTimer(true);
    });

    // 反馈按钮
    $$('#feedbackBox [data-fb]').forEach((btn) => {
      btn.addEventListener('click', () => {
        saveFeedback(btn.dataset.fb || 'ok');
      });
    });

    // 第四块：放松小技巧
    document.addEventListener('click', (e) => {
      const target = e.target;
      if (!target || !(target instanceof HTMLElement)) return;

      const modeBtn = target.closest('[data-mode][data-kind]');
      if (modeBtn) {
        const kind = modeBtn.dataset.kind;
        if (!kind) return;
        state.relaxMode[kind] = 'auto';
        state.relaxFilter[kind] = 'auto';
        state.relaxChoiceIndex[kind] = 0;
        renderRelaxSection(state.lastParsed?.category || 'reset');
        return;
      }

      const randomBtn = target.closest('[data-random]');
      if (randomBtn) {
        const kind = randomBtn.dataset.random;
        if (!kind) return;
        randomizeRelax(kind, state.lastParsed?.category || 'reset');
        return;
      }

      const filterBtn = target.closest('[data-relax-kind][data-relax-filter]');
      if (filterBtn) {
        const kind = filterBtn.dataset.relaxKind;
        const filter = filterBtn.dataset.relaxFilter;
        if (!kind || !filter) return;
        if (filter === 'auto') {
          state.relaxMode[kind] = 'auto';
          state.relaxFilter[kind] = 'auto';
        } else {
          state.relaxMode[kind] = 'manual';
          state.relaxFilter[kind] = filter;
        }
        state.relaxChoiceIndex[kind] = 0;
        renderRelaxSection(state.lastParsed?.category || 'reset');
      }
    });
  }

  function pickDefaultMinutesByCategory(catId) {
    if (catId === 'nervous') return 3;
    if (catId === 'sleep') return 7;
    return 5;
  }

  function buildExampleFromSeed(seed) {
    const { norm } = normalizeText(seed || '');

    // 如果用户没写任何内容：随机给一条完整例子
    if (!norm) {
      const pool = [
        { text: '看电脑眼睛好痛，在工位想休息4分钟', scene: 'desk', posture: 'sit', place: 'indoor', minutes: 4 },
        { text: '肩颈僵硬，在图书馆坐着想休息5分钟', scene: 'library', posture: 'sit', place: 'indoor', minutes: 5 },
        { text: '刷题刷到烦，注意力散了，在图书馆想休息5分钟', scene: 'library', posture: 'sit', place: 'indoor', minutes: 5 },
        { text: '10分钟后要汇报，有点紧张，会前坐着想缓一下3分钟', scene: 'meeting', posture: 'sit', place: 'indoor', minutes: 3 },
        { text: '有点心烦低落，想安静缓一下，在工位坐着休息5分钟', scene: 'desk', posture: 'sit', place: 'indoor', minutes: 5 },
        { text: '睡前脑子停不下来，躺着想放松7分钟', scene: 'bed', posture: 'lie', place: 'indoor', minutes: 7 },
      ];
      return pool[Math.floor(Math.random() * pool.length)];
    }

    const minutesParsed = parseMinutesFromText(norm);
    const minutes = minutesParsed.found ? minutesParsed.value : null;

    const scene = detectSceneFromText(norm);
    const cat = scoreCategory(norm);
    const posture = inferPostureFromText(norm) || 'sit';
    const place = inferPlaceFromText(norm) || 'indoor';

    const usedMinutes = minutes ?? pickDefaultMinutesByCategory(cat.id);

    // 若输入很短，只是症状：补全“在xxx + 姿势 + 时长”
    // 否则保留原句并在后面补一句（避免覆盖用户表达）
    const short = norm.length <= 12;

    const sceneText = (scene === 'library') ? '在图书馆' :
      (scene === 'meeting') ? '会前' :
        (scene === 'exam') ? '考前' :
          (scene === 'bed') ? '睡前' :
            (scene === 'desk') ? '在工位' : '现在';

    const postureText = (posture === 'lie') ? '躺着' : (posture === 'stand' ? '站着' : '坐着');
    const placeText = (place === 'outdoor') ? '在室外' : (place === 'any' ? '' : '在室内');

    const base = (cat.id === 'eye')
      ? `${short ? '看电脑眼睛好痛' : seed}`
      : (cat.id === 'neck')
        ? `${short ? '肩颈僵硬' : seed}`
        : (cat.id === 'focus')
          ? `${short ? '注意力有点散' : seed}`
          : (cat.id === 'nervous')
            ? `${short ? '有点紧张' : seed}`
            : (cat.id === 'mood')
              ? `${short ? '有点心烦低落' : seed}`
              : (cat.id === 'sleep')
                ? `${short ? '睡前脑子停不下来' : seed}`
                : `${short ? seed : seed}`;

    const addon = `${sceneText}${placeText ? '，' + placeText : ''}${postureText ? '，' + postureText : ''}想休息${usedMinutes}分钟`;
    const text = short ? `${base}，${addon}` : `${base}（${addon}）`;

    // sceneUsed：如果没识别到，就用 desk 作为“补全默认”
    const sceneOut = (scene && scene !== 'any') ? scene : 'desk';
    return { text, scene: sceneOut, posture, place, minutes: usedMinutes };
  }

  /** ---------- 初始化 ---------- */
  function init() {
    bindChips();
    bindActions();

    // 动作示意弹窗：点击遮罩/关闭按钮关闭；Esc 关闭
    if (els.iconModal) {
      els.iconModal.addEventListener('click', (e) => {
        const t = e.target;
        if (t && t.dataset && t.dataset.close === '1') closeIconModal();
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && els.iconModal.classList.contains('open')) closeIconModal();
      });
    }

    // Ctrl/⌘ + Enter 生成
    els.demandInput.addEventListener('keydown', (e) => {
      const isEnter = e.key === 'Enter';
      const combo = (e.ctrlKey || e.metaKey) && isEnter;
      if (combo) {
        e.preventDefault();
        generate();
      }
    });

    // 编辑输入框：默认解除“时长锁定”，让输入中的“4分钟/四分钟/4 min”能生效
    els.demandInput.addEventListener('input', () => {
      state.minutesLocked = false;
      state.postureLocked = false;
      state.placeLocked = false;
    });

    // 预置：默认 5 分钟 / 通用
    setPressed('.chip[data-scene]', (b) => (b.dataset.scene || 'any') === 'any');
    setPressed('.chip[data-minutes]', (b) => parseInt(b.dataset.minutes || '0', 10) === 5);
    setMinutes(5, { lock: false, regen: false, silent: true });
    renderRelaxSection('reset');
  }

  init();
})();
