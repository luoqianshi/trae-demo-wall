// ============================================================
// AI 声境 - 完整核心逻辑
// 包含：音频引擎 + 情绪算法 + 场景库 + 定时器 + 收藏 + 历史
// ============================================================

// ============================================================
// 1. 场景库数据（8 个精选场景，按 4 类分组）
// ============================================================
const SCENE_LIBRARY = [
  {
    id: 'rainy-study',
    title: '雨夜书房',
    emoji: '🌧️',
    category: 'sleep',
    keywords: '雨声,壁炉,书房,深夜',
    desc: '窗外细雨，炉火噼啪',
    config: { rain: 75, fire: 65, wind: 30, bass: 50, bell: 15 }
  },
  {
    id: 'forest-stream',
    title: '森林溪流',
    emoji: '🌲',
    category: 'relax',
    keywords: '鸟鸣,溪流,森林,微风',
    desc: '林间鸟语，溪水潺潺',
    config: { rain: 25, fire: 0, wind: 55, bass: 40, bell: 35 }
  },
  {
    id: 'cafe-rainy',
    title: '咖啡馆雨天',
    emoji: '☕',
    category: 'focus',
    keywords: '咖啡馆,雨声,人声,轻柔',
    desc: '咖啡香浓，雨打窗棂',
    config: { rain: 60, fire: 0, wind: 20, bass: 65, bell: 10 }
  },
  {
    id: 'ocean-breeze',
    title: '海边微风',
    emoji: '🌊',
    category: 'relax',
    keywords: '海浪,微风,海鸥',
    desc: '浪花轻拂，海风徐徐',
    config: { rain: 50, fire: 0, wind: 70, bass: 55, bell: 25 }
  },
  {
    id: 'meditation-bowl',
    title: '冥想颂钵',
    emoji: '🧘',
    category: 'meditation',
    keywords: '颂钵,冥想,禅,低频',
    desc: '钵声悠远，心境澄明',
    config: { rain: 0, fire: 0, wind: 20, bass: 70, bell: 75 }
  },
  {
    id: 'night-library',
    title: '深夜图书馆',
    emoji: '📚',
    category: 'focus',
    keywords: '图书馆,翻书,钢琴,安静',
    desc: '翻书沙沙，灯下钢琴',
    config: { rain: 20, fire: 35, wind: 15, bass: 60, bell: 30 }
  },
  {
    id: 'thunder-rain',
    title: '雷雨助眠',
    emoji: '⛈️',
    category: 'sleep',
    keywords: '雷声,暴雨,助眠',
    desc: '远雷低鸣，暴雨倾盆',
    config: { rain: 95, fire: 20, wind: 40, bass: 65, bell: 0 }
  },
  {
    id: 'sunny-meadow',
    title: '阳光草原',
    emoji: '🌾',
    category: 'relax',
    keywords: '草原,阳光,微风,虫鸣',
    desc: '阳光和煦，微风拂草',
    config: { rain: 10, fire: 0, wind: 60, bass: 45, bell: 50 }
  }
];

