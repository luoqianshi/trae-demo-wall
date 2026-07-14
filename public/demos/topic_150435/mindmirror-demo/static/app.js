/**
 * 心镜 MindMirror — 前端交互引擎
 * 功能：DeepFace面部情绪识别 + Web Audio语音分析 + 情绪融合 + 聊天 + 情绪轨迹可视化
 */

// ==================== 全局状态 ====================
const State = {
  sessionId: null,
  cameraOn: false,
  micOn: false,
  faceEmotion: '',        // 当前表情情绪
  voiceEmotion: '',       // 当前语音情绪
  textEmotion: '',        // 当前文本情绪
  fusedEmotion: 'neutral',
  fusedIntensity: 0,
  trend: 'stable',
  history: [],
  emotionSamples: [],     // 情绪轨迹采样
  lastEmotions: [],       // 最近几帧情绪，用于趋势计算
  faceMesh: null,
  camera: null,
  audioContext: null,
  analyser: null,
  micStream: null,
  pitchBuffer: [],
  lastSampleTime: 0,
};

// ==================== DeepFace 面部识别（后端分析）====================
let faceWS = null;              // WebSocket 连接
let faceFrameTimer = null;      // 定时采集帧的 timer
let faceReconnectAttempts = 0;  // 重连次数

// 情绪中文名映射
const EMOTION_CN = {
  happy: '快乐', sad: '悲伤', angry: '愤怒', surprised: '惊讶',
  fearful: '恐惧', disgusted: '厌恶', neutral: '中性', anxious: '焦虑'
};

const EMOTION_COLORS = {
  happy: '#6B9080', sad: '#5B7B9A', angry: '#C75B5B', surprised: '#D4915D',
  fearful: '#9B6B9E', disgusted: '#8B7355', neutral: '#7A736B', anxious: '#C08497'
};

// ==================== DOM 元素 ====================
const $ = id => document.getElementById(id);
const video = $('video');
const faceCanvas = $('face-canvas');
const chatMessages = $('chat-messages');
const chatInput = $('chat-input');

// ==================== 会话管理 ====================
async function startNewSession() {
  try {
    const res = await fetch('/api/session/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: 'default' })
    });
    const data = await res.json();
    State.sessionId = data.session_id;
    $('session-info').textContent = `会话 ${State.sessionId}`;
    State.emotionSamples = [];
    State.history = [];
    drawTrajectory();
  } catch (e) {
    console.error('启动会话失败:', e);
  }
}

// ==================== 表情识别 (DeepFace 后端分析) ====================
// updateFaceEmotion 由后端 DeepFace WebSocket 回调调用

// 平滑缓冲（最近5帧）
const faceEmotionHistory = [];
// 表情 UI 更新节流时间戳（避免 60fps 进度条变化引起布局重排）
let lastFaceUIUpdate = 0;
function updateFaceEmotion(emotion) {
  faceEmotionHistory.push(emotion);
  if (faceEmotionHistory.length > 5) faceEmotionHistory.shift();

  // 取最近几帧的平均分数
  const avgScores = {};
  const labels = ['happy', 'sad', 'angry', 'surprised', 'fearful', 'disgusted', 'neutral'];
  for (const label of labels) {
    avgScores[label] = faceEmotionHistory.reduce((sum, e) => sum + (e.scores[label] || 0), 0) / faceEmotionHistory.length;
  }

  // 找最高分
  let maxLabel = 'neutral';
  let maxScore = 0;
  for (const [label, score] of Object.entries(avgScores)) {
    if (score > maxScore) {
      maxScore = score;
      maxLabel = label;
    }
  }

  State.faceEmotion = maxLabel;

  // UI 更新节流：每 100ms 才刷新一次 DOM，避免 60fps 进度条/文本变化引起布局重排（页面抖动）
  if (Date.now() - lastFaceUIUpdate > 100) {
    lastFaceUIUpdate = Date.now();
    $('face-emotion-label').textContent = EMOTION_CN[maxLabel] || '中性';
    $('face-emotion-label').style.color = EMOTION_COLORS[maxLabel] || '#7A736B';
    updateEmotionBars(avgScores);
  }

  // 触发融合（融合内部也有节流）
  fuseEmotions();
}

function updateEmotionBars(scores) {
  const container = $('face-emotion-bars');
  const labels = [
    ['happy', '快乐'], ['sad', '悲伤'], ['angry', '愤怒'],
    ['surprised', '惊讶'], ['fearful', '恐惧'], ['neutral', '中性']
  ];

  if (container.children.length === 0) {
    // 初始化条
    for (const [key, name] of labels) {
      const item = document.createElement('div');
      item.className = 'emotion-bar-item';
      item.innerHTML = `
        <span class="emotion-bar-name">${name}</span>
        <div class="emotion-bar-track">
          <div class="emotion-bar-fill" id="bar-face-${key}" style="width:0%; background:${EMOTION_COLORS[key]}"></div>
        </div>
        <span class="emotion-bar-pct" id="pct-face-${key}">0%</span>
      `;
      container.appendChild(item);
    }
  }

  // 更新数值
  for (const [key, name] of labels) {
    const pct = Math.round((scores[key] || 0) * 100);
    const bar = $(`bar-face-${key}`);
    const pctEl = $(`pct-face-${key}`);
    if (bar) bar.style.width = pct + '%';
    if (pctEl) pctEl.textContent = pct + '%';
  }
}

// ==================== 语音分析 (Web Audio API) ====================
async function initMicrophone() {
  try {
    // 检查浏览器是否支持 getUserMedia
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('浏览器不支持麦克风访问 (getUserMedia)');
    }

    State.micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        channelCount: 1,
        sampleRate: 16000
      }
    });

    // AudioContext 需要在用户交互后创建
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      throw new Error('浏览器不支持 Web Audio API');
    }
    State.audioContext = new AudioContextClass();

    // 某些浏览器需要 resume
    if (State.audioContext.state === 'suspended') {
      await State.audioContext.resume();
    }

    const source = State.audioContext.createMediaStreamSource(State.micStream);
    State.analyser = State.audioContext.createAnalyser();
    State.analyser.fftSize = 2048;
    State.analyser.smoothingTimeConstant = 0.8;
    source.connect(State.analyser);

    State.micOn = true;
    $('voice-status').textContent = '已开启';
    $('voice-status').className = 'status-badge status-on';
    $('btn-record').disabled = false;
    $('btn-mic').textContent = '关闭麦克风';

    // 开始循环分析
    analyzeVoiceLoop();
    return true;
  } catch (e) {
    console.error('麦克风初始化失败:', e.name, e.message);

    let errMsg = '麦克风无法访问';
    if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
      errMsg = '麦克风权限被拒绝';
    } else if (e.name === 'NotFoundError' || e.name === 'DevicesNotFoundError') {
      errMsg = '未找到麦克风设备';
    } else if (e.name === 'NotReadableError') {
      errMsg = '麦克风被其他程序占用';
    } else if (e.name === 'NotSupportedError') {
      errMsg = '浏览器不支持麦克风（需要 HTTPS 或 localhost）';
    }

    $('voice-status').textContent = errMsg;
    $('voice-status').className = 'status-badge status-error';

    // 在录音提示区域显示错误
    const hint = $('recording-hint');
    hint.style.display = 'block';
    hint.textContent = '❌ ' + errMsg + '：' + e.message;
    hint.style.background = 'rgba(199, 91, 91, 0.15)';
    hint.style.color = '#C75B5B';

    setTimeout(() => { hint.style.display = 'none'; }, 5000);
    return false;
  }
}

