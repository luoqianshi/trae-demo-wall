/* ============================================
   非遗新语 · Heritage Reimagined
   交互逻辑 JavaScript
   ============================================ */

/* ---------- 平滑滚动 ---------- */
function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) { el.scrollIntoView({ behavior: 'smooth' }); }
}

/* ---------- 数字递增动画 ---------- */
function animateCounter() {
  const counters = document.querySelectorAll('.stat-num');
  counters.forEach(counter => {
    const target = parseInt(counter.getAttribute('data-target'));
    let current = 0;
    const increment = target / 80;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        counter.textContent = target;
        clearInterval(timer);
      } else {
        counter.textContent = Math.floor(current);
      }
    }, 25);
  });
}

/* 页面加载后触发动画 */
window.addEventListener('load', () => {
  animateCounter();
  initQuiz();
});

/* ============================================
   皮影戏互动游戏
   ============================================ */
(function() {
  const puppet = document.getElementById('puppet');
  const stage = document.querySelector('.stage-screen');
  const targetsContainer = document.getElementById('targets');
  const scoreDisplay = document.getElementById('scoreDisplay');
  const timeDisplay = document.getElementById('timeDisplay');
  const startBtn = document.getElementById('startBtn');
  const resetBtn = document.getElementById('resetBtn');
  const hint = document.getElementById('gameHint');
  const highScoreEl = document.getElementById('highScore');

  let score = 0;
  let timeLeft = 60;
  let isPlaying = false;
  let gameTimer = null;
  let spawnTimer = null;
  let targets = [];
  let puppetX, puppetY;

  /* 获取最高分 */
  let highScore = parseInt(localStorage.getItem('heritageHighScore') || '0');
  highScoreEl.textContent = highScore;

  /* 初始化皮影位置 */
  function initPuppetPosition() {
    const rect = stage.getBoundingClientRect();
    puppetX = rect.width / 2;
    puppetY = rect.height / 2;
    updatePuppet();
  }

  function updatePuppet() {
    puppet.style.left = puppetX + 'px';
    puppet.style.top = puppetY + 'px';
  }

  /* 键盘控制 */
  const keys = {};
  document.addEventListener('keydown', (e) => { keys[e.key.toLowerCase()] = true; });
  document.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

  /* 键盘移动逻辑 */
  function handleKeyboardMovement() {
    if (!isPlaying) return;
    const speed = 8;
    const rect = stage.getBoundingClientRect();

    if (keys['arrowleft'] || keys['a']) puppetX -= speed;
    if (keys['arrowright'] || keys['d']) puppetX += speed;
    if (keys['arrowup'] || keys['w']) puppetY -= speed;
    if (keys['arrowdown'] || keys['s']) puppetY += speed;

    /* 边界限制 */
    puppetX = Math.max(30, Math.min(rect.width - 90, puppetX));
    puppetY = Math.max(60, Math.min(rect.height - 100, puppetY));

    updatePuppet();
    requestAnimationFrame(handleKeyboardMovement);
  }

  /* 鼠标拖动 */
  let isDragging = false;
  let dragOffset = { x: 0, y: 0 };

  stage.addEventListener('mousedown', (e) => {
    if (!isPlaying) return;
    isDragging = true;
    const rect = stage.getBoundingClientRect();
    dragOffset.x = e.clientX - rect.left - puppetX;
    dragOffset.y = e.clientY - rect.top - puppetY;
    stage.style.cursor = 'grabbing';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging || !isPlaying) return;
    const rect = stage.getBoundingClientRect();
    puppetX = e.clientX - rect.left - dragOffset.x;
    puppetY = e.clientY - rect.top - dragOffset.y;
    puppetX = Math.max(30, Math.min(rect.width - 90, puppetX));
    puppetY = Math.max(60, Math.min(rect.height - 100, puppetY));
    updatePuppet();
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
    stage.style.cursor = 'grab';
  });

  /* 触屏支持 */
  stage.addEventListener('touchstart', (e) => {
    if (!isPlaying) return;
    const touch = e.touches[0];
    const rect = stage.getBoundingClientRect();
    puppetX = touch.clientX - rect.left - 30;
    puppetY = touch.clientY - rect.top - 60;
    updatePuppet();
  }, { passive: true });

  stage.addEventListener('touchmove', (e) => {
    if (!isPlaying) return;
    e.preventDefault();
    const touch = e.touches[0];
    const rect = stage.getBoundingClientRect();
    puppetX = touch.clientX - rect.left - 30;
    puppetY = touch.clientY - rect.top - 60;
    puppetX = Math.max(30, Math.min(rect.width - 90, puppetX));
    puppetY = Math.max(60, Math.min(rect.height - 100, puppetY));
    updatePuppet();
  }, { passive: false });

  /* 生成目标物 */
  function spawnTarget() {
    const rect = stage.getBoundingClientRect();
    const target = document.createElement('div');
    target.className = 'target';
    const isCloud = Math.random() > 0.35;
    if (isCloud) {
      target.classList.add('cloud-item');
      target.textContent = ['☁', '⛅', '☁'][Math.floor(Math.random() * 3)];
      target.dataset.type = 'good';
    } else {
      target.classList.add('storm');
      target.textContent = ['🌪', '💨', '🌀'][Math.floor(Math.random() * 3)];
      target.dataset.type = 'bad';
    }
    const duration = 3 + Math.random() * 2;
    target.style.left = (Math.random() * (rect.width - 80)) + 'px';
    target.style.animationDuration = duration + 's';
    targetsContainer.appendChild(target);
    targets.push(target);
    /* 动画结束后移除 */
    setTimeout(() => {
      if (target.parentNode) {
        target.parentNode.removeChild(target);
      }
      const idx = targets.indexOf(target);
      if (idx > -1) targets.splice(idx, 1);
    }, duration * 1000);
  }

  /* 碰撞检测 */
  function checkCollisions() {
    if (!isPlaying) return;
    const puppetRect = {
      left: puppetX,
      right: puppetX + 60,
      top: puppetY,
      bottom: puppetY + 120
    };
    for (let i = targets.length - 1; i >= 0; i--) {
      const t = targets[i];
      const rect = t.getBoundingClientRect();
      const stageRect = stage.getBoundingClientRect();
      const targetRect = {
        left: rect.left - stageRect.left,
        right: rect.right - stageRect.left,
        top: rect.top - stageRect.top,
        bottom: rect.bottom - stageRect.top
      };
      const hit = !(puppetRect.right < targetRect.left ||
                  puppetRect.left > targetRect.right ||
                  puppetRect.bottom < targetRect.top ||
                  puppetRect.top > targetRect.bottom);
      if (hit) {
        if (t.dataset.type === 'good') {
          score += 10;
          showFloatText(t, '+10', '#d4a857');
        } else {
          score = Math.max(0, score - 15);
          showFloatText(t, '-15', '#8b2c2c');
        }
        scoreDisplay.textContent = '得分: ' + score;
        if (t.parentNode) t.parentNode.removeChild(t);
        targets.splice(i, 1);
      }
    }
    requestAnimationFrame(checkCollisions);
  }

  /* 漂浮文字效果 */
  function showFloatText(element, text, color) {
    const float = document.createElement('div');
    float.textContent = text;
    float.style.position = 'absolute';
    float.style.left = element.style.left;
    float.style.top = (parseFloat(element.style.top || '0') + 50) + 'px';
    float.style.fontSize = '24px';
    float.style.fontWeight = '900';
    float.style.color = color;
    float.style.zIndex = '15';
    float.style.pointerEvents = 'none';
    float.style.animation = 'fadeIn 0.3s ease, float 1s ease-out forwards';
    targetsContainer.appendChild(float);
    setTimeout(() => { if (float.parentNode) float.parentNode.removeChild(float); }, 1000);
  }

  /* 开始游戏 */
  function startGame() {
    if (isPlaying) return;
    isPlaying = true;
    score = 0;
    timeLeft = 60;
    scoreDisplay.textContent = '得分: 0';
    timeDisplay.textContent = '时间: 60';
    hint.style.display = 'none';
    startBtn.textContent = '演出进行中...';
    startBtn.disabled = true;
    initPuppetPosition();
    handleKeyboardMovement();
    checkCollisions();
    /* 计时 */
    gameTimer = setInterval(() => {
      timeLeft--;
      timeDisplay.textContent = '时间: ' + timeLeft;
      if (timeLeft <= 10) timeDisplay.style.background = '#8b2c2c';
      if (timeLeft <= 0) endGame();
    }, 1000);
    /* 生成目标物 */
    spawnTimer = setInterval(spawnTarget, 600);
  }

  /* 结束游戏 */
  function endGame() {
    isPlaying = false;
    clearInterval(gameTimer);
    clearInterval(spawnTimer);
    /* 清理目标物 */
    targets.forEach(t => { if (t.parentNode) t.parentNode.removeChild(t); });
    targets = [];
    /* 更新最高分 */
    if (score > highScore) {
      highScore = score;
      localStorage.setItem('heritageHighScore', highScore);
      highScoreEl.textContent = highScore;
    }
    startBtn.textContent = '🎭 再演一场';
    startBtn.disabled = false;
    hint.style.display = 'block';
    hint.textContent = '🎉 演出结束！最终得分: ' + score + ' 分';
    timeDisplay.style.background = '#2c1810';
  }

  /* 重置游戏 */
  function resetGame() {
    isPlaying = false;
    clearInterval(gameTimer);
    clearInterval(spawnTimer);
    targets.forEach(t => { if (t.parentNode) t.parentNode.removeChild(t); });
    targets = [];
    score = 0;
    timeLeft = 60;
    scoreDisplay.textContent = '得分: 0';
    timeDisplay.textContent = '时间: 60';
    startBtn.textContent = '开始演出';
    startBtn.disabled = false;
    hint.style.display = 'block';
    hint.textContent = '点击「开始」操控皮影收集祥云 ☁ · 躲避煞风 🌪';
    timeDisplay.style.background = '#2c1810';
    initPuppetPosition();
  }

  startBtn.addEventListener('click', startGame);
  resetBtn.addEventListener('click', resetGame);

  /* 页面加载后初始化皮影位置 */
  window.addEventListener('load', initPuppetPosition);
  window.addEventListener('resize', initPuppetPosition);
})();

