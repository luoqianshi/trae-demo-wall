/* ============================================================
   车主车辆管理 - 应用逻辑
   纯原生 JS | LocalStorage 存储 | 单页应用
   ============================================================ */

'use strict';

/* ============================================================
   一、常量定义：行业基线数据 & 原厂保养标准
   ============================================================ */

// 燃油/电耗行业基线（L/100km 或 kWh/100km）
const FUEL_BASELINE = {
  compactFuel: 7.2,   // 紧凑型燃油车平均油耗 L/100km
  suvFuel: 8.8,        // SUV平均油耗
  sedanFuel: 7.5,      // 轿车平均油耗
  compactEV: 13.5,     // 紧凑型电车平均电耗 kWh/100km
  suvEV: 15.5,
  sedanEV: 14.0,
};

// 按车辆级别映射的基线（用于对比）
const VEHICLE_TYPE_BASELINE = {
  '紧凑型车': { fuel: 7.2, ev: 13.5 },
  'SUV': { fuel: 8.8, ev: 15.5 },
  '轿车': { fuel: 7.5, ev: 14.0 },
};

// 原厂保养周期标准
// category: core(核心必保) / noncore(非必要可拉长) / addon(增值服务-经济方案剔除)
const MAINTENANCE_STANDARD = [
  { id: 'oil', name: '机油+机滤', category: 'core', cycleKm: 5000, cycleMonths: 6, price: 450, essential: true, desc: '发动机润滑核心保养' },
  { id: 'airfilter', name: '空气滤芯', category: 'noncore', cycleKm: 10000, cycleMonths: 12, price: 120, essential: false, desc: '发动机进气过滤' },
  { id: 'acfilter', name: '空调滤芯', category: 'noncore', cycleKm: 10000, cycleMonths: 12, price: 150, essential: false, desc: '车内空气过滤' },
  { id: 'brakefluid', name: '刹车油', category: 'core', cycleKm: 40000, cycleMonths: 24, price: 280, essential: true, desc: '制动系统安全件' },
  { id: 'sparkplug', name: '火花塞', category: 'noncore', cycleKm: 40000, cycleMonths: 24, price: 380, essential: false, desc: '点火系统' },
  { id: 'coolant', name: '冷却液', category: 'noncore', cycleKm: 40000, cycleMonths: 24, price: 200, essential: false, desc: '散热系统' },
  { id: 'brakepad', name: '刹车片', category: 'core', cycleKm: 40000, cycleMonths: 24, price: 600, essential: true, desc: '制动安全件' },
  { id: 'tire', name: '轮胎换位', category: 'addon', cycleKm: 10000, cycleMonths: 12, price: 100, essential: false, desc: '增值服务' },
  { id: 'throttle', name: '节气门清洗', category: 'addon', cycleKm: 20000, cycleMonths: 12, price: 180, essential: false, desc: '增值服务' },
  { id: 'transmission', name: '变速箱油', category: 'noncore', cycleKm: 60000, cycleMonths: 36, price: 500, essential: false, desc: '传动系统' },
];

/* ============================================================
   二、LocalStorage 工具函数
   ============================================================ */

// 存储键命名空间
const STORAGE_KEYS = {
  vehicles: 'carApp_vehicles',
  refuelRecords: 'carApp_refuelRecords',
  maintenanceRecords: 'carApp_maintenanceRecords',
  repairRecords: 'carApp_repairRecords',
  washRecords: 'carApp_washRecords',
  parkingRecords: 'carApp_parkingRecords',
  tollRecords: 'carApp_tollRecords',
  violationRecords: 'carApp_violationRecords',
  currentVehicle: 'carApp_currentVehicle',
  initialized: 'carApp_initialized',
};

// 账单状态
let billType = 'month';
let billYear = new Date().getFullYear();
let billMonth = new Date().getMonth() + 1;

// 读取数据（带默认值，解析失败返回默认值）
function getData(key, defaultValue) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? defaultValue : JSON.parse(raw);
  } catch (e) {
    console.warn('getData 解析失败:', key, e);
    return defaultValue;
  }
}

// 写入数据
function setData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// 获取当前选中车辆ID
function getCurrentVehicle() {
  return getData(STORAGE_KEYS.currentVehicle, 'v1');
}

// 设置当前选中车辆
function setCurrentVehicle(id) {
  setData(STORAGE_KEYS.currentVehicle, id);
}

/* ============================================================
   三、模拟数据初始化（首次加载时写入）
   ============================================================ */

// 车辆列表
const SIM_VEHICLES = [
  { id: 'v1', brand: '丰田', model: '卡罗拉', year: 2022, type: 'fuel', level: '紧凑型车', fuelType: '汽油', plate: '粤B·8K2X9', mileage: 23790 },
  { id: 'v2', brand: '比亚迪', model: '海豚', year: 2023, type: 'newenergy', level: '紧凑型车', fuelType: '纯电', plate: '粤B·D3L77', mileage: 9000 },
];

// 加油/充电记录（v1 燃油 14条 + v2 纯电 5条）
const SIM_REFUEL_RECORDS = [
  { id: 'r1', vehicleId: 'v1', date: '2025-07-10', mileage: 15000, liters: 42.0, amount: 325.5, pricePerLiter: 7.75 },
  { id: 'r2', vehicleId: 'v1', date: '2025-08-07', mileage: 15680, liters: 47.5, amount: 368.1, pricePerLiter: 7.75 },
  { id: 'r3', vehicleId: 'v1', date: '2025-09-04', mileage: 16360, liters: 48.0, amount: 372.0, pricePerLiter: 7.75 },
  { id: 'r4', vehicleId: 'v1', date: '2025-09-28', mileage: 17030, liters: 47.2, amount: 365.8, pricePerLiter: 7.75 },
  { id: 'r5', vehicleId: 'v1', date: '2025-10-22', mileage: 17710, liters: 48.5, amount: 375.9, pricePerLiter: 7.75 },
  { id: 'r6', vehicleId: 'v1', date: '2025-11-15', mileage: 18380, liters: 47.0, amount: 364.3, pricePerLiter: 7.75 },
  { id: 'r7', vehicleId: 'v1', date: '2025-12-08', mileage: 19060, liters: 48.2, amount: 373.6, pricePerLiter: 7.75 },
  { id: 'r8', vehicleId: 'v1', date: '2026-01-05', mileage: 19730, liters: 47.5, amount: 368.1, pricePerLiter: 7.75 },
  { id: 'r9', vehicleId: 'v1', date: '2026-01-30', mileage: 20410, liters: 48.0, amount: 372.0, pricePerLiter: 7.75 },
  { id: 'r10', vehicleId: 'v1', date: '2026-02-27', mileage: 21080, liters: 47.3, amount: 366.6, pricePerLiter: 7.75 },
  { id: 'r11', vehicleId: 'v1', date: '2026-03-25', mileage: 21760, liters: 48.5, amount: 375.9, pricePerLiter: 7.75 },
  { id: 'r12', vehicleId: 'v1', date: '2026-04-20', mileage: 22430, liters: 47.2, amount: 365.8, pricePerLiter: 7.75 },
  { id: 'r13', vehicleId: 'v1', date: '2026-05-15', mileage: 23110, liters: 48.0, amount: 372.0, pricePerLiter: 7.75 },
  { id: 'r14', vehicleId: 'v1', date: '2026-06-12', mileage: 23790, liters: 47.5, amount: 368.1, pricePerLiter: 7.75 },
  // v2 纯电：liters 字段存 kWh，pricePerLiter 存 元/kWh
  { id: 'r15', vehicleId: 'v2', date: '2025-08-20', mileage: 5000, liters: 130.0, amount: 78.0, pricePerLiter: 0.60, energyType: 'electric' },
  { id: 'r16', vehicleId: 'v2', date: '2025-10-15', mileage: 6000, liters: 135.0, amount: 81.0, pricePerLiter: 0.60, energyType: 'electric' },
  { id: 'r17', vehicleId: 'v2', date: '2025-12-10', mileage: 7000, liters: 132.0, amount: 79.2, pricePerLiter: 0.60, energyType: 'electric' },
  { id: 'r18', vehicleId: 'v2', date: '2026-02-15', mileage: 8000, liters: 140.0, amount: 84.0, pricePerLiter: 0.60, energyType: 'electric' },
  { id: 'r19', vehicleId: 'v2', date: '2026-04-20', mileage: 9000, liters: 138.0, amount: 82.8, pricePerLiter: 0.60, energyType: 'electric' },
];

// 保养记录（v1）
const SIM_MAINTENANCE_RECORDS = [
  { id: 'm1', vehicleId: 'v1', date: '2025-07-10', mileage: 15000, project: '机油+机滤', amount: 450, shop: '丰田4S店' },
  { id: 'm2', vehicleId: 'v1', date: '2025-09-20', mileage: 17030, project: '空气滤芯', amount: 120, shop: '途虎养车' },
  { id: 'm3', vehicleId: 'v1', date: '2025-11-15', mileage: 18380, project: '空调滤芯', amount: 150, shop: '途虎养车' },
  { id: 'm4', vehicleId: 'v1', date: '2026-01-10', mileage: 19730, project: '机油+机滤', amount: 450, shop: '丰田4S店' },
  { id: 'm5', vehicleId: 'v1', date: '2026-03-05', mileage: 21760, project: '轮胎换位', amount: 100, shop: '途虎养车' },
  { id: 'm6', vehicleId: 'v1', date: '2026-05-20', mileage: 23110, project: '刹车油更换', amount: 280, shop: '丰田4S店' },
];

// 维修记录（v1）
const SIM_REPAIR_RECORDS = [
  { id: 'rp1', vehicleId: 'v1', date: '2026-02-10', mileage: 20800, project: '雨刮片更换', amount: 80, shop: '途虎养车' },
  { id: 'rp2', vehicleId: 'v1', date: '2026-04-05', mileage: 22200, project: '补胎', amount: 50, shop: '路边快修' },
];

// 洗车记录（v1）
const SIM_WASH_RECORDS = [
  { id: 'w1', vehicleId: 'v1', date: '2026-06-01', amount: 35, shop: '美车堂' },
  { id: 'w2', vehicleId: 'v1', date: '2026-05-01', amount: 35, shop: '美车堂' },
  { id: 'w3', vehicleId: 'v1', date: '2026-04-01', amount: 35, shop: '美车堂' },
];

// 停车记录（v1）
const SIM_PARKING_RECORDS = [
  { id: 'p1', vehicleId: 'v1', date: '2026-06-15', amount: 20, location: '万达广场地下车库', duration: '2小时30分' },
  { id: 'p2', vehicleId: 'v1', date: '2026-06-10', amount: 15, location: '公司停车场', duration: '8小时' },
  { id: 'p3', vehicleId: 'v1', date: '2026-05-28', amount: 45, location: '机场停车场', duration: '24小时' },
  { id: 'p4', vehicleId: 'v1', date: '2026-05-20', amount: 12, location: '商场停车场', duration: '1小时45分' },
  { id: 'p5', vehicleId: 'v1', date: '2026-04-15', amount: 25, location: '医院停车场', duration: '4小时' },
];

