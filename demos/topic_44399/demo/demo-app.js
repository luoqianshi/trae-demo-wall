const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

const statusDot = $('#status-dot'), statusText = $('#status-text');
const previewVideo = $('#preview-video'), previewCanvas = $('#preview-canvas');
const previewDanmakuEl = $('#preview-danmaku'), noSource = $('#no-source');
const statViewers = $('#stat-viewers'), statDanmaku = $('#stat-danmaku'), statAudio = $('#stat-audio');
const btnPreviewMode = $('#btn-preview-mode'), btnOverlayMode = $('#btn-overlay-mode');
const chkPassthrough = $('#chk-passthrough');
const aiBadge = $('#ai-badge'), aiLog = $('#ai-log');
const aiStats = $('#ai-stats'), statRuntime = $('#stat-runtime'), statCalls = $('#stat-calls');
const statPrompt = $('#stat-prompt'), statCompletion = $('#stat-completion'), statTotal = $('#stat-total');
const speedSlider = $('#speed-slider'), speedVal = $('#speed-val');
const sizeSlider = $('#size-slider'), sizeVal = $('#size-val');
const opacitySlider = $('#opacity-slider'), opacityVal = $('#opacity-val');
const densityBtns = $$('.seg-btn');

let currentMode = 'preview';
let screenStream = null, screenReady = false;
let aiRunning = false, aiTimer = null;
let aiStartTime = 0, aiRuntimeTimer = null;
let aiTotalPromptTokens = 0, aiTotalCompletionTokens = 0, aiTotalCalls = 0;
let viewerCount = Math.floor(Math.random()*300)+50;
let danmakuTotal = 0;
let previewDanmakuCtx = null, previewDW = 0, previewDH = 0;

const previewDanmakuPool = [];
const colors = ['#fff','#ffe600','#00ff88','#00bfff','#ff69b4','#ff4444','#b366ff','#ff8c00'];

let aiDanmakuQueue = [];
let aiQueueTimer = null;

const bannedWords = [
    '傻逼','傻B','sb','SB','草泥马','操你妈','他妈的','nm','NMSL',
    '死','杀','滚','垃圾','废物','智障','脑瘫','白痴','蠢',
    'jb','JB','叼','逼','操','干你','我操','卧槽','妈的',
    '广告','加群','微信','QQ群','关注公众号','扫码关注',
    'undefined','null','NaN','error','Error','ERROR',
    '作为AI','作为人工智能','我无法','我不能','抱歉','对不起',
    '根据图片','从图片来看','这张图片','这张图','图中','图片中',
    '画面中','从画面来看','根据画面','可以看到','我能看到',
    '这是一张','这是一个','这里','我们可以看到',
    '套娃','循环播放','重复播放','自动播放','无限循环','递归',
    '弹幕循环','自动弹幕','AI生成','AI弹幕','自动发送','自动生成',
    '循环发送','定时发送','定时弹幕','自动发弹幕','循环发弹幕',
    '程序','脚本','代码','运行','执行','触发','间隔','定时器',
    '模拟','仿真','测试','演示','demo','test',
];

const codePatterns = [
    /```/, /\{.*\}/, /\[.*\]/, /=>/, /function\s*\(/,
    /const\s+\w+\s*=/, /let\s+\w+\s*=/, /var\s+\w+\s*=/,
    /\w+\.\w+\(/, /\$\{.*\}/, /<\/?\w+>/, /import\s+/, /require\(/,
    /console\./, /return\s+/,
    /\b(if|else|for|while|switch|case|break|continue|try|catch)\b.*\{/,
    /[;:]\s*$/, /^[\s{}[\]();'"`,=<>\/\\]+$/, /\b(text|content|message|role|type)\s*:/,
];

function extractText(val) {
    if (val == null) return '';
    if (typeof val === 'string') return val.replace(/\[object\s+\w+\]/g, '').trim();
    if (typeof val === 'number') return String(val);
    if (typeof val === 'object') {
        const keys = ['text','content','msg','comment','danmaku','message','value'];
        for (const k of keys) { if (val[k] != null) { const r = extractText(val[k]); if (r) return r; } }
        if (Array.isArray(val)) { for (const item of val) { const r = extractText(item); if (r) return r; } }
        for (const k of Object.keys(val)) { if (typeof val[k] === 'string' && val[k].trim()) return val[k].trim(); }
    }
    return '';
}

