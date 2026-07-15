const categories = [
  {
    name: '游戏',
    icon: '🎮',
    subs: [
      { name: '全部', subs: ['全部'] },
      { name: '独立游戏', subs: ['全部', '冒险', '恋爱模拟', '像素风', '解谜', '剧情', '肉鸽Like', '平台跳跃', '恐怖', '沙盒', '叙事'] },
      { name: '单机大作', subs: ['全部', '动作', '角色扮演', '开放世界', '射击', '策略', '格斗', '赛车', '生存', '潜入'] },
      { name: 'H5', subs: ['全部', '休闲益智', '跑酷', '塔防', '挂机放置', '体育竞技', '音乐节奏', 'io对战'] },
      { name: '网络游戏', subs: ['全部', 'MMORPG', '竞技', 'FPS', '沙盒', 'MOBA'] }
    ]
  },
  {
    name: '插画',
    icon: '🎨',
    subs: [
      { name: '全部', subs: ['全部'] },
      { name: '二次元', subs: ['全部', '日系', '赛璐璐', '动漫风', '厚涂', '萌系', '机甲', '萝莉', '兽耳'] },
      { name: '国风', subs: ['全部', '水墨', '工笔', '写意', '古风', '敦煌', '仙侠', '宫廷', '青绿'] },
      { name: '写实', subs: ['全部', '写实', 'CG原画', '场景', '人像', '概念设计'] },
      { name: 'Q版', subs: ['全部', 'Q版', '卡通', '可爱风', '简笔', '头像'] }
    ]
  },
  {
    name: '游戏素材',
    icon: '📦',
    subs: [
      { name: '全部', subs: ['全部'] },
      { name: '3D模型', subs: ['全部', '角色', '场景', '道具', '建筑'] },
      { name: '音效', subs: ['全部', 'BGM', '音效素材', '人声'] },
      { name: '特效', subs: ['全部', '粒子', 'Shader', '动画'] },
      { name: '皮肤', subs: ['全部', '角色皮肤', '武器皮肤', 'UI皮肤'] },
      { name: '字体', subs: ['全部', '中文字体', '英文字体', '艺术字体'] }
    ]
  },
];

let materialTab = 'store'; // 'store' | 'create' | 'trade'
let materialType = '2d'; // '2d' | '3d' | 'audio'
let materialSubs = []; // 当前选中的细分类
let materialTradeView = 'menu'; // 'menu' | 'publish' | 'orders'
let tradeFilter = 'all'; // 'all' | 'mine' | 'taken' | 'open'

// 素材交易·请求大厅数据
const MATERIAL_REQUESTS_KEY = 'materialRequests';
const _defaultMaterialRequests = [
  { id: 1, title: '需要一套赛博朋克风UI素材', type: '2D素材', budget: '¥200', desc: '需要按钮/面板/图标，深色霓虹风格，分辨率支持2K', author: '夜行旅人', avatar: '🦊', time: '3小时前', status: 'open', offers: 2, offerList: [
    { user: '墨白', avatar: '🖌️', amount: '¥180', note: '5年UI设计经验，3天可交付', mine: false },
    { user: '像素魔术师', avatar: '🧙', amount: '¥200', note: '可参考Steam赛博朋克游戏UI风格', mine: false },
  ]},
  { id: 2, title: '求购低模奇幻角色模型包', type: '3D素材', budget: '¥500', desc: '10个角色，含动画，需fbx格式，可商用', author: '解谜狂魔', avatar: '🧩', time: '6小时前', status: 'open', offers: 3, offerList: [
    { user: 'IronForge', avatar: '🤖', amount: '¥480', note: '已有现成角色库，可直接交付', mine: false },
    { user: '开发者阿强', avatar: '👨‍💻', amount: '¥500', note: '可定制风格，含5种动画', mine: false },
    { user: '星河漫游者', avatar: '🌌', amount: '¥520', note: '7天可交付，支持fbx+gltf双格式', mine: false },
  ]},
  { id: 3, title: '定制一首战斗BGM', type: '音效', budget: '¥300', desc: '管弦史诗风，时长2分钟，含循环版本', author: '棋场老司机', avatar: '♟️', time: '1天前', status: 'open', offers: 1, offerList: [
    { user: '音乐匠人', avatar: '🎵', amount: '¥280', note: '专业BGM创作，已交付32首作品', mine: false },
  ]},
  { id: 4, title: '求购火焰粒子特效', type: '2D素材', budget: '¥80', desc: '高品质火焰，含烟雾与余烬，支持Unity', author: '灵宠训练师', avatar: '🐾', time: '2天前', status: 'taken', offers: 2, offerList: [
    { user: '战斗大师', avatar: '⚔️', amount: '¥80', note: '已有成品，可立即交付', mine: false },
    { user: '墨白', avatar: '🖌️', amount: '¥90', note: '可调整火焰颜色与大小', mine: false },
  ]},
  { id: 5, title: '需要中世纪建筑模型集', type: '3D素材', budget: '¥450', desc: '含房屋/教堂/塔楼，风格化低模', author: '星绘', avatar: '🌌', time: '3天前', status: 'open', offers: 2, offerList: [
    { user: 'IronForge', avatar: '🤖', amount: '¥430', note: '已有中世纪风格包，可立即交付', mine: false },
    { user: '开发者阿强', avatar: '👨‍💻', amount: '¥460', note: '可加做教堂内饰，5天交付', mine: false },
  ]},
];
function loadMaterialRequests() {
  try {
    const raw = localStorage.getItem(MATERIAL_REQUESTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return JSON.parse(JSON.stringify(_defaultMaterialRequests));
}
function saveMaterialRequests() {
  try { localStorage.setItem(MATERIAL_REQUESTS_KEY, JSON.stringify(materialRequests)); } catch (e) {}
}
let materialRequests = loadMaterialRequests();
let activeNav = 'store';
let activeMain = 0;
let activeSub = 0;
let activeSubSub = 0;
let activePrice = null; // 'paid' | 'free' | 'discount' | null
let libraryFilter = '全部'; // 库页面筛选：'全部' | '已安装' | 自定义分类名

// 库自定义分类（玩家自建收藏夹），持久化到 localStorage
// 结构: [{ name: '收藏夹1', gameIds: [1,2,3] }, ...]
let libraryCategories = (function() {
  try {
    const raw = localStorage.getItem('libraryCategories');
    return raw ? JSON.parse(raw) : [];
  } catch (e) { return []; }
})();

function saveLibraryCategories() {
  try { localStorage.setItem('libraryCategories', JSON.stringify(libraryCategories)); } catch (e) {}
}

// 判断一个游戏是否在某个自定义分类里
function gameInCategory(gameId, catName) {
  if (catName === '全部') return true;
  if (catName === '已安装') return true; // 库里所有游戏默认都属于"已安装"
  const cat = libraryCategories.find(c => c.name === catName);
  return cat ? cat.gameIds.includes(Number(gameId)) : false;
}

// 获取某游戏所属的所有自定义分类名
function getGameCategoryNames(gameId) {
  return libraryCategories.filter(c => c.gameIds.includes(Number(gameId))).map(c => c.name);
}

// 切换某游戏在某个分类里的归属
function toggleGameCategory(gameId, catName) {
  const id = Number(gameId);
  let cat = libraryCategories.find(c => c.name === catName);
  if (!cat) {
    cat = { name: catName, gameIds: [] };
    libraryCategories.push(cat);
  }
  const idx = cat.gameIds.indexOf(id);
  if (idx >= 0) cat.gameIds.splice(idx, 1);
  else cat.gameIds.push(id);
  saveLibraryCategories();
}

function createCategory(name) {
  if (!name || libraryCategories.some(c => c.name === name)) return false;
  libraryCategories.push({ name, gameIds: [] });
  saveLibraryCategories();
  return true;
}

function deleteCategory(name) {
  if (name === '全部' || name === '已安装') return;
  libraryCategories = libraryCategories.filter(c => c.name !== name);
  if (libraryFilter === name) libraryFilter = '全部';
  saveLibraryCategories();
}

// 刷新库 banner 顶部的筛选按钮组（包含自定义分类 + 新建按钮）
function renderLibraryBanner() {
  const pageHeader = document.getElementById('pageHeader');
  if (!pageHeader || activeNav !== 'library') return;

  const filterOptions = ['全部', '已安装', ...libraryCategories.map(c => c.name)];
  pageHeader.innerHTML = `
    <div class="library-banner">
      <div class="library-banner-left">
        <div class="library-banner-icon">📚</div>
        <div class="library-banner-text">
          <div class="library-banner-title">我的游戏库</div>
          <div class="library-banner-sub">你已拥有的全部游戏</div>
        </div>
      </div>
      <div class="library-filter">
        <span class="library-filter-label">筛选</span>
        <div class="library-filter-list">
          ${filterOptions.map(name => {
            const isCustom = name !== '全部' && name !== '已安装';
            return `
              <button class="library-filter-btn ${name === libraryFilter ? 'active' : ''}" data-filter="${name}">
                <span>${name}</span>
                ${isCustom ? `<span class="lib-del" data-del="${name}" title="删除分类">×</span>` : ''}
              </button>
            `;
          }).join('')}
          <button class="library-filter-btn add-new" id="libNewCatBtn" title="新建分类">＋</button>
        </div>
      </div>
    </div>
  `;

  pageHeader.querySelectorAll('.library-filter-btn:not(.add-new)').forEach(btn => {
    btn.addEventListener('click', function(e) {
      // 点 × 删除分类
      if (e.target.classList.contains('lib-del')) {
        e.stopPropagation();
        const name = e.target.dataset.del;
        if (confirm(`删除分类「${name}」？该分类下的游戏不会被删除，只是取消归类。`)) {
          deleteCategory(name);
          renderLibraryBanner();
          filterGames();
        }
        return;
      }
      libraryFilter = this.dataset.filter;
      pageHeader.querySelectorAll('.library-filter-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      filterGames();
    });
  });

  document.getElementById('libNewCatBtn')?.addEventListener('click', function() {
    const name = prompt('输入新分类名称（如：RPG / 周末玩 / 通关收藏）');
    if (!name) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    if (['全部', '已安装'].includes(trimmed) || libraryCategories.some(c => c.name === trimmed)) {
      alert('该分类已存在');
      return;
    }
    createCategory(trimmed);
    renderLibraryBanner();
  });
}

// 打开分类管理浮层（卡片旁）
function openCategoryDialog(gameId, anchorEl) {
  closeCategoryDialog();
  const game = games.find(g => g.id === gameId);
  if (!game) return;

  // 本地草稿状态：分类名 -> 是否勾选。点保存才同步到 libraryCategories
  const draft = {};
  libraryCategories.forEach(cat => {
    draft[cat.name] = cat.gameIds.includes(gameId);
  });

  const overlay = document.createElement('div');
  overlay.className = 'lib-cat-overlay';
  overlay.id = 'libCatOverlay';

  const renderRows = () => {
    const body = overlay.querySelector('.lib-cat-body');
    if (libraryCategories.length === 0) {
      body.innerHTML = '<div class="lib-cat-empty">还没有自定义分类，先在下面新建一个吧</div>';
      return;
    }
    body.innerHTML = libraryCategories.map(cat => {
      const checked = draft[cat.name] ? 'checked' : '';
      return `
        <label class="lib-cat-row">
          <input type="checkbox" data-cat="${cat.name}" ${checked}>
          <span>${cat.name}</span>
          <span class="lib-cat-count">${cat.gameIds.length}</span>
        </label>
      `;
    }).join('');
    body.querySelectorAll('input[type=checkbox]').forEach(cb => {
      cb.addEventListener('change', function() {
        draft[this.dataset.cat] = this.checked;
      });
    });
  };

  overlay.innerHTML = `
    <div class="lib-cat-dialog" id="libCatDialog">
      <div class="lib-cat-head">
        <div class="lib-cat-title">分类管理 · ${game.title}</div>
        <button class="lib-cat-close" id="libCatClose">×</button>
      </div>
      <div class="lib-cat-body"></div>
      <div class="lib-cat-new">
        <input type="text" id="libCatNewInput" placeholder="新建分类..." maxlength="12">
        <button id="libCatNewBtn">添加</button>
      </div>
      <div class="lib-cat-foot">
        <button class="lib-cat-cancel" id="libCatCancel">取消</button>
        <button class="lib-cat-save" id="libCatSave">保存</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  renderRows();

  // 定位到卡片附近
  if (anchorEl) {
    const rect = anchorEl.getBoundingClientRect();
    const dlg = overlay.querySelector('#libCatDialog');
    overlay.style.position = 'fixed';
    overlay.style.alignItems = 'flex-start';
    overlay.style.justifyContent = 'flex-start';
    dlg.style.position = 'absolute';
    let left = rect.right + 8;
    let top = rect.top;
    if (left + 320 > window.innerWidth) left = Math.max(8, rect.left - 328);
    if (top + 420 > window.innerHeight) top = Math.max(8, window.innerHeight - 430);
    dlg.style.left = left + 'px';
    dlg.style.top = top + 'px';
  }

  // 新建分类（仅加入草稿，不立即保存到全局）
  const newInput = overlay.querySelector('#libCatNewInput');
  const newBtn = overlay.querySelector('#libCatNewBtn');
  const doCreate = () => {
    const name = newInput.value.trim();
    if (!name) return;
    if (['全部', '已安装'].includes(name) || libraryCategories.some(c => c.name === name) || draft[name] !== undefined) {
      alert('该分类已存在');
      return;
    }
    // 先加到全局（空 gameIds），再标记草稿为未勾选
    createCategory(name);
    draft[name] = false;
    newInput.value = '';
    renderRows();
    renderLibraryBanner();
  };
  newBtn.addEventListener('click', doCreate);
  newInput.addEventListener('keydown', e => { if (e.key === 'Enter') doCreate(); });

  // 保存：对比草稿与原始状态，同步差异
  overlay.querySelector('#libCatSave').addEventListener('click', function() {
    libraryCategories.forEach(cat => {
      const original = cat.gameIds.includes(gameId);
      const target = !!draft[cat.name];
      if (original !== target) {
        toggleGameCategory(gameId, cat.name);
      }
    });
    saveLibraryCategories();
    closeCategoryDialog();
    renderLibraryBanner();
    filterGames(); // 刷新卡片底部的分类小标签
  });

  overlay.querySelector('#libCatClose').addEventListener('click', closeCategoryDialog);
  overlay.querySelector('#libCatCancel').addEventListener('click', closeCategoryDialog);
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeCategoryDialog();
  });
}

function closeCategoryDialog() {
  const ex = document.getElementById('libCatOverlay');
  if (ex) ex.remove();
}

function getPageCategories() {
  if (activeNav === 'store' || activeNav === 'library') {
    return [categories[0]];
  }
  // 社区页：根据tab返回对应分类（游戏=0, 插画=1）
  return [categories[activeMain]];
}

const allIcons = {
  '冒险': '🏔️', '恋爱模拟': '💕', '像素风': '🟦', '解谜推理': '🔍', '剧情丰富': '📜',
  '肉鸽Like': '🎲', '平台跳跃': '🐸', '恐怖': '👻', '沙盒': '🏗️', '叙事': '📖',
  '日系': '🌸', '赛璐璐': '🎨', '动漫风': '✨', '厚涂': '🖌️', '萌系': '🥰', '机甲': '🤖',
  '水墨': '🖋️', '工笔': '🖼️', '写意': '🎋', '古风': '🏮', '敦煌': '🪷', '仙侠': '⚔️',
  '热血': '🔥', '战斗': '⚡', '体育': '🏀', '恋爱': '💗', '校园': '🏫', '奇幻': '🦄',
  '穿越': '⏳', '修仙': '🧘', '城市': '🌆', '搞笑': '😂', '王道': '👑', '治愈': '🌿',
  '悬疑': '🔎', '日常': '☀️', '彩色': '🌈', '竖屏': '📱', '短篇': '📝', '改编': '🔄',
  '东方玄幻': '🐉', '异世大陆': '🌍', '魔法': '🔮', '修真': '🧙', '凡人流': '👤',
  '职场': '💼', '豪门': '🏰', '系统流': '⚙️', '星际': '🚀', '末世': '☢️', '赛博朋克': '🔩',
  '推理': '🕵️', '灵异': '🔮', '惊悚': '😱',
  '国风': '🏯', '民乐': '🎶', '戏腔': '🎭',
  '华语': '🇨🇳', '日韩': '🇯🇵', '欧美': '🇺🇸',
  'EDM': '🎧', '未来': '🤖', '合成器': '🎛️',
  '钢琴': '🎹', '民谣': '🎸', '氛围': '🌌',
  'AI生成': '🤖', 'AI对战': '🧠', '创作': '✏️', '休闲': '🧘',
  '科幻': '🚀', '解谜': '🧩', '养成': '🐣', 'RPG': '⚔️', '音乐': '🎵', '推理': '🔍',
};

function renderMainCategories() {
  const cats = getPageCategories();
  const row = document.getElementById('sidebarMainRow');
  if (!row) return;

  if (cats.length <= 1) {
    row.innerHTML = '';
    return;
  }

  row.innerHTML = cats.map((cat, idx) => `
    <button class="sidebar-main-btn ${idx === activeMain ? 'active' : ''}" data-index="${idx}">
      ${cat.name}
    </button>
  `).join('');

  row.querySelectorAll('.sidebar-main-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const idx = parseInt(this.dataset.index);
      if (idx === activeMain) return;

      row.querySelectorAll('.sidebar-main-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');

      activeMain = idx;
      activeSub = 0;
      activeSubSub = 0;

      renderSubCategories();
      renderSubSubCategories();
      filterGames();
    });
  });
}

function renderSubCategories() {
  const cats = getPageCategories();
  const row = document.getElementById('sidebarSubRow');
  if (!row) return;
  const subs = cats[0]?.subs;
  if (!subs || subs.length === 0) {
    row.innerHTML = '';
    return;
  }

  row.innerHTML = subs.map((sub, idx) => `
    <button class="sidebar-sub-btn ${idx === activeSub ? 'active' : ''}" data-index="${idx}">
      ${sub.name}
    </button>
  `).join('');

  row.querySelectorAll('.sidebar-sub-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const idx = parseInt(this.dataset.index);
      if (idx === activeSub) return;

      row.querySelectorAll('.sidebar-sub-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');

      activeSub = idx;
      activeSubSub = 0;

      renderSubSubCategories();
      filterGames();
    });
  });
}

function renderSubSubCategories() {
  const cats = getPageCategories();
  const row = document.getElementById('sidebarSubSubRow');
  if (!row) return;
  const subs = cats[0]?.subs;
  if (!subs || activeSub < 0 || !subs[activeSub]) {
    row.innerHTML = '';
    return;
  }

  let subsubs;
  if (subs[activeSub].name === '全部') {
    const siblings = subs.filter(s => s.name !== '全部');
    const seen = new Set();
    subsubs = ['全部'];
    siblings.forEach(s => s.subs.forEach(ss => {
      if (!seen.has(ss) && ss !== '全部') { seen.add(ss); subsubs.push(ss); }
    }));
  } else {
    subsubs = subs[activeSub].subs;
  }

  if (!subsubs || subsubs.length === 0) {
    row.innerHTML = '';
    return;
  }

  row.innerHTML = subsubs.map((ss, idx) => `
    <button class="sidebar-subsub-btn ${idx === activeSubSub ? 'active' : ''}" data-index="${idx}">
      ${ss}
    </button>
  `).join('');

  row.querySelectorAll('.sidebar-subsub-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const idx = parseInt(this.dataset.index);

      row.querySelectorAll('.sidebar-subsub-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');

      activeSubSub = idx === activeSubSub ? -1 : idx;
      filterGames();
    });
  });
}

function renderPriceFilters() {
  const row = document.getElementById('sidebarPriceRow');
  if (!row) return;
  const prices = [
    { key: 'paid', name: '付费' },
    { key: 'free', name: '免费' },
    { key: 'discount', name: '折扣' }
  ];
  row.innerHTML = prices.map(p => `
    <button class="sidebar-price-btn ${activePrice === p.key ? 'active' : ''}" data-key="${p.key}">
      ${p.name}
    </button>
  `).join('');
  row.querySelectorAll('.sidebar-price-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const key = this.dataset.key;
      activePrice = activePrice === key ? null : key;
      row.querySelectorAll('.sidebar-price-btn').forEach(b => b.classList.remove('active'));
      if (activePrice) this.classList.add('active');
      filterGames();
    });
  });
}

function filterGames() {
  currentPage = 0;
  filteredGames = null;
  const allData = getContentData();

  // 库页面：按 libraryFilter 过滤（全部/已安装/自定义分类）
  if (activeNav === 'library') {
    let result = allData;
    if (libraryFilter !== '全部') {
      result = result.filter(g => gameInCategory(g.id, libraryFilter));
    }
    filteredGames = result;
    renderGames();
    return;
  }

  // 公告页：直接渲染公告列表，不走游戏筛选
  if (activeNav === 'notice') {
    filteredGames = [];
    renderNoticeList();
    return;
  }

  const cats = getPageCategories();

  if (activeMain < 0) { renderGames(); return; }

  const main = cats[0];

  let filterTerm = '';
  let subCatFilter = '';
  if (activeSub >= 0) {
    const sub = main.subs[activeSub];
    if (sub.name === '全部') {
      // "全部"分类下，聚合所有兄弟子分类的标签
      if (activeSubSub >= 0) {
        const subsubs = (function() {
          const siblings = main.subs.filter(s => s.name !== '全部');
          const seen = new Set();
          const list = ['全部'];
          siblings.forEach(s => s.subs.forEach(ss => {
            if (!seen.has(ss) && ss !== '全部') { seen.add(ss); list.push(ss); }
          }));
          return list;
        })();
        const picked = subsubs[activeSubSub];
        filterTerm = (picked && picked !== '全部') ? picked : '';
      } else {
        filterTerm = '';
      }
    } else {
      // 选了具体子分类（如独立游戏），按 subCat 过滤
      subCatFilter = sub.name;
      if (activeSubSub >= 0) {
        const subsub = sub.subs[activeSubSub];
        // 选"全部"标签时显示该子分类下所有内容
        filterTerm = subsub === '全部' ? '' : subsub;
      } else {
        filterTerm = '';
      }
    }
  } else {
    filterTerm = '';
  }

  let result;
  if (!filterTerm && !subCatFilter) {
    result = activeNav === 'community'
      ? (main.name === '游戏' ? [...gamePostData] : allData.filter(g => g.cat === main.name))
      : allData;
  } else {
    result = activeNav === 'community' && main.name === '游戏'
      ? [...gamePostData]
      : allData.filter(g => {
      if (activeNav === 'community' && main.name !== '游戏' && g.cat !== main.name) return false;
      // 商店按 subCat 过滤子分类
      if (subCatFilter && g.subCat !== subCatFilter) return false;
      if (filterTerm && !g.tags.some(t => t.includes(filterTerm) || filterTerm.includes(t))) return false;
      return true;
    });
  }

  // 应用价格筛选（独立维度，可与类型/分类/标签组合）
  if (activePrice) {
    result = result.filter(g => {
      if (activePrice === 'free') return g.free === true;
      if (activePrice === 'paid') return g.free === false;
      if (activePrice === 'discount') return g.discount === true;
      return false;
    });
  }

  filteredGames = result;
  renderGames();
}

const gamePostData = [
  { gameIdx: 0, author: '夜行旅人', avatar: '🦊', title: '梦境探险通关！分享我的隐藏路线', content: '在第三层梦境里发现了一个隐藏通道，不用打 boss 直接能拿到梦境核心。具体走法：进门左转 → 跳到第二盏灯上 → 往右下方滑铲 → 会看到一个半透明的墙，穿过去就行。核心拿到后boss战会跳过，直接进结局。', replies: 12, views: '1.2k', time: '2小时前', liked: false, fileData: null, fileType: null },
  { gameIdx: 3, author: '解谜狂魔', avatar: '🧩', title: '幻境迷城第三关卡住了，求大佬指点', content: '那个八卦阵转盘的谜题，我转了半小时都对不上。已知线索是"乾坤定位，巽离相生"，但转盘只有6格不是8格啊？是不是有bug还是我漏看了什么道具？', replies: 5, views: '486', time: '5小时前', liked: false, fileData: null, fileType: null },
  { gameIdx: 1, author: '棋场老司机', avatar: '♟️', title: '星落棋局·高分阵容推荐（已上王者）', content: '分享一套稳定上分的阵容：核心是"霜语者+烬羽"，前排用"铁壁"扛伤，后排带"织星"控场。关键节奏点在第4回合开大，能把对面一波带走。附阵容站位图和出装顺序。', replies: 28, views: '3.4k', time: '1天前', liked: false, fileData: null, fileType: null },
  { gameIdx: 4, author: '灵宠训练师', avatar: '🐾', title: '灵宠大陆·稀有灵兽刷新点汇总', content: '收集了一周的刷新点，整理成表格分享给大家。蓝色品质基本每个区域都有，紫色品质建议蹲"幽暗森林"和"星陨湖"，金色品质目前只在"龙骨遗迹"见过一次。附坐标和刷新时间窗口。', replies: 41, views: '8.7k', time: '2天前', liked: false, fileData: null, fileType: null },
];


function renderFeed(posts) {
  const list = posts || gamePostData;
  if (!list || list.length === 0) {
    return '<div class="feed-empty">暂无帖子，点击「发帖」发布第一条吧</div>';
  }
  const allData = getContentData();
  return list.map((post, i) => {
    const game = allData[post.gameIdx] || allData[0];
    const fileHtml = post.fileData
      ? (post.fileType === 'video'
        ? `<div class="feed-post-file"><video src="${post.fileData}" controls muted></video></div>`
        : `<div class="feed-post-file"><img src="${post.fileData}"></div>`)
      : '';
    return `
      <div class="feed-post game-card" data-post="${i}">
        <div class="feed-post-forum" data-game-idx="${games.indexOf(game)}">${game.emoji} ${game.title}</div>
        <div class="feed-post-user">
          <div class="feed-post-avatar">${post.avatar}</div>
          <div class="feed-post-user-info">
            <span class="feed-post-author">${post.author}</span>
            <span class="feed-post-time">${post.time}</span>
          </div>
          <span class="feed-post-title-inline">${post.title}</span>
        </div>
        <div class="feed-post-content" data-expandable>${post.content}</div>
        <span class="feed-post-expand" style="display:none" data-expand>展开全部</span>
        ${fileHtml}
        <div class="feed-post-footer">
          <button class="feed-post-action" data-action="like" data-post="${i}">👍 赞</button>
          <button class="feed-post-action" data-action="reply" data-post="${i}">💬 ${post.replies}</button>
          <span class="feed-post-stat">👁 ${post.views}</span>
        </div>
      </div>
    `;
  }).join('');
}

function openPostCreateModal(type) {
  const overlay = document.createElement('div');
  overlay.className = 'post-create-overlay';

  if (!type) {
    // 先选类型
    overlay.innerHTML = `
      <div class="post-create-modal" style="width:320px">
        <div class="post-create-head">
          <h3>✏️ 发布内容</h3>
          <button class="post-create-close">×</button>
        </div>
        <div class="post-create-body" style="display:flex;flex-direction:column;gap:10px">
          <button class="post-type-btn" data-type="post">📝 帖子</button>
          <button class="post-type-btn" data-type="art">🎨 插画</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector('.post-create-close').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    overlay.querySelectorAll('.post-type-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        overlay.remove();
        openPostCreateModal(this.dataset.type);
      });
    });
    return;
  }

  if (type === 'art') {
    overlay.innerHTML = `
      <div class="post-create-modal">
        <div class="post-create-head">
          <h3>🎨 发布插画</h3>
          <button class="post-create-close">×</button>
        </div>
        <div class="post-create-body">
          <div class="post-create-field">
            <label>插画图片 <span style="color:#ff4d4f">*</span></label>
            <div class="file-upload-area" id="artFileArea">
              <input type="file" id="artFileInput" accept="image/*" hidden>
              <div class="file-upload-placeholder" id="artFilePlaceholder">
                <span class="file-upload-icon">📁</span>
                <span>点击选择图片（必填）</span>
              </div>
              <div class="file-upload-preview" id="artFilePreview" style="display:none">
                <img id="artFileThumb">
                <button class="file-upload-remove" id="artFileRemove">×</button>
              </div>
            </div>
          </div>
          <div class="post-create-field">
            <label>插画标题</label>
            <input type="text" id="artTitleInput" placeholder="给作品起个名字..." maxlength="30">
          </div>
          <div class="post-create-field">
            <label>插画描述</label>
            <textarea id="artDescInput" placeholder="描述你的作品..." maxlength="200"></textarea>
          </div>
          <div class="post-create-field">
            <label>分类</label>
            <div id="artCatBtns" style="display:flex;gap:8px;flex-wrap:wrap">
              <button type="button" class="art-cat-btn active" data-cat="二次元">二次元</button>
              <button type="button" class="art-cat-btn" data-cat="国风">国风</button>
              <button type="button" class="art-cat-btn" data-cat="写实">写实</button>
              <button type="button" class="art-cat-btn" data-cat="Q版">Q版</button>
            </div>
            <div id="artSubCatBox" style="margin-top:8px;display:flex;flex-wrap:wrap;gap:6px"></div>
          </div>
          <div class="post-create-field">
            <label>标签 <span style="color:#888;font-weight:400;font-size:12px">用 #标签名 添加，如 #日系 #萌系</span></label>
            <input type="text" id="artTagInput" placeholder="#标签1 #标签2 #标签3..." maxlength="100">
            <div id="artTagPreview" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px"></div>
          </div>
        </div>
        <div class="post-create-foot">
          <button class="post-create-cancel">取消</button>
          <button class="post-create-submit">发布</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    let artFileData = null;
    const artFileArea = overlay.querySelector('#artFileArea');
    const artFileInput = overlay.querySelector('#artFileInput');
    const artPlaceholder = overlay.querySelector('#artFilePlaceholder');
    const artPreview = overlay.querySelector('#artFilePreview');
    const artThumb = overlay.querySelector('#artFileThumb');
    artFileArea.addEventListener('click', () => artFileInput.click());
    artFileInput.addEventListener('change', function() {
      const file = this.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = e => {
        artFileData = e.target.result;
        artThumb.src = artFileData;
        artPlaceholder.style.display = 'none';
        artPreview.style.display = 'flex';
      };
      reader.readAsDataURL(file);
    });
    overlay.querySelector('#artFileRemove').addEventListener('click', function(e) {
      e.stopPropagation();
      artFileData = null;
      artFileInput.value = '';
      artPlaceholder.style.display = '';
      artPreview.style.display = 'none';
    });
    // 标签输入实时预览
    const artTagInput = overlay.querySelector('#artTagInput');
    const artTagPreview = overlay.querySelector('#artTagPreview');
    function parseTags(text) {
      const matches = text.match(/#[^\s#]+/g) || [];
      return matches.map(t => t.substring(1));
    }
    function updateTagPreview() {
      const tags = parseTags(artTagInput.value);
      artTagPreview.innerHTML = tags.map(t => `<span style="display:inline-block;padding:3px 10px;border-radius:12px;font-size:12px;background:rgba(102,192,244,0.12);color:#66c0f4;border:1px solid rgba(102,192,244,0.3)">#${t}</span>`).join('');
    }
    artTagInput.addEventListener('input', updateTagPreview);
    // 分类/子分类选择
    let selectedArtCat = '二次元';
    let selectedArtSubCat = '';
    const artSubData = {
      '二次元': ['日系', '赛璐璐', '动漫风', '厚涂', '萌系', '机甲', '萝莉', '兽耳'],
      '国风': ['水墨', '工笔', '写意', '古风', '敦煌', '仙侠', '宫廷', '青绿'],
      '写实': ['写实', 'CG原画', '场景', '人像', '概念设计'],
      'Q版': ['Q版', '卡通', '可爱风', '简笔', '头像'],
    };
    // 注入样式
    if (!document.getElementById('artCatStyle')) {
      const s = document.createElement('style');
      s.id = 'artCatStyle';
      s.textContent = '.art-cat-btn{padding:6px 14px;border:1px solid rgba(255,255,255,0.1);border-radius:6px;background:rgba(255,255,255,0.04);color:#b8b6b0;font-size:13px;font-weight:500;cursor:pointer;transition:all 0.2s;font-family:inherit}.art-cat-btn:hover{color:#fff;border-color:rgba(102,192,244,0.3)}.art-cat-btn.active{color:#fff;background:rgba(102,192,244,0.15);border-color:#66c0f4;font-weight:600}.art-sub-btn{padding:5px 12px;border:1px solid rgba(255,255,255,0.08);border-radius:4px;background:rgba(255,255,255,0.03);color:#9a9aba;font-size:12px;cursor:pointer;transition:all 0.2s;font-family:inherit}.art-sub-btn:hover{color:#e0e0e0;border-color:rgba(102,192,244,0.3)}.art-sub-btn.active{color:#66c0f4;border-color:#66c0f4;background:rgba(102,192,244,0.1);font-weight:600}';
      document.head.appendChild(s);
    }
    const artCatBtns = overlay.querySelector('#artCatBtns');
    const artSubCatBox = overlay.querySelector('#artSubCatBox');
    function renderArtSubCats() {
      const subs = artSubData[selectedArtCat] || [];
      artSubCatBox.innerHTML = subs.map(s =>
        `<button type="button" class="art-sub-btn${s === selectedArtSubCat ? ' active' : ''}" data-sub="${s}">${s}</button>`
      ).join('');
      artSubCatBox.querySelectorAll('.art-sub-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          selectedArtSubCat = this.dataset.sub === selectedArtSubCat ? '' : this.dataset.sub;
          artSubCatBox.querySelectorAll('.art-sub-btn').forEach(b => b.classList.remove('active'));
          if (selectedArtSubCat) this.classList.add('active');
        });
      });
    }
    artCatBtns.querySelectorAll('.art-cat-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        selectedArtCat = this.dataset.cat;
        selectedArtSubCat = '';
        artCatBtns.querySelectorAll('.art-cat-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        renderArtSubCats();
      });
    });
    renderArtSubCats();
    const close = () => overlay.remove();
    overlay.querySelector('.post-create-close').addEventListener('click', close);
    overlay.querySelector('.post-create-cancel').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    overlay.querySelector('.post-create-submit').addEventListener('click', function() {
      const title = document.getElementById('artTitleInput').value.trim();
      const desc = document.getElementById('artDescInput').value.trim();
      const inputTags = parseTags(document.getElementById('artTagInput').value);
      if (!artFileData) { alert('请上传插画图片'); return; }
      if (!title) { alert('请输入标题'); return; }
      const allTags = [selectedArtCat, selectedArtSubCat, ...inputTags].filter(Boolean);
      communityData.unshift({
        id: communityData.length + 1, title, emoji: '🖼️', desc: desc || title,
        tags: allTags, cat: '插画', catIndex: 1, subCat: selectedArtSubCat || selectedArtCat,
        author: '我', likes: '0', comments: '0',
        price: '免费', free: true, discount: false, fileData: artFileData
      });
      close();
      // 切换到社区插画tab并渲染（不调 switchToNav，避免它重置 activeMain）
      activeNav = 'community';
      activeMain = 1;
      activeSub = 0;
      activeSubSub = 0;
      activePrice = null;
      filteredGames = null;
      // 显示社区专属元素
      const hero = document.querySelector('.hero');
      if (hero) hero.style.display = 'none';
      const leftSidebar = document.getElementById('leftSidebar');
      if (leftSidebar) leftSidebar.style.display = '';
      const communityTabs = document.getElementById('communityTabs');
      if (communityTabs) communityTabs.style.display = '';
      const sidebar = document.getElementById('sidebar');
      if (sidebar) sidebar.style.display = '';
      // 顶部 tab 高亮插画
      document.querySelectorAll('.community-tab:not(.post-btn)').forEach(t => {
        t.classList.toggle('active', t.dataset.page === '插画');
      });
      renderCommunitySidebar();
      renderActivityBox();
      filterGames();
    });
    return;
  }

  // 帖子类型
  overlay.innerHTML = `
    <div class="post-create-modal">
      <div class="post-create-head">
        <h3>📝 发布帖子</h3>
        <button class="post-create-close">×</button>
      </div>
      <div class="post-create-body">
        <div class="post-create-field" style="position:relative">
          <label>选择游戏</label>
          <input type="text" id="postGameSearch" placeholder="搜索游戏名称..." autocomplete="off">
          <div id="postGameResults" class="post-game-results" style="display:none"></div>
          <input type="hidden" id="postGameIdx" value="">
          <div id="postGameSelected" class="post-game-selected" style="display:none"></div>
        </div>
        <div class="post-create-field">
          <label>帖子标题</label>
          <input type="text" id="postTitleInput" placeholder="请输入标题..." maxlength="50">
        </div>
        <div class="post-create-field">
          <label>帖子内容</label>
          <textarea id="postContentInput" placeholder="分享你的游戏心得..." maxlength="500"></textarea>
        </div>
        <div class="post-create-field">
          <label>附件（可选，支持图片和视频）</label>
          <div class="file-upload-area" id="postFileArea">
            <input type="file" id="postFileInput" accept="image/*,video/*" hidden>
            <div class="file-upload-placeholder" id="postFilePlaceholder">
              <span class="file-upload-icon">📎</span>
              <span>点击选择图片或视频</span>
            </div>
            <div class="file-upload-preview" id="postFilePreview" style="display:none">
              <img id="postFileThumb" style="display:none">
              <video id="postFileVideo" style="display:none" muted></video>
              <span class="file-upload-name" id="postFileName"></span>
              <button class="file-upload-remove" id="postFileRemove">×</button>
            </div>
          </div>
        </div>
      </div>
      <div class="post-create-foot">
        <button class="post-create-cancel">取消</button>
        <button class="post-create-submit">发布</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  let postFileData = null;
  let postFileType = '';
  const postFileArea = overlay.querySelector('#postFileArea');
  const postFileInput = overlay.querySelector('#postFileInput');
  const postPlaceholder = overlay.querySelector('#postFilePlaceholder');
  const postPreview = overlay.querySelector('#postFilePreview');
  const postThumb = overlay.querySelector('#postFileThumb');
  const postVideo = overlay.querySelector('#postFileVideo');
  const postFileName = overlay.querySelector('#postFileName');
  postFileArea.addEventListener('click', () => postFileInput.click());
  postFileInput.addEventListener('change', function() {
    const file = this.files[0];
    if (!file) return;
    postFileType = file.type.startsWith('video/') ? 'video' : 'image';
    postFileName.textContent = file.name;
    const reader = new FileReader();
    reader.onload = e => {
      postFileData = e.target.result;
      postPlaceholder.style.display = 'none';
      postPreview.style.display = 'flex';
      if (postFileType === 'video') {
        postVideo.src = postFileData;
        postVideo.style.display = 'block';
        postThumb.style.display = 'none';
      } else {
        postThumb.src = postFileData;
        postThumb.style.display = 'block';
        postVideo.style.display = 'none';
      }
    };
    reader.readAsDataURL(file);
  });
  overlay.querySelector('#postFileRemove').addEventListener('click', function(e) {
    e.stopPropagation();
    postFileData = null;
    postFileType = '';
    postFileInput.value = '';
    postPlaceholder.style.display = '';
    postPreview.style.display = 'none';
  });

  // 游戏搜索功能
  let selectedGameIdx = -1;
  const gameSearch = overlay.querySelector('#postGameSearch');
  const gameResults = overlay.querySelector('#postGameResults');
  const gameIdxInput = overlay.querySelector('#postGameIdx');
  const gameSelected = overlay.querySelector('#postGameSelected');

  function showGameResults(query) {
    if (!query.trim()) { gameResults.style.display = 'none'; return; }
    const q = query.toLowerCase();
    const matches = games.filter(g => g.title.toLowerCase().includes(q)).slice(0, 8);
    if (matches.length === 0) {
      gameResults.innerHTML = '<div style="padding:10px 12px;color:#666;font-size:13px">未找到相关游戏</div>';
    } else {
      gameResults.innerHTML = matches.map((g, i) => {
        const realIdx = games.indexOf(g);
        return `<div class="post-game-result-item" data-idx="${realIdx}">
          <span class="result-emoji">${g.emoji}</span>
          <span class="result-title">${g.title}</span>
          <span class="result-sub">${g.subCat}</span>
        </div>`;
      }).join('');
      gameResults.querySelectorAll('.post-game-result-item').forEach(item => {
        item.addEventListener('click', function() {
          const idx = parseInt(this.dataset.idx);
          selectedGameIdx = idx;
          gameIdxInput.value = idx;
          gameSearch.value = '';
          gameResults.style.display = 'none';
          const g = games[idx];
          gameSelected.style.display = 'flex';
          gameSelected.innerHTML = `
            <span class="sel-emoji">${g.emoji}</span>
            <span class="sel-title">${g.title}</span>
            <button class="sel-remove" id="postGameRemove">×</button>
          `;
          gameSelected.querySelector('#postGameRemove').addEventListener('click', function() {
            selectedGameIdx = -1;
            gameIdxInput.value = '';
            gameSelected.style.display = 'none';
          });
        });
      });
    }
    gameResults.style.display = 'block';
  }

  gameSearch.addEventListener('input', function() { if (selectedGameIdx >= 0) { this.value = ''; return; } showGameResults(this.value); });
  gameSearch.addEventListener('focus', function() { if (selectedGameIdx >= 0) { this.blur(); return; } if (this.value.trim()) showGameResults(this.value); });
  document.addEventListener('click', function(e) {
    if (!e.target.closest('#postGameSearch') && !e.target.closest('#postGameResults')) {
      gameResults.style.display = 'none';
    }
  });

  const close = () => overlay.remove();
  overlay.querySelector('.post-create-close').addEventListener('click', close);
  overlay.querySelector('.post-create-cancel').addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  overlay.querySelector('.post-create-submit').addEventListener('click', function() {
    const title = document.getElementById('postTitleInput').value.trim();
    const content = document.getElementById('postContentInput').value.trim();
    const gameIdx = selectedGameIdx;
    if (gameIdx < 0) { alert('请先搜索并选择一个游戏'); return; }
    if (!title || !content) { alert('请填写标题和内容'); return; }
    gamePostData.unshift({
      gameIdx, author: '我', avatar: '👤',
      title, content, replies: 0, views: '0', time: '刚刚', liked: false,
      fileData: postFileData || null, fileType: postFileType || null
    });
    close();
    // 切换到社区游戏tab并渲染（不调 switchToNav，避免它重置 activeMain）
    activeNav = 'community';
    activeMain = 0;
    activeSub = 0;
    activeSubSub = 0;
    activePrice = null;
    filteredGames = null;
    const hero = document.querySelector('.hero');
    if (hero) hero.style.display = 'none';
    const gameLeftSidebar = document.getElementById('leftSidebar');
    if (gameLeftSidebar) gameLeftSidebar.style.display = '';
    const communityTabs = document.getElementById('communityTabs');
    if (communityTabs) communityTabs.style.display = '';
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.style.display = '';
    document.querySelectorAll('.community-tab:not(.post-btn)').forEach(t => {
      t.classList.toggle('active', t.dataset.page === '游戏');
    });
    renderCommunitySidebar();
    renderActivityBox();
    filterGames();
  });
}

function openPostDetail(postIdx) {
  const post = gamePostData[postIdx];
  if (!post) return;
  const allData = getContentData();
  const game = allData[post.gameIdx] || allData[0];
  const gameId = game.id || post.gameIdx;
  const gameEmoji = game.emoji || '🎮';
  const overlay = document.createElement('div');
  overlay.className = 'post-detail-overlay';
  overlay.innerHTML = `
    <div class="post-detail-modal">
      <div class="post-detail-head">
        <div class="post-detail-user">
          <div class="feed-post-avatar">${post.avatar}</div>
          <div class="feed-post-user-info">
            <span class="feed-post-author">${post.author}</span>
            <span class="feed-post-time">${post.time}</span>
          </div>
        </div>
        <button class="post-detail-close">×</button>
      </div>
      <div class="post-detail-forum">
        <span class="post-detail-forum-name">${game.title}</span>
        <div class="post-detail-forum-actions">
          <button class="forum-chip join-group" id="postJoinGroup" title="加入该游戏的玩家群聊">
            <span class="forum-chip-icon">💬</span><span class="forum-chip-text">加入群聊</span>
          </button>
          <button class="forum-chip follow" id="postFollow" title="关注该游戏">
            <span class="forum-chip-icon">＋</span><span class="forum-chip-text">关注</span>
          </button>
        </div>
      </div>
      <div class="post-detail-title">${post.title}</div>
      <div class="post-detail-body">${post.content}</div>
      <div class="post-detail-foot">
        <span>💬 ${post.replies} 回复</span>
        <span>👁 ${post.views} 浏览</span>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay || e.target.classList.contains('post-detail-close')) {
      overlay.remove();
    }
  });

  // 关注按钮：按游戏 id 持久化
  const FOLLOW_KEY = 'followedGames';
  function loadFollowed() {
    try { const raw = localStorage.getItem(FOLLOW_KEY); if (raw) return JSON.parse(raw); } catch (e) {}
    return [];
  }
  function saveFollowed(arr) {
    try { localStorage.setItem(FOLLOW_KEY, JSON.stringify(arr)); } catch (e) {}
  }
  const followBtn = overlay.querySelector('#postFollow');
  if (followBtn) {
    if (loadFollowed().includes(gameId)) {
      followBtn.classList.add('followed');
      followBtn.querySelector('.forum-chip-text').textContent = '已关注';
      followBtn.querySelector('.forum-chip-icon').textContent = '✓';
    }
    followBtn.addEventListener('click', function () {
      let arr = loadFollowed();
      if (arr.includes(gameId)) {
        arr = arr.filter(id => id !== gameId);
        this.classList.remove('followed');
        this.querySelector('.forum-chip-text').textContent = '关注';
        this.querySelector('.forum-chip-icon').textContent = '＋';
      } else {
        arr.push(gameId);
        this.classList.add('followed');
        this.querySelector('.forum-chip-text').textContent = '已关注';
        this.querySelector('.forum-chip-icon').textContent = '✓';
      }
      saveFollowed(arr);
    });
  }

  // 加入群聊按钮：自动创建/查找同名游戏群组，并选中显示聊天框
  const joinGroupBtn = overlay.querySelector('#postJoinGroup');
  if (joinGroupBtn) {
    joinGroupBtn.addEventListener('click', function () {
      if (!this.classList.contains('joined')) {
        this.classList.add('joined');
        this.querySelector('.forum-chip-text').textContent = '已加入群聊';
        this.querySelector('.forum-chip-icon').textContent = '✓';
        const groupName = `${game.title} 玩家群`;
        if (!imGroups.find(g2 => g2.name === groupName)) {
          imGroups.push({
            id: 'gg' + Date.now(),
            name: groupName,
            avatar: gameEmoji,
            online: true,
            unread: 0,
            memberCount: Math.floor(Math.random() * 800) + 200,
            lastMsg: `欢迎来到「${game.title}」玩家群`,
            messages: [
              { from: 'other', sender: '系统', text: `欢迎来到「${game.title}」玩家群，请文明交流～`, time: '刚刚' }
            ]
          });
          saveImData(IM_GROUPS_KEY, imGroups);
        }
      }
      // 先关闭帖子详情弹窗，避免遮挡
      overlay.remove();
      // 直接打开 IM 弹窗（不调用 openImModal，避免它重置 imActiveContact）
      const imOverlay = document.getElementById('imOverlay');
      if (imOverlay) imOverlay.classList.add('open');
      const badge = document.getElementById('messageBadge');
      if (badge) badge.classList.add('hidden');
      imFriends.forEach(f => f.unread = 0);
      imGroups.forEach(g => g.unread = 0);
      // 切到群组 tab
      imActiveTab = 'groups';
      document.querySelectorAll('.im-sidebar-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.tab === 'groups');
      });
      // 选中刚加入的群组
      const targetName = `${game.title} 玩家群`;
      imActiveContact = imGroups.find(g2 => g2.name === targetName) || imGroups[imGroups.length - 1];
      renderImContacts();
      renderImChat();
    });
  }
}

