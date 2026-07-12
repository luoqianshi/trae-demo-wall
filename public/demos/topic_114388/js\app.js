// app.js - 主入口：UI 渲染、事件绑定、状态管理

import { escapeHTML, genId, formatDate, formatTime, computeSlotHours } from './utils.js';
import {
    loadAll, saveSubjects, saveTimeSlots, saveSchedule, saveSettings,
    saveTheme, loadTheme, exportData, importData
} from './storage.js';
import { generateSchedule, insertRemedialItems, DEFAULT_EBBINGHAUS } from './scheduler.js';
import { textbookCategories, textbookGroups, searchTextbooks } from './textbooks.js';
import { startReminder, refreshReminderRef, requestNotificationPermission } from './reminder.js';
import { initDashboard, destroyDashboard } from './dashboard.js';
import { analyze, chatResponse, renderAIReport } from './ai-assistant.js';
import { initFocusMode } from './focus-mode.js';
import { initParticles } from './particles.js';
import { getScenarios, generateDemoData, generateCompletedSchedule } from './demo-data.js';
import { initTimeGrid, getGrid, clearAll as clearGrid, isEmpty as gridIsEmpty, renderHeatmap, renderSummary, toSegments } from './time-grid.js';
import { recommendByName, hasSubject as hasKnowledgeSubject, getAllSubjects } from './points-generator.js';
import { extractFromFile } from './extractor.js';
import { openPicker } from './points-picker.js';

/* ---------------- 状态 ---------------- */
const state = {
    subjects: [],
    timeSlots: [],
    schedule: [],
    settings: { useEbbinghaus: true },
    currentTab: 'subjects'
};

/* ---------------- DOM 引用 ---------------- */
const $ = (id) => document.getElementById(id);
const els = {
    subjectForm: $('subjectForm'),
    subjectName: $('subjectName'),
    subjectDifficulty: $('subjectDifficulty'),
    subjectPoints: $('subjectPoints'),
    subjectList: $('subjectList'),
    timeForm: $('timeForm'),
    timeStart: $('timeStart'),
    timeEnd: $('timeEnd'),
    timeFrom: $('timeFrom'),
    timeTo: $('timeTo'),
    sessionDuration: $('sessionDuration'),
    timeSlotList: $('timeSlotList'),
    curveToggle: $('curveToggle'),
    generateBtn: $('generateBtn'),
    clearBtn: $('clearBtn'),
    scheduleList: $('scheduleList'),
    statSubjects: $('statSubjects'),
    statPoints: $('statPoints'),
    statCompleted: $('statCompleted'),
    statTime: $('statTime'),
    overallProgress: $('overallProgress'),
    progressText: $('progressText'),
    toast: $('toast'),
    themeToggle: $('themeToggle'),
    exportBtn: $('exportBtn'),
    importBtn: $('importBtn'),
    importFile: $('importFile'),
    demoBtn: $('demoBtn'),
    aiAnalyzeBtn: $('aiAnalyzeBtn'),
    aiChatInput: $('aiChatInput'),
    aiChatSend: $('aiChatSend'),
    aiChatHistory: $('aiChatHistory'),
    timeInputs: $('timeInputs'),
    addTimeRow: $('addTimeRow'),
    durationBtns: document.querySelectorAll('.duration-btn'),
    viewBtns: document.querySelectorAll('.view-btn'),
    heatmapView: $('heatmapView'),
    listView: $('listView'),
    aiPointsBtn: $('aiPointsBtn'),
    uploadPointsBtn: $('uploadPointsBtn'),
    pointsFileInput: $('pointsFileInput'),
    pointsHelper: $('pointsHelper'),
    textbookPointsBtn: $('textbookPointsBtn'),
    tbModal: $('tbModal'),
    tbModalClose: $('tbModalClose'),
    tbSearchInput: $('tbSearchInput'),
    tbCategories: $('tbCategories'),
    tbSelectedPanel: $('tbSelectedPanel'),
    tbSelectedName: $('tbSelectedName'),
    tbSelectedCount: $('tbSelectedCount'),
    tbPreviewBtn: $('tbPreviewBtn'),
    tbConfirmBtn: $('tbConfirmBtn'),
    tbPreviewPanel: $('tbPreviewPanel'),
    tbPreviewList: $('tbPreviewList'),
    tbModalTitle: $('tbModalTitle'),
    tbBreadcrumb: $('tbBreadcrumb'),
    tbBreadcrumbBack: $('tbBreadcrumbBack'),
    tbBreadcrumbPath: $('tbBreadcrumbPath'),
    subjectScore: $('subjectScore'),
    curveConfigBtn: $('curveConfigBtn'),
    curveConfigPanel: $('curveConfigPanel'),
    curveConfigInputs: $('curveConfigInputs'),
    curveConfigApply: $('curveConfigApply'),
    // 进度面板
    progressPanelBody: $('progressPanelBody'),
    progressPanelToggle: $('progressPanelToggle'),
    progressRingFill: $('progressRingFill'),
    progressRingPct: $('progressRingPct'),
    progressSubjects: $('progressSubjects'),
    pscTodayTotal: $('pscTodayTotal'),
    pscTodayDone: $('pscTodayDone'),
    pscRemainDays: $('pscRemainDays'),
    // 调色面板
    colorPickerToggle: $('colorPickerToggle'),
    colorPickerBody: $('colorPickerBody'),
    colorPresets: $('colorPresets'),
    customColorInput: $('customColorInput'),
    customColorHex: $('customColorHex'),
    customGradEndInput: $('customGradEndInput'),
    customGradEndHex: $('customGradEndHex'),
    applyCustomColor: $('applyCustomColor'),
    resetDefaultColor: $('resetDefaultColor'),
    // 自我测试
    quizSubject: $('quizSubject'),
    quizSetup: $('quizSetup'),
    quizActive: $('quizActive'),
    quizResult: $('quizResult'),
    quizStartBtn: $('quizStartBtn'),
    quizProgressFill: $('quizProgressFill'),
    quizCurrentInfo: $('quizCurrentInfo'),
    quizSubjectLabel: $('quizSubjectLabel'),
    quizQuitBtn: $('quizQuitBtn'),
    quizQuestionCard: $('quizQuestionCard'),
    quizSubmitAnswer: $('quizSubmitAnswer'),
    quizNextQuestion: $('quizNextQuestion'),
    quizScoreRing: $('quizScoreRing'),
    quizScorePct: $('quizScorePct'),
    quizStatCorrect: $('quizStatCorrect'),
    quizStatWrong: $('quizStatWrong'),
    quizStatTime: $('quizStatTime'),
    quizReviewList: $('quizReviewList'),
    quizRetryBtn: $('quizRetryBtn'),
    quizBackSetupBtn: $('quizBackSetupBtn'),
    quizHistoryList: $('quizHistoryList'),
    // 讨论交流
    discSubjectList: $('discSubjectList'),
    discCurrentTitle: $('discCurrentTitle'),
    discNewPostBtn: $('discNewPostBtn'),
    discPostForm: $('discPostForm'),
    discPostTitle: $('discPostTitle'),
    discPostTag: $('discPostTag'),
    discPostContent: $('discPostContent'),
    discAuthorName: $('discAuthorName'),
    discCancelPost: $('discCancelPost'),
    discSubmitPost: $('discSubmitPost'),
    discPostsList: $('discPostsList'),
    discSortBtns: $('discSortBtns'),
    // 错题本
    wbSubjectFilter: $('wbSubjectFilter'),
    wbTotal: $('wbTotal'),
    wbMastered: $('wbMastered'),
    wbList: $('wbList'),
    wbClearAll: $('wbClearAll'),
    wbRetryAll: $('wbRetryAll'),
    // 学习笔记
    notesSubjectList: $('notesSubjectList'),
    notesCurrentTitle: $('notesCurrentTitle'),
    notesNewBtn: $('notesNewBtn'),
    notesEditor: $('notesEditor'),
    notesTitleInput: $('notesTitleInput'),
    notesContentInput: $('notesContentInput'),
    notesCancelBtn: $('notesCancelBtn'),
    notesSaveBtn: $('notesSaveBtn'),
    notesList: $('notesList'),
    // 每日打卡
    checkinBtn: $('checkinBtn'),
    checkinQuickBtn: $('checkinQuickBtn'),
    checkinQuickStreak: $('checkinQuickStreak'),
    checkinStreak: $('checkinStreak'),
    checkinDate: $('checkinDate'),
    checkinCalendar: $('checkinCalendar'),
    checkinTotalDays: $('checkinTotalDays'),
    checkinMaxStreak: $('checkinMaxStreak'),
    checkinMonthDays: $('checkinMonthDays'),
    // 成就 & 周报
    achievementList: $('achievementList'),
    weeklyReport: $('weeklyReport'),
    guideContent: $('guideContent')
};

/* ---------------- 初始化 ---------------- */
function init() {
    applyTheme(loadTheme());
    const data = loadAll();
    state.subjects = data.subjects;
    state.timeSlots = data.timeSlots;
    state.schedule = data.schedule;
    state.settings = data.settings;
    if (!Array.isArray(state.settings.ebbinghausIntervals) || state.settings.ebbinghausIntervals.length === 0) {
        state.settings.ebbinghausIntervals = DEFAULT_EBBINGHAUS;
    }

    bindTabs();
    bindSidebar();
    bindDifficulty();
    bindSubjectForm();
    bindTimeForm();
    bindPlanControls();
    bindDataIO();
    bindThemeToggle();
    bindDemoData();
    bindAIChat();
    bindPointsToolbar();
    bindProgressPanel();
    bindColorPicker();
    bindQuiz();
    bindDiscussion();
    bindWrongBook();
    bindNotes();
    bindCheckin();
    renderGuide();

    // 全局快捷键
    document.addEventListener('keydown', (e) => {
        // 输入框中不触发
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

        switch (e.key) {
            case ' ':
                e.preventDefault();
                // 专注 tab 激活时，空格暂停/继续计时
                const focusTab = document.getElementById('focusTab');
                if (focusTab && !focusTab.hidden && window._focusToggle) {
                    window._focusToggle();
                }
                break;
            case '1': switchTabByName('subjects'); break;
            case '2': switchTabByName('time'); break;
            case '3': switchTabByName('plan'); break;
            case '4': switchTabByName('dashboard'); break;
            case '5': switchTabByName('quiz'); break;
            case '6': switchTabByName('discussion'); break;
            case '7': switchTabByName('wrongbook'); break;
            case '8': switchTabByName('notes'); break;
            case 'd': case 'D':
                // D 键切换深色模式
                document.documentElement.dataset.theme =
                    document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
                break;
        }
    });

    function switchTabByName(name) {
        const btn = document.querySelector(`[data-tab="${name}"]`);
        if (btn) btn.click();
    }

    els.curveToggle.checked = state.settings.useEbbinghaus;

    // 预填日期默认值为今天 / 14 天后
    const today = new Date();
    const future = new Date();
    future.setDate(future.getDate() + 14);
    els.timeStart.value = formatDate(today);
    els.timeEnd.value = formatDate(future);

    renderAll();
    requestNotificationPermission();
    initParticles();
    initFocusMode();

    if (state.schedule.length > 0) {
        startReminder(state.schedule, renderSchedule);
    }

    // 添加欢迎消息到 AI 聊天
    addChatBubble('assistant', '你好！我是你的 AI 复习助手 🎓\n可以帮你分析复习策略、诊断时间分配、推荐学习顺序。直接问我「时间够不够」「哪个最难」「怎么安排」都可以~');
}

/* ---------------- Tabs ---------------- */
function bindTabs() {
    document.querySelectorAll('.tab, .sidebar-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;
            switchTab(target);
            // 点击侧栏 tab 后关闭抽屉
            closeSidebar();
        });
    });
}

/* ---------------- 侧栏抽屉 ---------------- */
function bindSidebar() {
    const menuBtn = $('sidebarMenuBtn');
    const overlay = $('sidebarOverlay');
    const drawer = $('sidebarDrawer');
    const closeBtn = $('sidebarCloseBtn');
    if (!menuBtn || !drawer) return;

    menuBtn.addEventListener('click', () => toggleSidebar());
    if (overlay) overlay.addEventListener('click', closeSidebar);
    if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
}

function toggleSidebar() {
    const drawer = $('sidebarDrawer');
    const overlay = $('sidebarOverlay');
    if (drawer) drawer.classList.toggle('open');
    if (overlay) overlay.classList.toggle('open');
}

function closeSidebar() {
    const drawer = $('sidebarDrawer');
    const overlay = $('sidebarOverlay');
    if (drawer) drawer.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
}

function switchTab(tab) {
    // 离开 dashboard 时清理图表
    if (state.currentTab === 'dashboard') {
        destroyDashboard();
    }

    state.currentTab = tab;
    document.querySelectorAll('.tab, .sidebar-tab').forEach(t => {
        const active = t.dataset.tab === tab;
        t.classList.toggle('active', active);
        t.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    ['subjects', 'time', 'plan', 'dashboard', 'ai', 'focus', 'quiz', 'discussion', 'wrongbook', 'notes', 'guide'].forEach(t => {
        const panel = $(`${t}Tab`);
        if (panel) {
            const show = t === tab;
            panel.hidden = !show;
            if (show) {
                panel.classList.remove('tab-content-enter');
                void panel.offsetWidth; // force reflow
                panel.classList.add('tab-content-enter');
            }
        }
    });

    if (tab === 'dashboard') {
        initDashboard({ subjects: state.subjects, schedule: state.schedule });
    }
    if (tab === 'focus') {
        initFocusMode();
    }
}

/* ---------------- 难度选择 ---------------- */
function bindDifficulty() {
    document.querySelectorAll('.diff-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const level = parseInt(btn.dataset.level, 10);
            els.subjectDifficulty.value = String(level);
            document.querySelectorAll('.diff-btn').forEach(b => {
                const active = b === btn;
                b.classList.toggle('active', active);
                b.setAttribute('aria-checked', active ? 'true' : 'false');
            });
        });
    });
}

