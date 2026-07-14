/**
 * 山河同人馆 - ch省拟 平台主逻辑
 */

// ==================== 数据配置 ====================
const SEARCH_RULES = [
  { keywords: ['国拟', 'CH', '国家拟人', 'countryhuman', 'country humans', 'countryhumans'], target: 'ch', section: 'history' },
  { keywords: ['省拟', '省份拟人'], target: 'prov', section: 'history' },
  { keywords: ['CP', 'cp'], target: 'current', section: 'cp' },
  { keywords: ['历史', '网课', '学习', '课程'], target: 'current', section: 'study' },
  { keywords: ['小说', '投稿', '文章'], target: 'current', section: 'submit' },
  { keywords: ['周边', '甩卖', '二手', '谷子'], target: 'current', section: 'market' },
  { keywords: ['智能体', 'AI', '聊天', '对话'], target: 'current', section: 'ai' }
];

const NAV_ITEMS = [
  { id: 'history', label: '历史向', icon: '📜' },
  { id: 'cp', label: 'CP向', icon: '💕' },
  { id: 'study', label: '学习', icon: '📚' },
  { id: 'submit', label: '投稿', icon: '✍️' },
  { id: 'market', label: '周边甩卖', icon: '🛍️' },
  { id: 'ai', label: '智能体', icon: '🤖' },
  { id: 'login', label: '登录', icon: '👤' }
];

const SIDEBAR_ITEMS = {
  history: [
    { section: '内容筛选', items: [
      { id: 'video', label: '视频', icon: '🎬' },
      { id: 'image', label: '图文', icon: '🖼️' },
      { id: 'novel', label: '小说', icon: '📖' },
      { id: 'model', label: '建模', icon: '🎨' }
    ]},
    { section: '互动板块', items: [
      { id: 'comment', label: '评论区', icon: '💬' },
      { id: 'qa', label: '问答楼', icon: '❓' },
      { id: 'game', label: '联机小游戏', icon: '🎮' }
    ]}
  ],
  cp: [
    { section: '内容筛选', items: [
      { id: 'video', label: '视频', icon: '🎬' },
      { id: 'image', label: '图文', icon: '🖼️' },
      { id: 'short', label: '短片', icon: '▶️' }
    ]},
    { section: '互动', items: [
      { id: 'topic', label: '话题楼', icon: '🔥' },
      { id: 'vote', label: '投票活动', icon: '📊' }
    ]}
  ],
  study: [
    { section: '课程', items: [
      { id: 'history', label: '历史课程', icon: '📜' },
      { id: 'geo', label: '地理', icon: '🌍' },
      { id: 'pol', label: '政治', icon: '🏛️' },
      { id: 'liberal', label: '文科全科', icon: '📚' }
    ]},
    { section: '伴学工具', items: [
      { id: 'room', label: '自习室', icon: '📖' },
      { id: 'quiz', label: '刷题打卡', icon: '✅' },
      { id: 'download', label: '课件下载', icon: '📥' }
    ]}
  ],
  submit: [
    { section: '创作', items: [
      { id: 'editor', label: '文稿编辑器', icon: '📝' },
      { id: 'draft', label: '存稿箱', icon: '📂' },
      { id: 'schedule', label: '定时发布', icon: '⏰' }
    ]},
    { section: '我的', items: [
      { id: 'myworks', label: '我的投稿', icon: '📄' },
      { id: 'fav', label: '我的收藏', icon: '⭐' }
    ]}
  ],
  market: [
    { section: '交易', items: [
      { id: 'sell', label: '我要上架', icon: '📤' },
      { id: 'msg', label: '私信沟通', icon: '✉️' }
    ]},
    { section: '我的', items: [
      { id: 'orders', label: '我的订单', icon: '📋' },
      { id: 'fav', label: '我的收藏', icon: '⭐' }
    ]}
  ],
  ai: [
    { section: '智能体', items: [
      { id: 'create', label: '创建智能体', icon: '➕' },
      { id: 'public', label: '公共模板库', icon: '📚' }
    ]},
    { section: '我的', items: [
      { id: 'myai', label: '我的智能体', icon: '🤖' },
      { id: 'history', label: '对话记录', icon: '📜' }
    ]}
  ],
  login: [
    { section: '账号', items: [
      { id: 'profile', label: '个人主页', icon: '👤' },
      { id: 'settings', label: '账号设置', icon: '⚙️' }
    ]},
    { section: '内容', items: [
      { id: 'fav', label: '我的收藏', icon: '⭐' },
      { id: 'history', label: '浏览记录', icon: '📜' }
    ]}
  ]
};