function stopMicrophone() {
  if (State.micStream) {
    State.micStream.getTracks().forEach(t => t.stop());
    State.micStream = null;
  }
  if (State.audioContext) {
    State.audioContext.close();
    State.audioContext = null;
  }
  State.micOn = false;
  State.analyser = null;
  State.voiceEmotion = '';
  // 清空分析状态，避免下次开启时残留旧数据
  voiceFrameBuffer.length = 0;
  voiceLabelHistory.length = 0;
  smoothedVoice = { label: 'neutral', intensity: 0.1 };
  $('voice-status').textContent = '未开启';
  $('voice-status').className = 'status-badge status-off';
  $('btn-mic').textContent = '开启麦克风';
  $('voice-emotion-label').textContent = '—';
  updateVoiceMetrics(0, 0, 0);
}

function analyzeVoiceLoop() {
  if (!State.micOn || !State.analyser) return;

  const analyser = State.analyser;
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  const timeData = new Float32Array(bufferLength);

  analyser.getByteFrequencyData(dataArray);
  analyser.getFloatTimeDomainData(timeData);

  // 1. 单帧能量 (RMS)
  let sumSquares = 0;
  for (let i = 0; i < timeData.length; i++) {
    sumSquares += timeData[i] * timeData[i];
  }
  const rms = Math.sqrt(sumSquares / timeData.length);
  const energy = Math.min(1, rms * 8);

  // 静音检测：能量太低时清零显示（不重置 State.voiceEmotion，由后端 SenseVoice 管理）
  if (energy < 0.01) {
    // UI 更新节流：避免 60fps 文本变化引起布局重排（页面抖动）
    if (Date.now() - lastVoiceUIUpdate > 100) {
      lastVoiceUIUpdate = Date.now();
      updateVoiceMetrics(0, 0, 0);
      $('voice-emotion-label').textContent = '静音';
      $('voice-emotion-label').style.color = '#7A736B';
      fuseEmotions();
    }
    requestAnimationFrame(analyzeVoiceLoop);
    return;
  }

  // 2. 估计基频 F0（自相关法，返回 pitch + clarity 清晰度）
  const pitchResult = estimatePitch(timeData, State.audioContext.sampleRate);
  const pitch = pitchResult.pitch;
  const clarity = pitchResult.clarity;

  // 3. 累积到滑动窗口（2 秒 ≈ 120 帧 @ 60fps，更稳定的统计）
  voiceFrameBuffer.push({ energy, pitch, clarity, t: Date.now() });
  if (voiceFrameBuffer.length > 120) voiceFrameBuffer.shift();

  // 4. 从窗口统计特征推断情绪（需要至少 30 帧 ≈ 0.5 秒数据）
  let displayPitch = pitch;
  let displayEnergy = energy;
  let displayActivity = 0;
  let voiceEmotion = { label: 'neutral', intensity: 0.1 };

  if (voiceFrameBuffer.length >= 30) {
    const stats = computeVoiceStats(voiceFrameBuffer);
    displayPitch = stats.pitchMean;
    displayEnergy = stats.energyMean;
    displayActivity = stats.activity;
    voiceEmotion = inferVoiceEmotionFromStats(stats);
  } else {
    // 数据不足时用即时值兜底
    displayPitch = pitch;
    displayEnergy = energy;
  }

  // 5. EMA 平滑 intensity，避免跳变
  smoothedVoice.intensity = smoothedVoice.intensity * 0.7 + voiceEmotion.intensity * 0.3;

  // 标签防抖：滑动窗口多数投票（15 帧 ≈ 250ms）
  // 每帧将当前标签推入历史，取出现次数最多的标签作为输出
  // 比"连续N帧一致"更鲁棒：允许偶尔1-2帧不同，不会重置计数导致标签卡死
  voiceLabelHistory.push(voiceEmotion.label);
  if (voiceLabelHistory.length > 15) voiceLabelHistory.shift();

  // 统计窗口内各标签出现次数
  const labelCounts = {};
  for (const lbl of voiceLabelHistory) {
    labelCounts[lbl] = (labelCounts[lbl] || 0) + 1;
  }
  // 取出现次数最多的标签
  let bestLabel = smoothedVoice.label;
  let bestCount = 0;
  for (const [lbl, cnt] of Object.entries(labelCounts)) {
    if (cnt > bestCount) { bestCount = cnt; bestLabel = lbl; }
  }
  // 新标签需占窗口 40% 以上才切换（避免偶尔的噪声帧触发切换）
  if (bestCount >= Math.ceil(voiceLabelHistory.length * 0.4)) {
    smoothedVoice.label = bestLabel;
  }

  // voiceEmotion 现在由后端 SenseVoice 返回时与前端声学特征融合
  // 缓存前端声学情绪推断结果，供 fuseVoiceEmotion 使用
  if (voiceFrameBuffer.length >= 30) {
    lastAcousticEmotion = {
      label: voiceEmotion.label,
      confidence: voiceEmotion.confidence || 0,
      ts: Date.now()
    };
  }

  // UI 更新节流：每 100ms 才刷新一次 DOM，避免 60fps 文本变化引起布局重排（页面抖动）
  if (Date.now() - lastVoiceUIUpdate > 100) {
    lastVoiceUIUpdate = Date.now();
    updateVoiceMetrics(displayPitch, displayEnergy, displayActivity);
    // 触发融合（voiceEmotion 由后端 /ws/speech 返回时更新）
    fuseEmotions();
  }

  // 继续循环
  requestAnimationFrame(analyzeVoiceLoop);
}

function estimatePitch(samples, sampleRate) {
  // 归一化自相关法（NCC）：值域 [-1,1]，与音量无关
  // 改进：1) 去DC偏置 2) 抛物线插值提高精度 3) octave校正避免倍频误判 4) 阈值提高
  const minPeriod = Math.floor(sampleRate / 500); // 500 Hz max
  const maxPeriod = Math.floor(sampleRate / 80);   // 80 Hz min

  // 1. 去DC偏置（中心化），避免直流分量污染自相关
  let mean = 0;
  for (let i = 0; i < samples.length; i++) mean += samples[i];
  mean /= samples.length;
  const centered = new Float32Array(samples.length);
  let totalEnergy = 0;
  for (let i = 0; i < samples.length; i++) {
    centered[i] = samples[i] - mean;
    totalEnergy += centered[i] * centered[i];
  }
  if (totalEnergy < 0.5) return { pitch: 0, clarity: 0 };

  // 2. 计算各周期的 NCC，记录前几个候选峰
  let maxCorr = 0;
  let bestPeriod = 0;
  const energyFull = totalEnergy;

  for (let period = minPeriod; period < maxPeriod && period < centered.length / 2; period++) {
    let corr = 0;
    let energyShifted = 0;
    for (let i = 0; i < centered.length - period; i++) {
      corr += centered[i] * centered[i + period];
      energyShifted += centered[i + period] * centered[i + period];
    }
    const denom = Math.sqrt(energyFull * energyShifted);
    const ncc = denom > 0 ? corr / denom : 0;
    if (ncc > maxCorr) {
      maxCorr = ncc;
      bestPeriod = period;
    }
  }

  if (bestPeriod === 0 || maxCorr < 0.5) return { pitch: 0, clarity: 0 };

  // 3. 抛物线插值：用最佳周期及左右邻域的 NCC 拟合抛物线，得到亚样本精度
  let refinedPeriod = bestPeriod;
  if (bestPeriod > minPeriod && bestPeriod < maxPeriod - 1) {
    let corrL = 0, corrC = 0, corrR = 0;
    let eL = 0, eC = 0, eR = 0;
    for (let i = 0; i < centered.length - bestPeriod; i++) {
      corrC += centered[i] * centered[i + bestPeriod];
      eC += centered[i + bestPeriod] * centered[i + bestPeriod];
    }
    for (let i = 0; i < centered.length - (bestPeriod - 1); i++) {
      corrL += centered[i] * centered[i + bestPeriod - 1];
      eL += centered[i + bestPeriod - 1] * centered[i + bestPeriod - 1];
    }
    for (let i = 0; i < centered.length - (bestPeriod + 1); i++) {
      corrR += centered[i] * centered[i + bestPeriod + 1];
      eR += centered[i + bestPeriod + 1] * centered[i + bestPeriod + 1];
    }
    const nL = eL > 0 ? corrL / Math.sqrt(energyFull * eL) : 0;
    const nC = eC > 0 ? corrC / Math.sqrt(energyFull * eC) : 0;
    const nR = eR > 0 ? corrR / Math.sqrt(energyFull * eR) : 0;
    const denomParab = nL + nR - 2 * nC;
    if (denomParab !== 0) {
      const delta = 0.5 * (nL - nR) / denomParab;
      if (Math.abs(delta) < 1) refinedPeriod = bestPeriod + delta;
    }
  }

  // 4. Octave 校正：检查半周期（2倍频）是否也有较高相关性
  // 若半周期 NCC 接近最佳值（>0.7*maxCorr），说明可能误判到倍频，应取半周期
  const halfPeriod = Math.round(refinedPeriod / 2);
  if (halfPeriod >= minPeriod) {
    let corrHalf = 0, eHalf = 0;
    for (let i = 0; i < centered.length - halfPeriod; i++) {
      corrHalf += centered[i] * centered[i + halfPeriod];
      eHalf += centered[i + halfPeriod] * centered[i + halfPeriod];
    }
    const nccHalf = eHalf > 0 ? corrHalf / Math.sqrt(energyFull * eHalf) : 0;
    if (nccHalf > maxCorr * 0.85) {
      // 半周期相关性也很高，检查半周期的pitch是否在合理人声范围
      const halfPitch = sampleRate / halfPeriod;
      if (halfPitch > 60 && halfPitch < 400) {
        refinedPeriod = halfPeriod;
        maxCorr = nccHalf;
      }
    }
  }

  const pitch = sampleRate / refinedPeriod;
  if (pitch < 60 || pitch > 400) return { pitch: 0, clarity: 0 };
  return { pitch: Math.round(pitch), clarity: maxCorr };
}

