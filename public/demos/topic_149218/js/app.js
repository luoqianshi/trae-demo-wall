/* ========================================================
   语析 EnglishLab — Web DEMO 主程序
   负责路由、页面渲染、事件处理与语音朗读
   ======================================================== */

// 当前路由与临时状态
let currentRoute = '';
let quizState = { items: [], currentIndex: 0, materialId: null, answered: false };
let wordTapState = { materialId: null, sentenceIndex: 0, wordIndex: 0, words: [] };
let selectedWordPopup = null;

// 图标 SVG 集合
const ICONS = {
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    speaker: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
    analysis: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    arrowRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>',
    empty: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18v-6"/><line x1="8" y1="15l4-3 4 3"/></svg>'
};

/*
 * 初始化应用：绑定路由事件并渲染首页
 */
document.addEventListener('DOMContentLoaded', () => {
    window.addEventListener('hashchange', handleRoute);
    handleRoute();
});

/*
 * 路由处理器：解析 hash 并渲染对应页面
 */
function handleRoute() {
    const hash = window.location.hash || '#/materials';
    currentRoute = hash;
    const [path, query] = hash.slice(1).split('?');
    const parts = path.split('/').filter(Boolean);
    const params = parseQuery(query);

    const container = document.getElementById('page-container');
    const tabBar = document.getElementById('tab-bar');

    // 根据页面类型决定是否显示底部 Tab
    const tabPages = ['materials', 'vocabulary', 'quiz', 'settings'];
    const showTab = parts.length > 0 && tabPages.includes(parts[0]) && parts.length === 1;
    tabBar.classList.toggle('hidden', !showTab);
    updateTabActiveState(parts[0]);

    // 页面分发
    let html = '';
    switch (parts[0]) {
        case 'materials':
            html = renderMaterialsPage();
            break;
        case 'import':
            html = renderImportPage();
            break;
        case 'reader':
            html = renderReaderPage(parts[1]);
            break;
        case 'analysis':
            html = renderAnalysisPage(parts[1], parseInt(parts[2], 10));
            break;
        case 'wordtap':
            html = renderWordTapPage(parts[1], parseInt(parts[2], 10));
            break;
        case 'vocabulary':
            html = renderVocabularyPage(params.filter);
            break;
        case 'word':
            html = renderWordDetailPage(decodeURIComponent(parts[1] || ''));
            break;
        case 'quiz':
            html = renderQuizPage(params.materialId);
            break;
        case 'settings':
            html = renderSettingsPage();
            break;
        default:
            window.location.hash = '#/materials';
            return;
    }

    container.innerHTML = html;
    bindPageEvents(parts[0], params);
}

/*
 * 解析 URL 查询参数
 */
function parseQuery(query) {
    const params = {};
    if (!query) return params;
    query.split('&').forEach(pair => {
        const [key, value] = pair.split('=');
        params[key] = decodeURIComponent(value || '');
    });
    return params;
}

/*
 * 更新底部 Tab 激活状态
 */
function updateTabActiveState(activeTab) {
    document.querySelectorAll('.tab-item').forEach(item => {
        item.classList.toggle('active', item.dataset.tab === activeTab);
    });
}

/*
 * 页面顶部导航栏
 */
function renderHeader(title, options = {}) {
    const left = options.back !== false
        ? `<a href="${options.backUrl || 'javascript:history.back()'}" class="page-header-btn">${ICONS.back}</a>`
        : '<div class="page-header-btn"></div>';
    const right = options.right
        ? `<a href="${options.rightUrl || '#'}" class="page-header-btn ${options.rightClass || ''}">${options.right}</a>`
        : '<div class="page-header-btn"></div>';
    return `<div class="page-header">${left}<div class="page-header-title">${title}</div>${right}</div>`;
}

/*
 * 提示消息
 */
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
}

/*
 * 朗读文本（使用 Web Speech API，受浏览器支持限制）
 */
