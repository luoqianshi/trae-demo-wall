/**
 * Mock 数据层 - GoCompete 赛事报名管理系统 Demo
 * 所有数据存储在 localStorage 中，模拟后端持久化
 */

// ============ 默认用户数据 ============
const DEFAULT_USERS = [
  { id: 1, username: 'admin', password: '123456', real_name: '系统管理员', department: '信息中心', phone: '13800138000', email: 'admin@gocompete.cn', role: 'admin', is_active: 1, created_at: '2026-01-15 09:00:00' },
  { id: 2, username: 'committee1', password: '123456', real_name: '张评委', department: '技术部', phone: '13800138001', email: 'zhang@gocompete.cn', role: 'committee', is_active: 1, created_at: '2026-02-01 10:00:00' },
  { id: 3, username: 'committee2', password: '123456', real_name: '李评审', department: '设计部', phone: '13800138002', email: 'li@gocompete.cn', role: 'committee', is_active: 1, created_at: '2026-02-05 14:00:00' },
  { id: 4, username: 'player1', password: '123456', real_name: '王参赛', department: '研发一部', phone: '13800138003', email: 'wang@gocompete.cn', role: 'user', is_active: 1, created_at: '2026-03-01 08:30:00' },
  { id: 5, username: 'player2', password: '123456', real_name: '赵选手', department: '研发二部', phone: '13800138004', email: 'zhao@gocompete.cn', role: 'user', is_active: 1, created_at: '2026-03-02 09:00:00' },
  { id: 6, username: 'player3', password: '123456', real_name: '钱同学', department: '市场部', phone: '13800138005', email: 'qian@gocompete.cn', role: 'user', is_active: 1, created_at: '2026-03-03 11:00:00' },
  { id: 7, username: 'player4', password: '123456', real_name: '孙同事', department: '产品部', phone: '13800138006', email: 'sun@gocompete.cn', role: 'user', is_active: 1, created_at: '2026-03-04 15:00:00' },
];

// ============ 默认赛事数据 ============
function getDefaultContests() {
  const now = Date.now();
  const day = 86400000;
  return [
    {
      id: 1,
      name: '2026年度编程挑战赛',
      type: 'individual',
      reg_start: new Date(now - 5 * day).toISOString().slice(0, 19).replace('T', ' '),
      reg_end: new Date(now + 3 * day).toISOString().slice(0, 19).replace('T', ' '),
      contest_start: new Date(now + 7 * day).toISOString().slice(0, 19).replace('T', ' '),
      contest_end: new Date(now + 8 * day).toISOString().slice(0, 19).replace('T', ' '),
      location: '线上 · 腾讯会议',
      rules: '## 赛事简介\n\n本赛事面向全体研发人员，旨在考察算法设计与编程实践能力。\n\n## 参赛要求\n\n1. 独立完成，不得抄袭\n2. 使用任意编程语言\n3. 提交完整源代码及说明文档\n\n## 评分标准\n\n- 算法正确性 40%\n- 代码质量 30%\n- 文档完整性 30%',
      created_by: 1,
      show_applicant_count: true,
      cover_color: '#0891B2',
      banner_type: 'text',
      banner_text: '2026 编程挑战赛',
      banner_color: '#0891B2',
      committee_ids: [2, 3],
    },
    {
      id: 2,
      name: '创新产品设计大赛',
      type: 'team',
      reg_start: new Date(now - 10 * day).toISOString().slice(0, 19).replace('T', ' '),
      reg_end: new Date(now - 1 * day).toISOString().slice(0, 19).replace('T', ' '),
      contest_start: new Date(now + 2 * day).toISOString().slice(0, 19).replace('T', ' '),
      contest_end: new Date(now + 4 * day).toISOString().slice(0, 19).replace('T', ' '),
      location: '总部大楼 3F 多功能厅',
      rules: '## 赛事简介\n\n面向全体员工的创新产品设计大赛，鼓励跨部门组队。\n\n## 参赛要求\n\n1. 每队 2-5 人\n2. 提交产品设计方案及原型演示\n3. 需包含用户调研、设计稿、原型链接\n\n## 奖项设置\n\n- 一等奖 1 名\n- 二等奖 2 名\n- 最佳创意奖 1 名',
      created_by: 1,
      show_applicant_count: true,
      cover_color: '#7C3AED',
      banner_type: 'text',
      banner_text: '创新产品设计大赛',
      banner_color: '#7C3AED',
      committee_ids: [2],
    },
    {
      id: 3,
      name: '数据可视化挑战赛',
      type: 'individual',
      reg_start: new Date(now + 2 * day).toISOString().slice(0, 19).replace('T', ' '),
      reg_end: new Date(now + 10 * day).toISOString().slice(0, 19).replace('T', ' '),
      contest_start: new Date(now + 15 * day).toISOString().slice(0, 19).replace('T', ' '),
      contest_end: new Date(now + 16 * day).toISOString().slice(0, 19).replace('T', ' '),
      location: '线上',
      rules: '## 赛事简介\n\n数据可视化挑战赛，考察参赛者对数据的理解与可视化表达能力。\n\n## 参赛要求\n\n1. 提交一份完整的数据可视化作品\n2. 使用任意可视化工具或编程库\n3. 附上数据分析报告',
      created_by: 1,
      show_applicant_count: false,
      cover_color: '#059669',
      banner_type: 'text',
      banner_text: '数据可视化挑战赛',
      banner_color: '#059669',
      committee_ids: [3],
    },
    {
      id: 4,
      name: '年度技术分享演讲赛',
      type: 'individual',
      reg_start: new Date(now - 20 * day).toISOString().slice(0, 19).replace('T', ' '),
      reg_end: new Date(now - 15 * day).toISOString().slice(0, 19).replace('T', ' '),
      contest_start: new Date(now - 10 * day).toISOString().slice(0, 19).replace('T', ' '),
      contest_end: new Date(now - 9 * day).toISOString().slice(0, 19).replace('T', ' '),
      location: '总部大楼 5F 报告厅',
      rules: '## 赛事简介\n\n年度技术分享演讲赛，考察技术表达与演讲能力。\n\n## 评分标准\n\n- 内容深度 30%\n- 表达能力 30%\n- 视觉呈现 20%\n- 互动问答 20%',
      created_by: 1,
      show_applicant_count: true,
      cover_color: '#DC2626',
      banner_type: 'text',
      banner_text: '技术分享演讲赛',
      banner_color: '#DC2626',
      committee_ids: [2, 3],
    },
  ];
}