/* ============================================
   文创坊 AI 生成器
   ============================================ */
(function() {
  const generateBtn = document.getElementById('generateBtn');
  const output = document.getElementById('generatorOutput');
  const craftSelect = document.getElementById('craftSelect');
  const productSelect = document.getElementById('productSelect');

  /* 颜色选择 */
  let selectedColor = '#8b2c2c,#d4a857';
  document.querySelectorAll('.color-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.color-chip').forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
      selectedColor = chip.dataset.color;
    });
  });
  /* 默认选中第一个 */
  document.querySelector('.color-chip').classList.add('selected');

  /* 非遗工艺对应的符号 */
  const craftSymbols = {
    '青花瓷': ['🏺', '🫖', '🍶'],
    '苏绣双面绣': ['❋', '✿', '❀'],
    '皮影纹样': ['🎭', '👤', '🎪'],
    '剪纸吉祥图案': ['✂', '❀', '✿'],
    '书法墨韵': ['墨', '書', '龍'],
    '京剧脸谱': ['🎭', '👺', '🎪'],
    '唐三彩': ['🐎', '🐫', '🏺'],
    '云锦织造': ['🧵', '✨', '❋']
  };

  /* 设计灵感数据库 */
  const designIdeas = {
    '青花瓷': [
      '以缠枝莲纹为核心元素，融入现代几何构图',
      '青花勾勒的山水图景，配合留白营造东方意境',
      '传统青花纹样与极简主义的碰撞融合'
    ],
    '苏绣双面绣': [
      '以双面异色绣技为灵感，呈现层次丰富的视觉效果',
      '细腻针线纹理，模拟真实绣品的触感',
      '融合牡丹、菊花等传统花卉题材'
    ],
    '皮影纹样': [
      '镂空剪影效果，光影交错呈现皮影精髓',
      '传统戏曲人物造型的扁平化设计',
      '以牛皮镂空的线条感，配合金黄点缀'
    ],
    '剪纸吉祥图案': [
      '窗花样式的对称构图，寓意吉祥如意',
      '喜字、福字等传统吉祥符号的现代演绎',
      '生肖、花鸟题材的剪纸艺术重构'
    ],
    '书法墨韵': [
      '以毛笔笔触为设计语言，墨色浓淡变化',
      '行书的笔意与留白艺术的结合',
      '传统书法的线条美融入现代设计'
    ],
    '京剧脸谱': [
      '以脸谱色彩象征性格，红忠、黑正',
      '夸张的线条勾勒，传统戏曲韵味',
      '角色脸谱的符号化、抽象化设计'
    ],
    '唐三彩': [
      '黄、绿、白三色交融的独特釉彩',
      '唐代陶瓷艺术的色彩与造型灵感',
      '富贵华丽的色彩搭配'
    ],
    '云锦织造': [
      '金线、妆花缎的华丽色彩与光泽',
      '龙凤呈祥等传统吉祥纹样重构',
      '云锦工艺的繁复与精致'
    ]
  };

  generateBtn.addEventListener('click', () => {
    const craft = craftSelect.value;
    const product = productSelect.value;
    const colors = selectedColor.split(',');

    output.innerHTML = `
      <div class="generated-content">
        <div class="design-preview" style="background: linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%);">
          <div class="design-pattern" style="color: ${colors[1]};">
        ${craftSymbols[craft][Math.floor(Math.random() * 3)]}
      </div>
    </div>
    <h3 class="design-title">${craft} × ${product}</h3>
    <p class="design-desc">
      本设计以「${craft}」工艺为灵感源泉，
      提炼其独特的视觉语言与文化内涵，
      将其重新演绎于「${product}」场景中。
      色彩上采用${colors[0]}与${colors[1]}的经典搭配，
      在尊重传统的同时赋予作品全新的时代气息。
    </p>
    <div class="design-ideas">
      <h4>💡 设计亮点</h4>
      <ul>
        ${designIdeas[craft].map(idea => `<li>${idea}</li>`).join('')}
      </ul>
    </div>
    `;
  });

  /* 页面加载时触发生成一次示例 */
  window.addEventListener('load', () => {
    setTimeout(() => generateBtn.click(), 500);
  });
})();