/* ---------------- 科目表单 ---------------- */
function bindSubjectForm() {
    els.subjectForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = els.subjectName.value.trim();
        const difficulty = parseInt(els.subjectDifficulty.value, 10);
        const text = els.subjectPoints.value.trim();
        const points = text ? text.split('\n').map(p => p.trim()).filter(Boolean) : [];
        const scoreRaw = els.subjectScore ? els.subjectScore.value.trim() : '';
        const simulatedScore = scoreRaw === '' ? null : Math.max(0, Math.min(100, parseInt(scoreRaw, 10) || 0));

        if (!name) { toast('请输入科目名称', 'error'); return; }
        if (points.length === 0) { toast('请至少添加一个复习重点', 'error'); return; }

        const subject = {
            id: genId(),
            name, difficulty, points, completedPoints: [],
            weakPoints: [],
            simulatedScore
        };
        state.subjects.push(subject);
        saveSubjects(state.subjects);

        els.subjectName.value = '';
        els.subjectPoints.value = '';
        if (els.subjectScore) els.subjectScore.value = '';
        document.querySelectorAll('.diff-btn').forEach(b => {
            const active = parseInt(b.dataset.level, 10) === 2;
            b.classList.toggle('active', active);
        });
        els.subjectDifficulty.value = '2';

        renderSubjects();
        updateStats();
        toast(`已添加科目：${name}`, 'success');
    });
}

function deleteSubject(id) {
    if (!confirm('确定要删除这个科目吗？相关计划也会失效。')) return;
    state.subjects = state.subjects.filter(s => s.id !== id);
    saveSubjects(state.subjects);
    renderSubjects();
    updateStats();
}

/* ---------------- 重点工具栏（AI推荐 + 上传提取） ---------------- */
function bindPointsToolbar() {
    if (!els.aiPointsBtn) return;

    // 监听科目名变化，给出"知识库收录/未收录"提示
    els.subjectName.addEventListener('input', () => {
        const name = els.subjectName.value.trim();
        if (!name) {
            setPointsHelper('', '');
            return;
        }
        if (hasKnowledgeSubject(name)) {
            setPointsHelper(`✅ 知识库已收录「${name}」,点击「AI 推荐重点」试试`, 'success');
        } else {
            setPointsHelper(`ℹ️ 知识库暂无「${name}」,可手动输入或上传文档提取`, 'info');
        }
    });

    // AI 推荐重点
    els.aiPointsBtn.addEventListener('click', () => {
        const name = els.subjectName.value.trim();
        if (!name) {
            toast('请先填写科目名称', 'error');
            els.subjectName.focus();
            return;
        }
        const difficulty = parseInt(els.subjectDifficulty.value, 10) || 2;
        const candidates = recommendByName(name, difficulty);
        if (candidates.length === 0) {
            setPointsHelper(`😔 知识库暂无「${name}」的推荐,可手动输入或上传文档`, 'error');
            toast('知识库暂无此科目,请手动输入或上传文档', 'error');
            return;
        }
        setPointsHelper(`已为「${name}」推荐 ${candidates.length} 个重点,请在弹窗中勾选`, 'info');
        openPicker(candidates, (selected) => {
            mergePointsToTextarea(selected);
            toast(`已添加 ${selected.length} 个重点`, 'success');
        });
    });

    // 上传提取重点
    els.uploadPointsBtn.addEventListener('click', () => els.pointsFileInput.click());

    // 教材导入弹窗
    let tbSelected = null;
    let tbNavState = { level: 'root', groupId: null, majorId: null }; // root → group → major
    function bindTextbookModal() {
        if (!els.textbookPointsBtn || !els.tbModal) return;
        els.textbookPointsBtn.addEventListener('click', () => {
            tbSelected = null;
            tbNavState = { level: 'root', groupId: null, majorId: null };
            els.tbSearchInput.value = '';
            els.tbSelectedPanel.style.display = 'none';
            els.tbPreviewPanel.style.display = 'none';
            renderTbView();
            els.tbModal.classList.add('open');
        });
        els.tbModalClose.addEventListener('click', () => { els.tbModal.classList.remove('open'); });
        els.tbModal.addEventListener('click', (e) => {
            if (e.target === els.tbModal) els.tbModal.classList.remove('open');
        });
        els.tbSearchInput.addEventListener('input', () => {
            const keyword = els.tbSearchInput.value.trim();
            if (keyword) {
                tbNavState = { level: 'search', groupId: null, majorId: null };
            } else {
                tbNavState = { level: 'root', groupId: null, majorId: null };
            }
            renderTbView();
        });
        els.tbBreadcrumbBack.addEventListener('click', () => {
            els.tbSearchInput.value = '';
            if (tbNavState.level === 'major') {
                tbNavState = { level: 'group', groupId: tbNavState.groupId, majorId: null };
            } else if (tbNavState.level === 'group') {
                tbNavState = { level: 'root', groupId: null, majorId: null };
            } else {
                tbNavState = { level: 'root', groupId: null, majorId: null };
            }
            renderTbView();
        });
        els.tbPreviewBtn.addEventListener('click', () => {
            if (!tbSelected) return;
            const isVisible = els.tbPreviewPanel.style.display !== 'none';
            els.tbPreviewPanel.style.display = isVisible ? 'none' : '';
            if (!isVisible) {
                els.tbPreviewList.innerHTML = tbSelected.points.map(p => `<span>${escapeHTML(p)}</span>`).join('');
            }
        });
        els.tbConfirmBtn.addEventListener('click', () => {
            if (!tbSelected) return;
            els.subjectPoints.value = tbSelected.points.join('\n');
            els.tbModal.classList.remove('open');
            setPointsHelper(`✅ 已导入「${tbSelected.name}」的 ${tbSelected.points.length} 个知识点`, 'success');
            els.subjectPoints.dispatchEvent(new Event('input'));
        });
    }
    bindTextbookModal();

    function renderTbView() {
        if (!els.tbCategories) return;
        const keyword = els.tbSearchInput.value.trim();

        // 面包屑
        if (tbNavState.level === 'root' && !keyword) {
            els.tbBreadcrumb.style.display = 'none';
            els.tbModalTitle.textContent = '📚 选择学科门类';
            els.tbSearchInput.style.display = '';
        } else if (tbNavState.level === 'group') {
            els.tbBreadcrumb.style.display = '';
            const group = textbookGroups.find(g => g.id === tbNavState.groupId);
            els.tbBreadcrumbPath.textContent = group ? group.name : '';
            els.tbModalTitle.textContent = '📚 选择专业';
            els.tbSearchInput.style.display = 'none';
        } else if (tbNavState.level === 'major') {
            els.tbBreadcrumb.style.display = '';
            const group = textbookGroups.find(g => g.id === tbNavState.groupId);
            const major = group && group.majors.find(m => m.id === tbNavState.majorId);
            els.tbBreadcrumbPath.textContent = group ? `${group.name} › ${major ? major.name : ''}` : '';
            els.tbModalTitle.textContent = '📚 选择教材';
            els.tbSearchInput.style.display = 'none';
        } else if (keyword) {
            els.tbBreadcrumb.style.display = 'none';
            els.tbModalTitle.textContent = '📚 搜索结果';
        }

        let html = '';
        const catMap = {};
        textbookCategories.forEach(c => { catMap[c.id] = c; });

        if (keyword) {
            // 搜索模式：直接展示搜索结果
            const searchResults = searchTextbooks(keyword);
            if (searchResults.length === 0) {
                html = '<div class="tb-empty-hint">未找到匹配的教材，试试其他关键词</div>';
            } else {
                const grouped = {};
                searchResults.forEach(r => {
                    if (!grouped[r.categoryName]) grouped[r.categoryName] = { icon: r.categoryIcon, books: [] };
                    grouped[r.categoryName].books.push(r);
                });
                Object.entries(grouped).forEach(([catName, { icon, books }]) => {
                    html += `<div class="tb-cat-title">${icon} ${catName}</div>`;
                    books.forEach(tb => { html += renderTbBookItem(tb); });
                });
            }
        } else if (tbNavState.level === 'root') {
            // 第一级：学科门类卡片
            textbookGroups.forEach(group => {
                const majorCount = group.majors.length;
                let totalBooks = 0;
                group.majors.forEach(m => {
                    m.categoryIds.forEach(cid => {
                        if (catMap[cid]) totalBooks += catMap[cid].textbooks.length;
                    });
                });
                html += `<div class="tb-group-card" data-group-id="${group.id}" style="--accent: ${group.color || '#667eea'}">
                    <div class="tb-group-card-icon">${group.icon}</div>
                    <div class="tb-group-card-info">
                        <div class="tb-group-card-name">${group.name}</div>
                        <div class="tb-group-card-desc">${majorCount}个专业 · ${totalBooks}本教材</div>
                    </div>
                    <span class="tb-group-card-arrow">›</span>
                </div>`;
            });
        } else if (tbNavState.level === 'group') {
            // 第二级：专业列表
            const group = textbookGroups.find(g => g.id === tbNavState.groupId);
            if (group) {
                group.majors.forEach(major => {
                    let totalBooks = 0;
                    major.categoryIds.forEach(cid => {
                        if (catMap[cid]) totalBooks += catMap[cid].textbooks.length;
                    });
                    html += `<div class="tb-major-card" data-major-id="${major.id}" style="--accent: ${group.color || '#667eea'}">
                        <span class="tb-major-icon">${major.icon}</span>
                        <div class="tb-major-info">
                            <div class="tb-major-name">${major.name}</div>
                            <div class="tb-major-desc">${totalBooks}本教材</div>
                        </div>
                        <span class="tb-group-card-arrow">›</span>
                    </div>`;
                });
            }
        } else if (tbNavState.level === 'major') {
            // 第三级：该专业下的教材分类 + 教材列表
            const group = textbookGroups.find(g => g.id === tbNavState.groupId);
            const major = group && group.majors.find(m => m.id === tbNavState.majorId);
            if (major) {
                major.categoryIds.forEach(cid => {
                    const cat = catMap[cid];
                    if (!cat) return;
                    html += `<div class="tb-cat-title">${cat.icon} ${cat.name}</div>`;
                    cat.textbooks.forEach(tb => { html += renderTbBookItem(tb); });
                });
            }
        }

        els.tbCategories.innerHTML = html;

        // 绑定学科门类卡片点击
        els.tbCategories.querySelectorAll('.tb-group-card').forEach(card => {
            card.addEventListener('click', () => {
                tbNavState = { level: 'group', groupId: card.dataset.groupId, majorId: null };
                renderTbView();
            });
        });

        // 绑定专业卡片点击
        els.tbCategories.querySelectorAll('.tb-major-card').forEach(card => {
            card.addEventListener('click', () => {
                tbNavState = { level: 'major', groupId: tbNavState.groupId, majorId: card.dataset.majorId };
                renderTbView();
            });
        });

        // 绑定教材项点击
        els.tbCategories.querySelectorAll('.tb-book-item').forEach(item => {
            item.addEventListener('click', () => {
                els.tbCategories.querySelectorAll('.tb-book-item').forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');
                const id = item.dataset.tbId;
                const allBooks = textbookCategories.flatMap(c => c.textbooks);
                const book = allBooks.find(b => b.id === id);
                if (book) {
                    tbSelected = book;
                    els.tbSelectedPanel.style.display = '';
                    els.tbPreviewPanel.style.display = 'none';
                    els.tbSelectedName.textContent = book.name;
                    els.tbSelectedCount.textContent = book.points.length;
                }
            });
        });
    }

    function renderTbBookItem(tb) {
        const sel = tbSelected && tbSelected.id === tb.id ? ' selected' : '';
        return `<div class="tb-book-item${sel}" data-tb-id="${escapeHTML(tb.id)}">
            <div>
                <div class="tb-book-name">${escapeHTML(tb.name)}</div>
                <div class="tb-book-meta">${escapeHTML(tb.publisher || '')}</div>
            </div>
            <div class="tb-book-count">${tb.points.length}个知识点</div>
        </div>`;
    }
    els.pointsFileInput.addEventListener('change', async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const name = els.subjectName.value.trim() || '当前科目';
        setPointsHelper(`🔄 正在解析「${file.name}」,请稍候...`, 'info');
        els.uploadPointsBtn.disabled = true;
        els.aiPointsBtn.disabled = true;
        try {
            const { text, meta } = await extractFromFile(file, (pct) => {
                if (pct != null) {
                    setPointsHelper(`🔄 OCR 识别中... ${pct}%`, 'info');
                }
            });
            const { extractFromText } = await import('./extractor.js');
            const points = extractFromText(text, { keywordLimit: 25 });
            if (points.length === 0) {
                setPointsHelper('⚠️ 未提取到重点,请尝试更清晰的文档或手动输入', 'error');
                toast('未提取到重点', 'error');
                return;
            }
            const sourceLabel = `${meta.type}（${meta.pages ? meta.pages + ' 页' : '1 份'}）`;
            const candidates = points.map(p => ({ ...p, source: sourceLabel }));
            setPointsHelper(`✅ 从 ${sourceLabel} 提取到 ${candidates.length} 个候选重点`, 'success');
            openPicker(candidates, (selected) => {
                mergePointsToTextarea(selected);
                toast(`已添加 ${selected.length} 个重点`, 'success');
            });
        } catch (err) {
            console.error(err);
            setPointsHelper('❌ 解析失败：' + err.message, 'error');
            toast('解析失败：' + err.message, 'error');
        } finally {
            els.uploadPointsBtn.disabled = false;
            els.aiPointsBtn.disabled = false;
            els.pointsFileInput.value = '';
        }
    });
}

function setPointsHelper(text, type = '') {
    if (!els.pointsHelper) return;
    els.pointsHelper.textContent = text;
    els.pointsHelper.className = 'points-helper' + (type ? ' ' + type : '');
}

function mergePointsToTextarea(newPoints) {
    if (!newPoints || newPoints.length === 0) return;
    const existing = els.subjectPoints.value
        .split('\n').map(s => s.trim()).filter(Boolean);
    const merged = [...existing];
    let added = 0;
    for (const p of newPoints) {
        if (!merged.includes(p)) {
            merged.push(p);
            added++;
        }
    }
    els.subjectPoints.value = merged.join('\n');
    if (added < newPoints.length) {
        setPointsHelper(`已合并 ${added} 个新重点(${newPoints.length - added} 个重复已跳过)`, 'info');
    }
}

function togglePointComplete(subjectId, point) {
    const subject = state.subjects.find(s => s.id === subjectId);
    if (!subject) return;
    subject.completedPoints = subject.completedPoints || [];
    const idx = subject.completedPoints.indexOf(point);
    if (idx >= 0) subject.completedPoints.splice(idx, 1);
    else subject.completedPoints.push(point);
    saveSubjects(state.subjects);
    renderSubjects();
}