// ============ 默认报名数据 ============
function getDefaultApplications() {
  return [
    {
      id: 1, contest_id: 1, user_id: 4, user_name: '王参赛', user_dept: '研发一部',
      team_name: null, team_members: [],
      description: '使用 Python 实现的高效算法解决方案，包含完整注释和测试用例。',
      status: 'pending',
      reject_reason: null,
      submit_time: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 19).replace('T', ' '),
      files: [
        { name: 'solution.py', size: 15360, type: 'text/plain' },
        { name: '算法说明文档.pdf', size: 256000, type: 'application/pdf' },
      ],
      score: null, rank: null, work_name: null, work_desc: null, work_files: [], work_submit_method: null, work_note: null,
    },
    {
      id: 2, contest_id: 1, user_id: 5, user_name: '赵选手', user_dept: '研发二部',
      team_name: null, team_members: [],
      description: '基于 C++ 的高性能算法实现。',
      status: 'approved',
      reject_reason: null,
      submit_time: new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 19).replace('T', ' '),
      files: [
        { name: 'solution.cpp', size: 10240, type: 'text/plain' },
      ],
      score: 85.5, rank: null, work_name: '高效图搜索算法', work_desc: '基于 BFS 的优化图搜索实现', work_files: [], work_submit_method: 'online', work_note: '',
    },
    {
      id: 3, contest_id: 1, user_id: 6, user_name: '钱同学', user_dept: '市场部',
      team_name: null, team_members: [],
      description: 'Java 实现的算法解答。',
      status: 'rejected',
      reject_reason: '缺少算法说明文档，请补充后重新提交。',
      submit_time: new Date(Date.now() - 4 * 86400000).toISOString().slice(0, 19).replace('T', ' '),
      files: [
        { name: 'solution.java', size: 8192, type: 'text/plain' },
      ],
      score: null, rank: null, work_name: null, work_desc: null, work_files: [], work_submit_method: null, work_note: null,
    },
    {
      id: 4, contest_id: 2, user_id: 4, user_name: '王参赛', user_dept: '研发一部',
      team_name: '创新先锋队', team_members: [
        { name: '王参赛', dept: '研发一部', role: '队长', phone: '13800138003' },
        { name: '赵选手', dept: '研发二部', role: '队员', phone: '13800138004' },
        { name: '钱同学', dept: '市场部', role: '队员', phone: '13800138005' },
      ],
      description: '面向内部员工的智能协作工具设计方案，包含用户调研、交互原型和技术可行性分析。',
      status: 'approved',
      reject_reason: null,
      submit_time: new Date(Date.now() - 8 * 86400000).toISOString().slice(0, 19).replace('T', ' '),
      files: [
        { name: '产品设计方案.pdf', size: 512000, type: 'application/pdf' },
        { name: '原型演示.pptx', size: 1024000, type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' },
      ],
      score: 92, rank: null, work_name: '智能协作工具', work_desc: '一站式团队协作平台', work_files: [], work_submit_method: 'online', work_note: '已完成原型开发',
    },
    {
      id: 5, contest_id: 2, user_id: 7, user_name: '孙同事', user_dept: '产品部',
      team_name: '设计梦想家', team_members: [
        { name: '孙同事', dept: '产品部', role: '队长', phone: '13800138006' },
      ],
      description: '面向 C 端用户的个性化阅读产品设计。',
      status: 'pending',
      reject_reason: null,
      submit_time: new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 19).replace('T', ' '),
      files: [
        { name: '阅读App设计方案.pdf', size: 384000, type: 'application/pdf' },
      ],
      score: null, rank: null, work_name: null, work_desc: null, work_files: [], work_submit_method: null, work_note: null,
    },
    {
      id: 6, contest_id: 4, user_id: 4, user_name: '王参赛', user_dept: '研发一部',
      team_name: null, team_members: [],
      description: '微服务架构下的性能优化实践分享。',
      status: 'approved',
      reject_reason: null,
      submit_time: new Date(Date.now() - 18 * 86400000).toISOString().slice(0, 19).replace('T', ' '),
      files: [],
      score: 88, rank: 1, work_name: '微服务性能优化', work_desc: '从架构到代码的全链路优化', work_files: [], work_submit_method: 'offline', work_note: '现场演讲',
    },
    {
      id: 7, contest_id: 4, user_id: 5, user_name: '赵选手', user_dept: '研发二部',
      team_name: null, team_members: [],
      description: '前端工程化最佳实践。',
      status: 'approved',
      reject_reason: null,
      submit_time: new Date(Date.now() - 17 * 86400000).toISOString().slice(0, 19).replace('T', ' '),
      files: [],
      score: 82, rank: 2, work_name: '前端工程化', work_desc: '从零搭建前端工程化体系', work_files: [], work_submit_method: 'offline', work_note: '现场演讲',
    },
  ];
}

