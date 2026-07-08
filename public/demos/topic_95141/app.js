let currentMonth = new Date();
let charts = {};

// ===== 勋章定义 =====
const MEDALS = [
    { id: 'first_challenge', name: '初试锋芒', desc: '完成首次闯关', icon: '🏆' },
    { id: 'score_100', name: '破茧成蝶', desc: '累计获得100积分', icon: '🦋' },
    { id: 'perfect_round', name: '百发百中', desc: '单次闯关100%正确率', icon: '🎯' },
    { id: 'explorer', name: '探索之旅', desc: '闯过3个知识点', icon: '🧭' },
    { id: 'streak_3', name: '持之以恒', desc: '连续打卡3天', icon: '🔥' },
    { id: 'mastered', name: '完美通关', desc: '某知识点达到100%掌握', icon: '💯' },
    { id: 'score_500', name: '学有小成', desc: '累计获得500积分', icon: '🎖️' },
    { id: 'knowledge_5', name: '知识克星', desc: '掌握5个知识点', icon: '📚' },
    { id: 'score_1000', name: '学霸巅峰', desc: '累计获得1000积分', icon: '👑' },
    { id: 'all_subjects', name: '融会贯通', desc: '数学+语文+英语各掌握3个', icon: '🌟' }
];

// 积分奖励配置
const SCORE_REWARDS = {
    COMPLETE_CHALLENGE: 10,      // 完成闯关基础分
    DIFFICULTY_MULTIPLIER: { bronze: 1, silver: 1.5, gold: 2, king: 3 },  // 难度倍数
    FIRST_PASS: 50,              // 首次通关奖励
    STREAK_3: 20,               // 连续3天
    STREAK_7: 50,              // 连续7天
    STREAK_30: 200,             // 连续30天
    HIGH_ACCURACY: 10,           // 正确率80%+
    PERFECT_STREAK: 15           // 连续答对5题
};

// 闯关难度配置
const CHALLENGE_LEVELS = {
    bronze: { minMastery: 0, maxMastery: 30, questions: 3, passRate: 0.6, icon: 'bronze' },
    silver: { minMastery: 30, maxMastery: 60, questions: 5, passRate: 0.7, icon: 'silver' },
    gold: { minMastery: 60, maxMastery: 80, questions: 5, passRate: 0.8, icon: 'gold' },
    king: { minMastery: 80, maxMastery: 100, questions: 8, passRate: 0.9, icon: 'king' }
};

// 当前闯关状态
let currentChallenge = {
    subject: 'math',
    knowledge: null,
    questions: [],
    currentIndex: 0,
    answers: {},
    correctCount: 0,
    level: 'bronze'
};

document.addEventListener('DOMContentLoaded', () => {
    // Show loading overlay during initialization
    showLoading('正在初始化...');

    // Initialize user system first
    initUserSystem();

    // Initialize grade/textbook selectors
    initGradeSelectors();

    initNavigation();
    initCalendar();
    initCharts();
    initKnowledgeGraph();
    initChallenge();
    initWrongBook();
    initAchievement();
    initGuardianPortal();
    initAnalysis();

    // Animate progress bars on initial load
    setTimeout(() => {
        animateProgressBars();
        updateMedalShowcase();
        updateScoreDisplay();
        hideLoading();
    }, 500);

    // Add initial page animation trigger
    triggerPageAnimations('dashboard');
});

// ==================== User System ====================

function initUserSystem() {
    // Check if users exist, if not create default users
    const users = dataStore.getUsers();
    if (users.length === 0) {
        dataStore.createDefaultUsers();
    }

    // Ensure current user is set
    const currentUser = dataStore.getCurrentUser();
    if (!currentUser) {
        const allUsers = dataStore.getUsers();
        if (allUsers.length > 0) {
            dataStore.switchUser(allUsers[0].id);
        }
    }

    // Update UI
    updateUserSwitcherUI();

    // Setup event listeners
    setupUserSwitcherEvents();
}

function updateUserSwitcherUI() {
    const currentUser = dataStore.getCurrentUser();
    if (!currentUser) return;

    const avatarEl = document.getElementById('user-avatar');
    const nameEl = document.getElementById('user-name');
    if (avatarEl) {
        const avatarData = currentUser.avatar;
        if (typeof avatarData === 'object' && avatarData.icon) {
            avatarEl.textContent = avatarData.icon;
            avatarEl.style.background = avatarData.color;
            avatarEl.style.color = 'white';
        } else {
            avatarEl.textContent = avatarData;
        }
    }
    if (nameEl) nameEl.textContent = currentUser.name;

    const userListEl = document.getElementById('user-list');
    if (userListEl) {
        const users = dataStore.getUsers();
        userListEl.innerHTML = users.map(user => {
            const avatarData = user.avatar;
            const icon = typeof avatarData === 'object' && avatarData.icon ? avatarData.icon : avatarData;
            const color = typeof avatarData === 'object' && avatarData.color ? avatarData.color : '';
            const style = color ? `style="background: ${color}"` : '';
            return `
            <div class="user-item ${user.id === currentUser.id ? 'active' : ''}" data-user-id="${user.id}">
                <div class="user-avatar" ${style}>${icon}</div>
                <span class="user-name">${user.name}</span>
            </div>
        `}).join('');

        userListEl.querySelectorAll('.user-item').forEach(item => {
            item.addEventListener('click', () => {
                const userId = item.dataset.userId;
                switchToUser(userId);
            });
        });
    }
}

function setupUserSwitcherEvents() {
    const userSwitcher = document.getElementById('user-switcher');
    const currentUserEl = document.getElementById('current-user');
    const addUserBtn = document.getElementById('btn-add-user');
    const createDialog = document.getElementById('create-user-dialog');
    const cancelBtn = document.getElementById('cancel-create-user');
    const confirmBtn = document.getElementById('confirm-create-user');
    const newUserNameInput = document.getElementById('new-user-name');

    // Toggle dropdown
    if (currentUserEl) {
        currentUserEl.addEventListener('click', (e) => {
            e.stopPropagation();
            userSwitcher.classList.toggle('open');
        });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
        if (userSwitcher) userSwitcher.classList.remove('open');
    });

    // Add user button
    if (addUserBtn) {
        addUserBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showCreateUserDialog();
        });
    }

    // Cancel create user
    if (cancelBtn) {
        cancelBtn.addEventListener('click', hideCreateUserDialog);
    }

    // Confirm create user
    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            const name = newUserNameInput.value.trim();
            if (name) {
                createNewUser(name);
                newUserNameInput.value = '';
                hideCreateUserDialog();
            }
        });
    }

    // Enter key to create user
    if (newUserNameInput) {
        newUserNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const name = newUserNameInput.value.trim();
                if (name) {
                    createNewUser(name);
                    newUserNameInput.value = '';
                    hideCreateUserDialog();
                }
            }
        });
    }

    // Close dialog on overlay click
    if (createDialog) {
        createDialog.addEventListener('click', (e) => {
            if (e.target === createDialog) {
                hideCreateUserDialog();
            }
        });
    }
}

function showCreateUserDialog() {
    const dialog = document.getElementById('create-user-dialog');
    if (dialog) dialog.classList.add('active');
    const input = document.getElementById('new-user-name');
    if (input) setTimeout(() => input.focus(), 100);
}

function hideCreateUserDialog() {
    const dialog = document.getElementById('create-user-dialog');
    if (dialog) dialog.classList.remove('active');
}

function createNewUser(name) {
    const newUser = dataStore.createUser(name);
    dataStore.switchUser(newUser.id);

    // Initialize empty data for new user
    dataStore.set(dataStore.getUserDataKey(dataStore.keys.WRONG_ANSWERS), []);
    dataStore.set(dataStore.getUserDataKey(dataStore.keys.EXAM_HISTORY), []);
    dataStore.set(dataStore.getUserDataKey(dataStore.keys.STUDY_DAYS), []);
    dataStore.set(dataStore.getUserDataKey(dataStore.keys.KNOWLEDGE_MASTERY), {});
    dataStore.set(dataStore.getUserDataKey(dataStore.keys.USER_SETTINGS), {
        defaultSubject: 'math',
        defaultDifficulty: 'auto',
        defaultCount: 10,
        darkMode: false
    });

    // Refresh UI
    updateUserSwitcherUI();
    refreshAllData();
}

function switchToUser(userId) {
    const user = dataStore.switchUser(userId);
    if (user) {
        updateUserSwitcherUI();
        refreshAllData();
    }
}

function refreshAllData() {
    // Refresh all data-dependent UI components
    refreshDashboard();
    refreshWrongBook();
    refreshAnalysis();
    updateCharts();
}

function refreshDashboard() {
    const mastery = dataStore.getMastery();
    const studyDays = dataStore.getStudyDays();
    const examHistory = dataStore.getExamHistory();

    // Update metric cards based on current user data
    const metricValues = document.querySelectorAll('.metric-value');
    if (metricValues.length >= 5) {
        // Update score
        const totalScore = dataStore.getScore();
        metricValues[0].textContent = totalScore;

        // Update mastery count
        const masteredCount = Object.values(mastery).filter(v => v >= 70).length;
        metricValues[1].textContent = masteredCount;

        // Update weekly completed
        const weeklyCompleted = examHistory.filter(h => {
            const date = new Date(h.date);
            const now = new Date();
            const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
            return date >= weekAgo;
        }).length;
        metricValues[2].textContent = weeklyCompleted;

        // Update streak days
        const streakDays = dataStore.getStreakDays();
        metricValues[3].textContent = streakDays;

        // Update weak points count
        const weakCount = Object.values(mastery).filter(v => v < 70).length;
        metricValues[4].textContent = weakCount;
    }

    // Update weakness section
    updateWeaknessSection(mastery);

    // Update calendar
    renderCalendar();

    // Update knowledge graph
    updateKnowledgeGraph(mastery);

    // Update score display
    updateScoreDisplay();

    // Update medal showcase
    updateMedalShowcase();
}

