let appState = {
    dictionaryName: '',
    records: {},
    currentEmotionId: null,
    lastRecord: {
        event: '',
        feeling: ''
    },
    previousPage: '',
    userEmotions: {}
};

function init() {
    const savedData = localStorage.getItem('moodlex_data');
    if (savedData) {
        try {
            const saved = JSON.parse(savedData);
            appState = {
                dictionaryName: saved.dictionaryName || '',
                records: saved.records || {},
                currentEmotionId: null,
                lastRecord: saved.lastRecord || { content: '' },
                previousPage: '',
                userEmotions: saved.userEmotions || {}
            };
        } catch (e) {
            console.error('Failed to load saved data:', e);
        }
    }
    
    showHome();
}

function showHome() {
    if (appState.dictionaryName) {
        // 已有词典，显示打开模式
        document.getElementById('home-create-mode').classList.add('hidden');
        document.getElementById('home-open-mode').classList.remove('hidden');
        document.getElementById('home-dict-name').textContent = appState.dictionaryName;
        document.getElementById('dict-name-display').textContent = appState.dictionaryName;
        renderRecentEmotions();
    } else {
        // 没有词典，显示创建模式
        document.getElementById('home-create-mode').classList.remove('hidden');
        document.getElementById('home-open-mode').classList.add('hidden');
    }
    showPage('page-home');
}

function saveData() {
    localStorage.setItem('moodlex_data', JSON.stringify(appState));
}

function showPage(pageId) {
    document.querySelectorAll('[id^="page-"]').forEach(page => {
        page.classList.add('hidden');
    });
    const target = document.getElementById(pageId);
    if (target) {
        target.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        target.classList.remove('page-enter');
        void target.offsetWidth;
        target.classList.add('page-enter');
    }
}

function createDictionary() {
    const name = document.getElementById('dict-name').value.trim() || '我的情绪词典';
    
    appState.dictionaryName = name;
    saveData();
    document.getElementById('dict-name-display').textContent = name;
    showPage('page-entry');
}

function openDictionary() {
    document.getElementById('dict-name-display').textContent = appState.dictionaryName;
    renderRecentEmotions();
    showPage('page-entry');
}

function closeDictionary() {
    showHome();
}

function renameDictionary() {
    document.getElementById('home-create-mode').classList.remove('hidden');
    document.getElementById('home-open-mode').classList.add('hidden');
    document.getElementById('dict-name').value = appState.dictionaryName;
    document.getElementById('dict-name').focus();
}

function proceedToTopics() {
    const content = document.getElementById('record-content').value.trim();

    appState.lastRecord = { content };
    saveData();

    showPage('page-topics');
    showRecordPreview();
    document.querySelectorAll('.topic-tile').forEach(el => el.classList.remove('selected'));
    document.getElementById('emotions-list').innerHTML = '';
    document.getElementById('emotions-placeholder').classList.remove('hidden');
    document.getElementById('emotions-list-scroll').classList.add('hidden');
}

function showDictionaryPage() {
    showPage('page-dictionary');
    document.querySelectorAll('.pill').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === 'all') {
            btn.classList.add('active');
        }
    });
    setTimeout(() => {
        renderDictionary('all');
    }, 50);
}

function showRecordPreview() {
    const preview = document.getElementById('topics-record-preview');
    if (!preview) return;
    const text = document.getElementById('topics-record-text');
    if (appState.lastRecord.content) {
        preview.classList.remove('hidden');
        text.textContent = appState.lastRecord.content;
    } else {
        preview.classList.add('hidden');
    }
}

function renderEmotionsList(list) {
    const container = document.getElementById('emotions-list');
    container.innerHTML = '';
    
    if (list.length === 0) {
        container.innerHTML = '<div class="text-warm py-4 col-span-full text-center opacity-50 text-sm">该主题下暂无情绪词汇</div>';
        return;
    }
    
    list.forEach(emotion => {
        const status = getEmotionStatus(emotion.id);
        const dotClass = getDotClass(status);
        let firstSentence = emotion.public_def.split('。')[0];
        if (firstSentence.startsWith(emotion.name)) {
            firstSentence = firstSentence.substring(emotion.name.length).replace(/[：:]/, '').trim();
        }
        if (!firstSentence.endsWith('。')) {
            firstSentence += '。';
        }
        
        const div = document.createElement('div');
        div.className = 'surface rounded-2xl p-4 cursor-pointer emotion-card';
        div.onclick = () => openEmotionDetail(emotion.id);
        div.innerHTML = `
            <div class="flex items-center justify-between mb-1.5">
                <h4 class="font-serif font-medium text-sm text-ink">${emotion.name}</h4>
                <span class="dot ${dotClass}"></span>
            </div>
            <p class="text-xs text-soft leading-relaxed">${firstSentence}</p>
        `;
        container.appendChild(div);
    });
}

