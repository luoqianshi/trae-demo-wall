/**
 * 影心 - 你的情绪影视伴侣
 * 基于情绪状态的智能影视推荐小程序 Demo
 */

// ========== 数据层 ==========

const MOODS = [
    { id: 'happy', emoji: '😊', label: '开心', color: '#f0c040' },
    { id: 'sad', emoji: '😢', label: '低落', color: '#6090d0' },
    { id: 'anxious', emoji: '😰', label: '焦虑', color: '#d08060' },
    { id: 'bored', emoji: '😐', label: '无聊', color: '#808080' },
    { id: 'laugh', emoji: '🤣', label: '想笑', color: '#f0a030' },
    { id: 'calm', emoji: '😌', label: '平静', color: '#60b0a0' },
    { id: 'excited', emoji: '🤩', label: '兴奋', color: '#e05080' },
    { id: 'tired', emoji: '😴', label: '疲惫', color: '#9070c0' },
    { id: 'romantic', emoji: '🥰', label: '想恋爱', color: '#e080a0' }
];

const SCENES = [
    { id: 'commute', label: '🚌 通勤路上' },
    { id: 'beforebed', label: '🌙 睡前放松' },
    { id: 'weekend', label: '🏠 周末宅家' },
    { id: 'workbreak', label: '☕ 工作间隙' },
    { id: 'party', label: '🎉 朋友聚会' },
    { id: 'meal', label: '🍜 下饭时间' }
];

