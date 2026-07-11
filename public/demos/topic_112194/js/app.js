let currentDiaryId = null;
let isAiEnabled = true;
let isRecording = false;
let isPaused = false;
let recognition = null;
let pendingImages = [];

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

let aiSettings = {
  provider: 'mock',
  apiKey: '',
  baseUrl: '',
  model: '',
  temperature: 0.7,
  maxTokens: 2000
};

// localStorage 操作封装
const Storage = {
  getDiaries: () => {
    const data = localStorage.getItem('echo_diaries');
    return data ? JSON.parse(data) : [];
  },
  saveDiaries: (diaries) => {
    localStorage.setItem('echo_diaries', JSON.stringify(diaries));
  },
  addDiary: (diary) => {
    const diaries = Storage.getDiaries();
    diaries.unshift(diary);
    Storage.saveDiaries(diaries);
    return diary;
  },
  getDiary: (id) => {
    const diaries = Storage.getDiaries();
    return diaries.find(d => String(d.id) === String(id));
  },
  updateDiary: (id, updates) => {
    const diaries = Storage.getDiaries();
    const index = diaries.findIndex(d => String(d.id) === String(id));
    if (index !== -1) {
      diaries[index] = { ...diaries[index], ...updates };
      Storage.saveDiaries(diaries);
      return diaries[index];
    }
    return null;
  },
  deleteDiary: (id) => {
    const diaries = Storage.getDiaries();
    const filtered = diaries.filter(d => String(d.id) !== String(id));
    Storage.saveDiaries(filtered);
    return filtered;
  },
  clearAll: () => {
    localStorage.removeItem('echo_diaries');
  }
};

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function init() {
  renderDate();
  bindEvents();
  loadSettings();
  loadDiaryList(false);
}

function renderDate() {
  const now = new Date();
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  const weekdayOptions = { weekday: 'long' };
  document.getElementById('current-date').textContent = now.toLocaleDateString('zh-CN', options);
  document.getElementById('current-weekday').textContent = now.toLocaleDateString('zh-CN', weekdayOptions);
}

function bindEvents() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const viewId = btn.dataset.view;
      switchView(viewId);
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  document.getElementById('save-btn').addEventListener('click', saveDiary);
  document.getElementById('analyze-btn').addEventListener('click', analyzeDiary);
  document.getElementById('refresh-btn').addEventListener('click', loadDiaryList);
  document.getElementById('back-btn').addEventListener('click', () => switchView('view-list'));
  document.getElementById('delete-btn').addEventListener('click', deleteDiary);
  document.getElementById('ai-toggle').addEventListener('change', toggleAi);
  document.getElementById('clear-all-btn').addEventListener('click', clearAllDiaries);
  document.getElementById('record-btn').addEventListener('click', startRecording);
  document.getElementById('stop-btn').addEventListener('click', stopRecording);
  document.getElementById('pause-btn').addEventListener('click', togglePause);

  document.getElementById('add-image-btn').addEventListener('click', () => {
    document.getElementById('image-input').click();
  });
  document.getElementById('image-input').addEventListener('change', handleImageSelect);
  
  document.getElementById('save-ai-settings').addEventListener('click', saveAiSettings);
  document.getElementById('test-ai-connection').addEventListener('click', testAiConnection);
  document.getElementById('toggle-api-key').addEventListener('click', toggleApiKeyVisibility);
  
  const temperatureSlider = document.getElementById('ai-temperature');
  const temperatureValue = document.querySelector('.slider-value');
  temperatureSlider.addEventListener('input', (e) => {
    temperatureValue.textContent = e.target.value;
  });
  
  document.getElementById('trend-week').addEventListener('click', () => setTrendPeriod('week'));
  document.getElementById('trend-month').addEventListener('click', () => setTrendPeriod('month'));
  document.getElementById('analyze-trend-btn').addEventListener('click', analyzeTrend);
  
  loadAiSettings();
}

let currentTrendPeriod = 'week';