const gameNames = [
  ['梦境探险', '🌙', '在神秘的梦境世界中击败梦魇，拯救沉睡的灵魂'],
  ['星落棋局', '♟️', '回合制策略对战，调遣英雄占领棋盘点位'],
  ['幻境迷城', '🔐', '被困在千年古墓中，解开机关逃出生天'],
  ['银河征途', '🚀', '指挥舰队探索未知星系，与外星文明建交或交战'],
  ['灵宠大陆', '🐾', '捕获并培养灵兽，组建队伍挑战道馆馆主'],
  ['寒锋传说', '⚔️', '在冰封大陆上挥舞长剑，揭开远古封印的秘密'],
  ['节奏大师', '🎵', '跟随音乐节拍击打音符，挑战全球排行榜'],
  ['迷雾侦探', '🔍', '调查离奇案件，收集线索还原真相'],
  ['极速狂奔', '🏃', '在悬崖之城奔跑跳跃，躲避致命陷阱冲向终点'],
  ['街头卡丁', '🏎️', '在城市赛道漂移竞速，使用道具干扰对手'],
  ['美食小镇', '🍳', '经营自己的餐厅，研发菜品吸引各路食客'],
  ['舞力全开', '💃', '跟随节奏跳出完美舞步，赢得舞王称号'],
  ['光影暗房', '📸', '在废弃城市中拍摄隐藏的灵异照片'],
  ['魔法学院', '🪄', '学习咒语与炼金术，成为最强魔法师'],
  ['铁拳擂台', '🥊', '在擂台上一对一格斗，用组合技击倒对手'],
  ['花园物语', '🌻', '打造属于自己的梦幻花园，参加园艺大赛'],
  ['古墓寻踪', '🏺', '深入古代遗迹发掘文物，揭开历史谜团'],
  ['怒海争锋', '⛵', '在大海上航行，与海盗战斗寻找失落的宝藏'],
  ['魔术大师', '🎩', '学习魔术技巧在舞台上表演，成为世界级魔术师'],
  ['异兽乐园', '🦁', '经营野生动物园，繁育珍稀动物吸引游客'],
  ['星辰观测站', '🔭', '架设望远镜观测星空，发现新的行星与星云'],
  ['霓裳大赛', '👗', '设计服装参加时装秀，成为顶尖时装设计师'],
  ['梦想家园', '🏗️', '从零开始设计建造属于你的梦想别墅'],
  ['荒野求生', '🧭', '在荒岛上寻找资源搭建营地，抵御野兽攻击'],
  ['雪山速降', '⛷️', '在极限雪道上高速滑降，完成高难度空中技巧'],
  ['巨浪挑战', '🏄', '征服世界最高巨浪，成为冲浪传奇'],
  ['垂钓大师', '🎣', '在世界各地钓场挑战巨型鱼类，收集稀有鱼种'],
  ['甜蜜烘焙', '🥐', '学习烘焙技巧，制作精美甜点赢得顾客好评'],
  ['鸡尾酒之夜', '🍸', '调制经典鸡尾酒，经营最受欢迎的酒吧'],
  ['花艺人生', '💐', '学习插花艺术，用花束传递情感与故事'],
  ['瑜伽修行', '🧘', '在山间冥想修行，通过瑜伽提升身心境界'],
  ['丛林猎手', '🏹', '在原始丛林中狩猎追踪，用弓箭猎取猎物'],
  ['绿茵传奇', '⛳', '在高尔夫球场上挥杆，参加世界顶级赛事'],
  ['桌上争霸', '🎱', '在台球桌上展现精准走位，一杆清台取胜'],
  ['全倒之王', '🎳', '在保龄球赛道上打出完美全倒，赢得冠军奖杯'],
  ['百步穿杨', '🎯', '在飞镖比赛中精准命中靶心，挑战世界纪录'],
  ['深海巨物', '🐟', '驾驶渔船出海，在深海中搏斗巨型鱼类'],
  ['极限滑板', '🛹', '在城市街头完成滑板特技，拍摄极限视频'],
  ['岩壁攀登', '🧗', '挑战世界最难的攀岩路线，征服垂直极限'],
  ['城市马拉松', '🏃', '在世界各大城市参加马拉松，突破体能极限'],
  ['环岛骑行', '🚴', '骑行穿越壮丽风景，完成环岛耐力挑战'],
  ['高空跳伞', '🪂', '从万米高空跳下，精准降落在目标地点'],
  ['深蓝秘境', '🤿', '潜入海底探索沉船与珊瑚礁，拍摄海底奇景'],
  ['御风飞行', '🪁', '驾驶滑翔伞穿越峡谷，借助气流翱翔天际'],
  ['马术嘉年华', '🐴', '骑马跨越障碍物，在马术比赛中夺得桂冠'],
  ['靶场风云', '🔫', '在射击靶场训练，参加IPSC实用射击比赛'],
  ['剑道巅峰', '🤺', '在击剑赛场上与对手对决，刺出制胜一击'],
  ['柔术之道', '🥋', '学习柔术技巧，在比赛中以柔克刚击败对手'],
  ['峡谷对决', '🕹️', '在MOBA战场上与队友配合，摧毁敌方水晶'],
  ['星光舞台', '🎙️', '成为虚拟主播在直播间表演，收获百万粉丝'],
  ['光影交错', '✍️', '创作互动剧情游戏，玩家的选择决定故事走向'],
  ['旋律工坊', '🎼', '创作音乐曲目，用旋律打动听众的心灵'],
  ['回声剧场', '🎤', '为动画角色配音，用声音赋予角色生命'],
  ['幻界探险', '🃏', '在卡牌对战中收集英雄卡牌，组建最强卡组'],
  ['魔法编织者', '🪄', '探索开放魔法世界，学习失传的上古咒语'],
  ['废土拾荒', '☢️', '在核爆废土上搜寻物资，建立避难所抵御变异生物'],
  ['蒸汽之城', '⚙️', '在蒸汽朋克城市中打造机械装置，破解谜题'],
  ['暗影潜行', '🗡️', '在黑暗中潜行刺杀目标，不留任何痕迹'],
  ['龙骑士传说', '🐉', '驯服巨龙翱翔天际，守护王国免受黑暗侵袭'],
  ['像素英雄', '🟦', '在复古像素世界中冒险，击败魔王拯救公主'],
  ['太空站迷案', '👽', '在太空站中寻找内鬼，在所有人被杀死前找出真相'],
  ['赛车联盟', '🏁', '在世界各大赛道竞速，改装赛车赢得锦标赛'],
  ['牧场物语', '🐄', '经营家族牧场，种植作物养殖动物'],
  ['冰球风暴', '🏒', '在冰球赛场上激烈对抗，打入制胜一球'],
  ['排球快攻', '🏐', '在沙滩排球赛中扣杀得分，赢得阳光杯冠军'],
  ['棒球英豪', '⚾', '在本垒打大赛中挥出全垒打，成为棒球明星'],
  ['网球大满贯', '🎾', '在四大满贯赛场上挥拍，成为世界第一'],
  ['篮球风云', '🏀', '在街头篮球场上炫技过人，灌篮得分引爆全场'],
  ['足球传奇', '⚽', '带领球队征战世界杯，用华丽的脚法征服对手'],
  ['格斗天王', '🎮', '在格斗大赛中使出必杀技，击败所有挑战者'],
  ['海战风云', '🚢', '指挥战舰在海洋上炮击对轰，击沉敌方旗舰'],
  ['坦克战役', '🛡️', '驾驶坦克穿越火线，在战场上摧毁敌方阵地'],
  ['飞行中队', '✈️', '驾驶战斗机在空中缠斗，成为王牌飞行员'],
  ['潜艇猎手', '🛸', '驾驶潜艇在深海中猎杀敌方潜艇与舰队'],
  ['荒野枪神', '🤠', '在西部荒野上拔枪对决，赏金猎人的传奇生涯'],
  ['忍者传说', '🥷', '修炼忍术使用手里剑与太刀，成为最强忍者'],
  ['海盗王座', '🏴‍☠️', '组建海盗舰队劫掠商船，寻找传说中的宝藏'],
  ['角斗士', '🗡️', '在罗马竞技场上与猛兽和对手搏斗赢得自由'],
  ['维京远征', '🛶', '率领维京战士出海掠夺，建立你的北海帝国'],
  ['骑士荣耀', '🛡️', '身披重甲冲锋陷阵，在十字军东征中书写传奇'],
  ['埃及法老', '👑', '建造金字塔统治古埃及，抵御外敌入侵'],
  ['战国无双', '🎌', '在战国时代率领军队统一天下'],
  ['西部铁道', '🚂', '建造铁路网连接西部城镇，抵御劫匪袭击'],
  ['工业革命', '🏭', '在工业时代建造工厂发明机械，推动文明进步'],
  ['大航海家', '🌊', '在殖民时代探索新大陆，建立贸易帝国'],
  ['罗马帝国', '🏛️', '建造城市训练军团，征服整个地中海世界'],
  ['中世纪领主', '🏰', '建设城堡发展领地，抵御敌人围攻'],
  ['冰与火之歌', '❄️', '在奇幻大陆上争夺铁王座，谱写史诗传奇'],
  ['末日求生', '🧟', '在僵尸末日中搜集物资建立安全据点'],
  ['黑客入侵', '💻', '潜入网络系统破解防火墙，窃取机密数据'],
  ['特工行动', '🕵️', '执行秘密潜入任务，用高科技装备完成任务'],
  ['赏金猎人', '🤖', '在赛博朋克城市中追踪目标，领取赏金'],
  ['星际矿工', '⛏️', '在小行星带采矿，抵御太空海盗的袭击'],
  ['银河帝国', '👾', '建造星际舰队征服星系，建立银河帝国'],
  ['时空旅人', '⏳', '穿越不同时代修复历史，阻止时空崩溃'],
  ['地狱之门', '😈', '深入地狱消灭恶魔军团，关闭地狱之门'],
  ['天使之战', '👼', '指挥天使军团与堕落天使在天堂之战中对决'],
  ['秘境逃脱', '🌀', '被困在异次元空间，解开维度谜题逃离'],
];

const tagPool = ['冒险', '策略', '动作', '休闲', '科幻', '开放世界', '解谜', '推理', '养成', 'RPG', '音乐', '像素风', '模拟', '竞技', '体育', '角色扮演', '射击', '格斗', '生存', '经营', '恐怖'];

const gameSubCats = ['独立游戏', '单机大作', 'H5', '网络游戏'];

const games = gameNames.map(([title, emoji, desc], i) => {
  const tagCount = 1 + (i % 3);
  const tags = [];
  for (let t = 0; t < tagCount; t++) {
    const tagIdx = (i * 7 + t * 11) % tagPool.length;
    if (!tags.includes(tagPool[tagIdx])) tags.push(tagPool[tagIdx]);
  }
  return {
    id: i + 1,
    title,
    emoji,
    desc,
    tags,
    subCat: gameSubCats[i % 4],
    price: i % 4 === 3 ? '¥' + (12 + (i % 20) * 2) : '免费',
    free: i % 4 !== 3,
    discount: i % 4 === 3 && i % 8 === 3
  };
});

const upcomingGames = [
  { id: 991, title: '深渊回响 II', emoji: '🕳️', desc: '肉鸽地牢· procedurally generated dungeons，每次都是新冒险', tags: ['肉鸽', '地牢', 'AI生成', '副本'], subCat: '冒险', price: '即将上线', free: true, discount: false, upcoming: true, releaseDate: '2026-08-15', wishlisted: 1248 },
  { id: 992, title: '星际拓荒者', emoji: '🚀', desc: '开放宇宙沙盒·程序生成星球，AI 文明演化系统', tags: ['沙盒', '太空', '开放世界', 'AI'], subCat: '冒险', price: '即将上线', free: false, discount: false, upcoming: true, releaseDate: '2026-09-01', wishlisted: 2156 },
  { id: 993, title: '剑与灵·序章', emoji: '⚔️', desc: '日式RPG·AI 动态剧情，每个 NPC 都有自己的故事', tags: ['RPG', '日系', '剧情', 'AI剧情'], subCat: '角色扮演', price: '即将上线', free: false, discount: false, upcoming: true, releaseDate: '2026-09-20', wishlisted: 3471 },
  { id: 994, title: '霓虹赛车', emoji: '🏎️', desc: '赛博朋克竞速·AI 生成赛道，永不重复的霓虹都市', tags: ['竞速', '赛博朋克', 'AI生成', '街机'], subCat: '休闲', price: '即将上线', free: true, discount: false, upcoming: true, releaseDate: '2026-10-05', wishlisted: 892 },
  { id: 995, title: '三国·群英谋略', emoji: '🏯', desc: '策略战棋·AI 对手学习你的战术并进化', tags: ['策略', '战棋', '三国', 'AI对手'], subCat: '策略', price: '即将上线', free: false, discount: false, upcoming: true, releaseDate: '2026-10-18', wishlisted: 1683 },
  { id: 996, title: '迷雾庄园', emoji: '🏚️', desc: '推理解谜·AI 生成的悬疑剧本与线索', tags: ['解谜', '推理', '悬疑', 'AI剧本'], subCat: '解谜', price: '即将上线', free: true, discount: false, upcoming: true, releaseDate: '2026-11-02', wishlisted: 745 },
  { id: 997, title: '萌宠咖啡馆', emoji: '☕', desc: '模拟经营·AI 生成萌宠客人，治愈系日常', tags: ['模拟', '治愈', '萌系', '经营'], subCat: '休闲', price: '即将上线', free: true, discount: false, upcoming: true, releaseDate: '2026-11-15', wishlisted: 2034 },
  { id: 998, title: '末日方舟·重启', emoji: '☢️', desc: '生存沙盒·AI 驱动的丧尸群体智能行为', tags: ['生存', '丧尸', '沙盒', 'AI'], subCat: '冒险', price: '即将上线', free: false, discount: false, upcoming: true, releaseDate: '2026-12-01', wishlisted: 4287 },
];