// 高速记录（v1）
const SIM_TOLL_RECORDS = [
  { id: 't1', vehicleId: 'v1', date: '2026-06-20', amount: 65, start: '北京', end: '天津', distance: '120km' },
  { id: 't2', vehicleId: 'v1', date: '2026-06-05', amount: 120, start: '北京', end: '石家庄', distance: '300km' },
  { id: 't3', vehicleId: 'v1', date: '2026-05-15', amount: 85, start: '北京', end: '唐山', distance: '180km' },
  { id: 't4', vehicleId: 'v1', date: '2026-05-01', amount: 240, start: '北京', end: '济南', distance: '450km' },
  { id: 't5', vehicleId: 'v1', date: '2026-04-10', amount: 55, start: '北京', end: '廊坊', distance: '60km' },
];

// 违章记录（v1）
const SIM_VIOLATION_RECORDS = [
  { id: 'v1', vehicleId: 'v1', date: '2026-06-18', amount: 200, fine: 200, points: 3, location: '北京市朝阳区建国路', reason: '闯红灯', status: 'unpaid' },
  { id: 'v2', vehicleId: 'v1', date: '2026-05-25', amount: 100, fine: 100, points: 0, location: '北京市海淀区中关村大街', reason: '违停', status: 'paid' },
  { id: 'v3', vehicleId: 'v1', date: '2026-04-12', amount: 150, fine: 150, points: 6, location: '北京市丰台区南四环', reason: '超速50%以下', status: 'paid' },
  { id: 'v4', vehicleId: 'v1', date: '2026-03-08', amount: 200, fine: 200, points: 3, location: '北京市西城区长安街', reason: '不按导向车道行驶', status: 'unpaid' },
];

// 首次加载初始化模拟数据
function initSimData() {
  if (getData(STORAGE_KEYS.initialized, false)) return;
  setData(STORAGE_KEYS.vehicles, SIM_VEHICLES);
  setData(STORAGE_KEYS.refuelRecords, SIM_REFUEL_RECORDS);
  setData(STORAGE_KEYS.maintenanceRecords, SIM_MAINTENANCE_RECORDS);
  setData(STORAGE_KEYS.repairRecords, SIM_REPAIR_RECORDS);
  setData(STORAGE_KEYS.washRecords, SIM_WASH_RECORDS);
  setData(STORAGE_KEYS.parkingRecords, SIM_PARKING_RECORDS);
  setData(STORAGE_KEYS.tollRecords, SIM_TOLL_RECORDS);
  setData(STORAGE_KEYS.violationRecords, SIM_VIOLATION_RECORDS);
  setData(STORAGE_KEYS.currentVehicle, 'v1');
  setData(STORAGE_KEYS.initialized, true);
}

/* ============================================================
   四、记录管理函数
   ============================================================ */

function getVehicles() {
  return getData(STORAGE_KEYS.vehicles, []);
}

function getVehicleById(id) {
  return getVehicles().find(v => v.id === id) || null;
}

// 获取某车辆加油记录（按日期升序）
function getRefuelRecords(vehicleId) {
  const all = getData(STORAGE_KEYS.refuelRecords, []);
  const list = vehicleId ? all.filter(r => r.vehicleId === vehicleId) : all;
  return list.sort((a, b) => a.date.localeCompare(b.date));
}

// 获取某车辆保养记录
function getMaintenanceRecords(vehicleId) {
  const all = getData(STORAGE_KEYS.maintenanceRecords, []);
  const list = vehicleId ? all.filter(r => r.vehicleId === vehicleId) : all;
  return list.sort((a, b) => b.date.localeCompare(a.date));
}

function getRepairRecords(vehicleId) {
  const all = getData(STORAGE_KEYS.repairRecords, []);
  return vehicleId ? all.filter(r => r.vehicleId === vehicleId) : all;
}

function getWashRecords(vehicleId) {
  const all = getData(STORAGE_KEYS.washRecords, []);
  return vehicleId ? all.filter(r => r.vehicleId === vehicleId) : all;
}

function getParkingRecords(vehicleId) {
  const all = getData(STORAGE_KEYS.parkingRecords, []);
  return vehicleId ? all.filter(r => r.vehicleId === vehicleId) : all;
}

function getTollRecords(vehicleId) {
  const all = getData(STORAGE_KEYS.tollRecords, []);
  return vehicleId ? all.filter(r => r.vehicleId === vehicleId) : all;
}

function getViolationRecords(vehicleId) {
  const all = getData(STORAGE_KEYS.violationRecords, []);
  return vehicleId ? all.filter(r => r.vehicleId === vehicleId) : all;
}

// 生成唯一ID
function genId(prefix) {
  return prefix + '_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
}

// 添加加油记录
function addRefuelRecord(record) {
  const all = getData(STORAGE_KEYS.refuelRecords, []);
  record.id = genId('r');
  all.push(record);
  setData(STORAGE_KEYS.refuelRecords, all);
  // 同步车辆里程
  updateVehicleMileage(record.vehicleId, record.mileage);
  return record;
}

// 添加保养记录
function addMaintenanceRecord(record) {
  const all = getData(STORAGE_KEYS.maintenanceRecords, []);
  record.id = genId('m');
  all.push(record);
  setData(STORAGE_KEYS.maintenanceRecords, all);
  updateVehicleMileage(record.vehicleId, record.mileage);
  return record;
}

// 同步更新车辆当前里程
function updateVehicleMileage(vehicleId, mileage) {
  const vehicles = getVehicles();
  const v = vehicles.find(x => x.id === vehicleId);
  if (v && (!v.mileage || mileage > v.mileage)) {
    v.mileage = mileage;
    setData(STORAGE_KEYS.vehicles, vehicles);
  }
}

/* ============================================================
   五、Tab 切换逻辑
   ============================================================ */

const TAB_PAGE_MAP = {
  home: 'page-home',
  service: 'page-service',
  bills: 'page-bills',
  ai: 'page-ai',
  mine: 'page-mine',
};

// 切换主Tab
function switchTab(tabName) {
  // 切换页面显示
  document.querySelectorAll('.page').forEach(p => p.classList.remove('page-active'));
  const page = document.getElementById(TAB_PAGE_MAP[tabName]);
  if (page) page.classList.add('page-active');

  // 切换底部Tab高亮
  document.querySelectorAll('.tabbar .tab').forEach(t => t.classList.remove('active'));
  const tabBtn = document.querySelector(`.tabbar .tab[data-tab="${tabName}"]`);
  if (tabBtn) tabBtn.classList.add('active');

  // 渲染对应页面（保证数据最新）
  switch (tabName) {
    case 'home': renderHome(); break;
    case 'service': renderService(); break;
    case 'bills': renderBills(); break;
    case 'ai': renderAI(); break;
    case 'mine': renderMine(); break;
  }

  // 滚动到顶部
  window.scrollTo(0, 0);
}

/* ============================================================
   六、页面渲染函数
   ============================================================ */

// 工具：格式化金额
function money(n) {
  return Number(n || 0).toFixed(2);
}

// 工具：HTML 转义
function esc(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ---------- 首页 ----------
function renderHome() {
  const vid = getCurrentVehicle();
  const vehicle = getVehicleById(vid) || getVehicles()[0];
  const userName = '车主';

  // 欢迎横幅
  document.getElementById('homeBanner').innerHTML = `
    <div class="welcome-greet">你好，${esc(userName)} 👋</div>
    <div class="welcome-title">${vehicle ? esc(vehicle.brand) + ' ' + esc(vehicle.model) : '未绑定车辆'}</div>
    <div class="welcome-sub">
      <span>📅 ${new Date().toLocaleDateString('zh-CN')}</span>
      <span>🚗 ${getRefuelRecords(vid).length} 次能源补给</span>
      <span>🔧 ${getMaintenanceRecords(vid).length} 次保养</span>
      ${vehicle ? `<button class="btn btn-primary btn-xs" data-action="maintManual">📖 保养手册</button>` : ''}
    </div>
  `;

  // 车辆信息卡
  if (vehicle) {
    const isEv = vehicle.type === 'newenergy';
    document.getElementById('homeVehicle').innerHTML = `
      <div class="vehicle-card">
        <div class="vehicle-avatar">${isEv ? '⚡' : '⛽'}</div>
        <div class="vehicle-info">
          <div class="vehicle-name">${esc(vehicle.brand)} ${esc(vehicle.model)}</div>
          <div class="vehicle-meta">${vehicle.year}款 · ${esc(vehicle.plate)}</div>
          <div class="vehicle-tags">
            <span class="tag ${isEv ? 'tag-ev' : ''}">${esc(vehicle.fuelType)}</span>
            <span class="tag">${esc(vehicle.level)}</span>
          </div>
        </div>
        <div class="vehicle-mileage">
          <div class="num">${(vehicle.mileage || 0).toLocaleString()}</div>
          <div class="unit">公里</div>
        </div>
      </div>
    `;

    // 同级对标
    const fuelData = getFuelCompareData();
    if (fuelData && isDataSufficient(fuelData.records)) {
      document.getElementById('homePeerBenchmark').innerHTML = renderPeerBenchmark(fuelData);
    } else {
      document.getElementById('homePeerBenchmark').innerHTML = `<div class="empty-tip">${isEv ? '充电' : '加油'}记录不足，无法进行同级对标</div>`;
    }
  } else {
    document.getElementById('homeVehicle').innerHTML = `<div class="empty-tip">尚未绑定车辆，请到「我的」添加</div>`;
    document.getElementById('homePeerBenchmark').innerHTML = '';
  }

  // 保养提醒
  renderHomeMaintReminder();

  // 快捷操作
  const quickActions = [
    { key: 'refuel', icon: '⛽', label: '加油' },
    { key: 'maintenance', icon: '🔧', label: '保养' },
    { key: 'repair', icon: '🛠', label: '维修' },
    { key: 'wash', icon: '🚿', label: '洗车' },
  ];
  document.getElementById('homeQuick').innerHTML = quickActions.map(a => `
    <div class="quick-item" data-action="${a.key}">
      <span class="quick-icon">${a.icon}</span>
      <span class="quick-label">${a.label}</span>
    </div>
  `).join('');

  // 保养方案对比
  if (vehicle) {
    renderMaintCompare('homeMaintCompare');
  } else {
    document.getElementById('homeMaintCompare').innerHTML = '';
  }

  // 最近记录（取最近5条，合并加油+保养+维修+洗车）
  const recent = buildAllRecords(vid)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);
  const recentBox = document.getElementById('homeRecent');
  if (recent.length === 0) {
    recentBox.innerHTML = `<div class="empty-tip">暂无记录</div>`;
  } else {
    recentBox.innerHTML = `<div class="record-list">${recent.map(renderRecordItem).join('')}</div>`;
  }
}

