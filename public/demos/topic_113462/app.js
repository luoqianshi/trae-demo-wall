// ======= Demo 数据 =======

const CATEGORY = {
  medical:  { name:'医疗',   cls:'cat-medical'   },
  finance:  { name:'金融',   cls:'cat-finance'   },
  school:   { name:'学校',   cls:'cat-school'    },
  gov:      { name:'政务',   cls:'cat-gov'       },
  express:  { name:'快递',   cls:'cat-express'   },
  ad:       { name:'其他', cls:'cat-ad'  }
};

const PRIORITY = {
  urgent: { name:'急', cls:'badge-urgent', weight:1 },
  high:   { name:'高',   cls:'badge-high',   weight:2 },
  mid:    { name:'中',   cls:'badge-mid',    weight:3 },
  low:    { name:'低',   cls:'badge-low',    weight:4 },
  none:   { name:'忽略', cls:'badge-none',   weight:5 }
};

// 预设用户设置
const settings = {
  strongKeywords: ['医院','就诊','复诊','异常消费','紧急','扣款','缴费截止','截止','异常'],
  muteKeywords:   ['退订','回复TD','验证码','优惠'],
  whitelist:       ['仁济医院','招商银行','学校通知','政务通知']
};

// 8 条预设短信
const initialSms = [
  {
    id:1, sender:'仁济医院', time:'今天 09:12',
    content:'【仁济医院】张**先生，您预约的明天 9:30 消化内科复诊已确认，请提前 15 分钟到院签到。如需改期请回复本短信。',
    category:'medical', facts:['时间：明天 9:30','事项：消化内科复诊','地点：仁济医院'],
    todo:'明天 9:30 仁济医院消化内科复诊'
  },
  {
    id:2, sender:'招商银行', time:'今天 08:45',
    content:'【招商银行】尊敬的用户，您尾号 1234 的储蓄卡在 12:45 发生异常消费 ¥888.00，若非本人操作请立即致电 95555 挂失。',
    category:'finance', facts:['金额：¥888.00','时间：12:45','风险：异常消费'],
    todo:'联系招商银行核实异常消费并挂失'
  },
  {
    id:3, sender:'学校通知', time:'昨天 21:30',
    content:'【学校通知】各位家长好，我校将于本周五(6/30)前完成校服尺码确认，请扫描二维码填写孩子尺码信息，逾期将顺延至下学期。',
    category:'school', facts:['截止：本周五 6/30','事项：校服尺码确认'],
    todo:'本周五前提交孩子校服尺码'
  },
  {
    id:4, sender:'政务通知', time:'昨天 18:05',
    content:'【政务通知】您的住房公积金 6 月份自缴截止日为 6 月 30 日，逾期将产生滞纳金，请及时完成缴纳。',
    category:'gov', facts:['截止：6 月 30 日','事项：公积金自缴'],
    todo:'6 月 30 日前缴纳 6 月公积金'
  },
  {
    id:5, sender:'菜鸟驿站', time:'今天 10:20',
    content:'【菜鸟驿站】您的京东快递(包裹码 7-12-3456)已送达小区驿站，请 24 小时内凭取件码取件。',
    category:'express', facts:['取件码：7-12-3456','地点：小区驿站'],
    todo:'凭取件码取京东快递'
  },
  {
    id:6, sender:'顺丰速运', time:'今天 07:30',
    content:'【顺丰】您的快递 SF1234567890 已由快递柜代收，请凭取件码 8821 取件。',
    category:'express', facts:['取件码：8821','地点：小区快递柜'],
    todo:'到快递柜取顺丰快递'
  },
  {
    id:7, sender:'安全中心', time:'今天 06:58',
    content:'【安全中心】您的验证码为 827143，5 分钟内有效，请勿泄露给他人。',
    category:'ad', facts:['验证码：827143'],
    todo:null
  },
  {
    id:8, sender:'某某商场', time:'今天 05:12',
    content:'【某某商场】618 大促全场 5 折起，满 300 减 50，点击 t.cn/xxxxx 查看，退订回复 TD。',
    category:'ad', facts:[],
    todo:null
  }
];

// ======= 状态 =======
let state = {
  smsList: [],
  todos: [],
  archives: [],
  currentPage: 'inbox',
  currentTab: 'inbox',
  archiveCat: 'all',
  ringQueue: [],
  scanContext: null
};

