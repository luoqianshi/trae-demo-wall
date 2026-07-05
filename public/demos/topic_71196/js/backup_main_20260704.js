// ===== 导路 - 主逻辑模块 =====

var currentFilter = 'all';
var currentModalIdx = -1;
var selectedIndices = [];
var followedSids = [];
var pwaInstallEvent = null;
var isStudentMode = false;
var currentStudentData = null;
var currentUser = null;
// 多轮对话上下文记忆（最多保存最近10轮）
var chatHistory = [];
var emotionHistory = [];
// AI Agent模式
var aiAgentEnabled = false;
var agentLog = [];
var agentScanCount = 0;
var agentIssueCount = 0;
var agentTimer = null;
var agentMockIssues = [
  { type: '缺勤', desc: '连续3天缺勤', action: '自动生成谈心提纲，建议本周三约谈' },
  { type: '成绩下滑', desc: '最近两次测验成绩下降超过15分', action: '已生成学习帮扶计划，建议安排学习伙伴结对' },
  { type: '作业拖欠', desc: '连续两周未按时提交作业', action: '已生成督促方案，建议与家长沟通' },
  { type: '出勤异常', desc: '本周出勤率低于70%', action: '已标记重点关注，建议每日跟踪出勤' },
  { type: '心理状态', desc: '近期课堂参与度明显下降', action: '已生成关怀谈话提纲，建议温和沟通了解原因' }
];

// ---------- PWA ----------
function initPWA() {
  window.addEventListener('beforeinstallprompt', function(e) {
    e.preventDefault();
    pwaInstallEvent = e;
    var banner = document.getElementById('pwaInstallBanner');
    if (banner) banner.classList.add('show');
  });
  window.addEventListener('appinstalled', function() {
    pwaInstallEvent = null;
    var banner = document.getElementById('pwaInstallBanner');
    if (banner) banner.classList.remove('show');
    showToast('success', '导路已成功安装到桌面');
  });
}

function installPWA() {
  if (!pwaInstallEvent) {
    showToast('info', '您的浏览器可能已安装此应用，或暂不支持安装');
    return;
  }
  pwaInstallEvent.prompt();
  pwaInstallEvent.userChoice.then(function(choice) {
    if (choice.outcome === 'accepted') {
      showToast('success', '正在安装...');
    }
    pwaInstallEvent = null;
    var banner = document.getElementById('pwaInstallBanner');
    if (banner) banner.classList.remove('show');
  });
}

function dismissPWA() {
  pwaInstallEvent = null;
  var banner = document.getElementById('pwaInstallBanner');
  if (banner) banner.classList.remove('show');
  try { localStorage.setItem('daolu_pwa_dismissed', '1'); } catch(e) {}
}

// ---------- 权限与登录状态 ----------

function isLoggedIn() {
  return !!currentUser;
}

function saveLoginState() {
  if (currentUser) {
    try {
      sessionStorage.setItem('daolu_current_user', JSON.stringify(currentUser));
      // 如果勾选了"记住我"，也保存到 localStorage 以实现长期自动登录
      var remember = document.getElementById('loginRemember');
      if (remember && remember.checked) {
        localStorage.setItem('daolu_current_user', JSON.stringify(currentUser));
      }
    } catch(e) {}
  }
}

function restoreLoginState() {
  try {
    var saved = sessionStorage.getItem('daolu_current_user');
    if (saved) {
      currentUser = JSON.parse(saved);
      return true;
    }
  } catch(e) {}
  // 兼容旧版 localStorage
  try {
    var legacy = localStorage.getItem('daolu_current_user');
    if (legacy) {
      currentUser = JSON.parse(legacy);
      return true;
    }
  } catch(e) {}
  return false;
}

function clearLoginState() {
  try {
    sessionStorage.removeItem('daolu_current_user');
    localStorage.removeItem('daolu_current_user');
    localStorage.removeItem('daolu_remember_user');
    localStorage.removeItem('daolu_remember_role');
  } catch(e) {}
}

function switchAccount() {
  doLogout();
}

function getAccessibleStudents() {
  if (!currentUser) return [];
  if (currentUser.role === 'admin') {
    return students.slice();
  } else if (currentUser.role === 'teacher') {
    var managed = currentUser.managedClasses || [];
    return students.filter(function(s) { return managed.indexOf(s.cls) !== -1; });
  } else if (currentUser.role === 'student') {
    return students.filter(function(s) { return s.sid === currentUser.sid; });
  }
  return [];
}

function canAccessStudent(sid) {
  if (!currentUser) return false;
  if (currentUser.role === 'admin') return true;
  if (currentUser.role === 'teacher') {
    var managed = currentUser.managedClasses || [];
    var stu = null;
    for (var i = 0; i < students.length; i++) {
      if (students[i].sid === sid) { stu = students[i]; break; }
    }
    return stu && managed.indexOf(stu.cls) !== -1;
  }
  if (currentUser.role === 'student') {
    return sid === currentUser.sid;
  }
  return false;
}

function updateNavByRole() {
  var navLinks = document.querySelectorAll('.nav-links a[data-role]');
  navLinks.forEach(function(link) {
    var roles = (link.getAttribute('data-role') || '').split(' ');
    if (currentUser && roles.indexOf(currentUser.role) !== -1) {
      link.style.display = '';
    } else {
      link.style.display = 'none';
    }
  });
  // 更新用户信息栏
  var navUserName = document.getElementById('navUserName');
  var navUserRole = document.getElementById('navUserRole');
  var infoBarName = document.getElementById('infoBarName');
  var infoBarRole = document.getElementById('infoBarRole');
  if (currentUser) {
    if (navUserName) navUserName.textContent = currentUser.name;
    if (navUserRole) {
      navUserRole.textContent = roleDisplayName(currentUser.role);
      navUserRole.className = 'user-role-badge role-' + currentUser.role;
    }
    if (infoBarName) infoBarName.textContent = currentUser.name;
    if (infoBarRole) {
      infoBarRole.textContent = roleDisplayName(currentUser.role);
      infoBarRole.className = 'user-role-badge role-' + currentUser.role;
    }
  }
}

function roleDisplayName(role) {
  var map = { admin: '管理员', teacher: '导师', student: '学生' };
  return map[role] || role;
}

function checkPageAccess(pageId) {
  if (!currentUser) return false;
  var pageRoles = {
    'dashboard': ['admin', 'teacher'],
    'chat': ['admin', 'teacher', 'student'],
    'profile': ['admin', 'teacher'],
    'datamanage': ['admin', 'teacher'],
    'workspace': ['admin', 'teacher', 'student'],
    'admin': ['admin'],
    'settings': ['admin'],
    'student': ['student']
  };
  var allowed = pageRoles[pageId] || ['admin', 'teacher', 'student'];
  if (allowed.indexOf(currentUser.role) === -1) {
    showToast('error', '您无权访问该页面');
    if (currentUser.role === 'student') {
      switchPage('student');
    } else {
      switchPage('workspace');
    }
    return false;
  }
  return true;
}

function initStudentView() {
  if (!currentUser || currentUser.role !== 'student') return;
  isStudentMode = true;
  var stu = null;
  for (var j = 0; j < students.length; j++) {
    if (students[j].sid === currentUser.sid) {
      stu = students[j];
      break;
    }
  }
  if (!stu) {
    stu = findStudentAcrossDatasets(currentUser.sid);
  }
  currentStudentData = stu;
  switchToStudentNav();
  document.querySelectorAll('.page').forEach(function(pg) { pg.classList.remove('active'); });
  document.getElementById('page-student').classList.add('active');
  if (stu) {
    renderStudentPage(stu);
  }
}

// ---------- 登录 ----------
function doLogin() {
  var u = document.getElementById('loginUser').value.trim();
  var p = document.getElementById('loginPass').value;
  var role = document.getElementById('loginRole').value;
  if (!u || !p) {
    showToast('error', '请输入账号和密码');
    return;
  }
  // 查找用户
  var user = null;
  for (var i = 0; i < users.length; i++) {
    if (users[i].id === u && users[i].password === p) {
      user = users[i];
      break;
    }
  }
  if (!user) {
    var err = document.getElementById('loginError');
    err.style.display = 'block';
    showToast('error', '账号或密码错误');
    setTimeout(function() { err.style.display = 'none'; }, 3000);
    return;
  }
  // 角色校验
  if (role !== 'auto' && user.role !== role) {
    showToast('error', '角色选择不正确，请重新选择');
    return;
  }
  // 记住我
  var remember = document.getElementById('loginRemember');
  if (remember && remember.checked) {
    try {
      localStorage.setItem('daolu_remember_user', u);
      localStorage.setItem('daolu_remember_role', user.role);
    } catch(e) {}
  }
  // 开始登录
  currentUser = user;
  saveLoginState();
  document.getElementById('loginBtn').style.display = 'none';
  document.getElementById('loginLoading').style.display = 'block';
  setTimeout(function() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('appContainer').style.display = 'block';
    document.getElementById('loginBtn').style.display = 'block';
    document.getElementById('loginLoading').style.display = 'none';
    // 根据角色初始化
    updateNavByRole();
    initNavByRole();
    if (user.role === 'admin') {
      switchPage('admin');
    } else if (user.role === 'teacher') {
      renderTable('all');
      animateNumbers();
      animateRing();
      initOnboarding();
    } else if (user.role === 'student') {
      initStudentView();
    }
    showToast('success', '登录成功，欢迎' + user.name + '！');
  }, 1000);
}

function findStudentAcrossDatasets(sid) {
  var keys = Object.keys(demoDatasets);
  for (var i = 0; i < keys.length; i++) {
    var ds = demoDatasets[keys[i]];
    for (var j = 0; j < ds.length; j++) {
      if (ds[j].sid === sid) return ds[j];
    }
  }
  return null;
}

function initNavByRole() {
  var navDashboard = document.getElementById('navDashboard');
  var navChat = document.getElementById('navChat');
  var navProfile = document.getElementById('navProfile');
  var navWorkspace = document.getElementById('navWorkspace');
  var navAdmin = document.getElementById('navAdmin');
  var navDataManage = document.getElementById('navDataManage');
  var navSettings = document.getElementById('navSettings');
  var navStudent = document.getElementById('navStudent');
  var navMyWarning = document.getElementById('navMyWarning');
  var navMyGrade = document.getElementById('navMyGrade');
  var navContact = document.getElementById('navContact');
  var navUserName = document.getElementById('navUserName');
  if (navUserName && currentUser) navUserName.textContent = currentUser.name;
  if (!currentUser) return;
  if (currentUser.role === 'admin') {
    if (navDashboard) navDashboard.style.display = 'none';
    if (navChat) navChat.style.display = 'none';
    if (navProfile) navProfile.style.display = 'none';
    if (navWorkspace) navWorkspace.style.display = '';
    if (navDataManage) navDataManage.style.display = 'none';
    if (navAdmin) navAdmin.style.display = '';
    if (navSettings) navSettings.style.display = '';
    if (navStudent) navStudent.style.display = 'none';
    if (navMyWarning) navMyWarning.style.display = 'none';
    if (navMyGrade) navMyGrade.style.display = 'none';
    if (navContact) navContact.style.display = 'none';
  } else if (currentUser.role === 'teacher') {
    if (navDashboard) navDashboard.style.display = '';
    if (navChat) navChat.style.display = 'none';
    if (navProfile) navProfile.style.display = '';
    if (navWorkspace) navWorkspace.style.display = '';
    if (navDataManage) navDataManage.style.display = '';
    if (navAdmin) navAdmin.style.display = 'none';
    if (navSettings) navSettings.style.display = 'none';
    if (navStudent) navStudent.style.display = 'none';
    if (navMyWarning) navMyWarning.style.display = 'none';
    if (navMyGrade) navMyGrade.style.display = 'none';
    if (navContact) navContact.style.display = 'none';
  } else if (currentUser.role === 'student') {
    if (navDashboard) navDashboard.style.display = 'none';
    if (navChat) navChat.style.display = 'none';
    if (navProfile) navProfile.style.display = 'none';
    if (navWorkspace) navWorkspace.style.display = '';
    if (navDataManage) navDataManage.style.display = 'none';
    if (navAdmin) navAdmin.style.display = 'none';
    if (navSettings) navSettings.style.display = 'none';
    if (navStudent) navStudent.style.display = '';
    if (navMyWarning) navMyWarning.style.display = '';
    if (navMyGrade) navMyGrade.style.display = '';
    if (navContact) navContact.style.display = '';
  }
}

function doLogout() {
  isStudentMode = false;
  currentStudentData = null;
  currentUser = null;
  clearLoginState();
  restoreTeacherNav();
  // 恢复默认导航显示
  var navDashboard = document.getElementById('navDashboard');
  var navProfile = document.getElementById('navProfile');
  var navWorkspace = document.getElementById('navWorkspace');
  var navAdmin = document.getElementById('navAdmin');
  if (navDashboard) navDashboard.style.display = '';
  if (navProfile) navProfile.style.display = '';
  if (navWorkspace) navWorkspace.style.display = '';
  if (navAdmin) navAdmin.style.display = 'none';
  document.getElementById('appContainer').style.display = 'none';
  document.getElementById('loginPage').style.display = 'flex';
  showToast('info', '已退出登录');
}

// ---------- 学生端快速登录 ----------
function doStudentLogin() {
  // 模拟学生账号登录
  var user = null;
  for (var i = 0; i < users.length; i++) {
    if (users[i].id === '2024030101') {
      user = users[i];
      break;
    }
  }
  if (!user) {
    showToast('error', '未找到学生账号');
    return;
  }
  currentUser = user;
  try {
    localStorage.setItem('daolu_current_user', JSON.stringify(user));
  } catch(e) {}
  document.getElementById('loginBtn').style.display = 'none';
  document.getElementById('loginLoading').style.display = 'block';
  setTimeout(function() {
    document.getElementById('loginBtn').style.display = 'block';
    document.getElementById('loginLoading').style.display = 'none';
    // 查找学生数据
    var stu = null;
    for (var j = 0; j < students.length; j++) {
      if (students[j].sid === '2024030101') {
        stu = students[j];
        break;
      }
    }
    if (!stu) stu = findStudentAcrossDatasets('2024030101');
    if (!stu) {
      showToast('error', '未找到学生数据，请确认当前数据集');
      return;
    }
    isStudentMode = true;
    currentStudentData = stu;
    initNavByRole();
    switchToStudentNav();
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('appContainer').style.display = 'block';
    document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
    document.getElementById('page-student').classList.add('active');
    renderStudentPage(stu);
    showToast('success', '欢迎回来，' + stu.name + '同学！');
  }, 800);
}

function switchToStudentNav() {
  var navLinks = document.getElementById('navLinks');
  var navUser = document.getElementById('navUser');
  // 替换导航链接
  navLinks.innerHTML = '<a onclick="switchStudentPage(\'student\')" class="active"><i class="fa-solid fa-user"></i> 个人信息</a>' +
    '<a onclick="switchStudentPage(\'student\')"><i class="fa-solid fa-bell"></i> 我的预警</a>' +
    '<a onclick="switchStudentPage(\'student\')"><i class="fa-solid fa-chart-column"></i> 我的成绩</a>' +
    '<a onclick="switchStudentPage(\'student\')"><i class="fa-solid fa-envelope"></i> 联系导师</a>';
  // 更新用户名
  var nameSpan = document.getElementById('navUserName');
  if (nameSpan) nameSpan.textContent = currentStudentData ? currentStudentData.name : '学生';
}

function restoreTeacherNav() {
  var navLinks = document.getElementById('navLinks');
  // 恢复默认导航HTML（保留id和data-role属性以便updateNavByRole控制显示）
  navLinks.innerHTML = '<a onclick="switchPage(\'dashboard\')" class="active" data-role="admin teacher" id="navDashboard"><i class="fa-solid fa-chart-line"></i> 预警看板</a>' +
    '<a onclick="switchPage(\'workspace\')" data-role="admin teacher student" id="navWorkspace"><i class="fa-solid fa-briefcase"></i> 工作台</a>' +
    '<a onclick="switchPage(\'chat\')" style="display:none" data-role="admin teacher" id="navChat"><i class="fa-solid fa-comments"></i> 谈心助手</a>' +
    '<a onclick="switchPage(\'profile\')" data-role="admin teacher" id="navProfile"><i class="fa-solid fa-file-waveform"></i> 成长档案</a>' +
    '<a onclick="switchPage(\'datamanage\')" data-role="admin teacher" id="navDataManage"><i class="fa-solid fa-database"></i> 数据管理</a>' +
    '<a onclick="switchPage(\'admin\')" style="display:none" data-role="admin" id="navAdmin"><i class="fa-solid fa-shield-halved"></i> 账号管理</a>' +
    '<a onclick="switchPage(\'settings\')" style="display:none" data-role="admin" id="navSettings"><i class="fa-solid fa-gear"></i> 系统设置</a>' +
    '<a onclick="switchPage(\'student\')" style="display:none" data-role="student" id="navStudent"><i class="fa-solid fa-user"></i> 个人信息</a>' +
    '<a onclick="switchPage(\'student\')" style="display:none" data-role="student" id="navMyWarning"><i class="fa-solid fa-bell"></i> 我的预警</a>' +
    '<a onclick="switchPage(\'student\')" style="display:none" data-role="student" id="navMyGrade"><i class="fa-solid fa-chart-column"></i> 我的成绩</a>' +
    '<a onclick="switchPage(\'student\')" style="display:none" data-role="student" id="navContact"><i class="fa-solid fa-envelope"></i> 联系导师</a>' +
    '<a href="about.html" data-role="admin teacher student"><i class="fa-solid fa-info-circle"></i> 关于</a>';
  var nameSpan = document.getElementById('navUserName');
  if (nameSpan) nameSpan.textContent = '李老师';
}