function speakText(text) {
    if (!AppState.settings.ttsEnabled) {
        showToast('语音朗读已关闭');
        return;
    }
    if (!window.speechSynthesis) {
        showToast('当前浏览器不支持语音朗读');
        return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = AppState.settings.accent;
    utter.rate = 0.9;
    window.speechSynthesis.speak(utter);
}

/* ========================================================
   材料库页面
   ======================================================== */
function renderMaterialsPage() {
    const materials = AppState.materials;
    let listHtml = '';
    if (materials.length === 0) {
        listHtml = renderEmptyState('暂无学习材料', '点击下方 + 导入第一篇材料');
    } else {
        listHtml = '<div class="material-list">' + materials.map(m => {
            const doneCount = m.sentences.filter(s => s.status === 'done').length;
            const progress = Math.round((doneCount / m.sentences.length) * 100);
            return `
                <a href="#/reader/${m.id}" class="material-card">
                    <div class="material-card-title">
                        ${m.title}
                        <span class="tag tag-primary">${m.difficulty}</span>
                    </div>
                    <div class="material-card-meta">${m.sentences.length} 句 · ${doneCount} 句已学</div>
                    <div class="material-progress">
                        <div class="progress-track"><div class="progress-fill" style="width:${progress}%"></div></div>
                        <span class="progress-text">${progress}%</span>
                    </div>
                </a>
            `;
        }).join('') + '</div>';
    }

    return `
        <div class="page">
            ${renderHeader('材料库')}
            ${listHtml}
            <a href="#/import" class="fab">${ICONS.plus}</a>
        </div>
    `;
}

/* ========================================================
   导入材料页面
   ======================================================== */
function renderImportPage() {
    return `
        <div class="page no-tab">
            ${renderHeader('导入材料', { backUrl: '#/materials' })}
            <div class="card">
                <div class="card-title">选择导入方式</div>
                <div class="import-methods">
                    <div class="import-method active" data-method="text">
                        ${ICONS.book}
                        <div class="import-method-title">文本粘贴</div>
                        <div class="import-method-desc">直接输入英文文本</div>
                    </div>
                    <div class="import-method" data-method="pdf" onclick="showToast('DEMO 仅支持文本粘贴')">
                        ${ICONS.book}
                        <div class="import-method-title">PDF 文件</div>
                        <div class="import-method-desc">后续版本支持</div>
                    </div>
                    <div class="import-method" data-method="url" onclick="showToast('DEMO 仅支持文本粘贴')">
                        ${ICONS.book}
                        <div class="import-method-title">网页链接</div>
                        <div class="import-method-desc">后续版本支持</div>
                    </div>
                    <div class="import-method" data-method="ocr" onclick="showToast('DEMO 仅支持文本粘贴')">
                        ${ICONS.book}
                        <div class="import-method-title">拍照 OCR</div>
                        <div class="import-method-desc">后续版本支持</div>
                    </div>
                </div>
            </div>
            <div class="card">
                <div class="card-title">材料标题</div>
                <input id="import-title" class="input" placeholder="例如：BBC News" value="My New Material">
            </div>
            <div class="card">
                <div class="card-title">英文原文</div>
                <textarea id="import-text" class="textarea" placeholder="在此粘贴或输入英文段落，系统会自动分句...">Reading books opens the door to knowledge. A good book can change your perspective.</textarea>
            </div>
            <button id="btn-import" class="btn btn-primary btn-block">开始导入</button>
        </div>
    `;
}

/* ========================================================
   阅读器页面
   ======================================================== */
function renderReaderPage(materialId) {
    const material = AppState.materials.find(m => m.id === materialId);
    if (!material) return renderNotFound();

    const doneCount = material.sentences.filter(s => s.status === 'done').length;
    const progress = Math.round((doneCount / material.sentences.length) * 100);

    const sentencesHtml = material.sentences.map((sentence, index) => {
        const statusClass = sentence.status === 'done' ? 'done' : (sentence.status === 'current' ? 'current' : '');
        const textClass = sentence.status === 'done' ? 'sentence-text-done' : '';
        return `
            <div class="sentence-card ${statusClass}" data-index="${index}">
                <div class="sentence-card-inner">
                    <div class="sentence-header">
                        <span class="sentence-number">#${index + 1}</span>
                        ${sentence.status === 'done' ? `<span class="sentence-check">${ICONS.check}</span>` : ''}
                    </div>
                    <p class="sentence-text ${textClass}">${renderClickableWords(sentence.text)}</p>
                    <div class="sentence-actions">
                        <a href="#/analysis/${materialId}/${index}" class="action-btn action-btn-primary">${ICONS.analysis}<span>分析</span></a>
                        <a href="#/wordtap/${materialId}/${index}" class="action-btn">${ICONS.book}<span>点读</span></a>
                        <button class="action-btn btn-speak" data-text="${escapeAttr(sentence.text)}">${ICONS.speaker}</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    return `
        <div class="page no-tab">
            ${renderHeader(material.title, { backUrl: '#/materials', right: ICONS.plus, rightUrl: `#/quiz?materialId=${materialId}`, rightClass: 'primary' })}
            <div class="reader-info">
                <div class="reader-info-title">${material.title} <span class="tag tag-primary">${material.difficulty}</span></div>
                <div class="material-progress">
                    <div class="progress-track"><div class="progress-fill" style="width:${progress}%"></div></div>
                    <span class="progress-text">${doneCount} / ${material.sentences.length} 句</span>
                </div>
            </div>
            <div class="sentence-list">${sentencesHtml}</div>
            <div id="reader-word-popup" class="word-popup"></div>
        </div>
    `;
}

/*
 * 将句子中的单词渲染为可点击元素
 */
function renderClickableWords(text) {
    return text.split(/(\s+)/).map(token => {
        const word = token.replace(/[^a-zA-Z0-9'-]/g, '');
        if (word.length === 0) return escapeHtml(token);
        return `<span class="clickable-word" data-word="${escapeAttr(word)}">${escapeHtml(token)}</span>`;
    }).join('');
}

/* ========================================================
   语法分析页面
   ======================================================== */
function renderAnalysisPage(materialId, sentenceIndex) {
    const material = AppState.materials.find(m => m.id === materialId);
    if (!material) return renderNotFound();
    const sentence = material.sentences[sentenceIndex];
    if (!sentence) return renderNotFound();

    // 若未预置分析结果，则基于内置词典做简单规则标注
    let analysis = sentence.analysis && sentence.analysis.length > 0
        ? sentence.analysis
        : generateSimpleAnalysis(sentence.text);

    const tokensHtml = analysis.map(item => {
        const role = ROLE_MAP[item.role] || ROLE_MAP.subject;
        return `
            <div class="word-token ${role.colorClass}" data-word="${escapeAttr(item.word)}" title="${escapeAttr(item.explain)}">
                <span class="word-token-label">${role.label}</span>
                <span class="word-token-text">${escapeHtml(item.word)}</span>
            </div>
        `;
    }).join('');

    // 构建简化结构树
    const groups = {};
    analysis.forEach(item => {
        if (!groups[item.role]) groups[item.role] = [];
        groups[item.role].push(item.word);
    });
    const treeLeaves = Object.keys(groups).map(role => {
        const roleInfo = ROLE_MAP[role] || ROLE_MAP.subject;
        return `<span class="tree-leaf ${roleInfo.colorClass}">${roleInfo.label}：${groups[role].join(' ')}</span>`;
    }).join('');

    return `
        <div class="page no-tab">
            ${renderHeader('语法分析', { backUrl: `#/reader/${materialId}` })}
            <div class="analysis-sentence">
                <div class="analysis-sentence-text">${tokensHtml}</div>
            </div>
            <div class="analysis-tree">
                <div class="card-title">句子结构</div>
                <div class="tree-node">
                    <div class="tree-node-label">句子</div>
                    <div class="tree-children">${treeLeaves}</div>
                </div>
            </div>
            <div class="analysis-translation">
                <strong>参考译文：</strong><br>
                ${escapeHtml(translateDemo(sentence.text))}
            </div>
            <div class="analysis-actions">
                <button class="btn btn-primary" id="btn-speak-sentence">${ICONS.speaker} 整句朗读</button>
                <a href="#/wordtap/${materialId}/${sentenceIndex}" class="btn btn-secondary">${ICONS.book} 单词点读</a>
            </div>
            <button class="btn btn-outline btn-block" id="btn-mark-done">标记为已学</button>
            <div id="analysis-word-popup" class="word-popup"></div>
        </div>
    `;
}

/*
 * 简单规则分析：基于词性标注生成主谓宾等角色
 */
function generateSimpleAnalysis(text) {
    const words = text.replace(/[.,;:!?()]/g, '').split(/\s+/).filter(w => w.length > 0);
    return words.map((word, index, arr) => {
        const lower = word.toLowerCase();
        let role = 'subject';
        let explain = '名词，可能为主语';

        // 极简化规则，仅用于 DEMO 展示
        if (index === 0) { role = 'subject'; explain = '句首名词/代词，通常为主语'; }
        else if (/^(is|are|was|were|am|be|been|being|can|could|will|would|shall|should|may|might|must|has|have|had|do|does|did|jumps|runs|eats|sleeps|opens|improves|consolidates|impairs)$/i.test(lower)) {
            role = 'predicate';
            explain = '动词/助动词，作谓语';
        }
        else if (/^(the|a|an|this|that|these|those|my|your|his|her|its|our|their)$/i.test(lower)) {
            role = 'attributive';
            explain = '限定词/形容词，作定语';
        }
        else if (/^(quick|brown|lazy|healthy|human|cognitive|essential|good)$/i.test(lower)) {
            role = 'attributive';
            explain = '形容词，作定语';
        }
        else if (/^(over|during|in|on|at|for|with|to|from|by)$/i.test(lower)) {
            role = 'adverbial';
            explain = '介词，与宾语构成状语';
        }
        else if (index === arr.length - 1 && !/^(over|during|in|on|at|for|with|to|from|by)$/i.test(arr[index - 1]?.toLowerCase())) {
            role = 'object';
            explain = '句末名词，可能为宾语';
        }
        else if (index > 0 && /^(over|during|in|on|at|for|with|to|from|by)$/i.test(arr[index - 1].toLowerCase())) {
            role = 'object';
            explain = '介词宾语';
        }

        return { word, role, explain };
    });
}

/*
 * DEMO 翻译：简单 mock，实际应由 AI 提供
 */
function translateDemo(text) {
    const map = {
        'Sleep is essential for human health and well-being.': '睡眠对人类健康与幸福至关重要。',
        'During sleep, the brain consolidates memories.': '在睡眠期间，大脑会巩固记忆。',
        'Sleep deprivation can impair cognitive function.': '睡眠不足会损害认知功能。',
        'A healthy sleep schedule improves focus and mood.': '健康的睡眠时间表能改善专注力和情绪。',
        'The quick brown fox jumps over the lazy dog.': '那只敏捷的棕色狐狸跳过了那只懒惰的狗。',
        'Reading books opens the door to knowledge.': '阅读打开知识的大门。',
        'A good book can change your perspective.': '一本好书可以改变你的视角。'
    };
    return map[text] || '（DEMO 翻译占位）' + text;
}

/* ========================================================
   单词点读页面
   ======================================================== */
function renderWordTapPage(materialId, sentenceIndex) {
    const material = AppState.materials.find(m => m.id === materialId);
    if (!material) return renderNotFound();
    const sentence = material.sentences[sentenceIndex];
    if (!sentence) return renderNotFound();

    wordTapState.materialId = materialId;
    wordTapState.sentenceIndex = sentenceIndex;
    wordTapState.words = sentence.text.replace(/[.,;:!?()]/g, '').split(/\s+/).filter(w => w.length > 0);
    wordTapState.wordIndex = 0;

    return `
        <div class="page no-tab">
            ${renderHeader('单词点读', { backUrl: `#/reader/${materialId}` })}
            <div class="card">
                <div style="font-size:14px;color:var(--color-text-secondary);margin-bottom:8px;">原句</div>
                <div style="font-size:15px;line-height:1.7;">${escapeHtml(sentence.text)}</div>
            </div>
            <div class="wordtap-indicators" id="wordtap-indicators"></div>
            <div id="wordtap-card" class="wordtap-card"></div>
            <div class="analysis-actions">
                <button class="btn btn-outline" id="btn-wordtap-prev">上一个</button>
                <button class="btn btn-primary" id="btn-wordtap-next">下一个</button>
            </div>
            <button class="btn btn-secondary btn-block" id="btn-add-to-vocab" style="margin-top:12px;">加入单词本</button>
        </div>
    `;
}

/*
 * 渲染单词点读卡片
 */
function renderWordTapCard() {
    const words = wordTapState.words;
    const index = wordTapState.wordIndex;
    const currentWord = words[index];
    const dict = lookupWord(currentWord);
    const material = AppState.materials.find(m => m.id === wordTapState.materialId);
    const sentence = material.sentences[wordTapState.sentenceIndex];

    // 更新指示器
    const indicators = document.getElementById('wordtap-indicators');
    if (indicators) {
        indicators.innerHTML = words.map((_, i) => `<div class="wordtap-dot ${i < index ? 'done' : ''} ${i === index ? 'current' : ''}"></div>`).join('');
    }

    const card = document.getElementById('wordtap-card');
    if (card) {
        card.innerHTML = `
            <div class="wordtap-word">${escapeHtml(currentWord)}</div>
            <div class="wordtap-phonetic">${dict.phonetic || ''}</div>
            <div class="wordtap-meaning">${dict.meaning}</div>
            <div class="wordtap-context">${escapeHtml(sentence.text)}</div>
            <div class="wordtap-actions">
                <button class="wordtap-btn btn-primary" id="btn-wordtap-speak">${ICONS.speaker}</button>
            </div>
        `;
        document.getElementById('btn-wordtap-speak').addEventListener('click', () => speakText(currentWord));
    }
}

/* ========================================================
   单词本页面
   ======================================================== */
function renderVocabularyPage(activeFilter) {
    activeFilter = activeFilter || 'all';
    let list = AppState.vocabulary;

    // 按熟练度筛选
    if (activeFilter !== 'all') {
        list = list.filter(v => v.proficiency === activeFilter);
    }

    const stats = {
        all: AppState.vocabulary.length,
        new: AppState.vocabulary.filter(v => v.proficiency === 'new').length,
        familiar: AppState.vocabulary.filter(v => v.proficiency === 'familiar').length,
        mastered: AppState.vocabulary.filter(v => v.proficiency === 'mastered').length
    };

    const listHtml = list.length === 0
        ? renderEmptyState('暂无单词', '去阅读器点读单词并加入单词本')
        : '<div class="vocab-list">' + list.map(v => `
            <a href="#/word/${encodeURIComponent(v.word)}" class="vocab-item">
                <div class="vocab-item-left">
                    <div class="vocab-item-word">${escapeHtml(v.word)} <span class="tag tag-gray">${proficiencyLabel(v.proficiency)}</span></div>
                    <div class="vocab-item-meaning">${v.meaning}</div>
                    <div class="vocab-item-source">来自：${escapeHtml(getMaterialTitle(v.sourceMaterialId))}</div>
                </div>
                ${ICONS.arrowRight}
            </a>
        `).join('') + '</div>';

    return `
        <div class="page">
            ${renderHeader('单词本')}
            <div class="vocab-stats">
                <div class="vocab-stat"><div class="vocab-stat-value">${stats.all}</div><div class="vocab-stat-label">全部</div></div>
                <div class="vocab-stat"><div class="vocab-stat-value">${stats.new}</div><div class="vocab-stat-label">生疏</div></div>
                <div class="vocab-stat"><div class="vocab-stat-value">${stats.familiar}</div><div class="vocab-stat-label">熟悉</div></div>
                <div class="vocab-stat"><div class="vocab-stat-value">${stats.mastered}</div><div class="vocab-stat-label">掌握</div></div>
            </div>
            <div class="vocab-search">
                ${ICONS.search}
                <input type="text" id="vocab-search-input" class="input" placeholder="搜索单词">
            </div>
            <div class="vocab-filters">
                <a href="#/vocabulary" class="vocab-filter ${activeFilter === 'all' ? 'active' : ''}">全部</a>
                <a href="#/vocabulary?filter=new" class="vocab-filter ${activeFilter === 'new' ? 'active' : ''}">生疏</a>
                <a href="#/vocabulary?filter=familiar" class="vocab-filter ${activeFilter === 'familiar' ? 'active' : ''}">熟悉</a>
                <a href="#/vocabulary?filter=mastered" class="vocab-filter ${activeFilter === 'mastered' ? 'active' : ''}">掌握</a>
            </div>
            ${listHtml}
        </div>
    `;
}

/*
 * 熟练度中文标签
 */
function proficiencyLabel(p) {
    const labels = { new: '生疏', familiar: '熟悉', mastered: '掌握', expert: '精通' };
    return labels[p] || '生疏';
}

/*
 * 根据材料 ID 获取标题
 */
function getMaterialTitle(materialId) {
    const m = AppState.materials.find(item => item.id === materialId);
    return m ? m.title : '未知材料';
}

/* ========================================================
   单词详情页面
   ======================================================== */
function renderWordDetailPage(word) {
    const item = AppState.vocabulary.find(v => v.word === word);
    if (!item) return renderNotFound();
    const dict = lookupWord(word);

    return `
        <div class="page no-tab">
            ${renderHeader('单词详情', { backUrl: '#/vocabulary' })}
            <div class="word-detail-header">
                <div class="word-detail-word">${escapeHtml(item.word)}</div>
                <div class="word-detail-phonetic">${dict.phonetic || item.phonetic || ''}</div>
                <div class="word-detail-meaning">${dict.meaning || item.meaning}</div>
                <div class="proficiency-select">
                    ${['new', 'familiar', 'mastered'].map(p => `
                        <button class="proficiency-option ${item.proficiency === p ? 'active' : ''}" data-proficiency="${p}">${proficiencyLabel(p)}</button>
                    `).join('')}
                </div>
            </div>
            <div class="card">
                <div class="card-title">语境例句</div>
                <div style="font-size:15px;line-height:1.7;color:var(--color-text-secondary);">${escapeHtml(item.context)}</div>
            </div>
            <div class="card">
                <div class="card-title">词根词缀</div>
                <div style="font-size:15px;line-height:1.7;">${dict.root || '暂无词根词缀信息'}</div>
            </div>
            <div class="analysis-actions">
                <button class="btn btn-primary" id="btn-word-speak">${ICONS.speaker} 朗读</button>
                <a href="#/quiz?materialId=${item.sourceMaterialId}" class="btn btn-secondary">${ICONS.book} 去背诵</a>
            </div>
        </div>
    `;
}

/* ========================================================
   通关背诵页面
   ======================================================== */
function renderQuizPage(materialId) {
    if (!materialId) {
        // 从底部 Tab 进入时未指定材料，提供材料选择入口
        const listHtml = AppState.materials.length === 0
            ? renderEmptyState('暂无学习材料', '先去材料库导入一篇材料')
            : '<div class="material-list">' + AppState.materials.map(m => `
                <a href="#/quiz?materialId=${m.id}" class="material-card">
                    <div class="material-card-title">${escapeHtml(m.title)} <span class="tag tag-primary">${m.difficulty}</span></div>
                    <div class="material-card-meta">${m.sentences.length} 句 · 点击开始背诵</div>
                </a>
            `).join('') + '</div>';
        return `
            <div class="page">
                ${renderHeader('通关背诵')}
                <div class="card"><div class="card-title">选择要背诵的材料</div></div>
                ${listHtml}
            </div>
        `;
    }

    // 如果题目未初始化或材料变化，重新生成
    if (quizState.materialId !== materialId) {
        quizState.items = generateQuiz(materialId);
        quizState.currentIndex = 0;
        quizState.materialId = materialId;
        quizState.answered = false;
    }

    if (quizState.items.length === 0) {
        return `
            <div class="page no-tab">
                ${renderHeader('通关背诵', { backUrl: `#/reader/${materialId}` })}
                ${renderEmptyState('该材料句子太短', '无法生成背诵题目')}
            </div>
        `;
    }

    const current = quizState.items[quizState.currentIndex];
    const progress = Math.round(((quizState.currentIndex) / quizState.items.length) * 100);

    let contentHtml = '';
    if (current.type === 'fill') {
        contentHtml = `
            <div class="quiz-question">${escapeHtml(current.question).replace('______', '<span class="quiz-blank" id="fill-blank"></span>')}</div>
            <input type="text" id="quiz-fill-input" class="quiz-input" placeholder="请输入缺失的单词" autocomplete="off">
        `;
    } else if (current.type === 'choice') {
        contentHtml = `
            <div class="quiz-question">${escapeHtml(current.question)}</div>
            <div class="quiz-options">${current.options.map(opt => `
                <button class="quiz-option" data-answer="${escapeAttr(opt)}">${escapeHtml(opt)}</button>
            `).join('')}</div>
        `;
    } else if (current.type === 'sort') {
        contentHtml = `
            <div class="quiz-question">${escapeHtml(current.question)}</div>
            <div class="quiz-sort-answer" id="sort-answer"></div>
            <div class="quiz-sort-list" id="sort-words">${current.words.map(w => `
                <span class="quiz-sort-item" data-word="${escapeAttr(w)}">${escapeHtml(w)}</span>
            `).join('')}</div>
        `;
    }

    return `
        <div class="page no-tab">
            ${renderHeader('通关背诵', { backUrl: `#/reader/${materialId}` })}
            <div class="quiz-progress">
                <div class="progress-track"><div class="progress-fill" style="width:${progress}%"></div></div>
                <span class="quiz-progress-text">${quizState.currentIndex + 1}/${quizState.items.length}</span>
            </div>
            <div class="quiz-card" id="quiz-card">
                ${contentHtml}
                <div class="quiz-feedback" id="quiz-feedback"></div>
            </div>
            <button class="btn btn-primary btn-block" id="btn-submit-quiz">提交答案</button>
            <button class="btn btn-outline btn-block" id="btn-next-quiz" style="display:none;">下一题</button>
        </div>
    `;
}

/* ========================================================
   设置页面
   ======================================================== */
function renderSettingsPage() {
    return `
        <div class="page">
            ${renderHeader('我的')}
            <div class="stat-grid">
                <div class="stat-card"><div class="stat-card-value">${AppState.stats.analyzedSentences}</div><div class="stat-card-label">分析句数</div></div>
                <div class="stat-card"><div class="stat-card-value">${AppState.stats.learnedWords}</div><div class="stat-card-label">收录单词</div></div>
                <div class="stat-card"><div class="stat-card-value">${AppState.stats.quizCompleted}</div><div class="stat-card-label">完成题目</div></div>
                <div class="stat-card"><div class="stat-card-value">${AppState.stats.studyMinutes}</div><div class="stat-card-label">学习分钟</div></div>
            </div>
            <div class="settings-group">
                <div class="settings-group-title">AI 与语音</div>
                <div class="settings-item">
                    <span class="settings-item-label">启用 AI 语法分析</span>
                    <div class="toggle ${AppState.settings.aiEnabled ? 'on' : ''}" id="toggle-ai"></div>
                </div>
                <div class="settings-item">
                    <span class="settings-item-label">语音朗读</span>
                    <div class="toggle ${AppState.settings.ttsEnabled ? 'on' : ''}" id="toggle-tts"></div>
                </div>
                <div class="settings-item">
                    <span class="settings-item-label">发音口音</span>
                    <span class="settings-item-value">${AppState.settings.accent === 'en-US' ? '美式' : '英式'}</span>
                </div>
            </div>
            <div class="settings-group">
                <div class="settings-group-title">学习设置</div>
                <div class="settings-item">
                    <span class="settings-item-label">每日目标（题）</span>
                    <span class="settings-item-value">${AppState.settings.dailyGoal}</span>
                </div>
                <div class="settings-item">
                    <span class="settings-item-label">清除本地数据</span>
                    <span class="settings-item-action" id="btn-clear-data">${ICONS.arrowRight}</span>
                </div>
            </div>
            <div class="settings-group">
                <div class="settings-group-title">关于</div>
                <div class="settings-item">
                    <span class="settings-item-label">语析 EnglishLab DEMO</span>
                    <span class="settings-item-value">v0.1.0</span>
                </div>
                <div class="settings-item">
                    <span class="settings-item-label">说明</span>
                    <span class="settings-item-value">Web 可交互演示版</span>
                </div>
            </div>
        </div>
    `;
}

/* ========================================================
   公共 UI 组件
   ======================================================== */
function renderEmptyState(title, desc) {
    return `
        <div class="empty-state">
            ${ICONS.empty}
            <p>${title}</p>
            <span style="font-size:13px;">${desc}</span>
        </div>
    `;
}

function renderNotFound() {
    return `
        <div class="page no-tab">
            ${renderHeader('页面不存在')}
            ${renderEmptyState('页面找不到了', '返回材料库继续学习')}
            <a href="#/materials" class="btn btn-primary btn-block">返回首页</a>
        </div>
    `;
}

/*
 * HTML 转义，防止 XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function escapeAttr(text) {
    return escapeHtml(text).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* ========================================================
   事件绑定
   ======================================================== */
function bindPageEvents(page, params) {
    switch (page) {
        case 'import':
            document.getElementById('btn-import').addEventListener('click', onImport);
            break;
        case 'reader':
            bindReaderEvents();
            break;
        case 'analysis':
            bindAnalysisEvents();
            break;
        case 'wordtap':
            renderWordTapCard();
            bindWordTapEvents();
            break;
        case 'vocabulary':
            bindVocabularyEvents();
            break;
        case 'word':
            bindWordDetailEvents();
            break;
        case 'quiz':
            bindQuizEvents();
            break;
        case 'settings':
            bindSettingsEvents();
            break;
    }
}

/*
 * 导入材料事件
 */
function onImport() {
    const titleInput = document.getElementById('import-title');
    const textInput = document.getElementById('import-text');
    const title = titleInput.value.trim();
    const text = textInput.value.trim();
    if (!text) {
        showToast('请输入英文原文');
        return;
    }
    const material = addMaterial(title, text);
    showToast('导入成功');
    window.location.hash = `#/reader/${material.id}`;
}

/*
 * 阅读器事件
 */
function bindReaderEvents() {
    document.querySelectorAll('.btn-speak').forEach(btn => {
        btn.addEventListener('click', () => speakText(btn.dataset.text));
    });
    document.querySelectorAll('.clickable-word').forEach(el => {
        el.addEventListener('click', () => showWordPopup(el.dataset.word, 'reader-word-popup'));
    });
}

/*
 * 语法分析页事件
 */
function bindAnalysisEvents() {
    // 从当前 hash 路由解析 materialId 与 sentenceIndex，避免误用 wordTapState
    const materialId = currentRoute.split('/')[2];
    const sentenceIndex = parseInt(currentRoute.split('/')[3], 10);

    document.getElementById('btn-speak-sentence').addEventListener('click', () => {
        // 当前页句子文本直接从 DOM 读取，不依赖页面间状态
        const textEl = document.querySelector('.analysis-sentence-text');
        speakText(textEl ? textEl.innerText : '');
    });
    document.getElementById('btn-mark-done').addEventListener('click', () => {
        markSentenceDone(materialId, sentenceIndex);
        showToast('已标记为已学');
        window.location.hash = `#/reader/${materialId}`;
    });
    document.querySelectorAll('.word-token').forEach(el => {
        el.addEventListener('click', () => showWordPopup(el.dataset.word, 'analysis-word-popup'));
    });
}

/*
 * 显示单词浮层
 */
function showWordPopup(word, containerId) {
    const dict = lookupWord(word);
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = `
        <div class="word-popup-header">
            <div>
                <div class="word-popup-word">${escapeHtml(word)}</div>
                <div class="word-popup-phonetic">${dict.phonetic || ''}</div>
            </div>
            <button class="page-header-btn" id="btn-close-popup">${ICONS.close}</button>
        </div>
        <div class="word-popup-meaning">${dict.meaning}</div>
        <div class="word-popup-actions">
            <button class="btn btn-primary" id="btn-popup-speak">${ICONS.speaker} 朗读</button>
            <a href="#/word/${encodeURIComponent(word.toLowerCase())}" class="btn btn-secondary">查看详情</a>
        </div>
    `;
    container.classList.add('show');
    document.getElementById('btn-close-popup').addEventListener('click', () => container.classList.remove('show'));
    document.getElementById('btn-popup-speak').addEventListener('click', () => speakText(word));
}

/*
 * 单词点读页事件
 */
function bindWordTapEvents() {
    document.getElementById('btn-wordtap-prev').addEventListener('click', () => {
        if (wordTapState.wordIndex > 0) {
            wordTapState.wordIndex--;
            renderWordTapCard();
        }
    });
    document.getElementById('btn-wordtap-next').addEventListener('click', () => {
        if (wordTapState.wordIndex < wordTapState.words.length - 1) {
            wordTapState.wordIndex++;
            renderWordTapCard();
        } else {
            // 学完本句最后一个单词后，标记句子为已完成并返回阅读器
            markSentenceDone(wordTapState.materialId, wordTapState.sentenceIndex);
            showToast('已学完本句');
            window.location.hash = `#/reader/${wordTapState.materialId}`;
        }
    });
    document.getElementById('btn-add-to-vocab').addEventListener('click', () => {
        const word = wordTapState.words[wordTapState.wordIndex].toLowerCase();
        if (!AppState.vocabulary.find(v => v.word === word)) {
            const dict = lookupWord(word);
            const material = AppState.materials.find(m => m.id === wordTapState.materialId);
            const sentence = material.sentences[wordTapState.sentenceIndex];
            AppState.vocabulary.push({
                word,
                phonetic: dict.phonetic,
                meaning: dict.meaning,
                sourceMaterialId: wordTapState.materialId,
                sourceSentenceIndex: wordTapState.sentenceIndex,
                context: sentence.text,
                proficiency: 'new',
                addedAt: new Date().toISOString()
            });
            AppState.stats.learnedWords = AppState.vocabulary.length;
            saveState();
            showToast('已加入单词本');
        } else {
            showToast('单词本中已存在');
        }
    });
}

/*
 * 单词本事件
 */
function bindVocabularyEvents() {
    const input = document.getElementById('vocab-search-input');
    input.addEventListener('input', () => {
        const keyword = input.value.trim().toLowerCase();
        document.querySelectorAll('.vocab-item').forEach(item => {
            const word = item.querySelector('.vocab-item-word').innerText.toLowerCase();
            item.style.display = word.includes(keyword) ? 'flex' : 'none';
        });
    });
}

/*
 * 单词详情事件
 */
function bindWordDetailEvents() {
    const word = decodeURIComponent(currentRoute.split('/')[2] || '');
    document.getElementById('btn-word-speak').addEventListener('click', () => speakText(word));
    document.querySelectorAll('.proficiency-option').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.proficiency-option').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            setProficiency(word, btn.dataset.proficiency);
            showToast('熟练度已更新');
        });
    });
}