const communityData = [
  { id: 1, title: '星海少女', emoji: '🌌', desc: '夜空中的少女，用星辰编织的裙摆', tags: ['二次元', '日系', '星空', '少女'], cat: '插画', catIndex: 1, subCat: '二次元', author: '星绘', likes: '328', comments: '24', price: '免费', free: true, discount: false, fileData: 'https://picsum.photos/seed/starsky/600/750' },
  { id: 2, title: '古风·临安一梦', emoji: '🏮', desc: '宋韵古风，临安城的灯火阑珊', tags: ['国风', '古风', '宫廷', '夜景'], cat: '插画', catIndex: 1, subCat: '国风', author: '青砚', likes: '512', comments: '38', price: '免费', free: true, discount: false, fileData: 'https://picsum.photos/seed/linan/600/800' },
  { id: 3, title: '机甲·破晓', emoji: '🤖', desc: '黎明中崛起的钢铁巨兽，赛博朋克风', tags: ['二次元', '机甲', '赛博朋克', '科幻'], cat: '插画', catIndex: 1, subCat: '二次元', author: 'IronForge', likes: '247', comments: '12', price: '免费', free: true, discount: false, fileData: 'https://picsum.photos/seed/mecha/600/720' },
  { id: 4, title: '萌系·茶会时光', emoji: '🍵', desc: '下午茶时光的少女们，治愈系日常', tags: ['二次元', '萌系', '治愈', '日常'], cat: '插画', catIndex: 1, subCat: '二次元', author: '小满', likes: '189', comments: '9', price: '免费', free: true, discount: false, fileData: 'https://picsum.photos/seed/teaparty/600/680' },
  { id: 5, title: '写实·雪山之巅', emoji: '🏔️', desc: 'CG概念设计，黎明时分的雪山顶', tags: ['写实', 'CG原画', '场景', '风景'], cat: '插画', catIndex: 1, subCat: '写实', author: '远景', likes: '421', comments: '21', price: '免费', free: true, discount: false, fileData: 'https://picsum.photos/seed/snowpeak/600/780' },
  { id: 6, title: 'Q版·喵星人日记', emoji: '🐱', desc: '一群Q版小猫的日常，可爱风头像系列', tags: ['Q版', '卡通', '可爱风', '头像'], cat: '插画', catIndex: 1, subCat: 'Q版', author: '喵绘', likes: '156', comments: '7', price: '免费', free: true, discount: false, fileData: 'https://picsum.photos/seed/meowstar/600/600' },
  { id: 7, title: '敦煌·飞天', emoji: '🪷', desc: '敦煌飞天壁画风格，彩绘长卷', tags: ['国风', '敦煌', '传统', '飞天'], cat: '插画', catIndex: 1, subCat: '国风', author: '墨色', likes: '678', comments: '45', price: '免费', free: true, discount: false, fileData: 'https://picsum.photos/seed/dunhuang/600/900' },
  { id: 8, title: '赛璐璐·樱雨', emoji: '🌸', desc: '樱花雨中的少女，赛璐璐上色练习', tags: ['二次元', '赛璐璐', '日系', '樱花'], cat: '插画', catIndex: 1, subCat: '二次元', author: '樱川', likes: '293', comments: '15', price: '免费', free: true, discount: false, fileData: 'https://picsum.photos/seed/sakura/600/740' },

  // ── 素材商店·商用2D素材 ──
  { id: 101, title: '砖墙PBR纹理包', emoji: '🧱', desc: '高清PBR砖墙纹理，含法线/粗糙度贴图，可商用', tags: ['2d', '纹理', 'PBR', '砖墙', '可商用'], cat: '游戏素材', catIndex: 2, subCat: '纹理', author: 'TextureLab', likes: '87', comments: '6', price: '¥12', free: false, discount: false, fileData: null },
  { id: 102, title: '全息Shader', emoji: '✨', desc: '赛博朋克风全息投影Shader，支持URP，可商用', tags: ['2d', 'Shader', '全息', '特效', '可商用'], cat: '游戏素材', catIndex: 2, subCat: 'Shader', author: 'ShaderForge', likes: '134', comments: '11', price: '免费', free: true, discount: false, fileData: null },
  { id: 103, title: '火焰粒子特效', emoji: '🔥', desc: '高品质火焰粒子系统，含烟雾与余烬，可商用', tags: ['2d', '粒子', '火焰', '特效', '可商用'], cat: '游戏素材', catIndex: 2, subCat: '粒子', author: 'FXStudio', likes: '56', comments: '3', price: '¥18', free: false, discount: true, fileData: null },
  { id: 104, title: '科幻UI套件', emoji: '🖥️', desc: '未来科幻风UI素材包，含按钮/面板/图标，可商用', tags: ['2d', 'UI素材', '科幻', '界面', '可商用'], cat: '游戏素材', catIndex: 2, subCat: 'UI素材', author: 'UIKraft', likes: '92', comments: '7', price: '¥25', free: false, discount: false, fileData: null },
  { id: 105, title: '法师精灵图', emoji: '🧙', desc: '法师角色四方向行走精灵图，32帧动画，可商用', tags: ['2d', '精灵图', '角色', '法师', '可商用'], cat: '游戏素材', catIndex: 2, subCat: '精灵图', author: 'PixelArt', likes: '71', comments: '4', price: '免费', free: true, discount: false, fileData: null },

  // ── 素材商店·商用3D素材 ──
  { id: 106, title: '低模骑士角色', emoji: '⚔️', desc: '低多边形骑士角色模型，含5种装备变体，可商用', tags: ['3d', '角色', '低模', '骑士', '可商用'], cat: '游戏素材', catIndex: 2, subCat: '角色', author: 'PolyForge', likes: '145', comments: '13', price: '¥35', free: false, discount: false, fileData: null },
  { id: 107, title: '奇幻森林场景', emoji: '🌲', desc: '风格化森林场景包，含树木/岩石/草丛，可商用', tags: ['3d', '场景', '森林', '奇幻', '可商用'], cat: '游戏素材', catIndex: 2, subCat: '场景', author: 'SceneCraft', likes: '98', comments: '8', price: '¥48', free: false, discount: true, fileData: null },
  { id: 108, title: '武器道具包', emoji: '🗡️', desc: '20种冷兵器3D模型，含剑/斧/锤/弓，可商用', tags: ['3d', '道具', '武器', 'pack', '可商用'], cat: '游戏素材', catIndex: 2, subCat: '道具', author: 'PropMaster', likes: '67', comments: '5', price: '¥22', free: false, discount: false, fileData: null },
  { id: 109, title: '中世纪建筑包', emoji: '🏰', desc: '中世纪欧式建筑模型集，含房屋/教堂/塔楼，可商用', tags: ['3d', '建筑', '中世纪', '房屋', '可商用'], cat: '游戏素材', catIndex: 2, subCat: '建筑', author: 'BuildWorks', likes: '113', comments: '9', price: '¥55', free: false, discount: false, fileData: null },
  { id: 110, title: '跑步动画集', emoji: '🏃', desc: '通用角色跑步动画集，含5种风格，可商用', tags: ['3d', '动画', '跑步', '动作', '可商用'], cat: '游戏素材', catIndex: 2, subCat: '动画', author: 'AnimStudio', likes: '84', comments: '6', price: '免费', free: true, discount: false, fileData: null },

  // ── 素材商店·商用音效 ──
  { id: 111, title: '史诗战斗BGM', emoji: '🎵', desc: '管弦乐史诗战斗BGM，含3段变奏，可商用', tags: ['音效', 'BGM', '史诗', '战斗', '可商用'], cat: '游戏素材', catIndex: 2, subCat: 'BGM', author: 'AudioForge', likes: '156', comments: '12', price: '¥30', free: false, discount: false, fileData: null },
  { id: 112, title: 'UI点击音效包', emoji: '🖱️', desc: '50种UI交互音效，含点击/悬停/确认，可商用', tags: ['音效', '音效素材', 'UI', '点击', '可商用'], cat: '游戏素材', catIndex: 2, subCat: '音效素材', author: 'SoundFX', likes: '73', comments: '5', price: '¥15', free: false, discount: true, fileData: null },
  { id: 113, title: '女声配音包', emoji: '🎤', desc: '日系女声配音合集，含200+语音，可商用', tags: ['音效', '人声', '女声', '配音', '可商用'], cat: '游戏素材', catIndex: 2, subCat: '人声', author: 'VoiceLab', likes: '128', comments: '14', price: '¥40', free: false, discount: false, fileData: null },
  { id: 114, title: '雨夜环境音', emoji: '🌧️', desc: '高品质雨夜环境音，含雷声/雨声/风声，可商用', tags: ['音效', '环境音', '雨夜', '氛围', '可商用'], cat: '游戏素材', catIndex: 2, subCat: '环境音', author: 'AmbiencePro', likes: '89', comments: '7', price: '免费', free: true, discount: false, fileData: null },
  { id: 115, title: '武器打击音效', emoji: '💥', desc: '冷兵器打击音效合集，金属碰撞/挥砍，可商用', tags: ['音效', '音效素材', '武器', '打击', '可商用'], cat: '游戏素材', catIndex: 2, subCat: '音效素材', author: 'CombatSound', likes: '64', comments: '4', price: '¥20', free: false, discount: false, fileData: null },
];


const colors = ['#2d2d5e', '#1a1a3e', '#302b63', '#24243e', '#1b2838', '#16213e', '#0f3460', '#533483'];

function getRandomColor() {
  return colors[Math.floor(Math.random() * colors.length)];
}

function createGameCard(item) {
  const tags = item.tags.map(tag => `<span class="game-card-tag">${tag}</span>`).join('');

  // 价格角标（左上角）
  let priceBadge;
  if (item.owned) {
    priceBadge = `<span class="card-price-badge owned">已拥有</span>`;
  } else if (item.free) {
    priceBadge = `<span class="card-price-badge free">免费</span>`;
  } else {
    // 解析价格数值
    const priceNum = parseInt(String(item.price).replace(/[^\d]/g, ''), 10) || 0;
    if (item.discount) {
      // 折扣价 = 原价 7 折
      const discountNum = Math.max(1, Math.round(priceNum * 0.7));
      priceBadge = `<span class="card-price-badge discount"><span class="price-original">¥${priceNum}</span>¥${discountNum}</span>`;
    } else {
      priceBadge = `<span class="card-price-badge paid">¥${priceNum}</span>`;
    }
  }

  if (activeNav === 'community') {
    if (item.cat === '动漫') {
      const catName = item.subCat || '全部';
      return `
        <div class="game-card bili-card" data-id="${item.id}">
          <div class="card-badges-left">${priceBadge}</div>
          <div class="bili-cover">
            <div class="bili-cover-emoji">${item.emoji}</div>
          </div>
          <div class="bili-info">
            <div class="bili-title">${item.title}</div>
            <div class="bili-meta-row">
              <span class="bili-author">${item.author}</span>
              <span class="bili-cat">${catName}</span>
              <div class="bili-tags">${tags}</div>
            </div>
            <div class="bili-desc">${item.desc}</div>
          </div>
        </div>
      `;
    }
    if (item.cat === '插画') {
      const catName = item.subCat || '全部';
      const imgHtml = item.fileData
        ? `<div style="width:100%;height:280px;overflow:hidden;border-radius:14px;border:1px solid rgba(255,255,255,0.1)"><img src="${item.fileData}" style="width:100%;height:100%;object-fit:cover"></div>`
        : `<div style="width:100%;height:280px;display:flex;align-items:center;justify-content:center;font-size:72px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:14px">${item.emoji}</div>`;
      return `
        <div class="game-card art-card" data-id="${item.id}" style="height:auto;padding:0;overflow:hidden">
          ${imgHtml}
          <div style="padding:10px 8px 8px">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
              <span style="color:#b8b8e0;font-weight:600;font-size:13px">${item.author}</span>
              <span style="color:#66c0f4;font-size:11px">${catName}</span>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:4px">${tags}</div>
            <div style="font-size:12px;color:#888;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${item.desc}</div>
          </div>
        </div>
      `;
    }
    return `
      <div class="game-card" data-id="${item.id}">
        <div class="card-badges-left">${priceBadge}</div>
        <div class="game-card-icon">${item.emoji}</div>
        <div class="game-card-meta">
          <span class="game-card-author">${item.author}</span>
          <div class="game-card-tags">${tags}</div>
          <div class="game-card-stats">
            <span class="card-stat">👍 ${item.likes}</span>
            <span class="card-stat">💬 ${item.comments}</span>
          </div>
        </div>
      </div>
    `;
  }
  // 库页面：带分类管理按钮 + H5 角标
  if (activeNav === 'library') {
    const gameCats = getGameCategoryNames(item.id);
    const catBadges = gameCats.map(n => `<span class="lib-cat-chip">${n}</span>`).join('');
    const libH5Badge = item.subCat === 'H5'
      ? `<span class="card-type-badge h5">H5</span>`
      : '';
    return `
      <div class="game-card lib-card" data-id="${item.id}">
        <div class="card-badges-left">${priceBadge}${libH5Badge}</div>
        <button class="lib-cat-btn" title="分类管理">＋分类</button>
        <div class="game-card-icon">${item.emoji}</div>
        <div class="game-card-title">${item.title}</div>
        <div class="game-card-desc">${item.desc}</div>
        <div class="game-card-tags">${tags}</div>
        ${catBadges ? `<div class="lib-cat-chips">${catBadges}</div>` : ''}
      </div>
    `;
  }
  // 商店：H5 标签放左上角价格后面
  const h5Badge = item.subCat === 'H5'
    ? `<span class="card-type-badge h5">H5</span>`
    : '';
  // 即将上线角标
  if (item.upcoming) {
    const upcomingPriceBadge = `<span class="card-price-badge upcoming">即将上线</span>`;
    const wishlistHtml = item.wishlisted ? `<div class="card-wishlist">心愿单 ${item.wishlisted}</div>` : '';
    const releaseHtml = item.releaseDate ? `<div class="card-release-date">📅 ${item.releaseDate}</div>` : '';
    return `
      <div class="game-card upcoming-card" data-id="${item.id}">
        <div class="card-badges-left">${upcomingPriceBadge}</div>
        <div class="game-card-icon">${item.emoji}</div>
        <div class="game-card-title">${item.title}</div>
        <div class="game-card-desc">${item.desc}</div>
        <div class="game-card-tags">${tags}</div>
        ${releaseHtml}
        ${wishlistHtml}
        <button class="wishlist-btn" data-id="${item.id}">+ 加入心愿单</button>
      </div>
    `;
  }
  return `
    <div class="game-card" data-id="${item.id}">
      <div class="card-badges-left">${priceBadge}${h5Badge}</div>
      <div class="game-card-icon">${item.emoji}</div>
      <div class="game-card-title">${item.title}</div>
      <div class="game-card-desc">${item.desc}</div>
      <div class="game-card-tags">${tags}</div>
    </div>
  `;
}

const PAGE_SIZE = 100;
let currentPage = 0;
let filteredGames = null;

function getContentData() {
  if (activeNav === 'library') return getLibraryData();
  if (activeNav === 'store') return [...games, ...upcomingGames];
  return communityData;
}

/* ── 骨骼动作侧边栏（仅3D骨骼绑定页面显示）── */
let currentWorkflow = null; // null | 'bone' | 'audio' | 'texture' | 'effect'

function renderBoneActionsSidebar() {
  const body = document.getElementById('activityBoxBody');
  if (!body) return;
  const header = document.querySelector('.activity-box-title');
  if (header) header.textContent = '骨骼动作';

  const categories = [
    {
      name: '基础动作',
      items: [
        { icon: '🧍', label: '待机 Idle' },
        { icon: '🚶', label: '行走 Walk' },
        { icon: '🏃', label: '奔跑 Run' },
        { icon: '🧎', label: '蹲下 Crouch' },
      ]
    },
    {
      name: '战斗动作',
      items: [
        { icon: '⚔️', label: '挥剑 Attack' },
        { icon: '🛡️', label: '格挡 Block' },
        { icon: '💨', label: '闪避 Dodge' },
        { icon: '💀', label: '受击 Hit' },
      ]
    },
    {
      name: '交互动作',
      items: [
        { icon: '🪑', label: '坐下 Sit' },
        { icon: '🚪', label: '开门 Open Door' },
        { icon: '📦', label: '拾取 Pick Up' },
        { icon: '🎣', label: '钓鱼 Fish' },
      ]
    },
    {
      name: '特效动作',
      items: [
        { icon: '✨', label: '施法 Cast' },
        { icon: '🪽', label: '飞行 Fly' },
        { icon: '🌀', label: '旋转 Spin' },
        { icon: '⬇️', label: '坠落 Fall' },
      ]
    }
  ];

  body.innerHTML = categories.map(cat => `
    <div class="bone-cat">
      <div class="bone-cat-title">${cat.name}</div>
      <div class="bone-cat-items">
        ${cat.items.map(item => `
          <div class="bone-item" data-action="${item.label}">
            <span class="bone-item-icon">${item.icon}</span>
            <span class="bone-item-label">${item.label}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');

  // 骨骼动作卡片点击 → 打开对应的骨骼动作详情面板
  body.querySelectorAll('.bone-item').forEach(item => {
    item.addEventListener('click', function() {
      openBoneActionDetail(this.dataset.action, this.querySelector('.bone-item-icon').textContent);
    });
  });
}

function openBoneActionDetail(actionLabel, actionIcon) {
  const grid = document.getElementById('gameGrid');
  if (!grid) return;
  grid.className = 'game-grid';

  // 模拟骨骼数据
  const boneNames = ['Hips', 'Spine', 'Chest', 'Neck', 'Head', 'LeftUpperArm', 'LeftLowerArm', 'LeftHand', 'RightUpperArm', 'RightLowerArm', 'RightHand', 'LeftUpperLeg', 'LeftLowerLeg', 'LeftFoot', 'RightUpperLeg', 'RightLowerLeg', 'RightFoot'];
  const boneListHtml = boneNames.map((name, i) => `
    <div class="bone-detail-item">
      <span class="bone-detail-idx">${i + 1}</span>
      <span class="bone-detail-name">${name}</span>
      <div class="bone-detail-bar"><div class="bone-detail-bar-fill" style="width:${30 + Math.random() * 70}%"></div></div>
    </div>
  `).join('');

  grid.innerHTML = `
    <div class="workflow-top-bar">
      <button class="workflow-back" id="boneActionBack">← 返回骨骼动作</button>
      <div class="workflow-top-action">
        <span class="workflow-top-icon">${actionIcon}</span>
        <span class="workflow-top-label">${actionLabel}</span>
      </div>
    </div>
    <div class="bone-action-panel">
      <div class="bone-action-header">
        <div class="bone-action-icon">${actionIcon}</div>
        <div class="bone-action-info">
          <div class="bone-action-title">${actionLabel}</div>
          <div class="bone-action-sub">骨骼绑定 · ${boneNames.length} 根骨骼</div>
        </div>
      </div>
      <div class="bone-action-body">
        <div class="bone-section">
          <div class="bone-section-title">骨骼权重分布</div>
          <div class="bone-detail-list">${boneListHtml}</div>
        </div>
        <div class="bone-section">
          <div class="bone-section-title">动画参数</div>
          <div class="bone-params">
            <div class="bone-param-row">
              <span class="bone-param-label">帧率</span>
              <span class="bone-param-value">30 FPS</span>
            </div>
            <div class="bone-param-row">
              <span class="bone-param-label">总帧数</span>
              <span class="bone-param-value">60 帧</span>
            </div>
            <div class="bone-param-row">
              <span class="bone-param-label">循环</span>
              <span class="bone-param-value">是</span>
            </div>
            <div class="bone-param-row">
              <span class="bone-param-label">缓动</span>
              <span class="bone-param-value">EaseInOut</span>
            </div>
          </div>
        </div>
      </div>
      <div class="bone-action-footer">
        <button class="bone-action-btn secondary" id="boneActionExport">导出动画</button>
        <button class="bone-action-btn primary" id="boneActionPreview">预览动画</button>
      </div>
    </div>
  `;

  document.getElementById('boneActionBack')?.addEventListener('click', function() {
    openWorkflow('bone');
  });
  document.getElementById('boneActionPreview')?.addEventListener('click', function() {
    this.textContent = '预览中...';
    setTimeout(() => { this.textContent = '预览动画'; alert(`▶ 正在预览「${actionLabel}」动画...（模拟）`); }, 1000);
  });
  document.getElementById('boneActionExport')?.addEventListener('click', function() {
    alert(`已导出「${actionLabel}」动画数据（模拟）`);
  });
}

function renderActivityBox() {
  const body = document.getElementById('activityBoxBody');
  if (!body) return;
  const header = document.querySelector('.activity-box-title');
  // 游戏素材页：显示开发工具下载
  if (activeNav === 'community' && activeMain === 2) {
    renderDevToolsBox();
    return;
  }
  // 其它页面：恢复"游戏活动"标题
  if (header) header.textContent = '游戏活动';
  const activities = [
    { icon: '🔥', title: '夏日狂欢节', desc: '全场游戏7折起', tag: 'hot', tagText: '热门' },
    { icon: '🏆', title: 'Trae创造比赛', desc: '赢取百万奖金池', tag: 'event', tagText: '赛事' },
    { icon: '🆕', title: '社区创作激励', desc: '优质内容现金奖励', tag: 'new', tagText: '新' },
    { icon: '🎮', title: 'H5游戏马拉松', desc: '48小时极限开发', tag: 'event', tagText: '活动' },
    { icon: '💎', title: '充值送积分', desc: '充100送20000积分', tag: 'hot', tagText: '热门' },
    { icon: '🎁', title: '每日签到奖励', desc: '连续签到送稀有道具', tag: 'new', tagText: '新' },
  ];
  body.innerHTML = activities.map(a => `
    <div class="activity-item">
      <div class="activity-item-icon">${a.icon}</div>
      <div class="activity-item-info">
        <div class="activity-item-title">${a.title}</div>
        <div class="activity-item-desc">${a.desc}</div>
      </div>
      <span class="activity-item-tag ${a.tag}">${a.tagText}</span>
    </div>
  `).join('');
}

// 开发工具下载链接（游戏素材页左侧栏）
function renderDevToolsBox() {
  const body = document.getElementById('activityBoxBody');
  if (!body) return;
  const header = document.querySelector('.activity-box-title');
  if (header) header.textContent = '开发工具';
  const tools = [
    { icon: '🎯', name: 'Godot Engine', desc: '开源免费 · 跨平台引擎', url: 'https://godotengine.org/download' },
    { icon: '🟢', name: 'Unity', desc: '行业标准 · 个人免费', url: 'https://unity.com/download' },
    { icon: '🅰', name: 'Unreal Engine', desc: '次世代图形 · 免费使用', url: 'https://www.unrealengine.com/download' },
    { icon: '🔥', name: 'Cocos Creator', desc: '国产引擎 · H5首选', url: 'https://www.cocos.com/creator-download' },
    { icon: '🧩', name: 'Construct 3', desc: '无需编程 · 浏览器开发', url: 'https://www.construct.net/en/make-games/construct-3' },
    { icon: '⚡', name: 'Phaser', desc: 'JS框架 · H5游戏库', url: 'https://phaser.io/download' },
    { icon: '🛠️', name: 'LayaAir', desc: '国产引擎 · 3D支持', url: 'https://layaair.layabox.com/' },
    { icon: '💻', name: 'VS Code', desc: '代码编辑器 · 开源免费', url: 'https://code.visualstudio.com/' },
    { icon: '🧠', name: 'Cursor', desc: 'AI编程 · 智能补全', url: 'https://cursor.com/' },
    { icon: '✨', name: 'Trae', desc: 'AI IDE · 国内免费', url: 'https://www.trae.cn/' },
    { icon: '🚀', name: 'JetBrains Rider', desc: 'Unity专用 · 付费', url: 'https://www.jetbrains.com/rider/' },
    { icon: '📘', name: 'GitHub', desc: '代码托管 · 协作', url: 'https://github.com/' },
  ];
  body.innerHTML = tools.map(t => `
    <a class="dev-tool-item" href="${t.url}" target="_blank" rel="noopener noreferrer">
      <div class="dev-tool-icon">${t.icon}</div>
      <div class="dev-tool-info">
        <div class="dev-tool-name">${t.name}</div>
        <div class="dev-tool-desc">${t.desc}</div>
      </div>
      <span class="dev-tool-arrow">↗</span>
    </a>
  `).join('');
}

function renderGames() {
  const grid = document.getElementById('gameGrid');
  const pg = document.getElementById('pagination');
  if (!grid) return;

  // 切换页面前清掉公告页/瀑布流残留样式与类
  grid.style.height = '';
  grid.classList.remove('notice-list-container');
  grid.classList.add('game-grid');

  const cats = getPageCategories();
  const mainCatName = cats[0]?.name || '';
  const isBiliLayout = false;
  const isArtLayout = activeNav === 'community' && mainCatName === '插画';
  const searchQuery = document.querySelector('.search-input')?.value.trim().toLowerCase();
  const isFeedLayout = activeNav === 'community' && mainCatName === '游戏' && !searchQuery && !activePrice;

  grid.classList.toggle('community-grid', activeNav === 'community' && !isBiliLayout && !isArtLayout && !isFeedLayout);
  grid.classList.toggle('bili-layout', isBiliLayout);
  grid.classList.toggle('art-masonry', isArtLayout);
  grid.classList.toggle('tieba-feed', isFeedLayout);

  const displayList = filteredGames || getContentData();
  const totalPages = Math.ceil(displayList.length / PAGE_SIZE);

  if (currentPage >= totalPages) currentPage = 0;

  const start = currentPage * PAGE_SIZE;
  const pageGames = displayList.slice(start, start + PAGE_SIZE);

  if (isBiliLayout) {
    grid.innerHTML = pageGames.length
      ? `<div class="bili-grid">${pageGames.map(item => createGameCard(item)).join('')}</div>`
      : '<div class="community-empty">暂无游戏帖子，点击「发帖」发布第一条吧</div>';
  } else if (isArtLayout) {
    // 插画tab：直接从communityData读取，不走filteredGames
    const artItems = communityData.filter(g => g.cat === '插画');
    grid.innerHTML = artItems.length
      ? artItems.map(item => createGameCard(item)).join('')
      : '<div class="community-empty">暂无插画作品，点击「发帖」发布第一幅吧</div>';
  } else if (isFeedLayout) {
    // 游戏tab：直接用gamePostData渲染帖子流
    const posts = gamePostData;
    if (posts.length === 0) {
      grid.innerHTML = '<div class="feed-empty">暂无帖子，点击「发帖」发布第一条吧</div>';
    } else {
      grid.innerHTML = posts.map((post, i) => {
        const game = games[post.gameIdx] || games[0];
        const fileHtml = post.fileData
          ? (post.fileType === 'video'
            ? '<div class="feed-post-file"><video src="' + post.fileData + '" controls muted style="width:100%;max-height:400px;border-radius:8px"></video></div>'
            : '<div class="feed-post-file"><img src="' + post.fileData + '" style="width:100%;max-height:400px;object-fit:cover;border-radius:8px"></div>')
          : '';
        return '<div class="feed-post game-card" data-post="' + i + '">' +
          '<div class="feed-post-forum" data-game-idx="' + games.indexOf(game) + '">' + game.emoji + ' ' + game.title + '</div>' +
          '<div class="feed-post-user">' +
            '<div class="feed-post-avatar">' + post.avatar + '</div>' +
            '<div class="feed-post-user-info">' +
              '<span class="feed-post-author">' + post.author + '</span>' +
              '<span class="feed-post-time">' + post.time + '</span>' +
            '</div>' +
            '<span class="feed-post-title-inline">' + post.title + '</span>' +
          '</div>' +
          '<div class="feed-post-content" data-expandable>' + post.content + '</div>' +
          '<span class="feed-post-expand" style="display:none" data-expand>展开全部</span>' +
          fileHtml +
          '<div class="feed-post-footer">' +
            '<span class="feed-post-stat">💬 ' + post.replies + '</span>' +
            '<span class="feed-post-stat">👁 ' + post.views + '</span>' +
          '</div>' +
        '</div>';
      }).join('');
    }
  } else {
    grid.innerHTML = pageGames.map(createGameCard).join('');
  }

  grid.querySelectorAll('.game-card').forEach(card => {
    card.addEventListener('click', function(e) {
      // 心愿单按钮独立处理
      const wlBtn = e.target.closest('.wishlist-btn');
      if (wlBtn) {
        e.stopPropagation();
        if (wlBtn.classList.contains('added')) return;
        wlBtn.classList.add('added');
        wlBtn.textContent = '✓ 已加入心愿单';
        // 更新心愿单计数
        const cardEl = wlBtn.closest('.upcoming-card');
        if (cardEl) {
          const wlEl = cardEl.querySelector('.card-wishlist');
          if (wlEl) {
            const m = wlEl.textContent.match(/心愿单\s*(\d+)/);
            if (m) wlEl.textContent = `心愿单 ${parseInt(m[1]) + 1}`;
          }
        }
        return;
      }
      if (e.target.closest('.lib-cat-btn') || e.target.closest('.feed-post-follow') || e.target.closest('.feed-post-action') || e.target.closest('.feed-post-forum')) return;
      // 首页帖子：打开帖子详情
      const postIdx = this.dataset.post;
      if (postIdx !== undefined) {
        openPostDetail(parseInt(postIdx));
        return;
      }
      const id = this.dataset.id;
      const all = getContentData();
      const item = all.find(g => g.id == id);
      if (!item) return;
      // 社区内容：按类型打开专属详情页
      if (activeNav === 'community') {
        if (item.cat === '插画') { openArtworkViewer(item, all); return; }
      }
      openGameDetail(item);
    });
  });

  // 内容展开/收起
  grid.querySelectorAll('.feed-post-content[data-expandable]').forEach(el => {
    const expandBtn = el.nextElementSibling;
    if (!expandBtn || !expandBtn.hasAttribute('data-expand')) return;
    // 检测是否被截断
    setTimeout(() => {
      if (el.scrollHeight > el.clientHeight + 2) {
        expandBtn.style.display = '';
      }
    }, 0);
    expandBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      const expanded = el.classList.toggle('expanded');
      this.textContent = expanded ? '收起' : '展开全部';
    });
    el.addEventListener('click', function(e) {
      e.stopPropagation();
      const expanded = el.classList.toggle('expanded');
      expandBtn.textContent = expanded ? '收起' : '展开全部';
    });
  });

  // 全部页面：分区"查看更多"点击 → 展开/收起分类筛选（已移至顶部筛选框）

  // 库卡片：分类管理按钮
  if (activeNav === 'library') {
    grid.querySelectorAll('.lib-cat-btn').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const card = this.closest('.lib-card');
        const gameId = Number(card.dataset.id);
        openCategoryDialog(gameId, card);
      });
    });
  }

  if (!pg) return;
  // 全部页面多分区布局时不分页
  if (isFeedLayout) { pg.innerHTML = ''; return; }
  pg.innerHTML = Array.from({ length: totalPages }, (_, i) =>
    `<button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i + 1}</button>`
  ).join('');

  pg.querySelectorAll('.page-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      currentPage = parseInt(this.dataset.page);
      renderGames();
    });
  });
}

/* ── Hero Carousel Auto-play ── */
let heroIndex = 0;
let heroTimer = null;

function showHeroSlide(idx) {
  const slides = document.querySelectorAll('.hero-slide');
  const dots = document.querySelectorAll('.carousel-dot');
  slides.forEach(s => s.classList.remove('active'));
  dots.forEach(d => d.classList.remove('active'));
  slides[idx]?.classList.add('active');
  dots[idx]?.classList.add('active');
  heroIndex = idx;
}

function nextHeroSlide() {
  const slides = document.querySelectorAll('.hero-slide');
  if (!slides.length) return;
  showHeroSlide((heroIndex + 1) % slides.length);
}

function resetHeroTimer() {
  if (heroTimer) clearInterval(heroTimer);
  heroTimer = setInterval(nextHeroSlide, 4000);
}

document.querySelectorAll('.carousel-dot').forEach(dot => {
  dot.addEventListener('click', function() {
    showHeroSlide(parseInt(this.dataset.index));
    resetHeroTimer();
  });
});

resetHeroTimer();


function renderCommunitySidebar() {
  const sidebarBody = document.getElementById('sidebarBody');
  if (!sidebarBody) return;

  // 素材页：竖排按钮
  if (activeMain === 2) {
    sidebarBody.innerHTML = `
      <div class="sidebar-level">
        <div class="sidebar-level-label">素材功能</div>
        <div class="material-sidebar" id="materialSidebar"></div>
      </div>
    `;
    const matSidebar = document.getElementById('materialSidebar');
    if (matSidebar) {
      matSidebar.innerHTML = `
        <button class="material-sidebar-btn ${materialTab === 'store' ? 'active' : ''}" data-tab="store">📦 素材商店</button>
        <button class="material-sidebar-btn ${materialTab === 'create' ? 'active' : ''}" data-tab="create">🛠️ 素材制作</button>
        <button class="material-sidebar-btn ${materialTab === 'trade' ? 'active' : ''}" data-tab="trade">🤝 素材交易</button>
      `;
      matSidebar.querySelectorAll('.material-sidebar-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          materialTab = this.dataset.tab;
          if (materialTab === 'trade') materialTradeView = 'menu';
          matSidebar.querySelectorAll('.material-sidebar-btn').forEach(b => b.classList.remove('active'));
          this.classList.add('active');
          renderMaterialContent();
        });
      });
    }
    return;
  }

  const currentCat = categories[activeMain];
  const subs = currentCat ? currentCat.subs.filter(s => s.name !== '全部') : [];
  sidebarBody.innerHTML = `
    <div class="sidebar-level">
      <div class="sidebar-level-label">分类</div>
      <div class="sidebar-sub-row" id="sidebarSubRow"></div>
    </div>
    <div class="sidebar-level">
      <div class="sidebar-level-label">标签</div>
      <div class="sidebar-subsub-row" id="sidebarSubSubRow"></div>
    </div>
  `;
  const subRow = document.getElementById('sidebarSubRow');
  if (subRow && subs.length) {
    subRow.innerHTML = subs.map((sub, idx) =>
      `<button class="sidebar-sub-btn" data-index="${idx}">${sub.name}</button>`
    ).join('');
    subRow.querySelectorAll('.sidebar-sub-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const idx = parseInt(this.dataset.index);
        subRow.querySelectorAll('.sidebar-sub-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        const subSubRow = document.getElementById('sidebarSubSubRow');
        if (subSubRow) {
          const picked = subs[idx];
          if (picked && picked.subs) {
            const tags = picked.subs.filter(t => t !== '全部');
            subSubRow.innerHTML = tags.map((t, ti) =>
              `<button class="sidebar-subsub-btn" data-index="${ti}">${t}</button>`
            ).join('');
          } else {
            subSubRow.innerHTML = '';
          }
        }
      });
    });
    if (subs[0] && subs[0].subs) {
      const subSubRow = document.getElementById('sidebarSubSubRow');
      if (subSubRow) {
        const tags = subs[0].subs.filter(t => t !== '全部');
        subSubRow.innerHTML = tags.map((t, ti) =>
          `<button class="sidebar-subsub-btn" data-index="${ti}">${t}</button>`
        ).join('');
      }
    }
  }
}