function switchStudentPage(pageId) {
  document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
  document.getElementById('page-student').classList.add('active');
  document.querySelectorAll('#navLinks a').forEach(function(a) { a.classList.remove('active'); });
  if (event && event.target && event.target.closest('a')) {
    event.target.closest('a').classList.add('active');
  }
  document.getElementById('navLinks').classList.remove('open');
  // 滚动到对应区域
  var sectionMap = {
    'student': 0,
    'student-warning': 'stuWarningSection',
    'student-grade': 'stuBarChart',
    'student-contact': 'stuTalkRecords'
  };
  var target = event && event.target && event.target.closest('a');
  if (target) {
    var idx = Array.from(document.querySelectorAll('#navLinks a')).indexOf(target);
    var sectionIds = [null, 'stuWarningSection', 'stuBarChart', 'stuTalkRecords'];
    if (sectionIds[idx]) {
      var el = document.getElementById(sectionIds[idx]);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}

// ---------- 学生端页面渲染 ----------
function renderStudentPage(stu) {
  // 如果没有传入学生数据，尝试从currentUser查找
  if (!stu && currentUser && currentUser.role === 'student') {
    for (var j = 0; j < students.length; j++) {
      if (students[j].sid === currentUser.sid) {
        stu = students[j];
        break;
      }
    }
    if (!stu) {
      stu = findStudentAcrossDatasets(currentUser.sid);
    }
  }
  if (!stu) {
    document.getElementById('stuPageContent').innerHTML = '<div style="text-align:center;padding:60px 20px;color:var(--text-muted)"><i class="fa-solid fa-circle-info" style="font-size:48px;margin-bottom:16px"></i><div style="font-size:18px;font-weight:600;margin-bottom:8px">暂无数据</div><div>未找到您的学生档案信息，请联系管理员</div></div>';
    return;
  }
  currentStudentData = stu;
  // 个人信息
  document.getElementById('stuAvatar').textContent = stu.name.charAt(0);
  document.getElementById('stuName').textContent = stu.name;
  document.getElementById('stuMeta').textContent = stu.sid + ' | ' + stu.major + '专业 | ' + stu.cls + '班';
  document.getElementById('stuEnroll').textContent = stu.enroll + '年入学';

  // 预警状态
  var levelText = levelMap[stu.level] || '正常';
  var badgeClass = badgeMap[stu.level] || 'badge-green';
  document.getElementById('stuLevelBadge').className = 'badge ' + badgeClass;
  document.getElementById('stuLevelBadge').textContent = levelText;

  var warningContent = document.getElementById('stuWarningContent');
  if (stu.level === 'normal') {
    warningContent.innerHTML = '<div style="text-align:center;padding:20px;color:var(--green)"><i class="fa-solid fa-circle-check" style="font-size:32px;margin-bottom:8px"></i><p style="font-size:15px;font-weight:500">恭喜，你当前学业状态正常</p><p style="font-size:13px;color:var(--text-muted);margin-top:6px">出勤率 ' + stu.attend + '% | 作业完成率 ' + stu.hw + '% | 平均分 ' + stu.avg + '</p><p style="font-size:13px;color:var(--text-muted);margin-top:4px">继续保持良好的学习习惯，加油！</p></div>';
  } else {
    var alertColor = stu.level === 'red' ? 'var(--red)' : stu.level === 'orange' ? 'var(--orange)' : 'var(--blue)';
    var reasons = [];
    if (stu.attend < 80) reasons.push('出勤率偏低（' + stu.attend + '%），建议保证按时上课');
    if (stu.avg < 60) reasons.push('平均成绩偏低（' + stu.avg + '分），建议加强课后复习');
    if (stu.hw < 70) reasons.push('作业完成率低（' + stu.hw + '%），建议按时提交作业');
    var trend = stu.grades[4] > stu.grades[0] ? '成绩近期呈上升趋势，继续保持' : stu.grades[4] < stu.grades[0] ? '成绩近期呈下降趋势，需要引起重视' : '成绩基本持平，需努力提升';
    reasons.push(trend);
    warningContent.innerHTML = '<div style="border-left:4px solid ' + alertColor + ';padding-left:16px">' +
      '<h4 style="color:' + alertColor + ';margin-bottom:10px"><i class="fa-solid fa-triangle-exclamation"></i> 当前为' + levelText + '状态</h4>' +
      '<p style="font-size:14px;margin-bottom:10px">出勤率：' + stu.attend + '% | 作业完成率：' + stu.hw + '% | 平均分：' + stu.avg + '</p>' +
      '<div style="font-size:14px;line-height:2"><strong>预警原因：</strong>' + reasons.map(function(r) { return '<div style="margin-top:4px">- ' + r + '</div>'; }).join('') + '</div>' +
      '<div style="margin-top:12px;padding:10px;background:rgba(245,158,11,.1);border-radius:8px;font-size:13px"><i class="fa-solid fa-lightbulb" style="color:var(--accent)"></i> <strong>建议：</strong>请主动联系导师进行沟通，制定个人学习改进计划。如有任何困难，也可以寻求学校心理辅导中心的帮助。</div>' +
    '</div>';
  }

  // 成绩趋势（柱状图）
  var months = ['第1月', '第2月', '第3月', '第4月', '第5月'];
  var gradeMax = Math.max.apply(null, stu.grades.concat([1]));
  document.getElementById('stuBarChart').innerHTML = stu.grades.map(function(g, i) {
    var h = Math.max(4, g / gradeMax * 140);
    return '<div class="bar-col"><div class="bar-value">' + g + '</div><div class="bar amber" style="height:' + h + 'px"></div><div class="bar-label">' + months[i] + '</div></div>';
  }).join('');

  // 出勤率趋势（折线图） - 使用charts.js的drawLine
  setTimeout(function() {
    var c = document.getElementById('stuLineCanvas');
    if (!c) return;
    var parent = c.parentElement;
    c.width = parent.offsetWidth;
    c.height = parent.offsetHeight;
    var ctx = c.getContext('2d');
    var w = c.width, h = c.height, pad = 30;
    var maxV = 100, minV = 50;
    var data = stu.attTrend;
    var points = data.map(function(v, i) {
      return {
        x: pad + i * (w - 2 * pad) / (data.length - 1),
        y: pad + (maxV - Math.min(v, maxV)) / (maxV - minV) * (h - 2 * pad)
      };
    });
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(16,185,129,0.08)';
    ctx.lineWidth = 1;
    for (var i = 0; i <= 4; i++) {
      var y = pad + i * (h - 2 * pad) / 4;
      ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(w - pad, y); ctx.stroke();
      ctx.fillStyle = '#64748b'; ctx.font = '11px Noto Sans SC';
      ctx.fillText(Math.round(maxV - i * (maxV - minV) / 4) + '%', 4, y + 4);
    }
    ctx.beginPath(); ctx.strokeStyle = '#10b981'; ctx.lineWidth = 2; ctx.lineJoin = 'round';
    points.forEach(function(p, i) { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
    ctx.stroke();
    points.forEach(function(p, i) {
      ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fillStyle = '#10b981'; ctx.fill();
      ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI * 2); ctx.fillStyle = '#0c1220'; ctx.fill();
    });
    // x轴标签
    ctx.fillStyle = '#64748b'; ctx.font = '11px Noto Sans SC'; ctx.textAlign = 'center';
    points.forEach(function(p, i) { ctx.fillText(months[i], p.x, h - 8); });
  }, 200);

  // 导师评价（时间线）
  var evalItems = [
    { time: '2025-01-10', content: '期末表现优秀，课堂参与积极，临床实践能力强，建议继续提升科研素养。', tag: '优秀' },
    { time: '2024-11-15', content: '期中成绩稳定上升，出勤表现优异，团队合作能力突出，被评为班级之星。', tag: '表扬' },
    { time: '2024-09-20', content: '入学适应良好，学习态度端正，建议多参加学术讲座拓展视野。', tag: '建议' }
  ];
  document.getElementById('stuTimeline').innerHTML = evalItems.map(function(t) {
    var tagColor = t.tag === '优秀' ? 'var(--green)' : t.tag === '表扬' ? 'var(--accent)' : 'var(--blue)';
    return '<div class="timeline-item"><div class="time"><i class="fa-regular fa-calendar"></i> ' + t.time + ' <span class="badge" style="background:' + tagColor + ';color:#fff;font-size:11px;margin-left:8px">' + t.tag + '</span></div><div class="content">' + t.content + '</div></div>';
  }).join('');

  // 谈心记录
  var talkRecords = [
    { date: '2025-01-08', topic: '期末复习规划', summary: '与学生讨论了期末复习计划，制定了各科目的复习时间表。学生表示会按照计划执行，争取期末取得好成绩。', mood: '积极' },
    { date: '2024-11-12', topic: '学习方法指导', summary: '了解到学生在药理学学习上遇到困难，建议采用思维导图整理知识点，并推荐了相关学习资源。学生表示会尝试新方法。', mood: '一般' },
    { date: '2024-09-25', topic: '入学适应交流', summary: '新生入学第一次谈话，了解了学生的高中学习背景和大学期望。学生表示对护理专业充满热情，希望未来能成为一名优秀的临床护士。', mood: '积极' }
  ];
  document.getElementById('stuTalkRecords').innerHTML = talkRecords.map(function(r) {
    var moodColor = r.mood === '积极' ? 'var(--green)' : 'var(--accent)';
    return '<div style="padding:16px;margin-bottom:12px;background:var(--card);border-radius:12px;border:1px solid var(--border)">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">' +
        '<strong style="font-size:15px"><i class="fa-solid fa-comment-dots" style="color:#ec4899"></i> ' + r.topic + '</strong>' +
        '<span style="font-size:12px;color:var(--text-muted)"><i class="fa-regular fa-calendar"></i> ' + r.date + '</span>' +
      '</div>' +
      '<p style="font-size:14px;line-height:1.7;margin:0">' + r.summary + '</p>' +
      '<div style="margin-top:8px;font-size:12px;color:' + moodColor + '"><i class="fa-solid fa-face-smile"></i> 学生情绪：' + r.mood + '</div>' +
    '</div>';
  }).join('');
}

function contactTeacher() {
  // 学生端打开谈心助手，自动填充该学生数据
  if (!currentStudentData) {
    showToast('error', '未找到学生数据');
    return;
  }
  switchPage('chat');
  // 发送一条自动消息
  var msg = '我是' + currentStudentData.name + '（学号：' + currentStudentData.sid + '），我想和导师聊聊我的学习情况。';
  document.getElementById('chatInput').value = msg;
  sendChat();
}

// ---------- 导航 ----------
function switchPage(id) {
  if (!checkPageAccess(id)) return;
  document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
  var pageEl = document.getElementById('page-' + id);
  if (pageEl) pageEl.classList.add('active');
  document.querySelectorAll('.nav-links a').forEach(function(a) { a.classList.remove('active'); });
  var clicked = event && event.target.closest('a');
  if (clicked) clicked.classList.add('active');
  if (id === 'profile') { selectProfile(0); }
  if (id === 'workspace') { setTimeout(animateRing, 300); }
  if (id === 'datamanage') { populateDataManageFilters(); renderDataManageTable(); }
  if (id === 'admin') { renderAdminDashboard(); }
  if (id === 'settings') { /* 系统设置页面已静态渲染 */ }
  document.getElementById('navLinks').classList.remove('open');
}

// ---------- 管理员控制台 ----------
function renderAdminDashboard() {
  if (!currentUser || currentUser.role !== 'admin') {
    showToast('error', '无权访问管理员控制台');
    switchPage('dashboard');
    return;
  }
  // 统计概览
  var total = users.length;
  var teachers = users.filter(function(u) { return u.role === 'teacher'; }).length;
  var stus = users.filter(function(u) { return u.role === 'student'; }).length;
  var todayLogins = systemLogs.filter(function(l) { return l.action === '登录系统' && l.time.indexOf(new Date().toISOString().slice(0, 10)) > -1; }).length;
  if (todayLogins === 0) todayLogins = 3; // 模拟今日登录数
  document.getElementById('adminStatTotal').dataset.target = total;
  document.getElementById('adminStatTotal').textContent = total;
  document.getElementById('adminStatTeacher').dataset.target = teachers;
  document.getElementById('adminStatTeacher').textContent = teachers;
  document.getElementById('adminStatStudent').dataset.target = stus;
  document.getElementById('adminStatStudent').textContent = stus;
  document.getElementById('adminStatLogin').dataset.target = todayLogins;
  document.getElementById('adminStatLogin').textContent = todayLogins;

  // 用户管理表格
  var tbody = document.getElementById('userTableBody');
  tbody.innerHTML = users.map(function(u) {
    var roleLabel = u.role === 'admin' ? '<span class="role-tag role-admin">管理员</span>' :
                    u.role === 'teacher' ? '<span class="role-tag role-teacher">导师</span>' :
                    '<span class="role-tag role-student">学生</span>';
    var classInfo = u.role === 'teacher' ? (u.managedClasses || []).join('、') :
                    u.role === 'student' ? (u.class || '') : '全部';
    return '<tr>' +
      '<td><strong>' + u.id + '</strong></td>' +
      '<td>' + u.name + '</td>' +
      '<td>' + roleLabel + '</td>' +
      '<td>' + classInfo + '</td>' +
      '<td>' +
        '<button class="btn btn-outline" style="padding:4px 10px;font-size:12px;margin-right:4px" onclick="openUserForm(\'edit\', \'' + u.id + '\')"><i class="fa-solid fa-pen"></i> 编辑</button>' +
        '<button class="btn btn-outline" style="padding:4px 10px;font-size:12px;margin-right:4px" onclick="resetPassword(\'' + u.id + '\')"><i class="fa-solid fa-rotate-left"></i> 重置密码</button>' +
        (u.id !== 'admin' ? '<button class="btn btn-outline" style="padding:4px 10px;font-size:12px;color:var(--red);border-color:var(--red)" onclick="deleteUser(\'' + u.id + '\')"><i class="fa-solid fa-trash"></i> 删除</button>' : '') +
      '</td>' +
    '</tr>';
  }).join('');

  // 全校预警分布图表
  renderAdminCharts();

  // 系统日志
  var logList = document.getElementById('systemLogList');
  logList.innerHTML = systemLogs.slice(0, 10).map(function(l) {
    return '<div class="log-item">' +
      '<span class="log-time">' + l.time + '</span>' +
      '<span class="log-user">' + l.user + '</span>' +
      '<span class="log-action">' + l.action + '</span>' +
      '<span class="log-detail">' + l.detail + '</span>' +
    '</div>';
  }).join('');
}

function renderAdminCharts() {
  // 预警等级分布
  if (typeof drawPieChart === 'function') {
    var levelCounts = { red: 0, orange: 0, blue: 0, normal: 0 };
    students.forEach(function(s) { levelCounts[s.level] = (levelCounts[s.level] || 0) + 1; });
    drawPieChart('adminPieChartContainer', [
      { label: '红色预警', value: levelCounts.red, color: '#ef4444' },
      { label: '橙色预警', value: levelCounts.orange, color: '#f97316' },
      { label: '蓝色关注', value: levelCounts.blue, color: '#3b82f6' },
      { label: '正常', value: levelCounts.normal, color: '#10b981' }
    ]);
  }
  // 各班级人数
  if (typeof drawBarChart === 'function') {
    var clsCounts = {};
    students.forEach(function(s) { clsCounts[s.cls] = (clsCounts[s.cls] || 0) + 1; });
    var totalStudents = students.length;
    var barData = Object.keys(clsCounts).map(function(c) {
      return { label: c, value: clsCounts[c], color: '#3b82f6', total: totalStudents };
    });
    drawBarChart('adminBarChartContainer', barData);
  }
}

var userFormMode = 'add';
var userFormEditId = null;

function openUserForm(mode, userId) {
  if (!currentUser || currentUser.role !== 'admin') {
    showToast('error', '无权操作');
    return;
  }
  userFormMode = mode;
  userFormEditId = userId || null;
  var modal = document.getElementById('userFormModal');
  var title = document.getElementById('userFormTitle');
  var idInput = document.getElementById('userFormId');
  var nameInput = document.getElementById('userFormName');
  var roleSelect = document.getElementById('userFormRole');
  var passInput = document.getElementById('userFormPassword');
  title.innerHTML = mode === 'add' ? '<i class="fa-solid fa-user-plus"></i> 添加用户' : '<i class="fa-solid fa-pen"></i> 编辑用户';
  if (mode === 'add') {
    idInput.value = '';
    nameInput.value = '';
    roleSelect.value = 'teacher';
    passInput.value = '123456';
    idInput.disabled = false;
    // 重置表单字段
    var mcSelect = document.getElementById('userFormManagedClasses');
    for (var i = 0; i < mcSelect.options.length; i++) {
      mcSelect.options[i].selected = false;
    }
    document.getElementById('userFormClass').value = '';
    document.getElementById('userFormSid').value = '';
  } else {
    var u = null;
    for (var i = 0; i < users.length; i++) {
      if (users[i].id === userId) { u = users[i]; break; }
    }
    if (!u) { showToast('error', '用户不存在'); return; }
    idInput.value = u.id;
    nameInput.value = u.name;
    roleSelect.value = u.role;
    passInput.value = u.password || '123456';
    idInput.disabled = true;
    // 填充管理班级
    if (u.role === 'teacher') {
      var mcSelect = document.getElementById('userFormManagedClasses');
      for (var j = 0; j < mcSelect.options.length; j++) {
        mcSelect.options[j].selected = (u.managedClasses || []).indexOf(mcSelect.options[j].value) > -1;
      }
    }
    if (u.role === 'student') {
      document.getElementById('userFormClass').value = u.class || '';
      document.getElementById('userFormSid').value = u.sid || '';
    }
  }
  onUserFormRoleChange();
  modal.classList.add('show');
}

function closeUserForm() {
  document.getElementById('userFormModal').classList.remove('show');
}

function onUserFormRoleChange() {
  var role = document.getElementById('userFormRole').value;
  var mcWrap = document.getElementById('userFormManagedClassesWrap');
  var classWrap = document.getElementById('userFormClassWrap');
  var sidWrap = document.getElementById('userFormSidWrap');
  if (role === 'teacher') {
    mcWrap.style.display = '';
    classWrap.style.display = 'none';
    sidWrap.style.display = 'none';
  } else if (role === 'student') {
    mcWrap.style.display = 'none';
    classWrap.style.display = '';
    sidWrap.style.display = '';
  } else {
    mcWrap.style.display = 'none';
    classWrap.style.display = 'none';
    sidWrap.style.display = 'none';
  }
}

function saveUserForm() {
  if (!currentUser || currentUser.role !== 'admin') {
    showToast('error', '无权操作');
    return;
  }
  var id = document.getElementById('userFormId').value.trim();
  var name = document.getElementById('userFormName').value.trim();
  var role = document.getElementById('userFormRole').value;
  var password = document.getElementById('userFormPassword').value.trim() || '123456';
  if (!id || !name) {
    showToast('error', '账号和姓名不能为空');
    return;
  }
  var newUser = { id: id, name: name, role: role, password: password };
  if (role === 'teacher') {
    var mcSelect = document.getElementById('userFormManagedClasses');
    var managedClasses = [];
    for (var i = 0; i < mcSelect.options.length; i++) {
      if (mcSelect.options[i].selected) managedClasses.push(mcSelect.options[i].value);
    }
    newUser.managedClasses = managedClasses;
  } else if (role === 'student') {
    newUser.class = document.getElementById('userFormClass').value;
    newUser.sid = document.getElementById('userFormSid').value.trim() || id;
  }
  if (userFormMode === 'add') {
    var exists = false;
    for (var j = 0; j < users.length; j++) {
      if (users[j].id === id) { exists = true; break; }
    }
    if (exists) { showToast('error', '账号已存在'); return; }
    users.push(newUser);
    systemLogs.unshift({ time: new Date().toLocaleString(), user: currentUser.name, action: '添加用户', detail: '账号：' + id });
    showToast('success', '用户添加成功');
  } else {
    for (var k = 0; k < users.length; k++) {
      if (users[k].id === userFormEditId) {
        users[k] = newUser;
        break;
      }
    }
    systemLogs.unshift({ time: new Date().toLocaleString(), user: currentUser.name, action: '编辑用户', detail: '账号：' + id });
    showToast('success', '用户修改成功');
  }
  closeUserForm();
  renderAdminDashboard();
}

function deleteUser(userId) {
  if (!currentUser || currentUser.role !== 'admin') {
    showToast('error', '无权操作');
    return;
  }
  if (userId === 'admin') { showToast('error', '不能删除系统管理员'); return; }
  if (!confirm('确定要删除用户 ' + userId + ' 吗？此操作不可恢复。')) return;
  for (var i = 0; i < users.length; i++) {
    if (users[i].id === userId) {
      users.splice(i, 1);
      break;
    }
  }
  systemLogs.unshift({ time: new Date().toLocaleString(), user: currentUser.name, action: '删除用户', detail: '账号：' + userId });
  showToast('success', '用户已删除');
  renderAdminDashboard();
}

function resetPassword(userId) {
  if (!currentUser || currentUser.role !== 'admin') {
    showToast('error', '无权操作');
    return;
  }
  for (var i = 0; i < users.length; i++) {
    if (users[i].id === userId) {
      users[i].password = '123456';
      break;
    }
  }
  systemLogs.unshift({ time: new Date().toLocaleString(), user: currentUser.name, action: '重置密码', detail: '账号：' + userId });
  showToast('success', '密码已重置为 123456');
  renderAdminDashboard();
}

function openAccountMgmt() {
  showToast('info', '请先以管理员身份登录后访问账号管理');
}

function toggleNav() {
  document.getElementById('navLinks').classList.toggle('open');
}

// ---------- 筛选 & 表格 ----------
function filterStudents(filter) {
  document.querySelectorAll('#filterBar .filter-tag').forEach(function(t) { t.classList.remove('active'); });
  if (event && event.target) event.target.classList.add('active');
  currentFilter = filter;
  renderTable(filter);
}

var searchStudents = debounce(function() {
  renderTable(currentFilter);
}, 300);

function getTeacherManagedStudents() {
  if (!currentUser || currentUser.role !== 'teacher' || !currentUser.managedClasses) {
    return students.slice();
  }
  return students.filter(function(s) {
    return currentUser.managedClasses.indexOf(s.cls) > -1;
  });
}

function renderTable(filter) {
  var tbody = document.getElementById('studentTableBody');
  var searchVal = (document.getElementById('searchInput').value || '').trim().toLowerCase();
  var baseData = getAccessibleStudents();
  var data = filter === 'all' ? baseData.slice() : baseData.filter(function(s) { return s.level === filter; });
  if (searchVal) {
    data = data.filter(function(s) { return s.name.toLowerCase().indexOf(searchVal) > -1 || s.sid.toLowerCase().indexOf(searchVal) > -1; });
  }
  // 高级筛选
  var majorVal = document.getElementById('filterMajor').value;
  var classVal = document.getElementById('filterClass').value;
  var scoreMin = +document.getElementById('scoreMin').value;
  var scoreMax = +document.getElementById('scoreMax').value;
  var attendMin = +document.getElementById('attendMin').value;
  var attendMax = +document.getElementById('attendMax').value;
  if (majorVal) data = data.filter(function(s) { return s.major === majorVal; });
  if (classVal) data = data.filter(function(s) { return s.cls === classVal; });
  data = data.filter(function(s) { return s.avg >= scoreMin && s.avg <= scoreMax; });
  data = data.filter(function(s) { return s.attend >= attendMin && s.attend <= attendMax; });

  // 结果计数
  var countEl = document.getElementById('resultCount');
  if (countEl) countEl.textContent = data.length > 0 ? '共找到 ' + data.length + ' 名学生' : '';

  if (data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:40px;color:var(--text-muted)"><i class="fa-solid fa-magnifying-glass" style="font-size:24px;display:block;margin-bottom:8px"></i>未找到匹配的学生</td></tr>';
    updateBatchBar();
    return;
  }
  tbody.innerHTML = data.map(function(s) {
    var idx = students.indexOf(s);
    var blinkClass = s.level === 'red' ? ' blink' : '';
    var isSelected = selectedIndices.indexOf(idx) > -1;
    var isFollowed = followedSids.indexOf(s.sid) > -1;
    var followIcon = isFollowed ? '<i class="fa-solid fa-star" style="color:var(--accent);margin-left:6px;font-size:12px" title="已关注"></i>' : '';
    var riskScore = calculateRiskScore(s);
    var riskInfo = getRiskLevelInfo(riskScore);
    var attArrow = getTrendArrow(s.attendanceHistory || s.attTrend || []);
    return '<tr>' +
      '<td><input type="checkbox" ' + (isSelected ? 'checked' : '') + ' onchange="toggleSelect(' + idx + ')"></td>' +
      '<td><strong>' + s.name + '</strong>' + followIcon + '</td><td>' + s.sid + '</td><td>' + s.major + '</td>' +
      '<td>' + s.attend + '%</td><td>' + s.hw + '%</td><td>' + s.avg + '</td>' +
      '<td><span class="badge ' + badgeMap[s.level] + blinkClass + '">' + levelMap[s.level] + '</span></td>' +
      '<td><span class="risk-prediction-cell" onclick="showRiskDetail(\'' + s.sid + '\')" style="cursor:pointer;color:' + riskInfo.color + ';font-weight:600"><span class="risk-prediction-bar" style="width:' + Math.min(100, riskScore) + '%;background:' + riskInfo.color + '"></span>' + riskScore + '% ' + attArrow + '</span></td>' +
      '<td><button class="btn btn-primary" onclick="openDetail(' + idx + ')"><i class="fa-solid fa-eye"></i> 查看</button></td>' +
    '</tr>';
  }).join('');
  updateBatchBar();
}

function updateStats() {
  var accessible = getAccessibleStudents();
  var total = accessible.length;
  var red = accessible.filter(function(s) { return s.level === 'red'; }).length;
  var orange = accessible.filter(function(s) { return s.level === 'orange'; }).length;
  var blue = accessible.filter(function(s) { return s.level === 'blue'; }).length;
  var tags = document.querySelectorAll('#filterBar .filter-tag');
  if (tags[0]) tags[0].innerHTML = '全部 (' + total + ')';
  if (tags[1]) tags[1].innerHTML = '<i class="fa-solid fa-circle" style="color:var(--red);font-size:8px"></i> 红色预警 (' + red + ')';
  if (tags[2]) tags[2].innerHTML = '<i class="fa-solid fa-circle" style="color:var(--orange);font-size:8px"></i> 橙色预警 (' + orange + ')';
  if (tags[3]) tags[3].innerHTML = '<i class="fa-solid fa-circle" style="color:var(--blue);font-size:8px"></i> 蓝色关注 (' + blue + ')';
  if (tags[4]) tags[4].innerHTML = '<i class="fa-solid fa-circle" style="color:var(--green);font-size:8px"></i> 正常';

  var statVals = document.querySelectorAll('#page-dashboard .num-roll');
  if (statVals[0]) { statVals[0].dataset.target = total; statVals[0].textContent = '0'; }
  if (statVals[1]) { statVals[1].dataset.target = red; statVals[1].textContent = '0'; }
  if (statVals[2]) { statVals[2].dataset.target = orange; statVals[2].textContent = '0'; }
  if (statVals[3]) { statVals[3].dataset.target = blue; statVals[3].textContent = '0'; }
  animatedNumbers = new WeakSet();
  animateNumbers();
}

// ---------- 高级筛选 ----------
function populateFilters() {
  var majorSel = document.getElementById('filterMajor');
  var classSel = document.getElementById('filterClass');
  if (!majorSel || !classSel) return;
  var accessible = getAccessibleStudents();
  var majors = [];
  var classes = [];
  accessible.forEach(function(s) {
    if (majors.indexOf(s.major) === -1) majors.push(s.major);
    if (classes.indexOf(s.cls) === -1) classes.push(s.cls);
  });
  var curMajor = majorSel.value;
  var curClass = classSel.value;
  majorSel.innerHTML = '<option value="">全部专业</option>' + majors.map(function(m) { return '<option value="' + m + '">' + m + '</option>'; }).join('');
  classSel.innerHTML = '<option value="">全部班级</option>' + classes.map(function(c) { return '<option value="' + c + '">' + c + '</option>'; }).join('');
  majorSel.value = curMajor;
  classSel.value = curClass;
  // 同步更新数据管理页面的筛选器
  populateDataManageFilters();
}

function applyFilters() {
  renderTable(currentFilter);
  updateDualSliderFills();
}

function resetFilters() {
  document.getElementById('filterMajor').value = '';
  document.getElementById('filterClass').value = '';
  document.getElementById('scoreMin').value = 0;
  document.getElementById('scoreMax').value = 100;
  document.getElementById('attendMin').value = 0;
  document.getElementById('attendMax').value = 100;
  document.getElementById('searchInput').value = '';
  selectedIndices = [];
  document.getElementById('selectAll').checked = false;
  updateDualSliderFills();
  renderTable(currentFilter);
}

function onScoreMinChange() {
  var min = +document.getElementById('scoreMin').value;
  var max = +document.getElementById('scoreMax').value;
  if (min > max) { document.getElementById('scoreMax').value = min; }
  document.getElementById('scoreRangeLabel').textContent = document.getElementById('scoreMin').value + ' - ' + document.getElementById('scoreMax').value;
  applyFilters();
}
function onScoreMaxChange() {
  var min = +document.getElementById('scoreMin').value;
  var max = +document.getElementById('scoreMax').value;
  if (max < min) { document.getElementById('scoreMin').value = max; }
  document.getElementById('scoreRangeLabel').textContent = document.getElementById('scoreMin').value + ' - ' + document.getElementById('scoreMax').value;
  applyFilters();
}
function onAttendMinChange() {
  var min = +document.getElementById('attendMin').value;
  var max = +document.getElementById('attendMax').value;
  if (min > max) { document.getElementById('attendMax').value = min; }
  document.getElementById('attendRangeLabel').textContent = document.getElementById('attendMin').value + '% - ' + document.getElementById('attendMax').value + '%';
  applyFilters();
}
function onAttendMaxChange() {
  var min = +document.getElementById('attendMin').value;
  var max = +document.getElementById('attendMax').value;
  if (max < min) { document.getElementById('attendMin').value = max; }
  document.getElementById('attendRangeLabel').textContent = document.getElementById('attendMin').value + '% - ' + document.getElementById('attendMax').value + '%';
  applyFilters();
}
function updateDualSliderFills() {
  var scoreMin = +document.getElementById('scoreMin').value;
  var scoreMax = +document.getElementById('scoreMax').value;
  var scoreFill = document.getElementById('scoreFill');
  if (scoreFill) {
    scoreFill.style.left = (scoreMin / 100 * 100) + '%';
    scoreFill.style.width = ((scoreMax - scoreMin) / 100 * 100) + '%';
  }
  var attendMin = +document.getElementById('attendMin').value;
  var attendMax = +document.getElementById('attendMax').value;
  var attendFill = document.getElementById('attendFill');
  if (attendFill) {
    attendFill.style.left = (attendMin / 100 * 100) + '%';
    attendFill.style.width = ((attendMax - attendMin) / 100 * 100) + '%';
  }
}

// ---------- 批量操作 ----------
function toggleSelectAll() {
  var checked = document.getElementById('selectAll').checked;
  var searchVal = (document.getElementById('searchInput').value || '').trim().toLowerCase();
  var accessible = getAccessibleStudents();
  var data = currentFilter === 'all' ? accessible.slice() : accessible.filter(function(s) { return s.level === currentFilter; });
  if (searchVal) {
    data = data.filter(function(s) { return s.name.toLowerCase().indexOf(searchVal) > -1 || s.sid.toLowerCase().indexOf(searchVal) > -1; });
  }
  var majorVal = document.getElementById('filterMajor').value;
  var classVal = document.getElementById('filterClass').value;
  var scoreMin = +document.getElementById('scoreMin').value;
  var scoreMax = +document.getElementById('scoreMax').value;
  var attendMin = +document.getElementById('attendMin').value;
  var attendMax = +document.getElementById('attendMax').value;
  if (majorVal) data = data.filter(function(s) { return s.major === majorVal; });
  if (classVal) data = data.filter(function(s) { return s.cls === classVal; });
  data = data.filter(function(s) { return s.avg >= scoreMin && s.avg <= scoreMax; });
  data = data.filter(function(s) { return s.attend >= attendMin && s.attend <= attendMax; });

  data.forEach(function(s) {
    var idx = students.indexOf(s);
    if (checked) {
      if (selectedIndices.indexOf(idx) === -1) selectedIndices.push(idx);
    } else {
      var pos = selectedIndices.indexOf(idx);
      if (pos > -1) selectedIndices.splice(pos, 1);
    }
  });
  renderTable(currentFilter);
}

function toggleSelect(idx) {
  var pos = selectedIndices.indexOf(idx);
  if (pos > -1) {
    selectedIndices.splice(pos, 1);
  } else {
    selectedIndices.push(idx);
  }
  renderTable(currentFilter);
}

function updateBatchBar() {
  var bar = document.getElementById('batchBar');
  var countEl = document.getElementById('batchCount');
  if (!bar || !countEl) return;
  if (selectedIndices.length > 0) {
    bar.style.display = 'flex';
    countEl.textContent = selectedIndices.length;
  } else {
    bar.style.display = 'none';
  }
  var allCheckbox = document.getElementById('selectAll');
  if (allCheckbox) {
    var tbody = document.getElementById('studentTableBody');
    var rowBoxes = tbody.querySelectorAll('input[type="checkbox"]');
    var checkedBoxes = tbody.querySelectorAll('input[type="checkbox"]:checked');
    allCheckbox.checked = rowBoxes.length > 0 && rowBoxes.length === checkedBoxes.length;
  }
}

function batchMarkFollowed() {
  if (selectedIndices.length === 0) return;
  var count = 0;
  selectedIndices.forEach(function(idx) {
    var s = students[idx];
    if (s && canAccessStudent(s.sid) && followedSids.indexOf(s.sid) === -1) {
      followedSids.push(s.sid);
      count++;
    }
  });
  try { localStorage.setItem('daolu_followed', JSON.stringify(followedSids)); } catch(e) {}
  showToast('success', '已标记 ' + count + ' 名学生为已关注');
  renderTable(currentFilter);
}

function batchExportCSV() {
  if (selectedIndices.length === 0) return;
  var headers = ['姓名', '学号', '专业', '班级', '出勤率', '作业率', '平均分', '预警等级'];
  var rows = selectedIndices.filter(function(idx) {
    return canAccessStudent(students[idx].sid);
  }).map(function(idx) {
    var s = students[idx];
    return [s.name, s.sid, s.major, s.cls, s.attend + '%', s.hw + '%', s.avg, levelMap[s.level] || s.level];
  });
  var csv = '\ufeff' + headers.join(',') + '\n' + rows.map(function(r) { return r.join(','); }).join('\n');
  var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = '导路学生名单_' + new Date().toLocaleDateString() + '.csv';
  a.click();
  URL.revokeObjectURL(url);
  showToast('success', '已导出 ' + rows.length + ' 名学生名单');
}

function generateTalkOutlineForStudent(s) {
  var talkPoints = s.level === 'red' ? [
    '了解近期缺勤和成绩下滑的具体原因（家庭、心理、学习方法等）',
    '共同制定短期目标：下周出勤率提升至80%，完成3次作业',
    '介绍班级学业帮扶小组，安排优秀学生一对一结对',
    '如涉及心理问题，转介心理咨询中心跟进',
    '约定下次回访时间（建议一周后），持续关注改善情况'
  ] : s.level === 'orange' ? [
    '询问近期学习是否有困难，了解是否有外部因素影响',
    '分析薄弱科目，制定针对性的学习改进计划',
    '鼓励参加课后辅导或学习小组',
    '设定阶段性目标，每两周进行一次进度检查',
    '关注学生的情绪变化，提供必要支持和鼓励'
  ] : s.level === 'blue' ? [
    '了解学生近期是否有特殊情况影响学习',
    '分析成绩波动原因，制定巩固提升计划',
    '鼓励加强课堂参与和课后复习',
    '关注学生心理状态，提供积极引导',
    '设定月度目标，定期检查进度'
  ] : [
    '肯定学生在本学期的整体表现',
    '了解学生的职业规划和发展方向',
    '鼓励参加技能竞赛或实践活动，提升综合素养',
    '讨论下学期学习目标和提升空间',
    '保持良好势头，建立长期成长档案'
  ];
  return '【' + s.name + ' | ' + s.sid + ' | ' + s.major + '】\n' +
    '预警等级：' + (levelMap[s.level] || s.level) + ' | 出勤率：' + s.attend + '% | 平均分：' + s.avg + '\n' +
    '谈心提纲：\n' + talkPoints.map(function(p, i) { return (i + 1) + '. ' + p; }).join('\n') + '\n' +
    '----------------------------------------\n';
}

function batchGenerateTalkOutlines() {
  var accessibleIndices = selectedIndices.filter(function(idx) { return canAccessStudent(students[idx].sid); });
  if (accessibleIndices.length === 0) return;
  var modal = document.getElementById('batchProgressModal');
  var fill = document.getElementById('batchProgressFill');
  var text = document.getElementById('batchProgressText');
  if (modal) modal.classList.add('show');
  var total = accessibleIndices.length;
  var result = '';
  var i = 0;

  function next() {
    if (i >= total) {
      if (fill) fill.style.width = '100%';
      if (text) text.textContent = '已完成，正在生成文件...';
      setTimeout(function() {
        var blob = new Blob([result], { type: 'text/plain;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = '谈心提纲_' + new Date().toLocaleDateString() + '.txt';
        a.click();
        URL.revokeObjectURL(url);
        if (modal) modal.classList.remove('show');
        showToast('success', '谈心提纲生成完成，共 ' + total + ' 名');
      }, 500);
      return;
    }
    var idx = accessibleIndices[i];
    var s = students[idx];
    if (s) result += generateTalkOutlineForStudent(s);
    i++;
    var pct = Math.round(i / total * 100);
    if (fill) fill.style.width = pct + '%';
    if (text) text.textContent = '正在生成第 ' + i + '/' + total + ' 名学生的谈心提纲 (' + pct + '%)';
    setTimeout(next, 300);
  }
  next();
}

// ---------- AI批量对比分析 ----------
function batchAIAnalysis() {
  var accessibleIndices = selectedIndices.filter(function(idx) { return canAccessStudent(students[idx].sid); });
  if (accessibleIndices.length === 0) {
    showToast('error', '请先选择学生');
    return;
  }
  if (accessibleIndices.length < 2) {
    showToast('error', '请至少选择2名学生进行对比分析');
    return;
  }

  var modal = document.getElementById('batchAnalysisModal');
  var content = document.getElementById('batchAnalysisContent');
  content.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted)"><i class="fa-solid fa-circle-notch fa-spin" style="font-size:24px;margin-bottom:12px"></i><p>正在分析选中学生的数据，请稍候...</p></div>';
  modal.style.display = 'flex';

  // 构造学生数据列表
  var studentDataList = '';
  accessibleIndices.forEach(function(idx) {
    var s = students[idx];
    if (s) {
      studentDataList += '姓名：' + s.name + '，学号：' + s.sid + '，专业：' + s.major + '，班级：' + s.cls +
        '，出勤率：' + s.attend + '%，作业完成率：' + s.hw + '%，平均分：' + s.avg +
        '，预警等级：' + (levelMap[s.level] || s.level) +
        '，成绩趋势：' + s.grades.join('、') + '\n';
    }
  });

  var prompt = '请对比分析以下' + accessibleIndices.length + '名学生的学业数据，找出共性问题、个体差异、分类建议。请从以下维度分析：\n' +
    '1. 共性问题分析：这些学生有哪些共同的学业困难或表现特征\n' +
    '2. 个体差异分析：每名学生之间的主要差异\n' +
    '3. 分类建议：根据分析结果给出针对性的分类帮扶建议\n' +
    '4. 优先级排序：建议优先关注的学生和干预措施\n\n' +
    '学生数据列表：\n' + studentDataList;

  // 使用流式输出模拟（先获取完整结果，再逐字显示）
  callAI(prompt, '批量对比分析').then(function(result) {
    content.innerHTML = '<div id="batchAnalysisStream" class="batch-analysis-stream" style="font-size:14px;line-height:1.8;color:var(--text-muted);white-space:pre-wrap"></div>';
    var streamEl = document.getElementById('batchAnalysisStream');
    var index = 0;
    var speed = 20; // 每字显示间隔(ms)

    function typeChar() {
      if (index < result.length) {
        streamEl.innerHTML = result.substring(0, index + 1).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
        index++;
        setTimeout(typeChar, speed);
      } else {
        streamEl.innerHTML = result.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
        showToast('success', '对比分析完成');
      }
    }
    typeChar();
  });
}

function closeBatchAnalysis() {
  document.getElementById('batchAnalysisModal').style.display = 'none';
}

function printBatchAnalysis() {
  var content = document.getElementById('batchAnalysisContent');
  if (!content) return;
  var printWin = window.open('', '_blank');
  printWin.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>AI批量对比分析</title>' +
    '<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;600;700&display=swap" rel="stylesheet">' +
    '<style>body{font-family:"Noto Sans SC",sans-serif;padding:40px;max-width:800px;margin:0 auto;line-height:1.8;color:#333}h2{margin-bottom:12px}</style>' +
    '</head><body>' + content.innerHTML + '<script>setTimeout(function(){window.print();},500);<\/script></body></html>');
  printWin.document.close();
}

function exportBatchAnalysisPDF() {
  var modal = document.getElementById('batchAnalysisModal').querySelector('.modal');
  if (!modal) return;
  showToast('info', '正在生成对比分析PDF，请稍候...');
  html2canvas(modal, { scale: 2, backgroundColor: null, useCORS: true }).then(function(canvas) {
    var imgData = canvas.toDataURL('image/png');
    var pdf = new window.jspdf.jsPDF('p', 'mm', 'a4');
    var pdfWidth = pdf.internal.pageSize.getWidth();
    var pdfHeight = pdf.internal.pageSize.getHeight();
    var imgWidth = canvas.width;
    var imgHeight = canvas.height;
    var ratio = (pdfWidth - 20) / imgWidth;
    var totalHeight = imgHeight * ratio;
    var pageHeight = pdfHeight - 20;
    var page = 0;
    var yOffset = 10;
    while (yOffset < totalHeight) {
      if (page > 0) pdf.addPage();
      var srcY = page * pageHeight / ratio;
      var srcH = Math.min(imgHeight - srcY, pageHeight / ratio);
      pdf.addImage(imgData, 'PNG', 10, yOffset - page * pageHeight, imgWidth * ratio, srcH * ratio, undefined, 'FAST');
      yOffset += pageHeight;
      page++;
    }
    pdf.save('AI批量对比分析_' + new Date().toLocaleDateString() + '.pdf');
    showToast('success', '对比分析PDF导出成功');
  }).catch(function(err) {
    showToast('error', 'PDF导出失败：' + err.message);
  });
}

// ---------- 弹窗 ----------
function openDetail(idx) {
  currentModalIdx = idx;
  var s = students[idx];
  if (!canAccessStudent(s.sid)) {
    showToast('error', '您无权查看该学生信息');
    return;
  }
  document.getElementById('modalTitle').textContent = s.name + ' - 学生详情';
  var months = ['第1月', '第2月', '第3月', '第4月', '第5月'];
  var gradeColors = s.avg < 50 ? 'red' : s.avg < 60 ? 'red' : s.avg < 70 ? 'amber' : 'amber';

  var alertMsg = s.level === 'red'
    ? '该学生出勤率为' + s.attend + '%，平均成绩' + s.avg + '分，已触发红色预警。建议立即约谈，了解原因并制定帮扶计划。'
    : s.level === 'orange'
    ? '该学生出勤率为' + s.attend + '%，平均成绩' + s.avg + '分，处于橙色预警状态。建议关注近期学习动态，适时干预。'
    : s.level === 'blue'
    ? '该学生出勤率为' + s.attend + '%，平均成绩' + s.avg + '分，处于蓝色关注状态。建议定期跟进，预防进一步下滑。'
    : '该学生各项指标正常，建议保持关注，继续鼓励。';
  var alertColor = s.level === 'red' ? 'var(--red)' : s.level === 'orange' ? 'var(--orange)' : s.level === 'blue' ? 'var(--blue)' : 'var(--green)';

  var talkPoints = s.level === 'red' ? [
    '了解近期缺勤和成绩下滑的具体原因（家庭、心理、学习方法等）',
    '共同制定短期目标：下周出勤率提升至80%，完成3次作业',
    '介绍班级学业帮扶小组，安排优秀学生一对一结对',
    '如涉及心理问题，转介心理咨询中心跟进',
    '约定下次回访时间（建议一周后），持续关注改善情况'
  ] : s.level === 'orange' ? [
    '询问近期学习是否有困难，了解是否有外部因素影响',
    '分析薄弱科目，制定针对性的学习改进计划',
    '鼓励参加课后辅导或学习小组',
    '设定阶段性目标，每两周进行一次进度检查',
    '关注学生的情绪变化，提供必要支持和鼓励'
  ] : [
    '肯定学生在本学期的整体表现',
    '了解学生的职业规划和发展方向',
    '鼓励参加技能竞赛或实践活动，提升综合素养',
    '讨论下学期学习目标和提升空间',
    '保持良好势头，建立长期成长档案'
  ];

  var career = careerMap[s.major] || careerMap['护理'];
  var skillsHtml = career.skills.map(function(sk) {
    var val = s[sk.valKey] || 0;
    if (sk.scale) val = Math.round(val * sk.scale);
    val = Math.min(95, val + (sk.offset || 0));
    return '<div class="skill-bar-wrap"><div class="skill-bar-label"><span>' + sk.name + '</span><span>' + val + '%</span></div><div class="skill-bar"><div class="skill-bar-fill" style="width:' + val + '%"></div></div></div>';
  }).join('');

  document.getElementById('modalBody').innerHTML =
    '<div class="modal-tabs">' +
      '<button class="modal-tab active" onclick="switchModalTab(\'academic\',this)"><i class="fa-solid fa-graduation-cap"></i> 学业数据</button>' +
      '<button class="modal-tab" onclick="switchModalTab(\'diagnosis\',this)"><i class="fa-solid fa-robot"></i> AI协作诊断</button>' +
      '<button class="modal-tab" onclick="switchModalTab(\'career\',this)"><i class="fa-solid fa-briefcase"></i> AI职业画像</button>' +
    '</div>' +
    '<div class="modal-tab-content active" id="tabAcademic">' +
      '<div class="detail-grid">' +
        '<div class="detail-item"><div class="dl"><i class="fa-solid fa-user"></i> 姓名</div><div class="dv">' + s.name + '</div></div>' +
        '<div class="detail-item"><div class="dl"><i class="fa-solid fa-id-card"></i> 学号</div><div class="dv">' + s.sid + '</div></div>' +
        '<div class="detail-item"><div class="dl"><i class="fa-solid fa-book-medical"></i> 专业</div><div class="dv">' + s.major + '</div></div>' +
        '<div class="detail-item"><div class="dl"><i class="fa-solid fa-users-rectangle"></i> 班级</div><div class="dv">' + s.cls + '</div></div>' +
        '<div class="detail-item"><div class="dl"><i class="fa-solid fa-calendar"></i> 入学时间</div><div class="dv">' + s.enroll + '</div></div>' +
        '<div class="detail-item"><div class="dl"><i class="fa-solid fa-clipboard-check"></i> 预警等级</div><div class="dv"><span class="badge ' + badgeMap[s.level] + '">' + levelMap[s.level] + '</span></div></div>' +
      '</div>' +
      '<div id="alertBoxArea" class="alert-box" style="border-color:' + alertColor + '">'+
        '<h3 style="color:' + alertColor + '"><i class="fa-solid fa-robot"></i> AI预警分析</h3>' +
        '<p>' + alertMsg + '</p>' +
      '</div>' +
      '<div class="chart-section">' +
        '<h3><i class="fa-solid fa-chart-column"></i> 本学期成绩趋势</h3>' +
        '<div class="bar-chart">' + s.grades.map(function(g, i) {
          return '<div class="bar-col"><div class="bar-value">' + g + '</div><div class="bar ' + gradeColors + '" style="height:' + Math.max(4, g * 1.5) + 'px"></div><div class="bar-label">' + months[i] + '</div></div>';
        }).join('') + '</div>' +
      '</div>' +
      '<div class="chart-section">' +
        '<h3><i class="fa-solid fa-chart-line"></i> 出勤率趋势</h3>' +
        '<div class="line-chart"><canvas id="lineCanvas"></canvas></div>' +
      '</div>' +
      '<button class="btn-ai" onclick="toggleTalk()"><i class="fa-solid fa-wand-magic-sparkles"></i> AI生成谈心提纲</button>' +
      '<div class="talk-outline" id="talkOutline">' +
        '<h3><i class="fa-solid fa-list-check"></i> AI谈心提纲 - ' + s.name + '</h3>' +
        talkPoints.map(function(p, i) { return '<div class="talk-item"><strong>' + (i + 1) + '.</strong> ' + p + '</div>'; }).join('') +
      '</div>' +
      '<button class="btn-ai" style="background:linear-gradient(135deg,var(--blue),#1d4ed8)" onclick="predictTrend()"><i class="fa-solid fa-brain"></i> AI趋势预测</button>' +
      '<div id="trendPrediction" class="trend-prediction" style="display:none"></div>' +
      '<div class="intervention-actions">' +
        '<button class="btn btn-primary" onclick="openIntervention(\'' + s.sid + '\')"><i class="fa-solid fa-hand-holding-heart"></i> 记录干预</button>' +
        '<button class="btn btn-outline" onclick="viewInterventions(\'' + s.sid + '\')"><i class="fa-solid fa-clipboard-list"></i> 查看干预历史</button>' +
      '</div>' +
      '<div id="evalBoxArea"></div>' +
    '</div>' +
    '<div class="modal-tab-content" id="tabDiagnosis">' +
      '<div class="agent-grid">' +
        '<div class="agent-card" id="agentData"><div class="agent-header"><div class="agent-icon blue"><i class="fa-solid fa-chart-line"></i></div><div class="agent-title">数据Agent</div><div class="agent-status" id="agentDataStatus">等待中</div></div><div class="agent-body" id="agentDataBody">点击"开始诊断"按钮启动多Agent协作分析</div></div>' +
        '<div class="agent-card" id="agentPsy"><div class="agent-header"><div class="agent-icon purple"><i class="fa-solid fa-heart"></i></div><div class="agent-title">心理Agent</div><div class="agent-status" id="agentPsyStatus">等待中</div></div><div class="agent-body" id="agentPsyBody">等待数据Agent分析完成...</div></div>' +
        '<div class="agent-card" id="agentCareer"><div class="agent-header"><div class="agent-icon green"><i class="fa-solid fa-briefcase"></i></div><div class="agent-title">职业Agent</div><div class="agent-status" id="agentCareerStatus">等待中</div></div><div class="agent-body" id="agentCareerBody">等待心理Agent分析完成...</div></div>' +
      '</div>' +
      '<div class="agent-conclusion" id="agentConclusion" style="display:none">' +
        '<div class="agent-header"><div class="agent-icon amber"><i class="fa-solid fa-robot"></i></div><div class="agent-title">综合Agent结论</div></div>' +
        '<div class="agent-body" id="agentConclusionBody"></div>' +
      '</div>' +
      '<button class="btn-ai" onclick="runMultiAgentDiagnosis(\'' + s.sid + '\')"><i class="fa-solid fa-wand-magic-sparkles"></i> 开始AI协作诊断</button>' +
    '</div>' +
    '<div class="modal-tab-content" id="tabCareer">' +
      '<div class="career-card">' +
        '<h4><i class="fa-solid fa-compass"></i> 推荐职业方向</h4>' +
        '<div>' + career.directions.map(function(d) { return '<span class="career-tag">' + d + '</span>'; }).join('') + '</div>' +
      '</div>' +
      '<div class="career-card">' +
        '<h4><i class="fa-solid fa-star"></i> 技能匹配度</h4>' + skillsHtml +
      '</div>' +
      '<div class="career-card">' +
        '<h4><i class="fa-solid fa-route"></i> 职业发展路径</h4>' +
        '<div class="career-path">' +
          '<div class="career-path-item">' +
            '<div class="cp-title">在校学习阶段</div>' +
            '<div class="cp-desc">夯实专业理论基础，考取' + s.major + '相关资格证书，积极参加实验室实训和技能竞赛，积累临床实践经验。</div>' +
          '</div>' +
          '<div class="career-path-item">' +
            '<div class="cp-title">实习实践阶段</div>' +
            '<div class="cp-desc">进入医院/药企/康复中心进行临床实习，在带教老师指导下完成实际工作任务，建立职业人脉网络。</div>' +
          '</div>' +
          '<div class="career-path-item">' +
            '<div class="cp-title">就业上岗阶段</div>' +
            '<div class="cp-desc">通过校园招聘或社会招聘进入目标岗位，持续进修提升专业技能，向专科化、管理方向发展。</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  document.getElementById('detailModal').classList.add('show');
  setTimeout(function() { drawLine(s.attTrend); }, 100);

  // 使用结构化AI预警分析
  var alertSchema = { level: 'string', score: 'number', reasons: ['string'], suggestions: ['string'], risk: 'string' };
  var alertContext = '学生姓名：' + s.name + '\n学号：' + s.sid + '\n专业：' + s.major + '\n班级：' + s.cls +
    '\n出勤率：' + s.attend + '%\n作业完成率：' + s.hw + '%\n平均成绩：' + s.avg + '分' +
    '\n成绩趋势：' + s.grades.join(',') +
    '\n预警等级：' + levelMap[s.level] + '\n\n请对该学生进行预警分析。';
  callAIStructured(alertContext, '预警分析', alertSchema).then(function(structured) {
    if (structured && document.getElementById('alertBoxArea')) {
      document.getElementById('alertBoxArea').outerHTML = renderStructuredAlert(structured);
    }
  });

  // 使用结构化AI干预评估
  var evalSchema = { effectiveness: 'string', score: 'number', nextSteps: ['string'] };
  var evalContext = '学生姓名：' + s.name + '\n当前预警等级：' + levelMap[s.level] +
    '\n出勤率：' + s.attend + '%\n平均成绩：' + s.avg + '分' +
    '\n已采取措施：一对一面谈、学习伙伴帮扶、定期跟进\n\n请评估当前干预措施的效果。';
  callAIStructured(evalContext, '干预评估', evalSchema).then(function(structured) {
    if (structured && document.getElementById('evalBoxArea')) {
      document.getElementById('evalBoxArea').innerHTML = renderStructuredEvaluation(structured);
    }
  });
}

function switchModalTab(tab, btn) {
  document.querySelectorAll('.modal-tab').forEach(function(t) { t.classList.remove('active'); });
  btn.classList.add('active');
  document.querySelectorAll('.modal-tab-content').forEach(function(c) { c.classList.remove('active'); });
  if (tab === 'academic') {
    document.getElementById('tabAcademic').classList.add('active');
  } else if (tab === 'diagnosis') {
    document.getElementById('tabDiagnosis').classList.add('active');
  } else {
    document.getElementById('tabCareer').classList.add('active');
  }
}

function runMultiAgentDiagnosis(sid) {
  var s = students.find(function(st) { return st.sid === sid; });
  if (!s) return;

  // 重置状态
  ['agentData','agentPsy','agentCareer'].forEach(function(id) {
    var card = document.getElementById(id);
    if (card) {
      var body = card.querySelector('.agent-body');
      if (body) body.innerHTML = '<div class="agent-loading"><i class="fa-solid fa-circle-notch fa-spin"></i> 分析中...</div>';
    }
    var statusId = id === 'agentData' ? 'agentDataStatus' : id === 'agentPsy' ? 'agentPsyStatus' : 'agentCareerStatus';
    var statusEl = document.getElementById(statusId);
    if (statusEl) statusEl.textContent = '分析中...';
  });
  var conclusion = document.getElementById('agentConclusion');
  if (conclusion) conclusion.style.display = 'none';

  var dataContext = '学生姓名：' + s.name + '\n学号：' + s.sid + '\n专业：' + s.major + '\n班级：' + s.cls +
    '\n出勤率：' + s.attend + '%\n作业完成率：' + s.hw + '%\n平均成绩：' + s.avg + '分' +
    '\n成绩趋势：' + s.grades.join(',') + '\n预警等级：' + levelMap[s.level];

  // 数据Agent
  var dataPrompt = '你是一位数据分析师Agent。请分析该学生的学业数据，输出：\n1. 数据概览（关键指标）\n2. 异常发现（与班级平均对比）\n3. 数据趋势（上升/下降/波动）';
  callAI(dataPrompt, dataContext).then(function(dataResult) {
    typeAgentResult('agentDataBody', dataResult, function() {
      var statusEl = document.getElementById('agentDataStatus');
      if (statusEl) statusEl.textContent = '已完成';
    });

    // 心理Agent
    var psyPrompt = '你是一位心理辅导师Agent。请基于该学生的学业表现推断心理状态，输出：\n1. 心理状态评估（积极/中性/消极）\n2. 可能的心理困扰\n3. 建议的心理辅导方向';
    callAI(psyPrompt, dataContext).then(function(psyResult) {
      typeAgentResult('agentPsyBody', psyResult, function() {
        var statusEl = document.getElementById('agentPsyStatus');
        if (statusEl) statusEl.textContent = '已完成';
      });

      // 职业Agent
      var careerPrompt = '你是一位职业规划师Agent。请分析该学生的专业匹配度，输出：\n1. 专业能力评估\n2. 职业方向建议\n3. 技能提升路径';
      callAI(careerPrompt, dataContext).then(function(careerResult) {
        typeAgentResult('agentCareerBody', careerResult, function() {
          var statusEl = document.getElementById('agentCareerStatus');
          if (statusEl) statusEl.textContent = '已完成';
        });

        // 综合Agent
        var summaryPrompt = '请综合以上三位Agent的分析结论，输出统一建议：\n1. 核心问题总结\n2. 优先干预措施\n3. 长期发展建议\n\n数据Agent结论：' + dataResult + '\n\n心理Agent结论：' + psyResult + '\n\n职业Agent结论：' + careerResult;
        var conclusionEl = document.getElementById('agentConclusion');
        if (conclusionEl) conclusionEl.style.display = 'block';
        var conclusionBody = document.getElementById('agentConclusionBody');
        if (conclusionBody) conclusionBody.innerHTML = '<div class="agent-loading"><i class="fa-solid fa-circle-notch fa-spin"></i> 综合Agent正在汇总分析...</div>';
        callAI(summaryPrompt, dataContext).then(function(summaryResult) {
          typeAgentResult('agentConclusionBody', summaryResult, null, true);
        });
      });
    });
  });
}

function typeAgentResult(elementId, text, onDone, isDirect) {
  var el = document.getElementById(elementId);
  if (!el) return;
  if (isDirect) {
    el.innerHTML = text.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    if (onDone) onDone();
    return;
  }
  var plainText = text;
  el.textContent = '';
  var i = 0;
  var timer = setInterval(function() {
    if (i < plainText.length) {
      el.textContent = plainText.substring(0, i + 1);
      i++;
    } else {
      clearInterval(timer);
      el.innerHTML = plainText.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      if (onDone) onDone();
    }
  }, 15);
}

function closeModal() {
  document.getElementById('detailModal').classList.remove('show');
}

function showRiskDetail(sid) {
  var s = students.find(function(st) { return st.sid === sid; });
  if (!s) return;
  var riskScore = calculateRiskScore(s);
  var riskInfo = getRiskLevelInfo(riskScore);
  var predAttend = predictRisk(s.attendanceHistory || s.attTrend || [s.attend]);
  var predScore = predictRisk(s.scoreHistory || s.grades || [s.avg]);
  var attHistory = s.attendanceHistory || s.attTrend || [];
  var scrHistory = s.scoreHistory || s.grades || [];

  // 计算各项因子得分
  var attDeclineWeeks = 0, scoreDeclineWeeks = 0;
  for (var i = 1; i < attHistory.length; i++) {
    if (attHistory[i] < attHistory[i - 1]) attDeclineWeeks++;
    else attDeclineWeeks = 0;
  }
  for (var j = 1; j < scrHistory.length; j++) {
    if (scrHistory[j] < scrHistory[j - 1]) scoreDeclineWeeks++;
    else scoreDeclineWeeks = 0;
  }
  var attTrendScore = Math.min(30, attDeclineWeeks * 15);
  var scoreTrendScore = Math.min(30, scoreDeclineWeeks * 15);
  var attCurrentScore = s.attend < 70 ? 20 : s.attend < 80 ? 10 : 0;
  var scoreCurrentScore = s.avg < 50 ? 20 : s.avg < 60 ? 10 : 0;

  var suggestion = '根据预测，该生下周出勤率可能降至' + predAttend + '%，建议' +
    (riskScore >= 80 ? '立即安排约谈，制定紧急干预方案。' :
     riskScore >= 60 ? '本周内安排谈话，了解原因并提供帮助。' :
     riskScore >= 40 ? '持续关注学习动态，适时提供指导。' :
     '继续保持良好的学习状态。');

  document.getElementById('riskDetailBody').innerHTML =
    '<div style="margin-bottom:20px">' +
      '<div class="detail-grid">' +
        '<div class="detail-item"><div class="dl">姓名</div><div class="dv">' + s.name + '</div></div>' +
        '<div class="detail-item"><div class="dl">学号</div><div class="dv">' + s.sid + '</div></div>' +
        '<div class="detail-item"><div class="dl">专业</div><div class="dv">' + s.major + '</div></div>' +
        '<div class="detail-item"><div class="dl">班级</div><div class="dv">' + s.cls + '</div></div>' +
      '</div>' +
    '</div>' +
    '<div style="margin-bottom:24px">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">' +
        '<span style="font-size:15px;font-weight:600">风险评分</span>' +
        '<span style="font-size:24px;font-weight:900;color:' + riskInfo.color + '">' + riskScore + '</span>' +
      '</div>' +
      '<div class="risk-prediction-bar" style="width:100%;height:12px;border-radius:6px;background:linear-gradient(90deg,#10b981,#3b82f6,#f97316,#ef4444)">' +
        '<div style="width:12px;height:12px;border-radius:50%;background:white;border:2px solid ' + riskInfo.color + ';margin-left:calc(' + riskScore + '% - 6px);box-shadow:0 0 8px ' + riskInfo.color + '"></div>' +
      '</div>' +
      '<div style="display:flex;justify-content:space-between;margin-top:6px;font-size:12px;color:var(--text-muted)">' +
        '<span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>' +
      '</div>' +
      '<div style="text-align:center;margin-top:12px">' +
        '<span class="badge ' + riskInfo.class + '" style="font-size:14px;padding:6px 16px">' + riskInfo.level + '</span>' +
      '</div>' +
    '</div>' +
    '<div style="margin-bottom:24px">' +
      '<h4 style="font-size:15px;font-weight:600;margin-bottom:12px"><i class="fa-solid fa-chart-line" style="color:var(--blue)"></i> 预测下周数据</h4>' +
      '<div class="detail-grid">' +
        '<div class="detail-item"><div class="dl">预测出勤率</div><div class="dv" style="color:' + (predAttend < 70 ? 'var(--red)' : predAttend < 80 ? 'var(--orange)' : 'var(--green)') + '">' + predAttend + '% <small style="color:var(--text-muted)">(±' + Math.round(Math.abs(predAttend - s.attend) * 0.5) + '%)</small></div></div>' +
        '<div class="detail-item"><div class="dl">预测成绩</div><div class="dv" style="color:' + (predScore < 50 ? 'var(--red)' : predScore < 60 ? 'var(--orange)' : 'var(--green)') + '">' + predScore + ' <small style="color:var(--text-muted)">(±' + Math.round(Math.abs(predScore - s.avg) * 0.5) + ')</small></div></div>' +
      '</div>' +
    '</div>' +
    '<div style="margin-bottom:24px">' +
      '<h4 style="font-size:15px;font-weight:600;margin-bottom:12px"><i class="fa-solid fa-list-check" style="color:var(--accent)"></i> 风险因子明细</h4>' +
      '<div class="risk-factor-list">' +
        '<div class="risk-factor-item"><span class="risk-factor-name">出勤率趋势</span><div class="risk-factor-bar-wrap"><div class="risk-factor-bar-bg"><div class="risk-factor-bar-fill" style="width:' + Math.min(100, attTrendScore / 30 * 100) + '%;background:var(--orange)"></div></div></div><span class="risk-factor-score">' + attTrendScore + '/30</span></div>' +
        '<div class="risk-factor-item"><span class="risk-factor-name">成绩趋势</span><div class="risk-factor-bar-wrap"><div class="risk-factor-bar-bg"><div class="risk-factor-bar-fill" style="width:' + Math.min(100, scoreTrendScore / 30 * 100) + '%;background:var(--orange)"></div></div></div><span class="risk-factor-score">' + scoreTrendScore + '/30</span></div>' +
        '<div class="risk-factor-item"><span class="risk-factor-name">当前出勤率</span><div class="risk-factor-bar-wrap"><div class="risk-factor-bar-bg"><div class="risk-factor-bar-fill" style="width:' + Math.min(100, attCurrentScore / 20 * 100) + '%;background:var(--blue)"></div></div></div><span class="risk-factor-score">' + attCurrentScore + '/20</span></div>' +
        '<div class="risk-factor-item"><span class="risk-factor-name">当前成绩</span><div class="risk-factor-bar-wrap"><div class="risk-factor-bar-bg"><div class="risk-factor-bar-fill" style="width:' + Math.min(100, scoreCurrentScore / 20 * 100) + '%;background:var(--blue)"></div></div></div><span class="risk-factor-score">' + scoreCurrentScore + '/20</span></div>' +
      '</div>' +
    '</div>' +
    '<div style="padding:16px;background:rgba(59,130,246,.08);border-radius:12px;border-left:4px solid var(--blue)">' +
      '<h4 style="font-size:14px;font-weight:600;margin-bottom:8px;color:var(--blue)"><i class="fa-solid fa-robot"></i> AI建议</h4>' +
      '<p style="font-size:13px;line-height:1.8;color:var(--text-muted);margin:0">' + suggestion + '</p>' +
    '</div>' +
    '<div style="display:flex;gap:10px;margin-top:16px">' +
      '<button class="btn btn-primary" onclick="closeRiskDetail();openDetail(' + students.indexOf(s) + ')"><i class="fa-solid fa-eye"></i> 查看学生详情</button>' +
      '<button class="btn btn-ai" style="margin-top:0;padding:6px 14px;font-size:13px" onclick="closeRiskDetail();earlyIntervention(\'' + s.sid + '\')"><i class="fa-solid fa-hand-holding-heart"></i> 提前干预</button>' +
    '</div>';
  document.getElementById('riskDetailModal').style.display = 'flex';
}

function closeRiskDetail() {
  document.getElementById('riskDetailModal').style.display = 'none';
}

function toggleTalk() {
  var t = document.getElementById('talkOutline');
  t.style.display = t.style.display === 'block' ? 'none' : 'block';
}

// ---------- AI学业趋势预测 ----------
function predictTrend() {
  var idx = currentModalIdx;
  if (idx < 0 || idx >= students.length) return;
  var s = students[idx];

  // 获取历史数据
  var attendanceHistory = s.attendanceHistory || s.attTrend || [s.attend];
  var scoreHistory = s.scoreHistory || s.grades || [s.avg];

  // 显示加载中
  var panel = document.getElementById('trendPrediction');
  if (!panel) {
    // 动态创建预测面板
    var tabAcademic = document.getElementById('tabAcademic');
    if (!tabAcademic) return;
    panel = document.createElement('div');
    panel.id = 'trendPrediction';
    panel.className = 'trend-prediction';
    tabAcademic.appendChild(panel);
  }
  panel.innerHTML = '<div class="trend-prediction-loading"><i class="fa-solid fa-circle-notch fa-spin"></i> AI正在分析趋势，请稍候...</div>';
  panel.style.display = 'block';

  // 构造prompt
  var attendStr = attendanceHistory.length > 0 ? attendanceHistory.join('%、') + '%' : s.attend + '%';
  var scoreStr = scoreHistory.length > 0 ? scoreHistory.join('、') : String(s.avg);
  var prompt = '请根据以下数据预测该学生未来2周的学业趋势：\n' +
    '学生姓名：' + s.name + '\n' +
    '专业：' + s.major + '\n' +
    '班级：' + s.cls + '\n' +
    '预警等级：' + (levelMap[s.level] || '正常') + '\n' +
    '近' + attendanceHistory.length + '周出勤率：' + attendStr + '\n' +
    '近' + scoreHistory.length + '周成绩：' + scoreStr + '\n' +
    '当前平均分：' + s.avg + '\n' +
    '作业完成率：' + s.hw + '%\n\n' +
    '请分析趋势方向（上升/下降/平稳），给出预测说明和具体建议措施。请用以下格式回复：\n' +
    '【趋势方向】上升/下降/平稳\n' +
    '【预测说明】详细的分析说明\n' +
    '【建议措施】具体的建议';

  callAI(prompt, null).then(function(result) {
    // 解析趋势方向
    var direction = 'stable';
    var icon = 'fa-minus';
    var dirText = '平稳';
    var dirColor = 'var(--accent)';
    if (result.indexOf('上升') > -1) {
      direction = 'up'; icon = 'fa-arrow-trend-up'; dirText = '上升趋势'; dirColor = 'var(--green)';
    } else if (result.indexOf('下降') > -1) {
      direction = 'down'; icon = 'fa-arrow-trend-down'; dirText = '下降趋势'; dirColor = 'var(--red)';
    }

    var sections = result.split('【');
    var prediction = '', suggestions = '';
    for (var i = 0; i < sections.length; i++) {
      if (sections[i].indexOf('预测说明】') === 0) prediction = sections[i].substring(5).trim();
      if (sections[i].indexOf('建议措施】') === 0) suggestions = sections[i].substring(5).trim();
    }

    panel.innerHTML =
      '<div class="trend-prediction-header">' +
        '<div class="trend-direction trend-' + direction + '">' +
          '<i class="fa-solid ' + icon + '"></i>' +
          '<span>' + dirText + '</span>' +
        '</div>' +
        '<h4><i class="fa-solid fa-brain"></i> AI趋势预测 - ' + s.name + '</h4>' +
      '</div>' +
      '<div class="trend-prediction-body">' +
        '<div class="trend-section">' +
          '<h5><i class="fa-solid fa-chart-line"></i> 预测说明</h5>' +
          '<p>' + (prediction || result.replace(/\n/g, '<br>')) + '</p>' +
        '</div>' +
        '<div class="trend-section">' +
          '<h5><i class="fa-solid fa-lightbulb"></i> 建议措施</h5>' +
          '<p>' + (suggestions || '请结合实际情况制定针对性干预方案。') + '</p>' +
        '</div>' +
      '</div>';
  });
}

// ---------- 谈心助手 ----------
var chatReplies = {
  absent: '收到，关于缺勤学生的谈话，AI为您准备了以下建议：\n\n**谈话重点：**\n1. 先表达关心，避免批评指责，让学生感受到导师的真诚关怀\n2. 了解缺勤的具体原因：是否因身体不适、家庭变故、学习跟不上、人际矛盾等\n3. 查看学生最近的学习记录和出勤数据，准备好具体数据作为谈话依据\n4. 探讨可能的解决方案：调整学习节奏、安排补课、联系家长等\n5. 设定明确的改进目标，如"下周出勤率提升至85%"\n6. 约定下次回访时间，建立持续关注机制\n\n**话术示例：** "最近注意到你有一些课没来上，我想了解一下是不是遇到什么困难了？不用担心，我们可以一起想办法解决。"',
  grade: '收到，关于成绩下滑的学生，AI为您准备了以下提醒方案：\n\n**谈话要点：**\n1. 用数据说话，展示学生成绩变化趋势，让学生直观看到下滑情况\n2. 分析下滑原因：是否因学习态度变化、课程难度增大、时间管理不当等\n3. 帮助学生梳理学习计划，找出薄弱环节\n4. 建议参加课后辅导、加入学习小组、利用图书馆资源\n5. 设定阶段性目标，如"下次测验提升10分"\n6. 强调进步空间，给予积极鼓励\n\n**话术示例：** "这几次考试成绩我看到有些下滑，不过别灰心，我们一起分析一下原因，找到提升的方法。"',
  career: '收到，关于职业规划指导，AI为您准备了以下谈话框架：\n\n**指导重点：**\n1. 了解学生的职业兴趣和意向方向\n2. 分析当前专业对应的行业现状和发展前景\n3. 讨论学生的优势特长与目标岗位的匹配度\n4. 建议考取相关职业资格证书（如护士资格证、药师资格证等）\n5. 推荐参加实习实践、技能竞赛、行业讲座等活动\n6. 帮助制定短期（本学期）和中期（毕业前）的发展计划\n\n**话术示例：** "你对未来的职业方向有什么想法吗？我们可以一起分析一下你的优势和兴趣，看看有哪些发展方向适合你。"'
};

// ---------- 语音输入 ----------
var voiceRecognition = null;
var isRecording = false;
var chatDraftTimer = null;
var chatDraftKey = 'daolu_chat_draft';

function initVoiceInput() {
  var micBtn = document.getElementById('voiceBtn');
  if (!micBtn) return;
  var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    micBtn.style.display = 'none';
    return;
  }
  voiceRecognition = new SpeechRecognition();
  voiceRecognition.lang = 'zh-CN';
  voiceRecognition.continuous = false;
  voiceRecognition.interimResults = true;
  voiceRecognition.onstart = function() {
    isRecording = true;
    micBtn.classList.add('recording');
    micBtn.innerHTML = '<i class="fa-solid fa-stop"></i>';
    showToast('info', '正在录音，请说话...', 2000);
  };
  voiceRecognition.onend = function() {
    isRecording = false;
    micBtn.classList.remove('recording');
    micBtn.innerHTML = '<i class="fa-solid fa-microphone"></i>';
  };
  voiceRecognition.onresult = function(event) {
    var input = document.getElementById('chatInput');
    if (!input) return;
    var finalTranscript = '';
    var interimTranscript = '';
    for (var i = event.resultIndex; i < event.results.length; i++) {
      var transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }
    if (finalTranscript) {
      input.value = (input.value || '') + finalTranscript;
    } else if (interimTranscript) {
      input.value = (input.value || '').replace(/\u200B.*$/, '') + '\u200B' + interimTranscript;
    }
    if (finalTranscript) {
      setTimeout(function() {
        input.value = input.value.replace(/\u200B/g, '');
        sendChat();
      }, 400);
    }
  };
  voiceRecognition.onerror = function(event) {
    isRecording = false;
    micBtn.classList.remove('recording');
    micBtn.innerHTML = '<i class="fa-solid fa-microphone"></i>';
    if (event.error !== 'aborted') {
      showToast('error', '语音识别出错：' + event.error);
    }
  };
}

function toggleVoiceRecord() {
  if (!voiceRecognition) {
    showToast('error', '您的浏览器不支持语音识别');
    return;
  }
  if (isRecording) {
    voiceRecognition.stop();
  } else {
    var input = document.getElementById('chatInput');
    if (input) input.value = '';
    voiceRecognition.start();
  }
}

function speakText(text) {
  if (!window.speechSynthesis) {
    showToast('error', '您的浏览器不支持语音朗读');
    return;
  }
  window.speechSynthesis.cancel();
  var utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-CN';
  utterance.rate = 1;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

// ---------- 自动保存草稿 ----------
function initAutoSave() {
  loadChatDraft();
  if (chatDraftTimer) clearInterval(chatDraftTimer);
  chatDraftTimer = setInterval(function() {
    saveChatDraft();
  }, 3000);
}

function saveChatDraft() {
  try {
    var input = document.getElementById('chatInput');
    if (input && input.value.trim()) {
      localStorage.setItem(chatDraftKey, input.value.trim());
      showAutoSaveTip();
    }
  } catch (e) {}
}

function loadChatDraft() {
  try {
    var input = document.getElementById('chatInput');
    var draft = localStorage.getItem(chatDraftKey);
    if (input && draft) {
      input.value = draft;
    }
  } catch (e) {}
}

function clearChatDraft() {
  try {
    localStorage.removeItem(chatDraftKey);
  } catch (e) {}
}

function showAutoSaveTip() {
  var tip = document.getElementById('autoSaveTip');
  if (!tip) {
    tip = document.createElement('div');
    tip.id = 'autoSaveTip';
    tip.className = 'auto-save-tip';
    tip.textContent = '已自动保存';
    document.body.appendChild(tip);
  }
  tip.classList.add('show');
  setTimeout(function() { tip.classList.remove('show'); }, 2000);
}

function quickChat(type) {
  var labels = { absent: '缺勤学生谈话', grade: '成绩下滑提醒', career: '职业规划指导' };
  addUserMsg('请帮我准备关于【' + labels[type] + '】的谈话方案');
  setTimeout(function() {
    showTyping();
    setTimeout(function() { removeTyping(); addAiMsg(chatReplies[type]); }, 1500);
  }, 300);
}

function sendChat() {
  var input = document.getElementById('chatInput');
  var text = input.value.trim();
  if (!text) return;
  input.value = '';
  clearChatDraft();
  addUserMsg(text);

  // 将用户消息添加到对话历史
  chatHistory.push({ role: 'user', content: text });
  if (chatHistory.length > 20) chatHistory = chatHistory.slice(-20);

  // 创建空的消息气泡（带光标闪烁动画）
  var box = document.getElementById('chatMessages');
  var streamMsgId = 'stream-msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
  box.innerHTML += '<div class="chat-msg ai" id="' + streamMsgId + '"><div class="avatar ai"><i class="fa-solid fa-robot"></i></div><div class="chat-bubble msg-stream"><span class="typing-cursor"></span></div></div>';
  box.scrollTop = box.scrollHeight;

  var bubbleEl = document.getElementById(streamMsgId).querySelector('.chat-bubble');
  var cursorEl = bubbleEl.querySelector('.typing-cursor');
  var accumulated = '';

  callAIStream(text, {
    onChunk: function(chunk) {
      accumulated += chunk;
      bubbleEl.innerHTML = accumulated.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') + '<span class="typing-cursor"></span>';
      box.scrollTop = box.scrollHeight;
    },
    onDone: function(fullText) {
      // 移除光标动画，添加朗读按钮
      var speakTextPlain = fullText.replace(/\*\*/g, '');
      var emotion = analyzeEmotion(fullText);
      emotionHistory.push(emotion);
      var emotionClass = emotion.label === '积极' ? 'positive' : emotion.label === '消极' ? 'negative' : 'neutral';
      bubbleEl.innerHTML = fullText.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') +
        '<button class="chat-speak-btn" onclick="speakText(this.dataset.text)" data-text="' + speakTextPlain.replace(/"/g, '&quot;') + '" title="朗读回复"><i class="fa-solid fa-volume-high"></i></button>' +
        '<span class="emotion-tag ' + emotionClass + '">' + emotion.label + '</span>';
      box.scrollTop = box.scrollHeight;
      saveChatHistory();

      // 将AI回复添加到对话历史
      chatHistory.push({ role: 'assistant', content: fullText });
      if (chatHistory.length > 20) chatHistory = chatHistory.slice(-20);

      // 检查情绪预警并显示情绪面板
      checkEmotionAlert();
      showEmotionChartPanel();
    },
    onError: function(msg) {
      bubbleEl.innerHTML = '<span style="color:var(--red)">AI回复出错：' + msg + '</span>';
      box.scrollTop = box.scrollHeight;
    }
  }, null, chatHistory.slice(0, -1)); // 排除刚添加的当前用户消息（已由callAIStream添加）
}

// 新建对话（清空历史）
function newChat() {
  chatHistory = [];
  var box = document.getElementById('chatMessages');
  box.innerHTML = '<div class="chat-msg ai"><div class="avatar ai"><i class="fa-solid fa-robot"></i></div><div class="chat-bubble">' +
    '您好！我是AI谈心助手。我可以帮您：<br>' +
    '1. 分析学生学业数据，生成预警分析<br>' +
    '2. 准备个性化的谈心谈话提纲<br>' +
    '3. 提供职业发展建议<br>' +
    '4. 回答学生管理相关问题<br><br>' +
    '请点击下方快捷按钮，或直接输入您的问题。</div></div>';
  try { localStorage.setItem('daolu_chat', box.innerHTML); } catch(e) {}
  showToast('success', '已开启新对话');
}

// ---------- AI智能摘要相关 ----------
var chatSummaryDismissed = false;

function countChatMessages() {
  var box = document.getElementById('chatMessages');
  if (!box) return 0;
  return box.querySelectorAll('.chat-msg').length;
}

function generateChatSummary() {
  if (chatSummaryDismissed) return;
  var box = document.getElementById('chatMessages');
  if (!box) return;
  var msgs = box.querySelectorAll('.chat-msg');
  var total = msgs.length;
  if (total < 10) return; // 不足10条（5轮）不生成
  // 检查是否每10条触发一次（5轮）
  if (total % 10 !== 0 && total !== 10) return;

  // 获取最近5轮对话内容
  var recentMsgs = Array.prototype.slice.call(msgs, -10);
  var history = recentMsgs.map(function(m) {
    var isUser = m.classList.contains('user');
    var bubble = m.querySelector('.chat-bubble');
    var text = bubble ? bubble.textContent : '';
    return (isUser ? '老师' : 'AI') + '：' + text;
  }).join('\n');

  var summaryContainer = document.getElementById('chatSummary');
  if (!summaryContainer) return;

  // 显示加载状态
  summaryContainer.innerHTML = '<div class="chat-summary loading"><span class="summary-badge"><i class="fa-solid fa-wand-magic-sparkles"></i> AI摘要</span><span class="summary-content">正在生成摘要...</span></div>';

  var prompt = '请用2-3句话总结以下师生谈话的核心要点，列出关键结论和待办事项：\n' + history;
  callAI(prompt, '').then(function(summary) {
    if (chatSummaryDismissed) return;
    summaryContainer.innerHTML =
      '<div class="chat-summary">' +
        '<div class="summary-header">' +
          '<span class="summary-badge"><i class="fa-solid fa-wand-magic-sparkles"></i> AI摘要</span>' +
          '<div class="summary-actions">' +
            '<button class="summary-toggle" onclick="toggleSummary()" title="折叠/展开"><i class="fa-solid fa-chevron-up"></i></button>' +
            '<button class="summary-close" onclick="dismissSummary()" title="关闭"><i class="fa-solid fa-xmark"></i></button>' +
          '</div>' +
        '</div>' +
        '<div class="summary-content" id="summaryContent">' + summary.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') + '</div>' +
      '</div>';
  });
}

function toggleSummary() {
  var content = document.getElementById('summaryContent');
  var icon = document.querySelector('.summary-toggle i');
  if (!content) return;
  if (content.style.display === 'none') {
    content.style.display = 'block';
    if (icon) icon.className = 'fa-solid fa-chevron-up';
  } else {
    content.style.display = 'none';
    if (icon) icon.className = 'fa-solid fa-chevron-down';
  }
}

function dismissSummary() {
  chatSummaryDismissed = true;
  var el = document.getElementById('chatSummary');
  if (el) el.innerHTML = '';
}

function addUserMsg(text) {
  var box = document.getElementById('chatMessages');
  var roleLabel = getCurrentChatRoleLabel();
  var roleMarker = roleLabel ? '<span class="chat-role-marker ' + currentChatRole + '">' + roleLabel + '</span>' : '';
  box.innerHTML += '<div class="chat-msg user"><div class="avatar teacher"><i class="fa-solid fa-user"></i></div><div class="chat-bubble">' + text.replace(/\n/g, '<br>') + roleMarker + '</div></div>';
  box.scrollTop = box.scrollHeight;
  saveChatHistory();
  // 检查是否需要生成AI摘要（每5轮对话=10条消息）
  generateChatSummary();
}

function getCurrentChatRoleLabel() {
  var labels = { default: '学业分析', counseling: '心理辅导', career: '职业规划', general: '综合助手' };
  if (currentChatRole && currentChatRole !== 'default') return labels[currentChatRole] || '';
  return '';
}

// ---------- AI对话角色切换 ----------
var currentChatRole = 'default';

var aiRoles = {
  'default': {
    name: '学业分析',
    icon: 'fa-chart-line',
    systemPrompt: '你是一个专业的学业导师AI助手，专注于客观数据分析。你关注学生的出勤率、作业完成率、考试成绩等量化指标，擅长分析学业预警数据、生成谈心提纲、评估学业趋势。请以数据为依据，给出专业、客观、有针对性的分析和建议。回复时语言简洁专业，适当使用列表格式。'
  },
  'counseling': {
    name: '心理辅导',
    icon: 'fa-heart',
    systemPrompt: '你是一位温暖、有共情力的心理辅导AI助手。你关注学生的心理状态和情感需求，擅长倾听和共情。当老师描述学生的情况时，你会从心理学角度分析可能的问题，提供心理支持和辅导建议。回复时请体现人文关怀，语气温和亲切，注意保护学生隐私，引导老师用积极的方式与学生沟通。'
  },
  'career': {
    name: '职业规划',
    icon: 'fa-briefcase',
    systemPrompt: '你是一位资深的职业规划AI顾问，专注于职业教育领域。你了解各专业的就业前景、行业发展动态、职业资格证书要求。你擅长分析学生的专业能力与职业方向的匹配度，提供个性化的发展路径建议。回复时请结合当前行业趋势和就业数据，给出实用、可操作的职业发展建议。'
  },
  'general': {
    name: '综合助手',
    icon: 'fa-robot',
    systemPrompt: '你是"导路"AI助手，一个综合性的学生成长管理AI助手。你兼具学业分析、心理辅导、职业规划等能力，能够根据用户的需求灵活切换视角。你可以帮助教师完成学生管理、预警干预、谈心准备、报告生成等各类工作。请根据对话内容智能判断用户的需求，提供全面、专业、有价值的建议。'
  }
};

function switchChatRole(role) {
  currentChatRole = role;
  // 更新tab样式
  document.querySelectorAll('.chat-role-tab').forEach(function(tab) {
    tab.classList.toggle('active', tab.getAttribute('data-role') === role);
  });
  var roleInfo = aiRoles[role];
  if (roleInfo) {
    showToast('success', '已切换到' + roleInfo.name + '模式');
  }
}

function addAiMsg(text) {
  var box = document.getElementById('chatMessages');
  var msgId = 'ai-msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
  var bubbleContent = text.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  var speakTextPlain = text.replace(/\*\*/g, '');
  var emotion = analyzeEmotion(text);
  emotionHistory.push(emotion);
  var emotionClass = emotion.label === '积极' ? 'positive' : emotion.label === '消极' ? 'negative' : 'neutral';
  box.innerHTML += '<div class="chat-msg ai" id="' + msgId + '"><div class="avatar ai"><i class="fa-solid fa-robot"></i></div><div class="chat-bubble">' + bubbleContent + '<button class="chat-speak-btn" onclick="speakText(this.dataset.text)" data-text="' + speakTextPlain.replace(/"/g, '&quot;') + '" title="朗读回复"><i class="fa-solid fa-volume-high"></i></button><span class="emotion-tag ' + emotionClass + '">' + emotion.label + '</span></div></div>';
  box.scrollTop = box.scrollHeight;
  saveChatHistory();
  checkEmotionAlert();
  showEmotionChartPanel();
}

function analyzeEmotion(text) {
  var positiveWords = ['开心','满意','进步','努力','信心','希望','感谢'];
  var negativeWords = ['焦虑','担心','害怕','困难','迷茫','压力','失望'];
  var neutralWords = ['了解','知道','明白','考虑'];
  var score = 0;
  var keywords = [];
  positiveWords.forEach(function(w) {
    if (text.indexOf(w) > -1) { score++; keywords.push(w); }
  });
  negativeWords.forEach(function(w) {
    if (text.indexOf(w) > -1) { score--; keywords.push(w); }
  });
  neutralWords.forEach(function(w) {
    if (text.indexOf(w) > -1) { keywords.push(w); }
  });
  score = Math.max(-5, Math.min(5, score));
  var label = score >= 2 ? '积极' : score <= -2 ? '消极' : '中性';
  return { score: score, label: label, keywords: keywords };
}

function showEmotionChartPanel() {
  var panel = document.getElementById('emotionChartPanel');
  if (panel && emotionHistory.length > 0) panel.style.display = 'block';
}

function toggleEmotionChart() {
  var content = document.getElementById('emotionChartContent');
  var icon = document.getElementById('emotionChartIcon');
  if (content.style.display === 'none') {
    content.style.display = 'block';
    if (icon) icon.className = 'fa-solid fa-chevron-up';
    renderEmotionChart();
  } else {
    content.style.display = 'none';
    if (icon) icon.className = 'fa-solid fa-chevron-down';
  }
}

function renderEmotionChart() {
  var canvas = document.getElementById('emotionCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var w = canvas.width = canvas.offsetWidth;
  var h = canvas.height = canvas.offsetHeight || 200;
  ctx.clearRect(0, 0, w, h);

  if (emotionHistory.length === 0) {
    ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-muted').trim();
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('暂无情绪数据', w/2, h/2);
    return;
  }

  var padding = 40;
  var chartW = w - padding * 2;
  var chartH = h - padding * 2;

  // 绘制坐标轴
  ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--border').trim();
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, h - padding);
  ctx.lineTo(w - padding, h - padding);
  ctx.stroke();

  // 绘制中线（y=0）
  var zeroY = h - padding - chartH * 0.5;
  ctx.strokeStyle = 'rgba(148,163,184,0.3)';
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(padding, zeroY);
  ctx.lineTo(w - padding, zeroY);
  ctx.stroke();
  ctx.setLineDash([]);

  // 计算数据点
  var stepX = emotionHistory.length > 1 ? chartW / (emotionHistory.length - 1) : chartW;
  var points = emotionHistory.map(function(e, i) {
    var x = padding + i * stepX;
    var y = h - padding - ((e.score + 5) / 10) * chartH;
    return { x: x, y: y, score: e.score, label: e.label };
  });

  // 绘制折线
  ctx.strokeStyle = '#8b5cf6';
  ctx.lineWidth = 2;
  ctx.beginPath();
  points.forEach(function(p, i) {
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.stroke();

  // 绘制点
  points.forEach(function(p) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = p.label === '积极' ? '#10b981' : p.label === '消极' ? '#ef4444' : '#94a3b8';
    ctx.fill();
    ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--card').trim() || '#182340';
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  // 计算平均线
  var avg = emotionHistory.reduce(function(a, b) { return a + b.score; }, 0) / emotionHistory.length;
  var avgY = h - padding - ((avg + 5) / 10) * chartH;
  ctx.strokeStyle = 'rgba(245,158,11,0.6)';
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 2]);
  ctx.beginPath();
  ctx.moveTo(padding, avgY);
  ctx.lineTo(w - padding, avgY);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--accent').trim() || '#f59e0b';
  ctx.font = '11px sans-serif';
  ctx.fillText('平均: ' + avg.toFixed(1), w - padding - 50, avgY - 4);

  // 最高/最低标记
  var maxE = emotionHistory.reduce(function(a, b) { return a.score > b.score ? a : b; });
  var minE = emotionHistory.reduce(function(a, b) { return a.score < b.score ? a : b; });
  ctx.font = '11px sans-serif';
  ctx.fillStyle = '#10b981';
  ctx.fillText('最高: ' + maxE.score, padding, padding - 8);
  ctx.fillStyle = '#ef4444';
  ctx.fillText('最低: ' + minE.score, padding + 60, padding - 8);
}

function checkEmotionAlert() {
  if (emotionHistory.length < 3) return;
  var recent = emotionHistory.slice(-3);
  var allNegative = recent.every(function(e) { return e.label === '消极'; });
  var alertEl = document.getElementById('emotionAlert');
  if (allNegative) {
    if (!alertEl) {
      alertEl = document.createElement('div');
      alertEl.id = 'emotionAlert';
      alertEl.className = 'emotion-alert';
      var chatContainer = document.querySelector('.chat-container');
      var inputArea = document.querySelector('.chat-input-area');
      if (chatContainer && inputArea) chatContainer.insertBefore(alertEl, inputArea);
    }
    alertEl.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> 注意：该生连续3次对话情绪消极，建议关注心理状态';
    alertEl.style.display = 'flex';
  } else if (alertEl) {
    alertEl.style.display = 'none';
  }
}

function showTyping() {
  var box = document.getElementById('chatMessages');
  box.innerHTML += '<div class="chat-msg ai" id="typingMsg"><div class="avatar ai"><i class="fa-solid fa-robot"></i></div><div class="chat-bubble"><div class="typing-dots"><span></span><span></span><span></span></div></div></div>';
  box.scrollTop = box.scrollHeight;
}

function removeTyping() {
  var t = document.getElementById('typingMsg');
  if (t) t.remove();
}

function saveChatHistory() {
  try {
    var box = document.getElementById('chatMessages');
    if (box) localStorage.setItem('daolu_chat', box.innerHTML);
  } catch(e) {}
}

function loadChatHistory() {
  try {
    var html = localStorage.getItem('daolu_chat');
    var box = document.getElementById('chatMessages');
    if (html && box) box.innerHTML = html;
  } catch(e) {}
}

// ---------- 成长档案 ----------
function selectProfile(idx) {
  document.querySelectorAll('.profile-select .filter-tag').forEach(function(t, i) { t.classList.toggle('active', i === idx); });
  var p = profiles[idx];
  if (!p) return;
  document.getElementById('pAvatar').textContent = p.initial;
  document.getElementById('pName').textContent = p.name;
  document.getElementById('pMeta').textContent = p.meta;
  drawRadar(p.radar);
  drawProfileBars(p.grades, p.labels);
  drawTimeline(p.timeline);
  generateAiEval(p);
  updateCareerInfo(p);
}

function generateAiEval(p) {
  var dims = ['学业成绩', '出勤表现', '作业完成', '课堂参与', '职业素养'];
  var vals = p.radar;
  var avg = Math.round(vals.reduce(function(a, b) { return a + b; }, 0) / vals.length);
  var maxIdx = vals.indexOf(Math.max.apply(null, vals));
  var minIdx = vals.indexOf(Math.min.apply(null, vals));
  var maxDim = dims[maxIdx];
  var minDim = dims[minIdx];

  var levelText = '';
  if (avg >= 85) levelText = '整体表现优秀';
  else if (avg >= 75) levelText = '整体表现良好';
  else if (avg >= 60) levelText = '整体表现一般';
  else levelText = '整体表现需要关注';

  var evalText = '<strong>' + p.name + '</strong>同学' + levelText + '，' + maxDim + '（' + vals[maxIdx] + '分）和' + dims[(maxIdx + 1) % 5] + '表现突出，展现出较强的学习能力和自我管理能力。建议重点提升<strong>' + minDim + '</strong>（' + vals[minIdx] + '分），可以通过增加课堂参与、加强实践训练等方式进行改善。综合来看，该同学具有较好的发展潜力，导师应持续关注并提供针对性指导。';

  document.getElementById('aiEvalText').innerHTML = evalText;
}

function updateCareerInfo(p) {
  var c = p.career || {};
  document.getElementById('careerDirection').textContent = c.direction || '加载中...';
  document.getElementById('careerCerts').textContent = c.certs || '加载中...';
  document.getElementById('careerMatch').textContent = c.match || '加载中...';
  document.getElementById('careerPath').textContent = c.path || '加载中...';
}

// ---------- 工作台 ----------
function toggleTodo(el) {
  var cb = el.querySelector('.todo-checkbox');
  var icon = cb.querySelector('i');
  el.classList.toggle('done');
  if (el.classList.contains('done')) {
    cb.classList.add('checked');
    if (icon) icon.style.display = 'block';
  } else {
    cb.classList.remove('checked');
    if (icon) icon.style.display = 'none';
  }
  saveTodoState();
}

function saveTodoState() {
  try {
    var items = document.querySelectorAll('#todoList .todo-item');
    var state = Array.from(items).map(function(el) { return el.classList.contains('done'); });
    localStorage.setItem('daolu_todos', JSON.stringify(state));
  } catch(e) {}
}

function loadTodoState() {
  try {
    var state = JSON.parse(localStorage.getItem('daolu_todos') || '[]');
    var items = document.querySelectorAll('#todoList .todo-item');
    items.forEach(function(el, i) {
      if (state[i]) {
        el.classList.add('done');
        var cb = el.querySelector('.todo-checkbox');
        var icon = cb.querySelector('i');
        cb.classList.add('checked');
        if (icon) icon.style.display = 'block';
      }
    });
  } catch(e) {}
}

function generateReport() {
  var btn = event.target.closest('.qc-btn');
  btn.textContent = '生成中...';
  btn.style.opacity = '.7';
  setTimeout(function() {
    btn.textContent = '已生成';
    btn.style.background = 'linear-gradient(135deg,var(--green),#059669)';
    btn.style.opacity = '1';
    showToast('success', '月度育人报告生成成功！');
    setTimeout(function() {
      btn.textContent = '一键生成';
      btn.style.background = 'linear-gradient(135deg,var(--accent),var(--accent2))';
    }, 3000);
  }, 1500);
}

// ---------- AI预测预警 ----------
function getPredictedRiskStudents() {
  var list = students.map(function(s) {
    return {
      student: s,
      riskScore: calculateRiskScore(s),
      predAttend: predictRisk(s.attendanceHistory || s.attTrend || [s.attend]),
      predScore: predictRisk(s.scoreHistory || s.grades || [s.avg])
    };
  });
  list.sort(function(a, b) { return b.riskScore - a.riskScore; });
  return list.slice(0, 5);
}

function renderPredictedAlerts() {
  var container = document.getElementById('predictedAlertsList');
  if (!container) return;
  var topStudents = getPredictedRiskStudents().slice(0, 3);
  if (topStudents.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-muted);font-size:13px">暂无高风险预测</div>';
    return;
  }
  container.innerHTML = topStudents.map(function(item) {
    var s = item.student;
    var riskInfo = getRiskLevelInfo(item.riskScore);
    return '<div class="predicted-alert-item">' +
      '<div class="predicted-alert-info">' +
        '<div class="predicted-alert-name">' + s.name + '<span class="badge ' + riskInfo.class + '" style="font-size:11px;margin-left:8px">' + riskInfo.level + '</span></div>' +
        '<div class="predicted-alert-meta">' + s.major + ' | ' + s.cls + '</div>' +
        '<div class="predicted-alert-pred">' +
          '<span>风险分: <strong style="color:' + riskInfo.color + '">' + item.riskScore + '%</strong></span>' +
          '<span>预测出勤: ' + item.predAttend + '%</span>' +
          '<span>预测成绩: ' + item.predScore + '</span>' +
        '</div>' +
      '</div>' +
      '<button class="btn btn-ai predicted-alert-btn" onclick="earlyIntervention(\'' + s.sid + '\')" style="margin-top:0;padding:6px 12px;font-size:12px;white-space:nowrap">提前干预</button>' +
    '</div>';
  }).join('');
}

function earlyIntervention(sid) {
  var s = students.find(function(st) { return st.sid === sid; });
  if (!s) return;
  var riskScore = calculateRiskScore(s);
  var predAttend = predictRisk(s.attendanceHistory || s.attTrend || [s.attend]);
  var predScore = predictRisk(s.scoreHistory || s.grades || [s.avg]);

  var prompt = '学生姓名：' + s.name + '，学号：' + s.sid + '，专业：' + s.major + '，班级：' + s.cls +
    '\n当前出勤率：' + s.attend + '%，预测下周出勤率：' + predAttend + '%' +
    '\n当前平均分：' + s.avg + '，预测下周成绩：' + predScore +
    '\n风险评分：' + riskScore + '分' +
    '\n\n请根据以上预测数据，生成一份个性化的提前干预计划，包括：' +
    '1. 干预目标（具体、可量化）\n' +
    '2. 干预措施（至少3条具体措施）\n' +
    '3. 时间安排\n' +
    '4. 预期效果\n' +
    '5. 跟进方式';

  callAI(prompt, '提前干预计划').then(function(result) {
    // 添加到待办事项
    var todoList = document.getElementById('todoList');
    if (todoList) {
      var li = document.createElement('li');
      li.className = 'todo-item';
      li.setAttribute('onclick', 'toggleTodo(this)');
      li.innerHTML = '<div class="todo-checkbox"><i class="fa-solid fa-check" style="display:none"></i></div>' +
        '<span class="todo-text">【AI预测干预】' + s.name + ' - ' + (riskScore >= 80 ? '立即约谈' : riskScore >= 60 ? '本周干预' : '持续关注') + '</span>' +
        '<span class="todo-time">AI生成</span>';
      todoList.insertBefore(li, todoList.firstChild);
      showToast('success', '已为 ' + s.name + ' 生成提前干预计划并添加到待办事项');
    }
  });
}

// ---------- AI Agent 智能巡查 ----------
function toggleAIAgent() {
  var toggle = document.getElementById('aiAgentToggle');
  aiAgentEnabled = toggle.checked;
  try { localStorage.setItem('daolu_ai_agent', aiAgentEnabled ? '1' : '0'); } catch(e) {}
  updateAgentUI();
  if (aiAgentEnabled) {
    showToast('success', 'AI智能巡查已开启，每30秒自动扫描');
    runAIAgentScan();
    agentTimer = setInterval(runAIAgentScan, 30000);
  } else {
    showToast('info', 'AI智能巡查已关闭');
    if (agentTimer) { clearInterval(agentTimer); agentTimer = null; }
  }
}

function runAIAgentScan() {
  var accessible = getAccessibleStudents();
  if (!aiAgentEnabled || !accessible || accessible.length === 0) return;
  // 随机选择1-2名学生
  var count = Math.floor(Math.random() * 2) + 1;
  for (var i = 0; i < count; i++) {
    var idx = Math.floor(Math.random() * accessible.length);
    var s = accessible[idx];
    agentScanCount++;
    // 30%概率发现问题
    if (Math.random() < 0.3) {
      agentIssueCount++;
      var issue = agentMockIssues[Math.floor(Math.random() * agentMockIssues.length)];
      var logEntry = {
        time: new Date().toLocaleString(),
        student: s.name,
        sid: s.sid,
        issue: issue.type + '：' + issue.desc,
        action: issue.action,
        timestamp: Date.now()
      };
      addAgentLog(logEntry);
      // 推送到待办事项
      addTodoItem('AI Agent：' + s.name + ' - ' + issue.action + '（' + issue.type + '）');
      showToast('warning', 'AI Agent发现新问题：' + s.name + ' ' + issue.type);
    } else {
      addAgentLog({
        time: new Date().toLocaleString(),
        student: s.name,
        sid: s.sid,
        issue: null,
        action: '扫描完成，未发现异常',
        timestamp: Date.now()
      });
    }
  }
  updateAgentUI();
}

function addAgentLog(entry) {
  agentLog.unshift(entry);
  if (agentLog.length > 20) agentLog = agentLog.slice(0, 20);
  try { localStorage.setItem('daolu_agent_log', JSON.stringify(agentLog)); } catch(e) {}
  renderAgentLog();
}

function renderAgentLog() {
  var list = document.getElementById('agentLogList');
  var empty = document.getElementById('agentLogEmpty');
  if (!list) return;
  if (agentLog.length === 0) {
    if (empty) empty.style.display = 'flex';
    return;
  }
  if (empty) empty.style.display = 'none';
  var html = '';
  agentLog.slice(0, 5).forEach(function(log) {
    var isIssue = log.issue !== null;
    var icon = isIssue ? '<i class="fa-solid fa-triangle-exclamation" style="color:var(--red)"></i>' : '<i class="fa-solid fa-check-circle" style="color:var(--green)"></i>';
    var cls = isIssue ? 'agent-log-item agent-log-issue' : 'agent-log-item';
    html += '<div class="' + cls + '">' +
      '<div class="agent-log-time">' + icon + ' ' + log.time + '</div>' +
      '<div class="agent-log-content">' +
        '<strong>' + log.student + '</strong>（' + log.sid + '）' +
        (isIssue ? '<span style="color:var(--red);margin-left:6px">' + log.issue + '</span>' : '') +
        '<div style="color:var(--text-muted);font-size:12px;margin-top:2px">' + log.action + '</div>' +
      '</div>' +
    '</div>';
  });
  list.innerHTML = html;
}

function updateAgentUI() {
  var label = document.getElementById('aiAgentStatusLabel');
  var statusText = document.getElementById('agentStatusText');
  var scanCount = document.getElementById('agentScanCount');
  var issueCount = document.getElementById('agentIssueCount');
  if (label) label.textContent = aiAgentEnabled ? '运行中' : '已关闭';
  if (label) label.style.color = aiAgentEnabled ? 'var(--green)' : 'var(--text-muted)';
  if (scanCount) scanCount.textContent = agentScanCount;
  if (issueCount) issueCount.textContent = agentIssueCount;
  if (statusText && aiAgentEnabled) {
    statusText.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin" style="color:var(--green)"></i> 已扫描 <strong>' + agentScanCount + '</strong> 名学生，发现 <strong style="color:var(--red)">' + agentIssueCount + '</strong> 个问题';
  } else if (statusText) {
    statusText.innerHTML = '<i class="fa-solid fa-circle-info" style="color:var(--text-muted)"></i> 已扫描 <strong>' + agentScanCount + '</strong> 名学生，发现 <strong style="color:var(--red)">' + agentIssueCount + '</strong> 个问题';
  }
}

function addTodoItem(text) {
  var todoList = document.getElementById('todoList');
  if (!todoList) return;
  var li = document.createElement('li');
  li.className = 'todo-item';
  li.setAttribute('onclick', 'toggleTodo(this)');
  li.innerHTML = '<div class="todo-checkbox"><i class="fa-solid fa-check" style="display:none"></i></div><span class="todo-text">' + text + '</span><span class="todo-time">AI生成</span>';
  todoList.insertBefore(li, todoList.firstChild);
  saveTodoState();
}

function loadAgentState() {
  try {
    var saved = localStorage.getItem('daolu_ai_agent');
    if (saved === '1') aiAgentEnabled = true;
    var logSaved = localStorage.getItem('daolu_agent_log');
    if (logSaved) agentLog = JSON.parse(logSaved);
  } catch(e) {}
}

// ---------- 谈心Agent：生成完整谈话脚本 ----------
var talkScriptStyles = {
  warm: { name: '亲切型', desc: '温和关怀，拉近距离' },
  serious: { name: '严肃型', desc: '直切主题，明确态度' },
  encourage: { name: '鼓励型', desc: '正向引导，激发动力' }
};

function generateFullTalkScript(sid) {
  var s = students.find(function(st) { return st.sid === sid; });
  if (!s) return;
  var modal = document.getElementById('detailModal');
  var tabAcademic = document.getElementById('tabAcademic');
  if (!tabAcademic) return;

  // 创建或更新脚本面板
  var scriptPanel = document.getElementById('talkScriptPanel');
  if (!scriptPanel) {
    scriptPanel = document.createElement('div');
    scriptPanel.id = 'talkScriptPanel';
    scriptPanel.className = 'talk-script-panel';
    tabAcademic.appendChild(scriptPanel);
  }

  scriptPanel.innerHTML =
    '<div class="talk-script-loading"><i class="fa-solid fa-circle-notch fa-spin"></i> AI正在生成完整谈话脚本...</div>';
  scriptPanel.style.display = 'block';

  var prompt = '请为以下学生生成一份完整的谈话脚本，包含开场白、核心问题话术（含追问）、回应话术、结束语。\n' +
    '学生信息：姓名' + s.name + '，学号' + s.sid + '，专业' + s.major + '，班级' + s.cls +
    '，出勤率' + s.attend + '%，作业完成率' + s.hw + '%，平均分' + s.avg + '分，预警等级' + (levelMap[s.level] || s.level) + '。\n' +
    '要求：\n1. 开场白提供3种风格（亲切型/严肃型/鼓励型）\n2. 核心问题5-8个，每个问题含追问\n3. 提供学生可能回答的应对话术\n4. 结束语包含总结和下一步行动约定\n5. 标注引用来源（如"根据《学生学业预警管理办法》第5条..."）';

  callAI(prompt, '谈心脚本').then(function(result) {
    scriptPanel.innerHTML =
      '<div class="talk-script-header">' +
        '<h4><i class="fa-solid fa-scroll"></i> AI完整谈话脚本 - ' + s.name + '</h4>' +
        '<div class="talk-script-actions">' +
          '<button class="btn btn-outline" onclick="copyTalkScript()" style="font-size:12px;padding:5px 12px"><i class="fa-solid fa-copy"></i> 复制</button>' +
          '<button class="btn btn-outline" onclick="printTalkScript()" style="font-size:12px;padding:5px 12px"><i class="fa-solid fa-print"></i> 打印</button>' +
          '<button class="btn btn-outline" onclick="closeTalkScript()" style="font-size:12px;padding:5px 12px"><i class="fa-solid fa-xmark"></i> 关闭</button>' +
        '</div>' +
      '</div>' +
      '<div class="talk-script-body" id="talkScriptBody">' + result.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') + '</div>';
  });
}

function copyTalkScript() {
  var body = document.getElementById('talkScriptBody');
  if (!body) return;
  var text = body.innerText || body.textContent;
  var ta = document.createElement('textarea');
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
  showToast('success', '谈话脚本已复制到剪贴板');
}

function printTalkScript() {
  var body = document.getElementById('talkScriptBody');
  if (!body) return;
  var printWin = window.open('', '_blank');
  printWin.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>谈话脚本</title>' +
    '<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;600;700&display=swap" rel="stylesheet">' +
    '<style>body{font-family:"Noto Sans SC",sans-serif;padding:40px;max-width:800px;margin:0 auto;line-height:1.8;color:#333}</style>' +
    '</head><body>' + body.innerHTML + '<script>setTimeout(function(){window.print();},500);<\/script></body></html>');
  printWin.document.close();
}

function closeTalkScript() {
  var panel = document.getElementById('talkScriptPanel');
  if (panel) panel.style.display = 'none';
}

// ---------- 演示数据切换 ----------
function switchDataset(key) {
  loadDataset(key);
  loadProfiles(key);
  selectedIndices = [];
  document.getElementById('selectAll').checked = false;
  populateFilters();
  renderTable('all');
  updateStats();
  updateProfileSelect();
  updateDualSliderFills();
  renderPredictedAlerts();
  var vizWrap = document.getElementById('dashboardViz');
  if (vizWrap && vizWrap.style.display !== 'none') {
    renderDashboardCharts();
  }
  showToast('success', '已切换至' + (key === 'nursing' ? '护理医学' : key === 'it' ? '信息技术' : '商务管理') + '数据集');
}

function updateProfileSelect() {
  var container = document.querySelector('.profile-select');
  if (!container) return;
  container.innerHTML = profiles.map(function(p, i) {
    return '<button class="filter-tag ' + (i === 0 ? 'active' : '') + '" onclick="selectProfile(' + i + ')">' + p.name + '</button>';
  }).join('');
}

// ---------- 初始化 ----------
document.addEventListener('DOMContentLoaded', function() {
  initTheme();
  initData();
  loadProfiles(currentDataset);
  initKeyboardShortcuts();
  bindRipple();
  initParticles();
  loadTodoState();
  loadChatHistory();
  updateApiStatusIndicator();
  initLazyCharts();
  initNotificationSystem();
  initVoiceInput();
  initAutoSave();
  initPWA();
  populateFilters();
  updateDualSliderFills();
  renderPredictedAlerts();
  loadAgentState();
  renderAgentLog();
  // 恢复登录状态
  if (restoreLoginState()) {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('appContainer').style.display = 'block';
    updateNavByRole();
    initNavByRole();
    if (currentUser.role === 'admin') {
      switchPage('admin');
    } else if (currentUser.role === 'teacher') {
      renderTable('all');
      animateNumbers();
      animateRing();
      initOnboarding();
    } else if (currentUser.role === 'student') {
      initStudentView();
    }
  } else {
    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('appContainer').style.display = 'none';
    // 记住我：自动填充账号
    try {
      var rememberedUser = localStorage.getItem('daolu_remember_user');
      var rememberedRole = localStorage.getItem('daolu_remember_role');
      if (rememberedUser) {
        document.getElementById('loginUser').value = rememberedUser;
        if (rememberedRole) document.getElementById('loginRole').value = rememberedRole;
      }
    } catch(e) {}
  }
  // 恢复Agent开关状态
  var agentToggle = document.getElementById('aiAgentToggle');
  if (agentToggle && aiAgentEnabled) {
    agentToggle.checked = true;
    updateAgentUI();
    agentTimer = setInterval(runAIAgentScan, 30000);
  }
  try {
    var savedFollowed = localStorage.getItem('daolu_followed');
    if (savedFollowed) followedSids = JSON.parse(savedFollowed);
  } catch(e) {}
  try {
    if (localStorage.getItem('daolu_pwa_dismissed') === '1') {
      var banner = document.getElementById('pwaInstallBanner');
      if (banner) banner.style.display = 'none';
    }
  } catch(e) {}

  // 弹窗点击外部关闭
  document.getElementById('detailModal').addEventListener('click', function(e) {
    if (e.target === e.currentTarget) closeModal();
  });
  // 风险详情弹窗点击外部关闭
  document.getElementById('riskDetailModal').addEventListener('click', function(e) {
    if (e.target === e.currentTarget) closeRiskDetail();
  });
  // 批量进度弹窗点击外部关闭
  document.getElementById('batchProgressModal').addEventListener('click', function(e) {
    if (e.target === e.currentTarget) document.getElementById('batchProgressModal').classList.remove('show');
  });
  // 周报弹窗点击外部关闭
  document.getElementById('weeklyReportModal').addEventListener('click', function(e) {
    if (e.target === e.currentTarget) closeWeeklyReport();
  });
  // 登录回车
  document.getElementById('loginPass').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') doLogin();
  });
  // 聊天回车
  document.getElementById('chatInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') sendChat();
  });
  // API设置回车
  document.getElementById('apiKey').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') saveApiSettings();
  });

  // 全局搜索快捷键 Ctrl+K
  document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      var gsInput = document.getElementById('globalSearchInput');
      if (gsInput) { gsInput.focus(); gsInput.select(); }
    }
    // ESC关闭搜索面板和右键菜单
    if (e.key === 'Escape') {
      closeGlobalSearch();
      hideContextMenu();
    }
  });

  // 点击其他区域关闭右键菜单和全局搜索面板
  document.addEventListener('click', function(e) {
    var menu = document.getElementById('contextMenu');
    if (menu && !menu.contains(e.target)) hideContextMenu();
    var panel = document.getElementById('globalSearchPanel');
    var wrap = document.getElementById('globalSearchWrap');
    if (panel && !panel.contains(e.target) && wrap && !wrap.contains(e.target)) {
      panel.classList.remove('show');
    }
  });

  // 表格右键菜单绑定
  var tableBody = document.getElementById('studentTableBody');
  if (tableBody) {
    tableBody.addEventListener('contextmenu', function(e) {
      var tr = e.target.closest('tr');
      if (!tr) return;
      // 查找该行对应的学生索引
      var tds = tr.querySelectorAll('td');
      if (tds.length < 2) return;
      var studentName = tds[1] ? tds[1].textContent.trim() : '';
      var studentSid = tds[2] ? tds[2].textContent.trim() : '';
      var foundIdx = -1;
      for (var i = 0; i < students.length; i++) {
        if (students[i].name === studentName && students[i].sid === studentSid) {
          foundIdx = i;
          break;
        }
      }
      if (foundIdx >= 0) {
        showContextMenu(e, foundIdx);
      }
    });
  }

  setTimeout(hideLoader, 800);
});

