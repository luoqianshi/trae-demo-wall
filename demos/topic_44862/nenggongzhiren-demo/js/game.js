// ===== 能工智人 - 游戏核心逻辑（人机竞速版） =====

// ===== 游戏状态 =====
const GameState = {
  user: null,
  currentScreen: 'splash',
  activeOrder: null,
  orders: [],
  events: [],
  settings: {
    soundEnabled: true,
    vibrationEnabled: true
  }
};

// ===== 初始化数据 =====
const RANKS = [
  { id: 0, name: '实习能工智人', icon: '🌱', threshold: 0 },
  { id: 1, name: '初级能工智人', icon: '🌿', threshold: 500 },
  { id: 2, name: '中级能工智人', icon: '🌲', threshold: 3000 },
  { id: 3, name: '高级能工智人', icon: '⭐', threshold: 10000 },
  { id: 4, name: '王牌能工智人', icon: '👑', threshold: 50000 },
  { id: 5, name: '传奇能工智人', icon: '🔥', threshold: 200000 }
];

const SKILLS = [
  { id: 'speed', name: '手速拉满', icon: '⚡', desc: 'AI打字减速', maxLevel: 10, cost: [50, 100, 200, 500, 1000, 2000, 3000, 5000, 8000, 10000] },
  { id: 'intuition', name: '人类直觉', icon: '🧠', desc: '猜对概率提升', maxLevel: 10, cost: [50, 100, 200, 500, 1000, 2000, 3000, 5000, 8000, 10000] },
  { id: 'tolerance', name: '耐骂体质', icon: '🛡️', desc: '输了扣钱更少', maxLevel: 10, cost: [50, 100, 200, 500, 1000, 2000, 3000, 5000, 8000, 10000] },
  { id: 'undercut', name: '内卷达人', icon: '📉', desc: '抢单成功率提升', maxLevel: 10, cost: [50, 100, 200, 500, 1000, 2000, 3000, 5000, 8000, 10000] },
  { id: 'luck', name: '欧皇体质', icon: '🍀', desc: '多发暴击订单', maxLevel: 10, cost: [50, 100, 200, 500, 1000, 2000, 3000, 5000, 8000, 10000] }
];

const ORDER_TEMPLATES = [
  { name: '帮写年会发言稿', type: 'typing', aiBaseSpeed: 3000, baseReward: 20, difficulty: 1, clientTag: '事儿少' },
  { name: '改个高端PPT文案', type: 'guess', aiBaseChance: 0.4, baseReward: 25, difficulty: 2, clientTag: '改稿狂魔' },
  { name: '写周报，要显得做了很多事', type: 'typing', aiBaseSpeed: 2800, baseReward: 15, difficulty: 1, clientTag: '事儿少' },
  { name: '修复AI写的bug', type: 'typing', aiBaseSpeed: 3500, baseReward: 45, difficulty: 2, clientTag: '白嫖预警' },
  { name: '写辞职信，委婉但让老板后悔', type: 'guess', aiBaseChance: 0.4, baseReward: 22, difficulty: 2, clientTag: '事儿少' },
  { name: '陪聊安慰老板画饼', type: 'guess', aiBaseChance: 0.3, baseReward: 18, difficulty: 1, clientTag: '事儿少' },
  { name: '帮写请假理由', type: 'typing', aiBaseSpeed: 2500, baseReward: 12, difficulty: 1, clientTag: '事儿少' },
  { name: '整理周报数据话术', type: 'typing', aiBaseSpeed: 3000, baseReward: 28, difficulty: 2, clientTag: '改稿狂魔' },
  { name: '写相亲自我介绍', type: 'guess', aiBaseChance: 0.35, baseReward: 15, difficulty: 1, clientTag: '白嫖预警' },
  { name: '写旅行P图配文', type: 'typing', aiBaseSpeed: 2600, baseReward: 18, difficulty: 2, clientTag: '改稿狂魔' }
];

// ===== 文案竞速：填空题目 =====
const TYPING_SENTENCES = [
  {
    full: '各位领导同事，新的一年我们要继续___，共创___，实现___。',
    blanks: ['加油', '辉煌', '突破'],
    hints: ['常用结尾词', '美好未来', '目标动词']
  },
  {
    full: '这个项目我们要___痛点，___抓手，___闭环，___生态。',
    blanks: ['抓住', '打造', '形成', '构建'],
    hints: ['动词1', '动词2', '动词3', '动词4']
  },
  {
    full: '感谢老板给我机会，我会___努力，不___期望，___完成。',
    blanks: ['继续', '辜负', '超额'],
    hints: ['态度', '常用词', '超预期']
  },
  {
    full: '家人们谁___啊，方案改了八版客户还是___，最后一版___。',
    blanks: ['懂了', '不满意', '是第一版'],
    hints: ['网红梗', '现状', '结局']
  },
  {
    full: 'AI说要___化反，我看不如___下班，然后___回家。',
    blanks: ['生态', '准时', '早点'],
    hints: ['黑话', '人类愿望', '日常']
  },
  {
    full: '这个设计要___大气，同时要有___的感觉，不能太___。',
    blanks: ['高端', '高级', '浮夸'],
    hints: ['形容词1', '形容词2', '避雷']
  },
  {
    full: '我虽然是个___，但我比AI更___客户，更___改稿。',
    blanks: ['打工人', '懂', '能忍'],
    hints: ['身份', '优势1', '优势2']
  },
  {
    full: '老板说logo要___一点，同时要___一点，最终要___一点。',
    blanks: ['放大', '缩小', '居中'],
    hints: ['第一要求', '第二要求', '最终要求']
  }
];

