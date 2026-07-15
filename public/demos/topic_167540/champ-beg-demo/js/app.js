// CHAMP BEG - App Logic (Enhanced)

// ========== NAVIGATION ==========
function navigate(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const target = document.getElementById('page-' + page);
  if (target) {
    target.classList.add('active');
    target.scrollTop = 0;
  }

  const nav = document.querySelector('.nav-item[data-page="' + page + '"]');
  if (nav) nav.classList.add('active');

  document.querySelector('.content').scrollTop = 0;
}

// ========== WINDOW CONTROLS (mock) ==========
function minimizeWindow() {
  alert('最小化窗口（演示效果）');
}
function maximizeWindow() {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    document.documentElement.requestFullscreen();
  }
}
function closeWindow() {
  if (confirm('确定要关闭 CHAMP BEG 吗？\n\n期待下次再见！👋')) {
    window.close();
  }
}

// ========== FEYNMAN PROBLEM ==========
function loadSampleProblem() {
  document.getElementById('problem-text').value =
    '已知函数 f(x) = x² - 2x + 3，求其在区间 [0, 3] 上的最大值和最小值。';
}

function clearProblem() {
  document.getElementById('problem-text').value = '';
}

function startFeynman() {
  const text = document.getElementById('problem-text').value.trim();
  if (!text) {
    showToast('请先输入题目内容');
    return;
  }
  document.getElementById('problem-input-area').style.display = 'none';
  document.getElementById('problem-guide-area').style.display = 'block';
  resetSteps();
}

function resetSteps() {
  [1, 2, 3, 4].forEach(i => {
    document.getElementById('step-' + i).className = i === 1 ? 'step active' : 'step';
    document.getElementById('step-content-' + i).style.display = i === 1 ? 'block' : 'none';
    const line = document.getElementById('line-' + (i - 1));
    if (line) line.classList.remove('completed');
  });
  document.getElementById('feynman-result').style.display = 'none';
  document.getElementById('feynman-answer').value = '';
}

function nextStep(n) {
  const prev = n - 1;
  document.getElementById('step-' + prev).className = 'step completed';
  document.getElementById('step-' + n).className = 'step active';
  document.getElementById('step-content-' + prev).style.display = 'none';
  const nextContent = document.getElementById('step-content-' + n);
  nextContent.style.display = 'block';
  nextContent.style.animation = 'fadeIn 0.3s ease';

  const line = document.getElementById('line-' + prev);
  if (line) line.classList.add('completed');
}

function prevStep(n) {
  document.getElementById('step-' + (n + 1)).className = 'step';
  document.getElementById('step-' + n).className = 'step active';
  document.getElementById('step-content-' + (n + 1)).style.display = 'none';
  const prevContent = document.getElementById('step-content-' + n);
  prevContent.style.display = 'block';
  prevContent.style.animation = 'fadeIn 0.3s ease';

  const line = document.getElementById('line-' + n);
  if (line) line.classList.remove('completed');
}

function showHint(step) {
  const hints = {
    step1: '提示：二次函数的图像是抛物线，对称轴公式是 x = -b/(2a)。先试着自己画一下图像的大概形状吧~'
  };
  showToast(hints[step] || '提示功能开发中...');
}

function showAnswerTip() {
  const ans = document.getElementById('feynman-answer');
  if (ans.value) return;
  ans.placeholder = '示范：我先把函数配方成 (x-1)² + 2，发现对称轴在 x=1。因为 a=1>0 开口向上，所以顶点就是最小值点 f(1)=2。然后看区间端点 f(0)=3，f(3)=6。比较后最大值是6，最小值是2。';
  showToast('已显示示范，试着用自己的话复述一遍吧');
}

function submitFeynman() {
  const ans = document.getElementById('feynman-answer').value.trim();
  if (!ans) {
    showToast('请先输入你的复述');
    return;
  }
  const result = document.getElementById('feynman-result');
  result.style.display = 'block';
  result.style.animation = 'scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
}

function resetProblem() {
  document.getElementById('problem-input-area').style.display = 'block';
  document.getElementById('problem-guide-area').style.display = 'none';
  document.getElementById('problem-text').value = '';
  showToast('已重置，试试新的题目吧！');
}

function addToMistakes() {
  showToast('已加入错题本，记得复习哦~');
}

// ========== EMOTION ==========
let wrongCount = 0;
let stayTime = 0;
let breathingInterval = null;

