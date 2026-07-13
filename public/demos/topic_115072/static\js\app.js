// 反诈教练 - 前端逻辑（自由对话模式）
// 支持两种模式：本地 Flask 后端 或 阿里云函数计算 FC
// 本地开发时 API_BASE 留空，部署时填入云函数地址

const API_BASE = 'https://fanzha-coach-seeohzshpk.cn-hangzhou.fcapp.run';

let currentSessionId = null;
let currentScriptId = null;
let currentSession = null; // 客户端存储的会话数据（无状态设计）
let isWaitingResponse = false;

// ===== 会话存储（localStorage，适配无状态云函数） =====
const SESSION_STORAGE_KEY = 'fanzha_session';

function saveSession(session) {
    try {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } catch (e) {
        console.warn('localStorage 存储失败', e);
    }
}

function loadSession() {
    try {
        const data = localStorage.getItem(SESSION_STORAGE_KEY);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        return null;
    }
}

function clearStoredSession() {
    try {
        localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (e) {}
}

// ===== 页面切换 =====
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
}

function goHome() {
    currentSessionId = null;
    currentScriptId = null;
    currentSession = null;
    currentReportData = null;
    clearStoredSession();
    clearSuggestions();
    showPage('page-home');
    loadScripts();
}

// ===== 首页：加载剧本列表 =====
async function loadScripts() {
    const listEl = document.getElementById('script-list');
    listEl.innerHTML = '<p style="text-align:center;color:#999;padding:40px;">加载中...</p>';

    try {
        const res = await fetch(`${API_BASE}/api/scripts`);
        const scripts = await res.json();

        listEl.innerHTML = scripts.map(s => `
            <div class="script-card" onclick="startSession('${s.id}')">
                <h3>${s.name}</h3>
                <div class="meta">
                    <span class="tag difficulty-${s.difficulty}">${s.difficulty}</span>
                    <span class="tag">${s.target_group}</span>
                </div>
                <p class="scenario">${s.scenario}</p>
            </div>
        `).join('');
    } catch (err) {
        listEl.innerHTML = '<p style="text-align:center;color:#f44336;padding:40px;">加载失败，请检查后端是否启动</p>';
        console.error(err);
    }
}

// ===== 创建会话 =====
async function startSession(scriptId) {
    currentScriptId = scriptId;

    try {
        const res = await fetch(`${API_BASE}/api/session/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ script_id: scriptId }),
        });
        const data = await res.json();

        if (data.error) {
            alert(data.error);
            return;
        }

        currentSessionId = data.session_id;
        document.getElementById('chat-title').textContent = data.script_name || scriptId;

        // 初始化客户端会话数据（无状态设计，存 localStorage）
        currentSession = {
            script_id: scriptId,
            current_node: 'n1',
            total_risk: 0,
            turn_count: 0,
            history: [{
                node: 'n1',
                ai_response: data.opening,
                user_input: null,
                risk_delta: 0,
                total_risk: 0,
            }],
        };
        saveSession(currentSession);

        // 清空对话区
        const chatBody = document.getElementById('chat-body');
        chatBody.innerHTML = '';

        // 显示开场白
        addBubble('ai', data.opening, '平和');

        // 渲染快捷建议
        renderSuggestions(data.suggestions);

        // 更新风险值
        updateTrustMeter(0, data.max_risk || 10);

        // 启用输入框
        enableInput();

        showPage('page-chat');
    } catch (err) {
        alert('创建会话失败');
        console.error(err);
    }
}

// ===== 发送消息 =====
async function sendMessage() {
    if (!currentSessionId || isWaitingResponse) return;

    const inputEl = document.getElementById('user-input');
    const userText = inputEl.value.trim();
    if (!userText) return;

    isWaitingResponse = true;
    inputEl.value = '';
    disableInput();

    // 显示用户消息
    addBubble('user', userText);

    // 显示加载
    const chatBody = document.getElementById('chat-body');
    const loadingEl = document.createElement('div');
    loadingEl.className = 'loading-indicator';
    loadingEl.id = 'loading-indicator';
    loadingEl.textContent = '对方正在输入...';
    chatBody.appendChild(loadingEl);
    chatBody.scrollTop = chatBody.scrollHeight;

    try {
        // 无状态设计：每次请求带上客户端存储的完整 session 数据
        const res = await fetch(`${API_BASE}/api/session/${currentSessionId}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_input: userText,
                session: currentSession,
            }),
        });
        const data = await res.json();

        // 移除加载
        const loading = document.getElementById('loading-indicator');
        if (loading) loading.remove();

        if (data.error) {
            addBubble('ai', '出错了：' + data.error, '错误');
            enableInput();
            isWaitingResponse = false;
            return;
        }

        // 更新客户端会话数据（云函数返回最新状态）
        if (data.session) {
            currentSession = data.session;
            saveSession(currentSession);
        }

        if (data.is_game_over) {
            // 显示 AI 最后回复
            if (data.response) {
                addBubble('ai', data.response, data.tone);
            }
            // 清空快捷建议
            clearSuggestions();
            // 显示复盘
            setTimeout(() => showReview(data), 500);
        } else {
            // 显示 AI 回复
            addBubble('ai', data.response, data.tone);

            // 渲染快捷建议
            renderSuggestions(data.suggestions);

            // 更新风险值
            updateTrustMeter(data.total_risk, data.max_risk);

            // 启用输入
            enableInput();
            isWaitingResponse = false;
        }
    } catch (err) {
        const loading = document.getElementById('loading-indicator');
        if (loading) loading.remove();
        addBubble('ai', '网络错误，请重试', '错误');
        enableInput();
        isWaitingResponse = false;
        console.error(err);
    }
}