// ===== 客户猜心：选择题 =====
const GUESS_QUESTIONS = [
  {
    client: '我要那种五彩斑斓的黑',
    options: [
      { text: '黑色背景加渐变高光', correct: false },
      { text: '客户其实自己也不知道要啥', correct: true },
      { text: '黑色加彩虹边框', correct: false },
      { text: '用深色纹理试试', correct: false }
    ]
  },
  {
    client: 'logo放大的同时缩小一点',
    options: [
      { text: '做两个一大一小', correct: false },
      { text: '用放大镜效果', correct: false },
      { text: '客户就是想要试试你', correct: true },
      { text: '渐变从大到小', correct: false }
    ]
  },
  {
    client: '感觉不对，你再调整一下',
    options: [
      { text: '问清楚哪里不对', correct: false },
      { text: '重新做一遍', correct: false },
      { text: '客户也说不出哪里不对', correct: true },
      { text: '换个配色', correct: false }
    ]
  },
  {
    client: '我想要高端大气上档次的感觉',
    options: [
      { text: '黑色背景金色字', correct: false },
      { text: '放世界名胜大图', correct: false },
      { text: '客户不知道什么是好', correct: true },
      { text: '全部用渐变色', correct: false }
    ]
  },
  {
    client: '字要大一点，但是整体要简洁',
    options: [
      { text: '标题大字内容小字', correct: false },
      { text: '客户想要呼吸感', correct: false },
      { text: '客户自相矛盾但你得做', correct: true },
      { text: '加粗加大', correct: false }
    ]
  },
  {
    client: '这个报价怎么比AI还贵？',
    options: [
      { text: '我比AI懂你', correct: false },
      { text: '那我给你打个折', correct: false },
      { text: '客户就是想砍价', correct: true },
      { text: '那我少做一点', correct: false }
    ]
  },
  {
    client: '你先做个方案我看看效果',
    options: [
      { text: '先收定金再做', correct: false },
      { text: '免费出方案看诚意', correct: false },
      { text: '客户想白嫖思路', correct: true },
      { text: '做个简单草稿', correct: false }
    ]
  },
  {
    client: '我觉得差点意思，你再品品',
    options: [
      { text: '问清楚差在哪', correct: false },
      { text: '重新换个风格', correct: false },
      { text: '客户就是想让你多改几遍', correct: true },
      { text: '微调一下细节', correct: false }
    ]
  }
];

const RANDOM_EVENTS = [
  { id: 'bai_piao', name: '遇到白嫖党', icon: '😭', desc: '干完活客户直接消失，血本无归！', effect: 'lose_all', type: 'bad' },
  { id: 'ai_crash', name: 'AI服务器崩了', icon: '🎉', desc: '3分钟内没有AI竞争，单价恢复正常！', effect: 'ai_pause', type: 'good' },
  { id: 'first_version', name: '还是第一版好', icon: '💔', desc: '白改了所有轮次，客户说还是第一版最好。', effect: 'half_reward', type: 'bad' },
  { id: 'satisfied', name: '甲方爸爸满意', icon: '💖', desc: '客户夸你比AI靠谱，额外打赏！', effect: 'bonus', type: 'good' },
  { id: '3am', name: '凌晨3点客户秒回', icon: '😴', desc: '你熬夜赶完方案，客户说明天再说。白熬夜，扣10体力。', effect: 'lose_energy', type: 'bad' },
  { id: 'ai_help', name: 'AI写错了', icon: '🎊', desc: 'AI抢填空写错了，你机会来了！', effect: 'ai_speed_down', type: 'good' }
];

const QUIZ_QUESTIONS = [
  {
    question: '你的工作内容，AI能替你完成多少？',
    options: ['20%', '50%', '80%', '100%，我已经是个AI了'],
    scores: [1, 2, 3, 4]
  },
  {
    question: '改稿最多一次改过几版？',
    options: ['没改过', '3版', '5版', '8版以上，客户还是不满意'],
    scores: [1, 2, 3, 4]
  },
  {
    question: '你的月薪，相当于多少Token的AI费用？',
    options: ['10万', '100万', '1000万', '我不如AI贵'],
    scores: [1, 2, 3, 4]
  },
  {
    question: '遇到"感觉不对"但不说哪里不对的客户，你会？',
    options: ['追问', '猜', '摆烂', '这已经是日常了'],
    scores: [1, 2, 3, 4]
  },
  {
    question: '跟AI抢单，你赢的概率大概是？',
    options: ['几乎赢不了', '偶尔能赢', '一半一半', '我经常赢AI'],
    scores: [1, 2, 3, 4]
  }
];

// ===== 工具函数 =====
function $(selector) { return document.querySelector(selector); }
function $$(selector) { return document.querySelectorAll(selector); }
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function shuffle(array) { return [...array].sort(() => Math.random() - 0.5); }

function showToast(msg, duration = 2000) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}

function playSound(type) {
  if (!GameState.settings.soundEnabled) return;
  // 使用 Web Audio API 生成简单音效
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    if (type === 'ding') {
      oscillator.frequency.value = 800;
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.3);
    } else if (type === 'sigh') {
      oscillator.frequency.value = 200;
      gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.8);
    } else if (type === 'success') {
      oscillator.frequency.value = 600;
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.5);
    } else if (type === 'race') {
      oscillator.frequency.value = 400;
      gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.2);
    }
  } catch (e) {}
}

// ===== 初始化用户 =====
function initUser() {
  const saved = localStorage.getItem('nenggongzhiren_user');
  if (saved) {
    GameState.user = JSON.parse(saved);
    return;
  }
  
  GameState.user = {
    id: 'NG' + Date.now().toString(36).toUpperCase(),
    nickname: '能工智人',
    rank: 0,
    窝囊费: 0,
    体力: 100,
    靠谱值: 50,
    技能: { speed: 0, intuition: 0, tolerance: 0, undercut: 0, luck: 0 },
    累计接单: 0,
    累计改稿: 0,
    累计赢AI: 0,
    最低单价: 999,
    图鉴: [],
    成就: [],
    皮肤: ['default'],
    当前皮肤: 'default',
    quizDone: false,
    aiDiscount: 0
  };
  saveUser();
}