function renderSubjects() {
    if (state.subjects.length === 0) {
        els.subjectList.innerHTML = emptyState('📚', '还没有添加科目', '在上方添加科目和复习重点');
        return;
    }

    const diffMap = { 1: { text: '简单', color: '#10b981' }, 2: { text: '中等', color: '#f59e0b' }, 3: { text: '困难', color: '#ef4444' } };
    els.subjectList.innerHTML = state.subjects.map(s => {
        const d = diffMap[s.difficulty] || diffMap[2];
        const completed = s.completedPoints || [];
        const weak = s.weakPoints || [];
        const done = completed.length;
        const total = s.points.length;
        const completionPill = total > 0
            ? `<span class="completion-pill">已完成 ${done}/${total}</span>`
            : '';
        const weakCount = weak.length;
        const weakPill = weakCount > 0
            ? `<span class="subject-score mid">⚠️ 弱项 ${weakCount}</span>`
            : '';
        let scoreBadge = '';
        if (typeof s.simulatedScore === 'number') {
            const cls = s.simulatedScore >= 75 ? 'high' : s.simulatedScore >= 60 ? 'mid' : 'low';
            scoreBadge = `<span class="subject-score ${cls}" title="上次模拟考分">📊 ${s.simulatedScore} 分</span>`;
        }
        return `
            <div class="subject-item" style="border-left-color: ${d.color}">
                <div class="subject-header">
                    <div class="subject-name">${escapeHTML(s.name)}</div>
                    <div class="subject-meta">
                        <span class="subject-weight" style="background:${d.color}20; color:${d.color}">${d.text}</span>
                        ${scoreBadge}
                        ${weakPill}
                        ${completionPill}
                        <button class="btn btn-danger btn-sm" data-action="delete-subject" data-id="${escapeHTML(s.id)}">删除</button>
                    </div>
                </div>
                <div class="key-points">
                    ${s.points.map(p => `
                        <span class="key-point ${completed.includes(p) ? 'completed' : ''} ${weak.includes(p) ? 'weak' : ''}" data-action="toggle-point" data-subject="${escapeHTML(s.id)}" data-point="${escapeHTML(p)}" title="点击切换完成/未完成,右键标记弱项">${escapeHTML(p)}</span>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');

    // 事件委托
    els.subjectList.querySelectorAll('[data-action="delete-subject"]').forEach(btn => {
        btn.addEventListener('click', () => deleteSubject(btn.dataset.id));
    });
    els.subjectList.querySelectorAll('[data-action="toggle-point"]').forEach(el => {
        el.addEventListener('click', () => togglePointComplete(el.dataset.subject, el.dataset.point));
        el.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            toggleWeakPoint(el.dataset.subject, el.dataset.point);
        });
    });
}

function toggleWeakPoint(subjectId, point) {
    const subject = state.subjects.find(s => s.id === subjectId);
    if (!subject) return;
    subject.weakPoints = subject.weakPoints || [];
    const idx = subject.weakPoints.indexOf(point);
    if (idx >= 0) subject.weakPoints.splice(idx, 1);
    else subject.weakPoints.push(point);
    saveSubjects(state.subjects);
    renderSubjects();
    toast(idx >= 0 ? `已取消弱项：${point}` : `已标记弱项：${point}（下次生成会优先排）`, 'success');
}

/* ---------------- 时间设置 ---------------- */
function bindTimeForm() {
    // 视图切换
    els.viewBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            els.viewBtns.forEach(b => {
                const active = b === btn;
                b.classList.toggle('active', active);
                b.setAttribute('aria-selected', active ? 'true' : 'false');
            });
            if (els.heatmapView) els.heatmapView.hidden = view !== 'heatmap';
            if (els.listView) els.listView.hidden = view !== 'list';
        });
    });

    // 时段时长选择
    els.durationBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            els.durationBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            els.sessionDuration.value = btn.dataset.duration;
        });
    });

    // 添加时间段
    if (els.addTimeRow) {
        els.addTimeRow.addEventListener('click', () => addTimeInputRow());
    }

    // 表单提交：合并所有时间输入和热力图状态，生成完整 timeSlots
    els.timeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const start = els.timeStart.value;
        const end = els.timeEnd.value;
        if (!start || !end) { toast('请选择日期', 'error'); return; }
        if (start > end) { toast('开始日期不能晚于结束日期', 'error'); return; }
        const duration = parseInt(els.sessionDuration.value, 10);
        if (isNaN(duration) || duration < 15 || duration > 240) {
            toast('时长需在 15~240 分钟之间', 'error'); return;
        }

        // 收集所有时间输入行
        const slots = collectTimeSlots(start, end, duration);

        // 合并热力图选中区域
        const grid = getGrid();
        const gridSegs = toSegments();
        const heatmapSlots = gridSegs.map((s, i) => ({
            id: genId(),
            startDate: start,
            endDate: end,
            timeFrom: s.timeFrom,
            timeTo: s.timeTo,
            duration,
            daysOfWeek: [s.day],
            fromGrid: true
        }));

        state.timeSlots = [...slots, ...heatmapSlots];
        saveTimeSlots(state.timeSlots);
        renderTimeSlots();
        renderHeatmap('heatmapGrid');
        renderSummary('heatmapSummary');
        updateStats();
        toast(`✅ 已保存 ${state.timeSlots.length} 个时间段`, 'success');
    });

    // 初始化渲染
    initTimeGrid();
    renderHeatmap('heatmapGrid');
    renderSummary('heatmapSummary');

    // 监听时间输入行变化时也更新热力图
    els.timeInputs.addEventListener('change', () => {
        syncInputsToGrid();
        renderHeatmap('heatmapGrid');
        renderSummary('heatmapSummary');
    });
}

function addTimeInputRow(initial = {}) {
    const row = document.createElement('div');
    row.className = 'time-input-row';
    row.innerHTML = `
        <input type="time" class="ti-from" value="${initial.from || '08:00'}">
        <span class="ti-sep">→</span>
        <input type="time" class="ti-to" value="${initial.to || '12:00'}">
        <div class="ti-days" role="group" aria-label="重复日">
            ${['一','二','三','四','五','六','日'].map((d, i) => `
                <label class="ti-day" data-day="${i}">
                    <input type="checkbox" value="${i}" ${initial.days && initial.days.includes(i) ? 'checked' : ''}>
                    <span>${d}</span>
                </label>
            `).join('')}
        </div>
        <button type="button" class="ti-remove" aria-label="删除">✕</button>
    `;
    row.querySelector('.ti-remove').addEventListener('click', () => {
        row.style.animation = 'listSlideOut 0.25s ease forwards';
        setTimeout(() => row.remove(), 250);
    });
    els.timeInputs.appendChild(row);
}

function collectTimeSlots(start, end, duration) {
    const slots = [];
    const rows = els.timeInputs.querySelectorAll('.time-input-row');
    rows.forEach(row => {
        const from = row.querySelector('.ti-from').value;
        const to = row.querySelector('.ti-to').value;
        if (!from || !to) return;
        if (from >= to) return;
        const days = Array.from(row.querySelectorAll('.ti-day input:checked')).map(i => parseInt(i.value, 10));
        if (days.length === 0) {
            // 默认全选
            for (let i = 0; i < 7; i++) days.push(i);
        }
        slots.push({
            id: genId(),
            startDate: start,
            endDate: end,
            timeFrom: from,
            timeTo: to,
            duration,
            daysOfWeek: days,
            fromGrid: false
        });
    });
    return slots;
}

function syncInputsToGrid() {
    // 把所有时间输入行同步到热力图（覆盖热力图状态）
    clearGrid();
    const rows = els.timeInputs.querySelectorAll('.time-input-row');
    const { setCell } = window.__timeGridApi || {};
    rows.forEach(row => {
        const from = row.querySelector('.ti-from').value;
        const to = row.querySelector('.ti-to').value;
        if (!from || !to || from >= to) return;
        const startH = parseInt(from.split(':')[0], 10);
        const endH = parseInt(to.split(':')[0], 10) || 24;
        const days = Array.from(row.querySelectorAll('.ti-day input:checked')).map(i => parseInt(i.value, 10));
        const dayList = days.length === 0 ? [0, 1, 2, 3, 4, 5, 6] : days;
        for (let h = startH; h < endH; h++) {
            dayList.forEach(d => {
                if (d >= 0 && d < 7 && setCell) {
                    setCell(d, h, true);
                }
            });
        }
    });
}

function deleteTimeSlot(id) {
    state.timeSlots = state.timeSlots.filter(t => t.id !== id);
    saveTimeSlots(state.timeSlots);
    renderTimeSlots();
    updateStats();
}

function renderTimeSlots() {
    if (state.timeSlots.length === 0) {
        if (els.timeSlotList) {
            els.timeSlotList.innerHTML = emptyState('⏰', '还没有设置可支配时间', '在上方添加复习时间段或点击热力图');
        }
        return;
    }
    if (!els.timeSlotList) return;
    const dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    els.timeSlotList.innerHTML = state.timeSlots.map(t => {
        const hours = computeSlotHours(t).toFixed(1);
        const dayText = t.daysOfWeek
            ? t.daysOfWeek.map(d => dayNames[d] || '').join('/')
            : '每天';
        const fromGrid = t.fromGrid ? '<span class="from-grid-badge">热力图</span>' : '';
        return `
            <div class="time-slot-item">
                <div class="time-info">
                    <div>
                        <div class="time-range">${escapeHTML(t.timeFrom)} - ${escapeHTML(t.timeTo)} ${fromGrid}</div>
                        <div style="font-size:12px;color:var(--text-muted);margin-top:4px;">${escapeHTML(t.startDate)} 至 ${escapeHTML(t.endDate)} · ${escapeHTML(dayText)}</div>
                    </div>
                    <div style="text-align:right;">
                        <div class="time-duration">${hours} 小时</div>
                        <div style="font-size:12px;color:var(--text-muted);margin-top:4px;">每次 ${escapeHTML(String(t.duration))} 分钟</div>
                    </div>
                </div>
                <button class="btn btn-danger btn-sm" style="margin-top:12px;" data-action="delete-slot" data-id="${escapeHTML(t.id)}">删除时间段</button>
            </div>
        `;
    }).join('');
    els.timeSlotList.querySelectorAll('[data-action="delete-slot"]').forEach(btn => {
        btn.addEventListener('click', () => deleteTimeSlot(btn.dataset.id));
    });
}

/* ---------------- 计划面板 ---------------- */
function bindPlanControls() {
    els.curveToggle.addEventListener('change', () => {
        state.settings.useEbbinghaus = els.curveToggle.checked;
        saveSettings(state.settings);
    });
    els.generateBtn.addEventListener('click', () => {
        if (state.subjects.length === 0) { toast('请先添加科目', 'error'); return; }
        if (state.timeSlots.length === 0) { toast('请先设置可支配时间', 'error'); return; }
        regenerateSchedule(false);
    });
    els.clearBtn.addEventListener('click', () => {
        if (!confirm('确定要清空所有复习计划吗？')) return;
        state.schedule = [];
        saveSchedule(state.schedule);
        renderSchedule();
        updateStats();
    });

    // 艾宾浩斯配置面板
    if (els.curveConfigBtn) {
        els.curveConfigBtn.addEventListener('click', () => {
            const isHidden = els.curveConfigPanel.hidden;
            els.curveConfigPanel.hidden = !isHidden;
            if (!isHidden) return;
            renderCurveConfigInputs();
        });
    }
    if (els.curveConfigApply) {
        els.curveConfigApply.addEventListener('click', () => {
            const intervals = readCurveConfigInputs();
            if (!intervals) return;
            state.settings.ebbinghausIntervals = intervals;
            saveSettings(state.settings);
            els.curveConfigPanel.hidden = true;
            if (state.subjects.length === 0) {
                toast('间隔已保存,下次生成时生效', 'success');
                return;
            }
            if (confirm('已保存新间隔。是否立即重新生成复习计划？')) {
                regenerateSchedule(false);
            } else {
                toast('间隔已保存', 'success');
            }
        });
    }
    // 预设按钮
    document.querySelectorAll('[data-curve-preset]').forEach(btn => {
        btn.addEventListener('click', () => {
            const map = {
                short: [0, 1, 3, 7],
                standard: [0, 1, 3, 7, 15],
                long: [0, 1, 3, 7, 15, 30]
            };
            setCurveConfigInputs(map[btn.dataset.curvePreset]);
        });
    });
}

function renderCurveConfigInputs() {
    const intervals = state.settings.ebbinghausIntervals || DEFAULT_EBBINGHAUS;
    setCurveConfigInputs(intervals);
}

function setCurveConfigInputs(intervals) {
    if (!els.curveConfigInputs) return;
    els.curveConfigInputs.innerHTML = intervals.map((v, i) => `
        <div class="curve-input-wrap">
            <label>第${i + 1}轮</label>
            <input type="number" min="0" max="365" step="1" value="${v}" data-idx="${i}" ${i === 0 ? 'disabled title="首次学习必须为 0"' : ''}>
        </div>
    `).join('');
}

function readCurveConfigInputs() {
    if (!els.curveConfigInputs) return null;
    const inputs = els.curveConfigInputs.querySelectorAll('input');
    const arr = [];
    for (const inp of inputs) {
        const v = parseInt(inp.value, 10);
        if (isNaN(v) || v < 0 || v > 365) {
            toast('每个间隔必须是 0-365 的整数', 'error');
            return null;
        }
        arr.push(v);
    }
    if (arr[0] !== 0) {
        toast('第 1 个间隔必须为 0（首次学习当天）', 'error');
        return null;
    }
    // 单调递增校验
    for (let i = 1; i < arr.length; i++) {
        if (arr[i] <= arr[i - 1]) {
            toast(`第 ${i + 1} 个间隔必须大于第 ${i} 个（${arr[i - 1]}）`, 'error');
            return null;
        }
    }
    return arr;
}

function regenerateSchedule(addRemedial) {
    let items = generateSchedule(state.subjects, state.timeSlots, {
        useEbbinghaus: state.settings.useEbbinghaus,
        ebbinghausIntervals: state.settings.ebbinghausIntervals
    });
    if (addRemedial && state.schedule.length > 0) {
        const wrongItems = state.schedule.filter(s => s.markedWrong && !s.completed);
        if (wrongItems.length > 0) {
            items = insertRemedialItems(items, state.timeSlots, wrongItems);
            toast(`已为 ${wrongItems.length} 个"不会"项生成补课`, 'success');
        }
    }
    state.schedule = items;
    saveSchedule(state.schedule);
    startReminder(state.schedule, renderSchedule);
    renderSchedule();
    updateStats();
}