// ============================================================
// 2. 情绪算法 — 基于"声音疗愈"心理学
// 每种情绪对应一套音轨配比 + 文字描述
// ============================================================
const MOOD_PRESETS = {
  calm: {
    name: '平静',
    config: { rain: 50, fire: 40, wind: 35, bass: 55, bell: 25 },
    scene: '雨夜书房',
    hint: '✨ 平静的状态下，温和的雨声+壁炉能帮你保持这份宁静，建议保持当前音量。'
  },
  anxious: {
    name: '焦虑',
    config: { rain: 70, fire: 20, wind: 10, bass: 85, bell: 40 },
    scene: '冥想颂钵',
    hint: '💆 焦虑时建议降低高频、加重低频底噪（85%）+ 颂钵铃音，钵声能调节副交感神经。避免突然的噼啪声。'
  },
  tired: {
    name: '疲惫',
    config: { rain: 60, fire: 50, wind: 25, bass: 75, bell: 15 },
    scene: '雨夜书房',
    hint: '😴 疲惫时低频雨声+柔和壁炉是最佳组合，建议同时开启 30 分钟睡眠定时，让声景伴你入睡。'
  },
  focused: {
    name: '想专注',
    config: { rain: 55, fire: 0, wind: 20, bass: 70, bell: 5 },
    scene: '咖啡馆雨天',
    hint: '🎯 专注场景切忌太多变化。雨声提供稳定遮蔽，低频底噪帮助屏蔽人声，去掉所有干扰性元素。'
  },
  sad: {
    name: '低落',
    config: { rain: 45, fire: 70, wind: 30, bass: 60, bell: 50 },
    scene: '阳光草原',
    hint: '🌅 低落时建议"温暖+开阔"的组合 — 加强壁炉的温暖感，配合微风声和铃音，逐步引导情绪上扬。'
  },
  excited: {
    name: '兴奋',
    config: { rain: 65, fire: 30, wind: 50, bass: 75, bell: 30 },
    scene: '海边微风',
    hint: '🌊 兴奋需要"流动感"来平复。海浪+微风的组合能呼应呼吸节奏，让能量自然过渡到平静。'
  }
};

