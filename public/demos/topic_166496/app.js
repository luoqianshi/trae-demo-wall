/* ========================================================
   看见 · 专长发现助手 — Demo v2 (最小阻力设计)
   ======================================================== */

// ========== STATE ==========
const state = {
  childName: '小明',
  birthYear: 2019,
  birthMonth: 6,
  gender: 'boy',
  ageStage: '',
  currentPage: 'onboarding',
  sceneIndex: 0,
  records: [],
  selectedSceneTags: [],
  selectedMoodTags: [],
  currentUser: 'mom', // 当前操作者
};

// ========== FAMILY MEMBERS ==========
const FAMILY = {
  mom:     { name: '妈妈', emoji: '👩', cls: 'mom' },
  dad:     { name: '爸爸', emoji: '👨', cls: 'dad' },
  grandma: { name: '奶奶', emoji: '👵', cls: 'grandma' },
};

// ========== PRESET DATA (multi-family, 2 weeks) ==========
const PRESET_RECORDS = [
  { day: 1,  date: '7月1日',  author: 'mom',     text: '放学跟我讲数学题，说先试了一种方法不行，又换了一种做对了', dims: ['问题解决策略'], signalType: 'gift', scene: 'school', mood: 'happy' },
  { day: 2,  date: '7月2日',  author: 'mom',     text: '看到蚂蚁搬家，蹲在地上看了15分钟，还问蚂蚁怎么找到食物的', dims: ['好奇心与探索欲'], signalType: 'gift', scene: 'outdoor', mood: 'curious' },
  { day: 3,  date: '7月3日',  author: 'dad',     text: '和邻居小朋友一起玩过家家，主动分配角色：你当医生，我当病人', dims: ['社交协调'], signalType: 'gift', scene: 'social', mood: 'happy' },
  { day: 3,  date: '7月3日',  author: 'mom',     text: '画画时自己用三种颜色调出了"夕阳的颜色"，很得意地给我看', dims: ['创造力与审美'], signalType: 'gift', scene: 'home', mood: 'happy' },
  { day: 4,  date: '7月4日',  author: 'mom',     text: '拼图拼不上发脾气扔了几块，但冷静后又捡回来继续拼，最后拼完了', dims: ['坚持度与专注力'], signalType: 'gift', scene: 'home', mood: 'frustrated' },
  { day: 5,  date: '7月5日',  author: 'grandma', text: '在公园一直问"为什么天空是蓝色的"，我解释了以后又追问"那晚上为什么是黑的"', dims: ['好奇心与探索欲'], signalType: 'gift', scene: 'outdoor', mood: 'curious' },
  { day: 6,  date: '7月6日',  author: 'dad',     text: '在学校看到同学鞋带散了，主动蹲下来帮他系好', dims: ['社交协调'], signalType: 'gift', scene: 'school', mood: 'calm' },
  { day: 7,  date: '7月7日',  author: 'mom',     text: '用乐高搭了一个"太空基地"，然后绘声绘色地讲了10分钟太空人的故事', dims: ['创造力与审美', '语言表达'], signalType: 'gift', scene: 'home', mood: 'happy' },
  { day: 8,  date: '7月8日',  author: 'mom',     text: '钢琴练习弹了小星星变奏曲，很流畅，但感觉没什么特别的兴趣', dims: ['音乐感知'], signalType: 'talent', scene: 'home', mood: 'calm' },
  { day: 9,  date: '7月9日',  author: 'dad',     text: '自己发明了一个叫"超级英雄棋"的游戏，还写了规则说明', dims: ['问题解决策略', '创造力与审美'], signalType: 'gift', scene: 'home', mood: 'happy' },
  { day: 10, date: '7月10日', author: 'mom',     text: '作文被老师表扬了，题目是"我的奇妙冒险"，写了两页纸', dims: ['语言表达'], signalType: 'talent', scene: 'school', mood: 'happy' },
  { day: 11, date: '7月11日', author: 'dad',     text: '和爸爸下棋输了，想了想说"我应该先控制中间的格子"', dims: ['问题解决策略', '自我反思'], signalType: 'gift', scene: 'home', mood: 'frustrated' },
  { day: 12, date: '7月12日', author: 'grandma', text: '路边看到一只受伤的小鸟，很心疼，一定要带回家照顾它', dims: ['自然关怀与共情'], signalType: 'gift', scene: 'outdoor', mood: 'calm' },
  { day: 13, date: '7月13日', author: 'mom',     text: '连续搭了30分钟积木没有被打断，叫他吃饭都没听到', dims: ['坚持度与专注力'], signalType: 'gift', scene: 'home', mood: 'calm' },
  { day: 14, date: '7月14日', author: 'mom',     text: '给全家画了一幅画，每个人的表情都不一样，还画了家里的猫', dims: ['创造力与审美', '观察力'], signalType: 'gift', scene: 'home', mood: 'happy' },
];

