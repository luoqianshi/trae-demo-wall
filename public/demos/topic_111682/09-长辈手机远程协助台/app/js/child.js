/* ========================================
   Canvas 标注绘图（子女端）
   ======================================== */
let annoCanvas, ctx2;
let currentTool = 'arrow';
let isDrawing = false;
let startX = 0, startY = 0;
let paths = [];
let currentPath = [];
let textPos = null;

function initCanvas() {
  annoCanvas = document.getElementById('annoCanvas');
  if (!annoCanvas) return;
  ctx2 = annoCanvas.getContext('2d');
  resizeCanvas();
  paths = [];
  redrawAll();
  if (!annoCanvas.dataset.bound) {
    annoCanvas.addEventListener('mousedown', startDraw);
    annoCanvas.addEventListener('mousemove', moveDraw);
    annoCanvas.addEventListener('mouseup', endDraw);
    annoCanvas.addEventListener('mouseleave', endDraw);
    annoCanvas.addEventListener('touchstart', startDraw, {passive:false});
    annoCanvas.addEventListener('touchmove', moveDraw, {passive:false});
    annoCanvas.addEventListener('touchend', endDraw);
    const textInput = document.getElementById('textInput');
    if (textInput) {
      textInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') confirmTextInput();
      });
    }
    annoCanvas.dataset.bound = '1';
  }
  const statusEl = document.getElementById('ssStatus');
  if (statusEl) statusEl.textContent = '在截图上拖动即可标注操作位置';
}

function resizeCanvas() {
  if (!annoCanvas) return;
  const rect = annoCanvas.parentElement.getBoundingClientRect();
  annoCanvas.width = rect.width;
  annoCanvas.height = rect.height;
  redrawAll();
}

function setTool(el, tool) {
  currentTool = tool;
  document.querySelectorAll('.anno-tool').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  const status = document.getElementById('ssStatus');
  if (!status) return;
  if (tool === 'arrow') status.textContent = '箭头工具：拖动绘制箭头';
  else if (tool === 'circle') status.textContent = '圆圈工具：拖动画圆';
  else if (tool === 'draw') status.textContent = '画笔工具：拖动自由绘制';
  else if (tool === 'text') status.textContent = '文字工具：点击位置输入文字';
  annoCanvas.style.cursor = tool === 'text' ? 'text' : 'crosshair';
}

function getPos(e) {
  const rect = annoCanvas.getBoundingClientRect();
  const cx = e.clientX !== undefined ? e.clientX : e.touches[0].clientX;
  const cy = e.clientY !== undefined ? e.clientY : e.touches[0].clientY;
  return { x: cx - rect.left, y: cy - rect.top };
}

function startDraw(e) {
  e.preventDefault();
  if (currentTool === 'text') {
    textPos = getPos(e);
    const overlay = document.getElementById('textOverlay');
    if (overlay) {
      overlay.classList.add('show');
      const input = document.getElementById('textInput');
      if (input) {
        input.value = '';
        setTimeout(() => input.focus(), 100);
      }
    }
    return;
  }
  isDrawing = true;
  const pos = getPos(e);
  startX = pos.x; startY = pos.y;
  currentPath = [{x: startX, y: startY}];
}

function moveDraw(e) {
  if (!isDrawing) return;
  e.preventDefault();
  const pos = getPos(e);
  if (currentTool === 'draw') {
    currentPath.push(pos);
    redrawAll();
    ctx2.beginPath();
    ctx2.strokeStyle = '#22d3ee';
    ctx2.lineWidth = 3;
    ctx2.lineCap = 'round';
    ctx2.lineJoin = 'round';
    for (let i = 0; i < currentPath.length; i++) {
      if (i === 0) ctx2.moveTo(currentPath[i].x, currentPath[i].y);
      else ctx2.lineTo(currentPath[i].x, currentPath[i].y);
    }
    ctx2.stroke();
  } else {
    redrawAll();
    drawShape(startX, startY, pos.x, pos.y, currentTool, true);
  }
}

function endDraw(e) {
  if (!isDrawing) return;
  isDrawing = false;
  const pos = e.changedTouches ? getPos({clientX: e.changedTouches[0].clientX, clientY: e.changedTouches[0].clientY}) : getPos(e);
  if (currentTool !== 'draw') {
    paths.push({type: currentTool, x1: startX, y1: startY, x2: pos.x, y2: pos.y});
  } else if (currentPath.length > 1) {
    paths.push({type: 'draw', points: [...currentPath]});
  }
  redrawAll();
  currentPath = [];
}

