/* ============================================
   懂你 AI - 应用主逻辑
   ============================================ */

/* ---------- 工具函数 ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const store = {
  get(key, def) {
    try {
      const v = localStorage.getItem('dongni_' + key);
      return v ? JSON.parse(v) : def;
    } catch { return def; }
  },
  set(key, val) {
    localStorage.setItem('dongni_' + key, JSON.stringify(val));
  },
};

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

const today = () => new Date().toISOString().slice(0, 10);
const daysUntil = (dateStr) => {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  const now = new Date();
  target.setFullYear(now.getFullYear());
  if (target < now) target.setFullYear(now.getFullYear() + 1);
  return Math.ceil((target - now) / 86400000);
};
const daysSince = (dateStr) => {
  if (!dateStr) return 0;
  return Math.floor((new Date() - new Date(dateStr)) / 86400000);
};

const fmtDate = (d) => {
  if (!d) return '未设置';
  const dt = new Date(d);
  return `${dt.getFullYear()}.${(dt.getMonth() + 1).toString().padStart(2, '0')}.${dt.getDate().toString().padStart(2, '0')}`;
};

/* ---------- Toast / Modal ---------- */
function toast(msg, duration = 1800) {
  const root = $('#toast-root');
  root.innerHTML = `<div class="toast">${msg}</div>`;
  setTimeout(() => { root.innerHTML = ''; }, duration);
}

function modal(title, contentHtml, opts = {}) {
  const root = $('#modal-root');
  const close = () => { root.innerHTML = ''; };
  root.innerHTML = `
    <div class="modal-mask">
      <div class="modal-box">
        <div class="mb-close" data-close="1">×</div>
        <div class="mb-title">${title}</div>
        <div class="mb-content">${contentHtml}</div>
      </div>
    </div>`;
  root.querySelector('[data-close="1"]').onclick = close;
  root.querySelector('.modal-mask').addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-mask')) close();
  });
  if (opts.onMount) opts.onMount(root.querySelector('.mb-content'), close);
  return close;
}