function toggleComplete(id) {
    const item = state.schedule.find(s => s.id === id);
    if (!item) return;
    item.completed = !item.completed;
    if (item.completed && item.subjectId && item.point) {
        // 同步到科目完成度（仅对原始重点,补课项不算）
        const rawPoint = item.isRemedial ? item.point.replace(/^\[补课\]\s*/, '') : item.point;
        const subject = state.subjects.find(s => s.id === item.subjectId);
        if (subject && !item.isRemedial) {
            subject.completedPoints = subject.completedPoints || [];
            if (!subject.completedPoints.includes(item.point)) {
                subject.completedPoints.push(item.point);
            }
            saveSubjects(state.subjects);
        }
    }
    saveSchedule(state.schedule);
    renderSchedule();
    renderSubjects();
    updateStats();
}

function toggleMarkedWrong(id) {
    const item = state.schedule.find(s => s.id === id);
    if (!item) return;
    item.markedWrong = !item.markedWrong;
    saveSchedule(state.schedule);
    renderSchedule();
    if (item.markedWrong) {
        if (confirm(`已标记「不会」：${item.point}\n是否立即为它生成"今日补课"插入到下一个可用时段？`)) {
            const wrongItems = state.schedule.filter(s => s.markedWrong && !s.completed);
            state.schedule = insertRemedialItems(state.schedule, state.timeSlots, wrongItems);
            saveSchedule(state.schedule);
            renderSchedule();
            updateStats();
            toast('✅ 补课已插入到最近的可用时段', 'success');
        }
    } else {
        toast('已取消"不会"标记', 'info');
    }
}

function renderSchedule() {
    refreshReminderRef(state.schedule);
    if (state.schedule.length === 0) {
        els.scheduleList.innerHTML = emptyState('📋', '还没有生成复习计划', '先添加科目和时间，然后点击上方按钮生成');
        return;
    }

    const now = new Date();
    const today = formatDate(now);
    const cur = formatTime(now);

    const sorted = [...state.schedule].sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.timeFrom.localeCompare(b.timeFrom);
    });

    els.scheduleList.innerHTML = sorted.map(item => {
        const isCurrent = item.date === today && item.timeFrom <= cur && item.timeTo >= cur;
        const isPast = item.date < today || (item.date === today && item.timeTo < cur);
        const reviewLabel = item.reviewRound > 0 ? `第 ${item.reviewRound + 1} 轮复习` : '首次学习';
        // 徽章
        const subject = state.subjects.find(s => s.id === item.subjectId);
        const isWeak = subject && (subject.weakPoints || []).includes(item.point);
        const badges = [];
        if (item.isRemedial) badges.push('<span class="schedule-badge remedial">🎯 补课</span>');
        if (item.markedWrong) badges.push('<span class="schedule-badge wrong">❌ 不会</span>');
        if (isWeak && !item.isRemedial) badges.push('<span class="schedule-badge weak">⚠️ 弱项</span>');
        if (item.reviewRound > 0) badges.push(`<span class="schedule-badge round">第${item.reviewRound + 1}轮</span>`);
        const badgeHtml = badges.length > 0 ? `<span class="schedule-badges">${badges.join('')}</span>` : '';
        // 卡片类
        const itemClass = [
            isCurrent ? 'current' : '',
            isPast ? 'past' : '',
            item.isRemedial ? 'remedial' : '',
            isWeak && !item.isRemedial ? 'weak-priority' : '',
            item.markedWrong ? 'wrong' : ''
        ].filter(Boolean).join(' ');
        return `
            <div class="schedule-item ${itemClass}">
                <div class="schedule-time">${escapeHTML(item.date)} ${escapeHTML(item.timeFrom)} - ${escapeHTML(item.timeTo)}</div>
                <div class="schedule-subject">${escapeHTML(item.subjectName)} ${badgeHtml}</div>
                <div class="schedule-point">📌 ${escapeHTML(item.point)}</div>
                <div class="schedule-meta">${escapeHTML(reviewLabel)}</div>
                <div class="schedule-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${item.completed ? 100 : 0}%"></div>
                    </div>
                </div>
                <div class="schedule-actions">
                    <button class="btn ${item.completed ? 'btn-danger' : 'btn-primary'} btn-sm" data-action="toggle-complete" data-id="${escapeHTML(item.id)}">
                        ${item.completed ? '标记未完成' : '标记已完成'}
                    </button>
                    <button class="btn btn-sm btn-wrong ${item.markedWrong ? 'active' : ''}" data-action="toggle-wrong" data-id="${escapeHTML(item.id)}" title="标为"不会",可生成补课">
                        ${item.markedWrong ? '❌ 已标不会' : '❌ 不会'}
                    </button>
                </div>
            </div>
        `;
    }).join('');

    els.scheduleList.querySelectorAll('[data-action="toggle-complete"]').forEach(btn => {
        btn.addEventListener('click', () => toggleComplete(btn.dataset.id));
    });
    els.scheduleList.querySelectorAll('[data-action="toggle-wrong"]').forEach(btn => {
        btn.addEventListener('click', () => toggleMarkedWrong(btn.dataset.id));
    });
}

/* ---------------- 实时进度面板 ---------------- */
function bindProgressPanel() {
    if (!els.progressPanelToggle || !els.progressPanelBody) return;
    els.progressPanelToggle.addEventListener('click', () => {
        const isHidden = els.progressPanelBody.classList.toggle('hidden');
        els.progressPanelToggle.classList.toggle('collapsed', isHidden);
        els.progressPanelToggle.textContent = isHidden ? '▼' : '▲';
    });
    // 每 30 秒自动刷新进度面板（处理跨天等边界情况）
    setInterval(() => renderProgressPanel(), 30000);
}

function renderProgressPanel() {
    if (!els.progressRingFill) return;
    const schedule = state.schedule;
    const subjects = state.subjects;
    const total = schedule.length;
    const completed = schedule.filter(s => s.completed).length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

    // 圆环动画 (周长 = 2 * π * 52 ≈ 326.73)
    const circumference = 326.73;
    const offset = circumference - (pct / 100) * circumference;
    els.progressRingFill.style.strokeDashoffset = offset;
    els.progressRingPct.textContent = `${pct}%`;

    // 今日任务
    const now = new Date();
    const today = formatDate(now);
    const todayItems = schedule.filter(s => s.date === today);
    const todayDone = todayItems.filter(s => s.completed).length;
    els.pscTodayTotal.textContent = todayItems.length;
    els.pscTodayDone.textContent = todayDone;
    els.pscTodayDone.className = 'pscard-value' + (todayDone > 0 ? ' highlight' : '');

    // 剩余天数
    if (state.timeSlots.length > 0) {
        const endDate = state.timeSlots[0].endDate;
        if (endDate) {
            const diffMs = new Date(endDate) - now;
            const remainDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
            els.pscRemainDays.textContent = remainDays;
        } else {
            els.pscRemainDays.textContent = '-';
        }
    } else {
        els.pscRemainDays.textContent = '-';
    }

    // 各科进度条
    if (!els.progressSubjects) return;
    if (subjects.length === 0 || total === 0) {
        els.progressSubjects.innerHTML = '<div class="progress-subjects-empty">添加科目并生成计划后，这里将显示各科进度</div>';
        return;
    }

    const colorPalette = ['#667eea', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];
    els.progressSubjects.innerHTML = subjects.map((s, i) => {
        const subjectItems = schedule.filter(item => item.subjectId === s.id);
        const subjectCompleted = subjectItems.filter(item => item.completed).length;
        const subjectTotal = subjectItems.length;
        const subjectPct = subjectTotal > 0 ? Math.round((subjectCompleted / subjectTotal) * 100) : 0;
        const color = colorPalette[i % colorPalette.length];
        return `
            <div class="progress-subject-row">
                <div class="ps-name" title="${escapeHTML(s.name)}">${escapeHTML(s.name)}</div>
                <div class="ps-bar-track">
                    <div class="ps-bar-fill" style="width:${subjectPct}%; background: linear-gradient(90deg, ${color}, ${color}cc);"></div>
                </div>
                <div class="ps-pct" style="color:${color}">${subjectPct}%</div>
                <div class="ps-count">${subjectCompleted}/${subjectTotal}</div>
            </div>
        `;
    }).join('');
}

/* ---------------- 自定义调色面板 ---------------- */
const COLOR_PRESETS = [
    { name: '紫罗兰', primary: '#667eea', gradEnd: '#764ba2' },
    { name: '樱花粉', primary: '#ec4899', gradEnd: '#f43f5e' },
    { name: '海洋蓝', primary: '#3b82f6', gradEnd: '#1d4ed8' },
    { name: '翡翠绿', primary: '#10b981', gradEnd: '#059669' },
    { name: '落日橙', primary: '#f97316', gradEnd: '#ea580c' },
    { name: '柠檬黄', primary: '#eab308', gradEnd: '#ca8a04' },
    { name: '玫瑰红', primary: '#e11d48', gradEnd: '#be123c' },
    { name: '靛蓝', primary: '#6366f1', gradEnd: '#4f46e5' },
    { name: '青绿', primary: '#14b8a6', gradEnd: '#0d9488' },
    { name: '暖棕', primary: '#d97706', gradEnd: '#b45309' }
];

function bindColorPicker() {
    if (!els.colorPickerToggle || !els.colorPickerBody) return;

    // 折叠
    els.colorPickerToggle.addEventListener('click', () => {
        const isHidden = els.colorPickerBody.classList.toggle('hidden');
        els.colorPickerToggle.classList.toggle('collapsed', isHidden);
        els.colorPickerToggle.textContent = isHidden ? '▼' : '▲';
    });

    // 渲染预设色卡
    renderColorPresets();

    // 颜色选择器与 hex 输入联动
    if (els.customColorInput && els.customColorHex) {
        els.customColorInput.addEventListener('input', (e) => {
            els.customColorHex.value = e.target.value;
        });
        els.customColorHex.addEventListener('input', (e) => {
            const v = e.target.value;
            if (/^#[0-9a-fA-F]{6}$/.test(v)) {
                els.customColorInput.value = v;
            }
        });
    }
    if (els.customGradEndInput && els.customGradEndHex) {
        els.customGradEndInput.addEventListener('input', (e) => {
            els.customGradEndHex.value = e.target.value;
        });
        els.customGradEndHex.addEventListener('input', (e) => {
            const v = e.target.value;
            if (/^#[0-9a-fA-F]{6}$/.test(v)) {
                els.customGradEndInput.value = v;
            }
        });
    }

    // 应用自定义色
    if (els.applyCustomColor) {
        els.applyCustomColor.addEventListener('click', () => {
            const primary = els.customColorHex.value.trim();
            const gradEnd = els.customGradEndHex.value.trim();
            if (/^#[0-9a-fA-F]{6}$/.test(primary)) {
                applyThemeColor(primary, gradEnd || primary, '自定义');
            }
        });
    }

    // 恢复默认
    if (els.resetDefaultColor) {
        els.resetDefaultColor.addEventListener('click', () => {
            applyThemeColor('#667eea', '#764ba2', '紫罗兰');
            localStorage.removeItem('customThemeColor');
            localStorage.removeItem('customThemeGradEnd');
            localStorage.removeItem('customThemeName');
        });
    }

    // 启动时恢复已保存的配色
    restoreSavedColor();
}

function renderColorPresets() {
    if (!els.colorPresets) return;
    const savedPrimary = localStorage.getItem('customThemeColor');
    els.colorPresets.innerHTML = COLOR_PRESETS.map(p => {
        const isActive = savedPrimary === p.primary && !savedPrimary;
        return `
            <div class="color-preset-wrap" style="text-align:center; display:inline-block;">
                <div class="color-preset-card ${isActive ? 'active' : ''}"
                     style="background: linear-gradient(135deg, ${p.primary}, ${p.gradEnd});"
                     data-primary="${p.primary}" data-grad-end="${p.gradEnd}" data-name="${p.name}"
                     title="${p.name}">
                </div>
                <div class="color-preset-name">${p.name}</div>
            </div>
        `;
    }).join('');

    // 绑定点击
    els.colorPresets.querySelectorAll('.color-preset-card').forEach(card => {
        card.addEventListener('click', () => {
            const primary = card.dataset.primary;
            const gradEnd = card.dataset.gradEnd;
            const name = card.dataset.name;
            applyThemeColor(primary, gradEnd, name);
        });
    });
}

function applyThemeColor(primary, gradEnd, name) {
    const root = document.documentElement;

    // 更新 CSS 变量
    root.style.setProperty('--accent', primary);
    root.style.setProperty('--accent-text', darkenColor(primary, 20));
    root.style.setProperty('--accent-soft', lightenColor(primary, 40));
    root.style.setProperty('--bg-gradient', `linear-gradient(135deg, ${primary} 0%, ${gradEnd} 100%)`);

    // 更新 SVG 渐变
    const stops = document.querySelectorAll('#progressGradient stop');
    if (stops[0]) stops[0].setAttribute('stop-color', primary);
    if (stops[1]) stops[1].setAttribute('stop-color', gradEnd);

    // 更新 hover 阴影颜色
    const rgb = hexToRgb(primary);
    if (rgb) {
        root.style.setProperty('--accent-shadow', `rgba(${rgb.r},${rgb.g},${rgb.b},0.4)`);
    }

    // 更新输入框值
    if (els.customColorInput) els.customColorInput.value = primary;
    if (els.customColorHex) els.customColorHex.value = primary;
    if (els.customGradEndInput) els.customGradEndInput.value = gradEnd;
    if (els.customGradEndHex) els.customGradEndHex.value = gradEnd;

    // 高亮选中的预设卡
    if (els.colorPresets) {
        els.colorPresets.querySelectorAll('.color-preset-card').forEach(card => {
            card.classList.toggle('active', card.dataset.primary === primary);
        });
    }

    // 保存
    localStorage.setItem('customThemeColor', primary);
    localStorage.setItem('customThemeGradEnd', gradEnd);
    localStorage.setItem('customThemeName', name);

    // 刷新进度面板以应用新颜色
    renderProgressPanel();
}

function restoreSavedColor() {
    const primary = localStorage.getItem('customThemeColor');
    const gradEnd = localStorage.getItem('customThemeGradEnd');
    const name = localStorage.getItem('customThemeName');
    if (primary) {
        applyThemeColor(primary, gradEnd || primary, name || '自定义');
    }
}

// 颜色工具函数
function hexToRgb(hex) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : null;
}

function darkenColor(hex, amount) {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;
    const r = Math.max(0, Math.floor(rgb.r * (1 - amount / 100)));
    const g = Math.max(0, Math.floor(rgb.g * (1 - amount / 100)));
    const b = Math.max(0, Math.floor(rgb.b * (1 - amount / 100)));
    return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}

