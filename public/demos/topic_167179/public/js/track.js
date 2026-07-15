/* ============================================================
   track.js — 完整包装轨导出页面交互
   ============================================================ */

const state = {
  sessionId: null,
  duration: 0,
  segments: [],
  aligned: [],
  packagingPoints: [],
  unaligned: { sentences: [], packagingPoints: [] },
};

const $ = (id) => document.getElementById(id);

function formatTime(seconds) {
  if (seconds === null || seconds === undefined) return '--:--';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
}

function setStatus(id, type, text) {
  const el = $(id);
  el.classList.remove('hidden', 'status--info', 'status--error', 'status--success');
  el.classList.add(`status--${type}`);
  el.textContent = text;
}

function clearStatus(id) {
  const el = $(id);
  el.classList.add('hidden');
  el.textContent = '';
}

async function apiPost(path, body, options = {}) {
  const headers = { ...options.headers };
  if (state.sessionId) headers['X-Session-Id'] = state.sessionId;

  const res = await fetch(path, {
    method: 'POST',
    headers,
    body,
  });
  const data = await res.json();
  if (!res.ok || data.status === 'error') {
    throw new Error(data.error || '请求失败');
  }
  if (data.sessionId) state.sessionId = data.sessionId;
  return data;
}

// ========== 媒体上传 ==========
$('media-input').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  $('media-name').textContent = file.name;
  setStatus('align-status', 'info', '正在上传媒体...');

  const form = new FormData();
  form.append('media', file);

  try {
    const data = await apiPost('/api/track/upload-media', form);
    state.duration = data.duration;
    $('media-info').classList.remove('hidden');
    $('media-info').innerHTML = `
      <div>文件名：${data.filename}</div>
      <div>时长：${data.duration.toFixed(2)} 秒</div>
    `;
    $('btn-transcribe').disabled = false;
    clearStatus('align-status');
    updateActionButtons();
  } catch (err) {
    setStatus('align-status', 'error', `上传失败：${err.message}`);
  }
});

// ========== 字幕上传 ==========
$('subtitle-input').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  $('subtitle-name').textContent = file.name;
  setStatus('align-status', 'info', '正在上传字幕...');

  const form = new FormData();
  form.append('subtitleFile', file);

  try {
    const data = await apiPost('/api/track/upload-subtitle', form);
    state.segments = data.segments || [];
    renderTranscript();
    clearStatus('align-status');
    updateActionButtons();
  } catch (err) {
    setStatus('align-status', 'error', `字幕上传失败：${err.message}`);
  }
});

// ========== 正式稿上传/粘贴 ==========
$('script-text').addEventListener('input', () => updateActionButtons());

$('script-file-input').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  $('script-file-name').textContent = file.name;
  const text = await file.text();
  $('script-text').value = text;
  uploadScript(text);
});

async function uploadScript(text) {
  if (!text.trim()) return;
  const form = new FormData();
  form.append('scriptText', text);
  try {
    const data = await apiPost('/api/track/upload-script', form);
    state.scriptWordCount = data.wordCount;
    updateActionButtons();
  } catch (err) {
    setStatus('align-status', 'error', `文稿上传失败：${err.message}`);
  }
}

// ========== Whisper 识别 ==========
$('btn-transcribe').addEventListener('click', async () => {
  $('btn-transcribe').disabled = true;
  setStatus('align-status', 'info', 'Whisper 识别中，请稍候...');
  try {
    const data = await apiPost('/api/track/transcribe', '');
    state.segments = data.segments || [];
    renderTranscript();
    clearStatus('align-status');
  } catch (err) {
    setStatus('align-status', 'error', `识别失败：${err.message}\n提示：可改用上传字幕文件继续。`);
  } finally {
    $('btn-transcribe').disabled = false;
    updateActionButtons();
  }
});

// ========== 对齐与识别 ==========
$('btn-align').addEventListener('click', async () => {
  const scriptText = $('script-text').value.trim();
  if (scriptText) await uploadScript(scriptText);

  $('btn-align').disabled = true;
  setStatus('align-status', 'info', '正在对齐正式稿与时间点，并识别包装点...');

  try {
    const data = await apiPost('/api/track/align', '');
    state.duration = data.duration;
    state.aligned = data.aligned || [];
    state.packagingPoints = data.packagingPoints || [];
    state.unaligned = data.unaligned || { sentences: [], packagingPoints: [] };

    renderAligned();
    renderPackagingTimeline();
    renderUnaligned();
    setStatus('align-status', 'success', `对齐完成：${state.aligned.filter((s) => s.aligned).length}/${state.aligned.length} 句已对齐，识别到 ${state.packagingPoints.length} 个包装点。`);
  } catch (err) {
    setStatus('align-status', 'error', `对齐失败：${err.message}`);
  } finally {
    $('btn-align').disabled = false;
    updateActionButtons();
  }
});

