let currentPage = 'home';
let currentTab = 'home';
let fontSizeMode = 'large';
let reportType = 'day';
let isRecording = false;

const appContent = document.getElementById('appContent');
const navButtons = document.querySelectorAll('.nav-btn');
const fontButtons = document.querySelectorAll('.font-btn');
const iosNavBar = document.getElementById('iosNavBar');
const iosNavTitle = document.getElementById('iosNavTitle');
const iosNavBack = document.getElementById('iosNavBack');
const iosStatusBar = document.getElementById('iosStatusBar');
const iosTabbar = document.getElementById('iosTabbar');
const tabItems = document.querySelectorAll('.ios-tab-item');

const recipeData = {
    breakfast: {
        name: '早餐',
        icon: '🌅',
        iconClass: 'breakfast',
        calories: '约 380 kcal',
        items: [
            {
                id: 1,
                name: '燕麦小米粥',
                desc: '燕麦+小米+枸杞，软糯易消化',
                tag: '推荐',
                nutri: { protein: '8g', fat: '3g', carb: '52g' },
                ingredients: ['燕麦片 30g', '小米 20g', '枸杞 5g', '水 300ml'],
                nutrition: { calories: 180, protein: 6, fat: 2.5, carb: 32, fiber: 4 },
                effect: '养胃健脾，提供持久能量，适合老年人早餐食用'
            },
            {
                id: 2,
                name: '水煮蛋',
                desc: '优质蛋白质，营养好吸收',
                tag: '高蛋白',
                nutri: { protein: '6g', fat: '5g', carb: '1g' },
                ingredients: ['鸡蛋 1个', '水 适量'],
                nutrition: { calories: 78, protein: 6.5, fat: 5.5, carb: 0.6, fiber: 0 },
                effect: '补充优质蛋白质，增强免疫力'
            }
        ],
        alternatives: [
            {
                id: 101,
                name: '玉米粥',
                desc: '新鲜玉米研磨，香甜可口',
                tag: '粗粮',
                nutri: { protein: '5g', fat: '1g', carb: '45g' },
                ingredients: ['玉米渣 50g', '水 300ml'],
                nutrition: { calories: 160, protein: 4, fat: 1, carb: 35, fiber: 3 },
                effect: '富含膳食纤维，促进肠道蠕动'
            },
            {
                id: 102,
                name: '蒸红薯',
                desc: '软糯香甜，天然甜味',
                tag: '低GI',
                nutri: { protein: '2g', fat: '0g', carb: '28g' },
                ingredients: ['红薯 100g'],
                nutrition: { calories: 86, protein: 1.6, fat: 0.1, carb: 20, fiber: 2.2 },
                effect: '富含β-胡萝卜素，保护视力'
            },
            {
                id: 103,
                name: '无糖豆浆',
                desc: '黄豆打磨，营养丰富',
                tag: '植物蛋白',
                nutri: { protein: '8g', fat: '4g', carb: '3g' },
                ingredients: ['黄豆 20g', '水 300ml'],
                nutrition: { calories: 80, protein: 7, fat: 4, carb: 2, fiber: 1 },
                effect: '植物蛋白来源，降低胆固醇'
            }
        ]
    },
    lunch: {
        name: '午餐',
        icon: '☀️',
        iconClass: 'lunch',
        calories: '约 520 kcal',
        items: [
            {
                id: 3,
                name: '糙米饭',
                desc: '富含膳食纤维，升糖慢',
                tag: '低GI',
                nutri: { protein: '5g', fat: '1g', carb: '45g' },
                ingredients: ['糙米 50g', '大米 30g', '水 120ml'],
                nutrition: { calories: 220, protein: 5, fat: 1.5, carb: 45, fiber: 3.5 },
                effect: '富含B族维生素和膳食纤维，有助于控制血糖'
            },
            {
                id: 4,
                name: '清蒸鲈鱼',
                desc: '高蛋白低脂肪，护心血管',
                tag: '护心',
                nutri: { protein: '20g', fat: '4g', carb: '1g' },
                ingredients: ['鲈鱼 100g', '葱姜 适量', '蒸鱼豉油 5ml'],
                nutrition: { calories: 120, protein: 20, fat: 4, carb: 0.5, fiber: 0 },
                effect: '富含Omega-3脂肪酸，保护心血管健康'
            }
        ],
        alternatives: [
            {
                id: 201,
                name: '荞麦面',
                desc: '荞麦制成，筋道爽滑',
                tag: '低GI',
                nutri: { protein: '7g', fat: '1g', carb: '40g' },
                ingredients: ['荞麦面 80g', '水 适量'],
                nutrition: { calories: 160, protein: 6, fat: 1, carb: 30, fiber: 3 },
                effect: '富含芦丁，保护血管弹性'
            },
            {
                id: 202,
                name: '鸡胸肉炒青椒',
                desc: '低脂高蛋白，清爽可口',
                tag: '减脂',
                nutri: { protein: '18g', fat: '3g', carb: '5g' },
                ingredients: ['鸡胸肉 80g', '青椒 50g', '葱姜 适量'],
                nutrition: { calories: 110, protein: 17, fat: 3, carb: 4, fiber: 1 },
                effect: '优质蛋白质来源，适合减脂期食用'
            },
            {
                id: 203,
                name: '清蒸排骨',
                desc: '鲜嫩多汁，营养丰富',
                tag: '补钙',
                nutri: { protein: '16g', fat: '8g', carb: '0g' },
                ingredients: ['排骨 100g', '葱姜 适量'],
                nutrition: { calories: 140, protein: 15, fat: 8, carb: 0, fiber: 0 },
                effect: '补充钙质和胶原蛋白'
            }
        ]
    },
    dinner: {
        name: '晚餐',
        icon: '🌙',
        iconClass: 'dinner',
        calories: '约 420 kcal',
        items: [
            {
                id: 5,
                name: '杂粮馒头',
                desc: '多种谷物，营养均衡',
                tag: '杂粮',
                nutri: { protein: '7g', fat: '2g', carb: '40g' },
                ingredients: ['面粉 40g', '玉米面 10g', '黄豆粉 5g', '酵母 1g'],
                nutrition: { calories: 180, protein: 6.5, fat: 2, carb: 35, fiber: 3 },
                effect: '富含多种谷物营养，有助于消化吸收'
            },
            {
                id: 6,
                name: '虾仁豆腐',
                desc: '鲜嫩软滑，优质蛋白',
                tag: '补钙',
                nutri: { protein: '15g', fat: '6g', carb: '3g' },
                ingredients: ['嫩豆腐 100g', '虾仁 30g', '葱姜 适量'],
                nutrition: { calories: 130, protein: 14, fat: 6, carb: 2.5, fiber: 0.3 },
                effect: '补充钙质和蛋白质，预防骨质疏松'
            }
        ],
        alternatives: [
            {
                id: 301,
                name: '小米粥',
                desc: '软糯顺滑，易于消化',
                tag: '养胃',
                nutri: { protein: '4g', fat: '1g', carb: '35g' },
                ingredients: ['小米 40g', '水 300ml'],
                nutrition: { calories: 140, protein: 4, fat: 1, carb: 30, fiber: 1.6 },
                effect: '养胃健脾，适合晚餐食用'
            },
            {
                id: 302,
                name: '清蒸鳕鱼',
                desc: '肉质细腻，易消化',
                tag: '易消化',
                nutri: { protein: '18g', fat: '2g', carb: '0g' },
                ingredients: ['鳕鱼 100g', '葱姜 适量'],
                nutrition: { calories: 85, protein: 18, fat: 2, carb: 0, fiber: 0 },
                effect: '优质蛋白质，易于消化吸收'
            },
            {
                id: 303,
                name: '炒时蔬',
                desc: '多种蔬菜，营养丰富',
                tag: '低脂',
                nutri: { protein: '3g', fat: '3g', carb: '6g' },
                ingredients: ['西兰花 50g', '胡萝卜 30g', '木耳 20g'],
                nutrition: { calories: 45, protein: 2.5, fat: 2.5, carb: 5, fiber: 2 },
                effect: '补充维生素和膳食纤维'
            }
        ]
    },
    snack: {
        name: '加餐',
        icon: '🍎',
        iconClass: 'snack',
        calories: '约 150 kcal',
        items: [
            {
                id: 7,
                name: '温牛奶',
                desc: '补钙助眠，温润肠胃',
                tag: '助眠',
                nutri: { protein: '6g', fat: '4g', carb: '8g' },
                ingredients: ['温牛奶 200ml'],
                nutrition: { calories: 110, protein: 6, fat: 4, carb: 8, fiber: 0 },
                effect: '富含钙质，有助于安神助眠'
            }
        ],
        alternatives: [
            {
                id: 401,
                name: '无糖酸奶',
                desc: '益生菌丰富，助消化',
                tag: '益生菌',
                nutri: { protein: '5g', fat: '2g', carb: '3g' },
                ingredients: ['无糖酸奶 100g'],
                nutrition: { calories: 50, protein: 5, fat: 2, carb: 3, fiber: 0 },
                effect: '补充益生菌，调节肠道菌群'
            },
            {
                id: 402,
                name: '香蕉',
                desc: '软糯香甜，补钾好',
                tag: '补钾',
                nutri: { protein: '1g', fat: '0g', carb: '22g' },
                ingredients: ['香蕉 1根'],
                nutrition: { calories: 90, protein: 1, fat: 0.3, carb: 22, fiber: 2.6 },
                effect: '富含钾元素，维持心脏功能'
            },
            {
                id: 403,
                name: '杏仁',
                desc: '坚果之王，营养全面',
                tag: '健脑',
                nutri: { protein: '3g', fat: '7g', carb: '2g' },
                ingredients: ['杏仁 10颗'],
                nutrition: { calories: 75, protein: 2.5, fat: 6.5, carb: 2, fiber: 1.5 },
                effect: '富含维生素E，抗氧化健脑'
            }
        ]
    }
};

function navigateTo(page, options = {}) {
    currentPage = page;
    updateNavHighlight();
    updateNavBar(page, options);
    updateTabbar(page);
    renderPage(page, options);
}

function updateNavHighlight() {
    navButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.page === currentPage) {
            btn.classList.add('active');
        }
    });
}

function updateNavBar(page, options) {
    const homePages = ['home'];
    const isHome = homePages.includes(page);
    
    if (isHome) {
        iosNavBack.style.display = 'none';
        iosNavTitle.textContent = '食安伴';
        iosNavBar.classList.add('dark');
        iosNavBar.classList.add('transparent');
        iosNavBar.classList.remove('glass');
        iosStatusBar.classList.add('dark');
    } else {
        iosNavBack.style.display = 'block';
        iosNavBar.classList.remove('dark');
        iosNavBar.classList.remove('transparent');
        iosNavBar.classList.add('glass');
        iosStatusBar.classList.remove('dark');
        
        const titles = {
            recipe: 'AI智能配餐',
            recognize: '拍照识食',
            voice: '语音记录',
            family: '家庭关爱',
            report: '健康报告',
            devices: '设备同步',
            nutritionist: '营养师咨询',
            community: '社区配餐',
            mall: '健康商城',
            settings: '设置',
            recipeDetail: '食谱详情',
            profile: '个人中心'
        };
        iosNavTitle.textContent = titles[page] || '食安伴';
    }
    
    const contentEl = document.getElementById('appContent');
    if (isHome) {
        contentEl.classList.add('with-tabbar');
        contentEl.classList.remove('with-nav');
        iosTabbar.style.display = 'flex';
    } else {
        contentEl.classList.remove('with-tabbar');
        contentEl.classList.add('with-nav');
        iosTabbar.style.display = 'none';
    }
}

function updateTabbar(page) {
    const tabMap = {
        home: 'home',
        recipe: 'recipe',
        report: 'report',
        profile: 'profile'
    };
    
    const targetTab = tabMap[page];
    tabItems.forEach(item => {
        item.classList.remove('active');
        if (item.dataset.tab === targetTab) {
            item.classList.add('active');
        }
    });
}

function renderPage(page, options) {
    const pages = {
        home: renderHomePage,
        recipe: renderRecipePage,
        recognize: renderRecognizePage,
        voice: renderVoicePage,
        family: renderFamilyPage,
        report: renderReportPage,
        devices: renderDevicesPage,
        nutritionist: renderNutritionistPage,
        community: renderCommunityPage,
        mall: renderMallPage,
        settings: renderSettingsPage,
        recipeDetail: () => renderRecipeDetailPage(options),
        profile: renderProfilePage
    };
    
    const renderFn = pages[page] || renderHomePage;
    appContent.innerHTML = renderFn();
    bindPageEvents();
}

