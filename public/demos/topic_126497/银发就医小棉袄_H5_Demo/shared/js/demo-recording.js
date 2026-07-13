/**
 * @trae-gen true
 * @trae-review-status reviewed
 * @trae-module shared-js
 */

// ==========================================================================
// 录音模块：状态机 idle → recording → processing → done
// 优先使用真实 Web Audio API (getUserMedia + MediaRecorder + AnalyserNode)
// 当浏览器不支持或用户拒绝麦克风权限时，自动降级到 Mock 模拟录音
// ==========================================================================

var RecordingState = {
  IDLE: 'idle',
  RECORDING: 'recording',
  PROCESSING: 'processing',
  DONE: 'done'
};

// ----- 状态变量 -----
var recordingState = RecordingState.IDLE;
var recordingTimer = null;       // Mock 模式的自动停止定时器
var processingTimer = null;      // 处理阶段计时器
var recordingSeconds = 0;        // 录音已用时长(秒)
var recordingInterval = null;    // 录音计时 interval

// ----- 真实录音相关变量 -----
var isRealRecording = false;     // 当前是否为真实录音
var mediaRecorder = null;        // MediaRecorder 实例
var audioStream = null;          // 麦克风媒体流
var audioChunks = [];            // 录音数据分片
var audioBlob = null;            // 录音完成的 Blob
var audioUrl = null;             // 录音回放 URL
var audioContext = null;         // AudioContext
var analyser = null;             // AnalyserNode（用于波形）
var waveformRAF = null;          // 波形动画 requestAnimationFrame 句柄

// ==========================================================================
// 能力检测：判断浏览器是否支持真实录音
// ==========================================================================
function isRealRecordingSupported() {
  return !!(navigator.mediaDevices &&
            navigator.mediaDevices.getUserMedia &&
            typeof window.MediaRecorder !== 'undefined');
}

// ==========================================================================
// 开始录音（对外接口，保留原签名）
// ==========================================================================
function startRecording(onStateChange) {
  if (recordingState !== RecordingState.IDLE) return;

  if (isRealRecordingSupported()) {
    // 尝试真实录音，失败则降级
    startRealRecording(onStateChange);
  } else {
    // 浏览器不支持，直接降级到 Mock
    isRealRecording = false;
    startMockRecording(onStateChange);
  }
}

// ==========================================================================
// 真实录音：请求麦克风权限并启动 MediaRecorder
// ==========================================================================
function startRealRecording(onStateChange) {
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(function(stream) {
      // 权限获取成功
      isRealRecording = true;
      audioStream = stream;
      audioChunks = [];
      audioBlob = null;
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        audioUrl = null;
      }

      // 创建 MediaRecorder
      try {
        mediaRecorder = new MediaRecorder(stream);
      } catch (e) {
        // 创建失败，降级到 Mock
        stopStreamSafely(stream);
        isRealRecording = false;
        notifyMockFallback('录音组件不可用，使用示例录音');
        startMockRecording(onStateChange);
        return;
      }

      mediaRecorder.ondataavailable = function(e) {
        if (e.data && e.data.size > 0) audioChunks.push(e.data);
      };

      mediaRecorder.start();

      // 创建音频分析器（用于实时波形）
      try {
        var AC = window.AudioContext || window.webkitAudioContext;
        audioContext = new AC();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 64;
        var source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
      } catch (e) {
        analyser = null;
      }

      // 进入录音状态
      recordingState = RecordingState.RECORDING;
      recordingSeconds = 0;
      if (onStateChange) onStateChange(recordingState, recordingSeconds, 0, { real: true });

      // 计时器
      recordingInterval = setInterval(function() {
        recordingSeconds++;
        if (onStateChange) onStateChange(recordingState, recordingSeconds);
      }, 1000);

      // 波形动画
      runWaveform(onStateChange);
    })
    .catch(function(err) {
      // 权限被拒绝或获取失败，降级到 Mock
      isRealRecording = false;
      var msg = '未获取麦克风权限，使用示例录音';
      if (err && err.name === 'NotAllowedError') {
        msg = '您拒绝了麦克风权限，已切换为示例录音';
      } else if (err && err.name === 'NotFoundError') {
        msg = '未检测到麦克风设备，已切换为示例录音';
      }
      notifyMockFallback(msg);
      startMockRecording(onStateChange);
    });
}

// ==========================================================================
// Mock 录音：模拟录音过程（原实现，作为降级方案）
// ==========================================================================
function startMockRecording(onStateChange) {
  isRealRecording = false;
  recordingState = RecordingState.RECORDING;
  recordingSeconds = 0;
  if (onStateChange) onStateChange(recordingState, recordingSeconds, 0, { real: false });

  // 每秒更新录音时长
  recordingInterval = setInterval(function() {
    recordingSeconds++;
    if (onStateChange) onStateChange(recordingState, recordingSeconds);
  }, 1000);

  // 模拟 45 秒自动停止
  recordingTimer = setTimeout(function() {
    stopRecording(onStateChange);
  }, 45000);
}