// ---------- PDF导出 ----------
function exportStudentPDF() {
  var modal = document.getElementById('detailModal').querySelector('.modal');
  if (!modal) return;
  showToast('info', '正在生成PDF，请稍候...');
  html2canvas(modal, { scale: 2, backgroundColor: null, useCORS: true }).then(function(canvas) {
    var imgData = canvas.toDataURL('image/png');
    var pdf = new window.jspdf.jsPDF('p', 'mm', 'a4');
    var pdfWidth = pdf.internal.pageSize.getWidth();
    var pdfHeight = pdf.internal.pageSize.getHeight();
    var imgWidth = canvas.width;
    var imgHeight = canvas.height;
    var ratio = Math.min((pdfWidth - 20) / imgWidth, (pdfHeight - 20) / imgHeight);
    var imgX = (pdfWidth - imgWidth * ratio) / 2;
    var imgY = 10;
    pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
    var title = document.getElementById('modalTitle').textContent.replace(/\s+/g, '_');
    pdf.save('学生档案_' + title + '_' + new Date().toLocaleDateString() + '.pdf');
    showToast('success', 'PDF导出成功');
  }).catch(function(err) {
    showToast('error', 'PDF导出失败：' + err.message);
  });
}

function exportReportPDF() {
  var section = document.getElementById('ringProgressArea');
  if (!section) return;
  showToast('info', '正在生成报告PDF，请稍候...');
  html2canvas(section, { scale: 2, backgroundColor: null, useCORS: true }).then(function(canvas) {
    var imgData = canvas.toDataURL('image/png');
    var pdf = new window.jspdf.jsPDF('p', 'mm', 'a4');
    var pdfWidth = pdf.internal.pageSize.getWidth();
    var imgWidth = canvas.width;
    var imgHeight = canvas.height;
    var ratio = (pdfWidth - 20) / imgWidth;
    pdf.addImage(imgData, 'PNG', 10, 10, imgWidth * ratio, imgHeight * ratio);
    pdf.save('月度育人报告_' + new Date().toLocaleDateString() + '.pdf');
    showToast('success', '报告PDF导出成功');
  }).catch(function(err) {
    showToast('error', 'PDF导出失败：' + err.message);
  });
}