// 合并所有记录为统一结构（用于首页最近/账单台账）
function buildAllRecords(vehicleId) {
  const list = [];
  getRefuelRecords(vehicleId).forEach(r => {
    list.push({
      id: r.id, date: r.date, category: r.energyType === 'electric' ? '充电' : '加油',
      title: r.energyType === 'electric' ? '充电' : '加油',
      sub: `${r.mileage}km · ${r.liters}${r.energyType === 'electric' ? 'kWh' : 'L'}`,
      amount: r.amount, icon: r.energyType === 'electric' ? '⚡' : '⛽',
    });
  });
  getMaintenanceRecords(vehicleId).forEach(r => {
    list.push({
      id: r.id, date: r.date, category: '保养', title: r.project,
      sub: `${r.mileage}km · ${esc(r.shop)}`, amount: r.amount, icon: '🔧',
    });
  });
  getRepairRecords(vehicleId).forEach(r => {
    list.push({
      id: r.id, date: r.date, category: '维修', title: r.project,
      sub: `${r.mileage}km · ${esc(r.shop)}`, amount: r.amount, icon: '🛠',
    });
  });
  getWashRecords(vehicleId).forEach(r => {
    list.push({
      id: r.id, date: r.date, category: '洗车', title: '洗车',
      sub: esc(r.shop), amount: r.amount, icon: '🚿',
    });
  });
  getParkingRecords(vehicleId).forEach(r => {
    list.push({
      id: r.id, date: r.date, category: '停车', title: '停车',
      sub: `${esc(r.location)} · ${r.duration}`, amount: r.amount, icon: '🅿️',
    });
  });
  getTollRecords(vehicleId).forEach(r => {
    list.push({
      id: r.id, date: r.date, category: '高速', title: '高速通行',
      sub: `${r.start}→${r.end} · ${r.distance}`, amount: r.amount, icon: '🛣️',
    });
  });
  getViolationRecords(vehicleId).forEach(r => {
    list.push({
      id: r.id, date: r.date, category: '违章', title: r.reason,
      sub: `${esc(r.location)} · ${r.status === 'paid' ? '已缴' : '未缴'}`, 
      amount: r.amount, icon: '⚠️',
    });
  });
  return list;
}

// 渲染单条记录（首页/服务/账单通用）
function renderRecordItem(r) {
  return `
    <div class="record-item">
      <div class="record-icon">${r.icon}</div>
      <div class="record-main">
        <div class="record-title">${esc(r.title)}</div>
        <div class="record-sub">${r.date} · ${r.sub}</div>
      </div>
      <div class="record-amount minus">-¥${money(r.amount)}</div>
    </div>
  `;
}

// ---------- 服务 ----------
function renderService() {
  const vid = getCurrentVehicle();
  const refuelCount = getRefuelRecords(vid).length;
  const maintCount = getMaintenanceRecords(vid).length;
  const repairCount = getRepairRecords(vid).length;
  const parkingCount = getParkingRecords(vid).length;
  const tollCount = getTollRecords(vid).length;
  const violationCount = getViolationRecords(vid).length;

  // 服务入口
  const entries = [
    { key: 'refuel', icon: '⛽', title: '加油记录', desc: `共 ${refuelCount} 条记录`, btn: '添加' },
    { key: 'maintenance', icon: '🔧', title: '保养记录', desc: `共 ${maintCount} 条记录`, btn: '添加' },
    { key: 'repair', icon: '🛠', title: '维修记录', desc: `共 ${repairCount} 条记录`, btn: '查看' },
    { key: 'parking', icon: '🅿️', title: '停车记录', desc: `共 ${parkingCount} 条记录`, btn: '添加' },
    { key: 'toll', icon: '🛣️', title: '高速记录', desc: `共 ${tollCount} 条记录`, btn: '添加' },
    { key: 'violation', icon: '⚠️', title: '违章记录', desc: `共 ${violationCount} 条记录`, btn: '添加' },
  ];
  document.getElementById('serviceEntries').innerHTML = entries.map(e => `
    <div class="service-entry">
      <div class="service-entry-icon">${e.icon}</div>
      <div class="service-entry-info">
        <div class="service-entry-title">${e.title}</div>
        <div class="service-entry-desc">${e.desc}</div>
      </div>
      <button class="btn btn-primary btn-sm" data-action="${e.key}">${e.btn}</button>
    </div>
  `).join('');

  // 服务记录列表（全部，按日期倒序）
  const all = buildAllRecords(vid).sort((a, b) => b.date.localeCompare(a.date));
  const box = document.getElementById('serviceRecords');
  if (all.length === 0) {
    box.innerHTML = `<div class="empty-tip">暂无服务记录</div>`;
  } else {
    box.innerHTML = `<div class="record-list">${all.map(renderRecordItem).join('')}</div>`;
  }
}

/* ============ 保养提醒核心逻辑 ============ */

/**
 * 获取某保养项目最近一次保养记录
 * @param {string} projectName 保养项目名称
 * @param {Array} maintRecords 保养记录列表
 * @returns {Object|null} 最近记录
 */
function getLastMaintRecord(projectName, maintRecords) {
  const filtered = maintRecords.filter(r => r.project && r.project.includes(projectName));
  if (filtered.length === 0) return null;
  return filtered.sort((a, b) => b.date.localeCompare(a.date))[0];
}

/**
 * 判断保养项目是否需要提醒
 * @param {Object} std 保养标准项目
 * @param {Object} lastRecord 最近一次保养记录（null表示从未保养）
 * @param {number} currentMileage 当前车辆里程
 * @returns {Object} 提醒状态信息
 */
function checkMaintReminder(std, lastRecord, currentMileage) {
  const now = new Date();
  let lastMileage = 0;
  let lastDate = null;
  
  if (lastRecord) {
    lastMileage = lastRecord.mileage || 0;
    lastDate = new Date(lastRecord.date);
  } else {
    lastDate = new Date();
    lastDate.setFullYear(lastDate.getFullYear() - 1);
  }
  
  // 计算里程进度
  const kmSinceLast = currentMileage - lastMileage;
  const kmProgress = Math.min(100, (kmSinceLast / std.cycleKm) * 100);
  const kmRemaining = std.cycleKm - kmSinceLast;
  
  // 计算时间进度
  const monthsSinceLast = (now.getFullYear() - lastDate.getFullYear()) * 12 + 
                         (now.getMonth() - lastDate.getMonth());
  const timeProgress = Math.min(100, (monthsSinceLast / std.cycleMonths) * 100);
  const monthsRemaining = std.cycleMonths - monthsSinceLast;
  
  // 综合进度（取较大值）
  const progress = Math.max(kmProgress, timeProgress);
  
  // 判断状态
  let status = 'normal';
  let statusText = '';
  
  if (progress >= 100) {
    status = 'urgent';
    statusText = '已到期';
  } else if (progress >= 85) {
    status = 'warning';
    statusText = '即将到期';
  } else {
    status = 'normal';
    statusText = '正常';
  }
  
  return {
    id: std.id,
    name: std.name,
    desc: std.desc,
    category: std.category,
    cycleKm: std.cycleKm,
    cycleMonths: std.cycleMonths,
    lastMileage: lastMileage,
    lastDate: lastRecord ? lastRecord.date : '未保养',
    kmSinceLast: kmSinceLast,
    kmRemaining: kmRemaining > 0 ? kmRemaining : 0,
    monthsRemaining: monthsRemaining > 0 ? monthsRemaining : 0,
    progress: Math.round(progress),
    status: status,
    statusText: statusText,
    urgent: status === 'urgent',
  };
}

/**
 * 获取所有保养项目的提醒状态
 * @param {Object} vehicle 当前车辆
 * @returns {Array} 提醒状态列表
 */
function getMaintReminders(vehicle) {
  if (!vehicle) return [];
  const maintRecords = getMaintenanceRecords(vehicle.id);
  const currentMileage = vehicle.mileage || 0;
  
  return MAINTENANCE_STANDARD.map(std => {
    const lastRecord = getLastMaintRecord(std.name, maintRecords);
    return checkMaintReminder(std, lastRecord, currentMileage);
  }).sort((a, b) => {
    if (a.status !== b.status) {
      const order = { urgent: 0, warning: 1, normal: 2 };
      return order[a.status] - order[b.status];
    }
    return b.progress - a.progress;
  });
}

/**
 * 渲染首页保养提醒卡片
 */
function renderHomeMaintReminder() {
  const vehicle = getVehicleById(getCurrentVehicle());
  if (!vehicle) {
    document.getElementById('homeMaintReminder').innerHTML = '';
    return;
  }
  
  const reminders = getMaintReminders(vehicle);
  const urgentCount = reminders.filter(r => r.status === 'urgent').length;
  const warningCount = reminders.filter(r => r.status === 'warning').length;
  
  // 仅显示需要关注的项目（紧急或即将到期）
  const showItems = reminders.filter(r => r.status !== 'normal').slice(0, 5);
  
  let html = `<div class="maint-reminder">`;
  html += `<div class="maint-reminder-title">📅 保养提醒</div>`;
  
  if (showItems.length === 0) {
    html += `<div class="maint-reminder-empty">🎉 暂无需要保养的项目，车况良好！</div>`;
  } else {
    html += `<div class="maint-reminder-list">`;
    showItems.forEach(item => {
      const kmText = item.kmRemaining > 0 
        ? `还能跑 ${item.kmRemaining}km` 
        : `已超期 ${Math.abs(item.kmRemaining)}km`;
      const timeText = item.monthsRemaining > 0 
        ? `${item.monthsRemaining}个月后到期` 
        : `已超期 ${Math.abs(item.monthsRemaining)}个月`;
      
      html += `
        <div class="maint-item ${item.status}">
          <div class="maint-item-icon">${item.category === 'core' ? '🛡️' : '🔧'}</div>
          <div class="maint-item-info">
            <div class="maint-item-name">${esc(item.name)}</div>
            <div class="maint-item-desc">${esc(item.desc)} · ${kmText}</div>
            <div class="maint-progress-bar">
              <div class="maint-progress-fill ${item.status}" style="width:${item.progress}%"></div>
            </div>
          </div>
          <div class="maint-item-status ${item.status}">${item.statusText}</div>
        </div>
      `;
    });
    html += `</div>`;
  }
  
  html += `
    <div class="maint-reminder-footer">
      <span class="maint-reminder-count">
        ${urgentCount > 0 ? `<span style="color:var(--danger)">${urgentCount}项已到期</span> · ` : ''}
        ${warningCount > 0 ? `<span style="color:var(--warning)">${warningCount}项即将到期</span>` : '全部正常'}
      </span>
      <span class="maint-reminder-link" onclick="switchTab('bills')">查看保养方案 ›</span>
    </div>
  `;
  
  html += `</div>`;
  
  document.getElementById('homeMaintReminder').innerHTML = html;
}

/**
 * 渲染保养手册内容
 */
function renderMaintManual() {
  const vehicle = getVehicleById(getCurrentVehicle());
  if (!vehicle) return;
  
  const manualItems = MAINTENANCE_STANDARD.map(item => {
    const cycleKmStr = item.cycleKm ? `${item.cycleKm}公里` : '';
    const cycleMonthStr = item.cycleMonths ? `${item.cycleMonths}个月` : '';
    const cycleText = cycleKmStr && cycleMonthStr 
      ? `${cycleKmStr}或${cycleMonthStr}` 
      : cycleKmStr || cycleMonthStr;
    
    const categoryLabel = item.category === 'core' ? '核心必保' : 
                         item.category === 'noncore' ? '常规保养' : '增值服务';
    const categoryClass = item.category === 'core' ? 'text-danger' : 
                         item.category === 'noncore' ? 'text-warning' : 'text-info';
    
    return `
      <div class="maint-manual-item">
        <div class="maint-manual-icon">${item.category === 'core' ? '🛡️' : '🔧'}</div>
        <div class="maint-manual-info">
          <div class="maint-manual-name">${esc(item.name)}</div>
          <div class="maint-manual-desc">${esc(item.desc)}</div>
          <div class="maint-manual-meta">
            <span class="${categoryClass}">${categoryLabel}</span>
            <span>预估¥${item.price}</span>
          </div>
        </div>
        <div class="maint-manual-cycle">
          <div class="cycle-label">保养周期</div>
          <div class="cycle-value">${cycleText}</div>
        </div>
      </div>
    `;
  });
  
  document.getElementById('maintManualContent').innerHTML = `
    <div class="maint-manual-header">
      <div class="maint-manual-vehicle">${esc(vehicle.brand)} ${esc(vehicle.model)}</div>
      <div class="maint-manual-hint">以下周期为原厂标准，实际保养可根据车况调整</div>
    </div>
    <div class="maint-manual-list">
      ${manualItems.join('')}
    </div>
  `;
}

