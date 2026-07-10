// ========== 老人端 - 核心逻辑 ==========

// 全局状态
let currentUser = null;
let todayMedications = [];
let currentReminderMedicineId = null;
let pollingInterval = null;
let checkinInterval = null;
let currentInputMode = 'video';
let speechRecognition = null;
let isListening = false;
let mediaRecorder = null;
let videoChunks = [];
let videoBlob = null;

// ========== API 封装 ==========
const API = {
    async get(url) {
        const res = await fetch(url);
        if (res.status === 401) { window.location.href = '/login.html'; return {code:401}; }
        if (res.status === 403) { try { const d = await res.json(); return {code:403, msg: d.msg || '权限不足，仅管理员可操作'}; } catch(e) { return {code:403, msg:'权限不足，仅管理员可操作'}; } }
        return res.json();
    },
    async post(url, data) {
        const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        if (res.status === 401) { window.location.href = '/login.html'; return {code:401}; }
        if (res.status === 403) { try { const d = await res.json(); return {code:403, msg: d.msg || '权限不足，仅管理员可操作'}; } catch(e) { return {code:403, msg:'权限不足，仅管理员可操作'}; } }
        return res.json();
    },
    async postFormData(url, formData) {
        const res = await fetch(url, { method: 'POST', body: formData });
        if (res.status === 401) { window.location.href = '/login.html'; return {code:401}; }
        if (res.status === 403) { try { const d = await res.json(); return {code:403, msg: d.msg || '权限不足，仅管理员可操作'}; } catch(e) { return {code:403, msg:'权限不足，仅管理员可操作'}; } }
        return res.json();
    }
};

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div'); div.textContent = str; return div.innerHTML;
}

// 老人端友好提示（大字体）
function showToast(msg, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `elderly-toast ${type}`;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// 迭代4 P0：老人端错误恢复层（替代 alert，含重试按钮）
function showElderlyError(title, message, retryAction) {
    const overlay = document.createElement('div');
    overlay.id = 'elderly-error-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.65);display:flex;align-items:center;justify-content:center;z-index:100001;padding:1.5rem;';
    const retryBtn = retryAction
        ? `<button class="elderly-error-btn retry" id="elderly-error-retry">重试</button>`
        : '';
    overlay.innerHTML = `
        <div style="background:#fff;border-radius:1.2rem;padding:2rem 1.6rem;max-width:420px;width:100%;text-align:center;box-shadow:0 12px 40px rgba(0,0,0,0.3);">
            <div style="font-size:3rem;margin-bottom:0.8rem;">😟</div>
            <div style="font-size:1.3rem;font-weight:800;color:#1d1d1f;margin-bottom:0.6rem;">${escapeHtml(title)}</div>
            <div style="font-size:1.05rem;color:#6e6e73;line-height:1.6;margin-bottom:1.4rem;">${escapeHtml(message)}</div>
            <div style="display:flex;gap:0.8rem;justify-content:center;flex-wrap:wrap;">
                ${retryBtn}
                <button class="elderly-error-btn close" id="elderly-error-close">我知道了</button>
            </div>
        </div>`;
    document.body.appendChild(overlay);
    const closeBtn = overlay.querySelector('#elderly-error-close');
    closeBtn.onclick = () => overlay.remove();
    if (retryAction) {
        overlay.querySelector('#elderly-error-retry').onclick = () => {
            overlay.remove();
            try { retryAction(); } catch (e) { console.error(e); }
        };
    }
}

// 迭代4 P0：离线打卡队列（迭代5 P1改用 localStorage 持久化，刷新不丢）
function queueOfflineCheckin(scheduleId, medicineId) {
    const queue = JSON.parse(localStorage.getItem('offline_checkin_queue') || '[]');
    // 过期清理：丢弃24小时前的积压项
    const oneDayAgo = Date.now() - 86400000;
    const fresh = queue.filter(i => i.ts > oneDayAgo);
    fresh.push({ schedule_id: scheduleId, medicine_id: medicineId, ts: Date.now() });
    localStorage.setItem('offline_checkin_queue', JSON.stringify(fresh));
}
async function flushPendingCheckins() {
    const queue = JSON.parse(localStorage.getItem('offline_checkin_queue') || '[]');
    if (!queue.length) return;
    localStorage.removeItem('offline_checkin_queue');
    for (const item of queue) {
        try {
            const r = await API.post('/api/checkin', {
                schedule_id: item.schedule_id,
                medicine_id: item.medicine_id
            });
            if (r.code === 0) {
                showToast('离线打卡已同步', 'success');
                loadTodayMedications();
            } else {
                queueOfflineCheckin(item.schedule_id, item.medicine_id);
            }
        } catch (e) {
            queueOfflineCheckin(item.schedule_id, item.medicine_id);
            return;
        }
    }
}

// ========== 认证 ==========
async function checkAuth() {
    const result = await API.get('/api/auth/me');
    if (result.code === 0 && result.data) {
        currentUser = result.data;
        // 后端返回的是 user_id 而非 id，统一为 id 便于后续使用
        currentUser.id = currentUser.user_id;
        sessionStorage.setItem('user_id', currentUser.id);
        sessionStorage.setItem('family_id', currentUser.family_id);
        sessionStorage.setItem('role_type', currentUser.role_type || 'elderly');

        if (currentUser.role_type === 'admin') {
            window.location.href = '/';
            return false;
        } else if (currentUser.role_type === 'member') {
            window.location.href = '/member.html';
            return false;
        }
        return true;
    }
    window.location.href = '/login.html';
    return false;
}

// ========== 退出登录 ==========
async function handleLogout() {
    try { await API.post('/api/auth/logout', {}); } catch (e) {}
    sessionStorage.clear();
    window.location.href = '/login.html';
}

// ========== 初始化 UI ==========
function initUI() {
    const hour = new Date().getHours();
    let greeting = '早上好'; if (hour >= 12 && hour < 18) greeting = '下午好'; else if (hour >= 18) greeting = '晚上好';
    const name = currentUser.elderly_name || currentUser.username;
    document.getElementById('elderly-greeting').textContent = `${greeting}，${name}`;
    // 顶部操作栏用户信息（退出入口移至右上角，与登录位置一致）
    const topAvatar = document.getElementById('elderly-top-avatar');
    const topName = document.getElementById('elderly-top-username');
    if (topAvatar && name) topAvatar.textContent = name[0].toUpperCase();
    if (topName) topName.textContent = name;

    const now = new Date();
    const days = ['日', '一', '二', '三', '四', '五', '六'];
    document.getElementById('elderly-date').textContent =
        `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 星期${days[now.getDay()]}`;

    // 检查语音支持（语音tab现为第二个）
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
        const voiceTab = document.querySelectorAll('.input-mode-tab')[1];
        if (voiceTab) voiceTab.style.display = 'none';
    }
}

// ========== 输入模式切换 ==========
function switchElderlyInputMode(mode) {
    currentInputMode = mode;
    document.getElementById('voice-input-area').style.display = mode === 'voice' ? 'block' : 'none';
    document.getElementById('text-input-area').style.display = mode === 'text' ? 'flex' : 'none';
    document.getElementById('video-input-area').style.display = mode === 'video' ? 'block' : 'none';
    document.querySelectorAll('.input-mode-tab').forEach(t => t.classList.remove('active'));
    const tabs = document.querySelectorAll('.input-mode-tab');
    const idx = { video: 0, voice: 1, text: 2 };
    if (tabs[idx[mode]]) tabs[idx[mode]].classList.add('active');

    if (mode !== 'voice' && isListening) stopListening();
    if (mode !== 'video' && mediaRecorder && mediaRecorder.state === 'recording') stopVideoRecording();
}

function toggleInputMode() {
    switchElderlyInputMode(currentInputMode === 'voice' ? 'text' : 'voice');
}

// ========== 打卡状态（纵向时间轴） ==========
// 节点颜色：红=忘喝了（已过时间且未服）/ 灰=没到时间 / 绿=正常喝了
function compareTimeWithNow(remindTime) {
    // remindTime 格式 "HH:MM" 或 "HH:MM:SS"
    if (!remindTime) return 0;
    const parts = String(remindTime).split(':');
    if (parts.length < 2) return 0;
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m)) return 0;
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const targetMin = h * 60 + m;
    if (targetMin < nowMin) return -1;  // 已过时间
    if (targetMin > nowMin) return 1;   // 还没到
    return 0;                            // 正好到点
}