function renderMaterialContent() {
  const grid = document.getElementById('gameGrid');
  const pg = document.getElementById('pagination');
  const matTypeTabs = document.getElementById('materialTypeTabs');
  if (!grid) return;
  if (materialTab === 'store') {
    if (matTypeTabs) matTypeTabs.style.display = 'flex';
    grid.className = 'game-grid art-masonry';
    let items = communityData.filter(g => g.cat === '游戏素材');
    if (materialType === '2d') {
      items = items.filter(g => g.subCat === '特效' || g.subCat === '字体' || g.tags.some(t => t.includes('2d') || t.includes('纹理') || t.includes('Shader')));
    } else if (materialType === '3d') {
      items = items.filter(g => g.subCat === '3D模型' || g.subCat === '角色' || g.subCat === '场景' || g.subCat === '道具' || g.subCat === '建筑' || g.tags.some(t => t.includes('3d') || t.includes('模型')));
    } else if (materialType === 'audio') {
      items = items.filter(g => g.subCat === '音效' || g.subCat === 'BGM' || g.subCat === '音效素材' || g.subCat === '人声' || g.tags.some(t => t.includes('音效') || t.includes('BGM')));
    }
    // 应用细分类筛选
    if (materialSubs.length > 0) {
      items = items.filter(g => materialSubs.some(s => g.subCat === s || g.tags.some(t => t.includes(s))));
    }
    grid.innerHTML = items.length
      ? items.map(item => createGameCard(item)).join('')
      : '<div class="community-empty">暂无素材，去「素材制作」上传吧</div>';
    if (pg) pg.innerHTML = '';
  } else if (materialTab === 'create') {
    if (matTypeTabs) matTypeTabs.style.display = 'none';
    grid.className = 'game-grid';
    grid.innerHTML = `
      <div class="material-create-panel">
        <div class="material-create-header">
          <h2>🛠️ 素材制作</h2>
          <p>上传和制作你的游戏素材</p>
        </div>
        <div class="material-create-options">
          <div class="material-create-card" data-workflow="bone">
            <span class="mat-create-icon">🧊</span>
            <span class="mat-create-title">3d角色绑定骨骼</span>
            <span class="mat-create-desc">支持 .fbx .glb .obj 格式</span>
          </div>
          <div class="material-create-card" data-workflow="audio">
            <span class="mat-create-icon">🔊</span>
            <span class="mat-create-title">音效生成</span>
            <span class="mat-create-desc">支持 .mp3 .wav .ogg 格式</span>
          </div>
          <div class="material-create-card" data-workflow="texture">
            <span class="mat-create-icon">🎨</span>
            <span class="mat-create-title">2d素材生成</span>
            <span class="mat-create-desc">在线生成 PBR 材质贴图</span>
          </div>
        </div>
      </div>
    `;
    if (pg) pg.innerHTML = '';
    // 素材制作卡片点击 → 打开工作流
    grid.querySelectorAll('.material-create-card[data-workflow]').forEach(card => {
      card.addEventListener('click', function() {
        openWorkflow(this.dataset.workflow);
      });
    });
  } else if (materialTab === 'trade') {
    // 素材交易
    if (matTypeTabs) matTypeTabs.style.display = 'none';
    grid.className = 'game-grid';
    if (materialTradeView === 'menu') {
      grid.innerHTML = `
        <div class="material-create-panel">
          <div class="material-create-header">
            <h2>🤝 素材交易</h2>
            <p>发布需求或接单赚钱，连接创作者与需求方</p>
          </div>
          <div class="material-create-options">
            <div class="material-create-card" data-trade="publish">
              <span class="mat-create-icon">📝</span>
              <span class="mat-create-title">发布请求</span>
              <span class="mat-create-desc">发布你的素材定制需求</span>
            </div>
            <div class="material-create-card" data-trade="orders">
              <span class="mat-create-icon">📋</span>
              <span class="mat-create-title">接单大厅</span>
              <span class="mat-create-desc">浏览需求并接单赚钱</span>
            </div>
          </div>
        </div>
      `;
      grid.querySelectorAll('.material-create-card[data-trade]').forEach(card => {
        card.addEventListener('click', function() {
          materialTradeView = this.dataset.trade;
          renderMaterialContent();
        });
      });
    } else if (materialTradeView === 'publish') {
      grid.innerHTML = `
        <div class="material-create-panel">
          <div class="material-create-header">
            <button class="workflow-back" id="tradePublishBack">← 返回素材交易</button>
            <h2>📝 发布请求</h2>
            <p>填写你的素材定制需求，等待创作者接单</p>
          </div>
          <div class="trade-form">
            <div class="trade-form-row">
              <label class="trade-form-label">需求标题</label>
              <input type="text" class="trade-form-input" id="tradeTitle" placeholder="例如：需要一套赛博朋克风UI素材" />
            </div>
            <div class="trade-form-row">
              <label class="trade-form-label">素材类型</label>
              <select class="trade-form-input" id="tradeType">
                <option value="2D素材">2D素材</option>
                <option value="3D素材">3D素材</option>
                <option value="音效">音效</option>
              </select>
            </div>
            <div class="trade-form-row">
              <label class="trade-form-label">预算（¥）</label>
              <input type="number" class="trade-form-input" id="tradeBudget" placeholder="例如：200" min="0" />
            </div>
            <div class="trade-form-row">
              <label class="trade-form-label">需求描述</label>
              <textarea class="trade-form-input trade-form-textarea" id="tradeDesc" rows="4" placeholder="详细描述你需要的素材规格、风格、格式等..."></textarea>
            </div>
            <button class="trade-submit-btn" id="tradePublishBtn">发布需求</button>
          </div>
        </div>
      `;
      document.getElementById('tradePublishBack')?.addEventListener('click', function() {
        materialTradeView = 'menu';
        renderMaterialContent();
      });
      document.getElementById('tradePublishBtn')?.addEventListener('click', function() {
        const title = document.getElementById('tradeTitle')?.value.trim();
        const type = document.getElementById('tradeType')?.value;
        const budget = document.getElementById('tradeBudget')?.value.trim();
        const desc = document.getElementById('tradeDesc')?.value.trim();
        if (!title) { alert('请填写需求标题'); return; }
        if (!desc) { alert('请填写需求描述'); return; }
        materialRequests.unshift({
          id: Date.now(),
          title, type,
          budget: budget ? '¥' + budget : '面议',
          desc, author: '我', avatar: '👤', time: '刚刚', status: 'open', offers: 0, offerList: [], mine: true
        });
        saveMaterialRequests();
        materialTradeView = 'orders';
        tradeFilter = 'mine';
        renderMaterialContent();
        alert('需求已发布！');
      });
    } else if (materialTradeView === 'orders') {
      // 按筛选过滤
      let filtered = materialRequests;
      if (tradeFilter === 'mine') filtered = materialRequests.filter(r => r.mine || (r.offerList || []).some(o => o.mine));
      else if (tradeFilter === 'taken') filtered = materialRequests.filter(r => r.status === 'taken');
      else if (tradeFilter === 'open') filtered = materialRequests.filter(r => r.status === 'open');
      const requestList = filtered.map(r => {
        const statusBadge = r.status === 'open'
          ? '<span class="trade-status open">接单中</span>'
          : '<span class="trade-status taken">已接单</span>';
        const myOffer = (r.offerList || []).find(o => o.mine);
        const offerListHtml = (r.offerList && r.offerList.length > 0)
          ? `<div class="trade-offer-list open">
              <div class="trade-offer-list-title">已收报价 (${r.offerList.length})</div>
              ${r.offerList.map(o => `
                <div class="trade-offer-item ${o.mine ? 'mine' : ''}">
                  <span class="trade-offer-item-avatar">${o.avatar}</span>
                  <span class="trade-offer-item-name">${o.user}${o.mine ? ' (我)' : ''}</span>
                  <span class="trade-offer-item-amount">${o.amount}</span>
                </div>
              `).join('')}
            </div>`
          : '';
        let actionHtml = '';
        if (r.status === 'open' && !r.mine) {
          if (myOffer) {
            actionHtml = `<button class="trade-take-btn taken" disabled>✓ 已报价 ${myOffer.amount}</button>`;
          } else {
            actionHtml = `
              <button class="trade-take-btn" data-id="${r.id}" data-action="open-offer">立即报价</button>
              <div class="trade-offer-form" data-id="${r.id}">
                <div class="trade-offer-row">
                  <input type="number" class="trade-offer-input" placeholder="报价金额 ¥" data-field="amount" />
                  <input type="text" class="trade-offer-input" placeholder="交付说明" data-field="note" />
                </div>
                <button class="trade-offer-submit" data-id="${r.id}" data-action="submit-offer">提交报价</button>
              </div>
            `;
          }
        } else if (r.status === 'taken') {
          actionHtml = `<button class="trade-take-btn taken" disabled>已接单</button>`;
        } else if (r.mine) {
          actionHtml = `<button class="trade-take-btn cancel" data-id="${r.id}" data-action="cancel-req">取消需求</button>`;
        }
        return `
          <div class="trade-request-card">
            <div class="trade-request-header">
              <span class="trade-request-avatar">${r.avatar}</span>
              <div class="trade-request-info">
                <div class="trade-request-title">${r.title}${r.mine ? ' <span style="color:#66c0f4;font-size:11px">[我发布的]</span>' : ''}</div>
                <div class="trade-request-meta">${r.author} · ${r.time}</div>
              </div>
              ${statusBadge}
            </div>
            <div class="trade-request-tags">
              <span class="trade-tag">${r.type}</span>
              <span class="trade-tag budget">预算 ${r.budget}</span>
              <span class="trade-tag">报价 ${r.offerList ? r.offerList.length : 0}</span>
            </div>
            <div class="trade-request-desc">${r.desc}</div>
            ${offerListHtml}
            ${actionHtml}
          </div>
        `;
      }).join('');
      grid.innerHTML = `
        <div class="material-create-panel">
          <div class="material-create-header">
            <button class="workflow-back" id="tradeOrdersBack">← 返回素材交易</button>
            <h2>📋 接单大厅</h2>
            <p>浏览素材定制需求，提交报价或管理你的需求</p>
          </div>
          <div class="trade-filter-tabs">
            <button class="trade-filter-tab ${tradeFilter === 'all' ? 'active' : ''}" data-filter="all">全部需求 (${materialRequests.length})</button>
            <button class="trade-filter-tab ${tradeFilter === 'open' ? 'active' : ''}" data-filter="open">接单中 (${materialRequests.filter(r => r.status === 'open').length})</button>
            <button class="trade-filter-tab ${tradeFilter === 'taken' ? 'active' : ''}" data-filter="taken">已接单 (${materialRequests.filter(r => r.status === 'taken').length})</button>
            <button class="trade-filter-tab ${tradeFilter === 'mine' ? 'active' : ''}" data-filter="mine">我的参与 (${materialRequests.filter(r => r.mine || (r.offerList || []).some(o => o.mine)).length})</button>
          </div>
          <div class="trade-request-list">${requestList || '<div class="community-empty">暂无需求</div>'}</div>
        </div>
      `;
      document.getElementById('tradeOrdersBack')?.addEventListener('click', function() {
        materialTradeView = 'menu';
        renderMaterialContent();
      });
      // 筛选 tab
      grid.querySelectorAll('.trade-filter-tab').forEach(tab => {
        tab.addEventListener('click', function() {
          tradeFilter = this.dataset.filter;
          renderMaterialContent();
        });
      });
      // 打开报价表单
      grid.querySelectorAll('.trade-take-btn[data-action="open-offer"]').forEach(btn => {
        btn.addEventListener('click', function() {
          const id = parseInt(this.dataset.id, 10);
          const form = grid.querySelector(`.trade-offer-form[data-id="${id}"]`);
          if (form) {
            form.classList.add('open');
            this.style.display = 'none';
          }
        });
      });
      // 提交报价
      grid.querySelectorAll('.trade-offer-submit[data-action="submit-offer"]').forEach(btn => {
        btn.addEventListener('click', function() {
          const id = parseInt(this.dataset.id, 10);
          const form = grid.querySelector(`.trade-offer-form[data-id="${id}"]`);
          if (!form) return;
          const amountInput = form.querySelector('[data-field="amount"]');
          const noteInput = form.querySelector('[data-field="note"]');
          const amount = amountInput?.value.trim();
          const note = noteInput?.value.trim();
          if (!amount) { alert('请填写报价金额'); return; }
          if (!note) { alert('请填写交付说明'); return; }
          const req = materialRequests.find(r => r.id === id);
          if (req) {
            if (!req.offerList) req.offerList = [];
            req.offerList.push({ user: '我', avatar: '👤', amount: '¥' + amount, note, mine: true });
            saveMaterialRequests();
            renderMaterialContent();
            alert('报价已提交！');
          }
        });
      });
      // 取消需求（仅本人）
      grid.querySelectorAll('.trade-take-btn[data-action="cancel-req"]').forEach(btn => {
        btn.addEventListener('click', function() {
          const id = parseInt(this.dataset.id, 10);
          if (!confirm('确认取消这条需求吗？')) return;
          const idx = materialRequests.findIndex(r => r.id === id);
          if (idx >= 0) {
            materialRequests.splice(idx, 1);
            saveMaterialRequests();
            renderMaterialContent();
          }
        });
      });
    }
    if (pg) pg.innerHTML = '';
  }
}

const workflowData = {
  bone: {
    title: '3d角色绑定骨骼',
    icon: '🧊',
    desc: '上传3D模型文件，自动绑定骨骼并生成动画',
    steps: [
      { label: '上传模型', desc: '支持 .fbx .glb .obj 格式', icon: '📁' },
      { label: '识别骨骼', desc: 'AI 自动识别模型骨骼结构', icon: '🦴' },
      { label: '绑定权重', desc: '自动计算顶点权重', icon: '⚙️' },
      { label: '生成动画', desc: '生成行走/跑步/攻击等基础动画', icon: '🎬' }
    ]
  },
  audio: {
    title: '音效生成',
    icon: '🔊',
    desc: '输入文字描述，AI 生成对应音效',
    steps: [
      { label: '输入描述', desc: '描述你需要的音效内容', icon: '✏️' },
      { label: '选择风格', desc: '科幻 / 自然 / 战斗 / UI 等', icon: '🎵' },
      { label: 'AI 生成', desc: '等待 AI 生成音效', icon: '🤖' },
      { label: '试听导出', desc: '预览并导出 .mp3 .wav 格式', icon: '💾' }
    ]
  },
  texture: {
    title: '2d素材生成',
    icon: '🎨',
    desc: '输入文字描述，AI 生成2D贴图素材',
    steps: [
      { label: '输入提示词', desc: '描述你需要的贴图内容', icon: '✏️' },
      { label: '选择尺寸', desc: '512x512 / 1024x1024 / 2048x2048', icon: '📐' },
      { label: 'AI 生成', desc: '等待 AI 生成贴图', icon: '🤖' },
      { label: '下载使用', desc: '导出 PNG / TGA 格式', icon: '💾' }
    ]
  }
};

function openWorkflow(type) {
  const wf = workflowData[type];
  if (!wf) return;
  const grid = document.getElementById('gameGrid');
  if (!grid) return;
  grid.className = 'game-grid';
  currentWorkflow = type;

  // 3D骨骼绑定：左侧显示骨骼动作面板
  if (type === 'bone') {
    const leftSidebar = document.getElementById('leftSidebar');
    if (leftSidebar) leftSidebar.style.display = '';
    renderBoneActionsSidebar();
  }
  // 音效生成：直接打开完整页面
  if (type === 'audio') {
    openAudioGenerationPage();
    return;
  }
  // 2D素材生成：直接打开完整页面
  if (type === 'texture') {
    openTextureGenerationPage();
    return;
  }
  const stepsHtml = wf.steps.map((s, i) => `
    <div class="wf-step">
      <div class="wf-step-num">${i + 1}</div>
      <div class="wf-step-icon">${s.icon}</div>
      <div class="wf-step-info">
        <div class="wf-step-label">${s.label}</div>
        <div class="wf-step-desc">${s.desc}</div>
      </div>
    </div>
  `).join('');
  const firstStep = wf.steps[0];
  const isBone = type === 'bone';
  const startBtnText = isBone ? '上传模型' : '开始制作';
  const startBtnAction = isBone ? 'uploadModel' : 'startWorkflow';
  grid.innerHTML = `
    <div class="workflow-top-bar">
      <button class="workflow-back" id="workflowBack">← 返回素材制作</button>
      <div class="workflow-top-action">
        <span class="workflow-top-icon">${firstStep.icon}</span>
        <span class="workflow-top-label">${firstStep.label}</span>
      </div>
    </div>
    <div class="workflow-panel">
      <div class="workflow-header">
        <div class="workflow-icon">${wf.icon}</div>
        <div class="workflow-title">${wf.title}</div>
        <div class="workflow-desc">${wf.desc}</div>
      </div>
      <div class="workflow-action">
        <button class="workflow-start-btn" data-action="${startBtnAction}">${startBtnText}</button>
      </div>
    </div>
  `;
  document.getElementById('workflowBack')?.addEventListener('click', function() {
    currentWorkflow = null;
    materialTab = 'create';
    const leftSidebar = document.getElementById('leftSidebar');
    if (leftSidebar) leftSidebar.style.display = '';
    renderActivityBox();
    renderMaterialContent();
  });
  document.querySelector('.workflow-start-btn')?.addEventListener('click', function() {
    if (this.dataset.action === 'uploadModel') {
      openModelUploadModal();
    } else {
      alert('功能开发中，敬请期待！');
    }
  });
}

/* ── 3D模型上传弹窗 ── */
function openModelUploadModal() {
  closeModelUploadModal();
  const overlay = document.createElement('div');
  overlay.className = 'model-upload-overlay';
  overlay.id = 'modelUploadOverlay';

  overlay.innerHTML = `
    <div class="model-upload-modal">
      <div class="model-upload-head">
        <div class="model-upload-title">上传3D模型</div>
        <button class="model-upload-close" id="modelUploadClose" title="关闭">×</button>
      </div>
      <div class="model-upload-body">
        <div class="model-upload-zone" id="modelUploadZone">
          <input type="file" id="modelUploadInput" accept=".fbx,.glb,.obj" hidden>
          <div class="model-upload-placeholder" id="modelUploadPlaceholder">
            <div class="model-upload-zone-icon">📁</div>
            <div class="model-upload-zone-text">拖拽模型文件到此处，或点击选择</div>
            <div class="model-upload-zone-hint">支持 .fbx / .glb / .obj 格式，单文件最大 200MB</div>
          </div>
          <div class="model-upload-fileinfo" id="modelUploadFileinfo" style="display:none">
            <div class="model-upload-file-icon" id="modelUploadFileIcon">🧊</div>
            <div class="model-upload-file-details">
              <div class="model-upload-file-name" id="modelUploadFileName"></div>
              <div class="model-upload-file-meta" id="modelUploadFileMeta"></div>
            </div>
            <button class="model-upload-file-remove" id="modelUploadFileRemove" title="移除文件">×</button>
          </div>
        </div>
        <div class="model-upload-progress" id="modelUploadProgress" style="display:none">
          <div class="model-upload-progress-bar">
            <div class="model-upload-progress-fill" id="modelUploadProgressFill"></div>
          </div>
          <div class="model-upload-progress-text" id="modelUploadProgressText">上传中... 0%</div>
        </div>
        <div class="model-upload-options">
          <div class="model-upload-option">
            <label class="model-upload-option-label">模型名称</label>
            <input type="text" class="model-upload-option-input" id="modelNameInput" placeholder="给模型起个名字...">
          </div>
          <div class="model-upload-option">
            <label class="model-upload-option-label">骨骼类型</label>
            <select class="model-upload-option-input" id="boneTypeSelect">
              <option value="humanoid">人形骨骼 (Humanoid)</option>
              <option value="generic">通用骨骼 (Generic)</option>
              <option value="quadruped">四足骨骼 (Quadruped)</option>
            </select>
          </div>
          <div class="model-upload-option">
            <label class="model-upload-option-label">自动绑定</label>
            <div class="model-upload-toggle-row">
              <span class="model-upload-toggle-desc">AI 自动识别骨骼结构并绑定权重</span>
              <label class="model-upload-toggle">
                <input type="checkbox" id="autoBindToggle" checked>
                <span class="model-upload-toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>
      </div>
      <div class="model-upload-foot">
        <button class="model-upload-cancel-btn" id="modelUploadCancel">取消</button>
        <button class="model-upload-confirm-btn" id="modelUploadConfirm" disabled>确认上传</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const zone = overlay.querySelector('#modelUploadZone');
  const fileInput = overlay.querySelector('#modelUploadInput');
  const placeholder = overlay.querySelector('#modelUploadPlaceholder');
  const fileInfo = overlay.querySelector('#modelUploadFileinfo');
  const fileName = overlay.querySelector('#modelUploadFileName');
  const fileMeta = overlay.querySelector('#modelUploadFileMeta');
  const fileIcon = overlay.querySelector('#modelUploadFileIcon');
  const confirmBtn = overlay.querySelector('#modelUploadConfirm');
  const nameInput = overlay.querySelector('#modelNameInput');
  let selectedFile = null;

  // 文件类型图标映射
  const extIcons = { fbx: '🧊', glb: '🔮', obj: '📦' };

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function handleFile(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['fbx', 'glb', 'obj'].includes(ext)) {
      alert('仅支持 .fbx / .glb / .obj 格式');
      return;
    }
    if (file.size > 200 * 1024 * 1024) {
      alert('文件大小不能超过 200MB');
      return;
    }
    selectedFile = file;
    fileIcon.textContent = extIcons[ext] || '📄';
    fileName.textContent = file.name;
    fileMeta.textContent = `${ext.toUpperCase()} · ${formatSize(file.size)}`;
    placeholder.style.display = 'none';
    fileInfo.style.display = 'flex';
    confirmBtn.disabled = false;
    // 自动填充名称（去掉扩展名）
    if (!nameInput.value.trim()) {
      nameInput.value = file.name.replace(/\.[^.]+$/, '');
    }
  }

  // 点击选择文件
  zone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', function() {
    if (this.files[0]) handleFile(this.files[0]);
  });

  // 拖拽
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragover'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('dragover');
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  });

  // 移除文件
  overlay.querySelector('#modelUploadFileRemove').addEventListener('click', function(e) {
    e.stopPropagation();
    selectedFile = null;
    fileInput.value = '';
    placeholder.style.display = '';
    fileInfo.style.display = 'none';
    confirmBtn.disabled = true;
  });

  // 确认上传
  confirmBtn.addEventListener('click', function() {
    if (!selectedFile) return;
    const progress = overlay.querySelector('#modelUploadProgress');
    const progressFill = overlay.querySelector('#modelUploadProgressFill');
    const progressText = overlay.querySelector('#modelUploadProgressText');
    progress.style.display = '';
    confirmBtn.disabled = true;
    confirmBtn.textContent = '上传中...';

    let p = 0;
    const timer = setInterval(() => {
      p += Math.random() * 12 + 4;
      if (p >= 100) {
        p = 100;
        clearInterval(timer);
        progressFill.style.width = '100%';
        progressText.textContent = '上传完成 ✓';
        setTimeout(() => {
          closeModelUploadModal();
          const modelName = nameInput.value.trim() || selectedFile.name.replace(/\.[^.]+$/, '');
          const boneType = overlay.querySelector('#boneTypeSelect').value;
          openBoneBindingPage(modelName, boneType);
        }, 600);
      } else {
        progressFill.style.width = Math.floor(p) + '%';
        progressText.textContent = `上传中... ${Math.floor(p)}%`;
      }
    }, 250);
  });

  // 关闭
  overlay.querySelector('#modelUploadClose').addEventListener('click', closeModelUploadModal);
  overlay.querySelector('#modelUploadCancel').addEventListener('click', closeModelUploadModal);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModelUploadModal(); });
  const escHandler = e => { if (e.key === 'Escape') { closeModelUploadModal(); document.removeEventListener('keydown', escHandler); } };
  document.addEventListener('keydown', escHandler);
}

function closeModelUploadModal() {
  const ex = document.getElementById('modelUploadOverlay');
  if (ex) ex.remove();
}

/* ── AI音效生成页面 ── */
function renderAudioPresetsSidebar() {
  const body = document.getElementById('activityBoxBody');
  if (!body) return;
  const header = document.querySelector('.activity-box-title');
  if (header) header.textContent = '音效风格';

  const styles = [
    { name: '战斗', icon: '⚔️', tags: ['刀剑碰撞', '爆炸', '魔法释放', '弓箭射击'] },
    { name: '自然', icon: '🌿', tags: ['风声', '雨声', '雷电', '海浪'] },
    { name: '科幻', icon: '🚀', tags: ['激光', '飞船引擎', '能量护盾', '传送门'] },
    { name: 'UI', icon: '🖱️', tags: ['按钮点击', '弹窗提示', '成功', '失败'] },
    { name: '环境', icon: '🏙️', tags: ['城市喧嚣', '森林鸟鸣', '地牢回响', '市场人声'] },
    { name: '乐器', icon: '🎸', tags: ['钢琴和弦', '鼓点节奏', '吉他扫弦', '合成器'] },
  ];

  body.innerHTML = styles.map(s => `
    <div class="audio-style-group">
      <div class="audio-style-title">${s.icon} ${s.name}</div>
      <div class="audio-style-tags">
        ${s.tags.map(t => `<div class="audio-style-tag" data-tag="${t}">${t}</div>`).join('')}
      </div>
    </div>
  `).join('');

  body.querySelectorAll('.audio-style-tag').forEach(tag => {
    tag.addEventListener('click', function() {
      const input = document.getElementById('audioPromptInput');
      if (input) {
        const val = input.value.trim();
        input.value = val ? val + '，' + this.dataset.tag : this.dataset.tag;
        input.focus();
      }
    });
  });
}

function openAudioGenerationPage() {
  const grid = document.getElementById('gameGrid');
  if (!grid) return;
  grid.className = 'binding-container';
  currentWorkflow = 'audio';

  // 显示左侧音效风格面板
  const leftSidebar = document.getElementById('leftSidebar');
  if (leftSidebar) leftSidebar.style.display = '';
  renderAudioPresetsSidebar();

  // 模拟生成历史
  const history = [
    { name: '战斗-刀剑碰撞', desc: '金属碰撞声，清脆有力', style: '战斗', duration: '3s', time: '2分钟前' },
    { name: '科幻-激光射击', desc: '高频激光束发射音效', style: '科幻', duration: '2s', time: '15分钟前' },
    { name: '自然-暴风雨', desc: '雷声轰鸣伴随暴雨倾盆', style: '自然', duration: '8s', time: '1小时前' },
    { name: 'UI-成功提示', desc: '清脆的完成提示音', style: 'UI', duration: '1s', time: '3小时前' },
  ];

  grid.innerHTML = `
    <div class="audio-gen-layout">
      <!-- 主内容区 -->
      <div class="audio-gen-main">
        <!-- 顶部标题 -->
        <div class="audio-gen-header">
          <div class="audio-gen-header-left">
            <button class="binding-back" id="audioBackBtn">← 返回素材制作</button>
            <div class="audio-gen-logo">🔊</div>
            <div>
              <div class="audio-gen-title">AI 音效生成</div>
              <div class="audio-gen-subtitle">描述你想要的音效，AI 即刻生成</div>
            </div>
          </div>
          <div class="audio-gen-header-right">
            <span class="audio-gen-badge">Suno Audio v3</span>
          </div>
        </div>

        <!-- 输入区 -->
        <div class="audio-gen-input-section">
          <div class="audio-gen-prompt-wrap">
            <textarea class="audio-gen-prompt" id="audioPromptInput" placeholder="描述你想要的音效，例如：科幻激光武器发射声，高频能量束，带混响效果..." rows="3"></textarea>
            <div class="audio-gen-prompt-actions">
              <button class="audio-gen-random" id="audioRandomBtn" title="随机提示">🎲 随机</button>
              <button class="audio-gen-generate" id="audioGenerateBtn">
                <span class="audio-gen-generate-icon">⚡</span>
                生成音效
              </button>
            </div>
          </div>

          <!-- 参数调节 -->
          <div class="audio-gen-params">
            <div class="audio-gen-param">
              <label class="audio-gen-param-label">风格</label>
              <div class="audio-gen-style-btns" id="audioStyleBtns">
                <button class="audio-gen-style-btn active" data-style="auto">自动</button>
                <button class="audio-gen-style-btn" data-style="战斗">战斗</button>
                <button class="audio-gen-style-btn" data-style="自然">自然</button>
                <button class="audio-gen-style-btn" data-style="科幻">科幻</button>
                <button class="audio-gen-style-btn" data-style="UI">UI</button>
                <button class="audio-gen-style-btn" data-style="环境">环境</button>
                <button class="audio-gen-style-btn" data-style="乐器">乐器</button>
              </div>
            </div>
            <div class="audio-gen-param-row">
              <div class="audio-gen-param">
                <label class="audio-gen-param-label">时长</label>
                <div class="audio-gen-slider-wrap">
                  <input type="range" class="audio-gen-slider" id="audioDuration" min="1" max="30" value="5">
                  <span class="audio-gen-slider-value" id="audioDurationVal">5s</span>
                </div>
              </div>
              <div class="audio-gen-param">
                <label class="audio-gen-param-label">数量</label>
                <div class="audio-gen-count-btns" id="audioCountBtns">
                  <button class="audio-gen-count-btn active" data-count="1">1</button>
                  <button class="audio-gen-count-btn" data-count="2">2</button>
                  <button class="audio-gen-count-btn" data-count="4">4</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 生成结果区 -->
        <div class="audio-gen-results" id="audioResults">
          <div class="audio-gen-empty">
            <div class="audio-gen-empty-icon">🎵</div>
            <div class="audio-gen-empty-text">输入描述并点击「生成音效」开始创作</div>
            <div class="audio-gen-empty-hint">支持中文和英文描述，越详细效果越好</div>
          </div>
        </div>
      </div>

      <!-- 右侧历史面板 -->
      <div class="audio-gen-sidebar">
        <div class="audio-gen-sidebar-header">
          <div class="audio-gen-sidebar-title">生成历史</div>
          <span class="audio-gen-sidebar-count">${history.length} 条</span>
        </div>
        <div class="audio-gen-history-list" id="audioHistoryList">
          ${history.map((h, i) => `
            <div class="audio-gen-history-item" data-idx="${i}">
              <div class="audio-gen-history-icon">🎵</div>
              <div class="audio-gen-history-info">
                <div class="audio-gen-history-name">${h.name}</div>
                <div class="audio-gen-history-meta">${h.style} · ${h.duration} · ${h.time}</div>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="audio-gen-sidebar-footer">
          <button class="audio-gen-sidebar-btn" id="audioClearHistory">清空历史</button>
        </div>
      </div>
    </div>
  `;

  // 绑定事件
  bindAudioGenEvents();
}

function bindAudioGenEvents() {
  // 返回按钮
  document.getElementById('audioBackBtn')?.addEventListener('click', function() {
    currentWorkflow = null;
    materialTab = 'create';
    const leftSidebar = document.getElementById('leftSidebar');
    if (leftSidebar) leftSidebar.style.display = '';
    renderActivityBox();
    renderMaterialContent();
  });

  // 风格按钮
  let selectedStyle = 'auto';
  document.querySelectorAll('.audio-gen-style-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      selectedStyle = this.dataset.style;
      document.querySelectorAll('.audio-gen-style-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
    });
  });

  // 时长滑块
  const durationSlider = document.getElementById('audioDuration');
  const durationVal = document.getElementById('audioDurationVal');
  if (durationSlider) {
    durationSlider.addEventListener('input', function() {
      durationVal.textContent = this.value + 's';
    });
  }

  // 数量按钮
  let selectedCount = 1;
  document.querySelectorAll('.audio-gen-count-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      selectedCount = parseInt(this.dataset.count);
      document.querySelectorAll('.audio-gen-count-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
    });
  });

  // 随机提示
  const randomPrompts = [
    '魔法火焰燃烧声，噼啪作响，温暖而神秘',
    '未来城市街道环境音，飞行汽车呼啸而过',
    '古老的地牢门缓缓打开，石头摩擦声',
    '水滴落入深潭，回声层层扩散',
    '能量护盾激活，嗡嗡的电磁声',
    '弓箭离弦射击，箭矢破空声',
    '电子游戏金币收集音效，清脆悦耳',
    '暴风雨中的雷鸣，由远及近',
    '武士拔刀，金属摩擦的锐利声',
    '森林清晨，鸟鸣声渐渐响起',
    '太空站内部环境音，低沉的机械运转',
    '卡通跳跃音效，弹簧般的boing声',
  ];
  document.getElementById('audioRandomBtn')?.addEventListener('click', function() {
    const input = document.getElementById('audioPromptInput');
    if (input) {
      input.value = randomPrompts[Math.floor(Math.random() * randomPrompts.length)];
      input.focus();
    }
  });

  // 生成按钮
  document.getElementById('audioGenerateBtn')?.addEventListener('click', function() {
    const input = document.getElementById('audioPromptInput');
    const prompt = input?.value.trim();
    if (!prompt) {
      alert('请输入音效描述');
      return;
    }
    generateAudio(prompt, selectedStyle, parseInt(durationSlider?.value || 5), selectedCount);
  });

  // 历史记录点击
  document.querySelectorAll('.audio-gen-history-item').forEach(item => {
    item.addEventListener('click', function() {
      const idx = parseInt(this.dataset.idx);
      const historyData = [
        { name: '战斗-刀剑碰撞', prompt: '金属碰撞声，清脆有力，适合战斗场景' },
        { name: '科幻-激光射击', prompt: '高频激光束发射音效，未来科技感' },
        { name: '自然-暴风雨', prompt: '雷声轰鸣伴随暴雨倾盆' },
        { name: 'UI-成功提示', prompt: '清脆的完成提示音，简短悦耳' },
      ];
      const h = historyData[idx];
      if (h) {
        const input = document.getElementById('audioPromptInput');
        if (input) input.value = h.prompt;
      }
    });
  });

  // 清空历史
  document.getElementById('audioClearHistory')?.addEventListener('click', function() {
    const list = document.getElementById('audioHistoryList');
    if (list) {
      list.innerHTML = '<div class="audio-gen-history-empty">暂无历史记录</div>';
    }
  });
}

