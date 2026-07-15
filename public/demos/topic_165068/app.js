/* ================================================================
   校园快递助手 Demo — 前端逻辑层
   ================================================================ */

let packages = [];
let helpTasks = [];
let currentHelpTab = 'available';

const STATION_COORDINATES = {
  '东区菜鸟驿站': { x: 100, y: 380 },
  '西区快递中心': { x: 400, y: 320 },
  '南门丰巢快递柜': { x: 250, y: 50 },
  '北门京东自提点': { x: 180, y: 500 },
  '图书馆快递柜': { x: 320, y: 180 },
};

const START_POINTS = {
  '学生宿舍': { x: 120, y: 230, label: '学生宿舍' },
  '教学楼': { x: 300, y: 280, label: '教学楼' },
  '图书馆': { x: 320, y: 180, label: '图书馆' },
  '食堂': { x: 220, y: 350, label: '食堂' },
};

let filterState = {
  status: 'all',
  keyword: '',
  locations: [],
  timeRange: 'all',
  sortBy: 'time',
};

let selectedPackageIds = [];

const DEMO_PACKAGES = [
  { id: 'p1', name: 'Apple iPhone 手机壳', company: '顺丰速运', tracking: 'SF1234567890', code: '1-2-3456', location: '东区菜鸟驿站', status: 'pending', addedAt: '2026-07-05 14:30', arrivedTimestamp: Date.now() - 8 * 3600 * 1000, timeline: [{ status: '【派送中】驿站已签收，请凭取件码取件', time: '07-06 09:12', location: '东区菜鸟驿站' }, { status: '已到达目的地城市', time: '07-06 06:30', location: '北京转运中心' }, { status: '运输中', time: '07-05 18:20', location: '上海中转场' }, { status: '已揽收', time: '07-05 10:15', location: '上海市浦东新区' }] },
  { id: 'p2', name: '考试复习资料', company: '京东物流', tracking: 'JD9876543210', code: '2-5-8891', location: '北门京东自提点', status: 'pending', addedAt: '2026-07-04 20:15', arrivedTimestamp: Date.now() - 32 * 3600 * 1000, timeline: [{ status: '【派送中】已到达京东自提点，请尽快取件', time: '07-06 08:00', location: '北门京东自提点' }, { status: '派送中', time: '07-06 07:00', location: '北京海淀配送站' }, { status: '运输中', time: '07-05 22:00', location: '北京大兴分拣中心' }, { status: '商品已出库', time: '07-04 20:15', location: '京东华南仓' }] },
  { id: 'p3', name: '夏季短袖 T 恤', company: '中通快递', tracking: 'ZT202607051234', code: '', location: '西区快递中心', status: 'transit', addedAt: '2026-07-05 16:20', arrivedTimestamp: Date.now() - 5 * 3600 * 1000, timeline: [{ status: '运输中', time: '07-06 10:00', location: '北京转运中心' }, { status: '已揽收', time: '07-05 16:20', location: '广州市白云区' }] },
  { id: 'p4', name: '《算法导论》学习用书', company: '圆通速递', tracking: 'YT202606015678', code: '3-1-0021', location: '图书馆快递柜', status: 'done', addedAt: '2026-07-03 11:00', arrivedTimestamp: Date.now() - 3 * 24 * 3600 * 1000, timeline: [{ status: '✔ 已签收', time: '07-05 15:30', location: '图书馆快递柜' }, { status: '【派送中】凭 3-1-0021 取件', time: '07-05 09:12', location: '图书馆快递柜' }, { status: '运输中', time: '07-04 20:00', location: '北京转运中心' }] },
  { id: 'p5', name: '运动跑鞋', company: '韵达快递', tracking: 'YD202607067890', code: '4-3-5521', location: '南门丰巢快递柜', status: 'pending', addedAt: '2026-07-06 08:00', arrivedTimestamp: Date.now() - 1 * 3600 * 1000, timeline: [{ status: '【派送中】请凭取件码 4-3-5521 取件', time: '07-06 08:00', location: '南门丰巢快递柜' }, { status: '派送中', time: '07-06 06:00', location: '北京配送站' }, { status: '已揽收', time: '07-05 14:00', location: '浙江省杭州市' }] },
  { id: 'p6', name: '无线蓝牙耳机', company: '顺丰速运', tracking: 'SF9876543210', code: '', location: '东区菜鸟驿站', status: 'transit', addedAt: '2026-07-06 10:00', arrivedTimestamp: Date.now(), timeline: [{ status: '运输中', time: '07-06 10:00', location: '上海转运中心' }, { status: '已揽收', time: '07-06 09:00', location: '上海市闵行区' }] },
  { id: 'p7', name: '考研英语真题试卷', company: '中通快递', tracking: 'ZT202607078765', code: '5-2-1134', location: '图书馆快递柜', status: 'pending', addedAt: '2026-07-06 09:00', arrivedTimestamp: Date.now() - 2 * 3600 * 1000, timeline: [{ status: '【派送中】已到达图书馆快递柜，请凭取件码取件', time: '07-06 09:00', location: '图书馆快递柜' }, { status: '派送中', time: '07-06 08:00', location: '北京配送站' }, { status: '运输中', time: '07-05 20:00', location: '北京转运中心' }] },
  { id: 'p8', name: '笔记本电脑充电器', company: '极兔速递', tracking: 'JT202607081234', code: '', location: '西区快递中心', status: 'transit', addedAt: '2026-07-06 11:00', arrivedTimestamp: Date.now() - 30 * 60 * 1000, timeline: [{ status: '运输中', time: '07-06 11:00', location: '北京转运中心' }, { status: '已揽收', time: '07-06 10:00', location: '深圳龙华区' }] },
  { id: 'p9', name: '篮球运动鞋', company: '顺丰速运', tracking: 'SF202607095678', code: '6-4-7788', location: '南门丰巢快递柜', status: 'pending', addedAt: '2026-07-06 07:00', arrivedTimestamp: Date.now() - 4 * 3600 * 1000, timeline: [{ status: '【派送中】请凭取件码 6-4-7788 取件', time: '07-06 07:00', location: '南门丰巢快递柜' }, { status: '派送中', time: '07-06 06:00', location: '北京配送站' }, { status: '运输中', time: '07-05 22:00', location: '北京转运中心' }] },
  { id: 'p10', name: '教材《高等数学》', company: '邮政EMS', tracking: 'EMS202607109876', code: '', location: '北门京东自提点', status: 'done', addedAt: '2026-07-02 14:00', arrivedTimestamp: Date.now() - 4 * 24 * 3600 * 1000, timeline: [{ status: '✔ 已签收', time: '07-04 16:00', location: '北门京东自提点' }, { status: '【派送中】已到达自提点', time: '07-04 10:00', location: '北门京东自提点' }, { status: '运输中', time: '07-03 20:00', location: '北京转运中心' }] },
  { id: 'p11', name: '零食大礼包', company: '圆通速递', tracking: 'YT202607113456', code: '7-1-2245', location: '东区菜鸟驿站', status: 'pending', addedAt: '2026-07-06 10:30', arrivedTimestamp: Date.now() - 30 * 60 * 1000, timeline: [{ status: '【派送中】已到达东区驿站，请凭取件码取件', time: '07-06 10:30', location: '东区菜鸟驿站' }, { status: '派送中', time: '07-06 09:30', location: '北京配送站' }, { status: '运输中', time: '07-05 23:00', location: '北京转运中心' }] },
  { id: 'p12', name: '蓝牙耳机充电盒', company: '德邦快递', tracking: 'DB202607127890', code: '', location: '东区菜鸟驿站', status: 'transit', addedAt: '2026-07-06 12:00', arrivedTimestamp: Date.now(), timeline: [{ status: '运输中', time: '07-06 12:00', location: '广州转运中心' }, { status: '已揽收', time: '07-06 11:00', location: '广州市天河区' }] },
];