// ============ 默认系统设置 ============
const DEFAULT_SETTINGS = {
  system_name: 'GoCompete',
  file_size_limit: 500,
  file_types: ['pdf', 'doc', 'xls', 'ppt', 'zip', 'video', 'image'],
  enable_notice: true,
  notice_content: '欢迎使用 GoCompete 赛事报名管理系统！请及时关注最新赛事动态。',
};

// ============ 默认公布结果 ============
const DEFAULT_RESULTS = {};

// ============ DB 层 - localStorage 封装 ============
const DB = {
  _getKey(key) {
    return 'gocompete_demo_' + key;
  },
  init() {
    if (!localStorage.getItem(this._getKey('users'))) {
      localStorage.setItem(this._getKey('users'), JSON.stringify(DEFAULT_USERS));
    }
    if (!localStorage.getItem(this._getKey('contests'))) {
      localStorage.setItem(this._getKey('contests'), JSON.stringify(getDefaultContests()));
    }
    if (!localStorage.getItem(this._getKey('applications'))) {
      localStorage.setItem(this._getKey('applications'), JSON.stringify(getDefaultApplications()));
    }
    if (!localStorage.getItem(this._getKey('settings'))) {
      localStorage.setItem(this._getKey('settings'), JSON.stringify(DEFAULT_SETTINGS));
    }
    if (!localStorage.getItem(this._getKey('results'))) {
      localStorage.setItem(this._getKey('results'), JSON.stringify(DEFAULT_RESULTS));
    }
  },
  reset() {
    localStorage.removeItem(this._getKey('users'));
    localStorage.removeItem(this._getKey('contests'));
    localStorage.removeItem(this._getKey('applications'));
    localStorage.removeItem(this._getKey('settings'));
    localStorage.removeItem(this._getKey('results'));
    localStorage.removeItem(this._getKey('token'));
    localStorage.removeItem(this._getKey('current_user'));
    this.init();
  },
  get(key) {
    const val = localStorage.getItem(this._getKey(key));
    return val ? JSON.parse(val) : null;
  },
  set(key, data) {
    localStorage.setItem(this._getKey(key), JSON.stringify(data));
  },
  getUsers() { return this.get('users') || []; },
  setUsers(users) { this.set('users', users); },
  getContests() { return this.get('contests') || []; },
  setContests(contests) { this.set('contests', contests); },
  getApplications() { return this.get('applications') || []; },
  setApplications(apps) { this.set('applications', apps); },
  getSettings() { return this.get('settings') || DEFAULT_SETTINGS; },
  setSettings(settings) { this.set('settings', settings); },
  getResults() { return this.get('results') || {}; },
  setResults(results) { this.set('results', results); },
};

