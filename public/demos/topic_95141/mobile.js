let mobileCurrentMonth = new Date();
let mobileCharts = {};
let mobileCurrentQuestions = [];
let mobileUserAnswers = {};

// ==================== Mobile User System ====================

function initMobileUserSystem() {
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
    updateMobileUserUI();

    // Setup event listeners
    setupMobileUserEvents();
}

function updateMobileUserUI() {
    const currentUser = dataStore.getCurrentUser();
    if (!currentUser) return;

    // Update header user display
    const avatarEl = document.getElementById('mobile-user-avatar');
    const nameEl = document.getElementById('mobile-user-name');
    if (avatarEl) avatarEl.textContent = currentUser.avatar;
    if (nameEl) nameEl.textContent = currentUser.name;

    // Update user list in sheet
    const userListEl = document.getElementById('mobile-user-list');
    if (userListEl) {
        const users = dataStore.getUsers();
        userListEl.innerHTML = users.map(user => `
            <div class="mobile-user-item ${user.id === currentUser.id ? 'active' : ''}" data-user-id="${user.id}">
                <div class="user-avatar">${user.avatar}</div>
                <span class="user-name">${user.name}</span>
                ${user.id === currentUser.id ? '<span class="check-icon">✓</span>' : ''}
            </div>
        `).join('');

        // Add click handlers to user items
        userListEl.querySelectorAll('.mobile-user-item').forEach(item => {
            item.addEventListener('click', () => {
                const userId = item.dataset.userId;
                mobileSwitchToUser(userId);
            });
        });
    }
}

function setupMobileUserEvents() {
    const userBtn = document.getElementById('mobile-user-btn');
    const sheetOverlay = document.getElementById('mobile-sheet-overlay');
    const addUserBtn = document.getElementById('mobile-add-user-btn');
    const createDialog = document.getElementById('mobile-create-user-dialog');
    const cancelBtn = document.getElementById('mobile-cancel-create-user');
    const confirmBtn = document.getElementById('mobile-confirm-create-user');
    const newUserNameInput = document.getElementById('mobile-new-user-name');

    // Open user sheet
    if (userBtn) {
        userBtn.addEventListener('click', () => {
            showMobileUserSheet();
        });
    }

    // Close sheet on overlay click
    if (sheetOverlay) {
        sheetOverlay.addEventListener('click', (e) => {
            if (e.target === sheetOverlay) {
                hideMobileUserSheet();
            }
        });
    }

    // Add user button
    if (addUserBtn) {
        addUserBtn.addEventListener('click', () => {
            hideMobileUserSheet();
            showMobileCreateUserDialog();
        });
    }

    // Cancel create user
    if (cancelBtn) {
        cancelBtn.addEventListener('click', hideMobileCreateUserDialog);
    }

    // Confirm create user
    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            const name = newUserNameInput.value.trim();
            if (name) {
                mobileCreateNewUser(name);
                newUserNameInput.value = '';
                hideMobileCreateUserDialog();
            }
        });
    }

    // Enter key to create user
    if (newUserNameInput) {
        newUserNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const name = newUserNameInput.value.trim();
                if (name) {
                    mobileCreateNewUser(name);
                    newUserNameInput.value = '';
                    hideMobileCreateUserDialog();
                }
            }
        });
    }

    // Close dialog on overlay click
    if (createDialog) {
        createDialog.addEventListener('click', (e) => {
            if (e.target === createDialog) {
                hideMobileCreateUserDialog();
            }
        });
    }
}

function showMobileUserSheet() {
    const overlay = document.getElementById('mobile-sheet-overlay');
    if (overlay) {
        updateMobileUserUI();
        overlay.classList.add('active');
    }
}

function hideMobileUserSheet() {
    const overlay = document.getElementById('mobile-sheet-overlay');
    if (overlay) overlay.classList.remove('active');
}