// ============================================================
// 3. 音频引擎（Web Audio API 实时合成）
// ============================================================
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.tracks = {
      rain: { gain: null, nodes: [] },
      fire: { gain: null, nodes: [] },
      wind: { gain: null, nodes: [] },
      bass: { gain: null, nodes: [] },
      bell: { gain: null, nodes: [] }
    };
    this.isPlaying = false;
    this.analyser = null;
    this.visualData = null;
    this.bellTimer = null;
    this.crackleTimer = null;
    this.playStartTime = null;
  }

  async init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.6;
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.visualData = new Uint8Array(this.analyser.frequencyBinCount);
    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    this.buildRain();
    this.buildFire();
    this.buildWind();
    this.buildBass();
    this.buildBell();
  }

  buildRain() {
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer; noise.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass'; filter.frequency.value = 1200; filter.Q.value = 0.5;
    const gain = this.ctx.createGain(); gain.gain.value = 0;
    noise.connect(filter); filter.connect(gain); gain.connect(this.masterGain);
    noise.start();
    this.tracks.rain.gain = gain;
    this.tracks.rain.nodes.push(noise, filter);
  }

  buildFire() {
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer; noise.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 400;
    const gain = this.ctx.createGain(); gain.gain.value = 0;
    noise.connect(filter); filter.connect(gain); gain.connect(this.masterGain);
    noise.start();

    const crackle = () => {
      if (!this.isPlaying) return;
      const t = this.ctx.currentTime;
      const cb = this.ctx.createBuffer(1, 0.05 * this.ctx.sampleRate, this.ctx.sampleRate);
      const d = cb.getChannelData(0);
      for (let i = 0; i < d.length; i++) {
        const env = Math.exp(-i / (this.ctx.sampleRate * 0.01));
        d[i] = (Math.random() * 2 - 1) * env;
      }
      const src = this.ctx.createBufferSource(); src.buffer = cb;
      const cg = this.ctx.createGain();
      cg.gain.value = 0.15 * Math.max(0.1, this.tracks.fire.gain.gain.value / 0.7);
      const cf = this.ctx.createBiquadFilter(); cf.type = 'highpass'; cf.frequency.value = 2000;
      src.connect(cf); cf.connect(cg); cg.connect(this.masterGain);
      src.start(t);
      this.crackleTimer = setTimeout(crackle, 200 + Math.random() * 1800);
    };
    this.crackleTimer = setTimeout(crackle, 500);

    this.tracks.fire.gain = gain;
    this.tracks.fire.nodes.push(noise, filter);
  }

  buildWind() {
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer; noise.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass'; filter.frequency.value = 500; filter.Q.value = 2;
    const lfo = this.ctx.createOscillator(); lfo.frequency.value = 0.15;
    const lfoGain = this.ctx.createGain(); lfoGain.gain.value = 300;
    lfo.connect(lfoGain); lfoGain.connect(filter.frequency); lfo.start();
    const gain = this.ctx.createGain(); gain.gain.value = 0;
    noise.connect(filter); filter.connect(gain); gain.connect(this.masterGain);
    noise.start();
    this.tracks.wind.gain = gain;
    this.tracks.wind.nodes.push(noise, filter, lfo);
  }

  buildBass() {
    const osc = this.ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = 60;
    const osc2 = this.ctx.createOscillator(); osc2.type = 'sine'; osc2.frequency.value = 90;
    const lfo = this.ctx.createOscillator(); lfo.frequency.value = 0.08;
    const lfoGain = this.ctx.createGain(); lfoGain.gain.value = 5;
    lfo.connect(lfoGain); lfoGain.connect(osc.frequency); lfo.start();
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 150;
    const gain = this.ctx.createGain(); gain.gain.value = 0;
    osc.connect(filter); osc2.connect(filter); filter.connect(gain); gain.connect(this.masterGain);
    osc.start(); osc2.start();
    this.tracks.bass.gain = gain;
    this.tracks.bass.nodes.push(osc, osc2, lfo, filter);
  }

  buildBell() {
    const freqs = [528, 741, 852];
    const gain = this.ctx.createGain(); gain.gain.value = 0;
    freqs.forEach(f => {
      const osc = this.ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = f;
      const env = this.ctx.createGain(); env.gain.value = 0.3;
      osc.connect(env); env.connect(gain); osc.start();
      this.tracks.bell.nodes.push(osc, env);
    });
    gain.connect(this.masterGain);
    this.tracks.bell.gain = gain;

    const ring = () => {
      if (!this.isPlaying || this.tracks.bell.gain.gain.value < 0.05) {
        this.bellTimer = setTimeout(ring, 1000);
        return;
      }
      const t = this.ctx.currentTime;
      const env = this.ctx.createGain();
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(0.4, t + 0.05);
      env.gain.exponentialRampToValueAtTime(0.001, t + 4);
      const o = this.ctx.createOscillator(); o.type = 'sine';
      o.frequency.value = 528 + Math.random() * 300;
      o.connect(env); env.connect(this.masterGain);
      o.start(t); o.stop(t + 4);
      this.bellTimer = setTimeout(ring, 6000 + Math.random() * 8000);
    };
    this.bellTimer = setTimeout(ring, 3000);
  }

  setVolume(track, value) {
    if (!this.tracks[track] || !this.tracks[track].gain) return;
    const v = value / 100;
    this.tracks[track].gain.gain.setTargetAtTime(v * 0.7, this.ctx.currentTime, 0.1);
  }

  async play() {
    await this.init();
    if (this.ctx.state === 'suspended') await this.ctx.resume();
    this.isPlaying = true;
    this.playStartTime = Date.now();
  }

  pause() {
    this.isPlaying = false;
    if (this.playStartTime) {
      const minutes = Math.round((Date.now() - this.playStartTime) / 60000);
      Storage.addListenMinutes(minutes);
      this.playStartTime = null;
      UI.updateStats();
    }
    if (this.ctx) this.ctx.suspend();
  }

  fadeOut(durationSec = 10) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(0, now + durationSec);
    setTimeout(() => this.pause(), durationSec * 1000);
  }

  toggle() {
    return this.isPlaying ? (this.pause(), false) : (this.play(), true);
  }

  getVisualData() {
    if (!this.analyser) return null;
    this.analyser.getByteFrequencyData(this.visualData);
    return this.visualData;
  }
}

