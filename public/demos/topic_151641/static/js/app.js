let habitData = JSON.parse(localStorage.getItem('habitData') || '{}');
let moodData = JSON.parse(localStorage.getItem('moodData') || '[]');
let treeholeData = JSON.parse(localStorage.getItem('treeholeData') || '[]');
let chatStarted = false;
let isTreeholeOpen = false;
let currentHabitMonth = new Date();
let currentMoodMonth = new Date();
let selectedMood = null;
let breathingInterval = null;
let currentGame = null;
let gameSecret = null;
let wordHistory = [];
let startY = 0;
let wheelPullDistance = 0;
let wheelResetTimer = null;

const appContainer = document.getElementById('appContainer');
const overlay = document.getElementById('transitionOverlay');
const chatPage = document.getElementById('chatPage');
const treeholePage = document.getElementById('treeholePage');
const myProfileBtn = document.getElementById('myProfileBtn');
const newChatBtn = document.getElementById('newChatBtn');
const bottomNav = document.getElementById('bottomNav');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const quickCards = document.getElementById('quickCards');
const treeholePullHint = document.getElementById('treeholePullHint');
const treeholeInput = document.getElementById('treeholeInput');
const treeholeList = document.getElementById('treeholeList');
const treeholeHistoryChip = document.querySelector('.treehole-nav-chip');

const defaultWelcomeMessage = '嗨！欢迎来到心岛，很高兴能陪伴你，最近怎么样？';