// ======= 工具函数 =======
function save(key, val){ try{ localStorage.setItem('sms-not-leak-'+key, JSON.stringify(val)); }catch(e){} }
function load(key, def){ try{ const v = localStorage.getItem('sms-not-leak-'+key); return v ? JSON.parse(v) : def; }catch(e){ return def; } }

// 重置数据（用于首次运行或清空）
function resetIfNeeded(){
  if(!load('init', false)){
    save('sms', initialSms);
    save('settings', settings);
    save('init', true);
  }
}

// ======= 核心：重要性判定 =======
function analyzeSms(sms, cfg){
  const text = (sms.sender + ' ' + sms.content).toLowerCase();

  // 第 1 层：静默关键字（退订/验证码）
  const muteHit = cfg.muteKeywords.some(k => text.includes(k.toLowerCase()));
  if(muteHit){
    return { priority:'none', channel:'silent', reason:'命中静默关键字', category:sms.category };
  }

  // 第 1 层：强提醒关键字（决定是否强提醒，但优先级需要再细分）
  const hitKw = cfg.strongKeywords.find(k => text.includes(k.toLowerCase()));
  const isUrgentKw = /异常消费|紧急|扣款/.test(text); // 金融异常类 → 紧急
  const isHighKw   = /医院|就诊|复诊/.test(text);     // 医疗类 → 高
  const kwPriority = isUrgentKw ? 'urgent' : (isHighKw ? 'high' : 'mid');

  // 发送方白名单：医院/银行→高；学校/政务→中
  const senderCategory = sms.category;
  let whitelistPriority = 'mid';
  if(senderCategory==='finance') whitelistPriority = 'urgent';
  else if(senderCategory==='medical') whitelistPriority = 'high';
  else if(senderCategory==='school' || senderCategory==='gov') whitelistPriority = 'mid';

  // 第 1 层：发送方白名单（支持名称包含匹配和电话号码精确/前缀匹配）
  const isWhitelist = cfg.whitelist.some(w => {
    const wTrim = w.trim();
    if (/^\d+$/.test(wTrim)) {
      return sms.sender === wTrim || sms.sender.startsWith(wTrim);
    }
    return sms.sender.includes(wTrim);
  });
  if(isWhitelist){
    const priority = kwPriority === 'mid' ? whitelistPriority : kwPriority;
    return { priority, channel:'ring', reason:'发送方在白名单', category:sms.category };
  }

  // 第 1 层：强提醒关键字
  if(hitKw){
    return { priority: kwPriority, channel:'ring', reason:'命中关键字「'+hitKw+'」', category:sms.category };
  }

  // 第 2 层：AI 启发式判断
  if(sms.category==='medical'){
    return { priority:'high', channel:'banner', reason:'AI 识别为医疗事项', category:sms.category };
  }
  if(sms.category==='finance'){
    return { priority:'high', channel:'banner', reason:'AI 识别为金融事项', category:sms.category };
  }
  if(sms.category==='school' || sms.category==='gov'){
    return { priority:'mid', channel:'banner', reason:'AI 识别为学校/政务事项', category:sms.category };
  }
  if(sms.category==='express'){
    return { priority:'low', channel:'silent', reason:'快递类信息', category:sms.category };
  }
  return { priority:'none', channel:'silent', reason:'AI 判定为普通信息', category:sms.category };
}