function drawShape(x1, y1, x2, y2, type, isPreview) {
  ctx2.strokeStyle = type === 'circle' ? '#fbbf24' : '#22d3ee';
  ctx2.fillStyle = 'transparent';
  ctx2.lineWidth = isPreview ? 2 : 3;
  ctx2.setLineDash(isPreview ? [5, 5] : []);
  ctx2.lineCap = 'round';
  if (type === 'arrow') {
    const dx = x2 - x1, dy = y2 - y1;
    const angle = Math.atan2(dy, dx);
    const headLen = 14;
    ctx2.beginPath();
    ctx2.moveTo(x1, y1);
    ctx2.lineTo(x2, y2);
    ctx2.stroke();
    ctx2.beginPath();
    ctx2.moveTo(x2, y2);
    ctx2.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
    ctx2.moveTo(x2, y2);
    ctx2.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
    ctx2.stroke();
  } else if (type === 'circle') {
    const r = Math.max(2, Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2));
    ctx2.beginPath();
    ctx2.arc(x1, y1, r, 0, Math.PI * 2);
    ctx2.stroke();
  }
  ctx2.setLineDash([]);
}

function drawText(text, x, y) {
  ctx2.font = 'bold 14px sans-serif';
  ctx2.fillStyle = '#22d3ee';
  ctx2.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx2.lineWidth = 3;
  const w = ctx2.measureText(text).width;
  ctx2.fillStyle = 'rgba(34,211,238,0.9)';
  ctx2.fillRect(x - 4, y - 14, w + 8, 20);
  ctx2.fillStyle = '#0a0a1a';
  ctx2.fillText(text, x, y);
}

function redrawAll() {
  if (!ctx2) return;
  ctx2.clearRect(0, 0, annoCanvas.width, annoCanvas.height);
  ctx2.lineCap = 'round';
  ctx2.lineJoin = 'round';
  paths.forEach(p => {
    if (p.type === 'draw') {
      ctx2.strokeStyle = '#22d3ee';
      ctx2.lineWidth = 3;
      ctx2.beginPath();
      p.points.forEach((pt, i) => { i === 0 ? ctx2.moveTo(pt.x, pt.y) : ctx2.lineTo(pt.x, pt.y); });
      ctx2.stroke();
    } else if (p.type === 'text') {
      drawText(p.text, p.x, p.y);
    } else {
      drawShape(p.x1, p.y1, p.x2, p.y2, p.type, false);
    }
  });
}

function clearCanvas() {
  paths = [];
  redrawAll();
  showToast('🗑️ 标注已清除', 'warn');
}

function confirmTextInput() {
  const input = document.getElementById('textInput');
  const text = input ? input.value.trim() : '';
  if (text && textPos) {
    paths.push({type: 'text', text, x: textPos.x, y: textPos.y});
    redrawAll();
  }
  const overlay = document.getElementById('textOverlay');
  if (overlay) overlay.classList.remove('show');
}

function cancelTextInput() {
  const overlay = document.getElementById('textOverlay');
  if (overlay) overlay.classList.remove('show');
}

/* ========================================
   录音（子女端）
   ======================================== */
let recording = false;
let recordTimer = null;
let recordSeconds = 0;
let mediaRecorder = null;
let audioChunks = [];
let recordedAudioUrl = null;
let recordedDuration = 0;
let realAudioSupported = false;

async function toggleRecord() {
  if (!recording) {
    await startRecording();
  } else {
    stopRecording();
  }
}

async function startRecording() {
  recordedAudioUrl = null;
  recordedDuration = 0;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({audio: true});
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];
    mediaRecorder.ondataavailable = e => { if (e.data.size > 0) audioChunks.push(e.data); };
    mediaRecorder.onstop = () => {
      const blob = new Blob(audioChunks, {type: 'audio/webm'});
      recordedAudioUrl = URL.createObjectURL(blob);
      stream.getTracks().forEach(t => t.stop());
      onRecordStop();
    };
    mediaRecorder.start();
    realAudioSupported = true;
  } catch (e) {
    realAudioSupported = false;
  }
  recording = true;
  recordSeconds = 0;
  const btn = document.getElementById('recordBtn');
  if (btn) {
    btn.classList.add('recording');
    document.getElementById('recordText').textContent = realAudioSupported ? '正在录音... 点击停止' : '模拟录音中... 点击停止';
    const timerEl = document.getElementById('recordTimer');
    if (timerEl) {
      timerEl.style.display = 'inline';
      timerEl.textContent = '0:00';
    }
  }
  recordTimer = setInterval(() => {
    recordSeconds++;
    const timerEl = document.getElementById('recordTimer');
    if (timerEl) timerEl.textContent = formatTime(recordSeconds);
  }, 1000);
}