async function loadTodayMedications() {
    const result = await API.get(`/api/checkin/today/${currentUser.id}`);
    const container = document.getElementById('medication-list');
    const empty = document.getElementById('medication-empty');

    // 后端返回 { reminders: [...], total, checked, date }
    const reminders = (result.code === 0 && result.data && result.data.reminders) ? result.data.reminders : [];

    if (reminders.length === 0) {
        container.innerHTML = '';
        empty.style.display = 'block';
        todayMedications = [];
        return;
    }

    empty.style.display = 'none';
    todayMedications = reminders;

    // 按提醒时间升序排列
    const sorted = [...reminders].sort((a, b) => {
        const ta = (a.remind_time || '').padEnd(8, ':00');
        const tb = (b.remind_time || '').padEnd(8, ':00');
        return ta.localeCompare(tb);
    });

    container.innerHTML = sorted.map((med, idx) => {
        const isChecked = med.checked || false;
        const timeCmp = compareTimeWithNow(med.remind_time);
        // 状态判定：已打卡=绿；未打卡且已过时间=红；未打卡且没到时间=灰
        let statusClass = 'tl-pending';   // 灰
        let statusLabel = '没到时间';
        if (isChecked) {
            statusClass = 'tl-taken';      // 绿
            statusLabel = '已服药';
        } else if (timeCmp < 0) {
            statusClass = 'tl-forgotten';  // 红
            statusLabel = '忘喝了';
        }

        const isLast = idx === sorted.length - 1;
        const medId = med.medicine_id || 0;
        const schedId = med.schedule_id || 0;
        const medName = escapeHtml(med.medicine_name || '药品');
        const medTime = escapeHtml(med.remind_time || '--:--');
        const medQty = med.dosage ? escapeHtml(med.dosage) : '';

        // 已打卡不显示"我已服药"按钮，显示"已打卡"标签；其余状态允许手动打卡
        let actionHtml = '';
        if (isChecked) {
            actionHtml = `<span class="tl-done-tag">✓ 已打卡</span>`;
        } else {
            actionHtml = `<button class="tl-checkin-btn" onclick="doCheckin(${schedId}, ${medId}, this)">我已服药</button>`;
        }

        return `<div class="tl-item ${statusClass}" data-medicine-id="${medId}" data-schedule-id="${schedId}">
            <div class="tl-rail">
                <div class="tl-node"></div>
                ${isLast ? '' : '<div class="tl-line"></div>'}
            </div>
            <div class="tl-card">
                <button class="tl-replay-btn" onclick="replaySingleMedication(${medId})" title="再听一遍">
                    <span>🔊</span><span>再听一遍</span>
                </button>
                <div class="tl-card-time">${medTime}</div>
                <div class="tl-card-name">${medName}</div>
                ${medQty ? `<div class="tl-card-qty">数量：${medQty}</div>` : ''}
                <div class="tl-card-status tl-status-${statusClass}">${statusLabel}</div>
                <div class="tl-card-action">${actionHtml}</div>
            </div>
        </div>`;
    }).join('');

    checkReminderBanner();
}

// 单条药品播报：时间 + 名称 + 数量 + 状态
function replaySingleMedication(medId) {
    const med = todayMedications.find(m => m.medicine_id === medId);
    if (!med) {
        showToast('未找到该药品信息', 'info');
        return;
    }
    const t = med.remind_time || '未设定时间';
    const nm = med.medicine_name || '药品';
    const qty = med.dosage ? `，数量 ${med.dosage}` : '';
    const status = med.checked ? '已服药' : (compareTimeWithNow(med.remind_time) < 0 ? '忘喝了，请尽快补服' : '还没到时间');
    speakText(`${t}，${nm}${qty}，${status}。`);
}

// ========== 登录后自动播报当日服药时间及状态 ==========
let hasBroadcastOnLogin = false;  // 仅登录后播报一次，避免轮询时重复打扰
function broadcastTodayMedications() {
    if (hasBroadcastOnLogin) return;
    if (!todayMedications || todayMedications.length === 0) return;
    hasBroadcastOnLogin = true;

    const name = (currentUser.elderly_name || (currentUser.username || ''));
    const greeting = (() => {
        const h = new Date().getHours();
        if (h >= 6 && h < 12) return '早上好';
        if (h >= 12 && h < 18) return '下午好';
        if (h >= 18 && h < 22) return '晚上好';
        return '您好';
    })();

    const total = todayMedications.length;
    const taken = todayMedications.filter(m => m.checked).length;
    const pending = total - taken;

    // 逐条构建清单：药名 + 时间 + 状态
    const list = todayMedications.map(m => {
        const t = m.remind_time || '';
        const nm = m.medicine_name || '药品';
        const status = m.checked ? '已服药' : '未服药';
        return `${nm}，提醒时间 ${t}，${status}`;
    }).join('；');

    const summary = pending === 0
        ? `您今天的药品都已服完，做得很好。`
        : `您今天还有 ${pending} 项未服药，请按时服药。`;

    const text = `${greeting}${name ? '，' + name : ''}。您今天共有 ${total} 项待服药安排，${summary}清单如下：${list}。如需再次播报，请点击页面顶部的"再听一遍"按钮。`;

    // 略加延迟，等待语音引擎就绪，并让用户先看到列表
    setTimeout(() => {
        try { speakText(text); } catch (e) { console.warn('自动播报失败:', e); }
    }, 1200);
}

// 老人主动重听当日播报
function replayTodayBroadcast() {
    const today = todayMedications || [];
    if (today.length === 0) {
        showToast('今天没有需要服用的药品', 'info');
        return;
    }
    const total = today.length;
    const taken = today.filter(m => m.checked).length;
    const pending = total - taken;
    const list = today.map(m => {
        const t = m.remind_time || '';
        const nm = m.medicine_name || '药品';
        const status = m.checked ? '已服药' : '未服药';
        return `${nm}，提醒时间 ${t}，${status}`;
    }).join('；');
    const summary = pending === 0
        ? `您今天的药品都已服完，做得很好。`
        : `您今天还有 ${pending} 项未服药，请按时服药。`;
    speakText(`您今天共有 ${total} 项待服药安排，${summary}清单如下：${list}。`);
}

// ========== 查看所有药品 ==========
async function loadAllMedicines() {
    const result = await API.get(`/api/members/${currentUser.id}/medicines`);
    const container = document.getElementById('all-medicines-list');
    const empty = document.getElementById('all-medicines-empty');

    if (result.code !== 0 || !result.data || result.data.length === 0) {
        container.innerHTML = '';
        empty.style.display = 'block';
        return;
    }

    empty.style.display = 'none';
    container.innerHTML = result.data.map(m => {
        const days = m.days_left;
        let statusClass = 'safe';
        let statusText = '';
        if (m.status === 'used') { statusClass = 'used'; statusText = '已用完'; }
        else if (days !== null && days < 0) { statusClass = 'expired'; statusText = '已过期 ' + Math.abs(days) + ' 天'; }
        else if (days !== null && days <= 30) { statusClass = 'warning'; statusText = '剩 ' + days + ' 天'; }
        else { statusText = (days !== null ? '剩 ' + days + ' 天' : '--'); }

        return `<div class="medication-item ${statusClass}">
            <div class="medication-info">
                <div class="medication-name">${escapeHtml(m.name)}</div>
                <div class="medication-detail">
                    ${m.manufacturer ? escapeHtml(m.manufacturer) + ' · ' : ''}
                    ${escapeHtml(m.category)} · 到期: ${m.expiry_date}
                </div>
            </div>
            <span class="med-status-badge ${statusClass}">${statusText}</span>
        </div>`;
    }).join('');
}

