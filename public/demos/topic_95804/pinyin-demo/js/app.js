/**
 * 拼音小达人 - 双模式版 (儿童模式 + 家长模式)
 * TRAE AI 创造力大赛
 */

/* ===== 数据 ===== */
const diagnosisItems = [
  { category: '前后鼻音测试', word: '人民', pinyin: 'rén mín', type: 'qianhou' },
  { category: '前后鼻音测试', word: '金星', pinyin: 'jīn xīng', type: 'qianhou' },
  { category: '平翘舌测试', word: '自己', pinyin: 'zì jǐ', type: 'pingqiao' },
  { category: '平翘舌测试', word: '吃饭', pinyin: 'chī fàn', type: 'pingqiao' },
  { category: 'n / l 测试', word: '牛奶', pinyin: 'niú nǎi', type: 'nl' },
  { category: 'n / l 测试', word: '老师', pinyin: 'lǎo shī', type: 'nl' },
  { category: 'f / h 测试', word: '飞机', pinyin: 'fēi jī', type: 'fh' },
  { category: 'f / h 测试', word: '回家', pinyin: 'huí jiā', type: 'fh' }
];

const campData = {
  qianhou: {
    name: '前后鼻音特训营',
    words: [
      { word: '人民', pinyin: 'rén mín', target: '前鼻音 in', hint: '舌尖抵住下齿龈，气流从鼻腔出来', score: 72 },
      { word: '金星', pinyin: 'jīn xīng', target: '后鼻音 ing', hint: '舌根抬起抵住软腭，气流从鼻腔出来', score: 65 },
      { word: '认真', pinyin: 'rèn zhēn', target: '前鼻音 en', hint: '舌尖抵住上齿龈，气流从鼻腔出来', score: 80 },
      { word: '成功', pinyin: 'chéng gōng', target: '后鼻音 eng', hint: '舌根后缩抵住软腭，气流从鼻腔出来', score: 58 },
      { word: '心情', pinyin: 'xīn qíng', target: 'in / ing 对比', hint: '注意区分 in 和 ing 的舌位变化', score: 70 }
    ]
  },
  pingqiao: {
    name: '平翘舌特训营',
    words: [
      { word: '自己', pinyin: 'zì jǐ', target: '平舌音 z', hint: '舌尖平伸抵住上齿背', score: 78 },
      { word: '吃饭', pinyin: 'chī fàn', target: '翘舌音 ch', hint: '舌尖翘起抵住硬腭前部', score: 62 },
      { word: '彩色', pinyin: 'cǎi sè', target: '平舌音 c', hint: '舌尖接近上齿背，气流从缝隙中挤出', score: 75 },
      { word: '山水', pinyin: 'shān shuǐ', target: '翘舌音 sh', hint: '舌尖翘起接近硬腭前部', score: 55 },
      { word: '早上', pinyin: 'zǎo shàng', target: '平舌音 z', hint: '舌尖平伸抵住上齿背', score: 68 }
    ]
  },
  nl: {
    name: 'n / l 特训营',
    words: [
      { word: '牛奶', pinyin: 'niú nǎi', target: '鼻音 n', hint: '舌尖抵住上齿龈，气流从鼻腔出来', score: 45 },
      { word: '老师', pinyin: 'lǎo shī', target: '边音 l', hint: '舌尖抵住上齿龈，气流从舌头两边出来', score: 82 },
      { word: '男女', pinyin: 'nán nǚ', target: '鼻音 n', hint: '注意 n 气流从鼻腔出', score: 50 },
      { word: '蓝色', pinyin: 'lán sè', target: '边音 l', hint: '气流从舌头两侧通过', score: 88 },
      { word: '努力', pinyin: 'nǔ lì', target: 'n / l 对比', hint: '注意两个声母发音部位相同，气流通道不同', score: 60 }
    ]
  },
  fh: {
    name: 'f / h 特训营',
    words: [
      { word: '飞机', pinyin: 'fēi jī', target: '唇齿音 f', hint: '上齿轻触下唇，气流从缝隙中摩擦出来', score: 85 },
      { word: '回家', pinyin: 'huí jiā', target: '舌根音 h', hint: '舌根接近软腭，气流摩擦出来', score: 72 },
      { word: '非常', pinyin: 'fēi cháng', target: '唇齿音 f', hint: '上齿轻咬下唇内侧', score: 80 },
      { word: '荷花', pinyin: 'hé huā', target: '舌根音 h', hint: '舌根后缩接近软腭', score: 78 },
      { word: '风沙', pinyin: 'fēng shā', target: '唇齿音 f', hint: '上齿轻触下唇，气流摩擦出来', score: 75 }
    ]
  }
};