function isBanned(text) {
    const t = text.toLowerCase();
    if (bannedWords.some(w => t.includes(w.toLowerCase()))) return true;
    if (codePatterns.some(p => p.test(text))) return true;
    const cn = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    const total = text.replace(/\s/g, '').length;
    if (total > 0 && cn / total < 0.4) return true;
    return false;
}

const users = ['小明','小红','阿强','老张','大白','花花','奶茶','咖啡','闪电侠','追风少年','路人甲','课代表','过客','云玩家','老观众','夜猫子','小太阳','月光','星辰','技术宅','肝帝','欧皇','饺子','土豆'];
const gifts = [
    {name:'小心心',emoji:'❤️'},{name:'荧光棒',emoji:'🌈'},{name:'B坷垃',emoji:'🪙'},
    {name:'小电视',emoji:'📺'},{name:'舰长',emoji:'🚀'},{name:'辣条',emoji:'🌶️'},
    {name:'墨镜',emoji:'😎'},{name:'礼花',emoji:'🎉'}
];
const scMsgs = ['主播太强了！','每日打卡 支持','终于开播了','这操作服了','能唱首歌吗','好喜欢这里','纯路人被圈粉','大佬带带我','声音好好听','第一次来感觉好好'];

$('#btn-min').onclick = () => {};
$('#btn-max').onclick = () => {};
$('#btn-close').onclick = () => { if (confirm('确定要关闭吗？')) window.close(); };

btnPreviewMode.onclick = () => switchMode('preview');
btnOverlayMode.onclick = () => switchMode('overlay');

function switchMode(mode) {
    currentMode = mode;
    btnPreviewMode.classList.toggle('active', mode === 'preview');
    btnOverlayMode.classList.toggle('active', mode === 'overlay');
    if (mode === 'overlay') {
        openOverlay(); syncSettings();
        statusDot.className = 'dot green'; statusText.textContent = '叠加层运行中';
    } else {
        closeOverlay();
        statusDot.className = 'dot gray'; statusText.textContent = '预览模式';
    }
}

function syncSettings() {
    if (overlayActive) {
        overlaySettings = { density: getActiveDensity(), speed: parseInt(speedSlider.value), opacity: parseInt(opacitySlider.value) };
    }
}

chkPassthrough.onchange = () => {
    if (overlayActive) {
        $('#overlay-passthrough').style.pointerEvents = chkPassthrough.checked ? 'none' : 'auto';
    }
};

function getActiveDensity() {
    for (const b of densityBtns) { if (b.classList.contains('active')) return b.dataset.value; }
    return 'medium';
}

densityBtns.forEach(b => b.onclick = () => { densityBtns.forEach(x => x.classList.remove('active')); b.classList.add('active'); syncSettings(); });
speedSlider.oninput = () => { speedVal.textContent = speedSlider.value; syncSettings(); };
sizeSlider.oninput = () => { sizeVal.textContent = sizeSlider.value; };
opacitySlider.oninput = () => { opacityVal.textContent = opacitySlider.value + '%'; syncSettings(); };
$$('.color-dot').forEach(d => d.onclick = () => { $$('.color-dot').forEach(x => x.classList.remove('active')); d.classList.add('active'); });
$$('.preset-btn').forEach(b => b.onclick = () => { $('#ai-base-url').value = b.dataset.url; $('#ai-model').value = b.dataset.model; });

$('#btn-select-source').onclick = showSourcePicker;

