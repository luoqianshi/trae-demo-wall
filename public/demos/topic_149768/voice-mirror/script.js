/**
 * 声临其境 - 云端声音训练与实时模拟器
 * 核心交互逻辑
 */

/* ============================================
   DOM 引用
   ============================================ */
const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const fileDuration = document.getElementById('fileDuration');
const btnRemove = document.getElementById('btnRemove');

const statusIdle = document.getElementById('statusIdle');
const statusTraining = document.getElementById('statusTraining');
const statusDone = document.getElementById('statusDone');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const btnTrain = document.getElementById('btnTrain');

const textInput = document.getElementById('textInput');
const charCount = document.getElementById('charCount');
const currentVoice = document.getElementById('currentVoice');
const btnSynthesize = document.getElementById('btnSynthesize');
const audioPlayer = document.getElementById('audioPlayer');
const playingAnim = document.getElementById('playingAnim');

const historyList = document.getElementById('historyList');
const historyCount = document.getElementById('historyCount');
const historyEmpty = document.getElementById('historyEmpty');

const toast = document.getElementById('toast');

/* ============================================
   状态管理
   ============================================ */
const state = {
    uploadedFile: null,       // 当前上传的音频文件
    fileDurationSec: 0,       // 音频时长（秒）
    isTrained: false,         // 是否已完成训练
    activeVoice: null,        // 当前激活的声音对象
    isTraining: false,        // 是否正在训练中
    isPlaying: false,         // 是否正在播放合成语音
    voices: [],               // 声音库列表
    trainingTimer: null,      // 训练进度定时器
};

/* ============================================
   工具函数
   ============================================ */

/** 显示 Toast 消息 */
function showToast(message, type = '') {
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

/** 格式化时长 */
function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    if (mins > 0) {
        return `${mins} 分 ${secs} 秒`;
    }
    return `${secs} 秒`;
}

/** 格式化日期 */
function formatDate(timestamp) {
    const d = new Date(timestamp);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 生成唯一 ID */
function generateId() {
    return 'voice_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
}

/* ============================================
   文件上传
   ============================================ */

// 点击上传
uploadZone.addEventListener('click', () => {
    if (state.isTraining) return;
    fileInput.click();
});

// 文件选择
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
});

// 拖拽上传
uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!state.isTraining) {
        uploadZone.classList.add('drag-over');
    }
});

uploadZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    uploadZone.classList.remove('drag-over');
});

uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    uploadZone.classList.remove('drag-over');
    if (state.isTraining) return;
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
});

/** 处理音频文件 */
function handleFile(file) {
    // 格式验证
    const validTypes = ['audio/wav', 'audio/mpeg', 'audio/wave', 'audio/x-wav', 'audio/mp3'];
    const ext = file.name.split('.').pop().toLowerCase();
    if (!validTypes.includes(file.type) && !['wav', 'mp3'].includes(ext)) {
        showToast('仅支持 WAV / MP3 格式的音频文件', 'error');
        return;
    }

    // 大小验证 (20MB)
    if (file.size > 20 * 1024 * 1024) {
        showToast('文件大小不能超过 20MB', 'error');
        return;
    }

    // 读取时长
    const audio = new Audio();
    const url = URL.createObjectURL(file);
    audio.src = url;

    audio.addEventListener('loadedmetadata', () => {
        state.fileDurationSec = audio.duration;
        fileDuration.textContent = `时长：${formatDuration(audio.duration)}`;
        URL.revokeObjectURL(url);
    });

    audio.addEventListener('error', () => {
        fileDuration.textContent = '时长：未知';
        URL.revokeObjectURL(url);
    });

    // 更新状态
    state.uploadedFile = file;
    state.isTrained = false;
    fileName.textContent = file.name;
    fileInfo.style.display = 'block';
    uploadZone.style.display = 'none';

    // 更新 UI
    btnTrain.disabled = false;
    textInput.disabled = true;
    btnSynthesize.disabled = true;
    resetTraining();
    resetSynthesis();

    showToast('音频文件上传成功', 'success');
}

// 移除文件
btnRemove.addEventListener('click', () => {
    state.uploadedFile = null;
    state.fileDurationSec = 0;
    state.isTrained = false;
    fileInfo.style.display = 'none';
    uploadZone.style.display = 'block';
    fileInput.value = '';

    btnTrain.disabled = true;
    textInput.disabled = true;
    btnSynthesize.disabled = true;
    resetTraining();
    resetSynthesis();

    showToast('已移除音频文件');
});

/* ============================================
   训练模拟
   ============================================ */