// ============================================================
// 4. 文字解析（基础关键词映射）
// ============================================================
function parsePrompt(text) {
  const lower = text.toLowerCase();
  const config = { rain: 0, fire: 0, wind: 0, bass: 40, bell: 0 };

  if (/(雨|下雨|暴雨|小雨|窗外|潮湿)/.test(lower)) config.rain = 75;
  if (/(雷|闪电)/.test(lower)) config.rain = 90;
  if (/(壁炉|火|柴火|噼啪|燃烧)/.test(lower)) config.fire = 65;
  if (/(风|微风|晚风|清风)/.test(lower)) config.wind = 55;
  if (/(海边|海浪|海|浪)/.test(lower)) { config.rain = 60; config.wind = 70; }
  if (/(森林|树林|鸟|鸟鸣|溪|流水)/.test(lower)) { config.wind = 50; config.bell = 30; }
  if (/(冥想|瑜伽|禅|颂钵|放松)/.test(lower)) { config.bell = 60; config.bass = 70; }
  if (/(图书馆|翻书|安静|深夜|书房|专注|学习)/.test(lower)) { config.bass = 60; config.fire = 35; }
  if (/(咖啡|咖啡馆|人声|都市)/.test(lower)) { config.rain = 50; config.bass = 55; }
  if (/(阳光|草原|温暖)/.test(lower)) { config.wind = 60; config.bell = 50; }

  if (config.rain === 0 && config.fire === 0 && config.wind === 0) config.rain = 40;
  return config;
}

function extractKeywords(text) {
  const map = {
    '雨声': /雨|下雨|暴雨/,
    '壁炉': /壁炉|火|噼啪/,
    '风声': /风|微风/,
    '海浪': /海|浪/,
    '鸟鸣': /鸟|森林/,
    '颂钵': /颂钵|冥想|禅/,
    '低频': /低频|安静|专注/,
    '钢琴': /钢琴|音乐/,
    '阳光': /阳光|草原/
  };
  const found = [];
  for (const [k, re] of Object.entries(map)) {
    if (re.test(text)) found.push(k);
  }
  if (found.length === 0) found.push('氛围音');
  return found.join(' · ');
}

function applyConfig(config) {
  Object.keys(config).forEach(k => {
    const slider = document.querySelector(`.slider[data-track="${k}"]`);
    if (slider) {
      slider.value = config[k];
      slider.nextElementSibling.textContent = config[k];
    }
    if (engine.isPlaying) engine.setVolume(k, config[k]);
  });
}

// ============================================================
// 5. 本地存储（收藏 + 历史）
// ============================================================
const Storage = {
  KEY_FAV: 'ai-shengjing-favorites',
  KEY_HIST: 'ai-shengjing-history',
  KEY_STATS: 'ai-shengjing-stats',

  getFavorites() {
    try { return JSON.parse(localStorage.getItem(this.KEY_FAV) || '[]'); }
    catch { return []; }
  },
  addFavorite(scene) {
    const favs = this.getFavorites();
    if (favs.find(f => f.id === scene.id)) return false;
    favs.unshift(scene);
    localStorage.setItem(this.KEY_FAV, JSON.stringify(favs.slice(0, 20)));
    return true;
  },
  removeFavorite(id) {
    const favs = this.getFavorites().filter(f => f.id !== id);
    localStorage.setItem(this.KEY_FAV, JSON.stringify(favs));
  },

  getHistory() {
    try { return JSON.parse(localStorage.getItem(this.KEY_HIST) || '[]'); }
    catch { return []; }
  },
  addHistory(entry) {
    const hist = this.getHistory();
    hist.unshift(entry);
    localStorage.setItem(this.KEY_HIST, JSON.stringify(hist.slice(0, 50)));
  },
  clearHistory() {
    localStorage.setItem(this.KEY_HIST, '[]');
  },

  getStats() {
    try { return JSON.parse(localStorage.getItem(this.KEY_STATS) || '{"minutes":0,"sessions":0,"date":""}'); }
    catch { return { minutes: 0, sessions: 0, date: '' }; }
  },
  incrementSession() {
    const stats = this.getStats();
    const today = new Date().toDateString();
    if (stats.date !== today) { stats.date = today; stats.sessions = 0; }
    stats.sessions++;
    localStorage.setItem(this.KEY_STATS, JSON.stringify(stats));
  },
  addListenMinutes(min) {
    if (min <= 0) return;
    const stats = this.getStats();
    stats.minutes = (stats.minutes || 0) + min;
    localStorage.setItem(this.KEY_STATS, JSON.stringify(stats));
  }
};