// ========== DIMENSIONS ==========
const DIMENSIONS = [
  { id: 'problem_solving', name: '问题解决策略', icon: '🧩', short: '问题解决' },
  { id: 'curiosity',       name: '好奇心与探索欲', icon: '🔍', short: '好奇心' },
  { id: 'creativity',      name: '创造力与审美', icon: '🎨', short: '创造力' },
  { id: 'social',          name: '社交协调', icon: '🤝', short: '社交' },
  { id: 'persistence',     name: '坚持度与专注力', icon: '🎯', short: '专注力' },
  { id: 'empathy',         name: '自然关怀与共情', icon: '💚', short: '共情' },
  { id: 'language',        name: '语言表达', icon: '📝', short: '语言' },
  { id: 'self_reflection', name: '自我反思', icon: '🪞', short: '反思' },
  { id: 'observation',     name: '观察力', icon: '👁️', short: '观察力' },
  { id: 'music',           name: '音乐感知', icon: '🎵', short: '音乐' },
];

const DIM_MAP = {};
DIMENSIONS.forEach(d => { DIM_MAP[d.name] = d.id; });

// ========== SCENES POOL ==========
const SCENES_POOL = [
  { tag: '放学后', title: '放学路上聊学校的事', prompt: '孩子描述事情时，是按时间顺序讲，还是跳跃式地抓重点？会提到同学或老师吗？', dims: ['语言表达', '社交互动', '自我反思'] },
  { tag: '自由玩耍', title: '自由玩耍时选择了什么', prompt: '孩子是自己选的还是跟着别人？选了什么类型的活动？玩了多久？有没有创造出新的玩法？', dims: ['创造力与审美', '好奇心与探索欲', '坚持度与专注力'] },
  { tag: '遇到困难', title: '遇到困难或挫折时', prompt: '孩子第一反应是什么？是求助、放弃、还是反复尝试？情绪变化过程是怎样的？', dims: ['问题解决策略', '坚持度与专注力', '自我反思'] },
  { tag: '社交场合', title: '和小朋友一起玩的时候', prompt: '孩子是领导者、参与者还是观察者？发生冲突时怎么处理？有没有表现出对别人情绪的关注？', dims: ['社交协调', '自然关怀与共情', '语言表达'] },
  { tag: '吃饭时间', title: '全家一起吃饭的时候', prompt: '孩子会聊什么话题？对食物有什么偏好和反应？吃饭时的节奏和状态是怎样的？', dims: ['语言表达', '好奇心与探索欲', '社交协调'] },
  { tag: '户外探索', title: '在户外或公园里', prompt: '孩子最先被什么吸引？是植物、动物、建筑还是人？会蹲下来细看还是跑来跑去？', dims: ['好奇心与探索欲', '观察力', '自然关怀与共情'] },
  { tag: '睡前时光', title: '睡前的亲子时间', prompt: '孩子喜欢听故事还是讲故事？会问什么问题？回顾今天时印象最深的是什么？', dims: ['语言表达', '自我反思', '创造力与审美'] },
  { tag: '做作业', title: '做作业或完成任务时', prompt: '孩子先做什么后做什么？遇到难题怎么处理？专注力能持续多久？做完后的反应是什么？', dims: ['问题解决策略', '坚持度与专注力', '自我反思'] },
];

// ========== AI ANALYSIS PRESETS ==========
const ANALYSIS_PRESETS = {
  '问题解决策略': { confidence: 85, tip: '孩子展示了遇到困难时主动尝试不同策略的能力。建议：下次可以问他"你是怎么想到第二种方法的？"——帮助他强化这种元认知习惯。', evidence: (count) => `该维度已有 ${count} 条记录。${count >= 3 ? '已形成稳定信号，显示孩子在面对问题时倾向于主动探索多种解决方案。' : `再观察 ${3 - count} 次即可形成稳定信号判断。`}` },
  '好奇心与探索欲': { confidence: 80, tip: '孩子对周围世界表现出强烈的好奇心，不仅观察，还会追问"为什么"。建议：可以一起查阅资料找答案，保护这种主动探索的内驱力。', evidence: (count) => `该维度已有 ${count} 条记录。${count >= 3 ? '已形成稳定信号，好奇心表现为"观察+追问"的双重模式。' : `再观察 ${3 - count} 次即可形成稳定信号判断。`}` },
  '创造力与审美': { confidence: 82, tip: '孩子在色彩、故事和发明方面展示了自发的创造倾向。建议：提供更多开放式材料（如积木、画笔、废旧物品），让创造力有自由发挥的空间。', evidence: (count) => `该维度已有 ${count} 条记录。${count >= 3 ? '已形成稳定信号，创造力表现在多个场景中。' : `再观察 ${3 - count} 次即可形成稳定信号判断。`}` },
  '社交协调': { confidence: 70, tip: '孩子在社交中展示了主动性和协调能力。建议：观察他在不同群体（熟人vs陌生人）中的表现是否一致。', evidence: (count) => `该维度已有 ${count} 条记录。${count >= 3 ? '已形成稳定信号。' : `再观察 ${3 - count} 次即可形成稳定信号判断。`}` },
  '坚持度与专注力': { confidence: 78, tip: '孩子能在感兴趣的活动中保持较长时间的专注。建议：注意区分"对喜欢的事专注"和"对所有事都专注"——前者是兴趣信号，后者可能指向更强的自我调节能力。', evidence: (count) => `该维度已有 ${count} 条记录。${count >= 3 ? '已形成稳定信号。' : `再观察 ${3 - count} 次即可形成稳定信号判断。`}` },
  '自然关怀与共情': { confidence: 72, tip: '孩子对生命表现出自然的关怀和共情。建议：可以一起养一盆植物或照顾小动物，观察这种关怀是否持续且深入。', evidence: (count) => `该维度已有 ${count} 条记录。${count >= 3 ? '已形成稳定信号。' : `再观察 ${3 - count} 次即可形成稳定信号判断。`}` },
  '语言表达': { confidence: 68, tip: '孩子在语言方面有一定的表达意愿和能力。建议：观察他是"想说就说"还是"被问才说"——前者是更强的自发信号。', evidence: (count) => `该维度已有 ${count} 条记录。${count >= 3 ? '已形成稳定信号。' : `再观察 ${3 - count} 次即可形成稳定信号判断。`}` },
  '自我反思': { confidence: 75, tip: '孩子展示了对自己行为的反思能力，这是"元认知"的早期表现。建议：多用"你觉得你刚才做得怎么样？"来强化这种能力。', evidence: (count) => `该维度已有 ${count} 条记录。${count >= 3 ? '已形成稳定信号。' : `再观察 ${3 - count} 次即可形成稳定信号判断。`}` },
  '观察力': { confidence: 65, tip: '孩子注意到了细节。建议：可以一起玩"找不同"或"我发现了什么"的游戏，进一步了解他的观察偏好。', evidence: (count) => `该维度已有 ${count} 条记录。${count >= 3 ? '已形成稳定信号。' : `再观察 ${3 - count} 次即可形成稳定信号判断。`}` },
  '音乐感知': { confidence: 55, tip: '孩子在音乐方面表现正常，但目前观察到的更多是训练成果而非自发倾向。建议：观察他在没有要求时是否会自发哼歌或打拍子。', evidence: (count) => `该维度已有 ${count} 条记录，且主要为训练成果（talent）信号。需要更多自发行为的观察来判断是否为内在倾向。` },
};

