// ================================================================
// QualiFlow — Shared Application Logic v3.1
// 制造质量智能管理平台 — 前端原型 + API 抽象层
//
// 架构说明：
//   当前为前端交互原型，所有数据通过 MockAPI 提供。
//   生产部署时，将 MockAPI 的 BASE_URL 指向真实后端，
//   并启用 WebSocket 实时推送，无需修改页面逻辑。
//
//   后端技术栈建议：
//   - REST API: Node.js (Express) / Python (FastAPI) / Java (Spring Boot)
//   - 实时推送: WebSocket / MQTT (对接 SCADA/PLC)
//   - 数据库:   MySQL / PostgreSQL + Redis 缓存
//   - 部署:     Docker / Kubernetes，支持私有化交付
// ================================================================

// ========== 配置 ==========
const CONFIG = {
  // 前端原型模式：使用内置 Mock 数据
  // 生产部署：改为真实 API 地址，如 'https://api.qualiflow.com/v1'
  API_BASE_URL: 'mock://api/v1',
  WS_URL: null,  // 生产部署：'wss://ws.qualiflow.com/realtime'
  DATA_REFRESH_INTERVAL: 5000,  // 数据刷新间隔（ms）
  ALERT_INTERVAL: 12000,       // 告警推送间隔（ms）
  IS_DEMO_MODE: true,           // 演示模式标识
};

// ========== API 抽象层 ==========
// 当前使用 Mock 数据，生产环境替换为真实 fetch 调用
const MockAPI = {
  // 获取产线实时状态
  // 生产环境: GET /api/v1/lines/status
  getLineStatus: function() {
    return {
      A: { output: 1247, target: 1500, fpy: 97.3, oee: 86.5, status: 'running' },
      B: { output: 980, target: 1200, fpy: 96.8, oee: 82.1, status: 'running' },
      C: { output: 1102, target: 1300, fpy: 98.1, oee: 88.2, status: 'running' },
      D: { output: 0, target: 1000, fpy: 0, oee: 0, status: 'stopped' },
    };
  },

  // 获取设备列表
  // 生产环境: GET /api/v1/equipment
  getEquipment: function() {
    return [
      { id: 'ICT-A', name: 'ICT测试仪 A', status: 'running', oee: 87.3 },
      { id: 'ICT-B', name: 'ICT测试仪 B', status: 'running', oee: 84.6 },
      { id: 'FCT-01', name: '功能测试台 01', status: 'running', oee: 91.2 },
      { id: 'FCT-02', name: '功能测试台 02', status: 'maintenance', oee: 0 },
      { id: 'HALT-01', name: 'HALT 加速寿命测试箱', status: 'running', oee: 78.5 },
      { id: 'VIB-02', name: '振动台 02', status: 'error', oee: 0 },
    ];
  },

  // 获取测试队列
  // 生产环境: GET /api/v1/tests/queue
  getTestQueue: function() {
    return [
      { id: 'TS-0712-003', sample: 'PCB-2087', type: 'FCT', status: 'in_progress', progress: 55 },
      { id: 'TS-0712-008', sample: 'PCB-2092', type: 'ICT', status: 'queued', progress: 0 },
      { id: 'TS-0712-015', sample: 'Module-B-Rev.A', type: 'HALT', status: 'in_progress', progress: 30 },
    ];
  },

  // 获取质量 KPI
  // 生产环境: GET /api/v1/quality/kpi
  getQualityKPI: function() {
    return {
      fpy: 97.3,       // First Pass Yield
      cpk: 1.42,       // Process Capability Index
      defectRate: 2.7, // 不良率 %
      faiRate: 98.5,   // 首件合格率 %
    };
  },

  // 获取安灯记录
  // 生产环境: GET /api/v1/andon/recent
  getAndonRecords: function() {
    return [
      { time: '14:32', line: '产线D', issue: '设备异常停机', status: 'resolved', responseTime: '3:42' },
      { time: '13:15', line: '产线B', issue: '物料短缺预警', status: 'resolved', responseTime: '4:58' },
      { time: '11:08', line: '产线A', issue: '首件不合格', status: 'resolved', responseTime: '2:15' },
    ];
  },

  // 获取停机分析
  // 生产环境: GET /api/v1/downtime/analysis
  getDowntimeAnalysis: function() {
    return [
      { reason: '设备故障', minutes: 42, percent: 45 },
      { reason: '换线换型', minutes: 23, percent: 25 },
      { reason: '物料等待', minutes: 14, percent: 15 },
      { reason: '品质异常', minutes: 9, percent: 10 },
      { reason: '人员缺岗', minutes: 5, percent: 5 },
    ];
  },

  // 获取 COQ 质量成本
  // 生产环境: GET /api/v1/quality/coq
  getCOQ: function() {
    return {
      prevention: 42.5,    // 预防成本 (¥K)
      appraisal: 68.3,     // 鉴定成本 (¥K)
      internalFailure: 75.6,  // 内部故障 (¥K)
      externalFailure: 50.2,  // 外部故障 (¥K)
      total: 236.6,
      salesRatio: 2.1,     // 占销售额比例 %
    };
  },
};

