var OnboardingView = (function() {
    var timers = [];

    function addTimer(timerId) {
        timers.push(timerId);
        return timerId;
    }

    function clearAllTimers() {
        timers.forEach(function(t) {
            clearTimeout(t);
            clearInterval(t);
            cancelAnimationFrame(t);
        });
        timers = [];
    }

    var state = {
        currentStep: 'welcome',
        messageList: [],
        currentQuestionIndex: 0,
        styleScores: {
            'modern-chinese': 0,
            'nordic': 0,
            'japanese': 0,
            'luxury': 0,
            'industrial': 0
        },
        styleResult: null,
        isTyping: false,
        questionnaireMode: 'quick',
        coreQuestionIndex: 0,
        coreAnswers: {}
    };

    var formData = {
            // 风格测试
            budget: '',
            cityTier: '',
            area: '',
            decorationMode: '',
            needs: [],
            houseType: null,
            styleScores: {
                'modern-chinese': 0,
                'nordic': 0,
                'japanese': 0,
                'luxury': 0,
                'industrial': 0
            },
            styleResult: null,

            // ========== 房屋基础信息 ==========
            houseType: '',           // 房屋性质
            houseStatus: '',         // 房屋状态
            houseHeight: '',         // 层高
            propertyRestrictions: [],// 物业限制
            houseDefects: [],        // 房屋硬伤
            electricMeter: '',       // 电表容量
            entranceDoor: '',       // 入户门

            // 老房追加
            oldHouseElectric: '',
            oldHouseWindow: '',
            oldHouseWall: '',

            // ========== 家庭居住画像 ==========
            familyMembers: [],       // 常住人口
            futureChanges: [],       // 未来变化
            pet: '',                 // 宠物
            lifeScenes: [],          // 生活场景

            // ========== 入户动线 ==========
            entryProblems: [],
            entryFunctions: [],
            shoesRegular: 0,
            shoesSeasonal: 0,
            entryPriority: '',

            // ========== 餐厨动线 ==========
            kitchenFrequency: '',
            kitchenProblems: [],
            kitchenFunctions: [],
            kitchenAppliances: '',
            embeddedAppliances: [],
            kitchenPriority: '',

            // ========== 起居动线 ==========
            livingScene: '',
            balconyFunction: '',
            livingPriority: '',

            // ========== 睡眠动线 ==========
            bedroomProblems: [],
            bedroomFunctions: [],
            coatHanger: '',
            bedroomPriority: '',

            // ========== 卫浴动线 ==========
            bathroomConflict: '',
            bathroomFunctions: [],
            bathroomPriority: '',

            // ========== 家政动线 ==========
            laundryFunctions: [],

            // ========== 全屋储物 ==========
            storageLevel: '',
            specialStorage: [],
            storagePriority: '',

            // ========== 固定设备与水电 ==========
            systemDevices: [],
            kitchenDevices: [],
            bathroomDevices: [],
            specialOutlets: [],
            smartHome: '',

            // ========== 风格与视觉 ==========
            atmosphere: '',
            colors: '',
            lighting: '',
            rejections: [],

            // ========== 环保与健康 ==========
            ecoLevel: '',
            sensitiveGroups: [],

            // ========== 工期要求 ==========
            startDate: '',
            moveInDate: '',
            strictDeadline: '',

            // ========== 半包装修专属 ==========
            halfPackageBudget: '',
            selfPurchase: [],
            materialBrand: '',
            craftLevel: '',
            purchaseRhythm: '',
            supportNeeds: [],
            paymentMethod: '',
            acceptanceLevel: ''
        };

    var containerEl = null;
    var messageListEl = null;
    var el = {};

    function cacheElements() {
        el.chatOptions = document.getElementById('chat-options');
        el.backBtn = document.getElementById('onboarding-back-btn');
        el.resetBtn = document.getElementById('onboarding-reset-btn');
        el.messageList = document.getElementById('message-list');
    }

    function clearElementCache() {
        el = {};
    }

    var STYLE_INFO = {
        'modern-chinese': {
            name: '现代中式',
            description: '融合传统中式美学与现代生活方式，以木质温润、对称美学为核心，营造宁静致远的东方意境。',
            keywords: ['木质温润', '对称美学', '东方意境', '禅意静谧'],
            color: 'var(--zhu-red)'
        },
        'nordic': {
            name: '北欧风格',
            description: '简约自然的斯堪的纳维亚设计，注重功能性与舒适度，以浅色调和原木质感营造温馨居家氛围。',
            keywords: ['简约自然', '原木质感', '温馨舒适', '功能至上'],
            color: 'var(--zhu-green)'
        },
        'japanese': {
            name: '日式风格',
            description: '侘寂美学的极致体现，崇尚自然材质与留白艺术，追求简朴、静谧、禅意的生活空间。',
            keywords: ['侘寂美学', '留白艺术', '自然材质', '禅意空间'],
            color: 'var(--tan-brown)'
        },
        'luxury': {
            name: '轻奢风格',
            description: '低调奢华的现代都市美学，精致的金属质感与大理石纹理碰撞，彰显品质生活格调。',
            keywords: ['精致奢华', '金属质感', '大理石纹', '品质生活'],
            color: 'var(--gold-dark)'
        },
        'industrial': {
            name: '工业风格',
            description: '原始粗犷的工业美学，裸露的砖墙与金属管道碰撞，打造个性十足的自由空间。',
            keywords: ['原始粗犷', '金属管道', '砖墙质感', '个性自由'],
            color: 'var(--gray-700)'
        }
    };

    var QUESTIONS = [
        {
            id: 'visual',
            question: '首先想问问您，在视觉上您更喜欢哪种感觉呢？是温润的木质调，还是清爽的简约风？',
            options: [
                { label: 'A. 喜欢木质温润', sub: '中式韵味，古典雅致', style: 'modern-chinese' },
                { label: 'B. 简洁干净', sub: '北欧简约，清爽明亮', style: 'nordic' },
                { label: 'C. 自然禅意', sub: '日式侘寂，质朴宁静', style: 'japanese' },
                { label: 'D. 精致奢华', sub: '轻奢质感，典雅华贵', style: 'luxury' }
            ]
        },
        {
            id: 'color',
            question: '那色彩搭配方面呢？什么样的色调会让您觉得最放松、最舒服？',
            options: [
                { label: 'A. 暖棕米白系', sub: '温润沉稳，中式底蕴', style: 'modern-chinese' },
                { label: 'B. 灰白原木色', sub: '清新自然，北欧风情', style: 'nordic' },
                { label: 'C. 木色米白', sub: '柔和素雅，日式禅意', style: 'japanese' },
                { label: 'D. 金灰大理石', sub: '高端大气，轻奢格调', style: 'luxury' }
            ]
        },
        {
            id: 'lifestyle',
            question: '聊聊您理想中的生活方式吧~ 您平时在家最喜欢做什么呢？',
            options: [
                { label: 'A. 泡茶看书宅家', sub: '静谧闲适，文人雅趣', style: 'modern-chinese' },
                { label: 'B. 简约干净整洁', sub: '井井有条，舒适自在', style: 'nordic' },
                { label: 'C. 冥想绿植相伴', sub: '亲近自然，修身养性', style: 'japanese' },
                { label: 'D. 聚会社交达人', sub: '热闹非凡，品质社交', style: 'luxury' }
            ]
        },
        {
            id: 'material',
            question: '材质方面您有偏好吗？不同的材质会带来完全不同的触感和氛围哦~',
            options: [
                { label: 'A. 实木棉麻', sub: '天然质感，温润如玉', style: 'modern-chinese' },
                { label: 'B. 原木布艺', sub: '自然温馨，舒适柔软', style: 'nordic' },
                { label: 'C. 原木藤编', sub: '质朴原生态，清新自然', style: 'japanese' },
                { label: 'D. 金属大理石', sub: '精致高级，质感十足', style: 'luxury' }
            ]
        },
        {
            id: 'ultimate',
            question: '最后一个小问题~ 如果只能选一件家具，您最想拥有的是哪一件呢？',
            options: [
                { label: 'A. 圈椅茶几', sub: '中式经典，儒雅风范', style: 'modern-chinese' },
                { label: 'B. 舒适沙发', sub: '北欧标配，慵懒时光', style: 'nordic' },
                { label: 'C. 榻榻米', sub: '日式禅意，灵活多变', style: 'japanese' },
                { label: 'D. 豪华躺椅', sub: '轻奢享受，品质人生', style: 'luxury' }
            ]
        }
    ];

    var BUDGET_OPTIONS = ['5万以下', '5-10万', '10-15万', '15-20万', '20万以上'];
    var CITY_OPTIONS = ['一线城市', '新一线城市', '二线城市', '三线及以下'];
    var NEEDS_OPTIONS = ['有老人', '有小孩', '养宠物', '居家办公', '经常做饭', '需要书房'];

    var DECORATION_MODES = [
        { id: 'self', name: '自装', desc: '自己找工人，自己买材料，全程自己把控' },
        { id: 'half', name: '半包', desc: '包工不包料，主材自购，施工队负责人工和辅材' },
        { id: 'full', name: '全包', desc: '包工又包料，装修公司全流程负责，省心省力' }
    ];

    var HOUSE_TYPES = [
        { id: 'A', name: 'A户型', area: '89㎡', layout: '两室一厅一厨一卫', desc: '紧凑实用的小户型，适合年轻夫妻或单身人士' },
        { id: 'B', name: 'B户型', area: '110㎡', layout: '三室一厅两卫', desc: '舒适三居室，适合三口之家' },
        { id: 'C', name: 'C户型', area: '135㎡', layout: '四室两厅两卫', desc: '宽敞大户型，适合多代同堂' }
    ];

    function render(container) {
        containerEl = container;
        container.innerHTML = `
            <div class="onboarding-container">
                <div class="onboarding-chat" id="onboarding-chat">
                    <div class="questionnaire-progress" id="questionnaire-progress"></div>
                    <div class="chat-header">
                        <div class="chat-header-left">
                            <button class="chat-header-back" id="onboarding-back-btn" aria-label="返回首页" title="返回首页">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M19 12H5"/>
                                    <polyline points="12 19 5 12 12 5"/>
                                </svg>
                            </button>
                            <div class="chat-avatar-nian">
                                <span class="nian-emoji-small">${Icons.render('nian-default')}</span>
                            </div>
                            <div class="chat-header-info">
                                <div class="chat-header-name">装修小管家</div>
                                <div class="chat-header-status">在线</div>
                            </div>
                        </div>
                        <button class="chat-header-close" id="onboarding-reset-btn" title="重新开始">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                                <path d="M3 3v5h5"/>
                            </svg>
                        </button>
                    </div>
                    <div class="message-list" id="message-list"></div>
                    <div class="chat-input-area" id="chat-input-area">
                        <div class="chat-options" id="chat-options"></div>
                    </div>
                </div>
            </div>
        `;
    }

    function init(container) {
        messageListEl = document.getElementById('message-list');
        cacheElements();
        bindEvents();
        startFlow();
    }

    function bindEvents() {
        if (el.backBtn) {
            el.backBtn.addEventListener('click', function() {
                if (window.App && typeof App.switchView === 'function') {
                    App.switchView('hero');
                }
            });
        }
        if (el.resetBtn) {
            el.resetBtn.addEventListener('click', function() {
                reset();
            });
        }
    }

    function startFlow() {
        state.messageList = [];
        state.currentQuestionIndex = 0;
        state.coreQuestionIndex = 0;
        state.coreAnswers = {};
        state.questionnaireMode = 'quick';
        state.styleScores = {
            'modern-chinese': 0,
            'nordic': 0,
            'japanese': 0,
            'luxury': 0,
            'industrial': 0
        };
        state.styleResult = null;
        state.formData = {
            budget: '',
            cityTier: '',
            area: '',
            decorationMode: '',
            needs: [],
            houseType: null
        };
        state.currentStep = 'welcome';

        addNianMessage('您好呀！我是您的专属装修小管家~');
        
        addTimer(setTimeout(function() {
            addNianMessage('很高兴能陪您一起开启新居设计之旅！装修是件大事，咱们一步一步来，我会帮您把好每一关的~');
            addTimer(setTimeout(function() {
                showModeSelection();
            }, 800));
        }, 800));
    }

    function showModeSelection() {
        state.currentStep = 'mode-selection';
        addNianMessage('为了更好地为您服务，您可以选择问卷模式：');
        addTimer(setTimeout(function() {
            renderModeOptions();
        }, 600));
    }

    function renderModeOptions() {
        var optionsEl = el.chatOptions;
        if (!optionsEl) return;

        optionsEl.innerHTML = '';
        var container = document.createElement('div');
        container.className = 'mode-selection-container';

        var quickCard = document.createElement('div');
        quickCard.className = 'mode-card card mode-card-quick';
        quickCard.innerHTML = `
            <div class="mode-card-header">
                <div class="mode-icon">⚡</div>
                <div class="mode-badge">推荐</div>
            </div>
            <div class="mode-card-title">快速模式</div>
            <div class="mode-card-desc">约 3 分钟，12 道核心问题</div>
            <div class="mode-card-sub">快速了解核心需求，高效获取方案</div>
        `;
        quickCard.addEventListener('click', function() {
            selectMode('quick');
        });

        var detailedCard = document.createElement('div');
        detailedCard.className = 'mode-card card mode-card-detailed';
        detailedCard.innerHTML = `
            <div class="mode-card-header">
                <div class="mode-icon">📋</div>
            </div>
            <div class="mode-card-title">详细模式</div>
            <div class="mode-card-desc">约 10 分钟，全面需求采集</div>
            <div class="mode-card-sub">深度了解每一个细节，方案更精准</div>
        `;
        detailedCard.addEventListener('click', function() {
            selectMode('detailed');
        });

        container.appendChild(quickCard);
        container.appendChild(detailedCard);

        var skipLink = document.createElement('div');
        skipLink.className = 'skip-link-container';
        skipLink.innerHTML = '<button class="btn-text skip-link">跳过问卷，直接开始</button>';
        skipLink.querySelector('.skip-link').addEventListener('click', function() {
            skipQuestionnaire();
        });
        container.appendChild(skipLink);

        optionsEl.appendChild(container);
    }

    function selectMode(mode) {
        state.questionnaireMode = mode;
        var modeText = mode === 'quick' ? '快速模式' : '详细模式';
        addUserMessage(modeText);
        clearOptions();

        if (mode === 'quick') {
            addTimer(setTimeout(function() {
                addNianMessage('好的！我们用最快的方式来了解您的需求，只需要 12 个小问题~');
                addTimer(setTimeout(function() {
                    startCoreQuestionnaire();
                }, 800));
            }, 400));
        } else {
            addTimer(setTimeout(function() {
                addNianMessage('好的！让我们详细了解您的需求，这样方案会更精准~');
                addTimer(setTimeout(function() {
                    addNianMessage('首先让我了解一下您房屋的基本情况，这样可以为您推荐最合适的装修方案~');
                    addTimer(setTimeout(function() {
                        startQuestionnaire();
                    }, 800));
                }, 800));
            }, 400));
        }
    }

    function skipQuestionnaire() {
        addUserMessage('跳过问卷，直接开始');
        clearOptions();

        formData.core_budget = '10_20';
        formData.core_houseStatus = 'rough';
        formData.core_area = 'medium';
        formData.core_decorationMode = 'full';

        if (window.App && App.state && App.state.userData) {
            App.state.userData.formData = formData;
            App.state.userData.questionnaireMode = 'skipped';
            App.saveState(true);
        }

        addTimer(setTimeout(function() {
            addNianMessage('好的！我们直接开始装修之旅~ 您可以随时在设置中补充需求信息。');
            addTimer(setTimeout(function() {
                goToSOP();
            }, 800));
        }, 400));
    }

    function addNianMessage(text) {
        var msg = { type: 'nian', text: text, id: Date.now() + Math.random() };
        state.messageList.push(msg);
        renderMessage(msg);
        scrollToBottom();
    }

    function addUserMessage(text) {
        var msg = { type: 'user', text: text, id: Date.now() + Math.random() };
        state.messageList.push(msg);
        renderMessage(msg);
        scrollToBottom();
    }

    function showTypingIndicator() {
        state.isTyping = true;
        var typingEl = document.createElement('div');
        typingEl.className = 'message-row message-row-nian typing-indicator';
        typingEl.id = 'typing-indicator';
        typingEl.innerHTML = `
            <div class="message-avatar">
                <span class="nian-emoji-small">${Icons.render('nian-default')}</span>
            </div>
            <div class="typing-bubble">
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
            </div>
        `;
        messageListEl.appendChild(typingEl);
        scrollToBottom();
    }

    function hideTypingIndicator() {
        state.isTyping = false;
        var typingEl = document.getElementById('typing-indicator');
        if (typingEl) {
            typingEl.remove();
        }
    }

    function renderMessage(msg) {
        var msgEl = document.createElement('div');
        msgEl.className = 'message-row message-row-' + msg.type + ' message-enter';
        
        if (msg.type === 'nian') {
            msgEl.innerHTML = `
                <div class="message-avatar">
                    <span class="nian-emoji-small">${Icons.render('nian-default')}</span>
                </div>
                <div class="message-bubble bubble-nian">
                    ${escapeHtml(msg.text)}
                </div>
            `;
        } else {
            msgEl.innerHTML = `
                <div class="message-bubble bubble-user">
                    ${escapeHtml(msg.text)}
                </div>
            `;
        }
        
        messageListEl.appendChild(msgEl);
        
        addTimer(requestAnimationFrame(function() {
            msgEl.classList.add('message-enter-active');
        }));
    }

    function scrollToBottom() {
        if (messageListEl) {
            addTimer(setTimeout(function() {
                messageListEl.scrollTop = messageListEl.scrollHeight;
            }, 50));
        }
    }

    function showQuestion(index) {
        if (index >= QUESTIONS.length) {
            calculateStyleResult();
            return;
        }

        state.currentStep = 'question_' + index;
        var q = QUESTIONS[index];

        showTypingIndicator();
        addTimer(setTimeout(function() {
            hideTypingIndicator();
            addNianMessage(q.question);
            addTimer(setTimeout(function() {
                renderOptionCards(q.options, function(selectedOption) {
                    handleAnswer(index, selectedOption);
                });
            }, 600));
        }, 800));
    }

    function renderOptionCards(options, callback) {
        var optionsEl = el.chatOptions;
        if (!optionsEl) return;

        optionsEl.innerHTML = '';
        var optionsGrid = document.createElement('div');
        optionsGrid.className = 'options-grid';

        options.forEach(function(opt, idx) {
            var card = document.createElement('div');
            card.className = 'option-card card';
            card.innerHTML = `
                <div class="option-card-content">
                    <div class="option-label">${opt.label}</div>
                    <div class="option-sub">${opt.sub}</div>
                </div>
            `;
            card.addEventListener('click', function() {
                callback(opt);
            });
            optionsGrid.appendChild(card);
        });

        optionsEl.appendChild(optionsGrid);
    }

    function handleAnswer(questionIndex, option) {
        addUserMessage(option.label);
        
        clearOptions();

        if (option.style) {
            state.styleScores[option.style] += 20;
        }

        state.currentQuestionIndex = questionIndex + 1;

        addTimer(setTimeout(function() {
            showQuestion(state.currentQuestionIndex);
        }, 600));
    }

    function clearOptions() {
        var optionsEl = el.chatOptions;
        if (optionsEl) {
            optionsEl.innerHTML = '';
        }
    }

    function calculateStyleResult() {
        state.currentStep = 'style-result';

        var total = 0;
        Object.keys(state.styleScores).forEach(function(key) {
            total += state.styleScores[key];
        });

        var maxScore = 0;
        var maxStyle = null;
        var stylePercentages = {};

        Object.keys(state.styleScores).forEach(function(key) {
            var pct = total > 0 ? Math.round((state.styleScores[key] / total) * 100) : 0;
            stylePercentages[key] = pct;
            if (state.styleScores[key] > maxScore) {
                maxScore = state.styleScores[key];
                maxStyle = key;
            }
        });

        state.styleResult = {
            primary: maxStyle,
            percentages: stylePercentages,
            info: STYLE_INFO[maxStyle]
        };

        showTypingIndicator();
        addTimer(setTimeout(function() {
            hideTypingIndicator();
            addNianMessage('好啦，5个问题都答完了，您的选择都很有想法~');
            addTimer(setTimeout(function() {
                addNianMessage('让我帮您分析一下您的风格偏好...');
                addTimer(setTimeout(function() {
                    renderStyleReport();
                }, 1000));
            }, 800));
        }, 1000));
    }

    function renderStyleReport() {
        state.currentStep = 'style-report';
        var result = state.styleResult;
        var info = result.info;
        var radius = 50;
        var circumference = 2 * Math.PI * radius;
        var pct = result.percentages[result.primary];
        var dashOffset = circumference * (1 - pct / 100);

        var msgEl = document.createElement('div');
        msgEl.className = 'message-row message-row-nian message-enter';
        msgEl.innerHTML = `
            <div class="message-avatar">
                <span class="nian-emoji-small">${Icons.render('nian-default')}</span>
            </div>
            <div class="style-report-card card">
                <div class="style-report-header">
                    <div class="style-ring-container">
                        <svg class="style-ring" viewBox="0 0 120 120">
                            <circle class="style-ring-bg" cx="60" cy="60" r="${radius}"/>
                            <circle class="style-ring-progress" cx="60" cy="60" r="${radius}"
                                stroke-dasharray="${circumference}"
                                stroke-dashoffset="${dashOffset}"
                                style="stroke: ${info.color}; --target-dashoffset: ${dashOffset};"/>
                            <text class="style-ring-text" x="60" y="55" text-anchor="middle">${pct}%</text>
                            <text class="style-ring-label" x="60" y="72" text-anchor="middle">匹配度</text>
                        </svg>
                    </div>
                    <div class="style-report-title">
                        <h3>${info.name}</h3>
                        <p>${info.description}</p>
                    </div>
                </div>
                <div class="style-keywords">
                    ${info.keywords.map(function(kw) {
                        return `<span class="badge badge-blue">${kw}</span>`;
                    }).join('')}
                </div>
                <div class="style-other-styles">
                    <div class="other-styles-title">其他风格匹配度</div>
                    <div class="other-styles-list">
                        ${Object.keys(result.percentages)
                            .filter(function(s) { return s !== result.primary; })
                            .sort(function(a, b) { return result.percentages[b] - result.percentages[a]; })
                            .map(function(s) {
                                var sInfo = STYLE_INFO[s];
                                return `
                                    <div class="other-style-item">
                                        <div class="other-style-name">${sInfo.name}</div>
                                        <div class="progress-bar">
                                            <div class="progress-fill" style="width: ${result.percentages[s]}%; background: ${sInfo.color};"></div>
                                        </div>
                                        <div class="other-style-pct">${result.percentages[s]}%</div>
                                    </div>
                                `;
                            }).join('')}
                    </div>
                </div>
                <div class="style-report-action">
                    <button class="btn-primary" id="confirm-style-btn">确认这个风格</button>
                </div>
            </div>
        `;
        messageListEl.appendChild(msgEl);
        addTimer(requestAnimationFrame(function() {
            msgEl.classList.add('message-enter-active');
        }));
        scrollToBottom();

        var confirmBtn = document.getElementById('confirm-style-btn');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', function() {
                confirmStyle();
            });
        }
    }

    function confirmStyle() {
        addUserMessage('确认这个风格');
        clearOptions();

        if (window.App && App.state && App.state.userData) {
            App.state.userData.styleResult = state.styleResult;
            App.saveState();
        }

        addTimer(setTimeout(function() {
            addNianMessage('好的！风格已经帮您确定好了~');
            addTimer(setTimeout(function() {
                addNianMessage('接下来，我想再了解一些基础信息，这样可以为您规划更精准的装修方案，可以吗？');
                addTimer(setTimeout(function() {
                    showBudgetStep();
                }, 800));
            }, 600));
        }, 400));
    }

    function showBudgetStep() {
        state.currentStep = 'budget';
        addNianMessage('首先想问问您，装修预算大概在什么范围呢？这样我可以帮您更合理地分配每一笔钱~');
        addTimer(setTimeout(function() {
            renderBudgetOptions();
        }, 600));
    }

    function renderBudgetOptions() {
        var optionsEl = el.chatOptions;
        if (!optionsEl) return;

        optionsEl.innerHTML = '';
        var optionsGrid = document.createElement('div');
        optionsGrid.className = 'options-grid options-grid-2';

        BUDGET_OPTIONS.forEach(function(budget) {
            var card = document.createElement('div');
            card.className = 'option-card card';
            card.innerHTML = `
                <div class="option-card-content">
                    <div class="option-label">${budget}</div>
                </div>
            `;
            card.addEventListener('click', function() {
                selectBudget(budget);
            });
            optionsGrid.appendChild(card);
        });

        optionsEl.appendChild(optionsGrid);
    }

    function selectBudget(budget) {
        addUserMessage(budget);
        state.formData.budget = budget;
        clearOptions();

        if (window.App && App.state && App.state.userData) {
            App.state.userData.budget = budget;
            App.saveState();
        }

        addTimer(setTimeout(function() {
            showCityStep();
        }, 600));
    }

    function showCityStep() {
        state.currentStep = 'city';
        addNianMessage('好的，了解了~ 您所在的城市是哪里呢？不同城市的人工和材料价格会有点不一样哦~');
        addTimer(setTimeout(function() {
            renderCityOptions();
        }, 600));
    }

    function renderCityOptions() {
        var optionsEl = el.chatOptions;
        if (!optionsEl) return;

        optionsEl.innerHTML = '';
        var optionsGrid = document.createElement('div');
        optionsGrid.className = 'options-grid options-grid-2';

        CITY_OPTIONS.forEach(function(city) {
            var card = document.createElement('div');
            card.className = 'option-card card';
            card.innerHTML = `
                <div class="option-card-content">
                    <div class="option-label">${city}</div>
                </div>
            `;
            card.addEventListener('click', function() {
                selectCity(city);
            });
            optionsGrid.appendChild(card);
        });

        optionsEl.appendChild(optionsGrid);
    }

    function selectCity(city) {
        addUserMessage(city);
        state.formData.cityTier = city;
        clearOptions();

        if (window.App && App.state && App.state.userData) {
            App.state.userData.cityTier = city;
            App.saveState();
        }

        addTimer(setTimeout(function() {
            showAreaStep();
        }, 600));
    }

    function showAreaStep() {
        state.currentStep = 'area';
        addNianMessage('好的，记下了~ 房屋面积大概是多少平方米呢？这样我可以帮您估算材料用量和工期~');
        addTimer(setTimeout(function() {
            renderAreaInput();
        }, 600));
    }

    function renderAreaInput() {
        var optionsEl = el.chatOptions;
        if (!optionsEl) return;

        optionsEl.innerHTML = '';
        var areaContainer = document.createElement('div');
        areaContainer.className = 'area-input-container';
        areaContainer.innerHTML = `
            <div class="area-input-wrapper card">
                <input type="number" id="area-input" class="area-input" placeholder="请输入面积" min="1" max="1000">
                <span class="area-unit">㎡</span>
            </div>
            <button class="btn-primary area-confirm-btn" id="area-confirm-btn">确认</button>
        `;
        optionsEl.appendChild(areaContainer);

        var input = document.getElementById('area-input');
        var confirmBtn = document.getElementById('area-confirm-btn');

        function confirmArea() {
            var val = input.value.trim();
            var numVal = Number(val);
            if (!val || isNaN(numVal) || numVal <= 0) {
                input.style.borderColor = '#ff4d4f';
                addNianMessage('面积需要大于0哦，请重新输入一下~');
                return;
            }
            if (numVal > 10000) {
                input.style.borderColor = '#ff4d4f';
                addNianMessage('面积太大啦，是不是输错了？请输入10000以内的数字~');
                return;
            }
            input.style.borderColor = '';
            selectArea(Math.min(numVal, 10000));
        }

        if (confirmBtn) {
            confirmBtn.addEventListener('click', confirmArea);
        }
        if (input) {
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    confirmArea();
                }
            });
            addTimer(setTimeout(function() { input.focus(); }, 100));
        }
    }

    function selectArea(area) {
        addUserMessage(area + ' ㎡');
        state.formData.area = area;
        clearOptions();

        if (window.App && App.state && App.state.userData) {
            App.state.userData.area = area;
            App.saveState();
        }

        addTimer(setTimeout(function() {
            startQuestionnaire();
        }, 600));
    }

    function showDecorationModeStep() {
        state.currentStep = 'decoration-mode';
        addNianMessage('好的，面积也记下了~ 关于装修模式，您更倾向于哪种呢？不同的模式在费用、精力投入和效果把控上会各有特点哦~');
        addTimer(setTimeout(function() {
            renderDecorationModeOptions();
        }, 600));
    }

    function renderDecorationModeOptions(recommendedMode) {
        var optionsEl = el.chatOptions;
        if (!optionsEl) return;

        optionsEl.innerHTML = '';
        var optionsGrid = document.createElement('div');
        optionsGrid.className = 'options-grid options-grid-3';

        DECORATION_MODES.forEach(function(mode) {
            var card = document.createElement('div');
            card.className = 'option-card card decoration-mode-card';
            card.dataset.mode = mode.id;
            var recommendedTag = mode.id === recommendedMode ? '<span class="recommend-tag">推荐</span>' : '';
            card.innerHTML = `
                <div class="option-card-content">
                    <div class="option-label">${mode.name}${recommendedTag}</div>
                    <div class="option-sub">${mode.desc}</div>
                </div>
            `;
            card.addEventListener('click', function() {
                selectDecorationMode(mode);
            });
            optionsGrid.appendChild(card);
        });

        optionsEl.appendChild(optionsGrid);
    }

    /**
     * 计算推荐装修模式
     * 基于评估问卷的答题结果进行加权评分
     */
    function calculateRecommendedMode() {
        var scores = { self: 0, half: 0, full: 0 };

        // 评估题选项对应的分数
        // A选项 = 自装+2, B选项 = 半包+2, C选项 = 全包+2
        var optionScores = {
            'A': { self: 2, half: 1, full: 0 },
            'B': { self: 0, half: 2, full: 1 },
            'C': { self: 0, half: 1, full: 2 }
        };

        // 遍历评估题计算分数
        var evalQuestions = QUESTIONNAIRE_DATA.modeEvaluation.questions;
        evalQuestions.forEach(function(question) {
            var answer = formData[question.id];
            if (answer && optionScores[answer]) {
                var weight = question.weight || 10;
                scores.self += optionScores[answer].self * weight;
                scores.half += optionScores[answer].half * weight;
                scores.full += optionScores[answer].full * weight;
            }
        });

        // 返回得分最高的模式
        if (scores.self >= scores.half && scores.self >= scores.full) {
            return 'self';
        } else if (scores.half >= scores.self && scores.half >= scores.full) {
            return 'half';
        } else {
            return 'full';
        }
    }

    function showComingSoonModal() {
        var modal = document.createElement('div');
        modal.className = 'modal onboarding-modal';
        modal.innerHTML = `
            <div class="modal-content onboarding-modal-content">
                <div class="onboarding-modal-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--dai-blue)" stroke-width="1.5">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                </div>
                <div class="onboarding-modal-title">温馨提示</div>
                <div class="onboarding-modal-body">该装修模式正在开发中，敬请期待</div>
                <button class="btn-primary onboarding-modal-btn" id="coming-soon-confirm-btn">知道了</button>
            </div>
        `;

        document.body.appendChild(modal);

        addTimer(requestAnimationFrame(function() {
            modal.classList.add('active');
        }));

        function closeModal() {
            modal.classList.remove('active');
            addTimer(setTimeout(function() {
                if (modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
            }, 300));
        }

        var confirmBtn = document.getElementById('coming-soon-confirm-btn');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', closeModal);
        }

        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal();
            }
        });
    }

    function selectDecorationMode(mode) {
        if (mode.id === 'self' || mode.id === 'half') {
            showDevelopmentModal(mode.name);
            return;
        }

        addUserMessage(mode.name);
        state.formData.decorationMode = mode.id;
        clearOptions();

        if (window.App && App.state && App.state.userData) {
            App.state.userData.decorationMode = mode.id;
            App.saveState();
        }

        addTimer(setTimeout(function() {
            showBoundaryAlign(mode.id);
        }, 600));
    }

    function showDevelopmentModal(modeName) {
        var modal = document.createElement('div');
        modal.className = 'modal onboarding-modal';
        modal.innerHTML = `
            <div class="modal-content onboarding-modal-content">
                <div class="onboarding-modal-icon">🚧</div>
                <div class="onboarding-modal-title">功能开发中</div>
                <div class="onboarding-modal-body">"${modeName}"模式正在开发中，暂时无法使用。<br><br>当前仅支持"全包"模式的完整需求采集，敬请期待其他模式上线~</div>
                <button class="btn-primary onboarding-modal-btn" id="dev-modal-confirm-btn">确定</button>
            </div>
        `;

        document.body.appendChild(modal);

        addTimer(requestAnimationFrame(function() {
            modal.classList.add('active');
        }));

        function closeModal() {
            modal.classList.remove('active');
            addTimer(setTimeout(function() {
                if (modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
                renderDecorationModeOptions();
            }, 300));
        }

        var confirmBtn = document.getElementById('dev-modal-confirm-btn');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                closeModal();
            });
        }
    }

    function showNeedsStep() {
        state.currentStep = 'needs';
        addNianMessage('好的，面积也记下了~ 家里有什么特殊需求吗？比如有老人小孩、养宠物之类的，您可以多选，我会帮您考虑进去的~');
        addTimer(setTimeout(function() {
            renderNeedsOptions();
        }, 600));
    }

    function renderNeedsOptions() {
        var optionsEl = el.chatOptions;
        if (!optionsEl) return;

        state.formData.needs = [];

        optionsEl.innerHTML = '';
        var needsContainer = document.createElement('div');
        needsContainer.className = 'needs-container';
        
        var optionsGrid = document.createElement('div');
        optionsGrid.className = 'options-grid options-grid-3';

        NEEDS_OPTIONS.forEach(function(need) {
            var card = document.createElement('div');
            card.className = 'option-card card need-card';
            card.dataset.need = need;
            card.innerHTML = `
                <div class="option-card-content">
                    <div class="need-checkbox">
                        <svg class="need-check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </div>
                    <div class="option-label">${need}</div>
                </div>
            `;
            card.addEventListener('click', function() {
                toggleNeed(card, need);
            });
            optionsGrid.appendChild(card);
        });

        needsContainer.appendChild(optionsGrid);

        var confirmBtn = document.createElement('button');
        confirmBtn.className = 'btn-primary needs-confirm-btn';
        confirmBtn.id = 'needs-confirm-btn';
        confirmBtn.textContent = '确认';
        confirmBtn.disabled = true;
        confirmBtn.addEventListener('click', function() {
            confirmNeeds();
        });
        needsContainer.appendChild(confirmBtn);

        optionsEl.appendChild(needsContainer);
    }

    function toggleNeed(card, need) {
        var idx = state.formData.needs.indexOf(need);
        if (idx > -1) {
            state.formData.needs.splice(idx, 1);
            card.classList.remove('selected');
        } else {
            state.formData.needs.push(need);
            card.classList.add('selected');
        }

        var confirmBtn = document.getElementById('needs-confirm-btn');
        if (confirmBtn) {
            confirmBtn.disabled = state.formData.needs.length === 0;
        }
    }

    function confirmNeeds() {
        var needsText = state.formData.needs.join('、');
        addUserMessage(needsText || '无特殊需求');
        clearOptions();

        if (window.App && App.state && App.state.userData) {
            App.state.userData.needs = state.formData.needs;
            App.saveState();
        }

        addTimer(setTimeout(function() {
            addNianMessage('好的，您的需求我都记下来了，我会在方案里特别考虑这些的~');
            addTimer(setTimeout(function() {
                showHouseTypeIntro();
            }, 800));
        }, 400));
    }

    function showHouseTypeIntro() {
        state.currentStep = 'house-intro';
        addNianMessage('最后一步啦~ 如果您有户型图的话，可以上传一下，让AI帮您分析分析，这样规划会更精准哦~');
        addTimer(setTimeout(function() {
            renderUploadPage();
        }, 800));
    }

    function renderUploadPage() {
        var optionsEl = el.chatOptions;
        if (!optionsEl) return;

        optionsEl.innerHTML = '';
        var uploadContainer = document.createElement('div');
        uploadContainer.className = 'upload-container card';
        uploadContainer.innerHTML = `
            <div class="upload-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--dai-blue)" stroke-width="1.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
            </div>
            <div class="upload-title">上传你的户型图</div>
            <div class="upload-desc">支持 JPG、PNG 格式，智能识别</div>
            <button class="btn-primary upload-btn" id="upload-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                选择图片上传
            </button>
        `;
        optionsEl.appendChild(uploadContainer);

        var uploadBtn = document.getElementById('upload-btn');
        if (uploadBtn) {
            uploadBtn.addEventListener('click', function() {
                startAIAnalysis();
            });
        }
    }

    function startAIAnalysis() {
        state.currentStep = 'ai-analyzing';
        clearOptions();

        addUserMessage('已上传户型图');

        addTimer(setTimeout(function() {
            addNianMessage('好的，收到您的户型图了！我这就让AI帮您分析分析，请稍等一下下~');
            addTimer(setTimeout(function() {
                renderLoadingAnimation();
            }, 600));
        }, 400));
    }

    function renderLoadingAnimation() {
        var msgEl = document.createElement('div');
        msgEl.className = 'message-row message-row-nian message-enter';
        msgEl.innerHTML = `
            <div class="message-avatar">
                <span class="nian-emoji-small">${Icons.render('nian-default')}</span>
            </div>
            <div class="ai-loading-card card">
                <div class="ink-spinner">
                    <svg viewBox="0 0 100 100" class="ink-circle">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="var(--dai-blue)" stroke-width="3" stroke-dasharray="60 200" class="ink-circle-progress"/>
                    </svg>
                    <div class="ink-center">
                        <span>AI</span>
                    </div>
                </div>
                <div class="ai-loading-text">智能分析中...</div>
                <div class="ai-loading-sub">正在识别户型结构</div>
            </div>
        `;
        messageListEl.appendChild(msgEl);
        addTimer(requestAnimationFrame(function() {
            msgEl.classList.add('message-enter-active');
        }));
        scrollToBottom();

        addTimer(setTimeout(function() {
            msgEl.remove();
            showHouseTypeResults();
        }, 2500));
    }

    function showHouseTypeResults() {
        state.currentStep = 'house-results';
        addNianMessage('分析完成啦！根据您的户型，为您找到了3套参考户型，您看看哪一套最接近您家的情况呢？');
        addTimer(setTimeout(function() {
            renderHouseTypeOptions();
        }, 800));
    }

    function renderHouseTypeOptions() {
        var optionsEl = el.chatOptions;
        if (!optionsEl) return;

        optionsEl.innerHTML = '';
        var houseContainer = document.createElement('div');
        houseContainer.className = 'house-type-container';

        HOUSE_TYPES.forEach(function(house) {
            var card = document.createElement('div');
            card.className = 'house-type-card card';
            card.innerHTML = `
                <div class="house-type-header">
                    <div class="house-type-name">${house.name}</div>
                    <div class="house-type-area">${house.area}</div>
                </div>
                <div class="house-type-layout">${house.layout}</div>
                <div class="house-type-desc">${house.desc}</div>
                <div class="house-type-floorplan">
                    <div class="floorplan-placeholder">
                        <svg width="80" height="60" viewBox="0 0 80 60" fill="none" stroke="var(--dai-blue)" stroke-width="1">
                            <rect x="5" y="5" width="70" height="50" rx="2"/>
                            <line x1="30" y1="5" x2="30" y2="35"/>
                            <line x1="55" y1="5" x2="55" y2="35"/>
                            <line x1="5" y1="35" x2="75" y2="35"/>
                            <rect x="35" y="40" width="15" height="10" rx="1" fill="var(--dai-blue)" fill-opacity="0.1"/>
                        </svg>
                    </div>
                </div>
            `;
            card.addEventListener('click', function() {
                selectHouseType(house);
            });
            houseContainer.appendChild(card);
        });

        optionsEl.appendChild(houseContainer);
    }

    function selectHouseType(house) {
        addUserMessage(house.name + ' ' + house.area + ' ' + house.layout);
        state.formData.houseType = house;
        clearOptions();

        if (window.App && App.state && App.state.userData) {
            App.state.userData.houseType = house;
            App.saveState();
        }

        addTimer(setTimeout(function() {
            addNianMessage('太好了！所有信息都收集好了，您的情况我都了解清楚了~');
            addTimer(setTimeout(function() {
                renderFinalConfirm();
            }, 800));
        }, 400));
    }

    function renderFinalConfirm() {
        state.currentStep = 'final-confirm';
        
        // 清除选项区域
        clearOptions();
        
        var msgEl = document.createElement('div');
        msgEl.className = 'message-row message-row-nian message-enter';
        msgEl.innerHTML = `
            <div class="message-avatar">
                <span class="nian-emoji-small">${Icons.render('nian-default')}</span>
            </div>
            <div class="final-confirm-card card">
                <div class="final-confirm-title">全部准备就绪！</div>
                <div class="final-confirm-desc">点击下方按钮，开始你的装修之旅吧～</div>
                <div class="final-confirm-actions">
                    <button class="btn-secondary final-view-btn" id="final-view-btn">查看需求表</button>
                    <button class="btn-secondary final-export-btn" id="final-export-btn">导出PDF</button>
                </div>
                <button class="btn-primary final-confirm-btn" id="final-confirm-btn">开始 SOP 流程</button>
            </div>
        `;
        messageListEl.appendChild(msgEl);
        addTimer(requestAnimationFrame(function() {
            msgEl.classList.add('message-enter-active');
        }));
        scrollToBottom();

        var finalBtn = document.getElementById('final-confirm-btn');
        if (finalBtn) {
            finalBtn.addEventListener('click', function() {
                if (finalBtn.disabled) return;
                finalBtn.disabled = true;
                goToSOP();
            });
        }

        var viewBtn = document.getElementById('final-view-btn');
        if (viewBtn) {
            viewBtn.addEventListener('click', function() {
                if (viewBtn.disabled) return;
                viewBtn.disabled = true;
                renderRequirementTable();
                addTimer(setTimeout(function() { viewBtn.disabled = false; }, 1000));
            });
        }

        var exportBtn = document.getElementById('final-export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', function() {
                if (exportBtn.disabled) return;
                exportBtn.disabled = true;
                exportToPDF();
                addTimer(setTimeout(function() { exportBtn.disabled = false; }, 2000));
            });
        }
    }

    function goToSOP() {
        if (window.App && typeof App.switchView === 'function') {
            App.switchView('sop');
        }
    }

    function syncCoreAnswersToFormData() {
        if (!state.coreAnswers) return;
        var answers = state.coreAnswers;

        if (!formData.budget && answers.core_budget) {
            formData.budget = answers.core_budget;
        }

        if (!formData.houseType && answers.core_houseType) {
            formData.houseType = answers.core_houseType;
        }

        if (!formData.houseStatus && answers.core_houseStatus) {
            formData.houseStatus = answers.core_houseStatus;
        }

        if (!formData.decorationMode && answers.core_decorationMode) {
            formData.decorationMode = answers.core_decorationMode;
        }

        if (!formData.area && answers.core_area) {
            var areaValueMap = {
                'small': '60以下',
                'medium_small': '60-90',
                'medium': '90-120',
                'large': '120-150',
                'xlarge': '150以上'
            };
            formData.area = areaValueMap[answers.core_area] || answers.core_area;
        }

        if (!formData.atmosphere && answers.core_atmosphere) {
            var atmosMap = {
                'minimal': 'minimal',
                'natural': 'natural',
                'luxury': 'luxury',
                'vintage': 'artistic',
                'chinese': 'warm'
            };
            formData.atmosphere = atmosMap[answers.core_atmosphere] || answers.core_atmosphere;
        }

        if (!formData.colors && answers.core_colors) {
            var colorMap = {
                'light': 'warm',
                'mixed': 'neutral',
                'dark': 'cool',
                'colorful': 'mixed'
            };
            formData.colors = colorMap[answers.core_colors] || answers.core_colors;
        }

        if (!formData.familyMembers || formData.familyMembers.length === 0) {
            var members = [];
            if (answers.core_familyMembers === '1') {
                members = ['adult'];
            } else if (answers.core_familyMembers === '2') {
                members = ['adult', 'young'];
            } else if (answers.core_familyMembers === '3') {
                members = ['adult', 'child'];
            } else if (answers.core_familyMembers === '4plus') {
                members = ['adult', 'elderly', 'child'];
            }
            if (answers.core_specialNeeds && answers.core_specialNeeds.length > 0) {
                if (answers.core_specialNeeds.indexOf('elder') !== -1 && members.indexOf('elderly') === -1) {
                    members.push('elderly');
                }
                if (answers.core_specialNeeds.indexOf('child') !== -1 && members.indexOf('child') === -1) {
                    members.push('child');
                }
                if (answers.core_specialNeeds.indexOf('pregnant') !== -1 && members.indexOf('pregnant') === -1) {
                    members.push('pregnant');
                }
            }
            if (members.length > 0) {
                formData.familyMembers = members;
            }
        }

        if (!formData.pet && answers.core_specialNeeds) {
            formData.pet = answers.core_specialNeeds.indexOf('pet') !== -1 ? 'yes' : 'no';
        }

        if (!formData.lifeScenes || formData.lifeScenes.length === 0) {
            if (answers.core_lifeScene) {
                formData.lifeScenes = [answers.core_lifeScene];
            }
        }

        if (!formData.kitchenFrequency && answers.core_lifeScene) {
            if (answers.core_lifeScene === 'cooking') {
                formData.kitchenFrequency = 'daily';
            }
        }

        if (!formData.sensitiveGroups && answers.core_specialNeeds) {
            var groups = [];
            if (answers.core_specialNeeds.indexOf('elder') !== -1) groups.push('elderly');
            if (answers.core_specialNeeds.indexOf('child') !== -1) groups.push('baby');
            if (answers.core_specialNeeds.indexOf('pregnant') !== -1) groups.push('pregnant');
            if (groups.length > 0) {
                formData.sensitiveGroups = groups;
            }
        }

        saveToUserData();
    }

    function renderRequirementTable() {
        clearOptions();

        syncCoreAnswersToFormData();

        var data = formData;
        var content = `
            <div class="requirement-report" id="requirement-report">
                <div class="report-header">
                    <h1>用户装修需求采集表</h1>
                    <div class="report-date">生成日期：${new Date().toLocaleDateString('zh-CN')}</div>
                </div>

                <div class="report-section">
                    <h2>一、用户基本信息</h2>
                    <div class="report-grid">
                        <div class="report-item"><span class="report-label">预算范围</span><span class="report-value">${getBudgetLabel(data.budget)}</span></div>
                        <div class="report-item"><span class="report-label">城市级别</span><span class="report-value">${getCityLabel(data.cityTier)}</span></div>
                        <div class="report-item"><span class="report-label">房屋面积</span><span class="report-value">${data.area || '未填写'} ㎡</span></div>
                        <div class="report-item"><span class="report-label">装修模式</span><span class="report-value">${getDecorationModeLabel(data.decorationMode)}</span></div>
                    </div>
                </div>

                <div class="report-section">
                    <h2>二、房屋基础信息</h2>
                    <div class="report-grid">
                        <div class="report-item"><span class="report-label">房屋性质</span><span class="report-value">${getHouseTypeLabel(data.houseType)}</span></div>
                        <div class="report-item"><span class="report-label">房屋状态</span><span class="report-value">${getHouseStatusLabel(data.houseStatus)}</span></div>
                        <div class="report-item"><span class="report-label">层高</span><span class="report-value">${getHouseHeightLabel(data.houseHeight)}</span></div>
                        <div class="report-item"><span class="report-label">电表容量</span><span class="report-value">${getElectricMeterLabel(data.electricMeter)}</span></div>
                    </div>
                    ${data.propertyRestrictions && data.propertyRestrictions.length > 0 ? '<div class="report-note"><strong>物业限制：</strong>' + data.propertyRestrictions.map(function(p) { return getPropertyLabel(p); }).join('、') + '</div>' : ''}
                    ${data.houseDefects && data.houseDefects.length > 0 ? '<div class="report-note"><strong>房屋硬伤：</strong>' + data.houseDefects.map(function(d) { return getDefectLabel(d); }).join('、') + '</div>' : ''}
                </div>

                <div class="report-section">
                    <h2>三、家庭居住画像</h2>
                    <div class="report-grid">
                        <div class="report-item"><span class="report-label">常住人口</span><span class="report-value">${data.familyMembers && data.familyMembers.length > 0 ? data.familyMembers.map(function(m) { return getMemberLabel(m); }).join('、') : '未填写'}</span></div>
                        <div class="report-item"><span class="report-label">养宠情况</span><span class="report-value">${data.pet === 'yes' ? '有宠物' : data.pet === 'no' ? '无宠物' : '未填写'}</span></div>
                        <div class="report-item"><span class="report-label">做饭频率</span><span class="report-value">${getKitchenFrequencyLabel(data.kitchenFrequency)}</span></div>
                    </div>
                    ${data.lifeScenes && data.lifeScenes.length > 0 ? '<div class="report-note"><strong>生活场景偏好：</strong>' + data.lifeScenes.map(function(s) { return getSceneLabel(s); }).join('、') + '</div>' : ''}
                </div>

                <div class="report-section">
                    <h2>四、功能区域需求</h2>
                    
                    <div class="report-subsection">
                        <h3>入户动线</h3>
                        ${data.entryProblems && data.entryProblems.length > 0 ? '<div class="report-note"><strong>当前困扰：</strong>' + data.entryProblems.map(function(p) { return getEntryProblemLabel(p); }).join('、') + '</div>' : ''}
                        ${data.entryFunctions && data.entryFunctions.length > 0 ? '<div class="report-note"><strong>期望功能：</strong>' + data.entryFunctions.map(function(f) { return getEntryFunctionLabel(f); }).join('、') + '</div>' : ''}
                        <div class="report-grid-small">
                            <div class="report-item"><span class="report-label">常穿鞋量</span><span class="report-value">${data.shoesRegular || 0} 双</span></div>
                            <div class="report-item"><span class="report-label">换季鞋量</span><span class="report-value">${data.shoesSeasonal || 0} 双</span></div>
                        </div>
                    </div>

                    <div class="report-subsection">
                        <h3>餐厨动线</h3>
                        ${data.kitchenProblems && data.kitchenProblems.length > 0 ? '<div class="report-note"><strong>当前困扰：</strong>' + data.kitchenProblems.map(function(p) { return getKitchenProblemLabel(p); }).join('、') + '</div>' : ''}
                        ${data.kitchenFunctions && data.kitchenFunctions.length > 0 ? '<div class="report-note"><strong>期望功能：</strong>' + data.kitchenFunctions.map(function(f) { return getKitchenFunctionLabel(f); }).join('、') + '</div>' : ''}
                        <div class="report-note"><strong>厨房电器：</strong>${getKitchenAppliancesLabel(data.kitchenAppliances)}</div>
                        ${data.embeddedAppliances && data.embeddedAppliances.length > 0 ? '<div class="report-note"><strong>嵌入式电器：</strong>' + data.embeddedAppliances.map(function(e) { return getEmbeddedLabel(e); }).join('、') + '</div>' : ''}
                    </div>

                    <div class="report-subsection">
                        <h3>起居动线</h3>
                        <div class="report-note"><strong>主要场景：</strong>${getLivingSceneLabel(data.livingScene)}</div>
                        <div class="report-note"><strong>阳台功能：</strong>${getBalconyFunctionLabel(data.balconyFunction)}</div>
                    </div>

                    <div class="report-subsection">
                        <h3>睡眠动线</h3>
                        ${data.bedroomProblems && data.bedroomProblems.length > 0 ? '<div class="report-note"><strong>当前困扰：</strong>' + data.bedroomProblems.map(function(p) { return getBedroomProblemLabel(p); }).join('、') + '</div>' : ''}
                        ${data.bedroomFunctions && data.bedroomFunctions.length > 0 ? '<div class="report-note"><strong>期望功能：</strong>' + data.bedroomFunctions.map(function(f) { return getBedroomFunctionLabel(f); }).join('、') + '</div>' : ''}
                    </div>

                    <div class="report-subsection">
                        <h3>卫浴动线</h3>
                        <div class="report-note"><strong>使用冲突：</strong>${getBathroomConflictLabel(data.bathroomConflict)}</div>
                        ${data.bathroomFunctions && data.bathroomFunctions.length > 0 ? '<div class="report-note"><strong>期望功能：</strong>' + data.bathroomFunctions.map(function(f) { return getBathroomFunctionLabel(f); }).join('、') + '</div>' : ''}
                    </div>
                </div>

                <div class="report-section">
                    <h2>五、全屋储物</h2>
                    <div class="report-grid">
                        <div class="report-item"><span class="report-label">储物需求等级</span><span class="report-value">${getStorageLevelLabel(data.storageLevel)}</span></div>
                    </div>
                    ${data.specialStorage && data.specialStorage.length > 0 ? '<div class="report-note"><strong>特殊储物需求：</strong>' + data.specialStorage.map(function(s) { return getSpecialStorageLabel(s); }).join('、') + '</div>' : ''}
                </div>

                <div class="report-section">
                    <h2>六、固定设备与水电</h2>
                    ${data.systemDevices && data.systemDevices.length > 0 ? '<div class="report-note"><strong>系统设备：</strong>' + data.systemDevices.map(function(d) { return getDeviceLabel(d); }).join('、') + '</div>' : ''}
                    ${data.kitchenDevices && data.kitchenDevices.length > 0 ? '<div class="report-note"><strong>厨房设备：</strong>' + data.kitchenDevices.map(function(d) { return getDeviceLabel(d); }).join('、') + '</div>' : ''}
                    ${data.bathroomDevices && data.bathroomDevices.length > 0 ? '<div class="report-note"><strong>卫浴设备：</strong>' + data.bathroomDevices.map(function(d) { return getDeviceLabel(d); }).join('、') + '</div>' : ''}
                    ${data.specialOutlets && data.specialOutlets.length > 0 ? '<div class="report-note"><strong>特殊点位：</strong>' + data.specialOutlets.map(function(o) { return getOutletLabel(o); }).join('、') + '</div>' : ''}
                    <div class="report-note"><strong>智能家居：</strong>${getSmartHomeLabel(data.smartHome)}</div>
                </div>

                <div class="report-section">
                    <h2>七、风格与视觉</h2>
                    <div class="report-grid">
                        <div class="report-item"><span class="report-label">装修风格</span><span class="report-value">${data.styleResult ? STYLE_INFO[data.styleResult].name : '未测试'}</span></div>
                        <div class="report-item"><span class="report-label">氛围偏好</span><span class="report-value">${getAtmosphereLabel(data.atmosphere)}</span></div>
                        <div class="report-item"><span class="report-label">色彩偏好</span><span class="report-value">${getColorsLabel(data.colors)}</span></div>
                        <div class="report-item"><span class="report-label">灯光偏好</span><span class="report-value">${getLightingLabel(data.lighting)}</span></div>
                    </div>
                    ${data.rejections && data.rejections.length > 0 ? '<div class="report-note"><strong>坚决不接受：</strong>' + data.rejections.map(function(r) { return getRejectionLabel(r); }).join('、') + '</div>' : ''}
                </div>

                <div class="report-section">
                    <h2>八、环保与健康</h2>
                    <div class="report-grid">
                        <div class="report-item"><span class="report-label">环保等级要求</span><span class="report-value">${getEcoLevelLabel(data.ecoLevel)}</span></div>
                    </div>
                    ${data.sensitiveGroups && data.sensitiveGroups.length > 0 ? '<div class="report-note"><strong>敏感人群：</strong>' + data.sensitiveGroups.map(function(g) { return getSensitiveGroupLabel(g); }).join('、') + '</div>' : ''}
                </div>

                <div class="report-section">
                    <h2>九、工期要求</h2>
                    <div class="report-grid">
                        <div class="report-item"><span class="report-label">计划开工日期</span><span class="report-value">${data.startDate || '未填写'}</span></div>
                        <div class="report-item"><span class="report-label">计划入住日期</span><span class="report-value">${data.moveInDate || '未填写'}</span></div>
                        <div class="report-item"><span class="report-label">工期是否严格</span><span class="report-value">${data.strictDeadline === 'yes' ? '严格' : data.strictDeadline === 'no' ? '可协商' : '未填写'}</span></div>
                    </div>
                </div>

                <div class="report-footer">
                    <p>以上信息由用户通过AI对话式需求采集系统提供</p>
                    <p>如有疑问，请联系用户确认</p>
                </div>
            </div>
        `;

        var msgEl = document.createElement('div');
        msgEl.className = 'message-row message-row-nian message-enter requirement-message';
        msgEl.innerHTML = '<div class="message-avatar"><span class="nian-emoji-small">' + Icons.render('nian-default') + '</span></div><div class="question-card requirement-card card">' + content + '</div>';
        messageListEl.appendChild(msgEl);
        addTimer(requestAnimationFrame(function() {
            msgEl.classList.add('message-enter-active');
        }));
        scrollToBottom();
    }

    function exportToPDF() {
        // 检查是否已有需求表，避免重复渲染
        var existingReport = document.getElementById('requirement-report');
        if (!existingReport) {
            renderRequirementTable();
        }
        
        var exportBtn = document.getElementById('final-export-btn');
        
        addTimer(setTimeout(function() {
            var reportEl = document.getElementById('requirement-report');
            if (!reportEl) {
                addNianMessage('生成需求表失败，请重试');
                return;
            }

            addNianMessage('正在生成PDF，请稍候...');

            // 使用异步方式处理，避免阻塞主线程
            try {
                html2canvas(reportEl, {
                    scale: 1,  // 降低清晰度以提升性能
                    useCORS: true,
                    backgroundColor: '#ffffff',
                    logging: false,
                    allowTaint: true
                }).then(function(canvas) {
                    try {
                        var imgData = canvas.toDataURL('image/jpeg', 0.8);  // 使用JPEG格式减小文件大小
                        var pdf = new window.jspdf.jsPDF({
                            orientation: 'portrait',
                            unit: 'mm',
                            format: 'a4'
                        });

                        var pdfWidth = pdf.internal.pageSize.getWidth();
                        var pdfHeight = pdf.internal.pageSize.getHeight();
                        var imgWidth = canvas.width;
                        var imgHeight = canvas.height;
                        var ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
                        var imgX = (pdfWidth - imgWidth * ratio) / 2;
                        var imgY = 10;

                        pdf.addImage(imgData, 'JPEG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
                        pdf.save('装修需求采集表_' + new Date().toLocaleDateString('zh-CN').replace(/\//g, '-') + '.pdf');

                        addNianMessage('PDF已生成并下载！');
                    } catch (e) {
                        console.error('PDF生成失败:', e);
                        addNianMessage('PDF生成失败，请重试');
                    }
                }).catch(function(err) {
                    console.error('Canvas处理失败:', err);
                    addNianMessage('PDF生成失败，请重试');
                });
            } catch (e) {
                console.error('导出PDF异常:', e);
                addNianMessage('PDF生成失败，请重试');
            }
        }, 500));
    }

    function getBudgetLabel(val) {
        var map = {
            'low': '经济型',
            'medium': '舒适型',
            'high': '品质型',
            'premium': '豪华型',
            'less_10': '10万以内',
            '10_20': '10-20万',
            '20_30': '20-30万',
            '30_50': '30-50万',
            'more_50': '50万以上'
        };
        return map[val] || '未选择';
    }
    function getCityLabel(val) {
        var map = { 'first': '一线城市', 'new_first': '新一线城市', 'second': '二线城市', 'third': '三线及以下' };
        return map[val] || '未选择';
    }
    function getDecorationModeLabel(val) {
        var map = { 'self': '自装', 'half': '半包', 'full': '全包' };
        return map[val] || '未选择';
    }
    function getHouseTypeLabel(val) {
        var map = {
            'commercial': '商品住宅',
            'apartment': '商住公寓',
            'villa': '别墅',
            'old': '老房',
            'normal': '普通住宅',
            'loft': 'LOFT/复式'
        };
        return map[val] || '未选择';
    }
    function getHouseStatusLabel(val) {
        var map = {
            'new': '新房毛坯',
            'old': '老房翻新',
            'second': '二手房翻新',
            'renovation': '局部改造',
            'rough': '全新毛坯房',
            'hardcover': '精装房全改',
            'partial': '局部改造'
        };
        return map[val] || '未选择';
    }
    function getElectricMeterLabel(val) {
        var map = {
            '40': '40A',
            '60': '60A',
            '80': '80A',
            '100': '100A及以上',
            'unknown': '不清楚',
            'small': '40A及以下',
            'medium': '60A',
            'large': '80A及以上'
        };
        return map[val] || '未选择';
    }
    function getHouseHeightLabel(val) {
        var map = { 'low': '2.7m及以下', 'normal': '2.7-2.8m', 'good': '2.8-2.9m', 'high': '2.9m以上' };
        return map[val] || '未选择';
    }
    function getPropertyLabel(val) {
        var map = { 'elevator': '电梯限制', 'noise': '噪音限制', 'pet': '养宠限制', 'time': '施工时段限制', 'no_balcony': '不允许封阳台', 'no_facade': '不允许改动外立面', 'fixed_ac': '外机位固定，无法装中央空调', 'time_limit': '施工时间严格受限' };
        return map[val] || '未选择';
    }
    function getDefectLabel(val) {
        var map = { 'moisture': '潮湿', 'noise': '噪音', 'sunlight': '采光差', 'space': '空间局促', 'dark': '采光差', 'ventilation': '通风差', 'dark_kitchen': '暗卫/暗厨', 'structure': '结构问题' };
        return map[val] || '未选择';
    }
    function getMemberLabel(val) {
        var map = { 'adult': '成年人', 'child': '儿童', 'elderly': '老人', 'baby': '婴幼儿', 'young': '青年', 'infant': '婴幼儿', 'pregnant': '孕妇', 'senior': '老人' };
        return map[val] || '未选择';
    }
    function getKitchenFrequencyLabel(val) {
        var map = { 'daily': '每天做饭', 'weekday': '工作日做饭', 'weekend': '周末做饭', 'occasional': '偶尔做饭', 'rare': '很少做饭' };
        return map[val] || '未选择';
    }
    function getSceneLabel(val) {
        var map = { 'cooking': '热爱烹饪', 'entertainment': '经常聚会', 'work': '在家办公', 'reading': '喜欢阅读', 'exercise': '居家运动', 'wfh': '居家办公', 'relax': '休闲放松', 'parenting': '亲子互动', 'hobby': '兴趣爱好', 'guest': '接待客人' };
        return map[val] || '未选择';
    }
    function getEntryProblemLabel(val) {
        var map = { 'shoes': '鞋子无处放', 'clothes': '衣物堆积', 'keys': '钥匙常丢', 'backpack': '背包乱放', 'no_bench': '无换鞋凳', 'clutter': '杂物堆积', 'no_coat': '无挂衣区' };
        return map[val] || '未选择';
    }
    function getEntryFunctionLabel(val) {
        var map = { 'shoeStorage': '鞋柜收纳', 'coatRack': '挂衣区', 'mirror': '全身镜', 'bench': '换鞋凳', 'charging': '充电区', 'coat_area': '挂衣区', 'express': '快递存放', 'storage': '储物空间', 'shoe_cabinet': '鞋柜' };
        return map[val] || '未选择';
    }
    function getKitchenProblemLabel(val) {
        var map = { 'space': '操作空间小', 'storage': '收纳不足', 'smoke': '油烟问题', 'appliance': '电器太多', 'appliance_storage': '电器无处放', 'fridge_far': '冰箱距离远', 'outlets': '插座不够', 'small_counter': '操作台小' };
        return map[val] || '未选择';
    }
    function getKitchenFunctionLabel(val) {
        var map = { 'prep': '备餐区', 'cooking': '烹饪区', 'washing': '清洗区', 'storage': '储物区', 'dining': '就餐区', 'appliance_counter': '电器高柜', 'big_sink': '大单槽' };
        return map[val] || '未选择';
    }
    function getKitchenAppliancesLabel(val) {
        var map = { 'basic': '基础三件套', 'medium': '中等配置', 'full': '全套配齐', 'professional': '专业级' };
        return map[val] || '未选择';
    }
    function getEmbeddedLabel(val) {
        var map = { 'refrigerator': '嵌入式冰箱', 'oven': '嵌入式烤箱', 'microwave': '嵌入式微波炉', 'dishwasher': '洗碗机', 'wineCooler': '酒柜' };
        return map[val] || '未选择';
    }
    function getLivingSceneLabel(val) {
        var map = { 'watch': '看电视', 'chat': '家人聊天', 'play': '亲子互动', 'work': '工作学习', 'exercise': '居家运动' };
        return map[val] || '未选择';
    }
    function getBalconyFunctionLabel(val) {
        var map = { 'laundry': '洗衣晾晒', 'garden': '花园种植', 'storage': '储物空间', 'leisure': '休闲观景', 'work': '工作区' };
        return map[val] || '未选择';
    }
    function getBedroomProblemLabel(val) {
        var map = { 'storage': '收纳不足', 'noise': '噪音干扰', 'light': '光线问题', 'layout': '布局不合理', 'wardrobe': '衣柜不够', 'outlets': '插座不够', 'dressing': '无梳妆区', 'night_light': '起夜不便' };
        return map[val] || '未选择';
    }
    function getBedroomFunctionLabel(val) {
        var map = { 'sleep': '睡眠区', 'wardrobe': '衣柜区', 'study': '学习区', 'relax': '休闲区', 'makeup': '化妆区' };
        return map[val] || '未选择';
    }
    function getBathroomConflictLabel(val) {
        var map = { 'none': '无冲突', 'morning': '早高峰', 'evening': '晚高峰', 'always': '随时可能冲突' };
        return map[val] || '未选择';
    }
    function getBathroomFunctionLabel(val) {
        var map = { 'shower': '淋浴区', 'bathtub': '浴缸', 'toilet': '马桶区', 'washbasin': '洗漱区', 'laundry': '洗衣区' };
        return map[val] || '未选择';
    }
    function getStorageLevelLabel(val) {
        var map = { 'low': '基本够用', 'medium': '需要增加', 'high': '大量储物', 'extreme': '极致收纳' };
        return map[val] || '未选择';
    }
    function getSpecialStorageLabel(val) {
        var map = { 'seasonal': '季节性物品', 'appliances': '电器储物', 'hobby': '爱好收藏', 'documents': '文件档案', 'baby': '母婴用品', 'luggage': '行李箱', 'cleaning': '清洁工具', 'sports': '运动器材', 'books': '书籍', 'toys': '玩具' };
        return map[val] || '未选择';
    }
    function getDeviceLabel(val) {
        var map = { 'centralAir': '中央空调', 'floorHeating': '地暖', 'freshAir': '新风系统', 'waterPurifier': '净水器', 'smartLock': '智能门锁', 'robotVacuum': '扫地机器人', 'washingMachine': '洗衣机', 'dryer': '烘干机', 'bidet': '智能马桶', 'mirrorCabinet': '智能镜柜', 'central_ac': '中央空调/风管机', 'floor_heating': '地暖/暖气片', 'fresh_air': '新风系统', 'water_purify': '全屋净水', 'smart_home': '全屋智能家居', 'dishwasher': '洗碗机', 'steam_oven': '嵌入式蒸烤箱', 'garbage_disposal': '垃圾处理器', 'instant_water': '管线机/即热饮水机', 'integrated_stove': '集成灶', 'smart_toilet': '智能马桶', 'towel_warmer': '电热毛巾架', 'wall_washer': '壁挂洗衣机', 'bathtub': '浴缸', 'thermostatic_shower': '恒温花洒' };
        return map[val] || '未选择';
    }
    function getOutletLabel(val) {
        var map = { 'kitchen': '厨房多插座', 'living': '客厅影音', 'bedroom': '卧室床头', 'bathroom': '浴室防溅', 'balcony': '阳台插座', 'study': '书房办公', 'projector': '投影+幕布', 'robot': '扫地机器人基站', 'electric_curtain': '电动窗帘', 'desk_outlets': '书桌/电竞桌', 'monitor': '室内监控' };
        return map[val] || '未选择';
    }
    function getSmartHomeLabel(val) {
        var map = { 'basic': '基础智能', 'medium': '中等智能', 'high': '全屋智能', 'future': '预留接口' };
        return map[val] || '未选择';
    }
    function getAtmosphereLabel(val) {
        var map = { 'warm': '温馨舒适', 'minimal': '简约清爽', 'luxury': '轻奢精致', 'artistic': '艺术氛围', 'natural': '自然清新' };
        return map[val] || '未选择';
    }
    function getColorsLabel(val) {
        var map = { 'warm': '暖色调', 'cool': '冷色调', 'neutral': '中性色', 'mixed': '混搭色' };
        return map[val] || '未选择';
    }
    function getLightingLabel(val) {
        var map = { 'bright': '明亮通透', 'warm': '温暖柔和', 'layered': '层次分明', 'dimmable': '可调节' };
        return map[val] || '未选择';
    }
    function getRejectionLabel(val) {
        var map = { 'complex': '过于复杂', 'dark': '颜色太深', 'cheap': '质感差', 'small': '空间压抑', 'tile_wall': '瓷砖上墙', 'complex_molding': '复杂造型', 'dark_floor': '深色地板', 'glossy_tile': '亮面瓷砖', 'crystal': '水晶灯' };
        return map[val] || '未选择';
    }
    function getEcoLevelLabel(val) {
        var map = { 'e0': 'E0级', 'e1': 'E1级', 'enf': 'ENF级', 'custom': '定制环保' };
        return map[val] || '未选择';
    }
    function getSensitiveGroupLabel(val) {
        var map = { 'baby': '婴幼儿', 'elderly': '老人', 'allergy': '过敏体质', 'pregnant': '孕妇', 'pregnant_infant': '孕妇/婴幼儿' };
        return map[val] || '未选择';
    }

    function reset() {
        if (messageListEl) {
            messageListEl.innerHTML = '';
        }
        startFlow();
    }

    function escapeHtml(text) {
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function getFilteredArray(arr) {
        if (!arr || !Array.isArray(arr)) return [];
        return arr.filter(function(item) { return item !== 'none' && item !== null && item !== undefined; });
    }

    function destroy() {
        clearAllTimers();
        clearElementCache();
        containerEl = null;
        messageListEl = null;
    }

    // ========== 问卷流程控制 ==========
    var currentStage = null;        // 当前阶段
    var currentQuestionIndex = 0;    // 当前题目索引
    var stageAnswers = {};          // 各阶段答题进度
    var evaluationAnswers = [];     // 模式评估答题记录
    var answerHistory = [];         // 答题历史记录（用于上一步）
    var isShowingQuestion = false;  // 防止重复调用标志

    // 阶段顺序（用于计算总进度）
    var stageOrder = [
        'houseBasic', 'modeEvaluation',
        'familyProfile', 'entryLine', 'kitchenLine', 'livingLine',
        'bedroomLine', 'bathroomLine', 'laundryLine', 'storage',
        'equipment', 'style', 'eco', 'timeline', 'customCabinets'
    ];

    // 计算总题数
    function getTotalQuestions(modeId) {
        var total = 0;
        stageOrder.forEach(function(stageId) {
            var stage = QUESTIONNAIRE_DATA[stageId];
            if (stage) {
                total += stage.questions.length;
            }
        });
        // 加上模式专属层的题数
        var modeStageId = modeId ? modeStagesMap[modeId] : 'halfPackage';
        var modeStage = QUESTIONNAIRE_DATA[modeStageId];
        if (modeStage) {
            total += modeStage.questions.length;
        }
        return total;
    }

    // 模式阶段映射
    var modeStagesMap = {
        'self': 'selfBuild',
        'half': 'halfPackage',
        'full': 'fullPackage'
    };

    // 计算当前总进度
    function getOverallProgress() {
        var modeId = formData.decorationMode || 'half';
        var totalQuestions = getTotalQuestions(modeId);
        var answered = 0;

        // 计算已完成阶段的题目数
        var reachedCurrentStage = false;
        for (var i = 0; i < stageOrder.length; i++) {
            var stageId = stageOrder[i];
            var stage = QUESTIONNAIRE_DATA[stageId];
            if (!stage) continue;

            if (stageId === currentStage) {
                reachedCurrentStage = true;
                answered += currentQuestionIndex;
                break;
            }

            if (reachedCurrentStage === false) {
                answered += stage.questions.length;
            }
        }

        // 如果已经到了模式专属层
        var modeStageId = modeStagesMap[modeId];
        if (currentStage && modeStageId && (currentStage === modeStageId || stageOrder.indexOf(currentStage) === -1 && ['selfBuild', 'halfPackage', 'fullPackage'].indexOf(currentStage) !== -1)) {
            answered += currentQuestionIndex;
        } else if (currentStage && ['selfBuild', 'halfPackage', 'fullPackage'].indexOf(currentStage) !== -1) {
            // 在模式专属层
            answered += currentQuestionIndex;
        }

        return {
            current: answered,
            total: totalQuestions,
            percent: Math.round((answered / totalQuestions) * 100)
        };
    }

    function startCoreQuestionnaire() {
        state.coreQuestionIndex = 0;
        state.coreAnswers = {};
        state.currentStep = 'core-questionnaire';
        showCoreQuestion();
    }

    function showCoreQuestion() {
        if (state.coreQuestionIndex >= CORE_QUESTIONS.length) {
            showCoreSummary();
            return;
        }

        var question = CORE_QUESTIONS[state.coreQuestionIndex];
        updateCoreProgress();

        showTypingIndicator();
        addTimer(setTimeout(function() {
            hideTypingIndicator();
            addNianMessage(question.question);
            addTimer(setTimeout(function() {
                renderCoreQuestionOptions(question);
            }, 600));
        }, 800));
    }

    function updateCoreProgress() {
        var progressEl = document.getElementById('questionnaire-progress');
        if (!progressEl) return;

        var current = state.coreQuestionIndex + 1;
        var total = CORE_QUESTIONS.length;
        var percent = Math.round((state.coreQuestionIndex / total) * 100);

        progressEl.innerHTML = `
            <div class="progress-stage">核心需求采集</div>
            <div class="progress-bar"><div class="progress-fill" style="width:${percent}%"></div></div>
            <div class="progress-text">${current}/${total}</div>
        `;
    }

    function renderCoreQuestionOptions(question) {
        var optionsEl = el.chatOptions;
        if (!optionsEl) return;

        optionsEl.innerHTML = '';
        var container = document.createElement('div');

        if (question.type === 'single') {
            container.className = 'options-grid options-grid-2';
            question.options.forEach(function(opt) {
                var card = document.createElement('div');
                card.className = 'option-card card';
                card.innerHTML = '<div class="option-card-content"><div class="option-label">' + escapeHtml(opt.text) + '</div></div>';
                card.addEventListener('click', function(e) {
                    e.stopPropagation();
                    selectCoreSingleAnswer(question, opt);
                });
                container.appendChild(card);
            });
        } else if (question.type === 'multi') {
            container.className = 'options-grid options-grid-1 multi-options';
            var multiData = { selected: [] };

            var hasNoneOption = question.options.some(function(o) { return o.id === 'none'; });
            var optionsToRender = question.options.slice();
            if (!hasNoneOption) {
                optionsToRender.push({ id: 'none', text: '无/都不需要' });
            }

            optionsToRender.forEach(function(opt) {
                var card = document.createElement('div');
                card.className = 'option-card card multi-card';
                card.setAttribute('data-opt-id', opt.id);
                card.innerHTML = '<div class="option-card-content"><div class="option-label"><span class="multi-check"></span>' + escapeHtml(opt.text) + '</div></div>';
                card.addEventListener('click', function(e) {
                    e.stopPropagation();
                    toggleMultiOption(card, opt, multiData);
                });
                container.appendChild(card);
            });

            var confirmBtn = document.createElement('button');
            confirmBtn.className = 'btn-primary multi-confirm-btn';
            confirmBtn.textContent = '确认';
            confirmBtn.disabled = true;
            confirmBtn.addEventListener('click', function() {
                if (multiData.selected.length > 0) {
                    var finalSelected = multiData.selected.filter(function(s) { return s !== 'none'; });
                    selectCoreMultiAnswer(question, finalSelected);
                }
            });
            container.appendChild(confirmBtn);
            container.confirmBtn = confirmBtn;
        }

        optionsEl.appendChild(container);

        addCoreBackButton(optionsEl);
        scrollToBottom();
    }

    function addCoreBackButton(optionsEl) {
        if (!optionsEl) return;
        if (state.coreQuestionIndex === 0) return;

        var backBtn = document.createElement('button');
        backBtn.className = 'btn-text back-btn';
        backBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg> 上一步';
        backBtn.addEventListener('click', function() {
            goCoreBack();
        });

        var backContainer = document.createElement('div');
        backContainer.className = 'back-btn-container';
        backContainer.appendChild(backBtn);
        optionsEl.appendChild(backContainer);
    }

    function goCoreBack() {
        if (state.coreQuestionIndex <= 0) return;
        state.coreQuestionIndex--;

        if (messageListEl && messageListEl.children.length > 0) {
            for (var i = 0; i < 2; i++) {
                if (messageListEl.children.length > 0) {
                    messageListEl.removeChild(messageListEl.lastChild);
                }
            }
        }

        showCoreQuestion();
    }

    function selectCoreSingleAnswer(question, opt) {
        addUserMessage(opt.text);
        state.coreAnswers[question.id] = opt.id;
        formData[question.id] = opt.id;

        clearOptions();
        saveToUserData();

        addTimer(setTimeout(function() {
            state.coreQuestionIndex++;
            showCoreQuestion();
        }, 600));
    }

    function selectCoreMultiAnswer(question, selected) {
        var filteredSelected = selected.filter(function(id) { return id !== 'none'; });
        var selectedTexts = question.options.filter(function(o) {
            return selected.indexOf(o.id) !== -1;
        }).map(function(o) { return o.text; });

        addUserMessage(selectedTexts.join('、'));
        state.coreAnswers[question.id] = filteredSelected;
        formData[question.id] = filteredSelected;

        clearOptions();
        saveToUserData();

        addTimer(setTimeout(function() {
            state.coreQuestionIndex++;
            showCoreQuestion();
        }, 600));
    }

    function showCoreSummary() {
        state.currentStep = 'core-summary';
        var progressEl = document.getElementById('questionnaire-progress');
        if (progressEl) {
            progressEl.innerHTML = `
                <div class="progress-stage">核心需求采集完成</div>
                <div class="progress-bar"><div class="progress-fill" style="width:100%"></div></div>
                <div class="progress-text">12/12</div>
            `;
        }

        addNianMessage('太棒了！核心问题都答完了，让我来总结一下您的需求~');
        addTimer(setTimeout(function() {
            renderCoreSummaryCard();
        }, 800));
    }

    function renderCoreSummaryCard() {
        var answers = state.coreAnswers;
        var summaryItems = getCoreSummaryItems();

        var msgEl = document.createElement('div');
        msgEl.className = 'message-row message-row-nian message-enter';
        msgEl.innerHTML = `
            <div class="message-avatar">
                <span class="nian-emoji-small">${Icons.render('nian-default')}</span>
            </div>
            <div class="core-summary-card card">
                <div class="core-summary-header">
                    <div class="core-summary-icon">✨</div>
                    <div class="core-summary-title">需求摘要</div>
                    <div class="core-summary-desc">以下是您的核心装修需求概览</div>
                </div>
                <div class="core-summary-list">
                    ${summaryItems.map(function(item) {
                        return `
                            <div class="core-summary-item">
                                <div class="core-summary-label">${item.label}</div>
                                <div class="core-summary-value">${item.value}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div class="core-summary-actions">
                    <button class="btn-secondary" id="continue-detailed-btn">继续完善详细问卷</button>
                    <button class="btn-primary" id="go-sop-btn">直接进入 SOP</button>
                </div>
            </div>
        `;
        messageListEl.appendChild(msgEl);
        addTimer(requestAnimationFrame(function() {
            msgEl.classList.add('message-enter-active');
        }));
        scrollToBottom();

        var continueBtn = document.getElementById('continue-detailed-btn');
        if (continueBtn) {
            continueBtn.addEventListener('click', function() {
                continueWithDetailed();
            });
        }

        var goSopBtn = document.getElementById('go-sop-btn');
        if (goSopBtn) {
            goSopBtn.addEventListener('click', function() {
                if (goSopBtn.disabled) return;
                goSopBtn.disabled = true;
                goToSOPWithCoreData();
            });
        }
    }

    function getCoreSummaryItems() {
        var answers = state.coreAnswers;
        var items = [];

        var areaMap = {
            'small': '60㎡以下',
            'medium_small': '60-90㎡',
            'medium': '90-120㎡',
            'large': '120-150㎡',
            'xlarge': '150㎡以上'
        };
        if (answers.core_area) {
            items.push({ label: '建筑面积', value: areaMap[answers.core_area] || answers.core_area });
        }

        var layoutMap = {
            '1room': '1室1厅',
            '2room': '2室1厅/2室2厅',
            '3room': '3室1厅/3室2厅',
            '4room': '4室及以上'
        };
        if (answers.core_layout) {
            items.push({ label: '户型格局', value: layoutMap[answers.core_layout] || answers.core_layout });
        }

        var houseTypeMap = {
            'normal': '普通住宅',
            'apartment': '商住公寓',
            'loft': 'LOFT/复式'
        };
        if (answers.core_houseType) {
            items.push({ label: '房屋性质', value: houseTypeMap[answers.core_houseType] || answers.core_houseType });
        }

        var statusMap = {
            'rough': '全新毛坯房',
            'hardcover': '精装房全改',
            'old': '老房翻新',
            'partial': '局部改造'
        };
        if (answers.core_houseStatus) {
            items.push({ label: '房屋状态', value: statusMap[answers.core_houseStatus] || answers.core_houseStatus });
        }

        var membersMap = {
            '1': '1人独居',
            '2': '2人（夫妻/情侣）',
            '3': '3人（三口之家）',
            '4plus': '4人及以上'
        };
        if (answers.core_familyMembers) {
            items.push({ label: '常住人口', value: membersMap[answers.core_familyMembers] || answers.core_familyMembers });
        }

        var sceneMap = {
            'cooking': '在家做饭为主',
            'wfh': '居家办公/学习',
            'relax': '休闲观影为主',
            'parenting': '亲子活动为核心'
        };
        if (answers.core_lifeScene) {
            items.push({ label: '核心生活场景', value: sceneMap[answers.core_lifeScene] || answers.core_lifeScene });
        }

        if (answers.core_specialNeeds && answers.core_specialNeeds.length > 0) {
            var needsMap = {
                'elder': '有老人',
                'child': '有小孩',
                'pregnant': '孕期/备孕',
                'pet': '饲养宠物',
                'none': '暂无特殊需求'
            };
            var needsText = answers.core_specialNeeds.map(function(n) {
                return needsMap[n] || n;
            }).join('、');
            items.push({ label: '特殊需求', value: needsText });
        }

        var atmosphereMap = {
            'minimal': '清爽明亮（现代简约/北欧）',
            'natural': '温暖治愈（原木/日式）',
            'luxury': '沉稳高级（意式极简/轻奢）',
            'vintage': '复古温馨（中古风/法式）',
            'chinese': '大气耐看（新中式）'
        };
        if (answers.core_atmosphere) {
            items.push({ label: '风格偏好', value: atmosphereMap[answers.core_atmosphere] || answers.core_atmosphere });
        }

        var colorMap = {
            'light': '浅色系为主',
            'mixed': '深浅搭配',
            'dark': '深色系为主',
            'colorful': '喜欢彩色点缀'
        };
        if (answers.core_colors) {
            items.push({ label: '色彩偏好', value: colorMap[answers.core_colors] || answers.core_colors });
        }

        var modeMap = {
            'self': '自装',
            'half': '半包',
            'full': '全包'
        };
        if (answers.core_decorationMode) {
            items.push({ label: '装修模式', value: modeMap[answers.core_decorationMode] || answers.core_decorationMode });
        }

        var budgetMap = {
            'less_10': '10万以内',
            '10_20': '10-20万',
            '20_30': '20-30万',
            '30_50': '30-50万',
            'more_50': '50万以上'
        };
        if (answers.core_budget) {
            items.push({ label: '装修预算', value: budgetMap[answers.core_budget] || answers.core_budget });
        }

        var timelineMap = {
            '3months': '3个月以内',
            '3_6months': '3-6个月',
            '6_12months': '6-12个月',
            'flexible': '不急，保证质量优先'
        };
        if (answers.core_timeline) {
            items.push({ label: '期望完工时间', value: timelineMap[answers.core_timeline] || answers.core_timeline });
        }

        return items;
    }

    function continueWithDetailed() {
        addUserMessage('继续完善详细问卷');
        clearOptions();

        addTimer(setTimeout(function() {
            addNianMessage('好的！让我们继续深入了解您的需求，这样方案会更精准~');
            addTimer(setTimeout(function() {
                state.questionnaireMode = 'detailed';
                startQuestionnaire();
            }, 800));
        }, 400));
    }

    function goToSOPWithCoreData() {
        if (window.App && App.state && App.state.userData) {
            App.state.userData.formData = formData;
            App.state.userData.coreAnswers = state.coreAnswers;
            App.state.userData.questionnaireMode = 'quick';
            App.saveState(true);
        }
        goToSOP();
    }

    /**
     * 开始问卷流程（从houseBasic开始，前置评估层）
     * 流程：houseBasic → modeEvaluation → 模式选择 → 边界对齐 → 通用核心层 → 模式专属层
     */
    function startQuestionnaire() {
        currentStage = 'houseBasic';
        currentQuestionIndex = 0;
        stageAnswers = { houseBasic: 0 };
        evaluationAnswers = [];

        addNianMessage('好的，让我先了解一下您房屋的基本情况，这样可以为您推荐最合适的装修方案~');
        addTimer(setTimeout(function() {
            showQuestionnaireQuestion();
        }, 800));
    }

    /**
     * 边界对齐后开始通用核心需求层
     * 流程：familyProfile → 6大动线 → storage → equipment → style → eco → timeline → customCabinets → 模式专属层
     */
    function startQuestionnaireAfterBoundary() {
        currentStage = 'familyProfile';
        currentQuestionIndex = 0;
        stageAnswers = { familyProfile: 0 };

        addNianMessage('好的，现在让我来详细了解一下您的家庭情况和生活习惯，这样才能给出更精准的装修建议哦~');
        addTimer(setTimeout(function() {
            showQuestionnaireQuestion();
        }, 800));
    }

    /**
     * 显示当前题目
     */
    function showQuestionnaireQuestion() {
        // 防止重复调用
        if (isShowingQuestion) {
            return;
        }
        isShowingQuestion = true;

        try {
            if (!QUESTIONNAIRE_DATA || !QUESTIONNAIRE_DATA[currentStage]) {
                proceedToNextStage();
                return;
            }

            var stage = QUESTIONNAIRE_DATA[currentStage];
            if (currentQuestionIndex >= stage.questions.length) {
                proceedToNextStage();
                return;
            }

            var question = stage.questions[currentQuestionIndex];

            showProgress(stage.name);

            var msgEl = document.createElement('div');
            msgEl.className = 'message-row message-row-nian message-enter';
            msgEl.innerHTML = '<div class="message-avatar"><span class="nian-emoji-small">' + Icons.render('nian-default') + '</span></div><div class="question-card card"><div class="question-text">' + escapeHtml(question.question) + '</div></div>';
            messageListEl.appendChild(msgEl);
            scrollToBottom();

            // 添加动画类
            addTimer(requestAnimationFrame(function() {
                msgEl.classList.add('message-enter-active');
            }));

            // 渲染选项
            renderQuestionOptions(question);
        } finally {
            // 立即清除防护标志，防止阻塞后续操作
            isShowingQuestion = false;
        }
    }

    /**
     * 模拟AI户型识别过程
     */
    function simulateAiRecognition() {
        addUserMessage('上传户型图');
        clearOptions();
        
        addNianMessage('收到户型图，正在AI识别中...');
        
        // 模拟AI识别过程
        addTimer(setTimeout(function() {
            addNianMessage('户型图识别完成！请确认以下信息：');
            addTimer(setTimeout(function() {
                currentQuestionIndex++;
                showQuestionnaireQuestion();
            }, 800));
        }, 1500));
    }

    /**
     * 保存AI户型识别数据
     */
    function saveAiRecognitionData(aiData) {
        // 记录历史
        pushHistory();

        formData.aiRecognition = aiData;
        if (window.App && App.state && App.state.userData) {
            App.state.userData.aiRecognition = aiData;
            App.saveState();
        }
        addUserMessage('已确认户型信息');
    }

    /**
     * 进入下一题（用于AI识别类型）
     */
    function proceedToNextQuestion() {
        currentQuestionIndex++;
        var stage = QUESTIONNAIRE_DATA[currentStage];
        if (!stage || currentQuestionIndex >= stage.questions.length) {
            proceedToNextStage();
        } else {
            showQuestionnaireQuestion();
        }
    }

    /**
     * 显示进度条
     */
    function showProgress(stageName) {
        var progressEl = document.getElementById('questionnaire-progress');
        if (!progressEl) return;

        var progress = getOverallProgress();
        var displayCurrent = progress.current + 1;
        progressEl.innerHTML = '<div class="progress-stage">' + escapeHtml(stageName) + '</div><div class="progress-bar"><div class="progress-fill" style="width:' + progress.percent + '%"></div></div><div class="progress-text">' + displayCurrent + '/' + progress.total + '</div>';
    }

    /**
     * 渲染题目选项
     */
    function renderQuestionOptions(question) {
        var optionsEl = el.chatOptions;
        if (!optionsEl) return;

        optionsEl.innerHTML = '';
        var container = document.createElement('div');

        if (question.type === 'ai-recognition-intro') {
            // AI户型识别介绍页
            container.className = 'ai-recognition-container';
            container.innerHTML = '<div class="ai-recognition-upload">' +
                '<div class="upload-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--dai-blue)" stroke-width="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg></div>' +
                '<div class="upload-text">点击上传户型图，或拖拽图片到此处</div>' +
                '<div class="upload-hint">支持 JPG、PNG 格式，建议户型图清晰可见</div>' +
                '<div class="ai-features">' +
                '<div class="ai-feature-item"><span class="feature-icon">📐</span><span>自动识别建筑面积</span></div>' +
                '<div class="ai-feature-item"><span class="feature-icon">📏</span><span>测量套内面积</span></div>' +
                '<div class="ai-feature-item"><span class="feature-icon">🏠</span><span>解析户型格局</span></div>' +
                '<div class="ai-feature-item"><span class="feature-icon">🧱</span><span>标注墙体分布</span></div>' +
                '<div class="ai-feature-item"><span class="feature-icon">🚪</span><span>定位门窗位置</span></div>' +
                '<div class="ai-feature-item"><span class="feature-icon">📍</span><span>识别管道烟道</span></div>' +
                '</div>' +
                '<div class="upload-btn-row">' +
                '<button class="btn-primary" id="ai-upload-btn">上传户型图</button>' +
                '<button class="btn-secondary" id="ai-skip-btn">跳过，手动填写</button>' +
                '</div>' +
                '</div>';
            
            optionsEl.appendChild(container);
            
            // 绑定上传按钮事件
            addTimer(setTimeout(function() {
                var uploadBtn = document.getElementById('ai-upload-btn');
                var skipBtn = document.getElementById('ai-skip-btn');
                
                if (uploadBtn) {
                    uploadBtn.addEventListener('click', function() {
                        simulateAiRecognition();
                    });
                }
                
                if (skipBtn) {
                    skipBtn.addEventListener('click', function() {
                        proceedToNextQuestion();
                    });
                }
            }, 100));
            
            scrollToBottom();
            return;
        } else if (question.type === 'ai-recognition-result') {
            // AI识别结果校验页
            container.className = 'ai-result-container';
            container.innerHTML = '<div class="ai-result-header"><span class="ai-badge">AI识别</span></div>';
            
            // 添加输入字段
            if (question.inputs) {
                question.inputs.forEach(function(inp) {
                    var inputGroup = document.createElement('div');
                    inputGroup.className = 'input-group';
                    inputGroup.innerHTML = '<label class="input-label">' + escapeHtml(inp.label) + '</label>' +
                        '<div class="input-row"><input type="text" class="input-field" id="ai-' + inp.id + '" placeholder="' + escapeHtml(inp.placeholder || '') + '" data-id="' + inp.id + '">' + (inp.suffix ? '<span class="input-suffix">' + escapeHtml(inp.suffix) + '</span>' : '') + '</div>';
                    container.appendChild(inputGroup);
                });
            }
            
            // 添加确认按钮
            var confirmBtn = document.createElement('button');
            confirmBtn.className = 'btn-primary';
            confirmBtn.textContent = '确认并继续';
            confirmBtn.addEventListener('click', function() {
                var aiData = {};
                if (question.inputs) {
                    question.inputs.forEach(function(inp) {
                        var inputEl = document.getElementById('ai-' + inp.id);
                        if (inputEl) {
                            aiData[inp.id] = inputEl.value;
                        }
                    });
                }
                saveAiRecognitionData(aiData);
                proceedToNextQuestion();
            });
            container.appendChild(confirmBtn);
            
            optionsEl.appendChild(container);
            scrollToBottom();
            return;
        } else if (question.type === 'single') {
            // 单选题
            container.className = 'options-grid options-grid-2';
            question.options.forEach(function(opt) {
                var card = document.createElement('div');
                card.className = 'option-card card';
                card.innerHTML = '<div class="option-card-content"><div class="option-label">' + escapeHtml(opt.text) + '</div><div class="option-sub">' + (opt.tip ? escapeHtml(opt.tip) : '') + '</div></div>';
                card.addEventListener('click', function(e) {
                    e.stopPropagation();
                    selectSingleAnswer(question, opt);
                });
                container.appendChild(card);
            });
        } else if (question.type === 'multi') {
            // 多选题
            container.className = 'options-grid options-grid-1 multi-options';
            var multiData = { selected: [] };

            var hasNoneOption = question.options.some(function(o) { return o.id === 'none'; });
            var optionsToRender = question.options.slice();
            if (!hasNoneOption) {
                optionsToRender.push({ id: 'none', text: '无/都不需要' });
            }

            optionsToRender.forEach(function(opt) {
                var card = document.createElement('div');
                card.className = 'option-card card multi-card';
                card.setAttribute('data-opt-id', opt.id);
                card.innerHTML = '<div class="option-card-content"><div class="option-label"><span class="multi-check"></span>' + escapeHtml(opt.text) + '</div><div class="option-sub">' + (opt.tip ? escapeHtml(opt.tip) : '') + '</div></div>';
                card.addEventListener('click', function(e) {
                    e.stopPropagation();
                    toggleMultiOption(card, opt, multiData);
                });
                container.appendChild(card);
            });

            // 添加确认按钮
            var confirmBtn = document.createElement('button');
            confirmBtn.className = 'btn-primary multi-confirm-btn';
            confirmBtn.textContent = '确认';
            confirmBtn.disabled = true;
            confirmBtn.addEventListener('click', function() {
                if (multiData.selected.length > 0) {
                    var finalSelected = multiData.selected.filter(function(s) { return s !== 'none'; });
                    selectMultiAnswer(question, finalSelected);
                }
            });
            container.appendChild(confirmBtn);

            // 保存确认按钮引用
            container.confirmBtn = confirmBtn;
        } else if (question.type === 'input') {
            // 输入题
            container.className = 'input-grid';
            question.inputs.forEach(function(inp) {
                var inputGroup = document.createElement('div');
                inputGroup.className = 'input-group';
                inputGroup.innerHTML = '<input type="text" class="input-field" id="input-' + inp.id + '" placeholder="' + escapeHtml(inp.placeholder || '') + '" data-id="' + inp.id + '">' + (inp.suffix ? '<span class="input-suffix">' + escapeHtml(inp.suffix) + '</span>' : '');
                container.appendChild(inputGroup);
            });

            var confirmBtn = document.createElement('button');
            confirmBtn.className = 'btn-primary';
            confirmBtn.textContent = '确认';
            confirmBtn.addEventListener('click', function() {
                selectInputAnswer(question);
            });
            container.appendChild(confirmBtn);
        }

        optionsEl.appendChild(container);

        // 添加上一步按钮
        addBackButton(optionsEl);

        scrollToBottom();
    }

    /**
     * 添加"上一步"按钮
     */
    function addBackButton(optionsEl) {
        if (!optionsEl) return;
        if (!answerHistory || answerHistory.length === 0) return;
        if (currentStage === 'houseBasic' && currentQuestionIndex === 0) return;

        var backBtn = document.createElement('button');
        backBtn.className = 'btn-text back-btn';
        backBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg> 上一步';
        backBtn.addEventListener('click', function() {
            goBack();
        });

        var backContainer = document.createElement('div');
        backContainer.className = 'back-btn-container';
        backContainer.appendChild(backBtn);
        optionsEl.appendChild(backContainer);
    }

    /**
     * 记录答题历史
     */
    function pushHistory() {
        answerHistory.push({
            stage: currentStage,
            questionIndex: currentQuestionIndex,
            messageCount: messageListEl ? messageListEl.children.length : 0
        });
    }

    /**
     * 上一步回退
     */
    function goBack() {
        if (answerHistory.length === 0) return;

        var prev = answerHistory.pop();
        currentStage = prev.stage;
        currentQuestionIndex = prev.questionIndex;

        // 删除多余的消息
        if (messageListEl && prev.messageCount > 0) {
            while (messageListEl.children.length > prev.messageCount) {
                messageListEl.removeChild(messageListEl.lastChild);
            }
        }

        // 重新显示当前题
        showQuestionnaireQuestion();
    }

    /**
     * 切换多选项
     */
    function toggleMultiOption(card, opt, multiData) {
        var container = card.parentElement;
        var isNone = opt.id === 'none';
        var checkSpan = card.querySelector('.multi-check');
        var idx = multiData.selected.indexOf(opt.id);
        var isCurrentlySelected = idx !== -1;

        if (isCurrentlySelected) {
            multiData.selected.splice(idx, 1);
            card.classList.remove('selected');
            checkSpan.innerHTML = '';
        } else {
            if (isNone) {
                multiData.selected = ['none'];
                var allCards = container.querySelectorAll('.multi-card');
                allCards.forEach(function(c) {
                    c.classList.remove('selected');
                    var cs = c.querySelector('.multi-check');
                    if (cs) cs.innerHTML = '';
                });
                card.classList.add('selected');
                checkSpan.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="var(--dai-blue)"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
            } else {
                var noneIdx = multiData.selected.indexOf('none');
                if (noneIdx !== -1) {
                    multiData.selected.splice(noneIdx, 1);
                    var noneCard = container.querySelector('.multi-card[data-opt-id="none"]');
                    if (noneCard) {
                        noneCard.classList.remove('selected');
                        var ncs = noneCard.querySelector('.multi-check');
                        if (ncs) ncs.innerHTML = '';
                    }
                }
                multiData.selected.push(opt.id);
                card.classList.add('selected');
                checkSpan.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="var(--dai-blue)"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
            }
        }

        var confirmBtn = container.confirmBtn;
        if (confirmBtn) {
            confirmBtn.disabled = multiData.selected.length === 0;
        }
    }

    /**
     * 选择单选题答案
     */
    function selectSingleAnswer(question, opt) {
        // 记录历史
        pushHistory();

        addUserMessage(opt.text);

        // 保存答案
        formData[question.id] = opt.id;

        // ========== 校验联动逻辑 ==========
        addTimer(setTimeout(function() {
            checkValidationRules(question.id, opt.id);
        }, 400));

        clearOptions();

        // ========== 处理 skipIf 逻辑 ==========
        if (question.skipIf && question.skipIf.field && question.skipIf.skipValues && question.skipIf.skipValues.indexOf(opt.id) !== -1) {
            // 跳过指定数量的题目
            var skipCount = question.skipIf.skipQuestions || 1;
            addTimer(setTimeout(function() {
                currentQuestionIndex += skipCount;
                showQuestionnaireQuestion();
            }, 800));
            saveToUserData();
            return;
        }

        // 检查是否需要显示追加题目
        if (opt.trigger === 'showExtra' && question.extraQuestions) {
            // 老房翻新追加3题
            addTimer(setTimeout(function() {
                addNianMessage('好的，老房翻新需要额外了解一些信息~ 关于老房翻新，有一个重要提示：');
                addTimer(setTimeout(function() {
                    addNianMessage('建议先委托专业机构出具《房屋结构鉴定报告》，明确承重墙位置。2000年前老旧小区约60%存在结构安全隐患，未经鉴定不得擅自拆改承重结构。');
                    addTimer(setTimeout(function() {
                        showExtraQuestions(question.extraQuestions);
                    }, 1000));
                }, 800));
            }, 800));
        } else {
            // 进入下一题
            addTimer(setTimeout(function() {
                currentQuestionIndex++;
                showQuestionnaireQuestion();
            }, 800));
        }

        saveToUserData();
    }

    /**
     * 校验联动规则
     */
    function checkValidationRules(questionId, optId) {
        var tips = [];

        // 商住公寓 + 高频做饭 → 提示不通燃气
        if (questionId === 'houseType' && optId === 'apartment') {
            if (formData.lifeScenes && formData.lifeScenes.indexOf('cooking') !== -1) {
                tips.push('【注意】商住公寓通常不通燃气，需依赖电磁炉做饭，请确认接受这种烹饪方式。');
            }
        }

        // LOFT层高 < 4.2m → 提示净高不足
        if (questionId === 'houseType' && optId === 'loft') {
            tips.push('【注意】LOFT装修需确认层高是否≥4.5m。如层高<4.2m，下层净高可能不足2.2m，二层使用体验较差，建议谨慎评估。');
        }

        // 层高≤2.7m + 无主灯设计 → 提示明装方案
        if (questionId === 'houseHeight' && optId === 'low') {
            if (formData.lighting === 'no_main') {
                tips.push('【注意】层高≤2.7m做满吊顶会进一步压缩空间。建议采用明装磁吸轨道灯方案，牺牲一点质感但保证层高。');
            }
        }

        // 电表≤40A + 大功率设备 → 提示扩容
        if (questionId === 'electricMeter' && optId === 'small') {
            if (formData.systemDevices && formData.systemDevices.length >= 2) {
                tips.push('【注意】电表容量40A及以下可能无法支持多台大功率设备同时运行。建议向供电局申请扩容，或调整设备组合。');
            }
        }

        // 物业不允许封阳台 + 选择封阳台 → 提示冲突
        if (questionId === 'balconyFunction' && optId === 'enclose') {
            if (formData.propertyRestrictions && formData.propertyRestrictions.indexOf('no_balcony') !== -1) {
                tips.push('【注意】您的物业不允许封阳台，这与您的需求冲突。建议确认规则或调整方案。');
            }
        }

        // 显示所有提示
        tips.forEach(function(tip, idx) {
            addTimer(setTimeout(function() {
                addNianMessage(tip);
            }, (idx + 1) * 1000));
        });
    }

    /**
     * 显示追加题目（老房3题）
     */
    function showExtraQuestions(questions) {
        showExtraQuestionAt(questions, 0);
    }

    function showExtraQuestionAt(questions, index) {
        if (index >= questions.length) {
            addTimer(setTimeout(function() {
                currentQuestionIndex++;
                showQuestionnaireQuestion();
            }, 600));
            return;
        }

        var q = questions[index];
        var msgEl = document.createElement('div');
        msgEl.className = 'message-row message-row-nian message-enter';
        msgEl.innerHTML = '<div class="message-avatar"><span class="nian-emoji-small">' + Icons.render('nian-default') + '</span></div><div class="question-card card"><div class="question-text">' + escapeHtml(q.question) + '</div></div>';
        messageListEl.appendChild(msgEl);
        scrollToBottom();

        // 添加动画类
        addTimer(requestAnimationFrame(function() {
            msgEl.classList.add('message-enter-active');
        }));

        addTimer(setTimeout(function() {
            renderExtraOptions(q, questions, index);
        }, 400));
    }

    /**
     * 渲染追加题目选项
     */
    function renderExtraOptions(question, questions, index) {
        var optionsEl = el.chatOptions;
        if (!optionsEl) return;

        optionsEl.innerHTML = '';
        var container = document.createElement('div');
        container.className = 'options-grid options-grid-2';

        question.options.forEach(function(opt) {
            var card = document.createElement('div');
            card.className = 'option-card card';
            card.innerHTML = '<div class="option-card-content"><div class="option-label">' + escapeHtml(opt.text) + '</div><div class="option-sub">' + (opt.tip ? escapeHtml(opt.tip) : '') + '</div></div>';
            card.addEventListener('click', function() {
                selectExtraAnswer(question, opt, questions, index);
            });
            container.appendChild(card);
        });

        optionsEl.appendChild(container);
    }

    /**
     * 选择追加题答案
     */
    function selectExtraAnswer(question, opt, questions, index) {
        addUserMessage(opt.text);
        formData[question.id] = opt.id;
        clearOptions();
        saveToUserData();

        // 延迟后显示下一题
        addTimer(setTimeout(function() {
            showExtraQuestionAt(questions, index + 1);
        }, 600));
    }

    /**
     * 选择多选题答案
     */
    function selectMultiAnswer(question, selected) {
        // 记录历史
        pushHistory();

        var selectedTexts = question.options.filter(function(o) {
            return selected.indexOf(o.id) !== -1;
        }).map(function(o) { return o.text; });

        addUserMessage(selectedTexts.join('、'));

        // ========== 分支触发逻辑 ==========
        var pendingBranches = [];

        // 适老化分支：选60岁以上老人
        if (question.id === 'familyMembers' && selected.indexOf('elder') !== -1) {
            if (question.extraBranches && question.extraBranches.elderlyNeeds) {
                pendingBranches.push(question.extraBranches.elderlyNeeds);
            }
        }

        // 母婴分支：选孕期/备孕中
        if (question.id === 'familyMembers' && selected.indexOf('pregnant') !== -1) {
            if (question.extraBranches && question.extraBranches.maternityNeeds) {
                pendingBranches.push(question.extraBranches.maternityNeeds);
            }
        }

        // 宠物分支
        if (question.id === 'pet' && selected.indexOf('none') === -1) {
            if (question.extraBranch) {
                pendingBranches.push(question.extraBranch);
            }
        }

        // 保存答案（过滤none值）
        var filteredSelected = selected.filter(function(id) { return id !== 'none'; });
        formData[question.id] = filteredSelected;

        // 量化校验提示
        if (question.id === 'shoesCount' || question.id === 'shoesRegular' || question.id === 'shoesSeasonal') {
            var regular = 0, seasonal = 0;
            if (question.id === 'shoesCount') {
                var regInput = document.getElementById('input-regular');
                var seaInput = document.getElementById('input-seasonal');
                regular = parseInt(regInput ? regInput.value : 0) || 0;
                seasonal = parseInt(seaInput ? seaInput.value : 0) || 0;
            }
            if (regular + seasonal > 60) {
                addTimer(setTimeout(function() {
                    addNianMessage('【提示】常穿鞋+换季鞋超过60双，建议评估鞋柜空间或考虑换季鞋外存方案。');
                }, 800));
            }
        }

        clearOptions();
        saveToUserData();

        // 处理分支
        if (pendingBranches.length > 0) {
            addTimer(setTimeout(function() {
                showExtraBranches(pendingBranches);
            }, 800));
        } else {
            addTimer(setTimeout(function() {
                currentQuestionIndex++;
                showQuestionnaireQuestion();
            }, 600));
        }
    }

    /**
     * 显示额外分支（适老化/母婴/宠物）
     */
    function showExtraBranches(branches) {
        var currentBranch = branches[0];
        var remaining = branches.slice(1);

        addNianMessage('好的，让我进一步了解一下您的特殊需求~');
        addTimer(setTimeout(function() {
            var msgEl = document.createElement('div');
            msgEl.className = 'message-row message-row-nian message-enter';
            msgEl.innerHTML = '<div class="message-avatar"><span class="nian-emoji-small">' + Icons.render('nian-default') + '</span></div><div class="question-card card"><div class="question-text">' + escapeHtml(currentBranch.question) + '</div></div>';
            messageListEl.appendChild(msgEl);
            scrollToBottom();

            // 添加动画类
            addTimer(requestAnimationFrame(function() {
                msgEl.classList.add('message-enter-active');
            }));

            addTimer(setTimeout(function() {
                renderBranchOptions(currentBranch, remaining);
            }, 600));
        }, 600));
    }

    /**
     * 渲染分支选项
     */
    function renderBranchOptions(branch, remaining) {
        var optionsEl = el.chatOptions;
        if (!optionsEl) return;

        optionsEl.innerHTML = '';
        var container = document.createElement('div');
        container.className = 'options-grid options-grid-1 multi-options';
        var multiData = { selected: [] };

        branch.options.forEach(function(opt) {
            var card = document.createElement('div');
            card.className = 'option-card card multi-card';
            card.innerHTML = '<div class="option-card-content"><div class="option-label"><span class="multi-check"></span>' + escapeHtml(opt.text) + '</div></div>';
            card.addEventListener('click', function() {
                toggleMultiOption(card, opt, multiData);
            });
            container.appendChild(card);
        });

        var confirmBtn = document.createElement('button');
        confirmBtn.className = 'btn-primary multi-confirm-btn';
        confirmBtn.textContent = '确认';
        confirmBtn.disabled = true;
        confirmBtn.addEventListener('click', function() {
            if (multiData.selected.length > 0) {
                selectBranchAnswer(branch, multiData.selected, remaining);
            }
        });
        container.appendChild(confirmBtn);
        container.confirmBtn = confirmBtn;

        optionsEl.appendChild(container);
        scrollToBottom();
    }

    /**
     * 选择分支答案
     */
    function selectBranchAnswer(branch, selected, remaining) {
        var selectedTexts = branch.options.filter(function(o) {
            return selected.indexOf(o.id) !== -1;
        }).map(function(o) { return o.text; });

        addUserMessage(selectedTexts.join('、'));
        var filteredSelected = selected.filter(function(id) { return id !== 'none'; });
        formData[branch.id] = filteredSelected;
        clearOptions();

        if (remaining.length > 0) {
            addTimer(setTimeout(function() {
                showExtraBranches(remaining);
            }, 600));
        } else {
            addTimer(setTimeout(function() {
                currentQuestionIndex++;
                showQuestionnaireQuestion();
            }, 600));
        }
    }

    /**
     * 选择输入题答案
     */
    function selectInputAnswer(question) {
        // 记录历史
        pushHistory();

        var inputs = document.querySelectorAll('.input-field');
        var values = {};

        inputs.forEach(function(input) {
            var id = input.dataset.id;
            values[id] = input.value;
        });

        var displayText = question.inputs.map(function(inp) {
            return inp.placeholder + '：' + (values[inp.id] || '0') + (inp.suffix || '');
        }).join('，');

        addUserMessage(displayText);

        // 保存答案
        question.inputs.forEach(function(inp) {
            if (inp.suffix === '双') {
                if (inp.id === 'regular') formData.shoesRegular = parseInt(values[inp.id]) || 0;
                if (inp.id === 'seasonal') formData.shoesSeasonal = parseInt(values[inp.id]) || 0;
            } else {
                formData[inp.id] = values[inp.id] || '';
            }
        });

        clearOptions();
        saveToUserData();

        addTimer(setTimeout(function() {
            currentQuestionIndex++;
            showQuestionnaireQuestion();
        }, 600));
    }

    /**
     * 进入下一阶段
     * 流程：前置评估(houseBasic→modeEvaluation) → 模式选择+边界对齐 → 通用核心层(familyProfile→...→customCabinets) → 模式专属层
     */
    function proceedToNextStage() {
        var coreStages = ['familyProfile', 'entryLine', 'kitchenLine', 'livingLine', 'bedroomLine', 'bathroomLine', 'laundryLine', 'storage', 'equipment', 'style', 'eco', 'timeline', 'customCabinets'];
        var modeStages = {
            'self': 'selfBuild',
            'half': 'halfPackage',
            'full': 'fullPackage'
        };

        if (currentStage === 'houseBasic') {
            addNianMessage('房屋基础信息已记录~ 接下来让我评估一下哪种装修模式更适合您~');
            addTimer(setTimeout(function() {
                currentStage = 'modeEvaluation';
                currentQuestionIndex = 0;
                showQuestionnaireQuestion();
            }, 800));
            return;
        }

        if (currentStage === 'modeEvaluation') {
            showDecorationModeSelection();
            return;
        }

        var coreIdx = coreStages.indexOf(currentStage);
        if (coreIdx !== -1 && coreIdx < coreStages.length - 1) {
            var nextStage = coreStages[coreIdx + 1];
            var stageTips = {
                'familyProfile': '家庭情况已记录。接下来我们看看各个空间的使用需求~',
                'entryLine': '入户信息已了解。现在来聊聊厨房和餐厅的使用习惯~',
                'kitchenLine': '餐厨动线已记录。客厅和阳台的使用也很重要~',
                'livingLine': '起居动线已了解。卧室是每天休息的地方~',
                'bedroomLine': '睡眠动线已记录。卫生间使用也很关键~',
                'bathroomLine': '卫浴信息已了解。家政区的规划也很重要~',
                'laundryLine': '家政动线已记录。储物空间是收纳的关键~',
                'storage': '储物需求已了解。设备规划决定了很多隐蔽工程~',
                'equipment': '设备信息已记录。现在聊聊您喜欢的风格~',
                'style': '风格偏好已了解。环保健康也是重要考量~',
                'eco': '环保信息已记录。确认一下工期要求~',
                'timeline': '工期已确认。最后来了解一下全屋定制需求~',
                'customCabinets': '全屋定制需求已记录~'
            };

            addNianMessage(stageTips[nextStage] || '好的，让我继续了解更多信息~');

            addTimer(setTimeout(function() {
                currentStage = nextStage;
                currentQuestionIndex = 0;
                showQuestionnaireQuestion();
            }, 800));
            return;
        }

        if (currentStage === 'customCabinets') {
            var decorationMode = state.formData.decorationMode;
            var modeStage = modeStages[decorationMode];

            if (modeStage && QUESTIONNAIRE_DATA[modeStage]) {
                var modeName = { 'self': '自装', 'half': '半包', 'full': '全包' }[decorationMode] || '';
                addNianMessage('通用需求都了解得差不多了~ 最后再确认一下' + modeName + '模式的具体需求~');
                addTimer(setTimeout(function() {
                    currentStage = modeStage;
                    currentQuestionIndex = 0;
                    showQuestionnaireQuestion();
                }, 800));
                return;
            }
        }

        if (currentStage === 'selfBuild' || currentStage === 'halfPackage' || currentStage === 'fullPackage') {
            proceedToHouseTypeSelection();
            return;
        }

        proceedToHouseTypeSelection();
    }

    /**
     * 进入装修模式选择
     */
    function showDecorationModeSelection() {
        var recommendedMode = calculateRecommendedMode();
        var modeNameMap = { 'self': '自装', 'half': '半包', 'full': '全包' };
        var modeName = modeNameMap[recommendedMode] || '全包';
        addNianMessage('好的，7道评估题已完成。根据您的情况，我推荐您选择"' + modeName + '"模式~ 您可以看看三种装修模式的特点，选择最适合您的方案~');
        addTimer(setTimeout(function() {
            renderDecorationModeOptions(recommendedMode);
        }, 800));
    }

    /**
     * 选择装修模式后显示边界认知对齐
     * 根据不同模式显示不同的对齐题
     */
    function showBoundaryAlign(modeId) {
        var modal = document.createElement('div');
        modal.className = 'modal onboarding-modal';

        var boundaryData = {
            'full': {
                title: '全包模式认知对齐',
                question: '【全包认知对齐】硬装全包常规包含：人工 + 辅材 + 基础主材（瓷砖/地板/木门/橱柜/卫浴/集成吊顶）；常规不含：全屋定制柜（衣柜、餐边柜、鞋柜等）、封阳台、中央空调/地暖/新风、家电软装、墙体加固、建渣外运。您之前是否了解这个边界？',
                options: [
                    { id: 'A', text: '了解，和我的认知一致' },
                    { id: 'B', text: '不了解，现在清楚了' },
                    { id: 'C', text: '以为部分项目是包含的，需要调整预期' }
                ]
            },
            'half': {
                title: '半包模式认知对齐',
                question: '【半包认知对齐】半包常规包含：人工 + 辅材（水泥/沙子/电线/水管/腻子/乳胶漆等）；常规不含：瓷砖、地板、木门、橱柜、卫浴洁具、集成吊顶、开关灯具、全屋定制柜、封阳台、中央空调/地暖/新风、家电软装。您需要自购以上主材，是否已了解？',
                options: [
                    { id: 'A', text: '了解，已做好采购准备' },
                    { id: 'B', text: '了解，但不确定自己能否跟上采购节奏' },
                    { id: 'C', text: '部分了解，需要施工方提供采购清单和节奏提醒' }
                ]
            },
            'self': {
                title: '自装模式认知对齐',
                question: '【自装认知对齐】自装需要您自己：找各工种工人、采购全部材料、把控施工质量、对接所有供应商、承担全部风险和售后。优点是省钱、可控性强，缺点是耗费大量时间精力、需要专业知识。您是否已了解自装的全部责任边界？',
                options: [
                    { id: 'A', text: '了解，已做好充分准备' },
                    { id: 'B', text: '基本了解，有信心搞定' },
                    { id: 'C', text: '还在评估，需要了解更多细节' }
                ]
            }
        };

        var data = boundaryData[modeId] || boundaryData['half'];
        var optionsHtml = data.options.map(function(opt, idx) {
            return '<div class="option-card card boundary-option" data-choice="' + opt.id + '"><div class="option-card-content"><div class="option-label">' + opt.text + '</div></div></div>';
        }).join('');

        modal.innerHTML = '<div class="modal-content onboarding-modal-content"><div class="onboarding-modal-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--dai-blue)" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg></div><div class="onboarding-modal-title">' + data.title + '</div><div class="onboarding-modal-body">' + data.question + '</div><div class="options-grid" style="margin-top: 16px;">' + optionsHtml + '</div></div>';

        document.body.appendChild(modal);

        addTimer(requestAnimationFrame(function() {
            modal.classList.add('active');
        }));

        modal.addEventListener('click', function(e) {
            var optionCard = e.target.closest('.boundary-option');
            if (optionCard) {
                var choice = optionCard.dataset.choice;
                formData.boundaryAlignChoice = choice;

                modal.classList.remove('active');
                addTimer(setTimeout(function() {
                    if (modal.parentNode) modal.parentNode.removeChild(modal);
                }, 300));

                if (choice === 'C') {
                    addNianMessage('好的，我帮您整理一下需要注意的边界项目~ 在后续需求收集中，相关项目我会特别标注出来，避免后续产生误解。');
                }

                addTimer(setTimeout(function() {
                    startQuestionnaireAfterBoundary();
                }, 800));
            }
        });
    }

    /**
     * 问卷完成后显示最终确认页面
     */
    function proceedToHouseTypeSelection() {
        addNianMessage('太好了！所有信息都已收集完成。');
        addTimer(setTimeout(function() {
            renderFinalConfirm();
        }, 800));
    }

    /**
     * 保存到用户数据
     */
    function saveToUserData() {
        if (window.App && App.state && App.state.userData) {
            App.state.userData.formData = formData;
            App.saveState();
        }
    }

    /**
     * 保存单题答案
     */
    function saveSingleAnswer(questionId, value) {
        formData[questionId] = value;
        saveToUserData();
    }

    function safeRender(containerEl) {
        try {
            render(containerEl);
        } catch (e) {
            console.error('[OnboardingView] render error:', e);
            if (window.App && App.showErrorState) {
                App.showErrorState(containerEl, {
                    title: '页面加载失败',
                    desc: '小管家在加载引导页时遇到了一点小问题~',
                    primaryAction: '重试',
                    secondaryAction: '返回首页',
                    onPrimaryAction: function() {
                        safeRender(containerEl);
                    },
                    onSecondaryAction: function() {
                        if (App.switchView) {
                            App.switchView('home');
                        }
                    }
                });
            }
            if (window.Toast && Toast.error) {
                Toast.error('页面加载出错了');
            }
        }
    }

    function safeInit(containerEl) {
        try {
            init(containerEl);
        } catch (e) {
            console.error('[OnboardingView] init error:', e);
            if (window.Toast && Toast.error) {
                Toast.error('页面初始化出错了');
            }
        }
    }

    function safeReset() {
        try {
            reset();
        } catch (e) {
            console.error('[OnboardingView] reset error:', e);
        }
    }

    return {
        render: safeRender,
        init: safeInit,
        reset: safeReset,
        destroy: destroy,
        formData: formData,
        renderRequirementTable: renderRequirementTable
    };
})();