// ============ Mock API 层 ============
const MockAPI = {
  // --- 认证 ---
  login(username, password) {
    const users = DB.getUsers();
    const user = users.find(u => (u.username === username || u.phone === username) && u.password === password && u.is_active === 1);
    if (!user) return { error: '用户名或密码错误，或账号已被禁用' };
    const { password: _, ...userInfo } = user;
    const token = 'mock_token_' + user.id + '_' + Date.now();
    DB.set('token', token);
    DB.set('current_user', userInfo);
    return { token, user: userInfo };
  },
  getInfo() {
    const user = DB.get('current_user');
    if (!user) return { error: '未登录' };
    // 从最新数据中刷新
    const users = DB.getUsers();
    const fresh = users.find(u => u.id === user.id);
    if (fresh) {
      const { password: _, ...info } = fresh;
      DB.set('current_user', info);
      return { user: info };
    }
    return { user };
  },
  logout() {
    DB.set('token', null);
    DB.set('current_user', null);
  },
  register(data) {
    const users = DB.getUsers();
    if (users.find(u => u.username === data.username)) return { error: '用户名已存在' };
    if (users.find(u => u.phone === data.phone)) return { error: '手机号已注册' };
    const newUser = {
      id: Math.max(0, ...users.map(u => u.id)) + 1,
      ...data,
      role: 'user',
      is_active: 1,
      created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
    };
    users.push(newUser);
    DB.setUsers(users);
    const { password: _, ...userInfo } = newUser;
    const token = 'mock_token_' + newUser.id + '_' + Date.now();
    DB.set('token', token);
    DB.set('current_user', userInfo);
    return { token, user: userInfo };
  },
  sendOtp(phone, action) {
    if (!/^1[3-9]\d{9}$/.test(phone)) return { error: '手机号格式不正确' };
    return { success: true, code: '123456' }; // Demo 模式固定验证码
  },
  resetPassword(data) {
    if (data.otp !== '123456') return { error: '验证码错误，Demo 模式验证码为 123456' };
    const users = DB.getUsers();
    const user = users.find(u => u.phone === data.phone);
    if (!user) return { error: '手机号未注册' };
    user.password = data.new_password;
    DB.setUsers(users);
    return { success: true };
  },

  // --- 赛事 ---
  getContests(params = {}) {
    let contests = DB.getContests();
    if (params.type) contests = contests.filter(c => c.type === params.type);
    if (params.search) contests = contests.filter(c => c.name.includes(params.search));
    return { data: contests };
  },
  getContest(id) {
    const contests = DB.getContests();
    const contest = contests.find(c => c.id === parseInt(id));
    return contest ? { data: contest } : { error: '赛事不存在' };
  },
  createContest(data) {
    const contests = DB.getContests();
    const newContest = {
      id: Math.max(0, ...contests.map(c => c.id)) + 1,
      ...data,
      created_by: (DB.get('current_user') || {}).id || 1,
    };
    contests.push(newContest);
    DB.setContests(contests);
    return { data: newContest };
  },
  updateContest(id, data) {
    const contests = DB.getContests();
    const idx = contests.findIndex(c => c.id === parseInt(id));
    if (idx === -1) return { error: '赛事不存在' };
    contests[idx] = { ...contests[idx], ...data };
    DB.setContests(contests);
    return { data: contests[idx] };
  },
  deleteContest(id) {
    let contests = DB.getContests();
    contests = contests.filter(c => c.id !== parseInt(id));
    DB.setContests(contests);
    let apps = DB.getApplications();
    apps = apps.filter(a => a.contest_id !== parseInt(id));
    DB.setApplications(apps);
    return { success: true };
  },
  getApplicantCount(contestId) {
    const apps = DB.getApplications();
    return { data: { count: apps.filter(a => a.contest_id === parseInt(contestId) && a.status !== 'draft').length } };
  },
  getPublishedResults(contestId) {
    const results = DB.getResults();
    return { data: results[contestId] || null };
  },

  // --- 报名 ---
  createApplication(data) {
    const apps = DB.getApplications();
    const user = DB.get('current_user');
    const newApp = {
      id: Math.max(0, ...apps.map(a => a.id)) + 1,
      ...data,
      user_id: user.id,
      user_name: user.real_name,
      user_dept: user.department,
      submit_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
    };
    apps.push(newApp);
    DB.setApplications(apps);
    return { data: newApp };
  },
  getMyApplications() {
    const user = DB.get('current_user');
    if (!user) return { data: [] };
    const apps = DB.getApplications().filter(a => a.user_id === user.id);
    return { data: apps };
  },
  getApplication(id) {
    const apps = DB.getApplications();
    const app = apps.find(a => a.id === parseInt(id));
    return app ? { data: app } : { error: '报名记录不存在' };
  },
  getApplications(params = {}) {
    let apps = DB.getApplications();
    if (params.contest_id) apps = apps.filter(a => a.contest_id === parseInt(params.contest_id));
    if (params.status) apps = apps.filter(a => a.status === params.status);
    if (params.search) {
      apps = apps.filter(a => a.user_name.includes(params.search) || (a.team_name && a.team_name.includes(params.search)));
    }
    return { data: apps };
  },
  updateApplication(id, data) {
    const apps = DB.getApplications();
    const idx = apps.findIndex(a => a.id === parseInt(id));
    if (idx === -1) return { error: '报名记录不存在' };
    apps[idx] = { ...apps[idx], ...data };
    if (data.status === 'pending') {
      apps[idx].submit_time = new Date().toISOString().slice(0, 19).replace('T', ' ');
      apps[idx].reject_reason = null;
    }
    DB.setApplications(apps);
    return { data: apps[idx] };
  },
  deleteApplication(id) {
    let apps = DB.getApplications();
    apps = apps.filter(a => a.id !== parseInt(id));
    DB.setApplications(apps);
    return { success: true };
  },
  updateApplicationStatus(id, data) {
    const apps = DB.getApplications();
    const idx = apps.findIndex(a => a.id === parseInt(id));
    if (idx === -1) return { error: '报名记录不存在' };
    if (data.status) apps[idx].status = data.status;
    if (data.reject_reason !== undefined) apps[idx].reject_reason = data.reject_reason;
    if (data.score !== undefined) {
      apps[idx].score = data.score;
      // 重新计算排名
      const contestApps = apps.filter(a => a.contest_id === apps[idx].contest_id && a.status === 'approved' && a.score !== null);
      contestApps.sort((a, b) => b.score - a.score);
      contestApps.forEach((a, i) => {
        const aIdx = apps.findIndex(x => x.id === a.id);
        apps[aIdx].rank = i + 1;
      });
    }
    DB.setApplications(apps);
    return { data: apps[idx] };
  },
  submitWork(id, data) {
    const apps = DB.getApplications();
    const idx = apps.findIndex(a => a.id === parseInt(id));
    if (idx === -1) return { error: '报名记录不存在' };
    apps[idx] = { ...apps[idx], ...data };
    DB.setApplications(apps);
    return { data: apps[idx] };
  },
  publishResults(contestId, settings) {
    const apps = DB.getApplications().filter(a => a.contest_id === parseInt(contestId) && a.status === 'approved' && a.score !== null);
    apps.sort((a, b) => b.score - a.score);
    const results = DB.getResults();
    results[contestId] = {
      settings,
      list: apps.map((a, i) => ({
        rank: a.rank || (i + 1),
        score: a.score,
        submitter: a.user_name,
        team_name: a.team_name,
        work_name: a.work_name,
        work_desc: a.work_desc,
        work_files: a.work_files,
      })),
    };
    DB.setResults(results);
    return { success: true };
  },

  // --- 用户管理 ---
  getUsers(params = {}) {
    let users = DB.getUsers();
    if (params.role) users = users.filter(u => u.role === params.role);
    if (params.search) users = users.filter(u => u.username.includes(params.search) || u.real_name.includes(params.search));
    return { data: users.map(u => { const { password, ...info } = u; return info; }) };
  },
  createUser(data) {
    const users = DB.getUsers();
    if (users.find(u => u.username === data.username)) return { error: '用户名已存在' };
    const newUser = {
      id: Math.max(0, ...users.map(u => u.id)) + 1,
      ...data,
      is_active: 1,
      created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
    };
    users.push(newUser);
    DB.setUsers(users);
    const { password, ...info } = newUser;
    return { data: info };
  },
  updateUser(id, data) {
    const users = DB.getUsers();
    const idx = users.findIndex(u => u.id === parseInt(id));
    if (idx === -1) return { error: '用户不存在' };
    users[idx] = { ...users[idx], ...data };
    DB.setUsers(users);
    const { password, ...info } = users[idx];
    return { data: info };
  },
  updateMe(data) {
    const user = DB.get('current_user');
    if (!user) return { error: '未登录' };
    const users = DB.getUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx === -1) return { error: '用户不存在' };
    users[idx] = { ...users[idx], ...data };
    DB.setUsers(users);
    const { password, ...info } = users[idx];
    DB.set('current_user', info);
    return { data: info };
  },
  deleteUser(id) {
    const users = DB.getUsers();
    const user = users.find(u => u.id === parseInt(id));
    if (user && user.role === 'admin') return { error: '不能删除管理员账号' };
    DB.setUsers(users.filter(u => u.id !== parseInt(id)));
    return { success: true };
  },

  // --- 系统设置 ---
  getSettings() {
    return { data: DB.getSettings() };
  },
  updateSettings(data) {
    const settings = { ...DB.getSettings(), ...data };
    DB.setSettings(settings);
    return { data: settings };
  },

  // --- 文件上传（模拟） ---
  uploadFile(file, onProgress) {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          resolve({
            name: file.name,
            size: file.size,
            type: file.type || 'application/octet-stream',
          });
        }
        if (onProgress) onProgress(Math.min(progress, 100));
      }, 200);
    });
  },
};