function triggerEmotion(type) {
  const face = document.getElementById('emotion-face');
  const status = document.getElementById('emotion-status');
  const desc = document.getElementById('emotion-desc');
  const statWrong = document.getElementById('stat-wrong');
  const statTime = document.getElementById('stat-time');
  const statStrategy = document.getElementById('stat-strategy');
  const breathingCard = document.getElementById('breathing-card');
  const cognitiveCard = document.getElementById('cognitive-card');

  if (breathingInterval) {
    clearInterval(breathingInterval);
    breathingInterval = null;
  }
  breathingCard.style.display = 'none';
  cognitiveCard.style.display = 'none';
  face.classList.remove('anxious');

  switch (type) {
    case 'wrong':
      wrongCount++;
      stayTime += 2;
      face.innerHTML = '&#128533;';
      status.textContent = '轻微困惑';
      desc.textContent = `连续答错 ${wrongCount} 次，AI 已降低题目难度，提供更多提示。`;
      statStrategy.textContent = '降难提示';
      showToast('检测到困惑，已切换到降难模式 💡');
      break;
    case 'frustrated':
      wrongCount = 3;
      stayTime = 12;
      face.innerHTML = '&#128547;';
      status.textContent = '挫败感 detected';
      desc.textContent = '连续答错 3 次，停留超过 10 分钟。AI 切换鼓励策略，提供分步拆解。';
      statStrategy.textContent = '鼓励拆解';
      cognitiveCard.style.display = 'block';
      showToast('检测到挫败情绪，启动认知重构 🫂');
      break;
    case 'anxious':
      wrongCount = 5;
      stayTime = 18;
      face.innerHTML = '&#128555;';
      face.classList.add('anxious');
      status.textContent = '高度焦虑';
      desc.textContent = '检测到高频错误和长时间停滞，启动情绪干预。';
      statStrategy.textContent = '情绪干预';
      breathingCard.style.display = 'block';
      startBreathing();
      showToast('焦虑情绪 detected，来做个深呼吸吧 🌿');
      break;
    case 'reset':
      wrongCount = 0;
      stayTime = 0;
      face.innerHTML = '&#128522;';
      status.textContent = '状态平稳 · 专注学习中';
      desc.textContent = '连续答题正常，未检测到明显情绪波动。继续保持！';
      statStrategy.textContent = '标准模式';
      showToast('状态已重置，继续加油！✨');
      break;
  }

  statWrong.textContent = wrongCount;
  statTime.textContent = stayTime;
}

function startBreathing() {
  const circle = document.getElementById('breathing-circle');
  let inhale = true;
  circle.textContent = '吸气';
  circle.className = 'breathing-circle inhale';

  breathingInterval = setInterval(() => {
    inhale = !inhale;
    if (inhale) {
      circle.textContent = '吸气';
      circle.className = 'breathing-circle inhale';
    } else {
      circle.textContent = '呼气';
      circle.className = 'breathing-circle exhale';
    }
  }, 4000);
}

// ========== VIDEO ==========
let isPlaying = false;
let videoTimer = null;
let currentTime = 0;
const totalTime = 272; // 4:32

function togglePlay() {
  const btn = document.getElementById('play-btn');
  const player = document.getElementById('video-player');

  if (isPlaying) {
    isPlaying = false;
    btn.textContent = '播放';
    player.innerHTML = '<div class="play-icon">&#9654;</div>';
    clearInterval(videoTimer);
  } else {
    isPlaying = true;
    btn.textContent = '暂停';
    player.innerHTML = '<span style="font-size: 20px; letter-spacing: 4px;">&#9646; &#9646;</span>';
    videoTimer = setInterval(() => {
      currentTime++;
      if (currentTime >= totalTime) {
        currentTime = 0;
        togglePlay();
        return;
      }
      updateVideoUI();
      updateSubtitleHighlight();
    }, 1000);
  }
}