let allMedicinesLoaded = false;
function toggleAllMedicines() {
    const list = document.getElementById('all-medicines-list');
    const isVisible = list.style.display !== 'none';
    if (isVisible) {
        list.style.display = 'none';
        document.querySelector('.section-toggle .section-title span').textContent = '▶';
    } else {
        list.style.display = 'flex';
        document.querySelector('.section-toggle .section-title span').textContent = '▼';
        if (!allMedicinesLoaded) {
            loadAllMedicines();
            allMedicinesLoaded = true;
        }
    }
}

function checkReminderBanner() {
    const now = new Date();
    const currentHH = now.getHours().toString().padStart(2, '0');
    const currentMM = now.getMinutes().toString().padStart(2, '0');
    const currentTime = currentHH + ':' + currentMM;
    // 当前时间转分钟数，便于窗口判断
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    for (const med of todayMedications) {
        if (med.checked) continue;
        if (!med.remind_time) continue;

        // 解析提醒时间（HH:MM）为分钟数
        const parts = med.remind_time.split(':');
        if (parts.length < 2) continue;
        const remindMinutes = parseInt(parts[0]) * 60 + parseInt(parts[1]);
        if (isNaN(remindMinutes)) continue;

        // 迭代4 P0 修复：时间窗口从"提醒时间+15分钟"扩展为"提醒时间起至当日结束"
        // 避免老人错过15分钟窗口后提醒消失的问题
        // 仍用 sessionStorage 记录是否已弹出过横幅（避免重复弹窗）
        const todayKey = new Date().toISOString().slice(0, 10);
        const fullKey = `reminder_triggered_${med.schedule_id || med.medicine_id}_${todayKey}`;

        if (currentMinutes >= remindMinutes) {
            // 检查是否已触发过（避免重复弹窗）
            if (!sessionStorage.getItem(fullKey)) {
                sessionStorage.setItem(fullKey, '1');
                showReminderBanner(med);
                // 触发浏览器通知
                showBrowserNotification(med);
                return;
            }
        }
    }
    document.getElementById('reminder-banner').style.display = 'none';
    // 迭代4 P0：常驻逾期待办栏——若有逾期未服药项，始终显示
    renderOverdueBar();
}

// 迭代4 P0：常驻逾期待办栏
function renderOverdueBar() {
    let overdueEl = document.getElementById('overdue-todo-bar');
    if (!overdueEl) return;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const overdue = todayMedications.filter(m => {
        if (m.checked) return false;
        if (!m.remind_time) return false;
        const parts = m.remind_time.split(':');
        if (parts.length < 2) return false;
        const rm = parseInt(parts[0]) * 60 + parseInt(parts[1]);
        return !isNaN(rm) && currentMinutes > rm;
    });
    if (overdue.length === 0) {
        overdueEl.style.display = 'none';
        return;
    }
    overdueEl.style.display = 'flex';
    const names = overdue.slice(0, 3).map(m => escapeHtml(m.medicine_name || '药品')).join('、');
    overdueEl.innerHTML = `<span class="overdue-icon">⏰</span>
        <span class="overdue-text"><strong>${overdue.length}</strong> 项待服药逾期：${names}${overdue.length > 3 ? '等' : ''}</span>`;
}

function showBrowserNotification(med) {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
        const n = new Notification('服药提醒', {
            body: `该服药了：${med.medicine_name || '药品'}${med.dosage ? ' · ' + med.dosage : ''}`,
            icon: '/icons/icon.svg',
            tag: 'medication-reminder',
        });
        setTimeout(() => n.close(), 10000);
    }
}

