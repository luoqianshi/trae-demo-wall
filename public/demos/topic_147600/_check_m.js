
/* ============================================================
   Zhilin Mobile H5 - 智邻管家移动端 Demo
   ============================================================ */
var state = {
  currentUser: null,
  currentRole: 'owner',
  currentTab: 'home',
  woFilter: 'all',
  annFilter: 'all',
  chatMsgs: []
};

var D = window.__DATA__;
var roles = D.roles;

// ========== Init ==========
function init() {
  // Render role list
  var roleList = document.getElementById('roleList');
  var roleKeys = ['owner', 'staff', 'grid_worker', 'admin', 'sys_admin'];
  var roleIcons = {owner:'🏠',staff:'👷',grid_worker:'🚶',admin:'🛡️',sys_admin:'⚙️'};
  var roleDescs = {owner:'报修、缴费、社区互动',staff:'处理工单、服务居民',grid_worker:'网格巡查、关怀老人',admin:'管理社区、数据监控',sys_admin:'系统配置、权限管理'};
  roleKeys.forEach(function(rk) {
    var role = roles[rk];
    roleList.innerHTML += '<div class="login-role-btn" onclick="login(\'' + rk + '\')"><div class="r-icon">' + roleIcons[rk] + '</div><div class="r-info"><div class="r-name">' + role.label + '</div><div class="r-desc">' + roleDescs[rk] + '</div></div><div class="r-arrow">›</div></div>';
  });
}

// ========== Login ==========
function login(role) {
  var user = D.users.find(function(u) { return u.role === role; });
  if (!user) return;
  state.currentUser = user;
  state.currentRole = role;
  document.getElementById('roleSelect').value = role;
  document.getElementById('loginPage').style.display = 'none';
  document.getElementById('appShell').classList.add('active');
  switchTab('home', document.querySelector('.tab-item'));
  showToast('欢迎回来，' + user.real_name + '！');
}

// ========== Logout ==========
function logout() {
  state.currentUser = null;
  state.currentRole = 'owner';
  state.chatMsgs = [];
  document.getElementById('loginPage').style.display = 'flex';
  document.getElementById('appShell').classList.remove('active');
}

// ========== Role Switch ==========
function switchRole(role) {
  var user = D.users.find(function(u) { return u.role === role; });
  if (!user) return;
  state.currentUser = user;
  state.currentRole = role;
  state.chatMsgs = [];
  renderContent();
  showToast('已切换为' + user.real_name);
}

// ========== Tab Switch ==========
function switchTab(tab, el) {
  state.currentTab = tab;
  document.querySelectorAll('.tab-item').forEach(function(t) { t.classList.remove('active'); });
  if (el) el.classList.add('active');
  renderContent();
}