// ========== 首页 ==========
function renderHomePage() {
    return `
        <div class="apple-home-page">
            <div class="apple-home-hero">
                <div class="hero-greeting">
                    <div class="hero-text">
                        <div class="hero-title">早上好，张爷爷</div>
                        <div class="hero-sub">今天是 6月26日 星期五</div>
                    </div>
                    <div class="hero-avatar">👴</div>
                </div>
                <div class="health-score-card">
                    <div class="score-row">
                        <div class="score-ring">
                            <div class="score-num">78</div>
                        </div>
                        <div class="score-info">
                            <div class="score-title">今日健康评分</div>
                            <div class="score-desc">饮食整体不错，继续保持</div>
                        </div>
                    </div>
                    <div class="score-grid">
                        <div class="score-item">
                            <div class="score-item-value">1180</div>
                            <div class="score-item-label">热量(kcal)</div>
                        </div>
                        <div class="score-item">
                            <div class="score-item-value">56g</div>
                            <div class="score-item-label">蛋白质</div>
                        </div>
                        <div class="score-item">
                            <div class="score-item-value">4.2g</div>
                            <div class="score-item-label">盐摄入</div>
                        </div>
                    </div>
                    <button class="sync-devices-btn" id="syncDevicesBtn">
                        <span>🔗</span> 获取设备数据
                    </button>
                </div>
                
                <div class="device-data-panel" id="deviceDataPanel">
                    <div class="device-panel-header">
                        <div class="device-panel-title">📱 设备实时数据</div>
                        <div class="device-panel-time" id="deviceSyncTime">2分钟前更新</div>
                    </div>
                    <div class="device-data-grid">
                        <div class="device-data-item">
                            <div class="device-data-icon">⚖️</div>
                            <div class="device-data-content">
                                <div class="device-data-label">体重</div>
                                <div class="device-data-value">65.2 <span class="unit">kg</span></div>
                                <div class="device-data-trend up">↑ 0.3</div>
                            </div>
                        </div>
                        <div class="device-data-item">
                            <div class="device-data-icon">🩸</div>
                            <div class="device-data-content">
                                <div class="device-data-label">血压</div>
                                <div class="device-data-value">128/78 <span class="unit">mmHg</span></div>
                                <div class="device-data-trend normal">正常</div>
                            </div>
                        </div>
                        <div class="device-data-item">
                            <div class="device-data-icon">❤️</div>
                            <div class="device-data-content">
                                <div class="device-data-label">心率</div>
                                <div class="device-data-value">72 <span class="unit">bpm</span></div>
                                <div class="device-data-trend normal">正常</div>
                            </div>
                        </div>
                        <div class="device-data-item">
                            <div class="device-data-icon">📊</div>
                            <div class="device-data-content">
                                <div class="device-data-label">血糖</div>
                                <div class="device-data-value">7.2 <span class="unit">mmol/L</span></div>
                                <div class="device-data-trend warn">略高</div>
                            </div>
                        </div>
                    </div>
                    <div class="device-ai-link" id="deviceAiLink">
                        <div class="device-ai-text">🤖 AI已根据数据生成食谱建议</div>
                        <div class="device-ai-arrow">查看 ›</div>
                    </div>
                </div>
            </div>
            
            <div class="home-bento">
                <div class="record-bento">
                    <div class="record-card" data-nav="recognize">
                        <div class="record-icon-wrap blue">📷</div>
                        <div class="record-card-title">拍照记录</div>
                        <div class="record-card-desc">一拍即识<br>营养自动算</div>
                    </div>
                    <div class="record-card" data-nav="voice">
                        <div class="record-icon-wrap orange">🎤</div>
                        <div class="record-card-title">语音记录</div>
                        <div class="record-card-desc">说句话就行<br>操作更简单</div>
                    </div>
                </div>
                
                <div class="quick-bento">
                    <div class="quick-title">快捷功能</div>
                    <div class="quick-item" data-nav="recipe">
                        <div class="quick-icon green">🍱</div>
                        <div class="quick-label">今日食谱</div>
                    </div>
                    <div class="quick-item" data-nav="community">
                        <div class="quick-icon orange">🏘️</div>
                        <div class="quick-label">社区配餐</div>
                    </div>
                    <div class="quick-item" data-nav="family">
                        <div class="quick-icon blue">👨‍👩‍👧</div>
                        <div class="quick-label">家庭关爱</div>
                    </div>
                    <div class="quick-item" data-nav="nutritionist">
                        <div class="quick-icon purple">👩‍⚕️</div>
                        <div class="quick-label">营养师</div>
                    </div>
                    <div class="quick-item" data-nav="mall">
                        <div class="quick-icon red">🛒</div>
                        <div class="quick-label">健康商城</div>
                    </div>
                    <div class="quick-item" data-nav="devices">
                        <div class="quick-icon yellow">📱</div>
                        <div class="quick-label">设备同步</div>
                    </div>
                    <div class="quick-item" data-nav="report">
                        <div class="quick-icon green">📊</div>
                        <div class="quick-label">健康报告</div>
                    </div>
                    <div class="quick-item" data-nav="settings">
                        <div class="quick-icon blue">⚙️</div>
                        <div class="quick-label">设置</div>
                    </div>
                </div>
                
                <div class="nutrition-card">
                    <div class="nutri-header">
                        <div class="nutri-title">今日营养</div>
                        <span style="font-size:14px;color:var(--apple-gray-4);">目标完成度</span>
                    </div>
                    <div class="nutri-ring-wrap">
                        <div class="nutri-ring">
                            <div class="nutri-ring-inner">
                                <div class="nutri-percent">65%</div>
                                <div class="nutri-label">热量摄入</div>
                            </div>
                        </div>
                    </div>
                    <div class="nutri-grid">
                        <div class="nutri-item">
                            <div class="nutri-value">52g</div>
                            <div class="nutri-name">蛋白质</div>
                        </div>
                        <div class="nutri-item">
                            <div class="nutri-value">145g</div>
                            <div class="nutri-name">碳水</div>
                        </div>
                        <div class="nutri-item">
                            <div class="nutri-value">48g</div>
                            <div class="nutri-name">脂肪</div>
                        </div>
                        <div class="nutri-item">
                            <div class="nutri-value">4.2g</div>
                            <div class="nutri-name">钠</div>
                        </div>
                    </div>
                </div>
                
                <div class="ai-card" data-nav="recipe">
                    <div class="ai-icon-wrap">🤖</div>
                    <div class="ai-content">
                        <div class="ai-title">AI今日推荐</div>
                        <div class="ai-desc">根据您的血糖和血压情况，为您推荐低GI低盐食谱</div>
                    </div>
                </div>
                
                <div style="height:16px;"></div>
            </div>
        </div>
    `;
}

// ========== AI配餐页面 ==========
function renderRecipePage() {
    return `
        <div class="apple-recipe-page">
            <div class="recipe-hero">
                <div class="date-scroll">
                    <div class="date-item">
                        <div class="date-day">昨天</div>
                        <div class="date-num">25</div>
                    </div>
                    <div class="date-item active">
                        <div class="date-day">今天</div>
                        <div class="date-num">26</div>
                    </div>
                    <div class="date-item">
                        <div class="date-day">明天</div>
                        <div class="date-num">27</div>
                    </div>
                    <div class="date-item">
                        <div class="date-day">周六</div>
                        <div class="date-num">28</div>
                    </div>
                    <div class="date-item">
                        <div class="date-day">周日</div>
                        <div class="date-num">29</div>
                    </div>
                    <div class="date-item">
                        <div class="date-day">周一</div>
                        <div class="date-num">30</div>
                    </div>
                </div>
            </div>
            
            <div class="recipe-list">
                <div class="ai-analysis-board">
                    <div class="ai-board-header">
                        <div class="ai-board-title">🤖 AI智能分析</div>
                        <div class="ai-board-time">刚刚更新</div>
                    </div>
                    <div class="ai-board-flow">
                        <div class="ai-flow-step">
                            <div class="ai-flow-icon">📱</div>
                            <div class="ai-flow-label">设备数据</div>
                            <div class="ai-flow-value">已同步</div>
                        </div>
                        <div class="ai-flow-arrow">→</div>
                        <div class="ai-flow-step">
                            <div class="ai-flow-icon">🧠</div>
                            <div class="ai-flow-label">AI分析</div>
                            <div class="ai-flow-value">已完成</div>
                        </div>
                        <div class="ai-flow-arrow">→</div>
                        <div class="ai-flow-step active">
                            <div class="ai-flow-icon">🍱</div>
                            <div class="ai-flow-label">智能配餐</div>
                            <div class="ai-flow-value">已生成</div>
                        </div>
                    </div>
                    <div class="ai-board-data">
                        <div class="ai-data-item">
                            <div class="ai-data-icon">⚖️</div>
                            <div class="ai-data-info">
                                <div class="ai-data-label">体重</div>
                                <div class="ai-data-value">65.2 kg</div>
                            </div>
                            <div class="ai-data-trend up">↑ 0.3</div>
                        </div>
                        <div class="ai-data-item">
                            <div class="ai-data-icon">🩸</div>
                            <div class="ai-data-info">
                                <div class="ai-data-label">血压</div>
                                <div class="ai-data-value">128/78</div>
                            </div>
                            <div class="ai-data-trend down">↓ 正常</div>
                        </div>
                        <div class="ai-data-item">
                            <div class="ai-data-icon">❤️</div>
                            <div class="ai-data-info">
                                <div class="ai-data-label">心率</div>
                                <div class="ai-data-value">72 bpm</div>
                            </div>
                            <div class="ai-data-trend down">↓ 正常</div>
                        </div>
                        <div class="ai-data-item">
                            <div class="ai-data-icon">📊</div>
                            <div class="ai-data-info">
                                <div class="ai-data-label">血糖</div>
                                <div class="ai-data-value">7.2 mmol/L</div>
                            </div>
                            <div class="ai-data-trend up">↑ 略高</div>
                        </div>
                    </div>
                    <div class="ai-board-analysis">
                        <div class="ai-analysis-title">📋 AI分析报告</div>
                        <div class="ai-analysis-text">根据您的身体数据，AI分析建议：今天血糖略高（7.2 mmol/L），建议减少碳水化合物摄入，增加蛋白质和膳食纤维。晚餐选择杂粮馒头和虾仁豆腐，有助于平稳血糖。</div>
                    </div>
                    <div class="ai-board-logic">
                        <div class="ai-logic-title">🔍 AI分析逻辑</div>
                        <div class="ai-logic-step">
                            <div class="ai-logic-num">1</div>
                            <div class="ai-logic-content">
                                <div class="ai-logic-label">数据采集</div>
                                <div class="ai-logic-desc">从手环获取心率72bpm（正常），血压计获取128/78mmHg（正常），血糖仪获取7.2mmol/L（略高于空腹正常值6.1）</div>
                            </div>
                        </div>
                        <div class="ai-logic-step">
                            <div class="ai-logic-num">2</div>
                            <div class="ai-logic-content">
                                <div class="ai-logic-label">本地化分析</div>
                                <div class="ai-logic-desc">AI模型综合分析：血糖偏高需控制碳水摄入，血压正常可维持当前饮食结构，体重微升需注意热量控制</div>
                            </div>
                        </div>
                        <div class="ai-logic-step">
                            <div class="ai-logic-num">3</div>
                            <div class="ai-logic-content">
                                <div class="ai-logic-label">智能配餐</div>
                                <div class="ai-logic-desc">生成低GI食谱：早餐燕麦粥（平稳血糖），午餐糙米+鲈鱼（高蛋白低脂），晚餐杂粮馒头+虾仁豆腐（补钙控糖）</div>
                            </div>
                        </div>
                    </div>
                    <button class="ai-board-refresh" id="aiRefreshBtn">
                        <span>🔄</span> 重新分析
                    </button>
                </div>
                
                ${renderMealSection('breakfast')}
                ${renderMealSection('lunch')}
                ${renderMealSection('dinner')}
                ${renderMealSection('snack')}
                
                <div class="community-banner" data-nav="community">
                    <div class="community-icon-wrap">🏘️</div>
                    <div class="community-content">
                        <div class="community-title">家里没食材？</div>
                        <div class="community-desc">社区配餐送到家，新鲜又便宜</div>
                    </div>
                    <div class="community-arrow">›</div>
                </div>
                <div style="height:16px;"></div>
            </div>
        </div>
    `;
}