function lightenColor(hex, amount) {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;
    const r = Math.min(255, Math.floor(rgb.r + (255 - rgb.r) * amount / 100));
    const g = Math.min(255, Math.floor(rgb.g + (255 - rgb.g) * amount / 100));
    const b = Math.min(255, Math.floor(rgb.b + (255 - rgb.b) * amount / 100));
    return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}

/* ---------------- 自我测试模块 ---------------- */
// 简单 toast 提示
function showToast(msg, type = 'info') {
    const colors = { info: 'var(--accent)', warning: '#f59e0b', error: '#ef4444', success: '#10b981' };
    const div = document.createElement('div');
    div.textContent = msg;
    Object.assign(div.style, {
        position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
        padding: '10px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: '600',
        color: '#fff', background: colors[type] || colors.info, zIndex: '10000',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)', animation: 'fadeSlideUp 0.3s ease'
    });
    document.body.appendChild(div);
    setTimeout(() => { div.style.opacity = '0'; div.style.transition = 'opacity 0.3s'; }, 2000);
    setTimeout(() => div.remove(), 2500);
}

let quizState = {
    questions: [],
    currentIndex: 0,
    answers: [],
    type: 'choice',
    count: 10,
    subjectId: null,
    subjectName: '',
    startTime: 0,
    submitted: false
};

function bindQuiz() {
    if (!els.quizSetup) return;

    // 题型按钮切换
    document.querySelectorAll('.quiz-type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.quiz-type-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            quizState.type = btn.dataset.type;
        });
    });

    // 数量按钮切换
    document.querySelectorAll('.quiz-count-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.quiz-count-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            quizState.count = parseInt(btn.dataset.count);
        });
    });

    // 科目下拉
    updateQuizSubjects();
    els.quizSubject.addEventListener('change', () => {
        quizState.subjectId = els.quizSubject.value ? els.quizSubject.value : null;
    });

    // 开始测试
    els.quizStartBtn.addEventListener('click', startQuiz);

    // 提交答案
    els.quizSubmitAnswer.addEventListener('click', submitCurrentAnswer);

    // 下一题
    els.quizNextQuestion.addEventListener('click', goNextQuestion);

    // 退出
    els.quizQuitBtn.addEventListener('click', resetQuizToSetup);

    // 再测一次
    els.quizRetryBtn.addEventListener('click', () => startQuiz());

    // 返回设置
    els.quizBackSetupBtn.addEventListener('click', resetQuizToSetup);

    renderQuizHistory();
}

function updateQuizSubjects() {
    if (!els.quizSubject) return;
    const val = els.quizSubject.value;
    els.quizSubject.innerHTML = '<option value="">-- 请选择 --</option>' +
        state.subjects.map(s => `<option value="${s.id}" ${s.id === val ? 'selected' : ''}>${escapeHTML(s.name)}</option>`).join('');
}

function startQuiz() {
    const subjectId = els.quizSubject.value;
    if (!subjectId) { showToast('请先选择科目', 'warning'); return; }
    const subject = state.subjects.find(s => s.id === subjectId);
    if (!subject || !subject.points || subject.points.length === 0) {
        showToast('该科目没有复习重点，无法出题', 'warning'); return;
    }

    quizState.subjectId = subjectId;
    quizState.subjectName = subject.name;
    quizState.questions = generateQuestions(subject.points, quizState.type, quizState.count);
    quizState.currentIndex = 0;
    quizState.answers = [];
    quizState.startTime = Date.now();
    quizState.submitted = false;

    els.quizSetup.hidden = true;
    els.quizActive.hidden = false;
    els.quizResult.hidden = true;

    renderCurrentQuestion();
}

function generateQuestions(points, type, count) {
    const questions = [];
    const shuffled = [...points].sort(() => Math.random() - 0.5);
    const actualCount = Math.min(count, shuffled.length);

    for (let i = 0; i < actualCount; i++) {
        const point = shuffled[i];
        const qType = type === 'mixed' ? (Math.random() > 0.5 ? 'choice' : 'fill') : type;

        if (qType === 'choice') {
            questions.push(generateChoiceQuestion(point, shuffled));
        } else {
            questions.push(generateFillQuestion(point));
        }
    }
    return questions;
}

function generateChoiceQuestion(point, allPoints) {
    const correctAnswer = point.trim();
    const letters = ['A', 'B', 'C', 'D'];

    // 生成干扰项
    const distractors = allPoints
        .filter(p => p.trim() !== correctAnswer)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(p => p.trim());

    // 如果干扰项不够，生成一些通用干扰
    while (distractors.length < 3) {
        distractors.push(`干扰项 ${distractors.length + 1}`);
    }

    const options = [correctAnswer, ...distractors].sort(() => Math.random() - 0.5);
    const correctIndex = options.indexOf(correctAnswer);

    // 题目模板
    const templates = [
        `以下哪个是关于「${correctAnswer}」的正确描述？`,
        `「${correctAnswer}」属于哪个知识点？`,
        `关于「${correctAnswer}」，下列说法正确的是？`,
        `「${correctAnswer}」的核心要点是什么？`
    ];

    return {
        type: 'choice',
        question: templates[Math.floor(Math.random() * templates.length)],
        options: options.map((opt, idx) => ({ letter: letters[idx], text: opt })),
        correctLetter: letters[correctIndex],
        correctAnswer: correctAnswer
    };
}

function generateFillQuestion(point) {
    const answer = point.trim();
    const templates = [
        `请写出「${answer.substring(0, Math.min(2, answer.length))}______」的完整名称。`,
        `填空：${answer.substring(0, Math.max(0, answer.length - 3))}______ 是复习重点之一。`,
        `补全：______（提示：共 ${answer.length} 个字）`,
        `默写知识点：________`
    ];

    return {
        type: 'fill',
        question: templates[Math.floor(Math.random() * templates.length)],
        correctAnswer: answer,
        hint: `共 ${answer.length} 个字`
    };
}

function renderCurrentQuestion() {
    const q = quizState.questions[quizState.currentIndex];
    const total = quizState.questions.length;
    const idx = quizState.currentIndex;

    // 进度
    els.quizProgressFill.style.width = `${((idx) / total) * 100}%`;
    els.quizCurrentInfo.textContent = `第 ${idx + 1}/${total} 题`;
    els.quizSubjectLabel.textContent = quizState.subjectName;

    els.quizSubmitAnswer.disabled = false;
    els.quizNextQuestion.disabled = true;
    quizState.submitted = false;

    let html = '';
    if (q.type === 'choice') {
        html += `<div class="quiz-q-type">选择题</div>`;
        html += `<div class="quiz-q-text">${escapeHTML(q.question)}</div>`;
        html += `<div class="quiz-options-list">`;
        q.options.forEach((opt, i) => {
            html += `<div class="quiz-option-item" data-index="${i}" data-letter="${opt.letter}">
                <div class="quiz-option-radio"></div>
                <span class="quiz-option-letter">${opt.letter}</span>
                <span>${escapeHTML(opt.text)}</span>
            </div>`;
        });
        html += `</div>`;
    } else {
        html += `<div class="quiz-q-type">填空题</div>`;
        html += `<div class="quiz-q-text">${escapeHTML(q.question)}</div>`;
        html += `<input type="text" class="quiz-fill-input" id="quizFillInput" placeholder="请输入答案" autocomplete="off">`;
        html += `<div class="quiz-fill-hint">${escapeHTML(q.hint)}</div>`;
    }

    els.quizQuestionCard.className = 'quiz-question-card';
    els.quizQuestionCard.innerHTML = html;

    // 绑定选择题点击
    if (q.type === 'choice') {
        els.quizQuestionCard.querySelectorAll('.quiz-option-item').forEach(item => {
            item.addEventListener('click', () => {
                if (quizState.submitted) return;
                els.quizQuestionCard.querySelectorAll('.quiz-option-item').forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');
                els.quizSubmitAnswer.disabled = false;
            });
        });
    } else {
        const fillInput = document.getElementById('quizFillInput');
        if (fillInput) {
            fillInput.addEventListener('input', () => {
                els.quizSubmitAnswer.disabled = !fillInput.value.trim();
            });
            fillInput.focus();
        }
    }
}

function submitCurrentAnswer() {
    if (quizState.submitted) return;
    quizState.submitted = true;

    const q = quizState.questions[quizState.currentIndex];
    let userAnswer = '';
    let isCorrect = false;

    if (q.type === 'choice') {
        const selected = els.quizQuestionCard.querySelector('.quiz-option-item.selected');
        userAnswer = selected ? selected.dataset.letter : '';

        if (selected) {
            selected.classList.add(selected.dataset.letter === q.correctLetter ? 'correct-answer' : 'wrong-answer');
            // 显示正确答案
            els.quizQuestionCard.querySelectorAll('.quiz-option-item').forEach(item => {
                if (item.dataset.letter === q.correctLetter) {
                    item.classList.add('correct-answer');
                }
                item.style.pointerEvents = 'none';
            });
        }
        isCorrect = userAnswer === q.correctLetter;
    } else {
        const fillInput = document.getElementById('quizFillInput');
        userAnswer = fillInput ? fillInput.value.trim() : '';
        isCorrect = userAnswer === q.correctAnswer;
        if (fillInput) fillInput.disabled = true;
    }

    // 答案反馈
    const feedbackDiv = document.createElement('div');
    feedbackDiv.className = `quiz-feedback ${isCorrect ? 'correct' : 'wrong'}`;
    feedbackDiv.textContent = isCorrect ? '✓ 回答正确！' : `✗ 正确答案：${q.correctAnswer}`;
    els.quizQuestionCard.appendChild(feedbackDiv);

    // 卡片样式
    els.quizQuestionCard.classList.add(isCorrect ? 'correct' : 'wrong');

    quizState.answers.push({
        question: q.question,
        correctAnswer: q.correctAnswer,
        userAnswer: userAnswer,
        isCorrect: isCorrect
    });

    // 自动收录错题
    if (!isCorrect) {
        saveWrongQuestion(q, userAnswer, quizState.subjectName);
    }

    els.quizSubmitAnswer.disabled = true;

    const isLast = quizState.currentIndex >= quizState.questions.length - 1;
    els.quizNextQuestion.disabled = false;
    els.quizNextQuestion.textContent = isLast ? '查看结果' : '下一题';
}

function goNextQuestion() {
    if (quizState.currentIndex >= quizState.questions.length - 1) {
        showQuizResult();
        return;
    }
    quizState.currentIndex++;
    renderCurrentQuestion();
}

function showQuizResult() {
    els.quizActive.hidden = true;
    els.quizResult.hidden = false;

    const correct = quizState.answers.filter(a => a.isCorrect).length;
    const wrong = quizState.answers.length - correct;
    const pct = Math.round((correct / quizState.answers.length) * 100);
    const elapsed = Math.round((Date.now() - quizState.startTime) / 1000);

    // 分数环
    const offset = 326.73 - (pct / 100) * 326.73;
    els.quizScoreRing.style.strokeDashoffset = offset;
    els.quizScorePct.textContent = `${pct}%`;
    els.quizStatCorrect.textContent = correct;
    els.quizStatWrong.textContent = wrong;
    els.quizStatTime.textContent = elapsed >= 60 ? `${Math.floor(elapsed / 60)}m${elapsed % 60}s` : `${elapsed}s`;

    // 答题回顾
    let reviewHtml = '';
    quizState.answers.forEach((a, i) => {
        reviewHtml += `<div class="quiz-review-item ${a.isCorrect ? 'correct' : 'wrong'}">
            <div class="quiz-review-q">${i + 1}. ${escapeHTML(a.question)}</div>
            <div class="quiz-review-a">
                正确答案：<span class="correct">${escapeHTML(a.correctAnswer)}</span>
                ${a.userAnswer ? ` | 你的答案：<span class="${a.isCorrect ? 'correct' : 'wrong'}">${escapeHTML(a.userAnswer)}</span>` : ''}
            </div>
        </div>`;
    });
    els.quizReviewList.innerHTML = reviewHtml;

    // 保存记录
    saveQuizHistory(correct, wrong, pct, elapsed);

    // 进度条填满
    els.quizProgressFill.style.width = '100%';
}

function resetQuizToSetup() {
    els.quizSetup.hidden = false;
    els.quizActive.hidden = true;
    els.quizResult.hidden = false;
    els.quizResult.hidden = true;
    els.quizProgressFill.style.width = '0%';
    quizState = { questions: [], currentIndex: 0, answers: [], type: quizState.type, count: quizState.count, subjectId: null, subjectName: '', startTime: 0, submitted: false };
    updateQuizSubjects();
}

function saveQuizHistory(correct, wrong, pct, elapsed) {
    const history = JSON.parse(localStorage.getItem('quizHistory') || '[]');
    history.unshift({
        subject: quizState.subjectName,
        correct, wrong, pct, elapsed,
        date: new Date().toISOString(),
        type: quizState.type === 'choice' ? '选择题' : quizState.type === 'fill' ? '填空题' : '混合'
    });
    // 只保留最近 20 条
    if (history.length > 20) history.length = 20;
    localStorage.setItem('quizHistory', JSON.stringify(history));
    renderQuizHistory();
}