function updateVideoUI() {
  const progress = document.getElementById('video-progress');
  const timeLabel = document.getElementById('video-time');
  progress.value = (currentTime / totalTime) * 100;
  timeLabel.textContent = formatTime(currentTime) + ' / 04:32';
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

function jumpTo(seconds) {
  currentTime = seconds;
  updateVideoUI();
  updateSubtitleHighlight();
}

function updateSubtitleHighlight() {
  document.querySelectorAll('.subtitle-line').forEach(line => {
    const t = parseInt(line.dataset.time);
    const next = line.nextElementSibling;
    const nextT = next ? parseInt(next.dataset.time) : totalTime;
    if (currentTime >= t && currentTime < nextT) {
      if (!line.classList.contains('active')) {
        line.classList.add('active');
        line.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    } else {
      line.classList.remove('active');
    }
  });
}

const progressBar = document.getElementById('video-progress');
if (progressBar) {
  progressBar.addEventListener('input', (e) => {
    currentTime = Math.floor((e.target.value / 100) * totalTime);
    updateVideoUI();
    updateSubtitleHighlight();
  });
}

// ========== TOAST NOTIFICATION ==========
function showToast(message) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.style.cssText = `
      position: fixed;
      bottom: 32px;
      left: 50%;
      transform: translateX(-50%) translateY(20px);
      background: rgba(10, 10, 10, 0.9);
      color: #fff;
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 13px;
      z-index: 9999;
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      pointer-events: none;
      backdrop-filter: blur(10px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.opacity = '1';
  toast.style.transform = 'translateX(-50%) translateY(0)';

  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(20px)';
  }, 2000);
}

// ========== VOCABULARY ==========
const vocabData = {
  perseverance: {
    word: 'perseverance',
    phonetic: '/ˌpɜːrsəˈvɪrəns/',
    pos: 'n.',
    definition: '坚持不懈；不屈不挠',
    examples: [
      'Success requires hard work and perseverance.',
      'Her perseverance finally paid off when she got accepted into college.'
    ],
    examplesZh: [
      '成功需要努力和坚持不懈。',
      '她的坚持不懈最终得到了回报，被大学录取了。'
    ]
  },
  diligence: {
    word: 'diligence',
    phonetic: '/ˈdɪlɪdʒəns/',
    pos: 'n.',
    definition: '勤奋；用功',
    examples: [
      'His diligence in studying earned him top grades.',
      'The company rewards diligence and dedication.'
    ],
    examplesZh: [
      '他学习勤奋，成绩名列前茅。',
      '公司奖励勤奋和敬业精神。'
    ]
  },
  curiosity: {
    word: 'curiosity',
    phonetic: '/ˌkjʊriˈɒsəti/',
    pos: 'n.',
    definition: '好奇心；求知欲',
    examples: [
      'Children have a natural curiosity about the world.',
      'His curiosity led him to explore new places.'
    ],
    examplesZh: [
      '孩子们对世界有着天生的好奇心。',
      '他的好奇心促使他探索新地方。'
    ]
  },
  resilience: {
    word: 'resilience',
    phonetic: '/rɪˈzɪliəns/',
    pos: 'n.',
    definition: '韧性；恢复力；适应力',
    examples: [
      'She showed great resilience in the face of adversity.',
      'The community demonstrated remarkable resilience after the disaster.'
    ],
    examplesZh: [
      '她在逆境中表现出了极大的韧性。',
      '灾难过后，社区展现出了非凡的恢复力。'
    ]
  },
  determination: {
    word: 'determination',
    phonetic: '/dɪˌtɜːrmɪˈneɪʃn/',
    pos: 'n.',
    definition: '决心；坚定；决断力',
    examples: [
      'With determination, she overcame all obstacles.',
      'His determination to succeed inspired everyone around him.'
    ],
    examplesZh: [
      '凭着决心，她克服了所有障碍。',
      '他成功的决心鼓舞了周围的每一个人。'
    ]
  },
  innovation: {
    word: 'innovation',
    phonetic: '/ˌɪnəˈveɪʃn/',
    pos: 'n.',
    definition: '创新；革新；新方法',
    examples: [
      'Innovation is the key to staying competitive.',
      'The company is known for its technological innovation.'
    ],
    examplesZh: [
      '创新是保持竞争力的关键。',
      '这家公司以技术创新闻名。'
    ]
  },
  collaboration: {
    word: 'collaboration',
    phonetic: '/kəˌlæbəˈreɪʃn/',
    pos: 'n.',
    definition: '合作；协作',
    examples: [
      'Successful projects require close collaboration.',
      'International collaboration is essential for solving global problems.'
    ],
    examplesZh: [
      '成功的项目需要密切合作。',
      '国际合作对于解决全球问题至关重要。'
    ]
  },
  discipline: {
    word: 'discipline',
    phonetic: '/ˈdɪsəplɪn/',
    pos: 'n.',
    definition: '自律；纪律；训练',
    examples: [
      'Discipline is necessary for achieving long-term goals.',
      'He maintained strict discipline in his daily routine.'
    ],
    examplesZh: [
      '自律对于实现长期目标是必要的。',
      '他在日常生活中保持严格的自律。'
    ]
  }
};

let selectedWords = [];
const maxSelection = 5;

document.addEventListener('DOMContentLoaded', () => {
  const homeCards = document.querySelectorAll('.home-card');
  homeCards.forEach((card, i) => {
    card.style.animationDelay = (i * 0.05) + 's';
  });

  const vocabItems = document.querySelectorAll('.vocab-item');
  vocabItems.forEach(item => {
    item.addEventListener('click', () => {
      const word = item.dataset.word;
      toggleWordSelection(word, item);
      showWordDetail(word);
    });
  });
});

function toggleWordSelection(word, element) {
  const index = selectedWords.indexOf(word);
  if (index > -1) {
    selectedWords.splice(index, 1);
    element.classList.remove('selected');
  } else {
    if (selectedWords.length >= maxSelection) {
      showToast(`最多选择 ${maxSelection} 个单词`);
      return;
    }
    selectedWords.push(word);
    element.classList.add('selected');
  }
  updateSelectedTags();
}

function showWordDetail(word) {
  const data = vocabData[word];
  if (!data) return;

  const detail = document.getElementById('word-detail');
  let html = `
    <div class="word-detail-card">
      <div class="word-title">${data.word}</div>
      <div class="word-phonetic">${data.phonetic}</div>
      <span class="word-pos">${data.pos}</span>
      <div class="word-definition"><strong>释义：</strong>${data.definition}</div>
      <div style="font-size: 12px; color: var(--gray-500); margin-bottom: 8px;">例句：</div>
  `;
  data.examples.forEach((ex, i) => {
    html += `
      <div class="word-example">${ex}</div>
      <div class="word-example" style="font-style: normal; border-color: var(--gray-400);">${data.examplesZh[i]}</div>
    `;
  });
  html += '</div>';
  detail.innerHTML = html;
}

function updateSelectedTags() {
  const count = document.getElementById('selected-count');
  const tags = document.getElementById('selected-tags');
  count.textContent = selectedWords.length;
  
  tags.innerHTML = '';
  selectedWords.forEach(word => {
    const tag = document.createElement('div');
    tag.className = 'selected-tag';
    tag.innerHTML = `${word} <span class="remove-btn" onclick="removeWord('${word}')">×</span>`;
    tags.appendChild(tag);
  });
}

function removeWord(word) {
  const index = selectedWords.indexOf(word);
  if (index > -1) {
    selectedWords.splice(index, 1);
    const item = document.querySelector(`.vocab-item[data-word="${word}"]`);
    if (item) item.classList.remove('selected');
    updateSelectedTags();
  }
}

function clearSelection() {
  selectedWords = [];
  document.querySelectorAll('.vocab-item').forEach(item => item.classList.remove('selected'));
  document.getElementById('word-detail').innerHTML = '<p style="text-align: center; color: var(--gray-500); padding: 40px 0;">选择一个单词查看详情</p>';
  updateSelectedTags();
  document.getElementById('article-section').style.display = 'none';
  document.getElementById('dictation-section').style.display = 'none';
}

function generateArticle() {
  if (selectedWords.length === 0) {
    showToast('请先选择至少一个单词');
    return;
  }

  const enText = `In today's fast-paced world, achieving success requires more than just talent. It demands ${selectedWords[0]} - the ability to keep going even when things get tough. Combined with ${selectedWords[1] || 'diligence'}, this creates a powerful foundation for growth. 

${selectedWords[2] || 'Curiosity'} fuels our desire to learn and explore, pushing us beyond our comfort zones. When challenges arise, ${selectedWords[3] || 'resilience'} helps us bounce back stronger. True achievement also requires ${selectedWords[4] || 'determination'} - the unwavering focus on our goals.

Remember, ${selectedWords[0]} is not about never failing, but about never giving up. Embrace these qualities, and you'll unlock your full potential.`;

  const zhText = `在当今快节奏的世界里，取得成功不仅仅需要天赋。它需要${vocabData[selectedWords[0]]?.definition || '坚持不懈'}——即使遇到困难也要坚持下去的能力。加上${vocabData[selectedWords[1]]?.definition || vocabData.diligence.definition}，这构成了成长的强大基础。

${vocabData[selectedWords[2]]?.definition || vocabData.curiosity.definition}激发我们学习和探索的欲望，推动我们超越舒适区。当挑战出现时，${vocabData[selectedWords[3]]?.definition || vocabData.resilience.definition}帮助我们更强大地反弹。真正的成就还需要${vocabData[selectedWords[4]]?.definition || vocabData.determination.definition}——对目标的坚定专注。

记住，${vocabData[selectedWords[0]]?.definition}不是从不失败，而是永不放弃。拥抱这些品质，你将释放全部潜能。`;

  document.getElementById('article-en').textContent = enText;
  document.getElementById('article-zh').textContent = zhText;
  document.getElementById('article-section').style.display = 'block';
  document.getElementById('article-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
  document.getElementById('dictation-section').style.display = 'none';
  showToast('文章已生成！先阅读理解，再点击"开始挖空默写练习"');
}

function regenerateArticle() {
  generateArticle();
}

let dictationAnswers = [];

function startDictation() {
  const enText = document.getElementById('article-en').textContent;
  let blankText = enText;
  dictationAnswers = [];

  selectedWords.forEach(word => {
    const regex = new RegExp(word, 'gi');
    blankText = blankText.replace(regex, `<input type="text" class="dictation-blank" data-answer="${word}" placeholder="____">`);
    dictationAnswers.push(word);
  });

  const content = document.getElementById('dictation-content');
  content.innerHTML = `
    <div style="padding: 16px; background: var(--gray-50); border-radius: var(--radius-md); margin-bottom: 16px;">
      ${blankText}
    </div>
    <div style="font-size: 12px; color: var(--gray-500);">提示：填写被挖空的单词，不区分大小写</div>
  `;

  document.getElementById('dictation-section').style.display = 'block';
  document.getElementById('dictation-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
  document.getElementById('dictation-result').style.display = 'none';
}

function checkDictation() {
  const blanks = document.querySelectorAll('.dictation-blank');
  let correctCount = 0;
  
  blanks.forEach(blank => {
    const answer = blank.dataset.answer.toLowerCase();
    const userInput = blank.value.trim().toLowerCase();
    blank.disabled = true;
    
    if (userInput === answer) {
      blank.classList.add('correct');
      blank.classList.remove('incorrect');
      correctCount++;
    } else {
      blank.classList.add('incorrect');
      blank.classList.remove('correct');
      blank.placeholder = answer;
    }
  });

  const result = document.getElementById('dictation-result');
  const feedback = document.getElementById('result-feedback');
  result.style.display = 'block';

  const total = blanks.length;
  const percent = Math.round((correctCount / total) * 100);
  
  if (percent === 100) {
    feedback.style.cssText = 'background: #f0fdf4; border-color: #bbf7d0;';
    feedback.innerHTML = `
      <p style="color: #166534; font-weight: 600; margin-bottom: 8px;">&#9989; 太棒了！全部正确！</p>
      <p style="color: #166534; font-size: 13px; margin: 0;">你已经掌握了这些单词在语境中的用法，继续保持！</p>
    `;
  } else if (percent >= 60) {
    feedback.style.cssText = 'background: #fffbeb; border-color: #fde68a;';
    feedback.innerHTML = `
      <p style="color: #92400e; font-weight: 600; margin-bottom: 8px;">&#128170; 不错！${correctCount}/${total} 正确</p>
      <p style="color: #92400e; font-size: 13px; margin: 0;">再复习一下错的单词，下次一定能全对！</p>
    `;
  } else {
    feedback.style.cssText = 'background: #fef2f2; border-color: #fecaca;';
    feedback.innerHTML = `
      <p style="color: #991b1b; font-weight: 600; margin-bottom: 8px;">&#128221; 需要多加练习：${correctCount}/${total} 正确</p>
      <p style="color: #991b1b; font-size: 13px; margin: 0;">建议先重读文章，理解单词在语境中的含义，再重新练习。</p>
    `;
  }
}

function showAnswers() {
  const blanks = document.querySelectorAll('.dictation-blank');
  blanks.forEach(blank => {
    blank.value = blank.dataset.answer;
    blank.classList.add('correct');
    blank.disabled = true;
  });
}

function resetDictation() {
  const blanks = document.querySelectorAll('.dictation-blank');
  blanks.forEach(blank => {
    blank.value = '';
    blank.disabled = false;
    blank.classList.remove('correct', 'incorrect');
    blank.placeholder = '____';
  });
  document.getElementById('dictation-result').style.display = 'none';
}

// ========== STAGGER ANIMATION ON PAGE LOAD ==========
document.addEventListener('DOMContentLoaded', () => {
  const homeCards = document.querySelectorAll('.home-card');
  homeCards.forEach((card, i) => {
    card.style.animationDelay = (i * 0.05) + 's';
  });
});