btnTrain.addEventListener('click', startTraining);

function startTraining() {
    if (state.isTraining || !state.uploadedFile) return;

    state.isTraining = true;
    btnTrain.disabled = true;
    textInput.disabled = true;
    btnSynthesize.disabled = true;

    // 显示训练状态
    statusIdle.style.display = 'none';
    statusDone.style.display = 'none';
    statusTraining.style.display = 'block';
    progressFill.style.width = '0%';
    progressText.textContent = '训练中... 0%';

    // 模拟训练进度
    const totalDuration = 5000; // 5秒
    const interval = 50;        // 50ms 更新一次
    const steps = totalDuration / interval;
    let step = 0;

    state.trainingTimer = setInterval(() => {
        step++;
        const progress = Math.min(Math.round((step / steps) * 100), 100);

        // 使用缓动函数模拟真实训练曲线
        const easedProgress = easeInOutCubic(step / steps) * 100;
        progressFill.style.width = `${easedProgress}%`;
        progressText.textContent = `训练中... ${Math.round(easedProgress)}%`;

        // 更新进度条发光位置
        const glowEl = document.querySelector('.progress-glow');
        if (glowEl) {
            glowEl.style.width = `${easedProgress}%`;
        }

        if (step >= steps) {
            clearInterval(state.trainingTimer);
            state.trainingTimer = null;
            completeTraining();
        }
    }, interval);
}

/** 缓动函数 */
function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** 完成训练 */
function completeTraining() {
    state.isTraining = false;
    state.isTrained = true;

    // 切换显示
    statusTraining.style.display = 'none';
    statusDone.style.display = 'block';

    // 启用合成
    textInput.disabled = false;
    btnSynthesize.disabled = false;
    textInput.focus();

    // 保存到声音库
    const voiceName = state.uploadedFile.name.replace(/\.[^/.]+$/, '');
    const newVoice = {
        id: generateId(),
        name: voiceName,
        duration: state.fileDurationSec,
        date: Date.now(),
        isDemo: false,
    };
    state.voices.unshift(newVoice);
    state.activeVoice = newVoice;
    currentVoice.textContent = voiceName;
    saveVoices();
    renderHistory();
    highlightActiveVoice();

    showToast('声音模型训练完成！', 'success');
}

/** 重置训练状态 */
function resetTraining() {
    clearInterval(state.trainingTimer);
    state.trainingTimer = null;
    state.isTraining = false;
    statusIdle.style.display = 'block';
    statusTraining.style.display = 'none';
    statusDone.style.display = 'none';
    progressFill.style.width = '0%';
    progressText.textContent = '训练中... 0%';
}

/* ============================================
   语音合成
   ============================================ */

btnSynthesize.addEventListener('click', synthesizeVoice);

// 字数统计
textInput.addEventListener('input', () => {
    const len = textInput.value.length;
    charCount.textContent = `${len} / 500`;
    if (len > 480) {
        charCount.style.color = '#ef4444';
    } else {
        charCount.style.color = '';
    }
});

function synthesizeVoice() {
    const text = textInput.value.trim();
    if (!text || !state.isTrained || state.isPlaying) return;

    if (!('speechSynthesis' in window)) {
        showToast('您的浏览器不支持语音合成功能', 'error');
        return;
    }

    state.isPlaying = true;
    btnSynthesize.disabled = true;
    btnSynthesize.textContent = '合成中...';

    // 显示播放动画
    audioPlayer.style.display = 'flex';

    // 使用 Web Speech API 进行语音合成
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // 尝试选择中文语音
    const voices = speechSynthesis.getVoices();
    const zhVoice = voices.find(v => v.lang.startsWith('zh'));
    if (zhVoice) {
        utterance.voice = zhVoice;
    }

    utterance.onstart = () => {
        btnSynthesize.textContent = '播放中...';
        playingAnim.style.display = 'flex';
        audioPlayer.querySelector('.playing-text').textContent =
            `正在播放：${text.length > 20 ? text.substring(0, 20) + '...' : text}`;
    };

    utterance.onend = () => {
        resetSynthesisState();
    };

    utterance.onerror = (e) => {
        console.warn('语音合成错误:', e);
        resetSynthesisState();
        // 如果语音合成失败，使用 Web Audio API 生成提示音
        playFallbackTone();
    };

    speechSynthesis.speak(utterance);
}