const trendData = [62, 68, 65, 72, 75, 70, 78, 74, 80, 82, 79, 85];

const badgeList = [
  { id: 'first_try', icon: '&#128640;', name: '初次尝试', pinyin: 'chū cì cháng shì', desc: '完成第一次发音诊断', pinyin_desc: 'wán chéng dì yī cì fā yīn zhěn duàn', condition: () => totalStats.diagnosisDone },
  { id: 'streak_3', icon: '&#128293;', name: '三日连珠', pinyin: 'sān rì lián zhū', desc: '连续打卡 3 天', pinyin_desc: 'lián xù dǎ kǎ 3 tiān', condition: () => totalStats.streak >= 3 },
  { id: 'streak_7', icon: '&#127775;', name: '一周达人', pinyin: 'yī zhōu dá rén', desc: '连续打卡 7 天', pinyin_desc: 'lián xù dǎ kǎ 7 tiān', condition: () => totalStats.streak >= 7 },
  { id: 'stars_10', icon: '&#11088;', name: '星星收集者', pinyin: 'xīng xīng shōu jí zhě', desc: '累计获得 10 颗星星', pinyin_desc: 'lěi jì huò dé 10 kē xīng xīng', condition: () => totalStats.stars >= 10 },
  { id: 'stars_30', icon: '&#127775;', name: '星星大师', pinyin: 'xīng xīng dà shī', desc: '累计获得 30 颗星星', pinyin_desc: 'lěi jì huò dé 30 kē xīng xīng', condition: () => totalStats.stars >= 30 },
  { id: 'camp_qianhou', icon: '&#128172;', name: '鼻音高手', pinyin: 'bí yīn gāo shǒu', desc: '完成前后鼻音特训营', pinyin_desc: 'wán chéng qián hòu bí yīn tè xùn yíng', condition: () => isCampCompleted('qianhou') },
  { id: 'camp_pingqiao', icon: '&#128483;', name: '舌位专家', pinyin: 'shé wèi zhuān jiā', desc: '完成平翘舌特训营', pinyin_desc: 'wán chéng píng qiào shé tè xùn yíng', condition: () => isCampCompleted('pingqiao') },
  { id: 'camp_nl', icon: '&#128226;', name: 'n/l 克星', pinyin: 'n/l kè xīng', desc: '完成 n/l 特训营', pinyin_desc: 'wán chéng n/l tè xùn yíng', condition: () => isCampCompleted('nl') },
  { id: 'camp_fh', icon: '&#128227;', name: 'f/h 克星', pinyin: 'f/h kè xīng', desc: '完成 f/h 特训营', pinyin_desc: 'wán chéng f/h tè xùn yíng', condition: () => isCampCompleted('fh') },
  { id: 'all_camps', icon: '&#127942;', name: '拼音小达人', pinyin: 'pīn yīn xiǎo dá rén', desc: '完成所有特训营', pinyin_desc: 'wán chéng suǒ yǒu tè xùn yíng', condition: () => ['qianhou','pingqiao','nl','fh'].every(isCampCompleted) }
];

const leaderboardData = [
  { name: '小明', avatar: '&#128118;', score: '已完成 4 个特训营', pinyin: 'yǐ wán chéng 4 gè tè xùn yíng', stars: '&#127775;&#127775;&#127775;&#127775;&#127775; 28' },
  { name: '小红', avatar: '&#128117;', score: '已完成 3 个特训营', pinyin: 'yǐ wán chéng 3 gè tè xùn yíng', stars: '&#127775;&#127775;&#127775;&#127775; 22' },
  { name: '你', avatar: '&#128113;', score: '练习中', pinyin: 'liàn xí zhōng', stars: '' },
  { name: '小刚', avatar: '&#128102;', score: '已完成 2 个特训营', pinyin: 'yǐ wán chéng 2 gè tè xùn yíng', stars: '&#127775;&#127775;&#127775; 15' },
  { name: '小丽', avatar: '&#128120;', score: '已完成 1 个特训营', pinyin: 'yǐ wán chéng 1 gè tè xùn yíng', stars: '&#127775;&#127775; 8' }
];