/* ---------- Picker 移动端弹窗选择 ---------- */
const SVG_CHEVRON_RIGHT = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>`;

function picker({ title, options, value, onChange, doneLabel = '确定' }) {
  const normalized = options.map(o => typeof o === 'string' ? { value: o, label: o } : o);
  const root = $('#modal-root');
  let currentValue = value;
  let currentLabel = normalized.find(o => o.value === value)?.label || '';
  const close = () => { root.innerHTML = ''; };
  const render = () => {
    root.innerHTML = `
      <div class="picker-mask" data-picker>
        <div class="picker-sheet">
          <div class="picker-header">
            <button class="picker-cancel" data-cancel>取消</button>
            <div class="picker-title">${title}</div>
            <button class="picker-confirm" data-confirm>${doneLabel}</button>
          </div>
          <div class="picker-options">
            ${normalized.map(o => `
              <div class="picker-option ${o.value === currentValue ? 'selected' : ''}" data-val="${escapeAttr(o.value)}">${o.label}</div>
            `).join('')}
          </div>
        </div>
      </div>`;
    root.querySelector('[data-cancel]').onclick = close;
    root.querySelector('[data-confirm]').onclick = () => { onChange(currentValue, currentLabel); close(); };
    $$('[data-val]', root).forEach(el => el.onclick = () => {
      currentValue = el.dataset.val;
      currentLabel = el.textContent;
      $$('[data-val]', root).forEach(x => x.classList.remove('selected'));
      el.classList.add('selected');
    });
    root.querySelector('[data-picker]').addEventListener('click', (e) => {
      if (e.target.classList.contains('picker-mask')) close();
    });
  };
  render();
  return close;
}

function escapeAttr(s) {
  return String(s).replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

/* 把所有原生 select 替换为 picker 触发器 */
function enhancePickers(root) {
  $$('.field-select', root).forEach(sel => {
    if (sel.dataset.enhanced) return;
    sel.dataset.enhanced = '1';
    const labelEl = sel.parentNode.querySelector('.field-label');
    const title = labelEl ? labelEl.textContent.trim().replace(/（.*）$/, '') : '请选择';
    const options = [...sel.options].map(o => ({ value: o.value, label: o.textContent }));
    const selectedOpt = sel.options[sel.selectedIndex];
    const trigger = document.createElement('div');
    trigger.className = 'picker-trigger';
    trigger.innerHTML = `
      <span class="pt-value">${selectedOpt ? selectedOpt.textContent : '<span class="placeholder">请选择</span>'}</span>
      <span class="pt-arrow">${SVG_CHEVRON_RIGHT}</span>
    `;
    sel.style.display = 'none';
    sel.parentNode.insertBefore(trigger, sel.nextSibling);
    trigger.onclick = () => {
      picker({
        title,
        options,
        value: sel.value,
        onChange: (val, label) => {
          sel.value = val;
          trigger.querySelector('.pt-value').textContent = label;
          sel.dispatchEvent(new Event('change'));
        }
      });
    };
  });
}

/* ---------- 初始化 Mock 数据 ---------- */
function initData() {
  if (!store.get('profile')) {
    store.set('profile', {
      nickname: '小满',
      birthday: '1998-05-20',
      gender: 'female',
      education: '本科',
      income: '15-25k',
      occupation: '产品经理',
      redLines: ['被忽略', '说谎', '冷暴力'],
      preferences: ['阅读', '咖啡', '旅行', '猫'],
      bio: '愿你被这个世界温柔以待。',
    });
  }
  if (!store.get('people')) {
    store.set('people', [
      {
        id: uid(),
        nickname: '阿哲',
        relation: 'spouse',
        birthday: '1996-09-08',
        gender: 'male',
        education: '硕士',
        occupation: '软件工程师',
        redLines: ['被否定', '不被尊重'],
        preferences: ['数码', '篮球', '看剧'],
        bio: '相识于大学图书馆，喜欢安静地写代码。',
      },
      {
        id: uid(),
        nickname: '妈妈',
        relation: 'parent',
        birthday: '1968-03-12',
        gender: 'female',
        education: '高中',
        occupation: '退休教师',
        redLines: ['顶嘴', '不接电话'],
        preferences: ['广场舞', '做饭', '园艺'],
        bio: '永远在担心我吃不好穿不暖。',
      },
      {
        id: uid(),
        nickname: '小米',
        relation: 'friend',
        birthday: '1999-11-04',
        gender: 'female',
        education: '本科',
        occupation: '设计师',
        redLines: ['迟到', '言而无信'],
        preferences: ['绘画', '咖啡', '猫'],
        bio: '十年闺蜜，无话不谈。',
      },
    ]);
  }
  if (!store.get('couple')) {
    store.set('couple', {
      bound: true,
      partnerName: '阿哲',
      partnerAvatar: '👨',
      togetherSince: '2020-10-20',
      bindCode: 'DN' + Math.random().toString(36).slice(2, 8).toUpperCase(),
    });
  }
  if (!store.get('anniversaries')) {
    store.set('anniversaries', [
      { id: uid(), name: '在一起纪念日', date: '2020-10-20', type: 'love', icon: '💕' },
      { id: uid(), name: '阿哲生日', date: '1996-09-08', type: 'birthday', icon: '🎂' },
      { id: uid(), name: '结婚纪念日', date: '2024-05-20', type: 'wedding', icon: '💍' },
      { id: uid(), name: '我的生日', date: '1998-05-20', type: 'birthday', icon: '🎂' },
    ]);
  }
  if (!store.get('favorites')) {
    store.set('favorites', [
      { id: uid(), type: 'script', title: '吵架后求和', content: '我知道刚刚我们都有点上头，我现在冷静下来了。我想说的是，比起这件事本身，我更在乎我们之间的感情。能抱一下吗？', createdAt: today() },
    ]);
  }
  if (!store.get('history')) store.set('history', []);
  if (!store.get('settings')) {
    store.set('settings', { notification: true, anniversaryRemind: true, privacy: 'friends' });
  }
}

/* ---------- 关系配置 ---------- */
const RELATIONS = {
  friend: { label: '朋友', emoji: '🧑‍🤝‍🧑', cls: 'relation-friend' },
  parent: { label: '父母', emoji: '👨‍👩‍👧', cls: 'relation-parent' },
  child: { label: '子女', emoji: '👶', cls: 'relation-child' },
  lover: { label: '男/女朋友', emoji: '💑', cls: 'relation-lover' },
  spouse: { label: '夫妻', emoji: '👰', cls: 'relation-spouse' },
  colleague: { label: '同事', emoji: '💼', cls: 'relation-colleague' },
};

const AVATARS = ['🧑', '👩', '👨', '👧', '👦', '👶', '👵', '👴', '🧓', '👱‍♀️', '👱‍♂️', '👩‍🦰', '👨‍🦰'];

function pickAvatar(person) {
  if (person.gender === 'male') return '👨';
  if (person.gender === 'female') return '👩';
  return '🧑';
}

/* ---------- Mock AI 函数 ---------- */
function aiLoading(text = 'AI 正在思考') {
  return `<div class="ai-loading"><div class="al-spinner"></div><div class="al-text">${text}<span class="al-dots"></span></div></div>`;
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function analyzeArgument(input) {
  await delay(900);
  const person = getPeople().find(p => p.id === input.personId);
  const pName = person ? person.nickname : '对方';
  const hasIgnore = /忽略|忽视|不.*理|冷/.test(input.event);
  const hasLie = /骗|说谎|隐瞒|骗/.test(input.event);
  const hasTime = /迟到|爽约|等/.test(input.event);
  const hasMoney = /钱|花|买|贵/.test(input.event);

  let root = '双方在沟通方式上存在差异，未能及时识别对方的情感需求。';
  if (hasIgnore) root = `${pName}感到被忽略和不被重视，这是争吵的核心情绪触发点。`;
  else if (hasLie) root = '信任感受到挑战，需要重建双方的透明度和安全感。';
  else if (hasTime) root = '时间承诺的失约触发了"被不重视"的核心情绪。';
  else if (hasMoney) root = '金钱观差异，反映的是双方对"未来规划"的不同期待。';

  return {
    rootCause: root,
    selfMind: '此刻你可能感到委屈和不被理解，希望对方能听到你的真实诉求。情绪上头时容易说出伤人的话，但本意并非如此。',
    partnerMind: `${pName}的内心可能同样受伤，对方的"防御"或"沉默"往往是被卡住而非不在乎。${pName}需要的是被肯定和被理解，而不是被指责。`,
    biases: [
      '读心术偏差：假设对方"应该知道"我的感受',
      '灾难化：把一次小冲突放大成"不爱了"',
      '非黑即白：要么完全理解我，要么就是不爱我',
    ],
    suggestions: [
      `先做情感确认：用"我感到..."句式表达感受，而非"你总是..."的指责`,
      '给彼此 20 分钟冷静期，避免情绪上头时的连续输出',
      `找一个安静的环境面对面沟通，避免文字争吵带来的误解`,
      `主动询问 ${pName} 的感受，先听再回应`,
    ],
    scripts: [
      `「${pName}，刚刚我们都有点上头，我现在冷静下来了。我想说的是，比起这件事本身，我更在乎你。我们能抱一下再聊吗？」`,
      `「我刚刚说的那句话是气话，我并不是真的那么想。我真正想表达的是希望你能多关注我一点，下次你愿意先问我一句"你还好吗"吗？」`,
    ],
  };
}

async function recommendGift(input) {
  await delay(800);
  const person = getPeople().find(p => p.id === input.personId);
  const likes = person ? person.preferences : [];
  const budget = input.budget || 500;
  const gifts = [];

  if (likes.some(l => /咖啡|茶|饮/.test(l))) {
    gifts.push({ name: '手冲咖啡套装', reason: `${person.nickname}喜欢咖啡，亲手冲一杯比任何礼物都温馨`, price: '¥' + Math.min(budget, 380) });
  }
  if (likes.some(l => /书|阅读|文/.test(l))) {
    gifts.push({ name: '限量版藏书票 + 喜欢作者签名书', reason: '把"懂你"做到极致，比昂贵更动人', price: '¥' + Math.min(budget, 280) });
  }
  if (likes.some(l => /数码|科技|电子/.test(l))) {
    gifts.push({ name: '降噪耳机', reason: `${person.nickname}喜欢数码，这是日常通勤的高频陪伴`, price: '¥' + Math.min(budget, 899) });
  }
  if (likes.some(l => /猫|狗|宠/.test(l))) {
    gifts.push({ name: '定制宠物肖像画', reason: '把对方在意的小生命变成艺术品', price: '¥' + Math.min(budget, 199) });
  }
  if (likes.some(l => /运动|篮球|健身|跑/.test(l))) {
    gifts.push({ name: '运动手环 / 速干运动套装', reason: '关注对方的健康，是亲密关系里最深的在乎', price: '¥' + Math.min(budget, 499) });
  }
  gifts.push({ name: '手写情书 + 一束对方喜欢的花', reason: '永远的经典。真诚的文字比任何礼物都更打动人', price: '¥' + Math.min(budget, 200) });
  gifts.push({ name: '一次共同体验（陶艺 / 烘焙 / 双人 SPA）', reason: '共同创造回忆，比物质礼物更长久', price: '¥' + Math.min(budget, 600) });

  return {
    gifts: gifts.slice(0, 5),
    tips: [
      `送礼的本质是"我看到你"，而非"我买了什么"。礼物最好能呼应 ${person ? person.nickname : '对方'} 的某个具体喜好。`,
      `${input.occasion || '这个场合'}更适合"用心感"强的礼物，而非"价格感"强的礼物。`,
      `如果预算有限，可以考虑亲手制作一份礼物，再配一封手写信，效果往往超过昂贵商品。`,
      `送礼时附上一句具体的话："我看到你最近 XX，所以想到送你这个"——会大大提升礼物的温度。`,
    ],
  };
}

async function planDate(input) {
  await delay(900);
  const person = getPeople().find(p => p.id === input.personId);
  const pName = person ? person.nickname : '对方';
  const startHour = 10;
  const timeline = [
    { time: '10:00', title: '咖啡馆碰面', desc: '选一家安静的精品咖啡馆，先聊聊天，让彼此放松下来' },
    { time: '11:30', title: '共同体验工坊', desc: `${pName}可以一起做陶艺 / 烘焙 / 香薰蜡烛，过程中自然有身体接触和笑声` },
    { time: '13:30', title: '午餐 - 私房菜馆', desc: '预订一家安静的小馆，避免嘈杂环境，方便深入交流' },
    { time: '15:30', title: '城市漫步 / 公园散步', desc: '选择有故事感的街区或绿道，边走边聊，营造轻松氛围' },
    { time: '17:30', title: '观景台 / 江边看日落', desc: '选一个能看日落的点位，光线柔和时人会自动放松' },
    { time: '19:00', title: '晚餐 - 浪漫餐厅', desc: '提前预订靠窗位置，配一点红酒' },
    { time: '21:00', title: '送回家 + 道别', desc: '送到门口，真诚地说一句"今天很开心"，比任何拥抱都更让人心动' },
  ];
  return {
    timeline,
    tips: [
      `约会重点是"专注感"——全程放下手机，比任何安排都重要。`,
      `${pName}可能更在意细节，记住对方提到的喜好（饮料口味、忌口等），会加分很多。`,
      `预算建议留 20% 余量以备突发情况。`,
      `不要把行程排得太满，留出"自然停下"的空隙，反而能产生意外的浪漫。`,
    ],
    backup: '若遇下雨：取消户外环节，改为逛美术馆 / 室内书店 / 看一场电影，雨天的咖啡店别有氛围。',
  };
}

async function simulateChatReply(input) {
  await delay(700);
  const person = getPeople().find(p => p.id === input.personId);
  const userMsg = input.message;
  const pName = person ? person.nickname : '对方';

  if (/你好|嗨|嗨嗨|hi|hello/i.test(userMsg)) {
    return `${pName}：嗨～我也在想你会不会先开口。今天怎么样？`;
  }
  if (/喜欢|爱/.test(userMsg)) {
    return `${pName}：其实我也是。只是不太擅长用语言表达，但每次看到你笑，我心里都很暖。`;
  }
  if (/对不起|抱歉|错了/.test(userMsg)) {
    return `${pName}：没关系，我也有不对的地方。我们都不容易，能说出来就好。`;
  }
  if (/生气|不高兴|难过|委屈/.test(userMsg)) {
    return `${pName}：听到你这么说我也心疼。能告诉我具体是哪一刻让你有这种感觉吗？我想真的听懂你。`;
  }
  if (/吃饭|约会|见面|周末/.test(userMsg)) {
    return `${pName}：好啊！我刚好想约你。周六下午有空吗？我订了那家你说过想去的咖啡店。`;
  }
  if (/工作|累|忙/.test(userMsg)) {
    return `${pName}：辛苦了。先休息一下，要不要我给你点杯热饮？不用回我，先照顾好自己。`;
  }
  return `${pName}：我感受到了你的诚意。其实我们之间的关键不是"说什么"，而是"愿不愿意停下来听"。我愿意，你呢？`;
}

async function planProposal(input) {
  await delay(1000);
  const style = input.style || 'romantic';
  const budget = input.budget || 10000;
  const plans = {
    romantic: {
      theme: '浪漫星光主题求婚',
      venue: '城市观景台 / 海边 / 屋顶花园（夜晚）',
      flow: [
        '提前 1 个月预定场地，布置 LED 星星灯串和你们从相识到现在的照片墙',
        '邀请几位最亲近的朋友偷偷到场，负责摄影和送花',
        '当天以"朋友聚会"为由带 ta 到场，到达时灯光亮起，朋友齐唱你们喜欢的歌',
        '播放一段 3 分钟的视频：你们的照片 + 你想对 ta 说的话',
        '单膝下跪，说出准备好的求婚词（见下方）',
        '亲友撒花瓣 / 冷烟火，留出 5 分钟独处时间让彼此消化情绪',
        '后续安排一家预订好的私房菜馆庆祝',
      ],
      vow: `从 20XX 年 X 月 X 日我们第一次见面，到今天已经 XXX 天。这些年我学会最重要的一件事，不是怎么爱人，而是怎么爱你。你让我想成为更好的自己。XX，你愿意嫁/娶我吗？`,
      budget: `建议预算 ¥${budget}：场地布置 30%、摄影摄像 25%、餐饮 25%、戒指 15%、备用 5%`,
    },
    surprise: {
      theme: '日常生活场景惊喜求婚',
      venue: '你们最有回忆的家 / 第一次约会的咖啡店 / 一起逛的超市',
      flow: [
        '选择一个对你们有特殊意义但 ta 不会起疑的日子',
        '提前布置：在家里的某个角落藏"线索卡"，每张写一个你们的回忆',
        '让 ta 在家里"无意"发现第一张线索卡，引导 ta 一路找寻',
        '最后一张线索卡指向你藏身的房间，门打开时你单膝下跪',
        '比起"盛大"，这种方式更打动人——因为地点本身就是你们的故事',
      ],
      vow: `我们在这里度过了很多平凡的日子。但正是这些平凡，让我确定：我想和你一起，把余生每一个普通的日子，都过成有你的样子。`,
      budget: `建议预算 ¥${budget}：布置 20%、戒指 50%、摄影 15%、庆祝晚餐 15%`,
    },
  };
  return plans[style] || plans.romantic;
}

async function freeAsk(input) {
  await delay(900);
  const q = input.question;
  const person = input.person;
  const ctx = person ? `（结合 ${person.nickname} 的资料：${(person.preferences || []).slice(0, 2).join('、') || '暂无喜好记录'}；雷区：${(person.redLines || []).slice(0, 2).join('、') || '暂无'}）` : '';

  if (/分手|离|不爱/.test(q)) {
    return {
      summary: `关于"是否要结束"的问题，背后往往藏着深深的疲惫与不甘。${ctx}`,
      points: [
        '**先区分"暂时疲惫"和"真的不爱"**——疲惫可以休息恢复，不爱则是另一种状态。',
        '**问自己三个问题**：① 不爱的是这个人，还是这段关系中的某个具体模式？② 如果换一个人，你愿意重复同样的故事吗？③ 你们之间是否还有未被表达的善意？',
        person ? `**结合 ${person.nickname} 的视角**：ta 的雷区是「${(person.redLines || []).join('、') || '未记录'}」，最近的冲突是否触动了其中某一项？这往往是"想离开"背后的真实信号。` : '**建议**：在做出重大决定前，先和对方进行一次"不带期待的真诚对话"。',
        '**最后**：无论结果如何，结束一段关系并不意味着失败。承认"我们试过了"本身就是一种成熟。',
      ],
    };
  }
  if (/喜欢|暗恋|表白/.test(q)) {
    return {
      summary: `判断对方是否喜欢你，比直接表白更让人焦虑。这里有几条可参考的信号。${ctx}`,
      points: [
        '**主动信号**：对方会主动找话题、记住你提过的细节、对你的状态变化敏感。',
        '**身体语言**：和 ta 在一起时，ta 的身体会自然朝向你、眼神停留更久、对话中会笑得更多。',
        '**试探方法**：找一个低风险的场景（如一起吃饭），适度分享一些个人感受，看 ta 是否愿意"接住"并分享回去。',
        person ? `**结合 ${person.nickname}**：ta 喜欢「${(person.preferences || []).join('、') || '未记录'}」，可以从这些话题切入观察 ta 的投入度——若 ta 在自己感兴趣的领域对你格外耐心，是积极信号。` : '**建议**：不要把"喜欢"憋太久，也不要急着表白。先建立"舒适的相处频率"，确认双向信号后再行动。',
      ],
    };
  }
  if (/吵|冷战|矛盾|冲突/.test(q)) {
    return {
      summary: `冲突本身不可怕，可怕的是冲突的方式伤害了关系。${ctx}`,
      points: [
        '**冲突三原则**：① 不翻旧账 ② 不人身攻击 ③ 不用"总是/从不"这种绝对化语言。',
        '**先处理情绪，再处理问题**：争吵当下，先让对方把情绪说完，再回应内容。',
        person ? `**结合 ${person.nickname} 的雷区**：ta 对「${(person.redLines || []).join('、') || '未记录'}」敏感，复盘时检查一下是否触到了其中某条。如果是，优先就这一条做明确道歉。` : '**复盘**：冷静后做一次"复盘对话"，重点不是"谁对谁错"，而是"我们下次可以怎么做"。',
        '**记住**：吵架后能好好和好的情侣，反而比从不吵架的情侣更稳定。',
      ],
    };
  }
  return {
    summary: `你的问题没有标准答案，但我可以陪你一起梳理。${ctx}`,
    points: [
      '**先看见自己**：在亲密关系里，我们常常着急回应对方，却忘了先问自己——"我真正想要的是什么？"',
      '**再看见对方**：对方的行为背后，往往有一个未被表达的需求或恐惧。试着问一句："你这样说/做，是因为担心什么？"',
      '**找一个安静的时刻**：和对方进行一次"不带评判的对话"，只听，先不说服。',
      '**如果感到困难**：可以尝试写日记、找心理咨询师，或者继续在这里和我聊。',
    ],
  };
}

async function analyzeCoupleEvent(input) {
  await delay(1100);
  return {
    contradiction: '双方并非真的在"事件本身"上对立，而是各自带着未被看见的情绪诉求。一方需要被理解，另一方需要被肯定。',
    selfMind: '你的诉求核心是"希望被听见和被在乎"。当感到对方"不接住"时，你会本能地升级表达方式（更激烈、更冷战），但这往往让对方退缩。',
    partnerMind: '对方的诉求核心是"希望被肯定和被支持"。当感到被否定或被指责时，ta 会本能地防御或撤退，但这又会触发你的被忽略感。',
    biases: [
      '双方都陷入了"我以为你也知道"的读心术偏差',
      '把"对方没做到"等同于"对方不在乎"',
      '在情绪上头时，把过去的相似场景叠加到当下',
    ],
    suggestions: [
      '先做情感确认再讨论事件：用"我看到你 XX，我理解你可能 YY"开启对话',
      '设定一个"暂停手势"：任一方情绪上头时可以示意暂停 20 分钟',
      '把"你总是..."换成"我希望下次..."的句式',
      '复盘时聚焦"我们如何避免下次"，而非"这次谁对谁错"',
    ],
    scripts: [
      '「我刚刚说话急了，先停一下。我其实不是想指责你，我是想让你知道我很难过。」',
      '「我也想听听你的想法，你愿意先说吗？我保证不打断。」',
    ],
  };
}

async function planTravel(input) {
  await delay(1100);
  const dest = input.destination || '杭州';
  return {
    days: [
      {
        date: 'Day 1',
        items: [
          { time: '09:00', title: '高铁抵达 ' + dest, desc: '提前预订接送车，直达酒店办理入住' },
          { time: '11:00', title: '西湖断桥 + 白堤漫步', desc: '避开高峰时段，建议步行或骑行' },
          { time: '13:00', title: '知味观午餐', desc: '尝试地道杭帮菜，环境清雅' },
          { time: '15:00', title: '灵隐寺 + 飞来峰', desc: '感受千年古刹的宁静' },
          { time: '18:30', title: '楼外楼晚餐', desc: '靠窗位可看西湖夜景' },
          { time: '20:30', title: '夜游西湖', desc: '坐船赏月，听琴声' },
        ],
      },
      {
        date: 'Day 2',
        items: [
          { time: '08:30', title: '龙井村采茶体验', desc: '了解茶文化，亲手采茶' },
          { time: '11:30', title: '农家乐午餐', desc: '尝龙井虾仁、叫化鸡' },
          { time: '14:00', title: '中国丝绸博物馆', desc: '了解丝绸历史，体验织造' },
          { time: '16:30', title: '河坊街 + 南宋御街', desc: '逛老街，尝小吃' },
          { time: '19:00', title: '奎元馆品尝片儿川', desc: '百年老店，老杭州味道' },
        ],
      },
      {
        date: 'Day 3',
        items: [
          { time: '09:00', title: '西溪湿地', desc: '坐摇橹船游湿地，看水鸟' },
          { time: '12:30', title: '湿地内餐厅午餐', desc: '环境清幽' },
          { time: '15:00', title: '返程', desc: '提前 1.5 小时到车站' },
        ],
      },
    ],
    prep: [
      '证件：身份证、（如有）学生证 / 老年证',
      '衣物：舒适步行鞋、薄外套（早晚温差）、雨伞',
      '药品：晕车药、感冒药、肠胃药、个人常用药',
      '设备：充电宝、相机、转换插头',
      '预订：酒店、高铁票、热门景点门票（提前 3-7 天）',
    ],
    tips: [
      '避开节假日高峰，工作日景点人少体验更好',
      `${dest}春秋两季最适宜，夏季较热注意防晒`,
      '雨天有备选方案：宋城演艺 / 浙江美术馆 / 书店',
      '当地特色：龙井茶、丝绸、藕粉、东坡肉',
    ],
    weather: '建议出行前 3 天再次查看天气预报，准备对应衣物',
  };
}

/* ---------- 全局状态 ---------- */
function getProfile() { return store.get('profile'); }
function getPeople() { return store.get('people', []); }
function getCouple() { return store.get('couple', { bound: false }); }
function getAnniversaries() { return store.get('anniversaries', []); }
function getFavorites() { return store.get('favorites', []); }
function getHistory() { return store.get('history', []); }
function getSettings() { return store.get('settings', {}); }

function addHistory(type, title, summary) {
  const h = getHistory();
  h.unshift({ id: uid(), type, title, summary, createdAt: today() });
  store.set('history', h.slice(0, 50));
}
function addFavorite(type, title, content) {
  const f = getFavorites();
  if (f.some(x => x.title === title && x.content === content)) {
    toast('已经在收藏里啦');
    return;
  }
  f.unshift({ id: uid(), type, title, content, createdAt: today() });
  store.set('favorites', f);
  toast('⭐ 已收藏');
}

/* ---------- 路由 ---------- */
const routes = {};

function route(path, handler) { routes[path] = handler; }

function navigate(path) {
  if (location.hash !== '#' + path) {
    location.hash = path;
  } else {
    render();
  }
}

window.addEventListener('hashchange', render);

function getCurrentRoute() {
  const hash = location.hash.replace(/^#/, '') || '/personal';
  return hash;
}

function render() {
  const path = getCurrentRoute();
  // 找到匹配的路由（支持参数）
  let handler = null;
  let params = {};
  for (const key of Object.keys(routes)) {
    if (key.includes(':')) {
      const re = new RegExp('^' + key.replace(/:[^/]+/g, '([^/]+)') + '$');
      const m = path.match(re);
      if (m) {
        handler = routes[key];
        const names = (key.match(/:[^/]+/g) || []).map(s => s.slice(1));
        names.forEach((n, i) => params[n] = decodeURIComponent(m[i]));
        break;
      }
    } else if (key === path) {
      handler = routes[key];
      break;
    }
  }
  if (!handler) handler = routes['/personal'];

  renderHeader(path);
  renderTabbar(path);
  const main = $('#app-main');
  main.scrollTop = 0;
  main.innerHTML = '';
  handler(main, params);
  enhancePickers(main);
}

function renderHeader(path) {
  const header = $('#app-header');
  const titles = {
    '/personal': { title: '懂你 AI', sub: 'DONG NI · YOUR EMOTIONAL COACH', back: false },
    '/couple': { title: '情侣空间', sub: 'OUR LITTLE WORLD', back: false },
    '/mine': { title: '我的', sub: 'MY CENTER', back: false },
  };
  let info = titles[path];
  if (!info) {
    // 子页面
    const map = {
      '/profile/edit': '编辑资料',
      '/people': '人物管理',
      '/people/add': '添加人物',
      '/feature/argue': '吵架分析',
      '/feature/gift': '送礼推荐',
      '/feature/date': '约会计划',
      '/feature/chat': '模拟聊天',
      '/feature/proposal': '求婚策划',
      '/feature/free': '自主模式',
      '/couple/bind': '情侣绑定',
      '/couple/event': '事件分析',
      '/couple/travel': '旅行计划',
      '/mine/anniversary': '纪念日提醒',
      '/mine/scripts': '沟通话术库',
      '/mine/training': '情商训练',
      '/mine/history': '历史记录',
      '/mine/favorites': '我的收藏',
      '/mine/settings': '设置中心',
    };
    // 处理 /people/:id
    let title = map[path];
    if (!title && path.startsWith('/people/')) title = '人物详情';
    info = { title: title || '懂你 AI', sub: '', back: true };
  }
  const svgBack = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>`;
  const svgBell = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>`;
  header.innerHTML = `
    <div class="h-btn ${info.back ? '' : 'hidden'}" data-back>${svgBack}</div>
    <div class="h-title">${info.title}${info.sub ? `<span class="sub">${info.sub}</span>` : ''}</div>
    <div class="h-btn ${info.back ? 'hidden' : ''}" data-action="bell">${svgBell}</div>
  `;
  header.querySelector('[data-back]').onclick = () => history.back();
  const bell = header.querySelector('[data-action="bell"]');
  if (bell) bell.onclick = () => toast('🔔 暂无新通知');
}

function renderTabbar(path) {
  const tabbar = $('#app-tabbar');
  const tabs = [
    { key: 'personal', path: '/personal', icon: '🧑', label: '个人' },
    { key: 'couple', path: '/couple', icon: '💑', label: '情侣' },
    { key: 'mine', path: '/mine', icon: '💗', label: '我的' },
  ];
  let active = 'personal';
  if (path.startsWith('/couple')) active = 'couple';
  else if (path.startsWith('/mine')) active = 'mine';
  else active = 'personal';
  tabbar.innerHTML = tabs.map(t => `
    <div class="tab-item ${active === t.key ? 'active' : ''}" data-path="${t.path}">
      <div class="tab-icon">${t.icon}</div>
      <div class="tab-label">${t.label}</div>
    </div>
  `).join('');
  $$('#app-tabbar .tab-item').forEach(el => {
    el.onclick = () => navigate(el.dataset.path);
  });
}

/* ============================================
   页面渲染
   ============================================ */

/* ----- 个人 Tab 主页 ----- */
route('/personal', (el) => {
  const profile = getProfile();
  const people = getPeople();
  const features = [
    { key: 'argue', icon: '💔', title: '吵架分析', desc: '拆解矛盾，给和解话术', bg: 'linear-gradient(135deg, #FFE0DC, #FFC4BD)' },
    { key: 'gift', icon: '🎁', title: '送礼推荐', desc: '懂 ta 才能送到心坎', bg: 'linear-gradient(135deg, #FFF4D4, #FFE5A8)' },
    { key: 'date', icon: '🌹', title: '约会计划', desc: '完美的一天行程', bg: 'linear-gradient(135deg, #EDE3F7, #D5C5F0)' },
    { key: 'chat', icon: '💬', title: '模拟聊天', desc: '练习高情商沟通', bg: 'linear-gradient(135deg, #D4ECFF, #A8D4FF)' },
    { key: 'proposal', icon: '💍', title: '求婚策划', desc: '一生一次的仪式感', bg: 'linear-gradient(135deg, #E0E8F5, #C8D4F0)' },
    { key: 'free', icon: '💌', title: '自主模式', desc: '什么都可以问我', bg: 'linear-gradient(135deg, #EDE3F7, #C4B0F5)' },
  ];

  el.innerHTML = `
    <div class="profile-hero">
      <div class="ph-row">
        <div class="avatar">${profile.gender === 'male' ? '👨' : profile.gender === 'female' ? '👩' : '🧑'}</div>
        <div class="ph-info">
          <div class="ph-name">${profile.nickname || '未命名'} <span style="font-size:12px;opacity:.8;">${profile.gender === 'male' ? '♂' : profile.gender === 'female' ? '♀' : ''}</span></div>
          <div class="ph-meta">
            <span>🎂 ${fmtDate(profile.birthday).split('.').slice(1).join('.') || '未设置'}</span>
            <span>🎓 ${profile.education || '未设置'}</span>
            <span>💼 ${profile.occupation || '未设置'}</span>
          </div>
        </div>
        <div class="ph-edit" data-go="/profile/edit">✎</div>
      </div>
      <div class="ph-tags">
        ${(profile.preferences || []).slice(0, 3).map(p => `<div class="ph-tag">💗 ${p}</div>`).join('')}
        ${(profile.redLines || []).slice(0, 2).map(p => `<div class="ph-tag">⚠️ ${p}</div>`).join('')}
      </div>
    </div>

    <div class="section-title">
      <h3>我的人物</h3>
      <div class="more" data-go="/people">全部 ›</div>
    </div>
    <div class="people-strip">
      ${people.map(p => {
        const r = RELATIONS[p.relation] || RELATIONS.friend;
        return `<div class="person-chip" data-go="/people/${p.id}">
          <div class="pc-avatar ${r.cls}">${pickAvatar(p)}</div>
          <div class="pc-name">${p.nickname}</div>
          <div class="pc-rel">${r.label}</div>
        </div>`;
      }).join('')}
      <div class="person-chip add" data-go="/people/add">
        <div class="pc-avatar">＋</div>
        <div class="pc-name">添加</div>
      </div>
    </div>

    <div class="section-title">
      <h3>情感军师</h3>
      <div class="more">为你而备</div>
    </div>
    <div class="feature-grid">
      ${features.map(f => `
        <div class="feature-card" data-go="/feature/${f.key}">
          <div class="fc-icon" style="background:${f.bg}">${f.icon}</div>
          <div class="fc-title">${f.title}</div>
          <div class="fc-desc">${f.desc}</div>
          <div class="fc-arrow">›</div>
        </div>
      `).join('')}
    </div>

    <div class="section-title"><h3>每日心语</h3></div>
    <div class="card solid" style="text-align:center; padding: 20px;">
      <div style="font-size: 36px; margin-bottom: 8px;">🌸</div>
      <div class="serif" style="font-size: 16px; line-height: 1.7; color: var(--c-text);">
        爱不是寻找一个完美的人，<br>而是学会用完美的眼光，<br>欣赏一个不完美的人。
      </div>
      <div class="text-muted text-small" style="margin-top: 8px;">— 懂你 AI · 每日一句</div>
    </div>
  `;
  bindGo(el);
});

/* ----- 编辑个人资料 ----- */
route('/profile/edit', (el) => {
  const p = getProfile();
  el.innerHTML = `
    <div class="card solid">
      <div class="field-group">
        <label class="field-label">昵称</label>
        <input class="field-input" id="f_nickname" value="${p.nickname || ''}" placeholder="给自己起个昵称" />
      </div>
      <div class="field-group">
        <label class="field-label">出生日期</label>
        <input class="field-input" id="f_birthday" type="date" value="${p.birthday || ''}" />
      </div>
      <div class="field-group">
        <label class="field-label">性别</label>
        <select class="field-select" id="f_gender">
          <option value="female" ${p.gender === 'female' ? 'selected' : ''}>女</option>
          <option value="male" ${p.gender === 'male' ? 'selected' : ''}>男</option>
          <option value="other" ${p.gender === 'other' ? 'selected' : ''}>其他</option>
        </select>
      </div>
      <div class="field-group">
        <label class="field-label">学历</label>
        <select class="field-select" id="f_education">
          ${['高中', '大专', '本科', '硕士', '博士'].map(v => `<option ${p.education === v ? 'selected' : ''}>${v}</option>`).join('')}
        </select>
      </div>
      <div class="field-group">
        <label class="field-label">收入水平</label>
        <select class="field-select" id="f_income">
          ${['5k 以下', '5-10k', '10-15k', '15-25k', '25-50k', '50k+'].map(v => `<option ${p.income === v ? 'selected' : ''}>${v}</option>`).join('')}
        </select>
      </div>
      <div class="field-group">
        <label class="field-label">职业</label>
        <input class="field-input" id="f_occupation" value="${p.occupation || ''}" placeholder="如：产品经理" />
      </div>
    </div>

    <div class="card solid">
      <div class="field-group">
        <label class="field-label">自我雷区（每行一条）</label>
        <textarea class="field-textarea" id="f_redLines" placeholder="每行一条，如：&#10;被忽略&#10;说谎&#10;冷暴力" style="min-height: 90px;">${(p.redLines || []).join('\n')}</textarea>
      </div>
      <div class="field-group">
        <label class="field-label">个人喜好（每行一条）</label>
        <textarea class="field-textarea" id="f_preferences" placeholder="每行一条，如：&#10;阅读&#10;咖啡&#10;旅行" style="min-height: 90px;">${(p.preferences || []).join('\n')}</textarea>
      </div>
      <div class="field-group">
        <label class="field-label">自我介绍</label>
        <textarea class="field-textarea" id="f_bio" placeholder="说点关于自己的事...">${p.bio || ''}</textarea>
      </div>
    </div>

    <button class="btn btn-primary btn-block" id="saveBtn">保存资料</button>
  `;
  $('#saveBtn').onclick = () => {
    const profile = {
      nickname: $('#f_nickname').value.trim(),
      birthday: $('#f_birthday').value,
      gender: $('#f_gender').value,
      education: $('#f_education').value,
      income: $('#f_income').value,
      occupation: $('#f_occupation').value.trim(),
      redLines: $('#f_redLines').value.split('\n').map(s => s.trim()).filter(Boolean),
      preferences: $('#f_preferences').value.split('\n').map(s => s.trim()).filter(Boolean),
      bio: $('#f_bio').value.trim(),
    };
    store.set('profile', profile);
    toast('✓ 已保存');
    setTimeout(() => navigate('/personal'), 600);
  };
});

/* ----- 人物列表 ----- */
route('/people', (el) => {
  const people = getPeople();
  el.innerHTML = `
    <div class="form-hint">管理你关心的人物，AI 会结合对方的资料给出更贴心的建议</div>
    ${people.length === 0 ? `
      <div class="empty-state">
        <div class="es-icon">👤</div>
        <div class="es-text">还没有添加任何人物</div>
        <button class="btn btn-primary es-btn" data-go="/people/add">＋ 添加人物</button>
      </div>
    ` : people.map(p => {
      const r = RELATIONS[p.relation] || RELATIONS.friend;
      return `<div class="card solid" data-go="/people/${p.id}" style="display:flex; gap:14px; align-items:center; cursor:pointer;">
        <div class="person-chip" style="width:auto;">
          <div class="pc-avatar ${r.cls}" style="width:54px;height:54px;">${pickAvatar(p)}</div>
        </div>
        <div style="flex:1; min-width:0;">
          <div class="flex-between">
            <div class="bold" style="font-size:16px;">${p.nickname}</div>
            <span class="tag">${r.emoji} ${r.label}</span>
          </div>
          <div class="text-muted text-small" style="margin-top:4px;">${p.occupation || '未设置'} · ${p.education || '未设置'}</div>
          ${p.bio ? `<div class="text-small" style="margin-top:6px; color:var(--c-text-soft); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${p.bio}</div>` : ''}
        </div>
        <div class="mi-arrow">›</div>
      </div>`;
    }).join('')}
    ${people.length > 0 ? `<button class="btn btn-ghost btn-block" data-go="/people/add">＋ 添加人物</button>` : ''}
  `;
  bindGo(el);
});

/* ----- 添加人物 ----- */
route('/people/add', (el) => {
  el.innerHTML = `
    <div class="card solid">
      <div class="field-group">
        <label class="field-label">对方昵称</label>
        <input class="field-input" id="p_nickname" placeholder="如：阿哲" />
      </div>
      <div class="field-group">
        <label class="field-label">关系类型</label>
        <select class="field-select" id="p_relation">
          ${Object.entries(RELATIONS).map(([k, v]) => `<option value="${k}">${v.emoji} ${v.label}</option>`).join('')}
        </select>
      </div>
      <div class="field-group">
        <label class="field-label">出生日期</label>
        <input class="field-input" id="p_birthday" type="date" />
      </div>
      <div class="field-group">
        <label class="field-label">性别</label>
        <select class="field-select" id="p_gender">
          <option value="female">女</option>
          <option value="male">男</option>
          <option value="other">其他</option>
        </select>
      </div>
      <div class="field-group">
        <label class="field-label">学历</label>
        <select class="field-select" id="p_education">
          ${['高中', '大专', '本科', '硕士', '博士'].map(v => `<option>${v}</option>`).join('')}
        </select>
      </div>
      <div class="field-group">
        <label class="field-label">职业</label>
        <input class="field-input" id="p_occupation" placeholder="如：软件工程师" />
      </div>
    </div>
    <div class="card solid">
      <div class="field-group">
        <label class="field-label">对方雷区（每行一条）</label>
        <textarea class="field-textarea" id="p_redLines" placeholder="每行一条，如：&#10;被否定&#10;不被尊重" style="min-height: 90px;"></textarea>
      </div>
      <div class="field-group">
        <label class="field-label">对方喜好（每行一条）</label>
        <textarea class="field-textarea" id="p_preferences" placeholder="每行一条，如：&#10;数码&#10;篮球&#10;看剧" style="min-height: 90px;"></textarea>
      </div>
      <div class="field-group">
        <label class="field-label">人物介绍</label>
        <textarea class="field-textarea" id="p_bio" placeholder="写点关于 ta 的事..."></textarea>
      </div>
    </div>
    <button class="btn btn-primary btn-block" id="saveBtn">保存</button>
  `;
  $('#saveBtn').onclick = () => {
    const p = {
      id: uid(),
      nickname: $('#p_nickname').value.trim(),
      relation: $('#p_relation').value,
      birthday: $('#p_birthday').value,
      gender: $('#p_gender').value,
      education: $('#p_education').value,
      occupation: $('#p_occupation').value.trim(),
      redLines: $('#p_redLines').value.split('\n').map(s => s.trim()).filter(Boolean),
      preferences: $('#p_preferences').value.split('\n').map(s => s.trim()).filter(Boolean),
      bio: $('#p_bio').value.trim(),
    };
    if (!p.nickname) { toast('请填写昵称'); return; }
    const list = getPeople();
    list.push(p);
    store.set('people', list);
    toast('✓ 已添加');
    setTimeout(() => navigate('/people'), 600);
  };
});

/* ----- 人物详情 ----- */
route('/people/:id', (el, params) => {
  const p = getPeople().find(x => x.id === params.id);
  if (!p) { el.innerHTML = '<div class="empty-state"><div class="es-icon">🤔</div><div class="es-text">未找到该人物</div></div>'; return; }
  const r = RELATIONS[p.relation] || RELATIONS.friend;
  el.innerHTML = `
    <div class="profile-hero" style="background: linear-gradient(135deg, ${r.cls.includes('friend') ? '#C4B0F5, #A78BFA' : r.cls.includes('parent') ? '#FFE5A8, #F5C97B' : r.cls.includes('lover') || r.cls.includes('spouse') ? '#FFD0DC, #FFB4C4' : '#A8C4E8, #7DA8D8'});">
      <div class="ph-row">
        <div class="avatar">${pickAvatar(p)}</div>
        <div class="ph-info">
          <div class="ph-name">${p.nickname} <span class="tag" style="background:rgba(255,255,255,.3); color:white;">${r.emoji} ${r.label}</span></div>
          <div class="ph-meta">
            <span>🎂 ${fmtDate(p.birthday)}</span>
            <span>🎓 ${p.education || '未设置'}</span>
            <span>💼 ${p.occupation || '未设置'}</span>
          </div>
        </div>
      </div>
      ${p.bio ? `<div style="margin-top:14px; position:relative; z-index:1; font-style: italic; opacity:.95;">"${p.bio}"</div>` : ''}
    </div>

    ${p.preferences && p.preferences.length ? `
      <div class="card solid">
        <div class="section-title" style="margin:0 0 12px;"><h3>💗 ta 的喜好</h3></div>
        <div>${p.preferences.map(x => `<span class="tag">${x}</span>`).join('')}</div>
      </div>` : ''}

    ${p.redLines && p.redLines.length ? `
      <div class="card solid">
        <div class="section-title" style="margin:0 0 12px;"><h3>⚠️ ta 的雷区</h3></div>
        <div>${p.redLines.map(x => `<span class="tag warn">${x}</span>`).join('')}</div>
      </div>` : ''}

    <div class="section-title"><h3>为 ta 用 AI</h3></div>
    <div class="feature-grid">
      <div class="feature-card" data-go="/feature/gift?pid=${p.id}"><div class="fc-icon" style="background:linear-gradient(135deg,#FFE5B4,#FFC97B)">🎁</div><div class="fc-title">送礼推荐</div><div class="fc-desc">送 ta 喜欢的</div></div>
      <div class="feature-card" data-go="/feature/chat?pid=${p.id}"><div class="fc-icon" style="background:linear-gradient(135deg,#D4E8FF,#B4D4FF)">💬</div><div class="fc-title">模拟聊天</div><div class="fc-desc">练习对话</div></div>
    </div>

    <button class="btn btn-ghost btn-block" id="delBtn" style="color:#C53A3A; border-color:#FFC4C4;">删除该人物</button>
  `;
  bindGo(el);
  $('#delBtn').onclick = () => {
    modal('确认删除', `<p style="text-align:center; padding:10px 0 20px;">确定要删除「${p.nickname}」吗？此操作无法撤销。</p><div style="display:flex; gap:10px;"><button class="btn btn-ghost btn-block" data-cancel>取消</button><button class="btn btn-primary btn-block" data-ok style="background:linear-gradient(135deg,#FF6B6B,#C53A3A);">删除</button></div>`, {
      onMount: (root, close) => {
        root.querySelector('[data-cancel]').onclick = close;
        root.querySelector('[data-ok]').onclick = () => {
          store.set('people', getPeople().filter(x => x.id !== p.id));
          close();
          toast('已删除');
          setTimeout(() => navigate('/people'), 500);
        };
      }
    });
  };
});

/* ----- 吵架分析 ----- */
route('/feature/argue', (el) => {
  const people = getPeople();
  el.innerHTML = `
    <div class="form-hint">把刚刚发生的争吵描述给 AI 听，ta 会帮你拆解矛盾、读懂对方心理，并给出和解话术</div>
    <div class="card solid">
      <div class="field-group">
        <label class="field-label">选择相关人物</label>
        <select class="field-select" id="argue_person">
          ${people.map(p => `<option value="${p.id}">${p.nickname}（${(RELATIONS[p.relation] || {}).label}）</option>`).join('')}
        </select>
      </div>
      <div class="field-group">
        <label class="field-label">发生了什么？</label>
        <textarea class="field-textarea" id="argue_event" placeholder="例：他下班回家后只顾着看手机，我问他话他也不理我，我就生气了..."></textarea>
      </div>
      <div class="field-group">
        <label class="field-label">你现在的状态？</label>
        <select class="field-select" id="argue_status">
          <option>很生气，想吵架</option>
          <option>委屈，想哭</option>
          <option>冷战，不想理 ta</option>
          <option>后悔，想和好</option>
          <option>困惑，不知道怎么办</option>
        </select>
      </div>
      <button class="btn btn-primary btn-block" id="argue_btn">🔍 让 AI 分析</button>
    </div>
    <div id="result"></div>
  `;
  $('#argue_btn').onclick = async () => {
    const input = {
      personId: $('#argue_person').value,
      event: $('#argue_event').value.trim(),
      status: $('#argue_status').value,
    };
    if (!input.event) { toast('请描述发生了什么'); return; }
    $('#result').innerHTML = aiLoading();
    const r = await analyzeArgument(input);
    const person = getPeople().find(p => p.id === input.personId);
    addHistory('argue', `与 ${person.nickname} 的吵架分析`, r.rootCause);
    $('#result').innerHTML = `
      <div class="result-block">
        <div class="rb-title">🎯 矛盾根源</div>
        <div class="rb-content">${r.rootCause}</div>
      </div>
      <div class="result-block">
        <div class="rb-title">💗 你的心理</div>
        <div class="rb-content">${r.selfMind}</div>
      </div>
      <div class="result-block">
        <div class="rb-title">💗 ${person.nickname} 的心理</div>
        <div class="rb-content">${r.partnerMind}</div>
      </div>
      <div class="result-block">
        <div class="rb-title">🧠 可能的认知偏差</div>
        <ul class="rb-list">${r.biases.map(b => `<li>${b}</li>`).join('')}</ul>
      </div>
      <div class="result-block">
        <div class="rb-title">💡 沟通建议</div>
        <ul class="rb-list">${r.suggestions.map(s => `<li>${s}</li>`).join('')}</ul>
      </div>
      <div class="result-block">
        <div class="rb-title">💬 和解话术参考</div>
        ${r.scripts.map(s => `<div class="card solid" style="margin-bottom:8px; padding:14px; font-style:italic; line-height:1.7;">${s}</div>`).join('')}
        <button class="btn btn-ghost btn-block btn-sm" id="fav_script">⭐ 收藏这些话术</button>
      </div>
    `;
    $('#fav_script').onclick = () => addFavorite('script', `与 ${person.nickname} 的和解话术`, r.scripts.join('\n\n'));
    $('#result').scrollIntoView({ behavior: 'smooth' });
  };
});

/* ----- 送礼推荐 ----- */
route('/feature/gift', (el, params) => {
  const people = getPeople();
  const prePid = params.pid || (people[0] && people[0].id);
  el.innerHTML = `
    <div class="form-hint">输入对方信息和场合，AI 会推荐既贴心又预算合理的礼物</div>
    <div class="card solid">
      <div class="field-group">
        <label class="field-label">送给谁</label>
        <select class="field-select" id="gift_person">
          ${people.map(p => `<option value="${p.id}" ${p.id === prePid ? 'selected' : ''}>${p.nickname}（${(RELATIONS[p.relation] || {}).label}）</option>`).join('')}
        </select>
      </div>
      <div class="field-group">
        <label class="field-label">场合 / 节日</label>
        <select class="field-select" id="gift_occasion">
          ${['生日', '纪念日', '情人节', '七夕', '圣诞节', '道歉', '惊喜', '初次见面'].map(v => `<option>${v}</option>`).join('')}
        </select>
      </div>
      <div class="field-group">
        <label class="field-label">预算（元）</label>
        <input class="field-input" id="gift_budget" type="number" value="500" min="50" max="100000" />
      </div>
      <button class="btn btn-primary btn-block" id="gift_btn">🎁 AI 推荐礼物</button>
    </div>
    <div id="result"></div>
  `;
  $('#gift_btn').onclick = async () => {
    const input = {
      personId: $('#gift_person').value,
      occasion: $('#gift_occasion').value,
      budget: parseInt($('#gift_budget').value) || 500,
    };
    $('#result').innerHTML = aiLoading();
    const r = await recommendGift(input);
    const person = getPeople().find(p => p.id === input.personId);
    addHistory('gift', `给 ${person.nickname} 的送礼推荐`, `${input.occasion} · 预算 ¥${input.budget}`);
    $('#result').innerHTML = `
      <div class="result-block">
        <div class="rb-title">💝 为 ${person.nickname} 推荐的礼物</div>
        ${r.gifts.map(g => `
          <div class="gift-card">
            <div class="gc-icon">${g.name.includes('书') ? '📚' : g.name.includes('咖啡') ? '☕' : g.name.includes('耳机') ? '🎧' : g.name.includes('画') ? '🎨' : g.name.includes('运动') ? '🏃' : g.name.includes('情书') ? '💌' : g.name.includes('体验') ? '🎉' : '🎁'}</div>
            <div class="gc-body">
              <div class="gc-name">${g.name}</div>
              <div class="gc-reason">${g.reason}</div>
            </div>
            <div class="gc-price">${g.price}</div>
          </div>
        `).join('')}
      </div>
      <div class="result-block">
        <div class="rb-title">💡 送礼小贴士</div>
        <ul class="rb-list">${r.tips.map(t => `<li>${t}</li>`).join('')}</ul>
      </div>
      <button class="btn btn-ghost btn-block btn-sm" id="fav_gift">⭐ 收藏推荐</button>
    `;
    $('#fav_gift').onclick = () => addFavorite('gift', `给 ${person.nickname} 的送礼推荐`, r.gifts.map(g => `${g.name} (${g.price})`).join(' / '));
  };
});

/* ----- 约会计划 ----- */
route('/feature/date', (el) => {
  const people = getPeople();
  el.innerHTML = `
    <div class="form-hint">输入约会基本信息，AI 帮你安排一整天浪漫行程</div>
    <div class="card solid">
      <div class="field-group">
        <label class="field-label">和谁约会</label>
        <select class="field-select" id="date_person">
          ${people.map(p => `<option value="${p.id}">${p.nickname}</option>`).join('')}
        </select>
      </div>
      <div class="field-group">
        <label class="field-label">约会日期</label>
        <input class="field-input" id="date_date" type="date" value="${today()}" />
      </div>
      <div class="field-group">
        <label class="field-label">约会城市</label>
        <input class="field-input" id="date_city" value="上海" placeholder="如：上海" />
      </div>
      <div class="field-group">
        <label class="field-label">预算（元）</label>
        <input class="field-input" id="date_budget" type="number" value="800" />
      </div>
      <button class="btn btn-primary btn-block" id="date_btn">🌹 生成约会行程</button>
    </div>
    <div id="result"></div>
  `;
  $('#date_btn').onclick = async () => {
    const input = {
      personId: $('#date_person').value,
      date: $('#date_date').value,
      city: $('#date_city').value,
      budget: parseInt($('#date_budget').value) || 800,
    };
    $('#result').innerHTML = aiLoading();
    const r = await planDate(input);
    const person = getPeople().find(p => p.id === input.personId);
    addHistory('date', `与 ${person.nickname} 的约会计划`, `${input.city} · ${input.date}`);
    $('#result').innerHTML = `
      <div class="result-block">
        <div class="rb-title">🗺️ 约会行程时间线</div>
        <div class="card solid" style="padding:18px;">
          <div class="timeline">
            ${r.timeline.map(t => `<div class="timeline-item">
              <div class="ti-time">${t.time}</div>
              <div class="ti-title">${t.title}</div>
              <div class="ti-desc">${t.desc}</div>
            </div>`).join('')}
          </div>
        </div>
      </div>
      <div class="result-block">
        <div class="rb-title">💡 约会建议</div>
        <ul class="rb-list">${r.tips.map(t => `<li>${t}</li>`).join('')}</ul>
      </div>
      <div class="result-block">
        <div class="rb-title">☔ 备选方案</div>
        <div class="rb-content">${r.backup}</div>
      </div>
      <button class="btn btn-ghost btn-block btn-sm" id="fav_date">⭐ 收藏行程</button>
    `;
    $('#fav_date').onclick = () => addFavorite('date', `与 ${person.nickname} 的约会计划`, r.timeline.map(t => `${t.time} ${t.title}`).join(' / '));
  };
});

/* ----- 模拟聊天 ----- */
route('/feature/chat', (el, params) => {
  const people = getPeople();
  const prePid = params.pid || (people[0] && people[0].id);
  const person = people.find(p => p.id === prePid) || people[0];
  if (!person) {
    el.innerHTML = `<div class="empty-state"><div class="es-icon">👤</div><div class="es-text">请先添加人物</div><button class="btn btn-primary es-btn" data-go="/people/add">＋ 添加人物</button></div>`;
    bindGo(el);
    return;
  }
  el.innerHTML = `
    <div class="form-hint">以 ${person.nickname} 的身份练习对话，提升你的沟通技巧。试着用不同方式开场吧 💕</div>
    <div class="card solid" style="padding: 12px;">
      <div class="flex-between" style="margin-bottom: 8px;">
        <div class="text-small text-muted">对话对象</div>
        <select class="field-select" id="chat_person" style="width:auto; padding:6px 28px 6px 12px; font-size:13px;">
          ${people.map(p => `<option value="${p.id}" ${p.id === person.id ? 'selected' : ''}>${p.nickname}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="chat-window" id="chat_window">
      <div class="chat-msg">
        <div class="cm-avatar">${pickAvatar(person)}</div>
        <div class="cm-bubble">嗨～我是 ${person.nickname}。你想聊点什么？可以试着向我打招呼、表达感受，或者练习如何和好 💕</div>
      </div>
    </div>
    <div class="chat-input-row">
      <input class="field-input" id="chat_input" placeholder="说点什么..." />
      <button class="btn btn-primary" id="chat_send">发送</button>
    </div>
    <div class="section-title"><h3>💡 试试这些开场白</h3></div>
    <div class="card solid" style="padding: 10px 12px;">
      ${['你好呀～', '我刚刚有点委屈想和你说', '我们和好吧', '周末有空一起吃饭吗'].map(s => `<div class="tag" style="cursor:pointer; margin-bottom: 8px; padding: 8px 14px;" data-quick="${s}">${s}</div>`).join('')}
    </div>
  `;
  const win = $('#chat_window');
  const send = async () => {
    const msg = $('#chat_input').value.trim();
    if (!msg) return;
    const currentPerson = getPeople().find(p => p.id === $('#chat_person').value);
    win.innerHTML += `<div class="chat-msg self"><div class="cm-avatar">🙋</div><div class="cm-bubble">${escapeHtml(msg)}</div></div>`;
    $('#chat_input').value = '';
    win.innerHTML += `<div class="chat-msg" id="loading_msg"><div class="cm-avatar">${pickAvatar(currentPerson)}</div><div class="cm-bubble"><span class="al-dots"></span></div></div>`;
    win.scrollTop = win.scrollHeight;
    const reply = await simulateChatReply({ personId: currentPerson.id, message: msg });
    const lm = $('#loading_msg');
    if (lm) lm.querySelector('.cm-bubble').textContent = reply.split('：')[1] || reply;
    win.scrollTop = win.scrollHeight;
  };
  $('#chat_send').onclick = send;
  $('#chat_input').onkeydown = (e) => { if (e.key === 'Enter') send(); };
  $$('[data-quick]').forEach(b => b.onclick = () => { $('#chat_input').value = b.dataset.quick; send(); });
  $('#chat_person').onchange = () => {
    const p = getPeople().find(x => x.id === $('#chat_person').value);
    win.innerHTML = `<div class="chat-msg"><div class="cm-avatar">${pickAvatar(p)}</div><div class="cm-bubble">嗨～我是 ${p.nickname}。你想聊点什么？</div></div>`;
  };
});

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* ----- 求婚策划 ----- */
route('/feature/proposal', (el) => {
  el.innerHTML = `
    <div class="form-hint">把一生一次的仪式感交给 AI，从场景到话术全流程策划</div>
    <div class="card solid">
      <div class="field-group">
        <label class="field-label">求婚风格</label>
        <select class="field-select" id="prop_style">
          <option value="romantic">💕 浪漫星空</option>
          <option value="surprise">🎁 日常惊喜</option>
        </select>
      </div>
      <div class="field-group">
        <label class="field-label">预算（元）</label>
        <input class="field-input" id="prop_budget" type="number" value="10000" />
      </div>
      <div class="field-group">
        <label class="field-label">特别要求</label>
        <textarea class="field-textarea" id="prop_note" placeholder="如：希望有家人在场 / 想养一只猫 / 在初次见面的地方..."></textarea>
      </div>
      <button class="btn btn-primary btn-block" id="prop_btn">💍 生成求婚方案</button>
    </div>
    <div id="result"></div>
  `;
  $('#prop_btn').onclick = async () => {
    const input = {
      style: $('#prop_style').value,
      budget: parseInt($('#prop_budget').value) || 10000,
      note: $('#prop_note').value.trim(),
    };
    $('#result').innerHTML = aiLoading();
    const r = await planProposal(input);
    addHistory('proposal', '求婚方案', r.theme);
    $('#result').innerHTML = `
      <div class="result-block">
        <div class="rb-title">💍 ${r.theme}</div>
        <div class="rb-content"><b>推荐场地：</b>${r.venue}</div>
      </div>
      <div class="result-block">
        <div class="rb-title">📋 完整流程</div>
        <div class="card solid" style="padding:18px;">
          <div class="timeline">
            ${r.flow.map((step, i) => `<div class="timeline-item">
              <div class="ti-time">STEP ${i + 1}</div>
              <div class="ti-title">${step}</div>
            </div>`).join('')}
          </div>
        </div>
      </div>
      <div class="result-block">
        <div class="rb-title">💌 求婚词参考</div>
        <div class="card solid" style="padding:18px; font-style:italic; line-height:1.8; font-size:15px;">${r.vow}</div>
      </div>
      <div class="result-block">
        <div class="rb-title">💰 预算分配</div>
        <div class="rb-content">${r.budget}</div>
      </div>
      <button class="btn btn-ghost btn-block btn-sm" id="fav_prop">⭐ 收藏方案</button>
    `;
    $('#fav_prop').onclick = () => addFavorite('proposal', r.theme, r.vow);
  };
});

/* ----- 自主模式 ----- */
route('/feature/free', (el) => {
  const people = getPeople();
  el.innerHTML = `
    <div class="form-hint">选择对话对象，让 AI 教练结合 ta 的资料给出更贴心的建议</div>
    <div class="card solid">
      <div class="field-group">
        <label class="field-label">对话对象</label>
        <select class="field-select" id="free_person">
          <option value="">— 不指定（通用建议）—</option>
          ${people.map(p => `<option value="${p.id}">${p.nickname}（${(RELATIONS[p.relation] || {}).label}）</option>`).join('')}
        </select>
      </div>
      <div class="field-group">
        <label class="field-label">你的问题</label>
        <textarea class="field-textarea" id="free_q" placeholder="如：我和他冷战三天了，怎么办？/ 他到底喜不喜欢我？/ 我该分手吗？" style="min-height: 120px;"></textarea>
      </div>
      <button class="btn btn-primary btn-block" id="free_btn">💌 让 AI 回答</button>
    </div>
    <div class="section-title"><h3>💡 热门话题</h3></div>
    <div class="card solid" style="padding: 8px 12px;">
      ${['怎么知道 ta 喜不喜欢我', '吵架后如何主动和好', '异地恋怎么维持', '我该分手吗', '对方冷战怎么办'].map(q => `<div class="tag" style="cursor:pointer; margin: 4px 0; padding: 10px 14px; display:block;" data-q="${q}">${q}</div>`).join('')}
    </div>
    <div id="result"></div>
  `;
  const ask = async (q) => {
    if (!q) { toast('请输入你的问题'); return; }
    const personId = $('#free_person').value;
    const person = personId ? getPeople().find(p => p.id === personId) : null;
    $('#free_q').value = q;
    $('#result').innerHTML = aiLoading();
    const r = await freeAsk({ question: q, personId, person });
    addHistory('free', '情感咨询：' + q.slice(0, 20), r.summary);
    const contextNote = person ? `<div class="text-small text-muted" style="margin-bottom:8px;">💭 已结合 ${person.nickname} 的资料分析</div>` : '';
    $('#result').innerHTML = `
      ${contextNote}
      <div class="result-block">
        <div class="rb-title">💗 AI 教练说</div>
        <div class="rb-content" style="font-size:15px; line-height:1.7;">${r.summary}</div>
      </div>
      <div class="result-block">
        <div class="rb-title">💡 建议要点</div>
        <ul class="rb-list">${r.points.map(p => `<li>${p.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')}</li>`).join('')}</ul>
      </div>
      <button class="btn btn-ghost btn-block btn-sm" id="fav_free">⭐ 收藏</button>
    `;
    $('#fav_free').onclick = () => addFavorite('free', q, r.summary + '\n\n' + r.points.join('\n'));
  };
  $('#free_btn').onclick = () => ask($('#free_q').value.trim());
  $$('[data-q]').forEach(b => b.onclick = () => ask(b.dataset.q));
});

/* ============================================
   情侣 Tab
   ============================================ */
route('/couple', (el) => {
  const c = getCouple();
  if (!c.bound) {
    el.innerHTML = `
      <div class="card solid couple-bind-card">
        <div class="cb-icon">💌</div>
        <div class="cb-title">还没有绑定情侣</div>
        <div class="cb-desc">绑定后即可使用事件分析与旅行计划<br>开启你们的双人专属空间</div>
        <button class="btn btn-primary btn-block" data-go="/couple/bind">💑 发起绑定</button>
      </div>
    `;
    bindGo(el);
    return;
  }
  const together = daysSince(c.togetherSince);
  el.innerHTML = `
    <div class="couple-hero">
      <div class="ch-avatars">
        <div class="ch-avatar">👩</div>
        <div class="ch-heart">❤️</div>
        <div class="ch-avatar right">${c.partnerAvatar || '👨'}</div>
      </div>
      <div class="ch-names">小满 & ${c.partnerName}</div>
      <div class="ch-days">在一起 <b>${together}</b> 天</div>
      <div class="couple-cta">
        <button class="btn" data-go="/couple/event">🔍 事件分析</button>
        <button class="btn ghost-light" data-go="/couple/travel">✈️ 旅行计划</button>
      </div>
    </div>

    <div class="section-title"><h3>情侣日常</h3></div>
    <div class="feature-grid">
      <div class="feature-card" data-go="/couple/event">
        <div class="fc-icon" style="background:linear-gradient(135deg,#EDE3F7,#D5C5F0)">🔍</div>
        <div class="fc-title">事件分析</div>
        <div class="fc-desc">双方视角综合分析</div>
      </div>
      <div class="feature-card" data-go="/couple/travel">
        <div class="fc-icon" style="background:linear-gradient(135deg,#D4ECFF,#A8D4FF)">✈️</div>
        <div class="fc-title">旅行计划</div>
        <div class="fc-desc">共同出行安排</div>
      </div>
    </div>

    <div class="section-title"><h3>最近纪念日</h3></div>
    ${renderAnniversaryPreview()}
  `;
  bindGo(el);
});

function renderAnniversaryPreview() {
  const an = getAnniversaries().map(a => ({ ...a, days: daysUntil(a.date) })).sort((a, b) => a.days - b.days).slice(0, 2);
  if (an.length === 0) return '<div class="card solid text-center text-muted">还没有纪念日</div>';
  return an.map(a => `
    <div class="anni-card ${a.days <= 7 ? 'urgent' : ''}">
      <div class="ac-icon">${a.icon || '💕'}</div>
      <div class="ac-body">
        <div class="ac-name">${a.name}</div>
        <div class="ac-date">${fmtDate(a.date)}</div>
      </div>
      <div class="ac-count">
        <b>${a.days}</b>
        <span>天后</span>
      </div>
    </div>
  `).join('');
}

/* ----- 情侣绑定 ----- */
route('/couple/bind', (el) => {
  const c = getCouple();
  el.innerHTML = `
    <div class="card solid couple-bind-card">
      <div class="cb-icon">💕</div>
      <div class="cb-title">生成专属绑定码</div>
      <div class="cb-desc">让 ta 扫描二维码或输入绑定码<br>双方确认后即可成为情侣</div>
      <div class="cb-qr">
        <div class="cb-qr-pattern"></div>
      </div>
      <div class="cb-code">${c.bindCode || 'DNXXXXXX'}</div>
      <div style="display:flex; gap:10px; width:100%;">
        <button class="btn btn-ghost" style="flex:1;" id="copy_btn">📋 复制邀请码</button>
        <button class="btn btn-primary" style="flex:1;" id="mock_bind">模拟对方扫码</button>
      </div>
    </div>
    <div class="card solid">
      <div class="section-title" style="margin:0 0 12px;"><h3>📌 绑定说明</h3></div>
      <ul class="text-small" style="color: var(--c-text-soft); line-height: 1.8; padding-left: 18px;">
        <li>绑定后双方将共享情侣空间</li>
        <li>事件分析需双方各自填写视角</li>
        <li>任何一方均可解除绑定</li>
        <li>绑定信息仅双方可见</li>
      </ul>
    </div>
  `;
  $('#copy_btn').onclick = () => {
    const code = c.bindCode || 'DNXXXXXX';
    if (navigator.clipboard) navigator.clipboard.writeText(code);
    toast('📋 已复制：' + code);
  };
  $('#mock_bind').onclick = () => {
    store.set('couple', { ...c, bound: true, partnerName: '阿哲', partnerAvatar: '👨', togetherSince: '2020-10-20' });
    toast('💑 绑定成功！');
    setTimeout(() => navigate('/couple'), 800);
  };
});

/* ----- 事件分析 ----- */
route('/couple/event', (el) => {
  el.innerHTML = `
    <div class="form-hint">双方各自填写视角，AI 综合分析给出建议。请先填写自己的，再请对方填写</div>
    <div class="card solid">
      <div class="section-title" style="margin:0 0 14px;"><h3>👩 我的视角</h3></div>
      <div class="field-group">
        <label class="field-label">发生了什么？（事实）</label>
        <textarea class="field-textarea" id="ev_self_event" placeholder="客观描述，如：他这周加了 4 天班，没时间陪我..."></textarea>
      </div>
      <div class="field-group">
        <label class="field-label">我的感受</label>
        <textarea class="field-textarea" id="ev_self_feel" placeholder="如：我感觉被忽略，难过，孤单..." style="min-height:80px;"></textarea>
      </div>
      <div class="field-group">
        <label class="field-label">我的诉求</label>
        <textarea class="field-textarea" id="ev_self_need" placeholder="如：希望他能提前告诉我，每周至少留一晚陪我..." style="min-height:80px;"></textarea>
      </div>
    </div>
    <div class="card solid">
      <div class="section-title" style="margin:0 0 14px;"><h3>👨 ${getCouple().partnerName || '对方'}的视角</h3></div>
      <div class="field-group">
        <label class="field-label">ta 的事实描述</label>
        <textarea class="field-textarea" id="ev_partner_event" placeholder="让 ta 也来填写，或你代为描述..." ></textarea>
      </div>
      <div class="field-group">
        <label class="field-label">ta 的感受</label>
        <textarea class="field-textarea" id="ev_partner_feel" placeholder="如：他也觉得抱歉，但工作压力大..." style="min-height:80px;"></textarea>
      </div>
      <div class="field-group">
        <label class="field-label">ta 的诉求</label>
        <textarea class="field-textarea" id="ev_partner_need" placeholder="如：希望被理解，希望你能多支持他的事业..." style="min-height:80px;"></textarea>
      </div>
      <button class="btn btn-primary btn-block" id="ev_btn">🔍 AI 综合分析</button>
    </div>
    <div id="result"></div>
  `;
  $('#ev_btn').onclick = async () => {
    const input = {
      selfEvent: $('#ev_self_event').value.trim(),
      selfFeel: $('#ev_self_feel').value.trim(),
      selfNeed: $('#ev_self_need').value.trim(),
      partnerEvent: $('#ev_partner_event').value.trim(),
      partnerFeel: $('#ev_partner_feel').value.trim(),
      partnerNeed: $('#ev_partner_need').value.trim(),
    };
    if (!input.selfEvent) { toast('请先填写你的视角'); return; }
    $('#result').innerHTML = aiLoading();
    const r = await analyzeCoupleEvent(input);
    addHistory('event', '情侣事件分析', r.contradiction);
    $('#result').innerHTML = `
      <div class="result-block">
        <div class="rb-title">⚖️ 矛盾拆解</div>
        <div class="rb-content">${r.contradiction}</div>
      </div>
      <div class="result-block">
        <div class="rb-title">💗 你的心理</div>
        <div class="rb-content">${r.selfMind}</div>
      </div>
      <div class="result-block">
        <div class="rb-title">💗 ${(getCouple().partnerName) || '对方'}的心理</div>
        <div class="rb-content">${r.partnerMind}</div>
      </div>
      <div class="result-block">
        <div class="rb-title">🧠 双方认知偏差</div>
        <ul class="rb-list">${r.biases.map(b => `<li>${b}</li>`).join('')}</ul>
      </div>
      <div class="result-block">
        <div class="rb-title">💡 建设性建议</div>
        <ul class="rb-list">${r.suggestions.map(s => `<li>${s}</li>`).join('')}</ul>
      </div>
      <div class="result-block">
        <div class="rb-title">💬 和解话术参考</div>
        ${r.scripts.map(s => `<div class="card solid" style="margin-bottom:8px; padding:14px; font-style:italic; line-height:1.7;">${s}</div>`).join('')}
      </div>
      <button class="btn btn-ghost btn-block btn-sm" id="fav_ev">⭐ 收藏分析结果</button>
    `;
    $('#fav_ev').onclick = () => addFavorite('event', '情侣事件分析', r.scripts.join('\n\n'));
    $('#result').scrollIntoView({ behavior: 'smooth' });
  };
});

/* ----- 旅行计划 ----- */
route('/couple/travel', (el) => {
  el.innerHTML = `
    <div class="form-hint">输入你们的旅行想法，AI 帮你生成完整行程 + 准备清单</div>
    <div class="card solid">
      <div class="field-group">
        <label class="field-label">出行日期</label>
        <input class="field-input" id="tr_date" type="date" value="${today()}" />
      </div>
      <div class="field-group">
        <label class="field-label">目的地</label>
        <input class="field-input" id="tr_dest" value="杭州" placeholder="如：杭州" />
      </div>
      <div class="field-group">
        <label class="field-label">天数</label>
        <select class="field-select" id="tr_days">
          ${[1, 2, 3, 4, 5, 7].map(d => `<option value="${d}" ${d === 3 ? 'selected' : ''}>${d} 天</option>`).join('')}
        </select>
      </div>
      <div class="field-group">
        <label class="field-label">预算（元）</label>
        <input class="field-input" id="tr_budget" type="number" value="3000" />
      </div>
      <div class="field-group">
        <label class="field-label">旅行主题</label>
        <select class="field-select" id="tr_theme">
          ${['休闲度假', '美食探店', '自然风光', '人文历史', '浪漫蜜月', '亲子出行'].map(v => `<option>${v}</option>`).join('')}
        </select>
      </div>
      <div class="field-group">
        <label class="field-label">特殊偏好 / 忌口</label>
        <textarea class="field-textarea" id="tr_pref" placeholder="如：不吃辣 / 必去西湖 / 想住江景房..." style="min-height:80px;"></textarea>
      </div>
      <button class="btn btn-primary btn-block" id="tr_btn">✈️ 生成旅行计划</button>
    </div>
    <div id="result"></div>
  `;
  $('#tr_btn').onclick = async () => {
    const input = {
      date: $('#tr_date').value,
      destination: $('#tr_dest').value.trim(),
      days: parseInt($('#tr_days').value),
      budget: parseInt($('#tr_budget').value),
      theme: $('#tr_theme').value,
      pref: $('#tr_pref').value.trim(),
    };
    if (!input.destination) { toast('请填写目的地'); return; }
    $('#result').innerHTML = aiLoading();
    const r = await planTravel(input);
    addHistory('travel', `${input.destination} 旅行计划`, `${input.days} 天 · ${input.theme}`);
    $('#result').innerHTML = `
      <div class="result-block">
        <div class="rb-title">🗺️ ${input.destination} ${input.days} 日行程</div>
        ${r.days.map(d => `
          <div class="card solid" style="margin-bottom: 12px; padding: 18px;">
            <div class="serif bold" style="font-size: 16px; color: var(--c-primary-deep); margin-bottom: 12px;">${d.date}</div>
            <div class="timeline">
              ${d.items.map(t => `<div class="timeline-item">
                <div class="ti-time">${t.time}</div>
                <div class="ti-title">${t.title}</div>
                <div class="ti-desc">${t.desc}</div>
              </div>`).join('')}
            </div>
          </div>
        `).join('')}
      </div>
      <div class="result-block">
        <div class="rb-title">🧳 出行准备清单</div>
        <ul class="rb-list">${r.prep.map(p => `<li>${p}</li>`).join('')}</ul>
      </div>
      <div class="result-block">
        <div class="rb-title">💡 旅行建议</div>
        <ul class="rb-list">${r.tips.map(t => `<li>${t}</li>`).join('')}</ul>
      </div>
      <div class="result-block">
        <div class="rb-title">🌤️ 天气提醒</div>
        <div class="rb-content">${r.weather}</div>
      </div>
      <button class="btn btn-ghost btn-block btn-sm" id="fav_tr">⭐ 收藏行程</button>
    `;
    $('#fav_tr').onclick = () => addFavorite('travel', `${input.destination} 旅行计划`, r.days.map(d => d.items.map(i => `${i.time} ${i.title}`).join(' / ')).join(' | '));
  };
});

/* ============================================
   我的 Tab
   ============================================ */
route('/mine', (el) => {
  const c = getCouple();
  const favCount = getFavorites().length;
  const hisCount = getHistory().length;
  const anniCount = getAnniversaries().length;
  el.innerHTML = `
    <div class="profile-hero" style="background: linear-gradient(135deg, #C4B0F5 0%, #A78BFA 100%); padding: 22px 20px;">
      <div class="ph-row">
        <div class="avatar">💗</div>
        <div class="ph-info">
          <div class="ph-name">情感中心</div>
          <div class="ph-meta">
            <span>⭐ ${favCount} 收藏</span>
            <span>📋 ${hisCount} 历史</span>
            <span>📅 ${anniCount} 纪念日</span>
          </div>
        </div>
      </div>
    </div>

    <div class="mine-list">
      <div class="ml-group">
        <div class="ml-group-title">💌 情感工具</div>
        <div class="ml-card">
          <div class="mine-item" data-go="/mine/anniversary">
            <div class="mi-icon" style="background:#EDE3F7">📅</div>
            <div class="mi-body"><div class="mi-title">纪念日提醒</div><div class="mi-sub">${anniCount} 个重要日期</div></div>
            <div class="mi-arrow">›</div>
          </div>
          <div class="mine-item" data-go="/mine/scripts">
            <div class="mi-icon" style="background:#FFF4DA">💬</div>
            <div class="mi-body"><div class="mi-title">沟通话术库</div><div class="mi-sub">高情商话术参考</div></div>
            <div class="mi-arrow">›</div>
          </div>
          <div class="mine-item" data-go="/mine/training">
            <div class="mi-icon" style="background:#E6F7F2">🎓</div>
            <div class="mi-body"><div class="mi-title">情商训练<div class="mi-badge">每日</div></div><div class="mi-sub">每天一题，提升沟通</div></div>
            <div class="mi-arrow">›</div>
          </div>
        </div>
      </div>

      <div class="ml-group">
        <div class="ml-group-title">📋 我的记录</div>
        <div class="ml-card">
          <div class="mine-item" data-go="/mine/history">
            <div class="mi-icon" style="background:#F0E0FF">🕐</div>
            <div class="mi-body"><div class="mi-title">历史记录</div><div class="mi-sub">${hisCount} 条记录</div></div>
            <div class="mi-arrow">›</div>
          </div>
          <div class="mine-item" data-go="/mine/favorites">
            <div class="mi-icon" style="background:#EDE3F7">⭐</div>
            <div class="mi-body"><div class="mi-title">我的收藏</div><div class="mi-sub">${favCount} 个收藏</div></div>
            <div class="mi-arrow">›</div>
          </div>
        </div>
      </div>

      <div class="ml-group">
        <div class="ml-group-title">⚙️ 其他</div>
        <div class="ml-card">
          <div class="mine-item" data-go="/mine/settings">
            <div class="mi-icon" style="background:#E6E8F5">⚙️</div>
            <div class="mi-body"><div class="mi-title">设置中心</div><div class="mi-sub">账号 / 隐私 / 通知</div></div>
            <div class="mi-arrow">›</div>
          </div>
        </div>
      </div>
    </div>

    <div class="card solid text-center text-muted text-small" style="margin-top: 12px;">
      懂你 AI · v1.0.0 demo<br>
      <span style="font-family: var(--f-num); font-size: 11px;">Made with 💕 for every heart</span>
    </div>
  `;
  bindGo(el);
});

/* ----- 纪念日 ----- */
route('/mine/anniversary', (el) => {
  const an = getAnniversaries().map(a => ({ ...a, days: daysUntil(a.date) })).sort((a, b) => a.days - b.days);
  el.innerHTML = `
    <button class="btn btn-primary btn-block" id="add_btn" style="margin-bottom: 16px;">＋ 添加纪念日</button>
    ${an.length === 0 ? `<div class="empty-state"><div class="es-icon">📅</div><div class="es-text">还没有纪念日</div></div>` :
      an.map(a => `
        <div class="anni-card ${a.days <= 7 ? 'urgent' : ''}">
          <div class="ac-icon">${a.icon || '💕'}</div>
          <div class="ac-body">
            <div class="ac-name">${a.name}</div>
            <div class="ac-date">${fmtDate(a.date)} · ${a.type === 'birthday' ? '生日' : a.type === 'wedding' ? '结婚' : '恋爱'}</div>
          </div>
          <div class="ac-count">
            <b>${a.days}</b>
            <span>天后</span>
          </div>
        </div>
      `).join('')}
  `;
  $('#add_btn').onclick = () => {
    modal('添加纪念日', `
      <div class="field-group"><label class="field-label">名称</label><input class="field-input" id="an_name" placeholder="如：在一起纪念日" /></div>
      <div class="field-group"><label class="field-label">日期</label><input class="field-input" id="an_date" type="date" /></div>
      <div class="field-group"><label class="field-label">类型</label>
        <select class="field-select" id="an_type">
          <option value="love">💕 恋爱</option>
          <option value="wedding">💍 结婚</option>
          <option value="birthday">🎂 生日</option>
          <option value="other">🌟 其他</option>
        </select>
      </div>
      <button class="btn btn-primary btn-block" id="an_save">保存</button>
    `, {
      onMount: (root, close) => {
        $('#an_save').onclick = () => {
          const name = $('#an_name').value.trim();
          const date = $('#an_date').value;
          if (!name || !date) { toast('请填写完整'); return; }
          const type = $('#an_type').value;
          const icon = type === 'birthday' ? '🎂' : type === 'wedding' ? '💍' : '💕';
          const list = getAnniversaries();
          list.push({ id: uid(), name, date, type, icon });
          store.set('anniversaries', list);
          close();
          toast('✓ 已添加');
          setTimeout(render, 500);
        };
      }
    });
  };
});

/* ----- 沟通话术库 ----- */
route('/mine/scripts', (el) => {
  const scripts = {
    '吵架和好': [
      { tag: '主动开口', content: '我知道刚刚我们都有点上头，我现在冷静下来了。比起这件事，我更在乎你。能抱一下吗？' },
      { tag: '认错', content: '我刚刚说的那句话是气话，不是真的那么想。我真正想说的是：你对我很重要，我不想因为这种事影响我们。' },
      { tag: '邀请沟通', content: '我想听你说说你的想法，我保证不打断，也不急着反驳。你愿意告诉我吗？' },
    ],
    '日常关心': [
      { tag: '早上', content: '早安呀，今天也要好好吃饭。下午有空一起喝杯咖啡吗？' },
      { tag: '下班', content: '今天辛苦啦。要不要我给你点杯热饮？先休息一下，不用回我。' },
      { tag: '睡前', content: '晚安。今天有个瞬间突然想到你，就笑了。希望你梦里有星星。' },
    ],
    '表达爱意': [
      { tag: '直接说', content: '其实我们之间最让我安心的不是浪漫，而是每次我难过你都在。谢谢你。' },
      { tag: '间接说', content: '今天看到一句话："爱一个人就是看见 ta 的笑就笑。" 突然想到你。' },
      { tag: '行动派', content: '我订了你上次说想去的那家餐厅。这周末，给你。' },
    ],
    '道歉': [
      { tag: '真诚', content: '对不起，我没考虑到你的感受。我以后会先问你的想法再行动。' },
      { tag: '具体', content: '我知道昨晚我不该那么说话，是我没控制好情绪。你能原谅我吗？' },
    ],
    '需要空间': [
      { tag: '温柔', content: '我现在情绪有点乱，不是不想理你，是想先把自己整理好。给我半小时，好不好？' },
      { tag: '安心', content: '我先去散步消化一下，你别担心。我保证回来我们就好好聊。' },
    ],
  };
  let current = '吵架和好';
  const renderScripts = () => {
    const list = scripts[current] || [];
    $('#scripts_list').innerHTML = list.length === 0 ? '<div class="empty-state"><div class="es-icon">💬</div><div class="es-text">暂无话术</div></div>' :
      list.map((s, i) => `
        <div class="script-card">
          <div class="sc-tag">${s.tag}</div>
          <div class="sc-content">${s.content}</div>
          <div class="sc-actions">
            <button class="btn btn-ghost btn-sm" data-copy="${i}">📋 复制</button>
            <button class="btn btn-ghost btn-sm" data-fav="${i}">⭐ 收藏</button>
          </div>
        </div>
      `).join('');
    $$('[data-copy]').forEach(b => b.onclick = () => {
      const s = scripts[current][parseInt(b.dataset.copy)];
      if (navigator.clipboard) navigator.clipboard.writeText(s.content);
      toast('📋 已复制');
    });
    $$('[data-fav]').forEach(b => b.onclick = () => {
      const s = scripts[current][parseInt(b.dataset.fav)];
      addFavorite('script', `${current} · ${s.tag}`, s.content);
    });
  };
  el.innerHTML = `
    <div class="form-hint">高情商话术参考，按场景分类，可一键收藏</div>
    <div class="card solid" style="padding: 10px 8px;">
      <div style="display:flex; flex-wrap:wrap; gap:6px;">
        ${Object.keys(scripts).map(k => `<div class="tag" style="cursor:pointer; ${k === current ? 'background:var(--g-warm); color:white;' : ''}" data-cat="${k}">${k}</div>`).join('')}
      </div>
    </div>
    <div id="scripts_list"></div>
  `;
  $$('[data-cat]').forEach(b => b.onclick = () => {
    current = b.dataset.cat;
    $$('[data-cat]').forEach(x => x.style.cssText = x.dataset.cat === current ? 'cursor:pointer; background:var(--g-warm); color:white;' : 'cursor:pointer;');
    renderScripts();
  });
  renderScripts();
});

/* ----- 情商训练 ----- */
route('/mine/training', (el) => {
  const questions = [
    {
      emoji: '😤',
      tag: '情景模拟',
      q: '对方加班很晚回家，疲惫地说"今天好累"，你最合适的回应是？',
      opts: [
        '"我也是，今天我也超累的。"',
        '"你不是一直都想做这个项目吗，加油。"',
        '"辛苦了，先去洗个澡，饭我热好了。"  ←',
        '"你怎么不早点说，我等你半天。"',
      ],
      answer: 2,
      explain: '共情 ≠ 比惨。先看见对方当下的疲惫，用行动而非语言回应，是最温柔的共情。',
    },
    {
      emoji: '💔',
      tag: '认知偏差',
      q: '对方一整天没回你消息，你脑中冒出"ta 一定是不爱我了"。这是哪种认知偏差？',
      opts: [
        '读心术（认为对方"应该知道"）',
        '灾难化（把小事放大到极端）',
        '非黑即白（要么全爱要么全不爱）',
        '以上都是  ←',
      ],
      answer: 3,
      explain: '这种自动思维通常同时叠加多种偏差。识别它本身就是情商提升的第一步。',
    },
    {
      emoji: '🙏',
      tag: '沟通技巧',
      q: '想表达"我希望你多陪我"，下面哪种说法最高情商？',
      opts: [
        '"你总是不陪我，是不是不爱我了？"',
        '"你为什么每周都要加班？"',
        '"我最近很想和你多待一会儿，我们能不能每周留一晚专属对方？  ←"',
        '"你看别人的对象，每周都陪对方。"',
      ],
      answer: 2,
      explain: '"非暴力沟通"四步：观察 → 感受 → 需要 → 请求。避免"总是"、避免比较、明确具体请求。',
    },
  ];
  let idx = 0;
  const renderQ = () => {
    const q = questions[idx];
    el.innerHTML = `
      <div class="form-hint">每日一题，每天进步一点点</div>
      <div class="training-card">
        <div class="tc-emoji">${q.emoji}</div>
        <div class="tc-tag">${q.tag} · 第 ${idx + 1} / ${questions.length} 题</div>
        <div class="tc-q">${q.q}</div>
        <div class="tc-opts">
          ${q.opts.map((o, i) => `<div class="tc-opt" data-opt="${i}">${o.replace('  ←', '')}</div>`).join('')}
        </div>
      </div>
      <div id="explain" style="display:none;"></div>
      <div class="flex" style="gap: 10px; margin-top: 16px;">
        <button class="btn btn-ghost" style="flex:1;" id="prev" ${idx === 0 ? 'disabled style="opacity:.4;flex:1;"' : ''}>上一题</button>
        <button class="btn btn-primary" style="flex:1;" id="next">下一题</button>
      </div>
    `;
    let answered = false;
    $$('[data-opt]').forEach(b => b.onclick = () => {
      if (answered) return;
      answered = true;
      const i = parseInt(b.dataset.opt);
      const correct = i === q.answer;
      $$('.tc-opt').forEach((x, j) => {
        if (j === q.answer) x.classList.add('selected');
      });
      $('#explain').style.display = 'block';
      $('#explain').innerHTML = `
        <div class="card solid" style="border-left: 3px solid ${correct ? 'var(--c-mint)' : '#FFB4C4'};">
          <div class="bold" style="color: ${correct ? '#2F8F75' : '#C53A3A'}; margin-bottom: 8px;">
            ${correct ? '✓ 回答正确' : '✗ 再想想'}
          </div>
          <div class="text-small" style="line-height: 1.7; color: var(--c-text-soft);">${q.explain}</div>
        </div>
      `;
      if (correct) toast('🎉 答对啦！');
    });
    $('#next').onclick = () => { idx = (idx + 1) % questions.length; renderQ(); };
    if ($('#prev')) $('#prev').onclick = () => { idx = (idx - 1 + questions.length) % questions.length; renderQ(); };
  };
  renderQ();
});

/* ----- 历史记录 ----- */
route('/mine/history', (el) => {
  const h = getHistory();
  el.innerHTML = `
    <div class="form-hint">所有 AI 分析记录都会自动保存在这里</div>
    ${h.length === 0 ? `<div class="empty-state"><div class="es-icon">🕐</div><div class="es-text">还没有任何记录</div><div class="text-small" style="margin-top:8px;">去试试吵架分析或送礼推荐吧</div></div>` :
      h.map(item => `
        <div class="card solid" style="padding: 14px 16px;">
          <div class="flex-between">
            <div class="bold" style="font-size: 15px;">${typeIcon(item.type)} ${item.title}</div>
            <div class="text-muted text-small">${item.createdAt}</div>
          </div>
          <div class="text-small" style="margin-top: 6px; color: var(--c-text-soft); line-height: 1.6;">${item.summary}</div>
        </div>
      `).join('')}
    ${h.length > 0 ? `<button class="btn btn-ghost btn-block" id="clear_btn" style="color:#C53A3A; border-color:#FFC4C4;">清空历史</button>` : ''}
  `;
  if ($('#clear_btn')) $('#clear_btn').onclick = () => {
    modal('清空历史', `<p style="text-align:center; padding:10px 0 20px;">确定要清空所有历史记录吗？</p><div style="display:flex; gap:10px;"><button class="btn btn-ghost btn-block" data-cancel>取消</button><button class="btn btn-primary btn-block" data-ok style="background:linear-gradient(135deg,#FF6B6B,#C53A3A);">清空</button></div>`, {
      onMount: (root, close) => {
        root.querySelector('[data-cancel]').onclick = close;
        root.querySelector('[data-ok]').onclick = () => {
          store.set('history', []);
          close();
          toast('已清空');
          setTimeout(render, 500);
        };
      }
    });
  };
});

function typeIcon(t) {
  return ({ argue: '💔', gift: '🎁', date: '🌹', chat: '💬', proposal: '💍', free: '💌', event: '⚖️', travel: '✈️' })[t] || '📋';
}

/* ----- 收藏 ----- */
route('/mine/favorites', (el) => {
  const f = getFavorites();
  el.innerHTML = `
    <div class="form-hint">收藏的话术与建议，方便随时查看</div>
    ${f.length === 0 ? `<div class="empty-state"><div class="es-icon">⭐</div><div class="es-text">还没有收藏</div><div class="text-small" style="margin-top:8px;">在话术库或分析结果中点 ⭐ 即可收藏</div></div>` :
      f.map(item => `
        <div class="card solid" style="padding: 14px 16px;">
          <div class="flex-between">
            <div class="bold" style="font-size: 15px;">${typeIcon(item.type)} ${item.title}</div>
            <div class="text-muted text-small">${item.createdAt}</div>
          </div>
          <div class="text-small" style="margin-top: 8px; color: var(--c-text); line-height: 1.7; white-space: pre-wrap;">${item.content}</div>
          <div class="flex" style="gap: 8px; margin-top: 10px;">
            <button class="btn btn-ghost btn-sm" data-copy="${item.id}">📋 复制</button>
            <button class="btn btn-ghost btn-sm" data-del="${item.id}" style="color:#C53A3A;">🗑 删除</button>
          </div>
        </div>
      `).join('')}
  `;
  $$('[data-copy]').forEach(b => b.onclick = () => {
    const item = f.find(x => x.id === b.dataset.copy);
    if (item && navigator.clipboard) navigator.clipboard.writeText(item.content);
    toast('📋 已复制');
  });
  $$('[data-del]').forEach(b => b.onclick = () => {
    store.set('favorites', getFavorites().filter(x => x.id !== b.dataset.del));
    toast('已删除');
    setTimeout(render, 500);
  });
});

/* ----- 设置中心 ----- */
route('/mine/settings', (el) => {
  const s = getSettings();
  el.innerHTML = `
    <div class="section-title"><h3>🔔 通知设置</h3></div>
    <div class="switch-row">
      <div class="sr-body">
        <div class="sr-title">推送通知</div>
        <div class="sr-sub">接收 AI 回复与每日提醒</div>
      </div>
      <div class="switch ${s.notification ? 'on' : ''}" data-key="notification"></div>
    </div>
    <div class="switch-row">
      <div class="sr-body">
        <div class="sr-title">纪念日提醒</div>
        <div class="sr-sub">纪念日提前 3 天提醒</div>
      </div>
      <div class="switch ${s.anniversaryRemind ? 'on' : ''}" data-key="anniversaryRemind"></div>
    </div>

    <div class="section-title"><h3>🔒 隐私</h3></div>
    <div class="info-row">
      <div class="ir-label">资料可见范围</div>
      <div class="ir-value">
        <select class="field-select" id="set_privacy" style="border:none; background:transparent; padding:0; width:auto; font-weight:500;">
          <option value="self" ${s.privacy === 'self' ? 'selected' : ''}>仅自己</option>
          <option value="friends" ${s.privacy === 'friends' ? 'selected' : ''}>好友</option>
          <option value="public" ${s.privacy === 'public' ? 'selected' : ''}>公开</option>
        </select>
      </div>
    </div>

    <div class="section-title"><h3>👤 账号</h3></div>
    <div class="info-row"><div class="ir-label">当前账号</div><div class="ir-value">小满</div></div>
    <div class="info-row"><div class="ir-label">绑定状态</div><div class="ir-value">${getCouple().bound ? '已绑定' : '未绑定'}</div></div>
    <div class="info-row"><div class="ir-label">App 版本</div><div class="ir-value num">v1.0.0 demo</div></div>

    <div class="section-title"><h3>💾 数据</h3></div>
    <button class="btn btn-ghost btn-block" id="export_btn">📤 导出我的数据</button>
    <button class="btn btn-ghost btn-block" id="reset_btn" style="color:#C53A3A; border-color:#FFC4C4; margin-top: 8px;">🗑 重置所有数据</button>

    <div class="card solid text-center text-muted text-small" style="margin-top: 16px;">
      懂你 AI · 让每个人都学会爱与被爱<br>
      <span style="font-family: var(--f-num); font-size: 11px;">© 2026 Dongni AI</span>
    </div>
  `;
  $$('.switch').forEach(sw => sw.onclick = () => {
    sw.classList.toggle('on');
    const key = sw.dataset.key;
    const s = getSettings();
    s[key] = sw.classList.contains('on');
    store.set('settings', s);
    toast(s[key] ? '✓ 已开启' : '已关闭');
  });
  $('#set_privacy').onchange = () => {
    const s = getSettings();
    s.privacy = $('#set_privacy').value;
    store.set('settings', s);
    toast('✓ 已保存');
  };
  $('#export_btn').onclick = () => {
    const data = {
      profile: getProfile(),
      people: getPeople(),
      couple: getCouple(),
      anniversaries: getAnniversaries(),
      favorites: getFavorites(),
      history: getHistory(),
      settings: getSettings(),
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dongni-data.json';
    a.click();
    URL.revokeObjectURL(url);
    toast('📤 已导出');
  };
  $('#reset_btn').onclick = () => {
    modal('重置数据', `<p style="text-align:center; padding:10px 0 20px;">将清空所有资料、人物、收藏与历史，确定继续？</p><div style="display:flex; gap:10px;"><button class="btn btn-ghost btn-block" data-cancel>取消</button><button class="btn btn-primary btn-block" data-ok style="background:linear-gradient(135deg,#FF6B6B,#C53A3A);">重置</button></div>`, {
      onMount: (root, close) => {
        root.querySelector('[data-cancel]').onclick = close;
        root.querySelector('[data-ok]').onclick = () => {
          ['profile', 'people', 'couple', 'anniversaries', 'favorites', 'history', 'settings'].forEach(k => localStorage.removeItem('dongni_' + k));
          close();
          toast('已重置');
          setTimeout(() => location.reload(), 600);
        };
      }
    });
  };
});

/* ---------- 绑定 data-go ---------- */
function bindGo(root) {
  $$('[data-go]', root).forEach(el => {
    el.onclick = () => navigate(el.dataset.go);
  });
}

/* ---------- 启动 ---------- */
initData();
if (!location.hash) location.hash = '/personal';
render();