function renderMealSection(type) {
    const meal = recipeData[type];
    const iconClassMap = {
        breakfast: 'blue',
        lunch: 'green',
        dinner: 'orange',
        snack: 'yellow'
    };
    const reasonMap = {
        breakfast: '血糖偏高，燕麦富含β-葡聚糖，可延缓葡萄糖吸收，帮助平稳早餐后血糖',
        lunch: '血压正常，鲈鱼富含Omega-3脂肪酸，搭配糙米饭提供持久能量，保护心血管',
        dinner: '血糖略高，杂粮馒头低GI且富含膳食纤维，虾仁豆腐高蛋白低脂，补钙控糖',
        snack: '睡前补充温牛奶，富含色氨酸有助睡眠，同时补充钙质预防骨质疏松'
    };
    return `
        <div class="meal-section">
            <div class="meal-header">
                <div class="meal-title-wrap">
                    <div class="meal-icon ${iconClassMap[type]}">${meal.icon}</div>
                    <div class="meal-title">${meal.name}</div>
                </div>
                <div class="meal-cal">${meal.calories}</div>
            </div>
            <div class="ai-reason-bar">
                <span class="ai-reason-icon">🤖</span>
                <span class="ai-reason-text">${reasonMap[type]}</span>
            </div>
            ${meal.items.map(item => `
                <div class="recipe-card" data-recipe-id="${item.id}">
                    <div class="recipe-img">
                        <span class="recipe-tag">${item.tag}</span>
                        🍽️
                    </div>
                    <div class="recipe-body">
                        <div class="recipe-name">${item.name}</div>
                        <div class="recipe-desc">${item.desc}</div>
                        <div class="recipe-meta">
                            <div class="recipe-nutri-tags">
                                <span class="recipe-nutri-tag">蛋白质 ${item.nutri.protein}</span>
                                <span class="recipe-nutri-tag">脂肪 ${item.nutri.fat}</span>
                            </div>
                            <div class="recipe-change-btn">换一换</div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// ========== 食谱详情页 ==========
function renderRecipeDetailPage(options = {}) {
    const recipeId = options.recipeId;
    let recipe = null;
    let mealType = '';
    
    for (const [type, meal] of Object.entries(recipeData)) {
        const found = meal.items.find(i => i.id === recipeId);
        if (found) {
            recipe = found;
            mealType = type;
            break;
        }
    }
    
    if (!recipe) {
        recipe = recipeData.lunch.items[0];
    }
    
    return `
        <div class="recipe-detail-page">
            <div class="recipe-detail-hero">
                <div class="recipe-detail-img">🍽️</div>
                <div class="recipe-detail-body">
                    <div class="recipe-detail-name">${recipe.name}</div>
                    <div class="recipe-detail-desc">${recipe.desc}</div>
                    <div class="recipe-detail-tags">
                        <span class="recipe-nutri-tag">${recipe.nutri.protein} 蛋白</span>
                        <span class="recipe-nutri-tag">${recipe.nutri.fat} 脂肪</span>
                        <span class="recipe-nutri-tag">${recipe.nutri.carb} 碳水</span>
                    </div>
                </div>
            </div>
            
            <div class="ingredient-card">
                <div class="section-title">🥬 食材清单</div>
                <div class="ingredient-list">
                    ${recipe.ingredients.map(ing => `
                        <div class="ingredient-item">
                            <span class="ingredient-name">${ing}</span>
                            <span class="ingredient-buy">去购买</span>
                        </div>
                    `).join('')}
                </div>
                <button class="btn-primary ingredient-buy-btn" style="width:100%; margin-top:16px;">
                    🛒 一键购买全部食材
                </button>
            </div>
            
            <div class="nutrition-grid-card">
                <div class="section-title">📊 营养价值</div>
                <div class="nutrition-grid">
                    <div class="nutrition-grid-item">
                        <div class="nutrition-grid-value">${recipe.nutrition.calories}</div>
                        <div class="nutrition-grid-label">千卡</div>
                    </div>
                    <div class="nutrition-grid-item">
                        <div class="nutrition-grid-value">${recipe.nutrition.protein}g</div>
                        <div class="nutrition-grid-label">蛋白质</div>
                    </div>
                    <div class="nutrition-grid-item">
                        <div class="nutrition-grid-value">${recipe.nutrition.fat}g</div>
                        <div class="nutrition-grid-label">脂肪</div>
                    </div>
                </div>
            </div>
            
            <div class="effect-card">
                <div class="effect-title">💡 食疗功效</div>
                <p class="effect-text">${recipe.effect}</p>
            </div>
        </div>
    `;
}

// ========== 拍照识食页面 ==========
function renderRecognizePage() {
    return `
        <div class="recognize-page">
            <div class="camera-area">
                <div class="camera-frame">
                    <div class="camera-frame-bottom-left"></div>
                    <div class="camera-frame-bottom-right"></div>
                    <div class="camera-icon">🍽️</div>
                </div>
                <div class="camera-hint">将食物对准框内，点击拍照识别</div>
            </div>
            
            <div class="camera-btns">
                <div class="camera-btn">
                    <div class="camera-btn-circle">🖼️</div>
                    <div class="camera-btn-label">相册</div>
                </div>
                <div class="camera-btn main">
                    <div class="camera-btn-circle">📷</div>
                    <div class="camera-btn-label">拍照</div>
                </div>
                <div class="camera-btn">
                    <div class="camera-btn-circle">🔄</div>
                    <div class="camera-btn-label">切换</div>
                </div>
            </div>
            
            <div class="result-card">
                <div class="result-header">
                    <div class="result-title">识别结果</div>
                    <div class="result-count">共 2 种食物</div>
                </div>
                <div class="food-list">
                    <div class="food-item">
                        <div class="food-icon-wrap">🍚</div>
                        <div class="food-info">
                            <div class="food-name">白米饭</div>
                            <div class="food-amount">约 150g</div>
                        </div>
                        <div class="food-conf">
                            <div class="food-conf-value">96%</div>
                            <div class="food-conf-label">置信度</div>
                        </div>
                    </div>
                    <div class="food-item">
                        <div class="food-icon-wrap">🥩</div>
                        <div class="food-info">
                            <div class="food-name">红烧肉</div>
                            <div class="food-amount">约 100g</div>
                        </div>
                        <div class="food-conf">
                            <div class="food-conf-value">89%</div>
                            <div class="food-conf-label">置信度</div>
                        </div>
                    </div>
                </div>
                
                <div class="ai-feedback-card">
                    <div class="ai-feedback-header">
                        <span class="ai-feedback-icon">🤖</span>
                        <span class="ai-feedback-title">AI饮食反馈</span>
                    </div>
                    <div class="ai-feedback-comparison">
                        <div class="ai-compare-item">
                            <div class="ai-compare-label">AI推荐午餐</div>
                            <div class="ai-compare-value recommend">糙米饭 + 清蒸鲈鱼</div>
                            <div class="ai-compare-cal">约 340 kcal</div>
                        </div>
                        <div class="ai-compare-arrow">VS</div>
                        <div class="ai-compare-item">
                            <div class="ai-compare-label">实际摄入</div>
                            <div class="ai-compare-value actual">白米饭 + 红烧肉</div>
                            <div class="ai-compare-cal">约 650 kcal</div>
                        </div>
                    </div>
                    <div class="ai-feedback-analysis">
                        <div class="ai-feedback-row">
                            <span class="ai-feedback-tag warn">⚠️ 热量超标</span>
                            <span class="ai-feedback-detail">实际摄入比推荐多 310 kcal</span>
                        </div>
                        <div class="ai-feedback-row">
                            <span class="ai-feedback-tag warn">⚠️ 脂肪偏高</span>
                            <span class="ai-feedback-detail">红烧肉脂肪含量较高，推荐清蒸鲈鱼更健康</span>
                        </div>
                        <div class="ai-feedback-row">
                            <span class="ai-feedback-tag good">✅ 碳水正常</span>
                            <span class="ai-feedback-detail">白米饭与糙米饭碳水相近</span>
                        </div>
                    </div>
                    <div class="ai-feedback-suggestion">
                        <div class="ai-suggestion-title">📋 AI调整建议</div>
                        <div class="ai-suggestion-text">检测到午餐脂肪摄入超标，AI已自动调整晚餐食谱：减少油脂，增加膳食纤维。建议晚餐选择清蒸时蔬，搭配小米粥。</div>
                        <button class="ai-apply-btn" id="aiApplyBtn">✅ 采纳建议，调整晚餐</button>
                    </div>
                </div>
                
                <button class="btn-primary" style="width:100%;">✅ 确认记录</button>
            </div>
        </div>
    `;
}

// ========== 语音记录页面 ==========
function renderVoicePage() {
    return `
        <div class="voice-page">
            <div class="voice-card">
                <div class="voice-wave">
                    <div class="wave-bar"></div>
                    <div class="wave-bar"></div>
                    <div class="wave-bar"></div>
                    <div class="wave-bar"></div>
                    <div class="wave-bar"></div>
                    <div class="wave-bar"></div>
                    <div class="wave-bar"></div>
                    <div class="wave-bar"></div>
                    <div class="wave-bar"></div>
                    <div class="wave-bar"></div>
                </div>
                <div class="voice-status" id="voiceStatus">点击开始说话</div>
                <div class="voice-hint">用普通话描述您吃的食物，AI会自动识别</div>
                <div class="voice-record-btn" id="recordBtn">🎤</div>
            </div>
            
            <div class="voice-result-card">
                <div class="voice-result-label">识别结果</div>
                <div class="voice-result-text">我中午吃了一碗米饭，一份红烧肉，还有一盘炒青菜...</div>
            </div>
            
            <div class="examples-card">
                <div class="examples-title">💬 常用说法</div>
                <div class="example-item">我吃了两个包子和一杯豆浆</div>
                <div class="example-item">午餐吃了鱼香肉丝盖饭</div>
                <div class="example-item">晚上喝了一碗粥，吃了点咸菜</div>
            </div>
        </div>
    `;
}

// ========== 健康报告页面 ==========
function renderReportPage() {
    const isDay = reportType === 'day';
    const isWeek = reportType === 'week';
    
    return `
        <div style="padding: 20px; background: var(--apple-gray-6); min-height: 100%;">
            <div style="display: flex; gap: 8px; margin-bottom: var(--gap-md);">
                <button class="btn-tab ${isDay ? 'active' : ''}" data-report="day">日报</button>
                <button class="btn-tab ${isWeek ? 'active' : ''}" data-report="week">周报</button>
                <button class="btn-tab ${!isDay && !isWeek ? 'active' : ''}" data-report="month">月报</button>
            </div>
            
            <div style="background: linear-gradient(135deg, var(--apple-blue) 0%, #4a90d9 100%); border-radius: var(--radius-lg); padding: 32px; text-align: center; color: white; margin-bottom: var(--gap-md);">
                <div style="font-size: 64px; font-weight: 700; letter-spacing: -0.04em;">78</div>
                <div style="font-size: 15px; opacity: 0.9; margin-top: 8px;">${isDay ? '今日营养评分' : isWeek ? '本周营养评分' : '本月营养评分'}</div>
                <div style="margin-top: 16px; padding: 12px; background: rgba(255,255,255,0.15); backdrop-filter: blur(10px); border-radius: var(--radius-md); font-size: 14px; line-height: 1.6;">
                    ${isDay ? '今天的饮食整体不错 👍<br>脂肪摄入略高，晚餐建议清淡一些' : '本周饮食均衡度良好，继续保持！'}
                </div>
            </div>
            
            ${isDay ? renderDailyReport() : ''}
            ${isWeek ? renderWeeklyReport() : ''}
            ${!isDay && !isWeek ? renderMonthlyReport() : ''}
            
            <div class="data-loop-card">
                <div class="data-loop-header">
                    <span class="data-loop-icon">🔄</span>
                    <span class="data-loop-title">数据闭环追踪</span>
                </div>
                <div class="data-loop-flow">
                    <div class="loop-step done">
                        <div class="loop-step-icon">📱</div>
                        <div class="loop-step-label">设备采集</div>
                        <div class="loop-step-time">07:30</div>
                    </div>
                    <div class="loop-line done"></div>
                    <div class="loop-step done">
                        <div class="loop-step-icon">🤖</div>
                        <div class="loop-step-label">AI分析</div>
                        <div class="loop-step-time">07:31</div>
                    </div>
                    <div class="loop-line done"></div>
                    <div class="loop-step done">
                        <div class="loop-step-icon">🍱</div>
                        <div class="loop-step-label">智能配餐</div>
                        <div class="loop-step-time">07:32</div>
                    </div>
                    <div class="loop-line done"></div>
                    <div class="loop-step done">
                        <div class="loop-step-icon">📷</div>
                        <div class="loop-step-label">拍照记录</div>
                        <div class="loop-step-time">12:15</div>
                    </div>
                    <div class="loop-line active"></div>
                    <div class="loop-step active">
                        <div class="loop-step-icon">📊</div>
                        <div class="loop-step-label">反馈调整</div>
                        <div class="loop-step-time">进行中</div>
                    </div>
                </div>
                <div class="data-loop-summary">
                    <div class="loop-summary-title">📈 闭环效果</div>
                    <div class="loop-summary-row">
                        <span class="loop-summary-label">午餐偏差</span>
                        <span class="loop-summary-value warn">脂肪超标 +12g</span>
                    </div>
                    <div class="loop-summary-row">
                        <span class="loop-summary-label">AI调整</span>
                        <span class="loop-summary-value good">晚餐已自动减脂</span>
                    </div>
                    <div class="loop-summary-row">
                        <span class="loop-summary-label">预计改善</span>
                        <span class="loop-summary-value">明日食谱优化中</span>
                    </div>
                </div>
            </div>
            
            <div style="background: var(--glass-bg); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-radius: var(--radius-lg); padding: 16px; display: flex; align-items: center; gap: 14px; box-shadow: var(--glass-shadow); margin-bottom: var(--gap-md); border: 1px solid var(--glass-border); cursor: pointer;" data-nav="nutritionist">
                <div style="width: 48px; height: 48px; border-radius: var(--radius-md); background: linear-gradient(135deg, #ffe8e8, #ffd4d4); display: flex; align-items: center; justify-content: center; font-size: 24px;">👩‍⚕️</div>
                <div style="flex: 1;">
                    <div style="font-size: 15px; font-weight: 600;">有疑问？咨询营养师</div>
                    <div style="font-size: 13px; color: var(--apple-gray-4); margin-top: 2px;">专业营养师为您定制个性化饮食方案</div>
                </div>
                <div style="font-size: 20px; color: var(--apple-gray-4);">›</div>
            </div>
            
            <button class="btn-primary" style="margin-bottom: 20px;">
                <span>📤</span> 分享给子女
            </button>
        </div>
    `;
}

function renderDailyReport() {
    return `
        <div style="background: var(--glass-bg); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-radius: var(--radius-lg); padding: 20px; box-shadow: var(--glass-shadow); margin-bottom: var(--gap-md); border: 1px solid var(--glass-border);">
            <div style="font-size: 17px; font-weight: 600; letter-spacing: -0.02em; margin-bottom: 16px;">🍽️ 今日饮食记录</div>
            <div style="display: flex; flex-direction: column; gap: 12px;">
                <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--apple-gray-5); border-radius: var(--radius-md);">
                    <div style="width: 40px; height: 40px; border-radius: var(--radius-md); background: linear-gradient(135deg, #e8f4ff, #d4eaff); display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0;">🌅</div>
                    <div style="flex: 1;">
                        <div style="font-size: 15px; font-weight: 600;">早餐</div>
                        <div style="font-size: 13px; color: var(--apple-gray-4); margin-top: 2px;">燕麦小米粥 + 水煮蛋 + 凉拌黄瓜</div>
                    </div>
                    <div style="font-size: 14px; font-weight: 600; color: var(--apple-blue);">380 kcal</div>
                </div>
                <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--apple-gray-5); border-radius: var(--radius-md);">
                    <div style="width: 40px; height: 40px; border-radius: var(--radius-md); background: linear-gradient(135deg, #fff8e8, #fff0cc); display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0;">☀️</div>
                    <div style="flex: 1;">
                        <div style="font-size: 15px; font-weight: 600;">午餐</div>
                        <div style="font-size: 13px; color: var(--apple-gray-4); margin-top: 2px;">白米饭 + 红烧肉 + 炒青菜</div>
                    </div>
                    <div style="font-size: 14px; font-weight: 600; color: var(--apple-blue);">650 kcal</div>
                </div>
                <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--apple-gray-5); border-radius: var(--radius-md);">
                    <div style="width: 40px; height: 40px; border-radius: var(--radius-md); background: linear-gradient(135deg, #e8fbf0, #d4f5e0); display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0;">🍎</div>
                    <div style="flex: 1;">
                        <div style="font-size: 15px; font-weight: 600;">加餐</div>
                        <div style="font-size: 13px; color: var(--apple-gray-4); margin-top: 2px;">苹果 + 酸奶</div>
                    </div>
                    <div style="font-size: 14px; font-weight: 600; color: var(--apple-blue);">150 kcal</div>
                </div>
                <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--apple-gray-5); border-radius: var(--radius-md);">
                    <div style="width: 40px; height: 40px; border-radius: var(--radius-md); background: linear-gradient(135deg, #f5f5f7, #e8e8ed); display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0;">🌙</div>
                    <div style="flex: 1;">
                        <div style="font-size: 15px; font-weight: 600;">晚餐</div>
                        <div style="font-size: 13px; color: var(--apple-gray-5); margin-top: 2px;">待记录</div>
                    </div>
                    <div style="font-size: 14px; font-weight: 600; color: var(--apple-gray-5);">-- kcal</div>
                </div>
            </div>
        </div>
        
        <div style="background: var(--glass-bg); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-radius: var(--radius-lg); padding: 20px; box-shadow: var(--glass-shadow); margin-bottom: var(--gap-md); border: 1px solid var(--glass-border);">
            <div style="font-size: 17px; font-weight: 600; letter-spacing: -0.02em; margin-bottom: 16px;">📊 今日营养素</div>
            <div style="display: flex; flex-direction: column; gap: 14px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="font-size: 24px; flex-shrink: 0;">🔥</div>
                    <div style="flex: 1;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 14px; font-weight: 500;">热量</span>
                            <span style="font-size: 14px; font-weight: 600; color: var(--apple-gray-3);">1180 / 1800 kcal</span>
                        </div>
                        <div style="margin-top: 6px; height: 8px; background: var(--apple-gray-5); border-radius: var(--radius-full); overflow: hidden;">
                            <div style="height: 100%; background: linear-gradient(90deg, var(--apple-success), var(--apple-blue)); border-radius: var(--radius-full); width: 65%;"></div>
                        </div>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="font-size: 24px; flex-shrink: 0;">💪</div>
                    <div style="flex: 1;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 14px; font-weight: 500;">蛋白质</span>
                            <span style="font-size: 14px; font-weight: 600; color: var(--apple-gray-3);">52 / 60 g</span>
                        </div>
                        <div style="margin-top: 6px; height: 8px; background: var(--apple-gray-5); border-radius: var(--radius-full); overflow: hidden;">
                            <div style="height: 100%; background: linear-gradient(90deg, var(--apple-success), var(--apple-blue)); border-radius: var(--radius-full); width: 87%;"></div>
                        </div>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="font-size: 24px; flex-shrink: 0;">🌾</div>
                    <div style="flex: 1;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 14px; font-weight: 500;">碳水化合物</span>
                            <span style="font-size: 14px; font-weight: 600; color: var(--apple-gray-3);">145 / 210 g</span>
                        </div>
                        <div style="margin-top: 6px; height: 8px; background: var(--apple-gray-5); border-radius: var(--radius-full); overflow: hidden;">
                            <div style="height: 100%; background: linear-gradient(90deg, var(--apple-success), var(--apple-blue)); border-radius: var(--radius-full); width: 69%;"></div>
                        </div>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="font-size: 24px; flex-shrink: 0;">🥑</div>
                    <div style="flex: 1;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 14px; font-weight: 500;">脂肪</span>
                            <span style="font-size: 14px; font-weight: 600; color: var(--apple-danger);">48 / 50 g</span>
                        </div>
                        <div style="margin-top: 6px; height: 8px; background: var(--apple-gray-5); border-radius: var(--radius-full); overflow: hidden;">
                            <div style="height: 100%; background: linear-gradient(90deg, var(--apple-danger), #ff9500); border-radius: var(--radius-full); width: 96%;"></div>
                        </div>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="font-size: 24px; flex-shrink: 0;">🧂</div>
                    <div style="flex: 1;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 14px; font-weight: 500;">钠（盐）</span>
                            <span style="font-size: 14px; font-weight: 600; color: var(--apple-gray-3);">4.2 / 5 g</span>
                        </div>
                        <div style="margin-top: 6px; height: 8px; background: var(--apple-gray-5); border-radius: var(--radius-full); overflow: hidden;">
                            <div style="height: 100%; background: linear-gradient(90deg, var(--apple-success), var(--apple-blue)); border-radius: var(--radius-full); width: 84%;"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div style="background: linear-gradient(135deg, #fff8e8, #fff0cc); border-radius: var(--radius-lg); padding: 20px; margin-bottom: var(--gap-md); border: 1px solid rgba(255, 159, 10, 0.15);">
            <div style="font-size: 15px; font-weight: 600; color: var(--apple-orange); margin-bottom: 12px;">💡 今日饮食建议</div>
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <div style="display: flex; align-items: flex-start; gap: 10px;">
                    <span style="font-size: 18px;">🥬</span>
                    <span style="font-size: 13px; color: var(--apple-gray-3); line-height: 1.5;">午餐红烧肉脂肪含量较高，晚餐建议多吃蔬菜，选择清蒸或水煮的烹饪方式。</span>
                </div>
                <div style="display: flex; align-items: flex-start; gap: 10px;">
                    <span style="font-size: 18px;">💧</span>
                    <span style="font-size: 13px; color: var(--apple-gray-3); line-height: 1.5;">今天喝水量不足，建议多喝温水，每天至少1500ml。</span>
                </div>
                <div style="display: flex; align-items: flex-start; gap: 10px;">
                    <span style="font-size: 18px;">🚶</span>
                    <span style="font-size: 13px; color: var(--apple-gray-3); line-height: 1.5;">饭后散步30分钟，有助于消化和血糖控制。</span>
                </div>
            </div>
        </div>
    `;
}

function renderWeeklyReport() {
    return `
        <div style="background: var(--glass-bg); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-radius: var(--radius-lg); padding: 20px; box-shadow: var(--glass-shadow); margin-bottom: var(--gap-md); border: 1px solid var(--glass-border);">
            <div style="font-size: 17px; font-weight: 600; letter-spacing: -0.02em; margin-bottom: 16px;">📊 营养素达标率</div>
            <div style="display: flex; flex-direction: column; gap: 14px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="font-size: 24px; flex-shrink: 0;">🔥</div>
                    <div style="flex: 1;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 14px; font-weight: 500;">热量</span>
                            <span style="font-size: 14px; font-weight: 600; color: var(--apple-success);">92%</span>
                        </div>
                        <div style="margin-top: 6px; height: 8px; background: var(--apple-gray-5); border-radius: var(--radius-full); overflow: hidden;">
                            <div style="height: 100%; background: linear-gradient(90deg, var(--apple-success), var(--apple-blue)); border-radius: var(--radius-full); width: 92%;"></div>
                        </div>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="font-size: 24px; flex-shrink: 0;">💪</div>
                    <div style="flex: 1;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 14px; font-weight: 500;">蛋白质</span>
                            <span style="font-size: 14px; font-weight: 600; color: var(--apple-success);">95%</span>
                        </div>
                        <div style="margin-top: 6px; height: 8px; background: var(--apple-gray-5); border-radius: var(--radius-full); overflow: hidden;">
                            <div style="height: 100%; background: linear-gradient(90deg, var(--apple-success), var(--apple-blue)); border-radius: var(--radius-full); width: 95%;"></div>
                        </div>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="font-size: 24px; flex-shrink: 0;">🌾</div>
                    <div style="flex: 1;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 14px; font-weight: 500;">碳水化合物</span>
                            <span style="font-size: 14px; font-weight: 600; color: var(--apple-success);">88%</span>
                        </div>
                        <div style="margin-top: 6px; height: 8px; background: var(--apple-gray-5); border-radius: var(--radius-full); overflow: hidden;">
                            <div style="height: 100%; background: linear-gradient(90deg, var(--apple-success), var(--apple-blue)); border-radius: var(--radius-full); width: 88%;"></div>
                        </div>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="font-size: 24px; flex-shrink: 0;">🥑</div>
                    <div style="flex: 1;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 14px; font-weight: 500;">脂肪</span>
                            <span style="font-size: 14px; font-weight: 600; color: var(--apple-danger);">115%</span>
                        </div>
                        <div style="margin-top: 6px; height: 8px; background: var(--apple-gray-5); border-radius: var(--radius-full); overflow: hidden;">
                            <div style="height: 100%; background: linear-gradient(90deg, var(--apple-danger), #ff9500); border-radius: var(--radius-full); width: 100%;"></div>
                        </div>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="font-size: 24px; flex-shrink: 0;">🧂</div>
                    <div style="flex: 1;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 14px; font-weight: 500;">钠（盐）</span>
                            <span style="font-size: 14px; font-weight: 600; color: var(--apple-success);">78%</span>
                        </div>
                        <div style="margin-top: 6px; height: 8px; background: var(--apple-gray-5); border-radius: var(--radius-full); overflow: hidden;">
                            <div style="height: 100%; background: linear-gradient(90deg, var(--apple-success), var(--apple-blue)); border-radius: var(--radius-full); width: 78%;"></div>
                        </div>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="font-size: 24px; flex-shrink: 0;">🌿</div>
                    <div style="flex: 1;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 14px; font-weight: 500;">膳食纤维</span>
                            <span style="font-size: 14px; font-weight: 600; color: var(--apple-gray-3);">65%</span>
                        </div>
                        <div style="margin-top: 6px; height: 8px; background: var(--apple-gray-5); border-radius: var(--radius-full); overflow: hidden;">
                            <div style="height: 100%; background: linear-gradient(90deg, var(--apple-orange), var(--apple-danger)); border-radius: var(--radius-full); width: 65%;"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div style="background: linear-gradient(135deg, #fff8e8, #fff0cc); border-radius: var(--radius-lg); padding: 20px; margin-bottom: var(--gap-md); border: 1px solid rgba(255, 159, 10, 0.15);">
            <div style="font-size: 15px; font-weight: 600; color: var(--apple-orange); margin-bottom: 12px;">💡 本周改善建议</div>
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <div style="display: flex; align-items: flex-start; gap: 10px;">
                    <span style="font-size: 18px;">🥬</span>
                    <span style="font-size: 13px; color: var(--apple-gray-3); line-height: 1.5;">每天增加一份绿叶蔬菜，如菠菜、油麦菜等，补充膳食纤维和钾元素。</span>
                </div>
                <div style="display: flex; align-items: flex-start; gap: 10px;">
                    <span style="font-size: 18px;">🍗</span>
                    <span style="font-size: 13px; color: var(--apple-gray-3); line-height: 1.5;">建议选择鸡胸肉、鱼肉等低脂蛋白质来源，减少油炸食品的摄入。</span>
                </div>
            </div>
        </div>
    `;
}

function renderMonthlyReport() {
    return `
        <div style="background: var(--glass-bg); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-radius: var(--radius-lg); padding: 20px; box-shadow: var(--glass-shadow); margin-bottom: var(--gap-md); border: 1px solid var(--glass-border);">
            <div style="font-size: 17px; font-weight: 600; letter-spacing: -0.02em; margin-bottom: 16px;">📊 月度营养素达标率</div>
            <div style="display: flex; flex-direction: column; gap: 14px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="font-size: 24px; flex-shrink: 0;">🔥</div>
                    <div style="flex: 1;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 14px; font-weight: 500;">热量</span>
                            <span style="font-size: 14px; font-weight: 600; color: var(--apple-success);">89%</span>
                        </div>
                        <div style="margin-top: 6px; height: 8px; background: var(--apple-gray-5); border-radius: var(--radius-full); overflow: hidden;">
                            <div style="height: 100%; background: linear-gradient(90deg, var(--apple-success), var(--apple-blue)); border-radius: var(--radius-full); width: 89%;"></div>
                        </div>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="font-size: 24px; flex-shrink: 0;">💪</div>
                    <div style="flex: 1;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 14px; font-weight: 500;">蛋白质</span>
                            <span style="font-size: 14px; font-weight: 600; color: var(--apple-success);">91%</span>
                        </div>
                        <div style="margin-top: 6px; height: 8px; background: var(--apple-gray-5); border-radius: var(--radius-full); overflow: hidden;">
                            <div style="height: 100%; background: linear-gradient(90deg, var(--apple-success), var(--apple-blue)); border-radius: var(--radius-full); width: 91%;"></div>
                        </div>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="font-size: 24px; flex-shrink: 0;">🌾</div>
                    <div style="flex: 1;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 14px; font-weight: 500;">碳水化合物</span>
                            <span style="font-size: 14px; font-weight: 600; color: var(--apple-success);">85%</span>
                        </div>
                        <div style="margin-top: 6px; height: 8px; background: var(--apple-gray-5); border-radius: var(--radius-full); overflow: hidden;">
                            <div style="height: 100%; background: linear-gradient(90deg, var(--apple-success), var(--apple-blue)); border-radius: var(--radius-full); width: 85%;"></div>
                        </div>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="font-size: 24px; flex-shrink: 0;">🥑</div>
                    <div style="flex: 1;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 14px; font-weight: 500;">脂肪</span>
                            <span style="font-size: 14px; font-weight: 600; color: var(--apple-danger);">108%</span>
                        </div>
                        <div style="margin-top: 6px; height: 8px; background: var(--apple-gray-5); border-radius: var(--radius-full); overflow: hidden;">
                            <div style="height: 100%; background: linear-gradient(90deg, var(--apple-danger), #ff9500); border-radius: var(--radius-full); width: 100%;"></div>
                        </div>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="font-size: 24px; flex-shrink: 0;">🧂</div>
                    <div style="flex: 1;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 14px; font-weight: 500;">钠（盐）</span>
                            <span style="font-size: 14px; font-weight: 600; color: var(--apple-success);">82%</span>
                        </div>
                        <div style="margin-top: 6px; height: 8px; background: var(--apple-gray-5); border-radius: var(--radius-full); overflow: hidden;">
                            <div style="height: 100%; background: linear-gradient(90deg, var(--apple-success), var(--apple-blue)); border-radius: var(--radius-full); width: 82%;"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div style="background: linear-gradient(135deg, #fff8e8, #fff0cc); border-radius: var(--radius-lg); padding: 20px; margin-bottom: var(--gap-md); border: 1px solid rgba(255, 159, 10, 0.15);">
            <div style="font-size: 15px; font-weight: 600; color: var(--apple-orange); margin-bottom: 12px;">💡 月度改善建议</div>
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <div style="display: flex; align-items: flex-start; gap: 10px;">
                    <span style="font-size: 18px;">🏃</span>
                    <span style="font-size: 13px; color: var(--apple-gray-3); line-height: 1.5;">建议每天饭后散步30分钟，配合饮食控制效果更好。</span>
                </div>
                <div style="display: flex; align-items: flex-start; gap: 10px;">
                    <span style="font-size: 18px;">🐟</span>
                    <span style="font-size: 13px; color: var(--apple-gray-3); line-height: 1.5;">每周吃2-3次深海鱼，补充Omega-3脂肪酸，保护心血管健康。</span>
                </div>
                <div style="display: flex; align-items: flex-start; gap: 10px;">
                    <span style="font-size: 18px;">📋</span>
                    <span style="font-size: 13px; color: var(--apple-gray-3); line-height: 1.5;">建议预约营养师进行一对一咨询，制定更精准的月度饮食方案。</span>
                </div>
            </div>
        </div>
    `;
}

// ========== 社区配餐页面 ==========
function renderCommunityPage() {
    return `
        <div style="padding: 20px; background: var(--apple-gray-6); min-height: 100%;">
            <div style="background: linear-gradient(135deg, var(--apple-purple) 0%, #8a5cde 100%); border-radius: var(--radius-lg); padding: 24px; color: white; margin-bottom: var(--gap-md);">
                <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">🏘️ 社区配餐</div>
                <div style="font-size: 13px; opacity: 0.9;">新鲜食材送到家，健康美味每一天</div>
                <div style="margin-top: 16px; display: flex; gap: 10px;">
                    <div style="flex: 1; padding: 10px; background: rgba(255,255,255,0.2); backdrop-filter: blur(10px); border-radius: var(--radius-md); text-align: center; font-size: 13px; font-weight: 600;">今日配餐</div>
                    <div style="flex: 1; padding: 10px; background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); border-radius: var(--radius-md); text-align: center; font-size: 13px;">明日预订</div>
                    <div style="flex: 1; padding: 10px; background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); border-radius: var(--radius-md); text-align: center; font-size: 13px;">食材采购</div>
                </div>
            </div>
            
            <div style="background: var(--glass-bg); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-radius: var(--radius-lg); padding: 20px; box-shadow: var(--glass-shadow); margin-bottom: var(--gap-md); border: 1px solid var(--glass-border);">
                <div style="font-size: 17px; font-weight: 600; letter-spacing: -0.02em; margin-bottom: 16px;">🍱 今日特惠套餐</div>
                <div style="display: flex; flex-direction: column; gap: 14px;">
                    <div style="display: flex; gap: 14px; padding: 14px; background: var(--apple-gray-5); border-radius: var(--radius-md);">
                        <div style="width: 72px; height: 72px; border-radius: var(--radius-md); background: linear-gradient(135deg, #e8fbf0, #d4f5e0); display: flex; align-items: center; justify-content: center; font-size: 36px; flex-shrink: 0;">🍚</div>
                        <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
                            <div>
                                <div style="font-size: 15px; font-weight: 600;">营养午餐套餐A</div>
                                <div style="font-size: 13px; color: var(--apple-gray-4); margin-top: 4px;">糙米饭 + 清蒸鲈鱼 + 蒜蓉西兰花</div>
                                <div style="display: flex; gap: 8px; margin-top: 8px;">
                                    <span style="font-size: 11px; padding: 3px 10px; background: rgba(52, 199, 89, 0.15); color: var(--apple-success); border-radius: var(--radius-full); font-weight: 500;">低盐</span>
                                    <span style="font-size: 11px; padding: 3px 10px; background: rgba(0, 113, 227, 0.15); color: var(--apple-blue); border-radius: var(--radius-full); font-weight: 500;">高蛋白</span>
                                </div>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div style="display: flex; align-items: baseline; gap: 2px;">
                                    <span style="font-size: 14px; font-weight: 600; color: var(--apple-danger);">¥</span>
                                    <span style="font-size: 22px; font-weight: 700; color: var(--apple-danger);">28</span>
                                    <span style="font-size: 12px; color: var(--apple-gray-5); text-decoration: line-through; margin-left: 4px;">¥35</span>
                                </div>
                                <button class="btn-primary btn-sm" style="padding: 8px 16px;">立即购买</button>
                            </div>
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 14px; padding: 14px; background: var(--apple-gray-5); border-radius: var(--radius-md);">
                        <div style="width: 72px; height: 72px; border-radius: var(--radius-md); background: linear-gradient(135deg, #fff8e8, #fff0cc); display: flex; align-items: center; justify-content: center; font-size: 36px; flex-shrink: 0;">🥣</div>
                        <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
                            <div>
                                <div style="font-size: 15px; font-weight: 600;">软食晚餐套餐</div>
                                <div style="font-size: 13px; color: var(--apple-gray-4); margin-top: 4px;">杂粮馒头 + 虾仁豆腐 + 菠菜汤</div>
                                <div style="display: flex; gap: 8px; margin-top: 8px;">
                                    <span style="font-size: 11px; padding: 3px 10px; background: rgba(255, 159, 10, 0.15); color: var(--apple-orange); border-radius: var(--radius-full); font-weight: 500;">易消化</span>
                                    <span style="font-size: 11px; padding: 3px 10px; background: rgba(200, 180, 255, 0.15); color: var(--apple-purple); border-radius: var(--radius-full); font-weight: 500;">老人餐</span>
                                </div>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div style="display: flex; align-items: baseline; gap: 2px;">
                                    <span style="font-size: 14px; font-weight: 600; color: var(--apple-danger);">¥</span>
                                    <span style="font-size: 22px; font-weight: 700; color: var(--apple-danger);">22</span>
                                    <span style="font-size: 12px; color: var(--apple-gray-5); text-decoration: line-through; margin-left: 4px;">¥28</span>
                                </div>
                                <button class="btn-primary btn-sm" style="padding: 8px 16px;">立即购买</button>
                            </div>
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 14px; padding: 14px; background: var(--apple-gray-5); border-radius: var(--radius-md);">
                        <div style="width: 72px; height: 72px; border-radius: var(--radius-md); background: linear-gradient(135deg, #e8f4ff, #d4eaff); display: flex; align-items: center; justify-content: center; font-size: 36px; flex-shrink: 0;">🥗</div>
                        <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
                            <div>
                                <div style="font-size: 15px; font-weight: 600;">糖尿病友好套餐</div>
                                <div style="font-size: 13px; color: var(--apple-gray-4); margin-top: 4px;">荞麦面 + 鸡胸肉 + 凉拌木耳</div>
                                <div style="display: flex; gap: 8px; margin-top: 8px;">
                                    <span style="font-size: 11px; padding: 3px 10px; background: rgba(162, 210, 255, 0.3); color: #0071e3; border-radius: var(--radius-full); font-weight: 500;">低GI</span>
                                    <span style="font-size: 11px; padding: 3px 10px; background: rgba(255, 59, 48, 0.15); color: var(--apple-danger); border-radius: var(--radius-full); font-weight: 500;">控糖</span>
                                </div>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div style="display: flex; align-items: baseline; gap: 2px;">
                                    <span style="font-size: 14px; font-weight: 600; color: var(--apple-danger);">¥</span>
                                    <span style="font-size: 22px; font-weight: 700; color: var(--apple-danger);">32</span>
                                    <span style="font-size: 12px; color: var(--apple-gray-5); text-decoration: line-through; margin-left: 4px;">¥40</span>
                                </div>
                                <button class="btn-primary btn-sm" style="padding: 8px 16px;">立即购买</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div style="background: var(--glass-bg); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-radius: var(--radius-lg); padding: 20px; box-shadow: var(--glass-shadow); margin-bottom: var(--gap-md); border: 1px solid var(--glass-border);">
                <div style="font-size: 17px; font-weight: 600; letter-spacing: -0.02em; margin-bottom: 16px;">🥬 新鲜食材配送</div>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
                    <div style="background: var(--apple-gray-5); border-radius: var(--radius-md); padding: 14px; text-align: center;">
                        <div style="font-size: 32px; margin-bottom: 8px;">🥬</div>
                        <div style="font-size: 14px; font-weight: 500; margin-bottom: 4px;">新鲜菠菜</div>
                        <div style="font-size: 14px; font-weight: 600; color: var(--apple-danger);">¥5.8/斤</div>
                        <button style="margin-top: 8px; width: 28px; height: 28px; background: var(--apple-blue); color: white; border: none; border-radius: 50%; font-size: 20px; font-weight: 500; cursor: pointer;">+</button>
                    </div>
                    <div style="background: var(--apple-gray-5); border-radius: var(--radius-md); padding: 14px; text-align: center;">
                        <div style="font-size: 32px; margin-bottom: 8px;">🥦</div>
                        <div style="font-size: 14px; font-weight: 500; margin-bottom: 4px;">西兰花</div>
                        <div style="font-size: 14px; font-weight: 600; color: var(--apple-danger);">¥8.5/斤</div>
                        <button style="margin-top: 8px; width: 28px; height: 28px; background: var(--apple-blue); color: white; border: none; border-radius: 50%; font-size: 20px; font-weight: 500; cursor: pointer;">+</button>
                    </div>
                    <div style="background: var(--apple-gray-5); border-radius: var(--radius-md); padding: 14px; text-align: center;">
                        <div style="font-size: 32px; margin-bottom: 8px;">🐟</div>
                        <div style="font-size: 14px; font-weight: 500; margin-bottom: 4px;">鲜活鲈鱼</div>
                        <div style="font-size: 14px; font-weight: 600; color: var(--apple-danger);">¥28/条</div>
                        <button style="margin-top: 8px; width: 28px; height: 28px; background: var(--apple-blue); color: white; border: none; border-radius: 50%; font-size: 20px; font-weight: 500; cursor: pointer;">+</button>
                    </div>
                    <div style="background: var(--apple-gray-5); border-radius: var(--radius-md); padding: 14px; text-align: center;">
                        <div style="font-size: 32px; margin-bottom: 8px;">🥚</div>
                        <div style="font-size: 14px; font-weight: 500; margin-bottom: 4px;">土鸡蛋</div>
                        <div style="font-size: 14px; font-weight: 600; color: var(--apple-danger);">¥15/盒</div>
                        <button style="margin-top: 8px; width: 28px; height: 28px; background: var(--apple-blue); color: white; border: none; border-radius: 50%; font-size: 20px; font-weight: 500; cursor: pointer;">+</button>
                    </div>
                </div>
            </div>
            
            <div style="background: var(--glass-bg); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-radius: var(--radius-lg); padding: 24px; text-align: center; box-shadow: var(--glass-shadow); margin-bottom: var(--gap-md); border: 1px solid var(--glass-border);">
                <div style="font-size: 17px; font-weight: 600; margin-bottom: 16px;">🎫 我的取餐码</div>
                <div style="width: 140px; height: 140px; margin: 0 auto 16px; background: linear-gradient(135deg, #e8f4ff, #d4eaff); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; font-size: 52px; border: 2px dashed var(--apple-blue);">🍱</div>
                <div style="font-size: 13px; color: var(--apple-gray-4); margin-bottom: 12px;">凭此码到社区食堂取餐</div>
                <div style="font-size: 28px; font-weight: 700; color: var(--apple-blue); letter-spacing: 8px;">A 0 2 5 6</div>
            </div>
            
            <div style="background: linear-gradient(135deg, #fff8e8, #fff0cc); border-radius: var(--radius-lg); padding: 16px; display: flex; align-items: center; gap: 14px; margin-bottom: 80px; border: 1px solid rgba(255, 159, 10, 0.15);">
                <div style="font-size: 36px;">🎁</div>
                <div style="flex: 1;">
                    <div style="font-size: 24px; font-weight: 700; color: var(--apple-orange);">286</div>
                    <div style="font-size: 12px; color: var(--apple-gray-4);">健康积分 · 可抵扣餐费</div>
                </div>
                <button class="btn-primary btn-sm" style="background: var(--apple-orange);">兑换</button>
            </div>
        </div>
    `;
}

// ========== 家庭关爱页面 ==========
function renderFamilyPage() {
    return `
        <div style="padding: 20px; background: var(--apple-gray-6); min-height: 100%;">
            <div style="background: var(--glass-bg); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-radius: var(--radius-lg); padding: 24px; box-shadow: var(--glass-shadow); margin-bottom: var(--gap-md); border: 1px solid var(--glass-border);">
                <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 20px;">
                    <div style="width: 56px; height: 56px; border-radius: var(--radius-full); background: linear-gradient(135deg, var(--apple-blue), var(--apple-purple)); display: flex; align-items: center; justify-content: center; font-size: 28px; flex-shrink: 0;">👴</div>
                    <div style="flex: 1;">
                        <div style="font-size: 18px; font-weight: 600; letter-spacing: -0.02em;">张爷爷</div>
                        <div style="font-size: 13px; color: var(--apple-gray-4); margin-top: 2px;">今日健康评分 78 分</div>
                    </div>
                    <div style="padding: 6px 12px; background: rgba(52, 199, 89, 0.15); color: var(--apple-success); border-radius: var(--radius-full); font-size: 13px; font-weight: 500;">健康</div>
                </div>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
                    <div style="text-align: center; padding: 14px 8px; background: var(--apple-gray-5); border-radius: var(--radius-md);">
                        <div style="font-size: 20px; font-weight: 700; color: var(--apple-gray-1);">1180</div>
                        <div style="font-size: 11px; color: var(--apple-gray-4); margin-top: 2px;">热量(kcal)</div>
                    </div>
                    <div style="text-align: center; padding: 14px 8px; background: var(--apple-gray-5); border-radius: var(--radius-md);">
                        <div style="font-size: 20px; font-weight: 700; color: var(--apple-success);">6800</div>
                        <div style="font-size: 11px; color: var(--apple-gray-4); margin-top: 2px;">步数</div>
                    </div>
                    <div style="text-align: center; padding: 14px 8px; background: var(--apple-gray-5); border-radius: var(--radius-md);">
                        <div style="font-size: 20px; font-weight: 700; color: var(--apple-danger);">7.2</div>
                        <div style="font-size: 11px; color: var(--apple-gray-4); margin-top: 2px;">血糖</div>
                    </div>
                </div>
            </div>
            
            <div style="background: var(--glass-bg); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-radius: var(--radius-lg); padding: 20px; box-shadow: var(--glass-shadow); margin-bottom: var(--gap-md); border: 1px solid var(--glass-border);">
                <div style="font-size: 17px; font-weight: 600; letter-spacing: -0.02em; margin-bottom: 16px;">👨‍👩‍👧 家庭成员</div>
                <div style="display: flex; flex-direction: column; gap: 14px;">
                    <div style="display: flex; align-items: center; gap: 14px; padding: 12px; background: var(--apple-gray-5); border-radius: var(--radius-md);">
                        <div style="width: 44px; height: 44px; border-radius: var(--radius-full); background: linear-gradient(135deg, #ffd6e0, #ffb3c6); display: flex; align-items: center; justify-content: center; font-size: 22px;">👩</div>
                        <div style="flex: 1;">
                            <div style="font-size: 15px; font-weight: 600;">女儿 张小红</div>
                            <div style="font-size: 13px; color: var(--apple-gray-4);">昨天查看过</div>
                        </div>
                        <div style="font-size: 12px; color: var(--apple-gray-4);">管理 ›</div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 14px; padding: 12px; background: var(--apple-gray-5); border-radius: var(--radius-md);">
                        <div style="width: 44px; height: 44px; border-radius: var(--radius-full); background: linear-gradient(135deg, #d4eaff, #aad4ff); display: flex; align-items: center; justify-content: center; font-size: 22px;">👨</div>
                        <div style="flex: 1;">
                            <div style="font-size: 15px; font-weight: 600;">儿子 张大明</div>
                            <div style="font-size: 13px; color: var(--apple-gray-4);">3天前查看过</div>
                        </div>
                        <div style="font-size: 12px; color: var(--apple-gray-4);">管理 ›</div>
                    </div>
                    <button style="width: 100%; padding: 14px; background: var(--apple-blue-light); border: none; border-radius: var(--radius-md); color: var(--apple-blue); font-size: 15px; font-weight: 500; cursor: pointer; font-family: inherit; transition: all var(--duration-normal) var(--ease-spring);">+ 添加家庭成员</button>
                </div>
            </div>
            
            <div style="background: var(--glass-bg); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-radius: var(--radius-lg); padding: 20px; box-shadow: var(--glass-shadow); margin-bottom: var(--gap-md); border: 1px solid var(--glass-border);">
                <div style="font-size: 17px; font-weight: 600; letter-spacing: -0.02em; margin-bottom: 16px;">🔔 健康提醒</div>
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    <div style="display: flex; gap: 12px; padding: 12px; background: linear-gradient(135deg, #fff3e8, #ffe8d6); border-radius: var(--radius-md);">
                        <span style="font-size: 20px;">💊</span>
                        <div style="flex: 1;">
                            <div style="font-size: 14px; font-weight: 500;">吃药提醒</div>
                            <div style="font-size: 12px; color: var(--apple-gray-3); margin-top: 2px;">降血压药 每天早饭后</div>
                        </div>
                        <div style="font-size: 12px; color: var(--apple-orange);">已开启</div>
                    </div>
                    <div style="display: flex; gap: 12px; padding: 12px; background: linear-gradient(135deg, #e8fbf0, #d4f5e0); border-radius: var(--radius-md);">
                        <span style="font-size: 20px;">🚶</span>
                        <div style="flex: 1;">
                            <div style="font-size: 14px; font-weight: 500;">运动提醒</div>
                            <div style="font-size: 12px; color: var(--apple-gray-3); margin-top: 2px;">饭后散步30分钟</div>
                        </div>
                        <div style="font-size: 12px; color: var(--apple-success);">已开启</div>
                    </div>
                    <div style="display: flex; gap: 12px; padding: 12px; background: var(--apple-gray-5); border-radius: var(--radius-md);">
                        <span style="font-size: 20px;">💧</span>
                        <div style="flex: 1;">
                            <div style="font-size: 14px; font-weight: 500;">喝水提醒</div>
                            <div style="font-size: 12px; color: var(--apple-gray-3); margin-top: 2px;">每2小时喝一次水</div>
                        </div>
                        <div style="font-size: 12px; color: var(--apple-gray-4);">未开启</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ========== 设备同步页面 ==========
function renderDevicesPage() {
    return `
        <div style="padding: 20px; background: var(--apple-gray-6); min-height: 100%;">
            <div style="background: linear-gradient(135deg, var(--apple-blue) 0%, var(--apple-purple) 100%); border-radius: var(--radius-lg); padding: 24px; color: white; margin-bottom: var(--gap-md);">
                <div style="font-size: 17px; font-weight: 600; margin-bottom: 8px;">📱 我的设备</div>
                <div style="font-size: 13px; opacity: 0.9; margin-bottom: 20px;">连接智能设备，自动同步健康数据</div>
                <div style="display: flex; gap: 12px;">
                    <div style="flex: 1; background: rgba(255,255,255,0.2); backdrop-filter: blur(10px); border-radius: var(--radius-md); padding: 14px; text-align: center;">
                        <div style="font-size: 28px; margin-bottom: 6px;">⌚</div>
                        <div style="font-size: 13px;">智能手环</div>
                    </div>
                    <div style="flex: 1; background: rgba(255,255,255,0.2); backdrop-filter: blur(10px); border-radius: var(--radius-md); padding: 14px; text-align: center;">
                        <div style="font-size: 28px; margin-bottom: 6px;">🩸</div>
                        <div style="font-size: 13px;">血压计</div>
                    </div>
                    <div style="flex: 1; background: rgba(255,255,255,0.2); backdrop-filter: blur(10px); border-radius: var(--radius-md); padding: 14px; text-align: center;">
                        <div style="font-size: 28px; margin-bottom: 6px;">🩺</div>
                        <div style="font-size: 13px;">血糖仪</div>
                    </div>
                </div>
            </div>
            
            <div style="background: var(--glass-bg); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-radius: var(--radius-lg); padding: 20px; box-shadow: var(--glass-shadow); margin-bottom: var(--gap-md); border: 1px solid var(--glass-border);">
                <div style="font-size: 17px; font-weight: 600; letter-spacing: -0.02em; margin-bottom: 16px;">已连接设备</div>
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    <div style="display: flex; align-items: center; gap: 14px; padding: 14px; background: var(--apple-gray-5); border-radius: var(--radius-md);">
                        <div style="width: 48px; height: 48px; border-radius: var(--radius-md); background: linear-gradient(135deg, #e8f4ff, #d4eaff); display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0;">⌚</div>
                        <div style="flex: 1;">
                            <div style="font-size: 15px; font-weight: 600;">小米手环 8</div>
                            <div style="font-size: 13px; color: var(--apple-gray-4); margin-top: 2px;">电量 85% · 已同步</div>
                        </div>
                        <div style="width: 10px; height: 10px; border-radius: 50%; background: var(--apple-success);"></div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 14px; padding: 14px; background: var(--apple-gray-5); border-radius: var(--radius-md);">
                        <div style="width: 48px; height: 48px; border-radius: var(--radius-md); background: linear-gradient(135deg, #ffe8e8, #ffd4d4); display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0;">🩸</div>
                        <div style="flex: 1;">
                            <div style="font-size: 15px; font-weight: 600;">鱼跃电子血压计</div>
                            <div style="font-size: 13px; color: var(--apple-gray-4); margin-top: 2px;">上次同步 2小时前</div>
                        </div>
                        <div style="width: 10px; height: 10px; border-radius: 50%; background: var(--apple-gray-4);"></div>
                    </div>
                </div>
            </div>
            
            <div style="background: var(--glass-bg); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-radius: var(--radius-lg); padding: 20px; box-shadow: var(--glass-shadow); margin-bottom: var(--gap-md); border: 1px solid var(--glass-border);">
                <div style="font-size: 17px; font-weight: 600; letter-spacing: -0.02em; margin-bottom: 16px;">可添加设备</div>
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    <div style="display: flex; align-items: center; gap: 14px; padding: 14px; background: var(--apple-gray-5); border-radius: var(--radius-md);">
                        <div style="width: 48px; height: 48px; border-radius: var(--radius-md); background: linear-gradient(135deg, #fff8e8, #fff0cc); display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0;">⚖️</div>
                        <div style="flex: 1;">
                            <div style="font-size: 15px; font-weight: 600;">智能体重秤</div>
                            <div style="font-size: 13px; color: var(--apple-gray-4); margin-top: 2px;">体脂 / 体重自动记录</div>
                        </div>
                        <button style="padding: 8px 16px; background: var(--apple-blue); color: white; border: none; border-radius: var(--radius-full); font-size: 13px; font-weight: 500; cursor: pointer; font-family: inherit;">连接</button>
                    </div>
                    <div style="display: flex; align-items: center; gap: 14px; padding: 14px; background: var(--apple-gray-5); border-radius: var(--radius-md);">
                        <div style="width: 48px; height: 48px; border-radius: var(--radius-md); background: linear-gradient(135deg, #f0e8ff, #e0d4ff); display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0;">🫀</div>
                        <div style="flex: 1;">
                            <div style="font-size: 15px; font-weight: 600;">心电图仪</div>
                            <div style="font-size: 13px; color: var(--apple-gray-4); margin-top: 2px;">心率 / 心电监测</div>
                        </div>
                        <button style="padding: 8px 16px; background: var(--apple-blue); color: white; border: none; border-radius: var(--radius-full); font-size: 13px; font-weight: 500; cursor: pointer; font-family: inherit;">连接</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ========== 营养师咨询页面 ==========
function renderNutritionistPage() {
    return `
        <div style="padding: 20px; background: var(--apple-gray-6); min-height: 100%;">
            <div style="background: linear-gradient(135deg, #fa9d3b 0%, #ff7a3d 100%); border-radius: var(--radius-lg); padding: 24px; color: white; margin-bottom: var(--gap-md);">
                <div style="display: flex; align-items: center; gap: 16px;">
                    <div style="width: 64px; height: 64px; border-radius: var(--radius-full); background: white; display: flex; align-items: center; justify-content: center; font-size: 32px; flex-shrink: 0;">👩‍⚕️</div>
                    <div style="flex: 1;">
                        <div style="font-size: 18px; font-weight: 600;">专属营养师服务</div>
                        <div style="font-size: 13px; opacity: 0.9; margin-top: 4px;">一对一饮食指导，慢病调理</div>
                    </div>
                </div>
                <button style="width: 100%; margin-top: 20px; padding: 14px; background: white; color: var(--apple-orange); border: none; border-radius: var(--radius-md); font-size: 15px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all var(--duration-normal) var(--ease-spring);">立即咨询营养师</button>
            </div>
            
            <div style="background: var(--glass-bg); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-radius: var(--radius-lg); padding: 20px; box-shadow: var(--glass-shadow); margin-bottom: var(--gap-md); border: 1px solid var(--glass-border);">
                <div style="font-size: 17px; font-weight: 600; letter-spacing: -0.02em; margin-bottom: 16px;">🎓 营养师团队</div>
                <div style="display: flex; flex-direction: column; gap: 14px;">
                    <div style="display: flex; align-items: center; gap: 14px; padding: 14px; background: var(--apple-gray-5); border-radius: var(--radius-md);">
                        <div style="width: 52px; height: 52px; border-radius: var(--radius-full); background: linear-gradient(135deg, #ffd6e0, #ffb3c6); display: flex; align-items: center; justify-content: center; font-size: 26px; flex-shrink: 0;">👩‍⚕️</div>
                        <div style="flex: 1;">
                            <div style="font-size: 15px; font-weight: 600;">王营养师</div>
                            <div style="font-size: 12px; color: var(--apple-gray-4); margin-top: 2px;">注册营养师 · 10年经验</div>
                            <div style="font-size: 12px; color: var(--apple-orange); margin-top: 4px;">擅长：糖尿病饮食调理</div>
                        </div>
                        <button style="padding: 8px 14px; background: var(--apple-orange); color: white; border: none; border-radius: var(--radius-full); font-size: 12px; font-weight: 500; cursor: pointer; font-family: inherit;">咨询</button>
                    </div>
                    <div style="display: flex; align-items: center; gap: 14px; padding: 14px; background: var(--apple-gray-5); border-radius: var(--radius-md);">
                        <div style="width: 52px; height: 52px; border-radius: var(--radius-full); background: linear-gradient(135deg, #d4eaff, #aad4ff); display: flex; align-items: center; justify-content: center; font-size: 26px; flex-shrink: 0;">👨‍⚕️</div>
                        <div style="flex: 1;">
                            <div style="font-size: 15px; font-weight: 600;">李医师</div>
                            <div style="font-size: 12px; color: var(--apple-gray-4); margin-top: 2px;">临床营养师 · 副主任</div>
                            <div style="font-size: 12px; color: var(--apple-orange); margin-top: 4px;">擅长：高血压、心血管疾病</div>
                        </div>
                        <button style="padding: 8px 14px; background: var(--apple-orange); color: white; border: none; border-radius: var(--radius-full); font-size: 12px; font-weight: 500; cursor: pointer; font-family: inherit;">咨询</button>
                    </div>
                </div>
            </div>
            
            <div style="background: var(--glass-bg); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-radius: var(--radius-lg); padding: 20px; box-shadow: var(--glass-shadow); margin-bottom: var(--gap-md); border: 1px solid var(--glass-border);">
                <div style="font-size: 17px; font-weight: 600; letter-spacing: -0.02em; margin-bottom: 16px;">💼 服务套餐</div>
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    <div style="padding: 16px; background: linear-gradient(135deg, #e8fbf0, #d4f5e0); border-radius: var(--radius-md); border: 1px solid rgba(52, 199, 89, 0.2);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <div style="font-size: 15px; font-weight: 600;">月度咨询</div>
                            <div style="font-size: 20px; font-weight: 700; color: var(--apple-success);">¥99<span style="font-size: 12px; font-weight: 400;">/月</span></div>
                        </div>
                        <div style="font-size: 12px; color: var(--apple-gray-3); line-height: 1.6;">• 每月1次一对一咨询<br>• 定制月度饮食方案<br>• 随时在线答疑</div>
                    </div>
                    <div style="padding: 16px; background: linear-gradient(135deg, #fff3e8, #ffe8d6); border-radius: var(--radius-md); border: 2px solid var(--apple-orange); position: relative;">
                        <div style="position: absolute; top: -10px; right: 16px; padding: 3px 10px; background: var(--apple-orange); color: white; font-size: 11px; font-weight: 600; border-radius: var(--radius-full);">推荐</div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <div style="font-size: 15px; font-weight: 600;">季度套餐</div>
                            <div style="font-size: 20px; font-weight: 700; color: var(--apple-orange);">¥259<span style="font-size: 12px; font-weight: 400;">/季</span></div>
                        </div>
                        <div style="font-size: 12px; color: var(--apple-gray-3); line-height: 1.6;">• 每月2次一对一咨询<br>• 每周饮食方案调整<br>• 专属营养师全程跟进</div>
                    </div>
                    <div style="padding: 16px; background: var(--apple-gray-5); border-radius: var(--radius-md);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <div style="font-size: 15px; font-weight: 600;">年度VIP</div>
                            <div style="font-size: 20px; font-weight: 700; color: var(--apple-purple);">¥899<span style="font-size: 12px; font-weight: 400;">/年</span></div>
                        </div>
                        <div style="font-size: 12px; color: var(--apple-gray-3); line-height: 1.6;">• 无限次一对一咨询<br>• 个性化慢病管理<br>• 年度健康体检报告解读</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ========== 健康商城页面 ==========
function renderMallPage() {
    return `
        <div style="padding: 20px; background: var(--apple-gray-6); min-height: 100%;">
            <div style="background: linear-gradient(135deg, var(--apple-purple) 0%, #8a5cde 100%); border-radius: var(--radius-lg); padding: 24px; color: white; margin-bottom: var(--gap-md);">
                <div style="font-size: 18px; font-weight: 600; margin-bottom: 6px;">🛒 健康商城</div>
                <div style="font-size: 13px; opacity: 0.9;">精选健康好物，为长辈的健康保驾护航</div>
                <div style="margin-top: 16px; display: flex; gap: 10px;">
                    <div style="flex: 1; padding: 10px; background: rgba(255,255,255,0.2); backdrop-filter: blur(10px); border-radius: var(--radius-md); text-align: center; font-size: 13px;">智能设备</div>
                    <div style="flex: 1; padding: 10px; background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); border-radius: var(--radius-md); text-align: center; font-size: 13px;">营养补充</div>
                    <div style="flex: 1; padding: 10px; background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); border-radius: var(--radius-md); text-align: center; font-size: 13px;">适老用品</div>
                </div>
            </div>
            
            <div style="background: var(--glass-bg); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-radius: var(--radius-lg); padding: 20px; box-shadow: var(--glass-shadow); margin-bottom: var(--gap-md); border: 1px solid var(--glass-border);">
                <div style="font-size: 17px; font-weight: 600; letter-spacing: -0.02em; margin-bottom: 16px;">⭐ 热门推荐</div>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
                    <div style="background: var(--apple-gray-5); border-radius: var(--radius-md); overflow: hidden;">
                        <div style="height: 100px; background: linear-gradient(135deg, #e8f4ff, #d4eaff); display: flex; align-items: center; justify-content: center; font-size: 48px;">⌚</div>
                        <div style="padding: 12px;">
                            <div style="font-size: 14px; font-weight: 500; margin-bottom: 4px;">智能手环</div>
                            <div style="font-size: 12px; color: var(--apple-gray-4); margin-bottom: 8px;">心率监测 / 睡眠追踪</div>
                            <div style="font-size: 16px; font-weight: 700; color: var(--apple-danger);">¥299</div>
                        </div>
                    </div>
                    <div style="background: var(--apple-gray-5); border-radius: var(--radius-md); overflow: hidden;">
                        <div style="height: 100px; background: linear-gradient(135deg, #ffe8e8, #ffd4d4); display: flex; align-items: center; justify-content: center; font-size: 48px;">🩸</div>
                        <div style="padding: 12px;">
                            <div style="font-size: 14px; font-weight: 500; margin-bottom: 4px;">电子血压计</div>
                            <div style="font-size: 12px; color: var(--apple-gray-4); margin-bottom: 8px;">精准测量 / 语音播报</div>
                            <div style="font-size: 16px; font-weight: 700; color: var(--apple-danger);">¥199</div>
                        </div>
                    </div>
                    <div style="background: var(--apple-gray-5); border-radius: var(--radius-md); overflow: hidden;">
                        <div style="height: 100px; background: linear-gradient(135deg, #fff8e8, #fff0cc); display: flex; align-items: center; justify-content: center; font-size: 48px;">🩺</div>
                        <div style="padding: 12px;">
                            <div style="font-size: 14px; font-weight: 500; margin-bottom: 4px;">血糖仪</div>
                            <div style="font-size: 12px; color: var(--apple-gray-4); margin-bottom: 8px;">免调码 / 微量采血</div>
                            <div style="font-size: 16px; font-weight: 700; color: var(--apple-danger);">¥259</div>
                        </div>
                    </div>
                    <div style="background: var(--apple-gray-5); border-radius: var(--radius-md); overflow: hidden;">
                        <div style="height: 100px; background: linear-gradient(135deg, #e8fbf0, #d4f5e0); display: flex; align-items: center; justify-content: center; font-size: 48px;">⚖️</div>
                        <div style="padding: 12px;">
                            <div style="font-size: 14px; font-weight: 500; margin-bottom: 4px;">智能体重秤</div>
                            <div style="font-size: 12px; color: var(--apple-gray-4); margin-bottom: 8px;">体脂分析 / 数据同步</div>
                            <div style="font-size: 16px; font-weight: 700; color: var(--apple-danger);">¥149</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div style="background: var(--glass-bg); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-radius: var(--radius-lg); padding: 20px; box-shadow: var(--glass-shadow); margin-bottom: var(--gap-md); border: 1px solid var(--glass-border);">
                <div style="font-size: 17px; font-weight: 600; letter-spacing: -0.02em; margin-bottom: 16px;">💊 营养补充</div>
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    <div style="display: flex; gap: 14px; padding: 12px; background: var(--apple-gray-5); border-radius: var(--radius-md);">
                        <div style="width: 64px; height: 64px; border-radius: var(--radius-md); background: linear-gradient(135deg, #fff8e8, #fff0cc); display: flex; align-items: center; justify-content: center; font-size: 32px; flex-shrink: 0;">💊</div>
                        <div style="flex: 1;">
                            <div style="font-size: 14px; font-weight: 500; margin-bottom: 4px;">中老年钙片</div>
                            <div style="font-size: 12px; color: var(--apple-gray-4); margin-bottom: 6px;">补钙健骨 / 维生素D</div>
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div style="font-size: 16px; font-weight: 700; color: var(--apple-danger);">¥89</div>
                                <button style="padding: 6px 14px; background: var(--apple-blue); color: white; border: none; border-radius: var(--radius-full); font-size: 12px; font-weight: 500; cursor: pointer; font-family: inherit;">购买</button>
                            </div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 14px; padding: 12px; background: var(--apple-gray-5); border-radius: var(--radius-md);">
                        <div style="width: 64px; height: 64px; border-radius: var(--radius-md); background: linear-gradient(135deg, #f0e8ff, #e0d4ff); display: flex; align-items: center; justify-content: center; font-size: 32px; flex-shrink: 0;">🐟</div>
                        <div style="flex: 1;">
                            <div style="font-size: 14px; font-weight: 500; margin-bottom: 4px;">深海鱼油</div>
                            <div style="font-size: 12px; color: var(--apple-gray-4); margin-bottom: 6px;">Omega-3 / 护心脑</div>
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div style="font-size: 16px; font-weight: 700; color: var(--apple-danger);">¥159</div>
                                <button style="padding: 6px 14px; background: var(--apple-blue); color: white; border: none; border-radius: var(--radius-full); font-size: 12px; font-weight: 500; cursor: pointer; font-family: inherit;">购买</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ========== 设置页面 ==========
function renderSettingsPage() {
    return `
        <div style="padding: 20px; background: var(--apple-gray-6); min-height: 100%;">
            <div style="background: var(--glass-bg); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-radius: var(--radius-lg); padding: 20px; box-shadow: var(--glass-shadow); margin-bottom: var(--gap-md); border: 1px solid var(--glass-border);">
                <div style="font-size: 17px; font-weight: 600; letter-spacing: -0.02em; margin-bottom: 16px;">👤 个人信息</div>
                <div style="display: flex; align-items: center; gap: 16px; padding-bottom: 16px; border-bottom: 1px solid rgba(0,0,0,0.08);">
                    <div style="width: 60px; height: 60px; border-radius: var(--radius-full); background: linear-gradient(135deg, var(--apple-blue), var(--apple-purple)); display: flex; align-items: center; justify-content: center; font-size: 30px; flex-shrink: 0;">👴</div>
                    <div style="flex: 1;">
                        <div style="font-size: 17px; font-weight: 600;">张爷爷</div>
                        <div style="font-size: 13px; color: var(--apple-gray-4); margin-top: 4px;">138****1234</div>
                    </div>
                    <div style="color: var(--apple-gray-4); font-size: 18px;">›</div>
                </div>
                <div style="display: flex; flex-direction: column; gap: 2px; margin-top: 12px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 0; border-bottom: 1px solid rgba(0,0,0,0.05);">
                        <span style="font-size: 15px;">性别</span>
                        <span style="font-size: 14px; color: var(--apple-gray-4);">男 ›</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 0; border-bottom: 1px solid rgba(0,0,0,0.05);">
                        <span style="font-size: 15px;">年龄</span>
                        <span style="font-size: 14px; color: var(--apple-gray-4);">68岁 ›</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 0;">
                        <span style="font-size: 15px;">身高 / 体重</span>
                        <span style="font-size: 14px; color: var(--apple-gray-4);">170cm / 65kg ›</span>
                    </div>
                </div>
            </div>
            
            <div style="background: var(--glass-bg); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-radius: var(--radius-lg); padding: 20px; box-shadow: var(--glass-shadow); margin-bottom: var(--gap-md); border: 1px solid var(--glass-border);">
                <div style="font-size: 17px; font-weight: 600; letter-spacing: -0.02em; margin-bottom: 12px;">🏥 健康档案</div>
                <div style="display: flex; flex-direction: column; gap: 2px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 0; border-bottom: 1px solid rgba(0,0,0,0.05);">
                        <span style="font-size: 15px;">慢性疾病</span>
                        <span style="font-size: 14px; color: var(--apple-danger);">高血压、糖尿病 ›</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 0; border-bottom: 1px solid rgba(0,0,0,0.05);">
                        <span style="font-size: 15px;">过敏食物</span>
                        <span style="font-size: 14px; color: var(--apple-gray-4);">海鲜 ›</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 0;">
                        <span style="font-size: 15px;">用药情况</span>
                        <span style="font-size: 14px; color: var(--apple-gray-4);">查看 ›</span>
                    </div>
                </div>
            </div>
            
            <div style="background: var(--glass-bg); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-radius: var(--radius-lg); padding: 20px; box-shadow: var(--glass-shadow); margin-bottom: var(--gap-md); border: 1px solid var(--glass-border);">
                <div style="font-size: 17px; font-weight: 600; letter-spacing: -0.02em; margin-bottom: 12px;">⚙️ 应用设置</div>
                <div style="display: flex; flex-direction: column; gap: 2px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 0; border-bottom: 1px solid rgba(0,0,0,0.05);">
                        <span style="font-size: 15px;">字体大小</span>
                        <span style="font-size: 14px; color: var(--apple-gray-4);">大字模式 ›</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 0; border-bottom: 1px solid rgba(0,0,0,0.05);">
                        <span style="font-size: 15px;">语音播报</span>
                        <div style="width: 44px; height: 26px; background: var(--apple-blue); border-radius: var(--radius-full); position: relative;">
                            <div style="position: absolute; right: 3px; top: 3px; width: 20px; height: 20px; background: white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.15);"></div>
                        </div>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 0; border-bottom: 1px solid rgba(0,0,0,0.05);">
                        <span style="font-size: 15px;">消息提醒</span>
                        <div style="width: 44px; height: 26px; background: var(--apple-blue); border-radius: var(--radius-full); position: relative;">
                            <div style="position: absolute; right: 3px; top: 3px; width: 20px; height: 20px; background: white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.15);"></div>
                        </div>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 0;">
                        <span style="font-size: 15px;">深色模式</span>
                        <div style="width: 44px; height: 26px; background: rgba(120, 120, 128, 0.16); border-radius: var(--radius-full); position: relative;">
                            <div style="position: absolute; left: 3px; top: 3px; width: 20px; height: 20px; background: white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.15);"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ========== 个人中心页面 ==========
function renderProfilePage() {
    return `
        <div style="padding: 20px; background: var(--apple-gray-6); min-height: 100%;">
            <div style="background: linear-gradient(180deg, var(--apple-blue) 0%, #4a90d9 100%); margin: -20px -20px 20px; padding: 40px 20px 60px; color: white;">
                <div style="display: flex; align-items: center; gap: 16px;">
                    <div style="width: 72px; height: 72px; border-radius: var(--radius-full); background: rgba(255,255,255,0.25); border: 3px solid rgba(255,255,255,0.4); display: flex; align-items: center; justify-content: center; font-size: 36px; flex-shrink: 0;">👴</div>
                    <div style="flex: 1;">
                        <div style="font-size: 22px; font-weight: 700; letter-spacing: -0.02em;">张爷爷</div>
                        <div style="font-size: 14px; opacity: 0.9; margin-top: 4px;">138****1234</div>
                        <div style="display: inline-flex; align-items: center; gap: 4px; margin-top: 8px; padding: 4px 12px; background: rgba(255,255,255,0.2); border-radius: var(--radius-full); font-size: 12px;">
                            <span>⭐</span> VIP会员
                        </div>
                    </div>
                    <div style="font-size: 24px; opacity: 0.8;">›</div>
                </div>
            </div>
            
            <div style="background: var(--glass-bg); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-radius: var(--radius-lg); padding: 20px; box-shadow: var(--glass-shadow); margin-top: -40px; margin-bottom: var(--gap-md); border: 1px solid var(--glass-border);">
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; text-align: center;">
                    <div>
                        <div style="font-size: 22px; font-weight: 700; color: var(--apple-gray-1);">78</div>
                        <div style="font-size: 12px; color: var(--apple-gray-4); margin-top: 2px;">健康评分</div>
                    </div>
                    <div style="border-left: 1px solid rgba(0,0,0,0.08); border-right: 1px solid rgba(0,0,0,0.08);">
                        <div style="font-size: 22px; font-weight: 700; color: var(--apple-blue);">28</div>
                        <div style="font-size: 12px; color: var(--apple-gray-4); margin-top: 2px;">打卡天数</div>
                    </div>
                    <div>
                        <div style="font-size: 22px; font-weight: 700; color: var(--apple-orange);">1280</div>
                        <div style="font-size: 12px; color: var(--apple-gray-4); margin-top: 2px;">健康积分</div>
                    </div>
                </div>
            </div>
            
            <div style="background: var(--glass-bg); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-radius: var(--radius-lg); padding: 20px; box-shadow: var(--glass-shadow); margin-bottom: var(--gap-md); border: 1px solid var(--glass-border);">
                <div style="display: flex; flex-direction: column; gap: 2px;">
                    <div style="display: flex; align-items: center; gap: 14px; padding: 14px 0; border-bottom: 1px solid rgba(0,0,0,0.05); cursor: pointer;">
                        <div style="width: 36px; height: 36px; border-radius: var(--radius-sm); background: linear-gradient(135deg, #e8fbf0, #d4f5e0); display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0;">📊</div>
                        <div style="flex: 1; font-size: 15px;">健康报告</div>
                        <div style="color: var(--apple-gray-4); font-size: 18px;">›</div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 14px; padding: 14px 0; border-bottom: 1px solid rgba(0,0,0,0.05); cursor: pointer;">
                        <div style="width: 36px; height: 36px; border-radius: var(--radius-sm); background: linear-gradient(135deg, #e8f4ff, #d4eaff); display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0;">👨‍👩‍👧</div>
                        <div style="flex: 1; font-size: 15px;">家庭成员</div>
                        <div style="color: var(--apple-gray-4); font-size: 18px;">›</div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 14px; padding: 14px 0; border-bottom: 1px solid rgba(0,0,0,0.05); cursor: pointer;">
                        <div style="width: 36px; height: 36px; border-radius: var(--radius-sm); background: linear-gradient(135deg, #fff3e8, #ffe8d6); display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0;">👩‍⚕️</div>
                        <div style="flex: 1; font-size: 15px;">我的营养师</div>
                        <div style="color: var(--apple-gray-4); font-size: 18px;">›</div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 14px; padding: 14px 0; border-bottom: 1px solid rgba(0,0,0,0.05); cursor: pointer;">
                        <div style="width: 36px; height: 36px; border-radius: var(--radius-sm); background: linear-gradient(135deg, #f0e8ff, #e0d4ff); display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0;">📱</div>
                        <div style="flex: 1; font-size: 15px;">我的设备</div>
                        <div style="color: var(--apple-gray-4); font-size: 18px;">›</div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 14px; padding: 14px 0; cursor: pointer;">
                        <div style="width: 36px; height: 36px; border-radius: var(--radius-sm); background: linear-gradient(135deg, #fff8e8, #fff0cc); display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0;">📦</div>
                        <div style="flex: 1; font-size: 15px;">我的订单</div>
                        <div style="color: var(--apple-gray-4); font-size: 18px;">›</div>
                    </div>
                </div>
            </div>
            
            <div style="background: var(--glass-bg); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-radius: var(--radius-lg); padding: 20px; box-shadow: var(--glass-shadow); margin-bottom: var(--gap-md); border: 1px solid var(--glass-border);">
                <div style="display: flex; flex-direction: column; gap: 2px;">
                    <div style="display: flex; align-items: center; gap: 14px; padding: 14px 0; border-bottom: 1px solid rgba(0,0,0,0.05); cursor: pointer;">
                        <div style="width: 36px; height: 36px; border-radius: var(--radius-sm); background: linear-gradient(135deg, #e8f4ff, #d4eaff); display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0;">⚙️</div>
                        <div style="flex: 1; font-size: 15px;">设置</div>
                        <div style="color: var(--apple-gray-4); font-size: 18px;">›</div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 14px; padding: 14px 0; border-bottom: 1px solid rgba(0,0,0,0.05); cursor: pointer;">
                        <div style="width: 36px; height: 36px; border-radius: var(--radius-sm); background: linear-gradient(135deg, #e8fbf0, #d4f5e0); display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0;">❓</div>
                        <div style="flex: 1; font-size: 15px;">帮助中心</div>
                        <div style="color: var(--apple-gray-4); font-size: 18px;">›</div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 14px; padding: 14px 0; cursor: pointer;">
                        <div style="width: 36px; height: 36px; border-radius: var(--radius-sm); background: linear-gradient(135deg, #ffe8e8, #ffd4d4); display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0;">📞</div>
                        <div style="flex: 1; font-size: 15px;">联系客服</div>
                        <div style="color: var(--apple-gray-4); font-size: 18px;">›</div>
                    </div>
                </div>
            </div>
            
            <div style="text-align: center; padding: 20px 0; color: var(--apple-gray-4); font-size: 12px;">
                食安伴 v1.0.0
            </div>
        </div>
    `;
}

// ========== 事件绑定 ==========
function bindPageEvents() {
    document.querySelectorAll('[data-nav]').forEach(el => {
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            const target = el.dataset.nav;
            navigateTo(target);
        });
    });
    
    document.querySelectorAll('[data-report]').forEach(el => {
        el.addEventListener('click', () => {
            reportType = el.dataset.report;
            renderPage('report');
        });
    });
    
    document.querySelectorAll('.recipe-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.classList.contains('recipe-change-btn')) {
                handleRecipeChange(e.target, card);
                return;
            }
            const recipeId = parseInt(card.dataset.recipeId);
            navigateTo('recipeDetail', { recipeId });
        });
    });
    
    const recordBtn = document.getElementById('recordBtn');
    if (recordBtn) {
        recordBtn.addEventListener('click', toggleRecording);
    }
    
    document.querySelectorAll('.ingredient-buy-btn, .buy-all-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            navigateTo('community');
        });
    });
    
    const syncDevicesBtn = document.getElementById('syncDevicesBtn');
    if (syncDevicesBtn) {
        syncDevicesBtn.addEventListener('click', syncDevices);
    }
    
    const deviceAiLink = document.getElementById('deviceAiLink');
    if (deviceAiLink) {
        deviceAiLink.addEventListener('click', () => navigateTo('recipe'));
    }
    
    const aiApplyBtn = document.getElementById('aiApplyBtn');
    if (aiApplyBtn) {
        aiApplyBtn.addEventListener('click', () => {
            aiApplyBtn.innerHTML = '⏳ 正在调整...';
            aiApplyBtn.disabled = true;
            setTimeout(() => {
                aiApplyBtn.innerHTML = '✅ 已调整晚餐食谱';
                aiApplyBtn.style.background = 'var(--apple-success)';
                setTimeout(() => {
                    navigateTo('recipe');
                }, 1500);
            }, 1500);
        });
    }
    
    const aiRefreshBtn = document.getElementById('aiRefreshBtn');
    if (aiRefreshBtn) {
        aiRefreshBtn.addEventListener('click', refreshAiAnalysis);
    }
}

function toggleRecording() {
    isRecording = !isRecording;
    const recordBtn = document.getElementById('recordBtn');
    const voiceStatus = document.getElementById('voiceStatus');
    
    if (isRecording) {
        recordBtn.classList.add('recording');
        voiceStatus.textContent = '正在聆听...';
        setTimeout(() => {
            if (isRecording) {
                isRecording = false;
                recordBtn.classList.remove('recording');
                voiceStatus.textContent = '识别完成 ✅';
            }
        }, 3000);
    } else {
        recordBtn.classList.remove('recording');
        voiceStatus.textContent = '点击开始说话';
    }
}

function syncDevices() {
    const btn = document.getElementById('syncDevicesBtn');
    if (!btn) return;
    
    btn.classList.add('loading');
    btn.innerHTML = '<span>⏳</span> 正在同步设备...';
    
    setTimeout(() => {
        btn.classList.remove('loading');
        btn.classList.add('success');
        btn.innerHTML = '<span>✅</span> 同步成功';
        
        const scoreNum = document.querySelector('.score-num');
        if (scoreNum) {
            scoreNum.textContent = '85';
        }
        
        const scoreDesc = document.querySelector('.score-desc');
        if (scoreDesc) {
            scoreDesc.textContent = '设备数据已更新，AI正在分析...';
        }
        
        setTimeout(() => {
            btn.classList.remove('success');
            btn.innerHTML = '<span>🔗</span> 获取设备数据';
            navigateTo('recipe');
        }, 2000);
    }, 2500);
}

function refreshAiAnalysis() {
    const btn = document.getElementById('aiRefreshBtn');
    if (!btn) return;
    
    btn.innerHTML = '<span>⏳</span> AI正在分析...';
    btn.disabled = true;
    
    setTimeout(() => {
        btn.innerHTML = '<span>✅</span> 分析完成';
        setTimeout(() => {
            btn.innerHTML = '<span>🔄</span> 重新分析';
            btn.disabled = false;
        }, 1500);
    }, 2000);
}

function handleRecipeChange(changeBtn, card) {
    const recipeId = parseInt(card.dataset.recipeId);
    
    let mealType = '';
    for (const [type, meal] of Object.entries(recipeData)) {
        const found = meal.items.find(item => item.id === recipeId);
        if (found) {
            mealType = type;
            break;
        }
    }
    
    if (!mealType || !recipeData[mealType].alternatives || recipeData[mealType].alternatives.length === 0) {
        return;
    }
    
    const alternatives = recipeData[mealType].alternatives;
    const randomIndex = Math.floor(Math.random() * alternatives.length);
    const newRecipe = alternatives[randomIndex];
    
    const imgEl = card.querySelector('.recipe-img');
    const nameEl = card.querySelector('.recipe-name');
    const descEl = card.querySelector('.recipe-desc');
    const tagEl = card.querySelector('.recipe-tag');
    const proteinEl = card.querySelector('.recipe-nutri-tag:nth-child(1)');
    const fatEl = card.querySelector('.recipe-nutri-tag:nth-child(2)');
    
    card.style.opacity = '0.5';
    
    setTimeout(() => {
        if (tagEl) tagEl.textContent = newRecipe.tag;
        if (nameEl) nameEl.textContent = newRecipe.name;
        if (descEl) descEl.textContent = newRecipe.desc;
        if (proteinEl) proteinEl.textContent = `蛋白质 ${newRecipe.nutri.protein}`;
        if (fatEl) fatEl.textContent = `脂肪 ${newRecipe.nutri.fat}`;
        card.dataset.recipeId = newRecipe.id;
        card.style.opacity = '1';
    }, 300);
}

// 导航按钮
navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        navigateTo(btn.dataset.page);
    });
});

// TabBar
tabItems.forEach(item => {
    item.addEventListener('click', () => {
        const tab = item.dataset.tab;
        const pageMap = {
            home: 'home',
            recipe: 'recipe',
            report: 'report',
            profile: 'profile'
        };
        navigateTo(pageMap[tab] || 'home');
    });
});

// 返回按钮
iosNavBack.addEventListener('click', () => {
    navigateTo('home');
});

// 字体大小
fontButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        fontSizeMode = btn.dataset.size;
        fontButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.body.classList.remove('font-normal', 'font-large', 'font-xlarge');
        document.body.classList.add(`font-${fontSizeMode}`);
    });
});

// 初始化
document.body.classList.add('font-large');
navigateTo('home');