// ==================== 基于时间窗口的语气分析 ====================
// 滑动窗口：累积 2 秒的帧数据，用统计特征推断情绪
const voiceFrameBuffer = [];
// EMA 平滑状态
let smoothedVoice = { label: 'neutral', intensity: 0.1 };
// 标签防抖：滑动窗口多数投票
const voiceLabelHistory = [];
// 个人基频长期基线（适应说话人）
const pitchBaselineHistory = [];
// 基线采样帧计数器（每 ~60 帧=1秒 采样一次，避免基线被瞬时情绪污染）
let baselineSampleCounter = 0;
// UI 更新节流时间戳（避免 60fps 文本变化引起布局重排）
let lastVoiceUIUpdate = 0;
// 前端声学情绪推断缓存（用于与后端 SenseVoice 结果融合）
let lastAcousticEmotion = { label: 'neutral', confidence: 0, ts: 0 };

function computeVoiceStats(frames) {
  // 提取 voiced 帧（用 clarity 清晰度过滤，比单纯 pitch 范围更鲁棒）
  const voicedFrames = frames.filter(f => f.clarity > 0.5 && f.pitch > 60 && f.pitch < 400);
  const validPitches = voicedFrames.map(f => f.pitch);
  const energies = frames.map(f => f.energy);

  // 能量统计
  const energyMean = energies.reduce((a, b) => a + b, 0) / energies.length;
  const energyMax = Math.max(...energies);
  const energyMin = Math.min(...energies);
  const energyRange = energyMax - energyMin;

  // 基频统计（基于 voiced 帧）
  let pitchMean = 0, pitchStd = 0, pitchRange = 0;
  if (validPitches.length >= 5) {
    pitchMean = validPitches.reduce((a, b) => a + b, 0) / validPitches.length;
    const variance = validPitches.reduce((s, p) => s + (p - pitchMean) ** 2, 0) / validPitches.length;
    pitchStd = Math.sqrt(variance);
    pitchRange = Math.max(...validPitches) - Math.min(...validPitches);

    // 基线采样改进：每 ~30 帧采样一次，但只在低活跃度时采样（避免情绪状态污染基线）
    const pitchJitterNow = pitchMean > 0 ? pitchStd / pitchMean : 0;
    const energyVarNow = energyMean > 0 ? energyRange / energyMean : 0;
    const activityNow = Math.min(1, (pitchJitterNow * 3 + energyVarNow * 0.5) / 2);
    baselineSampleCounter++;
    if (baselineSampleCounter >= 30 && activityNow < 0.3) {
      baselineSampleCounter = 0;
      pitchBaselineHistory.push(pitchMean);
      if (pitchBaselineHistory.length > 20) pitchBaselineHistory.shift();
    }
  }

  // 个人基线（中位数）；至少 5 个样本才生效，避免被初始瞬时状态污染
  let baseline = 120;
  if (pitchBaselineHistory.length >= 5) {
    const sorted = [...pitchBaselineHistory].sort((a, b) => a - b);
    baseline = sorted[Math.floor(sorted.length / 2)];
  }

  const pitchDelta = baseline > 0 ? (pitchMean - baseline) / baseline : 0;

  const pitchJitter = pitchMean > 0 ? pitchStd / pitchMean : 0;
  const energyVariability = energyMean > 0 ? energyRange / energyMean : 0;
  const activity = Math.min(1, (pitchJitter * 3 + energyVariability * 0.5) / 2);

  return {
    energyMean, energyMax, energyRange,
    pitchMean, pitchStd, pitchRange, pitchDelta,
    activity, baseline,
    validPitchCount: validPitches.length,
    voicedRatio: voicedFrames.length / frames.length
  };
}

function inferVoiceEmotionFromStats(stats) {
  const { energyMean, pitchMean, pitchStd, pitchDelta, activity, pitchRange,
          validPitchCount, voicedRatio } = stats;

  // 数据不足或 voiced 帧太少 → 中性（避免噪声/清音误判）
  if (validPitchCount < 5 || voicedRatio < 0.2) {
    return { label: 'neutral', intensity: Math.min(0.3, energyMean), confidence: 0 };
  }

  const pitchJitter = pitchMean > 0 ? pitchStd / pitchMean : 0;

  // 多维评分（基于统计特征，0-1）
  const scores = {
    angry: 0, sad: 0, surprised: 0, fearful: 0, happy: 0, anxious: 0, neutral: 0.4
  };

  // 1. 愤怒：高能量 + 高抖动 + 高活跃度
  if (energyMean > 0.25 && pitchJitter > 0.1) {
    scores.angry = Math.min(1,
      Math.max(0, energyMean - 0.25) * 3 +
      Math.max(0, pitchJitter - 0.1) * 4 +
      Math.max(0, activity - 0.25) * 2
    );
  }

  // 2. 快乐：中高能量 + 基频温和偏高 + 中等活跃 + 低抖动
  if (energyMean > 0.1 && pitchDelta > -0.05) {
    const happyPitch = Math.max(0, pitchDelta);
    const happyEnergy = Math.max(0, energyMean - 0.1);
    const happyActivity = Math.min(activity, 0.5);
    const jitterPenalty = Math.min(0.6, Math.max(0, pitchJitter - 0.08) * 4);
    scores.happy = Math.min(1,
      (happyPitch * 2.5 + happyEnergy * 2.5 + happyActivity * 1.5) * (1 - jitterPenalty)
    );
  }

  // 3. 悲伤：低能量 AND 低活跃
  if (energyMean < 0.12 && activity < 0.18) {
    scores.sad = Math.min(1,
      Math.max(0, 0.12 - energyMean) * 4 +
      Math.max(0, 0.18 - activity) * 3 +
      Math.max(0, -pitchDelta + 0.02) * 2
    );
  }

  // 4. 惊讶：基频骤高 + 较大范围
  if (pitchDelta > 0.05 && pitchRange > 40) {
    scores.surprised = Math.min(1,
      (pitchDelta - 0.05) * 3 +
      Math.min(pitchRange / 100, 1) * 1.5
    );
  }

  // 5. 恐惧：基频偏高 + 能量低 + 紧张抖动
  if (energyMean < 0.18 && pitchDelta > 0) {
    scores.fearful = Math.min(1,
      Math.max(0, 0.18 - energyMean) * 3 +
      Math.max(0, pitchDelta) * 2.5 +
      Math.min(pitchJitter, 0.3) * 2
    );
  }

  // 6. 焦虑：高活跃 + 中低能量 + 基频不稳
  if (activity > 0.18 && energyMean > 0.06 && energyMean < 0.22) {
    scores.anxious = Math.min(1,
      (activity - 0.18) * 2.5 +
      Math.max(0, 0.22 - energyMean) * 1.5 +
      Math.min(pitchJitter, 0.3) * 1.5
    );
  }

  // 取最高分情绪，记录第二名用于置信度判断
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const maxLabel = sorted[0][0];
  const maxScore = sorted[0][1];
  const secondScore = sorted[1] ? sorted[1][1] : 0;

  const intensity = Math.min(1, maxScore * 0.5 + Math.min(energyMean, 0.4) * 0.3 + activity * 0.2);
  const confidence = maxScore > 0 ? (maxScore - secondScore) / maxScore : 0;
  return { label: maxLabel, intensity, confidence, scores };
}