/* ============================================
   问答堂 · 非遗知识问答
   ============================================ */
let currentQuestion = 0;
let quizScore = 0;
let quizAnswered = false;

const quizData = [
  {
    q: '皮影戏是中国最古老的戏剧形式之一，它起源于哪个朝代？',
    options: ['汉朝', '唐朝', '宋朝', '明朝'],
    answer: 0,
    explain: '正确！皮影戏起源于2000多年前的西汉时期，是世界上最早由人配音的活动影画艺术，被誉为"电影的先驱"。'
  },
  {
    q: '景德镇陶瓷以"白如玉、明如镜、薄如纸、声如磬"闻名，景德镇位于中国哪个省份？',
    options: ['浙江省', '江西省', '江苏省', '福建省'],
    answer: 1,
    explain: '正确！景德镇位于江西省东北部，是享誉世界的"千年瓷都"，拥有1700多年的制瓷历史。'
  },
  {
    q: '苏绣是中国四大名绣之一，其最具代表性的技艺特点是？',
    options: ['双面绣', '打籽绣', '乱针绣', '盘金绣'],
    answer: 0,
    explain: '正确！苏绣以"双面绣"最为精妙，正反两面都同样精美，是苏绣艺术的巅峰代表。'
  },
  {
    q: '中国书法被誉为"无言的诗、无形的舞、无图的画、无声的乐"，被称为"书圣"的书法家是？',
    options: ['颜真卿', '柳公权', '欧阳询', '王羲之'],
    answer: 3,
    explain: '正确！王羲之（303-361），东晋著名书法家，被誉为"书圣"，代表作《兰亭序》被誉为"天下第一行书"。'
  },
  {
    q: '昆曲被联合国教科文组织列为"人类口头和非物质文化遗产代表作"，它的发源地是？',
    options: ['北京', '江苏昆山', '浙江杭州', '安徽徽州'],
    answer: 1,
    explain: '正确！昆曲发源于元朝末年的江苏昆山一带，至今已有600多年历史，被誉为"百戏之祖、百戏之师"。'
  },
  {
    q: '剪纸艺术在中国有着悠久历史，传统剪纸中最常见的红色象征着？',
    options: ['财富', '吉祥喜庆', '权力', '长寿'],
    answer: 1,
    explain: '正确！红色在中国传统文化中象征吉祥、喜庆与繁荣，是春节、婚庆等场合的重要装饰。'
  }
];

