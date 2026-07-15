/* ============================================================
   track-panel.js — 完整包装轨面板（嵌入 index.html 使用）
   ============================================================ */

window.TrackPanel = (function () {
  'use strict';

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
    if (!el) return;
    el.classList.remove('hidden', 'status--info', 'status--error', 'status--success');
    el.classList.add(`status--${type}`);
    el.textContent = text;
  }

  function clearStatus(id) {
    const el = $(id);
    if (!el) return;
    el.classList.add('hidden');
    el.textContent = '';
  }

  async function apiPost(path, body, options = {}) {
    const headers = { ...options.headers };
    if (state.sessionId) headers['X-Session-Id'] = state.sessionId;

    let res;
    try {
      res = await fetch(path, {
        method: 'POST',
        headers,
        body,
      });
    } catch (netErr) {
      console.error(`[apiPost] network error: ${path}`, netErr);
      throw new Error(`网络请求失败：${netErr.message || '无法连接到服务，请确认服务已启动'}`);
    }

    let data;
    try {
      data = await res.json();
    } catch (parseErr) {
      console.error(`[apiPost] parse error: ${path} status=${res.status}`, parseErr);
      throw new Error(`服务响应解析失败（HTTP ${res.status}），请查看服务端日志`);
    }

    if (!res.ok || data.status === 'error') {
      throw new Error(data.error || `请求失败（HTTP ${res.status}）`);
    }
    if (data.sessionId) state.sessionId = data.sessionId;
    return data;
  }

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

  function updateActionButtons() {
    const hasScript = $('track-script-text') && $('track-script-text').value.trim().length > 0;
    const hasTiming = state.segments.length > 0;
    const btnAlign = $('btn-align');
    const btnRender = $('btn-render-track');
    if (btnAlign) btnAlign.disabled = !(hasScript && hasTiming && state.duration > 0);
    if (btnRender) btnRender.disabled = !(state.packagingPoints.length > 0);
  }

  function renderTranscript() {
    const list = $('transcript-list');
    if (!list) return;
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
    if (!list) return;
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
    if (!visual || !list) return;

    if (!state.packagingPoints.length) {
      visual.innerHTML = '<div class="empty">尚未生成时间线</div>';
      list.innerHTML = '';
      return;
    }

    const duration = state.duration || Math.max(...state.packagingPoints.map((p) => p.time || 0)) + 3;
    const alignedPoints = state.packagingPoints.filter((p) => p.aligned && p.time != null);

    const ticks = [];
    for (let i = 0; i <= 5; i++) {
      ticks.push(formatTime(duration * i / 5));
    }

    visual.innerHTML = `
      <div class="timeline-ruler">${ticks.map((t) => `<span>${t}</span>`).join('')}</div>
      ${alignedPoints.map((p) => {
        const left = (p.time / duration) * 100;
        const width = Math.min((3 / duration) * 100, 100 - left);
        const label = p.displayText || p.text;
        return `<div class="timeline-point" style="left:${left}%;width:${width}%;" title="${escapeHtml(p.text)}">${escapeHtml(label.slice(0, 12))}</div>`;
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
        <div class="packaging-card__text">${escapeHtml(p.displayText || p.text)}</div>
        <div class="packaging-card__text" style="font-size:0.75rem;color:var(--color-ink-muted);">${escapeHtml(p.text)}</div>
        <div class="packaging-card__time">${formatTime(p.time)}</div>
      </div>
    `).join('');
  }

  function renderUnaligned() {
    const card = $('unaligned-card');
    const list = $('unaligned-list');
    if (!card || !list) return;

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

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function bindEvents() {
    const mediaInput = $('media-input');
    if (mediaInput) {
      mediaInput.addEventListener('change', async (e) => {
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
    }

    const subtitleInput = $('subtitle-input');
    if (subtitleInput) {
      subtitleInput.addEventListener('change', async (e) => {
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
    }

    const scriptText = $('track-script-text');
    if (scriptText) {
      scriptText.addEventListener('input', updateActionButtons);
    }

    const scriptFileInput = $('script-file-input');
    if (scriptFileInput) {
      scriptFileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        $('script-file-name').textContent = file.name;
        const text = await file.text();
        scriptText.value = text;
        uploadScript(text);
      });
    }

    const btnTranscribe = $('btn-transcribe');
    if (btnTranscribe) {
      btnTranscribe.addEventListener('click', async () => {
        btnTranscribe.disabled = true;
        setStatus('align-status', 'info', 'Whisper 识别中，请稍候...');
        try {
          const data = await apiPost('/api/track/transcribe', '');
          state.segments = data.segments || [];
          renderTranscript();
          clearStatus('align-status');
        } catch (err) {
          setStatus('align-status', 'error', `识别失败：${err.message}\n提示：可改用上传字幕文件继续。`);
        } finally {
          btnTranscribe.disabled = false;
          updateActionButtons();
        }
      });
    }

    const btnAlign = $('btn-align');
    if (btnAlign) {
      btnAlign.addEventListener('click', async () => {
        const text = scriptText.value.trim();
        if (text) await uploadScript(text);

        btnAlign.disabled = true;
        setStatus('align-status', 'info', '正在对齐正式稿与时间点，并识别包装点...');

        try {
          const kimiEnabled = AppState.get('kimiEnabled');
          const kimiApiKey = AppState.get('kimiApiKey');
          const kimiMode = AppState.get('kimiMode') || 'rules-first';
          const alignBody = kimiEnabled && kimiApiKey
            ? JSON.stringify({ kimiEnabled: true, kimiApiKey, kimiMode })
            : JSON.stringify({ kimiEnabled: false });

          const data = await apiPost('/api/track/align', alignBody, { headers: { 'Content-Type': 'application/json' } });
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
          btnAlign.disabled = false;
          updateActionButtons();
        }
      });
    }

    const btnRenderTrack = $('btn-render-track');
    if (btnRenderTrack) {
      btnRenderTrack.addEventListener('click', async () => {
        btnRenderTrack.disabled = true;
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
          btnRenderTrack.disabled = false;
        }
      });
    }
  }

  function reset() {
    state.sessionId = null;
    state.duration = 0;
    state.segments = [];
    state.aligned = [];
    state.packagingPoints = [];
    state.unaligned = { sentences: [], packagingPoints: [] };

    const inputs = ['media-input', 'subtitle-input', 'track-script-text', 'script-file-input'];
    inputs.forEach((id) => {
      const el = $(id);
      if (el) el.value = '';
    });

    const names = ['media-name', 'subtitle-name', 'script-file-name'];
    names.forEach((id) => {
      const el = $(id);
      if (el) el.textContent = '未选择文件';
    });

    const mediaInfo = $('media-info');
    if (mediaInfo) {
      mediaInfo.classList.add('hidden');
      mediaInfo.innerHTML = '';
    }

    clearStatus('align-status');
    clearStatus('render-status');

    const downloadArea = $('download-area');
    if (downloadArea) downloadArea.classList.add('hidden');

    renderTranscript();
    renderAligned();
    renderPackagingTimeline();
    renderUnaligned();
    updateActionButtons();
  }

  function init() {
    bindEvents();
    updateActionButtons();
    console.log('完整包装轨面板已就绪');
  }

  return { init, reset };
})();