function fuseVoiceEmotion(senseVoiceEmotion) {
  // 后端 SenseVoice 情绪 + 前端声学情绪融合，提升识别准确率
  // 策略：
  //   1. 两者一致 → 直接用 SenseVoice 结果（高置信度）
  //   2. 前端 confidence 高且 SenseVoice 为 neutral → 用前端（SenseVoice 偶尔回退 neutral）
  //   3. 前端数据过期或 confidence 低 → 用 SenseVoice（后端更专业）
  const back = senseVoiceEmotion;
  const front = lastAcousticEmotion;

  // 前端数据过期（>3秒）或 confidence 太低 → 直接用后端
  if (Date.now() - front.ts > 3000 || front.confidence < 0.2) {
    return back;
  }

  // 两者一致 → 用后端
  if (back === front.label) {
    return back;
  }

  // 后端是 neutral 但前端明确检出其他情绪且 confidence 较高 → 用前端
  // （SenseVoice 对平淡语调容易回退 neutral，前端声学特征可补充）
  if (back === 'neutral' && front.label !== 'neutral' && front.confidence > 0.4) {
    console.log(`🎤 语音情绪融合：SenseVoice=${back} → 前端声学=${front.label} (confidence=${front.confidence.toFixed(2)})`);
    return front.label;
  }

  // 其他情况 → 信任后端 SenseVoice
  return back;
}

function updateVoiceMetrics(pitch, energy, rate) {
  // 音高
  $('val-pitch').textContent = pitch > 0 ? `${Math.round(pitch)} Hz` : '— Hz';
  $('bar-pitch').style.width = Math.min(100, (pitch / 300) * 100) + '%';

  // 能量
  $('val-energy').textContent = (energy * 100).toFixed(0) + '%';
  $('bar-energy').style.width = (energy * 100) + '%';

  // 活跃度（基频+能量变化程度）
  $('val-rate').textContent = (rate * 100).toFixed(0) + '%';
  $('bar-rate').style.width = (rate * 100) + '%';
}

// ==================== 文本情感分析 ====================
function analyzeTextEmotion(text) {
  if (!text || text.trim().length === 0) return { label: 'neutral', intensity: 0 };

  const positive = ['开心', '高兴', '快乐', '好了', '不错', '谢谢', '棒', '喜欢', '满意', '希望', '期待', '感恩', '幸福', '温暖', '放松'];
  const negative = ['难过', '伤心', '哭', '痛', '苦', '累', '烦', '气', '怕', '担心', '焦虑', '紧张', '害怕', '孤独', '绝望', '崩溃', '抑郁', '压力', '迷茫', '失望'];
  const angry = ['气死', '愤怒', '讨厌', '烦死', '受够了', '凭什么', '可恶', '骂', '打'];
  const fearful = ['害怕', '恐惧', '吓', '怕', '担心', '不安', '紧张', '慌'];
  const anxious = ['焦虑', '紧张', '着急', '急', '不安', '坐立', '心慌', '压力', '怕'];

  let scores = { happy: 0, sad: 0, angry: 0, surprised: 0, fearful: 0, disgusted: 0, neutral: 0.1, anxious: 0 };

  for (const w of positive) if (text.includes(w)) scores.happy += 0.4;
  for (const w of negative) if (text.includes(w)) scores.sad += 0.3;
  for (const w of angry) if (text.includes(w)) scores.angry += 0.5;
  for (const w of fearful) if (text.includes(w)) scores.fearful += 0.4;
  for (const w of anxious) if (text.includes(w)) scores.anxious += 0.4;

  // 惊讶标记
  if (text.includes('？') || text.includes('吗') || text.includes('怎么') || text.includes('为什么')) {
    scores.surprised += 0.15;
  }

  let maxLabel = 'neutral';
  let maxScore = 0.1;
  for (const [label, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      maxLabel = label;
    }
  }

  return { label: maxLabel, intensity: Math.min(1, maxScore) };
}

// ==================== 多模态融合 ====================
// 冲突警告防抖状态
let lastConflictState = false;
let conflictPendingCount = 0;
// 融合 UI 更新节流时间戳（无论从语音/表情/文本哪边触发，都限制为 10fps，避免抖动）
let lastFuseUIUpdate = 0;