function saveUser() {
  localStorage.setItem('nenggongzhiren_user', JSON.stringify(GameState.user));
}

function getRankName(rankId) {
  return RANKS[rankId] || RANKS[0];
}

function checkRankUp() {
  const user = GameState.user;
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (user.窝囊费 >= RANKS[i].threshold && user.rank < i) {
      user.rank = i;
      saveUser();
      showToast(`🎉 升级！你现在是「${RANKS[i].name}」了！`);
      return true;
    }
  }
  return false;
}

// ===== 生成订单 =====
function generateOrders() {
  const orders = [];
  const count = randomInt(5, 8);
  
  for (let i = 0; i < count; i++) {
    const template = ORDER_TEMPLATES[randomInt(0, ORDER_TEMPLATES.length - 1)];
    const discount = GameState.user.aiDiscount;
    const aiPrice = Math.max(Math.floor(template.baseReward * (1 - discount / 100)), 5);
    
    orders.push({
      id: 'ORD' + Date.now() + i,
      name: template.name,
      type: template.type,
      aiPrice: aiPrice,
      minPrice: Math.floor(aiPrice * 0.5),
      baseReward: template.baseReward,
      gameType: template.type,
      difficulty: template.difficulty,
      clientTag: template.clientTag,
      aiBaseSpeed: template.aiBaseSpeed,
      aiBaseChance: template.aiBaseChance,
      deadline: randomInt(1, 4) + '小时'
    });
  }
  
  GameState.orders = orders;
}

// ===== 渲染函数 =====
function renderApp() {
  const app = $('#app');
  app.innerHTML = '';
  
  switch (GameState.currentScreen) {
    case 'splash': renderSplash(app); break;
    case 'quiz': renderQuiz(app); break;
    case 'quizResult': renderQuizResult(app); break;
    case 'home': renderHome(app); break;
    case 'orders': renderOrders(app); break;
    case 'gameTyping': renderGameTyping(app); break;
    case 'gameGuess': renderGameGuess(app); break;
    case 'settlement': renderSettlement(app); break;
    case 'skills': renderSkills(app); break;
    case 'badge': renderBadge(app); break;
  }
}

// ===== Splash Screen =====
function renderSplash(container) {
  container.innerHTML = `
    <div class="splash-screen">
      <div class="logo">能工智人</div>
      <div class="subtitle">Nenggongzhiren</div>
      <div class="slogan">和AI竞速，偶有胜利，残存价值</div>
      <div class="tagline">
        一款让打工人笑着心酸的魔性小游戏<br>
        比AI快一点，比AI懂一点，赚点窝囊费
      </div>
      <button class="btn btn-primary btn-large start-btn" onclick="startGame()">
        🚀 开始抢单
      </button>
    </div>
  `;
}

function startGame() {
  if (!GameState.user.quizDone) {
    GameState.currentScreen = 'quiz';
    GameState.quizIndex = 0;
    GameState.quizScore = 0;
  } else {
    GameState.currentScreen = 'home';
  }
  renderApp();
}

// ===== Quiz Screen =====
function renderQuiz(container) {
  const q = QUIZ_QUESTIONS[GameState.quizIndex];
  
  container.innerHTML = `
    <div class="screen quiz-screen">
      <div class="screen-title">📝 能工智人等级测试</div>
      <div class="quiz-progress">
        ${QUIZ_QUESTIONS.map((_, i) => `
          <div class="quiz-dot ${i === GameState.quizIndex ? 'active' : i < GameState.quizIndex ? 'done' : ''}"></div>
        `).join('')}
      </div>
      <div class="quiz-question">${q.question}</div>
      <div class="quiz-options">
        ${q.options.map((opt, i) => `
          <button class="quiz-option" onclick="answerQuiz(${i})">${opt}</button>
        `).join('')}
      </div>
    </div>
  `;
}

function answerQuiz(optionIndex) {
  const q = QUIZ_QUESTIONS[GameState.quizIndex];
  GameState.quizScore += q.scores[optionIndex];
  GameState.quizIndex++;
  
  if (GameState.quizIndex >= QUIZ_QUESTIONS.length) {
    GameState.user.quizDone = true;
    saveUser();
    GameState.currentScreen = 'quizResult';
  }
  
  renderApp();
}

// ===== Quiz Result =====
function renderQuizResult(container) {
  const score = GameState.quizScore;
  let rank, badgeClass, desc;
  
  if (score <= 8) {
    rank = RANKS[0]; badgeClass = 'normal'; 
    desc = '刚入行，偶尔能赢AI一次。';
  } else if (score <= 12) {
    rank = RANKS[1]; badgeClass = 'bronze';
    desc = '已经能摸到AI尾灯了，继续努力。';
  } else if (score <= 15) {
    rank = RANKS[2]; badgeClass = 'silver';
    desc = '经验老道，三成概率能赢AI。';
  } else {
    rank = RANKS[3]; badgeClass = 'gold';
    desc = '传说中的能工智人，AI见了你都绕道走！';
  }
  
  container.innerHTML = `
    <div class="screen quiz-result">
      <div class="result-badge ${badgeClass}">${rank.icon}</div>
      <div class="result-title">${rank.name}</div>
      <div class="result-desc">${desc}</div>
      <div style="margin-bottom: 1.5rem; color: var(--muted); font-size: 0.85rem;">
        测试得分：${score}/${QUIZ_QUESTIONS.length * 4}
      </div>
      <button class="btn btn-primary btn-large" onclick="goHome()">
        🎮 进入游戏
      </button>
    </div>
  `;
}

function goHome() {
  GameState.currentScreen = 'home';
  renderApp();
}

