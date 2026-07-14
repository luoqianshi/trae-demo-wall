// ===== 状态管理 =====
let currentArtifact = null;
let currentQuizIndex = 0;
let quizScore = 0;
let speechSynthesis = window.speechSynthesis;
let currentUtterance = null;
let isSpeaking = false;

// ===== DOM 元素 =====
const views = {
  home: document.getElementById('home-view'),
  artifact: document.getElementById('artifact-view'),
  quiz: document.getElementById('quiz-view')
};

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', () => {
  initParticles();
  renderArtifactGrid();
  bindEvents();
});

// ===== 粒子背景 =====
function initParticles() {
  const canvas = document.getElementById('particle-canvas');
  const ctx = canvas.getContext('2d');
  let particles = [];
  let animationId = null;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function createParticles() {
    particles = [];
    const count = Math.min(60, Math.floor(window.innerWidth / 20));
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        speedY: Math.random() * 0.3 + 0.1,
        speedX: (Math.random() - 0.5) * 0.2,
        opacity: Math.random() * 0.5 + 0.2
      });
    }
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.y -= p.speedY;
      p.x += p.speedX;
      if (p.y < 0) {
        p.y = canvas.height;
        p.x = Math.random() * canvas.width;
      }
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(201, 162, 39, ${p.opacity})`;
      ctx.fill();
    });
    animationId = requestAnimationFrame(animate);
  }

  resize();
  createParticles();
  animate();

  window.addEventListener('resize', () => {
    resize();
    createParticles();
  });
}

// ===== 渲染文物网格 =====
function renderArtifactGrid() {
  const grid = document.getElementById('artifact-grid');
  grid.innerHTML = artifacts.map(artifact => `
    <div class="artifact-card" data-id="${artifact.id}">
      <img class="card-image" src="${artifact.thumbnail}" alt="${artifact.name}" loading="lazy">
      <div class="card-content">
        <h3 class="card-name">${artifact.name}</h3>
        <div class="card-meta">
          <span class="card-dynasty">${artifact.dynasty}</span>
          <span class="card-year">${artifact.year}</span>
        </div>
      </div>
    </div>
  `).join('');

  grid.querySelectorAll('.artifact-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.id;
      showArtifact(id);
    });
  });
}

// ===== 视图切换 =====
function showView(viewName) {
  Object.values(views).forEach(v => v.classList.remove('active'));
  views[viewName].classList.add('active');
  window.scrollTo(0, 0);
}

// ===== 显示文物详情 =====
function showArtifact(id) {
  currentArtifact = artifacts.find(a => a.id === id);
  if (!currentArtifact) return;

  document.getElementById('nav-title').textContent = currentArtifact.name;
  document.getElementById('nav-dynasty').textContent = currentArtifact.dynasty;
  document.getElementById('artifact-image').src = currentArtifact.image;
  document.getElementById('info-year').textContent = currentArtifact.year;
  document.getElementById('story-text').textContent = currentArtifact.story.text;

  // 渲染时间线
  const timeline = document.getElementById('timeline');
  timeline.innerHTML = currentArtifact.timeline.map(item => `
    <div class="timeline-item">
      <div class="timeline-year">${item.year}</div>
      <div class="timeline-event">${item.event}</div>
      <span class="timeline-era">${item.era}</span>
    </div>
  `).join('');

  // 渲染古籍引文
  const classicsList = document.getElementById('classics-list');
  classicsList.innerHTML = currentArtifact.classics.map(item => `
    <div class="classic-item">
      <div class="classic-source">${item.source}</div>
      <div class="classic-quote">${item.quote}</div>
    </div>
  `).join('');

  // 重置音频状态
  resetAudio();
  showView('artifact');
}

// ===== 音频播放（使用 Web Speech API） =====
function resetAudio() {
  stopSpeech();
  isSpeaking = false;
  updateAudioUI();
}

function toggleSpeech() {
  if (!currentArtifact) return;

  if (isSpeaking) {
    stopSpeech();
    isSpeaking = false;
  } else {
    speak(currentArtifact.story.text);
    isSpeaking = true;
  }
  updateAudioUI();
}

function speak(text) {
  if (!speechSynthesis) return;
  stopSpeech();

  currentUtterance = new SpeechSynthesisUtterance(text);
  currentUtterance.lang = 'zh-CN';
  currentUtterance.rate = 0.9;
  currentUtterance.pitch = 1;

  currentUtterance.onend = () => {
    isSpeaking = false;
    updateAudioUI();
  };

  currentUtterance.onerror = () => {
    isSpeaking = false;
    updateAudioUI();
  };

  speechSynthesis.speak(currentUtterance);
}

function stopSpeech() {
  if (speechSynthesis) {
    speechSynthesis.cancel();
  }
  currentUtterance = null;
}

function updateAudioUI() {
  const playBtn = document.getElementById('play-btn');
  const playIcon = playBtn.querySelector('.play-icon');
  const pauseIcon = playBtn.querySelector('.pause-icon');
  const playText = document.getElementById('play-text');
  const wave = document.getElementById('audio-wave');

  if (isSpeaking) {
    playIcon.classList.add('hidden');
    pauseIcon.classList.remove('hidden');
    playText.textContent = '暂停';
    wave.classList.remove('paused');
  } else {
    playIcon.classList.remove('hidden');
    pauseIcon.classList.add('hidden');
    playText.textContent = '听故事';
    wave.classList.add('paused');
  }
}

// ===== 问答功能 =====
function startQuiz() {
  if (!currentArtifact) return;
  currentQuizIndex = 0;
  quizScore = 0;

  document.getElementById('quiz-dynasty').textContent = currentArtifact.dynasty;
  renderProgressBar();
  showQuestion();

  document.getElementById('question-card').classList.remove('hidden');
  document.getElementById('result-screen').classList.add('hidden');
  showView('quiz');
}

function renderProgressBar() {
  const bar = document.getElementById('progress-bar');
  const total = currentArtifact.quiz.length;
  bar.innerHTML = Array.from({ length: total }, (_, i) => {
    let cls = 'progress-dot';
    if (i === currentQuizIndex) cls += ' active';
    else if (i < currentQuizIndex) {
      const wasCorrect = getAnswerStatus(i);
      cls += wasCorrect ? ' correct' : ' wrong';
    }
    return `<div class="${cls}"></div>`;
  }).join('');
}

// 记录每道题的答题状态
const answerStatus = [];

function getAnswerStatus(index) {
  return answerStatus[index] === true;
}

function showQuestion() {
  const quiz = currentArtifact.quiz[currentQuizIndex];
  document.getElementById('question-number').textContent = `问题 ${currentQuizIndex + 1} / ${currentArtifact.quiz.length}`;
  document.getElementById('question-text').textContent = quiz.question;

  const grid = document.getElementById('options-grid');
  grid.innerHTML = quiz.options.map((opt, idx) => `
    <button class="option-btn" data-index="${idx}">${opt}</button>
  `).join('');

  grid.querySelectorAll('.option-btn').forEach(btn => {
    btn.addEventListener('click', () => handleAnswer(parseInt(btn.dataset.index)));
  });

  document.getElementById('explanation').classList.add('hidden');
  document.getElementById('next-btn').classList.add('hidden');
}

function handleAnswer(selectedIndex) {
  const quiz = currentArtifact.quiz[currentQuizIndex];
  const isCorrect = selectedIndex === quiz.correct;
  answerStatus[currentQuizIndex] = isCorrect;
  if (isCorrect) quizScore++;

  const buttons = document.querySelectorAll('.option-btn');
  buttons.forEach((btn, idx) => {
    btn.disabled = true;
    if (idx === quiz.correct) {
      btn.classList.add('correct');
    } else if (idx === selectedIndex && !isCorrect) {
      btn.classList.add('wrong');
    }
  });

  const explanation = document.getElementById('explanation');
  explanation.textContent = quiz.explanation;
  explanation.classList.remove('hidden');

  const nextBtn = document.getElementById('next-btn');
  nextBtn.classList.remove('hidden');
  nextBtn.textContent = currentQuizIndex < currentArtifact.quiz.length - 1 ? '下一题' : '查看结果';

  renderProgressBar();
}

function nextQuestion() {
  currentQuizIndex++;
  if (currentQuizIndex < currentArtifact.quiz.length) {
    showQuestion();
    renderProgressBar();
  } else {
    showResult();
  }
}

function showResult() {
  document.getElementById('question-card').classList.add('hidden');
  const resultScreen = document.getElementById('result-screen');
  resultScreen.classList.remove('hidden');

  const total = currentArtifact.quiz.length;
  const percentage = Math.round((quizScore / total) * 100);

  document.getElementById('result-score').textContent = `${quizScore} / ${total}`;

  let message = '';
  if (percentage === 100) {
    message = '太棒了！你是真正的文物守护者！🏆';
  } else if (percentage >= 75) {
    message = '表现优秀！你对这件文物很了解呢！👏';
  } else if (percentage >= 50) {
    message = '还不错！再看看故事，下次一定能更好！💪';
  } else {
    message = '别灰心！回到故事页面再听一遍，你一定可以的！📚';
  }
  document.getElementById('result-message').textContent = message;

  // 保存到本地存储
  saveQuizResult(currentArtifact.id, quizScore, total);
}

function saveQuizResult(artifactId, score, total) {
  try {
    const key = `artifact_quiz_${artifactId}`;
    const existing = localStorage.getItem(key);
    const record = { score, total, date: new Date().toISOString() };
    if (!existing || JSON.parse(existing).score < score) {
      localStorage.setItem(key, JSON.stringify(record));
    }
  } catch (e) {
    // 忽略存储错误
  }
}

// ===== 事件绑定 =====
function bindEvents() {
  document.getElementById('back-btn').addEventListener('click', () => {
    stopSpeech();
    showView('home');
  });

  document.getElementById('quiz-back-btn').addEventListener('click', () => {
    showView('artifact');
  });

  document.getElementById('play-btn').addEventListener('click', toggleSpeech);

  document.getElementById('quiz-btn').addEventListener('click', () => {
    answerStatus.length = 0;
    startQuiz();
  });

  document.getElementById('next-btn').addEventListener('click', nextQuestion);

  document.getElementById('restart-btn').addEventListener('click', () => {
    answerStatus.length = 0;
    startQuiz();
  });

  document.getElementById('home-btn').addEventListener('click', () => {
    stopSpeech();
    showView('home');
  });
}
