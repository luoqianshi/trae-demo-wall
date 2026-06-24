// ===== Community Health AI - Interactive Demo =====
(function() {
  'use strict';

  // ===== DATA =====
  var USERS = {
    user1: { name: '张明华', role: 'user', roleName: '社区居民', avatar: '张', community: '阳光社区' },
    user2: { name: '李秀英', role: 'user', roleName: '社区居民', avatar: '李', community: '幸福社区' },
    doctor1: { name: '王建国', role: 'doctor', roleName: '家庭医生', avatar: '王', community: '阳光社区' },
    doctor2: { name: '陈丽华', role: 'doctor', roleName: '家庭医生', avatar: '陈', community: '幸福社区' },
    admin: { name: '系统管理员', role: 'admin', roleName: '社区管理员', avatar: '管', community: '全部社区' }
  };

  var HEALTH_RECORD = {
    name: '张明华', gender: '男', age: 65, phone: '138****5678',
    community: '阳光社区', bloodType: 'A型',
    height: '170cm', weight: '72kg', bmi: '24.9',
    chronicDiseases: ['高血压', '2型糖尿病'],
    allergies: ['青霉素过敏'],
    familyHistory: ['父亲-高血压', '母亲-糖尿病'],
    lastCheckup: '2026-05-20'
  };

  var APPOINTMENTS = [
    { day: '18', month: '6月', title: '全科门诊 - 王建国医生', time: '09:00-09:30', status: 'confirmed', statusText: '已确认' },
    { day: '25', month: '6月', title: '糖尿病随访 - 陈丽华医生', time: '14:00-14:30', status: 'pending', statusText: '待确认' },
    { day: '02', month: '7月', title: '体检复查 - 全科门诊', time: '10:00-11:00', status: 'pending', statusText: '待确认' },
    { day: '10', month: '5月', title: '高血压随访 - 王建国医生', time: '09:30-10:00', status: 'completed', statusText: '已完成' }
  ];

  var REMINDERS = [
    { icon: '💊', iconBg: '#dbeafe', title: '降压药（苯磺酸氨氯地平）', desc: '每日一次，每次5mg，早餐后服用', time: '每天 08:00' },
    { icon: '💉', iconBg: '#dcfce7', title: '降糖药（二甲双胍）', desc: '每日两次，每次500mg，餐后服用', time: '每天 08:00 / 18:00' },
    { icon: '🩺', iconBg: '#fef3c7', title: '血压监测', desc: '每日早晚各测一次，记录数值', time: '每天 07:30 / 19:30' },
    { icon: '🏃', iconBg: '#f3e8ff', title: '适量运动', desc: '散步30分钟或太极拳，避免剧烈运动', time: '每天 17:00' }
  ];

  var KNOWLEDGE = [
    { tag: '慢性病管理', title: '高血压患者夏季注意事项', desc: '夏季气温升高，高血压患者需注意补充水分、避免高温时段外出、规律服药...' },
    { tag: '健康饮食', title: '糖尿病患者的饮食搭配指南', desc: '合理控制碳水摄入，增加膳食纤维，选择低GI食物，定时定量进餐...' },
    { tag: '运动健康', title: '老年人安全运动指南', desc: '推荐散步、太极拳、游泳等低强度运动，每次30分钟，每周3-5次...' },
    { tag: '用药常识', title: '降压药的正确服用方法', desc: '规律服药不可擅自停药，注意药物相互作用，定期复查调整用药方案...' }
  ];

  var HIGH_RISK_PATIENTS = [
    { name: '刘大爷', age: 78, community: '阳光社区', risk: '高血压III级 + 糖尿病并发症', score: 92 },
    { name: '赵阿姨', age: 72, community: '幸福社区', risk: '冠心病 + 高血脂', score: 85 },
    { name: '孙大叔', age: 68, community: '和谐社区', risk: '慢性肾病 + 高血压II级', score: 78 },
    { name: '周奶奶', age: 80, community: '阳光社区', risk: '骨质疏松 + 糖尿病', score: 75 }
  ];

  var ALL_USERS_TABLE = [
    { name: '张明华', role: '居民', community: '阳光社区', phone: '138****5678', status: '正常' },
    { name: '李秀英', role: '居民', community: '幸福社区', phone: '139****1234', status: '正常' },
    { name: '刘大爷', role: '居民', community: '阳光社区', phone: '136****9876', status: '高危' },
    { name: '赵阿姨', role: '居民', community: '幸福社区', phone: '137****5432', status: '高危' },
    { name: '王建国', role: '医生', community: '阳光社区', phone: '135****1111', status: '正常' },
    { name: '陈丽华', role: '医生', community: '幸福社区', phone: '133****2222', status: '正常' }
  ];

  // AI Chat responses
  var AI_RESPONSES = {
    '血压': '根据您的健康档案，您目前有高血压病史。关于血压管理，建议您：\n\n1. **规律服药**：苯磺酸氨氯地平每日5mg，按时服用不要漏服\n2. **定期监测**：每天早晚各测一次血压并记录\n3. **控制盐摄入**：每日食盐不超过6g\n4. **适量运动**：每天散步30分钟\n\n您最近的血压控制在多少范围呢？如果收缩压持续≥140mmHg或舒张压≥90mmHg，建议及时联系王建国医生调整用药方案。',
    '血糖': '根据您的档案，您患有2型糖尿病，目前正在服用二甲双胍。关于血糖管理：\n\n1. **规律用药**：二甲双胍每日两次，每次500mg，餐后服用\n2. **饮食控制**：减少精制碳水，增加蔬菜和全谷物\n3. **定期检测**：建议每周至少检测2次空腹血糖\n4. **目标范围**：空腹血糖控制在4.4-7.0mmol/L\n\n您的空腹血糖最近一次检测结果是多少？如果持续偏高，建议预约陈丽华医生进行随访。',
    '体检': '您最近一次体检是在2026年5月20日。体检报告主要指标如下：\n\n- **血压**：138/88 mmHg（偏高）\n- **空腹血糖**：7.2 mmol/L（偏高）\n- **BMI**：24.9（正常偏高）\n- **血脂**：总胆固醇5.8mmol/L（偏高）\n- **肝功能**：正常\n- **肾功能**：正常\n\n总体来看，血压和血糖控制还需加强，血脂偏高需要注意饮食。建议您下个月进行一次复查。',
    '头痛': '头痛的原因有很多，结合您的高血压病史，需要特别注意：\n\n⚠️ **如果伴随以下症状请立即就医**：\n- 剧烈头痛突然发作\n- 伴有恶心、呕吐、视力模糊\n- 血压突然升高（≥180/120mmHg）\n\n**日常缓解建议**：\n1. 测量当前血压，确认是否血压升高导致\n2. 在安静环境中休息\n3. 保证充足睡眠\n4. 避免情绪激动和过度劳累\n\n如果头痛频繁发作或持续不缓解，建议预约门诊检查。',
    'default': '您好！我是您的AI健康助手，基于您的健康档案为您提供个性化健康咨询。\n\n我可以帮您：\n- 📋 查询体检报告和健康指标\n- 💊 了解用药注意事项\n- 🩺 提供慢性病管理建议\n- 📅 提醒随访和复查时间\n\n请问有什么可以帮您的？'
  };

  // ===== STATE =====
  var currentUser = null;
  var currentPage = 'dashboard';
  var chatHistory = [];
  var charts = {};

  // ===== NAVIGATION CONFIG =====
  var NAV_CONFIG = {
    user: [
      { id: 'dashboard', icon: '📊', label: '工作台' },
      { id: 'health-records', icon: '📋', label: '我的健康' },
      { id: 'appointments', icon: '📅', label: '预约咨询' },
      { id: 'risk-assessment', icon: '⚠️', label: '风险评估' },
      { id: 'reminders', icon: '🔔', label: '消息提醒' },
      { id: 'knowledge', icon: '📚', label: '健康知识' },
      { id: 'ai-chat', icon: '🤖', label: 'AI助手' }
    ],
    doctor: [
      { id: 'dashboard', icon: '📊', label: '工作台' },
      { id: 'health-records', icon: '📋', label: '健康档案' },
      { id: 'appointments', icon: '📅', label: '预约管理' },
      { id: 'risk-assessment', icon: '⚠️', label: '风险评估' },
      { id: 'high-risk', icon: '🚨', label: '高危预警' },
      { id: 'reminders', icon: '🔔', label: '消息中心' },
      { id: 'doctor-ai', icon: '🤖', label: 'AI助手' }
    ],
    admin: [
      { id: 'dashboard', icon: '📊', label: '工作台' },
      { id: 'users', icon: '👥', label: '用户管理' },
      { id: 'health-records', icon: '📋', label: '档案管理' },
      { id: 'appointments', icon: '📅', label: '预约管理' },
      { id: 'high-risk', icon: '🚨', label: '高危预警' },
      { id: 'knowledge', icon: '📚', label: '知识推送' },
      { id: 'ai-chat', icon: '🤖', label: 'AI管理' }
    ]
  };

  // ===== LOGIN =====
  window.handleLogin = function() {
    var role = document.getElementById('loginRole').value;
    var username = document.getElementById('loginUsername').value.trim();
    var password = document.getElementById('loginPassword').value.trim();

    if (!username || !password) { showToast('请输入用户名和密码', 'warning'); return; }

    var user = USERS[username];
    if (!user || user.role !== role) {
      showToast('用户名或角色不匹配，请检查后重试', 'error');
      return;
    }

    currentUser = user;
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('mainApp').classList.add('active');
    document.getElementById('userName').textContent = user.name;
    document.getElementById('userRole').textContent = user.roleName;
    document.getElementById('userAvatar').textContent = user.avatar;

    buildSidebar();
    navigateTo('dashboard');
    updateTime();
    setInterval(updateTime, 60000);
    showToast('登录成功，欢迎 ' + user.name, 'success');
  };

  window.handleLogout = function() {
    currentUser = null;
    currentPage = 'dashboard';
    chatHistory = [];
    document.getElementById('loginPage').classList.remove('hidden');
    document.getElementById('mainApp').classList.remove('active');
    // Destroy charts
    Object.keys(charts).forEach(function(k) { if(charts[k]) { charts[k].dispose(); charts[k] = null; } });
  };

  // ===== SIDEBAR =====
  function buildSidebar() {
    var nav = document.getElementById('sidebarNav');
    var items = NAV_CONFIG[currentUser.role] || NAV_CONFIG.user;
    nav.innerHTML = items.map(function(item) {
      return '<div class="nav-item" data-page="' + item.id + '" onclick="navigateTo(\'' + item.id + '\')">' +
        '<span class="icon">' + item.icon + '</span>' +
        '<span>' + item.label + '</span>' +
        '</div>';
    }).join('');
  }

  // ===== NAVIGATION =====
  window.navigateTo = function(pageId) {
    currentPage = pageId;
    // Update sidebar active
    document.querySelectorAll('.nav-item').forEach(function(el) {
      el.classList.toggle('active', el.getAttribute('data-page') === pageId);
    });
    // Update title
    var navItems = NAV_CONFIG[currentUser.role] || NAV_CONFIG.user;
    var currentNav = navItems.find(function(n) { return n.id === pageId; });
    document.getElementById('pageTitle').textContent = currentNav ? currentNav.label : '工作台';
    document.getElementById('breadcrumb').textContent = '首页 / ' + (currentNav ? currentNav.label : '工作台');

    // Destroy old charts
    Object.keys(charts).forEach(function(k) { if(charts[k]) { charts[k].dispose(); charts[k] = null; } });
    charts = {};

    // Render page
    var content = document.getElementById('contentArea');
    switch(pageId) {
      case 'dashboard': renderDashboard(content); break;
      case 'health-records': renderHealthRecords(content); break;
      case 'appointments': renderAppointments(content); break;
      case 'risk-assessment': renderRiskAssessment(content); break;
      case 'high-risk': renderHighRisk(content); break;
      case 'reminders': renderReminders(content); break;
      case 'knowledge': renderKnowledge(content); break;
      case 'ai-chat': renderAIChat(content); break;
      case 'doctor-ai': renderDoctorAI(content); break;
      case 'users': renderUsers(content); break;
      default: renderDashboard(content);
    }
  };

  // ===== PAGE: Dashboard =====
  function renderDashboard(el) {
    var isAdmin = currentUser.role === 'admin';
    var isDoctor = currentUser.role === 'doctor';
    var statsHtml = '';

    if (isAdmin) {
      statsHtml = '<div class="stats-grid">' +
        statCard('👥', '#dbeafe', '1,286', '注册居民') +
        statCard('🩺', '#dcfce7', '12', '签约医生') +
        statCard('⚠️', '#fee2e2', '23', '高危人群') +
        statCard('📅', '#fef3c7', '156', '本月预约') +
        '</div>';
    } else if (isDoctor) {
      statsHtml = '<div class="stats-grid">' +
        statCard('👥', '#dbeafe', '186', '签约居民') +
        statCard('📅', '#fef3c7', '24', '本周预约') +
        statCard('⚠️', '#fee2e2', '8', '高危居民') +
        statCard('📝', '#f3e8ff', '12', '待随访') +
        '</div>';
    } else {
      statsHtml = '<div class="stats-grid">' +
        statCard('❤️', '#fee2e2', '138/88', '最近血压') +
        statCard('💉', '#dbeafe', '7.2', '空腹血糖') +
        statCard('📅', '#fef3c7', '2', '待办预约') +
        statCard('🔔', '#f3e8ff', '4', '今日提醒') +
        '</div>';
    }

    el.innerHTML = statsHtml +
      '<div class="charts-grid">' +
        '<div class="chart-box"><h4>慢性病分布</h4><div id="chart-pie" style="width:100%;height:280px"></div></div>' +
        '<div class="chart-box"><h4>预约趋势</h4><div id="chart-line" style="width:100%;height:280px"></div></div>' +
      '</div>' +
      '<h4 style="margin-bottom:1rem;font-size:0.95rem;">快捷操作</h4>' +
      '<div class="quick-actions">' +
        actionCard('🤖', 'AI健康咨询', '向AI助手咨询健康问题', 'ai-chat') +
        actionCard('📋', '查看健康档案', '查看完整的健康档案信息', 'health-records') +
        actionCard('⚠️', '风险评估', '进行健康风险评估', 'risk-assessment') +
      '</div>';

    initDashboardCharts();
  }

  function statCard(icon, bg, num, label) {
    return '<div class="stat-card"><div class="stat-icon" style="background:' + bg + '">' + icon + '</div><div class="stat-info"><div class="num">' + num + '</div><div class="label">' + label + '</div></div></div>';
  }
  function actionCard(icon, title, desc, page) {
    return '<div class="action-card" onclick="navigateTo(\'' + page + '\')"><div class="action-icon">' + icon + '</div><h4>' + title + '</h4><p>' + desc + '</p></div>';
  }

  function initDashboardCharts() {
    var style = getComputedStyle(document.documentElement);
    var accent = style.getPropertyValue('--accent').trim();
    var accent2 = style.getPropertyValue('--accent2').trim();
    var muted = style.getPropertyValue('--muted').trim();
    var rule = style.getPropertyValue('--rule').trim();

    // Pie chart
    var pieEl = document.getElementById('chart-pie');
    if (pieEl) {
      charts.pie = echarts.init(pieEl, null, { renderer: 'svg' });
      charts.pie.setOption({
        tooltip: { trigger: 'item', appendToBody: true },
        legend: { bottom: 0, textStyle: { color: muted, fontSize: 11 } },
        series: [{
          type: 'pie', radius: ['35%', '60%'], center: ['50%', '45%'],
          data: [
            { value: 35, name: '高血压' }, { value: 25, name: '糖尿病' },
            { value: 18, name: '冠心病' }, { value: 12, name: '慢性呼吸疾病' },
            { value: 10, name: '其他' }
          ],
          color: [accent, accent2, muted, accent + '99', accent2 + '99'],
          label: { color: muted, fontSize: 11 },
          emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.15)' } }
        }],
        animation: false
      });
      window.addEventListener('resize', function() { if(charts.pie) charts.pie.resize(); });
    }

    // Line chart
    var lineEl = document.getElementById('chart-line');
    if (lineEl) {
      charts.line = echarts.init(lineEl, null, { renderer: 'svg' });
      charts.line.setOption({
        tooltip: { trigger: 'axis', appendToBody: true },
        legend: { bottom: 0, textStyle: { color: muted, fontSize: 11 } },
        grid: { top: 20, right: 20, bottom: 40, left: 50 },
        xAxis: { type: 'category', data: ['1月','2月','3月','4月','5月','6月'], axisLabel: { color: muted }, axisLine: { lineStyle: { color: rule } } },
        yAxis: { type: 'value', axisLabel: { color: muted }, splitLine: { lineStyle: { color: rule } } },
        series: [
          {
            name: '线上预约', type: 'line', smooth: true, data: [120,150,180,220,260,310],
            lineStyle: { width: 2, color: accent }, itemStyle: { color: accent },
            areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: accent + '30' }, { offset: 1, color: accent + '05' }] } }
          },
          {
            name: '线下预约', type: 'line', smooth: true, data: [200,190,210,200,180,170],
            lineStyle: { width: 2, color: accent2 }, itemStyle: { color: accent2 },
            areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: accent2 + '30' }, { offset: 1, color: accent2 + '05' }] } }
          }
        ],
        animation: false
      });
      window.addEventListener('resize', function() { if(charts.line) charts.line.resize(); });
    }
  }

  // ===== PAGE: Health Records =====
  function renderHealthRecords(el) {
    var r = HEALTH_RECORD;
    el.innerHTML =
      '<div class="profile-card">' +
        '<div class="avatar-lg">' + r.name[0] + '</div>' +
        '<div class="info">' +
          '<h3>' + r.name + '</h3>' +
          '<p style="color:var(--muted);font-size:0.85rem;">' + r.community + ' | ' + r.gender + ' | ' + r.age + '岁 | ' + r.phone + '</p>' +
          '<div class="tags">' +
            r.chronicDiseases.map(function(d) { return '<span class="tag tag-red">' + d + '</span>'; }).join('') +
            r.allergies.map(function(a) { return '<span class="tag tag-orange">' + a + '</span>'; }).join('') +
            '<span class="tag tag-blue">' + r.bloodType + '</span>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="info-grid">' +
        infoItem('身高', r.height) + infoItem('体重', r.weight) + infoItem('BMI', r.bmi) +
        infoItem('最近体检', r.lastCheckup) + infoItem('血型', r.bloodType) + infoItem('社区', r.community) +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">' +
        '<div class="info-item"><div class="label">慢性病史</div><div style="margin-top:0.5rem;">' + r.chronicDiseases.map(function(d) { return '<span class="tag tag-red" style="margin-right:0.3rem;">' + d + '</span>'; }).join('') + '</div></div>' +
        '<div class="info-item"><div class="label">过敏史</div><div style="margin-top:0.5rem;">' + r.allergies.map(function(a) { return '<span class="tag tag-orange" style="margin-right:0.3rem;">' + a + '</span>'; }).join('') + '</div></div>' +
        '<div class="info-item" style="grid-column:1/-1;"><div class="label">家族病史</div><div style="margin-top:0.5rem;">' + r.familyHistory.map(function(f) { return '<span class="tag tag-purple" style="margin-right:0.3rem;">' + f + '</span>'; }).join('') + '</div></div>' +
      '</div>';
  }
  function infoItem(label, value) {
    return '<div class="info-item"><div class="label">' + label + '</div><div class="value">' + value + '</div></div>';
  }

  // ===== PAGE: Appointments =====
  function renderAppointments(el) {
    el.innerHTML = '<div class="appointments-list">' +
      APPOINTMENTS.map(function(a) {
        return '<div class="appointment-card">' +
          '<div class="date-box"><div class="day">' + a.day + '</div><div class="month">' + a.month + '</div></div>' +
          '<div class="appt-info"><h4>' + a.title + '</h4><p>' + a.time + '</p></div>' +
          '<span class="status-badge status-' + a.status + '">' + a.statusText + '</span>' +
        '</div>';
      }).join('') +
    '</div>';
  }

  // ===== PAGE: Risk Assessment =====
  function renderRiskAssessment(el) {
    el.innerHTML =
      '<div class="assessment-form">' +
        '<h4>健康风险评估</h4>' +
        '<div class="form-row">' +
          '<div class="form-group"><label>收缩压 (mmHg)</label><input type="number" id="assessSystolic" value="138" placeholder="如 120"></div>' +
          '<div class="form-group"><label>舒张压 (mmHg)</label><input type="number" id="assessDiastolic" value="88" placeholder="如 80"></div>' +
          '<div class="form-group"><label>空腹血糖 (mmol/L)</label><input type="number" id="assessGlucose" value="7.2" step="0.1" placeholder="如 5.5"></div>' +
        '</div>' +
        '<div class="form-row">' +
          '<div class="form-group"><label>BMI</label><input type="number" id="assessBMI" value="24.9" step="0.1" placeholder="如 22.0"></div>' +
          '<div class="form-group"><label>年龄</label><input type="number" id="assessAge" value="65" placeholder="如 45"></div>' +
          '<div class="form-group"><label>&nbsp;</label><button class="btn-assess" onclick="doAssessment()">AI 智能评估</button></div>' +
        '</div>' +
      '</div>' +
      '<div class="result-card" id="assessResult"></div>';
  }

  window.doAssessment = function() {
    var systolic = parseFloat(document.getElementById('assessSystolic').value) || 120;
    var diastolic = parseFloat(document.getElementById('assessDiastolic').value) || 80;
    var glucose = parseFloat(document.getElementById('assessGlucose').value) || 5.5;
    var bmi = parseFloat(document.getElementById('assessBMI').value) || 22;
    var age = parseInt(document.getElementById('assessAge').value) || 45;

    // Simple risk calculation
    var score = 0;
    var riskType = [];
    if (systolic >= 140 || diastolic >= 90) { score += 30; riskType.push('高血压风险'); }
    if (glucose >= 7.0) { score += 25; riskType.push('糖尿病风险'); }
    if (bmi >= 28) { score += 15; riskType.push('肥胖风险'); }
    if (age >= 65) { score += 15; riskType.push('年龄因素'); }
    if (systolic >= 160) { score += 15; }

    var level, levelClass, suggestions;
    if (score >= 60) {
      level = '高风险'; levelClass = 'risk-high';
      suggestions = ['立即联系签约医生进行详细检查', '加强血压和血糖监测频率', '严格控制饮食，减少盐和糖的摄入', '避免剧烈运动，保持情绪稳定', '按时服药，不可擅自调整剂量'];
    } else if (score >= 35) {
      level = '中风险'; levelClass = 'risk-medium';
      suggestions = ['建议每月进行一次健康检查', '保持规律服药和健康饮食', '每天适量运动30分钟', '定期监测血压和血糖', '减少高盐高脂食物摄入'];
    } else {
      level = '低风险'; levelClass = 'risk-low';
      suggestions = ['保持当前良好的生活习惯', '建议每年进行一次全面体检', '继续保持适量运动', '注意均衡饮食，保持健康体重'];
    }

    var resultEl = document.getElementById('assessResult');
    resultEl.className = 'result-card show';
    resultEl.innerHTML =
      '<div class="result-header"><h3>AI 评估结果</h3><span class="risk-badge ' + levelClass + '">' + level + '</span></div>' +
      '<div class="result-details">' +
        '<div class="result-detail-item"><div class="num" style="color:var(--danger)">' + score + '</div><div class="label">风险评分</div></div>' +
        '<div class="result-detail-item"><div class="num" style="color:var(--accent)">' + riskType.length + '</div><div class="label">风险因素</div></div>' +
        '<div class="result-detail-item"><div class="num" style="color:var(--accent2)">' + systolic + '/' + diastolic + '</div><div class="label">当前血压</div></div>' +
      '</div>' +
      '<div class="suggestion-box">' +
        '<h4>AI 健康建议</h4>' +
        '<ul>' + suggestions.map(function(s) { return '<li>' + s + '</li>'; }).join('') + '</ul>' +
      '</div>';

    showToast('AI 评估完成：' + level, score >= 60 ? 'warning' : 'success');
  };

  // ===== PAGE: High Risk =====
  function renderHighRisk(el) {
    el.innerHTML =
      '<div class="alert-banner">' +
        '<div class="alert-icon">🚨</div>' +
        '<div><h4>高危人群预警</h4><p>系统已自动识别 ' + HIGH_RISK_PATIENTS.length + ' 名高风险居民，建议及时发起干预措施</p></div>' +
      '</div>' +
      '<div class="patient-list">' +
        HIGH_RISK_PATIENTS.map(function(p) {
          return '<div class="patient-row">' +
            '<div class="p-avatar">' + p.name[0] + '</div>' +
            '<div class="p-info"><h4>' + p.name + '（' + p.age + '岁）</h4><p>' + p.community + ' | ' + p.risk + '</p></div>' +
            '<div style="text-align:center;"><div style="font-size:1.3rem;font-weight:700;color:var(--danger)">' + p.score + '</div><div style="font-size:0.7rem;color:var(--muted)">风险评分</div></div>' +
            '<button class="btn-sm btn-accent" onclick="showToast(\'已创建随访提醒，通知相关医生\',\'success\')">发起干预</button>' +
            '<button class="btn-sm btn-outline" onclick="navigateTo(\'health-records\')">查看档案</button>' +
          '</div>';
        }).join('') +
      '</div>';
  }

  // ===== PAGE: Reminders =====
  function renderReminders(el) {
    el.innerHTML = '<h4 style="margin-bottom:1rem;font-size:0.95rem;">今日提醒</h4>' +
      REMINDERS.map(function(r) {
        return '<div class="reminder-card">' +
          '<div class="r-icon" style="background:' + r.iconBg + '">' + r.icon + '</div>' +
          '<div class="r-info"><h4>' + r.title + '</h4><p>' + r.desc + '</p></div>' +
          '<div class="r-time">' + r.time + '</div>' +
        '</div>';
      }).join('');
  }

  // ===== PAGE: Knowledge =====
  function renderKnowledge(el) {
    el.innerHTML = '<div class="knowledge-grid">' +
      KNOWLEDGE.map(function(k) {
        return '<div class="knowledge-card"><div class="k-tag">' + k.tag + '</div><h4>' + k.title + '</h4><p>' + k.desc + '</p></div>';
      }).join('') +
    '</div>';
  }

  // ===== PAGE: AI Chat =====
  function renderAIChat(el) {
    chatHistory = [
      { role: 'ai', text: '您好，' + (currentUser ? currentUser.name : '') + '！我是您的AI健康助手。我已读取您的健康档案信息，可以为您提供个性化的健康咨询。\n\n您可以问我关于血压管理、血糖控制、用药注意事项、体检报告解读等问题，也可以直接点击下方的快捷问题开始咨询。', time: getTimeStr() }
    ];

    var quickQs = ['我的血压情况如何？', '血糖控制建议', '解读体检报告', '头痛怎么办？'];
    el.innerHTML =
      '<div class="chat-container">' +
        '<div class="chat-header">' +
          '<div class="ai-avatar">🤖</div>' +
          '<div><h4>AI 健康助手</h4><p>基于 DeepSeek 大模型 · 已加载您的健康档案</p></div>' +
        '</div>' +
        '<div class="chat-messages" id="chatMessages"></div>' +
        '<div class="quick-questions" id="quickQuestions">' +
          quickQs.map(function(q) { return '<span class="quick-q" onclick="sendQuickQuestion(\'' + q + '\')">' + q + '</span>'; }).join('') +
        '</div>' +
        '<div class="chat-input">' +
          '<textarea id="chatInput" placeholder="输入您的健康问题..." onkeydown="if(event.key===\'Enter\'&&!event.shiftKey){event.preventDefault();sendMessage()}"></textarea>' +
          '<button onclick="sendMessage()">发 送</button>' +
        '</div>' +
      '</div>';

    renderChatMessages();
  }

  function renderChatMessages() {
    var container = document.getElementById('chatMessages');
    if (!container) return;
    container.innerHTML = chatHistory.map(function(msg) {
      var avatar = msg.role === 'ai' ? '🤖' : (currentUser ? currentUser.avatar : '用');
      var formattedText = msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
      return '<div class="msg ' + msg.role + '">' +
        '<div class="msg-avatar">' + avatar + '</div>' +
        '<div><div class="msg-bubble">' + formattedText + '</div><div class="msg-time">' + msg.time + '</div></div>' +
      '</div>';
    }).join('');
    container.scrollTop = container.scrollHeight;
  }

  window.sendMessage = function() {
    var input = document.getElementById('chatInput');
    var text = input.value.trim();
    if (!text) return;
    input.value = '';

    chatHistory.push({ role: 'user', text: text, time: getTimeStr() });
    renderChatMessages();

    // Show typing
    var container = document.getElementById('chatMessages');
    var typingDiv = document.createElement('div');
    typingDiv.className = 'msg ai';
    typingDiv.id = 'typingMsg';
    typingDiv.innerHTML = '<div class="msg-avatar">🤖</div><div><div class="msg-bubble"><div class="typing-indicator"><span></span><span></span><span></span></div></div></div>';
    container.appendChild(typingDiv);
    container.scrollTop = container.scrollHeight;

    // Simulate AI response
    setTimeout(function() {
      var typingEl = document.getElementById('typingMsg');
      if (typingEl) typingEl.remove();

      var response = AI_RESPONSES['default'];
      var keys = Object.keys(AI_RESPONSES);
      for (var i = 0; i < keys.length; i++) {
        if (keys[i] !== 'default' && text.indexOf(keys[i]) !== -1) {
          response = AI_RESPONSES[keys[i]];
          break;
        }
      }

      chatHistory.push({ role: 'ai', text: response, time: getTimeStr() });
      renderChatMessages();
    }, 1500);
  };

  window.sendQuickQuestion = function(q) {
    document.getElementById('chatInput').value = q;
    sendMessage();
  };

  // ===== PAGE: Doctor AI =====
  function renderDoctorAI(el) {
    el.innerHTML =
      '<h4 style="margin-bottom:1rem;">AI 辅助工具</h4>' +
      '<div class="doctor-ai-grid">' +
        '<div class="doctor-ai-card" onclick="navigateTo(\'risk-assessment\')">' +
          '<div class="d-icon">🔍</div>' +
          '<h4>AI 辅助评估</h4>' +
          '<p>输入居民健康指标，AI自动分析风险等级并生成结构化评估报告</p>' +
        '</div>' +
        '<div class="doctor-ai-card" onclick="showGeneratePlanModal()">' +
          '<div class="d-icon">📋</div>' +
          '<h4>AI 生成随访计划</h4>' +
          '<p>基于居民风险评估结果，AI自动推荐随访时间、方式和重点内容</p>' +
        '</div>' +
        '<div class="doctor-ai-card" onclick="navigateTo(\'ai-chat\')">' +
          '<div class="d-icon">💬</div>' +
          '<h4>AI 智能问答</h4>' +
          '<p>专业医疗AI助手，提供临床决策支持和医学知识查询</p>' +
        '</div>' +
        '<div class="doctor-ai-card" onclick="showToast(\'AI已分析签约居民数据，8名居民需要关注\',\'success\')">' +
          '<div class="d-icon">📊</div>' +
          '<h4>AI 数据分析</h4>' +
          '<p>智能分析签约居民健康趋势，自动识别异常指标和潜在风险</p>' +
        '</div>' +
      '</div>';
  }

  window.showGeneratePlanModal = function() {
    var modal = document.getElementById('modalOverlay');
    var content = document.getElementById('modalContent');
    content.innerHTML =
      '<h3>AI 生成随访计划</h3>' +
      '<div class="form-group"><label>选择居民</label><select><option>张明华（高血压 + 糖尿病）</option><option>李秀英（冠心病）</option><option>刘大爷（高血压III级）</option></select></div>' +
      '<div class="form-group"><label>风险评估结果</label><input type="text" value="高风险 - 评分92" disabled></div>' +
      '<div style="background:var(--bg);border-radius:10px;padding:1rem;margin:1rem 0;border-left:4px solid var(--accent);">' +
        '<h4 style="font-size:0.9rem;color:var(--accent);margin-bottom:0.5rem;">AI 推荐随访计划</h4>' +
        '<ul style="padding-left:1.2rem;font-size:0.85rem;">' +
          '<li>随访时间：本周内（6月18日前）</li>' +
          '<li>随访方式：上门随访</li>' +
          '<li>随访重点：血压控制情况、用药依从性、饮食指导</li>' +
          '<li>下次随访：2周后（7月2日）</li>' +
        '</ul>' +
      '</div>' +
      '<div class="modal-actions">' +
        '<button class="btn-cancel" onclick="closeModal()">取消</button>' +
        '<button class="btn-confirm" onclick="closeModal();showToast(\'随访计划已创建成功\',\'success\')">确认创建</button>' +
      '</div>';
    modal.classList.add('show');
  };

  // ===== PAGE: Users (Admin) =====
  function renderUsers(el) {
    el.innerHTML =
      '<div style="overflow-x:auto;border-radius:12px;border:1px solid var(--rule);">' +
        '<table class="data-table">' +
          '<thead><tr><th>姓名</th><th>角色</th><th>所属社区</th><th>联系电话</th><th>状态</th><th>操作</th></tr></thead>' +
          '<tbody>' +
            ALL_USERS_TABLE.map(function(u) {
              return '<tr>' +
                '<td><strong>' + u.name + '</strong></td>' +
                '<td>' + u.role + '</td>' +
                '<td>' + u.community + '</td>' +
                '<td>' + u.phone + '</td>' +
                '<td><span class="status-badge ' + (u.status === '高危' ? 'status-cancelled' : 'status-completed') + '">' + u.status + '</span></td>' +
                '<td><button class="btn-sm btn-outline" onclick="navigateTo(\'health-records\')">查看</button></td>' +
              '</tr>';
            }).join('') +
          '</tbody>' +
        '</table>' +
      '</div>';
  }

  // ===== UTILS =====
  function getTimeStr() {
    var d = new Date();
    return d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0');
  }

  function updateTime() {
    var el = document.getElementById('currentTime');
    if (el) {
      var d = new Date();
      el.textContent = d.getFullYear() + '-' + (d.getMonth()+1).toString().padStart(2,'0') + '-' + d.getDate().toString().padStart(2,'0') + ' ' + getTimeStr();
    }
  }

  window.showToast = function(msg, type) {
    type = type || 'success';
    var container = document.getElementById('toastContainer');
    var icons = { success: '✅', warning: '⚠️', error: '❌' };
    var toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.innerHTML = '<span>' + (icons[type] || '') + '</span><span>' + msg + '</span>';
    container.appendChild(toast);
    setTimeout(function() { toast.remove(); }, 3000);
  };

  window.closeModal = function() {
    document.getElementById('modalOverlay').classList.remove('show');
  };

  // Close modal on overlay click
  document.getElementById('modalOverlay').addEventListener('click', function(e) {
    if (e.target === this) closeModal();
  });

  // Auto-fill username on role change
  document.getElementById('loginRole').addEventListener('change', function() {
    var roleMap = { user: 'user1', doctor: 'doctor1', admin: 'admin' };
    document.getElementById('loginUsername').value = roleMap[this.value] || '';
  });

})();