const MOVIES = {
    happy: [
        {
            id: 'h1', title: '布达佩斯大饭店', year: 2014, genre: '喜剧/剧情', duration: '99分钟',
            emoji: '🏨', posterColor: '#c8a0a0',
            desc: '韦斯·安德森的视觉盛宴，对称美学与幽默叙事的完美结合。讲述一位传奇礼宾员和他的年轻门生在大饭店中经历的冒险故事。',
            reason: '你心情愉悦，这部色彩绚丽、节奏轻快的电影能让好心情延续得更久',
            tags: ['轻松愉快', '视觉享受', '黑色幽默'],
            rating: 8.9
        },
        {
            id: 'h2', title: '疯狂动物城', year: 2016, genre: '动画/喜剧', duration: '108分钟',
            emoji: '🦊', posterColor: '#a0c0a0',
            desc: '在一个所有动物和平共处的城市里，兔子朱迪通过努力奋斗完成了儿时梦想，成为动物城警察的故事。',
            reason: '开心的时候看这部充满正能量的动画，会让你笑得更灿烂',
            tags: ['合家欢', '励志', '爆笑'],
            rating: 9.2
        },
        {
            id: 'h3', title: '爱乐之城', year: 2016, genre: '爱情/歌舞', duration: '128分钟',
            emoji: '🎹', posterColor: '#a0a0c8',
            desc: '一位爵士乐钢琴家与一名怀揣梦想的女演员在洛杉矶相遇，两人陷入热恋，却在追求梦想的道路上渐行渐远。',
            reason: '心情好的时候，最适合欣赏这部浪漫又充满希望的音乐剧',
            tags: ['浪漫', '音乐', '唯美'],
            rating: 8.4
        }
    ],
    sad: [
        {
            id: 's1', title: '海蒂和爷爷', year: 2015, genre: '剧情/家庭', duration: '111分钟',
            emoji: '🏔️', posterColor: '#80b0a0',
            desc: '孤儿海蒂被送到阿尔卑斯山与脾气古怪的爷爷同住，她用纯真和善良融化了爷爷的心，也改变了许多人的命运。',
            reason: '低落时需要被治愈，这部温暖纯净的电影会像阳光一样照进心里',
            tags: ['治愈系', '温情', '风景绝美'],
            rating: 9.3
        },
        {
            id: 's2', title: '心灵奇旅', year: 2020, genre: '动画/奇幻', duration: '101分钟',
            emoji: '🎷', posterColor: '#c0a080',
            desc: '一位爵士乐手在意外中灵魂出窍，来到"生之来处"，与一个不愿投胎的灵魂22号一起寻找生命的意义。',
            reason: '当你感到低落，这部电影会温柔地告诉你：活着本身就是意义',
            tags: ['治愈', '人生哲理', '皮克斯'],
            rating: 8.7
        },
        {
            id: 's3', title: '小森林', year: 2014, genre: '剧情', duration: '113分钟',
            emoji: '🌾', posterColor: '#a0b080',
            desc: '女孩市子无法融入喧嚣的大城市，回到故乡小森村，在四季更替中通过料理和劳作找回内心的平静。',
            reason: '低落时最适合看这种慢节奏、充满生活气息的电影，让心慢慢静下来',
            tags: ['慢生活', '美食', '四季'],
            rating: 9.0
        }
    ],
    anxious: [
        {
            id: 'a1', title: '功夫熊猫', year: 2008, genre: '动画/动作', duration: '92分钟',
            emoji: '🐼', posterColor: '#c0b080',
            desc: '一只笨拙的熊猫阿宝梦想成为功夫大师，意外中被选中为"神龙大侠"，在师父的训练下逐渐成长。',
            reason: '焦虑时不需要烧脑剧情，这部轻松搞笑又热血的动画是最好的解压良药',
            tags: ['解压', '搞笑', '励志'],
            rating: 8.2
        },
        {
            id: 'a2', title: '白日梦想家', year: 2013, genre: '喜剧/冒险', duration: '114分钟',
            emoji: '📷', posterColor: '#80a0c0',
            desc: '一名杂志社底片资产部管理经理，常常做白日梦，为了寻找一张失踪的底片，踏上了一场真正的冒险之旅。',
            reason: '焦虑的时候，跟着主角一起去冰岛冒险，让紧绷的神经彻底放松',
            tags: ['冒险', '风景', '治愈焦虑'],
            rating: 8.5
        },
        {
            id: 'a3', title: '龙猫', year: 1988, genre: '动画/奇幻', duration: '86分钟',
            emoji: '🐱', posterColor: '#80c080',
            desc: '小月的母亲生病住院了，父亲带着她与四岁的妹妹小梅到乡间的居住。她们在森林里发现了神奇的生物——龙猫。',
            reason: '焦虑时看宫崎骏的龙猫，仿佛回到了无忧无虑的童年，压力瞬间消散',
            tags: ['宫崎骏', '童真', '温暖'],
            rating: 9.2
        }
    ],
    bored: [
        {
            id: 'b1', title: '盗梦空间', year: 2010, genre: '科幻/悬疑', duration: '148分钟',
            emoji: '🌀', posterColor: '#8080a0',
            desc: '造梦师柯布接受了一项看似不可能的任务：在他人梦境中植入一个想法。层层梦境的嵌套，现实与梦境的边界逐渐模糊。',
            reason: '无聊的时候，这部烧脑神作会让你全神贯注，忘记时间的存在',
            tags: ['烧脑', '神作', '诺兰'],
            rating: 9.4
        },
        {
            id: 'b2', title: '寄生虫', year: 2019, genre: '剧情/惊悚', duration: '132分钟',
            emoji: '🏠', posterColor: '#a0a0a0',
            desc: '贫穷的一家四口通过伪造身份，逐渐渗透到富人家庭中工作，两个家庭之间的冲突不断升级。',
            reason: '无聊时需要一部让人欲罢不能的电影，这部奥斯卡最佳影片绝对让你停不下来',
            tags: ['奥斯卡', '悬疑', '社会'],
            rating: 8.8
        },
        {
            id: 'b3', title: '星际穿越', year: 2014, genre: '科幻/冒险', duration: '169分钟',
            emoji: '🚀', posterColor: '#6080a0',
            desc: '地球环境恶化，一组宇航员穿越虫洞寻找人类的新家园。在浩瀚宇宙中，爱与引力一样，可以跨越时空。',
            reason: '无聊的时候，来一场星际穿越的史诗之旅，三个小时不知不觉就过去了',
            tags: ['科幻神作', '震撼', '诺兰'],
            rating: 9.4
        }
    ],
    laugh: [
        {
            id: 'l1', title: '夏洛特烦恼', year: 2015, genre: '喜剧', duration: '104分钟',
            emoji: '🎸', posterColor: '#c0a0a0',
            desc: '夏洛在梦中穿越回高中时代，从失败者变成校园风云人物，经历了人生的大起大落，最终领悟真爱的意义。',
            reason: '想笑的时候，这部国产喜剧经典能让你从头笑到尾',
            tags: ['爆笑', '国产', '怀旧'],
            rating: 7.8
        },
        {
            id: 'l2', title: '神偷奶爸', year: 2010, genre: '动画/喜剧', duration: '95分钟',
            emoji: '🟡', posterColor: '#d0d060',
            desc: '超级坏蛋格鲁计划偷走月亮，为此他领养了三名孤儿作为工具，却在相处中被孩子们的天真感化。',
            reason: '小黄人的搞怪和孩子们的可爱，保证让你笑得肚子疼',
            tags: ['小黄人', '萌', '合家欢'],
            rating: 8.1
        },
        {
            id: 'l3', title: '三傻大闹宝莱坞', year: 2009, genre: '喜剧/剧情', duration: '170分钟',
            emoji: '🎓', posterColor: '#a0c0c0',
            desc: '三个工程学院的学生，在高压的教育体制下，用幽默和智慧挑战传统观念，追寻真正的梦想。',
            reason: '这部印度喜剧既有深度又有笑点，笑中带泪，绝对值得一看',
            tags: ['励志', '教育', '经典'],
            rating: 9.2
        }
    ],
    calm: [
        {
            id: 'c1', title: '千与千寻', year: 2001, genre: '动画/奇幻', duration: '125分钟',
            emoji: '🐉', posterColor: '#a0a0c0',
            desc: '10岁的少女千寻与父母误入灵异世界，父母变成猪，千寻为了拯救父母，在汤婆婆的澡堂里努力工作。',
            reason: '平静的时候，最适合沉浸在这部宫崎骏的奇幻 masterpiece 中',
            tags: ['宫崎骏', '奇幻', '成长'],
            rating: 9.4
        },
        {
            id: 'c2', title: '请以你的名字呼唤我', year: 2017, genre: '爱情/剧情', duration: '132分钟',
            emoji: '🍑', posterColor: '#c0b0a0',
            desc: '1983年夏天，17岁的艾利奥与24岁的美国学者奥利弗在意大利北部度过了一个刻骨铭心的夏天。',
            reason: '心情平静时，这部细腻唯美的爱情片会让你沉浸在意大利夏日的慵懒氛围中',
            tags: ['文艺', '夏日', '唯美'],
            rating: 8.9
        },
        {
            id: 'c3', title: '肖申克的救赎', year: 1994, genre: '剧情', duration: '142分钟',
            emoji: '⛓️', posterColor: '#8080a0',
            desc: '银行家安迪被冤枉杀妻入狱，在肖申克监狱中，他用智慧和希望完成了自我救赎。',
            reason: '平静的时候，最适合品味这部关于希望与自由的经典之作',
            tags: ['经典', '希望', '人生'],
            rating: 9.7
        }
    ],
    excited: [
        {
            id: 'e1', title: '复仇者联盟4', year: 2019, genre: '动作/科幻', duration: '181分钟',
            emoji: '🦸', posterColor: '#a06080',
            desc: '灭霸打响指后，宇宙一半生命消失。幸存的复仇者联盟成员必须集结，逆转时空，拯救宇宙。',
            reason: '兴奋的时候，这部史诗级超级英雄大片能让你的肾上腺素继续飙升',
            tags: ['漫威', '燃', '史诗'],
            rating: 8.5
        },
        {
            id: 'e2', title: '速度与激情7', year: 2015, genre: '动作/犯罪', duration: '137分钟',
            emoji: '🚗', posterColor: '#c08060',
            desc: '多米尼克和伙伴们面对新的威胁——戴克·肖，为复仇而来。一场跨越全球的极速追逐展开。',
            reason: '心情兴奋时，看飞车、爆炸、格斗，爽快感加倍',
            tags: ['燃爆', '飞车', '动作'],
            rating: 7.8
        },
        {
            id: 'e3', title: '头号玩家', year: 2018, genre: '科幻/冒险', duration: '140分钟',
            emoji: '🎮', posterColor: '#6080c0',
            desc: '2045年，现实世界衰退破败，人们沉迷于虚拟游戏"绿洲"。韦德·沃兹踏上了寻找彩蛋的冒险之旅。',
            reason: '兴奋的时候，这部充满游戏彩蛋和冒险元素的科幻片会让你热血沸腾',
            tags: ['斯皮尔伯格', '游戏', '冒险'],
            rating: 8.7
        }
    ],
    tired: [
        {
            id: 't1', title: '阿甘正传', year: 1994, genre: '剧情/爱情', duration: '142分钟',
            emoji: '🏃', posterColor: '#a0b0c0',
            desc: '智商只有75的阿甘，凭借纯真和执着，在人生中创造了一个又一个奇迹，影响了美国几十年的历史。',
            reason: '疲惫的时候，阿甘的简单和坚持会给你力量，让你重新充满能量',
            tags: ['经典', '励志', '温暖'],
            rating: 9.5
        },
        {
            id: 't2', title: '饮食男女', year: 1994, genre: '剧情/家庭', duration: '124分钟',
            emoji: '🍲', posterColor: '#c0a080',
            desc: '台湾名厨老朱每周日为三个女儿准备丰盛晚餐，在一次次家庭聚餐中，父女间的隔阂逐渐消融。',
            reason: '疲惫时看这部李安的经典，美食和亲情的温暖会让你感到被治愈',
            tags: ['李安', '美食', '家庭'],
            rating: 9.1
        },
        {
            id: 't3', title: '寻梦环游记', year: 2017, genre: '动画/音乐', duration: '105分钟',
            emoji: '🎸', posterColor: '#c08080',
            desc: '小男孩米格尔热爱音乐，却出生在禁止音乐的家庭。在亡灵节，他意外进入亡灵世界，展开冒险。',
            reason: '疲惫时看这部皮克斯动画，色彩和音乐会让你放松，结局会让你感动',
            tags: ['皮克斯', '音乐', '催泪'],
            rating: 9.1
        }
    ],
    romantic: [
        {
            id: 'r1', title: '泰坦尼克号', year: 1997, genre: '爱情/灾难', duration: '194分钟',
            emoji: '🚢', posterColor: '#80a0c0',
            desc: '穷画家杰克和贵族女露丝在泰坦尼克号上相遇相爱，在沉船的灾难中，杰克把生的机会留给了露丝。',
            reason: '想恋爱的时候，这部经典爱情片会让你相信爱情的力量',
            tags: ['经典', '浪漫', '催泪'],
            rating: 9.5
        },
        {
            id: 'r2', title: '怦然心动', year: 2010, genre: '爱情/剧情', duration: '90分钟',
            emoji: '🌳', posterColor: '#80b080',
            desc: '小女孩朱莉对新邻居布莱斯一见钟情，但布莱斯却对她避之不及。多年后，布莱斯才发现自己早已心动。',
            reason: '想恋爱的时候，这部纯纯的初恋电影会让你心里暖暖的',
            tags: ['初恋', '纯爱', '温馨'],
            rating: 9.1
        },
        {
            id: 'r3', title: '时空恋旅人', year: 2013, genre: '爱情/奇幻', duration: '123分钟',
            emoji: '⏰', posterColor: '#a0a080',
            desc: '蒂姆发现自己家族的男人都有穿越时空的能力，他用这个能力追求爱情，也学会了珍惜每一天。',
            reason: '想恋爱的时候，这部温暖浪漫的电影会让你对爱情充满期待',
            tags: ['浪漫', '治愈', '英式'],
            rating: 8.8
        }
    ]
};