// ========================================================
// PAGE NAVIGATION
// ========================================================
function navigateTo(pageId) {
  const currentEl = document.querySelector('.page.active');
  const targetEl = document.getElementById('page-' + pageId);
  if (!targetEl || currentEl === targetEl) return;

  if (currentEl) {
    currentEl.classList.remove('active');
    currentEl.classList.add('exit-left');
    setTimeout(() => currentEl.classList.remove('exit-left'), 400);
  }
  targetEl.classList.add('active');
  state.currentPage = pageId;

  // Show/hide bottom nav
  const showNav = ['home', 'record', 'discover'].includes(pageId);
  document.getElementById('bottomNav').style.display = showNav ? 'flex' : 'none';

  // Update nav active state
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.page === pageId);
  });

  // Page-specific init
  if (pageId === 'home') initHomePage();
  if (pageId === 'discover') initDiscoverPage();
  if (pageId === 'record') initRecordPage();

  targetEl.scrollTop = 0;
}

// ========================================================
// ONBOARDING
// ========================================================
function initOnboarding() {
  const steps = document.querySelectorAll('.step-item');
  const connectors = document.querySelectorAll('.step-connector');
  steps.forEach((step) => {
    const delay = parseInt(step.dataset.delay) || 0;
    setTimeout(() => step.classList.add('visible'), 600 + delay);
  });
  connectors.forEach((conn) => {
    const delay = parseInt(conn.dataset.delay) || 0;
    setTimeout(() => conn.classList.add('visible'), 600 + delay);
  });
}

// ========================================================
// PROFILE
// ========================================================
function initProfilePage() {
  const yearSelect = document.getElementById('birthYear');
  const monthSelect = document.getElementById('birthMonth');
  const currentYear = new Date().getFullYear();
  if (yearSelect.options.length <= 1) {
    for (let y = currentYear; y >= currentYear - 18; y--) {
      const opt = document.createElement('option');
      opt.value = y;
      opt.textContent = y + '年';
      yearSelect.appendChild(opt);
    }
    for (let m = 1; m <= 12; m++) {
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = m + '月';
      monthSelect.appendChild(opt);
    }
  }
  yearSelect.addEventListener('change', checkProfileValid);
  monthSelect.addEventListener('change', checkProfileValid);
  document.getElementById('childName').addEventListener('input', checkProfileValid);
}