// 模拟内容数据
const MOCK_DATA = {
  ch: {
    history: [
      {
        id: 1,
        personName: '瓷',
        country: '中国',
        title: '中国历史文化：从早期文明到统一王朝',
        author: '史官小明',
        type: '图文史实',
        views: '12.5万',
        likes: '8.2千',
        cover: '🏺',
        era: '中华文明 / 秦汉以前至秦汉',
        region: '东亚',
        summary: '“瓷”是中国在 CH 圈中的原创拟人称呼，历史向内容以真实中国历史文化为核心。',
        gallery: ['黄河与长江流域孕育早期文明', '秦统一六国后建立中央集权制度', '汉代丝绸之路推动中外交流'],
        article: [
          '中国早期文明在黄河、长江等流域逐渐形成，农业、手工业、礼制与文字共同构成了持续发展的文明基础。',
          '公元前 221 年，秦完成统一，推行郡县制、统一文字、货币和度量衡，为此后中国长期的大一统政治传统奠定制度基础。',
          '汉代在继承秦制的基础上发展国家治理体系，张骞通西域后，丝绸之路成为连接东亚、中亚与更远地区的重要交流通道。'
        ]
      },
      {
        id: 2,
        personName: '法兰西',
        country: '法国',
        title: '法国历史文化：从法兰克王国到法兰西民族国家',
        author: '欧陆史话',
        type: '图文史实',
        views: '9.8万',
        likes: '6.5千',
        cover: '⚜️',
        era: '中世纪 / 近代法国',
        region: '西欧',
        summary: '“法兰西”是法国的拟人称呼，内容聚焦法国历史、文化与国家形成过程。',
        gallery: ['法兰克王国是法国历史的重要源头', '巴黎逐渐成为政治与文化中心', '法国大革命深刻影响近代欧洲'],
        article: [
          '法国的历史可追溯至西罗马帝国衰落后的法兰克王国。查理曼帝国分裂后，西法兰克逐渐发展出后来的法国王权结构。',
          '中世纪后期，法国王权不断加强，巴黎成为政治与文化中心，法语、宫廷文化与地方传统共同塑造了法兰西身份。',
          '1789 年法国大革命爆发，旧制度被冲击，公民、民族国家、共和等观念在欧洲乃至世界范围内产生深远影响。'
        ]
      },
      {
        id: 3,
        personName: '不列颠',
        country: '英国',
        title: '英国历史文化：议会传统与海洋扩张',
        author: '世界史笔记',
        type: '图文史实',
        views: '7.6万',
        likes: '4.9千',
        cover: '⛵',
        era: '中世纪 / 近代英国',
        region: '西欧',
        summary: '“不列颠”对应英国拟人，历史向内容呈现真实制度演变与海洋文化。',
        gallery: ['1215 年《大宪章》限制王权', '议会制度逐渐发展', '近代英国成为海上强国'],
        article: [
          '1215 年《大宪章》是英国政治史上的重要文件，它限制王权并影响了后来的法治和议会传统。',
          '中世纪晚期到近代早期，英国议会制度不断发展，王权与议会之间的关系成为英国政治史的核心线索之一。',
          '近代英国依靠海军、贸易网络和工业革命逐步扩大影响，海洋文化与商业制度深刻塑造了现代英国。'
        ]
      },
      {
        id: 4,
        personName: '罗马',
        country: '意大利 / 古罗马文化源流',
        title: '古罗马历史文化：共和、帝国与法律遗产',
        author: '古典世界',
        type: '图文史实',
        views: '8.4万',
        likes: '5.7千',
        cover: '🏛️',
        era: '古典时代',
        region: '地中海',
        summary: '“罗马”用于承载古罗马历史文化内容，强调史实科普，不混同现实国家政治。',
        gallery: ['罗马共和国形成独特政治结构', '罗马帝国扩展至地中海世界', '罗马法影响后世欧洲法律传统'],
        article: [
          '古罗马从城邦发展为共和国，再到帝国，经历了复杂的制度变迁。元老院、执政官与公民大会等机制构成共和国时期的重要政治结构。',
          '帝国时期，罗马的道路、城市、军团与行政体系将地中海世界联系在一起，拉丁语和罗马文化广泛传播。',
          '罗马法对欧洲大陆法系产生长期影响，法律、城市治理和公共工程是古罗马遗产中最具代表性的部分。'
        ]
      },
      {
        id: 5,
        personName: '埃及',
        country: '埃及',
        title: '埃及历史文化：尼罗河与古代文明',
        author: '文明考古',
        type: '图文史实',
        views: '6.9万',
        likes: '4.4千',
        cover: '🔺',
        era: '古埃及时期',
        region: '北非',
        summary: '埃及拟人内容以尼罗河文明、金字塔、象形文字等真实历史文化为基础。',
        gallery: ['尼罗河定期泛滥滋养农业', '金字塔体现古埃及工程与宗教观念', '象形文字记录行政与信仰'],
        article: [
          '古埃及文明依托尼罗河发展，河流定期泛滥带来的肥沃土地支持了农业生产和早期国家组织。',
          '金字塔、神庙和木乃伊反映了古埃及对王权、来世和宗教秩序的理解，也是其工程技术的重要体现。',
          '象形文字用于纪念碑、宗教文本和行政记录，帮助后人理解古埃及社会结构与文化观念。'
        ]
      },
      {
        id: 6,
        personName: '希腊',
        country: '希腊',
        title: '希腊历史文化：城邦、哲学与艺术',
        author: '爱琴海笔记',
        type: '图文史实',
        views: '5.8万',
        likes: '3.9千',
        cover: '🏺',
        era: '古希腊时期',
        region: '东地中海',
        summary: '希腊拟人内容围绕城邦政治、哲学传统、戏剧和艺术展开。',
        gallery: ['雅典城邦发展出直接民主实践', '哲学传统影响西方思想史', '神庙与雕塑体现古典审美'],
        article: [
          '古希腊并非统一帝国，而是由许多城邦组成。雅典、斯巴达等城邦在政治制度、社会结构和军事传统上各有特点。',
          '苏格拉底、柏拉图、亚里士多德等思想家对哲学、伦理学、政治学和自然研究产生深远影响。',
          '古希腊戏剧、雕塑和建筑追求比例、秩序与理性，其文化遗产通过罗马和后世欧洲不断传播。'
        ]
      }
    ],
    cp: [
      { id: 1, title: '【剧情向】当秦遇上唐', author: '编剧阿花', type: 'video', views: '25.6万', likes: '18.2千', cover: '🎭' },
      { id: 2, title: '模拟联合国会议室：冷战篇', author: 'MUN爱好者', type: 'video', views: '15.3万', likes: '11.7千', cover: '🏛️' },
      { id: 3, title: '快问快答：汉唐CP默契考验', author: '娱乐小编', type: 'short', views: '32.1万', likes: '24.5千', cover: '❓' },
      { id: 4, title: '日常互动：清朝皇帝的早晨', author: '历史趣谈', type: 'video', views: '18.9万', likes: '14.3千', cover: '☀️' }
    ],
    study: [
      { id: 1, title: '中国古代史系统课程', author: '史学院教授', type: 'course', views: '5.2万', likes: '4.1千', cover: '📚' },
      { id: 2, title: '世界史重点知识串讲', author: '考研名师', type: 'course', views: '3.8万', likes: '2.9千', cover: '🌍' },
      { id: 3, title: '历史真题解析2024版', author: '真题组', type: 'doc', views: '8.5万', likes: '6.2千', cover: '📝' },
      { id: 4, title: '文科全科知识点思维导图', author: '思维导图达人', type: 'image', views: '12.1万', likes: '9.8千', cover: '🧠' }
    ],
    submit: [
      { id: 1, title: '《山河志》长篇连载·第一章', author: '墨客', type: 'novel', views: '2.3万', likes: '1.8千', cover: '📖' },
      { id: 2, title: '短篇：那年长安下雪了', author: '雪花', type: 'short', views: '5.6万', likes: '4.2千', cover: '❄️' },
      { id: 3, title: '剧本：大明宫词', author: '剧作家', type: 'script', views: '1.8万', likes: '1.3千', cover: '🎭' }
    ],
    market: [
      { id: 1, title: '原创国拟立牌·秦汉唐系列', author: '画师小A', price: '¥45', cover: '🖼️' },
      { id: 2, title: '手绘古风画册', author: '水墨丹青', price: '¥128', cover: '🎨' },
      { id: 3, title: '朝代拟人徽章套组', author: '徽章工坊', price: '¥68', cover: '🏅' },
      { id: 4, title: '手工粘土人偶·Q版', author: '手作娘', price: '¥89', cover: '🧸' }
    ],
    ai: [
      { id: 1, name: '秦·始皇', desc: '威严霸气，一统天下的雄心壮志', avatar: '👑' },
      { id: 2, name: '唐·太宗', desc: '开明睿智，贞观之治的缔造者', avatar: '🐉' },
      { id: 3, name: '宋·徽宗', desc: '文艺皇帝，书画双绝的才子', avatar: '🖌️' },
      { id: 4, name: '明·永乐', desc: '雄才大略，七下西洋的决策者', avatar: '⚓' }
    ]
  },
  prov: {
    history: [
      { id: 1, title: '各省名称由来大揭秘', author: '地名研究员', type: 'video', views: '18.2万', likes: '12.5千', cover: '🏛️' },
      { id: 2, title: '中国各省版图变迁史', author: '地图控', type: 'image', views: '22.5万', likes: '16.8千', cover: '🗺️' },
      { id: 3, title: '江南水乡文化源流', author: '江南客', type: 'novel', views: '6.7万', likes: '4.3千', cover: '🌊' },
      { id: 4, title: '西北丝路重镇今昔', author: '丝路行者', type: 'video', views: '5.4万', likes: '3.2千', cover: '🏜️' },
      { id: 5, title: '东北工业基地发展史', author: '工业迷', type: 'image', views: '4.1万', likes: '2.8千', cover: '🏭' },
      { id: 6, title: '西南少数民族风情录', author: '民俗学者', type: 'video', views: '7.9万', likes: '5.6千', cover: '🎋' }
    ],
    cp: [
      { id: 1, title: '【剧情向】江浙沪日常', author: '江南编剧', type: 'video', views: '28.3万', likes: '21.5千', cover: '🎭' },
      { id: 2, title: '模拟省际会议：高铁规划篇', author: '规划迷', type: 'video', views: '12.7万', likes: '9.3千', cover: '🚄' },
      { id: 3, title: '省拟快问快答：南北差异', author: '娱乐小编', type: 'short', views: '35.6万', likes: '28.2千', cover: '❓' },
      { id: 4, title: '日常：各省早餐大比拼', author: '美食家', type: 'video', views: '42.1万', likes: '35.7千', cover: '🍜' }
    ],
    study: [
      { id: 1, title: '中国地理精讲课程', author: '地理名师', type: 'course', views: '6.8万', likes: '5.4千', cover: '🌍' },
      { id: 2, title: '各省特色产业经济分析', author: '经济讲师', type: 'course', views: '3.2万', likes: '2.5千', cover: '📊' },
      { id: 3, title: '地理真题分类汇编', author: '真题组', type: 'doc', views: '7.5万', likes: '5.8千', cover: '📝' },
      { id: 4, title: '各省文化特色思维导图', author: '思维导图达人', type: 'image', views: '15.3万', likes: '12.1千', cover: '🧠' }
    ],
    submit: [
      { id: 1, title: '《各省风云录》连载', author: '省志编者', type: 'novel', views: '3.5万', likes: '2.7千', cover: '📖' },
      { id: 2, title: '短篇：粤菜与川菜的对话', author: '美食作家', type: 'short', views: '8.9万', likes: '7.2千', cover: '🌶️' },
      { id: 3, title: '剧本：湾区故事', author: '剧作家', type: 'script', views: '2.1万', likes: '1.6千', cover: '🎭' }
    ],
    market: [
      { id: 1, title: '原创省拟钥匙扣套装', author: '画师小B', price: '¥38', cover: '🔑' },
      { id: 2, title: '各省美食贴纸包', author: '贴纸工坊', price: '¥15', cover: '🍜' },
      { id: 3, title: '手绘城市风景明信片', author: '风景画师', price: '¥25', cover: '🖼️' },
      { id: 4, title: '省份特色手作香囊', author: '手作娘', price: '¥55', cover: '🎋' }
    ],
    ai: [
      { id: 1, name: '粤·广东', desc: '开放包容，美食天下的实干家', avatar: '🥟' },
      { id: 2, name: '川·四川', desc: '热情豪爽，麻辣人生的享受者', avatar: '🌶️' },
      { id: 3, name: '苏·江苏', desc: '温婉细腻，园林水乡的守护者', avatar: '🌸' },
      { id: 4, name: '陕·陕西', desc: '厚重沉稳，千年古都的传承者', avatar: '🏯' }
    ]
  }
};