// ========== Render Content ==========
function renderContent() {
  var container = document.getElementById('appContent');
  var tab = state.currentTab;
  var html = '';

  if (tab === 'home') {
    // Banner
    html += '<div class="m-banner"><div class="b-title">智慧社区 · 智邻管家</div><div class="b-sub">让社区生活更美好</div></div>';

    // Quick Actions
    html += '<div class="m-card"><div class="c-title">快捷服务</div><div class="qa-grid">';
    html += '<div class="qa-item" onclick="switchTab(\'workorders\',document.querySelectorAll(\'.tab-item\')[1])"><div class="qa-icon">🔧</div><div class="qa-label">报事报修</div></div>';
    html += '<div class="qa-item" onclick="switchTab(\'announcements\',document.querySelectorAll(\'.tab-item\')[2])"><div class="qa-icon">📢</div><div class="qa-label">社区公告</div></div>';
    html += '<div class="qa-item" onclick="showInfo(\'parking\')"><div class="qa-icon">🅿️</div><div class="qa-label">车位查询</div></div>';
    html += '<div class="qa-item" onclick="showInfo(\'courier\')"><div class="qa-icon">📦</div><div class="qa-label">快递服务</div></div>';
    html += '<div class="qa-item" onclick="showInfo(\'materials\')"><div class="qa-icon">📋</div><div class="qa-label">物资领用</div></div>';
    html += '<div class="qa-item" onclick="switchTab(\'chat\',document.querySelectorAll(\'.tab-item\')[3])"><div class="qa-icon">🤖</div><div class="qa-label">AI助手</div></div>';
    html += '</div></div>';

    // Stats
    html += '<div class="m-card"><div class="c-title">📊 今日概览</div><div class="stats-grid">';
    html += '<div class="stat-item" style="background:#e6f4ff"><div class="s-val" style="color:var(--primary)">' + D.dashboardStats.today_work_orders + '</div><div class="s-label">今日工单</div></div>';
    html += '<div class="stat-item" style="background:#f6ffed"><div class="s-val" style="color:var(--success)">' + D.dashboardStats.satisfaction_avg + '</div><div class="s-label">满意度</div></div>';
    html += '<div class="stat-item" style="background:#fff7e6"><div class="s-val" style="color:var(--warning)">' + D.dashboardStats.pending_work_orders + '</div><div class="s-label">待处理</div></div>';
    html += '<div class="stat-item" style="background:#fff2f0"><div class="s-val" style="color:var(--danger)">' + D.dashboardStats.unresolved_alerts + '</div><div class="s-label">告警</div></div>';
    html += '</div></div>';

    // Recent Work Orders
    html += '<div class="m-card"><div class="c-title">🔧 最近工单</div>';
    D.workOrders.slice(0, 4).forEach(function(o) {
      var statusLabel = statusMap[o.status] || o.status;
      var typeIcon = typeIcons[o.type] || '📋';
      html += '<div class="list-item" onclick="showWoDetail(\'' + o.id + '\')">';
      html += '<div class="li-icon">' + typeIcon + '</div>';
      html += '<div class="li-body"><div class="li-title">' + o.title + '</div><div class="li-sub"><span class="status-badge ' + o.status + '">' + statusLabel + '</span> · ' + formatTime(o.created_at) + '</div></div>';
      html += '<div class="li-arrow">›</div></div>';
    });
    html += '<div class="view-more" onclick="switchTab(\'workorders\',document.querySelectorAll(\'.tab-item\')[1])">查看全部工单 ›</div>';
    html += '</div>';

    // Latest Announcements
    html += '<div class="m-card"><div class="c-title">📢 最新公告</div>';
    D.announcements.slice(0, 3).forEach(function(a) {
      html += '<div class="list-item" onclick="showAnnDetail(\'' + a.id + '\')">';
      html += '<div class="li-icon">' + (a.type==='urgent'?'🔴':a.type==='notice'?'📢':'🎉') + '</div>';
      html += '<div class="li-body"><div class="li-title">' + (a.is_pinned?'📌 ':'') + a.title + '</div><div class="li-sub">' + formatTime(a.publish_at) + '</div></div>';
      html += '<div class="li-arrow">›</div></div>';
    });
    html += '</div>';

    // Alerts
    var alerts = D.workOrders.filter(function(o) { return o.priority === 'urgent' && (o.status === 'pending' || o.status === 'submitted'); });
    if (alerts.length > 0) {
      html += '<div class="m-card" style="border-left:3px solid var(--danger)"><div class="c-title" style="color:var(--danger)">🚨 紧急告警（' + alerts.length + '）</div>';
      alerts.forEach(function(a) {
        html += '<div class="alert-item"><div class="alert-dot"></div><div><div style="font-weight:500;font-size:13px">' + a.title + '</div><div style="font-size:11px;color:var(--text-muted)">' + a.location + ' · ' + formatTime(a.created_at) + '</div></div></div>';
      });
      html += '</div>';
    }

  } else if (tab === 'workorders') {
    // Filter tabs
    html += '<div class="filter-tabs">';
    [{k:'all',v:'全部'},{k:'pending',v:'待处理'},{k:'in_progress',v:'处理中'},{k:'resolved',v:'已解决'}].forEach(function(f) {
      html += '<div class="ft-item ' + (state.woFilter===f.k?'active':'') + '" onclick="state.woFilter=\'' + f.k + '\';renderContent()">' + f.v + '</div>';
    });
    html += '</div>';

    // Create button
    html += '<div class="create-btn" onclick="showToast(\'Demo模式仅展示工单列表\')">+ 创建工单</div>';

    // Filtered list
    var filtered = D.workOrders;
    if (state.woFilter === 'pending') filtered = D.workOrders.filter(function(o) { return o.status === 'pending' || o.status === 'submitted'; });
    else if (state.woFilter === 'in_progress') filtered = D.workOrders.filter(function(o) { return o.status === 'assigned' || o.status === 'in_progress'; });
    else if (state.woFilter === 'resolved') filtered = D.workOrders.filter(function(o) { return o.status === 'resolved' || o.status === 'closed'; });

    html += '<div class="m-card"><div class="c-title">工单列表 <span class="c-count">（' + filtered.length + '）</span></div>';
    filtered.forEach(function(o) {
      var statusLabel = statusMap[o.status] || o.status;
      var typeIcon = typeIcons[o.type] || '📋';
      html += '<div class="list-item" onclick="showWoDetail(\'' + o.id + '\')">';
      html += '<div class="li-icon">' + typeIcon + '</div>';
      html += '<div class="li-body"><div class="li-title">' + o.title + '</div><div class="li-sub"><span class="status-badge ' + o.status + '">' + statusLabel + '</span> · ' + o.location + ' · ' + formatTime(o.created_at) + '</div></div>';
      html += '<div class="li-arrow">›</div></div>';
    });
    html += '</div>';

  } else if (tab === 'announcements') {
    html += '<div class="filter-tabs">';
    [{k:'all',v:'全部'},{k:'notice',v:'通知'},{k:'activity',v:'活动'},{k:'urgent',v:'紧急'}].forEach(function(f) {
      html += '<div class="ft-item ' + (state.annFilter===f.k?'active':'') + '" onclick="state.annFilter=\'' + f.k + '\';renderContent()">' + f.v + '</div>';
    });
    html += '</div>';

    var annFiltered = D.announcements;
    if (state.annFilter !== 'all') annFiltered = D.announcements.filter(function(a) { return a.type === state.annFilter; });

    html += '<div class="m-card"><div class="c-title">公告通知 <span class="c-count">（' + annFiltered.length + '）</span></div>';
    annFiltered.forEach(function(a) {
      var typeColor = {notice:'#1677ff',activity:'#52c41a',urgent:'#ff4d4f'}[a.type] || '#999';
      html += '<div class="list-item" onclick="showAnnDetail(\'' + a.id + '\')">';
      html += '<div class="li-icon">' + (a.type==='urgent'?'🔴':a.type==='notice'?'📢':'🎉') + '</div>';
      html += '<div class="li-body"><div class="li-title">' + (a.is_pinned?'📌 ':'') + a.title + '</div><div class="li-sub"><span style="color:' + typeColor + ';font-weight:500">' + ({notice:'通知',activity:'活动',urgent:'紧急'}[a.type]||a.type) + '</span> · ' + formatTime(a.publish_at) + '</div></div>';
      html += '<div class="li-arrow">›</div></div>';
    });
    html += '</div>';

  } else if (tab === 'chat') {
    html += '<div class="m-card" style="padding:0;overflow:hidden;display:flex;flex-direction:column">';
    html += '<div style="padding:10px 14px;background:#f5f5f5;border-bottom:1px solid var(--border);font-weight:600;font-size:14px">🤖 智邻管家 · AI客服</div>';

    // Messages
    html += '<div class="chat-msgs" id="chatMsgs">';
    var msgs = state.chatMsgs;
    if (msgs.length === 0 && D.conversations[0]) {
      msgs = D.conversations[0].messages || [];
      state.chatMsgs = msgs;
    }
    msgs.forEach(function(m) {
      var isUser = m.role === 'user';
      html += '<div class="chat-msg ' + (isUser ? 'user' : 'bot') + '">';
      html += '<div class="cm-avatar ' + (isUser ? 'user' : 'bot') + '">' + (isUser ? '👤' : '🤖') + '</div>';
      html += '<div class="cm-bubble">' + m.content.replace(/\n/g,'<br>') + '</div>';
      html += '</div>';
    });
    html += '</div>';

    // Quick replies
    html += '<div class="quick-replies">';
    ['🔧 报修','📢 公告','📦 快递','🅿️ 车位','⭐ 评价'].forEach(function(qr) {
      html += '<div class="qr-btn" onclick="quickReply(\'' + qr + '\')">' + qr + '</div>';
    });
    html += '</div>';

    // Input
    html += '<div class="chat-input-bar">';
    html += '<input type="text" id="chatInput" placeholder="输入消息..." onkeydown="if(event.key===\'Enter\')sendMsg()">';
    html += '<button onclick="sendMsg()">➤</button>';
    html += '</div>';
    html += '</div>';

  } else if (tab === 'profile') {
    var u = state.currentUser;
    var woCount = D.workOrders.filter(function(o) { return o.creator_id === u.id; }).length;
    var sugCount = D.suggestions.filter(function(s) { return s.creator_id === u.id; }).length;

    html += '<div class="profile-header">';
    html += '<div class="ph-avatar">' + (u.real_name ? u.real_name.charAt(0) : '?') + '</div>';
    html += '<div class="ph-name">' + (u.real_name || '') + '</div>';
    html += '<div class="ph-role">' + (roles[state.currentRole] ? roles[state.currentRole].label : '') + '</div>';
    html += '<div class="ph-stats"><div class="ps-item"><div class="ps-val">' + woCount + '</div><div class="ps-label">我的工单</div></div><div class="ps-item"><div class="ps-val">' + sugCount + '</div><div class="ps-label">我的意见</div></div><div class="ps-item"><div class="ps-val">⭐' + (u.credit_score||0) + '</div><div class="ps-label">信用分</div></div></div>';
    html += '</div>';

    var menuItems = [
      {icon:'🔧',label:'我的工单',desc:'查看所有工单记录',action:function(){switchTab('workorders',document.querySelectorAll('.tab-item')[1])}},
      {icon:'📋',label:'我的意见',desc:'查看提交的意见建议',action:function(){showToast('意见箱功能已提交 ' + sugCount + ' 条意见')}},
      {icon:'📦',label:'我的快递',desc:'查看快递代办记录',action:function(){showInfo('courier')}},
      {icon:'💬',label:'消息通知',desc:'查看系统消息',action:function(){showToast('您有 ' + D.notifications.length + ' 条未读消息')}},
      {icon:'⭐',label:'信用评分',desc:'当前信用分：' + (u.credit_score||0),action:function(){alert('信用评分：' + (u.credit_score||0) + '\n\n信用评分规则：\n- 按时缴费 +5分\n- 积极参与社区活动 +3分\n- 违规停车 -5分\n- 投诉核实 -10分')}},
      {icon:'⚙️',label:'设置',desc:'账号安全与偏好设置',action:function(){showToast('Demo模式暂不支持设置')}},
    ];

    html += '<div class="m-card" style="padding:0;overflow:hidden">';
    menuItems.forEach(function(item, idx) {
      html += '<div class="menu-item" onclick="(' + item.action.toString() + ')()">';
      html += '<div class="mi-icon">' + item.icon + '</div>';
      html += '<div class="mi-body"><div class="mi-label">' + item.label + '</div><div class="mi-desc">' + item.desc + '</div></div>';
      html += '<div class="mi-arrow">›</div></div>';
    });
    html += '</div>';

    html += '<div class="m-card" style="text-align:center;color:var(--danger);cursor:pointer;font-weight:500" onclick="logout()">退出登录</div>';
  }

  container.innerHTML = html;
  // Scroll chat to bottom
  if (tab === 'chat') setTimeout(function() {
    var el = document.getElementById('chatMsgs');
    if (el) el.scrollTop = el.scrollHeight;
  }, 100);
}