function selectGender(btn) {
  document.querySelectorAll('.gender-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  state.gender = btn.dataset.gender;
  checkProfileValid();
}

function checkProfileValid() {
  const name = document.getElementById('childName').value.trim();
  const year = document.getElementById('birthYear').value;
  const month = document.getElementById('birthMonth').value;
  document.getElementById('profileSubmit').disabled = !(name.length > 0 && year && month);
}

function submitProfile() {
  const name = document.getElementById('childName').value.trim();
  const year = parseInt(document.getElementById('birthYear').value);
  const month = parseInt(document.getElementById('birthMonth').value);
  state.childName = name;
  state.birthYear = year;
  state.birthMonth = month;
  const age = calculateAge(year, month);
  const stage = getAgeStage(age);
  state.ageStage = stage;

  const badge = document.getElementById('ageBadge');
  badge.style.display = 'inline-flex';
  badge.querySelector('.age-stage').textContent = stage.name;
  badge.querySelector('.age-framework').textContent = '· ' + stage.framework;

  const msg = document.getElementById('welcomeMsg');
  msg.style.display = 'block';
  msg.textContent = `欢迎来到${name}的成长世界 🌱`;

  // Load preset records
  state.records = [...PRESET_RECORDS];
  setTimeout(() => navigateTo('home'), 1200);
}

function calculateAge(year, month) {
  const now = new Date();
  let age = now.getFullYear() - year;
  if (now.getMonth() + 1 < month) age--;
  return age;
}

function getAgeStage(age) {
  if (age <= 2) return { name: '婴幼儿阶段', framework: '九维气质观察期' };
  if (age <= 4) return { name: '学龄前阶段', framework: '气质 + DMGT 能力域' };
  if (age <= 6) return { name: '幼小衔接阶段', framework: 'DMGT + 兴趣萌芽' };
  if (age <= 12) return { name: '学龄期', framework: 'DMGT + VIA 性格优势' };
  return { name: '青春期', framework: 'VIA + Big Five' };
}

// ========================================================
// HOME — 今日灵感
// ========================================================
function initHomePage() {
  // Greeting
  document.getElementById('greetingText').textContent = `${state.childName}的成长日记`;

  // Family presence avatars
  renderFamilyPresence();

  // Scene card
  updateSceneCard();

  // Weekly signal bars
  renderSignalBars();

  // Recent records (with family attribution)
  renderRecentRecords();
}

// ---- Family Presence ----
function renderFamilyPresence() {
  const container = document.getElementById('familyPresence');
  const authorCounts = {};
  state.records.forEach(r => {
    authorCounts[r.author] = (authorCounts[r.author] || 0) + 1;
  });
  const members = Object.keys(authorCounts);
  let html = '';
  members.forEach(m => {
    const fam = FAMILY[m];
    if (fam) {
      html += `<div class="family-avatar ${fam.cls}" title="${fam.name}: ${authorCounts[m]}条">${fam.emoji}</div>`;
    }
  });
  html += `<span style="font-size:11px;color:var(--text-hint);margin-left:4px">${members.length}位家人在记录</span>`;
  container.innerHTML = html;
}

// ---- Scene Card ----
function updateSceneCard() {
  const scene = SCENES_POOL[state.sceneIndex];
  document.getElementById('sceneTag').textContent = scene.tag;
  document.getElementById('sceneTitle').textContent = scene.title;
  document.getElementById('scenePrompt').textContent = scene.prompt;
}

function shuffleScene() {
  const card = document.getElementById('sceneCard');
  card.classList.add('flipping');
  setTimeout(() => {
    state.sceneIndex = (state.sceneIndex + 1) % SCENES_POOL.length;
    updateSceneCard();
    card.classList.remove('flipping');
  }, 250);
}

// ---- Weekly Signal Bars ----
function renderSignalBars() {
  const container = document.getElementById('signalBars');
  const dimScores = calculateDimScores();
  const sorted = Object.values(dimScores)
    .filter(s => s.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const maxCount = sorted.length > 0 ? sorted[0].total : 1;

  container.innerHTML = sorted.map(s => {
    const dim = DIMENSIONS.find(d => d.id === s.id);
    const pct = Math.round((s.total / maxCount) * 100);
    const hasTalent = s.talent > 0 && s.gift === 0;
    return `
      <div class="signal-bar-item">
        <span class="signal-bar-icon">${dim ? dim.icon : '📍'}</span>
        <span class="signal-bar-name">${dim ? dim.short : s.name}</span>
        <div class="signal-bar-track">
          <div class="signal-bar-fill ${hasTalent ? 'talent' : ''}" style="width:0%" data-target="${pct}"></div>
        </div>
        <span class="signal-bar-count">${s.total}条</span>
      </div>
    `;
  }).join('');

  // Animate bars
  setTimeout(() => {
    container.querySelectorAll('.signal-bar-fill').forEach(bar => {
      bar.style.width = bar.dataset.target + '%';
    });
  }, 100);
}

// ---- Recent Records (with family attribution) ----
function renderRecentRecords() {
  const container = document.getElementById('recentList');
  const recent = state.records.slice(-5).reverse();

  container.innerHTML = recent.map(r => {
    const fam = FAMILY[r.author] || { emoji: '👤', cls: '', name: r.author };
    return `
      <div class="recent-item">
        <div class="recent-avatar ${fam.cls}">${fam.emoji}</div>
        <div class="recent-body">
          <div class="recent-meta">
            <span class="recent-author">${fam.name}</span>
            <span class="recent-date">${r.date}</span>
          </div>
          <div class="recent-text">${r.text}</div>
        </div>
        <span class="recent-signal ${r.signalType}">${r.signalType === 'gift' ? '🌱 自发' : '🏆 训练'}</span>
      </div>
    `;
  }).join('');
}

// ========================================================
// RECORD — 一键录入
// ========================================================
function initRecordPage() {
  document.getElementById('voiceResult').style.display = 'none';
  document.getElementById('voiceBtn').classList.remove('recording');
  document.getElementById('voiceWave').style.display = 'none';
  document.getElementById('voiceHint').textContent = '按住说话';
  document.getElementById('textPanel').style.display = 'none';
  document.getElementById('photoPanel').style.display = 'none';
  if (document.getElementById('photoPreview')) document.getElementById('photoPreview').style.display = 'none';
  if (document.getElementById('photoPlaceholder')) document.getElementById('photoPlaceholder').style.display = 'flex';
  state.selectedSceneTags = [];
  state.selectedMoodTags = [];
  document.querySelectorAll('.context-tag').forEach(t => t.classList.remove('selected'));
}

function switchToText() {
  document.getElementById('textPanel').style.display = 'block';
  document.getElementById('photoPanel').style.display = 'none';
  document.getElementById('textInput').focus();
}

function switchToPhoto() {
  document.getElementById('photoPanel').style.display = 'block';
  document.getElementById('textPanel').style.display = 'none';
}

function simulateVoiceRecord() {
  const btn = document.getElementById('voiceBtn');
  const result = document.getElementById('voiceResult');
  const textarea = document.getElementById('voiceText');
  const wave = document.getElementById('voiceWave');
  const hint = document.getElementById('voiceHint');

  if (btn.classList.contains('recording')) return;
  btn.classList.add('recording');
  wave.style.display = 'flex';
  hint.textContent = '正在聆听...';

  const sampleTexts = [
    '小明今天在公园看到一群蚂蚁搬家，蹲在地上看了好久，还问我蚂蚁是怎么找到食物的，为什么它们不会迷路',
    '吃完饭后小明自己发明了一个棋盘游戏，用积木当棋子，还认真地写了规则说明给我看',
    '今天和邻居小朋友一起玩，小明主动说"你当医生我当病人吧"，还安排了看病的流程',
  ];
  const sampleText = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];

  setTimeout(() => {
    btn.classList.remove('recording');
    wave.style.display = 'none';
    hint.textContent = '已转写，可以编辑';
    result.style.display = 'block';
    typewriterEffect(textarea, sampleText, 25);
  }, 1800);
}

function typewriterEffect(element, text, speed) {
  element.value = '';
  let i = 0;
  function type() {
    if (i < text.length) {
      element.value += text.charAt(i);
      i++;
      setTimeout(type, speed);
    }
  }
  type();
}

function simulatePhoto() {
  document.getElementById('photoPlaceholder').style.display = 'none';
  document.getElementById('photoPreview').style.display = 'block';
}

function toggleTag(tag) {
  tag.classList.toggle('selected');
  const group = tag.closest('.tag-group');
  if (group.id === 'sceneTags') {
    if (tag.classList.contains('selected')) state.selectedSceneTags.push(tag.dataset.value);
    else state.selectedSceneTags = state.selectedSceneTags.filter(v => v !== tag.dataset.value);
  } else {
    if (tag.classList.contains('selected')) state.selectedMoodTags.push(tag.dataset.value);
    else state.selectedMoodTags = state.selectedMoodTags.filter(v => v !== tag.dataset.value);
  }
}

function submitRecord() {
  let text = '';
  const voiceText = document.getElementById('voiceText');
  const textInput = document.getElementById('textInput');
  const photoCaption = document.getElementById('photoCaption');

  if (document.getElementById('voiceResult').style.display !== 'none' && voiceText.value.trim()) {
    text = voiceText.value.trim();
  } else if (document.getElementById('textPanel').style.display !== 'none' && textInput.value.trim()) {
    text = textInput.value.trim();
  } else if (document.getElementById('photoPanel').style.display !== 'none' && photoCaption.value.trim()) {
    text = photoCaption.value.trim();
  }

  if (!text) {
    text = '小明今天在小区里和几个小朋友一起搭了一个"城堡"，他负责设计大门的样子，搭了很久都没放弃';
  }

  navigateTo('feedback');
  showFeedback(text);
}

// ========================================================
// AI FEEDBACK
// ========================================================
function showFeedback(recordText) {
  const loading = document.getElementById('aiLoading');
  const content = document.getElementById('feedbackContent');
  loading.style.display = 'flex';
  content.style.display = 'none';

  setTimeout(() => {
    loading.style.display = 'none';
    content.style.display = 'block';
    renderFeedbackContent(recordText);
  }, 2000);
}

function renderFeedbackContent(text) {
  // Show original record
  document.getElementById('recordQuote').textContent = `"${text}"`;

  // Detect dims
  const detectedDims = analyzeRecordText(text);

  // Render analysis cards
  const cardsContainer = document.getElementById('analysisCards');
  cardsContainer.innerHTML = detectedDims.map(dim => {
    const preset = ANALYSIS_PRESETS[dim.name] || ANALYSIS_PRESETS['问题解决策略'];
    return `
      <div class="analysis-card stagger-item">
        <div class="analysis-dim-name">${dim.icon} ${dim.name}</div>
        <div class="confidence-bar">
          <div class="confidence-fill ${dim.signalType}" style="width: 0%" data-target="${preset.confidence}"></div>
        </div>
        <span class="signal-type-label ${dim.signalType}">
          ${dim.signalType === 'gift' ? '🌱 自发倾向' : '🏆 训练成果'}
          · 置信度 ${preset.confidence}%
        </span>
      </div>
    `;
  }).join('');

  // Animate confidence bars
  setTimeout(() => {
    document.querySelectorAll('.confidence-fill').forEach(bar => {
      bar.style.width = bar.dataset.target + '%';
    });
  }, 100);

  // Quick insight
  const primaryDim = detectedDims[0];
  const dimScore = countRecordsForDim(primaryDim.id);
  const insight = buildQuickInsight(primaryDim, dimScore, text);
  document.getElementById('quickInsight').innerHTML = insight;

  // Tip card
  const primaryPreset = ANALYSIS_PRESETS[primaryDim.name] || ANALYSIS_PRESETS['问题解决策略'];
  document.getElementById('tipCard').textContent = primaryPreset.tip;

  // Evidence card
  const primaryCount = countRecordsForDim(primaryDim.id);
  document.getElementById('evidenceCard').textContent = primaryPreset.evidence(primaryCount);

  // Strength Switch (conditional)
  const hasNegative = text.includes('发脾气') || text.includes('哭') || text.includes('挫折') || text.includes('输');
  const ssSection = document.getElementById('strengthSwitchSection');
  if (hasNegative) {
    ssSection.style.display = 'block';
    document.getElementById('strengthSwitchCard').innerHTML =
      '注意到你记录了孩子遇到挫折的时刻，这很宝贵！<br><br>' +
      '💡 <strong>优势开关练习</strong>：回顾一下——最近一周里，' +
      `${state.childName}有没有什么让你感到惊喜或自豪的瞬间？试着也记录下来，平衡我们对孩子的观察视角。`;
  } else {
    ssSection.style.display = 'none';
  }

  // Add record to state
  state.records.push({
    day: state.records.length + 1,
    date: '今天',
    author: state.currentUser,
    text: text,
    dims: detectedDims.map(d => d.name),
    signalType: detectedDims[0].signalType,
    scene: state.selectedSceneTags[0] || 'home',
    mood: state.selectedMoodTags[0] || 'calm',
  });

  // Stagger animation
  const items = document.querySelectorAll('#analysisCards .stagger-item');
  items.forEach((item, i) => {
    setTimeout(() => item.classList.add('visible'), 200 + i * 150);
  });
}

// Build quick insight (one-line, engaging)
function buildQuickInsight(dim, count, text) {
  const dimName = dim.name;
  if (count >= 3) {
    return `📍 <strong>${dimName}信号又+1</strong>，已有 ${count} 条记录了，这个信号越来越清晰！`;
  } else if (count === 2) {
    return `📍 ${dimName}信号+1，已经有 ${count} 条了。再观察一次就能形成稳定判断 🌱`;
  } else {
    return `📍 首次捕捉到<strong>${dimName}</strong>信号。继续观察，看看这个倾向是否稳定出现。`;
  }
}

// ========================================================
// TEXT ANALYSIS (keyword-based for demo)
// ========================================================
function analyzeRecordText(text) {
  const detected = [];
  const keywords = {
    '问题解决策略': ['方法', '试', '策略', '怎么办', '发明', '规则', '解决', '想办法', '换了'],
    '好奇心与探索欲': ['为什么', '问', '看', '观察', '蚂蚁', '发现', '探索', '好奇', '什么'],
    '创造力与审美': ['画', '颜色', '故事', '发明', '搭', '创造', '设计', '想象', '编'],
    '社交协调': ['一起', '小朋友', '分配', '帮', '合作', '玩', '同学', '朋友'],
    '坚持度与专注力': ['继续', '没放弃', '坚持', '好久', '很久', '一直', '专注', '没被打断', '30分钟'],
    '自然关怀与共情': ['心疼', '照顾', '小鸟', '动物', '植物', '关心', '帮'],
    '语言表达': ['讲', '说', '描述', '聊', '作文', '写', '告诉'],
    '自我反思': ['应该', '想了', '觉得', '反思', '分析'],
    '观察力': ['注意', '发现', '看到', '细节', '表情', '不同'],
    '音乐感知': ['唱歌', '音乐', '钢琴', '节奏', '哼'],
  };

  for (const [dimName, kws] of Object.entries(keywords)) {
    if (kws.some(kw => text.includes(kw))) {
      const dimObj = DIMENSIONS.find(d => d.name === dimName);
      if (dimObj) {
        let signalType = 'gift';
        if (text.includes('练习') || text.includes('训练') || text.includes('学了')) {
          signalType = 'talent';
        }
        detected.push({ ...dimObj, signalType });
      }
    }
  }
  if (detected.length === 0) detected.push({ ...DIMENSIONS[0], signalType: 'gift' });
  return detected.slice(0, 3);
}

function countRecordsForDim(dimId) {
  const dimName = DIMENSIONS.find(d => d.id === dimId)?.name;
  if (!dimName) return 0;
  return state.records.filter(r => r.dims.includes(dimName)).length;
}

// ========================================================
// DISCOVER — 发现
// ========================================================
function initDiscoverPage() {
  document.getElementById('discoverChildName').textContent = state.childName;
  const dimScores = calculateDimScores();

  drawRadarChart(dimScores);
  renderFamilyContribution();
  renderStableSignals(dimScores);
  renderPendingSignals(dimScores);
  renderGoodnessOfFit(dimScores);
}

// ---- Dimension Scores ----
function calculateDimScores() {
  const scores = {};
  DIMENSIONS.forEach(dim => {
    const records = state.records.filter(r => r.dims.includes(dim.name));
    const giftRecords = records.filter(r => r.signalType === 'gift');
    const talentRecords = records.filter(r => r.signalType === 'talent');

    // Track which family members contributed
    const authors = new Set(records.map(r => r.author));

    scores[dim.id] = {
      id: dim.id,
      name: dim.name,
      icon: dim.icon,
      total: records.length,
      gift: giftRecords.length,
      talent: talentRecords.length,
      authors: [...authors],
      isStable: records.length >= 3,
      isPending: records.length === 2,
      isTriangulated: authors.size >= 2 && records.length >= 3,
      trend: records.length >= 3 ? (Math.random() > 0.4 ? 'up' : 'stable') : 'none',
    };
  });
  return scores;
}

// ---- Family Contribution ----
function renderFamilyContribution() {
  const container = document.getElementById('familyContrib');
  const authorCounts = {};
  state.records.forEach(r => {
    authorCounts[r.author] = (authorCounts[r.author] || 0) + 1;
  });

  let html = '';
  for (const [key, fam] of Object.entries(FAMILY)) {
    const count = authorCounts[key] || 0;
    html += `
      <div class="family-contrib-item">
        <div class="family-contrib-emoji">${fam.emoji}</div>
        <div class="family-contrib-name">${fam.name}</div>
        <div class="family-contrib-count">${count}</div>
        <div class="family-contrib-unit">条记录</div>
      </div>
    `;
  }
  container.innerHTML = html;
}

// ---- Radar Chart ----
function drawRadarChart(dimScores) {
  const canvas = document.getElementById('radarCanvas');
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  canvas.width = 300 * dpr;
  canvas.height = 300 * dpr;
  canvas.style.width = '300px';
  canvas.style.height = '300px';
  ctx.scale(dpr, dpr);

  const cx = 150, cy = 150, maxR = 110;
  const dims = DIMENSIONS.slice(0, 6);
  const n = dims.length;
  const angleStep = (Math.PI * 2) / n;

  ctx.clearRect(0, 0, 300, 300);

  // Grid
  for (let i = 1; i <= 4; i++) {
    const r = (maxR / 4) * i;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = i === 4 ? '#DDD8D0' : '#EDE8E1';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Axes
  for (let i = 0; i < n; i++) {
    const angle = angleStep * i - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angle) * maxR, cy + Math.sin(angle) * maxR);
    ctx.strokeStyle = '#EDE8E1';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  const maxVal = Math.max(...dims.map(d => dimScores[d.id].total), 1);
  const giftValues = dims.map(d => Math.min(dimScores[d.id].gift / maxVal, 1) * 0.9 + 0.1);
  const talentValues = dims.map(d => {
    const s = dimScores[d.id];
    return s.talent > 0 ? Math.min(s.talent / maxVal, 1) * 0.9 + 0.1 : 0;
  });

  drawPolygon(ctx, cx, cy, maxR, giftValues, n, angleStep, '#7BA68E', 'rgba(123,166,142,0.15)', 2);
  if (talentValues.some(v => v > 0)) {
    drawPolygon(ctx, cx, cy, maxR, talentValues, n, angleStep, '#E8836B', 'rgba(232,131,107,0.08)', 1.5, true);
  }

  // Points and labels
  for (let i = 0; i < n; i++) {
    const angle = angleStep * i - Math.PI / 2;
    const gr = maxR * giftValues[i];
    ctx.beginPath();
    ctx.arc(cx + Math.cos(angle) * gr, cy + Math.sin(angle) * gr, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#7BA68E';
    ctx.fill();

    const lx = cx + Math.cos(angle) * (maxR + 20);
    const ly = cy + Math.sin(angle) * (maxR + 20);
    ctx.fillStyle = '#636E72';
    ctx.font = '11px "Noto Sans SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const shortLabel = dims[i].name.length > 4 ? dims[i].name.substring(0, 4) : dims[i].name;
    ctx.fillText(shortLabel, lx, ly);
  }
}

function drawPolygon(ctx, cx, cy, maxR, values, n, angleStep, strokeColor, fillColor, lineWidth, dashed) {
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const angle = angleStep * i - Math.PI / 2;
    const r = maxR * values[i];
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = fillColor;
  ctx.fill();
  if (dashed) ctx.setLineDash([5, 3]);
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
  if (dashed) ctx.setLineDash([]);
}

// ---- Stable Signals (with triangulation) ----
function renderStableSignals(dimScores) {
  const container = document.getElementById('stableSignals');
  const stable = Object.values(dimScores).filter(s => s.isStable);

  if (stable.length === 0) {
    container.innerHTML = '<p style="color:var(--text-hint);font-size:13px;padding:12px;">继续记录，稳定信号将在≥3条记录后出现</p>';
    return;
  }

  container.innerHTML = stable.map(s => {
    // Triangulation info
    const authorIcons = s.authors.map(a => FAMILY[a] ? FAMILY[a].emoji : '👤').join('');
    const authorNames = s.authors.map(a => FAMILY[a] ? FAMILY[a].name : a).join('、');

    let triangHtml = '';
    if (s.isTriangulated) {
      triangHtml = `
        <div class="triangulation">
          <div class="triangulation-icons">${s.authors.map(a => `<span>${FAMILY[a] ? FAMILY[a].emoji : '👤'}</span>`).join('')}</div>
          ${authorNames}都观察到了这个信号 ✓
        </div>
      `;
    } else if (s.authors.length === 1 && s.isStable) {
      const missingAuthors = Object.keys(FAMILY).filter(k => !s.authors.includes(k));
      const missingName = missingAuthors.length > 0 ? (FAMILY[missingAuthors[0]]?.name || '其他家人') : '其他家人';
      triangHtml = `
        <div class="blind-spot">
          💡 目前仅${authorNames}观察到，可以请${missingName}也留意一下
        </div>
      `;
    }

    return `
      <div class="signal-card stagger-item">
        <div class="signal-card-header">
          <span class="signal-name">${s.icon} ${s.name}</span>
          <span class="signal-meta">
            ${s.total}条 · 
            <span class="signal-trend ${s.trend}">${s.trend === 'up' ? '↗ 上升' : '→ 稳定'}</span>
          </span>
        </div>
        <div class="signal-desc">${getSignalDescription(s.name, s.total)}</div>
        ${triangHtml}
      </div>
    `;
  }).join('');

  setTimeout(() => {
    container.querySelectorAll('.stagger-item').forEach((item, i) => {
      setTimeout(() => item.classList.add('visible'), 200 + i * 120);
    });
  }, 100);
}

function getSignalDescription(dimName, count) {
  const descs = {
    '问题解决策略': '孩子在面对困难时倾向于主动尝试多种方法，并能描述自己的思考过程。这是高认知灵活性的早期信号。',
    '好奇心与探索欲': '孩子对新事物表现出持续的探索兴趣，不仅观察还会追问"为什么"。内在学习动机强劲。',
    '创造力与审美': '孩子在色彩、故事和发明方面展示了丰富的自发创造倾向，善于从日常材料中产生新想法。',
    '社交协调': '孩子在社交场景中展示主动性和协调能力，能自然地组织和参与群体活动。',
    '坚持度与专注力': '孩子能在感兴趣的活动中保持较长时间的专注，遇到困难后也愿意继续尝试。',
    '自然关怀与共情': '孩子对生命和自然表现出本能的关怀，对他人的情绪有敏锐的感知力。',
    '语言表达': '孩子有较强的表达意愿和能力，善于描述经历和分享想法。',
    '自我反思': '孩子展示了对自己行为和结果的反思能力，这是元认知发展的重要标志。',
  };
  return descs[dimName] || `该维度已积累${count}条观察记录，呈现稳定的行为模式。`;
}

// ---- Pending Signals ----
function renderPendingSignals(dimScores) {
  const container = document.getElementById('pendingSignals');
  const pending = Object.values(dimScores).filter(s => s.isPending);
  const empty = Object.values(dimScores).filter(s => s.total <= 1);

  let html = pending.map(s =>
    `<span class="pending-tag">${s.icon} ${s.name}（${s.total}条）</span>`
  ).join('');

  if (empty.length > 0) html += `<span class="pending-empty">其他维度暂无足够数据</span>`;
  container.innerHTML = html;
}

// ---- Goodness of Fit ----
function renderGoodnessOfFit(dimScores) {
  const card = document.getElementById('fitCard');
  const topDims = Object.values(dimScores).filter(s => s.total >= 2).sort((a, b) => b.total - a.total).slice(0, 3);

  if (topDims.length === 0) {
    card.textContent = '继续记录，环境适配建议将在积累更多数据后生成。';
    return;
  }

  const topName = topDims[0].name;
  let advice = '';
  if (topName.includes('问题解决') || topName.includes('好奇')) {
    advice = `${state.childName}在自主探索的环境中表现最佳。建议提供更多开放式任务（如科学小实验、开放式问题），减少指令式指导。在结构化学习中，允许他/她先自己探索再接受指导。`;
  } else if (topName.includes('创造')) {
    advice = `${state.childName}对创造性活动有强烈倾向。建议提供多样化的创作材料，鼓励自由发挥而非模仿范本。在日常生活中，欣赏他/她的"非标准答案"。`;
  } else if (topName.includes('社交')) {
    advice = `${state.childName}在社交环境中能充分展现能力。建议多提供与同龄人互动的机会，同时观察独处时的表现——社交能力强有时可能掩盖内在的独处偏好。`;
  } else {
    advice = `根据目前的观察记录，${state.childName}在${topDims.map(d => d.name).join('、')}方面展现出稳定的行为倾向。建议在日常生活中创造更多展示这些能力的机会。`;
  }
  card.textContent = advice;
}

// ---- Invite Hint ----
function showInviteHint() {
  let toast = document.getElementById('inviteToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'inviteToast';
    toast.className = 'invite-toast';
    toast.textContent = '📱 分享链接给家人，一起记录成长';
    document.body.appendChild(toast);
  }
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// ========================================================
// STATUS BAR TIME
// ========================================================
function updateStatusTime() {
  const now = new Date();
  const h = now.getHours().toString().padStart(2, '0');
  const m = now.getMinutes().toString().padStart(2, '0');
  document.getElementById('statusTime').textContent = h + ':' + m;
}

// ========================================================
// INIT
// ========================================================
document.addEventListener('DOMContentLoaded', () => {
  updateStatusTime();
  setInterval(updateStatusTime, 60000);
  initOnboarding();
  initProfilePage();
  state.records = [...PRESET_RECORDS];
});