function showMobileCreateUserDialog() {
    const dialog = document.getElementById('mobile-create-user-dialog');
    if (dialog) dialog.classList.add('active');
    const input = document.getElementById('mobile-new-user-name');
    if (input) setTimeout(() => input.focus(), 100);
}

function hideMobileCreateUserDialog() {
    const dialog = document.getElementById('mobile-create-user-dialog');
    if (dialog) dialog.classList.remove('active');
}

function mobileCreateNewUser(name) {
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
    updateMobileUserUI();
    mobileRefreshAllData();
}

function mobileSwitchToUser(userId) {
    const user = dataStore.switchUser(userId);
    if (user) {
        hideMobileUserSheet();
        updateMobileUserUI();
        mobileRefreshAllData();
    }
}

function mobileRefreshAllData() {
    mobileRefreshDashboard();
    mobileRefreshWrongBook();
    mobileRefreshAnalysis();
    mobileUpdateCharts();
}

function mobileRefreshDashboard() {
    const mastery = dataStore.getMastery();
    const studyDays = dataStore.getStudyDays();
    const examHistory = dataStore.getExamHistory();

    // Update metric cards
    const metricValues = document.querySelectorAll('#mobile-dashboard .metric-value');
    if (metricValues.length >= 4) {
        const masteredCount = Object.values(mastery).filter(v => v >= 70).length;
        metricValues[0].textContent = masteredCount;

        const weeklyCompleted = examHistory.filter(h => {
            const date = new Date(h.date);
            const now = new Date();
            const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
            return date >= weekAgo;
        }).length;
        metricValues[1].textContent = weeklyCompleted;

        metricValues[2].textContent = studyDays.length + '天';

        const weakCount = Object.values(mastery).filter(v => v < 70).length;
        metricValues[3].textContent = weakCount + '个';
    }

    // Update weakness cards
    mobileUpdateWeaknessCards(mastery);

    // Update calendar
    renderMobileCalendar();

    // Update knowledge graph
    mobileUpdateKnowledgeGraph(mastery);
}

function mobileUpdateWeaknessCards(mastery) {
    const weaknessCards = document.querySelectorAll('#mobile-dashboard .weakness-card');
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

            if (fill) {
                fill.style.width = score + '%';
                fill.style.setProperty('--target-width', score + '%');
            }
            if (span) span.textContent = score + '%';
        }
    });
}

function mobileUpdateKnowledgeGraph(mastery) {
    const knowledgeData = {
        nodes: [
            { id: 'center', name: '数学', value: 100, type: 'center' },
            { id: 'fraction', name: '分数乘除', value: mastery['分数乘除法'] || 0, type: 'leaf' },
            { id: 'area', name: '面积计算', value: mastery['图形面积计算'] || 0, type: 'leaf' },
            { id: 'unit', name: '单位换算', value: mastery['单位换算'] || 0, type: 'leaf' },
            { id: 'decimal', name: '小数加减', value: mastery['小数加减法'] || 0, type: 'leaf' },
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
            { source: 'unit', target: 'word' }
        ]
    };

    const container = document.getElementById('mobile-knowledge-graph');
    if (container) {
        container.innerHTML = '';
        renderMobileKnowledgeGraph(container, knowledgeData);
    }
}