function generateAudio(prompt, style, duration, count) {
  const results = document.getElementById('audioResults');
  if (!results) return;

  // 显示生成中状态
  results.innerHTML = `
    <div class="audio-gen-generating">
      <div class="audio-gen-wave-anim">
        <div class="audio-gen-wave-bar"></div>
        <div class="audio-gen-wave-bar"></div>
        <div class="audio-gen-wave-bar"></div>
        <div class="audio-gen-wave-bar"></div>
        <div class="audio-gen-wave-bar"></div>
        <div class="audio-gen-wave-bar"></div>
        <div class="audio-gen-wave-bar"></div>
        <div class="audio-gen-wave-bar"></div>
        <div class="audio-gen-wave-bar"></div>
        <div class="audio-gen-wave-bar"></div>
        <div class="audio-gen-wave-bar"></div>
        <div class="audio-gen-wave-bar"></div>
      </div>
      <div class="audio-gen-generating-text">AI 正在生成音效...</div>
      <div class="audio-gen-generating-desc">「${prompt.substring(0, 40)}${prompt.length > 40 ? '...' : ''}」</div>
      <div class="audio-gen-progress-bar">
        <div class="audio-gen-progress-fill" id="audioGenProgress"></div>
      </div>
    </div>
  `;

  // 模拟生成进度
  let p = 0;
  const progressEl = document.getElementById('audioGenProgress');
  const timer = setInterval(() => {
    p += Math.random() * 8 + 3;
    if (p >= 100) {
      p = 100;
      clearInterval(timer);
      if (progressEl) progressEl.style.width = '100%';
      setTimeout(() => showAudioResults(prompt, style, duration, count), 500);
    } else {
      if (progressEl) progressEl.style.width = Math.floor(p) + '%';
    }
  }, 200);
}

function showAudioResults(prompt, style, duration, count) {
  const results = document.getElementById('audioResults');
  if (!results) return;

  // 生成模拟波形数据
  function genWaveform(len) {
    const arr = [];
    let v = 0.5;
    for (let i = 0; i < len; i++) {
      v += (Math.random() - 0.5) * 0.3;
      v = Math.max(0.05, Math.min(0.95, v));
      arr.push(v);
    }
    return arr;
  }

  const styleLabels = { auto: '自动', '战斗': '战斗', '自然': '自然', '科幻': '科幻', 'UI': 'UI', '环境': '环境', '乐器': '乐器' };
  const cards = [];
  for (let i = 0; i < count; i++) {
    const waveform = genWaveform(80);
    const waveHtml = waveform.map(v =>
      `<div class="audio-wave-bar" style="height:${v * 100}%"></div>`
    ).join('');
    const variant = ['原版', '变体 A', '变体 B', '变体 C'][i] || `变体 ${i}`;
    cards.push(`
      <div class="audio-result-card" data-idx="${i}">
        <div class="audio-result-header">
          <div class="audio-result-play" data-idx="${i}">▶</div>
          <div class="audio-result-info">
            <div class="audio-result-name">${variant}</div>
            <div class="audio-result-meta">${styleLabels[style] || '自动'} · ${duration}s</div>
          </div>
          <div class="audio-result-actions">
            <button class="audio-result-action-btn" title="收藏">♡</button>
            <button class="audio-result-action-btn" title="下载">↓</button>
          </div>
        </div>
        <div class="audio-result-waveform" data-idx="${i}">
          ${waveHtml}
        </div>
        <div class="audio-result-timeline">
          <span>0:00</span>
          <span>0:${String(duration).padStart(2, '0')}</span>
        </div>
      </div>
    `);
  }

  results.innerHTML = `
    <div class="audio-gen-results-header">
      <div class="audio-gen-results-title">生成结果</div>
      <div class="audio-gen-results-actions">
        <button class="audio-gen-results-btn" id="audioRegenerate">🔄 重新生成</button>
        <button class="audio-gen-results-btn primary" id="audioDownloadAll">📦 全部下载</button>
      </div>
    </div>
    <div class="audio-result-prompt">「${prompt}」</div>
    <div class="audio-result-list">${cards.join('')}</div>
  `;

  // 播放按钮事件
  let currentPlaying = null;
  let playTimer = null;
  results.querySelectorAll('.audio-result-play').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const idx = this.dataset.idx;
      if (currentPlaying === idx) {
        // 暂停
        this.textContent = '▶';
        this.classList.remove('playing');
        currentPlaying = null;
        clearInterval(playTimer);
        return;
      }
      // 停止之前的
      results.querySelectorAll('.audio-result-play').forEach(b => {
        b.textContent = '▶';
        b.classList.remove('playing');
      });
      clearInterval(playTimer);

      // 播放
      this.textContent = '⏸';
      this.classList.add('playing');
      currentPlaying = idx;

      // 模拟播放进度
      const waveform = results.querySelectorAll('.audio-result-waveform')[parseInt(idx)];
      const bars = waveform?.querySelectorAll('.audio-wave-bar');
      let step = 0;
      playTimer = setInterval(() => {
        if (bars && step < bars.length) {
          bars.forEach((b, j) => b.classList.toggle('active', j <= step));
          step++;
        } else {
          clearInterval(playTimer);
          results.querySelectorAll('.audio-result-play').forEach(b => {
            b.textContent = '▶';
            b.classList.remove('playing');
          });
          if (bars) bars.forEach(b => b.classList.remove('active'));
          currentPlaying = null;
        }
      }, duration * 1000 / 80);
    });
  });

  // 波形点击跳转
  results.querySelectorAll('.audio-result-waveform').forEach(wf => {
    wf.addEventListener('click', function(e) {
      const rect = this.getBoundingClientRect();
      const pct = (e.clientX - rect.left) / rect.width;
      const bars = this.querySelectorAll('.audio-wave-bar');
      const step = Math.floor(pct * bars.length);
      bars.forEach((b, j) => b.classList.toggle('active', j <= step));
    });
  });

  // 收藏按钮
  results.querySelectorAll('.audio-result-action-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      if (this.textContent === '♡') {
        this.textContent = '♥';
        this.style.color = '#ff4d4f';
      } else if (this.textContent === '♥') {
        this.textContent = '♡';
        this.style.color = '';
      } else {
        alert('已开始下载（模拟）');
      }
    });
  });

  // 重新生成
  document.getElementById('audioRegenerate')?.addEventListener('click', function() {
    generateAudio(prompt, style, duration, count);
  });

  // 全部下载
  document.getElementById('audioDownloadAll')?.addEventListener('click', function() {
    alert(`已打包下载 ${count} 个音效文件（模拟）`);
  });

  // 添加到历史
  const historyList = document.getElementById('audioHistoryList');
  if (historyList) {
    const styleLabels2 = { auto: '自动', '战斗': '战斗', '自然': '自然', '科幻': '科幻', 'UI': 'UI', '环境': '环境', '乐器': '乐器' };
    const newItem = document.createElement('div');
    newItem.className = 'audio-gen-history-item';
    newItem.innerHTML = `
      <div class="audio-gen-history-icon">🎵</div>
      <div class="audio-gen-history-info">
        <div class="audio-gen-history-name">${prompt.substring(0, 12)}...</div>
        <div class="audio-gen-history-meta">${styleLabels2[style] || '自动'} · ${duration}s · 刚刚</div>
      </div>
    `;
    historyList.insertBefore(newItem, historyList.firstChild);
  }
}

/* ── 2D素材生成页面 ── */
function renderTexturePresetsSidebar() {
  const body = document.getElementById('activityBoxBody');
  if (!body) return;
  const header = document.querySelector('.activity-box-title');
  if (header) header.textContent = '素材风格';

  const styles = [
    { name: '像素风', icon: '🟦', tags: ['角色行走', '攻击动画', '跳跃', '待机'] },
    { name: '卡通风', icon: '🎨', tags: ['Q版角色', '表情包', '道具', '特效'] },
    { name: '写实风', icon: '🖼️', tags: ['场景背景', '材质贴图', 'UI元素', '图标'] },
    { name: '日系', icon: '🌸', tags: ['动漫角色', '立绘', '战斗姿态', '技能特效'] },
    { name: '国风', icon: '🏯', tags: ['古风人物', '仙侠场景', '水墨特效', '传统纹样'] },
  ];

  body.innerHTML = styles.map(s => `
    <div class="audio-style-group">
      <div class="audio-style-title">${s.icon} ${s.name}</div>
      <div class="audio-style-tags">
        ${s.tags.map(t => `<div class="audio-style-tag" data-tag="${t}">${t}</div>`).join('')}
      </div>
    </div>
  `).join('');

  body.querySelectorAll('.audio-style-tag').forEach(tag => {
    tag.addEventListener('click', function() {
      const input = document.getElementById('texPromptInput');
      if (input) {
        const val = input.value.trim();
        input.value = val ? val + '，' + this.dataset.tag : this.dataset.tag;
        input.focus();
      }
    });
  });
}