// ---------- 账单 ----------
function renderBills() {
  renderBillDatePicker();
  renderBillsStats();
  renderExpenseChart();
  renderBillLedger();
  renderFuelCompare();
  renderMaintCompare();
}

// 切换账单类型（月度/年度）
function switchBillType(type) {
  billType = type;
  if (type === 'year') {
    billMonth = null;
  } else {
    billMonth = billMonth || new Date().getMonth() + 1;
  }
  document.querySelectorAll('.bill-tab').forEach(t => t.classList.remove('active'));
  const btn = document.querySelector(`.bill-tab[data-bill-type="${type}"]`);
  if (btn) btn.classList.add('active');
  renderBills();
}

// 渲染日期选择器
function renderBillDatePicker() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const minYear = 2020;
  const maxYear = currentYear;
  
  let yearOptions = '';
  for (let y = maxYear; y >= minYear; y--) {
    const selected = y === billYear ? 'selected' : '';
    yearOptions += `<option value="${y}" ${selected}>${y}年</option>`;
  }
  
  if (billType === 'month') {
    let monthOptions = '';
    for (let m = 1; m <= 12; m++) {
      const selected = m === billMonth ? 'selected' : '';
      const mStr = String(m).padStart(2, '0');
      monthOptions += `<option value="${m}" ${selected}>${mStr}月</option>`;
    }
    document.getElementById('billDatePicker').innerHTML = `
      <select class="bill-date-select" onchange="billYear = Number(this.value); renderBills()">
        ${yearOptions}
      </select>
      <select class="bill-date-select" onchange="billMonth = Number(this.value); renderBills()">
        ${monthOptions}
      </select>
      <button class="bill-date-btn" onclick="billYear=${currentYear}; billMonth=${now.getMonth()+1}; renderBills()">本月</button>
    `;
  } else {
    document.getElementById('billDatePicker').innerHTML = `
      <select class="bill-date-select" onchange="billYear = Number(this.value); renderBills()">
        ${yearOptions}
      </select>
      <button class="bill-date-btn" onclick="billYear=${currentYear}; renderBills()">本年</button>
    `;
  }
}

// 获取当前筛选条件下的账单记录
function getFilteredBillRecords() {
  const vid = getCurrentVehicle();
  const all = buildAllRecords(vid);
  if (billType === 'month') {
    const ym = `${billYear}-${String(billMonth).padStart(2, '0')}`;
    return all.filter(r => r.date.startsWith(ym));
  } else {
    const ys = `${billYear}`;
    return all.filter(r => r.date.startsWith(ys));
  }
}

// 收支统计
function renderBillsStats() {
  const vid = getCurrentVehicle();
  const all = buildAllRecords(vid);
  const total = all.reduce((s, r) => s + Number(r.amount), 0);
  
  const filtered = getFilteredBillRecords();
  const filteredTotal = filtered.reduce((s, r) => s + Number(r.amount), 0);
  
  const fuelTotal = filtered
    .filter(r => r.category === '加油' || r.category === '充电')
    .reduce((s, r) => s + Number(r.amount), 0);
  
  const maintTotal = filtered
    .filter(r => r.category === '保养')
    .reduce((s, r) => s + Number(r.amount), 0);
  
  const parkingTotal = filtered
    .filter(r => r.category === '停车')
    .reduce((s, r) => s + Number(r.amount), 0);
  
  const tollTotal = filtered
    .filter(r => r.category === '高速')
    .reduce((s, r) => s + Number(r.amount), 0);
  
  const violationTotal = filtered
    .filter(r => r.category === '违章')
    .reduce((s, r) => s + Number(r.amount), 0);

  const title = billType === 'month' 
    ? `${billYear}年${billMonth}月支出` 
    : `${billYear}年支出`;
  const subTitle = billType === 'month' 
    ? `${billYear}-${String(billMonth).padStart(2, '0')}` 
    : `${billYear}年`;

  document.getElementById('billsStats').innerHTML = `
    <div class="stat-card primary">
      <div class="stat-label">累计支出</div>
      <div class="stat-value">¥${money(total)}</div>
      <div class="stat-sub">共 ${all.length} 笔账单</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">${title}</div>
      <div class="stat-value">¥${money(filteredTotal)}</div>
      <div class="stat-sub">${subTitle} · ${filtered.length}笔</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">能源补给</div>
      <div class="stat-value">¥${money(fuelTotal)}</div>
      <div class="stat-sub">加油/充电</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">保养支出</div>
      <div class="stat-value">¥${money(maintTotal)}</div>
      <div class="stat-sub">维修/洗车另计</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">停车费用</div>
      <div class="stat-value">¥${money(parkingTotal)}</div>
      <div class="stat-sub">🅿️ 停车</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">高速通行</div>
      <div class="stat-value">¥${money(tollTotal)}</div>
      <div class="stat-sub">🛣️ 过路费</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">违章罚款</div>
      <div class="stat-value">¥${money(violationTotal)}</div>
      <div class="stat-sub">⚠️ 违章</div>
    </div>
  `;
}

// 开销图表（CSS 柱状图，按类别）
function renderExpenseChart() {
  const filtered = getFilteredBillRecords();
  const catMap = {};
  filtered.forEach(r => {
    catMap[r.category] = (catMap[r.category] || 0) + Number(r.amount);
  });
  const cats = Object.keys(catMap).map(k => ({ name: k, value: catMap[k] }));
  if (cats.length === 0) {
    document.getElementById('billsChart').innerHTML = `<div class="empty-tip">暂无数据</div>`;
    return;
  }
  const max = Math.max(...cats.map(c => c.value));
  document.getElementById('billsChart').innerHTML = cats.map(c => {
    const h = max > 0 ? Math.round((c.value / max) * 100) : 0;
    return `
      <div class="bar-col">
        <div class="bar-wrap">
          <div class="bar-value">¥${Math.round(c.value)}</div>
          <div class="bar" style="height:${h}%"></div>
        </div>
        <div class="bar-label">${esc(c.name)}</div>
      </div>
    `;
  }).join('');
}

// 账单台账
function renderBillLedger() {
  const filtered = getFilteredBillRecords().sort((a, b) => b.date.localeCompare(a.date));
  const box = document.getElementById('billsLedger');
  if (filtered.length === 0) {
    const tip = billType === 'month' 
      ? `${billYear}年${billMonth}月暂无账单` 
      : `${billYear}年暂无账单`;
    box.innerHTML = `<div class="empty-tip">${tip}</div>`;
    return;
  }
  box.innerHTML = `<div class="record-list">${filtered.map(r => `
    <div class="bill-item">
      <div class="record-icon">${r.icon}</div>
      <div class="record-main">
        <div class="record-title">${esc(r.title)}</div>
        <div class="record-sub">${r.date} · ${r.sub}</div>
      </div>
      <span class="bill-cat">${r.category}</span>
      <div class="record-amount minus">-¥${money(r.amount)}</div>
    </div>
  `).join('')}</div>`;
}

/* ============================================================
   七、趣味对比专区
   ============================================================ */

// 切换对比子Tab
function switchCompareTab(tab) {
  // 切换按钮高亮
  document.querySelectorAll('.compare-tab').forEach(t => t.classList.remove('active'));
  const btn = document.querySelector(`.compare-tab[data-compare="${tab}"]`);
  if (btn) btn.classList.add('active');

  // 切换面板显示
  document.getElementById('fuelComparePanel').classList.remove('compare-panel-active');
  document.getElementById('maintComparePanel').classList.remove('compare-panel-active');
  if (tab === 'fuel') {
    document.getElementById('fuelComparePanel').classList.add('compare-panel-active');
    renderFuelCompare();
  } else {
    document.getElementById('maintComparePanel').classList.add('compare-panel-active');
    renderMaintCompare();
  }
}

/* ===== 油耗/电耗计算函数（含详细算法注释）===== */

// 模块级变量：记录"车型横向对比"当前选中的车型（默认取当前车辆级别）
// 切换芯片时由 switchFuelCompareType 更新，并触发本面板重渲染
let currentCompareType = null;

/**
 * 计算历史平均油耗/电耗（百公里）
 *
 * 算法说明：
 *  1. 将记录按里程升序排序（确保时间/里程先后一致）
 *  2. 对每一对相邻记录 (i, i+1) 计算一个"段能耗"：
 *       段能耗 = next.liters / (next.mileage - cur.mileage) * 100
 *     含义：本次加注的能源量近似等于自上次加注以来行驶这段距离所消耗的能源量
 *          （假设每次都加满至跳枪）。乘以 100 即换算为"每百公里"消耗。
 *  3. 对所有有效段求算术平均，作为历史平均能耗
 *  4. 对于新能源车（记录带 energyType==='electric'），liters 字段存的是 kWh，
 *     单位为 kWh/100km；否则单位为 L/100km。
 *
 * 边界情况：
 *  - 记录少于 2 条 → 无法计算，返回 null
 *  - 任意一段里程差 <= 0（异常数据）→ 跳过该段
 *  - 加注量 <= 0 → 跳过该段
 *  - 全部段都无效 → 返回 null
 *
 * @param {Array} records 加油/充电记录数组
 * @returns {Object|null} { value, unit, isElectric, segments } 或 null
 */
function calcFuelConsumption(records) {
  if (!records || records.length < 2) return null;
  // 复制一份再排序，避免污染原数组
  const sorted = [...records].sort((a, b) => (a.mileage || 0) - (b.mileage || 0));
  // 任一记录标记为 electric 即按电车处理
  const isElectric = sorted.some(r => r.energyType === 'electric');
  const segments = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const cur = sorted[i];
    const next = sorted[i + 1];
    const deltaKm = (next.mileage || 0) - (cur.mileage || 0);
    if (deltaKm <= 0) continue;            // 里程未变化或异常，跳过
    const used = Number(next.liters) || 0; // 本次加注量 ≈ 上一段消耗
    if (used <= 0) continue;
    segments.push(used / deltaKm * 100);
  }
  if (segments.length === 0) return null;
  const avg = segments.reduce((s, v) => s + v, 0) / segments.length;
  return {
    value: avg,
    unit: isElectric ? 'kWh/100km' : 'L/100km',
    isElectric: isElectric,
    segments: segments.length,
  };
}