// ============================================================
// 6. UI 控制器
// ============================================================
const engine = new SoundEngine();

const UI = {
  currentScene: null,
  currentMood: null,
  timerInterval: null,
  timerEndTime: null,
  currentCategory: 'all',

  renderSceneLibrary(filter = 'all') {
    const grid = document.getElementById('sceneGrid');
    const scenes = filter === 'all' ? SCENE_LIBRARY : SCENE_LIBRARY.filter(s => s.category === filter);
    grid.innerHTML = scenes.map(s => `
      <div class="scene-card" data-id="${s.id}">
        <div class="scene-emoji">${s.emoji}</div>
        <div class="scene-title">${s.title}</div>
        <div class="scene-desc">${s.desc}</div>
        <div class="scene-tags">
          <span class="scene-tag cat-${s.category}">${this.catName(s.category)}</span>
        </div>
      </div>
    `).join('');
    grid.querySelectorAll('.scene-card').forEach(card => {
      card.addEventListener('click', () => this.loadScene(card.dataset.id));
    });
  },

  catName(cat) {
    return { sleep: '助眠', focus: '专注', meditation: '冥想', relax: '放松' }[cat] || cat;
  },

  async loadScene(id) {
    const scene = SCENE_LIBRARY.find(s => s.id === id);
    if (!scene) return;
    this.currentScene = scene;
    this.currentMood = null;

    document.getElementById('currentSceneTitle').textContent = scene.title;
    document.getElementById('keywordsDisplay').textContent = scene.keywords;
    document.getElementById('promptInput').value = `${scene.title}，${scene.keywords}`;

    applyConfig(scene.config);

    if (!engine.isPlaying) {
      playBtn.click();
    }

    document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('moodHint').textContent = '';

    Storage.incrementSession();
    Storage.addHistory({
      type: 'scene',
      id: scene.id,
      title: scene.title,
      emoji: scene.emoji,
      time: Date.now(),
      config: { ...scene.config }
    });
    this.updateStats();
    this.renderHistory();
  },

  applyMood(mood) {
    const preset = MOOD_PRESETS[mood];
    if (!preset) return;
    this.currentMood = mood;
    this.currentScene = null;

    document.getElementById('currentSceneTitle').textContent = `${preset.name}模式 · ${preset.scene}`;
    document.getElementById('keywordsDisplay').textContent = `情绪算法 · ${preset.name}`;
    document.getElementById('moodHint').textContent = preset.hint;
    document.getElementById('promptInput').value = `${preset.name}：${preset.hint}`;

    applyConfig(preset.config);

    if (!engine.isPlaying) playBtn.click();

    document.querySelectorAll('.mood-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.mood === mood);
    });

    Storage.incrementSession();
    Storage.addHistory({
      type: 'mood',
      mood,
      title: `${preset.name}模式`,
      time: Date.now(),
      config: { ...preset.config }
    });
    this.updateStats();
    this.renderHistory();
  },

  startTimer(minutes) {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (minutes === 0) {
      this.timerEndTime = null;
      document.getElementById('timerStatus').textContent = '';
      document.querySelectorAll('.timer-btn').forEach(b => b.classList.remove('active'));
      return;
    }
    this.timerEndTime = Date.now() + minutes * 60000;
    document.querySelectorAll('.timer-btn').forEach(b => {
      b.classList.toggle('active', parseInt(b.dataset.min) === minutes);
    });

    const update = () => {
      const remain = Math.max(0, this.timerEndTime - Date.now());
      const m = Math.floor(remain / 60000);
      const s = Math.floor((remain % 60000) / 1000);
      document.getElementById('timerStatus').textContent =
        `⏳ 将在 ${m}:${String(s).padStart(2, '0')} 后渐弱退出`;
      if (remain <= 0) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
        document.getElementById('timerStatus').textContent = '🌙 声景已渐弱退出，伴你入眠';
        engine.fadeOut(10);
      }
    };
    update();
    this.timerInterval = setInterval(update, 1000);
  },

  toggleFavorite() {
    if (!this.currentScene && !this.currentMood) {
      alert('请先选择一个场景或情绪');
      return;
    }
    const scene = this.currentScene || {
      id: 'mood-' + this.currentMood,
      title: MOOD_PRESETS[this.currentMood].name + '模式',
      emoji: '🌈',
      config: MOOD_PRESETS[this.currentMood].config
    };
    const added = Storage.addFavorite(scene);
    if (added) {
      document.getElementById('favoriteBtn').textContent = '🌟';
      this.renderFavorites();
      this.updateStats();
    }
  },

  renderFavorites() {
    const list = document.getElementById('favoritesList');
    const favs = Storage.getFavorites();
    if (favs.length === 0) {
      list.innerHTML = '<p class="empty">还没有收藏。播放时点击 ⭐ 即可收藏当前混音方案。</p>';
      return;
    }
    list.innerHTML = favs.map(f => `
      <div class="favorite-item" data-id="${f.id}">
        <span class="fav-emoji">${f.emoji}</span>
        <span class="fav-title">${f.title}</span>
        <button class="fav-load">▶ 播放</button>
        <button class="fav-remove">×</button>
      </div>
    `).join('');
    list.querySelectorAll('.fav-load').forEach((btn, i) => {
      btn.addEventListener('click', () => {
        const fav = favs[i];
        if (fav.id.startsWith('mood-')) {
          this.applyMood(fav.id.slice(5));
        } else {
          this.loadScene(fav.id);
        }
      });
    });
    list.querySelectorAll('.fav-remove').forEach((btn, i) => {
      btn.addEventListener('click', () => {
        Storage.removeFavorite(favs[i].id);
        this.renderFavorites();
        this.updateStats();
      });
    });
  },

  renderHistory() {
    const list = document.getElementById('historyList');
    const hist = Storage.getHistory().slice(0, 10);
    if (hist.length === 0) {
      list.innerHTML = '<p class="empty">暂无记录。开始你的第一次声景体验吧～</p>';
    } else {
      list.innerHTML = hist.map(h => {
        const time = new Date(h.time);
        const tStr = `${time.getMonth() + 1}/${time.getDate()} ${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`;
        return `<div class="history-item">
          <span class="hist-emoji">${h.emoji || '🌈'}</span>
          <span class="hist-title">${h.title}</span>
          <span class="hist-time">${tStr}</span>
        </div>`;
      }).join('');
    }

    const histAll = Storage.getHistory();
    const sceneCount = {};
    const moodCount = {};
    histAll.forEach(h => {
      if (h.type === 'scene') sceneCount[h.title] = (sceneCount[h.title] || 0) + 1;
      else if (h.type === 'mood') moodCount[h.mood] = (moodCount[h.mood] || 0) + 1;
    });
    const topScene = Object.entries(sceneCount).sort((a, b) => b[1] - a[1])[0];
    const topMood = Object.entries(moodCount).sort((a, b) => b[1] - a[1])[0];
    document.getElementById('topScene').textContent = topScene ? topScene[0] : '—';
    document.getElementById('topMood').textContent = topMood ? MOOD_PRESETS[topMood[0]].name : '—';
  },

  updateStats() {
    const stats = Storage.getStats();
    const today = new Date().toDateString();
    const sessionsToday = stats.date === today ? stats.sessions : 0;
    document.getElementById('statSessions').textContent = sessionsToday;
    document.getElementById('statMinutes').textContent = stats.minutes || 0;
    document.getElementById('statFavorite').textContent = Storage.getFavorites().length;
    document.getElementById('totalTime').textContent = `${stats.minutes || 0} 分钟`;
  }
};

