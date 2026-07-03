/**
 * 灵韵旋律 - 核心业务逻辑（简约文艺版）
 * Editorial Minimal Edition
 *
 * 模块：
 *  1. 图标与情绪映射（muted editorial 配色）
 *  2. 应用状态（含圈子 / AI润色 / 灵感图）
 *  3. 数据持久化（library / user / quota / community）
 *  4. 页面导航（4 Tab + 子页面）
 *  5. 首页（Hero 图 + 风景图灵感推荐）
 *  6. 创作页（文字 / 哼唱 / 图片 + AI 润色）
 *  7. AI 生成流程（6 阶段进度 / 取消 / 配额）
 *  8. 结果展示 / 播放 / 保存 / 分享
 *  9. 音乐库（搜索 / 筛选 / 详情）
 * 10. 个人中心（统计 / 热力图 / 饼图 / 情绪云）
 * 11. 圈子社交（帖子流 / 点赞 / 关注 / 评论 / 发布）
 * 12. 工具函数
 */

// ============================================
// SVG 图标常量（Lucide 风格，描边可继承 currentColor）
// ============================================
const ICONS = {
    music: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
    text: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>',
    mic: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>',
    image: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>',
    play: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>',
    pause: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>',
    bookmark: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>',
    bookmarkCheck: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/><path d="m9 10 2 2 4-4"/></svg>',
    share: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>',
    download: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
    edit: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
    trash: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
    chevronRight: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
    more: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>',
    cloud: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>',
    sun: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>',
    moon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>',
    mountain: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg>',
    camera: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>',
    feather: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" y1="8" x2="2" y2="22"/><line x1="17.5" y1="15" x2="9" y2="15"/></svg>',
    heart: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
    heartFill: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
    sparkles: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.287 1.288L3 12l5.8 1.9a2 2 0 0 1 1.288 1.287L12 21l1.9-5.8a2 2 0 0 1 1.287-1.288L21 12l-5.8-1.9a2 2 0 0 1-1.288-1.287Z"/></svg>',
    // 圈子相关
    comment: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    send: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>',
    plus: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>'
};

// 情绪对应图标与配色（muted editorial 纯色，避免粉紫渐变）
const EMOTION_ICONS = {
    '温柔': { icon: ICONS.feather, color: '#C4906B' },
    '宁静': { icon: ICONS.moon, color: '#8FA8B5' },
    '回忆': { icon: ICONS.heart, color: '#A89BB0' },
    '快乐': { icon: ICONS.sun, color: '#D4A574' },
    '孤独': { icon: ICONS.moon, color: '#6B7280' },
    '自由': { icon: ICONS.cloud, color: '#88A8BF' },
    '希望': { icon: ICONS.sun, color: '#9DB89A' },
    '热闹': { icon: ICONS.sparkles, color: '#C47A6B' }
};

// 图表配色（墨绿为主 + muted 辅色）
const CHART_COLORS = ['#047857', '#8FA8B5', '#C4906B', '#9DB89A', '#A89BB0', '#D4A574', '#6B7280', '#88A8BF'];

// 心情标签可选列表
const MOOD_LIST = ['温柔', '宁静', '回忆', '快乐', '孤独', '自由', '希望', '热闹'];

// 图片生成 API
const IMAGE_API = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image';

// ============================================
// 应用状态管理
// ============================================
const app = {
    currentPage: 'home',
    currentMode: 'text',
    currentStyle: 'auto',
    currentFilter: 'all',
    searchKeyword: '',

    inputData: {
        text: '',
        hum: null,
        image: null
    },

    isRecording: false,
    recordStartTime: 0,
    recordTimer: null,
    mediaRecorder: null,
    audioChunks: [],

    isGenerating: false,
    generateProgress: 0,
    generateTimer: null,

    currentResult: null,
    currentDetailWork: null,

    currentPlaying: null,
    playTimers: {},

    library: [],

    user: {
        id: 'LY20260626',
        name: '灵感创作者',
        totalWorks: 0,
        monthWorks: 0,
        weekWorks: 0,
        streakDays: 0,
        emotionStats: {},
        creationDates: []
    },

    dailyQuota: {
        date: '',
        count: 0,
        limit: 20
    },

    quickPrompts: [
        '雨后的傍晚，温柔但不悲伤',
        '午后的阳光洒在书桌上',
        '深夜独处，安静思考',
        '旅行途中的自由感',
        '想要一点平静的力量',
        '回忆那些美好的时光',
        '忙碌后的放松时刻',
        '对未来的期待与希望'
    ],

    // 灵感推荐：文字 + 风景图 prompt
    inspirations: [
        { text: '雨后的傍晚，一个人坐在公交车最后一排，想要一点温柔但不悲伤的旋律', imagePrompt: 'rainy evening city bus window with bokeh lights, cinematic moody atmosphere, soft reflections, editorial photography' },
        { text: '午后的阳光透过窗户洒在书桌上，咖啡的香气，安静的阅读时光', imagePrompt: 'warm afternoon sunlight on wooden desk with coffee cup and open book, cozy soft light, minimal still life' },
        { text: '深夜的城市，霓虹灯闪烁，独自走在回家的路上，思考人生', imagePrompt: 'neon city street at night, lonely figure walking, cinematic blue tones, wet pavement reflections' },
        { text: '站在山顶，俯瞰云海，感受大自然的壮阔与内心的宁静', imagePrompt: 'mountain peak above sea of clouds at sunrise, vast cinematic landscape, serene and majestic' },
        { text: '春天的公园里，樱花飘落，微风拂面，想要记录这份美好', imagePrompt: 'cherry blossom petals falling in spring park, soft dreamy light, gentle breeze, shallow depth of field' },
        { text: '脑海中有一段旋律，像海浪一样起伏，想要把它变成完整的音乐', imagePrompt: 'ocean waves at golden hour, calm sea with gentle ripples, warm sunset light reflecting on water' },
        { text: '旅行中拍下的一张风景照，想要配上专属的BGM', imagePrompt: 'travel landscape with mountain lake reflection and wooden dock, adventure freedom, golden hour' },
        { text: '回忆起某个特别的时刻，想要用音乐表达那份情感', imagePrompt: 'warm vintage film aesthetic, nostalgic memory, soft focus golden tones, old photograph mood' }
    ],

    // 圈子社交状态
    communityTab: 'recommend',
    communityPosts: [],
    followingUsers: [],
    postBgmPlaying: null,

    // 发布帖子状态
    publishState: {
        text: '',
        mood: '',
        bgm: null,
        image: null
    },

    // AI 润色状态
    polishState: {
        original: '',
        polished: '',
        note: '',
        loading: false
    },

    // 创作日历当前显示的年月
    calendarMonth: null
};

// 圈子种子数据（首次进入时初始化）
function buildSeedPosts() {
    const now = Date.now();
    const iso = (ms) => new Date(now - ms).toISOString();
    return [
        {
            id: 'post_seed_1',
            userId: 'u_lin', userName: '林深', userInitial: '林', userAvatarColor: '#8FA8B5',
            content: '加班到深夜，走在空荡的街道上，路灯把影子拉得很长。用一句话生成了这段旋律，像是给疲惫的自己一个拥抱。',
            mood: '孤独',
            bgm: { title: '孤独 23:47', style: '氛围舒缓', duration: '0:48', emotionTags: ['孤独', '宁静'] },
            imagePrompt: 'empty city street at late night with single streetlight, long shadow, cinematic moody blue tones',
            images: [],
            likes: 128, liked: false, bookmarked: false,
            comments: [
                { userId: 'u_a', userName: '晚风', userInitial: '晚', userAvatarColor: '#9DB89A', text: '这段旋律真的太治愈了，单曲循环中' },
                { userId: 'u_b', userName: '山月', userInitial: '山', userAvatarColor: '#C4906B', text: '深夜的街道配这个BGM，画面感好强' }
            ],
            createdAt: iso(3600000 * 3),
            isOwn: false
        },
        {
            id: 'post_seed_2',
            userId: 'u_yu', userName: '雨棠', userInitial: '雨', userAvatarColor: '#9DB89A',
            content: '在洱海边看日落，整片天空被染成橘红色。拍下这一刻，配上了专属的BGM，旅行就该这样被记住。',
            mood: '自由',
            bgm: { title: '自由 18:32', style: '流行明亮', duration: '0:42', emotionTags: ['自由', '希望'] },
            imagePrompt: 'erhai lake sunset with orange sky, silhouette of mountains, calm water reflection, travel photography',
            images: [],
            likes: 256, liked: false, bookmarked: false,
            comments: [
                { userId: 'u_c', userName: '青柠', userInitial: '青', userAvatarColor: '#D4A574', text: '好美！请问这个BGM怎么生成的呀' }
            ],
            createdAt: iso(3600000 * 8),
            isOwn: false
        },
        {
            id: 'post_seed_3',
            userId: 'u_mu', userName: '木兮', userInitial: '木', userAvatarColor: '#C4906B',
            content: '周末午后，咖啡馆的窗边，阳光斜斜地照进来。一本书，一杯拿铁，一段刚刚生成的Lo-fi。生活本来就该这样慢下来。',
            mood: '宁静',
            bgm: { title: '宁静 15:20', style: 'Lo-fi 简约', duration: '0:55', emotionTags: ['宁静', '温柔'] },
            imagePrompt: null,
            images: [],
            likes: 89, liked: false, bookmarked: false,
            comments: [],
            createdAt: iso(3600000 * 26),
            isOwn: false
        },
        {
            id: 'post_seed_4',
            userId: 'u_chen', userName: '晨星', userInitial: '晨', userAvatarColor: '#88A8BF',
            content: '想起小时候外婆家的夏天，蝉鸣、蒲扇、井水里的西瓜。那些回不去的时光，我用音乐留住了它们。',
            mood: '回忆',
            bgm: { title: '回忆 09:15', style: '原声简约', duration: '0:50', emotionTags: ['回忆', '温柔'] },
            imagePrompt: null,
            images: [],
            likes: 312, liked: false, bookmarked: false,
            comments: [
                { userId: 'u_d', userName: '云溪', userInitial: '云', userAvatarColor: '#A89BB0', text: '看哭了，好想念奶奶' },
                { userId: 'u_e', userName: '北辰', userInitial: '北', userAvatarColor: '#6B7280', text: '情绪拿捏得太准了' }
            ],
            createdAt: iso(3600000 * 50),
            isOwn: false
        },
        {
            id: 'post_seed_5',
            userId: 'u_xia', userName: '夏野', userInitial: '夏', userAvatarColor: '#D4A574',
            content: '登山途中遇到一片云海，风从脚下涌上来。那一刻什么烦恼都没有了，只有辽阔和自由。',
            mood: '自由',
            bgm: null,
            imagePrompt: 'hiking trail above clouds sea, vast mountain vista, wind blowing, sense of freedom and scale',
            images: [],
            likes: 167, liked: false, bookmarked: false,
            comments: [],
            createdAt: iso(3600000 * 72),
            isOwn: false
        },
        {
            id: 'post_seed_6',
            userId: 'u_ye', userName: '夜白', userInitial: '夜', userAvatarColor: '#A89BB0',
            content: '失眠的夜里，把焦虑写成了文字，AI 帮我变成了一段舒缓的旋律。原来情绪也可以这样被温柔接住。',
            mood: '希望',
            bgm: { title: '希望 02:08', style: '深度氛围', duration: '0:58', emotionTags: ['希望', '宁静'] },
            imagePrompt: null,
            images: [],
            likes: 203, liked: false, bookmarked: false,
            comments: [
                { userId: 'u_f', userName: '微光', userInitial: '微', userAvatarColor: '#9DB89A', text: '同款失眠人，马上就去试试' }
            ],
            createdAt: iso(3600000 * 96),
            isOwn: false
        }
    ];
}