// ---------- Excel导出 ----------
function exportExcel() {
  var accessible = getAccessibleStudents();
  if (!accessible || accessible.length === 0) {
    showToast('error', '暂无数据可导出');
    return;
  }
  var searchVal = (document.getElementById('searchInput').value || '').trim().toLowerCase();
  var data = currentFilter === 'all' ? accessible.slice() : accessible.filter(function(s) { return s.level === currentFilter; });
  if (searchVal) {
    data = data.filter(function(s) { return s.name.toLowerCase().indexOf(searchVal) > -1 || s.sid.toLowerCase().indexOf(searchVal) > -1; });
  }

  var levelTextMap = { red: '红色预警', orange: '橙色预警', blue: '蓝色关注', normal: '正常' };

  var exportData = data.map(function(s) {
    return {
      '姓名': s.name,
      '学号': s.sid,
      '专业': s.major,
      '班级': s.cls,
      '出勤率': s.attend + '%',
      '作业完成率': s.hw + '%',
      '平均成绩': s.avg,
      '预警等级': levelTextMap[s.level] || s.level
    };
  });

  var ws = XLSX.utils.json_to_sheet(exportData);
  var wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '预警看板');
  XLSX.writeFile(wb, '导路预警看板_' + new Date().toLocaleDateString() + '.xlsx');
  showToast('success', 'Excel导出成功，共 ' + exportData.length + ' 条记录');
}

