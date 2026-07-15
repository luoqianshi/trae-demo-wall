// ============================================
// 智策营销助手 - 应用逻辑
// ============================================

// 初始化
document.addEventListener('DOMContentLoaded', function() {
  initLucideIcons(); // 图标初始化
  initTheme();       // 主题切换初始化
  initDate();
  initTabs();        // Tab 切换初始化（必须先于各模块初始化，确保标题描述正确）
  initDailyRecommend();  // 今日推荐初始化
  initMorningReport();   // 金融早报初始化
  initHotspotModule();   // 热点解读初始化
  initMaterial();        // 素材工厂初始化
  initCustomer();        // 客户画像初始化
  initProfile();         // 个人中心初始化
  initCopyButtons();
  initMarketData();  // 加载实时行情
});

// Lucide 图标初始化
function initLucideIcons() {
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// 重新渲染图标（动态内容更新后调用）
function refreshIcons(container = document) {
  if (typeof lucide !== 'undefined') {
    lucide.createIcons({
      root: container
    });
  }
}

// 主题切换
function initTheme() {
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const savedTheme = localStorage.getItem('theme') || 'dark';
  
  // 应用保存的主题
  applyTheme(savedTheme);
  
  // 切换按钮事件
  themeToggleBtn.addEventListener('click', function() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  });
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  
  // 添加过渡动画类
  document.body.classList.add('theme-transition');
  setTimeout(() => {
    document.body.classList.remove('theme-transition');
  }, 400);
}

// 显示当前日期
function initDate() {
  const now = new Date();
  const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
  const dateStr = now.toLocaleDateString('zh-CN', options);
  document.getElementById('current-date').textContent = dateStr;
}

// Tab 切换
function initTabs() {
  const navItems = document.querySelectorAll('.nav-item');
  const tabContents = document.querySelectorAll('.tab-content');
  const pageTitle = document.getElementById('page-title');
  const pageDesc = document.getElementById('page-desc');
  
  const titles = {
    daily: '每日营销灵感',
    morning: '金融早报',
    hotspot: '热点解读',
    material: '素材工厂',
    customer: '客户画像',
    profile: '个人中心'
  };
  
  const descriptions = {
    daily: '每天精选优质内容，一键套用，轻松搞定今日营销',
    morning: '每日市场动态与投资机会，一键生成对客内容',
    hotspot: '从热点到话术，五层深度拆解，让你聊什么都专业',
    material: '上传素材，AI结合热点一键生成6种营销内容',
    customer: '基于客户特征，智能匹配沟通话题和产品切入角度',
    profile: '管理您的账户信息、会员权益和积分'
  };
  
  navItems.forEach(item => {
    item.addEventListener('click', function(e) {
      e.preventDefault();
      const tab = this.dataset.tab;
      
      // 更新导航
      navItems.forEach(nav => nav.classList.remove('active'));
      this.classList.add('active');
      
      // 更新内容
      tabContents.forEach(content => content.classList.remove('active'));
      const targetTab = document.getElementById('tab-' + tab);
      if (targetTab) {
        targetTab.classList.add('active');
      }
      
      // 更新标题和描述
      pageTitle.textContent = titles[tab] || '';
      if (pageDesc) {
        pageDesc.textContent = descriptions[tab] || '';
      }
      
      // 滚动到顶部
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
  
  // 初始化：设置默认 tab（daily）的标题和描述
  const defaultTab = 'daily';
  pageTitle.textContent = titles[defaultTab] || '';
  if (pageDesc) {
    pageDesc.textContent = descriptions[defaultTab] || '';
  }
}

// 重置素材工厂状态
// 注意：金融早报已独立为单独的 Tab，此函数保留用于重置素材工厂的内部状态
// TODO: 如需重置素材工厂的选中类型、上传内容等，可在此函数中扩展
function resetMaterialToRegular() {
  const pageTitle = document.getElementById('page-title');
  const pageDesc = document.getElementById('page-desc');
  
  if (pageTitle) {
    pageTitle.textContent = '素材工厂';
  }
  if (pageDesc) {
    pageDesc.textContent = '上传素材，AI结合热点一键生成6种营销内容';
  }
}

// ============================================
// Tab 2: 金融早报
// ============================================

function initMorningReport() {
  initGenerateMode();
}

// 生成早报逻辑
function generateMorningReport() {
  const emptyState = document.getElementById('morning-empty');
  const content = document.getElementById('morning-content');
  
  // 并行加载所有实时数据
  Promise.all([
    loadRealTimeNews().catch(() => null),
    refreshMarketData(),  // 重新拉取市场指数数据
    loadSectorData().catch(() => null)
  ]).then(([newsData, marketData, sectorData]) => {
    // 更新要闻速递
    if (newsData && newsData.length > 0) {
      updateNewsContent(newsData);
    }
    
    // 更新市场回顾（基于实时指数+板块数据）
    updateMarketReview(marketData, newsData, sectorData);
    
    // 更新板块异动（真实API数据）
    updateSectorDataReal(sectorData, newsData);
    
    // 更新晨会话术（基于真实数据）
    updateMorningScript(marketData, newsData, sectorData);
    
    setTimeout(() => {
      emptyState.style.display = 'none';
      content.style.display = 'block';
      showToast('早报生成成功！');
    }, 500);
  });
}

// 生成早报模式
function initGenerateMode() {
  const content = document.getElementById('morning-content');
  const genPosterBtn = document.getElementById('gen-poster-btn');
  const downloadBtn = document.getElementById('download-poster-btn');
  
  // 一键生图
  if (genPosterBtn) {
    genPosterBtn.addEventListener('click', function() {
      if (!content || content.style.display === 'none') {
        showToast('请先生成早报内容', 'warning');
        return;
      }
      
      genPosterBtn.classList.add('loading');
      genPosterBtn.disabled = true;
      
      setTimeout(() => {
        drawPoster();
        openPosterModal();
        genPosterBtn.classList.remove('loading');
        genPosterBtn.disabled = false;
      }, 800);
    });
  }
  
  // 下载海报
  if (downloadBtn) {
    downloadBtn.addEventListener('click', function() {
      const canvas = document.getElementById('poster-canvas');
      const link = document.createElement('a');
      const now = new Date();
      const dateStr = now.getFullYear() + String(now.getMonth()+1).padStart(2,'0') + String(now.getDate()).padStart(2,'0');
      link.download = `每日金融早报_${dateStr}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      showToast('海报已下载！');
    });
  }
  
  // 页面初始化后自动生成早报
  setTimeout(() => {
    generateMorningReport();
  }, 300);
}

// 获取当前市场数据（从页面上已加载的实时指数）
function getMarketData() {
  return new Promise((resolve) => {
    const cards = document.querySelectorAll('.market-card');
    const data = [];
    cards.forEach(card => {
      data.push({
        name: card.querySelector('.market-label').textContent,
        value: card.querySelector('.market-value').textContent,
        change: card.querySelector('.market-change').textContent,
        isUp: card.querySelector('.market-value').classList.contains('up')
      });
    });
    resolve(data);
  });
}

// 重新拉取市场指数数据（腾讯财经 JSONP）
function refreshMarketData() {
  return new Promise((resolve) => {
    const indices = [
      { code: 'sh000001', name: '上证指数', el: 'sh' },
      { code: 'sz399001', name: '深证成指', el: 'sz' },
      { code: 'sz399006', name: '创业板指', el: 'cyb' },
      { code: 'hkHSI', name: '恒生指数', el: 'hs' }
    ];
    
    const codeList = indices.map(i => i.code).join(',');
    const url = `https://qt.gtimg.cn/q=${codeList}`;
    
    const script = document.createElement('script');
    script.src = url + '?t=' + Date.now();
    
    // 超时处理
    const timeout = setTimeout(() => {
      // 超时则返回当前DOM中的数据
      getMarketData().then(resolve);
      script.remove();
    }, 5000);
    
    script.onload = function() {
      clearTimeout(timeout);
      try {
        const data = [];
        indices.forEach((idx, i) => {
          const raw = window['v_' + idx.code];
          if (raw) {
            const fields = raw.replace(/"/g, '').split('~');
            const name = fields[1] || idx.name;
            const current = parseFloat(fields[3]);
            const change = parseFloat(fields[31]);
            const changePercent = parseFloat(fields[32]);
            
            if (!isNaN(current) && !isNaN(change) && !isNaN(changePercent)) {
              const isUp = change >= 0;
              const changeStr = (isUp ? '+' : '') + change.toFixed(2) + 
                ' (' + (isUp ? '+' : '') + changePercent.toFixed(2) + '%)';
              
              updateMarketCard(i, name, current.toFixed(2), changeStr, isUp);
              data.push({
                name: name,
                value: current.toFixed(2),
                change: changeStr,
                isUp: isUp
              });
            } else {
              data.push(null);
            }
          } else {
            data.push(null);
          }
        });
        
        // 如果有数据返回，否则回退到DOM数据
        const validData = data.filter(d => d !== null);
        if (validData.length >= 2) {
          resolve(data.map((d, i) => d || {
            name: indices[i].name,
            value: '0.00',
            change: '+0.00 (+0.00%)',
            isUp: true
          }));
        } else {
          getMarketData().then(resolve);
        }
      } catch(e) {
        getMarketData().then(resolve);
      }
      script.remove();
    };
    
    script.onerror = function() {
      clearTimeout(timeout);
      getMarketData().then(resolve);
      script.remove();
    };
    
    document.head.appendChild(script);
  });
}

// 加载实时板块行情数据（东方财富 JSONP）
function loadSectorData() {
  return new Promise((resolve, reject) => {
    const callbackName = 'em_sector_callback_' + Date.now();
    let loadedCount = 0;
    let gainers = [];
    let losers = [];
    
    function tryResolve() {
      loadedCount++;
      if (loadedCount >= 2) {
        if (gainers.length > 0 || losers.length > 0) {
          resolve({ gainers, losers });
        } else {
          reject();
        }
        // 清理
        delete window[callbackName + '_up'];
        delete window[callbackName + '_down'];
        scriptUp.remove();
        scriptDown.remove();
      }
    }
    
    // 涨幅榜
    window[callbackName + '_up'] = function(data) {
      try {
        const list = data.data.diff || [];
        gainers = list.slice(0, 4).map(item => ({
          name: item.f14,
          change: (item.f3 > 0 ? '+' : '') + item.f3 + '%',
          isUp: item.f3 > 0,
          value: item.f2
        }));
      } catch(e) {}
      tryResolve();
    };
    
    // 跌幅榜
    window[callbackName + '_down'] = function(data) {
      try {
        const list = data.data.diff || [];
        losers = list.slice(0, 4).map(item => ({
          name: item.f14,
          change: item.f3 + '%',
          isUp: false,
          value: item.f2
        }));
      } catch(e) {}
      tryResolve();
    };
    
    const scriptUp = document.createElement('script');
    scriptUp.onerror = function() { tryResolve(); };
    scriptUp.src = `https://push2.eastmoney.com/api/qt/clist/get?cb=${callbackName}_up&pn=1&pz=6&po=1&np=1&fltt=2&invt=2&fid=f3&fs=m:90+t:2&fields=f2,f3,f4,f12,f14`;
    
    const scriptDown = document.createElement('script');
    scriptDown.onerror = function() { tryResolve(); };
    scriptDown.src = `https://push2.eastmoney.com/api/qt/clist/get?cb=${callbackName}_down&pn=1&pz=6&po=0&np=1&fltt=2&invt=2&fid=f3&fs=m:90+t:2&fields=f2,f3,f4,f12,f14`;
    
    document.head.appendChild(scriptUp);
    document.head.appendChild(scriptDown);
    
    // 超时
    setTimeout(() => {
      if (loadedCount < 2) {
        if (gainers.length > 0 || losers.length > 0) {
          resolve({ gainers, losers });
        } else {
          reject();
        }
        delete window[callbackName + '_up'];
        delete window[callbackName + '_down'];
      }
    }, 6000);
  });
}

// 根据实时数据生成市场回顾
function updateMarketReview(marketData, newsData, sectorData) {
  const el = document.getElementById('market-content');
  if (!el) return;
  
  const sh = marketData[0]; // 上证指数
  const sz = marketData[1]; // 深证成指
  const cyb = marketData[2]; // 创业板
  const hs = marketData[3]; // 恒生
  
  if (!sh || !sz) return;
  
  // 从change字符串中提取涨跌幅百分比
  function extractPercent(changeStr) {
    const match = changeStr.match(/\(([+-]?[\d.]+%)\)/);
    return match ? match[1] : '0.00%';
  }
  
  const shPercent = extractPercent(sh.change);
  const szPercent = extractPercent(sz.change);
  const cybPercent = extractPercent(cyb.change);
  
  // 涨跌描述
  const shDesc = sh.isUp ? `上涨${shPercent}` : `下跌${shPercent.replace('-', '')}`;
  const szDesc = sz.isUp ? `上涨${szPercent.replace('-', '')}` : `下跌${szPercent.replace('-', '')}`;
  const cybDesc = cyb.isUp ? `上涨${cybPercent.replace('-', '')}` : `下跌${cybPercent.replace('-', '')}`;
  
  // 从真实板块数据中提取领涨领跌板块
  let gainerNames = [];
  let loserNames = [];
  if (sectorData) {
    gainerNames = sectorData.gainers.slice(0, 3).map(s => s.name);
    loserNames = sectorData.losers.slice(0, 3).map(s => s.name);
  }
  if (gainerNames.length === 0) gainerNames = ['金融地产', 'AI概念', '消费'];
  if (loserNames.length === 0) loserNames = ['新能源', '医药', '军工'];
  
  const gainerStr = gainerNames.join('、');
  const loserStr = loserNames.join('、');
  
  // 判断市场整体情绪
  const upCount = [sh, sz, cyb].filter(x => x.isUp).length;
  let marketMood = '涨跌分化';
  if (upCount >= 3) marketMood = '集体收涨';
  else if (upCount === 0) marketMood = '全线回调';
  
  const p1 = `昨日A股三大指数${marketMood}。沪指${sh.isUp ? '震荡上行' : '承压调整'}，${shDesc}；深成指${szDesc}；创业板指${cybDesc}。盘面上，${gainerStr}等板块表现活跃，${loserStr}等板块有所调整。两市成交额维持在万亿水平，市场情绪${upCount >= 2 ? '总体平稳' : '偏谨慎'}。`;
  
  const p2 = `港股方面，恒生指数${hs?.isUp ? '收涨' : '收跌'}，科技股${hs?.isUp ? '表现活跃' : '有所承压'}。美股隔夜涨跌不一，市场关注美联储政策走向。整体来看，当前市场处于结构性行情阶段，建议关注业绩确定性较高的方向。`;
  
  el.innerHTML = `<p>${p1}</p><p>${p2}</p>`;
}

// 真实板块异动数据
function updateSectorDataReal(sectorData, newsData) {
  const container = document.getElementById('sectors-content');
  if (!container) return;
  
  let sectors = [];
  
  if (sectorData && (sectorData.gainers.length > 0 || sectorData.losers.length > 0)) {
    // 使用真实API数据
    const gainers = sectorData.gainers.slice(0, 2);
    const losers = sectorData.losers.slice(0, 2);
    
    gainers.forEach(s => {
      sectors.push({
        name: '📈 ' + s.name,
        change: s.change,
        isUp: true,
        reason: generateSectorReason(s.name, true, newsData)
      });
    });
    
    losers.forEach(s => {
      sectors.push({
        name: '📉 ' + s.name,
        change: s.change,
        isUp: false,
        reason: generateSectorReason(s.name, false, newsData)
      });
    });
  } else {
    // fallback数据
    sectors = [
      { name: '📈 银行板块', change: '+1.85%', isUp: true, reason: '市场流动性改善预期，净息差压力有望缓解' },
      { name: '📈 AI概念', change: '+2.56%', isUp: true, reason: 'AI应用加速落地，产业景气度持续上行' },
      { name: '📉 新能源', change: '-0.98%', isUp: false, reason: '短期获利回吐，关注中报业绩兑现情况' },
      { name: '📉 医药生物', change: '-1.23%', isUp: false, reason: '集采政策预期，板块情绪承压' }
    ];
  }
  
  let html = '';
  sectors.forEach(s => {
    html += `
      <div class="sector-item ${s.isUp ? 'up' : 'down'}">
        <div class="sector-name">${s.name}</div>
        <div class="sector-change">${s.change}</div>
        <div class="sector-reason">${s.reason}</div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

// 根据板块名称生成涨跌原因
function generateSectorReason(name, isUp, newsData) {
  const newsText = newsData ? newsData.map(n => n.title).join('') : '';
  
  if (isUp) {
    if (name.includes('银行') || name.includes('金融') || name.includes('保险')) 
      return '金融板块估值修复，流动性改善预期利好';
    if (name.includes('AI') || name.includes('算力') || name.includes('传媒') || name.includes('游戏')) 
      return 'AI应用加速落地，行业景气度持续提升';
    if (name.includes('地产') || name.includes('建筑') || name.includes('建材')) 
      return '政策支持预期升温，行业基本面有望改善';
    if (name.includes('能源') || name.includes('石油') || name.includes('油气') || name.includes('煤炭')) 
      return '国际大宗商品价格上涨，板块业绩预期改善';
    if (name.includes('汽车') || name.includes('新能源') || name.includes('电池')) 
      return '销量数据超预期，产业链景气度延续';
    return '行业景气度向好，资金关注度提升';
  } else {
    if (name.includes('锂') || name.includes('能源金属') || name.includes('稀土')) 
      return '大宗商品价格回调，板块盈利预期承压';
    if (name.includes('医药') || name.includes('医疗') || name.includes('生物')) 
      return '集采政策预期影响，板块情绪偏谨慎';
    if (name.includes('新能源') || name.includes('光伏') || name.includes('风电')) 
      return '短期获利回吐，关注中报业绩兑现';
    if (name.includes('消费') || name.includes('食品') || name.includes('白酒')) 
      return '消费复苏不及预期，板块短期调整';
    return '短期资金流出，关注后续基本面变化';
  }
}

// 更新晨会话术
function updateMorningScript(marketData, newsData, sectorData) {
  const el = document.getElementById('script-content');
  if (!el) return;
  
  const sh = marketData[0];
  if (!sh) return;
  
  const now = new Date();
  const dateStr = now.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' });
  
  // 从change字符串中提取百分比
  const pMatch = sh.change.match(/\(([+-]?[\d.]+%)\)/);
  const shPercent = pMatch ? pMatch[1] : '';
  const shPercentDisplay = sh.isUp ? shPercent : shPercent.replace('-', '');
  
  // 从新闻中找一个财经相关的核心话题
  let hotTopic = '政策面利好不断释放';
  if (newsData && newsData.length > 0) {
    const financeKeywords = ['央行', '降准', '降息', 'GDP', 'CPI', 'A股', '股市', '市场', '经济', '政策', '金融', '银行', '地产', '新能源', 'AI', '芯片', '半导体'];
    const financeNews = newsData.filter(n => 
      financeKeywords.some(kw => n.title.includes(kw))
    );
    if (financeNews.length > 0) {
      hotTopic = financeNews[0].title.replace(/\.\.\.$/, '').substring(0, 28) + '...';
    }
  }
  
  // 从真实板块数据提取领涨板块
  let gainerStr = 'AI、金融';
  if (sectorData && sectorData.gainers.length > 0) {
    gainerStr = sectorData.gainers.slice(0, 2).map(s => s.name).join('、');
  }
  
  const trend = sh.isUp ? '震荡上行' : '震荡调整';
  const suggestion = sh.isUp ? '建议关注中报业绩确定性较高的方向' : '建议保持耐心，逢低布局优质标的';
  
  el.innerHTML = `
    <p><strong>各位客户早上好，今天是${dateStr}。</strong></p>
    <p>先简单回顾一下昨日市场：A股整体呈现${trend}格局，${hotTopic}。沪指${sh.isUp ? '收涨' : '收跌'}${shPercentDisplay}，市场情绪${sh.isUp ? '总体平稳' : '偏谨慎'}。</p>
    <p>从板块来看，${gainerStr}等方向表现较为活跃。${suggestion}，同时注意控制仓位，保持均衡配置。</p>
    <p>如果您想了解具体板块的投资机会，或者对持仓有任何疑问，欢迎随时和我沟通。祝您今天投资顺利！</p>
  `;
}

// 加载实时财经新闻（华尔街见闻 API，支持CORS）
// 权威财经资讯源配置
const NEWS_SOURCES = {
  wallstreetcn: {
    name: '华尔街见闻',
    logo: 'assets/logos/wallstreetcn.jpg',
    url: 'https://wallstreetcn.com',
    searchUrl: 'https://wallstreetcn.com/search?q=',
    articleBaseUrl: 'https://wallstreetcn.com/livenews/'
  },
  cls: {
    name: '财联社',
    logo: 'assets/logos/cls.svg',
    url: 'https://www.cls.cn',
    searchUrl: 'https://www.cls.cn/searchPage?keyword=',
    articleBaseUrl: 'https://www.cls.cn/detail/'
  },
  eastmoney: {
    name: '东方财富',
    logo: 'assets/logos/eastmoney.svg',
    url: 'https://www.eastmoney.com',
    searchUrl: 'https://so.eastmoney.com/news/s?keyword=',
    articleBaseUrl: 'https://finance.eastmoney.com/a/'
  },
  yicai: {
    name: '第一财经',
    logo: 'assets/logos/yicai.svg',
    url: 'https://www.yicai.com',
    searchUrl: 'https://www.yicai.com/search?keys=',
    articleBaseUrl: 'https://www.yicai.com/news/'
  },
  sina: {
    name: '新浪财经',
    logo: 'assets/logos/sina.svg',
    url: 'https://finance.sina.com.cn',
    searchUrl: 'https://search.sina.com.cn/?q=',
    articleBaseUrl: 'https://finance.sina.com.cn/'
  },
  xinhua: {
    name: '新华网财经',
    logo: 'assets/logos/xinhua.svg',
    url: 'http://www.xinhuanet.com/fortune',
    searchUrl: 'http://www.xinhuanet.com/search/search.htm?keyword=',
    articleBaseUrl: 'http://www.xinhuanet.com/fortune/'
  }
};

function loadRealTimeNews() {
  return new Promise((resolve, reject) => {
    // 并行获取多个频道的新闻，确保内容丰富
    const channels = ['a-stock-channel', 'global-channel', 'macro-channel'];
    const allNews = [];
    
    let completed = 0;
    let hasSuccess = false;
    
    channels.forEach(channel => {
      fetch(`https://api-prod.wallstreetcn.com/apiv1/content/lives?channel=${channel}&limit=15`)
        .then(r => r.json())
        .then(data => {
          const items = data?.data?.items || [];
          items.forEach(item => {
            const text = (item.content_text || item.title || '').trim();
            if (text && text.length > 10) {
              // 构建原文链接 - 华尔街见闻快讯的格式是 livenews/{id}
              const articleUrl = item.id 
                ? `https://wallstreetcn.com/livenews/${item.id}` 
                : 'https://wallstreetcn.com';
              
              allNews.push({
                text: text.replace(/<[^>]+>/g, '').replace(/\n/g, ''),
                channel: channel,
                time: item.created_at || 0,
                source: 'wallstreetcn',
                sourceName: NEWS_SOURCES.wallstreetcn.name,
                sourceLogo: NEWS_SOURCES.wallstreetcn.logo,
                sourceUrl: articleUrl,
                title: item.title || ''
              });
            }
          });
          hasSuccess = true;
        })
        .catch(() => {})
        .finally(() => {
          completed++;
          if (completed === channels.length) {
            if (allNews.length >= 2) {
              // 去重并分类
              const processedNews = processNewsData(allNews);
              if (processedNews.length >= 2) {
                resolve(processedNews);
              } else {
                reject();
              }
            } else {
              reject();
            }
          }
        });
    });
    
    // 超时
    setTimeout(() => {
      if (allNews.length >= 2) {
        const processedNews = processNewsData(allNews);
        if (processedNews.length >= 2) {
          resolve(processedNews);
        } else {
          reject();
        }
      } else {
        reject();
      }
    }, 8000);
  });
}

// 处理新闻数据：过滤、去重、分类
function processNewsData(newsList) {
  // 财经关键词白名单 - 只有包含这些词的新闻才保留
  const financeKeywords = [
    // 市场相关
    'A股', '沪指', '深成指', '创业板', '恒生', '美股', '指数', '上涨', '下跌', '收涨', '收跌',
    '涨幅', '跌幅', '板块', '个股', '涨停', '跌停', '成交', '北向', '南向', '股市', '大盘',
    '行情', '震荡', '反弹', '回调', '拉升', '跳水', '牛市', '熊市',
    // 宏观经济
    '央行', '降准', '降息', 'GDP', 'CPI', 'PPI', '利率', 'MLF', 'LPR', '财政', '货币', '经济',
    '通胀', '美联储', '加息', '缩表', 'QE', '流动性', '货币政策', '财政政策',
    // 行业公司
    '新能源', '汽车', 'AI', '半导体', '芯片', '光伏', '医药', '地产', '银行', '消费', '科技',
    '互联网', '锂电', '储能', '创新药', '军工', '煤炭', '石油', '白酒', '房地产', '金融',
    '上市公司', '财报', '业绩', '净利润', '营收', '回购', '分红', '并购', '重组',
    '减持', '增持', '股份', '股权', '股东', '董事长', '董事会', '拟出资', '设立', '投资',
    '营收', '利润', '亏损', '盈利', '同比', '环比', '增长', '下降',
    // 政策监管
    '证监会', '银保监', '监管', '新规', '政策', '国务院', '印发', '意见', '方案', '条例',
    // 国际财经
    '原油', '黄金', '美元', '汇率', '人民币', '国债', '债券', '期货', '大宗商品', '富时',
    '明晟', 'MSCI', '标普', '道指', '纳指', '特斯拉', '苹果', '英伟达',
    // 其他财经相关
    '亿', '万元', '美元', '富翁', '富豪', '财富', '身价', '净资产'
  ];
  
  const categories = [
    { tag: 'macro', name: '宏观', keywords: ['央行', '降准', '降息', 'GDP', 'CPI', 'PPI', '国务院', '政策', '利率', 'MLF', 'LPR', '财政', '货币', '经济', '通胀', '美联储', '加息', '汇率', '人民币'] },
    { tag: 'policy', name: '政策', keywords: ['政策', '新规', '发布', '印发', '通知', '监管', '证监会', '规定', '条例', '办法', '意见', '方案', '银保监'] },
    { tag: 'industry', name: '行业', keywords: ['新能源', '汽车', 'AI', '半导体', '芯片', '光伏', '医药', '地产', '银行', '消费', '科技', '互联网', '锂电', '储能', '创新药', '军工', '煤炭', '石油', '白酒', '房地产', '金融', '上市公司', '财报', '业绩', '减持', '增持', '回购', '股份', '股权', '股东', '董事长', '净利润', '营收', '亏损', '盈利', '同比', '环比', '增长', '下降'] },
    { tag: 'market', name: '市场', keywords: ['A股', '沪指', '深成指', '创业板', '恒生', '美股', '指数', '上涨', '下跌', '收涨', '收跌', '涨幅', '跌幅', '板块', '个股', '涨停', '跌停', '成交', '北向', '南向', '股市', '大盘', '行情', '原油', '黄金', '美元', '债券', '期货', '富时'] }
  ];
  
  // 第一步：过滤，只保留财经相关新闻
  const financeNews = newsList.filter(item => {
    return financeKeywords.some(kw => item.text.includes(kw));
  });
  
  // 如果财经新闻太少，放宽条件（至少有数字+百分号或金融相关词）
  let filteredNews = financeNews;
  if (financeNews.length < 6) {
    // 二次过滤：包含数字%或者亿/元/万美元等财经常用词
    filteredNews = newsList.filter(item => {
      if (financeKeywords.some(kw => item.text.includes(kw))) return true;
      if (/\d+\.?\d*%/.test(item.text)) return true;
      if (/\d+亿/.test(item.text)) return true;
      if (item.text.includes('美元') && /\d/.test(item.text)) return true;
      return false;
    });
  }
  
  // 第二步：去重
  const uniqueNews = [];
  const seen = new Set();
  filteredNews.forEach(item => {
    const key = item.text.substring(0, 20);
    if (!seen.has(key)) {
      seen.add(key);
      uniqueNews.push(item);
    }
  });
  
  // 第三步：分类
  const result = [];
  const tagCount = { macro: 0, policy: 0, industry: 0, market: 0 };
  
  uniqueNews.forEach(item => {
    if (result.length >= 6) return;
    
    let assignedCat = null;
    // 优先匹配最合适的分类
    for (const cat of categories) {
      if (cat.keywords.some(kw => item.text.includes(kw))) {
        if (tagCount[cat.tag] < 2) {
          assignedCat = cat;
          break;
        }
      }
    }
    
    // 如果所有分类都满了2条，但还没凑够6条，允许某些分类超过2条
    if (!assignedCat && result.length < 6) {
      for (const cat of categories) {
        if (cat.keywords.some(kw => item.text.includes(kw))) {
          assignedCat = cat;
          break;
        }
      }
    }
    
    if (assignedCat) {
      tagCount[assignedCat.tag]++;
      result.push({
        text: item.text,
        title: item.text.length > 48 ? item.text.substring(0, 46) + '...' : item.text,
        tag: assignedCat.tag,
        tagName: assignedCat.name,
        time: item.time || 0,
        source: item.source || 'wallstreetcn',
        sourceName: item.sourceName || '华尔街见闻',
        sourceLogo: item.sourceLogo || '',
        sourceUrl: item.sourceUrl || ''
      });
    }
  });
  
  return result;
}

// 更新新闻内容到页面
function updateNewsContent(newsData) {
  const container = document.getElementById('headlines-content');
  if (!container || !newsData || newsData.length === 0) return;
  
  let html = '';
  newsData.forEach(item => {
    html += `
      <div class="news-item">
        <span class="news-tag ${item.tag}">${item.tagName}</span>
        <span class="news-title">${item.title}</span>
      </div>
    `;
  });
  
  container.innerHTML = html;
}


// ============================================
// Tab 3: 热点解读
// ============================================

// ============================================
// 热点话术 - 小红书风格
// ============================================

// 全局变量
let hotspotData = [];
let filteredHotspots = [];
let currentCategory = 'all';
let currentSearchKeyword = '';
let currentPage = 1;
let currentSort = 'hot'; // time: 最新, hot: 最热
const pageSize = 8;
let currentHotspotDetail = null;
let currentResultAngle = 'read';
let currentResultStyle = 'professional';
let generatedScripts = {};
let currentResultHotspot = null;
let currentTopic = null; // 当前选中的话题
let topicList = []; // 话题列表
let selectedTopics = []; // 已选主题（内容行业）
let tempTopics = []; // 临时选择的主题（弹窗中）
let userIndustry = null; // 用户所属金融行业

function initHotspotModule() {
  initHotspotSearch();
  initCategoryTabs();
  initUserIndustry();
  initHotspotCards();
  initLoadMore();
  initRefreshBtn();
  initDetailModal();
  initResultModal();
  initCustomGenModal();
  loadHotspotData();
}

// 加载热点数据（使用华尔街见闻API + 历史数据扩展）
function loadHotspotData(isRefresh) {
  const feedList = document.getElementById('hotspot-feed-list');
  
  // 非刷新模式（首次加载）显示加载状态
  if (!isRefresh && feedList) {
    feedList.innerHTML = `
      <div class="hotspot-loading" id="hotspot-loading">
        <div class="loading-spinner"></div>
        <span>正在加载实时热点...</span>
      </div>
    `;
  }
  
  return new Promise((resolve, reject) => {
    loadRealTimeNews()
      .then(news => {
        // 转换为热点数据格式
        const realtimeData = convertNewsToHotspots(news);
        // 扩展为一周内的数据
        let fullData = expandToWeeklyData(realtimeData);
        
        // 刷新模式下，如果有待刷新的模拟新热点，也加进去（便于演示）
        if (isRefresh && newHotspotCount > 0) {
          const mockNewOnes = generateMockNewHotspots(newHotspotCount);
          fullData = [...mockNewOnes, ...fullData];
        }
        
        hotspotData = fullData;
        filteredHotspots = [...hotspotData];
        // 执行筛选和排序（包含行业相关度排序）
        filterHotspots();
        resolve(fullData);
      })
      .catch(() => {
        // API失败时使用模拟数据
        const mockData = getMockHotspotData();
        let fullData = expandToWeeklyData(mockData);
        
        // 刷新模式下，如果有待刷新的模拟新热点，也加进去（便于演示）
        if (isRefresh && newHotspotCount > 0) {
          const mockNewOnes = generateMockNewHotspots(newHotspotCount);
          fullData = [...mockNewOnes, ...fullData];
        }
        
        hotspotData = fullData;
        filteredHotspots = [...hotspotData];
        // 执行筛选和排序（包含行业相关度排序）
        filterHotspots();
        resolve(fullData);
      });
  });
}

// 将实时数据扩展为一周内的历史数据（按时间倒序）
function expandToWeeklyData(realtimeData) {
  if (!realtimeData || realtimeData.length === 0) return [];
  
  const result = [];
  const now = Date.now() / 1000;
  
  // 1. 实时数据作为最新的（0-2小时前）
  realtimeData.forEach((item, index) => {
    const newItem = { ...item };
    newItem.id = 'hotspot_real_' + simpleHash(item.content || item.title || item.summary || '');
    newItem.timestamp = now - index * 300; // 每条间隔5分钟
    newItem.time = formatTimeAgo(newItem.timestamp);
    newItem.views = Math.floor(Math.random() * 9000) + 3000;
    newItem.viewsText = formatViews(newItem.views);
    result.push(newItem);
  });
  
  // 2. 生成历史数据（2小时前 - 7天前）
  const templates = buildHistoryTemplates(realtimeData);
  const categories = ['policy', 'market', 'industry', 'macro', 'stock'];
  const categoryInfo = {
    macro: { name: '宏观', icon: '📊' },
    policy: { name: '政策', icon: '📋' },
    industry: { name: '行业', icon: '🏭' },
    market: { name: '市场', icon: '📈' },
    stock: { name: '个股', icon: '💹' }
  };
  
  // 资讯源列表
  const sourceKeys = Object.keys(NEWS_SOURCES);
  
  // 每天生成约8-12条，共7天
  for (let day = 0; day < 7; day++) {
    const countPerDay = 8 + Math.floor(Math.random() * 5);
    for (let i = 0; i < countPerDay; i++) {
      // 计算时间：2小时前 + day天 + 当天偏移
      const hoursAgo = 2 + day * 24 + Math.floor(Math.random() * 20);
      const minutesAgo = Math.floor(Math.random() * 60);
      const timestamp = now - (hoursAgo * 3600 + minutesAgo * 60);
      
      // 随机选一个模板作为基础
      const template = templates[Math.floor(Math.random() * templates.length)];
      const category = categories[Math.floor(Math.random() * categories.length)];
      const catInfo = categoryInfo[category];
      
      // 基于模板生成变体
      const content = generateVariantContent(template, category, day);
      const tags = generateTags(content, category);
      const views = Math.floor(Math.random() * 7000) + 500;
      
      // 随机分配资讯源
      const randomSource = sourceKeys[Math.floor(Math.random() * sourceKeys.length)];
      const sourceInfo = NEWS_SOURCES[randomSource];
      
      // 基于内容关键词构建搜索链接（作为历史数据的原文链接）
      const searchKeyword = encodeURIComponent(content.title.substring(0, 10));
      const articleUrl = sourceInfo.searchUrl + searchKeyword;
      
      result.push({
        id: 'hotspot_hist_' + simpleHash(content.title),
        title: content.title,
        summary: content.summary,
        content: content.full,
        category: category,
        categoryName: catInfo.name,
        categoryIcon: catInfo.icon,
        tags: tags,
        views: views,
        viewsText: formatViews(views),
        time: formatTimeAgo(timestamp),
        timestamp: timestamp,
        sourceName: sourceInfo.name,
        sourceLogo: sourceInfo.logo,
        sourceUrl: articleUrl
      });
    }
  }
  
  // 按时间倒序排列（最新的在前）
  result.sort((a, b) => b.timestamp - a.timestamp);
  
  return result;
}

// 从实时数据中提取模板主题
function buildHistoryTemplates(realtimeData) {
  const templates = [];
  
  realtimeData.forEach(item => {
    templates.push({
      baseText: item.content || item.title || item.summary || '',
      category: item.category
    });
  });
  
  // 如果实时数据太少，补充一些通用模板
  const fallbackTemplates = [
    '央行开展MLF操作，中标利率维持不变',
    'A股三大指数震荡整理，成交额突破万亿',
    '新能源板块持续走强，龙头股创历史新高',
    '国务院常务会议部署稳经济一揽子政策',
    '半导体行业景气度回升，产业链订单饱满',
    '房地产政策持续优化，多地调整限购政策',
    '北向资金净买入超50亿元，连续3日加仓',
    '医药板块迎来政策利好，创新药企业受关注',
    '美联储会议纪要释放鸽派信号，美股收涨',
    '人民币汇率保持稳定，跨境资金流动平稳',
    '光伏产业链价格企稳，下游需求逐步回暖',
    '军工板块异动拉升，行业订单持续增长',
    '消费复苏预期升温，白酒食品饮料表现活跃',
    '银行板块估值修复，多家银行发布业绩快报',
    'AI应用加速落地，大模型商业化进程加快',
    '煤炭价格维持高位，煤企业绩超预期',
    '券商板块异动，市场交投热情提升',
    '黄金价格创近期新高，避险情绪升温',
    '证监会发布新规，进一步规范市场秩序',
    '新能源汽车出口量创新高，海外市场拓展顺利'
  ];
  
  fallbackTemplates.forEach(text => {
    templates.push({ baseText: text, category: 'market' });
  });
  
  return templates;
}

// 基于模板生成变体内容
function generateVariantContent(template, category, dayAgo) {
  const text = template.baseText;
  
  // 不同的变化方式
  const variants = [
    // 方式1：添加时间/数据变化
    () => {
      const change = ['上涨', '下跌', '回升', '回落', '走强', '走弱', '反弹', '调整'][Math.floor(Math.random() * 8)];
      const pct = (Math.random() * 3 + 0.5).toFixed(2);
      return {
        title: text.length > 28 ? text.substring(0, 26) + '...' : text,
        summary: text + '。' + '相关板块' + change + pct + '%，市场关注度持续提升。',
        full: text + '。' + '相关板块' + change + pct + '%，市场关注度持续提升。业内人士表示，后续走势仍需观察基本面变化。'
      };
    },
    // 方式2：添加机构观点
    () => {
      const orgs = ['中信证券', '国泰君安', '海通证券', '招商证券', '广发证券', '华泰证券'];
      const org = orgs[Math.floor(Math.random() * orgs.length)];
      return {
        title: text.length > 28 ? text.substring(0, 26) + '...' : text,
        summary: text + '。' + org + '发布研报指出，行业基本面持续向好，建议关注相关投资机会。',
        full: text + '。' + org + '发布研报指出，行业基本面持续向好，政策支持力度不断加大，建议关注相关投资机会。中长期来看，行业发展空间广阔。'
      };
    },
    // 方式3：添加数据更新
    () => {
      const num = (Math.random() * 50 + 10).toFixed(1);
      const unit = ['亿元', '万手', '万吨', '亿美元'][Math.floor(Math.random() * 4)];
      return {
        title: text.length > 28 ? text.substring(0, 26) + '...' : text,
        summary: text + '。最新数据显示，相关规模已达' + num + unit + '，同比增长明显。',
        full: text + '。最新数据显示，相关规模已达' + num + unit + '，同比增长明显。市场分析认为，这一趋势有望延续。'
      };
    },
    // 方式4：政策相关
    () => {
      const depts = ['发改委', '工信部', '财政部', '央行', '证监会', '银保监会'];
      const dept = depts[Math.floor(Math.random() * depts.length)];
      return {
        title: text.length > 28 ? text.substring(0, 26) + '...' : text,
        summary: text + '。' + dept + '表态将继续支持行业发展，相关配套政策有望陆续出台。',
        full: text + '。' + dept + '表态将继续支持行业发展，相关配套政策有望陆续出台。企业普遍反映，政策环境持续优化，发展信心不断增强。'
      };
    }
  ];
  
  const variant = variants[Math.floor(Math.random() * variants.length)];
  return variant();
}

// 生成标签
function generateTags(content, category) {
  const tagKeywords = {
    macro: ['央行', '降准', '降息', 'GDP', 'CPI', 'MLF', 'LPR', '货币政策', '财政政策', '美联储', '汇率', '人民币', '流动性'],
    policy: ['政策', '新规', '证监会', '监管', '国务院', '意见', '方案', '规定'],
    industry: ['新能源', '汽车', 'AI', '半导体', '芯片', '光伏', '医药', '地产', '银行', '消费', '科技', '锂电', '储能', '创新药', '军工', '煤炭', '白酒'],
    market: ['A股', '沪指', '创业板', '恒生', '美股', '指数', '上涨', '下跌', '板块', '北向', '股市', '行情', '黄金', '债券'],
    stock: ['涨停', '跌停', '业绩', '财报', '净利润', '营收', '回购', '分红']
  };
  
  const keywords = tagKeywords[category] || tagKeywords.market;
  const tags = [];
  const text = content.title + content.summary;
  
  for (const kw of keywords) {
    if (text.includes(kw) && tags.length < 3) {
      tags.push(kw);
    }
  }
  
  if (tags.length === 0) {
    const shuffled = [...keywords].sort(() => Math.random() - 0.5);
    tags.push(...shuffled.slice(0, 2 + Math.floor(Math.random() * 2)));
  }
  
  return tags;
}

// 格式化时间（几分钟前/几小时前/几天前）
function formatTimeAgo(timestamp) {
  const now = Date.now() / 1000;
  const diff = now - timestamp;
  
  if (diff < 60) return '刚刚';
  if (diff < 3600) return Math.floor(diff / 60) + '分钟前';
  if (diff < 86400) return Math.floor(diff / 3600) + '小时前';
  return Math.floor(diff / 86400) + '天前';
}

// 格式化阅读量
function formatViews(views) {
  if (views >= 10000) {
    return (views / 10000).toFixed(1) + '万';
  }
  return views.toString();
}

// 简单的字符串哈希函数（生成稳定的短哈希值
function simpleHash(str) {
  let hash = 0;
  if (!str || str.length === 0) return hash;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }
  return Math.abs(hash).toString(36);
}

// 将新闻数据转换为热点卡片格式
function convertNewsToHotspots(newsList) {
  const categoryMap = {
    macro: { name: '宏观', icon: '📊', color: '#3b82f6' },
    policy: { name: '政策', icon: '📋', color: '#8b5cf6' },
    industry: { name: '行业', icon: '🏭', color: '#f59e0b' },
    market: { name: '市场', icon: '📈', color: '#10b981' },
    stock: { name: '个股', icon: '💹', color: '#ef4444' }
  };
  
  // 可用的资讯源列表（用于历史数据随机分配）
  const sourceKeys = Object.keys(NEWS_SOURCES);
  
  return newsList.map((item, index) => {
    // 兼容两种数据格式：processNewsData返回的{title, tag}格式 和 原始的{text, category}格式
    const text = item.text || item.title || item.content || '';
    let category = item.category || item.tag || 'market';
    
    // 校验分类有效性
    if (!categoryMap[category]) {
      category = 'market';
    }
    
    // 部分随机分配为个股
    if (index % 7 === 0) category = 'stock';
    
    const catInfo = categoryMap[category] || categoryMap.market;
    const title = text.length > 30 ? text.substring(0, 30) + '...' : text;
    const summary = text.length > 80 ? text.substring(0, 80) + '...' : text;
    
    // 提取标签
    const tags = extractTags(text, category);
    
    // 生成阅读量
    const views = Math.floor(Math.random() * 9000) + 1000;
    
    // 格式化时间
    let timeStr = '刚刚';
    if (item.time) {
      const diff = Date.now() / 1000 - item.time;
      if (diff < 300) timeStr = '刚刚';
      else if (diff < 3600) timeStr = Math.floor(diff / 60) + '分钟前';
      else if (diff < 86400) timeStr = Math.floor(diff / 3600) + '小时前';
      else timeStr = Math.floor(diff / 86400) + '天前';
    } else {
      const times = ['刚刚', '5分钟前', '10分钟前', '30分钟前', '1小时前', '2小时前', '3小时前'];
      timeStr = times[index % times.length];
    }
    
    // 来源信息：如果数据中有就用数据中的，没有就随机分配
    let sourceName = item.sourceName;
    let sourceLogo = item.sourceLogo;
    let sourceUrl = item.sourceUrl;
    
    if (!sourceName) {
      const randomSource = sourceKeys[Math.floor(Math.random() * sourceKeys.length)];
      const sourceInfo = NEWS_SOURCES[randomSource];
      sourceName = sourceInfo.name;
      sourceLogo = sourceInfo.logo;
      sourceUrl = sourceInfo.url;
    }
    
    // 基于标题生成稳定ID（同一条新闻每次生成ID都一样，便于新旧数据对比）
    const stableId = 'hotspot_' + simpleHash(text);
    
    return {
      id: stableId,
      title: title,
      summary: summary,
      content: text,
      category: category,
      categoryName: catInfo.name,
      categoryIcon: catInfo.icon,
      categoryColor: catInfo.color,
      tags: tags,
      views: views,
      viewsText: views >= 10000 ? (views / 10000).toFixed(1) + '万' : views.toString(),
      time: timeStr,
      timestamp: item.time || Date.now() / 1000 - index * 600,
      sourceName: sourceName,
      sourceLogo: sourceLogo,
      sourceUrl: sourceUrl
    };
  });
}

// 从文本中提取标签
function extractTags(text, category) {
  const tagKeywords = {
    macro: ['央行', '降准', '降息', 'GDP', 'CPI', 'PPI', 'MLF', 'LPR', '货币政策', '财政政策', '美联储', '加息', '汇率', '人民币', '流动性', '经济', '通胀'],
    policy: ['政策', '新规', '发布', '证监会', '监管', '国务院', '印发', '意见', '方案', '规定', '条例'],
    industry: ['新能源', '汽车', 'AI', '半导体', '芯片', '光伏', '医药', '地产', '银行', '消费', '科技', '互联网', '锂电', '储能', '创新药', '军工', '煤炭', '石油', '白酒'],
    market: ['A股', '沪指', '深成指', '创业板', '恒生', '美股', '指数', '上涨', '下跌', '收涨', '收跌', '涨幅', '跌幅', '板块', '个股', '北向', '南向', '股市', '大盘', '行情', '原油', '黄金', '债券', '期货'],
    stock: ['涨停', '跌停', '业绩', '财报', '净利润', '营收', '回购', '分红', '并购', '重组']
  };
  
  const keywords = tagKeywords[category] || tagKeywords.market;
  const tags = [];
  
  for (const kw of keywords) {
    if (text.includes(kw) && tags.length < 3) {
      tags.push(kw);
    }
  }
  
  if (tags.length === 0) {
    // 如果没有匹配到标签，随机取几个
    const shuffled = [...keywords].sort(() => Math.random() - 0.5);
    tags.push(...shuffled.slice(0, 2));
  }
  
  return tags;
}

// 模拟数据（备用）
function getMockHotspotData() {
  const categories = [
    { key: 'policy', name: '政策', icon: '📋' },
    { key: 'market', name: '市场', icon: '📈' },
    { key: 'industry', name: '行业', icon: '🏭' },
    { key: 'macro', name: '宏观', icon: '📊' },
    { key: 'stock', name: '个股', icon: '💹' }
  ];
  
  const mockNews = [
    '央行宣布降准0.25个百分点，释放长期资金约5000亿元，支持实体经济发展',
    '新能源汽车销量再创新高，比亚迪单月销量突破30万辆',
    'A股三大指数集体收涨，创业板指涨超2%，科技板块领涨',
    '国务院印发关于促进民营经济发展壮大的意见，多项重磅政策出台',
    '美联储宣布暂停加息，市场风险偏好明显提升',
    '半导体行业迎来拐点，国产替代加速推进，相关概念股表现活跃',
    '房地产政策持续优化，多地放松限购限贷，地产股集体走强',
    'AI大模型应用加速落地，多模态大模型成为行业新风口',
    '人民币汇率持续升值，跨境资金流动保持平稳有序',
    '白酒板块迎来反弹，消费复苏预期持续升温',
    '医药创新政策利好频出，创新药ETF连续多日净流入',
    '北向资金大幅加仓A股，单日净买入超百亿创年内新高',
    '光伏产业链价格企稳，行业供需格局逐步改善',
    '军工板块异军突起，行业景气度持续上行',
    '煤炭价格高位运行，上市煤企业绩大幅增长'
  ];
  
  // 资讯源列表
  const sourceKeys = Object.keys(NEWS_SOURCES);
  
  return mockNews.map((text, index) => {
    const cat = categories[index % categories.length];
    const views = Math.floor(Math.random() * 9000) + 1000;
    const tags = extractTags(text, cat.key);
    const times = ['刚刚', '5分钟前', '10分钟前', '30分钟前', '1小时前', '2小时前', '3小时前'];
    
    // 随机分配资讯源
    const randomSource = sourceKeys[Math.floor(Math.random() * sourceKeys.length)];
    const sourceInfo = NEWS_SOURCES[randomSource];
    
    // 基于内容关键词构建搜索链接
    const searchKeyword = encodeURIComponent(text.substring(0, 10));
    const articleUrl = sourceInfo.searchUrl + searchKeyword;
    
    return {
      id: 'hotspot_mock_' + index,
      title: text.length > 30 ? text.substring(0, 30) + '...' : text,
      summary: text.length > 80 ? text.substring(0, 80) + '...' : text,
      content: text,
      category: cat.key,
      categoryName: cat.name,
      categoryIcon: cat.icon,
      tags: tags,
      views: views,
      viewsText: views >= 10000 ? (views / 10000).toFixed(1) + '万' : views.toString(),
      time: times[index % times.length],
      timestamp: Date.now() / 1000 - index * 600,
      sourceName: sourceInfo.name,
      sourceLogo: sourceInfo.logo,
      sourceUrl: articleUrl
    };
  });
}

// 渲染热点卡片（微博风格）
function renderHotspotCards() {
  const feedList = document.getElementById('hotspot-feed-list');
  const loadingEl = document.getElementById('hotspot-loading');
  
  if (loadingEl) {
    loadingEl.style.display = 'none';
  }
  
  if (!feedList) return;
  
  if (filteredHotspots.length === 0) {
    feedList.innerHTML = `
      <div class="hotspot-empty">
        <div class="hotspot-empty-icon">🔍</div>
        <h3>暂无相关热点</h3>
        <p>试试其他关键词或分类吧</p>
      </div>
    `;
    updateSidebarCounts();
    return;
  }
  
  const showCount = Math.min(currentPage * pageSize, filteredHotspots.length);
  const showData = filteredHotspots.slice(0, showCount);
  
  let html = '';
  showData.forEach((item, index) => {
    const commentCount = Math.floor(item.views * 0.02);
    const shareCount = Math.floor(item.views * 0.01);
    const likeCount = Math.floor(item.views * 0.05);
    
    // 来源信息
    const sourceName = item.sourceName || '财经资讯';
    const sourceLogo = item.sourceLogo || '';
    const sourceUrl = item.sourceUrl || '';
    
    // 构建头像HTML
    let avatarHtml = '';
    if (sourceLogo) {
      avatarHtml = `<img src="${sourceLogo}" alt="${sourceName}" class="feed-card-avatar-img" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><span class="feed-card-avatar-text" style="display:none">${sourceName.charAt(0)}</span>`;
    } else {
      avatarHtml = `<span class="feed-card-avatar-text">${sourceName.charAt(0)}</span>`;
    }
    
    // 构建来源链接
    const sourceLinkHtml = sourceUrl 
      ? `<a href="${sourceUrl}" target="_blank" class="feed-source-link" onclick="event.stopPropagation()">${sourceName}</a>`
      : sourceName;
    
    // 计算热度值和热度等级
    const hotScore = calculateHotScore(item);
    const hotLevel = getHotLevel(hotScore);
    
    // 计算行业相关度
    const industryRelevance = calculateUserIndustryRelevance(item);
    const industryConfig = USER_INDUSTRIES.find(i => i.id === userIndustry);
    let industryBadge = '';
    if (userIndustry && industryRelevance > 0 && industryConfig) {
      // 根据相关度显示不同的标签（使用三级权重后的新阈值）
      if (industryRelevance >= 20) {
        industryBadge = `<span class="industry-match-badge high">💡 高度匹配</span>`;
      } else if (industryRelevance >= 10) {
        industryBadge = `<span class="industry-match-badge medium">💡 适合营销</span>`;
      } else {
        industryBadge = `<span class="industry-match-badge low">💡 可参考</span>`;
      }
    }
    
    html += `
      <div class="hotspot-feed-card" data-id="${item.id}">
        <div class="feed-card-header">
          <div class="feed-card-avatar">${avatarHtml}</div>
          <div class="feed-card-meta">
            <div class="feed-card-source">
              ${sourceLinkHtml}
              <span class="feed-card-cat-tag">${item.categoryName}</span>
              ${industryBadge}
            </div>
            <div class="feed-card-time">${item.time} · ${item.viewsText}阅读 · 🔥 ${formatNumber(hotScore)}热度</div>
          </div>
        </div>
        <div class="feed-card-body">
          <div class="feed-card-title-row">
            <div class="feed-card-title">${item.title}</div>
            ${hotLevel ? `<span class="hot-badge hot-badge-${hotLevel.level}">${hotLevel.icon} ${hotLevel.label}</span>` : ''}
          </div>
          <div class="feed-card-summary">${item.summary}</div>
        </div>
        <div class="feed-card-tags">
          ${item.tags.map(tag => `<span class="feed-card-tag">#${tag}</span>`).join('')}
        </div>
        <div class="feed-card-footer">
          <div class="feed-card-stats">
            <span class="feed-card-stat">💬 ${formatNumber(commentCount)}</span>
            <span class="feed-card-stat">🔄 ${formatNumber(shareCount)}</span>
            <span class="feed-card-stat">👍 ${formatNumber(likeCount)}</span>
          </div>
          <div class="feed-card-actions">
            <button class="feed-action-btn" onclick="event.stopPropagation(); openHotspotDetail('${item.id}')">
              查看详情
            </button>
            <button class="feed-action-btn primary" onclick="event.stopPropagation(); generateScriptFromCard('${item.id}')">
              <i data-lucide="sparkles" style="width:14px;height:14px;stroke-width:1.75;"></i> 热点解读
            </button>
          </div>
        </div>
      </div>
    `;
  });
  
  feedList.innerHTML = html;
  
  // 刷新图标
  refreshIcons(feedList);
  
  // 绑定卡片点击事件
  document.querySelectorAll('.hotspot-feed-card').forEach(card => {
    card.addEventListener('click', function() {
      const id = this.dataset.id;
      openHotspotDetail(id);
    });
  });
  
  // 更新加载更多按钮状态
  const loadMoreBtn = document.getElementById('load-more-hotspot');
  if (loadMoreBtn) {
    if (showCount >= filteredHotspots.length) {
      loadMoreBtn.textContent = '— 已加载全部内容 —';
      loadMoreBtn.disabled = true;
    } else {
      loadMoreBtn.textContent = '加载更多';
      loadMoreBtn.disabled = false;
    }
  }
  
  // 更新侧边栏
  updateSidebarCounts();
  renderHotRankList();
  renderTopicList();
}

// 格式化数字
function formatNumber(num) {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万';
  }
  return num.toString();
}

// 更新侧边栏分类数量
function updateSidebarCounts() {
  const categories = ['all', 'policy', 'market', 'industry', 'macro', 'stock'];
  categories.forEach(cat => {
    const countEl = document.getElementById('count-' + cat);
    if (!countEl) return;
    if (cat === 'all') {
      countEl.textContent = hotspotData.length;
    } else {
      countEl.textContent = hotspotData.filter(h => h.category === cat).length;
    }
  });
}

// 渲染热搜榜
function renderHotRankList() {
  const rankList = document.getElementById('hot-rank-list');
  if (!rankList) return;
  
  // 按热度值排序取前6（综合阅读量和时间衰减）
  const topHot = [...hotspotData]
    .sort((a, b) => calculateHotScore(b) - calculateHotScore(a))
    .slice(0, 6);
  
  let html = '';
  topHot.forEach((item, index) => {
    const heat = calculateHotScore(item);
    html += `
      <div class="hot-rank-item" data-id="${item.id}">
        <span class="hot-rank-num">${index + 1}</span>
        <span class="hot-rank-text">${item.title.length > 18 ? item.title.substring(0, 16) + '...' : item.title}</span>
        <span class="hot-rank-heat">${formatNumber(heat)}</span>
      </div>
    `;
  });
  
  rankList.innerHTML = html;
  
  // 绑定点击事件
  document.querySelectorAll('.hot-rank-item').forEach(item => {
    item.addEventListener('click', function() {
      const id = this.dataset.id;
      openHotspotDetail(id);
    });
  });
}

// ============================================
// 话题聚合
// ============================================

// 定义预定义话题
const PREDEFINED_TOPICS = [
  {
    id: 'topic_rate_cut',
    name: '央行降准降息',
    keywords: ['降准', '降息', '央行', 'LPR', 'MLF', '流动性', '利率'],
    icon: '🏦'
  },
  {
    id: 'topic_new_energy',
    name: '新能源赛道',
    keywords: ['新能源', '光伏', '锂电', '储能', '风电', '新能源车', '电池'],
    icon: '🔋'
  },
  {
    id: 'topic_ai',
    name: 'AI人工智能',
    keywords: ['AI', '人工智能', '大模型', '算力', '芯片', '半导体', 'GPT'],
    icon: '🤖'
  },
  {
    id: 'topic_policy',
    name: '政策利好',
    keywords: ['政策', '国务院', '证监会', '监管', '新规', '支持', '促进'],
    icon: '📋'
  },
  {
    id: 'topic_real_estate',
    name: '房地产政策',
    keywords: ['房地产', '地产', '限购', '房贷', '楼市', '房企', '保交楼'],
    icon: '🏠'
  },
  {
    id: 'topic_medicine',
    name: '医药健康',
    keywords: ['医药', '创新药', '医疗', '生物', '健康', '医保', 'CXO'],
    icon: '💊'
  },
  {
    id: 'topic_consume',
    name: '消费复苏',
    keywords: ['消费', '白酒', '食品饮料', '零售', '旅游', '餐饮', '复苏'],
    icon: '🛒'
  },
  {
    id: 'topic_northbound',
    name: '北向资金',
    keywords: ['北向资金', '外资', '净买入', '加仓', '减仓', '南下资金'],
    icon: '💹'
  }
];

// 构建话题列表
function buildTopicList() {
  topicList = [];
  
  PREDEFINED_TOPICS.forEach(topic => {
    // 统计匹配的热点数量和总热度
    const matchedHotspots = hotspotData.filter(item => {
      const text = (item.title + item.summary + item.content + item.tags.join('')).toLowerCase();
      return topic.keywords.some(kw => text.includes(kw.toLowerCase()));
    });
    
    if (matchedHotspots.length > 0) {
      // 计算话题总热度
      const totalHeat = matchedHotspots.reduce((sum, item) => sum + calculateHotScore(item), 0);
      // 取前3个标签
      const tags = topic.keywords.slice(0, 3);
      
      topicList.push({
        ...topic,
        count: matchedHotspots.length,
        heat: totalHeat,
        hotspots: matchedHotspots
      });
    }
  });
  
  // 按热度排序
  topicList.sort((a, b) => b.heat - a.heat);
}

// 渲染话题列表
function renderTopicList() {
  const topicListEl = document.getElementById('topic-list');
  if (!topicListEl) return;
  
  // 构建话题
  buildTopicList();
  
  // 取前6个话题
  const showTopics = topicList.slice(0, 6);
  
  let html = '';
  showTopics.forEach(topic => {
    const isActive = currentTopic === topic.id;
    html += `
      <div class="topic-item ${isActive ? 'active' : ''}" data-topic="${topic.id}">
        <div class="topic-header">
          <span class="topic-name">${topic.icon} ${topic.name}</span>
          <span class="topic-count">${topic.count}条</span>
        </div>
        <div class="topic-tags">
          ${topic.keywords.slice(0, 3).map(tag => `<span class="topic-tag">#${tag}</span>`).join('')}
        </div>
      </div>
    `;
  });
  
  if (showTopics.length === 0) {
    html = '<div style="padding: 16px; text-align: center; color: var(--muted); font-size: 12px;">暂无热门话题</div>';
  }
  
  topicListEl.innerHTML = html;
  
  // 绑定点击事件
  document.querySelectorAll('.topic-item').forEach(item => {
    item.addEventListener('click', function() {
      const topicId = this.dataset.topic;
      selectTopic(topicId);
    });
  });
}

// 选择话题
function selectTopic(topicId) {
  if (currentTopic === topicId) {
    // 再次点击取消选择
    currentTopic = null;
    filterHotspots();
  } else {
    currentTopic = topicId;
    filterByTopic(topicId);
  }
  
  renderTopicList();
}

// 按话题筛选热点
function filterByTopic(topicId) {
  const topic = topicList.find(t => t.id === topicId);
  if (!topic) return;
  
  const topicKeywords = topic.keywords;
  
  filteredHotspots = hotspotData.filter(item => {
    const text = (item.title + item.summary + item.content + item.tags.join('')).toLowerCase();
    return topicKeywords.some(kw => text.includes(kw.toLowerCase()));
  });
  
  // 排序
  if (currentSort === 'hot') {
    filteredHotspots.sort((a, b) => calculateHotScore(b) - calculateHotScore(a));
  } else {
    filteredHotspots.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }
  
  currentPage = 1;
  renderHotspotCards();
  
  // 更新行业推荐提示
  updateIndustryRecommendTip();
}

// 搜索功能
function initHotspotSearch() {
  const searchInput = document.getElementById('hotspot-search');
  if (!searchInput) return;
  
  let timeoutId;
  searchInput.addEventListener('input', function() {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      currentSearchKeyword = this.value.trim().toLowerCase();
      filterHotspots();
    }, 300);
  });
}

// 分类筛选（顶部tab + 侧边栏）
function initCategoryTabs() {
  // 顶部tab栏
  const topTabs = document.querySelectorAll('.hotspot-tab');
  topTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      const category = this.dataset.category;
      switchCategory(category);
    });
  });
  
  // 侧边栏分类导航
  const sideNavItems = document.querySelectorAll('.category-nav-item');
  sideNavItems.forEach(item => {
    item.addEventListener('click', function() {
      const category = this.dataset.category;
      switchCategory(category);
    });
  });
}

// 排序切换
function initSortTabs() {
  const sortTabs = document.querySelectorAll('.sort-tab');
  sortTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      const sort = this.dataset.sort;
      switchSort(sort);
    });
  });
}

// 主题列表（内容行业/主题）
const TOPIC_LIST = [
  { id: 'new_energy', name: '新能源', icon: '🔋', keywords: ['新能源', '光伏', '锂电', '储能', '风电', '新能源车'] },
  { id: 'ai_semi', name: 'AI/半导体', icon: '🤖', keywords: ['AI', '人工智能', '大模型', '算力', '芯片', '半导体'] },
  { id: 'medicine', name: '医药健康', icon: '💊', keywords: ['医药', '创新药', '医疗', '生物', '健康', '医保'] },
  { id: 'consume', name: '消费零售', icon: '🛒', keywords: ['消费', '白酒', '食品饮料', '零售', '旅游', '餐饮'] },
  { id: 'real_estate', name: '房地产', icon: '🏠', keywords: ['房地产', '地产', '限购', '房贷', '楼市', '房企'] },
  { id: 'finance', name: '金融', icon: '💰', keywords: ['银行', '券商', '保险', '金融', '信托', '基金'] },
  { id: 'military', name: '军工', icon: '⚔️', keywords: ['军工', '国防', '航空', '航天', '导弹', '无人机'] },
  { id: 'auto', name: '汽车', icon: '🚗', keywords: ['汽车', '整车', '零部件', '智能驾驶', '新能源车'] },
  { id: 'electronics', name: '电子', icon: '📱', keywords: ['电子', '消费电子', '芯片', '半导体', '5G', '通信'] },
  { id: 'energy', name: '能源化工', icon: '⛽', keywords: ['煤炭', '石油', '天然气', '化工', '能源', '电力'] }
];

// 初始化主题筛选
function initTopicFilter() {
  const topicFilter = document.getElementById('topic-filter');
  if (!topicFilter) return;
  
  // 渲染主题选项
  renderTopicOptions();
  
  // 点击展开/收起
  topicFilter.addEventListener('click', function(e) {
    e.stopPropagation();
    this.classList.toggle('open');
    if (this.classList.contains('open')) {
      // 打开时同步临时选择
      tempTopics = [...selectedTopics];
      renderTopicOptions();
    }
  });
  
  // 点击外部关闭
  document.addEventListener('click', function(e) {
    if (!topicFilter.contains(e.target)) {
      topicFilter.classList.remove('open');
    }
  });
}

// 渲染主题选项
function renderTopicOptions() {
  const optionsEl = document.getElementById('topic-options');
  if (!optionsEl) return;
  
  let html = '';
  TOPIC_LIST.forEach(topic => {
    const isChecked = tempTopics.includes(topic.id);
    html += `
      <div class="industry-option" data-id="${topic.id}">
        <input type="checkbox" id="top-${topic.id}" ${isChecked ? 'checked' : ''}>
        <span class="industry-option-icon">${topic.icon}</span>
        <span class="industry-option-name">${topic.name}</span>
      </div>
    `;
  });
  
  optionsEl.innerHTML = html;
  
  // 绑定点击事件
  optionsEl.querySelectorAll('.industry-option').forEach(option => {
    option.addEventListener('click', function(e) {
      e.stopPropagation();
      const id = this.dataset.id;
      const checkbox = this.querySelector('input');
      
      if (tempTopics.includes(id)) {
        tempTopics = tempTopics.filter(i => i !== id);
        checkbox.checked = false;
      } else {
        tempTopics.push(id);
        checkbox.checked = true;
      }
    });
  });
}

// 重置主题选择
function resetTopic() {
  tempTopics = [];
  renderTopicOptions();
}

// 应用主题筛选
function applyTopic() {
  selectedTopics = [...tempTopics];
  
  // 更新显示文字
  const textEl = document.getElementById('topic-filter-text');
  if (textEl) {
    if (selectedTopics.length === 0) {
      textEl.textContent = '全部主题';
    } else if (selectedTopics.length === 1) {
      const topic = TOPIC_LIST.find(i => i.id === selectedTopics[0]);
      textEl.textContent = topic ? topic.name : '已选1个';
    } else {
      textEl.textContent = `已选${selectedTopics.length}个`;
    }
  }
  
  // 关闭下拉
  document.getElementById('topic-filter').classList.remove('open');
  
  // 重新筛选
  filterHotspots();
}

// 获取主题筛选的关键词
function getTopicKeywords() {
  const keywords = [];
  selectedTopics.forEach(topicId => {
    const topic = TOPIC_LIST.find(i => i.id === topicId);
    if (topic) {
      keywords.push(...topic.keywords);
    }
  });
  return keywords;
}

// 切换排序方式
function switchSort(sort) {
  if (currentSort === sort) return;
  currentSort = sort;
  
  // 更新tab状态
  document.querySelectorAll('.sort-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.sort === sort);
  });
  
  // 更新提示文字
  const hintEl = document.getElementById('sort-hint');
  if (hintEl) {
    hintEl.textContent = sort === 'time' ? '按发布时间排序' : '按热度高低排序';
  }
  
  filterHotspots();
}

// 计算热度值（综合阅读、互动和时间衰减）
function calculateHotScore(item) {
  const views = item.views || 0;
  const now = Date.now() / 1000;
  const ageHours = Math.max(1, (now - (item.timestamp || 0)) / 3600);
  
  // 热度公式：阅读量 * 时间衰减因子
  // 24小时内衰减较慢，之后加速衰减
  const decay = ageHours <= 24 ? 1 : Math.pow(0.95, (ageHours - 24) / 6);
  return Math.floor(views * decay);
}

// 获取热度等级
function getHotLevel(hotScore) {
  if (hotScore >= 8000) {
    return { level: 'explosive', label: '爆', icon: '💥' };
  } else if (hotScore >= 5000) {
    return { level: 'hot', label: '热', icon: '🔥' };
  } else if (hotScore >= 3000) {
    return { level: 'warm', label: '暖', icon: '☀️' };
  } else if (hotScore >= 1000) {
    return { level: 'rising', label: '升', icon: '📈' };
  }
  return null;
}

// 切换分类
function switchCategory(category) {
  currentCategory = category;
  currentTopic = null; // 切换分类时重置话题
  
  // 更新顶部tab
  document.querySelectorAll('.hotspot-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.category === category);
  });
  
  // 更新侧边栏导航
  document.querySelectorAll('.category-nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.category === category);
  });
  
  filterHotspots();
}

// 过滤热点
function filterHotspots() {
  const topicKeywords = getTopicKeywords();
  
  filteredHotspots = hotspotData.filter(item => {
    // 分类筛选
    if (currentCategory !== 'all' && item.category !== currentCategory) {
      return false;
    }
    // 关键词搜索
    if (currentSearchKeyword) {
      const searchText = (item.title + item.summary + item.content + item.tags.join('')).toLowerCase();
      if (!searchText.includes(currentSearchKeyword)) {
        return false;
      }
    }
    // 主题筛选
    if (selectedTopics.length > 0) {
      const itemText = (item.title + item.summary + item.content + item.tags.join('')).toLowerCase();
      const matchTopic = topicKeywords.some(kw => itemText.includes(kw.toLowerCase()));
      if (!matchTopic) {
        return false;
      }
    }
    return true;
  });
  
  // 排序
  if (currentSort === 'hot') {
    // 按热度排序
    filteredHotspots.sort((a, b) => {
      // 计算综合得分
      let aScore = calculateHotScore(a);
      let bScore = calculateHotScore(b);
      
      // 如果有用户行业，加入行业相关度权重（最高可提升200%的排序权重）
      if (userIndustry) {
        const aIndScore = calculateUserIndustryRelevance(a);
        const bIndScore = calculateUserIndustryRelevance(b);
        // 行业相关度归一化到0-2.0的范围，乘以基础热度
        const maxIndScore = 50; // 假设最大行业相关度为50
        aScore = aScore * (1 + Math.min(aIndScore / maxIndScore, 2.0));
        bScore = bScore * (1 + Math.min(bIndScore / maxIndScore, 2.0));
      }
      
      // 如果有主题筛选，加入主题相关度权重
      if (selectedTopics.length > 0) {
        const aTopicScore = calculateTopicRelevance(a, topicKeywords);
        const bTopicScore = calculateTopicRelevance(b, topicKeywords);
        aScore = aScore * (1 + Math.min(aTopicScore / 20, 0.3));
        bScore = bScore * (1 + Math.min(bTopicScore / 20, 0.3));
      }
      
      return bScore - aScore;
    });
  } else {
    // 按时间排序（最新在前）
    filteredHotspots.sort((a, b) => {
      // 如果有用户行业，行业相关度高的优先
      if (userIndustry) {
        const aScore = calculateUserIndustryRelevance(a);
        const bScore = calculateUserIndustryRelevance(b);
        // 相关度差异大于5分的，按相关度排；差异小的按时间排
        if (Math.abs(aScore - bScore) > 5) {
          return bScore - aScore;
        }
      }
      if (selectedTopics.length > 0) {
        const aScore = calculateTopicRelevance(a, topicKeywords);
        const bScore = calculateTopicRelevance(b, topicKeywords);
        if (Math.abs(aScore - bScore) > 2) {
          return bScore - aScore;
        }
      }
      return (b.timestamp || 0) - (a.timestamp || 0);
    });
  }
  
  currentPage = 1;
  renderHotspotCards();
  
  // 更新行业推荐提示
  updateIndustryRecommendTip();
}

// 更新行业推荐提示
function updateIndustryRecommendTip() {
  const tipEl = document.getElementById('industry-recommend-tip');
  const nameEl = document.getElementById('industry-recommend-name');
  if (!tipEl || !nameEl) return;
  
  if (userIndustry) {
    const indConfig = USER_INDUSTRIES.find(i => i.id === userIndustry);
    if (indConfig) {
      nameEl.textContent = indConfig.name;
      tipEl.style.display = 'flex';
      
      // 点击行业名称跳转到个人中心
      nameEl.onclick = function(e) {
        e.stopPropagation();
        switchToProfile();
      };
      
      return;
    }
  }
  
  tipEl.style.display = 'none';
}

// 跳转到个人中心
function switchToProfile() {
  const navItems = document.querySelectorAll('.nav-item');
  const tabContents = document.querySelectorAll('.tab-content');
  const pageTitle = document.getElementById('page-title');
  const pageDesc = document.getElementById('page-desc');
  
  // 更新导航
  navItems.forEach(nav => nav.classList.remove('active'));
  const profileNav = document.querySelector('.nav-item[data-tab="profile"]');
  if (profileNav) profileNav.classList.add('active');
  
  // 更新内容
  tabContents.forEach(content => content.classList.remove('active'));
  const profileTab = document.getElementById('tab-profile');
  if (profileTab) profileTab.classList.add('active');
  
  // 更新标题
  if (pageTitle) pageTitle.textContent = '个人中心';
  if (pageDesc) pageDesc.textContent = '管理您的账户信息、会员权益和积分';
  
  // 滚动到顶部
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 计算主题相关度
function calculateTopicRelevance(item, keywords) {
  const text = (item.title + item.summary + item.content + item.tags.join('')).toLowerCase();
  let score = 0;
  keywords.forEach(kw => {
    if (text.includes(kw.toLowerCase())) {
      score++;
    }
  });
  return score;
}

// 用户所属金融行业配置
const USER_INDUSTRIES = [
  {
    id: 'bank',
    name: '银行',
    icon: '🏦',
    desc: '理财、存款、房贷',
    // 适合营销的热点类型（按推荐优先级排序，权重依次递减）
    // 高优先级：直接相关的热点
    // 中优先级：可以引出话题的热点
    // 低优先级：可以蹭热度的热点
    hotspotKeywords: {
      high: ['降准', '降息', 'LPR', '利率', '存款', '理财', '房贷', '流动性', '国债', '大额存单', '消费贷', '经营贷', '养老金', '储蓄'],
      medium: ['GDP', 'CPI', 'PPI', '经济', '政策', '金融', '银行', '央行', '货币'],
      low: ['市场', '股市', '基金', '投资', '资产配置', '财富管理']
    },
    // 话术侧重点
    scriptFocus: ['稳健收益', '风险控制', '资产配置', '财富传承', '家庭理财'],
    // 推荐产品类型
    productTypes: ['理财产品', '大额存单', '基金代销', '保险代销']
  },
  {
    id: 'broker',
    name: '券商',
    icon: '📈',
    desc: '股票、基金、投顾',
    hotspotKeywords: {
      high: ['A股', '股市', '沪指', '创业板', '科创板', '上涨', '下跌', '涨幅', '跌幅', '成交额', '成交量', '北向资金', '港股', '美股', '牛市', '熊市', '反弹', '回调', '券商', '开户', 'ETF', '打新', 'IPO'],
      medium: ['基金', '投顾', '研报', '板块', '行情', '交易', '融资', '融券', '佣金'],
      low: ['经济', '政策', '利率', '流动性', '宏观', '产业']
    },
    scriptFocus: ['市场行情', '投资机会', '板块轮动', '资产配置', '风险提示'],
    productTypes: ['股票开户', '基金', '投顾服务', '融资融券']
  },
  {
    id: 'fund',
    name: '基金',
    icon: '📊',
    desc: '公募、私募基金',
    hotspotKeywords: {
      high: ['基金', '公募基金', '私募基金', 'ETF', '指数基金', '主动基金', '基金经理', '新发基金', '定投', '净值', '重仓股', '持仓', '限购', '分红'],
      medium: ['A股', '股市', '上涨', '下跌', '行情', '板块', '投资', '理财', '资产配置'],
      low: ['经济', '政策', '利率', '宏观', '市场', '金融']
    },
    scriptFocus: ['基金选择', '定投策略', '市场展望', '风险收益', '长期投资'],
    productTypes: ['权益基金', '债券基金', '指数基金', 'FOF']
  },
  {
    id: 'insurance',
    name: '保险',
    icon: '🛡️',
    desc: '寿险、财险、健康险',
    hotspotKeywords: {
      high: ['保险', '养老', '医疗', '健康', '重疾', '寿险', '保障', '风险', '意外', '家庭', '子女教育', '财富传承', '养老险', '年金险', '增额终身寿'],
      medium: ['经济', '政策', '利率', '理财', '储蓄', '资产配置', '财富管理'],
      low: ['市场', '股市', '基金', '投资', '金融']
    },
    scriptFocus: ['风险保障', '家庭规划', '养老规划', '财富传承', '理赔服务'],
    productTypes: ['重疾险', '医疗险', '年金险', '增额终身寿']
  },
  {
    id: 'trust',
    name: '信托',
    icon: '🏛️',
    desc: '信托、财富管理',
    hotspotKeywords: {
      high: ['信托', '财富管理', '家族信托', '高净值', '私行', '传承', '财富传承', '资产配置', '固收', '稳健收益'],
      medium: ['理财', '基金', '私募', '经济', '政策', '利率', '金融', '投资'],
      low: ['市场', '股市', '宏观', '产业']
    },
    scriptFocus: ['资产配置', '财富传承', '稳健增值', '风险隔离', '家族信托'],
    productTypes: ['集合信托', '家族信托', '资产配置服务']
  },
  {
    id: 'wealth',
    name: '财富管理',
    icon: '💎',
    desc: '独立理财、三方财富',
    hotspotKeywords: {
      high: ['财富管理', '资产配置', '理财', '基金', '保险', '信托', '私募', '高净值', '养老', '传承', '稳健', '收益'],
      medium: ['经济', '政策', '利率', '市场', '投资', '金融', '财富规划'],
      low: ['股市', '宏观', '产业', '消费']
    },
    scriptFocus: ['资产配置', '财富规划', '风险分散', '长期收益', '家庭财务'],
    productTypes: ['综合理财', '资产配置', '保险规划']
  },
  {
    id: 'futures',
    name: '期货',
    icon: '📉',
    desc: '期货、衍生品',
    hotspotKeywords: {
      high: ['期货', '商品', '原油', '黄金', '有色金属', '农产品', '大宗商品', '通胀', '美联储', '加息', '降息', '美元', '套期保值', '风险对冲'],
      medium: ['经济', '政策', '利率', '市场', '汇率', '宏观', '产业'],
      low: ['股市', '基金', '理财', '投资', '金融']
    },
    scriptFocus: ['市场波动', '套期保值', '风险对冲', '商品行情', '宏观影响'],
    productTypes: ['商品期货', '金融期货', '期权']
  },
  {
    id: 'other',
    name: '其他金融',
    icon: '💼',
    desc: '其他金融从业者',
    hotspotKeywords: {
      high: ['金融', '经济', '市场', '政策', '利率', '汇率', '通胀', 'GDP', '货币政策', '财政政策'],
      medium: ['投资', '理财', '基金', '股市', '银行', '保险'],
      low: ['产业', '消费', '科技']
    },
    scriptFocus: ['市场分析', '政策解读', '投资理财', '风险控制'],
    productTypes: ['综合金融服务']
  }
];

// 初始化用户行业设置
function initUserIndustry() {
  // 默认券商
  userIndustry = 'broker';
  
  // 渲染行业选择器
  renderIndustrySelect();
  
  // 绑定事件
  const industryWrap = document.getElementById('industry-select-wrap');
  if (industryWrap) {
    industryWrap.addEventListener('click', function(e) {
      e.stopPropagation();
      this.classList.toggle('open');
    });
    
    // 点击外部关闭
    document.addEventListener('click', function(e) {
      if (!industryWrap.contains(e.target)) {
        industryWrap.classList.remove('open');
      }
    });
  }
}

// 渲染行业选择下拉
function renderIndustrySelect() {
  const dropdown = document.getElementById('industry-select-dropdown');
  const display = document.getElementById('industry-select-display');
  if (!dropdown || !display) return;
  
  // 更新显示
  const currentInd = USER_INDUSTRIES.find(i => i.id === userIndustry);
  if (currentInd) {
    display.querySelector('.industry-icon').textContent = currentInd.icon;
    display.querySelector('.industry-name').textContent = currentInd.name;
  }
  
  // 渲染下拉选项
  renderIndustryOptions();
}

// 渲染下拉选项列表
function renderIndustryOptions() {
  const dropdown = document.getElementById('industry-select-dropdown');
  const display = document.getElementById('industry-select-display');
  if (!dropdown) return;
  
  let html = '';
  USER_INDUSTRIES.forEach(ind => {
    const isActive = ind.id === userIndustry;
    html += `
      <div class="industry-option-item ${isActive ? 'active' : ''}" data-id="${ind.id}">
        <span class="industry-option-icon">${ind.icon}</span>
        <span class="industry-option-name">${ind.name}</span>
        <span class="industry-option-desc">${ind.desc}</span>
      </div>
    `;
  });
  
  dropdown.innerHTML = html;
  
  // 绑定点击事件
  dropdown.querySelectorAll('.industry-option-item').forEach(item => {
    item.addEventListener('click', function(e) {
      e.stopPropagation();
      const id = this.dataset.id;
      userIndustry = id;
      
      // 更新显示
      const ind = USER_INDUSTRIES.find(i => i.id === id);
      if (ind && display) {
        display.querySelector('.industry-icon').textContent = ind.icon;
        display.querySelector('.industry-name').textContent = ind.name;
      }
      
      // 重新渲染选项（更新active状态）
      renderIndustryOptions();
      
      // 关闭下拉
      document.getElementById('industry-select-wrap').classList.remove('open');
      
      // 重新筛选热点
      if (typeof filterHotspots === 'function') {
        filterHotspots();
      }
      
      // 保存到本地存储
      try {
        localStorage.setItem('userIndustry', id);
      } catch (e) {}
    });
  });
}

// 计算用户行业相关度
function calculateUserIndustryRelevance(item) {
  if (!userIndustry) return 0;
  
  const industryConfig = USER_INDUSTRIES.find(i => i.id === userIndustry);
  if (!industryConfig) return 0;
  
  const text = (item.title + item.summary + item.content + item.tags.join('')).toLowerCase();
  let score = 0;
  
  // 三级权重：高优先级10分，中优先级5分，低优先级2分
  const weightMap = { high: 10, medium: 5, low: 2 };
  
  const keywords = industryConfig.hotspotKeywords;
  if (Array.isArray(keywords)) {
    // 兼容旧格式（数组）
    keywords.forEach((kw, index) => {
      if (text.includes(kw.toLowerCase())) {
        const weight = Math.max(1, keywords.length - index);
        score += weight;
      }
    });
  } else if (typeof keywords === 'object') {
    // 新格式（三级权重）
    ['high', 'medium', 'low'].forEach(level => {
      const kws = keywords[level] || [];
      const weight = weightMap[level] || 1;
      kws.forEach(kw => {
        if (text.includes(kw.toLowerCase())) {
          score += weight;
        }
      });
    });
  }
  
  return score;
}

// 获取用户行业的话术侧重点
function getUserIndustryFocus() {
  if (!userIndustry) return [];
  const industryConfig = USER_INDUSTRIES.find(i => i.id === userIndustry);
  return industryConfig ? industryConfig.scriptFocus : [];
}

// 加载更多
function initLoadMore() {
  const loadMoreBtn = document.getElementById('load-more-hotspot');
  if (!loadMoreBtn) return;
  
  let isLoading = false;
  
  loadMoreBtn.addEventListener('click', function() {
    if (isLoading || this.disabled) return;
    
    isLoading = true;
    const originalText = this.textContent;
    this.textContent = '加载中...';
    this.disabled = true;
    
    // 模拟加载延迟，增加真实感
    setTimeout(() => {
      currentPage++;
      renderHotspotCards();
      isLoading = false;
    }, 400);
  });
}

// 新热点检测与刷新
let newHotspotCount = 0; // 待刷新的新热点数量
let checkNewHotspotTimer = null;
let isRefreshing = false;

function initRefreshBtn() {
  const refreshBtn = document.getElementById('refresh-hotspot');
  const newTip = document.getElementById('new-hotspot-tip');
  if (!refreshBtn) return;
  
  // 刷新按钮点击
  refreshBtn.addEventListener('click', function() {
    doRefresh();
  });
  
  // 新热点提示条点击也触发刷新
  if (newTip) {
    newTip.addEventListener('click', function() {
      doRefresh();
    });
  }
  
  // 后台静默检测新热点
  startCheckNewHotspot();
}

// 执行刷新
function doRefresh() {
  if (isRefreshing) return;
  isRefreshing = true;
  
  const refreshBtn = document.getElementById('refresh-hotspot');
  const newTip = document.getElementById('new-hotspot-tip');
  const refreshDot = document.getElementById('refresh-dot');
  
  // 刷新按钮动画
  if (refreshBtn) refreshBtn.classList.add('loading');
  // 隐藏提示和红点
  if (newTip) newTip.style.display = 'none';
  if (refreshDot) refreshDot.style.display = 'none';
  
  newHotspotCount = 0;
  
  // 记录当前第一条数据的ID
  const firstId = hotspotData.length > 0 ? hotspotData[0].id : null;
  
  loadHotspotData(true)
    .then(newData => {
      isRefreshing = false;
      if (refreshBtn) refreshBtn.classList.remove('loading');
      
      // 滚动到顶部
      const feedList = document.getElementById('hotspot-feed-list');
      if (feedList) {
        feedList.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      
      // 显示刷新结果提示
      let addedCount = 0;
      if (firstId && newData && newData.length > 0) {
        const firstIndex = newData.findIndex(h => h.id === firstId);
        addedCount = firstIndex > 0 ? firstIndex : 0;
      }
      
      if (addedCount > 0) {
        showToast(`已更新${addedCount}条新热点`);
      } else {
        showToast('已是最新热点');
      }
    })
    .catch(() => {
      isRefreshing = false;
      if (refreshBtn) refreshBtn.classList.remove('loading');
      showToast('刷新失败，请稍后再试', 'warning');
    });
}

// 开始后台检测新热点
function startCheckNewHotspot() {
  if (checkNewHotspotTimer) return;
  
  // 首次检测延迟10秒（便于快速看到演示效果）
  setTimeout(() => {
    checkNewHotspot();
  }, 10000);
  
  // 之后每45秒检测一次
  checkNewHotspotTimer = setInterval(() => {
    checkNewHotspot();
  }, 45000);
}

// 纯获取热点数据（不修改全局状态，不刷新页面，仅用于后台检测）
function fetchHotspotDataOnly() {
  return new Promise((resolve) => {
    loadRealTimeNews()
      .then(news => {
        const realtimeData = convertNewsToHotspots(news);
        const fullData = expandToWeeklyData(realtimeData);
        resolve(fullData);
      })
      .catch(() => {
        const mockData = getMockHotspotData();
        const fullData = expandToWeeklyData(mockData);
        resolve(fullData);
      });
  });
}

// 生成模拟的新热点（用于演示提示条效果）
let mockNewHotspotIndex = 0;
function generateMockNewHotspots(count) {
  const mockNews = [
    '重磅！央行宣布全面降准0.5个百分点，释放长期资金约1万亿元',
    'A股三大指数集体拉升，沪指涨超1%重返3000点',
    '新能源汽车产业规划出台，2030年销量占比超60%',
    '证监会发布全面实行股票发行注册制改革方案',
    '国务院常务会议：加大稳就业政策力度',
    '半导体国产替代加速，芯片设备企业订单爆满',
    '人民币汇率大幅升值，跨境资本流入加快',
    '消费刺激政策加码，多地发放亿元消费券',
    '医药集采新规则落地，创新药企业迎利好',
    '地产政策进一步松绑，一线城市限购优化'
  ];
  
  const categories = ['policy', 'market', 'industry', 'macro', 'stock'];
  const categoryInfo = {
    macro: { name: '宏观', icon: '📊' },
    policy: { name: '政策', icon: '📋' },
    industry: { name: '行业', icon: '🏭' },
    market: { name: '市场', icon: '📈' },
    stock: { name: '个股', icon: '💹' }
  };
  
  const sourceKeys = Object.keys(NEWS_SOURCES);
  const result = [];
  const now = Date.now() / 1000;
  
  for (let i = 0; i < count; i++) {
    const idx = (mockNewHotspotIndex + i) % mockNews.length;
    const text = mockNews[idx];
    const cat = categories[idx % categories.length];
    const catInfo = categoryInfo[cat];
    const sourceKey = sourceKeys[Math.floor(Math.random() * sourceKeys.length)];
    const sourceInfo = NEWS_SOURCES[sourceKey];
    
    result.push({
      id: 'hotspot_newmock_' + mockNewHotspotIndex + '_' + i,
      title: text.length > 30 ? text.substring(0, 30) + '...' : text,
      summary: text.length > 80 ? text.substring(0, 80) + '...' : text,
      content: text,
      category: cat,
      categoryName: catInfo.name,
      categoryIcon: catInfo.icon,
      categoryColor: '',
      tags: [],
      views: Math.floor(Math.random() * 5000) + 2000,
      viewsText: '',
      time: '刚刚',
      timestamp: now - i * 120,
      sourceName: sourceInfo.name,
      sourceLogo: sourceInfo.logo,
      sourceUrl: sourceInfo.url
    });
  }
  
  mockNewHotspotIndex += count;
  return result;
}

// 检测是否有新热点（只检测数量，不刷新列表）
function checkNewHotspot() {
  const newTip = document.getElementById('new-hotspot-tip');
  const refreshDot = document.getElementById('refresh-dot');
  
  if (!hotspotData || hotspotData.length === 0) return;
  if (isRefreshing) return;
  
  const firstId = hotspotData[0].id;
  
  // 只获取新数据用于对比，不更新全局状态
  fetchHotspotDataOnly()
    .then(newData => {
      if (!newData || newData.length === 0) return;
      
      // 计算新增数量
      const firstIndex = newData.findIndex(h => h.id === firstId);
      let addedCount = firstIndex > 0 ? firstIndex : 0;
      
      // 如果真实数据没有新增，模拟生成1-3条新热点（便于演示）
      if (addedCount === 0 && Math.random() > 0.3) {
        addedCount = Math.floor(Math.random() * 3) + 1;
        const mockNewOnes = generateMockNewHotspots(addedCount);
        // 将模拟的新热点插到数据前面，用于计算新增数量
        newData = [...mockNewOnes, ...newData];
      }
      
      if (addedCount > 0) {
        newHotspotCount += addedCount;
        
        // 显示红点
        if (refreshDot) {
          refreshDot.style.display = 'block';
        }
        
        // 显示提示条
        if (newTip && newTip.style.display !== 'flex') {
          document.getElementById('new-hotspot-count').textContent = newHotspotCount;
          newTip.style.display = 'flex';
        } else if (newTip) {
          document.getElementById('new-hotspot-count').textContent = newHotspotCount;
        }
      }
    })
    .catch(() => {
      // 静默失败，不打扰用户
    });
}

function initHotspotCards() {
  // 卡片点击事件在renderHotspotCards中动态绑定
}

// ============================================
// 热点详情弹窗
// ============================================

function initDetailModal() {
  // 一键生成话术按钮
  const genBtn = document.getElementById('gen-hotspot-script-btn');
  if (genBtn) {
    genBtn.addEventListener('click', function() {
      if (!currentHotspotDetail) return;
      closeHotspotDetailModal();
      generateHotspotScripts(currentHotspotDetail);
    });
  }
}

// 从卡片直接生成话术
function generateScriptFromCard(id) {
  const hotspot = hotspotData.find(h => h.id === id);
  if (!hotspot) return;
  currentHotspotDetail = hotspot;
  generateHotspotScripts(hotspot);
}

function openHotspotDetail(id) {
  const hotspot = hotspotData.find(h => h.id === id);
  if (!hotspot) return;
  
  currentHotspotDetail = hotspot;
  
  // 填充来源信息
  const sourceAvatarEl = document.getElementById('detail-source-avatar');
  if (hotspot.sourceLogo) {
    sourceAvatarEl.innerHTML = `<img src="${hotspot.sourceLogo}" alt="${hotspot.sourceName}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><span style="display:none">${(hotspot.sourceName || '财经').charAt(0)}</span>`;
  } else {
    sourceAvatarEl.innerHTML = `<span>${(hotspot.sourceName || '财经').charAt(0)}</span>`;
  }
  document.getElementById('detail-source-name').textContent = hotspot.sourceName || '财经资讯';
  
  // 原文链接
  const sourceLinkEl = document.getElementById('detail-source-link');
  if (hotspot.sourceUrl) {
    sourceLinkEl.href = hotspot.sourceUrl;
    sourceLinkEl.style.display = 'inline-block';
  } else {
    sourceLinkEl.style.display = 'none';
  }
  
  // 填充分类和其他信息
  document.getElementById('detail-category').textContent = hotspot.categoryName;
  document.getElementById('detail-title').textContent = hotspot.content;
  document.getElementById('detail-time').textContent = hotspot.time;
  document.getElementById('detail-views').innerHTML = '<i data-lucide="eye" style="width:14px;height:14px;stroke-width:1.75;vertical-align:-2px;margin-right:4px;"></i>' + hotspot.viewsText + ' 阅读';
  
  // 标签
  const tagsHtml = hotspot.tags.map(tag => `<span class="detail-tag">#${tag}</span>`).join('');
  document.getElementById('detail-tags').innerHTML = tagsHtml;
  
  // 生成详情内容
  const detailContent = generateDetailContent(hotspot);
  document.getElementById('detail-summary').innerHTML = detailContent.summary;
  document.getElementById('detail-background').innerHTML = detailContent.background;
  document.getElementById('detail-impact').innerHTML = detailContent.impact;
  
  // 显示弹窗
  document.getElementById('hotspot-detail-modal').classList.add('show');
  document.body.style.overflow = 'hidden';
  
  // 刷新图标
  refreshIcons(document.getElementById('hotspot-detail-modal'));
}

function closeHotspotDetailModal() {
  document.getElementById('hotspot-detail-modal').classList.remove('show');
  document.body.style.overflow = '';
}

// 生成详情内容（模板化）
function generateDetailContent(hotspot) {
  const text = hotspot.content;
  const category = hotspot.category;
  
  const templates = {
    macro: {
      summary: `<p>${text}</p><p>这一消息对宏观经济运行具有重要意义，市场各方高度关注。</p>`,
      background: `<p>近年来，宏观经济面临多重挑战，内外部环境复杂多变。在此背景下，政策部门密切关注经济走势，适时适度调整政策力度。</p><p>从历史经验来看，类似的政策调整往往能够有效稳定市场预期，为经济平稳运行提供有力支撑。</p>`,
      impact: `<p><strong>对市场的主要影响：</strong></p><ul><li>流动性环境改善，市场资金面更加充裕</li><li>有助于降低企业融资成本，支持实体经济</li><li>对债券市场形成利好，利率下行空间打开</li><li>权益市场风险偏好有望提升，估值修复可期</li><li>人民币汇率整体保持稳定，跨境资金流动平稳</li></ul>`
    },
    policy: {
      summary: `<p>${text}</p><p>政策的出台将对相关领域产生深远影响，值得持续跟踪关注。</p>`,
      background: `<p>政策制定部门经过深入调研和充分论证，结合当前经济社会发展需要，出台了相关政策措施。</p><p>此前市场已有一定预期，政策的落地有助于明确方向、稳定预期，推动相关行业健康发展。</p>`,
      impact: `<p><strong>政策影响分析：</strong></p><ul><li>直接利好相关行业和企业，经营环境有望改善</li><li>提升市场信心，相关板块估值有望修复</li><li>长期有利于行业规范发展，提升整体竞争力</li><li>投资者可关注政策受益方向的投资机会</li></ul>`
    },
    industry: {
      summary: `<p>${text}</p><p>行业动态持续受到市场关注，相关板块表现活跃。</p>`,
      background: `<p>从行业发展周期来看，当前正处于关键发展阶段。政策支持、技术进步、需求升级等多重因素共同推动行业向前发展。</p><p>行业内龙头企业优势明显，竞争力持续提升，有望在行业发展中占据有利地位。</p>`,
      impact: `<p><strong>行业影响展望：</strong></p><ul><li>行业景气度持续上行，相关企业业绩有望改善</li><li>细分领域龙头企业受益更为明显</li><li>长期投资价值凸显，可关注优质标的</li><li>需关注行业竞争格局变化和政策风险</li></ul>`
    },
    market: {
      summary: `<p>${text}</p><p>市场行情变化引发投资者关注，多空博弈持续。</p>`,
      background: `<p>近期市场受到多重因素影响，包括宏观经济数据、政策预期、外部环境变化等。投资者情绪波动较大，市场风格切换频繁。</p><p>从历史规律来看，市场短期波动不改长期趋势，投资者应保持理性，关注基本面。</p>`,
      impact: `<p><strong>市场影响解读：</strong></p><ul><li>短期市场情绪受到提振，风险偏好有所回升</li><li>相关板块和个股表现活跃，市场赚钱效应提升</li><li>成交量变化反映市场参与度，可持续关注</li><li>建议投资者保持理性，控制仓位，把握结构性机会</li></ul>`
    },
    stock: {
      summary: `<p>${text}</p><p>个股异动引发市场关注，投资者需理性看待。</p>`,
      background: `<p>个股走势往往受到公司基本面、行业景气度、市场情绪等多重因素影响。短期波动可能更多反映情绪面变化，长期走势仍取决于公司价值。</p><p>建议投资者深入研究公司基本面，不要盲目追涨杀跌。</p>`,
      impact: `<p><strong>投资建议：</strong></p><ul><li>关注公司基本面变化，理性分析投资价值</li><li>短期涨幅较大的个股注意回调风险</li><li>可关注同行业其他优质标的的补涨机会</li><li>严格控制仓位，做好风险管理</li></ul>`
    }
  };
  
  return templates[category] || templates.market;
}

// ============================================
// 生成结果弹窗
// ============================================

function initResultModal() {
  // 角度切换
  const angleTabs = document.querySelectorAll('.angle-tab');
  angleTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      angleTabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      currentResultAngle = this.dataset.angle;
      updateResultContent();
    });
  });
  
  // 风格切换
  const styleTabs = document.querySelectorAll('.style-selector-tab');
  styleTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      const style = this.dataset.style;
      if (currentResultStyle === style) return;
      
      styleTabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      currentResultStyle = style;
      
      // 重新生成话术
      if (currentResultHotspot) {
        regenerateScriptsByStyle();
      }
    });
  });
  
  // 复制当前角度
  const copyBtn = document.getElementById('copy-angle-result');
  if (copyBtn) {
    copyBtn.addEventListener('click', function() {
      const text = document.getElementById('angle-result-text').innerText;
      copyToClipboard(text);
      showToast('已复制到剪贴板');
    });
  }
  
  // 复制全部
  const copyAllBtn = document.getElementById('copy-all-result-btn');
  if (copyAllBtn) {
    copyAllBtn.addEventListener('click', function() {
      let allText = '';
      const angleNames = { read: '热点通读', understand: '消化理解', connect: '产品衔接', marketing: '营销内容', qa: '客户疑问' };
      for (const angle in generatedScripts) {
        allText += `【${angleNames[angle]}】\n${generatedScripts[angle]}\n\n`;
      }
      copyToClipboard(allText.trim());
      showToast('已复制完整解读');
    });
  }
  
  // 保存到热点库
  const saveBtn = document.getElementById('save-to-library-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', function() {
      saveCurrentToLibrary();
    });
  }
  
  // 跳转素材工厂
  const gotoMaterialBtn = document.getElementById('goto-material-btn');
  if (gotoMaterialBtn) {
    gotoMaterialBtn.addEventListener('click', function() {
      gotoMaterialFactory();
    });
  }
}

// 保存当前热点到热点库
function saveCurrentToLibrary() {
  if (!currentResultHotspot) {
    showToast('没有可保存的内容', 'warning');
    return;
  }
  
  // 检查是否已经保存过
  const exists = hotspotData.some(h => h.id === currentResultHotspot.id);
  if (exists) {
    showToast('该热点已在热点库中', 'warning');
    return;
  }
  
  // 添加到热点库顶部
  const savedHotspot = {
    ...currentResultHotspot,
    saved: true,
    savedAt: Date.now() / 1000,
    views: currentResultHotspot.views || 0,
    viewsText: formatViews(currentResultHotspot.views || 0)
  };
  
  hotspotData.unshift(savedHotspot);
  filteredHotspots = [...hotspotData];
  
  // 重置筛选条件
  currentCategory = 'all';
  currentTopic = null;
  currentSearchKeyword = '';
  
  // 更新顶部tab
  document.querySelectorAll('.hotspot-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.category === 'all');
  });
  
  // 更新侧边栏导航
  document.querySelectorAll('.category-nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.category === 'all');
  });
  
  renderHotspotCards();
  
  showToast('已保存到热点库');
  closeHotspotResultModal();
}

// 跳转素材工厂
function gotoMaterialFactory() {
  if (!currentResultHotspot) {
    showToast('没有可跳转的内容', 'warning');
    return;
  }
  
  // 关闭结果弹窗
  closeHotspotResultModal();
  
  // 切换到素材工厂 tab
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(nav => nav.classList.remove('active'));
  const materialNav = document.querySelector('.nav-item[data-tab="material"]');
  if (materialNav) materialNav.classList.add('active');
  
  const tabContents = document.querySelectorAll('.tab-content');
  tabContents.forEach(content => {
    content.classList.remove('active');
    if (content.id === 'tab-material') content.classList.add('active');
  });
  
  // 更新页面标题和描述
  const pageTitle = document.getElementById('page-title');
  const pageDesc = document.getElementById('page-desc');
  if (pageTitle) pageTitle.textContent = '素材工厂';
  if (pageDesc) pageDesc.textContent = '上传素材，AI结合热点一键生成6种营销内容';
  
  // 把当前话术内容传递给素材工厂（暂存到全局变量）
  window.pendingMaterialContent = {
    title: currentResultHotspot.title,
    content: generatedScripts,
    style: currentResultStyle
  };
  
  showToast('已跳转至素材工厂，可以进一步加工内容');
  
  // 滚动到顶部
  window.scrollTo({ top: 0, behavior: 'smooth' });
  
  // 如果素材工厂有初始化函数，触发它
  if (typeof initMaterialFromHotspot === 'function') {
    setTimeout(() => {
      initMaterialFromHotspot(window.pendingMaterialContent);
    }, 300);
  }
}

// 根据当前风格重新生成话术
function regenerateScriptsByStyle() {
  if (!currentResultHotspot) return;
  
  const hotspot = currentResultHotspot;
  const style = currentResultStyle;
  
  // 确保hotspot有audience属性
  if (!hotspot.audience) {
    hotspot.audience = 'general';
  }
  
  generatedScripts = {
    macro: generateCustomByStyle(hotspot, 'macro', style),
    industry: generateCustomByStyle(hotspot, 'industry', style),
    product: generateCustomByStyle(hotspot, 'product', style),
    qa: generateCustomByStyle(hotspot, 'qa', style)
  };
  
  updateResultContent();
  showToast('已切换为' + getStyleName(style) + '风格');
}

function getStyleName(style) {
  const names = {
    professional: '专业解读',
    easy: '轻松科普',
    question: '提问引导',
    golden: '金句短讯'
  };
  return names[style] || '专业解读';
}

// ============================================
// 热点解读 - 5个方向生成函数
// ============================================

// 1. 热点通读
function generateReadScript(hotspot) {
  const title = hotspot.title || '';
  const source = hotspot.sourceName || hotspot.source || '财经资讯';
  const time = hotspot.time || '';
  const summary = hotspot.summary || hotspot.content || '';
  const sourceUrl = hotspot.sourceUrl || '';
  const categoryName = hotspot.categoryName || '';
  
  let sourceLink = source;
  if (sourceUrl) {
    sourceLink = `<a href="${sourceUrl}" target="_blank" class="source-link">${source} ↗</a>`;
  }
  
  return `
    <div class="read-script">
      <h4 class="read-title">${title}</h4>
      <div class="read-meta">
        <span class="read-source">来源：${sourceLink}</span>
        ${time ? `<span class="read-time">发布时间：${time}</span>` : ''}
        ${categoryName ? `<span class="read-category">分类：${categoryName}</span>` : ''}
      </div>
      <div class="read-divider"></div>
      <div class="read-summary">
        <p><strong>内容摘要：</strong></p>
        <p>${summary}</p>
      </div>
      ${hotspot.tags && hotspot.tags.length ? `
      <div class="read-tags">
        <p><strong>涉及标签：</strong></p>
        <p>${hotspot.tags.map(tag => `<span class="tag-item">#${tag}</span>`).join(' ')}</p>
      </div>
      ` : ''}
      <div class="read-tip">
        <p><em>💡 提示：点击"消化理解"可获取通俗易懂的解读，点击"产品衔接"可查看沟通切入点和产品推荐建议。</em></p>
      </div>
    </div>
  `;
}

// 2. 消化理解
function generateUnderstandScript(hotspot) {
  const title = hotspot.title || '';
  const content = hotspot.content || hotspot.summary || '';
  const category = hotspot.category || 'market';
  
  // 根据分类生成不同的解读角度
  const impactByCategory = {
    macro: {
      oneSentence: `一句话说清：${title}，本质上是宏观经济政策/经济运行的重要信号，直接影响市场资金面和投资信心。`,
      impact: [
        '对咱们老百姓来说，最直接的感受就是钱袋子的变化——存款利率可能调整、房贷月供可能变化、手里的理财产品收益也会波动',
        '对投资者来说，这意味着市场环境在变，原来的投资策略可能需要调整，该稳健的要稳健，该进取的也可以适度把握机会',
        '简单说就是：政策在发力，经济在托底，市场预期在改善，但也不要期望一蹴而就，要有耐心'
      ]
    },
    policy: {
      oneSentence: `一句话说清：${title}，是监管层释放的明确政策信号，目的是稳预期、提信心、促发展。`,
      impact: [
        '对普通人来说，政策红利可能体现在就业、收入、消费等方方面面，生活幸福感会逐步提升',
        '对投资者来说，政策支持的方向往往孕育着机会，但也要注意区分短期热点和长期趋势',
        '简单说就是：政策风向变了，跟着政策走大概率不会错，但要选对方向、控制节奏'
      ]
    },
    industry: {
      oneSentence: `一句话说清：${title}，将直接影响相关行业的发展格局和企业盈利，产业链上下游都会受到波及。`,
      impact: [
        '对从业者来说，行业景气度变化可能影响薪资待遇和职业发展，要提前做好规划',
        '对投资者来说，行业政策和景气度变化是重要的投资参考，选对赛道比选对个股更重要',
        '简单说就是：有的行业会迎来风口，有的行业可能面临调整，投资要顺势而为'
      ]
    },
    market: {
      oneSentence: `一句话说清：${title}，对市场情绪和资金面产生直接影响，短期可能引发市场波动。`,
      impact: [
        '对散户朋友来说，不用过度恐慌也不要盲目乐观，市场有涨有跌是常态，关键是控制好仓位',
        '对基金投资者来说，波动反而可能是定投加仓的好机会，坚持长期投资理念很重要',
        '简单说就是：短期波动不改变长期趋势，保持理性、不追涨杀跌，才能在市场中长期生存'
      ]
    },
    stock: {
      oneSentence: `一句话说清：${title}，引发相关个股异动，短期关注度飙升，但投资价值还需要深入分析。`,
      impact: [
        '对短线交易者来说，这是交易性机会，但一定要快进快出、严格止损，别把短线做成了长线',
        '对长线投资者来说，更应该关注公司基本面是否真正改善，而不是被短期热点牵着鼻子走',
        '简单说就是：热点来了别盲目追，热点退了别恐慌卖，聚焦公司价值才是王道'
      ]
    }
  };
  
  const template = impactByCategory[category] || impactByCategory.market;
  
  return `
    <div class="understand-script">
      <div class="understand-section">
        <h4>🎯 一句话说清</h4>
        <p class="one-sentence">${template.oneSentence}</p>
      </div>
      <div class="understand-divider"></div>
      <div class="understand-section">
        <h4>💬 大白话讲影响</h4>
        <ul class="impact-list">
          ${template.impact.map(item => `<li>${item}</li>`).join('')}
        </ul>
      </div>
      <div class="understand-tip">
        <p><em>📌 想知道怎么把这个热点聊到你的业务上？点击"产品衔接"看看具体的沟通话术。</em></p>
      </div>
    </div>
  `;
}

// 3. 产品衔接
function generateConnectScript(hotspot) {
  const industryConfig = USER_INDUSTRIES.find(i => i.id === userIndustry);
  const industryName = industryConfig ? industryConfig.name : '金融';
  const productTypes = industryConfig ? industryConfig.productTypes : ['权益类基金', '固收类产品', '指数基金', '定投策略'];
  const industryFocus = getUserIndustryFocus();
  const title = hotspot.title || '';
  
  // 根据不同行业生成差异化的话术
  switch (userIndustry) {
    case 'bank': // 银行
      return `
        <div class="connect-script">
          <h4>🎯 沟通切入点</h4>
          <div class="opening-line">
            <p><strong>开场话术：</strong></p>
            <p class="quote">「XX先生/女士，最近市场有个热点您关注了吗？关于"${title}"，我觉得对您的家庭理财规划可能有些启发，想跟您聊聊。」</p>
          </div>
          
          <h4>💡 产品推荐建议</h4>
          <div class="product-suggestions">
            <p><strong>自然过渡到产品：</strong></p>
            <p>"所以您看，在当前这个市场环境下，把钱都放在活期里确实有点可惜，但全部投到股市风险也大。我们行现在有几款产品挺适合当前配置的——"</p>
            
            <ul>
              <li><strong>稳健型客户：</strong>推荐<strong>大额存单</strong>和<strong>结构性存款</strong>，本金安全、收益稳定，适合作为家庭资产的压舱石</li>
              <li><strong>平衡型客户：</strong>建议"存款+理财+基金"组合，${productTypes[0]}做增值部分，${productTypes[1]}做稳健底仓，攻守兼备</li>
              <li><strong>进取型客户：</strong>可适度增加权益类配置，结合热点推荐相关主题基金，但务必做好风险提示</li>
            </ul>
          </div>
          
          <div class="recommend-reason">
            <p><strong>推荐理由：</strong></p>
            <ul>
              <li>当前利率环境下，纯存款收益有限，适当配置权益类资产可以提升整体收益</li>
              <li>分散配置是应对市场波动的最好方式，不把鸡蛋放在一个篮子里</li>
              <li>我们行的理财产品线齐全，从稳健到进取都有，可以根据客户需求量身定制</li>
            </ul>
          </div>
          
          <div class="connect-tip">
            <p><em>📌 核心关注点：${industryFocus.slice(0, 3).join('、')}</em></p>
          </div>
        </div>
      `;
    
    case 'broker': // 券商
      return `
        <div class="connect-script">
          <h4>🎯 沟通切入点</h4>
          <div class="opening-line">
            <p><strong>开场话术：</strong></p>
            <p class="quote">「XX哥/姐，今天市场这个热点您看到了吧？"${title}"，我觉得里面有一些交易性机会，想跟您分享一下我的看法。」</p>
          </div>
          
          <h4>💡 产品推荐建议</h4>
          <div class="product-suggestions">
            <p><strong>自然过渡到产品/服务：</strong></p>
            <p>"这个热点背后的逻辑我梳理了一下，相关板块可能有阶段性机会。如果您想参与的话，可以从这几个角度考虑——"</p>
            
            <ul>
              <li><strong>短线交易客户：</strong>推荐关注相关板块的龙头标的，提示快进快出、设置止损，同时介绍我们的<strong>快速交易通道</strong>服务</li>
              <li><strong>中线布局客户：</strong>分析行业景气度和政策支持力度，推荐优质龙头标的，建议分批建仓，可以搭配<strong>投顾服务</strong>参考</li>
              <li><strong>基金投资客户：</strong>推荐相关主题<strong>ETF</strong>和主动管理基金，讲解定投策略，强调长期投资和分散风险</li>
            </ul>
          </div>
          
          <div class="recommend-reason">
            <p><strong>推荐理由：</strong></p>
            <ul>
              <li>我们券商研究实力强，能及时提供专业的市场分析和个股研报</li>
              <li>交易通道顺畅、佣金优惠，服务响应快，客户体验好</li>
              <li>产品线齐全，从股票、基金到融资融券都有，一站式满足客户投资需求</li>
            </ul>
          </div>
          
          <div class="connect-tip">
            <p><em>📌 核心关注点：${industryFocus.slice(0, 3).join('、')}</em></p>
          </div>
        </div>
      `;
    
    case 'fund': // 基金
      return `
        <div class="connect-script">
          <h4>🎯 沟通切入点</h4>
          <div class="opening-line">
            <p><strong>开场话术：</strong></p>
            <p class="quote">「XX先生/女士，最近"${title}"这个热点挺火的，很多客户都在问对基金投资有什么影响，我整理了一些观点想跟您分享一下。」</p>
          </div>
          
          <h4>💡 产品推荐建议</h4>
          <div class="product-suggestions">
            <p><strong>自然过渡到产品：</strong></p>
            <p>"基于这个热点，我筛选了几只相关方向的基金，各有特色，您可以参考一下——"</p>
            
            <ul>
              <li><strong>新基民客户：</strong>推荐<strong>宽基指数基金</strong>作为入门，强调定投和长期持有，用基金定投微笑曲线的理念引导</li>
              <li><strong>成熟基民客户：</strong>推荐主动管理能力强的<strong>主题基金</strong>，对比不同基金经理的风格和历史业绩，讲清投资逻辑</li>
              <li><strong>高净值客户：</strong>聊资产配置方案，推荐<strong>FOF</strong>或专户产品，股债搭配、核心卫星策略，追求稳健增值</li>
            </ul>
          </div>
          
          <div class="recommend-reason">
            <p><strong>推荐理由：</strong></p>
            <ul>
              <li>专业的人做专业的事，基金经理比普通投资者更有研究资源和投资经验</li>
              <li>基金投资门槛低、分散风险、操作便捷，适合大多数投资者</li>
              <li>长期来看，权益类基金的收益远超存款和理财，是资产增值的重要工具</li>
            </ul>
          </div>
          
          <div class="connect-tip">
            <p><em>📌 核心关注点：${industryFocus.slice(0, 3).join('、')}</em></p>
          </div>
        </div>
      `;
    
    case 'insurance': // 保险
      return `
        <div class="connect-script">
          <h4>🎯 沟通切入点</h4>
          <div class="opening-line">
            <p><strong>开场话术：</strong></p>
            <p class="quote">「XX姐/哥，最近"${title}"这个新闻您看了吗？其实从家庭财务规划的角度，这里面有一些风险点值得我们关注，想跟您聊聊。」</p>
          </div>
          
          <h4>💡 产品推荐建议</h4>
          <div class="product-suggestions">
            <p><strong>自然过渡到产品：</strong></p>
            <p>"市场有涨有跌，投资有赚有亏，但人生的风险却是不确定的。在追求投资收益的同时，基础保障一定要先做好，这样才能做到'进可攻、退可守'——"</p>
            
            <ul>
              <li><strong>年轻客户：</strong>推荐<strong>重疾险</strong>+<strong>医疗险</strong>组合，用"年轻时保费便宜、杠杆高"的观念打动，推荐高性价比消费型产品</li>
              <li><strong>中年家庭支柱：</strong>强调"家庭责任"，推荐<strong>重疾+寿险+意外</strong>的保障组合，确保家庭经济安全，大人是孩子最好的保险</li>
              <li><strong>高净值/退休客户：</strong>聊<strong>养老规划</strong>和<strong>财富传承</strong>，推荐年金险、增额终身寿，强调安全稳定和定向传承</li>
            </ul>
          </div>
          
          <div class="recommend-reason">
            <p><strong>推荐理由：</strong></p>
            <ul>
              <li>保险是家庭财务的"防火墙"，万一发生风险，保险理赔金可以帮家庭渡过难关</li>
              <li>年金险和增额终身寿收益确定、安全稳健，是资产配置中的压舱石</li>
              <li>保险具有财富传承的法律功能，可以实现资产的定向、高效传承</li>
            </ul>
          </div>
          
          <div class="connect-tip">
            <p><em>📌 核心关注点：${industryFocus.slice(0, 3).join('、')}</em></p>
          </div>
        </div>
      `;
    
    case 'trust': // 信托
      return `
        <div class="connect-script">
          <h4>🎯 沟通切入点</h4>
          <div class="opening-line">
            <p><strong>开场话术：</strong></p>
            <p class="quote">「XX总，最近"${title}"这个热点您有关注吗？从资产配置和财富传承的角度，我觉得对您的家族财富规划可能有些参考意义。」</p>
          </div>
          
          <h4>💡 产品推荐建议</h4>
          <div class="product-suggestions">
            <p><strong>自然过渡到产品：</strong></p>
            <p>"市场波动是常态，把所有资产都放在一个篮子里风险太大。信托作为一种风险隔离和财富传承的工具，可以在资产配置中发挥独特作用——"</p>
            
            <ul>
              <li><strong>企业主客户：</strong>重点推荐<strong>家族信托</strong>，实现企业资产和家庭资产的隔离，保护家庭财富不受企业经营风险影响</li>
              <li><strong>高净值家庭：</strong>推荐<strong>保险金信托</strong>，结合保险的杠杆功能和信托的传承功能，实现财富的精准定向传承</li>
              <li><strong>退休富裕阶层：</strong>推荐<strong>固收类信托产品</strong>，收益稳健、风控严格，适合追求稳定收益的投资者</li>
            </ul>
          </div>
          
          <div class="recommend-reason">
            <p><strong>推荐理由：</strong></p>
            <ul>
              <li>信托具有独特的风险隔离法律功能，是高净值客户财富保护的重要工具</li>
              <li>家族信托可以实现财富的代际传承，避免继承纠纷，按照委托人意愿分配</li>
              <li>信托产品风控严格、收益稳健，是资产配置中稳健端的重要选择</li>
            </ul>
          </div>
          
          <div class="connect-tip">
            <p><em>📌 核心关注点：${industryFocus.slice(0, 3).join('、')}</em></p>
          </div>
        </div>
      `;
    
    case 'wealth': // 财富管理
      return `
        <div class="connect-script">
          <h4>🎯 沟通切入点</h4>
          <div class="opening-line">
            <p><strong>开场话术：</strong></p>
            <p class="quote">「XX先生/女士，最近"${title}"这个热点挺受关注的，从财富管理的角度，我觉得对您的资产配置可能有些影响，想跟您交流一下。」</p>
          </div>
          
          <h4>💡 产品推荐建议</h4>
          <div class="product-suggestions">
            <p><strong>自然过渡到产品/服务：</strong></p>
            <p>"在当前市场环境下，单一资产很难持续创造好收益，做好资产配置才是关键。我给您梳理了一个配置思路——"</p>
            
            <ul>
              <li><strong>大众富裕客户：</strong>参考"标准普尔家庭资产象限图"，推荐<strong>基金+保险+固收</strong>的综合配置方案，全面覆盖家庭财务需求</li>
              <li><strong>高净值客户：</strong>提供全球化资产配置建议，推荐<strong>私募、信托、海外资产</strong>等高端产品，实现资产的多元分散</li>
              <li><strong>企业主客户：</strong>结合企业经营和家庭财富，提供<strong>企业+家庭</strong>的综合财务规划方案，实现家业隔离和财富传承</li>
            </ul>
          </div>
          
          <div class="recommend-reason">
            <p><strong>推荐理由：</strong></p>
            <ul>
              <li>做买方顾问，站在客户角度思考问题，推荐真正适合客户的产品</li>
              <li>资产配置是免费的午餐，通过多元配置可以在收益不变的情况下降低风险</li>
              <li>提供持续的投后服务，定期检视和调整配置方案，陪伴客户财富成长</li>
            </ul>
          </div>
          
          <div class="connect-tip">
            <p><em>📌 核心关注点：${industryFocus.slice(0, 3).join('、')}</em></p>
          </div>
        </div>
      `;
    
    case 'futures': // 期货
      return `
        <div class="connect-script">
          <h4>🎯 沟通切入点</h4>
          <div class="opening-line">
            <p><strong>开场话术：</strong></p>
            <p class="quote">「XX总，最近"${title}"这个热点对商品市场影响挺大的，我整理了一些行情分析，想跟您分享一下。」</p>
          </div>
          
          <h4>💡 产品推荐建议</h4>
          <div class="product-suggestions">
            <p><strong>自然过渡到产品/服务：</strong></p>
            <p>"这个热点可能会引发相关商品的价格波动，不管您是实体企业还是投资客户，都可以利用期货工具来管理风险或把握机会——"</p>
            
            <ul>
              <li><strong>实体企业客户：</strong>重点聊<strong>套期保值</strong>方案，帮助企业锁定原材料成本或产品售价，规避价格波动风险，稳定经营利润</li>
              <li><strong>投资交易客户：</strong>分析行情走势和交易机会，推荐合适的<strong>交易策略</strong>，提示风险控制和资金管理的重要性</li>
              <li><strong>机构客户：</strong>提供深度研报和定制化服务，讨论<strong>对冲策略</strong>和衍生品组合方案，满足机构的专业化需求</li>
            </ul>
          </div>
          
          <div class="recommend-reason">
            <p><strong>推荐理由：</strong></p>
            <ul>
              <li>期货具有价格发现和风险管理两大功能，是现代金融市场不可或缺的工具</li>
              <li>我们期货公司研究实力强、交易系统稳定、服务专业，能为客户提供全方位支持</li>
              <li>套期保值可以帮助实体企业平滑利润波动，是企业经营的"避风港"</li>
            </ul>
          </div>
          
          <div class="connect-tip">
            <p><em>📌 核心关注点：${industryFocus.slice(0, 3).join('、')}</em></p>
          </div>
        </div>
      `;
    
    default: // 通用型建议
      return `
        <div class="connect-script">
          <h4>🎯 沟通切入点</h4>
          <div class="opening-line">
            <p><strong>开场话术：</strong></p>
            <p class="quote">「XX先生/女士，您最近有关注市场动态吗？关于"${title}"的消息，我想和您分享一下对我们资产配置的一些启发。」</p>
          </div>
          
          <h4>💡 产品推荐建议</h4>
          <div class="product-suggestions">
            <p><strong>自然过渡到产品：</strong></p>
            <p>"在当前市场环境下，做好资产配置比选单一产品更重要。根据不同的风险偏好，可以有不同的配置思路——"</p>
            
            <ul>
              <li><strong>稳健型客户：</strong>重点关注${productTypes[1] || '固收类产品'}，把握稳健收益机会，同时保持组合稳定性</li>
              <li><strong>平衡型客户：</strong>建议股债均衡配置，${productTypes[0] || '权益类产品'}关注优质方向，${productTypes[1] || '固收类产品'}增强收益</li>
              <li><strong>进取型客户：</strong>可适度增加${productTypes[0] || '权益类产品'}仓位，重点关注高景气赛道，把握市场机会</li>
            </ul>
          </div>
          
          <div class="recommend-reason">
            <p><strong>推荐理由：</strong></p>
            <ul>
              <li>分散配置可以有效降低组合波动，提升投资体验</li>
              <li>根据市场环境动态调整配置比例，有助于提高长期收益</li>
              <li>对于看好的方向，建议采用${productTypes[3] || '定投方式'}分批布局，降低择时风险</li>
            </ul>
          </div>
          
          <div class="connect-tip">
            <p><em>📌 核心关注点：${industryFocus.slice(0, 3).join('、')}</em></p>
          </div>
        </div>
      `;
  }
}

// 4. 营销内容
function generateMarketingScript(hotspot) {
  const title = hotspot.title || '';
  const content = hotspot.content || hotspot.summary || '';
  const tags = hotspot.tags || [];
  const tagStr = tags.length ? tags.map(t => `#${t}`).join(' ') : '#投资理财 #金融热点';
  
  return `
    <div class="marketing-script">
      <div class="marketing-section">
        <h4>📱 朋友圈文案（短平快）</h4>
        <div class="marketing-content">
          <p>🔥 ${title}</p>
          <p>一句话解读：${content.substring(0, 60)}...</p>
          <p>💡 投资启示：机会总是留给有准备的人，市场波动时更要保持理性。</p>
          <p>${tagStr} #理财顾问 #每日热点</p>
        </div>
      </div>
      
      <div class="marketing-divider"></div>
      
      <div class="marketing-section">
        <h4>💬 群发/私聊话术（亲切自然）</h4>
        <div class="marketing-content">
          <p>XX哥/姐好呀～</p>
          <p>今天有个热点想跟您分享一下：关于"${title}"，我觉得对您的理财规划可能有参考价值。</p>
          <p>简单来说就是：${content.substring(0, 80)}...</p>
          <p>我整理了一份详细的解读，如果您感兴趣的话，我发给您看看～或者咱们约个时间聊聊，看看对您的资产配置有没有可以优化的地方😊</p>
        </div>
      </div>
      
      <div class="marketing-divider"></div>
      
      <div class="marketing-section">
        <h4>📞 电话沟通要点</h4>
        <div class="marketing-content">
          <p><strong>【开场】</strong></p>
          <p>XX先生/女士您好，我是XX。今天打扰您几分钟，是因为有个市场热点我觉得挺重要的，想跟您同步一下。</p>
          
          <p><strong>【切入】</strong></p>
          <p>您最近有关注"${title}"这个事情吗？我这边梳理了一下，大概有这么几点影响：</p>
          <ul>
            <li>对宏观经济和市场情绪的影响</li>
            <li>对咱们手里的理财产品/投资组合可能的影响</li>
            <li>接下来可以关注的方向和需要注意的风险</li>
          </ul>
          
          <p><strong>【收尾】</strong></p>
          <p>总的来说，不用太担心，但也可以适度调整一下配置思路。您看什么时候方便，我把详细的分析发给您，咱们再细聊？好的好的，那我稍后发您微信，咱们再约时间。不打扰您了，祝您生活愉快！</p>
        </div>
      </div>
      
      <div class="marketing-tip">
        <p><em>💡 提示：营销文案请结合实际情况调整语气和内容，保持真诚自然，避免过度营销。</em></p>
      </div>
    </div>
  `;
}

// 5. 客户疑问 & 标准应答
function generateQAScript(hotspot) {
  const industryConfig = USER_INDUSTRIES.find(i => i.id === userIndustry);
  const industryName = industryConfig ? industryConfig.name : '金融';
  const industryFocus = getUserIndustryFocus();
  const title = hotspot.title || '';
  const content = hotspot.content || hotspot.summary || '';
  
  return `
    <div class="qa-script">
      <p><strong>客户高频问题 & 标准应答</strong></p>
      
      <div class="qa-item">
        <p><strong>Q1：这个消息对市场是利好还是利空？</strong></p>
        <p><strong>A：</strong>整体来看偏正面。${content}这有助于改善市场预期、提振信心。但市场走势受多重因素影响，短期内可能有波动，建议以中长期视角看待，不要因为一个消息就盲目乐观或悲观。</p>
      </div>
      
      <div class="qa-item">
        <p><strong>Q2：现在是不是入场的好时机？</strong></p>
        <p><strong>A：</strong>从估值和政策面来看，当前市场处于相对低位，中长期看是比较好的布局窗口。但"好时机"不等于"马上涨"，市场底部是一个区间，不是一个点。建议结合自己的风险承受能力和资金期限，分批布局、不要追涨，定投是比较稳妥的方式。</p>
      </div>
      
      <div class="qa-item">
        <p><strong>Q3：这个热点对我买的${industryName}产品有什么影响？</strong></p>
        <p><strong>A：</strong>具体要看您持有的是什么类型的产品。如果是权益类的，短期可能会有一定波动；如果是固收类的，影响相对较小。从配置角度，我建议您关注${industryFocus.slice(0, 2).join('和')}这两个方向，咱们可以找个时间详细聊聊您的持仓，看看有没有需要调整的地方。</p>
      </div>
      
      <div class="qa-item">
        <p><strong>Q4：后续需要关注什么？</strong></p>
        <p><strong>A：</strong>建议重点关注几个方面：一是政策的后续落地和配套措施，看力度是否持续；二是经济数据的验证，看基本面是否真的在改善；三是外部环境的变化，包括美联储政策、地缘局势等。我会持续跟踪市场动态，有重要变化及时和您沟通，您有任何问题也随时找我。</p>
      </div>
      
      <div class="qa-tip">
        <p><em>💡 提示：回答客户问题时要专业、简洁、有说服力，同时注意合规，不做收益承诺，做好风险提示。</em></p>
      </div>
    </div>
  `;
}

// 生成热点解读
function generateHotspotScripts(hotspot) {
  const resultModal = document.getElementById('hotspot-result-modal');
  if (!resultModal) return;
  
  // 保存当前热点数据
  currentResultHotspot = hotspot;
  
  // 设置热点名称
  document.getElementById('result-hotspot-name').textContent = hotspot.title;
  
  // 显示行业适配提示
  const industryTip = document.getElementById('result-industry-tip');
  if (industryTip && userIndustry) {
    const indConfig = USER_INDUSTRIES.find(i => i.id === userIndustry);
    if (indConfig) {
      industryTip.querySelector('.tip-text').textContent = `已根据「${indConfig.name}」行业身份优化解读侧重点`;
      industryTip.style.display = 'flex';
    }
  } else if (industryTip) {
    industryTip.style.display = 'none';
  }
  
  // 生成5个方向的解读
  generatedScripts = {
    read: generateReadScript(hotspot),
    understand: generateUnderstandScript(hotspot),
    connect: generateConnectScript(hotspot),
    marketing: generateMarketingScript(hotspot),
    qa: generateQAScript(hotspot)
  };
  
  // 重置角度选择（默认第一个：热点通读）
  currentResultAngle = 'read';
  document.querySelectorAll('.angle-tab').forEach(tab => {
    tab.classList.remove('active');
    if (tab.dataset.angle === 'read') tab.classList.add('active');
  });
  
  updateResultContent();
  
  // 显示弹窗
  resultModal.classList.add('show');
  document.body.style.overflow = 'hidden';
  
  // 刷新图标
  refreshIcons(resultModal);
  
  showToast('解读生成成功！');
}

// 更新结果内容显示
function updateResultContent() {
  const angleNames = {
    read: { name: '热点通读', icon: 'newspaper' },
    understand: { name: '消化理解', icon: 'lightbulb' },
    connect: { name: '产品衔接', icon: 'target' },
    marketing: { name: '营销内容', icon: 'megaphone' },
    qa: { name: '客户疑问', icon: 'help-circle' }
  };
  
  const info = angleNames[currentResultAngle] || angleNames.read;
  const content = generatedScripts[currentResultAngle] || '';
  
  const blockHeader = document.querySelector('#result-angle-content .block-header');
  if (blockHeader) {
    const blockIcon = blockHeader.querySelector('.block-icon');
    if (blockIcon) {
      blockIcon.setAttribute('data-lucide', info.icon);
      refreshIcons(blockHeader);
    }
    blockHeader.querySelector('h3').textContent = info.name;
  }
  
  // 更新结果区块标题（如果存在）
  const resultBlockTitle = document.getElementById('result-block-title');
  if (resultBlockTitle) {
    resultBlockTitle.textContent = info.name;
  }
  
  const resultText = document.getElementById('angle-result-text');
  if (resultText) {
    resultText.innerHTML = content;
  }
}

function closeHotspotResultModal() {
  document.getElementById('hotspot-result-modal').classList.remove('show');
  document.body.style.overflow = '';
}

// ============================================
// 自定义生成弹窗
// ============================================

function initCustomGenModal() {
  // 打开弹窗按钮
  const openBtn = document.getElementById('custom-gen-btn');
  if (openBtn) {
    openBtn.addEventListener('click', openCustomGenModal);
  }
  
  // 内容输入字数统计
  const contentInput = document.getElementById('custom-content-input');
  const countEl = document.getElementById('custom-content-count');
  if (contentInput && countEl) {
    contentInput.addEventListener('input', function() {
      const len = this.value.length;
      countEl.textContent = len;
      if (len > 500) {
        countEl.style.color = '#ff4d4f';
        this.value = this.value.substring(0, 500);
        countEl.textContent = 500;
      } else {
        countEl.style.color = '';
      }
    });
  }
  
  // 风格选择卡片点击
  const styleOptions = document.querySelectorAll('.style-option input[type="radio"]');
  styleOptions.forEach(radio => {
    radio.addEventListener('change', function() {
      document.querySelectorAll('.style-option .style-card').forEach(card => {
        card.classList.remove('selected');
      });
      if (this.checked) {
        this.closest('.style-option').querySelector('.style-card').classList.add('selected');
      }
    });
  });
  
  // 初始选中第一个
  const firstStyle = document.querySelector('.style-option input[type="radio"]:checked');
  if (firstStyle) {
    firstStyle.closest('.style-option').querySelector('.style-card').classList.add('selected');
  }
  
  // 生成按钮
  const submitBtn = document.getElementById('custom-gen-submit');
  if (submitBtn) {
    submitBtn.addEventListener('click', handleCustomGenerate);
  }
}

function openCustomGenModal() {
  const modal = document.getElementById('custom-gen-modal');
  if (modal) {
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    refreshIcons(modal);
  }
}

function closeCustomGenModal() {
  const modal = document.getElementById('custom-gen-modal');
  if (modal) {
    modal.classList.remove('show');
    document.body.style.overflow = '';
  }
}

// 处理自定义生成
function handleCustomGenerate() {
  const contentInput = document.getElementById('custom-content-input');
  const categorySelect = document.getElementById('custom-category');
  const audienceSelect = document.getElementById('custom-audience');
  const styleRadio = document.querySelector('.style-option input[type="radio"]:checked');
  
  const content = contentInput ? contentInput.value.trim() : '';
  const category = categorySelect ? categorySelect.value : 'auto';
  const audience = audienceSelect ? audienceSelect.value : 'general';
  const style = styleRadio ? styleRadio.value : 'professional';
  
  if (!content) {
    showToast('请输入热点内容', 'warning');
    contentInput.focus();
    return;
  }
  
  if (content.length < 10) {
    showToast('内容至少需要10个字', 'warning');
    contentInput.focus();
    return;
  }
  
  const submitBtn = document.getElementById('custom-gen-submit');
  const originalText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="loading-spinner-small"></span>生成中...';
  
  // 模拟生成延迟
  setTimeout(() => {
    // 构造一个虚拟的hotspot对象用于生成
    const customHotspot = buildCustomHotspot(content, category, audience, style);
    
    // 关闭自定义弹窗
    closeCustomGenModal();
    
    // 生成话术并展示结果
    generateCustomScripts(customHotspot, style);
    
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }, 1200);
}

// 构建自定义热点对象
function buildCustomHotspot(content, category, audience, style) {
  // 自动识别分类
  let cat = category;
  if (cat === 'auto') {
    cat = autoDetectCategory(content);
  }
  
  const categoryInfo = {
    policy: { name: '政策', icon: '📋' },
    market: { name: '市场', icon: '📈' },
    industry: { name: '行业', icon: '🏭' },
    macro: { name: '宏观', icon: '📊' },
    stock: { name: '个股', icon: '💹' }
  };
  
  const catInfo = categoryInfo[cat] || categoryInfo.macro;
  
  // 提取标题（取前20字）
  const title = content.length > 25 ? content.substring(0, 22) + '...' : content;
  
  // 生成标签
  const tags = generateTagsFromContent(content, cat);
  
  return {
    id: 'custom_' + Date.now(),
    title: title,
    summary: content.length > 80 ? content.substring(0, 77) + '...' : content,
    content: content,
    category: cat,
    categoryName: catInfo.name,
    categoryIcon: catInfo.icon,
    tags: tags,
    views: 0,
    viewsText: '自定义',
    time: '刚刚',
    timestamp: Date.now() / 1000,
    sourceName: '自定义内容',
    sourceLogo: '',
    sourceUrl: '',
    isCustom: true,
    audience: audience,
    style: style
  };
}

// 自动识别内容分类
function autoDetectCategory(content) {
  const policyKeywords = ['政策', '国务院', '央行', '证监会', '银保监会', '监管', '新规', '通知', '发布', '部署', '降准', '降息', 'LPR'];
  const marketKeywords = ['A股', '股市', '大盘', '指数', '上涨', '下跌', '涨幅', '跌幅', '成交额', '成交量', '北向资金', '港股', '美股'];
  const industryKeywords = ['行业', '板块', '产业链', '新能源', '半导体', '医药', '消费', '地产', '金融', '科技', '制造', '光伏', 'AI'];
  const macroKeywords = ['GDP', 'CPI', 'PPI', '经济', '通胀', '就业', '汇率', '人民币', '美联储', '利率', '流动性', '宏观'];
  const stockKeywords = ['股价', '涨停', '跌停', '年报', '业绩', '公告', '增持', '减持', '回购', '分红', '个股'];
  
  let scores = { policy: 0, market: 0, industry: 0, macro: 0, stock: 0 };
  
  policyKeywords.forEach(kw => { if (content.includes(kw)) scores.policy += 2; });
  marketKeywords.forEach(kw => { if (content.includes(kw)) scores.market += 2; });
  industryKeywords.forEach(kw => { if (content.includes(kw)) scores.industry += 2; });
  macroKeywords.forEach(kw => { if (content.includes(kw)) scores.macro += 2; });
  stockKeywords.forEach(kw => { if (content.includes(kw)) scores.stock += 2; });
  
  let maxCat = 'macro';
  let maxScore = 0;
  for (const cat in scores) {
    if (scores[cat] > maxScore) {
      maxScore = scores[cat];
      maxCat = cat;
    }
  }
  
  return maxCat;
}

// 从内容生成标签
function generateTagsFromContent(content, category) {
  const tags = [];
  const categoryTagMap = {
    policy: ['政策解读', '监管动态'],
    market: ['市场行情', 'A股'],
    industry: ['行业分析', '投资机会'],
    macro: ['宏观经济', '财经观察'],
    stock: ['个股分析', '投资策略']
  };
  
  if (categoryTagMap[category]) {
    tags.push(...categoryTagMap[category]);
  }
  
  // 从内容中提取关键词
  const keywords = ['新能源', '半导体', '医药', '消费', '地产', '金融', '科技', 'AI', '光伏', '锂电', '芯片', '白酒', '银行', '券商'];
  keywords.forEach(kw => {
    if (content.includes(kw) && tags.length < 5) {
      tags.push(kw);
    }
  });
  
  return tags.slice(0, 5);
}

// 生成自定义解读
function generateCustomScripts(hotspot, style) {
  const resultModal = document.getElementById('hotspot-result-modal');
  if (!resultModal) return;
  
  // 保存当前热点数据
  currentResultHotspot = hotspot;
  
  // 设置热点名称
  document.getElementById('result-hotspot-name').textContent = hotspot.title;
  
  // 显示行业适配提示
  const industryTip = document.getElementById('result-industry-tip');
  if (industryTip && userIndustry) {
    const indConfig = USER_INDUSTRIES.find(i => i.id === userIndustry);
    if (indConfig) {
      industryTip.querySelector('.tip-text').textContent = `已根据「${indConfig.name}」行业身份优化解读侧重点`;
      industryTip.style.display = 'flex';
    }
  } else if (industryTip) {
    industryTip.style.display = 'none';
  }
  
  // 生成5个方向的解读
  generatedScripts = {
    read: generateReadScript(hotspot),
    understand: generateUnderstandScript(hotspot),
    connect: generateConnectScript(hotspot),
    marketing: generateMarketingScript(hotspot),
    qa: generateQAScript(hotspot)
  };
  
  // 重置角度选择（默认第一个：热点通读）
  currentResultAngle = 'read';
  document.querySelectorAll('.angle-tab').forEach(tab => {
    tab.classList.remove('active');
    if (tab.dataset.angle === 'read') tab.classList.add('active');
  });
  
  updateResultContent();
  
  // 显示弹窗
  resultModal.classList.add('show');
  document.body.style.overflow = 'hidden';
  
  // 刷新图标
  refreshIcons(resultModal);
  
  showToast('解读生成成功！');
}

// 根据风格生成指定角度的话术
function generateCustomByStyle(hotspot, angle, style) {
  const content = hotspot.content;
  const title = hotspot.title;
  const tags = hotspot.tags.join('、');
  const audienceNames = {
    general: '广大投资者',
    conservative: '保守型投资者',
    aggressive: '进取型投资者',
    professional: '专业投资者'
  };
  const audience = audienceNames[hotspot.audience] || '广大投资者';
  
  const angleNames = {
    macro: '宏观分析',
    industry: '行业影响',
    product: '产品关联',
    qa: '客户Q&A'
  };
  
  switch (style) {
    case 'professional':
      return generateProfessionalStyle(hotspot, angle, audience);
    case 'easy':
      return generateEasyStyle(hotspot, angle, audience);
    case 'question':
      return generateQuestionStyle(hotspot, angle, audience);
    case 'golden':
      return generateGoldenStyle(hotspot, angle, audience);
    default:
      return generateProfessionalStyle(hotspot, angle, audience);
  }
}

// 专业解读风格
function generateProfessionalStyle(hotspot, angle, audience) {
  const content = hotspot.content;
  const tags = hotspot.tags.join('、');
  
  if (angle === 'macro') {
    return `
      <p><strong>核心观点：</strong></p>
      <p>${content}</p>
      <p>这一事件反映了当前宏观经济运行中的重要变化，对${audience}的资产配置具有重要参考意义。</p>
      <p><strong>专业解读：</strong></p>
      <ul>
        <li>从政策层面看，释放出明确的政策信号，后续落地效果值得持续关注</li>
        <li>从流动性角度看，市场资金面有望保持合理充裕，利率环境整体友好</li>
        <li>从估值角度看，当前市场估值处于历史相对低位，中长期配置价值凸显</li>
        <li>从风险角度看，需关注外部环境变化及政策不及预期等潜在风险因素</li>
      </ul>
      <p><strong>策略建议：</strong>建议${audience}保持均衡配置，关注结构性机会，根据自身风险承受能力动态调整仓位。</p>
    `;
  } else if (angle === 'industry') {
    return `
      <p><strong>行业影响分析：</strong></p>
      <p>结合"${tags}"等相关方向，我们梳理了以下投资线索：</p>
      <ul>
        <li><strong>直接受益方向：</strong>政策支持力度加大的细分领域，龙头企业有望持续受益</li>
        <li><strong>间接受益方向：</strong>产业链上下游配套企业，需求端改善带动业绩增长</li>
        <li><strong>主题性机会：</strong>市场关注度提升带来的交易性机会，适合波段操作</li>
        <li><strong>需规避方向：</strong>政策调控压力较大、估值偏高的板块需谨慎</li>
      </ul>
      <p><strong>投资建议：</strong>建议${audience}重点关注行业景气度向上、估值合理的优质标的，逢低布局。</p>
    `;
  } else if (angle === 'product') {
    // 获取用户行业的产品类型
    const industryFocus = getUserIndustryFocus();
    const industryConfig = USER_INDUSTRIES.find(i => i.id === userIndustry);
    const productTypes = industryConfig ? industryConfig.productTypes : ['权益类基金', '固收类产品', '指数基金', '定投策略'];
    
    return `
      <p><strong>产品配置建议：</strong></p>
      <p>基于当前热点，为${audience}梳理以下配置方向：</p>
      <ul>
        <li><strong>${productTypes[0] || '权益类产品'}：</strong>关注相关主题方向，把握行业成长红利</li>
        <li><strong>${productTypes[1] || '固收类产品'}：</strong>稳健打底，控制组合整体波动</li>
        <li><strong>${productTypes[2] || '指数产品'}：</strong>宽基+行业搭配，分散风险</li>
        <li><strong>${productTypes[3] || '定投策略'}：</strong>分批入场，平摊持仓成本</li>
      </ul>
      <p><strong>核心关注点：</strong>${industryFocus.slice(0, 3).join('、')}</p>
      <p><strong>风险提示：</strong>投资有风险，入市需谨慎。以上建议仅供参考，不构成投资建议。</p>
    `;
  } else {
    const industryConfig = USER_INDUSTRIES.find(i => i.id === userIndustry);
    const industryName = industryConfig ? industryConfig.name : '金融';
    
    return `
      <p><strong>Q1: 这个热点对我有什么影响？</strong></p>
      <p>A: 对于${audience}来说，这个热点主要影响的是您的权益类资产配置。相关板块可能出现阶段性机会，但也需注意波动风险。</p>
      <p><strong>Q2: 现在是入场的好时机吗？</strong></p>
      <p>A: 建议结合您的投资期限和风险承受能力综合判断。短期看市场情绪较为积极，但中长期仍需关注基本面变化。</p>
      <p><strong>Q3: 作为${industryName}从业者，该怎么跟客户聊？</strong></p>
      <p>A: 建议从以下几个角度切入：${getUserIndustryFocus().slice(0, 3).join('、')}。先帮助客户理解热点的影响，再结合客户需求给出合适的建议。</p>
      <p><strong>Q4: 需要注意哪些风险？</strong></p>
      <p>A: 主要风险包括：政策落地不及预期、行业竞争加剧、外部环境变化、市场情绪波动等。</p>
    `;
  }
}

// 轻松科普风格
function generateEasyStyle(hotspot, angle, audience) {
  const content = hotspot.content;
  
  if (angle === 'macro') {
    return `
      <p>🌞 哈喽~今天来聊一个热门话题！</p>
      <p><strong>简单来说：</strong>${content}</p>
      <p>😉 用大白话讲，就是：市场又有新动向啦！这事儿对我们的钱包多多少少有点影响~</p>
      <p><strong>划重点：</strong></p>
      <ul>
        <li>✅ 好事儿：政策持续发力，经济基本面有支撑</li>
        <li>✅ 机会多：很多板块都有表现机会</li>
        <li>⚠️ 要注意：别追高，慢慢来，定投是个好办法</li>
        <li>💡 小建议：保持好心态，不被短期波动影响</li>
      </ul>
      <p>🤗 投资嘛，就是要在别人恐慌时贪婪，在别人贪婪时恐慌~ 你懂的！</p>
    `;
  } else if (angle === 'industry') {
    return `
      <p>🎯 来看看哪些行业最有戏！</p>
      <p>这次的热点呀，带火了好几个赛道：</p>
      <ul>
        <li>🚀 <strong>当红炸子鸡：</strong>政策直接点名的行业，最近涨势喜人</li>
        <li>📈 <strong>潜力股：</strong>产业链上的小伙伴们，跟着喝汤也不错</li>
        <li>🛡️ <strong>稳健型：</strong>业绩稳扎稳打的白马股，适合长期持有</li>
        <li>⚡ <strong>短平快：</strong>题材股波动大，适合高手玩短线</li>
      </ul>
      <p>😎 选哪个？看你的风险偏好啦~ 反正不要把鸡蛋放一个篮子里就对了！</p>
    `;
  } else if (angle === 'product') {
    return `
      <p>💰 买什么好呢？来抄作业啦！</p>
      <p>给${audience}的懒人配置方案：</p>
      <ul>
        <li>🥇 <strong>主力仓位（60%）：</strong>宽基指数基金，稳就一个字</li>
        <li>🥈 <strong>进攻仓位（20%）：</strong>相关主题基金，赚一波行情</li>
        <li>🥉 <strong>防守仓位（20%）：</strong>债券基金，晚上睡得香</li>
        <li>💚 <strong>懒人首选：</strong>基金定投，省时省力省心</li>
      </ul>
      <p>🌟 温馨提示：以上仅供参考哦~ 适合自己的才是最好的！</p>
    `;
  } else {
    return `
      <p>🤔 大家最关心的几个问题，来一波解答！</p>
      <p><strong>Q1：我是小白，能参与吗？</strong></p>
      <p>A：当然可以！建议从基金定投开始，先小额试试水，慢慢积累经验~</p>
      <p><strong>Q2：现在进去会不会被套？</strong></p>
      <p>A：这个谁也说不准哦~ 但如果是长期投资，现在这个点位其实不算高。分批入场比较稳妥。</p>
      <p><strong>Q3：大概能赚多少钱？</strong></p>
      <p>A：这个问题太灵魂拷问了哈哈哈~ 投资不是保本的，有赚有亏很正常。放平心态最重要！</p>
      <p><strong>Q4：多久能看到效果？</strong></p>
      <p>A：短期可能上蹿下跳，中长期（1-3年）来看，优质资产大概率会有不错的回报~</p>
    `;
  }
}

// 提问引导风格
function generateQuestionStyle(hotspot, angle, audience) {
  if (angle === 'macro') {
    return `
      <p>🤔 你是否也在思考这些问题？</p>
      <p><strong>当前市场环境下，我们该如何应对？</strong></p>
      <p>让我们从几个维度来深入思考：</p>
      <ul>
        <li>❓ 这一热点背后的深层逻辑是什么？是短期事件还是趋势性变化？</li>
        <li>❓ 政策的真实意图是什么？对经济的影响有多大、多久？</li>
        <li>❓ 市场预期是否已经充分反映？还有多少预期差可以把握？</li>
        <li>❓ 作为${audience}，我们的认知优势在哪里？如何转化为投资收益？</li>
      </ul>
      <p>💭 带着问题去投资，远比盲目跟风更重要。你怎么看？欢迎交流探讨~</p>
    `;
  } else if (angle === 'industry') {
    return `
      <p>🔍 透过现象看本质，几个值得深思的问题：</p>
      <p><strong>这波行情，哪些行业才是真正的赢家？</strong></p>
      <ul>
        <li>❓ 哪些行业是直接受益？哪些只是主题炒作？如何区分？</li>
        <li>❓ 行业景气度能持续多久？是昙花一现还是长周期向上？</li>
        <li>❓ 龙头公司和二线标的，哪个性价比更高？</li>
        <li>❓ 现在入场，是追高还是布局？你的安全边际在哪里？</li>
      </ul>
      <p>💭 投资最重要的是独立思考。你心中有答案了吗？</p>
    `;
  } else if (angle === 'product') {
    return `
      <p>📋 在做配置决策前，不妨先问问自己这几个问题：</p>
      <p><strong>我的投资目标是什么？当前配置是否匹配？</strong></p>
      <ul>
        <li>❓ 这笔钱我能放多久？能承受多大的回撤？</li>
        <li>❓ 我的收益预期合理吗？是否需要承担过高的风险？</li>
        <li>❓ 当前的资产配置，是否充分分散了风险？</li>
        <li>❓ 如果市场下跌20%，我能坚持住吗？会恐慌卖出吗？</li>
      </ul>
      <p>💭 了解自己，比了解市场更重要。你对自己的答案满意吗？</p>
    `;
  } else {
    return `
      <p>💬 客户最常问的几个问题，你是否也有同样的困惑？</p>
      <p><strong>Q1：现在是不是牛市的起点？</strong></p>
      <p>这个问题其实应该反过来问：如果不是牛市，你还会投资吗？投资的目的是为了等牛市吗？</p>
      <p><strong>Q2：我应该加仓还是减仓？</strong></p>
      <p>答案取决于另一个问题：你现在的仓位，让你睡得着觉吗？投资的第一原则是睡个好觉。</p>
      <p><strong>Q3：哪个板块最有机会？</strong></p>
      <p>不如问问自己：哪个板块我最懂？认知范围内的机会，才是真正的机会。</p>
      <p><strong>Q4：什么时候卖？</strong></p>
      <p>买的时候就该想清楚卖的条件。你当初为什么买？那个理由还成立吗？</p>
    `;
  }
}

// 金句短讯风格
function generateGoldenStyle(hotspot, angle, audience) {
  if (angle === 'macro') {
    return `
      <p>⭐ <strong>今日金句</strong></p>
      <blockquote>
        <p>"在别人贪婪时恐惧，在别人恐惧时贪婪。" —— 巴菲特</p>
      </blockquote>
      <p>✨ <strong>热点速读：</strong></p>
      <p>市场风起云涌，机会与风险并存。</p>
      <p>📌 <strong>三句话总结：</strong></p>
      <ul>
        <li>方向比努力重要，选对赛道事半功倍</li>
        <li>耐心比本金重要，时间是投资者最好的朋友</li>
        <li>纪律比聪明重要，守住初心方能行稳致远</li>
      </ul>
      <p>🎯 与${audience}共勉：投资是一场马拉松，不是百米冲刺。</p>
    `;
  } else if (angle === 'industry') {
    return `
      <p>⭐ <strong>行业箴言</strong></p>
      <blockquote>
        <p>"风口来了，猪都能飞。但风停了，摔死的还是猪。"</p>
      </blockquote>
      <p>✨ <strong>机会盘点：</strong></p>
      <p>热点轮动，谁主沉浮？</p>
      <p>📌 <strong>三个方向：</strong></p>
      <ul>
        <li>🚀 高景气赛道：业绩为王，强者恒强</li>
        <li>💎 低估值蓝筹：安全边际，攻守兼备</li>
        <li>🌱 成长黑马：潜力巨大，波动也大</li>
      </ul>
      <p>🎯 记住：涨出来的是风险，跌出来的是机会。</p>
    `;
  } else if (angle === 'product') {
    return `
      <p>⭐ <strong>配置心得</strong></p>
      <blockquote>
        <p>"不要把所有鸡蛋放在一个篮子里——但也不要放在太多篮子里。"</p>
      </blockquote>
      <p>✨ <strong>配置口诀：</strong></p>
      <p>股债搭配，干活不累；定投相伴，心态不慌。</p>
      <p>📌 <strong>四字箴言：</strong></p>
      <ul>
        <li>🎯 <strong>分散</strong>——不押注单一方向</li>
        <li>⏰ <strong>长期</strong>——时间熨平波动</li>
        <li>📊 <strong>均衡</strong>——攻守两相宜</li>
        <li>💚 <strong>定投</strong>——懒人致富利器</li>
      </ul>
      <p>🎯 适合${audience}的才是最好的。</p>
    `;
  } else {
    return `
      <p>⭐ <strong>投资语录</strong></p>
      <blockquote>
        <p>"投资的秘诀在于，控制风险，而不是回避风险。"</p>
      </blockquote>
      <p>✨ <strong>灵魂四问：</strong></p>
      <p>你真的了解你买的东西吗？</p>
      <p>📌 <strong>金句集锦：</strong></p>
      <ul>
        <li>💡 不懂不投，不熟不做</li>
        <li>💡 盈亏同源，风险收益匹配</li>
        <li>💡 市场永远是对的，错的是我们的预期</li>
        <li>💡 最大的风险，是不知道自己在冒什么风险</li>
      </ul>
      <p>🎯 与君共勉，投资路上，我们一起成长。</p>
    `;
  }
}

// （旧版生成函数已移除，改用5方向热点解读功能）

// ============================================
// 今日推荐数据
// ============================================

// 今日营销内容推荐数据
const DAILY_RECOMMEND_DATA = {
  hotspot: {
    title: '热点资讯类推荐',
    copies: [
      {
        title: '热点解读：A股震荡下的机会',
        tag: '深度解读',
        content: `【今日热点】
今天A股市场延续震荡走势，三大指数分化明显。很多朋友问我，这种行情下该怎么办？

分享三个观点：
1️⃣ 震荡不是风险，是筛选优质资产的窗口期
2️⃣ 不要追涨杀跌，布局长期看好的方向
3️⃣ 适当配置固收+产品，降低组合波动

投资是一场马拉松，不是百米冲刺。市场波动时，更要保持理性。

欢迎私信交流你的投资困惑，一起探讨～

#投资理财 #A股 #市场分析`
      },
      {
        title: '热点快讯：政策利好来袭',
        tag: '热点快讯',
        content: `【政策利好！】刚刚，国务院发布最新经济刺激方案，重点提及：

✅ 加大基建投资力度
✅ 促进消费复苏
✅ 支持民营经济发展

每一次政策底之后，都是市场底的构筑过程。历史不会简单重复，但总是押着相似的韵脚。

作为理财顾问，我的建议是：
- 仓位较轻的，可以分批建仓
- 仓位较重的，耐心持有等待
- 不确定的，先来聊聊你的持仓

机会总是留给有准备的人 💪

#财经 #投资机会 #政策解读`
      },
      {
        title: '热点观察：新能源赛道分化',
        tag: '行业观察',
        content: `【热点观察】新能源板块最近波动很大，有人问我还能不能投？

我的看法：
🔹 长期逻辑没变：双碳目标+能源转型是大趋势
🔹 短期波动正常：涨多了调整，是市场规律
🔹 分化是必然：从普涨到精选个股

投资新能源，建议关注三个方向：
1. 技术壁垒高的龙头企业
2. 供需格局好的细分赛道
3. 估值合理的优质标的

不追热点，不杀跌，用长期视角做投资。

你怎么看新能源的后市？评论区聊聊👇

#新能源 #投资 #理财分享`
      }
    ],
    posters: [
      { name: '热点解读海报', icon: '📰', gradient: 'daily-poster-1', text: 'A股震荡下的三大投资策略' },
      { name: '政策利好速递', icon: '📋', gradient: 'daily-poster-2', text: '国务院经济刺激方案解读' },
      { name: '行业观察海报', icon: '🔍', gradient: 'daily-poster-3', text: '新能源赛道：分化中的机遇' }
    ],
    videos: [
      {
        title: '30秒看懂今日市场',
        rows: [
          { label: '开头', text: '今天A股又震荡了，别急着慌，30秒给你讲明白。' },
          { label: '内容', text: '第一，政策面其实在持续回暖；第二，成交量没有放大说明抛压不大；第三，很多优质股票已经很便宜了。' },
          { label: '建议', text: '记住：别人恐惧我贪婪，别人贪婪我恐惧。现在是定投的好时机。' },
          { label: '结尾', text: '关注我，每天一个理财小知识。' }
        ]
      },
      {
        title: '为什么我说现在要乐观',
        rows: [
          { label: '开头', text: '很多人问我，现在市场这么差，你怎么还这么乐观？' },
          { label: '原因1', text: '第一，估值已经在历史低位了，向下空间有限；第二，政策底已经出现，市场底还会远吗？' },
          { label: '原因2', text: '第三，每次大熊市之后都是大牛市，这次也不会例外。' },
          { label: '结尾', text: '点赞收藏，我们一起等风来。' }
        ]
      }
    ]
  },
  knowledge: {
    title: '财商科普类推荐',
    copies: [
      {
        title: '什么是基金定投？',
        tag: '理财知识',
        content: `【理财小知识】什么是基金定投？

简单说，就是在固定时间，投入固定金额，买入固定基金。

比如：每个月10号，投1000块，买沪深300指数基金。

为什么要定投？
✅ 不用择时，懒人理财
✅ 摊薄成本，降低风险
✅ 强制储蓄，积少成多

适合谁？
👉 每月有固定收入
👉 没有时间研究市场
👉 想长期积累财富

记住：定投最重要的不是选什么，而是坚持下去。

你在定投吗？评论区聊聊你的定投心得～

#基金定投 #理财知识 #小白理财`
      },
      {
        title: '复利的威力有多大？',
        tag: '财商思维',
        content: `【复利思维】爱因斯坦说：复利是世界第八大奇迹。

举个例子：
你每月存1000元，年化收益8%
👉 10年后：18.4万
👉 20年后：59.3万  
👉 30年后：146.8万

本金只有36万，收益却有110万+

这就是复利的威力：
🔹 时间越长，效果越惊人
🔹 越早开始，优势越大
🔹 坚持比什么都重要

不要觉得钱少就不理财，复利的起点就是现在。

从今天开始，为自己的未来存第一笔钱吧 💪

#复利 #理财思维 #财富自由`
      },
      {
        title: '如何配置家庭资产？',
        tag: '资产配置',
        content: `【家庭理财】标准普尔家庭资产象限图

把钱分成4份：

🏦 10% 要花的钱（活期）
- 3-6个月生活费
- 放余额宝、货币基金

🛡 20% 保命的钱（保障）
- 保险：重疾、医疗、意外
- 专款专用，以小博大

💰 30% 生钱的钱（投资）
- 股票、基金、房产
- 追求高收益，能承受波动

🏠 40% 保本升值的钱
- 债券、年金、定存
- 本金安全，收益稳定

你家的钱，是怎么分配的呢？

#家庭理财 #资产配置 #理财规划`
      }
    ],
    posters: [
      { name: '基金定投海报', icon: '📊', gradient: 'daily-poster-1', text: '每月1000元，30年后变146万' },
      { name: '复利思维海报', icon: '💹', gradient: 'daily-poster-2', text: '复利：世界第八大奇迹' },
      { name: '资产配置海报', icon: '🏦', gradient: 'daily-poster-3', text: '标准普尔家庭资产象限图' }
    ],
    videos: [
      {
        title: '一分钟学会基金定投',
        rows: [
          { label: '开头', text: '什么是基金定投？一分钟讲明白。' },
          { label: '定义', text: '简单说就是：固定时间、固定金额、买入固定基金。' },
          { label: '好处', text: '好处是：不用择时、摊薄成本、强制储蓄，特别适合上班族。' },
          { label: '结尾', text: '关注我，每天一个理财小技巧。' }
        ]
      },
      {
        title: '普通人如何实现财务自由',
        rows: [
          { label: '开头', text: '普通人能实现财务自由吗？能，但要做到这三点。' },
          { label: '第一', text: '第一，强制储蓄，至少存下收入的30%。' },
          { label: '第二', text: '第二，学会投资，让钱生钱，而不是只靠工资。' },
          { label: '结尾', text: '第三，坚持十年以上。点赞收藏，一起加油！' }
        ]
      }
    ]
  },
  festival: {
    title: '节日祝福类推荐',
    copies: [
      {
        title: '周一问候',
        tag: '日常问候',
        content: `【周一早安】☀️

新的一周，新的开始。

这周的市场怎么走，没人知道；
但这周的努力，你可以掌控。

投资是一场马拉松，
不必在意一两天的涨跌。

保持好心态，
慢慢变富，才是最快的路。

祝你新的一周：
工作顺利，投资长红！🚀

#周一早安 #投资理财 #正能量`
      },
      {
        title: '月末总结',
        tag: '月度问候',
        content: `【月末总结】📅

这个月的投资成绩单出来了吗？
不管是赚是亏，都没关系。

赚了，不骄傲，落袋为安；
亏了，不气馁，总结经验。

投资最重要的不是某一个月赚多少，
而是能不能在市场里活得久。

下个月，我们继续加油💪

有什么投资困惑，欢迎随时找我聊聊～

#月末总结 #理财 #投资心得`
      },
      {
        title: '周末轻松一刻',
        tag: '周末祝福',
        content: `【周末愉快】🌿

忙碌了一周，该歇歇了。

关掉K线，放下手机，
陪陪家人，看看风景。

投资很重要，
但生活更重要。

会休息的人，才会投资。
周末愉快！😌

你周末有什么安排？评论区聊聊～

#周末 #生活 #投资理财`
      }
    ],
    posters: [
      { name: '周一早安海报', icon: '☀️', gradient: 'daily-poster-1', text: '新的一周，元气满满' },
      { name: '月末总结海报', icon: '📊', gradient: 'daily-poster-2', text: '复盘过去，展望未来' },
      { name: '周末祝福海报', icon: '🌿', gradient: 'daily-poster-3', text: '周末愉快，好好休息' }
    ],
    videos: [
      {
        title: '周一早安正能量',
        rows: [
          { label: '开头', text: '周一早！新的一周开始了。' },
          { label: '内容', text: '上周的收益是过去，这周的机会在眼前。保持好心态，慢慢来。' },
          { label: '祝福', text: '祝你这周：工作顺利，投资长红！' },
          { label: '结尾', text: '点赞收下这份好运吧～' }
        ]
      },
      {
        title: '周末温馨祝福',
        rows: [
          { label: '开头', text: '周末了，别总盯着盘面。' },
          { label: '内容', text: '陪陪家人，看看书，运动一下。会休息的人才会投资。' },
          { label: '建议', text: '记住：投资是为了更好的生活，别搞反了。' },
          { label: '结尾', text: '周末愉快！' }
        ]
      }
    ]
  },
  personal: {
    title: '打造人设类推荐',
    copies: [
      {
        title: '我的一天：理财顾问的日常',
        tag: '职场分享',
        content: `【我的一天】理财顾问都在忙什么？

很多朋友好奇我的工作，分享一下：

8:30 到公司，浏览隔夜外盘和重要新闻
9:00 晨会，讨论今日市场策略
10:00 见客户，做理财规划方案
12:00 午休，看研报充电
14:00 产品培训，持续学习
15:30 复盘，整理客户跟进记录
18:00 下班，偶尔加班

看起来光鲜，其实都是细节和服务。

客户的信任，是我最大的动力 💪

你的工作是什么样的？评论区聊聊～

#职场日常 #理财顾问 #工作分享`
      },
      {
        title: '为什么我选择做理财顾问',
        tag: '个人感悟',
        content: `【入行感悟】为什么我选择做理财顾问？

说实话，这个行业并不容易：
📚 要不停学习新知识
📞 要经常被客户拒绝
😔 要承受市场波动的压力

但我还是热爱这份工作，因为：
✨ 能帮客户实现财富增值
✨ 能见证一个个家庭的成长
✨ 能在这个过程中不断提升自己

每一份信任，都是一份责任。

我是一名理财顾问，
我为自己的职业感到骄傲。

你呢？你热爱你的工作吗？

#职业感悟 #理财顾问 #正能量`
      },
      {
        title: '读书分享：《穷爸爸富爸爸》',
        tag: '学习成长',
        content: `【读书分享】最近重读了《穷爸爸富爸爸》，依然很有启发。

核心观点分享：
1️⃣ 资产和负债的区别
   资产是把钱放进你口袋的东西
   负债是把钱从你口袋拿走的东西

2️⃣ 关注自己的事业
   为钱工作 vs 让钱为你工作

3️⃣ 财商比智商更重要
   学校不教的，社会会教你

经典之所以是经典，
就是因为每次读都有新收获。

你读过这本书吗？印象最深的是什么？

#读书 #财商 #穷爸爸富爸爸`
      }
    ],
    posters: [
      { name: '职场日常海报', icon: '💼', gradient: 'daily-poster-1', text: '认真工作的人最帅气' },
      { name: '个人感悟海报', icon: '💭', gradient: 'daily-poster-2', text: '因为热爱，所以坚持' },
      { name: '读书分享海报', icon: '📖', gradient: 'daily-poster-3', text: '投资自己，永远不亏' }
    ],
    videos: [
      {
        title: '理财顾问的一天',
        rows: [
          { label: '开头', text: '很多人好奇理财顾问一天都在干嘛，今天带大家看看。' },
          { label: '上午', text: '早上看盘、开晨会，然后就是见客户、做方案。' },
          { label: '下午', text: '下午培训、复盘，不断学习充电。' },
          { label: '结尾', text: '虽然忙，但能帮到客户就很开心。关注我，了解更多理财日常。' }
        ]
      },
      {
        title: '给年轻人的三个建议',
        rows: [
          { label: '开头', text: '作为理财顾问，给年轻人三个建议。' },
          { label: '建议', text: '第一，趁早理财，复利的威力你想象不到。第二，多学习，投资自己永远不亏。第三，别怕犯错，年轻就是最大的资本。' },
          { label: '鼓励', text: '加油，未来可期！' },
          { label: '结尾', text: '点赞收藏，一起成长。' }
        ]
      }
    ]
  }
};

// 今日推荐初始化
function initDailyRecommend() {
  // 更新日期
  const dateEl = document.getElementById('daily-recommend-date');
  if (dateEl) {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const weekDay = weekDays[now.getDay()];
    dateEl.textContent = `${month}月${day}日 ${weekDay}`;
  }
  
  // 方向卡片点击事件
  const directionCards = document.querySelectorAll('.direction-card');
  directionCards.forEach(card => {
    card.addEventListener('click', function() {
      const direction = this.dataset.direction;
      
      // 切换选中态
      directionCards.forEach(c => c.classList.remove('active'));
      this.classList.add('active');
      
      generateDailyRecommend(direction);
    });
  });
  
  // 输出形式Tab切换（6种形式）
  const dailyFormatTabs = document.querySelectorAll('.daily-format-tab');
  dailyFormatTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      const format = this.dataset.format;
      
      // 切换Tab
      dailyFormatTabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      
      // 切换面板
      const panels = document.querySelectorAll('.daily-format-panel');
      panels.forEach(p => p.classList.remove('active'));
      document.getElementById('daily-format-' + format).classList.add('active');
    });
  });
  
  // 默认加载热点资讯类内容（不自动滚动）
  generateDailyRecommend('hotspot', false);
}

// 加载热点资讯类内容（基于实时热点）
function loadDailyHotspotContent() {
  // 先显示加载状态
  const copyListEl = document.getElementById('daily-copy-list');
  if (copyListEl) {
    copyListEl.innerHTML = `
      <div style="text-align:center;padding:40px;color:var(--text-secondary);">
        <div class="loading-spinner" style="margin:0 auto 12px;"></div>
        <span>正在结合今日热点生成素材...</span>
      </div>
    `;
  }
  
  // 获取实时热点数据
  fetchHotspotDataOnly()
    .then(hotspots => {
      // 取前3条热点生成营销文案
      const topHotspots = hotspots.slice(0, 3);
      const hotspotCopies = generateHotspotCopies(topHotspots);
      const hotspotPosters = generateHotspotPosters(topHotspots);
      const hotspotVideos = generateHotspotVideos(topHotspots);
      
      // 渲染文案
      renderDailyCopies(hotspotCopies);
      
      // 渲染海报
      renderDailyPosters(hotspotPosters);
      
      // 渲染短视频
      renderDailyVideos(hotspotVideos);
    })
    .catch(() => {
      // 失败时用默认数据
      const data = DAILY_RECOMMEND_DATA.hotspot;
      renderDailyCopies(data.copies);
      renderDailyPosters(data.posters);
      renderDailyVideos(data.videos);
    });
}

// 根据热点生成营销文案
function generateHotspotCopies(hotspots) {
  const copies = [];
  const templates = [
    {
      title: '热点解读：{title}',
      tag: '深度解读',
      intro: '【今日热点】\n{summary}\n\n很多朋友问我，这件事怎么看？',
      points: [
        '短期影响：情绪面波动，不改长期趋势',
        '中期视角：关注基本面变化，逢低布局优质资产',
        '操作建议：不追涨、不杀跌，保持理性'
      ],
      ending: '投资是一场马拉松，不是百米冲刺。\n\n有什么想法，欢迎私信交流～\n\n#今日热点 #投资理财 #市场分析'
    },
    {
      title: '热点快讯：{title}',
      tag: '热点快讯',
      intro: '【刚刚！】{summary}\n\n这个消息刷屏了，给大家划重点：',
      points: [
        '事件本身：属于正常市场波动范围',
        '历史规律：每次大事件后，市场都会回归基本面',
        '我的建议：保持仓位均衡，不要盲目操作'
      ],
      ending: '机会总是留给有准备的人 💪\n\n不确定的朋友，可以聊聊你的持仓，一起分析～\n\n#财经快讯 #投资机会'
    },
    {
      title: '热点观察：{title}',
      tag: '行业观察',
      intro: '【热点观察】{summary}\n\n这个方向，我一直在关注。',
      points: [
        '长期逻辑：行业趋势没变，短期波动是机会',
        '投资思路：精选龙头，避免追高，分批布局',
        '风险提示：注意估值和业绩的匹配度'
      ],
      ending: '不追热点，用长期视角做投资。\n\n你怎么看？评论区聊聊👇\n\n#行业观察 #投资 #理财分享'
    }
  ];
  
  hotspots.forEach((hotspot, index) => {
    const tpl = templates[index % templates.length];
    const title = hotspot.title || '';
    const summary = hotspot.summary || hotspot.content || '';
    
    let content = tpl.intro
      .replace('{title}', title.replace(/\.\.\.$/, ''))
      .replace('{summary}', summary.replace(/\.\.\.$/, ''));
    
    content += '\n\n';
    tpl.points.forEach((point, i) => {
      const emoji = ['1️⃣', '2️⃣', '3️⃣'][i] || '✅';
      content += `${emoji} ${point}\n`;
    });
    
    content += '\n' + tpl.ending;
    
    copies.push({
      title: tpl.title.replace('{title}', title.length > 12 ? title.substring(0, 12) + '...' : title),
      tag: tpl.tag,
      content: content
    });
  });
  
  return copies;
}

// ============================================
// 热点资讯类 - 朋友圈图文（深度定制版）
// ============================================
function generateHotspotMoments(hotspots) {
  const moments = [];
  const now = new Date();
  const dateStr = `${now.getMonth() + 1}月${now.getDate()}日`;
  
  // 按分类差异化的观点模板
  const categoryInsights = {
    policy: {
      dataHint: '政策力度指数：★★★★☆',
      myView: '政策底往往先于市场底出现。每一次重大政策出台，都是在为中长期的市场走向定调。短期可能有情绪波动，但方向比节奏更重要。',
      goldenLine: '政策是风，市场是船；风往哪吹，船往哪走。',
      tags: ['#政策解读', '#宏观经济', '#投资理财']
    },
    market: {
      dataHint: '市场热度指数：★★★☆☆',
      myView: '市场短期是投票机，长期是称重机。涨跌波动都是正常现象，关键是不要被情绪左右。别人贪婪时我恐惧，别人恐惧时我贪婪。',
      goldenLine: '行情总是在绝望中诞生，在犹豫中前行。',
      tags: ['#A股', '#市场分析', '#投资策略']
    },
    industry: {
      dataHint: '行业景气度：★★★★☆',
      myView: '每个行业都有自己的周期，重要的是看清大趋势。产业趋势一旦形成，不会因为短期波动而改变。选对赛道，比选对时点更重要。',
      goldenLine: '站在风口上，猪都会飞；但风停了，摔下来的也是猪。',
      tags: ['#行业研究', '#产业趋势', '#赛道投资']
    },
    macro: {
      dataHint: '宏观关注度：★★★★★',
      myView: '宏观决定方向，微观决定收益。大环境好的时候，赚钱是大概率事件；大环境不好的时候，保住本金就是胜利。顺势而为，比逆势操作重要得多。',
      goldenLine: '不要和趋势作对，要做趋势的朋友。',
      tags: ['#宏观经济', '#经济周期', '#资产配置']
    },
    stock: {
      dataHint: '个股关注度：★★★★☆',
      myView: '选股不是选彩票，要看公司的基本面。好公司也会跌，但跌了还能涨回来；差公司涨再多，最终也会跌回去。投资要赚企业成长的钱，而不是博弈的钱。',
      goldenLine: '买股票就是买公司，时间是好公司的朋友。',
      tags: ['#个股研究', '#价值投资', '#选股策略']
    }
  };
  
  hotspots.slice(0, 3).forEach((hotspot, index) => {
    const category = hotspot.category || 'market';
    const insight = categoryInsights[category] || categoryInsights.market;
    const title = hotspot.title || '';
    const summary = hotspot.summary || hotspot.content || '';
    const categoryName = hotspot.categoryName || '市场动态';
    const sourceName = hotspot.sourceName || '综合资讯';
    const viewsText = hotspot.viewsText || '';
    
    // 从标签中提取话题
    let topicTags = insight.tags.slice();
    if (hotspot.tags && hotspot.tags.length > 0) {
      hotspot.tags.slice(0, 2).forEach(tag => {
        topicTags.push('#' + tag.replace(/^#/, ''));
      });
    }
    
    // 生成摘要截断
    const shortSummary = summary.length > 60 ? summary.substring(0, 60) + '...' : summary;
    
    // 热度描述
    const hotDesc = viewsText ? `（${viewsText}人关注）` : '';
    
    const text = `【${dateStr} · ${categoryName}解读】

📌 热点速览：${title}${hotDesc}
${insight.dataHint} | 来源：${sourceName}

📰 热点摘要：
${shortSummary}

💡 我的看法：
${insight.myView}
结合今天这条消息来看，${category === 'policy' ? '政策面的积极信号正在累积，后续值得持续跟踪' : category === 'industry' ? '这个赛道的中长期逻辑没有变，短期调整反而可能带来布局机会' : '市场的结构性机会依然存在，关键是要选对方向'}。

✨ 今日金句：
${insight.goldenLine}

${topicTags.join(' ')}
—— 您身边的理财顾问`;
    
    moments.push({
      title: `${categoryName}：${title.length > 12 ? title.substring(0, 12) + '...' : title}`,
      text: text,
      tag: '朋友圈图文' + (index + 1),
      poster: {
        icon: ['📰', '📈', '🔍'][index] || '📰',
        text: title.length > 12 ? title.substring(0, 12) + '...' : title
      }
    });
  });
  
  return moments;
}

// ============================================
// 热点资讯类 - 私聊/群发（深度定制版）
// ============================================
function generateHotspotChat(hotspots) {
  const chats = [];
  
  // 按分类差异化的建议模板
  const categoryAdvice = {
    policy: {
      point2title: '政策影响解读',
      point2detail: '这类政策往往不是孤立的，背后是一整套的政策组合拳。短期来看会直接影响相关板块的情绪，中长期则会改变行业的基本面和估值逻辑。历史经验告诉我们，政策底之后通常需要一段时间消化，然后市场底才会逐步形成。',
      point3title: '给您的建议',
      point3detail: '如果您手上有相关板块的持仓，建议先不要急着追高加仓，可以等情绪平复后再看基本面的兑现情况。如果还没有布局，可以考虑分批建仓，不要一把梭。稳健型的客户，可以通过相关主题基金间接参与，风险更分散一些。'
    },
    market: {
      point2title: '市场影响解读',
      point2detail: '今天的市场波动，本质上还是多空博弈的结果。涨多了会调整，跌多了会反弹，这是市场的规律。从量能和板块轮动来看，目前市场还是结构性行情为主，全面牛市的条件还不成熟，但也不用太悲观。',
      point3title: '给您的建议',
      point3detail: '建议您保持均衡配置，不要把鸡蛋放在一个篮子里。权益类仓位控制在适中水平，进可攻退可守。如果市场继续调整，可以考虑逢低加仓优质标的；如果上涨，也不要盲目追高，适当止盈也是不错的选择。'
    },
    industry: {
      point2title: '行业影响解读',
      point2detail: '这个行业的中长期逻辑其实一直都在，只是短期市场情绪变化导致了波动。从产业趋势来看，渗透率提升、国产替代、技术迭代这些核心驱动力都没有变。现在的关键是区分真成长和纯题材，选那些有业绩支撑的龙头公司。',
      point3title: '给您的建议',
      point3detail: '如果您看好这个方向，建议用定投的方式参与，不要一次性all in。可以重点关注行业龙头和细分领域的隐形冠军，避开那些纯炒概念的公司。如果您风险承受能力一般，可以选择行业ETF或者主题基金，专业的事情交给专业的人做。'
    },
    macro: {
      point2title: '宏观影响解读',
      point2detail: '宏观经济是所有投资的大背景。经济好的时候，各行各业都受益；经济承压的时候，就要更注重防御。从目前的情况来看，经济复苏的大方向没变，但节奏可能会有反复。货币政策和财政政策都会持续发力，这对资本市场是有支撑的。',
      point3title: '给您的建议',
      point3detail: '建议您做好资产配置，股债平衡。经济复苏期可以适当增加权益类资产的比例，但也要留足固收类的底仓。如果您是稳健型投资者，可以考虑"固收+"产品，既有机会分享市场收益，又能控制波动。'
    },
    stock: {
      point2title: '个股影响解读',
      point2detail: '单只股票的波动，短期可能受消息面影响，但中长期还是要看公司的基本面。业绩是股价的基石，没有业绩支撑的上涨都是空中楼阁。建议大家研究个股的时候，多看看财务报表，了解公司的核心竞争力和护城河。',
      point3title: '给您的建议',
      point3detail: '如果您持有这只股票，建议对照一下当初买入的逻辑还在不在，如果逻辑没变，短期波动不用太在意。如果还没买，不要因为涨了就急着追，可以等回调或者估值合理的时候再考虑。单一个股的仓位建议不要太重，分散投资更稳妥。'
    }
  };
  
  hotspots.slice(0, 3).forEach((hotspot, index) => {
    const category = hotspot.category || 'market';
    const advice = categoryAdvice[category] || categoryAdvice.market;
    const title = hotspot.title || '';
    const summary = hotspot.summary || hotspot.content || '';
    const categoryName = hotspot.categoryName || '市场动态';
    
    // 生成3个要点
    const points = [
      {
        title: `事件本身：${title.length > 20 ? title.substring(0, 20) + '...' : title}`,
        detail: summary + '（信息来源：' + (hotspot.sourceName || '综合资讯') + '）'
      },
      {
        title: advice.point2title,
        detail: advice.point2detail
      },
      {
        title: advice.point3title,
        detail: advice.point3detail
      }
    ];
    
    let pointsText = '';
    const icons = ['1️⃣', '2️⃣', '3️⃣'];
    points.forEach((p, i) => {
      pointsText += `${icons[i]} ${p.title}\n　　${p.detail}\n\n`;
    });
    
    const text = `XX哥/姐，您好~

今天有个${categoryName}方面的消息挺重要的，想跟您分享一下我的看法：

${pointsText}您要是对这个方向感兴趣，或者对自己的持仓有什么疑问，随时找我聊~

祝您今天工作顺利，生活愉快！`;
    
    chats.push({
      title: `${categoryName}热点解读`,
      text: text,
      tag: '私聊话术' + (index + 1)
    });
  });
  
  return chats;
}

// ============================================
// 热点资讯类 - 社群分享（深度定制版）
// ============================================
function generateHotspotGroup(hotspots) {
  const groups = [];
  const now = new Date();
  const dateStr = `${now.getMonth() + 1}月${now.getDate()}日`;
  const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const weekDay = weekDays[now.getDay()];
  
  // 按分类差异化的市场回顾和互动话题
  const groupTemplates = {
    policy: {
      reviewIntro: '政策面动态',
      reviewText: '近期政策面消息密集，每一次政策调整都会对市场产生深远影响。从历史规律来看，政策底往往先于市场底出现，政策方向明确后，市场会逐步找到自己的节奏。',
      pollTopic: '接下来政策最可能在哪个方向持续发力？',
      pollOptions: ['稳增长/基建', '科技创新', '消费刺激', '房地产支持']
    },
    market: {
      reviewIntro: '市场行情回顾',
      reviewText: '今天市场整体呈现结构性行情，板块轮动加快。从成交量和资金流向来看，市场情绪有所波动，但整体风险可控。结构性机会依然存在，关键是要把握好节奏。',
      pollTopic: '接下来市场你更看好哪个方向？',
      pollOptions: ['大金融/价值', '科技成长', '消费复苏', '继续观望']
    },
    industry: {
      reviewIntro: '行业动态速递',
      reviewText: '行业景气度是投资的重要风向标。每个行业都有自己的发展周期，选对赛道往往比选对个股更重要。关注产业趋势，才能在投资中把握大方向。',
      pollTopic: '以下哪个赛道你最看好中长期机会？',
      pollOptions: ['新能源/光伏', '人工智能/科技', '医药健康', '消费升级']
    },
    macro: {
      reviewIntro: '宏观经济观察',
      reviewText: '宏观经济是资本市场的大背景。经济数据、货币政策、财政政策这些宏观变量，决定了市场的大方向。读懂宏观，才能更好地把握投资节奏。',
      pollTopic: '你觉得下半年经济复苏力度会如何？',
      pollOptions: ['强劲复苏', '温和复苏', '增速放缓', '不好说']
    },
    stock: {
      reviewIntro: '个股异动解读',
      reviewText: '个股的短期涨跌可能受消息面驱动，但长期来看还是基本面说了算。研究个股，要从商业模式、竞争格局、财务状况等多个维度去分析，不能只看股价涨跌。',
      pollTopic: '选股的时候，你最看重什么指标？',
      pollOptions: ['业绩增速', '估值水平', '行业地位', '技术走势']
    }
  };
  
  hotspots.slice(0, 3).forEach((hotspot, index) => {
    const category = hotspot.category || 'market';
    const tpl = groupTemplates[category] || groupTemplates.market;
    const categoryName = hotspot.categoryName || '市场动态';
    
    // 取3条热点资讯（如果有多个热点的话）
    const newsItems = hotspots.slice(index, index + 3).map(h => ({
      title: h.title || '',
      source: h.sourceName || '综合资讯'
    }));
    // 如果不够3条，循环补充
    while (newsItems.length < 3) {
      const h = hotspots[newsItems.length % hotspots.length];
      newsItems.push({
        title: h?.title || '市场动态更新',
        source: h?.sourceName || '综合资讯'
      });
    }
    
    let newsText = '';
    const newsIcons = ['①', '②', '③'];
    newsItems.slice(0, 3).forEach((n, i) => {
      const shortTitle = n.title.length > 28 ? n.title.substring(0, 28) + '...' : n.title;
      newsText += `${newsIcons[i]} ${shortTitle}\n`;
    });
    
    const text = `【早安分享 · ${categoryName}速递】🌅

各位群友早上好！今天是${dateStr} ${weekDay}~

📰 今日重要资讯：
${newsText}
📊 ${tpl.reviewIntro}：
${tpl.reviewText}

💬 今日话题讨论：
关于"${tpl.pollTopic}"
A. ${tpl.pollOptions[0]}
B. ${tpl.pollOptions[1]}
C. ${tpl.pollOptions[2]}
D. ${tpl.pollOptions[3]}

大家怎么看？欢迎群里交流～ 有任何理财疑问也可以随时@我，我会一一解答！

—————————
风险提示：以上观点仅供参考，不构成投资建议。市场有风险，投资需谨慎。`;
    
    groups.push({
      title: `${categoryName}群分享`,
      text: text,
      tag: '群分享' + (index + 1)
    });
  });
  
  return groups;
}

// 根据热点生成海报数据
function generateHotspotPosters(hotspots) {
  const posters = [];
  const gradients = ['daily-poster-1', 'daily-poster-2', 'daily-poster-3'];
  const icons = ['📰', '📈', '🔍'];
  const names = ['热点解读海报', '市场分析海报', '行业观察海报'];
  
  hotspots.forEach((hotspot, index) => {
    const title = hotspot.title || '';
    posters.push({
      name: names[index % names.length],
      icon: icons[index % icons.length],
      gradient: gradients[index % gradients.length],
      text: title.length > 15 ? title.substring(0, 15) + '...' : title
    });
  });
  
  return posters;
}

// 根据热点生成短视频脚本
function generateHotspotVideos(hotspots) {
  const videos = [];
  
  if (hotspots.length > 0) {
    const h1 = hotspots[0];
    videos.push({
      title: '30秒看懂今日热点',
      rows: [
        { label: '开头', text: '今天这个大新闻，你看到了吗？30秒给你讲明白。' },
        { label: '事件', text: `${(h1.title || '').substring(0, 30)}，市场反应很大。` },
        { label: '解读', text: '其实不用慌，每次大事件后市场都会回归基本面，关键是看长期。' },
        { label: '结尾', text: '关注我，每天一个理财小知识。' }
      ]
    });
  }
  
  if (hotspots.length > 1) {
    const h2 = hotspots[1];
    videos.push({
      title: '今日热点，我的看法',
      rows: [
        { label: '开头', text: `${(h2.title || '').substring(0, 20)}，怎么看？` },
        { label: '观点1', text: '第一，短期情绪波动，不改长期趋势。' },
        { label: '观点2', text: '第二，优质资产跌下来就是机会，分批布局。' },
        { label: '结尾', text: '点赞收藏，投资路上不迷路。' }
      ]
    });
  }
  
  return videos;
}

// ============================================
// 热点资讯类 - 电话沟通（深度定制版）
// ============================================
function generateHotspotPhone(hotspots) {
  const phones = [];
  
  // 按分类差异化的深度分析模板
  const categoryAnalysis = {
    policy: {
      depthTitle: '政策深度分析',
      depthPoints: [
        '政策力度超预期，说明高层对经济的重视程度很高，后续可能还有配套措施出台',
        '从历史经验看，政策底往往先于市场底出现，政策方向明确后，市场会逐步企稳',
        '政策受益板块值得重点关注，但要注意区分"真受益"和"纯炒作"'
      ],
      adviceConservative: '建议以稳健配置为主，政策利好的优质标的可以逢低分批布局，不要追高',
      adviceAggressive: '可以适度增加政策受益方向的配置比例，但要控制好仓位，做好止盈止损'
    },
    market: {
      depthTitle: '市场走势深度分析',
      depthPoints: [
        '当前市场处于结构性行情中，板块轮动加快，操作难度在加大',
        '成交量和资金流向是重要的观察指标，量能能否持续是行情延续的关键',
        '市场情绪波动较大，投资者要保持理性，避免追涨杀跌'
      ],
      adviceConservative: '建议保持均衡配置，不要因为市场波动而频繁操作，坚守优质标的',
      adviceAggressive: '可以适度参与结构性机会，但要快进快出，严格控制仓位和止损'
    },
    industry: {
      depthTitle: '行业景气度分析',
      depthPoints: [
        '这个行业的中长期逻辑是通顺的，产业趋势一旦形成不会轻易改变',
        '行业内部分化在加剧，龙头公司和细分赛道的优质企业更值得关注',
        '短期涨幅过大后要警惕回调风险，但中长期的投资价值依然存在'
      ],
      adviceConservative: '建议关注行业龙头，通过定投方式分批布局，平滑短期波动风险',
      adviceAggressive: '可以重点配置高景气细分赛道，选择基本面扎实的标的，把握行业红利'
    },
    macro: {
      depthTitle: '宏观经济深度解读',
      depthPoints: [
        '宏观经济是资本市场的大背景，经济走势直接影响企业盈利和市场表现',
        '货币政策和财政政策的走向是关键变量，需要持续跟踪政策动向',
        '海外经济形势和国际环境也会对国内市场产生影响，不能忽视外部风险'
      ],
      adviceConservative: '建议以固收+和稳健型产品为主，权益类资产控制在合理比例',
      adviceAggressive: '可以根据宏观周期调整资产配置，在经济复苏期适度增加权益仓位'
    },
    stock: {
      depthTitle: '个股投资价值分析',
      depthPoints: [
        '这家公司的基本面是关注的重点，要深入研究其商业模式和竞争优势',
        '估值水平也是重要考量因素，好公司也要有好价格才值得投资',
        '短期消息面的影响是暂时的，长期股价还是由企业的内在价值决定'
      ],
      adviceConservative: '建议通过基金等方式间接参与个股投资，分散单一标的风险',
      adviceAggressive: '可以精选优质个股，但要做好深入研究，控制好单只股票的仓位比例'
    }
  };
  
  hotspots.slice(0, 2).forEach((hotspot, index) => {
    const category = hotspot.category || 'market';
    const analysis = categoryAnalysis[category] || categoryAnalysis.market;
    const title = hotspot.title || '';
    const summary = hotspot.summary || hotspot.content || '';
    const categoryName = hotspot.categoryName || '市场动态';
    const sourceName = hotspot.sourceName || '综合资讯';
    const viewsText = hotspot.viewsText || '';
    const hotLevel = hotspot.hotLevel || 3;
    const shortTitle = title.length > 25 ? title.substring(0, 25) + '...' : title;
    const hotDesc = viewsText ? `${viewsText}人关注` : `热度${'★'.repeat(hotLevel)}`;
    
    const html = `
      <div class="call-section">
        <h4>📞 第一段：开场破冰（约30秒）</h4>
        <p class="script-speaker">客户经理：</p>
        <p class="script-line">「XX哥/姐，您好！我是XX银行/券商的理财顾问小X。打扰您几分钟，现在方便说话吗？」</p>
        <p class="script-tip">💡 等客户回应后再继续，确认对方有空再往下说</p>
      </div>
      
      <div class="call-section">
        <h4>📞 第二段：话题引入（约30秒）</h4>
        <p class="script-speaker">客户经理：</p>
        <p class="script-line">「是这样的，今天看到一条${categoryName}方面的新闻——"${shortTitle}"，${hotDesc}，来源是${sourceName}。想着您平时也比较关注${categoryName}这块，就想跟您聊聊我对这件事的看法。您之前有关注到这个消息吗？」</p>
        <p class="script-tip">💡 用"想着您关注"建立关联，先问客户有没有关注，显得不是在说教</p>
      </div>
      
      <div class="call-section">
        <h4>📞 第三段：热点解读（约1-2分钟）</h4>
        <p class="script-speaker">客户经理：</p>
        <p class="script-line">「简单跟您说下我的理解啊。这个消息的核心内容是：${summary.length > 80 ? summary.substring(0, 80) + '...' : summary}」</p>
        <p class="script-line">「我觉得这件事有三个关键点值得注意：」</p>
        <p class="script-line">「第一，${analysis.depthPoints[0]}」</p>
        <p class="script-line">「第二，${analysis.depthPoints[1]}」</p>
        <p class="script-line">「第三，${analysis.depthPoints[2]}」</p>
        <p class="script-tip">💡 语速放慢，说一段停一下，给客户插话的机会；不要自顾自说不停</p>
      </div>
      
      <div class="call-section">
        <h4>📞 第四段：${analysis.depthTitle}（约1分钟）</h4>
        <p class="script-speaker">客户经理：</p>
        <p class="script-line">「再往深了说一点啊，我觉得这件事对我们投资的启示在于：」</p>
        <p class="script-line">「${category === 'policy' ? '政策是市场的重要风向标，每一次重大政策调整都可能带来新的投资机会。但政策的落地和见效需要时间，不能太急功近利。' : category === 'industry' ? '行业的发展有其自身规律，景气度上行期要敢于布局，景气度下行期要谨慎应对。关键是要认清当前处于周期的哪个阶段。' : '市场短期波动是正常的，重要的是看清大趋势。不要因为短期的涨跌而改变长期的投资规划。'}」</p>
        <p class="script-line">「从${categoryName}的角度看，接下来重点要跟踪的是后续有没有更多相关的配套措施出台，以及市场资金面的变化情况。」</p>
        <p class="script-tip">💡 先讲现象，再讲本质，最后联系到投资，层层递进，显得专业</p>
      </div>
      
      <div class="call-section">
        <h4>📞 第五段：投资建议（约30秒）</h4>
        <p class="script-speaker">客户经理：</p>
        <p class="script-line">「说到具体怎么操作，我给您两个思路参考一下：」</p>
        <p class="script-line">「如果您是偏稳健的风格，${analysis.adviceConservative}。」</p>
        <p class="script-line">「如果您风险承受能力强一些，${analysis.adviceAggressive}。」</p>
        <p class="script-tip">💡 用"思路参考"等软措辞，给选项不给填空题，让客户自己选</p>
      </div>
      
      <div class="call-section">
        <h4>📞 第六段：收尾促动（约20秒）</h4>
        <p class="script-speaker">客户经理：</p>
        <p class="script-line">「行，那今天就先跟您简单聊这些，不耽误您太多时间了。」</p>
        <p class="script-line">「您要是对这个方向感兴趣，我可以把更详细的分析报告和相关产品资料发给您看看。或者您哪天有空来网点坐坐，我们当面聊聊，我给您做个全面的资产配置检视。」</p>
        <p class="script-line">「好的，那您先忙，有任何问题随时找我！再见~」</p>
        <p class="script-tip">💡 一定要给出明确的下一步动作，不要只是"寒暄一下就挂了"</p>
      </div>
      
      <div class="call-section">
        <h4>🚫 常见异议应对（附话术）</h4>
        <p class="call-sub-title">异议一："我最近没关注这块"</p>
        <p class="call-wrong">❌ 错误：这么大的事你都不知道啊 / 你应该多关注关注</p>
        <p class="call-right">✅ 应对：「没关系XX哥/姐，大家平时都挺忙的，没顾上很正常。正好我今天看到了，觉得这个消息挺重要的，就简单跟您说一下，您了解一下就行，也不一定非要操作什么。」</p>
        
        <p class="call-sub-title">异议二："这个和我有什么关系？"</p>
        <p class="call-wrong">❌ 错误：怎么会没关系呢 / 关系大了 / 你不理财财不理你</p>
        <p class="call-right">✅ 应对：「XX哥/姐，您这个问题问得特别好。说实话，单看这一条消息，可能确实跟您没直接关系。但我之所以跟您说，是因为这件事可能会影响到您手里的一些投资，比如您持有的基金或者理财产品，它们的投向可能就跟这个方向有关。提前了解一下，心里有个数总是好的，您说对吧？」</p>
        
        <p class="call-sub-title">异议三："风险会不会很大？"</p>
        <p class="call-wrong">❌ 错误：风险不大 / 放心吧不会亏的 / 现在正是好机会</p>
        <p class="call-right">✅ 应对：「XX哥/姐，您担心风险是对的，投资首先要考虑的就是风险。我跟您说实话，任何投资都是有风险的，这个方向也不例外。${category === 'policy' ? '政策落地的节奏和力度都有不确定性，市场反应也可能过度。' : category === 'industry' ? '行业短期涨多了就会有回调压力，不能只看收益不看风险。' : '市场波动是常态，没有人能精准预测涨跌。'}所以我的建议是，要么用定投的方式分批进，要么控制好仓位比例，不要把鸡蛋都放在一个篮子里，这样风险就可控多了。」</p>
        
        <p class="call-sub-title">异议四："再看看吧"</p>
        <p class="call-wrong">❌ 错误：还看啥呀 / 错过就没机会了 / 赶紧行动吧</p>
        <p class="call-right">✅ 应对：「没问题XX哥/姐，投资是大事，慎重考虑是应该的。不过我想跟您确认一下，您主要是想再看看哪方面呢？是想等等看市场走势，还是想再多了解一些信息，或者是资金安排上还没确定？您跟我说说，我帮您分析分析，您考虑起来也更有方向。」</p>
        
        <p class="call-sub-title">异议五："你是不是要推产品？"</p>
        <p class="call-wrong">❌ 错误：不是啊 / 我就是跟您聊聊 / 您怎么这么想</p>
        <p class="call-right">✅ 应对：「哈哈XX哥/姐，您这么说我就太冤枉了。我今天给您打电话，真的就是觉得这条消息挺重要的，想着跟您分享一下我的看法，让您多了解一些市场动态。至于要不要操作、买什么产品，完全看您自己的需求和意愿。您要是觉得有用，我就多跟您聊聊；您要是不想听，咱们就聊点别的。您放心，我从来不硬推产品。」</p>
        
        <p class="script-tip">💡 异议处理原则：先认同，再引导；用提问代替说教；给选项不给填空题</p>
      </div>
      
      <div class="call-section">
        <h4>⚠️ 合规提醒</h4>
        <ul>
          <li>全程不得使用"保本""稳赚""无风险"等违规表述</li>
          <li>必须做好风险揭示："以上只是我个人的看法，不构成投资建议，市场有风险，投资需谨慎"</li>
          <li>不要承诺收益，不要预测具体点位和涨跌</li>
          <li>先听客户说，再讲自己的观点，不要打断客户</li>
          <li>控制通话时长，5分钟左右为宜，太长容易引起反感</li>
          <li>如果客户情绪不好（比如亏钱了），先共情，再给建议</li>
        </ul>
      </div>
    `;
    
    phones.push({
      title: `${categoryName}热点：${shortTitle}`,
      html: html,
      plainText: generatePhonePlainText(title, categoryName, analysis, summary)
    });
  });
  
  return phones;
}

// 生成电话话术纯文本（用于复制功能）
function generatePhonePlainText(title, categoryName, analysis, summary) {
  return `【${categoryName}热点电话话术】\n\n` +
    `热点话题：${title}\n\n` +
    `【第一段：开场破冰】\n客户经理：XX哥/姐，您好！我是XX银行/券商的理财顾问小X。打扰您几分钟，现在方便说话吗？\n\n` +
    `【第二段：话题引入】\n客户经理：是这样的，今天看到一条${categoryName}方面的新闻——"${title}"，想着您平时也比较关注这块，就想跟您聊聊我对这件事的看法。\n\n` +
    `【第三段：热点解读】\n客户经理：核心内容是：${summary}\n三个关键点：\n1. ${analysis.depthPoints[0]}\n2. ${analysis.depthPoints[1]}\n3. ${analysis.depthPoints[2]}\n\n` +
    `【第四段：${analysis.depthTitle}】\n客户经理：从${categoryName}角度深入分析...\n\n` +
    `【第五段：投资建议】\n稳健型：${analysis.adviceConservative}\n积极型：${analysis.adviceAggressive}\n\n` +
    `【第六段：收尾促动】\n客户经理：今天就先跟您聊这些，有问题随时找我！再见~\n\n` +
    `【合规提醒】\n以上观点仅供参考，不构成投资建议。市场有风险，投资需谨慎。`;
}

// ============================================
// 热点资讯类 - 短视频口播（深度定制版）
// ============================================
function generateHotspotVideoScript(hotspots) {
  const videos = [];
  
  // 按分类差异化的解读内容
  const categoryVideo = {
    policy: {
      hookQuestion: '这条重磅政策出台，对你的钱袋子有什么影响？',
      impactText: '对普通人来说，政策红利期要学会顺势而为，但也要注意政策落地不及预期的风险',
      keyPoints: [
        '政策力度超预期，后续可能还有配套措施',
        '直接受益板块值得重点关注',
        '但要注意区分真受益和纯概念炒作'
      ]
    },
    market: {
      hookQuestion: '今天市场异动，是机会还是陷阱？30秒给你讲明白',
      impactText: '对普通投资者来说，最重要的是不要被市场情绪带着走，保持理性才是王道',
      keyPoints: [
        '当前是结构性行情，板块轮动快',
        '成交量和资金流向是关键指标',
        '追涨杀跌是亏钱的主要原因'
      ]
    },
    industry: {
      hookQuestion: '这个赛道突然火了！还能上车吗？理财经理说真话',
      impactText: '对普通人来说，选对赛道很重要，但更重要的是选对入场时机和方式',
      keyPoints: [
        '行业中长期逻辑通顺，景气度向上',
        '内部分化加剧，龙头更有优势',
        '短期涨幅过大，注意回调风险'
      ]
    },
    macro: {
      hookQuestion: '这个经济数据出炉，释放了什么信号？',
      impactText: '对普通人来说，读懂宏观趋势，才能更好地规划自己的资产配置',
      keyPoints: [
        '宏观经济是资本市场的大背景',
        '货币政策走向是关键变量',
        '海外风险也不能忽视'
      ]
    },
    stock: {
      hookQuestion: '这只股票突然大涨，能追吗？给你3个判断标准',
      impactText: '对普通投资者来说，个股投资风险大，没有研究能力的话建议通过基金参与',
      keyPoints: [
        '先看基本面，是不是有真实业绩支撑',
        '再看估值，好公司也要有好价格',
        '最后看仓位，单只股票不要超过总资产的10%'
      ]
    }
  };
  
  hotspots.slice(0, 2).forEach((hotspot, index) => {
    const category = hotspot.category || 'market';
    const videoTpl = categoryVideo[category] || categoryVideo.market;
    const title = hotspot.title || '';
    const summary = hotspot.summary || hotspot.content || '';
    const categoryName = hotspot.categoryName || '市场动态';
    const sourceName = hotspot.sourceName || '综合资讯';
    const shortTitle = title.length > 20 ? title.substring(0, 20) + '...' : title;
    
    // 3个备选标题
    const titles = [
      `${shortTitle}！对普通人有什么影响？`,
      `${categoryName}大事件！3个关键判断你必须知道`,
      `这条${categoryName}新闻刷屏了，理财经理怎么看？`
    ];
    
    // 话题标签
    const baseTags = ['#每日财经', '#投资理财', '#理财知识'];
    const categoryTags = {
      policy: ['#政策解读', '#宏观经济'],
      market: ['#A股', '#股市'],
      industry: ['#行业研究', '#投资机会'],
      macro: ['#宏观经济', '#经济周期'],
      stock: ['#股票', '#个股分析']
    };
    const extraTags = categoryTags[category] || categoryTags.market;
    const allTags = baseTags.concat(extraTags);
    
    const html = `
      <div class="video-section">
        <h4>📱 短视频口播稿（60秒版）</h4>
        <p class="video-label">📝 标题建议（3选1）：</p>
        <div class="video-titles">
          <p class="video-title">① ${titles[0]}</p>
          <p class="video-title">② ${titles[1]}</p>
          <p class="video-title">③ ${titles[2]}</p>
        </div>
      </div>
      
      <div class="video-section">
        <h4>🎤 口播正文（约60秒）</h4>
        <p class="video-script">
          <span class="video-time">[0-5s 黄金开头]</span><br>
          ${videoTpl.hookQuestion} 看完这条视频你就知道了！
        </p>
        <p class="video-script">
          <span class="video-time">[5-20s 引入话题]</span><br>
          今天${categoryName}圈最大的新闻就是——${shortTitle}。<br>
          来源是${sourceName}，简单说就是：${summary.length > 50 ? summary.substring(0, 50) + '...' : summary}
        </p>
        <p class="video-script">
          <span class="video-time">[20-40s 核心解读]</span><br>
          这件事我觉得有3个关键点：<br>
          第一，${videoTpl.keyPoints[0]}<br>
          第二，${videoTpl.keyPoints[1]}<br>
          第三，${videoTpl.keyPoints[2]}
        </p>
        <p class="video-script">
          <span class="video-time">[40-55s 影响分析]</span><br>
          对我们普通人来说意味着什么呢？<br>
          ${videoTpl.impactText}。<br>
          我的建议是：不要追高，分批布局，控制仓位，长期持有。
        </p>
        <p class="video-script">
          <span class="video-time">[55-60s 互动引导]</span><br>
          你怎么看这件事？评论区聊聊~<br>
          关注我，每天1分钟，带你看懂财经热点！
        </p>
      </div>
      
      <div class="video-section">
        <h4>🏷️ 文案配套</h4>
        <p class="video-caption">
          <strong>视频简介：</strong><br>
          ${titles[0]} 今天这条视频，1分钟给你讲明白${shortTitle}到底怎么回事，以及普通人该怎么应对。<br><br>
          <strong>话题标签：</strong>${allTags.join(' ')}
        </p>
      </div>
      
      <div class="video-section">
        <h4>💡 拍摄建议</h4>
        <ul>
          <li><strong>镜头/景别：</strong>开头用近景/特写，增强冲击力；中间可切中景，手势配合讲解；结尾回到近景，眼神接触</li>
          <li><strong>语速表情：</strong>语速稍快有节奏感，每分钟约180-200字；表情自然有感染力，关键处加重语气</li>
          <li><strong>字幕建议：</strong>全程加字幕，80%的人是静音看的；关键词用彩色/加粗突出；金句单独放大</li>
          <li><strong>背景音乐：</strong>轻快的财经类BGM，音量不要盖过人声；开头结尾音乐稍大，中间降低</li>
          <li><strong>封面建议：</strong>用有冲击力的标题+人脸特写；标题用问句或感叹句；色彩对比鲜明</li>
          <li><strong>发布时间：</strong>早7:30-8:30（通勤）、午12:00-13:00（午休）、晚20:00-22:00（睡前）是流量高峰</li>
        </ul>
      </div>
    `;
    
    videos.push({
      title: `${categoryName}热点口播：${shortTitle}`,
      html: html,
      plainText: generateVideoPlainText(titles, shortTitle, videoTpl, summary, allTags, sourceName)
    });
  });
  
  return videos;
}

// 生成视频脚本纯文本
function generateVideoPlainText(titles, shortTitle, videoTpl, summary, tags, sourceName) {
  return `【短视频口播稿】\n\n` +
    `标题推荐：\n1. ${titles[0]}\n2. ${titles[1]}\n3. ${titles[2]}\n\n` +
    `【0-5s 黄金开头】\n${videoTpl.hookQuestion} 看完这条视频你就知道了！\n\n` +
    `【5-20s 引入话题】\n今天最大的新闻就是——${shortTitle}。\n来源是${sourceName}，简单说就是：${summary}\n\n` +
    `【20-40s 核心解读】\n3个关键点：\n1. ${videoTpl.keyPoints[0]}\n2. ${videoTpl.keyPoints[1]}\n3. ${videoTpl.keyPoints[2]}\n\n` +
    `【40-55s 影响分析】\n对普通人意味着什么？\n${videoTpl.impactText}\n建议：不要追高，分批布局，控制仓位，长期持有。\n\n` +
    `【55-60s 互动引导】\n你怎么看？评论区聊聊~\n关注我，每天1分钟，带你看懂财经热点！\n\n` +
    `话题标签：${tags.join(' ')}`;
}

// ============================================
// 热点资讯类 - 新媒体文案（深度定制版）
// ============================================
function generateHotspotNewMedia(hotspots) {
  const medias = [];
  
  // 按分类差异化的深度内容
  const categoryMedia = {
    policy: {
      xhsHook: '姐妹们！这条重磅政策我刷到的时候整个人都惊了！',
      xhsPoints: [
        '政策力度真的超预期，感觉这次是动真格的了',
        '哪些行业会直接受益？我整理了几个方向',
        '普通人怎么抓住政策红利？给你几个实操建议',
        '风险提示：政策落地不及预期怎么办？'
      ],
      wxLogic: [
        '政策背景与核心内容解读',
        '对资本市场的影响路径分析',
        '受益行业与标的梳理'
      ],
      wxRisks: [
        '政策落地节奏和力度存在不确定性',
        '市场可能过度解读，短期波动加大',
        '部分概念股缺乏基本面支撑，需警惕炒作风险'
      ]
    },
    market: {
      xhsHook: '家人们！今天的市场真的太刺激了，心脏不好的慎入！',
      xhsPoints: [
        '今天市场为什么会这样？我给你捋捋原因',
        '哪些板块在领涨？哪些在跳水？',
        '现在是该抄底还是该跑路？我的真实想法',
        '给普通投资者的3个保命建议'
      ],
      wxLogic: [
        '市场异动的原因分析与资金面观察',
        '结构性机会与风险的辩证思考',
        '当前市场环境下的应对策略'
      ],
      wxRisks: [
        '市场短期波动加剧，操作难度加大',
        '板块轮动加快，追涨杀跌容易两头挨打',
        '量能不足可能制约行情持续性'
      ]
    },
    industry: {
      xhsHook: '姐妹们！这个赛道最近真的火到没朋友！但我劝你先别急着冲！',
      xhsPoints: [
        '这个行业为什么突然火了？底层逻辑是什么',
        '行业内部分化严重，哪些才是真龙头',
        '现在还能上车吗？我的建议是...',
        '投资这个赛道，一定要注意这几个坑'
      ],
      wxLogic: [
        '行业景气度上行的核心驱动因素',
        '产业链上下游的投资机会梳理',
        '竞争格局与龙头企业分析'
      ],
      wxRisks: [
        '短期涨幅过大，估值偏高，回调风险加大',
        '行业竞争加剧，利润率可能承压',
        '技术迭代风险，落后产能面临淘汰'
      ]
    },
    macro: {
      xhsHook: '宝子们！这个经济数据一出，我感觉方向越来越清晰了！',
      xhsPoints: [
        '数据背后的信号，经济到底在复苏还是放缓',
        '货币政策会怎么走？利率还会降吗',
        '对我们的钱袋子有什么直接影响',
        '普通人该怎么调整资产配置？'
      ],
      wxLogic: [
        '宏观经济数据深度解读',
        '政策走向预判与影响分析',
        '大类资产配置建议'
      ],
      wxRisks: [
        '经济复苏力度不及预期',
        '海外经济衰退风险传导',
        '政策调整的时间和力度存在不确定性'
      ]
    },
    stock: {
      xhsHook: '姐妹们！这只票最近涨疯了！但作为理财经理，我想说几句大实话...',
      xhsPoints: [
        '这家公司到底是做什么的？凭什么涨这么多',
        '基本面到底怎么样？是真金还是镀金',
        '现在还能买吗？给你3个判断标准',
        '个股投资的风险，90%的人都低估了'
      ],
      wxLogic: [
        '公司基本面与商业模式分析',
        '估值水平与安全边际评估',
        '投资价值与风险收益比测算'
      ],
      wxRisks: [
        '个股波动远大于大盘，风险集中度高',
        '业绩不及预期的风险',
        '行业政策与监管风险'
      ]
    }
  };
  
  hotspots.slice(0, 2).forEach((hotspot, index) => {
    const category = hotspot.category || 'market';
    const mediaTpl = categoryMedia[category] || categoryMedia.market;
    const title = hotspot.title || '';
    const summary = hotspot.summary || hotspot.content || '';
    const categoryName = hotspot.categoryName || '市场动态';
    const sourceName = hotspot.sourceName || '综合资讯';
    const shortTitle = title.length > 20 ? title.substring(0, 20) + '...' : title;
    
    // 小红书标题（3个备选）
    const xhsTitles = [
      `${shortTitle}！作为理财经理，我想说几句大实话`,
      `这条${categoryName}新闻刷屏！普通人该怎么办？理财经理掏心窝子`,
      `${categoryName}大事件！90%的人都理解错了`
    ];
    
    // 公众号标题（3个备选）
    const wxTitles = [
      `深度解读：${shortTitle}的影响与投资机会`,
      `${categoryName}热点追踪：${shortTitle}，后市怎么看？`,
      `从${shortTitle}说起，谈谈${categoryName}投资的逻辑与风险`
    ];
    
    // 小红书正文
    const xhsBody = `
${mediaTpl.xhsHook}

就是这条——"${title}"，来源${sourceName}。

作为一个在金融行业摸爬滚打了8年的理财经理，今天想跟姐妹们说几句掏心窝子的话👇

💛 先说说发生了什么
${summary}

💛 我的几点看法
1️⃣ ${mediaTpl.xhsPoints[0]}
2️⃣ ${mediaTpl.xhsPoints[1]}
3️⃣ ${mediaTpl.xhsPoints[2]}
4️⃣ ${mediaTpl.xhsPoints[3]}

💛 最后想说
投资这件事，真的急不来。
看到热点就想冲，是亏钱的开始。
先搞懂逻辑，再考虑要不要参与。
适合自己的，才是最好的。

❤️ 关注我，每天分享理财干货
有问题评论区留言，看到都会回~

#投资理财 #理财小白 #${category === 'policy' ? '政策解读' : category === 'industry' ? '行业研究' : category === 'macro' ? '宏观经济' : category === 'stock' ? '股票投资' : '股市分析'} #理财经理 #财富管理 #普通人理财 #${categoryName}
    `;
    
    // 公众号正文
    const wxBody = `
【事件回顾】

近日，${title}成为${categoryName}领域的关注焦点。${sourceName}报道称，${summary}

这一事件引发了市场的广泛讨论，我们来做一个深度的分析和解读。

【深度解读】

${mediaTpl.wxLogic[0]}

首先，我们需要理解这件事发生的背景和原因。从${categoryName}的角度来看，这不是一个孤立事件，而是大趋势下的一个缩影。${category === 'policy' ? '政策的出台往往有其深刻的经济背景和战略考量，需要放在更大的框架下来理解。' : category === 'industry' ? '行业的发展有其自身的规律，每一次重大事件都是行业格局重塑的契机。' : '市场波动背后都有其深层原因，理解了原因才能做出正确的判断。'}

${mediaTpl.wxLogic[1]}

其次，我们来分析这件事对投资的具体影响。从历史经验来看，${category === 'policy' ? '政策红利期往往会带来一波行情，但行情的持续性取决于政策落地的效果。' : category === 'industry' ? '高景气行业往往能跑出超额收益，但也要注意行业周期的位置。' : '市场短期波动不改变长期趋势，但会影响投资节奏和心态。'}投资者需要区分短期情绪影响和中长期基本面变化。

${mediaTpl.wxLogic[2]}

最后，我们来梳理一下具体的投资机会。建议投资者从以下几个维度去筛选：一是基本面扎实、业绩确定性强的龙头企业；二是估值合理、安全边际较高的标的；三是符合长期产业趋势、成长空间大的方向。

但同时也要注意以下风险点：
1. ${mediaTpl.wxRisks[0]}
2. ${mediaTpl.wxRisks[1]}
3. ${mediaTpl.wxRisks[2]}

【投资建议】

一、配置策略：均衡配置，稳中求进

建议投资者采用"核心+卫星"的配置思路。核心部分以稳健的价值蓝筹和固收+产品为主，作为组合的压舱石；卫星部分可以适度配置高景气方向，增强组合弹性。整体仓位根据个人风险承受能力来确定，不宜过度激进。

二、操作建议：不追高，逢低布局

对于当前热门方向，建议保持理性，不宜盲目追高。如果看好中长期逻辑，可以考虑通过定投的方式分批布局，既不错过机会，又能有效摊薄成本。同时，要设定好止盈止损纪律，严格执行。

三、风险提示

市场有风险，投资需谨慎。本文所提及的观点和分析仅供参考，不构成任何投资建议。投资者应根据自身的风险承受能力和投资目标，审慎做出投资决策。

【结语】

每一次热点事件，都是对投资者认知和心态的考验。有人看到的是机会，有人看到的是风险。重要的不是事件本身，而是我们如何去理解和应对。保持理性、坚守纪律、长期主义，才能在投资这条路上走得更远。

风险提示：以上观点仅供参考，不构成投资建议。市场有风险，投资需谨慎。
    `;
    
    const html = `
      <div class="media-section">
        <h4>📕 小红书风格文案</h4>
        <p class="media-label">✨ 标题建议（3选1）：</p>
        <div class="media-titles">
          <p class="media-title xhs">① ${xhsTitles[0]}</p>
          <p class="media-title xhs">② ${xhsTitles[1]}</p>
          <p class="media-title xhs">③ ${xhsTitles[2]}</p>
        </div>
        <p class="media-label">📝 正文内容：</p>
        <div class="media-body xhs-body">
          ${xhsBody.split('\n').map(line => line.trim() ? `<p>${line}</p>` : '').join('')}
        </div>
      </div>
      
      <div class="media-section">
        <h4>💚 公众号风格长文</h4>
        <p class="media-label">✨ 标题建议（3选1）：</p>
        <div class="media-titles">
          <p class="media-title wx">① ${wxTitles[0]}</p>
          <p class="media-title wx">② ${wxTitles[1]}</p>
          <p class="media-title wx">③ ${wxTitles[2]}</p>
        </div>
        <p class="media-label">📝 正文内容：</p>
        <div class="media-body wx-body">
          ${wxBody.split('\n').map(line => line.trim() ? `<p>${line}</p>` : '').join('')}
        </div>
      </div>
      
      <div class="media-section">
        <h4>💡 发布建议</h4>
        <ul>
          <li><strong>小红书：</strong>配图要精致（数据图、手写笔记图、氛围感自拍），开头要有钩子，结尾引导互动，善用话题标签增加曝光</li>
          <li><strong>公众号：</strong>标题要专业有深度，结构清晰有逻辑，排版整洁易读，文末必须加风险提示</li>
          <li><strong>最佳发布时间：</strong>早7-8点（通勤）、午12-13点（午休）、晚20-22点（睡前），结合热点时效性尽量快速发布</li>
          <li><strong>合规注意事项：</strong>不得承诺收益，必须加风险提示，避免"最""第一""必涨"等极限词，不推荐具体个股</li>
        </ul>
      </div>
    `;
    
    medias.push({
      title: `${categoryName}：${shortTitle}`,
      html: html,
      plainText: generateMediaPlainText(xhsTitles, wxTitles, xhsBody, wxBody),
      platform: '小红书+公众号'
    });
  });
  
  return medias;
}

// 生成新媒体文案纯文本
function generateMediaPlainText(xhsTitles, wxTitles, xhsBody, wxBody) {
  return `【新媒体文案 - 双平台版】\n\n` +
    `══════════════════════════\n` +
    `📕 小红书风格\n` +
    `══════════════════════════\n\n` +
    `标题推荐：\n1. ${xhsTitles[0]}\n2. ${xhsTitles[1]}\n3. ${xhsTitles[2]}\n\n` +
    `正文：\n${xhsBody.trim()}\n\n` +
    `══════════════════════════\n` +
    `💚 公众号风格\n` +
    `══════════════════════════\n\n` +
    `标题推荐：\n1. ${wxTitles[0]}\n2. ${wxTitles[1]}\n3. ${wxTitles[2]}\n\n` +
    `正文：\n${wxBody.trim()}\n\n` +
    `风险提示：以上观点仅供参考，不构成投资建议。市场有风险，投资需谨慎。`;
}

// ============================================
// 财商科普类 - 结合热点生成理财科普内容
// ============================================
function generateKnowledgeCopies(hotspots) {
  const copies = [];
  const knowledgePoints = [
    {
      keyword: '基金',
      title: '从热点聊基金',
      tag: '基金科普',
      intro: '【理财小知识】\n最近市场波动大，很多朋友问我基金怎么投。\n\n借今天这个热点，跟大家聊聊基金投资的三个常识：',
      points: [
        '不要追涨杀跌：基金适合长期持有，频繁操作只会增加成本',
        '分散投资：不要把鸡蛋放在一个篮子里，股债搭配更稳',
        '定投是普通人的神器：不用择时，摊薄成本，坚持就有效果'
      ],
      ending: '理财是一辈子的事，慢慢变富才是真的快。\n\n有基金方面的问题，欢迎私信交流～\n\n#基金理财 #财商科普 #投资理财'
    },
    {
      keyword: '股票|A股|沪指|创业板',
      title: '股市波动，普通人怎么办',
      tag: '股票知识',
      intro: '【财商科普】\n今天股市又上热搜了，很多朋友心慌慌。\n\n给普通投资者三个建议：',
      points: [
        '不要用急钱炒股：只用3-5年不用的闲钱投资',
        '不要加杠杆：杠杆放大收益的同时，也放大了风险',
        '不懂不投：如果看不懂一家公司，就别买它的股票'
      ],
      ending: '投资是认知的变现，先提升认知，再考虑收益。\n\n点赞收藏，投资路上少踩坑～\n\n#股票投资 #财商教育 #风险提示'
    },
    {
      keyword: '保险|保障|重疾|医疗',
      title: '从热点聊风险保障',
      tag: '保险科普',
      intro: '【理财小课堂】\n今天这个新闻让我感触很深，跟大家聊聊保险。\n\n很多人觉得保险是浪费钱，其实：',
      points: [
        '保险是兜底：万一出事，不至于把整个家庭拖垮',
        '先大人后小孩：大人是家里的顶梁柱，优先保障',
        '先保障后理财：保险是基础，基础打好了再谈投资'
      ],
      ending: '你永远不知道明天和意外哪个先来，提前做好准备。\n\n不知道怎么买保险？可以找我聊聊～\n\n#保险科普 #家庭保障 #理财规划'
    }
  ];
  
  // 根据热点内容匹配最合适的科普主题
  const allText = hotspots.map(h => (h.title || '') + (h.content || '')).join(' ');
  
  let selectedKnowledge = knowledgePoints[0]; // 默认第一个
  for (const kp of knowledgePoints) {
    const regex = new RegExp(kp.keyword, 'i');
    if (regex.test(allText)) {
      selectedKnowledge = kp;
      break;
    }
  }
  
  // 生成3个不同角度的文案
  const titles = ['为什么我说' + selectedKnowledge.title, selectedKnowledge.title + '，90%的人都搞错了', '一文读懂' + selectedKnowledge.title];
  const tags = [selectedKnowledge.tag, '干货分享', '理财入门'];
  
  for (let i = 0; i < 3; i++) {
    const kp = selectedKnowledge;
    let content = kp.intro + '\n\n';
    
    // 每个文案用不同的点组合
    const pointCount = i === 0 ? 3 : (i === 1 ? 2 : 3);
    for (let j = 0; j < pointCount; j++) {
      const emoji = ['💡', '📌', '⚠️'][j] || '✅';
      content += `${emoji} ${kp.points[(i + j) % kp.points.length]}\n`;
    }
    
    content += '\n' + kp.ending;
    
    copies.push({
      title: titles[i % titles.length],
      tag: tags[i % tags.length],
      content: content
    });
  }
  
  return copies;
}

function generateKnowledgePosters(hotspots) {
  return [
    { name: '基金科普海报', icon: '📊', gradient: 'daily-poster-1', text: '普通人的基金投资指南' },
    { name: '理财知识海报', icon: '💡', gradient: 'daily-poster-2', text: '这些理财误区你中招了吗' },
    { name: '财商思维海报', icon: '🧠', gradient: 'daily-poster-3', text: '理财就是理生活' }
  ];
}

function generateKnowledgeVideos(hotspots) {
  const h = hotspots[0] || { title: '市场波动' };
  return [
    {
      title: '热点里的理财知识',
      rows: [
        { label: '开头', text: '今天这个大热点，背后藏着一个重要的理财知识。' },
        { label: '知识', text: '记住一句话：别人恐惧我贪婪，别人贪婪我恐惧。' },
        { label: '解释', text: '市场越跌，越是定投的好时机；市场越疯，越要小心谨慎。' },
        { label: '结尾', text: '关注我，每天一个理财小知识。' }
      ]
    },
    {
      title: '普通人的理财误区',
      rows: [
        { label: '开头', text: '从' + (h.title || '今日热点').substring(0, 10) + '，聊聊普通人最容易犯的三个理财错误。' },
        { label: '错误1', text: '第一，追涨杀跌，看到涨了就买，看到跌了就卖。' },
        { label: '错误2', text: '第二，把鸡蛋放在一个篮子里，全仓一个方向。' },
        { label: '结尾', text: '点赞收藏，别再踩这些坑了。' }
      ]
    }
  ];
}

// ============================================
// 节日祝福类 - 结合日期和热点生成问候内容
// ============================================
function generateFestivalCopies(hotspots) {
  const copies = [];
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const weekDay = now.getDay();
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  
  const h = hotspots[0] || { title: '今日热点' };
  const hotTitle = (h.title || '').substring(0, 15);
  
  const templates = [
    {
      title: `${month}月${day}日 ${weekDays[weekDay]}早安`,
      tag: '每日问候',
      content: `【早安】☀️

${month}月${day}日，${weekDays[weekDay]}。

今天的市场，可能有波动，
但你的心情，不要跟着波动。

投资是场马拉松，
不在乎一天的涨跌，
只在乎长期的方向。

新的一天，新的开始，
保持好心态，慢慢变富。

祝你今天：
工作顺利，事事顺心！🚀

#早安 #${month}月你好 #投资理财`
    },
    {
      title: '周末愉快，聊聊生活',
      tag: '周末祝福',
      content: `【周末愉快】🌿

这周市场起起伏伏，
就像今天的热点：${hotTitle || '波澜不惊'}。

但我想说：
投资很重要，
但生活更重要。

周末了，
关掉K线，放下手机，
陪陪家人，看看风景。

会休息的人，
才会投资。

周末愉快！😌

#周末 #生活 #理财人生`
    },
    {
      title: '月末寄语',
      tag: '月度问候',
      content: `【月末总结】📅

这个月过得真快，
市场也发生了很多事：
${hotTitle || '有起有落'}...

但不管赚多赚少，
能在市场里活下来，
就已经赢了很多人。

下个月，
我们继续稳扎稳打，
慢慢变富。

你这个月收益怎么样？
评论区聊聊～

#月末总结 #理财 #投资心得`
    }
  ];
  
  // 根据星期几选择不同的模板
  if (weekDay === 0 || weekDay === 6) {
    // 周末用周末模板
    copies.push(templates[1]);
    copies.push(templates[0]);
    copies.push(templates[2]);
  } else if (day >= 25) {
    // 月末用月末模板
    copies.push(templates[2]);
    copies.push(templates[0]);
    copies.push(templates[1]);
  } else {
    // 工作日用早安模板
    copies.push(templates[0]);
    copies.push(templates[1]);
    copies.push(templates[2]);
  }
  
  return copies;
}

function generateFestivalPosters(hotspots) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  
  return [
    { name: '早安问候海报', icon: '☀️', gradient: 'daily-poster-1', text: `${month}月${day}日 新的一天` },
    { name: '周末祝福海报', icon: '🌿', gradient: 'daily-poster-2', text: '周末愉快 好好休息' },
    { name: '励志正能量海报', icon: '💪', gradient: 'daily-poster-3', text: '慢慢变富 未来可期' }
  ];
}

function generateFestivalVideos(hotspots) {
  const now = new Date();
  const weekDay = now.getDay();
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  
  return [
    {
      title: weekDays[weekDay] + '早安',
      rows: [
        { label: '开头', text: '早！新的一天开始了。' },
        { label: '问候', text: '不管今天市场怎么样，先把心情调整好。' },
        { label: '祝福', text: '祝你今天工作顺利，投资长红！' },
        { label: '结尾', text: '点赞收下这份好运吧～' }
      ]
    },
    {
      title: '周末温馨提醒',
      rows: [
        { label: '开头', text: '快周末了，别总盯着盘面。' },
        { label: '内容', text: '陪陪家人，看看书，运动一下，会休息的人才会投资。' },
        { label: '提醒', text: '记住：投资是为了更好的生活，别搞反了。' },
        { label: '结尾', text: '周末愉快！' }
      ]
    }
  ];
}

// ============================================
// 打造人设类 - 结合热点生成个人感悟内容
// ============================================
function generatePersonalCopies(hotspots) {
  const copies = [];
  const h = hotspots[0] || { title: '今日市场' };
  const hotTitle = (h.title || '').substring(0, 20);
  
  const templates = [
    {
      title: '做理财顾问的第N天',
      tag: '职场日常',
      content: `【工作日常】💼

今天又是忙碌的一天：

8:30 到公司，浏览隔夜外盘
9:00 晨会，讨论今日策略
10:00 见客户，解答${hotTitle || '市场'}相关问题
14:00 产品培训，持续充电
18:00 复盘，整理客户跟进记录

有人问我，
做理财顾问累不累？

说实话，累。
但每次帮客户解决了问题，
看到客户资产稳步增长，
就觉得一切都值得。

客户的信任，
就是我最大的动力。

你的工作是什么样的？
评论区聊聊～

#职场日常 #理财顾问 #工作分享`
    },
    {
      title: '从今天的热点想到的',
      tag: '个人感悟',
      content: `【入行感悟】

今天${hotTitle || '这个新闻'}刷屏了，
很多客户来问我怎么看。

做这行越久，越觉得：
📚 要不停学习新知识
💪 要扛得住市场压力
❤️ 要对得起客户信任

但我还是热爱这份工作，
因为能帮到很多人。

每一份信任，都是一份责任。

我是一名理财顾问，
我为自己的职业感到骄傲。

你热爱你的工作吗？

#职业感悟 #理财顾问 #正能量`
    },
    {
      title: '今日读书分享',
      tag: '学习成长',
      content: `【读书分享】📖

最近在重读《原则》，
结合今天的市场，又有新感悟。

分享三个我很认同的原则：
1️⃣ 痛苦+反思=进步
   每次亏损都是学习的机会
2️⃣ 拥抱现实，应对现实
   不要和市场对着干
3️⃣ 做到头脑极度开放
   承认自己不知道，才能进步

经典之所以是经典，
就是每次读都有新收获。

你最近在读什么书？
评论区推荐一下～

#读书 #成长 #投资理财`
    }
  ];
  
  return templates;
}

function generatePersonalPosters(hotspots) {
  return [
    { name: '职场日常海报', icon: '💼', gradient: 'daily-poster-1', text: '认真工作的人最帅气' },
    { name: '个人感悟海报', icon: '💭', gradient: 'daily-poster-2', text: '因为热爱 所以坚持' },
    { name: '读书分享海报', icon: '📖', gradient: 'daily-poster-3', text: '投资自己 永远不亏' }
  ];
}

function generatePersonalVideos(hotspots) {
  const h = hotspots[0] || { title: '市场' };
  
  return [
    {
      title: '理财顾问的一天',
      rows: [
        { label: '开头', text: '很多人好奇理财顾问一天都在干嘛，今天带大家看看。' },
        { label: '上午', text: '早上看盘、开晨会，然后就是见客户、做方案。' },
        { label: '下午', text: '下午培训、复盘，不断学习充电。' },
        { label: '结尾', text: '虽然忙，但能帮到客户就很开心。关注我，了解更多。' }
      ]
    },
    {
      title: '给年轻人的三个建议',
      rows: [
        { label: '开头', text: '作为理财顾问，给年轻人三个建议。' },
        { label: '建议', text: '第一，趁早理财，复利的威力你想象不到。第二，多学习，投资自己永远不亏。第三，别怕犯错，年轻就是最大的资本。' },
        { label: '鼓励', text: '加油，未来可期！' },
        { label: '结尾', text: '点赞收藏，一起成长。' }
      ]
    }
  ];
}

// 生成今日推荐内容
function generateDailyRecommend(direction, autoScroll) {
  const resultEl = document.getElementById('daily-result');
  const titleEl = document.getElementById('daily-result-title');
  
  if (!resultEl) return;
  
  // 显示结果区
  resultEl.style.display = 'block';
  
  // 标题映射
  const titleMap = {
    hotspot: '热点资讯类推荐',
    knowledge: '财商科普类推荐',
    festival: '节日祝福类推荐',
    personal: '打造人设类推荐'
  };
  titleEl.textContent = titleMap[direction] || '今日推荐';
  
  // 显示加载状态
  ['moments', 'chat', 'group', 'phone', 'video', 'media'].forEach(fmt => {
    const el = document.getElementById('daily-' + fmt + '-list');
    if (el) {
      el.innerHTML = `
        <div style="text-align:center;padding:40px;color:var(--text-secondary);">
          <div class="loading-spinner" style="margin:0 auto 12px;"></div>
          <span>正在生成今日素材...</span>
        </div>
      `;
    }
  });
  
  // 获取实时热点数据
  fetchHotspotDataOnly()
    .then(hotspots => {
      const topHotspots = hotspots.slice(0, 5);
      
      // 根据方向生成6种形式的内容
      const content = generateAllFormats(direction, topHotspots);
      
      // 渲染所有形式
      renderDailyMoments(content.moments);
      renderDailyChat(content.chat);
      renderDailyGroup(content.group);
      renderDailyPhone(content.phone);
      renderDailyVideoFormat(content.video);
      renderDailyMedia(content.media);
      
      // 缓存所有内容供复制使用
      window._dailyContent = content;
      
      // 滚动
      if (autoScroll !== false) {
        resultEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      
      showToast('已为您生成今日推荐素材');
    })
    .catch(() => {
      // 失败降级 - 用静态数据
      const data = DAILY_RECOMMEND_DATA[direction];
      if (data && data.copies) {
        const fallback = {
          moments: data.copies.map(c => ({ title: c.title, text: c.content, tag: c.tag })),
          chat: data.copies.map(c => ({ title: c.title, text: c.content, tag: c.tag })),
          group: data.copies.map(c => ({ title: c.title, text: c.content, tag: c.tag })),
          phone: [{ title: data.copies[0]?.title || '', rows: [{ label: '开场', text: '您好，今天想跟您聊聊最近的市场情况。' }, { label: '内容', text: data.copies[0]?.content || '' }, { label: '收尾', text: '有什么问题随时找我。' }] }],
          video: data.videos || [],
          media: data.copies.map(c => ({ title: c.title, content: c.content, tags: ['#理财', '#投资'] }))
        };
        renderDailyMoments(fallback.moments);
        renderDailyChat(fallback.chat);
        renderDailyGroup(fallback.group);
        renderDailyPhone(fallback.phone);
        renderDailyVideoFormat(fallback.video);
        renderDailyMedia(fallback.media);
      }
      showToast('已为您生成今日推荐素材');
    });
}

// ============================================
// 统一生成6种形式的内容
// ============================================
function generateAllFormats(direction, hotspots) {
  const result = {
    moments: [],  // 朋友圈图文
    chat: [],      // 私聊/群发
    group: [],     // 社群分享
    phone: [],     // 电话沟通
    video: [],     // 短视频口播
    media: []      // 新媒体文案
  };
  
  // 基础文案（不同方向用不同的生成函数
  let baseCopies = [];
  let basePosters = [];
  let baseVideos = [];
  
  switch (direction) {
    case 'hotspot':
      baseCopies = generateHotspotCopies(hotspots.slice(0, 3));
      basePosters = generateHotspotPosters(hotspots.slice(0, 3));
      baseVideos = generateHotspotVideos(hotspots.slice(0, 2));
      break;
    case 'knowledge':
      baseCopies = generateKnowledgeCopies(hotspots);
      basePosters = generateKnowledgePosters(hotspots);
      baseVideos = generateKnowledgeVideos(hotspots);
      break;
    case 'festival':
      baseCopies = generateFestivalCopies(hotspots);
      basePosters = generateFestivalPosters(hotspots);
      baseVideos = generateFestivalVideos(hotspots);
      break;
    case 'personal':
      baseCopies = generatePersonalCopies(hotspots);
      basePosters = generatePersonalPosters(hotspots);
      baseVideos = generatePersonalVideos(hotspots);
      break;
  }
  
  // 1. 朋友圈图文
  if (direction === 'hotspot' && hotspots && hotspots.length > 0) {
    // 热点资讯类：使用深度定制的朋友圈生成函数
    result.moments = generateHotspotMoments(hotspots);
  } else {
    // 其他方向：文案 + 海报组合
    baseCopies.forEach((copy, i) => {
      const poster = basePosters[i] || basePosters[0];
      result.moments.push({
        title: copy.title,
        text: copy.content,
        tag: copy.tag,
        poster: poster
      });
    });
  }
  
  // 2. 私聊/群发
  if (direction === 'hotspot' && hotspots && hotspots.length > 0) {
    // 热点资讯类：使用深度定制的私聊生成函数
    result.chat = generateHotspotChat(hotspots);
  } else {
    // 其他方向：更口语化的短文案
    baseCopies.forEach((copy, i) => {
      let chatText = copy.content;
      if (chatText.length > 200) {
        chatText = chatText.substring(0, 200) + '...';
      }
      result.chat.push({
        title: copy.title,
        text: chatText,
        tag: '适合私聊' + (i + 1)
      });
    });
  }
  
  // 3. 社群分享
  if (direction === 'hotspot' && hotspots && hotspots.length > 0) {
    // 热点资讯类：使用深度定制的社群分享生成函数
    result.group = generateHotspotGroup(hotspots);
  } else {
    // 其他方向：带引导互动的群分享文案
    baseCopies.forEach((copy, i) => {
      let groupText = '【今日分享】\n\n';
      groupText += copy.content.replace(/^【.*?】\n?/, '');
      groupText += '\n\n大家怎么看？欢迎群里交流～';
      result.group.push({
        title: copy.title,
        text: groupText,
        tag: '群分享' + (i + 1)
      });
    });
  }
  
  // 4. 电话沟通
  if (direction === 'hotspot' && hotspots && hotspots.length > 0) {
    // 热点资讯类：使用深度定制的电话沟通生成函数
    result.phone = generateHotspotPhone(hotspots);
  } else {
    // 其他方向：结构化的话术脚本
    baseCopies.slice(0, 2).forEach((copy, i) => {
      const lines = copy.content.split('\n').filter(l => l.trim());
      const phoneRows = [
        { label: '开场', text: '您好，我是XX理财顾问小X，今天方便聊两句吗？' },
        { label: '话题引入', text: '今天市场上' + (hotspots[i]?.title?.substring(0, 20) || '有个热点') + '挺火的，想跟您分享一下我的看法。' },
        { label: '核心观点', text: lines.slice(0, 3).join(' ') },
        { label: '建议', text: '我的建议是不用太慌，保持好仓位，有问题随时找我。' },
        { label: '收尾', text: '好的，那就不打扰您了，有问题随时联系。' }
      ];
      
      result.phone.push({
        title: copy.title + ' - 电话话术',
        rows: phoneRows
      });
    });
  }
  
  // 5. 短视频口播
  if (direction === 'hotspot' && hotspots && hotspots.length > 0) {
    // 热点资讯类：使用深度定制的短视频口播生成函数
    result.video = generateHotspotVideoScript(hotspots);
  } else {
    // 其他方向：使用基础视频
    result.video = baseVideos;
  }
  
  // 6. 新媒体文案 = 公众号/小红书风格
  if (direction === 'hotspot' && hotspots && hotspots.length > 0) {
    // 热点资讯类：使用深度定制的新媒体文案生成函数
    result.media = generateHotspotNewMedia(hotspots);
  } else {
    // 其他方向：基础新媒体文案
    baseCopies.forEach((copy, i) => {
      // 提取关键词做标签
      const tags = ['#理财', '#投资', '#财经', '#今日热点', '#知识分享'];
      // 根据内容添加相关标签
      if (copy.content.includes('基金')) tags.push('#基金');
      if (copy.content.includes('股票')) tags.push('#股票');
      if (copy.content.includes('保险')) tags.push('#保险');
      
      // 小红书风格：开头加emoji，结尾加标签
      let mediaContent = '💡 ' + copy.title + '\n\n';
      mediaContent += copy.content.replace(/^【.*?】\n?/, '');
      mediaContent += '\n\n' + tags.slice(0, 5).join(' ');
      
      result.media.push({
        title: copy.title,
        content: mediaContent,
        tags: tags.slice(0, 5),
        platform: i === 0 ? '小红书风格' : (i === 1 ? '公众号风格' : '朋友圈长文')
      });
    });
  }
  
  return result;
}

// ============================================
// 6种形式的渲染函数
// ============================================

// 1. 朋友圈图文
function renderDailyMoments(items) {
  const listEl = document.getElementById('daily-moments-list');
  if (!listEl) return;
  
  let html = '';
  const gradients = ['daily-poster-1', 'daily-poster-2', 'daily-poster-3'];
  
  items.forEach((item, index) => {
    const posterIcon = item.poster?.icon || '📰';
    const posterText = item.poster?.text || item.title;
    const posterGrad = gradients[index % gradients.length];
    
    html += `
      <div class="daily-moments-item">
        <div class="daily-moments-poster ${posterGrad}">
          <span style="font-size:36px">${posterIcon}</span>
          <div class="daily-moments-poster-text">${posterText.length > 12 ? posterText.substring(0, 12) + '...' : posterText}</div>
        </div>
        <div class="daily-moments-content">
          <div class="daily-moments-title">${item.title}</div>
          <div class="daily-moments-text">${item.text.replace(/\n/g, '<br>')}</div>
          <div class="daily-moments-footer">
            <button class="daily-material-btn" onclick="showToast('已收藏')"><i data-lucide="star"></i> 收藏</button>
            <button class="daily-material-btn primary" onclick="copyDailyContent('moments', ${index})"><i data-lucide="copy"></i> 复制文案</button>
          </div>
        </div>
      </div>
    `;
  });
  
  listEl.innerHTML = html;
  refreshIcons(listEl);
}

// 2. 私聊/群发
function renderDailyChat(items) {
  const listEl = document.getElementById('daily-chat-list');
  if (!listEl) return;
  
  let html = '';
  
  items.forEach((item, index) => {
    // 把内容拆成几条消息气泡
    const lines = item.text.split('\n').filter(l => l.trim());
    const bubbles = [];
    let currentBubble = '';
    
    lines.forEach(line => {
      if (currentBubble.length + line.length > 80 && currentBubble) {
        bubbles.push(currentBubble);
        currentBubble = line;
      } else {
        currentBubble += (currentBubble ? '\n' : '') + line;
      }
    });
    if (currentBubble) bubbles.push(currentBubble);
    
    let bubblesHtml = '';
    bubbles.forEach(b => {
      bubblesHtml += `<div class="daily-chat-bubble">${b.replace(/\n/g, '<br>')}</div>`;
    });
    
    html += `
      <div class="daily-chat-item">
        <div class="daily-chat-header">
          <div class="daily-chat-title">${item.title}</div>
          <span class="daily-chat-tag">${item.tag}</span>
        </div>
        ${bubblesHtml}
        <div class="daily-chat-footer">
          <button class="daily-material-btn" onclick="showToast('已收藏')"><i data-lucide="star"></i> 收藏</button>
          <button class="daily-material-btn primary" onclick="copyDailyContent('chat', ${index})"><i data-lucide="send"></i> 一键发送</button>
        </div>
      </div>
    `;
  });
  
  listEl.innerHTML = html;
  refreshIcons(listEl);
}

// 3. 社群分享
function renderDailyGroup(items) {
  const listEl = document.getElementById('daily-group-list');
  if (!listEl) return;
  
  let html = '';
  
  items.forEach((item, index) => {
    html += `
      <div class="daily-group-item">
        <div class="daily-group-header">
          <div class="daily-group-title">${item.title}</div>
          <span class="daily-group-tag">${item.tag}</span>
        </div>
        <div class="daily-group-content">${item.text.replace(/\n/g, '<br>')}</div>
        <div class="daily-group-footer">
          <button class="daily-material-btn" onclick="showToast('已收藏')"><i data-lucide="star"></i> 收藏</button>
          <button class="daily-material-btn primary" onclick="copyDailyContent('group', ${index})"><i data-lucide="share-2"></i> 复制分享</button>
        </div>
      </div>
    `;
  });
  
  listEl.innerHTML = html;
  refreshIcons(listEl);
}

// 4. 电话沟通
function renderDailyPhone(items) {
  const listEl = document.getElementById('daily-phone-list');
  if (!listEl) return;
  
  let html = '';
  
  items.forEach((item, index) => {
    // 支持深度定制的富HTML内容（热点资讯类）
    if (item.html) {
      html += `
        <div class="daily-phone-item daily-rich-item">
          <div class="daily-phone-header">
            <div class="daily-phone-title">${item.title}</div>
            <span class="daily-phone-tag">电话话术</span>
          </div>
          <div class="daily-phone-rich-content">
            ${item.html}
          </div>
          <div class="daily-phone-footer">
            <button class="daily-material-btn" onclick="showToast('已收藏')"><i data-lucide="star"></i> 收藏</button>
            <button class="daily-material-btn primary" onclick="copyDailyContent('phone', ${index})"><i data-lucide="copy"></i> 复制话术</button>
          </div>
        </div>
      `;
    } else {
      // 原有简单格式
      let rowsHtml = '';
      (item.rows || []).forEach(row => {
        rowsHtml += `
          <div class="daily-phone-row">
            <span class="daily-phone-label">${row.label}</span>
            <span class="daily-phone-text">${row.text}</span>
          </div>
        `;
      });
      
      html += `
        <div class="daily-phone-item">
          <div class="daily-phone-header">
            <div class="daily-phone-title">${item.title}</div>
            <span class="daily-phone-tag">电话话术</span>
          </div>
          <div class="daily-phone-script">
            ${rowsHtml}
          </div>
          <div class="daily-phone-footer">
            <button class="daily-material-btn" onclick="showToast('已收藏')"><i data-lucide="star"></i> 收藏</button>
            <button class="daily-material-btn primary" onclick="copyDailyContent('phone', ${index})"><i data-lucide="copy"></i> 复制话术</button>
          </div>
        </div>
      `;
    }
  });
  
  listEl.innerHTML = html;
  refreshIcons(listEl);
}

// 5. 短视频口播
function renderDailyVideoFormat(items) {
  const listEl = document.getElementById('daily-videoformat-list');
  if (!listEl) return;
  
  let html = '';
  
  items.forEach((item, index) => {
    // 支持深度定制的富HTML内容（热点资讯类）
    if (item.html) {
      html += `
        <div class="daily-videoformat-item daily-rich-item">
          <div class="daily-videoformat-header">
            <div class="daily-videoformat-icon">🎬</div>
            <div class="daily-videoformat-title">${item.title}</div>
          </div>
          <div class="daily-videoformat-rich-content">
            ${item.html}
          </div>
          <div class="daily-videoformat-footer">
            <button class="daily-material-btn" onclick="showToast('已收藏')"><i data-lucide="star"></i> 收藏</button>
            <button class="daily-material-btn primary" onclick="copyDailyContent('video', ${index})"><i data-lucide="copy"></i> 复制脚本</button>
          </div>
        </div>
      `;
    } else {
      // 原有简单格式
      let rowsHtml = '';
      (item.rows || []).forEach(row => {
        rowsHtml += `
          <div class="daily-videoformat-row">
            <span class="daily-videoformat-label">${row.label}</span>
            <span class="daily-videoformat-text">${row.text}</span>
          </div>
        `;
      });
      
      html += `
        <div class="daily-videoformat-item">
          <div class="daily-videoformat-header">
            <div class="daily-videoformat-icon">🎬</div>
            <div class="daily-videoformat-title">${item.title}</div>
          </div>
          <div class="daily-videoformat-script">
            ${rowsHtml}
          </div>
          <div class="daily-videoformat-footer">
            <button class="daily-material-btn" onclick="showToast('已收藏')"><i data-lucide="star"></i> 收藏</button>
            <button class="daily-material-btn primary" onclick="copyDailyContent('video', ${index})"><i data-lucide="copy"></i> 复制脚本</button>
          </div>
        </div>
      `;
    }
  });
  
  listEl.innerHTML = html;
  refreshIcons(listEl);
}

// 6. 新媒体文案
function renderDailyMedia(items) {
  const listEl = document.getElementById('daily-media-list');
  if (!listEl) return;
  
  let html = '';
  
  items.forEach((item, index) => {
    // 支持深度定制的富HTML内容（热点资讯类）
    if (item.html) {
      html += `
        <div class="daily-media-item daily-rich-item">
          <div class="daily-media-header">
            <div class="daily-media-title">${item.title}</div>
            <span class="daily-media-tag">${item.platform || '双平台'}</span>
          </div>
          <div class="daily-media-rich-content">
            ${item.html}
          </div>
          <div class="daily-media-footer">
            <button class="daily-material-btn" onclick="showToast('已收藏')"><i data-lucide="star"></i> 收藏</button>
            <button class="daily-material-btn primary" onclick="copyDailyContent('media', ${index})"><i data-lucide="copy"></i> 复制文案</button>
          </div>
        </div>
      `;
    } else {
      // 原有简单格式
      let tagsHtml = '';
      (item.tags || []).forEach(tag => {
        tagsHtml += `<span class="daily-media-tag-item">${tag}</span>`;
      });
      
      html += `
        <div class="daily-media-item">
          <div class="daily-media-header">
            <div class="daily-media-title">${item.title}</div>
            <span class="daily-media-tag">${item.platform || '新媒体'}</span>
          </div>
          <div class="daily-media-content">${(item.content || '').replace(/\n/g, '<br>')}</div>
          <div class="daily-media-tags">
            ${tagsHtml}
          </div>
          <div class="daily-media-footer">
            <button class="daily-material-btn" onclick="showToast('已收藏')"><i data-lucide="star"></i> 收藏</button>
            <button class="daily-material-btn primary" onclick="copyDailyContent('media', ${index})"><i data-lucide="copy"></i> 复制文案</button>
          </div>
        </div>
      `;
    }
  });
  
  listEl.innerHTML = html;
  refreshIcons(listEl);
}

// 统一复制函数
function copyDailyContent(format, index) {
  const content = window._dailyContent || {};
  const items = content[format] || [];
  const item = items[index];
  
  if (!item) return;
  
  let text = '';
  
  // 优先使用预生成的纯文本（深度定制内容）
  if (item.plainText) {
    text = item.plainText;
  } else if (format === 'moments' || format === 'chat' || format === 'group' || format === 'media') {
    text = item.text || item.content || '';
  } else if (format === 'phone' || format === 'video') {
    text = (item.rows || []).map(r => r.label + '：' + r.text).join('\n');
  }
  
  if (!text) {
    showToast('复制失败', 'warning');
    return;
  }
  
  const textarea = document.createElement('textarea');
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
  
  showToast('已复制到剪贴板');
}

// ============================================
// Tab 4: 素材工厂
// ============================================

// ============================================
// 素材工厂 - 内容生成函数
// ============================================

// 素材类型元数据配置
const MATERIAL_TYPE_CONFIG = {
  product: {
    name: '产品介绍',
    shortName: '产品速递',
    icon: '📦',
    tags: ['#理财推荐', '#资产配置', '#稳健投资', '#专业理财'],
    highlights: ['专业团队管理', '历史业绩稳健', '策略灵活攻守兼备'],
    targetAudience: '追求稳健收益、注重长期配置的投资者'
  },
  activity: {
    name: '活动信息',
    shortName: '活动预告',
    icon: '🎉',
    tags: ['#限时福利', '#理财活动', '#新客专享', '#福利放送'],
    highlights: ['专属福利力度大', '名额有限先到先得', '操作简单快速参与'],
    targetAudience: '希望获取额外收益和专属福利的客户'
  },
  morning: {
    name: '早报截图',
    shortName: '早报分享',
    icon: '📰',
    tags: ['#每日早报', '#财经资讯', '#市场解读', '#投资理财'],
    highlights: ['市场热点速递', '专业深度解读', '实用投资建议'],
    targetAudience: '关注市场动态、希望把握投资方向的投资者'
  },
  science: {
    name: '科普海报',
    shortName: '知识科普',
    icon: '📚',
    tags: ['#理财知识', '#投资科普', '#避坑指南', '#财商提升'],
    highlights: ['通俗易懂', '干货满满', '实用可操作'],
    targetAudience: '理财小白和希望系统学习理财知识的朋友'
  },
  festival: {
    name: '节日海报',
    shortName: '节日祝福',
    icon: '🎊',
    tags: ['#节日祝福', '#理财提醒', '#财富规划', '#美好生活'],
    highlights: ['温情祝福', '用心关怀', '理财小贴士'],
    targetAudience: '所有重视家庭财富规划的朋友'
  },
  personal: {
    name: '个人拍摄',
    shortName: '职场日常',
    icon: '📸',
    tags: ['#理财顾问的日常', '#金融从业者', '#职场分享', '#真实记录'],
    highlights: ['真实记录', '专业感悟', '有温度的理财'],
    targetAudience: '想了解理财顾问真实工作状态的朋友'
  }
};

// 标准化素材类型（兼容 HTML 中的 science/festival 和需求中的 education/holiday）
function normalizeMaterialType(type) {
  const typeMap = {
    'education': 'science',
    'holiday': 'festival',
    'science': 'science',
    'festival': 'festival',
    'product': 'product',
    'activity': 'activity',
    'morning': 'morning',
    'personal': 'personal'
  };
  return typeMap[type] || 'product';
}

// 获取素材配置
function getMaterialConfig(type) {
  const normType = normalizeMaterialType(type);
  return MATERIAL_TYPE_CONFIG[normType] || MATERIAL_TYPE_CONFIG.product;
}

// 从用户上传的文本中提取关键信息
function extractKeyInfo(text, type) {
  if (!text || text.trim() === '') return { summary: '', keyPoints: [] };
  
  const lines = text.split(/[\n。；;]/).filter(l => l.trim().length > 5);
  const summary = lines[0]?.trim().substring(0, 80) || '';
  const keyPoints = lines.slice(0, 5).map(l => l.trim().substring(0, 60)).filter(l => l.length > 10);
  
  return { summary, keyPoints };
}

// ========== 1. 朋友圈图文生成 ==========
function generateMaterialMoments(type, text, image) {
  const config = getMaterialConfig(type);
  const info = extractKeyInfo(text, type);
  const typeKey = normalizeMaterialType(type);
  
  let coreContent = '';
  let myOpinion = '';
  let goldenLine = '';
  
  switch(typeKey) {
    case 'product':
      coreContent = info.summary 
        ? info.summary 
        : `这款产品的三大亮点：\n1️⃣ ${config.highlights[0]}，平均从业经验超10年的专业团队掌舵\n2️⃣ ${config.highlights[1]}，穿越多轮牛熊周期验证\n3️⃣ ${config.highlights[2]}，进可攻退可守`;
      myOpinion = `作为理财顾问，我一直在帮客户筛选真正靠谱的产品。这款我自己也在定投，不是因为收益最高，而是因为它的稳健性和团队的专业性让我放心。对${config.targetAudience}来说，真的可以好好了解一下。`;
      goldenLine = '好的产品，时间会给你答案。';
      break;
      
    case 'activity':
      coreContent = info.summary
        ? info.summary
        : `🔥 专属福利来袭！\n📅 活动时间：限时开放，名额有限\n💎 福利内容：新客专享礼遇 + 专属收益加成\n🎁 参与方式：简单三步即可完成\n⏰ 提醒一句：好活动不等人，错过等半年！`;
      myOpinion = `每次有好活动我都会第一时间分享给大家，因为我知道很多朋友都在等这样的机会。这次的活动力度真的挺大的，名额也有限。有兴趣的朋友可以私信我，我帮你看看怎么参与最划算。`;
      goldenLine = '机会是留给有准备的人的，福利是留给行动快的人的。';
      break;
      
    case 'morning':
      coreContent = info.summary
        ? info.summary
        : `📊 今日市场看点：\n• 大盘走势：震荡整固，结构性机会延续\n• 热点板块：科技成长、消费复苏轮番表现\n• 资金动向：北向资金持续流入，机构加仓明显\n• 我的判断：短期波动不改中长期向好趋势`;
      myOpinion = `每天早上看盘、读研报、整理思路，已经成了习惯。市场每天都在变，但投资的底层逻辑不会变——选好标的，长期持有，忽略短期噪音。今天的分享希望对你有启发。`;
      goldenLine = '投资不是比谁赚得快，而是比谁走得远。';
      break;
      
    case 'science':
      coreContent = info.summary
        ? info.summary
        : `💡 今天科普一个很多人都搞混的概念：\n很多人以为"理财 = 买基金买股票"，其实不是的。\n理财是一个系统工程：\n✅ 现金流管理（赚多少钱、花多少钱）\n✅ 风险保障（保险配置，兜底）\n✅ 资产增值（投资，让钱生钱）\n✅ 财富传承（把钱留给想给的人）\n一步一步来，才是正确的打开方式。`;
      myOpinion = `经常有朋友上来就问"买什么能赚钱"，我都会先让他别急。理财是认知的变现，你对财富的理解有多深，你就能守住多少钱。今天分享的这个知识点，希望能帮你建立更完整的理财认知。`;
      goldenLine = '理财先理认知，投资先投自己。';
      break;
      
    case 'festival':
      coreContent = info.summary
        ? info.summary
        : `${config.icon} ${config.name}，愿每一份努力都有回响，每一个梦想都能开花。\n\n💝 在这个特别的日子里，除了祝福，还想分享一个小提醒：\n节日消费季，记得理性消费、合理规划。\n花该花的钱，存该存的钱，投资该投资的钱。\n钱包有底气，生活才有底气～`;
      myOpinion = `做理财顾问越久，越觉得理财理的不仅仅是钱，更是生活。节日的意义在于提醒我们珍惜身边的人，而理财的意义在于让我们有能力守护想守护的人。祝大家节日快乐，钱包鼓鼓，生活甜甜！`;
      goldenLine = '最好的礼物，是给家人一个确定的未来。';
      break;
      
    case 'personal':
      coreContent = info.summary
        ? info.summary
        : `今天又是充实的一天：\n🌅 早上7点到公司，先复盘市场\n📋 上午3个客户面谈，帮两位做了资产检视\n📚 中午抽时间读了两份研报\n💻 下午整理产品资料，准备下周的分享会\n🏃 晚上健身房打卡，身体是革命的本钱\n\n很多人以为理财顾问就是卖产品的，其实我们更多的是在做"财富管家"的事——帮客户把钱安排明白，让生活更有底气。`;
      myOpinion = `入行这么多年，越来越热爱这份工作。不是因为赚了多少钱，而是因为每次帮客户解决了问题、看到他们的笑容，那种成就感是真的棒。做一个有温度的理财人，继续加油！`;
      goldenLine = '把专业做到极致，把服务做到心里。';
      break;
  }
  
  const tagsLine = config.tags.join(' ');
  
  const html = `
    <p>【${config.shortName}】${config.icon}</p>
    <p>${coreContent.split('\n').map(line => line.trim() ? line : '').filter(l => l).join('<br>')}</p>
    <p>💡 我的看法：</p>
    <p>${myOpinion}</p>
    <p>✨ ${goldenLine}</p>
    <p>${tagsLine}</p>
    <p>—— 您身边的理财顾问</p>
  `;
  
  return html;
}

// ========== 2. 私聊/群发内容生成 ==========
function generateMaterialChat(type, text, image) {
  const config = getMaterialConfig(type);
  const info = extractKeyInfo(text, type);
  const typeKey = normalizeMaterialType(type);
  
  let intro = '';
  let points = [];
  let closing = '';
  let blessing = '';
  
  switch(typeKey) {
    case 'product':
      intro = `最近有好几位客户都在问我有没有稳健的产品推荐，想着您可能也感兴趣，就整理了一下发给您看看。`;
      points = [
        { title: '产品特点', detail: info.keyPoints[0] || `${config.highlights[0]}，由经验丰富的团队管理，投资风格稳健，注重风险控制，长期业绩在同类产品中表现靠前。` },
        { title: '为什么觉得适合您', detail: info.keyPoints[1] || `根据您之前跟我说的风险偏好和投资目标，我觉得这款产品的特点跟您的需求挺匹配的——既能追求一定的收益，又不会波动太大，拿得住、睡得着。` },
        { title: '怎么配置比较好', detail: info.keyPoints[2] || `建议可以作为您资产配置中的"稳健底仓"，占总资产的20%-30%左右。如果之前没配置过类似产品，可以先用一部分资金试试水，觉得合适再追加。` }
      ];
      closing = `您要是对这款产品感兴趣，或者想了解更多细节，随时找我聊~我可以根据您的具体情况，给您出个配置建议。`;
      blessing = `祝您投资顺利，生活愉快！`;
      break;
      
    case 'activity':
      intro = `有个好消息第一时间告诉您！我们最近推出了一个专属活动，福利力度挺大的，我觉得您可以了解一下。`;
      points = [
        { title: '活动亮点', detail: info.keyPoints[0] || `这次活动是专门为优质客户准备的，主要有几个福利：专属收益加成、新客礼遇、还有抽奖机会。整体算下来收益比平时高不少，还是挺划算的。` },
        { title: '对您的好处', detail: info.keyPoints[1] || `您正好有一笔资金快到期了，我觉得可以考虑参与这次活动。既不影响资金的流动性，又能多赚一些收益，相当于给您的钱包"加个餐"。` },
        { title: '怎么参与', detail: info.keyPoints[2] || `参与方式很简单，手机上操作几分钟就能搞定。不过名额有限，先到先得。您要是感兴趣，我把具体的参与方式和注意事项发给您，您看看合适就赶紧占个坑。` }
      ];
      closing = `活动时间有限，名额也不多，您要是有意向就尽早告诉我，我帮您留意着~有任何疑问随时问我。`;
      blessing = `祝您生活愉快，财源广进！`;
      break;
      
    case 'morning':
      intro = `今天的市场早报我看了，有几个重点想跟您分享一下，都是跟您的持仓可能相关的内容。`;
      points = [
        { title: '早报摘要', detail: info.keyPoints[0] || `昨天市场整体是震荡格局，沪指小幅波动，成交量维持在万亿水平。板块方面，科技成长表现相对活跃，消费板块有所调整，整体还是结构性行情。` },
        { title: '重点解读', detail: info.keyPoints[1] || `我觉得有两点值得关注：一是政策面继续释放积极信号，对市场情绪有支撑；二是北向资金持续流入，说明外资对A股中长期还是看好的。短期可能还有波动，但不用太悲观。` },
        { title: '给您的建议', detail: info.keyPoints[2] || `您手上的持仓我看了一下，整体配置还是比较均衡的，建议继续持有为主。如果手上有闲钱，可以考虑逢低加仓一些优质标的，但不要追高。有什么变动我会及时跟您沟通。` }
      ];
      closing = `以上就是我对今天早报的一些看法，供您参考。您要是对哪个方向特别感兴趣，或者对自己的持仓有什么疑问，随时找我聊~`;
      blessing = `祝您今天工作顺利，投资顺心！`;
      break;
      
    case 'science':
      intro = `最近跟很多客户聊天，发现大家对一些基础的理财概念还是有些混淆。今天整理了一个小知识点，发给您看看，说不定对您有帮助。`;
      points = [
        { title: '知识要点', detail: info.keyPoints[0] || `很多人搞不清"理财"和"投资"的区别。简单说：投资是理财的一部分，理财是更大的概念——包括赚钱、花钱、存钱、借钱、护钱（保险）、生钱（投资），是一个完整的体系。` },
        { title: '常见误区', detail: info.keyPoints[1] || `最常见的误区就是"我没钱，不用理财"。其实恰恰相反——正因为钱不多，才更需要理清楚每一分钱的去向，才能慢慢积累财富。理财不是富人的专利，是每个人的必修课。` },
        { title: '实操建议', detail: info.keyPoints[2] || `给您一个简单的入门方法：先记账，搞清楚钱从哪来、花到哪去；然后建立应急基金（3-6个月生活费）；再考虑配置保险；最后才是投资。按这个顺序来，不会错。` }
      ];
      closing = `理财知识都是日积月累的，不用急，慢慢来。您要是有什么不懂的，随时问我就行。我也会经常分享一些实用的小知识，帮您一起提升财商~`;
      blessing = `祝您财富稳步增长，生活越来越好！`;
      break;
      
    case 'festival':
      intro = `${config.icon} 快过节了，先提前祝您节日快乐！最近大家都在规划过节的事，我也想借着这个机会跟您聊两句。`;
      points = [
        { title: '节日问候', detail: info.keyPoints[0] || `过节是个好日子，不管是跟家人团聚还是出门旅游，都希望您能开开心心的。一年到头忙忙碌碌，也该趁这个机会好好放松一下，陪陪家人。` },
        { title: '暖心关怀', detail: info.keyPoints[1] || `每次过节我都会想到，我们这么努力工作、认真理财，最终的目的不就是为了让自己和家人过上更好的生活吗？所以啊，该花的钱要花，该享受的要享受，理财不是让我们当守财奴。` },
        { title: '顺势提个醒', detail: info.keyPoints[2] || `不过还是想温馨提醒一下：节日消费要理性，不要冲动消费。另外，过节期间市场休市，资金安排要提前规划好。您要是有资金方面的安排，提前跟我说，我帮您规划。` }
      ];
      closing = `节假期间如果您有任何理财方面的问题，随时给我发消息，我看到就会回复您~`;
      blessing = `祝您节日快乐，阖家幸福，万事如意！`;
      break;
      
    case 'personal':
      intro = `最近工作中有一些感悟，觉得挺有价值的，想分享给您听听，也许对您会有些启发。`;
      points = [
        { title: '最近的感悟', detail: info.keyPoints[0] || `这段时间跟很多客户交流，发现一个有意思的现象：越是投资做得好的人，心态越平和，不追热点、不频繁操作，反而是那些天天盯着盘面的人，收益往往不太理想。这让我更加坚信长期主义的力量。` },
        { title: '分享给您', detail: info.keyPoints[1] || `其实不光是投资，做任何事情都是这样——找到正确的方向，然后坚持下去，时间会给你回报。您也是这样，一直都很有规划，不盲从、不焦虑，我觉得这就是投资中最宝贵的品质。` },
        { title: '与您共勉', detail: info.keyPoints[2] || `做理财顾问这么多年，我最大的收获不是业绩有多好，而是认识了很多像您这样优秀的客户，从你们身上学到了很多。以后我们继续一起成长，一起把日子越过越好！` }
      ];
      closing = `这些都是我工作中的真实感受，跟您分享一下。您要是有什么想法或者感悟，也欢迎随时跟我交流，互相学习~`;
      blessing = `祝您工作顺利，生活愉快，财源滚滚！`;
      break;
  }
  
  let pointsHtml = '';
  const icons = ['1️⃣', '2️⃣', '3️⃣'];
  points.forEach((p, i) => {
    pointsHtml += `<p>${icons[i]} <strong>${p.title}</strong></p><p>　　${p.detail}</p>`;
  });
  
  const html = `
    <p>XX哥/姐，您好~</p>
    <p>${intro}</p>
    ${pointsHtml}
    <p>${closing}</p>
    <p>${blessing}</p>
  `;
  
  return html;
}

// ========== 3. 社群分享内容生成 ==========
function generateMaterialGroup(type, text, image) {
  const config = getMaterialConfig(type);
  const info = extractKeyInfo(text, type);
  const typeKey = normalizeMaterialType(type);
  
  let opening = '';
  let keyPoints = [];
  let deepDive = '';
  let topic = '';
  let pollOptions = [];
  
  switch(typeKey) {
    case 'product':
      opening = `各位群友好！今天给大家带来一款近期关注度很高的产品，很多群友都在问，整理了一下跟大家分享~`;
      keyPoints = [
        info.keyPoints[0] || '产品背景：头部机构出品，专业团队管理，运作时间超过5年，历经多轮市场考验',
        info.keyPoints[1] || '业绩表现：长期业绩稳健，最大回撤控制优秀，同类排名靠前',
        info.keyPoints[2] || '适合人群：追求稳健收益、投资期限1年以上、能承受中等波动的投资者'
      ];
      deepDive = `很多朋友会问：市面上那么多产品，为什么特别推荐这一款？我的答案是：因为它"稳"。在当前市场环境下，稳比什么都重要。这款产品的投资策略是"固收+"打底，权益部分增强，既不会像纯债那样收益有限，也不会像纯股那样波动剧烈。对于大多数普通投资者来说，这种"中庸之道"反而是最优解。`;
      topic = '你买理财产品最看重什么？';
      pollOptions = ['收益率高低', '风险控制能力', '基金经理/团队', '品牌和服务'];
      break;
      
    case 'activity':
      opening = `各位群友好！今天有个好消息要告诉大家——我们的专属福利活动来了！力度空前，错过等一年~`;
      keyPoints = [
        info.keyPoints[0] || '活动内容：新客专享收益加成 + 专属抽奖机会 + 邀请好友额外福利',
        info.keyPoints[1] || '参与条件：符合条件的新老客户均可参与，操作简单，手机上几分钟搞定',
        info.keyPoints[2] || '时间提醒：活动限时开放，名额有限，先到先得，满额即止'
      ];
      deepDive = `有朋友可能会问：这种活动靠谱吗？会不会有什么坑？我在这里跟大家交个底——活动是官方推出的，绝对正规靠谱。为什么要做活动？说白了就是获客成本的问题，与其把钱花在广告上，不如直接让利给客户，大家得实惠，我们也能积累优质客户，双赢。所以不用犹豫，符合条件的朋友赶紧参与就对了！`;
      topic = '你参加理财活动最看重什么？';
      pollOptions = ['收益加成力度', '参与门槛高低', '操作是否方便', '安全性保障'];
      break;
      
    case 'morning':
      opening = `各位群友早上好！新的一天开始了，先来看看今天的市场早报有哪些重点~ ☀️`;
      keyPoints = [
        info.keyPoints[0] || '市场回顾：昨日A股震荡整理，沪指微跌，创业板指小幅收涨，两市成交量维持万亿水平',
        info.keyPoints[1] || '热点板块：AI、半导体等科技方向表现活跃，新能源、消费板块有所调整',
        info.keyPoints[2] || '资金动向：北向资金小幅净流入，主力资金青睐科技成长方向'
      ];
      deepDive = `今天想跟大家聊一个话题：为什么"震荡市"反而是布局的好时机？很多人喜欢单边上涨的行情，觉得买什么都涨，很爽。但实际上，震荡市才是真正考验投资能力的时候——它能让你以更合理的价格买到优质标的，也能帮你磨练心态。真正的投资高手，都是在震荡中悄悄布局，在上涨中收获果实。所以面对当前的震荡行情，不用焦虑，好好选股、耐心持有，时间会给你答案。`;
      topic = '你认为接下来市场会怎么走？';
      pollOptions = ['继续震荡上行', '还会调整探底', '维持震荡格局', '说不准，走一步看一步'];
      break;
      
    case 'science':
      opening = `各位群友好！又到了每周的理财小课堂时间，今天聊一个很基础但很多人都没搞懂的话题~ 📚`;
      keyPoints = [
        info.keyPoints[0] || '知识科普：什么是资产配置？简单说就是"不要把鸡蛋放在一个篮子里"，把钱分到不同类型的资产中',
        info.keyPoints[1] || '常见误区：很多人以为资产配置就是"买很多产品"，其实不然——关键是资产之间的相关性要低，才能真正分散风险',
        info.keyPoints[2] || '实操方法：标准普尔家庭资产象限图——10%日常开销、20%保命保障、30%增值投资、40%稳健养老'
      ];
      deepDive = `为什么资产配置这么重要？我给大家讲一个真实的例子：2008年金融危机的时候，那些全仓股票的人亏损超过50%，而做好资产配置的人，亏损可能只有10%-20%，甚至有的组合因为配置了债券和黄金，反而赚钱了。这就是资产配置的力量——它不能让你赚最多的钱，但能让你在最坏的情况下活得最久。投资是一场马拉松，活到最后才是赢家。`;
      topic = '你的资产配置中，占比最高的是？';
      pollOptions = ['银行存款/理财', '基金/股票', '房产', '保险'];
      break;
      
    case 'festival':
      opening = `各位群友好！节日将至，先在这里祝大家节日快乐！🎊 今天的分享有点不一样，不聊产品，聊点心里话~`;
      keyPoints = [
        info.keyPoints[0] || '节日话题：节日的意义不在于消费多少，而在于和谁在一起、有没有留下美好的回忆',
        info.keyPoints[1] || '理财提醒：节日消费要理性，提前做好预算，避免"节后吃土"；另外注意资金安排，节前节后理财收益不要断档',
        info.keyPoints[2] || '财富感悟：我们努力赚钱、认真理财，最终都是为了更好的生活。节日就是让我们停下来，感受生活的美好'
      ];
      deepDive = `做理财顾问越久，越觉得理财的本质是生活。很多人把理财和生活对立起来，觉得理财就是省钱、就是抠门，其实完全不是。真正的理财是让钱为生活服务——该花的钱大胆花，不该花的钱不浪费，该存的钱好好存，该投资的钱科学投。这样，你的钱包会越来越鼓，生活也会越来越好。节日里，好好享受生活，节后，我们继续一起打理财富！`;
      topic = '节日期间你最想做的事是？';
      pollOptions = ['陪伴家人', '出门旅游', '宅家休息', '充电学习'];
      break;
      
    case 'personal':
      opening = `各位群友好！今天换个风格，不聊产品不聊市场，跟大家聊聊我作为理财顾问的真实工作日常~ 💼`;
      keyPoints = [
        info.keyPoints[0] || '从业者视角：很多人以为理财顾问就是"卖产品的"，其实我们的工作更多是倾听、分析、规划——帮客户把钱安排明白',
        info.keyPoints[1] || '行业观察：这个行业正在从"产品销售"向"财富管理"转型，真正专业、用心的顾问会越来越值钱，靠忽悠的迟早被淘汰',
        info.keyPoints[2] || '个人感悟：做这份工作最大的成就感，不是业绩有多好，而是客户说一句"谢谢你，帮了我大忙"'
      ];
      deepDive = `今天想跟大家聊聊：一个好的理财顾问，到底能给你带来什么？我总结了三点：第一，节省你的时间——市场上几千只产品，你不需要一只一只去研究，我帮你筛选；第二，控制你的情绪——市场大涨大跌的时候，有人帮你冷静分析，避免追涨杀跌；第三，规划你的人生——买房、育儿、养老，这些大事都需要钱，一个好顾问能帮你提前规划，从容应对。这就是我努力的方向：做一个真正有价值的理财顾问。`;
      topic = '你心目中理想的理财顾问是什么样的？';
      pollOptions = ['专业能力强', '服务态度好', '站在客户角度', '经验丰富'];
      break;
  }
  
  let pointsHtml = '';
  const icons = ['①', '②', '③'];
  keyPoints.forEach((p, i) => {
    pointsHtml += `<p>${icons[i]} ${p}</p>`;
  });
  
  let pollHtml = '';
  const pollLabels = ['A', 'B', 'C', 'D'];
  pollOptions.forEach((opt, i) => {
    pollHtml += `<p>${pollLabels[i]}. ${opt}</p>`;
  });
  
  const html = `
    <p>【${config.shortName} · 社群分享】${config.icon}</p>
    <p>${opening}</p>
    <p>📌 核心要点：</p>
    ${pointsHtml}
    <p>💡 深度解读：</p>
    <p>${deepDive}</p>
    <p>💬 今日互动话题：</p>
    <p>${topic}</p>
    ${pollHtml}
    <p>欢迎在群里聊聊你的看法~ 有任何理财疑问也可以随时@我，我会一一解答！</p>
    <p>—————————</p>
    <p>风险提示：以上观点仅供参考，不构成投资建议。市场有风险，投资需谨慎。</p>
  `;
  
  return html;
}

// ========== 4. 电话沟通话术生成 ==========
function generateMaterialPhone(type, text, image) {
  const config = getMaterialConfig(type);
  const info = extractKeyInfo(text, type);
  const typeKey = normalizeMaterialType(type);
  
  let sections = {};
  let objections = [];
  let complianceTips = [];
  
  switch(typeKey) {
    case 'product':
      sections = {
        opening: '「XX哥/姐，您好！我是XX银行/券商的小X。打扰您几分钟，方便说话吗？」',
        intro: `「是这样的，最近我们这边有一款产品关注度特别高，我自己也研究了一下，觉得挺不错的。想着您之前也跟我说过想找一些稳健的投资方向，就给您打个电话，简单跟您介绍一下。」`,
        core: `「简单跟您说下这款产品的情况啊。首先，它是由我们头部机构的专业团队管理的，团队平均从业经验都在10年以上，经历过好几轮牛熊，投资经验很丰富。其次呢，它的投资策略是"固收+"的思路，大部分资金配置稳健的债券类资产，小部分参与权益市场，所以波动相对可控，收益也有弹性。第三，从历史业绩来看，表现还是挺稳健的，最大回撤控制得也不错，同类产品里排名靠前。」`,
        deep: `「您可能会问，市面上那么多产品，为什么特别推荐这一款？我跟您说实话，不是因为它收益最高，而是因为它"靠谱"。我给客户推荐产品，首先看的是风险控制，其次才是收益。这款产品的团队风格我比较了解，很稳，不激进，我觉得这一点特别重要。而且当前市场环境下，配置一些稳健型的产品打底，我觉得是很有必要的。」`,
        advice: `「说到您这边啊，我觉得您可以考虑拿一部分资金配置这款产品，作为您资产组合里的"压舱石"。具体比例的话，建议在20%-30%左右，根据您的风险偏好可以适当调整。您要是感兴趣，我把详细的产品资料发给您看看，您先了解一下，有什么问题随时问我。」`,
        closing: '「行，那今天就先跟您简单聊这些，不耽误您时间了。我稍后把产品资料发给您，您先看看。有什么想法或者问题，随时给我打电话。那您先忙，再见~」'
      };
      objections = [
        { title: '"我对这款产品不了解，不敢买"', wrong: '放心买吧，没问题的 / 很多客户都买了 / 不会亏的', right: '「XX哥/姐，您有顾虑太正常了，毕竟是自己的钱，谨慎一点是好事。我也不建议您听我几句话就买。这样，我先把产品的详细资料和历史业绩发给您，您先好好看看，有不懂的地方随时问我。等您了解清楚了，再决定买不买，好不好？」' },
        { title: '"收益太低了，不如我自己炒股"', wrong: '炒股风险大 / 你不一定能赚到 / 还是买我们的产品好', right: '「XX哥/姐，您炒股能力强是好事，现在市场确实有不少机会。不过我想跟您分享一个思路：资产配置讲究"攻守兼备"，您可以拿一部分钱自己炒，享受投资的乐趣和高收益的可能；另一部分钱配置一些稳健的产品，做个打底。这样即使市场不好，您的整体组合也不会亏太多，进可攻退可守，您觉得呢？」' },
        { title: '"我再考虑考虑"', wrong: '还考虑啥呀 / 错过就没了 / 赶紧买吧', right: '「没问题XX哥/姐，考虑是应该的，毕竟投资这种事，慎重一点没错。不过我想跟您确认一下，您主要是在考虑哪方面呢？是担心风险，还是觉得收益不够，或者是资金安排的问题？您跟我说说，我帮您分析分析，您考虑起来也更有方向。」' },
        { title: '"现在行情不好，先不投了"', wrong: '现在行情很好啊 / 不会跌的 / 放心买吧', right: '「XX哥/姐，我特别理解您的想法。最近市场波动确实比较大，很多人都有顾虑。不过我想跟您说的是，市场行情好坏是常态，没有人能精准预测。如果您是长期投资的话，其实不用太在意短期的涨跌。而且这款产品是稳健型的，波动本身就不大，即使市场不好，影响也有限。您觉得呢？」' },
        { title: '"我没钱 / 钱都在别的地方"', wrong: '没钱怎么行 / 您这么有钱怎么会没钱 / 那您什么时候有钱', right: '「哈哈XX哥/姐，我特别理解，现在大家资金都挺紧张的。其实呢，理财不是说一定要拿很多钱出来，哪怕先少投一点，养成一个习惯也是好的。而且这款产品门槛也不高，您可以先用小部分资金试试，觉得合适再追加。您觉得呢？」' }
      ];
      break;
      
    case 'activity':
      sections = {
        opening: '「XX哥/姐，您好！我是XX银行/券商的小X。打扰您几分钟，方便说话吗？」',
        intro: '「是这样的，我们最近推出了一个专属客户福利活动，力度挺大的，名额也有限。想着您是我们的优质客户，第一时间通知您一下，看看您有没有兴趣参与。」',
        core: '「简单跟您说下活动内容啊。首先，新开户或者新申购的客户，可以享受专属的收益加成，比平时的收益高不少；其次，参与活动还有机会参与抽奖，奖品挺丰富的；第三，如果您邀请朋友一起参与，还能额外获得邀请奖励。整体算下来，福利力度还是挺大的。」',
        deep: '「您可能会想，这么好的活动，会不会有什么套路？我跟您交个底，真没有。为什么做这个活动呢？说白了就是获客，与其把钱花在打广告上，不如直接让利给客户，大家得实惠，我们也能积累优质客户，双赢。而且活动都是官方推出的，绝对正规靠谱，这个您放心。」',
        advice: '「说到您这边啊，我记得您有一笔理财快到期了对吧？我觉得正好可以赶上这次活动。您到期的资金可以直接参与，既不影响流动性，又能多赚一些收益，相当于给您的资金"加个餐"。您要是感兴趣，我把具体的参与方式和注意事项发给您。」',
        closing: '「行，那活动的事我就先跟您说这些。名额有限，您要是有意向就尽早告诉我，我帮您留意着。稍后我把详细资料发给您，您先看看。有问题随时找我，再见~」'
      };
      objections = [
        { title: '"这种活动都是套路吧"', wrong: '不是套路，真的 / 您放心参加 / 不会坑您的', right: '「XX哥/姐，您有这个想法太正常了，现在市面上各种活动确实鱼龙混杂。我跟您保证，这次活动是我们官方推出的，所有规则都是透明的，没有任何隐藏条款。您要是不放心，我把活动的详细规则发给您，您仔细看看，觉得靠谱再参加，好不好？」' },
        { title: '"太麻烦了，不想弄"', wrong: '不麻烦啊，很简单的 / 几分钟就搞定了 / 您试试就知道了', right: '「我懂我懂，XX哥/姐您平时工作忙，最怕麻烦了。其实参与方式特别简单，手机上操作几分钟就能搞定。您要是方便的话，现在花两分钟，我在电话里一步一步教您弄，很快就好。您看行吗？」' },
        { title: '"我再想想"', wrong: '还想啥呀 / 名额快没了 / 赶紧参加吧', right: '「没问题XX哥/姐，您先考虑着。不过有个事得跟您说一下，这次活动名额有限，先到先得，满了就截止了。您要是有意向的话，尽量早点决定，别到时候名额没了可惜。这样，我先帮您留意着，有名额我第一时间告诉您。」' },
        { title: '"收益也没高多少，不值得"', wrong: '还不高啊 / 已经很高了 / 您还想要多高', right: '「XX哥/姐，您说的也对，单看收益率的话，确实不是特别夸张。但您想啊，这是在稳健产品基础上的额外收益，几乎没什么额外风险，相当于白捡的。而且如果您的资金量比较大的话，算下来其实也不少呢。苍蝇腿也是肉嘛，您说对吧？」' },
        { title: '"我资金不在你们这，参加不了"', wrong: '那您转过来啊 / 转过来就能参加了 / 很方便的', right: '「没关系XX哥/姐，理解理解。不过我倒是觉得，如果您有资金近期到期或者有闲置资金的话，转过来参加个活动，赚一笔额外收益，也是挺划算的。您要是感兴趣，我跟您说说怎么操作最方便，您可以考虑考虑。」' }
      ];
      break;
      
    case 'morning':
      sections = {
        opening: '「XX哥/姐，早上好！我是XX银行/券商的小X。打扰您几分钟，方便说话吗？」',
        intro: '「是这样的，今天早上看了市场早报，有几个重要的信息我觉得跟您的持仓可能相关，想着给您打个电话，简单聊聊最新的市场情况和我的看法。」',
        core: '「简单说下今天的盘面啊。昨天A股整体是震荡格局，沪指小幅波动，成交量维持在万亿水平。板块方面，科技成长方向表现比较活跃，消费和新能源有所调整。消息面上，政策面继续释放积极信号，对市场情绪有支撑。您手上的持仓呢，我也大概看了一下，整体配置还是比较均衡的，短期波动不用太担心。」',
        deep: '「关于后市，我个人是这么看的：短期可能还会有震荡，毕竟市场情绪的修复需要时间。但从中长期来看，我还是比较乐观的——经济在逐步复苏，政策面也在持续发力，估值也不贵，这些都是支撑市场的积极因素。所以我的建议是：不要被短期波动影响心态，优质标的继续持有，逢低可以加仓。」',
        advice: '「说到您这边的具体操作啊，我有两个小建议供您参考：第一，您手上那些基本面扎实、估值合理的标的，继续拿着就行，不用折腾；第二，如果手上有闲钱，可以考虑分批加仓一些优质方向，但不要追高，逢低布局。您要是对哪个方向特别感兴趣，或者对某个持仓有疑问，咱们可以详细聊聊。」',
        closing: '「行，那今天就先跟您简单聊这些，不耽误您时间了。市场有什么重要变化我会及时跟您沟通的。您要是有任何问题，随时给我打电话。那您先忙，再见~」'
      };
      objections = [
        { title: '"最近亏了不少，不想看了"', wrong: '没事，很快就涨回来了 / 别灰心 / 会好的', right: '「XX哥/姐，我特别理解您的感受，亏钱的滋味确实不好受，换作是我也会不舒服。不过我想跟您说的是，市场波动是正常的，没有只涨不跌的市场，也没有只跌不涨的市场。您手上的持仓我看过，基本面都没问题，只是短期受市场情绪影响。这个时候割肉就真的亏了，再坚持坚持，等市场回暖，大概率能回来的。」' },
        { title: '"你说市场会涨，万一跌了怎么办"', wrong: '不会跌的 / 肯定会涨 / 您放心吧', right: '「XX哥/姐，您这个问题问得特别好，也特别实在。说实话，没有人能准确预测市场明天是涨是跌，我也不能。我刚才说的是我个人基于目前的信息做出的判断，不代表市场一定就会这么走。所以我一直强调，投资要做好风险控制，仓位要合理，要用闲钱投资。这样即使市场短期下跌，您也能扛得住，不会被迫割肉。」' },
        { title: '"我还是等行情好了再投吧"', wrong: '等行情好就晚了 / 现在就是好时机 / 别等了', right: '「XX哥/姐，很多人都跟您一样的想法，想等行情好了再进场。但事实是，等大家都觉得行情好的时候，往往已经涨了一大截了，这时候进去反而容易追高。真正赚钱的人，都是在别人恐惧的时候悄悄布局的。当然，我也不是说现在就一定要满仓干，可以分批建仓，慢慢来，您觉得呢？」' },
        { title: '"跟我说这些，是不是想让我买产品"', wrong: '不是不是 / 您别误会 / 我就是跟您聊聊', right: '「XX哥/姐，您有这个想法我完全理解，可能之前遇到过太多推销的了。我跟您说实话，作为理财顾问，我当然希望您能通过我做投资，这是我的工作。但更重要的是，我希望我们之间能建立信任。今天给您打这个电话，主要是想跟您分享一下市场信息，至于怎么操作，完全由您决定。您觉得我分析的有道理，可以参考；觉得没道理，就当听个乐呵。您看行吗？」' },
        { title: '"我没时间聊这些"', wrong: '很快的，就几分钟 / 您再听我说说 / 很重要的', right: '「好的好的，XX哥/姐您先忙，不耽误您时间了。我稍后把今天的市场要点和我的看法整理一下发给您，您有空的时候看看就行。有任何问题随时找我。那您先忙，再见~」' }
      ];
      break;
      
    case 'science':
      sections = {
        opening: '「XX哥/姐，您好！我是XX银行/券商的小X。打扰您几分钟，方便说话吗？」',
        intro: '「是这样的，最近跟很多客户聊天，发现大家对一些基础的理财知识还是有不少疑问。想着您之前也问过我类似的问题，就给您打个电话，跟您分享一些理财的小知识，也许对您有帮助。」',
        core: '「今天想跟您聊的是"资产配置"这个话题。很多人觉得资产配置是有钱人的事，钱少不用配置，其实不对。资产配置说白了就是"不要把鸡蛋放在一个篮子里"，不管钱多钱少，都应该有这个意识。具体来说呢，就是把你的钱分成几部分：一部分放活期，应对日常开销和突发情况；一部分买保险，兜底保障；一部分做稳健投资，追求稳定收益；一部分做权益投资，博取更高收益。这样搭配起来，进可攻退可守。」',
        deep: '「为什么资产配置这么重要？我给您举个例子：2022年市场大跌的时候，那些全仓股票的人亏损可能有30%甚至更多，但做好资产配置的人，亏损可能只有10%左右，有的甚至还赚钱了。这就是资产配置的魔力——它不能让你赚最多的钱，但能让你在最坏的情况下活得最久。投资是一场马拉松，不是百米冲刺，活到最后才是赢家。」',
        advice: '「说到您这边啊，我觉得您可以先梳理一下自己的资产情况，看看目前的配置是不是合理。如果大部分钱都在一种资产里，比如全是存款或者全是股票，那可能需要调整一下。您要是方便的话，可以把您的资产情况大概跟我说一下，我帮您分析分析，给您一个配置建议。」',
        closing: '「行，那今天就先跟您聊这些理财小知识，希望对您有启发。您要是有什么不懂的，或者想了解哪方面的知识，随时跟我说。那您先忙，再见~」'
      };
      objections = [
        { title: '"我钱少，不用搞什么资产配置"', wrong: '钱少也要理财啊 / 钱少更要配置 / 不对的', right: '「XX哥/姐，很多人都这么想，包括我刚入行的时候也觉得，钱少理什么财啊。但后来我发现，恰恰是因为钱少，才更需要理清楚——因为你没有试错的本钱，每一分钱都要用在刀刃上。而且资产配置不是说你要有几百万才需要，哪怕只有几万块，也可以分一分。关键是养成一个好习惯，您说对吧？」' },
        { title: '"理财太复杂了，我学不会"', wrong: '很简单的 / 一学就会 / 我教您啊', right: '「XX哥/姐，您说的对，理财这东西确实挺复杂的，不然也不会有我们这个职业了。但您不需要什么都懂啊，您只需要懂一些最基本的常识，剩下的交给专业的人来做就好了。就像您不需要懂怎么造车，但不妨碍您开车。以后您有什么不懂的，随时问我，我用大白话给您讲，保证您能听懂。」' },
        { title: '"我对理财没兴趣"', wrong: '那怎么行 / 理财很重要的 / 您得学学', right: '「理解理解，每个人的兴趣点不一样嘛。其实我也不是让您变成理财专家，就是觉得懂一些基本的理财知识，能帮您少踩坑、多赚钱，何乐而不为呢？您不用专门去学，以后我经常跟您分享一些小知识，您听得多了，自然就懂了。就当是聊天增加谈资了，您看怎么样？」' },
        { title: '"理财都是骗人的吧"', wrong: '不是骗人的 / 您别这么想 / 正规的不会', right: '「XX哥/姐，您有这个想法我特别理解，现在市面上确实有很多不靠谱的理财产品和平台，坑了不少人。但您不能因为有坏的就否定全部对吧？正规的理财渠道和产品还是很多的，关键是要学会辨别。以后我也会经常跟您分享一些避坑知识，帮您擦亮眼睛。您看行吗？」' },
        { title: '"我再想想吧"', wrong: '这有什么好想的 / 赶紧行动吧 / 早学早受益', right: '「没问题XX哥/姐，理财这事急不得，得您自己想通了才行。这样吧，我先整理一些基础的理财知识发给您，您有空的时候看看，就当是涨知识了。有什么想法或者疑问，随时跟我交流。」' }
      ];
      break;
      
    case 'festival':
      sections = {
        opening: '「XX哥/姐，您好！我是XX银行/券商的小X。快过节了，给您打个电话，提前祝您节日快乐！」',
        intro: '「最近大家都在忙着准备过节的事吧？我这边也在整理客户的节日祝福和提醒，想着给您打个电话，聊聊近况，也顺便提醒您一些节日期间需要注意的理财小事。」',
        core: '「首先呢，祝您节日快乐，好好享受假期！节日期间啊，有几个小提醒想跟您说一下：第一，消费要理性，节日促销多，很容易冲动消费，买之前先想想是不是真的需要；第二，注意资金安排，节日期间股市休市、理财也可能暂停申购，您要是有资金使用需求，提前做好安排；第三，注意防诈骗，节日期间也是诈骗高发期，凡是让您转账汇款的，一定要多核实。」',
        deep: '「其实每次过节我都挺有感触的。我们这么努力工作、认真理财，为的是什么呀？不就是为了让自己和家人过上更好的生活嘛。所以啊，该花的钱要花，该享受的要享受，别把自己搞得太辛苦。理财不是让我们当守财奴，而是让我们的生活更有底气、更有安全感。这一点，您一直做得挺好的。」',
        advice: '「过节期间您要是有什么资金方面的安排，或者有理财方面的问题，随时给我发消息，我看到就会回复。节后如果您想做个资产检视，或者调整一下配置，咱们节后再约时间详聊。您先好好过节，其他事放一放。」',
        closing: '「行，那我就不打扰您了。再次祝您节日快乐，阖家幸福，万事如意！咱们节后再联系，再见~」'
      };
      objections = [
        { title: '"过节还给我打电话推销啊"', wrong: '不是推销 / 您别误会 / 我就是祝福一下', right: '「哈哈XX哥/姐，您误会了，真不是推销。就是过节了，想起来给您送个祝福，顺便提醒一下节日期间的注意事项。您放心，今天只聊节日，不聊产品。您节日期间有什么安排吗？」' },
        { title: '"过节还谈理财，太扫兴了"', wrong: '理财很重要啊 / 过节也得想着 / 我就说几句', right: '「您说的对，过节就该开开心心的，谈理财确实有点扫兴。是我考虑不周了。那行，咱不说理财了，就祝您节日快乐，好好享受假期！节后咱们再聊，再见~」' },
        { title: '"我资金都安排好了，不用你操心"', wrong: '那我再给您推荐个更好的 / 您确定吗 / 再考虑考虑', right: '「好的XX哥/姐，您做事一向有规划，我就知道您肯定都安排好了。那我就不啰嗦了，祝您节日快乐，玩得开心！有任何问题随时找我，再见~」' },
        { title: '"节后再说吧，现在不想听"', wrong: '就几句话 / 很快的 / 您听我说完', right: '「好的好的，过节最重要，其他事都往后放。那我就不打扰您了，祝您节日快乐，吃好喝好玩好！咱们节后再联系，再见~」' },
        { title: '"你们就是想让我多买产品"', wrong: '不是的 / 您别这么想 / 真的是为您好', right: '「XX哥/姐，您这么想我完全理解。说实话，作为理财顾问，我当然希望您的资产能在我这边打理，这是我的工作。但我更希望的是，我们之间能建立长期的信任关系，而不是一锤子买卖。节日给您打电话，真心是想送个祝福、提个醒。您要是觉得我烦，那我以后注意，节日只发短信不打电话，您看行吗？」' }
      ];
      break;
      
    case 'personal':
      sections = {
        opening: '「XX哥/姐，您好！我是XX银行/券商的小X。好久没跟您联系了，最近怎么样？」',
        intro: '「最近工作中有一些感悟，想起来觉得挺有价值的，就想跟您分享一下。也没什么特别的事，就是跟您聊聊天，交流交流。」',
        core: '「最近跟很多客户交流，我发现一个现象：那些投资做得好的人，往往不是最聪明的，也不是最懂技术的，而是心态最好的——不追热点、不频繁操作、有耐心、能坚持。反而那些天天盯着盘面、追涨杀跌的人，最后收益都不太理想。所以我越来越觉得，投资到最后，拼的不是技术，是人性。」',
        deep: '「我做这份工作也有好几年了，最大的收获不是业绩有多好，而是认识了很多像您这样优秀的客户，从你们身上学到了很多东西。我记得您之前跟我说过，投资最重要的是"不贪不惧"，这句话我一直记着，也经常跟其他客户分享。说实话，很多时候不是我在帮客户，而是客户在帮我成长。」',
        advice: '「所以我现在跟客户沟通，不只是聊产品、聊收益，更多的是聊心态、聊规划。我觉得一个好的理财顾问，不应该只是卖产品的，更应该是客户的"财富伙伴"——帮客户建立正确的理财观念，制定合理的财务目标，然后一起去实现。您觉得我说的对吗？」',
        closing: '「行，今天就是想跟您聊聊天，没什么正事。您要是有什么想法，或者最近有什么困惑，随时找我聊。那您先忙，再见~」'
      };
      objections = [
        { title: '"你跟我说这些，是不是想卖我产品"', wrong: '不是不是 / 您别多想 / 我就是聊聊', right: '「XX哥/姐，您有这个想法很正常，可能平时遇到的推销太多了。我跟您说实话，我今天给您打这个电话，真没有推销产品的意思。就是最近有些感悟，觉得您是一位很有想法的客户，想跟您交流交流。当然，如果以后您有理财方面的需求，能想到我，那我当然很高兴。但今天，咱就纯聊天，不聊产品，行不行？」' },
        { title: '"这些大道理我都懂"', wrong: '懂是一回事做到是另一回事 / 那您做得怎么样 / 未必真懂', right: '「哈哈，XX哥/姐果然厉害，一看就是老投资人了。确实，投资的道理说来说去就那么几条，谁都能说上几句。但真正能做到的人，少之又少。我最近也在反思自己，知道和做到之间，差的是什么。您觉得呢？是什么让您能一直坚持正确的投资理念？」' },
        { title: '"我没时间跟你聊这些"', wrong: '很快的 / 就再聊两句 / 很重要的', right: '「好的好的，XX哥/姐您先忙，不耽误您时间了。改天有空再跟您聊。那您先忙，再见~」' },
        { title: '"说这些有什么用，能帮我赚钱吗"', wrong: '当然能啊 / 心态好就能赚钱 / 真的有用', right: '「XX哥/姐，您这个问题问得特别实在。说实话，这些大道理不能直接帮您赚钱，不能告诉您明天买什么股票会涨。但它能帮您少亏钱、少踩坑，能让您在市场大跌的时候不恐慌、不割肉，在市场大涨的时候不贪婪、不追高。而投资中，不亏钱比赚钱更重要。您说对吧？」' },
        { title: '"我还是喜欢直接推荐产品"', wrong: '产品只是工具 / 理念更重要 / 您这样不对', right: '「理解理解，每个人的需求不一样。有的人喜欢听理念，有的人就喜欢直接看产品。没问题，以后我也会经常给您推荐一些好的产品。但我还是建议您，产品和理念都要了解，这样您选产品的时候也更有判断力，您说呢？」' }
      ];
      break;
  }
  
  // 合规提醒（通用）
  complianceTips = [
    '全程不得使用"保本""稳赚""无风险"等违规表述',
    '必须做好风险揭示："以上只是我个人的看法，不构成投资建议，市场有风险，投资需谨慎"',
    '不要承诺收益，不要预测具体点位',
    '先听客户说，再讲自己的观点，不要打断客户',
    '控制通话时长，5分钟左右为宜，太长容易引起反感',
    '保持真诚和专业，不要夸大其词，不要给客户不切实际的预期'
  ];
  
  // 生成6段式脚本
  let sectionsHtml = `
    <div class="call-section">
      <h4>📞 第一段：开场破冰（约30秒）</h4>
      <p class="script-speaker">客户经理：</p>
      <p class="script-line">${sections.opening}</p>
      <p class="script-tip">💡 等客户回应后再继续，确认对方有空；语气要热情自然，不要生硬</p>
    </div>
    
    <div class="call-section">
      <h4>📞 第二段：话题引入（约30秒）</h4>
      <p class="script-speaker">客户经理：</p>
      <p class="script-line">${sections.intro}</p>
      <p class="script-tip">💡 用"想着您..."建立关联，让客户觉得电话是有针对性的，不是群发骚扰</p>
    </div>
    
    <div class="call-section">
      <h4>📞 第三段：核心内容（约1-2分钟）</h4>
      <p class="script-speaker">客户经理：</p>
      <p class="script-line">${sections.core}</p>
      <p class="script-tip">💡 语速放慢，说一段停一下，给客户插话的机会；不要自顾自说不停</p>
    </div>
    
    <div class="call-section">
      <h4>📞 第四段：深度分析（约1分钟）</h4>
      <p class="script-speaker">客户经理：</p>
      <p class="script-line">${sections.deep}</p>
      <p class="script-tip">💡 先讲现象，再讲本质，最后落到客户利益上；用大白话，不要讲太多专业术语</p>
    </div>
    
    <div class="call-section">
      <h4>📞 第五段：行动建议（约30秒）</h4>
      <p class="script-speaker">客户经理：</p>
      <p class="script-line">${sections.advice}</p>
      <p class="script-tip">💡 用"小建议""可以参考"等软措辞，不要像在指挥客户；给客户明确的下一步动作</p>
    </div>
    
    <div class="call-section">
      <h4>📞 第六段：收尾促动（约20秒）</h4>
      <p class="script-speaker">客户经理：</p>
      <p class="script-line">${sections.closing}</p>
      <p class="script-tip">💡 一定要给出明确的下一步动作，不要只是"寒暄一下就挂了"；结尾要礼貌温暖</p>
    </div>
  `;
  
  // 异议应对
  let objectionsHtml = '<div class="call-section"><h4>🚫 常见异议应对（附话术）</h4>';
  objections.forEach((obj, i) => {
    objectionsHtml += `
      <p class="call-sub-title">异议${i + 1}：${obj.title}</p>
      <p class="call-wrong">❌ 错误：${obj.wrong}</p>
      <p class="call-right">✅ 应对：${obj.right}</p>
    `;
  });
  objectionsHtml += '<p class="script-tip">💡 异议处理原则：先认同，再引导；用提问代替说教；给选项不给填空题</p></div>';
  
  // 合规提醒
  let complianceHtml = '<div class="call-section"><h4>⚠️ 合规提醒</h4><ul>';
  complianceTips.forEach(tip => {
    complianceHtml += `<li>${tip}</li>`;
  });
  complianceHtml += '</ul></div>';
  
  return sectionsHtml + objectionsHtml + complianceHtml;
}

// ========== 5. 短视频口播稿生成 ==========
function generateMaterialVideo(type, text, image) {
  const config = getMaterialConfig(type);
  const info = extractKeyInfo(text, type);
  const typeKey = normalizeMaterialType(type);
  
  let titles = [];
  let scriptParts = {};
  let caption = '';
  let hashtags = '';
  let tips = [];
  
  switch(typeKey) {
    case 'product':
      titles = [
        '这款理财产品，为什么我自己也在买？理财经理真心话',
        '被问了800遍的稳健理财，今天一次性说清楚！',
        '买理财前必看！3个标准帮你选出好产品'
      ];
      scriptParts = {
        hook: `买理财怕踩坑？今天教你3个判断标准，看完你也会选！`,
        intro: `最近好多朋友私信我，让我推荐稳健的理财产品。今天不聊具体产品，聊方法论——选理财，看这三点就够了。`,
        main: `第一，看团队。管理团队的从业经验、过往业绩、投资风格，这些比什么都重要。团队稳，产品才稳。\n第二，看策略。是纯债还是"固收+"？权益比例多少？要跟自己的风险承受能力匹配。\n第三，看回撤。不要只看赚了多少，更要看跌的时候能跌多少。最大回撤小的，拿得住才赚得到。`,
        advice: `最后提醒大家：理财不是赚快钱，是稳稳的幸福。找对适合自己的产品，长期持有，时间会给你答案。想知道具体怎么配置的，评论区告诉我你的风险偏好~`,
        end: `关注我，理财路上少走弯路！`
      };
      caption = '买理财总是踩坑？不知道怎么选产品？今天这条视频，3个标准教你选出靠谱的理财产品，看完你也能成为半个专家！';
      hashtags = '#理财知识 #稳健理财 #资产配置 #理财顾问 #避坑指南 #投资干货 #普通人理财';
      tips = [
        '开头3秒用"提问+干货承诺"抓住注意力，完播率提升30%',
        '讲3个要点的时候，可以配合手势或字幕特效，节奏感更强',
        '背景可以是办公室/书房，桌上放几本财经书，显得更专业',
        '语速稍快有激情，讲到重点的时候加重语气',
        '字幕一定要加，80%的人是静音看视频的',
        '结尾一定要引导互动："评论区告诉我你的风险偏好"'
      ];
      break;
      
    case 'activity':
      titles = [
        '紧急通知！这个理财福利再不抢就没了！',
        '新客专属福利来了！手把手教你怎么薅',
        '错过等一年！这个活动到底值不值得参加？'
      ];
      scriptParts = {
        hook: `注意了！这个理财福利活动，名额只剩最后XX个，错过等一年！`,
        intro: `大家好我是小X，今天给大家带来一个好消息——我们的专属福利活动开始了！力度真的很大，我自己都参加了。`,
        main: `先说福利内容：新客专享收益加成，比平时高不少；还有抽奖机会，奖品很给力；邀请朋友一起参加，还能拿额外奖励。\n再说说怎么参加：手机上操作几分钟就能搞定，特别简单。\n最后划重点：名额有限，先到先得，满了就截止。别犹豫，犹豫就会败北！`,
        advice: `有人可能会问，这种活动靠谱吗？我跟大家保证，绝对正规靠谱，官方活动，没有任何套路。符合条件的朋友，赶紧冲就对了！想知道具体怎么操作的，评论区扣"1"，我私你攻略~`,
        end: `关注我，理财福利不错过！`
      };
      caption = '🔥 专属福利活动来了！收益加成+抽奖+邀请奖励，三重福利拿到手软！名额有限，先到先得，错过等一年！想参加的评论区扣"1"~';
      hashtags = '#理财福利 #限时活动 #新客专享 #薅羊毛 #理财攻略 #福利放送 #投资理财';
      tips = [
        '开头用"紧急通知""最后XX个"制造紧迫感，吸引用户停留',
        '讲福利的时候语速加快、语气兴奋，营造热烈氛围',
        '可以配一些"冲冲冲""手慢无"的字幕特效和音效',
        '画面可以展示活动页面截图，增加真实感',
        '一定要强调"正规靠谱""无套路"，打消用户顾虑',
        '结尾引导评论互动，用"扣1领攻略"提升评论率'
      ];
      break;
      
    case 'morning':
      titles = [
        '今天市场怎么走？3分钟看懂早盘机会与风险',
        '早报解读：这个板块又火了，还能追吗？',
        '每日财经速递：3个重点看懂今天的市场'
      ];
      scriptParts = {
        hook: `今天的市场怎么走？3分钟给你讲明白，看完心里有数！`,
        intro: `早上好，我是小X。新的一天开始了，先来看看今天的市场有哪些重点。`,
        main: `第一，大盘走势。昨天整体是震荡格局，成交量维持万亿水平，说明市场情绪还在。\n第二，热点板块。科技成长方向表现活跃，主要是受政策和产业景气度支撑；消费板块有所调整，更多是短期获利回吐。\n第三，资金动向。北向资金持续流入，说明外资对A股中长期还是看好的。`,
        advice: `我的观点：短期可能还有震荡，但中长期不用太悲观。操作上，优质标的继续持有，逢低可以加仓，但不要追高。想知道具体怎么配置的，评论区告诉我你的情况~`,
        end: `关注我，每天1分钟，带你看懂市场！`
      };
      caption = '今日市场早报来啦！大盘走势、热点板块、资金动向，3个重点一次性讲清楚。最后还有操作建议，一定要看完~';
      hashtags = '#每日财经 #股市 #投资理财 #市场解读 #早盘分析 #理财知识 #A股';
      tips = [
        '开头直接点题，用"看完心里有数"给用户价值预期',
        '讲市场数据的时候，可以配合K线图或数据表格画面',
        '语气要专业但不生硬，像跟朋友聊天一样',
        '一定要讲"我的观点"，有态度的内容更容易涨粉',
        '结尾用"关注我每天1分钟"建立日更预期',
        '发布时间选在早上7-8点，通勤路上刷到的人最多'
      ];
      break;
      
    case 'science':
      titles = [
        '90%的人都搞错了！理财和投资根本不是一回事',
        '理财第一步，90%的人都走错了',
        '原来这才是真正的理财！以前都白学了'
      ];
      scriptParts = {
        hook: `90%的人都不知道，理财和投资根本不是一回事！别再被骗了！`,
        intro: `大家好我是小X，今天来聊一个很多人都搞混的话题：理财和投资，到底有什么区别？`,
        main: `先说结论：投资是理财的一部分，但理财不等于投资。\n什么是投资？就是让钱生钱，买基金、买股票、买房产，这些都是投资。\n那什么是理财？范围就大了——赚钱、花钱、存钱、借钱、护钱（保险）、生钱（投资），这六个方面加起来，才叫理财。\n很多人一上来就问"买什么能赚钱"，其实是顺序搞反了。应该先理清楚整体的财务状况，再考虑投资的事。`,
        advice: `给大家一个理财的正确顺序：先记账，搞清楚收支；再存应急基金，3-6个月生活费；然后买保险，兜底；最后才是投资。按这个顺序来，不会错。觉得有用的，点赞收藏起来慢慢看~`,
        end: `关注我，每天一个理财小知识！`
      };
      caption = '90%的人都搞混了！理财和投资到底有什么区别？今天这条视频给你讲明白，还有理财的正确顺序，一定要收藏！';
      hashtags = '#理财知识 #理财小白 #投资 #财商 #避坑指南 #理财入门 #干货分享';
      tips = [
        '开头用"90%的人都搞错了"制造反差，引发好奇',
        '讲知识点的时候，画面可以配合动画或手写板图示',
        '语言要通俗易懂，用大白话，别讲专业术语',
        '节奏要快，一个知识点接一个，别拖沓',
        '结尾一定要引导点赞收藏，提升互动数据',
        '封面用"反差感"标题+惊讶表情，点击率更高'
      ];
      break;
      
    case 'festival':
      titles = [
        '过节了，除了快乐，我还想提醒你3件理财小事',
        '节日快乐！但这件事千万别忘...',
        '过节也要理财？3个小提醒帮你守住钱包'
      ];
      scriptParts = {
        hook: `过节了，先祝大家快乐！但有3件理财小事，我必须提醒你！`,
        intro: `大家好我是小X。过节了，先祝大家节日快乐！今天不聊严肃的投资话题，聊点轻松的——过节期间，理财上需要注意什么？`,
        main: `第一，理性消费。节日促销多，很容易冲动消费。买之前先问自己三个问题：我真的需要吗？我会经常用吗？不买我会怎么样？\n第二，资金安排。节日期间股市休市，理财也可能暂停申购。有资金使用需求的，提前安排好，别到时候取不出来着急。\n第三，防诈骗。过节期间也是诈骗高发期，凡是让你转账汇款、索要验证码的，一律拉黑！`,
        advice: `其实啊，理财理的不仅仅是钱，更是生活。该花的钱大胆花，该省的钱不乱花，该投资的钱科学投。祝大家节日过得开心，钱包也越来越鼓！节日快乐~`,
        end: `关注我，理财生活两不误！`
      };
      caption = '🎉 节日快乐！除了祝福，还有3个理财小提醒要送给你：理性消费、资金安排、防诈骗。每一条都很重要，一定要看完~ 祝大家节日开心，钱包鼓鼓！';
      hashtags = '#节日祝福 #理财提醒 #理性消费 #财富管理 #理财顾问 #生活理财 #节日快乐';
      tips = [
        '开头先送祝福，拉近距离，再自然过渡到理财提醒',
        '语气要温暖亲切，像朋友在关心你，而不是在说教',
        '画面可以配一些节日元素，氛围感拉满',
        '讲消费和防诈骗的时候，语气要认真严肃，形成反差',
        '结尾再送一次祝福，首尾呼应，留下好印象',
        '发布时间选在节日前一天或当天早上，流量最好'
      ];
      break;
      
    case 'personal':
      titles = [
        '做了5年理财顾问，我发现了一个扎心真相...',
        '理财顾问的一天，跟你想的完全不一样',
        '为什么我劝你不要轻易做理财顾问？真实经历分享'
      ];
      scriptParts = {
        hook: `做了5年理财顾问，我发现了一个扎心的真相：真正赚钱的人，都有一个共同点...`,
        intro: `大家好我是小X，一个在金融行业摸爬滚打了5年的理财顾问。今天不聊产品，跟大家聊聊我的真实工作和感悟。`,
        main: `很多人以为理财顾问就是卖产品的，每天打打电话、发发朋友圈，轻轻松松赚大钱。\n其实根本不是。我们的一天是这样的：早上7点到公司，先看盘读研报；上午见客户，帮他们做资产检视；中午还要抽时间学习，行业知识更新太快了；下午整理资料、准备分享会；晚上可能还要加班。\n但我想说的是，这份工作真的很有意义。每次帮客户解决了问题、看到他们的笑容，那种成就感，是钱买不来的。`,
        advice: `做这行越久，我越觉得：投资到最后，拼的不是技术，是人性。那些真正在市场里赚到钱的人，都有一个共同点——心态好，不贪不惧，能坚持。理财是这样，做人也是这样。觉得有共鸣的，点个赞再走~`,
        end: `关注我，一个有温度的理财顾问！`
      };
      caption = '做了5年理财顾问，今天想跟大家说说心里话。这份工作跟你想的可能不太一样，但它真的很有意义。最后还有一个投资的扎心真相，一定要看到最后~';
      hashtags = '#理财顾问 #金融从业者 #职场日常 #投资感悟 #真实记录 #理财人 #职场vlog';
      tips = [
        '开头用"扎心真相""真实经历"引发好奇，用户都喜欢看内幕',
        '讲自己故事的时候语气要真诚，不要装逼，真实最打动人',
        '可以配一些工作场景的画面（办公室、客户会谈、加班等）',
        '从个人故事引申到投资感悟，有温度又有干货，涨粉神器',
        '结尾一定要有"共鸣感"，让用户觉得"对对对我也是这样"',
        '人设要统一：专业、真诚、有温度，不要来回变'
      ];
      break;
  }
  
  const html = `
    <div class="video-section">
      <h4>📱 短视频口播稿（60秒版）</h4>
      <p class="video-label">📝 标题建议（3选1）：</p>
      <div class="video-titles">
        <p class="video-title">① ${titles[0]}</p>
        <p class="video-title">② ${titles[1]}</p>
        <p class="video-title">③ ${titles[2]}</p>
      </div>
    </div>
    
    <div class="video-section">
      <h4>🎤 口播正文（约60秒）</h4>
      <p class="video-script">
        <span class="video-time">[0-5s 开头抓眼球]</span><br>
        ${scriptParts.hook}
      </p>
      <p class="video-script">
        <span class="video-time">[5-20s 引入+铺垫]</span><br>
        ${scriptParts.intro}
      </p>
      <p class="video-script">
        <span class="video-time">[20-40s 核心内容]</span><br>
        ${scriptParts.main.split('\n').map(l => l.trim()).filter(l => l).join('<br>')}
      </p>
      <p class="video-script">
        <span class="video-time">[40-55s 建议+互动]</span><br>
        ${scriptParts.advice}
      </p>
      <p class="video-script">
        <span class="video-time">[55-60s 结尾引导]</span><br>
        ${scriptParts.end}
      </p>
    </div>
    
    <div class="video-section">
      <h4>🏷️ 文案配套</h4>
      <p class="video-caption">
        <strong>视频简介：</strong><br>
        ${caption}<br><br>
        <strong>话题标签：</strong>${hashtags}
      </p>
    </div>
    
    <div class="video-section">
      <h4>💡 拍摄建议</h4>
      <ul>
        ${tips.map(tip => `<li>${tip}</li>`).join('')}
      </ul>
    </div>
  `;
  
  return html;
}

// ========== 6. 新媒体文案生成（小红书+公众号） ==========
function generateMaterialMedia(type, text, image) {
  const config = getMaterialConfig(type);
  const info = extractKeyInfo(text, type);
  const typeKey = normalizeMaterialType(type);
  
  let xhsTitles = [];
  let wxTitles = [];
  let xhsBody = '';
  let wxBody = '';
  let publishTips = [];
  
  switch(typeKey) {
    case 'product':
      xhsTitles = [
        '被问爆了的稳健理财！作为理财经理，我为什么自己也在买？',
        '买理财踩过的坑，今天一次性说清楚！附选品方法',
        '月薪5k也能理财！这款产品我真的爱了'
      ];
      wxTitles = [
        '深度解析：如何挑选一款适合自己的稳健理财产品？',
        '2024年理财产品选购指南：从入门到精通',
        '稳健型理财产品怎么选？理财经理告诉你3个核心标准'
      ];
      xhsBody = `
姐妹们！今天必须跟大家聊聊我私藏的一款宝藏理财产品✨

作为一个在金融行业摸爬滚打了5年的理财经理，每天被问得最多的问题就是："有什么稳健的理财推荐？"

今天不藏私了，把我的选品标准和自用款都分享给你们👇

💛 选理财，看这3点就够了

1️⃣ 看团队
   管理团队的从业经验、投资风格、过往业绩，这些才是产品的灵魂。团队稳，产品才稳。那种频繁换基金经理的，再高收益也别碰！

2️⃣ 看策略
   是纯债还是"固收+"？权益比例多少？一定要跟自己的风险承受能力匹配。别光看收益高，跌的时候你能不能扛住，更重要！

3️⃣ 看回撤
   不要只看赚了多少，更要看最大回撤是多少。回撤小的产品，你才能拿得住，拿得住才能赚得到。

💛 我为什么推荐这款？

说实话，市面上好产品不少，但这款我自己也在定投。不是因为它收益最高，而是因为它"稳"——在控制好回撤的前提下，收益也不错，性价比很高。

对于大多数普通投资者来说，"稳稳的幸福"比"惊心动魄的刺激"重要多了。

💛 最后想说

理财不是比谁赚得快，而是比谁走得远。
找到适合自己的产品，坚持长期持有，时间会给你答案。

❤️ 关注我，每天分享理财干货
想知道自己适合什么类型的理财？评论区告诉我你的风险偏好，我帮你分析~

#理财推荐 #稳健理财 #资产配置 #理财顾问 #避坑指南 #理财小白 #投资干货 #普通人理财
      `;
      wxBody = `
【引言】

在当前市场环境下，"稳健"成为越来越多投资者的首选。但面对市面上琳琅满目的理财产品，很多人不知道该怎么选。今天这篇文章，我们就来聊聊：如何挑选一款适合自己的稳健理财产品？

【一、理财产品的分类与特点】

首先，我们需要了解理财产品的主要类型：

1. 纯债型产品：主要投资债券，风险较低，收益相对稳定，适合保守型投资者。
2. "固收+"产品：以债券为主，辅以少量权益投资，风险中等，收益有弹性，适合平衡型投资者。
3. 权益型产品：主要投资股票，风险较高，收益波动大，适合进取型投资者。

选择产品的第一步，是明确自己的风险承受能力，然后在对应的品类中挑选。

【二、选品的3个核心标准】

标准一：管理团队是核心

产品表现好不好，关键看管理团队。考察团队可以从以下几个维度入手：
- 从业经验：是否经历过完整的牛熊周期
- 投资风格：是否稳定一致，有没有风格漂移
- 历史业绩：长期业绩是否优秀，回撤控制是否出色
- 团队稳定性：核心人员是否频繁变动

标准二：投资策略要匹配

再好的产品，如果跟你的风险承受能力不匹配，也不是好产品。
- 保守型：纯债、货币基金为主，追求本金安全
- 平衡型："固收+"、配置型基金为主，追求稳健增值
- 进取型：权益基金、股票为主，追求高收益，能承受高波动

标准三：风险收益比是关键

不要只看收益率，更要看性价比——承担了多少风险，换来了多少收益。
- 看最大回撤：历史上最惨的时候跌了多少，你能不能接受
- 看夏普比率：每承担一单位风险，能获得多少超额收益
- 看业绩稳定性：是持续优秀，还是靠某一年爆发

【三、投资建议与注意事项】

1. 分散配置：不要把钱都放在一款产品里，适当分散，降低风险。
2. 长期持有：理财不是炒短线，频繁申赎不仅费手续费，还容易错过收益。
3. 定期检视：每半年或一年回顾一下，根据市场情况和自身需求做调整。
4. 风险提示：理财非存款，产品有风险，投资需谨慎。过往业绩不代表未来表现。

【结语】

选择理财产品，没有最好的，只有最适合的。
希望这篇文章能帮你建立自己的选品框架，找到适合自己的理财方式。

风险提示：以上观点仅供参考，不构成投资建议。市场有风险，投资需谨慎。
      `;
      publishTips = [
        '小红书：封面用产品截图+手写标注，标题要有"被问爆了""私藏"等抓人眼球的词，结尾引导评论互动',
        '公众号：结构清晰、逻辑严谨，用小标题分段，适当加入数据和案例增加说服力，文末加风险提示',
        '最佳发布时间：小红书中午12-13点、晚上20-22点；公众号早上7-8点、晚上21-22点',
        '注意合规：不得承诺收益，不得使用"最""第一"等极限词，必须做好风险揭示'
      ];
      break;
      
    case 'activity':
      xhsTitles = [
        '紧急！这个理财福利只剩最后XX名额，错过等一年！',
        '薅羊毛攻略｜新客专属理财福利，手把手教你领',
        '亲测有效！这个理财活动真的太香了'
      ];
      wxTitles = [
        '【福利通知】专属理财活动来袭，三重好礼等你拿！',
        '新客专享福利全面解析：值不值得参加？怎么参加最划算？',
        '限时开放！这个理财活动为什么值得关注？'
      ];
      xhsBody = `
姐妹们！紧急通知！🔥
这个理财福利活动，名额真的不多了，错过等一年！

作为理财经理，我第一时间就自己参加了，力度真的很大，不分享出来我良心不安！

💛 福利内容（三重好礼）

1️⃣ 新客专享收益加成
   比平时的收益高不少，真金白银的福利，不是那种虚头巴脑的东西。

2️⃣ 参与抽奖100%中奖
   只要参加就能抽奖，奖品很实在，最低也有XX，最高能拿XX！

3️⃣ 邀请好友额外奖励
   拉上闺蜜一起参加，你俩都能拿额外奖励，双赢！

💛 怎么参加？（超简单）

真的超级简单，手机上操作3分钟搞定：
第一步：打开APP，找到活动页面
第二步：点击参与，按照提示操作
第三步：完成！等着收福利就行~

有不懂的可以评论区问我，或者直接私我，我教你！

💛 划重点（必读）

⚠️ 名额有限，先到先得，满了就截止
⚠️ 官方活动，绝对正规靠谱，没有任何套路
⚠️ 符合条件的姐妹，别犹豫，犹豫就会败北！

❤️ 关注我，理财福利不错过
想参加的姐妹评论区扣"1"，我把详细攻略发你~

#理财福利 #限时活动 #新客专享 #薅羊毛 #理财攻略 #福利放送 #投资理财 #省钱攻略
      `;
      wxBody = `
【活动通知】

尊敬的客户：

感谢您一直以来的支持与信任。为回馈广大客户，我们特推出专属理财福利活动，三重好礼等你来拿！活动限时开放，名额有限，先到先得。

【一、活动详情】

1. 活动时间：即日起至XX月XX日（或名额用完即止）
2. 参与对象：符合条件的新老客户
3. 活动内容：
   - 一重礼：新客专享收益加成，提升投资回报
   - 二重礼：参与即可抽奖，100%中奖，奖品丰厚
   - 三重礼：邀请好友参与，双方均可获得额外奖励

【二、参与方式】

方式一：手机银行/APP线上参与（推荐）
- 登录APP → 进入活动专区 → 点击参与 → 按照提示完成操作

方式二：联系您的专属理财顾问
- 拨打客服热线或联系您的理财经理，我们将协助您完成参与

【三、常见问题解答】

Q: 这个活动靠谱吗？会不会有风险？
A: 活动由官方推出，所有规则透明公开，绝对正规靠谱。参与本身不产生额外风险，请放心参加。

Q: 活动收益是固定的吗？
A: 收益加成是确定的，但理财产品本身的收益会随市场波动，投资有风险，参与需谨慎。

Q: 名额真的有限吗？
A: 是的，本次活动名额有限，先到先得，满额即止。建议尽早参与，避免错过。

【四、温馨提示】

1. 请确保您是在官方渠道参与活动，注意保护个人信息和资金安全。
2. 理财非存款，产品有风险，投资需谨慎。
3. 如有任何疑问，请联系您的专属理财顾问或拨打客服热线。

最后，再次感谢您的支持与信任，祝您投资顺利，财源广进！

风险提示：以上内容仅供参考，不构成投资建议。市场有风险，投资需谨慎。
      `;
      publishTips = [
        '小红书：封面用"紧急通知""最后XX名"等紧迫感强的设计，正文多用emoji和感叹号营造热烈氛围，引导评论扣"1"',
        '公众号：正式、严谨，信息全面，Q&A部分很重要，打消客户疑虑，文末附联系方式便于转化',
        '最佳发布时间：活动开始当天早上发布，配合朋友圈和客户群转发，形成刷屏效应',
        '注意合规：不得承诺收益，活动规则要透明，不得使用误导性表述，必须做好风险提示'
      ];
      break;
      
    case 'morning':
      xhsTitles = [
        '早报速览｜今天市场怎么走？3个重点一次说清',
        '财经早餐：这个板块又爆发了，还能上车吗？',
        '每日财经速递｜3分钟看懂今天的投资机会'
      ];
      wxTitles = [
        '【每日早报】市场震荡整理，结构性机会延续，后市怎么看？',
        '深度解读：当前市场环境下的投资策略与配置建议',
        '今日市场复盘：热点轮动加速，如何把握结构性机会？'
      ];
      xhsBody = `
姐妹们早上好！☀️
今天的市场早报来了，3分钟看懂今天的机会与风险~

💛 昨日市场回顾

📊 大盘：整体震荡整理，沪指小幅波动，成交量维持万亿水平
💹 板块：科技成长表现活跃，消费新能源有所调整
💰 资金：北向资金小幅净流入，主力青睐科技方向

💛 今日重点关注

1️⃣ 政策面动向
   近期政策面持续释放积极信号，对市场情绪有支撑。关注后续政策落地情况。

2️⃣ 热点板块持续性
   科技成长方向近期表现亮眼，但要注意短期涨幅过大后的回调风险。不建议追高，逢低布局更稳妥。

3️⃣ 量能变化
   成交量是市场情绪的晴雨表。如果能持续放量，行情可能走得更远；如果缩量，就要小心了。

💛 我的操作建议

✅ 持仓的：优质标的继续持有，别被短期波动晃下车
✅ 想加仓的：分批建仓，逢低布局，不要一把梭
✅ 空仓的：可以先小仓位试试水，感受一下市场节奏
❌ 所有人：不要追高！不要追高！不要追高！

最后想说：市场永远在波动，机会和风险永远并存。
保持理性，坚守纪律，长期来看，时间会奖励有耐心的人。

❤️ 关注我，每天陪你看市场
你今天打算怎么操作？评论区聊聊~

#每日财经 #投资理财 #股市 #市场解读 #理财知识 #资产配置 #A股 #理财顾问
      `;
      wxBody = `
【盘面回顾】

昨日A股维持震荡整理格局，截至收盘，沪指小幅收跌，创业板指小幅收涨，两市成交额维持在万亿水平。盘面上，科技成长方向表现活跃，AI、半导体等板块涨幅居前；消费、新能源板块有所调整。整体来看，市场结构性特征明显，热点轮动较快。

【热点解读】

近期科技成长板块持续受到市场关注，背后有几方面的支撑：

第一，政策面支持。国家对科技创新的支持力度不断加大，相关产业政策密集出台，为行业发展提供了良好的政策环境。

第二，产业景气度上行。从业绩来看，科技行业的增速在各板块中处于领先位置，基本面支撑较强。

第三，资金关注度提升。随着赚钱效应显现，越来越多的资金开始关注这个方向，形成了一定的正向循环。

但同时也要注意风险：短期涨幅过大后，板块可能面临获利回吐的压力；行业竞争加剧可能导致利润率下降；技术迭代速度快，押注单一技术路线存在不确定性。

【投资策略】

基于当前市场环境，我们给出以下几点建议：

一、配置策略：均衡配置，结构优化
建议采用"核心+卫星"的配置思路。核心部分配置稳健的价值蓝筹和"固收+"产品，作为组合的压舱石；卫星部分可以适度配置科技成长等弹性方向，增强组合收益。

二、操作策略：不追高，逢低布局
对于近期涨幅较大的热门板块，建议保持理性，不宜盲目追高。如果看好中长期逻辑，可以考虑通过定投的方式分批布局，既不错过机会，又能有效摊薄成本。

三、风险控制：仓位管理是关键
永远不要满仓操作，保持一定的现金储备，市场下跌时才有加仓的子弹。同时，做好止损纪律，当持仓标的基本面发生变化时，要及时调整。

【风险提示】

1. 市场波动风险：短期市场可能继续震荡，注意控制仓位，合理控制风险。
2. 政策风险：政策落地节奏和力度存在不确定性，可能影响市场情绪。
3. 估值风险：部分热门板块短期涨幅较大，估值偏高，需警惕回调风险。

【结语】

市场永远在波动，机会和风险永远并存。对于普通投资者而言，保持理性、坚守纪律、长期持有，才是穿越牛熊的正确姿势。

风险提示：以上观点仅供参考，不构成投资建议。市场有风险，投资需谨慎。
      `;
      publishTips = [
        '小红书：早上7-8点发布，通勤路上刷到的人最多。内容要简洁有干货，多用数据和表情符号增加可读性',
        '公众号：结构完整、分析深入，既有回顾又有展望，既有观点又有策略，体现专业度',
        '互动很重要：小红书结尾问"今天怎么操作"引导评论；公众号可以设投票"你对后市怎么看"',
        '注意合规：不得预测具体点位，不得承诺收益，所有观点都要加"仅供参考"和风险提示'
      ];
      break;
      
    case 'science':
      xhsTitles = [
        '理财第一步，90%的人都走错了！你中枪了吗？',
        '原来这才是理财！以前学的都白搭了...',
        '从月光到存款6位数，我靠的是这4个理财习惯'
      ];
      wxTitles = [
        '理财入门：一文读懂什么是真正的理财',
        '普通人的理财课：从0到1建立你的理财体系',
        '理财的本质是什么？这篇文章说透了'
      ];
      xhsBody = `
姐妹们！今天必须跟大家聊一个扎心话题：
你以为的理财，可能根本不是理财！😱

我接触过太多人，一上来就问"买什么基金好""推荐个股票吧"
但其实，理财的第一步，根本不是买产品！

💛 理财 vs 投资，别再搞混了

很多人以为理财 = 投资 = 买基金买股票
大错特错！

投资只是理财的一部分。
真正的理财，是一个完整的体系：
✅ 赚钱：提升收入，开源是根本
✅ 花钱：理性消费，把钱花在刀刃上
✅ 存钱：强制储蓄，积少成多
✅ 护钱：保险配置，兜底保障
✅ 生钱：投资理财，让钱生钱
✅ 传钱：财富传承，把钱留给想给的人

💛 理财的正确顺序（划重点！）

1️⃣ 先记账
   搞清楚你的钱从哪来、花到哪去。不知道自己花了多少钱，谈什么理财？

2️⃣ 存应急基金
   存够3-6个月的生活费，放在随时能取的地方。这是你的底气，也是你的退路。

3️⃣ 买保险
   在考虑投资之前，先把保障做足。一场大病、一次意外，就能把积蓄掏空。

4️⃣ 最后才是投资
   前面几步都做好了，再考虑用闲钱投资。亏了也不影响生活的那种闲钱。

💛 最后想说

理财不是富人的游戏，是每个人的必修课。
钱少的时候更要理财，因为你没有试错的本钱。
从今天开始，从记账开始，慢慢建立自己的理财体系。
慢慢来，比较快。

❤️ 关注我，陪你一起从理财小白变大神
你现在处于理财的哪个阶段？评论区聊聊~

#理财知识 #理财小白 #理财入门 #财商 #资产配置 #理财顾问 #省钱存钱 #普通人理财
      `;
      wxBody = `
【引言】

"理财"这个词，大家都不陌生。但如果问你：什么是理财？很多人可能答不上来，或者会说"不就是买基金买股票吗？"

今天这篇文章，我们就来聊聊：理财到底是什么？普通人应该怎么开始理财？

【一、什么是真正的理财？】

很多人对理财有误解，以为理财就是投资，就是赚钱。
其实不然。理财是一个很宽泛的概念，它包含了与钱有关的方方面面。

简单来说，理财就是"管理财富"——通过合理规划和安排，让自己的财务状况更健康，让生活更有保障、更有底气。

理财的六大支柱：
1. 收入管理：如何赚钱、如何提升收入
2. 支出管理：如何花钱、如何理性消费
3. 储蓄管理：如何存钱、如何积少成多
4. 风险管理：如何通过保险转移风险
5. 投资管理：如何让钱生钱、实现财富增值
6. 传承规划：如何把财富顺利传给下一代

【二、为什么要理财？】

有人说："我钱少，不用理财。"
这是最大的误区。正因为钱少，才更需要理财。

理财的意义在于：
- 抵御风险：有应急基金，遇到突发情况不至于手忙脚乱
- 实现目标：买房、买车、育儿、养老，都需要钱来支撑
- 财务自由：被动收入覆盖日常支出，不用为钱工作
- 内心安定：手里有钱，心里不慌，面对选择更有底气

【三、理财的正确打开方式】

第一步：梳理财务状况
- 算一算你有多少钱（资产）、欠多少钱（负债）
- 记一个月的账，看看钱都花在哪了
- 算一下你的结余率（结余/收入），目标30%以上

第二步：建立应急基金
- 金额：3-6个月的生活费
- 存放：货币基金、活期理财，随时能取
- 作用：应对失业、疾病、意外等突发情况

第三步：配置保险
- 先大人后小孩：大人是家庭的经济支柱，优先保障
- 先保障后理财：先把重疾、医疗、意外、寿险配好
- 保额要够：重疾险保额建议30万以上，寿险覆盖房贷和子女抚养费

第四步：开始投资
- 用闲钱投资：亏了也不影响生活的钱
- 从低风险开始：货币基金、债券基金，建立信心
- 逐步学习：不要一上来就all in股票，边学边实践

【四、常见误区避坑】

❌ 误区一：等有钱了再理财
正解：理财越早开始越好，钱少有钱少的理法，关键是养成习惯。

❌ 误区二：理财就是买高收益产品
正解：收益和风险永远成正比，追求高收益的同时，也要问问自己能不能承受对应的风险。

❌ 误区三：把所有钱都拿去投资
正解：投资只是理财的一部分，保障、储蓄、消费规划同样重要。

❌ 误区四：跟风投资，别人买什么我买什么
正解：每个人的情况不一样，适合别人的不一定适合你。独立思考，理性决策。

【结语】

理财是一场马拉松，不是百米冲刺。
不需要你一下子变成专家，也不需要你一夜暴富。
慢慢来，一步一步建立自己的理财体系，时间会给你最好的回报。

从今天开始，行动起来吧！

风险提示：以上内容仅供参考，不构成投资建议。市场有风险，投资需谨慎。
      `;
      publishTips = [
        '小红书：封面用"90%的人都错了""扎心话题"等制造反差，正文多用emoji分段，逻辑清晰有干货',
        '公众号：系统全面、由浅入深，结构清晰，适合收藏转发，文末可以加"关注+收藏"引导',
        '最佳发布时间：周末或晚上，用户有空深度阅读的时候；这类干货文收藏率高，长尾流量好',
        '注意合规：不得推荐具体产品，不得承诺收益，所有建议都是通用知识普及，加风险提示'
      ];
      break;
      
    case 'festival':
      xhsTitles = [
        '节日快乐！除了祝福，我还想提醒你3件理财小事',
        '过节了，你的钱包准备好了吗？理财人必看',
        '节日理财攻略｜玩好又省钱，快乐不打烊'
      ];
      wxTitles = [
        '【节日特辑】节日快乐！这些理财提醒请收好',
        '节日期间的财富管理：消费、投资、安全，一个都不能少',
        '欢度节日，勿忘理财：给您的5个节日理财建议'
      ];
      xhsBody = `
姐妹们！🎉 节日快乐呀！

今天不聊严肃的投资话题，就跟大家唠唠嗑，顺便送上几个节日理财小提醒~

💛 先祝大家节日快乐

不管你是跟家人团聚，还是出门旅游，还是宅家休息
都希望你能开开心心，好好享受假期！

努力工作、认真理财，最终不就是为了更好的生活嘛
该放松的时候就好好放松~

💛 节日理财3个小提醒

1️⃣ 理性消费，别冲动
   节日促销真的太多了，很容易"买买买"上头
   教大家一个方法：加入购物车后，等24小时再付款
   很多东西过了那股劲儿，你就会发现其实不需要

2️⃣ 提前安排好资金
   节日期间股市休市，部分理财也暂停申购和赎回
   如果节日期间有用钱需求，一定要提前取出来
   别到时候急用钱取不出来，干着急

3️⃣ 提高警惕，防诈骗
   节假日也是诈骗高发期！
   凡是让你转账、索要验证码、点陌生链接的
   一律！不要！相信！
   有疑问直接打官方客服电话核实

💛 最后想说

其实啊，理财理的不仅仅是钱，更是生活。
该花的钱大胆花，该省的钱不乱花，该存的钱好好存。
钱包有底气，生活才有底气。

祝大家节日快乐，吃好喝好玩好，钱包也越来越鼓！🎊

❤️ 关注我，理财生活两不误
这个节日你怎么过？评论区聊聊~

#节日祝福 #理财提醒 #理性消费 #财富管理 #理财顾问 #生活理财 #节日快乐 #省钱攻略
      `;
      wxBody = `
【开篇寄语】

亲爱的朋友们：

值此佳节来临之际，首先向您致以最诚挚的节日问候！感谢您一直以来的信任与支持。

节日是团圆的时刻、是放松的时刻，在这个特殊的日子里，我们不想聊太多严肃的投资话题，只想送上几个温馨的理财小提醒，希望能帮您度过一个愉快又安心的假期。

【一、消费篇：理性过节，快乐不浪费】

节日期间，各种促销活动让人眼花缭乱，很容易冲动消费。在这里给大家几个小建议：

1. 提前做好预算：节日消费列个清单，大概花多少钱心里有数，避免超支。
2. 拒绝冲动消费：看到"限时特惠""最后一天"别着急下单，先想想是不是真的需要。
3. 注重体验而非物质：节日的意义在于陪伴和体验，不一定非要花很多钱。跟家人朋友在一起，本身就是最好的礼物。

【二、投资篇：假期安排，收益不断档】

节日期间，资本市场休市，但我们的理财安排不能断档：

1. 资金提前规划：如果假期有用钱需求，提前做好资金安排，避免到时候取不出来。
2. 闲置资金打理：如果假期有闲置资金，可以选择一些短期灵活的理财产品，让假期也有收益。
3. 节后布局机会：利用假期时间，复盘一下自己的投资组合，为节后的操作做好准备。

【三、安全篇：提高警惕，守护好钱包】

节假日往往是各类诈骗的高发期，请大家务必提高警惕：

1. 警惕中奖诈骗："恭喜您中奖了"，凡是让你先交钱再领奖的，都是骗子。
2. 警惕冒充客服："您的订单有问题，需要退款"，不要点陌生链接，不要透露验证码。
3. 警惕投资理财诈骗："高收益、稳赚不赔"的投资项目，全是骗局。
4. 有疑问找官方：拿不准的时候，直接打官方客服电话核实。

【四、节后理财建议】

假期结束后，可以从以下几个方面重新梳理您的理财规划：

1. 盘点节日开支：看看假期花了多少钱，有没有超支，总结一下经验。
2. 检视投资组合：假期市场可能有变化，节后看看自己的持仓是否需要调整。
3. 制定新的目标：新的阶段，制定新的储蓄目标、投资目标，继续前行。

【结语】

最后，再次祝您节日快乐，阖家幸福，万事如意！

愿您的生活越来越美好，钱包越来越充实！

节后我们继续一起，打理财富，经营生活。

风险提示：以上内容仅供参考，不构成投资建议。市场有风险，投资需谨慎。
      `;
      publishTips = [
        '小红书：节日前1-2天发布，氛围感拉满。封面用节日元素+温暖配色，语气亲切像朋友聊天',
        '公众号：正式又温暖，既有祝福又有实用提醒，适合转发给家人朋友，传播性强',
        '互动引导：小红书问"这个节日怎么过"；公众号可以做"你的节日预算是多少"投票',
        '注意合规：节日文案以祝福和提醒为主，不要硬推产品，软植入更自然，效果更好'
      ];
      break;
      
    case 'personal':
      xhsTitles = [
        '做了5年理财顾问，我发现了一个扎心的真相...',
        '理财顾问的真实一天，跟你想的完全不一样',
        '为什么我还在做理财顾问？说说我的真心话'
      ];
      wxTitles = [
        '从业5年，一个理财顾问的自白：这份工作到底意味着什么？',
        '深度观察：理财顾问行业的真相与未来',
        '从销售到顾问：一个理财人的成长与思考'
      ];
      xhsBody = `
做理财顾问第5年，今天想跟大家说点掏心窝子的话💛

很多人对这个职业有误解，觉得我们就是"卖产品的"
每天打打电话、发发朋友圈，轻轻松松赚大钱

但真实情况是怎样的呢？

💛 理财顾问的真实一天

🌅 早上7:00 到公司
先看隔夜美股、读研报、整理当日市场要点
每天早上的学习时间，雷打不动

📋 上午9:00-12:00 客户面谈
平均每天见2-3个客户，帮他们做资产检视、解答疑问
有时候一聊就是一两个小时，连喝水的时间都没有

📚 中午12:30 充电学习
行业知识更新太快了，一天不学就跟不上
吃午饭的同时听个线上讲座，都是常态

💻 下午14:00-18:00 方案+跟进
给客户做配置方案、跟进产品情况、整理资料
还要准备各种分享会、培训

🏃 晚上20:00 健身+复盘
身体是革命的本钱，再忙也要运动
睡前再复盘一下今天的工作，想想哪里可以改进

💛 我为什么还在坚持？

说实话，这行真的挺累的，压力也大
但我还是很热爱这份工作，为什么？

因为有意义啊！
每次帮客户避开了一个坑、赚到了钱、实现了小目标
看到他们发来的感谢，那种成就感，真的是钱买不来的

做理财顾问越久，越觉得我们不是在卖产品
而是在帮别人规划人生——买房、育儿、养老、传承
这些人生大事，都跟钱有关，也都跟我们有关

能参与到客户的人生中，陪他们一起走过，真的很幸运。

💛 最后想跟大家说

投资到最后，拼的不是技术，是人性。
不贪、不惧、有耐心、能坚持，这些品质比什么都重要。
理财是这样，做人也是这样。

❤️ 关注我，一个有温度的理财顾问
有什么理财问题，评论区问我，看到都会回~

#理财顾问 #金融从业者 #职场日常 #投资感悟 #真实记录 #理财人 #职场vlog #投资理财
      `;
      wxBody = `
【引言】

在金融行业从业多年，经常有人问我：理财顾问到底是做什么的？你们是不是就是卖产品的？今天，我想以一个从业者的视角，跟大家聊聊这个职业的真相，以及我对这个行业的一些思考。

【一、理财顾问不是"卖产品的"】

很多人对理财顾问的印象停留在"产品销售"——每天打电话推销产品，靠佣金赚钱。

我不否认，销售是我们工作的一部分，但这绝对不是全部。

一个真正专业的理财顾问，做的事情要多得多：
- 财务诊断：全面了解客户的财务状况，找出问题和风险点
- 需求分析：搞清楚客户真正想要什么，短期和长期的目标是什么
- 方案制定：根据客户的情况，量身定制资产配置方案
- 产品筛选：从市场上几千只产品中，选出适合客户的
- 持续服务：定期检视、动态调整，陪伴客户走过市场的起起落落

简单来说，理财顾问更像是"财富管家"——帮客户把钱安排明白，让生活更有底气。

【二、这个行业正在发生变化】

我刚入行的时候，这个行业确实比较粗放——大家比拼的是谁卖的产品多、谁的佣金高。

但这些年，变化真的很大：

1. 从"产品导向"到"客户导向"
以前是"我有什么产品就卖什么"，现在是"客户需要什么就推荐什么"。这个转变说起来容易，做起来难，但确实在发生。

2. 从"单打独斗"到"专业分工"
以前一个理财顾问什么都要懂，现在越来越强调团队协作——投资研究、产品筛选、客户服务，各有专人负责。

3. 从"一锤子买卖"到"长期服务"
以前卖完产品就完事了，现在更看重长期服务关系。真正优秀的理财顾问，客户会跟他十几年，甚至一辈子。

【三、一个好的理财顾问，能给你带来什么？】

有人可能会问：我自己也能买基金买股票，为什么需要理财顾问？

我的答案是：专业的事交给专业的人，能帮你少走很多弯路。

具体来说，一个好的理财顾问能给你带来三样东西：

第一，节省时间。
市场上有几千只基金、几万种产品，你不需要一只一只去研究。专业的人帮你筛选，你只需要做选择题就行。

第二，控制情绪。
市场大涨的时候，有人提醒你别追高；市场大跌的时候，有人安慰你别恐慌。投资中，情绪控制比技术分析更重要。

第三，全局规划。
理财不只是投资，还包括保险、税务、传承、养老等等。一个好的顾问，能帮你做全局的规划，而不只是卖几款产品。

【四、给大家的几点建议】

如果你正在找理财顾问，或者已经有顾问了，给你几点建议：

1. 看专业度：他有没有真才实学，还是只会背话术？问几个深入的问题，一试便知。
2. 看立场：他是站在你的角度考虑问题，还是只想卖产品拿佣金？从细节能看出来。
3. 看长期：好的顾问关系是长期的，不要只看一两次的服务。路遥知马力，日久见人心。
4. 自己也要学：不要把所有事都交给顾问，自己也要懂一些基本的理财知识。你懂的越多，越能判断顾问靠不靠谱。

【结语】

从业这些年，我最大的感悟是：理财顾问这份工作，最终拼的不是专业能力，而是人品和信任。

客户把钱交给你，是因为信任你。这份信任，比什么都重。

我会继续在这条路上走下去，做一个有温度、有专业、有底线的理财顾问。

也希望每一位读者，都能找到适合自己的理财顾问，打理好自己的财富，过上想要的生活。

风险提示：以上内容仅为个人观点，不构成投资建议。市场有风险，投资需谨慎。
      `;
      publishTips = [
        '小红书：走"真实人设"路线，多分享工作日常和个人感悟，拉近与读者的距离，信任感是关键',
        '公众号：更有深度和思考，适合行业观察和职业感悟类内容，容易引发从业者共鸣和转发',
        '人设一致性：不管哪个平台，人设要统一——专业、真诚、有温度，不要来回变',
        '注意合规：个人感悟类内容风险较低，但涉及投资观点时，仍需加风险提示，避免违规'
      ];
      break;
  }
  
  const html = `
    <div class="media-section">
      <h4>📕 小红书风格文案</h4>
      <p class="media-label">✨ 标题建议（3选1）：</p>
      <div class="media-titles">
        <p class="media-title xhs">① ${xhsTitles[0]}</p>
        <p class="media-title xhs">② ${xhsTitles[1]}</p>
        <p class="media-title xhs">③ ${xhsTitles[2]}</p>
      </div>
      <p class="media-label">📝 正文内容：</p>
      <div class="media-body xhs-body">
        ${xhsBody.split('\n').map(line => line.trim() ? `<p>${line}</p>` : '').join('')}
      </div>
    </div>
    
    <div class="media-section">
      <h4>💚 公众号风格长文</h4>
      <p class="media-label">✨ 标题建议（3选1）：</p>
      <div class="media-titles">
        <p class="media-title wx">① ${wxTitles[0]}</p>
        <p class="media-title wx">② ${wxTitles[1]}</p>
        <p class="media-title wx">③ ${wxTitles[2]}</p>
      </div>
      <p class="media-label">📝 正文内容：</p>
      <div class="media-body wx-body">
        ${wxBody.split('\n').map(line => line.trim() ? `<p>${line}</p>` : '').join('')}
      </div>
    </div>
    
    <div class="media-section">
      <h4>💡 发布建议</h4>
      <ul>
        ${publishTips.map(tip => `<li>${tip}</li>`).join('')}
      </ul>
    </div>
  `;
  
  return html;
}

// 素材工厂当前状态
let currentMaterialType = 'product';  // 当前选中的素材类型
let currentMaterialFormat = 'moments'; // 当前选中的输出格式
let uploadedMaterialImage = null;     // 上传的素材图片
let uploadedMaterialText = '';        // 上传的素材文本

function initMaterial() {
  const typeCards = document.querySelectorAll('.material-type-card');
  const genBtn = document.getElementById('gen-material');
  const emptyState = document.getElementById('material-empty');
  const content = document.getElementById('material-content');
  const matFormatTabs = document.querySelectorAll('.mat-format-tab');
  const matFormatPanels = document.querySelectorAll('.mat-format-panel');
  const outputFormatCards = document.querySelectorAll('.output-format-card');
  
  // 上传区域相关元素
  const uploadArea = document.getElementById('material-upload-area');
  const fileInput = document.getElementById('material-file-input');
  const uploadBtn = document.getElementById('material-upload-btn');
  const textToggleBtn = document.getElementById('material-text-toggle-btn');
  const textArea = document.getElementById('material-text-area');
  const textInput = document.getElementById('material-text-input');
  const textCancelBtn = document.getElementById('material-text-cancel-btn');
  const textConfirmBtn = document.getElementById('material-text-confirm-btn');
  const uploadPreview = document.getElementById('material-upload-preview');
  const previewImg = document.getElementById('material-preview-img');
  const reuploadBtn = document.getElementById('material-reupload-btn');
  const textPreview = document.getElementById('material-text-preview');
  const textPreviewContent = document.getElementById('material-text-preview-content');
  const textReeditBtn = document.getElementById('material-text-reedit-btn');
  
  // ==========================================
  // 1. 素材类型选择
  // ==========================================
  typeCards.forEach(card => {
    card.addEventListener('click', function() {
      const type = this.dataset.type;
      
      typeCards.forEach(c => c.classList.remove('active'));
      this.classList.add('active');
      
      currentMaterialType = type;
      
      // 不同素材类型可以有不同的提示文案
      // TODO: 根据素材类型调整上传区域的提示文案和生成逻辑
    });
  });
  
  // ==========================================
  // 2. 上传区域 - 图片上传
  // ==========================================
  if (uploadBtn && fileInput) {
    uploadBtn.addEventListener('click', function() {
      fileInput.click();
    });
  }
  
  if (fileInput) {
    fileInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (file) {
        handleMaterialImageUpload(file);
      }
    });
  }
  
  // 拖拽上传
  if (uploadArea) {
    uploadArea.addEventListener('dragover', function(e) {
      e.preventDefault();
      uploadArea.classList.add('drag-over');
    });
    
    uploadArea.addEventListener('dragleave', function(e) {
      e.preventDefault();
      uploadArea.classList.remove('drag-over');
    });
    
    uploadArea.addEventListener('drop', function(e) {
      e.preventDefault();
      uploadArea.classList.remove('drag-over');
      
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        handleMaterialImageUpload(file);
      } else {
        showToast('请上传图片文件', 'warning');
      }
    });
  }
  
  // 粘贴图片
  document.addEventListener('paste', function(e) {
    // 只在素材工厂 tab 激活时处理
    const materialTab = document.getElementById('tab-material');
    if (!materialTab || !materialTab.classList.contains('active')) return;
    
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        handleMaterialImageUpload(file);
        break;
      }
    }
  });
  
  // 处理图片上传
  function handleMaterialImageUpload(file) {
    if (!file.type.startsWith('image/')) {
      showToast('请上传图片文件', 'warning');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
      uploadedMaterialImage = e.target.result;
      
      if (previewImg) {
        previewImg.src = e.target.result;
      }
      
      // 显示图片预览，隐藏上传区域和文本区域
      if (uploadArea) uploadArea.style.display = 'none';
      if (textArea) textArea.style.display = 'none';
      if (textPreview) textPreview.style.display = 'none';
      if (uploadPreview) uploadPreview.style.display = 'flex';
      
      uploadedMaterialText = '';
      showToast('图片上传成功');
    };
    reader.readAsDataURL(file);
  }
  
  // 重新上传
  if (reuploadBtn) {
    reuploadBtn.addEventListener('click', function() {
      uploadedMaterialImage = null;
      if (uploadPreview) uploadPreview.style.display = 'none';
      if (uploadArea) uploadArea.style.display = 'flex';
      if (fileInput) fileInput.value = '';
    });
  }
  
  // ==========================================
  // 3. 上传区域 - 文本粘贴
  // ==========================================
  if (textToggleBtn) {
    textToggleBtn.addEventListener('click', function() {
      if (uploadArea) uploadArea.style.display = 'none';
      if (textArea) textArea.style.display = 'block';
      if (textInput) textInput.focus();
    });
  }
  
  if (textCancelBtn) {
    textCancelBtn.addEventListener('click', function() {
      if (textArea) textArea.style.display = 'none';
      if (uploadArea) uploadArea.style.display = 'flex';
      if (textInput) textInput.value = '';
    });
  }
  
  if (textConfirmBtn && textInput) {
    textConfirmBtn.addEventListener('click', function() {
      const text = textInput.value.trim();
      if (!text) {
        showToast('请输入文本内容', 'warning');
        return;
      }
      
      uploadedMaterialText = text;
      
      if (textPreviewContent) {
        textPreviewContent.textContent = text;
      }
      
      // 显示文本预览
      if (textArea) textArea.style.display = 'none';
      if (uploadArea) uploadArea.style.display = 'none';
      if (uploadPreview) uploadPreview.style.display = 'none';
      if (textPreview) textPreview.style.display = 'block';
      
      showToast('文本已确认');
    });
  }
  
  if (textReeditBtn) {
    textReeditBtn.addEventListener('click', function() {
      if (textPreview) textPreview.style.display = 'none';
      if (textArea) textArea.style.display = 'block';
      if (textInput) {
        textInput.value = uploadedMaterialText;
        textInput.focus();
      }
    });
  }
  
  // ==========================================
  // 4. 输出形式选择（可多选）
  // ==========================================
  outputFormatCards.forEach(card => {
    card.addEventListener('click', function(e) {
      // 阻止 label 的默认行为，手动控制 checkbox
      e.preventDefault();
      const checkbox = this.querySelector('input[type="checkbox"]');
      if (checkbox) {
        checkbox.checked = !checkbox.checked;
        this.classList.toggle('active', checkbox.checked);
      }
    });
  });
  
  // ==========================================
  // 5. 生成素材
  // ==========================================
  if (genBtn) {
    genBtn.addEventListener('click', function() {
      // 检查是否有上传内容
      if (!uploadedMaterialImage && !uploadedMaterialText) {
        showToast('请先上传素材图片或粘贴文本', 'warning');
        return;
      }
      
      // 检查是否选中了输出形式
      const selectedFormats = document.querySelectorAll('.output-format-card input[type="checkbox"]:checked');
      if (selectedFormats.length === 0) {
        showToast('请至少选择一种输出形式', 'warning');
        return;
      }
      
      genBtn.classList.add('loading');
      genBtn.disabled = true;
      
      // 接入实际的内容生成逻辑
      setTimeout(() => {
        const type = currentMaterialType;
        const text = uploadedMaterialText;
        const image = uploadedMaterialImage;
        
        // 获取选中的输出形式
        const selectedFormats = [];
        document.querySelectorAll('.output-format-card input[type="checkbox"]:checked').forEach(cb => {
          selectedFormats.push(cb.value);
        });
        
        // 所有输出形式映射
        const formatMap = {
          moments: { container: 'mat-moments-text', panel: 'mat-format-moments', tab: 'moments', fn: generateMaterialMoments },
          chat: { container: 'mat-chat-text', panel: 'mat-format-chat', tab: 'chat', fn: generateMaterialChat },
          group: { container: 'mat-group-text', panel: 'mat-format-group', tab: 'group', fn: generateMaterialGroup },
          phone: { container: 'mat-phone-text', panel: 'mat-format-phone', tab: 'phone', fn: generateMaterialPhone },
          video: { container: 'mat-video-text', panel: 'mat-format-video', tab: 'video', fn: generateMaterialVideo },
          media: { container: 'mat-media-text', panel: 'mat-format-media', tab: 'media', fn: generateMaterialMedia }
        };
        
        // 先隐藏所有 tab 和 panel
        matFormatTabs.forEach(tab => {
          const tabFormat = tab.dataset.format;
          if (selectedFormats.includes(tabFormat)) {
            tab.style.display = '';
          } else {
            tab.style.display = 'none';
          }
        });
        
        matFormatPanels.forEach(panel => {
          panel.style.display = 'none';
        });
        
        // 生成选中的输出形式内容
        let firstFormat = null;
        selectedFormats.forEach(format => {
          const cfg = formatMap[format];
          if (!cfg) return;
          
          const el = document.getElementById(cfg.container);
          if (el) {
            const html = cfg.fn(type, text, image);
            el.innerHTML = html;
          }
          
          if (!firstFormat) {
            firstFormat = format;
          }
        });
        
        // 默认显示第一个选中的 tab
        if (firstFormat) {
          matFormatTabs.forEach(tab => {
            if (tab.dataset.format === firstFormat) {
              tab.classList.add('active');
            } else {
              tab.classList.remove('active');
            }
          });
          
          const firstPanel = document.getElementById('mat-format-' + firstFormat);
          if (firstPanel) {
            firstPanel.style.display = 'block';
          }
          
          currentMaterialFormat = firstFormat;
        }
        
        // 显示结果区域
        if (emptyState) emptyState.style.display = 'none';
        if (content) content.style.display = 'block';
        
        // 刷新 lucide 图标
        if (typeof refreshIcons === 'function') {
          refreshIcons();
        }
        
        genBtn.classList.remove('loading');
        genBtn.disabled = false;
        showToast('素材生成成功！');
        
        if (content) {
          content.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 1500);
    });
  }
  
  // ==========================================
  // 6. 生成结果格式切换
  // ==========================================
  matFormatTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      const format = this.dataset.format;
      
      matFormatTabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      
      matFormatPanels.forEach(panel => panel.style.display = 'none');
      const targetPanel = document.getElementById('mat-format-' + format);
      if (targetPanel) {
        targetPanel.style.display = 'block';
      }
      
      currentMaterialFormat = format;
    });
  });
}

// ============================================
// Tab 5: 客户画像
// ============================================

function initCustomer() {
  const genBtn = document.getElementById('gen-marketing-plan');
  const emptyState = document.getElementById('customer-empty');
  const content = document.getElementById('lifecycle-content');

  // ===== 单选标签组（年龄/风险/资产） =====
  const singleGroups = ['age', 'risk', 'asset'];
  singleGroups.forEach(group => {
    const tags = document.querySelectorAll(`[data-tag="${group}"]`);
    tags.forEach(tag => {
      tag.addEventListener('click', function() {
        tags.forEach(t => t.classList.remove('active'));
        this.classList.add('active');
      });
    });
  });

  // ===== 多选标签组（关注领域） =====
  const multiTags = document.querySelectorAll('[data-tag="focus"]');
  multiTags.forEach(tag => {
    tag.addEventListener('click', function() {
      this.classList.toggle('active');
    });
  });

  // ===== 产品类型卡片选择 =====
  const productCards = document.querySelectorAll('.product-card');
  productCards.forEach(card => {
    card.addEventListener('click', function() {
      productCards.forEach(c => c.classList.remove('active'));
      this.classList.add('active');
    });
  });

  // ===== 产品细节补充 - 选项卡切换 =====
  const detailTabs = document.querySelectorAll('.product-detail-tab');
  const detailPanels = document.querySelectorAll('.product-detail-panel');
  detailTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      const target = this.dataset.detailTab;
      detailTabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      detailPanels.forEach(panel => {
        panel.style.display = panel.dataset.detailPanel === target ? 'block' : 'none';
      });
    });
  });

  // ===== 产品细节补充 - 图片上传 =====
  const uploadArea = document.getElementById('product-upload-area');
  const imageInput = document.getElementById('product-image-input');
  const previewArea = document.getElementById('product-upload-preview');
  const previewImg = document.getElementById('product-preview-img');
  const reuploadBtn = document.getElementById('product-reupload-btn');

  if (uploadArea && imageInput) {
    uploadArea.addEventListener('click', () => imageInput.click());

    // 拖拽上传
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = 'var(--accent)';
      uploadArea.style.background = 'var(--accent-soft)';
    });
    uploadArea.addEventListener('dragleave', () => {
      uploadArea.style.borderColor = '';
      uploadArea.style.background = '';
    });
    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = '';
      uploadArea.style.background = '';
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        handleImageUpload(file);
      }
    });

    imageInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) handleImageUpload(file);
    });
  }

  if (reuploadBtn) {
    reuploadBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      previewArea.style.display = 'none';
      uploadArea.style.display = 'block';
      imageInput.value = '';
      previewImg.src = '';
    });
  }

  function handleImageUpload(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target.result;
      uploadArea.style.display = 'none';
      previewArea.style.display = 'block';
    };
    reader.readAsDataURL(file);
  }

  // ===== 生成产品营销方案 =====
  genBtn.addEventListener('click', function() {
    const productActive = document.querySelector('.product-card.active');
    if (!productActive) {
      showToast('请选择营销产品类型', 'warning');
      return;
    }

    const focusSelected = document.querySelectorAll('[data-tag="focus"].active').length;
    if (focusSelected === 0) {
      showToast('请至少选择一个关注领域', 'warning');
      return;
    }

    genBtn.classList.add('loading');
    genBtn.disabled = true;

    setTimeout(() => {
      const profile = getCustomerProfile();
      renderOverviewCard(profile);
      renderLifecycleTimeline(profile);

      emptyState.style.display = 'none';
      content.style.display = 'block';
      genBtn.classList.remove('loading');
      genBtn.disabled = false;
      showToast('产品营销方案生成成功！');

      content.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // 刷新 Lucide 图标
      if (typeof refreshIcons === 'function') {
        refreshIcons();
      }
    }, 1500);
  });

  // ===== 时间轴步骤复制按钮（事件委托） =====
  document.addEventListener('click', function(e) {
    const copyBtn = e.target.closest('.timeline-copy-btn');
    if (!copyBtn) return;
    const stepEl = copyBtn.closest('.timeline-step');
    if (!stepEl) return;
    const stepNum = stepEl.querySelector('.timeline-step-num')?.textContent || '';
    const stepTitle = stepEl.querySelector('.timeline-title')?.textContent || '';
    const stepDesc = stepEl.querySelector('.timeline-desc')?.textContent || '';
    const sections = stepEl.querySelectorAll('.timeline-section');
    let text = `【第${stepNum}步：${stepTitle}】\n${stepDesc}\n\n`;
    sections.forEach(sec => {
      const label = sec.querySelector('.timeline-section-label')?.textContent?.trim() || '';
      if (sec.classList.contains('actions')) {
        const items = sec.querySelectorAll('li');
        text += `${label}：\n`;
        items.forEach(item => {
          text += `• ${item.textContent.trim()}\n`;
        });
      } else {
        const contentText = sec.querySelector('.timeline-section-text')?.textContent?.trim() || '';
        text += `${label}：\n${contentText}\n`;
      }
      text += '\n';
    });
    copyToClipboard(text.trim());
  });

  // ===== 渠道文案独立复制按钮（事件委托） =====
  document.addEventListener('click', function(e) {
    const channelCopyBtn = e.target.closest('.channel-copy-btn');
    if (!channelCopyBtn) return;
    const stepNum = channelCopyBtn.dataset.step;
    const channel = channelCopyBtn.dataset.channel;
    const contentEl = document.getElementById(`channel-content-${stepNum}-${channel}`);
    if (contentEl) {
      copyToClipboard(contentEl.innerText);
    }
  });
}

// ===== 获取当前客户画像数据 =====
function getCustomerProfile() {
  const age = document.querySelector('[data-tag="age"].active').dataset.value;
  const ageText = document.querySelector('[data-tag="age"].active').textContent;
  const risk = document.querySelector('[data-tag="risk"].active').dataset.value;
  const riskText = document.querySelector('[data-tag="risk"].active').textContent;
  const asset = document.querySelector('[data-tag="asset"].active').dataset.value;
  const assetText = document.querySelector('[data-tag="asset"].active').textContent;
  const focusEls = document.querySelectorAll('[data-tag="focus"].active');
  const focus = [];
  const focusText = [];
  focusEls.forEach(el => {
    focus.push(el.dataset.value);
    focusText.push(el.textContent);
  });
  const desc = document.getElementById('customer-desc')?.value || '';
  const product = document.querySelector('.product-card.active')?.dataset.product || 'fund';
  const productText = document.querySelector('.product-card.active .product-name')?.textContent || '基金';
  const productDescText = document.querySelector('.product-card.active .product-desc')?.textContent || '';

  // 产品细节补充
  const productDetailText = document.getElementById('product-detail-text')?.value || '';
  const productDetailImage = document.getElementById('product-preview-img')?.src || '';
  const hasProductDetail = productDetailText.trim().length > 0 || (productDetailImage && productDetailImage.length > 100);

  return { age, ageText, risk, riskText, asset, assetText, focus, focusText, desc, product, productText, productDescText, productDetailText, hasProductDetail };
}

// ===== 渲染客户画像概览卡片 =====
function renderOverviewCard(profile) {
  const tagsContainer = document.getElementById('overview-tags');
  const goalContainer = document.getElementById('overview-goal');
  const detailContainer = document.getElementById('overview-product-detail');

  let tagsHtml = `
    <span class="profile-tag">${profile.ageText}</span>
    <span class="profile-tag">${profile.riskText}</span>
    <span class="profile-tag">${profile.assetText}</span>
  `;
  profile.focusText.forEach(f => {
    tagsHtml += `<span class="profile-tag">关注${f}</span>`;
  });
  tagsContainer.innerHTML = tagsHtml;

  goalContainer.innerHTML = `
    <span>营销产品：</span>
    <span class="goal-badge">${profile.productText}</span>
    <span style="color: var(--muted2); font-size: 11px;">${profile.productDescText}</span>
  `;

  if (profile.hasProductDetail) {
    detailContainer.style.display = 'flex';
    detailContainer.innerHTML = `
      <span class="product-detail-badge">
        <span>✓</span>
        已补充产品细节
      </span>
    `;
  } else {
    detailContainer.style.display = 'none';
    detailContainer.innerHTML = '';
  }
}

// ============================================
// 客户画像 - 多渠道文案生成引擎
// ============================================

// 步骤与渠道对应关系配置
const stepChannelMap = {
  1: ['moments', 'group'],           // 热点促达：朋友圈图文 + 社群分享
  2: ['moments', 'chat'],            // 投教培育：朋友圈图文 + 私聊/群发
  3: ['moments', 'chat'],            // 场景种草：朋友圈图文 + 私聊/群发
  4: ['chat', 'phone'],              // 产品介绍：私聊/群发 + 电话沟通
  5: ['moments', 'chat'],            // 活动推荐：朋友圈图文 + 私聊/群发
  6: ['chat', 'phone'],              // 转化跟进：私聊/群发 + 电话沟通
  7: ['phone', 'chat'],              // 异议处理：电话沟通 + 私聊/群发
  8: ['chat', 'moments']             // 成交转介：私聊/群发 + 朋友圈图文
};

// 渠道显示名称和图标
const channelInfo = {
  moments: { name: '朋友圈图文', icon: '📱' },
  chat: { name: '私聊/群发', icon: '💬' },
  group: { name: '社群分享', icon: '👥' },
  phone: { name: '电话沟通', icon: '📞' }
};

// ===== 根据风险偏好定制话术风格 =====
const riskStyle = {
  conservative: {
    tone: '稳健、保守、强调安全',
    keyword: '本金安全、稳健增值、风险可控',
    intensity: '低风险、稳收益'
  },
  balanced: {
    tone: '平衡、专业、稳中求进',
    keyword: '资产配置、攻守兼备、长期稳健',
    intensity: '中风险、合理收益'
  },
  aggressive: {
    tone: '进取、专业、把握机会',
    keyword: '成长机会、超额收益、长期赛道',
    intensity: '高风险、高收益'
  }
};

// ===== 根据年龄段定制场景 =====
const ageScene = {
  young: {
    scenes: ['职场晋升加薪', '买房首付', '结婚生子', '旅行充电'],
    painPoint: '收入有限但有成长空间，想攒钱又想享受生活',
    moneyDesc: '第一桶金',
    address: '你'
  },
  middle: {
    scenes: ['子女教育', '房贷压力', '父母养老', '职业瓶颈'],
    painPoint: '上有老下有小，家庭责任重，追求资产稳健增值',
    moneyDesc: '家庭备用金',
    address: '您'
  },
  senior: {
    scenes: ['退休养老', '医疗保障', '财富传承', '旅游休闲'],
    painPoint: '风险承受能力下降，追求本金安全和稳定现金流',
    moneyDesc: '养老钱',
    address: '您'
  }
};

// ===== 6种产品类型的完整差异化配置 =====
const productConfig = {
  fund: {
    name: '基金',
    hotTopics: {
      conservative: '最近债市行情不错，纯债基金收益挺稳的，您有关注吗？',
      balanced: '最近市场震荡，固收+产品表现还挺稳的，进可攻退可守',
      aggressive: '最近科技板块涨得不错，相关主题基金收益很亮眼'
    },
    edTopics: {
      conservative: '「债券基金为什么比存款收益高？风险在哪里？」',
      balanced: '「基金定投：普通人的懒人理财法」',
      aggressive: '「为什么说主动基金能跑赢指数？选基的3个关键」'
    },
    scenePitches: {
      young: '「刚工作那几年，我每个月发了工资就先扣2000块定投基金，3年下来也攒了快8万了，比放余额宝强多了。你也可以试试，就当强制储蓄了」',
      middle: '「您家孩子现在多大？我身边很多家长从小学就开始给孩子做基金定投当教育金，说是长期下来收益比存款好不少，您有了解过吗？」',
      senior: '「叔叔/阿姨，现在存款利率越来越低，您有没有考虑过拿一部分钱买点债券基金？收益比存款高一些，风险也不大，挺适合打理养老钱的」'
    },
    productSelling: {
      conservative: '债券型基金，波动小、收益稳，历史年化4%-6%左右，比存款收益高一个档次',
      balanced: '混合型基金，股债搭配，进可攻退可守，长期年化6%-10%，适合稳健增值',
      aggressive: '优质主动权益基金，长期持有享受企业成长红利，历史年化10%-15%，适合追求高收益'
    },
    activities: ['新客申购费1折', '定投训练营，坚持打卡返红包', '基金诊断免费服务'],
    objections: [
      {
        q: '基金会不会亏钱？',
        a: '您的担心我特别理解。不同类型的基金风险不一样，像债券基金波动就很小，历史上亏损的概率非常低。就算是股票型基金，只要持有时间够长，亏钱的概率也会大大降低。关键是要选适合自己风险承受能力的产品。'
      },
      {
        q: '手续费太高了吧？',
        a: '其实基金的管理费是按年收取的，而且现在很多渠道申购费都打1折，算下来成本并不高。关键是看产品能不能帮您赚到钱，好的基金一年收益可能就覆盖好几年的费用了。'
      },
      {
        q: '选基太难了，不知道买哪个好',
        a: '选基金确实需要专业知识，这也是我们理财顾问存在的价值嘛。我会根据您的风险偏好、投资期限，帮您筛选出合适的基金，而且后续也会持续跟踪，有变化及时提醒您。'
      }
    ],
    referral: {
      young: '「如果你觉得我推荐的基金还不错，身边有朋友也想学习基金投资的，欢迎推荐给我，我会给你朋友做免费的基金诊断~」',
      middle: '「您身边有没有也在做基金投资的朋友？可以拉个群，我定期给大家分享市场观点和基金策略，不推销产品，就是纯交流」',
      senior: '「叔叔/阿姨，如果您觉得这个基金还不错，身边的老同事老朋友问起的话，也可以帮我推荐推荐，谢谢您啦~」'
    },
    tone: '专业、数据驱动、强调长期价值'
  },
  insurance: {
    name: '保险',
    hotTopics: {
      conservative: '最近看到一个新闻，一场大病就花光了全家积蓄，您说保险是不是还挺重要的？',
      balanced: '人口老龄化越来越严重了，以后养老还得靠自己提前规划，您说是吧？',
      aggressive: '最近重疾险新产品挺多的，性价比越来越高，您有关注过吗？'
    },
    edTopics: {
      conservative: '「医保不够用？为什么还需要商业保险？」',
      balanced: '「家庭保险配置的黄金顺序：先大人后小孩」',
      aggressive: '「增额终身寿：锁定长期利率的理财工具」'
    },
    scenePitches: {
      young: '「我们这个年纪，最怕的就是生病，一场大病可能就把积蓄花光了。其实一年花几千块买份重疾险，就能有几十万的保障，你有考虑过吗？」',
      middle: '「您家孩子是家里的宝贝，但是您知道吗？大人才是孩子最大的保障。您和爱人的保险都配齐了吗？万一有什么事，孩子的生活教育也能有个着落」',
      senior: '「叔叔/阿姨，您现在身体还好，但是人年纪大了医疗支出肯定会增加。现在有些医疗险一年才几百块，就能有几百万的保障，您了解过吗？」'
    },
    productSelling: {
      conservative: '纯保障型产品，用最少的钱撬动最高的保额，给家人一份安心',
      balanced: '保障+储蓄组合，既有重疾/医疗保障，又有年金储蓄，一张保单解决多个问题',
      aggressive: '增额终身寿，保额逐年递增，灵活支取，长期复利增值，兼顾保障和理财'
    },
    activities: ['免费家庭保障诊断', '限时免体检额度', '投保送健康体检套餐'],
    objections: [
      {
        q: '保险收益太低了，不如买理财',
        a: '您说得对，保险的收益确实不如理财产品高。但保险的核心功能是保障，不是收益。您想想，万一生了大病，理财能赔您几十万吗？保险就是用很少的钱，转移那些我们承担不起的风险。理财和保险，各司其职，缺一不可。'
      },
      {
        q: '流动性太差，钱拿不出来',
        a: '保险确实是长期规划，但也不是完全取不出来。像增额终身寿就可以灵活减保取现，年金险也有保单贷款功能。关键是您要把钱分好，一部分放灵活的，一部分做长期规划，这样既有流动性又有长期保障。'
      },
      {
        q: '理赔难，买的时候说得好，赔的时候各种拒',
        a: '您的顾虑我特别理解，确实有这样的情况。但其实只要投保时如实告知、理赔时符合条款，保险公司都会正常赔付的。我作为您的保险顾问，会帮您把好投保关，真到理赔的时候也会全程协助，您不用操心。'
      }
    ],
    referral: {
      young: '「如果你觉得我给你做的保障方案还不错，身边有朋友也在考虑买保险的，欢迎推荐给我，我会给他们做免费的保障诊断~」',
      middle: '「您身边有没有刚当爸妈的朋友？很多新手爸妈都不知道怎么给孩子和自己配保险，可以推荐给我，我免费帮他们做方案」',
      senior: '「叔叔/阿姨，如果您觉得这个保险还不错，身边的老同事老朋友问起的话，也可以帮我推荐推荐，谢谢您啦~」'
    },
    tone: '温情、有安全感、强调保障和责任'
  },
  deposit: {
    name: '存款',
    hotTopics: {
      conservative: '存款利率又降了，您有没有感觉钱放银行越来越不值钱了？',
      balanced: '最近银行理财都在跌，还是存款最踏实，您说对吧？',
      aggressive: 'LPR又下调了，存款利率还有下行空间，要不要提前锁定一下？'
    },
    edTopics: {
      conservative: '「存款保险保什么？50万以内绝对安全」',
      balanced: '「存款怎么存利息最高？阶梯存款法了解一下」',
      aggressive: '「利率下行期，如何锁定长期收益？」'
    },
    scenePitches: {
      young: '「你平时的钱都放哪里呀？我建议你把3-6个月的生活费放在活期存款里当备用金，剩下的可以买点定期存款，利息更高一些，反正也是强制储蓄」',
      middle: '「孩子的学费、老人的医药费，这些钱可不能亏。我建议您专门开一个账户存起来，用大额存单的方式，利息比普通存款高，而且保本保息，绝对安全」',
      senior: '「叔叔/阿姨，您的养老钱可得放稳当了。现在存款利率一直在降，我建议您可以存一笔3年期的大额存单，把利率锁定住，以后就算再降息也不怕」'
    },
    productSelling: {
      conservative: '大额存单，保本保息，受存款保险保障，利率比普通定期高0.2-0.5个百分点',
      balanced: '结构性存款，保本基础上有收益增强空间，最高能到4%左右，适合想搏一点收益又怕亏的客户',
      aggressive: '阶梯存款组合，1年+2年+3年搭配，既有流动性又能享高利率，灵活应对利率变化'
    },
    activities: ['新客专享存款利率上浮', '存款达标送礼品', '大额存单优先额度'],
    objections: [
      {
        q: '收益太低了，跑不赢通胀',
        a: '您说得没错，存款收益确实不高，跑不赢通胀也是事实。但存款最大的优势是安全，是您资产的"压舱石"。您想想，万一急用钱的时候，其他资产可能在亏损卖不掉，但存款随时能用。理财讲究的是配置，不能把所有钱都拿去追求高收益，得有一部分稳的。'
      },
      {
        q: '提前支取损失利息，太不灵活了',
        a: '这个问题很好解决。您可以用"阶梯存款法"，把钱分成几份存不同期限，这样每年都有到期的钱，既有高利息又有流动性。而且现在很多银行的大额存单也支持转让，急用钱的时候可以转让出去，损失很小。'
      },
      {
        q: '银行会不会倒闭？我的钱安全吗？',
        a: '这个您完全不用担心。我们国家有存款保险制度，同一个人在同一家银行50万以内的存款，就算银行出问题了也会全额赔付。而且我们是正规银行，资本充足率远高于监管要求，安全性是有保障的。'
      }
    ],
    referral: {
      young: '「如果你觉得我们银行的存款产品还不错，身边有朋友也想找稳健理财的，欢迎推荐过来，新客户还有专属利率优惠~」',
      middle: '「您身边有没有也在为孩子教育金、老人养老钱发愁的朋友？可以推荐给我，我帮他们做一个稳健的存款规划」',
      senior: '「叔叔/阿姨，如果您觉得我们的存款产品还不错，身边的老同事老朋友问起的话，也可以帮我推荐推荐，谢谢您啦~」'
    },
    tone: '稳健、安全、强调保本保息和确定性'
  },
  wealth: {
    name: '理财产品',
    hotTopics: {
      conservative: '最近银行理财净值波动挺大的，您买的理财还好吗？',
      balanced: '资管新规之后，理财产品都净值化了，选理财的思路也得变一变',
      aggressive: '最近权益市场行情不错，权益类理财收益挺亮眼的'
    },
    edTopics: {
      conservative: '「净值化时代，怎么选稳健的理财产品？」',
      balanced: '「R1到R5，理财产品风险等级怎么看？」',
      aggressive: '「理财产品也能投股票？权益类理财了解一下」'
    },
    scenePitches: {
      young: '「你平时闲钱都放哪里？我建议你可以买点中低风险的理财产品，收益比余额宝高不少，而且期限灵活，要用钱的时候赎回来也方便」',
      middle: '「家里的闲置资金，放存款吧收益太低，买基金吧又怕波动。其实理财产品是个不错的选择，风险等级从R1到R5都有，您可以根据自己的情况选，收益也比存款好一些」',
      senior: '「叔叔/阿姨，您的养老钱除了存银行，其实也可以配一点R2级别的理财产品，收益比存款高，风险也不大，我们很多老年客户都在买」'
    },
    productSelling: {
      conservative: 'R2级固定收益类理财，主要投债券和非标，风险很低，历史年化3.5%-4.5%左右',
      balanced: 'R3级混合类理财，股债搭配，以债为主少量权益，波动可控，长期收益4%-6%',
      aggressive: 'R4级权益类理财，主要投资股票市场，追求高收益，适合风险承受能力强的客户'
    },
    activities: ['新客专属理财，收益比普通高0.3%', '理财夜市，晚间专属高收益产品', '理财经理一对一配置服务'],
    objections: [
      {
        q: '不是说理财保本吗？怎么现在也会亏？',
        a: '您的感受我特别理解。资管新规之后，理财产品都净值化了，不再保本保息，这是行业的大趋势。但其实R2级别的理财，主要投的是债券，虽然短期会有波动，但持有到期基本都能达到预期收益。关键是要选对产品、持有足够长的时间。'
      },
      {
        q: '风险等级看不懂，不知道买哪个',
        a: '这个您放心，我来给您讲清楚。R1是最低风险，几乎不会亏；R2是中低风险，波动很小；R3是中等风险，会有一些波动；R4/R5风险就比较高了。我会根据您的风险承受能力，帮您选合适的产品。'
      },
      {
        q: '净值波动看着闹心，还不如存款踏实',
        a: '我特别理解，看着数字上下波动确实不舒服。但您要知道，净值波动不代表真的亏损，只要持有到期，大部分产品都能实现预期收益。而且正是因为有了这些波动，理财的收益才会比存款高。如果实在接受不了波动，您可以选期限短一点的，或者干脆就买存款，适合自己的才是最好的。'
      }
    ],
    referral: {
      young: '「如果你觉得我们的理财产品还不错，身边有朋友也在找稳健理财的，欢迎推荐过来，新客户还有专属高收益产品~」',
      middle: '「您身边有没有也在做理财配置的朋友？可以推荐给我，我免费帮他们做一个理财诊断，看看配置合不合理」',
      senior: '「叔叔/阿姨，如果您觉得这个理财还不错，身边的老同事老朋友问起的话，也可以帮我推荐推荐，谢谢您啦~」'
    },
    tone: '平衡、专业、强调资产配置和多元选择'
  },
  stock: {
    name: '股票/权益',
    hotTopics: {
      conservative: '最近市场跌得挺多的，很多优质股票估值都很便宜了，您觉得呢？',
      balanced: '最近政策利好不断，市场底部信号越来越明显了',
      aggressive: 'AI/新能源/半导体，这个赛道太火了，您有没有布局？'
    },
    edTopics: {
      conservative: '「高股息策略：熊市中的避风港」',
      balanced: '「核心资产是什么？为什么值得长期持有？」',
      aggressive: '「行业景气度投资法：如何抓住风口赛道？」'
    },
    scenePitches: {
      young: '「你还年轻，风险承受能力强，可以拿一部分钱投资股票，抓住行业红利。比如现在的AI、新能源，都是长期赛道，早点布局以后收益可能很可观。你平时有关注股市吗？」',
      middle: '「您的资产配置里，权益类资产占比多少？长期来看，股票资产是跑赢通胀的最好方式。您可以拿10%-20%的资产配置优质股票或权益基金，作为家庭资产的"增长极"」',
      senior: '「叔叔/阿姨，您炒股多少年了？现在市场波动大，选股越来越难了。其实您可以关注一下高股息的蓝筹股，波动小、分红稳定，比存银行划算多了」'
    },
    productSelling: {
      conservative: '高股息蓝筹股，业绩稳定、分红率高，每年分红就有4%-6%，波动也小，适合稳健型投资者',
      balanced: '核心资产组合，各行业龙头公司，长期ROE在15%以上，攻守兼备，适合长期持有',
      aggressive: '优质成长赛道，行业景气度高、业绩增速快，虽然波动大但长期收益空间大，适合追求高收益的投资者'
    },
    activities: ['开户送Level-2行情', '投顾服务免费体验', '新股申购策略分享会'],
    objections: [
      {
        q: '股市风险太大了，我怕亏钱',
        a: '您的担心很正常，股市确实有风险。但您知道吗？长期来看，股票资产的收益是所有大类资产里最高的。关键是要控制仓位、选对股票、做好分散。您可以先拿一小部分钱试试，比如总资产的10%，就算亏了也不影响生活，赚了就是超额收益。'
      },
      {
        q: '被套过，再也不敢碰了',
        a: '我特别理解您的感受，被套的滋味确实不好受。但您有没有想过为什么会被套？大概率是追高买入、没有止损、或者选的股票基本面有问题。其实投资是有方法的，只要建立正确的投资体系，控制好风险，亏钱的概率会小很多。我可以帮您分析一下之前的问题出在哪里。'
      },
      {
        q: '选股太难了，没时间看盘',
        a: '您说得对，选股确实需要专业知识和时间精力，这也是很多散户亏钱的原因。但现在有很多方式可以解决这个问题，比如买指数基金、或者用我们的投顾服务，有专业团队帮您选股和调仓，您只要跟着操作就行，不用自己花时间研究。'
      }
    ],
    referral: {
      young: '「如果你觉得我的投资观点还不错，身边有朋友也在炒股的，欢迎推荐给我，我们可以一起交流~」',
      middle: '「您身边有没有也在做股票投资的朋友？可以推荐给我，我免费帮他们做个股诊断和仓位分析」',
      senior: '「叔叔/阿姨，如果您觉得我的服务还不错，身边的老股友问起的话，也可以帮我推荐推荐，谢谢您啦~」'
    },
    tone: '激进、充满机会感、强调成长性和赛道红利'
  },
  trust: {
    name: '信托/私募',
    hotTopics: {
      conservative: '现在优质信托产品越来越少了，好产品都是靠抢的',
      balanced: '资产荒背景下，高净值客户都在配什么？',
      aggressive: '最近一级市场有个不错的项目，您有兴趣了解一下吗？'
    },
    edTopics: {
      conservative: '「信托产品怎么选？看这3个关键指标」',
      balanced: '「高净值家庭的资产配置：为什么要有信托？」',
      aggressive: '「私募股权：高净值客户的另类投资选择」'
    },
    scenePitches: {
      young: '「你现在事业发展得不错，资产也积累到一定规模了，可以考虑配置一些信托产品，收益比普通理财高，而且有风控措施，适合高净值人群做资产多元化配置」',
      middle: '「您的资产体量不小，普通的理财产品可能已经满足不了您的需求了。信托和私募产品是高净值人群的标配，收益更高、投资范围更广，而且还能做资产隔离和财富传承，您有了解过吗？」',
      senior: '「叔叔/阿姨，您辛苦了一辈子攒下的家业，肯定希望能稳稳地传给下一代吧？家族信托可以帮您做资产隔离和财富传承，避免子女挥霍、离婚分割等风险，很多高净值家庭都在用」'
    },
    productSelling: {
      conservative: '政信类信托，有政府信用背书，风控措施完善，年化收益6%-8%，适合稳健型高净值客户',
      balanced: '组合类信托/量化私募，多元策略分散风险，收益回撤比优秀，长期年化8%-12%',
      aggressive: '股权类私募/产业基金，投资优质未上市企业，上市后有3-5倍收益空间，适合风险承受能力强的高净值客户'
    },
    activities: ['高端客户私享会', '一对一资产配置方案定制', '家族信托免费咨询'],
    objections: [
      {
        q: '门槛太高了，100万起投',
        a: '您说得对，信托和私募的门槛确实比较高，这也是监管对投资者的保护。但反过来说，正是因为有门槛，这些产品的投资范围更广、策略更灵活，收益也比普通产品高。如果您暂时达不到门槛，可以先从我们的高端理财系列开始，等资产规模上来了再配置信托。'
      },
      {
        q: '流动性太差，钱锁好几年',
        a: '您说得没错，信托和私募的期限确实比较长。但高收益往往需要时间来兑现，好的投资项目需要培育期。而且您可以做期限搭配，一部分投短期的、一部分投长期的，既满足流动性需求，又能享受长期高收益。我帮您做一个整体的现金流规划怎么样？'
      },
      {
        q: '看不懂、不透明，不知道钱投到哪里了',
        a: '您的顾虑我特别理解。信托和私募确实比普通理财复杂一些，但信息披露也是有监管要求的。我们会给您详细的产品说明书，投什么、怎么投、风控措施是什么，都会讲清楚。而且我会全程跟进，有任何变动第一时间告诉您，您随时可以问我。'
      }
    ],
    referral: {
      young: '「如果你觉得我们的高端产品还不错，身边有同样资产规模的朋友也在找投资渠道的，欢迎推荐给我，我们有专门的高净值客户服务体系~」',
      middle: '「您身边有没有也在做资产配置的高净值朋友？可以推荐给我，我帮他们免费做一个家族资产配置诊断」',
      senior: '「叔叔/阿姨，如果您觉得我们的产品和服务还不错，身边的老朋友问起的话，也可以帮我推荐推荐，谢谢您啦~」'
    },
    tone: '高端、稀缺、强调圈层和稳健增值'
  }
};

// ===== 各产品各步骤的渠道文案生成函数 =====
function generateChannelContent(productType, stepNum, channel, profile) {
  const { age, risk, focus } = profile;
  const productInfo = productConfig[productType] || productConfig.fund;
  const style = riskStyle[risk];
  const scene = ageScene[age];
  const addr = scene.address;
  
  // 关注领域取第一个作为话题切入点
  const focusArea = focus && focus.length > 0 ? focus[0] : 'market';
  const focusTextMap = {
    market: '市场动态', policy: '政策解读', industry: '行业研究',
    macro: '宏观经济', stock: '个股分析', fund: '基金投资',
    insurance: '保险保障', deposit: '存款理财', wealth: '财富管理'
  };
  const focusText = focusTextMap[focusArea] || '投资理财';

  // 统一调用分发器
  const fnName = `gen_${productType}_s${stepNum}_${channel}`;
  if (typeof window[fnName] === 'function') {
    return window[fnName](profile, productInfo, style, scene, focusText);
  }
  // 兜底：使用通用模板
  return generateFallbackContent(productType, stepNum, channel, profile, productInfo, style, scene, focusText);
}

// ===== 通用兜底模板 =====
function generateFallbackContent(productType, stepNum, channel, profile, productInfo, style, scene, focusText) {
  const addr = scene.address;
  const productName = productInfo.name;
  
  if (channel === 'moments') {
    const topic = productInfo.hotTopics[profile.risk] || '';
    return `【${productName}理财小贴士】\n\n最近${topic}\n\n💡 分享三个观点：\n1. 理财不是一夜暴富，而是细水长流的坚持\n2. 适合自己的才是最好的，不要盲目跟风\n3. ${style.keyword}是核心原则\n\n我做理财顾问这么多年，最深的感悟就是：投资路上，选择比努力更重要。选对了方向，时间就是你的朋友。\n\n大家怎么看？欢迎评论区交流~\n\n#${productName}理财 #${style.intensity.replace(/、/g, ' #')} #投资理财心得\n—— 您身边的理财顾问`;
  }
  
  if (channel === 'chat') {
    return `${addr}好呀~\n\n最近${productInfo.hotTopics[profile.risk]}\n正好想到您，想跟您分享几个要点：\n\n1️⃣ 市场观点\n　　${style.tone}的思路在当前市场环境下更稳妥，不追高、不盲从。\n\n2️⃣ 产品匹配\n　　${productInfo.productSelling[profile.risk]}，比较适合${addr}的${scene.moneyDesc}配置。\n\n3️⃣ 行动建议\n　　建议${addr}先从小额开始尝试，慢慢熟悉产品特性，有任何疑问随时问我。\n\n${addr}要是对这个方向感兴趣，或者有什么疑问，随时找我聊~\n\n祝${addr}工作顺利，生活愉快！`;
  }
  
  if (channel === 'group') {
    return `【每日分享 · ${productName}篇】📚\n\n各位群友大家好！今天跟大家聊聊${productName}投资的那些事~\n\n📌 今日主题：${productInfo.edTopics[profile.risk]}\n\n三个要点跟大家分享：\n\n① 为什么要关注？\n　${productInfo.tone}，${style.keyword}，这是${productName}投资的核心逻辑。\n\n② 怎么选适合自己的？\n　根据自己的风险承受能力和投资期限来选，${style.intensity}的产品对应不同的人群。\n\n③ 常见误区要避开\n　不要把所有钱都投一种产品，分散配置才能降低风险。\n\n💬 互动话题：大家平时${productName}投资最关心什么？\nA. 收益高低\nB. 风险大小\nC. 流动性\nD. 产品门槛\n\n欢迎群里交流～ 有任何${productName}相关的问题，随时@我！\n\n—————————\n风险提示：以上观点仅供参考，不构成投资建议。市场有风险，投资需谨慎。`;
  }
  
  if (channel === 'phone') {
    return `【开场问候】\n客户经理：${addr}好！我是XX的理财顾问小X。打扰${addr}几分钟，现在方便说话吗？\n\n【话题引入】\n客户经理：是这样的，最近${productInfo.hotTopics[profile.risk]}，想着${addr}平时也关注${focusText}这块，就想跟${addr}聊聊我的看法，顺便看看对${addr}的资产配置有没有什么参考价值。${addr}之前有关注到这方面的消息吗？\n\n【核心内容一：市场背景】\n客户经理：简单跟${addr}说下我的理解啊。现在的市场环境，整体是${style.tone}的思路更占优。${addr}也知道，现在经济环境比较复杂，这个时候${style.keyword}就显得特别重要。\n\n【核心内容二：产品价值】\n客户经理：说到具体的${productName}产品，我觉得有几点值得关注。第一，${productInfo.productSelling[profile.risk]}；第二，这款产品的风险收益特征跟${addr}的风险偏好是匹配的；第三，从长期配置的角度来看，${productName}在资产组合里有不可替代的作用。\n\n【互动确认】\n客户经理：${addr}觉得呢？对${productName}这块之前了解得多吗？有没有什么特别关心的问题？\n\n【行动建议】\n客户经理：我给${addr}两个建议参考一下啊。第一，${addr}可以先拿一小部分资金试试水，感受一下产品的特性；第二，我可以给${addr}发一份详细的产品资料，${addr}有空的时候看看，有不明白的随时问我。\n\n【收尾】\n客户经理：行，那今天就先跟${addr}聊这些，不耽误${addr}时间了。我稍后把产品资料发给${addr}，${addr}先看看，有什么想法随时找我。\n\n好的${addr}，那${addr}先忙，再见！`;
  }
  
  return '';
}

// ============================================
// 产品1：基金 (fund) - 8步×4渠道完整文案
// ============================================

// 第1步：热点促达
function gen_fund_s1_moments(profile, info, style, scene, focusText) {
  const topic = info.hotTopics[profile.risk];
  const riskTags = {
    conservative: '#债券基金 #稳健理财 #本金安全',
    balanced: '#固收加 #基金定投 #资产配置',
    aggressive: '#科技基金 #成长赛道 #超额收益'
  };
  return `【市场热点解读】📈\n\n今天看到一条消息：${topic}\n\n💡 我的三个看法：\n1. 市场永远在波动，关键是要在波动中找到确定性。${style.keyword}，是穿越周期的底气。\n2. 对普通投资者来说，选基金比选股票更靠谱。专业的事交给专业的人，省时省力还能分散风险。\n3. 现在这个时点，${profile.risk === 'conservative' ? '债基的配置价值很突出，进可攻退可守' : profile.risk === 'balanced' ? '股债平衡的思路更稳妥，不把鸡蛋放一个篮子' : '优质赛道的长期机会值得布局，短期波动是入场时机'}。\n\n做投资久了越来越觉得，与其追逐热点，不如坚守能力圈。知道自己赚的是什么钱，比赚多少钱更重要。\n\n大家怎么看？欢迎交流~\n\n${riskTags[profile.risk]} #基金投资 #理财心得\n—— 您身边的基金顾问`;
}

function gen_fund_s1_group(profile, info, style, scene, focusText) {
  const topic = info.hotTopics[profile.risk];
  return `【早安分享 · 基金热点速递】🌅\n\n各位群友早上好！新的一天开始了~\n\n📰 今日热点：\n${topic}\n\n📊 市场观察：\n最近基金市场结构性行情明显，板块轮动加快。从资金流向来看，${profile.risk === 'conservative' ? '债券类基金持续获得资金净流入，说明市场避险情绪较浓' : profile.risk === 'balanced' ? '均衡配置型基金受到青睐，投资者更倾向于稳中求进' : '科技成长方向的主题基金热度较高，赛道投资逻辑依然受追捧'}。\n\n💡 今日分享三个观点：\n① 热点不代表机会，盲目追热点往往是亏钱的开始\n② 基金投资要看长期，短期涨跌不用太在意\n③ ${style.keyword}，选适合自己的才最重要\n\n💬 今日话题讨论：\n"当前市场环境下，你更倾向于哪种投资策略？"\nA. 稳健为主，买债券/固收+基金\nB. 均衡配置，股债搭配\nC. 积极进取，布局成长赛道\nD. 先观望，等机会\n\n大家怎么看？欢迎群里交流～ 有任何基金相关问题随时@我！\n\n—————————\n风险提示：以上观点仅供参考，不构成投资建议。市场有风险，投资需谨慎。`;
}

// 第2步：投教培育
function gen_fund_s2_moments(profile, info, style, scene, focusText) {
  const edTopic = info.edTopics[profile.risk];
  return `【基金小课堂】📚\n\n今天聊聊：${edTopic}\n\n🎯 核心知识点：\n\n1️⃣ 基金不是稳赚不赔的，但选对了方法可以大大提高胜率\n${profile.risk === 'conservative' ? '债券基金主要投资国债、金融债、企业债，波动很小，历史上持有3个月以上亏损概率极低。它比存款收益高，又比股票基金稳，是稳健投资者的好选择。' : profile.risk === 'balanced' ? '基金定投的核心是"微笑曲线"——市场下跌时攒份额，市场上涨时赚收益。坚持定投3年以上，赚钱的概率超过80%。' : '主动基金的优势在于基金经理的专业选股能力。优秀的基金经理能在熊市中控制回撤，在牛市中跑赢指数，长期下来超额收益非常可观。'}\n\n2️⃣ 买基金的正确姿势：不追涨、不杀跌、长期持有\n很多人买基金亏钱，不是因为基金不好，而是操作不对。追涨杀跌、频繁交易，手续费都亏了不少。\n\n3️⃣ ${style.keyword}是基金投资的第一原则\n\n✨ 今日感悟：\n基金投资赚的是企业成长的钱，也是时间的钱。耐心持有，让复利为你工作。\n\n觉得有用的话点个赞，有问题评论区见~\n\n#基金知识 #${style.intensity.replace(/、/g, ' #')} #理财科普\n—— 您身边的理财顾问`;
}

function gen_fund_s2_chat(profile, info, style, scene, focusText) {
  const addr = scene.address;
  const edTopic = info.edTopics[profile.risk];
  return `${addr}好呀~\n\n昨天发了一条关于${edTopic.replace(/[「」]/g, '')}的朋友圈，想到${addr}可能也会感兴趣，整理了几个要点跟${addr}分享：\n\n1️⃣ 为什么这个话题值得关注\n　　${profile.risk === 'conservative' ? '现在存款利率越来越低，很多人都在找比存款收益高又稳的理财方式。债券基金就是一个不错的选择，了解它的收益来源和风险点，才能做出明智的选择。' : profile.risk === 'balanced' ? '很多人想投资基金但又怕波动，定投其实是普通人最好的方式。不用择时、不用盯盘，每月自动扣款，长期下来收益很可观。' : '主动基金是普通人分享股市成长红利的最好方式。不用自己选股，交给专业的基金经理，长期下来大概率能跑赢大盘。'}\n\n2️⃣ 实操中的几个关键点\n　　第一，要选适合自己风险承受能力的产品；第二，不要一次性all in，分批建仓更稳妥；第三，持有时间很重要，基金不是股票，要给它时间。\n\n3️⃣ 给${addr}的小建议\n　　如果${addr}之前没怎么接触过基金，可以先从${profile.risk === 'conservative' ? '债券基金' : profile.risk === 'balanced' ? '指数基金定投' : '行业龙头基金'}开始试试，门槛不高，先感受一下。\n\n${addr}要是有什么疑问，随时找我聊~\n\n祝${addr}今天一切顺利！`;
}

// 第3步：场景种草
function gen_fund_s3_moments(profile, info, style, scene, focusText) {
  const scenes = scene.scenes;
  return `【生活中的理财智慧】💭\n\n今天跟一个客户聊天，她说到${scenes[0]}的压力，我特别有感触。\n\n其实我们努力工作、认真理财，最终都是为了更好的生活。${scenes[0]}也好，${scenes[1]}也罢，都需要钱来支撑。\n\n分享三个理财心得：\n\n1️⃣ 理财不是有钱人才做的事，恰恰是没钱的时候更需要理财。每月强制储蓄一点点，时间长了就是一笔不小的财富。\n\n2️⃣ 基金定投是普通人的"懒人理财法"。每月发了工资先扣一笔，就当给自己存钱了，${scene.moneyDesc}就这样慢慢攒起来了。\n\n3️⃣ 投资要跟人生阶段匹配。${profile.risk === 'conservative' ? '求稳的时候，债券基金就是压舱石' : profile.risk === 'balanced' ? '上有老下有小的年纪，均衡配置才是王道' : '年轻的时候风险承受能力强，可以多布局一些成长方向'}。\n\n✨ 很喜欢一句话：\n"你不理财，财不理你。理财不是目的，过上想要的生活才是。"\n\n共勉~\n\n#理财人生 #基金定投 #${scene.moneyDesc}\n—— 您身边的理财顾问`;
}

function gen_fund_s3_chat(profile, info, style, scene, focusText) {
  const addr = scene.address;
  const pitch = info.scenePitches[profile.age];
  return `${addr}好~\n\n今天遇到个挺有意思的事，想跟${addr}分享一下。\n\n上午有个跟${addr}情况差不多的客户来找我，也是在为${scene.scenes[0]}的事情发愁，说钱存银行吧利息太低，买别的吧又怕亏。\n\n我跟她聊了很久，给了她几个思路，正好也跟${addr}说说：\n\n1️⃣ 先分清"要花的钱"和"能存的钱"\n　　3-6个月生活费放活期，随时要用的钱不能碰风险。剩下的钱，才可以考虑做投资。\n\n2️⃣ ${scene.moneyDesc}要放在合适的地方\n　　${pitch.replace(/[「」]/g, '')}\n\n3️⃣ 开始的门槛其实很低\n　　很多人觉得要很多钱才能理财，其实不是。基金定投每月几百块就能开始，关键是要有这个意识，先行动起来。\n\n${addr}平时闲钱都怎么打理呀？有空可以聊聊~${addr}要是对基金定投感兴趣，我可以给${addr}详细讲讲怎么操作。\n\n祝好！`;
}

// 第4步：产品介绍
function gen_fund_s4_chat(profile, info, style, scene, focusText) {
  const addr = scene.address;
  const selling = info.productSelling[profile.risk];
  return `${addr}好呀~\n\n上次跟${addr}聊到基金投资的话题，我回去整理了一下，觉得有一款产品挺适合${addr}的，跟${addr}详细说说：\n\n📌 产品亮点：\n\n1️⃣ 【产品定位】${selling}\n　　${profile.risk === 'conservative' ? '主要投资国债、金融债和高等级信用债，股票仓位很低，所以波动很小，适合追求稳健收益的投资者。历史业绩来看，每年都能取得正收益，最大回撤不到2%。' : profile.risk === 'balanced' ? '采用股债平衡策略，债券打底提供稳定收益，股票部分增强收益空间。基金经理经验丰富，擅长在控制回撤的前提下追求超额收益，适合想分享股市收益又怕波动的投资者。' : '由绩优基金经理管理，深耕成长赛道，选股能力出色。历史业绩长期跑赢同类平均和大盘指数，适合风险承受能力较强、追求长期高收益的投资者。'}\n\n2️⃣ 【适合人群】\n　　像${addr}这样${scene.painPoint}的情况，这款产品的风险收益特征正好匹配。\n\n3️⃣ 【投资建议】\n　　建议${addr}可以先拿出${scene.moneyDesc}的一部分来配置，不用一下投入太多，先感受一下产品的波动和收益情况，合适了再加仓也不迟。\n\n我把产品的详细资料发给${addr}看看？${addr}有任何疑问随时问我~\n\n祝好！`;
}

function gen_fund_s4_phone(profile, info, style, scene, focusText) {
  const addr = scene.address;
  const selling = info.productSelling[profile.risk];
  return `【开场】\n客户经理：${addr}好！我是XX的小X。打扰${addr}几分钟，现在方便说话吗？\n\n【引入话题】\n客户经理：${addr}还记得上次我们聊到基金投资的事嘛？我回去仔细想了想${addr}的情况，觉得有一款基金产品挺适合${addr}的，想跟${addr}详细介绍一下，看看对${addr}有没有参考价值。大概占用${addr}5分钟时间，可以吗？\n\n【核心内容一：为什么推荐这款】\n客户经理：是这样的，${addr}的情况是${scene.painPoint}，所以我觉得${style.keyword}的思路比较适合${addr}。这款产品最大的特点就是${selling}，跟${addr}的风险偏好和投资需求都比较匹配。\n\n【核心内容二：产品具体好在哪】\n客户经理：具体来说，我觉得有三个亮点。第一，基金经理靠谱，从业${profile.risk === 'conservative' ? '8年' : profile.risk === 'balanced' ? '10年' : '12年'}了，经历过牛熊周期，业绩稳定；第二，产品策略清晰，${profile.risk === 'conservative' ? '主打债券投资，追求稳健收益' : profile.risk === 'balanced' ? '股债平衡，攻守兼备' : '聚焦优质成长股，追求长期超额收益'}；第三，历史业绩不错，近三年年化收益在同类产品里排名前20%。\n\n【核心内容三：风险也要说清楚】\n客户经理：当然了，我也得跟${addr}说清楚风险。这款产品是${style.intensity}的，${profile.risk === 'conservative' ? '虽然波动很小，但也不是完全没风险，极端情况下也可能出现短期亏损，不过持有时间越长，亏损概率越低' : profile.risk === 'balanced' ? '有一定的波动，市场不好的时候可能会有回撤，但长期来看收益还是不错的' : '波动比较大，短期可能会有较大回撤，需要有一定的风险承受能力和长期持有的耐心'}。这一点${addr}也要有心理准备。\n\n【互动确认】\n客户经理：${addr}觉得呢？这个风险收益水平${addr}能接受吗？还有什么想了解的？\n\n【行动建议】\n客户经理：我给${addr}两个建议啊。第一，${addr}可以先少买一点试试，比如先买1万块钱感受一下，觉得合适了再加；第二，我把产品的详细资料和历史业绩发给${addr}，${addr}有空的时候好好看看，不明白的随时问我。\n\n【收尾】\n客户经理：行，那今天就先跟${addr}聊这些。我稍后把资料发${addr}，${addr}先看看，有什么想法随时联系我。\n好的${addr}，那${addr}先忙，再见！`;
}

// 第5步：活动推荐
function gen_fund_s5_moments(profile, info, style, scene, focusText) {
  const activity = info.activities[0];
  return `【好消息分享】🎉\n\n刚收到通知，我们平台的${activity}活动正式开始了！\n\n跟大家说说这个活动的几个亮点：\n\n1️⃣ ${activity}，实实在在的优惠\n${profile.risk === 'conservative' ? '新客户购买债券基金，申购费直接打1折，算下来能省不少手续费。' : profile.risk === 'balanced' ? '参加定投训练营，不仅有专业老师手把手教，坚持打卡还有红包返现，学习赚钱两不误。' : '专业团队免费帮你诊断手上的基金持仓，告诉你哪些该留哪些该换，价值888元的服务现在免费。'}\n\n2️⃣ 活动时间有限，到本月底就结束了\n好的活动都是有期限的，错过了就不知道什么时候再有了。最近一直在观望的朋友，可以趁这个机会行动起来。\n\n3️⃣ 我可以全程指导操作\n对流程不熟悉的朋友不用担心，从开户到选基到买入，我一步一步教你，保证学会。\n\n✨ 温馨提示：\n活动虽好，但也要选择适合自己的产品。投资有风险，入市需谨慎。适合自己的才是最好的~\n\n感兴趣的朋友可以私信我了解详情~\n\n#基金活动 #限时优惠 #${activity.replace(/[0-9]/g, '').slice(0, 6)}\n—— 您身边的理财顾问`;
}

function gen_fund_s5_chat(profile, info, style, scene, focusText) {
  const addr = scene.address;
  const activity = info.activities[0];
  return `${addr}好呀~\n\n有个好消息第一时间想到告诉${addr}！\n\n我们平台最近有个${activity}的活动，我觉得${addr}正好可以赶上，跟${addr}说说：\n\n🎁 活动内容：\n1️⃣ ${activity}\n　　${profile.risk === 'conservative' ? '新客专享申购费1折，平时申购费是1.5%，现在只要0.15%，买1万能省135块钱呢。' : profile.risk === 'balanced' ? '为期21天的定投训练营，每天10分钟学习基金知识，坚持打卡还有红包奖励，学完就能上手操作。' : '资深投顾一对一免费做基金诊断，分析你手上基金的优劣，给出调整建议，平时收费好几百的。'}\n\n2️⃣ 活动时间\n　　截止到本月底，还有不到两周时间，名额有限先到先得。\n\n3️⃣ ${addr}参与的话\n　　我可以全程协助${addr}操作，从开通到选产品到买入，有任何问题随时找我。\n\n${addr}要不要了解一下？我把活动详情发给${addr}看看？\n\n祝好！`;
}

// 第6步：转化跟进
function gen_fund_s6_chat(profile, info, style, scene, focusText) {
  const addr = scene.address;
  return `${addr}好呀~\n\n上次跟${addr}聊的那只基金，${addr}考虑得怎么样了？\n\n正好这两天市场${profile.risk === 'conservative' ? '债市行情不错，收益率有所上行' : profile.risk === 'balanced' ? '有调整，正是建仓的好时机' : '科技板块回调，性价比更高了'}，想跟${addr}聊聊我的看法：\n\n1️⃣ 关于时机\n　　${profile.risk === 'conservative' ? '债券基金其实不用太择时，越早买越早享收益。现在利率水平相对合适，早点建仓早点开始复利。' : profile.risk === 'balanced' ? '市场调整反而是好事，可以用更低的价格拿到更多份额。定投的话，下跌就是攒份额的好时机。' : '成长赛道短期有波动很正常，长期逻辑没有变。现在回调了一些，估值更合理了，反而是布局的好机会。'}\n\n2️⃣ 关于金额\n　　我建议${addr}可以先从小额开始，比如先买1万试试水，感受一下产品的波动，觉得合适了再加。或者${addr}也可以选择定投的方式，每月自动扣款，不用操心择时的问题。\n\n3️⃣ 操作上的事不用担心\n　　${addr}要是决定买，我一步一步教${addr}操作，很简单的，几分钟就搞定了。买完之后我也会帮${addr}盯着，有重要变化及时告诉${addr}。\n\n${addr}看是先小试一下，还是再多了解了解？有任何疑问随时问我~\n\n祝好！`;
}

function gen_fund_s6_phone(profile, info, style, scene, focusText) {
  const addr = scene.address;
  return `【开场】\n客户经理：${addr}好！我是XX的小X。打扰${addr}了，现在方便说两句吗？\n\n【引入】\n客户经理：${addr}还记得上次跟${addr}聊的那只基金吗？正好这两天市场有些变化，我想着跟${addr}通个气，看看${addr}考虑得怎么样了。\n\n【核心内容一：当前市场情况】\n客户经理：简单跟${addr}说下最新的情况啊。这两天${profile.risk === 'conservative' ? '债市收益率有所上行，新买入的债券基金能享受到更高的票息收益，现在这个时点建仓性价比不错' : profile.risk === 'balanced' ? '市场有一定幅度的调整，很多优质基金的净值也跟着回调了。但我看了一下，这只基金的回撤比同类要小，说明基金经理的风控做得不错。调整反而给了我们更好的入场时机' : '成长板块有一些回调，主要是短期情绪面的影响，行业的基本面和长期逻辑并没有变。我觉得这反而是分批布局的好机会，可以用更低的价格买到更多份额'}。\n\n【核心内容二：我的建议】\n客户经理：所以我的建议是，${addr}如果看好这个方向，可以先行动起来。不用一下投入太多，先买一部分底仓，后续根据市场情况再慢慢加。这样既不错过机会，风险也更可控。\n\n【核心内容三：降低行动门槛】\n客户经理：${addr}不用担心操作的事，很简单的。我可以在电话里一步一步教${addr}，几分钟就搞定了。买完之后我也会持续帮${addr}关注，有重要的市场变化或者产品变动，第一时间告诉${addr}。\n\n【互动确认】\n客户经理：${addr}觉得呢？现在是打算先试试，还是还有什么顾虑？\n\n【行动建议】\n客户经理：要不这样吧${addr}，${addr}先拿1万块钱试试水，感受一下。如果觉得产品不错、自己也能接受这个波动，后面再加仓也不迟。${addr}看怎么样？\n\n【收尾】\n客户经理：行，那${addr}要是决定了随时找我，我帮${addr}操作。或者${addr}还有什么想了解的，随时给我打电话。\n好的${addr}，那不打扰${addr}了，再见！`;
}

// 第7步：异议处理
function gen_fund_s7_phone(profile, info, style, scene, focusText) {
  const addr = scene.address;
  const objections = info.objections;
  return `【开场】\n客户经理：${addr}好！我是小X。${addr}现在方便吗？\n\n【引入】\n客户经理：上次跟${addr}聊了基金的事，我回去想了想，${addr}可能还有一些顾虑没好意思说。今天特意给${addr}打个电话，想跟${addr}好好聊聊，有什么疑问都可以说，我帮${addr}分析分析。\n\n【异议一：基金会不会亏钱？】\n客户经理：我知道很多人最担心的就是这个问题。${addr}的担心我特别理解。\n　　其实不同类型的基金风险不一样。像${addr}关注的这款，${profile.risk === 'conservative' ? '是债券型的，主要投资国债和高等级信用债，波动非常小。历史上看，持有6个月以上亏损的概率不到5%，持有1年以上基本都是正收益。' : profile.risk === 'balanced' ? '是混合型的，有股票有债券，波动适中。短期确实会有涨跌，但只要持有时间够长，比如2-3年，赚钱的概率还是很高的。关键是要选对基金、拿得住。' : '是偏股型的，波动会大一些，短期可能会有10%-20%的回撤。但如果能持有3-5年，优质基金的收益是很可观的。风险和收益永远是匹配的。'}\n　　所以关键不是"会不会亏"，而是"${addr}能承受多大的波动"以及"能拿多久"。\n\n【异议二：选基太难了，不知道买哪个好】\n客户经理：${addr}说得太对了，现在市场上有上万只基金，选起来确实头大。\n　　这也是我们理财顾问存在的价值嘛。我会帮${addr}从几个维度筛选：一看基金经理的长期业绩和能力圈，二看基金的投资策略和风格是否稳定，三看风险收益比是否优秀。而且后续我也会持续跟踪，有变化及时提醒${addr}。${addr}不用自己花时间研究，交给我就行。\n\n【异议三：手续费太高】\n客户经理：这个问题也很多人问。我给${addr}算一笔账啊。\n　　申购费现在一般都打1折，买1万块钱也就十几块钱手续费。管理费是按年收的，债券基金一年0.3%-0.6%，股票基金一年1.5%左右。看起来好像不少，但如果基金一年能帮${addr}赚${profile.risk === 'conservative' ? '4%-6%' : profile.risk === 'balanced' ? '8%-10%' : '12%-15%'}，那点管理费真的不算什么。关键是产品能不能帮${addr}赚到钱，对吧？\n\n【互动确认】\n客户经理：${addr}还有其他什么顾虑吗？都可以跟我说。\n\n【行动建议】\n客户经理：我觉得${addr}可以先少买一点试试，不用一下投入太多。真金白银投进去了，感受才最深。如果觉得合适，后面再加；如果觉得不适合自己，损失也不大。${addr}觉得呢？\n\n【收尾】\n客户经理：行，那${addr}再想想，有任何问题随时找我。${addr}的顾虑我都理解，投资嘛，谨慎点是对的。我这边也会持续帮${addr}关注着，有好的机会及时告诉${addr}。\n好的${addr}，那${addr}先忙，再见！`;
}

function gen_fund_s7_chat(profile, info, style, scene, focusText) {
  const addr = scene.address;
  const objections = info.objections;
  return `${addr}好~\n\n上次跟${addr}聊完基金的事，我回去想了想，${addr}可能心里还有一些疑问没好意思问。今天整理了几个大家最常问的问题，跟${addr}分享一下：\n\n❓ 问题1：${objections[0].q}\n💡 ${objections[0].a}\n\n❓ 问题2：${objections[1].q}\n💡 ${objections[1].a}\n\n❓ 问题3：${objections[2].q}\n💡 ${objections[2].a}\n\n其实我特别理解${addr}的顾虑，投资嘛，谨慎点总是好的。我这边能做的，就是把真实情况告诉${addr}，好的坏的都说到，让${addr}自己做判断。\n\n${addr}还有什么其他疑问吗？随时问我，我一定如实解答~\n\n祝好！`;
}

// 第8步：成交转介
function gen_fund_s8_chat(profile, info, style, scene, focusText) {
  const addr = scene.address;
  const referral = info.referral[profile.age];
  return `${addr}好呀~\n\n${addr}上次买的那只基金，这几天表现还不错吧？${addr}操作上有没有遇到什么问题？\n\n跟${addr}说一下后续的服务安排：\n\n1️⃣ 持仓跟踪\n　　${addr}买的这款产品我会帮${addr}盯着的，每周我都会看一下最新的净值变化和基金经理的操作动向。如果有重要的市场变化或者产品调整，我会及时告诉${addr}。\n\n2️⃣ 定期回访\n　　我会每隔一段时间跟${addr}同步一下持仓情况，${addr}有任何想了解的也随时找我。不用觉得不好意思，这就是我的工作嘛。\n\n3️⃣ 更多服务\n　　除了这只基金，如果${addr}对其他投资方向感兴趣，或者想做一个全面的资产配置检视，都可以找我。\n\n另外啊，${referral.replace(/[「」]/g, '')}\n\n${addr}有任何问题随时联系我，祝您投资顺利，生活愉快！`;
}

function gen_fund_s8_moments(profile, info, style, scene, focusText) {
  return `【客户感谢信】❤️\n\n今天收到一位客户的消息，说跟着我定投基金两年多，收益超出预期，特别开心。\n\n其实最开心的人是我。做理财顾问这么多年，最有成就感的不是卖了多少产品，而是看到客户真真切切赚到了钱、生活因为理财变得更好。\n\n分享几点感悟：\n\n1️⃣ 信任是基础。客户愿意把钱交给你打理，这份信任比什么都珍贵。我能做的，就是不辜负这份信任。\n\n2️⃣ 长期主义是王道。基金投资不是一夜暴富，而是慢慢变富。时间拉长了，复利的力量才会显现。\n\n3️⃣ 专业创造价值。选基、择时、风控，每一个环节都需要专业能力。能帮客户避开坑、赚到钱，就是我的价值所在。\n\n感谢每一位信任我的客户。理财路上，我会一直陪着你们~\n\n如果你的朋友也在学习基金投资，欢迎推荐给我，我会用心对待每一位客户。\n\n#理财顾问 #基金投资 #客户见证\n—— 您身边的理财顾问`;
}

// ============================================
// 产品2：保险 (insurance) - 8步×4渠道完整文案
// ============================================

// 第1步：热点促达
function gen_insurance_s1_moments(profile, info, style, scene, focusText) {
  const topic = info.hotTopics[profile.risk];
  return `【生活感悟】💭\n\n${topic}\n\n分享三个观点：\n\n1️⃣ 保险不是消费，是转移风险的工具\n一场大病、一次意外，可能就花光一个家庭的积蓄。保险的意义，就是用很少的钱，把那些我们承担不起的风险转移出去。\n\n2️⃣ ${style.keyword}，是对家人的责任\n我们买保险，不是因为我们会出事，而是因为我们还有爱的人要照顾。万一有什么事，保险能替我们继续扛起家庭的责任。\n\n3️⃣ 买保险要趁早，越年轻越划算\n保费是随着年龄增长的，而且年轻的时候身体好，投保更容易通过核保。等身体出了问题再想买，可能就买不了了。\n\n做这行越久，越觉得保险的意义重大。它不是"有没有用"的问题，而是"能不能在关键时刻顶上去"的问题。\n\n大家怎么看？欢迎评论区交流~\n\n#保险规划 #风险保障 #家庭责任\n—— 您身边的保险顾问`;
}

function gen_insurance_s1_group(profile, info, style, scene, focusText) {
  const topic = info.hotTopics[profile.risk];
  return `【早安分享 · 保险话题】🌅\n\n各位群友早上好！今天想跟大家聊一个比较严肃但很重要的话题~\n\n📰 今日热点：\n${topic}\n\n💡 分享三个保险认知：\n① 保险是家庭财务的"防火墙"\n　平时觉得没什么用，真出事的时候才知道有多重要。一场大病，可能掏空一个家庭好几年的积蓄。\n\n② 买保险的顺序很重要\n　先大人后小孩，先保障后理财。大人才是孩子最大的保障，大人的保障配好了，孩子才有依靠。\n\n③ ${style.keyword}是核心原则\n　保险不是买得越多越好，而是要适合自己的家庭情况和风险承受能力。\n\n💬 今日话题讨论：\n"你觉得一个家庭最应该先配置什么保险？"\nA. 重疾险/医疗险\nB. 意外险\nC. 寿险\nD. 理财型保险\n\n欢迎大家畅所欲言～ 有任何保险相关的问题，随时@我，我会一一解答！\n\n—————————\n温馨提示：保险配置因人而异，建议根据自身情况选择合适的产品。`;
}

// 第2步：投教培育
function gen_insurance_s2_moments(profile, info, style, scene, focusText) {
  const edTopic = info.edTopics[profile.risk];
  return `【保险小课堂】📚\n\n今天的话题：${edTopic}\n\n🎯 核心知识点：\n\n1️⃣ ${profile.risk === 'conservative' ? '医保只是基础，商业保险是补充' : profile.risk === 'balanced' ? '家庭保险配置有讲究，顺序错了白花冤枉钱' : '增额终身寿不只是保险，更是理财工具'}\n${profile.risk === 'conservative' ? '很多人觉得有医保就够了，其实不是。医保有起付线、封顶线，还有很多自费药不报。真生了大病，医保能报的只是一部分。商业医疗险和重疾险，就是用来弥补医保不足的。' : profile.risk === 'balanced' ? '正确的配置顺序是：先大人后小孩，先保障后理财。大人是家庭的经济支柱，万一大人出事，孩子的生活教育怎么办？所以大人的保障一定要配足，孩子的反而可以简单一些。' : '增额终身寿的保额每年按固定比例递增，现金价值也逐年增长。它既有保障功能，又有储蓄功能，而且可以灵活减保取现。现在利率下行的大环境下，能锁定长期利率的产品越来越少了。'}\n\n2️⃣ 保险的本质是"杠杆"\n用很少的保费，撬动很高的保额。一年几千块，就能有几十万的保障。这就是保险最大的价值。\n\n3️⃣ ${style.keyword}，不买贵的只买对的\n\n✨ 今日感悟：\n保险不能改变生活，但能防止生活被改变。提前规划，才能从容面对人生的风风雨雨。\n\n觉得有用的话点个赞，有问题评论区见~\n\n#保险知识 #${profile.risk === 'conservative' ? '医疗保障' : profile.risk === 'balanced' ? '家庭保障' : '增额终身寿'} #理财科普\n—— 您身边的保险顾问`;
}

function gen_insurance_s2_chat(profile, info, style, scene, focusText) {
  const addr = scene.address;
  const edTopic = info.edTopics[profile.risk];
  return `${addr}好呀~\n\n昨天发了一条关于${edTopic.replace(/[「」]/g, '')}的朋友圈，想到${addr}可能也会感兴趣，整理了几个要点跟${addr}分享：\n\n1️⃣ 为什么这个话题值得关注\n　　${profile.risk === 'conservative' ? '很多人都有医保，但很少有人真正了解医保的局限性。等真生病的时候才发现很多费用报不了，就晚了。提前了解商业保险的作用，才能在需要的时候有保障。' : profile.risk === 'balanced' ? '很多家庭买保险都买反了，给孩子买了一堆，大人反而没什么保障。其实大人才是家庭的顶梁柱，大人的保障才是最重要的。搞清楚配置顺序，能少花很多冤枉钱。' : '现在存款利率越来越低，理财产品也不保本了。很多人都在找能锁定长期收益的工具。增额终身寿就是其中一种，既有保障又有储蓄功能，长期复利增值，适合做长期规划。'}\n\n2️⃣ 常见的几个误区\n　　第一，不是贵的就是好的，适合的才重要；第二，不是买得越多越好，保额够用就行；第三，不是有了社保就不用商保，两者是互补的。\n\n3️⃣ 给${addr}的小建议\n　　如果${addr}之前没怎么了解过保险，可以先从${profile.risk === 'conservative' ? '医疗险和意外险' : profile.risk === 'balanced' ? '家庭保障诊断' : '增额终身寿的收益演算'}开始，先有个概念，再慢慢规划。\n\n${addr}要是有什么疑问，随时找我聊~\n\n祝${addr}今天一切顺利！`;
}

// 第3步：场景种草
function gen_insurance_s3_moments(profile, info, style, scene, focusText) {
  const scenes = scene.scenes;
  return `【深夜随笔】🌙\n\n今天刷到一个新闻，说一个家庭因为家人生病花光了积蓄，看得心里挺难受的。\n\n其实我们这代人，压力真的挺大的。${scenes[0]}要操心，${scenes[1]}也要操心。每天努力工作，就是想让家人过上好日子。\n\n但有时候，风险来得猝不及防。\n\n分享三个真心话：\n\n1️⃣ 趁年轻、身体好，把保障配好\n不要等身体出了问题才想起买保险，那时候可能已经买不了了。\n\n2️⃣ ${scene.moneyDesc}的一部分，应该放在保障里\n${scenes[0]}的钱、${scenes[1]}的钱，这些都是刚性支出。万一我们出了什么事，这些钱从哪里来？保险就是答案。\n\n3️⃣ 保险不是"不吉利"，是负责任\n很多人觉得谈保险不吉利，但风险不会因为我们不谈就不存在。提前做好准备，是对自己、对家人负责。\n\n✨ 很认同一句话：\n"买保险不是因为有人要走，而是因为有人要好好活下去。"\n\n共勉。\n\n#保险 #家庭责任 #${scene.moneyDesc}\n—— 您身边的保险顾问`;
}

function gen_insurance_s3_chat(profile, info, style, scene, focusText) {
  const addr = scene.address;
  const pitch = info.scenePitches[profile.age];
  return `${addr}好~\n\n今天遇到个挺感慨的事，想跟${addr}聊聊。\n\n上午有个客户来找我，说他一个朋友查出来重病，家里积蓄一下就空了。他突然意识到自己也没什么保障，赶紧来问问。\n\n其实这种事真的挺多的，正好也跟${addr}说说我的想法：\n\n1️⃣ 我们这代人，真的挺不容易的\n　　${scene.painPoint}。每天努力工作，就是想让家人过得好一点。但万一有个什么事，积蓄可能一下就没了。\n\n2️⃣ ${pitch.replace(/[「」]/g, '')}\n\n3️⃣ 保险其实没那么贵\n　　很多人觉得保险要花很多钱，其实不是。基础的保障型产品，一年几千块就能有几十万的保额。关键是要有这个意识，早点配置。\n\n${addr}之前有了解过保险吗？有空可以聊聊~${addr}要是感兴趣，我可以帮${addr}做一个免费的保障诊断，看看${addr}现在的保障够不够。\n\n祝好！`;
}

// 第4步：产品介绍
function gen_insurance_s4_chat(profile, info, style, scene, focusText) {
  const addr = scene.address;
  const selling = info.productSelling[profile.risk];
  return `${addr}好呀~\n\n上次跟${addr}聊到保险的话题，我回去仔细想了想${addr}的情况，觉得有一款产品挺适合${addr}的，跟${addr}详细说说：\n\n📌 产品亮点：\n\n1️⃣ 【产品定位】${selling}\n　　${profile.risk === 'conservative' ? '这是一款纯保障型的产品，保费不高，但保额很高。包含重疾保障、医疗保障和意外保障，基础保障比较全面。一年几千块钱，就能有几十万的保障，性价比很高。' : profile.risk === 'balanced' ? '这是一个保障+储蓄的组合方案。既有重疾、医疗这些基础保障，又有年金储蓄功能。一张保单，既能解决风险保障的问题，又能为将来存一笔钱，比较适合做家庭的综合保障规划。' : '这是一款增额终身寿险，保额每年按固定比例递增，现金价值也逐年增长。它的优势在于：第一，锁定长期利率，不受市场利率下行影响；第二，灵活支取，可以减保取现；第三，有资产隔离和财富传承的功能。'}\n\n2️⃣ 【适合人群】\n　　像${addr}这样${scene.painPoint}的情况，${profile.risk === 'conservative' ? '基础保障一定要配好，万一有什么事，不会给家人造成太大负担' : profile.risk === 'balanced' ? '既要考虑保障，又要考虑储蓄，这款组合产品正好匹配需求' : '有一定的积蓄，想做长期稳健理财和财富传承的，这款产品很合适'}。\n\n3️⃣ 【配置建议】\n　　建议${addr}可以先做一个详细的保障需求分析，我帮${addr}算一下需要多少保额、保费预算多少合适。不用急着买，先了解清楚再说。\n\n我把产品的详细资料发给${addr}看看？${addr}有任何疑问随时问我~\n\n祝好！`;
}

function gen_insurance_s4_phone(profile, info, style, scene, focusText) {
  const addr = scene.address;
  const selling = info.productSelling[profile.risk];
  return `【开场】\n客户经理：${addr}好！我是XX的小X。打扰${addr}几分钟，现在方便说话吗？\n\n【引入话题】\n客户经理：${addr}还记得上次我们聊到保险的事嘛？我回去仔细想了想${addr}的家庭情况，觉得有一款产品挺适合${addr}的，想跟${addr}详细介绍一下，看看对${addr}有没有参考价值。大概5分钟时间，可以吗？\n\n【核心内容一：为什么推荐这款】\n客户经理：是这样的，${addr}的情况是${scene.painPoint}，所以我觉得${style.keyword}的思路比较适合${addr}。这款产品最大的特点就是${selling}，跟${addr}的需求正好匹配。\n\n【核心内容二：产品具体好在哪】\n客户经理：具体来说，我觉得有三个亮点。第一，保障全面，${profile.risk === 'conservative' ? '重疾、医疗、意外都覆盖到了，基础保障一步到位' : profile.risk === 'balanced' ? '保障和储蓄兼顾，一张保单解决多个问题' : '锁定长期利率，灵活支取，还能做财富传承'}；第二，性价比高，同样的保额，这款产品的保费在同类产品里很有竞争力；第三，公司品牌大，理赔服务有保障，这一点也很重要。\n\n【核心内容三：保险不是买了就完了】\n客户经理：而且啊，${addr}通过我买保险，后续服务都是我来跟进的。理赔的时候我会全程协助${addr}，不用${addr}自己跑保险公司。这也是找保险顾问买的价值所在。\n\n【互动确认】\n客户经理：${addr}觉得呢？这个产品的方向是${addr}想要的吗？还有什么想了解的？\n\n【行动建议】\n客户经理：我给${addr}两个建议啊。第一，我先帮${addr}做一个详细的方案和报价，${addr}拿回去慢慢看，不用急着决定；第二，${addr}有时间的话，我们可以约个时间当面聊，我把产品的每一条条款都给${addr}讲清楚。\n\n【收尾】\n客户经理：行，那今天就先跟${addr}聊这些。我稍后把方案发给${addr}，${addr}先看看，有什么想法随时联系我。\n好的${addr}，那${addr}先忙，再见！`;
}

// 第5步：活动推荐
function gen_insurance_s5_moments(profile, info, style, scene, focusText) {
  const activity = info.activities[0];
  return `【好消息分享】🎉\n\n刚收到通知，${activity}活动正式开始了！\n\n跟大家说说这个活动的几个亮点：\n\n1️⃣ ${activity}，机会难得\n${profile.risk === 'conservative' ? '很多人平时想做保障诊断但不知道从何入手，这次是完全免费的。我会帮你分析现有保障够不够、缺什么、怎么补，给你一个清晰的方案。' : profile.risk === 'balanced' ? '平时买重疾险都需要体检，这次有限时免体检额度，身体有些小问题的朋友要抓住机会。免体检额度有限，先到先得。' : '投保就送健康体检套餐，价值上千元。既能配齐保障，又能做个全面体检，一举两得。'}\n\n2️⃣ 活动时间有限\n好的活动都是有期限的，错过了就不知道什么时候再有了。最近一直在考虑保险的朋友，可以趁这个机会行动起来。\n\n3️⃣ 我可以全程协助\n从方案设计到投保操作，我一步一步帮你搞定，不用你自己费心。\n\n✨ 温馨提示：\n保险是长期规划，一定要选适合自己的。我会根据你的家庭情况和需求，帮你设计最合适的方案，不推销、不误导。\n\n感兴趣的朋友可以私信我预约~\n\n#保险活动 #限时福利 #${activity.slice(0, 6)}\n—— 您身边的保险顾问`;
}

function gen_insurance_s5_chat(profile, info, style, scene, focusText) {
  const addr = scene.address;
  const activity = info.activities[0];
  return `${addr}好呀~\n\n有个好消息第一时间想到告诉${addr}！\n\n我们公司最近有个${activity}的活动，我觉得${addr}正好可以赶上，跟${addr}说说：\n\n🎁 活动内容：\n1️⃣ ${activity}\n　　${profile.risk === 'conservative' ? '免费帮你做家庭保障诊断，包括：现有保障梳理、风险缺口分析、配置建议方案。平时收费好几百的，现在完全免费。' : profile.risk === 'balanced' ? '限时免体检额度，身体有些小问题、平时可能通不过核保的朋友，这次机会难得。免体检额度有限，先到先得。' : '投保就送健康体检套餐，包含全面的体检项目，价值上千元。既能配齐保障，又能做个全面的健康检查。'}\n\n2️⃣ 活动时间\n　　截止到本月底，还有不到两周时间，名额有限先到先得。\n\n3️⃣ ${addr}参与的话\n　　我会全程协助${addr}，从方案设计到投保操作，${addr}有任何问题随时找我。\n\n${addr}要不要了解一下？我帮${addr}预约一下？\n\n祝好！`;
}

// 第6步：转化跟进
function gen_insurance_s6_chat(profile, info, style, scene, focusText) {
  const addr = scene.address;
  return `${addr}好呀~\n\n上次跟${addr}聊的保险方案，${addr}考虑得怎么样了？\n\n正好这两天有个客户刚办完理赔，让我感触挺深的，想跟${addr}再聊聊：\n\n1️⃣ 关于"什么时候买最合适"\n　　很多人都想等等再买，但保险这个东西，真的越早买越好。一方面越年轻保费越便宜，另一方面身体好的时候更容易通过核保。等身体出了问题再想买，可能就买不了了，或者要加费、除外责任。\n\n2️⃣ 关于"买多少合适"\n　　我建议${addr}可以先从基础保障开始配，${profile.risk === 'conservative' ? '先把重疾和医疗配好，一年几千块钱，也不会有太大负担' : profile.risk === 'balanced' ? '大人的保障先配足，孩子的可以简单一点，保费预算控制在家庭年收入的5%-10%比较合理' : '可以先做一部分，后续根据情况再加，保险是可以慢慢加的'}。\n\n3️⃣ 关于"后续服务"\n　　${addr}不用担心买了之后没人管。我会全程跟踪服务，理赔的时候我会帮${addr}处理，平时有任何问题随时找我。这就是找保险顾问买的好处。\n\n${addr}看是先把基础保障配上，还是再考虑考虑？有任何疑问随时问我~\n\n祝好！`;
}

function gen_insurance_s6_phone(profile, info, style, scene, focusText) {
  const addr = scene.address;
  return `【开场】\n客户经理：${addr}好！我是XX的小X。打扰${addr}了，现在方便说两句吗？\n\n【引入】\n客户经理：${addr}还记得上次跟${addr}聊的保险方案吗？正好这两天有个客户的理赔刚下来，我就想到${addr}了，想跟${addr}再聊聊，看看${addr}考虑得怎么样了。\n\n【核心内容一：分享一个理赔案例】\n客户经理：跟${addr}分享一下那个客户的情况啊。他也是跟${addr}差不多年纪，去年在我这买的重疾险，今年查出来甲状腺癌，理赔了50万。他跟我说，幸好当初买了，不然治病加休养，这几年的收入损失都不知道怎么办。我听了也挺感慨的，保险这个东西，平时觉得没用，真用到的时候就是救命钱。\n\n【核心内容二：回到${addr}的方案】\n客户经理：所以我就想到${addr}了。${addr}的方案我已经做好了，就是上次跟${addr}说的那个，${profile.risk === 'conservative' ? '基础保障配齐，一年几千块，保额50万' : profile.risk === 'balanced' ? '保障+储蓄组合，保障全面还有储蓄功能' : '增额终身寿，锁定长期利率，灵活支取'}。${addr}看还有什么地方需要调整的吗？\n\n【核心内容三：降低行动门槛】\n客户经理：${addr}要是觉得一下配置齐压力大，也可以先买一部分，后面慢慢加。保险不是一次买完就完了，是可以根据情况调整的。先有保障，总比没有强。\n\n【互动确认】\n客户经理：${addr}觉得呢？现在是打算先配上，还是还有什么顾虑？\n\n【行动建议】\n客户经理：要不这样吧${addr}，我先帮${addr}把投保资料准备好，${addr}先看看，没问题的话咱们就办。有问题咱们随时沟通，${addr}看怎么样？\n\n【收尾】\n客户经理：行，那${addr}要是决定了随时找我。或者${addr}还有什么想了解的，随时给我打电话。\n好的${addr}，那不打扰${addr}了，再见！`;
}

// 第7步：异议处理
function gen_insurance_s7_phone(profile, info, style, scene, focusText) {
  const addr = scene.address;
  return `【开场】\n客户经理：${addr}好！我是小X。${addr}现在方便吗？\n\n【引入】\n客户经理：上次跟${addr}聊了保险方案的事，我回去想了想，${addr}可能还有一些顾虑没好意思说。今天特意给${addr}打个电话，想跟${addr}好好聊聊，有什么疑问都可以说，我帮${addr}分析分析。\n\n【异议一：保险收益太低了，不如买理财】\n客户经理：很多人都有这个想法，我特别理解。\n　　${addr}说得对，保险的收益确实不如理财产品高。但保险的核心功能是保障，不是收益。${addr}想想，万一生了大病，理财能赔${addr}几十万吗？不能对吧。保险就是用很少的钱，转移那些我们承担不起的风险。理财和保险，各司其职，缺一不可。就像我们穿衣服，冬天要穿羽绒服保暖，夏天要穿T恤凉快，功能不一样，不能互相替代。\n\n【异议二：流动性太差，钱拿不出来】\n客户经理：这个问题问得很好。\n　　保险确实是长期规划，但也不是完全取不出来。像${profile.risk === 'aggressive' ? '增额终身寿就可以灵活减保取现，什么时候用钱、取多少，都可以自己决定' : '重疾险有保单贷款功能，急用钱的时候可以贷出现金价值的80%'}。而且${addr}想啊，我们买保险的钱，本来就是准备用来应对风险的，不是随时要用的钱。把钱分好账户，一部分放灵活的，一部分做长期保障，这样才科学。\n\n【异议三：理赔难，买的时候说得好，赔的时候各种拒】\n客户经理：${addr}的顾虑我特别理解，确实有这样的情况。\n　　但其实大部分理赔纠纷，都是因为投保的时候没有如实告知。只要投保时如实健康告知、理赔时符合条款，保险公司都会正常赔付的。我作为${addr}的保险顾问，投保的时候会帮${addr}把好关，确保${addr}如实告知；真到理赔的时候，我也会全程协助${addr}，帮${addr}准备材料、跟保险公司沟通。${addr}不用自己操心。\n\n【互动确认】\n客户经理：${addr}还有其他什么顾虑吗？都可以跟我说。\n\n【行动建议】\n客户经理：我觉得${addr}可以先把基础保障配上，不用一下买很多。先有个保障在，心里也踏实。以后条件好了，再慢慢加。${addr}觉得呢？\n\n【收尾】\n客户经理：行，那${addr}再想想，有任何问题随时找我。${addr}的顾虑我都理解，买保险是大事，谨慎点是对的。我这边也会帮${addr}关注着，有好的产品及时告诉${addr}。\n好的${addr}，那${addr}先忙，再见！`;
}

function gen_insurance_s7_chat(profile, info, style, scene, focusText) {
  const addr = scene.address;
  const objections = info.objections;
  return `${addr}好~\n\n上次跟${addr}聊完保险方案的事，我回去想了想，${addr}可能心里还有一些疑问没好意思问。今天整理了几个大家最常问的问题，跟${addr}分享一下：\n\n❓ 问题1：${objections[0].q}\n💡 ${objections[0].a}\n\n❓ 问题2：${objections[1].q}\n💡 ${objections[1].a}\n\n❓ 问题3：${objections[2].q}\n💡 ${objections[2].a}\n\n其实我特别理解${addr}的顾虑，买保险是大事，谨慎点总是好的。我这边能做的，就是把真实情况告诉${addr}，好的坏的都说到，让${addr}自己做判断。\n\n${addr}还有什么其他疑问吗？随时问我，我一定如实解答~\n\n祝好！`;
}

// 第8步：成交转介
function gen_insurance_s8_chat(profile, info, style, scene, focusText) {
  const addr = scene.address;
  const referral = info.referral[profile.age];
  return `${addr}好呀~\n\n${addr}的保单已经生效了，电子保单我已经发给${addr}了，${addr}收到了吧？\n\n跟${addr}说一下后续的服务安排：\n\n1️⃣ 保单服务\n　　${addr}的保单我会统一管理的，每年快到交费的时候我会提前提醒${addr}，不用担心忘了交费影响保障。\n\n2️⃣ 理赔协助\n　　万一有什么需要理赔的情况，${addr}第一时间找我就行。我会全程协助${addr}处理，从报案到准备材料到跟进理赔进度，${addr}不用自己跑保险公司。\n\n3️⃣ 保障检视\n　　我会每年帮${addr}做一次保障检视，看看${addr}的保障够不够、需不需要调整。毕竟随着家庭情况变化，保障需求也会变的。\n\n另外啊，${referral.replace(/[「」]/g, '')}\n\n${addr}有任何问题随时联系我，祝您和家人平安健康！`;
}

function gen_insurance_s8_moments(profile, info, style, scene, focusText) {
  return `【客户感谢信】❤️\n\n今天帮一位客户办完了理赔，50万的理赔款到账了。客户说"幸好当初买了保险"，听到这句话，我觉得这份工作特别有意义。\n\n做保险这么多年，最有成就感的不是卖了多少保单，而是在客户需要的时候，能真真切切帮到他们。\n\n分享几点感悟：\n\n1️⃣ 保险是"雪中送炭"，不是"锦上添花"\n平时觉得没什么用，真出事的时候，就是救命钱。\n\n2️⃣ 信任是相互的\n客户愿意把家庭保障这么重要的事交给我，这份信任比什么都珍贵。我能做的，就是不辜负这份信任，售前售后一个样。\n\n3️⃣ 每一份保单背后，都是一个家庭的托付\n我深知这份责任的重量，所以每一个方案都认真设计，每一次理赔都全力以赴。\n\n感谢每一位信任我的客户。保障路上，我会一直陪着你们~\n\n如果你的朋友也在考虑保险，欢迎推荐给我，我会用心对待每一位客户。\n\n#保险 #理赔 #客户见证\n—— 您身边的保险顾问`;
}

// ============================================
// 产品3：存款 (deposit) - 8步×4渠道完整文案
// ============================================

// 第1步：热点促达
function gen_deposit_s1_moments(profile, info, style, scene, focusText) {
  const topic = info.hotTopics[profile.risk];
  return `【财经观察】💰\n\n${topic}\n\n分享三个观点：\n\n1️⃣ 利率下行是大趋势\n从全球范围看，低利率甚至负利率是常态。我们国家的利率也在逐步下行，这是经济发展到一定阶段的必然结果。\n\n2️⃣ ${style.keyword}，是应对利率下行的最好方式\n${profile.risk === 'conservative' ? '存款是最安全的资产，没有之一。保本保息，受存款保险保障。在不确定的环境里，确定性就是最大的价值。' : profile.risk === 'balanced' ? '存款是资产的"压舱石"。不管市场怎么波动，存款都是稳的。有了存款打底，心里才不慌。' : '锁定长期利率很重要。现在利率还相对可以，赶紧存一笔长期的，把利率锁定住，以后再降息也不怕。'}\n\n3️⃣ 存钱不是小气，是远见\n手上有存款，心里才有底气。遇到机会敢出手，遇到风险能扛住。存款不是目的，是实现目标的工具。\n\n现在这个环境，"稳"字当头。保住本金，再谈收益。\n\n大家怎么看？欢迎评论区交流~\n\n#存款 #利率下行 #稳健理财\n—— 您身边的理财顾问`;
}

function gen_deposit_s1_group(profile, info, style, scene, focusText) {
  const topic = info.hotTopics[profile.risk];
  return `【早安分享 · 存款话题】🌅\n\n各位群友早上好！今天来聊一个大家都关心的话题~\n\n📰 今日热点：\n${topic}\n\n💡 分享三个存钱技巧：\n① 存款保险制度给你兜底\n　同一个人在同一家银行，50万以内的存款是100%安全的，就算银行出问题也会全额赔付。所以存款大可放心。\n\n② 阶梯存款法，兼顾收益和流动性\n　把钱分成几份，分别存1年、2年、3年期。这样每年都有到期的钱，既有高利息，又有流动性。\n\n③ ${style.keyword}，存钱要有策略\n　不是简单地把钱放银行就行，要讲究方法。不同期限、不同产品搭配，才能让收益最大化。\n\n💬 今日话题讨论：\n"你的存款主要放在哪里？"\nA. 活期/余额宝\nB. 定期存款\nC. 大额存单\nD. 结构性存款\n\n欢迎大家交流～ 有任何存款理财相关的问题，随时@我！\n\n—————————\n温馨提示：存款有保险，50万以内保本保息。`;
}

// 第2步：投教培育
function gen_deposit_s2_moments(profile, info, style, scene, focusText) {
  const edTopic = info.edTopics[profile.risk];
  return `【存款小课堂】🏦\n\n今天聊聊：${edTopic}\n\n🎯 核心知识点：\n\n1️⃣ ${profile.risk === 'conservative' ? '存款保险是每个储户的"保护伞"' : profile.risk === 'balanced' ? '存钱也有技巧，方法不同收益差很多' : '利率下行期，锁定长期收益就是赚钱'}\n${profile.risk === 'conservative' ? '很多人不知道存款保险是干什么的。简单说，就是国家成立了一个保险基金，每个银行都要交钱。万一银行出问题了，保险基金就会赔付储户，同一个人在同一家银行50万以内全额赔付。所以银行存款是非常安全的。' : profile.risk === 'balanced' ? '很多人存定期，就是简单地存一笔3年期，其实这样不划算。教大家一个"阶梯存款法"：把钱分成3份，分别存1年、2年、3年。每年都有一笔到期，到期后转存3年期，这样几年后你的每一笔钱都是3年期的利息，但每年都有到期的钱可以用。' : '为什么说锁定利率很重要？因为利率是一直在降的。你今天存一笔3年期的大额存单，利率是3%，这3年就都是3%。就算明年利率降到2%，你的还是3%。所以利率下行期，存得越久越划算。'}\n\n2️⃣ 大额存单比普通定期更划算\n同样是存3年，大额存单的利率比普通定期高0.2-0.5个百分点。10万块钱存3年，利息就能差大几百块。\n\n3️⃣ ${style.keyword}，存钱也讲究资产配置\n\n✨ 今日感悟：\n存钱不是目的，让钱稳稳地增值才是。掌握正确的方法，存款也能跑出好收益。\n\n觉得有用的话点个赞，有问题评论区见~\n\n#存款技巧 #${style.intensity.replace(/、/g, ' #')} #理财知识\n—— 您身边的理财顾问`;
}

function gen_deposit_s2_chat(profile, info, style, scene, focusText) {
  const addr = scene.address;
  const edTopic = info.edTopics[profile.risk];
  return `${addr}好呀~\n\n昨天发了一条关于${edTopic.replace(/[「」]/g, '')}的朋友圈，想到${addr}可能也会感兴趣，整理了几个要点跟${addr}分享：\n\n1️⃣ 为什么这个话题值得关注\n　　${profile.risk === 'conservative' ? '很多人把钱放银行，但并不真正了解存款保险制度。知道存款保险保什么、怎么保，心里才能更踏实。特别是现在银行越来越多，了解这个很有必要。' : profile.risk === 'balanced' ? '很多人存钱就是简单存个定期，其实里面有很多技巧。用对方法，同样的本金、同样的期限，利息能多出不少。存钱也要有方法。' : '利率下行是大趋势，越早锁定长期利率越划算。很多人没意识到，每次降息，你的存款利息就少了一截。早点行动，就能多赚几年高利息。'}\n\n2️⃣ 实操中的几个关键点\n　　第一，50万以内的存款是绝对安全的，不用担心；第二，大额存单利率更高，有条件的话优先选；第三，阶梯存款法可以兼顾收益和流动性。\n\n3️⃣ 给${addr}的小建议\n　　如果${addr}有一笔钱暂时不用，可以考虑存一笔${profile.risk === 'conservative' ? '大额存单，保本保息，利率也比普通存款高' : profile.risk === 'balanced' ? '3年期的，把当前的利率锁定住' : '长期定期，锁定利率，应对下行'}。先从小额试试也可以。\n\n${addr}要是有什么疑问，随时找我聊~\n\n祝${addr}今天一切顺利！`;
}

// 第3步：场景种草
function gen_deposit_s3_moments(profile, info, style, scene, focusText) {
  const scenes = scene.scenes;
  return `【生活随想】💭\n\n最近跟朋友聊天，聊到${scenes[0]}的话题。大家都在感慨，钱到用时方恨少。\n\n是啊，成年人的安全感，都是存款给的。\n\n分享三个存钱心得：\n\n1️⃣ 存钱要趁早\n${scene.moneyDesc}不是一天攒出来的，是日积月累的结果。越早开始存，复利效应越明显。\n\n2️⃣ 专款专用，钱要分账户\n${scenes[0]}的钱是一笔，${scenes[1]}的钱是另一笔。不同用途的钱，放不同的地方，用不同的策略。${scene.moneyDesc}就要放稳当的地方，不能拿去冒风险。\n\n3️⃣ ${profile.risk === 'conservative' ? '稳，比什么都重要' : profile.risk === 'balanced' ? '攻守兼备，才能行稳致远' : '长期眼光，锁定未来'}\n\n✨ 很喜欢一句话：\n"你存的不是钱，是底气，是选择，是面对生活的从容。"\n\n好好存钱，好好生活。共勉~\n\n#存钱 #${scene.moneyDesc} #${scenes[0]}\n—— 您身边的理财顾问`;
}

function gen_deposit_s3_chat(profile, info, style, scene, focusText) {
  const addr = scene.address;
  const pitch = info.scenePitches[profile.age];
  return `${addr}好~\n\n今天有个客户来存大额存单，聊了挺多的，想到${addr}也正好有这方面的需求，跟${addr}说说：\n\n1️⃣ 现在存款利率一直在降\n　　相信${addr}也感觉到了，最近几年存款利率一年比一年低。以前3年期能到4%，现在只有3%左右了。而且看趋势，还会继续降。所以有闲钱的话，早点存长期的，把利率锁定住。\n\n2️⃣ ${pitch.replace(/[「」]/g, '')}\n\n3️⃣ 大额存单比普通定期划算\n　　同样存3年，大额存单利率比普通定期高不少。20万起存，利息差几千块呢。${addr}要是有闲钱，真的可以考虑一下。\n\n${addr}平时闲钱都怎么打理呀？有空可以聊聊~${addr}要是对大额存单感兴趣，我可以帮${addr}看看现在还有没有额度。\n\n祝好！`;
}

// 第4步：产品介绍
function gen_deposit_s4_chat(profile, info, style, scene, focusText) {
  const addr = scene.address;
  const selling = info.productSelling[profile.risk];
  return `${addr}好呀~\n\n上次跟${addr}聊到存款的话题，我回去看了一下目前的产品，有一款挺适合${addr}的，跟${addr}详细说说：\n\n📌 产品亮点：\n\n1️⃣ 【产品定位】${selling}\n　　${profile.risk === 'conservative' ? '这是我们银行的大额存单产品，保本保息，受存款保险保障，50万以内100%安全。利率比普通定期存款高0.3个百分点左右，3年期的话，10万能多赚将近1000块利息。而且可以转让，急用钱的时候可以转让出去，损失很小。' : profile.risk === 'balanced' ? '这是一款结构性存款产品，本金是100%保本的，收益跟某个指标挂钩，有机会获得比普通存款更高的收益。最坏的情况就是拿保底收益，比活期高。适合想搏一点收益、但又不想承担本金风险的客户。' : '这是一个阶梯存款组合方案，1年+2年+3年搭配，每年都有到期的钱，既享受了长期存款的高利率，又有流动性。而且我会帮你管理，到期前提醒你，自动转存最划算的期限。'}\n\n2️⃣ 【适合人群】\n　　像${addr}这样${scene.painPoint}的情况，把${scene.moneyDesc}放在稳健的地方是非常正确的选择。\n\n3️⃣ 【配置建议】\n　　建议${addr}可以先拿出一部分资金存，不用一下都存进来。感受一下产品的特点，合适了再加也不迟。\n\n我把产品的详细资料发给${addr}看看？${addr}有任何疑问随时问我~\n\n祝好！`;
}

function gen_deposit_s4_phone(profile, info, style, scene, focusText) {
  const addr = scene.address;
  const selling = info.productSelling[profile.risk];
  return `【开场】\n客户经理：${addr}好！我是XX银行的小X。打扰${addr}几分钟，现在方便说话吗？\n\n【引入话题】\n客户经理：${addr}还记得上次我们聊到存款的事嘛？我回去看了一下目前的产品和利率情况，觉得有一款挺适合${addr}的，想跟${addr}详细介绍一下。大概5分钟时间，可以吗？\n\n【核心内容一：当前利率形势】\n客户经理：先跟${addr}说一下现在的大环境啊。存款利率一直在下行，这是大趋势。所以有闲钱的话，早点存、存长期，把利率锁定住，是比较明智的做法。等利率降下去了再存，就不划算了。\n\n【核心内容二：产品具体介绍】\n客户经理：我给${addr}推荐的这款，${selling}。具体来说：\n　　第一，安全有保障，${profile.risk === 'conservative' ? '是正规银行存款，受存款保险保障，50万以内保本保息' : profile.risk === 'balanced' ? '本金100%安全，收益有浮动空间' : '分散期限，兼顾收益和流动性'}；\n　　第二，收益比普通存款高，${profile.risk === 'conservative' ? '大额存单利率比普通定期高0.2-0.5个百分点' : profile.risk === 'balanced' ? '最高收益能到4%左右' : '长期收益最大化'}；\n　　第三，操作方便，手机银行就能买，不用跑网点。\n\n【核心内容三：跟其他产品对比】\n客户经理：${addr}可能会问，为什么不买理财或者基金？因为那些产品是有风险的，而存款是保本的。${scene.moneyDesc}的钱，首先要安全，其次才是收益。${style.keyword}，对吧？\n\n【互动确认】\n客户经理：${addr}觉得呢？这个产品的方向是${addr}想要的吗？还有什么想了解的？\n\n【行动建议】\n客户经理：我给${addr}两个建议啊。第一，${addr}可以先存一部分试试，比如先存5万，感受一下；第二，我把产品的详细资料和利率表发给${addr}，${addr}拿回去慢慢看，不用急着决定。\n\n【收尾】\n客户经理：行，那今天就先跟${addr}聊这些。我稍后把资料发给${addr}，${addr}先看看，有什么想法随时联系我。\n好的${addr}，那${addr}先忙，再见！`;
}

// 第5步：活动推荐
function gen_deposit_s5_moments(profile, info, style, scene, focusText) {
  const activity = info.activities[0];
  return `【好消息】🎁\n\n${activity}活动开始了！\n\n跟大家说说这个活动的几个亮点：\n\n1️⃣ ${activity}，实实在在的优惠\n${profile.risk === 'conservative' ? '新客户专享存款利率上浮，比普通客户高0.1-0.2个百分点。10万块存3年，利息能多拿大几百。' : profile.risk === 'balanced' ? '存款达标就送礼品，存得多送得多。米面油、小家电、购物卡，种类丰富，都是实用的东西。' : '大额存单优先额度，好产品额度都是靠抢的，新客户有优先认购权，不用担心抢不到。'}\n\n2️⃣ 活动时间有限\n截止到本月底，利率随时可能调整，先存先锁定。最近一直在观望的朋友，可以趁这个机会行动起来。\n\n3️⃣ 我可以全程指导\n对流程不熟悉的朋友不用担心，从开户到存款，我一步一步教你，保证学会。\n\n✨ 温馨提示：\n存款虽然安全，但也要合理规划期限。根据自己的资金使用计划，选择合适的存期，不要盲目追求高利息而忽略了流动性。\n\n感兴趣的朋友可以私信我了解详情~\n\n#存款活动 #新客福利 #利率上浮\n—— 您身边的理财顾问`;
}

function gen_deposit_s5_chat(profile, info, style, scene, focusText) {
  const addr = scene.address;
  const activity = info.activities[0];
  return `${addr}好呀~\n\n有个好消息第一时间想到告诉${addr}！\n\n我们银行最近有个${activity}的活动，我觉得${addr}正好可以赶上，跟${addr}说说：\n\n🎁 活动内容：\n1️⃣ ${activity}\n　　${profile.risk === 'conservative' ? '新客户专享存款利率上浮，比普通客户高0.15个百分点。10万块存3年，利息能多拿450块钱呢。而且是正规银行存款，保本保息，完全不用担心。' : profile.risk === 'balanced' ? '存款达标就送礼品，存5万送米面油套装，存20万送小家电，存50万送高端礼品。都是实用的好东西，相当于额外收益了。' : '大额存单优先额度，现在3年期大额存单额度很紧张，经常一放出来就被抢光。新客户有优先认购权，我可以帮${addr}预留额度。'}\n\n2️⃣ 活动时间\n　　截止到本月底，还有不到两周时间，额度有限先到先得。\n\n3️⃣ ${addr}参与的话\n　　我可以全程协助${addr}办理，${addr}要是没空来网点，手机银行就能操作，我一步一步教${addr}。\n\n${addr}要不要了解一下？我帮${addr}预约一下？\n\n祝好！`;
}

// 第6步：转化跟进
function gen_deposit_s6_chat(profile, info, style, scene, focusText) {
  const addr = scene.address;
  return `${addr}好呀~\n\n上次跟${addr}聊的存款产品，${addr}考虑得怎么样了？\n\n正好这两天利率又有调整的消息，想跟${addr}聊聊我的看法：\n\n1️⃣ 关于利率走势\n　　从目前的情况看，利率下行的大趋势没有变。市场普遍预期下半年还会有降息动作。所以有闲钱的话，尽早存长期的，把利率锁定住，是比较划算的。等降息了再存，利息就少了。\n\n2️⃣ 关于存多少合适\n　　我建议${addr}可以先存一部分，${profile.risk === 'conservative' ? '比如先存10万试试，觉得合适了再加' : profile.risk === 'balanced' ? '把3-5年不用的闲钱存进来，日常用的钱留成活期就行' : '可以做一个阶梯组合，分散存不同期限，兼顾收益和流动性'}。不用一下都存进来，先感受一下。\n\n3️⃣ 关于操作\n　　${addr}不用担心操作麻烦，很简单的。${addr}要是有空来网点，我帮${addr}办；要是没空，手机银行就能操作，我一步一步教${addr}，几分钟就搞定了。\n\n${addr}看是先存一部分，还是再考虑考虑？有任何疑问随时问我~\n\n祝好！`;
}

function gen_deposit_s6_phone(profile, info, style, scene, focusText) {
  const addr = scene.address;
  return `【开场】\n客户经理：${addr}好！我是XX银行的小X。打扰${addr}了，现在方便说两句吗？\n\n【引入】\n客户经理：${addr}还记得上次跟${addr}聊的存款产品吗？正好这两天有消息说利率可能还要调整，我想着赶紧跟${addr}通个气，看看${addr}考虑得怎么样了。\n\n【核心内容一：利率最新情况】\n客户经理：跟${addr}说下最新的情况啊。现在市场上普遍预期下半年还会降息，各大银行的存款利率都在往下走。我们银行目前的3年期大额存单利率还没调，但估计也快了。所以${addr}要是打算存的话，这两周是个好时机，存了就锁定利率了，就算后面降息也跟${addr}没关系。\n\n【核心内容二：我的建议】\n客户经理：所以我的建议是，${addr}如果有闲钱暂时不用，可以先存一部分。不用一下都存进来，先存一笔长期的把利率锁住，剩下的慢慢规划。这样进可攻退可守。\n\n【核心内容三：降低行动门槛】\n客户经理：${addr}不用担心操作的事，很简单的。${addr}要是有空来网点，我帮${addr}办，十分钟就好；要是没空，手机银行就能买，我在电话里教${addr}操作也行。\n\n【互动确认】\n客户经理：${addr}觉得呢？现在是打算先存一部分，还是还有什么顾虑？\n\n【行动建议】\n客户经理：要不这样吧${addr}，${addr}先存5万或者10万试试，先把当前的利率锁定住。如果觉得好，后面再加也不迟。${addr}看怎么样？\n\n【收尾】\n客户经理：行，那${addr}要是决定了随时找我，我帮${addr}预留额度。或者${addr}还有什么想了解的，随时给我打电话。\n好的${addr}，那不打扰${addr}了，再见！`;
}

// 第7步：异议处理
function gen_deposit_s7_phone(profile, info, style, scene, focusText) {
  const addr = scene.address;
  const objections = info.objections;
  return `【开场】\n客户经理：${addr}好！我是小X。${addr}现在方便吗？\n\n【引入】\n客户经理：上次跟${addr}聊了存款的事，我回去想了想，${addr}可能还有一些顾虑没好意思说。今天特意给${addr}打个电话，想跟${addr}好好聊聊，有什么疑问都可以说，我帮${addr}分析分析。\n\n【异议一：收益太低了，跑不赢通胀】\n客户经理：${addr}说得没错，存款收益确实不高，跑不赢通胀也是事实。\n　　但存款最大的优势是安全啊，是${addr}资产的"压舱石"。${addr}想想，万一急用钱的时候，其他资产可能在亏损卖不掉，但存款随时能用。理财讲究的是配置，不能把所有钱都拿去追求高收益，得有一部分稳的。就像盖房子，地基不牢，房子再高也会倒。存款就是那个地基。\n\n【异议二：提前支取损失利息，太不灵活了】\n客户经理：这个问题问得很好，很多人都有这个顾虑。\n　　其实这个问题很好解决。${addr}可以用"阶梯存款法"，把钱分成几份存不同期限，这样每年都有到期的钱，既有高利息又有流动性。而且现在很多大额存单都支持转让，急用钱的时候可以转让出去，利息损失很小。我可以帮${addr}设计一个最适合的存款组合。\n\n【异议三：银行会不会倒闭？我的钱安全吗？】\n客户经理：${addr}有这个担心很正常，但真的不用太担心。\n　　我们国家有存款保险制度，同一个人在同一家银行50万以内的存款，就算银行出问题了也会全额赔付。而且我们银行是正规银行，资本充足率远高于监管要求，经营非常稳健。退一步说，就算${addr}存的钱超过50万，也可以分散到几家银行存，每家不超过50万，就完全没问题了。\n\n【互动确认】\n客户经理：${addr}还有其他什么顾虑吗？都可以跟我说。\n\n【行动建议】\n客户经理：我觉得${addr}可以先少存一点试试，比如先存几万块钱的3年期，感受一下。反正存款保本保息，也不会亏，不合适到期了取出来就行。${addr}觉得呢？\n\n【收尾】\n客户经理：行，那${addr}再想想，有任何问题随时找我。${addr}的顾虑我都理解，钱的事，谨慎点是对的。我这边也会帮${addr}关注着利率变化，有好的产品及时告诉${addr}。\n好的${addr}，那${addr}先忙，再见！`;
}

function gen_deposit_s7_chat(profile, info, style, scene, focusText) {
  const addr = scene.address;
  const objections = info.objections;
  return `${addr}好~\n\n上次跟${addr}聊完存款的事，我回去想了想，${addr}可能心里还有一些疑问没好意思问。今天整理了几个大家最常问的问题，跟${addr}分享一下：\n\n❓ 问题1：${objections[0].q}\n💡 ${objections[0].a}\n\n❓ 问题2：${objections[1].q}\n💡 ${objections[1].a}\n\n❓ 问题3：${objections[2].q}\n💡 ${objections[2].a}\n\n其实我特别理解${addr}的顾虑，钱的事，谨慎点总是好的。我这边能做的，就是把真实情况告诉${addr}，好的坏的都说到，让${addr}自己做判断。\n\n${addr}还有什么其他疑问吗？随时问我，我一定如实解答~\n\n祝好！`;
}

// 第8步：成交转介
function gen_deposit_s8_chat(profile, info, style, scene, focusText) {
  const addr = scene.address;
  const referral = info.referral[profile.age];
  return `${addr}好呀~\n\n${addr}的存款已经办理成功了，回执单我已经发给${addr}了，${addr}收到了吧？\n\n跟${addr}说一下后续的服务安排：\n\n1️⃣ 到期提醒\n　　${addr}的每一笔存款到期前，我都会提前提醒${addr}，告诉${addr}最新的利率情况，帮${addr}规划是续存还是取出来。不用担心忘了到期时间。\n\n2️⃣ 利率通知\n　　如果有新的高利率产品或者利率调整，我会第一时间告诉${addr}，让${addr}及时掌握信息，不错过好机会。\n\n3️⃣ 综合理财服务\n　　除了存款，如果${addr}对其他理财产品感兴趣，或者想做一个全面的资产配置规划，都可以找我。\n\n另外啊，${referral.replace(/[「」]/g, '')}\n\n${addr}有任何问题随时联系我，祝您理财顺利！`;
}

function gen_deposit_s8_moments(profile, info, style, scene, focusText) {
  return `【客户故事】📖\n\n今天帮一位阿姨办理了30万的大额存单续存。阿姨说，存了这么多年，就信任我们银行，也信任我这个理财经理。\n\n听到这话，心里暖暖的。\n\n分享几点感悟：\n\n1️⃣ 信任是靠时间积累的\n客户愿意把辛苦攒下的钱交给你打理，这份信任不是一天两天建立的，是靠一次又一次的专业服务、真诚沟通换来的。\n\n2️⃣ 稳健的力量\n存款虽然收益不高，但它是很多人生活的底气。尤其是中老年朋友，辛苦了一辈子攒下的钱，安全比什么都重要。能帮他们守住这份安稳，就是我的价值。\n\n3️⃣ 服务没有终点\n存款到期了，服务没有到期。每一次提醒、每一次解答，都是服务的一部分。\n\n感谢每一位信任我的客户。理财路上，我会一直陪着你们~\n\n如果你的朋友也在找稳健的理财方式，欢迎推荐给我，我会用心对待每一位客户。\n\n#存款 #稳健理财 #客户信任\n—— 您身边的理财顾问`;
}

// ============================================
// 产品4：理财产品 (wealth) - 8步×4渠道完整文案
// ============================================

// 第1步：热点促达
function gen_wealth_s1_moments(profile, info, style, scene, focusText) {
  const topic = info.hotTopics[profile.risk];
  return `【理财观察】📊\n\n${topic}\n\n分享三个观点：\n\n1️⃣ 资管新规时代，理财逻辑变了\n以前买理财闭眼买就行，现在不一样了。净值化之后，理财也会有波动，选理财的思路得变一变。\n\n2️⃣ ${style.keyword}，是选理财的核心原则\n${profile.risk === 'conservative' ? 'R1-R2级别的理财，风险很低，适合追求稳健的投资者。虽然不保本了，但实际亏损的概率还是非常小的。' : profile.risk === 'balanced' ? 'R2-R3级别的理财，以固收为主、权益为辅，波动适中，长期收益也不错，适合大多数人。' : 'R4-R5级别的理财，权益占比较高，波动大一些，但收益空间也大，适合风险承受能力强的投资者。'}\n\n3️⃣ 选理财要看三个维度：风险等级、投资方向、历史业绩\n不能只看收益率，风险才是第一位的。\n\n现在的理财市场，比的不是谁收益高，而是谁能在控制风险的前提下获取稳健收益。\n\n大家怎么看？欢迎评论区交流~\n\n#理财产品 #净值化 #${style.intensity.replace(/、/g, ' #')}\n—— 您身边的理财顾问`;
}

function gen_wealth_s1_group(profile, info, style, scene, focusText) {
  const topic = info.hotTopics[profile.risk];
  return `【早安分享 · 理财话题】🌅\n\n各位群友早上好！今天聊聊大家最关心的理财产品~\n\n📰 今日热点：\n${topic}\n\n💡 分享三个理财认知：\n① 净值化不是洪水猛兽\n　资管新规之后，理财都净值化了。净值波动不代表真的亏损，只要持有到期，大部分产品都能实现预期收益。波动是正常的，不用太紧张。\n\n② 风险等级要匹配\n　R1到R5，风险依次升高。买理财之前先测一下自己的风险承受能力，选匹配的产品，不要只看收益。\n\n③ ${style.keyword}是王道\n　理财不是收益越高越好，适合自己的才是最好的。稳健型客户选R2，平衡型选R3，进取型可以考虑R4。\n\n💬 今日话题讨论：\n"你买理财最看重什么？"\nA. 收益率高低\nB. 风险大小\nC. 期限长短\nD. 银行/机构品牌\n\n欢迎大家交流～ 有任何理财相关的问题，随时@我！\n\n—————————\n风险提示：理财非存款，产品有风险，投资需谨慎。`;
}

// 第2步：投教培育
function gen_wealth_s2_moments(profile, info, style, scene, focusText) {
  const edTopic = info.edTopics[profile.risk];
  return `【理财小课堂】📚\n\n今天聊聊：${edTopic}\n\n🎯 核心知识点：\n\n1️⃣ ${profile.risk === 'conservative' ? '净值化时代，怎么选稳健的理财？' : profile.risk === 'balanced' ? 'R1到R5，理财风险等级怎么看？' : '理财产品也能投股票？权益类理财了解一下'}\n${profile.risk === 'conservative' ? '很多人担心净值化之后理财不安全了，其实不是的。选稳健的理财，看三点：一是风险等级R1-R2，二是投资方向以债券和非标为主，三是大型银行或头部机构发行的。满足这三点，稳健性是有保障的。' : profile.risk === 'balanced' ? 'R1是最低风险，几乎不会亏；R2是中低风险，波动很小；R3是中等风险，会有一些波动；R4/R5风险就比较高了，权益占比大。一般来说，保守型选R1-R2，平衡型选R2-R3，进取型可以考虑R3-R4。' : '很多人以为理财都是稳的，其实不是。R4以上的权益类理财，股票仓位可以到50%甚至更高，波动跟混合型基金差不多。当然，收益空间也更大。风险和收益永远是匹配的。'}\n\n2️⃣ 买理财的最佳姿势：分散+长期\n不要把所有钱都买一只产品，分散买不同期限、不同类型的。也不要频繁买卖，理财是持有期产品，持有到期收益更确定。\n\n3️⃣ ${style.keyword}，适合的才是最好的\n\n✨ 今日感悟：\n理财理财，理的是生活。选择适合自己风险承受能力的产品，睡个安稳觉，比什么都重要。\n\n觉得有用的话点个赞，有问题评论区见~\n\n#理财知识 #净值化 #${style.intensity.replace(/、/g, ' #')}\n—— 您身边的理财顾问`;
}

function gen_wealth_s2_chat(profile, info, style, scene, focusText) {
  const addr = scene.address;
  const edTopic = info.edTopics[profile.risk];
  return `${addr}好呀~\n\n昨天发了一条关于${edTopic.replace(/[「」]/g, '')}的朋友圈，想到${addr}可能也会感兴趣，整理了几个要点跟${addr}分享：\n\n1️⃣ 为什么这个话题值得关注\n　　${profile.risk === 'conservative' ? '资管新规之后，理财都净值化了，很多人心里没底。其实只要选对产品，稳健性还是有保障的。了解怎么选稳健的理财，心里才有底。' : profile.risk === 'balanced' ? '很多人买理财只看收益，不看风险等级，这是不对的。不同风险等级的产品，投向和波动都不一样。搞懂风险等级，才能选到适合自己的产品。' : '很多人以为理财都是稳的，其实不是。现在有权益类理财，股票仓位很高，收益空间大但波动也大。了解不同类型的理财，才能做出正确的选择。'}\n\n2️⃣ 实操中的几个关键点\n　　第一，先搞清楚自己的风险承受能力；第二，根据风险等级选产品，不要只看收益；第三，分散配置，不要all in一只产品。\n\n3️⃣ 给${addr}的小建议\n　　如果${addr}平时也买理财，可以把${addr}现在持有的产品发给我看看，我帮${addr}分析分析配置是否合理。\n\n${addr}要是有什么疑问，随时找我聊~\n\n祝${addr}今天一切顺利！`;
}

// 第3步：场景种草
function gen_wealth_s3_moments(profile, info, style, scene, focusText) {
  const scenes = scene.scenes;
  return `【生活中的理财】🏠\n\n最近跟几个客户聊天，发现大家都有一个共同的困扰：${scene.painPoint}\n\n其实理财的本质，就是让钱为我们的生活目标服务。\n\n分享三个心得：\n\n1️⃣ 理财要跟人生阶段匹配\n不同的年龄、不同的家庭情况，理财的策略完全不一样。${scenes[0]}的钱要稳，${scenes[1]}的钱要增值，不能一概而论。\n\n2️⃣ 理财产品是"中间地带"的好选择\n存款太稳收益低，基金股票波动大，理财产品就在中间。${style.keyword}，既能获得比存款高的收益，风险又比股市小很多。\n\n3️⃣ ${scene.moneyDesc}的配置思路\n${scene.moneyDesc}不能全部放银行（收益太低），也不能全部投股市（风险太大）。拿一部分配理财产品，是大多数人的最优解。\n\n✨ 很喜欢一句话：\n"你不理财，财不理你。理财不是目的，过上想要的生活才是。"\n\n共勉~\n\n#理财人生 #资产配置 #${scene.moneyDesc}\n—— 您身边的理财顾问`;
}

function gen_wealth_s3_chat(profile, info, style, scene, focusText) {
  const addr = scene.address;
  const pitch = info.scenePitches[profile.age];
  return `${addr}好~\n\n今天有个客户来做理财配置，情况跟${addr}挺像的，想跟${addr}聊聊：\n\n1️⃣ 很多人的困扰：钱不知道放哪好\n　　存银行吧收益太低，买基金吧又怕波动。其实理财产品是个很好的中间选择，风险适中，收益也比存款好不少。\n\n2️⃣ ${pitch.replace(/[「」]/g, '')}\n\n3️⃣ 理财的门槛其实不高\n　　很多理财1万块起购，有的甚至1块钱起。不用有很多钱才能理财，小钱也可以理起来，关键是要有这个意识。\n\n${addr}平时闲钱都怎么打理呀？有空可以聊聊~${addr}要是对理财产品感兴趣，我可以给${addr}推荐几款适合的。\n\n祝好！`;
}

// 第4步：产品介绍
function gen_wealth_s4_chat(profile, info, style, scene, focusText) {
  const addr = scene.address;
  const selling = info.productSelling[profile.risk];
  return `${addr}好呀~\n\n上次跟${addr}聊到理财的话题，我回去看了一下目前在售的产品，有一款挺适合${addr}的，跟${addr}详细说说：\n\n📌 产品亮点：\n\n1️⃣ 【产品定位】${selling}\n　　${profile.risk === 'conservative' ? '这是一款R2级别的固定收益类理财，主要投资债券和非标资产，股票仓位很低，所以波动很小。历史业绩来看，每年收益在3.5%-4.5%左右，虽然不保本，但实际风险很低，适合追求稳健收益的投资者。' : profile.risk === 'balanced' ? '这是一款R3级别的混合类理财，以债券投资为主，搭配少量权益资产。这样的搭配既能享受债券的稳定收益，又能通过股票部分增强收益。长期年化大概4%-6%，波动适中，适合平衡型投资者。' : '这是一款R4级别的权益类理财，主要投资股票市场，由专业的投资团队管理。它的优势在于：第一，有专业团队管理，比自己炒股风险分散；第二，起投门槛比私募低很多；第三，收益空间大，行情好的时候收益很可观。'}\n\n2️⃣ 【适合人群】\n　　像${addr}这样${scene.painPoint}的情况，这款产品的风险收益特征正好匹配${addr}的需求。\n\n3️⃣ 【配置建议】\n　　建议${addr}可以先拿出${scene.moneyDesc}的一部分来配置，不用一下投入太多，先感受一下产品的波动和收益情况，合适了再加仓也不迟。\n\n我把产品的详细资料发给${addr}看看？${addr}有任何疑问随时问我~\n\n祝好！`;
}

function gen_wealth_s4_phone(profile, info, style, scene, focusText) {
  const addr = scene.address;
  const selling = info.productSelling[profile.risk];
  return `【开场】\n客户经理：${addr}好！我是XX的小X。打扰${addr}几分钟，现在方便说话吗？\n\n【引入话题】\n客户经理：${addr}还记得上次我们聊到理财的事嘛？我回去看了一下目前在售的产品，觉得有一款挺适合${addr}的，想跟${addr}详细介绍一下，看看对${addr}有没有参考价值。大概5分钟时间，可以吗？\n\n【核心内容一：为什么推荐这款】\n客户经理：是这样的，${addr}的情况是${scene.painPoint}，所以我觉得${style.keyword}的思路比较适合${addr}。这款产品最大的特点就是${selling}，跟${addr}的风险偏好和投资需求都比较匹配。\n\n【核心内容二：产品具体好在哪】\n客户经理：具体来说，我觉得有三个亮点。第一，发行机构靠谱，是我们行自营的理财，管理团队经验丰富，历史业绩稳定；第二，策略清晰，${profile.risk === 'conservative' ? '主打固收，追求稳健收益' : profile.risk === 'balanced' ? '股债搭配，攻守兼备' : '权益为主，追求超额收益'}；第三，期限灵活，有3个月、6个月、1年、2年的，${addr}可以根据自己的资金使用情况选。\n\n【核心内容三：风险也要说清楚】\n客户经理：当然了，我也得跟${addr}说清楚风险。现在理财都是净值化的，不保本保息。这款产品是${style.intensity}的，${profile.risk === 'conservative' ? '波动很小，历史上几乎没有亏损的情况，但理论上还是有风险的' : profile.risk === 'balanced' ? '有一定的波动，市场不好的时候可能会有回撤，但持有到期基本都能实现预期收益' : '波动比较大，跟混合型基金差不多，需要有一定的风险承受能力'}。这一点${addr}也要有心理准备。\n\n【互动确认】\n客户经理：${addr}觉得呢？这个风险收益水平${addr}能接受吗？还有什么想了解的？\n\n【行动建议】\n客户经理：我给${addr}两个建议啊。第一，${addr}可以先少买一点试试，比如先买5万感受一下；第二，我把产品的详细资料和历史业绩发给${addr}，${addr}有空的时候好好看看，不明白的随时问我。\n\n【收尾】\n客户经理：行，那今天就先跟${addr}聊这些。我稍后把资料发${addr}，${addr}先看看，有什么想法随时联系我。\n好的${addr}，那${addr}先忙，再见！`;
}

// 第5步：活动推荐
function gen_wealth_s5_moments(profile, info, style, scene, focusText) {
  const activity = info.activities[0];
  return `【好消息】🎁\n\n${activity}活动开始了！\n\n跟大家说说这个活动的几个亮点：\n\n1️⃣ ${activity}，专属福利\n${profile.risk === 'conservative' ? '新客户专属理财，收益比普通产品高0.3个百分点。10万块钱存半年，利息就能多150块，白捡的福利。' : profile.risk === 'balanced' ? '理财夜市专属产品，只有晚上8点到10点才能买，收益比白天的高0.2-0.3个百分点。很多老客户定闹钟抢。' : '理财经理一对一配置服务，帮你做全面的资产诊断，量身定制理财方案，平时收费的现在免费。'}\n\n2️⃣ 活动时间有限\n好的产品额度有限，先到先得。最近一直在观望的朋友，可以趁这个机会行动起来。\n\n3️⃣ 我可以全程指导\n对流程不熟悉的朋友不用担心，从开户到购买，我一步一步教你，保证学会。\n\n✨ 温馨提示：\n理财非存款，产品有风险，投资需谨慎。一定要选择适合自己风险承受能力的产品哦~\n\n感兴趣的朋友可以私信我了解详情~\n\n#理财活动 #新客福利 #专属理财\n—— 您身边的理财顾问`;
}

function gen_wealth_s5_chat(profile, info, style, scene, focusText) {
  const addr = scene.address;
  const activity = info.activities[0];
  return `${addr}好呀~\n\n有个好消息第一时间想到告诉${addr}！\n\n我们银行最近有个${activity}的活动，我觉得${addr}正好可以赶上，跟${addr}说说：\n\n🎁 活动内容：\n1️⃣ ${activity}\n　　${profile.risk === 'conservative' ? '新客专属理财，收益比普通产品高0.3个百分点。10万块买半年期的，利息能多拿150块钱呢。而且是R2级别的，风险很低，很适合${addr}的风格。' : profile.risk === 'balanced' ? '理财夜市专属高收益产品，每天晚上8点到10点开放抢购，收益比白天的产品高0.2-0.3个百分点。额度有限，经常一放出来就被抢光。' : '理财经理一对一配置服务，我帮${addr}做一个全面的资产诊断，看看${addr}现在的配置是否合理，然后量身定制一个理财方案。平时这项服务是收费的，现在免费。'}\n\n2️⃣ 活动时间\n　　截止到本月底，还有不到两周时间，额度有限先到先得。\n\n3️⃣ ${addr}参与的话\n　　我可以全程协助${addr}操作，${addr}要是没空来网点，手机银行就能买，我一步一步教${addr}。\n\n${addr}要不要了解一下？我帮${addr}预留额度？\n\n祝好！`;
}

// 第6步：转化跟进
function gen_wealth_s6_chat(profile, info, style, scene, focusText) {
  const addr = scene.address;
  return `${addr}好呀~\n\n上次跟${addr}聊的那款理财产品，${addr}考虑得怎么样了？\n\n正好这两天有个新的产品额度放出来，想跟${addr}聊聊我的看法：\n\n1️⃣ 关于时机\n　　${profile.risk === 'conservative' ? '稳健型理财其实不用太择时，越早买越早享收益。现在收益水平还可以，趁有额度的时候先买上，比拿着活期强多了。' : profile.risk === 'balanced' ? '现在市场利率整体下行，理财产品的收益也在慢慢降。有合适的产品就先买上锁定收益，等收益降了再买就不划算了。' : '权益类理财的话，现在市场估值不算高，是布局的好时机。长期来看，这个点位入场，赚钱的概率还是挺大的。'}\n\n2️⃣ 关于金额\n　　我建议${addr}可以先从小额开始，比如先买5万试试水，感受一下产品的波动，觉得合适了再加。或者${addr}也可以分散买几款不同期限的，既有流动性又有高收益。\n\n3️⃣ 操作上的事不用担心\n　　${addr}要是决定买，我一步一步教${addr}操作，很简单的，几分钟就搞定了。买完之后我也会帮${addr}盯着，有重要变化及时告诉${addr}。\n\n${addr}看是先小试一下，还是再多了解了解？有任何疑问随时问我~\n\n祝好！`;
}

function gen_wealth_s6_phone(profile, info, style, scene, focusText) {
  const addr = scene.address;
  return `【开场】\n客户经理：${addr}好！我是XX的小X。打扰${addr}了，现在方便说两句吗？\n\n【引入】\n客户经理：${addr}还记得上次跟${addr}聊的那款理财吗？正好这两天有新的额度放出来，我想着赶紧跟${addr}通个气，看看${addr}考虑得怎么样了。\n\n【核心内容一：为什么建议现在入手】\n客户经理：跟${addr}说下最新的情况啊。现在市场利率整体在下行，理财产品的收益率也在慢慢往下走。有合适的产品、合适的收益，先买上锁定住，是比较明智的做法。等收益降下去了再买，就不划算了。而且这款产品额度挺紧张的，上次放出来半天就没了。\n\n【核心内容二：我的建议】\n客户经理：所以我的建议是，${addr}如果看好这个方向，可以先买一部分。不用一下投入太多，先买5万或者10万试试水，感受一下产品的特性，觉得合适了再加。这样既不错过机会，风险也可控。\n\n【核心内容三：降低行动门槛】\n客户经理：${addr}不用担心操作的事，很简单的。${addr}要是有空来网点，我帮${addr}办；要是没空，手机银行就能买，我在电话里教${addr}操作也行，几分钟就搞定了。\n\n【互动确认】\n客户经理：${addr}觉得呢？现在是打算先试试，还是还有什么顾虑？\n\n【行动建议】\n客户经理：要不这样吧${addr}，${addr}先买5万块钱试试，先感受一下。如果觉得产品不错、自己也能接受这个波动，后面再加仓也不迟。${addr}看怎么样？\n\n【收尾】\n客户经理：行，那${addr}要是决定了随时找我，我帮${addr}盯着额度。或者${addr}还有什么想了解的，随时给我打电话。\n好的${addr}，那不打扰${addr}了，再见！`;
}

// 第7步：异议处理
function gen_wealth_s7_phone(profile, info, style, scene, focusText) {
  const addr = scene.address;
  const objections = info.objections;
  return `【开场】\n客户经理：${addr}好！我是小X。${addr}现在方便吗？\n\n【引入】\n客户经理：上次跟${addr}聊了理财的事，我回去想了想，${addr}可能还有一些顾虑没好意思说。今天特意给${addr}打个电话，想跟${addr}好好聊聊，有什么疑问都可以说，我帮${addr}分析分析。\n\n【异议一：不是说理财保本吗？怎么现在也会亏？】\n客户经理：${addr}的感受我特别理解，很多客户都有这个疑问。\n　　确实，以前的理财是保本保息的，但资管新规之后，所有理财都净值化了，不再保本保息，这是行业的大趋势。但${addr}也不用太担心，${profile.risk === 'conservative' ? 'R2级别的理财，主要投的是债券，虽然短期会有波动，但持有到期基本都能达到预期收益。' : profile.risk === 'balanced' ? 'R3级别的理财，以债为主、以股为辅，波动是有的，但只要持有时间够长，亏钱的概率还是很低的。' : 'R4级别的理财，波动确实大一些，但长期收益也更高。关键是要匹配自己的风险承受能力。'}\n　　关键是选对产品、持有足够长的时间。\n\n【异议二：风险等级看不懂，不知道买哪个】\n客户经理：这个问题很正常，很多客户一开始都搞不清楚。\n　　我给${addr}简单讲一下啊。R1是最低风险，几乎不会亏，跟存款差不多；R2是中低风险，波动很小；R3是中等风险，会有一些波动；R4/R5风险就比较高了。我会根据${addr}的风险承受能力，帮${addr}选合适的产品，${addr}不用自己费脑子研究。\n\n【异议三：净值波动看着闹心，还不如存款踏实】\n客户经理：我特别理解，看着数字上下波动确实不舒服。\n　　但${addr}要知道，净值波动不代表真的亏损，只要持有到期，大部分产品都能实现预期收益。而且正是因为有了这些波动，理财的收益才会比存款高。如果实在接受不了波动，${addr}可以选期限短一点的，或者干脆就买存款，适合自己的才是最好的。\n\n【互动确认】\n客户经理：${addr}还有其他什么顾虑吗？都可以跟我说。\n\n【行动建议】\n客户经理：我觉得${addr}可以先少买一点试试，不用一下投入太多。真金白银投进去了，感受才最深。如果觉得合适，后面再加；如果觉得不适合自己，到期了取出来就行，损失也不大。${addr}觉得呢？\n\n【收尾】\n客户经理：行，那${addr}再想想，有任何问题随时找我。${addr}的顾虑我都理解，投资嘛，谨慎点是对的。我这边也会帮${addr}关注着，有好的产品及时告诉${addr}。\n好的${addr}，那${addr}先忙，再见！`;
}

function gen_wealth_s7_chat(profile, info, style, scene, focusText) {
  const addr = scene.address;
  const objections = info.objections;
  return `${addr}好~\n\n上次跟${addr}聊完理财的事，我回去想了想，${addr}可能心里还有一些疑问没好意思问。今天整理了几个大家最常问的问题，跟${addr}分享一下：\n\n❓ 问题1：${objections[0].q}\n💡 ${objections[0].a}\n\n❓ 问题2：${objections[1].q}\n💡 ${objections[1].a}\n\n❓ 问题3：${objections[2].q}\n💡 ${objections[2].a}\n\n其实我特别理解${addr}的顾虑，投资嘛，谨慎点总是好的。我这边能做的，就是把真实情况告诉${addr}，好的坏的都说到，让${addr}自己做判断。\n\n${addr}还有什么其他疑问吗？随时问我，我一定如实解答~\n\n祝好！`;
}

// 第8步：成交转介
function gen_wealth_s8_chat(profile, info, style, scene, focusText) {
  const addr = scene.address;
  const referral = info.referral[profile.age];
  return `${addr}好呀~\n\n${addr}买的那款理财已经确认份额了，${addr}收到短信通知了吧？\n\n跟${addr}说一下后续的服务安排：\n\n1️⃣ 持仓跟踪\n　　${addr}买的这款产品我会帮${addr}盯着的，每周我都会看一下净值变化和运作情况。如果有重要的市场变化或者产品调整，我会及时告诉${addr}。\n\n2️⃣ 到期提醒\n　　产品到期前我会提前提醒${addr}，告诉${addr}最新的产品情况，帮${addr}规划是续购还是取出来。不用担心忘了到期时间。\n\n3️⃣ 更多服务\n　　除了这款产品，如果${addr}对其他投资方向感兴趣，或者想做一个全面的资产配置检视，都可以找我。\n\n另外啊，${referral.replace(/[「」]/g, '')}\n\n${addr}有任何问题随时联系我，祝您投资顺利！`;
}

function gen_wealth_s8_moments(profile, info, style, scene, focusText) {
  return `【客户故事】📖\n\n今天有个客户跟我说，跟着我买理财两年了，收益稳定，特别放心。\n\n听到这话，心里特别欣慰。\n\n分享几点感悟：\n\n1️⃣ 信任是最好的口碑\n客户愿意把钱交给你打理，这份信任比什么都珍贵。我能做的，就是不辜负这份信任，帮客户选好产品、做好服务。\n\n2️⃣ 稳健才能长久\n理财不是比谁赚得多，而是比谁走得稳。一年赚20%不难，难的是年年赚8%。稳健复利，才是财富增长的密码。\n\n3️⃣ 服务创造价值\n买理财只是开始，后续的跟踪服务、到期提醒、调整建议，这些才是理财顾问的价值所在。\n\n感谢每一位信任我的客户。理财路上，我会一直陪着你们~\n\n如果你的朋友也在做理财，欢迎推荐给我，我会用心对待每一位客户。\n\n#理财 #稳健增值 #客户信任\n—— 您身边的理财顾问`;
}

// ============================================
// 产品5：股票权益 (stock) - 8步×4渠道完整文案
// ============================================

// 第1步：热点促达
function gen_stock_s1_moments(profile, info, style, scene, focusText) {
  const topic = info.hotTopics[profile.risk];
  return `【市场观察】📈\n\n${topic}\n\n分享三个观点：\n\n1️⃣ 市场永远在波动，机会是跌出来的\n${profile.risk === 'conservative' ? '市场跌多了，优质股票的估值就便宜了。对于长期投资者来说，下跌不是风险，是机会。关键是要选对公司。' : profile.risk === 'balanced' ? '政策底之后，市场底往往不远了。每次大的政策转向，都会带来一波行情。方向比节奏更重要。' : 'AI、新能源、半导体，这些长期赛道每次回调都是布局机会。产业趋势一旦形成，不会因为短期波动而改变。'}\n\n2️⃣ ${style.keyword}，是穿越牛熊的底气\n投资不是比谁赚得多，而是比谁活得久。控制好风险，才能在市场里长久生存。\n\n3️⃣ 普通人投资股市，最好的方式是借道专业机构\n自己选股太难了，选基金、找投顾，让专业的人做专业的事，胜率更高。\n\n投资这条路，慢慢来，比较快。\n\n大家怎么看？欢迎评论区交流~\n\n#股市 #${profile.risk === 'conservative' ? '高股息' : profile.risk === 'balanced' ? '核心资产' : '成长赛道'} #投资策略\n—— 您身边的投资顾问`;
}

function gen_stock_s1_group(profile, info, style, scene, focusText) {
  const topic = info.hotTopics[profile.risk];
  return `【早安分享 · 股市话题】🌅\n\n各位群友早上好！今天聊聊股市~\n\n📰 今日热点：\n${topic}\n\n💡 分享三个投资认知：\n① 市场短期是投票机，长期是称重机\n　短期涨跌受情绪影响很大，但长期来看，股价最终会回归企业的基本面。好公司也会跌，但跌了还能涨回来；差公司涨再多，最终也会跌回去。\n\n② 不要追热点，要找基本面\n　热点炒来炒去，最后都是一地鸡毛。真正能赚钱的，都是那些基本面扎实、业绩稳定增长的好公司。\n\n③ ${style.keyword}，投资要有体系\n　没有体系的投资，就像在大海里没有指南针的船。买什么、什么时候买、什么时候卖，都要有清晰的规则。\n\n💬 今日话题讨论：\n"当前市场，你更看好哪个方向？"\nA. 高股息/价值股\nB. 科技成长\nC. 消费复苏\nD. 先观望\n\n欢迎大家交流～ 有任何股票投资相关的问题，随时@我！\n\n—————————\n风险提示：以上观点仅供参考，不构成投资建议。股市有风险，投资需谨慎。`;
}

// 第2步：投教培育
function gen_stock_s2_moments(profile, info, style, scene, focusText) {
  const edTopic = info.edTopics[profile.risk];
  return `【投资小课堂】📚\n\n今天聊聊：${edTopic}\n\n🎯 核心知识点：\n\n1️⃣ ${profile.risk === 'conservative' ? '高股息策略：熊市中的避风港' : profile.risk === 'balanced' ? '核心资产：为什么值得长期持有？' : '行业景气度投资法：如何抓住风口赛道？'}\n${profile.risk === 'conservative' ? '什么是高股息策略？就是买那些分红稳定、股息率高的优质公司。这些公司通常是行业龙头，业绩稳定，每年分红就有4%-6%，比存款高多了。而且股价波动也小，熊市里特别抗跌。进可攻退可守，是稳健型投资者的好选择。' : profile.risk === 'balanced' ? '什么是核心资产？就是各行业的龙头公司，有品牌、有技术、有壁垒、有定价权。这些公司的ROE常年在15%以上，业绩增长稳定。长期持有这些公司，就是分享中国经济成长的红利。短期波动不用太在意，时间是好公司的朋友。' : '什么是景气度投资？就是找那些行业正在高速增长的赛道，比如现在的AI、新能源、半导体。行业景气的时候，里面的公司业绩都会爆发式增长，股价也会有很好的表现。关键是要在景气周期的早期介入，在景气度见顶之前退出。'}\n\n2️⃣ 投资的本质是认知的变现\n你永远赚不到超出你认知范围的钱。靠运气赚的钱，最终会靠实力亏回去。持续学习、提升认知，才是投资的正道。\n\n3️⃣ ${style.keyword}，建立自己的投资体系\n\n✨ 今日感悟：\n投资是一场马拉松，不是百米冲刺。慢慢来，持续学习，时间会给你最好的回报。\n\n觉得有用的话点个赞，有问题评论区见~\n\n#投资知识 #${profile.risk === 'conservative' ? '高股息' : profile.risk === 'balanced' ? '核心资产' : '赛道投资'} #股票\n—— 您身边的投资顾问`;
}

function gen_stock_s2_chat(profile, info, style, scene, focusText) {
  const addr = scene.address;
  const edTopic = info.edTopics[profile.risk];
  return `${addr}好呀~\n\n昨天发了一条关于${edTopic.replace(/[「」]/g, '')}的朋友圈，想到${addr}可能也会感兴趣，整理了几个要点跟${addr}分享：\n\n1️⃣ 为什么这个话题值得关注\n　　${profile.risk === 'conservative' ? '很多人觉得股市风险太大不敢碰，但其实高股息策略的风险并不大。优质蓝筹股波动小、分红稳定，长期持有收益也不错，比存银行划算多了。' : profile.risk === 'balanced' ? '核心资产是经过市场验证的好公司，长期持有收益很不错。很多人在股市亏钱，就是因为追涨杀跌、频繁交易。持有好公司，时间就是你的朋友。' : '赛道投资是最近几年很火的投资方法，选对了赛道收益非常可观。但赛道投资也有风险，要能判断行业景气度，还要把握好买卖时机。'}\n\n2️⃣ 实操中的几个关键点\n　　第一，选对方向比选对个股更重要；第二，控制仓位，不要all in；第三，长期持有，不要频繁交易。\n\n3️⃣ 给${addr}的小建议\n　　如果${addr}对股票投资感兴趣，可以先从${profile.risk === 'conservative' ? '高股息蓝筹股或者相关基金' : profile.risk === 'balanced' ? '核心资产组合或者宽基指数' : '行业ETF或者主题基金'}开始入手，门槛不高，先学习学习。\n\n${addr}要是有什么疑问，随时找我聊~\n\n祝${addr}今天一切顺利！`;
}

// 第3步：场景种草
function gen_stock_s3_moments(profile, info, style, scene, focusText) {
  const scenes = scene.scenes;
  return `【投资与人生】💡\n\n最近跟一个客户聊天，他说到${scenes[0]}的规划，我特别有感触。\n\n其实投资最终都是为了生活服务的。${scenes[0]}、${scenes[1]}，这些人生目标的实现，都离不开财务的支撑。\n\n分享三个心得：\n\n1️⃣ 资产配置决定90%的收益\n不要把所有钱都放一个地方。存款、理财、基金、股票，合理搭配，才能在控制风险的前提下获取更好的收益。\n\n2️⃣ 权益资产是长期收益的来源\n长期来看，股票是所有大类资产里收益最高的。拿10%-20%的资产配置权益类产品，作为${scene.moneyDesc}的"增长极"，长期下来收益会很可观。\n\n3️⃣ ${profile.risk === 'conservative' ? '稳健打底，慢慢增值' : profile.risk === 'balanced' ? '攻守兼备，行稳致远' : '把握趋势，享受成长'}\n\n✨ 很认同一句话：\n"你永远赚不到超出认知的钱，但你可以通过学习，扩大自己的认知边界。"\n\n投资路上，一起成长~\n\n#投资人生 #资产配置 #${scene.moneyDesc}\n—— 您身边的投资顾问`;
}

function gen_stock_s3_chat(profile, info, style, scene, focusText) {
  const addr = scene.address;
  const pitch = info.scenePitches[profile.age];
  return `${addr}好~\n\n今天有个客户来开户，情况跟${addr}挺像的，聊了很多，想到${addr}也正好对投资感兴趣，跟${addr}说说：\n\n1️⃣ 为什么现在可以开始关注股市了\n　　${profile.risk === 'conservative' ? '现在市场估值不高，很多优质蓝筹股的股息率都到4%-5%了，比存款高不少。而且这些公司业绩稳定、分红靠谱，长期持有收益很可观。' : profile.risk === 'balanced' ? '政策底已经很明确了，市场底虽然可能还有反复，但中长期来看，现在这个位置布局，胜率还是很高的。核心资产估值合理，适合慢慢建仓。' : 'AI、新能源这些长期赛道，经过前期调整，估值已经回到合理区间了。行业的基本面没有变，长期成长空间还很大，现在是布局的好时机。'}\n\n2️⃣ ${pitch.replace(/[「」]/g, '')}\n\n3️⃣ 不用有压力，可以先从小额开始\n　　很多人觉得炒股需要很多钱，其实不是。几千块钱就能开始，关键是先入场学习，建立自己的投资体系。\n\n${addr}平时有关注股市吗？有空可以聊聊~${addr}要是感兴趣，我可以给${addr}推荐一些入门的资料，或者帮${addr}看看手上的持仓。\n\n祝好！`;
}

// 第4步：产品介绍
function gen_stock_s4_chat(profile, info, style, scene, focusText) {
  const addr = scene.address;
  const selling = info.productSelling[profile.risk];
  return `${addr}好呀~\n\n上次跟${addr}聊到股票投资的话题，我回去整理了一下，有一个投资思路挺适合${addr}的，跟${addr}详细说说：\n\n📌 投资方向：${selling}\n\n1️⃣ 【投资逻辑】\n　　${profile.risk === 'conservative' ? '高股息蓝筹股，就是那些业绩稳定、分红率高的行业龙头公司。它们的特点是：第一，业绩稳定，受经济周期影响小；第二，分红慷慨，每年股息率4%-6%，比存款高很多；第三，波动小，熊市里特别抗跌。进可攻退可守，非常适合稳健型投资者。' : profile.risk === 'balanced' ? '核心资产组合，就是各行业的龙头公司。这些公司有品牌、有技术、有护城河，ROE常年在15%以上。长期持有这些公司，就是分享中国最优质企业的成长红利。虽然短期会有波动，但拉长时间看，收益非常可观。' : '优质成长赛道，就是那些行业景气度高、发展空间大的方向，比如AI、新能源、半导体等。这些行业处于高速增长期，里面的龙头公司业绩增速很快，股价也会有很好的表现。虽然波动大一些，但长期收益空间也大。'}\n\n2️⃣ 【适合人群】\n　　像${addr}这样${scene.painPoint}的情况，拿一部分资产配置权益类产品，作为${scene.moneyDesc}的"增长极"，是非常有必要的。\n\n3️⃣ 【参与方式】\n　　${addr}可以自己开户买股票，也可以通过基金或者投顾服务参与。我个人建议，如果${addr}平时工作忙、没有时间研究个股，可以通过投顾服务或者基金来参与，专业的事交给专业的人。\n\n我把详细的投资策略和标的发给${addr}看看？${addr}有任何疑问随时问我~\n\n祝好！`;
}

function gen_stock_s4_phone(profile, info, style, scene, focusText) {
  const addr = scene.address;
  const selling = info.productSelling[profile.risk];
  return `【开场】\n客户经理：${addr}好！我是XX的小X。打扰${addr}几分钟，现在方便说话吗？\n\n【引入话题】\n客户经理：${addr}还记得上次我们聊到股票投资的事嘛？我回去仔细想了想${addr}的情况，觉得有一个投资方向挺适合${addr}的，想跟${addr}详细聊聊，看看对${addr}有没有参考价值。大概5分钟时间，可以吗？\n\n【核心内容一：为什么推荐这个方向】\n客户经理：是这样的，${addr}的情况是${scene.painPoint}，所以我觉得${style.keyword}的思路比较适合${addr}。我推荐的这个方向，最大的特点就是${selling}，跟${addr}的风险偏好和投资需求都比较匹配。\n\n【核心内容二：具体好在哪】\n客户经理：具体来说，我觉得有三个亮点。第一，${profile.risk === 'conservative' ? '股息率高，每年分红就有4%-6%，比存款高很多，而且业绩稳定' : profile.risk === 'balanced' ? '都是各行业的龙头公司，基本面扎实，长期业绩增长确定性高' : '行业景气度高，成长空间大，长期收益潜力大'}；第二，估值合理，现在这个位置入场，性价比不错；第三，长期逻辑清晰，不是短期炒作，是可以拿得住的方向。\n\n【核心内容三：风险也要说清楚】\n客户经理：当然了，我也得跟${addr}说清楚风险。股票投资嘛，波动肯定是有的，${style.intensity}。${profile.risk === 'conservative' ? '虽然波动相对小，但也不是完全没风险，遇到熊市也会跌' : profile.risk === 'balanced' ? '市场不好的时候可能会有15%-25%的回撤，需要有一定的心理承受能力' : '波动比较大，短期可能有30%以上的回撤，需要有较强的风险承受能力和长期持有的耐心'}。这一点${addr}也要有心理准备。\n\n【互动确认】\n客户经理：${addr}觉得呢？这个方向是${addr}感兴趣的吗？还有什么想了解的？\n\n【行动建议】\n客户经理：我给${addr}两个建议啊。第一，${addr}可以先拿一小部分资金试试，比如总资产的10%，感受一下波动；第二，我把详细的投资策略和标的清单发给${addr}，${addr}有空的时候先研究研究，不明白的随时问我。\n\n【收尾】\n客户经理：行，那今天就先跟${addr}聊这些。我稍后把资料发${addr}，${addr}先看看，有什么想法随时联系我。\n好的${addr}，那${addr}先忙，再见！`;
}

// 第5步：活动推荐
function gen_stock_s5_moments(profile, info, style, scene, focusText) {
  const activity = info.activities[0];
  return `【好消息分享】🎉\n\n${activity}活动正式开始了！\n\n跟大家说说这个活动的几个亮点：\n\n1️⃣ ${activity}，超值福利\n${profile.risk === 'conservative' ? '新开户就送Level-2行情，能看十档买卖盘，比普通行情快3秒。炒股的朋友都知道，Level-2有多重要。现在开户就免费送。' : profile.risk === 'balanced' ? '投顾服务免费体验一个月，有专业团队帮你选股和调仓，每天有操作建议。平时一个月好几百的服务费，现在免费体验。' : '新股申购策略分享会，资深投顾教你怎么打新、怎么选新股、怎么提高中签率。干货满满，完全免费。'}\n\n2️⃣ 限时福利，先到先得\n好的活动都是有期限的，错过就不知道什么时候再有了。最近在关注股市的朋友，可以趁这个机会行动起来。\n\n3️⃣ 我可以全程指导\n开户、入金、使用，我一步一步教你，保证学会。\n\n✨ 温馨提示：\n股市有风险，投资需谨慎。一定要用闲钱投资，不要影响日常生活。\n\n感兴趣的朋友可以私信我了解详情~\n\n#股票开户 #投顾服务 #限时福利\n—— 您身边的投资顾问`;
}

function gen_stock_s5_chat(profile, info, style, scene, focusText) {
  const addr = scene.address;
  const activity = info.activities[0];
  return `${addr}好呀~\n\n有个好消息第一时间想到告诉${addr}！\n\n我们最近有个${activity}的活动，我觉得${addr}正好可以赶上，跟${addr}说说：\n\n🎁 活动内容：\n1️⃣ ${activity}\n　　${profile.risk === 'conservative' ? '新开户就送Level-2行情，价值好几百的。能看十档买卖盘、逐笔成交，比普通行情信息量大很多，对交易很有帮助。现在开户免费送，非常划算。' : profile.risk === 'balanced' ? '投顾服务免费体验一个月，有专业的投顾团队帮你选股和调仓，每天有操作建议和市场点评。平时收费不便宜的，现在免费体验，可以感受一下专业服务的价值。' : '新股申购策略分享会，资深投顾给大家讲怎么打新股、怎么选新股、怎么提高中签率。还有交流问答环节，有什么问题都可以现场问。完全免费的。'}\n\n2️⃣ 活动时间\n　　截止到本月底，还有不到两周时间，名额有限先到先得。\n\n3️⃣ ${addr}参与的话\n　　我可以全程协助${addr}办理，从开户到使用，${addr}有任何问题随时找我。\n\n${addr}要不要了解一下？我帮${addr}预约？\n\n祝好！`;
}

// 第6步：转化跟进
function gen_stock_s6_chat(profile, info, style, scene, focusText) {
  const addr = scene.address;
  return `${addr}好呀~\n\n上次跟${addr}聊的投资方向，${addr}考虑得怎么样了？\n\n正好这两天市场${profile.risk === 'conservative' ? '有调整，高股息蓝筹股的性价比更高了' : profile.risk === 'balanced' ? '回调了一些，核心资产估值更合理了' : '科技成长板块有调整，正是布局的好机会'}，想跟${addr}聊聊我的看法：\n\n1️⃣ 关于时机\n　　${profile.risk === 'conservative' ? '高股息策略其实不用太择时，因为主要赚的是分红的钱，还有业绩稳健增长的钱。越早买越早享受分红，长期持有收益很稳定。' : profile.risk === 'balanced' ? '核心资产的话，现在估值已经回到合理区间了，中长期来看是不错的布局时点。可以分批建仓，不用等"最低点"，因为最低点是事后才知道的。' : '成长赛道短期有波动很正常，产业趋势没有变。每次回调都是布局机会，可以用定投的方式分批买入，平滑成本。'}\n\n2️⃣ 关于仓位\n　　我建议${addr}一开始不要投太多，拿总资产的10%-20%来配置就可以了。先感受一下市场的波动，建立自己的投资体系，以后再慢慢加。\n\n3️⃣ 关于服务\n　　${addr}不用担心不知道怎么操作。我会全程跟踪，有重要的市场变化或者调仓建议，我会及时告诉${addr}。\n\n${addr}看是先小仓位试试水，还是再多了解了解？有任何疑问随时问我~\n\n祝好！`;
}

function gen_stock_s6_phone(profile, info, style, scene, focusText) {
  const addr = scene.address;
  return `【开场】\n客户经理：${addr}好！我是XX的小X。打扰${addr}了，现在方便说两句吗？\n\n【引入】\n客户经理：${addr}还记得上次跟${addr}聊的股票投资的事吗？正好这两天市场有一些调整，我觉得反而是好事，想跟${addr}聊聊我的看法，看看${addr}考虑得怎么样了。\n\n【核心内容一：当前市场情况】\n客户经理：跟${addr}说下最新的情况啊。这两天市场${profile.risk === 'conservative' ? '有一些调整，但高股息蓝筹股表现很抗跌，说明资金在往稳健的方向走。现在这个股息率水平，已经很有吸引力了' : profile.risk === 'balanced' ? '回调了一些，核心资产的估值更合理了。政策底已经很明确，市场底可能还有反复，但中长期来看，现在这个位置布局，胜率很高' : '成长板块有一些回调，主要是短期情绪面的影响，行业的基本面和长期逻辑没有变。调整之后，估值更合理了，反而是布局的好机会'}。\n\n【核心内容二：我的建议】\n客户经理：所以我的建议是，${addr}如果看好这个方向，可以先建一部分底仓。不用一下投太多，先拿10%左右的资金试试水，后续根据市场情况再慢慢加。这样既不错过机会，风险也可控。\n\n【核心内容三：降低行动门槛】\n客户经理：${addr}不用担心不知道怎么选股、什么时候买卖。如果${addr}自己没时间研究，可以用我们的投顾服务，有专业团队帮你选股和调仓，你跟着操作就行。我也会持续给${addr}提供市场观点和投资建议。\n\n【互动确认】\n客户经理：${addr}觉得呢？现在是打算先试试，还是还有什么顾虑？\n\n【行动建议】\n客户经理：要不这样吧${addr}，${addr}先开个户，入个几万块钱试试水。先感受一下市场的波动，学习学习，觉得合适了再加仓。${addr}看怎么样？\n\n【收尾】\n客户经理：行，那${addr}要是决定了随时找我，我帮${addr}办理开户。或者${addr}还有什么想了解的，随时给我打电话。\n好的${addr}，那不打扰${addr}了，再见！`;
}

// 第7步：异议处理
function gen_stock_s7_phone(profile, info, style, scene, focusText) {
  const addr = scene.address;
  const objections = info.objections;
  return `【开场】\n客户经理：${addr}好！我是小X。${addr}现在方便吗？\n\n【引入】\n客户经理：上次跟${addr}聊了股票投资的事，我回去想了想，${addr}可能还有一些顾虑没好意思说。今天特意给${addr}打个电话，想跟${addr}好好聊聊，有什么疑问都可以说，我帮${addr}分析分析。\n\n【异议一：股市风险太大了，我怕亏钱】\n客户经理：${addr}的担心很正常，股市确实有风险，很多人都是这么想的。\n　　但${addr}知道吗？长期来看，股票资产的收益是所有大类资产里最高的。关键是要控制仓位、选对股票、做好分散。${addr}可以先拿一小部分钱试试，比如总资产的10%，就算亏了也不影响生活，赚了就是超额收益。而且如果${addr}选${profile.risk === 'conservative' ? '高股息蓝筹股，波动小、分红稳，风险其实没那么大' : profile.risk === 'balanced' ? '核心资产长期持有，亏钱的概率很低' : '专业的投顾服务，比自己炒股风险小很多'}。\n\n【异议二：被套过，再也不敢碰了】\n客户经理：我特别理解${addr}的感受，被套的滋味确实不好受。\n　　但${addr}有没有想过为什么会被套？大概率是追高买入、没有止损、或者选的股票基本面有问题。其实投资是有方法的，只要建立正确的投资体系，控制好风险，亏钱的概率会小很多。我可以帮${addr}分析一下之前的问题出在哪里，以后避开这些坑。\n\n【异议三：选股太难了，没时间看盘】\n客户经理：${addr}说得对，选股确实需要专业知识和时间精力，这也是很多散户亏钱的原因。\n　　但现在有很多方式可以解决这个问题啊。比如买指数基金，不用选股，跟大盘就行；或者用我们的投顾服务，有专业团队帮你选股和调仓，你只要跟着操作就行，不用自己花时间研究。专业的事交给专业的人，效率更高。\n\n【互动确认】\n客户经理：${addr}还有其他什么顾虑吗？都可以跟我说。\n\n【行动建议】\n客户经理：我觉得${addr}可以先拿一点点钱试试，不用多，感受一下。真金白银投进去了，学习的速度才最快。如果觉得适合自己，再慢慢加；如果觉得不适合，损失也很小。${addr}觉得呢？\n\n【收尾】\n客户经理：行，那${addr}再想想，有任何问题随时找我。${addr}的顾虑我都理解，投资嘛，谨慎点是对的。我这边也会帮${addr}关注着，有好的机会及时告诉${addr}。\n好的${addr}，那${addr}先忙，再见！`;
}

function gen_stock_s7_chat(profile, info, style, scene, focusText) {
  const addr = scene.address;
  const objections = info.objections;
  return `${addr}好~\n\n上次跟${addr}聊完股票投资的事，我回去想了想，${addr}可能心里还有一些疑问没好意思问。今天整理了几个大家最常问的问题，跟${addr}分享一下：\n\n❓ 问题1：${objections[0].q}\n💡 ${objections[0].a}\n\n❓ 问题2：${objections[1].q}\n💡 ${objections[1].a}\n\n❓ 问题3：${objections[2].q}\n💡 ${objections[2].a}\n\n其实我特别理解${addr}的顾虑，投资有风险，谨慎点总是好的。我这边能做的，就是把真实情况告诉${addr}，好的坏的都说到，让${addr}自己做判断。\n\n${addr}还有什么其他疑问吗？随时问我，我一定如实解答~\n\n祝好！`;
}

// 第8步：成交转介
function gen_stock_s8_chat(profile, info, style, scene, focusText) {
  const addr = scene.address;
  const referral = info.referral[profile.age];
  return `${addr}好呀~\n\n${addr}的账户已经开好了吧？入金了吗？操作上有没有遇到什么问题？\n\n跟${addr}说一下后续的服务安排：\n\n1️⃣ 市场观点分享\n　　我会定期给${addr}发市场观点和投资策略，有重要的行情变化或者政策动向，我会及时告诉${addr}。\n\n2️⃣ 持仓跟踪服务\n　　${addr}买了什么股票或者基金，可以告诉我，我帮${addr}跟踪分析，有重要变化及时提醒${addr}。\n\n3️⃣ 投顾产品推荐\n　　如果${addr}觉得自己选股太费时间，我可以给${addr}推荐我们的投顾产品，有专业团队帮${addr}选股和调仓，省${addr}很多精力。\n\n另外啊，${referral.replace(/[「」]/g, '')}\n\n${addr}有任何问题随时联系我，祝您投资顺利！`;
}

function gen_stock_s8_moments(profile, info, style, scene, focusText) {
  return `【客户感悟】💡\n\n今天跟一位老客户聊天，他说跟着我做投资三年了，虽然中间也有过波动，但总体收益很满意，比自己瞎买强多了。\n\n听到这话，特别有成就感。\n\n分享几点感悟：\n\n1️⃣ 投资是认知的变现\n你永远赚不到超出你认知范围的钱。持续学习、提升认知，才是投资的正道。\n\n2️⃣ 专业创造价值\n选股、择时、风控、仓位管理，每一个环节都需要专业能力。能帮客户少走弯路、少踩坑，就是我的价值所在。\n\n3️⃣ 长期主义是王道\n股市短期是投票机，长期是称重机。选对好公司、拿得住，时间会给你最好的回报。\n\n感谢每一位信任我的客户。投资路上，我会一直陪着你们~\n\n如果你的朋友也在做股票投资，欢迎推荐给我，我们一起交流、一起成长。\n\n#投资 #股票 #客户见证\n—— 您身边的投资顾问`;
}

// ============================================
// 产品6：信托私募 (trust) - 8步×4渠道完整文案
// ============================================

// 第1步：热点促达
function gen_trust_s1_moments(profile, info, style, scene, focusText) {
  const topic = info.hotTopics[profile.risk];
  return `【财富观察】🏛️\n\n${topic}\n\n分享三个观点：\n\n1️⃣ 资产荒时代，高净值客户的焦虑\n${profile.risk === 'conservative' ? '优质信托产品越来越少，好的政信类项目都是靠抢的。低风险、稳收益的资产，越来越稀缺了。' : profile.risk === 'balanced' ? '普通理财产品收益越来越低，满足不了高净值客户的需求。资产配置需要多元化，不能只靠传统理财。' : '一级市场、股权私募，这些另类投资正在成为高净值客户的标配。能投别人投不了的项目，才能获得超额收益。'}\n\n2️⃣ ${style.keyword}，是高净值客户的核心需求\n资产规模越大，越看重稳健和确定性。保住财富、传承财富，比快速增值更重要。\n\n3️⃣ 专业的事交给专业的人\n高净值客户最宝贵的是时间。把资产配置交给专业的财富顾问，自己专注于事业和生活，才是最优解。\n\n财富管理的终极目标，不是赚最多的钱，而是过上想要的生活。\n\n大家怎么看？欢迎评论区交流~\n\n#信托 #私募 #高净值 #资产配置\n—— 您身边的财富顾问`;
}

function gen_trust_s1_group(profile, info, style, scene, focusText) {
  const topic = info.hotTopics[profile.risk];
  return `【高端分享 · 财富话题】🎯\n\n各位群友好！今天聊聊高净值客户都在关心的话题~\n\n📰 今日热点：\n${topic}\n\n💡 分享三个财富认知：\n① 资产规模越大，越看重稳健\n　资金量小的时候，追求高收益是对的；但资产到了一定规模，保住本金、稳健增值就更重要了。因为基数大了，每年稳定增值几个点，绝对值就很可观了。\n\n② 资产配置要多元化\n　不要把鸡蛋放在一个篮子里。存款、理财、基金、信托、私募、保险，不同类型的资产搭配，才能分散风险、穿越周期。\n\n③ ${style.keyword}，高净值客户的必修课\n　信托、私募这些高端产品，不仅是投资工具，还有资产隔离、财富传承等功能，是高净值家庭的标配。\n\n💬 今日话题讨论：\n"你的资产配置里，另类投资占比多少？"\nA. 0%，还没接触过\nB. 10%以内\nC. 10%-30%\nD. 30%以上\n\n欢迎交流～ 有任何财富管理相关的问题，随时@我！\n\n—————————\n风险提示：以上观点仅供参考，不构成投资建议。投资有风险，入市需谨慎。`;
}

// 第2步：投教培育
function gen_trust_s2_moments(profile, info, style, scene, focusText) {
  const edTopic = info.edTopics[profile.risk];
  return `【财富小课堂】📖\n\n今天聊聊：${edTopic}\n\n🎯 核心知识点：\n\n1️⃣ ${profile.risk === 'conservative' ? '信托产品怎么选？看这3个关键指标' : profile.risk === 'balanced' ? '高净值家庭的资产配置：为什么要有信托？' : '私募股权：高净值客户的另类投资选择'}\n${profile.risk === 'conservative' ? '选信托产品，看三点：一看融资方资质，国企央企背景的最稳；二看风控措施，有没有抵押、质押、担保，抵押物值不值钱；三看信托公司实力，头部信托公司风控更严、兜底能力更强。这三点都过硬的产品，安全性是有保障的。' : profile.risk === 'balanced' ? '为什么高净值家庭都配信托？因为信托有三大功能：第一，风险隔离，信托财产独立于委托人、受托人和受益人，不受债务纠纷影响；第二，财富传承，可以指定受益人、分配方式，避免继承纠纷；第三，稳健增值，优质信托收益稳定，比普通理财高。' : '私募股权是什么？就是投资未上市的优质企业，等企业上市后退出，获得高额回报。它的优势是：第一，投资一级市场，享受企业成长红利；第二，和二级市场相关性低，分散组合风险；第三，长期收益空间大，好项目有3-5倍甚至更高的回报。当然，门槛高、期限长、流动性差，也是它的特点。'}\n\n2️⃣ 高净值客户的财富管理，不只是投资\n还有税务筹划、资产隔离、财富传承、家族治理...这些才是财富管理的深层价值。\n\n3️⃣ ${style.keyword}，是财富管理的第一原则\n\n✨ 今日感悟：\n财富管理的终极目标，不是数字的增长，而是家庭的幸福和传承。\n\n觉得有用的话点个赞，有问题评论区见~\n\n#财富管理 #${profile.risk === 'conservative' ? '信托理财' : profile.risk === 'balanced' ? '资产配置' : '私募股权'} #高净值\n—— 您身边的财富顾问`;
}

function gen_trust_s2_chat(profile, info, style, scene, focusText) {
  const addr = scene.address;
  const edTopic = info.edTopics[profile.risk];
  return `${addr}好呀~\n\n昨天发了一条关于${edTopic.replace(/[「」]/g, '')}的朋友圈，想到${addr}可能也会感兴趣，整理了几个要点跟${addr}分享：\n\n1️⃣ 为什么这个话题值得关注\n　　${profile.risk === 'conservative' ? '现在市场上信托产品鱼龙混杂，选不好容易踩坑。了解怎么选信托产品，才能避开雷区，买到真正稳健的产品。' : profile.risk === 'balanced' ? '资产到了一定规模，配置思路就要变了。不能只看收益，还要考虑风险分散、资产隔离、财富传承这些问题。信托在这些方面有不可替代的作用。' : '普通的理财产品和股票基金，很多高净值客户已经配置了。想要进一步分散风险、提高收益，私募股权这些另类投资是值得考虑的方向。了解它的特点和风险，才能做出正确的选择。'}\n\n2️⃣ 实操中的几个关键点\n　　第一，选机构比选产品更重要；第二，要看底层资产是什么，不能只看收益；第三，期限和流动性要匹配自己的资金安排。\n\n3️⃣ 给${addr}的小建议\n　　如果${addr}对这些高端产品感兴趣，我可以给${addr}做一个全面的资产配置诊断，看看${addr}现在的配置是否合理，哪些地方可以优化。\n\n${addr}要是有什么疑问，随时找我聊~\n\n祝${addr}今天一切顺利！`;
}

// 第3步：场景种草
function gen_trust_s3_moments(profile, info, style, scene, focusText) {
  const scenes = scene.scenes;
  return `【财富与人生】🏆\n\n最近跟一位客户聊天，他说打拼了半辈子，${scenes[0]}和${scenes[1]}都安排好了，现在最关心的是怎么把财富稳稳地传下去。\n\n我特别有感触。\n\n分享三个观点：\n\n1️⃣ 赚钱是能力，守钱是智慧\n打江山容易守江山难。创造财富靠的是能力和机遇，守住财富靠的是智慧和规划。\n\n2️⃣ 资产规模不同，配置逻辑完全不同\n几万几十万的时候，追求高收益没问题；几百万上千万的时候，${style.keyword}就更重要了。保住财富、传承财富，比快速增值更有意义。\n\n3️⃣ 信托和私募，是高净值客户的标配\n不只是因为收益高，更因为它们有资产隔离、财富传承、分散配置等功能，是普通理财产品替代不了的。\n\n✨ 很认同一句话：\n"财富管理的终极目标，是让钱为人服务，而不是人为钱奔波。"\n\n共勉~\n\n#财富传承 #资产配置 #高净值人群\n—— 您身边的财富顾问`;
}

function gen_trust_s3_chat(profile, info, style, scene, focusText) {
  const addr = scene.address;
  const pitch = info.scenePitches[profile.age];
  return `${addr}好~\n\n昨天参加了一个高端客户私享会，感触挺深的，想到${addr}也正好在做资产配置，跟${addr}聊聊：\n\n1️⃣ 高净值客户现在都在关心什么？\n　　${profile.risk === 'conservative' ? '大家最关心的是安全。现在经济环境复杂，优质资产越来越少，能找到稳健增值的渠道不容易。政信类信托因为有政府信用背书，很受青睐。' : profile.risk === 'balanced' ? '大家都在做多元化配置。存款、理财、基金、信托、保险，各种资产搭配，分散风险。单一资产的时代已经过去了，资产配置才是王道。' : '大家都在布局一级市场。二级市场波动大、收益不确定，而优质的未上市企业，成长空间更大。股权私募虽然期限长，但长期回报很可观。'}\n\n2️⃣ ${pitch.replace(/[「」]/g, '')}\n\n3️⃣ 高端理财没那么神秘\n　　很多人觉得信托私募离自己很远，其实不然。只要资产规模到了一定程度，这些都是常规的配置工具。\n\n${addr}平时资产都是怎么配置的呀？有空可以聊聊~${addr}要是感兴趣，我可以帮${addr}预约我们的高端客户私享会，跟其他高净值客户交流交流。\n\n祝好！`;
}

// 第4步：产品介绍
function gen_trust_s4_chat(profile, info, style, scene, focusText) {
  const addr = scene.address;
  const selling = info.productSelling[profile.risk];
  return `${addr}好呀~\n\n上次跟${addr}聊到高端理财的话题，我回去仔细想了想${addr}的情况，觉得有一款产品挺适合${addr}的，跟${addr}详细说说：\n\n📌 产品亮点：\n\n1️⃣ 【产品定位】${selling}\n　　${profile.risk === 'conservative' ? '这是一款政信类信托产品，融资方是当地的政府平台公司，有政府信用背书。风控措施也很完善，有应收账款质押、连带担保等。年化收益6%-8%，期限1-2年，适合稳健型的高净值客户。' : profile.risk === 'balanced' ? '这是一款组合类信托/量化私募产品，采用多元策略，分散投资于不同的资产和策略，收益回撤比优秀。长期年化8%-12%，最大回撤控制得很好，适合想获得稳健超额收益的高净值客户。' : '这是一款股权类私募/产业基金，投资于优质的未上市企业，行业方向是AI、新能源等高景气赛道。管理团队经验丰富，过往业绩优秀。上市后预期有3-5倍的收益空间，适合风险承受能力强、追求高收益的高净值客户。'}\n\n2️⃣ 【适合人群】\n　　像${addr}这样${scene.painPoint}的情况，资产规模已经到了一定程度，配置一些高端产品，无论是分散风险还是提升收益，都是很有必要的。\n\n3️⃣ 【配置建议】\n　　建议${addr}可以先拿出总资产的10%-20%来配置这类产品，不用一下投入太多。高端产品期限一般比较长，要确保用闲钱投资。\n\n我把产品的详细资料（含尽调报告）发给${addr}看看？${addr}有任何疑问随时问我~\n\n祝好！`;
}

function gen_trust_s4_phone(profile, info, style, scene, focusText) {
  const addr = scene.address;
  const selling = info.productSelling[profile.risk];
  return `【开场】\n客户经理：${addr}好！我是XX的小X。打扰${addr}几分钟，现在方便说话吗？\n\n【引入话题】\n客户经理：${addr}还记得上次我们聊到高端理财的事嘛？我回去仔细想了想${addr}的资产情况，觉得有一款产品挺适合${addr}的，想跟${addr}详细介绍一下，看看对${addr}有没有参考价值。大概5分钟时间，可以吗？\n\n【核心内容一：为什么推荐这款】\n客户经理：是这样的，${addr}的资产体量不小，${profile.risk === 'conservative' ? '需要更多稳健增值的渠道来分散配置' : profile.risk === 'balanced' ? '普通理财的收益已经满足不了需求了，需要多元化配置' : '可以考虑布局一些另类投资，提高组合的长期收益'}。这款产品最大的特点就是${selling}，跟${addr}的需求正好匹配。\n\n【核心内容二：产品具体好在哪】\n客户经理：具体来说，我觉得有三个亮点。第一，${profile.risk === 'conservative' ? '底层资产优质，政信类有政府信用背书，风控措施完善' : profile.risk === 'balanced' ? '策略多元、分散投资，收益回撤比优秀，长期业绩稳定' : '管理团队专业，过往业绩优秀，投资方向是高景气赛道'}；第二，发行机构靠谱，都是头部信托/私募，管理经验丰富；第三，额度稀缺，好产品都是靠抢的，这次能拿到额度不容易。\n\n【核心内容三：风险也要说清楚】\n客户经理：当然了，我也得跟${addr}说清楚风险。这款产品是${style.intensity}的，${profile.risk === 'conservative' ? '虽然风控很完善，但也不是完全没风险，政策风险、流动性风险这些还是有的' : profile.risk === 'balanced' ? '有一定的波动和回撤风险，但相对可控' : '风险比较高，期限长、流动性差，而且可能亏损本金，需要有较强的风险承受能力'}。高端产品门槛高，也需要${addr}做合格投资者认证。这一点${addr}也要有心理准备。\n\n【互动确认】\n客户经理：${addr}觉得呢？这个产品的方向是${addr}感兴趣的吗？还有什么想了解的？\n\n【行动建议】\n客户经理：我给${addr}两个建议啊。第一，我先把产品的详细资料和尽调报告发给${addr}，${addr}拿回去慢慢研究，不用急着决定；第二，${addr}有时间的话，我们约个时间当面聊，我把产品的每一个细节都给${addr}讲清楚。\n\n【收尾】\n客户经理：行，那今天就先跟${addr}聊这些。我稍后把资料发${addr}，${addr}先看看，有什么想法随时联系我。\n好的${addr}，那${addr}先忙，再见！`;
}

// 第5步：活动推荐
function gen_trust_s5_moments(profile, info, style, scene, focusText) {
  const activity = info.activities[0];
  return `【高端活动邀请】🎩\n\n${activity}活动开始预约了！\n\n跟大家说说这个活动的几个亮点：\n\n1️⃣ ${activity}，专属圈层\n${profile.risk === 'conservative' ? '邀请业内专家分享宏观经济形势和信托市场展望，还有优质信托项目的优先认购权。仅限高净值客户参加，私密性强。' : profile.risk === 'balanced' ? '资深资产配置专家一对一为您量身定制资产配置方案，从全局视角审视您的资产组合，发现优化空间。平时收费很高的，现在免费。' : '家族信托法律专家免费咨询，解答资产隔离、财富传承、税务筹划等问题。很多高净值客户都很关心这些。'}\n\n2️⃣ 名额有限，仅限邀请\n高端活动不是谁都能参加的，名额有限，先到先得。感兴趣的朋友尽快联系我预约。\n\n3️⃣ 私享圈层，人脉交汇\n参加的都是高净值客户，可以认识很多同圈层的朋友，交流信息、拓展人脉。\n\n✨ 温馨提示：\n高端投资有门槛，需符合合格投资者要求。投资有风险，决策需谨慎。\n\n感兴趣的朋友可以私信我预约席位~\n\n#高端活动 #私享会 #财富管理\n—— 您身边的财富顾问`;
}

function gen_trust_s5_chat(profile, info, style, scene, focusText) {
  const addr = scene.address;
  const activity = info.activities[0];
  return `${addr}好呀~\n\n有个好消息第一时间想到告诉${addr}！\n\n我们最近有个${activity}的活动，我觉得${addr}正好适合参加，跟${addr}说说：\n\n🎁 活动内容：\n1️⃣ ${activity}\n　　${profile.risk === 'conservative' ? '高端客户私享会，邀请业内专家分享宏观经济和信托市场展望，还有优质信托项目的首发和优先认购权。参加的都是高净值客户，圈层很纯粹。' : profile.risk === 'balanced' ? '一对一资产配置方案定制，资深专家帮${addr}做全面的资产诊断，看看现在的配置是否合理，哪些地方可以优化。平时这项服务收费不低，现在免费给VIP客户做。' : '家族信托免费咨询，邀请专业律师和税务专家，解答资产隔离、财富传承、税务筹划等问题。这些都是高净值家庭非常关心的话题。'}\n\n2️⃣ 活动时间\n　　本月下旬，具体时间另行通知。名额非常有限，我手里只有几个名额，第一个想到${addr}。\n\n3️⃣ ${addr}参加的话\n　　我帮${addr}安排最好的专家，全程陪同，有任何问题随时沟通。\n\n${addr}要不要参加？我帮${addr}预留名额？\n\n祝好！`;
}

// 第6步：转化跟进
function gen_trust_s6_chat(profile, info, style, scene, focusText) {
  const addr = scene.address;
  return `${addr}好呀~\n\n上次跟${addr}聊的那款高端产品，${addr}考虑得怎么样了？\n\n正好这两天项目额度快满了，想跟${addr}聊聊我的看法：\n\n1️⃣ 关于时机\n　　${profile.risk === 'conservative' ? '优质政信项目一直都是稀缺资源，好项目一出来很快就被抢光了。现在这个项目各方面条件都不错，额度也不多了，有意向的话要抓紧。' : profile.risk === 'balanced' ? '现在市场环境比较复杂，正是布局多策略产品的好时机。不同策略在不同市场环境下表现不同，组合起来能平滑波动、提高收益。' : '一级市场的好项目额度非常紧张，好的标的大家都在抢。能拿到份额本身就不容易，看好的话要早点锁定。'}\n\n2️⃣ 关于金额\n　　我建议${addr}可以先从100万起投，先配置一部分试试水。高端产品虽然门槛高，但也不用一下投很多，先感受一下产品的运作和收益，合适了再加也不迟。\n\n3️⃣ 关于服务\n　　${addr}不用担心投完就没人管了。我会全程跟踪产品的运作情况，定期给${addr}汇报进度。有任何问题，${addr}随时找我。\n\n${addr}看是先配置一部分，还是再考虑考虑？有任何疑问随时问我~\n\n祝好！`;
}

function gen_trust_s6_phone(profile, info, style, scene, focusText) {
  const addr = scene.address;
  return `【开场】\n客户经理：${addr}好！我是XX的小X。打扰${addr}了，现在方便说两句吗？\n\n【引入】\n客户经理：${addr}还记得上次跟${addr}聊的那款高端产品吗？正好这两天项目额度快满了，我想着赶紧跟${addr}通个气，看看${addr}考虑得怎么样了。\n\n【核心内容一：项目最新进展】\n客户经理：跟${addr}说下最新的情况啊。这个项目目前认购很踊跃，额度已经用了大半了，估计这周内就会满额。好的信托/私募产品都是这样，额度很紧张，看中了就要尽快决定，犹豫一下可能就没了。\n\n【核心内容二：我的建议】\n客户经理：所以我的建议是，${addr}如果看好这个方向，可以先锁定额度。先投100万试试，不用一下投太多。好项目不常有，错过了下一个不知道要等多久。\n\n【核心内容三：降低决策压力】\n客户经理：${addr}不用担心投完就后悔，高端产品一般都有冷静期，冷静期内可以撤单。而且我会全程跟踪产品运作，定期给${addr}汇报。${addr}有任何问题随时找我。\n\n【互动确认】\n客户经理：${addr}觉得呢？现在是打算先配置一部分，还是还有什么顾虑？\n\n【行动建议】\n客户经理：要不这样吧${addr}，${addr}先把名额占上，我帮${addr}预留100万的额度，${addr}再慢慢考虑。要是最后决定不投，也没关系，名额让出来就行。${addr}看怎么样？\n\n【收尾】\n客户经理：行，那我先帮${addr}把名额留着。${addr}有什么疑问随时给我打电话，我24小时开机。\n好的${addr}，那不打扰${addr}了，再见！`;
}

// 第7步：异议处理
function gen_trust_s7_phone(profile, info, style, scene, focusText) {
  const addr = scene.address;
  const objections = info.objections;
  return `【开场】\n客户经理：${addr}好！我是小X。${addr}现在方便吗？\n\n【引入】\n客户经理：上次跟${addr}聊了高端产品的事，我回去想了想，${addr}可能还有一些顾虑没好意思说。今天特意给${addr}打个电话，想跟${addr}好好聊聊，有什么疑问都可以说，我帮${addr}分析分析。\n\n【异议一：门槛太高了，100万起投】\n客户经理：${addr}说得对，信托和私募的门槛确实比较高，100万起投，这也是监管的要求。\n　　但反过来说，正是因为有门槛，这些产品的投资范围更广、策略更灵活，收益也比普通产品高。如果${addr}暂时达不到门槛，可以先从我们的高端理财系列开始，几十万起投，等资产规模上来了再配置信托。我可以帮${addr}做一个循序渐进的配置规划。\n\n【异议二：流动性太差，钱锁好几年】\n客户经理：${addr}说得没错，信托和私募的期限确实比较长。\n　　但高收益往往需要时间来兑现，好的投资项目需要培育期。而且${addr}可以做期限搭配啊，一部分投短期的、一部分投长期的，既满足流动性需求，又能享受长期高收益。我帮${addr}做一个整体的现金流规划怎么样？\n\n【异议三：看不懂、不透明，不知道钱投到哪里了】\n客户经理：${addr}的顾虑我特别理解，高端产品确实比普通理财复杂一些。\n　　但信息披露也是有监管要求的，我们会给${addr}详细的产品说明书，投什么、怎么投、风控措施是什么，都会讲清楚。而且我会全程跟进，有任何变动第一时间告诉${addr}，${addr}随时可以问我。我就是${addr}和产品之间的桥梁，${addr}不用自己研究那么多，有我呢。\n\n【互动确认】\n客户经理：${addr}还有其他什么顾虑吗？都可以跟我说。\n\n【行动建议】\n客户经理：我觉得${addr}可以先从小额的高端理财开始试水，等熟悉了、信任了，再慢慢配置信托私募。一步一步来，不用急。${addr}觉得呢？\n\n【收尾】\n客户经理：行，那${addr}再想想，有任何问题随时找我。${addr}的顾虑我都理解，高端投资嘛，谨慎点是对的。我这边也会帮${addr}关注着，有好的项目及时告诉${addr}。\n好的${addr}，那${addr}先忙，再见！`;
}

function gen_trust_s7_chat(profile, info, style, scene, focusText) {
  const addr = scene.address;
  const objections = info.objections;
  return `${addr}好~\n\n上次跟${addr}聊完高端产品的事，我回去想了想，${addr}可能心里还有一些疑问没好意思问。今天整理了几个高净值客户最常问的问题，跟${addr}分享一下：\n\n❓ 问题1：${objections[0].q}\n💡 ${objections[0].a}\n\n❓ 问题2：${objections[1].q}\n💡 ${objections[1].a}\n\n❓ 问题3：${objections[2].q}\n💡 ${objections[2].a}\n\n其实我特别理解${addr}的顾虑，高端投资涉及的金额大，谨慎点总是好的。我这边能做的，就是把真实情况告诉${addr}，好的坏的都说到，让${addr}自己做判断。\n\n${addr}还有什么其他疑问吗？随时问我，我一定如实解答~\n\n祝好！`;
}

// 第8步：成交转介
function gen_trust_s8_chat(profile, info, style, scene, focusText) {
  const addr = scene.address;
  const referral = info.referral[profile.age];
  return `${addr}好呀~\n\n${addr}认购的那款产品已经确认份额了，合同我稍后给${addr}送过去（或者寄过去）。\n\n跟${addr}说一下后续的服务安排：\n\n1️⃣ 定期汇报\n　　我会每季度给${addr}做一次产品运作汇报，包括产品净值、运作情况、市场分析等。${addr}有任何想了解的，随时找我。\n\n2️⃣ 项目跟踪\n　　我会持续跟踪项目的运作情况，有任何重要变动，第一时间告诉${addr}。${addr}不用自己费神盯。\n\n3️⃣ 更多高端服务\n　　除了这款产品，如果${addr}对家族信托、税务筹划、财富传承等方面感兴趣，或者想做全面的家族资产配置规划，都可以找我。我们有专业的团队和丰富的资源。\n\n另外啊，${referral.replace(/[「」]/g, '')}\n\n${addr}有任何问题随时联系我，祝您投资顺利、家业长青！`;
}

function gen_trust_s8_moments(profile, info, style, scene, focusText) {
  return `【客户见证】🏆\n\n今天帮一位老客户完成了家族信托的设立，看到他如释重负的表情，我觉得这份工作特别有意义。\n\n做财富管理这么多年，最深的感悟是：\n\n1️⃣ 财富管理的终极目标是幸福\n不是数字的增长，而是家庭的安稳、事业的延续、财富的传承。\n\n2️⃣ 信任是高端服务的基石\n客户愿意把身家大事交给你，这份信任比什么都重。我能做的，就是用专业和真诚，不辜负这份信任。\n\n3️⃣ 专业创造真正的价值\n资产配置、风险隔离、税务筹划、财富传承...每一个领域都需要深厚的专业积累。能帮客户解决真正的痛点，就是我的价值所在。\n\n感谢每一位信任我的高净值客户。财富路上，我会一直陪着你们~\n\n如果您身边有同样资产规模的朋友也在做财富规划，欢迎推荐给我，我会用心对待每一位客户。\n\n#财富管理 #家族信托 #高净值\n—— 您身边的私人财富顾问`;
}

// ===== 生成8步生命周期内容（按产品类型差异化） =====
function generateLifecycleSteps(profile) {
  const { age, risk, asset, focus, product, desc, hasProductDetail, productDetailText } = profile;

  // 基础步骤模板
  const steps = [
    {
      stepName: '热点促达',
      stepDesc: '用产品相关热点破冰，建立初步连接'
    },
    {
      stepName: '投教培育',
      stepDesc: '输出产品相关理财知识，建立专业形象'
    },
    {
      stepName: '场景种草',
      stepDesc: '结合生活场景，植入产品观念'
    },
    {
      stepName: '产品介绍',
      stepDesc: '匹配需求，深度介绍产品'
    },
    {
      stepName: '活动推荐',
      stepDesc: '用活动/福利推动行动'
    },
    {
      stepName: '转化跟进',
      stepDesc: '跟进意向，推动成交'
    },
    {
      stepName: '异议处理',
      stepDesc: '解答产品疑虑，消除顾虑'
    },
    {
      stepName: '成交转介',
      stepDesc: '成交后维护，引导转介绍'
    }
  ];

  const style = riskStyle[risk];
  const scene = ageScene[age];
  const productInfo = productConfig[product] || productConfig.fund;
  const detailPrefix = hasProductDetail ? '（结合您提供的产品信息优化）' : '';

  // ===== 为每一步生成差异化内容 =====
  return steps.map((step, index) => {
    const stepNum = index + 1;

    let strategy = '';
    let contentExample = [];
    let keyActions = [];

    // 获取当前步骤对应的渠道
    const channels = stepChannelMap[stepNum] || ['moments', 'chat'];

    // ===== 第1步：热点促达 =====
    if (stepNum === 1) {
      strategy = `首次触达的核心是"不推销、先连接"。用${productInfo.name}相关的热点话题作为切入点，自然开启对话，避免一上来就推产品。${style.tone.split('、')[0]}的沟通基调更容易让客户放下戒备。${detailPrefix}`;

      keyActions = [
        `用${productInfo.name}相关热点话题破冰，不提产品`,
        '保持专业但不刻意，像朋友一样自然分享',
        '结尾留一个开放式问题，引导客户回复'
      ];
    }

    // ===== 第2步：投教培育 =====
    else if (stepNum === 2) {
      strategy = `通过持续输出${productInfo.name}相关的理财知识，在客户心中建立"专业靠谱"的形象。内容要贴近客户的认知水平，不要讲太专业的术语，重点是让客户觉得"有收获"。${productInfo.tone}的输出风格更能打动客户。`;

      keyActions = [
        `每周输出1-2条${productInfo.name}相关投教内容，保持存在感`,
        '内容要通俗易读，用案例和数字说话',
        '主动询问客户是否有疑问，强化互动'
      ];
    }

    // ===== 第3步：场景种草 =====
    else if (stepNum === 3) {
      strategy = `从客户的真实生活场景切入，把${productInfo.name}和客户的${scene.scenes[0]}、${scene.scenes[1]}等目标关联起来。让客户意识到"买这个产品是为了更好的生活"，而不是为了投资而投资。`;

      keyActions = [
        '从客户的生活场景切入，引发共鸣',
        '用故事和案例代替生硬的产品推荐',
        '引导客户说出自己的理财目标和顾虑'
      ];
    }

    // ===== 第4步：产品介绍 =====
    else if (stepNum === 4) {
      strategy = `在客户对${productInfo.name}有了认知和需求后，顺势介绍产品。核心原则是"${style.keyword}"，产品介绍要简洁有力，讲清楚"为什么适合你"，而不是"产品有多好"。${detailPrefix}`;

      keyActions = [
        '先复述客户需求，再介绍匹配的产品',
        '产品介绍控制在3个核心卖点以内',
        '如实揭示风险，不夸大收益'
      ];
    }

    // ===== 第5步：活动推荐 =====
    else if (stepNum === 5) {
      strategy = `用${productInfo.name}相关的活动或福利作为催化剂，推动客户从"感兴趣"到"行动"。活动要有时间限制和稀缺感，让客户有"现在行动更划算"的感觉。`;

      keyActions = [
        '活动要有明确的截止时间和稀缺性',
        '突出"专属""限量""限时"等关键词',
        '降低参与门槛，让客户容易迈出第一步'
      ];
    }

    // ===== 第6步：转化跟进 =====
    else if (stepNum === 6) {
      strategy = `客户表达${productInfo.name}购买意向后，及时跟进推动成交。关键是帮客户"拍板"，而不是等客户自己决定。可以用假设成交法、二选一法等技巧，但不要给客户太大压力。`;

      keyActions = [
        '客户有兴趣后24小时内跟进',
        '用二选一或假设成交法推动决策',
        '主动提供操作指导，降低行动门槛'
      ];
    }

    // ===== 第7步：异议处理 =====
    else if (stepNum === 7) {
      strategy = `客户对${productInfo.name}有疑虑是正常的，关键是理解顾虑背后的真实原因，针对性解答。先共情再讲道理，用数据和案例消除顾虑，而不是硬杠。`;

      keyActions = [
        '先肯定客户的顾虑，再针对性解答',
        '用数据、案例、历史表现说话',
        '解答后确认客户是否还有其他疑问'
      ];
    }

    // ===== 第8步：成交转介 =====
    else if (stepNum === 8) {
      strategy = `${productInfo.name}成交不是结束，而是深度经营的开始。要做好售后维护和满意度管理，让客户体验好、有获得感，自然会愿意帮你转介绍。转介绍的关键是"让客户有面子"，而不是直接索取。`;

      keyActions = [
        '成交后3天内回访，确认购买体验',
        '定期发送持仓报告和市场观点，保持联系',
        '在客户满意度最高时引导转介绍'
      ];
    }

    // ===== 生成多渠道文案 =====
    channels.forEach(channel => {
      const chInfo = channelInfo[channel] || { name: channel, icon: '📝' };
      const content = generateChannelContent(product, stepNum, channel, profile);
      contentExample.push({
        channel: channel,
        name: chInfo.name,
        icon: chInfo.icon,
        content: content
      });
    });

    return {
      stepNum,
      stepName: step.stepName,
      stepDesc: step.stepDesc,
      strategy,
      contentExample,
      keyActions,
      isKeyStep: true
    };
  });
}

// ===== 渲染生命周期时间轴 =====
function renderLifecycleTimeline(profile) {
  const timeline = document.getElementById('lifecycle-timeline');
  const steps = generateLifecycleSteps(profile);

  let html = '';
  steps.forEach((step, index) => {
    html += `
      <div class="timeline-step" style="animation-delay: ${index * 0.08}s;">
        <div class="timeline-step-num">${step.stepNum}</div>
        <div class="timeline-card">
          <div class="timeline-header">
            <span class="timeline-title">${step.stepName}</span>
            <button class="timeline-copy-btn" data-step="${step.stepNum}">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
              复制
            </button>
          </div>
          <div class="timeline-desc">${step.stepDesc}</div>
          
          <div class="timeline-section strategy">
            <div class="timeline-section-label">
              <span class="label-dot"></span>
              营销思路
            </div>
            <div class="timeline-section-text">${step.strategy}</div>
          </div>
          
          <div class="timeline-section content">
            <div class="timeline-section-label">
              <span class="label-dot"></span>
              内容参考
            </div>
            <div class="timeline-channels">
              ${step.contentExample.map((item, i) => `
                <div class="channel-card">
                  <div class="channel-card-header">
                    <span class="channel-icon">${item.icon}</span>
                    <span class="channel-name">${item.name}</span>
                    <button class="channel-copy-btn" data-step="${step.stepNum}" data-channel="${item.channel}">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                      复制文案
                    </button>
                  </div>
                  <div class="channel-card-content" id="channel-content-${step.stepNum}-${item.channel}">
                    ${item.content.replace(/\n/g, '<br>')}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          
          <div class="timeline-section actions">
            <div class="timeline-section-label">
              <span class="label-dot"></span>
              关键动作
            </div>
            <ul class="timeline-section-actions">
              ${step.keyActions.map(a => `<li>${a}</li>`).join('')}
            </ul>
          </div>
        </div>
      </div>
    `;
  });

  timeline.innerHTML = html;
}

// ============================================
// 复制功能
// ============================================

function initCopyButtons() {
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('copy-btn') || e.target.closest('.copy-btn')) {
      const btn = e.target.closest('.copy-btn');
      const copyId = btn.dataset.copy;
      const element = document.getElementById(copyId);
      
      if (element) {
        copyToClipboard(element.innerText);
      }
    }
  });
}

// 复制到剪贴板
function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showToast('已复制到剪贴板');
    }).catch(() => {
      fallbackCopy(text);
    });
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  
  try {
    document.execCommand('copy');
    showToast('已复制到剪贴板');
  } catch (err) {
    showToast('复制失败，请手动复制', 'error');
  }
  
  document.body.removeChild(textarea);
}

// ============================================
// Toast 提示
// ============================================

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  
  // 设置颜色
  if (type === 'success') {
    toast.style.background = 'var(--success)';
  } else if (type === 'warning') {
    toast.style.background = 'var(--accent2)';
  } else if (type === 'error') {
    toast.style.background = 'var(--danger)';
  }
  
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

// ============================================
// 实时行情数据
// ============================================

function initMarketData() {
  // 尝试从新浪财经获取实时数据（JSONP方式）
  loadSinaMarketData();
}

function loadSinaMarketData() {
  const indices = [
    { code: 'sh000001', name: '上证指数', el: 'sh' },
    { code: 'sz399001', name: '深证成指', el: 'sz' },
    { code: 'sz399006', name: '创业板指', el: 'cyb' },
    { code: 'hkHSI', name: '恒生指数', el: 'hs' }
  ];
  
  const codeList = indices.map(i => i.code).join(',');
  // 使用腾讯财经接口（GBK编码，支持JSONP）
  const url = `https://qt.gtimg.cn/q=${codeList}`;
  
  // JSONP 加载
  const script = document.createElement('script');
  script.src = url + '?t=' + Date.now();
  
  // 超时处理
  const timeout = setTimeout(() => {
    console.log('实时数据加载超时，使用模拟数据');
  }, 5000);
  
  script.onload = function() {
    clearTimeout(timeout);
    try {
      indices.forEach((idx, i) => {
        const data = window['v_' + idx.code];
        if (data) {
          // 腾讯财经格式（去掉前后引号，按~分割）
          const raw = data.replace(/"/g, '');
          const fields = raw.split('~');
          // 字段: 1-名称, 2-代码, 3-当前价, 4-昨收, 5-今开, ...
          // 30-日期时间, 31-涨跌额, 32-涨跌幅
          const name = fields[1] || idx.name;
          const current = parseFloat(fields[3]);
          const change = parseFloat(fields[31]);
          const changePercent = parseFloat(fields[32]);
          
          if (!isNaN(current) && !isNaN(change) && !isNaN(changePercent)) {
            const isUp = change >= 0;
            const changeStr = (isUp ? '+' : '') + change.toFixed(2) + 
              ' (' + (isUp ? '+' : '') + changePercent.toFixed(2) + '%)';
            
            updateMarketCard(i, name, current.toFixed(2), changeStr, isUp);
          }
        }
      });
      console.log('实时行情数据加载成功');
    } catch(e) {
      console.log('行情数据解析失败:', e);
    }
  };
  
  script.onerror = function() {
    clearTimeout(timeout);
    console.log('实时数据接口不可用，使用模拟数据');
  };
  
  document.head.appendChild(script);
}

function updateMarketCard(index, name, value, change, isUp) {
  const cards = document.querySelectorAll('.market-card');
  if (cards[index]) {
    const labelEl = cards[index].querySelector('.market-label');
    const valueEl = cards[index].querySelector('.market-value');
    const changeEl = cards[index].querySelector('.market-change');
    
    if (labelEl) labelEl.textContent = name;
    if (valueEl) {
      valueEl.textContent = value;
      valueEl.className = 'market-value ' + (isUp ? 'up' : 'down');
    }
    if (changeEl) {
      changeEl.textContent = change;
      changeEl.className = 'market-change ' + (isUp ? 'up' : 'down');
    }
  }
}

// ============================================
// 海报生成（Canvas）
// ============================================

// 绘制海报
function drawPoster() {
  const canvas = document.getElementById('poster-canvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width;  // 750
  const H = 1680; // 增加高度容纳更多内容
  canvas.height = H;
  
  // 获取市场数据
  const cards = document.querySelectorAll('.market-card');
  const marketData = [];
  cards.forEach(card => {
    marketData.push({
      name: card.querySelector('.market-label').textContent,
      value: card.querySelector('.market-value').textContent,
      change: card.querySelector('.market-change').textContent,
      isUp: card.querySelector('.market-value').classList.contains('up')
    });
  });
  
  // 获取要闻数据
  const newsItems = document.querySelectorAll('#headlines-content .news-item');
  const news = [];
  newsItems.forEach(item => {
    const tagEl = item.querySelector('.news-tag');
    const titleEl = item.querySelector('.news-title');
    news.push({
      tag: tagEl ? tagEl.textContent : '',
      title: titleEl ? titleEl.textContent : ''
    });
  });
  
  // 获取板块异动数据
  const sectorItems = document.querySelectorAll('#sectors-content .sector-item');
  const sectors = [];
  sectorItems.forEach(item => {
    sectors.push({
      name: item.querySelector('.sector-name').textContent,
      change: item.querySelector('.sector-change').textContent,
      isUp: item.classList.contains('up')
    });
  });
  
  // 背景渐变
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, '#0f1d33');
  bgGrad.addColorStop(0.5, '#1a2a45');
  bgGrad.addColorStop(1, '#0f1d33');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);
  
  // 装饰光效
  const glowGrad = ctx.createRadialGradient(W*0.85, 80, 0, W*0.85, 80, 450);
  glowGrad.addColorStop(0, 'rgba(239, 68, 68, 0.12)');
  glowGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = glowGrad;
  ctx.fillRect(0, 0, W, 500);
  
  const glowGrad2 = ctx.createRadialGradient(80, H*0.65, 0, 80, H*0.65, 400);
  glowGrad2.addColorStop(0, 'rgba(245, 158, 11, 0.1)');
  glowGrad2.addColorStop(1, 'transparent');
  ctx.fillStyle = glowGrad2;
  ctx.fillRect(0, H*0.45, W, H*0.4);
  
  // 顶部 Logo 区
  ctx.fillStyle = '#f87171';
  ctx.font = 'bold 32px -apple-system, sans-serif';
  ctx.fillText('⚡ 智策营销助手', 50, 80);
  
  ctx.fillStyle = '#64748b';
  ctx.font = '20px -apple-system, sans-serif';
  ctx.fillText('每日金融早报', 50, 120);
  
  // 日期
  const now = new Date();
  const dateStr = now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
  ctx.fillStyle = '#8b9bb5';
  ctx.font = '22px -apple-system, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(dateStr, W - 50, 100);
  ctx.textAlign = 'left';
  
  // 分隔线
  const lineGrad = ctx.createLinearGradient(50, 0, W-50, 0);
  lineGrad.addColorStop(0, 'transparent');
  lineGrad.addColorStop(0.5, '#ef4444');
  lineGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = lineGrad;
  ctx.fillRect(50, 160, W - 100, 2);
  
  // ====== 市场数据卡片 ======
  const cardY = 200;
  const cardW = (W - 130) / 2;
  const cardH = 130;
  
  marketData.forEach((data, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 50 + col * (cardW + 30);
    const y = cardY + row * (cardH + 16);
    
    // 卡片背景
    ctx.fillStyle = 'rgba(26, 42, 69, 0.8)';
    roundRect(ctx, x, y, cardW, cardH, 16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(42, 58, 85, 0.8)';
    ctx.lineWidth = 1;
    roundRect(ctx, x, y, cardW, cardH, 16);
    ctx.stroke();
    
    // 指数名称
    ctx.fillStyle = '#8b9bb5';
    ctx.font = '22px -apple-system, sans-serif';
    ctx.fillText(data.name, x + 24, y + 38);
    
    // 指数点位（涨红跌绿）
    const color = data.isUp ? '#ef4444' : '#10b981';
    ctx.fillStyle = color;
    ctx.font = 'bold 34px monospace';
    ctx.fillText(data.value, x + 24, y + 78);
    
    // 涨跌幅
    ctx.fillStyle = color;
    ctx.font = '18px monospace';
    ctx.fillText(data.change, x + 24, y + 108);
  });
  
  // ====== 市场回顾 ======
  const reviewY = cardY + 2 * (cardH + 16) + 30;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px -apple-system, sans-serif';
  ctx.fillText('📈 市场回顾', 50, reviewY);
  
  const reviewBgY = reviewY + 20;
  ctx.fillStyle = 'rgba(26, 42, 69, 0.6)';
  
  // 从页面获取实时市场回顾文本
  let reviewText = '昨日A股三大指数涨跌分化，沪指震荡上行，金融地产板块领涨；创业板指小幅回调，新能源板块承压。两市成交额维持万亿水平，北向资金延续净流入态势。港股科技股表现活跃，美股隔夜收高，AI概念继续走强。';
  const marketContentEl = document.getElementById('market-content');
  if (marketContentEl) {
    reviewText = marketContentEl.innerText.replace(/\n/g, '').substring(0, 150);
  }
  
  // 根据文本长度动态调整背景高度
  ctx.font = '20px -apple-system, sans-serif';
  const reviewLines = wrapText(ctx, reviewText, W - 140);
  const reviewBgHeight = Math.max(140, reviewLines.length * 32 + 40);
  
  roundRect(ctx, 50, reviewBgY, W - 100, reviewBgHeight, 12);
  ctx.fill();
  
  ctx.fillStyle = '#cbd5e1';
  reviewLines.forEach((line, i) => {
    ctx.fillText(line, 70, reviewBgY + 36 + i * 32);
  });
  
  // ====== 板块异动 ======
  const sectorY = reviewBgY + reviewBgHeight + 30;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px -apple-system, sans-serif';
  ctx.fillText('📊 板块异动', 50, sectorY);
  
  let sectorCurY = sectorY + 20;
  sectors.forEach((s, i) => {
    const bgY = sectorCurY;
    const sColor = s.isUp ? '#ef4444' : '#10b981';
    
    ctx.fillStyle = 'rgba(26, 42, 69, 0.6)';
    roundRect(ctx, 50, bgY, W - 100, 60, 10);
    ctx.fill();
    
    // 板块名称
    ctx.fillStyle = '#e8edf5';
    ctx.font = 'bold 22px -apple-system, sans-serif';
    ctx.fillText(s.name, 70, bgY + 38);
    
    // 涨跌幅
    ctx.fillStyle = sColor;
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(s.change, W - 70, bgY + 38);
    ctx.textAlign = 'left';
    
    sectorCurY += 70;
  });
  
  // ====== 要闻速递 ======
  const newsY = sectorCurY + 20;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px -apple-system, sans-serif';
  ctx.fillText('📌 要闻速递', 50, newsY);
  
  const tagColors = {
    '宏观': '#3b82f6',
    '政策': '#8b5cf6',
    '行业': '#10b981',
    '国际': '#f59e0b'
  };
  
  let newsY2 = newsY + 30;
  const displayNews = news.slice(0, 4);
  displayNews.forEach((item, i) => {
    const tagColor = tagColors[item.tag] || '#64748b';
    
    // 标签背景
    ctx.fillStyle = tagColor + '33';
    roundRect(ctx, 50, newsY2, 70, 32, 6);
    ctx.fill();
    
    // 标签文字
    ctx.fillStyle = tagColor;
    ctx.font = '18px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(item.tag, 50 + 35, newsY2 + 22);
    ctx.textAlign = 'left';
    
    // 新闻标题
    ctx.fillStyle = '#e8edf5';
    ctx.font = '20px -apple-system, sans-serif';
    const maxWidth = W - 120 - 80;
    const lines = wrapText(ctx, item.title, maxWidth);
    lines.forEach((line, li) => {
      ctx.fillText(line, 140, newsY2 + 24 + li * 28);
    });
    
    newsY2 += Math.max(48, lines.length * 28 + 20);
  });
  
  // ====== 底部区 ======
  const bottomY = H - 140;
  
  // 分隔线
  ctx.fillStyle = 'rgba(42, 58, 85, 0.6)';
  ctx.fillRect(50, bottomY, W - 100, 1);
  
  // 分析师信息
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px -apple-system, sans-serif';
  ctx.fillText('李经理 · 资深理财顾问', 50, bottomY + 45);
  
  ctx.fillStyle = '#8b9bb5';
  ctx.font = '18px -apple-system, sans-serif';
  ctx.fillText('专业理财 · 用心服务', 50, bottomY + 75);
  ctx.fillStyle = '#64748b';
  ctx.font = '16px -apple-system, sans-serif';
  ctx.fillText('风险提示：仅供参考，不构成投资建议', 50, bottomY + 102);
  
  // 二维码占位
  ctx.fillStyle = '#243656';
  ctx.fillRect(W - 150, bottomY + 10, 100, 100);
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 2;
  ctx.strokeRect(W - 150, bottomY + 10, 100, 100);
  
  ctx.fillStyle = '#64748b';
  ctx.font = '16px -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('扫码咨询', W - 100, bottomY + 62);
  ctx.textAlign = 'left';
}

// 工具：圆角矩形
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// 工具：文字换行
function wrapText(ctx, text, maxWidth) {
  const lines = [];
  let currentLine = '';
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const testLine = currentLine + char;
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && i > 0) {
      lines.push(currentLine);
      currentLine = char;
    } else {
      currentLine = testLine;
    }
  }
  
  lines.push(currentLine);
  return lines;
}

// ============================================
// 弹窗控制
// ============================================

function openPosterModal() {
  document.getElementById('poster-modal').classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closePosterModal() {
  document.getElementById('poster-modal').classList.remove('show');
  document.body.style.overflow = '';
}

// ESC 关闭弹窗
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closePosterModal();
    closeHotspotDetailModal();
    closeHotspotResultModal();
  }
});

// ============================================
// 个人中心
// ============================================

function initProfile() {
  // 从localStorage读取用户数据
  let userData = getUserData();
  
  // 菜单切换
  const menuItems = document.querySelectorAll('.profile-menu-item');
  menuItems.forEach(item => {
    item.addEventListener('click', function() {
      const menu = this.dataset.menu;
      
      // 切换菜单active状态
      menuItems.forEach(m => m.classList.remove('active'));
      this.classList.add('active');
      
      // 切换面板显示
      const panels = ['info', 'vip', 'invite', 'account'];
      panels.forEach(p => {
        const panel = document.getElementById('panel-' + p);
        if (panel) {
          panel.style.display = p === menu ? 'block' : 'none';
        }
      });
    });
  });
  
  // 保存基础信息
  const saveInfoBtn = document.getElementById('save-info-btn');
  if (saveInfoBtn) {
    saveInfoBtn.addEventListener('click', function() {
      const name = document.getElementById('input-name').value.trim();
      const position = document.getElementById('input-position').value.trim();
      const company = document.getElementById('input-company').value.trim();
      const sign = document.getElementById('input-sign').value.trim();
      
      if (!name) {
        showToast('请输入姓名', 'warning');
        return;
      }
      
      userData.name = name;
      userData.position = position;
      userData.company = company;
      userData.sign = sign;
      
      saveUserData(userData);
      updateUserDisplay(userData);
      
      showToast('信息保存成功！');
    });
  }
  
  // 头像上传
  const avatarInput = document.getElementById('avatar-input');
  if (avatarInput) {
    avatarInput.addEventListener('change', function() {
      if (this.files.length > 0) {
        const reader = new FileReader();
        reader.onload = function(e) {
          const avatarPreview = document.getElementById('avatar-preview');
          const userAvatar = document.getElementById('user-avatar');
          if (avatarPreview) {
            avatarPreview.style.backgroundImage = `url(${e.target.result})`;
            avatarPreview.style.backgroundSize = 'cover';
            avatarPreview.textContent = '';
          }
          if (userAvatar) {
            userAvatar.style.backgroundImage = `url(${e.target.result})`;
            userAvatar.style.backgroundSize = 'cover';
            userAvatar.textContent = '';
          }
          userData.avatar = e.target.result;
          saveUserData(userData);
          showToast('头像上传成功！');
        };
        reader.readAsDataURL(this.files[0]);
      }
    });
  }
  
  // Logo上传
  const logoInput = document.getElementById('logo-input');
  if (logoInput) {
    logoInput.addEventListener('change', function() {
      if (this.files.length > 0) {
        const reader = new FileReader();
        reader.onload = function(e) {
          const logoPreview = document.getElementById('logo-preview');
          if (logoPreview) {
            logoPreview.style.backgroundImage = `url(${e.target.result})`;
            logoPreview.style.backgroundSize = 'contain';
            logoPreview.style.backgroundRepeat = 'no-repeat';
            logoPreview.style.backgroundPosition = 'center';
            const placeholder = logoPreview.querySelector('.logo-placeholder');
            if (placeholder) placeholder.style.display = 'none';
          }
          userData.logo = e.target.result;
          saveUserData(userData);
          showToast('Logo上传成功！');
        };
        reader.readAsDataURL(this.files[0]);
      }
    });
  }
  
  // 二维码上传
  const qrcodeInput = document.getElementById('qrcode-input');
  if (qrcodeInput) {
    qrcodeInput.addEventListener('change', function() {
      if (this.files.length > 0) {
        const reader = new FileReader();
        reader.onload = function(e) {
          const qrcodePreview = document.getElementById('qrcode-preview');
          if (qrcodePreview) {
            qrcodePreview.style.backgroundImage = `url(${e.target.result})`;
            qrcodePreview.style.backgroundSize = 'cover';
            qrcodePreview.style.backgroundPosition = 'center';
            const placeholder = qrcodePreview.querySelector('.qrcode-placeholder');
            if (placeholder) placeholder.style.display = 'none';
          }
          userData.qrcode = e.target.result;
          saveUserData(userData);
          showToast('二维码上传成功！');
        };
        reader.readAsDataURL(this.files[0]);
      }
    });
  }
  
  // 套餐购买
  const planBtns = document.querySelectorAll('.plan-btn');
  planBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const plan = this.dataset.plan;
      let days = 0;
      let planName = '';
      
      switch(plan) {
        case 'month':
          days = 30;
          planName = '月度会员';
          break;
        case 'quarter':
          days = 90;
          planName = '季度会员';
          break;
        case 'year':
          days = 365;
          planName = '年度会员';
          break;
      }
      
      // 模拟开通成功
      const currentExpire = new Date(userData.vipExpire || Date.now());
      const newExpire = new Date(Math.max(currentExpire.getTime(), Date.now()) + days * 24 * 60 * 60 * 1000);
      userData.vipExpire = newExpire.toISOString();
      userData.isVip = true;
      
      saveUserData(userData);
      updateVipDisplay(userData);
      
      showToast(`恭喜您成功开通${planName}！`);
    });
  });
  
  // 积分兑换
  const exchangeBtns = document.querySelectorAll('.exchange-btn');
  exchangeBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const cost = parseInt(this.dataset.cost);
      const days = parseInt(this.dataset.days);
      
      if (userData.points < cost) {
        showToast('积分不足，分享工具获取更多积分', 'warning');
        return;
      }
      
      userData.points -= cost;
      
      // 增加会员天数
      const currentExpire = new Date(userData.vipExpire || Date.now());
      const newExpire = new Date(Math.max(currentExpire.getTime(), Date.now()) + days * 24 * 60 * 60 * 1000);
      userData.vipExpire = newExpire.toISOString();
      userData.isVip = true;
      
      saveUserData(userData);
      updateVipDisplay(userData);
      updatePointsDisplay(userData);
      
      showToast(`兑换成功！会员延长${days}天`);
    });
  });
  
  // 复制邀请码
  const copyCodeBtn = document.getElementById('copy-code-btn');
  if (copyCodeBtn) {
    copyCodeBtn.addEventListener('click', function() {
      const code = document.getElementById('invite-code').textContent;
      copyToClipboard(code);
      showToast('邀请码已复制');
    });
  }
  
  // 复制分享链接
  const copyLinkBtn = document.getElementById('copy-link-btn');
  if (copyLinkBtn) {
    copyLinkBtn.addEventListener('click', function() {
      const link = document.getElementById('share-link').value;
      copyToClipboard(link);
      showToast('分享链接已复制');
    });
  }
  
  // 修改密码
  const changePwdBtn = document.getElementById('change-password-btn');
  if (changePwdBtn) {
    changePwdBtn.addEventListener('click', function() {
      const oldPwd = document.getElementById('old-password').value;
      const newPwd = document.getElementById('new-password').value;
      const confirmPwd = document.getElementById('confirm-password').value;
      
      if (!oldPwd || !newPwd || !confirmPwd) {
        showToast('请填写完整密码信息', 'warning');
        return;
      }
      
      if (newPwd !== confirmPwd) {
        showToast('两次输入的新密码不一致', 'warning');
        return;
      }
      
      if (newPwd.length < 6) {
        showToast('密码长度不能少于6位', 'warning');
        return;
      }
      
      // 模拟修改成功
      userData.password = newPwd;
      saveUserData(userData);
      
      document.getElementById('old-password').value = '';
      document.getElementById('new-password').value = '';
      document.getElementById('confirm-password').value = '';
      
      showToast('密码修改成功！');
    });
  }
  
  // 清除缓存
  const clearCacheBtn = document.getElementById('clear-cache-btn');
  if (clearCacheBtn) {
    clearCacheBtn.addEventListener('click', function() {
      // 只清除缓存数据，保留用户信息
      const keysToKeep = ['zhice_user_data'];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !keysToKeep.includes(key) && key.startsWith('zhice_')) {
          localStorage.removeItem(key);
        }
      }
      showToast('缓存清除成功！');
    });
  }
  
  // 退出登录
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      if (confirm('确定要退出登录吗？')) {
        localStorage.removeItem('zhice_user_data');
        showToast('已退出登录');
        setTimeout(() => {
          location.reload();
        }, 1000);
      }
    });
  }
  
  // 初始化显示
  updateUserDisplay(userData);
  updateVipDisplay(userData);
  updatePointsDisplay(userData);
}

// 获取用户数据
function getUserData() {
  const defaultData = {
    name: '李经理',
    position: '理财顾问',
    company: 'XX证券股份有限公司',
    sign: '专业理财，用心服务，为您的资产保驾护航',
    avatar: '',
    logo: '',
    qrcode: '',
    phone: '138****8888',
    isVip: true,
    vipExpire: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    points: 120,
    inviteCode: 'ZHICE2026',
    inviteCount: 0,
    invitePoints: 0,
    inviteDays: 0,
    password: '123456'
  };
  
  try {
    const saved = localStorage.getItem('zhice_user_data');
    if (saved) {
      return { ...defaultData, ...JSON.parse(saved) };
    }
  } catch(e) {}
  
  return defaultData;
}

// 保存用户数据
function saveUserData(data) {
  try {
    localStorage.setItem('zhice_user_data', JSON.stringify(data));
  } catch(e) {}
}

// 更新用户信息显示
function updateUserDisplay(data) {
  const nameEl = document.getElementById('profile-name');
  const positionEl = document.getElementById('profile-position');
  const companyEl = document.getElementById('profile-company');
  const avatarEl = document.getElementById('user-avatar');
  const avatarPreview = document.getElementById('avatar-preview');
  
  if (nameEl) nameEl.textContent = data.name;
  if (positionEl) positionEl.textContent = data.position;
  if (companyEl) companyEl.textContent = data.company;
  
  if (data.avatar) {
    if (avatarEl) {
      avatarEl.style.backgroundImage = `url(${data.avatar})`;
      avatarEl.style.backgroundSize = 'cover';
      avatarEl.textContent = '';
    }
    if (avatarPreview) {
      avatarPreview.style.backgroundImage = `url(${data.avatar})`;
      avatarPreview.style.backgroundSize = 'cover';
      avatarPreview.textContent = '';
    }
  }
  
  // 更新输入框的值
  const inputName = document.getElementById('input-name');
  const inputPosition = document.getElementById('input-position');
  const inputCompany = document.getElementById('input-company');
  const inputSign = document.getElementById('input-sign');
  
  if (inputName) inputName.value = data.name;
  if (inputPosition) inputPosition.value = data.position;
  if (inputCompany) inputCompany.value = data.company;
  if (inputSign) inputSign.value = data.sign;
}

// 更新会员状态显示
function updateVipDisplay(data) {
  const vipBadge = document.getElementById('vip-badge');
  const vipDaysEl = document.getElementById('vip-days');
  const vipDaysBadge = document.getElementById('vip-days-badge');
  const vipExpireDate = document.getElementById('vip-expire-date');
  
  const now = Date.now();
  const expireTime = new Date(data.vipExpire).getTime();
  const daysLeft = Math.ceil((expireTime - now) / (24 * 60 * 60 * 1000));
  
  if (data.isVip && daysLeft > 0) {
    if (vipBadge) vipBadge.style.display = 'flex';
    if (vipDaysEl) vipDaysEl.textContent = `剩余${daysLeft}天`;
    if (vipDaysBadge) vipDaysBadge.textContent = `剩余 ${daysLeft} 天`;
    if (vipExpireDate) {
      const expireDate = new Date(data.vipExpire);
      vipExpireDate.textContent = `${expireDate.getFullYear()}年${expireDate.getMonth()+1}月${expireDate.getDate()}日`;
    }
  } else {
    if (vipBadge) vipBadge.style.display = 'none';
    if (vipDaysBadge) vipDaysBadge.textContent = '已过期';
  }
}

// 更新积分显示
function updatePointsDisplay(data) {
  const pointsValue = document.getElementById('points-value');
  if (pointsValue) pointsValue.textContent = data.points;
  
  const inviteCount = document.getElementById('invite-count');
  const invitePoints = document.getElementById('invite-points');
  const inviteDays = document.getElementById('invite-days');
  
  if (inviteCount) inviteCount.textContent = data.inviteCount || 0;
  if (invitePoints) invitePoints.textContent = data.invitePoints || 0;
  if (inviteDays) inviteDays.textContent = data.inviteDays || 0;
}

// 复制到剪贴板
function copyToClipboard(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand('copy');
  } catch(e) {}
  document.body.removeChild(textarea);
}
