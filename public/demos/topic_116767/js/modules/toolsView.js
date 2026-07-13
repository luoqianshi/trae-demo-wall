var ToolsView = (function() {
    var container = null;
    var el = {};
    var currentToolId = null;

    function cacheElements() {
        el.toolModal = document.getElementById('tool-modal');
        el.toolModalClose = document.getElementById('tool-modal-close');
        el.toolModalBackdrop = document.getElementById('tool-modal-backdrop');
        el.toolModalIcon = document.getElementById('tool-modal-icon');
        el.toolModalTitle = document.getElementById('tool-modal-title');
        el.toolModalDesc = document.getElementById('tool-modal-desc');
        el.toolModalFeatures = document.getElementById('tool-modal-features');
        el.toolModalBtn = document.getElementById('tool-modal-btn');
        el.toolModalBackBtn = document.getElementById('tool-modal-back-btn');
        el.toolModalBody = document.getElementById('tool-modal-body');
    }

    function clearElementCache() {
        el = {};
    }

    var TOOLS = [
        {
            id: 'talk-script',
            name: '沟通话术',
            desc: '装修各阶段与工长/设计师沟通技巧',
            icon: 'message-circle',
            color: 'blue',
            badge: '常用',
            type: 'info',
            category: 'reference'
        },
        {
            id: 'photo-inspection',
            name: '拍照验工',
            desc: '各工序验收拍照要点和标准',
            icon: 'camera',
            color: 'green',
            badge: '实用',
            type: 'info',
            category: 'reference'
        },
        {
            id: 'addon-reference',
            name: '增项参考',
            desc: '常见增项价格参考和避坑指南',
            icon: 'plus-circle',
            color: 'orange',
            badge: '避坑',
            type: 'info',
            category: 'reference'
        },
        {
            id: 'payment-calc',
            name: '付款计算器',
            desc: '分期付款金额和节点计算器',
            icon: 'calculator',
            color: 'purple',
            badge: '工具',
            type: 'calculator',
            category: 'budget'
        },
        {
            id: 'schedule-calc',
            name: '工期计算器',
            desc: '根据面积和模式估算装修工期',
            icon: 'clock',
            color: 'red',
            badge: '重要',
            type: 'calculator',
            category: 'measure'
        },
        {
            id: 'area-calc',
            name: '装修面积计算器',
            desc: '面积、材料用量快速估算',
            icon: 'ruler',
            color: 'teal',
            badge: '实用',
            type: 'calculator',
            category: 'measure'
        },
        {
            id: 'loan-calc',
            name: '贷款计算器',
            desc: '装修贷/房贷月供和总利息计算',
            icon: 'banknote',
            color: 'green',
            badge: '实用',
            type: 'calculator',
            category: 'budget'
        },
        {
            id: 'color-scheme',
            name: '配色方案生成器',
            desc: '一键生成装修风格配色方案',
            icon: 'palette',
            color: 'pink',
            badge: '设计',
            type: 'calculator',
            category: 'design'
        },
        {
            id: 'curtain-calc',
            name: '窗帘数量计算器',
            desc: '窗帘布料米数和褶皱计算',
            icon: 'curtains',
            color: 'purple',
            badge: '材料',
            type: 'calculator',
            category: 'material'
        },
        {
            id: 'lighting-calc',
            name: '灯具数量估算',
            desc: '房间灯具数量和瓦数建议',
            icon: 'lightbulb',
            color: 'yellow',
            badge: '设计',
            type: 'calculator',
            category: 'design'
        },
        {
            id: 'formaldehyde-calc',
            name: '甲醛释放量估算',
            desc: '家具板材甲醛释放量评估',
            icon: 'wind',
            color: 'teal',
            badge: '健康',
            type: 'calculator',
            category: 'material'
        },
        {
            id: 'decoration-schedule',
            name: '装修工期规划',
            desc: '简装/精装/豪装工期定制规划',
            icon: 'calendar',
            color: 'orange',
            badge: '规划',
            type: 'calculator',
            category: 'measure'
        }
    ];

    var CATEGORIES = [
        { id: 'all', name: '全部', icon: 'grid' },
        { id: 'measure', name: '测量计算', icon: 'ruler' },
        { id: 'budget', name: '预算相关', icon: 'calculator' },
        { id: 'design', name: '设计参考', icon: 'palette' },
        { id: 'material', name: '材料估算', icon: 'box' },
        { id: 'reference', name: '参考资料', icon: 'book-open' }
    ];

    var ICONS = {
        'message-circle':
            '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>',
        'camera':
            '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>',
        'plus-circle':
            '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>',
        'calculator':
            '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="8" y2="10"/><line x1="12" y1="10" x2="12" y2="10"/><line x1="16" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="8" y2="14"/><line x1="12" y1="14" x2="12" y2="14"/><line x1="16" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="8" y2="18"/><line x1="12" y1="18" x2="12" y2="18"/><line x1="16" y1="18" x2="16" y2="18"/></svg>',
        'clock':
            '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
        'ruler':
            '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21.3 15.3a2.4 2.4 0 00.1-2.6L15 3.6a2.4 2.4 0 00-2.1-1.3H5.5a2.4 2.4 0 00-2.1 3.6L8.9 18.4a2.4 2.4 0 002.1 1.3h7.4a2.4 2.4 0 001.9-.9"/><path d="M14.5 7.5l-2.1 3.6 2.1 3.6"/><path d="M10.4 7.5l-2.1 3.6 2.1 3.6"/></svg>',
        'banknote':
            '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M6 12h.01M18 12h.01"/></svg>',
        'palette':
            '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.5-.6 1.5-1.5 0-.4-.2-.8-.4-1.1-.3-.3-.4-.7-.4-1.1 0-.8.7-1.5 1.5-1.5H16c3.3 0 6-2.7 6-6 0-4.9-4.5-8.8-10-8.8z"/></svg>',
        'curtains':
            '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h18"/><path d="M3 3c0 8 0 12 3 15"/><path d="M21 3c0 8 0 12-3 15"/><path d="M7 3c0 6 1 10 4 12"/><path d="M17 3c0 6-1 10-4 12"/><path d="M7 18c0 2 2 3 5 3s5-1 5-3"/></svg>',
        'lightbulb':
            '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 00-4 12c1.5 1 2 2 2 3h4c0-1 .5-2 2-3a7 7 0 00-4-12z"/></svg>',
        'wind':
            '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17.7 7.7a2.5 2.5 0 111.8 4.3H2"/><path d="M9.6 4.6A2 2 0 1111 8H2"/><path d="M12.6 19.4A2 2 0 1014 16H2"/></svg>',
        'calendar':
            '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
        'grid':
            '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
        'box':
            '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
        'book-open':
            '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>',
        'search':
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
        'star':
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
        'star-filled':
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
        'copy':
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>',
        'check':
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
    };

    var COLOR_CLASSES = {
        blue: { bg: 'rgba(74, 111, 149, 0.1)', text: '#4A6F95', border: 'rgba(74, 111, 149, 0.2)' },
        green: { bg: 'rgba(77, 125, 76, 0.1)', text: '#4D7D4C', border: 'rgba(77, 125, 76, 0.2)' },
        orange: { bg: 'rgba(168, 62, 53, 0.08)', text: '#A83E35', border: 'rgba(168, 62, 53, 0.15)' },
        purple: { bg: 'rgba(107, 92, 224, 0.1)', text: '#6B5CE0', border: 'rgba(107, 92, 224, 0.2)' },
        red: { bg: 'rgba(168, 62, 53, 0.1)', text: '#A83E35', border: 'rgba(168, 62, 53, 0.2)' },
        teal: { bg: 'rgba(46, 125, 50, 0.08)', text: '#2E7D32', border: 'rgba(46, 125, 50, 0.15)' },
        pink: { bg: 'rgba(219, 112, 147, 0.1)', text: '#DB7093', border: 'rgba(219, 112, 147, 0.2)' },
        yellow: { bg: 'rgba(218, 165, 32, 0.1)', text: '#DAA520', border: 'rgba(218, 165, 32, 0.2)' }
    };

    var PAYMENT_PRESETS = {
        '4-3-2-1': {
            name: '4-3-2-1 模式',
            periods: 4,
            ratios: [40, 30, 20, 10],
            nodes: ['首付（开工前）', '中期款（瓦工结束后）', '尾期款（竣工验收后）', '质保金（质保期满后）'],
            isWarranty: [false, false, false, true]
        },
        '3-3-3-1': {
            name: '3-3-3-1 模式',
            periods: 4,
            ratios: [30, 30, 30, 10],
            nodes: ['首付（开工前）', '中期款（木工结束后）', '尾期款（竣工验收后）', '质保金（质保期满后）'],
            isWarranty: [false, false, false, true]
        },
        '5-3-2': {
            name: '5-3-2 模式',
            periods: 3,
            ratios: [50, 30, 20],
            nodes: ['首付（开工前）', '中期款（瓦工木工结束后）', '尾款（竣工验收后）'],
            isWarranty: [false, false, false]
        },
        '3-4-2-1': {
            name: '3-4-2-1 模式',
            periods: 4,
            ratios: [30, 40, 20, 10],
            nodes: ['首付（开工前）', '中期款（水电瓦工结束后）', '尾期款（竣工验收后）', '质保金（质保期满后）'],
            isWarranty: [false, false, false, true]
        }
    };

    var SCHEDULE_BASE = {
        full: { days: 60, label: '全包' },
        half: { days: 75, label: '半包' },
        self: { days: 90, label: '自装' }
    };

    var SCHEDULE_STAGES = [
        { name: '拆除阶段', ratio: 0.08, icon: '🔨' },
        { name: '水电改造', ratio: 0.15, icon: '⚡' },
        { name: '瓦工阶段', ratio: 0.20, icon: '🧱' },
        { name: '木工阶段', ratio: 0.18, icon: '🪵' },
        { name: '油工阶段', ratio: 0.18, icon: '🎨' },
        { name: '安装阶段', ratio: 0.12, icon: '🔧' },
        { name: '收尾保洁', ratio: 0.09, icon: '🧹' }
    ];

    var HOUSE_TYPES = [
        { id: '1-1-1', name: '1室1厅1卫', rooms: 1, halls: 1, bathrooms: 1 },
        { id: '2-1-1', name: '2室1厅1卫', rooms: 2, halls: 1, bathrooms: 1 },
        { id: '2-2-1', name: '2室2厅1卫', rooms: 2, halls: 2, bathrooms: 1 },
        { id: '3-1-1', name: '3室1厅1卫', rooms: 3, halls: 1, bathrooms: 1 },
        { id: '3-2-1', name: '3室2厅1卫', rooms: 3, halls: 2, bathrooms: 1 },
        { id: '3-2-2', name: '3室2厅2卫', rooms: 3, halls: 2, bathrooms: 2 },
        { id: '4-2-2', name: '4室2厅2卫', rooms: 4, halls: 2, bathrooms: 2 }
    ];

    var DECORATION_MODES = {
        simple: { name: '简装', baseDays: 30, multiplier: 1.0 },
        refined: { name: '精装', baseDays: 60, multiplier: 1.3 },
        luxury: { name: '豪装', baseDays: 90, multiplier: 1.6 }
    };

    var DECORATION_STAGES = [
        { name: '设计规划', ratio: 0.08, icon: '📐' },
        { name: '拆除改造', ratio: 0.07, icon: '🔨' },
        { name: '水电改造', ratio: 0.12, icon: '⚡' },
        { name: '瓦工阶段', ratio: 0.18, icon: '🧱' },
        { name: '木工阶段', ratio: 0.15, icon: '🪵' },
        { name: '油工阶段', ratio: 0.15, icon: '🎨' },
        { name: '安装阶段', ratio: 0.15, icon: '🔧' },
        { name: '软装进场', ratio: 0.05, icon: '🛋️' },
        { name: '收尾保洁', ratio: 0.05, icon: '🧹' }
    ];

    var COLOR_SCHEMES = {
        nordic: {
            name: '北欧风',
            desc: '清新自然，简约明亮',
            primary: '#8B9D83',
            secondary: '#D4C5B0',
            accent: '#E07A5F',
            neutral: ['#F8F6F3', '#E8E4DE', '#B8B0A8', '#6B6560'],
            bg: '#F8F6F3'
        },
        japanese: {
            name: '日式',
            desc: '禅意静谧，原木自然',
            primary: '#B8A88A',
            secondary: '#8B7355',
            accent: '#C4A77D',
            neutral: ['#FAF8F5', '#EDE8E0', '#D4CDBF', '#7D7468'],
            bg: '#FAF8F5'
        },
        modern: {
            name: '现代简约',
            desc: '简洁大气，高级质感',
            primary: '#2C3E50',
            secondary: '#7F8C8D',
            accent: '#E74C3C',
            neutral: ['#FAFAFA', '#F0F0F0', '#BDBDBD', '#424242'],
            bg: '#FAFAFA'
        },
        chinese: {
            name: '新中式',
            desc: '东方韵味，典雅大气',
            primary: '#8B4513',
            secondary: '#2F4F4F',
            accent: '#B8860B',
            neutral: ['#FDF5E6', '#E8DCC8', '#C4B896', '#5C4A3D'],
            bg: '#FDF5E6'
        },
        industrial: {
            name: '工业风',
            desc: '粗犷硬朗，个性十足',
            primary: '#4A4A4A',
            secondary: '#8B7355',
            accent: '#CD853F',
            neutral: ['#F5F5F5', '#D4D4D4', '#8C8C8C', '#2D2D2D'],
            bg: '#F5F5F5'
        },
        mediterranean: {
            name: '地中海',
            desc: '浪漫清新，海洋风情',
            primary: '#4682B4',
            secondary: '#87CEEB',
            accent: '#F4A460',
            neutral: ['#F0F8FF', '#E0EFF1', '#A9CCE3', '#2E5984'],
            bg: '#F0F8FF'
        }
    };

    var CURTAIN_STYLES = {
        'flat': { name: '平帘', ratio: 1.0 },
        'pleated': { name: '褶皱帘', ratio: 2.0 },
        'roman': { name: '罗马帘', ratio: 1.5 },
        'shutter': { name: '百叶帘', ratio: 1.2 }
    };

    var ROOM_TYPES = {
        living: { name: '客厅', lux: 150, wattPerSqm: 5 },
        bedroom: { name: '卧室', lux: 100, wattPerSqm: 3 },
        kitchen: { name: '厨房', lux: 200, wattPerSqm: 6 },
        bathroom: { name: '卫生间', lux: 150, wattPerSqm: 5 },
        study: { name: '书房', lux: 300, wattPerSqm: 7 },
        dining: { name: '餐厅', lux: 150, wattPerSqm: 5 }
    };

    var LIGHT_TYPES = {
        ceiling: { name: '吸顶灯', coverage: 15, wattage: 24 },
        downlight: { name: '筒灯', coverage: 3, wattage: 7 },
        spotlight: { name: '射灯', coverage: 2, wattage: 9 }
    };

    var BOARD_TYPES = {
        E0: { name: 'E0级', emission: 0.05, safe: true },
        E1: { name: 'E1级', emission: 0.124, safe: true },
        E2: { name: 'E2级', emission: 5.0, safe: false }
    };

    var currentCategory = 'all';
    var searchKeyword = '';

    function getFilteredTools() {
        return TOOLS.filter(function(tool) {
            var categoryMatch = currentCategory === 'all' || tool.category === currentCategory;
            var searchMatch = !searchKeyword ||
                tool.name.toLowerCase().indexOf(searchKeyword.toLowerCase()) !== -1 ||
                tool.desc.toLowerCase().indexOf(searchKeyword.toLowerCase()) !== -1;
            return categoryMatch && searchMatch;
        });
    }

    function renderToolCard(tool, index) {
        var colors = COLOR_CLASSES[tool.color] || COLOR_CLASSES.blue;
        var isFav = window.FavoritesHistory && FavoritesHistory.isFavorite('tool', tool.id);
        return `
            <div class="tool-card stagger-item" data-tool-id="${tool.id}" tabindex="0" style="transition-delay: ${index * 0.05}s">
                <button class="tool-favorite-btn ${isFav ? 'active' : ''}" data-fav-tool-id="${tool.id}" title="${isFav ? '取消收藏' : '收藏'}">
                    ${ICONS[isFav ? 'star-filled' : 'star']}
                </button>
                <div class="tool-card-icon" style="background: ${colors.bg}; color: ${colors.text};">
                    ${ICONS[tool.icon] || ICONS['ruler']}
                </div>
                <div class="tool-card-content">
                    <div class="tool-card-header">
                        <h3 class="tool-card-title">${tool.name}</h3>
                        ${tool.badge ? `<span class="tool-card-badge" style="background: ${colors.bg}; color: ${colors.text};">${tool.badge}</span>` : ''}
                    </div>
                    <p class="tool-card-desc">${tool.desc}</p>
                </div>
                <div class="tool-card-arrow" style="color: ${colors.text};">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="9 18 15 12 9 6"/>
                    </svg>
                </div>
            </div>
        `;
    }

    function renderToolsGrid() {
        var gridEl = container.querySelector('.tools-grid');
        if (!gridEl) return;
        var tools = getFilteredTools();
        if (tools.length === 0) {
            gridEl.innerHTML = `
                <div class="tools-empty">
                    <div class="tools-empty-icon">🔍</div>
                    <p class="tools-empty-text">没有找到相关工具</p>
                </div>
            `;
            return;
        }
        gridEl.innerHTML = tools.map(function(tool, index) {
            return renderToolCard(tool, index);
        }).join('');
        setTimeout(function() {
            var items = gridEl.querySelectorAll('.stagger-item');
            items.forEach(function(item) {
                item.classList.add('visible');
            });
        }, 50);
    }

    function render(containerEl) {
        container = containerEl;

        container.innerHTML = `
            <div class="tools-view ink-wash-bg">
                <header class="tools-header">
                    <div class="tools-header-inner">
                        <div class="tools-header-left">
                            <h1 class="tools-title">工具箱</h1>
                            <p class="tools-subtitle">装修必备实用工具，助您轻松搞定装修</p>
                        </div>
                    </div>
                </header>

                <main class="tools-main">
                    <div class="tools-search-bar">
                        <div class="tools-search-input-wrapper">
                            <span class="tools-search-icon">${ICONS['search']}</span>
                            <input type="text" class="tools-search-input" id="tools-search-input" placeholder="搜索工具...">
                        </div>
                    </div>

                    <div class="tools-categories" id="tools-categories">
                        ${CATEGORIES.map(function(cat, index) {
                            return `
                                <button class="tools-category-btn ${cat.id === currentCategory ? 'active' : ''}" data-category="${cat.id}">
                                    <span class="tools-category-icon">${ICONS[cat.icon] || ''}</span>
                                    <span>${cat.name}</span>
                                </button>
                            `;
                        }).join('')}
                    </div>

                    <div class="tools-grid" id="tools-grid">
                        ${getFilteredTools().map(function(tool, index) {
                            return renderToolCard(tool, index);
                        }).join('')}
                    </div>

                    <div class="tools-recent">
                        <h3 class="tools-recent-title">最近使用</h3>
                        <div class="tools-recent-list" id="tools-recent-list">
                            <div class="tools-recent-empty">暂无使用记录</div>
                        </div>
                    </div>

                    <div class="tools-tip-card card stagger-item" style="transition-delay: 0.35s">
                        <div class="tools-tip-icon">${Icons.render('nian-happy')}</div>
                        <div class="tools-tip-content">
                            <h3 class="tools-tip-title">小管家提示</h3>
                            <p class="tools-tip-desc">装修过程中有任何问题，都可以在这里找到对应的工具帮您解决。记得多对比、多核实，避免踩坑哦~</p>
                        </div>
                    </div>
                </main>

                <div class="tool-modal" id="tool-modal">
                    <div class="tool-modal-backdrop" id="tool-modal-backdrop"></div>
                    <div class="tool-modal-content">
                        <button class="tool-modal-close" id="tool-modal-close">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"/>
                                <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                        </button>
                        <button class="tool-modal-favorite" id="tool-modal-favorite" title="收藏">
                            ${ICONS['star']}
                        </button>
                        <div class="tool-modal-icon" id="tool-modal-icon"></div>
                        <h2 class="tool-modal-title" id="tool-modal-title"></h2>
                        <p class="tool-modal-desc" id="tool-modal-desc"></p>
                        <div class="tool-modal-features" id="tool-modal-features"></div>
                        <div class="tool-modal-body" id="tool-modal-body"></div>
                        <div class="tool-modal-actions">
                            <button class="tool-modal-btn tool-modal-btn-back" id="tool-modal-back-btn">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="15 18 9 12 15 6"/>
                                </svg>
                                <span>返回列表</span>
                            </button>
                            <button class="tool-modal-btn" id="tool-modal-btn">
                                <span>开始使用</span>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="9 18 15 12 9 6"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        initEvents();
        cacheElements();
        updateRecentTools();
    }

    function init(containerEl) {
        container = containerEl;
        initCardEvents();
        initModalEvents();
    }

    function viewEnter(containerEl) {
        container = containerEl;
        setTimeout(function() {
            var staggerItems = container.querySelectorAll('.stagger-item');
            staggerItems.forEach(function(item) {
                item.classList.add('visible');
            });
        }, 50);
    }

    function initEvents() {
        initCardEvents();
        initModalEvents();
    }

    function initCardEvents() {
        var cards = container.querySelectorAll('.tool-card');
        cards.forEach(function(card) {
            card.addEventListener('click', function(e) {
                if (e.target.closest('.tool-favorite-btn')) {
                    return;
                }
                var toolId = this.getAttribute('data-tool-id');
                openToolModal(toolId);
            });

            card.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    var toolId = this.getAttribute('data-tool-id');
                    openToolModal(toolId);
                }
            });
        });

        var favBtns = container.querySelectorAll('.tool-favorite-btn');
        favBtns.forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                var toolId = this.getAttribute('data-fav-tool-id');
                toggleToolFavorite(toolId, this);
            });
        });

        var searchInput = document.getElementById('tools-search-input');
        if (searchInput) {
            var searchTimer = null;
            searchInput.addEventListener('input', function() {
                var value = this.value;
                if (searchTimer) clearTimeout(searchTimer);
                searchTimer = setTimeout(function() {
                    searchKeyword = value;
                    renderToolsGrid();
                    initCardEvents();
                }, 200);
            });
        }

        var categoryBtns = container.querySelectorAll('[data-category]');
        categoryBtns.forEach(function(btn) {
            btn.addEventListener('click', function() {
                var catId = this.getAttribute('data-category');
                currentCategory = catId;
                categoryBtns.forEach(function(b) { b.classList.remove('active'); });
                this.classList.add('active');
                renderToolsGrid();
                initCardEvents();
            });
        });
    }

    function toggleToolFavorite(toolId, btnEl) {
        if (!window.FavoritesHistory) return;
        var tool = TOOLS.find(function(t) { return t.id === toolId; });
        if (!tool) return;
        var isFav = FavoritesHistory.toggleFavorite('tool', toolId, {
            name: tool.name,
            desc: tool.desc,
            icon: tool.icon,
            color: tool.color
        });
        if (btnEl) {
            btnEl.classList.toggle('active', isFav);
            btnEl.innerHTML = ICONS[isFav ? 'star-filled' : 'star'];
            btnEl.title = isFav ? '取消收藏' : '收藏';
        }
        if (window.Toast) {
            Toast.show(isFav ? '已收藏' : '已取消收藏', isFav ? 'success' : 'info');
        }
    }

    function updateRecentTools() {
        var listEl = document.getElementById('tools-recent-list');
        if (!listEl || !window.FavoritesHistory) return;
        var recent = FavoritesHistory.getHistory('tool', 5);
        if (recent.length === 0) {
            listEl.innerHTML = '<div class="tools-recent-empty">暂无使用记录</div>';
            return;
        }
        listEl.innerHTML = recent.map(function(item, index) {
            var tool = TOOLS.find(function(t) { return t.id === item.id; });
            if (!tool) return '';
            var colors = COLOR_CLASSES[tool.color] || COLOR_CLASSES.blue;
            return `
                <div class="tools-recent-item" data-tool-id="${tool.id}" tabindex="0" style="transition-delay: ${index * 0.05}s">
                    <div class="tools-recent-icon" style="background: ${colors.bg}; color: ${colors.text};">
                        ${ICONS[tool.icon] || ICONS['ruler']}
                    </div>
                    <span class="tools-recent-name">${tool.name}</span>
                </div>
            `;
        }).join('');

        var items = listEl.querySelectorAll('.tools-recent-item');
        items.forEach(function(item) {
            item.addEventListener('click', function() {
                var toolId = this.getAttribute('data-tool-id');
                openToolModal(toolId);
            });
        });
    }

    function initModalEvents() {
        if (el.toolModalClose) {
            el.toolModalClose.addEventListener('click', closeToolModal);
        }
        if (el.toolModalBackdrop) {
            el.toolModalBackdrop.addEventListener('click', closeToolModal);
        }

        if (el.toolModalBtn) {
            el.toolModalBtn.addEventListener('click', function() {
                handleToolAction();
            });
        }

        if (el.toolModalBackBtn) {
            el.toolModalBackBtn.addEventListener('click', function() {
                if (currentToolId && isCalculatorTool(currentToolId)) {
                    showToolIntro();
                } else {
                    closeToolModal();
                }
            });
        }
    }

    function isCalculatorTool(toolId) {
        var tool = TOOLS.find(function(t) { return t.id === toolId; });
        return tool && tool.type === 'calculator';
    }

    function openToolModal(toolId) {
        currentToolId = toolId;
        var tool = TOOLS.find(function(t) { return t.id === toolId; });
        if (!tool) return;

        if (window.FavoritesHistory) {
            FavoritesHistory.addHistory('tool', toolId, {
                name: tool.name,
                desc: tool.desc,
                icon: tool.icon,
                color: tool.color
            });
            updateRecentTools();
        }

        var colors = COLOR_CLASSES[tool.color] || COLOR_CLASSES.blue;

        var favBtn = document.getElementById('tool-modal-favorite');
        if (favBtn && window.FavoritesHistory) {
            var isFav = FavoritesHistory.isFavorite('tool', toolId);
            favBtn.classList.toggle('active', isFav);
            favBtn.innerHTML = ICONS[isFav ? 'star-filled' : 'star'];
            favBtn.title = isFav ? '取消收藏' : '收藏';
            favBtn.onclick = function() {
                var isNowFav = FavoritesHistory.toggleFavorite('tool', toolId, {
                    name: tool.name,
                    desc: tool.desc,
                    icon: tool.icon,
                    color: tool.color
                });
                favBtn.classList.toggle('active', isNowFav);
                favBtn.innerHTML = ICONS[isNowFav ? 'star-filled' : 'star'];
                favBtn.title = isNowFav ? '取消收藏' : '收藏';
                if (window.Toast) {
                    Toast.show(isNowFav ? '已收藏' : '已取消收藏', isNowFav ? 'success' : 'info');
                }
                renderToolsGrid();
                initCardEvents();
            };
        }

        if (el.toolModalIcon) {
            el.toolModalIcon.style.background = colors.bg;
            el.toolModalIcon.style.color = colors.text;
            el.toolModalIcon.innerHTML = ICONS[tool.icon] || ICONS['ruler'];
        }
        if (el.toolModalTitle) {
            el.toolModalTitle.textContent = tool.name;
        }
        if (el.toolModalDesc) {
            el.toolModalDesc.textContent = tool.desc;
        }
        if (el.toolModalFeatures) {
            var features = getToolFeatures(toolId);
            el.toolModalFeatures.innerHTML = features.map(function(f) {
                return `
                    <div class="tool-feature-item">
                        <div class="tool-feature-check" style="color: ${colors.text};">✓</div>
                        <span>${f}</span>
                    </div>
                `;
            }).join('');
            el.toolModalFeatures.style.display = '';
        }
        if (el.toolModalBody) {
            el.toolModalBody.innerHTML = '';
            el.toolModalBody.style.display = 'none';
        }
        if (el.toolModalBtn) {
            el.toolModalBtn.querySelector('span').textContent = tool.type === 'calculator' ? '开始计算' : '开始使用';
        }
        if (el.toolModalBackBtn) {
            el.toolModalBackBtn.querySelector('span').textContent = '返回列表';
        }

        if (el.toolModal) {
            el.toolModal.classList.add('active');
        }
    }

    function showToolIntro() {
        if (!currentToolId) return;
        var tool = TOOLS.find(function(t) { return t.id === currentToolId; });
        if (!tool) return;

        var colors = COLOR_CLASSES[tool.color] || COLOR_CLASSES.blue;

        if (el.toolModalIcon) {
            el.toolModalIcon.style.display = '';
        }
        if (el.toolModalTitle) {
            el.toolModalTitle.textContent = tool.name;
        }
        if (el.toolModalDesc) {
            el.toolModalDesc.textContent = tool.desc;
            el.toolModalDesc.style.display = '';
        }
        if (el.toolModalFeatures) {
            var features = getToolFeatures(currentToolId);
            el.toolModalFeatures.innerHTML = features.map(function(f) {
                return `
                    <div class="tool-feature-item">
                        <div class="tool-feature-check" style="color: ${colors.text};">✓</div>
                        <span>${f}</span>
                    </div>
                `;
            }).join('');
            el.toolModalFeatures.style.display = '';
        }
        if (el.toolModalBody) {
            el.toolModalBody.innerHTML = '';
            el.toolModalBody.style.display = 'none';
        }
        if (el.toolModalBtn) {
            el.toolModalBtn.querySelector('span').textContent = '开始计算';
            el.toolModalBtn.style.display = '';
        }
        if (el.toolModalBackBtn) {
            el.toolModalBackBtn.querySelector('span').textContent = '返回列表';
        }
    }

    function handleToolAction() {
        if (!currentToolId) return;

        if (isCalculatorTool(currentToolId)) {
            showCalculator(currentToolId);
        } else {
            showToolComingSoon();
        }
    }

    function showCalculator(toolId) {
        var tool = TOOLS.find(function(t) { return t.id === toolId; });
        if (!tool) return;

        if (el.toolModalIcon) {
            el.toolModalIcon.style.display = 'none';
        }
        if (el.toolModalTitle) {
            el.toolModalTitle.textContent = tool.name;
        }
        if (el.toolModalDesc) {
            el.toolModalDesc.style.display = 'none';
        }
        if (el.toolModalFeatures) {
            el.toolModalFeatures.style.display = 'none';
        }
        if (el.toolModalBody) {
            el.toolModalBody.style.display = '';
        }
        if (el.toolModalBtn) {
            el.toolModalBtn.style.display = 'none';
        }
        if (el.toolModalBackBtn) {
            el.toolModalBackBtn.querySelector('span').textContent = '返回介绍';
        }

        var calculatorHtml = '';
        switch (toolId) {
            case 'payment-calc':
                calculatorHtml = renderPaymentCalculator();
                break;
            case 'schedule-calc':
                calculatorHtml = renderScheduleCalculator();
                break;
            case 'area-calc':
                calculatorHtml = renderAreaCalculator();
                break;
            case 'loan-calc':
                calculatorHtml = renderLoanCalculator();
                break;
            case 'color-scheme':
                calculatorHtml = renderColorSchemeGenerator();
                break;
            case 'curtain-calc':
                calculatorHtml = renderCurtainCalculator();
                break;
            case 'lighting-calc':
                calculatorHtml = renderLightingCalculator();
                break;
            case 'formaldehyde-calc':
                calculatorHtml = renderFormaldehydeCalculator();
                break;
            case 'decoration-schedule':
                calculatorHtml = renderDecorationSchedule();
                break;
        }

        if (el.toolModalBody) {
            el.toolModalBody.innerHTML = calculatorHtml;
            el.toolModalBody.classList.add('calculator-fade-in');
        }

        initCalculatorEvents(toolId);
    }

    function renderPaymentCalculator() {
        var presetOptions = Object.keys(PAYMENT_PRESETS).map(function(key) {
            var preset = PAYMENT_PRESETS[key];
            return `<option value="${key}">${preset.name}</option>`;
        }).join('');

        return `
            <div class="calculator-container">
                <div class="calc-input-section">
                    <div class="calc-input-group">
                        <label class="calc-input-label">总预算金额</label>
                        <div class="calc-input-wrapper">
                            <input type="number" class="form-input calc-input" id="payment-total" placeholder="请输入总预算" min="0">
                            <span class="calc-input-suffix">元</span>
                        </div>
                    </div>

                    <div class="calc-input-group">
                        <label class="calc-input-label">付款方式</label>
                        <div class="calc-tabs">
                            <button class="calc-tab active" data-payment-type="preset">预设模式</button>
                            <button class="calc-tab" data-payment-type="custom">自定义</button>
                        </div>
                    </div>

                    <div class="calc-input-group" id="payment-preset-group">
                        <label class="calc-input-label">选择预设</label>
                        <select class="form-input calc-select" id="payment-preset">
                            ${presetOptions}
                        </select>
                    </div>

                    <div class="calc-input-group" id="payment-custom-group" style="display: none;">
                        <label class="calc-input-label">期数选择</label>
                        <div class="calc-radio-group">
                            <label class="custom-radio">
                                <input type="radio" name="payment-periods" value="3" checked>
                                <span class="radio-mark"></span>
                                <span>3期</span>
                            </label>
                            <label class="custom-radio">
                                <input type="radio" name="payment-periods" value="4">
                                <span class="radio-mark"></span>
                                <span>4期</span>
                            </label>
                            <label class="custom-radio">
                                <input type="radio" name="payment-periods" value="5">
                                <span class="radio-mark"></span>
                                <span>5期</span>
                            </label>
                        </div>
                        <div class="calc-custom-ratios" id="payment-custom-ratios"></div>
                    </div>
                </div>

                <button class="btn-primary calc-calc-btn" id="payment-calc-btn">计算付款计划</button>

                <div class="calc-result-section" id="payment-result" style="display: none;">
                    <div class="calc-result-header">
                        <h4 class="calc-result-title">付款计划表</h4>
                        <div class="calc-result-total">
                            <span class="calc-total-label">总金额</span>
                            <span class="calc-total-value" id="payment-total-amount">¥0</span>
                        </div>
                    </div>
                    <div class="payment-schedule" id="payment-schedule"></div>
                    <div class="calc-verify" id="payment-verify"></div>
                </div>
            </div>
        `;
    }

    function renderScheduleCalculator() {
        return `
            <div class="calculator-container">
                <div class="calc-input-section">
                    <div class="calc-input-group">
                        <label class="calc-input-label">房屋面积</label>
                        <div class="calc-input-wrapper">
                            <input type="number" class="form-input calc-input" id="schedule-area" placeholder="请输入房屋面积" min="0">
                            <span class="calc-input-suffix">㎡</span>
                        </div>
                    </div>

                    <div class="calc-input-group">
                        <label class="calc-input-label">装修模式</label>
                        <div class="calc-radio-group">
                            <label class="custom-radio">
                                <input type="radio" name="schedule-mode" value="full" checked>
                                <span class="radio-mark"></span>
                                <span>全包</span>
                            </label>
                            <label class="custom-radio">
                                <input type="radio" name="schedule-mode" value="half">
                                <span class="radio-mark"></span>
                                <span>半包</span>
                            </label>
                            <label class="custom-radio">
                                <input type="radio" name="schedule-mode" value="self">
                                <span class="radio-mark"></span>
                                <span>自装</span>
                            </label>
                        </div>
                    </div>

                    <div class="calc-input-group">
                        <label class="calc-input-label">房屋类型</label>
                        <div class="calc-radio-group">
                            <label class="custom-radio">
                                <input type="radio" name="house-type" value="new" checked>
                                <span class="radio-mark"></span>
                                <span>新房</span>
                            </label>
                            <label class="custom-radio">
                                <input type="radio" name="house-type" value="second">
                                <span class="radio-mark"></span>
                                <span>二手房</span>
                            </label>
                        </div>
                    </div>

                    <div class="calc-input-group">
                        <div class="calc-switch-row">
                            <label class="calc-input-label" style="margin-bottom: 0;">是否含拆除</label>
                            <label class="toggle-switch">
                                <input type="checkbox" id="schedule-demolition">
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                    </div>
                </div>

                <button class="btn-primary calc-calc-btn" id="schedule-calc-btn">计算工期</button>

                <div class="calc-result-section" id="schedule-result" style="display: none;">
                    <div class="calc-result-header">
                        <h4 class="calc-result-title">总工期估算</h4>
                        <div class="schedule-total-days">
                            <span class="schedule-days-number" id="schedule-total-days">0</span>
                            <span class="schedule-days-unit">天</span>
                        </div>
                    </div>
                    <div class="schedule-stages" id="schedule-stages"></div>
                    <div class="calc-notes">
                        <p class="calc-note-title">工期说明：</p>
                        <ul class="calc-note-list">
                            <li>以上工期为估算值，实际工期受天气、材料供应等因素影响</li>
                            <li>二手房因需拆除旧装修，工期会相应增加</li>
                            <li>建议在合同中明确工期和延期赔偿条款</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }

    function renderAreaCalculator() {
        var houseTypeOptions = HOUSE_TYPES.map(function(ht) {
            return `<option value="${ht.id}">${ht.name}</option>`;
        }).join('');

        return `
            <div class="calculator-container">
                <div class="calc-input-section">
                    <div class="calc-input-group">
                        <label class="calc-input-label">建筑面积</label>
                        <div class="calc-input-wrapper">
                            <input type="number" class="form-input calc-input" id="area-building" placeholder="请输入建筑面积" min="0">
                            <span class="calc-input-suffix">㎡</span>
                        </div>
                    </div>

                    <div class="calc-input-group">
                        <label class="calc-input-label">户型</label>
                        <select class="form-input calc-select" id="area-house-type">
                            ${houseTypeOptions}
                        </select>
                    </div>

                    <div class="calc-input-group">
                        <label class="calc-input-label">层高</label>
                        <div class="calc-input-wrapper">
                            <input type="number" class="form-input calc-input" id="area-height" placeholder="2.8" value="2.8" min="2" max="5" step="0.1">
                            <span class="calc-input-suffix">m</span>
                        </div>
                    </div>

                    <div class="calc-input-group">
                        <label class="calc-input-label">得房率</label>
                        <div class="calc-input-wrapper">
                            <input type="number" class="form-input calc-input" id="area-efficiency" placeholder="75" value="75" min="50" max="95">
                            <span class="calc-input-suffix">%</span>
                        </div>
                    </div>
                </div>

                <button class="btn-primary calc-calc-btn" id="area-calc-btn">开始计算</button>

                <div class="calc-result-section" id="area-result" style="display: none;">
                    <div class="calc-result-card">
                        <h4 class="calc-result-card-title">
                            <span class="calc-result-icon">📐</span>
                            面积估算
                        </h4>
                        <div class="calc-area-grid" id="area-estimate-grid"></div>
                    </div>

                    <div class="calc-result-card">
                        <h4 class="calc-result-card-title">
                            <span class="calc-result-icon">🧱</span>
                            材料用量估算
                        </h4>
                        <div class="calc-material-list" id="area-material-list"></div>
                    </div>

                    <div class="calc-notes">
                        <p class="calc-note-title">计算公式说明：</p>
                        <ul class="calc-note-list">
                            <li>套内面积 = 建筑面积 × 得房率</li>
                            <li>墙面面积 ≈ 地面面积 × 2.5（已扣除门窗面积）</li>
                            <li>材料用量已包含5%-10%的损耗</li>
                            <li>实际用量请以现场测量和施工方案为准</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }

    function renderLoanCalculator() {
        return `
            <div class="calculator-container">
                <div class="calc-input-section">
                    <div class="calc-input-group">
                        <label class="calc-input-label">贷款金额</label>
                        <div class="calc-input-wrapper">
                            <input type="number" class="form-input calc-input" id="loan-amount" placeholder="请输入贷款金额" min="0">
                            <span class="calc-input-suffix">万元</span>
                        </div>
                    </div>

                    <div class="calc-input-group">
                        <label class="calc-input-label">年利率</label>
                        <div class="calc-input-wrapper">
                            <input type="number" class="form-input calc-input" id="loan-rate" placeholder="4.9" value="4.9" min="0" max="30" step="0.01">
                            <span class="calc-input-suffix">%</span>
                        </div>
                    </div>

                    <div class="calc-input-group">
                        <label class="calc-input-label">贷款期限</label>
                        <div class="calc-input-wrapper">
                            <input type="number" class="form-input calc-input" id="loan-years" placeholder="20" value="20" min="1" max="30">
                            <span class="calc-input-suffix">年</span>
                        </div>
                    </div>

                    <div class="calc-input-group">
                        <label class="calc-input-label">还款方式</label>
                        <div class="calc-radio-group">
                            <label class="custom-radio">
                                <input type="radio" name="loan-type" value="equal-principal-interest" checked>
                                <span class="radio-mark"></span>
                                <span>等额本息</span>
                            </label>
                            <label class="custom-radio">
                                <input type="radio" name="loan-type" value="equal-principal">
                                <span class="radio-mark"></span>
                                <span>等额本金</span>
                            </label>
                        </div>
                    </div>
                </div>

                <button class="btn-primary calc-calc-btn" id="loan-calc-btn">开始计算</button>

                <div class="calc-result-section" id="loan-result" style="display: none;">
                    <div class="calc-result-card">
                        <h4 class="calc-result-card-title">
                            <span class="calc-result-icon">💰</span>
                            还款概览
                        </h4>
                        <div class="calc-loan-summary" id="loan-summary"></div>
                    </div>

                    <div class="calc-result-card">
                        <div class="calc-result-header">
                            <h4 class="calc-result-title">还款计划</h4>
                            <span class="calc-result-subtitle" id="loan-total-months"></span>
                        </div>
                        <div class="calc-loan-schedule" id="loan-schedule"></div>
                    </div>

                    <div class="calc-notes">
                        <p class="calc-note-title">说明：</p>
                        <ul class="calc-note-list">
                            <li>等额本息：每月还款额相同，前期利息多本金少</li>
                            <li>等额本金：每月本金相同，利息递减，总利息较少</li>
                            <li>计算结果仅供参考，实际以银行为准</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }

    function renderColorSchemeGenerator() {
        var schemeOptions = Object.keys(COLOR_SCHEMES).map(function(key) {
            var scheme = COLOR_SCHEMES[key];
            return `
                <div class="color-scheme-option" data-scheme="${key}">
                    <div class="color-scheme-preview" style="background: linear-gradient(135deg, ${scheme.primary} 0%, ${scheme.secondary} 100%);"></div>
                    <div class="color-scheme-name">${scheme.name}</div>
                </div>
            `;
        }).join('');

        return `
            <div class="calculator-container">
                <div class="calc-input-section">
                    <div class="calc-input-group">
                        <label class="calc-input-label">选择装修风格</label>
                        <div class="color-scheme-grid" id="color-scheme-grid">
                            ${schemeOptions}
                        </div>
                    </div>

                    <div class="calc-input-group">
                        <label class="calc-input-label">自定义主色调</label>
                        <div class="color-picker-row">
                            <input type="color" id="color-primary-picker" value="#4A6F95">
                            <button class="btn-primary color-generate-btn" id="color-generate-btn">生成配色方案</button>
                        </div>
                    </div>
                </div>

                <div class="color-scheme-result" id="color-scheme-result">
                    <div class="calc-result-card">
                        <h4 class="calc-result-card-title">
                            <span class="calc-result-icon">🎨</span>
                            <span id="color-scheme-title">北欧风</span>
                        </h4>
                        <p class="color-scheme-desc" id="color-scheme-desc">清新自然，简约明亮</p>
                        <div class="color-palette" id="color-palette"></div>
                    </div>
                </div>
            </div>
        `;
    }

    function renderCurtainCalculator() {
        var styleOptions = Object.keys(CURTAIN_STYLES).map(function(key) {
            var style = CURTAIN_STYLES[key];
            return `<option value="${key}">${style.name}</option>`;
        }).join('');

        return `
            <div class="calculator-container">
                <div class="calc-input-section">
                    <div class="calc-input-group">
                        <label class="calc-input-label">窗户宽度</label>
                        <div class="calc-input-wrapper">
                            <input type="number" class="form-input calc-input" id="curtain-width" placeholder="请输入窗户宽度" min="0" step="0.1">
                            <span class="calc-input-suffix">米</span>
                        </div>
                    </div>

                    <div class="calc-input-group">
                        <label class="calc-input-label">窗户高度</label>
                        <div class="calc-input-wrapper">
                            <input type="number" class="form-input calc-input" id="curtain-height" placeholder="请输入窗户高度" min="0" step="0.1">
                            <span class="calc-input-suffix">米</span>
                        </div>
                    </div>

                    <div class="calc-input-group">
                        <label class="calc-input-label">窗帘样式</label>
                        <select class="form-input calc-select" id="curtain-style">
                            ${styleOptions}
                        </select>
                    </div>

                    <div class="calc-input-group">
                        <label class="calc-input-label">褶皱倍数</label>
                        <div class="calc-radio-group">
                            <label class="custom-radio">
                                <input type="radio" name="curtain-ratio" value="1.5">
                                <span class="radio-mark"></span>
                                <span>1.5倍</span>
                            </label>
                            <label class="custom-radio">
                                <input type="radio" name="curtain-ratio" value="2" checked>
                                <span class="radio-mark"></span>
                                <span>2倍</span>
                            </label>
                            <label class="custom-radio">
                                <input type="radio" name="curtain-ratio" value="2.5">
                                <span class="radio-mark"></span>
                                <span>2.5倍</span>
                            </label>
                        </div>
                    </div>

                    <div class="calc-input-group">
                        <label class="calc-input-label">布料幅宽</label>
                        <div class="calc-input-wrapper">
                            <input type="number" class="form-input calc-input" id="curtain-fabric-width" placeholder="2.8" value="2.8" min="1" step="0.1">
                            <span class="calc-input-suffix">米</span>
                        </div>
                    </div>
                </div>

                <button class="btn-primary calc-calc-btn" id="curtain-calc-btn">计算用量</button>

                <div class="calc-result-section" id="curtain-result" style="display: none;">
                    <div class="calc-result-card">
                        <h4 class="calc-result-card-title">
                            <span class="calc-result-icon">🧵</span>
                            窗帘用量估算
                        </h4>
                        <div class="calc-curtain-result" id="curtain-result-content"></div>
                    </div>

                    <div class="calc-notes">
                        <p class="calc-note-title">小贴士：</p>
                        <ul class="calc-note-list">
                            <li>褶皱倍数越大，窗帘立体感越强</li>
                            <li>客厅建议2倍褶皱，卧室可1.5-2倍</li>
                            <li>建议预留10-20cm的下摆和卷边</li>
                            <li>对花图案需要额外增加20-30%用料</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }

    function renderLightingCalculator() {
        var roomOptions = Object.keys(ROOM_TYPES).map(function(key) {
            var room = ROOM_TYPES[key];
            return `<option value="${key}">${room.name}</option>`;
        }).join('');

        var lightOptions = Object.keys(LIGHT_TYPES).map(function(key) {
            var light = LIGHT_TYPES[key];
            return `<option value="${key}">${light.name}</option>`;
        }).join('');

        return `
            <div class="calculator-container">
                <div class="calc-input-section">
                    <div class="calc-input-group">
                        <label class="calc-input-label">房间面积</label>
                        <div class="calc-input-wrapper">
                            <input type="number" class="form-input calc-input" id="lighting-area" placeholder="请输入房间面积" min="0">
                            <span class="calc-input-suffix">㎡</span>
                        </div>
                    </div>

                    <div class="calc-input-group">
                        <label class="calc-input-label">房间类型</label>
                        <select class="form-input calc-select" id="lighting-room-type">
                            ${roomOptions}
                        </select>
                    </div>

                    <div class="calc-input-group">
                        <label class="calc-input-label">灯具类型</label>
                        <select class="form-input calc-select" id="lighting-type">
                            ${lightOptions}
                        </select>
                    </div>
                </div>

                <button class="btn-primary calc-calc-btn" id="lighting-calc-btn">开始估算</button>

                <div class="calc-result-section" id="lighting-result" style="display: none;">
                    <div class="calc-result-card">
                        <h4 class="calc-result-card-title">
                            <span class="calc-result-icon">💡</span>
                            灯具数量建议
                        </h4>
                        <div class="calc-lighting-result" id="lighting-result-content"></div>
                    </div>

                    <div class="calc-notes">
                        <p class="calc-note-title">布局建议：</p>
                        <ul class="calc-note-list">
                            <li>客厅建议主灯+辅助光源组合</li>
                            <li>卧室可用暖光，亮度不宜过高</li>
                            <li>厨房建议增加操作台局部照明</li>
                            <li>卫生间注意防潮等级</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }

    function renderFormaldehydeCalculator() {
        var boardOptions = Object.keys(BOARD_TYPES).map(function(key) {
            var board = BOARD_TYPES[key];
            return `<option value="${key}">${board.name}（${board.emission}mg/m³）</option>`;
        }).join('');

        return `
            <div class="calculator-container">
                <div class="calc-input-section">
                    <div class="calc-input-group">
                        <label class="calc-input-label">家具板材面积</label>
                        <div class="calc-input-wrapper">
                            <input type="number" class="form-input calc-input" id="formaldehyde-board-area" placeholder="请输入板材总面积" min="0">
                            <span class="calc-input-suffix">㎡</span>
                        </div>
                    </div>

                    <div class="calc-input-group">
                        <label class="calc-input-label">板材等级</label>
                        <select class="form-input calc-select" id="formaldehyde-board-type">
                            ${boardOptions}
                        </select>
                    </div>

                    <div class="calc-input-group">
                        <label class="calc-input-label">房间面积</label>
                        <div class="calc-input-wrapper">
                            <input type="number" class="form-input calc-input" id="formaldehyde-room-area" placeholder="请输入房间面积" min="0">
                            <span class="calc-input-suffix">㎡</span>
                        </div>
                    </div>

                    <div class="calc-input-group">
                        <label class="calc-input-label">房间层高</label>
                        <div class="calc-input-wrapper">
                            <input type="number" class="form-input calc-input" id="formaldehyde-height" placeholder="2.8" value="2.8" min="2" max="5" step="0.1">
                            <span class="calc-input-suffix">米</span>
                        </div>
                    </div>
                </div>

                <button class="btn-primary calc-calc-btn" id="formaldehyde-calc-btn">开始估算</button>

                <div class="calc-result-section" id="formaldehyde-result" style="display: none;">
                    <div class="calc-result-card">
                        <h4 class="calc-result-card-title">
                            <span class="calc-result-icon">🌬️</span>
                            甲醛评估结果
                        </h4>
                        <div class="calc-formaldehyde-result" id="formaldehyde-result-content"></div>
                    </div>

                    <div class="calc-notes">
                        <p class="calc-note-title">降低甲醛的方法：</p>
                        <ul class="calc-note-list">
                            <li>选择E0/E1级环保板材</li>
                            <li>保持通风，建议通风3-6个月再入住</li>
                            <li>可使用活性炭、绿萝等辅助吸附</li>
                            <li>入住前建议专业机构检测</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }

    function renderDecorationSchedule() {
        return `
            <div class="calculator-container">
                <div class="calc-input-section">
                    <div class="calc-input-group">
                        <label class="calc-input-label">房屋面积</label>
                        <div class="calc-input-wrapper">
                            <input type="number" class="form-input calc-input" id="deco-area" placeholder="请输入房屋面积" min="0">
                            <span class="calc-input-suffix">㎡</span>
                        </div>
                    </div>

                    <div class="calc-input-group">
                        <label class="calc-input-label">装修模式</label>
                        <div class="calc-radio-group">
                            <label class="custom-radio">
                                <input type="radio" name="deco-mode" value="simple" checked>
                                <span class="radio-mark"></span>
                                <span>简装</span>
                            </label>
                            <label class="custom-radio">
                                <input type="radio" name="deco-mode" value="refined">
                                <span class="radio-mark"></span>
                                <span>精装</span>
                            </label>
                            <label class="custom-radio">
                                <input type="radio" name="deco-mode" value="luxury">
                                <span class="radio-mark"></span>
                                <span>豪装</span>
                            </label>
                        </div>
                    </div>

                    <div class="calc-input-group">
                        <div class="calc-switch-row">
                            <label class="calc-input-label" style="margin-bottom: 0;">含定制家具</label>
                            <label class="toggle-switch">
                                <input type="checkbox" id="deco-custom-furniture">
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                    </div>
                </div>

                <button class="btn-primary calc-calc-btn" id="deco-calc-btn">计算工期</button>

                <div class="calc-result-section" id="deco-result" style="display: none;">
                    <div class="calc-result-header">
                        <h4 class="calc-result-title">总工期估算</h4>
                        <div class="schedule-total-days">
                            <span class="schedule-days-number" id="deco-total-days">0</span>
                            <span class="schedule-days-unit">天</span>
                        </div>
                    </div>
                    <div class="schedule-stages" id="deco-stages"></div>
                    <div class="calc-notes">
                        <p class="calc-note-title">工期说明：</p>
                        <ul class="calc-note-list">
                            <li>以上工期为估算值，实际工期受多种因素影响</li>
                            <li>定制家具需要额外15-30天生产周期</li>
                            <li>建议在合同中明确工期和延期赔偿条款</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }

    function initCalculatorEvents(toolId) {
        switch (toolId) {
            case 'payment-calc':
                initPaymentCalculatorEvents();
                break;
            case 'schedule-calc':
                initScheduleCalculatorEvents();
                break;
            case 'area-calc':
                initAreaCalculatorEvents();
                break;
            case 'loan-calc':
                initLoanCalculatorEvents();
                break;
            case 'color-scheme':
                initColorSchemeGeneratorEvents();
                break;
            case 'curtain-calc':
                initCurtainCalculatorEvents();
                break;
            case 'lighting-calc':
                initLightingCalculatorEvents();
                break;
            case 'formaldehyde-calc':
                initFormaldehydeCalculatorEvents();
                break;
            case 'decoration-schedule':
                initDecorationScheduleEvents();
                break;
        }
    }

    function initPaymentCalculatorEvents() {
        var totalInput = document.getElementById('payment-total');
        var presetSelect = document.getElementById('payment-preset');
        var calcBtn = document.getElementById('payment-calc-btn');
        var tabs = document.querySelectorAll('[data-payment-type]');
        var presetGroup = document.getElementById('payment-preset-group');
        var customGroup = document.getElementById('payment-custom-group');
        var periodRadios = document.querySelectorAll('input[name="payment-periods"]');

        tabs.forEach(function(tab) {
            tab.addEventListener('click', function() {
                tabs.forEach(function(t) { t.classList.remove('active'); });
                this.classList.add('active');
                var type = this.getAttribute('data-payment-type');
                if (type === 'preset') {
                    presetGroup.style.display = '';
                    customGroup.style.display = 'none';
                } else {
                    presetGroup.style.display = 'none';
                    customGroup.style.display = '';
                    updateCustomRatioInputs();
                }
            });
        });

        periodRadios.forEach(function(radio) {
            radio.addEventListener('change', function() {
                updateCustomRatioInputs();
            });
        });

        calcBtn.addEventListener('click', calculatePayment);

        if (totalInput) {
            totalInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    calculatePayment();
                }
            });
        }
    }

    function updateCustomRatioInputs() {
        var container = document.getElementById('payment-custom-ratios');
        if (!container) return;

        var checkedRadio = document.querySelector('input[name="payment-periods"]:checked');
        var periods = checkedRadio ? parseInt(checkedRadio.value) : 3;

        var defaultRatios = {
            3: [40, 40, 20],
            4: [30, 30, 30, 10],
            5: [25, 25, 25, 15, 10]
        };

        var ratios = defaultRatios[periods] || defaultRatios[3];
        var nodes = ['首付', '二期', '三期', '四期', '尾期'];

        var html = '';
        for (var i = 0; i < periods; i++) {
            html += `
                <div class="calc-custom-ratio-row">
                    <span class="calc-ratio-label">第${i + 1}期（${nodes[i]}）</span>
                    <div class="calc-ratio-input-wrapper">
                        <input type="number" class="form-input calc-ratio-input" data-ratio-index="${i}" value="${ratios[i]}" min="0" max="100">
                        <span class="calc-ratio-unit">%</span>
                    </div>
                </div>
            `;
        }
        container.innerHTML = html;
    }

    function calculatePayment() {
        var totalInput = document.getElementById('payment-total');
        var total = parseFloat(totalInput.value);

        if (isNaN(total) || total <= 0) {
            showInputError(totalInput, '请输入有效的总预算金额');
            return;
        }

        clearInputError(totalInput);

        var activeTab = document.querySelector('[data-payment-type].active');
        var type = activeTab ? activeTab.getAttribute('data-payment-type') : 'preset';

        var ratios, nodes, isWarranty;

        if (type === 'preset') {
            var presetSelect = document.getElementById('payment-preset');
            var presetKey = presetSelect.value;
            var preset = PAYMENT_PRESETS[presetKey];
            ratios = preset.ratios;
            nodes = preset.nodes;
            isWarranty = preset.isWarranty;
        } else {
            var ratioInputs = document.querySelectorAll('.calc-ratio-input');
            ratios = [];
            ratioInputs.forEach(function(input) {
                ratios.push(parseFloat(input.value) || 0);
            });
            var ratioSum = ratios.reduce(function(a, b) { return a + b; }, 0);
            if (Math.abs(ratioSum - 100) > 0.01) {
                if (window.Toast && Toast.warning) {
                    Toast.warning('各期比例之和应为100%，当前为' + ratioSum + '%');
                }
            }
            nodes = ratios.map(function(_, i) { return '第' + (i + 1) + '期'; });
            isWarranty = ratios.map(function(_, i) { return i === ratios.length - 1; });
        }

        var scheduleHtml = '';
        var totalCalc = 0;

        for (var i = 0; i < ratios.length; i++) {
            var amount = total * ratios[i] / 100;
            totalCalc += amount;
            var isLast = i === ratios.length - 1;
            var warrantyClass = isWarranty[i] ? 'warranty' : '';

            scheduleHtml += `
                <div class="payment-row ${warrantyClass}">
                    <div class="payment-phase">
                        <span class="payment-phase-num">${i + 1}</span>
                        <span class="payment-phase-name">${nodes[i]}</span>
                        ${isWarranty[i] ? '<span class="payment-badge">质保金</span>' : ''}
                    </div>
                    <div class="payment-ratio-bar">
                        <div class="payment-ratio-fill" style="width: ${ratios[i]}%;"></div>
                    </div>
                    <div class="payment-info">
                        <span class="payment-ratio">${ratios[i]}%</span>
                        <span class="payment-amount">¥${formatNumber(amount)}</span>
                    </div>
                </div>
            `;
        }

        var scheduleContainer = document.getElementById('payment-schedule');
        var resultSection = document.getElementById('payment-result');
        var totalAmountEl = document.getElementById('payment-total-amount');
        var verifyEl = document.getElementById('payment-verify');

        if (scheduleContainer) {
            scheduleContainer.innerHTML = scheduleHtml;
        }
        if (totalAmountEl) {
            totalAmountEl.textContent = '¥' + formatNumber(totalCalc);
        }
        if (verifyEl) {
            var diff = Math.abs(totalCalc - total);
            if (diff < 0.01) {
                verifyEl.innerHTML = '<span class="calc-verify-success">✓ 各期金额相加 = 总预算，计算正确</span>';
            } else {
                verifyEl.innerHTML = '<span class="calc-verify-warning">⚠ 各期比例之和为' + (ratios.reduce(function(a, b) { return a + b; }, 0)) + '%，请注意</span>';
            }
        }
        if (resultSection) {
            resultSection.style.display = '';
            resultSection.classList.add('calculator-fade-in');
        }
    }

    function initScheduleCalculatorEvents() {
        var areaInput = document.getElementById('schedule-area');
        var calcBtn = document.getElementById('schedule-calc-btn');

        calcBtn.addEventListener('click', calculateSchedule);

        if (areaInput) {
            areaInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    calculateSchedule();
                }
            });
        }
    }

    function calculateSchedule() {
        var areaInput = document.getElementById('schedule-area');
        var area = parseFloat(areaInput.value);

        if (isNaN(area) || area <= 0) {
            showInputError(areaInput, '请输入有效的房屋面积');
            return;
        }

        clearInputError(areaInput);

        var modeRadios = document.querySelectorAll('input[name="schedule-mode"]:checked');
        var mode = modeRadios.length > 0 ? modeRadios[0].value : 'full';

        var houseTypeRadios = document.querySelectorAll('input[name="house-type"]:checked');
        var houseType = houseTypeRadios.length > 0 ? houseTypeRadios[0].value : 'new';

        var demolitionCheckbox = document.getElementById('schedule-demolition');
        var hasDemolition = demolitionCheckbox ? demolitionCheckbox.checked : false;

        var baseDays = SCHEDULE_BASE[mode].days;
        var areaRatio = area / 100;
        var totalDays = Math.round(baseDays * areaRatio);

        if (houseType === 'second') {
            totalDays += Math.round(7 * areaRatio);
        }
        if (hasDemolition) {
            totalDays += Math.round(12 * areaRatio);
        }

        totalDays = Math.max(totalDays, 30);

        var stagesHtml = '';
        var currentDay = 0;

        for (var i = 0; i < SCHEDULE_STAGES.length; i++) {
            var stage = SCHEDULE_STAGES[i];
            var stageDays = Math.max(1, Math.round(totalDays * stage.ratio));
            var startDay = currentDay + 1;
            var endDay = currentDay + stageDays;
            currentDay += stageDays;

            stagesHtml += `
                <div class="schedule-stage-row">
                    <div class="schedule-stage-icon">${stage.icon}</div>
                    <div class="schedule-stage-info">
                        <div class="schedule-stage-header">
                            <span class="schedule-stage-name">${stage.name}</span>
                            <span class="schedule-stage-days">${stageDays}天</span>
                        </div>
                        <div class="schedule-stage-bar">
                            <div class="schedule-stage-fill" style="width: ${(stageDays / totalDays * 100).toFixed(1)}%; animation-delay: ${i * 0.1}s;"></div>
                        </div>
                        <div class="schedule-stage-range">第${startDay}-${endDay}天</div>
                    </div>
                </div>
            `;
        }

        var totalDaysEl = document.getElementById('schedule-total-days');
        var stagesContainer = document.getElementById('schedule-stages');
        var resultSection = document.getElementById('schedule-result');

        if (totalDaysEl) {
            totalDaysEl.textContent = totalDays;
        }
        if (stagesContainer) {
            stagesContainer.innerHTML = stagesHtml;
        }
        if (resultSection) {
            resultSection.style.display = '';
            resultSection.classList.add('calculator-fade-in');
        }
    }

    function initAreaCalculatorEvents() {
        var buildingInput = document.getElementById('area-building');
        var calcBtn = document.getElementById('area-calc-btn');

        calcBtn.addEventListener('click', calculateArea);

        if (buildingInput) {
            buildingInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    calculateArea();
                }
            });
        }
    }

    function calculateArea() {
        var buildingInput = document.getElementById('area-building');
        var buildingArea = parseFloat(buildingInput.value);

        if (isNaN(buildingArea) || buildingArea <= 0) {
            showInputError(buildingInput, '请输入有效的建筑面积');
            return;
        }

        clearInputError(buildingInput);

        var heightInput = document.getElementById('area-height');
        var efficiencyInput = document.getElementById('area-efficiency');

        var height = parseFloat(heightInput.value) || 2.8;
        var efficiency = parseFloat(efficiencyInput.value) || 75;

        if (height < 2 || height > 5) {
            showInputError(heightInput, '层高超正常范围（2-5m）');
            return;
        }
        if (efficiency < 50 || efficiency > 95) {
            showInputError(efficiencyInput, '得房率超正常范围（50-95%）');
            return;
        }

        var insideArea = buildingArea * efficiency / 100;
        var floorArea = insideArea;
        var wallArea = floorArea * 2.5;
        var ceilingArea = floorArea;

        var tileFloor800 = Math.ceil(floorArea / (0.8 * 0.8) * 1.05);
        var tileWall600 = Math.ceil(wallArea / (0.6 * 0.6) * 1.05);
        var latexPaint = Math.ceil((wallArea + ceilingArea) / 10 * 2);
        var wallpaper = Math.ceil(wallArea / 5.3 * 1.1);
        var flooring = Math.ceil(floorArea * 1.05);

        var areaGridHtml = `
            <div class="calc-area-item">
                <span class="calc-area-label">套内面积</span>
                <span class="calc-area-value">${insideArea.toFixed(1)}<small>㎡</small></span>
            </div>
            <div class="calc-area-item">
                <span class="calc-area-label">地面面积</span>
                <span class="calc-area-value">${floorArea.toFixed(1)}<small>㎡</small></span>
            </div>
            <div class="calc-area-item">
                <span class="calc-area-label">墙面面积</span>
                <span class="calc-area-value">${wallArea.toFixed(1)}<small>㎡</small></span>
            </div>
            <div class="calc-area-item">
                <span class="calc-area-label">顶面面积</span>
                <span class="calc-area-value">${ceilingArea.toFixed(1)}<small>㎡</small></span>
            </div>
        `;

        var materialListHtml = `
            <div class="calc-material-item">
                <div class="calc-material-header">
                    <span class="calc-material-name">地砖（800×800）</span>
                    <span class="calc-material-amount">${tileFloor800} 块</span>
                </div>
                <div class="calc-material-desc">约 ${(tileFloor800 * 0.8 * 0.8).toFixed(1)}㎡（含5%损耗）</div>
            </div>
            <div class="calc-material-item">
                <div class="calc-material-header">
                    <span class="calc-material-name">墙砖（600×600）</span>
                    <span class="calc-material-amount">${tileWall600} 块</span>
                </div>
                <div class="calc-material-desc">约 ${(tileWall600 * 0.6 * 0.6).toFixed(1)}㎡（含5%损耗）</div>
            </div>
            <div class="calc-material-item">
                <div class="calc-material-header">
                    <span class="calc-material-name">乳胶漆（2遍）</span>
                    <span class="calc-material-amount">${latexPaint} L</span>
                </div>
                <div class="calc-material-desc">涂刷面积约 ${(wallArea + ceilingArea).toFixed(1)}㎡（10㎡/L）</div>
            </div>
            <div class="calc-material-item">
                <div class="calc-material-header">
                    <span class="calc-material-name">壁纸</span>
                    <span class="calc-material-amount">${wallpaper} 卷</span>
                </div>
                <div class="calc-material-desc">约 ${(wallpaper * 5.3).toFixed(1)}㎡（含10%损耗）</div>
            </div>
            <div class="calc-material-item">
                <div class="calc-material-header">
                    <span class="calc-material-name">地板</span>
                    <span class="calc-material-amount">${flooring} ㎡</span>
                </div>
                <div class="calc-material-desc">含5%损耗</div>
            </div>
        `;

        var areaGridEl = document.getElementById('area-estimate-grid');
        var materialListEl = document.getElementById('area-material-list');
        var resultSection = document.getElementById('area-result');

        if (areaGridEl) {
            areaGridEl.innerHTML = areaGridHtml;
        }
        if (materialListEl) {
            materialListEl.innerHTML = materialListHtml;
        }
        if (resultSection) {
            resultSection.style.display = '';
            resultSection.classList.add('calculator-fade-in');
        }
    }

    function showInputError(input, message) {
        if (!input) return;
        input.classList.add('error');
        var errorEl = input.nextElementSibling;
        if (errorEl && errorEl.classList.contains('form-error-message')) {
            errorEl.textContent = message;
        } else {
            var wrapper = input.parentElement;
            if (wrapper) {
                var newError = document.createElement('div');
                newError.className = 'form-error-message';
                newError.textContent = message;
                wrapper.appendChild(newError);
            }
        }
    }

    function clearInputError(input) {
        if (!input) return;
        input.classList.remove('error');
        var errorEl = input.parentElement.querySelector('.form-error-message');
        if (errorEl) {
            errorEl.remove();
        }
    }

    function formatNumber(num) {
        return num.toLocaleString('zh-CN', { maximumFractionDigits: 2 });
    }

    function getToolFeatures(toolId) {
        var featureMap = {
            'talk-script': [
                '开工前沟通话术模板',
                '隐蔽工程验收要点',
                '增项谈判应对技巧',
                '尾款支付沟通策略'
            ],
            'photo-inspection': [
                '水电改造拍照清单',
                '瓦工验收拍照要点',
                '木工吊顶拍照标准',
                '竣工验收完整清单'
            ],
            'addon-reference': [
                '常见增项价格参考表',
                '恶意增项识别技巧',
                '增项谈判沟通话术',
                '增项合同注意事项'
            ],
            'payment-calc': [
                '多种预设付款模式',
                '自定义分期比例',
                '各期金额自动计算',
                '质保金单独标注'
            ],
            'schedule-calc': [
                '总工期智能估算',
                '各阶段工期分解',
                '甘特图式进度展示',
                '工期说明和注意事项'
            ],
            'area-calc': [
                '套内/墙面/顶面面积估算',
                '瓷砖/地板用量计算',
                '乳胶漆/壁纸用量预估',
                '详细计算公式说明'
            ],
            'loan-calc': [
                '等额本息/等额本金双模式',
                '月供和总利息自动计算',
                '还款计划表详细展示',
                '可自定义利率和期限'
            ],
            'color-scheme': [
                '6种装修风格预设配色',
                '支持自定义主色调',
                '色卡和十六进制代码展示',
                '一键复制颜色值'
            ],
            'curtain-calc': [
                '多种窗帘样式可选',
                '褶皱倍数自由调节',
                '布料用量精确计算',
                '实用选购建议'
            ],
            'lighting-calc': [
                '6种房间类型适配',
                '3种灯具类型估算',
                '数量和瓦数双建议',
                '布局参考指导'
            ],
            'formaldehyde-calc': [
                'E0/E1/E2板材分级',
                '甲醛释放量估算',
                '超标风险评估',
                '通风时间建议'
            ],
            'decoration-schedule': [
                '简装/精装/豪装三模式',
                '定制家具工期加成',
                '9大施工阶段分解',
                '详细工期规划表'
            ]
        };
        return featureMap[toolId] || ['功能开发中...'];
    }

    function initLoanCalculatorEvents() {
        var calcBtn = document.getElementById('loan-calc-btn');
        var amountInput = document.getElementById('loan-amount');

        calcBtn.addEventListener('click', calculateLoan);
        if (amountInput) {
            amountInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') calculateLoan();
            });
        }
    }

    function calculateLoan() {
        var amountInput = document.getElementById('loan-amount');
        var rateInput = document.getElementById('loan-rate');
        var yearsInput = document.getElementById('loan-years');

        var amount = parseFloat(amountInput.value) * 10000;
        var annualRate = parseFloat(rateInput.value);
        var years = parseInt(yearsInput.value);

        if (isNaN(amount) || amount <= 0) {
            showInputError(amountInput, '请输入有效的贷款金额');
            return;
        }
        clearInputError(amountInput);

        if (isNaN(annualRate) || annualRate <= 0 || annualRate > 30) {
            showInputError(rateInput, '请输入有效的年利率（0-30%）');
            return;
        }
        clearInputError(rateInput);

        if (isNaN(years) || years <= 0 || years > 30) {
            showInputError(yearsInput, '请输入有效的贷款期限（1-30年）');
            return;
        }
        clearInputError(yearsInput);

        var monthlyRate = annualRate / 100 / 12;
        var totalMonths = years * 12;
        var typeRadios = document.querySelectorAll('input[name="loan-type"]:checked');
        var loanType = typeRadios.length > 0 ? typeRadios[0].value : 'equal-principal-interest';

        var monthlyPayment, totalPayment, totalInterest;
        var schedule = [];

        if (loanType === 'equal-principal-interest') {
            monthlyPayment = amount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
            totalPayment = monthlyPayment * totalMonths;
            totalInterest = totalPayment - amount;

            var remaining = amount;
            for (var i = 1; i <= totalMonths; i++) {
                var interest = remaining * monthlyRate;
                var principal = monthlyPayment - interest;
                remaining -= principal;
                schedule.push({
                    month: i,
                    payment: monthlyPayment,
                    principal: principal,
                    interest: interest,
                    remaining: Math.max(0, remaining)
                });
            }
        } else {
            var monthlyPrincipal = amount / totalMonths;
            totalInterest = 0;
            var remaining2 = amount;
            for (var j = 1; j <= totalMonths; j++) {
                var interest2 = remaining2 * monthlyRate;
                var payment2 = monthlyPrincipal + interest2;
                remaining2 -= monthlyPrincipal;
                totalInterest += interest2;
                schedule.push({
                    month: j,
                    payment: payment2,
                    principal: monthlyPrincipal,
                    interest: interest2,
                    remaining: Math.max(0, remaining2)
                });
            }
            monthlyPayment = schedule[0].payment;
            totalPayment = amount + totalInterest;
        }

        var summaryHtml = `
            <div class="calc-loan-summary-item">
                <span class="calc-loan-summary-label">月供（首月）</span>
                <span class="calc-loan-summary-value">¥${formatNumber(monthlyPayment)}</span>
            </div>
            <div class="calc-loan-summary-item">
                <span class="calc-loan-summary-label">总还款额</span>
                <span class="calc-loan-summary-value">¥${formatNumber(totalPayment)}</span>
            </div>
            <div class="calc-loan-summary-item">
                <span class="calc-loan-summary-label">总利息</span>
                <span class="calc-loan-summary-value highlight">¥${formatNumber(totalInterest)}</span>
            </div>
            <div class="calc-loan-summary-item">
                <span class="calc-loan-summary-label">贷款总额</span>
                <span class="calc-loan-summary-value">¥${formatNumber(amount)}</span>
            </div>
        `;

        var displaySchedule = [];
        if (schedule.length <= 15) {
            displaySchedule = schedule;
        } else {
            displaySchedule = schedule.slice(0, 12).concat([null], schedule.slice(-3));
        }

        var scheduleHtml = displaySchedule.map(function(item, idx) {
            if (item === null) {
                return '<div class="calc-loan-schedule-ellipsis">...</div>';
            }
            return `
                <div class="calc-loan-row">
                    <span class="calc-loan-month">第${item.month}期</span>
                    <span class="calc-loan-payment">¥${formatNumber(item.payment)}</span>
                    <span class="calc-loan-principal">本金 ¥${formatNumber(item.principal)}</span>
                    <span class="calc-loan-interest">利息 ¥${formatNumber(item.interest)}</span>
                </div>
            `;
        }).join('');

        var summaryEl = document.getElementById('loan-summary');
        var scheduleEl = document.getElementById('loan-schedule');
        var monthsEl = document.getElementById('loan-total-months');
        var resultEl = document.getElementById('loan-result');

        if (summaryEl) summaryEl.innerHTML = summaryHtml;
        if (scheduleEl) scheduleEl.innerHTML = scheduleHtml;
        if (monthsEl) monthsEl.textContent = '共' + totalMonths + '期';
        if (resultEl) {
            resultEl.style.display = '';
            resultEl.classList.add('calculator-fade-in');
        }
    }

    function initColorSchemeGeneratorEvents() {
        var schemeOptions = document.querySelectorAll('[data-scheme]');
        schemeOptions.forEach(function(opt) {
            opt.addEventListener('click', function() {
                var schemeKey = this.getAttribute('data-scheme');
                applyColorScheme(schemeKey);
            });
        });

        var generateBtn = document.getElementById('color-generate-btn');
        if (generateBtn) {
            generateBtn.addEventListener('click', function() {
                var picker = document.getElementById('color-primary-picker');
                if (picker) {
                    generateCustomScheme(picker.value);
                }
            });
        }

        setTimeout(function() {
            applyColorScheme('nordic');
        }, 100);
    }

    function applyColorScheme(schemeKey) {
        var scheme = COLOR_SCHEMES[schemeKey];
        if (!scheme) return;

        var options = document.querySelectorAll('[data-scheme]');
        options.forEach(function(opt) {
            opt.classList.toggle('active', opt.getAttribute('data-scheme') === schemeKey);
        });

        renderColorPalette(scheme);
    }

    function generateCustomScheme(primaryColor) {
        var scheme = {
            name: '自定义',
            desc: '基于主色调生成的配色方案',
            primary: primaryColor,
            secondary: adjustColor(primaryColor, 30, 20),
            accent: adjustColor(primaryColor, -20, -10),
            neutral: [
                adjustColor(primaryColor, 60, -5),
                adjustColor(primaryColor, 40, -8),
                adjustColor(primaryColor, 20, -15),
                adjustColor(primaryColor, 0, -30)
            ],
            bg: adjustColor(primaryColor, 70, -3)
        };

        var options = document.querySelectorAll('[data-scheme]');
        options.forEach(function(opt) { opt.classList.remove('active'); });

        renderColorPalette(scheme);
    }

    function adjustColor(hex, lightness, saturation) {
        var r = parseInt(hex.slice(1, 3), 16);
        var g = parseInt(hex.slice(3, 5), 16);
        var b = parseInt(hex.slice(5, 7), 16);

        r = Math.min(255, Math.max(0, r + lightness));
        g = Math.min(255, Math.max(0, g + lightness * 0.8));
        b = Math.min(255, Math.max(0, b + lightness * 0.6));

        return '#' + [r, g, b].map(function(x) {
            return Math.round(x).toString(16).padStart(2, '0');
        }).join('').toUpperCase();
    }

    function renderColorPalette(scheme) {
        var titleEl = document.getElementById('color-scheme-title');
        var descEl = document.getElementById('color-scheme-desc');
        var paletteEl = document.getElementById('color-palette');

        if (titleEl) titleEl.textContent = scheme.name;
        if (descEl) descEl.textContent = scheme.desc;

        var colors = [
            { name: '主色', color: scheme.primary },
            { name: '辅助色', color: scheme.secondary },
            { name: '强调色', color: scheme.accent }
        ];

        scheme.neutral.forEach(function(n, i) {
            colors.push({ name: '中性色' + (i + 1), color: n });
        });

        if (paletteEl) {
            paletteEl.innerHTML = colors.map(function(c) {
                return `
                    <div class="color-card">
                        <div class="color-card-swatch" style="background-color: ${c.color};" data-copy-color="${c.color}">
                            <button class="color-copy-btn" title="复制颜色">
                                ${ICONS['copy']}
                            </button>
                        </div>
                        <div class="color-card-name">${c.name}</div>
                        <div class="color-card-hex">${c.color.toUpperCase()}</div>
                    </div>
                `;
            }).join('');

            var copyBtns = paletteEl.querySelectorAll('.color-card-swatch');
            copyBtns.forEach(function(btn) {
                btn.addEventListener('click', function() {
                    var color = this.getAttribute('data-copy-color');
                    copyToClipboard(color);
                    var icon = this.querySelector('.color-copy-btn');
                    if (icon) {
                        var originalHtml = icon.innerHTML;
                        icon.innerHTML = ICONS['check'];
                        setTimeout(function() {
                            icon.innerHTML = originalHtml;
                        }, 1500);
                    }
                });
            });
        }
    }

    function copyToClipboard(text) {
        var textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            if (window.Toast) Toast.show('已复制: ' + text, 'success');
        } catch (e) {
            console.error('Copy failed:', e);
        }
        document.body.removeChild(textarea);
    }

    function initCurtainCalculatorEvents() {
        var calcBtn = document.getElementById('curtain-calc-btn');
        var widthInput = document.getElementById('curtain-width');

        calcBtn.addEventListener('click', calculateCurtain);
        if (widthInput) {
            widthInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') calculateCurtain();
            });
        }
    }

    function calculateCurtain() {
        var widthInput = document.getElementById('curtain-width');
        var heightInput = document.getElementById('curtain-height');
        var styleSelect = document.getElementById('curtain-style');
        var fabricInput = document.getElementById('curtain-fabric-width');

        var width = parseFloat(widthInput.value);
        var height = parseFloat(heightInput.value);
        var styleKey = styleSelect.value;
        var fabricWidth = parseFloat(fabricInput.value);

        if (isNaN(width) || width <= 0) {
            showInputError(widthInput, '请输入有效的窗户宽度');
            return;
        }
        clearInputError(widthInput);

        if (isNaN(height) || height <= 0) {
            showInputError(heightInput, '请输入有效的窗户高度');
            return;
        }
        clearInputError(heightInput);

        if (isNaN(fabricWidth) || fabricWidth <= 0) {
            showInputError(fabricInput, '请输入有效的布料幅宽');
            return;
        }
        clearInputError(fabricInput);

        var ratioRadios = document.querySelectorAll('input[name="curtain-ratio"]:checked');
        var ratio = ratioRadios.length > 0 ? parseFloat(ratioRadios[0].value) : 2;

        var style = CURTAIN_STYLES[styleKey] || CURTAIN_STYLES['pleated'];
        var totalWidth = width * ratio * style.ratio;
        var panels = Math.ceil(totalWidth / fabricWidth);
        var fabricLength = height + 0.3;
        var totalFabric = panels * fabricLength;

        var resultHtml = `
            <div class="calc-curtain-item">
                <span class="calc-curtain-label">窗帘总宽度</span>
                <span class="calc-curtain-value">${totalWidth.toFixed(2)} 米</span>
            </div>
            <div class="calc-curtain-item">
                <span class="calc-curtain-label">需要幅数</span>
                <span class="calc-curtain-value">${panels} 幅</span>
            </div>
            <div class="calc-curtain-item">
                <span class="calc-curtain-label">单幅长度</span>
                <span class="calc-curtain-value">${fabricLength.toFixed(2)} 米</span>
            </div>
            <div class="calc-curtain-item highlight">
                <span class="calc-curtain-label">总用料</span>
                <span class="calc-curtain-value">${totalFabric.toFixed(2)} 米</span>
            </div>
            <div class="calc-curtain-tip">
                <strong>褶皱建议：</strong>
                ${ratio >= 2.5 ? '高褶皱效果，立体感强，适合豪华大气的风格' :
                  ratio >= 2 ? '标准褶皱，效果自然饱满，适合大多数家庭' :
                  '简约褶皱，节省布料，适合现代简约风格'}
            </div>
        `;

        var resultContent = document.getElementById('curtain-result-content');
        var resultEl = document.getElementById('curtain-result');

        if (resultContent) resultContent.innerHTML = resultHtml;
        if (resultEl) {
            resultEl.style.display = '';
            resultEl.classList.add('calculator-fade-in');
        }
    }

    function initLightingCalculatorEvents() {
        var calcBtn = document.getElementById('lighting-calc-btn');
        var areaInput = document.getElementById('lighting-area');

        calcBtn.addEventListener('click', calculateLighting);
        if (areaInput) {
            areaInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') calculateLighting();
            });
        }
    }

    function calculateLighting() {
        var areaInput = document.getElementById('lighting-area');
        var roomSelect = document.getElementById('lighting-room-type');
        var lightSelect = document.getElementById('lighting-type');

        var area = parseFloat(areaInput.value);
        var roomKey = roomSelect.value;
        var lightKey = lightSelect.value;

        if (isNaN(area) || area <= 0) {
            showInputError(areaInput, '请输入有效的房间面积');
            return;
        }
        clearInputError(areaInput);

        var room = ROOM_TYPES[roomKey] || ROOM_TYPES['living'];
        var light = LIGHT_TYPES[lightKey] || LIGHT_TYPES['ceiling'];

        var lightCount = Math.max(1, Math.ceil(area / light.coverage));
        var totalWattage = lightCount * light.wattage;
        var suggestedWattage = area * room.wattPerSqm;

        var layoutTip = '';
        if (lightKey === 'ceiling') {
            layoutTip = '建议安装在房间中央，保证光线均匀分布';
        } else if (lightKey === 'downlight') {
            layoutTip = '建议间距1.2-1.5米，均匀分布在吊顶上';
        } else {
            layoutTip = '建议用于背景墙、装饰画等重点照明区域';
        }

        var resultHtml = `
            <div class="calc-lighting-item">
                <span class="calc-lighting-label">建议数量</span>
                <span class="calc-lighting-value">${lightCount} 盏</span>
            </div>
            <div class="calc-lighting-item">
                <span class="calc-lighting-label">单灯瓦数</span>
                <span class="calc-lighting-value">${light.wattage} W</span>
            </div>
            <div class="calc-lighting-item">
                <span class="calc-lighting-label">总功率</span>
                <span class="calc-lighting-value">${totalWattage} W</span>
            </div>
            <div class="calc-lighting-item">
                <span class="calc-lighting-label">建议总瓦数</span>
                <span class="calc-lighting-value">${suggestedWattage.toFixed(0)} W</span>
            </div>
            <div class="calc-lighting-item highlight">
                <span class="calc-lighting-label">光照亮度</span>
                <span class="calc-lighting-value">${room.lux} lux</span>
            </div>
            <div class="calc-lighting-tip">
                <strong>布局建议：</strong>${layoutTip}
            </div>
        `;

        var resultContent = document.getElementById('lighting-result-content');
        var resultEl = document.getElementById('lighting-result');

        if (resultContent) resultContent.innerHTML = resultHtml;
        if (resultEl) {
            resultEl.style.display = '';
            resultEl.classList.add('calculator-fade-in');
        }
    }

    function initFormaldehydeCalculatorEvents() {
        var calcBtn = document.getElementById('formaldehyde-calc-btn');
        var boardInput = document.getElementById('formaldehyde-board-area');

        calcBtn.addEventListener('click', calculateFormaldehyde);
        if (boardInput) {
            boardInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') calculateFormaldehyde();
            });
        }
    }

    function calculateFormaldehyde() {
        var boardInput = document.getElementById('formaldehyde-board-area');
        var boardSelect = document.getElementById('formaldehyde-board-type');
        var roomInput = document.getElementById('formaldehyde-room-area');
        var heightInput = document.getElementById('formaldehyde-height');

        var boardArea = parseFloat(boardInput.value);
        var boardKey = boardSelect.value;
        var roomArea = parseFloat(roomInput.value);
        var height = parseFloat(heightInput.value);

        if (isNaN(boardArea) || boardArea <= 0) {
            showInputError(boardInput, '请输入有效的板材面积');
            return;
        }
        clearInputError(boardInput);

        if (isNaN(roomArea) || roomArea <= 0) {
            showInputError(roomInput, '请输入有效的房间面积');
            return;
        }
        clearInputError(roomInput);

        if (isNaN(height) || height < 2 || height > 5) {
            showInputError(heightInput, '请输入有效的层高（2-5米）');
            return;
        }
        clearInputError(heightInput);

        var board = BOARD_TYPES[boardKey] || BOARD_TYPES['E1'];
        var roomVolume = roomArea * height;
        var emissionFactor = 0.5;
        var estimatedConcentration = (boardArea * board.emission * emissionFactor) / roomVolume;

        var standard = 0.1;
        var isSafe = estimatedConcentration <= standard;
        var ventilationDays = isSafe ? 7 : Math.ceil((estimatedConcentration / standard) * 30);

        var statusClass = isSafe ? 'safe' : 'danger';
        var statusText = isSafe ? '达标' : '超标';
        var statusIcon = isSafe ? '✓' : '⚠';

        var resultHtml = `
            <div class="calc-formaldehyde-status ${statusClass}">
                <span class="calc-formaldehyde-status-icon">${statusIcon}</span>
                <span class="calc-formaldehyde-status-text">甲醛浓度${statusText}</span>
            </div>
            <div class="calc-formaldehyde-item">
                <span class="calc-formaldehyde-label">预估浓度</span>
                <span class="calc-formaldehyde-value ${statusClass}">${estimatedConcentration.toFixed(3)} mg/m³</span>
            </div>
            <div class="calc-formaldehyde-item">
                <span class="calc-formaldehyde-label">国家标准</span>
                <span class="calc-formaldehyde-value">${standard} mg/m³</span>
            </div>
            <div class="calc-formaldehyde-item">
                <span class="calc-formaldehyde-label">房间体积</span>
                <span class="calc-formaldehyde-value">${roomVolume.toFixed(1)} m³</span>
            </div>
            <div class="calc-formaldehyde-item highlight">
                <span class="calc-formaldehyde-label">建议通风时间</span>
                <span class="calc-formaldehyde-value">${ventilationDays} 天</span>
            </div>
            <div class="calc-formaldehyde-tip">
                <strong>温馨提示：</strong>
                ${isSafe ? '甲醛浓度在安全范围内，建议保持日常通风即可。' :
                  '甲醛浓度超标，建议增加通风时间，可配合活性炭、空气净化器等使用。入住前建议请专业机构检测。'}
            </div>
        `;

        var resultContent = document.getElementById('formaldehyde-result-content');
        var resultEl = document.getElementById('formaldehyde-result');

        if (resultContent) resultContent.innerHTML = resultHtml;
        if (resultEl) {
            resultEl.style.display = '';
            resultEl.classList.add('calculator-fade-in');
        }
    }

    function initDecorationScheduleEvents() {
        var calcBtn = document.getElementById('deco-calc-btn');
        var areaInput = document.getElementById('deco-area');

        calcBtn.addEventListener('click', calculateDecorationSchedule);
        if (areaInput) {
            areaInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') calculateDecorationSchedule();
            });
        }
    }

    function calculateDecorationSchedule() {
        var areaInput = document.getElementById('deco-area');
        var area = parseFloat(areaInput.value);

        if (isNaN(area) || area <= 0) {
            showInputError(areaInput, '请输入有效的房屋面积');
            return;
        }
        clearInputError(areaInput);

        var modeRadios = document.querySelectorAll('input[name="deco-mode"]:checked');
        var modeKey = modeRadios.length > 0 ? modeRadios[0].value : 'refined';
        var customCheckbox = document.getElementById('deco-custom-furniture');
        var hasCustom = customCheckbox ? customCheckbox.checked : false;

        var mode = DECORATION_MODES[modeKey] || DECORATION_MODES.refined;
        var areaFactor = area / 100;
        var totalDays = Math.round(mode.baseDays * areaFactor * mode.multiplier);

        if (hasCustom) {
            totalDays += Math.round(20 * areaFactor);
        }

        totalDays = Math.max(totalDays, 20);

        var stagesHtml = '';
        var currentDay = 0;

        for (var i = 0; i < DECORATION_STAGES.length; i++) {
            var stage = DECORATION_STAGES[i];
            var stageDays = Math.max(1, Math.round(totalDays * stage.ratio));
            var startDay = currentDay + 1;
            var endDay = currentDay + stageDays;
            currentDay += stageDays;

            stagesHtml += `
                <div class="schedule-stage-row">
                    <div class="schedule-stage-icon">${stage.icon}</div>
                    <div class="schedule-stage-info">
                        <div class="schedule-stage-header">
                            <span class="schedule-stage-name">${stage.name}</span>
                            <span class="schedule-stage-days">${stageDays}天</span>
                        </div>
                        <div class="schedule-stage-bar">
                            <div class="schedule-stage-fill" style="width: ${(stageDays / totalDays * 100).toFixed(1)}%; animation-delay: ${i * 0.1}s;"></div>
                        </div>
                        <div class="schedule-stage-range">第${startDay}-${endDay}天</div>
                    </div>
                </div>
            `;
        }

        var totalDaysEl = document.getElementById('deco-total-days');
        var stagesContainer = document.getElementById('deco-stages');
        var resultSection = document.getElementById('deco-result');

        if (totalDaysEl) totalDaysEl.textContent = totalDays;
        if (stagesContainer) stagesContainer.innerHTML = stagesHtml;
        if (resultSection) {
            resultSection.style.display = '';
            resultSection.classList.add('calculator-fade-in');
        }
    }

    function closeToolModal() {
        currentToolId = null;
        if (el.toolModal) {
            el.toolModal.classList.remove('active');
        }
    }

    function showToolComingSoon() {
        closeToolModal();
        showNianTip('这个功能正在紧锣密鼓开发中，敬请期待哦~');
    }

    function showNianTip(message) {
        var tipId = 'tool-tip-' + Date.now();
        var tipHtml = `
            <div class="nian-auto-tip" id="${tipId}">
                <div class="nian-auto-tip-content">
                    <span class="nian-auto-tip-emoji">${Icons.render('nian-happy')}</span>
                    <span class="nian-auto-tip-text">${message}</span>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', tipHtml);

        var tip = document.getElementById(tipId);
        setTimeout(function() {
            tip.classList.add('show');
        }, 50);

        setTimeout(function() {
            tip.classList.remove('show');
            setTimeout(function() {
                tip.remove();
            }, 500);
        }, 2500);
    }

    function destroy() {
        clearElementCache();
        container = null;
        currentToolId = null;
    }

    function safeRender(containerEl) {
        try {
            render(containerEl);
        } catch (e) {
            console.error('[ToolsView] render error:', e);
            if (window.App && App.showErrorState) {
                App.showErrorState(containerEl, {
                    title: '页面加载失败',
                    desc: '小管家在加载工具箱时遇到了一点小问题~',
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
            console.error('[ToolsView] init error:', e);
            if (window.Toast && Toast.error) {
                Toast.error('页面初始化出错了');
            }
        }
    }

    function safeViewEnter(containerEl) {
        try {
            viewEnter(containerEl);
        } catch (e) {
            console.error('[ToolsView] viewEnter error:', e);
        }
    }

    return {
        render: safeRender,
        init: safeInit,
        viewEnter: safeViewEnter,
        destroy: destroy
    };
})();