function renderMobileKnowledgeGraph(container, knowledgeData) {
    const width = container.clientWidth;
    const height = container.clientHeight;

    const svg = d3.select('#mobile-knowledge-graph')
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    const simulation = d3.forceSimulation(knowledgeData.nodes)
        .force('link', d3.forceLink(knowledgeData.links).id(d => d.id).distance(d => d.source.type === 'center' ? 90 : 70))
        .force('charge', d3.forceManyBody().strength(-250))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(d => getNodeRadius(d.value) + 6));

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
        .on('click', (event, d) => {
            if (d.type === 'leaf') {
                const nameMap = {
                    '分数乘除': '分数乘除法',
                    '面积计算': '图形面积计算',
                    '单位换算': '单位换算',
                    '小数加减': '小数加减法',
                    '应用题': '应用题',
                    '几何图形': '几何图形'
                };
                mobileGoToExam(nameMap[d.name] || d.name);
            }
        });

    nodeGroup.append('circle')
        .attr('class', 'graph-node-circle')
        .attr('r', d => getNodeRadius(d.value))
        .attr('fill', d => getNodeColor(d.value));

    nodeGroup.append('text')
        .attr('class', 'graph-node-label')
        .attr('dy', d => d.type === 'center' ? 0 : -5)
        .text(d => d.name);

    nodeGroup.append('text')
        .attr('class', 'graph-node-percent')
        .attr('dy', d => d.type === 'center' ? 0 : 8)
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
        if (value === 100) return 32;
        return 22 + (value / 100) * 6;
    }

    function getNodeColor(value) {
        if (value === 100) return '#667eea';
        if (value < 50) return '#ff6b6b';
        if (value <= 70) return '#ffa502';
        return '#2ed573';
    }
}