function fuseEmotions() {
  // 各模态权重（动态调整）
  let wFace = 0.4;
  let wVoice = 0.35;
  let wText = 0.25;

  // 如果某个模态没有数据，重新分配权重
  const hasFace = State.faceEmotion && State.cameraOn;
  const hasVoice = State.voiceEmotion && State.micOn;
  const hasText = State.textEmotion;

  const total = (hasFace ? wFace : 0) + (hasVoice ? wVoice : 0) + (hasText ? wText : 0);
  if (total === 0) return;

  wFace = hasFace ? wFace / total : 0;
  wVoice = hasVoice ? wVoice / total : 0;
  wText = hasText ? wText / total : 0;

  // 构建各模态的情绪向量
  const allEmotions = ['happy', 'sad', 'angry', 'surprised', 'fearful', 'disgusted', 'neutral', 'anxious'];
  const faceVec = {};
  const voiceVec = {};
  const textVec = {};

  for (const e of allEmotions) {
    faceVec[e] = hasFace && State.faceEmotion === e ? 1 : 0;
    voiceVec[e] = hasVoice && State.voiceEmotion === e ? 1 : 0;
    textVec[e] = hasText && State.textEmotion === e ? 1 : 0;
  }

  // 融合
  const fused = {};
  for (const e of allEmotions) {
    fused[e] = faceVec[e] * wFace + voiceVec[e] * wVoice + textVec[e] * wText;
  }

  // 找到最高分情绪
  let maxLabel = 'neutral';
  let maxScore = 0;
  for (const [label, score] of Object.entries(fused)) {
    if (score > maxScore) {
      maxScore = score;
      maxLabel = label;
    }
  }

  State.fusedEmotion = maxLabel;
  State.fusedIntensity = Math.round(maxScore * 10);

  // 计算趋势
  State.lastEmotions.push(maxLabel);
  if (State.lastEmotions.length > 10) State.lastEmotions.shift();
  State.trend = calculateTrend(State.lastEmotions);

  // 冲突检测
  const emotionsSet = new Set();
  if (hasFace) emotionsSet.add(State.faceEmotion);
  if (hasVoice) emotionsSet.add(State.voiceEmotion);
  if (hasText) emotionsSet.add(State.textEmotion);

  const positiveSet = new Set(['happy', 'neutral']);
  const negativeSet = new Set(['sad', 'angry', 'fearful', 'anxious', 'disgusted']);
  let conflict = false;
  if (emotionsSet.size >= 2) {
    let hasPositive = false, hasNegative = false;
    for (const e of emotionsSet) {
      if (positiveSet.has(e)) hasPositive = true;
      if (negativeSet.has(e)) hasNegative = true;
    }
    conflict = hasPositive && hasNegative;
  }

  // 更新 UI（节流：无论语音/表情哪边触发，融合面板 DOM 更新限制为 10fps，避免抖动）
  const nowTS = Date.now();
  if (nowTS - lastFuseUIUpdate > 100) {
    lastFuseUIUpdate = nowTS;
    $('fused-emotion-label').textContent = EMOTION_CN[maxLabel] || '中性';
    $('fused-emotion-label').style.color = EMOTION_COLORS[maxLabel] || '#7A736B';
    $('fused-intensity').textContent = `强度: ${State.fusedIntensity.toFixed(1)}`;

    const trendMap = { improving: '好转 ↑', worsening: '恶化 ↓', stable: '稳定 →', fluctuating: '波动 ↕' };
    $('fused-trend').textContent = trendMap[State.trend] || '稳定';

    // 冲突警告：用 class（opacity）控制显隐，避免 display 切换引起布局重排（页面抖动）
    // 加防抖：连续 3 帧冲突状态一致才切换，避免频繁闪动
    if (conflict !== lastConflictState) {
      conflictPendingCount++;
      if (conflictPendingCount >= 3) {
        lastConflictState = conflict;
        conflictPendingCount = 0;
        $('conflict-warning').classList.toggle('visible', conflict);
      }
    } else {
      conflictPendingCount = 0;
    }
  }

  // 采样记录
  const now = Date.now();
  if (now - State.lastSampleTime > 2000) {
    State.lastSampleTime = now;
    recordEmotionSample(maxLabel, State.fusedIntensity);
  }
}

function calculateTrend(emotions) {
  if (emotions.length < 3) return 'stable';

  const positive = new Set(['happy']);
  const negative = new Set(['sad', 'angry', 'fearful', 'anxious', 'disgusted']);

  const recent = emotions.slice(-3);
  const older = emotions.slice(-6, -3);

  const recentNeg = recent.filter(e => negative.has(e)).length;
  const olderNeg = older.filter(e => negative.has(e)).length;
  const recentPos = recent.filter(e => positive.has(e)).length;
  const olderPos = older.filter(e => positive.has(e)).length;

  // 检查波动
  const changes = [];
  for (let i = 1; i < emotions.length; i++) {
    if (emotions[i] !== emotions[i - 1]) changes.push(i);
  }
  if (changes.length >= 4) return 'fluctuating';

  if (recentNeg < olderNeg || recentPos > olderPos) return 'improving';
  if (recentNeg > olderNeg || recentPos < olderPos) return 'worsening';
  return 'stable';
}

function recordEmotionSample(emotion, intensity) {
  State.emotionSamples.push({
    timestamp: Date.now(),
    emotion: emotion,
    intensity: intensity
  });
  drawTrajectory();

  if (State.sessionId) {
    fetch('/api/emotion/sample', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: State.sessionId,
        emotion: emotion,
        intensity: intensity,
        source: 'fused'
      })
    }).catch(() => {});
  }
}

// ==================== 情绪轨迹可视化 ====================
function drawTrajectory() {
  const canvas = $('trajectory-canvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  ctx.clearRect(0, 0, W, H);

  // 背景网格
  ctx.strokeStyle = '#E5DDD0';
  ctx.lineWidth = 1;
  for (let y = 0; y <= H; y += H / 5) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  // 中线
  ctx.strokeStyle = '#E5DDD0';
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(0, H / 2);
  ctx.lineTo(W, H / 2);
  ctx.stroke();
  ctx.setLineDash([]);

  if (State.emotionSamples.length < 2) {
    ctx.fillStyle = '#7A736B';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('开始对话后将实时记录情绪轨迹', W / 2, H / 2 + 5);
    return;
  }

  const samples = State.emotionSamples;
  const maxPoints = 100;
  const display = samples.slice(-maxPoints);

  const xStep = W / Math.max(maxPoints, display.length);
  const padding = 20;

  // 画负面情绪线（上方=负面，下方=正面）
  const negative = new Set(['sad', 'angry', 'fearful', 'anxious', 'disgusted']);

  ctx.lineWidth = 2.5;
  ctx.beginPath();

  for (let i = 0; i < display.length; i++) {
    const s = display[i];
    const x = i * xStep + padding;
    let y;

    if (negative.has(s.emotion)) {
      // 负面情绪在上方
      y = H / 2 - (s.intensity / 10) * (H / 2 - 10);
    } else if (s.emotion === 'happy') {
      // 正面情绪在下方
      y = H / 2 + (s.intensity / 10) * (H / 2 - 10);
    } else {
      y = H / 2;
    }

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }

  // 填充区域
  const gradient = ctx.createLinearGradient(0, 0, 0, H);
  gradient.addColorStop(0, 'rgba(192, 132, 151, 0.15)');
  gradient.addColorStop(0.5, 'rgba(122, 115, 107, 0.05)');
  gradient.addColorStop(1, 'rgba(107, 144, 128, 0.15)');
  ctx.lineTo(display.length * xStep + padding, H / 2);
  ctx.lineTo(padding, H / 2);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  // 描线
  ctx.beginPath();
  for (let i = 0; i < display.length; i++) {
    const s = display[i];
    const x = i * xStep + padding;
    let y;
    if (negative.has(s.emotion)) {
      y = H / 2 - (s.intensity / 10) * (H / 2 - 10);
    } else if (s.emotion === 'happy') {
      y = H / 2 + (s.intensity / 10) * (H / 2 - 10);
    } else {
      y = H / 2;
    }
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = '#6B9080';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // 画点
  for (let i = 0; i < display.length; i++) {
    const s = display[i];
    const x = i * xStep + padding;
    let y;
    if (negative.has(s.emotion)) {
      y = H / 2 - (s.intensity / 10) * (H / 2 - 10);
    } else if (s.emotion === 'happy') {
      y = H / 2 + (s.intensity / 10) * (H / 2 - 10);
    } else {
      y = H / 2;
    }
    ctx.fillStyle = EMOTION_COLORS[s.emotion] || '#7A736B';
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // 标签
  ctx.fillStyle = '#C08497';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('负面情绪', 5, 15);
  ctx.fillStyle = '#6B9080';
  ctx.fillText('正面情绪', 5, H - 5);
}

// ==================== 聊天交互 ====================
async function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;

  // 分析文本情绪
  const textEmotionResult = analyzeTextEmotion(text);
  State.textEmotion = textEmotionResult.label;

  // 触发融合
  fuseEmotions();

  // 显示用户消息
  addMessage('user', text, {
    face: State.faceEmotion,
    voice: State.voiceEmotion,
    text: State.textEmotion,
    fused: State.fusedEmotion,
    intensity: State.fusedIntensity
  });

  // 清空输入
  chatInput.value = '';

  // 显示加载中
  const loadingEl = addMessage('ai', '思考中...', {});

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: text,
        session_id: State.sessionId,
        face_emotion: State.faceEmotion,
        voice_emotion: State.voiceEmotion,
        text_emotion: State.textEmotion,
        fused_emotion: State.fusedEmotion,
        intensity: State.fusedIntensity,
        trend: State.trend,
        history: State.history.slice(-6)
      })
    });

    const data = await res.json();

    // 移除加载消息
    loadingEl.remove();

    // 显示 AI 回复
    addMessage('ai', data.response, {
      fused: data.emotion_analysis.label,
      intensity: data.emotion_analysis.intensity,
      strategy: data.cbt_strategy_name || data.cbt_strategy,
      crisis: data.crisis_flag
    });

    // 显示 CBT 策略标签
    if (data.cbt_strategy_name) {
      $('cbt-strategy-display').textContent = `策略: ${data.cbt_strategy_name}`;
    }

    // 更新历史
    State.history.push({ role: 'user', content: text });
    State.history.push({ role: 'assistant', content: data.response });

  } catch (e) {
    loadingEl.remove();
    addMessage('ai', '抱歉，我遇到了一些问题，请稍后再试。', {});
    console.error('发送消息失败:', e);
  }
}