/**
 * 计算指定年份+月份的油耗/电耗
 * 先按"YYYY-MM"前缀过滤记录，再调用 calcFuelConsumption
 * @param {Array} records 全部记录
 * @param {number} year 年份（如 2026）
 * @param {number} month 月份（1-12）
 * @returns {Object|null}
 */
function calcMonthlyFuel(records, year, month) {
  const mm = String(month).padStart(2, '0');
  const ym = `${year}-${mm}`;
  const filtered = (records || []).filter(r => r.date && r.date.startsWith(ym));
  return calcFuelConsumption(filtered);
}

/**
 * 计算指定年份的油耗/电耗
 * 按"YYYY"前缀过滤记录后计算
 * @param {Array} records 全部记录
 * @param {number} year 年份
 * @returns {Object|null}
 */
function calcYearlyFuel(records, year) {
  const ys = String(year);
  const filtered = (records || []).filter(r => r.date && r.date.startsWith(ys));
  return calcFuelConsumption(filtered);
}

/**
 * 计算指定日期范围内的油耗/电耗（用于"今年同期 / 去年同期"对比）
 * @param {Array} records 全部记录
 * @param {string} startDate 起始日期 'YYYY-MM-DD'（含）
 * @param {string} endDate 结束日期 'YYYY-MM-DD'（含）
 * @returns {Object|null}
 */
function calcRangeFuel(records, startDate, endDate) {
  const filtered = (records || []).filter(r => r.date && r.date >= startDate && r.date <= endDate);
  return calcFuelConsumption(filtered);
}

/**
 * 汇总油耗对比所需的全量数据
 *  - 当前车辆及其加油记录
 *  - 历史平均、本月、上月、今年同期、去年同期
 *  - 同级别基线值（电车取 ev，燃油车取 fuel）
 *
 * @returns {Object|null} 综合数据对象；车辆不存在时返回 null
 */
function getFuelCompareData() {
  const vid = getCurrentVehicle();
  const vehicle = getVehicleById(vid);
  if (!vehicle) return null;
  const records = getRefuelRecords(vid);
  const isElectric = vehicle.type === 'newenergy';
  const level = vehicle.level;
  // 同级基线（取不到时退回默认轿车基线）
  const baseline = VEHICLE_TYPE_BASELINE[level] || { fuel: 7.5, ev: 14.0 };
  const baselineValue = isElectric ? baseline.ev : baseline.fuel;

  // 当前时间相关变量
  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth() + 1;
  // 上个月（处理跨年）
  const lastMonthDate = new Date(curYear, curMonth - 2, 1);
  const lastMonthYear = lastMonthDate.getFullYear();
  const lastMonthNum = lastMonthDate.getMonth() + 1;

  // 今年同期：今年1月1日 ~ 今天；去年同期：去年1月1日 ~ 去年今日
  const todayStr = now.toISOString().slice(0, 10);
  const thisYearStart = `${curYear}-01-01`;
  const lastYear = curYear - 1;
  const lastYearToday = `${lastYear}-${todayStr.slice(5)}`;
  const lastYearStart = `${lastYear}-01-01`;

  return {
    vehicle,
    records,
    isElectric,
    level,
    baseline,                                  // 完整基线 {fuel, ev}
    baselineValue,                             // 与车辆类型对应的基线值
    historical: calcFuelConsumption(records),
    thisMonth: calcMonthlyFuel(records, curYear, curMonth),
    lastMonth: calcMonthlyFuel(records, lastMonthYear, lastMonthNum),
    thisYearPeriod: calcRangeFuel(records, thisYearStart, todayStr),
    lastYearPeriod: calcRangeFuel(records, lastYearStart, lastYearToday),
  };
}

/**
 * 根据用户能耗与同级基线，返回能耗等级标签
 *  - 省油王者：用户值 <= 基线 * 0.85（比同级省 15% 以上）
 *  - 中等水平：用户值 <= 基线 * 1.15（上下 15% 之间）
 *  - 偏费油：用户值 > 基线 * 1.15（比同级费 15% 以上）
 *
 * @param {number} userValue 用户能耗
 * @param {number} baselineValue 同级基线
 * @returns {string} 等级标签
 */
function getFuelLevel(userValue, baselineValue) {
  if (userValue == null || baselineValue == null || baselineValue <= 0) return '中等水平';
  if (userValue <= baselineValue * 0.85) return '省油王者';
  if (userValue <= baselineValue * 1.15) return '中等水平';
  return '偏费油';
}

/**
 * 生成趣味评语
 * 根据用户值偏离基线的程度，估算"领先同级车主百分比"，给出鼓励/提醒文案
 * 例：「🎉 比 72% 同级车主更省油！继续保持～」
 *
 * @param {number} userValue 用户能耗
 * @param {number} baselineValue 同级基线
 * @param {boolean} isElectric 是否为电车（影响"省油/省电"用词）
 * @returns {string} 趣味评语文案
 */
function getFunComment(userValue, baselineValue, isElectric) {
  const goodWord = isElectric ? '省电' : '省油';
  const badWord = isElectric ? '费电' : '费油';
  if (userValue == null || baselineValue == null || baselineValue <= 0) {
    return '数据不足，多记录几次就能解锁趣味对比啦～';
  }
  // 偏离比例：正数表示低于基线（更省），负数表示高于基线（更费）
  const deviation = (baselineValue - userValue) / baselineValue;
  // 领先百分比：50% 为基准线（持平），按偏离程度放大
  let percent = Math.round(50 + deviation * 150);
  if (percent < 5) percent = 5;
  if (percent > 95) percent = 95;
  if (deviation >= 0) {
    return `🎉 比 ${percent}% 同级车主更${goodWord}！继续保持～`;
  } else {
    return `😅 比 ${100 - percent}% 同级车主更${badWord}，加油改进吧～`;
  }
}

/**
 * 判断加油记录数据是否足够进行油耗对比
 * 至少需要 2 条带有效里程（>0）的记录
 * @param {Array} records
 * @returns {boolean}
 */
function isDataSufficient(records) {
  if (!records || records.length < 2) return false;
  return records.filter(r => r.mileage && r.mileage > 0).length >= 2;
}

/* ===== 油耗对比面板渲染 ===== */

/**
 * 渲染油耗/电耗对比主面板
 * 包含：数据不足提示 / 自我对比 / 同级对标 / 车型横向对比 / 电耗对比(电车专属)
 */
function renderFuelCompare() {
  const panel = document.getElementById('fuelComparePanel');
  const data = getFuelCompareData();

  // 数据不足：显示友好提示卡
  if (!data || !isDataSufficient(data.records)) {
    panel.innerHTML = `
      <div class="fc-empty">
        <span class="fc-empty-icon">${data && data.isElectric ? '⚡' : '⛽'}</span>
        <div class="fc-empty-text">${data && data.isElectric ? '充电' : '加油'}记录不足，请先在服务页补充${data && data.isElectric ? '充电' : '加油'}记录</div>
        <div class="fc-empty-sub">至少需要 2 条带里程的记录才能开启趣味对比</div>
      </div>
    `;
    return;
  }

  // 初始化默认选中类型（与当前车辆级别一致）
  if (!currentCompareType || !VEHICLE_TYPE_BASELINE[currentCompareType]) {
    currentCompareType = data.level || '轿车';
  }

  // 依次渲染各分区卡片（同级对标已移至首页）
  panel.innerHTML =
    renderSelfCompare(data) +
    renderTypeCompare(data) +
    (data.isElectric ? renderEvCompare(data) : '');
}

/* 自我对比分区：本月 vs 上月、今年同期 vs 去年同期 */
function renderSelfCompare(data) {
  const unit = data.historical ? data.historical.unit : (data.isElectric ? 'kWh/100km' : 'L/100km');
  const tm = data.thisMonth ? data.thisMonth.value : null;
  const lm = data.lastMonth ? data.lastMonth.value : null;
  const typ = data.thisYearPeriod ? data.thisYearPeriod.value : null;
  const lyp = data.lastYearPeriod ? data.lastYearPeriod.value : null;

  return `
    <div class="fc-card">
      <div class="fc-card-title">📊 自我对比</div>
      ${renderCompareRow('本月', tm, '上月', lm, unit)}
      ${renderCompareRow('今年同期', typ, '去年同期', lyp, unit)}
    </div>
  `;
}

/* 渲染一行两栏对比：双柱迷你图 + 变化指示 + 趣味文案 */
function renderCompareRow(labelA, valueA, labelB, valueB, unit) {
  const shortUnit = unit.includes('kWh') ? 'kWh' : 'L';
  const aOk = valueA != null;
  const bOk = valueB != null;
  // 计算柱高比例（取两者最大值为 100%，最小高度 8% 保证可见）
  const maxVal = Math.max(valueA || 0, valueB || 0, 0.1);
  const aHeight = aOk ? Math.max(8, Math.round((valueA / maxVal) * 100)) : 0;
  const bHeight = bOk ? Math.max(8, Math.round((valueB / maxVal) * 100)) : 0;

  // 变化指示（数值变高 = 更费油/电 = 红色；变低 = 更省 = 绿色）
  let deltaHtml = '<span class="fc-delta fc-delta-neutral">数据不足</span>';
  let comment = '';
  if (aOk && bOk) {
    const diff = valueA - valueB;
    const pct = valueB > 0 ? Math.abs(diff / valueB * 100).toFixed(1) : '0';
    if (diff > 0.01) {
      deltaHtml = `<span class="fc-delta up">↑ ${pct}% 变高</span>`;
      comment = '💡 注意啦，能耗有所上升，可能需要检查驾驶习惯';
    } else if (diff < -0.01) {
      deltaHtml = `<span class="fc-delta down">↓ ${pct}% 变低</span>`;
      comment = '👍 表现进步啦，少花了不少油钱！';
    } else {
      deltaHtml = '<span class="fc-delta fc-delta-neutral">持平</span>';
      comment = '🙂 保持稳定，老司机风范～';
    }
  }
  return `
    <div class="fc-row">
      <div class="fc-mini-chart">
        <div class="bar-col">
          <div class="bar-wrap">
            <div class="bar-value">${aOk ? valueA.toFixed(1) : '—'}</div>
            <div class="bar" style="height:${aHeight}%"></div>
          </div>
          <div class="bar-label">${esc(labelA)}</div>
        </div>
        <div class="bar-col">
          <div class="bar-wrap">
            <div class="bar-value">${bOk ? valueB.toFixed(1) : '—'}</div>
            <div class="bar" style="height:${bHeight}%"></div>
          </div>
          <div class="bar-label">${esc(labelB)}</div>
        </div>
      </div>
      <div class="fc-row-meta">
        ${deltaHtml}
        <span class="fc-row-unit">${shortUnit}/100km</span>
      </div>
      ${comment ? `<div class="fc-comment">${comment}</div>` : ''}
    </div>
  `;
}