// ===== 添加对话气泡 =====
// ===== 语音朗读数据存储（避免 HTML 转义问题） =====
let ttsTextMap = {};
let ttsIdCounter = 0;
let currentSpeech = null;

// 预加载语音列表（解决异步加载问题）
function loadVoices() {
    return new Promise(resolve => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            resolve(voices);
            return;
        }
        window.speechSynthesis.onvoiceschanged = () => {
            resolve(window.speechSynthesis.getVoices());
        };
    });
}
loadVoices(); // 提前触发加载

function addBubble(role, text, tone) {
    const chatBody = document.getElementById('chat-body');
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${role}`;

    let html = `<div class="bubble-text">${text}</div>`;
    if (tone && role === 'ai' && tone !== '平和') {
        html += `<div class="tone-tag">[${tone}]</div>`;
    }
    // AI 气泡加语音朗读按钮（用 ID 引用文本，避免 HTML 转义问题）
    if (role === 'ai') {
        const ttsId = 'tts_' + (++ttsIdCounter);
        ttsTextMap[ttsId] = text;
        html += `<button class="tts-btn" data-ttsid="${ttsId}" onclick="speakText(this)" title="点击朗读">🔊 朗读</button>`;
    }

    bubble.innerHTML = html;
    chatBody.appendChild(bubble);
    chatBody.scrollTop = chatBody.scrollHeight;
}

// ===== 语音朗读（TTS） =====
function speakText(btn) {
    // 如果正在播放，点同一个按钮就停止
    const ttsId = btn.getAttribute('data-ttsid');
    if (currentSpeech && currentSpeech.ttsId === ttsId) {
        window.speechSynthesis.cancel();
        resetTtsButton(btn);
        currentSpeech = null;
        return;
    }

    // 停止其他正在播放的语音
    if (currentSpeech) {
        window.speechSynthesis.cancel();
        document.querySelectorAll('.tts-btn.speaking').forEach(b => resetTtsButton(b));
    }

    const text = ttsTextMap[ttsId];
    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.9;  // 稍慢，适合老年人
    utterance.pitch = 1.0;

    // 优先选择中文语音
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
        const zhVoice = voices.find(v => v.lang.startsWith('zh') && v.name.includes('Female'))
            || voices.find(v => v.lang.startsWith('zh-CN'))
            || voices.find(v => v.lang.startsWith('zh'));
        if (zhVoice) utterance.voice = zhVoice;
    }

    btn.classList.add('speaking');
    btn.textContent = '⏸ 停止';
    currentSpeech = { utterance, ttsId, btn };

    utterance.onend = () => {
        resetTtsButton(btn);
        currentSpeech = null;
    };

    utterance.onerror = (e) => {
        console.log('TTS error:', e);
        resetTtsButton(btn);
        currentSpeech = null;
    };

    window.speechSynthesis.speak(utterance);
}

function resetTtsButton(btn) {
    btn.classList.remove('speaking');
    btn.textContent = '🔊 朗读';
}

// ===== 更新信任度仪表盘 =====
function updateTrustMeter(totalRisk, maxRisk) {
    const fill = document.getElementById('trust-fill');
    const value = document.getElementById('trust-value');

    // 支持负值：负值显示为 0%，正值按比例
    const clamped = Math.max(0, totalRisk);
    const ratio = Math.max(0, Math.min(1, clamped / maxRisk));
    fill.style.width = `${ratio * 100}%`;
    value.textContent = `${totalRisk}/${maxRisk}`;

    fill.className = 'trust-fill';
    if (ratio >= 0.8) fill.classList.add('critical');
    else if (ratio >= 0.5) fill.classList.add('danger');
}

// ===== 输入框控制 =====
function enableInput() {
    const inputEl = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    if (inputEl) inputEl.disabled = false;
    if (sendBtn) sendBtn.disabled = false;
}

function disableInput() {
    const inputEl = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    if (inputEl) inputEl.disabled = true;
    if (sendBtn) sendBtn.disabled = true;
}

// ===== 快捷回复建议 =====
function renderSuggestions(suggestions) {
    const container = document.getElementById('quick-suggestions');
    if (!container) return;
    if (!suggestions || suggestions.length === 0) {
        container.innerHTML = '';
        return;
    }
    container.innerHTML = suggestions.map(s =>
        `<button class="quick-suggestion-btn" onclick="quickReply('${s.replace(/'/g, "\\'")}')">${s}</button>`
    ).join('');
    container.style.display = 'flex';
}