function showSourcePicker() {
    const old = $('#source-modal'); if (old) old.remove();
    const modal = document.createElement('div');
    modal.id = 'source-modal';
    modal.innerHTML = `
        <div class="modal-box">
            <div class="modal-head"><span>选择捕获源</span><button id="modal-close">✕</button></div>
            <div class="source-list">
                <div class="source-item" data-type="screen"><div style="padding:30px;font-size:40px">🖥️</div><div class="src-name">整个屏幕</div><div class="src-type">屏幕</div></div>
                <div class="source-item" data-type="window"><div style="padding:30px;font-size:40px">🪟</div><div class="src-name">当前窗口</div><div class="src-type">窗口</div></div>
                <div class="source-item" data-type="tab"><div style="padding:30px;font-size:40px">🌐</div><div class="src-name">浏览器标签页</div><div class="src-type">标签页</div></div>
            </div>
        </div>`;
    document.body.appendChild(modal);
    modal.querySelector('#modal-close').onclick = () => modal.remove();
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    modal.querySelectorAll('.source-item').forEach(item => { item.onclick = () => { startScreenCapture(); modal.remove(); }; });
}

async function startScreenCapture() {
    try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: { cursor: 'always' }, audio: false });
        screenStream = stream;
        previewVideo.srcObject = stream;
        previewVideo.style.display = 'block'; previewCanvas.style.display = 'block'; previewDanmakuEl.style.display = 'block';
        noSource.style.display = 'none'; screenReady = true;
        statusDot.className = 'dot green'; statusText.textContent = '屏幕捕捉中';
        previewVideo.onloadedmetadata = () => setupPreviewCanvas();
        if (previewVideo.readyState >= 2) setupPreviewCanvas();
        stream.getVideoTracks()[0].onended = () => {
            screenReady = false; previewVideo.style.display = 'none'; previewCanvas.style.display = 'none';
            previewDanmakuEl.style.display = 'none'; noSource.style.display = 'block';
            statusDot.className = 'dot gray'; statusText.textContent = '等待选择捕获源';
        };
    } catch (err) { alert('屏幕捕获失败，请重试'); }
}

function setupPreviewCanvas() {
    const rect = previewCanvas.parentElement.getBoundingClientRect();
    previewCanvas.width = rect.width; previewCanvas.height = rect.height;
    previewDanmakuEl.width = rect.width; previewDanmakuEl.height = rect.height;
    previewDW = rect.width; previewDH = rect.height;
    previewDanmakuCtx = previewDanmakuEl.getContext('2d');
    requestAnimationFrame(renderPreview);
}

function renderPreview() {
    if (!screenReady) return;
    const ctx = previewCanvas.getContext('2d');
    ctx.drawImage(previewVideo, 0, 0, previewCanvas.width, previewCanvas.height);
    if (previewDanmakuCtx) renderPreviewDanmaku();
    requestAnimationFrame(renderPreview);
}

function renderPreviewDanmaku() {
    const now = performance.now();
    const ctx = previewDanmakuCtx;
    const w = previewDW, h = previewDH;
    ctx.clearRect(0, 0, w, h);
    const spd = parseInt(speedSlider.value);
    ctx.globalAlpha = parseInt(opacitySlider.value) / 100;
    for (let i = previewDanmakuPool.length - 1; i >= 0; i--) {
        const d = previewDanmakuPool[i];
        if (d.mode === 'scroll') { d.x -= spd; if (d.x < -300) { previewDanmakuPool.splice(i, 1); continue; } }
        else { if (!d.start) d.start = now; if (now - d.start > 3000) { previewDanmakuPool.splice(i, 1); continue; } }
        ctx.font = `bold ${d.size}px "PingFang SC","Microsoft YaHei",sans-serif`;
        ctx.fillStyle = d.color; ctx.textBaseline = 'middle';
        if (d.mode === 'scroll') { ctx.fillText(d.text, d.x, d.y); }
        else { ctx.textAlign = 'center'; ctx.fillText(d.text, w/2, d.y); ctx.textAlign = 'start'; }
    }
    ctx.globalAlpha = 1;
}

// ========== 叠加层 ==========
let overlayActive = false;
let overlaySettings = { density: 'medium', speed: 7, opacity: 85 };
let overlayDanmakuCtx = null, overlayDW = 0, overlayDH = 0;
const overlayDanmakuPool = [];
let overlayMsgCount = 0;
let panelLocked = false, panelCollapsed = false;
let panelAutoHideTimer = null;