// 请求浏览器通知权限（在用户交互后调用）
function requestNotificationPermission() {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

function showReminderBanner(med) {
    const banner = document.getElementById('reminder-banner');
    document.getElementById('reminder-banner-text').textContent =
        `该服药了：${escapeHtml(med.medicine_name || '药品')}${med.dosage ? ' · ' + escapeHtml(med.dosage) : ''}`;
    currentReminderMedicineId = med.medicine_id;
    banner.style.display = 'flex';
}

async function doCheckin(scheduleId, medicineId, btn) {
    // 金丝雀安全门（迭代4创新）：打卡前先预检风险
    let previewPass = true;
    let previewRisks = [];
    try {
        const preview = await API.post('/api/checkin/preview', {
            schedule_id: scheduleId,
            medicine_id: medicineId
        });
        if (preview.code === 0 && preview.data) {
            previewPass = preview.data.pass;
            previewRisks = preview.data.risks || [];
        }
    } catch (e) { /* 预检失败不阻塞打卡 */ }

    if (!previewPass || previewRisks.length > 0) {
        const confirmed = await showCanaryGuard(previewRisks);
        if (!confirmed) return; // 老人取消
    }

    const result = await API.post('/api/checkin', {
        schedule_id: scheduleId,
        medicine_id: medicineId
    });

    if (result.code === 0) {
        showCheckinAnimation();
        btn.classList.add('done');
        btn.textContent = '✓ 已打卡';
        btn.disabled = true;
        // 兼容时间轴 (.tl-item) 与旧结构 (.medication-item)
        const item = btn.closest('.tl-item') || btn.closest('.medication-item');
        if (item) {
            item.classList.remove('tl-forgotten', 'tl-pending', 'overdue');
            item.classList.add('tl-taken', 'checked');
        }
        const banner = document.getElementById('reminder-banner');
        if (banner) banner.style.display = 'none';
        setTimeout(loadTodayMedications, 2000);
        // 打卡成功后提示可给家人留语音明信片（每天最多提示一次）
        const todayKey = `postcard_prompted_${new Date().toISOString().slice(0,10)}`;
        if (!sessionStorage.getItem(todayKey)) {
            sessionStorage.setItem(todayKey, '1');
            setTimeout(() => showPostcardPrompt(), 1800);
        }
    } else {
        // 迭代4 P0：网络中断时入队离线打卡，恢复后自动同步
        if (result.code === 401 || !navigator.onLine) {
            queueOfflineCheckin(scheduleId, medicineId);
            showElderlyError('网络不稳定', '您的打卡已暂存，网络恢复后将自动同步，请放心。', null);
        } else {
            showElderlyError('打卡未成功', result.msg || '请稍后再试，或点击重试。',
                () => doCheckin(scheduleId, medicineId, btn));
            // 恢复按钮可点击
            btn.disabled = false;
        }
    }
}

// ========== 金丝雀防误用拦截卡（迭代4创新：适老化安全门）==========
function showCanaryGuard(risks) {
    return new Promise(resolve => {
        if (!risks || risks.length === 0) { resolve(true); return; }
        const hasBlock = risks.some(r => r.level === 'block');
        const overlay = document.createElement('div');
        overlay.id = 'canary-guard';
        overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:10000;padding:1rem;';
        const riskList = risks.map(r => {
            const color = r.level === 'block' ? '#ff3b30' : '#ff9500';
            const icon = r.level === 'block' ? '⛔' : '⚠️';
            return `<div style="background:${color}15;border-left:5px solid ${color};border-radius:12px;padding:1rem;margin-bottom:0.8rem;">
                <div style="display:flex;gap:0.5rem;align-items:flex-start;">
                    <span style="font-size:1.6rem;">${icon}</span>
                    <span style="font-size:1.15rem;color:#1d1d1f;line-height:1.5;flex:1;">${escapeHtml(r.message)}</span>
                </div>
            </div>`;
        }).join('');

        const confirmText = hasBlock ? '我已确认，仍要服用' : '继续服用';
        const overlay_inner = `
            <div style="background:#fff;border-radius:24px;padding:1.8rem;max-width:420px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
                <div style="font-size:1.5rem;font-weight:800;color:#ff3b30;margin-bottom:0.3rem;text-align:center;">请确认</div>
                <div style="color:#86868b;font-size:0.95rem;text-align:center;margin-bottom:1.2rem;">系统检测到以下用药风险</div>
                ${riskList}
                <div style="display:flex;gap:0.8rem;margin-top:1.2rem;">
                    <button id="canary-cancel" style="flex:1;padding:1rem;border:1px solid #d2d2d7;background:#fff;border-radius:980px;font-size:1.05rem;cursor:pointer;font-weight:600;">取消</button>
                    <button id="canary-confirm" style="flex:1;padding:1rem;background:${hasBlock ? '#ff3b30' : '#0071e3'};color:#fff;border:none;border-radius:980px;font-size:1.05rem;cursor:pointer;font-weight:600;">${confirmText}</button>
                </div>
            </div>`;
        overlay.innerHTML = overlay_inner;
        document.body.appendChild(overlay);

        document.getElementById('canary-cancel').onclick = () => {
            overlay.remove();
            resolve(false);
        };
        document.getElementById('canary-confirm').onclick = () => {
            overlay.remove();
            resolve(true);
        };
    });
}

// ========== 语音明信片（打卡后给家人留话） ==========
let postcardRecorder = null;
let postcardChunks = [];
let postcardStream = null;

function showPostcardPrompt() {
    // 简易浮层提示
    const overlay = document.createElement('div');
    overlay.id = 'postcard-prompt';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999;';
    overlay.innerHTML = `
        <div style="background:#fff;border-radius:20px;padding:2rem;max-width:340px;width:90%;text-align:center;">
            <div style="font-size:1.3rem;font-weight:600;margin-bottom:0.5rem;">给家人留句话？</div>
            <div style="color:#86868b;font-size:0.9rem;margin-bottom:1.5rem;">录一段30秒语音，告诉家人你今天的情况</div>
            <div style="display:flex;gap:0.8rem;">
                <button onclick="document.getElementById('postcard-prompt').remove()" style="flex:1;padding:0.7rem;border:1px solid #d2d2d7;background:#fff;border-radius:980px;font-size:0.9rem;cursor:pointer;">不了</button>
                <button onclick="startPostcardRecording()" style="flex:1;padding:0.7rem;background:#0071e3;color:#fff;border:none;border-radius:980px;font-size:0.9rem;cursor:pointer;">开始录音</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
}

async function startPostcardRecording() {
    // 移除提示浮层
    const prompt = document.getElementById('postcard-prompt');
    if (prompt) prompt.remove();

    try {
        postcardStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
        showElderlyError('麦克风不可用', '无法访问麦克风，请在浏览器地址栏点击锁定图标，允许麦克风权限后重试。', null);
        return;
    }

    postcardChunks = [];
    // iOS Safari 不支持 audio/webm，需动态选择 mime 类型
    let postcardMime = 'audio/webm';
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported) {
        const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
        postcardMime = candidates.find(m => MediaRecorder.isTypeSupported(m)) || 'audio/webm';
    }
    try {
        postcardRecorder = new MediaRecorder(postcardStream, { mimeType: postcardMime });
    } catch (e) {
        postcardRecorder = new MediaRecorder(postcardStream); // 回退到默认
        postcardMime = 'audio/webm';
    }
    postcardRecorder.ondataavailable = (e) => { if (e.data.size > 0) postcardChunks.push(e.data); };
    postcardRecorder.onstop = () => {
        const blob = new Blob(postcardChunks, { type: postcardMime });
        uploadPostcard(blob);
        postcardStream.getTracks().forEach(t => t.stop());
    };
    postcardRecorder.start();

    // 显示录音中浮层
    const overlay = document.createElement('div');
    overlay.id = 'postcard-recording';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999;';
    overlay.innerHTML = `
        <div style="background:#fff;border-radius:20px;padding:2rem;max-width:340px;width:90%;text-align:center;">
            <div style="font-size:1.2rem;font-weight:600;margin-bottom:0.5rem;">🎤 正在录音...</div>
            <div id="postcard-timer" style="color:#ff3b30;font-size:2rem;font-weight:700;margin:1rem 0;">00:00</div>
            <button onclick="stopPostcardRecording()" style="padding:0.7rem 2rem;background:#ff3b30;color:#fff;border:none;border-radius:980px;font-size:0.9rem;cursor:pointer;">停止并发送</button>
        </div>
    `;
    document.body.appendChild(overlay);

    // 计时器
    let secs = 0;
    window._postcardTimer = setInterval(() => {
        secs++;
        const mm = String(Math.floor(secs/60)).padStart(2,'0');
        const ss = String(secs%60).padStart(2,'0');
        const el = document.getElementById('postcard-timer');
        if (el) el.textContent = `${mm}:${ss}`;
        if (secs >= 30) stopPostcardRecording(); // 30秒硬截断
    }, 1000);
}

function stopPostcardRecording() {
    if (window._postcardTimer) { clearInterval(window._postcardTimer); window._postcardTimer = null; }
    if (postcardRecorder && postcardRecorder.state === 'recording') {
        postcardRecorder.stop();
    }
    const overlay = document.getElementById('postcard-recording');
    if (overlay) overlay.remove();
}

async function uploadPostcard(blob) {
    const formData = new FormData();
    // 根据实际 blob 类型决定扩展名（iOS 产出 mp4，桌面 Chrome 产出 webm）
    const ext = blob.type.includes('mp4') ? '.mp4' : (blob.type.includes('ogg') ? '.ogg' : '.webm');
    formData.append('audio', blob, `postcard${ext}`);
    formData.append('duration', '30');
    try {
        const res = await fetch('/api/voice-postcards', { method: 'POST', body: formData });
        const result = await res.json();
        if (result.code === 0) {
            // 简易成功提示
            const tip = document.createElement('div');
            tip.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#34c759;color:#fff;padding:0.8rem 1.5rem;border-radius:12px;z-index:9999;font-size:0.9rem;';
            tip.textContent = '语音明信片已发送给家人 ✓';
            document.body.appendChild(tip);
            setTimeout(() => tip.remove(), 2500);
        }
    } catch (e) {
        console.warn('上传语音明信片失败:', e);
    }
}

function quickCheckin() {
    if (currentReminderMedicineId) {
        const item = document.querySelector(`.medication-item[data-medicine-id="${currentReminderMedicineId}"]`);
        if (item) {
            const btn = item.querySelector('.checkin-btn');
            const scheduleId = item.dataset.scheduleId;
            doCheckin(scheduleId || 0, currentReminderMedicineId, btn);
        }
    }
}

function showCheckinAnimation() {
    const overlay = document.getElementById('checkin-overlay');
    overlay.style.display = 'flex';
    setTimeout(() => { overlay.style.display = 'none'; }, 1500);
}

// ========== 语音提问 ==========
function startVoiceAsk() {
    if (isListening) {
        stopListening();
        return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        switchElderlyInputMode('text');
        return;
    }

    speechRecognition = new SpeechRecognition();
    speechRecognition.lang = 'zh-CN';
    speechRecognition.interimResults = false;
    speechRecognition.maxAlternatives = 1;

    speechRecognition.onstart = () => {
        isListening = true;
        document.getElementById('voice-hint').style.display = 'block';
        document.getElementById('voice-hint').textContent = '正在聆听...';
        document.getElementById('btn-voice-ask').textContent = '松开停止';
        document.getElementById('btn-voice-ask').style.background = 'var(--elderly-danger)';
    };

    speechRecognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) submitQuestion(transcript);
    };

    speechRecognition.onerror = () => {
        stopListening();
        document.getElementById('voice-hint').textContent = '识别失败，请重试';
        setTimeout(() => { document.getElementById('voice-hint').style.display = 'none'; }, 2000);
    };

    speechRecognition.onend = () => { stopListening(); };
    speechRecognition.start();
}

function stopListening() {
    isListening = false;
    document.getElementById('voice-hint').style.display = 'none';
    document.getElementById('btn-voice-ask').textContent = '按住说话';
    document.getElementById('btn-voice-ask').style.background = '';
    if (speechRecognition) {
        try { speechRecognition.stop(); } catch(e) {}
    }
}

function submitTextQuestion() {
    const text = document.getElementById('question-text').value.trim();
    if (!text) return;
    submitQuestion(text);
    document.getElementById('question-text').value = '';
}

async function submitQuestion(text) {
    const result = await API.post('/api/knowledge/ask', {
        question: text,
        elderly_id: currentUser.id
    });

    if (result.code === 0) {
        const data = result.data || {};
        const hint = document.getElementById('voice-hint');

        // 中等置信度语义匹配：展示相似问题建议答案，让老人确认
        if (data.needs_confirmation && data.suggested_question) {
            showSemanticConfirmCard(text, data);
            return;
        }

        hint.style.display = 'block';
        if (data.answer) {
            hint.textContent = '已找到答案！';
            hint.style.color = 'var(--elderly-success)';
            // 自动语音朗读答案
            speakText(data.answer);
        } else {
            hint.textContent = '问题已发送，家人会尽快回复';
            hint.style.color = 'var(--elderly-primary)';
            // 语音提示老人
            speakText('问题已发送，家人会尽快回复');
        }
        setTimeout(() => {
            hint.style.display = 'none';
            hint.style.color = '';
        }, 3000);
        loadReplies();
    } else {
        showElderlyError('问题发送失败', result.msg || '请稍后重试，或换种方式提问。',
            () => submitTextQuestion());
    }
}

// 中等置信度语义匹配确认卡片
function showSemanticConfirmCard(originalQuestion, data) {
    // 移除已有卡片
    const old = document.getElementById('semantic-confirm-card');
    if (old) old.remove();

    const card = document.createElement('div');
    card.id = 'semantic-confirm-card';
    card.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#fff;border-radius:16px;padding:1.2rem;max-width:420px;width:90%;box-shadow:0 8px 32px rgba(0,0,0,0.15);z-index:9998;border:1px solid #e8e8ed;';
    card.innerHTML = `
        <div style="font-size:1rem;font-weight:600;margin-bottom:0.5rem;">您是想问这个吗？</div>
        <div style="background:#f0f6ff;padding:0.8rem;border-radius:10px;margin-bottom:0.8rem;color:#1d1d1f;">"${escapeHtml(data.suggested_question)}"</div>
        <div style="color:#86868b;font-size:0.82rem;margin-bottom:0.8rem;">如果是对的，下面是家人之前的回答：</div>
        <div style="background:#f5f5f7;padding:0.8rem;border-radius:10px;margin-bottom:1rem;color:#424245;font-size:0.92rem;max-height:120px;overflow-y:auto;">${escapeHtml(data.suggested_answer || '（暂无文字回答）')}</div>
        <div style="display:flex;gap:0.8rem;">
            <button id="semantic-no-btn" style="flex:1;padding:0.7rem;border:1px solid #d2d2d7;background:#fff;border-radius:980px;font-size:0.9rem;cursor:pointer;">不是，我要问别的</button>
            <button id="semantic-yes-btn" style="flex:1;padding:0.7rem;background:#0071e3;color:#fff;border:none;border-radius:980px;font-size:0.9rem;cursor:pointer;">对的，看答案</button>
        </div>
    `;
    document.body.appendChild(card);

    // 朗读建议答案
    if (data.suggested_answer) speakText(data.suggested_answer);

    // 是 → 确认语义匹配，存入知识库
    document.getElementById('semantic-yes-btn').onclick = async () => {
        try {
            const r = await API.post('/api/knowledge/confirm-semantic', {
                new_question: originalQuestion,
                elderly_id: currentUser.id,
                suggested_id: data.suggested_id,
                pending_id: data.id
            });
            if (r.code === 0) {
                const hint = document.getElementById('voice-hint');
                hint.style.display = 'block';
                hint.textContent = '答案已保存';
                hint.style.color = 'var(--elderly-success)';
                setTimeout(() => { hint.style.display = 'none'; }, 2000);
            }
        } catch(e) { console.warn('确认语义匹配失败:', e); }
        card.remove();
        loadReplies();
    };

    // 不是 → 关闭卡片，pending 记录已存在，等待管理员回复
    document.getElementById('semantic-no-btn').onclick = () => {
        card.remove();
        const hint = document.getElementById('voice-hint');
        hint.style.display = 'block';
        hint.textContent = '问题已发送，家人会尽快回复';
        hint.style.color = 'var(--elderly-primary)';
        speakText('问题已发送，家人会尽快回复');
        setTimeout(() => { hint.style.display = 'none'; }, 3000);
    };
}

// ========== 视频录制 ==========
async function startVideoRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        const videoEl = document.getElementById('video-preview');
        videoEl.srcObject = stream;
        videoEl.style.display = 'block';
        document.getElementById('video-placeholder').style.display = 'none';

        mediaRecorder = new MediaRecorder(stream);
        videoChunks = [];

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) videoChunks.push(e.data);
        };

        mediaRecorder.onstop = () => {
            videoBlob = new Blob(videoChunks, { type: 'video/webm' });
            stream.getTracks().forEach(t => t.stop());
            videoEl.srcObject = null;
            videoEl.style.display = 'none';
            document.getElementById('video-placeholder').style.display = 'block';
            document.getElementById('video-status').textContent = '录制完成，点击"发送视频"提交';
            document.getElementById('video-status').style.display = 'block';
            document.getElementById('btn-submit-video').disabled = false;
        };

        mediaRecorder.start();
        document.getElementById('btn-start-video').disabled = true;
        document.getElementById('btn-stop-video').disabled = false;
        document.getElementById('video-status').textContent = '⏺ 正在录制...';
        document.getElementById('video-status').style.display = 'block';
        document.getElementById('btn-submit-video').disabled = true;
    } catch (err) {
        showElderlyError('摄像头不可用', '无法访问摄像头，请检查浏览器权限设置，允许摄像头后重试。',
            () => startVideoRecording());
        document.getElementById('video-status').textContent = '摄像头不可用';
        document.getElementById('video-status').style.display = 'block';
    }
}

function stopVideoRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
    }
    document.getElementById('btn-start-video').disabled = false;
    document.getElementById('btn-stop-video').disabled = true;
    document.getElementById('video-status').textContent = '录制完成';
}

async function submitVideoQuestion() {
    if (!videoBlob) {
        showElderlyError('请先录制', '请先点击"开始录制"按钮录制一段视频后再发送。', null);
        return;
    }

    const formData = new FormData();
    formData.append('video', videoBlob, 'question.webm');
    formData.append('question_text', '[视频提问]');
    formData.append('elderly_id', currentUser.id);

    const result = await API.postFormData('/api/knowledge/ask-video', formData);
    if (result.code === 0) {
        document.getElementById('video-status').textContent = '视频已发送！';
        document.getElementById('btn-submit-video').disabled = true;
        videoBlob = null;
        loadReplies();
    } else {
        showElderlyError('视频发送失败', result.msg || '请稍后重试。',
            () => submitVideoQuestion());
    }
}

// ========== TTS 语音朗读 ==========
let speechSynthesisAvailable = ('speechSynthesis' in window);
let ttsEnabled = true; // 老人端默认开启语音

function speakText(text, opts) {
    if (!speechSynthesisAvailable || !ttsEnabled || !text) return;
    try {
        // 取消正在朗读的内容
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'zh-CN';
        utter.rate = 0.9;   // 稍慢，适合老人
        utter.pitch = 1.0;
        utter.volume = 1.0;
        // 优先选择中文语音
        const voices = window.speechSynthesis.getVoices();
        const zhVoice = voices.find(v => v.lang && v.lang.toLowerCase().startsWith('zh'));
        if (zhVoice) utter.voice = zhVoice;
        if (opts && opts.onend) utter.onend = opts.onend;
        window.speechSynthesis.speak(utter);
    } catch (e) {
        console.warn('TTS 朗读失败:', e);
    }
}

function stopSpeaking() {
    if (speechSynthesisAvailable) {
        try { window.speechSynthesis.cancel(); } catch(e) {}
    }
}

// ========== 回答记录 ==========
async function loadReplies() {
    const result = await API.get(`/api/knowledge/list?elderly_id=${currentUser.id}`);
    const container = document.getElementById('replies-list');
    const empty = document.getElementById('replies-empty');

    if (result.code !== 0 || !result.data || result.data.length === 0) {
        container.innerHTML = '';
        empty.style.display = 'block';
        return;
    }
    empty.style.display = 'none';

    const replies = result.data.filter(r => r.answer_text || r.answer_audio_url || r.answer_image_url);
    container.innerHTML = replies.map(r => {
        let answerHtml = '';
        if (r.answer_text) {
            // 添加"再听一遍"语音按钮
            const speakBtn = speechSynthesisAvailable
                ? `<button class="btn-speak-again" onclick="speakText('${escapeHtml(r.answer_text).replace(/'/g, "\\'")}')">再听一遍</button>`
                : '';
            answerHtml += `<div class="reply-answer">${escapeHtml(r.answer_text)}${speakBtn}</div>`;
        }
        if (r.answer_audio_url) {
            answerHtml += `<div class="reply-audio"><audio controls src="${r.answer_audio_url}"></audio></div>`;
        }
        if (r.answer_image_url) {
            answerHtml += `<div class="reply-image"><img src="${r.answer_image_url}" alt="回复图片"></div>`;
        }
        return `<div class="reply-item">
            <div class="reply-question">${escapeHtml(r.question_text)}</div>
            ${answerHtml}
            <div class="reply-time">${escapeHtml(r.created_at)}</div>
        </div>`;
    }).join('');
}