function filterEmotions(topic) {
    document.querySelectorAll('.topic-tile').forEach(el => el.classList.remove('selected'));
    const activeTopic = document.getElementById('topic-' + topic);
    if (activeTopic) activeTopic.classList.add('selected');

    document.getElementById('emotions-placeholder').classList.add('hidden');
    document.getElementById('emotions-list-scroll').classList.remove('hidden');

    const filtered = emotions.filter(e => {
        if (e.topic === topic) return true;
        if (e.related_topics && e.related_topics.includes(topic)) return true;
        return false;
    });
    renderEmotionsList(filtered);
}

function getEmotionStatus(id) {
    const userEmotion = appState.userEmotions[id];
    if (!userEmotion) return 'unexplored';
    if (userEmotion.selfDefinition) return 'constructed';
    if (userEmotion.records && userEmotion.records.length > 0) return 'recorded';
    return 'learned';
}

function getDotClass(status) {
    switch(status) {
        case 'unexplored': return 'dot-unexplored';
        case 'learned': return 'dot-learned';
        case 'recorded': return 'dot-recorded';
        case 'constructed': return 'dot-constructed';
        default: return 'dot-unexplored';
    }
}

function getStatusLabel(status) {
    switch(status) {
        case 'unexplored': return '未探索';
        case 'learned': return '探索中';
        case 'recorded': return '体验中';
        case 'constructed': return '已定义';
        default: return '未探索';
    }
}

function toggleLeftPanel() {
    const leftPanel = document.getElementById('left-panel');
    const toggleBtn = document.getElementById('panel-toggle-btn');
    const rightPanel = document.getElementById('right-panel');
    const icon = toggleBtn.querySelector('svg');
    
    if (leftPanel.classList.contains('collapsed')) {
        leftPanel.classList.remove('collapsed');
        leftPanel.style.width = '50%';
        rightPanel.style.overflowX = 'auto';
        icon.style.transform = 'rotate(0deg)';
    } else {
        leftPanel.classList.add('collapsed');
        leftPanel.style.width = '0';
        rightPanel.style.overflowX = 'hidden';
        icon.style.transform = 'rotate(180deg)';
    }
}

function openEmotionDetail(id) {
    appState.currentEmotionId = id;
    appState.previousPage = document.querySelector('[id^="page-"]:not(.hidden)').id;

    const emotion = emotions.find(e => e.id === id);
    const userEmotion = appState.userEmotions[id] || {};

    document.getElementById('emotion-name').textContent = emotion.name;
    document.getElementById('emotion-public-def').textContent = emotion.public_def;
    document.getElementById('emotion-context').textContent = emotion.context;
    document.getElementById('emotion-body').textContent = emotion.body;

    renderConfusion(emotion.confusion);

    // 填充自我定义
    document.getElementById('self-definition').value = userEmotion.selfDefinition || '';

    // 渲染记录（单条）
    renderRecords(userEmotion, appState.lastRecord.content);

    if (!appState.userEmotions[id]) {
        appState.userEmotions[id] = { learnedAt: new Date().toISOString() };
        saveData();
    }

    showPage('page-emotion-detail');
}

// 渲染记录（单条）
function renderRecords(userEmotion, lastRecordContent) {
    const container = document.getElementById('records-container');
    container.innerHTML = '';

    const savedRecords = userEmotion.records || [];
    let data = {};

    if (savedRecords.length > 0) {
        data = savedRecords[0];
    } else if (lastRecordContent) {
        data = { event: lastRecordContent };
    }

    const item = createRecordItem(data);
    container.appendChild(item);
}