// ========== 功能1: Excel/CSV数据导入 + AI智能分析 ==========
var pendingImportData = null;
var aiAnalyzeResults = {}; // sid -> {level, reasons, suggestions, riskScore}

function importStudentData(file) {
  if (!file) return;
  var fileName = file.name.toLowerCase();
  var reader = new FileReader();

  if (fileName.endsWith('.csv')) {
    reader.onload = function(e) {
      try {
        var text = e.target.result;
        var wb = XLSX.read(text, { type: 'string' });
        var ws = wb.Sheets[wb.SheetNames[0]];
        var jsonData = XLSX.utils.sheet_to_json(ws);
        processImportedData(jsonData);
      } catch (err) {
        showToast('error', 'CSV解析失败：' + err.message);
      }
    };
    reader.readAsText(file, 'utf-8');
  } else {
    reader.onload = function(e) {
      try {
        var data = new Uint8Array(e.target.result);
        var wb = XLSX.read(data, { type: 'array' });
        var ws = wb.Sheets[wb.SheetNames[0]];
        var jsonData = XLSX.utils.sheet_to_json(ws);
        processImportedData(jsonData);
      } catch (err) {
        showToast('error', 'Excel解析失败：' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  }
}

function processImportedData(jsonData) {
  if (!jsonData || jsonData.length === 0) {
    showToast('error', '文件中没有找到有效数据');
    return;
  }

  // 自动识别列名映射
  var nameKeys = ['姓名', '学生姓名', 'name', 'Name', '学生'];
  var sidKeys = ['学号', '学生学号', 'sid', 'student_id', 'id', 'ID', '编号'];
  var majorKeys = ['专业', '所在专业', 'major', 'Major'];
  var classKeys = ['班级', '所在班级', 'class', '班级名称', 'cls'];
  var attendKeys = ['出勤率', '出勤', '考勤率', 'attend', 'attendance'];
  var hwKeys = ['作业完成率', '作业率', '作业', 'homework', 'hw'];
  var avgKeys = ['平均成绩', '平均分', '成绩', '平均', 'avg', 'average', 'score'];

  var firstRow = jsonData[0];
  var actualKeys = Object.keys(firstRow);

  function findKey(candidates) {
    for (var i = 0; i < candidates.length; i++) {
      for (var j = 0; j < actualKeys.length; j++) {
        if (actualKeys[j].trim() === candidates[i]) return actualKeys[j];
      }
    }
    return null;
  }

  var nameKey = findKey(nameKeys);
  var sidKey = findKey(sidKeys);
  var majorKey = findKey(majorKeys);
  var classKey = findKey(classKeys);
  var attendKey = findKey(attendKeys);
  var hwKey = findKey(hwKeys);
  var avgKey = findKey(avgKeys);

  if (!nameKey || !sidKey) {
    showToast('error', '未识别到"姓名"或"学号"列，请检查表头');
    return;
  }

  var mapped = jsonData.map(function(row) {
    var name = String(row[nameKey] || '').trim();
    var sid = String(row[sidKey] || '').trim();
    var major = majorKey ? String(row[majorKey] || '').trim() : '未分类';
    var cls = classKey ? String(row[classKey] || '').trim() : '未分班';
    var attend = attendKey ? parseFloat(row[attendKey]) : 100;
    var hw = hwKey ? parseFloat(row[hwKey]) : 100;
    var avg = avgKey ? parseFloat(row[avgKey]) : 75;

    if (isNaN(attend)) attend = 100;
    if (isNaN(hw)) hw = 100;
    if (isNaN(avg)) avg = 75;
    attend = Math.min(100, Math.max(0, attend));
    hw = Math.min(100, Math.max(0, hw));
    avg = Math.min(100, Math.max(0, avg));

    return {
      name: name,
      sid: sid,
      major: major,
      cls: cls,
      attend: attend,
      hw: hw,
      avg: avg
    };
  }).filter(function(r) { return r.name && r.sid; });

  if (mapped.length === 0) {
    showToast('error', '未找到有效学生数据');
    return;
  }

  pendingImportData = mapped;
  aiAnalyzeResults = {};

  // 显示预览弹窗
  showImportPreview(mapped);

  // 如果启用了AI分析，自动调用
  var aiToggle = document.getElementById('aiAnalyzeToggle');
  if (aiToggle && aiToggle.checked) {
    aiAutoAnalyzeImport(mapped);
  }
}

function showImportPreview(mapped) {
  var infoEl = document.getElementById('importPreviewInfo');
  var tableEl = document.getElementById('importPreviewTable');
  infoEl.innerHTML = '<i class="fa-solid fa-circle-info" style="color:var(--blue)"></i> 文件包含 <strong>' + mapped.length + '</strong> 名学生数据，以下为前5行预览：';

  var previewRows = mapped.slice(0, 5);
  var html = '<table style="width:100%;font-size:12px;border-collapse:collapse">';
  html += '<thead><tr><th style="padding:6px 10px;background:rgba(245,158,11,.08);border:1px solid var(--border);text-align:left">姓名</th><th style="padding:6px 10px;background:rgba(245,158,11,.08);border:1px solid var(--border);text-align:left">学号</th><th style="padding:6px 10px;background:rgba(245,158,11,.08);border:1px solid var(--border);text-align:left">专业</th><th style="padding:6px 10px;background:rgba(245,158,11,.08);border:1px solid var(--border);text-align:left">班级</th><th style="padding:6px 10px;background:rgba(245,158,11,.08);border:1px solid var(--border);text-align:left">出勤率</th><th style="padding:6px 10px;background:rgba(245,158,11,.08);border:1px solid var(--border);text-align:left">作业率</th><th style="padding:6px 10px;background:rgba(245,158,11,.08);border:1px solid var(--border);text-align:left">平均分</th><th style="padding:6px 10px;background:rgba(245,158,11,.08);border:1px solid var(--border);text-align:left">AI分析</th></tr></thead><tbody>';
  previewRows.forEach(function(r) {
    var aiResult = aiAnalyzeResults[r.sid];
    var aiCell = '';
    if (aiResult) {
      var badgeClass = 'badge-' + (aiResult.level || 'green');
      var levelText = levelMap[aiResult.level] || '正常';
      aiCell = '<span class="badge ' + badgeClass + '" style="font-size:11px">' + levelText + '</span><div style="font-size:11px;color:var(--text-muted);margin-top:2px">风险:' + (aiResult.riskScore || 0) + '</div>';
    } else {
      aiCell = '<span style="color:var(--text-muted);font-size:11px">--</span>';
    }
    html += '<tr><td style="padding:6px 10px;border:1px solid var(--border)">' + r.name + '</td><td style="padding:6px 10px;border:1px solid var(--border)">' + r.sid + '</td><td style="padding:6px 10px;border:1px solid var(--border)">' + r.major + '</td><td style="padding:6px 10px;border:1px solid var(--border)">' + r.cls + '</td><td style="padding:6px 10px;border:1px solid var(--border)">' + r.attend + '%</td><td style="padding:6px 10px;border:1px solid var(--border)">' + r.hw + '%</td><td style="padding:6px 10px;border:1px solid var(--border)">' + r.avg + '</td><td style="padding:6px 10px;border:1px solid var(--border);text-align:center">' + aiCell + '</td></tr>';
  });
  html += '</tbody></table>';
  tableEl.innerHTML = html;

  document.getElementById('importPreviewModal').classList.add('show');
}

// AI自动分析导入数据
function aiAutoAnalyzeImport(data) {
  if (!data || data.length === 0) return;
  var progressWrap = document.getElementById('aiAnalyzeProgressWrap');
  var progressFill = document.getElementById('aiAnalyzeProgressFill');
  var progressText = document.getElementById('aiAnalyzeProgressText');
  if (progressWrap) progressWrap.style.display = 'block';

  var schema = { level: 'string', reasons: ['string'], suggestions: ['string'], riskScore: 'number' };
  var total = data.length;
  var completed = 0;

  function updateProgress() {
    completed++;
    var pct = Math.round((completed / total) * 100);
    if (progressFill) progressFill.style.width = pct + '%';
    if (progressText) progressText.textContent = 'AI分析中... ' + completed + '/' + total + ' (' + pct + '%)';
    // 每分析5个或全部完成时刷新预览
    if (completed % 5 === 0 || completed === total) {
      showImportPreview(pendingImportData);
    }
    if (completed === total) {
      if (progressText) progressText.textContent = 'AI分析完成，共 ' + total + ' 条';
      showToast('success', 'AI智能分析完成');
    }
  }

  data.forEach(function(student) {
    var prompt = '请分析以下学生数据并输出预警等级和原因：姓名' + student.name + '，出勤率' + student.attend + '%，作业完成率' + student.hw + '%，平均成绩' + student.avg + '分。';
    var context = '学生姓名：' + student.name + '\n学号：' + student.sid + '\n专业：' + student.major + '\n班级：' + student.cls +
      '\n出勤率：' + student.attend + '%\n作业完成率：' + student.hw + '%\n平均成绩：' + student.avg + '分\n\n请对该学生进行预警分析。';
    callAIStructured(prompt, context, schema).then(function(result) {
      if (result && result.level) {
        aiAnalyzeResults[student.sid] = result;
      } else {
        // fallback: 使用规则计算
        var level = 'normal';
        if (student.attend < 70 || student.avg < 50) level = 'red';
        else if (student.attend < 80 || student.avg < 60) level = 'orange';
        else if (student.attend < 90 || student.avg < 70) level = 'blue';
        aiAnalyzeResults[student.sid] = {
          level: level,
          reasons: ['出勤率' + student.attend + '%，平均成绩' + student.avg + '分'],
          suggestions: ['持续关注学生学习状态'],
          riskScore: Math.round(100 - (student.attend * 0.5 + student.avg * 0.5))
        };
      }
      updateProgress();
    }).catch(function() {
      var level = 'normal';
      if (student.attend < 70 || student.avg < 50) level = 'red';
      else if (student.attend < 80 || student.avg < 60) level = 'orange';
      else if (student.attend < 90 || student.avg < 70) level = 'blue';
      aiAnalyzeResults[student.sid] = {
        level: level,
        reasons: ['出勤率' + student.attend + '%，平均成绩' + student.avg + '分'],
        suggestions: ['持续关注学生学习状态'],
        riskScore: Math.round(100 - (student.attend * 0.5 + student.avg * 0.5))
      };
      updateProgress();
    });
  });
}

function closeImportPreview() {
  document.getElementById('importPreviewModal').classList.remove('show');
  pendingImportData = null;
  aiAnalyzeResults = {};
  var progressWrap = document.getElementById('aiAnalyzeProgressWrap');
  if (progressWrap) progressWrap.style.display = 'none';
}

function confirmImportData() {
  if (!pendingImportData || pendingImportData.length === 0) return;

  var newData = pendingImportData.map(function(r) {
    // 优先使用AI分析结果，否则计算预警等级
    var aiResult = aiAnalyzeResults[r.sid];
    var level = 'normal';
    if (aiResult && aiResult.level) {
      level = aiResult.level;
    } else {
      if (r.attend < 70 && r.avg < 55) level = 'red';
      else if (r.attend < 80 || r.avg < 65) level = 'orange';
      else if (r.attend < 85 || r.avg < 70) level = 'blue';
    }

    var avgBase = r.avg || 75;
    var attendBase = r.attend || 100;
    return {
      name: r.name,
      sid: r.sid,
      major: r.major,
      cls: r.cls,
      enroll: '2024年入学',
      attend: r.attend,
      hw: r.hw,
      avg: r.avg,
      level: level,
      grades: [
        Math.round(avgBase * (0.85 + Math.random() * 0.2)),
        Math.round(avgBase * (0.85 + Math.random() * 0.2)),
        Math.round(avgBase * (0.85 + Math.random() * 0.2)),
        Math.round(avgBase * (0.85 + Math.random() * 0.2)),
        Math.round(avgBase)
      ],
      attTrend: [
        attendBase * (0.9 + Math.random() * 0.15),
        attendBase * (0.9 + Math.random() * 0.15),
        attendBase * (0.9 + Math.random() * 0.15),
        attendBase * (0.95 + Math.random() * 0.1),
        attendBase
      ],
      attendanceHistory: [
        Math.round(attendBase * (0.9 + Math.random() * 0.15)),
        Math.round(attendBase * (0.9 + Math.random() * 0.15)),
        Math.round(attendBase * (0.9 + Math.random() * 0.15)),
        Math.round(attendBase * (0.95 + Math.random() * 0.1)),
        Math.round(attendBase)
      ],
      scoreHistory: [
        Math.round(avgBase * (0.85 + Math.random() * 0.2)),
        Math.round(avgBase * (0.85 + Math.random() * 0.2)),
        Math.round(avgBase * (0.85 + Math.random() * 0.2)),
        Math.round(avgBase * (0.85 + Math.random() * 0.2)),
        Math.round(avgBase)
      ],
      skills: {},
      careerMap: r.major,
      aiAnalysis: aiResult || null
    };
  });

  students = newData;
  currentFilter = 'all';
  selectedIndices = [];
  document.getElementById('selectAll').checked = false;

  populateFilters();
  renderTable('all');
  updateStats();

  document.getElementById('importPreviewModal').classList.remove('show');
  showToast('success', '成功导入 ' + newData.length + ' 名学生数据' + (Object.keys(aiAnalyzeResults).length > 0 ? '（含AI分析）' : ''));
  pendingImportData = null;
  aiAnalyzeResults = {};
  var progressWrap = document.getElementById('aiAnalyzeProgressWrap');
  if (progressWrap) progressWrap.style.display = 'none';
}

// ========== 功能2: 表格右键菜单 ==========
var contextMenuTargetIdx = -1;

function showContextMenu(e, studentIdx) {
  e.preventDefault();
  e.stopPropagation();
  contextMenuTargetIdx = studentIdx;
  var menu = document.getElementById('contextMenu');
  menu.style.left = e.clientX + 'px';
  menu.style.top = e.clientY + 'px';
  menu.classList.add('show');

  // 更新"标记已关注"按钮文本
  var s = students[studentIdx];
  if (s) {
    var markItem = menu.querySelectorAll('.context-menu-item')[2];
    if (markItem) {
      var isFollowed = followedSids.indexOf(s.sid) > -1;
      markItem.innerHTML = '<i class="fa-solid fa-star"></i> ' + (isFollowed ? '取消已关注' : '标记已关注');
    }
  }
}

function hideContextMenu() {
  var menu = document.getElementById('contextMenu');
  if (menu) menu.classList.remove('show');
  contextMenuTargetIdx = -1;
}

function ctxViewDetail() {
  hideContextMenu();
  if (contextMenuTargetIdx >= 0) openDetail(contextMenuTargetIdx);
}

function ctxGenTalk() {
  hideContextMenu();
  if (contextMenuTargetIdx >= 0) {
    openDetail(contextMenuTargetIdx);
    setTimeout(function() {
      var t = document.getElementById('talkOutline');
      if (t) t.style.display = 'block';
    }, 300);
  }
}

function ctxMarkFollowed() {
  if (contextMenuTargetIdx < 0) return;
  var s = students[contextMenuTargetIdx];
  if (!s) { hideContextMenu(); return; }
  var pos = followedSids.indexOf(s.sid);
  if (pos > -1) {
    followedSids.splice(pos, 1);
    showToast('info', '已取消关注 ' + s.name);
  } else {
    followedSids.push(s.sid);
    showToast('success', '已标记 ' + s.name + ' 为已关注');
  }
  try { localStorage.setItem('daolu_followed', JSON.stringify(followedSids)); } catch(e) {}
  renderTable(currentFilter);
  hideContextMenu();
}

function ctxExportProfile() {
  hideContextMenu();
  if (contextMenuTargetIdx >= 0) {
    openDetail(contextMenuTargetIdx);
    setTimeout(function() { exportStudentPDF(); }, 500);
  }
}

// ========== 数据管理功能 ==========
var studentFormMode = 'add';
var studentFormEditSid = null;

function openStudentForm(mode, sid) {
  studentFormMode = mode || 'add';
  studentFormEditSid = sid || null;
  document.getElementById('studentFormTitle').innerHTML = mode === 'edit' ? '<i class="fa-solid fa-user-pen"></i> 编辑学生' : '<i class="fa-solid fa-user-plus"></i> 添加学生';

  // 填充 datalist
  var majors = [];
  var classes = [];
  students.forEach(function(s) {
    if (majors.indexOf(s.major) === -1) majors.push(s.major);
    if (classes.indexOf(s.cls) === -1) classes.push(s.cls);
  });
  document.getElementById('sfMajorList').innerHTML = majors.map(function(m) { return '<option value="' + m + '">'; }).join('');
  document.getElementById('sfClassList').innerHTML = classes.map(function(c) { return '<option value="' + c + '">'; }).join('');

  if (mode === 'edit' && sid) {
    var s = students.find(function(st) { return st.sid === sid; });
    if (!s) { showToast('error', '未找到学生'); return; }
    document.getElementById('sfName').value = s.name;
    document.getElementById('sfSid').value = s.sid;
    document.getElementById('sfMajor').value = s.major;
    document.getElementById('sfClass').value = s.cls;
    document.getElementById('sfAttend').value = s.attend;
    document.getElementById('sfHw').value = s.hw;
    document.getElementById('sfAvg').value = s.avg;
    document.getElementById('sfLevel').value = s.level || 'auto';
    document.getElementById('sfAttTrend').value = (s.attendanceHistory || s.attTrend || []).join(',');
    document.getElementById('sfGrades').value = (s.scoreHistory || s.grades || []).join(',');
  } else {
    document.getElementById('sfName').value = '';
    document.getElementById('sfSid').value = '';
    document.getElementById('sfMajor').value = '';
    document.getElementById('sfClass').value = '';
    document.getElementById('sfAttend').value = '';
    document.getElementById('sfHw').value = '';
    document.getElementById('sfAvg').value = '';
    document.getElementById('sfLevel').value = 'auto';
    document.getElementById('sfAttTrend').value = '';
    document.getElementById('sfGrades').value = '';
  }
  document.getElementById('studentFormModal').classList.add('show');
}

function closeStudentForm() {
  document.getElementById('studentFormModal').classList.remove('show');
  studentFormMode = 'add';
  studentFormEditSid = null;
}

function saveStudentForm() {
  var name = document.getElementById('sfName').value.trim();
  var sid = document.getElementById('sfSid').value.trim();
  var major = document.getElementById('sfMajor').value.trim() || '未分类';
  var cls = document.getElementById('sfClass').value.trim() || '未分班';
  var attend = parseFloat(document.getElementById('sfAttend').value);
  var hw = parseFloat(document.getElementById('sfHw').value);
  var avg = parseFloat(document.getElementById('sfAvg').value);
  var levelSel = document.getElementById('sfLevel').value;
  var attTrendStr = document.getElementById('sfAttTrend').value.trim();
  var gradesStr = document.getElementById('sfGrades').value.trim();

  if (!name || !sid) {
    showToast('error', '姓名和学号为必填项');
    return;
  }
  if (isNaN(attend) || attend < 0 || attend > 100) attend = 100;
  if (isNaN(hw) || hw < 0 || hw > 100) hw = 100;
  if (isNaN(avg) || avg < 0 || avg > 100) avg = 75;

  // 解析历史数据
  var attTrend = [];
  if (attTrendStr) {
    attTrend = attTrendStr.split(',').map(function(v) { return parseFloat(v.trim()); }).filter(function(v) { return !isNaN(v); });
  }
  if (attTrend.length === 0) {
    attTrend = [attend, attend, attend, attend, attend];
  }
  var grades = [];
  if (gradesStr) {
    grades = gradesStr.split(',').map(function(v) { return parseFloat(v.trim()); }).filter(function(v) { return !isNaN(v); });
  }
  if (grades.length === 0) {
    grades = [avg, avg, avg, avg, avg];
  }

  // 判断预警等级
  var level = levelSel;
  if (level === 'auto') {
    level = getLevel({ attend: attend, avg: avg });
  }

  var studentData = {
    name: name,
    sid: sid,
    major: major,
    cls: cls,
    enroll: '2024年入学',
    attend: attend,
    hw: hw,
    avg: avg,
    level: level,
    grades: grades,
    attTrend: attTrend,
    attendanceHistory: attTrend.slice(),
    scoreHistory: grades.slice(),
    skills: {},
    careerMap: major
  };

  if (studentFormMode === 'edit' && studentFormEditSid) {
    var idx = students.findIndex(function(s) { return s.sid === studentFormEditSid; });
    if (idx > -1) {
      students[idx] = studentData;
      showToast('success', '学生 "' + name + '" 已更新');
    } else {
      showToast('error', '未找到要编辑的学生');
      return;
    }
  } else {
    // 检查学号是否已存在
    if (students.find(function(s) { return s.sid === sid; })) {
      showToast('error', '学号 "' + sid + '" 已存在');
      return;
    }
    students.push(studentData);
    showToast('success', '学生 "' + name + '" 已添加');
  }

  // 保存到localStorage
  try {
    localStorage.setItem('daolu_custom_students', JSON.stringify(students));
  } catch(e) {}

  closeStudentForm();
  populateFilters();
  renderTable(currentFilter);
  updateStats();
  renderDataManageTable();
}

function deleteStudent(sid) {
  if (!confirm('确定要删除该学生吗？此操作不可恢复。')) return;
  var idx = students.findIndex(function(s) { return s.sid === sid; });
  if (idx > -1) {
    var name = students[idx].name;
    students.splice(idx, 1);
    try {
      localStorage.setItem('daolu_custom_students', JSON.stringify(students));
    } catch(e) {}
    showToast('success', '学生 "' + name + '" 已删除');
    populateFilters();
    renderTable(currentFilter);
    updateStats();
    renderDataManageTable();
  }
}

function renderDataManageTable() {
  var tbody = document.getElementById('dataManageTableBody');
  var countEl = document.getElementById('dataManageCount');
  if (!tbody) return;

  var searchVal = (document.getElementById('dmSearchInput').value || '').trim().toLowerCase();
  var majorVal = document.getElementById('dmFilterMajor').value;
  var classVal = document.getElementById('dmFilterClass').value;
  var levelVal = document.getElementById('dmFilterLevel').value;

  var data = getTeacherManagedStudents();
  if (searchVal) {
    data = data.filter(function(s) { return s.name.toLowerCase().indexOf(searchVal) > -1 || s.sid.toLowerCase().indexOf(searchVal) > -1; });
  }
  if (majorVal) data = data.filter(function(s) { return s.major === majorVal; });
  if (classVal) data = data.filter(function(s) { return s.cls === classVal; });
  if (levelVal) data = data.filter(function(s) { return s.level === levelVal; });

  if (countEl) countEl.textContent = data.length > 0 ? '共 ' + data.length + ' 名学生' : '暂无数据';

  if (data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:40px;color:var(--text-muted)"><i class="fa-solid fa-inbox" style="font-size:24px;display:block;margin-bottom:8px"></i>暂无学生数据</td></tr>';
    return;
  }

  tbody.innerHTML = data.map(function(s) {
    var blinkClass = s.level === 'red' ? ' blink' : '';
    return '<tr>' +
      '<td><strong>' + s.name + '</strong></td>' +
      '<td>' + s.sid + '</td>' +
      '<td>' + s.major + '</td>' +
      '<td>' + s.cls + '</td>' +
      '<td>' + s.attend + '%</td>' +
      '<td>' + s.hw + '%</td>' +
      '<td>' + s.avg + '</td>' +
      '<td><span class="badge ' + badgeMap[s.level] + blinkClass + '">' + levelMap[s.level] + '</span></td>' +
      '<td>' +
        '<button class="btn btn-primary" style="margin-right:6px" onclick="openDetail(' + students.indexOf(s) + ')"><i class="fa-solid fa-eye"></i></button>' +
        '<button class="btn btn-outline" style="margin-right:6px" onclick="openStudentForm(\'edit\', \'' + s.sid + '\')"><i class="fa-solid fa-pen"></i></button>' +
        '<button class="btn btn-outline" style="color:var(--red);border-color:rgba(239,68,68,.3)" onclick="deleteStudent(\'' + s.sid + '\')"><i class="fa-solid fa-trash"></i></button>' +
      '</td>' +
    '</tr>';
  }).join('');
}

function resetDataManageFilters() {
  document.getElementById('dmSearchInput').value = '';
  document.getElementById('dmFilterMajor').value = '';
  document.getElementById('dmFilterClass').value = '';
  document.getElementById('dmFilterLevel').value = '';
  renderDataManageTable();
}

function populateDataManageFilters() {
  var majorSel = document.getElementById('dmFilterMajor');
  var classSel = document.getElementById('dmFilterClass');
  if (!majorSel || !classSel) return;
  var accessible = getAccessibleStudents();
  var majors = [];
  var classes = [];
  accessible.forEach(function(s) {
    if (majors.indexOf(s.major) === -1) majors.push(s.major);
    if (classes.indexOf(s.cls) === -1) classes.push(s.cls);
  });
  var curMajor = majorSel.value;
  var curClass = classSel.value;
  majorSel.innerHTML = '<option value="">全部专业</option>' + majors.map(function(m) { return '<option value="' + m + '">' + m + '</option>'; }).join('');
  classSel.innerHTML = '<option value="">全部班级</option>' + classes.map(function(c) { return '<option value="' + c + '">' + c + '</option>'; }).join('');
  majorSel.value = curMajor;
  classSel.value = curClass;
}

function exportDataManageExcel() {
  var accessible = getAccessibleStudents();
  if (!accessible || accessible.length === 0) {
    showToast('error', '暂无数据可导出');
    return;
  }
  var searchVal = (document.getElementById('dmSearchInput').value || '').trim().toLowerCase();
  var majorVal = document.getElementById('dmFilterMajor').value;
  var classVal = document.getElementById('dmFilterClass').value;
  var levelVal = document.getElementById('dmFilterLevel').value;

  var data = accessible.slice();
  if (searchVal) data = data.filter(function(s) { return s.name.toLowerCase().indexOf(searchVal) > -1 || s.sid.toLowerCase().indexOf(searchVal) > -1; });
  if (majorVal) data = data.filter(function(s) { return s.major === majorVal; });
  if (classVal) data = data.filter(function(s) { return s.cls === classVal; });
  if (levelVal) data = data.filter(function(s) { return s.level === levelVal; });

  var levelTextMap = { red: '红色预警', orange: '橙色预警', blue: '蓝色关注', normal: '正常' };
  var exportData = data.map(function(s) {
    return {
      '姓名': s.name,
      '学号': s.sid,
      '专业': s.major,
      '班级': s.cls,
      '出勤率': s.attend + '%',
      '作业完成率': s.hw + '%',
      '平均成绩': s.avg,
      '预警等级': levelTextMap[s.level] || s.level
    };
  });
  var ws = XLSX.utils.json_to_sheet(exportData);
  var wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '学生数据');
  XLSX.writeFile(wb, '导路学生数据_' + new Date().toLocaleDateString() + '.xlsx');
  showToast('success', 'Excel导出成功，共 ' + exportData.length + ' 条记录');
}

// ========== 功能3: 全局搜索 ==========
var globalSearchPages = [
  { id: 'dashboard', name: '预警看板', icon: 'fa-solid fa-chart-line', desc: '查看学生学业预警状态' },
  { id: 'chat', name: '谈心助手', icon: 'fa-solid fa-comments', desc: 'AI辅助谈心谈话' },
  { id: 'profile', name: '成长档案', icon: 'fa-solid fa-file-waveform', desc: '查看学生成长记录' },
  { id: 'datamanage', name: '数据管理', icon: 'fa-solid fa-database', desc: '学生数据添加、编辑、删除' },
  { id: 'workspace', name: '工作台', icon: 'fa-solid fa-briefcase', desc: '快捷操作与待办管理' }
];

function globalSearch(keyword) {
  var panel = document.getElementById('globalSearchPanel');
  keyword = (keyword || '').trim().toLowerCase();
  if (!keyword) {
    panel.classList.remove('show');
    return;
  }

  var studentResults = [];
  students.forEach(function(s, idx) {
    if (s.name.toLowerCase().indexOf(keyword) > -1 || s.sid.toLowerCase().indexOf(keyword) > -1) {
      studentResults.push({ idx: idx, name: s.name, sid: s.sid, major: s.major, level: s.level });
    }
  });

  var funcResults = [];
  globalSearchPages.forEach(function(p) {
    if (p.name.toLowerCase().indexOf(keyword) > -1 || p.desc.toLowerCase().indexOf(keyword) > -1) {
      funcResults.push(p);
    }
  });

  if (studentResults.length === 0 && funcResults.length === 0) {
    panel.innerHTML = '<div class="global-search-empty"><i class="fa-solid fa-magnifying-glass" style="font-size:20px;display:block;margin-bottom:8px"></i>未找到匹配结果</div>';
  } else {
    var html = '';
    if (studentResults.length > 0) {
      html += '<div class="global-search-category">学生 (' + studentResults.length + ')</div>';
      studentResults.slice(0, 8).forEach(function(r) {
        var levelBadge = '<span class="badge badge-' + r.level + '" style="font-size:10px;padding:1px 6px;margin-left:6px">' + (levelMap[r.level] || r.level) + '</span>';
        html += '<div class="global-search-result" onclick="gsJumpStudent(' + r.idx + ')">' +
          '<i class="fa-solid fa-user gs-icon-student"></i>' +
          '<div class="gs-info"><div class="gs-title">' + r.name + levelBadge + '</div><div class="gs-desc">' + r.sid + ' | ' + r.major + '</div></div></div>';
      });
    }
    if (funcResults.length > 0) {
      html += '<div class="global-search-category">功能页面</div>';
      funcResults.forEach(function(p) {
        html += '<div class="global-search-result" onclick="gsJumpPage(\'' + p.id + '\')">' +
          '<i class="' + p.icon + ' gs-icon-func"></i>' +
          '<div class="gs-info"><div class="gs-title">' + p.name + '</div><div class="gs-desc">' + p.desc + '</div></div></div>';
      });
    }
    panel.innerHTML = html;
  }
  panel.classList.add('show');
}

function gsJumpStudent(idx) {
  closeGlobalSearch();
  switchPage('dashboard');
  setTimeout(function() { openDetail(idx); }, 200);
}

function gsJumpPage(id) {
  closeGlobalSearch();
  switchPage(id);
}

function closeGlobalSearch() {
  document.getElementById('globalSearchPanel').classList.remove('show');
  document.getElementById('globalSearchInput').value = '';
}

// ========== 功能4: 消息模板库 ==========
var defaultTemplates = [
  {
    id: 'tpl_absent',
    name: '缺勤学生谈话提纲',
    content: '请帮我准备关于【缺勤学生谈话】的谈话方案',
    icon: 'fa-solid fa-user-xmark'
  },
  {
    id: 'tpl_grade',
    name: '成绩下滑学生谈话提纲',
    content: '请帮我准备关于【成绩下滑提醒】的谈话方案',
    icon: 'fa-solid fa-chart-line-down'
  },
  {
    id: 'tpl_career',
    name: '职业规划指导提纲',
    content: '请帮我准备关于【职业规划指导】的谈话方案',
    icon: 'fa-solid fa-compass'
  },
  {
    id: 'tpl_freshman',
    name: '新生入学指导提纲',
    content: '请帮我准备关于【新生入学指导】的谈话方案，包括校园适应、学习方法指导、人际关系建立等内容',
    icon: 'fa-solid fa-graduation-cap'
  },
  {
    id: 'tpl_summary',
    name: '学期末总结提纲',
    content: '请帮我准备关于【学期末总结】的谈话方案，回顾本学期表现、分析进步与不足、制定下学期目标',
    icon: 'fa-solid fa-clipboard-check'
  }
];

var favoriteTemplates = [];

function loadFavoriteTemplates() {
  try {
    var saved = localStorage.getItem('daolu_templates');
    if (saved) favoriteTemplates = JSON.parse(saved);
  } catch(e) {}
}

function saveFavoriteTemplates() {
  try {
    localStorage.setItem('daolu_templates', JSON.stringify(favoriteTemplates));
  } catch(e) {}
}

function openTemplatePanel() {
  loadFavoriteTemplates();
  var panel = document.getElementById('templatePanel');
  if (panel.style.display === 'none' || !panel.style.display) {
    panel.style.display = 'block';
    renderTemplateList();
  } else {
    panel.style.display = 'none';
  }
}

function closeTemplatePanel() {
  document.getElementById('templatePanel').style.display = 'none';
}

function renderTemplateList() {
  var listEl = document.getElementById('templateList');
  var html = '';

  // 渲染默认模板
  defaultTemplates.forEach(function(tpl) {
    var isFav = favoriteTemplates.some(function(f) { return f.id === tpl.id; });
    html += '<div class="template-item" onclick="applyTemplate(\'' + tpl.id + '\')">' +
      '<i class="' + tpl.icon + ' ti-icon"></i>' +
      '<span class="ti-name">' + tpl.name + '</span>' +
      '<div class="ti-actions">' +
        '<button class="ti-btn ' + (isFav ? 'favorited' : '') + '" onclick="event.stopPropagation();toggleFavoriteTemplate(\'' + tpl.id + '\')" title="收藏"><i class="fa-solid fa-star"></i></button>' +
        '<button class="ti-btn" onclick="event.stopPropagation();applyTemplateDirect(\'' + tpl.id + '\')" title="直接发送"><i class="fa-solid fa-paper-plane"></i></button>' +
      '</div></div>';
  });

  // 渲染自定义模板
  if (favoriteTemplates.length > 0) {
    favoriteTemplates.forEach(function(tpl) {
      if (tpl.isCustom) {
        html += '<div class="template-item" onclick="applyCustomTemplate(' + favoriteTemplates.indexOf(tpl) + ')">' +
          '<i class="fa-solid fa-puzzle-piece ti-icon"></i>' +
          '<span class="ti-name">' + tpl.name + '</span>' +
          '<div class="ti-actions">' +
            '<button class="ti-btn" onclick="event.stopPropagation();deleteCustomTemplate(' + favoriteTemplates.indexOf(tpl) + ')" title="删除"><i class="fa-solid fa-trash"></i></button>' +
            '<button class="ti-btn" onclick="event.stopPropagation();applyCustomTemplateDirect(' + favoriteTemplates.indexOf(tpl) + ')" title="直接发送"><i class="fa-solid fa-paper-plane"></i></button>' +
          '</div></div>';
      }
    });
  }

  listEl.innerHTML = html;
}

function applyTemplate(id) {
  var tpl = defaultTemplates.find(function(t) { return t.id === id; });
  if (!tpl) return;
  var input = document.getElementById('chatInput');
  if (input) input.value = tpl.content;
  closeTemplatePanel();
  showToast('info', '已填充模板到输入框，可编辑后发送');
}

function applyTemplateDirect(id) {
  var tpl = defaultTemplates.find(function(t) { return t.id === id; });
  if (!tpl) return;
  closeTemplatePanel();
  addUserMsg(tpl.content);
  setTimeout(function() {
    showTyping();
    setTimeout(function() {
      removeTyping();
      var typeMap = { tpl_absent: 'absent', tpl_grade: 'grade', tpl_career: 'career' };
      var replyKey = typeMap[id];
      if (replyKey && chatReplies[replyKey]) {
        addAiMsg(chatReplies[replyKey]);
      } else {
        addAiMsg('感谢您的提问。基于您选择的模板，AI建议：\n\n1. 先与学生建立信任关系，以关心而非批评的方式开始沟通\n2. 收集详细的学生数据（出勤、成绩、课堂表现）\n3. 制定个性化干预方案，设定可衡量的短期目标\n4. 持续跟踪反馈，必要时寻求辅导员和家长的配合');
      }
    }, 1500);
  }, 300);
}

function applyCustomTemplate(idx) {
  var tpl = favoriteTemplates[idx];
  if (!tpl) return;
  var input = document.getElementById('chatInput');
  if (input) input.value = tpl.content;
  closeTemplatePanel();
  showToast('info', '已填充模板到输入框，可编辑后发送');
}

function applyCustomTemplateDirect(idx) {
  var tpl = favoriteTemplates[idx];
  if (!tpl) return;
  closeTemplatePanel();
  addUserMsg(tpl.content);
  setTimeout(function() {
    showTyping();
    setTimeout(function() {
      removeTyping();
      addAiMsg('感谢您的提问。基于您选择的模板，AI建议：\n\n1. 先与学生建立信任关系，以关心而非批评的方式开始沟通\n2. 收集详细的学生数据（出勤、成绩、课堂表现）\n3. 制定个性化干预方案，设定可衡量的短期目标\n4. 持续跟踪反馈，必要时寻求辅导员和家长的配合');
    }, 1500);
  }, 300);
}

function toggleFavoriteTemplate(id) {
  var existIdx = -1;
  for (var i = 0; i < favoriteTemplates.length; i++) {
    if (favoriteTemplates[i].id === id) { existIdx = i; break; }
  }
  if (existIdx > -1) {
    var tpl = favoriteTemplates[existIdx];
    if (!tpl.isCustom) {
      favoriteTemplates.splice(existIdx, 1);
      showToast('info', '已取消收藏');
    }
  } else {
    var defaultTpl = defaultTemplates.find(function(t) { return t.id === id; });
    if (defaultTpl) {
      favoriteTemplates.push({ id: defaultTpl.id, name: defaultTpl.name, content: defaultTpl.content, icon: defaultTpl.icon, isCustom: false });
      showToast('success', '已收藏模板');
    }
  }
  saveFavoriteTemplates();
  renderTemplateList();
}

function deleteCustomTemplate(idx) {
  if (idx >= 0 && idx < favoriteTemplates.length) {
    favoriteTemplates.splice(idx, 1);
    saveFavoriteTemplates();
    renderTemplateList();
    showToast('info', '已删除自定义模板');
  }
}

function saveCustomTemplate() {
  var nameInput = document.getElementById('customTemplateName');
  var contentInput = document.getElementById('customTemplateContent');
  var name = (nameInput.value || '').trim();
  var content = (contentInput.value || '').trim();

  if (!name) {
    showToast('error', '请输入模板名称');
    return;
  }
  if (!content) {
    showToast('error', '请输入模板内容');
    return;
  }

  var customId = 'custom_' + Date.now();
  favoriteTemplates.push({
    id: customId,
    name: name,
    content: content,
    icon: 'fa-solid fa-puzzle-piece',
    isCustom: true
  });

  saveFavoriteTemplates();
  renderTemplateList();
  nameInput.value = '';
  contentInput.value = '';
  showToast('success', '自定义模板已保存');
}

// ---------- AI周报生成 ----------
function generateWeeklyReport() {
  var modal = document.getElementById('weeklyReportModal');
  var content = document.getElementById('weeklyReportContent');
  if (!modal || !content) return;
  modal.style.display = 'flex';
  content.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted)"><i class="fa-solid fa-circle-notch fa-spin" style="font-size:24px;margin-bottom:12px"></i><p>正在生成周报，请稍候...</p></div>';

  // 收集数据
  var total = students.length;
  var redCount = students.filter(function(s) { return s.level === 'red'; }).length;
  var orangeCount = students.filter(function(s) { return s.level === 'orange'; }).length;
  var blueCount = students.filter(function(s) { return s.level === 'blue'; }).length;
  var normalCount = students.filter(function(s) { return s.level === 'normal'; }).length;
  var warningStudents = students.filter(function(s) { return s.level !== 'normal'; });

  var today = new Date();
  var weekStart = new Date(today);
  weekStart.setDate(today.getDate() - 7);
  var dateStr = weekStart.getFullYear() + '-' + String(weekStart.getMonth() + 1).padStart(2, '0') + '-' + String(weekStart.getDate()).padStart(2, '0');
  var endDateStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

  // 构建提示词
  var context = '以下是班级学生学业数据（共' + total + '人）：\n';
  context += '红色预警：' + redCount + '人\n';
  context += '橙色预警：' + orangeCount + '人\n';
  context += '蓝色关注：' + blueCount + '人\n';
  context += '正常：' + normalCount + '人\n\n';
  context += '预警学生详情：\n';
  warningStudents.forEach(function(s) {
    context += '姓名：' + s.name + '，学号：' + s.sid + '，专业：' + s.major + '，班级：' + s.cls +
      '，出勤率：' + s.attend + '%，作业完成率：' + s.hw + '%，平均分：' + s.avg +
      '，预警等级：' + (levelMap[s.level] || s.level) +
      '，成绩趋势：' + s.grades.join(',') +
      '，出勤趋势：' + s.attTrend.join(',') + '\n';
  });

  var prompt = '请根据以上学生学业数据，生成一份班级学业分析周报。周报时间：' + dateStr + ' 至 ' + endDateStr + '。\n\n' +
    '周报格式要求：\n' +
    '一、总体概况：总人数、各预警等级分布\n' +
    '二、预警学生详情：逐个分析每位预警学生的原因（出勤率低/成绩下降/作业未完成等），并给出针对性建议\n' +
    '三、本周干预记录：模拟本周已完成的干预工作（如已谈话学生、已安排帮扶等）\n' +
    '四、下周工作计划：列出下周需要重点关注的任务和计划\n\n' +
    '请用专业、简洁的语言撰写，使用Markdown格式排版。';

  callAI(prompt, context).then(function(report) {
    // 生成报告HTML
    var warningDetailHtml = warningStudents.map(function(s) {
      var alertColor = s.level === 'red' ? 'var(--red)' : s.level === 'orange' ? 'var(--orange)' : 'var(--blue)';
      var reasons = [];
      if (s.attend < 80) reasons.push('出勤率偏低（' + s.attend + '%）');
      if (s.avg < 60) reasons.push('平均成绩偏低（' + s.avg + '分）');
      if (s.hw < 70) reasons.push('作业完成率低（' + s.hw + '%）');
      var trend = s.grades[4] > s.grades[0] ? '成绩呈上升趋势' : s.grades[4] < s.grades[0] ? '成绩呈下降趋势' : '成绩基本持平';
      reasons.push(trend);
      return '<div style="padding:12px;margin:8px 0;border-left:3px solid ' + alertColor + ';background:var(--card);border-radius:0 8px 8px 0">' +
        '<strong style="color:' + alertColor + '">' + s.name + '</strong>（' + s.sid + '）<span class="badge ' + badgeMap[s.level] + '" style="margin-left:8px">' + levelMap[s.level] + '</span>' +
        '<div style="font-size:13px;margin-top:6px;color:var(--text-muted)">' + s.major + ' | ' + s.cls + ' | 出勤率 ' + s.attend + '% | 平均分 ' + s.avg + '</div>' +
        '<div style="font-size:13px;margin-top:4px">预警原因：' + reasons.join('；') + '</div>' +
      '</div>';
    }).join('');

    var interventionHtml = '<ul style="padding-left:20px;font-size:14px;line-height:2">' +
      '<li>已完成红色预警学生' + Math.min(redCount, 3) + '人的一对一谈话（' + warningStudents.filter(function(s) { return s.level === 'red'; }).slice(0, 3).map(function(s) { return s.name; }).join('、') + '）</li>' +
      '<li>已为橙色预警学生制定关注计划，安排学习伙伴结对帮扶</li>' +
      '<li>与辅导员沟通班级学风建设问题，共同商讨改进方案</li>' +
      '<li>通过班级群发布学业提醒消息，提醒学生关注出勤和作业</li>' +
      '</ul>';

    var planHtml = '<ul style="padding-left:20px;font-size:14px;line-height:2">' +
      '<li>继续跟进红色预警学生的改善情况，确保每周至少一次谈话</li>' +
      '<li>对橙色预警学生进行阶段性检查，评估帮扶效果</li>' +
      '<li>组织一次班级学习经验分享会，营造良好学风</li>' +
      '<li>更新学生成长档案，记录本周干预措施和效果</li>' +
      '<li>关注蓝色关注学生的学习动态，预防进一步下滑</li>' +
      '</ul>';

    var reportHtml = '<div style="font-family:Noto Sans SC,sans-serif;line-height:1.8">' +
      '<div style="text-align:center;margin-bottom:30px;border-bottom:2px solid var(--border);padding-bottom:20px">' +
        '<h2 style="margin-bottom:8px">班级学业分析周报</h2>' +
        '<p style="color:var(--text-muted);font-size:14px">报告周期：' + dateStr + ' 至 ' + endDateStr + '&nbsp;&nbsp;|&nbsp;&nbsp;导出时间：' + today.toLocaleString() + '</p>' +
      '</div>' +
      '<div style="margin-bottom:30px">' +
        '<h3 style="color:var(--accent);margin-bottom:12px"><i class="fa-solid fa-chart-pie"></i> 一、总体概况</h3>' +
        '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px">' +
          '<div style="text-align:center;padding:16px;background:var(--card);border-radius:10px"><div style="font-size:28px;font-weight:700">' + total + '</div><div style="color:var(--text-muted);font-size:13px">学生总数</div></div>' +
          '<div style="text-align:center;padding:16px;background:var(--card);border-radius:10px;border-top:3px solid var(--red)"><div style="font-size:28px;font-weight:700;color:var(--red)">' + redCount + '</div><div style="color:var(--text-muted);font-size:13px">红色预警</div></div>' +
          '<div style="text-align:center;padding:16px;background:var(--card);border-radius:10px;border-top:3px solid var(--orange)"><div style="font-size:28px;font-weight:700;color:var(--orange)">' + orangeCount + '</div><div style="color:var(--text-muted);font-size:13px">橙色预警</div></div>' +
          '<div style="text-align:center;padding:16px;background:var(--card);border-radius:10px;border-top:3px solid var(--blue)"><div style="font-size:28px;font-weight:700;color:var(--blue)">' + blueCount + '</div><div style="color:var(--text-muted);font-size:13px">蓝色关注</div></div>' +
        '</div>' +
        '<p style="font-size:14px">本周班级共有学生' + total + '人，其中预警学生' + warningStudents.length + '人（占比' + Math.round(warningStudents.length / total * 100) + '%）。预警等级分布为：红色预警' + redCount + '人、橙色预警' + orangeCount + '人、蓝色关注' + blueCount + '人。需要重点关注红色和橙色预警学生。</p>' +
      '</div>' +
      '<div style="margin-bottom:30px">' +
        '<h3 style="color:var(--red);margin-bottom:12px"><i class="fa-solid fa-triangle-exclamation"></i> 二、预警学生详情</h3>' +
        warningDetailHtml +
      '</div>' +
      '<div style="margin-bottom:30px">' +
        '<h3 style="color:var(--green);margin-bottom:12px"><i class="fa-solid fa-clipboard-check"></i> 三、本周干预记录</h3>' +
        interventionHtml +
      '</div>' +
      '<div style="margin-bottom:30px">' +
        '<h3 style="color:var(--blue);margin-bottom:12px"><i class="fa-solid fa-list-check"></i> 四、下周工作计划</h3>' +
        planHtml +
      '</div>';

    // 如果有AI返回内容，追加AI分析
    if (report && report.indexOf('预设模拟') === -1) {
      reportHtml += '<div style="margin-top:20px;padding:16px;background:rgba(236,72,153,.08);border:1px solid rgba(236,72,153,.2);border-radius:10px">' +
        '<h4 style="color:#ec4899;margin-bottom:10px"><i class="fa-solid fa-robot"></i> AI智能分析</h4>' +
        '<div style="font-size:14px;white-space:pre-wrap">' + report.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') + '</div>' +
      '</div>';
    }

    reportHtml += '</div>';
    content.innerHTML = reportHtml;
  });
}

function closeWeeklyReport() {
  var modal = document.getElementById('weeklyReportModal');
  if (modal) modal.style.display = 'none';
}

function printWeeklyReport() {
  var content = document.getElementById('weeklyReportContent');
  if (!content) return;
  var printWin = window.open('', '_blank');
  printWin.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>AI学业分析周报</title>' +
    '<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;600;700&display=swap" rel="stylesheet">' +
    '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">' +
    '<style>body{font-family:"Noto Sans SC",sans-serif;padding:40px;max-width:800px;margin:0 auto;line-height:1.8;color:#333}h2,h3{margin-bottom:12px}.badge{padding:2px 8px;border-radius:4px;font-size:12px}.badge-red{background:#fee2e2;color:#dc2626}.badge-orange{background:#ffedd5;color:#ea580c}.badge-blue{background:#dbeafe;color:#2563eb}</style>' +
    '</head><body>' + content.innerHTML + '<script>setTimeout(function(){window.print();},500);<\/script></body></html>');
  printWin.document.close();
}