// ========== 定时检查 ==========
function startPolling() {
    // 迭代5 P2：重入时先清理旧定时器，避免叠加导致请求翻倍
    if (checkinInterval) clearInterval(checkinInterval);
    if (pollingInterval) clearInterval(pollingInterval);
    checkinInterval = setInterval(() => {
        loadTodayMedications();
        checkReminderBanner();
        checkReminderTrigger();
    }, 30000);

    pollingInterval = setInterval(() => {
        loadReplies();
    }, 60000);
}

// ========== 全屏强制服药提醒 ==========

let currentTriggerId = null;
let triggerRecordingStream = null;
let triggerRecorder = null;
let triggerVideoChunks = [];
let triggerSpeechRecognition = null;
let triggerTranscript = '';
let triggerTimerInterval = null;
let triggerStatusPolling = null;
let triggerOverallTimeout = null;       // P0：65s总超时兜底
let triggerVoiceRetryDone = false;      // P0：语音识别重试标记（仅重试一次）
let triggerVoiceNoResultTimer = null;  // P0：30s无结果重试计时器
let autoConfirmTimer = null;             // 自动录音定时器
let isAutoConfirmMode = false;           // 是否处于自动录音模式

async function checkReminderTrigger() {
    // 如果已有提醒弹窗在显示，不再检查
    if (document.getElementById('reminder-modal-overlay').style.display === 'flex') return;
    if (currentTriggerId) return;

    try {
        const result = await API.get('/api/reminders/check-trigger');
        if (result.code === 0 && result.data && result.data.trigger) {
            showReminderModal(result.data.trigger, result.data.is_delayed);
        }
    } catch (e) {
        // 静默失败
    }
}