function updateWeaknessSection(mastery) {
    const weaknessCards = document.querySelectorAll('.weakness-card');
    const knowledgeMap = {
        '分数乘除法': 0,
        '图形面积计算': 1,
        '单位换算': 2
    };

    Object.entries(mastery).forEach(([knowledge, score]) => {
        const index = knowledgeMap[knowledge];
        if (index !== undefined && weaknessCards[index]) {
            const card = weaknessCards[index];
            const fill = card.querySelector('.progress-fill');
            const span = card.querySelector('.weakness-progress span');
            const desc = card.querySelector('.weakness-desc');

            if (fill) {
                fill.style.width = score + '%';
                fill.style.setProperty('--target-width', score + '%');
            }
            if (span) span.textContent = `掌握度 ${score}%`;
            if (desc) desc.textContent = `该知识点掌握度${score}%`;

            // Update priority level
            const level = card.querySelector('.weakness-level');
            if (level) {
                if (score < 50) {
                    level.textContent = '高优先级';
                    level.style.background = 'rgba(255, 107, 107, 0.2)';
                    level.style.color = '#ff6b6b';
                } else if (score < 70) {
                    level.textContent = '中优先级';
                    level.style.background = 'rgba(255, 165, 2, 0.2)';
                    level.style.color = '#ffa502';
                } else {
                    level.textContent = '低优先级';
                    level.style.background = 'rgba(46, 213, 115, 0.2)';
                    level.style.color = '#2ed573';
                }
            }
        }
    });
}

function updateKnowledgeGraph(mastery) {
    // Update knowledge graph data
    const knowledgeData = {
        nodes: [
            { id: 'center', name: '数学知识', value: 100, type: 'center' },
            { id: 'fraction', name: '分数乘除法', value: mastery['分数乘除法'] || 0, type: 'leaf' },
            { id: 'area', name: '图形面积计算', value: mastery['图形面积计算'] || 0, type: 'leaf' },
            { id: 'unit', name: '单位换算', value: mastery['单位换算'] || 0, type: 'leaf' },
            { id: 'decimal', name: '小数加减法', value: mastery['小数加减法'] || 0, type: 'leaf' },
            { id: 'word', name: '应用题', value: mastery['应用题'] || 0, type: 'leaf' },
            { id: 'geo', name: '几何图形', value: mastery['几何图形'] || 0, type: 'leaf' }
        ],
        links: [
            { source: 'center', target: 'fraction' },
            { source: 'center', target: 'area' },
            { source: 'center', target: 'unit' },
            { source: 'center', target: 'decimal' },
            { source: 'center', target: 'word' },
            { source: 'center', target: 'geo' },
            { source: 'fraction', target: 'decimal' },
            { source: 'area', target: 'geo' },
            { source: 'unit', target: 'word' },
            { source: 'fraction', target: 'word' }
        ]
    };

    // Re-render the graph
    const container = document.getElementById('knowledge-graph');
    if (container) {
        container.innerHTML = '';
        renderKnowledgeGraph(container, knowledgeData);
    }
}

function renderKnowledgeGraph(container, knowledgeData) {
    const width = container.clientWidth;
    const height = container.clientHeight;

    const svg = d3.select('#knowledge-graph')
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    const simulation = d3.forceSimulation(knowledgeData.nodes)
        .force('link', d3.forceLink(knowledgeData.links).id(d => d.id).distance(d => d.source.type === 'center' ? 140 : 100))
        .force('charge', d3.forceManyBody().strength(-400))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(d => getNodeRadius(d.value) + 10));

    const link = svg.append('g')
        .selectAll('line')
        .data(knowledgeData.links)
        .enter()
        .append('line')
        .attr('class', 'graph-link');

    const nodeGroup = svg.append('g')
        .selectAll('g')
        .data(knowledgeData.nodes)
        .enter()
        .append('g')
        .attr('class', 'graph-node')
        .call(d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended))
        .on('click', (event, d) => {
            if (d.type === 'leaf') {
                goToChallenge(d.name);
            }
        });

    nodeGroup.append('circle')
        .attr('class', 'graph-node-circle')
        .attr('r', d => getNodeRadius(d.value))
        .attr('fill', d => getNodeColor(d.value));

    nodeGroup.append('text')
        .attr('class', 'graph-node-label')
        .attr('dy', d => d.type === 'center' ? 0 : -6)
        .text(d => d.name);

    nodeGroup.append('text')
        .attr('class', 'graph-node-percent')
        .attr('dy', d => d.type === 'center' ? 0 : 10)
        .text(d => d.type === 'leaf' ? d.value + '%' : '');

    simulation.on('tick', () => {
        link
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);

        nodeGroup.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    function getNodeRadius(value) {
        if (value === 100) return 50;
        return 32 + (value / 100) * 8;
    }

    function getNodeColor(value) {
        if (value === 100) return '#667eea';
        if (value < 50) return '#ff6b6b';
        if (value <= 70) return '#ffa502';
        return '#2ed573';
    }

    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
}

function refreshWrongBook() {
    const wrongAnswers = dataStore.getWrongAnswers();
    const mastery = dataStore.getMastery();

    // Update wrong list
    const container = document.getElementById('wrong-list');
    if (container) {
        container.innerHTML = wrongAnswers.map(item => `
            <div class="wrong-item">
                <div class="wrong-item-header">
                    <span class="wrong-knowledge">${item.knowledge}</span>
                    <span class="wrong-date">${item.date}</span>
                </div>
                <p class="wrong-content">${item.content}</p>
                <div class="wrong-answer">
                    <span>你的答案：${item.wrongAnswer}</span>
                    <span>正确答案：${item.correctAnswer}</span>
                </div>
            </div>
        `).join('');
    }

    // Update knowledge bars
    const knowledgeBars = document.querySelectorAll('.knowledge-bar-item');
    const knowledgeMap = {
        '分数乘除法': 0,
        '图形面积计算': 1,
        '单位换算': 2,
        '小数加减法': 3
    };

    Object.entries(mastery).forEach(([knowledge, score]) => {
        const index = knowledgeMap[knowledge];
        if (index !== undefined && knowledgeBars[index]) {
            const bar = knowledgeBars[index];
            const fill = bar.querySelector('.bar-fill');
            const percent = bar.querySelector('.knowledge-percent');

            if (fill) {
                fill.style.width = score + '%';
                fill.style.setProperty('--target-width', score + '%');
            }
            if (percent) percent.textContent = score + '%';
        }
    });
}

function refreshAnalysis() {
    const examHistory = dataStore.getExamHistory();
    const mastery = dataStore.getMastery();

    // Update summary cards
    const summaryValues = document.querySelectorAll('.summary-value');
    if (summaryValues.length >= 4) {
        summaryValues[0].textContent = examHistory.length;
        const avgScore = examHistory.length > 0
            ? Math.round(examHistory.reduce((sum, h) => sum + h.score, 0) / examHistory.length)
            : 0;
        summaryValues[1].textContent = avgScore + '%';
        summaryValues[2].textContent = (examHistory.length * 0.5).toFixed(1) + 'h';
        const masteredCount = Object.values(mastery).filter(v => v >= 70).length;
        summaryValues[3].textContent = masteredCount;
    }

    // Update progress table
    updateProgressTable(mastery);
}

function updateProgressTable(mastery) {
    const tbody = document.querySelector('.progress-table tbody');
    if (!tbody) return;

    tbody.innerHTML = Object.entries(mastery).map(([knowledge, score]) => {
        let status, statusClass;
        if (score >= 80) {
            status = '已掌握';
            statusClass = 'mastered';
        } else if (score >= 50) {
            status = '进步中';
            statusClass = 'improving';
        } else {
            status = '需加强';
            statusClass = 'slow';
        }

        return `
            <tr>
                <td>${knowledge}</td>
                <td>${Math.max(0, score - 7)}%</td>
                <td>${score}%</td>
                <td>↑ ${Math.min(7, score)}%</td>
                <td><span class="status-badge ${statusClass}">${status}</span></td>
            </tr>
        `;
    }).join('');
}

// Loading overlay functions
function showLoading(text = '加载中...') {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.querySelector('p').textContent = text;
        overlay.classList.add('active');
    }
}

function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
}

// Count up animation function
function animateCountUp(element, target, duration = 1500) {
    if (!element) return;

    const start = 0;
    const startTime = performance.now();
    const isPercentage = element.textContent.includes('%');
    const hasUnit = element.textContent.includes('分') || element.textContent.includes('天') || element.textContent.includes('个');
    const unit = element.textContent.replace(/[0-9]/g, '').replace('.', '');

    element.classList.add('count-up');

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function (ease-out cubic)
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(start + (target - start) * easeOut);

        if (isPercentage) {
            element.textContent = current + '%';
        } else if (hasUnit || unit) {
            element.textContent = current + unit;
        } else {
            element.textContent = current;
        }

        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            // Ensure final value is exact
            if (isPercentage) {
                element.textContent = target + '%';
            } else if (hasUnit || unit) {
                element.textContent = target + unit;
            } else {
                element.textContent = target;
            }
        }
    }

    requestAnimationFrame(update);
}

// Animate progress bars
function animateProgressBars() {
    // Animate weakness section progress fills
    document.querySelectorAll('.weakness-progress .progress-fill').forEach(fill => {
        const width = fill.style.width;
        if (width) {
            fill.style.setProperty('--target-width', width);
            fill.style.width = '0';
            setTimeout(() => {
                fill.classList.add('animate');
            }, 100);
        }
    });

    // Animate knowledge stats bar fills
    document.querySelectorAll('.knowledge-bar-item .bar-fill').forEach(fill => {
        const width = fill.style.width;
        if (width) {
            fill.style.setProperty('--target-width', width);
            fill.style.width = '0';
            setTimeout(() => {
                fill.classList.add('animate');
            }, 100);
        }
    });
}