// ========== 真实 API 调用层（生产环境启用） ==========
const RealAPI = {
  async request(endpoint, options = {}) {
    const url = `${CONFIG.API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    return response.json();
  },

  getLineStatus: function() {
    return this.request('/lines/status');
  },
  getEquipment: function() {
    return this.request('/equipment');
  },
  getTestQueue: function() {
    return this.request('/tests/queue');
  },
  getQualityKPI: function() {
    return this.request('/quality/kpi');
  },
  getAndonRecords: function() {
    return this.request('/andon/recent');
  },
  getDowntimeAnalysis: function() {
    return this.request('/downtime/analysis');
  },
  getCOQ: function() {
    return this.request('/quality/coq');
  },
};

// ========== 统一 API 入口 ==========
// 演示模式使用 MockAPI，生产模式使用 RealAPI
const API = CONFIG.IS_DEMO_MODE ? MockAPI : RealAPI;

// ========== Navigation HTML ==========
const NAV_HTML = `
<aside class="sidebar" id="sidebar">
  <div class="sidebar-header" onclick="window.location.href='index.html'">
    <div class="sidebar-logo">QF</div>
    <div class="sidebar-brand">QualiFlow<span>制造质量智能管理平台</span></div>
  </div>
  <nav class="sidebar-nav">
    <div class="nav-section-label">概览</div>
    <a href="index.html" class="nav-item" data-page="home">
      <span class="nav-icon">&#9636;</span> 首页总览
    </a>
    <a href="dashboard.html" class="nav-item" data-page="dashboard">
      <span class="nav-icon">&#9632;</span> 实时监控
    </a>

    <div class="nav-section-label">生产管理</div>
    <a href="test-management.html" class="nav-item" data-page="test-management">
      <span class="nav-icon">&#9776;</span> 测试管理
      <span class="nav-badge green">142</span>
    </a>
    <a href="equipment.html" class="nav-item" data-page="equipment">
      <span class="nav-icon">&#9881;</span> 设备管理
      <span class="nav-badge">1</span>
    </a>

    <div class="nav-section-label">质量分析</div>
    <a href="quality.html" class="nav-item" data-page="quality">
      <span class="nav-icon">&#9650;</span> 质量分析
    </a>

    <div class="nav-section-label">系统</div>
    <a href="methodology.html" class="nav-item" data-page="methodology">
      <span class="nav-icon">&#9733;</span> 管理方法论
    </a>
    <a href="reports.html" class="nav-item" data-page="reports">
      <span class="nav-icon">&#9776;</span> 报告中心
    </a>
  </nav>
  <div class="sidebar-footer">
    <div class="sidebar-status">
      <span class="status-dot"></span> ${CONFIG.IS_DEMO_MODE ? 'DEMO MODE' : 'SYSTEM ONLINE'}
    </div>
    <span class="sidebar-version">v3.1</span>
  </div>
</aside>

<button class="sidebar-toggle" id="sidebarToggle" onclick="document.getElementById('sidebar').classList.toggle('open')">
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
</button>

<div class="bg-gradient-mesh"></div>
<div class="bg-grid"></div>

<div class="toast-container" id="toastContainer"></div>
`;

// ========== 班次管理 ==========
function getCurrentShift() {
  const h = new Date().getHours();
  if (h >= 8 && h < 20) return { name: '白班 A', code: 'A', time: '08:00 - 20:00' };
  return { name: '夜班 B', code: 'B', time: '20:00 - 08:00' };
}

// ========== 初始化 ==========
function initApp(activePage, breadcrumb) {
  document.body.insertAdjacentHTML('afterbegin', NAV_HTML);

  // 激活当前导航项
  const activeNav = document.querySelector(`.nav-item[data-page="${activePage}"]`);
  if (activeNav) activeNav.classList.add('active');

  // 实时时钟 + 班次标识
  function updateClock() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    const el = document.getElementById('headerTime');
    if (el) el.textContent = `${h}:${m}:${s}`;
    const shiftEl = document.getElementById('headerShift');
    if (shiftEl) {
      const shift = getCurrentShift();
      shiftEl.textContent = shift.name;
    }
  }
  updateClock();
  setInterval(updateClock, 1000);

  // 滚动渐入动画
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });
  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  // KPI 数字递增动画
  document.querySelectorAll('[data-target]').forEach(el => {
    const target = parseFloat(el.dataset.target);
    if (isNaN(target)) return;
    const suffix = el.dataset.suffix || '';
    const decimals = el.dataset.decimals ? parseInt(el.dataset.decimals) : (String(target).includes('.') ? 1 : 0);
    const startTime = performance.now();
    el.dataset.animating = 'true';

    function update(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / 1500, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = target * eased;
      el.textContent = current.toFixed(decimals) + suffix;
      if (progress < 1) { requestAnimationFrame(update); }
      else { delete el.dataset.animating; }
    }
    requestAnimationFrame(update);
  });
}

// ========== Toast 系统 ==========
function showToast(type, message) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = { critical: '\u26A0', warning: '\u26A0', info: '\u2139', success: '\u2713' };
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  toast.innerHTML = `
    <div class="toast-icon">${icons[type] || icons.info}</div>
    <div class="toast-content">
      <div class="toast-msg">${message}</div>
      <div class="toast-time">${timeStr}</div>
    </div>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

// ========== 视图切换 ==========
function initViewToggle(onChange) {
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const view = btn.dataset.view;
      if (onChange) onChange(view);
      showToast('info', `已切换至${view === 'production' ? '生产线' : '实验室'}视图`);
    });
  });
}