// ======= 初始化 =======
function init(){
  const force = new URLSearchParams(location.search).has('reset');
  if(force){
    localStorage.removeItem('sms-not-leak-init');
    localStorage.removeItem('sms-not-leak-sms');
    localStorage.removeItem('sms-not-leak-settings');
  }
  resetIfNeeded();
  const sms = load('sms', initialSms);
  const cfg = load('settings', settings);

  // 对每条短信做一次性分析
  const analyzed = sms.map(s => ({ ...s, analysis: analyzeSms(s, cfg) }));
  state.smsList = analyzed;

  // 生成待办 & 归档
  state.todos = analyzed.filter(s => s.todo && s.analysis.priority!=='none').map(s => ({
    id:'t'+s.id, sourceId:s.id, title:s.todo,
    priority:s.analysis.priority, category:s.category,
    done:false, createdAt:s.time
  }));

  state.archives = analyzed.map(s => ({
    id:'a'+s.id, sourceId:s.id, sender:s.sender, time:s.time,
    snippet:s.content.slice(0,60), category:s.category,
    priority:s.analysis.priority, facts:s.facts || []
  }));

  // 绑定事件
  bindTabs();
  bindSettings();
  bindRing();
  bindScan();
  bindDetail();
  bindSearch();
  bindBigFont();
  bindArchiveTabs();

  // 渲染
  renderAll();

  // 展示强提醒队列（demo 场景：依次触发前两条紧急/高优先级）
  const skipRing = new URLSearchParams(location.search).has('skipRing');
  const rings = analyzed.filter(s => s.analysis.channel==='ring' && s.analysis.priority!=='none');
  state.ringQueue = rings;
  if(!skipRing){
    setTimeout(playRingQueue, 800);
  } else {
    document.getElementById('ringModal').classList.remove('active');
    gotoPage('page-inbox');
  }

  // 显示首次使用引导
  setTimeout(showGuideBubble, 500);
}

// ======= 渲染 =======
function renderAll(){
  renderInbox();
  renderTodos();
  renderArchive();
  renderSummary();
  renderKeywords();
  renderWhitelist();
  renderWhitelistRecommend();
}

function setTopBar(title, action){
  document.getElementById('topTitle').textContent = title;
  const a = document.getElementById('topAction');
  if(action===null){ a.style.display='none'; }
  else{ a.style.display='block'; a.textContent = action||'一键扫描'; }
}

function gotoPage(pageId){
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const el = document.getElementById(pageId);
  if(el) el.classList.add('active');

  document.getElementById('backBtn').classList.toggle('hidden', pageId==='page-inbox' || pageId==='page-todo' || pageId==='page-summary' || pageId==='page-archive' || pageId==='page-me' || pageId==='page-detail');

  // Tab 激活
  const tabMap = { 'page-inbox':'inbox','page-todo':'todo','page-summary':'summary','page-archive':'archive','page-me':'me' };
  const tab = tabMap[pageId];
  if(tab){
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab===tab));
    state.currentTab = tab;
  }
  state.currentPage = pageId;

  const titles = {
    'page-inbox':'短信不漏',
    'page-detail':'短信详情',
    'page-todo':'我的待办',
    'page-archive':'归档',
    'page-summary':'今日摘要',
    'page-me':'我的',
    'page-keywords':'强提醒关键字',
    'page-whitelist':'发送方白名单'
  };
  const actions = {
    'page-inbox':'一键扫描',
    'page-detail':null,
    'page-todo':null,
    'page-archive':null,
    'page-summary':null,
    'page-me':null,
    'page-keywords':null,
    'page-whitelist':null
  };
  setTopBar(titles[pageId]||'短信不漏', actions[pageId]);
}