/*
 * 通关背诵事件
 */
function bindQuizEvents() {
    const current = quizState.items[quizState.currentIndex];
    if (!current) return;

    const submitBtn = document.getElementById('btn-submit-quiz');
    const nextBtn = document.getElementById('btn-next-quiz');
    const feedback = document.getElementById('quiz-feedback');

    if (current.type === 'choice') {
        document.querySelectorAll('.quiz-option').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.quiz-option').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                current.userAnswer = btn.dataset.answer;
            });
        });
    } else if (current.type === 'sort') {
        const sortWords = document.getElementById('sort-words');
        const sortAnswer = document.getElementById('sort-answer');
        sortWords.addEventListener('click', e => {
            const item = e.target.closest('.quiz-sort-item');
            if (!item) return;
            sortAnswer.appendChild(item);
            current.userAnswer = Array.from(sortAnswer.children).map(c => c.dataset.word).join(' ');
        });
        sortAnswer.addEventListener('click', e => {
            const item = e.target.closest('.quiz-sort-item');
            if (!item) return;
            sortWords.appendChild(item);
            current.userAnswer = Array.from(sortAnswer.children).map(c => c.dataset.word).join(' ');
        });
    }

    submitBtn.addEventListener('click', () => {
        if (quizState.answered) return;
        let userAnswer = current.userAnswer || '';
        if (current.type === 'fill') {
            userAnswer = document.getElementById('quiz-fill-input').value.trim();
            current.userAnswer = userAnswer;
        }

        const correct = normalizeAnswer(userAnswer) === normalizeAnswer(current.answer);
        quizState.answered = true;
        feedback.className = 'quiz-feedback show ' + (correct ? 'correct' : 'wrong');
        feedback.textContent = correct ? '回答正确！' : `正确答案：${current.answer}`;

        if (current.type === 'choice') {
            document.querySelectorAll('.quiz-option').forEach(btn => {
                if (normalizeAnswer(btn.dataset.answer) === normalizeAnswer(current.answer)) btn.classList.add('correct');
                else if (btn.classList.contains('selected')) btn.classList.add('wrong');
            });
        }

        if (correct) AppState.stats.quizCompleted += 1;
        saveState();

        submitBtn.style.display = 'none';
        nextBtn.style.display = 'flex';
    });

    nextBtn.addEventListener('click', () => {
        if (quizState.currentIndex < quizState.items.length - 1) {
            quizState.currentIndex++;
            quizState.answered = false;
            handleRoute();
        } else {
            showToast('恭喜完成本组背诵！');
            window.location.hash = `#/reader/${quizState.materialId}`;
        }
    });
}