// ========== 安灯升级系统 ==========
// 生产环境：通过 WebSocket 推送至班组长/工程师终端
// 对接 PLC 数字量输入触发硬件安灯
function triggerAndon(line, issue) {
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  showToast('critical', `【安灯升级】${line} - ${issue}。已通知班组长、产线工程师。响应时限: 5分钟。`);
  // 生产环境：POST /api/v1/andon/trigger { line, issue }
  const feed = document.getElementById('andonFeed');
  if (feed) {
    const item = document.createElement('div');
    item.className = 'andon-item critical';
    item.innerHTML = `
      <div class="andon-time">${timeStr}</div>
      <div class="andon-line">${line}</div>
      <div class="andon-issue">${issue}</div>
      <div class="andon-status">
        <span class="badge red"><span class="mini-dot"></span> 待响应</span>
        <span class="andon-countdown" data-start="${Date.now()}">5:00</span>
      </div>`;
    feed.prepend(item);
    // 倒计时
    const cdEl = item.querySelector('.andon-countdown');
    const startTs = Date.now();
    const cdTimer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTs) / 1000);
      const remaining = 300 - elapsed;
      if (remaining <= 0) {
        cdEl.textContent = '已超时';
        cdEl.style.color = 'var(--red)';
        clearInterval(cdTimer);
      } else {
        const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
        const ss = String(remaining % 60).padStart(2, '0');
        cdEl.textContent = `${mm}:${ss}`;
        if (remaining < 120) cdEl.style.color = 'var(--red)';
      }
    }, 1000);
  }
}

// ========== 条码扫描 ==========
// 生产环境：对接串口/蓝牙扫码枪，通过 Web Serial API 或后端中转
function simulateScan(targetInputId) {
  const input = document.getElementById(targetInputId);
  if (!input) return;
  const samples = ['S-0712-003', 'S-0712-008', 'S-0712-015', 'S-0712-022', 'S-0712-031'];
  const sample = samples[Math.floor(Math.random() * samples.length)];
  input.value = sample;
  input.classList.add('scan-flash');
  setTimeout(() => input.classList.remove('scan-flash'), 600);
  showToast('success', `扫码成功: ${sample}`);
  // 生产环境：POST /api/v1/tests/register { sampleId: sample }
  return sample;
}

// ========== 模拟告警系统 ==========
// 生产环境：通过 WebSocket / MQTT 接收 SCADA/PLC 实时告警
const SIMULATED_ALERTS = [
  { type: 'warning', msg: 'TH-01 温度达 85.3°C，超出设定值 0.3°C，持续监测中。' },
  { type: 'info', msg: 'TS-0712-003 PCB-2087 功能测试进度 55%，预计 2 小时内完成。' },
  { type: 'critical', msg: 'VIB-02 振动台加速度偏差超限，已自动暂停。工程师已通知。' },
  { type: 'info', msg: '本周 FPY 达 97.3%，连续 7 天达标。自动生成周报中。' },
  { type: 'warning', msg: '夜班 B 在岗人数低于排班要求（缺 2 人），已通知班组长。' },
  { type: 'info', msg: 'ICT-A 完成全部排程任务，已切换至待机状态。' },
  { type: 'critical', msg: 'Module-B Rev.A HALT 测试第 2 阶段发现焊点开裂，已拍照取证。' },
  { type: 'warning', msg: 'ALT-01 校准进度 45%，预计提前 2 小时完成。' },
  { type: 'info', msg: '产线C 完成换线，Module-B Rev.A 首件已送检。' },
  { type: 'critical', msg: '产线D 设备 INJ-02 注塑机压力异常停机，已升级至设备主管。' }
];

let alertIndex = 0;
function startAlertSimulation() {
  if (CONFIG.IS_DEMO_MODE) {
    setTimeout(() => showToast('info', '演示模式已启动。数据为模拟生成，生产部署将通过 WebSocket 接收实时数据。'), 1500);
    setInterval(() => {
      if (alertIndex >= SIMULATED_ALERTS.length) alertIndex = 0;
      const alert = SIMULATED_ALERTS[alertIndex++];
      showToast(alert.type, alert.msg);
    }, CONFIG.ALERT_INTERVAL);
  }
  // 生产环境：启用 WebSocket 连接
  // const ws = new WebSocket(CONFIG.WS_URL);
  // ws.onmessage = (event) => { const alert = JSON.parse(event.data); showToast(alert.type, alert.msg); };
}
