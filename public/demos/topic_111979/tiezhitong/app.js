// ============ MOCK DATA ============
const trainsData = [
    { no: 'G1', type: '高铁', from: '北京南', to: '上海虹桥', depart: '07:00', arrive: '11:28', duration: '4小时28分', price: 553, status: '正点', typeCode: 'G' },
    { no: 'G3', type: '高铁', from: '北京南', to: '上海虹桥', depart: '08:00', arrive: '12:32', duration: '4小时32分', price: 553, status: '正点', typeCode: 'G' },
    { no: 'G5', type: '高铁', from: '北京南', to: '上海虹桥', depart: '09:00', arrive: '13:38', duration: '4小时38分', price: 553, status: '正点', typeCode: 'G' },
    { no: 'G7', type: '高铁', from: '北京南', to: '上海虹桥', depart: '10:00', arrive: '14:28', duration: '4小时28分', price: 553, status: '正点', typeCode: 'G' },
    { no: 'D301', type: '动车', from: '北京南', to: '上海', depart: '07:35', arrive: '15:27', duration: '7小时52分', price: 359, status: '正点', typeCode: 'D' },
    { no: 'D311', type: '动车', from: '北京南', to: '上海虹桥', depart: '08:15', arrive: '16:30', duration: '8小时15分', price: 359, status: '正点', typeCode: 'D' },
    { no: 'G101', type: '高铁', from: '北京南', to: '上海虹桥', depart: '06:44', arrive: '12:38', duration: '5小时54分', price: 553, status: '正点', typeCode: 'G' },
    { no: 'G107', type: '高铁', from: '北京南', to: '上海虹桥', depart: '07:25', arrive: '13:12', duration: '5小时47分', price: 553, status: '正点', typeCode: 'G' },
    { no: 'G13', type: '高铁', from: '北京南', to: '上海虹桥', depart: '11:00', arrive: '15:38', duration: '4小时38分', price: 553, status: '正点', typeCode: 'G' },
    { no: 'G17', type: '高铁', from: '北京南', to: '上海虹桥', depart: '12:00', arrive: '16:28', duration: '4小时28分', price: 553, status: '正点', typeCode: 'G' },
];

const routesData = [
    { id: 'JH-001', name: '京沪高铁', from: '北京南', to: '上海虹桥', length: '1318', speed: '350', stations: 24, status: '运营中' },
    { id: 'JG-001', name: '京广高铁', from: '北京西', to: '广州南', length: '2298', speed: '350', stations: 36, status: '运营中' },
    { id: 'HK-001', name: '沪昆高铁', from: '上海虹桥', to: '昆明南', length: '2252', speed: '300', stations: 51, status: '运营中' },
    { id: 'HJ-001', name: '哈大高铁', from: '哈尔滨西', to: '大连北', length: '921', speed: '350', stations: 23, status: '运营中' },
    { id: 'XC-001', name: '西成高铁', from: '西安北', to: '成都东', length: '658', speed: '250', stations: 22, status: '运营中' },
    { id: 'LJ-001', name: '兰新高铁', from: '兰州西', to: '乌鲁木齐', length: '1776', speed: '250', stations: 31, status: '运营中' },
];

const stockData = [
    { id: 'CR400AF-2001', model: 'CR400AF', type: '8辆编组', capacity: 576, route: '京沪高铁', status: '在运' },
    { id: 'CR400BF-3012', model: 'CR400BF', type: '16辆编组', capacity: 1193, route: '京广高铁', status: '在运' },
    { id: 'CRH380BL-5501', model: 'CRH380BL', type: '16辆编组', capacity: 1005, route: '沪昆高铁', status: '在运' },
    { id: 'CR400AF-2015', model: 'CR400AF', type: '8辆编组', capacity: 576, route: '京沪高铁', status: '检修' },
    { id: 'CRH2A-4001', model: 'CRH2A', type: '8辆编组', capacity: 610, route: '西成高铁', status: '在运' },
    { id: 'CR200J-1001', model: 'CR200J', type: '16辆编组', capacity: 918, route: '兰新高铁', status: '在运' },
];