const DEMO_TASKS = [
  { id: 't1', user: '李同学', avatar: '李', location: '东区菜鸟驿站', code: '1-2-3456', dest: '3 号宿舍楼楼下', tip: 3, note: '中等大小纸箱', time: '5 分钟前', status: 'open' },
  { id: 't2', user: '王同学', avatar: '王', location: '南门丰巢快递柜', code: '2-5-8891', dest: '图书馆 2 层自习区', tip: 2, note: '小包裹', time: '12 分钟前', status: 'open' },
  { id: 't3', user: '张同学', avatar: '张', location: '西区快递中心', code: '需扫码', dest: '5 号宿舍楼', tip: 5, note: '大件', time: '25 分钟前', status: 'open' },
  { id: 't4', user: '刘同学', avatar: '刘', location: '北门京东自提点', code: '3-1-0021', dest: '教学楼 A 栋', tip: 2, note: '书籍', time: '35 分钟前', status: 'open' },
  { id: 't5', user: '陈同学', avatar: '陈', location: '东区菜鸟驿站', code: '4-3-5521', dest: '食堂门口', tip: 4, note: '零食包裹', time: '45 分钟前', status: 'open' },
  { id: 't6', user: '赵同学', avatar: '赵', location: '图书馆快递柜', code: '5-2-1134', dest: '宿舍楼下', tip: 1, note: '试卷', time: '1 小时前', status: 'open' },
];

function switchTab(tabName) {
  document.querySelectorAll('.tab-item').forEach(tab => tab.classList.toggle('active', tab.dataset.tab === tabName));
  document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
  document.getElementById('page-' + tabName).classList.add('active');
  
  const qrBtnBar = document.getElementById('qr-btn-bar');
  qrBtnBar.style.display = tabName === 'home' ? 'block' : 'none';

  if (tabName === 'home') renderPackages();
  if (tabName === 'track') renderTrackList();
  if (tabName === 'help') renderHelpList();
  if (tabName === 'map') renderStationList();
  
  document.querySelector('.pages').scrollTop = 0;
}

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('filter-tab')) {
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    e.target.classList.add('active');
    filterState.status = e.target.dataset.filter;
    renderPackages();
  }
  
  if (e.target.classList.contains('help-tab')) {
    document.querySelectorAll('.help-tab').forEach(t => t.classList.remove('active'));
    e.target.classList.add('active');
    currentHelpTab = e.target.dataset.helptab;
    document.getElementById('panel-available').style.display = currentHelpTab === 'available' ? 'block' : 'none';
    document.getElementById('panel-publish').style.display = currentHelpTab === 'publish' ? 'block' : 'none';
  }
});

document.addEventListener('input', (e) => {
  if (e.target.id === 'search-input') {
    filterState.keyword = e.target.value.trim();
    renderPackages();
  }
});

function saveLocalData() {
  try {
    localStorage.setItem('kd_packages', JSON.stringify(packages));
    localStorage.setItem('kd_tasks', JSON.stringify(helpTasks));
  } catch (e) { }
}