// ========== Helpers ==========
var statusMap = {submitted:'已提交',pending:'待处理',assigned:'已分配',in_progress:'处理中',resolved:'已解决',closed:'已关闭',rejected:'已驳回',escalated:'已升级'};
var typeIcons = {repair:'🔧',cleaning:'🧹',security:'🛡️',complaint:'📝',suggestion:'💡',other:'📋'};

function formatTime(ts) {
  if (!ts) return '';
  var d = new Date(ts);
  var m = d.getMonth() + 1;
  var day = d.getDate();
  var h = d.getHours();
  var min = d.getMinutes();
  return (m<10?'0'+m:m) + '/' + (day<10?'0'+day:day) + ' ' + (h<10?'0'+h:h) + ':' + (min<10?'0'+min:min);
}

function showToast(msg) {
  var el = document.createElement('div');
  el.className = 'toast success';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(function() { el.remove(); }, 2000);
}

function showWoDetail(id) {
  var o = D.workOrders.find(function(w) { return w.id === id; });
  if (!o) return;
  var statusLabel = statusMap[o.status] || o.status;
  alert('工单详情\n\n编号：' + o.order_no + '\n标题：' + o.title + '\n类型：' + o.type + '\n状态：' + statusLabel + '\n优先级：' + o.priority + '\n位置：' + o.location + '\n描述：' + o.description + '\n创建时间：' + formatTime(o.created_at) + '\n更新时间：' + formatTime(o.updated_at) + (o.satisfaction_score ? '\n满意度：' + '⭐'.repeat(o.satisfaction_score) : ''));
}