const g1Stations = ['北京南', '天津南', '济南西', '泰安', '曲阜东', '徐州东', '南京南', '镇江南', '常州北', '无锡东', '苏州北', '上海虹桥'];
const stationDistances = [0, 131, 406, 463, 533, 688, 1018, 1083, 1144, 1201, 1237, 1318];

const ticketSalesData = [
    { order: 'E202607100001', train: 'G1', section: '北京南→上海虹桥', passenger: '李旅客', price: '¥553', seat: '二等座05车12A', time: '2026-07-09 14:23' },
    { order: 'E202607100002', train: 'G3', section: '北京南→南京南', passenger: '王小明', price: '¥443', seat: '一等座03车05F', time: '2026-07-09 15:10' },
    { order: 'E202607100003', train: 'D301', section: '北京南→济南西', passenger: '张女士', price: '¥184', seat: '二等座07车08C', time: '2026-07-09 16:45' },
    { order: 'E202607100004', train: 'G101', section: '天津南→上海虹桥', passenger: '赵先生', price: '¥510', seat: '二等座10车15D', time: '2026-07-09 18:02' },
    { order: 'E202607100005', train: 'G5', section: '北京南→上海虹桥', passenger: '陈总', price: '¥1748', seat: '商务座01车01A', time: '2026-07-09 19:30' },
];

let ordersData = [
    { orderNo: 'E202607080001', train: 'G1', from: '北京南', to: '上海虹桥', date: '2026-07-10', depart: '07:00', arrive: '11:28', passenger: '李旅客', seat: '二等座 05车12A', price: '¥553', status: '待出行' },
    { orderNo: 'E202607050002', train: 'G107', from: '上海虹桥', to: '北京南', date: '2026-07-05', depart: '07:25', arrive: '13:12', passenger: '李旅客', seat: '一等座 02车03A', price: '¥933', status: '已完成' },
    { orderNo: 'E202607010003', train: 'D301', from: '北京南', to: '上海', date: '2026-07-01', depart: '07:35', arrive: '15:27', passenger: '李旅客', seat: '二等座 06车10F', price: '¥359', status: '已完成' },
];

const contactsData = [
    { name: '李旅客', idType: '身份证', idNo: '110***********1234', phone: '138****1234', type: '成人' },
    { name: '王小明', idType: '身份证', idNo: '310***********5678', phone: '139****5678', type: '成人' },
    { name: '张女士', idType: '身份证', idNo: '110***********9012', phone: '136****9012', type: '成人' },
];

let currentBookingTrain = null;
let currentSeatPrice = 553;
let adminInited = false;
let userInited = false;

// ============ TRACK SLEEPERS ============
function generateSleepers() {
    const container = document.getElementById('sleepers');
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < 30; i++) {
        const s = document.createElement('div');
        s.className = 'track-sleeper';
        container.appendChild(s);
    }
}

// ============ APP NAVIGATION ============
function enterApp(mode) {
    document.getElementById('landingPage').style.display = 'none';
    if (mode === 'admin') {
        document.getElementById('adminApp').classList.add('active');
        if (!adminInited) {
            initAdminData();
            adminInited = true;
        }
    } else {
        document.getElementById('userApp').classList.add('active');
        if (!userInited) {
            initUserData();
            userInited = true;
        }
    }
}

function goToLanding() {
    document.getElementById('landingPage').style.display = 'flex';
    document.getElementById('adminApp').classList.remove('active');
    document.getElementById('userApp').classList.remove('active');
}