function renderPackages() {
  const list = document.getElementById('package-list');
  const empty = document.getElementById('empty-state');
  const chipsContainer = document.getElementById('filter-chips');

  let filtered = [...packages];

  if (filterState.status !== 'all') {
    filtered = filtered.filter(p => p.status === filterState.status);
  }

  if (filterState.keyword) {
    const k = filterState.keyword.toLowerCase();
    filtered = filtered.filter(p =>
      (p.name || '').toLowerCase().includes(k) ||
      (p.tracking || '').toLowerCase().includes(k) ||
      (p.location || '').toLowerCase().includes(k) ||
      (p.company || '').toLowerCase().includes(k) ||
      (p.code || '').toLowerCase().includes(k)
    );
  }

  if (filterState.locations.length > 0) {
    filtered = filtered.filter(p => filterState.locations.includes(p.location));
  }

  const now = Date.now();
  if (filterState.timeRange === 'today') {
    filtered = filtered.filter(p => p.arrivedTimestamp && (now - p.arrivedTimestamp) < 24 * 3600 * 1000);
  } else if (filterState.timeRange === '3days') {
    filtered = filtered.filter(p => p.arrivedTimestamp && (now - p.arrivedTimestamp) < 3 * 24 * 3600 * 1000);
  } else if (filterState.timeRange === '7days') {
    filtered = filtered.filter(p => p.arrivedTimestamp && (now - p.arrivedTimestamp) < 7 * 24 * 3600 * 1000);
  } else if (filterState.timeRange === 'overdue') {
    filtered = filtered.filter(p => p.arrivedTimestamp && (now - p.arrivedTimestamp) > 7 * 24 * 3600 * 1000);
  }

  const sortOrder = { pending: 0, transit: 1, done: 2 };
  if (filterState.sortBy === 'status') {
    filtered.sort((a, b) => sortOrder[a.status] - sortOrder[b.status]);
  } else if (filterState.sortBy === 'time') {
    filtered.sort((a, b) => (b.arrivedTimestamp || 0) - (a.arrivedTimestamp || 0));
  } else if (filterState.sortBy === 'location') {
    filtered.sort((a, b) => a.location.localeCompare(b.location));
  }

  const stats = {
    pending: packages.filter(p => p.status === 'pending').length,
    transit: packages.filter(p => p.status === 'transit').length,
    done: packages.filter(p => p.status === 'done').length,
  };
  document.getElementById('stat-pending').textContent = stats.pending;
  document.getElementById('stat-transit').textContent = stats.transit;
  document.getElementById('stat-done').textContent = stats.done;
  document.getElementById('pending-count').textContent = stats.pending;
  document.getElementById('pending-text').textContent = `共 ${filtered.length} 件`;

  let chipsHTML = '';
  if (filterState.timeRange !== 'all') {
    const timeLabels = { today: '今日', '3days': '近3天', '7days': '近一周', overdue: '超过7天' };
    chipsHTML += `<span class="filter-chip">${timeLabels[filterState.timeRange]} <span class="chip-remove" onclick="filterState.timeRange='all';renderPackages();">&times;</span></span>`;
  }
  if (filterState.locations.length > 0) {
    chipsHTML += filterState.locations.map(loc => 
      `<span class="filter-chip">${loc} <span class="chip-remove" onclick="filterState.locations=filterState.locations.filter(l=>l!=='${loc}');renderPackages();">&times;</span></span>`
    ).join('');
  }
  if (filterState.keyword) {
    chipsHTML += `<span class="filter-chip">搜索: ${filterState.keyword} <span class="chip-remove" onclick="filterState.keyword='';document.getElementById('search-input').value='';renderPackages();">&times;</span></span>`;
  }
  if (chipsHTML) {
    chipsHTML += `<span class="filter-chip clear-btn" onclick="clearAllFilters()">清除全部</span>`;
  }
  chipsContainer.innerHTML = chipsHTML;

  if (filtered.length === 0) {
    list.innerHTML = '';
    empty.style.display = 'block';
    updateFloatingBar();
    return;
  }
  empty.style.display = 'none';

  list.innerHTML = filtered.map(p => packageCardHTML(p)).join('');
  updateFloatingBar();
}

function clearAllFilters() {
  filterState = { status: 'all', keyword: '', locations: [], timeRange: 'all', sortBy: 'time' };
  document.getElementById('search-input').value = '';
  document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
  document.querySelector('.filter-tab[data-filter="all"]').classList.add('active');
  renderPackages();
}

function packageCardHTML(p) {
  const statusText = { pending: '待取件', transit: '运输中', done: '已取件' }[p.status];
  const statusClass = 'status-' + p.status;
  const hasCode = p.code && p.code.trim() !== '';
  const isSelected = selectedPackageIds.includes(p.id);
  const isOverdue = p.arrivedTimestamp && (Date.now() - p.arrivedTimestamp) > 7 * 24 * 3600 * 1000;

  return `
    <div class="package-card ${isSelected ? 'selected' : ''}" onclick="showDetail('${p.id}')">
      <div class="pkg-checkbox" onclick="event.stopPropagation();toggleSelect('${p.id}')">
        <div class="checkbox-inner ${isSelected ? 'checked' : ''}">${isSelected ? '✓' : ''}</div>
      </div>
      <div class="package-header">
        <div>
          <div class="package-title">${escapeHtml(p.name)}</div>
          <div class="package-company">${escapeHtml(p.company)} · ${escapeHtml(p.tracking)}</div>
        </div>
        <div class="package-status ${statusClass}">${statusText}</div>
      </div>
      <div class="package-code-box ${hasCode ? '' : 'no-code'}">
        <div class="code-label">${hasCode ? '取件码' : '暂未获取取件码'}</div>
        <div class="code-value ${hasCode ? '' : 'no-code'}">${hasCode ? escapeHtml(p.code) : '等待快递到达后生成'}</div>
      </div>
      <div class="package-footer">
        <div class="package-location">📍 ${escapeHtml(p.location)}${isOverdue ? ' <span class="overdue-tag">⚠️ 超7天</span>' : ''}</div>
        <div class="package-actions">
          ${p.status === 'pending' ? `<button class="btn-success small" onclick="event.stopPropagation();markAsDone('${p.id}')">已取件</button>` : ''}
          <button class="btn-ghost" onclick="event.stopPropagation();deletePackage('${p.id}')">删除</button>
        </div>
      </div>
    </div>
  `;
}

function toggleSelect(id) {
  const idx = selectedPackageIds.indexOf(id);
  if (idx >= 0) {
    selectedPackageIds.splice(idx, 1);
  } else {
    selectedPackageIds.push(id);
  }
  renderPackages();
}