// ==================== 状态管理 ====================
let currentZone = 'home'; // home | ch | prov
let currentSection = 'history';
let currentUser = null;

// ==================== DOM 元素 ====================
function $(selector) { return document.querySelector(selector); }
function $$(selector) { return document.querySelectorAll(selector); }

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', () => {
  initSearch();
  initZoneSwitch();
  initNavigation();
  initLoginModal();
  renderHome();
});

// ==================== 搜索功能 ====================
function initSearch() {
  const searchInput = $('#globalSearch');
  const searchBtn = $('#globalSearchBtn');
  const hints = $('#searchHints');
  
  if (!searchInput) return;
  
  searchInput.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    if (val.length > 0) {
      hints.classList.add('active');
      updateSearchHints(val);
    } else {
      hints.classList.remove('active');
    }
  });
  
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      handleSearch(searchInput.value.trim());
      hints.classList.remove('active');
    }
  });
  
  searchBtn.addEventListener('click', () => {
    handleSearch(searchInput.value.trim());
    hints.classList.remove('active');
  });
  
  // 点击外部关闭提示
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-box')) {
      hints.classList.remove('active');
    }
  });
}

function updateSearchHints(val) {
  const hints = $('#searchHints');
  const matches = SEARCH_RULES.filter(r => 
    r.keywords.some(k => k.includes(val) || val.includes(k))
  );
  
  if (matches.length === 0) {
    hints.innerHTML = `<div class="hint-item">搜索 "${val}" 相关内容...</div>`;
    return;
  }
  
  hints.innerHTML = matches.map(m => {
    const targetText = m.target === 'ch' ? '国拟专区' : m.target === 'prov' ? '省拟专区' : '当前专区';
    const sectionNames = { history: '历史向', cp: 'CP向', study: '学习', submit: '投稿', market: '周边', ai: '智能体' };
    return `<div class="hint-item" onclick="handleSearch('${m.keywords[0]}')">
      <span class="hint-key">${m.keywords[0]}</span> → ${targetText} ${sectionNames[m.section] || ''}
    </div>`;
  }).join('');
}