/* ===== 状态 ===== */
let currentMode = 'kid'; // 'kid' | 'parent'
let currentPage = 'home';
let diagnosisIndex = 0;
let diagnosisScores = { qianhou: [], pingqiao: [], nl: [], fh: [] };
let isRecording = false;
let currentCamp = null;
let currentWordIndex = 0;
let campProgress = JSON.parse(localStorage.getItem('pinyin_progress') || '{}');

// 全局统计（从 localStorage 读取）
let totalStats = JSON.parse(localStorage.getItem('pinyin_stats') || '{}');
if (!totalStats.stars) totalStats = { stars: 0, levels: 0, streak: 1, lastCheckin: '', diagnosisDone: false, badges: [] };

/* ================================================================
   模式切换
   ================================================================ */
const PARENT_PASSWORD = '8888';

function showPasswordDialog() {
  switchToParentMode();
}

function hidePasswordDialog() {
  document.getElementById('passwordOverlay').classList.add('hidden');
}

function verifyPassword() {
  var input = document.getElementById('passwordInput');
  var error = document.getElementById('passwordError');
  if (input.value === PARENT_PASSWORD) {
    error.classList.add('hidden');
    hidePasswordDialog();
    switchToParentMode();
  } else {
    error.classList.remove('hidden');
    input.value = '';
    input.focus();
  }
}

function switchToParentMode() {
  currentMode = 'parent';
  document.body.setAttribute('data-mode', 'parent');
  showPage('home');
  refreshParentHome();
}

function switchToKidMode() {
  currentMode = 'kid';
  document.body.setAttribute('data-mode', 'kid');
  showPage('home');
  refreshKidHome();
}

// 密码输入框回车键提交
document.addEventListener('keydown', function(e) {
  if (e.key === 'Enter' && !document.getElementById('passwordOverlay').classList.contains('hidden')) {
    verifyPassword();
  }
});

/* ================================================================
   页面路由
   ================================================================ */
function showPage(page) {
  document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
  document.getElementById('page-' + page).classList.add('active');
  currentPage = page;

  // 更新儿童模式底部Tab高亮
  document.querySelectorAll('.kid-tab').forEach(function(tab) { tab.classList.remove('active'); });
  var kidTab = document.querySelector('.kid-tab[data-tab="' + page + '"]');
  if (kidTab) kidTab.classList.add('active');

  // 更新家长模式导航高亮
  document.querySelectorAll('.parent-nav-btn').forEach(function(btn) { btn.classList.remove('active'); });
  var pnavBtn = document.querySelector('.parent-nav-btn[data-pnav="' + page + '"]');
  if (pnavBtn) pnavBtn.classList.add('active');

  // 页面特定刷新
  if (page === 'home') {
    if (currentMode === 'kid') refreshKidHome();
    else refreshParentHome();
  }
  if (page === 'dashboard') drawTrendChart();
  if (page === 'training') refreshTrainingHall();
  if (page === 'rewards') renderRewards();

  window.scrollTo(0, 0);
}

function goHome() { showPage('home'); }
function startDiagnosis() { showPage('diagnosis'); }

/* 儿童模式Tab导航 */
function kidTabNav(page) {
  showPage(page);
}

/* 家长模式导航 */
function parentNav(page) {
  showPage(page);
}

/* ================================================================
   首页刷新
   ================================================================ */
function refreshKidHome() {
  // 更新打卡状态
  var today = new Date().toDateString();
  var checkinBtn = document.getElementById('homeCheckinBtn');
  var checkinText = document.getElementById('homeCheckinText');
  if (totalStats.lastCheckin === today) {
    checkinBtn.innerHTML = '<span class="with-pinyin" data-pinyin="yǐ dǎ kǎ">已打卡</span>';
    checkinBtn.classList.add('checked');
    checkinText.innerHTML = '<span class="with-pinyin" data-pinyin="jīn rì yǐ dǎ kǎ">今日已打卡</span>';
  } else {
    checkinBtn.innerHTML = '<span class="with-pinyin" data-pinyin="dǎ kǎ">打卡</span>';
    checkinBtn.classList.remove('checked');
    checkinText.innerHTML = '<span class="with-pinyin" data-pinyin="jīn rì wèi dǎ kǎ">今日未打卡</span>';
  }

  // 统计
  document.getElementById('homeStars').textContent = totalStats.stars;
  document.getElementById('homeLevels').textContent = totalStats.levels;
  document.getElementById('homeStreak').textContent = totalStats.streak;
}

