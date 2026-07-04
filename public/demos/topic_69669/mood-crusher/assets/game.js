/* ============================================================
   坏情绪粉碎机 v2.0 · 主逻辑
   ============================================================ */

(function () {
  'use strict';

  // ---------- DOM ----------
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);
  const canvas = $('#game');
  const ctx = canvas.getContext('2d');
  const input = $('#worry-input');
  const sendBtn = $('#send-btn');
  const sendArrow = $('#send-arrow');
  const sendLabel = $('#send-label');
  const quickTags = $$('.quick-tag');
  const emptyHint = $('#empty-hint');
  const emptyEmoji = $('#empty-emoji');
  const emptyTitle = $('#empty-title');
  const emptyDesc = $('#empty-desc');
  const toastWrap = $('#toast-wrap');
  const crackLayer = $('#crack-layer');
  const redFlash = $('#red-flash');
  const reportModal = $('#report-modal');
  const reportCard = $('#report-card');
  const helpModal = $('#help-modal');
  const diaryModal = $('#diary-modal');
  const diaryWriteModal = $('#diary-write-modal');
  const diaryDetailModal = $('#diary-detail-modal');
  const modeNormalBtn = $('#mode-normal');
  const modeAngerBtn = $('#mode-anger');
  const brandTitle = $('#brand-title');
  const brandSub = $('#brand-sub');
  const btnReportText = $('#btn-report-text');
  const reportComfort = $('#rpt-comfort');
  const reportLetterText = $('#rpt-letter-text');
  const weatherModal = $('#weather-modal');
  const weatherContent = $('#weather-content');
  const weatherSummary = $('#weather-summary');
  const btnWeather = $('#btn-weather');

  // ---------- Tokens ----------
  const PALETTE = ['#FF6B9D', '#95E1D3', '#FFD93D', '#C4B5FD', '#93C5FD', '#FB923C', '#FCA5A5', '#86EFAC'];
  const CLOUD_COLORS = [
    { body: '#FFE4EC', shadow: '#FFC2D4', accent: '#FF6B9D' },
    { body: '#E0F8F2', shadow: '#A8E6D3', accent: '#10B981' },
    { body: '#FFF4D2', shadow: '#FFE08A', accent: '#F59E0B' },
    { body: '#EDE4FE', shadow: '#D4C5FD', accent: '#8B5CF6' },
    { body: '#E0F0FE', shadow: '#B5D5FE', accent: '#3B82F6' },
    { body: '#FFE4D2', shadow: '#FFC9A0', accent: '#F97316' },
  ];
  // 暴躁模式专属颜色
  const ANGER_COLORS = [
    { body: '#FF3030', shadow: '#8B0000', accent: '#FFFF00' },
    { body: '#FF6B35', shadow: '#7F0000', accent: '#FFE066' },
    { body: '#DC143C', shadow: '#4A0000', accent: '#FFA500' },
  ];

  // ---------- 文案 ----------
  const QUOTES = {
    heal: [
      '会好的，慢慢来 🍃',
      '你已经做得很好了 ✨',
      '没关系，允许自己丧一会儿',
      '今天的你已经尽力了',
      '抱抱你，云朵会守护你',
      '雨下完之后总会有彩虹',
      '情绪只是过客，你是归人',
      '给心放个假吧',
      '先把自己哄开心了再说',
      '你值得被温柔以待',
    ],
    roast: [
      '它不值得占用你的内存 🗑️',
      '此烦恼的有效期：3秒',
      '呼～ 吹走啦，下一个',
      '小情绪已签收：拒收',
      '烦恼被你点开了"不再提醒"',
      '它飘走了，头也不回',
      '这团乌云被你打包成快递退回了',
      '情绪看到你，吓跑了',
    ],
    self: [
      'emo 是门玄学，咱掌握得不错',
      '打工人的 emo 都是限量版',
      '今日份的"丧"配额已用完',
      '恭喜你又击败了一个坏情绪',
      '云朵说：你笑起来真好看',
      '你把烦恼捏成星星啦',
      '这也算一项技能吧',
    ],
    hype: [
      '下一个烦恼也没那么厉害 💪',
      '留着力气好好生活',
      '云朵替你挡过了一劫',
      '你的韧性，比云朵还软',
      '甩开它，你自由了',
      '今天的你比昨天更轻了一点',
    ],
    work: [
      '老板没看见，KPI 也没看见，emo 也没看见',
      '加班费没给够，但你给情绪空间了',
      '打工人，打工魂，情绪管理最动人',
      '周五的云朵比周一轻一些',
      '工资可能迟到，放空永不缺席',
      '你是你自己的 CEO，emo 是临时工',
    ],
    anger: [
      '🔥 炸了炸了！',
      '💥 轰！！！',
      '⚡ 灰飞烟灭！',
      '💢 给我消失！',
      '🌋 怒气值 -999',
      '💀 已被砸成粉末',
      '🪓 一刀两断！',
      '🧨 砰！',
      '👊 暴击！',
      '⚔️ 斩！',
    ],
    angerRoast: [
      '这坨烂情绪：扑街',
      '它被你打成了粒子态',
      '撒气完毕，再来一个？',
      '老板看见都瑟瑟发抖',
      '生活：我要弄死你 你：先弄死这朵云',
      '气到云朵都要搬家了',
      '碎屏？没问题，再来！',
      '你比云朵硬多了',
    ],
  };

  // 暴躁模式自动填充的烦恼池（按场景分类）
  const ANGER_POOL = {
    work: [
      '加班到死', 'KPI 压垮', '改需求！', '老板画饼', '会议马拉松',
      'PPT 第八版', '背黑锅', '甲方是爷', '复盘会复盘', '周报写了 3 小时',
      '工资没涨', '同事内卷', '被抢功', '返工返工', 'deadline 是命',
    ],
    life: [
      '早起打卡', '堵车迟到', '外卖超时', '快递丢了', '网又崩了',
      '电费暴涨', '房租又涨', '空调坏了', '被门夹了', '蚊子咬了 8 个包',
      '闹钟没响', '忘带钥匙', '手机没电', '健身卡过期', '牙膏挤歪了',
    ],
    emotion: [
      'emo 了', '想哭', '破防了', '委屈', '焦虑爆表',
      '睡不着', '想家', '一个人好累', '被误解', '心好累',
      '生气！', '气炸了', '烦死了', '滚！', '去他的',
    ],
    random: [
      '我就是不开心', '今天很不爽', '想骂人', '谁来救救我',
      '够了够了', '我真的会谢', '破防破防破防', '毁灭吧赶紧的',
    ],
  };

  function getRandomAnger() {
    // 混合多个池
    const pools = Object.values(ANGER_POOL);
    const pool = pools[Math.floor(Math.random() * pools.length)];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // 治愈模式温柔云朵文案池
  const GENTLE_CLOUDS = {
    daily: [
      '今天也辛苦了', '好好休息吧', '慢慢来不着急', '你很棒呀',
      '记得喝水', '多爱自己一点', '给自己一个拥抱', '累了就歇会儿',
      '明天会更好', '一切都会过去的', '阳光总在风雨后', '你不是一个人',
    ],
    encouragement: [
      '你已经很努力了', '相信自己可以的', '每一步都算数', '坚持就是胜利',
      '小步快跑也很好', '你的努力终将绽放', '不要小看自己', '你比想象中更强大',
    ],
    gentle: [
      '云朵轻轻飘过', '风会带走烦恼', '深呼吸一下', '让心静下来',
      '细雨过后是彩虹', '夜色温柔如水', '星星在守护你', '月亮伴你入眠',
    ],
    gratitude: [
      '感谢今天的自己', '感恩每一个小确幸', '珍惜当下的美好', '生活有小确幸',
      '今天也有好好生活', '记录每一个美好瞬间', '发现生活中的小美好',
    ],
  };

  function getRandomGentleCloud() {
    const pools = Object.values(GENTLE_CLOUDS);
    const pool = pools[Math.floor(Math.random() * pools.length)];
    return pool[Math.floor(Math.random() * pool.length)];
  }



  // ========== 负面情绪云朵生成 ==========
  // 情绪云朵配置
  const EMOTION_CLOUD_CONFIG = {
    negative: {
      color: { body: '#E0E8F0', shadow: '#B0C4DE', accent: '#6B8E9F' },
      text: '有点难过呢...',
    },
    stress: {
      color: { body: '#E8F0F8', shadow: '#B8D4E8', accent: '#5B8DB8' },
      text: '今天有压力啊...',
    },
    anger: {
      color: { body: '#FFE8E0', shadow: '#FFCAB8', accent: '#E87850' },
      text: '有什么让你生气了吗？',
    },
    sad: {
      color: { body: '#E8E8F0', shadow: '#C8C8E0', accent: '#8080A0' },
      text: '抱抱你...',
    },
    lonely: {
      color: { body: '#F0E8F8', shadow: '#E0C8F0', accent: '#9080B0' },
      text: '你不是一个人哦',
    },
  };

  // 智能云朵追踪
  let emotionCloudCount = 0;
  const MAX_EMOTION_CLOUDS = 5;

  // 生成情绪云朵
  function generateEmotionCloud(type = 'negative') {
    const config = EMOTION_CLOUD_CONFIG[type] || EMOTION_CLOUD_CONFIG.negative;
    const usedTexts = new Set(state.clouds.map(c => c.text));

    // 移除最早的智能云朵（如果超过限制）
    if (emotionCloudCount >= MAX_EMOTION_CLOUDS) {
      // 找到最早的智能云朵并移除
      for (let i = 0; i < state.clouds.length; i++) {
        if (state.clouds[i].isEmotionCloud) {
          state.clouds.splice(i, 1);
          emotionCloudCount--;
          break;
        }
      }
    }

    // 避免重复文案
    let text = config.text;
    if (usedTexts.has(text)) {
      text = text + ' 🌙';
    }

    // 生成位置
    const margin = 70;
    const cx = margin + Math.random() * Math.max(80, W - margin * 2);
    const cy = -60; // 从屏幕上方飘入

    const cloud = new Cloud(text, cx, cy);
    cloud.color = config.color;
    cloud.isEmotionCloud = true;
    state.clouds.push(cloud);
    emotionCloudCount++;

    emptyHint.classList.add('hide');
  }

  // ========== 心情晴雨表 ==========
  // 获取心情天气数据（过去7天）
  function getMoodWeatherData() {
    const result = [];
    const diaries = window.MCStore.getDiaries() || [];
    const burstData = window.MCStore.getTodayBurst();

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = `${date.getMonth() + 1}月${date.getDate()}日`;
      const dayLabel = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()];
      const isToday = i === 0;

      // 查找当天的日记
      const dayDiaries = diaries.filter(d => {
        const dDate = new Date(d.ts);
        return dDate.toDateString() === date.toDateString();
      });

      // 查找当天的发泄记录
      const hasAnger = false; // 简化版

      // 计算天气
      let weather = '⛅';
      let desc = '平平淡淡的一天';

      if (dayDiaries.length > 0) {
        // 有日记，分析情绪
        const emotions = dayDiaries[0].emotions || {};
        const joyScore = emotions.joy || 0;
        const negScore = (emotions.stress || 0) + (emotions.anger || 0) + (emotions.anxiety || 0) + (emotions.sadness || 0);

        if (joyScore > negScore && joyScore > 30) {
          weather = '☀️';
          desc = '美好的一天 ✨';
        } else if (negScore > 50) {
          weather = '🌧️';
          desc = '有点低落...';
        } else {
          weather = '⛅';
          desc = '普通的一天';
        }
      } else if (i === 0) {
        weather = '🌤️';
        desc = '今天刚开始...';
      }

      result.push({
        day: dayLabel,
        date: dateStr,
        weather,
        desc,
        isToday,
        diaries: dayDiaries.length,
      });
    }

    return result;
  }

  // 渲染晴雨表
  function renderWeatherChart() {
    const data = getMoodWeatherData();

    // 渲染7天日历
    let weekHTML = '<div class="weather-week">';
    data.forEach(day => {
      weekHTML += `
        <div class="weather-day ${day.isToday ? 'today' : ''}">
          <span class="day-label">${day.day}</span>
          <span class="day-icon">${day.weather}</span>
          <span class="day-date">${day.date}</span>
        </div>
      `;
    });
    weekHTML += '</div>';
    weatherContent.innerHTML = weekHTML;

    // 点击事件
    weatherContent.querySelectorAll('.weather-day').forEach((el, idx) => {
      el.addEventListener('click', () => {
        const dayData = data[idx];
        weatherContent.innerHTML = `
          <div class="weather-detail">
            <div class="detail-icon">${dayData.weather}</div>
            <div class="detail-text">
              <strong>${dayData.date} ${dayData.day}</strong><br><br>
              ${dayData.desc}<br><br>
              ${dayData.diaries > 0 ? `写了 ${dayData.diaries} 篇日记` : '没有写日记'}
            </div>
          </div>
        `;
      });
    });

    // 渲染周总结
    const sunnyDays = data.filter(d => d.weather === '☀️').length;
    const cloudyDays = data.filter(d => d.weather === '⛅').length;
    const rainyDays = data.filter(d => d.weather === '🌧️').length;

    weatherSummary.innerHTML = `
      <p>
        这一周，你<br>
        ${sunnyDays > 0 ? `☀️ 有 <strong>${sunnyDays}</strong> 天心情很好，` : ''}
        ${cloudyDays > 0 ? `⛅ 有 <strong>${cloudyDays}</strong> 天平平淡淡，` : ''}
        ${rainyDays > 0 ? `🌧️ 有 <strong>${rainyDays}</strong> 天有点低落` : ''}
        <br><br>
        每一段情绪都值得被看见 💜
      </p>
    `;

    weatherModal.classList.add('show');
  }

  // 生成今日云朵
  function generateTodayClouds(count = 5) {
    const usedTexts = new Set(state.clouds.map(c => c.text));
    let added = 0;
    let tries = 0;
    while (added < count && tries < count * 4) {
      tries++;
      const text = getRandomGentleCloud();
      if (usedTexts.has(text)) continue;
      usedTexts.add(text);
      const margin = 70;
      const cx = margin + Math.random() * Math.max(80, W - margin * 2);
      const cy = 70 + Math.random() * Math.max(60, H * 0.55);
      const cloud = new Cloud(text, cx, H + 60);
      state.clouds.push(cloud);
      added++;
    }
    emptyHint.classList.add('hide');
    showToast(`☁️ 生成了 ${added} 朵温柔云朵`, 'accent');
  }

  // 温柔安慰文库（按情绪阶段分层）
  const COMFORT_LINES = {
    // 通用安慰
    general: [
      '你已经把那些不开心，<strong>全部炸得稀烂</strong>了。',
      '屏幕上的裂纹是你勇敢的痕迹，<strong>每一条都算数</strong>。',
      '没关系的。生气的时候，就<strong>允许自己生气</strong>。',
      '今天的你，<strong>很用力地活过</strong>了。',
      '把坏情绪都交出来，<strong>你已经做得很好了</strong>。',
      '砸碎它们之后，<strong>你的心就能空出位置</strong>。',
      '没有人规定你必须一直温柔，<strong>偶尔爆一下也没关系</strong>。',
      '<strong>你值得被这个世界温柔以待</strong>，哪怕它现在有点糟糕。',
      '那些让你抓狂的事，<strong>不会永远在那里</strong>。',
      '承认自己不好过，<strong>也是一种强大</strong>。',
    ],
    // 释放感
    release: [
      '看到没，<strong>再难的事，扛过去了就那么回事</strong>。',
      '刚才的每一拳，<strong>都替你的委屈出了气</strong>。',
      '怒气被你打成烟花，<strong>现在可以轻轻呼一口气了</strong>。',
      '今天的你，<strong>手撕了 100 个坏情绪</strong>。',
      '<strong>云朵被你戳爆，裂纹被你撕开</strong>，还有什么是搞不定的？',
      '你不是没有脾气，<strong>你只是把它们都用在了对的地方</strong>。',
    ],
    // 温柔劝解
    soothe: [
      '现在请你把肩膀放下来，<strong>深深呼一口气</strong>。',
      '把手机放在胸口，<strong>感受自己还在跳动的心</strong>。',
      '窗外有一阵风经过，<strong>它带走了刚才的碎屑</strong>。',
      '喝口水，<strong>让身体记得活着的感觉</strong>。',
      '今天的烂事，<strong>交给今天</strong>。明天再说。',
      '你最需要的，<strong>不是再努力一点，是再休息一点</strong>。',
    ],
    // 鼓励
    encourage: [
      '如果累了，<strong>就停下来</strong>。没人敢催你。',
      '你比自己以为的，<strong>强了不止一点点</strong>。',
      '不管今天发生了什么，<strong>你依然是独一无二的那个</strong>。',
      '这个世界很烂，<strong>但你不必跟着烂下去</strong>。',
      '能发泄出来，<strong>本身就是一种能力</strong>。',
      '<strong>你不是一个人在战斗</strong>，有这么多云朵陪着你。',
    ],
  };

  // 致你的一封信（随机一段）
  const LETTERS = [
    '你不是没有情绪，你只是习惯把柔软藏在最里面。今晚，请允许自己柔软一下。',
    '生活的难，从来不是因为你不够好，而是它本来就不容易。别再苛责自己了。',
    '你已经撑过那么多难熬的时刻了，这一次也一定会过去。我信你。',
    '允许自己停下来。允许自己不想努力。允许自己今天什么都不做。',
    '你不是一个人在夜里崩溃过，每个人都有过。你只是比别人更懂得去消化它。',
    '世界有时候会让人喘不过气，但请记得，你始终有选择：选择对自己好一点点。',
    '别再问"我是不是不够好"了。你已经很好了。是这个世界有时候太难。',
    '把那些在意你的人放心上，把不在意你的人，从今天开始，慢慢放下。',
    '今天的你很努力。虽然没人看见，但我看见了。',
    '无论多晚，都请你温柔对待那个还在熬夜的自己。',
  ];

  // ---------- 新增：叙事化的报告标题和描述 ----------
  const NARRATIVE_TITLES = [
    '今天辛苦了',
    '被你戳爆的那些事',
    '给今天的你',
    '这一天，你值得被好好对待',
    '你已经很努力了',
    '今天的情绪小账单',
  ];

  const ANGER_TITLES = [
    '你已经炸完了，辛苦了',
    '爆炸之后，该松口气了',
    '让它炸，你值得安静一会儿',
    '愤怒也是有力量的',
  ];

  // 小回信内容池（共情/肯定/追问）
  const ECHO_POOLS = {
    empathy: [
      '能写下来，已经很勇敢了。',
      '听起来今天真的有点累。能走到这里，你已经很棒了。',
      '这段话里有真实的你。被看见就是一种治愈。',
      '辛苦你了。把心里的话说出来，是一件了不起的事。',
      '这种感觉真的很不容易。感谢你自己，愿意写下来。',
    ],
    affirm: [
      '你写的这些，我都替你记下来了。以后想起来，可以回头看看。',
      '记下这一刻的你，是一件温柔的事。',
      '你不是在写日记，你是在慢慢理解自己。',
      '这句话值得被看见：是你自己，把它写了下来。',
      '你写的每一个字，都是在告诉自己"我在"。',
    ],
    ask: [
      '如果用一种颜色来形容今天，会是什么？',
      '如果给此刻的心情画一个表情，会是什么？',
      '如果让你对过去的自己说一句话，会说什么？',
      '如果明天可以有一件小事发生，你希望是什么？',
      '如果把今天的感觉做成一个云朵，它会是什么颜色？',
    ],
    gentle: [
      '谢谢你写下来。愿你今晚可以轻轻入睡。',
      '已经这样了，就别再苛责自己了。对自己温柔一点。',
      '有些话，说出来就已经完成了大半的治愈。',
      '你已经做得足够多了。现在，让自己休息。',
      '能和自己的情绪这样对话，你已经很成熟了。',
    ],
  };

  // ---------- 状态 ----------
  const state = {
    mode: 'normal',   // normal | anger
    clouds: [],
    particles: [],
    floaters: [],
    bombs: [],        // 暴躁模式震屏用
    count: window.MCStore.getCount(),
    today: window.MCStore.getToday(),
    combo: 0,
    comboTimer: null,
    comboShownAt: 0,  // 最近一次戳中时刻（任务2）
    comboFading: false,
    encourageTimer: null, // 暂停鼓励（任务5）
    analysisCounter: 0,   // AI 分析克制化（任务6）
    startedAt: Date.now(),
    currentMood: '🌤️',
    sessionStart: Date.now(),
  };

  // ---------- Audio ----------
  let audioCtx = null;
  function getAudio() {
    if (!audioCtx) {
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { /* noop */ }
    }
    return audioCtx;
  }
  function playPop(combo) {
    const ac = getAudio(); if (!ac) return;
    const t = ac.currentTime;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain); gain.connect(ac.destination);
    const base = 520 + Math.min(combo || 1, 10) * 30;
    osc.frequency.setValueAtTime(base, t);
    osc.frequency.exponentialRampToValueAtTime(base * 1.4, t + 0.06);
    osc.frequency.exponentialRampToValueAtTime(base * 0.6, t + 0.18);
    osc.type = 'triangle';
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.18, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
    osc.start(t); osc.stop(t + 0.3);
  }
  function playWhoosh() {
    const ac = getAudio(); if (!ac) return;
    const t = ac.currentTime;
    const bufferSize = ac.sampleRate * 0.3;
    const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    const noise = ac.createBufferSource();
    noise.buffer = buffer;
    const filter = ac.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.exponentialRampToValueAtTime(200, t + 0.3);
    const gain = ac.createGain();
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    noise.connect(filter); filter.connect(gain); gain.connect(ac.destination);
    noise.start(t); noise.stop(t + 0.3);
  }
  function playBoom() {
    // 暴躁模式爆裂音
    const ac = getAudio(); if (!ac) return;
    const t = ac.currentTime;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain); gain.connect(ac.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.4);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.3, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
    osc.start(t); osc.stop(t + 0.4);
    // 噪音
    const bufferSize = ac.sampleRate * 0.3;
    const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    const noise = ac.createBufferSource();
    noise.buffer = buffer;
    const ng = ac.createGain();
    ng.gain.setValueAtTime(0.15, t);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    noise.connect(ng); ng.connect(ac.destination);
    noise.start(t); noise.stop(t + 0.3);
  }
  function playAngerLoop() {
    // 暴躁模式持续低音
    if (state.mode !== 'anger') return;
    const ac = getAudio(); if (!ac) return;
    const t = ac.currentTime;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain); gain.connect(ac.destination);
    osc.type = 'sine';
    osc.frequency.value = 60;
    gain.gain.setValueAtTime(0.05, t);
    osc.start(t);
    setTimeout(() => { gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.3); osc.stop(ac.currentTime + 0.35); }, 1500);
  }

  // ---------- Canvas ----------
  let DPR = window.devicePixelRatio || 1;
  let W = 0, H = 0;
  function resizeCanvas() {
    DPR = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    W = rect.width; H = rect.height;
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // ---------- Floaters ----------
  // 动态 spawn 间隔（任务7）：普通 600ms，暴躁 300ms，暴躁 + combo≥10 时降到 150ms
  let floaterInterval = null;
  function getFloaterInterval() {
    if (state.mode !== 'anger') return 600;
    if (state.combo >= 10) return 150;
    return 300;
  }
  function refreshFloaterInterval() {
    if (floaterInterval) clearInterval(floaterInterval);
    floaterInterval = setInterval(spawnFloater, getFloaterInterval());
  }
  function spawnFloater() {
    const emojis = ['✦', '✧', '◦', '○', '·', '◌', '✿', '❀'];
    state.floaters.push({
      x: Math.random() * W,
      y: H + 20,
      vy: -(0.2 + Math.random() * 0.3),
      vx: (Math.random() - 0.5) * 0.2,
      size: 8 + Math.random() * 14,
      alpha: 0.12 + Math.random() * 0.22,
      text: emojis[Math.floor(Math.random() * emojis.length)],
      color: state.mode === 'anger' ? '#FFD93D' : PALETTE[Math.floor(Math.random() * PALETTE.length)],
      life: 1,
    });
  }
  refreshFloaterInterval();
  for (let i = 0; i < 8; i++) setTimeout(spawnFloater, i * 100);

  // ---------- Weather System (心情天气系统) ----------
  let weatherState = 'cloudy'; // sunny, cloudy, rainy, night
  function updateWeather(combo) {
    const sun = $('#weather-sun');
    const rainbow = $('#weather-rainbow');
    const glow = $('#weather-glow');
    const stars = $('#weather-stars');
    const clouds = $('#weather-clouds');
    const raindrops = $('#weather-raindrops');
    
    // 根据 combo 决定天气状态
    let targetWeather = 'cloudy';
    if (combo >= 20) targetWeather = 'sunny-rainbow';
    else if (combo >= 10) targetWeather = 'sunny';
    else if (combo >= 5) targetWeather = 'partly-cloudy';
    else if (combo <= 0) targetWeather = 'cloudy';
    
    // 更新天气元素
    if (sun) {
      sun.classList.toggle('show', targetWeather === 'sunny' || targetWeather === 'sunny-rainbow');
      sun.classList.toggle('hidden', targetWeather !== 'sunny' && targetWeather !== 'sunny-rainbow');
    }
    if (rainbow) {
      rainbow.classList.toggle('show', targetWeather === 'sunny-rainbow');
    }
    if (glow) {
      glow.classList.toggle('show', targetWeather === 'sunny' || targetWeather === 'sunny-rainbow');
    }
    if (stars) {
      stars.classList.toggle('show', weatherState === 'night');
    }
    
    // 更新背景亮度
    const stage = document.querySelector('.stage');
    if (stage && !document.body.classList.contains('anger-mode')) {
      const brightness = Math.min(1, 0.7 + combo * 0.015);
      stage.style.background = `rgba(255, 255, 255, ${brightness * 0.32})`;
    }
    
    weatherState = targetWeather;
  }
  
  // 初始化天气元素
  function initWeather() {
    // 创建星星
    const starsContainer = $('#weather-stars');
    if (starsContainer) {
      for (let i = 0; i < 20; i++) {
        const star = document.createElement('div');
        star.className = 'weather-star';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 60 + '%';
        star.style.animationDelay = Math.random() * 2 + 's';
        star.style.width = (3 + Math.random() * 3) + 'px';
        star.style.height = star.style.width;
        starsContainer.appendChild(star);
      }
    }
    
    // 创建雨滴（仅在特定状态显示）
    const rainContainer = $('#weather-raindrops');
    if (rainContainer) {
      for (let i = 0; i < 15; i++) {
        const rain = document.createElement('div');
        rain.className = 'weather-rain';
        rain.style.left = Math.random() * 100 + '%';
        rain.style.animationDelay = Math.random() * 1 + 's';
        rain.style.animationDuration = (0.8 + Math.random() * 0.4) + 's';
        rainContainer.appendChild(rain);
      }
    }
    
    // 创建装饰云朵
    const cloudContainer = $('#weather-clouds');
    if (cloudContainer) {
      for (let i = 0; i < 3; i++) {
        const cloud = document.createElement('div');
        cloud.className = 'weather-cloud';
        cloud.innerHTML = '☁️';
        cloud.style.fontSize = (40 + Math.random() * 30) + 'px';
        cloud.style.left = Math.random() * 100 + '%';
        cloud.style.top = (10 + Math.random() * 20) + '%';
        cloud.style.opacity = 0.3 + Math.random() * 0.2;
        cloudContainer.appendChild(cloud);
      }
    }
  }

  // ---------- Badge System (成就徽章系统) ----------
  const BADGES = [
    { id: 'first_pop', icon: '🌱', name: '初次释放', desc: '戳破第一个云朵', check: (s) => s.count >= 1 },
    { id: 'combo_10', icon: '🔥', name: '十连击', desc: '连续戳破10个', check: (s) => s.combo >= 10 },
    { id: 'combo_20', icon: '💥', name: '二十连击', desc: '连续戳破20个', check: (s) => s.combo >= 20 },
    { id: 'day_7', icon: '🌟', name: '坚持一周', desc: '连续使用7天', check: (s) => s.streak >= 7 },
    { id: 'total_100', icon: '🏆', name: '百次释放', desc: '累计发泄100次', check: (s) => s.count >= 100 },
    { id: 'diary_10', icon: '📖', name: '十篇日记', desc: '写了10篇日记', check: (s) => (window.MCStore ? window.MCStore.getDiaries().length >= 10 : false) },
    { id: 'anger_mode', icon: '😈', name: '释放野性', desc: '使用暴躁模式', check: (s) => s.usedAnger },
    { id: 'perfect', icon: '✨', name: '完美释放', desc: 'Combo超过50', check: (s) => s.combo >= 50 },
  ];
  
  function getUnlockedBadges() {
    const saved = localStorage.getItem('mc_badges');
    return saved ? JSON.parse(saved) : [];
  }
  
  function saveBadges(badges) {
    localStorage.setItem('mc_badges', JSON.stringify(badges));
  }
  
  function checkAndUnlockBadges() {
    const unlocked = getUnlockedBadges();
    const stats = {
      count: state.count,
      combo: state.combo,
      streak: parseInt(localStorage.getItem('mc_streak') || '0'),
      usedAnger: localStorage.getItem('mc_used_anger') === '1',
    };
    
    BADGES.forEach(badge => {
      if (!unlocked.includes(badge.id) && badge.check(stats)) {
        unlocked.push(badge.id);
        showBadgeUnlock(badge);
      }
    });
    
    saveBadges(unlocked);
    updateBadgeDisplay();
  }
  
  function showBadgeUnlock(badge) {
    const toast = $('#badge-toast');
    const icon = $('#badge-toast-icon');
    const name = $('#badge-toast-name');
    if (toast && icon && name) {
      icon.textContent = badge.icon;
      name.textContent = badge.name;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 3000);
    }
  }
  
  function updateBadgeDisplay() {
    const grid = $('#badges-grid');
    const count = $('#badge-count');
    if (!grid) return;

    const unlocked = getUnlockedBadges();
    grid.innerHTML = BADGES.map(b => `
      <div class="badge-item ${unlocked.includes(b.id) ? 'unlocked' : ''}" title="${b.desc}">
        <span class="badge-tooltip">${b.desc}</span>
        <span class="badge-icon">${b.icon}</span>
        <span class="badge-name">${b.name}</span>
      </div>
    `).join('');

    if (count) count.textContent = `${unlocked.length}/${BADGES.length}`;
  }

  // ---------- Easter Eggs (彩蛋系统) ----------
  const EASTER_EGGS = {
    night: {
      check: () => {
        const h = new Date().getHours();
        return h >= 23 || h < 6;
      },
      messages: [
        '夜深了还在发泄，今晚辛苦了 🌙',
        '月亮都出来了，你也该休息了 💤',
        '深夜的你更需要被好好照顾 🌟',
      ]
    },
    rainbow: {
      check: () => state.combo >= 20,
      messages: [
        '彩虹出现！你的释放力爆棚 🌈',
        '哇！连击20+，太厉害了 ✨',
        '这个Combo，连彩虹都来庆祝了 🎉',
      ]
    },
    milestone: {
      check: () => state.count > 0 && state.count % 50 === 0,
      messages: [
        `你已经释放了 ${state.count} 次坏情绪！太棒了 🎊`,
        `${state.count} 次发泄，你真的很坚强 💪`,
      ]
    },
  };
  
  let lastEasterEggTime = 0;
  function checkEasterEgg() {
    const now = Date.now();
    if (now - lastEasterEggTime < 30000) return; // 至少30秒触发一次
    
    for (const [key, egg] of Object.entries(EASTER_EGGS)) {
      if (egg.check()) {
        const msg = egg.messages[Math.floor(Math.random() * egg.messages.length)];
        showEasterEgg(msg);
        lastEasterEggTime = now;
        break;
      }
    }
  }
  
  function showEasterEgg(content) {
    const egg = $('#easter-egg');
    const contentEl = $('#easter-egg-content');
    if (egg && contentEl) {
      contentEl.textContent = content;
      egg.classList.add('show');
      setTimeout(() => egg.classList.remove('show'), 5000);
    }
  }

  // ---------- Daily Blessing (每日小确幸) ----------
  const DAILY_BLESSINGS = [
    '今天也要好好吃饭哦 🍽️',
    '记得多喝水，身体是本钱 💧',
    '累了就休息，你已经很棒了 🌟',
    '偶尔摆烂也没关系 🌈',
    '今天天气不错，心情也会好起来的 ☀️',
    '你值得被温柔以待 💝',
    '每一个小情绪都值得被看见 🌸',
    '给自己一个微笑吧 😊',
    '今天也要元气满满哦 ✨',
    '偶尔emo一下也没事的 🍃',
  ];
  
  function showDailyBlessing() {
    const today = new Date().toDateString();
    const lastShown = localStorage.getItem('mc_blessing_date');
    if (lastShown === today) return; // 今天已经显示过了
    
    const blessing = DAILY_BLESSINGS[Math.floor(Math.random() * DAILY_BLESSINGS.length)];
    const el = $('#daily-blessing');
    const text = $('#daily-blessing-text');
    if (el && text) {
      text.textContent = blessing;
      el.classList.add('show');
      localStorage.setItem('mc_blessing_date', today);
      setTimeout(() => el.classList.remove('show'), 6000);
    }
  }
  
  // 初始化彩蛋关闭按钮
  function initEasterEggListeners() {
    const closeBtn = $('#easter-egg-close');
    const blessing = $('#daily-blessing');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        $('#easter-egg').classList.remove('show');
      });
    }
    if (blessing) {
      blessing.addEventListener('click', () => {
        blessing.classList.remove('show');
      });
    }
  }

  // ---------- Cloud ----------
  class Cloud {
    constructor(text, x, y) {
      this.text = text || '';
      this.x = x;
      this.y = y;
      this.targetY = y;
      this.vx = (Math.random() - 0.5) * 0.4;
      this.vy = 0;
      this.r = 18;
      this.isAnger = state.mode === 'anger';
      this.color = this.isAnger
        ? ANGER_COLORS[Math.floor(Math.random() * ANGER_COLORS.length)]
        : CLOUD_COLORS[Math.floor(Math.random() * CLOUD_COLORS.length)];
      // 根据 combo 决定表情（combo>3时出现开心表情）
      const baseFace = pickFace(this.text);
      if (!this.isAnger && state.combo > 3) {
        this.face = { eyes: 'happy', mouth: 'smile' };
      } else if (!this.isAnger && state.combo > 1) {
        this.face = baseFace;
      } else {
        this.face = this.isAnger ? { eyes: 'angry', mouth: 'angry' } : baseFace;
      }
      this.life = 1;
      this.wobble = Math.random() * Math.PI * 2;
      this.bornAt = Date.now();
      this.isPressed = false;
      this.pressScale = 0.85;
      // 眨眼动画相关
      this.blinkTimer = Date.now() + Math.random() * 3000 + 2000;
      this.isBlinking = false;
      this.blinkProgress = 0;
      // 暴躁模式抖动
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
    }
    update(dt) {
      this.wobble += dt * 2;
      this.y += (this.targetY - this.y) * 0.02;
      this.x += this.vx + Math.sin(this.wobble) * 0.15;
      this.vy += 0.005;
      this.vx *= 0.99;
      if (this.x < 60) this.x = 60;
      if (this.x > W - 60) this.x = W - 60;
      if (this.y > H - 60) this.y = H - 60;
      
      // 眨眼动画
      if (Date.now() >= this.blinkTimer && !this.isBlinking) {
        this.isBlinking = true;
        this.blinkProgress = 0;
      }
      if (this.isBlinking) {
        this.blinkProgress += dt * 8;
        if (this.blinkProgress >= 1) {
          this.isBlinking = false;
          this.blinkTimer = Date.now() + Math.random() * 4000 + 3000;
        }
      }
      
      // 暴躁模式抖动效果
      if (this.isAnger) {
        const shakeSpeed = 15;
        const shakeIntensity = state.combo > 5 ? 3 : 1.5;
        this.shakeOffsetX = Math.sin(Date.now() * shakeSpeed * 0.01) * shakeIntensity;
        this.shakeOffsetY = Math.cos(Date.now() * shakeSpeed * 0.015) * shakeIntensity;
      } else {
        this.shakeOffsetX = 0;
        this.shakeOffsetY = 0;
      }
    }
    draw() {
      const p = Math.min(1, (Date.now() - this.bornAt) / 380);
      const ease = 1 - Math.pow(1 - p, 3);
      // 增大暴躁模式炸弹基础尺寸，让它更容易点击
      const baseScale = this.isAnger
        ? 0.58 + 0.4 * ease + Math.sin(this.wobble) * 0.02
        : 0.6 + 0.4 * ease + Math.sin(this.wobble) * 0.015;
      const pressEffect = this.isPressed ? this.pressScale : 1;
      const scale = baseScale * pressEffect;
      this.currentScale = baseScale;

      ctx.save();
      // 应用抖动偏移（暴躁模式）
      ctx.translate(this.x + this.shakeOffsetX, this.y + this.shakeOffsetY);
      ctx.scale(scale, scale);

      drawPixelCloud(0, 0, this.color);
      // 绘制脸部，传递眨眼状态
      drawFace(0, -2, this.face, this.color.accent, this.isBlinking ? this.blinkProgress : 0);

      if (this.text) {
        // 暴躁模式：字体更小、文本框更透明更浅，减少视觉遮挡
        if (this.isAnger) {
          ctx.font = '500 10px Outfit, "PingFang SC", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          const textW = ctx.measureText(this.text).width;
          const padX = 6, padY = 3;
          const ty = 22;
          // 半透明浅灰色背景，减少视觉冲击
          ctx.fillStyle = 'rgba(255, 235, 200, 0.85)';
          roundRect(ctx, -textW / 2 - padX, ty, textW + padX * 2, 16, 5);
          ctx.fill();
          ctx.strokeStyle = this.color.accent;
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.fillStyle = '#2D2D44';
          ctx.fillText(this.text, 0, ty + padY);
        } else {
          ctx.font = '500 12px Outfit, "PingFang SC", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          const textW = ctx.measureText(this.text).width;
          const padX = 8, padY = 4;
          const ty = 26;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
          roundRect(ctx, -textW / 2 - padX, ty, textW + padX * 2, 20, 6);
          ctx.fill();
          ctx.strokeStyle = this.color.accent;
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.fillStyle = '#2D2D44';
          ctx.fillText(this.text, 0, ty + padY);
        }
      }

      ctx.restore();
    }
  }

  function pickFace(text) {
    const t = (text || '').toLowerCase();
    if (!t) return { eyes: 'dot', mouth: 'smile' };
    if (/(累|丧|emo|哭|难过|委屈|down)/.test(t)) return { eyes: 'sad', mouth: 'frown' };
    if (/(怒|气|烦|滚|恨|草|fxxk|shit)/.test(t)) return { eyes: 'angry', mouth: 'angry' };
    if (/(焦虑|紧张|怕|慌|deadline|kpi)/.test(t)) return { eyes: 'wide', mouth: 'small' };
    if (/(哈哈|开心|快乐|好|棒|爱|赞|nice|happy)/.test(t)) return { eyes: 'happy', mouth: 'smile' };
    return { eyes: 'dot', mouth: 'flat' };
  }

  function drawPixelCloud(cx, cy, color) {
    const s = 3;
    const shape = [
      '  11111  ',
      ' 1111111 ',
      '111111111',
      '111111111',
    ];
    const w = shape[0].length * s;
    const h = shape.length * s;
    const ox = -w / 2;
    const oy = -h / 2 + 2;

    ctx.fillStyle = color.shadow;
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] === '1') ctx.fillRect(ox + c * s + 2, oy + r * s + 2, s, s);
      }
    }
    ctx.fillStyle = color.body;
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] === '1') ctx.fillRect(ox + c * s, oy + r * s, s, s);
      }
    }
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    for (let r = 0; r < 2; r++) {
      for (let c = 1; c < 4; c++) {
        if (shape[r] && shape[r][c] === '1') ctx.fillRect(ox + c * s, oy + r * s, s, s);
      }
    }
    ctx.fillStyle = color.accent;
    for (let c = 0; c < shape[0].length; c++) {
      if (shape[0][c] === '1') ctx.fillRect(ox + c * s, oy - 1, s, 1);
    }
  }

  function drawFace(cx, cy, face, accent, blinkProgress = 0) {
    const s = 2;
    const offY = -1;
    ctx.fillStyle = '#2D2D44';
    
    // 眨眼效果：根据 blinkProgress 决定是否闭眼
    const isClosing = blinkProgress < 0.5;
    const blinkScale = isClosing ? blinkProgress * 2 : (1 - blinkProgress) * 2;
    
    if (!blinkProgress || blinkScale > 0.3) {
      // 正常绘制眼睛（或眨眼未完全闭上）
      if (face.eyes === 'dot') {
        ctx.fillRect(cx - 6, cy + offY, s, s);
        ctx.fillRect(cx + 4, cy + offY, s, s);
      } else if (face.eyes === 'sad') {
        ctx.fillRect(cx - 7, cy + offY + 1, 3, 1);
        ctx.fillRect(cx + 4, cy + offY + 1, 3, 1);
      } else if (face.eyes === 'happy') {
        ctx.fillRect(cx - 7, cy + offY + 1, 2, 1);
        ctx.fillRect(cx - 6, cy + offY, 1, 1);
        ctx.fillRect(cx + 5, cy + offY + 1, 2, 1);
        ctx.fillRect(cx + 5, cy + offY, 1, 1);
      } else if (face.eyes === 'angry') {
        ctx.fillRect(cx - 7, cy + offY, 1, 1);
        ctx.fillRect(cx - 6, cy + offY + 1, 2, 1);
        ctx.fillRect(cx + 4, cy + offY, 1, 1);
        ctx.fillRect(cx + 4, cy + offY + 1, 2, 1);
      } else if (face.eyes === 'wide') {
        ctx.fillRect(cx - 6, cy + offY - 1, 2, 3);
        ctx.fillRect(cx + 4, cy + offY - 1, 2, 3);
      }
    } else {
      // 闭眼状态：绘制一条横线
      ctx.fillRect(cx - 7, cy + offY + 1, 4, 1);
      ctx.fillRect(cx + 4, cy + offY + 1, 4, 1);
    }

    ctx.fillStyle = '#2D2D44';
    if (face.mouth === 'smile') {
      ctx.fillRect(cx - 2, cy + offY + 4, 5, 1);
      ctx.fillRect(cx - 3, cy + offY + 5, 1, 1);
      ctx.fillRect(cx + 3, cy + offY + 5, 1, 1);
    } else if (face.mouth === 'frown') {
      ctx.fillRect(cx - 3, cy + offY + 5, 1, 1);
      ctx.fillRect(cx + 3, cy + offY + 5, 1, 1);
      ctx.fillRect(cx - 2, cy + offY + 6, 5, 1);
    } else if (face.mouth === 'flat') {
      ctx.fillRect(cx - 2, cy + offY + 4, 5, 1);
    } else if (face.mouth === 'small') {
      ctx.fillRect(cx - 1, cy + offY + 4, 3, 1);
    } else if (face.mouth === 'angry') {
      ctx.fillRect(cx - 3, cy + offY + 4, 7, 1);
      ctx.fillRect(cx - 2, cy + offY + 5, 5, 1);
    }

    ctx.fillStyle = 'rgba(255, 107, 157, 0.45)';
    ctx.fillRect(cx - 9, cy + offY + 3, 3, 1);
    ctx.fillRect(cx + 6, cy + offY + 3, 3, 1);
  }

  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.lineTo(x + w - r, y);
    c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r);
    c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + r, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - r);
    c.lineTo(x, y + r);
    c.quadraticCurveTo(x, y, x + r, y);
    c.closePath();
  }

  // ---------- Particle ----------
  class Particle {
    constructor(x, y, opts = {}) {
      this.x = x; this.y = y;
      const angle = opts.angle !== undefined ? opts.angle : Math.random() * Math.PI * 2;
      const speed = opts.speed || (2 + Math.random() * 5);
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed - 1;
      this.gravity = 0.12;
      this.size = opts.size || (3 + Math.random() * 4);
      this.color = opts.color || PALETTE[Math.floor(Math.random() * PALETTE.length)];
      this.life = 1;
      this.decay = 0.012 + Math.random() * 0.012;
      this.rotation = Math.random() * Math.PI;
      this.rotSpeed = (Math.random() - 0.5) * 0.25;
      // 更多粒子形状
      const shapes = ['star', 'square', 'circle', 'heart', 'diamond'];
      this.shape = opts.shape || shapes[Math.floor(Math.random() * shapes.length)];
      // 光晕效果
      this.glow = opts.glow !== undefined ? opts.glow : (Math.random() < 0.3);
      this.glowSize = this.size * 2;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.vy += this.gravity;
      this.vx *= 0.99;
      this.rotation += this.rotSpeed;
      this.life -= this.decay;
    }
    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.globalAlpha = Math.max(0, this.life);
      // 光晕效果
      if (this.glow && this.life > 0.3) {
        ctx.shadowColor = this.color.body || this.color;
        ctx.shadowBlur = this.glowSize;
      }
      ctx.fillStyle = this.color.body || this.color;
      if (this.shape === 'square') {
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
      } else if (this.shape === 'star') {
        drawStar(0, 0, this.size * 1.2, this.size * 0.5, 4);
        ctx.fill();
      } else if (this.shape === 'heart') {
        drawHeartShape(ctx, this.size, this.color.body || this.color);
      } else if (this.shape === 'diamond') {
        drawDiamondShape(ctx, this.size, this.color.body || this.color);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }
  
  // Particle 形状绘制辅助函数
  function drawHeartShape(ctx, size, color) {
    const s = size * 0.6;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, s * 0.3);
    ctx.bezierCurveTo(-s, -s * 0.3, -s, s * 0.6, 0, s);
    ctx.bezierCurveTo(s, s * 0.6, s, -s * 0.3, 0, s * 0.3);
    ctx.fill();
  }
  
  function drawDiamondShape(ctx, size, color) {
    const s = size * 0.7;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(s * 0.6, 0);
    ctx.lineTo(0, s);
    ctx.lineTo(-s * 0.6, 0);
    ctx.closePath();
    ctx.fill();
  }
  
  function drawStar(cx, cy, R, r, n) {
    ctx.beginPath();
    for (let i = 0; i < n * 2; i++) {
      const rad = i % 2 === 0 ? R : r;
      const a = (i * Math.PI) / n - Math.PI / 2;
      const x = cx + Math.cos(a) * rad;
      const y = cy + Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  // ---------- Burst ----------
  // 任务3：渐进式爆炸（粒子数、扩散速度、大小随 combo 递增）
  function burst(x, y, cloudColor, combo) {
    const c = Math.max(0, combo | 0);
    const baseParticles = 12 + Math.min(c, 20) * 1.4;
    const particleCount = Math.min(40, Math.round(state.mode === 'anger' ? baseParticles * 1.6 : baseParticles));
    const speedBoost = 1 + Math.min(c / 15, 1.0);
    const isAnger = state.mode === 'anger';

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2 + Math.random() * 0.4;
      const baseSpeed = isAnger ? (3 + Math.random() * 7) : (2 + Math.random() * 5);
      state.particles.push(new Particle(x, y, {
        angle,
        speed: baseSpeed * speedBoost,
        color: isAnger
          ? (Math.random() < 0.5 ? cloudColor.accent : ['#FFD93D', '#FF6B35', '#FF3030', '#FFE066'][Math.floor(Math.random() * 4)])
          : (Math.random() < 0.5 ? cloudColor.accent : PALETTE[Math.floor(Math.random() * PALETTE.length)]),
      }));
    }
    const starCount = Math.round((isAnger ? 10 : 5) * (1 + Math.min(c / 20, 1)));
    const baseStarSize = 8 + Math.min(c, 20) * 0.4;
    for (let i = 0; i < starCount; i++) {
      state.particles.push(new Particle(x, y, {
        angle: Math.random() * Math.PI * 2,
        speed: (1 + Math.random() * 2) * speedBoost,
        size: baseStarSize + Math.random() * 6,
        shape: 'star',
        color: cloudColor.accent,
        decay: 0.015,
      }));
    }
  }

  // ---------- Crack screen ----------
  // 任务4：渐进式碎屏（combo 挂钩：0-3 不触发，4+ 概率触发，10+ 必触发且线条更粗）
  function showCrack(combo) {
    if (state.mode !== 'anger') return;
    const c = Math.max(0, combo | 0);
    // combo 0-3: 不主动触发（popCloud 会自行决策是否调用）
    if (c < 4) return;
    crackLayer.innerHTML = generateCrackSVG(c);
    crackLayer.classList.remove('show');
    void crackLayer.offsetWidth;
    crackLayer.classList.add('show');
  }
  function generateCrackSVG(combo) {
    const w = window.innerWidth, h = window.innerHeight;
    const cx = w * (0.3 + Math.random() * 0.4);
    const cy = h * (0.3 + Math.random() * 0.4);
    const lines = [];
    const heavy = combo >= 10;
    const baseLineWidth = heavy ? 3 : 2;
    const segs = 6 + Math.floor(Math.random() * 4) + (heavy ? 4 : 0);
    for (let i = 0; i < segs; i++) {
      const angle = (i / segs) * Math.PI * 2 + Math.random() * 0.5;
      const len = 80 + Math.random() * 220 + (heavy ? 120 : 0);
      const x2 = cx + Math.cos(angle) * len;
      const y2 = cy + Math.sin(angle) * len;
      // 折线
      const midX = (cx + x2) / 2 + (Math.random() - 0.5) * 60;
      const midY = (cy + y2) / 2 + (Math.random() - 0.5) * 60;
      lines.push(`<polyline points="${cx},${cy} ${midX},${midY} ${x2},${y2}" stroke="white" stroke-width="${baseLineWidth}" fill="none" opacity="${heavy ? 0.95 : 0.9}"/>`);
      // 分支
      const branches = 2 + Math.floor(Math.random() * 3) + (heavy ? 2 : 0);
      for (let j = 0; j < branches; j++) {
        const t = 0.3 + Math.random() * 0.5;
        const sx = cx + (x2 - cx) * t;
        const sy = cy + (y2 - cy) * t;
        const bAng = angle + (Math.random() - 0.5) * 1.5;
        const bLen = 20 + Math.random() * (heavy ? 120 : 60);
        const ex = sx + Math.cos(bAng) * bLen;
        const ey = sy + Math.sin(bAng) * bLen;
        lines.push(`<line x1="${sx}" y1="${sy}" x2="${ex}" y2="${ey}" stroke="white" stroke-width="${heavy ? 2 : 1.5}" fill="none" opacity="${heavy ? 0.85 : 0.7}"/>`);
      }
    }
    return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">${lines.join('')}</svg>`;
  }
  function flashRed(opacity) {
    if (state.mode !== 'anger') return;
    const op = typeof opacity === 'number' ? opacity : 0.4;
    redFlash.style.background = `rgba(255, 0, 0, ${Math.min(0.9, Math.max(0.1, op))})`;
    redFlash.classList.remove('flash');
    void redFlash.offsetWidth;
    redFlash.classList.add('flash');
  }
  function shakeScreen(intensity) {
    // 任务3：强度分级 light | medium | heavy
    const level = intensity === 'medium' || intensity === 'heavy' ? intensity : 'light';
    const cls = level === 'heavy' ? 'anger-shake-hard' : (level === 'medium' ? 'anger-shake-medium' : 'anger-shake');
    document.body.classList.remove('anger-shake', 'anger-shake-medium', 'anger-shake-hard');
    void document.body.offsetWidth;
    document.body.classList.add(cls);
    setTimeout(() => document.body.classList.remove('anger-shake', 'anger-shake-medium', 'anger-shake-hard'), 650);
  }

  // 倾诉模式状态
  let ventCount = 0;
  let pendingVent = [];
  // 主聊天区对话历史（用于 AI 上下文）
  let ventChatHistory = [];

  // 情绪分析关键词库
  const EMOTION_KEYWORDS = {
    tired: { words: ['累', '疲惫', '困倦', '没精神', '想睡', '休息', '乏力'], label: '疲惫', emoji: '😮‍💨', color: '#F59E0B' },
    angry: { words: ['生气', '愤怒', '气', '不爽', '讨厌', '烦', '烦', '怒'], label: '生气', emoji: '😤', color: '#EF4444' },
    sad: { words: ['难过', '悲伤', '哭', '伤心', '痛', '心碎', '失落'], label: '难过', emoji: '🥺', color: '#8B5CF6' },
    anxious: { words: ['焦虑', '担心', '不安', '害怕', '紧张', '慌', '忐忑'], label: '焦虑', emoji: '😰', color: '#EC4899' },
    lonely: { words: ['孤独', '寂寞', '一个人', '没人', '孤单', '独处'], label: '孤独', emoji: '🌙', color: '#6366F1' },
    happy: { words: ['开心', '高兴', '快乐', '幸福', '满足', '愉悦'], label: '开心', emoji: '😊', color: '#10B981' }
  };

  // 分析情绪
  function analyzeEmotion(text) {
    const t = (text || '').toLowerCase();
    for (const [key, value] of Object.entries(EMOTION_KEYWORDS)) {
      if (value.words.some(word => t.includes(word))) {
        return value;
      }
    }
    return { label: '平静', emoji: '😐', color: '#6B7280' };
  }

  // 安慰文库（按情绪类型）
  const VENT_COMFORT = {
    default: [
      '我听到了，慢慢说 🌸',
      '谢谢你愿意告诉我 💕',
      '嗯，我在听... 🌙',
      '这种感觉确实不好受',
      '你辛苦了 🤗',
      '说出来会好一点的',
    ],
    tired: [
      '听起来今天真的很累 💭',
      '工作/生活压得你喘不过气吧',
      '你已经撑了很久了，真的不容易',
      '休息一下吧，你值得被好好照顾',
    ],
    angry: [
      '很生气对吗？我懂 😤',
      '这种委屈真的很让人崩溃',
      '想骂就骂吧，这里很安全',
      '你的感受是完全合理的',
    ],
    sad: [
      '心里很难受吧 🥺',
      '想哭就哭出来，没关系的',
      '我在这里陪你',
      '有些事说出来就好了一半',
    ],
    anxious: [
      '担心的事情很多吧 😰',
      '深呼吸，慢慢来',
      '一件一件来，会没事的',
      '我理解那种不安的感觉',
    ],
    lonely: [
      '一个人的时候特别难熬 🌙',
      '你不是一个人，有我在',
      '希望我能给你一点温暖',
      '这种孤独感我懂的',
    ],
    happy: [
      '真好呀！听到你开心我也很开心 🌟',
      '保持这份好心情哦 ✨',
      '开心的事要多分享呀 🌈',
      '你的笑容是最好的治愈 💖',
    ]
  };

  function getVentComfort(text) {
    const t = (text || '').toLowerCase();
    if (/累|疲惫|困倦|没精神/i.test(t)) {
      return VENT_COMFORT.tired[Math.floor(Math.random() * VENT_COMFORT.tired.length)];
    } else if (/生气|愤怒|气|不爽|讨厌/i.test(t)) {
      return VENT_COMFORT.angry[Math.floor(Math.random() * VENT_COMFORT.angry.length)];
    } else if (/难过|悲伤|哭|伤心|痛/i.test(t)) {
      return VENT_COMFORT.sad[Math.floor(Math.random() * VENT_COMFORT.sad.length)];
    } else if (/焦虑|担心|不安|害怕|紧张/i.test(t)) {
      return VENT_COMFORT.anxious[Math.floor(Math.random() * VENT_COMFORT.anxious.length)];
    } else if (/孤独|寂寞|一个人|没人/i.test(t)) {
      return VENT_COMFORT.lonely[Math.floor(Math.random() * VENT_COMFORT.lonely.length)];
    } else if (/开心|高兴|快乐|幸福/i.test(t)) {
      return VENT_COMFORT.happy[Math.floor(Math.random() * VENT_COMFORT.happy.length)];
    }
    return VENT_COMFORT.default[Math.floor(Math.random() * VENT_COMFORT.default.length)];
  }

  // 添加聊天消息
  function addChatMessage(text, isUser, emotion = null) {
    const chatMessages = document.getElementById('chat-messages');
    const chatArea = document.getElementById('chat-area');

    if (!chatMessages || !chatArea) return;

    // 聊天区现在常驻显示
    // 创建消息元素
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${isUser ? 'user' : 'bot'}`;

    const avatar = document.createElement('div');
    avatar.className = 'chat-avatar';
    avatar.textContent = isUser ? '👤' : '🤗';

    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble';
    bubble.textContent = text;

    // 添加情绪标签
    if (emotion) {
      const emotionSpan = document.createElement('span');
      emotionSpan.className = 'chat-emotion';
      emotionSpan.textContent = `${emotion.emoji} ${emotion.label}`;
      emotionSpan.style.backgroundColor = isUser ? `${emotion.color}33` : `${emotion.color}15`;
      emotionSpan.style.color = isUser ? '#fff' : emotion.color;
      bubble.appendChild(emotionSpan);
    }

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(bubble);
    chatMessages.appendChild(messageDiv);

    // 滚动到底部
    chatMessages.scrollTop = chatMessages.scrollHeight;

    return messageDiv;
  }

  // 主聊天区：显示打字指示器
  function showVentTypingIndicator() {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;
    const typing = document.createElement('div');
    typing.className = 'chat-message bot';
    typing.id = 'vent-typing';
    typing.innerHTML = '<div class="chat-avatar">🤗</div><div class="chat-typing"><span></span><span></span><span></span></div>';
    chatMessages.appendChild(typing);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // 主聊天区：移除打字指示器
  function hideVentTypingIndicator() {
    const typing = document.getElementById('vent-typing');
    if (typing) typing.remove();
  }

  // 主聊天区：打字机效果（带自动滚动）
  function ventTypeWriter(element, text, callback) {
    let i = 0;
    element.textContent = '';
    const speed = 25;
    const chatMessages = document.getElementById('chat-messages');

    function scrollToBottom() {
      if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }
    }

    function type() {
      if (i < text.length) {
        element.textContent += text.charAt(i);
        i++;
        scrollToBottom();
        setTimeout(type, speed);
      } else {
        scrollToBottom();
        if (callback) callback();
      }
    }
    type();
  }

  // 显示安慰回应（聊天样式）
  function showComfortResponse(text) {
    // 添加用户消息
    const emotion = analyzeEmotion(text);
    addChatMessage(text, true, emotion);

    // 保存到对话历史
    ventChatHistory.push({ role: 'user', content: text });

    // 发送后清空输入框并重新聚焦，支持连续聊天
    setTimeout(() => {
      if (input) {
        input.value = '';
        input.focus();
      }
    }, 100);

    // 检查是否启用了 AI
    const useAI = window.MCAIService && window.MCAIService.isAIEnabled();

    // 显示打字指示器
    setTimeout(() => {
      showVentTypingIndicator();
    }, 300);

    if (useAI) {
      // 有 AI 时调用 AI 回复
      const systemPrompt = `你是一个温暖治愈的树洞陪伴者，名叫"小柔"。
- 性格：温柔、善解人意、共情能力强、简短温暖、不说教
- 说话风格：像朋友一样聊天，简短自然，用emoji点缀
- 当用户表达负面情绪时，先共情，再轻轻安抚
- 当用户表达正面情绪时，给予肯定和鼓励
- 每次回复不超过40字，保持简短
- 适当用emoji，但不要过度
- 不要说"根据你的描述..."、"我建议你..."这类话
- 用中文回复`;

      const messages = [
        { role: 'system', content: systemPrompt },
        ...ventChatHistory.slice(-10), // 保留最近10轮对话
      ];

      window.MCAIService.chat(messages, (err, reply) => {
        hideVentTypingIndicator();

        if (err || !reply) {
          // AI 失败，降级到本地回复
          const comfort = getVentComfort(text);
          const msgEl = addChatMessage(comfort, false);
          if (msgEl) ventChatHistory.push({ role: 'assistant', content: comfort });
          return;
        }

        // AI 回复，用打字机效果
        const msgEl = addChatMessage('', false);
        if (msgEl) {
          const bubble = msgEl.querySelector('.chat-bubble');
          if (bubble) {
            ventTypeWriter(bubble, reply, () => {
              ventChatHistory.push({ role: 'assistant', content: reply });
            });
          } else {
            ventChatHistory.push({ role: 'assistant', content: reply });
          }
        }
      }, 8000);
    } else {
      // 无 AI 时用本地关键词回复
      setTimeout(() => {
        hideVentTypingIndicator();
        const comfort = getVentComfort(text);
        const msgEl = addChatMessage('', false);
        if (msgEl) {
          const bubble = msgEl.querySelector('.chat-bubble');
          if (bubble) {
            ventTypeWriter(bubble, comfort, () => {
              ventChatHistory.push({ role: 'assistant', content: comfort });
            });
          } else {
            ventChatHistory.push({ role: 'assistant', content: comfort });
          }
        }
      }, 800);
    }
  }

  // 继续聊天
  function continueChat() {
    const input = document.getElementById('worry-input');
    if (input) {
      input.value = '';
      input.focus();
    }
  }

  // 释放所有待释放的云朵
  function releaseAllClouds() {
    const texts = pendingVent.splice(0);
    ventCount = 0;

    if (texts.length === 0) {
      showToast('没什么要放下的呢 ✨', 'accent');
      return;
    }

    texts.forEach((text, i) => {
      setTimeout(() => {
        if (state.clouds.length >= 12) {
          showToast('云朵满了，先戳几个吧 ⛅');
          return;
        }
        const margin = 80;
        const cx = margin + Math.random() * Math.max(80, W - margin * 2);
        const cy = 80 + Math.random() * Math.max(80, H * 0.55);
        const cloud = new Cloud(text, cx, H + 60);
        cloud.targetY = cy;
        
        // 根据情绪设置云朵颜色
        const emotion = analyzeEmotion(text);
        if (emotion) {
          cloud.emotion = emotion;
        }
        
        state.clouds.push(cloud);
        playWhoosh();
        updateEnergyBar();
      }, i * 200);
    });

    // 清空聊天消息
    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages) chatMessages.innerHTML = '';

    // 清空聊天历史
    ventChatHistory = [];

    // 重新添加欢迎消息
    setTimeout(() => {
      const welcomes = [
        '都放下啦，感觉好点了吗？ 🌸',
        '轻装上阵，继续加油 ✨',
        '把烦恼都变成云朵飘走吧 🌙',
        '你已经很棒啦，抱抱你 🤗',
      ];
      const welcome = welcomes[Math.floor(Math.random() * welcomes.length)];
      addChatMessage(welcome, false);
      ventChatHistory.push({ role: 'assistant', content: welcome });
    }, 500);

    emptyHint.classList.add('hide');

    setTimeout(() => {
      showToast('把这些都轻轻放下吧 🌸', 'accent');
    }, texts.length * 200 + 300);
  }

  // ---------- Add worry ----------
  function addWorry(text) {
    text = (text || '').trim().slice(0, 40);
    if (!text) return;

    // 倾诉模式：先显示安慰，不立即生成云朵
    ventCount++;
    pendingVent.push(text);

    // 显示安慰回应（聊天样式）
    showComfortResponse(text);
  }

  // ---------- Hit test ----------
function getHit(x, y) {
  for (let i = state.clouds.length - 1; i >= 0; i--) {
    const c = state.clouds[i];
    const scale = c.currentScale || 1;
    // 暴躁模式炸弹进一步增大点击区域，补偿抖动和视觉偏差
    const isAngerBomb = c.isAnger;
    const hitWidth = isAngerBomb ? 85 * scale : 50 * scale;
    const hitHeight = isAngerBomb ? 70 * scale : 40 * scale;
    // 考虑抖动偏移，使用实际绘制位置
    const actualX = c.x + (c.shakeOffsetX || 0);
    const actualY = c.y + (c.shakeOffsetY || 0);
    const dx = x - actualX, dy = y - actualY - 4;
    if (Math.abs(dx) < hitWidth && Math.abs(dy) < hitHeight) return c;
  }
  return null;
}

  // ---------- Pop ----------
  // 里程碑文案（任务1）
  const MILESTONE_MSGS_NORMAL = {
    5: '5 个坏情绪飞走了 ✨',
    10: '已放空 10 个，快出一口气 💨',
    20: '20 个了！你真的很棒 💪',
    30: '30 连击！释放感爆棚 🚀',
    50: '疯狂放空 50 个 🎉',
    100: '你今天完成了 100 次放空，真了不起 🌟',
  };
  const MILESTONE_MSGS_ANGER = {
    5: '炸了 5 个！继续 💥',
    10: '10 连炸！爽爆了 🔥',
    20: '20 连击！已经爆炸 💢',
    30: '30 连击！释放吧 🔥',
    50: '50 连击！彻底炸穿 🚀',
    100: '100 连击！你已经是风暴本暴 🌪️',
  };

  // 暂停鼓励文案（任务5）
  const ENCOURAGE_NORMAL = [
    '辛苦了 🌱',
    '好多了对吗 ✨',
    '这一刻，你做的很好 🌸',
    '深呼吸一下，继续向前 🍃',
    '释放掉了，对吗 🌈',
  ];
  const ENCOURAGE_ANGER = [
    '爽了吧？刚才那一下替你出了口气 💥',
    '吼完了？记得对自己温柔一点 🌼',
    '发泄完了，接下来对自己好点 🍀',
    '这一下是替委屈出的气，下一下为自己 🔥',
    '情绪释放完毕，你可以继续前行了 ✨',
    '如果还没够，随时回来 💪',
  ];

  function triggerEncourage() {
    if (state.count < 3) return;
    if (state.combo <= 0) return;
    const pool = state.mode === 'anger' ? ENCOURAGE_ANGER : ENCOURAGE_NORMAL;
    let msg = pool[Math.floor(Math.random() * pool.length)];
    if (state.combo > 10) {
      const extra = state.mode === 'anger'
        ? `（刚刚 ${state.combo} 连击！痛快！）`
        : `（刚刚 ${state.combo} 连击！真的很棒～）`;
      msg += extra;
    }
    showToast(msg, 'encourage');
    // 暂停后引导深呼吸（功能暂未实现，先注释避免报错）
    // setTimeout(() => {
    //   startBreathing(3);
    // }, 700);
  }

  function popCloud(cloud, silent) {
    const idx = state.clouds.indexOf(cloud);
    if (idx < 0) return;
    state.clouds.splice(idx, 1);

    const isAnger = state.mode === 'anger';

    // 爆炸（任务3：渐进式）
    burst(cloud.x, cloud.y, cloud.color, state.combo);
    if (isAnger) {
      playBoom();
      if (!silent) {
        const level = state.combo >= 10 ? 'heavy' : (state.combo >= 3 ? 'medium' : 'light');
        shakeScreen(level);
        flashRed(0.3 + Math.min(state.combo, 20) * 0.025);
        // 任务4：碎屏渐进触发
        if (state.combo >= 10) {
          showCrack(state.combo);
        } else if (state.combo >= 4 && Math.random() < 0.45) {
          showCrack(state.combo);
        }
      }
    } else {
      playPop(state.combo + 1);
    }

    // 计数 + 存储
    state.count += 1;
    state.today += 1;
    window.MCStore.incCount(1);
    window.MCStore.addBurstItem(cloud.text, isAnger ? 'anger' : null);
    // 小树成长：戳爆云朵=力量叶
    window.MCStore.growTree('strength');
    updateStats();
    // 更新情绪能量条
    updateEnergyBar();

    // 连击（任务2：更新 comboShownAt）
    state.combo += 1;
    state.comboShownAt = Date.now();
    clearTimeout(state.comboTimer);
    state.comboTimer = setTimeout(() => { 
      state.combo = 0; 
      updateStats();
      updateWeather(state.combo); // combo 清零时更新天气
    }, isAnger ? 3000 : 2200);

    // 更新心情天气系统
    updateWeather(state.combo);

    // 任务7：暴躁模式下根据 combo 刷新 floater 生成间隔
    if (isAnger) {
      refreshFloaterInterval();
    }

    // Toast：不再每次都弹，只在里程碑触发（任务1）
    if (!silent) {
      const msgs = isAnger ? MILESTONE_MSGS_ANGER : MILESTONE_MSGS_NORMAL;
      if (msgs[state.count]) {
        showToast(msgs[state.count], isAnger ? 'anger-milestone' : 'milestone');
      }
    }

    // 任务5：暂停鼓励机制
    clearTimeout(state.encourageTimer);
    state.encourageTimer = setTimeout(triggerEncourage, 1700 + Math.floor(Math.random() * 300));

    // 情绪分析（仅非暴躁模式 且非批量）
    // 任务6：AI 分析克制化（本地关键词分析仍然每击都跑）
    if (!isAnger && !silent) {
      try {
        if (window.MCAIService && window.MCAIService.isAIEnabled()) {
          state.analysisCounter += 1;
          if (state.analysisCounter % 5 === 0) {
            window.MCAIService.analyzeWithAI(cloud.text, (err, result) => {
              if (!err && result && result.dominant) {
                state.currentMood = result.dominant.emoji;
                $('#stat-mood').textContent = state.currentMood;
              }
            });
          } else {
            const a = window.MCAnalyzer.analyze(cloud.text);
            if (a.dominant) {
              state.currentMood = a.dominant.emoji;
              $('#stat-mood').textContent = state.currentMood;
            }
          }
        } else {
          const a = window.MCAnalyzer.analyze(cloud.text);
          if (a.dominant) {
            state.currentMood = a.dominant.emoji;
            $('#stat-mood').textContent = state.currentMood;
          }
        }
      } catch (e) { /* noop */ }
    } else if (isAnger && !silent) {
      state.currentMood = '💥';
      $('#stat-mood').textContent = state.currentMood;
    }
    
    // 检查徽章解锁
    checkAndUnlockBadges();
    
    // 检查彩蛋触发
    checkEasterEgg();
  }
  function pickQuoteType(text) {
    const t = (text || '').toLowerCase();
    if (!t) return Math.random() < 0.5 ? 'heal' : 'hype';
    if (/(累|丧|emo|哭|难过|委屈|down|不开心|抑郁)/.test(t)) return 'heal';
    if (/(怒|气|烦|滚|恨|草|傻|滚蛋|去死)/.test(t)) return 'roast';
    if (/(加班|工作|老板|kpi|deadline|ddl|ppt|周报|会议)/.test(t)) return 'work';
    if (/(哈哈|开心|快乐|好|棒|爱|赞|谢谢|nice)/.test(t)) return 'hype';
    return Math.random() < 0.4 ? 'heal' : (Math.random() < 0.5 ? 'self' : 'hype');
  }

  // ---------- Stats UI ----------
  function updateStats() {
    $('#stat-count').textContent = state.count;
    $('#stat-diary').textContent = window.MCStore.getDiaries().length;
    $('#stat-streak').textContent = parseInt(localStorage.getItem('mc_streak') || '0', 10);
  }

  // ---------- Toast ----------
  function showToast(html, type) {
    const el = document.createElement('div');
    let cls = 'toast';
    if (type === 'anger' || type === 'anger-milestone') cls += ' anger';
    else if (type === 'milestone') cls += ' milestone';
    else if (type === 'encourage') cls += ' encourage';
    else cls += ' accent';
    el.className = cls;
    el.innerHTML = html;
    toastWrap.appendChild(el);
    setTimeout(() => {
      el.classList.add('fade-out');
      setTimeout(() => el.remove(), 300);
    }, 2200);
  }

  // ---------- Input ----------
  sendBtn.addEventListener('click', () => {
    if (state.mode === 'anger') {
      // 暴躁模式：直接添加 1-3 个随机炸弹
      const n = 1 + Math.floor(Math.random() * 3);
      quickBurst(n);
      return;
    }
    const v = input.value;
    if (!v.trim()) {
      showToast('写点啥再扔吧 ✏️', 'accent');
      input.focus();
      return;
    }
    addWorry(v);
    input.value = '';
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); sendBtn.click(); }
  });
  quickTags.forEach(btn => {
    btn.addEventListener('click', () => {
      input.value = btn.dataset.tag;
      sendBtn.click();
    });
  });

  // 长按 send 按钮：持续生成炸弹（暴躁模式专属）
  let angerHoldTimer = null;
  let angerHoldInterval = null;
  function startAngerHold() {
    if (state.mode !== 'anger') return;
    // 立即加几个
    quickBurst(3);
    // 持续喷
    angerHoldTimer = setTimeout(() => {
      angerHoldInterval = setInterval(() => {
        quickBurst(2);
      }, 200);
    }, 400);
  }
  function stopAngerHold() {
    clearTimeout(angerHoldTimer);
    clearInterval(angerHoldInterval);
    angerHoldTimer = null;
    angerHoldInterval = null;
  }
  sendBtn.addEventListener('mousedown', startAngerHold);
  sendBtn.addEventListener('mouseup', stopAngerHold);
  sendBtn.addEventListener('mouseleave', stopAngerHold);
  sendBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    startAngerHold();
    // 同时处理 touch 的 click
    if (state.mode === 'anger') e.stopPropagation();
  }, { passive: false });
  sendBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    stopAngerHold();
  });

  // ---------- Canvas click ----------
function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  const cx = e.touches ? e.touches[0].clientX : e.clientX;
  const cy = e.touches ? e.touches[0].clientY : e.clientY;
  return { x: cx - rect.left, y: cy - rect.top };
}
function handlePointerDown(e) {
  const { x, y } = getPos(e);
  const hit = getHit(x, y);
  if (hit) hit.isPressed = true;
}
function handlePointerUp(e) {
  const { x, y } = getPos(e);
  const hit = getHit(x, y);
  if (hit && hit.isPressed) {
    hit.isPressed = false;
    // 添加点击视觉反馈（暴躁模式更明显）
    if (state.mode === 'anger') {
      showClickFeedback(hit.x, hit.y, true);
    }
    popCloud(hit);
  }
  // 确保所有云的 isPressed 都复位
  state.clouds.forEach(c => { if (c.isPressed) c.isPressed = false; });
}

// 点击视觉反馈
function showClickFeedback(x, y, isAnger) {
  const feedback = {
    x: x,
    y: y,
    startTime: performance.now(),
    duration: 300,
    isAnger: isAnger,
    radius: 0,
    opacity: 1
  };
  state.clickFeedbacks = state.clickFeedbacks || [];
  state.clickFeedbacks.push(feedback);
}
// 桌面端：只使用 press/release 机制，避免重复触发
canvas.addEventListener('mousedown', handlePointerDown);
canvas.addEventListener('mouseup', handlePointerUp);
canvas.addEventListener('mouseleave', () => {
  state.clouds.forEach(c => c.isPressed = false);
});
// 触屏设备：使用 press/release + preventDefault 防止浏览器默认行为干扰
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  handlePointerDown(e);
}, { passive: false });
canvas.addEventListener('touchend', (e) => {
  e.preventDefault();
  handlePointerUp(e);
}, { passive: false });
canvas.addEventListener('touchcancel', () => {
  state.clouds.forEach(c => c.isPressed = false);
});

  // ---------- Mode switch ----------
  function setMode(mode) {
    if (state.mode === mode) return;
    state.mode = mode;
    // 任务7：模式切换后重建 floater 间隔
    refreshFloaterInterval();
    if (mode === 'anger') {
      document.body.classList.add('anger-mode');
      modeNormalBtn.classList.remove('active');
      modeAngerBtn.classList.add('active');
      sendArrow.textContent = '💥';
      sendLabel.textContent = '一键发泄';
      emptyEmoji.textContent = '💣';
      emptyTitle.textContent = '全部炸开！';
      emptyDesc.innerHTML = '按住 <strong style="color:#FFE066">「一键发泄」</strong> 火力全开<br>戳破每个红色炸弹 💥';
      // 隐藏输入框与快捷标签
      input.parentElement.style.display = 'none';
      $('#quick-tags').style.display = 'none';
      $('#mood-selector').style.display = 'none';
      // 底部按钮变成「清空发泄」
      btnReportText.textContent = '清空发泄';
      // 清掉之前普通模式的云朵，全部换成红色炸弹
      state.clouds = [];
      // 自动铺满炸弹！
      autoFillAnger(8);
      playAngerLoop();
      shakeScreen('medium');
      flashRed(0.5);
      // 标记用户使用过暴躁模式（用于徽章）
      localStorage.setItem('mc_used_anger', '1');
      setTimeout(() => { showToast('🔥 暴躁模式！直接开炸！', 'anger'); }, 300);
    } else {
      document.body.classList.remove('anger-mode');
      modeAngerBtn.classList.remove('active');
      modeNormalBtn.classList.add('active');
      sendArrow.textContent = '↗';
      sendLabel.textContent = '扔出去';
      emptyEmoji.textContent = '☁️';
      emptyTitle.textContent = '云朵在等你';
      emptyDesc.innerHTML = '把心事说给云朵听<br>它们会温柔接住你的每一句话 💫';
      // 显示输入框
      input.parentElement.style.display = '';
      $('#quick-tags').style.display = '';
      $('#mood-selector').style.display = '';
      // 恢复按钮文案
      btnReportText.textContent = '今日发泄';
      // 暴躁模式的云朵全部清掉
      state.clouds = state.clouds.filter(c => !c.isAnger);
      if (state.clouds.length === 0) emptyHint.classList.remove('hide');
      showToast('☁️ 已回到治愈模式', 'accent');
    }
    updateEnergyBar();
  }
  modeNormalBtn.addEventListener('click', () => setMode('normal'));
  modeAngerBtn.addEventListener('click', () => setMode('anger'));

  // 暴躁模式自动填充 N 个炸弹
  function autoFillAnger(n) {
    const usedTexts = new Set(state.clouds.map(c => c.text));
    let added = 0;
    let tries = 0;
    while (added < n && tries < n * 4) {
      tries++;
      let text = getRandomAnger();
      // 避免重复
      if (usedTexts.has(text)) continue;
      usedTexts.add(text);
      const margin = 70;
      const cx = margin + Math.random() * Math.max(80, W - margin * 2);
      const cy = 70 + Math.random() * Math.max(60, H * 0.55);
      const cloud = new Cloud(text, cx, H + 60);
      cloud.targetY = cy;
      state.clouds.push(cloud);
      added++;
    }
    emptyHint.classList.add('hide');
  }

  // 一键发泄：批量添加炸弹（任务7：数量随 combo 递增）
  function quickBurst(count) {
    const c = state.combo;
    let n = count || 1;
    // 如果是按钮触发的默认快速生成，根据 combo 提升
    if (!count) {
      if (c > 10) n = 3 + Math.floor(Math.random() * 4);     // 3-6
      else if (c > 5) n = 2 + Math.floor(Math.random() * 3);  // 2-4
      else n = 1 + Math.floor(Math.random() * 3);             // 1-3
    }
    autoFillAnger(n);
    if (n > 1) {
      const level = c >= 10 ? 'heavy' : (c >= 3 ? 'medium' : 'light');
      shakeScreen(level);
      flashRed(0.25 + Math.min(c, 20) * 0.02);
    }
  }

  // ---------- Header buttons ----------
  $('#btn-reset').addEventListener('click', () => {
    if (state.count === 0 && state.clouds.length === 0 && window.MCStore.getDiaries().length === 0) {
      showToast('一切从 0 开始 🌱');
      return;
    }
    if (!confirm('确定重新开始？\n这会清空你所有的"放空"记录和日记')) return;
    window.MCStore.resetAll();
    state.count = 0;
    state.today = 0;
    state.combo = 0;
    state.clouds = [];
    state.particles = [];
    location.reload();
  });
  $('#btn-help').addEventListener('click', () => helpModal.classList.add('show'));
  $('#btn-close-help').addEventListener('click', () => helpModal.classList.remove('show'));
  helpModal.addEventListener('click', (e) => { if (e.target === helpModal) helpModal.classList.remove('show'); });

  // ---------- Bottom bar ----------
  $('#btn-diary').addEventListener('click', openDiaryList);
  $('#btn-weather').addEventListener('click', renderWeatherChart);
  $('#btn-report').addEventListener('click', () => {
    if (state.mode === 'anger') {
      // 暴躁模式：清空所有云朵
      clearAllClouds();
    } else {
      openReport();
    }
  });

  // ---------- Weather 系统 ----------
  $('#btn-close-weather').addEventListener('click', () => weatherModal.classList.remove('show'));
  weatherModal.addEventListener('click', (e) => { if (e.target === weatherModal) weatherModal.classList.remove('show'); });

  // 一键清空：逐个炸掉所有云朵
  function clearAllClouds() {
    if (state.clouds.length === 0) {
      // 已经是空的，直接弹报告
      openReport();
      return;
    }
    const total = state.clouds.length;
    showToast(`💥 一次性清空 ${total} 个炸弹！`, 'anger');
    // 先震屏 + 碎屏一次
    shakeScreen('heavy');
    flashRed(0.7);
    showCrack(Math.max(15, state.combo));
    playBoom();
    // 逐个延迟炸开（每个 80ms）
    const cloudsCopy = state.clouds.slice();
    cloudsCopy.forEach((c, i) => {
      setTimeout(() => {
        if (state.clouds.includes(c)) popCloud(c, true);
      }, i * 70);
    });
    // 全部炸完后弹报告
    setTimeout(() => {
      if (state.clouds.length === 0) {
        setTimeout(() => openReport(), 400);
      }
    }, cloudsCopy.length * 70 + 600);
  }

  // ---------- Diary 系统 ----------
  let editingId = null;
  let detailId = null;
  let chosenMood = '😐';

  function openDiaryList() {
    renderDiaryList();
    diaryModal.classList.add('show');
  }
  $('#btn-diary-close').addEventListener('click', () => diaryModal.classList.remove('show'));
  diaryModal.addEventListener('click', (e) => { if (e.target === diaryModal) diaryModal.classList.remove('show'); });

  $('#btn-diary-new').addEventListener('click', () => {
    openDiaryWrite(null);
  });

  function renderDiaryList() {
    const list = window.MCStore.getDiaries();
    const el = $('#diary-list');
    if (!list.length) {
      el.innerHTML = `<div class="diary-item-empty">
        <span class="big-emoji">📔</span>
        <div>还没有日记</div>
        <div style="margin-top:6px;font-size:12px">点右上角 <strong>+</strong> 写下第一篇吧</div>
      </div>`;
      return;
    }
    el.innerHTML = list.map(d => {
      const date = new Date(d.ts);
      const dateStr = `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
      const emos = d.emotions ? Object.entries(d.emotions)
        .filter(([k, v]) => v > 10)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([k, v]) => `<span class="d-emotion">${window.MCAnalyzer.DICT[k].emoji} ${window.MCAnalyzer.DICT[k].label}</span>`)
        .join('') : '';
      return `<div class="diary-item" data-id="${d.id}">
        <div class="d-meta">
          <span class="d-mood">${d.mood}</span>
          <span>${dateStr}</span>
        </div>
        <div class="d-content">${escapeHtml(d.content)}</div>
        ${emos ? `<div class="d-emotions">${emos}</div>` : ''}
      </div>`;
    }).join('');
    el.querySelectorAll('.diary-item').forEach(item => {
      item.addEventListener('click', () => openDiaryDetail(item.dataset.id));
    });
  }

  function openDiaryWrite(id) {
    editingId = id;
    const isEdit = !!id;
    $('#dw-icon').textContent = isEdit ? '✏️' : '📝';
    $('#dw-title').textContent = isEdit ? '编辑日记' : '写日记';
    if (isEdit) {
      const d = window.MCStore.getDiary(id);
      if (d) {
        $('#diary-content').value = d.content;
        chosenMood = d.mood;
      }
    } else {
      $('#diary-content').value = '';
      chosenMood = window.MCAnalyzer.moodEmoji($('#worry-input').value) || '😐';
    }
    highlightMood();
    diaryWriteModal.classList.add('show');
    setTimeout(() => $('#diary-content').focus(), 100);
  }
  $('#btn-dw-close').addEventListener('click', closeDiaryWrite);
  $('#btn-dw-cancel').addEventListener('click', closeDiaryWrite);
  function closeDiaryWrite() { diaryWriteModal.classList.remove('show'); editingId = null; }

  $('#mood-pick').addEventListener('click', (e) => {
    const pill = e.target.closest('.mood-pill');
    if (!pill) return;
    chosenMood = pill.dataset.mood;
    highlightMood();
  });
  function highlightMood() {
    $$('.mood-pill').forEach(p => p.classList.toggle('active', p.dataset.mood === chosenMood));
  }

  $('#btn-dw-save').addEventListener('click', () => {
    const text = $('#diary-content').value.trim();
    if (!text) { showToast('写点什么吧 🤗'); return; }

    const saveBtn = $('#btn-dw-save');
    const originalText = saveBtn.textContent;
    const saveWithAnalysis = (analysis) => {
      const source = analysis.source || 'local';
      const item = editingId
        ? window.MCStore.updateDiary(editingId, {
            content: text,
            mood: chosenMood,
            emotions: analysis.scores,
            source: source,
            summary: analysis.summary || '',
          })
        : window.MCStore.addDiary(text, chosenMood, analysis.scores, {
            source: source,
            summary: analysis.summary || '',
          });
      // 小树成长：写日记=温柔花
      if (!editingId) window.MCStore.growTree('gentle');
      closeDiaryWrite();
      if (detailId) { diaryDetailModal.classList.remove('show'); detailId = null; }
      updateStats();
      if (diaryModal.classList.contains('show')) renderDiaryList();
      window.MCStore.bumpStreak();
      updateStats();
      showToast(editingId ? '已更新 ✨' : (source === 'ai' ? 'AI 分析完成，来看看 🧠' : '已保存 🧠'));
      // 回显：打开刚保存的日记
      setTimeout(() => openDiaryDetail(item.id), 250);
      // 小回信：温柔回应
      setTimeout(() => showDiaryEcho(text), 800);
    };

    // 显示分析中状态
    saveBtn.textContent = '分析中...';
    saveBtn.disabled = true;

    const useAI = window.MCAIService && window.MCAIService.isAIEnabled();
    const provider = useAI ? (window.MCAIConfig && window.MCAIConfig.getActiveConfig()?.provider) : null;

    if (useAI) {
      // 显示 AI 分析中状态
      showToast(`${provider === 'ollama' ? '本地 Ollama' : 'AI'} 正在分析你的情绪...`, 'accent');
      const timeoutId = setTimeout(() => {
        // 超时兜底
        const analysis = window.MCAnalyzer.analyze(text);
        saveWithAnalysis(analysis);
        saveBtn.textContent = originalText;
        saveBtn.disabled = false;
      }, 8000);

      window.MCAIService.analyzeWithAI(text, (err, result) => {
        if (!err && result) {
          clearTimeout(timeoutId);
          saveWithAnalysis(result);
          saveBtn.textContent = originalText;
          saveBtn.disabled = false;
        } else {
          // AI 失败，兜底
          clearTimeout(timeoutId);
          const analysis = window.MCAnalyzer.analyze(text);
          saveWithAnalysis(analysis);
          saveBtn.textContent = originalText;
          saveBtn.disabled = false;
        }
      });
    } else {
      showToast('正在保存...', 'accent');
      const analysis = window.MCAnalyzer.analyze(text);
      setTimeout(() => {
        saveWithAnalysis(analysis);
        saveBtn.textContent = originalText;
        saveBtn.disabled = false;
      }, 400);
    }
  });

  function openDiaryDetail(id) {
    detailId = id;
    const d = window.MCStore.getDiary(id);
    if (!d) return;
    const date = new Date(d.ts);
    $('#dd-mood').textContent = d.mood;
    $('#dd-date').textContent = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    let html = `<div style="font-size:14px;line-height:1.8;color:var(--ink);white-space:pre-wrap;background:var(--bg-3);padding:14px 16px;border-radius:12px;margin-bottom:14px;">${escapeHtml(d.content)}</div>`;
    if (d.emotions) {
      // 从 emotions 中提取元数据（_source / _summary），过滤掉非维度字段
      const source = d.source || d.emotions._source || 'local';
      const summary = d.summary || d.emotions._summary || '';
      const emoEntries = Object.entries(d.emotions)
        .filter(([k, v]) => typeof v === 'number' && v > 0)
        .sort((a, b) => b[1] - a[1]);

      const dom = window.MCAnalyzer.pickDominant(
        Object.fromEntries(emoEntries),
      );

      const sourceBadge = source === 'ai'
        ? `<span style="display:inline-block;font-size:11px;padding:2px 8px;border-radius:999px;background:linear-gradient(135deg,#8B5CF6,#EC4899);color:#fff;letter-spacing:1px;float:right;">AI · MODEL</span>`
        : `<span style="display:inline-block;font-size:11px;padding:2px 8px;border-radius:999px;background:#D1D5DB;color:#374151;letter-spacing:1px;float:right;">本地关键词</span>`;

      const roastTitle = source === 'ai' ? '🤖 AI 洞察' : '💡 关键词分析';

      if (dom) {
        const roast = window.MCAnalyzer.roastSummary({ dominant: dom });
        const summaryText = summary ? `${summary}` : roast.text;
        html += `<div class="roast-box" style="margin-bottom:14px">
          <div class="roast-title">${roastTitle} ${sourceBadge}</div>
          <div class="roast-text" style="clear:both;margin-top:6px;"><strong>${dom.emoji} ${dom.label}</strong> · ${escapeHtml(summaryText)}</div>
        </div>`;
      } else {
        html += `<div class="roast-box" style="margin-bottom:14px">
          <div class="roast-title">${roastTitle} ${sourceBadge}</div>
          <div class="roast-text" style="clear:both;margin-top:6px;color:var(--muted);">情绪比较平稳～</div>
        </div>`;
      }

      if (emoEntries.length > 0) {
        html += `<div class="emotion-bars"><h4>📊 情绪维度</h4>`;
        emoEntries.forEach(([k, v]) => {
          const dict = window.MCAnalyzer.DICT[k];
          if (!dict) return;
          html += `<div class="emotion-bar-row">
            <div class="e-label">${dict.emoji} ${dict.label}</div>
            <div class="e-track"><div class="e-fill" style="width:${Math.min(v, 100)}%;background:${dict.color}"></div></div>
            <div class="e-val">${Math.round(v)}</div>
          </div>`;
        });
        html += `</div>`;
      }
    }
    $('#dd-content').innerHTML = html;
    diaryDetailModal.classList.add('show');
  }
  $('#btn-dd-close').addEventListener('click', () => { diaryDetailModal.classList.remove('show'); detailId = null; });
  $('#btn-dd-delete').addEventListener('click', () => {
    if (!confirm('确定删除这篇日记？')) return;
    window.MCStore.deleteDiary(detailId);
    diaryDetailModal.classList.remove('show');
    detailId = null;
    renderDiaryList();
    updateStats();
    showToast('已删除');
  });
  $('#btn-dd-edit').addEventListener('click', () => {
    const id = detailId;
    diaryDetailModal.classList.remove('show');
    detailId = null;
    openDiaryWrite(id);
  });
  diaryDetailModal.addEventListener('click', (e) => { if (e.target === diaryDetailModal) { diaryDetailModal.classList.remove('show'); detailId = null; } });

  // ---------- 小树绘制（canvas） ----------
  function renderMoodTree(canvasId, tree) {
    const c = document.getElementById(canvasId);
    if (!c) return;
    const stage = tree && typeof tree.stage !== 'undefined' ? tree.stage : 0;
    const dpr = window.devicePixelRatio || 1;
    const cssW = c.clientWidth || 200;
    const cssH = c.clientHeight || 160;
    c.width = cssW * dpr;
    c.height = cssH * dpr;
    c.style.height = cssH + 'px';
    const tctx = c.getContext('2d');
    tctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    tctx.clearRect(0, 0, cssW, cssH);

    // 基础位置
    const groundY = cssH - 25;
    const trunkX = cssW / 2;

    // 微风摇摆参数（用时间让树轻轻动）
    const t = (Date.now() % 6000) / 6000;
    const sway = Math.sin(t * Math.PI * 2) * 2;

    // 地面（柔和土色）
    tctx.fillStyle = '#F5E6D3';
    tctx.beginPath();
    tctx.ellipse(trunkX, groundY + 8, 70, 8, 0, 0, Math.PI * 2);
    tctx.fill();
    tctx.fillStyle = 'rgba(139,115,85,0.15)';
    tctx.beginPath();
    tctx.ellipse(trunkX, groundY + 6, 65, 5, 0, 0, Math.PI * 2);
    tctx.fill();

    // Stage 0: 种子
    if (stage === 0) {
      tctx.fillStyle = '#8B7355';
      tctx.beginPath();
      tctx.ellipse(trunkX, groundY - 4, 7, 10, Math.PI / 10, 0, Math.PI * 2);
      tctx.fill();
      // 小芽
      tctx.strokeStyle = '#7FB77E';
      tctx.lineWidth = 1.5;
      tctx.beginPath();
      tctx.moveTo(trunkX, groundY - 4);
      tctx.quadraticCurveTo(trunkX + 2, groundY - 10, trunkX - 1, groundY - 16);
      tctx.stroke();
      return;
    }

    // Stage 1-5: 有树干
    const trunkHeight = 10 + stage * 10;  // 20,30,40,50,60
    const trunkTopY = groundY - trunkHeight;

    // 树干
    tctx.strokeStyle = '#8B6F47';
    tctx.lineWidth = 3 + stage * 0.5;
    tctx.lineCap = 'round';
    tctx.beginPath();
    tctx.moveTo(trunkX, groundY);
    tctx.quadraticCurveTo(trunkX + sway, groundY - trunkHeight / 2, trunkX + sway * 1.5, trunkTopY);
    tctx.stroke();

    // 分支（stage >=2 才有）
    if (stage >= 2) {
      tctx.lineWidth = 2;
      // 左分支
      tctx.beginPath();
      tctx.moveTo(trunkX + sway, groundY - trunkHeight * 0.6);
      tctx.quadraticCurveTo(trunkX - 15 + sway, groundY - trunkHeight * 0.8, trunkX - 22 + sway, groundY - trunkHeight * 0.95);
      tctx.stroke();
      // 右分支
      tctx.beginPath();
      tctx.moveTo(trunkX + sway, groundY - trunkHeight * 0.5);
      tctx.quadraticCurveTo(trunkX + 15 + sway, groundY - trunkHeight * 0.75, trunkX + 25 + sway, groundY - trunkHeight * 0.9);
      tctx.stroke();
    }
    if (stage >= 3) {
      tctx.lineWidth = 1.5;
      // 小分支
      tctx.beginPath();
      tctx.moveTo(trunkX + sway * 1.2, groundY - trunkHeight * 0.75);
      tctx.quadraticCurveTo(trunkX - 8 + sway, groundY - trunkHeight * 0.85, trunkX - 12 + sway, groundY - trunkHeight * 0.92);
      tctx.stroke();
    }

    // 树冠（随 stage 增大）
    // 叶子颜色从嫩到深
    const leafColors = ['#B5D99C', '#7FB77E', '#5A8C52', '#6B9F5E', '#4E8C4C'];
    const color = leafColors[Math.min(stage - 1, leafColors.length - 1)];
    const crownR = 18 + (stage - 1) * 8;

    // 主树冠
    tctx.fillStyle = color;
    tctx.beginPath();
    tctx.arc(trunkX + sway * 1.5, trunkTopY - crownR * 0.3, crownR, 0, Math.PI * 2);
    tctx.fill();

    // 额外叶子团（stage >=3）
    if (stage >= 3) {
      tctx.fillStyle = color;
      tctx.beginPath();
      tctx.arc(trunkX - crownR * 0.7 + sway, trunkTopY, crownR * 0.8, 0, Math.PI * 2);
      tctx.fill();
      tctx.beginPath();
      tctx.arc(trunkX + crownR * 0.7 + sway, trunkTopY, crownR * 0.8, 0, Math.PI * 2);
      tctx.fill();
    }

    // 高光
    tctx.fillStyle = 'rgba(255,255,255,0.25)';
    tctx.beginPath();
    tctx.arc(trunkX - crownR * 0.35 + sway, trunkTopY - crownR * 0.35, crownR * 0.3, 0, Math.PI * 2);
    tctx.fill();

    // 花（stage >=5 繁花盛开）
    if (stage >= 5) {
      const flowerColors = ['#FF6B9D', '#FFB5C5', '#FFD93D', '#C4B5FD'];
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + t * 0.5;
        const fx = trunkX + Math.cos(angle) * (crownR + 3) + sway;
        const fy = trunkTopY + Math.sin(angle) * (crownR * 0.7);
        tctx.fillStyle = flowerColors[i % flowerColors.length];
        tctx.beginPath();
        tctx.arc(fx, fy, 4, 0, Math.PI * 2);
        tctx.fill();
      }
      // 一些落下的花瓣
      for (let i = 0; i < 3; i++) {
        const fy = groundY - 2 - i * 5;
        const fx = trunkX - 30 + i * 25 + sway;
        tctx.fillStyle = flowerColors[i % flowerColors.length];
        tctx.beginPath();
        tctx.arc(fx, fy, 2, 0, Math.PI * 2);
        tctx.fill();
      }
    }
  }

  // ---------- 深呼吸引导 ----------
  let breathTimer = null;
  function showBreathingGuide() {
    const guide = document.getElementById('breathing-guide');
    if (!guide) return;
    if (guide.classList.contains('show')) return;
    const text = document.getElementById('breath-text');
    guide.classList.add('show');
    let step = 0;
    const steps = ['慢慢吸气…', '…', '现在呼气…', '…'];
    if (text) text.textContent = steps[0];
    let tick = 0;
    breathTimer = setInterval(() => {
      tick++;
      if (tick < 4 && text) text.textContent = steps[tick % steps.length];
      if (tick >= 5) {
        clearInterval(breathTimer);
        hideBreathingGuide();
        // 深呼吸之后再给鼓励
        setTimeout(() => {
          const isAnger = state.mode === 'anger';
          const pool = isAnger
            ? ['愤怒是有力量的。现在，把它慢慢放掉。', '炸完了，记得对自己温柔一点。', '发泄完了，就别再扛着了。']
            : ['深呼吸一下。今天的你，已经很了不起了。', '呼气的时候，记得把肩膀放下来。', '这样就很好了。'];
          showToast('🌿 ' + pool[Math.floor(Math.random() * pool.length)]);
        }, 300);
      }
    }, 800);
  }
  function hideBreathingGuide() {
    const guide = document.getElementById('breathing-guide');
    if (guide) guide.classList.remove('show');
  }

  // 初始化聊天区
  function initChat() {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;

    // 显示欢迎消息
    if (chatMessages.children.length === 0) {
      const welcomes = [
        '嗨，今天感觉怎么样？ 🌸',
        '欢迎来到这里，随时跟我说 💕',
        '先深呼吸一下，准备好了再开始 🌙',
        '无论什么心情，我都在听 🤗',
      ];
      const welcome = welcomes[Math.floor(Math.random() * welcomes.length)];
      addChatMessage(welcome, false);
      ventChatHistory.push({ role: 'assistant', content: welcome });
    }
  }

  // ---------- 日记小回信 ----------
  function showDiaryEcho(content) {
    const card = document.getElementById('echo-card');
    const echoContent = document.getElementById('echo-content');
    if (!card || !echoContent) return;
    let snippet = '';
    if (content && content.length > 4) {
      const short = content.length > 40 ? content.substring(0, 40) + '…' : content;
      snippet = `<div class="echo-line"><em style="color:var(--accent4);font-style:italic;">"${escapeHtml(short)}"</em></div>`;
    }
    const types = ['empathy', 'affirm', 'gentle', 'ask'];
    const type = types[Math.floor(Math.random() * types.length)];
    const pool = ECHO_POOLS[type] || ECHO_POOLS.empathy;
    const echo = pool[Math.floor(Math.random() * pool.length)];
    let html = '';
    if (snippet) {
      html = `${snippet}<div class="echo-line">${echo}</div>`;
    } else {
      html = `<div class="echo-line">${echo}</div>`;
    }
    echoContent.innerHTML = html;
    card.style.display = 'block';
    setTimeout(() => card.classList.add('show'), 20);
  }

  function hideDiaryEcho() {
    const card = document.getElementById('echo-card');
    if (card) {
      card.classList.remove('show');
      setTimeout(() => { card.style.display = 'none'; }, 400);
    }
  }

  // ---------- 新手引导 ----------
  function showOnboarding() {
    const overlay = document.getElementById('onboard-overlay');
    if (!overlay) return;
    // 移除可能存在的 hide 类，确保能显示
    overlay.classList.remove('hide');
    // 添加 show 类触发显示
    overlay.classList.add('show');
  }
  function hideOnboarding() {
    const overlay = document.getElementById('onboard-overlay');
    if (!overlay) return;
    // 移除 show 类触发隐藏
    overlay.classList.remove('show');
    // 延迟设置 localStorage，等待动画完成
    setTimeout(() => {
      localStorage.setItem('mc_onboarded_v2', '1');
    }, 400);
  }

  // ---------- 情绪快速选择器 ----------
  function initMoodSelector() {
    const items = document.querySelectorAll('.mood-item');
    items.forEach(item => {
      item.addEventListener('click', () => {
        const text = item.dataset.text || '';
        const mood = item.dataset.mood || '';
        if (!text) return;

        // 安抚优先：走倾诉流程
        const input = document.getElementById('worry-input');
        if (input) {
          input.value = text;
        }

        // 调用addWorry进入倾诉模式
        addWorry(text);

        items.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        setTimeout(() => item.classList.remove('active'), 800);
      });
    });
  }

  // ---------- 情绪能量条 ----------
  let energyValue = 0;
  function updateEnergyBar() {
    const bar = document.getElementById('energy-bar');
    const fill = document.getElementById('energy-fill');
    const stage = document.getElementById('energy-stage');
    const icon = document.getElementById('energy-icon');
    const pctEl = document.getElementById('energy-pct');
    if (!bar || !fill) return;
    
    const targetPct = Math.min(100, state.combo * 8 + state.today * 2);
    energyValue = energyValue + (targetPct - energyValue) * 0.15;
    
    fill.style.width = energyValue.toFixed(1) + '%';
    
    let stageText = '释放中';
    let iconText = '💫';
    if (energyValue < 20) { stageText = '积攒中'; iconText = '🌱'; }
    else if (energyValue < 50) { stageText = '释放中'; iconText = '💫'; }
    else if (energyValue < 80) { stageText = '畅快中'; iconText = '✨'; }
    else { stageText = '完美释放'; iconText = '🌟'; }
    
    if (state.mode === 'anger') {
      if (energyValue < 30) { stageText = '燃烧中'; iconText = '🔥'; }
      else if (energyValue < 60) { stageText = '爆发中'; iconText = '💥'; }
      else if (energyValue < 90) { stageText = '炸裂中'; iconText = '⚡'; }
      else { stageText = '已炸翻'; iconText = '💣'; }
    }
    
    if (stage) stage.textContent = stageText;
    if (icon) icon.textContent = iconText;
    if (pctEl) pctEl.textContent = Math.round(energyValue) + '%';
    
    if (energyValue > 60) bar.classList.add('glow');
    else bar.classList.remove('glow');
  }

  // ---------- 随机发泄按钮（随便发泄） ----------
  function generateRandomClouds(count, theme) {
    const usedTexts = new Set(state.clouds.map(c => c.text));
    const themes = {
      work: ['今天工作好累', '老板又在催了', '加班加到怀疑人生', '同事真难沟通', '这个需求太离谱'],
      study: ['考试压力好大', '论文写不出来', '又要背书了', '同学好卷我好慌', '听不懂但不敢问'],
      emotion: ['好想谈恋爱', '又被拒绝了', '他是不是不爱我了', '想被抱抱', '一个人好孤独'],
      life: ['没钱了', '房租又涨了', '家人生病了', '看不到希望', '我好累想躺平'],
      gentle: ['今天心情还不错', '喝了杯喜欢的奶茶', '路上遇到可爱的猫', '听到一首好歌', '窗外的风景很美']
    };
    let pool = themes.gentle;
    if (theme === 'mixed') {
      pool = [...themes.work, ...themes.study, ...themes.emotion, ...themes.life, ...themes.gentle];
    } else if (themes[theme]) {
      pool = themes[theme];
    }
    
    let added = 0;
    let tries = 0;
    while (added < count && tries < count * 4) {
      tries++;
      const text = pool[Math.floor(Math.random() * pool.length)];
      if (usedTexts.has(text)) continue;
      usedTexts.add(text);
      const margin = 70;
      const cx = margin + Math.random() * Math.max(80, W - margin * 2);
      const cy = 70 + Math.random() * Math.max(60, H * 0.55);
      const cloud = new Cloud(text, cx, H + 60);
      cloud.targetY = cy;
      state.clouds.push(cloud);
      added++;
    }
    if (added > 0) {
      emptyHint.classList.add('hide');
      showToast(`☁️ 生成了 ${added} 朵情绪云朵`, 'accent');
    } else {
      showToast('云朵有点多啦，先戳破一些吧~', 'accent');
    }
  }

  // ---------- Report ----------
  function openReport() {
    const burstData = window.MCStore.getTodayBurst();
    const diaries = window.MCStore.getTodayDiaries();
    const items = burstData.items;
    const isAngerSession = burstData.items.some(i => i.mood === 'anger');
    const allDiaries = window.MCStore.getDiaries();

    // 如果什么都没有，提示一下
    if (items.length === 0 && state.today === 0 && diaries.length === 0) {
      showToast('先发泄一下或写篇日记再来吧 ✨');
      return;
    }

    // 释放率
    const intensity = items.length + diaries.length * 2;
    const releasePct = Math.min(100, Math.round(intensity * 8 + (isAngerSession ? 20 : 0)));
    $('#rpt-pct').textContent = releasePct + '%';
    setTimeout(() => {
      const ring = document.getElementById('rpt-ring');
      if (ring) ring.style.strokeDashoffset = String(502 - (502 * releasePct / 100));
    }, 50);

    // 释放率故事化描述
    let releaseStory = '';
    if (items.length === 0 && diaries.length > 0) {
      releaseStory = '今天，你写了' + diaries.length + '篇日记。把心里的话说出来，本身就是一种释放。';
    } else if (items.length > 0 && diaries.length === 0) {
      releaseStory = '你戳爆了' + items.length + '朵坏情绪。让它们变成烟花飞走了。';
    } else if (items.length > 0 && diaries.length > 0) {
      releaseStory = '戳爆' + items.length + '朵坏情绪，写了' + diaries.length + '篇日记。你今天真的很认真地对待自己。';
    } else {
      releaseStory = '今天什么都没做——那就休息吧。允许自己什么都不做。';
    }
    const storyEl = document.getElementById('rpt-story');
    if (storyEl) storyEl.textContent = releaseStory;

    // 头部 - 叙事化标题
    if (isAngerSession) {
      const badge = document.getElementById('rpt-badge');
      if (badge) { badge.classList.add('anger'); badge.textContent = 'AFTER · 爆炸之后'; }
      document.getElementById('rpt-title').textContent = ANGER_TITLES[Math.floor(Math.random() * ANGER_TITLES.length)];
      document.getElementById('report-card').classList.add('anger');
    } else {
      const badge = document.getElementById('rpt-badge');
      if (badge) { badge.classList.remove('anger'); badge.textContent = 'TODAY · 给今天的你'; }
      document.getElementById('rpt-title').textContent = NARRATIVE_TITLES[Math.floor(Math.random() * NARRATIVE_TITLES.length)];
      document.getElementById('report-card').classList.remove('anger');
    }
    const d = new Date();
    document.getElementById('rpt-date').textContent = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;

    // roast-box：给今天的你 - 情绪分析 + 一句话回应
    const roastBox = document.getElementById('rpt-roast');
    const roastTitle = document.getElementById('rpt-roast-title');
    const roastText = document.getElementById('rpt-roast-text');
    if (roastBox && roastTitle && roastText) {
      roastBox.classList.toggle('anger', isAngerSession);
      const a = window.MCAnalyzer.analyzeMultiple(items.map(i => i.text).concat(diaries.map(d => d.content)));
      const roast = window.MCAnalyzer.roastSummary(a);
      if (isAngerSession) {
        roastTitle.textContent = '🔥 给炸完的你';
        roastText.textContent = '刚才那一下，替你的委屈出了气。这一秒，请对自己温柔一点。';
      } else if (roast && roast.text) {
        roastTitle.textContent = '💭 给今天的你';
        roastText.textContent = roast.text;
      } else {
        roastTitle.textContent = '💭 给今天的你';
        roastText.textContent = '你今天，已经很了不起了。';
      }
    }

    // 安慰长文（分层 3-4 段，叙事化，引用日记内容）
    const lines = [];
    lines.push(pickRandom(COMFORT_LINES.general));
    lines.push(pickRandom(COMFORT_LINES.release));
    if (isAngerSession) lines.push(pickRandom(COMFORT_LINES.soothe));
    lines.push(pickRandom(COMFORT_LINES.encourage));
    // 如果有日记，加入一段引用
    if (diaries.length > 0) {
      const refDiary = diaries[Math.floor(Math.random() * diaries.length)];
      const content = refDiary.content || '';
      if (content.length > 4) {
        const ref = content.length > 40 ? content.substring(0, 40) + '…' : content;
        lines.push(`你今天写道：<span style="color:var(--accent4);font-style:italic;">"${escapeHtml(ref)}"</span>——谢谢你写下来了。`);
      }
    }
    reportComfort.innerHTML = lines.map(l => `<div class="comfort-line">${l}</div>`).join('');
    const lineEls = reportComfort.querySelectorAll('.comfort-line');
    lineEls.forEach((el, i) => {
      setTimeout(() => el.classList.add('show'), 300 + i * 220);
    });

    // 小树展示
    const tree = window.MCStore.getTree();
    $('#tree-leaves').textContent = (tree.strengthLeaves || 0) + tree.gentleFlowers;
    $('#tree-flowers').textContent = (tree.gentleFlowers || 0);
    const stageNames = ['种子', '发芽了', '小树苗', '小树', '大树', '繁花盛开'];
    const stageName = stageNames[Math.min(tree.stage || 0, stageNames.length - 1)];
    document.getElementById('tree-stage').textContent = stageName;
    setTimeout(() => renderMoodTree('tree-canvas', tree), 100);

    // 情绪回顾（温柔版）
    const recapBody = document.getElementById('rpt-recap-body');
    if (recapBody) {
      let recap = '';
      if (allDiaries.length === 0) {
        recap = '你写了' + diaries.length + '篇日记。再写几篇，就能看见自己的心情地图了。';
      } else {
        // 统计出现的情绪关键词（简单版：按关键词关键词匹配）
        const counts = { stress: 0, anger: 0, anxiety: 0, sadness: 0, lonely: 0, joy: 0 };
        const allText = allDiaries.map(d => d.content).concat(items.map(i => i.text)).join(' ');
        Object.keys(window.MCAnalyzer.DICT).forEach(key => {
          const dict = window.MCAnalyzer.DICT[key];
          if (!dict || !dict.words) return;
          dict.words.forEach(w => {
            const idx = allText.indexOf(w);
            if (idx >= 0) counts[key] = (counts[key] || 0) + 1;
          });
        });
        // 按计数排序
        const entries = Object.entries(counts).filter(([k, v]) => v > 0).sort((a, b) => b[1] - a[1]);
        if (entries.length === 0) {
          recap = '你写了' + allDiaries.length + '篇日记。每一篇都是你和自己对话的痕迹。';
        } else {
          const top = entries.slice(0, 3);
          const emoText = top.map(([k, v]) => {
            const dict = window.MCAnalyzer.DICT[k];
            return dict ? `${dict.emoji}${dict.label}` : k;
          }).join('、');
          recap = `最近，${emoText}在你的日记里出现过。它们来的时候，你都会写下来——这是很成熟的事。`;
        }
      }
      recapBody.innerHTML = `<div style="line-height:1.75;color:var(--ink);font-size:14px;">${recap}</div>`;
    }

    // 致你的一封信 - 真正像信
    const letter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
    const today = new Date();
    const monthDay = `${today.getMonth() + 1}月${today.getDate()}日`;
    reportLetterText.innerHTML = `<span style="color:var(--accent4);font-style:italic;">亲爱的你，</span><br><br>${letter}<br><br><span style="color:var(--muted);font-size:12px;">——来自${monthDay}的树洞</span>`;

    // 碎碎念（隐藏，原版）
    const burstSection = document.getElementById('rpt-burst-section');
    if (burstSection) burstSection.style.display = 'none';

    reportModal.classList.add('show');

    // 让小树动画持续
    if (typeof window.__treeAnim === 'undefined') {
      window.__treeAnim = setInterval(() => {
        const treeNow = window.MCStore.getTree();
        renderMoodTree('tree-canvas', treeNow);
      }, 200);
    }
  }

  function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }
  $('#btn-close-report').addEventListener('click', () => reportModal.classList.remove('show'));
  reportModal.addEventListener('click', (e) => { if (e.target === reportModal) reportModal.classList.remove('show'); });

  // 日记小回信按钮事件
  $('#echo-close').addEventListener('click', () => {
    hideDiaryEcho();
  });

  // 生成今日云朵按钮
  $('#btn-generate-clouds').addEventListener('click', () => {
    if (state.mode === 'anger') {
      showToast('🌧️ 请先切换到治愈模式哦', 'accent');
      return;
    }
    generateTodayClouds(5);
  });

  $('#btn-share').addEventListener('click', () => {
    // "继续发泄"按钮：关闭报告，自动补充新炸弹
    reportModal.classList.remove('show');
    if (state.mode === 'anger') {
      // 延迟一下，让报告关闭动画完成
      setTimeout(() => {
        autoFillAnger(6 + Math.floor(Math.random() * 4));
        showToast('💥 新的炸弹已就位，继续炸！', 'anger');
        shakeScreen('medium');
        flashRed(0.45);
      }, 250);
    } else {
      setTimeout(() => {
        if (state.clouds.length < 3) {
          showToast('☁️ 继续扔点云朵吧~');
        }
      }, 200);
    }
  });

  // ---------- Radar ----------
  function drawRadar(scores) {
    const c = $('#rpt-radar');
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    const cssW = c.clientWidth || 280;
    const cssH = 220;
    c.width = cssW * dpr;
    c.height = cssH * dpr;
    c.style.height = cssH + 'px';
    const cctx = c.getContext('2d');
    cctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cctx.clearRect(0, 0, cssW, cssH);

    const cx = cssW / 2, cy = cssH / 2;
    const R = Math.min(cssW, cssH) / 2 - 28;
    const axes = [
      { key: 'stress', label: '压力' },
      { key: 'anger',  label: '愤怒' },
      { key: 'anxiety',label: '焦虑' },
      { key: 'sadness',label: '悲伤' },
      { key: 'lonely', label: '孤独' },
      { key: 'joy',    label: '喜悦' },
    ];
    const n = axes.length;

    // 网格
    cctx.strokeStyle = 'rgba(45,45,68,0.1)';
    cctx.lineWidth = 1;
    for (let level = 1; level <= 4; level++) {
      cctx.beginPath();
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 - Math.PI / 2;
        const r = (R * level) / 4;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        if (i === 0) cctx.moveTo(x, y); else cctx.lineTo(x, y);
      }
      cctx.closePath();
      cctx.stroke();
    }

    // 轴
    cctx.strokeStyle = 'rgba(45,45,68,0.15)';
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      cctx.beginPath();
      cctx.moveTo(cx, cy);
      cctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
      cctx.stroke();
    }

    // 数据
    cctx.fillStyle = 'rgba(255, 107, 157, 0.25)';
    cctx.strokeStyle = '#FF6B9D';
    cctx.lineWidth = 2;
    cctx.beginPath();
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      const v = (scores[axes[i].key] || 0) / 100;
      const r = R * v;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      if (i === 0) cctx.moveTo(x, y); else cctx.lineTo(x, y);
    }
    cctx.closePath();
    cctx.fill();
    cctx.stroke();

    // 点
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      const v = (scores[axes[i].key] || 0) / 100;
      const r = R * v;
      cctx.fillStyle = window.MCAnalyzer.DICT[axes[i].key].color;
      cctx.beginPath();
      cctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 3.5, 0, Math.PI * 2);
      cctx.fill();
    }

    // 标签
    cctx.fillStyle = '#2D2D44';
    cctx.font = '600 11px Outfit, sans-serif';
    cctx.textAlign = 'center';
    cctx.textBaseline = 'middle';
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      const dict = window.MCAnalyzer.DICT[axes[i].key];
      const lx = cx + Math.cos(a) * (R + 18);
      const ly = cy + Math.sin(a) * (R + 18);
      cctx.fillText(dict.emoji + axes[i].label, lx, ly);
    }
  }

  // ---------- 工具 ----------
  function escapeHtml(s) {
    return (s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // ---------- 键盘 ----------
  document.addEventListener('keydown', (e) => {
    if (e.key === ' ' && document.activeElement !== input && document.activeElement !== $('#diary-content')) {
      e.preventDefault();
      openReport();
    }
    if (e.key === 'Escape') {
      $$('.modal-mask.show').forEach(m => m.classList.remove('show'));
    }
  });

  // 双击空白查看报告
  let lastTap = 0;
  canvas.addEventListener('dblclick', openReport);
  canvas.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTap < 300) {
      const { x, y } = getPos(e.changedTouches[0] || e);
      if (x !== undefined && y !== undefined) {
        const rect = canvas.getBoundingClientRect();
        const px = x - rect.left, py = y - rect.top;
        if (!getHit(px, py)) openReport();
      }
    }
    lastTap = now;
  });

  // ---------- Render loop ----------
  let lastT = performance.now();
  function frame(now) {
    const dt = Math.min(0.06, (now - lastT) / 1000);
    lastT = now;
    ctx.clearRect(0, 0, W, H);

    for (let i = state.floaters.length - 1; i >= 0; i--) {
      const f = state.floaters[i];
      f.x += f.vx; f.y += f.vy;
      f.life -= 0.002;
      if (f.life <= 0 || f.y < -20) { state.floaters.splice(i, 1); continue; }
      ctx.save();
      ctx.globalAlpha = f.alpha * f.life;
      ctx.fillStyle = f.color;
      ctx.font = `${f.size}px Silkscreen, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(f.text, f.x, f.y);
      ctx.restore();
    }

    for (let i = state.clouds.length - 1; i >= 0; i--) {
      const c = state.clouds[i];
      c.update(dt);
      c.draw();
    }

    for (let i = state.particles.length - 1; i >= 0; i--) {
      const p = state.particles[i];
      p.update();
      p.draw();
      if (p.life <= 0) state.particles.splice(i, 1);
    }

    // 绘制点击反馈效果
    if (state.clickFeedbacks && state.clickFeedbacks.length > 0) {
      for (let i = state.clickFeedbacks.length - 1; i >= 0; i--) {
        const f = state.clickFeedbacks[i];
        const elapsed = now - f.startTime;
        const progress = elapsed / f.duration;
        if (progress >= 1) {
          state.clickFeedbacks.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.globalAlpha = 1 - progress;
        ctx.strokeStyle = f.isAnger ? '#FF4444' : '#FF6B9D';
        ctx.lineWidth = 3;
        ctx.beginPath();
        const radius = 20 + progress * 30;
        ctx.arc(f.x, f.y, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    // 任务2：画布内 combo 指示（顶部居中，依 combo 大小变化）
    if (state.combo > 0 && state.comboShownAt > 0) {
      const elapsed = now - state.comboShownAt;
      // 1.5s 保持，0.5s 淡出
      const fadeStart = 1500;
      const fadeDur = 500;
      let opacity;
      if (elapsed < fadeStart) opacity = Math.min(1.0, 0.2 + elapsed / 300);
      else if (elapsed < fadeStart + fadeDur) opacity = 1.0 - (elapsed - fadeStart) / fadeDur;
      else opacity = 0;
      if (opacity > 0) {
        ctx.save();
        const combo = state.combo;
        let fontSize;
        if (combo >= 15) fontSize = 44 + Math.min(12, (combo - 15));
        else if (combo >= 5) fontSize = 32;
        else fontSize = 22;
        ctx.globalAlpha = opacity;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        const isAnger = state.mode === 'anger';
        if (isAnger) {
          ctx.shadowColor = 'rgba(255, 120, 0, 0.85)';
          ctx.shadowBlur = combo >= 15 ? 18 : 10;
          ctx.fillStyle = combo >= 10 ? '#FF3030' : '#FF9900';
          ctx.font = `700 ${fontSize}px Outfit, "PingFang SC", sans-serif`;
          const text = `${combo} 连炸！`;
          ctx.fillText(text, W / 2, 18);
          ctx.shadowBlur = 0;
          ctx.font = `600 ${Math.max(12, fontSize / 2)}px Outfit, sans-serif`;
          ctx.fillStyle = '#FFE066';
          ctx.fillText('🔥', W / 2, 18 + fontSize + 2);
        } else {
          ctx.shadowColor = 'rgba(255, 255, 255, 0.6)';
          ctx.shadowBlur = combo >= 15 ? 12 : 6;
          ctx.fillStyle = 'rgba(51, 51, 51, 0.85)';
          ctx.font = `600 ${fontSize}px Outfit, "PingFang SC", sans-serif`;
          const text = `${combo} 连击 ✨`;
          ctx.fillText(text, W / 2, 18);
        }
        ctx.restore();
      }
    }

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // ---------- AI 设置 ----------
  const settingsModal = $('#settings-modal');
  const configFormModal = $('#config-form-modal');
  const aiEnabledToggle = $('#ai-enabled-toggle');
  const aiConfigSelect = $('#ai-config-select');
  const aiCurrentConfig = $('#ai-current-config');
  const aiConfigList = $('#ai-config-list');

  let editingConfigId = null;

  function openSettings() {
    refreshSettingsUI();
    settingsModal.classList.add('show');
  }

  function closeSettings() {
    settingsModal.classList.remove('show');
  }

  function refreshSettingsUI() {
    if (!window.MCAIConfig) return;
    // AI 总开关
    aiEnabledToggle.checked = window.MCAIConfig.isAIEnabled();
    // 刷新配置列表
    refreshConfigList();
    // 刷新当前配置显示
    refreshCurrentConfig();
  }

  function refreshConfigList() {
    if (!window.MCAIConfig) return;
    const configs = window.MCAIConfig.getConfigs();
    const activeId = window.MCAIConfig.getActiveConfig()?.id || '';

    aiConfigSelect.innerHTML = '<option value="">-- 未选择 --</option>' +
      configs.map(c => `<option value="${c.id}" ${c.id === activeId ? 'selected' : ''}>${c.name}</option>`).join('');

    aiConfigList.innerHTML = configs.map(c => {
      const maskedKey = window.MCAIConfig.maskKey(c.apiKey);
      const isActive = c.id === activeId;
      return `<div class="config-item ${isActive ? 'active' : ''}" data-id="${c.id}">
        <div class="config-item-info">
          <div class="config-item-name">${escapeHtml(c.name)} ${isActive ? '✓' : ''}</div>
          <div class="config-item-detail">${c.provider} · ${c.model} · ${maskedKey}</div>
        </div>
        <div class="config-item-actions">
          <button class="icon-btn btn-edit-config" title="编辑">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="icon-btn btn-delete-config" title="删除">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>`;
    }).join('');

    // 绑定事件
    aiConfigList.querySelectorAll('.btn-edit-config').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.closest('.config-item').dataset.id;
        openConfigForm(id);
      });
    });
    aiConfigList.querySelectorAll('.btn-delete-config').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.closest('.config-item').dataset.id;
        if (confirm('确定删除这个配置？')) {
          window.MCAIConfig.deleteConfig(id);
          refreshConfigList();
          refreshCurrentConfig();
        }
      });
    });
  }

  function refreshCurrentConfig() {
    if (!window.MCAIConfig) return;
    const cfg = window.MCAIConfig.getActiveConfig();
    if (!cfg) {
      aiCurrentConfig.style.display = 'none';
      return;
    }
    aiCurrentConfig.style.display = 'block';
    const maskedKey = window.MCAIConfig.maskKey(cfg.apiKey);
    aiCurrentConfig.innerHTML = `
      <div class="cfg-line"><span class="cfg-label">名称</span><span class="cfg-value">${escapeHtml(cfg.name)}</span></div>
      <div class="cfg-line"><span class="cfg-label">Provider</span><span class="cfg-value">${escapeHtml(cfg.provider)}</span></div>
      <div class="cfg-line"><span class="cfg-label">模型</span><span class="cfg-value">${escapeHtml(cfg.model)}</span></div>
      <div class="cfg-line"><span class="cfg-label">API Key</span><span class="cfg-value">${maskedKey}</span></div>
    `;
  }

  // ---------- 厂商预设 ----------
  const VENDOR_PRESETS = {
    zhipu: {
      name: '我的智谱 AI',
      url: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
      model: 'glm-4-flash',
      apiKeyPlaceholder: 'your zhipu api key',
    },
    qwen: {
      name: '我的通义千问',
      url: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
      model: 'qwen-plus',
      apiKeyPlaceholder: 'your dashscope api key',
    },
    deepseek: {
      name: '我的 DeepSeek',
      url: 'https://api.deepseek.com/chat/completions',
      model: 'deepseek-chat',
      apiKeyPlaceholder: 'your deepseek api key',
    },
    moonshot: {
      name: '我的月之暗面 Kimi',
      url: 'https://api.moonshot.cn/v1/chat/completions',
      model: 'moonshot-v1-8k',
      apiKeyPlaceholder: 'your moonshot api key',
    },
    doubao: {
      name: '我的豆包',
      url: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
      model: 'doubao-pro-4k',
      apiKeyPlaceholder: 'your volcengine/ark api key',
    },
    spark: {
      name: '我的讯飞星火',
      url: 'https://spark-api-open.xf-yun.com/v1/chat/completions',
      model: 'generalv3.5',
      apiKeyPlaceholder: 'your xfyun api key',
    },
    yi: {
      name: '我的零一万物',
      url: 'https://api.lingyiwanwu.com/v1/chat/completions',
      model: 'yi-lightning',
      apiKeyPlaceholder: 'your 01.ai api key',
    },
    baichuan: {
      name: '我的百川',
      url: 'https://api.baichuan-ai.com/v1/chat/completions',
      model: 'Baichuan4',
      apiKeyPlaceholder: 'your baichuan api key',
    },
    minimax: {
      name: '我的 MiniMax',
      url: 'https://api.minimax.chat/v1/chat/completions',
      model: 'abab6.5s-chat',
      apiKeyPlaceholder: 'your minimax api key',
    },
    siliconflow: {
      name: '我的硅基流动',
      url: 'https://api.siliconflow.cn/v1/chat/completions',
      model: 'Qwen/Qwen2.5-7B-Instruct',
      apiKeyPlaceholder: 'your siliconflow api key',
    },
    ollama: {
      name: '我的本地 Ollama',
      url: 'http://localhost:11434/v1/chat/completions',
      model: 'llama3',
      apiKeyPlaceholder: '留空或填 ollama',
    },
    openai: {
      name: '我的 OpenAI',
      url: 'https://api.openai.com/v1/chat/completions',
      model: 'gpt-3.5-turbo',
      apiKeyPlaceholder: 'sk-...',
    },
    claude: {
      name: '我的 Claude',
      url: 'https://api.anthropic.com/v1/messages',
      model: 'claude-sonnet-4-20250514',
      apiKeyPlaceholder: 'sk-ant-...',
    },
    custom: {
      name: '自定义配置',
      url: 'https://api.example.com/v1/chat/completions',
      model: 'custom-model',
      apiKeyPlaceholder: 'your api key',
    },
  };

  function openConfigForm(id) {
    editingConfigId = id;
    const cfgFormBadge = $('#cfg-form-badge');
    const cfgFormTitle = $('#cfg-form-title');
    const cfgUrlInput = $('#cfg-url');
    const cfgKeyInput = $('#cfg-key');

    if (id) {
      const cfg = window.MCAIConfig.getConfigs().find(c => c.id === id);
      if (cfg) {
        cfgFormBadge.textContent = 'EDIT CONFIG';
        cfgFormTitle.textContent = '编辑配置';
        $('#cfg-name').value = cfg.name;
        $('#cfg-provider').value = cfg.provider;
        cfgUrlInput.value = cfg.apiUrl;
        cfgUrlInput.setAttribute('placeholder', VENDOR_PRESETS[cfg.provider]?.url || '');
        cfgKeyInput.value = cfg.apiKey;
        cfgKeyInput.setAttribute('placeholder', VENDOR_PRESETS[cfg.provider]?.apiKeyPlaceholder || 'your api key');
        $('#cfg-model').value = cfg.model;
      }
    } else {
      cfgFormBadge.textContent = 'ADD CONFIG';
      cfgFormTitle.textContent = '新增 AI 配置';
      const defaultProvider = 'zhipu';
      $('#cfg-name').value = VENDOR_PRESETS[defaultProvider].name;
      $('#cfg-provider').value = defaultProvider;
      cfgUrlInput.value = VENDOR_PRESETS[defaultProvider].url;
      cfgUrlInput.setAttribute('placeholder', VENDOR_PRESETS[defaultProvider].url);
      cfgKeyInput.value = '';
      cfgKeyInput.setAttribute('placeholder', VENDOR_PRESETS[defaultProvider].apiKeyPlaceholder);
      $('#cfg-model').value = VENDOR_PRESETS[defaultProvider].model;
    }
    configFormModal.classList.add('show');
  }

  // 切换 Provider 时自动填充默认值
  function onProviderChange() {
    const provider = $('#cfg-provider').value;
    const preset = VENDOR_PRESETS[provider] || VENDOR_PRESETS.custom;
    // 只有当名称还是默认名称时才替换，避免覆盖用户自定义名称
    const currentName = $('#cfg-name').value.trim();
    const isDefaultName = Object.values(VENDOR_PRESETS).some(p => p.name === currentName);
    if (isDefaultName || !currentName) {
      $('#cfg-name').value = preset.name;
    }
    $('#cfg-url').value = preset.url;
    $('#cfg-url').setAttribute('placeholder', preset.url);
    $('#cfg-model').value = preset.model;
    $('#cfg-key').setAttribute('placeholder', preset.apiKeyPlaceholder);
  }

  function closeConfigForm() {
    configFormModal.classList.remove('show');
    editingConfigId = null;
  }

  function saveConfig() {
    const name = $('#cfg-name').value.trim();
    const provider = $('#cfg-provider').value;
    const apiUrl = $('#cfg-url').value.trim();
    const apiKey = $('#cfg-key').value.trim();
    const model = $('#cfg-model').value.trim();

    if (!name || !apiUrl) {
      showToast('请填写配置名称和 API URL', 'anger');
      return;
    }
    // Ollama 本地模型不需要 API Key
    if (provider !== 'ollama' && !apiKey) {
      showToast('请填写 API Key', 'anger');
      return;
    }

    if (editingConfigId) {
      window.MCAIConfig.updateConfig(editingConfigId, { name, provider, apiUrl, apiKey, model });
    } else {
      const newCfg = window.MCAIConfig.addConfig({ name, provider, apiUrl, apiKey, model });
      window.MCAIConfig.setActiveConfig(newCfg.id);
    }
    closeConfigForm();
    refreshConfigList();
    refreshCurrentConfig();
    showToast('配置已保存', 'accent');
  }

  // AI 总开关
  aiEnabledToggle.addEventListener('change', () => {
    window.MCAIConfig.setAIEnabled(aiEnabledToggle.checked);
  });

  // 切换 Provider 时自动填充默认值
  $('#cfg-provider').addEventListener('change', onProviderChange);

  // 配置切换
  aiConfigSelect.addEventListener('change', () => {
    const id = aiConfigSelect.value;
    window.MCAIConfig.setActiveConfig(id || null);
    refreshConfigList();
    refreshCurrentConfig();
  });

  // 设置弹窗按钮
  $('#btn-settings').addEventListener('click', openSettings);
  $('#btn-close-settings').addEventListener('click', closeSettings);
  settingsModal.addEventListener('click', (e) => { if (e.target === settingsModal) closeSettings(); });

  // 添加配置按钮
  $('#btn-add-config').addEventListener('click', () => openConfigForm(null));

  // 测试连接按钮
  $('#btn-test-config').addEventListener('click', () => {
    const cfg = window.MCAIConfig.getActiveConfig();
    if (!cfg || !cfg.apiUrl) {
      showToast('请先选择或创建配置', 'anger');
      return;
    }
    // Ollama 本地模型不需要 API Key
    if (cfg.provider !== 'ollama' && !cfg.apiKey) {
      showToast('请先填写 API Key', 'anger');
      return;
    }
    showToast('正在测试连接...', 'accent');
    window.MCAIService.testConnection(cfg, (err, msg) => {
      if (err) {
        showToast('连接失败: ' + err.message, 'anger');
      } else {
        showToast('连接成功！', 'accent');
      }
    });
  });

  // 配置表单按钮
  $('#btn-cancel-config').addEventListener('click', closeConfigForm);
  $('#btn-save-config').addEventListener('click', saveConfig);
  configFormModal.addEventListener('click', (e) => { if (e.target === configFormModal) closeConfigForm(); });

  // API Key 显示/隐藏
  $('#btn-toggle-key-visibility').addEventListener('click', () => {
    const input = $('#cfg-key');
    const btn = $('#btn-toggle-key-visibility');
    if (input.type === 'password') {
      if (confirm('确定要显示 API Key？\n请注意不要让他人看到。')) {
        input.type = 'text';
        btn.textContent = '隐藏';
      }
    } else {
      input.type = 'password';
      btn.textContent = '显示';
    }
  });

  // ---------- Init ----------
  updateStats();
  // 初始化情绪快速选择器
  initMoodSelector();
  // 初始化聊天区 - 显示欢迎消息
  initChat();
  // 初始化能量条
  updateEnergyBar();
  // 初始化心情天气系统
  initWeather();
  // 初始化徽章系统
  updateBadgeDisplay();
  // 初始化彩蛋和每日小确幸
  initEasterEggListeners();
  showDailyBlessing();
  // 首次打开显示新手引导
  if (!localStorage.getItem('mc_onboarded_v2')) {
    setTimeout(() => {
      showOnboarding();
    }, 300);
  }

  // 新手引导按钮事件
  const startBtn = document.getElementById('btn-start');
  if (startBtn) {
    startBtn.addEventListener('click', hideOnboarding);
  }
  const onboardOverlay = document.getElementById('onboard-overlay');
  if (onboardOverlay) {
    onboardOverlay.addEventListener('click', (e) => {
      if (e.target.id === 'onboard-overlay') {
        hideOnboarding();
      }
    });
  }

  // 生成随机云朵按钮（随便发泄）
  const genBtn = document.getElementById('btn-generate-clouds');
  if (genBtn) {
    genBtn.addEventListener('click', () => {
      if (state.mode === 'anger') {
        quickBurst();
      } else {
        generateRandomClouds(5, 'mixed');
      }
    });
  }

  // 安慰按钮事件绑定（聊天样式）
  const btnReleaseClouds = document.getElementById('btn-release-clouds');
  if (btnReleaseClouds) {
    btnReleaseClouds.addEventListener('click', releaseAllClouds);
  }

  // 暴露
  window.MoodCrusher = { reset: () => $('#btn-reset').click(), openReport, setMode, state, updateEnergyBar, generateRandomClouds };
})();