function handleSearch(query) {
  if (!query) return;
  
  const rule = SEARCH_RULES.find(r => 
    r.keywords.some(k => query.includes(k) || k.includes(query))
  );
  
  if (rule) {
    const targetZone = rule.target === 'current' ? currentZone : rule.target;
    if (targetZone === 'home') {
      switchZone(rule.target === 'ch' ? 'ch' : 'prov');
    } else {
      switchZone(targetZone);
    }
    setTimeout(() => switchSection(rule.section), 100);
  } else {
    // 默认在当前专区搜索
    if (currentZone === 'home') {
      switchZone('ch');
    }
    alert(`搜索 "${query}" 的结果将在此展示（演示模式）`);
  }
}

// ==================== 专区切换 ====================
function initZoneSwitch() {
  const chBtn = $('#zoneCh');
  const provBtn = $('#zoneProv');
  
  chBtn.addEventListener('click', () => switchZone('ch'));
  provBtn.addEventListener('click', () => switchZone('prov'));
  
  // Logo 点击回首页
  $('.logo').addEventListener('click', () => switchZone('home'));
}

function switchZone(zone) {
  currentZone = zone;
  
  // 更新按钮状态
  $('#zoneCh').classList.toggle('active', zone === 'ch');
  $('#zoneProv').classList.toggle('active', zone === 'prov');
  
  // 隐藏所有页面
  $$('.zone-page').forEach(p => p.classList.remove('active'));
  $('#homePage').style.display = 'none';
  
  if (zone === 'home') {
    $('#homePage').style.display = 'block';
    renderHome();
  } else {
    $(`#${zone}Page`).classList.add('active');
    switchSection('history');
  }
  
  // 更新搜索框样式
  const searchInput = $('#globalSearch');
  if (zone === 'prov') {
    searchInput.style.borderColor = 'var(--prov-primary)';
  } else {
    searchInput.style.borderColor = 'var(--border-color)';
  }
}