function exportWeeklyReportPDF() {
  var modal = document.getElementById('weeklyReportModal').querySelector('.modal');
  if (!modal) return;
  showToast('info', '正在生成周报PDF，请稍候...');
  html2canvas(modal, { scale: 2, backgroundColor: null, useCORS: true }).then(function(canvas) {
    var imgData = canvas.toDataURL('image/png');
    var pdf = new window.jspdf.jsPDF('p', 'mm', 'a4');
    var pdfWidth = pdf.internal.pageSize.getWidth();
    var pdfHeight = pdf.internal.pageSize.getHeight();
    var imgWidth = canvas.width;
    var imgHeight = canvas.height;
    // 如果内容超过一页，分页处理
    var ratio = (pdfWidth - 20) / imgWidth;
    var totalHeight = imgHeight * ratio;
    var pageHeight = pdfHeight - 20;
    var page = 0;
    var yOffset = 10;
    while (yOffset < totalHeight) {
      if (page > 0) pdf.addPage();
      var srcY = page * pageHeight / ratio;
      var srcH = Math.min(imgHeight - srcY, pageHeight / ratio);
      pdf.addImage(imgData, 'PNG', 10, yOffset - page * pageHeight, imgWidth * ratio, srcH * ratio, undefined, 'FAST');
      yOffset += pageHeight;
      page++;
    }
    pdf.save('AI学业分析周报_' + new Date().toLocaleDateString() + '.pdf');
    showToast('success', '周报PDF导出成功');
  }).catch(function(err) {
    showToast('error', 'PDF导出失败：' + err.message);
  });
}