function addMessage(role, content, emotionInfo) {
  const msgDiv = document.createElement('div');
  msgDiv.className = `message message-${role === 'user' ? 'user' : 'ai'}`;

  const avatar = document.createElement('div');
  avatar.className = 'message-avatar';
  avatar.textContent = role === 'user' ? '我' : '心';

  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';

  // 处理多行文本
  const lines = content.split('\n');
  for (const line of lines) {
    if (line.trim()) {
      const p = document.createElement('p');
      p.textContent = line;
      contentDiv.appendChild(p);
    }
  }

  // 情绪标签
  if (emotionInfo && (emotionInfo.fused || emotionInfo.face)) {
    const tag = document.createElement('div');
    tag.className = 'message-emotion-tag';
    const parts = [];
    if (emotionInfo.face) parts.push(`表情:${EMOTION_CN[emotionInfo.face] || emotionInfo.face}`);
    if (emotionInfo.voice) parts.push(`语气:${EMOTION_CN[emotionInfo.voice] || emotionInfo.voice}`);
    if (emotionInfo.text) parts.push(`文本:${EMOTION_CN[emotionInfo.text] || emotionInfo.text}`);
    if (emotionInfo.fused) parts.push(`综合:${EMOTION_CN[emotionInfo.fused] || emotionInfo.fused}`);
    if (emotionInfo.intensity) parts.push(`强度:${emotionInfo.intensity}`);
    if (emotionInfo.strategy) parts.push(emotionInfo.strategy);
    tag.textContent = parts.join(' · ');
    contentDiv.appendChild(tag);
  }

  // 危机标记
  if (emotionInfo && emotionInfo.crisis) {
    contentDiv.classList.add('message-crisis');
  }

  msgDiv.appendChild(avatar);
  msgDiv.appendChild(contentDiv);
  chatMessages.appendChild(msgDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  return msgDiv;
}

// ==================== 历史记录 ====================
async function loadHistory() {
  try {
    const res = await fetch('/api/sessions');
    const data = await res.json();
    const list = $('history-list');
    list.innerHTML = '';

    if (data.sessions.length === 0) {
      list.innerHTML = '<p style="color:#7A736B; text-align:center; padding:2rem;">暂无历史记录</p>';
      return;
    }

    for (const s of data.sessions) {
      const item = document.createElement('div');
      item.className = 'history-item';
      const time = new Date(s.start_time).toLocaleString('zh-CN');
      const emotion = s.dominant_emotion ? EMOTION_CN[s.dominant_emotion] || s.dominant_emotion : '—';
      const changeMap = { improved: '好转', worsened: '恶化', stable: '稳定' };
      const change = s.emotion_change ? changeMap[s.emotion_change] || s.emotion_change : '—';

      item.innerHTML = `
        <div class="history-item-top">
          <span class="history-time">${time}</span>
          <span class="history-emotion">${emotion} · ${change}</span>
        </div>
        <div class="history-summary">消息数: ${s.message_count} | ${s.summary || '无摘要'}</div>
      `;
      item.onclick = () => showSessionDetail(s.id);
      list.appendChild(item);
    }
  } catch (e) {
    console.error('加载历史失败:', e);
  }
}

async function showSessionDetail(sessionId) {
  try {
    const res = await fetch(`/api/session/${sessionId}`);
    const session = await res.json();
    const content = $('detail-content');
    content.innerHTML = '';

    for (const msg of session.messages) {
      const div = document.createElement('div');
      div.className = `detail-message detail-message-${msg.role === 'user' ? 'user' : 'ai'}`;
      div.textContent = msg.content;

      if (msg.fused_emotion || msg.cbt_strategy) {
        const info = document.createElement('div');
        info.className = 'detail-emotion-info';
        const parts = [];
        if (msg.fused_emotion) parts.push(`情绪: ${EMOTION_CN[msg.fused_emotion] || msg.fused_emotion}`);
        if (msg.emotion_intensity) parts.push(`强度: ${msg.emotion_intensity}`);
        if (msg.cbt_strategy) parts.push(`策略: ${msg.cbt_strategy}`);
        info.textContent = parts.join(' | ');
        div.appendChild(info);
      }

      content.appendChild(div);
    }

    $('detail-modal').style.display = 'flex';
  } catch (e) {
    console.error('加载详情失败:', e);
  }
}

// ==================== 事件绑定 ====================
$('btn-camera').onclick = async () => {
  if (State.cameraOn) {
    // 关闭
    stopFaceAnalysis();
    if (video.srcObject) {
      video.srcObject.getTracks().forEach(t => t.stop());
      video.srcObject = null;
    }
    State.cameraOn = false;
    State.faceEmotion = '';
    $('face-status').textContent = '未开启';
    $('face-status').className = 'status-badge status-off';
    $('btn-camera').textContent = '开启摄像头';
    $('camera-placeholder').style.display = 'flex';
    faceCanvas.getContext('2d').clearRect(0, 0, faceCanvas.width, faceCanvas.height);
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480 }
    });
    video.srcObject = stream;
    $('camera-placeholder').style.display = 'none';
    State.cameraOn = true;
    $('face-status').textContent = '连接中...';
    $('face-status').className = 'status-badge status-on';
    $('btn-camera').textContent = '关闭摄像头';

    // 连接后端 DeepFace WebSocket
    startFaceAnalysis();
  } catch (e) {
    console.error('摄像头初始化失败:', e);
    $('face-status').textContent = '权限拒绝';
    $('face-status').className = 'status-badge status-error';
  }
};

// ==================== DeepFace 面部识别（后端 WebSocket）====================

function startFaceAnalysis() {
  const wsProtocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  faceWS = new WebSocket(`${wsProtocol}//${location.host}/ws/face`);
  faceWS.binaryType = 'arraybuffer';

  faceWS.onopen = () => {
    console.log('DeepFace WebSocket 已连接');
    faceReconnectAttempts = 0;
    $('face-status').textContent = '实时识别中';
    $('face-status').className = 'status-badge status-active';
    // 开始定时采集视频帧发送到后端（2fps = 每 500ms）
    faceFrameTimer = setInterval(captureAndSendFrame, 500);
  };

  faceWS.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'emotion') {
        // 收到后端 DeepFace 分析结果
        updateFaceEmotion({
          label: data.label,
          confidence: data.confidence,
          scores: data.scores || {}
        });
      } else if (data.type === 'error') {
        // 后端模型未加载，不重连，直接提示
        console.warn('DeepFace 后端错误:', data.message);
        stopFaceAnalysis(); // 阻止重连
        $('face-status').textContent = '模型未加载';
        $('face-status').className = 'status-badge status-error';
      }
    } catch (e) {
      console.error('解析面部识别结果失败:', e);
    }
  };

  faceWS.onerror = (e) => {
    console.error('DeepFace WebSocket 错误:', e);
  };

  faceWS.onclose = () => {
    console.log('DeepFace WebSocket 已关闭');
    if (faceFrameTimer) {
      clearInterval(faceFrameTimer);
      faceFrameTimer = null;
    }
    // 自动重连（最多 3 次）；模型未加载时不重连
    if (State.cameraOn && faceReconnectAttempts < 3) {
      faceReconnectAttempts++;
      console.log(`尝试重连 (${faceReconnectAttempts}/3)...`);
      setTimeout(startFaceAnalysis, 2000);
    }
  };
}

