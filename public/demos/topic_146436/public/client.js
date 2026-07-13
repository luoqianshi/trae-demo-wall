(() => {
  'use strict';

  // ============ DOM ============
  const inkCanvas = document.getElementById('ink-canvas');
  const revealCanvas = document.getElementById('reveal-canvas');
  const inkCtx = inkCanvas.getContext('2d');
  const revealCtx = revealCanvas.getContext('2d');
  const statusText = document.getElementById('status-text');
  const statusEl = document.getElementById('status');
  const moodDisplay = document.getElementById('mood-display');
  const moodEmoji = document.getElementById('mood-emoji');
  const moodText = document.getElementById('mood-text');
  const speakBtn = document.getElementById('btn-speak');
  const checkinBtn = document.getElementById('btn-checkin');
  const voiceToggleBtn = document.getElementById('btn-voice-toggle');
  const promptText = document.getElementById('prompt-text');

  // ============ 状态 ============
  let cw = 0, ch = 0;
  let drawing = false, lx = 0, ly = 0, lt = 0, lw = 0;
  let paths = [], curPath = [];
  let stopTimer = null, processing = false, drawn = false;
  let history = [];
  let inkColor = '#5a4a3a', colorIdx = 0;
  const colors = ['#5a4a3a', '#4a7b6a', '#7a5a4a', '#5a6b9a', '#9a5a5a', '#5a8a7a', '#8a6a9a'];
  let sizeIdx = 1;
  const sizes = [1.5, 2.5, 4];
  let stopDelay = 2000, fontChoice = 'long-cang', voiceRate = 0.9;
  let lastReply = '';
  let speaking = false;
  let voiceEnabled = true;
  let lastSnapshot = null;
  let lastMood = '平静';
  let currentPromptIndex = 0;

  const MOOD_EMOJI = { '开心': '😊', '平静': '😌', '焦虑': '😰', '孤独': '😔', '压力': '😣', '愤怒': '😤', '悲伤': '😢', '期待': '🤗', '迷茫': '😵', '感恩': '🙏' };
  const MOOD_COLORS = { '开心': '#f4a261', '平静': '#7ec8b8', '焦虑': '#e76f51', '孤独': '#8b7757', '压力': '#e76f51', '愤怒': '#e63946', '悲伤': '#6a8caf', '期待': '#f4a261', '迷茫': '#b0a090', '感恩': '#7ec8b8' };

  // 每日提示语
  const DAILY_PROMPTS = [
    '今天的心情是什么颜色？画下来，或者写几个字告诉我',
    '此刻的内心是什么天气？画出来让我看看',
    '今天发生了什么想说的？写下来或画下来',
    '如果今天是一种形状，它会是什么样的？',
    '画一棵树，或者写一句话，让我感受今天的你',
    '心里装了什么？把它画在纸上释放出来',
    '今天最想表达什么？用任何方式都可以',
    '画一个让你感到安全的地方，是什么样的？',
    '如果压力有形状，它会是什么样子？',
    '画一件今天让你感恩的小事',
    '此刻最想对自己说的一句话是什么？写下来',
    '画一个你心中的小太阳，它是什么样的？'
  ];

  // ============ 语音合成 ============
  let voices = [];
  function loadVoices() { voices = window.speechSynthesis ? speechSynthesis.getVoices() : []; }
  if (window.speechSynthesis) {
    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;
  }

  function speak(text) {
    if (!window.speechSynthesis) { return; }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    // 选中文语音
    const zhVoice = voices.find(v => v.lang === 'zh-CN') || voices.find(v => v.lang.startsWith('zh'));
    if (zhVoice) u.voice = zhVoice;
    u.rate = voiceRate;
    u.pitch = 1.0;
    u.volume = 1.0;
    u.onstart = () => { speaking = true; speakBtn.classList.add('speaking'); speakBtn.querySelector('span').textContent = '正在说...'; };
    u.onend = () => { speaking = false; speakBtn.classList.remove('speaking'); speakBtn.querySelector('span').textContent = '听小暖说'; };
    u.onerror = () => { speaking = false; speakBtn.classList.remove('speaking'); speakBtn.querySelector('span').textContent = '听小暖说'; };
    speechSynthesis.speak(u);
  }

  function stopSpeak() {
    if (window.speechSynthesis) speechSynthesis.cancel();
    speaking = false;
    speakBtn.classList.remove('speaking');
    speakBtn.querySelector('span').textContent = '听小暖说';
  }

  // 统一更新语音开关的 UI（顶部按钮 + 设置面板复选框）
  function applyVoiceUI() {
    voiceToggleBtn.classList.toggle('voice-on', voiceEnabled);
    voiceToggleBtn.classList.toggle('voice-off', !voiceEnabled);
    const sw = document.getElementById('voice-switch');
    if (sw) sw.checked = voiceEnabled;
  }

  function setVoiceEnabled(enabled) {
    voiceEnabled = !!enabled;
    applyVoiceUI();
    if (!voiceEnabled) stopSpeak();
    localStorage.setItem('md_voice', voiceEnabled ? '1' : '0');
  }

  // ============ 初始化 ============
  function init() {
    // 显示今天日期
    const today = new Date();
    const dateStr = today.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
    document.getElementById('today-date').textContent = dateStr;

    // 随机每日提示
    currentPromptIndex = Math.floor(Math.random() * DAILY_PROMPTS.length);
    promptText.textContent = DAILY_PROMPTS[currentPromptIndex];

    // 换问题按钮
    document.getElementById('btn-change-prompt').addEventListener('click', () => {
      currentPromptIndex = (currentPromptIndex + 1) % DAILY_PROMPTS.length;
      promptText.textContent = DAILY_PROMPTS[currentPromptIndex];
      // 清空画板，准备回答新问题
      clearInk(); clearReveal(); hideMood(); hideSpeak(); hideCheckin(); stopSpeak();
      history = []; // 换问题后重置对话历史
      setStatus('换了一个新问题，画下或写下你的回答吧');
    });

    resize();
    window.addEventListener('resize', resize);
    setupDrawing();
    setupToolbar();
    setupSettings();
    setupModals();
    checkAI();

    // 语音按钮
    speakBtn.addEventListener('click', () => {
      if (speaking) { stopSpeak(); }
      else if (lastReply) { speak(lastReply); }
    });

    // 语音开关（顶部按钮）
    voiceToggleBtn.addEventListener('click', () => setVoiceEnabled(!voiceEnabled));

    // 从 localStorage 加载语音开关状态
    const savedVoice = localStorage.getItem('md_voice');
    if (savedVoice !== null) {
      setVoiceEnabled(savedVoice === '1');
    } else {
      applyVoiceUI();
    }

    // 打卡按钮
    checkinBtn.addEventListener('click', doCheckin);

    // 心情卡片弹窗
    document.getElementById('btn-close-card').addEventListener('click', () => {
      document.getElementById('card-modal').classList.remove('open');
    });
    document.getElementById('card-modal').addEventListener('click', e => {
      if (e.target.id === 'card-modal') e.target.classList.remove('open');
    });
    document.getElementById('btn-export-card').addEventListener('click', exportCard);

    // 二维码按钮
    document.getElementById('btn-qr').addEventListener('click', showQRModal);
    document.getElementById('btn-close-qr').addEventListener('click', () => {
      document.getElementById('qr-modal').classList.remove('open');
    });
    document.getElementById('qr-modal').addEventListener('click', e => {
      if (e.target.id === 'qr-modal') e.target.classList.remove('open');
    });

    // 手势模式切换按钮
    const gestureBtn = document.getElementById('btn-gesture-mode');
    if (gestureBtn) {
      gestureBtn.addEventListener('click', toggleGestureMode);
      // 设备检测：触屏设备（Pad/手机）隐藏摄像头手势按钮，默认用手写
      // 非触屏设备（电脑）默认自动开启摄像头手势模式
      if (isTouchDevice()) {
        gestureBtn.style.display = 'none';
      } else {
        // 电脑版：页面加载后自动开启手势模式
        setTimeout(() => {
          toggleGestureMode();
        }, 800);
      }
    }

    // 首次访问功能介绍
    showWelcomeIfFirstTime();
  }

  function resize() {
    const paper = document.querySelector('.paper');
    if (!paper) return;
    const rect = paper.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    cw = rect.width; ch = rect.height;
    [inkCanvas, revealCanvas].forEach(c => {
      c.width = cw * dpr; c.height = ch * dpr;
      c.style.width = cw + 'px'; c.style.height = ch + 'px';
      c.getContext('2d').scale(dpr, dpr);
    });
    redraw();
  }

  // ============ 手写 ============
  function setupDrawing() {
    const paper = document.querySelector('.paper');
    paper.addEventListener('mousedown', startDraw);
    paper.addEventListener('mousemove', draw);
    paper.addEventListener('mouseup', endDraw);
    paper.addEventListener('mouseleave', endDraw);
    paper.addEventListener('touchstart', e => { e.preventDefault(); const t = e.touches[0]; const r = inkCanvas.getBoundingClientRect(); startAt(t.clientX - r.left, t.clientY - r.top); }, { passive: false });
    paper.addEventListener('touchmove', e => { e.preventDefault(); const t = e.touches[0]; const r = inkCanvas.getBoundingClientRect(); drawAt(t.clientX - r.left, t.clientY - r.top); }, { passive: false });
    paper.addEventListener('touchend', endDraw);
    paper.addEventListener('touchcancel', endDraw);
  }

  function startDraw(e) { const r = inkCanvas.getBoundingClientRect(); startAt(e.clientX - r.left, e.clientY - r.top); }

  function startAt(x, y) {
    if (processing) return;
    drawing = true; drawn = true;
    clearReveal(); hideMood(); hideSpeak(); hideCheckin();
    stopSpeak();
    lx = x; ly = y; lt = Date.now(); lw = sizes[sizeIdx];
    curPath = [{ x, y, w: lw }];
    paths.push({ color: inkColor, points: curPath });
    if (stopTimer) { clearTimeout(stopTimer); stopTimer = null; }
    setStatus('书写中...');
  }

  function draw(e) { if (!drawing) return; const r = inkCanvas.getBoundingClientRect(); drawAt(e.clientX - r.left, e.clientY - r.top); }

  function drawAt(x, y) {
    if (!drawing) return;
    const now = Date.now();
    const dt = now - lt;
    const dist = Math.hypot(x - lx, y - ly);
    const speed = dist / (dt || 1);
    const base = sizes[sizeIdx];
    let w = base * 1.5 - speed * 0.5;
    w = Math.max(base * 0.5, Math.min(base * 1.5, w));
    w = lw + (w - lw) * 0.3;
    inkCtx.strokeStyle = inkColor;
    inkCtx.lineCap = 'round'; inkCtx.lineJoin = 'round';
    inkCtx.lineWidth = w; inkCtx.globalAlpha = 0.85;
    // 用 quadraticCurveTo 平滑：从上一点画到当前点，控制点用中点
    const mx = (lx + x) / 2, my = (ly + y) / 2;
    inkCtx.beginPath();
    inkCtx.moveTo(lx, ly);
    inkCtx.quadraticCurveTo(mx, my, x, y);
    inkCtx.stroke();
    curPath.push({ x, y, w });
    lx = x; ly = y; lt = now; lw = w;
  }

  function endDraw() {
    if (!drawing) return;
    drawing = false;
    if (stopTimer) clearTimeout(stopTimer);
    stopTimer = setTimeout(onStop, stopDelay);
  }

  function onStop() {
    if (processing) return;
    const total = paths.reduce((a, s) => a + s.points.length, 0);
    if (total < 5) { setStatus('在纸上画下或写下你的心情'); return; }
    processing = true;
    setStatus('小暖正在感受你的心情...', true);
    const snapshot = capture();
    fadeOut();
    setTimeout(() => respond(snapshot), 1500);
  }

  // ============ 截图 ============
  function capture() {
    const w = inkCanvas.width, h = inkCanvas.height;
    const imgData = inkCtx.getImageData(0, 0, w, h);
    const px = imgData.data;
    let minX = w, minY = h, maxX = 0, maxY = 0, has = false;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (px[(y * w + x) * 4 + 3] > 10) {
          has = true;
          if (x < minX) minX = x; if (x > maxX) maxX = x;
          if (y < minY) minY = y; if (y > maxY) maxY = y;
        }
      }
    }
    if (!has) return null;
    const pad = 20;
    minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad);
    maxX = Math.min(w, maxX + pad); maxY = Math.min(h, maxY + pad);
    const cropW = maxX - minX, cropH = maxY - minY;
    const tmp = document.createElement('canvas');
    const maxDim = 800;
    const scale = (cropW > maxDim || cropH > maxDim) ? maxDim / Math.max(cropW, cropH) : 1;
    tmp.width = Math.round(cropW * scale);
    tmp.height = Math.round(cropH * scale);
    const ctx = tmp.getContext('2d');
    ctx.fillStyle = '#faf6ef';
    ctx.fillRect(0, 0, tmp.width, tmp.height);
    ctx.drawImage(inkCanvas, minX, minY, cropW, cropH, 0, 0, tmp.width, tmp.height);
    return tmp.toDataURL('image/png');
  }

  // ============ 淡出 ============
  function fadeOut() {
    const start = Date.now();
    (function anim() {
      const op = 1 - (Date.now() - start) / 1400;
      if (op <= 0) { clearInk(); return; }
      inkCtx.clearRect(0, 0, cw, ch);
      inkCtx.globalAlpha = op;
      redraw();
      inkCtx.globalAlpha = 1;
      requestAnimationFrame(anim);
    })();
  }

  function redraw() {
    paths.forEach(s => {
      if (s.points.length < 2) return;
      inkCtx.strokeStyle = s.color;
      inkCtx.lineCap = 'round'; inkCtx.lineJoin = 'round';
      inkCtx.globalAlpha = 0.85;
      inkCtx.beginPath();
      inkCtx.moveTo(s.points[0].x, s.points[0].y);
      for (let i = 1; i < s.points.length; i++) {
        inkCtx.lineWidth = s.points[i].w || 2.5;
        inkCtx.lineTo(s.points[i].x, s.points[i].y);
      }
      inkCtx.stroke();
    });
    inkCtx.globalAlpha = 1;
  }

  function clearInk() { inkCtx.clearRect(0, 0, cw, ch); paths = []; curPath = []; }
  function clearReveal() { revealCtx.clearRect(0, 0, cw, ch); }
  function hideMood() { moodDisplay.style.display = 'none'; }
  function hideSpeak() { speakBtn.style.display = 'none'; }
  function hideCheckin() { checkinBtn.style.display = 'none'; }

  // ============ AI 回复 ============
  async function respond(snapshot) {
    if (!snapshot) { setStatus('未检测到笔迹，请再试一次'); processing = false; return; }
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 60000);
    try {
      const r = await fetch('/api/diary/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: snapshot, history, guideTopic: DAILY_PROMPTS[currentPromptIndex] }),
        signal: ctrl.signal
      });
      clearTimeout(tid);
      if (!r.ok) { const e = await r.json(); throw new Error(e.error || 'AI 响应失败'); }
      const data = await r.json();

      history.push({ role: 'user', content: data.recognized || '[用户画作/文字]' });
      history.push({ role: 'assistant', content: data.reply });
      if (history.length > 20) history = history.slice(-20);

      lastSnapshot = snapshot;
      lastMood = data.mood; // 可能为 null
      if (data.mood) { showMood(data.mood); } else { hideMood(); }
      setStatus('');
      lastReply = data.reply;
      revealText(data.reply);
    } catch (e) {
      clearTimeout(tid);
      setStatus(e.name === 'AbortError' ? '响应超时，请重试' : '出错了: ' + e.message);
      processing = false;
    }
  }

  function showMood(mood) {
    moodEmoji.textContent = MOOD_EMOJI[mood] || '📝';
    moodText.textContent = mood || '平静';
    moodText.style.color = MOOD_COLORS[mood] || '#7ec8b8';
    moodDisplay.style.display = 'flex';
  }

  async function saveDiary(userImage, aiReply, mood, portraitUrl, encouragement) {
    try {
      await fetch('/api/diary/save', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userImage, aiReply, mood, portraitUrl, encouragement })
      });
    } catch (e) { console.error('save error:', e); }
  }

  // ============ 每日打卡 ============
  let currentCardData = null; // 保存当前卡片数据供导出使用

  async function doCheckin() {
    if (!lastReply) { setStatus('请先和小暖聊一聊再打卡'); return; }
    checkinBtn.disabled = true;
    hideSpeak();
    setStatus('小暖正在为你画今日心情画像...', true);

    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 120000); // 画像生成可能较慢，2分钟超时
    try {
      const r = await fetch('/api/diary/portrait', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userImage: lastSnapshot,
          aiReply: lastReply,
          mood: lastMood,
          chatHistory: history
        }),
        signal: ctrl.signal
      });
      clearTimeout(tid);
      if (!r.ok) { const e = await r.json(); throw new Error(e.error || '画像生成失败'); }
      const data = await r.json();

      // 保存日记
      await saveDiary(lastSnapshot, lastReply, lastMood, data.portraitUrl, data.encouragement);

      // 准备卡片数据
      const today = new Date();
      const dateStr = today.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
      currentCardData = {
        portraitUrl: data.portraitUrl,
        encouragement: data.encouragement,
        mood: lastMood || '心情',
        date: dateStr,
        aiReply: lastReply
      };

      // 展示卡片预览
      showCardPreview(currentCardData);
      setStatus('今日心情已保存 ✨');
      checkinBtn.disabled = false;
      hideCheckin();
    } catch (e) {
      clearTimeout(tid);
      checkinBtn.disabled = false;
      setStatus(e.name === 'AbortError' ? '画像生成超时，请重试' : '出错了: ' + e.message);
    }
  }

  function showCardPreview(data) {
    const preview = document.getElementById('card-preview');
    const emoji = MOOD_EMOJI[data.mood] || '📝';
    const color = MOOD_COLORS[data.mood] || '#7ec8b8';
    preview.innerHTML = `
      <div style="background:linear-gradient(160deg, #f5f0eb 0%, #ede4d9 100%); padding:18px; border:1px solid rgba(126,200,184,0.2);">
        <div style="text-align:center; color:#8b7757; font-size:13px; margin-bottom:8px;">${data.date}</div>
        <div style="text-align:center; margin-bottom:12px;">
          <span style="display:inline-block; padding:4px 14px; background:${color}20; color:${color}; border-radius:12px; font-size:14px;">
            ${emoji} ${data.mood}
          </span>
        </div>
        <img src="${data.portraitUrl}" style="width:100%; border-radius:8px; display:block; margin-bottom:12px;">
        <div style="text-align:center; color:#5a4a3a; font-size:14px; line-height:1.8; padding:0 8px 10px; font-family:'Long Cang','Ma Shan Zheng','Noto Sans SC',cursive;">
          ${data.aiReply}
        </div>
        <div style="text-align:center; color:#5a9e8e; font-size:15px; font-weight:500; padding:8px 0; border-top:1px dashed rgba(126,200,184,0.3);">
          ${data.encouragement}
        </div>
      </div>
    `;
    document.getElementById('card-modal').classList.add('open');
  }

  // ============ 导出心情日记卡 ============
  async function exportCard() {
    if (!currentCardData) { return; }
    const btn = document.getElementById('btn-export-card');
    const originalText = btn.textContent;
    btn.textContent = '正在生成图片...';
    btn.disabled = true;
    try {
      const cardBlob = await renderCardToImage(currentCardData);
      // 触发下载
      const url = URL.createObjectURL(cardBlob);
      const a = document.createElement('a');
      a.href = url;
      const today = new Date();
      const fname = `mind-diary-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}.png`;
      a.download = fname;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('export error:', e);
      setStatus('导出失败: ' + e.message);
    } finally {
      btn.textContent = originalText;
      btn.disabled = false;
    }
  }

  // 将心情卡片渲染为图片
  function renderCardToImage(data) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const W = 720, H = 1080;
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext('2d');

      // 背景
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#f5f0eb');
      grad.addColorStop(0.5, '#ede4d9');
      grad.addColorStop(1, '#e8ddd3');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // 顶部装饰条
      ctx.fillStyle = 'rgba(126, 200, 184, 0.3)';
      ctx.fillRect(0, 0, W, 6);

      // 日期
      ctx.fillStyle = '#8b7757';
      ctx.font = '24px "Noto Sans SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(data.date, W / 2, 60);

      // 心情标签
      const moodColor = MOOD_COLORS[data.mood] || '#7ec8b8';
      const emoji = MOOD_EMOJI[data.mood] || '📝';
      ctx.font = '28px "Noto Sans SC", sans-serif';
      const moodText = `${emoji} ${data.mood}`;
      const moodW = ctx.measureText(moodText).width + 40;
      ctx.fillStyle = moodColor + '20';
      roundRect(ctx, W / 2 - moodW / 2, 85, moodW, 40, 20);
      ctx.fill();
      ctx.fillStyle = moodColor;
      ctx.fillText(moodText, W / 2, 113);

      // 加载并绘制画像
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        // 画像区域：居中，最大宽度 600
        const maxW = 600;
        const maxH = 460;
        let iw = img.width, ih = img.height;
        const scale = Math.min(maxW / iw, maxH / ih);
        iw = iw * scale; ih = ih * scale;
        const ix = (W - iw) / 2;
        const iy = 150;
        // 圆角裁剪
        ctx.save();
        roundRect(ctx, ix, iy, iw, ih, 12);
        ctx.clip();
        ctx.drawImage(img, ix, iy, iw, ih);
        ctx.restore();
        // 边框
        ctx.strokeStyle = 'rgba(126, 200, 184, 0.2)';
        ctx.lineWidth = 1;
        roundRect(ctx, ix, iy, iw, ih, 12);
        ctx.stroke();

        drawTextContent();
      };
      img.onerror = () => {
        // 图片加载失败，画占位
        ctx.fillStyle = 'rgba(126, 200, 184, 0.1)';
        roundRect(ctx, 60, 150, W - 120, 460, 12);
        ctx.fill();
        ctx.fillStyle = '#b0a090';
        ctx.font = '18px "Noto Sans SC", sans-serif';
        ctx.fillText('（画像加载失败）', W / 2, 380);
        drawTextContent();
      };

      // 绘制文字内容（AI回复 + 鼓励语）
      function drawTextContent() {
        let y = 640;
        // AI 回复
        ctx.fillStyle = '#5a4a3a';
        ctx.font = '24px "Noto Sans SC", sans-serif';
        ctx.textAlign = 'center';
        const replyLines = wrapText(ctx, data.aiReply, W - 120);
        replyLines.forEach(line => {
          ctx.fillText(line, W / 2, y);
          y += 38;
        });

        // 分隔线
        y += 20;
        ctx.strokeStyle = 'rgba(126, 200, 184, 0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(100, y);
        ctx.lineTo(W - 100, y);
        ctx.stroke();
        ctx.setLineDash([]);

        // 鼓励语
        y += 40;
        ctx.fillStyle = '#5a9e8e';
        ctx.font = 'bold 26px "Noto Sans SC", sans-serif';
        ctx.fillText(data.encouragement, W / 2, y);

        // 底部签名
        y = H - 50;
        ctx.fillStyle = '#b0a090';
        ctx.font = '16px "Noto Sans SC", sans-serif';
        ctx.fillText('心晴日记 · 小暖陪伴', W / 2, y);

        // 转 blob
        canvas.toBlob(blob => {
          if (blob) resolve(blob);
          else reject(new Error('canvas toBlob failed'));
        }, 'image/png');
      }

      // 加载图片
      img.src = data.portraitUrl;
      // 超时保护
      setTimeout(() => {
        if (!img.complete) {
          // 图片加载超时，继续生成不带图片
          drawTextContent();
        }
      }, 15000);
    });
  }

  // 圆角矩形辅助函数
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // 文本换行辅助函数
  function wrapText(ctx, text, maxWidth) {
    const lines = [];
    let line = '';
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (ch === '\n') { lines.push(line); line = ''; continue; }
      const test = line + ch;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = ch;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  // ============ 文字浮现 ============
  function revealText(text) {
    const pad = 40, maxW = cw - pad * 2, startY = 80;
    // 底部安全区域：避开按钮（mood 200px / speak 128px / checkin 70px / status 18px）
    // 留出 240px 底部空间给按钮，文字只绘制到 ch - 240
    const bottomSafe = 240;
    const maxY = ch - bottomSafe;
    clearReveal();
    const isZh = /[\u4e00-\u9fa5]/.test(text);
    const ff = isZh
      ? (fontChoice === 'long-cang' ? "'Long Cang', 'Ma Shan Zheng'" : "'Ma Shan Zheng', 'Long Cang'")
      : "'Caveat', cursive";
    let fs = isZh ? 26 : 22;
    let lh = isZh ? 42 : 36;
    revealCtx.font = `${fs}px ${ff}`;
    revealCtx.fillStyle = '#5a4a3a';
    revealCtx.textBaseline = 'top';

    const chars = text.split('');
    let lines = [];
    let line = '';
    chars.forEach(ch => {
      if (revealCtx.measureText(line + ch).width > maxW && line) { lines.push(line); line = ch; }
      else line += ch;
    });
    if (line) lines.push(line);

    // 如果文字超出可绘制区域，缩小字号重排
    const maxLines = Math.floor((maxY - startY) / lh);
    if (lines.length > maxLines) {
      // 缩小字号尝试适配
      while (fs > 16 && lines.length > maxLines) {
        fs -= 2; lh = isZh ? fs * 1.6 : fs * 1.5;
        revealCtx.font = `${fs}px ${ff}`;
        lines = []; line = '';
        chars.forEach(ch => {
          if (revealCtx.measureText(line + ch).width > maxW && line) { lines.push(line); line = ch; }
          else line += ch;
        });
        if (line) lines.push(line);
      }
    }
    // 仍然超长则截断（保留最后一行显示省略号）
    const finalMaxLines = Math.floor((maxY - startY) / lh);
    if (lines.length > finalMaxLines) {
      lines = lines.slice(0, finalMaxLines);
      if (lines.length > 0) lines[lines.length - 1] = lines[lines.length - 1].slice(0, -2) + '…';
    }

    const all = [];
    lines.forEach((ln, li) => {
      let x = pad;
      for (let i = 0; i < ln.length; i++) {
        const w = revealCtx.measureText(ln[i]).width;
        all.push({ ch: ln[i], x, y: startY + li * lh });
        x += w * 1.05;
      }
    });

    let idx = 0;
    (function next() {
      if (idx >= all.length) {
        processing = false;
        setStatus('点击页面继续');
        // 显示语音和打卡按钮
        speakBtn.style.display = 'flex';
        checkinBtn.style.display = 'flex';
        // 自动语音播放（受开关控制）
        if (voiceEnabled) {
          setTimeout(() => { if (lastReply && !speaking) speak(lastReply); }, 500);
        }
        return;
      }
      const ci = all[idx];
      let op = 0;
      const st = Date.now();
      (function fi() {
        op = Math.min(1, (Date.now() - st) / 300);
        const spread = 1 - op;
        revealCtx.save();
        revealCtx.globalAlpha = op * 0.9;
        revealCtx.fillStyle = '#5a4a3a';
        revealCtx.font = `${fs + spread * 2}px ${ff}`;
        revealCtx.fillText(ci.ch, ci.x, ci.y + spread * 3);
        revealCtx.restore();
        if (op < 1) requestAnimationFrame(fi);
      })();
      idx++;
      setTimeout(next, 55 + Math.random() * 30);
    })();
  }

  // ============ 工具栏 ============
  function setupToolbar() {
    document.getElementById('btn-clear').addEventListener('click', () => {
      if (processing) return;
      clearInk(); clearReveal(); hideMood(); hideSpeak(); hideCheckin(); stopSpeak();
      setStatus('页面已清空');
      setTimeout(() => setStatus('在纸上画下或写下你的心情'), 1500);
    });
    document.getElementById('btn-color').addEventListener('click', () => {
      colorIdx = (colorIdx + 1) % colors.length;
      inkColor = colors[colorIdx];
      document.getElementById('ink-color-dot').style.background = inkColor;
    });
    document.getElementById('btn-size').addEventListener('click', () => {
      sizeIdx = (sizeIdx + 1) % sizes.length;
      document.getElementById('btn-size').innerHTML =
        `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="${3 + sizeIdx * 2}"/></svg>`;
    });
  }

  // ============ 设置 & 弹窗 ============
  function setupSettings() {
    document.getElementById('btn-settings').addEventListener('click', () => {
      document.getElementById('settings-panel').classList.add('open');
    });
    document.getElementById('btn-close-settings').addEventListener('click', () => {
      document.getElementById('settings-panel').classList.remove('open');
    });
    document.getElementById('settings-panel').addEventListener('click', e => {
      if (e.target.id === 'settings-panel') e.target.classList.remove('open');
    });
    document.getElementById('font-select').addEventListener('change', e => {
      fontChoice = e.target.value; localStorage.setItem('md_font', fontChoice);
    });
    document.getElementById('delay-select').addEventListener('change', e => {
      stopDelay = parseFloat(e.target.value) * 1000; localStorage.setItem('md_delay', stopDelay);
    });
    document.getElementById('voice-rate').addEventListener('change', e => {
      voiceRate = parseFloat(e.target.value); localStorage.setItem('md_vrate', voiceRate);
    });
    // 设置面板里的语音开关
    document.getElementById('voice-switch').addEventListener('change', e => {
      setVoiceEnabled(e.target.checked);
    });
    // 加载设置
    const sf = localStorage.getItem('md_font'), sd = localStorage.getItem('md_delay'), sv = localStorage.getItem('md_vrate');
    if (sf) { fontChoice = sf; document.getElementById('font-select').value = sf; }
    if (sd) { stopDelay = parseInt(sd); document.getElementById('delay-select').value = (stopDelay / 1000).toString(); }
    if (sv) { voiceRate = parseFloat(sv); document.getElementById('voice-rate').value = sv.toString(); }
  }

  function setupModals() {
    // 历史按钮
    document.getElementById('btn-history').addEventListener('click', async () => {
      document.getElementById('history-panel').classList.add('open');
      await loadHistory();
    });
    document.getElementById('btn-close-history').addEventListener('click', () => {
      document.getElementById('history-panel').classList.remove('open');
    });
    document.getElementById('history-panel').addEventListener('click', e => {
      if (e.target.id === 'history-panel') e.target.classList.remove('open');
    });
    // 详情关闭
    document.getElementById('btn-close-detail').addEventListener('click', () => {
      document.getElementById('diary-detail').classList.remove('open');
    });
    document.getElementById('diary-detail').addEventListener('click', e => {
      if (e.target.id === 'diary-detail') e.target.classList.remove('open');
    });
  }

  async function loadHistory() {
    try {
      const r = await fetch('/api/diary/history');
      const j = await r.json();
      const list = document.getElementById('history-list');
      if (!j.diaries || j.diaries.length === 0) {
        list.innerHTML = '<div class="history-empty">还没有日记，开始写第一篇吧 ✨</div>';
        return;
      }
      list.innerHTML = j.diaries.map(d => {
        const emoji = MOOD_EMOJI[d.mood] || '📝';
        const date = new Date(d.date).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        const color = MOOD_COLORS[d.mood] || '#7ec8b8';
        return `<div class="history-item" data-id="${d.id}">
          <div class="h-emoji">${emoji}</div>
          <div class="h-info"><div class="h-date">${date}</div><div class="h-summary">${d.aiReply.slice(0, 40)}...</div></div>
          <div class="h-mood" style="background:${color}20;color:${color};">${d.mood}</div>
        </div>`;
      }).join('');
      list.querySelectorAll('.history-item').forEach(item => {
        item.addEventListener('click', () => showDetail(parseInt(item.dataset.id), j.diaries));
      });
    } catch (e) { console.error(e); }
  }

  function showDetail(id, diaries) {
    const d = diaries.find(x => x.id === id);
    if (!d) return;
    const date = new Date(d.date).toLocaleString('zh-CN');
    const color = MOOD_COLORS[d.mood] || '#7ec8b8';
    document.getElementById('detail-body').innerHTML = `
      <div class="detail-date">${date}</div>
      <div class="detail-mood" style="background:${color}20;color:${color};">${MOOD_EMOJI[d.mood] || '📝'} ${d.mood}</div>
      ${d.userImage ? `<img class="detail-image" src="${d.userImage}" alt="">` : ''}
      <div class="detail-reply">${d.aiReply}</div>
    `;
    document.getElementById('diary-detail').classList.add('open');
  }

  async function checkAI() {
    try {
      const r = await fetch('/api/ai/status');
      const j = await r.json();
      const el = document.getElementById('ai-status-text');
      el.textContent = j.available ? '✓ 已连接' : '✗ 未配置';
      el.style.color = j.available ? '#7ec8b8' : '#e76f51';
      if (j.persona) document.getElementById('persona-name').textContent = j.persona;
    } catch (e) { document.getElementById('ai-status-text').textContent = '连接失败'; }
  }

  function setStatus(text, thinking = false) {
    statusText.textContent = text || '';
    statusEl.classList.toggle('thinking', thinking);
  }

  // 点击继续
  document.querySelector('.paper').addEventListener('click', () => {
    if (!processing && !drawing && paths.length === 0) {
      clearReveal(); hideMood(); hideSpeak(); hideCheckin(); stopSpeak();
      setStatus('在纸上画下或写下你的心情');
    }
  });

  // ============ 二维码功能 ============
  async function showQRModal() {
    const box = document.getElementById('qr-box');
    const urlText = document.getElementById('qr-url-text');
    box.innerHTML = '<div style="color:#b0a090;font-size:13px;">生成中...</div>';
    urlText.textContent = '';
    document.getElementById('qr-modal').classList.add('open');
    try {
      const r = await fetch('/api/qr');
      const j = await r.json();
      // 优先用局域网 IP（非 localhost），方便 pad 扫码访问
      const lanUrl = (j.urls || []).find(u => !u.includes('localhost') && !u.includes('127.0.0.1'));
      const url = lanUrl || j.currentUrl || j.urls[0];
      // 生成二维码
      box.innerHTML = '';
      new QRCode(box, {
        text: url,
        width: 196,
        height: 196,
        colorDark: '#5a4a3a',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
      });
      urlText.textContent = url;
    } catch (e) {
      box.innerHTML = '<div style="color:#e76f51;font-size:13px;">生成失败：' + e.message + '</div>';
    }
  }

  // ============ 手势画画模块（MediaPipe Hands）============
  let gestureMode = false;
  let handsModel = null;
  let gestureCamera = null;
  let gestureVideo = null;
  let gestureOverlay = null;
  let gestureOverlayCtx = null;
  let gestureLastX = null, gestureLastY = null;
  let gestureDrawing = false; // 食指伸直 = 作画中
  let gestureHandsReady = false;
  let gestureStream = null;
  let gestureRAF = null;
  // 食指伸直判断阈值：食指尖到手腕距离 / 食指第二关节到手腕距离 > 1.4 → 伸直
  const FINGER_STRAIGHT_RATIO = 1.4;
  // 带滞回：伸直触发 1.4，弯曲释放 1.2
  const FINGER_BEND_RATIO = 1.2;

  // 动态加载 MediaPipe Hands 脚本（仅在手势模式首次开启时加载，避免首屏负担）
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
      const s = document.createElement('script');
      s.src = src; s.crossOrigin = 'anonymous';
      s.onload = resolve; s.onerror = () => reject(new Error('加载失败: ' + src));
      document.head.appendChild(s);
    });
  }

  async function toggleGestureMode() {
    const btn = document.getElementById('btn-gesture-mode');
    if (!btn) return;
    if (!gestureMode) {
      // 开启手势模式
      btn.classList.add('active');
      document.getElementById('gesture-preview').style.display = 'block';
      setStatus('正在加载手势识别模型...');
      try {
        await startGesture();
        gestureMode = true;
        // paper 切换为透明背景模式（露出摄像头画面）
        document.querySelector('.paper').classList.add('gesture-active');
        setStatus('手势模式已开启 · 伸出食指即可作画');
        // 清空当前画板，准备手势作画
        clearInk(); clearReveal(); hideMood(); hideSpeak(); hideCheckin(); stopSpeak();
      } catch (e) {
        console.error('gesture start error:', e);
        setStatus('手势模式启动失败: ' + e.message);
        btn.classList.remove('active');
        document.getElementById('gesture-preview').style.display = 'none';
      }
    } else {
      // 关闭手势模式
      stopGesture();
      btn.classList.remove('active');
      document.getElementById('gesture-preview').style.display = 'none';
      document.querySelector('.paper').classList.remove('gesture-active');
      gestureMode = false;
      setStatus('已切换回手写模式');
    }
  }

  async function startGesture() {
    // 加载 MediaPipe Hands 脚本
    await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/hands.js');
    if (!window.Hands) throw new Error('MediaPipe Hands 加载失败');

    gestureVideo = document.getElementById('gesture-video');
    gestureOverlay = document.getElementById('gesture-overlay');
    gestureOverlayCtx = gestureOverlay.getContext('2d');
    // 设置 overlay 尺寸
    gestureOverlay.width = 320; gestureOverlay.height = 240;

    // 全屏背景 video 元素
    const gestureBg = document.getElementById('gesture-bg');

    // 初始化 Hands 模型（仅一次）
    if (!handsModel) {
      handsModel = new window.Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/${file}`
      });
      handsModel.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.5,
        selfieMode: true // 自拍镜像，坐标自动翻转
      });
      handsModel.onResults(onGestureResults);
      gestureHandsReady = true;
    }

    // 启动摄像头（原生 getUserMedia，更可控）
    gestureStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: 640, height: 480 },
      audio: false
    });
    // 同一路流给预览小窗和全屏背景
    gestureVideo.srcObject = gestureStream;
    await gestureVideo.play();
    gestureBg.srcObject = gestureStream;
    await gestureBg.play();
    gestureBg.style.display = 'block';

    // 帧循环：把 video 帧送入 Hands 识别
    const sendFrame = async () => {
      if (!gestureMode && !gestureVideo) return;
      if (gestureVideo.readyState >= 2 && handsModel) {
        try { await handsModel.send({ image: gestureVideo }); } catch (e) { /* ignore */ }
      }
      gestureRAF = requestAnimationFrame(sendFrame);
    };
    sendFrame();
  }

  function stopGesture() {
    if (gestureRAF) { cancelAnimationFrame(gestureRAF); gestureRAF = null; }
    if (gestureStream) {
      gestureStream.getTracks().forEach(t => t.stop());
      gestureStream = null;
    }
    if (gestureVideo) gestureVideo.srcObject = null;
    const gestureBg = document.getElementById('gesture-bg');
    if (gestureBg) { gestureBg.srcObject = null; gestureBg.style.display = 'none'; }
    gestureLastX = null; gestureLastY = null; gestureDrawing = false;
    // 清空 overlay
    if (gestureOverlayCtx) gestureOverlayCtx.clearRect(0, 0, gestureOverlay.width, gestureOverlay.height);
  }

  function onGestureResults(results) {
    const ov = gestureOverlayCtx;
    const ow = gestureOverlay.width, oh = gestureOverlay.height;
    ov.clearRect(0, 0, ow, oh);

    const statusEl = document.getElementById('gesture-status');
    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      // 未检测到手
      gestureLastX = null; gestureLastY = null;
      if (statusEl) { statusEl.textContent = '请把手伸到摄像头前'; statusEl.classList.remove('active'); }
      return;
    }

    const landmarks = results.multiHandLandmarks[0];
    const indexTip = landmarks[8];    // 食指尖
    const indexPip = landmarks[6];    // 食指第二关节
    const indexMcp = landmarks[5];    // 食指根部
    const wrist = landmarks[0];       // 手腕

    // 食指伸直检测：食指尖到手腕距离 vs 食指第二关节到手腕距离
    const distTipWrist = Math.hypot(indexTip.x - wrist.x, indexTip.y - wrist.y);
    const distPipWrist = Math.hypot(indexPip.x - wrist.x, indexPip.y - wrist.y);
    const ratio = distPipWrist > 0 ? distTipWrist / distPipWrist : 0;

    // 带滞回的伸直判断
    if (!gestureDrawing && ratio > FINGER_STRAIGHT_RATIO) gestureDrawing = true;
    else if (gestureDrawing && ratio < FINGER_BEND_RATIO) gestureDrawing = false;

    // 在 overlay 上绘制食指关键点
    const ix = indexTip.x * ow, iy = indexTip.y * oh;
    // 食指尖大圆（作画时绿色，准备时橙色）
    ov.fillStyle = gestureDrawing ? '#7ec8b8' : '#f4a261';
    ov.beginPath(); ov.arc(ix, iy, gestureDrawing ? 10 : 7, 0, 2 * Math.PI); ov.fill();
    // 食指骨骼连线
    const px2 = indexPip.x * ow, py2 = indexPip.y * oh;
    const mx2 = indexMcp.x * ow, my2 = indexMcp.y * oh;
    ov.strokeStyle = gestureDrawing ? '#7ec8b8' : 'rgba(244,162,97,0.6)';
    ov.lineWidth = 3;
    ov.beginPath(); ov.moveTo(mx2, my2); ov.lineTo(px2, py2); ov.lineTo(ix, iy); ov.stroke();
    // 关节点
    ov.fillStyle = '#fff';
    ov.beginPath(); ov.arc(px2, py2, 3, 0, 2 * Math.PI); ov.fill();
    ov.beginPath(); ov.arc(mx2, my2, 3, 0, 2 * Math.PI); ov.fill();

    // 把食指坐标映射到主画板（inkCanvas）
    // selfieMode 已镜像，直接用归一化坐标 * 主画板宽高
    if (gestureDrawing) {
      const px = indexTip.x * cw;
      const py = indexTip.y * ch;
      const base = sizes[sizeIdx];
      if (gestureLastX !== null && gestureLastY !== null && curPath.length > 0) {
        // 继续画线：在 inkCanvas 上绘制
        inkCtx.strokeStyle = inkColor;
        inkCtx.lineCap = 'round'; inkCtx.lineJoin = 'round';
        inkCtx.lineWidth = base; inkCtx.globalAlpha = 0.85;
        const mx = (gestureLastX + px) / 2, my = (gestureLastY + py) / 2;
        inkCtx.beginPath();
        inkCtx.moveTo(gestureLastX, gestureLastY);
        inkCtx.quadraticCurveTo(mx, my, px, py);
        inkCtx.stroke();
        curPath.push({ x: px, y: py, w: base });
      } else {
        // 新起笔：新建一条 path
        drawn = true;
        curPath = [{ x: px, y: py, w: base }];
        paths.push({ color: inkColor, points: curPath });
        clearReveal(); hideMood(); hideSpeak(); hideCheckin(); stopSpeak();
        // 重置停笔计时器
        if (stopTimer) { clearTimeout(stopTimer); stopTimer = null; }
      }
      gestureLastX = px; gestureLastY = py;
      if (statusEl) { statusEl.textContent = '正在作画...'; statusEl.classList.add('active'); }
      // 持续作画时重置停笔检测计时器
      if (stopTimer) { clearTimeout(stopTimer); stopTimer = null; }
    } else {
      // 食指收回，断开线条
      if (gestureLastX !== null) {
        // 刚结束一段笔画，触发停笔检测（与手写模式一致）
        if (stopTimer) clearTimeout(stopTimer);
        stopTimer = setTimeout(onStop, stopDelay);
      }
      gestureLastX = null; gestureLastY = null;
      curPath = []; // 下次伸直会新建 path
      if (statusEl) { statusEl.textContent = '伸出食指即可作画'; statusEl.classList.remove('active'); }
    }
  }

  // ============ 设备检测 ============
  // 判断是否为触屏设备（Pad/手机）
  function isTouchDevice() {
    return ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  }

  // ============ 首次访问欢迎弹窗 ============
  function showWelcomeIfFirstTime() {
    const WELCOME_KEY = 'md_welcome_v1';
    const seen = localStorage.getItem(WELCOME_KEY);
    // 触屏设备隐藏手势介绍部分
    if (isTouchDevice()) {
      const g = document.getElementById('welcome-gesture');
      if (g) g.style.display = 'none';
    }
    document.getElementById('btn-close-welcome').addEventListener('click', () => {
      document.getElementById('welcome-modal').classList.remove('open');
      localStorage.setItem(WELCOME_KEY, '1');
    });
    // 首次访问才显示
    if (!seen) {
      document.getElementById('welcome-modal').classList.add('open');
    }
  }

  init();
})();