function showReminderModal(trigger, isDelayed) {
    currentTriggerId = trigger.id;
    const overlay = document.getElementById('reminder-modal-overlay');
    document.getElementById('reminder-modal-medicine').textContent = trigger.medicine_name || '药品';
    document.getElementById('reminder-modal-dosage').textContent = trigger.dosage ? `用量：${trigger.dosage}` : '';
    document.getElementById('reminder-modal-title').textContent = isDelayed ? '二次服药提醒' : '服药提醒';

    // 重置状态
    triggerUploadStarted = false;
    triggerVoiceRetryDone = false;
    isAutoConfirmMode = true;  // 进入自动录音模式

    // 老人端常开：自动播报后自动开始录音（用户要求：到点自动播报并开始录音）
    // 先隐藏手动确认按钮，显示"准备中"状态
    document.getElementById('reminder-modal-confirm').style.display = 'none';
    document.getElementById('reminder-recording-status').style.display = 'block';
    document.getElementById('reminder-recording-status').innerHTML = `
        <div class="recording-indicator">
            <span class="recording-dot"></span>
            <span>正在播报服药提醒，即将开始录音...</span>
        </div>
    `;
    document.getElementById('reminder-modal-result').style.display = 'none';

    overlay.style.display = 'flex';

    // P0：监听页面隐藏/关闭，保存已录制内容
    if (!window._triggerVisibilityBound) {
        window._triggerVisibilityBound = true;
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && currentTriggerId && triggerRecorder && triggerRecorder.state === 'recording') {
                // 页面切后台，立即停止录制保存数据
                stopTriggerRecording();
            }
        });
        window.addEventListener('beforeunload', () => {
            if (currentTriggerId && triggerRecorder && triggerRecorder.state === 'recording') {
                try { triggerRecorder.stop(); } catch(e) {}
            }
        });
    }

    // 请求浏览器系统通知权限
    requestNotificationPermission();

    // 播放语音提示（自动播报）
    speakText(`该吃药了：${trigger.medicine_name || '药品'}，${trigger.dosage || ''}`);

    // 播报结束后自动开始录音（3秒延迟，让老人听清提醒）
    if (autoConfirmTimer) clearTimeout(autoConfirmTimer);
    autoConfirmTimer = setTimeout(() => {
        autoConfirmTimer = null;
        if (currentTriggerId && isAutoConfirmMode) {
            confirmReminderTrigger();
        }
    }, 3000);
}

async function confirmReminderTrigger() {
    if (!currentTriggerId) return;

    // 清除自动录音定时器（避免与手动点击重复触发）
    if (autoConfirmTimer) { clearTimeout(autoConfirmTimer); autoConfirmTimer = null; }
    isAutoConfirmMode = false;

    // P0：麦克风权限预检，避免录制启动后才暴露问题
    try {
        if (navigator.permissions && navigator.permissions.query) {
            const micPerm = await navigator.permissions.query({ name: 'microphone' });
            if (micPerm.state === 'denied') {
                showToast('麦克风权限被拒绝，将仅录制视频', 'warning');
            }
        }
    } catch (e) { /* 部分浏览器不支持 permissions API，忽略 */ }

    // 确认提醒
    try {
        await API.post(`/api/reminders/trigger/${currentTriggerId}/confirm`, {});
    } catch (e) {
        // 确认失败不阻塞，继续录制
    }

    // 隐藏确认按钮，显示录制状态
    document.getElementById('reminder-modal-confirm').style.display = 'none';
    document.getElementById('reminder-recording-status').style.display = 'block';

    // 开始后台视频录制
    await startTriggerRecording();

    // 开始语音识别
    startTriggerSpeechRecognition();

    // P0：65秒总超时兜底，防止录制/识别卡死
    if (triggerOverallTimeout) clearTimeout(triggerOverallTimeout);
    triggerOverallTimeout = setTimeout(() => {
        if (triggerRecorder && triggerRecorder.state === 'recording') {
            stopTriggerRecording();
        }
    }, 65000);

    // 开始倒计时
    let remaining = 60;
    const timerEl = document.getElementById('recording-timer');
    triggerTimerInterval = setInterval(() => {
        remaining--;
        if (timerEl) {
            const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
            const ss = String(remaining % 60).padStart(2, '0');
            timerEl.textContent = `${mm}:${ss}`;
        }
        if (remaining <= 0) {
            stopTriggerRecording();
        }
    }, 1000);
}