// 场景推荐权重
const SCENE_WEIGHTS = {
    commute: { maxDuration: 30, preferShort: true },
    beforebed: { maxDuration: 120, preferCalm: true },
    weekend: { maxDuration: 200, preferLong: true },
    workbreak: { maxDuration: 25, preferShort: true },
    party: { preferFun: true },
    meal: { preferLight: true }
};

// ========== 状态管理 ==========

const state = {
    selectedMood: null,
    selectedScene: null,
    currentRecommendations: [],
    watchHistory: JSON.parse(localStorage.getItem('yingxin_history') || '[]'),
    currentPage: 'home'
};

// ========== DOM 元素 ==========

const els = {
    splash: document.getElementById('splash-screen'),
    mainApp: document.getElementById('main-app'),
    greetingText: document.getElementById('greeting-text'),
    moodGrid: document.getElementById('mood-grid'),
    sceneSection: document.getElementById('scene-section'),
    sceneTags: document.getElementById('scene-tags'),
    recommendBtn: document.getElementById('recommend-btn'),
    pages: {
        home: document.getElementById('page-home'),
        results: document.getElementById('page-results'),
        detail: document.getElementById('page-detail'),
        history: document.getElementById('page-history')
    },
    resultMoodEmoji: document.getElementById('result-mood-emoji'),
    resultMoodText: document.getElementById('result-mood-text'),
    resultsScene: document.getElementById('results-scene'),
    recommendationsList: document.getElementById('recommendations-list'),
    detailContent: document.getElementById('detail-content'),
    historyList: document.getElementById('history-list'),
    navItems: document.querySelectorAll('.nav-item')
};