// ---------- 结构化预警分析渲染 ----------
function renderStructuredAlert(data) {
  var levelColors = { red: 'var(--red)', orange: 'var(--orange)', blue: 'var(--blue)', green: 'var(--green)' };
  var levelLabels = { red: '红色预警', orange: '橙色预警', blue: '蓝色关注', green: '正常' };
  var levelColor = levelColors[data.level] || levelColors.green;
  var levelLabel = levelLabels[data.level] || '未知';
  var score = data.score || 0;

  var reasonsHtml = (data.reasons || []).map(function(r) {
    return '<li><i class="fa-solid fa-circle-exclamation"></i> ' + r + '</li>';
  }).join('');

  var suggestionsHtml = (data.suggestions || []).map(function(s) {
    return '<li><i class="fa-solid fa-lightbulb"></i> ' + s + '</li>';
  }).join('');

  return '<div class="structured-alert">' +
    '<div class="sa-header">' +
      '<div class="sa-level-badge" style="background:' + levelColor + '">' +
        '<span class="sa-level-dot"></span> ' + levelLabel +
      '</div>' +
      '<div class="sa-risk">风险等级：<strong style="color:' + levelColor + '">' + (data.risk || '中') + '</strong></div>' +
    '</div>' +
    '<div class="sa-score-row">' +
      '<span class="sa-score-label">风险评分</span>' +
      '<div class="sa-score-bar-wrap">' +
        '<div class="sa-score-bar"><div class="sa-score-fill" style="width:' + Math.min(100, score) + '%;background:' + levelColor + '"></div></div>' +
        '<span class="sa-score-num" style="color:' + levelColor + '">' + score + '</span>' +
      '</div>' +
    '</div>' +
    (reasonsHtml ? '<div class="sa-section"><h4><i class="fa-solid fa-triangle-exclamation"></i> 预警原因</h4><ul class="sa-list">' + reasonsHtml + '</ul></div>' : '') +
    (suggestionsHtml ? '<div class="sa-section"><h4><i class="fa-solid fa-lightbulb"></i> 干预建议</h4><ul class="sa-list sa-list-suggest">' + suggestionsHtml + '</ul></div>' : '') +
  '</div>';
}

