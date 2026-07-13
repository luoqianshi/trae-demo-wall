const API = window.apiClient;

/* ========== Flat Icons (24x24 SVG) ========== */
const ICONS = {
  home: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>',
  circle: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>',
  add: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>',
  user: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  search: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
  activity: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>',
  publish: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>',
  order: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
  auth: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
  needs: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
  logout: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
};

/* ========== State ========== */
const state = {
  route: "home",
  activeCategory: "全部",
  searchKeyword: "",
  selectedNeedId: 1,
  selectedCircleId: 1,
  isLoggedIn: false,
  token: localStorage.getItem("linkhood_token") || "",
  user: null,
  circles: [],
  needs: [],
  activities: [],
  orders: [],
  feedbacks: [],
  authItems: [],
  joinedCircles: [],
  loading: false,
};

const categoryMap = {
  "全部": "",
  "活动": "activity",
  "闲置物品": "idle_item",
  "技能服务": "skill_service",
  "居家创业": "home_business",
  "那些事儿": "feedback",
};
const categoryReverse = {
  activity: "活动",
  idle_item: "闲置物品",
  skill_service: "技能服务",
  home_business: "居家创业",
  feedback: "那些事儿",
};
const circleTypeMap = { community: "小区", university: "大学", friends: "朋友圈" };

/* ========== Initialization & Data Loading ========== */
async function init() {
  if (state.token) {
    try {
      const res = await API.auth.me();
      if (res.success) {
        state.isLoggedIn = true;
        state.user = res.data;
      }
    } catch (e) {
      localStorage.removeItem('linkhood_token');
      state.token = "";
      state.isLoggedIn = false;
      state.user = null;
    }
  }
  await Promise.all([loadCircles(), loadNeeds(), loadActivities(), loadFeedbacks()]);
  if (state.isLoggedIn) {
    await Promise.all([loadOrders(), loadAuthItems(), loadJoinedCircles()]);
  }
  render();
}

async function loadCircles() {
  try {
    const res = await API.circles.list();
    if (res.success) state.circles = res.data;
  } catch (e) { console.error(e); }
}

async function loadNeeds() {
  try {
    const cat = categoryMap[state.activeCategory] || "";
    const res = await API.needs.list({ category: cat, limit: 50 });
    if (res.success) state.needs = res.data.list || [];
  } catch (e) { console.error(e); }
}

async function loadActivities() {
  try {
    const res = await API.activities.list();
    if (res.success) state.activities = res.data || [];
  } catch (e) { console.error(e); }
}

async function loadFeedbacks() {
  try {
    const res = await API.feedbacks.list();
    if (res.success) state.feedbacks = res.data || [];
  } catch (e) { console.error(e); }
}

async function loadOrders() {
  try {
    const res = await API.orders.list();
    if (res.success) state.orders = res.data || [];
  } catch (e) { console.error(e); }
}

async function loadAuthItems() {
  try {
    const res = await API.auth.myAuths();
    if (res.success) state.authItems = res.data || [];
  } catch (e) { console.error(e); }
}

async function loadJoinedCircles() {
  try {
    const res = await API.circles.joined();
    if (res.success) state.joinedCircles = res.data || [];
  } catch (e) { console.error(e); }
}