function switchAdminPage(pageId) {
    document.querySelectorAll('#adminApp .nav-item').forEach(el => el.classList.remove('active'));
    const navItem = document.querySelector(`#adminApp .nav-item[data-page="${pageId}"]`);
    if (navItem) navItem.classList.add('active');
    document.querySelectorAll('#adminApp .page-view').forEach(el => el.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    const titles = {
        'admin-dashboard': '数据看板',
        'admin-trains': '车次管理',
        'admin-routes': '线路管理',
        'admin-timetable': '时刻表编制',
        'admin-stock': '列车车辆',
        'admin-tickets': '票务统计',
        'admin-pricing': '票价管理'
    };
    document.getElementById('adminPageTitle').textContent = titles[pageId];
    if (pageId === 'admin-timetable') generateTimetable();
    if (pageId === 'admin-tickets') initTicketCharts();
}

function switchUserPage(pageId) {
    document.querySelectorAll('#userApp .nav-item').forEach(el => el.classList.remove('active'));
    const navItem = document.querySelector(`#userApp .nav-item[data-page="${pageId}"]`);
    if (navItem) navItem.classList.add('active');
    document.querySelectorAll('#userApp .page-view').forEach(el => el.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    const titles = {
        'user-search': '车票查询',
        'user-orders': '我的订单',
        'user-contact': '联系人管理',
        'user-guide': '购票须知'
    };
    document.getElementById('userPageTitle').textContent = titles[pageId];
}

// ============ MODALS ============
function openModal(id) {
    document.getElementById(id).classList.add('active');
}
function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.style.display = 'block';
    setTimeout(() => t.style.display = 'none', 2500);
}

// ============ ADMIN DATA INIT ============
function initAdminData() {
    renderTrainsTable();
    renderRoutesTable();
    renderStockTable();
    renderSalesChart();
    renderTicketSalesTable();
    renderPricingPreview();
    generateTimetable();
    initTicketCharts();
}

function renderTrainsTable() {
    const tbody = document.getElementById('trainsTableBody');
    tbody.innerHTML = trainsData.map(t => `
        <tr class="${t.status === '冲突' ? 'conflict-row' : ''}">
            <td class="font-display">${t.no}</td>
            <td><span class="badge badge-${t.typeCode === 'G' ? 'blue' : 'gold'}">${t.type}</span></td>
            <td>${t.from}</td>
            <td>${t.to}</td>
            <td>${t.depart}</td>
            <td>${t.arrive}</td>
            <td>${t.duration}</td>
            <td><span class="badge badge-${t.status === '正点' ? 'green' : t.status === '冲突' ? 'red' : 'gold'}">${t.status}</span></td>
            <td>
                <button class="btn btn-outline btn-sm" style="margin-right: 6px;" onclick="showToast('编辑车次 ${t.no}')">编辑</button>
                <button class="btn btn-danger btn-sm" onclick="showToast('已删除 ${t.no}')">删除</button>
            </td>
        </tr>
    `).join('');
}

function renderRoutesTable() {
    const tbody = document.getElementById('routesTableBody');
    tbody.innerHTML = routesData.map(r => `
        <tr>
            <td class="font-display">${r.id}</td>
            <td><strong>${r.name}</strong></td>
            <td>${r.from} → ${r.to}</td>
            <td>${r.length}</td>
            <td>${r.speed}</td>
            <td>${r.stations}</td>
            <td><span class="badge badge-green">${r.status}</span></td>
            <td>
                <button class="btn btn-outline btn-sm" style="margin-right: 6px;" onclick="showToast('编辑线路 ${r.name}')">编辑</button>
                <button class="btn btn-outline btn-sm" style="color: var(--railway-blue);" onclick="switchAdminPage('admin-timetable')">时刻表</button>
            </td>
        </tr>
    `).join('');
}

function renderStockTable() {
    const tbody = document.getElementById('stockTableBody');
    tbody.innerHTML = stockData.map(s => `
        <tr>
            <td class="font-display">${s.id}</td>
            <td>${s.model}</td>
            <td>${s.type}</td>
            <td>${s.capacity}人</td>
            <td>${s.route}</td>
            <td><span class="badge badge-${s.status === '在运' ? 'green' : 'gold'}">${s.status}</span></td>
            <td>
                <button class="btn btn-outline btn-sm" onclick="showToast('查看 ${s.id} 详情')">详情</button>
            </td>
        </tr>
    `).join('');
}

function renderSalesChart() {
    const chart = document.getElementById('salesChart');
    if (!chart || chart.children.length > 0) return;
    const data = [18234, 21045, 19876, 24521, 26890, 23456, 28456];
    const labels = ['7/4', '7/5', '7/6', '7/7', '7/8', '7/9', '今日'];
    const max = Math.max(...data);
    chart.innerHTML = data.map((v, i) => `
        <div class="chart-bar" style="height: ${(v/max)*200}px;">
            <span class="chart-bar-value">${(v/1000).toFixed(1)}K</span>
            <span class="chart-bar-label">${labels[i]}</span>
        </div>
    `).join('');
}

function initTicketCharts() {
    const routeChart = document.getElementById('routeChart');
    if (routeChart && routeChart.children.length === 0) {
        const data = [45230, 38920, 32100, 28450, 25600, 19800];
        const labels = ['京沪', '京广', '沪昆', '广深', '成渝', '西成'];
        const max = Math.max(...data);
        routeChart.innerHTML = data.map((v, i) => `
            <div class="chart-bar" style="height: ${(v/max)*200}px; background: linear-gradient(180deg, var(--railway-gold), #c49a35);">
                <span class="chart-bar-value">${(v/1000).toFixed(1)}K</span>
                <span class="chart-bar-label">${labels[i]}</span>
            </div>
        `).join('');
    }
    const dist = document.getElementById('ticketTypeDist');
    if (dist && dist.children.length === 0) {
        const types = [
            { name: '二等座', pct: 68, color: 'var(--railway-blue)' },
            { name: '一等座', pct: 20, color: 'var(--railway-gold)' },
            { name: '商务座', pct: 8, color: 'var(--railway-red)' },
            { name: '无座', pct: 4, color: 'var(--text-secondary)' }
        ];
        dist.innerHTML = types.map(t => `
            <div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                    <span style="font-size: 0.9rem;">${t.name}</span>
                    <span style="font-weight: 600; font-size: 0.9rem;">${t.pct}%</span>
                </div>
                <div style="height: 8px; background: var(--bg-light); border-radius: 4px; overflow: hidden;">
                    <div style="height: 100%; width: ${t.pct}%; background: ${t.color}; border-radius: 4px; transition: width 1s ease;"></div>
                </div>
            </div>
        `).join('');
    }
}

function renderTicketSalesTable() {
    const tbody = document.getElementById('ticketSalesBody');
    tbody.innerHTML = ticketSalesData.map(t => `
        <tr>
            <td class="font-display">${t.order}</td>
            <td class="font-display">${t.train}</td>
            <td>${t.section}</td>
            <td>${t.passenger}</td>
            <td style="color: var(--railway-red); font-weight: 600;">${t.price}</td>
            <td>${t.seat}</td>
            <td style="color: var(--text-secondary); font-size: 0.9rem;">${t.time}</td>
        </tr>
    `).join('');
}

function renderPricingPreview() {
    const routes = [
        { name: '京沪高铁', dist: 1318 },
        { name: '京广高铁', dist: 2298 },
        { name: '沪昆高铁', dist: 2252 },
        { name: '西成高铁', dist: 658 },
    ];
    const tbody = document.getElementById('pricingPreview');
    tbody.innerHTML = routes.map(r => {
        const base = r.dist * 0.45;
        const g2 = Math.round(base * 1.8);
        const g1 = Math.round(g2 * 1.7);
        const gsw = Math.round(g2 * 3.5);
        return `
            <tr>
                <td><strong>${r.name}</strong></td>
                <td>${r.dist} km</td>
                <td style="color: var(--railway-red); font-weight: 600;">¥${g2}</td>
                <td style="color: var(--railway-red); font-weight: 600;">¥${g1}</td>
                <td style="color: var(--railway-red); font-weight: 600;">¥${gsw}</td>
            </tr>
        `;
    }).join('');
}

// ============ TIMETABLE GENERATION ============
function generateTimetable() {
    const container = document.getElementById('timetableDisplay');
    if (!container) return;
    const startTime = document.getElementById('ttStartTime')?.value || '07:00';
    const speed = 300;
    const stopTime = 2;
    
    let [h, m] = startTime.split(':').map(Number);
    let currentMinutes = h * 60 + m;
    
    const timetableStations = g1Stations.map((s, i) => {
        if (i === 0) {
            return { station: s, arrive: null, depart: formatTime(currentMinutes), stop: '--', isEnd: false, isStart: true };
        }
        const dist = stationDistances[i] - stationDistances[i-1];
        const travelMin = Math.round((dist / speed) * 60);
        currentMinutes += travelMin;
        const arrive = formatTime(currentMinutes);
        if (i === g1Stations.length - 1) {
            return { station: s, arrive, depart: null, stop: '--', isEnd: true, isStart: false };
        }
        currentMinutes += stopTime;
        return { station: s, arrive, depart: formatTime(currentMinutes), stop: `${stopTime}分`, isEnd: false, isStart: false };
    });

    container.innerHTML = timetableStations.map((s, i) => `
        <div class="timeline-station ${s.isEnd ? 'end' : ''}">
            <div class="timeline-dot"></div>
            <div class="station-info">
                <span class="station-time-display" style="width: 55px; display: inline-block; text-align: center;">
                    ${s.arrive || '--:--'}
                </span>
                <span style="color: var(--text-secondary); margin: 0 8px;">到</span>
                <span class="station-time-display" style="width: 55px; display: inline-block; text-align: center;">
                    ${s.depart || '--:--'}
                </span>
                <span style="color: var(--text-secondary); margin: 0 8px;">开</span>
                <span class="station-name-display" style="margin: 0 16px; font-weight: 600; font-size: 1.05rem;">${s.station}</span>
                <span class="stop-duration">${s.stop ? `停靠 ${s.stop}` : ''}</span>
                ${i > 0 ? `<span style="color: var(--text-secondary); font-size: 0.8rem; margin-left: auto;">里程 ${stationDistances[i]}km</span>` : ''}
            </div>
        </div>
    `).join('');
}

function formatTime(totalMin) {
    const h = Math.floor(totalMin / 60) % 24;
    const m = totalMin % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
}

function showConflictCheck() {
    showToast('✅ 冲突检测完成：发现2处时间冲突，已标红显示');
}

// ============ USER SEARCH ============
function initUserData() {
    renderOrders();
    renderContacts();
}

function setTripType(type, el) {
    document.querySelectorAll('.trip-type-tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
}

function swapStations() {
    const from = document.getElementById('fromStation');
    const to = document.getElementById('toStation');
    [from.value, to.value] = [to.value, from.value];
}

function quickSearch(from, to) {
    document.getElementById('fromStation').value = from;
    document.getElementById('toStation').value = to;
    searchTrains();
}

function searchTrains() {
    const from = document.getElementById('fromStation').value;
    const to = document.getElementById('toStation').value;
    document.getElementById('noSearchYet').style.display = 'none';
    document.getElementById('searchResults').style.display = 'block';
    
    const list = document.getElementById('trainList');
    list.innerHTML = trainsData.map(t => `
        <div class="train-card" data-type="${t.typeCode}" onclick="openBookModal('${t.no}', '${t.from}', '${t.to}', '${t.depart}', '${t.arrive}', '${t.duration}', ${t.price})">
            <div>
                <div class="train-no">${t.no}</div>
                <div class="train-type">
                    <span class="badge badge-${t.typeCode === 'G' ? 'blue' : 'gold'}">${t.type}</span>
                </div>
            </div>
            <div class="train-schedule">
                <div class="station-time">
                    <div class="time">${t.depart}</div>
                    <div class="station-name">${t.from}</div>
                </div>
                <div class="duration-line">
                    <div class="duration-text">${t.duration}</div>
                    <div class="duration-track"></div>
                </div>
                <div class="station-time">
                    <div class="time">${t.arrive}</div>
                    <div class="station-name">${t.to}</div>
                </div>
            </div>
            <div style="font-size: 0.85rem; color: var(--text-secondary);">
                当日到达
            </div>
            <div class="train-price">
                <div class="price-value">¥${t.price}</div>
                <div class="price-label">二等座起</div>
                <button class="btn btn-gold btn-sm" style="margin-top: 8px; width: 100%;" onclick="event.stopPropagation(); openBookModal('${t.no}', '${t.from}', '${t.to}', '${t.depart}', '${t.arrive}', '${t.duration}', ${t.price})">
                    购票
                </button>
            </div>
        </div>
    `).join('') + `
        <div class="train-card" data-type="transfer" style="border-color: var(--railway-gold);">
            <div>
                <div class="transfer-badge">
                    <span>🔄</span> 中转方案
                </div>
                <div class="train-type" style="margin-top: 4px;">
                    <span class="badge badge-blue">G101</span> + <span class="badge badge-blue">G7543</span>
                </div>
            </div>
            <div class="train-schedule">
                <div class="station-time">
                    <div class="time">06:44</div>
                    <div class="station-name">${from}</div>
                </div>
                <div class="duration-line">
                    <div class="duration-text">南京南中转 · 全程6小时22分</div>
                    <div class="duration-track"></div>
                </div>
                <div class="station-time">
                    <div class="time">13:06</div>
                    <div class="station-name">${to}</div>
                </div>
            </div>
            <div style="font-size: 0.85rem; color: var(--warning);">
                换乘时间34分钟
            </div>
            <div class="train-price">
                <div class="price-value">¥568</div>
                <div class="price-label">中转总价</div>
                <button class="btn btn-outline btn-sm" style="margin-top: 8px; width: 100%;" onclick="event.stopPropagation(); showToast('中转方案详情已展示')">
                    查看详情
                </button>
            </div>
        </div>
    `;
}

function filterResult(type, el) {
    document.querySelectorAll('#user-search .tabs .tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    document.querySelectorAll('.train-card').forEach(card => {
        if (type === 'all') {
            card.style.display = 'grid';
        } else {
            card.style.display = card.dataset.type === type ? 'grid' : 'none';
        }
    });
}

// ============ BOOKING ============
function openBookModal(no, from, to, depart, arrive, duration, price) {
    currentBookingTrain = { no, from, to, depart, arrive, duration, price };
    currentSeatPrice = price;
    document.getElementById('bookModalTitle').textContent = `${no}次 购票`;
    document.getElementById('bookTrainInfo').innerHTML = `
        <div style="display: flex; align-items: center; gap: 20px; justify-content: center;">
            <div style="text-align: center;">
                <div style="font-family: 'Oswald'; font-size: 1.5rem; font-weight: 700;">${depart}</div>
                <div style="font-weight: 600; margin-top: 4px;">${from}</div>
            </div>
            <div style="flex: 1; text-align: center;">
                <div style="font-size: 0.8rem; color: var(--text-secondary);">${duration}</div>
                <div style="height: 2px; background: var(--border-color); margin: 8px 0; position: relative;">
                    <div style="position: absolute; left: 0; top: 50%; width: 10px; height: 10px; border-radius: 50%; background: var(--railway-blue); transform: translate(-50%, -50%);"></div>
                    <div style="position: absolute; right: 0; top: 50%; width: 10px; height: 10px; border-radius: 50%; background: var(--railway-red); transform: translate(50%, -50%);"></div>
                </div>
                <div style="font-size: 0.8rem; color: var(--success);">${no}次 有票</div>
            </div>
            <div style="text-align: center;">
                <div style="font-family: 'Oswald'; font-size: 1.5rem; font-weight: 700;">${arrive}</div>
                <div style="font-weight: 600; margin-top: 4px;">${to}</div>
            </div>
        </div>
    `;
    document.querySelectorAll('.seat-option').forEach((opt, i) => {
        opt.classList.remove('selected');
        if (i === 0) opt.classList.add('selected');
    });
    currentSeatPrice = price;
    openModal('bookModal');
}

function selectSeat(el) {
    document.querySelectorAll('.seat-option').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
    currentSeatPrice = parseInt(el.dataset.price);
}

function confirmBooking() {
    closeModal('bookModal');
    if (currentBookingTrain) {
        const newOrder = {
            orderNo: 'E' + Date.now().toString().slice(-12),
            train: currentBookingTrain.no,
            from: currentBookingTrain.from,
            to: currentBookingTrain.to,
            date: document.getElementById('travelDate').value,
            depart: currentBookingTrain.depart,
            arrive: currentBookingTrain.arrive,
            passenger: '李旅客',
            seat: currentSeatPrice === 553 ? '二等座' : currentSeatPrice === 933 ? '一等座' : '商务座' + ' 待分配',
            price: '¥' + currentSeatPrice,
            status: '待出行'
        };
        ordersData.unshift(newOrder);
        renderOrders();
        showToast('🎉 购票成功！可在"我的订单"中查看');
    }
}

// ============ ORDERS ============
function renderOrders(filter = 'all') {
    const container = document.getElementById('ordersList');
    let filtered = ordersData;
    if (filter !== 'all') {
        if (filter === 'pending') filtered = ordersData.filter(o => o.status === '待出行');
        else if (filter === 'done') filtered = ordersData.filter(o => o.status === '已完成');
        else if (filter === 'paid') filtered = ordersData.filter(o => o.status !== '已退票');
        else if (filter === 'refund') filtered = ordersData.filter(o => o.status === '已退票');
    }
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="card">
                <div class="card-body" style="text-align: center; padding: 60px 20px;">
                    <div style="font-size: 3rem; margin-bottom: 16px;">📋</div>
                    <p style="color: var(--text-secondary);">暂无相关订单</p>
                </div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = filtered.map(o => `
        <div class="order-card">
            <div class="order-header">
                <div>
                    <span class="order-no">${o.orderNo}</span>
                    <span class="badge badge-${o.status === '待出行' ? 'green' : o.status === '已完成' ? 'gray' : 'red'}" style="margin-left: 12px;">${o.status}</span>
                </div>
                <div style="display: flex; gap: 8px;">
                    ${o.status === '待出行' ? `<button class="btn btn-outline btn-sm" onclick="refundOrder('${o.orderNo}')">退票</button>` : ''}
                    <button class="btn btn-outline btn-sm" onclick="showToast('订单详情已展开')">详情</button>
                </div>
            </div>
            <div class="order-body">
                <div style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 12px;">${o.date} 发车</div>
                <div class="order-route">
                    <div style="text-align: center;">
                        <div style="font-family: 'Oswald'; font-size: 1.4rem; font-weight: 700;">${o.depart}</div>
                        <div style="font-weight: 600;">${o.from}</div>
                    </div>
                    <div style="flex: 1; height: 2px; background: var(--border-color); position: relative; margin: 0 20px;">
                        <div style="position: absolute; left: 0; top: 50%; width: 10px; height: 10px; border-radius: 50%; background: var(--railway-blue); transform: translate(-50%, -50%);"></div>
                        <div style="position: absolute; right: 0; top: 50%; width: 10px; height: 10px; border-radius: 50%; background: var(--railway-red); transform: translate(50%, -50%);"></div>
                        <div style="position: absolute; top: -10px; left: 50%; transform: translateX(-50%); font-size: 0.8rem; color: var(--text-secondary); white-space: nowrap;">${o.train}次</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-family: 'Oswald'; font-size: 1.4rem; font-weight: 700;">${o.arrive}</div>
                        <div style="font-weight: 600;">${o.to}</div>
                    </div>
                </div>
                <div class="order-passengers">
                    <div class="passenger-info">
                        <div class="passenger-label">乘车人</div>
                        <div>${o.passenger}</div>
                    </div>
                    <div class="passenger-info">
                        <div class="passenger-label">座位</div>
                        <div>${o.seat}</div>
                    </div>
                    <div class="passenger-info">
                        <div class="passenger-label">票价</div>
                        <div style="color: var(--railway-red); font-weight: 700; font-size: 1.1rem;">${o.price}</div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function filterOrders(type, el) {
    document.querySelectorAll('#user-orders .tabs .tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    renderOrders(type);
}

function refundOrder(orderNo) {
    const order = ordersData.find(o => o.orderNo === orderNo);
    if (order) {
        order.status = '已退票';
        renderOrders();
        showToast('退票申请已提交，票款将在3-5个工作日内退回');
    }
}

// ============ CONTACTS ============
function renderContacts() {
    const tbody = document.getElementById('contactsTable');
    tbody.innerHTML = contactsData.map(c => `
        <tr>
            <td><strong>${c.name}</strong></td>
            <td>${c.idType}</td>
            <td>${c.idNo}</td>
            <td>${c.phone}</td>
            <td><span class="badge badge-blue">${c.type}</span></td>
            <td>
                <button class="btn btn-outline btn-sm" style="margin-right: 6px;" onclick="showToast('编辑联系人 ${c.name}')">编辑</button>
                <button class="btn btn-danger btn-sm" onclick="showToast('已删除联系人 ${c.name}')">删除</button>
            </td>
        </tr>
    `).join('');
}

// ============ INIT ============
document.addEventListener('DOMContentLoaded', () => {
    generateSleepers();
    
    // Set today's date as default
    const dateInput = document.getElementById('travelDate');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
    }
    
    // Close modals on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.remove('active');
            }
        });
    });
});

generateSleepers();