function mobileRefreshWrongBook() {
    const wrongAnswers = dataStore.getWrongAnswers();
    const mastery = dataStore.getMastery();

    // Update wrong list
    const container = document.getElementById('mobile-wrong-list');
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
    const knowledgeBars = document.querySelectorAll('#mobile-wrong .knowledge-bar-item');
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

function mobileRefreshAnalysis() {
    const examHistory = dataStore.getExamHistory();
    const mastery = dataStore.getMastery();

    // Update summary cards
    const summaryValues = document.querySelectorAll('#mobile-analysis .summary-value');
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
}

function mobileUpdateCharts() {
    if (mobileCharts.radar) {
        const mastery = dataStore.getMastery();
        mobileCharts.radar.data.datasets[0].data = [
            mastery['分数乘除法'] || 0,
            mastery['图形面积计算'] || 0,
            mastery['单位换算'] || 0,
            mastery['小数加减法'] || 0,
            mastery['应用题'] || 0
        ];
        mobileCharts.radar.update();
    }
    if (mobileCharts.progress) mobileCharts.progress.update();
    if (mobileCharts.weeklyTrend) mobileCharts.weeklyTrend.update();
    if (mobileCharts.monthlyTrend) mobileCharts.monthlyTrend.update();
}

const mobileQuestionBank = [
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
        difficulty: '困难',
        content: '一桶油，第一次倒出1/3，第二次倒出剩下的1/2，还剩多少？',
        options: ['1/3', '1/2', '1/6', '2/3'],
        answer: 'A',
        explanation: '第一次剩2/3，第二次倒出2/3×1/2=1/3，还剩2/3-1/3=1/3'
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
        difficulty: '中等',
        content: '2小时15分钟 = 多少分钟？',
        options: ['135分钟', '215分钟', '120分钟', '90分钟'],
        answer: 'A',
        explanation: '2小时 = 120分钟，加上15分钟 = 135分钟'
    },
    {
        id: 10,
        knowledge: '小数加减法',
        difficulty: '简单',
        content: '计算：3.5 + 2.8 = ?',
        options: ['6.3', '5.13', '6.13', '5.3'],
        answer: 'A',
        explanation: '小数点对齐相加：3.5 + 2.8 = 6.3'
    },
    {
        id: 11,
        knowledge: '小数加减法',
        difficulty: '中等',
        content: '计算：10.5 - 3.28 = ?',
        options: ['7.22', '7.38', '6.72', '13.78'],
        answer: 'A',
        explanation: '小数点对齐相减：10.50 - 3.28 = 7.22'
    },
    {
        id: 12,
        knowledge: '应用题',
        difficulty: '中等',
        content: '一本书有120页，小明每天看15页，看了5天后还剩多少页？',
        options: ['45页', '75页', '60页', '90页'],
        answer: 'A',
        explanation: '已看页数：15 × 5 = 75页，剩余页数：120 - 75 = 45页'
    },
    {
        id: 13,
        knowledge: '应用题',
        difficulty: '困难',
        content: '商店促销，买3送1，每支笔5元，小明想买8支笔，需要多少钱？',
        options: ['30元', '40元', '35元', '25元'],
        answer: 'A',
        explanation: '买3送1，买6送2正好8支，只需要付6支的钱：6 × 5 = 30元'
    },
    {
        id: 14,
        knowledge: '应用题',
        difficulty: '简单',
        content: '小明有24颗糖，平均分给6个小朋友，每人分几颗？',
        options: ['4颗', '6颗', '3颗', '8颗'],
        answer: 'A',
        explanation: '24 ÷ 6 = 4颗'
    },
    {
        id: 15,
        knowledge: '语文-成语填空',
        difficulty: '简单',
        content: '下列成语中，形容学习勤奋的是（ ）',
        options: ['凿壁偷光', '守株待兔', '掩耳盗铃', '刻舟求剑'],
        answer: 'A',
        explanation: '凿壁偷光形容家贫而读书刻苦，后用来形容学习勤奋。'
    },
    {
        id: 16,
        knowledge: '语文-成语填空',
        difficulty: '中等',
        content: '"川流_____"括号中应填入的字是（ ）',
        options: ['不息', '不断', '不止', '不停'],
        answer: 'A',
        explanation: '川流不息形容行人、车马等像水流一样连续不断。'
    },
    {
        id: 17,
        knowledge: '语文-古诗词默写',
        difficulty: '简单',
        content: '"床前明月光"的下一句是（ ）',
        options: ['疑是地上霜', '举头望明月', '低头思故乡', '处处闻啼鸟'],
        answer: 'A',
        explanation: '出自李白《静夜思》：床前明月光，疑是地上霜。举头望明月，低头思故乡。'
    },
    {
        id: 18,
        knowledge: '语文-古诗词默写',
        difficulty: '中等',
        content: '"会当凌绝顶"的下一句是（ ）',
        options: ['一览众山小', '黄河入海流', '白日依山尽', '欲穷千里目'],
        answer: 'A',
        explanation: '出自杜甫《望岳》：会当凌绝顶，一览众山小。'
    },
    {
        id: 19,
        knowledge: '语文-阅读理解',
        difficulty: '简单',
        content: '阅读短文："春天来了，小草绿了，花儿开了。"这段话主要描写的是（ ）',
        options: ['春天的景色', '夏天的景色', '秋天的景色', '冬天的景色'],
        answer: 'A',
        explanation: '文中提到"春天来了"，描写了小草变绿、花儿开放的景象，是春天的景色。'
    },
    {
        id: 20,
        knowledge: '语文-阅读理解',
        difficulty: '中等',
        content: '"落霞与孤鹜齐飞，秋水共长天一色。"这句诗描写的是（ ）',
        options: ['秋天的景色', '春天的景色', '夏天的景色', '冬天的景色'],
        answer: 'A',
        explanation: '出自王勃《滕王阁序》，"秋水"明确点明描写的是秋天的景色。'
    },
    {
        id: 21,
        knowledge: '英语-单词选择',
        difficulty: '简单',
        content: 'The cat is _____ the table.',
        options: ['under', 'on', 'in', 'at'],
        answer: 'A',
        explanation: '"under"表示在...下面，句意为"猫在桌子下面"。'
    },
    {
        id: 22,
        knowledge: '英语-单词选择',
        difficulty: '中等',
        content: 'She is _____ than her sister.',
        options: ['taller', 'tall', 'tallest', 'the tallest'],
        answer: 'A',
        explanation: '"than"是比较级的标志词，tall的比较级是taller。'
    },
    {
        id: 23,
        knowledge: '英语-语法填空',
        difficulty: '简单',
        content: 'He _____ (like) apples very much.',
        options: ['likes', 'like', 'liking', 'liked'],
        answer: 'A',
        explanation: '主语He是第三人称单数，一般现在时动词like要加s变为likes。'
    },
    {
        id: 24,
        knowledge: '英语-语法填空',
        difficulty: '中等',
        content: 'They _____ (play) football yesterday.',
        options: ['played', 'play', 'playing', 'plays'],
        answer: 'A',
        explanation: 'yesterday表示昨天，是一般过去时的标志，play的过去式是played。'
    },
    {
        id: 25,
        knowledge: '英语-阅读理解',
        difficulty: '简单',
        content: '阅读短文："Tom gets up at 7:00. He has breakfast at 7:30." What time does Tom have breakfast?',
        options: ['At 7:30', 'At 7:00', 'At 8:00', 'At 6:30'],
        answer: 'A',
        explanation: '文中明确提到"He has breakfast at 7:30"，所以答案是7:30。'
    },
    {
        id: 26,
        knowledge: '英语-阅读理解',
        difficulty: '中等',
        content: '阅读短文："Mary likes reading books. She goes to the library every Saturday." Where does Mary go every Saturday?',
        options: ['The library', 'The bookstore', 'The park', 'The school'],
        answer: 'A',
        explanation: '文中提到"She goes to the library every Saturday"，所以她每周六去图书馆。'
    }
];