// ==================== 导航切换 ====================
function initNavigation() {
  ['ch', 'prov'].forEach(zone => {
    const nav = $(`#${zone}TopNav`);
    NAV_ITEMS.forEach(item => {
      const el = document.createElement('div');
      el.className = 'nav-item';
      el.dataset.section = item.id;
      el.innerHTML = `${item.icon} ${item.label}`;
      el.addEventListener('click', () => switchSection(item.id));
      nav.appendChild(el);
    });
  });
}

function switchSection(section) {
  currentSection = section;
  
  // 更新导航状态
  const activePage = $(`#${currentZone}Page`);
  activePage.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.section === section);
  });
  
  // 渲染侧边栏
  renderSidebar(section);
  
  // 渲染内容
  renderContent(section);
}

function renderSidebar(section) {
  const sidebar = $(`#${currentZone}Sidebar`);
  const items = SIDEBAR_ITEMS[section] || [];
  
  sidebar.innerHTML = items.map(group => `
    <div class="sidebar-section">
      <div class="sidebar-title">${group.section}</div>
      ${group.items.map(item => `
        <div class="sidebar-item" data-id="${item.id}">
          <span class="icon">${item.icon}</span>
          <span>${item.label}</span>
        </div>
      `).join('')}
    </div>
  `).join('');
  
  // 绑定点击事件
  sidebar.querySelectorAll('.sidebar-item').forEach(item => {
    item.addEventListener('click', () => {
      sidebar.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      // 演示：刷新内容
      renderContent(currentSection, item.dataset.id);
    });
  });
  
  // 默认选中第一个
  const first = sidebar.querySelector('.sidebar-item');
  if (first) first.classList.add('active');
}