// 从模板创建一条记录元素，并填充数据
function createRecordItem(data) {
    const template = document.getElementById('record-template');
    const clone = template.content.cloneNode(true);
    const item = clone.querySelector('.record-item');

    item.querySelector('.record-event').value = data.event || '';
    item.querySelector('.record-body').value = data.body || '';
    item.querySelector('.record-expectation').value = data.expectation || '';
    item.querySelector('.record-color').value = data.color || '';
    item.querySelector('.record-metaphor').value = data.metaphor || '';

    // 持续时间标签选中态
    if (data.duration) {
        item.querySelectorAll('.duration-tag').forEach(btn => {
            if (btn.dataset.value === data.duration) {
                btn.classList.add('duration-active');
            }
        });
    }
    // 颜色意象直接填充文本
    if (data.color) {
        item.querySelector('.record-color').value = data.color;
    }

    return item;
}

// 选择持续时间标签
function selectDurationTag(btn) {
    const item = btn.closest('.record-item');
    item.querySelectorAll('.duration-tag').forEach(b => b.classList.remove('duration-active'));
    btn.classList.add('duration-active');
}

// 选择颜色色块
function selectColorSwatch(btn) {
    const item = btn.closest('.record-item');
    item.querySelectorAll('.color-swatch').forEach(b => b.style.borderColor = 'transparent');
    btn.style.borderColor = 'var(--sage)';
    item.querySelector('.record-color').value = btn.dataset.value;
}

function renderConfusion(confusionText) {
    const container = document.getElementById('emotion-confusion');
    if (!container) return;

    container.innerHTML = '';

    // 新格式：词A vs 词B：词A：描述A。词B：描述B。；词C vs 词D：词C：描述C。词D：描述D。
    const pairStrings = confusionText.split('；').filter(s => s.trim());

    for (const pairStr of pairStrings) {
        const trimmed = pairStr.trim();
        if (!trimmed.includes(' vs ')) continue;

        // 提取词A
        const vsIdx = trimmed.indexOf(' vs ');
        const wordA = trimmed.substring(0, vsIdx).trim();

        // vs 之后：词B：词A：描述A。词B：描述B。
        const afterVs = trimmed.substring(vsIdx + 4);
        const firstColonIdx = afterVs.indexOf('：');
        if (firstColonIdx === -1) continue;
        const wordB = afterVs.substring(0, firstColonIdx).trim();

        // 描述部分：词A：描述A。词B：描述B。
        const rest = afterVs.substring(firstColonIdx + 1);
        const wordAColon = wordA + '：';
        const wordBColon = wordB + '：';

        let descA = '';
        let descB = '';

        if (rest.startsWith(wordAColon)) {
            const afterLabelA = rest.substring(wordAColon.length);
            // 用 "。词B：" 分割描述A和描述B
            const separator = '。' + wordBColon;
            const sepIdx = afterLabelA.indexOf(separator);
            if (sepIdx !== -1) {
                descA = afterLabelA.substring(0, sepIdx);
                descB = afterLabelA.substring(sepIdx + separator.length);
                if (descB.endsWith('。')) descB = descB.slice(0, -1);
            } else {
                // 兜底：尝试用词B：分割
                const bIdx = afterLabelA.indexOf(wordBColon);
                if (bIdx !== -1) {
                    descA = afterLabelA.substring(0, bIdx);
                    if (descA.endsWith('。')) descA = descA.slice(0, -1);
                    descB = afterLabelA.substring(bIdx + wordBColon.length);
                    if (descB.endsWith('。')) descB = descB.slice(0, -1);
                } else {
                    descA = afterLabelA.replace(/[。！]$/, '');
                }
            }
        }

        const div = document.createElement('div');
        div.className = 'p-3 rounded-xl border border-sage-light/20 bg-sage/[0.03] space-y-2';
        div.innerHTML = `
            <p class="text-xs font-medium text-sage">${wordA} <span class="text-soft mx-1">vs</span> ${wordB}</p>
            <div class="space-y-1.5">
                <p class="text-xs text-warm leading-relaxed"><span class="text-sage-deep font-medium">${wordA}：</span>${descA}</p>
                <p class="text-xs text-warm leading-relaxed"><span class="text-sage-deep font-medium">${wordB}：</span>${descB}</p>
            </div>
        `;
        container.appendChild(div);
    }
}

function goBackFromDetail() {
    showPage(appState.previousPage);
    if (appState.previousPage === 'page-dictionary') {
        renderDictionary('all');
    }
}