function selectAllVisible() {
  const visiblePackages = packages.filter(p => {
    if (filterState.status !== 'all' && p.status !== filterState.status) return false;
    if (filterState.keyword) {
      const k = filterState.keyword.toLowerCase();
      if (!p.name.toLowerCase().includes(k) && !p.tracking.toLowerCase().includes(k) && !p.location.toLowerCase().includes(k)) return false;
    }
    if (filterState.locations.length > 0 && !filterState.locations.includes(p.location)) return false;
    return true;
  });
  selectedPackageIds = visiblePackages.map(p => p.id);
  renderPackages();
}

function updateFloatingBar() {
  const bar = document.getElementById('floating-bar');
  if (selectedPackageIds.length > 0) {
    bar.style.display = 'flex';
    document.getElementById('selected-count').textContent = selectedPackageIds.length;
  } else {
    bar.style.display = 'none';
  }
}

function clearSelection() {
  selectedPackageIds = [];
  renderPackages();
}

function markAsDone(id) {
  const p = packages.find(x => x.id === id);
  if (p) {
    p.status = 'done';
    if (!p.timeline) p.timeline = [];
    p.timeline.unshift({ status: '✔ 已签收', time: getNow(), location: p.location });
    saveLocalData();
    renderPackages();
    showToast('🎉 已标记为已取件');
  }
}

function deletePackage(id) {
  if (!confirm('确定删除这条快递记录吗？')) return;
  packages = packages.filter(p => p.id !== id);
  saveLocalData();
  renderPackages();
  renderTrackList();
  showToast('已删除');
}

