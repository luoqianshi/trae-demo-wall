// 模拟路线数据
const routes = [
    {
        id: 'route_001',
        name: '奥林匹克森林公园南园环线',
        description: '北京城市绿肺，适合亲子家庭的轻松徒步路线，路面平整，景色宜人',
        fullDescription: '奥林匹克森林公园是北京最大的城市公园之一，南园环线是最受欢迎的徒步路线。沿途可以欣赏到人工湖、湿地、森林等多种自然景观，路面平整宽阔，非常适合亲子家庭和徒步新手。春季可赏花，夏季可避暑，秋季可观叶，冬季可赏雪，四季皆宜。',
        difficulty: 'family',
        difficultyText: '亲子级',
        distance: 5.2,
        elevationGain: 45,
        elevationLoss: 45,
        estimatedTime: 90,
        startPoint: { name: '南园正门', coords: '40.0123, 116.3896' },
        endPoint: { name: '南园正门', coords: '40.0123, 116.3896' },
        features: ['城市公园', '湖泊景观', '儿童友好', '无障碍'],
        images: [
            'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1518173946687-a4c036bc3c95?w=800&h=600&fit=crop'
        ],
        highlights: [
            { name: '奥海', description: '公园中心的人工湖，可租船游览', distance: '1.5km' },
            { name: '湿地观鸟区', description: '观鸟爱好者的天堂，常见野鸭、白鹭等', distance: '2.8km' },
            { name: '仰山', description: '公园制高点，可俯瞰整个奥森公园', distance: '4.2km' }
        ],
        equipment: ['舒适运动鞋', '饮用水', '防晒用品', '相机'],
        tips: ['建议周末早上去，人少景美', '公园内有多个饮水点和洗手间', '可携带宠物（需牵绳）', '停车场充足，建议南门停车'],
        warnings: ['夏季注意防蚊虫', '雨天部分路段可能湿滑', '注意公园开放时间'],
        isFamilyFriendly: true,
        hasToilet: true,
        hasWaterSupply: true,
        isDownloaded: false
    },
    {
        id: 'route_002',
        name: '香山公园东门-香炉峰',
        description: '经典登山路线，秋季赏红叶绝佳去处，适合有一定体力的徒步爱好者',
        fullDescription: '香山公园是北京最著名的赏红叶胜地，香炉峰是香山的主峰，海拔557米。这条路线从东门出发，经过勤政殿、玉华岫等景点，最终到达香炉峰顶。沿途可以欣赏到皇家园林建筑和自然风光，秋季红叶满山，景色壮观。',
        difficulty: 'beginner',
        difficultyText: '入门级',
        distance: 4.8,
        elevationGain: 450,
        elevationLoss: 450,
        estimatedTime: 150,
        startPoint: { name: '香山东门', coords: '39.9925, 116.1886' },
        endPoint: { name: '香炉峰', coords: '40.0023, 116.1958' },
        features: ['山地景观', '历史文化', '秋季红叶', '观景台'],
        images: [
            'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?w=800&h=600&fit=crop'
        ],
        highlights: [
            { name: '勤政殿', description: '清代皇家建筑，现为香山公园博物馆', distance: '0.5km' },
            { name: '玉华岫', description: '观景平台，可远眺北京城区', distance: '2.0km' },
            { name: '香炉峰', description: '香山最高点，360度全景视野', distance: '4.8km' }
        ],
        equipment: ['登山鞋', '登山杖', '充足饮用水', '防风外套', '能量食品'],
        tips: ['秋季赏红叶需提前预约', '建议工作日前往避开人流', '下山可选择缆车', '山顶有茶室可休息'],
        warnings: ['秋季周末人流量极大', '山路较陡，注意安全', '山顶风大，注意保暖'],
        isFamilyFriendly: false,
        hasToilet: true,
        hasWaterSupply: true,
        isDownloaded: true
    },
    {
        id: 'route_003',
        name: '百望山森林公园环线',
        description: '距离适中，爬升平缓，适合新手入门的徒步路线',
        fullDescription: '百望山森林公园位于海淀区，是距离市区最近的山地公园之一。山势平缓，植被茂密，空气清新，是徒步新手的理想选择。登顶后可以俯瞰北京城区全景，天气晴好时甚至能看到远处的西山。',
        difficulty: 'beginner',
        difficultyText: '入门级',
        distance: 6.5,
        elevationGain: 280,
        elevationLoss: 280,
        estimatedTime: 120,
        startPoint: { name: '百望山森林公园东门', coords: '40.0368, 116.2917' },
        endPoint: { name: '百望山森林公园东门', coords: '40.0368, 116.2917' },
        features: ['森林步道', '城市全景', '新手友好', '四季皆宜'],
        images: [
            'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800&h=600&fit=crop'
        ],
        highlights: [
            { name: '望乡亭', description: '半山腰的休息亭，可远眺城市', distance: '1.8km' },
            { name: '友谊亭', description: '山顶观景亭，360度全景', distance: '3.2km' },
            { name: '红叶区', description: '秋季红叶观赏区', distance: '4.5km' }
        ],
        equipment: ['运动鞋或轻便登山鞋', '饮用水', '零食', '相机'],
        tips: ['建议早上前往，空气清新', '公园内有自动售货机', '适合野餐，可携带野餐垫', '冬季雪后景色很美'],
        warnings: ['部分路段无遮挡，夏季注意防晒', '公园内无餐厅，需自备食物', '注意防火期限制'],
        isFamilyFriendly: true,
        hasToilet: true,
        hasWaterSupply: false,
        isDownloaded: false
    },
    {
        id: 'route_004',
        name: '鹫峰-阳台山穿越',
        description: '经典京西穿越路线，风景优美，具有一定挑战性',
        fullDescription: '这是一条经典的京西穿越路线，从鹫峰国家森林公园出发，穿越山脉到达阳台山自然风景区。沿途经过原始森林、山脊小道、古村落遗址，风景优美，野趣十足。路线有一定难度和强度，适合有一定徒步经验的爱好者。',
        difficulty: 'intermediate',
        difficultyText: '进阶级',
        distance: 12.8,
        elevationGain: 890,
        elevationLoss: 720,
        estimatedTime: 300,
        startPoint: { name: '鹫峰国家森林公园', coords: '40.0589, 116.1056' },
        endPoint: { name: '阳台山自然风景区', coords: '40.0723, 116.1289' },
        features: ['山地穿越', '自然风光', '挑战性', '野趣十足'],
        images: [
            'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?w=800&h=600&fit=crop'
        ],
        highlights: [
            { name: '鹫峰主峰', description: '海拔465米，视野开阔', distance: '3.5km' },
            { name: '妙峰古道', description: '历史悠久的山间古道', distance: '6.2km' },
            { name: '阳台山主峰', description: '海拔1278米，京西最高峰之一', distance: '12.8km' }
        ],
        equipment: ['专业登山鞋', '登山杖', '充足饮用水（至少2L）', '防风防雨外套', '能量食品', '急救包', '头灯或手电'],
        tips: ['建议结伴同行，不要单独穿越', '提前下载离线地图', '预留充足时间，建议早上8点前出发', '可在阳台山下方的农家院用餐'],
        warnings: ['部分路段无手机信号', '中途无补给点，需带足水和食物', '天气变化快，注意防雨防风', '部分路段陡峭，注意安全'],
        isFamilyFriendly: false,
        hasToilet: false,
        hasWaterSupply: false,
        isDownloaded: false
    },
    {
        id: 'route_005',
        name: '北京植物园-樱桃沟',
        description: '春季赏花胜地，平缓步道，适合全家出游',
        fullDescription: '北京植物园是集植物科研、科普、游览于一体的综合性植物园。樱桃沟是植物园内的一个自然景区，以水系景观和春季樱花闻名。路线平缓，沿途可欣赏各种植物花卉，是亲子家庭和植物爱好者的理想选择。',
        difficulty: 'family',
        difficultyText: '亲子级',
        distance: 3.2,
        elevationGain: 85,
        elevationLoss: 85,
        estimatedTime: 60,
        startPoint: { name: '北京植物园南门', coords: '39.9928, 116.2067' },
        endPoint: { name: '樱桃沟水源头', coords: '40.0023, 116.2189' },
        features: ['春季赏花', '水系景观', '科普教育', '亲子友好'],
        images: [
            'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1462275646964-a0e3571f4f78?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1518882605630-8eb582f711b7?w=800&h=600&fit=crop'
        ],
        highlights: [
            { name: '温室展览馆', description: '热带雨林、沙漠植物等主题温室', distance: '0.8km' },
            { name: '卧佛寺', description: '唐代古刹，内有铜卧佛', distance: '1.5km' },
            { name: '樱桃沟水源头', description: '清澈溪流，木栈道，水杉林', distance: '3.2km' }
        ],
        equipment: ['舒适运动鞋', '饮用水', '相机', '防晒用品'],
        tips: ['春季赏花需提前预约', '温室需单独购票', '樱桃沟木栈道拍照很美', '可在园内餐厅用餐'],
        warnings: ['春季周末人流量大', '注意保护植物，不要采摘', '部分温室温度较高'],
        isFamilyFriendly: true,
        hasToilet: true,
        hasWaterSupply: true,
        isDownloaded: false
    }
];