function stopRecording() {
  recording = false;
  clearInterval(recordTimer);
  const btn = document.getElementById('recordBtn');
  if (btn) {
    btn.classList.remove('recording');
    const textEl = document.getElementById('recordText');
    if (textEl) textEl.textContent = '点击录制语音指引';
    const timerEl = document.getElementById('recordTimer');
    if (timerEl) timerEl.style.display = 'none';
  }
  if (realAudioSupported && mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  } else {
    recordedDuration = recordSeconds;
    onRecordStop();
  }
}

function onRecordStop() {
  if (recordSeconds === 0) return;
  recordedDuration = recordSeconds;
  const empty = document.getElementById('voiceEmpty');
  const player = document.getElementById('voicePlayer');
  const durationEl = document.getElementById('voiceDuration');
  const sendBtn = document.getElementById('sendBtn');
  if (empty) empty.style.display = 'none';
  if (player) player.style.display = 'flex';
  if (durationEl) durationEl.textContent = formatTime(recordedDuration);
  if (sendBtn) sendBtn.disabled = false;
  showToast(`🎤 录音完成 (${formatTime(recordedDuration)})`, 'success');
}

/* ========================================
   子女端语音播放
   ======================================== */
let voiceAudio = null;
let voicePlaying = false;
let voiceTimer = null;
let voiceProgress = 0;

function toggleVoice() {
  const player = document.getElementById('voicePlayer');
  const playBtn = document.getElementById('voicePlayBtn');
  const progress = document.getElementById('voiceProgress');
  const progressFill = document.getElementById('voiceProgressFill');
  const durationEl = document.getElementById('voiceDuration');
  if (!player || !playBtn) return;

  if (recordedAudioUrl) {
    if (!voiceAudio) {
      voiceAudio = new Audio(recordedAudioUrl);
      voiceAudio.ontimeupdate = () => {
        const pct = (voiceAudio.currentTime / voiceAudio.duration) * 100;
        if (progressFill) progressFill.style.width = pct + '%';
        if (durationEl) durationEl.textContent = formatTime(Math.max(0, Math.ceil(voiceAudio.duration - voiceAudio.currentTime)));
      };
      voiceAudio.onended = () => {
        voicePlaying = false;
        player.classList.remove('playing');
        playBtn.textContent = '▶';
        playBtn.classList.remove('playing');
        if (progress) progress.classList.remove('show');
        if (progressFill) progressFill.style.width = '0%';
        if (durationEl) durationEl.textContent = formatTime(recordedDuration);
      };
    }
    if (voicePlaying) {
      voiceAudio.pause();
      voicePlaying = false;
      player.classList.remove('playing');
      playBtn.textContent = '▶';
    } else {
      if (progress) progress.classList.add('show');
      voiceAudio.play();
      voicePlaying = true;
      player.classList.add('playing');
      playBtn.textContent = '⏸';
      playBtn.classList.add('playing');
    }
  } else {
    if (voicePlaying) {
      voicePlaying = false;
      player.classList.remove('playing');
      playBtn.textContent = '▶';
      playBtn.classList.remove('playing');
      if (progress) progress.classList.remove('show');
      clearInterval(voiceTimer);
    } else {
      voicePlaying = true;
      player.classList.add('playing');
      playBtn.textContent = '⏸';
      playBtn.classList.add('playing');
      if (progress) progress.classList.add('show');
      voiceProgress = 0;
      voiceTimer = setInterval(() => {
        voiceProgress += 0.1;
        if (progressFill) progressFill.style.width = (voiceProgress / recordedDuration * 100) + '%';
        if (durationEl) durationEl.textContent = formatTime(Math.max(0, recordedDuration - voiceProgress));
        if (voiceProgress >= recordedDuration) {
          clearInterval(voiceTimer);
          voicePlaying = false;
          player.classList.remove('playing');
          playBtn.textContent = '▶';
          playBtn.classList.remove('playing');
          if (progressFill) progressFill.style.width = '0%';
          if (durationEl) durationEl.textContent = formatTime(recordedDuration);
          if (progress) progress.classList.remove('show');
        }
      }, 100);
    }
  }
}