// ==================== 内容渲染 ====================
function renderContent(section, subFilter = null) {
  const container = $(`#${currentZone}Content`);
  const data = MOCK_DATA[currentZone]?.[section] || [];
  
  const sectionNames = {
    history: '历史向',
    cp: 'CP向',
    study: '学习',
    submit: '投稿',
    market: '周边甩卖',
    ai: '智能体',
    login: '个人中心'
  };
  
  const sectionDescs = {
    history: currentZone === 'ch'
      ? '国家拟人化历史文化专区：每个格子对应一个国家人物，点击后以图文方式呈现真实历史'
      : '史实科普向视频图文专区，精选历史科普内容',
    cp: '同人剧情、互动娱乐视频专区',
    study: '中外历史、文科全科网课、知识点讲解',
    submit: '短篇同人、长篇连载、剧本投稿专区',
    market: '二手同人周边交易板块，纯用户个人闲置流转',
    ai: '用户自主创建专属拟人智能体',
    login: '个人主页与账号管理'
  };
  
  if (section === 'login') {
    renderLoginSection(container);
    return;
  }
  
  if (section === 'ai') {
    renderAIChat(container, data);
    return;
  }
  
  if (section === 'submit') {
    renderEditor(container);
    return;
  }
  
  let html = `
    <div class="section-header">
      <h2>${sectionNames[section]}</h2>
      <p>${sectionDescs[section]}</p>
    </div>
  `;
  
  if (section === 'history' && currentZone === 'ch') {
    html += renderHistoryGrid(data);
  } else if (section === 'market') {
    html += renderProductGrid(data);
  } else {
    html += renderCardGrid(data);
  }
  
  html += `
    <div class="disclaimer">
      <strong>免责声明：</strong>本平台所有内容均为用户原创二创，仅用于同人娱乐交流，无任何商业授权。禁止搬运官方/他人未授权素材，投稿作者保留原创版权。
    </div>
  `;
  
  container.innerHTML = html;
}