function captureAndSendFrame() {
  if (!State.cameraOn || !faceWS || faceWS.readyState !== WebSocket.OPEN) return;
  if (!video.videoWidth) return;

  // 将视频帧绘制到 canvas（缩放到 320x240 减小传输量）
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 240;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  // 转 JPEG blob → ArrayBuffer → 发送
  canvas.toBlob((blob) => {
    if (!blob || !faceWS || faceWS.readyState !== WebSocket.OPEN) return;
    blob.arrayBuffer().then((buffer) => {
      if (faceWS && faceWS.readyState === WebSocket.OPEN) {
        faceWS.send(buffer);
      }
    });
  }, 'image/jpeg', 0.8);
}

function stopFaceAnalysis() {
  if (faceFrameTimer) {
    clearInterval(faceFrameTimer);
    faceFrameTimer = null;
  }
  if (faceWS) {
    faceWS.onclose = null; // 防止触发重连
    faceWS.close();
    faceWS = null;
  }
  faceReconnectAttempts = 0;
}

$('btn-mic').onclick = async () => {
  if (State.micOn) {
    stopMicrophone();
  } else {
    await initMicrophone();
  }
};

// ==================== 持续语音对话模式 (Vosk WebSocket 离线识别) ====================
// 使用 MediaRecorder 录制音频片段 → 发送到服务端 → Vosk 识别
let speechWS = null;
let isListening = false;
let isAITalking = false;
let currentAbortController = null;  // 用于打断 AI 回复
let finalTextBuffer = '';
let lastSendTime = 0;
let finalDebounceTimer = null;
let mediaRecorder = null;
let recordChunks = [];
let recordTimer = null;
let userStopped = false;
let reconnectAttempts = 0;
let heartbeatTimer = null;

async function startVoiceConversation() {
  console.log('startVoiceConversation called, micOn:', State.micOn);

  // 1. 确保麦克风已开启
  if (!State.micOn) {
    console.log('麦克风未开启，正在初始化...');
    const ok = await initMicrophone();
    if (!ok) {
      console.error('麦克风初始化失败');
      const hint = $('recording-hint');
      hint.style.display = 'block';
      hint.textContent = '❌ 无法访问麦克风，请检查浏览器权限设置';
      hint.style.background = 'rgba(199, 91, 91, 0.15)';
      hint.style.color = '#C75B5B';
      setTimeout(() => { hint.style.display = 'none'; }, 5000);
      return;
    }
    console.log('麦克风初始化成功');
  }

  // 2. 确保 AudioContext 处于运行状态
  if (State.audioContext && State.audioContext.state === 'suspended') {
    console.log('AudioContext 处于 suspended 状态，正在 resume...');
    await State.audioContext.resume();
  }

  userStopped = false;
  reconnectAttempts = 0;
  connectSpeechWS();
}

function connectSpeechWS() {
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${wsProtocol}//${window.location.host}/ws/speech`;
  console.log('连接 WebSocket:', wsUrl);

  try {
    speechWS = new WebSocket(wsUrl);
    speechWS.binaryType = 'arraybuffer';
  } catch (e) {
    console.error('创建 WebSocket 失败:', e);
    return;
  }

  speechWS.onopen = () => {
    console.log('✅ WebSocket 已连接，开始录音...');
    reconnectAttempts = 0;

    // 启动 PCM 音频流采集（AudioWorklet 方案）
    startPCMStream();

    isListening = true;
    $('btn-record').textContent = '关闭语音对话';
    $('btn-record').classList.add('recording');
    $('recording-hint').style.display = 'block';
    $('recording-hint').textContent = '正在聆听... 说话即可自动对话，点击按钮停止';
    $('recording-hint').style.background = 'rgba(199, 91, 91, 0.1)';
    $('recording-hint').style.color = '#C75B5B';

    // 心跳保活
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    heartbeatTimer = setInterval(() => {
      if (speechWS && speechWS.readyState === WebSocket.OPEN) {
        speechWS.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);
  };

  speechWS.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      if (data.type === 'final') {
        finalTextBuffer += data.text;
        chatInput.value = finalTextBuffer;

        // 更新语音情绪（来自 SenseVoice，与前端声学特征融合）
        if (data.emotion) {
          const fusedVoiceEmotion = fuseVoiceEmotion(data.emotion);
          State.voiceEmotion = fusedVoiceEmotion;
          $('voice-emotion-label').textContent = EMOTION_CN[fusedVoiceEmotion] || '中性';
          $('voice-emotion-label').style.color = EMOTION_COLORS[fusedVoiceEmotion] || '#7A736B';
          fuseEmotions();
        }

        // 打断机制：AI 回复期间，若用户说出新内容（≥2字）则中断当前 AI 回复
        if (isAITalking && currentAbortController && finalTextBuffer.trim().length >= 2) {
          currentAbortController.abort();
          console.log('⚡ 用户打断 AI 回复，准备发送新消息:', finalTextBuffer.trim());
        }

        // debounce：1.5秒无新文字则自动发送（SenseVoice 每3秒返回一块）
        if (finalDebounceTimer) clearTimeout(finalDebounceTimer);
        if (finalTextBuffer.trim() && !isAITalking) {
          finalDebounceTimer = setTimeout(() => {
            if (finalTextBuffer.trim() && !isAITalking) {
              const textToSend = finalTextBuffer.trim();
              lastSendTime = Date.now();
              finalTextBuffer = '';
              chatInput.value = '';
              autoSendMessage(textToSend);
            }
          }, 1500);
        }
      } else if (data.type === 'error') {
        console.warn('语音识别警告:', data.message);
      }
    } catch (e) {
      console.error('解析消息失败:', e);
    }
  };

  speechWS.onerror = (e) => {
    console.error('WebSocket 错误:', e);
  };

  speechWS.onclose = () => {
    console.log('WebSocket 已关闭');

    if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
    stopPCMStream();

    if (!userStopped && reconnectAttempts < 5) {
      reconnectAttempts++;
      const delay = Math.min(1000 * reconnectAttempts, 3000);
      console.log(`自动重连 (${reconnectAttempts}/5)，${delay}ms 后...`);
      $('recording-hint').textContent = `连接断开，正在重连(${reconnectAttempts}/5)...`;
      $('recording-hint').style.background = 'rgba(212, 145, 93, 0.15)';
      $('recording-hint').style.color = '#D4915D';

      setTimeout(() => {
        if (!userStopped) connectSpeechWS();
      }, delay);
    } else {
      isListening = false;
      $('btn-record').textContent = '开启语音对话';
      $('btn-record').classList.remove('recording');
      $('recording-hint').style.display = 'none';
      if (reconnectAttempts >= 5) {
        $('recording-hint').style.display = 'block';
        $('recording-hint').textContent = '❌ 语音连接多次断开，请重新点击按钮开始';
        $('recording-hint').style.background = 'rgba(199, 91, 91, 0.15)';
        $('recording-hint').style.color = '#C75B5B';
        reconnectAttempts = 0;
      }
    }
  };
}

// ==================== PCM 音频流采集（AudioWorklet 方案）====================
// 直接采集 16kHz 16-bit mono PCM，通过 WebSocket 发送，绕开 WebM/ffmpeg 解码
let pcmAudioContext = null;
let pcmSourceNode = null;
let pcmWorkletNode = null;
let pcmWorkletReady = false;