function clearSuggestions() {
    const container = document.getElementById('quick-suggestions');
    if (container) {
        container.innerHTML = '';
        container.style.display = 'none';
    }
}

function quickReply(text) {
    const inputEl = document.getElementById('user-input');
    if (!inputEl || isWaitingResponse) return;
    inputEl.value = text;
    sendMessage();
}

// ===== 显示复盘 =====
let currentReportData = null; // 保存当前报告数据，供分享使用

function showReview(data) {
    const reviewBody = document.getElementById('review-body');

    let scoreClass = 'safe';
    if (data.total_risk >= 8) scoreClass = 'critical';
    else if (data.total_risk >= 5) scoreClass = 'danger';

    let html = `
        <div class="review-card">
            <div class="score-display">
                <div class="score-number ${scoreClass}">${data.total_risk}/${data.max_risk}</div>
                <div class="evaluation">${data.ending || ''} - ${_getEvaluation(data.total_risk, data.max_risk)}</div>
            </div>
        </div>
    `;

    if (data.report) {
        const report = data.report;

        if (report.weak_points && report.weak_points.length > 0) {
            html += `
                <div class="review-card">
                    <h3>薄弱环节</h3>
                    <ul>${report.weak_points.map(w => `<li>⚠️ ${w}</li>`).join('')}</ul>
                </div>
            `;
        }

        if (report.key_knowledge && report.key_knowledge.length > 0) {
            html += `
                <div class="review-card">
                    <h3>关键知识</h3>
                    <ul>${report.key_knowledge.map(k => `<li>✅ ${k}</li>`).join('')}</ul>
                </div>
            `;
        }

        if (report.suggested_talk) {
            html += `
                <div class="review-card" id="review-suggested-talk">
                    <h3>给子女的建议话术</h3>
                    <div class="suggested-talk" id="suggested-talk-text">${report.suggested_talk}</div>
                    <div class="suggested-talk-actions">
                        <button class="btn-copy" onclick="copySuggestedTalk()">📋 复制这段话</button>
                        <button class="btn-share" onclick="shareToFamily()">💬 分享给子女</button>
                    </div>
                    <div id="copy-toast" class="copy-toast" style="display:none;">已复制到剪贴板！可以发给家人了</div>
                </div>
            `;
        }

        // 保存报告数据
        currentReportData = {
            totalRisk: data.total_risk,
            maxRisk: data.max_risk,
            ending: data.ending || '',
            evaluation: _getEvaluation(data.total_risk, data.max_risk),
            weakPoints: report.weak_points || [],
            keyKnowledge: report.key_knowledge || [],
            suggestedTalk: report.suggested_talk || '',
            scriptName: report.script_name || '',
        };
    }

    reviewBody.innerHTML = html;

    // 更新底部操作按钮
    const actionsEl = document.getElementById('review-actions-bottom');
    if (actionsEl) {
        actionsEl.style.display = 'block';
    }

    showPage('page-review');
}