// Trigger page-specific animations
function triggerPageAnimations(pageId) {
    const page = document.getElementById(pageId);
    if (!page) return;

    // Animate metric values with count-up effect
    setTimeout(() => {
        page.querySelectorAll('.metric-value').forEach(el => {
            const text = el.textContent;
            const numMatch = text.match(/[0-9]+/);
            if (numMatch) {
                const target = parseInt(numMatch[0]);
                animateCountUp(el, target, 1200);
            }
        });
    }, 300);

    // Animate progress bars when page becomes active
    setTimeout(() => {
        page.querySelectorAll('.progress-fill').forEach(fill => {
            const width = fill.style.width;
            if (width && width !== '0%') {
                fill.style.setProperty('--target-width', width);
                fill.style.width = '0';
                setTimeout(() => {
                    fill.classList.add('animate');
                }, 50);
            }
        });

        page.querySelectorAll('.bar-fill').forEach(fill => {
            const width = fill.style.width;
            if (width && width !== '0%') {
                fill.style.setProperty('--target-width', width);
                fill.style.width = '0';
                setTimeout(() => {
                    fill.classList.add('animate');
                }, 50);
            }
        });
    }, 200);
}

function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.page');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const pageId = item.dataset.page;

            navItems.forEach(nav => nav.classList.remove('active'));
            pages.forEach(page => page.classList.remove('active'));

            item.classList.add('active');
            document.getElementById(pageId).classList.add('active');

            triggerPageAnimations(pageId);

            if (pageId === 'dashboard') {
                updateCharts();
            } else if (pageId === 'challenge') {
                document.getElementById('challenge-content').style.display = 'none';
                document.getElementById('challenge-result').style.display = 'none';
                document.getElementById('challenge-levels').style.display = 'grid';
                renderChallengeLevels();
            } else if (pageId === 'achievement') {
                renderAchievementPage();
            }
        });
    });
}

function initCalendar() {
    const prevBtn = document.getElementById('prev-month');
    const nextBtn = document.getElementById('next-month');

    prevBtn.addEventListener('click', () => {
        currentMonth.setMonth(currentMonth.getMonth() - 1);
        renderCalendar();
    });

    nextBtn.addEventListener('click', () => {
        currentMonth.setMonth(currentMonth.getMonth() + 1);
        renderCalendar();
    });

    renderCalendar();
}

function renderCalendar() {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    document.getElementById('calendar-title').textContent = `${year}年${month + 1}月`;

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

    const grid = document.getElementById('calendar-grid');
    grid.innerHTML = `
        <div class="calendar-day-header">一</div>
        <div class="calendar-day-header">二</div>
        <div class="calendar-day-header">三</div>
        <div class="calendar-day-header">四</div>
        <div class="calendar-day-header">五</div>
        <div class="calendar-day-header">六</div>
        <div class="calendar-day-header">日</div>
    `;

    const studiedDays = [1, 2, 3, 4, 5, 8, 9, 10, 11, 12, 15, 16, 17, 18, 19, 20, 21, 22];
    const today = new Date();

    for (let i = 0; i < startDay; i++) {
        const day = document.createElement('div');
        day.className = 'calendar-day other-month';
        grid.appendChild(day);
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
        const day = document.createElement('div');
        day.className = 'calendar-day';
        day.textContent = i;

        if (studiedDays.includes(i)) {
            day.classList.add('studied');
        }

        if (year === today.getFullYear() && month === today.getMonth() && i === today.getDate()) {
            day.classList.add('today');
        }

        grid.appendChild(day);
    }
}