/* 同级对标分区：用户值 vs 同级均值（横向进度条对比 + 等级徽章 + 趣味评语） */
function renderPeerBenchmark(data) {
  const userValue = data.historical ? data.historical.value : null;
  if (userValue == null) return '';
  const baseline = data.baselineValue;
  const label = getFuelLevel(userValue, baseline);
  const labelClass = label === '省油王者' ? 'good' : (label === '偏费油' ? 'bad' : 'mid');
  const comment = getFunComment(userValue, baseline, data.isElectric);
  const unit = data.historical.unit;
  // 进度条归一化：以较大值为 100%
  const maxBar = Math.max(userValue, baseline, 0.1);
  const userPct = Math.max(5, Math.round((userValue / maxBar) * 100));
  const basePct = Math.max(5, Math.round((baseline / maxBar) * 100));

  return `
    <div class="fc-card">
      <div class="fc-card-title">🏆 同级对标</div>
      <div class="fc-badge-row">
        <span class="fc-badge-label">你的水平</span>
        <span class="fc-badge ${labelClass}">${label}</span>
      </div>
      <div class="fc-progress-label"><span>🚗 我的车</span><span>${userValue.toFixed(1)} ${unit}</span></div>
      <div class="fc-progress"><div class="fc-progress-bar" style="width:${userPct}%"></div></div>
      <div class="fc-progress-label" style="margin-top:8px"><span>📊 ${esc(data.level)}均值</span><span>${baseline.toFixed(1)} ${unit}</span></div>
      <div class="fc-progress"><div class="fc-progress-bar baseline" style="width:${basePct}%"></div></div>
      <div class="fc-comment">${comment}</div>
    </div>
  `;
}

/* 车型横向对比分区：可切换车型芯片，动态对比用户值与所选车型均值 */
function renderTypeCompare(data) {
  const userValue = data.historical ? data.historical.value : null;
  if (userValue == null) return '';
  const types = ['轿车', 'SUV', '紧凑型车'];
  const chipsHtml = types.map(t => {
    const active = t === currentCompareType ? 'active' : '';
    return `<button class="fc-chip ${active}" onclick="switchFuelCompareType('${t}')">${t}均值</button>`;
  }).join('');

  const baselineObj = VEHICLE_TYPE_BASELINE[currentCompareType];
  if (!baselineObj) return '';
  const baseline = data.isElectric ? baselineObj.ev : baselineObj.fuel;
  const unit = data.historical.unit;
  const maxBar = Math.max(userValue, baseline, 0.1);
  const userPct = Math.max(5, Math.round((userValue / maxBar) * 100));
  const basePct = Math.max(5, Math.round((baseline / maxBar) * 100));
  const comment = getFunComment(userValue, baseline, data.isElectric);

  return `
    <div class="fc-card">
      <div class="fc-card-title">🚗 车型横向对比</div>
      <div class="fc-chips">${chipsHtml}</div>
      <div class="fc-progress-label"><span>🚗 我的车</span><span>${userValue.toFixed(1)} ${unit}</span></div>
      <div class="fc-progress"><div class="fc-progress-bar" style="width:${userPct}%"></div></div>
      <div class="fc-progress-label" style="margin-top:8px"><span>📊 ${esc(currentCompareType)}均值</span><span>${baseline.toFixed(1)} ${unit}</span></div>
      <div class="fc-progress"><div class="fc-progress-bar baseline" style="width:${basePct}%"></div></div>
      <div class="fc-comment">${comment}</div>
    </div>
  `;
}

/* 新能源专属电耗对比：与同级电车均值对比，并附带"较燃油车省钱"换算 */
function renderEvCompare(data) {
  const userValue = data.historical ? data.historical.value : null;
  if (userValue == null) return '';
  const evBaseline = data.baseline.ev;       // 同级电车均值
  const fuelBaseline = data.baseline.fuel;   // 同级燃油均值（用于省钱换算）
  const label = getFuelLevel(userValue, evBaseline);
  const labelClass = label === '省油王者' ? 'good' : (label === '偏费油' ? 'bad' : 'mid');
  const comment = getFunComment(userValue, evBaseline, true);
  const unit = data.historical.unit;
  const maxBar = Math.max(userValue, evBaseline, 0.1);
  const userPct = Math.max(5, Math.round((userValue / maxBar) * 100));
  const basePct = Math.max(5, Math.round((evBaseline / maxBar) * 100));

  // 省钱换算：电费 0.6 元/kWh，油价 7.75 元/L（与模拟数据一致）
  const evCostPer100 = userValue * 0.6;
  const fuelCostPer100 = fuelBaseline * 7.75;
  const saving = (fuelCostPer100 - evCostPer100).toFixed(1);

  return `
    <div class="fc-card">
      <div class="fc-card-title">⚡ 电耗对比</div>
      <div class="fc-badge-row">
        <span class="fc-badge-label">你的水平</span>
        <span class="fc-badge ${labelClass}">${label}</span>
      </div>
      <div class="fc-progress-label"><span>⚡ 我的车</span><span>${userValue.toFixed(1)} ${unit}</span></div>
      <div class="fc-progress"><div class="fc-progress-bar" style="width:${userPct}%"></div></div>
      <div class="fc-progress-label" style="margin-top:8px"><span>📊 ${esc(data.level)}电车均值</span><span>${evBaseline.toFixed(1)} ${unit}</span></div>
      <div class="fc-progress"><div class="fc-progress-bar baseline" style="width:${basePct}%"></div></div>
      <div class="fc-comment">${comment}</div>
      <div class="fc-saving">💰 比同级燃油车每 100 公里省约 ¥${saving}（电费 0.6 元/kWh vs 油价 7.75 元/L）</div>
    </div>
  `;
}

/**
 * 切换"车型横向对比"中选中的车型，并重新渲染整个面板
 * 由芯片 onclick 触发
 * @param {string} type 车型级别（轿车 / SUV / 紧凑型车）
 */
function switchFuelCompareType(type) {
  currentCompareType = type;
  renderFuelCompare();
}

/* ===== 年度保养方案对比：双方案计算函数（含详细算法注释）===== */

// 模块级变量：用户手动微调的覆盖项。
// null 表示尚未初始化（首次渲染时按方案B默认逻辑生成）。
// 结构：{ itemId: { included: bool, cycleMultiplier: 1.0/1.5/2.0 } }
let manualOverrides = null;

/**
 * 生成某保养项目在一年（12个月）内的执行月份列表
 *
 * 算法说明：
 *  - 以"年初"为起点，每隔 cycleMonths 触发一次
 *  - 仅保留 ≤12 的触发点（如周期6月 → 第6、12月）
 *  - 当 cycleMonths > 12 时（如刹车油24月、变速箱油36月），
 *    按规格 Math.ceil(12/cycleMonths)=1 视为本年到期1次，
 *    统一安排在年末（第12月）执行
 *
 * @param {number} cycleMonths 原厂/调整后的保养周期（月）
 * @returns {number[]} 执行月份列表，如 [6, 12] 或 [12]
 */
function buildMaintSchedule(cycleMonths) {
  const months = [];
  for (let m = cycleMonths; m <= 12; m += cycleMonths) {
    months.push(m);
  }
  // 周期超过12月的项目，本年按1次到期处理，安排在年末
  if (months.length === 0) {
    months.push(12);
  }
  return months;
}

/**
 * 将月份列表格式化为中文展示串
 * @param {number[]} months 月份数组
 * @returns {string} 例如 "第6月、第12月"
 */
function formatMaintSchedule(months) {
  return months.map(m => '第' + m + '月').join('、');
}

/**
 * 返回保养类别的中文标签（用于表格项目名下方的分类小字）
 * @param {string} cat 'core' | 'noncore' | 'addon'
 * @returns {string}
 */
function maintCategoryLabel(cat) {
  if (cat === 'core') return '核心';
  if (cat === 'noncore') return '非核心';
  if (cat === 'addon') return '增值';
  return '';
}

/**
 * 方案A：标准原厂方案
 *
 * 严格按照 MAINTENANCE_STANDARD 中所有项目的原厂周期执行。
 * 在12个月内按 cycleMonths 计算执行次数：times = Math.ceil(12 / cycleMonths)
 *   - 机油 cycleKm 5000 / cycleMonths 6  → 一年2次（第6、12月）
 *   - 空气滤芯 cycleMonths 12            → 一年1次（第12月）
 *   - 刹车油 cycleMonths 24              → 一年1次（年末到期）
 *   - 变速箱油 cycleMonths 36            → 一年1次（年末到期）
 * 单项年度费用 cost = times * price
 *
 * @param {object} vehicle 当前车辆（保留参数以便后续按车龄/里程扩展）
 * @returns {{ items: Array, totalCost: number }}
 */
function calcPlanA(vehicle) {
  const items = MAINTENANCE_STANDARD.map(std => {
    const cycleMonths = std.cycleMonths;
    const times = Math.ceil(12 / cycleMonths);            // 本年执行次数
    const months = buildMaintSchedule(cycleMonths);        // 执行月份列表
    const cost = times * std.price;                        // 年度费用
    return {
      id: std.id,
      name: std.name,
      category: std.category,
      cycleMonths: cycleMonths,
      price: std.price,
      times: times,
      cost: cost,
      scheduleTime: formatMaintSchedule(months),
    };
  });
  const totalCost = items.reduce((s, it) => s + it.cost, 0);
  return { items, totalCost };
}

/**
 * 方案B：经济精简方案
 *
 * 默认策略（可被 manualOverrides 覆盖）：
 *  1. 核心项目(core)：保留，周期不变（multiplier=1.0）
 *  2. 非核心项目(noncore)：保留但周期延长 50%（multiplier=1.5）
 *     - airfilter  12 → 18 月
 *     - sparkplug  24 → 36 月
 *     - coolant    24 → 36 月
 *     - transmission 36 → 54 月
 *  3. 增值服务(addon)：完全剔除（tire / throttle）
 *
 * 对于剔除的项目，放入 removedItems 数组并标记 removed:true
 * 对于周期被延长的项目，标记 extended:true 并记录原周期/延长后周期
 *
 * @param {object} vehicle 当前车辆
 * @returns {{ items: Array, removedItems: Array, totalCost: number }}
 */
function calcPlanB(vehicle) {
  // 首次调用时按默认策略初始化 manualOverrides
  if (!manualOverrides) {
    manualOverrides = {};
    MAINTENANCE_STANDARD.forEach(std => {
      if (std.category === 'core') {
        // 核心件：保留，周期不延长
        manualOverrides[std.id] = { included: true, cycleMultiplier: 1.0 };
      } else if (std.category === 'noncore') {
        // 非核心件：保留，周期延长50%
        manualOverrides[std.id] = { included: true, cycleMultiplier: 1.5 };
      } else {
        // 增值服务：剔除
        manualOverrides[std.id] = { included: false, cycleMultiplier: 1.0 };
      }
    });
  }

  const items = [];
  const removedItems = [];

  MAINTENANCE_STANDARD.forEach(std => {
    const ov = manualOverrides[std.id] || { included: true, cycleMultiplier: 1.0 };

    // 被剔除的项目（默认 addon 或用户手动关闭）
    if (!ov.included) {
      removedItems.push({
        id: std.id,
        name: std.name,
        removed: true,
      });
      return;
    }

    // 保留项目：根据 multiplier 计算延长后的周期
    const originalCycleMonths = std.cycleMonths;
    const extendedCycleMonths = Math.round(originalCycleMonths * ov.cycleMultiplier);
    const extended = ov.cycleMultiplier > 1.0;              // 是否延长了周期
    const times = Math.ceil(12 / extendedCycleMonths);
    const months = buildMaintSchedule(extendedCycleMonths);
    const cost = times * std.price;

    items.push({
      id: std.id,
      name: std.name,
      category: std.category,
      originalCycleMonths: originalCycleMonths,
      extendedCycleMonths: extendedCycleMonths,
      price: std.price,
      times: times,
      cost: cost,
      scheduleTime: formatMaintSchedule(months),
      extended: extended,
    });
  });

  const totalCost = items.reduce((s, it) => s + it.cost, 0);
  return { items, removedItems, totalCost };
}

