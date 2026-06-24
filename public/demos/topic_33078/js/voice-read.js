/**
 * voice-read.js
 * 药音通 - 方言朗读模块交互逻辑
 * 使用浏览器内置 Web Speech API（SpeechSynthesis）实现本地语音朗读
 * 集成小米 MiMo-V2.5-TTS 云端接口（Key 留空时自动回退到本地语音）
 * 无需任何外网 CDN，网络请求仅在填写 MIMO_API_KEY 后发起
 */

(function () {
  'use strict';

  // ==================== 配置常量 ====================
  const STORAGE_KEY = 'yaoyintong_voice_settings';
  const RECORDS_KEY = 'yaoyintong_family_records';

  // 小米 MiMo TTS 配置（Key 留空时默认使用浏览器本地语音）
  const MIMO_API_KEY = 'sk-*************';  // ← 在此处填写你的小米 MiMo API Key
  const MIMO_BASE_URL = 'https://api.xiaomimimo.com/v1';
  const MIMO_MODEL = 'mimo-v2.5-tts';         // 可选：mimo-v2.5-tts / mimo-v2.5-tts-voicedesign / mimo-v2.5-tts-voiceclone
  const MIMO_AUDIO_FORMAT = 'wav';            // 非流式：wav / mp3；流式请用 pcm16

  const DEFAULT_SETTINGS = {
    dialect: 'mandarin',
    gender: 'male',
    speed: 'normal',
    globalRead: false
  };

  // 逐词高亮的时间间隔（毫秒），与语速联动
  const HIGHLIGHT_SPEED_MAP = {
    slow: 700,
    normal: 450,
    fast: 250
  };

  // Web Speech API 语速映射（0.1 ~ 10，默认1）
  const TTS_RATE_MAP = {
    slow: 0.6,
    normal: 1.0,
    fast: 1.6
  };

  // Web Speech API 音调映射（男声低沉，女声偏高）
  // 注意：浏览器本地语音对方言/音色支持有限，仅靠 pitch 微调
  // 如需真实男声/女声切换，建议填写小米 MiMo API Key 使用云端 TTS
  const TTS_PITCH_MAP = {
    male: 0.4,     // 大幅降低音调，模拟男声低沉效果
    female: 1.6     // 大幅提高音调，模拟女声清亮效果
  };

  // Web Speech API 音量映射（男声稍大，女声适中）
  const TTS_VOLUME_MAP = {
    male: 1.0,
    female: 0.9
  };

  // 方言 → SpeechSynthesis lang 标签映射
  // 注意：浏览器内置语音引擎对方言支持有限，此处做最佳匹配
  const DIALECT_LANG_MAP = {
    mandarin: 'zh-CN',
    shandong: 'zh-CN',     // 山东话：浏览器无专用引擎，使用普通话
    northern: 'zh-CN',     // 北方官话：同上
    sichuan: 'zh-CN',      // 四川话：同上
    cantonese: 'zh-HK',    // 粤语：部分系统支持 zh-HK / yue
    wu: 'zh-CN',           // 吴语：浏览器无专用引擎
    henan: 'zh-CN'         // 河南话：同上
  };

  // 方言 → 小米 MiMo TTS 风格标签 / 音色映射
  // MiMo-V2.5-TTS 支持在文本前加 (方言) 标签，如 (四川话)...(粤语)...
  // 预置音色：冰糖(女)、茉莉(女)、苏打(男)、白桦(男)
  const MIMO_VOICE_MAP = {
    mandarin: { voice: 'mimo_default', stylePrefix: '' },
    shandong: { voice: 'mimo_default', stylePrefix: '（山东话）' },
    northern: { voice: 'mimo_default', stylePrefix: '（北方官话）' },
    sichuan:  { voice: 'mimo_default', stylePrefix: '（四川话）' },
    cantonese:{ voice: 'mimo_default', stylePrefix: '（粤语）' },
    wu:       { voice: 'mimo_default', stylePrefix: '（吴语）' },
    henan:    { voice: 'mimo_default', stylePrefix: '（河南话）' }
  };

  // 性别 → 小米预置音色映射（男声用苏打，女声用冰糖）
  const MIMO_GENDER_VOICE = {
    male: '苏打',      // 男声预置音色
    female: '冰糖'     // 女声预置音色
  };

  // 当前播放的音频对象（用于停止）
  let currentAudio = null;

  // ==================== DOM 元素缓存 ====================
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const els = {
    dialectBtns: $$('.dialect-btn'),
    genderBtns: $$('.gender-btn'),
    speedBtns: $$('.speed-btn'),
    btnPreview: $('#btnPreview'),
    btnPlay: $('#btnPlay'),
    btnPause: $('#btnPause'),
    btnStop: $('#btnStop'),
    waveContainer: $('#waveContainer'),
    textPreview: $('#textPreview'),
    globalToggle: $('#globalToggle'),
    globalToggleBar: $('#globalToggleBar'),
    recordName: $('#recordName'),
    recordFile: $('#recordFile'),
    fileBtn: $('#fileBtn'),
    alarmTime: $('#alarmTime'),
    btnAlarmToggle: $('#btnAlarmToggle'),
    btnSaveRecord: $('#btnSaveRecord'),
    savedRecords: $('#savedRecords')
  };

  // ==================== 状态管理 ====================
  let state = {
    dialect: DEFAULT_SETTINGS.dialect,
    gender: DEFAULT_SETTINGS.gender,
    speed: DEFAULT_SETTINGS.speed,
    globalRead: DEFAULT_SETTINGS.globalRead,
    isPlaying: false,
    isPaused: false,
    highlightTimer: null,
    currentWordIndex: 0,
    words: [],
    alarmOn: false,
    selectedFileName: '',
    utterance: null       // SpeechSynthesisUtterance 实例
  };

  // ==================== Web Speech API 检测 ====================
  const hasSpeechSupport = 'speechSynthesis' in window;

  if (!hasSpeechSupport) {
    console.warn('[voice-read] 当前浏览器不支持 Web Speech API，朗读功能将仅做视觉模拟');
  }

  // ==================== 本地存储读写 ====================

  /**
   * 读取本地保存的设置（兼容系统设置页）
   */
  function loadSettings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        state.dialect = saved.dialect || DEFAULT_SETTINGS.dialect;
        state.gender = saved.gender || DEFAULT_SETTINGS.gender;
        state.speed = saved.speed || DEFAULT_SETTINGS.speed;
        state.globalRead = typeof saved.globalRead === 'boolean' ? saved.globalRead : DEFAULT_SETTINGS.globalRead;
      }
    } catch (e) {
      console.warn('[voice-read] 读取设置失败，使用默认值', e);
    }
  }

  /**
   * 持久化当前设置到本地存储
   */
  function saveSettings() {
    try {
      const payload = {
        dialect: state.dialect,
        gender: state.gender,
        speed: state.speed,
        globalRead: state.globalRead,
        updatedAt: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn('[voice-read] 保存设置失败', e);
    }
  }

  // ==================== UI 同步 ====================

  function syncUI() {
    // 方言按钮
    els.dialectBtns.forEach(btn => {
      const selected = btn.dataset.dialect === state.dialect;
      btn.classList.toggle('selected', selected);
      btn.setAttribute('aria-checked', selected);
    });

    // 音色按钮
    els.genderBtns.forEach(btn => {
      const selected = btn.dataset.gender === state.gender;
      btn.classList.toggle('selected', selected);
      btn.setAttribute('aria-checked', selected);
    });

    // 语速按钮
    els.speedBtns.forEach(btn => {
      const selected = btn.dataset.speed === state.speed;
      btn.classList.toggle('selected', selected);
    });

    // 全局开关
    els.globalToggle.classList.toggle('on', state.globalRead);
    els.globalToggle.setAttribute('aria-checked', state.globalRead);
  }

  // ==================== 方言切换 ====================

  function initDialect() {
    els.dialectBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (state.isPlaying) stopPlay();
        state.dialect = btn.dataset.dialect;
        syncUI();
        saveSettings();
        if (navigator.vibrate) navigator.vibrate(20);
      });
    });
  }

  // ==================== 音色切换 ====================

  function initGender() {
    els.genderBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        state.gender = btn.dataset.gender;
        syncUI();
        saveSettings();
      });
    });
  }

  // ==================== 语速切换 ====================

  function initSpeed() {
    els.speedBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        state.speed = btn.dataset.speed;
        syncUI();
        saveSettings();
      });
    });
  }

  // ==================== 全局整页朗读开关 ====================

  function initGlobalToggle() {
    const toggle = () => {
      state.globalRead = !state.globalRead;
      syncUI();
      saveSettings();
      if (navigator.vibrate) navigator.vibrate(30);

      if (state.globalRead) {
        showToast('整页朗读已开启，点击页面文字即可收听');
      } else {
        stopPlay();
        showToast('整页朗读已关闭');
      }
    };

    els.globalToggle.addEventListener('click', toggle);
    els.globalToggleBar.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle();
      }
    });

    // 整页文字点击朗读（全局开关开启时）
    document.body.addEventListener('click', (e) => {
      if (!state.globalRead) return;
      if (e.target.closest('button, input, select, textarea, .toggle-switch')) return;

      const text = window.getSelection().toString().trim() || e.target.innerText.trim();
      if (text && text.length > 0) {
        stopPlay();
        setPreviewText(text);
        startPlay();
      }
    });
  }

  // ==================== 语音合成（本地 Web Speech API） ====================

  /**
   * 选择最匹配的语音（根据性别优先匹配不同发音人）
   * 浏览器可能安装多个中文语音，尝试按性别关键词筛选
   */
  function pickVoice() {
    if (!hasSpeechSupport) return null;
    const voices = speechSynthesis.getVoices();
    const targetLang = DIALECT_LANG_MAP[state.dialect] || 'zh-CN';

    // 性别关键词（用于从语音名称中推断性别）
    const maleKeywords = ['male', 'Male', 'man', 'Man', '男', 'David', 'Mark', 'Alex', 'Jack', 'Tom', 'Daniel', 'Google 中文', 'Microsoft Huihui', 'Microsoft Kangkang'];
    const femaleKeywords = ['female', 'Female', 'woman', 'Woman', '女', 'Xiaoxiao', 'Xiaoyi', 'Samantha', 'Victoria', 'Google 普通话', 'Microsoft Yaoyao', 'Microsoft Xiaoxiao'];

    // 筛选匹配目标语言的语音
    const langVoices = voices.filter(v => v.lang === targetLang || v.lang.startsWith(targetLang.split('-')[0]));

    if (langVoices.length === 0) {
      // 回退到任意中文语音
      const fallback = voices.find(v => v.lang.startsWith('zh'));
      return fallback || null;
    }

    // 如果只有一个语音，直接返回
    if (langVoices.length === 1) return langVoices[0];

    // 尝试按性别关键词匹配
    const keywords = state.gender === 'male' ? maleKeywords : femaleKeywords;
    for (const voice of langVoices) {
      if (keywords.some(k => voice.name.includes(k))) {
        return voice;
      }
    }

    // 如果没匹配到性别关键词，男声选最后一个，女声选第一个（经验性策略）
    if (state.gender === 'male') {
      return langVoices[langVoices.length - 1];
    }
    return langVoices[0];
  }

  /**
   * 创建 SpeechSynthesisUtterance 并配置参数
   */
  function createUtterance(text) {
    if (!hasSpeechSupport) return null;

    const utt = new SpeechSynthesisUtterance(text);
    const voice = pickVoice();
    if (voice) utt.voice = voice;

    utt.lang = DIALECT_LANG_MAP[state.dialect] || 'zh-CN';
    utt.rate = TTS_RATE_MAP[state.speed] || 1.0;
    utt.pitch = TTS_PITCH_MAP[state.gender] || 1.0;
    utt.volume = TTS_VOLUME_MAP[state.gender] || 1.0;

    // 语音结束回调
    utt.onend = () => {
      stopPlay();
      showToast('朗读完成');
    };

    utt.onerror = (e) => {
      // "interrupted" 是用户主动停止，不算错误
      if (e.error === 'interrupted' || e.error === 'canceled') return;
      console.warn('[voice-read] 语音合成错误:', e.error);
      stopPlay();
      showToast('语音播放出错');
    };

    return utt;
  }

  // ==================== 小米 MiMo-V2.5-TTS 云端接口 ====================

  /**
   * 判断当前是否启用小米云端 TTS
   */
  function useMimoCloudTTS() {
    return typeof MIMO_API_KEY === 'string' && MIMO_API_KEY.trim().length > 0;
  }

  /**
   * 构建小米 TTS 请求体
   */
  function buildMimoRequest(text) {
    const cfg = MIMO_VOICE_MAP[state.dialect] || MIMO_VOICE_MAP.mandarin;
    const styleText = cfg.stylePrefix ? cfg.stylePrefix + text : text;

    // 音色/语速/性别的自然语言控制指令
    const genderDesc = state.gender === 'male' ? '男声' : '女声';
    const speedDesc = state.speed === 'slow' ? '语速较慢' : state.speed === 'fast' ? '语速较快' : '语速适中';
    const dialectDesc = getDialectLabel(state.dialect);

    const userContent = `请用${dialectDesc}、${genderDesc}、${speedDesc}朗读以下内容，保持自然亲切。`;

    // 根据性别选择预置音色（男声→苏打，女声→冰糖）
    const voiceId = MIMO_GENDER_VOICE[state.gender] || cfg.voice;

    return {
      model: MIMO_MODEL,
      messages: [
        {
          role: 'user',
          content: userContent
        },
        {
          role: 'assistant',
          content: styleText
        }
      ],
      audio: {
        format: MIMO_AUDIO_FORMAT,
        voice: voiceId
      }
    };
  }

  /**
   * 调用小米 MiMo TTS 接口并播放返回的音频
   * 返回 Promise，resolve 时音频已开始播放
   */
  async function playWithMimoTTS(text) {
    if (!useMimoCloudTTS()) {
      // Key 未填写，回退到本地语音
      playWithLocalTTS(text);
      return Promise.resolve();
    }

    try {
      showToast('正在合成语音…');
      const response = await fetch(`${MIMO_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': MIMO_API_KEY
        },
        body: JSON.stringify(buildMimoRequest(text))
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errText}`);
      }

      const data = await response.json();
      const audioBase64 = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.audio && data.choices[0].message.audio.data;

      if (!audioBase64) {
        throw new Error('接口未返回音频数据');
      }

      // Base64 → Blob URL → Audio 播放
      const audioBytes = base64ToUint8Array(audioBase64);
      const mimeType = MIMO_AUDIO_FORMAT === 'mp3' ? 'audio/mpeg' : 'audio/wav';
      const blob = new Blob([audioBytes], { type: mimeType });
      const url = URL.createObjectURL(blob);

      stopCurrentAudio();
      currentAudio = new Audio(url);

      return new Promise((resolve, reject) => {
        currentAudio.onplay = () => {
          // 音频真正开始播放时才 resolve，让高亮同步启动
          resolve();
        };

        currentAudio.onended = () => {
          stopPlay();
          showToast('朗读完成');
        };

        currentAudio.onerror = (e) => {
          stopPlay();
          showToast('音频播放出错');
          reject(e);
        };

        currentAudio.play().catch(err => {
          console.warn('[voice-read] 音频播放失败:', err);
          showToast('音频播放失败');
          reject(err);
        });
      });

    } catch (err) {
      console.warn('[voice-read] 小米 TTS 调用失败，回退到本地语音:', err);
      showToast('云端合成失败，已切换本地语音');
      playWithLocalTTS(text);
      return Promise.resolve();
    }
  }

  /**
   * Base64 字符串转 Uint8Array（兼容版，无需 atob）
   */
  function base64ToUint8Array(base64) {
    const raw = window.atob(base64);
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) {
      bytes[i] = raw.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * 停止当前 Audio 对象播放并释放 Blob URL
   */
  function stopCurrentAudio() {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.onended = null;
      currentAudio.onerror = null;
      const src = currentAudio.src;
      currentAudio = null;
      if (src && src.startsWith('blob:')) {
        URL.revokeObjectURL(src);
      }
    }
  }

  /**
   * 使用浏览器本地语音合成播放
   */
  function playWithLocalTTS(text) {
    if (!hasSpeechSupport) return;
    speechSynthesis.cancel();
    state.utterance = createUtterance(text);
    if (state.utterance) {
      speechSynthesis.speak(state.utterance);
    }
  }

  // ==================== 播放控制 ====================

  /**
   * 预留MiniMax-M3方言TTS云端接口调用入口
   * 正式上线可对接真实语音合成服务，当前已集成小米 MiMo-V2.5-TTS
   */
  function startPlay() {
    if (state.isPlaying && !state.isPaused) return;

    // 若从暂停恢复
    if (state.isPaused) {
      state.isPaused = false;
      updatePlayButtons();
      els.waveContainer.classList.add('active');
      // 恢复语音合成
      if (hasSpeechSupport) {
        speechSynthesis.resume();
      }
      resumeHighlight();
      return;
    }

    // ===== 播放函数开头：云端TTS接口预留注释 =====
    // 预留MiniMax-M3方言TTS云端接口调用入口，正式上线可对接真实语音合成服务，当前已集成小米 MiMo-V2.5-TTS
    // 如需切换其他云端API，可在此处替换 playWithMimoTTS() 调用
    // ====================

    const text = els.textPreview.innerText.trim();
    if (!text) {
      showToast('暂无朗读内容');
      return;
    }

    // 分词（按标点与空格拆分，用于逐词高亮）
    state.words = text.split(/(\s+|[，。、；：！？.,;:!?])/g).filter(w => w.trim().length > 0);
    state.currentWordIndex = 0;
    state.isPlaying = true;
    state.isPaused = false;

    updatePlayButtons();
    els.waveContainer.classList.add('active');

    // 启动语音合成：优先小米云端，Key 留空时自动回退本地 Web Speech API
    // 等待音频真正开始播放后再启动高亮，确保声画同步
    playWithMimoTTS(text).then(() => {
      highlightNextWord();
    }).catch(() => {
      // 播放失败也启动高亮，至少给用户视觉反馈
      highlightNextWord();
    });
  }

  function pausePlay() {
    if (!state.isPlaying) return;
    state.isPaused = true;
    clearTimeout(state.highlightTimer);
    updatePlayButtons();
    els.waveContainer.classList.remove('active');

    // 暂停语音合成
    if (useMimoCloudTTS()) {
      if (currentAudio) currentAudio.pause();
    } else if (hasSpeechSupport) {
      speechSynthesis.pause();
    }
  }

  function stopPlay() {
    state.isPlaying = false;
    state.isPaused = false;
    state.currentWordIndex = 0;
    clearTimeout(state.highlightTimer);
    updatePlayButtons();
    els.waveContainer.classList.remove('active');
    clearHighlight();

    // 停止语音合成
    if (useMimoCloudTTS()) {
      stopCurrentAudio();
    } else if (hasSpeechSupport) {
      speechSynthesis.cancel();
      state.utterance = null;
    }
  }

  function previewVoice() {
    const text = els.textPreview.innerText.trim();
    if (!text) {
      showToast('暂无朗读内容');
      return;
    }
    stopPlay();
    els.waveContainer.classList.add('active');
    showToast(`试听：${getDialectLabel(state.dialect)} · ${state.gender === 'male' ? '男声' : '女声'} · ${getSpeedLabel(state.speed)}`);

    // 试听：朗读前15个字
    const previewText = text.substring(0, 15);
    if (useMimoCloudTTS()) {
      // 云端试听：先分词，等音频播放后再启动高亮
      state.words = previewText.split(/(\s+|[，。、；：！？.,;:!?])/g).filter(w => w.trim().length > 0);
      state.currentWordIndex = 0;
      playWithMimoTTS(previewText).then(() => {
        highlightNextWord();
        // 云端播放由 onended 回调处理，这里额外兜底5秒后隐藏声波
        setTimeout(() => {
          if (!state.isPlaying) els.waveContainer.classList.remove('active');
        }, 5000);
      }).catch(() => {
        els.waveContainer.classList.remove('active');
      });
    } else if (hasSpeechSupport) {
      const utt = createUtterance(previewText);
      if (utt) {
        utt.onend = () => {
          els.waveContainer.classList.remove('active');
        };
        speechSynthesis.speak(utt);
      }
    } else {
      // 无语音支持时模拟3秒
      setTimeout(() => {
        els.waveContainer.classList.remove('active');
      }, 3000);
    }
  }

  // ==================== 逐词高亮逻辑 ====================

  function highlightNextWord() {
    if (!state.isPlaying || state.isPaused) return;
    if (state.currentWordIndex >= state.words.length) {
      // 高亮结束，等语音合成 onend 回调来 stopPlay
      return;
    }

    renderHighlight(state.currentWordIndex);
    state.currentWordIndex++;

    const delay = HIGHLIGHT_SPEED_MAP[state.speed] || HIGHLIGHT_SPEED_MAP.normal;
    state.highlightTimer = setTimeout(highlightNextWord, delay);
  }

  function resumeHighlight() {
    highlightNextWord();
    // 恢复云端音频播放
    if (useMimoCloudTTS() && currentAudio && currentAudio.paused) {
      currentAudio.play().catch(err => console.warn('[voice-read] 恢复播放失败:', err));
    }
  }

  function renderHighlight(index) {
    const words = state.words;
    const html = words.map((w, i) => {
      if (i === index) {
        return `<span class="highlight" id="current-word">${escapeHtml(w)}</span>`;
      }
      return escapeHtml(w);
    }).join('');
    els.textPreview.innerHTML = html;

    // 自动滚动到当前高亮词
    const cur = els.textPreview.querySelector('#current-word');
    if (cur) {
      cur.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function clearHighlight() {
    const text = els.textPreview.innerText;
    els.textPreview.innerText = text;
  }

  function setPreviewText(text) {
    els.textPreview.innerText = text;
  }

  // ==================== 按钮状态更新 ====================

  function updatePlayButtons() {
    els.btnPlay.disabled = state.isPlaying && !state.isPaused;
    els.btnPause.disabled = !state.isPlaying || state.isPaused;
    els.btnStop.disabled = !state.isPlaying;

    // 播放按钮图标切换
    const playIcon = els.btnPlay.querySelector('.btn-icon');
    if (state.isPlaying && !state.isPaused) {
      playIcon.textContent = '🔊';
      els.btnPlay.querySelector('span:last-child').textContent = '朗读中';
    } else if (state.isPaused) {
      playIcon.textContent = '▶️';
      els.btnPlay.querySelector('span:last-child').textContent = '继续';
    } else {
      playIcon.textContent = '▶️';
      els.btnPlay.querySelector('span:last-child').textContent = '播放';
    }
  }

  // ==================== 亲情录音上传（模拟） ====================

  function initRecordUpload() {
    // 文件选择显示文件名
    els.recordFile.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        state.selectedFileName = file.name;
        els.fileBtn.textContent = `已选择：${file.name}`;
        try {
          const reader = new FileReader();
          reader.onload = function (evt) {
            state.selectedFileBase64 = evt.target.result;
          };
          reader.readAsDataURL(file);
        } catch (err) {
          console.warn('文件读取失败', err);
        }
      }
    });

    // 闹钟开关
    els.btnAlarmToggle.addEventListener('click', () => {
      state.alarmOn = !state.alarmOn;
      els.btnAlarmToggle.querySelector('span').textContent = state.alarmOn ? '已开启' : '开启';
      els.btnAlarmToggle.classList.toggle('primary', state.alarmOn);
      if (navigator.vibrate) navigator.vibrate(20);
    });

    // 保存录音设置
    els.btnSaveRecord.addEventListener('click', () => {
      const name = els.recordName.value.trim();
      if (!name) {
        showToast('请输入录音名称');
        return;
      }
      if (!state.selectedFileName) {
        showToast('请选择音频文件');
        return;
      }

      const record = {
        id: Date.now(),
        name: name,
        fileName: state.selectedFileName,
        alarmTime: els.alarmTime.value,
        alarmOn: state.alarmOn,
        createdAt: new Date().toLocaleString('zh-CN')
      };

      let records = [];
      try {
        const raw = localStorage.getItem(RECORDS_KEY);
        if (raw) records = JSON.parse(raw);
      } catch (e) { /* ignore */ }
      records.push(record);
      localStorage.setItem(RECORDS_KEY, JSON.stringify(records));

      showToast('录音设置已保存');
      renderSavedRecords();

      // 重置表单
      els.recordName.value = '';
      els.recordFile.value = '';
      state.selectedFileName = '';
      els.fileBtn.textContent = '点击选择音频文件';
      state.alarmOn = false;
      els.btnAlarmToggle.querySelector('span').textContent = '开启';
      els.btnAlarmToggle.classList.remove('primary');
    });

    renderSavedRecords();
  }

  function renderSavedRecords() {
    let records = [];
    try {
      const raw = localStorage.getItem(RECORDS_KEY);
      if (raw) records = JSON.parse(raw);
    } catch (e) { /* ignore */ }

    if (records.length === 0) {
      els.savedRecords.innerHTML = '';
      return;
    }

    els.savedRecords.innerHTML = records.map(r => `
      <div class="record-item" data-id="${r.id}">
        <div class="record-item-info">
          <div><strong>${escapeHtml(r.name)}</strong></div>
          <div style="font-size:14px;color:var(--text-sub);margin-top:4px;">
            ${escapeHtml(r.fileName)} · 闹钟 ${r.alarmOn ? r.alarmTime : '未开启'}
          </div>
        </div>
        <div class="record-item-actions">
          <button onclick="playFamilyRecord(${r.id})" title="播放">▶️</button>
          <button onclick="deleteFamilyRecord(${r.id})" title="删除">🗑️</button>
        </div>
      </div>
    `).join('');
  }

  // 全局暴露，供内联onclick调用
  window.playFamilyRecord = function (id) {
    showToast('播放亲情录音（模拟）');
    els.waveContainer.classList.add('active');
    setTimeout(() => els.waveContainer.classList.remove('active'), 4000);
  };

  window.deleteFamilyRecord = function (id) {
    let records = [];
    try {
      const raw = localStorage.getItem(RECORDS_KEY);
      if (raw) records = JSON.parse(raw);
    } catch (e) { /* ignore */ }
    records = records.filter(r => r.id !== id);
    localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
    renderSavedRecords();
    showToast('已删除');
  };

  // ==================== 工具函数 ====================

  function getDialectLabel(key) {
    const map = {
      mandarin: '普通话',
      shandong: '山东话',
      northern: '北方官话',
      sichuan: '四川话',
      cantonese: '粤语',
      wu: '吴语',
      henan: '河南话'
    };
    return map[key] || key;
  }

  function getSpeedLabel(key) {
    const map = { slow: '慢速', normal: '标准', fast: '快速' };
    return map[key] || key;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function showToast(msg) {
    let toast = document.getElementById('yytoast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'yytoast';
      toast.style.cssText = `
        position: fixed;
        bottom: 80px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(45,45,45,0.92);
        color: #fff;
        padding: 14px 28px;
        border-radius: 12px;
        font-size: var(--fs-base);
        z-index: 9999;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.3s ease;
        white-space: nowrap;
      `;
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.style.opacity = '0';
    }, 2200);
  }

  // ==================== 操作按钮事件绑定 ====================

  function initActionButtons() {
    els.btnPreview.addEventListener('click', previewVoice);
    els.btnPlay.addEventListener('click', startPlay);
    els.btnPause.addEventListener('click', pausePlay);
    els.btnStop.addEventListener('click', stopPlay);
  }

  // ==================== 初始化入口 ====================

  function init() {
    loadSettings();
    syncUI();
    initDialect();
    initGender();
    initSpeed();
    initGlobalToggle();
    initActionButtons();
    initRecordUpload();

    // 预加载语音列表（某些浏览器需要异步加载）
    if (hasSpeechSupport) {
      speechSynthesis.getVoices();
      speechSynthesis.onvoiceschanged = () => {
        speechSynthesis.getVoices();
      };
    }

    // 页面可见性变化时暂停（切后台礼貌暂停）
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && state.isPlaying && !state.isPaused) {
        pausePlay();
      }
    });

    const modeTip = useMimoCloudTTS()
      ? '（已启用小米 MiMo 云端 TTS）'
      : (hasSpeechSupport ? '（本地语音合成已就绪）' : '（当前浏览器不支持语音合成）');
    console.log('[voice-read] 方言朗读模块初始化完成' + modeTip);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
