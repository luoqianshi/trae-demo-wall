/**
 * 实时转写工作台模块
 * 功能：录音控制、Canvas音频波形、实时转写流、实时摘要、说话人重命名
 */
(function () {
  let canvas, ctx, animationId;
  let isRecording = false;
  let isPaused = false;
  let currentScene = 'meeting';
  let transcriptData = [];
  let speakerColors = {};
  let renderIndex = 0;
  let typeTimer = null;
  let speakers = [];

  const scenes = {
    meeting: '会议场景',
    class: '课堂场景',
    interview: '访谈场景'
  };

  function getSceneData() {
    const key = currentScene + 'Data';
    return (window.AppData && window.AppData[key]) || { speakers: [], transcript: [], summary: {} };
  }

  function assignSpeakerColors() {
    const palette = ['bg-blue-100 text-blue-700 border-blue-200', 'bg-emerald-100 text-emerald-700 border-emerald-200', 'bg-amber-100 text-amber-700 border-amber-200', 'bg-rose-100 text-rose-700 border-rose-200', 'bg-violet-100 text-violet-700 border-violet-200'];
    speakerColors = {};
    speakers.forEach((sp, i) => {
      speakerColors[sp.id] = palette[i % palette.length];
    });
  }

  function renderControlBar() {
    return `
      <div class="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-white border-b border-gray-200">
        <div class="flex items-center gap-2">
          <button id="rt-record-btn" class="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors">
            <i data-lucide="mic" class="w-4 h-4"></i>
            <span>开始录音</span>
          </button>
          <button id="rt-pause-btn" class="hidden flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium transition-colors">
            <i data-lucide="pause" class="w-4 h-4"></i>
            <span>暂停</span>
          </button>
          <button id="rt-resume-btn" class="hidden flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-colors">
            <i data-lucide="play" class="w-4 h-4"></i>
            <span>继续</span>
          </button>
          <button id="rt-stop-btn" class="hidden flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-800 text-white text-sm font-medium transition-colors">
            <i data-lucide="square" class="w-4 h-4"></i>
            <span>停止</span>
          </button>
        </div>
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-1.5 text-sm text-gray-600">
            <i data-lucide="layers" class="w-4 h-4"></i>
            <select id="rt-scene-select" class="px-2 py-1.5 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="meeting">${scenes.meeting}</option>
              <option value="class">${scenes.class}</option>
              <option value="interview">${scenes.interview}</option>
            </select>
          </div>
          <div class="flex items-center gap-1.5 text-sm text-gray-600">
            <i data-lucide="globe" class="w-4 h-4"></i>
            <select id="rt-lang-select" class="px-2 py-1.5 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="zh">中文</option>
              <option value="en">English</option>
              <option value="ja">日本語</option>
            </select>
          </div>
          <label class="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
            <input id="rt-denoise" type="checkbox" class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" checked>
            <span>降噪</span>
          </label>
        </div>
      </div>
    `;
  }

  function renderCanvasArea() {
    return `
      <div class="relative h-40 bg-gray-900 flex items-center justify-center overflow-hidden">
        <canvas id="rt-waveform" class="w-full h-full"></canvas>
        <div id="rt-waveform-placeholder" class="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
          <span class="flex items-center gap-2"><i data-lucide="audio-waveform" class="w-4 h-4"></i>等待录音开始...</span>
        </div>
      </div>
    `;
  }

  function renderTranscriptArea() {
    return `
      <div id="rt-transcript" class="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        <div class="text-center text-gray-400 text-sm py-8">点击"开始录音"启动实时转写</div>
      </div>
    `;
  }

  function renderSummaryPanel() {
    return `
      <div class="w-80 border-l border-gray-200 bg-white flex flex-col">
        <div class="px-4 py-3 border-b border-gray-200 flex items-center gap-2">
          <i data-lucide="file-text" class="w-4 h-4 text-blue-600"></i>
          <h3 class="font-semibold text-gray-800 text-sm">实时摘要</h3>
        </div>
        <div id="rt-summary-content" class="flex-1 overflow-y-auto p-4 text-sm text-gray-700 space-y-3">
          <p class="text-gray-400">摘要将在转写开始后生成...</p>
        </div>
      </div>
    `;
  }

  function render(container) {
    container.innerHTML = `
      <div class="flex flex-col h-full">
        ${renderControlBar()}
        ${renderCanvasArea()}
        <div class="flex flex-1 overflow-hidden">
          ${renderTranscriptArea()}
          ${renderSummaryPanel()}
        </div>
      </div>
    `;
  }

  function initCanvas() {
    canvas = document.getElementById('rt-waveform');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
  }

  function drawWaveform() {
    if (!ctx || !isRecording || isPaused) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, w, h);

    const bars = 80;
    const barWidth = w / bars;
    ctx.fillStyle = '#3b82f6';
    for (let i = 0; i < bars; i++) {
      const amp = Math.random() * h * 0.5 + h * 0.05;
      const x = i * barWidth;
      const y = (h - amp) / 2;
      ctx.fillRect(x + 1, y, barWidth - 2, amp);
    }
  }

  function startAnimation() {
    document.getElementById('rt-waveform-placeholder').classList.add('hidden');
    function loop() {
      if (!isRecording) return;
      drawWaveform();
      animationId = requestAnimationFrame(loop);
    }
    loop();
  }

  function stopAnimation() {
    if (animationId) cancelAnimationFrame(animationId);
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    const ph = document.getElementById('rt-waveform-placeholder');
    if (ph) ph.classList.remove('hidden');
  }

  function createSpeakerBubble(item) {
    const sp = speakers.find(s => s.id === item.speakerId) || { name: '未知说话人', avatar: '' };
    const colorClass = speakerColors[item.speakerId] || 'bg-gray-100 text-gray-700 border-gray-200';
    const initials = sp.name.slice(0, 2);
    const time = item.time || '';

    const div = document.createElement('div');
    div.className = 'flex gap-3 animate-[fadeIn_0.3s_ease-out]';
    div.innerHTML = `
      <div class="flex-shrink-0 w-9 h-9 rounded-full ${colorClass} border flex items-center justify-center text-xs font-bold select-none cursor-pointer" title="点击重命名" data-speaker-id="${item.speakerId}">
        ${initials}
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1">
          <span class="text-xs font-medium text-gray-600 speaker-name" data-speaker-id="${item.speakerId}">${sp.name}</span>
          <span class="text-[10px] text-gray-400">${time}</span>
        </div>
        <div class="inline-block px-3 py-2 rounded-xl rounded-tl-none ${colorClass} border text-sm leading-relaxed typewriter-text" data-text="${item.text}"></div>
      </div>
    `;
    return div;
  }

  function appendTranscriptItem(item) {
    const container = document.getElementById('rt-transcript');
    if (!container) return;
    const empty = container.querySelector('.text-center');
    if (empty) empty.remove();
    const bubble = createSpeakerBubble(item);
    container.appendChild(bubble);
    container.scrollTop = container.scrollHeight;

    // 绑定重命名
    bubble.querySelector('[data-speaker-id]').addEventListener('click', function () {
      const sid = this.dataset.speakerId;
      const sp = speakers.find(s => s.id === sid);
      if (!sp) return;
      const newName = prompt('重命名说话人：', sp.name);
      if (newName && newName.trim()) {
        sp.name = newName.trim();
        document.querySelectorAll(`.speaker-name[data-speaker-id="${sid}"]`).forEach(el => el.textContent = sp.name);
        document.querySelectorAll(`[data-speaker-id="${sid}"]`).forEach(el => {
          if (el.classList.contains('rounded-full')) el.textContent = newName.trim().slice(0, 2);
        });
        if (window.App && App.showToast) App.showToast('说话人已重命名', 'success');
      }
    });

    // typewriter effect
    const textEl = bubble.querySelector('.typewriter-text');
    const fullText = item.text;
    if (window.App && App.typeWriter) {
      App.typeWriter(textEl, fullText, 30);
    } else {
      textEl.textContent = fullText;
    }
  }

  function updateSummary() {
    const container = document.getElementById('rt-summary-content');
    if (!container) return;
    const data = getSceneData();
    const sum = data.summary || {};
    let html = '';
    if (sum.overview) html += `<div class="p-2 bg-blue-50 rounded-lg text-blue-800">${sum.overview}</div>`;
    if (sum.points && sum.points.length) {
      html += `<ul class="space-y-1">`;
      sum.points.forEach(p => {
        html += `<li class="flex gap-2"><i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5"></i><span>${p}</span></li>`;
      });
      html += `</ul>`;
    }
    if (!html) html = '<p class="text-gray-400">摘要生成中...</p>';
    container.innerHTML = html;
    if (window.lucide) lucide.createIcons();
  }

  function startTypingSimulation() {
    const data = getSceneData();
    transcriptData = data.transcript || [];
    speakers = data.speakers || [];
    assignSpeakerColors();
    renderIndex = 0;
    document.getElementById('rt-transcript').innerHTML = '';

    function tick() {
      if (!isRecording || isPaused) return;
      if (renderIndex >= transcriptData.length) {
        if (window.App && App.showToast) App.showToast('转写完成', 'success');
        return;
      }
      appendTranscriptItem(transcriptData[renderIndex]);
      renderIndex++;
      // 更新摘要（每3句更新一次）
      if (renderIndex % 3 === 0) updateSummary();
      const delay = Math.max(200, Math.random() * 1200 + 300);
      typeTimer = setTimeout(tick, delay);
    }
    tick();
  }

  function stopTypingSimulation() {
    if (typeTimer) clearTimeout(typeTimer);
  }

  function bindEvents() {
    const recordBtn = document.getElementById('rt-record-btn');
    const pauseBtn = document.getElementById('rt-pause-btn');
    const resumeBtn = document.getElementById('rt-resume-btn');
    const stopBtn = document.getElementById('rt-stop-btn');
    const sceneSelect = document.getElementById('rt-scene-select');

    if (sceneSelect) {
      sceneSelect.addEventListener('change', (e) => {
        currentScene = e.target.value;
        if (!isRecording) {
          document.getElementById('rt-transcript').innerHTML = '<div class="text-center text-gray-400 text-sm py-8">场景已切换，点击"开始录音"启动实时转写</div>';
        }
      });
    }

    if (recordBtn) {
      recordBtn.addEventListener('click', () => {
        isRecording = true;
        isPaused = false;
        recordBtn.classList.add('hidden');
        pauseBtn.classList.remove('hidden');
        stopBtn.classList.remove('hidden');
        startAnimation();
        startTypingSimulation();
        if (window.App && App.showToast) App.showToast('录音已开始', 'success');
      });
    }

    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => {
        isPaused = true;
        pauseBtn.classList.add('hidden');
        resumeBtn.classList.remove('hidden');
        if (window.App && App.showToast) App.showToast('录音已暂停', 'info');
      });
    }

    if (resumeBtn) {
      resumeBtn.addEventListener('click', () => {
        isPaused = false;
        resumeBtn.classList.add('hidden');
        pauseBtn.classList.remove('hidden');
        startAnimation();
        startTypingSimulation();
        if (window.App && App.showToast) App.showToast('录音已恢复', 'success');
      });
    }

    if (stopBtn) {
      stopBtn.addEventListener('click', () => {
        isRecording = false;
        isPaused = false;
        stopTypingSimulation();
        stopAnimation();
        recordBtn.classList.remove('hidden');
        pauseBtn.classList.add('hidden');
        resumeBtn.classList.add('hidden');
        stopBtn.classList.add('hidden');
        if (window.App && App.showToast) App.showToast('录音已停止', 'info');
      });
    }

    window.addEventListener('resize', () => {
      if (canvas) {
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
    });
  }

  function init() {
    initCanvas();
    bindEvents();
    if (window.lucide) lucide.createIcons();
  }

  window.RealtimeModule = { render, init };
})();