/**
 * 获取当前车辆的两套方案对比数据
 * @returns {{ vehicle: object, planA: object, planB: object, saving: number }}
 */
function getMaintCompareData() {
  const vehicleId = getCurrentVehicle();
  const vehicle = getVehicleById(vehicleId);
  const planA = calcPlanA(vehicle);
  const planB = calcPlanB(vehicle);
  return {
    vehicle: vehicle,
    planA: planA,
    planB: planB,
    saving: planA.totalCost - planB.totalCost,
  };
}

/**
 * 渲染手动微调项目列表（被 renderMaintCompare 调用）
 * 列出全部 MAINTENANCE_STANDARD 项目，每项含复选框 + 周期倍率按钮
 * @returns {string} HTML 片段
 */
function renderMaintAdjust() {
  // 确保 manualOverrides 已初始化（calcPlanB 已在 getMaintCompareData 中调用过）
  if (!manualOverrides) {
    calcPlanB(null);
  }
  const rows = MAINTENANCE_STANDARD.map(std => {
    const ov = manualOverrides[std.id];
    const checkedAttr = ov.included ? 'checked' : '';
    // 仅在已纳入方案B时显示周期倍率按钮
    const cycleBtns = ov.included ? `
      <div class="mc-cycle-group">
        ${[1.0, 1.5, 2.0].map(m => `
          <button class="mc-cycle-btn ${ov.cycleMultiplier === m ? 'active' : ''}"
                  onclick="adjustMaintCycle('${std.id}', ${m})">${m}x</button>
        `).join('')}
      </div>
    ` : '<div class="mc-cycle-disabled">已剔除</div>';

    return `
      <div class="mc-adjust-item">
        <label class="mc-adjust-check">
          <input type="checkbox" ${checkedAttr} onclick="toggleMaintItem('${std.id}')">
          <span class="mc-adjust-name">${esc(std.name)}</span>
        </label>
        <div class="mc-adjust-meta">
          <span class="mc-adjust-cycle">原厂${std.cycleMonths}月</span>
          <span class="mc-adjust-price">¥${money(std.price)}</span>
        </div>
        ${cycleBtns}
      </div>
    `;
  }).join('');
  return `<div class="mc-adjust-list">${rows}</div>`;
}

/**
 * 渲染"年度保养方案对比"面板
 * 输出到 #maintComparePanel，包含：
 *  1. 标题 + 车辆副标题
 *  2. 双方案概览卡（方案A深蓝 / 方案B绿色）+ 全年省徽标
 *  3. 项目明细对比表（保养项目 | 方案A | 方案B | 差价）
 *  4. 成本对比结论 + 趣味文案
 *  5. 用车风险提示（优点/缺点/适用场景）
 *  6. 原厂方案优势
 *  7. 趣味总结（双人格画像）
 *  8. 手动微调保养项目（复选框 + 周期倍率）
 */
function renderMaintCompare(targetId = 'maintComparePanel') {
  const data = getMaintCompareData();
  const { vehicle, planA, planB, saving } = data;

  // 车辆名（无车辆时降级显示）
  const vehicleName = vehicle ? `${vehicle.brand}${vehicle.model}` : '当前车辆';

  // 构造对比表格行：以 MAINTENANCE_STANDARD 顺序为基准（与方案A一致）
  const rows = MAINTENANCE_STANDARD.map(std => {
    const aItem = planA.items.find(it => it.id === std.id);
    const bItem = planB.items.find(it => it.id === std.id);
    const bRemoved = planB.removedItems.find(it => it.id === std.id);

    // 方案A列：执行月份 + 费用
    const aCell = `
      <div class="mc-cell-time">${aItem.scheduleTime}</div>
      <div class="mc-cell-cost">¥${money(aItem.cost)}</div>
    `;

    // 方案B列：剔除 / 延长 / 普通
    let bCell;
    if (bRemoved) {
      bCell = `<div class="mc-cell-removed">❌ 已精简</div>`;
    } else {
      const extNote = bItem.extended
        ? `<div class="mc-cell-ext">周期延长至${bItem.extendedCycleMonths}月</div>`
        : '';
      bCell = `
        ${extNote}
        <div class="mc-cell-time">${bItem.scheduleTime}</div>
        <div class="mc-cell-cost">¥${money(bItem.cost)}</div>
      `;
    }

    // 差价列：方案A费用 - 方案B费用（剔除的B算0）
    const aCost = aItem.cost;
    const bCost = bRemoved ? 0 : bItem.cost;
    const diff = aCost - bCost;
    const diffCell = diff > 0
      ? `<div class="mc-cell-diff">省 ¥${money(diff)}</div>`
      : `<div class="mc-cell-diff zero">—</div>`;

    // 整行：被精简的行降低透明度
    const rowClass = bRemoved ? 'removed-row' : '';
    return `
      <tr class="${rowClass}">
        <td class="mc-cell-name">
          <div class="mc-name">${esc(std.name)}</div>
          <div class="mc-cat">${maintCategoryLabel(std.category)}</div>
        </td>
        <td>${aCell}</td>
        <td>${bCell}</td>
        <td>${diffCell}</td>
      </tr>
    `;
  }).join('');

  // 对比表格（含表尾合计行）
  const tableHTML = `
    <div class="mc-table-wrap">
      <table class="mc-table">
        <thead>
          <tr>
            <th>保养项目</th>
            <th>方案A<br><small>时间/费用</small></th>
            <th>方案B<br><small>时间/费用</small></th>
            <th>差价</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
        <tfoot>
          <tr>
            <td>全年合计</td>
            <td><strong>¥${money(planA.totalCost)}</strong></td>
            <td><strong>¥${money(planB.totalCost)}</strong></td>
            <td class="diff"><strong>省 ¥${money(saving)}</strong></td>
          </tr>
        </tfoot>
      </table>
    </div>
  `;

  // 手动微调列表
  const adjustHTML = renderMaintAdjust();

  // 整体面板 HTML
  const html = `
    <div class="mc-card">
      <div class="mc-title">🔧 年度保养方案对比</div>
      <div class="mc-subtitle">🚗 ${esc(vehicleName)} · 一年（12个月）保养预算</div>
    </div>

    <div class="mc-card">
      <div class="mc-plans">
        <div class="mc-plan a">
          <div class="mc-plan-label">方案A · 标准原厂</div>
          <div class="mc-plan-cost">¥${money(planA.totalCost)}</div>
          <div class="mc-plan-sub">严格按原厂周期</div>
        </div>
        <div class="mc-plan b">
          <div class="mc-plan-label">方案B · 经济精简</div>
          <div class="mc-plan-cost">¥${money(planB.totalCost)}</div>
          <div class="mc-plan-sub">精简增值+延长周期</div>
        </div>
      </div>
      <div class="mc-saving">💰 全年省：¥${money(saving)}（约每月省 ¥${money(saving / 12)}）</div>
    </div>

    <div class="mc-card">
      <div class="mc-title">📋 项目明细对比</div>
      ${tableHTML}
    </div>

    <div class="mc-card mc-conclusion">
      <div class="mc-title">💵 成本对比结论</div>
      <div class="mc-conclusion-row">
        <span>方案A全年：<b>¥${money(planA.totalCost)}</b></span>
        <span>方案B全年：<b>¥${money(planB.totalCost)}</b></span>
        <span>全年差价：<b class="green">¥${money(saving)}</b></span>
      </div>
      <div class="mc-fun">🎉 选择经济方案，相当于每月多省一杯咖啡 ☕</div>
    </div>

    <div class="mc-card mc-risk">
      <div class="mc-title">⚠️ 用车风险提示</div>
      <div class="mc-risk-block">
        <div class="mc-risk-title good">✅ 精简方案优点</div>
        <div class="mc-risk-text">省钱、基本安全保障仍在（核心件全保留）</div>
      </div>
      <div class="mc-risk-block">
        <div class="mc-risk-title warn">⚠️ 精简方案缺点</div>
        <div class="mc-risk-text">增值服务缺失、部分件周期拉长有轻微风险</div>
      </div>
      <div class="mc-risk-block">
        <div class="mc-risk-title scene">🚗 适用场景</div>
        <div class="mc-risk-text">短途代步首选 ｜ ❌ 长途通勤慎选</div>
      </div>
    </div>

    <div class="mc-card mc-advantage">
      <div class="mc-title">🛡️ 原厂方案优势</div>
      <ul class="mc-adv-list">
        <li>🛡️ 车辆质保不受影响</li>
        <li>📈 车况更佳，残值更高</li>
        <li>🕐 适合长期用车、计划持有5年以上车主</li>
      </ul>
    </div>

    <div class="mc-card mc-summary">
      <div class="mc-title">🎯 趣味总结：你属于哪一派？</div>
      <div class="mc-persona">
        <span class="mc-persona-icon">👤</span>
        <span class="mc-persona-text"><b>方案A适合：</b>追求安心、长期持有、新手车主、4S店常客</span>
      </div>
      <div class="mc-persona">
        <span class="mc-persona-icon">👤</span>
        <span class="mc-persona-text"><b>方案B适合：</b>预算敏感、短途代步、老司机、车龄超5年</span>
      </div>
    </div>

    <div class="mc-card mc-adjust">
      <div class="mc-title">🛠 手动微调保养项目</div>
      <div class="mc-adjust-tip">勾选=纳入方案B · 调整倍率=延长周期（1.0x=原厂 / 1.5x=延长50% / 2.0x=翻倍）</div>
      ${adjustHTML}
    </div>
  `;

  const target = document.getElementById(targetId);
  if (target) {
    target.innerHTML = html;
  }
}

/**
 * 重新计算并重渲染整个对比面板
 * 任意手动调整（勾选/倍率）后由 onclick 触发
 */
function recalcMaintCompare() {
  const homePanel = document.getElementById('homeMaintCompare');
  const billsPanel = document.getElementById('maintComparePanel');
  if (homePanel && homePanel.innerHTML.trim()) {
    renderMaintCompare('homeMaintCompare');
  } else if (billsPanel) {
    renderMaintCompare('maintComparePanel');
  }
}

/**
 * 切换某保养项目在方案B中的包含/排除状态
 * 由微调列表中的复选框 onclick 触发
 * @param {string} itemId 项目ID（对应 MAINTENANCE_STANDARD[].id）
 */
function toggleMaintItem(itemId) {
  if (!manualOverrides || !manualOverrides[itemId]) return;
  manualOverrides[itemId].included = !manualOverrides[itemId].included;
  recalcMaintCompare();
}

/**
 * 调整某保养项目在方案B中的周期倍率
 * 由微调列表中的倍率按钮 onclick 触发
 * @param {string} itemId 项目ID
 * @param {number} multiplier 1.0 / 1.5 / 2.0
 */
function adjustMaintCycle(itemId, multiplier) {
  if (!manualOverrides || !manualOverrides[itemId]) return;
  manualOverrides[itemId].cycleMultiplier = multiplier;
  recalcMaintCompare();
}