// ========== 初始化 ==========

function init() {
    setGreeting();
    renderMoods();
    renderScenes();
    bindEvents();
    
    // 启动页动画
    setTimeout(() => {
        els.splash.classList.add('fade-out');
        setTimeout(() => {
            els.splash.style.display = 'none';
            els.mainApp.classList.remove('hidden');
        }, 600);
    }, 1800);
}

function setGreeting() {
    const hour = new Date().getHours();
    let text = '晚上好';
    if (hour < 6) text = '夜深了';
    else if (hour < 12) text = '早上好';
    else if (hour < 18) text = '下午好';
    els.greetingText.textContent = text;
}

function renderMoods() {
    els.moodGrid.innerHTML = MOODS.map(mood => `
        <div class="mood-item" data-mood="${mood.id}">
            <span class="mood-emoji">${mood.emoji}</span>
            <span class="mood-label">${mood.label}</span>
        </div>
    `).join('');
}

function renderScenes() {
    els.sceneTags.innerHTML = SCENES.map(scene => `
        <div class="scene-tag" data-scene="${scene.id}">${scene.label}</div>
    `).join('');
}

// ========== 事件绑定 ==========

function bindEvents() {
    // 情绪选择
    els.moodGrid.addEventListener('click', (e) => {
        const item = e.target.closest('.mood-item');
        if (!item) return;
        
        const moodId = item.dataset.mood;
        selectMood(moodId);
    });
    
    // 场景选择
    els.sceneTags.addEventListener('click', (e) => {
        const tag = e.target.closest('.scene-tag');
        if (!tag) return;
        
        const sceneId = tag.dataset.scene;
        selectScene(sceneId);
    });
    
    // 推荐按钮
    els.recommendBtn.addEventListener('click', generateRecommendations);
    
    // 返回按钮
    document.getElementById('back-btn').addEventListener('click', () => goToPage('home'));
    document.getElementById('detail-back-btn').addEventListener('click', () => goToPage('results'));
    document.getElementById('history-back-btn').addEventListener('click', () => goToPage('home'));
    
    // 底部导航
    els.navItems.forEach(item => {
        item.addEventListener('click', () => {
            const page = item.dataset.page;
            if (page === 'home') goToPage('home');
            else if (page === 'history') {
                renderHistory();
                goToPage('history');
            }
        });
    });
    
    // 顶部历史按钮
    document.getElementById('history-btn').addEventListener('click', () => {
        renderHistory();
        goToPage('history');
    });
}