async function startTriggerRecording() {
    try {
        triggerRecordingStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        triggerVideoChunks = [];

        // 选择支持的mime类型
        let mimeType = 'video/webm';
        if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported) {
            const candidates = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
            mimeType = candidates.find(m => MediaRecorder.isTypeSupported(m)) || 'video/webm';
        }

        try {
            triggerRecorder = new MediaRecorder(triggerRecordingStream, { mimeType });
        } catch (e) {
            triggerRecorder = new MediaRecorder(triggerRecordingStream);
        }

        triggerRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) triggerVideoChunks.push(e.data);
        };

        triggerRecorder.onstop = () => {
            const blob = new Blob(triggerVideoChunks, { type: mimeType });
            triggerUploadStarted = true;
            uploadTriggerVideo(blob, triggerTranscript);
            if (triggerRecordingStream) {
                triggerRecordingStream.getTracks().forEach(t => t.stop());
            }
        };

        triggerRecorder.start();
    } catch (err) {
        // 摄像头/麦克风不可用
        console.warn('录制设备不可用:', err);
        // 停止计时器
        if (triggerTimerInterval) {
            clearInterval(triggerTimerInterval);
            triggerTimerInterval = null;
        }
        // 浏览器安全策略：getUserMedia 需要用户手势，自动模式下降级为手动确认
        // 显示"点击开始录音"按钮让老人手动触发（一次手势即可获取后续权限）
        if (isAutoConfirmMode || (err.name === 'NotAllowedError' || err.name === 'SecurityError')) {
            isAutoConfirmMode = false;
            const recordingEl = document.getElementById('reminder-recording-status');
            const confirmEl = document.getElementById('reminder-modal-confirm');
            if (recordingEl) {
                recordingEl.innerHTML = `
                    <div style="text-align:center;padding:1rem;">
                        <div style="font-size:2.5rem;margin-bottom:0.5rem;">🎤</div>
                        <div style="font-size:1.1rem;font-weight:700;color:var(--elderly-text);margin-bottom:0.8rem;">请点击下方按钮开始录音</div>
                        <div style="font-size:0.9rem;color:var(--elderly-text-muted);">说出"吃了"或"等一下"即可</div>
                    </div>`;
            }
            if (confirmEl) {
                confirmEl.innerHTML = '<button class="reminder-confirm-btn" onclick="confirmReminderTrigger()" style="font-size:1.3rem;padding:1rem 2.5rem;">🎤 点击开始录音</button>';
                confirmEl.style.display = 'block';
            }
            return; // 不上传空 blob，等待老人手动点击
        }
        // 非权限问题（如设备不存在），仍上传空 blob 让 LLM 降级处理
        if (!triggerUploadStarted) {
            triggerUploadStarted = true;
            const emptyBlob = new Blob([], { type: 'video/webm' });
            uploadTriggerVideo(emptyBlob, triggerTranscript);
        }
    }
}

function startTriggerSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        // 浏览器不支持语音识别，仅录制视频，标记voice_failed
        triggerTranscript = '';
        return;
    }

    triggerSpeechRecognition = new SpeechRecognition();
    triggerSpeechRecognition.lang = 'zh-CN';
    triggerSpeechRecognition.continuous = true;
    triggerSpeechRecognition.interimResults = true;

    let smartTerminated = false;
    let hasAnyResult = false;
    triggerSpeechRecognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }
        if (finalTranscript || interimTranscript) {
            hasAnyResult = true;
        }
        if (finalTranscript) {
            triggerTranscript += finalTranscript;
        }
        // 智能关键词提前结束录制：识别到明确的服药/延迟意图后提前停止
        if (!smartTerminated && (finalTranscript || interimTranscript)) {
            const combined = (finalTranscript + interimTranscript).toLowerCase();
            const takenKeywords = ['已经喝', '已经吃', '正在喝', '正在吃', '喝了', '吃了', '吃过', '刚喝', '刚吃', '服过', '服了'];
            const delayKeywords = ['吃完饭', '等一会', '等一下', '稍后', '待会儿', '待会', '等会儿', '吃完饭再', '饭后'];
            const hitTaken = takenKeywords.some(k => combined.includes(k));
            const hitDelay = delayKeywords.some(k => combined.includes(k));
            if (hitTaken || hitDelay) {
                smartTerminated = true;
                // 捕获到关键词后等待 1.5 秒让语音完整，然后提前结束录制
                setTimeout(() => {
                    if (triggerRecorder && triggerRecorder.state === 'recording') {
                        stopTriggerRecording();
                    }
                }, 1500);
            }
        }
    };

    triggerSpeechRecognition.onerror = (event) => {
        console.warn('语音识别错误:', event.error);
        // no-speech / aborted 不视为致命错误
    };

    triggerSpeechRecognition.onend = () => {
        // 自动重启（如果还在录制中）
        if (triggerRecorder && triggerRecorder.state === 'recording') {
            try { triggerSpeechRecognition.start(); } catch(e) {}
        }
    };

    // P0：30秒无任何识别结果时，TTS提示并重试一次
    if (triggerVoiceNoResultTimer) clearTimeout(triggerVoiceNoResultTimer);
    triggerVoiceNoResultTimer = setTimeout(() => {
        if (!hasAnyResult && !triggerVoiceRetryDone && triggerRecorder && triggerRecorder.state === 'recording') {
            triggerVoiceRetryDone = true;
            // 语音提示老人说话
            speakText('请大声说出您是否已服药，例如：已经喝了，或：吃完饭再喝');
            // 重启识别
            try {
                if (triggerSpeechRecognition) triggerSpeechRecognition.stop();
                setTimeout(() => {
                    try { triggerSpeechRecognition.start(); } catch(e) {}
                }, 500);
            } catch(e) {}
        }
    }, 30000);

    try {
        triggerSpeechRecognition.start();
    } catch (e) {
        console.warn('启动语音识别失败:', e);
    }
}

let triggerUploadStarted = false;
function stopTriggerRecording() {
    // 停止计时器
    if (triggerTimerInterval) {
        clearInterval(triggerTimerInterval);
        triggerTimerInterval = null;
    }
    // P0：清理总超时和无结果重试计时器
    if (triggerOverallTimeout) { clearTimeout(triggerOverallTimeout); triggerOverallTimeout = null; }
    if (triggerVoiceNoResultTimer) { clearTimeout(triggerVoiceNoResultTimer); triggerVoiceNoResultTimer = null; }

    // 停止语音识别
    if (triggerSpeechRecognition) {
        try { triggerSpeechRecognition.stop(); } catch(e) {}
        triggerSpeechRecognition = null;
    }

    // 停止录制
    if (triggerRecorder && triggerRecorder.state === 'recording') {
        triggerRecorder.stop();
        // onstop 回调会负责上传
    } else if (!triggerUploadStarted) {
        // 录制器未启动或已停止且尚未上传，直接上传空视频
        if (triggerRecordingStream) {
            triggerRecordingStream.getTracks().forEach(t => t.stop());
        }
        triggerUploadStarted = true;
        uploadTriggerVideo(new Blob([], { type: 'video/webm' }), triggerTranscript);
    }
}

async function uploadTriggerVideo(blob, transcript) {
    if (!currentTriggerId) return;

    const formData = new FormData();
    formData.append('video', blob, 'medication.webm');
    formData.append('transcript', transcript || '');

    // 显示分析中状态（含进度指示器）
    const recordingEl = document.getElementById('reminder-recording-status');
    if (recordingEl) {
        recordingEl.innerHTML = `
            <div class="recording-indicator">
                <span class="recording-dot" style="background:#0071e3"></span>
                <span>正在分析您的语音...</span>
            </div>
            <div class="analysis-progress">
                <div class="analysis-progress-bar" id="analysis-progress-bar"></div>
            </div>
            <div class="recording-hint">已等待 <span id="analysis-elapsed">0</span> 秒，请稍候</div>
        `;
        startAnalysisProgressIndicator();
    }

    try {
        const result = await API.postFormData(`/api/reminders/trigger/${currentTriggerId}/video`, formData);

        if (result.code === 0) {
            // 开始轮询分析结果
            startTriggerStatusPolling();
        } else {
            stopAnalysisProgressIndicator();
            showTriggerResult('error', result.msg || '上传失败，请稍后重试');
        }
    } catch (e) {
        stopAnalysisProgressIndicator();
        showTriggerResult('error', '网络错误，请稍后重试');
    }
}

// 分析进度指示器
let analysisProgressInterval = null;
let analysisProgressStart = 0;
function startAnalysisProgressIndicator() {
    analysisProgressStart = Date.now();
    const barEl = document.getElementById('analysis-progress-bar');
    const elapsedEl = document.getElementById('analysis-elapsed');
    analysisProgressInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - analysisProgressStart) / 1000);
        if (elapsedEl) elapsedEl.textContent = elapsed;
        // 进度条：预计最长60秒，但限制在95%以内避免误导
        const pct = Math.min(95, (elapsed / 60) * 100);
        if (barEl) barEl.style.width = pct + '%';
    }, 500);
}
function stopAnalysisProgressIndicator() {
    if (analysisProgressInterval) {
        clearInterval(analysisProgressInterval);
        analysisProgressInterval = null;
    }
    const barEl = document.getElementById('analysis-progress-bar');
    if (barEl) barEl.style.width = '100%';
}