function showDetail(id) {
  const p = packages.find(x => x.id === id);
  if (!p) return;

  const timelineHTML = (p.timeline || []).map(t => `
    <div class="track-item">
      <div class="track-status-text">${escapeHtml(t.status)}</div>
      <div class="track-location">${escapeHtml(t.location || '')}</div>
      <div class="track-time">${escapeHtml(t.time || '')}</div>
    </div>
  `).join('');

  const hasCode = p.code && p.code.trim() !== '';

  document.getElementById('detail-body').innerHTML = `
    <div class="detail-big-code">
      <div class="label">${hasCode ? '取件码' : '暂无取件码'}</div>
      <div class="${hasCode ? 'big-code' : 'no-code'}">${hasCode ? escapeHtml(p.code) : '等待快递到达后生成'}</div>
    </div>
    <div class="detail-info-row"><div class="info-label">商品名称</div><div class="info-value">${escapeHtml(p.name)}</div></div>
    <div class="detail-info-row"><div class="info-label">快递公司</div><div class="info-value">${escapeHtml(p.company)}</div></div>
    <div class="detail-info-row"><div class="info-label">快递单号</div><div class="info-value">${escapeHtml(p.tracking)}</div></div>
    <div class="detail-info-row"><div class="info-label">取件地点</div><div class="info-value">${escapeHtml(p.location)}</div></div>
    <div class="detail-info-row"><div class="info-label">添加时间</div><div class="info-value">${escapeHtml(p.addedAt)}</div></div>
    <div style="margin-top:18px;font-size:13px;font-weight:600;color:#333;">📋 物流动态</div>
    <div class="track-timeline" style="margin-top:10px;">${timelineHTML || '<div style="color:#aaa;font-size:12px;">暂无物流信息</div>'}</div>
    <div class="detail-actions">
      ${p.status === 'pending' ? `<button class="btn-success" onclick="markAsDone('${p.id}');closeModal('detail-modal');">✅ 已取件</button>` : ''}
      <button class="btn-outline" onclick="deletePackage('${p.id}');closeModal('detail-modal');">删除</button>
    </div>
  `;
  document.getElementById('detail-modal').classList.add('active');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

function smartParse() {
  const text = document.getElementById('smart-input').value.trim();
  if (!text) { showToast('请先输入内容'); return; }

  let trackingNo = '';
  const trackingMatch = text.match(/\b([A-Z]{2,4}\d{10,18}|\d{10,18})\b/);
  if (trackingMatch) trackingNo = trackingMatch[1];

  let code = '';
  const codePattern1 = text.match(/(\d{1,3}[\-]\d{1,3}[\-]\d{2,6})/);
  const codePattern2 = text.match(/取件码[：:\s]*([\d\-]+)/);
  const codePattern3 = text.match(/凭[：:\s]*([\d\-]+)/);
  if (codePattern1) code = codePattern1[1];
  else if (codePattern2) code = codePattern2[1];
  else if (codePattern3) code = codePattern3[1];

  const companies = ['顺丰', '京东', '圆通', '中通', '韵达', '申通', '百世', '邮政', '极兔', '德邦', 'EMS'];
  let company = '其他';
  for (const c of companies) {
    if (text.includes(c)) {
      company = c === '顺丰' ? '顺丰速运' : c === '京东' ? '京东物流' : c === '圆通' ? '圆通速递' : c === '中通' ? '中通快递' : c === '韵达' ? '韵达快递' : c === '申通' ? '申通快递' : c === '百世' ? '百世快递' : c === '邮政' ? '邮政EMS' : c === '极兔' ? '极兔速递' : c === '德邦' ? '德邦快递' : c === 'EMS' ? '邮政EMS' : '其他';
      break;
    }
  }

  if (!trackingNo && text.length <= 20 && /^[A-Za-z0-9]+$/.test(text.replace(/\s/g, ''))) {
    trackingNo = text;
  }

  const locKeywords = ['东区', '西区', '南门', '北门', '图书馆', '宿舍', '菜鸟', '丰巢', '京东', '驿站'];
  let location = '东区菜鸟驿站';
  for (const loc of locKeywords) {
    if (text.includes(loc)) {
      location = text.includes('东区') ? '东区菜鸟驿站' : text.includes('西区') ? '西区快递中心' : text.includes('南门') ? '南门丰巢快递柜' : text.includes('北门') ? '北门京东自提点' : text.includes('图书馆') ? '图书馆快递柜' : text.includes('宿舍') ? '学生宿舍 1 号柜' : '东区菜鸟驿站';
      break;
    }
  }

  const now = Date.now();
  const newPkg = {
    id: 'p' + Date.now(),
    name: '新快递包裹',
    company: company,
    tracking: trackingNo || '未提供',
    code: code || '',
    location: location,
    status: code ? 'pending' : 'transit',
    addedAt: getNow(),
    arrivedTimestamp: now,
    timeline: code
      ? [
          { status: '【派送中】已到达驿站，请凭取件码取件', time: getNow(), location: location },
          { status: '运输中', time: getOffsetTime(-1), location: '北京转运中心' },
          { status: '已揽收', time: getOffsetTime(-2), location: '商家仓库' },
        ]
      : [
          { status: '运输中', time: getNow(), location: '北京转运中心' },
          { status: '已揽收', time: getOffsetTime(-1), location: '商家仓库' },
        ]
  };

  packages.unshift(newPkg);
  saveLocalData();
  document.getElementById('smart-input').value = '';
  showToast(code ? '🎉 识别成功！' : '✅ 已添加，等待取件码');
  switchTab('home');
}

function manualAdd() {
  const name = document.getElementById('f-name').value.trim();
  const company = document.getElementById('f-company').value;
  const tracking = document.getElementById('f-tracking').value.trim();
  const code = document.getElementById('f-code').value.trim();
  const location = document.getElementById('f-location').value;

  if (!name) { showToast('请填写商品名称'); return; }
  if (!company) { showToast('请选择快递公司'); return; }
  if (!tracking) { showToast('请输入快递单号'); return; }
  if (!location) { showToast('请选择取件地点'); return; }

  const now = Date.now();
  const newPkg = {
    id: 'p' + Date.now(),
    name: name,
    company: company,
    tracking: tracking,
    code: code,
    location: location,
    status: code ? 'pending' : 'transit',
    addedAt: getNow(),
    arrivedTimestamp: now,
    timeline: code
      ? [
          { status: '【派送中】已到达驿站，请凭取件码取件', time: getNow(), location: location },
          { status: '运输中', time: getOffsetTime(-1), location: '北京转运中心' },
          { status: '已揽收', time: getOffsetTime(-2), location: '商家仓库' },
        ]
      : [
          { status: '运输中', time: getNow(), location: '北京转运中心' },
          { status: '已揽收', time: getOffsetTime(-1), location: '商家仓库' },
        ]
  };

  packages.unshift(newPkg);
  saveLocalData();

  document.getElementById('f-name').value = '';
  document.getElementById('f-company').value = '';
  document.getElementById('f-tracking').value = '';
  document.getElementById('f-code').value = '';
  document.getElementById('f-location').value = '';

  showToast('✅ 添加成功');
  switchTab('home');
}

function renderTrackList() {
  const list = document.getElementById('track-list');
  const empty = document.getElementById('track-empty');

  if (packages.length === 0) {
    list.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  const sorted = [...packages].sort((a, b) => {
    const order = { pending: 0, transit: 1, done: 2 };
    return order[a.status] - order[b.status];
  });

  list.innerHTML = sorted.map(p => {
    const timelineHTML = (p.timeline || []).map(t => `
      <div class="track-item">
        <div class="track-status-text">${escapeHtml(t.status)}</div>
        <div class="track-location">${escapeHtml(t.location || '')}</div>
        <div class="track-time">${escapeHtml(t.time || '')}</div>
      </div>
    `).join('');

    return `
      <div class="track-card">
        <div class="track-card-header">
          <div>
            <div class="track-title">${escapeHtml(p.name)}</div>
            <div class="track-company">${escapeHtml(p.company)} · ${escapeHtml(p.tracking)}</div>
          </div>
          <div class="package-status status-${p.status}">${p.status === 'pending' ? '待取件' : p.status === 'transit' ? '运输中' : '已取件'}</div>
        </div>
        <div class="track-timeline">${timelineHTML}</div>
      </div>
    `;
  }).join('');
}

function renderStationList() {
  const stations = [
    { name: '东区菜鸟驿站', detail: '营业时间 8:30-21:30' },
    { name: '西区快递中心', detail: '营业时间 9:00-22:00' },
    { name: '南门丰巢快递柜', detail: '24 小时自助' },
    { name: '北门京东自提点', detail: '营业时间 10:00-21:00' },
    { name: '图书馆快递柜', detail: '营业时间 7:00-22:30' },
  ];

  document.getElementById('station-list').innerHTML = stations.map(s => `
    <div class="station-item">
      <div class="station-info">
        <div class="station-name">${s.name}</div>
        <div class="station-detail">${s.detail}</div>
      </div>
      <button class="btn-outline small" onclick="showToast('已为你打开导航 → ${s.name}')">🧭 导航</button>
    </div>
  `).join('');
}

function renderHelpList() {
  const list = document.getElementById('help-list');

  if (helpTasks.length === 0) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">📭</div><div class="empty-text">暂无代取任务</div></div>`;
    return;
  }

  list.innerHTML = helpTasks.filter(t => t.status === 'open').map(t => `
    <div class="help-item">
      <div class="help-item-header">
        <div class="help-user">
          <div class="avatar">${escapeHtml(t.avatar)}</div>
          <div class="help-username">${escapeHtml(t.user)}</div>
        </div>
        <div class="help-tip">${t.tip > 0 ? '¥' + t.tip : '免费'}</div>
      </div>
      <div class="help-detail">
        <div><b>取件地点：</b>${escapeHtml(t.location)}</div>
        <div><b>取件码：</b>${escapeHtml(t.code)}</div>
        <div><b>送达：</b>${escapeHtml(t.dest)}</div>
        ${t.note ? `<div><b>备注：</b>${escapeHtml(t.note)}</div>` : ''}
      </div>
      <div class="help-item-footer">
        <div class="help-time">${escapeHtml(t.time)}</div>
        <button class="btn-success small" onclick="acceptTask('${t.id}')">🤝 我来帮 TA</button>
      </div>
    </div>
  `).join('');
}

function acceptTask(id) {
  const t = helpTasks.find(x => x.id === id);
  if (!t) return;
  t.status = 'taken';
  saveLocalData();
  renderHelpList();
  showToast('🎉 接单成功！');
}

function publishHelp() {
  const location = document.getElementById('h-location').value;
  const code = document.getElementById('h-code').value.trim();
  const dest = document.getElementById('h-dest').value.trim();
  const tip = parseFloat(document.getElementById('h-tip').value) || 0;
  const note = document.getElementById('h-note').value.trim();

  if (!location) { showToast('请选择取件地点'); return; }
  if (!code) { showToast('请填写取件码'); return; }
  if (!dest) { showToast('请填写送达地点'); return; }

  const task = {
    id: 't' + Date.now(),
    user: '我',
    avatar: '我',
    location: location,
    code: code,
    dest: dest,
    tip: tip,
    note: note,
    time: '刚刚',
    status: 'open'
  };

  helpTasks.unshift(task);
  saveLocalData();

  document.getElementById('h-location').value = '';
  document.getElementById('h-code').value = '';
  document.getElementById('h-dest').value = '';
  document.getElementById('h-tip').value = '2';
  document.getElementById('h-note').value = '';

  showToast('📢 任务发布成功！');
  document.querySelectorAll('.help-tab').forEach(t => t.classList.remove('active'));
  document.querySelector('.help-tab[data-helptab="available"]').classList.add('active');
  currentHelpTab = 'available';
  document.getElementById('panel-available').style.display = 'block';
  document.getElementById('panel-publish').style.display = 'none';
  renderHelpList();
}

function getDistance(loc1, loc2) {
  return Math.sqrt(Math.pow(loc1.x - loc2.x, 2) + Math.pow(loc1.y - loc2.y, 2));
}

function estimateWalkTime(distance) {
  return Math.max(1, Math.round(distance / 80));
}

function planRoute(selectedIds, startKey = '学生宿舍', roundTrip = true) {
  const startPoint = START_POINTS[startKey] || START_POINTS['学生宿舍'];
  const selectedPackages = packages.filter(p => selectedIds.includes(p.id));
  
  if (selectedPackages.length === 0) {
    return { steps: [], totalDistance: 0, totalWalkMin: 0, savingsPercent: 0 };
  }

  const packagesByLocation = {};
  selectedPackages.forEach(p => {
    if (!packagesByLocation[p.location]) {
      packagesByLocation[p.location] = [];
    }
    packagesByLocation[p.location].push(p);
  });

  const locations = Object.keys(packagesByLocation);
  const unvisited = [...locations];
  const route = [];
  let currentLoc = startPoint;

  while (unvisited.length > 0) {
    let nearest = null;
    let minDist = Infinity;
    for (const loc of unvisited) {
      const coord = STATION_COORDINATES[loc];
      if (!coord) continue;
      const dist = getDistance(currentLoc, coord);
      if (dist < minDist) {
        minDist = dist;
        nearest = loc;
      }
    }
    if (nearest) {
      const coord = STATION_COORDINATES[nearest];
      route.push({
        stationKey: nearest,
        packages: packagesByLocation[nearest],
        distance: Math.round(minDist),
        walkMin: estimateWalkTime(minDist),
        coord: coord
      });
      unvisited.splice(unvisited.indexOf(nearest), 1);
      currentLoc = coord;
    } else {
      break;
    }
  }

  if (roundTrip && route.length > 0) {
    const lastCoord = route[route.length - 1].coord;
    const distToStart = getDistance(lastCoord, startPoint);
    route.push({
      stationKey: startKey,
      packages: [],
      distance: Math.round(distToStart),
      walkMin: estimateWalkTime(distToStart),
      isReturn: true
    });
  }

  const totalDistance = route.reduce((sum, step) => sum + step.distance, 0);
  const totalWalkMin = route.reduce((sum, step) => sum + step.walkMin, 0);

  let randomAvgDist = 0;
  for (let i = 0; i < 50; i++) {
    const shuffled = [...locations].sort(() => Math.random() - 0.5);
    let dist = 0;
    let curr = startPoint;
    for (const loc of shuffled) {
      const coord = STATION_COORDINATES[loc];
      if (coord) {
        dist += getDistance(curr, coord);
        curr = coord;
      }
    }
    if (roundTrip) {
      dist += getDistance(curr, startPoint);
    }
    randomAvgDist += dist;
  }
  randomAvgDist /= 50;
  
  const savingsPercent = randomAvgDist > 0 ? Math.round((randomAvgDist - totalDistance) / randomAvgDist * 100) : 0;

  return {
    steps: route,
    totalDistance,
    totalWalkMin,
    savingsPercent,
    startPoint: startKey,
    roundTrip
  };
}

function openFilterModal() {
  const modal = document.getElementById('filter-modal');
  const content = document.getElementById('filter-content');
  
  const locationOptions = [
    { key: '东区菜鸟驿站', label: '东区菜鸟驿站' },
    { key: '西区快递中心', label: '西区快递中心' },
    { key: '南门丰巢快递柜', label: '南门丰巢快递柜' },
    { key: '北门京东自提点', label: '北门京东自提点' },
    { key: '图书馆快递柜', label: '图书馆快递柜' },
  ];
  
  const timeOptions = [
    { key: 'all', label: '全部时间' },
    { key: 'today', label: '今日到达' },
    { key: '3days', label: '近3天' },
    { key: '7days', label: '近一周' },
    { key: 'overdue', label: '超过7天' },
  ];
  
  const sortOptions = [
    { key: 'time', label: '按时间排序' },
    { key: 'status', label: '按状态排序' },
    { key: 'location', label: '按地点排序' },
  ];
  
  content.innerHTML = `
    <div class="filter-section">
      <div class="filter-section-title">📍 取件地点</div>
      <div class="filter-options">
        ${locationOptions.map(loc => `
          <label class="filter-checkbox">
            <input type="checkbox" ${filterState.locations.includes(loc.key) ? 'checked' : ''} onchange="toggleLocationFilter('${loc.key}', this.checked)">
            <span>${loc.label}</span>
          </label>
        `).join('')}
      </div>
    </div>
    <div class="filter-section">
      <div class="filter-section-title">📅 到达时间</div>
      <div class="filter-options">
        ${timeOptions.map(time => `
          <label class="filter-radio">
            <input type="radio" name="filter-time" value="${time.key}" ${filterState.timeRange === time.key ? 'checked' : ''} onchange="filterState.timeRange=this.value">
            <span>${time.label}</span>
          </label>
        `).join('')}
      </div>
    </div>
    <div class="filter-section">
      <div class="filter-section-title">↕️ 排序方式</div>
      <div class="filter-options">
        ${sortOptions.map(sort => `
          <label class="filter-radio">
            <input type="radio" name="filter-sort" value="${sort.key}" ${filterState.sortBy === sort.key ? 'checked' : ''} onchange="filterState.sortBy=this.value">
            <span>${sort.label}</span>
          </label>
        `).join('')}
      </div>
    </div>
    <div class="filter-actions">
      <button class="btn-outline" onclick="closeModal('filter-modal')">取消</button>
      <button class="btn-success" onclick="applyFilter()">✓ 应用筛选</button>
    </div>
  `;
  
  modal.classList.add('active');
}

function toggleLocationFilter(key, checked) {
  if (checked) {
    filterState.locations.push(key);
  } else {
    filterState.locations = filterState.locations.filter(l => l !== key);
  }
}

function applyFilter() {
  closeModal('filter-modal');
  renderPackages();
  showToast('✅ 筛选条件已应用');
}

function openRouteModal() {
  if (selectedPackageIds.length === 0) {
    showToast('请先选择要取的快递');
    return;
  }
  
  const modal = document.getElementById('route-modal');
  const content = document.getElementById('route-content');
  
  const startOptions = Object.keys(START_POINTS).map(key => `
    <label class="radio-label">
      <input type="radio" name="start-point" value="${key}" ${key === '学生宿舍' ? 'checked' : ''}>
      <span>${START_POINTS[key].label}</span>
    </label>
  `).join('');
  
  content.innerHTML = `
    <div class="route-section">
      <div class="route-title">📦 已选择 ${selectedPackageIds.length} 个快递</div>
      <div class="selected-packages">
        ${packages.filter(p => selectedPackageIds.includes(p.id)).map(p => `
          <div class="selected-item">
            <span>${escapeHtml(p.name)}</span>
            <span class="item-location">@ ${escapeHtml(p.location)}</span>
          </div>
        `).join('')}
      </div>
    </div>
    <div class="route-section">
      <div class="route-title">🚶 出发位置</div>
      <div class="radio-group">${startOptions}</div>
    </div>
    <div class="route-section">
      <div class="route-title">🔄 返回方式</div>
      <div class="radio-group">
        <label class="radio-label">
          <input type="radio" name="round-trip" value="true" checked>
          <span>闭环（回到出发点）</span>
        </label>
        <label class="radio-label">
          <input type="radio" name="round-trip" value="false">
          <span>单程（终点在最后一站）</span>
        </label>
      </div>
    </div>
    <button class="btn-primary full" onclick="generateRoute()">✨ 生成最优路线</button>
  `;
  
  modal.classList.add('active');
}

function generateRoute() {
  const startKey = document.querySelector('input[name="start-point"]:checked').value;
  const roundTrip = document.querySelector('input[name="round-trip"]:checked').value === 'true';
  
  const content = document.getElementById('route-content');
  content.innerHTML = `<div class="loading">🤖 AI 正在规划最优路线...</div>`;
  
  setTimeout(() => {
    const result = planRoute(selectedPackageIds, startKey, roundTrip);
    
    if (result.steps.length === 0) {
      content.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-text">无法规划路线</div></div>`;
      return;
    }
    
    const stepsHTML = result.steps.map((step, idx) => {
      if (step.isReturn) {
        return `
          <div class="route-step return-step">
            <div class="step-num">${idx + 1}</div>
            <div class="step-content">
              <div class="step-title">🔙 返回 ${result.startPoint}</div>
              <div class="step-info">距离：${step.distance} 米 · 步行约 ${step.walkMin} 分钟</div>
            </div>
          </div>
        `;
      }
      return `
        <div class="route-step">
          <div class="step-num">${idx + 1}</div>
          <div class="step-content">
            <div class="step-title">📍 ${step.stationKey}</div>
            <div class="step-info">距离：${step.distance} 米 · 步行约 ${step.walkMin} 分钟</div>
            <div class="step-packages">
              ${step.packages.map(p => `
                <div class="pkg-item">
                  <span class="pkg-name">${escapeHtml(p.name)}</span>
                  ${p.code ? `<span class="pkg-code">取件码: ${escapeHtml(p.code)}</span>` : ''}
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    }).join('');
    
    content.innerHTML = `
      <div class="route-result">
        <div class="result-summary">
          <div class="summary-item">
            <div class="summary-value">${result.totalDistance}</div>
            <div class="summary-label">总距离（米）</div>
          </div>
          <div class="summary-divider"></div>
          <div class="summary-item">
            <div class="summary-value">${result.totalWalkMin}</div>
            <div class="summary-label">预计步行（分钟）</div>
          </div>
          <div class="summary-divider"></div>
          <div class="summary-item">
            <div class="summary-value">${result.savingsPercent}%</div>
            <div class="summary-label">节省路程</div>
          </div>
        </div>
        <div class="route-title">🎯 推荐路线</div>
        <div class="route-steps">${stepsHTML}</div>
      </div>
      <div class="route-actions">
        <button class="btn-outline" onclick="closeModal('route-modal');clearSelection()">取消</button>
        <button class="btn-success" onclick="showToast('路线已保存！')">💾 保存路线</button>
      </div>
    `;
  }, 800);
}

let reminderSettings = {
  arrival: true,
  overdue: true,
  scheduled: true,
  scheduledTime: '18:00',
  smart: true
};

function initReminderSystem() {
  try {
    const saved = localStorage.getItem('kd_reminderSettings');
    if (saved) reminderSettings = JSON.parse(saved);
  } catch (e) { }
}

function openReminderModal() {
  const modal = document.getElementById('reminder-modal');
  const content = document.getElementById('reminder-content');
  
  content.innerHTML = `
    <div class="reminder-section">
      <label class="checkbox-label">
        <input type="checkbox" ${reminderSettings.arrival ? 'checked' : ''} onchange="reminderSettings.arrival=this.checked">
        <span>到达新快递时应用内通知</span>
      </label>
    </div>
    <div class="reminder-section">
      <label class="checkbox-label">
        <input type="checkbox" ${reminderSettings.overdue ? 'checked' : ''} onchange="reminderSettings.overdue=this.checked">
        <span>临近超时提醒（超过 24 小时）</span>
      </label>
    </div>
    <div class="reminder-section">
      <label class="checkbox-label">
        <input type="checkbox" ${reminderSettings.scheduled ? 'checked' : ''} onchange="reminderSettings.scheduled=this.checked">
        <span>每日定时提醒</span>
      </label>
      <div class="time-picker">
        <input type="time" value="${reminderSettings.scheduledTime}" onchange="reminderSettings.scheduledTime=this.value" ${reminderSettings.scheduled ? '' : 'disabled'}>
      </div>
    </div>
    <div class="reminder-section">
      <label class="checkbox-label">
        <input type="checkbox" ${reminderSettings.smart ? 'checked' : ''} onchange="reminderSettings.smart=this.checked">
        <span>出门提醒（选择路线后提醒）</span>
      </label>
    </div>
    <div class="reminder-actions">
      <button class="btn-outline" onclick="closeModal('reminder-modal')">取消</button>
      <button class="btn-success" onclick="saveReminderSettings()">💾 保存设置</button>
    </div>
  `;
  
  modal.classList.add('active');
}

function saveReminderSettings() {
  localStorage.setItem('kd_reminderSettings', JSON.stringify(reminderSettings));
  closeModal('reminder-modal');
  showToast('✅ 提醒设置已保存');
}

function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}