function openOverlay() {
    const container = $('#overlay-container');
    container.classList.add('active');
    const canvas = $('#overlay-canvas');
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    overlayDW = window.innerWidth; overlayDH = window.innerHeight;
    overlayDanmakuCtx = canvas.getContext('2d');
    panelLocked = false; panelCollapsed = false; overlayMsgCount = 0;
    $('#msg-count').textContent = '0'; $('#msg-list').innerHTML = '';
    $('#btn-lock').textContent = '🔓'; $('#btn-lock').classList.remove('locked');
    $('#msg-panel').classList.remove('collapsed'); $('#sc-drawer').innerHTML = '';
    requestAnimationFrame(renderOverlay);
    startPanelAutoHide();
    setupPanelDrag();

    $('#btn-lock').onclick = () => {
        panelLocked = !panelLocked;
        $('#btn-lock').textContent = panelLocked ? '🔒' : '🔓';
        $('#btn-lock').classList.toggle('locked', panelLocked);
        if (panelLocked) clearTimeout(panelAutoHideTimer); else startPanelAutoHide();
    };
    $('#btn-panel-toggle').onclick = () => {
        panelCollapsed = !panelCollapsed;
        $('#msg-panel').classList.toggle('collapsed', panelCollapsed);
        $('#btn-panel-toggle').textContent = panelCollapsed ? '＋' : '─';
    };
    const panel = $('#msg-panel');
    panel.addEventListener('mouseenter', () => clearTimeout(panelAutoHideTimer));
    panel.addEventListener('mouseleave', () => { if (!panelLocked) startPanelAutoHide(); });
    const scDrawer = $('#sc-drawer');
    scDrawer.addEventListener('mouseenter', () => clearTimeout(panelAutoHideTimer));
    scDrawer.addEventListener('mouseleave', () => { if (!panelLocked) startPanelAutoHide(); });
    overlayActive = true; syncSettings();
}

function closeOverlay() {
    $('#overlay-container').classList.remove('active');
    overlayActive = false; clearTimeout(panelAutoHideTimer);
    overlayDanmakuPool.length = 0;
    currentMode = 'preview';
    btnPreviewMode.classList.add('active'); btnOverlayMode.classList.remove('active');
    chkPassthrough.checked = true;
    statusDot.className = 'dot gray'; statusText.textContent = '叠加层已关闭';
}

function startPanelAutoHide() {
    clearTimeout(panelAutoHideTimer);
    panelAutoHideTimer = setTimeout(() => { if (!panelLocked && !panelCollapsed) $('#msg-panel').classList.add('collapsed'); }, 5000);
}

function setupPanelDrag() {
    const panel = $('#msg-panel'), handle = $('#panel-drag-handle');
    let isDragging = false, startX, startY, origX, origY;
    handle.onmousedown = (e) => {
        if (e.target.tagName === 'BUTTON') return;
        isDragging = true; panel.classList.add('dragging');
        startX = e.clientX; startY = e.clientY;
        const rect = panel.getBoundingClientRect(); origX = rect.left; origY = rect.top;
        e.preventDefault();
    };
    document.onmousemove = (e) => {
        if (!isDragging) return;
        panel.style.left = (origX + e.clientX - startX) + 'px';
        panel.style.top = (origY + e.clientY - startY) + 'px';
        panel.style.right = 'auto';
    };
    document.onmouseup = () => { isDragging = false; panel.classList.remove('dragging'); };
}