(function initMobileQuestionBank() {
    mobileQuestionBank.forEach(q => {
        if (q.knowledge.startsWith('语文-')) {
            q.subject = 'chinese';
        } else if (q.knowledge.startsWith('英语-')) {
            q.subject = 'english';
        } else {
            q.subject = 'math';
        }
    });
})();

function getMobileKnowledgeList(subject) {
    const knowledgeSet = new Set();
    mobileQuestionBank.forEach(q => {
        if (q.subject === subject) {
            knowledgeSet.add(q.knowledge);
        }
    });
    return Array.from(knowledgeSet);
}

function updateMobileKnowledgeSelect(subject) {
    const select = document.getElementById('mobile-knowledge');
    if (!select) return;

    const knowledgeList = getMobileKnowledgeList(subject);
    select.innerHTML = '<option value="all">全部知识点</option>' +
        knowledgeList.map(k => `<option value="${k}">${k}</option>`).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    // Show loading overlay during initialization
    showMobileLoading('正在初始化...');

    // Initialize user system first
    initMobileUserSystem();

    initMobileNavigation();
    initMobileCalendar();
    initMobileCharts();
    initMobileKnowledgeGraph();
    initMobileExam();
    initMobileWrongBook();
    initMobileAnalysis();

    // Animate progress bars on initial load
    setTimeout(() => {
        animateMobileProgressBars();
        hideMobileLoading();
    }, 500);

    // Add initial page animation trigger
    triggerMobilePageAnimations('mobile-dashboard');
});

// Mobile loading overlay functions
function showMobileLoading(text = '加载中...') {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        const p = overlay.querySelector('p');
        if (p) p.textContent = text;
        overlay.classList.add('active');
    }
}

function hideMobileLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
}

// Mobile count up animation function
function animateMobileCountUp(element, target, duration = 1200) {
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

// Animate mobile progress bars
function animateMobileProgressBars() {
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

// Trigger mobile page-specific animations
function triggerMobilePageAnimations(pageId) {
    const page = document.getElementById(pageId);
    if (!page) return;

    // Animate metric values with count-up effect
    setTimeout(() => {
        page.querySelectorAll('.metric-value').forEach(el => {
            const text = el.textContent;
            const numMatch = text.match(/[0-9]+/);
            if (numMatch) {
                const target = parseInt(numMatch[0]);
                animateMobileCountUp(el, target, 1000);
            }
        });
    }, 200);

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
    }, 150);
}

function initMobileNavigation() {
    const navBtns = document.querySelectorAll('.nav-btn');
    const pages = document.querySelectorAll('.mobile-page');

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const pageId = btn.dataset.page;

            navBtns.forEach(b => b.classList.remove('active'));
            pages.forEach(p => p.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(pageId).classList.add('active');

            // Trigger animations for the new page
            triggerMobilePageAnimations(pageId);
        });
    });
}