// ---------- 结构化干预评估渲染 ----------
function renderStructuredEvaluation(data) {
  var effectiveness = data.effectiveness || '评估中';
  var score = data.score || 0;
  var isPositive = effectiveness.indexOf('有效') > -1 || effectiveness.indexOf('良好') > -1 || effectiveness.indexOf('优秀') > -1;
  var evalColor = isPositive ? 'var(--green)' : effectiveness.indexOf('无效') > -1 ? 'var(--red)' : 'var(--orange)';

  var stepsHtml = (data.nextSteps || []).map(function(s) {
    return '<li><i class="fa-solid fa-arrow-right"></i> ' + s + '</li>';
  }).join('');

  return '<div class="structured-eval">' +
    '<div class="se-header">' +
      '<div class="se-effectiveness-badge" style="background:' + evalColor + '">' +
        '<i class="fa-solid ' + (isPositive ? 'fa-circle-check' : 'fa-circle-xmark') + '"></i> ' + effectiveness +
      '</div>' +
    '</div>' +
    '<div class="se-score-row">' +
      '<span class="se-score-label">干预评分</span>' +
      '<div class="se-score-bar-wrap">' +
        '<div class="se-score-bar"><div class="se-score-fill" style="width:' + Math.min(100, score) + '%;background:' + evalColor + '"></div></div>' +
        '<span class="se-score-num" style="color:' + evalColor + '">' + score + '</span>' +
      '</div>' +
    '</div>' +
    (stepsHtml ? '<div class="se-section"><h4><i class="fa-solid fa-list-check"></i> 下一步计划</h4><ul class="se-list">' + stepsHtml + '</ul></div>' : '') +
  '</div>';
}