function refreshParentHome() {
  document.getElementById('povStars').textContent = totalStats.stars;
  document.getElementById('povLevels').textContent = totalStats.levels;
  document.getElementById('povStreak').textContent = totalStats.streak;
  document.getElementById('povBadges').textContent = totalStats.badges.length;
}

/* ================================================================
   智能诊断
   ================================================================ */
function beginDiagnosisTest() {
  diagnosisIndex = 0;
  diagnosisScores = { qianhou: [], pingqiao: [], nl: [], fh: [] };
  document.getElementById('diagnosis-start').classList.add('hidden');
  document.getElementById('diagnosis-testing').classList.remove('hidden');
  document.getElementById('diagnosis-result').classList.add('hidden');
  renderTestItem();
}

function renderTestItem() {
  var item = diagnosisItems[diagnosisIndex];
  document.getElementById('testCategory').textContent = item.category;
  document.getElementById('testWords').textContent = item.word;
  document.getElementById('testPinyin').textContent = item.pinyin;
  document.getElementById('testProgressText').textContent = (diagnosisIndex + 1) + ' / ' + diagnosisItems.length;
  document.getElementById('testProgress').style.width = ((diagnosisIndex + 1) / diagnosisItems.length * 100) + '%';

  isRecording = false;
  var btn = document.getElementById('recordBtn');
  btn.classList.remove('recording');
  document.getElementById('recordText').textContent = '点我开始读';
}

function toggleRecord() {
  var btn = document.getElementById('recordBtn');
  if (isRecording) {
    isRecording = false;
    btn.classList.remove('recording');
    document.getElementById('recordText').textContent = '点我开始读';

    setTimeout(function() {
      var item = diagnosisItems[diagnosisIndex];
      var score = Math.floor(50 + Math.random() * 45);
      diagnosisScores[item.type].push(score);
      diagnosisIndex++;

      if (diagnosisIndex >= diagnosisItems.length) {
        totalStats.diagnosisDone = true;
        saveStats();
        showDiagnosisResult();
      } else {
        renderTestItem();
      }
    }, 600);
  } else {
    isRecording = true;
    btn.classList.add('recording');
    document.getElementById('recordText').textContent = '录音中...';
  }
}

function showDiagnosisResult() {
  document.getElementById('diagnosis-testing').classList.add('hidden');
  document.getElementById('diagnosis-result').classList.remove('hidden');

  var avg = function(type) {
    var arr = diagnosisScores[type];
    return arr.length ? Math.round(arr.reduce(function(a, b) { return a + b; }, 0) / arr.length) : 50;
  };
  var scores = {
    qianhou: avg('qianhou'),
    pingqiao: avg('pingqiao'),
    nl: avg('nl'),
    fh: avg('fh')
  };

  drawRadarChart(scores);

  var sorted = Object.entries(scores).sort(function(a, b) { return a[1] - b[1]; });
  var weakest = sorted[0];
  var weaknessNames = { qianhou: '前后鼻音', pingqiao: '平翘舌', nl: 'n / l', fh: 'f / h' };
  var weaknessPinyin = { qianhou: 'qián hòu bí yīn', pingqiao: 'píng qiào shé', nl: 'n / l', fh: 'f / h' };

  document.getElementById('resultSummary').innerHTML =
    '<span class="with-pinyin" data-pinyin="zhěn duàn jié lùn">诊断结论：</span>' +
    '<span class="with-pinyin" data-pinyin="nǐ de fā yīn zhěng tǐ biǎo xiàn bù cuò">你的发音整体表现不错！</span><br>' +
    '<span class="with-pinyin" data-pinyin="qí zhōng">其中</span> <span style="color:#E8783B;font-weight:700" class="with-pinyin" data-pinyin="' + weaknessPinyin[weakest[0]] + '">' + weaknessNames[weakest[0]] + '</span> ' +
    '<span class="with-pinyin" data-pinyin="shì xiāng duì bó ruò de bù fèn">是相对薄弱的部分</span>（准确率 ' + weakest[1] + '%），' +
    '<span class="with-pinyin" data-pinyin="jiàn yì yōu xiān jìn rù">建议优先进入</span><span style="color:#E8783B;font-weight:700" class="with-pinyin" data-pinyin="' + weaknessPinyin[weakest[0]] + ' tè xùn yíng">' + weaknessNames[weakest[0]] + '特训营</span>' +
    '<span class="with-pinyin" data-pinyin="jìn xíng zhēn duì xìng liàn xí">进行针对性练习。</span>';
}