function initQuiz() {
  currentQuestion = 0;
  quizScore = 0;
  quizAnswered = false;
  showQuestion();
}

function showQuestion() {
  const questionEl = document.getElementById('quizQuestion');
  const optionsEl = document.getElementById('quizOptions');
  const feedbackEl = document.getElementById('quizFeedback');
  const progressFill = document.getElementById('progressFill');
  const indexEl = document.getElementById('qIndex');
  const nextBtn = document.getElementById('nextQBtn');
  const resultEl = document.getElementById('quizResult');
  const quizCard = document.querySelector('.quiz-card');

  /* 如果是第6题（额外题），则调整为显示5题显示完成
  /* 完成5题显示结果 */
  if (currentQuestion >= 5) {
    showQuizResult();
    return;
  }

  quizAnswered = false;
  const q = quizData[currentQuestion];

  /* 显示进度 */
  progressFill.style.width = ((currentQuestion) / 5 * 100) + '%';
  indexEl.textContent = currentQuestion + 1;

  questionEl.textContent = (currentQuestion + 1) + '. ' + q.q;

  optionsEl.innerHTML = '';
  q.options.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.className = 'quiz-option';
    btn.textContent = ' ' + opt;
    btn.addEventListener('click', () => selectAnswer(idx));
    optionsEl.appendChild(btn);
  });

  feedbackEl.classList.remove('show');
  feedbackEl.textContent = '';
  nextBtn.style.display = 'none';
}

