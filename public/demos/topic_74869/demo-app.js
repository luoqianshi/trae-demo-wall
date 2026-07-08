// ============ 全局状态 ============
let currentPlatform = 'web';
let currentPage = 'dashboard';

// ============ 合并三端页面 + 参赛评审页面 ============
const Pages = {...PagesWeb, ...PagesMini, ...PagesApp, ...PagesReview};

// ============ 渲染侧边栏 ============
function renderSidebar(platform) {
  const sb = document.getElementById('sidebar');
  const menus = Menus[platform];
  sb.innerHTML = menus.map(sec => `
    <div class="nav-section">
      <div class="nav-section-title">${sec.section}</div>
      ${sec.items.map(it => `
        <div class="nav-item" data-page="${it.id}" onclick="goPage('${it.id}')">
          <span class="nav-icon">${it.icon}</span>
          <span>${it.name}</span>
          ${it.badge ? `<span class="nav-badge">${it.badge}</span>` : ''}
        </div>
      `).join('')}
    </div>
  `).join('');
}

// ============ 页面切换 ============
function goPage(id) {
  // 离开当前页面前清理订阅
  Store.cleanupPage(currentPage);
  currentPage = id;
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  const nav = document.querySelector(`[data-page="${id}"]`);
  if (nav) nav.classList.add('active');
  // 特殊页面：流程演示 / 三端协同
  if (id === 'flow-demo') {
    document.getElementById('content').innerHTML = Flow.render();
    document.getElementById('content').scrollTop = 0;
    return;
  }
  if (id === 'collab-demo') {
    document.getElementById('content').innerHTML = Collab.render();
    document.getElementById('content').scrollTop = 0;
    // 默认显示第一个事件
    setTimeout(() => Collab.show(0), 100);
    return;
  }
  const pageFn = Pages[id] || Pages['default'];
  const html = typeof pageFn === 'function' ? pageFn() : pageFn;
  document.getElementById('content').innerHTML = html;
  document.getElementById('content').scrollTop = 0;
}

// ============ 平台切换 ============
document.querySelectorAll('.platform-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.platform-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    currentPlatform = this.dataset.platform;
    renderSidebar(currentPlatform);
    const first = Menus[currentPlatform][0].items[0].id;
    goPage(first);
  });
});

// ============ Toast ============
function toast(msg, type) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show ' + (type || 'success');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}

// ============ 复制文本到剪贴板（兼容回退） ============
function copyText(text) {
  if (!text) return;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => toast('📋 已复制到剪贴板')).catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}
function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); toast('📋 已复制到剪贴板'); } catch (e) { toast('复制失败，请手动选择', 'error'); }
  document.body.removeChild(ta);
}

// ============ 模态框 ============
function showModal(title, body, action, onConfirm) {
  document.getElementById('mTitle').textContent = title;
  document.getElementById('mBody').innerHTML = body;
  document.getElementById('mAction').textContent = action || '确认';
  document.getElementById('modal').classList.add('show');
  window._modalAction = onConfirm || null;
}
function closeModal() {
  document.getElementById('modal').classList.remove('show');
  window._modalAction = null;
}
// 收集 modal 内所有 [name] 元素值组装为对象，传给 onConfirm 回调
function modalConfirm() {
  const mBody = document.getElementById('mBody');
  const formData = {};
  mBody.querySelectorAll('[name]').forEach(el => {
    if (el.type === 'checkbox') formData[el.name] = el.checked;
    else if (el.type === 'number') formData[el.name] = el.value ? Number(el.value) : '';
    else formData[el.name] = el.value;
  });
  if (typeof window._modalAction === 'function') {
    const action = window._modalAction;
    const hasForm = Object.keys(formData).length > 0;
    closeModal();
    action(hasForm ? formData : undefined);
  } else {
    closeModal();
    toast('✅ 操作成功，数据已同步');
  }
}
document.getElementById('modal').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});