/* ========== Global Utility Functions ========== */
function routeTo(route, params = {}) {
  state.route = route;
  if (params.needId) state.selectedNeedId = Number(params.needId);
  if (params.circleId) state.selectedCircleId = Number(params.circleId);
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showToast(message) {
  const toast = document.querySelector("#toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("active");
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => toast.classList.remove("active"), 2400);
}

function openModal(title, bodyHtml) {
  const modal = document.querySelector("#modal");
  modal.innerHTML = `
    <div class="modal-card">
      <div class="modal-head">
        <div>
          <h2>${title}</h2>
          <p class="muted">邻聚平台交互弹窗</p>
        </div>
        <button class="btn-icon" onclick="closeModal()">x</button>
      </div>
      ${bodyHtml}
    </div>
  `;
  modal.classList.add("active");
}

function closeModal() {
  document.querySelector("#modal").classList.remove("active");
}

/* ========== Layout Shell ========== */
function shell(content) {
  const isLoggedIn = state.isLoggedIn;
  return `
    <div class="app-shell">
      <header class="topbar" style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;">
        <button class="brand" onclick="routeTo('home')">
          <span class="brand-logo">邻</span>
          <span class="brand-title">邻聚</span>
        </button>
        <div class="top-actions">
          ${isLoggedIn
            ? `<button class="btn-primary btn-sm" onclick="routeTo('publish')">+ 发布</button>
               <button class="btn-icon" onclick="handleLogout()" title="退出">${ICONS.logout}</button>`
            : `<button class="btn-primary btn-sm" onclick="routeTo('login')">登录</button>`}
        </div>
      </header>
      <main class="container">
        <div class="page active">
          ${content}
        </div>
      </main>
    </div>
    ${bottomNav()}
    <div id="modal" class="modal" onclick="if(event.target.id==='modal') closeModal()"></div>
    <div id="toast" class="toast"></div>
  `;
}

/* ========== Bottom Navigation ========== */
function bottomNav() {
  if (!state.isLoggedIn) return '';
  const items = [
    ["home", ICONS.home, "首页"],
    ["circles", ICONS.circle, "邻圈"],
    ["publish", ICONS.add, "发布"],
    ["mine", ICONS.user, "我的"],
  ];
  return `
    <nav class="bottom-nav">
      ${items.map(([route, icon, label]) => `
        <button class="nav-item ${state.route === route ? "active" : ""}" onclick="routeTo('${route}')">
          <span class="nav-icon">${icon}</span>
          <span>${label}</span>
        </button>
      `).join("")}
    </nav>
  `;
}

/* ========== Shared Card Components ========== */
function needCard(item) {
  const cat = categoryReverse[item.category] || item.category;
  const publisher = item.publisher || {};
  const catTagClass = cat === "活动" ? "tag-primary" : cat === "闲置物品" ? "tag-gray" : cat === "技能服务" ? "tag-green" : cat === "居家创业" ? "tag-orange" : "tag-purple";
  return `
    <article class="card need-card card-clickable" onclick="showNeedDetail(${item.id})">
      <div class="tag-list">
        <span class="tag ${catTagClass}">${cat}</span>
        <span class="tag tag-gray">${item.distance || '本邻圈'}</span>
      </div>
      <h3>${item.title}</h3>
      <div class="tag-list">${(item.tags || []).map((tag) => `<span class="tag tag-gray">${tag}</span>`).join("")}</div>
      <div class="card-meta">
        <div class="card-author">
          <span class="card-avatar">${(publisher.nickname || 'U')[0]}</span>
          <div class="card-author-info">
            <strong>${publisher.nickname || '用户'}</strong>
            <span class="muted">信用 ${publisher.creditScore || 70}</span>
          </div>
        </div>
        <div class="card-price">${item.price || ''}</div>
      </div>
      <div class="card-actions">
        <span class="muted">${item.circle?.name || ''} · ${item.boosts || 0} 助力</span>
        <button class="btn-primary btn-sm" onclick="event.stopPropagation(); showNeedDetail(${item.id})">查看</button>
      </div>
    </article>
  `;
}

function circleCard(circle) {
  const typeName = circleTypeMap[circle.type] || circle.type;
  const services = (circle.services || []).slice(0, 4);
  return `
    <article class="card circle-card card-clickable" onclick="showCircleDetail(${circle.id})">
      <div class="tag-list">
        <span class="tag tag-primary">${typeName}</span>
        <span class="tag tag-green">${circle.safetyInfo || ''}</span>
      </div>
      <h3>${circle.name}</h3>
      <div class="tag-list">${services.map((s) => `<span class="tag tag-gray">${s}</span>`).join("")}</div>
      <div class="card-meta">
        <span class="muted">${(circle.memberCount || 0).toLocaleString()} 位成员</span>
      </div>
      <div class="card-actions">
        <button class="btn-secondary btn-sm" onclick="event.stopPropagation(); openJoin(${circle.id})">申请加入</button>
        <button class="btn-primary btn-sm" onclick="event.stopPropagation(); showCircleDetail(${circle.id})">详情</button>
      </div>
    </article>
  `;
}

function activityCard(item) {
  return `
    <article class="card activity-card card-clickable" onclick="joinActivity(${item.id})">
      <span class="tag tag-orange">${item.type === 'sports' ? '体育' : item.type === 'culture' ? '文化' : item.type === 'game' ? '棋牌' : '其他'}</span>
      <h3>${item.title}</h3>
      <p class="muted">${formatTime(item.eventTime)} · ${item.location || ''}</p>
      <div class="card-actions">
        <span class="muted">${item.enrolledCount || 0} 人报名</span>
        <button class="btn-primary btn-sm" onclick="event.stopPropagation(); joinActivity(${item.id})">报名</button>
      </div>
    </article>
  `;
}

/* ========== Event Handlers ========== */
async function handleLogin() {
  const username = document.querySelector('#loginUsername').value;
  const password = document.querySelector('#loginPassword').value;
  if (!username || !password) return showToast('请填写用户名和密码');
  try {
    const res = await API.auth.login({ username, password });
    if (res.success) {
      localStorage.setItem('linkhood_token', res.data.token);
      state.token = res.data.token;
      state.isLoggedIn = true;
      state.user = res.data;
      await init();
      routeTo('home');
      showToast('登录成功');
    }
  } catch (e) {
    showToast(e.message || '登录失败');
  }
}

async function handleRegister() {
  const username = document.querySelector('#regUsername').value;
  const nickname = document.querySelector('#regNickname').value;
  const password = document.querySelector('#regPassword').value;
  if (!username || !password) return showToast('请填写用户名和密码');
  try {
    const res = await API.auth.register({ username, password, nickname });
    if (res.success) {
      showToast('注册成功，请登录');
      routeTo('login');
    }
  } catch (e) {
    showToast(e.message || '注册失败');
  }
}

function handleLogout() {
  localStorage.removeItem('linkhood_token');
  state.token = '';
  state.isLoggedIn = false;
  state.user = null;
  routeTo('login');
  showToast('已退出登录');
}

async function handleEnroll(id) {
  if (!state.isLoggedIn) return showToast('请先登录');
  try {
    const res = await API.activities.enroll(id);
    if (res.success) { showToast('报名成功'); await loadActivities(); render(); }
  } catch (e) { showToast(e.message || '报名失败'); }
}

async function handleBoostFeedback(id) {
  if (!state.isLoggedIn) return showToast('请先登录');
  try {
    const res = await API.feedbacks.boost(id);
    if (res.success) { showToast('助力成功'); await loadFeedbacks(); render(); }
  } catch (e) { showToast(e.message || '助力失败'); }
}

async function switchCategory(cat) {
  state.activeCategory = cat;
  await loadNeeds();
  render();
}

function handleSearch() {
  const input = document.querySelector('#globalSearch');
  if (input) state.searchKeyword = input.value.trim();
  routeTo('needs');
}

async function handleBoostNeed(id) {
  if (!state.isLoggedIn) return showToast('请先登录');
  try {
    const res = await API.needs.boost(id);
    if (res.success) { showToast('助力成功'); await loadNeeds(); render(); }
  } catch (e) { showToast(e.message || '助力失败'); }
}

function createOrder(title, needId) {
  if (!state.isLoggedIn) return showToast('请先登录');
  const now = new Date();
  const defaultTime = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0') + 'T19:30';
  openModal(
    "发起交易意向",
    `
      <div class="form-grid">
        <label class="field"><span>交易地点</span><input id="orderLocation" value="社区共享客厅 / 校园广场"></label>
        <label class="field"><span>交易时间</span><input id="orderTime" type="datetime-local" value="${defaultTime}"></label>
        <label class="field full"><span>留言</span><textarea id="orderMessage">你好，我想接受「${title}」，可以确认时间和地点吗？</textarea></label>
      </div>
      <div class="card-actions">
        <button class="btn-primary" onclick="submitOrder(${needId})">确认发起</button>
      </div>
    `
  );
}

async function submitOrder(needId) {
  const location = document.querySelector('#orderLocation')?.value;
  const time = document.querySelector('#orderTime')?.value;
  closeModal();
  try {
    await API.orders.create({ needId, meetLocation: location, meetTime: time });
    showToast('交易意向已发送');
    await loadOrders();
    routeTo('orders');
  } catch (e) {
    showToast(e.message || '创建订单失败');
  }
}

async function openJoin(circleId) {
  if (!state.isLoggedIn) return showToast('请先登录');
  const circle = state.circles.find((item) => item.id === circleId);
  if (!circle) return;

  let verifyHtml = '';
  let tipHtml = '提交后管理员将在 24 小时内审核。';
  if (circle.type === 'community') {
    verifyHtml = `<label class="field"><span>验证方式</span><select id="joinVerify"><option>定位 + 管理员审核</option></select></label>`;
  } else if (circle.type === 'university') {
    verifyHtml = `<label class="field"><span>验证方式</span><select id="joinVerify"><option>学信网/学籍认证</option></select></label>`;
  } else if (circle.type === 'friends') {
    verifyHtml = `<label class="field full"><span>验证方式</span><div class="tag-list"><span class="chip active">授权微信好友列表</span></div></label>`;
    tipHtml = '授权后系统将自动匹配你与圈内成员的微信好友关系。';
  }

  openModal(
    `申请加入 ${circle.name}`,
    `
      <div class="form-grid">
        ${verifyHtml}
        <label class="field"><span>真实姓名</span><input id="joinName" placeholder="请输入姓名"></label>
        <label class="field full"><span>补充说明</span><textarea id="joinReason" placeholder="例如楼栋房号、学院班级、共同好友等"></textarea></label>
      </div>
      <div class="card-actions">
        <span class="muted">${tipHtml}</span>
        <button class="btn-primary" onclick="submitJoin(${circleId})">提交申请</button>
      </div>
    `
  );
}

async function submitJoin(circleId) {
  const reason = document.querySelector('#joinReason')?.value || '';
  closeModal();
  try {
    const res = await API.circles.join(circleId, { applyReason: reason });
    showToast(res.message || '申请已提交');
  } catch (e) {
    showToast(e.message || '申请失败');
  }
}

function openOrder(orderNo, status) {
  const statusMap = { pending_pay: "待支付", pending_participate: "待参与", pending_review: "待评价", completed: "已完成", cancelled: "已取消" };
  openModal(
    `订单 ${orderNo}`,
    `
      <div class="timeline">
        <div class="timeline-item"><time>1</time><div><strong>接受需求</strong><p class="muted">买卖或活动双方建立交易意向。</p></div></div>
        <div class="timeline-item"><time>2</time><div><strong>确认时间地点</strong><p class="muted">约定线下见面的公共安全地点。</p></div></div>
        <div class="timeline-item"><time>3</time><div><strong>平台担保支付</strong><p class="muted">参考闲鱼模式，完成确认后释放款项。</p></div></div>
        <div class="timeline-item"><time>4</time><div><strong>评价反馈</strong><p class="muted">影响用户信用分和邻圈能力体系。</p></div></div>
      </div>
      <div class="card-actions">
        <span class="status status-waiting">当前：${statusMap[status] || status}</span>
        <button class="btn-primary" onclick="closeModal(); showToast('已更新订单状态')">确认下一步</button>
      </div>
    `
  );
}

function openAuth(title, type) {
  openModal(
    title,
    `
      <div class="form-grid">
        <label class="field"><span>认证姓名</span><input id="authName" placeholder="请输入真实姓名"></label>
        <label class="field"><span>证件/资质编号</span><input id="authCert" placeholder="身份证、学籍或行业资质编号"></label>
        <label class="field full"><span>说明</span><textarea id="authDesc" placeholder="请补充认证用途和相关说明"></textarea></label>
      </div>
      <div class="card-actions">
        <button class="btn-primary" onclick="submitAuth('${type}')">提交审核</button>
      </div>
    `
  );
}

async function submitAuth(type) {
  const realName = document.querySelector('#authName')?.value;
  const certNo = document.querySelector('#authCert')?.value;
  const description = document.querySelector('#authDesc')?.value;
  closeModal();
  try {
    await API.auth.submitAuth({ type, realName, certNo, description });
    showToast('认证资料已提交');
    await loadAuthItems();
    render();
  } catch (e) {
    showToast(e.message || '提交失败');
  }
}

async function handlePublish() {
  const title = document.querySelector('#pubTitle').value;
  const description = document.querySelector('#pubDesc').value;
  const category = document.querySelector('#pubCategory').value;
  const price = document.querySelector('#pubPrice').value;
  const circleId = document.querySelector('#pubCircle').value;
  const address = document.querySelector('#pubAddress').value;
  const contact = document.querySelector('#pubContact').value;
  if (!title || !category || !circleId) return showToast('标题、分类和邻圈不能为空');
  try {
    await API.needs.create({ title, description, category, price, circleId: Number(circleId), address, contact });
    showToast('发布成功');
    await loadNeeds();
    routeTo('needs');
  } catch (e) {
    showToast(e.message || '发布失败');
  }
}

/* ========== New Aliases for Exposed Functions ========== */
function showNeedDetail(needId) {
  routeTo('needDetail', { needId });
}

function showCircleDetail(circleId) {
  routeTo('circleDetail', { circleId });
}

function joinActivity(id) {
  return handleEnroll(id);
}

function upvoteFeedback(id) {
  return handleBoostFeedback(id);
}

/* ========== Helper ========== */
function formatTime(iso) {
  if (!iso) return '待定';
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  const now = new Date();
  const diff = d - now;
  const days = Math.floor(diff / 86400000);
  if (days === 0) return `今天 ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  if (days === 1) return `明天 ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  if (days > 1 && days < 7) return `${days}天后`;
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

/* ========== Page Renderers ========== */

/** 登录页 */
function loginPage() {
  return shell(`
    <div class="page-header" style="text-align:center;padding:16px 0;">
      <h2 class="section-title">登录</h2>
    </div>
    <div class="section">
      <article class="card">
        <div class="form-grid" style="grid-template-columns:1fr">
          <label class="field"><span>用户名</span><input id="loginUsername" placeholder="请输入用户名"></label>
          <label class="field"><span>密码</span><input id="loginPassword" type="password" placeholder="请输入密码"></label>
        </div>
        <div class="card-actions" style="margin-top:20px">
          <button class="btn-secondary" onclick="routeTo('register')">去注册</button>
          <button class="btn-primary" onclick="handleLogin()">登录</button>
        </div>
      </article>
    </div>
  `);
}

/** 注册页 */
function registerPage() {
  return shell(`
    <div class="page-header" style="text-align:center;padding:16px 0;">
      <h2 class="section-title">注册</h2>
    </div>
    <div class="section">
      <article class="card">
        <div class="form-grid" style="grid-template-columns:1fr">
          <label class="field"><span>用户名</span><input id="regUsername" placeholder="用户名"></label>
          <label class="field"><span>昵称</span><input id="regNickname" placeholder="昵称"></label>
          <label class="field"><span>密码</span><input id="regPassword" type="password" placeholder="密码"></label>
        </div>
        <div class="card-actions" style="margin-top:20px">
          <button class="btn-secondary" onclick="routeTo('login')">去登录</button>
          <button class="btn-primary" onclick="handleRegister()">注册</button>
        </div>
      </article>
    </div>
  `);
}

/** 首页 */
function homePage() {
  const needs = state.needs.slice(0, 3);
  const activities = state.activities.slice(0, 2);
  const feedbacks = state.feedbacks.slice(0, 3);
  return shell(`
    <div class="section" style="margin-bottom: 8px;">
      <div class="card" style="padding: 12px 16px;">
        <label class="search-box" style="margin-bottom: 8px;">
          ${ICONS.search}
          <input id="globalSearch" placeholder="搜索活动、闲置、技能、民生建议" onkeydown="if(event.key==='Enter') handleSearch()" />
        </label>
        <div class="service-grid">
          <div class="service-item" onclick="routeTo('circles')">
            ${ICONS.circle}
            <strong>加入邻圈</strong>
          </div>
          <div class="service-item" onclick="routeTo('needs')">
            ${ICONS.needs}
            <strong>浏览供需</strong>
          </div>
          <div class="service-item" onclick="routeTo('social')">
            ${ICONS.activity}
            <strong>参加活动</strong>
          </div>
          <div class="service-item" onclick="routeTo('publish')">
            ${ICONS.publish}
            <strong>发布需求</strong>
          </div>
          <div class="service-item" onclick="routeTo('orders')">
            ${ICONS.order}
            <strong>我的订单</strong>
          </div>
          <div class="service-item" onclick="routeTo('auth')">
            ${ICONS.auth}
            <strong>认证中心</strong>
          </div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-head">
        <h2 class="section-title">热门供需</h2>
        <button class="btn-ghost btn-sm" onclick="routeTo('needs')">更多</button>
      </div>
      ${needs.length ? needs.map(needCard).join("") : '<div class="empty-state">暂无内容</div>'}
    </div>

    <div class="section">
      <div class="card" style="padding: 12px 16px;">
        <div class="section-head" style="margin-bottom: 8px;">
          <h2 class="section-title">推荐活动</h2>
          <button class="btn-ghost btn-sm" onclick="routeTo('social')">更多</button>
        </div>
        <div class="feature-list">
          ${activities.length ? activities.map(a => `
            <div class="feature-row" onclick="joinActivity(${a.id})">
              <div>
                <strong>${a.title}</strong><br>
                <span class="muted">${formatTime(a.eventTime)} · ${a.location || ''}</span>
              </div>
              <span class="tag tag-orange">${a.enrolledCount || 0}人报名</span>
            </div>
          `).join("") : '<div class="empty-state">暂无活动</div>'}
        </div>
      </div>
    </div>

    <div class="section">
      <div class="card" style="padding: 12px 16px;">
        <div class="section-head" style="margin-bottom: 8px;">
          <h2 class="section-title">意见与反馈榜</h2>
          <button class="btn-ghost btn-sm" onclick="routeTo('social')">更多</button>
        </div>
        <div class="feature-list">
          ${feedbacks.length ? feedbacks.map(f => `
            <div class="feature-row" onclick="upvoteFeedback(${f.id})">
              <div>
                <strong>${f.title}</strong><br>
                <span class="muted">${f.circle?.name || ''}</span>
              </div>
              <span class="tag tag-green">${f.boosts || 0} 助力</span>
            </div>
          `).join("") : '<div class="empty-state">暂无反馈</div>'}
        </div>
      </div>
    </div>

    <div class="section">
      <div class="card" style="padding: 8px 16px;">
        <div class="metrics" style="gap:8px;">
          <div class="metric-card" style="padding:8px 4px; border: none;">
            <strong style="font-size:16px;">${state.circles.length || 0}</strong>
            <span style="font-size:12px;">邻圈</span>
          </div>
          <div class="metric-card" style="padding:8px 4px; border: none;">
            <strong style="font-size:16px;">${state.circles.reduce((s,c)=>s+(c.memberCount||0),0).toLocaleString()}</strong>
            <span style="font-size:12px;">成员</span>
          </div>
          <div class="metric-card" style="padding:8px 4px; border: none;">
            <strong style="font-size:16px;">${state.needs.length || 0}</strong>
            <span style="font-size:12px;">供需</span>
          </div>
          <div class="metric-card" style="padding:8px 4px; border: none;">
            <strong style="font-size:16px;">${state.needs.reduce((s,n)=>s+(n.boosts||0),0)}</strong>
            <span style="font-size:12px;">助力</span>
          </div>
        </div>
      </div>
    </div>
  `);
}

/** 邻圈列表页 */
function circlesPage() {
  return shell(`
    <div class="page-header" style="text-align:center;padding:12px 0;">
      <h2 class="section-title">邻圈</h2>
    </div>
    <div class="section">
      <div class="menu-list">
        ${state.circles.length ? state.circles.map(c => `
          <button class="menu-item" onclick="showCircleDetail(${c.id})">
            <span>${c.name}</span>
            <span class="muted" style="font-size:14px;">${circleTypeMap[c.type] || c.type} · ${(c.memberCount || 0).toLocaleString()}人 <span style="color:var(--text-tertiary);font-size:18px;">›</span></span>
          </button>
        `).join("") : '<div class="empty-state">暂无邻圈</div>'}
      </div>
    </div>
  `);
}

/** 邻圈详情页 */
function circleDetailPage() {
  const circle = state.circles.find((item) => item.id === state.selectedCircleId) || state.circles[0];
  if (!circle) return shell(`<div class="empty-state">邻圈不存在</div>`);
  const services = circle.services || [];
  const groups = circle.groups || [];
  return shell(`
    <div class="page-header" style="text-align:center;padding:12px 0;">
      <h2 class="section-title">${circle.name}</h2>
    </div>
    <div class="section">
      <div class="card">
        <div class="tag-list">
          <span class="tag tag-primary">${circleTypeMap[circle.type] || circle.type}</span>
          <span class="tag tag-green">${circle.safetyInfo || ''}</span>
        </div>
        <p class="muted">${circle.description || ''}</p>
        <div class="card-meta">
          <span class="muted">${(circle.memberCount || 0).toLocaleString()} 位成员</span>
        </div>
        <div class="card-actions">
          <button class="btn-secondary btn-sm" onclick="openJoin(${circle.id})">申请加入</button>
        </div>
      </div>

      <div class="section-head" style="margin-top:20px;">
        <h2 class="section-title">服务</h2>
      </div>
      <div class="menu-list">
        ${services.length ? services.map(s => `
          <div class="menu-item">
            <span>${s}</span>
            <span class="muted" style="font-size:14px;">认证成员可用 <span style="color:var(--text-tertiary);font-size:18px;">›</span></span>
          </div>
        `).join("") : '<div class="empty-state">暂无服务</div>'}
      </div>

      <div class="section-head" style="margin-top:20px;">
        <h2 class="section-title">群资料</h2>
      </div>
      <div class="menu-list">
        ${groups.length ? groups.map(g => `
          <button class="menu-item" onclick="showToast('已发起查看 ${g} 的验证')">
            <span>${g}</span>
            <span style="color:var(--text-tertiary);font-size:18px;">›</span>
          </button>
        `).join("") : '<div class="empty-state">暂无群资料</div>'}
      </div>

      <div class="section-head" style="margin-top:20px;">
        <h2 class="section-title">公告</h2>
      </div>
      <div class="card">
        <div class="feature-list">
          <div class="feature-row">
            <div><strong>安全提醒</strong><br><span class="muted">请通过平台担保交易</span></div>
          </div>
          <div class="feature-row">
            <div><strong>公共服务</strong><br><span class="muted">维修服务和意见反馈已开放</span></div>
          </div>
        </div>
      </div>
    </div>
  `);
}

/** 供需广场页 */
function needsPage() {
  const keyword = state.searchKeyword.toLowerCase();
  const list = keyword
    ? state.needs.filter(n =>
        (n.title || '').toLowerCase().includes(keyword) ||
        (n.description || '').toLowerCase().includes(keyword) ||
        (n.tags || []).some(t => t.toLowerCase().includes(keyword)))
    : state.needs;
  const categories = ["全部", "活动", "闲置物品", "技能服务", "居家创业", "那些事儿"];
  return shell(`
    <div class="page-header" style="text-align:center;padding:12px 0;">
      <h2 class="section-title">供需广场</h2>
    </div>
    <div class="section">
      <label class="search-box" style="margin-bottom:12px;">
        ${ICONS.search}
        <input id="needsSearch" placeholder="搜索关键词" value="${state.searchKeyword}" onkeydown="if(event.key==='Enter'){state.searchKeyword=event.target.value.trim();render();}" />
      </label>
      <div class="filters">
        ${categories.map((cat) => `<button class="chip ${state.activeCategory === cat ? "active" : ""}" onclick="switchCategory('${cat}')">${cat}</button>`).join("")}
      </div>
      ${list.length ? list.map(needCard).join("") : `<div class="empty-state">${keyword ? '没有找到相关内容' : '当前分类暂无内容'}</div>`}
    </div>
  `);
}

/** 需求详情页 */
function needDetailPage() {
  const item = state.needs.find((need) => need.id === state.selectedNeedId) || state.needs[0];
  if (!item) return shell(`<div class="empty-state">需求不存在</div>`);
  const publisher = item.publisher || {};
  const cat = categoryReverse[item.category] || item.category;
  return shell(`
    <div class="page-header" style="text-align:center;padding:12px 0;">
      <h2 class="section-title">需求详情</h2>
    </div>
    <div class="section">
      <article class="card">
        <div class="tag-list">
          <span class="tag tag-primary">${cat}</span>
          <span class="tag tag-gray">${item.distance || '本邻圈'}</span>
        </div>
        <h3>${item.title}</h3>
        <div class="card-price" style="font-size:18px;margin:8px 0;">${item.price || ''}</div>
        <p class="muted">${item.description || ''}</p>
        <div class="feature-list" style="margin-top:12px;">
          <div class="feature-row">
            <div><strong>地址</strong><br><span class="muted">${item.address || item.circle?.name || ''} 附近</span></div>
          </div>
          <div class="feature-row">
            <div><strong>联系方式</strong><br><span class="muted">接受需求后可见</span></div>
          </div>
          <div class="feature-row">
            <div><strong>平台保障</strong><br><span class="muted">担保支付 + 双方确认</span></div>
          </div>
        </div>
        <div class="card-actions">
          <button class="btn-secondary btn-sm" onclick="handleBoostNeed(${item.id})">助力 ${item.boosts || 0}</button>
          <button class="btn-primary" onclick="createOrder('${item.title}', ${item.id})">接受需求</button>
        </div>
      </article>

      <div class="card" style="margin-top:16px;">
        <h3>发布者</h3>
        <div class="card-meta" style="margin-top:12px;">
          <span class="card-avatar" style="width:40px;height:40px;font-size:16px;">${(publisher.nickname || 'U')[0]}</span>
          <div class="card-author-info">
            <strong>${publisher.nickname || '用户'}</strong>
            <span class="muted">信用分 ${publisher.creditScore || 70}</span>
          </div>
        </div>
      </div>
    </div>
  `);
}

/** 发布页 */
function publishPage() {
  if (!state.isLoggedIn) return shell(`<div class="empty-state">请先登录后发布</div>`);
  const circles = state.joinedCircles;
  const categories = ["活动", "闲置物品", "技能服务", "居家创业", "那些事儿"];
  if (!circles.length) {
    return shell(`
      <div class="page-header" style="text-align:center;padding:12px 0;">
        <h2 class="section-title">快速发布</h2>
      </div>
      <div class="section">
        <div class="card">
          <div class="empty-state">
            <h3>暂无已加入的邻圈</h3>
            <button class="btn-primary" onclick="routeTo('circles')" style="margin-top:16px">去加入邻圈</button>
          </div>
        </div>
      </div>
    `);
  }
  return shell(`
    <div class="page-header" style="text-align:center;padding:12px 0;">
      <h2 class="section-title">快速发布</h2>
    </div>
    <div class="section">
      <div class="card">
        <div class="form-grid">
          <label class="field"><span>发布类型</span><select id="pubType"><option>需求</option><option>供给</option></select></label>
          <label class="field"><span>邻圈范围</span><select id="pubCircle">${circles.map((circle) => `<option value="${circle.id}">${circle.name}</option>`).join("")}</select></label>
          <label class="field"><span>分类</span><select id="pubCategory">${categories.map((cat) => `<option value="${categoryMap[cat]}">${cat}</option>`).join("")}</select></label>
          <label class="field"><span>价格/预算</span><input id="pubPrice" placeholder="如 50、AA、免费"></label>
          <label class="field full"><span>标题</span><input id="pubTitle" placeholder="用一句话说明你要发布的内容"></label>
          <label class="field full"><span>描述</span><textarea id="pubDesc" placeholder="补充物品参数、规格、成色、活动时间、服务内容等"></textarea></label>
          <label class="field"><span>地址</span><input id="pubAddress" placeholder="社区公共空间、楼栋附近、校园地点"></label>
          <label class="field"><span>联系方式</span><input id="pubContact" placeholder="接受后可见"></label>
        </div>
        <div class="card-actions">
          <button class="btn-primary" onclick="handlePublish()">提交发布</button>
        </div>
      </div>
    </div>
  `);
}

/** 我的订单页 */
function ordersPage() {
  const statusMap = { pending_pay: "待支付", pending_participate: "待参与", pending_review: "待评价", completed: "已完成", cancelled: "已取消" };
  const orders = state.orders;
  return shell(`
    <div class="page-header" style="text-align:center;padding:12px 0;">
      <h2 class="section-title">我的订单</h2>
    </div>
    <div class="section">
      <div class="menu-list">
        ${orders.length ? orders.map((order) => {
          const st = statusMap[order.status] || order.status;
          const cls = order.status === 'completed' ? 'status status-ok' : order.status === 'cancelled' ? 'status status-fail' : 'status status-waiting';
          return `
            <button class="menu-item" onclick="openOrder('${order.orderNo}', '${order.status}')">
              <span>${order.need?.title || '订单'}</span>
              <span><span class="${cls}">${st}</span> <span style="color:var(--text-tertiary);font-size:18px;">›</span></span>
            </button>
          `;
        }).join("") : '<div class="empty-state">暂无订单</div>'}
      </div>
    </div>
  `);
}

/** 社交与活动页 */
function socialPage() {
  const activities = state.activities;
  return shell(`
    <div class="page-header" style="text-align:center;padding:12px 0;">
      <h2 class="section-title">社交与活动</h2>
    </div>
    <div class="section">
      <div class="section-head">
        <h2 class="section-title">活动报名</h2>
      </div>
      <div class="feature-list">
        ${activities.length ? activities.map(a => `
          <div class="feature-row" onclick="joinActivity(${a.id})">
            <div>
              <strong>${a.title}</strong><br>
              <span class="muted">${formatTime(a.eventTime)} · ${a.location || ''}</span>
            </div>
            <span class="tag tag-orange">${a.enrolledCount || 0}人报名</span>
          </div>
        `).join("") : '<div class="empty-state">暂无活动</div>'}
      </div>
    </div>

    <div class="section">
      <div class="section-head">
        <h2 class="section-title">心情树洞</h2>
      </div>
      <div class="menu-list">
        <div class="menu-item">
          <span>今天不想说话，但想有人一起散步</span>
          <span class="muted">匿名 · 18 拥抱</span>
        </div>
        <div class="menu-item">
          <span>第一次参加邻里活动，有点紧张</span>
          <span class="muted">实名 · 12 鼓励</span>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-head">
        <h2 class="section-title">问答</h2>
      </div>
      <div class="menu-list">
        <button class="menu-item" onclick="showToast('打开回答')">
          <span>小区附近哪里适合晚上自习？</span>
          <span style="color:var(--text-tertiary);font-size:18px;">›</span>
        </button>
        <button class="menu-item" onclick="showToast('打开参与')">
          <span>想做社区咖啡拼单，有人感兴趣吗？</span>
          <span style="color:var(--text-tertiary);font-size:18px;">›</span>
        </button>
      </div>
    </div>
  `);
}

/** 认证中心页 */
function authPage() {
  if (!state.isLoggedIn) return shell(`<div class="empty-state">请先登录</div>`);
  const items = state.authItems.length ? state.authItems : [
    { type: 'real_name', status: '未提交', description: '姓名与证件信息已核验，用于提升邻圈信任度。' },
    { type: 'industry', status: '未提交', description: '正在核验从业资质，预计 1 个工作日完成。' },
    { type: 'community', status: '未提交', description: '已加入小区，支持物业服务和业主群查看。' },
    { type: 'university', status: '未提交', description: '可通过学籍信息申请加入大学邻圈。' },
  ];
  const typeNames = { real_name: '实名认证', industry: '行业认证', community: '小区认证', university: '大学认证' };
  const statusNames = { pending: '审核中', approved: '已通过', rejected: '已驳回' };
  return shell(`
    <div class="page-header" style="text-align:center;padding:12px 0;">
      <h2 class="section-title">认证中心</h2>
    </div>
    <div class="section">
      <div class="menu-list">
        ${items.map((item) => {
          const cls = item.status === 'approved' ? 'status status-ok' : item.status === 'pending' ? 'status status-waiting' : 'status status-fail';
          const title = typeNames[item.type] || item.type;
          const st = statusNames[item.status] || item.status;
          return `
            <button class="menu-item" onclick="openAuth('${title}', '${item.type}')">
              <span>${title}</span>
              <span><span class="${cls}">${st}</span> <span style="color:var(--text-tertiary);font-size:18px;">›</span></span>
            </button>
          `;
        }).join("")}
      </div>
    </div>
  `);
}

/** 我的中心页 */
function minePage() {
  if (!state.isLoggedIn) return shell(`<div class="empty-state">请先登录</div>`);
  const user = state.user || {};
  const authStatus = state.authItems.some(a => a.type === 'real_name' && a.status === 'approved');
  return shell(`
    <div class="page-header" style="text-align:center;padding:12px 0;">
      <h2 class="section-title">我的</h2>
    </div>
    <div class="section">
      <div class="card profile-card">
        <div class="card-meta">
          <span class="card-avatar" style="width:48px;height:48px;font-size:20px;">${(user.nickname || 'U')[0]}</span>
          <div class="card-author-info">
            <h3>${user.nickname || '用户'}</h3>
            <span class="muted">信用分 ${user.creditScore || 70}</span>
          </div>
        </div>
        <div class="tag-list" style="margin-top:12px;">
          <span class="tag ${authStatus ? 'tag-primary' : 'tag-gray'}">${authStatus ? '实名认证' : '未实名'}</span>
          <span class="tag tag-green">邻圈认证</span>
        </div>
      </div>

      <div class="menu-list" style="margin-top:16px;">
        <button class="menu-item" onclick="routeTo('orders')">
          <span>我的订单</span>
          <span style="color:var(--text-tertiary);font-size:18px;">›</span>
        </button>
        <button class="menu-item" onclick="routeTo('auth')">
          <span>我的认证</span>
          <span style="color:var(--text-tertiary);font-size:18px;">›</span>
        </button>
        <button class="menu-item" onclick="showToast('设置')">
          <span>设置</span>
          <span style="color:var(--text-tertiary);font-size:18px;">›</span>
        </button>
      </div>

      <div class="section-head" style="margin-top:20px;">
        <h2 class="section-title">常用服务</h2>
      </div>
      <div class="menu-list">
        <button class="menu-item" onclick="routeTo('publish')">
          <span>我的发布</span>
          <span style="color:var(--text-tertiary);font-size:18px;">›</span>
        </button>
        <button class="menu-item" onclick="routeTo('orders')">
          <span>我的订单</span>
          <span style="color:var(--text-tertiary);font-size:18px;">›</span>
        </button>
        <button class="menu-item" onclick="routeTo('auth')">
          <span>我的认证</span>
          <span style="color:var(--text-tertiary);font-size:18px;">›</span>
        </button>
        <button class="menu-item" onclick="routeTo('social')">
          <span>活动与社交</span>
          <span style="color:var(--text-tertiary);font-size:18px;">›</span>
        </button>
      </div>

      <div style="margin-top:24px;padding-bottom:20px;">
        <button class="btn-secondary" style="width:100%;" onclick="handleLogout()">退出登录</button>
      </div>
    </div>
  `);
}

/* ========== Router & Render ========== */
function render() {
  const routes = {
    home: homePage,
    circles: circlesPage,
    circleDetail: circleDetailPage,
    needs: needsPage,
    needDetail: needDetailPage,
    publish: publishPage,
    orders: ordersPage,
    social: socialPage,
    auth: authPage,
    mine: minePage,
    login: loginPage,
    register: registerPage,
  };
  document.querySelector("#app").innerHTML = (routes[state.route] || homePage)();
}

/* ========== Expose Global Functions ========== */
window.routeTo = routeTo;
window.showToast = showToast;
window.openModal = openModal;
window.closeModal = closeModal;
window.openJoin = openJoin;
window.submitJoin = submitJoin;
window.createOrder = createOrder;
window.submitOrder = submitOrder;
window.openOrder = openOrder;
window.openAuth = openAuth;
window.submitAuth = submitAuth;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.handleLogout = handleLogout;
window.handlePublish = handlePublish;
window.handleBoostNeed = handleBoostNeed;
window.handleBoostFeedback = handleBoostFeedback;
window.handleEnroll = handleEnroll;
window.switchCategory = switchCategory;
window.handleSearch = handleSearch;
window.joinActivity = joinActivity;
window.showNeedDetail = showNeedDetail;
window.showCircleDetail = showCircleDetail;
window.upvoteFeedback = upvoteFeedback;
window.state = state;
window.render = render;

init();