// ===== 复制建议话术 =====
function copySuggestedTalk() {
    const textEl = document.getElementById('suggested-talk-text');
    const toastEl = document.getElementById('copy-toast');
    if (!textEl) return;

    const text = textEl.textContent || textEl.innerText;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            _showCopyToast(toastEl);
        }).catch(() => {
            _fallbackCopy(text, toastEl);
        });
    } else {
        _fallbackCopy(text, toastEl);
    }
}

function _fallbackCopy(text, toastEl) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
        _showCopyToast(toastEl);
    } catch (e) {
        alert('复制失败，请手动选择复制');
    }
    document.body.removeChild(textarea);
}

function _showCopyToast(toastEl) {
    if (!toastEl) return;
    toastEl.style.display = 'block';
    toastEl.style.opacity = '1';
    setTimeout(() => {
        toastEl.style.opacity = '0';
        setTimeout(() => { toastEl.style.display = 'none'; }, 300);
    }, 2000);
}

// ===== 分享给子女 =====
function shareToFamily() {
    if (!currentReportData) return;

    const shareText = _generateShareText(currentReportData);

    // 优先尝试 Web Share API（移动端/微信内置浏览器）
    if (navigator.share) {
        navigator.share({
            title: '反诈教练 - 模拟训练报告',
            text: shareText,
        }).catch(() => {});
    } else {
        // 降级：复制分享文本
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(shareText).then(() => {
                alert('分享内容已复制到剪贴板，到微信里粘贴发送给子女吧！');
            }).catch(() => {
                alert(shareText);
            });
        } else {
            _fallbackCopy(shareText, document.getElementById('copy-toast'));
            alert('分享内容已复制，到微信里粘贴发送给子女吧！');
        }
    }
}

function _generateShareText(data) {
    const lines = [];
    lines.push('【反诈教练 · 模拟训练报告】');
    lines.push('');
    lines.push(`模拟场景：${data.scriptName}`);
    lines.push(`风险评分：${data.totalRisk}/${data.maxRisk}（${data.evaluation}）`);
    lines.push(`结局：${data.ending}`);
    lines.push('');

    if (data.weakPoints.length > 0) {
        lines.push('⚠️ 薄弱环节：');
        data.weakPoints.forEach(w => lines.push(`  - ${w}`));
        lines.push('');
    }

    if (data.keyKnowledge.length > 0) {
        lines.push('✅ 关键知识：');
        data.keyKnowledge.forEach(k => lines.push(`  - ${k}`));
        lines.push('');
    }

    if (data.suggestedTalk) {
        lines.push('💬 你可以这样跟父母说：');
        lines.push(data.suggestedTalk);
        lines.push('');
    }

    lines.push('—— 来自「反诈教练」小程序');
    return lines.join('\n');
}

function _getEvaluation(totalRisk, maxRisk) {
    const ratio = totalRisk / maxRisk;
    if (ratio >= 0.8) return '危险！差点被骗';
    if (ratio >= 0.5) return '警惕性不够，需要加强';
    if (ratio >= 0.2) return '表现不错，继续保持';
    return '非常棒！识破了骗局';
}

// ===== 回车发送 =====
document.addEventListener('DOMContentLoaded', () => {
    const inputEl = document.getElementById('user-input');
    if (inputEl) {
        inputEl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
    loadScripts();
});