// ============ 手机框架辅助函数 ============
function phoneFrame(navTitle, body, activeTab, tabNames) {
  const tabs = tabNames || ['首页', '任务', 'SOS', '我的'];
  const icons = ['🏠', '📋', '🆘', '👤'];
  return `<div class="phone-layout">
    <div class="phone-frame">
      <div class="phone-screen">
        <div class="phone-status"><span>9:41</span><span>📶 📍 🔋</span></div>
        <div class="phone-nav">${navTitle}</div>
        <div class="phone-body">${body}</div>
        <div class="phone-tabbar">
          ${tabs.map((t, i) => `<div class="tab ${i === activeTab ? 'active' : ''}" onclick="toast('${t}')"><div class="tab-icon">${icons[i] || '📋'}</div>${t}</div>`).join('')}
        </div>
      </div>
    </div>
    <div class="phone-desc" id="phone-desc"></div>
  </div>`;
}

function descPanel(title, desc, features) {
  return `<div class="phone-desc">
    <h3>${title}</h3>
    <p>${desc}</p>
    ${features || ''}
  </div>`;
}

// ============ 表单 HTML 片段（所有 input/select/textarea 必须带 name，供 modalConfirm 收集） ============
const Forms = {
  createTask: (data = {}) => `
    <div class="form-group"><label class="form-label">任务名称</label><input class="form-input" name="name" value="${data.name||''}" placeholder="请输入任务名称"></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">任务类型</label><select class="form-select" name="type">${['综合救援','洪水救援','山地搜救','水上救援','医疗救护','物资运送','无人机航拍','火灾救援'].map(o => `<option ${data.type===o?'selected':''}>${o}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">优先级</label><select class="form-select" name="priority">${['urgent','high','normal','low'].map(o => `<option value="${o}" ${data.priority===o?'selected':''}>${{urgent:'紧急',high:'高',normal:'中',low:'低'}[o]}</option>`).join('')}</select></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">负责队伍</label><input class="form-input" name="team" value="${data.team||'待分配'}" placeholder="如：救援一队"></div>
      <div class="form-group"><label class="form-label">队长</label><input class="form-input" name="leader" value="${data.leader||'待分配'}" placeholder="队长姓名"></div>
    </div>
    <div class="form-group"><label class="form-label">任务地点</label><input class="form-input" name="location" value="${data.location||''}" placeholder="请输入地点"></div>
    <div class="form-group"><label class="form-label">任务描述</label><textarea class="form-textarea" name="desc" placeholder="请描述任务情况">${data.desc||''}</textarea></div>
    <div class="form-group"><label class="form-label">需要资源</label><input class="form-input" name="resources" placeholder="如：救援人员10人，冲锋舟1艘"></div>
  `,
  dispatch: () => `
    <p><strong>任务：</strong>运送医疗物资 50 箱至城西安置点</p>
    <p><strong>车辆：</strong>2 台</p>
    <p><strong>预计：</strong>2 小时</p>
    <p style="margin-top:10px"><strong>推荐队伍：</strong></p>
    <ul><li>运输组 A（距离 3km，空闲）</li><li>运输组 B（距离 5km，空闲）</li></ul>
  `,
  borrow: (name) => `
    <div class="form-group"><label class="form-label">装备</label><input class="form-input" value="${name||''}" disabled></div>
    <div class="form-group"><label class="form-label">借用数量</label><input class="form-input" type="number" name="qty" value="1" min="1"></div>
    <div class="form-group"><label class="form-label">借用人</label><input class="form-input" name="borrower" placeholder="借用人姓名"></div>
    <div class="form-group"><label class="form-label">所属队伍</label><input class="form-input" name="team" placeholder="所属队伍"></div>
    <div class="form-group"><label class="form-label">预计归还</label><input class="form-input" type="datetime-local" name="returnAt"></div>
    <div class="form-group"><label class="form-label">用途</label><textarea class="form-textarea" name="purpose" placeholder="请说明用途"></textarea></div>
    <p><strong>须知：</strong>使用后及时归还，损坏主动上报。</p>
  `,
  createSOS: () => `
    <div class="form-group"><label class="form-label">求助类型</label><select class="form-select" name="type"><option>人员落水</option><option>人员迷路</option><option>车辆事故</option><option>自然灾害</option><option>人员被困</option><option>缺物资</option></select></div>
    <div class="form-group"><label class="form-label">紧急程度</label><select class="form-select" name="level"><option value="1">一级紧急</option><option value="2">二级紧急</option><option value="3">三级紧急</option></select></div>
    <div class="form-group"><label class="form-label">地点</label><input class="form-input" name="location" placeholder="详细地址"></div>
    <div class="form-group"><label class="form-label">情况描述</label><textarea class="form-textarea" name="desc" placeholder="请描述紧急情况"></textarea></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">求助人</label><input class="form-input" name="reporter" placeholder="求助人姓名"></div>
      <div class="form-group"><label class="form-label">联系电话</label><input class="form-input" type="tel" name="phone" placeholder="联系电话"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">被困人数</label><input class="form-input" type="number" name="count" value="1" placeholder="人数"></div>
      <div class="form-group"><label class="form-label">对接平台</label><select class="form-select" name="platform"><option>web</option><option>mini</option><option>app</option></select></div>
    </div>
  `,
  audit: () => `
    <div class="form-group"><label class="form-label">审批操作</label><select class="form-select" name="action"><option value="pass">通过</option><option value="reject">驳回</option></select></div>
    <div class="form-group"><label class="form-label">审批意见</label><textarea class="form-textarea" name="comment" placeholder="请输入审批意见"></textarea></div>
  `,
  createTeam: (data = {}) => `
    <div class="form-group"><label class="form-label">队伍名称</label><input class="form-input" name="name" value="${data.name||''}" placeholder="请输入名称"></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">类型</label><select class="form-select" name="type">${['综合救援','山地救援','水上救援','医疗救援','物流运输','无人机','通讯'].map(o => `<option ${data.type===o?'selected':''}>${o}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">等级</label><select class="form-select" name="level">${['甲级','乙级','丙级'].map(o => `<option ${data.level===o?'selected':''}>${o}</option>`).join('')}</select></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">队长</label><input class="form-input" name="leader" value="${data.leader||''}" placeholder="队长姓名"></div>
      <div class="form-group"><label class="form-label">人数</label><input class="form-input" type="number" name="members" value="${data.members||10}" placeholder="总人数"></div>
    </div>
    <div class="form-group"><label class="form-label">驻地</label><input class="form-input" name="location" value="${data.location||'基地'}" placeholder="驻地"></div>
    <div class="form-group"><label class="form-label">描述</label><textarea class="form-textarea" name="desc" placeholder="请描述职责">${data.desc||''}</textarea></div>
  `,
  createTraining: (data = {}) => `
    <div class="form-group"><label class="form-label">培训名称</label><input class="form-input" name="name" value="${data.name||''}" placeholder="请输入名称"></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">类型</label><select class="form-select" name="type">${['技能培训','证书培训','安全培训'].map(o => `<option ${data.type===o?'selected':''}>${o}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">容量</label><input class="form-input" type="number" name="capacity" value="${data.capacity||30}" placeholder="最大人数"></div>
    </div>
    <div class="form-group"><label class="form-label">讲师</label><input class="form-input" name="trainer" value="${data.trainer||''}" placeholder="讲师姓名"></div>
    <div class="form-group"><label class="form-label">时间</label><input class="form-input" type="datetime-local" name="time" value="${data.time||''}"></div>
    <div class="form-group"><label class="form-label">地点</label><input class="form-input" name="location" value="${data.location||''}" placeholder="请输入地点"></div>
  `,
  addEquip: (data = {}) => `
    <div class="form-group"><label class="form-label">装备名称</label><input class="form-input" name="name" value="${data.name||''}" placeholder="请输入名称"></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">类别</label><select class="form-select" name="category">${['防护类','通讯类','医疗类','工具类','特种装备'].map(o => `<option ${data.category===o?'selected':''}>${o}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">数量</label><input class="form-input" type="number" name="total" value="${data.total||1}" placeholder="数量"></div>
    </div>
    <div class="form-group"><label class="form-label">型号</label><input class="form-input" name="model" value="${data.model||''}" placeholder="请输入型号"></div>
    <div class="form-group"><label class="form-label">存放位置</label><input class="form-input" name="location" value="${data.location||'装备库A'}" placeholder="存放位置"></div>
    <div class="form-group"><label class="form-label">归属</label><input class="form-input" name="owner" value="${data.owner||'共用'}" placeholder="归属队伍"></div>
  `,
  createLogistics: (data = {}) => `
    <div class="form-group"><label class="form-label">物资类型</label><select class="form-select" name="type">${['应急物资','医疗物资','装备物资'].map(o => `<option ${data.type===o?'selected':''}>${o}</option>`).join('')}</select></div>
    <div class="form-group"><label class="form-label">物资清单</label><textarea class="form-textarea" name="goods" placeholder="请列出清单">${data.goods||''}</textarea></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">数量</label><input class="form-input" type="number" name="count" value="${data.count||1}" placeholder="数量"></div>
      <div class="form-group"><label class="form-label">车辆</label><input class="form-input" name="vehicle" value="${data.vehicle||'货车1台'}" placeholder="车辆配置"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">出发地</label><input class="form-input" name="from" value="${data.from||''}" placeholder="出发地"></div>
      <div class="form-group"><label class="form-label">目的地</label><input class="form-input" name="to" value="${data.to||''}" placeholder="目的地"></div>
    </div>
    <div class="form-group"><label class="form-label">司机</label><input class="form-input" name="driver" value="${data.driver||''}" placeholder="司机姓名"></div>
  `,
  publish: () => `
    <div class="form-group"><label class="form-label">公告标题</label><input class="form-input" name="title" placeholder="请输入标题"></div>
    <div class="form-group"><label class="form-label">分类</label><select class="form-select" name="type"><option>通知</option><option>预警</option><option>新闻</option><option>审批</option><option>任务</option></select></div>
    <div class="form-group"><label class="form-label">优先级</label><select class="form-select" name="priority"><option value="urgent">紧急</option><option value="high">高</option><option value="normal" selected>中</option></select></div>
    <div class="form-group"><label class="form-label">内容</label><textarea class="form-textarea" name="content" placeholder="请输入公告内容"></textarea></div>
    <div class="form-group"><label><input type="checkbox" name="pinned"> 置顶</label></div>
  `,
  export: () => `
    <div class="form-group"><label class="form-label">报表类型</label><select class="form-select" name="type"><option>考勤报表</option><option>任务报表</option><option>队伍报表</option><option>装备报表</option><option>培训报表</option></select></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">开始日期</label><input class="form-input" type="date" name="startDate"></div>
      <div class="form-group"><label class="form-label">结束日期</label><input class="form-input" type="date" name="endDate"></div>
    </div>
    <div class="form-group"><label class="form-label">格式</label><select class="form-select" name="format"><option>Excel</option><option>PDF</option><option>CSV</option></select></div>
  `,
  bindDevice: () => `
    <div class="form-group"><label class="form-label">设备类型</label><select class="form-select" name="type"><option>无人机</option><option>IoT 传感器</option><option>报警源</option></select></div>
    <div class="form-group"><label class="form-label">设备编号</label><input class="form-input" name="id" placeholder="设备序列号"></div>
    <div class="form-group"><label class="form-label">设备名称</label><input class="form-input" name="name" placeholder="自定义名称"></div>
    <div class="form-group"><label class="form-label">型号</label><input class="form-input" name="model" placeholder="设备型号"></div>
  `,
  call: (num) => `
    <p style="text-align:center;font-size:48px;margin:20px 0">📞</p>
    <p style="text-align:center;font-size:24px;font-weight:700;color:var(--text)">${num || '请输入号码'}</p>
    <p style="text-align:center;color:var(--text2);margin-top:8px">正在呼叫...</p>
    <div style="display:flex;gap:8px;justify-content:center;margin-top:20px">
      <button class="btn btn-success" onclick="toast('通话接通')">📞 接通</button>
      <button class="btn btn-danger" onclick="closeModal()">📵 挂断</button>
    </div>
  `,
  report: () => `
    <div class="form-group"><label class="form-label">事件类型</label><select class="form-select"><option>洪涝</option><option>地震</option><option>火灾</option><option>交通事故</option></select></div>
    <div class="form-group"><label class="form-label">紧急程度</label><select class="form-select"><option>critical</option><option>high</option><option>normal</option></select></div>
    <div class="form-group"><label class="form-label">对接单位</label><select class="form-select"><option>110 指挥中心</option><option>119 消防</option><option>120 急救</option><option>应急管理局</option></select></div>
    <div class="form-group"><label class="form-label">事件描述</label><textarea class="form-textarea" placeholder="请描述事件情况"></textarea></div>
  `,
  volunteer: () => `
    <div class="form-row">
      <div class="form-group"><label class="form-label">姓名</label><input class="form-input" placeholder="姓名"></div>
      <div class="form-group"><label class="form-label">性别</label><select class="form-select"><option>男</option><option>女</option></select></div>
    </div>
    <div class="form-group"><label class="form-label">手机号</label><input class="form-input" placeholder="手机号"></div>
    <div class="form-group"><label class="form-label">身份证号</label><input class="form-input" placeholder="身份证号"></div>
    <div class="form-group"><label class="form-label">申请理由</label><textarea class="form-textarea" placeholder="请说明申请理由"></textarea></div>
  `,
};

// ============ 详情 HTML 片段 ============
const Details = {
  flood: () => `
    <p><strong>状态：</strong>紧急执行中</p>
    <p><strong>发布：</strong>2026-07-04 14:30</p>
    <p><strong>地点：</strong>城南街道低洼区域</p>
    <p><strong>描述：</strong>连续暴雨导致积水严重，约 200 名居民需转移。</p>
    <p><strong>资源：</strong>救援人员 15 人、冲锋舟 2 艘、救生衣 50 件</p>
    <p style="margin-top:10px"><strong>时间线：</strong></p>
    <div class="timeline">
      <div class="timeline-item done"><div class="timeline-time">14:30</div><div class="timeline-content">任务创建</div></div>
      <div class="timeline-item done"><div class="timeline-time">14:35</div><div class="timeline-content">救援一队接受</div></div>
      <div class="timeline-item done"><div class="timeline-time">14:50</div><div class="timeline-content">到达现场</div></div>
      <div class="timeline-item"><div class="timeline-time">16:00</div><div class="timeline-content">已转移 120 人 (60%)</div></div>
    </div>
  `,
  mountain: () => `
    <p><strong>状态：</strong>进行中</p>
    <p><strong>发布：</strong>2026-07-04 15:10</p>
    <p><strong>地点：</strong>北山风景区</p>
    <p><strong>描述：</strong>3 名驴友迷路，手机信号微弱。</p>
    <p><strong>已派：</strong>救援人员 8 人、搜救犬 2 只、无人机 1 架</p>
    <p style="margin-top:10px"><strong>进展：</strong>已执行 2 小时，无人机发现疑似目标。</p>
  `,
  task: () => `
    <p><strong>任务编号：</strong>TSK-20260704-001</p>
    <p><strong>状态：</strong>进行中</p>
    <p><strong>类型：</strong>综合救援</p>
    <p><strong>优先级：</strong>紧急</p>
    <p><strong>负责队伍：</strong>救援一队</p>
    <p><strong>负责人：</strong>张队长</p>
    <p><strong>地点：</strong>城南街道</p>
    <p><strong>需要资源：</strong>15 人、冲锋舟 2 艘、救生衣 50 件</p>
    <p style="margin-top:10px"><strong>执行记录：</strong></p>
    <div class="timeline">
      <div class="timeline-item done"><div class="timeline-time">14:30</div><div class="timeline-content">创建任务</div></div>
      <div class="timeline-item done"><div class="timeline-time">14:35</div><div class="timeline-content">指派救援一队</div></div>
      <div class="timeline-item done"><div class="timeline-time">14:40</div><div class="timeline-content">救援一队接受</div></div>
      <div class="timeline-item done"><div class="timeline-time">14:50</div><div class="timeline-content">到达现场开始执行</div></div>
      <div class="timeline-item"><div class="timeline-time">16:00</div><div class="timeline-content">进度更新 60%</div></div>
    </div>
  `,
  sos: () => `
    <p><strong>求助编号：</strong>SOS-20260704-001</p>
    <p><strong>时间：</strong>2026-07-04 16:20</p>
    <p><strong>地点：</strong>城南河道</p>
    <p><strong>求助人：</strong>刘先生</p>
    <p><strong>电话：</strong>138****1234</p>
    <p><strong>紧急情况：</strong>1 人落水，水流湍急</p>
    <p><strong>状态：</strong>待响应</p>
    <p style="margin-top:10px"><strong>处理建议：</strong></p>
    <ul><li>立即派遣附近救援队伍</li><li>准备救生设备</li><li>联系 120 急救</li><li>更新 GIS 态势图</li></ul>
    <p><strong>预计到达：</strong>15 分钟</p>
  `,
};

// ============ 初始化 ============
renderSidebar('web');
// 默认进入作品总览页（让评审第一眼看到全貌，呼应4大评分维度）
goPage('overview');
// 启动实时数据更新
startLiveUpdate();

// ============ Dashboard 刷新 ============
function dashboardRefresh() {
  if (currentPage === 'dashboard') goPage('dashboard');
  toast('🔄 已刷新实时数据');
}

// ============ 详情抽屉（复用 detail-drawer CSS） ============
const Drawer = {
  open(title, bodyHtml, actionsHtml) {
    let drawer = document.getElementById('detailDrawer');
    if (!drawer) {
      drawer = document.createElement('div');
      drawer.id = 'detailDrawer';
      drawer.className = 'detail-drawer';
      document.body.appendChild(drawer);
    }
    drawer.innerHTML = `
      <div class="detail-header">
        <span id="drawerTitle" style="font-weight:700;font-size:16px">${title}</span>
        <button class="modal-close" onclick="Drawer.close()">✕</button>
      </div>
      <div class="detail-body" id="drawerBody">${bodyHtml || ''}</div>
      ${actionsHtml ? `<div style="padding:12px 20px;border-top:1px solid var(--border);display:flex;gap:8px;flex-wrap:wrap;background:var(--card);position:sticky;bottom:0">${actionsHtml}</div>` : ''}
    `;
    drawer.classList.add('show');
  },
  close() {
    const drawer = document.getElementById('detailDrawer');
    if (drawer) drawer.classList.remove('show');
  },
  loading() {
    const body = document.getElementById('drawerBody');
    if (body) body.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text2)">⏳ 加载中...</div>';
  },
};

// ============ 确认弹窗（复用 modal，支持 danger 风格） ============
function Confirm(msg, onOk, opts = {}) {
  const dangerStyle = opts.danger ? 'color:var(--danger);font-weight:700' : '';
  showModal(
    opts.title || '⚠️ 确认操作',
    `<div style="font-size:14px;line-height:1.8;${dangerStyle}">${msg}</div>`,
    opts.danger ? '确认删除' : '确认',
    () => { if (onOk) onOk(); }
  );
  if (opts.danger) {
    document.getElementById('mAction').className = 'btn btn-danger';
  }
}

// ============ 搜索工具 ============
const Search = {
  _timers: {},
  bind(inputSelector, onSearch, debounceMs = 300) {
    const el = document.querySelector(inputSelector);
    if (!el) return;
    el.addEventListener('input', () => {
      const key = inputSelector;
      clearTimeout(this._timers[key]);
      this._timers[key] = setTimeout(() => onSearch(el.value), debounceMs);
    });
  },
  highlight(text, keyword) {
    if (!keyword || !text) return text || '';
    const kw = String(keyword).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return String(text).replace(new RegExp(kw, 'gi'), m => `<mark style="background:var(--accent);color:#000;padding:0 2px;border-radius:2px">${m}</mark>`);
  },
};

// ============ 筛选栏工具 ============
const FilterBar = {
  create(opts, onChange) {
    return opts.map(o => `
      <button class="filter-btn ${o.active ? 'active' : ''}" data-filter="${o.value}" onclick="FilterBar.select(this, '${o.value}', () => onChange('${o.value}'))">${o.label}</button>
    `).join('');
  },
  select(btn, value, onChange) {
    btn.parentNode.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    if (onChange) onChange(value);
  },
};

// ============ 表格工具 ============
const Table = {
  rowClickable(rowEl, onClick) {
    rowEl.classList.add('clickable');
    rowEl.addEventListener('click', (e) => {
      if (e.target.closest('button') || e.target.closest('a')) return;
      onClick(e);
    });
  },
  batchBar(selectedIds, actions) {
    if (!selectedIds || selectedIds.length === 0) return '';
    return `<div style="background:var(--card);border:1px solid var(--primary-light);border-radius:10px;padding:10px 14px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap">
      <span style="font-size:13px;color:var(--primary-light);font-weight:600">已选 ${selectedIds.length} 项</span>
      ${actions.map(a => `<button class="btn ${a.class || 'btn-secondary'} btn-sm" onclick="${a.onclick}">${a.label}</button>`).join('')}
    </div>`;
  },
};

// ============ 键盘快捷键 ============
const Shortcut = {
  bind(map) {
    document.addEventListener('keydown', (e) => {
      // 输入框中不触发（除 Esc）
      const inInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName);
      if (inInput && e.key !== 'Escape') return;
      const key = e.key === '/' ? 'slash' : e.key === 'Escape' ? 'esc' : e.key.toLowerCase();
      const action = map[key];
      if (action && typeof window[action] === 'function') {
        e.preventDefault();
        window[action]();
      }
    });
  },
};

// 启用全局快捷键
Shortcut.bind({n: 'shortcutCreate', slash: 'shortcutSearch', esc: 'shortcutEsc'});
function shortcutCreate() {
  // 各页面 View 若有 create 方法则调用
  const views = ['TaskView','SosView','EquipmentView','TeamView','TrainingView','MessageView','LogisticsView'];
  const view = views.find(v => window[v] && currentPage && (window[v].pageId === currentPage));
  if (view && window[view].create) window[view].create();
  else toast('💡 当前页面无新建功能');
}
function shortcutSearch() {
  const searchInput = document.querySelector('input[data-search="true"]');
  if (searchInput) searchInput.focus();
  else toast('💡 当前页面无搜索');
}
function shortcutEsc() {
  const drawer = document.getElementById('detailDrawer');
  if (drawer && drawer.classList.contains('show')) { Drawer.close(); return; }
  const modal = document.getElementById('modal');
  if (modal && modal.classList.contains('show')) { closeModal(); return; }
}