// 模拟成就数据
const achievements = [
    {
        id: 'achievement_001',
        name: '徒步新星',
        description: '完成你的第一条徒步路线',
        icon: '⭐',
        progress: 1,
        maxProgress: 1,
        isUnlocked: true,
        reward: '徒步新星'
    },
    {
        id: 'achievement_002',
        name: '十公里达人',
        description: '累计徒步里程达到10公里',
        icon: '👣',
        progress: 6.5,
        maxProgress: 10,
        isUnlocked: false,
        reward: '十公里达人'
    },
    {
        id: 'achievement_003',
        name: '百公里征服者',
        description: '累计徒步里程达到100公里',
        icon: '🏔️',
        progress: 15.6,
        maxProgress: 100,
        isUnlocked: false,
        reward: '百公里征服者'
    },
    {
        id: 'achievement_004',
        name: '路线收藏家',
        description: '完成10条不同的徒步路线',
        icon: '🗺️',
        progress: 3,
        maxProgress: 10,
        isUnlocked: false,
        reward: '路线收藏家'
    },
    {
        id: 'achievement_005',
        name: '千峰攀登者',
        description: '累计爬升达到1000米',
        icon: '📈',
        progress: 320,
        maxProgress: 1000,
        isUnlocked: false,
        reward: '千峰攀登者'
    },
    {
        id: 'achievement_006',
        name: '连续徒步7天',
        description: '连续7天完成徒步活动',
        icon: '📅',
        progress: 2,
        maxProgress: 7,
        isUnlocked: false,
        reward: '坚持者'
    },
    {
        id: 'achievement_007',
        name: '山野探索者',
        description: '完成5条进阶级或高级路线',
        icon: '🧭',
        progress: 0,
        maxProgress: 5,
        isUnlocked: false,
        reward: '山野探索者'
    },
    {
        id: 'achievement_008',
        name: '亲子时光',
        description: '完成5条亲子友好路线',
        icon: '❤️',
        progress: 2,
        maxProgress: 5,
        isUnlocked: false,
        reward: '亲子达人'
    }
];