// 仅保存体验记录
function saveRecordsOnly() {
    const id = appState.currentEmotionId;
    if (!id) return;

    const records = collectRecords();

    if (records.length === 0) {
        alert('请先填写至少一条体验记录');
        return;
    }

    if (!appState.userEmotions[id]) {
        appState.userEmotions[id] = {};
    }

    appState.userEmotions[id].records = records;
    appState.lastRecord = { content: '' };
    saveData();

    alert('体验已保存');
}

// 收集所有记录
function collectRecords() {
    const container = document.getElementById('records-container');
    if (!container) return [];
    const recordItems = container.querySelectorAll('.record-item');
    const records = [];

    recordItems.forEach(item => {
        const eventEl = item.querySelector('.record-event');
        const bodyEl = item.querySelector('.record-body');
        const expectationEl = item.querySelector('.record-expectation');
        const colorEl = item.querySelector('.record-color');
        const metaphorEl = item.querySelector('.record-metaphor');
        
        const event = eventEl ? eventEl.value.trim() : '';
        const body = bodyEl ? bodyEl.value.trim() : '';
        const expectation = expectationEl ? expectationEl.value.trim() : '';
        const color = colorEl ? colorEl.value.trim() : '';
        const metaphor = metaphorEl ? metaphorEl.value.trim() : '';
        const activeDuration = item.querySelector('.duration-tag.duration-active');
        const duration = activeDuration ? activeDuration.dataset.value : '';

        // 只保存有内容的记录
        if (event || body || expectation || color || metaphor || duration) {
            records.push({ event, body, duration, expectation, color, metaphor });
        }
    });

    return records;
}

function saveEmotion() {
    const id = appState.currentEmotionId;
    if (!id) return;

    const selfDefinitionEl = document.getElementById('self-definition');
    if (!selfDefinitionEl) return;
    const selfDefinition = selfDefinitionEl.value.trim();

    if (!selfDefinition) {
        alert('请先写下你的定义');
        return;
    }

    const records = collectRecords();

    if (!appState.userEmotions[id]) {
        appState.userEmotions[id] = {};
    }

    if (records.length > 0) {
        appState.userEmotions[id].records = records;
    }
    appState.userEmotions[id].selfDefinition = selfDefinition;

    appState.lastRecord = { content: '' };
    saveData();

    alert('保存成功！');
}

function renderRecentEmotions() {
    const container = document.getElementById('recent-emotions');
    const sorted = Object.keys(appState.userEmotions)
        .map(id => ({ id: parseInt(id), ...appState.userEmotions[id] }))
        .sort((a, b) => new Date(b.learnedAt || 0) - new Date(a.learnedAt || 0))
        .slice(0, 8);
    
    if (sorted.length === 0) {
        container.innerHTML = '<div class="text-warm text-sm py-2 opacity-50">还没有探索过任何情绪</div>';
        return;
    }
    
    container.innerHTML = '';
    sorted.forEach(item => {
        const emotion = emotions.find(e => e.id === item.id);
        const status = getEmotionStatus(item.id);
        const dotClass = getDotClass(status);
        
        const div = document.createElement('div');
        div.className = 'surface-warm rounded-xl px-4 py-2.5 cursor-pointer flex items-center gap-2.5 text-sm';
        div.onclick = () => openEmotionDetail(item.id);
        div.innerHTML = `
            <span class="dot ${dotClass}"></span>
            <span class="text-ink">${emotion?.name || '未知情绪'}</span>
        `;
        container.appendChild(div);
    });
}