function showAnnDetail(id) {
  var a = D.announcements.find(function(x) { return x.id === id; });
  if (!a) return;
  var publisher = D.users.find(function(u) { return u.id === a.publisher_id; });
  alert('公告详情\n\n标题：' + a.title + '\n类型：' + ({notice:'通知',activity:'活动',urgent:'紧急'}[a.type]||a.type) + '\n内容：' + a.content + '\n发布者：' + (publisher ? publisher.real_name : '系统') + '\n发布时间：' + formatTime(a.publish_at));
}

function showInfo(type) {
  var msg = '';
  if (type === 'parking') {
    var occ = D.parkingSpaces.filter(function(p) { return p.status === 'occupied'; }).length;
    msg = '车位管理\n\n当前共 ' + D.parkingSpaces.length + ' 个车位，已占用 ' + occ + ' 个\n\nA区：' + D.parkingSpaces.filter(function(p){return p.area.startsWith('A区')}).length + '个 | B区：' + D.parkingSpaces.filter(function(p){return p.area.startsWith('B区')}).length + '个 | C区：' + D.parkingSpaces.filter(function(p){return p.area.startsWith('C区')}).length + '个';
  } else if (type === 'courier') {
    msg = '快递代办\n\n共 ' + D.courierTasks.length + ' 个快递任务\n待处理：' + D.courierTasks.filter(function(c){return c.status==='pending'}).length + ' 个\n配送中：' + D.courierTasks.filter(function(c){return c.status==='delivering'}).length + ' 个\n已送达：' + D.courierTasks.filter(function(c){return c.status==='delivered'}).length + ' 个';
  } else if (type === 'materials') {
    msg = '物资领用\n\n共 ' + D.materials.length + ' 种物资可借\n可借用：' + D.materials.filter(function(m){return m.status==='available'}).length + ' 种\n已借出：' + D.materials.filter(function(m){return m.status==='borrowed'}).length + ' 种';
  }
  alert(msg);
}