// 模拟徒步记录
const hikeRecords = [
    {
        id: 'record_001',
        routeName: '奥林匹克森林公园南园环线',
        date: '2024-03-15 09:30',
        distance: 5.2,
        elevationGain: 45,
        duration: 95,
        isCompleted: true
    },
    {
        id: 'record_002',
        routeName: '百望山森林公园环线',
        date: '2024-03-14 08:00',
        distance: 6.5,
        elevationGain: 280,
        duration: 130,
        isCompleted: true
    },
    {
        id: 'record_003',
        routeName: '北京植物园-樱桃沟',
        date: '2024-03-12 10:00',
        distance: 3.2,
        elevationGain: 85,
        duration: 65,
        isCompleted: true
    }
];

// 用户统计
const userStats = {
    totalRoutes: 3,
    totalDistance: 15.6,
    totalElevationGain: 320,
    currentStreak: 2,
    longestStreak: 5
};

// 全局变量
let currentRoute = null;
let isTracking = false;
let trackingInterval = null;
let elapsedSeconds = 0;
let currentDistance = 0;
let currentElevation = 0;
let navigationRoute = null;
let isBreadcrumbVisible = false;
let pageHistory = [];

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    initRouteList();
    initAchievementPage();
    initFilters();
});

// 初始化路线列表
function initRouteList() {
    const routeList = document.getElementById('routeList');
    routeList.innerHTML = '';

    routes.forEach(route => {
        const card = createRouteCard(route);
        routeList.appendChild(card);
    });
}

// 创建路线卡片
function createRouteCard(route) {
    const card = document.createElement('div');
    card.className = 'route-card';
    card.onclick = () => showRouteDetail(route.id);

    const imageUrl = route.images && route.images.length > 0 ? route.images[0] : '';

    card.innerHTML = `
        <div class="card-image">
            ${imageUrl ? 
                `<img src="${imageUrl}" alt="${route.name}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&h=600&fit=crop';">` :
                `<div style="width: 100%; height: 100%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; justify-content: center; align-items: center; color: white; font-size: 48px;">
                    🏔️
                </div>`
            }
            <div class="difficulty-badge ${route.difficulty}">${route.difficultyText}</div>
            ${route.isFamilyFriendly ? '<div class="family-badge">👨‍👩‍👧‍👦 亲子</div>' : ''}
        </div>
        <div class="card-content">
            <h3 class="card-title">${route.name}</h3>
            <p class="card-description">${route.description}</p>
            <div class="card-stats">
                <div class="card-stat">
                    <span>📏</span>
                    <span>${route.distance}公里</span>
                </div>
                <div class="card-stat">
                    <span>⛰️</span>
                    <span>+${route.elevationGain}米</span>
                </div>
                <div class="card-stat">
                    <span>⏱️</span>
                    <span>${Math.round(route.estimatedTime / 60)}小时</span>
                </div>
            </div>
            <div class="card-features">
                ${route.features.slice(0, 3).map(f => `<span class="feature-tag">${f}</span>`).join('')}
            </div>
            ${route.isDownloaded ? '<div class="downloaded-badge">✓ 已离线</div>' : ''}
        </div>
    `;

    return card;
}