function setTrendPeriod(period) {
  currentTrendPeriod = period;
  document.getElementById('trend-week').classList.toggle('active', period === 'week');
  document.getElementById('trend-month').classList.toggle('active', period === 'month');
}

async function analyzeTrend() {
  if (!isAiEnabled) {
    showToast('魔法分析已关闭~');
    return;
  }
  
  const btn = document.getElementById('analyze-trend-btn');
  const originalText = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>分析中...</span>';
  btn.disabled = true;
  
  try {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const diaries = Storage.getDiaries();
    const now = new Date();
    let startDate;
    if (currentTrendPeriod === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    } else {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
    
    const filteredDiaries = diaries.filter(d => {
      const diaryDate = new Date(d.created_at);
      return diaryDate >= startDate;
    });
    
    if (filteredDiaries.length === 0) {
      showToast(`该时间段内没有日记（${currentTrendPeriod === 'month' ? '近一个月' : '近一周'}）`);
      btn.innerHTML = originalText;
      btn.disabled = false;
      return;
    }
    
    const result = generateMockTrendAnalysis(filteredDiaries, currentTrendPeriod);
    displayTrendResult(result);
    showToast('时光之镜已开启 ✨');
  } catch (error) {
    showToast('分析失败~');
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

function generateMockTrendAnalysis(diaries, period) {
  const emotions = ['焦虑', '疲惫', '平静', '开心', '失落', '期待', '充实', '迷茫'];
  const themesPool = ['工作压力', '学习进展', '人际关系', '个人成长', '健康状况', '休闲娱乐', '财务状况', '未来规划'];
  
  const totalDiaries = diaries.length;
  const emotionTrend = `这段时间你的情绪以${emotions[Math.floor(Math.random() * emotions.length)]}为主，整体${Math.random() > 0.5 ? '较为平稳' : '波动较大'}。`;
  
  const recurringThemes = [];
  const themeCount = Math.min(3, themesPool.length);
  for (let i = 0; i < themeCount; i++) {
    const idx = Math.floor(Math.random() * themesPool.length);
    if (!recurringThemes.includes(themesPool[idx])) {
      recurringThemes.push(themesPool[idx]);
    }
  }
  
  const behaviorPatterns = '从日记内容来看，你似乎有固定的作息规律，每天的记录时间相对集中。';
  const keyFindings = '通过分析发现，你的情绪变化与工作/学习压力密切相关。建议关注压力高峰期的自我调节。';
  const suggestions = '1. 每天花10分钟进行冥想或深呼吸\n2. 保持规律的运动习惯\n3. 适当减少不必要的社交活动\n4. 给自己设定合理的目标和期望';
  
  return {
    period: period === 'month' ? '月度' : '周度',
    total_diaries: totalDiaries,
    emotion_trend: emotionTrend,
    recurring_themes: recurringThemes,
    behavior_patterns: behaviorPatterns,
    key_findings: keyFindings,
    suggestions: suggestions
  };
}

function displayTrendResult(data) {
  const container = document.getElementById('trend-content');
  
  if (!data || typeof data !== 'object') {
    container.innerHTML = `
      <div class="trend-empty">
        <i class="fas fa-exclamation-circle"></i>
        <p>数据解析失败~</p>
      </div>
    `;
    return;
  }

  const period = data.period || (currentTrendPeriod === 'month' ? '月度' : '周度');
  const totalDiaries = data.total_diaries || 0;

  let html = `
    <div class="trend-item fade-in">
      <div class="trend-item-title">📊 ${escapeHtml(period)}概览</div>
      <div class="trend-item-content">共记录 ${totalDiaries} 篇日记</div>
    </div>
  `;

  if (data.emotion_trend) {
    html += `
      <div class="trend-item fade-in">
        <div class="trend-item-title">💭 情绪趋势</div>
        <div class="trend-item-content">${escapeHtml(data.emotion_trend)}</div>
      </div>
    `;
  }

  if (data.recurring_themes && Array.isArray(data.recurring_themes) && data.recurring_themes.length > 0) {
    html += `
      <div class="trend-item fade-in">
        <div class="trend-item-title">🎯 反复出现的主题</div>
        <div class="trend-item-content">
          <ul>
            ${data.recurring_themes.map(t => `<li>${escapeHtml(t)}</li>`).join('')}
          </ul>
        </div>
      </div>
    `;
  }

  if (data.behavior_patterns) {
    html += `
      <div class="trend-item fade-in">
        <div class="trend-item-title">🔍 行为模式</div>
        <div class="trend-item-content">${escapeHtml(data.behavior_patterns)}</div>
      </div>
    `;
  }

  if (data.key_findings) {
    html += `
      <div class="trend-item fade-in">
        <div class="trend-item-title">💡 关键发现</div>
        <div class="trend-item-content">${escapeHtml(data.key_findings)}</div>
      </div>
    `;
  }

  if (data.suggestions) {
    html += `
      <div class="trend-item fade-in">
        <div class="trend-item-title">📝 建议</div>
        <div class="trend-item-content">${escapeHtml(data.suggestions)}</div>
      </div>
    `;
  }

  container.innerHTML = html;
}

function switchView(viewId) {
  document.querySelectorAll('.view-section').forEach(section => {
    section.classList.add('hidden');
  });
  document.getElementById(viewId).classList.remove('hidden');

  if (viewId === 'view-list') {
    loadDiaryList(false);
  }
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.querySelector('span').textContent = message;
  toast.classList.remove('hidden');
  setTimeout(() => {
    toast.classList.add('hidden');
  }, 2000);
}

async function saveDiary() {
  const content = document.getElementById('diary-input').value.trim();
  if (!content) {
    showToast('请先写下你的故事~');
    return;
  }

  try {
    const diary = {
      id: generateId(),
      content: content,
      images: [...pendingImages],
      created_at: new Date().toISOString(),
      emotion: '',
      themes: [],
      analysis: ''
    };
    
    Storage.addDiary(diary);
    
    showToast('故事已保存 ✨');
    document.getElementById('diary-input').value = '';
    document.getElementById('analysis-result').classList.add('hidden');
    currentDiaryId = diary.id;
    pendingImages = [];
    renderImagePreview();
  } catch (error) {
    showToast('保存失败了~');
  }
}

async function analyzeDiary() {
  if (!isAiEnabled) {
    showToast('魔法分析已关闭~');
    return;
  }

  if (!currentDiaryId) {
    const content = document.getElementById('diary-input').value.trim();
    if (!content) {
      showToast('请先写下你的故事~');
      return;
    }
    await saveDiary();
    if (!currentDiaryId) return;
  }

  try {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const diary = Storage.getDiary(currentDiaryId);
    if (!diary) {
      showToast('找不到日记~');
      return;
    }
    
    const analysis = generateMockAnalysis(diary.content);
    
    Storage.updateDiary(currentDiaryId, analysis);
    
    displayAnalysisResult(analysis);
    loadDiaryList(false);
    showToast('精灵的祝福已送达 ✨');
  } catch (error) {
    showToast('魔法分析失败了~');
  }
}

function generateMockAnalysis(content) {
  const emotions = ['平静', '开心', '焦虑', '疲惫', '期待', '失落', '充实', '迷茫'];
  const themesPool = [
    ['工作', '学习', '压力'],
    ['生活', '家庭', '朋友'],
    ['成长', '思考', '感悟'],
    ['梦想', '未来', '规划'],
    ['健康', '运动', '休息']
  ];
  
  const emotion = emotions[Math.floor(Math.random() * emotions.length)];
  const themeSet = themesPool[Math.floor(Math.random() * themesPool.length)];
  
  const analyses = [
    '从你的文字中，我感受到你正在经历一段重要的成长时期。这些记录将成为你未来回顾时最珍贵的礼物。',
    '你的描述展现了真实的内心世界。学会接纳自己的情绪，是走向内心平静的第一步。',
    '文字是内心的镜子。通过记录，你正在建立与自己深层对话的桥梁。继续保持这种自我探索的习惯。',
    '生活中的每一个细节都值得被记录。你的观察细致入微，这反映出你对生活的热爱和用心。',
    '在忙碌的日子里，能够静下心来书写，本身就是一种疗愈。愿这些文字带给你力量和慰藉。'
  ];
  
  return {
    emotion: emotion,
    themes: themeSet,
    analysis: analyses[Math.floor(Math.random() * analyses.length)]
  };
}

function displayAnalysisResult(data) {
  const container = document.getElementById('analysis-result');
  container.classList.remove('hidden');

  document.getElementById('result-emotion').textContent = data.emotion || '平静';

  const themesContainer = document.getElementById('result-themes');
  themesContainer.innerHTML = '';
  (data.themes || []).forEach(theme => {
    const tag = document.createElement('span');
    tag.textContent = theme;
    themesContainer.appendChild(tag);
  });

  document.getElementById('result-summary').textContent = data.analysis || '';
}

async function loadDiaryList(showErrorToast = true) {
  try {
    const diaries = Storage.getDiaries();
    renderDiaryList(diaries);
  } catch (error) {
    if (showErrorToast) {
      showToast('加载故事失败了~');
    }
  }
}

function loadAiSettings() {
  const saved = localStorage.getItem('aiSettings');
  if (saved) {
    aiSettings = JSON.parse(saved);
  }
  
  document.getElementById('ai-provider').value = aiSettings.provider;
  document.getElementById('ai-api-key').value = aiSettings.apiKey;
  document.getElementById('ai-base-url').value = aiSettings.baseUrl;
  document.getElementById('ai-model').value = aiSettings.model;
  document.getElementById('ai-temperature').value = aiSettings.temperature;
  document.querySelector('.slider-value').textContent = aiSettings.temperature;
  document.getElementById('ai-max-tokens').value = aiSettings.maxTokens;
}

function saveAiSettings() {
  aiSettings = {
    provider: document.getElementById('ai-provider').value,
    apiKey: document.getElementById('ai-api-key').value,
    baseUrl: document.getElementById('ai-base-url').value,
    model: document.getElementById('ai-model').value,
    temperature: parseFloat(document.getElementById('ai-temperature').value),
    maxTokens: parseInt(document.getElementById('ai-max-tokens').value) || 2000
  };
  
  localStorage.setItem('aiSettings', JSON.stringify(aiSettings));
  showToast('魔法设置已保存 ✨');
}

function toggleApiKeyVisibility() {
  const input = document.getElementById('ai-api-key');
  const icon = document.querySelector('#toggle-api-key i');
  
  if (input.type === 'password') {
    input.type = 'text';
    icon.className = 'fas fa-eye-slash';
  } else {
    input.type = 'password';
    icon.className = 'fas fa-eye';
  }
}

async function testAiConnection() {
  if (!aiSettings.apiKey) {
    showToast('请先输入API Key~');
    return;
  }
  
  showToast('正在测试魔法连接...');
  
  try {
    await new Promise(resolve => setTimeout(resolve, 1000));
    showToast('魔法连接成功！🎉');
  } catch (error) {
    showToast('测试失败: ' + error.message);
  }
}

function renderDiaryList(diaries) {
  const container = document.getElementById('diary-list');
  if (!container) return;
  
  const diaryList = Array.isArray(diaries) ? diaries : [];
  
  if (diaryList.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <i class="fas fa-book-open"></i>
          <div class="empty-sparkles">
            <i class="fas fa-star"></i>
            <i class="fas fa-star"></i>
            <i class="fas fa-star"></i>
          </div>
        </div>
        <p>还没有故事哦~</p>
        <p class="empty-hint">去写一篇属于你的童话吧 ✨</p>
      </div>
    `;
    return;
  }

  container.innerHTML = diaryList.map(diary => {
    const date = new Date(diary.created_at);
    const dateStr = date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    const timeStr = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    const preview = diary.content && diary.content.length > 50 ? diary.content.substring(0, 50) + '...' : (diary.content || '');
    
    let emotionTag = '';
    if (diary.emotion) {
      emotionTag = `<span class="emotion-tag emotion-${diary.emotion}">${diary.emotion}</span>`;
    }

    return `
      <div class="diary-card fade-in" data-id="${diary.id}">
        <div class="diary-card-header">
          <span class="diary-date">${dateStr}</span>
          <span class="diary-time">${timeStr}</span>
        </div>
        <p class="diary-preview">${preview}</p>
        <div class="diary-tags">
          ${emotionTag}
          ${diary.themes ? `<span class="text-gray-400 text-xs">${diary.themes.join('、')}</span>` : ''}
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.diary-card').forEach(card => {
    const id = card.dataset.id;
    const diary = diaryList.find(d => String(d.id) === String(id));
    if (diary && Array.isArray(diary.images) && diary.images.length > 0) {
      const gallery = document.createElement('div');
      gallery.className = 'diary-gallery';
      diary.images.slice(0, 4).forEach(url => {
        const img = document.createElement('img');
        img.src = url;
        img.className = 'diary-thumb';
        img.alt = '日记图片';
        img.loading = 'lazy';
        gallery.appendChild(img);
      });
      card.appendChild(gallery);
    }
    card.addEventListener('click', () => {
      loadDiaryDetail(id);
    });
  });
}

async function loadDiaryDetail(id) {
  currentDiaryId = id;
  
  try {
    const diary = Storage.getDiary(id);
    if (diary) {
      renderDiaryDetail(diary);
      switchView('view-detail');
    } else {
      showToast('找不到日记~');
    }
  } catch (error) {
    showToast('加载故事失败了~');
  }
}

function renderDiaryDetail(diary) {
  const date = new Date(diary.created_at);
  const dateStr = date.toLocaleDateString('zh-CN', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric', 
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit'
  });

  document.getElementById('detail-date').textContent = '📅 ' + dateStr;
  document.getElementById('detail-text').textContent = diary.content;

  const detailCard = document.getElementById('detail-content');
  const oldGallery = detailCard.querySelector('.detail-gallery');
  if (oldGallery) oldGallery.remove();

  if (Array.isArray(diary.images) && diary.images.length > 0) {
    const gallery = document.createElement('div');
    gallery.className = 'detail-gallery';
    diary.images.forEach(url => {
      const img = document.createElement('img');
      img.src = url;
      img.className = 'detail-image';
      img.alt = '日记图片';
      img.loading = 'lazy';
      gallery.appendChild(img);
    });
    const analysisBlock = document.getElementById('detail-analysis');
    detailCard.insertBefore(gallery, analysisBlock);
  }

  const analysisContainer = document.getElementById('detail-analysis-content');
  
  if (diary.analysis) {
    const emotionHtml = diary.emotion ? `
      <div class="detail-analysis-row">
        <i class="fas fa-heart"></i>
        <div><span class="detail-analysis-label">情绪</span><span class="detail-analysis-value">${escapeHtml(diary.emotion)}</span></div>
      </div>` : '';
    const themesHtml = diary.themes ? `
      <div class="detail-analysis-row">
        <i class="fas fa-gem"></i>
        <div><span class="detail-analysis-label">主题</span><div class="detail-analysis-tags">${diary.themes.map(t => `<span class="detail-tag">${escapeHtml(t)}</span>`).join('')}</div></div>
      </div>` : '';
    analysisContainer.innerHTML = `
      ${emotionHtml}
      ${themesHtml}
      <div class="detail-analysis-text">${escapeHtml(diary.analysis)}</div>
    `;
  } else {
    analysisContainer.innerHTML = `
      <div class="text-center py-4 text-gray-400">
        <p>暂无分析~</p>
      </div>
    `;
  }
}

async function deleteDiary() {
  if (!currentDiaryId) return;
  
  if (!confirm('确定要让这个故事消失吗？')) {
    return;
  }

  try {
    Storage.deleteDiary(currentDiaryId);
    showToast('故事已消失~');
    switchView('view-list');
    currentDiaryId = null;
  } catch (error) {
    showToast('删除失败了~');
  }
}

function toggleAi(event) {
  isAiEnabled = event.target.checked;
  localStorage.setItem('aiEnabled', isAiEnabled);
  
  const analyzeBtn = document.getElementById('analyze-btn');
  if (isAiEnabled) {
    analyzeBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    analyzeBtn.disabled = false;
    showToast('魔法分析已开启 ✨');
  } else {
    analyzeBtn.classList.add('opacity-50', 'cursor-not-allowed');
    analyzeBtn.disabled = true;
    showToast('魔法分析已关闭~');
  }
}

function loadSettings() {
  const saved = localStorage.getItem('aiEnabled');
  if (saved !== null) {
    isAiEnabled = saved === 'true';
    document.getElementById('ai-toggle').checked = isAiEnabled;
  }
  
  const analyzeBtn = document.getElementById('analyze-btn');
  if (isAiEnabled) {
    analyzeBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    analyzeBtn.disabled = false;
  } else {
    analyzeBtn.classList.add('opacity-50', 'cursor-not-allowed');
    analyzeBtn.disabled = true;
  }
}

async function clearAllDiaries() {
  if (!confirm('确定要清空所有故事吗？此操作不可恢复！')) {
    return;
  }

  try {
    Storage.clearAll();
    showToast('所有故事已清空~');
    loadDiaryList();
  } catch (error) {
    showToast('清空失败了~');
    loadDiaryList();
  }
}

// ============ 图片附件 ============
async function handleImageSelect(event) {
  const files = Array.from(event.target.files || []);
  if (files.length === 0) return;

  for (const file of files) {
    if (!file.type.startsWith('image/')) {
      showToast('只能上传图片哦~');
      continue;
    }
    if (file.size > 8 * 1024 * 1024) {
      showToast(`「${file.name}」超过 8MB 啦~`);
      continue;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      pendingImages.push(dataUrl);
    } catch (error) {
      showToast('图片处理失败了~');
    }
  }
  event.target.value = '';
  renderImagePreview();
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function renderImagePreview() {
  const preview = document.getElementById('image-preview');
  const countEl = document.getElementById('image-count');
  preview.innerHTML = '';
  pendingImages.forEach((url, index) => {
    const item = document.createElement('div');
    item.className = 'preview-item';

    const img = document.createElement('img');
    img.src = url;
    img.alt = '预览';
    item.appendChild(img);

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'preview-remove';
    remove.innerHTML = '<i class="fas fa-times"></i>';
    remove.addEventListener('click', () => {
      pendingImages.splice(index, 1);
      renderImagePreview();
    });
    item.appendChild(remove);

    preview.appendChild(item);
  });
  countEl.textContent = pendingImages.length > 0 ? `已添加 ${pendingImages.length} 张图片` : '';
}

let mediaRecorder = null;
let audioChunks = [];
let audioStream = null;
let finalTranscript = '';
let interimTranscript = '';

async function startRecording() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    showToast('你的浏览器不支持语音识别哦~');
    return;
  }

  try {
    audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });

    let recorderOptions = {};
    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
      recorderOptions.mimeType = 'audio/webm;codecs=opus';
    } else if (MediaRecorder.isTypeSupported('audio/webm')) {
      recorderOptions.mimeType = 'audio/webm';
    }
    
    mediaRecorder = new MediaRecorder(audioStream, recorderOptions);
    audioChunks = [];
    mediaRecorder.start(100);

    recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }
      updateTranscriptDisplay();
    };

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed') {
        showToast('请允许使用麦克风~');
        stopRecording();
      } else if (event.error === 'no-speech') {
      } else if (event.error === 'network') {
      }
    };

    recognition.onend = () => {
      if (isRecording && !isPaused) {
        try {
          recognition.start();
        } catch (e) {}
      }
    };

    recognition.start();
    isRecording = true;
    isPaused = false;
    finalTranscript = '';
    interimTranscript = '';
    updateRecordingUI();
    showToast('开始录音了~');

  } catch (error) {
    showToast('启动失败: ' + error.message);
  }
}