function renderQuizHistory() {
    if (!els.quizHistoryList) return;
    const history = JSON.parse(localStorage.getItem('quizHistory') || '[]');
    if (history.length === 0) {
        els.quizHistoryList.innerHTML = '<div class="quiz-history-empty">暂无测试记录</div>';
        return;
    }
    els.quizHistoryList.innerHTML = history.map(h => {
        const d = new Date(h.date);
        const dateStr = `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
        const scoreClass = h.pct >= 80 ? 'high' : h.pct >= 50 ? 'mid' : 'low';
        return `<div class="quiz-history-item">
            <div class="quiz-history-left">
                <span class="quiz-history-subject">${escapeHTML(h.subject)}</span>
                <span style="color:var(--text-muted);font-size:11px">${h.type}</span>
            </div>
            <span class="quiz-history-score ${scoreClass}">${h.pct}%</span>
            <span class="quiz-history-time">${dateStr}</span>
        </div>`;
    }).join('');
}

/* ---------------- 讨论交流模块 ---------------- */
const DISC_STORAGE_KEY = 'discussion_posts';
let discState = {
    currentSubjectId: null,
    currentSubjectName: '',
    authorName: localStorage.getItem('disc_author_name') || '',
    sortMode: 'latest'
};

function bindDiscussion() {
    if (!els.discSubjectList) return;

    els.discAuthorName.value = discState.authorName;
    els.discAuthorName.addEventListener('input', () => {
        discState.authorName = els.discAuthorName.value.trim();
        localStorage.setItem('disc_author_name', discState.authorName);
    });

    els.discNewPostBtn.addEventListener('click', () => {
        els.discPostForm.hidden = !els.discPostForm.hidden;
        if (!els.discPostForm.hidden) {
            els.discPostTitle.focus();
        }
    });

    els.discCancelPost.addEventListener('click', () => {
        els.discPostForm.hidden = true;
        els.discPostTitle.value = '';
        els.discPostContent.value = '';
    });

    els.discSubmitPost.addEventListener('click', submitDiscussionPost);

    // 排序按钮
    let discSortMode = 'latest';
    els.discSortBtns.querySelectorAll('.disc-sort-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            els.discSortBtns.querySelectorAll('.disc-sort-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            discSortMode = btn.dataset.sort;
            discState.sortMode = discSortMode;
            renderDiscPosts();
        });
    });

    renderDiscSubjectList();
    renderWrongBook();
    renderNotesSubjectList();
}

function renderDiscSubjectList() {
    if (!els.discSubjectList) return;
    const allPosts = JSON.parse(localStorage.getItem(DISC_STORAGE_KEY) || '{}');
    const subjects = state.subjects;

    if (subjects.length === 0) {
        els.discSubjectList.innerHTML = '<div class="disc-empty" style="padding:12px;font-size:12px">暂无科目</div>';
        return;
    }

    els.discSubjectList.innerHTML = subjects.map(s => {
        const posts = allPosts[s.id] || [];
        const isActive = discState.currentSubjectId === s.id;
        return `<div class="disc-subject-item ${isActive ? 'active' : ''}" data-subject-id="${s.id}" data-subject-name="${escapeHTML(s.name)}">
            <span>${escapeHTML(s.name)}</span>
            <span class="disc-subject-count">${posts.length}</span>
        </div>`;
    }).join('');

    els.discSubjectList.querySelectorAll('.disc-subject-item').forEach(item => {
        item.addEventListener('click', () => {
            discState.currentSubjectId = item.dataset.subjectId;
            discState.currentSubjectName = item.dataset.subjectName;
            els.discCurrentTitle.textContent = `${discState.currentSubjectName} 讨论区`;
            els.discNewPostBtn.hidden = false;
            els.discSortBtns.hidden = false;
            els.discPostForm.hidden = true;
            els.discAuthorName.value = discState.authorName;
            renderDiscSubjectList();
            renderDiscPosts();
        });
    });
}

function submitDiscussionPost() {
    const title = els.discPostTitle.value.trim();
    const content = els.discPostContent.value.trim();
    const tag = els.discPostTag.value;
    const author = discState.authorName || '匿名同学';

    if (!title) { showToast('请输入帖子标题', 'warning'); return; }
    if (!content) { showToast('请输入帖子内容', 'warning'); return; }

    const allPosts = JSON.parse(localStorage.getItem(DISC_STORAGE_KEY) || '{}');
    if (!allPosts[discState.currentSubjectId]) {
        allPosts[discState.currentSubjectId] = [];
    }

    const post = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        title, content, tag, author,
        date: new Date().toISOString(),
        likes: 0,
        liked: false,
        replies: []
    };

    allPosts[discState.currentSubjectId].unshift(post);
    localStorage.setItem(DISC_STORAGE_KEY, JSON.stringify(allPosts));

    els.discPostTitle.value = '';
    els.discPostContent.value = '';
    els.discPostForm.hidden = true;

    renderDiscSubjectList();
    renderDiscPosts();
    showToast('发布成功！', 'success');
}

function renderDiscPosts() {
    if (!els.discPostsList || !discState.currentSubjectId) return;
    const allPosts = JSON.parse(localStorage.getItem(DISC_STORAGE_KEY) || '{}');
    const posts = allPosts[discState.currentSubjectId] || [];

    if (posts.length === 0) {
        els.discPostsList.innerHTML = `<div class="disc-empty">还没有讨论，来发第一个帖子吧！</div>`;
        return;
    }

    // 标记精华帖（点赞 >= 3 或回复 >= 5）
    posts.forEach(p => { p.isEssence = (p.likes >= 3) || ((p.replies || []).length >= 5); });

    // 排序
    let sorted = [...posts];
    if (discState.sortMode === 'hot') {
        sorted.sort((a, b) => ((b.likes || 0) + (b.replies || []).length) - ((a.likes || 0) + (a.replies || []).length));
    } else if (discState.sortMode === 'essence') {
        sorted = sorted.filter(p => p.isEssence);
    }
    // 'latest' 不需要排序（已按时间倒序）

    if (sorted.length === 0 && discState.sortMode === 'essence') {
        els.discPostsList.innerHTML = '<div class="disc-empty">暂无精华帖（点赞≥3 或 回复≥5 自动成为精华）</div>';
        return;
    }

    const tagLabels = { question: '❓ 提问', share: '💡 学习心得', answer: '📝 解题技巧', resource: '📎 资源分享' };

    els.discPostsList.innerHTML = sorted.map(post => {
        const date = new Date(post.date);
        const timeStr = `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        const repliesHtml = (post.replies || []).map(r => {
            const rd = new Date(r.date);
            const rTimeStr = `${rd.getMonth() + 1}/${rd.getDate()} ${String(rd.getHours()).padStart(2, '0')}:${String(rd.getMinutes()).padStart(2, '0')}`;
            return `<div class="disc-reply-item">
                <div class="disc-reply-avatar">${r.author.charAt(0)}</div>
                <div class="disc-reply-body">
                    <div class="disc-reply-name">${escapeHTML(r.author)}</div>
                    <div class="disc-reply-text">${escapeHTML(r.content)}</div>
                    <div class="disc-reply-time">${rTimeStr}</div>
                </div>
            </div>`;
        }).join('');

        return `<div class="disc-post-card" data-post-id="${post.id}">
            <div class="disc-post-head">
                <div class="disc-post-meta">
                    <span class="disc-post-tag ${post.tag}">${tagLabels[post.tag] || post.tag}</span>
                    ${post.isEssence ? '<span class="disc-post-tag essence">⭐ 精华</span>' : ''}
                    <span class="disc-post-author">${escapeHTML(post.author)}</span>
                    <span class="disc-post-time">${timeStr}</span>
                </div>
            </div>
            <div class="disc-post-title">${escapeHTML(post.title)}</div>
            <div class="disc-post-content">${escapeHTML(post.content)}</div>
            <div class="disc-post-actions">
                <button class="disc-action-btn ${post.liked ? 'liked' : ''}" data-action="like" data-post-id="${post.id}">
                    ${post.liked ? '❤️' : '🤍'} ${post.likes || 0}
                </button>
                <button class="disc-action-btn" data-action="reply-toggle" data-post-id="${post.id}">
                    💬 回复 ${(post.replies || []).length}
                </button>
            </div>
            ${repliesHtml ? `<div class="disc-replies">${repliesHtml}</div>` : ''}
            <div class="disc-reply-form" data-for-post="${post.id}" hidden>
                <input type="text" class="disc-reply-input" placeholder="写下你的回复..." data-post-id="${post.id}" maxlength="500" />
                <button class="btn btn-primary btn-sm" data-action="submit-reply" data-post-id="${post.id}">发送</button>
            </div>
        </div>`;
    }).join('');

    // 绑定帖子内按钮
    bindDiscPostActions();
}

function bindDiscPostActions() {
    if (!els.discPostsList) return;

    // 点赞
    els.discPostsList.querySelectorAll('[data-action="like"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const postId = btn.dataset.postId;
            toggleLike(postId);
        });
    });

    // 展开/收起回复
    els.discPostsList.querySelectorAll('[data-action="reply-toggle"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const postId = btn.dataset.postId;
            const form = els.discPostsList.querySelector(`.disc-reply-form[data-for-post="${postId}"]`);
            if (form) {
                form.hidden = !form.hidden;
                if (!form.hidden) {
                    form.querySelector('.disc-reply-input').focus();
                }
            }
        });
    });

    // 提交回复
    els.discPostsList.querySelectorAll('[data-action="submit-reply"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const postId = btn.dataset.postId;
            const input = els.discPostsList.querySelector(`.disc-reply-input[data-post-id="${postId}"]`);
            if (input && input.value.trim()) {
                submitReply(postId, input.value.trim());
                input.value = '';
            }
        });
    });

    // 回车提交
    els.discPostsList.querySelectorAll('.disc-reply-input').forEach(input => {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const postId = input.dataset.postId;
                if (input.value.trim()) {
                    submitReply(postId, input.value.trim());
                    input.value = '';
                }
            }
        });
    });
}

function toggleLike(postId) {
    const allPosts = JSON.parse(localStorage.getItem(DISC_STORAGE_KEY) || '{}');
    const posts = allPosts[discState.currentSubjectId] || [];
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    if (post.liked) {
        post.likes = Math.max(0, (post.likes || 1) - 1);
        post.liked = false;
    } else {
        post.likes = (post.likes || 0) + 1;
        post.liked = true;
    }

    allPosts[discState.currentSubjectId] = posts;
    localStorage.setItem(DISC_STORAGE_KEY, JSON.stringify(allPosts));
    renderDiscPosts();
}

function submitReply(postId, content) {
    const author = discState.authorName || '匿名同学';
    const allPosts = JSON.parse(localStorage.getItem(DISC_STORAGE_KEY) || '{}');
    const posts = allPosts[discState.currentSubjectId] || [];
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    if (!post.replies) post.replies = [];
    post.replies.push({
        author,
        content,
        date: new Date().toISOString()
    });

    allPosts[discState.currentSubjectId] = posts;
    localStorage.setItem(DISC_STORAGE_KEY, JSON.stringify(allPosts));
    renderDiscPosts();
}

/* ---------------- 错题本模块 ---------------- */
const WB_KEY = 'wrong_book';

function saveWrongQuestion(q, userAnswer, subjectName) {
    const book = JSON.parse(localStorage.getItem(WB_KEY) || '[]');
    book.push({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
        question: q.question,
        correctAnswer: q.correctAnswer,
        userAnswer: userAnswer,
        type: q.type,
        subject: subjectName,
        date: new Date().toISOString(),
        mastered: false
    });
    localStorage.setItem(WB_KEY, JSON.stringify(book));
}

function bindWrongBook() {
    if (!els.wbList) return;

    // 科目筛选下拉
    els.wbSubjectFilter.addEventListener('change', renderWrongBook);

    // 清空
    els.wbClearAll.addEventListener('click', () => {
        localStorage.removeItem(WB_KEY);
        renderWrongBook();
        showToast('错题本已清空', 'info');
    });

    // 重新练习（重置所有错题为未掌握）
    els.wbRetryAll.addEventListener('click', () => {
        const book = JSON.parse(localStorage.getItem(WB_KEY) || '[]');
        book.forEach(q => q.mastered = false);
        localStorage.setItem(WB_KEY, JSON.stringify(book));
        renderWrongBook();
        showToast('已重置所有错题', 'info');
    });

    renderWrongBook();
}