function startTriggerStatusPolling() {
    let attempts = 0;
    triggerStatusPolling = setInterval(async () => {
        attempts++;
        // 迭代5 P1：超时阈值从30秒提到60秒，避免后端AI分析慢时的"假阴性"超时
        if (attempts > 60) {
            clearInterval(triggerStatusPolling);
            showTriggerResult('delay', '分析仍在进行中，结果稍后会自动同步，请放心');
            return;
        }

        try {
            const result = await API.get(`/api/reminders/trigger/${currentTriggerId}/status`);
            if (result.code === 0 && result.data) {
                const status = result.data.status;
                const sceneType = result.data.scene_type || '';
                if (status === 'completed') {
                    clearInterval(triggerStatusPolling);
                    const healthQ = result.data.health_question || '';
                    if (sceneType === 'already_taken') {
                        // 新场景：已提前服药，不重复打卡
                        showTriggerResult('delay', '好的，您说已经吃过药了，我们已记录，不会重复提醒');
                        speakText('好的，您说已经吃过药了，我们已记录，不会重复提醒');
                    } else {
                        // 场景2：已服药
                        showTriggerResult('success', `已为您完成服药打卡 ✓${healthQ ? '\n' + healthQ : ''}`);
                        speakText(`已为您完成服药打卡。${healthQ}`);
                    }
                } else if (status === 'delayed') {
                    clearInterval(triggerStatusPolling);
                    // 场景1：延迟服药
                    const analysis = result.data.scene_analysis || '';
                    showTriggerResult('delay', `好的，30分钟后再提醒您服药${analysis ? '\n' + analysis : ''}`);
                    speakText('好的，30分钟后再提醒您服药');
                } else if (status === 'missed') {
                    clearInterval(triggerStatusPolling);
                    showTriggerResult('delay', '您已延迟过一次，本次按未服药处理，请注意按时服药');
                    speakText('您已延迟过一次，本次按未服药处理，请注意按时服药');
                } else if (status === 'manual') {
                    clearInterval(triggerStatusPolling);
                    if (sceneType === 'refused_unwell') {
                        // 新场景：身体不适拒绝服药
                        showTriggerResult('error', '您说身体不舒服，已通知家人关心您，请注意休息');
                        speakText('您说身体不舒服，已通知家人关心您，请注意休息');
                    } else {
                        showTriggerResult('error', '无法识别您的语音，请联系家人确认');
                    }
                }
                // 'analyzing' 状态继续等待
            }
        } catch (e) {
            // 静默继续
        }
    }, 2000);
}

function showTriggerResult(type, text) {
    stopAnalysisProgressIndicator();
    const resultEl = document.getElementById('reminder-modal-result');
    const recordingEl = document.getElementById('reminder-recording-status');
    const iconEl = document.getElementById('result-icon');
    const textEl = document.getElementById('result-text');
    const closeBtn = document.getElementById('result-close-btn');

    if (recordingEl) recordingEl.style.display = 'none';
    if (!resultEl || !iconEl || !textEl) return;

    resultEl.className = `reminder-modal-result ${type}`;
    iconEl.textContent = type === 'success' ? '✓' : (type === 'delay' ? '⏰' : '⚠️');
    textEl.textContent = text;
    // 手动换行：支持 \n
    textEl.style.whiteSpace = 'pre-wrap';
    resultEl.style.display = 'block';
    if (closeBtn) closeBtn.style.display = 'block';

    // 不再自动关闭，等待老人手动点击"我知道了"
}

function closeReminderModal() {
    const overlay = document.getElementById('reminder-modal-overlay');
    if (overlay) overlay.style.display = 'none';
    currentTriggerId = null;
    triggerTranscript = '';
    triggerVideoChunks = [];
    isAutoConfirmMode = false;
    if (autoConfirmTimer) { clearTimeout(autoConfirmTimer); autoConfirmTimer = null; }
    stopAnalysisProgressIndicator();
    if (triggerStatusPolling) { clearInterval(triggerStatusPolling); triggerStatusPolling = null; }
    if (triggerTimerInterval) { clearInterval(triggerTimerInterval); triggerTimerInterval = null; }
    // 恢复确认按钮原始内容（供下次使用）
    const confirmEl = document.getElementById('reminder-modal-confirm');
    if (confirmEl) confirmEl.innerHTML = '<button class="reminder-confirm-btn" onclick="confirmReminderTrigger()">我已开始录音</button>';
    // 刷新今日药品列表
    loadTodayMedications();
}

// ========== 初始化 ==========
async function init() {
    const authed = await checkAuth();
    if (!authed) return;

    initUI();
    // 预加载语音列表（部分浏览器需要异步加载）
    if (speechSynthesisAvailable) {
        window.speechSynthesis.getVoices();
        window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }
    await loadTodayMedications();
    // 登录后自动播报当日服药时间及状态（仅一次，避免轮询打扰）
    broadcastTodayMedications();
    await loadReplies();
    // 迭代4 P0：网络恢复后自动同步离线打卡队列
    window.addEventListener('online', () => {
        flushPendingCheckins();
        showToast('网络已恢复', 'success');
    });
    // 启动时若有积压，尝试同步一次
    flushPendingCheckins();
    startPolling();
}

// ========== 迭代5 创新·遗忘时光倒流镜 ==========
// 解决老人最高频痛点："我刚才到底吃没吃药？"
// 反直觉设计：不弹文字提示，直接让老人看30秒前自己服药的画面
async function showLastTakenVideo() {
    const result = await API.get('/api/checkin/last-taken-video');
    const overlay = document.getElementById('rewind-overlay');
    const content = document.getElementById('rewind-content');
    const watermark = document.getElementById('rewind-watermark');
    const title = document.getElementById('rewind-title');

    if (result.code !== 0 || !result.data) {
        // 没有服药记录
        content.innerHTML = `<div style="text-align:center;padding:1.5rem;">
            <div style="font-size:3rem;margin-bottom:0.8rem;">🤔</div>
            <div style="font-size:1.1rem;color:#6e6e73;line-height:1.6;">今天还没有服药记录。<br>如果您还没吃药，请到上方列表点击"我已服药"。</div>
        </div>`;
        watermark.style.display = 'none';
        title.textContent = '暂无服药记录';
        overlay.style.display = 'flex';
        return;
    }

    const data = result.data;
    const time = (data.created_at || data.checkin_time || '').slice(11, 16);
    const date = (data.created_at || data.checkin_time || '').slice(0, 10);

    if (data.has_video && data.video_url) {
        // 有视频：直接播放，让老人相信自己的眼睛
        watermark.textContent = `已服药 ✓ ${time}`;
        watermark.style.display = 'block';
        title.textContent = '您刚才服药的画面';
        content.innerHTML = `<video controls autoplay playsinline class="rewind-video"
            src="${data.video_url}"></video>
            <div class="rewind-info">
                <div class="rewind-medicine">💊 ${escapeHtml(data.medicine_name || '药品')}</div>
                <div class="rewind-time">服药时间：${date} ${time}</div>
            </div>`;
    } else {
        // 无视频：降级为文字提示（基于打卡记录）
        watermark.textContent = `已服药 ✓ ${time}`;
        watermark.style.display = 'block';
        title.textContent = '您刚才已服药';
        content.innerHTML = `<div style="text-align:center;padding:1.5rem;">
            <div style="font-size:3rem;margin-bottom:0.8rem;">✓</div>
            <div style="font-size:1.3rem;font-weight:800;color:#34c759;margin-bottom:0.5rem;">已经吃过啦</div>
            <div style="font-size:1.05rem;color:#1d1d1f;line-height:1.6;">
                您在 <strong>${time}</strong> 已经服过<br>
                <strong>${escapeHtml(data.medicine_name || '药品')}</strong>
            </div>
            <div style="font-size:0.9rem;color:#86868b;margin-top:0.8rem;">放心吧，不用再吃了</div>
        </div>`;
    }
    overlay.style.display = 'flex';
}

function closeRewindModal() {
    document.getElementById('rewind-overlay').style.display = 'none';
    // 停止视频播放
    const v = document.querySelector('#rewind-content video');
    if (v) { v.pause(); v.currentTime = 0; }
}

init();