// ===== Home Screen =====
function renderHome(container) {
  const user = GameState.user;
  const rank = getRankName(user.rank);
  
  container.innerHTML = `
    <div class="screen home-screen">
      ${renderStatusBar()}
      
      <div class="workspace fade-in">
        <div class="worker-avatar">${rank.icon}</div>
        <div class="worker-rank">${rank.name}</div>
        <div class="worker-id">No.${user.id}</div>
        <div class="worker-stats">
          <div class="worker-stat">
            <div class="value">${user.累计接单}</div>
            <div class="label">累计接单</div>
          </div>
          <div class="worker-stat">
            <div class="value">${user.累计赢AI}</div>
            <div class="label">赢过AI</div>
          </div>
          <div class="worker-stat">
            <div class="value">${user.最低单价 === 999 ? '-' : user.最低单价 + '元'}</div>
            <div class="label">最低单价</div>
          </div>
        </div>
      </div>
      
      <div class="home-actions">
        <button class="btn btn-primary btn-large btn-block" onclick="goOrders()">
          📋 去接单大厅
        </button>
        <button class="btn btn-secondary btn-large btn-block" onclick="showRandomEvent()">
          🎲 试试手气（随机事件）
        </button>
      </div>
      
      ${renderBottomNav('home')}
    </div>
  `;
}

function renderStatusBar() {
  const user = GameState.user;
  return `
    <div class="status-bar">
      <div class="stat">
        <span class="stat-icon">💰</span>
        <span class="stat-value">${user.窝囊费}</span>
      </div>
      <div class="stat">
        <span class="stat-icon">⚡</span>
        <span class="stat-value">${user.体力}/100</span>
      </div>
      <div class="stat">
        <span class="stat-icon">🎖️</span>
        <span class="stat-value">${user.靠谱值}</span>
      </div>
    </div>
  `;
}

function renderBottomNav(active) {
  return `
    <div class="bottom-nav">
      <button class="nav-item ${active === 'home' ? 'active' : ''}" onclick="goHome()">
        <span class="nav-icon">🏠</span>
        <span>工位</span>
      </button>
      <button class="nav-item ${active === 'orders' ? 'active' : ''}" onclick="goOrders()">
        <span class="nav-icon">📋</span>
        <span>接单</span>
      </button>
      <button class="nav-item ${active === 'skills' ? 'active' : ''}" onclick="goSkills()">
        <span class="nav-icon">⚡</span>
        <span>技能</span>
      </button>
      <button class="nav-item ${active === 'badge' ? 'active' : ''}" onclick="goBadge()">
        <span class="nav-icon">🎫</span>
        <span>工牌</span>
      </button>
    </div>
  `;
}

// ===== Orders Screen =====
function renderOrders(container) {
  if (GameState.orders.length === 0) generateOrders();
  
  container.innerHTML = `
    <div class="screen order-hall">
      ${renderStatusBar()}
      <div class="screen-title">📋 接单大厅</div>
      <div style="text-align: center; color: var(--muted); font-size: 0.8rem; margin-bottom: 1rem;">
        AI基准价已降低 ${GameState.user.aiDiscount}% — 内卷加剧中
      </div>
      <div class="order-list">
        ${GameState.orders.map(order => renderOrderCard(order)).join('')}
      </div>
      <button class="btn btn-secondary btn-block" style="margin-top: 1rem;" onclick="refreshOrders()">
        🔄 刷新订单
      </button>
      ${renderBottomNav('orders')}
    </div>
  `;
}

function renderOrderCard(order) {
  const typeIcons = { typing: '⌨️', guess: '🧠' };
  const typeNames = { typing: '填空竞速', guess: '客户猜心' };
  
  return `
    <div class="order-card" onclick="showGrabModal('${order.id}')">
      <div class="order-card-header">
        <div class="order-name">${order.name}</div>
        <span class="order-type-tag race">${typeIcons[order.type]} ${typeNames[order.type]}</span>
      </div>
      <div class="order-card-body">
        <div class="order-ai-price">AI报价: <span>${order.aiPrice}元</span></div>
        <div class="order-difficulty">
          ${Array(5).fill(0).map((_, i) => `
            <span class="star ${i < order.difficulty ? '' : 'empty'}">★</span>
          `).join('')}
        </div>
      </div>
      <div class="order-card-footer">
        <span class="order-deadline">⏰ ${order.deadline}</span>
        <span class="order-client-tag">${order.clientTag}</span>
      </div>
    </div>
  `;
}

function refreshOrders() {
  generateOrders();
  renderApp();
  showToast('订单已刷新');
}

function goOrders() {
  GameState.currentScreen = 'orders';
  renderApp();
}