function openTextureGenerationPage() {
  const grid = document.getElementById('gameGrid');
  if (!grid) return;
  grid.className = 'binding-container';
  currentWorkflow = 'texture';

  const leftSidebar = document.getElementById('leftSidebar');
  if (leftSidebar) leftSidebar.style.display = '';
  renderTexturePresetsSidebar();

  // 历史数据
  const history = [
    { name: '角色行走-像素', mode: '帧序列', size: '128×128', time: '5分钟前' },
    { name: '草地材质', mode: '贴图生成', size: '512×512', time: '30分钟前' },
    { name: '爆炸特效', mode: '帧序列', size: '256×256', time: '2小时前' },
  ];

  grid.innerHTML = `
    <div class="tex-gen-layout">
      <div class="tex-gen-main">
        <!-- 顶部 -->
        <div class="tex-gen-header">
          <div class="tex-gen-header-left">
            <button class="binding-back" id="texBackBtn">← 返回素材制作</button>
            <div class="tex-gen-logo">🎨</div>
            <div>
              <div class="tex-gen-title">AI 2D素材生成</div>
              <div class="tex-gen-subtitle">描述你需要的素材，AI 自动生成图片/帧序列/贴图</div>
            </div>
          </div>
          <div class="tex-gen-header-right">
            <span class="tex-gen-badge">Stable Diffusion XL</span>
          </div>
        </div>

        <!-- 输入区 -->
        <div class="tex-gen-input-section">
          <div class="tex-gen-prompt-wrap">
            <textarea class="tex-gen-prompt" id="texPromptInput" placeholder="描述你想要的2D素材，例如：像素风角色行走动画，8帧，侧面视角，蓝色头发的少年..." rows="3"></textarea>
            <div class="tex-gen-prompt-actions">
              <button class="tex-gen-random" id="texRandomBtn">🎲 随机</button>
              <div class="tex-gen-prompt-count"><span id="texCharCount">0</span> / 500</button>
            </div>
          </div>

          <!-- 两种生成模式 -->
          <div class="tex-gen-modes">
            <div class="tex-gen-mode active" data-mode="framesequence">
              <div class="tex-gen-mode-icon">🎬</div>
              <div class="tex-gen-mode-info">
                <div class="tex-gen-mode-title">图片 → 视频 → 帧序列</div>
                <div class="tex-gen-mode-desc">AI先生成连续图片，合成视频后自动提取帧，适合流畅动画</div>
              </div>
              <div class="tex-gen-mode-check">✓</div>
            </div>
            <div class="tex-gen-mode" data-mode="spritesheet">
              <div class="tex-gen-mode-icon">✂️</div>
              <div class="tex-gen-mode-info">
                <div class="tex-gen-mode-title">直接生成动作图 → 扣帧</div>
                <div class="tex-gen-mode-desc">AI直接生成完整精灵图，自动切割为独立帧，适合精确控制</div>
              </div>
              <div class="tex-gen-mode-check">✓</div>
            </div>
          </div>

          <!-- 参数区 -->
          <div class="tex-gen-params">
            <div class="tex-gen-param-row">
              <div class="tex-gen-param">
                <label class="tex-gen-param-label">尺寸</label>
                <div class="tex-gen-size-btns" id="texSizeBtns">
                  <button class="tex-gen-size-btn" data-size="64">64×64</button>
                  <button class="tex-gen-size-btn active" data-size="128">128×128</button>
                  <button class="tex-gen-size-btn" data-size="256">256×256</button>
                  <button class="tex-gen-size-btn" data-size="512">512×512</button>
                </div>
              </div>
              <div class="tex-gen-param">
                <label class="tex-gen-param-label">帧数</label>
                <div class="tex-gen-frame-btns" id="texFrameBtns">
                  <button class="tex-gen-frame-btn" data-frames="4">4帧</button>
                  <button class="tex-gen-frame-btn active" data-frames="8">8帧</button>
                  <button class="tex-gen-frame-btn" data-frames="12">12帧</button>
                  <button class="tex-gen-frame-btn" data-frames="16">16帧</button>
                </div>
              </div>
            </div>
            <div class="tex-gen-param-row">
              <div class="tex-gen-param">
                <label class="tex-gen-param-label">风格</label>
                <div class="tex-gen-style-btns" id="texStyleBtns">
                  <button class="tex-gen-style-btn active" data-style="auto">自动</button>
                  <button class="tex-gen-style-btn" data-style="pixel">像素风</button>
                  <button class="tex-gen-style-btn" data-style="cartoon">卡通</button>
                  <button class="tex-gen-style-btn" data-style="anime">日系</button>
                  <button class="tex-gen-style-btn" data-style="realistic">写实</button>
                  <button class="tex-gen-style-btn" data-style="guofeng">国风</button>
                </div>
              </div>
              <div class="tex-gen-param">
                <label class="tex-gen-param-label">背景</label>
                <div class="tex-gen-bg-btns" id="texBgBtns">
                  <button class="tex-gen-bg-btn active" data-bg="transparent">透明</button>
                  <button class="tex-gen-bg-btn" data-bg="white">白色</button>
                  <button class="tex-gen-bg-btn" data-bg="black">黑色</button>
                  <button class="tex-gen-bg-btn" data-bg="green">绿幕</button>
                </div>
              </div>
            </div>
            <div class="tex-gen-generate-row">
              <button class="tex-gen-generate" id="texGenerateBtn">
                <span class="tex-gen-generate-icon">⚡</span>
                生成素材
              </button>
            </div>
          </div>
        </div>

        <!-- 结果区 -->
        <div class="tex-gen-results" id="texResults">
          <div class="tex-gen-empty">
            <div class="tex-gen-empty-icon">🖼️</div>
            <div class="tex-gen-empty-text">输入描述并点击「生成素材」开始创作</div>
            <div class="tex-gen-empty-hint">支持生成精灵图序列、贴图、UI素材等</div>
          </div>
        </div>
      </div>

      <!-- 右侧历史 -->
      <div class="tex-gen-sidebar">
        <div class="tex-gen-sidebar-header">
          <div class="tex-gen-sidebar-title">生成历史</div>
          <span class="tex-gen-sidebar-count">${history.length} 条</span>
        </div>
        <div class="tex-gen-history-list" id="texHistoryList">
          ${history.map((h, i) => `
            <div class="tex-gen-history-item" data-idx="${i}">
              <div class="tex-gen-history-thumb">🖼️</div>
              <div class="tex-gen-history-info">
                <div class="tex-gen-history-name">${h.name}</div>
                <div class="tex-gen-history-meta">${h.mode} · ${h.size} · ${h.time}</div>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="tex-gen-sidebar-footer">
          <button class="tex-gen-sidebar-btn" id="texClearHistory">清空历史</button>
        </div>
      </div>
    </div>
  `;

  bindTextureGenEvents();
}

function bindTextureGenEvents() {
  // 返回
  document.getElementById('texBackBtn')?.addEventListener('click', function() {
    currentWorkflow = null;
    materialTab = 'create';
    const leftSidebar = document.getElementById('leftSidebar');
    if (leftSidebar) leftSidebar.style.display = '';
    renderActivityBox();
    renderMaterialContent();
  });

  // 字数统计
  const promptInput = document.getElementById('texPromptInput');
  const charCount = document.getElementById('texCharCount');
  if (promptInput && charCount) {
    promptInput.addEventListener('input', function() {
      charCount.textContent = this.value.length;
    });
  }

  // 模式切换
  let selectedMode = 'framesequence';
  document.querySelectorAll('.tex-gen-mode').forEach(el => {
    el.addEventListener('click', function() {
      selectedMode = this.dataset.mode;
      document.querySelectorAll('.tex-gen-mode').forEach(m => m.classList.remove('active'));
      this.classList.add('active');
    });
  });

  // 尺寸
  let selectedSize = 128;
  document.querySelectorAll('.tex-gen-size-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      selectedSize = parseInt(this.dataset.size);
      document.querySelectorAll('.tex-gen-size-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
    });
  });

  // 帧数
  let selectedFrames = 8;
  document.querySelectorAll('.tex-gen-frame-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      selectedFrames = parseInt(this.dataset.frames);
      document.querySelectorAll('.tex-gen-frame-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
    });
  });

  // 风格
  let selectedStyle = 'auto';
  document.querySelectorAll('.tex-gen-style-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      selectedStyle = this.dataset.style;
      document.querySelectorAll('.tex-gen-style-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
    });
  });

  // 背景
  let selectedBg = 'transparent';
  document.querySelectorAll('.tex-gen-bg-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      selectedBg = this.dataset.bg;
      document.querySelectorAll('.tex-gen-bg-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
    });
  });

  // 随机
  const randomPrompts = [
    '像素风角色行走动画，8帧侧面，蓝色头发少年，赛博朋克风格',
    '卡通风格火焰燃烧特效，4帧循环，橙红色渐变',
    '日系动漫少女战斗姿态，12帧连击动作，持剑挥砍',
    'Q版动物角色跳跃动画，透明背景，可爱风格',
    '国风水墨仙侠场景，云雾缭绕，远山近水',
    '写实风格树叶飘落动画，6帧循环，秋天红叶',
    '像素风爆炸特效，16帧，像素粒子飞散',
    '卡通UI按钮点击反馈动画，弹性缩放效果',
    '日系角色待机呼吸动画，微妙的上下浮动',
    '赛博朋克城市夜景背景，霓虹灯光闪烁',
  ];
  document.getElementById('texRandomBtn')?.addEventListener('click', function() {
    if (promptInput) {
      promptInput.value = randomPrompts[Math.floor(Math.random() * randomPrompts.length)];
      charCount.textContent = promptInput.value.length;
      promptInput.focus();
    }
  });

  // 生成
  document.getElementById('texGenerateBtn')?.addEventListener('click', function() {
    const prompt = promptInput?.value.trim();
    if (!prompt) { alert('请输入素材描述'); return; }
    generateTexture(prompt, selectedMode, selectedSize, selectedFrames, selectedStyle, selectedBg);
  });

  // 清空历史
  document.getElementById('texClearHistory')?.addEventListener('click', function() {
    const list = document.getElementById('texHistoryList');
    if (list) list.innerHTML = '<div class="tex-gen-history-empty">暂无历史记录</div>';
  });
}

function generateTexture(prompt, mode, size, frames, style, bg) {
  const results = document.getElementById('texResults');
  if (!results) return;

  // 生成中
  results.innerHTML = `
    <div class="tex-gen-generating">
      <div class="tex-gen-loading-grid">
        ${Array.from({length: 6}, (_, i) => `
          <div class="tex-gen-loading-cell" style="animation-delay:${i * 0.1}s"></div>
        `).join('')}
      </div>
      <div class="tex-gen-generating-text">AI 正在生成素材...</div>
      <div class="tex-gen-generating-desc">「${prompt.substring(0, 40)}${prompt.length > 40 ? '...' : ''}」</div>
      <div class="tex-gen-progress-bar">
        <div class="tex-gen-progress-fill" id="texGenProgress"></div>
      </div>
      <div class="tex-gen-generating-step" id="texGenStep">准备中...</div>
    </div>
  `;

  const steps = mode === 'framesequence'
    ? ['分析提示词...', '生成关键帧图片...', 'AI 插值补帧...', '合成视频...', '提取帧序列...', '优化输出...']
    : ['分析提示词...', '生成精灵图...', '自动切割帧...', '优化边缘...', '调整尺寸...', '导出完成...'];

  let p = 0;
  let stepIdx = 0;
  const progressEl = document.getElementById('texGenProgress');
  const stepEl = document.getElementById('texGenStep');
  const timer = setInterval(() => {
    p += Math.random() * 6 + 2;
    const newStep = Math.min(steps.length - 1, Math.floor(p / 100 * steps.length));
    if (newStep !== stepIdx) { stepIdx = newStep; if (stepEl) stepEl.textContent = steps[stepIdx]; }
    if (p >= 100) {
      p = 100;
      clearInterval(timer);
      if (progressEl) progressEl.style.width = '100%';
      if (stepEl) stepEl.textContent = '完成！';
      setTimeout(() => showTextureResults(prompt, mode, size, frames, style, bg), 500);
    } else {
      if (progressEl) progressEl.style.width = Math.floor(p) + '%';
    }
  }, 250);
}

function showTextureResults(prompt, mode, size, frames, style, bg) {
  const results = document.getElementById('texResults');
  if (!results) return;

  const styleLabels = { auto: '自动', pixel: '像素风', cartoon: '卡通', anime: '日系', realistic: '写实', guofeng: '国风' };
  const bgLabels = { transparent: '透明', white: '白色', black: '黑色', green: '绿幕' };

  // 生成模拟帧缩略图（用emoji+颜色模拟）
  const emojis = ['🏃', '⚔️', '🔥', '✨', '跳跃', '待机'];
  const colors = ['#66c0f4', '#ff6b6b', '#52c41a', '#faad14', '#c7b5ff', '#ff85c0'];
  const frameThumbs = [];
  for (let i = 0; i < frames; i++) {
    const color = colors[i % colors.length];
    const emoji = emojis[i % emojis.length];
    frameThumbs.push(`
      <div class="tex-frame-thumb" style="background:${color}20;border:1px solid ${color}40">
        <span class="tex-frame-emoji">${emoji}</span>
        <span class="tex-frame-num">F${i + 1}</span>
      </div>
    `);
  }

  // 精灵图预览（网格排列）
  const gridCols = Math.ceil(Math.sqrt(frames));
  const gridRows = Math.ceil(frames / gridCols);
  const spritePreview = frameThumbs.map((t, i) =>
    `<div class="tex-sprite-cell" style="animation-delay:${i * 0.05}s">${t}</div>`
  ).join('');

  // 动画预览条
  const animStrip = frameThumbs.join('');

  results.innerHTML = `
    <div class="tex-gen-results-header">
      <div class="tex-gen-results-title">生成结果</div>
      <div class="tex-gen-results-meta">${mode === 'framesequence' ? '图片→视频→帧序列' : '直接生成精灵图'} · ${size}×${size} · ${frames}帧 · ${styleLabels[style]}</div>
      <div class="tex-gen-results-actions">
        <button class="tex-gen-results-btn" id="texRegenerate">🔄 重新生成</button>
        <button class="tex-gen-results-btn primary" id="texDownloadAll">📦 下载全部</button>
      </div>
    </div>
    <div class="tex-gen-result-prompt">「${prompt}」</div>

    <!-- 帧序列预览 -->
    <div class="tex-gen-section">
      <div class="tex-gen-section-title">帧序列预览</div>
      <div class="tex-gen-frames-grid" style="grid-template-columns:repeat(${gridCols}, 1fr)">
        ${spritePreview}
      </div>
    </div>

    <!-- 动画播放条 -->
    <div class="tex-gen-section">
      <div class="tex-gen-section-title">动画预览</div>
      <div class="tex-gen-anim-player">
        <button class="tex-gen-anim-play" id="texAnimPlayBtn">▶</button>
        <div class="tex-gen-anim-strip" id="texAnimStrip">
          ${animStrip}
        </div>
        <div class="tex-gen-anim-info">${frames}帧 · ${size}×${size}px</div>
      </div>
    </div>

    <!-- 模式详情 -->
    <div class="tex-gen-section">
      <div class="tex-gen-section-title">${mode === 'framesequence' ? '生成流程' : '切割结果'}</div>
      ${mode === 'framesequence' ? `
        <div class="tex-gen-pipeline">
          <div class="tex-gen-pipeline-step done">
            <div class="tex-gen-pipeline-icon">📝</div>
            <div class="tex-gen-pipeline-label">提示词</div>
          </div>
          <div class="tex-gen-pipeline-arrow">→</div>
          <div class="tex-gen-pipeline-step done">
            <div class="tex-gen-pipeline-icon">🖼️</div>
            <div class="tex-gen-pipeline-label">关键帧</div>
          </div>
          <div class="tex-gen-pipeline-arrow">→</div>
          <div class="tex-gen-pipeline-step done">
            <div class="tex-gen-pipeline-icon">🎬</div>
            <div class="tex-gen-pipeline-label">合成视频</div>
          </div>
          <div class="tex-gen-pipeline-arrow">→</div>
          <div class="tex-gen-pipeline-step done">
            <div class="tex-gen-pipeline-icon">✂️</div>
            <div class="tex-gen-pipeline-label">提取帧</div>
          </div>
          <div class="tex-gen-pipeline-arrow">→</div>
          <div class="tex-gen-pipeline-step done">
            <div class="tex-gen-pipeline-icon">📦</div>
            <div class="tex-gen-pipeline-label">导出</div>
          </div>
        </div>
      ` : `
        <div class="tex-gen-pipeline">
          <div class="tex-gen-pipeline-step done">
            <div class="tex-gen-pipeline-icon">📝</div>
            <div class="tex-gen-pipeline-label">提示词</div>
          </div>
          <div class="tex-gen-pipeline-arrow">→</div>
          <div class="tex-gen-pipeline-step done">
            <div class="tex-gen-pipeline-icon">🎨</div>
            <div class="tex-gen-pipeline-label">生成精灵图</div>
          </div>
          <div class="tex-gen-pipeline-arrow">→</div>
          <div class="tex-gen-pipeline-step done">
            <div class="tex-gen-pipeline-icon">✂️</div>
            <div class="tex-gen-pipeline-label">AI切割</div>
          </div>
          <div class="tex-gen-pipeline-arrow">→</div>
          <div class="tex-gen-pipeline-step done">
            <div class="tex-gen-pipeline-icon">🔧</div>
            <div class="tex-gen-pipeline-label">优化边缘</div>
          </div>
          <div class="tex-gen-pipeline-arrow">→</div>
          <div class="tex-gen-pipeline-step done">
            <div class="tex-gen-pipeline-icon">📦</div>
            <div class="tex-gen-pipeline-label">导出</div>
          </div>
        </div>
      `}
    </div>

    <!-- 导出选项 -->
    <div class="tex-gen-section">
      <div class="tex-gen-section-title">导出选项</div>
      <div class="tex-gen-export-options">
        <div class="tex-gen-export-item" id="texExportPng">
          <span class="tex-gen-export-icon">🖼️</span>
          <div class="tex-gen-export-info">
            <div class="tex-gen-export-name">PNG 帧序列</div>
            <div class="tex-gen-export-desc">${frames} 张 ${size}×${size} PNG</div>
          </div>
        </div>
        <div class="tex-gen-export-item" id="texExportGif">
          <span class="tex-gen-export-icon">🎞️</span>
          <div class="tex-gen-export-info">
            <div class="tex-gen-export-name">GIF 动图</div>
            <div class="tex-gen-export-desc">循环播放 · ${frames}帧</div>
          </div>
        </div>
        <div class="tex-gen-export-item" id="texExportSprite">
          <span class="tex-gen-export-icon">📋</span>
          <div class="tex-gen-export-info">
            <div class="tex-gen-export-name">精灵图合集</div>
            <div class="tex-gen-export-desc">${gridCols}×${gridRows} 网格排列</div>
          </div>
        </div>
      </div>
    </div>
  `;

  // 动画播放
  let animPlaying = false;
  let animTimer = null;
  let animFrame = 0;
  document.getElementById('texAnimPlayBtn')?.addEventListener('click', function() {
    const strip = document.getElementById('texAnimStrip');
    const cells = strip?.querySelectorAll('.tex-frame-thumb');
    if (!cells || cells.length === 0) return;

    if (animPlaying) {
      animPlaying = false;
      clearInterval(animTimer);
      this.textContent = '▶';
      cells.forEach(c => c.classList.remove('current'));
      return;
    }

    animPlaying = true;
    this.textContent = '⏸';
    animFrame = 0;
    animTimer = setInterval(() => {
      cells.forEach((c, i) => c.classList.toggle('current', i === animFrame));
      animFrame = (animFrame + 1) % cells.length;
    }, 150);
  });

  // 帧点击高亮
  document.querySelectorAll('.tex-sprite-cell').forEach(cell => {
    cell.addEventListener('click', function() {
      document.querySelectorAll('.tex-sprite-cell').forEach(c => c.classList.remove('selected'));
      this.classList.add('selected');
    });
  });

  // 导出按钮
  ['texExportPng', 'texExportGif', 'texExportSprite'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', function() {
      const name = this.querySelector('.tex-gen-export-name')?.textContent;
      alert(`已导出「${name}」（模拟）`);
    });
  });

  // 重新生成
  document.getElementById('texRegenerate')?.addEventListener('click', function() {
    generateTexture(prompt, mode, size, frames, style, bg);
  });

  // 全部下载
  document.getElementById('texDownloadAll')?.addEventListener('click', function() {
    alert(`已打包下载 ${frames} 帧素材（模拟）`);
  });

  // 添加历史
  const historyList = document.getElementById('texHistoryList');
  if (historyList) {
    const modeLabel = mode === 'framesequence' ? '帧序列' : '精灵图';
    const newItem = document.createElement('div');
    newItem.className = 'tex-gen-history-item';
    newItem.innerHTML = `
      <div class="tex-gen-history-thumb">🖼️</div>
      <div class="tex-gen-history-info">
        <div class="tex-gen-history-name">${prompt.substring(0, 12)}...</div>
        <div class="tex-gen-history-meta">${modeLabel} · ${size}×${size} · 刚刚</div>
      </div>
    `;
    historyList.insertBefore(newItem, historyList.firstChild);
  }
}
function openBoneBindingPage(modelName, boneType) {
  const grid = document.getElementById('gameGrid');
  if (!grid) return;
  grid.className = 'binding-container';

  // 显示左侧骨骼动作面板
  const leftSidebar = document.getElementById('leftSidebar');
  if (leftSidebar) leftSidebar.style.display = '';
  renderBoneActionsSidebar();

  const boneTypeLabels = { humanoid: '人形骨骼', generic: '通用骨骼', quadruped: '四足骨骼' };

  // Mixamo风格的标记点定义（人形）
  const markers = [
    { id: 'chin', label: '下巴', labelEn: 'Chin', color: '#ff4d4f', x: 50, y: 14, desc: '放置在角色下巴正中心' },
    { id: 'leftWrist', label: '左手腕', labelEn: 'Left Wrist', color: '#52c41a', x: 24, y: 42, desc: '放置在角色左手腕关节处' },
    { id: 'rightWrist', label: '右手腕', labelEn: 'Right Wrist', color: '#52c41a', x: 76, y: 42, desc: '放置在角色右手腕关节处' },
    { id: 'leftElbow', label: '左肘', labelEn: 'Left Elbow', color: '#1890ff', x: 30, y: 32, desc: '放置在角色左肘关节处' },
    { id: 'rightElbow', label: '右肘', labelEn: 'Right Elbow', color: '#1890ff', x: 70, y: 32, desc: '放置在角色右肘关节处' },
    { id: 'leftKnee', label: '左膝', labelEn: 'Left Knee', color: '#faad14', x: 38, y: 62, desc: '放置在角色左膝关节处' },
    { id: 'rightKnee', label: '右膝', labelEn: 'Right Knee', color: '#faad14', x: 62, y: 62, desc: '放置在角色右膝关节处' },
    { id: 'groin', label: '胯部', labelEn: 'Groin', color: '#722ed1', x: 50, y: 50, desc: '放置在角色两腿分叉处' }
  ];

  let currentStep = 0;
  const placed = {};

  function renderBindingPage() {
    const marker = markers[currentStep];
    const placedCount = Object.keys(placed).length;

    grid.innerHTML = `
      <div class="binding-layout">
        <!-- 左侧：3D视口 -->
        <div class="binding-viewport">
          <div class="binding-viewport-header">
            <button class="binding-back" id="bindingBack">← 返回上传</button>
            <div class="binding-viewport-title">${modelName}</div>
            <div class="binding-viewport-badge">${boneTypeLabels[boneType] || '人形骨骼'}</div>
          </div>
          <div class="binding-viewport-body">
            <div class="binding-tpose" id="bindingTpose">
              <svg viewBox="0 0 280 460" xmlns="http://www.w3.org/2000/svg">
                <!-- 身体躯干 -->
                <rect class="bone-part" x="115" y="100" width="50" height="110" rx="8"/>
                <!-- 颈部 -->
                <rect class="bone-part" x="128" y="78" width="24" height="24" rx="6"/>
                <!-- 头部 -->
                <circle class="bone-part" cx="140" cy="55" r="28"/>
                <!-- 左上臂 -->
                <rect class="bone-part" x="30" y="102" width="85" height="18" rx="9"/>
                <!-- 左前臂 -->
                <rect class="bone-part" x="5" y="104" width="30" height="14" rx="7"/>
                <!-- 左手 -->
                <circle class="bone-part" cx="12" cy="111" r="10"/>
                <!-- 右上臂 -->
                <rect class="bone-part" x="165" y="102" width="85" height="18" rx="9"/>
                <!-- 右前臂 -->
                <rect class="bone-part" x="245" y="104" width="30" height="14" rx="7"/>
                <!-- 右手 -->
                <circle class="bone-part" cx="268" cy="111" r="10"/>
                <!-- 左大腿 -->
                <rect class="bone-part" x="116" y="210" width="22" height="90" rx="8"/>
                <!-- 左小腿 -->
                <rect class="bone-part" x="118" y="295" width="18" height="85" rx="7"/>
                <!-- 左脚 -->
                <rect class="bone-part" x="108" y="375" width="38" height="14" rx="5"/>
                <!-- 右大腿 -->
                <rect class="bone-part" x="142" y="210" width="22" height="90" rx="8"/>
                <!-- 右小腿 -->
                <rect class="bone-part" x="144" y="295" width="18" height="85" rx="7"/>
                <!-- 右脚 -->
                <rect class="bone-part" x="134" y="375" width="38" height="14" rx="5"/>
                <!-- 关节点 -->
                <circle class="bone-joint" cx="140" cy="88" r="5"/>
                <circle class="bone-joint" cx="115" cy="111" r="5"/>
                <circle class="bone-joint" cx="165" cy="111" r="5"/>
                <circle class="bone-joint" cx="127" cy="210" r="5"/>
                <circle class="bone-joint" cx="153" cy="210" r="5"/>
                <circle class="bone-joint" cx="127" cy="295" r="5"/>
                <circle class="bone-joint" cx="153" cy="295" r="5"/>
              </svg>
              <!-- 标记点 -->
              ${markers.map((m, i) => {
                const isPlaced = placed[m.id];
                const isCurrent = i === currentStep;
                return `
                  <div class="binding-marker ${isPlaced ? 'placed' : ''} ${isCurrent ? 'current' : ''}"
                       data-marker="${m.id}"
                       style="left:${m.x}%;top:${m.y}%;--marker-color:${m.color}">
                    <div class="binding-marker-dot"></div>
                    <div class="binding-marker-label">${m.label}</div>
                  </div>
                `;
              }).join('')}
            </div>
            <!-- 视口底部提示 -->
            <div class="binding-viewport-tip">
              ${marker ? `请将 <span style="color:${marker.color}">${marker.label}</span> 标记放置到模型对应位置` : '所有标记已放置完成'}
            </div>
          </div>
        </div>

        <!-- 右侧：操作面板 -->
        <div class="binding-sidebar">
          <div class="binding-sidebar-header">
            <div class="binding-sidebar-icon">🦴</div>
            <div class="binding-sidebar-title">骨骼绑定</div>
            <div class="binding-sidebar-sub">Auto-Rigging</div>
          </div>

          <!-- 步骤进度 -->
          <div class="binding-progress">
            <div class="binding-progress-bar">
              <div class="binding-progress-fill" style="width:${(placedCount / markers.length) * 100}%"></div>
            </div>
            <div class="binding-progress-text">${placedCount} / ${markers.length} 已放置</div>
          </div>

          <!-- 当前标记说明 -->
          <div class="binding-marker-info">
            ${marker ? `
              <div class="binding-marker-info-title" style="color:${marker.color}">
                <span class="binding-marker-info-dot" style="background:${marker.color}"></span>
                ${marker.label} (${marker.labelEn})
              </div>
              <div class="binding-marker-info-desc">${marker.desc}</div>
              <div class="binding-marker-info-hint">在左侧模型上点击对应位置放置标记</div>
            ` : `
              <div class="binding-marker-info-title" style="color:#52c41a">
                <span class="binding-marker-info-dot" style="background:#52c41a"></span>
                全部标记已就位
              </div>
              <div class="binding-marker-info-desc">点击「测试绑定」查看骨骼绑定效果</div>
            `}
          </div>

          <!-- 标记列表 -->
          <div class="binding-marker-list">
            <div class="binding-marker-list-title">标记位置</div>
            ${markers.map((m, i) => `
              <div class="binding-marker-list-item ${placed[m.id] ? 'done' : ''} ${i === currentStep ? 'active' : ''}">
                <span class="binding-marker-list-dot" style="background:${m.color}"></span>
                <span class="binding-marker-list-label">${m.label}</span>
                <span class="binding-marker-list-status">${placed[m.id] ? '✓' : (i === currentStep ? '←' : '')}</span>
              </div>
            `).join('')}
          </div>

          <!-- 操作按钮 -->
          <div class="binding-actions">
            <button class="binding-action-btn secondary" id="bindingReset">重置标记</button>
            <button class="binding-action-btn primary" id="bindingTest" ${placedCount < markers.length ? 'disabled' : ''}>
              ${placedCount >= markers.length ? '测试绑定' : '继续放置'}
            </button>
          </div>
        </div>
      </div>
    `;

    // 绑定事件
    bindBindingEvents();
  }

  function bindBindingEvents() {
    // 返回按钮
    document.getElementById('bindingBack')?.addEventListener('click', function() {
      currentWorkflow = 'bone';
      openWorkflow('bone');
    });

    // T-pose区域点击放置标记
    const tpose = document.getElementById('bindingTpose');
    if (tpose) {
      tpose.addEventListener('click', function(e) {
        if (currentStep >= markers.length) return;
        const rect = tpose.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width * 100).toFixed(1);
        const y = ((e.clientY - rect.top) / rect.height * 100).toFixed(1);
        const marker = markers[currentStep];
        placed[marker.id] = { x, y };
        currentStep = Math.min(currentStep + 1, markers.length);
        renderBindingPage();
      });
    }

    // 重置按钮
    document.getElementById('bindingReset')?.addEventListener('click', function() {
      currentStep = 0;
      Object.keys(placed).forEach(k => delete placed[k]);
      renderBindingPage();
    });

    // 测试绑定按钮
    document.getElementById('bindingTest')?.addEventListener('click', function() {
      if (Object.keys(placed).length < markers.length) return;
      this.textContent = '绑定中...';
      this.disabled = true;
      setTimeout(() => {
        openBindingPreview(modelName, boneType);
      }, 1500);
    });

    // 已放置标记可拖拽调整
    tpose?.querySelectorAll('.binding-marker.placed').forEach(el => {
      el.addEventListener('click', function(e) {
        e.stopPropagation();
        const markerId = this.dataset.marker;
        const markerIdx = markers.findIndex(m => m.id === markerId);
        if (markerIdx >= 0 && markerIdx < currentStep) {
          currentStep = markerIdx;
          delete placed[markerId];
          // 删除当前及之后的标记
          for (let i = markerIdx; i < markers.length; i++) {
            delete placed[markers[i].id];
          }
          renderBindingPage();
        }
      });
    });
  }

  renderBindingPage();
}

/* ── 骨骼绑定预览页 ── */
function openBindingPreview(modelName, boneType) {
  const grid = document.getElementById('gameGrid');
  if (!grid) return;
  grid.className = 'binding-container';

  const animations = [
    { name: '待机', icon: '🧍', file: 'Idle.fbx' },
    { name: '行走', icon: '🚶', file: 'Walking.fbx' },
    { name: '奔跑', icon: '🏃', file: 'Running.fbx' },
    { name: '挥剑', icon: '⚔️', file: 'Slash.fbx' },
    { name: '格挡', icon: '🛡️', file: 'Block.fbx' },
    { name: '受击', icon: '💨', file: 'Hit.fbx' },
    { name: '死亡', icon: '💀', file: 'Death.fbx' },
    { name: '跳跃', icon: '🦘', file: 'Jump.fbx' }
  ];

  grid.innerHTML = `
    <div class="binding-preview-layout">
      <div class="binding-preview-top">
        <button class="binding-back" id="bindingPreviewBack">← 返回绑定</button>
        <div class="binding-preview-title">${modelName} · 绑定完成</div>
        <div class="binding-preview-actions">
          <button class="binding-action-btn secondary" id="previewExport">导出模型</button>
          <button class="binding-action-btn primary" id="previewDownload">下载动画包</button>
        </div>
      </div>
      <div class="binding-preview-body">
        <!-- 左侧：动画预览视口 -->
        <div class="binding-preview-viewport">
          <div class="preview-tpose" id="previewTpose">
            <svg viewBox="0 0 280 460" xmlns="http://www.w3.org/2000/svg">
              <rect class="bone-part" x="115" y="100" width="50" height="110" rx="8"/>
              <rect class="bone-part" x="128" y="78" width="24" height="24" rx="6"/>
              <circle class="bone-part" cx="140" cy="55" r="28"/>
              <rect class="bone-part" x="30" y="102" width="85" height="18" rx="9"/>
              <rect class="bone-part" x="5" y="104" width="30" height="14" rx="7"/>
              <circle class="bone-part" cx="12" cy="111" r="10"/>
              <rect class="bone-part" x="165" y="102" width="85" height="18" rx="9"/>
              <rect class="bone-part" x="245" y="104" width="30" height="14" rx="7"/>
              <circle class="bone-part" cx="268" cy="111" r="10"/>
              <rect class="bone-part" x="116" y="210" width="22" height="90" rx="8"/>
              <rect class="bone-part" x="118" y="295" width="18" height="85" rx="7"/>
              <rect class="bone-part" x="108" y="375" width="38" height="14" rx="5"/>
              <rect class="bone-part" x="142" y="210" width="22" height="90" rx="8"/>
              <rect class="bone-part" x="144" y="295" width="18" height="85" rx="7"/>
              <rect class="bone-part" x="134" y="375" width="38" height="14" rx="5"/>
              <circle class="bone-joint" cx="140" cy="88" r="5"/>
              <circle class="bone-joint" cx="115" cy="111" r="5"/>
              <circle class="bone-joint" cx="165" cy="111" r="5"/>
              <circle class="bone-joint" cx="127" cy="210" r="5"/>
              <circle class="bone-joint" cx="153" cy="210" r="5"/>
              <circle class="bone-joint" cx="127" cy="295" r="5"/>
              <circle class="bone-joint" cx="153" cy="295" r="5"/>
            </svg>
          </div>
          <div class="preview-anim-name" id="previewAnimName">当前动画：待机 Idle</div>
          <div class="preview-controls">
            <button class="preview-ctrl-btn" id="previewPrev">⏮</button>
            <button class="preview-ctrl-btn play" id="previewPlay">⏸</button>
            <button class="preview-ctrl-btn" id="previewNext">⏭</button>
          </div>
        </div>

        <!-- 右侧：动画列表 -->
        <div class="binding-preview-list">
          <div class="preview-list-title">可用动画</div>
          <div class="preview-list-items">
            ${animations.map((a, i) => `
              <div class="preview-anim-item ${i === 0 ? 'active' : ''}" data-anim="${a.name}" data-idx="${i}">
                <span class="preview-anim-icon">${a.icon}</span>
                <div class="preview-anim-info">
                  <div class="preview-anim-name-label">${a.name}</div>
                  <div class="preview-anim-file">${a.file}</div>
                </div>
              </div>
            `).join('')}
          </div>
          <!-- 骨骼信息 -->
          <div class="preview-bone-info">
            <div class="preview-bone-info-title">绑定信息</div>
            <div class="preview-bone-info-row"><span>骨骼类型</span><span>${boneType === 'humanoid' ? '人形' : boneType === 'quadruped' ? '四足' : '通用'}</span></div>
            <div class="preview-bone-info-row"><span>骨骼数量</span><span>17 根</span></div>
            <div class="preview-bone-info-row"><span>动画数量</span><span>${animations.length} 个</span></div>
            <div class="preview-bone-info-row"><span>格式</span><span>FBX / GLB</span></div>
          </div>
        </div>
      </div>
    </div>
  `;

  let currentAnimIdx = 0;
  let isPlaying = true;

  function updatePreview() {
    const a = animations[currentAnimIdx];
    document.getElementById('previewAnimName').textContent = `当前动画：${a.name} ${a.name}`;
    document.querySelectorAll('.preview-anim-item').forEach((el, i) => {
      el.classList.toggle('active', i === currentAnimIdx);
    });
  }

  document.getElementById('bindingPreviewBack')?.addEventListener('click', function() {
    openBoneBindingPage(modelName, boneType);
  });

  document.getElementById('previewPrev')?.addEventListener('click', function() {
    currentAnimIdx = (currentAnimIdx - 1 + animations.length) % animations.length;
    updatePreview();
  });

  document.getElementById('previewNext')?.addEventListener('click', function() {
    currentAnimIdx = (currentAnimIdx + 1) % animations.length;
    updatePreview();
  });

  document.getElementById('previewPlay')?.addEventListener('click', function() {
    isPlaying = !isPlaying;
    this.textContent = isPlaying ? '⏸' : '▶';
    const tposeEl = document.getElementById('previewTpose');
    if (tposeEl) tposeEl.classList.toggle('paused', !isPlaying);
  });

  document.querySelectorAll('.preview-anim-item').forEach(el => {
    el.addEventListener('click', function() {
      currentAnimIdx = parseInt(this.dataset.idx);
      updatePreview();
    });
  });

  document.getElementById('previewExport')?.addEventListener('click', function() {
    alert(`已导出「${modelName}」绑定模型（模拟）`);
  });

  document.getElementById('previewDownload')?.addEventListener('click', function() {
    alert(`已下载「${modelName}」动画包，共 ${animations.length} 个动画（模拟）`);
  });
}

function switchToNav(nav) {
  const navMap = { store: '游戏', community: '社区', library: '库', notice: '公告' };
  const page = navMap[nav];
  if (!page) return;
  activeNav = nav;

  document.querySelectorAll('.nav-link').forEach(l => {
    l.classList.toggle('active', l.textContent.trim() === page);
  });

  const hero = document.querySelector('.hero');
  if (hero) hero.style.display = activeNav === 'store' ? '' : 'none';

  const isStore = activeNav === 'store';
  const isCommunity = activeNav === 'community';
  const isLibrary = activeNav === 'library';
  const isNotice = activeNav === 'notice';

  // 底部仅商店页显示
  const siteFooter = document.getElementById('siteFooter');
  if (siteFooter) siteFooter.style.display = isStore ? '' : 'none';

  // 左侧活动栏：仅社区页显示
  const leftSidebar = document.getElementById('leftSidebar');
  if (leftSidebar) {
    leftSidebar.style.display = isCommunity ? '' : 'none';
    if (isCommunity) renderActivityBox();
  }

  // 社区页顶部tab
  const communityTabs = document.getElementById('communityTabs');
  if (communityTabs) communityTabs.style.display = isCommunity ? '' : 'none';

  // 素材类型筛选栏
  const matTypeTabs = document.getElementById('materialTypeTabs');
  if (matTypeTabs) matTypeTabs.style.display = 'none';

  // 右侧筛选栏
  const sidebar = document.getElementById('sidebar');
  const sidebarTitle = document.getElementById('sidebarTitle');
  const sidebarBody = document.getElementById('sidebarBody');

  if (isCommunity) {
    if (sidebar) sidebar.style.display = '';
    if (sidebarTitle) sidebarTitle.textContent = '分类筛选';
    renderCommunitySidebar();
    renderActivityBox();
  } else if (isStore) {
    if (sidebar) sidebar.style.display = '';
    if (sidebarTitle) sidebarTitle.textContent = '分类筛选';
    if (sidebarBody) {
      sidebarBody.innerHTML = `
        <div class="sidebar-level">
          <div class="sidebar-level-label">类型</div>
          <div class="sidebar-main-row" id="sidebarMainRow"></div>
        </div>
        <div class="sidebar-level">
          <div class="sidebar-level-label">分类</div>
          <div class="sidebar-sub-row" id="sidebarSubRow"></div>
        </div>
        <div class="sidebar-level">
          <div class="sidebar-level-label">标签</div>
          <div class="sidebar-subsub-row" id="sidebarSubSubRow"></div>
        </div>
        <div class="sidebar-level">
          <div class="sidebar-level-label">价格</div>
          <div class="sidebar-price-row" id="sidebarPriceRow"></div>
        </div>
      `;
    }
    renderMainCategories();
    renderSubCategories();
    renderSubSubCategories();
    renderPriceFilters();
  } else {
    if (sidebar) sidebar.style.display = 'none';
  }

  // 顶部标题区
  const pageHeader = document.getElementById('pageHeader');
  if (pageHeader) {
    if (isLibrary) {
      pageHeader.style.display = '';
      renderLibraryBanner();
    } else if (isNotice) {
      pageHeader.style.display = '';
      renderNoticeBanner();
    } else {
      pageHeader.style.display = 'none';
      pageHeader.innerHTML = '';
    }
  }

  activeMain = 0;
  activeSub = 0;
  activeSubSub = 0;
  activePrice = null;
  if (!isLibrary) libraryFilter = '全部';
  if (!isNotice) noticeTab = '公告';
  currentWorkflow = null;
  filteredGames = null;
  const searchInput = document.querySelector('.search-input');
  if (searchInput) searchInput.value = '';
}

document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', function(e) {
    e.preventDefault();
    const page = this.textContent.trim();
    const navMap = { '游戏': 'store', '社区': 'community', '库': 'library', '公告': 'notice' };
    const nav = navMap[page];
    if (nav) {
      switchToNav(nav);
      filterGames();
    }
  });
});

/* ── 公告/活动页面 ── */
let noticeTab = '公告';
const noticeData = [
  { type: '公告', tag: '系统', tagColor: 'blue', title: '【公告】AI Game Hub 平台 V2.0 升级公告', date: '2026-06-28', author: '官方', views: 12834, summary: '平台于 6 月 28 日凌晨完成 V2.0 升级，本次升级带来全新社区模块、个人主页、游戏库分类管理等数十项改进。' },
  { type: '公告', tag: '系统', tagColor: 'blue', title: '【公告】关于积分系统与余额系统独立的说明', date: '2026-06-25', author: '官方', views: 9821, summary: '为方便玩家更清晰地使用平台服务，积分（用于AI消耗）与余额（用于购买游戏等虚拟商品）现已独立结算，1元=10000积分。' },
  { type: '公告', tag: '维护', tagColor: 'orange', title: '【维护】6 月 30 日凌晨服务器维护通知', date: '2026-06-24', author: '运营', views: 5421, summary: '为提升服务稳定性，将于 6 月 30 日 02:00-04:00 进行服务器维护，期间部分功能不可用。' },
  { type: '公告', tag: '版本', tagColor: 'green', title: '【版本】社区模块更新：漫画/动漫/小说/音乐专属详情页上线', date: '2026-06-22', author: '产品', views: 7345, summary: '本次更新为社区四类内容接入专属详情页：漫画阅读器、动漫播放器、小说阅读器、音乐播放器。' },
  { type: '公告', tag: '系统', tagColor: 'blue', title: '【公告】素材商店版权声明更新', date: '2026-06-20', author: '官方', views: 4521, summary: '所有素材可商用但需在本平台绑定作品信息，侵权必究。详情请查看版权声明。' },
  { type: '公告', tag: '版本', tagColor: 'green', title: '【版本】游戏库支持自定义分类与快速定位', date: '2026-06-18', author: '产品', views: 6234, summary: '参考 Steam 设计，玩家可在游戏库中新建自定义分类，将游戏归类管理，点击分类按钮可快速筛选。' },
  { type: '活动', tag: '赛事', tagColor: 'red', title: '【赛事】Trae 创造比赛 2026 正式开启', date: '2026-06-15', author: '官方', views: 23456, summary: 'Trae 创造比赛 2026 正式开启！提交你的 AI 游戏作品，赢取百万奖金池。报名截止 7 月 31 日。' },
  { type: '活动', tag: '活动', tagColor: 'purple', title: '【活动】夏日狂欢节 - 全场游戏 7 折起', date: '2026-06-10', author: '运营', views: 15432, summary: '夏日狂欢节来袭！全场付费游戏 7 折起，部分 H5 游戏免费玩。活动时间 6 月 10 日 - 7 月 10 日。' },
  { type: '活动', tag: '活动', tagColor: 'purple', title: '【活动】社区创作激励计划 - 优质内容现金奖励', date: '2026-06-08', author: '运营', views: 8721, summary: '鼓励原创插画、漫画、小说、音乐创作，每周评选优质内容发放现金奖励，最高 5000 元/篇。' },
  { type: '活动', tag: '赛事', tagColor: 'red', title: '【赛事】首届 H5 游戏开发马拉松', date: '2026-06-05', author: '官方', views: 11234, summary: '48 小时极限开发挑战！组队参赛，主题现场公布，获奖作品将上架平台并获得推荐位。' }
];

function renderNoticeBanner() {
  const pageHeader = document.getElementById('pageHeader');
  if (!pageHeader) return;
  pageHeader.innerHTML = `
    <div class="notice-banner">
      <h1 class="notice-banner-title">📢 公告中心</h1>
      <p class="notice-banner-sub">平台动态、版本更新、赛事活动一手掌握</p>
    </div>
    <div class="notice-tabs">
      <button class="notice-tab ${noticeTab === '公告' ? 'active' : ''}" data-tab="公告">公告</button>
      <button class="notice-tab ${noticeTab === '活动' ? 'active' : ''}" data-tab="活动">活动</button>
    </div>
  `;
  pageHeader.querySelectorAll('.notice-tab').forEach(btn => {
    btn.addEventListener('click', function() {
      noticeTab = this.dataset.tab;
      pageHeader.querySelectorAll('.notice-tab').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      renderNoticeList();
    });
  });
  renderNoticeList();
}

function renderNoticeList() {
  const grid = document.getElementById('gameGrid');
  if (!grid) return;
  // 移除其他页面的布局类，保留基础类，再加公告列表类
  grid.classList.remove('game-grid', 'community-grid', 'bili-layout', 'art-masonry', 'novel-layout', 'music-layout');
  grid.classList.add('notice-list-container');
  const list = noticeData.filter(n => n.type === noticeTab);
  grid.innerHTML = list.map(n => `
    <div class="notice-item">
      <div class="notice-item-left">
        <span class="notice-tag ${n.tagColor}">${n.tag}</span>
        <div class="notice-item-body">
          <div class="notice-item-title">${n.title}</div>
          <div class="notice-item-summary">${n.summary}</div>
          <div class="notice-item-meta">
            <span class="notice-meta-author">${n.author}</span>
            <span class="notice-meta-date">${n.date}</span>
            <span class="notice-meta-views">👁️ ${n.views}</span>
          </div>
        </div>
      </div>
      <button class="notice-item-arrow">›</button>
    </div>
  `).join('');
}

document.querySelector('.search-input')?.addEventListener('keyup', function(e) {
  const query = this.value.toLowerCase().trim();
  currentPage = 0;

  // 公告页：在公告数据中搜索
  if (activeNav === 'notice') {
    const grid = document.getElementById('gameGrid');
    if (!grid) return;
    grid.classList.remove('game-grid', 'community-grid', 'bili-layout', 'art-masonry', 'novel-layout', 'music-layout');
    grid.classList.add('notice-list-container');
    const list = noticeData.filter(n => n.type === noticeTab &&
      (n.title.toLowerCase().includes(query) || n.summary.toLowerCase().includes(query)));
    grid.innerHTML = list.map(n => `
      <div class="notice-item">
        <div class="notice-item-left">
          <span class="notice-tag ${n.tagColor}">${n.tag}</span>
          <div class="notice-item-body">
            <div class="notice-item-title">${n.title}</div>
            <div class="notice-item-summary">${n.summary}</div>
            <div class="notice-item-meta">
              <span class="notice-meta-author">${n.author}</span>
              <span class="notice-meta-date">${n.date}</span>
              <span class="notice-meta-views">👁️ ${n.views}</span>
            </div>
          </div>
        </div>
        <button class="notice-item-arrow">›</button>
      </div>
    `).join('') || '<div style="padding:40px;text-align:center;color:#666;">未找到相关公告</div>';
    return;
  }

  const allData = getContentData();
  if (!query) { filteredGames = null; renderGames(); return; }

  filteredGames = allData.filter(g =>
    g.title.toLowerCase().includes(query) ||
    g.desc.toLowerCase().includes(query) ||
    (Array.isArray(g.tags) && g.tags.some(t => t.toLowerCase().includes(query))) ||
    (typeof g.author === 'string' && g.author.toLowerCase().includes(query)) ||
    (typeof g.subCat === 'string' && g.subCat.toLowerCase().includes(query))
  );
  renderGames();
});

document.addEventListener('DOMContentLoaded', () => {
  const leftSidebar = document.getElementById('leftSidebar');
  if (leftSidebar) leftSidebar.style.display = 'none';
  const communityTabs = document.getElementById('communityTabs');
  if (communityTabs) communityTabs.style.display = 'none';

  // 游戏图标按钮点击 → 跳转到该游戏的社区帖子
  document.addEventListener('click', function(e) {
    const forum = e.target.closest('.feed-post-forum');
    if (!forum || !forum.hasAttribute('data-game-idx')) return;
    const gameIdx = parseInt(forum.dataset.gameIdx);
    if (isNaN(gameIdx)) return;
    // 切换到社区游戏社区tab
    activeNav = 'community';
    activeMain = 0;
    activeSub = 0;
    activeSubSub = 0;
    activePrice = null;
    filteredGames = null;
    const hero = document.querySelector('.hero');
    if (hero) hero.style.display = 'none';
    const gameLeftSidebar = document.getElementById('leftSidebar');
    if (gameLeftSidebar) gameLeftSidebar.style.display = '';
    const communityTabs = document.getElementById('communityTabs');
    if (communityTabs) {
      communityTabs.style.display = '';
      communityTabs.innerHTML = `
        <button class="community-tab active" data-page="讨论">讨论</button>
        <button class="community-tab" data-page="攻略">攻略</button>
        <button class="community-tab" data-page="游戏公告">游戏公告</button>
      `;
      // 游戏社区子tab点击
      communityTabs.querySelectorAll('.community-tab').forEach(tab => {
        tab.addEventListener('click', function() {
          communityTabs.querySelectorAll('.community-tab').forEach(t => t.classList.remove('active'));
          this.classList.add('active');
          const g = games[gameIdx];
          const grid = document.getElementById('gameGrid');
          const pg = document.getElementById('pagination');
          if (!grid) return;
          const tabName = this.dataset.page;
          let filtered = gamePostData.filter(p => p.gameIdx === gameIdx);
          grid.className = 'game-grid tieba-feed';
          if (filtered.length === 0) {
            grid.innerHTML = '<div class="feed-empty">暂无' + tabName + '内容</div>';
          } else {
            grid.innerHTML = filtered.map((post, i) => {
              const game = games[post.gameIdx] || games[0];
              const fileHtml = post.fileData
                ? (post.fileType === 'video'
                  ? '<div class="feed-post-file"><video src="' + post.fileData + '" controls muted style="width:100%;max-height:400px;border-radius:8px"></video></div>'
                  : '<div class="feed-post-file"><img src="' + post.fileData + '" style="width:100%;max-height:400px;object-fit:cover;border-radius:8px"></div>')
                : '';
              return '<div class="feed-post game-card" data-post="' + gamePostData.indexOf(post) + '">' +
                '<div class="feed-post-forum" data-game-idx="' + games.indexOf(game) + '">' + game.emoji + ' ' + game.title + '</div>' +
                '<div class="feed-post-user">' +
                  '<div class="feed-post-avatar">' + post.avatar + '</div>' +
                  '<div class="feed-post-user-info">' +
                    '<span class="feed-post-author">' + post.author + '</span>' +
                    '<span class="feed-post-time">' + post.time + '</span>' +
                  '</div>' +
                  '<span class="feed-post-title-inline">' + post.title + '</span>' +
                '</div>' +
                '<div class="feed-post-content" data-expandable>' + post.content + '</div>' +
                '<span class="feed-post-expand" style="display:none" data-expand>展开全部</span>' +
                fileHtml +
                '<div class="feed-post-footer">' +
                  '<span class="feed-post-stat">💬 ' + post.replies + '</span>' +
                  '<span class="feed-post-stat">👁 ' + post.views + '</span>' +
                '</div>' +
              '</div>';
            }).join('');
            grid.querySelectorAll('.feed-post-content[data-expandable]').forEach(el => {
              const expandBtn = el.nextElementSibling;
              if (!expandBtn || !expandBtn.hasAttribute('data-expand')) return;
              setTimeout(() => { if (el.scrollHeight > el.clientHeight + 2) expandBtn.style.display = ''; }, 0);
              expandBtn.addEventListener('click', function(ev) { ev.stopPropagation(); el.classList.toggle('expanded'); this.textContent = el.classList.contains('expanded') ? '收起' : '展开全部'; });
              el.addEventListener('click', function() { el.classList.toggle('expanded'); expandBtn.textContent = el.classList.contains('expanded') ? '收起' : '展开全部'; });
            });
          }
          if (pg) pg.innerHTML = '';
        });
      });
    }
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.style.display = 'none';
    const matTypeTabs = document.getElementById('materialTypeTabs');
    if (matTypeTabs) matTypeTabs.style.display = 'none';
    const pageHeader = document.getElementById('pageHeader');
    if (pageHeader) {
      pageHeader.style.display = '';
      const g = games[gameIdx];
      pageHeader.innerHTML = `
        <div class="game-info-banner">
          <div class="game-back-row">
            <button class="game-back-btn" id="gameBackBtn">← 返回社区</button>
          </div>
          <div class="game-info-left">
            <div class="game-info-icon">${g.emoji}</div>
            <div class="game-info-text">
              <div class="game-info-name-row">
                <div class="game-info-name">${g.title}</div>
                <div class="game-info-name-actions">
                  <button class="game-chip join-group" id="gameJoinGroup" title="加入该游戏的玩家群聊">
                    <span class="game-chip-icon">💬</span><span class="game-chip-text">加入群聊</span>
                  </button>
                  <button class="game-chip follow" id="gameFollow" title="关注该游戏">
                    <span class="game-chip-icon">＋</span><span class="game-chip-text">关注</span>
                  </button>
                </div>
              </div>
              <div class="game-info-desc">${g.desc}</div>
              <div class="game-info-meta">开发者：AI Game Studio</div>
            </div>
          </div>
          <div class="game-info-right">
            <span class="game-info-tag">${g.subCat}</span>
            <span class="game-info-price">${g.free ? '免费' : '¥' + (g.discount ? Math.max(1, Math.round(parseInt(String(g.price).replace(/\D/g,''),10) * 0.7)) : parseInt(String(g.price).replace(/\D/g,''),10))}</span>
          </div>
        </div>
      `;
      // 返回按钮
      document.getElementById('gameBackBtn')?.addEventListener('click', function() {
        // 恢复原始社区tabs
        communityTabs.innerHTML = `
          <button class="community-tab active" data-page="游戏社区">游戏社区</button>
          <button class="community-tab" data-page="插画">插画</button>
          <button class="community-tab" data-page="游戏素材">游戏素材</button>
          <button class="community-tab post-btn" id="newPostBtn">✏️ 发帖</button>
        `;
        document.getElementById('newPostBtn')?.addEventListener('click', function() { openPostCreateModal(); });
        communityTabs.querySelectorAll('.community-tab:not(.post-btn)').forEach(tab => {
          tab.addEventListener('click', function() {
            const page = this.dataset.page;
            communityTabs.querySelectorAll('.community-tab:not(.post-btn)').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            const pageMap = { '游戏社区': 0, '插画': 1, '游戏素材': 2 };
            materialType = '2d';
            materialSubs = [];
            // 离开素材制作工作流时清理
            currentWorkflow = null;
            activeMain = pageMap[page] ?? 0;
            const matTypeTabs = document.getElementById('materialTypeTabs');
            if (matTypeTabs) {
              matTypeTabs.style.display = activeMain === 2 ? 'flex' : 'none';
              matTypeTabs.querySelectorAll('.material-type-btn').forEach(b => b.classList.remove('active'));
              matTypeTabs.querySelector('.material-type-btn[data-type="2d"]')?.classList.add('active');
            }
            const newPostBtn = document.getElementById('newPostBtn');
            if (newPostBtn) newPostBtn.style.display = activeMain === 2 ? 'none' : '';
            renderCommunitySidebar();
            renderActivityBox();
            filterGames();
          });
        });
        renderActivityBox();
        const ph = document.getElementById('pageHeader');
        if (ph) { ph.style.display = 'none'; ph.innerHTML = ''; }
        filterGames();
      });
      // 加入群聊 / 关注 按钮绑定（游戏社区 banner）
      const gameId = g.id || gameIdx;
      const FOLLOW_KEY = 'followedGames';
      const loadFollowed = () => {
        try { const raw = localStorage.getItem(FOLLOW_KEY); if (raw) return JSON.parse(raw); } catch (e) {}
        return [];
      };
      const saveFollowed = (arr) => {
        try { localStorage.setItem(FOLLOW_KEY, JSON.stringify(arr)); } catch (e) {}
      };
      const followBtn = document.getElementById('gameFollow');
      if (followBtn) {
        if (loadFollowed().includes(gameId)) {
          followBtn.classList.add('followed');
          followBtn.querySelector('.game-chip-text').textContent = '已关注';
          followBtn.querySelector('.game-chip-icon').textContent = '✓';
        }
        followBtn.addEventListener('click', function () {
          let arr = loadFollowed();
          if (arr.includes(gameId)) {
            arr = arr.filter(id => id !== gameId);
            this.classList.remove('followed');
            this.querySelector('.game-chip-text').textContent = '关注';
            this.querySelector('.game-chip-icon').textContent = '＋';
          } else {
            arr.push(gameId);
            this.classList.add('followed');
            this.querySelector('.game-chip-text').textContent = '已关注';
            this.querySelector('.game-chip-icon').textContent = '✓';
          }
          saveFollowed(arr);
        });
      }
      const joinGroupBtn = document.getElementById('gameJoinGroup');
      if (joinGroupBtn) {
        joinGroupBtn.addEventListener('click', function () {
          if (!this.classList.contains('joined')) {
            this.classList.add('joined');
            this.querySelector('.game-chip-text').textContent = '已加入群聊';
            this.querySelector('.game-chip-icon').textContent = '✓';
            const groupName = `${g.title} 玩家群`;
            if (!imGroups.find(g2 => g2.name === groupName)) {
              imGroups.push({
                id: 'gg' + Date.now(),
                name: groupName,
                avatar: g.emoji || '🎮',
                online: true,
                unread: 0,
                memberCount: Math.floor(Math.random() * 800) + 200,
                lastMsg: `欢迎来到「${g.title}」玩家群`,
                messages: [
                  { from: 'other', sender: '系统', text: `欢迎来到「${g.title}」玩家群，请文明交流～`, time: '刚刚' }
                ]
              });
              saveImData(IM_GROUPS_KEY, imGroups);
            }
          }
          // 直接打开 IM 弹窗（不调用 openImModal，避免它重置 imActiveContact）
          const imOverlay2 = document.getElementById('imOverlay');
          if (imOverlay2) imOverlay2.classList.add('open');
          const badge2 = document.getElementById('messageBadge');
          if (badge2) badge2.classList.add('hidden');
          imFriends.forEach(f => f.unread = 0);
          imGroups.forEach(g2 => g2.unread = 0);
          // 切到群组 tab 并自动选中刚加入的群组，直接显示聊天框
          imActiveTab = 'groups';
          document.querySelectorAll('.im-sidebar-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.tab === 'groups');
          });
          const newGroupName = `${g.title} 玩家群`;
          imActiveContact = imGroups.find(g2 => g2.name === newGroupName) || imGroups[imGroups.length - 1];
          renderImContacts();
          renderImChat();
        });
      }
    }
    // 左侧活动栏改为该游戏专属活动
    const gameLeftSidebar2 = document.getElementById('leftSidebar');
    if (gameLeftSidebar2) {
      gameLeftSidebar2.style.display = '';
      const body = document.getElementById('activityBoxBody');
      if (body) {
        const g = games[gameIdx];
        body.innerHTML = `
          <div class="activity-item">
            <div class="activity-item-icon">${g.emoji}</div>
            <div class="activity-item-info">
              <div class="activity-item-title">${g.title} 攻略征集</div>
              <div class="activity-item-desc">分享你的通关心得</div>
            </div>
            <span class="activity-item-tag new">新</span>
          </div>
          <div class="activity-item">
            <div class="activity-item-icon">🏆</div>
            <div class="activity-item-info">
              <div class="activity-item-title">${g.title} 排行榜</div>
              <div class="activity-item-desc">本周排名已更新</div>
            </div>
            <span class="activity-item-tag hot">热门</span>
          </div>
          <div class="activity-item">
            <div class="activity-item-icon">🎁</div>
            <div class="activity-item-info">
              <div class="activity-item-title">${g.title} 限时活动</div>
              <div class="activity-item-desc">完成任务领取专属奖励</div>
            </div>
            <span class="activity-item-tag event">活动</span>
          </div>
        `;
      }
    }
    // 过滤该游戏的帖子
    const gamePosts = gamePostData.filter(p => p.gameIdx === gameIdx);
    const grid = document.getElementById('gameGrid');
    const pg = document.getElementById('pagination');
    if (grid) {
      grid.className = 'game-grid tieba-feed';
      if (gamePosts.length === 0) {
        grid.innerHTML = '<div class="feed-empty">该游戏暂无帖子</div>';
      } else {
        grid.innerHTML = gamePosts.map((post, i) => {
          const game = games[post.gameIdx] || games[0];
          const fileHtml = post.fileData
            ? (post.fileType === 'video'
              ? '<div class="feed-post-file"><video src="' + post.fileData + '" controls muted style="width:100%;max-height:400px;border-radius:8px"></video></div>'
              : '<div class="feed-post-file"><img src="' + post.fileData + '" style="width:100%;max-height:400px;object-fit:cover;border-radius:8px"></div>')
            : '';
          return '<div class="feed-post game-card" data-post="' + gamePostData.indexOf(post) + '">' +
            '<div class="feed-post-forum" data-game-idx="' + games.indexOf(game) + '">' + game.emoji + ' ' + game.title + '</div>' +
            '<div class="feed-post-user">' +
              '<div class="feed-post-avatar">' + post.avatar + '</div>' +
              '<div class="feed-post-user-info">' +
                '<span class="feed-post-author">' + post.author + '</span>' +
                '<span class="feed-post-time">' + post.time + '</span>' +
              '</div>' +
              '<span class="feed-post-title-inline">' + post.title + '</span>' +
            '</div>' +
            '<div class="feed-post-content" data-expandable>' + post.content + '</div>' +
            '<span class="feed-post-expand" style="display:none" data-expand>展开全部</span>' +
            fileHtml +
            '<div class="feed-post-footer">' +
              '<span class="feed-post-stat">💬 ' + post.replies + '</span>' +
              '<span class="feed-post-stat">👁 ' + post.views + '</span>' +
            '</div>' +
          '</div>';
        }).join('');
        // 重新绑定展开/收起
        grid.querySelectorAll('.feed-post-content[data-expandable]').forEach(el => {
          const expandBtn = el.nextElementSibling;
          if (!expandBtn || !expandBtn.hasAttribute('data-expand')) return;
          setTimeout(() => {
            if (el.scrollHeight > el.clientHeight + 2) expandBtn.style.display = '';
          }, 0);
          expandBtn.addEventListener('click', function(ev) { ev.stopPropagation(); el.classList.toggle('expanded'); this.textContent = el.classList.contains('expanded') ? '收起' : '展开全部'; });
          el.addEventListener('click', function() { el.classList.toggle('expanded'); expandBtn.textContent = el.classList.contains('expanded') ? '收起' : '展开全部'; });
        });
      }
      if (pg) pg.innerHTML = '';
    }
  });

  // 社区页tab点击
  document.querySelectorAll('.community-tab:not(.post-btn)').forEach(tab => {
    tab.addEventListener('click', function() {
      const page = this.dataset.page;
      document.querySelectorAll('.community-tab:not(.post-btn)').forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      const pageMap = { '游戏社区': 0, '插画': 1, '游戏素材': 2 };
      activeMain = pageMap[page] ?? 0;
      materialType = '2d';
      materialSubs = [];
      // 离开素材制作工作流时清理
      currentWorkflow = null;

      // 显示/隐藏素材类型筛选栏和发帖按钮
      const matTypeTabs = document.getElementById('materialTypeTabs');
      if (matTypeTabs) {
        matTypeTabs.style.display = activeMain === 2 ? 'flex' : 'none';
        matTypeTabs.querySelectorAll('.material-type-btn').forEach(b => b.classList.remove('active'));
        matTypeTabs.querySelector('.material-type-btn[data-type="2d"]')?.classList.add('active');
      }
      const newPostBtn = document.getElementById('newPostBtn');
      if (newPostBtn) newPostBtn.style.display = activeMain === 2 ? 'none' : '';

      renderCommunitySidebar();
      renderActivityBox();
      const grid = document.getElementById('gameGrid');
      const pg = document.getElementById('pagination');
      if (activeMain === 0) {
        grid.className = 'game-grid tieba-feed';
        grid.innerHTML = gamePostData.length > 0
          ? gamePostData.map((post, i) => {
              const game = games[post.gameIdx] || games[0];
              const fileHtml = post.fileData
                ? (post.fileType === 'video'
                  ? '<div class="feed-post-file"><video src="' + post.fileData + '" controls muted style="width:100%;max-height:400px;border-radius:8px"></video></div>'
                  : '<div class="feed-post-file"><img src="' + post.fileData + '" style="width:100%;max-height:400px;object-fit:cover;border-radius:8px"></div>')
                : '';
              return '<div class="feed-post game-card" data-post="' + i + '">' +
                '<div class="feed-post-forum" data-game-idx="' + games.indexOf(game) + '">' + game.emoji + ' ' + game.title + '</div>' +
                '<div class="feed-post-user">' +
                  '<div class="feed-post-avatar">' + post.avatar + '</div>' +
                  '<div class="feed-post-user-info">' +
                    '<span class="feed-post-author">' + post.author + '</span>' +
                    '<span class="feed-post-time">' + post.time + '</span>' +
                  '</div>' +
                  '<span class="feed-post-title-inline">' + post.title + '</span>' +
                '</div>' +
                '<div class="feed-post-content" data-expandable>' + post.content + '</div>' +
          '<span class="feed-post-expand" style="display:none" data-expand>展开全部</span>' +
                fileHtml +
                '<div class="feed-post-footer">' +
                  '<span class="feed-post-stat">💬 ' + post.replies + '</span>' +
                  '<span class="feed-post-stat">👁 ' + post.views + '</span>' +
                '</div>' +
              '</div>';
            }).join('')
          : '<div class="feed-empty">暂无帖子，点击「发帖」发布第一条吧</div>';
        if (pg) pg.innerHTML = '';
      } else if (activeMain === 1) {
        // 插画tab：插画卡片
        grid.className = 'game-grid art-masonry';
        filterGames();
        if (pg) pg.innerHTML = '';
      } else {
        // 素材tab
        renderMaterialContent();
      }
    });
  });

  renderMainCategories();
  renderSubCategories();
  renderSubSubCategories();
  renderPriceFilters();
  renderGames();
  filterGames();

  document.querySelector('.user-avatar')?.addEventListener('click', openUserHomeModal);
  document.getElementById('rechargeBtn')?.addEventListener('click', openRechargeModal);
  document.getElementById('newPostBtn')?.addEventListener('click', function() { openPostCreateModal(); });
  renderHeaderAvatar();
  renderHeaderBalance();

  // 响应式筛选抽屉（1200px 以下显示）
  const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  const sidebarEl = document.getElementById('sidebar');
  if (sidebarToggleBtn && sidebarOverlay && sidebarEl) {
    const openDrawer = () => {
      sidebarEl.classList.add('open');
      sidebarOverlay.classList.add('open');
    };
    const closeDrawer = () => {
      sidebarEl.classList.remove('open');
      sidebarOverlay.classList.remove('open');
    };
    sidebarToggleBtn.addEventListener('click', openDrawer);
    sidebarOverlay.addEventListener('click', closeDrawer);
  }

  // 素材类型按钮点击（切换类型）
  document.querySelectorAll('.material-type-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      // 如果点的是箭头区域，不切换类型，只展开下拉
      if (e.target.closest('.material-arrow-icon')) return;
      materialType = this.dataset.type;
      materialSubs = [];
      document.querySelectorAll('.material-type-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      // 清除所有下拉框的勾选
      document.querySelectorAll('.material-dropdown input[type="checkbox"]').forEach(cb => cb.checked = false);
      // 同步侧边栏子分类选中状态
      if (activeNav === 'community' && activeMain === 2) {
        const matSidebar = document.getElementById('materialSidebar');
        if (matSidebar) {
          matSidebar.querySelectorAll('.material-sidebar-btn').forEach(b => b.classList.remove('active'));
          matSidebar.querySelector('.material-sidebar-btn[data-tab="store"]')?.classList.add('active');
        }
        materialTab = 'store';
      }
      renderMaterialContent();
    });
  });

  // 箭头点击展开/收起下拉框
  document.querySelectorAll('.material-arrow-icon').forEach(icon => {
    icon.addEventListener('click', function(e) {
      e.stopPropagation();
      const wrap = this.closest('.material-type-wrap');
      const wasOpen = wrap.classList.contains('open');
      document.querySelectorAll('.material-type-wrap').forEach(w => w.classList.remove('open'));
      if (!wasOpen) wrap.classList.add('open');
    });
  });

  // 下拉框选项勾选
  document.querySelectorAll('.material-dropdown input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', function() {
      const wrap = this.closest('.material-type-wrap');
      const checked = Array.from(wrap.querySelectorAll('.material-dropdown input:checked')).map(c => c.dataset.sub);
      materialSubs = checked;
      renderMaterialContent();
    });
  });

  // 点击外部关闭所有下拉框
  document.addEventListener('click', function() {
    document.querySelectorAll('.material-type-wrap').forEach(w => w.classList.remove('open'));
  });
});

// 同步首页 header 余额
function renderHeaderBalance() {
  const el = document.querySelector('#rechargeBtn .balance');
  if (!el || typeof userProfile.balance !== 'number') return;
  el.textContent = '¥' + userProfile.balance.toFixed(2);
}

// 同步首页 header 头像
function renderHeaderAvatar() {
  const el = document.querySelector('.user-avatar');
  if (!el || !userProfile) return;
  if (userProfile.avatar && userProfile.avatar.startsWith('data:')) {
    el.innerHTML = `<img src="${userProfile.avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
  } else {
    el.innerHTML = `<span>${userProfile.avatar || '👤'}</span>`;
  }
}