function renderInbox(){
  const list = document.getElementById('smsList');
  const search = document.getElementById('searchInput')?.value?.toLowerCase() || '';
  list.innerHTML = '';
  const filtered = state.smsList.filter(s => {
    if(!search) return true;
    return s.sender.toLowerCase().includes(search) || s.content.toLowerCase().includes(search);
  });
  filtered.forEach(s => {
    const p = PRIORITY[s.analysis.priority];
    const c = CATEGORY[s.category];
    const item = document.createElement('div');
    item.className = `rounded-2xl bg-white p-3 shadow-sm cursor-pointer active:scale-[.99] transition-transform ${s.analysis.priority==='urgent'?'item-urgent':''}`;
    item.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-lg flex-shrink-0">
          ${iconForSender(s.sender)}
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between mb-1">
            <div class="flex items-center gap-2 min-w-0">
              <span class="text-base font-semibold text-gray-900 truncate">${s.sender}</span>
              <span class="chip ${c.cls}">${c.name}</span>
            </div>
            <div class="text-sm text-gray-400 flex-shrink-0">${s.time}</div>
          </div>
          <div class="text-sm text-gray-600 line-clamp-2">${s.content}</div>
          <div class="mt-2 flex items-center gap-2">
            <span class="chip ${p.cls}">${p.name}</span>
            <span class="text-xs text-gray-400">${s.analysis.reason}</span>
          </div>
        </div>
      </div>`;
    item.addEventListener('click', () => openSmsDetail(s));
    list.appendChild(item);
  });
}

function iconForSender(sender){
  if(/医院|诊/.test(sender)) return '⚕';
  if(/银行|招行|工行/.test(sender)) return '💰';
  if(/学校|教育/.test(sender)) return '📚';
  if(/政务|公积金|社保/.test(sender)) return '⚙';
  if(/快递|驿站|顺丰|菜鸟/.test(sender)) return '📦';
  if(/验证码|安全/.test(sender)) return '🔑';
  if(/商场|电商|促销/.test(sender)) return '🛒';
  return '✉';
}

function renderTodos(){
  const list = document.getElementById('todoList');
  document.getElementById('todoCount').textContent = state.todos.filter(t=>!t.done).length;
  list.innerHTML = '';
  const sortedTodos = [...state.todos].sort((a,b) => {
    const order = { urgent:1, high:2, mid:3, low:4 };
    return order[a.priority] - order[b.priority];
  });
  sortedTodos.forEach(t => {
    const p = PRIORITY[t.priority];
    const c = CATEGORY[t.category];
    const el = document.createElement('div');
    el.className = `rounded-2xl bg-white p-3 shadow-sm flex items-start gap-3 ${t.priority==='urgent'?'item-urgent':''}`;
    el.innerHTML = `
      <div class="w-6 h-6 mt-0.5 rounded-md border-2 ${t.done?'bg-ok border-ok':'border-gray-300'} flex items-center justify-center text-white text-sm flex-shrink-0">${t.done?'✓':''}</div>
      <div class="flex-1 min-w-0">
        <div class="flex items-start justify-between mb-1">
          <span class="text-base ${t.done?'line-through text-gray-400':'text-gray-900 font-medium'} line-clamp-2">${t.title}</span>
          <span class="chip ${p.cls} flex-shrink-0 ml-2">${p.name}</span>
        </div>
        <div class="flex items-center gap-2 text-sm text-gray-500">
          <span class="chip ${c.cls}">${c.name}</span>
          <span>· ${t.createdAt}</span>
        </div>
      </div>`;
    el.querySelector('div').addEventListener('click', (e) => {
      e.stopPropagation();
      t.done = !t.done;
      save('sms', state.smsList);
      renderTodos();
      renderSummary();
    });
    list.appendChild(el);
  });
}

function renderArchiveTabs(){
  const tabs = document.getElementById('archiveTabs');
  tabs.innerHTML = '';
  const items = [
    { key:'all', name:'全部' },
    ...Object.entries(CATEGORY).map(([k,v])=>({ key:k, name:v.name }))
  ];
  items.forEach(it => {
    const btn = document.createElement('div');
    btn.className = `chip cursor-pointer whitespace-nowrap ${state.archiveCat===it.key?'border-2 border-brand-600 text-brand-700 bg-transparent':'border-2 border-transparent text-gray-500 bg-gray-50'}`;
    btn.textContent = it.name;
    btn.addEventListener('click', () => { state.archiveCat = it.key; renderArchive(); });
    tabs.appendChild(btn);
  });
}

function renderArchive(){
  renderArchiveTabs();
  const list = document.getElementById('archiveList');
  list.innerHTML = '';
  const filtered = state.archiveCat==='all' ? state.archives : state.archives.filter(a => a.category===state.archiveCat);
  if(filtered.length===0){
    list.innerHTML = '<div class="text-center text-sm text-gray-400 py-10">暂无归档</div>';
    return;
  }
  filtered.forEach(a => {
    const c = CATEGORY[a.category];
    const p = PRIORITY[a.priority];
    const el = document.createElement('div');
    el.className = 'rounded-2xl bg-white p-3 shadow-sm';
    el.innerHTML = `
      <div class="flex items-center justify-between mb-1">
        <div class="flex items-center gap-2">
          <span class="text-base font-semibold text-gray-900">${a.sender}</span>
          <span class="chip ${c.cls}">${c.name}</span>
        </div>
        <span class="chip ${p.cls}">${p.name}</span>
      </div>
      <div class="text-sm text-gray-600 line-clamp-2">${a.snippet}</div>
      <div class="mt-2 text-sm text-gray-400">${a.time}</div>
      ${a.facts.length ? `<div class="mt-2 flex flex-wrap gap-1">${a.facts.map(f=>`<span class="text-sm bg-brand-50 text-brand-700 px-2 py-1 rounded">${f}</span>`).join('')}</div>`:''}
    `;
    list.appendChild(el);
  });
}

function renderSummary(){
  const todayTodos = state.todos.filter(t => !t.done);
  const urgent = todayTodos.filter(t=>t.priority==='urgent').length;
  const high = todayTodos.filter(t=>t.priority==='high').length;
  const mid = todayTodos.filter(t=>t.priority==='mid').length;

  const card = document.getElementById('summaryCard');
  card.innerHTML = `
    <div class="text-sm opacity-80">${new Date().toLocaleDateString('zh-CN',{month:'long',day:'numeric',weekday:'long'})}</div>
    <div class="mt-1 text-2xl font-bold">今天有 ${todayTodos.length} 件重要事项</div>
    <div class="mt-4 grid grid-cols-3 gap-2">
      <div class="rounded-xl bg-white/15 p-3 text-center">
        <div class="text-sm opacity-80">紧急</div>
        <div class="text-2xl font-bold">${urgent}</div>
      </div>
      <div class="rounded-xl bg-white/15 p-3 text-center">
        <div class="text-sm opacity-80">高</div>
        <div class="text-2xl font-bold">${high}</div>
      </div>
      <div class="rounded-xl bg-white/15 p-3 text-center">
        <div class="text-sm opacity-80">中</div>
        <div class="text-2xl font-bold">${mid}</div>
      </div>
    </div>
    <div class="mt-4 text-sm opacity-80">AI 已为您过滤 ${state.smsList.filter(s=>s.analysis.priority==='none').length} 条无效信息</div>
  `;

  const list = document.getElementById('summaryList');
  list.innerHTML = '';
  const byPrio = { urgent:[], high:[], mid:[], low:[] };
  todayTodos.forEach(t => { byPrio[t.priority] && byPrio[t.priority].push(t); });

  Object.keys(byPrio).forEach(p => {
    byPrio[p].forEach(t => {
      const c = CATEGORY[t.category];
      const el = document.createElement('div');
      el.className = 'rounded-2xl bg-white p-3 shadow-sm';
      el.innerHTML = `
        <div class="flex items-center gap-2 mb-1">
          <span class="chip ${PRIORITY[p].cls}">${PRIORITY[p].name}</span>
          <span class="chip ${c.cls}">${c.name}</span>
        </div>
        <div class="text-base text-gray-900 font-medium">${t.title}</div>
        <div class="text-sm text-gray-500 mt-1">创建于 ${t.createdAt}</div>
      `;
      list.appendChild(el);
    });
  });

  if(todayTodos.length===0){
    list.innerHTML = '<div class="rounded-2xl bg-white p-8 text-center text-sm text-gray-400">✓ 今日事项已全部处理完</div>';
  }
}

function renderKeywords(){
  const cfg = load('settings', settings);
  const list = document.getElementById('keywordList');
  list.innerHTML = '';
  cfg.strongKeywords.forEach(k => {
    const el = document.createElement('span');
    el.className = 'chip bg-urgent text-white';
    el.innerHTML = `${k} <span class="ml-1 opacity-70 cursor-pointer">✕</span>`;
    el.querySelector('span:last-child').addEventListener('click', () => {
      cfg.strongKeywords = cfg.strongKeywords.filter(x => x!==k);
      save('settings', cfg);
      renderKeywords();
    });
    list.appendChild(el);
  });
  const muteLabel = document.createElement('div');
  muteLabel.className = 'text-xs text-gray-500 mt-2 mb-1';
  muteLabel.textContent = '静默关键字（命中则不提醒，如广告、验证码）';
  list.appendChild(muteLabel);
  cfg.muteKeywords.forEach(k => {
    const el = document.createElement('span');
    el.className = 'chip bg-gray-100 text-gray-600';
    el.innerHTML = `${k} <span class="ml-1 opacity-70 cursor-pointer">✕</span>`;
    el.querySelector('span:last-child').addEventListener('click', () => {
      cfg.muteKeywords = cfg.muteKeywords.filter(x => x!==k);
      save('settings', cfg);
      renderKeywords();
    });
    list.appendChild(el);
  });
}

function renderWhitelist(){
  const cfg = load('settings', settings);
  const list = document.getElementById('whitelist');
  list.innerHTML = '';
  if(cfg.whitelist.length===0){
    list.innerHTML = '<div class="text-xs text-gray-400">暂无白名单发送方</div>';
  }
  cfg.whitelist.forEach(w => {
    const el = document.createElement('div');
    el.className = 'flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50';
    el.innerHTML = `<span class="text-sm text-gray-800">${w}</span><span class="text-urgent text-sm cursor-pointer">移除</span>`;
    el.querySelector('span:last-child').addEventListener('click', () => {
      cfg.whitelist = cfg.whitelist.filter(x => x!==w);
      save('settings', cfg);
      renderWhitelist();
      renderWhitelistRecommend();
    });
    list.appendChild(el);
  });
}

function renderWhitelistRecommend(){
  const cfg = load('settings', settings);
  const list = document.getElementById('whitelistRecommend');
  list.innerHTML = '';
  const senders = [...new Set(state.smsList.map(s => s.sender))];
  const recommend = senders.filter(s => !cfg.whitelist.some(w => s.includes(w.trim())));
  if(recommend.length===0){
    list.innerHTML = '<div class="text-xs text-gray-400">所有发送方已添加到白名单</div>';
    return;
  }
  recommend.forEach(s => {
    const el = document.createElement('span');
    el.className = 'chip bg-brand-50 text-brand-700 cursor-pointer hover:bg-brand-100';
    el.textContent = s;
    el.addEventListener('click', () => {
      if(!cfg.whitelist.includes(s)){
        cfg.whitelist.push(s);
        save('settings', cfg);
        renderWhitelist();
        renderWhitelistRecommend();
      }
    });
    list.appendChild(el);
  });
}

// ======= 事件绑定 =======
function bindTabs(){
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => gotoPage('page-' + tab.dataset.tab));
  });
  // 返回按钮
  document.getElementById('backBtn').addEventListener('click', () => {
    if(state.currentPage==='page-keywords' || state.currentPage==='page-whitelist'){
      gotoPage('page-me');
    } else {
      gotoPage('page-inbox');
    }
  });

  // 顶部操作按钮
  document.getElementById('topAction').addEventListener('click', () => {
    if(state.currentPage==='page-inbox'){
      openManualScan();
    }
  });
}

function bindSettings(){
  document.querySelectorAll('[data-goto]').forEach(el => {
    el.addEventListener('click', () => gotoPage(el.dataset.goto));
  });
  document.getElementById('manualScanBtn').addEventListener('click', openManualScan);
  document.getElementById('aboutBtn').addEventListener('click', () => {
    document.getElementById('aboutModal').classList.add('active');
  });
  document.getElementById('aboutClose').addEventListener('click', () => {
    document.getElementById('aboutModal').classList.remove('active');
  });

  let addMode = 'strong';
  document.getElementById('addModeStrong').addEventListener('click', () => {
    addMode = 'strong';
    document.getElementById('addModeStrong').className = 'flex-1 px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-medium';
    document.getElementById('addModeMute').className = 'flex-1 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-medium';
  });
  document.getElementById('addModeMute').addEventListener('click', () => {
    addMode = 'mute';
    document.getElementById('addModeStrong').className = 'flex-1 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-medium';
    document.getElementById('addModeMute').className = 'flex-1 px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-medium';
  });
  document.getElementById('keywordAddBtn').addEventListener('click', () => {
    const input = document.getElementById('keywordInput');
    const v = input.value.trim();
    if(!v) return;
    const cfg = load('settings', settings);
    if(addMode === 'strong'){
      if(!cfg.strongKeywords.includes(v)) cfg.strongKeywords.push(v);
    }else{
      if(!cfg.muteKeywords.includes(v)) cfg.muteKeywords.push(v);
    }
    save('settings', cfg);
    input.value = '';
    renderKeywords();
  });

  document.getElementById('whitelistAddBtn').addEventListener('click', () => {
    const input = document.getElementById('whitelistInput');
    const v = input.value.trim();
    if(!v) return;
    const cfg = load('settings', settings);
    if(!cfg.whitelist.includes(v)) cfg.whitelist.push(v);
    save('settings', cfg);
    input.value = '';
    renderWhitelist();
    renderWhitelistRecommend();
  });
}

function bindRing(){
  document.getElementById('ringLater').addEventListener('click', () => {
    state.ringQueue.shift();
    closeRing(true);
  });
  document.getElementById('ringNow').addEventListener('click', () => {
    const ctx = state.ringQueue.shift();
    closeRing(false);
    if(ctx) openScanForSms(ctx);
  });
}

function bindScan(){
  document.getElementById('scanSkip').addEventListener('click', closeScan);
  document.getElementById('scanDoneBtn').addEventListener('click', closeScan);
}

function bindDetail(){
  document.getElementById('detailBack').addEventListener('click', () => gotoPage('page-inbox'));
  document.getElementById('detailAnalyze').addEventListener('click', () => {
    if(currentSmsDetail) openScanForSms(currentSmsDetail);
  });
}

function bindSearch(){
  const input = document.getElementById('searchInput');
  if(input){
    input.addEventListener('input', renderInbox);
  }
}

function bindBigFont(){
  const toggle = document.getElementById('bigFontToggle');
  if(toggle){
    const saved = load('bigFont', false);
    updateBigFont(saved);
    toggle.addEventListener('click', () => {
      const active = toggle.dataset.active === 'true';
      updateBigFont(!active);
    });
  }
}

function showGuideBubble(){
  const guide = document.getElementById('guideBubble');
  const close = document.getElementById('guideClose');
  if(guide && close){
    const shown = load('guideShown', false);
    if(!shown){
      guide.classList.remove('hidden');
    }
    close.addEventListener('click', () => {
      guide.classList.add('hidden');
      save('guideShown', true);
    });
  }
}

function updateBigFont(active){
  const toggle = document.getElementById('bigFontToggle');
  const frame = document.querySelector('.phone-frame');
  if(toggle){
    toggle.dataset.active = active;
    const knob = toggle.querySelector('div');
    if(active){
      toggle.classList.add('bg-brand-600');
      toggle.classList.remove('bg-gray-200');
      knob.style.transform = 'translateX(calc(100% + 4px))';
      frame.classList.add('big-font');
    } else {
      toggle.classList.remove('bg-brand-600');
      toggle.classList.add('bg-gray-200');
      knob.style.transform = 'translateX(0)';
      frame.classList.remove('big-font');
    }
    save('bigFont', active);
  }
}

function bindArchiveTabs(){ /* 已在 renderArchive 中绑定 */ }

// ======= 来电式强提醒 =======
function playRingQueue(){
  if(state.ringQueue.length===0){
    // demo 完了跳回收件箱
    return;
  }
  const sms = state.ringQueue[0];
  showRing(sms);
}

function showRing(sms){
  const r = document.getElementById('ringModal');
  document.getElementById('ringSender').textContent = sms.sender;
  document.getElementById('ringReason').textContent = '(' + sms.analysis.reason + ')';
  document.getElementById('ringSnippet').textContent = sms.content;
  const facts = (sms.facts||[]).map(f => '• ' + f).join('\n') || '（无关键信息）';
  document.getElementById('ringFacts').style.whiteSpace = 'pre-line';
  document.getElementById('ringFacts').textContent = facts;
  r.classList.add('active');
}

function closeRing(autoPlayNext){
  document.getElementById('ringModal').classList.remove('active');
  if(autoPlayNext !== false && state.ringQueue.length>0){
    setTimeout(playRingQueue, 2500);
  } else if(state.ringQueue.length===0){
    gotoPage('page-inbox');
  }
}

// ======= 短信详情页 =======
let currentSmsDetail = null;

function openSmsDetail(sms){
  currentSmsDetail = sms;
  const p = PRIORITY[sms.analysis.priority];
  const c = CATEGORY[sms.category];
  const content = document.getElementById('detailContent');
  content.innerHTML = `
    <div class="rounded-2xl bg-white p-4 shadow-sm">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-lg">${iconForSender(sms.sender)}</div>
          <div>
            <div class="text-base font-semibold text-gray-900">${sms.sender}</div>
            <div class="text-sm text-gray-400">${sms.time}</div>
          </div>
        </div>
        <span class="chip ${p.cls}">${p.name}</span>
      </div>
      <div class="flex items-center gap-2 mb-4">
        <span class="chip ${c.cls}">${c.name}</span>
        <span class="text-sm text-gray-500">${sms.analysis.reason}</span>
      </div>
      <div class="text-base text-gray-800 leading-relaxed whitespace-pre-wrap">${sms.content}</div>
      ${sms.facts.length ? `
      <div class="mt-4 pt-4 border-t border-gray-100">
        <div class="text-sm font-semibold text-gray-900 mb-2">关键信息</div>
        <div class="flex flex-wrap gap-2">
          ${sms.facts.map(f=>`<span class="text-sm bg-brand-50 text-brand-700 px-3 py-1.5 rounded-lg">${f}</span>`).join('')}
        </div>
      </div>`:''}
    </div>
  `;
  gotoPage('page-detail');
}

// ======= AI 扫描页 =======
function openScanForSms(sms){
  state.scanContext = { mode:'single', sms };
  renderScanSteps(sms);
  openScanOverlay();
}

function openManualScan(){
  state.scanContext = { mode:'manual' };
  renderScanSteps(null);
  openScanOverlay();
}

function renderScanSteps(sms){
  const c = document.getElementById('scanContent');
  c.innerHTML = '';
  const steps = sms ? [
    { icon:'📩', text:'收到新短信：'+sms.sender, delay:300 },
    { icon:'🔍', text:'AI 正在分析内容...', delay:900 },
    { icon:'📌', text:'识别类别：'+CATEGORY[sms.category].name, delay:1600 },
    { icon:'★', text:'重要性判定：'+PRIORITY[sms.analysis.priority].name+'（'+sms.analysis.reason+'）', delay:2300 },
    ...(sms.facts?[{ icon:'📝', text:'提取关键信息：'+sms.facts.join('、'), delay:3000 }]:[]),
    ...(sms.todo?[{ icon:'✓', text:'已生成待办：'+sms.todo, delay:3700 }]:[]),
    { icon:'✓', text:'分析完成', delay:4300 }
  ] : [
    { icon:'AI', text:'开始扫描全部短信...', delay:300 },
    { icon:'📈', text:'共 '+state.smsList.length+' 条短信待分析', delay:900 },
    { icon:'!', text:'识别 '+state.smsList.filter(s=>s.analysis.priority==='urgent').length+' 条紧急', delay:1600 },
    { icon:'★', text:'识别 '+state.smsList.filter(s=>s.analysis.priority==='high').length+' 条高优先级', delay:2200 },
    { icon:'📝', text:'生成 '+state.todos.filter(t=>!t.done).length+' 个待办事项', delay:2800 },
    { icon:'📁', text:'归档 '+state.smsList.filter(s=>s.analysis.priority!=='none').length+' 条有效信息', delay:3400 },
    { icon:'🗑', text:'过滤 '+state.smsList.filter(s=>s.analysis.priority==='none').length+' 条无效信息', delay:4000 },
    { icon:'✓', text:'扫描完成，共节省您约 10 分钟', delay:4700 }
  ];

  const maxDelay = Math.max(...steps.map(s=>s.delay));
  steps.forEach((st, idx) => {
    const el = document.createElement('div');
    el.className = 'flex items-center gap-2 opacity-0 transition-opacity duration-300';
    el.innerHTML = `<span class="text-base">${st.icon}</span><span>${st.text}</span>`;
    setTimeout(() => { el.style.opacity = '1'; c.appendChild(el); }, st.delay);
  });
  setTimeout(() => {
    document.getElementById('scanDoneBtn').classList.remove('hidden');
  }, maxDelay + 200);
}

function openScanOverlay(){
  document.getElementById('scanOverlay').classList.add('active');
}

function closeScan(){
  document.getElementById('scanOverlay').classList.remove('active');
  document.getElementById('scanDoneBtn').classList.add('hidden');
  renderAll();
  if(state.ringQueue.length>0){
    setTimeout(playRingQueue, 1000);
  }
}

// ======= 启动 =======
document.addEventListener('DOMContentLoaded', init);