function renderDictionary(filter = 'all') {
    const container = document.getElementById('dictionary-grid');
    container.innerHTML = '';
    
    let filteredEmotions = emotions;
    if (filter !== 'all') {
        filteredEmotions = emotions.filter(e => getEmotionStatus(e.id) === filter);
    }
    
    if (filteredEmotions.length === 0) {
        container.innerHTML = '<div class="text-warm py-8 col-span-full text-center opacity-50 text-sm">暂无符合条件的情绪词汇</div>';
        return;
    }
    
    filteredEmotions.forEach(emotion => {
        const status = getEmotionStatus(emotion.id);
        const dotClass = getDotClass(status);
        let firstSentence = emotion.public_def.split('。')[0];
        if (!firstSentence.endsWith('。')) {
            firstSentence += '。';
        }
        
        const div = document.createElement('div');
        div.className = 'surface rounded-2xl p-4 cursor-pointer h-36 flex flex-col justify-between';
        div.onclick = () => openEmotionDetail(emotion.id);
        div.innerHTML = `
            <div>
                <div class="flex items-center justify-between mb-1.5">
                    <h4 class="font-serif font-medium text-sm text-ink">${emotion.name}</h4>
                    <span class="dot ${dotClass}"></span>
                </div>
                <p class="text-xs text-soft leading-relaxed line-clamp-2">${firstSentence}</p>
            </div>
            <span class="text-soft text-xs">${getStatusLabel(status)}</span>
        `;
        container.appendChild(div);
    });
}

function filterDictionary(status) {
    document.querySelectorAll('.pill').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === status) {
            btn.classList.add('active');
        }
    });
    renderDictionary(status);
}

function filterDictionaryByLetter(letter) {
    const container = document.getElementById('dictionary-grid');
    container.innerHTML = '';
    
    const filtered = emotions.filter(e => {
        const firstChar = e.name.charAt(0);
        const pinyinMap = {
            'A': ['爱', '安'], 'B': ['悲', '被', '不'], 'C': ['惭', '刺'],
            'D': ['担', '当', '对', '动'], 'F': ['烦', '愤', '附'],
            'G': ['孤', '顾'], 'H': ['害', '后', '悔', '荒', '欢', '好'],
            'J': ['焦', '紧', '沮', '绝'], 'K': ['恐', '困'],
            'L': ['累', '冷', '泪', '离', '乐', '冷'],
            'M': ['麻', '忙', '迷', '闷'], 'N': ['难', '怒', '内'],
            'P': ['平', '拼', '疲'], 'Q': ['期', '气', '轻', '情'],
            'R': ['热', '柔'], 'S': ['伤', '失', '舍', '酸', '松', '思'],
            'T': ['疼', '颓', '痛', '甜'], 'W': ['无', '忘', '危'],
            'X': ['喜', '希', '惜', '兴', '信', '心', '羞'],
            'Y': ['厌', '仰', '愉', '忧', '遥', '勇'],
            'Z': ['赞', '自', '自', '尊', '追', '转']
        };
        const chars = pinyinMap[letter] || [];
        return chars.includes(firstChar);
    });
    
    if (filtered.length === 0) {
        container.innerHTML = `<div class="text-warm py-8 col-span-full text-center opacity-50 text-sm">${letter}开头的情绪词汇暂无</div>`;
        return;
    }
    
    filtered.forEach(emotion => {
        const status = getEmotionStatus(emotion.id);
        const dotClass = getDotClass(status);
        let firstSentence = emotion.public_def.split('。')[0];
        if (!firstSentence.endsWith('。')) {
            firstSentence += '。';
        }
        
        const div = document.createElement('div');
        div.className = 'surface rounded-2xl p-4 cursor-pointer';
        div.onclick = () => openEmotionDetail(emotion.id);
        div.innerHTML = `
            <div class="flex items-center justify-between mb-1.5">
                <h4 class="font-serif font-medium text-sm text-ink">${emotion.name}</h4>
                <span class="dot ${dotClass}"></span>
            </div>
            <p class="text-xs text-soft leading-relaxed line-clamp-2 mb-2">${firstSentence}</p>
            <span class="text-soft text-xs">${getStatusLabel(status)}</span>
        `;
        container.appendChild(div);
    });
}

// 下载项目文件
async function downloadProject() {
    try {
        const zip = new JSZip();

        // 获取当前页面的HTML
        const htmlResp = await fetch(window.location.href);
        const htmlText = await htmlResp.text();
        zip.file('index.html', htmlText);

        // 获取 app.js
        const jsResp = await fetch('js/app.js');
        const jsText = await jsResp.text();
        zip.file('js/app.js', jsText);

        // 获取 emotions.js
        const dataResp = await fetch('data/emotions.js');
        const dataText = await dataResp.text();
        zip.file('data/emotions.js', dataText);

        // 生成zip并下载
        const blob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'MoodLex.zip';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (e) {
        alert('下载失败：' + e.message);
    }
}

document.addEventListener('DOMContentLoaded', init);