function renderWrongBook() {
    if (!els.wbList) return;
    const book = JSON.parse(localStorage.getItem(WB_KEY) || '[]');
    const filter = els.wbSubjectFilter.value;
    const filtered = filter === 'all' ? book : book.filter(q => q.subject === filter);

    // 更新筛选下拉
    const subjects = [...new Set(book.map(q => q.subject))];
    const currentFilter = els.wbSubjectFilter.value;
    els.wbSubjectFilter.innerHTML = '<option value="all">全部科目</option>' +
        subjects.map(s => `<option value="${s}" ${s === currentFilter ? 'selected' : ''}>${escapeHTML(s)}</option>`).join('');

    els.wbTotal.textContent = book.length;
    els.wbMastered.textContent = book.filter(q => q.mastered).length;

    if (filtered.length === 0) {
        els.wbList.innerHTML = '<div class="disc-empty">暂无错题，测试中的错题会自动收录到这里</div>';
        return;
    }

    els.wbList.innerHTML = filtered.map(q => {
        const d = new Date(q.date);
        const timeStr = `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        return `<div class="wb-item ${q.mastered ? 'mastered' : ''}" data-id="${q.id}">
            <div class="wb-item-head">
                <span class="wb-item-subject">${escapeHTML(q.subject)}</span>
                <span class="wb-item-type">${q.type === 'choice' ? '选择题' : '填空题'} · ${timeStr}</span>
            </div>
            <div class="wb-item-q">${escapeHTML(q.question)}</div>
            <div class="wb-item-a">正确答案：<span class="c">${escapeHTML(q.correctAnswer)}</span> | 你的答案：<span class="w">${escapeHTML(q.userAnswer || '未作答')}</span></div>
            <div class="wb-item-actions">
                <button class="btn btn-sm btn-outline wb-master-btn" data-id="${q.id}">${q.mastered ? '取消掌握' : '标记掌握'}</button>
                <button class="btn btn-sm btn-outline wb-del-btn" data-id="${q.id}">删除</button>
            </div>
        </div>`;
    }).join('');

    els.wbList.querySelectorAll('.wb-master-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const book = JSON.parse(localStorage.getItem(WB_KEY) || '[]');
            const q = book.find(q => q.id === id);
            if (q) { q.mastered = !q.mastered; localStorage.setItem(WB_KEY, JSON.stringify(book)); renderWrongBook(); }
        });
    });

    els.wbList.querySelectorAll('.wb-del-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            let book = JSON.parse(localStorage.getItem(WB_KEY) || '[]');
            book = book.filter(q => q.id !== id);
            localStorage.setItem(WB_KEY, JSON.stringify(book));
            renderWrongBook();
        });
    });
}

/* ---------------- 学习笔记模块 ---------------- */
const NOTES_KEY = 'study_notes';
let notesState = { currentSubjectId: null, currentSubjectName: '', editingNoteId: null };

function bindNotes() {
    if (!els.notesSubjectList) return;
    els.notesNewBtn.addEventListener('click', () => {
        notesState.editingNoteId = null;
        els.notesTitleInput.value = '';
        els.notesContentInput.value = '';
        els.notesEditor.hidden = false;
        els.notesTitleInput.focus();
    });
    els.notesCancelBtn.addEventListener('click', () => { els.notesEditor.hidden = true; });
    els.notesSaveBtn.addEventListener('click', saveNote);
    renderNotesSubjectList();
}

function renderNotesSubjectList() {
    if (!els.notesSubjectList) return;
    const notes = JSON.parse(localStorage.getItem(NOTES_KEY) || '{}');
    els.notesSubjectList.innerHTML = state.subjects.map(s => {
        const count = (notes[s.id] || []).length;
        const isActive = notesState.currentSubjectId === s.id;
        return `<div class="disc-subject-item ${isActive ? 'active' : ''}" data-sid="${s.id}" data-sname="${escapeHTML(s.name)}">
            <span>${escapeHTML(s.name)}</span><span class="disc-subject-count">${count}</span></div>`;
    }).join('');
    els.notesSubjectList.querySelectorAll('.disc-subject-item').forEach(item => {
        item.addEventListener('click', () => {
            notesState.currentSubjectId = item.dataset.sid;
            notesState.currentSubjectName = item.dataset.sname;
            els.notesCurrentTitle.textContent = `${notesState.currentSubjectName} 笔记`;
            els.notesNewBtn.hidden = false;
            els.notesEditor.hidden = true;
            renderNotesSubjectList();
            renderNotesList();
        });
    });
}

function saveNote() {
    const title = els.notesTitleInput.value.trim();
    const content = els.notesContentInput.value.trim();
    if (!title) { showToast('请输入笔记标题', 'warning'); return; }
    const notes = JSON.parse(localStorage.getItem(NOTES_KEY) || '{}');
    if (!notes[notesState.currentSubjectId]) notes[notesState.currentSubjectId] = [];

    if (notesState.editingNoteId) {
        const note = notes[notesState.currentSubjectId].find(n => n.id === notesState.editingNoteId);
        if (note) { note.title = title; note.content = content; note.updatedAt = new Date().toISOString(); }
    } else {
        notes[notesState.currentSubjectId].unshift({
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
            title, content,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
    }
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
    els.notesEditor.hidden = true;
    els.notesTitleInput.value = '';
    els.notesContentInput.value = '';
    notesState.editingNoteId = null;
    renderNotesSubjectList();
    renderNotesList();
    showToast('笔记已保存', 'success');
}

function renderNotesList() {
    if (!els.notesList || !notesState.currentSubjectId) return;
    const notes = JSON.parse(localStorage.getItem(NOTES_KEY) || '{}');
    const list = notes[notesState.currentSubjectId] || [];
    if (list.length === 0) {
        els.notesList.innerHTML = '<div class="disc-empty">还没有笔记，点击右上角新建</div>';
        return;
    }
    els.notesList.innerHTML = list.map(n => {
        const d = new Date(n.updatedAt || n.createdAt);
        const timeStr = `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        return `<div class="notes-card" data-id="${n.id}">
            <div class="notes-card-title">${escapeHTML(n.title)}</div>
            <div class="notes-card-preview">${escapeHTML(n.content)}</div>
            <div class="notes-card-time">${timeStr}</div>
            <div class="notes-card-actions">
                <button class="btn btn-sm btn-outline notes-edit-btn" data-id="${n.id}">编辑</button>
                <button class="btn btn-sm btn-outline notes-del-btn" data-id="${n.id}">删除</button>
            </div>
        </div>`;
    }).join('');

    els.notesList.querySelectorAll('.notes-edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            const notes = JSON.parse(localStorage.getItem(NOTES_KEY) || '{}');
            const note = notes[notesState.currentSubjectId].find(n => n.id === id);
            if (note) {
                notesState.editingNoteId = id;
                els.notesTitleInput.value = note.title;
                els.notesContentInput.value = note.content;
                els.notesEditor.hidden = false;
            }
        });
    });
    els.notesList.querySelectorAll('.notes-del-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            const notes = JSON.parse(localStorage.getItem(NOTES_KEY) || '{}');
            notes[notesState.currentSubjectId] = notes[notesState.currentSubjectId].filter(n => n.id !== id);
            localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
            renderNotesSubjectList();
            renderNotesList();
        });
    });
}

/* ---------------- 每日打卡模块 ---------------- */
const CHECKIN_KEY = 'checkin_days';