// ========== 交互逻辑 ==========

function selectMood(moodId) {
    state.selectedMood = moodId;
    
    // 更新UI
    document.querySelectorAll('.mood-item').forEach(item => {
        item.classList.toggle('selected', item.dataset.mood === moodId);
    });
    
    // 显示场景选择
    els.sceneSection.style.display = 'block';
    
    // 启用推荐按钮
    els.recommendBtn.disabled = false;
    
    // 如果已有场景选择，直接可以推荐
    if (state.selectedScene) {
        els.recommendBtn.innerHTML = '<span>✨ 为我推荐</span>';
    }
}

function selectScene(sceneId) {
    state.selectedScene = sceneId;
    
    // 更新UI
    document.querySelectorAll('.scene-tag').forEach(tag => {
        tag.classList.toggle('selected', tag.dataset.scene === sceneId);
    });
}

function generateRecommendations() {
    if (!state.selectedMood) return;
    
    const mood = MOODS.find(m => m.id === state.selectedMood);
    const movies = MOVIES[state.selectedMood] || [];
    
    // 根据场景筛选（简化版）
    let filtered = [...movies];
    if (state.selectedScene) {
        const weights = SCENE_WEIGHTS[state.selectedScene];
        // 这里可以添加更复杂的筛选逻辑
    }
    
    state.currentRecommendations = filtered;
    
    // 渲染结果
    els.resultMoodEmoji.textContent = mood.emoji;
    els.resultMoodText.textContent = `适合「${mood.label}」时刻`;
    
    const scene = SCENES.find(s => s.id === state.selectedScene);
    els.resultsScene.textContent = scene ? `场景：${scene.label}` : '';
    
    els.recommendationsList.innerHTML = filtered.map(movie => `
        <div class="rec-card" data-movie="${movie.id}">
            <div class="rec-poster" style="background: ${movie.posterColor}20;">
                <div class="rec-poster-bg" style="background: ${movie.posterColor};"></div>
                <span class="rec-poster-emoji">${movie.emoji}</span>
            </div>
            <div class="rec-info">
                <div class="rec-title">${movie.title}</div>
                <div class="rec-meta">${movie.year} · ${movie.genre} · ${movie.duration}</div>
                <div class="rec-reason">💡 ${movie.reason}</div>
                <div class="rec-tags">
                    ${movie.tags.map(tag => `<span class="rec-tag">${tag}</span>`).join('')}
                </div>
                <div class="rec-rating">⭐ ${movie.rating}</div>
            </div>
        </div>
    `).join('');
    
    // 绑定卡片点击
    els.recommendationsList.querySelectorAll('.rec-card').forEach(card => {
        card.addEventListener('click', () => {
            const movieId = card.dataset.movie;
            showMovieDetail(movieId);
        });
    });
    
    goToPage('results');
}