function renderHistoryGrid(items) {
  if (!items || items.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <h3>暂无历史内容</h3>
        <p>后续可继续补充更多国家人物与真实历史文化图文。</p>
      </div>
    `;
  }

  return `
    <div class="history-grid">
      ${items.map(item => `
        <div class="history-card" onclick="openHistoryDetail('ch', ${item.id})">
          <div class="history-cover">
            <span>${item.cover}</span>
          </div>
          <div class="history-body">
            <div class="history-person">${item.personName}</div>
            <div class="history-country">${item.country}</div>
            <h3>${item.title}</h3>
            <p>${item.summary}</p>
            <div class="history-tags">
              <span>${item.region}</span>
              <span>${item.era}</span>
            </div>
            <div class="card-meta">
              <div class="card-author">
                <div class="author-avatar">史</div>
                <span>${item.author}</span>
              </div>
              <div class="card-stats">
                <span>👁 ${item.views}</span>
                <span>❤ ${item.likes}</span>
              </div>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function openHistoryDetail(zone, id) {
  const item = MOCK_DATA[zone]?.history?.find(entry => entry.id === id);
  if (!item) return;

  const oldOverlay = $('#historyDetailOverlay');
  if (oldOverlay) oldOverlay.remove();

  const overlay = document.createElement('div');
  overlay.className = 'history-detail-overlay active';
  overlay.id = 'historyDetailOverlay';
  overlay.innerHTML = `
    <article class="history-detail">
      <button class="history-close" onclick="closeHistoryDetail()">✕</button>
      <div class="history-detail-hero">
        <div class="history-detail-symbol">${item.cover}</div>
        <div>
          <div class="history-person">${item.personName}</div>
          <h2>${item.title}</h2>
          <p>${item.country} · ${item.region} · ${item.era}</p>
        </div>
      </div>

      <section class="history-gallery">
        ${item.gallery.map(text => `
          <figure>
            <div>${item.cover}</div>
            <figcaption>${text}</figcaption>
          </figure>
        `).join('')}
      </section>

      <section class="history-article">
        ${item.article.map(paragraph => `<p>${paragraph}</p>`).join('')}
      </section>

      <div class="disclaimer">
        <strong>历史向说明：</strong>本页用于真实历史文化科普；人物名为 CH / Country Humans 圈内原创拟人称呼，不代表官方形象，也不改写史实。
      </div>
    </article>
  `;

  document.body.appendChild(overlay);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeHistoryDetail();
  });
}

function closeHistoryDetail() {
  const overlay = $('#historyDetailOverlay');
  if (overlay) overlay.remove();
}

function renderCardGrid(items) {
  if (!items || items.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <h3>暂无内容</h3>
        <p>成为第一个投稿的人吧！</p>
      </div>
    `;
  }
  
  return `
    <div class="card-grid">
      ${items.map(item => `
        <div class="content-card">
          <div class="card-cover">${item.cover}</div>
          <div class="card-body">
            <div class="card-title">${item.title}</div>
            <div class="card-meta">
              <div class="card-author">
                <div class="author-avatar">👤</div>
                <span>${item.author}</span>
              </div>
              <div class="card-stats">
                <span>▶ ${item.views}</span>
                <span>❤ ${item.likes}</span>
              </div>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderProductGrid(items) {
  if (!items || items.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-icon">🛒</div>
        <h3>暂无商品</h3>
        <p>去上架你的闲置周边吧！</p>
      </div>
    `;
  }
  
  return `
    <div class="card-grid">
      ${items.map(item => `
        <div class="product-card">
          <div class="product-cover">${item.cover}</div>
          <div class="product-body">
            <div class="product-title">${item.title}</div>
            <div class="product-price">${item.price}</div>
            <div class="product-seller">
              <div class="author-avatar">👤</div>
              <span>${item.author}</span>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderAIChat(container, agents) {
  const agent = agents[0];
  container.innerHTML = `
    <div class="section-header">
      <h2>智能体</h2>
      <p>与原创拟人角色实时对话互动</p>
    </div>
    <div class="chat-container">
      <div class="chat-header">
        <div class="chat-avatar">${agent.avatar}</div>
        <div class="chat-info">
          <h4>${agent.name}</h4>
          <p>${agent.desc}</p>
        </div>
      </div>
      <div class="chat-messages" id="chatMessages">
        <div class="chat-bubble bot">你好，我是${agent.name}。有什么想聊的吗？</div>
      </div>
      <div class="chat-input">
        <input type="text" id="chatInput" placeholder="输入消息..." />
        <button onclick="sendMessage()">➤</button>
      </div>
    </div>
  `;
  
  // 绑定回车发送
  setTimeout(() => {
    const input = $('#chatInput');
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendMessage();
      });
    }
  }, 0);
}

function sendMessage() {
  const input = $('#chatInput');
  const messages = $('#chatMessages');
  const text = input.value.trim();
  
  if (!text) return;
  
  // 用户消息
  const userBubble = document.createElement('div');
  userBubble.className = 'chat-bubble user';
  userBubble.textContent = text;
  messages.appendChild(userBubble);
  
  input.value = '';
  messages.scrollTop = messages.scrollHeight;
  
  // 模拟回复
  setTimeout(() => {
    const botBubble = document.createElement('div');
    botBubble.className = 'chat-bubble bot';
    const replies = [
      '很有趣的话题，请继续说。',
      '从历史角度来看，这确实值得探讨。',
      '我也是这么认为的！',
      '这个话题让我想起了很多往事...',
      '你能多分享一些细节吗？'
    ];
    botBubble.textContent = replies[Math.floor(Math.random() * replies.length)];
    messages.appendChild(botBubble);
    messages.scrollTop = messages.scrollHeight;
  }, 800);
}

function renderEditor(container) {
  container.innerHTML = `
    <div class="section-header">
      <h2>投稿编辑器</h2>
      <p>创作你的原创同人作品</p>
    </div>
    <div class="editor-container">
      <div class="editor-toolbar">
        <button>粗体</button>
        <button>斜体</button>
        <button>标题</button>
        <button>引用</button>
        <button>插入图片</button>
        <button>分割线</button>
      </div>
      <div class="editor-body">
        <textarea placeholder="在此开始你的创作..."></textarea>
      </div>
    </div>
    <div style="margin-top: 16px; display: flex; gap: 12px; justify-content: flex-end;">
      <button class="btn btn-secondary">保存草稿</button>
      <button class="btn btn-primary">发布投稿</button>
    </div>
  `;
}

function renderLoginSection(container) {
  if (currentUser) {
    container.innerHTML = `
      <div class="section-header">
        <h2>个人中心</h2>
        <p>管理你的账号与内容</p>
      </div>
      <div class="card-grid">
        <div class="content-card">
          <div class="card-body" style="text-align: center; padding: 32px;">
            <div style="font-size: 48px; margin-bottom: 16px;">👤</div>
            <h3>${currentUser.name}</h3>
            <p style="color: var(--text-secondary); margin-top: 8px;">${currentUser.phone}</p>
          </div>
        </div>
        <div class="content-card">
          <div class="card-body" style="padding: 24px;">
            <h3>我的数据</h3>
            <div style="margin-top: 16px; display: flex; justify-content: space-around;">
              <div style="text-align: center;">
                <div style="font-size: 24px; font-weight: 700;">12</div>
                <div style="font-size: 13px; color: var(--text-muted);">投稿</div>
              </div>
              <div style="text-align: center;">
                <div style="font-size: 24px; font-weight: 700;">86</div>
                <div style="font-size: 13px; color: var(--text-muted);">收藏</div>
              </div>
              <div style="text-align: center;">
                <div style="font-size: 24px; font-weight: 700;">5</div>
                <div style="font-size: 13px; color: var(--text-muted);">智能体</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div class="section-header">
        <h2>登录 / 注册</h2>
        <p>登录后可使用投稿、智能体、交易等功能</p>
      </div>
      <div style="max-width: 400px; margin: 40px auto; text-align: center;">
        <div style="font-size: 64px; margin-bottom: 24px;">🔐</div>
        <h3 style="margin-bottom: 16px;">请先登录</h3>
        <p style="color: var(--text-secondary); margin-bottom: 24px;">游客可浏览内容，投稿/智能体/交易需登录</p>
        <button class="btn btn-primary" onclick="openLoginModal()" style="width: 100%;">立即登录</button>
      </div>
    `;
  }
}

// ==================== 登录弹窗 ====================
function initLoginModal() {
  const overlay = $('#loginModal');
  const closeBtn = $('#closeModal');
  const switchBtn = $('#switchAuth');
  
  closeBtn.addEventListener('click', closeLoginModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeLoginModal();
  });
  
  switchBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const title = $('#authTitle');
    const btn = $('#authSubmit');
    const footer = $('#authFooter');
    
    if (title.textContent === '登录') {
      title.textContent = '注册';
      btn.textContent = '注册';
      footer.innerHTML = '已有账号？<a href="#" id="switchAuth">去登录</a>';
    } else {
      title.textContent = '登录';
      btn.textContent = '登录';
      footer.innerHTML = '还没有账号？<a href="#" id="switchAuth">去注册</a>';
    }
    // 重新绑定
    $('#switchAuth').addEventListener('click', arguments.callee);
  });
  
  $('#authSubmit').addEventListener('click', (e) => {
    e.preventDefault();
    const phone = $('#authPhone').value;
    const password = $('#authPassword').value;
    
    if (!phone || !password) {
      alert('请填写完整信息');
      return;
    }
    
    currentUser = { name: '用户' + phone.slice(-4), phone };
    closeLoginModal();
    updateUserUI();
    
    if (currentSection === 'login') {
      renderContent('login');
    }
  });
}

function openLoginModal() {
  $('#loginModal').classList.add('active');
}

function closeLoginModal() {
  $('#loginModal').classList.remove('active');
}

function updateUserUI() {
  const userActions = $('.user-actions');
  if (currentUser) {
    userActions.innerHTML = `
      <button class="action-btn" onclick="openLoginModal()">消息 <span style="color: #e74c3c;">(3)</span></button>
      <div class="user-avatar" onclick="switchSection('login')">${currentUser.name[0]}</div>
    `;
  }
}

// ==================== 首页渲染 ====================
function renderHome() {
  // 首页搜索
  const heroSearch = $('#heroSearch');
  const heroBtn = $('#heroSearchBtn');
  
  if (heroSearch) {
    heroSearch.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleSearch(heroSearch.value.trim());
    });
    heroBtn.addEventListener('click', () => handleSearch(heroSearch.value.trim()));
  }
  
  // 专区卡片点击
  const chCard = $('#chCard');
  const provCard = $('#provCard');
  
  if (chCard) chCard.addEventListener('click', () => switchZone('ch'));
  if (provCard) provCard.addEventListener('click', () => switchZone('prov'));
}

// ==================== 全局方法暴露 ====================
window.sendMessage = sendMessage;
window.openLoginModal = openLoginModal;
window.handleSearch = handleSearch;
window.openHistoryDetail = openHistoryDetail;
window.closeHistoryDetail = closeHistoryDetail;