/* ============================================================
   八、问AI 页面（静态回声）
   ============================================================ */

function renderAI() {
  const box = document.getElementById('aiMessages');
  // 首次进入插入欢迎语
  if (box.children.length === 0) {
    appendAIMessage('你好，我是车主AI助手 🤖，可以帮你分析油耗、保养和账单情况，试着问我吧～', 'bot');
  }
}

function appendAIMessage(text, role) {
  const box = document.getElementById('aiMessages');
  const div = document.createElement('div');
  div.className = 'ai-msg ' + role;
  div.textContent = text;
  box.appendChild(div);
  // 滚动到底部
  const body = document.querySelector('.ai-body');
  if (body) body.scrollTop = body.scrollHeight;
}

function sendAIMessage() {
  const input = document.getElementById('aiInput');
  const text = input.value.trim();
  if (!text) return;
  appendAIMessage(text, 'user');
  input.value = '';
  // 模拟回复（回声 + 引导）
  setTimeout(() => {
    const reply = `已收到你的问题：「${text}」\n这是演示版AI助手，暂未接入真实模型。后续将结合你的车辆数据给出智能分析建议。`;
    appendAIMessage(reply, 'bot');
  }, 400);
}

/* ============================================================
   九、我的 页面
   ============================================================ */

function renderMine() {
  const vehicles = getVehicles();
  const curId = getCurrentVehicle();

  // 用户资料
  document.getElementById('mineProfile').innerHTML = `
    <div class="card profile-card">
      <div class="profile-avatar">车</div>
      <div>
        <div class="profile-name">车主用户</div>
        <div class="profile-sub">已绑定 ${vehicles.length} 辆车 · 会员等级 普通用户</div>
      </div>
    </div>
  `;

  // 车辆列表/切换
  const vhtml = vehicles.map(v => {
    const on = v.id === curId;
    const isEv = v.type === 'newenergy';
    return `
      <div class="vehicle-pick-item" data-vehicle="${v.id}">
        <div class="vehicle-avatar" style="width:42px;height:42px;font-size:20px;border-radius:10px;">${isEv ? '⚡' : '⛽'}</div>
        <div class="vehicle-pick-info">
          <div class="vehicle-name">${esc(v.brand)} ${esc(v.model)}</div>
          <div class="vehicle-meta">${v.year}款 · ${esc(v.plate)} · ${(v.mileage || 0).toLocaleString()}km</div>
        </div>
        <div class="vehicle-pick-radio ${on ? 'on' : ''}"></div>
      </div>
    `;
  }).join('');
  document.getElementById('mineVehicles').innerHTML = `
    <div class="mine-section-title">我的车辆</div>
    <div class="card">${vhtml || '<div class="empty-tip">暂无车辆</div>'}</div>
  `;

  // 设置
  document.getElementById('mineSettings').innerHTML = `
    <div class="mine-section-title">设置</div>
    <div class="card">
      <div class="setting-row">
        <span class="setting-label">消息通知</span>
        <div class="switch on" data-setting="notify"></div>
      </div>
      <div class="setting-row">
        <span class="setting-label">里程单位</span>
        <span class="setting-val">公里 (km)</span>
      </div>
      <div class="setting-row">
        <span class="setting-label">货币单位</span>
        <span class="setting-val">人民币 (¥)</span>
      </div>
      <div class="setting-row">
        <span class="setting-label">关于我们</span>
        <span class="setting-val">v1.0.0 ›</span>
      </div>
      <div class="setting-row">
        <span class="setting-label">清除本地数据</span>
        <span class="setting-val" id="clearDataBtn" style="color:var(--danger)">清除 ›</span>
      </div>
    </div>
  `;
}

/* ============================================================
   十、模态框控制
   ============================================================ */

function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.add('active');
  // 默认填入今日日期
  const dateInput = modal.querySelector('input[name="date"]');
  if (dateInput && !dateInput.value) {
    dateInput.value = new Date().toISOString().slice(0, 10);
  }
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.remove('active');
  const form = modal.querySelector('form');
  if (form) form.reset();
}

/* ============================================================
   十一、事件绑定
   ============================================================ */

function bindEvents() {
  // 底部Tab切换
  document.querySelectorAll('.tabbar .tab').forEach(t => {
    t.addEventListener('click', () => switchTab(t.dataset.tab));
  });

  // 首页/服务页快捷操作 & 服务入口按钮（事件委托）
  document.body.addEventListener('click', (e) => {
    const actionEl = e.target.closest('[data-action]');
    if (!actionEl) return;
    const action = actionEl.dataset.action;
    if (action === 'refuel') openModal('modalRefuel');
    else if (action === 'maintenance') openModal('modalMaintenance');
    else if (action === 'repair') {
      switchTab('service');
      showToast('维修记录功能即将上线');
    } else if (action === 'wash') {
      showToast('洗车记录功能即将上线');
    } else if (action === 'parking') openModal('modalParking');
    else if (action === 'toll') openModal('modalToll');
    else if (action === 'violation') openModal('modalViolation');
    else if (action === 'maintManual') {
      renderMaintManual();
      openModal('modalMaintManual');
    }
  });

  // 首页"全部"跳转
  document.querySelectorAll('.link[data-tab]').forEach(l => {
    l.addEventListener('click', () => switchTab(l.dataset.tab));
  });

  // 模态框关闭
  document.querySelectorAll('[data-modal]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.modal));
  });
  // 点击遮罩关闭
  document.querySelectorAll('.modal-mask').forEach(mask => {
    mask.addEventListener('click', () => {
      const modal = mask.closest('.modal');
      if (modal) closeModal(modal.id);
    });
  });

  // 加油表单提交
  document.getElementById('refuelForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const record = {
      vehicleId: getCurrentVehicle(),
      date: fd.get('date'),
      mileage: Number(fd.get('mileage')),
      liters: Number(fd.get('liters')),
      pricePerLiter: Number(fd.get('pricePerLiter')),
      amount: Number(fd.get('amount')),
    };
    addRefuelRecord(record);
    closeModal('modalRefuel');
    showToast('加油记录已保存');
    // 刷新当前页
    const activeTab = document.querySelector('.tabbar .tab.active');
    if (activeTab) switchTab(activeTab.dataset.tab);
  });

  // 保养表单提交
  document.getElementById('maintenanceForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const record = {
      vehicleId: getCurrentVehicle(),
      date: fd.get('date'),
      mileage: Number(fd.get('mileage')),
      project: fd.get('project'),
      amount: Number(fd.get('amount')),
      shop: fd.get('shop'),
    };
    addMaintenanceRecord(record);
    closeModal('modalMaintenance');
    showToast('保养记录已保存');
    const activeTab = document.querySelector('.tabbar .tab.active');
    if (activeTab) switchTab(activeTab.dataset.tab);
  });

  // 停车表单提交
  document.getElementById('parkingForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const record = {
      id: genId('p'),
      vehicleId: getCurrentVehicle(),
      date: fd.get('date'),
      location: fd.get('location'),
      duration: fd.get('duration'),
      amount: Number(fd.get('amount')),
    };
    const all = getData(STORAGE_KEYS.parkingRecords, []);
    all.push(record);
    setData(STORAGE_KEYS.parkingRecords, all);
    closeModal('modalParking');
    showToast('停车记录已保存');
    const activeTab = document.querySelector('.tabbar .tab.active');
    if (activeTab) switchTab(activeTab.dataset.tab);
  });

  // 高速表单提交
  document.getElementById('tollForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const record = {
      id: genId('t'),
      vehicleId: getCurrentVehicle(),
      date: fd.get('date'),
      start: fd.get('start'),
      end: fd.get('end'),
      distance: fd.get('distance'),
      amount: Number(fd.get('amount')),
    };
    const all = getData(STORAGE_KEYS.tollRecords, []);
    all.push(record);
    setData(STORAGE_KEYS.tollRecords, all);
    closeModal('modalToll');
    showToast('高速记录已保存');
    const activeTab = document.querySelector('.tabbar .tab.active');
    if (activeTab) switchTab(activeTab.dataset.tab);
  });

  // 违章表单提交
  document.getElementById('violationForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const record = {
      id: genId('v'),
      vehicleId: getCurrentVehicle(),
      date: fd.get('date'),
      location: fd.get('location'),
      reason: fd.get('reason'),
      amount: Number(fd.get('amount')),
      fine: Number(fd.get('amount')),
      points: Number(fd.get('points')),
      status: fd.get('status'),
    };
    const all = getData(STORAGE_KEYS.violationRecords, []);
    all.push(record);
    setData(STORAGE_KEYS.violationRecords, all);
    closeModal('modalViolation');
    showToast('违章记录已保存');
    const activeTab = document.querySelector('.tabbar .tab.active');
    if (activeTab) switchTab(activeTab.dataset.tab);
  });

  // 趣味对比子Tab切换
  document.querySelectorAll('.compare-tab').forEach(t => {
    t.addEventListener('click', () => switchCompareTab(t.dataset.compare));
  });

  // 账单Tab切换
  document.querySelectorAll('.bill-tab').forEach(t => {
    t.addEventListener('click', () => switchBillType(t.dataset.billType));
  });

  // 问AI 发送
  document.getElementById('aiSend').addEventListener('click', sendAIMessage);
  document.getElementById('aiInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendAIMessage();
  });

  // 我的页 车辆切换（事件委托）
  document.getElementById('mineVehicles').addEventListener('click', (e) => {
    const item = e.target.closest('[data-vehicle]');
    if (!item) return;
    setCurrentVehicle(item.dataset.vehicle);
    currentCompareType = null;
    manualOverrides = null;
    const now = new Date();
    billType = 'month';
    billYear = now.getFullYear();
    billMonth = now.getMonth() + 1;
    renderMine();
    showToast('已切换当前车辆');
  });

  // 我的页 设置开关
  document.getElementById('mineSettings').addEventListener('click', (e) => {
    const sw = e.target.closest('.switch');
    if (sw) {
      sw.classList.toggle('on');
      return;
    }
    if (e.target.id === 'clearDataBtn') {
      if (confirm('确定清除所有本地数据并重置为初始模拟数据吗？')) {
        Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
        initSimData();
        switchTab('home');
        showToast('数据已重置');
      }
    }
  });
}

/* ============================================================
   十二、轻提示
   ============================================================ */

function showToast(msg) {
  let toast = document.getElementById('appToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'appToast';
    toast.style.cssText = `
      position: fixed; left: 50%; top: 50%; transform: translate(-50%, -50%);
      background: rgba(15,37,71,0.88); color: #fff; padding: 10px 18px;
      border-radius: 10px; font-size: 13px; z-index: 9999;
      opacity: 0; transition: opacity 0.25s ease; pointer-events: none;
      max-width: 80%; text-align: center;
    `;
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = '1';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.style.opacity = '0'; }, 1600);
}

/* ============================================================
   十三、应用初始化
   ============================================================ */

function initApp() {
  // 初始化模拟数据
  initSimData();
  // 绑定事件
  bindEvents();
  // 渲染默认首页
  renderHome();
}

// DOM 就绪后启动
document.addEventListener('DOMContentLoaded', initApp);