function createEntryId() {
    return `entry_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeTreeholeData() {
    let changed = false;
    treeholeData = treeholeData.map((item) => {
        if (item && item.id) {
            return item;
        }

        changed = true;
        return {
            ...item,
            id: createEntryId()
        };
    });

    if (changed) {
        localStorage.setItem('treeholeData', JSON.stringify(treeholeData));
    }
}

function escapeHTML(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function getActivePageId() {
    const activePage = document.querySelector('.page.active');
    return activePage ? activePage.id : 'chatPage';
}

function syncChrome(pageId) {
    const isChatPage = pageId === 'chatPage';
    const isDiscoverPage = pageId === 'discoverPage';
    const isTreeholePage = pageId === 'treeholePage';

    appContainer.classList.toggle('chat-mode', isChatPage);
    appContainer.classList.toggle('chat-started', isChatPage && chatStarted);
    appContainer.classList.toggle('is-treehole', isTreeholePage);

    myProfileBtn.style.display = isChatPage ? 'flex' : 'none';
    newChatBtn.style.display = isChatPage ? 'flex' : 'none';
    bottomNav.style.display = isTreeholePage ? 'none' : 'flex';
    bottomNav.classList.remove('hidden');

    if (isDiscoverPage) {
        document.querySelector('.bottom-nav-item[data-page="discover"]').classList.add('active');
    }
    if (isChatPage) {
        document.querySelector('.bottom-nav-item[data-page="chat"]').classList.add('active');
    }
}

function showPage(pageId) {
    document.querySelectorAll('.page').forEach((page) => page.classList.remove('active', 'page-revealing'));
    document.querySelectorAll('.bottom-nav-item').forEach((btn) => btn.classList.remove('active'));

    const targetPage = document.getElementById(pageId);
    targetPage.classList.add('active');
    syncChrome(pageId);
}

function getOverlayOrigin(origin) {
    if (origin && origin.centerX !== undefined && origin.centerY !== undefined) {
        return origin;
    }

    const frameRect = appContainer.getBoundingClientRect();
    const rect = origin.getBoundingClientRect();
    return {
        centerX: rect.left - frameRect.left + rect.width / 2,
        centerY: rect.top - frameRect.top + rect.height / 2
    };
}

function runOverlayTransition(targetPageId, origin, options = {}) {
    const {
        color = '#667eea',
        beforeSwitch,
        afterSwitch
    } = options;

    const { centerX, centerY } = getOverlayOrigin(origin);
    overlay.style.left = `${centerX}px`;
    overlay.style.top = `${centerY}px`;
    overlay.style.setProperty('--overlay-tint', color);
    overlay.style.setProperty('--overlay-tint-secondary', color);
    overlay.style.setProperty('--overlay-tint-tertiary', color);
    overlay.classList.remove('fade-out', 'active');
    void overlay.offsetWidth;
    overlay.classList.add('active');

    window.setTimeout(() => {
        if (typeof beforeSwitch === 'function') {
            beforeSwitch();
        }

        showPage(targetPageId);
        const targetPage = document.getElementById(targetPageId);
        targetPage.classList.add('page-revealing');

        if (typeof afterSwitch === 'function') {
            afterSwitch();
        }

        window.setTimeout(() => {
            overlay.classList.add('fade-out');
        }, 90);

        window.setTimeout(() => {
            overlay.classList.remove('active', 'fade-out');
            targetPage.classList.remove('page-revealing');
        }, 420);
    }, 320);
}

function animateIntroOut() {
    if (!quickCards || quickCards.classList.contains('exit')) {
        return;
    }

    quickCards.classList.add('exit');
    window.setTimeout(() => {
        quickCards.style.display = 'none';
    }, 320);
}

function resetIntroCards() {
    quickCards.style.display = 'block';
    quickCards.classList.remove('exit');
}

function startChat() {
    if (chatStarted) {
        return;
    }

    chatStarted = true;
    appContainer.classList.add('chat-started');
    animateIntroOut();
}

function resetChatHome() {
    chatStarted = false;
    appContainer.classList.remove('chat-started');
    isTreeholeOpen = false;
    chatMessages.innerHTML = `
        <div class="message ai">
            <span class="avatar">🏝️</span>
            <div class="bubble">${defaultWelcomeMessage}</div>
        </div>
    `;
    chatInput.value = '';
    resetIntroCards();
    showPage('chatPage');
}

function addMessage(content, isUser = false) {
    const div = document.createElement('div');
    div.className = `message ${isUser ? 'user' : 'ai'}`;
    div.innerHTML = `
        ${!isUser ? '<span class="avatar">🏝️</span>' : ''}
        <div class="bubble">${escapeHTML(content)}</div>
        ${isUser ? '<span class="avatar">😊</span>' : ''}
    `;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function getAIResponse(message) {
    const responses = [
        '我在听，慢慢说。',
        '听起来你现在有点压力，先陪自己慢慢缓一口气。',
        '谢谢你愿意把这些告诉我。',
        '这确实不轻松，但你不是一个人在扛。',
        '如果愿意的话，我们可以把这件事一点点拆开聊。',
        '你已经在努力表达自己了，这很重要。',
        '要不要也把这些写进小树洞，给情绪一个安放的地方？'
    ];
    return responses[Math.floor(Math.random() * responses.length)];
}

function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) {
        return;
    }

    startChat();
    addMessage(message, true);
    chatInput.value = '';

    window.setTimeout(() => {
        addMessage(getAIResponse(message));
    }, 500);
}

function openTreehole(origin = { centerX: appContainer.clientWidth / 2, centerY: 0 }) {
    if (isTreeholeOpen) {
        return;
    }

    isTreeholeOpen = true;
    runOverlayTransition('treeholePage', origin, {
        color: '#08080d',
        afterSwitch: () => {
            renderTreehole();
        }
    });
}

function closeTreehole(origin = document.getElementById('closeTreehole')) {
    isTreeholeOpen = false;
    runOverlayTransition('chatPage', origin, {
        color: '#08080d'
    });
}

function renderTreehole() {
    const sorted = [...treeholeData].reverse();

    if (sorted.length === 0) {
        treeholeList.innerHTML = '<p style="color:#8f95bc; text-align:center; padding: 24px 0;">这里还没有留下心事</p>';
        return;
    }

    treeholeList.innerHTML = sorted.map((item) => `
        <div class="treehole-item" data-id="${escapeHTML(item.id)}">
            <div class="treehole-item-head">
                <div class="date">${escapeHTML(item.date)}</div>
                <button class="treehole-delete-btn" type="button" data-delete-treehole="${escapeHTML(item.id)}" aria-label="删除这条心事">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18"/>
                        <path d="M8 6V4h8v2"/>
                        <path d="M19 6l-1 13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                        <path d="M10 11v5"/>
                        <path d="M14 11v5"/>
                    </svg>
                </button>
            </div>
            <div class="content">${escapeHTML(item.content)}</div>
        </div>
    `).join('');
}

function saveTreeholeEntry() {
    const content = treeholeInput.value.trim();
    if (!content) {
        alert('请输入心事');
        return;
    }

    const now = new Date();
    const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    treeholeData.push({ id: createEntryId(), date: dateKey, content });
    localStorage.setItem('treeholeData', JSON.stringify(treeholeData));

    treeholeInput.value = '';
    renderTreehole();
}

function deleteTreeholeEntry(entryId) {
    const nextEntries = treeholeData.filter((item) => item.id !== entryId);
    if (nextEntries.length === treeholeData.length) {
        return;
    }

    treeholeData = nextEntries;
    localStorage.setItem('treeholeData', JSON.stringify(treeholeData));
    renderTreehole();
}

function renderHabitCalendar() {
    const container = document.getElementById('habitCalendar');
    const year = currentHabitMonth.getFullYear();
    const month = currentHabitMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

    let html = `
        <div class="calendar-header">
            <div class="calendar-month">${year}年${month + 1}月</div>
            <div class="calendar-nav">
                <button onclick="changeHabitMonth(-1)">‹</button>
                <button onclick="changeHabitMonth(1)">›</button>
            </div>
        </div>
        <div class="calendar-weekdays">
            <span>日</span><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span>
        </div>
        <div class="calendar-days">
    `;

    const prevMonth = new Date(year, month, 0);
    for (let i = startDay - 1; i >= 0; i--) {
        html += `<div class="calendar-day other-month">${prevMonth.getDate() - i}</div>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const classes = ['calendar-day'];

        if (isCurrentMonth && day === today.getDate()) {
            classes.push('today');
        }
        if (habitData[dateKey]) {
            classes.push('checked');
        }

        html += `<div class="${classes.join(' ')}">${day}</div>`;
    }

    const remaining = 42 - (startDay + daysInMonth);
    for (let i = 1; i <= remaining; i++) {
        html += `<div class="calendar-day other-month">${i}</div>`;
    }

    html += '</div>';
    container.innerHTML = html;
}