/** 重置合成状态 */
function resetSynthesisState() {
    state.isPlaying = false;
    btnSynthesize.disabled = false;
    btnSynthesize.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
        合成语音`;
    audioPlayer.style.display = 'none';
    playingAnim.style.display = 'none';
}

/** 重置合成区 */
function resetSynthesis() {
    resetSynthesisState();
    textInput.value = '';
    charCount.textContent = '0 / 500';
    audioPlayer.style.display = 'none';
}

/** Web Audio API 备用提示音 */
function playFallbackTone() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();

        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.15);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.3);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + i * 0.15);
            osc.stop(ctx.currentTime + i * 0.15 + 0.3);
        });

        showToast('使用内置合成引擎播放', 'success');
    } catch (e) {
        console.warn('Web Audio API 不可用:', e);
    }
}

/* ============================================
   声音库管理
   ============================================ */

/** 预置 Demo 声音 */
const DEMO_VOICE = {
    id: 'demo_voice_001',
    name: 'Demo 演示声音',
    duration: 12.5,
    date: Date.now() - 86400000,
    isDemo: true,
};

/** 初始化声音库 */
function initVoices() {
    const saved = localStorage.getItem('voiceMirror_voices');
    if (saved) {
        try {
            state.voices = JSON.parse(saved);
        } catch (e) {
            state.voices = [];
        }
    }

    // 确保 Demo 声音存在
    const hasDemo = state.voices.some(v => v.id === DEMO_VOICE.id);
    if (!hasDemo) {
        state.voices.unshift(DEMO_VOICE);
        saveVoices();
    }

    // 默认激活 Demo
    if (!state.activeVoice) {
        state.activeVoice = state.voices.find(v => v.id === DEMO_VOICE.id) || state.voices[0];
    }
}

/** 保存声音库 */
function saveVoices() {
    try {
        localStorage.setItem('voiceMirror_voices', JSON.stringify(state.voices));
    } catch (e) {
        console.warn('localStorage 存储失败:', e);
    }
}

/** 渲染声音库列表 */
function renderHistory() {
    if (state.voices.length === 0) {
        historyList.style.display = 'none';
        historyEmpty.style.display = 'block';
        historyCount.textContent = '0 个声音';
        return;
    }

    historyList.style.display = 'flex';
    historyEmpty.style.display = 'none';
    historyCount.textContent = `${state.voices.length} 个声音`;

    historyList.innerHTML = state.voices.map(voice => `
        <div class="history-item ${state.activeVoice && state.activeVoice.id === voice.id ? 'active' : ''}"
             data-id="${voice.id}">
            <div class="history-item-avatar">
                ${voice.name.charAt(0).toUpperCase()}
            </div>
            <div class="history-item-info">
                <span class="history-item-name">${escapeHtml(voice.name)}</span>
                <span class="history-item-date">${formatDate(voice.date)} · ${formatDuration(voice.duration)}</span>
            </div>
            <span class="history-item-badge ${voice.isDemo ? 'demo' : ''}">
                ${voice.isDemo ? 'Demo' : '已训练'}
            </span>
        </div>
    `).join('');

    // 绑定点击事件
    historyList.querySelectorAll('.history-item').forEach(item => {
        item.addEventListener('click', () => {
            const voiceId = item.dataset.id;
            const voice = state.voices.find(v => v.id === voiceId);
            if (voice) {
                switchVoice(voice);
            }
        });
    });
}

/** 切换声音 */
function switchVoice(voice) {
    state.activeVoice = voice;
    state.isTrained = true;
    currentVoice.textContent = voice.name;

    // 更新 UI
    textInput.disabled = false;
    btnSynthesize.disabled = false;
    resetSynthesis();

    highlightActiveVoice();
    showToast(`已切换至：${voice.name}`, 'success');
}

/** 高亮当前激活的声音 */
function highlightActiveVoice() {
    historyList.querySelectorAll('.history-item').forEach(item => {
        item.classList.toggle('active', item.dataset.id === state.activeVoice?.id);
    });
}

/** HTML 转义 */
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/* ============================================
   初始化
   ============================================ */
function init() {
    initVoices();
    renderHistory();

    // 默认激活 Demo 声音
    if (state.activeVoice) {
        currentVoice.textContent = state.activeVoice.name;
        state.isTrained = true;
        textInput.disabled = false;
        btnSynthesize.disabled = false;
    }

    // 预加载语音列表（SpeechSynthesis 需要用户交互后才能获取）
    if ('speechSynthesis' in window) {
        speechSynthesis.getVoices();
        speechSynthesis.onvoiceschanged = () => {
            speechSynthesis.getVoices();
        };
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);

// 页面卸载时清理
window.addEventListener('beforeunload', () => {
    clearInterval(state.trainingTimer);
    if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
    }
});