function renderOverlay() {
    if (!overlayActive) return;
    const ctx = overlayDanmakuCtx;
    const w = overlayDW, h = overlayDH;
    ctx.clearRect(0, 0, w, h);
    const spd = overlaySettings.speed || parseInt(speedSlider.value);
    const opa = (overlaySettings.opacity || parseInt(opacitySlider.value)) / 100;
    ctx.globalAlpha = opa;
    for (let i = overlayDanmakuPool.length - 1; i >= 0; i--) {
        const d = overlayDanmakuPool[i];
        if (d.mode === 'scroll') { d.x -= spd; if (d.x < -400) { overlayDanmakuPool.splice(i, 1); continue; } }
        else { if (!d.start) d.start = performance.now(); if (performance.now() - d.start > (d.ttl || 3000)) { overlayDanmakuPool.splice(i, 1); continue; } }
        ctx.font = `bold ${d.size}px "PingFang SC","Microsoft YaHei",sans-serif`;
        ctx.fillStyle = d.color; ctx.textBaseline = 'middle';
        if (d.isGift) { ctx.shadowColor = '#ffe600'; ctx.shadowBlur = 12; }
        if (d.mode === 'scroll') { ctx.fillText(d.text, d.x, d.y); }
        else { ctx.textAlign = 'center'; ctx.fillText(d.text, w/2, d.y); ctx.textAlign = 'start'; }
        ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(renderOverlay);
}

function sendOverlayDanmaku(payload) {
    if (!overlayActive) return;
    let text = payload.text;
    if (typeof text === 'object') text = extractText(text);
    text = String(text || '').trim(); if (!text) return;
    const color = payload.color || '#fff', mode = payload.mode || 'scroll', size = payload.size || 20;
    const d = {
        text, color, mode, size,
        x: mode === 'scroll' ? overlayDW + 50 : 0,
        y: mode === 'scroll' ? (Math.random() * overlayDH * 0.7 + 20) : (Math.random() * overlayDH * 0.6 + overlayDH * 0.2),
        start: mode !== 'scroll' ? performance.now() : 0,
        isGift: payload.isGift || false, ttl: payload.ttl || 3000
    };
    overlayDanmakuPool.push(d);
    addOverlayMessage(payload, text);
    if (payload.isSC) showSCCard(payload, text);
}

function addOverlayMessage(payload, text) {
    overlayMsgCount++; $('#msg-count').textContent = overlayMsgCount;
    const msgList = $('#msg-list');
    const row = document.createElement('div');
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    let icon = '💬', cls = '', userHtml = '';
    if (payload.type === 'join') {
        icon = '🚪'; cls = 'join';
        row.className = `msg-row ${cls}`;
        row.innerHTML = `<span class="icon">${icon}</span><span class="info">${text}</span><span class="time">${time}</span>`;
    } else if (payload.isGift) {
        icon = '🎁'; cls = 'gift';
        row.className = `msg-row ${cls}`;
        row.innerHTML = `<span class="icon">${icon}</span><span class="info">${text}</span><span class="time">${time}</span>`;
    } else if (payload.isSC) {
        icon = '💛'; cls = 'sc';
        row.className = `msg-row ${cls}`;
        row.innerHTML = `<span class="icon">${icon}</span><span class="info"><span class="uname">${payload.user||'未知'}</span><span class="amount">¥${payload.scAmount||0}</span>: ${payload.scMsg||text}</span><span class="time">${time}</span>`;
    } else {
        row.className = 'msg-row';
        userHtml = `<span class="uname">${payload.user||'观众'}:</span> `;
        row.innerHTML = `<span class="icon">${icon}</span><span class="info">${userHtml}${text}</span><span class="time">${time}</span>`;
    }
    msgList.appendChild(row);
    const rows = msgList.querySelectorAll('.msg-row');
    if (rows.length > 50) { rows[0].classList.add('fade-out'); if (rows.length > 80) rows[0].remove(); }
    msgList.scrollTop = msgList.scrollHeight;
}

function showSCCard(payload, text) {
    const drawer = $('#sc-drawer');
    const card = document.createElement('div');
    card.className = 'sc-card';
    const amount = payload.scAmount || Math.floor(Math.random()*900)+30;
    const user = payload.user || users[Math.floor(Math.random()*users.length)] + Math.floor(Math.random()*99);
    const msg = payload.scMsg || text;
    card.innerHTML = `
        <div class="sc-user"><span class="avatar">👤</span>${user}</div>
        <div class="sc-price">${amount}</div>
        <div class="sc-msg">${msg}</div>
        <div class="sc-bar" style="width:100%"></div>`;
    drawer.appendChild(card);
    const bar = card.querySelector('.sc-bar');
    let width = 100;
    const timer = setInterval(() => {
        width -= (100 / 80);
        bar.style.width = Math.max(0, width) + '%';
        if (width <= 0) { clearInterval(timer); card.classList.add('removing'); setTimeout(() => card.remove(), 350); }
    }, 100);
}

function sendDanmaku(textOrObj, color, mode = 'scroll', size = 20) {
    danmakuTotal++; statDanmaku.textContent = danmakuTotal;
    let payload;
    if (typeof textOrObj === 'object' && textOrObj !== null) payload = textOrObj;
    else payload = { text: textOrObj, color, mode, size };
    if (payload.text != null && typeof payload.text !== 'string') payload.text = extractText(payload.text);
    payload.text = String(payload.text == null ? '' : payload.text).trim();
    if (!payload.text) return;

    if (currentMode === 'preview') {
        const d = {
            text: payload.text, color: payload.color || color || '#fff',
            mode: payload.mode || mode, size: payload.size || size,
            x: previewDW + 50, y: Math.random() * previewDH * 0.7 + 20, start: 0
        };
        previewDanmakuPool.push(d);
    }
    if (overlayActive) sendOverlayDanmaku(payload);
    
    // Add to preview box
    addPreviewItem(payload, payload.text);
}

// 弹幕预览
const previewList = $('#danmaku-preview-list');
const previewEmpty = $('#danmaku-preview-empty');
const previewItems = [];

function addPreviewItem(payload, text) {
    if (previewEmpty) previewEmpty.style.display = 'none';
    const item = document.createElement('div');
    item.className = 'danmaku-preview-item';
    const u = payload.user || '观众';
    if (payload.isSC) {
        item.classList.add('dp-sc');
        item.innerHTML = `<span class="dp-user">💛 ${u}</span><span class="dp-text">¥${payload.scAmount||0}: ${payload.scMsg||text}</span>`;
    } else if (payload.isGift) {
        item.classList.add('dp-gift');
        item.innerHTML = `<span class="dp-user">🎁 ${u}</span><span class="dp-text">${text}</span>`;
    } else if (payload.type === 'join') {
        item.innerHTML = `<span class="dp-user">🚪</span><span class="dp-text">${text}</span>`;
    } else {
        item.innerHTML = `<span class="dp-user">${u}</span><span class="dp-text">${text}</span>`;
    }
    previewList.appendChild(item);
    previewItems.push(item);
    if (previewItems.length > 100) { previewItems.shift().remove(); }
    previewList.scrollTop = previewList.scrollHeight;
}

$('#btn-test-danmaku').onclick = () => {
    const texts = ['测试弹幕 ✨','效果不错！','屏幕好清晰','666'];
    sendDanmaku(texts[Math.floor(Math.random()*texts.length)], colors[Math.floor(Math.random()*colors.length)], 'scroll', 20);
};

$('#btn-clear-overlay').onclick = () => {
    if (overlayActive) {
        overlayDanmakuPool.length = 0; $('#msg-list').innerHTML = ''; overlayMsgCount = 0;
        $('#msg-count').textContent = '0'; $('#sc-drawer').innerHTML = '';
    } else { previewDanmakuPool.length = 0; }
};

function formatRuntime(ms) {
    const totalSec = Math.floor(ms/1000);
    const h = Math.floor(totalSec/3600), m = Math.floor((totalSec%3600)/60), s = totalSec%60;
    if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}
function formatTokens(n) {
    if (n >= 1000000) return (n/1000000).toFixed(1)+'M';
    if (n >= 1000) return (n/1000).toFixed(1)+'K';
    return String(n);
}
function updateAiStats() {
    if (!aiStartTime) return;
    statRuntime.textContent = formatRuntime(Date.now()-aiStartTime);
    statCalls.textContent = aiTotalCalls;
    statPrompt.textContent = formatTokens(aiTotalPromptTokens);
    statCompletion.textContent = formatTokens(aiTotalCompletionTokens);
    statTotal.textContent = formatTokens(aiTotalPromptTokens+aiTotalCompletionTokens);
}

$('#btn-ai-toggle').onclick = async () => {
    if (aiRunning) {
        aiRunning = false;
        if (aiTimer) clearInterval(aiTimer);
        if (aiQueueTimer) clearInterval(aiQueueTimer);
        if (aiRuntimeTimer) clearInterval(aiRuntimeTimer);
        aiDanmakuQueue = [];
        $('#btn-ai-toggle').textContent = '开启 AI 弹幕';
        $('#btn-ai-toggle').classList.remove('running');
        aiBadge.textContent = 'OFF'; aiBadge.className = 'badge off';
        aiLog.textContent = '已停止'; aiStats.style.display = 'none';
        return;
    }
    const key = $('#ai-key').value.trim();
    if (!key) { aiLog.textContent = '请填写 API Key'; return; }
    const baseUrl = ($('#ai-base-url').value.trim() || 'https://api.openai.com/v1').replace(/\/+$/, '');
    const model = $('#ai-model').value.trim() || 'gpt-4o';
    const interval = parseInt($('#ai-interval').value) * 1000;

    aiLog.textContent = '测试连接...';
    try {
        const resp = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
            body: JSON.stringify({ model, messages: [{ role: 'user', content: 'hi' }], max_tokens: 5 }),
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    } catch (e) { aiLog.textContent = '连接失败: ' + e.message; return; }

    aiRunning = true; aiStartTime = Date.now();
    aiTotalPromptTokens = 0; aiTotalCompletionTokens = 0; aiTotalCalls = 0;
    $('#btn-ai-toggle').textContent = '停止 AI 弹幕';
    $('#btn-ai-toggle').classList.add('running');
    aiBadge.textContent = 'ON'; aiBadge.className = 'badge on';
    aiStats.style.display = 'block';
    aiRuntimeTimer = setInterval(updateAiStats, 1000);
    aiLog.textContent = 'AI 弹幕运行中...';

    const runAI = async () => {
        if (!aiRunning) return;
        try {
            let b64 = '';
            if (screenReady && previewVideo.readyState >= 2) {
                const tc = document.createElement('canvas');
                tc.width = 640; tc.height = 360;
                tc.getContext('2d').drawImage(previewVideo, 0, 0, 640, 360);
                b64 = tc.toDataURL('image/jpeg', 0.7);
            }

            const systemPrompt = `你现在是一个正在观看B站直播的普通观众。你看到的画面是主播的直播实况。

你的任务：以观众身份，对主播当前的直播内容做出真实的弹幕反应。

观察要点：
1. 主播在做什么？（打游戏/唱歌/跳舞/聊天/画画/吃播等）
2. 主播的状态如何？（紧张/搞笑/翻车/高光时刻/可爱/认真）
3. 画面中有什么让你产生情绪的细节？

弹幕要求：
- 每条15字以内，口语化，像真实观众说的话
- 要有情绪和态度：惊叹、调侃、关心、吐槽、鼓励、玩梗、提问等
- 结合画面具体细节来评论
- 可以模仿真实弹幕风格：缩写、感叹号、语气词

返回格式：
只返回JSON，不要任何解释：
{"comments":[{"text":"内容","type":"normal"}]}

type类型：normal/funny/question/praise

禁止：粗口、广告、代码、AI口吻、重复弹幕、描述画面本身`;

            const userContent = b64
                ? [{ type:'image_url', image_url:{ url:b64, detail:'high' } }, { type:'text', text:'观察画面，生成50条弹幕' }]
                : [{ type:'text', text:'主播正在直播中，生成50条观众弹幕评论' }];

            const resp = await fetch(`${baseUrl}/chat/completions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
                body: JSON.stringify({
                    model, max_tokens: 2000, temperature: 0.9,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userContent }
                    ]
                }),
            });
            const data = await resp.json();

            if (data.usage) {
                aiTotalCalls++;
                aiTotalPromptTokens += data.usage.prompt_tokens || 0;
                aiTotalCompletionTokens += data.usage.completion_tokens || 0;
                updateAiStats();
            }

            const raw = data.choices[0].message.content;
            let result;
            try {
                const m = raw.match(/\{[\s\S]*\}/);
                result = JSON.parse(m ? m[0] : raw);
            } catch {
                result = { comments: raw.split('\n').filter(l => l.trim()).slice(0, 20).map(l => ({ text: l.trim(), type: 'normal' })) };
            }

            const valid = [];
            if (result.comments) {
                for (const c of result.comments) {
                    let rawText = extractText(c.text || '');
                    if (!rawText || rawText.length < 2) continue;
                    if (isBanned(rawText)) continue;
                    if (valid.some(v => v.text === rawText)) continue;
                    valid.push({ text: rawText, type: c.type || 'normal' });
                    if (valid.length >= 50) break;
                }
            }

            if (valid.length === 0) { aiLog.textContent = '无有效弹幕，跳过'; return; }

            const scCount = Math.min(valid.length, Math.random() < 0.5 ? 1 : 2);
            const scIndices = [];
            while (scIndices.length < scCount) {
                const idx = Math.floor(Math.random() * valid.length);
                if (!scIndices.includes(idx)) scIndices.push(idx);
            }

            aiDanmakuQueue = valid.map((c, i) => ({ ...c, isSC: scIndices.includes(i) }));
            aiLog.textContent = `已生成 ${valid.length} 条弹幕 (${scCount}条SC)`;
            startQueueFlush();

        } catch (e) { aiLog.textContent = '错误: ' + e.message; }
    };

    runAI();
    aiTimer = setInterval(runAI, interval);
};

function startQueueFlush() {
    if (aiQueueTimer) clearInterval(aiQueueTimer);
    aiQueueTimer = setInterval(() => {
        if (aiDanmakuQueue.length === 0) { clearInterval(aiQueueTimer); aiQueueTimer = null; return; }
        const batchSize = Math.min(aiDanmakuQueue.length, 3 + Math.floor(Math.random()*3));
        const batch = aiDanmakuQueue.splice(0, batchSize);
        batch.forEach((item, i) => {
            setTimeout(() => {
                let text = item.text;
                if (typeof text === 'object') text = text.text || text.content || text.msg || JSON.stringify(text);
                text = String(text).trim();
                if (!text || text === '[object Object]') return;
                if (item.isSC) {
                    const u = users[Math.floor(Math.random()*users.length)] + Math.floor(Math.random()*99);
                    const money = Math.floor(Math.random()*900)+30;
                    sendDanmaku({ text:`${u} ¥${money} : ${text}`, color:'#ffe600', mode:'top', size:22, ttl:8000, isSC:true, user:u, scAmount:money, scMsg:text });
                } else {
                    const cm = { normal:null, gift:'#ffe600', question:'#00bfff', praise:'#ff69b4', funny:'#00ff88' };
                    const u = users[Math.floor(Math.random()*users.length)] + Math.floor(Math.random()*99);
                    sendDanmaku({ text, color:cm[item.type]||colors[Math.floor(Math.random()*colors.length)], mode:'scroll', size:18, user:u });
                }
            }, i * 800 + Math.random()*400);
        });
    }, 2500);
}

async function startAudio() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const ctx = new AudioContext();
        const src = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        src.connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);
        const update = () => {
            analyser.getByteFrequencyData(data);
            const avg = data.reduce((a,b) => a+b, 0) / data.length / 255;
            const bars = ['▁','▂','▃','▄','▅','▆','▇','█'];
            statAudio.innerHTML = '🎤 <b>' + bars[Math.floor(avg*7)] + '</b>';
            if (screenReady) requestAnimationFrame(update);
        };
        update();
    } catch (e) { statAudio.innerHTML = '🎤 <b>--</b>'; }
}

setInterval(() => {
    viewerCount += Math.floor(Math.random()*6)-3;
    viewerCount = Math.max(20, Math.min(9999, viewerCount));
    statViewers.textContent = viewerCount;
}, 2000);

function init() {
    const savedKey = localStorage.getItem('ai-key');
    const savedUrl = localStorage.getItem('ai-base-url');
    const savedModel = localStorage.getItem('ai-model');
    if (savedKey) $('#ai-key').value = savedKey;
    if (savedUrl) $('#ai-base-url').value = savedUrl;
    if (savedModel) $('#ai-model').value = savedModel;
    startAudio();
    statusDot.className = 'dot gray'; statusText.textContent = '等待选择捕获源';
}
init();

$('#ai-key').oninput = () => localStorage.setItem('ai-key', $('#ai-key').value);
$('#ai-base-url').oninput = () => localStorage.setItem('ai-base-url', $('#ai-base-url').value);
$('#ai-model').oninput = () => localStorage.setItem('ai-model', $('#ai-model').value);