// ========== 导出完整包装轨 ==========
$('btn-render-track').addEventListener('click', async () => {
  $('btn-render-track').disabled = true;
  $('download-area').classList.add('hidden');
  setStatus('render-status', 'info', '正在渲染完整透明包装轨，请稍候...');

  try {
    const data = await apiPost('/api/track/render', '');
    setStatus('render-status', 'success', `导出成功！\n${JSON.stringify(data.verify, null, 2)}`);
    $('download-link').href = data.downloadUrl;
    $('download-path').textContent = data.outputPath;
    $('download-area').classList.remove('hidden');
  } catch (err) {
    setStatus('render-status', 'error', `导出失败：${err.message}`);
  } finally {
    $('btn-render-track').disabled = false;
  }
});

// ========== 渲染视图 ==========
function renderTranscript() {
  const list = $('transcript-list');
  if (!state.segments.length) {
    list.innerHTML = '<div class="empty">暂无识别或字幕结果</div>';
    return;
  }
  list.innerHTML = state.segments.map((seg, i) => `
    <div class="result-item">
      <div class="result-item__meta">
        <span>#${i + 1}</span>
        <span>${formatTime(seg.start)} → ${formatTime(seg.end)}</span>
      </div>
      <div>${escapeHtml(seg.text)}</div>
    </div>
  `).join('');
}

function renderAligned() {
  const list = $('aligned-list');
  if (!state.aligned.length) {
    list.innerHTML = '<div class="empty">尚未对齐</div>';
    return;
  }
  list.innerHTML = state.aligned.map((s, i) => `
    <div class="result-item ${s.aligned ? 'result-item--aligned' : 'result-item--unaligned'}">
      <div class="result-item__meta">
        <span>句子 ${i + 1}</span>
        <span>${s.aligned ? formatTime(s.start) : '未对齐'} ${s.score ? `(匹配度 ${(s.score * 100).toFixed(0)}%)` : ''}</span>
      </div>
      <div>${escapeHtml(s.sentence)}</div>
    </div>
  `).join('');
}

function renderPackagingTimeline() {
  const visual = $('timeline-visual');
  const list = $('packaging-list');

  if (!state.packagingPoints.length) {
    visual.innerHTML = '<div class="empty">尚未生成时间线</div>';
    list.innerHTML = '';
    return;
  }

  const duration = state.duration || Math.max(...state.packagingPoints.map((p) => p.time || 0)) + 3;
  const alignedPoints = state.packagingPoints.filter((p) => p.aligned && p.time != null);

  // 时间轴刻度
  const ticks = [];
  for (let i = 0; i <= 5; i++) {
    ticks.push(formatTime(duration * i / 5));
  }

  visual.innerHTML = `
    <div class="timeline-ruler">${ticks.map((t) => `<span>${t}</span>`).join('')}</div>
    ${alignedPoints.map((p) => {
      const left = (p.time / duration) * 100;
      const width = Math.min((3 / duration) * 100, 100 - left);
      return `<div class="timeline-point" style="left:${left}%;width:${width}%;" title="${escapeHtml(p.text)}">${escapeHtml(p.text.slice(0, 12))}</div>`;
    }).join('')}
  `;

  const typeLabels = {
    data_card: '数据卡',
    quote_highlight: '观点花字',
    timeline_node: '时间轴',
    title_card: '标题卡',
  };

  list.innerHTML = alignedPoints.map((p) => `
    <div class="packaging-card">
      <span class="packaging-card__type">${typeLabels[p.type] || p.type}</span>
      <div class="packaging-card__text">${escapeHtml(p.text)}</div>
      <div class="packaging-card__time">${formatTime(p.time)}</div>
    </div>
  `).join('');
}

function renderUnaligned() {
  const card = $('unaligned-card');
  const list = $('unaligned-list');
  const items = [
    ...state.unaligned.sentences.map((s) => ({ type: '句子', text: s })),
    ...state.unaligned.packagingPoints.map((s) => ({ type: '包装点', text: s })),
  ];

  if (!items.length) {
    card.style.display = 'none';
    return;
  }

  card.style.display = 'block';
  list.innerHTML = items.map((item) => `
    <div class="result-item result-item--unaligned">
      <div class="result-item__meta"><span>${item.type}</span></div>
      <div>${escapeHtml(item.text)}</div>
    </div>
  `).join('');
}

function updateActionButtons() {
  const hasScript = $('script-text').value.trim().length > 0;
  const hasTiming = state.segments.length > 0;
  $('btn-align').disabled = !(hasScript && hasTiming && state.duration > 0);
  $('btn-render-track').disabled = !(state.packagingPoints.length > 0);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

updateActionButtons();