function bindCheckin() {
    if (!els.checkinBtn) return;

    // 显示今天日期
    const now = new Date();
    els.checkinDate.textContent = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()}`;

    els.checkinBtn.addEventListener('click', doCheckin);

    // 快速打卡按钮（左上角）
    if (els.checkinQuickBtn) {
        els.checkinQuickBtn.addEventListener('click', doCheckin);
    }

    renderCheckin();
}

function doCheckin() {
    const days = JSON.parse(localStorage.getItem(CHECKIN_KEY) || '[]');
    const today = new Date().toISOString().split('T')[0];
    if (days.includes(today)) {
        showToast('今天已经打过卡了', 'info');
        return;
    }
    days.push(today);
    localStorage.setItem(CHECKIN_KEY, JSON.stringify(days));
    els.checkinBtn.textContent = '已打卡';
    els.checkinBtn.classList.add('done');
    renderCheckin();
    showToast('打卡成功！继续保持', 'success');
}

function getStreak(days) {
    if (days.length === 0) return 0;
    const sorted = [...days].sort().reverse();
    const today = new Date().toISOString().split('T')[0];
    let streak = 0;
    let checkDate = new Date(today);
    for (let i = 0; i < 365; i++) {
        const ds = checkDate.toISOString().split('T')[0];
        if (sorted.includes(ds)) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }
    return streak;
}

function getMaxStreak(days) {
    if (days.length === 0) return 0;
    const sorted = [...days].sort();
    let max = 1, cur = 1;
    for (let i = 1; i < sorted.length; i++) {
        const prev = new Date(sorted[i - 1]);
        const curr = new Date(sorted[i]);
        const diff = (curr - prev) / (1000 * 60 * 60 * 24);
        cur = Math.abs(diff - 1) < 0.01 ? cur + 1 : 1;
        max = Math.max(max, cur);
    }
    return max;
}

function renderCheckin() {
    if (!els.checkinCalendar) return;
    const days = JSON.parse(localStorage.getItem(CHECKIN_KEY) || '[]');
    const streak = getStreak(days);
    const today = new Date().toISOString().split('T')[0];

    // 更新打卡按钮状态
    if (days.includes(today)) {
        els.checkinBtn.textContent = '已打卡';
        els.checkinBtn.classList.add('done');
    }

    // 更新快速打卡按钮
    if (els.checkinQuickBtn) {
        if (days.includes(today)) {
            els.checkinQuickBtn.classList.add('done');
        } else {
            els.checkinQuickBtn.classList.remove('done');
        }
    }
    if (els.checkinQuickStreak) {
        els.checkinQuickStreak.textContent = streak > 0 ? streak : '';
    }

    els.checkinStreak.textContent = streak;
    els.checkinTotalDays.textContent = days.length;
    els.checkinMaxStreak.textContent = getMaxStreak(days);

    // 本月打卡
    const monthPrefix = today.substring(0, 7);
    const monthDays = days.filter(d => d.startsWith(monthPrefix)).length;
    els.checkinMonthDays.textContent = monthDays;

    // 渲染日历
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const headers = ['日', '一', '二', '三', '四', '五', '六'];

    let calHtml = headers.map(h => `<div class="cal-header">${h}</div>`).join('');
    for (let i = 0; i < firstDay; i++) calHtml += '<div class="cal-day empty"></div>';
    for (let d = 1; d <= daysInMonth; d++) {
        const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const classes = ['cal-day'];
        if (days.includes(ds)) classes.push('checked');
        if (ds === today) classes.push('today');
        calHtml += `<div class="${classes.join(' ')}">${d}</div>`;
    }
    els.checkinCalendar.innerHTML = calHtml;
}

/* ---------------- 成就系统 ---------------- */
const ACHIEVEMENTS = [
    { id: 'first_subject', icon: '📖', name: '初次登场', desc: '添加第一个科目', check: () => state.subjects.length >= 1 },
    { id: 'five_subjects', icon: '📚', name: '博览群书', desc: '添加5个科目', check: () => state.subjects.length >= 5 },
    { id: 'first_test', icon: '✏️', name: '初试锋芒', desc: '完成第一次测试', check: () => JSON.parse(localStorage.getItem('quizHistory') || '[]').length >= 1 },
    { id: 'ten_tests', icon: '📝', name: '题海战术', desc: '完成10次测试', check: () => JSON.parse(localStorage.getItem('quizHistory') || '[]').length >= 10 },
    { id: 'perfect_score', icon: '💯', name: '满分达人', desc: '测试正确率100%', check: () => JSON.parse(localStorage.getItem('quizHistory') || '[]').some(h => h.pct === 100) },
    { id: 'first_checkin', icon: '🔥', name: '初燃之火', desc: '首次打卡', check: () => JSON.parse(localStorage.getItem(CHECKIN_KEY) || '[]').length >= 1 },
    { id: 'streak_3', icon: '⚡', name: '三日连击', desc: '连续打卡3天', check: () => getStreak(JSON.parse(localStorage.getItem(CHECKIN_KEY) || '[]')) >= 3 },
    { id: 'streak_7', icon: '🌟', name: '周打卡王', desc: '连续打卡7天', check: () => getStreak(JSON.parse(localStorage.getItem(CHECKIN_KEY) || '[]')) >= 7 },
    { id: 'streak_30', icon: '👑', name: '月度学霸', desc: '连续打卡30天', check: () => getStreak(JSON.parse(localStorage.getItem(CHECKIN_KEY) || '[]')) >= 30 },
    { id: 'first_note', icon: '📝', name: '勤学好记', desc: '记录第一条笔记', check: () => Object.values(JSON.parse(localStorage.getItem(NOTES_KEY) || '{}')).flat().length >= 1 },
    { id: 'ten_notes', icon: '📓', name: '笔记达人', desc: '累计10条笔记', check: () => Object.values(JSON.parse(localStorage.getItem(NOTES_KEY) || '{}')).flat().length >= 10 },
    { id: 'first_post', icon: '💬', name: '社交达人', desc: '发布第一条讨论帖', check: () => Object.values(JSON.parse(localStorage.getItem(DISC_STORAGE_KEY) || '{}')).flat().length >= 1 },
    { id: 'master_wrong', icon: '✅', name: '知错能改', desc: '掌握第一道错题', check: () => JSON.parse(localStorage.getItem(WB_KEY) || '[]').some(q => q.mastered) },
    { id: 'all_mastered', icon: '🎯', name: '错题清零', desc: '所有错题标记掌握', check: () => { const b = JSON.parse(localStorage.getItem(WB_KEY) || '[]'); return b.length > 0 && b.every(q => q.mastered); } }
];

function renderAchievements() {
    if (!els.achievementList) return;
    const unlocked = JSON.parse(localStorage.getItem('achievements_unlocked') || '[]');
    els.achievementList.innerHTML = ACHIEVEMENTS.map(a => {
        const isUnlocked = unlocked.includes(a.id) || a.check();
        if (isUnlocked && !unlocked.includes(a.id)) {
            unlocked.push(a.id);
            localStorage.setItem('achievements_unlocked', JSON.stringify(unlocked));
        }
        return `<div class="achievement-item ${isUnlocked ? 'unlocked' : 'locked'}" title="${escapeHTML(a.desc)}">
            <div class="achievement-icon">${a.icon}</div>
            <div class="achievement-name">${escapeHTML(a.name)}</div>
            <div class="achievement-desc">${escapeHTML(a.desc)}</div>
        </div>`;
    }).join('');
}

/* ---------------- 学习数据周报 ---------------- */
function renderWeeklyReport() {
    if (!els.weeklyReport) return;

    const quizHistory = JSON.parse(localStorage.getItem('quizHistory') || '[]');
    const checkinDays = JSON.parse(localStorage.getItem(CHECKIN_KEY) || '[]');
    const wrongBook = JSON.parse(localStorage.getItem(WB_KEY) || '[]');
    const notes = Object.values(JSON.parse(localStorage.getItem(NOTES_KEY) || '{}')).flat();
    const posts = Object.values(JSON.parse(localStorage.getItem(DISC_STORAGE_KEY) || '{}')).flat();

    // 本周数据筛选
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weekQuizzes = quizHistory.filter(h => new Date(h.date) >= weekStart);
    const weekCheckins = checkinDays.filter(d => new Date(d) >= weekStart);
    const weekNotes = notes.filter(n => new Date(n.createdAt) >= weekStart);
    const weekPosts = posts.filter(p => new Date(p.date) >= weekStart);

    const avgScore = weekQuizzes.length > 0 ? Math.round(weekQuizzes.reduce((s, h) => s + h.pct, 0) / weekQuizzes.length) : 0;
    const masteredWrong = wrongBook.filter(q => q.mastered && new Date(q.date) >= weekStart).length;

    els.weeklyReport.innerHTML = `
        <div class="weekly-stat">
            <span class="weekly-stat-val">${weekQuizzes.length}</span>
            <span class="weekly-stat-label">本周测试</span>
        </div>
        <div class="weekly-stat">
            <span class="weekly-stat-val">${avgScore}%</span>
            <span class="weekly-stat-label">平均正确率</span>
        </div>
        <div class="weekly-stat">
            <span class="weekly-stat-val">${weekCheckins.length}</span>
            <span class="weekly-stat-label">本周打卡</span>
        </div>
        <div class="weekly-stat">
            <span class="weekly-stat-val">${weekNotes.length}</span>
            <span class="weekly-stat-label">新增笔记</span>
        </div>
        <div class="weekly-stat">
            <span class="weekly-stat-val">${weekPosts.length}</span>
            <span class="weekly-stat-label">讨论发帖</span>
        </div>
        <div class="weekly-stat">
            <span class="weekly-stat-val">${masteredWrong}</span>
            <span class="weekly-stat-label">错题掌握</span>
        </div>
    `;
}

/* ---------------- 使用指南 ---------------- */
function renderGuide() {
    if (!els.guideContent) return;
    const sections = [
        {
            icon: '🚀', title: '快速开始',
            items: [
                '<strong>第一步</strong>：点击左上角 <kbd>☰</kbd> 菜单按钮，打开功能导航',
                '<strong>第二步</strong>：进入「科目管理」添加你的考试科目',
                '<strong>第三步</strong>：为每个科目填写复习重点（每行一个），或点击「AI 推荐重点」自动生成',
                '<strong>第四步</strong>：进入「时间设置」，设定考试日期和可复习时间段',
                '<strong>第五步</strong>：点击「生成计划」，系统自动分配每日复习任务'
            ]
        },
        {
            icon: '📖', title: '科目管理',
            items: [
                '填写科目名称（如"高等数学"），选择难度等级',
                '设置上次模拟考分（可选），系统会对弱项科目加强复习',
                '在复习重点框中输入知识点，每行一个',
                '点击「AI 推荐重点」可根据科目名自动生成推荐重点',
                '点击「上传提取重点」可从 PDF/Word 文件中提取知识点'
            ]
        },
        {
            icon: '⏰', title: '时间设置',
            items: [
                '设定考试日期，系统自动计算剩余天数',
                '点击热力图中的格子或列表添加可复习时间',
                '支持设置多个时间段（上午、下午、晚上）',
                '可选开启「艾宾浩斯遗忘曲线」，系统会智能安排重复复习'
            ]
        },
        {
            icon: '📋', title: '复习计划',
            items: [
                '点击「生成计划」按钮自动创建每日复习安排',
                '计划会根据科目难度、重点数量、可用时间智能分配',
                '每条任务可以标记为「已完成」',
                '点击「重新生成」可重新打乱计划',
                '支持导出计划为 JSON 文件备份'
            ]
        },
        {
            icon: '📊', title: '仪表盘',
            items: [
                '查看「学习热力图」了解复习时间分布',
                '查看「科目掌握度」雷达图了解各科进度',
                '查看「复习趋势」折线图了解每日完成情况',
                '查看「成就墙」解锁徽章（连续打卡、满分测试等）',
                '查看「本周学习报告」了解本周数据统计'
            ]
        },
        {
            icon: '🤖', title: 'AI 助手',
            items: [
                '可以对话式询问学习方法建议',
                '输入问题获取解题思路和知识点讲解',
                '支持针对具体科目提供复习建议'
            ]
        },
        {
            icon: '🍅', title: '专注模式（番茄钟）',
            items: [
                '选择时长（25/45/60 分钟）',
                '点击「开始专注」进入倒计时',
                '按 <kbd>空格</kbd> 键可快速暂停/继续',
                '计时结束会有声音提醒',
                '可查看今日专注总时长和累计专注时间'
            ]
        },
        {
            icon: '📝', title: '自我测试',
            items: [
                '选择科目、题型（选择题/填空题/混合）和题量',
                '点击「开始测试」进入答题',
                '选择题点击选项，填空题手动输入',
                '提交后即时显示对错反馈和正确答案',
                '测试结束后显示圆环正确率统计和用时',
                '答错的题目会<strong>自动收录到错题本</strong>'
            ]
        },
        {
            icon: '💬', title: '讨论交流',
            items: [
                '选择左侧科目进入对应讨论区',
                '发帖支持 4 种类型：提问、学习心得、解题技巧、资源分享',
                '帖子支持点赞（❤️）和回复',
                '支持按「最新/最热/精华」排序',
                '点赞≥3 或回复≥5 自动成为精华帖'
            ]
        },
        {
            icon: '📒', title: '错题本',
            items: [
                '测试中答错的题目<strong>自动收录</strong>',
                '支持按科目筛选',
                '可以标记「已掌握」来标记已解决的错题',
                '点击「重新练习」重置所有错题为未掌握',
                '也可以手动删除不需要的错题'
            ]
        },
        {
            icon: '📝', title: '学习笔记',
            items: [
                '选择科目后，点击「+ 新建笔记」',
                '填写标题和内容，支持记录公式、知识点、心得',
                '支持编辑已有笔记',
                '笔记按科目分类管理'
            ]
        },
        {
            icon: '🔥', title: '每日打卡',
            items: [
                '点击左上角 <kbd>🔥</kbd> 按钮一键打卡（任何页面都可以）',
                '连续打卡会显示连续天数和火焰图标',
                '打卡日历可视化本月打卡情况',
                '统计累计打卡天数和最长连续记录'
            ]
        },
        {
            icon: '🏆', title: '成就系统',
            items: [
                '仪表盘中查看「成就墙」',
                '14 个成就徽章等你解锁：初次登场、博览群书、题海战术、满分达人等',
                '连续打卡 3/7/30 天分别解锁不同徽章',
                '所有错题标记掌握解锁「错题清零」成就'
            ]
        },
        {
            icon: '⌨️', title: '快捷键',
            items: [
                '<kbd>1</kbd>~<kbd>8</kbd> — 快速切换对应 tab',
                '<kbd>空格</kbd> — 在专注页面暂停/继续计时',
                '<kbd>D</kbd> — 切换深色/浅色模式',
                '注意：在输入框中快捷键不会触发'
            ]
        },
        {
            icon: '💡', title: '小贴士',
            items: [
                '数据保存在浏览器本地，建议定期点击「导出数据」备份',
                '换浏览器或清除缓存会丢失数据，请及时备份',
                '点击「演示数据」可以快速体验所有功能',
                '可以自定义主题颜色，点击「个性调色板」设置',
                '开启艾宾浩斯曲线会让复习效果更好，但需要更多时间'
            ]
        }
    ];

    els.guideContent.innerHTML = `
        <div class="guide-hero">
            <h2>📖 期末复习助手使用指南</h2>
            <p>从零开始，高效备战期末考试</p>
        </div>
        ${sections.map(s => `
            <div class="guide-section">
                <h3 class="guide-section-title">${s.icon} ${s.title}</h3>
                <ul class="guide-list">
                    ${s.items.map(item => `<li>${item}</li>`).join('')}
                </ul>
            </div>
        `).join('')}
    `;
}

/* ---------------- 统计 ---------------- */
function updateStats() {
    const totalPoints = state.subjects.reduce((s, x) => s + x.points.length, 0);
    const completed = state.schedule.filter(s => s.completed).length;
    const totalHours = state.timeSlots.reduce((s, t) => s + computeSlotHours(t), 0);
    const total = state.schedule.length;

    els.statSubjects.textContent = state.subjects.length;
    els.statPoints.textContent = totalPoints;
    els.statCompleted.textContent = completed;
    els.statTime.textContent = `${Math.round(totalHours)}h`;

    if (els.overallProgress && els.progressText) {
        const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
        els.overallProgress.style.width = `${pct}%`;
        els.progressText.textContent = `${completed} / ${total} 已完成 (${pct}%)`;
    }

    renderAchievements();
    renderWeeklyReport();
}

function renderAll() {
    renderSubjects();
    renderTimeSlots();
    renderSchedule();
    updateStats();
    renderProgressPanel();
    updateQuizSubjects();
    renderDiscSubjectList();
}

/* ---------------- 演示数据 ---------------- */
function bindDemoData() {
    if (!els.demoBtn) return;

    // 创建弹窗
    const modal = document.createElement('div');
    modal.className = 'demo-modal';
    modal.id = 'demoModal';
    modal.innerHTML = `
        <div class="demo-modal-content">
            <div class="demo-modal-title">🎬 选择演示场景</div>
            <div class="demo-scenarios" id="demoScenarios"></div>
        </div>
    `;
    document.body.appendChild(modal);

    const container = modal.querySelector('#demoScenarios');
    getScenarios().forEach(s => {
        const btn = document.createElement('button');
        btn.className = 'demo-scenario-btn';
        btn.innerHTML = `<strong>${escapeHTML(s.name)}</strong>`;
        btn.addEventListener('click', () => {
            const data = generateDemoData(s.key);
            state.subjects = data.subjects;
            state.timeSlots = data.timeSlots;
            state.settings = data.settings;
            saveSubjects(state.subjects);
            saveTimeSlots(state.timeSlots);
            saveSettings(state.settings);

            // 自动生成计划并标记部分完成
            const items = generateSchedule(state.subjects, state.timeSlots, {
                useEbbinghaus: state.settings.useEbbinghaus
            });
            state.schedule = generateCompletedSchedule(items, 0.4);
            saveSchedule(state.schedule);

            renderAll();
            startReminder(state.schedule, renderSchedule);
            modal.classList.remove('show');
            toast(`🎉 已加载「${s.name}」演示数据！`, 'success');
        });
        container.appendChild(btn);
    });

    els.demoBtn.addEventListener('click', () => {
        modal.classList.add('show');
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('show');
    });
}

/* ---------------- AI 助手 ---------------- */
function bindAIChat() {
    if (!els.aiAnalyzeBtn) return;

    els.aiAnalyzeBtn.addEventListener('click', () => {
        const result = analyze(state.subjects, state.timeSlots);
        renderAIReport(result, 'aiReport');
        toast('分析完成！', 'success');
    });

    const sendMessage = () => {
        const text = els.aiChatInput.value.trim();
        if (!text) return;
        addChatBubble('user', text);
        els.aiChatInput.value = '';

        const reply = chatResponse(text, {
            subjects: state.subjects,
            timeSlots: state.timeSlots,
            schedule: state.schedule
        });
        setTimeout(() => addChatBubble('assistant', reply), 400);
    };

    els.aiChatSend.addEventListener('click', sendMessage);
    els.aiChatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
}

function addChatBubble(role, text) {
    if (!els.aiChatHistory) return;
    const bubble = document.createElement('div');
    bubble.className = `ai-chat-bubble ${role}`;
    bubble.textContent = text;
    els.aiChatHistory.appendChild(bubble);
    els.aiChatHistory.scrollTop = els.aiChatHistory.scrollHeight;
}

/* ---------------- 主题 ---------------- */
function applyTheme(theme) {
    // theme: 'auto' | 'light' | 'dark'
    if (theme === 'auto') {
        document.documentElement.removeAttribute('data-theme');
    } else {
        document.documentElement.setAttribute('data-theme', theme);
    }
    saveTheme(theme);
    els.themeToggle.textContent = theme === 'dark' ? '☀️' : '🌗';
}

function bindThemeToggle() {
    const current = loadTheme();
    applyTheme(current);
    els.themeToggle.addEventListener('click', () => {
        const cur = loadTheme();
        const next = cur === 'dark' ? 'light' : cur === 'light' ? 'auto' : 'dark';
        applyTheme(next);
        toast(`主题：${next === 'auto' ? '跟随系统' : next === 'dark' ? '深色' : '浅色'}`, 'success');
    });
}

/* ---------------- 导入 / 导出 ---------------- */
function bindDataIO() {
    els.exportBtn.addEventListener('click', () => {
        exportData(state);
        toast('已导出为 JSON 文件', 'success');
    });
    els.importBtn.addEventListener('click', () => els.importFile.click());
    els.importFile.addEventListener('change', async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        try {
            if (!confirm('导入将覆盖当前所有数据，确定继续？')) {
                els.importFile.value = '';
                return;
            }
            const data = await importData(file);
            state.subjects = data.subjects;
            state.timeSlots = data.timeSlots;
            state.schedule = data.schedule;
            state.settings = data.settings;
            saveSubjects(state.subjects);
            saveTimeSlots(state.timeSlots);
            saveSchedule(state.schedule);
            saveSettings(state.settings);
            // 恢复扩展数据到 localStorage
            if (data.extra && typeof data.extra === 'object') {
                Object.entries(data.extra).forEach(([key, val]) => {
                    try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* skip */ }
                });
            }
            els.curveToggle.checked = state.settings.useEbbinghaus;
            renderAll();
            toast('导入成功', 'success');
        } catch (err) {
            console.error(err);
            toast('导入失败：' + err.message, 'error');
        } finally {
            els.importFile.value = '';
        }
    });
}

/* ---------------- Toast ---------------- */
let toastTimer = null;
function toast(msg, type = '') {
    els.toast.textContent = msg;
    els.toast.className = 'toast show ' + type;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        els.toast.className = 'toast';
    }, 2400);
}

function emptyState(emoji, text, hint) {
    return `
        <div class="empty-state">
            <div class="emoji">${emoji}</div>
            <div>${escapeHTML(text)}</div>
            <div class="hint">${escapeHTML(hint)}</div>
        </div>
    `;
}

/* ---------------- 启动 ---------------- */
document.addEventListener('DOMContentLoaded', init);

/* ===========================
   交互动效增强
   =========================== */

/* --- 全局涟漪效果 --- */
document.addEventListener('pointerdown', (e) => {
    const btn = e.target.closest('.btn, .icon-btn, .diff-btn, .tab, .focus-preset, .demo-scenario-btn');
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'ripple-effect';
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
    ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
    btn.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
});

/* --- 数字滚动动画 --- */
function animateNumber(el, target, duration = 400) {
    if (!el) return;
    const start = parseInt(el.textContent, 10) || 0;
    if (start === target) return;
    const startTime = performance.now();
    const diff = target - start;

    el.classList.add('bounce');
    setTimeout(() => el.classList.remove('bounce'), 400);

    function step(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // easeOutCubic
        const ease = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(start + diff * ease);
        el.textContent = current;
        if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

// 覆盖 updateStats 使用数字滚动
const _origUpdateStats = updateStats;
updateStats = function () {
    const totalPoints = state.subjects.reduce((s, x) => s + x.points.length, 0);
    const completed = state.schedule.filter(s => s.completed).length;
    const totalHours = state.timeSlots.reduce((s, t) => s + computeSlotHours(t), 0);
    const total = state.schedule.length;

    animateNumber(els.statSubjects, state.subjects.length);
    animateNumber(els.statPoints, totalPoints);
    animateNumber(els.statCompleted, completed);

    // 时间单独处理
    const hoursText = `${Math.round(totalHours)}h`;
    if (els.statTime.textContent !== hoursText) {
        els.statTime.style.transition = 'transform 0.2s';
        els.statTime.style.transform = 'translateY(-4px)';
        els.statTime.style.opacity = '0';
        setTimeout(() => {
            els.statTime.textContent = hoursText;
            els.statTime.style.transform = 'translateY(0)';
            els.statTime.style.opacity = '1';
        }, 150);
    }

    if (els.overallProgress && els.progressText) {
        const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
        els.overallProgress.style.width = `${pct}%`;
        els.progressText.textContent = `${completed} / ${total} 已完成 (${pct}%)`;
    }

    renderProgressPanel();
};

/* --- AI 打字机效果 --- */
const _origAddBubble = addChatBubble;
addChatBubble = function (role, text) {
    if (!els.aiChatHistory || role !== 'assistant') {
        _origAddBubble(role, text);
        return;
    }
    const bubble = document.createElement('div');
    bubble.className = 'ai-chat-bubble assistant';
    els.aiChatHistory.appendChild(bubble);

    let i = 0;
    const speed = 20;
    function type() {
        if (i < text.length) {
            bubble.textContent += text[i];
            i++;
            els.aiChatHistory.scrollTop = els.aiChatHistory.scrollHeight;
            setTimeout(type, speed);
        }
    }
    type();
};