async function startPCMStream() {
  if (!State.micStream) {
    console.error('麦克风流不可用');
    return;
  }

  try {
    // 复用 State.audioContext，避免两个 AudioContext 冲突
    if (!State.audioContext) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      State.audioContext = new AudioContextClass();
    }
    if (State.audioContext.state === 'suspended') {
      await State.audioContext.resume();
    }
    pcmAudioContext = State.audioContext;
    console.log('PCM AudioContext 采样率:', pcmAudioContext.sampleRate);

    // 加载 AudioWorklet 处理器
    await pcmAudioContext.audioWorklet.addModule('/static/pcm-processor.js?v=7');
    pcmWorkletReady = true;
    console.log('AudioWorklet 模块已加载');

    // 创建源节点和工作节点
    pcmSourceNode = pcmAudioContext.createMediaStreamSource(State.micStream);
    pcmWorkletNode = new AudioWorkletNode(pcmAudioContext, 'pcm-processor');

    // 接收 worklet 发来的 PCM 数据，转发到 WebSocket
    pcmWorkletNode.port.onmessage = (e) => {
      if (speechWS && speechWS.readyState === WebSocket.OPEN && !userStopped) {
        speechWS.send(e.data);
      }
    };

    // 连接：source → worklet → 通过零增益节点连接到 destination（必须连接才会运行，零增益避免回声）
    pcmSourceNode.connect(pcmWorkletNode);
    const silentGain = pcmAudioContext.createGain();
    silentGain.gain.value = 0;
    pcmWorkletNode.connect(silentGain);
    silentGain.connect(pcmAudioContext.destination);

    console.log('PCM 采集已启动 (16kHz mono Int16, 增益15x)');
  } catch (e) {
    console.error('PCM 采集启动失败:', e);
    const hint = $('recording-hint');
    hint.style.display = 'block';
    hint.textContent = '❌ 音频采集启动失败：' + e.message;
    hint.style.background = 'rgba(199, 91, 91, 0.15)';
    hint.style.color = '#C75B5B';
  }
}

function stopPCMStream() {
  if (pcmSourceNode) {
    try { pcmSourceNode.disconnect(); } catch(e) {}
    pcmSourceNode = null;
  }
  if (pcmWorkletNode) {
    try { pcmWorkletNode.disconnect(); } catch(e) {}
    pcmWorkletNode = null;
  }
  // 不关闭 pcmAudioContext，因为它复用 State.audioContext
  pcmAudioContext = null;
  pcmWorkletReady = false;
}

function stopVoiceConversation() {
  userStopped = true;
  isListening = false;

  if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
  if (finalDebounceTimer) { clearTimeout(finalDebounceTimer); finalDebounceTimer = null; }
  stopPCMStream();

  if (speechWS) {
    try { speechWS.close(); } catch(e) {}
    speechWS = null;
  }

  $('btn-record').textContent = '开启语音对话';
  $('btn-record').classList.remove('recording');
  $('recording-hint').style.display = 'none';

  if (finalTextBuffer.trim()) {
    chatInput.value = finalTextBuffer;
    finalTextBuffer = '';
  }
}

$('btn-record').onclick = (e) => {
  e.preventDefault();
  if (isListening) {
    stopVoiceConversation();
  } else {
    startVoiceConversation();
  }
};
// 自动发送语音识别的消息
async function autoSendMessage(text) {
  // 分析文本情绪
  const textEmotionResult = analyzeTextEmotion(text);
  State.textEmotion = textEmotionResult.label;
  fuseEmotions();

  // 显示用户消息
  addMessage('user', text, {
    face: State.faceEmotion,
    voice: State.voiceEmotion,
    text: State.textEmotion,
    fused: State.fusedEmotion,
    intensity: State.fusedIntensity
  });

  // 标记 AI 正在回复
  isAITalking = true;
  currentAbortController = new AbortController();
  let wasAborted = false;

  // 显示加载中
  const loadingEl = addMessage('ai', '思考中...', {});

  try {
    const res = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: text,
        session_id: State.sessionId,
        face_emotion: State.faceEmotion,
        voice_emotion: State.voiceEmotion,
        text_emotion: State.textEmotion,
        fused_emotion: State.fusedEmotion,
        intensity: State.fusedIntensity,
        trend: State.trend,
        history: State.history.slice(-6)
      }),
      signal: currentAbortController.signal
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    loadingEl.remove();

    // 创建 AI 消息元素，用于逐字显示
    const aiMsgEl = addMessage('ai', '', {});
    const contentEl = aiMsgEl.querySelector('.message-content') || aiMsgEl;
    let fullResponse = '';
    let metaInfo = { strategy: '', strategyName: '', emotionLabel: '', crisis: false };

    // 读取 SSE 流
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();  // 保留最后不完整的一行

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const data = JSON.parse(line.slice(6));

          if (data.type === 'metadata') {
            metaInfo = {
              strategy: data.cbt_strategy,
              strategyName: data.cbt_strategy_name,
              emotionLabel: data.emotion_analysis?.label,
              crisis: data.crisis_flag
            };
            if (metaInfo.strategyName) {
              $('cbt-strategy-display').textContent = `策略: ${metaInfo.strategyName}`;
            }
          } else if (data.type === 'chunk') {
            fullResponse += data.content;
            contentEl.textContent = fullResponse;
            // 滚动到底部
            chatMessages.scrollTop = chatMessages.scrollHeight;
          } else if (data.type === 'done') {
            fullResponse = data.full_response || fullResponse;
            contentEl.textContent = fullResponse;
            // 补充元数据（done 事件包含完整信息）
            if (data.cbt_strategy_name) {
              metaInfo.strategyName = data.cbt_strategy_name;
              $('cbt-strategy-display').textContent = `策略: ${data.cbt_strategy_name}`;
            }
          }
        } catch (e) {
          console.error('解析 SSE 失败:', e);
        }
      }
    }

    // 流式结束后，更新消息元数据展示
    if (metaInfo.strategyName) {
      const strategyEl = aiMsgEl.querySelector('.message-strategy');
      if (strategyEl) strategyEl.textContent = metaInfo.strategyName;
    }

    State.history.push({ role: 'user', content: text });
    State.history.push({ role: 'assistant', content: fullResponse });

  } catch (e) {
    loadingEl.remove();
    if (e.name === 'AbortError') {
      // 用户打断：显示已打断提示，保留 finalTextBuffer 等待 debounce 发送
      wasAborted = true;
      addMessage('ai', '（已打断）', {});
      console.log('AI 回复已被用户打断');
    } else {
      addMessage('ai', '抱歉，我遇到了一些问题，请稍后再试。', {});
      console.error('发送消息失败:', e);
    }
  } finally {
    // AI 回复完毕，恢复监听
    isAITalking = false;
    currentAbortController = null;
    // 打断后保留 finalTextBuffer，让 debounce 自然发送新消息
    if (!wasAborted) {
      finalTextBuffer = '';
    }
  }
}

$('btn-send').onclick = sendMessage;
chatInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

$('btn-new-session').onclick = () => {
  chatMessages.innerHTML = '';
  addMessage('ai', '新会话已开始。你可以随时和我聊聊你的感受。', {});
  startNewSession();
};

$('btn-history').onclick = () => {
  loadHistory();
  $('history-modal').style.display = 'flex';
};

$('btn-close-history').onclick = () => {
  $('history-modal').style.display = 'none';
};

$('btn-close-detail').onclick = () => {
  $('detail-modal').style.display = 'none';
};

// 点击弹窗背景关闭
window.onclick = e => {
  if (e.target.classList.contains('modal')) {
    e.target.style.display = 'none';
  }
};

// ==================== 初始化 ====================
startNewSession();
drawTrajectory();