// 初始化过滤器
function initFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const filter = this.dataset.filter;
            filterRoutes(filter);
        });
    });

    // 搜索功能
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const query = this.value.toLowerCase();
            searchRoutes(query);
        });
    }
}

// 筛选路线
function filterRoutes(filter) {
    const routeList = document.getElementById('routeList');
    routeList.innerHTML = '';

    let filteredRoutes = routes;

    if (filter === 'family') {
        filteredRoutes = routes.filter(r => r.isFamilyFriendly);
    } else if (filter === 'family-level' || filter === 'beginner' || filter === 'intermediate') {
        filteredRoutes = routes.filter(r => r.difficulty === filter.replace('-', ''));
    }

    filteredRoutes.forEach(route => {
        const card = createRouteCard(route);
        routeList.appendChild(card);
    });
}

// 搜索路线
function searchRoutes(query) {
    const routeList = document.getElementById('routeList');
    routeList.innerHTML = '';

    if (!query) {
        initRouteList();
        return;
    }

    const filteredRoutes = routes.filter(r => 
        r.name.toLowerCase().includes(query) ||
        r.description.toLowerCase().includes(query) ||
        r.features.some(f => f.toLowerCase().includes(query))
    );

    filteredRoutes.forEach(route => {
        const card = createRouteCard(route);
        routeList.appendChild(card);
    });
}

// 显示路线详情
function showRouteDetail(routeId) {
    const route = routes.find(r => r.id === routeId);
    if (!route) return;

    currentRoute = route;

    // 更新面包屑导航
    document.getElementById('breadcrumbRouteName').textContent = route.name;

    // 基本信息更新
    document.getElementById('detailTitle').textContent = route.name;
    document.getElementById('detailDescription').textContent = route.description;
    document.getElementById('detailDistance').textContent = route.distance;
    document.getElementById('detailElevation').textContent = '+' + route.elevationGain;
    document.getElementById('detailTime').textContent = Math.round(route.estimatedTime / 60);
    document.getElementById('detailLoss').textContent = '-' + route.elevationLoss;

    // 详细描述
    const fullDescEl = document.getElementById('detailFullDescription');
    if (fullDescEl && route.fullDescription) {
        fullDescEl.textContent = route.fullDescription;
        fullDescEl.style.display = 'block';
    }

    // 显示景点介绍区域
    const highlightsSection = document.getElementById('highlightsSection');
    if (highlightsSection) {
        highlightsSection.style.display = route.highlights && route.highlights.length > 0 ? 'block' : 'none';
    }

    // 显示装备建议区域
    const equipmentSection = document.getElementById('equipmentSection');
    if (equipmentSection) {
        equipmentSection.style.display = route.equipment && route.equipment.length > 0 ? 'block' : 'none';
    }

    // 显示实用贴士区域
    const tipsSection = document.getElementById('tipsSection');
    if (tipsSection) {
        tipsSection.style.display = route.tips && route.tips.length > 0 ? 'block' : 'none';
    }

    // 显示注意事项区域
    const warningsSection = document.getElementById('warningsSection');
    if (warningsSection) {
        warningsSection.style.display = route.warnings && route.warnings.length > 0 ? 'block' : 'none';
    }

    const difficultyBadge = document.getElementById('detailDifficulty');
    difficultyBadge.textContent = route.difficultyText;
    difficultyBadge.className = 'difficulty-badge ' + route.difficulty;

    const familyBadge = document.getElementById('detailFamilyBadge');
    familyBadge.style.display = route.isFamilyFriendly ? 'block' : 'none';

    // 起终点信息
    document.getElementById('detailStartName').textContent = route.startPoint.name;
    document.getElementById('detailStartCoords').textContent = route.startPoint.coords;
    document.getElementById('detailEndName').textContent = route.endPoint.name;
    document.getElementById('detailEndCoords').textContent = route.endPoint.coords;

    // 特征标签
    const featuresContainer = document.getElementById('detailFeatures');
    featuresContainer.innerHTML = route.features.map(f => `<span class="feature-tag">${f}</span>`).join('');

    // 设施信息
    document.getElementById('detailToilet').textContent = route.hasToilet ? '🚻' : '❌';
    document.getElementById('detailWater').textContent = route.hasWaterSupply ? '💧' : '❌';

    // 图片轮播
    const imageSlider = document.getElementById('imageSlider');
    if (imageSlider && route.images && route.images.length > 0) {
        imageSlider.innerHTML = route.images.map((img, index) => `
            <div class="slider-slide ${index === 0 ? 'active' : ''}">
                <img src="${img}" alt="${route.name} - 图片${index + 1}" 
                     onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&h=600&fit=crop';">
            </div>
        `).join('');

        // 添加轮播指示器
        const sliderIndicators = document.getElementById('sliderIndicators');
        if (sliderIndicators) {
            sliderIndicators.innerHTML = route.images.map((_, index) => `
                <div class="slider-indicator ${index === 0 ? 'active' : ''}" onclick="switchSlide(${index})"></div>
            `).join('');
        }
    }

    // 景点介绍
    const highlightsContainer = document.getElementById('detailHighlights');
    if (highlightsContainer && route.highlights && route.highlights.length > 0) {
        highlightsContainer.innerHTML = route.highlights.map(h => `
            <div class="highlight-item">
                <div class="highlight-distance">${h.distance}</div>
                <div class="highlight-content">
                    <div class="highlight-name">${h.name}</div>
                    <div class="highlight-desc">${h.description}</div>
                </div>
            </div>
        `).join('');
    }

    // 装备建议
    const equipmentContainer = document.getElementById('detailEquipment');
    if (equipmentContainer && route.equipment && route.equipment.length > 0) {
        equipmentContainer.innerHTML = route.equipment.map(e => `
            <div class="equipment-item">
                <span class="equipment-icon">🎒</span>
                <span class="equipment-text">${e}</span>
            </div>
        `).join('');
    }

    // 实用贴士
    const tipsContainer = document.getElementById('detailTips');
    if (tipsContainer && route.tips && route.tips.length > 0) {
        tipsContainer.innerHTML = route.tips.map(t => `
            <div class="tip-item">
                <span class="tip-icon">💡</span>
                <span class="tip-text">${t}</span>
            </div>
        `).join('');
    }

    // 注意事项
    const warningsContainer = document.getElementById('detailWarnings');
    if (warningsContainer && route.warnings && route.warnings.length > 0) {
        warningsContainer.innerHTML = route.warnings.map(w => `
            <div class="warning-item">
                <span class="warning-icon">⚠️</span>
                <span class="warning-text">${w}</span>
            </div>
        `).join('');
    }

    // 下载按钮状态
    const downloadBtn = document.getElementById('downloadBtn');
    const downloadText = document.getElementById('downloadText');
    if (route.isDownloaded) {
        downloadBtn.classList.add('downloaded');
        downloadText.textContent = '删除离线数据';
    } else {
        downloadBtn.classList.remove('downloaded');
        downloadText.textContent = '下载离线数据';
    }

    showPage('routeDetailPage');
}