function initCharts() {
    const ctxRadar = document.getElementById('knowledgeRadar').getContext('2d');
    charts.knowledgeRadar = new Chart(ctxRadar, {
        type: 'radar',
        data: {
            labels: ['分数乘除法', '图形面积', '单位换算', '小数加减', '应用题', '几何图形'],
            datasets: [{
                label: '掌握程度',
                data: [45, 62, 78, 91, 70, 68],
                backgroundColor: 'rgba(102, 126, 234, 0.2)',
                borderColor: 'rgba(102, 126, 234, 1)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(102, 126, 234, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(102, 126, 234, 1)'
            }]
        },
        options: {
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        stepSize: 20
                    },
                    pointLabels: {
                        font: {
                            size: 12
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });

    const ctxProgress = document.getElementById('progressChart').getContext('2d');
    charts.progressChart = new Chart(ctxProgress, {
        type: 'line',
        data: {
            labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
            datasets: [{
                label: '完成率',
                data: [75, 82, 78, 88, 90, 85, 87],
                borderColor: 'rgba(102, 126, 234, 1)',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });

    const ctxWeeklyTrend = document.getElementById('weekly-trend').getContext('2d');
    charts.weeklyTrend = new Chart(ctxWeeklyTrend, {
        type: 'bar',
        data: {
            labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
            datasets: [{
                label: '正确率',
                data: [78, 85, 82, 88, 92, 86, 87],
                backgroundColor: 'rgba(102, 126, 234, 0.8)',
                borderRadius: 8
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });

    const ctxKnowledgeChange = document.getElementById('knowledge-change').getContext('2d');
    charts.knowledgeChange = new Chart(ctxKnowledgeChange, {
        type: 'line',
        data: {
            labels: ['第1周', '第2周', '第3周', '第4周'],
            datasets: [
                {
                    label: '分数乘除法',
                    data: [35, 38, 42, 45],
                    borderColor: 'rgba(255, 107, 107, 1)',
                    backgroundColor: 'rgba(255, 107, 107, 0.1)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: '图形面积',
                    data: [50, 52, 58, 62],
                    borderColor: 'rgba(255, 165, 2, 1)',
                    backgroundColor: 'rgba(255, 165, 2, 0.1)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: '单位换算',
                    data: [68, 70, 75, 78],
                    borderColor: 'rgba(46, 213, 115, 1)',
                    backgroundColor: 'rgba(46, 213, 115, 0.1)',
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });

    const ctxMonthlyTrend = document.getElementById('monthly-trend').getContext('2d');
    charts.monthlyTrend = new Chart(ctxMonthlyTrend, {
        type: 'line',
        data: {
            labels: ['第1周', '第2周', '第3周', '第4周'],
            datasets: [{
                label: '正确率',
                data: [75, 80, 82, 84],
                borderColor: 'rgba(102, 126, 234, 1)',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });

    const ctxKnowledgeDistribution = document.getElementById('knowledge-distribution').getContext('2d');
    charts.knowledgeDistribution = new Chart(ctxKnowledgeDistribution, {
        type: 'doughnut',
        data: {
            labels: ['已掌握', '部分掌握', '未掌握'],
            datasets: [{
                data: [12, 10, 4],
                backgroundColor: ['rgba(102, 126, 234, 0.8)', 'rgba(255, 165, 2, 0.8)', 'rgba(255, 107, 107, 0.8)'],
                borderWidth: 0
            }]
        },
        options: {
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function updateCharts() {
    if (charts.knowledgeRadar) charts.knowledgeRadar.update();
    if (charts.progressChart) charts.progressChart.update();
}

function initKnowledgeGraph() {
    const container = document.getElementById('knowledge-graph');
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const knowledgeData = {
        nodes: [
            { id: 'center', name: '数学知识', value: 100, type: 'center' },
            { id: 'fraction', name: '分数乘除法', value: 45, type: 'leaf' },
            { id: 'area', name: '图形面积计算', value: 62, type: 'leaf' },
            { id: 'unit', name: '单位换算', value: 78, type: 'leaf' },
            { id: 'decimal', name: '小数加减法', value: 91, type: 'leaf' },
            { id: 'word', name: '应用题', value: 70, type: 'leaf' },
            { id: 'geo', name: '几何图形', value: 68, type: 'leaf' }
        ],
        links: [
            { source: 'center', target: 'fraction' },
            { source: 'center', target: 'area' },
            { source: 'center', target: 'unit' },
            { source: 'center', target: 'decimal' },
            { source: 'center', target: 'word' },
            { source: 'center', target: 'geo' },
            { source: 'fraction', target: 'decimal' },
            { source: 'area', target: 'geo' },
            { source: 'unit', target: 'word' },
            { source: 'fraction', target: 'word' }
        ]
    };

    const svg = d3.select('#knowledge-graph')
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    const simulation = d3.forceSimulation(knowledgeData.nodes)
        .force('link', d3.forceLink(knowledgeData.links).id(d => d.id).distance(d => d.source.type === 'center' ? 140 : 100))
        .force('charge', d3.forceManyBody().strength(-400))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(d => getNodeRadius(d.value) + 10));

    const link = svg.append('g')
        .selectAll('line')
        .data(knowledgeData.links)
        .enter()
        .append('line')
        .attr('class', 'graph-link');

    const nodeGroup = svg.append('g')
        .selectAll('g')
        .data(knowledgeData.nodes)
        .enter()
        .append('g')
        .attr('class', 'graph-node')
        .call(d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended))
        .on('click', (event, d) => {
            if (d.type === 'leaf') {
                goToChallenge(d.name);
            }
        });

    nodeGroup.append('circle')
        .attr('class', 'graph-node-circle')
        .attr('r', d => getNodeRadius(d.value))
        .attr('fill', d => getNodeColor(d.value));

    nodeGroup.append('text')
        .attr('class', 'graph-node-label')
        .attr('dy', d => d.type === 'center' ? 0 : -6)
        .text(d => d.name);

    nodeGroup.append('text')
        .attr('class', 'graph-node-percent')
        .attr('dy', d => d.type === 'center' ? 0 : 10)
        .text(d => d.type === 'leaf' ? d.value + '%' : '');

    simulation.on('tick', () => {
        link
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);

        nodeGroup.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    function getNodeRadius(value) {
        if (value === 100) return 50;
        return 32 + (value / 100) * 8;
    }

    function getNodeColor(value) {
        if (value === 100) return '#667eea';
        if (value < 50) return '#ff6b6b';
        if (value <= 70) return '#ffa502';
        return '#2ed573';
    }

    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
}

function goToSmartExam(knowledge) {
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));

    document.querySelector('[data-page="smart-exam"]').classList.add('active');
    document.getElementById('smart-exam').classList.add('active');

    document.getElementById('knowledge-select').value = knowledge;

    // Trigger animations for smart exam page
    triggerPageAnimations('smart-exam');
}

function initSmartExam() {
    const generateBtn = document.getElementById('generate-exam');
    const submitBtn = document.getElementById('submit-exam');
    const resetBtn = document.getElementById('reset-exam');
    const backBtn = document.getElementById('back-to-exam');
    const subjectSelect = document.getElementById('subject-select');

    updateKnowledgeSelect('math');

    if (subjectSelect) {
        subjectSelect.addEventListener('change', () => {
            updateKnowledgeSelect(subjectSelect.value);
        });
    }

    generateBtn.addEventListener('click', () => {
        showLoading('正在生成试卷...');
        setTimeout(() => {
            generateExam();
            hideLoading();
        }, 800);
    });

    submitBtn.addEventListener('click', () => {
        showLoading('正在提交...');
        setTimeout(() => {
            submitExam();
            hideLoading();
        }, 600);
    });

    resetBtn.addEventListener('click', resetExam);
    backBtn.addEventListener('click', () => {
        document.getElementById('exam-result').style.display = 'none';
        document.getElementById('exam-content').style.display = 'block';
    });
}

const questionBank = [
    {
        id: 1,
        knowledge: '分数乘除法',
        difficulty: '简单',
        content: '计算：2/3 × 3/4 = ?',
        options: ['1/2', '5/7', '6/12', '1'],
        answer: 'A',
        explanation: '分子相乘：2×3=6，分母相乘：3×4=12，约分后得到1/2'
    },
    {
        id: 2,
        knowledge: '分数乘除法',
        difficulty: '简单',
        content: '计算：3/5 ÷ 2/3 = ?',
        options: ['9/10', '6/15', '5/2', '1/2'],
        answer: 'A',
        explanation: '除以一个分数等于乘以它的倒数：3/5 × 3/2 = 9/10'
    },
    {
        id: 3,
        knowledge: '分数乘除法',
        difficulty: '中等',
        content: '小明有4/5千克苹果，分给3个小朋友，每个小朋友分多少？',
        options: ['4/15千克', '12/5千克', '1/3千克', '4/5千克'],
        answer: 'A',
        explanation: '4/5 ÷ 3 = 4/5 × 1/3 = 4/15千克'
    },
    {
        id: 4,
        knowledge: '分数乘除法',
        difficulty: '中等',
        content: '计算：(2/3 + 1/4) × 12 = ?',
        options: ['11', '10', '9', '8'],
        answer: 'A',
        explanation: '先算括号内：2/3 + 1/4 = 11/12，再乘以12：11/12 × 12 = 11'
    },
    {
        id: 5,
        knowledge: '图形面积计算',
        difficulty: '简单',
        content: '一个长方形长8cm，宽5cm，面积是多少？',
        options: ['40cm²', '26cm²', '13cm²', '45cm²'],
        answer: 'A',
        explanation: '长方形面积 = 长 × 宽 = 8 × 5 = 40cm²'
    },
    {
        id: 6,
        knowledge: '图形面积计算',
        difficulty: '中等',
        content: '一个三角形底是10cm，高是6cm，面积是多少？',
        options: ['30cm²', '60cm²', '16cm²', '36cm²'],
        answer: 'A',
        explanation: '三角形面积 = 底 × 高 ÷ 2 = 10 × 6 ÷ 2 = 30cm²'
    },
    {
        id: 7,
        knowledge: '图形面积计算',
        difficulty: '困难',
        content: '一个梯形上底4cm，下底8cm，高5cm，面积是多少？',
        options: ['30cm²', '60cm²', '20cm²', '40cm²'],
        answer: 'A',
        explanation: '梯形面积 = (上底 + 下底) × 高 ÷ 2 = (4+8) × 5 ÷ 2 = 30cm²'
    },
    {
        id: 8,
        knowledge: '单位换算',
        difficulty: '简单',
        content: '3米 = 多少厘米？',
        options: ['300厘米', '30厘米', '3000厘米', '0.3厘米'],
        answer: 'A',
        explanation: '1米 = 100厘米，所以3米 = 3 × 100 = 300厘米'
    },
    {
        id: 9,
        knowledge: '单位换算',
        difficulty: '简单',
        content: '500克 = 多少千克？',
        options: ['0.5千克', '5千克', '50千克', '0.05千克'],
        answer: 'A',
        explanation: '1千克 = 1000克，所以500克 = 500 ÷ 1000 = 0.5千克'
    },
    {
        id: 10,
        knowledge: '单位换算',
        difficulty: '中等',
        content: '2小时15分钟 = 多少分钟？',
        options: ['135分钟', '215分钟', '120分钟', '90分钟'],
        answer: 'A',
        explanation: '2小时 = 120分钟，加上15分钟 = 135分钟'
    },
    {
        id: 11,
        knowledge: '小数加减法',
        difficulty: '简单',
        content: '计算：3.5 + 2.8 = ?',
        options: ['6.3', '5.13', '6.13', '5.3'],
        answer: 'A',
        explanation: '小数点对齐相加：3.5 + 2.8 = 6.3'
    },
    {
        id: 12,
        knowledge: '小数加减法',
        difficulty: '中等',
        content: '计算：10.5 - 3.28 = ?',
        options: ['7.22', '7.38', '6.72', '13.78'],
        answer: 'A',
        explanation: '小数点对齐相减：10.50 - 3.28 = 7.22'
    },
    {
        id: 13,
        knowledge: '应用题',
        difficulty: '中等',
        content: '一本书有120页，小明每天看15页，看了5天后还剩多少页？',
        options: ['45页', '75页', '60页', '90页'],
        answer: 'A',
        explanation: '已看页数：15 × 5 = 75页，剩余页数：120 - 75 = 45页'
    },
    {
        id: 14,
        knowledge: '应用题',
        difficulty: '困难',
        content: '商店促销，买3送1，每支笔5元，小明想买8支笔，需要多少钱？',
        options: ['30元', '40元', '35元', '25元'],
        answer: 'A',
        explanation: '买3送1，买6送2正好8支，只需要付6支的钱：6 × 5 = 30元'
    },
    {
        id: 15,
        knowledge: '分数乘除法',
        difficulty: '困难',
        content: '计算：(1/2 ÷ 1/3) × (2/3 ÷ 3/4) = ?',
        options: ['8/9', '4/9', '2/3', '1'],
        answer: 'A',
        explanation: '先算括号：1/2 ÷ 1/3 = 3/2，2/3 ÷ 3/4 = 8/9，再相乘：3/2 × 8/9 = 24/18 = 8/9'
    },
    {
        id: 16,
        knowledge: '分数乘除法',
        difficulty: '困难',
        content: '一桶油，第一次倒出1/3，第二次倒出剩下的1/2，还剩多少？',
        options: ['1/3', '1/2', '1/6', '2/3'],
        answer: 'A',
        explanation: '第一次剩2/3，第二次倒出2/3×1/2=1/3，还剩2/3-1/3=1/3'
    },
    {
        id: 17,
        knowledge: '分数乘除法',
        difficulty: '简单',
        content: '计算：5/6 × 3/10 = ?',
        options: ['1/4', '15/60', '8/16', '1/2'],
        answer: 'A',
        explanation: '分子相乘5×3=15，分母相乘6×10=60，约分15/60=1/4'
    },
    {
        id: 18,
        knowledge: '分数乘除法',
        difficulty: '中等',
        content: '一个数的3/4是12，这个数是多少？',
        options: ['16', '9', '15', '18'],
        answer: 'A',
        explanation: '设这个数为x，3/4×x=12，x=12÷3/4=12×4/3=16'
    },
    {
        id: 19,
        knowledge: '图形面积计算',
        difficulty: '简单',
        content: '一个正方形边长为6cm，面积是多少？',
        options: ['36cm²', '24cm²', '12cm²', '18cm²'],
        answer: 'A',
        explanation: '正方形面积 = 边长 × 边长 = 6 × 6 = 36cm²'
    },
    {
        id: 20,
        knowledge: '图形面积计算',
        difficulty: '中等',
        content: '一个平行四边形底是12cm，高是7cm，面积是多少？',
        options: ['84cm²', '38cm²', '19cm²', '42cm²'],
        answer: 'A',
        explanation: '平行四边形面积 = 底 × 高 = 12 × 7 = 84cm²'
    },
    {
        id: 21,
        knowledge: '图形面积计算',
        difficulty: '困难',
        content: '一个圆的半径是5cm，面积是多少？（π取3.14）',
        options: ['78.5cm²', '31.4cm²', '15.7cm²', '25cm²'],
        answer: 'A',
        explanation: '圆的面积 = πr² = 3.14 × 5² = 3.14 × 25 = 78.5cm²'
    },
    {
        id: 22,
        knowledge: '图形面积计算',
        difficulty: '中等',
        content: '一个长方形长是宽的2倍，周长是36cm，面积是多少？',
        options: ['72cm²', '36cm²', '18cm²', '144cm²'],
        answer: 'A',
        explanation: '设宽为x，长为2x，周长2(x+2x)=36，x=6，面积=6×12=72cm²'
    },
    {
        id: 23,
        knowledge: '单位换算',
        difficulty: '中等',
        content: '3.5千米 = 多少米？',
        options: ['3500米', '350米', '3050米', '3005米'],
        answer: 'A',
        explanation: '1千米 = 1000米，所以3.5千米 = 3.5 × 1000 = 3500米'
    },
    {
        id: 24,
        knowledge: '单位换算',
        difficulty: '困难',
        content: '1立方米 = 多少立方厘米？',
        options: ['1000000立方厘米', '10000立方厘米', '1000立方厘米', '100立方厘米'],
        answer: 'A',
        explanation: '1米 = 100厘米，1立方米 = 100×100×100 = 1000000立方厘米'
    },
    {
        id: 25,
        knowledge: '单位换算',
        difficulty: '简单',
        content: '2.5升 = 多少毫升？',
        options: ['2500毫升', '250毫升', '25毫升', '2005毫升'],
        answer: 'A',
        explanation: '1升 = 1000毫升，所以2.5升 = 2.5 × 1000 = 2500毫升'
    },
    {
        id: 26,
        knowledge: '单位换算',
        difficulty: '中等',
        content: '5平方米 = 多少平方分米？',
        options: ['500平方分米', '50平方分米', '5000平方分米', '5平方分米'],
        answer: 'A',
        explanation: '1平方米 = 100平方分米，所以5平方米 = 5 × 100 = 500平方分米'
    },
    {
        id: 27,
        knowledge: '小数加减法',
        difficulty: '简单',
        content: '计算：4.25 + 1.75 = ?',
        options: ['6.00', '5.00', '5.90', '6.10'],
        answer: 'A',
        explanation: '小数点对齐相加：4.25 + 1.75 = 6.00'
    },
    {
        id: 28,
        knowledge: '小数加减法',
        difficulty: '中等',
        content: '计算：15.3 - 7.86 = ?',
        options: ['7.44', '8.44', '7.56', '8.56'],
        answer: 'A',
        explanation: '小数点对齐相减：15.30 - 7.86 = 7.44'
    },
    {
        id: 29,
        knowledge: '小数加减法',
        difficulty: '困难',
        content: '计算：8.6 + 3.45 - 5.2 = ?',
        options: ['6.85', '7.85', '6.75', '7.75'],
        answer: 'A',
        explanation: '先算8.6+3.45=12.05，再算12.05-5.2=6.85'
    },
    {
        id: 30,
        knowledge: '小数加减法',
        difficulty: '困难',
        content: '小明有20元，买一本书用去12.8元，还剩多少元？',
        options: ['7.2元', '8.2元', '7.8元', '8.8元'],
        answer: 'A',
        explanation: '20 - 12.8 = 7.2元'
    },
    {
        id: 31,
        knowledge: '应用题',
        difficulty: '简单',
        content: '小明有24颗糖，平均分给6个小朋友，每人分几颗？',
        options: ['4颗', '6颗', '3颗', '8颗'],
        answer: 'A',
        explanation: '24 ÷ 6 = 4颗'
    },
    {
        id: 32,
        knowledge: '应用题',
        difficulty: '中等',
        content: '一辆汽车每小时行驶60千米，3.5小时行驶多少千米？',
        options: ['210千米', '180千米', '200千米', '240千米'],
        answer: 'A',
        explanation: '路程 = 速度 × 时间 = 60 × 3.5 = 210千米'
    },
    {
        id: 33,
        knowledge: '应用题',
        difficulty: '困难',
        content: '甲乙两地相距360千米，两车同时相向而行，甲车速度60km/h，乙车速度40km/h，几小时后相遇？',
        options: ['3.6小时', '4小时', '6小时', '2.5小时'],
        answer: 'A',
        explanation: '相遇时间 = 总路程 ÷ 速度和 = 360 ÷ (60+40) = 3.6小时'
    },
    {
        id: 34,
        knowledge: '应用题',
        difficulty: '简单',
        content: '一个书包56元，买2个书包需要多少钱？',
        options: ['112元', '106元', '116元', '108元'],
        answer: 'A',
        explanation: '56 × 2 = 112元'
    },
    {
        id: 35,
        knowledge: '应用题',
        difficulty: '中等',
        content: '工厂要生产480个零件，已经生产了3天，每天生产120个，还剩多少个？',
        options: ['120个', '360个', '240个', '160个'],
        answer: 'A',
        explanation: '已生产：120 × 3 = 360个，还剩：480 - 360 = 120个'
    },
    {
        id: 36,
        knowledge: '语文-成语填空',
        difficulty: '简单',
        content: '下列成语中，形容学习勤奋的是（ ）',
        options: ['凿壁偷光', '守株待兔', '掩耳盗铃', '刻舟求剑'],
        answer: 'A',
        explanation: '凿壁偷光形容家贫而读书刻苦，后用来形容学习勤奋。'
    },
    {
        id: 37,
        knowledge: '语文-成语填空',
        difficulty: '中等',
        content: '下列成语中，与"画蛇添足"意思相近的是（ ）',
        options: ['多此一举', '画龙点睛', '锦上添花', '雪中送炭'],
        answer: 'A',
        explanation: '画蛇添足比喻做了多余的事，非但无益，反而不合适。多此一举指做不必要的、多余的事情。'
    },
    {
        id: 38,
        knowledge: '语文-成语填空',
        difficulty: '困难',
        content: '"_____ 不息"括号中应填入的字是（ ）',
        options: ['川流', '穿流', '串流', '传流'],
        answer: 'A',
        explanation: '川流不息形容行人、车马等像水流一样连续不断。'
    },
    {
        id: 39,
        knowledge: '语文-成语填空',
        difficulty: '简单',
        content: '"亡羊补牢"中的"牢"指的是（ ）',
        options: ['羊圈', '监狱', '牢固', '牢房'],
        answer: 'A',
        explanation: '亡羊补牢指羊逃跑了再去修补羊圈，比喻出了问题以后想办法补救，可以防止继续受损失。'
    },
    {
        id: 40,
        knowledge: '语文-古诗词默写',
        difficulty: '简单',
        content: '"床前明月光"的下一句是（ ）',
        options: ['疑是地上霜', '举头望明月', '低头思故乡', '处处闻啼鸟'],
        answer: 'A',
        explanation: '出自李白《静夜思》：床前明月光，疑是地上霜。举头望明月，低头思故乡。'
    },
    {
        id: 41,
        knowledge: '语文-古诗词默写',
        difficulty: '中等',
        content: '"春眠不觉晓"的下一句是（ ）',
        options: ['处处闻啼鸟', '夜来风雨声', '花落知多少', '明月几时有'],
        answer: 'A',
        explanation: '出自孟浩然《春晓》：春眠不觉晓，处处闻啼鸟。夜来风雨声，花落知多少。'
    },
    {
        id: 42,
        knowledge: '语文-古诗词默写',
        difficulty: '困难',
        content: '"会当凌绝顶"的下一句是（ ）',
        options: ['一览众山小', '黄河入海流', '白日依山尽', '欲穷千里目'],
        answer: 'A',
        explanation: '出自杜甫《望岳》：会当凌绝顶，一览众山小。'
    },
    {
        id: 43,
        knowledge: '语文-古诗词默写',
        difficulty: '中等',
        content: '"但愿人长久"的下一句是（ ）',
        options: ['千里共婵娟', '天涯若比邻', '更上一层楼', '独在异乡为异客'],
        answer: 'A',
        explanation: '出自苏轼《水调歌头》：但愿人长久，千里共婵娟。'
    },
    {
        id: 44,
        knowledge: '语文-阅读理解',
        difficulty: '简单',
        content: '阅读短文："春天来了，小草绿了，花儿开了。"这段话主要描写的是（ ）',
        options: ['春天的景色', '夏天的景色', '秋天的景色', '冬天的景色'],
        answer: 'A',
        explanation: '文中提到"春天来了"，描写了小草变绿、花儿开放的景象，是春天的景色。'
    },
    {
        id: 45,
        knowledge: '语文-阅读理解',
        difficulty: '中等',
        content: '阅读短文："小明每天早起读书，晚上复习功课，成绩一直很好。"这段话说明小明（ ）',
        options: ['学习勤奋', '聪明过人', '家境富裕', '老师很好'],
        answer: 'A',
        explanation: '文中描述小明每天早起读书、晚上复习，体现了他学习勤奋的品质。'
    },
    {
        id: 46,
        knowledge: '语文-阅读理解',
        difficulty: '困难',
        content: '阅读短文："这座桥不但坚固，而且美观。"这句话在文中的作用是（ ）',
        options: ['承上启下', '总结全文', '点明中心', '引出下文'],
        answer: 'A',
        explanation: '"不但坚固"承接上文对桥坚固的描述，"而且美观"引出下文对桥美观的描写，起到承上启下的作用。'
    },
    {
        id: 47,
        knowledge: '语文-阅读理解',
        difficulty: '中等',
        content: '阅读短文："落霞与孤鹜齐飞，秋水共长天一色。"这句诗描写的是（ ）',
        options: ['秋天的景色', '春天的景色', '夏天的景色', '冬天的景色'],
        answer: 'A',
        explanation: '出自王勃《滕王阁序》，"秋水"明确点明描写的是秋天的景色。'
    },
    {
        id: 48,
        knowledge: '英语-单词选择',
        difficulty: '简单',
        content: 'The cat is _____ the table.',
        options: ['under', 'on', 'in', 'at'],
        answer: 'A',
        explanation: '"under"表示在...下面，句意为"猫在桌子下面"。'
    },
    {
        id: 49,
        knowledge: '英语-单词选择',
        difficulty: '中等',
        content: 'I _____ to school every day.',
        options: ['go', 'goes', 'going', 'went'],
        answer: 'A',
        explanation: '主语是I，一般现在时动词用原形go。'
    },
    {
        id: 50,
        knowledge: '英语-单词选择',
        difficulty: '困难',
        content: 'She is _____ than her sister.',
        options: ['taller', 'tall', 'tallest', 'the tallest'],
        answer: 'A',
        explanation: '"than"是比较级的标志词，tall的比较级是taller。'
    },
    {
        id: 51,
        knowledge: '英语-单词选择',
        difficulty: '简单',
        content: 'There _____ a book on the desk.',
        options: ['is', 'are', 'be', 'was'],
        answer: 'A',
        explanation: 'a book是单数，there be句型中用is。'
    },
    {
        id: 52,
        knowledge: '英语-语法填空',
        difficulty: '简单',
        content: 'He _____ (like) apples very much.',
        options: ['likes', 'like', 'liking', 'liked'],
        answer: 'A',
        explanation: '主语He是第三人称单数，一般现在时动词like要加s变为likes。'
    },
    {
        id: 53,
        knowledge: '英语-语法填空',
        difficulty: '中等',
        content: 'They _____ (play) football yesterday.',
        options: ['played', 'play', 'playing', 'plays'],
        answer: 'A',
        explanation: 'yesterday表示昨天，是一般过去时的标志，play的过去式是played。'
    },
    {
        id: 54,
        knowledge: '英语-语法填空',
        difficulty: '困难',
        content: 'If it _____ (rain) tomorrow, we will stay at home.',
        options: ['rains', 'rain', 'will rain', 'rained'],
        answer: 'A',
        explanation: 'if引导的条件状语从句，主句用一般将来时，从句用一般现在时表将来。主语it是第三人称单数，用rains。'
    },
    {
        id: 55,
        knowledge: '英语-语法填空',
        difficulty: '中等',
        content: 'This is the _____ (interesting) book I have ever read.',
        options: ['most interesting', 'more interesting', 'interestinger', 'much interesting'],
        answer: 'A',
        explanation: '"I have ever read"表示范围，用最高级。多音节形容词interesting的最高级是most interesting。'
    },
    {
        id: 56,
        knowledge: '英语-阅读理解',
        difficulty: '简单',
        content: '阅读短文："Tom gets up at 7:00. He has breakfast at 7:30. Then he goes to school." What time does Tom have breakfast?',
        options: ['At 7:30', 'At 7:00', 'At 8:00', 'At 6:30'],
        answer: 'A',
        explanation: '文中明确提到"He has breakfast at 7:30"，所以答案是7:30。'
    },
    {
        id: 57,
        knowledge: '英语-阅读理解',
        difficulty: '中等',
        content: '阅读短文："Mary likes reading books. She goes to the library every Saturday." Where does Mary go every Saturday?',
        options: ['The library', 'The bookstore', 'The park', 'The school'],
        answer: 'A',
        explanation: '文中提到"She goes to the library every Saturday"，所以她每周六去图书馆。'
    },
    {
        id: 58,
        knowledge: '英语-阅读理解',
        difficulty: '困难',
        content: '阅读短文："The weather was bad, so we decided to stay at home and watch a movie." Why did they stay at home?',
        options: ['Because the weather was bad', 'Because they were tired', 'Because they liked movies', 'Because the park was closed'],
        answer: 'A',
        explanation: '文中明确说明"The weather was bad, so we decided to stay at home"，因为天气不好所以待在家里。'
    },
    {
        id: 59,
        knowledge: '英语-阅读理解',
        difficulty: '中等',
        content: '阅读短文："My favorite subject is math because it is interesting and useful." What does the writer think of math?',
        options: ['Interesting and useful', 'Boring and difficult', 'Easy but useless', 'Hard but fun'],
        answer: 'A',
        explanation: '文中明确说"it is interesting and useful"，作者认为数学有趣且有用。'
    }
];

(function initQuestionBank() {
    questionBank.forEach(q => {
        if (q.knowledge.startsWith('语文-')) {
            q.subject = 'chinese';
        } else if (q.knowledge.startsWith('英语-')) {
            q.subject = 'english';
        } else {
            q.subject = 'math';
        }
    });
})();

function getKnowledgeList(subject) {
    const knowledgeSet = new Set();
    questionBank.forEach(q => {
        if (q.subject === subject) {
            knowledgeSet.add(q.knowledge);
        }
    });
    return Array.from(knowledgeSet);
}

function updateKnowledgeSelect(subject) {
    const select = document.getElementById('knowledge-select');
    if (!select) return;

    const knowledgeList = getKnowledgeList(subject);
    select.innerHTML = '<option value="all">全部知识点</option>' +
        knowledgeList.map(k => `<option value="${k}">${k}</option>`).join('');
}

let currentQuestions = [];
let userAnswers = {};

function generateExam() {
    const subject = document.getElementById('subject-select').value;
    const knowledge = document.getElementById('knowledge-select').value;
    const difficulty = document.getElementById('difficulty-select').value;
    let count = parseInt(document.getElementById('question-count').value);

    let filtered = questionBank.filter(q => q.subject === subject);

    if (knowledge !== 'all') {
        filtered = filtered.filter(q => q.knowledge === knowledge);
    }

    if (difficulty !== 'auto') {
        filtered = filtered.filter(q => q.difficulty === difficulty);
    }

    if (filtered.length === 0) {
        alert('当前条件下没有可用题目，请调整筛选条件');
        return;
    }

    if (filtered.length < count) {
        count = filtered.length;
    }

    currentQuestions = filtered.sort(() => Math.random() - 0.5).slice(0, count);
    userAnswers = {};

    const subjectName = subject === 'math' ? '数学' : subject === 'chinese' ? '语文' : '英语';
    document.getElementById('exam-subject').textContent = subjectName;
    document.getElementById('exam-knowledge').textContent = knowledge === 'all' ? '全部知识点' : knowledge;
    document.getElementById('exam-difficulty').textContent = difficulty === 'auto' ? 'AI自适应' : difficulty === 'easy' ? '简单' : difficulty === 'medium' ? '中等' : '困难';
    document.getElementById('exam-count').textContent = count;
    document.getElementById('exam-time').textContent = Math.round(count * 2) + '分钟';
    document.getElementById('exam-weakness').textContent = knowledge === 'all' ? '3个' : '1个';

    renderQuestions();

    document.querySelector('.exam-config').style.display = 'none';
    document.getElementById('exam-content').style.display = 'block';
}

function renderQuestions() {
    const container = document.getElementById('question-list');
    container.innerHTML = '';

    currentQuestions.forEach((q, index) => {
        const card = document.createElement('div');
        card.className = 'question-card';
        card.innerHTML = `
            <div class="question-header">
                <span class="question-number">${index + 1}</span>
                <span class="question-tag">${q.knowledge}</span>
                <span class="question-difficulty">${q.difficulty}</span>
            </div>
            <p class="question-content">${q.content}</p>
            <div class="question-options">
                ${q.options.map((opt, i) => `
                    <div class="option-item" data-question="${index}" data-option="${String.fromCharCode(65 + i)}">
                        <span class="option-label">${String.fromCharCode(65 + i)}</span>
                        <span class="option-text">${opt}</span>
                    </div>
                `).join('')}
            </div>
        `;
        container.appendChild(card);

        card.querySelectorAll('.option-item').forEach(opt => {
            opt.addEventListener('click', () => {
                card.querySelectorAll('.option-item').forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
                userAnswers[index] = opt.dataset.option;
            });
        });
    });
}

function submitExam() {
    let correct = 0;
    let wrong = [];

    currentQuestions.forEach((q, index) => {
        const userAnswer = userAnswers[index];
        if (userAnswer === q.answer) {
            correct++;
        } else {
            wrong.push({
                question: q,
                userAnswer: userAnswer || '未作答',
                index: index
            });
        }
    });

    const score = Math.round((correct / currentQuestions.length) * 100);

    document.getElementById('result-score').textContent = score;
    document.getElementById('result-correct').textContent = correct;
    document.getElementById('result-wrong').textContent = currentQuestions.length - correct;
    document.getElementById('result-rate').textContent = Math.round((correct / currentQuestions.length) * 100) + '%';

    const analysis = document.getElementById('result-analysis');
    if (wrong.length > 0) {
        analysis.innerHTML = `
            <h4>错题分析</h4>
            <div class="wrong-list">
                ${wrong.map(w => `
                    <div class="wrong-item">
                        <div class="wrong-item-header">
                            <span class="wrong-knowledge">${w.question.knowledge}</span>
                        </div>
                        <p class="wrong-content">${w.question.content}</p>
                        <div class="wrong-answer">
                            <span>你的答案：${w.userAnswer}</span>
                            <span>正确答案：${w.question.answer}</span>
                        </div>
                        <p style="font-size: 13px; color: #2ed573; margin-top: 8px;">💡 解析：${w.question.explanation}</p>
                    </div>
                `).join('')}
            </div>
        `;
    } else {
        analysis.innerHTML = '<h4>🎉 太棒了！全部正确！</h4>';
    }

    document.getElementById('exam-content').style.display = 'none';
    document.getElementById('exam-result').style.display = 'block';

    // Animate score with count-up effect
    const scoreElement = document.getElementById('result-score');
    animateCountUp(scoreElement, score, 1500);
}

function resetExam() {
    document.getElementById('exam-content').style.display = 'none';
    document.getElementById('exam-result').style.display = 'none';
    document.querySelector('.exam-config').style.display = 'block';
}

function initWrongBook() {
    const wrongList = [
        {
            id: 1,
            knowledge: '分数乘除法',
            date: '2026-06-20',
            content: '计算：2/3 × 3/4 = ?',
            wrongAnswer: 'B',
            correctAnswer: 'A',
            mastery: 'low'
        },
        {
            id: 2,
            knowledge: '分数乘除法',
            date: '2026-06-19',
            content: '小明有4/5千克苹果，分给3个小朋友，每个小朋友分多少？',
            wrongAnswer: 'C',
            correctAnswer: 'A',
            mastery: 'low'
        },
        {
            id: 3,
            knowledge: '图形面积计算',
            date: '2026-06-18',
            content: '一个三角形底是10cm，高是6cm，面积是多少？',
            wrongAnswer: 'B',
            correctAnswer: 'A',
            mastery: 'medium'
        },
        {
            id: 4,
            knowledge: '图形面积计算',
            date: '2026-06-17',
            content: '一个梯形上底4cm，下底8cm，高5cm，面积是多少？',
            wrongAnswer: 'D',
            correctAnswer: 'A',
            mastery: 'medium'
        },
        {
            id: 5,
            knowledge: '单位换算',
            date: '2026-06-16',
            content: '2小时15分钟 = 多少分钟？',
            wrongAnswer: 'B',
            correctAnswer: 'A',
            mastery: 'high'
        }
    ];

    const container = document.getElementById('wrong-list');
    container.innerHTML = wrongList.map(item => `
        <div class="wrong-item">
            <div class="wrong-item-header">
                <span class="wrong-knowledge">${item.knowledge}</span>
                <span class="wrong-date">${item.date}</span>
            </div>
            <p class="wrong-content">${item.content}</p>
            <div class="wrong-answer">
                <span>你的答案：${item.wrongAnswer}</span>
                <span>正确答案：${item.correctAnswer}</span>
            </div>
        </div>
    `).join('');

    document.getElementById('practice-wrong').addEventListener('click', () => {
        goToChallenge('分数乘除法');
    });
}

function initAnalysis() {
    const tabs = document.querySelectorAll('.report-tab');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const reportType = tab.dataset.report;
            document.querySelectorAll('.report-content').forEach(r => r.classList.remove('active'));
            document.getElementById(`${reportType}-report`).classList.add('active');
        });
    });

    document.getElementById('weekly-report').classList.add('active');
}

// ==================== 年级/课本选择器 ====================

function initGradeSelectors() {
    const gradeSelect = document.getElementById('grade-select');
    const textbookSelect = document.getElementById('textbook-select');

    if (gradeSelect) {
        gradeSelect.value = dataStore.getGrade();
        gradeSelect.addEventListener('change', (e) => {
            dataStore.setGrade(e.target.value);
            refreshAllData();
        });
    }

    if (textbookSelect) {
        textbookSelect.value = dataStore.getTextbook();
        textbookSelect.addEventListener('change', (e) => {
            dataStore.setTextbook(e.target.value);
            updateSubjectOptions(e.target.value);
        });
    }
}

function updateSubjectOptions(textbook) {
    const textbookData = {
        'pep': { subjects: ['math', 'chinese', 'english'], label: '人教版' },
        'jsj': { subjects: ['math'], label: '苏教版' },
        'tb': { subjects: ['chinese'], label: '统编版' },
        'wys': { subjects: ['english'], label: '外研社版' }
    };
    // 可扩展：根据课本版本更新知识点选项
    console.log(`当前课本：${textbookData[textbook]?.label || textbook}`);
}

// ==================== 积分显示 ====================

function updateScoreDisplay() {
    const scoreEl = document.getElementById('total-score');
    if (scoreEl) {
        scoreEl.textContent = dataStore.getScore();
    }
}

// ==================== 勋章展示 ====================

function updateMedalShowcase() {
    const container = document.getElementById('medal-showcase');
    if (!container) return;

    const userMedals = dataStore.getMedals();

    container.innerHTML = MEDALS.map(medal => {
        const isUnlocked = userMedals.includes(medal.id);
        return `<div class="medal-slot ${isUnlocked ? 'unlocked' : 'empty'}">
            <span>${isUnlocked ? medal.icon : '?'}</span>
        </div>`;
    }).join('');
}

// ==================== 知识闯关 ====================

function goToChallenge(knowledgeName) {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.querySelector('[data-page="challenge"]').classList.add('active');
    document.getElementById('challenge').classList.add('active');

    setTimeout(() => {
        const mathKnowledge = ['分数乘除法', '图形面积计算', '单位换算', '小数加减法', '应用题', '几何图形'];
        const chineseKnowledge = ['语文-成语填空', '语文-古诗词默写', '语文-阅读理解'];
        const englishKnowledge = ['英语-单词选择', '英语-语法填空', '英语-阅读理解'];

        if (knowledgeName.startsWith('语文-') || knowledgeName === '成语填空' || knowledgeName === '古诗词默写') {
            currentChallenge.subject = 'chinese';
        } else if (knowledgeName.startsWith('英语-') || knowledgeName === '单词选择' || knowledgeName === '语法填空') {
            currentChallenge.subject = 'english';
        } else {
            currentChallenge.subject = 'math';
        }

        document.querySelectorAll('.subject-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.subject === currentChallenge.subject);
        });

        renderChallengeLevels();
        startChallenge(knowledgeName);
    }, 100);
}

function initChallenge() {
    document.querySelectorAll('.subject-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.subject-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentChallenge.subject = tab.dataset.subject;
            
            document.getElementById('challenge-content').style.display = 'none';
            document.getElementById('challenge-result').style.display = 'none';
            document.getElementById('challenge-levels').style.display = 'grid';
            
            renderChallengeLevels();
        });
    });

    // 返回按钮
    document.getElementById('back-to-challenge')?.addEventListener('click', () => {
        document.getElementById('challenge-result').style.display = 'none';
        document.getElementById('challenge-content').style.display = 'none';
        document.getElementById('challenge-levels').style.display = 'grid';
    });

    // 提交答案按钮
    document.getElementById('challenge-submit')?.addEventListener('click', submitChallengeAnswer);

    // 下一题按钮
    document.getElementById('challenge-next')?.addEventListener('click', nextQuestion);

    renderChallengeLevels();
}

function renderChallengeLevels() {
    const container = document.getElementById('challenge-levels');
    if (!container) return;

    const subject = currentChallenge.subject;
    const knowledgeMap = getKnowledgeBySubject(subject);
    const mastery = dataStore.getMastery();

    container.innerHTML = knowledgeMap.map(k => {
        const level = getChallengeLevel(mastery[k.name] || 0);
        const progress = mastery[k.name] || 0;
        const isMastered = progress >= 70;

        return `<div class="level-card ${isMastered ? 'mastered' : ''}" data-knowledge="${k.name}" data-subject="${subject}">
            <div class="level-header">
                <div class="level-icon ${level}">${k.icon}</div>
                <div>
                    <div class="level-name">${k.name}</div>
                    <span class="level-badge ${level}">${level === 'bronze' ? '青铜' : level === 'silver' ? '白银' : level === 'gold' ? '黄金' : '王者'}</span>
                </div>
            </div>
            <div class="level-progress">
                <div class="progress-bar">
                    <div class="progress-fill ${isMastered ? 'green' : ''}" style="width: ${progress}%"></div>
                </div>
                <div class="level-info">
                    <span>掌握度</span>
                    <span>${progress}%</span>
                </div>
            </div>
        </div>`;
    }).join('');

    container.querySelectorAll('.level-card').forEach(card => {
        card.addEventListener('click', () => {
            currentChallenge.subject = card.dataset.subject;
            startChallenge(card.dataset.knowledge);
        });
    });
}

function getKnowledgeBySubject(subject) {
    const knowledgeData = {
        'math': [
            { name: '分数乘除法', icon: '🔢' },
            { name: '图形面积计算', icon: '📐' },
            { name: '单位换算', icon: '⚖️' },
            { name: '小数加减法', icon: '🔢' },
            { name: '应用题', icon: '📝' }
        ],
        'chinese': [
            { name: '成语填空', icon: '📖' },
            { name: '古诗词默写', icon: '📜' },
            { name: '阅读理解', icon: '📚' }
        ],
        'english': [
            { name: '单词选择', icon: '🔤' },
            { name: '语法填空', icon: '📝' },
            { name: '阅读理解', icon: '📖' }
        ]
    };
    return knowledgeData[subject] || knowledgeData['math'];
}

function getChallengeLevel(mastery) {
    if (mastery < 30) return 'bronze';
    if (mastery < 60) return 'silver';
    if (mastery < 80) return 'gold';
    return 'king';
}

function startChallenge(knowledgeName) {
    const mastery = dataStore.getMastery();
    const currentMastery = mastery[knowledgeName] || 0;
    const level = getChallengeLevel(currentMastery);
    const levelConfig = CHALLENGE_LEVELS[level];

    currentChallenge = {
        subject: currentChallenge.subject,
        knowledge: knowledgeName,
        questions: [],
        currentIndex: 0,
        answers: {},
        correctCount: 0,
        level: level
    };

    const subjectQuestions = questionBank.filter(q => {
        if (q.subject !== currentChallenge.subject) return false;
        const k = q.knowledge;
        if (currentChallenge.subject === 'chinese') {
            if (knowledgeName === '成语填空' || knowledgeName === '语文-成语填空') return k.includes('成语');
            if (knowledgeName === '古诗词默写' || knowledgeName === '语文-古诗词默写') return k.includes('古诗词');
            if (knowledgeName === '阅读理解' || knowledgeName === '语文-阅读理解') return k.includes('阅读');
            return k === knowledgeName;
        } else if (currentChallenge.subject === 'english') {
            if (knowledgeName === '单词选择' || knowledgeName === '英语-单词选择') return k.includes('单词');
            if (knowledgeName === '语法填空' || knowledgeName === '英语-语法填空') return k.includes('语法');
            if (knowledgeName === '阅读理解' || knowledgeName === '英语-阅读理解') return k.includes('阅读');
            return k === knowledgeName;
        } else {
            return k === knowledgeName;
        }
    });

    const required = levelConfig.questions;
    const available = subjectQuestions.length;
    const takeCount = Math.min(required, available);
    
    currentChallenge.questions = shuffleArray([...subjectQuestions]).slice(0, takeCount);

    if (currentChallenge.questions.length === 0) {
        alert('暂无该知识点的题目，请选择其他知识点');
        return;
    }

    document.getElementById('challenge-badge').className = `challenge-badge ${level}`;
    document.getElementById('challenge-badge').textContent = level === 'bronze' ? '青铜' : level === 'silver' ? '白银' : level === 'gold' ? '黄金' : '王者';
    document.getElementById('challenge-title').textContent = knowledgeName;
    document.getElementById('challenge-pass-rate').textContent = Math.round(levelConfig.passRate * 100) + '%';
    document.getElementById('challenge-total').textContent = currentChallenge.questions.length;

    document.getElementById('challenge-levels').style.display = 'none';
    document.getElementById('challenge-content').style.display = 'block';
    document.getElementById('challenge-result').style.display = 'none';

    dataStore.updateStreak();

    renderCurrentQuestion();
}

function renderCurrentQuestion() {
    const q = currentChallenge.questions[currentChallenge.currentIndex];
    if (!q) {
        console.error('No question found at index', currentChallenge.currentIndex);
        return;
    }

    document.getElementById('challenge-current').textContent = currentChallenge.currentIndex + 1;
    document.getElementById('challenge-progress-fill').style.width = ((currentChallenge.currentIndex) / currentChallenge.questions.length * 100) + '%';

    const container = document.getElementById('challenge-question');
    if (!container) {
        console.error('challenge-question container not found');
        return;
    }

    const optionsHtml = q.options.map((opt, i) => `
        <div class="option-item" data-option="${String.fromCharCode(65 + i)}">
            <span class="option-label">${String.fromCharCode(65 + i)}</span>
            <span class="option-text">${opt}</span>
        </div>
    `).join('');

    container.innerHTML = `
        <div class="question-content">${q.content}</div>
        <div class="question-options">${optionsHtml}</div>
    `;

    const submitBtn = document.getElementById('challenge-submit');
    container.querySelectorAll('.option-item').forEach(opt => {
        opt.addEventListener('click', () => {
            container.querySelectorAll('.option-item').forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            currentChallenge.answers[currentChallenge.currentIndex] = opt.dataset.option;
            submitBtn.disabled = false;
        });
    });

    submitBtn.style.display = 'block';
    submitBtn.disabled = !currentChallenge.answers[currentChallenge.currentIndex];
    document.getElementById('challenge-next').style.display = 'none';
}

function submitChallengeAnswer() {
    const q = currentChallenge.questions[currentChallenge.currentIndex];
    const userAnswer = currentChallenge.answers[currentChallenge.currentIndex];
    const isCorrect = userAnswer === q.answer;

    if (isCorrect) currentChallenge.correctCount++;

    // 显示正确/错误
    const container = document.getElementById('challenge-question');
    container.querySelectorAll('.option-item').forEach(opt => {
        opt.classList.remove('selected');
        if (opt.dataset.option === q.answer) {
            opt.classList.add('correct');
        } else if (opt.dataset.option === userAnswer && !isCorrect) {
            opt.classList.add('wrong');
        }
        opt.style.pointerEvents = 'none';
    });

    document.getElementById('challenge-submit').style.display = 'none';
    document.getElementById('challenge-next').style.display = 'block';

    const isLast = currentChallenge.currentIndex >= currentChallenge.questions.length - 1;
    document.getElementById('challenge-next').textContent = isLast ? '查看结果' : '下一题';
}

function nextQuestion() {
    currentChallenge.currentIndex++;

    if (currentChallenge.currentIndex >= currentChallenge.questions.length) {
        finishChallenge();
    } else {
        renderCurrentQuestion();
    }
}

function finishChallenge() {
    const level = currentChallenge.level;
    const levelConfig = CHALLENGE_LEVELS[level];
    const accuracy = currentChallenge.correctCount / currentChallenge.questions.length;
    const passed = accuracy >= levelConfig.passRate;

    // 计算积分
    let score = 0;
    if (passed) {
        score = SCORE_REWARDS.COMPLETE_CHALLENGE * currentChallenge.questions.length * SCORE_REWARDS.DIFFICULTY_MULTIPLIER[level];
    }

    // 添加积分
    dataStore.addScore(Math.round(score));

    // 更新知识掌握度
    const mastery = dataStore.getMastery();
    const oldMastery = mastery[currentChallenge.knowledge] || 0;
    const newMastery = passed ? Math.min(100, oldMastery + 20) : Math.max(0, oldMastery - 10);
    dataStore.updateMastery(currentChallenge.knowledge, newMastery);

    // 检查勋章
    const newMedals = checkAndUnlockMedals(passed, accuracy);

    // 更新UI
    document.getElementById('result-icon').textContent = passed ? '🏆' : '😢';
    document.getElementById('result-title').textContent = passed ? '闯关成功！' : '闯关失败';
    document.getElementById('result-desc').textContent = passed ? '太棒了！你已完成本次挑战' : '继续加油，下次一定能成功！';
    document.getElementById('reward-score').textContent = '+' + Math.round(score);
    document.getElementById('result-correct').textContent = currentChallenge.correctCount;
    document.getElementById('result-wrong').textContent = currentChallenge.questions.length - currentChallenge.correctCount;
    document.getElementById('result-rate').textContent = Math.round(accuracy * 100) + '%';

    // 显示新勋章
    const medalContainer = document.getElementById('reward-medal-container');
    if (newMedals.length > 0) {
        medalContainer.style.display = 'flex';
        document.getElementById('reward-medal').textContent = newMedals[0].name;
        showMedalModal(newMedals[0]);
    } else {
        medalContainer.style.display = 'none';
    }

    document.getElementById('challenge-content').style.display = 'none';
    document.getElementById('challenge-result').style.display = 'block';

    // 更新显示
    updateScoreDisplay();
    updateMedalShowcase();
    refreshAllData();
}

function checkAndUnlockMedals(passed, accuracy) {
    const newMedals = [];
    const mastery = dataStore.getMastery();
    const totalScore = dataStore.getScore();
    const streakDays = dataStore.getStreakDays();
    const masteredCount = Object.values(mastery).filter(v => v >= 70).length;
    const medals = dataStore.getMedals();

    // 初试锋芒 - 完成首次闯关
    if (!medals.includes('first_challenge') && passed) {
        dataStore.unlockMedal('first_challenge');
        newMedals.push(MEDALS.find(m => m.id === 'first_challenge'));
    }

    // 破茧成蝶 - 100积分
    if (!medals.includes('score_100') && totalScore >= 100) {
        dataStore.unlockMedal('score_100');
        newMedals.push(MEDALS.find(m => m.id === 'score_100'));
    }

    // 百发百中 - 100%正确率
    if (!medals.includes('perfect_round') && accuracy === 1) {
        dataStore.unlockMedal('perfect_round');
        newMedals.push(MEDALS.find(m => m.id === 'perfect_round'));
    }

    // 探索之旅 - 闯过3个知识点
    if (!medals.includes('explorer') && masteredCount >= 3) {
        dataStore.unlockMedal('explorer');
        newMedals.push(MEDALS.find(m => m.id === 'explorer'));
    }

    // 持之以恒 - 连续3天
    if (!medals.includes('streak_3') && streakDays >= 3) {
        dataStore.unlockMedal('streak_3');
        newMedals.push(MEDALS.find(m => m.id === 'streak_3'));
    }

    // 完美通关 - 某知识点100%
    if (!medals.includes('mastered') && Object.values(mastery).some(v => v >= 100)) {
        dataStore.unlockMedal('mastered');
        newMedals.push(MEDALS.find(m => m.id === 'mastered'));
    }

    // 学有小成 - 500积分
    if (!medals.includes('score_500') && totalScore >= 500) {
        dataStore.unlockMedal('score_500');
        newMedals.push(MEDALS.find(m => m.id === 'score_500'));
    }

    // 知识克星 - 掌握5个知识点
    if (!medals.includes('knowledge_5') && masteredCount >= 5) {
        dataStore.unlockMedal('knowledge_5');
        newMedals.push(MEDALS.find(m => m.id === 'knowledge_5'));
    }

    // 学霸巅峰 - 1000积分
    if (!medals.includes('score_1000') && totalScore >= 1000) {
        dataStore.unlockMedal('score_1000');
        newMedals.push(MEDALS.find(m => m.id === 'score_1000'));
    }

    // 融会贯通 - 三科各3个
    const subjectMastery = { math: 0, chinese: 0, english: 0 };
    questionBank.forEach(q => {
        if (mastery[q.knowledge] >= 70) {
            subjectMastery[q.subject]++;
        }
    });
    if (!medals.includes('all_subjects') && subjectMastery.math >= 3 && subjectMastery.chinese >= 3 && subjectMastery.english >= 3) {
        dataStore.unlockMedal('all_subjects');
        newMedals.push(MEDALS.find(m => m.id === 'all_subjects'));
    }

    return newMedals;
}

function showMedalModal(medal) {
    const modal = document.getElementById('medal-modal');
    document.getElementById('medal-icon-large').textContent = medal.icon;
    document.getElementById('medal-name-large').textContent = medal.name;
    document.getElementById('medal-desc-large').textContent = medal.desc;
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('active'), 10);

    modal.querySelector('.modal-close').onclick = () => closeMedalModal();
}

function closeMedalModal() {
    const modal = document.getElementById('medal-modal');
    modal.classList.remove('active');
    setTimeout(() => modal.style.display = 'none', 300);
}

// ==================== 成就大厅 ====================

function initAchievement() {
    renderAchievementPage();
}

function renderAchievementPage() {
    const container = document.getElementById('medal-showcase-full');
    if (!container) return;

    const userMedals = dataStore.getMedals();

    container.innerHTML = MEDALS.map(medal => {
        const isUnlocked = userMedals.includes(medal.id);
        return `<div class="medal-card ${isUnlocked ? 'unlocked' : 'locked'}">
            <div class="medal-icon">${isUnlocked ? medal.icon : '🔒'}</div>
            <div class="medal-info">
                <h4>${medal.name}</h4>
                <p>${medal.desc}</p>
            </div>
            <span class="medal-status">${isUnlocked ? '已获得' : '未获得'}</span>
        </div>`;
    }).join('');

    document.getElementById('achieved-count').textContent = userMedals.length;
}

// ==================== 教师/家长窗口 ====================

function initGuardianPortal() {
    const modal = document.getElementById('guardian-modal');
    
    const openModal = () => {
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('active'), 10);
    };
    
    document.getElementById('guardian-btn-sidebar')?.addEventListener('click', openModal);
    document.getElementById('guardian-btn')?.addEventListener('click', openModal);

    modal?.querySelector('.guardian-close')?.addEventListener('click', () => {
        modal.classList.remove('active');
        setTimeout(() => modal.style.display = 'none', 300);
    });

    modal?.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
            setTimeout(() => modal.style.display = 'none', 300);
        }
    });
}

// ==================== 工具函数 ====================

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