/*
 * 标准化答案比较（忽略大小写与标点）
 */
function normalizeAnswer(text) {
    return text.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
}

/*
 * 更新设置项并持久化
 */
function updateSetting(key, value) {
    AppState.settings[key] = value;
    saveState();
}

/*
 * 设置页事件
 */
function bindSettingsEvents() {
    document.getElementById('toggle-ai').addEventListener('click', function() {
        AppState.settings.aiEnabled = !AppState.settings.aiEnabled;
        this.classList.toggle('on', AppState.settings.aiEnabled);
        updateSetting('aiEnabled', AppState.settings.aiEnabled);
        showToast(AppState.settings.aiEnabled ? 'AI 模式已开启（DEMO 为模拟）' : 'AI 模式已关闭');
    });
    document.getElementById('toggle-tts').addEventListener('click', function() {
        AppState.settings.ttsEnabled = !AppState.settings.ttsEnabled;
        this.classList.toggle('on', AppState.settings.ttsEnabled);
        updateSetting('ttsEnabled', AppState.settings.ttsEnabled);
        showToast(AppState.settings.ttsEnabled ? '语音朗读已开启' : '语音朗读已关闭');
    });
    document.getElementById('btn-clear-data').addEventListener('click', () => {
        if (confirm('确定要清除所有本地 DEMO 数据吗？')) {
            localStorage.removeItem('englishlab_demo_state');
            location.reload();
        }
    });
}