function initMobileCalendar() {
    const prevBtn = document.getElementById('mobile-prev-month');
    const nextBtn = document.getElementById('mobile-next-month');

    prevBtn.addEventListener('click', () => {
        mobileCurrentMonth.setMonth(mobileCurrentMonth.getMonth() - 1);
        renderMobileCalendar();
    });

    nextBtn.addEventListener('click', () => {
        mobileCurrentMonth.setMonth(mobileCurrentMonth.getMonth() + 1);
        renderMobileCalendar();
    });

    renderMobileCalendar();
}

function renderMobileCalendar() {
    const year = mobileCurrentMonth.getFullYear();
    const month = mobileCurrentMonth.getMonth();

    document.getElementById('mobile-calendar-title').textContent = `${year}年${month + 1}月`;

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

    const grid = document.getElementById('mobile-calendar-grid');
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

function initMobileCharts() {
    const ctxRadar = document.getElementById('mobile-radar').getContext('2d');
    mobileCharts.radar = new Chart(ctxRadar, {
        type: 'radar',
        data: {
            labels: ['分数乘除法', '图形面积', '单位换算', '小数加减', '应用题'],
            datasets: [{
                label: '掌握程度',
                data: [45, 62, 78, 91, 70],
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
                        stepSize: 20,
                        font: { size: 10 }
                    },
                    pointLabels: {
                        font: { size: 10 }
                    }
                }
            },
            plugins: {
                legend: { display: false }
            },
            maintainAspectRatio: false
        }
    });

    const ctxProgress = document.getElementById('mobile-progress').getContext('2d');
    mobileCharts.progress = new Chart(ctxProgress, {
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
                    max: 100,
                    ticks: { font: { size: 10 } }
                },
                x: {
                    ticks: { font: { size: 10 } }
                }
            },
            plugins: {
                legend: { display: false }
            },
            maintainAspectRatio: false
        }
    });

    const ctxWeeklyTrend = document.getElementById('mobile-weekly-trend').getContext('2d');
    mobileCharts.weeklyTrend = new Chart(ctxWeeklyTrend, {
        type: 'bar',
        data: {
            labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
            datasets: [{
                label: '正确率',
                data: [78, 85, 82, 88, 92, 86, 87],
                backgroundColor: 'rgba(102, 126, 234, 0.8)',
                borderRadius: 6
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { font: { size: 10 } }
                },
                x: {
                    ticks: { font: { size: 10 } }
                }
            },
            plugins: {
                legend: { display: false }
            },
            maintainAspectRatio: false
        }
    });

    const ctxMonthlyTrend = document.getElementById('mobile-monthly-trend').getContext('2d');
    mobileCharts.monthlyTrend = new Chart(ctxMonthlyTrend, {
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
                    max: 100,
                    ticks: { font: { size: 10 } }
                },
                x: {
                    ticks: { font: { size: 10 } }
                }
            },
            plugins: {
                legend: { display: false }
            },
            maintainAspectRatio: false
        }
    });
}

function mobileGoToExam(knowledge) {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.mobile-page').forEach(p => p.classList.remove('active'));

    document.querySelector('[data-page="mobile-exam"]').classList.add('active');
    document.getElementById('mobile-exam').classList.add('active');

    document.getElementById('mobile-knowledge').value = knowledge;

    // Trigger animations for exam page
    triggerMobilePageAnimations('mobile-exam');
}