// ============================================
// 初始化
// ============================================
function init() {
    loadFromStorage();
    renderHomePage();
    renderQuickPrompts();
    renderPublishMoods();
    updateQuotaDisplay();
    updateModeTabIndicator('text');

    // 绑定风格切换
    document.querySelectorAll('.style-option').forEach(opt => {
        opt.addEventListener('click', function () {
            document.querySelectorAll('.style-option').forEach(o => o.classList.remove('active'));
            this.classList.add('active');
            app.currentStyle = this.dataset.style;
            if (app.currentResult) {
                applyStyleChange();
            }
        });
    });

    // 绑定筛选标签
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', function () {
            document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            app.currentFilter = this.dataset.filter;
            renderLibrary();
        });
    });

    // 圈子 Tab 绑定
    document.querySelectorAll('.community-tab').forEach(tab => {
        tab.addEventListener('click', function () {
            app.switchCommunityTab(this.dataset.tab);
        });
    });

    // 确认弹窗关闭
    document.getElementById('confirmOverlay').addEventListener('click', closeConfirm);
    document.getElementById('confirmCancel').addEventListener('click', closeConfirm);

    // 输入框模态事件绑定
    document.getElementById('inputOverlay').addEventListener('click', closeInputModal);
    document.getElementById('inputCancel').addEventListener('click', closeInputModal);
    document.getElementById('inputOk').addEventListener('click', confirmInputModal);
    const inputField = document.getElementById('inputField');
    inputField.addEventListener('input', (e) => {
        document.getElementById('inputCount').textContent = e.target.value.length;
    });
    inputField.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            confirmInputModal();
        }
    });

    // 首页滚动联动状态栏（hero 上方透明，滚出 hero 后不透明）
    const homeScroll = document.querySelector('#page-home .page-scroll');
    if (homeScroll) {
        homeScroll.addEventListener('scroll', updateHomeStatusBar, { passive: true });
    }

    // 首次使用引导
    if (!localStorage.getItem('lingyun_visited')) {
        setTimeout(() => {
            showToast('欢迎使用灵韵旋律，开启你的音乐创作之旅', ICONS.sparkles);
            localStorage.setItem('lingyun_visited', '1');
        }, 500);
    }
}

// ============================================
// 数据持久化
// ============================================
function loadFromStorage() {
    try {
        // 数据版本检测：版本不匹配时清除旧数据（含历史示例作品），确保首次打开为干净空乐库
        const DATA_VERSION = 'v2_clean_20260702';
        const storedVersion = localStorage.getItem('lingyun_data_version');
        if (storedVersion !== DATA_VERSION) {
            localStorage.removeItem('lingyun_library');
            localStorage.removeItem('lingyun_user');
            localStorage.setItem('lingyun_data_version', DATA_VERSION);
        }

        const library = localStorage.getItem('lingyun_library');
        if (library) {
            app.library = JSON.parse(library);
        }

        const user = localStorage.getItem('lingyun_user');
        if (user) app.user = { ...app.user, ...JSON.parse(user) };

        const quota = localStorage.getItem('lingyun_quota');
        if (quota) app.dailyQuota = JSON.parse(quota);

        const community = localStorage.getItem('lingyun_community');
        if (community) {
            const data = JSON.parse(community);
            app.communityPosts = data.posts || [];
            app.followingUsers = data.following || [];
        } else {
            // 首次初始化种子数据
            app.communityPosts = buildSeedPosts();
            saveCommunity();
        }

        const today = new Date().toDateString();
        if (app.dailyQuota.date !== today) {
            app.dailyQuota = { date: today, count: 0, limit: 20 };
            saveQuota();
        }
    } catch (e) {
        console.error('加载存储数据失败:', e);
    }
}

function saveLibrary() {
    try {
        localStorage.setItem('lingyun_library', JSON.stringify(app.library));
    } catch (e) {
        console.error('保存音乐库失败:', e);
    }
}

function saveUser() {
    try {
        localStorage.setItem('lingyun_user', JSON.stringify(app.user));
    } catch (e) {
        console.error('保存用户数据失败:', e);
    }
}

function saveQuota() {
    try {
        localStorage.setItem('lingyun_quota', JSON.stringify(app.dailyQuota));
    } catch (e) {
        console.error('保存配额数据失败:', e);
    }
}

function saveCommunity() {
    try {
        localStorage.setItem('lingyun_community', JSON.stringify({
            posts: app.communityPosts,
            following: app.followingUsers
        }));
    } catch (e) {
        console.error('保存圈子数据失败:', e);
    }
}

// ============================================
// 图片生成 API 加载
// ============================================
function buildImageUrl(prompt, size) {
    return `${IMAGE_API}?prompt=${encodeURIComponent(prompt)}&image_size=${size || 'landscape_16_9'}`;
}

function loadImageFromApi(prompt, imgEl, size) {
    if (!imgEl || !prompt) return;
    // 图片已加载完成（浏览器缓存），直接显示
    if (imgEl.complete && imgEl.naturalWidth > 0) {
        imgEl.classList.add('loaded');
        return;
    }
    imgEl.classList.remove('loaded');
    imgEl.onload = () => imgEl.classList.add('loaded');
    imgEl.onerror = () => { /* 保留 fallback 背景 */ };
    imgEl.src = buildImageUrl(prompt, size);
}

function loadHeroImage() {
    const imgEl = document.getElementById('heroImg');
    loadImageFromApi('misty mountain lake at dawn with soft golden light, cinematic serene landscape, editorial nature photography, atmospheric', imgEl);
}

// ============================================
// 页面导航
// ============================================
function navigate(page) {
    // 先渲染内容，再切换页面，避免重排打断过渡动画
    if (page === 'home') {
        renderHomePage();
    } else if (page === 'library') {
        renderLibraryWithSkeleton();
    } else if (page === 'profile') {
        renderProfile();
    } else if (page === 'community') {
        renderCommunity();
    }

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const targetPage = document.getElementById(`page-${page}`);
    if (targetPage) {
        targetPage.classList.add('active');
        app.currentPage = page;
    }

    // 仅 4 个主 Tab 高亮
    document.querySelectorAll('.tab-item').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.page === page) tab.classList.add('active');
    });

    // 状态栏：首页 hero 上方透明白字，滚出 hero 后不透明深字；其他页面始终不透明深字
    const statusBar = document.querySelector('.status-bar');
    if (statusBar) {
        if (page === 'home') {
            statusBar.classList.remove('solid', 'dark');
            updateHomeStatusBar();
        } else {
            statusBar.classList.add('solid', 'dark');
        }
    }
}

// 首页滚动联动状态栏：hero 区域内透明，滚出 hero 后不透明
function updateHomeStatusBar() {
    if (app.currentPage !== 'home') return;
    const statusBar = document.querySelector('.status-bar');
    if (!statusBar) return;
    const homeScroll = document.querySelector('#page-home .page-scroll');
    if (!homeScroll) return;
    const scrollTop = homeScroll.scrollTop;
    const threshold = 296; // hero 340px - 状态栏 44px
    if (scrollTop >= threshold) {
        statusBar.classList.add('solid', 'dark');
    } else {
        statusBar.classList.remove('solid', 'dark');
    }
}