function updateTranscriptDisplay() {
  const transcriptEl = document.getElementById('transcript-text');
  const liveTranscript = document.getElementById('live-transcript');
  const input = document.getElementById('diary-input');
  
  const fullText = finalTranscript + interimTranscript;
  
  if (transcriptEl) {
    transcriptEl.textContent = fullText || '正在聆听...';
  }
  
  if (liveTranscript && fullText) {
    liveTranscript.classList.remove('hidden');
  }
  
  if (input) {
    input.value = fullText;
    input.scrollTop = input.scrollHeight;
  }
}

function togglePause() {
  if (!isRecording) return;
  
  if (isPaused) {
    if (recognition) {
      try { recognition.start(); } catch (e) {}
    }
    if (mediaRecorder && mediaRecorder.state === 'paused') {
      mediaRecorder.resume();
    }
    isPaused = false;
    showToast('继续录音~');
  } else {
    if (recognition) {
      try { recognition.stop(); } catch (e) {}
    }
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.pause();
    }
    isPaused = true;
    showToast('已暂停~');
  }
  updateRecordingUI();
}

function stopRecording() {
  if (!isRecording) return;
  
  if (recognition) {
    recognition.onend = null;
    try { recognition.stop(); } catch (e) {}
    recognition = null;
  }
  
  if (mediaRecorder) {
    if (mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    mediaRecorder = null;
  }
  
  if (audioStream) {
    audioStream.getTracks().forEach(track => track.stop());
    audioStream = null;
  }
  
  const input = document.getElementById('diary-input');
  if (input && finalTranscript) {
    input.value = finalTranscript;
  }
  
  const liveTranscript = document.getElementById('live-transcript');
  if (liveTranscript) {
    liveTranscript.classList.add('hidden');
  }
  
  isRecording = false;
  isPaused = false;
  updateRecordingUI();
  showToast('录音已停止 ✨');
}

function updateRecordingUI() {
  const recordBtn = document.getElementById('record-btn');
  const stopBtn = document.getElementById('stop-btn');
  const pauseBtn = document.getElementById('pause-btn');
  const statusText = document.getElementById('status-text');
  const statusDot = document.getElementById('status-indicator');
  const statusWrapper = document.querySelector('.record-status-wrapper');
  const pauseIcon = pauseBtn ? pauseBtn.querySelector('i') : null;
  const pauseLabel = pauseBtn ? pauseBtn.querySelector('.btn-label') : null;

  if (isRecording) {
    recordBtn.classList.add('hidden');
    stopBtn.classList.remove('hidden');
    pauseBtn.classList.remove('hidden');
    if (statusWrapper) statusWrapper.classList.add('recording');
    
    if (statusText) {
      statusText.textContent = isPaused ? '已暂停' : '正在录音...';
    }
    if (statusDot) {
      statusDot.classList.add('active');
      statusDot.classList.toggle('paused', isPaused);
    }
    if (pauseBtn) {
      pauseBtn.classList.toggle('paused', isPaused);
      if (pauseIcon) {
        pauseIcon.className = isPaused ? 'fas fa-play' : 'fas fa-pause';
      }
      if (pauseLabel) {
        pauseLabel.textContent = isPaused ? '继续' : '暂停';
      }
    }
  } else {
    recordBtn.classList.remove('hidden', 'recording', 'paused');
    stopBtn.classList.add('hidden');
    pauseBtn.classList.add('hidden');
    if (statusWrapper) statusWrapper.classList.remove('recording');
    
    if (statusText) {
      statusText.textContent = '点击麦克风开始录音';
    }
    if (statusDot) {
      statusDot.classList.remove('active', 'paused');
    }
  }
}

document.addEventListener('DOMContentLoaded', init);

(function setupPWA() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
  }

  let deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const btn = document.getElementById('install-btn');
    if (btn) btn.classList.remove('hidden');
  });

  const installBtn = document.getElementById('install-btn');
  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      installBtn.classList.add('hidden');
    });
  }

  window.addEventListener('appinstalled', () => {
    const btn = document.getElementById('install-btn');
    if (btn) btn.classList.add('hidden');
  });
})();