function changeHabitMonth(delta) {
    currentHabitMonth.setMonth(currentHabitMonth.getMonth() + delta);
    renderHabitCalendar();
}

function updateStreak() {
    let streak = 0;
    const today = new Date();

    for (let i = 0; i < 365; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

        if (habitData[dateKey]) {
            streak++;
        } else if (i > 0) {
            break;
        }
    }

    document.getElementById('streakNumber').textContent = streak;
}

function renderMoodCalendar() {
    const container = document.getElementById('moodCalendar');
    const year = currentMoodMonth.getFullYear();
    const month = currentMoodMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
    const moodEmojis = { happy: '😊', calm: '😌', anxious: '😰', sad: '😢', angry: '😠' };

    let html = `
        <div class="calendar-header">
            <div class="calendar-month">${year}年${month + 1}月</div>
            <div class="calendar-nav">
                <button onclick="changeMoodMonth(-1)">‹</button>
                <button onclick="changeMoodMonth(1)">›</button>
            </div>
        </div>
        <div class="calendar-weekdays">
            <span>日</span><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span>
        </div>
        <div class="calendar-days">
    `;

    const prevMonth = new Date(year, month, 0);
    for (let i = startDay - 1; i >= 0; i--) {
        html += `<div class="calendar-day other-month">${prevMonth.getDate() - i}</div>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const classes = ['calendar-day'];
        let content = day;

        if (isCurrentMonth && day === today.getDate()) {
            classes.push('today');
        }

        const moodEntry = moodData.find((item) => item.date === dateKey);
        if (moodEntry) {
            content = moodEmojis[moodEntry.mood] || day;
            classes.push('checked');
        }

        html += `<div class="${classes.join(' ')}">${content}</div>`;
    }

    const remaining = 42 - (startDay + daysInMonth);
    for (let i = 1; i <= remaining; i++) {
        html += `<div class="calendar-day other-month">${i}</div>`;
    }

    html += '</div>';
    container.innerHTML = html;
}

function changeMoodMonth(delta) {
    currentMoodMonth.setMonth(currentMoodMonth.getMonth() + delta);
    renderMoodCalendar();
}

function renderMoodHistory() {
    const container = document.getElementById('moodHistory');
    const sorted = [...moodData].reverse().slice(0, 10);

    if (sorted.length === 0) {
        container.innerHTML = '<p style="color: #8e8e93; text-align: center;">暂无记录</p>';
        return;
    }

    const moodEmojis = { happy: '😊', calm: '😌', anxious: '😰', sad: '😢', angry: '😠' };
    container.innerHTML = sorted.map((item) => `
        <div style="padding: 10px 0; border-bottom: 1px solid #f2f2f7;">
            <div style="font-size: 12px; color: #8e8e93; margin-bottom: 4px;">${escapeHTML(item.date)}</div>
            <div style="font-size: 14px;">${moodEmojis[item.mood] || ''} ${escapeHTML(item.content || '')}</div>
        </div>
    `).join('');
}

document.querySelectorAll('.bottom-nav-item').forEach((btn) => {
    btn.addEventListener('click', () => {
        const pageMap = {
            chat: 'chatPage',
            discover: 'discoverPage'
        };
        showPage(pageMap[btn.dataset.page]);
    });
});

myProfileBtn.addEventListener('click', (event) => {
    runOverlayTransition('myProfilePage', event.currentTarget, {
        color: '#667eea'
    });
});

newChatBtn.addEventListener('click', (event) => {
    runOverlayTransition('chatPage', event.currentTarget, {
        color: '#667eea',
        beforeSwitch: () => {
            resetChatHome();
        }
    });
});

[
    'backToDiscover1', 'backToDiscover2', 'backToDiscover3', 'backToDiscover4',
    'backToDiscover5', 'backToDiscover6', 'backToDiscover7', 'backToDiscover8'
].forEach((id) => {
    const btn = document.getElementById(id);
    if (!btn) {
        return;
    }

    btn.addEventListener('click', () => {
        showPage('discoverPage');
    });
});

document.getElementById('backFromProfile').addEventListener('click', (event) => {
    runOverlayTransition('chatPage', event.currentTarget, {
        color: '#667eea'
    });
});

document.querySelectorAll('.function-item').forEach((btn) => {
    btn.addEventListener('click', () => {
        const pageMap = {
            habit: 'habitPage',
            mood: 'moodPage',
            breathing: 'breathingPage',
            game: 'gamePage',
            psychological: 'psychologicalPage',
            stress: 'stressPage',
            mentalState: 'mentalStatePage',
            currentState: 'currentStatePage'
        };
        const pageId = pageMap[btn.dataset.page];
        if (!pageId) {
            return;
        }

        showPage(pageId);

        if (pageId === 'habitPage') {
            renderHabitCalendar();
            updateStreak();
        }

        if (pageId === 'moodPage') {
            renderMoodCalendar();
            renderMoodHistory();
        }
    });
});

document.getElementById('closeTreehole').addEventListener('click', (event) => {
    closeTreehole(event.currentTarget);
});

treeholeHistoryChip.addEventListener('click', () => {
    document.querySelector('.treehole-history-panel').scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
});

treeholeList.addEventListener('click', (event) => {
    const deleteButton = event.target.closest('[data-delete-treehole]');
    if (!deleteButton) {
        return;
    }

    deleteTreeholeEntry(deleteButton.dataset.deleteTreehole);
});

chatPage.addEventListener('touchstart', (event) => {
    startY = event.touches[0].clientY;
});

chatPage.addEventListener('touchmove', (event) => {
    if (getActivePageId() !== 'chatPage' || isTreeholeOpen) {
        return;
    }

    const currentY = event.touches[0].clientY;
    const diff = currentY - startY;
    if (diff > 110) {
        openTreehole({ centerX: appContainer.clientWidth / 2, centerY: 8 });
    }
});

chatPage.addEventListener('wheel', (event) => {
    if (getActivePageId() !== 'chatPage' || isTreeholeOpen) {
        return;
    }

    if (chatMessages.scrollTop > 0) {
        wheelPullDistance = 0;
        return;
    }

    if (event.deltaY > 0) {
        wheelPullDistance += event.deltaY;
        if (wheelPullDistance > 140) {
            wheelPullDistance = 0;
            openTreehole({ centerX: appContainer.clientWidth / 2, centerY: 8 });
        }
    } else {
        wheelPullDistance = 0;
    }

    window.clearTimeout(wheelResetTimer);
    wheelResetTimer = window.setTimeout(() => {
        wheelPullDistance = 0;
    }, 220);
}, { passive: true });

sendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
});

document.querySelectorAll('.quick-card').forEach((card) => {
    card.addEventListener('click', () => {
        chatInput.value = card.dataset.question;
        sendMessage();
    });
});

document.querySelectorAll('.topic-item').forEach((item) => {
    item.addEventListener('click', () => {
        startChat();
        addMessage(`我想了解关于“${item.dataset.topic}”的内容`, true);
        window.setTimeout(() => {
            addMessage(`好的，我们就从“${item.dataset.topic}”开始。你现在最困扰你的点是什么？`);
        }, 500);
    });
});

chatMessages.addEventListener('scroll', () => {
    const currentTop = chatMessages.scrollTop;
    if (currentTop > 50) {
        bottomNav.classList.add('hidden');
    } else {
        bottomNav.classList.remove('hidden');
    }
});

document.getElementById('checkinBtn').addEventListener('click', () => {
    const habit = document.getElementById('habitSelect').value;
    const note = document.getElementById('habitNote').value;
    const today = new Date();
    const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    habitData[dateKey] = { habit, note, date: new Date().toISOString() };
    localStorage.setItem('habitData', JSON.stringify(habitData));

    document.getElementById('habitResult').innerHTML = `
        <strong>✅ 打卡成功！</strong><br>
        习惯：${document.getElementById('habitSelect').options[document.getElementById('habitSelect').selectedIndex].text}
        ${note ? `<br>备注：${escapeHTML(note)}` : ''}
    `;

    renderHabitCalendar();
    updateStreak();
});

document.querySelectorAll('.mood-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.mood-btn').forEach((item) => item.classList.remove('active'));
        btn.classList.add('active');
        selectedMood = btn.dataset.mood;
    });
});

document.getElementById('saveMoodBtn').addEventListener('click', () => {
    if (!selectedMood) {
        alert('请先选择心情');
        return;
    }

    const content = document.getElementById('moodContent').value;
    const today = new Date();
    const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const existingIndex = moodData.findIndex((item) => item.date === dateKey);
    const entry = { date: dateKey, mood: selectedMood, content };

    if (existingIndex >= 0) {
        moodData[existingIndex] = entry;
    } else {
        moodData.push(entry);
    }

    localStorage.setItem('moodData', JSON.stringify(moodData));
    document.getElementById('moodContent').value = '';
    selectedMood = null;
    document.querySelectorAll('.mood-btn').forEach((btn) => btn.classList.remove('active'));
    renderMoodCalendar();
    renderMoodHistory();
    alert('保存成功！');
});

document.getElementById('saveTreehole').addEventListener('click', saveTreeholeEntry);

document.getElementById('breathingStartBtn').addEventListener('click', () => {
    const circle = document.getElementById('breathingCircle');
    const text = document.getElementById('breathingText');
    const btn = document.getElementById('breathingStartBtn');

    if (breathingInterval) {
        clearInterval(breathingInterval);
        breathingInterval = null;
        circle.classList.remove('breathe-in', 'breathe-out');
        text.textContent = '开始';
        btn.textContent = '开始练习';
        return;
    }

    btn.textContent = '停止';
    let phase = 0;
    const phases = [
        { text: '吸', class: 'breathe-in' },
        { text: '屏', class: 'breathe-in' },
        { text: '呼', class: 'breathe-out' }
    ];

    function nextPhase() {
        const current = phases[phase];
        text.textContent = current.text;
        circle.classList.remove('breathe-in', 'breathe-out');
        void circle.offsetWidth;
        circle.classList.add(current.class);
        phase = (phase + 1) % phases.length;
    }

    nextPhase();
    breathingInterval = window.setInterval(nextPhase, 4000);
});

document.querySelectorAll('.game-item').forEach((item) => {
    item.addEventListener('click', () => {
        const game = item.dataset.game;
        const area = document.getElementById('gameArea');

        if (game === 'guess') {
            currentGame = 'guess';
            gameSecret = Math.floor(Math.random() * 100) + 1;
            area.innerHTML = `
                <div style="background: #fff; padding: 20px; border-radius: 16px;">
                    <h4 style="margin-bottom: 12px;">猜数字（1-100）</h4>
                    <div style="display: flex; gap: 10px;">
                        <input type="number" id="guessInput" placeholder="输入数字" style="flex: 1; padding: 14px; border: 1px solid #e5e5ea; border-radius: 12px;">
                        <button id="guessBtn" style="padding: 14px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; border: none; border-radius: 12px; cursor: pointer;">猜</button>
                    </div>
                    <div id="guessResult" style="margin-top: 12px; font-size: 14px;"></div>
                </div>
            `;
            document.getElementById('guessBtn').addEventListener('click', () => {
                const val = parseInt(document.getElementById('guessInput').value, 10);
                const result = document.getElementById('guessResult');
                if (val < gameSecret) {
                    result.textContent = '太小了！';
                } else if (val > gameSecret) {
                    result.textContent = '太大了！';
                } else {
                    result.textContent = '🎉 恭喜猜对了！刷新页面再来一次';
                }
            });
        }

        if (game === 'word') {
            currentGame = 'word';
            wordHistory = ['心岛'];
            area.innerHTML = `
                <div style="background: #fff; padding: 20px; border-radius: 16px;">
                    <h4 style="margin-bottom: 12px;">词语接龙</h4>
                    <div id="wordHistory" style="font-size: 14px; color: #8e8e93; margin-bottom: 12px;">当前：心岛</div>
                    <div style="display: flex; gap: 10px;">
                        <input type="text" id="wordInput" placeholder="输入词语" style="flex: 1; padding: 14px; border: 1px solid #e5e5ea; border-radius: 12px;">
                        <button id="wordBtn" style="padding: 14px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; border: none; border-radius: 12px; cursor: pointer;">接</button>
                    </div>
                </div>
            `;
            document.getElementById('wordBtn').addEventListener('click', () => {
                const input = document.getElementById('wordInput');
                const word = input.value.trim();
                if (word.length < 2) {
                    alert('请输入至少两个字');
                    return;
                }

                const last = wordHistory[wordHistory.length - 1];
                if (word[0] !== last[last.length - 1]) {
                    alert(`要接“${last[last.length - 1]}”开头的词哦`);
                    return;
                }

                wordHistory.push(word);
                document.getElementById('wordHistory').textContent = `当前：${wordHistory.join(' → ')}`;
                input.value = '';
            });
        }
    });
});

window.changeHabitMonth = changeHabitMonth;
window.changeMoodMonth = changeMoodMonth;

renderHabitCalendar();
updateStreak();
renderMoodCalendar();
renderMoodHistory();
normalizeTreeholeData();
renderTreehole();
showPage('chatPage');