// ============================================
// 首页渲染
// ============================================
function renderHomePage() {
    // Hero 图加载
    loadHeroImage();

    // 最近作品
    const recentList = document.getElementById('recentList');
    if (app.library.length === 0) {
        recentList.innerHTML = `
            <div class="recent-empty">
                <div class="recent-empty-icon">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
                </div>
                <p class="recent-empty-text">还没有作品，去创作第一首吧</p>
                <button class="recent-empty-btn" onclick="app.navigate('create')">开始创作</button>
            </div>
        `;
    } else {
        const recentWorks = app.library.slice(0, 5);
        recentList.innerHTML = recentWorks.map(work => {
            const iconInfo = getEmotionIcon(work.emotionTags[0]);
            const emotionTag = work.emotionTags && work.emotionTags[0] ? work.emotionTags[0] : '';
            const createdTime = formatRelativeTime(work.createdAt);
            const coverHtml = work.coverImage
                ? `<img class="recent-cover-img" src="${work.coverImage}" alt="${escapeHtml(work.title)}" onerror="this.style.display='none'">`
                : iconInfo.icon;
            return `
                <div class="recent-card" onclick="app.viewWorkDetail('${work.id}')">
                    <div class="recent-cover" style="background:${iconInfo.color}">
                        ${coverHtml}
                        ${emotionTag ? `<span class="recent-emotion-tag">${escapeHtml(emotionTag)}</span>` : ''}
                    </div>
                    <div class="recent-info">
                        <div class="recent-title">${escapeHtml(work.title)}</div>
                        <div class="recent-meta">
                            <span>${escapeHtml(work.style)}</span>
                            <span class="recent-meta-dot"></span>
                            <span>${work.duration}</span>
                        </div>
                        <div class="recent-time">${createdTime}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // 灵感推荐：风景图 + 文字（仅首次渲染时生成 HTML，避免重建 img 元素导致图片重新加载）
    const inspirationList = document.getElementById('inspirationList');
    if (!inspirationList.dataset.rendered) {
        inspirationList.innerHTML = app.inspirations.map((insp, idx) => `
            <div class="inspiration-item" onclick="app.useInspiration(${idx})">
                <span class="insp-thumb">
                    <span class="insp-thumb-fallback"></span>
                    <img class="insp-thumb-img" id="inspImg${idx}" alt="${escapeHtml(insp.text)}">
                </span>
                <span class="insp-body">
                    <span class="insp-text">${escapeHtml(insp.text)}</span>
                    <span class="insp-foot">
                        <span class="insp-num">/${String(idx + 1).padStart(2, '0')}</span>
                        <span class="insp-arrow">${ICONS.chevronRight}</span>
                    </span>
                </span>
            </div>
        `).join('');
        inspirationList.dataset.rendered = '1';

        // 异步加载灵感风景图
        app.inspirations.forEach((insp, idx) => {
            const imgEl = document.getElementById(`inspImg${idx}`);
            loadImageFromApi(insp.imagePrompt, imgEl, 'square');
        });
    } else {
        // 已渲染过，确保所有已加载完成的图片显示
        app.inspirations.forEach((insp, idx) => {
            const imgEl = document.getElementById(`inspImg${idx}`);
            if (imgEl && imgEl.complete && imgEl.naturalWidth > 0) {
                imgEl.classList.add('loaded');
            }
        });
    }
}

function useInspiration(index) {
    const insp = app.inspirations[index];
    navigate('create');
    setTimeout(() => {
        switchMode('text');
        document.getElementById('textInput').value = insp.text;
        onTextInput();
    }, 100);
}

// ============================================
// 快捷提示词
// ============================================
function renderQuickPrompts() {
    const promptsScroll = document.getElementById('promptsScroll');
    promptsScroll.innerHTML = app.quickPrompts.map((prompt, idx) => `
        <div class="prompt-chip" onclick="app.usePrompt(${idx})">${escapeHtml(prompt)}</div>
    `).join('');
}

function usePrompt(index) {
    const textInput = document.getElementById('textInput');
    textInput.value = app.quickPrompts[index];
    onTextInput();
}

// ============================================
// 输入模式切换
// ============================================
function switchMode(mode) {
    app.currentMode = mode;

    document.querySelectorAll('.mode-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.mode === mode) tab.classList.add('active');
    });
    updateModeTabIndicator(mode);

    document.querySelectorAll('.input-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    document.getElementById(`panel-${mode}`).classList.add('active');

    updateGenerateButton();
}

function updateModeTabIndicator(mode) {
    const indicator = document.getElementById('modeTabIndicator');
    const index = ['text', 'hum', 'image'].indexOf(mode);
    if (indicator) {
        indicator.style.transform = `translateX(${index * 100}%)`;
    }
}

// ============================================
// 文字输入处理
// ============================================
function onTextInput() {
    const textInput = document.getElementById('textInput');
    const charCount = document.getElementById('charCount');
    app.inputData.text = textInput.value;
    charCount.textContent = textInput.value.length;
    updateGenerateButton();
}

// ============================================
// AI 润色功能
// ============================================
function startPolish() {
    const text = app.inputData.text.trim();
    if (!text) {
        showToast('请先输入一些文字再润色');
        return;
    }
    if (text.length < 4) {
        showToast('内容太短，暂时无法润色');
        return;
    }

    const btn = document.getElementById('aiPolishBtn');
    btn.disabled = true;
    btn.innerHTML = `<span class="polish-spinner"></span><span>润色中</span>`;
    app.polishState.loading = true;
    app.polishState.original = text;

    setTimeout(() => {
        const { polished, note } = generatePolishedText(text, false);
        app.polishState.polished = polished;
        app.polishState.note = note;
        app.polishState.loading = false;

        document.getElementById('polishOriginal').textContent = text;
        document.getElementById('polishResult').textContent = polished;
        document.getElementById('polishNote').textContent = note;

        btn.disabled = false;
        btn.innerHTML = `${ICONS.sparkles}<span>AI润色</span>`;

        document.getElementById('polishPanel').classList.add('active');
    }, 1200);
}

// 模拟 AI 润色：保留核心意思 + 添加感官细节 + 优化句式
function generatePolishedText(original, isVariation) {
    const text = original.trim().replace(/[。.!\!！?？\s]+$/, '');
    if (!text) return { polished: original, note: '' };

    const notes = [];

    // 1. 氛围感官细节（两组措辞，重新润色时使用备选）
    const atmosphereSets = {
        rain: [
            '细雨敲打着窗棂，空气里泛起泥土与青草的湿润气息，',
            '雨丝斜织，把整座城市晕染成一幅水汽氤氲的画，'
        ],
        sun: [
            '阳光透过云层斜斜洒落，光影在地面上缓缓游移，',
            '金色的光线慵懒铺展，把一切棱角都磨得柔软，'
        ],
        night: [
            '夜色如绸缎般铺展开来，远处灯火明灭，',
            '夜幕低垂，星光与霓虹在夜空里彼此呼应，'
        ],
        sea: [
            '海浪一波波轻拍岸边，咸湿的风拂过面颊，',
            '潮汐起落间，远处海的低语若隐若现，'
        ],
        mountain: [
            '山风穿林而过，云雾在远处缓缓舒卷，',
            '群山静默，云海在脚下流淌如河，'
        ],
        wind: [
            '风从远方吹来，带着季节更替的讯息，',
            '微风掠过发梢，像谁在耳畔低声呢喃，'
        ]
    };

    let atmosphere = '';
    if (/雨|淋湿|潮湿|水珠/.test(text)) {
        atmosphere = atmosphereSets.rain[isVariation ? 1 : 0];
        notes.push('补充了雨天的嗅觉与听觉细节');
    } else if (/阳光|午后|温暖|暖|晨|朝阳/.test(text)) {
        atmosphere = atmosphereSets.sun[isVariation ? 1 : 0];
        notes.push('强化了光影的动态画面感');
    } else if (/夜|深夜|凌晨|月光|傍晚|黄昏/.test(text)) {
        atmosphere = atmosphereSets.night[isVariation ? 1 : 0];
        notes.push('补充了夜间视觉氛围的描写');
    } else if (/海|浪|沙滩|潮/.test(text)) {
        atmosphere = atmosphereSets.sea[isVariation ? 1 : 0];
        notes.push('加入了海洋的触觉与听觉');
    } else if (/山|森林|树叶|云|林|野/.test(text)) {
        atmosphere = atmosphereSets.mountain[isVariation ? 1 : 0];
        notes.push('增添了自然场景的空间层次');
    } else if (/风/.test(text)) {
        atmosphere = atmosphereSets.wind[isVariation ? 1 : 0];
        notes.push('丰富了风的意象');
    }

    // 2. 情绪收束（两组措辞）
    const endingSets = {
        gentle: [
            '愿这段旋律如同一袭轻纱，温柔地包裹此刻的心绪。',
            '让旋律化作一阵微风，轻轻托住这份柔软的情绪。'
        ],
        lonely: [
            '让这段音乐成为独行路上沉默而温暖的陪伴。',
            '愿音符替你说出那些来不及开口的心事。'
        ],
        memory: [
            '让过往的片段在音符里重新鲜活，缓缓流淌。',
            '让回忆在旋律中沉淀，化作可以被反复聆听的时光。'
        ],
        hope: [
            '愿旋律里藏着向前走的光亮与勇气。',
            '让每一个音符，都成为通往明天的微光。'
        ],
        serene: [
            '让一切归于此刻的宁静，呼吸也随之舒缓。',
            '在旋律里安放身心，让喧嚣退潮，归于平和。'
        ],
        free: [
            '愿这段旋律带着你越过山川，去往心底的自由。',
            '让音乐成为一双翅膀，载着心飞向更远的地方。'
        ]
    };

    let ending = '';
    if (/温柔|柔软|轻|暖/.test(text)) {
        ending = endingSets.gentle[isVariation ? 1 : 0];
        notes.push('以意象化结尾呼应"温柔"的情绪');
    } else if (/孤独|寂寞|一个人|独/.test(text)) {
        ending = endingSets.lonely[isVariation ? 1 : 0];
        notes.push('以陪伴感化解孤独的情绪');
    } else if (/回忆|怀念|从前|曾经|童年/.test(text)) {
        ending = endingSets.memory[isVariation ? 1 : 0];
        notes.push('以"流淌"意象呼应回忆的绵长');
    } else if (/希望|期待|未来|向前/.test(text)) {
        ending = endingSets.hope[isVariation ? 1 : 0];
        notes.push('以"光亮"呼应希望的主题');
    } else if (/宁静|安静|平静|放松/.test(text)) {
        ending = endingSets.serene[isVariation ? 1 : 0];
        notes.push('以呼吸节奏强化宁静的感受');
    } else if (/自由|旅行|远方|辽阔/.test(text)) {
        ending = endingSets.free[isVariation ? 1 : 0];
        notes.push('以"翅膀"意象延展自由感');
    } else {
        ending = '愿这段旋律，成为此刻心情最贴切的注脚。';
        notes.push('补充了点题式的情感收束句');
    }

    let polished;
    if (atmosphere) {
        polished = atmosphere + text + '。' + ending;
    } else {
        polished = text + '。' + ending;
        notes.push('优化了句式节奏，补充了情感收束');
    }

    return { polished, note: notes.join('；') };
}

function applyPolish() {
    if (!app.polishState.polished) return;
    const textInput = document.getElementById('textInput');
    // 控制在 500 字以内
    let polished = app.polishState.polished;
    if (polished.length > 500) polished = polished.slice(0, 500);
    textInput.value = polished;
    onTextInput();
    closePolishPanel();
    showToast('已应用润色结果', ICONS.sparkles);
}

function repolish() {
    const { polished, note } = generatePolishedText(app.polishState.original, true);
    app.polishState.polished = polished;
    app.polishState.note = note;
    document.getElementById('polishResult').textContent = polished;
    document.getElementById('polishNote').textContent = note;
    showToast('已重新润色', ICONS.sparkles);
}

function closePolishPanel() {
    document.getElementById('polishPanel').classList.remove('active');
}

// ============================================
// 哼唱输入处理
// ============================================
async function toggleRecord() {
    if (app.isRecording) {
        stopRecording();
    } else {
        await startRecording();
    }
}

async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        app.mediaRecorder = new MediaRecorder(stream);
        app.audioChunks = [];

        app.mediaRecorder.ondataavailable = (e) => app.audioChunks.push(e.data);

        app.mediaRecorder.onstop = () => {
            const audioBlob = new Blob(app.audioChunks, { type: 'audio/webm' });
            const duration = (Date.now() - app.recordStartTime) / 1000;
            app.inputData.hum = { blob: audioBlob, duration: duration };
            stream.getTracks().forEach(track => track.stop());
            updateGenerateButton();
        };

        app.mediaRecorder.start();
        app.isRecording = true;
        app.recordStartTime = Date.now();

        const recordBtn = document.getElementById('recordBtn');
        const recordStatus = document.getElementById('recordStatus');
        recordBtn.classList.add('recording');
        recordStatus.textContent = '录制中...点击停止';

        app.recordTimer = setInterval(updateRecordTimer, 100);
        startWaveformAnimation();

        setTimeout(() => {
            if (app.isRecording) {
                stopRecording();
                showToast('已达到最长录制时间');
            }
        }, 30000);

    } catch (err) {
        console.error('录音失败:', err);
        showToast('无法访问麦克风，请检查权限设置');
    }
}

function stopRecording() {
    if (app.mediaRecorder && app.isRecording) {
        app.mediaRecorder.stop();
        app.isRecording = false;

        const recordBtn = document.getElementById('recordBtn');
        const recordStatus = document.getElementById('recordStatus');
        recordBtn.classList.remove('recording');
        recordStatus.textContent = '录制完成，可重新录制';

        clearInterval(app.recordTimer);
        stopWaveformAnimation();
    }
}

function updateRecordTimer() {
    const elapsed = (Date.now() - app.recordStartTime) / 1000;
    const minutes = Math.floor(elapsed / 60);
    const seconds = Math.floor(elapsed % 60);
    document.getElementById('recordTimer').textContent =
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

let waveformAnimationId = null;
let waveformTime = 0;
function startWaveformAnimation() {
    const canvas = document.getElementById('waveformCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    waveformTime = 0;

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const barCount = 32;
        const barWidth = canvas.width / barCount - 3;
        const centerY = canvas.height / 2;

        waveformTime += 0.06;

        for (let i = 0; i < barCount; i++) {
            // 多层正弦波叠加，营造自然起伏
            const phase = i * 0.35;
            const wave1 = Math.sin(waveformTime + phase) * 18;
            const wave2 = Math.sin(waveformTime * 1.3 + phase * 0.7) * 12;
            const wave3 = Math.sin(waveformTime * 0.7 + phase * 1.5) * 8;
            const height = Math.max(6, Math.abs(wave1 + wave2 + wave3) + 14);
            const x = i * (barWidth + 3);
            const y = centerY - height / 2;

            // 中心向两侧渐变透明度
            const dist = Math.abs(i - barCount / 2) / (barCount / 2);
            const alpha = 0.4 + (1 - dist) * 0.6;
            ctx.fillStyle = `rgba(4, 120, 87, ${alpha})`;
            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, height, barWidth / 2);
            ctx.fill();
        }
        waveformAnimationId = requestAnimationFrame(animate);
    }
    animate();
}

function stopWaveformAnimation() {
    if (waveformAnimationId) {
        cancelAnimationFrame(waveformAnimationId);
        waveformAnimationId = null;
    }
    const canvas = document.getElementById('waveformCanvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}

// ============================================
// 图片输入处理
// ============================================
function triggerImageUpload() {
    document.getElementById('imageInput').click();
}

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
        showToast('仅支持JPG/PNG格式');
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        showToast('图片过大，请选择5MB以内的图片');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        app.inputData.image = { file: file, preview: e.target.result };
        document.getElementById('previewImg').src = e.target.result;
        document.getElementById('imageUploadArea').style.display = 'none';
        document.getElementById('imagePreview').style.display = 'block';
        updateGenerateButton();
    };
    reader.readAsDataURL(file);
}

function removeImage() {
    app.inputData.image = null;
    document.getElementById('imageUploadArea').style.display = 'block';
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('imageInput').value = '';
    updateGenerateButton();
}

// ============================================
// 生成按钮状态
// ============================================
function updateGenerateButton() {
    const btn = document.getElementById('generateBtn');
    if (!btn) return;
    let hasInput = false;

    if (app.currentMode === 'text') {
        hasInput = app.inputData.text.trim().length > 0;
    } else if (app.currentMode === 'hum') {
        hasInput = app.inputData.hum !== null && app.inputData.hum.duration >= 3;
    } else if (app.currentMode === 'image') {
        hasInput = app.inputData.image !== null;
    }

    btn.disabled = !hasInput || app.dailyQuota.count >= app.dailyQuota.limit;
}

function updateQuotaDisplay() {
    const remaining = app.dailyQuota.limit - app.dailyQuota.count;
    const quotaEl = document.getElementById('quotaCount');
    const navQuotaEl = document.getElementById('navQuotaCount');
    if (quotaEl) quotaEl.textContent = remaining;
    if (navQuotaEl) navQuotaEl.textContent = remaining;
}

// ============================================
// AI 生成流程
// ============================================
function startGenerate() {
    if (app.dailyQuota.count >= app.dailyQuota.limit) {
        showToast('今日创作次数已用完，明天再来吧');
        return;
    }

    if (app.currentMode === 'hum' && app.inputData.hum && app.inputData.hum.duration < 3) {
        showToast('至少录制3秒，请重试');
        return;
    }

    navigate('generating');
    app.isGenerating = true;
    app.generateProgress = 0;
    simulateGeneration();
}

function simulateGeneration() {
    const stages = [
        { progress: 15, text: '正在分析情绪中...' },
        { progress: 30, text: '提取场景元素...' },
        { progress: 50, text: '匹配音乐风格...' },
        { progress: 75, text: '生成旋律片段...' },
        { progress: 90, text: '优化和声结构...' },
        { progress: 100, text: '即将完成...' }
    ];

    let currentStage = 0;
    const stageTextEl = document.getElementById('stageText');

    app.generateTimer = setInterval(() => {
        if (currentStage < stages.length) {
            const stage = stages[currentStage];
            app.generateProgress = stage.progress;

            stageTextEl.style.opacity = '0';
            setTimeout(() => {
                stageTextEl.textContent = stage.text;
                stageTextEl.style.opacity = '1';
            }, 200);

            document.getElementById('progressFill').style.width = `${stage.progress}%`;
            document.getElementById('progressText').textContent = `${stage.progress}%`;
            currentStage++;
        } else {
            clearInterval(app.generateTimer);
            completeGeneration();
        }
    }, 1800);
}

function completeGeneration() {
    app.isGenerating = false;
    app.dailyQuota.count++;
    saveQuota();
    updateQuotaDisplay();

    const result = generateMockResult();
    app.currentResult = result;

    // 更新用户统计
    app.user.totalWorks++;
    app.user.monthWorks++;
    app.user.weekWorks++;

    const today = new Date().toISOString().split('T')[0];
    if (!app.user.creationDates.includes(today)) {
        app.user.creationDates.push(today);
    }
    calculateStreak();

    result.emotionTags.forEach(tag => {
        app.user.emotionStats[tag] = (app.user.emotionStats[tag] || 0) + 1;
    });
    saveUser();

    renderResultPage(result);
    navigate('result');
    showToast('生成完成，快来试听吧', ICONS.sparkles);
}

function cancelGenerate() {
    if (app.generateTimer) clearInterval(app.generateTimer);
    app.isGenerating = false;
    navigate('create');
    showToast('已取消生成');
}

// ============================================
// 生成模拟结果
// ============================================
function generateMockResult() {
    let emotionTags = [];
    let emotionEmoji = ICONS.music;

    if (app.currentMode === 'text') {
        const text = app.inputData.text.toLowerCase();
        if (text.includes('温柔') || text.includes('温暖') || text.includes('暖')) emotionTags.push('温柔');
        if (text.includes('悲伤') || text.includes('孤独') || text.includes('寂寞')) emotionTags.push('孤独');
        if (text.includes('快乐') || text.includes('开心')) emotionTags.push('快乐');
        if (text.includes('平静') || text.includes('安静') || text.includes('宁静')) emotionTags.push('宁静');
        if (text.includes('回忆') || text.includes('怀念') || text.includes('曾经')) emotionTags.push('回忆');
        if (text.includes('自由') || text.includes('旅行')) emotionTags.push('自由');
        if (text.includes('希望') || text.includes('期待')) emotionTags.push('希望');
        if (text.includes('热闹') || text.includes('欢乐')) emotionTags.push('热闹');

        if (emotionTags.length === 0) emotionTags = ['温柔', '宁静'];
        emotionEmoji = ICONS.text;
    } else if (app.currentMode === 'hum') {
        emotionTags = ['自由', '温柔'];
        emotionEmoji = ICONS.mic;
    } else if (app.currentMode === 'image') {
        emotionTags = ['宁静', '回忆'];
        emotionEmoji = ICONS.image;
    }

    const now = new Date();
    const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
    const title = `${emotionTags[0]} ${timeStr}`;

    const styleMap = {
        auto: [
            { title: '记录版', style: '原声简约' },
            { title: '分享版', style: '流行明亮' },
            { title: '放松版', style: '氛围舒缓' }
        ],
        lofi: [
            { title: '记录版', style: 'Lo-fi 简约' },
            { title: '分享版', style: 'Lo-fi 节奏' },
            { title: '放松版', style: 'Lo-fi 氛围' }
        ],
        ambient: [
            { title: '记录版', style: '氛围简约' },
            { title: '分享版', style: '电子明亮' },
            { title: '放松版', style: '深度氛围' }
        ],
        pop: [
            { title: '记录版', style: '原声流行' },
            { title: '分享版', style: '电子流行' },
            { title: '放松版', style: '慢板流行' }
        ]
    };

    const currentStyleMap = styleMap[app.currentStyle] || styleMap.auto;

    const versions = [
        { id: 'v1', title: `${title} · ${currentStyleMap[0].title}`, style: currentStyleMap[0].style, duration: '0:45', durationSec: 45, saved: false },
        { id: 'v2', title: `${title} · ${currentStyleMap[1].title}`, style: currentStyleMap[1].style, duration: '0:38', durationSec: 38, saved: false },
        { id: 'v3', title: `${title} · ${currentStyleMap[2].title}`, style: currentStyleMap[2].style, duration: '0:52', durationSec: 52, saved: false }
    ];

    return {
        id: `work_${Date.now()}`,
        title: title,
        emotionTags: emotionTags,
        emotionEmoji: emotionEmoji,
        versions: versions,
        inputMode: app.currentMode,
        inputStyle: app.currentStyle,
        createdAt: new Date().toISOString(),
        inputContent: app.currentMode === 'text' ? app.inputData.text :
            app.currentMode === 'image' ? app.inputData.image?.preview : null,
        coverImage: app.currentMode === 'image' ? app.inputData.image?.preview : null
    };
}

// ============================================
// 风格切换
// ============================================
function applyStyleChange() {
    if (!app.currentResult) return;
    showToast('正在切换风格，请稍候...', ICONS.sparkles);

    setTimeout(() => {
        const styleMap = {
            auto: [{ s: '原声简约' }, { s: '流行明亮' }, { s: '氛围舒缓' }],
            lofi: [{ s: 'Lo-fi 简约' }, { s: 'Lo-fi 节奏' }, { s: 'Lo-fi 氛围' }],
            ambient: [{ s: '氛围简约' }, { s: '电子明亮' }, { s: '深度氛围' }],
            pop: [{ s: '原声流行' }, { s: '电子流行' }, { s: '慢板流行' }]
        };
        const sm = styleMap[app.currentStyle] || styleMap.auto;

        app.currentResult.versions.forEach((v, i) => {
            v.style = sm[i].s;
            v.saved = false;
        });

        renderResultPage(app.currentResult);
        showToast('风格已切换', ICONS.sparkles);
    }, 800);
}

// ============================================
// 结果页渲染
// ============================================
function renderResultPage(result) {
    const emotionTags = document.getElementById('emotionTags');
    emotionTags.innerHTML = result.emotionTags.map(tag =>
        `<span class="emotion-tag">${tag}</span>`
    ).join('');

    const iconInfo = getEmotionIcon(result.emotionTags[0]);
    const coverImg = result.coverImage;
    const coverHtml = coverImg
        ? `<img class="version-cover-img" src="${coverImg}" alt="封面"><div class="version-cover-change" onclick="app.uploadResultCover(event)"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg></div>`
        : `<div class="version-cover-default" style="background:linear-gradient(135deg, ${iconInfo.color}, ${iconInfo.color}cc)">${iconInfo.icon}<button class="version-cover-upload" onclick="app.uploadResultCover(event)"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>上传封面</button></div>`;

    const versionList = document.getElementById('versionList');
    versionList.innerHTML = `
        <div class="result-cover-block">
            <div class="result-cover-label">作品封面</div>
            <div class="version-cover">${coverHtml}</div>
        </div>
    ` + result.versions.map(version => `
        <div class="version-card" data-version-id="${version.id}">
            <div class="version-header">
                <div class="version-title">${escapeHtml(version.title)}</div>
                <div class="version-style">${version.style}</div>
            </div>
            <div class="waveform-bar">
                <button class="play-btn" onclick="app.togglePlay('${version.id}')" aria-label="播放">
                    ${ICONS.play}
                </button>
                <div class="waveform-visual" id="waveform-${version.id}">
                    ${generateWaveformBars()}
                </div>
                <div class="version-duration">${version.duration}</div>
            </div>
            <div class="version-actions">
                <button class="version-action-btn ${version.saved ? 'saved' : ''}" onclick="app.saveVersion('${version.id}')">
                    ${version.saved ? ICONS.bookmarkCheck + ' 已保存' : ICONS.bookmark + ' 保存'}
                </button>
                <button class="version-action-btn" onclick="app.shareVersion('${version.id}')">
                    ${ICONS.share} 分享
                </button>
            </div>
        </div>
    `).join('');
}

// 上传作品封面
function uploadResultCover(event) {
    if (event) event.stopPropagation();
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/jpg';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            showToast('图片不能超过 5MB');
            return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
            if (app.currentResult) {
                app.currentResult.coverImage = ev.target.result;
                renderResultPage(app.currentResult);
                showToast('封面已更新');
            }
        };
        reader.readAsDataURL(file);
    };
    input.click();
}

function generateWaveformBars() {
    let bars = '';
    for (let i = 0; i < 30; i++) {
        const height = Math.random() * 24 + 8;
        bars += `<div class="wave-bar" style="height: ${height}px"></div>`;
    }
    return bars;
}

// ============================================
// 播放控制
// ============================================
function togglePlay(versionId) {
    const playBtn = document.querySelector(`[data-version-id="${versionId}"] .play-btn`);
    const waveform = document.getElementById(`waveform-${versionId}`);
    if (!playBtn || !waveform) return;
    const bars = waveform.querySelectorAll('.wave-bar');

    if (app.currentPlaying === versionId) {
        stopPlay(versionId);
        return;
    }

    if (app.currentPlaying) {
        stopPlay(app.currentPlaying);
    }

    app.currentPlaying = versionId;
    playBtn.innerHTML = ICONS.pause;
    playBtn.classList.add('playing');

    let currentBar = 0;
    app.playTimers[versionId] = setInterval(() => {
        if (currentBar < bars.length) {
            bars[currentBar].classList.add('active');
            currentBar++;
        } else {
            stopPlay(versionId);
        }
    }, 200);
}

function stopPlay(versionId) {
    const playBtn = document.querySelector(`[data-version-id="${versionId}"] .play-btn`);
    const waveform = document.getElementById(`waveform-${versionId}`);
    if (!playBtn || !waveform) return;
    const bars = waveform.querySelectorAll('.wave-bar');

    if (app.playTimers[versionId]) {
        clearInterval(app.playTimers[versionId]);
        delete app.playTimers[versionId];
    }

    playBtn.innerHTML = ICONS.play;
    playBtn.classList.remove('playing');
    bars.forEach(bar => bar.classList.remove('active'));

    if (app.currentPlaying === versionId) {
        app.currentPlaying = null;
    }
}

// ============================================
// 保存版本
// ============================================
function saveVersion(versionId) {
    if (!app.currentResult) return;
    const version = app.currentResult.versions.find(v => v.id === versionId);
    if (!version) return;

    if (version.saved) {
        showToast('已在音乐库中');
        return;
    }

    const work = {
        id: `${app.currentResult.id}_${versionId}`,
        title: version.title,
        style: version.style,
        duration: version.duration,
        durationSec: version.durationSec,
        emotionTags: app.currentResult.emotionTags,
        emotionEmoji: app.currentResult.emotionEmoji,
        inputMode: app.currentResult.inputMode,
        inputStyle: app.currentResult.inputStyle,
        createdAt: app.currentResult.createdAt,
        inputContent: app.currentResult.inputContent,
        coverImage: app.currentResult.coverImage || null,
        savedAt: new Date().toISOString()
    };

    app.library.unshift(work);
    saveLibrary();

    version.saved = true;
    const btn = document.querySelector(`[data-version-id="${versionId}"] .version-action-btn`);
    if (btn) {
        btn.innerHTML = ICONS.bookmarkCheck + ' 已保存';
        btn.classList.add('saved');
    }

    showToast('已保存到音乐库', ICONS.bookmarkCheck);
}

// ============================================
// 分享功能
// ============================================
function shareVersion(versionId) {
    if (!app.currentResult) return;
    const version = app.currentResult.versions.find(v => v.id === versionId);
    if (!version) return;

    document.getElementById('sharePreviewTitle').textContent = version.title;
    const tagsEl = document.getElementById('sharePreviewTags');
    tagsEl.innerHTML = app.currentResult.emotionTags.map(tag =>
        `<span class="share-preview-tag">${tag}</span>`
    ).join('');

    const coverEl = document.getElementById('sharePreviewCover');
    const iconInfo = getEmotionIcon(app.currentResult.emotionTags[0]);
    coverEl.style.background = iconInfo.color;
    coverEl.innerHTML = iconInfo.icon;

    document.getElementById('sharePanel').classList.add('active');
}

function closeSharePanel() {
    document.getElementById('sharePanel').classList.remove('active');
}

function shareToFriend() {
    closeSharePanel();
    showToast('已分享给微信好友', ICONS.share);
}

function shareToTimeline() {
    closeSharePanel();
    showToast('已分享到朋友圈', ICONS.share);
}

function saveShareImage() {
    closeSharePanel();
    showToast('分享卡片已保存到相册', ICONS.download);
}

// ============================================
// 重新生成与再创作
// ============================================
function regenerate() {
    showConfirm('重新生成', '确定重新生成？当前结果将不会保存', () => {
        navigate('create');
        setTimeout(() => startGenerate(), 300);
    });
}

function newCreation() {
    navigate('create');
    resetCreatePage();
}

function resetCreatePage() {
    app.inputData = { text: '', hum: null, image: null };

    document.getElementById('textInput').value = '';
    document.getElementById('charCount').textContent = '0';
    document.getElementById('recordTimer').textContent = '00:00';
    document.getElementById('recordStatus').textContent = '点击开始录制';

    removeImage();
    switchMode('text');
    updateGenerateButton();
}

// ============================================
// 音乐库
// ============================================
function renderLibraryWithSkeleton() {
    const libraryContent = document.getElementById('libraryContent');
    libraryContent.innerHTML = '';

    for (let i = 0; i < 4; i++) {
        libraryContent.innerHTML += `
            <div class="skeleton-track">
                <div class="skeleton-circle"></div>
                <div class="skeleton-lines">
                    <div class="skeleton-line"></div>
                    <div class="skeleton-line short"></div>
                </div>
            </div>
        `;
    }

    setTimeout(() => renderLibrary(), 600);
}

function renderLibrary() {
    const libraryContent = document.getElementById('libraryContent');

    let filtered = app.library;
    if (app.currentFilter !== 'all') {
        filtered = filtered.filter(w => w.inputMode === app.currentFilter);
    }
    if (app.searchKeyword) {
        const kw = app.searchKeyword.toLowerCase();
        filtered = filtered.filter(w =>
            w.title.toLowerCase().includes(kw) ||
            (w.emotionTags && w.emotionTags.some(t => t.toLowerCase().includes(kw)))
        );
    }

    if (app.library.length === 0) {
        libraryContent.innerHTML = `
            <div class="library-empty">
                <div class="empty-icon">
                    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
                </div>
                <div class="empty-text">还没有作品，去创作第一首吧</div>
                <button class="empty-btn" onclick="app.navigate('create')">开始创作</button>
            </div>
        `;
        return;
    }

    if (filtered.length === 0) {
        libraryContent.innerHTML = `
            <div class="library-empty">
                <div class="empty-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                </div>
                <div class="empty-text">没有找到匹配的作品</div>
            </div>
        `;
        return;
    }

    libraryContent.innerHTML = filtered.map(work => {
        const iconInfo = getEmotionIcon(work.emotionTags[0]);
        const coverHtml = work.coverImage
            ? `<img class="track-cover-img" src="${work.coverImage}" alt="${escapeHtml(work.title)}" onerror="this.style.display='none'">`
            : iconInfo.icon;
        return `
            <div class="library-track" onclick="app.viewWorkDetail('${work.id}')">
                <div class="track-cover" style="background:${iconInfo.color}">
                    ${coverHtml}
                </div>
                <div class="track-info">
                    <div class="track-title">${escapeHtml(work.title)}</div>
                    <div class="track-meta">
                        <span>${work.style}</span>
                        <span>${work.duration}</span>
                        ${work.emotionTags && work.emotionTags[0] ? `<span>${work.emotionTags[0]}</span>` : ''}
                    </div>
                </div>
                <button class="track-play-btn" onclick="event.stopPropagation(); app.playLibraryTrack('${work.id}')" aria-label="播放">
                    ${ICONS.play}
                </button>
            </div>
        `;
    }).join('');
}

function playLibraryTrack(workId) {
    const track = document.querySelector(`.library-track[onclick*="${workId}"] .track-play-btn`);
    if (!track) return;

    if (track.innerHTML.includes('pause')) {
        track.innerHTML = ICONS.play;
        track.classList.remove('playing');
        if (app.playTimers[workId]) {
            clearInterval(app.playTimers[workId]);
            delete app.playTimers[workId];
        }
        return;
    }

    document.querySelectorAll('.track-play-btn').forEach(btn => {
        btn.innerHTML = ICONS.play;
        btn.classList.remove('playing');
    });
    Object.keys(app.playTimers).forEach(id => {
        clearInterval(app.playTimers[id]);
        delete app.playTimers[id];
    });

    track.innerHTML = ICONS.pause;
    track.classList.add('playing');
    showToast('正在播放', ICONS.play);

    app.playTimers[workId] = setTimeout(() => {
        track.innerHTML = ICONS.play;
        track.classList.remove('playing');
        delete app.playTimers[workId];
    }, 30000);
}

// ============================================
// 搜索
// ============================================
let searchTimer = null;
function onSearch(value) {
    app.searchKeyword = value.trim();
    const clearBtn = document.getElementById('searchClear');
    clearBtn.style.display = value ? 'flex' : 'none';

    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
        renderLibrary();
    }, 300);
}

function clearSearch() {
    document.getElementById('searchInput').value = '';
    app.searchKeyword = '';
    document.getElementById('searchClear').style.display = 'none';
    renderLibrary();
}

// ============================================
// 作品详情页
// ============================================
function viewWorkDetail(workId) {
    const work = app.library.find(w => w.id === workId);
    if (!work) {
        showToast('作品不存在');
        return;
    }

    app.currentDetailWork = work;
    renderDetailPage(work);
    navigate('detail');
}

function renderDetailPage(work) {
    const container = document.getElementById('detailContainer');
    const iconInfo = getEmotionIcon(work.emotionTags[0]);
    const modeText = { text: '文字输入', hum: '哼唱输入', image: '图片输入' }[work.inputMode] || '文字输入';
    const createdDate = new Date(work.createdAt);
    const dateStr = `${createdDate.getFullYear()}-${(createdDate.getMonth() + 1).toString().padStart(2, '0')}-${createdDate.getDate().toString().padStart(2, '0')} ${createdDate.getHours().toString().padStart(2, '0')}:${createdDate.getMinutes().toString().padStart(2, '0')}`;

    let coverHtml = '';
    if (work.inputMode === 'image' && work.inputContent) {
        coverHtml = `<img class="detail-cover-img" src="${work.inputContent}" alt="封面">`;
    } else {
        coverHtml = `<div class="detail-cover" style="background:${iconInfo.color}">${iconInfo.icon}</div>`;
    }

    let inputContentHtml = '';
    if (work.inputMode === 'text' && work.inputContent) {
        inputContentHtml = `<div class="detail-info-value">${escapeHtml(work.inputContent)}</div>`;
    } else if (work.inputMode === 'image') {
        inputContentHtml = `<div class="detail-info-value">已上传图片</div>`;
    } else {
        inputContentHtml = `<div class="detail-info-value">哼唱录制 ${work.duration}</div>`;
    }

    container.innerHTML = `
        ${coverHtml}
        <div class="detail-player">
            <div class="detail-title">${escapeHtml(work.title)}</div>
            <div class="detail-subtitle">${work.style} · ${work.duration}</div>
            <div class="detail-waveform">
                <button class="play-btn" id="detailPlayBtn" onclick="app.toggleDetailPlay()" aria-label="播放">
                    ${ICONS.play}
                </button>
                <div class="waveform-visual" id="detailWaveform">
                    ${generateWaveformBars()}
                </div>
            </div>
            <div class="detail-progress-info">
                <span id="detailCurrentTime">0:00</span>
                <span>${work.duration}</span>
            </div>
        </div>
        <div class="detail-info">
            <div class="detail-info-row">
                <div class="detail-info-label">情绪标签</div>
                <div class="detail-info-tags">
                    ${work.emotionTags.map(tag => `<span class="emotion-tag">${tag}</span>`).join('')}
                </div>
            </div>
            <div class="detail-info-row">
                <div class="detail-info-label">输入方式</div>
                <div class="detail-info-value">${modeText}</div>
            </div>
            <div class="detail-info-row">
                <div class="detail-info-label">创作时间</div>
                <div class="detail-info-value">${dateStr}</div>
            </div>
            <div class="detail-info-row">
                <div class="detail-info-label">原始输入</div>
                ${inputContentHtml}
            </div>
        </div>
        <div class="detail-actions">
            <button class="detail-action-btn" onclick="app.editDetailTitle()">
                ${ICONS.edit} 编辑标题
            </button>
            <button class="detail-action-btn" onclick="app.shareDetailWork()">
                ${ICONS.share} 分享
            </button>
            <button class="detail-action-btn" onclick="app.exportDetailWork()">
                ${ICONS.download} 导出
            </button>
            <button class="detail-action-btn danger" onclick="app.deleteDetailWork()">
                ${ICONS.trash} 删除
            </button>
        </div>
    `;
}

let detailPlayTimer = null;
function toggleDetailPlay() {
    const btn = document.getElementById('detailPlayBtn');
    const waveform = document.getElementById('detailWaveform');
    if (!btn || !waveform) return;
    const bars = waveform.querySelectorAll('.wave-bar');
    const timeEl = document.getElementById('detailCurrentTime');

    if (btn.innerHTML.includes('pause')) {
        btn.innerHTML = ICONS.play;
        btn.classList.remove('playing');
        if (detailPlayTimer) {
            clearInterval(detailPlayTimer);
            detailPlayTimer = null;
        }
        return;
    }

    btn.innerHTML = ICONS.pause;
    btn.classList.add('playing');

    let currentBar = 0;
    bars.forEach(b => b.classList.remove('active'));

    detailPlayTimer = setInterval(() => {
        if (currentBar < bars.length) {
            bars[currentBar].classList.add('active');
            currentBar++;
            const sec = Math.floor((currentBar / bars.length) * (app.currentDetailWork?.durationSec || 45));
            const m = Math.floor(sec / 60);
            const s = sec % 60;
            timeEl.textContent = `${m}:${s.toString().padStart(2, '0')}`;
        } else {
            btn.innerHTML = ICONS.play;
            btn.classList.remove('playing');
            bars.forEach(b => b.classList.remove('active'));
            timeEl.textContent = '0:00';
            clearInterval(detailPlayTimer);
            detailPlayTimer = null;
        }
    }, 200);
}

function editDetailTitle() {
    if (!app.currentDetailWork) return;
    const oldTitle = app.currentDetailWork.title;
    showInputModal('编辑标题', oldTitle, 30, '请输入新标题', (newTitle) => {
        if (!newTitle) {
            showToast('标题不能为空');
            return;
        }
        if (newTitle.length > 30) {
            showToast('标题不能超过30个字符');
            return;
        }
        app.currentDetailWork.title = newTitle;
        const idx = app.library.findIndex(w => w.id === app.currentDetailWork.id);
        if (idx >= 0) {
            app.library[idx].title = newTitle;
            saveLibrary();
        }
        renderDetailPage(app.currentDetailWork);
        showToast('标题已更新', ICONS.edit);
    });
}

function shareDetailWork() {
    if (!app.currentDetailWork) return;
    const work = app.currentDetailWork;

    document.getElementById('sharePreviewTitle').textContent = work.title;
    const tagsEl = document.getElementById('sharePreviewTags');
    tagsEl.innerHTML = work.emotionTags.map(tag =>
        `<span class="share-preview-tag">${tag}</span>`
    ).join('');

    const coverEl = document.getElementById('sharePreviewCover');
    const iconInfo = getEmotionIcon(work.emotionTags[0]);
    coverEl.style.background = iconInfo.color;
    coverEl.innerHTML = iconInfo.icon;

    document.getElementById('sharePanel').classList.add('active');
}

function exportDetailWork() {
    showToast('导出功能开发中（模拟：已导出MP3）', ICONS.download);
}

function deleteDetailWork() {
    showConfirm('删除作品', '确定删除这个作品吗？删除后不可恢复', () => {
        const idx = app.library.findIndex(w => w.id === app.currentDetailWork.id);
        if (idx >= 0) {
            app.library.splice(idx, 1);
            saveLibrary();
        }
        showToast('作品已删除', ICONS.trash);
        navigate('library');
    });
}

function openDetailMore() {
    if (!app.currentDetailWork) return;
    const options = document.getElementById('actionOptions');
    options.innerHTML = `
        <div class="action-option" onclick="app.editDetailTitle(); app.closeActionPanel();">
            <span class="action-option-icon">${ICONS.edit}</span>
            编辑标题
        </div>
        <div class="action-option" onclick="app.shareDetailWork(); app.closeActionPanel();">
            <span class="action-option-icon">${ICONS.share}</span>
            分享作品
        </div>
        <div class="action-option" onclick="app.exportDetailWork(); app.closeActionPanel();">
            <span class="action-option-icon">${ICONS.download}</span>
            导出音频
        </div>
        <div class="action-option danger" onclick="app.deleteDetailWork(); app.closeActionPanel();">
            <span class="action-option-icon">${ICONS.trash}</span>
            删除作品
        </div>
    `;
    document.getElementById('actionPanel').classList.add('active');
}

function closeActionPanel() {
    document.getElementById('actionPanel').classList.remove('active');
}

// ============================================
// 个人中心
// ============================================
function renderProfile() {
    // 动态计算统计（基于 library 实际数据）
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);

    app.user.totalWorks = app.library.length;
    app.user.monthWorks = app.library.filter(w => new Date(w.createdAt) >= monthStart).length;
    app.user.weekWorks = app.library.filter(w => new Date(w.createdAt) >= weekAgo).length;
    app.user.creationDates = [...new Set(app.library.map(w => new Date(w.createdAt).toISOString().split('T')[0]))];
    calculateStreak();

    document.getElementById('statTotal').textContent = app.user.totalWorks;
    document.getElementById('statMonth').textContent = app.user.monthWorks;
    document.getElementById('statWeek').textContent = app.user.weekWorks;
    document.getElementById('statStreak').textContent = app.user.streakDays;

    // 音乐库入口数量描述
    const libDesc = document.getElementById('libraryCountDesc');
    if (libDesc) {
        libDesc.textContent = app.library.length > 0
            ? `共 ${app.library.length} 首专属BGM`
            : '管理你的专属BGM作品';
    }

    renderHeatmap();
    renderEmotionChart();
    renderEmotionCloud();
}

function calculateStreak() {
    if (app.user.creationDates.length === 0) {
        app.user.streakDays = 0;
        return;
    }
    const dates = app.user.creationDates.sort();
    const today = new Date();
    let streak = 0;
    let checkDate = new Date(today);

    for (let i = 0; i < 30; i++) {
        const dateStr = checkDate.toISOString().split('T')[0];
        if (dates.includes(dateStr)) {
            streak++;
        } else if (i > 0) {
            break;
        }
        checkDate.setDate(checkDate.getDate() - 1);
    }
    app.user.streakDays = streak;
}

function renderHeatmap() {
    const container = document.getElementById('heatmapContainer');
    const today = new Date();

    // 初始化日历月份（当前月）
    if (!app.calendarMonth) {
        app.calendarMonth = { year: today.getFullYear(), month: today.getMonth() };
    }
    const { year, month } = app.calendarMonth;
    const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

    // 计算当月天数、第一天星期几
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayWeek = new Date(year, month, 1).getDay(); // 0=周日
    const prevMonthDays = new Date(year, month, 0).getDate();

    // 当月今日日期字符串
    const todayStr = today.toISOString().split('T')[0];

    // 统计当月创作数据
    let monthCount = 0;
    let monthActiveDays = 0;
    let monthMaxDay = 0;
    const dayCountMap = {};

    app.library.forEach(w => {
        const wd = new Date(w.createdAt);
        if (wd.getFullYear() === year && wd.getMonth() === month) {
            const day = wd.getDate();
            dayCountMap[day] = (dayCountMap[day] || 0) + 1;
            monthCount++;
            monthMaxDay = Math.max(monthMaxDay, dayCountMap[day]);
        }
    });
    monthActiveDays = Object.keys(dayCountMap).length;

    // 构建日期单元格
    const cells = [];

    // 上月填充
    for (let i = firstDayWeek - 1; i >= 0; i--) {
        const day = prevMonthDays - i;
        cells.push(`<div class="cal-day other-month"><span class="cal-day-num">${day}</span></div>`);
    }

    // 当月日期
    for (let day = 1; day <= daysInMonth; day++) {
        const dateObj = new Date(year, month, day);
        const dateStr = dateObj.toISOString().split('T')[0];
        const count = dayCountMap[day] || 0;
        const isToday = dateStr === todayStr;
        const isFuture = dateObj > today;

        let level = 0;
        if (count >= 4) level = 4;
        else if (count >= 3) level = 3;
        else if (count >= 2) level = 2;
        else if (count >= 1) level = 1;

        const classes = ['cal-day'];
        if (level > 0) classes.push('level-' + level);
        if (isToday) classes.push('today');
        if (isFuture) classes.push('future');

        const heatBg = level > 0 ? '<span class="cal-day-heat"></span>' : '';
        const badge = count > 0 ? `<span class="cal-day-badge">${count}</span>` : '';
        const title = count > 0 ? `${dateStr} · ${count}首作品` : dateStr;

        cells.push(`<div class="${classes.join(' ')}" title="${title}" ${!isFuture ? `onclick="app.showDayWorks('${dateStr}')"` : ''}>${heatBg}${badge}<span class="cal-day-num">${day}</span></div>`);
    }

    // 下月填充至 42 格（6 行）
    const remaining = 42 - cells.length;
    for (let day = 1; day <= remaining; day++) {
        cells.push(`<div class="cal-day other-month"><span class="cal-day-num">${day}</span></div>`);
    }

    // 星期表头
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    const weekHeaderHtml = weekDays.map((d, i) => {
        const weekend = (i === 0 || i === 6) ? ' weekend' : '';
        return `<div class="cal-week-day${weekend}">${d}</div>`;
    }).join('');

    // 是否允许向前/向后切换
    const canPrev = (year > 2020) || (year === 2020 && month > 0);
    const canNext = (year < today.getFullYear()) || (year === today.getFullYear() && month < today.getMonth());

    container.innerHTML = `
        <div class="heatmap-wrapper">
            <div class="cal-nav">
                <div class="cal-nav-title">
                    <span class="cal-nav-month">${monthNames[month]}</span>
                    <span class="cal-nav-year">${year}</span>
                </div>
                <div class="cal-nav-actions">
                    <button class="cal-nav-btn" onclick="app.changeMonth(-1)" aria-label="上个月" ${!canPrev ? 'disabled style="opacity:0.3;cursor:not-allowed"' : ''}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                    </button>
                    <button class="cal-nav-btn" onclick="app.changeMonth(1)" aria-label="下个月" ${!canNext ? 'disabled style="opacity:0.3;cursor:not-allowed"' : ''}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                    </button>
                </div>
            </div>
            <div class="cal-summary">
                <div class="cal-summary-item">
                    <span class="cal-summary-value">${monthCount}<span class="unit">首</span></span>
                    <span class="cal-summary-label">本月创作</span>
                </div>
                <div class="cal-summary-item">
                    <span class="cal-summary-value">${monthActiveDays}<span class="unit">天</span></span>
                    <span class="cal-summary-label">活跃天数</span>
                </div>
                <div class="cal-summary-item">
                    <span class="cal-summary-value">${monthMaxDay}<span class="unit">首</span></span>
                    <span class="cal-summary-label">单日最高</span>
                </div>
            </div>
            <div class="cal-week-header">${weekHeaderHtml}</div>
            <div class="cal-grid">${cells.join('')}</div>
            <div class="cal-legend">
                <span class="cal-legend-hint">每日创作热度</span>
                <div class="cal-legend-scale">
                    <span>少</span>
                    <span class="cal-legend-dot" style="background:var(--bg-soft)"></span>
                    <span class="cal-legend-dot" style="background:rgba(4,120,87,0.22)"></span>
                    <span class="cal-legend-dot" style="background:rgba(4,120,87,0.40)"></span>
                    <span class="cal-legend-dot" style="background:rgba(4,120,87,0.62)"></span>
                    <span class="cal-legend-dot" style="background:rgba(4,120,87,0.88)"></span>
                    <span>多</span>
                </div>
            </div>
        </div>
    `;
}

function changeMonth(delta) {
    let { year, month } = app.calendarMonth;
    month += delta;
    if (month < 0) { month = 11; year--; }
    if (month > 11) { month = 0; year++; }
    app.calendarMonth = { year, month };
    renderHeatmap();
}

function showDayWorks(dateStr) {
    const works = app.library.filter(w => {
        return new Date(w.createdAt).toISOString().split('T')[0] === dateStr;
    });
    if (works.length === 0) {
        showToast('这一天暂无作品');
        return;
    }
    const titles = works.slice(0, 3).map(w => w.title).join('、');
    showToast(`${dateStr.slice(5)} 共 ${works.length} 首：${titles}${works.length > 3 ? '…' : ''}`);
}

function renderEmotionChart() {
    const container = document.getElementById('emotionChart');
    const emotions = Object.entries(app.user.emotionStats).sort((a, b) => b[1] - a[1]);

    if (emotions.length === 0) {
        container.innerHTML = `<div class="pie-empty">还没有创作记录，快去创作吧</div>`;
        return;
    }

    const total = emotions.reduce((sum, [, count]) => sum + count, 0);

    let gradientParts = [];
    let cumulative = 0;
    emotions.forEach(([, count], idx) => {
        const percent = (count / total) * 100;
        gradientParts.push(`${CHART_COLORS[idx % CHART_COLORS.length]} ${cumulative}% ${cumulative + percent}%`);
        cumulative += percent;
    });

    const pieGradient = `conic-gradient(${gradientParts.join(', ')})`;

    let legendHtml = emotions.slice(0, 5).map(([emotion, count], idx) => {
        const percent = Math.round((count / total) * 100);
        return `
            <div class="pie-legend-item">
                <span class="pie-legend-dot" style="background:${CHART_COLORS[idx % CHART_COLORS.length]}"></span>
                <span class="pie-legend-text">${emotion}</span>
                <span class="pie-legend-value">${percent}%</span>
            </div>
        `;
    }).join('');

    container.innerHTML = `
        <div class="pie-chart" style="background:${pieGradient}"></div>
        <div class="pie-legend">${legendHtml}</div>
    `;
}

function renderEmotionCloud() {
    const container = document.getElementById('emotionCloud');
    const emotions = Object.entries(app.user.emotionStats).sort((a, b) => b[1] - a[1]);

    if (emotions.length === 0) {
        container.innerHTML = `<span class="emotion-cloud-empty">还没有创作记录</span>`;
        return;
    }

    container.innerHTML = emotions.map(([emotion, count], idx) => {
        const topClass = idx === 0 ? ' top' : '';
        return `<span class="emotion-cloud-item${topClass}" style="animation-delay:${idx * 0.06}s">${escapeHtml(emotion)}<span class="cloud-count">${count}</span></span>`;
    }).join('');
}

// ============================================
// 圈子社交模块
// ============================================
function renderCommunity() {
    const postList = document.getElementById('postList');

    // 同步 Tab 高亮
    document.querySelectorAll('.community-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === app.communityTab);
    });

    let posts = app.communityPosts.slice();

    if (app.communityTab === 'follow') {
        posts = posts.filter(p => app.followingUsers.includes(p.userId) || p.isOwn);
        if (posts.length === 0) {
            postList.innerHTML = `
                <div class="community-empty">
                    <div style="margin-bottom:8px;font-size:28px;color:var(--text-faint)">·</div>
                    还没有关注的人<br>去「推荐」发现更多创作者吧
                </div>
            `;
            return;
        }
    } else if (app.communityTab === 'hot') {
        posts.sort((a, b) => b.likes - a.likes);
    } else {
        // 推荐：按时间倒序
        posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    postList.innerHTML = posts.map(post => renderPostCard(post)).join('');

    // 异步加载帖子配图（仅有 imagePrompt 的）
    posts.forEach(post => {
        if (post.imagePrompt && !post.images.length) {
            const imgEl = document.getElementById(`postImg_${post.id}`);
            if (imgEl) loadImageFromApi(post.imagePrompt, imgEl);
        }
    });
}

function renderPostCard(post) {
    const followed = app.followingUsers.includes(post.userId);
    const moodHtml = post.mood ? `<div class="post-mood">${escapeHtml(post.mood)}</div>` : '';

    // BGM 卡片
    let bgmHtml = '';
    if (post.bgm) {
        const isPlaying = app.postBgmPlaying === post.id;
        bgmHtml = `
            <div class="post-bgm" onclick="app.togglePostBgm('${post.id}'); event.stopPropagation();">
                <button class="bgm-play ${isPlaying ? 'playing' : ''}" aria-label="播放BGM">
                    ${isPlaying ? ICONS.pause : ICONS.play}
                </button>
                <div class="bgm-info">
                    <div class="bgm-title">${escapeHtml(post.bgm.title)}</div>
                    <div class="bgm-progress-wrap" id="postWave_${post.id}">
                        <div class="bgm-wave-bg">${generateMiniWaveBars(isPlaying)}</div>
                        <div class="bgm-progress-fill" style="width:0%"></div>
                        <div class="bgm-progress-thumb"></div>
                    </div>
                </div>
                <div class="bgm-duration">${post.bgm.duration}</div>
            </div>
        `;
    }

    // 配图
    let imagesHtml = '';
    const hasApiImg = post.imagePrompt && !post.images.length;
    const allImages = post.images.slice();
    if (hasApiImg) allImages.push({ api: true, id: post.id });

    if (allImages.length === 1) {
        const img = allImages[0];
        const src = img.api ? '' : img.url;
        const idAttr = img.api ? `id="postImg_${post.id}"` : '';
        imagesHtml = `<div class="post-images one"><img class="post-img" ${idAttr} src="${src}" alt="配图"></div>`;
    } else if (allImages.length > 1) {
        imagesHtml = `<div class="post-images">${allImages.slice(0, 3).map(img => {
            const src = img.api ? '' : img.url;
            const idAttr = img.api ? `id="postImg_${post.id}"` : '';
            return `<img class="post-img" ${idAttr} src="${src}" alt="配图">`;
        }).join('')}</div>`;
    }

    // 关注按钮（自己的帖子不显示）
    const followBtn = post.isOwn ? '' : `
        <button class="follow-btn ${followed ? 'followed' : ''}" onclick="app.toggleFollow('${post.userId}'); event.stopPropagation();">
            ${followed ? '已关注' : '关注'}
        </button>
    `;

    // 评论区
    const commentsHtml = post.comments && post.comments.length ? `
        <div class="comment-list">
            ${post.comments.map(c => `
                <div class="comment-item">
                    <span class="comment-avatar" style="background:${c.userAvatarColor}">${escapeHtml(c.userInitial)}</span>
                    <div class="comment-body">
                        <span class="comment-name">${escapeHtml(c.userName)}</span>
                        <span class="comment-text">${escapeHtml(c.text)}</span>
                    </div>
                </div>
            `).join('')}
        </div>
    ` : '';

    const commentCount = post.comments ? post.comments.length : 0;

    return `
        <div class="post-card" data-post-id="${post.id}">
            <div class="post-head">
                <div class="post-avatar" style="background:${post.userAvatarColor}">${escapeHtml(post.userInitial)}</div>
                <div class="post-user">
                    <div class="post-name">${escapeHtml(post.userName)}${post.isOwn ? '<span style="color:var(--accent);font-size:11px;margin-left:4px">(我)</span>' : ''}</div>
                    <div class="post-time">${timeAgo(post.createdAt)}</div>
                </div>
                ${followBtn}
            </div>
            <div class="post-content">${escapeHtml(post.content)}</div>
            ${moodHtml}
            ${bgmHtml}
            ${imagesHtml}
            <div class="post-actions">
                <button class="post-action ${post.liked ? 'liked' : ''}" onclick="app.toggleLike('${post.id}'); event.stopPropagation();">
                    <span class="like-icon">${post.liked ? ICONS.heartFill : ICONS.heart}</span>
                    <span class="action-count">${post.likes}</span>
                </button>
                <button class="post-action" onclick="app.toggleComment('${post.id}'); event.stopPropagation();">
                    ${ICONS.comment}
                    <span class="action-count">${commentCount}</span>
                </button>
                <button class="post-action ${post.bookmarked ? 'bookmarked' : ''}" onclick="app.toggleBookmark('${post.id}'); event.stopPropagation();">
                    ${post.bookmarked ? ICONS.bookmarkCheck : ICONS.bookmark}
                    <span class="action-count">收藏</span>
                </button>
                <button class="post-action share" onclick="app.sharePost('${post.id}'); event.stopPropagation();">
                    ${ICONS.share}
                    <span>分享</span>
                </button>
            </div>
            <div class="post-comments" id="postComments_${post.id}">
                ${commentsHtml}
                <div class="comment-input-row">
                    <input type="text" class="comment-input" id="commentInput_${post.id}" placeholder="写下你的评论..." onkeydown="if(event.key==='Enter')app.sendComment('${post.id}')">
                    <button class="comment-send" onclick="app.sendComment('${post.id}')">${ICONS.send}</button>
                </div>
            </div>
        </div>
    `;
}

function generateMiniWaveBars(playing) {
    let bars = '';
    const count = 28;
    for (let i = 0; i < count; i++) {
        // 使用确定性的波形高度（基于正弦函数），避免每次渲染随机变化
        const h = Math.abs(Math.sin(i * 0.5) * 8) + Math.abs(Math.sin(i * 0.3 + 1) * 4) + 4;
        bars += `<div class="wave-bar" style="height:${h}px"></div>`;
    }
    return bars;
}

function switchCommunityTab(tab) {
    app.communityTab = tab;
    renderCommunity();
}

function toggleLike(postId) {
    const post = app.communityPosts.find(p => p.id === postId);
    if (!post) return;
    post.liked = !post.liked;
    post.likes += post.liked ? 1 : -1;
    saveCommunity();
    // 局部更新（避免重渲染打断动画）
    const card = document.querySelector(`[data-post-id="${postId}"]`);
    if (card) {
        const action = card.querySelector('.post-action');
        action.classList.toggle('liked', post.liked);
        action.querySelector('.like-icon').innerHTML = post.liked ? ICONS.heartFill : ICONS.heart;
        action.querySelector('.action-count').textContent = post.likes;
    }
}

function toggleFollow(userId) {
    const idx = app.followingUsers.indexOf(userId);
    if (idx >= 0) {
        app.followingUsers.splice(idx, 1);
        showToast('已取消关注');
    } else {
        app.followingUsers.push(userId);
        showToast('关注成功', ICONS.heartFill);
    }
    saveCommunity();
    renderCommunity();
}

function toggleBookmark(postId) {
    const post = app.communityPosts.find(p => p.id === postId);
    if (!post) return;
    post.bookmarked = !post.bookmarked;
    saveCommunity();
    const card = document.querySelector(`[data-post-id="${postId}"]`);
    if (card) {
        const actions = card.querySelectorAll('.post-action');
        const bookmarkBtn = actions[2];
        bookmarkBtn.classList.toggle('bookmarked', post.bookmarked);
        bookmarkBtn.innerHTML = (post.bookmarked ? ICONS.bookmarkCheck : ICONS.bookmark) + '<span class="action-count">收藏</span>';
    }
    showToast(post.bookmarked ? '已收藏' : '已取消收藏', post.bookmarked ? ICONS.bookmarkCheck : ICONS.bookmark);
}

function toggleComment(postId) {
    const comments = document.getElementById(`postComments_${postId}`);
    if (!comments) return;
    comments.classList.toggle('open');
    if (comments.classList.contains('open')) {
        const input = document.getElementById(`commentInput_${postId}`);
        if (input) setTimeout(() => input.focus(), 100);
    }
}

function sendComment(postId) {
    const input = document.getElementById(`commentInput_${postId}`);
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    const post = app.communityPosts.find(p => p.id === postId);
    if (!post) return;

    if (!post.comments) post.comments = [];
    post.comments.push({
        userId: 'me',
        userName: app.user.name,
        userInitial: '我',
        userAvatarColor: '#047857',
        text: text
    });

    saveCommunity();
    input.value = '';

    // 局部更新评论列表 + 计数
    const commentsEl = document.getElementById(`postComments_${postId}`);
    if (commentsEl) {
        let list = commentsEl.querySelector('.comment-list');
        if (!list) {
            list = document.createElement('div');
            list.className = 'comment-list';
            commentsEl.insertBefore(list, commentsEl.querySelector('.comment-input-row'));
        }
        const c = post.comments[post.comments.length - 1];
        list.insertAdjacentHTML('beforeend', `
            <div class="comment-item">
                <span class="comment-avatar" style="background:${c.userAvatarColor}">${escapeHtml(c.userInitial)}</span>
                <div class="comment-body">
                    <span class="comment-name">${escapeHtml(c.userName)}</span>
                    <span class="comment-text">${escapeHtml(c.text)}</span>
                </div>
            </div>
        `);
    }

    const card = document.querySelector(`[data-post-id="${postId}"]`);
    if (card) {
        const commentBtn = card.querySelectorAll('.post-action')[1];
        commentBtn.querySelector('.action-count').textContent = post.comments.length;
    }
    showToast('评论成功', ICONS.comment);
}

function sharePost(postId) {
    showToast('已复制分享链接', ICONS.share);
}

function togglePostBgm(postId) {
    const card = document.querySelector(`[data-post-id="${postId}"]`);
    if (!card) return;
    const postBgm = card.querySelector('.post-bgm');
    const playBtn = card.querySelector('.bgm-play');
    const progressWrap = card.querySelector('.bgm-progress-wrap');
    const waveBars = progressWrap ? progressWrap.querySelectorAll('.wave-bar') : [];

    if (app.postBgmPlaying === postId) {
        // 停止
        app.postBgmPlaying = null;
        playBtn.classList.remove('playing');
        playBtn.innerHTML = ICONS.play;
        if (postBgm) postBgm.classList.remove('playing');
        waveBars.forEach(b => b.classList.remove('played'));
        if (app.playTimers['post_' + postId]) {
            clearInterval(app.playTimers['post_' + postId]);
            delete app.playTimers['post_' + postId];
        }
        return;
    }

    // 停止其他
    if (app.postBgmPlaying) {
        const prevCard = document.querySelector(`[data-post-id="${app.postBgmPlaying}"]`);
        if (prevCard) {
            const pBtn = prevCard.querySelector('.bgm-play');
            const pBgm = prevCard.querySelector('.post-bgm');
            const pBars = prevCard.querySelectorAll('.wave-bar');
            pBtn.classList.remove('playing');
            pBtn.innerHTML = ICONS.play;
            if (pBgm) pBgm.classList.remove('playing');
            pBars.forEach(b => b.classList.remove('played'));
        }
        if (app.playTimers['post_' + app.postBgmPlaying]) {
            clearInterval(app.playTimers['post_' + app.postBgmPlaying]);
            delete app.playTimers['post_' + app.postBgmPlaying];
        }
    }

    app.postBgmPlaying = postId;
    playBtn.classList.add('playing');
    playBtn.innerHTML = ICONS.pause;
    if (postBgm) postBgm.classList.add('playing');

    // 波形条进度动画：根据进度更新已播放波形条
    let progress = 0;
    const totalBars = waveBars.length;
    app.playTimers['post_' + postId] = setInterval(() => {
        progress += 1;
        if (progress > 100) {
            progress = 0;
            waveBars.forEach(b => b.classList.remove('played'));
        }
        const playedCount = Math.floor(progress / 100 * totalBars);
        waveBars.forEach((b, i) => {
            if (i < playedCount) b.classList.add('played');
            else b.classList.remove('played');
        });
    }, 300);
}

// ============================================
// 发布帖子模块
// ============================================
function renderPublishMoods() {
    const row = document.getElementById('publishMoodRow');
    row.innerHTML = MOOD_LIST.map(mood => `
        <span class="publish-mood-chip" data-mood="${mood}" onclick="app.selectPublishMood('${mood}')">${mood}</span>
    `).join('');
}

function openPublishPanel() {
    // 重置状态
    app.publishState = { text: '', mood: '', bgm: null, image: null };
    document.getElementById('publishText').value = '';
    document.getElementById('publishBgmText').textContent = '从音乐库选择（可选）';
    document.getElementById('publishBgmSelect').classList.remove('selected');
    document.getElementById('publishImagePreview').innerHTML = '';
    document.getElementById('publishImageInput').value = '';
    document.querySelectorAll('.publish-mood-chip').forEach(c => c.classList.remove('active'));

    navigate('community');
    document.getElementById('publishPanel').classList.add('active');
}

function closePublishPanel() {
    document.getElementById('publishPanel').classList.remove('active');
}

function selectPublishMood(mood) {
    app.publishState.mood = app.publishState.mood === mood ? '' : mood;
    document.querySelectorAll('.publish-mood-chip').forEach(c => {
        c.classList.toggle('active', c.dataset.mood === app.publishState.mood);
    });
}

function openBgmPicker() {
    const list = document.getElementById('bgmPickerList');
    if (app.library.length === 0) {
        list.innerHTML = `<div class="bgm-picker-empty">音乐库还没有作品<br>去创作第一首吧</div>`;
    } else {
        list.innerHTML = app.library.map(work => {
            const iconInfo = getEmotionIcon(work.emotionTags[0]);
            const selected = app.publishState.bgm && app.publishState.bgm.id === work.id;
            return `
                <div class="bgm-picker-item ${selected ? 'selected' : ''}" onclick="app.selectBgm('${work.id}')">
                    <div class="bgm-picker-cover" style="background:${iconInfo.color}">${iconInfo.icon}</div>
                    <div class="bgm-picker-info">
                        <div class="bgm-picker-title">${escapeHtml(work.title)}</div>
                        <div class="bgm-picker-meta">${work.style} · ${work.duration}</div>
                    </div>
                </div>
            `;
        }).join('');
    }
    document.getElementById('bgmPickerPanel').classList.add('active');
}

function closeBgmPicker() {
    document.getElementById('bgmPickerPanel').classList.remove('active');
}

function selectBgm(workId) {
    const work = app.library.find(w => w.id === workId);
    if (!work) return;
    app.publishState.bgm = {
        id: work.id,
        title: work.title,
        style: work.style,
        duration: work.duration,
        emotionTags: work.emotionTags
    };
    document.getElementById('publishBgmText').textContent = work.title;
    document.getElementById('publishBgmSelect').classList.add('selected');
    closeBgmPicker();
}

function triggerPublishImage() {
    document.getElementById('publishImageInput').click();
}

function handlePublishImage(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
        showToast('仅支持JPG/PNG格式');
        return;
    }
    if (file.size > 5 * 1024 * 1024) {
        showToast('图片过大，请选择5MB以内的图片');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        app.publishState.image = e.target.result;
        const preview = document.getElementById('publishImagePreview');
        preview.innerHTML = `
            <div class="publish-image-thumb">
                <img src="${e.target.result}" alt="配图">
                <button class="publish-image-remove" onclick="app.removePublishImage()" aria-label="移除">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
            </div>
        `;
    };
    reader.readAsDataURL(file);
}

function removePublishImage() {
    app.publishState.image = null;
    document.getElementById('publishImagePreview').innerHTML = '';
    document.getElementById('publishImageInput').value = '';
}

function submitPost() {
    const text = document.getElementById('publishText').value.trim();
    if (!text) {
        showToast('请写点什么再发布吧');
        return;
    }

    const images = [];
    if (app.publishState.image) {
        images.push({ url: app.publishState.image });
    }

    const post = {
        id: `post_${Date.now()}`,
        userId: 'me',
        userName: app.user.name,
        userInitial: '我',
        userAvatarColor: '#047857',
        content: text,
        mood: app.publishState.mood,
        bgm: app.publishState.bgm,
        imagePrompt: null,
        images: images,
        likes: 0,
        liked: false,
        bookmarked: false,
        comments: [],
        createdAt: new Date().toISOString(),
        isOwn: true
    };

    app.communityPosts.unshift(post);
    saveCommunity();

    closePublishPanel();
    app.communityTab = 'recommend';
    renderCommunity();
    showToast('发布成功，分享你的灵感时刻', ICONS.sparkles);
}

// ============================================
// 时间格式化
// ============================================
function timeAgo(iso) {
    const now = Date.now();
    const then = new Date(iso).getTime();
    const diff = Math.max(0, now - then);
    const min = Math.floor(diff / 60000);
    if (min < 1) return '刚刚';
    if (min < 60) return `${min}分钟前`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}小时前`;
    const day = Math.floor(hr / 24);
    if (day < 7) return `${day}天前`;
    const d = new Date(iso);
    return `${d.getMonth() + 1}月${d.getDate()}日`;
}

// ============================================
// 确认弹窗
// ============================================
let confirmCallback = null;
function showConfirm(title, message, callback) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    confirmCallback = callback;
    document.getElementById('confirmModal').classList.add('active');
}

function closeConfirm() {
    document.getElementById('confirmModal').classList.remove('active');
    confirmCallback = null;
}

// 输入框模态（替代原生 prompt，兼容内嵌浏览器环境）
let inputCallback = null;
function showInputModal(title, defaultValue, maxLength, placeholder, callback) {
    document.getElementById('inputTitle').textContent = title;
    const field = document.getElementById('inputField');
    field.value = defaultValue || '';
    field.placeholder = placeholder || '请输入内容';
    field.setAttribute('maxlength', maxLength || 30);
    document.getElementById('inputMaxLen').textContent = maxLength || 30;
    document.getElementById('inputCount').textContent = (defaultValue || '').length;
    inputCallback = callback;
    document.getElementById('inputModal').classList.add('active');
    setTimeout(() => { field.focus(); field.select(); }, 100);
}

function closeInputModal() {
    document.getElementById('inputModal').classList.remove('active');
    inputCallback = null;
}

function confirmInputModal() {
    const field = document.getElementById('inputField');
    const value = field.value.trim();
    if (inputCallback) inputCallback(value);
    closeInputModal();
}

// ============================================
// Toast 提示
// ============================================
function showToast(message, icon) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast';
    const iconHtml = icon || '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>';
    toast.innerHTML = `<span class="toast-icon">${iconHtml}</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => toast.remove(), 3000);
}

// ============================================
// 工具函数
// ============================================
function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

function getEmotionIcon(emotion) {
    if (emotion && EMOTION_ICONS[emotion]) {
        return EMOTION_ICONS[emotion];
    }
    return { icon: ICONS.music, color: '#047857' };
}

function formatRelativeTime(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = (now - date) / 1000; // 秒
    if (diff < 60) return '刚刚';
    if (diff < 3600) return Math.floor(diff / 60) + '分钟前';
    if (diff < 86400) return Math.floor(diff / 3600) + '小时前';
    if (diff < 604800) return Math.floor(diff / 86400) + '天前';
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${m}-${d}`;
}

// ============================================
// 确认弹窗确定按钮
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    const confirmOk = document.getElementById('confirmOk');
    if (confirmOk) {
        confirmOk.addEventListener('click', () => {
            if (confirmCallback) confirmCallback();
            closeConfirm();
        });
    }
});