function initMobileExam() {
    const generateBtn = document.getElementById('mobile-generate');
    const submitBtn = document.getElementById('mobile-submit');
    const resetBtn = document.getElementById('mobile-reset');
    const backBtn = document.getElementById('mobile-back-exam');
    const subjectSelect = document.getElementById('mobile-subject');

    updateMobileKnowledgeSelect('math');

    if (subjectSelect) {
        subjectSelect.addEventListener('change', () => {
            updateMobileKnowledgeSelect(subjectSelect.value);
        });
    }

    generateBtn.addEventListener('click', () => {
        showMobileLoading('正在生成试卷...');
        setTimeout(() => {
            generateMobileExam();
            hideMobileLoading();
        }, 600);
    });

    submitBtn.addEventListener('click', () => {
        showMobileLoading('正在提交...');
        setTimeout(() => {
            submitMobileExam();
            hideMobileLoading();
        }, 500);
    });

    resetBtn.addEventListener('click', resetMobileExam);
    backBtn.addEventListener('click', () => {
        document.getElementById('mobile-exam-result').style.display = 'none';
        document.getElementById('mobile-exam-content').style.display = 'block';
    });
}

function generateMobileExam() {
    const subject = document.getElementById('mobile-subject').value;
    const knowledge = document.getElementById('mobile-knowledge').value;
    const difficulty = document.getElementById('mobile-difficulty').value;
    let count = parseInt(document.getElementById('mobile-count').value);

    let filtered = mobileQuestionBank.filter(q => q.subject === subject);

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

    mobileCurrentQuestions = filtered.sort(() => Math.random() - 0.5).slice(0, count);
    mobileUserAnswers = {};

    const subjectName = subject === 'math' ? '数学' : subject === 'chinese' ? '语文' : '英语';
    document.getElementById('mobile-exam-subject').textContent = subjectName;
    document.getElementById('mobile-exam-knowledge').textContent = knowledge === 'all' ? '全部知识点' : knowledge;
    document.getElementById('mobile-exam-difficulty').textContent = difficulty === 'auto' ? 'AI自适应' : difficulty === 'easy' ? '简单' : difficulty === 'medium' ? '中等' : '困难';
    document.getElementById('mobile-exam-count').textContent = count;
    document.getElementById('mobile-exam-time').textContent = Math.round(count * 2) + '分钟';

    renderMobileQuestions();

    document.querySelector('.exam-config').style.display = 'none';
    document.getElementById('mobile-exam-content').style.display = 'block';
}