// ========== Chat ==========
function sendMsg() {
  var input = document.getElementById('chatInput');
  if (!input) return;
  var text = input.value.trim();
  if (!text) return;
  state.chatMsgs.push({id:Date.now(),role:'user',content:text,created_at:new Date().toISOString()});
  input.value = '';
  renderContent();
  setTimeout(function() {
    var replies = {
      '报修':'好的，我来帮您创建报修工单。请告诉我以下信息：\n1. 报修类型（水管/电器/门窗/其他）\n2. 具体位置\n3. 问题描述\n\n您也可以直接通过首页"报事报修"入口提交工单。',
      '公告':'最近的社区公告包括：\n📌 小区停水通知（7月15日）\n🎉 社区夏日嘉年华活动\n📢 物业费缴纳通知\n\n您可以通过"公告"Tab查看完整内容。',
      '快递':'您当前有2个快递待领取，分别在丰巢柜A区12号和B区08号。如需代取服务，请告知快递单号。',
      '车位':'当前小区车位情况：\n🟢 可用：12个\n🔴 已占用：7个\n🟡 预留：1个\n\nA区有3个空闲车位，B区有5个，C区有4个。',
    };
    var reply = '收到您的消息，我来帮您处理。如需提交工单，请描述具体问题；如需查询信息，请直接告诉我。';
    for (var k in replies) {
      if (text.indexOf(k) >= 0) { reply = replies[k]; break; }
    }
    state.chatMsgs.push({id:Date.now(),role:'assistant',content:reply,created_at:new Date().toISOString()});
    renderContent();
  }, 800);
}

function quickReply(text) {
  var input = document.getElementById('chatInput');
  if (input) { input.value = text; sendMsg(); }
}

// ========== Boot ==========
init();