function selectAnswer(idx) {
  if (quizAnswered) return;
  quizAnswered = true;

  const q = quizData[currentQuestion];
  const options = document.querySelectorAll('.quiz-option');
  const feedbackEl = document.getElementById('quizFeedback');
  const nextBtn = document.getElementById('nextQBtn');

  options.forEach((opt, i) => {
    opt.disabled = true;
    if (i === q.answer) opt.classList.add('correct');
    if (i === idx && idx !== q.answer) opt.classList.add('wrong');
  });

  if (idx === q.answer) {
    quizScore++;
    feedbackEl.textContent = '✓ ' + q.explain;
    feedbackEl.style.borderLeftColor = '#5d8a5a';
  } else {
    feedbackEl.textContent = '✗ ' + q.explain;
    feedbackEl.style.borderLeftColor = '#8b2c2c';
  }
  feedbackEl.classList.add('show');

  nextBtn.style.display = 'block';
  if (currentQuestion === 4) nextBtn.textContent = '查看结果 →';
}

document.getElementById('nextQBtn').addEventListener('click', () => {
  currentQuestion++;
  showQuestion();
});

document.getElementById('restartQBtn').addEventListener('click', () => {
  initQuiz();
  document.getElementById('quizResult').style.display = 'none';
  document.querySelector('.quiz-card').style.display = 'block';
});

function showQuizResult() {
  const resultEl = document.getElementById('quizResult');
  const quizCard = document.querySelector('.quiz-card');
  const finalScore = document.getElementById('finalScore');
  const resultTitle = document.getElementById('resultTitle');
  const resultText = document.getElementById('resultText');
  const resultCircle = document.getElementById('resultCircle');

  quizCard.style.display = 'none';
  resultEl.style.display = 'block';
  resultEl.style.animation = 'fadeInUp 0.8s ease';

  finalScore.textContent = quizScore;

  /* 环形进度条动画 */
  const percentage = quizScore / 5;
  const circumference = 2 * Math.PI * 45;
  resultCircle.style.strokeDashoffset = circumference * (1 - percentage);

  let title, text;
  if (quizScore === 5) {
    title = '🏆 非遗传承大师';
    text = '满分！你对中华非遗文化有着深厚的了解令人敬佩。每一份了解，都是对千年文化的守护与传承。';
  } else if (quizScore >= 3) {
    title = '📜 文化爱好者';
    text = '不错的成绩！你对非遗有相当的了解。继续探索，让更多人了解中华传统文化之美。';
  } else if (quizScore >= 2) {
    title = '🌱 文化探索者';
    text = '非遗文化博大精深，每一次学习都是新的开始。愿你在文化之旅中发现更多美好。';
  } else {
    title = '🌿 文化初学者';
    text = '没关系，这正是一段美好旅程的开始。非遗的世界等待你去发现与探索。';
  }

  resultTitle.textContent = title;
  resultText.textContent = text;
}

/* ============================================
   百艺馆卡片交互
   ============================================ */
document.querySelectorAll('.heritage-card').forEach(card => {
  card.addEventListener('click', () => {
    card.style.transform = 'scale(0.98)';
    setTimeout(() => {
      card.style.transform = '';
    }, 150);
  });
});

/* ============================================
   滚动出现动画
   ============================================ */
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.heritage-card, .section-header').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(30px)';
  el.style.transition = 'all 0.8s ease';
  observer.observe(el);
});