// ============ 工具函数 ============
const Utils = {
  fileTypes: {
    pdf: ['pdf'],
    doc: ['doc', 'docx'],
    xls: ['xls', 'xlsx'],
    ppt: ['ppt', 'pptx'],
    zip: ['zip', 'rar', '7z'],
    video: ['mp4', 'mov', 'avi'],
    image: ['jpg', 'jpeg', 'png', 'gif'],
  },
  getContestStatus(contest) {
    const now = new Date();
    const regStart = new Date(contest.reg_start);
    const regEnd = new Date(contest.reg_end);
    const contestStart = contest.contest_start ? new Date(contest.contest_start) : null;
    const contestEnd = contest.contest_end ? new Date(contest.contest_end) : null;

    if (now < regStart) return { value: 'upcoming', text: '即将开始', type: 'primary' };
    if (now < regEnd) return { value: 'registering', text: '报名中', type: 'success' };
    if (!contestStart || now < contestStart) return { value: 'waiting', text: '待开赛', type: 'warning' };
    if (now < contestEnd) return { value: 'contesting', text: '比赛中', type: 'danger' };
    return { value: 'ended', text: '已结束', type: 'info' };
  },
  getStatusText(status, contest) {
    const map = {
      draft: { text: '草稿', type: 'info' },
      pending: { text: '待审核', type: 'warning' },
      approved: { text: '审核通过', type: 'success' },
      rejected: { text: '已驳回', type: 'danger' },
    };
    if (status === 'pending' && contest) {
      const cs = this.getContestStatus(contest);
      if (cs.value !== 'registering') return { text: '未处理', type: 'info' };
    }
    return map[status] || { text: status, type: 'info' };
  },
  formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  },
  formatDate(dateStr) {
    if (!dateStr) return '待定';
    return dateStr.replace('T', ' ').slice(0, 16);
  },
  roleText(role) {
    return { admin: '管理员', committee: '组委会', user: '参赛者' }[role] || role;
  },
  roleType(role) {
    return { admin: 'danger', committee: 'warning', user: '' }[role] || '';
  },
  typeText(type) {
    return { individual: '个人赛', team: '团体赛' }[type] || type;
  },
  typeTagType(type) {
    return { individual: 'success', team: 'warning' }[type] || '';
  },
  getFileExt(filename) {
    return filename.split('.').pop().toLowerCase();
  },
  isImage(filename) {
    return this.fileTypes.image.includes(this.getFileExt(filename));
  },
  isArchive(filename) {
    const ext = this.getFileExt(filename);
    return ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext);
  },
};

// 初始化
DB.init();