function renderMobileQuestions() {
    const container = document.getElementById('mobile-question-list');
    container.innerHTML = '';

    mobileCurrentQuestions.forEach((q, index) => {
        const card = document.createElement('div');
        card.className = 'question-card';
        card.innerHTML = `
            <div class="question-header">
                <span class="question-number">${index + 1}</span>
                <span class="question-tag">${q.knowledge}</span>
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
                mobileUserAnswers[index] = opt.dataset.option;
            });
        });
    });
}

function submitMobileExam() {
    let correct = 0;
    let wrong = [];

    mobileCurrentQuestions.forEach((q, index) => {
        const userAnswer = mobileUserAnswers[index];
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

    const score = Math.round((correct / mobileCurrentQuestions.length) * 100);

    document.getElementById('mobile-result-score').textContent = score;
    document.getElementById('mobile-result-correct').textContent = correct;
    document.getElementById('mobile-result-wrong').textContent = mobileCurrentQuestions.length - correct;
    document.getElementById('mobile-result-rate').textContent = Math.round((correct / mobileCurrentQuestions.length) * 100) + '%';

    const analysis = document.getElementById('mobile-result-analysis');
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
                        <p style="font-size: 12px; color: #2ed573; margin-top: 6px;">💡 解析：${w.question.explanation}</p>
                    </div>
                `).join('')}
            </div>
        `;
    } else {
        analysis.innerHTML = '<h4>🎉 太棒了！全部正确！</h4>';
    }

    document.getElementById('mobile-exam-content').style.display = 'none';
    document.getElementById('mobile-exam-result').style.display = 'block';

    // Animate score with count-up effect
    const scoreElement = document.getElementById('mobile-result-score');
    animateMobileCountUp(scoreElement, score, 1200);
}

function resetMobileExam() {
    document.getElementById('mobile-exam-content').style.display = 'none';
    document.getElementById('mobile-exam-result').style.display = 'none';
    document.querySelector('.exam-config').style.display = 'block';
}

function initMobileWrongBook() {
    const wrongList = [
        {
            id: 1,
            knowledge: '分数乘除法',
            date: '2026-06-20',
            content: '计算：2/3 × 3/4 = ?',
            wrongAnswer: 'B',
            correctAnswer: 'A'
        },
        {
            id: 2,
            knowledge: '分数乘除法',
            date: '2026-06-19',
            content: '小明有4/5千克苹果，分给3个小朋友，每个小朋友分多少？',
            wrongAnswer: 'C',
            correctAnswer: 'A'
        },
        {
            id: 3,
            knowledge: '图形面积计算',
            date: '2026-06-18',
            content: '一个三角形底是10cm，高是6cm，面积是多少？',
            wrongAnswer: 'B',
            correctAnswer: 'A'
        },
        {
            id: 4,
            knowledge: '单位换算',
            date: '2026-06-16',
            content: '2小时15分钟 = 多少分钟？',
            wrongAnswer: 'B',
            correctAnswer: 'A'
        }
    ];

    const container = document.getElementById('mobile-wrong-list');
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

    document.getElementById('mobile-practice').addEventListener('click', () => {
        mobileGoToExam('分数乘除法');
    });
}

function initMobileAnalysis() {
    const tabs = document.querySelectorAll('.report-tab');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const reportType = tab.dataset.report;
            document.querySelectorAll('.report-content').forEach(r => r.classList.remove('active'));
            document.getElementById(`mobile-${reportType}-report`).classList.add('active');
        });
    });

    document.getElementById('mobile-weekly-report').classList.add('active');
}

function initMobileKnowledgeGraph() {
    const container = document.getElementById('mobile-knowledge-graph');
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const knowledgeData = {
        nodes: [
            { id: 'center', name: '数学', value: 100, type: 'center' },
            { id: 'fraction', name: '分数乘除', value: 45, type: 'leaf' },
            { id: 'area', name: '面积计算', value: 62, type: 'leaf' },
            { id: 'unit', name: '单位换算', value: 78, type: 'leaf' },
            { id: 'decimal', name: '小数加减', value: 91, type: 'leaf' },
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
            { source: 'unit', target: 'word' }
        ]
    };

    const svg = d3.select('#mobile-knowledge-graph')
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    const simulation = d3.forceSimulation(knowledgeData.nodes)
        .force('link', d3.forceLink(knowledgeData.links).id(d => d.id).distance(d => d.source.type === 'center' ? 90 : 70))
        .force('charge', d3.forceManyBody().strength(-250))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(d => getNodeRadius(d.value) + 6));

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
        .on('click', (event, d) => {
            if (d.type === 'leaf') {
                const nameMap = {
                    '分数乘除': '分数乘除法',
                    '面积计算': '图形面积计算',
                    '单位换算': '单位换算',
                    '小数加减': '小数加减法',
                    '应用题': '应用题',
                    '几何图形': '几何图形'
                };
                mobileGoToExam(nameMap[d.name] || d.name);
            }
        });

    nodeGroup.append('circle')
        .attr('class', 'graph-node-circle')
        .attr('r', d => getNodeRadius(d.value))
        .attr('fill', d => getNodeColor(d.value));

    nodeGroup.append('text')
        .attr('class', 'graph-node-label')
        .attr('dy', d => d.type === 'center' ? 0 : -5)
        .text(d => d.name);

    nodeGroup.append('text')
        .attr('class', 'graph-node-percent')
        .attr('dy', d => d.type === 'center' ? 0 : 8)
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
        if (value === 100) return 32;
        return 22 + (value / 100) * 6;
    }

    function getNodeColor(value) {
        if (value === 100) return '#667eea';
        if (value < 50) return '#ff6b6b';
        if (value <= 70) return '#ffa502';
        return '#2ed573';
    }
}