function showMovieDetail(movieId) {
    const movie = state.currentRecommendations.find(m => m.id === movieId);
    if (!movie) return;
    
    els.detailContent.innerHTML = `
        <div class="detail-poster" style="background: ${movie.posterColor}20;">
            <div class="detail-poster-bg" style="background: ${movie.posterColor};"></div>
            <span style="position:relative;z-index:1;">${movie.emoji}</span>
        </div>
        <div class="detail-title">${movie.title}</div>
        <div class="detail-meta">${movie.year} · ${movie.genre} · ${movie.duration} · ⭐ ${movie.rating}</div>
        <div class="detail-tags">
            ${movie.tags.map(tag => `<span class="detail-tag">${tag}</span>`).join('')}
        </div>
        <div class="detail-desc">${movie.desc}</div>
        <div class="detail-reason-box">
            <div class="detail-reason-title">为什么推荐这部？</div>
            <div class="detail-reason-text">${movie.reason}</div>
        </div>
        <div class="detail-actions">
            <button class="detail-btn detail-btn-primary" id="watch-btn">✅ 标记为已看</button>
            <button class="detail-btn detail-btn-secondary" id="share-btn">📤 分享</button>
        </div>
    `;
    
    // 绑定标记已看
    document.getElementById('watch-btn').addEventListener('click', () => {
        addToHistory(movie);
        alert('已添加到观影记录！');
    });
    
    document.getElementById('share-btn').addEventListener('click', () => {
        alert('分享功能演示：复制链接已生成！');
    });
    
    goToPage('detail');
}

function addToHistory(movie) {
    const entry = {
        ...movie,
        watchedAt: new Date().toISOString(),
        mood: state.selectedMood
    };
    state.watchHistory.unshift(entry);
    localStorage.setItem('yingxin_history', JSON.stringify(state.watchHistory));
}

function renderHistory() {
    if (state.watchHistory.length === 0) {
        els.historyList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📭</div>
                <div class="empty-state-text">还没有观影记录</div>
                <div class="empty-state-text" style="margin-top:4px;font-size:12px;">去首页选择心情，开始推荐吧~</div>
            </div>
        `;
        return;
    }
    
    els.historyList.innerHTML = state.watchHistory.map(entry => {
        const mood = MOODS.find(m => m.id === entry.mood);
        const date = new Date(entry.watchedAt);
        const dateStr = `${date.getMonth() + 1}月${date.getDate()}日`;
        return `
            <div class="history-item" data-movie="${entry.id}">
                <div class="history-poster" style="background: ${entry.posterColor}30;">
                    ${entry.emoji}
                </div>
                <div class="history-info">
                    <div class="history-name">${entry.title}</div>
                    <div class="history-mood">${mood ? mood.emoji + ' ' + mood.label : ''} · ${dateStr}</div>
                    <div class="history-rating">⭐ ${entry.rating}</div>
                </div>
            </div>
        `;
    }).join('');
}

// ========== 页面导航 ==========

function goToPage(pageName) {
    // 隐藏所有页面
    Object.values(els.pages).forEach(page => page.classList.remove('active'));
    
    // 显示目标页面
    if (els.pages[pageName]) {
        els.pages[pageName].classList.add('active');
    }
    
    state.currentPage = pageName;
    
    // 更新导航状态
    els.navItems.forEach(item => {
        const isActive = item.dataset.page === pageName || 
                         (pageName === 'results' && item.dataset.page === 'home') ||
                         (pageName === 'detail' && item.dataset.page === 'home');
        item.classList.toggle('active', isActive);
    });
}

// ========== 启动 ==========

document.addEventListener('DOMContentLoaded', init);