function resetDiagnosis() {
  document.getElementById('diagnosis-result').classList.add('hidden');
  document.getElementById('diagnosis-start').classList.remove('hidden');
}

/* ================================================================
   Canvas 雷达图
   ================================================================ */
function drawRadarChart(scores) {
  var canvas = document.getElementById('radarCanvas');
  var ctx = canvas.getContext('2d');
  var w = canvas.width, h = canvas.height;
  var cx = w / 2, cy = h / 2 + 5;
  var r = 90;
  var labels = ['前后鼻音', '平翘舌', 'n/l', 'f/h'];
  var values = [scores.qianhou, scores.pingqiao, scores.nl, scores.fh];
  var colors = ['#E8783B', '#2D9B8C', '#4A90D9', '#9B7ED9'];

  ctx.clearRect(0, 0, w, h);

  // 绘制网格
  for (var i = 1; i <= 4; i++) {
    ctx.beginPath();
    ctx.strokeStyle = '#E8D5C4';
    ctx.lineWidth = 1;
    for (var j = 0; j < 4; j++) {
      var angle = (Math.PI * 2 / 4) * j - Math.PI / 2;
      var x = cx + Math.cos(angle) * (r * i / 4);
      var y = cy + Math.sin(angle) * (r * i / 4);
      if (j === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  }

  // 绘制轴线
  for (var j = 0; j < 4; j++) {
    var angle = (Math.PI * 2 / 4) * j - Math.PI / 2;
    var x = cx + Math.cos(angle) * r;
    var y = cy + Math.sin(angle) * r;
    ctx.beginPath();
    ctx.strokeStyle = '#E8D5C4';
    ctx.moveTo(cx, cy);
    ctx.lineTo(x, y);
    ctx.stroke();

    // 标签
    var lx = cx + Math.cos(angle) * (r + 22);
    var ly = cy + Math.sin(angle) * (r + 22);
    ctx.fillStyle = '#2D2A26';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(labels[j], lx, ly);
  }

  // 绘制数据区域
  ctx.beginPath();
  for (var j = 0; j < 4; j++) {
    var angle = (Math.PI * 2 / 4) * j - Math.PI / 2;
    var v = Math.min(values[j], 100) / 100;
    var x = cx + Math.cos(angle) * (r * v);
    var y = cy + Math.sin(angle) * (r * v);
    if (j === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = 'rgba(232,120,59,0.2)';
  ctx.fill();
  ctx.strokeStyle = '#E8783B';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // 绘制数据点
  for (var j = 0; j < 4; j++) {
    var angle = (Math.PI * 2 / 4) * j - Math.PI / 2;
    var v = Math.min(values[j], 100) / 100;
    var x = cx + Math.cos(angle) * (r * v);
    var y = cy + Math.sin(angle) * (r * v);
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fillStyle = colors[j];
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

/* ================================================================
   训练大厅
   ================================================================ */
function refreshTrainingHall() {
  // 更新统计
  var elStars = document.getElementById('totalStars');
  var elLevels = document.getElementById('completedLevels');
  var elStreak = document.getElementById('streakDays');
  if (elStars) elStars.textContent = totalStats.stars;
  if (elLevels) elLevels.textContent = totalStats.levels;
  if (elStreak) elStreak.textContent = totalStats.streak;

  // 更新打卡状态
  var today = new Date().toDateString();
  var checkinBtn = document.getElementById('checkinBtn');
  var checkinStatus = document.getElementById('checkinStatus');
  if (totalStats.lastCheckin === today) {
    checkinBtn.innerHTML = '<span class="with-pinyin" data-pinyin="yǐ dǎ kǎ">已打卡</span>';
    checkinBtn.classList.add('checked');
    checkinStatus.innerHTML = '<span class="with-pinyin" data-pinyin="jīn rì yǐ dǎ kǎ">今日已打卡</span>';
  } else {
    checkinBtn.innerHTML = '<span class="with-pinyin" data-pinyin="lì jí dǎ kǎ">打卡</span>';
    checkinBtn.classList.remove('checked');
    checkinStatus.innerHTML = '<span class="with-pinyin" data-pinyin="jīn rì wèi dǎ kǎ">今日未打卡</span>';
  }

  // 更新各特训营进度和星星
  ['qianhou', 'pingqiao', 'nl', 'fh'].forEach(function(campId) {
    var progress = campProgress[campId] || [];
    var completed = progress.filter(function(s) { return s > 0; }).length;
    var stars = progress.reduce(function(sum, s) { return sum + (s >= 70 ? 1 : 0); }, 0);

    var card = document.querySelector('.camp-card[data-camp="' + campId + '"]');
    if (card) {
      var bar = card.querySelector('.camp-progress-bar div');
      var text = card.querySelector('.camp-progress span');
      if (bar) bar.style.width = (completed / 5 * 100) + '%';
      if (text) text.textContent = completed + '/5 关';

      var starBox = document.getElementById('stars-' + campId);
      if (starBox) {
        var starHtml = '';
        for (var i = 0; i < 5; i++) {
          starHtml += i < stars ? '&#127775;' : '&#9734;';
        }
        starBox.innerHTML = starHtml;
      }
    }
  });
}

function enterCamp(campId) {
  currentCamp = campId;
  currentWordIndex = 0;
  var camp = campData[campId];
  document.getElementById('practiceTitle').textContent = camp.name + ' - 第 ' + (currentWordIndex + 1) + ' 题';
  renderPracticeWord();
  showPage('practice');
}

function renderPracticeWord() {
  var camp = campData[currentCamp];
  var word = camp.words[currentWordIndex];
  document.getElementById('practiceWord').textContent = word.word;
  document.getElementById('practicePinyin').textContent = word.pinyin;
  document.getElementById('practiceTarget').textContent = '目标发音：' + word.target;
  document.getElementById('mouthHint').textContent = word.hint;
  document.getElementById('wordCounter').textContent = (currentWordIndex + 1) + ' / ' + camp.words.length;
  document.getElementById('practiceTitle').textContent = camp.name + ' - 第 ' + (currentWordIndex + 1) + ' 题';

  isRecording = false;
  var btn = document.getElementById('practiceRecordBtn');
  btn.classList.remove('recording');
  document.getElementById('practiceRecordText').textContent = '点我读';
}

function prevWord() {
  if (currentWordIndex > 0) {
    currentWordIndex--;
    renderPracticeWord();
  }
}

function nextWord() {
  var camp = campData[currentCamp];
  if (currentWordIndex < camp.words.length - 1) {
    currentWordIndex++;
    renderPracticeWord();
  }
}

function playStandard() {
  var btn = document.getElementById('btnPlayStandard');
  btn.innerHTML = '&#9658; 播放中...';
  setTimeout(function() {
    btn.innerHTML = '&#128266; 听一听';
  }, 1500);
}

function togglePracticeRecord() {
  var btn = document.getElementById('practiceRecordBtn');
  if (isRecording) {
    isRecording = false;
    btn.classList.remove('recording');
    document.getElementById('practiceRecordText').textContent = '点我读';

    setTimeout(function() {
      var camp = campData[currentCamp];
      var word = camp.words[currentWordIndex];
      var randomOffset = Math.floor(Math.random() * 20) - 10;
      var score = Math.max(0, Math.min(100, word.score + randomOffset));
      showScorePopup(score);

      // 保存进度
      if (!campProgress[currentCamp]) campProgress[currentCamp] = [];
      var oldScore = campProgress[currentCamp][currentWordIndex] || 0;
      campProgress[currentCamp][currentWordIndex] = Math.max(oldScore, score);
      localStorage.setItem('pinyin_progress', JSON.stringify(campProgress));

      // 统计星星（每题>=70分得1星）
      if (score >= 70 && oldScore < 70) {
        totalStats.stars += 1;
        createStarFloat(btn);
      }
      // 新完成的关卡
      if (score > 0 && oldScore === 0) {
        totalStats.levels += 1;
      }
      saveStats();

      // 检查是否是最后一题且已完成
      var campProg = campProgress[currentCamp] || [];
      var allDone = camp.words.every(function(_, i) { return (campProg[i] || 0) > 0; });
      if (allDone && currentWordIndex === camp.words.length - 1) {
        setTimeout(function() { showLevelComplete(camp.name); }, 800);
      }
    }, 600);
  } else {
    isRecording = true;
    btn.classList.add('recording');
    document.getElementById('practiceRecordText').textContent = '录音中...';
  }
}

function showScorePopup(score) {
  var popup = document.getElementById('scorePopup');
  var starsEl = document.getElementById('scoreStars');
  var textEl = document.getElementById('scoreText');

  var stars = '';
  if (score >= 90) stars = '&#127775;&#127775;&#127775;';
  else if (score >= 70) stars = '&#127775;&#127775;';
  else stars = '&#127775;';

  var text = '';
  if (score >= 90) text = '太棒了！发音非常标准！(' + score + '分)';
  else if (score >= 70) text = '不错哦，再练习一下会更好！(' + score + '分)';
  else text = '还需要加油，多听多练！(' + score + '分)';

  starsEl.innerHTML = stars;
  textEl.textContent = text;
  popup.classList.remove('hidden');
}

function closeScore() {
  document.getElementById('scorePopup').classList.add('hidden');
}

/* ================================================================
   关卡完成庆祝
   ================================================================ */
function showLevelComplete(campName) {
  var overlay = document.createElement('div');
  overlay.className = 'level-complete-overlay';
  overlay.innerHTML =
    '<div class="level-complete-box">' +
      '<div class="complete-title">&#127881; 特训营通关！</div>' +
      '<div class="complete-stars">&#127775;&#127775;&#127775;</div>' +
      '<div class="complete-reward">恭喜完成「' + campName + '」<br>获得 3 颗星星奖励</div>' +
      '<button class="btn-primary" onclick="this.closest(\'.level-complete-overlay\').remove();showPage(\'training\');">返回大厅</button>' +
    '</div>';
  document.body.appendChild(overlay);
  totalStats.stars += 3;
  saveStats();
}

/* ================================================================
   星星飞入动画
   ================================================================ */
function createStarFloat(targetEl) {
  var star = document.createElement('div');
  star.className = 'star-float';
  star.innerHTML = '&#127775;';
  var rect = targetEl.getBoundingClientRect();
  star.style.left = (rect.left + rect.width / 2 - 12) + 'px';
  star.style.top = (rect.top - 10) + 'px';
  document.body.appendChild(star);
  setTimeout(function() { star.remove(); }, 1000);
}

/* ================================================================
   打卡功能
   ================================================================ */
function doCheckin() {
  var today = new Date().toDateString();
  if (totalStats.lastCheckin === today) return;

  var yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  var isConsecutive = totalStats.lastCheckin === yesterday.toDateString();

  if (isConsecutive || !totalStats.lastCheckin) {
    totalStats.streak += 1;
  } else {
    totalStats.streak = 1;
  }
  totalStats.lastCheckin = today;
  totalStats.stars += 1; // 打卡奖励1星
  saveStats();

  // 触发星星动画
  if (currentPage === 'training') {
    createStarFloat(document.getElementById('checkinBtn'));
  } else if (currentPage === 'home') {
    createStarFloat(document.getElementById('homeCheckinBtn'));
  }

  // 刷新当前页面
  if (currentPage === 'training') refreshTrainingHall();
  if (currentPage === 'home') {
    if (currentMode === 'kid') refreshKidHome();
    else refreshParentHome();
  }
}

/* ================================================================
   成就中心
   ================================================================ */
function renderRewards() {
  document.getElementById('rTotalStars').textContent = totalStats.stars;
  document.getElementById('rStreak').textContent = totalStats.streak;

  // 检查并解锁徽章
  badgeList.forEach(function(b) {
    if (!totalStats.badges.includes(b.id) && b.condition()) {
      totalStats.badges.push(b.id);
      totalStats.stars += 2; // 解锁徽章奖励2星
    }
  });
  saveStats();

  document.getElementById('rBadges').textContent = totalStats.badges.length;

  // 渲染徽章
  var grid = document.getElementById('badgesGrid');
  grid.innerHTML = badgeList.map(function(b) {
    var unlocked = totalStats.badges.includes(b.id);
    return '<div class="badge-card ' + (unlocked ? 'unlocked' : 'locked') + '">' +
      '<span class="badge-icon">' + b.icon + '</span>' +
      '<div class="badge-name with-pinyin" data-pinyin="' + b.pinyin + '">' + b.name + '</div>' +
      '<div class="badge-desc with-pinyin" data-pinyin="' + b.pinyin_desc + '">' + b.desc + '</div>' +
    '</div>';
  }).join('');

  // 渲染排行榜
  var lb = document.getElementById('leaderboard');
  lb.innerHTML = leaderboardData.map(function(p, i) {
    var rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : 'normal';
    return '<div class="leader-item">' +
      '<div class="leader-rank ' + rankClass + '">' + (i + 1) + '</div>' +
      '<div class="leader-avatar">' + p.avatar + '</div>' +
      '<div class="leader-info">' +
        '<div class="leader-name">' + p.name + '</div>' +
        '<div class="leader-score with-pinyin" data-pinyin="' + p.pinyin + '">' + p.score + '</div>' +
      '</div>' +
      '<div class="leader-stars">' + p.stars + '</div>' +
    '</div>';
  }).join('');
}

/* ================================================================
   工具函数
   ================================================================ */
function isCampCompleted(campId) {
  var progress = campProgress[campId] || [];
  return campData[campId].words.every(function(_, i) { return (progress[i] || 0) > 0; });
}

function saveStats() {
  localStorage.setItem('pinyin_stats', JSON.stringify(totalStats));
}

/* ================================================================
   家长看板趋势图
   ================================================================ */
function drawTrendChart() {
  var canvas = document.getElementById('trendCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var w = canvas.width, h = canvas.height;
  var padding = { top: 20, right: 20, bottom: 30, left: 35 };
  var chartW = w - padding.left - padding.right;
  var chartH = h - padding.top - padding.bottom;

  ctx.clearRect(0, 0, w, h);

  // 绘制网格线
  ctx.strokeStyle = '#E8D5C4';
  ctx.lineWidth = 1;
  for (var i = 0; i <= 4; i++) {
    var y = padding.top + (chartH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(w - padding.right, y);
    ctx.stroke();

    ctx.fillStyle = '#7A7268';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(100 - i * 25, padding.left - 6, y + 4);
  }

  var data = trendData;
  var stepX = chartW / (data.length - 1);

  // 绘制填充区域
  ctx.beginPath();
  data.forEach(function(v, i) {
    var x = padding.left + i * stepX;
    var y = padding.top + chartH * (1 - v / 100);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.lineTo(padding.left + (data.length - 1) * stepX, padding.top + chartH);
  ctx.lineTo(padding.left, padding.top + chartH);
  ctx.closePath();
  ctx.fillStyle = 'rgba(232,120,59,0.15)';
  ctx.fill();

  // 绘制折线
  ctx.beginPath();
  data.forEach(function(v, i) {
    var x = padding.left + i * stepX;
    var y = padding.top + chartH * (1 - v / 100);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = '#E8783B';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // 绘制数据点
  data.forEach(function(v, i) {
    var x = padding.left + i * stepX;
    var y = padding.top + chartH * (1 - v / 100);
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#E8783B';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  // 绘制日期标签
  ctx.fillStyle = '#7A7268';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  var labels = ['6.1', '6.2', '6.3', '6.4', '6.5', '6.6', '6.7', '6.8', '6.9', '6.10', '6.11', '6.12'];
  labels.forEach(function(label, i) {
    var x = padding.left + i * stepX;
    ctx.fillText(label, x, h - 8);
  });
}

/* ================================================================
   初始化
   ================================================================ */
window.addEventListener('DOMContentLoaded', function() {
  // 默认进入儿童模式
  currentMode = 'kid';
  document.body.setAttribute('data-mode', 'kid');
  showPage('home');
});