// 图片轮播切换
let currentSlideIndex = 0;
function switchSlide(index) {
    const slides = document.querySelectorAll('.slider-slide');
    const indicators = document.querySelectorAll('.slider-indicator');
    
    slides.forEach((slide, i) => {
        slide.classList.toggle('active', i === index);
    });
    
    indicators.forEach((indicator, i) => {
        indicator.classList.toggle('active', i === index);
    });
    
    currentSlideIndex = index;
}

// 前一张图片
function prevSlide() {
    if (!currentRoute || !currentRoute.images) return;
    currentSlideIndex = (currentSlideIndex - 1 + currentRoute.images.length) % currentRoute.images.length;
    switchSlide(currentSlideIndex);
}

// 后一张图片
function nextSlide() {
    if (!currentRoute || !currentRoute.images) return;
    currentSlideIndex = (currentSlideIndex + 1) % currentRoute.images.length;
    switchSlide(currentSlideIndex);
}

// 自动轮播
function autoSlide() {
    if (currentRoute && currentRoute.images && currentRoute.images.length > 1) {
        currentSlideIndex = (currentSlideIndex + 1) % currentRoute.images.length;
        switchSlide(currentSlideIndex);
    }
}

// 下载GPX轨迹文件
function downloadGPX() {
    if (!currentRoute) return;

    showLoading();

    // 模拟生成GPX文件内容
    const gpxContent = generateGPXContent(currentRoute);

    setTimeout(() => {
        hideLoading();
        
        // 创建Blob并下载
        const blob = new Blob([gpxContent], { type: 'application/gpx+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentRoute.name}.gpx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast('GPX轨迹文件下载成功！');
    }, 1000);
}

// 生成GPX文件内容
function generateGPXContent(route) {
    const now = new Date().toISOString();
    return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="齐步走APP" xmlns="http://www.topografix.com/GPX/1/1">
    <metadata>
        <name>${route.name}</name>
        <desc>${route.description}</desc>
        <time>${now}</time>
        <author>
            <name>齐步走APP</name>
        </author>
    </metadata>
    <trk>
        <name>${route.name}</name>
        <desc>${route.fullDescription || route.description}</desc>
        <type>Hiking</type>
        <trkseg>
            <trkpt lat="${route.startPoint.coords.split(',')[0]}" lon="${route.startPoint.coords.split(',')[1]}">
                <name>${route.startPoint.name}</name>
                <sym>Trail Head</sym>
            </trkpt>
            ${route.highlights ? route.highlights.map(h => {
                const coords = h.distance ? `${40 + Math.random() * 0.1},${116 + Math.random() * 0.1}` : '';
                return coords ? `
            <trkpt lat="${coords.split(',')[0]}" lon="${coords.split(',')[1]}">
                <name>${h.name}</name>
                <desc>${h.description}</desc>
            </trkpt>` : '';
            }).join('') : ''}
            <trkpt lat="${route.endPoint.coords.split(',')[0]}" lon="${route.endPoint.coords.split(',')[1]}">
                <name>${route.endPoint.name}</name>
                <sym>Trail End</sym>
            </trkpt>
        </trkseg>
    </trk>
</gpx>`;
}

// 切换下载状态
function toggleDownload() {
    if (!currentRoute) return;

    const downloadBtn = document.getElementById('downloadBtn');
    const downloadText = document.getElementById('downloadText');

    if (!currentRoute.isDownloaded) {
        // 模拟下载过程
        showLoading();
        downloadBtn.disabled = true;
        
        setTimeout(() => {
            currentRoute.isDownloaded = true;
            downloadBtn.classList.add('downloaded');
            downloadText.textContent = '删除离线数据';
            hideLoading();
            downloadBtn.disabled = false;
            showToast('离线数据下载完成！');
        }, 1500);
    } else {
        currentRoute.isDownloaded = false;
        downloadBtn.classList.remove('downloaded');
        downloadText.textContent = '下载离线数据';
        showToast('离线数据已删除');
    }
}

// 显示加载提示
function showLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

// 隐藏加载提示
function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

// 显示通知面板
function showNotification() {
    document.getElementById('notificationOverlay').style.display = 'flex';
}

// 关闭通知面板
function closeNotification() {
    document.getElementById('notificationOverlay').style.display = 'none';
}

// 显示导航菜单
function showNavMenu() {
    document.getElementById('menuOverlay').style.display = 'flex';
}

// 关闭导航菜单
function closeNavMenu() {
    document.getElementById('menuOverlay').style.display = 'none';
}

// 分享路线
function shareRoute() {
    closeNavMenu();
    showToast('分享链接已复制到剪贴板');
}

// 保存路线
function saveRoute() {
    closeNavMenu();
    showToast('路线已收藏');
}

// 报告问题
function reportIssue() {
    closeNavMenu();
    showToast('感谢您的反馈');
}

// 确认退出导航
function confirmExitNavigation() {
    showConfirmDialog('确认退出导航', '退出后将停止记录本次徒步数据，确定要退出吗？', function() {
        endHiking();
    });
}

// 确认结束徒步
function confirmEndHiking() {
    showConfirmDialog('确认结束徒步', '结束后将保存本次徒步记录，确定要结束吗？', function() {
        endHiking();
    });
}

// 显示确认对话框
function showConfirmDialog(title, message, onConfirm) {
    document.getElementById('dialogTitle').textContent = title;
    document.getElementById('dialogMessage').textContent = message;
    document.getElementById('dialogOverlay').style.display = 'flex';

    const confirmBtn = document.getElementById('dialogConfirm');
    const cancelBtn = document.getElementById('dialogCancel');

    // 清除之前的事件监听
    confirmBtn.onclick = null;
    cancelBtn.onclick = null;

    confirmBtn.onclick = function() {
        document.getElementById('dialogOverlay').style.display = 'none';
        if (onConfirm) onConfirm();
    };

    cancelBtn.onclick = function() {
        document.getElementById('dialogOverlay').style.display = 'none';
    };
}

// 收藏路线
function toggleFavorite() {
    const actionBtn = document.querySelector('.breadcrumb-action');
    
    if (actionBtn.classList.contains('favorited')) {
        actionBtn.classList.remove('favorited');
        showToast('已取消收藏');
    } else {
        actionBtn.classList.add('favorited');
        showToast('已添加收藏');
    }
}

// 开始徒步
function startHiking() {
    if (!currentRoute) return;
    
    navigationRoute = currentRoute;
    elapsedSeconds = 0;
    currentDistance = 0;
    currentElevation = 0;

    document.getElementById('navRouteName').textContent = navigationRoute.name;
    document.getElementById('navRouteDetail').textContent = 
        `总距离: ${navigationRoute.distance}公里 | 预计用时: ${Math.round(navigationRoute.estimatedTime / 60)}小时`;
    document.getElementById('navRemaining').textContent = navigationRoute.distance.toFixed(2) + ' 公里';

    showPage('navigationPage');
    startTracking();
}

// 开始追踪
function startTracking() {
    isTracking = true;
    document.getElementById('controlText').textContent = '暂停追踪';

    trackingInterval = setInterval(() => {
        if (isTracking) {
            elapsedSeconds++;
            
            // 模拟位置更新
            currentDistance += 0.05 + Math.random() * 0.1;
            currentElevation += Math.random() * 2;

            updateNavigationDisplay();

            // 检查是否到达终点
            if (currentDistance >= navigationRoute.distance) {
                handleArrival();
            }
        }
    }, 1000);
}

// 更新导航显示
function updateNavigationDisplay() {
    document.getElementById('navDistance').textContent = currentDistance.toFixed(2) + ' 公里';
    
    const remaining = Math.max(0, navigationRoute.distance - currentDistance);
    document.getElementById('navRemaining').textContent = remaining.toFixed(2) + ' 公里';

    const hours = Math.floor(elapsedSeconds / 3600);
    const minutes = Math.floor((elapsedSeconds % 3600) / 60);
    const seconds = elapsedSeconds % 60;
    
    let timeStr;
    if (hours > 0) {
        timeStr = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
        timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    document.getElementById('navTime').textContent = timeStr;

    document.getElementById('navElevation').textContent = '+' + Math.round(currentElevation) + '米';
}

// 切换追踪状态
function toggleTracking() {
    const controlText = document.getElementById('controlText');
    
    if (isTracking) {
        isTracking = false;
        controlText.textContent = '继续追踪';
    } else {
        isTracking = true;
        controlText.textContent = '暂停追踪';
    }
}

// 到达终点
function handleArrival() {
    if (trackingInterval) {
        clearInterval(trackingInterval);
        trackingInterval = null;
    }

    alert('恭喜到达终点！\n\n您已完成本次徒步，距离：' + currentDistance.toFixed(2) + '公里，用时：' + formatTime(elapsedSeconds));
    
    // 更新统计数据
    userStats.totalRoutes++;
    userStats.totalDistance += currentDistance;
    userStats.totalElevationGain += currentElevation;

    // 添加新记录
    hikeRecords.unshift({
        id: 'record_' + Date.now(),
        routeName: navigationRoute.name,
        date: new Date().toLocaleString(),
        distance: currentDistance,
        elevationGain: currentElevation,
        duration: Math.floor(elapsedSeconds / 60),
        isCompleted: true
    });

    initAchievementPage();
}

// 结束徒步
function endHiking() {
    if (trackingInterval) {
        clearInterval(trackingInterval);
        trackingInterval = null;
    }

    if (confirm('确定要结束本次徒步吗？')) {
        showPage('routeLibraryPage');
    }
}

// 格式化时间
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
        return `${hours}小时${minutes}分钟`;
    }
    return `${minutes}分钟${secs}秒`;
}

// 显示页面
function showPage(pageId) {
    // 添加当前页面到历史记录（排除导航页面）
    const currentActivePage = document.querySelector('.page:not(.hidden)');
    if (currentActivePage && currentActivePage.id !== 'navigationPage') {
        pageHistory.push(currentActivePage.id);
    }

    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.add('hidden'));
    
    const targetPage = document.getElementById(pageId);
    targetPage.classList.remove('hidden');

    // 更新底部导航
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        if (item.dataset.page === pageId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // 隐藏/显示底部导航
    const bottomNav = document.getElementById('bottomNav');
    if (pageId === 'navigationPage') {
        bottomNav.style.display = 'none';
    } else {
        bottomNav.style.display = 'flex';
    }

    // 添加页面切换动画
    targetPage.style.animation = 'pageFadeIn 0.3s ease-out';
}

// 返回上一页
function navigateBack() {
    if (pageHistory.length > 0) {
        const previousPage = pageHistory.pop();
        showPage(previousPage);
        showToast('返回成功');
    } else {
        // 默认返回首页
        showPage('routeLibraryPage');
        pageHistory = [];
    }
}

// 切换面包屑轨迹显示
function toggleBreadcrumbTrail() {
    isBreadcrumbVisible = !isBreadcrumbVisible;
    const btn = document.querySelector('.breadcrumb-toggle-btn');
    
    if (isBreadcrumbVisible) {
        btn.classList.add('active');
        showToast('已显示轨迹');
    } else {
        btn.classList.remove('active');
        showToast('已隐藏轨迹');
    }
}

// 显示Toast提示
function showToast(message) {
    const toastOverlay = document.getElementById('toastOverlay');
    const toastContent = document.getElementById('toastContent');
    
    toastContent.textContent = message;
    toastOverlay.style.display = 'flex';
    
    setTimeout(() => {
        toastOverlay.style.display = 'none';
    }, 2000);
}

// 初始化成就页面
function initAchievementPage() {
    // 更新统计数据
    document.getElementById('totalRoutes').textContent = userStats.totalRoutes;
    document.getElementById('totalDistance').textContent = userStats.totalDistance.toFixed(1);
    document.getElementById('totalElevation').textContent = userStats.totalElevationGain;
    document.getElementById('currentStreak').textContent = userStats.currentStreak;

    // 渲染成就进度
    const progressContainer = document.getElementById('achievementProgress');
    progressContainer.innerHTML = achievements.slice(0, 4).map(a => `
        <div class="achievement-progress-item">
            <div class="achievement-progress-header">
                <span class="achievement-progress-name">${a.name}</span>
                <span class="achievement-progress-text">${a.progress}/${a.maxProgress}</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${(a.progress / a.maxProgress) * 100}%"></div>
            </div>
            <div class="achievement-progress-description">${a.description}</div>
        </div>
    `).join('');

    // 渲染最近记录
    const recentRecords = document.getElementById('recentRecords');
    if (hikeRecords.length === 0) {
        recentRecords.innerHTML = `
            <div class="empty-container">
                <div class="empty-text">还没有徒步记录</div>
                <div class="empty-subtext">开始你的第一次徒步吧！</div>
            </div>
        `;
    } else {
        recentRecords.innerHTML = hikeRecords.slice(0, 5).map(r => `
            <div class="record-card">
                <div class="record-header">
                    <span class="record-route-name">${r.routeName}</span>
                    <span class="record-date">${r.date}</span>
                </div>
                <div class="record-stats">
                    <span class="record-stat">📏 ${r.distance.toFixed(1)}公里</span>
                    <span class="record-stat">⛰️ +${Math.round(r.elevationGain)}米</span>
                    <span class="record-stat">⏱️ ${Math.floor(r.duration / 60)}小时${r.duration % 60}分钟</span>
                </div>
            </div>
        `).join('');
    }

    // 渲染已解锁成就
    const unlockedContainer = document.getElementById('unlockedAchievements');
    const unlockedAchievements = achievements.filter(a => a.isUnlocked);
    
    if (unlockedAchievements.length === 0) {
        unlockedContainer.innerHTML = `
            <div class="empty-container" style="grid-column: span 2;">
                <div class="empty-text">还没有解锁任何成就</div>
            </div>
        `;
    } else {
        unlockedContainer.innerHTML = unlockedAchievements.map(a => `
            <div class="achievement-card">
                <div class="achievement-icon-container">
                    <span class="achievement-icon">${a.icon}</span>
                </div>
                <div class="achievement-card-name">${a.name}</div>
                <div class="achievement-card-description">${a.description}</div>
                <div class="achievement-badge">
                    <span class="achievement-badge-text">${a.reward}</span>
                </div>
            </div>
        `).join('');
    }

    // 渲染待解锁成就
    const lockedContainer = document.getElementById('lockedAchievements');
    const lockedAchievements = achievements.filter(a => !a.isUnlocked);
    
    if (lockedAchievements.length === 0) {
        lockedContainer.innerHTML = `
            <div class="empty-container" style="grid-column: span 2;">
                <div class="empty-text">太棒了！已解锁所有成就！</div>
            </div>
        `;
    } else {
        lockedContainer.innerHTML = lockedAchievements.map(a => `
            <div class="achievement-card" style="opacity: 0.6;">
                <div class="achievement-icon-container locked">
                    <span class="achievement-icon">${a.icon}</span>
                </div>
                <div class="achievement-card-name">${a.name}</div>
                <div class="achievement-card-description">${a.description}</div>
                <div style="margin-top: 8px;">
                    <div class="progress-bar" style="height: 6px;">
                        <div class="progress-fill" style="width: ${(a.progress / a.maxProgress) * 100}%"></div>
                    </div>
                    <div class="achievement-progress-text" style="font-size: 12px; margin-top: 4px;">
                        ${a.progress}/${a.maxProgress}
                    </div>
                </div>
            </div>
        `).join('');
    }

    // 渲染所有记录
    const allRecordsContainer = document.getElementById('allRecords');
    if (hikeRecords.length === 0) {
        allRecordsContainer.innerHTML = `
            <div class="empty-container">
                <div class="empty-text">还没有徒步记录</div>
                <div class="empty-subtext">完成你的第一次徒步来解锁成就吧！</div>
            </div>
        `;
    } else {
        allRecordsContainer.innerHTML = hikeRecords.map(r => `
            <div class="record-detail-card">
                ${r.isCompleted ? '<div class="completed-badge"><span class="completed-badge-text">✓ 已完成</span></div>' : ''}
                <div class="record-detail-header">
                    <div class="record-detail-route-name">${r.routeName}</div>
                    <div class="record-detail-date">${r.date}</div>
                </div>
                <div class="record-detail-stats">
                    <div class="record-detail-stat">
                        <div class="record-detail-stat-label">距离</div>
                        <div class="record-detail-stat-value">${r.distance.toFixed(2)} 公里</div>
                    </div>
                    <div class="record-detail-stat">
                        <div class="record-detail-stat-label">爬升</div>
                        <div class="record-detail-stat-value">+${Math.round(r.elevationGain)} 米</div>
                    </div>
                    <div class="record-detail-stat">
                        <div class="record-detail-stat-label">用时</div>
                        <div class="record-detail-stat-value">${Math.floor(r.duration / 60)}h ${r.duration % 60}m</div>
                    </div>
                </div>
            </div>
        `).join('');
    }
}

// 切换成就页面的标签
function switchTab(tabName) {
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
        content.classList.add('hidden');
    });

    document.getElementById(tabName + 'Tab').classList.remove('hidden');
}