// ==========================================================================
// 波形动画：通过 AnalyserNode 读取频率数据并回调
// ==========================================================================
function runWaveform(onStateChange) {
  if (!analyser) return;
  var buffer = new Uint8Array(analyser.frequencyBinCount);
  function tick() {
    if (recordingState !== RecordingState.RECORDING) return;
    analyser.getByteFrequencyData(buffer);
    if (onStateChange) onStateChange('waveform', recordingSeconds, 0, buffer);
    waveformRAF = requestAnimationFrame(tick);
  }
  tick();
}

// ==========================================================================
// 停止录音（对外接口，保留原签名）
// ==========================================================================
function stopRecording(onStateChange) {
  if (recordingState !== RecordingState.RECORDING) return;

  clearTimeout(recordingTimer);
  clearInterval(recordingInterval);
  if (waveformRAF) {
    cancelAnimationFrame(waveformRAF);
    waveformRAF = null;
  }

  if (isRealRecording && mediaRecorder && mediaRecorder.state !== 'inactive') {
    // 真实录音：停止 MediaRecorder，在 onstop 回调中生成音频并进入处理阶段
    mediaRecorder.onstop = function() {
      audioBlob = new Blob(audioChunks, { type: getRecordingMimeType() });
      audioUrl = URL.createObjectURL(audioBlob);
      enterProcessing(onStateChange);
    };
    mediaRecorder.stop();
    stopStreamSafely(audioStream);
  } else {
    // Mock 录音：直接进入处理阶段
    enterProcessing(onStateChange);
  }
}

// ==========================================================================
// 进入处理阶段
// ==========================================================================
function enterProcessing(onStateChange) {
  recordingState = RecordingState.PROCESSING;
  if (onStateChange) onStateChange(recordingState, recordingSeconds);

  // 模拟 6 秒处理时间（6 步）
  var processingStep = 0;
  processingTimer = setInterval(function() {
    processingStep++;
    if (onStateChange) onStateChange(recordingState, recordingSeconds, processingStep);
    if (processingStep >= 6) {
      clearInterval(processingTimer);
      recordingState = RecordingState.DONE;
      if (onStateChange) onStateChange(recordingState, recordingSeconds, 6);
    }
  }, 1000);
}

// ==========================================================================
// 重置录音（对外接口，保留原签名）
// ==========================================================================
function resetRecording(onStateChange) {
  clearTimeout(recordingTimer);
  clearInterval(recordingInterval);
  clearInterval(processingTimer);
  if (waveformRAF) {
    cancelAnimationFrame(waveformRAF);
    waveformRAF = null;
  }

  // 清理真实录音资源
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    // 重置时清除 onstop 回调，避免 stop() 触发 enterProcessing 改变状态
    mediaRecorder.onstop = null;
    try { mediaRecorder.stop(); } catch (e) {}
  }
  stopStreamSafely(audioStream);
  if (audioContext) {
    try { audioContext.close(); } catch (e) {}
    audioContext = null;
  }
  if (audioUrl) {
    URL.revokeObjectURL(audioUrl);
    audioUrl = null;
  }
  mediaRecorder = null;
  analyser = null;
  audioStream = null;
  audioChunks = [];
  audioBlob = null;
  isRealRecording = false;

  recordingState = RecordingState.IDLE;
  recordingSeconds = 0;
  if (onStateChange) onStateChange(recordingState, 0);
}

// ==========================================================================
// 工具方法
// ==========================================================================
function getRecordingState() {
  return recordingState;
}

function formatRecordingTime(seconds) {
  var m = Math.floor(seconds / 60);
  var s = seconds % 60;
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

// 获取录音 MIME 类型（用于回放兼容）
function getRecordingMimeType() {
  if (mediaRecorder && mediaRecorder.mimeType) return mediaRecorder.mimeType;
  return 'audio/webm';
}

// 安全停止媒体流
function stopStreamSafely(stream) {
  if (!stream) return;
  try {
    stream.getTracks().forEach(function(t) { t.stop(); });
  } catch (e) {}
}

// 通知 Mock 降级（依赖页面注入的 showToast，若不存在则静默）
function notifyMockFallback(msg) {
  if (typeof window.showToast === 'function') {
    window.showToast(msg, 'warning');
  }
}

// ==========================================================================
// 录音回放相关接口（供页面调用）
// ==========================================================================

// 获取录音回放 URL（无录音时返回 null）
function getAudioUrl() {
  return audioUrl;
}

// 获取录音 Blob（供 ASR 引擎识别使用，无录音时返回 null）
function getAudioBlob() {
  return audioBlob;
}

// 当前是否为真实录音
function isRealRecordingMode() {
  return isRealRecording;
}

// 当前是否有可播放的录音
function hasAudioPlayback() {
  return !!audioUrl;
}