// ===== Grab Order Modal =====
function showGrabModal(orderId) {
  const order = GameState.orders.find(o => o.id === orderId);
  if (!order) return;
  
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-title">💰 报价抢单</div>
      <div style="margin-bottom: 1rem; font-size: 0.9rem;">${order.name}</div>
      <div class="bid-section">
        <div class="bid-label">你的报价（必须 ≤ AI报价）</div>
        <div class="bid-input-wrapper">
          <input type="number" id="bidInput" value="${order.aiPrice}" max="${order.aiPrice}" min="${order.minPrice}">
          <span class="currency">元</span>
        </div>
        <div class="bid-hint">
          AI报价: <span class="ai-price">${order.aiPrice}元</span> | 
          最低: ${order.minPrice}元
        </div>
      </div>
      <div style="display: flex; gap: 0.75rem;">
        <button class="btn btn-secondary btn-block" onclick="closeModal()">取消</button>
        <button class="btn btn-primary btn-block" onclick="grabOrder('${order.id}')">抢单</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

function closeModal() {
  const modal = $('.modal-overlay');
  if (modal) modal.remove();
}

function grabOrder(orderId) {
  const order = GameState.orders.find(o => o.id === orderId);
  const bidInput = $('#bidInput');
  const bidPrice = parseInt(bidInput.value);
  
  if (bidPrice > order.aiPrice) {
    showToast('报价不能高于AI价格！');
    return;
  }
  if (bidPrice < order.minPrice) {
    showToast('报价不能低于最低保底价！');
    return;
  }
  
  const user = GameState.user;
  if (user.体力 < 10) {
    showToast('体力不足！休息一下吧');
    closeModal();
    return;
  }
  
  // 抢单成功率
  const priceRatio = bidPrice / order.aiPrice;
  const skillBonus = user.技能.undercut * 0.05;
  const successRate = 0.3 + (1 - priceRatio) * 0.5 + skillBonus;
  
  if (Math.random() > successRate) {
    showToast('抢单失败！有同行报更低的价格');
    closeModal();
    return;
  }
  
  user.体力 -= 10;
  if (bidPrice < user.最低单价) user.最低单价 = bidPrice;
  saveUser();
  
  GameState.activeOrder = { ...order, bidPrice };
  closeModal();
  
  playSound('ding');
  showToast('抢单成功！开始竞速');
  
  // 进入对应迷你游戏
  setTimeout(() => {
    if (order.gameType === 'typing') {
      GameState.currentScreen = 'gameTyping';
    } else {
      GameState.currentScreen = 'gameGuess';
    }
    renderApp();
  }, 500);
}

// ===== Minigame 1: 文案竞速 - 填空 vs AI =====
function renderGameTyping(container) {
  const order = GameState.activeOrder;
  const user = GameState.user;
  
  // 随机选一个句子
  const sentence = TYPING_SENTENCES[randomInt(0, TYPING_SENTENCES.length - 1)];
  
  // AI打字速度（基础速度 - 技能减速，越高级AI越慢）
  const aiSpeed = order.aiBaseSpeed - user.技能.speed * 80;
  
  GameState.typingState = {
    sentence: sentence,
    aiSpeed: Math.max(aiSpeed, 300), // 最少300ms一个字
    currentBlank: 0,
    humanScore: 0,
    aiScore: 0,
    timer: null,
    aiTimer: null,
    started: false
  };
  
  // 构建HTML，每个空位列出来
  const parts = sentence.full.split(/___/g);
  
  container.innerHTML = `
    <div class="screen game-typing">
      ${renderStatusBar()}
      <div class="screen-title">⌨️ 文案竞速</div>
      <div class="race-scoreboard">
        <div class="race-score human">
          <span class="label">你</span>
          <span class="value" id="humanScore">${GameState.typingState.humanScore}</span>
        </div>
        <div class="race-score ai">
          <span class="label">AI</span>
          <span class="value" id="aiScore">${GameState.typingState.aiScore}</span>
        </div>
      </div>
      
      <div class="typing-doc card">
        <div class="typing-sentence">
          ${buildTypingHTML(parts, sentence.blanks)}
        </div>
      </div>
      
      <div class="typing-blank-hint" id="blankHint">
        点击第一个空位开始抢答！${sentence.blanks.length > 1 ? ' 提示：' + sentence.hints[0] : ''}
      </div>
      
      <div style="text-align: center; margin-top: 1rem; color: var(--muted); font-size: 0.85rem;">
        谁先填完所有空谁赢！抢先点击正确空位得分。
      </div>
    </div>
  `;
  
  startTypingRace();
}

function buildTypingHTML(parts, blanks) {
  let html = '';
  parts.forEach((part, i) => {
    html += part;
    if (i < blanks.length) {
      html += `<span class="blank" data-index="${i}" onclick="clickBlank(${i})">___</span>`;
    }
  });
  return html;
}

function startTypingRace() {
  GameState.typingState.started = true;
  
  // AI自动打字
  GameState.typingState.aiTimer = setInterval(() => {
    const state = GameState.typingState;
    
    // AI随机抢答，有概率错
    if (state.currentBlank < state.sentence.blanks.length) {
      if (Math.random() < 0.8) { // 80%概率继续填
        aiFillBlank(state.currentBlank);
      }
    }
  }, GameState.typingState.aiSpeed);
}

function aiFillBlank(index) {
  const state = GameState.typingState;
  
  if (index !== state.currentBlank) return;
  
  playSound('race');
  
  // AI填进去了
  const blank = $(`[data-index="${index}"]`);
  if (!blank || blank.classList.contains('filled')) return;
  
  blank.textContent = state.sentence.blanks[index];
  blank.classList.add('filled', 'ai-filled');
  
  state.aiScore++;
  state.currentBlank++;
  updateRaceScore();
  
  if (state.aiScore >= state.sentence.blanks.length) {
    endTypingRace();
  } else {
    $('#blankHint').textContent = `提示：${state.sentence.hints[state.currentBlank]}`;
  }
}

function clickBlank(index) {
  const state = GameState.typingState;
  const blank = $(`[data-index="${index}"]`);
  
  if (!blank || blank.classList.contains('filled')) return;
  if (index !== state.currentBlank) {
    showToast('❌ 还没到这呢！');
    return;
  }
  
  playSound('ding');
  
  // 人类填上了
  blank.textContent = state.sentence.blanks[index];
  blank.classList.add('filled', 'human-filled');
  
  state.humanScore++;
  state.currentBlank++;
  updateRaceScore();
  
  if (state.humanScore >= state.sentence.blanks.length) {
    endTypingRace();
  } else {
    $('#blankHint').textContent = `提示：${state.sentence.hints[state.currentBlank]}`;
  }
}

function updateRaceScore() {
  $('#humanScore').textContent = GameState.typingState.humanScore;
  $('#aiScore').textContent = GameState.typingState.aiScore;
}

function endTypingRace() {
  const state = GameState.typingState;
  clearInterval(state.aiTimer);
  
  const humanWin = state.humanScore >= state.sentence.blanks.length && 
                  state.humanScore > state.aiScore;
  
  GameState.gameResult = {
    humanWin: humanWin,
    humanScore: state.humanScore,
    aiScore: state.aiScore,
    type: 'typing',
    totalBlanks: state.sentence.blanks.length
  };
  
  if (humanWin) {
    playSound('success');
    showToast(`🎉 你赢了！比AI快一步`);
  } else {
    showToast(`😔 AI赢了，还差一点`);
  }
  
  setTimeout(() => goSettlement(), 1500);
}

// ===== Minigame 2: 客户猜心 - 和AI抢答 =====
function renderGameGuess(container) {
  const order = GameState.activeOrder;
  const user = GameState.user;
  
  // 随机选题目，3题
  const questions = shuffle(GUESS_QUESTIONS).slice(0, 3);
  
  GameState.guessState = {
    questions: questions,
    current: 0,
    humanScore: 0,
    aiScore: 0,
    answering: false,
    aiBaseChance: order.aiBaseChance - (user.技能.intuition * 0.05) // AI猜对概率降低
  };
  
  renderGuessQuestion(container);
}

function renderGuessQuestion(container) {
  const state = GameState.guessState;
  const q = state.questions[state.current];
  
  container.innerHTML = `
    <div class="screen game-guess">
      ${renderStatusBar()}
      <div class="screen-title">🧠 客户猜心</div>
      
      <div class="race-scoreboard">
        <div class="race-score human">
          <span class="label">你</span>
          <span class="value" id="humanScore">${state.humanScore}</span>
        </div>
        <div class="race-score ai">
          <span class="label">AI</span>
          <span class="value" id="aiScore">${state.aiScore}</span>
        </div>
      </div>
      
      <div class="guess-question card">
        <div class="guess-client-msg">
          <div class="guess-client-avatar">👤</div>
          <div class="guess-client-bubble">${q.client}</div>
        </div>
        <div class="guess-options" id="guessOptions">
          ${q.options.map((opt, i) => `
            <button class="guess-option" onclick="answerGuess(${i})" data-index="${i}">${opt.text}</button>
          `).join('')}
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 1rem; color: var(--muted); font-size: 0.85rem;">
        猜对比分AI多就算赢！抢先答对得分。
      </div>
    </div>
  `;
  
  // AI也会抢答，有概率猜对
  setTimeout(() => {
    if (!GameState.guessState.answering && Math.random() < GameState.guessState.aiBaseChance) {
      // AI猜对了
      const correctIndex = q.options.findIndex(o => o.correct);
      aiAnswerGuess(correctIndex);
    } else {
      // AI猜错了，随机选一个错的
      const wrongIndices = q.options.map((o, i) => o.correct ? -1 : i).filter(i => i >= 0);
      const randomWrong = wrongIndices[randomInt(0, wrongIndices.length - 1)];
      aiAnswerGuess(randomWrong);
    }
  }, randomInt(500, 1500)); // AI延迟0.5-1.5秒抢答
}

function aiAnswerGuess(index) {
  if (GameState.guessState.answering) return;
  
  const state = GameState.guessState;
  const q = state.questions[state.current];
  const isCorrect = q.options[index].correct;
  
  playSound('race');
  GameState.guessState.answering = true;
  
  const button = $(`[data-index="${index}"]`);
  if (isCorrect) {
    button.classList.add('ai-correct');
    state.aiScore++;
    updateGuessScore();
    showToast('🤖 AI抢先答对了！');
  } else {
    button.classList.add('ai-wrong');
    showToast('🤖 AI答错了，你的机会！');
  }
  
  // 禁用所有按钮
  $$('.guess-option').forEach(btn => btn.disabled = true);
  
  setTimeout(() => {
    state.current++;
    state.answering = false;
    
    if (state.current >= state.questions.length) {
      endGuessRace();
    } else {
      renderGuessQuestion($('#app'));
    }
  }, 1500);
}

function answerGuess(index) {
  const state = GameState.guessState;
  const q = state.questions[state.current];
  const isCorrect = q.options[index].correct;
  
  playSound('ding');
  GameState.guessState.answering = true;
  
  const button = $(`[data-index="${index}"]`);
  
  if (isCorrect) {
    button.classList.add('human-correct');
    state.humanScore++;
    updateGuessScore();
    showToast('🎉 你答对了！比AI懂客户');
  } else {
    button.classList.add('human-wrong');
    // 显示正确答案
    const correctIndex = q.options.findIndex(o => o.correct);
    $(`[data-index="${correctIndex}"]`).classList.add('correct');
    showToast('❌ 答错了');
  }
  
  // 禁用所有按钮
  $$('.guess-option').forEach(btn => btn.disabled = true);
  
  setTimeout(() => {
    state.current++;
    state.answering = false;
    
    if (state.current >= state.questions.length) {
      endGuessRace();
    } else {
      renderGuessQuestion($('#app'));
    }
  }, 1500);
}

function updateGuessScore() {
  $('#humanScore').textContent = GameState.guessState.humanScore;
  $('#aiScore').textContent = GameState.guessState.aiScore;
}

function endGuessRace() {
  const state = GameState.guessState;
  const humanWin = state.humanScore > state.aiScore;
  
  GameState.gameResult = {
    humanWin: humanWin,
    humanScore: state.humanScore,
    aiScore: state.aiScore,
    type: 'guess',
    totalQuestions: state.questions.length
  };
  
  if (humanWin) {
    playSound('success');
    showToast(`🎉 你赢了！${state.humanScore}:${state.aiScore}，你比AI懂客户`);
  } else {
    showToast(`😔 AI赢了 ${state.aiScore}:${state.humanScore}`);
  }
  
  setTimeout(() => goSettlement(), 1500);
}

// ===== Settlement =====
function goSettlement() {
  GameState.currentScreen = 'settlement';
  renderApp();
}

function renderSettlement(container) {
  const order = GameState.activeOrder;
  const result = GameState.gameResult;
  const user = GameState.user;
  
  let baseReward = order.baseReward;
  let finalReward;
  
  if (result.humanWin) {
    // 赢了AI，全额拿
    finalReward = order.bidPrice;
    user.累计赢AI++;
    if (!user.成就.includes('win_streak') && user.累计赢AI >= 5) {
      user.成就.push('win_streak');
      setTimeout(() => showToast('🏆 解锁成就：连胜五场！'), 500);
    }
  } else {
    // 输了，扣钱
    const toleranceRate = 1 - (user.技能.tolerance * 0.1);
    finalReward = Math.max(1, Math.floor(order.bidPrice * 0.3 * toleranceRate));
    user.累计改稿++;
  }
  
  // 满意度和改稿次数
  let satisfaction = result.humanWin ? randomInt(60, 90) : randomInt(20, 50);
  let revisionCount = result.humanWin ? randomInt(0, 2) : randomInt(2, 4);
  
  // 共情技能现在叫人类直觉，不影响满意度了，保留加成逻辑
  const empathyBonus = 0; // 这里原来的共情技能改直觉了，简化逻辑
  
  // 计算改稿扣除（这里改稿是指客户改稿，不是竞速结果）
  let revisionDeduction = 0;
  for (let i = 0; i < revisionCount; i++) {
    revisionDeduction += Math.floor(baseReward * 0.05);
  }
  
  // 满意度加成
  let satisfactionBonus = 0;
  if (satisfaction > 80) satisfactionBonus = Math.floor(baseReward * 0.2);
  else if (satisfaction > 60) satisfactionBonus = Math.floor(baseReward * 0.1);
  
  // 随机事件：还是第一版好
  let firstVersionEvent = false;
  if (revisionCount >= 3 && Math.random() < 0.3) {
    firstVersionEvent = true;
    revisionDeduction = Math.floor(baseReward * 0.5);
    satisfactionBonus = 0;
    revisionCount = revisionCount;
    if (!user.成就.includes('eight_revisions')) {
      user.成就.push('eight_revisions');
      setTimeout(() => showToast('🏆 解锁成就：八稿战神！'), 500);
    }
  }
  
  const rewardAfterDeduction = finalReward - revisionDeduction + satisfactionBonus;
  finalReward = Math.max(1, rewardAfterDeduction);
  
  // 更新用户数据
  user.窝囊费 += finalReward;
  user.累计接单++;
  
  // 靠谱值变动
  if (satisfaction > 70) user.靠谱值 = Math.min(100, user.靠谱值 + 2);
  else if (satisfaction < 40) user.靠谱值 = Math.max(0, user.靠谱值 - 5);
  
  // AI降价
  if (user.累计接单 % 10 === 0) {
    user.aiDiscount = Math.min(80, user.aiDiscount + 10);
    showToast('⚠️ AI技术迭代，全平台降价10%！');
  }
  
  saveUser();
  checkRankUp();
  
  // 清空进行中的订单
  GameState.orders = GameState.orders.filter(o => o.id !== order.id);
  
  let title, emoji;
  if (result.humanWin) {
    title = '🎉 你赢了AI！';
    emoji = '🏆';
  } else {
    title = firstVersionEvent ? '💔 还是第一版好' : '😔 输给AI了';
    emoji = '🤷';
  }
  
  container.innerHTML = `
    <div class="screen settlement-screen">
      <div class="settlement-title">${title}</div>
      <div class="settlement-sigh">${emoji}</div>
      <div class="settlement-amount">+${finalReward}</div>
      <div class="settlement-label">窝囊费到账</div>
      
      <div class="settlement-details card">
        <div class="settlement-row">
          <span>订单报价</span>
          <span class="value positive">${order.bidPrice}元</span>
        </div>
        <div class="settlement-row">
          <span>竞速结果</span>
          <span class="value ${result.humanWin ? 'positive' : 'negative'}">
            ${result.humanWin ? '你赢了' : 'AI赢了'}
          </span>
        </div>
        ${revisionDeduction > 0 ? `
        <div class="settlement-row">
          <span>改稿扣除 (${revisionCount}版)</span>
          <span class="value negative">-${revisionDeduction}</span>
        </div>
        ` : ''}
        ${satisfactionBonus > 0 ? `
        <div class="settlement-row">
          <span>满意度加成</span>
          <span class="value positive">+${satisfactionBonus}</span>
        </div>
        ` : ''}
        <div class="settlement-row">
          <span>靠谱值变动</span>
          <span class="value ${satisfaction > 70 ? 'positive' : satisfaction < 40 ? 'negative' : ''}">
            ${satisfaction > 70 ? '+2' : satisfaction < 40 ? '-5' : '0'}
          </span>
        </div>
      </div>
      
      <div style="display: flex; gap: 0.75rem; margin-top: 1.5rem;">
        <button class="btn btn-secondary btn-block" onclick="shareResult()">📤 吐槽一下</button>
        <button class="btn btn-primary btn-block" onclick="goOrders()">📋 继续接单</button>
      </div>
    </div>
  `;
  
  playSound(result.humanWin ? 'success' : 'sigh');
}

function shareResult() {
  const user = GameState.user;
  const result = GameState.gameResult;
  let text;
  
  if (result.humanWin) {
    text = `我是第${user.id}号能工智人，今天又赢了AI一把！累计赢过${user.累计赢AI}次。能工智人，残存价值！`;
  } else {
    text = `我是第${user.id}号能工智人，今天又输给AI了。${user.累计赢AI}胜${user.累计接单 - user.累计赢AI}负，能工智人的命也是命啊！`;
  }
  
  if (navigator.share) {
    navigator.share({ title: '能工智人', text: text });
  } else {
    navigator.clipboard.writeText(text).then(() => {
      showToast('已复制到剪贴板，去分享吧！');
    });
  }
}

// ===== Skills Screen =====
function renderSkills(container) {
  const user = GameState.user;
  
  container.innerHTML = `
    <div class="screen skills-screen">
      ${renderStatusBar()}
      <div class="screen-title">⚡ 技能升级</div>
      <div class="skill-list">
        ${SKILLS.map(skill => renderSkillCard(skill, user)).join('')}
      </div>
      ${renderBottomNav('skills')}
    </div>
  `;
}

function renderSkillCard(skill, user) {
  const level = user.技能[skill.id] || 0;
  const canUpgrade = level < skill.maxLevel && user.窝囊费 >= skill.cost[level];
  
  return `
    <div class="skill-card">
      <div class="skill-icon">${skill.icon}</div>
      <div class="skill-info">
        <div class="skill-name">${skill.name}</div>
        <div class="skill-desc">${skill.desc} (Lv.${level}/${skill.maxLevel})</div>
        <div class="skill-level">
          ${Array(skill.maxLevel).fill(0).map((_, i) => `
            <div class="skill-level-dot ${i < level ? 'active' : ''}"></div>
          `).join('')}
        </div>
      </div>
      <button class="btn btn-primary skill-upgrade-btn" 
              ${!canUpgrade ? 'disabled style="opacity:0.5"' : ''}
              onclick="upgradeSkill('${skill.id}')">
        ${level >= skill.maxLevel ? '已满级' : `💰${skill.cost[level]}`}
      </button>
    </div>
  `;
}

function upgradeSkill(skillId) {
  const user = GameState.user;
  const skill = SKILLS.find(s => s.id === skillId);
  const level = user.技能[skillId] || 0;
  
  if (level >= skill.maxLevel) return;
  if (user.窝囊费 < skill.cost[level]) {
    showToast('窝囊费不足！多接几单再来');
    return;
  }
  
  user.窝囊费 -= skill.cost[level];
  user.技能[skillId] = level + 1;
  saveUser();
  
  playSound('success');
  showToast(`🎉 ${skill.name}升级到Lv.${level + 1}！`);
  renderApp();
}

function goSkills() {
  GameState.currentScreen = 'skills';
  renderApp();
}

// ===== Badge Screen =====
function renderBadge(container) {
  const user = GameState.user;
  const rank = getRankName(user.rank);
  
  container.innerHTML = `
    <div class="screen badge-screen">
      ${renderStatusBar()}
      <div class="screen-title">🎫 我的工牌</div>
      
      <div class="badge-card">
        <div class="badge-header">能工智人 · 官方认证</div>
        <div class="badge-avatar">${rank.icon}</div>
        <div class="badge-rank">${rank.name}</div>
        <div class="badge-id">No.${user.id}</div>
        <div class="badge-stats">
          <div class="badge-stat">
            <div class="value">${user.累计接单}</div>
            <div class="label">累计接单</div>
          </div>
          <div class="badge-stat">
            <div class="value">${user.累计赢AI}</div>
            <div class="label">赢过AI</div>
          </div>
          <div class="badge-stat">
            <div class="value">${user.最低单价 === 999 ? '-' : user.最低单价}</div>
            <div class="label">最低单价</div>
          </div>
        </div>
      </div>
      
      <button class="btn btn-primary btn-large btn-block" onclick="shareBadge()">
        📤 分享工牌
      </button>
      
      ${renderBottomNav('badge')}
    </div>
  `;
}

function shareBadge() {
  const user = GameState.user;
  const rank = getRankName(user.rank);
  const text = `认证成功，我是第${user.id}号${rank.name}，累计接单${user.累计接单}份，赢过AI${user.累计赢AI}次。偶有胜利，残存价值！`;
  
  if (navigator.share) {
    navigator.share({ title: '能工智人认证', text: text });
  } else {
    navigator.clipboard.writeText(text).then(() => {
      showToast('已复制到剪贴板，去分享吧！');
    });
  }
}

function goBadge() {
  GameState.currentScreen = 'badge';
  renderApp();
}

// ===== Random Events =====
function showRandomEvent() {
  const event = RANDOM_EVENTS[randomInt(0, RANDOM_EVENTS.length - 1)];
  const user = GameState.user;
  
  const popup = document.createElement('div');
  popup.className = 'event-popup';
  popup.innerHTML = `
    <div class="event-icon">${event.icon}</div>
    <div class="event-title">${event.name}</div>
    <div class="event-desc">${event.desc}</div>
    <button class="btn btn-primary btn-block" onclick="closeEventPopup()">我知道了</button>
  `;
  document.body.appendChild(popup);
  
  // 应用事件效果
  if (event.effect === 'lose_all') {
    user.靠谱值 = Math.max(0, user.靠谱值 - 10);
    if (!user.成就.includes('charity')) {
      user.成就.push('charity');
      setTimeout(() => showToast('🏆 解锁成就：慈善智人！'), 500);
    }
  } else if (event.effect === 'bonus') {
    user.窝囊费 += 50;
    user.靠谱值 = Math.min(100, user.靠谱值 + 5);
  } else if (event.effect === 'lose_energy') {
    user.体力 = Math.max(0, user.体力 - 10);
  } else if (event.effect === 'half_reward') {
    // 这个在结算里处理
  } else if (event.effect === 'ai_pause') {
    // AI降价暂时回滚5%
    user.aiDiscount = Math.max(0, user.aiDiscount - 5);
    showToast('🎉 AI降价暂停5%！');
  }
  
  saveUser();
}

function closeEventPopup() {
  const popup = $('.event-popup');
  if (popup) popup.remove();
}

// ===== 初始化 =====
function init() {
  initUser();
  renderApp();
}

// 启动游戏
document.addEventListener('DOMContentLoaded', init);