function getNow() {
  const d = new Date();
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function getOffsetTime(hours) {
  const d = new Date(Date.now() + hours * 3600 * 1000);
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function pad(n) { return n < 10 ? '0' + n : String(n); }

let toastTimer = null;
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

function loadDemo() {
  packages = JSON.parse(JSON.stringify(DEMO_PACKAGES));
  helpTasks = JSON.parse(JSON.stringify(DEMO_TASKS));
  localStorage.removeItem('kd_packages');
  localStorage.removeItem('kd_tasks');
  saveLocalData();
  renderPackages();
  renderTrackList();
  renderHelpList();
  showToast('✅ 演示数据已加载，共 ' + packages.length + ' 个快递');
}

function generateQRCode() {
  const part1 = Math.floor(Math.random() * 9000) + 1000;
  const part2 = Math.floor(Math.random() * 9000) + 1000;
  return `${part1}-${part2}`;
}

function loadQRCode() {
  let code = localStorage.getItem('kd_qrCode');
  if (!code) {
    code = generateQRCode();
    localStorage.setItem('kd_qrCode', code);
  }
  document.getElementById('qr-id').textContent = code;
}

function openQRModal() {
  const modal = document.getElementById('qr-modal');
  const content = document.getElementById('qr-modal-content');
  const code = document.getElementById('qr-id').textContent;
  
  content.innerHTML = `
    <div class="qr-modal-body">
      <div class="qr-modal-qr" id="qr-modal-code"></div>
      <div class="qr-modal-id">${code}</div>
      <div class="qr-modal-tip">取件时出示此二维码或号码</div>
      <button class="btn-primary full" onclick="copyQRCode()">📋 复制号码</button>
    </div>
  `;
  
  renderQRCodeToElement(code, document.getElementById('qr-modal-code'));
  modal.classList.add('active');
}

function copyQRCode() {
  const code = document.getElementById('qr-id').textContent;
  navigator.clipboard.writeText(code).then(() => {
    showToast('✅ 取件码已复制');
  }).catch(() => {
    showToast('复制失败，请手动复制');
  });
}

function renderQRCodeToElement(code, container) {
  container.innerHTML = '';
  
  const size = 160;
  const cells = 21;
  const cellSize = size / cells;
  
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = '#000';
  
  for (let i = 0; i < cells; i++) {
    for (let j = 0; j < cells; j++) {
      const charIndex = (i * cells + j) % code.length;
      const hash = code.charCodeAt(charIndex);
      const isBlack = (hash * (i + 1) * (j + 1)) % 2 === 0;
      
      if (isBlack) {
        ctx.fillRect(j * cellSize, i * cellSize, cellSize - 0.5, cellSize - 0.5);
      }
    }
  }
  
  container.appendChild(canvas);
}

// ---------- 初始化 ----------
packages = JSON.parse(JSON.stringify(DEMO_PACKAGES));
helpTasks = JSON.parse(JSON.stringify(DEMO_TASKS));
saveLocalData();
initReminderSystem();
loadQRCode();
renderPackages();
renderStationList();
renderHelpList();
renderTrackList();