// ============================================================
// 7. 事件绑定 + 初始化
// ============================================================
const playBtn = document.getElementById('playBtn');
const promptInput = document.getElementById('promptInput');
const generateBtn = document.getElementById('generateBtn');
const canvas = document.getElementById('visualizer');
const canvasCtx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = canvas.offsetWidth * window.devicePixelRatio;
  canvas.height = 120 * window.devicePixelRatio;
  canvasCtx.scale(window.devicePixelRatio, window.devicePixelRatio);
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

function drawVisualizer() {
  requestAnimationFrame(drawVisualizer);
  const w = canvas.offsetWidth;
  const h = 120;
  canvasCtx.clearRect(0, 0, w, h);

  if (!engine.isPlaying) {
    canvasCtx.fillStyle = 'rgba(168, 185, 255, 0.4)';
    canvasCtx.font = '14px sans-serif';
    canvasCtx.textAlign = 'center';
    canvasCtx.fillText('点击 ▶ 开始声景之旅', w / 2, h / 2);
    return;
  }

  const data = engine.getVisualData();
  if (!data) return;
  const barWidth = w / data.length;
  const gradient = canvasCtx.createLinearGradient(0, 0, 0, h);
  gradient.addColorStop(0, '#a8b9ff');
  gradient.addColorStop(1, '#a060ff');
  canvasCtx.fillStyle = gradient;

  for (let i = 0; i < data.length; i++) {
    const barHeight = (data[i] / 255) * h;
    canvasCtx.fillRect(i * barWidth, h - barHeight, barWidth - 1, barHeight);
  }
}
drawVisualizer();