/* ========================================
   子女端视图渲染
   ======================================== */
function renderChildView() {
  const empty = document.getElementById('childEmpty');
  const annotate = document.getElementById('childAnnotate');
  const sent = document.getElementById('childSent');
  if (!empty || !annotate || !sent) return;
  const appState = getAppState();
  empty.style.display = 'none';
  annotate.style.display = 'none';
  sent.style.display = 'none';
  if (appState === STATE.IDLE || appState === STATE.RESOLVED) {
    empty.style.display = 'block';
  } else if (appState === STATE.HELP_SENT) {
    annotate.style.display = 'block';
    initCanvas();
  } else if (appState === STATE.REPLY_SENT) {
    sent.style.display = 'block';
  }
}

/* ========================================
   发送回复
   ======================================== */
function sendReply() {
  const canvas = document.getElementById('annoCanvas');
  if (!canvas) return;
  const composite = document.createElement('canvas');
  composite.width = canvas.width;
  composite.height = canvas.height;
  const cctx = composite.getContext('2d');
  const grad = cctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grad.addColorStop(0, '#1a1a3a');
  grad.addColorStop(1, '#2a1a4a');
  cctx.fillStyle = grad;
  cctx.fillRect(0, 0, canvas.width, canvas.height);
  cctx.drawImage(canvas, 0, 0);
  const screenshot = composite.toDataURL('image/png');

  const replyData = {
    screenshot,
    audioUrl: recordedAudioUrl,
    duration: recordedDuration
  };
  setReplyData(replyData);
  setAppState(STATE.REPLY_SENT);
  setHasNewForElder(true);

  const history = getHistory();
  if (history.length > 0 && !history[0].resolved) {
    history[0].resolved = true;
    setHistory(history);
  }

  renderChildView();
  renderBanner();
  showToast('📤 指引已发送给妈妈', 'success');
}

/* ========================================
   子女端初始化
   ======================================== */
function initChildPage() {
  initClock();
  renderChildView();
  renderBanner();
  renderHistory();

  window.addEventListener('resize', () => {
    if (getAppState() === STATE.HELP_SENT) resizeCanvas();
  });

  const navRoleText = document.getElementById('navRoleText');
  if (navRoleText) navRoleText.textContent = '子女';
  const navTitle = document.getElementById('navTitle');
  if (navTitle) navTitle.textContent = '子女端 · 协助台';
}

/* ========================================
   屏幕共享预览（子女端查看长辈屏幕）
   ======================================== */
let sharePreviewTimer = null;

function renderSharePreview() {
  const wrap = document.getElementById('sharePreviewWrap');
  if (!wrap) return;
  const sharing = isScreenSharing();
  const appState = getAppState();

  /* 求助标注模式时隐藏预览 */
  if (appState === STATE.HELP_SENT || appState === STATE.REPLY_SENT) {
    wrap.style.display = 'none';
    return;
  }
  wrap.style.display = 'block';

  const statusEl = document.getElementById('sphStatus');
  const timeEl = document.getElementById('sphTime');
  const mockEl = document.getElementById('spsMock');
  const recEl = document.getElementById('spsRecording');

  if (sharing) {
    if (statusEl) statusEl.textContent = '屏幕共享中';
    if (timeEl) {
      const now = new Date();
      timeEl.textContent = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    }
    if (mockEl) {
      mockEl.innerHTML = `
        <div class="sps-icon">💊</div>
        <div class="sps-text">医保电子凭证</div>
        <div class="sps-hint">点击这里打开</div>
        <div class="sps-btn">立即使用</div>
      `;
    }
    if (recEl) recEl.style.display = 'flex';
  } else {
    if (statusEl) statusEl.textContent = '等待屏幕共享...';
    if (timeEl) timeEl.textContent = '--:--';
    if (mockEl) {
      mockEl.innerHTML = `
        <div class="sps-icon">📱</div>
        <div class="sps-text">等待长辈开启屏幕共享</div>
        <div class="sps-hint">长辈打开App后会自动共享屏幕</div>
      `;
    }
    if (recEl) recEl.style.display = 'none';
  }
}