/* ── 个人主页弹窗 ── */
// 持久化用户资料
let userProfile = (function() {
  try {
    const raw = localStorage.getItem('userProfile');
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
})();

function saveUserProfile() {
  try { localStorage.setItem('userProfile', JSON.stringify(userProfile)); } catch (e) {}
}

function defaultUserProfile() {
  return {
    name: '玩家_Trae',
    avatar: '👤',
    signature: 'AI 游戏探索者，喜欢尝试各种新奇玩法',
    gender: '保密',
    level: 18,
    exp: 2680,
    expMax: 4000,
    joinDate: '2024-08-12',
    hobbies: ['冒险', '策略', '解谜', 'RPG'],
    friendCount: 86,
    followerCount: 142,
    likedCount: 1024,
    balance: 128.00
  };
}

if (!userProfile) {
  userProfile = defaultUserProfile();
  saveUserProfile();
}
// 兼容老数据：补齐 balance 字段
if (typeof userProfile.balance !== 'number') {
  userProfile.balance = 128.00;
  saveUserProfile();
}

// ========== 充值弹窗 ==========
function openRechargeModal() {
  closeRechargeModal();
  const overlay = document.createElement('div');
  overlay.className = 'recharge-overlay';
  overlay.id = 'rechargeOverlay';

  // 快捷金额选项
  const amounts = [10, 30, 50, 100, 200, 500];
  // 支付方式
  const payMethods = [
    { id: 'wechat', name: '微信支付', icon: '💚' },
    { id: 'alipay', name: '支付宝', icon: '🔵' }
  ];

  let selectedAmount = 100;
  let customAmount = '';
  let selectedPay = 'wechat';

  const u = userProfile;
  const balanceText = '¥' + (u.balance || 0).toFixed(2);

  overlay.innerHTML = `
    <div class="recharge-modal" id="rechargeModal">
      <div class="recharge-head">
        <div class="recharge-title">账户充值</div>
        <button class="recharge-close" id="rechargeClose" title="关闭">×</button>
      </div>
      <div class="recharge-body">
        <div class="recharge-balance-row">
          <span class="recharge-balance-label">当前余额</span>
          <span class="recharge-balance-value">${balanceText}</span>
        </div>
        <div class="recharge-section">
          <div class="recharge-section-title">选择充值金额</div>
          <div class="recharge-amounts" id="rechargeAmounts">
            ${amounts.map(a => `
              <div class="recharge-amount ${a === selectedAmount ? 'active' : ''}" data-amount="${a}">
                <span class="recharge-amount-num">¥${a}</span>
              </div>
            `).join('')}
          </div>
          <div class="recharge-custom">
            <span class="recharge-custom-label">自定义金额</span>
            <div class="recharge-custom-input-wrap">
              <span class="recharge-currency">¥</span>
              <input type="number" id="rechargeCustomInput" placeholder="输入金额" min="1" step="0.01" value="">
            </div>
          </div>
        </div>
        <div class="recharge-section">
          <div class="recharge-section-title">选择支付方式</div>
          <div class="recharge-pay-methods" id="rechargePayMethods">
            ${payMethods.map(m => `
              <div class="recharge-pay-method ${m.id === selectedPay ? 'active' : ''}" data-pay="${m.id}">
                <span class="recharge-pay-icon">${m.icon}</span>
                <span class="recharge-pay-name">${m.name}</span>
                <span class="recharge-pay-check">✓</span>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="recharge-summary">
          <div class="recharge-summary-row">
            <span>充值金额</span>
            <span class="recharge-summary-amount" id="rechargeSummaryAmount">¥100.00</span>
          </div>
          <div class="recharge-summary-row">
            <span>充值后余额</span>
            <span class="recharge-summary-total" id="rechargeSummaryTotal">¥${(u.balance + selectedAmount).toFixed(2)}</span>
          </div>
        </div>
        <div class="recharge-notice">
          <div class="recharge-notice-title">充值说明</div>
          <ul class="recharge-notice-list">
            <li>余额用于购买游戏等虚拟商品，与AI消耗积分相互独立（1元=10000积分）。</li>
            <li>充值成功后金额实时到账，可在「我的余额」中查看。</li>
            <li>虚拟商品一经购买，除法律规定的情形外，不予退款。</li>
          </ul>
        </div>
      </div>
      <div class="recharge-foot">
        <button class="recharge-cancel-btn" id="rechargeCancel">取消</button>
        <button class="recharge-confirm-btn" id="rechargeConfirm">确认充值 ¥<span id="rechargeConfirmAmount">100.00</span></button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const modal = overlay.querySelector('#rechargeModal');
  const amountsBox = overlay.querySelector('#rechargeAmounts');
  const customInput = overlay.querySelector('#rechargeCustomInput');
  const payBox = overlay.querySelector('#rechargePayMethods');
  const summaryAmount = overlay.querySelector('#rechargeSummaryAmount');
  const summaryTotal = overlay.querySelector('#rechargeSummaryTotal');
  const confirmAmount = overlay.querySelector('#rechargeConfirmAmount');
  const confirmBtn = overlay.querySelector('#rechargeConfirm');

  // 获取当前选中金额
  function getCurrentAmount() {
    const custom = parseFloat(customInput.value);
    if (!isNaN(custom) && custom > 0) return Math.round(custom * 100) / 100;
    return selectedAmount;
  }

  // 刷新汇总区
  function refreshSummary() {
    const amt = getCurrentAmount();
    summaryAmount.textContent = '¥' + amt.toFixed(2);
    summaryTotal.textContent = '¥' + (u.balance + amt).toFixed(2);
    confirmAmount.textContent = amt.toFixed(2);
  }

  // 选中快捷金额
  amountsBox.querySelectorAll('.recharge-amount').forEach(el => {
    el.addEventListener('click', function() {
      selectedAmount = parseFloat(this.dataset.amount);
      customInput.value = '';
      amountsBox.querySelectorAll('.recharge-amount').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      refreshSummary();
    });
  });

  // 自定义金额输入
  customInput.addEventListener('input', function() {
    const v = parseFloat(this.value);
    if (!isNaN(v) && v > 0) {
      amountsBox.querySelectorAll('.recharge-amount').forEach(b => b.classList.remove('active'));
    } else if (this.value === '') {
      // 空时恢复高亮选中的快捷金额
      amountsBox.querySelectorAll('.recharge-amount').forEach(b => {
        b.classList.toggle('active', parseFloat(b.dataset.amount) === selectedAmount);
      });
    }
    refreshSummary();
  });

  // 切换支付方式
  payBox.querySelectorAll('.recharge-pay-method').forEach(el => {
    el.addEventListener('click', function() {
      selectedPay = this.dataset.pay;
      payBox.querySelectorAll('.recharge-pay-method').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
    });
  });

  // 确认充值
  confirmBtn.addEventListener('click', function() {
    const amt = getCurrentAmount();
    if (!amt || amt <= 0) {
      alert('请输入有效的充值金额');
      return;
    }
    if (amt > 50000) {
      alert('单次充值金额不能超过 ¥50000');
      return;
    }
    // 模拟支付流程
    confirmBtn.disabled = true;
    confirmBtn.textContent = '支付中...';
    setTimeout(() => {
      userProfile.balance = Math.round((userProfile.balance + amt) * 100) / 100;
      saveUserProfile();
      renderHeaderBalance();
      closeRechargeModal();
      alert(`充值成功！\n本次充值：¥${amt.toFixed(2)}\n账户余额：¥${userProfile.balance.toFixed(2)}`);
    }, 800);
  });

  // 关闭事件
  overlay.querySelector('#rechargeClose').addEventListener('click', closeRechargeModal);
  overlay.querySelector('#rechargeCancel').addEventListener('click', closeRechargeModal);
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) closeRechargeModal();
  });

  // ESC 关闭
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      closeRechargeModal();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);
}

function closeRechargeModal() {
  const ex = document.getElementById('rechargeOverlay');
  if (ex) ex.remove();
}

function openUserHomeModal() {
  closeUserHomeModal();
  const overlay = document.createElement('div');
  overlay.className = 'user-modal-overlay';
  overlay.id = 'userHomeOverlay';

  const u = userProfile;
  const libCount = getLibraryData().length;
  const catCount = libraryCategories.length;
  const recent = getLibraryData().slice(0, 4);

  // 等级进度条百分比
  const expPct = Math.min(100, Math.round((u.exp / u.expMax) * 100));

  const recentHtml = recent.map(g => `
    <div class="user-recent-item">
      <div class="user-recent-emoji">${g.emoji}</div>
      <div class="user-recent-info">
        <div class="user-recent-title">${g.title}</div>
        <div class="user-recent-sub">${g.subCat}</div>
      </div>
    </div>
  `).join('');

  const hobbyHtml = u.hobbies.map(h => `<span class="user-hobby-chip">${h}</span>`).join('');

  overlay.innerHTML = `
    <div class="user-modal" id="userHomeDialog">
      <button class="user-modal-close" id="userHomeClose">×</button>

      <!-- 封面区 -->
      <div class="user-cover">
        <div class="user-cover-bg"></div>
        <div class="user-cover-content">
          <div class="user-avatar-lg">${u.avatar.startsWith('data:') ? `<img src="${u.avatar}" class="user-avatar-img">` : u.avatar}</div>
          <div class="user-cover-text">
            <div class="user-name-row">
              <span class="user-name">${u.name}</span>
              <span class="user-level">Lv.${u.level}</span>
            </div>
            <div class="user-signature">${u.signature}</div>
            <div class="user-meta-row">
              <span class="user-meta-item">📅 ${u.joinDate}</span>
              <span class="user-meta-item">${u.gender}</span>
              <button class="user-edit-btn" id="userEditBtn">✏ 编辑资料</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 等级进度 -->
      <div class="user-exp-section">
        <div class="user-exp-head">
          <span class="user-exp-label">等级 ${u.level} · 距离下一级</span>
          <span class="user-exp-value">${u.exp} / ${u.expMax}</span>
        </div>
        <div class="user-exp-bar">
          <div class="user-exp-fill" style="width:${expPct}%"></div>
        </div>
      </div>

      <!-- 数据统计 -->
      <div class="user-stats">
        <div class="user-stat">
          <div class="user-stat-num">${libCount}</div>
          <div class="user-stat-label">游戏</div>
        </div>
        <div class="user-stat">
          <div class="user-stat-num">${catCount}</div>
          <div class="user-stat-label">分类</div>
        </div>
        <div class="user-stat">
          <div class="user-stat-num">${u.friendCount}</div>
          <div class="user-stat-label">好友</div>
        </div>
        <div class="user-stat">
          <div class="user-stat-num">${u.followerCount}</div>
          <div class="user-stat-label">粉丝</div>
        </div>
        <div class="user-stat">
          <div class="user-stat-num">${u.likedCount}</div>
          <div class="user-stat-label">获赞</div>
        </div>
      </div>

      <!-- 兴趣爱好 -->
      <div class="user-section">
        <div class="user-section-title">兴趣爱好</div>
        <div class="user-hobby-list">${hobbyHtml}</div>
      </div>

      <!-- 最近游玩 -->
      <div class="user-section">
        <div class="user-section-title">最近游玩</div>
        <div class="user-recent-list">${recentHtml}</div>
      </div>

      <!-- 操作按钮已移除 -->
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.querySelector('#userHomeClose').addEventListener('click', closeUserHomeModal);
  overlay.querySelector('#userEditBtn').addEventListener('click', openEditProfile);
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeUserHomeModal();
  });
}

function closeUserHomeModal() {
  const ex = document.getElementById('userHomeOverlay');
  if (ex) ex.remove();
}

/* ── 游戏详情页 + 下载/启动 ── */
// 已下载游戏 ID 列表（持久化）
let installedGames = (function() {
  try {
    const raw = localStorage.getItem('installedGames');
    return raw ? JSON.parse(raw) : [];
  } catch (e) { return []; }
})();

function saveInstalledGames() {
  try { localStorage.setItem('installedGames', JSON.stringify(installedGames)); } catch (e) {}
}

function isGameInstalled(id) {
  return installedGames.includes(Number(id));
}

function installGame(id) {
  if (!installedGames.includes(Number(id))) {
    installedGames.push(Number(id));
    saveInstalledGames();
  }
}

function uninstallGame(id) {
  installedGames = installedGames.filter(g => g !== Number(id));
  saveInstalledGames();
}

// 让库数据基于已下载列表（替换原来的前 24 个）
function getLibraryData() {
  return games.filter(g => installedGames.includes(g.id)).map(g => ({ ...g, owned: true }));
}

// 打开游戏详情页
function openGameDetail(item) {
  closeGameDetail();
  const overlay = document.createElement('div');
  overlay.className = 'game-detail-overlay';
  overlay.id = 'gameDetailOverlay';

  const installed = isGameInstalled(item.id) || item.subCat === 'H5';
  const priceNum = parseInt(String(item.price).replace(/[^\d]/g, ''), 10) || 0;
  const discountNum = item.discount ? Math.max(1, Math.round(priceNum * 0.7)) : priceNum;

  // 模拟截图（用 emoji 重复 4 张）
  const screenshots = [0,1,2,3].map(i => `
    <div class="detail-screenshot"><span>${item.emoji}</span></div>
  `).join('');

  // 评测
  const reviews = [
    { user: '夜雨', avatar: '🌙', text: '剧情很扎实，玩了 30 小时停不下来。', time: '2 天前' },
    { user: '兔子先生', avatar: '🐰', text: '美术风格独特，BGM 也好听。', time: '1 周前' },
    { user: '青鸟', avatar: '🐦', text: '操作手感一般，但创意十足。', time: '3 周前' }
  ];
  const reviewHtml = reviews.map(r => `
    <div class="detail-review">
      <div class="detail-review-avatar">${r.avatar}</div>
      <div class="detail-review-body">
        <div class="detail-review-head">
          <span class="detail-review-user">${r.user}</span>
          <span class="detail-review-time">${r.time}</span>
        </div>
        <div class="detail-review-text">${r.text}</div>
      </div>
    </div>
  `).join('');

  const tagsHtml = item.tags.map(t => `<span class="detail-tag">${t}</span>`).join('');

  overlay.innerHTML = `
    <div class="game-detail" id="gameDetailDialog">
      <button class="detail-close" id="detailClose">×</button>

      <!-- 顶部封面 -->
      <div class="detail-hero">
        <div class="detail-hero-bg">${item.emoji}</div>
        <div class="detail-hero-content">
          <div class="detail-hero-icon">${item.emoji}</div>
          <div class="detail-hero-info">
            <div class="detail-title">${item.title}</div>
            <div class="detail-subtitle">${item.desc}</div>
            <div class="detail-hero-tags">${tagsHtml}</div>
          </div>
        </div>
      </div>

      <div class="detail-body">
        <!-- 左侧：截图 + 简介 + 评测 -->
        <div class="detail-main">
          <div class="detail-section">
            <div class="detail-section-title">游戏截图</div>
            <div class="detail-screenshots">${screenshots}</div>
          </div>

          <div class="detail-section">
            <div class="detail-section-title">关于这款游戏</div>
            <p class="detail-desc">${item.desc}。本作由 AI Game Hub 独家发行，融合了多种玩法元素，为玩家带来独特体验。游戏支持单人模式和在线对战，画面精美，操作流畅。</p>
            <p class="detail-desc">在 ${item.title} 的世界里，${item.desc}。丰富的关卡设计、动人的剧情、出色的音效，让你沉浸其中。</p>
          </div>

          <div class="detail-section">
            <div class="detail-section-title">玩家评测</div>
            <div class="detail-reviews">${reviewHtml}</div>
          </div>
        </div>

        <!-- 右侧：购买/下载栏 -->
        <div class="detail-sidebar">
          <div class="detail-buy-card">
            <div class="detail-price-row">
              ${item.free ? `<span class="detail-price free">免费</span>` :
                item.discount ? `<span class="detail-price paid">¥${discountNum}</span><span class="detail-price-original">¥${priceNum}</span><span class="detail-discount-tag">-30%</span>` :
                `<span class="detail-price paid">¥${priceNum}</span>`}
            </div>

            ${installed ? `
              <button class="detail-action-btn launch" id="detailLaunch">▶ 启动游戏</button>
              ${item.subCat === 'H5' ? '' : `<button class="detail-action-btn uninstall" id="detailUninstall">卸载</button>`}
              <div class="detail-installed-tip">✓ ${item.subCat === 'H5' ? '可直接启动' : '已安装到本地'}</div>
            ` : item.subCat === 'H5' ? `
              <button class="detail-action-btn launch" id="detailLaunch">▶ 立即启动</button>
              <div class="detail-installed-tip">H5 游戏，无需下载</div>
            ` : `
              <button class="detail-action-btn download" id="detailDownload">${item.free ? '下载游戏' : '购买并下载'}</button>
            `}

            <div class="detail-info-list">
              <div class="detail-info-row"><span>类型</span><span>${item.subCat}</span></div>
              <div class="detail-info-row"><span>开发商</span><span>AI Game Studio</span></div>
              <div class="detail-info-row"><span>发行商</span><span>AI Game Hub</span></div>
              <div class="detail-info-row"><span>发行日期</span><span>2025-06-12</span></div>
              <div class="detail-info-row"><span>容量</span><span>${5 + (item.id % 50)} GB</span></div>
              <div class="detail-info-row"><span>语言</span><span>简体中文 / English</span></div>
            </div>
          </div>

          <div class="detail-tags-card">
            <div class="detail-section-title">标签</div>
            <div class="detail-tags-list">${tagsHtml}</div>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.querySelector('#detailClose').addEventListener('click', closeGameDetail);
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeGameDetail();
  });

  // 下载按钮
  const dlBtn = overlay.querySelector('#detailDownload');
  if (dlBtn) {
    dlBtn.addEventListener('click', function() {
      const original = this.textContent;
      this.disabled = true;
      this.textContent = '下载中... 0%';
      let p = 0;
      const timer = setInterval(() => {
        p += Math.random() * 18 + 6;
        if (p >= 100) {
          p = 100;
          clearInterval(timer);
          this.textContent = '下载完成 ✓';
          setTimeout(() => {
            installGame(item.id);
            closeGameDetail();
            // 刷新当前视图
            filterGames();
            renderHeaderAvatar();
          }, 600);
        } else {
          this.textContent = `下载中... ${Math.floor(p)}%`;
        }
      }, 300);
    });
  }

  // 启动按钮
  const launchBtn = overlay.querySelector('#detailLaunch');
  if (launchBtn) {
    launchBtn.addEventListener('click', function() {
      const original = this.textContent;
      this.textContent = '启动中...';
      setTimeout(() => {
        this.textContent = original;
        alert(`▶ 正在启动「${item.title}」...（模拟）`);
      }, 800);
    });
  }

  // 卸载按钮
  const unBtn = overlay.querySelector('#detailUninstall');
  if (unBtn) {
    unBtn.addEventListener('click', () => {
      if (confirm(`确定卸载「${item.title}」？`)) {
        uninstallGame(item.id);
        closeGameDetail();
        filterGames();
      }
    });
  }
}

function closeGameDetail() {
  const ex = document.getElementById('gameDetailOverlay');
  if (ex) ex.remove();
}