playBtn.addEventListener('click', async () => {
  const playing = await engine.toggle();
  playBtn.textContent = playing ? '⏸' : '▶';
  playBtn.classList.toggle('playing', playing);
});

generateBtn.addEventListener('click', async () => {
  const text = promptInput.value.trim();
  if (!text) return;
  await engine.init();
  if (engine.ctx.state === 'suspended') await engine.ctx.resume();
  engine.isPlaying = true;
  playBtn.textContent = '⏸';
  playBtn.classList.add('playing');

  const config = parsePrompt(text);
  applyConfig(config);
  document.getElementById('currentSceneTitle').textContent = text.length > 20 ? text.slice(0, 20) + '...' : text;
  document.getElementById('keywordsDisplay').textContent = extractKeywords(text);

  document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('moodHint').textContent = '';
  UI.currentScene = null;
  UI.currentMood = null;

  Storage.incrementSession();
  Storage.addHistory({
    type: 'custom',
    title: text.slice(0, 30),
    emoji: '✨',
    time: Date.now(),
    config: { ...config }
  });
  UI.updateStats();
  UI.renderHistory();
});

document.querySelectorAll('.preset').forEach(btn => {
  btn.addEventListener('click', () => {
    const text = btn.textContent.replace(/^[^\s]+\s/, '').trim();
    promptInput.value = `${text}，${btn.dataset.keywords}`;
    generateBtn.click();
  });
});

document.querySelectorAll('.slider').forEach(slider => {
  slider.addEventListener('input', () => {
    const track = slider.dataset.track;
    const value = parseInt(slider.value);
    slider.nextElementSibling.textContent = value;
    if (engine.isPlaying) engine.setVolume(track, value);
  });
});

document.querySelectorAll('.mood-btn').forEach(btn => {
  btn.addEventListener('click', () => UI.applyMood(btn.dataset.mood));
});

document.querySelectorAll('.cat-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    UI.renderSceneLibrary(tab.dataset.cat);
  });
});

document.querySelectorAll('.timer-btn').forEach(btn => {
  btn.addEventListener('click', () => UI.startTimer(parseInt(btn.dataset.min)));
});

document.getElementById('favoriteBtn').addEventListener('click', () => UI.toggleFavorite());
document.getElementById('clearHistoryBtn').addEventListener('click', () => {
  if (confirm('确定要清空所有历史记录吗？')) {
    Storage.clearHistory();
    UI.renderHistory();
  }
});

// 初始化
UI.renderSceneLibrary('all');
UI.renderFavorites();
UI.renderHistory();
UI.updateStats();

// 默认初始音量
Object.keys(engine.tracks).forEach(k => {
  const slider = document.querySelector(`.slider[data-track="${k}"]`);
  if (slider) engine.setVolume(k, parseInt(slider.value));
});