// ============================================
// 将所有方法挂载到 app 对象（供 onclick 调用）
// ============================================
app.navigate = navigate;
app.switchMode = switchMode;
app.onTextInput = onTextInput;
app.toggleRecord = toggleRecord;
app.triggerImageUpload = triggerImageUpload;
app.handleImageUpload = handleImageUpload;
app.removeImage = removeImage;
app.startGenerate = startGenerate;
app.cancelGenerate = cancelGenerate;
app.togglePlay = togglePlay;
app.saveVersion = saveVersion;
app.shareVersion = shareVersion;
app.uploadResultCover = uploadResultCover;
app.closeSharePanel = closeSharePanel;
app.shareToFriend = shareToFriend;
app.shareToTimeline = shareToTimeline;
app.saveShareImage = saveShareImage;
app.regenerate = regenerate;
app.newCreation = newCreation;
app.showToast = showToast;
app.viewWorkDetail = viewWorkDetail;
app.playLibraryTrack = playLibraryTrack;
app.useInspiration = useInspiration;
app.usePrompt = usePrompt;
app.onSearch = onSearch;
app.clearSearch = clearSearch;
app.toggleDetailPlay = toggleDetailPlay;
app.editDetailTitle = editDetailTitle;
app.shareDetailWork = shareDetailWork;
app.exportDetailWork = exportDetailWork;
app.deleteDetailWork = deleteDetailWork;
app.openDetailMore = openDetailMore;
app.closeActionPanel = closeActionPanel;

// 创作日历
app.changeMonth = changeMonth;
app.showDayWorks = showDayWorks;

// AI 润色
app.startPolish = startPolish;
app.applyPolish = applyPolish;
app.repolish = repolish;
app.closePolishPanel = closePolishPanel;

// 圈子社交
app.switchCommunityTab = switchCommunityTab;
app.toggleLike = toggleLike;
app.toggleFollow = toggleFollow;
app.toggleBookmark = toggleBookmark;
app.toggleComment = toggleComment;
app.sendComment = sendComment;
app.sharePost = sharePost;
app.togglePostBgm = togglePostBgm;

// 发布帖子
app.openPublishPanel = openPublishPanel;
app.closePublishPanel = closePublishPanel;
app.selectPublishMood = selectPublishMood;
app.openBgmPicker = openBgmPicker;
app.closeBgmPicker = closeBgmPicker;
app.selectBgm = selectBgm;
app.triggerPublishImage = triggerPublishImage;
app.handlePublishImage = handlePublishImage;
app.removePublishImage = removePublishImage;
app.submitPost = submitPost;

// ============================================
// 页面加载时初始化
// ============================================
window.addEventListener('DOMContentLoaded', init);