/* ── 插画全屏查看器 ── */
// 根据作品 id 生成稳定评论
function generateComments(item) {
  const pool = [
    { user: '夜雨声烦', avatar: '🌙', text: '这构图绝了，求笔刷！' },
    { user: '青鸟', avatar: '🐦', text: '色彩搭配好舒服，收藏了~' },
    { user: '兔子先生', avatar: '🐰', text: '请问有过程图吗？想学习一下' },
    { user: '星河', avatar: '✨', text: '这个画风我超爱！' },
    { user: '柠檬茶', avatar: '🍋', text: '光影处理得太细腻了' },
    { user: '云端漫步', avatar: '☁️', text: '已设为壁纸，谢谢作者' },
    { user: '深海鱼', avatar: '🐟', text: '看一眼就沦陷了' },
    { user: '风信子', avatar: '🌸', text: '太美了，期待新作！' }
  ];
  const times = ['2小时前', '5小时前', '昨天', '2天前', '3天前', '1周前'];
  const seed = item.id || 0;
  const count = 3 + (seed % 3); // 3~5 条
  const result = [];
  for (let i = 0; i < count; i++) {
    const p = pool[(seed + i) % pool.length];
    result.push({ ...p, time: times[(seed + i) % times.length] });
  }
  return result;
}

// 评论折叠/展开：超长评论默认折叠3行，展开后用滚轮观看
function applyCommentCollapse(scope) {
  if (!scope) return;
  const texts = scope.matches('.cm-text') ? [scope] : scope.querySelectorAll('.cm-text');
  texts.forEach(t => {
    if (t.dataset.cmInit) return;
    t.dataset.cmInit = '1';
    // 用 rAF 确保布局完成后再检测，避免插入瞬间测量不准
    requestAnimationFrame(() => {
      if (t.scrollHeight > t.clientHeight + 2) {
        const toggle = document.createElement('span');
        toggle.className = 'cm-toggle';
        toggle.textContent = '展开';
        t.parentElement.appendChild(toggle);
        toggle.addEventListener('click', function() {
          const expanded = t.classList.toggle('expanded');
          this.textContent = expanded ? '收起' : '展开';
        });
      }
    });
  });
}

function bindStatBtns(overlay, item) {
  // 点赞
  overlay.querySelector('#artViewerLike').addEventListener('click', function() {
    this.classList.toggle('active');
    const active = this.classList.contains('active');
    this.innerHTML = active ? `👍 ${item.likes + 1}` : `👍 ${item.likes}`;
  });
  // 收藏
  overlay.querySelector('#artViewerFav').addEventListener('click', function() {
    this.classList.toggle('active');
    const base = item.favs || Math.floor(item.likes * 0.6);
    const active = this.classList.contains('active');
    this.innerHTML = active ? `★ ${base + 1}` : `★ ${base}`;
  });
  // 分享
  overlay.querySelector('#artViewerShare').addEventListener('click', () => {
    alert('已复制作品链接（模拟）');
  });
}

function openArtworkViewer(item, allData) {
  closeArtworkViewer();
  // 只看插画
  const artworks = (allData || getContentData()).filter(g => g.cat === '插画');
  let idx = artworks.findIndex(g => g.id === item.id);
  if (idx < 0) idx = 0;

  const overlay = document.createElement('div');
  overlay.className = 'art-viewer-overlay';
  overlay.id = 'artViewerOverlay';

  const cur = artworks[idx];
  const tagsHtml = cur.tags.map(t => `<span class="art-viewer-tag">${t}</span>`).join('');
  const priceBadge = cur.free
    ? `<span class="art-viewer-price free">免费</span>`
    : (cur.discount
        ? `<span class="art-viewer-price discount">¥${Math.max(1, Math.round((parseInt(String(cur.price).replace(/\D/g,''),10)||0)*0.7))}</span>`
        : `<span class="art-viewer-price paid">¥${parseInt(String(cur.price).replace(/\D/g,''),10)||0}</span>`);

  overlay.innerHTML = `
    <button class="art-viewer-close" id="artViewerClose">×</button>
    ${artworks.length > 1 ? `
      <button class="art-viewer-nav prev" id="artViewerPrev">‹</button>
      <button class="art-viewer-nav next" id="artViewerNext">›</button>
    ` : ''}
    <div class="art-viewer-container">
      <div class="art-viewer-image" id="artViewerImage">
        ${cur.fileData
          ? `<img src="${cur.fileData}" style="width:100%;height:100%;object-fit:contain;border-radius:12px">`
          : `<span class="art-viewer-emoji">${cur.emoji}</span>`}
      </div>
      <div class="art-viewer-info">
        <div class="art-viewer-header">
          <div class="art-viewer-author">
            <div class="art-viewer-author-avatar">${cur.emoji}</div>
            <div>
              <div class="art-viewer-author-name">${cur.author}</div>
              <div class="art-viewer-cat">${cur.subCat || '全部'}</div>
            </div>
          </div>
          ${priceBadge}
        </div>
        <div class="art-viewer-tags">${tagsHtml}</div>
        <div class="art-viewer-stats">
          <span class="art-viewer-stat">👁️ ${cur.views || (cur.likes * 3)}</span>
          <button class="art-viewer-stat-btn like" id="artViewerLike">👍 ${cur.likes}</button>
          <button class="art-viewer-stat-btn fav" id="artViewerFav">★ ${cur.favs || Math.floor(cur.likes * 0.6)}</button>
          <button class="art-viewer-stat-btn share" id="artViewerShare">分享</button>
        </div>
        <div class="art-viewer-counter">${idx + 1} / ${artworks.length}</div>
        <div class="art-viewer-comments-section">
          <div class="art-viewer-comments-title">评论 ${cur.comments}</div>
          <div class="art-viewer-comment-input-wrap">
            <input type="text" id="artViewerCommentInput" class="art-viewer-comment-input" placeholder="说点什么...">
            <button id="artViewerCommentSend" class="art-viewer-comment-send">发布</button>
          </div>
          <div class="art-viewer-comments-list" id="artViewerCommentsList">
            ${generateComments(cur).map(c => `
              <div class="art-viewer-comment">
                <div class="art-viewer-comment-avatar">${c.avatar}</div>
                <div class="art-viewer-comment-body">
                  <div class="art-viewer-comment-head">
                    <span class="art-viewer-comment-user">${c.user}</span>
                    <span class="art-viewer-comment-time">${c.time}</span>
                  </div>
                  <div class="art-viewer-comment-text cm-text">${c.text}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  applyCommentCollapse(overlay.querySelector('#artViewerCommentsList'));

  // 切换插画
  function show(i) {
    idx = (i + artworks.length) % artworks.length;
    const c = artworks[idx];
    const img = overlay.querySelector('#artViewerImage');
    img.innerHTML = c.fileData
      ? `<img src="${c.fileData}" style="width:100%;height:100%;object-fit:contain;border-radius:12px">`
      : `<span class="art-viewer-emoji">${c.emoji}</span>`;
    overlay.querySelector('.art-viewer-author-avatar').textContent = c.emoji;
    overlay.querySelector('.art-viewer-author-name').textContent = c.author;
    overlay.querySelector('.art-viewer-cat').textContent = c.subCat || '全部';
    overlay.querySelector('.art-viewer-tags').innerHTML = c.tags.map(t => `<span class="art-viewer-tag">${t}</span>`).join('');
    overlay.querySelector('.art-viewer-stats').innerHTML = `
      <span class="art-viewer-stat">👁️ ${c.views || (c.likes * 3)}</span>
      <button class="art-viewer-stat-btn like" id="artViewerLike">👍 ${c.likes}</button>
      <button class="art-viewer-stat-btn fav" id="artViewerFav">★ ${c.favs || Math.floor(c.likes * 0.6)}</button>
      <button class="art-viewer-stat-btn share" id="artViewerShare">分享</button>
    `;
    overlay.querySelector('.art-viewer-counter').textContent = `${idx + 1} / ${artworks.length}`;
    // 更新评论
    overlay.querySelector('.art-viewer-comments-title').textContent = `评论 ${c.comments}`;
    overlay.querySelector('#artViewerCommentsList').innerHTML = generateComments(c).map(cm => `
      <div class="art-viewer-comment">
        <div class="art-viewer-comment-avatar">${cm.avatar}</div>
        <div class="art-viewer-comment-body">
          <div class="art-viewer-comment-head">
            <span class="art-viewer-comment-user">${cm.user}</span>
            <span class="art-viewer-comment-time">${cm.time}</span>
          </div>
          <div class="art-viewer-comment-text cm-text">${cm.text}</div>
        </div>
      </div>
    `).join('');
    applyCommentCollapse(overlay.querySelector('#artViewerCommentsList'));
    bindStatBtns(overlay, c);
    // 更新价格
    const newPrice = c.free
      ? `<span class="art-viewer-price free">免费</span>`
      : (c.discount
          ? `<span class="art-viewer-price discount">¥${Math.max(1, Math.round((parseInt(String(c.price).replace(/\D/g,''),10)||0)*0.7))}</span>`
          : `<span class="art-viewer-price paid">¥${parseInt(String(c.price).replace(/\D/g,''),10)||0}</span>`);
    const oldPrice = overlay.querySelector('.art-viewer-price');
    if (oldPrice) oldPrice.outerHTML = newPrice;
  }

  overlay.querySelector('#artViewerClose').addEventListener('click', closeArtworkViewer);
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeArtworkViewer();
  });
  const prevBtn = overlay.querySelector('#artViewerPrev');
  const nextBtn = overlay.querySelector('#artViewerNext');
  if (prevBtn) prevBtn.addEventListener('click', () => show(idx - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => show(idx + 1));

  // 键盘导航
  const keyHandler = e => {
    if (e.key === 'Escape') closeArtworkViewer();
    else if (e.key === 'ArrowLeft') show(idx - 1);
    else if (e.key === 'ArrowRight') show(idx + 1);
  };
  document.addEventListener('keydown', keyHandler);
  overlay._keyHandler = keyHandler;

  // 点赞/收藏/分享 + 评论发布
  bindStatBtns(overlay, cur);
  // 评论发布
  const commentInput = overlay.querySelector('#artViewerCommentInput');
  const commentSend = overlay.querySelector('#artViewerCommentSend');
  const commentList = overlay.querySelector('#artViewerCommentsList');
  function sendComment() {
    const text = commentInput.value.trim();
    if (!text) return;
    const html = `
      <div class="art-viewer-comment mine">
        <div class="art-viewer-comment-avatar">${(userProfile && userProfile.avatar) ? (userProfile.avatar.startsWith('data:') ? '😊' : userProfile.avatar) : '😊'}</div>
        <div class="art-viewer-comment-body">
          <div class="art-viewer-comment-head">
            <span class="art-viewer-comment-user">${(userProfile && userProfile.name) || '我'}</span>
            <span class="art-viewer-comment-time">刚刚</span>
          </div>
          <div class="art-viewer-comment-text cm-text">${text.replace(/</g,'&lt;')}</div>
        </div>
      </div>
    `;
    commentList.insertAdjacentHTML('afterbegin', html);
    applyCommentCollapse(commentList.firstElementChild);
    commentInput.value = '';
  }
  commentSend.addEventListener('click', sendComment);
  commentInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') sendComment();
  });
}

function closeArtworkViewer() {
  const ex = document.getElementById('artViewerOverlay');
  if (ex) {
    if (ex._keyHandler) document.removeEventListener('keydown', ex._keyHandler);
    ex.remove();
  }
}

// 编辑资料弹层
function openEditProfile() {
  const u = userProfile;
  const overlay = document.getElementById('userHomeOverlay');

  // 爱好选项池（从游戏标签抽取）
  const hobbyPool = ['冒险', '策略', '动作', '休闲', '科幻', '解谜', 'RPG', '像素风', '模拟', '竞技', '体育', '角色扮演', '射击', '格斗', '生存', '恐怖', '音乐', '剧情'];
  const hobbyChips = hobbyPool.map(h => `
    <label class="edit-hobby-chip ${u.hobbies.includes(h) ? 'active' : ''}">
      <input type="checkbox" value="${h}" ${u.hobbies.includes(h) ? 'checked' : ''}>
      <span>${h}</span>
    </label>
  `).join('');

  const dlg = document.createElement('div');
  dlg.className = 'user-edit-overlay';
  dlg.id = 'userEditOverlay';
  dlg.innerHTML = `
    <div class="user-edit-dialog" id="userEditDialog">
    <div class="edit-head">
      <div class="edit-title">编辑个人资料</div>
      <button class="edit-close" id="editClose">×</button>
    </div>
    <div class="edit-body">
      <div class="edit-row">
        <label class="edit-label">头像（点击更换图片）</label>
        <div class="edit-avatar-row">
          <label class="edit-avatar-preview" id="editAvatarPreviewWrap" title="点击选择图片">
            ${u.avatar.startsWith('data:') ? `<img src="${u.avatar}" class="edit-avatar-img">` : u.avatar}
            <input type="file" id="editAvatarFile" accept="image/*" hidden>
          </label>
        </div>
      </div>
      <div class="edit-row">
        <label class="edit-label">昵称</label>
        <input type="text" id="editName" value="${u.name}" maxlength="16" class="edit-input">
      </div>
      <div class="edit-row">
        <label class="edit-label">签名</label>
        <input type="text" id="editSignature" value="${u.signature}" maxlength="40" class="edit-input">
      </div>
      <div class="edit-row">
        <label class="edit-label">性别</label>
        <select id="editGender" class="edit-input">
          <option value="保密" ${u.gender === '保密' ? 'selected' : ''}>保密</option>
          <option value="男" ${u.gender === '男' ? 'selected' : ''}>男</option>
          <option value="女" ${u.gender === '女' ? 'selected' : ''}>女</option>
        </select>
      </div>
      <div class="edit-row">
        <label class="edit-label">兴趣爱好</label>
        <div class="edit-hobby-list">${hobbyChips}</div>
      </div>
    </div>
    <div class="edit-foot">
      <button class="edit-cancel" id="editCancel">取消</button>
      <button class="edit-save" id="editSave">保存</button>
    </div>
    </div>
  `;
  document.body.appendChild(dlg);

  // 头像选择图片
  const avatarFile = dlg.querySelector('#editAvatarFile');
  const avatarWrap = dlg.querySelector('#editAvatarPreviewWrap');
  let newAvatarData = null;
  avatarFile.addEventListener('change', function() {
    const file = this.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('图片不能超过 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      newAvatarData = e.target.result;
      avatarWrap.innerHTML = `<img src="${newAvatarData}" class="edit-avatar-img"><input type="file" id="editAvatarFile" accept="image/*" hidden>`;
      avatarWrap.querySelector('input').addEventListener('change', avatarFile.onchange);
    };
    reader.readAsDataURL(file);
  });

  // 爱好 chip 点击切换
  dlg.querySelectorAll('.edit-hobby-chip').forEach(chip => {
    chip.addEventListener('click', function(e) {
      if (e.target.tagName === 'INPUT') return;
      e.preventDefault();
      const cb = this.querySelector('input');
      cb.checked = !cb.checked;
      this.classList.toggle('active', cb.checked);
    });
  });

  dlg.querySelector('#editClose').addEventListener('click', () => dlg.remove());
  dlg.querySelector('#editCancel').addEventListener('click', () => dlg.remove());
  dlg.querySelector('#editSave').addEventListener('click', function() {
    u.avatar = newAvatarData || u.avatar;
    u.name = dlg.querySelector('#editName').value.trim() || '玩家';
    u.signature = dlg.querySelector('#editSignature').value.trim() || '这个人很懒';
    u.gender = dlg.querySelector('#editGender').value;
    u.hobbies = Array.from(dlg.querySelectorAll('.edit-hobby-chip input:checked')).map(cb => cb.value);
    saveUserProfile();
    dlg.remove();
    closeUserHomeModal();
    openUserHomeModal();
    renderHeaderAvatar();
  });
  // 点遮罩关闭
  dlg.addEventListener('click', e => {
    if (e.target === dlg) dlg.remove();
  });
}

/* ── IM 聊天弹窗 ── */
// mock 联系人数据
// IM 数据持久化（localStorage）
const IM_FRIENDS_KEY = 'imFriends';
const IM_GROUPS_KEY = 'imGroups';

function loadImData(key, defaultData) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return JSON.parse(JSON.stringify(defaultData));
}
function saveImData(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) {}
}

const _defaultImFriends = [
  { id: 'f1', name: '夜行旅人', avatar: '🦊', online: true, unread: 2, lastMsg: '梦境探险那条隐藏路线还有吗？', messages: [
    { from: 'other', text: '哥们，梦境探险那条隐藏路线还有吗？', time: '14:30' },
    { from: 'self', text: '有啊，发你了', time: '14:32' },
    { from: 'other', text: '收到，谢啦！', time: '14:33' },
    { from: 'other', text: '另外那个宝箱位置能再说下吗？', time: '14:33' },
  ]},
  { id: 'f2', name: '解谜狂魔', avatar: '🧩', online: true, unread: 1, lastMsg: '幻境迷城第三关怎么过啊', messages: [
    { from: 'other', text: '幻境迷城第三关怎么过啊', time: '13:15' },
    { from: 'self', text: '我给你发个攻略', time: '13:20' },
  ]},
  { id: 'f3', name: '棋场老司机', avatar: '♟️', online: false, unread: 0, lastMsg: '星落棋局双排吗', messages: [
    { from: 'other', text: '星落棋局双排吗', time: '昨天' },
    { from: 'self', text: '晚上8点见', time: '昨天' },
  ]},
  { id: 'f4', name: '灵宠训练师', avatar: '🐾', online: true, unread: 0, lastMsg: '稀有灵兽刷新点已更新', messages: [
    { from: 'other', text: '稀有灵兽刷新点已更新', time: '昨天' },
    { from: 'self', text: '好的，我去看看', time: '昨天' },
  ]},
  { id: 'f5', name: '星绘', avatar: '🌌', online: false, unread: 0, lastMsg: '那张星空少女我临摹了一张', messages: [
    { from: 'other', text: '那张星空少女我临摹了一张', time: '2天前' },
    { from: 'self', text: '发来看看', time: '2天前' },
  ]},
];
const _defaultImGroups = [
  { id: 'g1', name: '梦境探险交流群', avatar: '🎮', online: true, unread: 0, memberCount: 128, lastMsg: '有人组队刷副本吗', messages: [
    { from: 'other', sender: '路人大甲', text: '有人组队刷副本吗', time: '15:01' },
    { from: 'other', sender: '夜行旅人', text: '来，我奶', time: '15:02' },
    { from: 'other', sender: '路人大甲', text: '3缺1，再来个输出', time: '15:03' },
  ]},
  { id: 'g2', name: 'AI游戏开发讨论', avatar: '💻', online: true, unread: 12, memberCount: 456, lastMsg: 'Trae更新了新模型', messages: [
    { from: 'other', sender: '开发者小王', text: 'Trae更新了新模型', time: '14:50' },
    { from: 'other', sender: '独立老李', text: '刚试了，效果不错', time: '14:55' },
    { from: 'other', sender: '开发者小王', text: '我也试了，AI补全更准了', time: '14:58' },
  ]},
  { id: 'g3', name: '插画创作社', avatar: '🎨', online: false, unread: 0, memberCount: 89, lastMsg: '本周主题：星空', messages: [
    { from: 'other', sender: '墨色', text: '本周主题：星空', time: '昨天' },
    { from: 'self', text: '想画个银河少女', time: '昨天' },
  ]},
  { id: 'g4', name: '星落棋局王者群', avatar: '♟️', online: true, unread: 0, memberCount: 67, lastMsg: '今晚8点开黑', messages: [
    { from: 'other', sender: '棋场老司机', text: '今晚8点开黑', time: '2天前' },
  ]},
];

let imFriends = loadImData(IM_FRIENDS_KEY, _defaultImFriends);
let imGroups = loadImData(IM_GROUPS_KEY, _defaultImGroups);

let imActiveTab = 'friends';
let imActiveContact = null;

function openImModal() {
  const overlay = document.getElementById('imOverlay');
  if (!overlay) return;
  overlay.classList.add('open');
  // 清除未读角标
  const badge = document.getElementById('messageBadge');
  if (badge) badge.classList.add('hidden');
  imFriends.forEach(f => f.unread = 0);
  imGroups.forEach(g => g.unread = 0);
  imActiveContact = null;
  renderImContacts();
  renderImEmpty();
}

function closeImModal() {
  const overlay = document.getElementById('imOverlay');
  if (overlay) overlay.classList.remove('open');
}

function renderImContacts() {
  const list = document.getElementById('imContactList');
  if (!list) return;
  const data = imActiveTab === 'friends' ? imFriends : imGroups;
  list.innerHTML = data.map(c => {
    const isActive = imActiveContact && String(imActiveContact.id) === String(c.id);
    const unreadBadge = c.unread > 0 ? `<span class="im-contact-unread">${c.unread > 99 ? '99+' : c.unread}</span>` : '';
    return `
      <div class="im-contact-item ${isActive ? 'active' : ''}" data-id="${c.id}">
        <div class="im-contact-avatar ${c.online ? 'online' : ''}">${c.avatar}</div>
        <div class="im-contact-info">
          <div class="im-contact-name">${c.name}</div>
          <div class="im-contact-preview">${c.lastMsg || ''}</div>
        </div>
        ${unreadBadge}
      </div>
    `;
  }).join('');
  // 同步底部按钮文字
  const addBtn = document.getElementById('imAddBtn');
  if (addBtn) addBtn.textContent = imActiveTab === 'friends' ? '+ 添加好友' : '+ 加入群组';
  list.querySelectorAll('.im-contact-item').forEach(item => {
    item.addEventListener('click', function() {
      const id = this.dataset.id;
      const contact = data.find(c => String(c.id) === String(id));
      if (contact) {
        imActiveContact = contact;
        contact.unread = 0;
        renderImContacts();
        renderImChat();
      }
    });
  });
}

function renderImChat() {
  const chat = document.getElementById('imChat');
  if (!chat || !imActiveContact) return;
  // 防御性：确保 messages 是数组
  if (!Array.isArray(imActiveContact.messages)) imActiveContact.messages = [];
  const isGroup = imActiveTab === 'groups';
  const statusText = isGroup
    ? `${imActiveContact.memberCount}人 · ${imActiveContact.online ? '在线' : '离线'}`
    : (imActiveContact.online ? '在线' : '离线');
  const statusHtml = imActiveContact.online
    ? `<span class="im-chat-header-status">· ${statusText}</span>`
    : '';
  const msgsHtml = imActiveContact.messages.map(m => {
    const isSelf = m.from === 'self';
    const senderName = isSelf ? '' : (m.sender || imActiveContact.name);
    const avatar = isSelf ? '👤' : imActiveContact.avatar;
    return `
      <div class="im-msg ${isSelf ? 'self' : 'other'}">
        <div class="im-msg-avatar">${avatar}</div>
        <div>
          ${senderName ? `<div style="font-size:11px;color:#888;margin-bottom:2px">${senderName}</div>` : ''}
          <div class="im-msg-bubble">${m.text}</div>
          <div class="im-msg-time">${m.time}</div>
        </div>
      </div>
    `;
  }).join('');
  chat.innerHTML = `
    <div class="im-chat-header">
      <span class="im-chat-header-name">${imActiveContact.name}</span>
      ${statusHtml}
      <button class="im-chat-close" id="imCloseBtn">✕</button>
    </div>
    <div class="im-messages" id="imMessages">${msgsHtml}</div>
    <div class="im-input-area">
      <textarea class="im-input" id="imInput" placeholder="输入消息，回车发送..." rows="1"></textarea>
      <button class="im-send-btn" id="imSendBtn">发送</button>
    </div>
  `;
  document.getElementById('imCloseBtn')?.addEventListener('click', closeImModal);
  const input = document.getElementById('imInput');
  const sendBtn = document.getElementById('imSendBtn');
  const messagesEl = document.getElementById('imMessages');
  // 滚动到底部
  if (messagesEl) messagesEl.scrollTop = messagesEl.scrollHeight;
  // 发送
  const send = () => {
    const text = input.value.trim();
    if (!text) return;
    const now = new Date();
    const time = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    imActiveContact.messages.push({ from: 'self', text, time });
    imActiveContact.lastMsg = text;
    saveImData(imActiveTab === 'friends' ? IM_FRIENDS_KEY : IM_GROUPS_KEY, imActiveTab === 'friends' ? imFriends : imGroups);
    renderImChat();
    // 模拟对方回复
    setTimeout(() => {
      if (!imActiveContact) return;
      const replies = ['好的', '收到', '哈哈', '我也这么觉得', '稍等一下', '👍', '在的', '可以啊'];
      const reply = replies[Math.floor(Math.random() * replies.length)];
      imActiveContact.messages.push({ from: 'other', sender: imActiveContact.name, text: reply, time });
      imActiveContact.lastMsg = reply;
      saveImData(imActiveTab === 'friends' ? IM_FRIENDS_KEY : IM_GROUPS_KEY, imActiveTab === 'friends' ? imFriends : imGroups);
      renderImChat();
    }, 1000 + Math.random() * 1500);
  };
  sendBtn?.addEventListener('click', send);
  input?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  });
  input?.focus();
}

function renderImEmpty() {
  const chat = document.getElementById('imChat');
  if (!chat) return;
  chat.innerHTML = `
    <div class="im-chat-header">
      <span class="im-chat-header-name">消息</span>
      <button class="im-chat-close" id="imCloseBtn">✕</button>
    </div>
    <div class="im-empty">
      <div class="im-empty-icon">💬</div>
      <div>选择一位好友或群组开始聊天</div>
    </div>
  `;
  document.getElementById('imCloseBtn')?.addEventListener('click', closeImModal);
}

// mock 搜索数据库：可添加的好友和可加入的群组
let imSearchableFriends = [
  { id: 'sf1', name: '画师墨白', avatar: '🖌️', desc: '插画师 · 关注 1.2k' },
  { id: 'sf2', name: '开发者阿强', avatar: '👨‍💻', desc: '游戏开发 · 作品 8' },
  { id: 'sf3', name: '猫语者', avatar: '🐱', desc: '萌宠UP · 粉丝 5.4k' },
  { id: 'sf4', name: '星河漫游者', avatar: '🌌', desc: '独立游戏 · 关注 892' },
  { id: 'sf5', name: '战斗大师', avatar: '⚔️', desc: 'PVP玩家 · 段位王者' },
  { id: 'sf6', name: '音乐匠人', avatar: '🎵', desc: 'BGM创作者 · 作品 32' },
  { id: 'sf7', name: '像素魔术师', avatar: '🧙', desc: '像素画 · 作品 56' },
  { id: 'sf8', name: '剧情写手', avatar: '✍️', desc: '剧情策划 · 关注 2.1k' },
];
let imSearchableGroups = [
  { id: 'sg1', name: '梦境探险·硬核群', avatar: '🎮', desc: '128人 · 游戏攻略交流' },
  { id: 'sg2', name: 'AI游戏开发讨论', avatar: '💻', desc: '456人 · 引擎/工具/AI交流' },
  { id: 'sg3', name: '插画创作社', avatar: '🎨', desc: '89人 · 每周命题创作' },
  { id: 'sg4', name: '星落棋局·竞技场', avatar: '♟️', desc: '234人 · 排位约战' },
  { id: 'sg5', name: '幻境迷城·解谜党', avatar: '🧩', desc: '156人 · 通关攻略分享' },
  { id: 'sg6', name: '灵宠大陆·交易群', avatar: '🐾', desc: '301人 · 灵兽交易/分享' },
  { id: 'sg7', name: 'Galaxy·银河征途', avatar: '🚀', desc: '178人 · 星际战略交流' },
  { id: 'sg8', name: '音效制作交流', avatar: '🎵', desc: '67人 · BGM/音效制作' },
];
// 已发送请求的 id 集合
let imPendingFriendRequests = new Set();
let imPendingGroupRequests = new Set();

function renderImAddView() {
  const chat = document.getElementById('imChat');
  if (!chat) return;
  const isFriends = imActiveTab === 'friends';
  const title = isFriends ? '添加好友' : '加入群组';
  const placeholder = isFriends ? '搜索用户名或ID...' : '搜索群名或群号...';
  const db = isFriends ? imSearchableFriends : imSearchableGroups;
  const pending = isFriends ? imPendingFriendRequests : imPendingGroupRequests;
  chat.innerHTML = `
    <div class="im-chat-header">
      <span class="im-chat-header-name">${title}</span>
      <button class="im-chat-close" id="imCloseBtn">✕</button>
    </div>
    <div class="im-add-view">
      <div class="im-add-search">
        <input type="text" class="im-add-search-input" id="imAddSearchInput" placeholder="${placeholder}" />
        <button class="im-add-search-btn" id="imAddSearchBtn">搜索</button>
      </div>
      <div class="im-add-results" id="imAddResults"></div>
    </div>
  `;
  document.getElementById('imCloseBtn')?.addEventListener('click', closeImModal);
  const input = document.getElementById('imAddSearchInput');
  const searchBtn = document.getElementById('imAddSearchBtn');
  const resultsEl = document.getElementById('imAddResults');
  // 渲染搜索结果
  const renderResults = (keyword) => {
    const kw = (keyword || '').trim().toLowerCase();
    const list = kw ? db.filter(item => item.name.toLowerCase().includes(kw) || item.desc.toLowerCase().includes(kw)) : db;
    if (list.length === 0) {
      resultsEl.innerHTML = '<div class="im-add-empty">没有找到相关结果</div>';
      return;
    }
    resultsEl.innerHTML = list.map(item => {
      const added = pending.has(item.id);
      const btnText = added ? '已发送' : (isFriends ? '加好友' : '加入');
      return `
        <div class="im-add-result-item" data-id="${item.id}">
          <div class="im-add-result-avatar">${item.avatar}</div>
          <div class="im-add-result-info">
            <div class="im-add-result-name">${item.name}</div>
            <div class="im-add-result-desc">${item.desc}</div>
          </div>
          <button class="im-add-action-btn ${added ? 'added' : ''}" data-id="${item.id}" ${added ? 'disabled' : ''}>${btnText}</button>
        </div>
      `;
    }).join('');
    resultsEl.querySelectorAll('.im-add-action-btn:not(.added)').forEach(btn => {
      btn.addEventListener('click', function() {
        const id = this.dataset.id;
        pending.add(id);
        this.classList.add('added');
        this.textContent = '已发送';
        this.disabled = true;
        // 模拟1.5秒后对方同意，加入联系人列表
        setTimeout(() => {
          const src = db.find(it => it.id === id);
          if (!src) return;
          if (isFriends) {
            const newId = 'f' + (Date.now());
            imFriends.push({
              id: newId, name: src.name, avatar: src.avatar, online: true, unread: 0,
              lastMsg: '我们已经是好友了，开始聊天吧！',
              messages: [
                { from: 'other', text: '我们已经是好友了，开始聊天吧！', time: '刚刚' }
              ]
            });
            saveImData(IM_FRIENDS_KEY, imFriends);
          } else {
            const newId = 'g' + (Date.now());
            imGroups.push({
              id: newId, name: src.name, avatar: src.avatar, online: true, unread: 0,
              memberCount: Math.floor(Math.random() * 400) + 50,
              lastMsg: '欢迎加入本群！',
              messages: [
                { from: 'other', sender: '群主', text: '欢迎加入本群！', time: '刚刚' }
              ]
            });
            saveImData(IM_GROUPS_KEY, imGroups);
          }
          // 切回联系人列表，让新加的好友/群组出现
          renderImContacts();
        }, 1500);
        alert(isFriends ? '好友请求已发送，等待对方同意...' : '加群请求已发送，等待管理员审核...');
      });
    });
  };
  // 初始展示全部
  renderResults('');
  // 搜索
  const doSearch = () => renderResults(input.value);
  searchBtn?.addEventListener('click', doSearch);
  input?.addEventListener('keydown', e => {
    if (e.key === 'Enter') doSearch();
  });
  input?.focus();
}

// 绑定 IM 按钮（DOMContentLoaded 后执行）
document.addEventListener('DOMContentLoaded', () => {
  const messageBtn = document.getElementById('messageBtn');
  if (messageBtn) {
    messageBtn.addEventListener('click', openImModal);
  }
  const imOverlay = document.getElementById('imOverlay');
  if (imOverlay) {
    imOverlay.addEventListener('click', e => {
      if (e.target === imOverlay) closeImModal();
    });
  }
  document.querySelectorAll('.im-sidebar-tab').forEach(tab => {
    tab.addEventListener('click', function() {
      document.querySelectorAll('.im-sidebar-tab').forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      imActiveTab = this.dataset.tab;
      imActiveContact = null;
      renderImContacts();
      renderImEmpty();
    });
  });
  // 添加好友/加入群组按钮
  const imAddBtn = document.getElementById('imAddBtn');
  if (imAddBtn) {
    imAddBtn.addEventListener('click', function() {
      imActiveContact = null;
      renderImContacts();
      renderImAddView();
    });
  }
  // ESC 关闭
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      const overlay = document.getElementById('imOverlay');
      if (overlay && overlay.classList.contains('open')) closeImModal();
    }
  });
});
