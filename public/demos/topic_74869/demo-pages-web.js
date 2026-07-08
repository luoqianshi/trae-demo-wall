// ============ Web 管理后台页面（17 个） ============

// ---------- 任务视图（交互式，对象式 View） ----------
const TaskView = {
  pageId: 'task',
  filter: 'all',
  typeFilter: 'all',
  keyword: '',
  selectedIds: [],
  render() {
    const s = Store.stats();
    this._subscribe();
    return `
    <div class="page-header">
      <div>
        <div class="page-title">📋 任务管理</div>
        <div class="page-subtitle">任务全生命周期 · 数据实时联动 · 点击行查看详情 · 快捷键 n=新建 /=搜索</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary btn-sm" onclick="TaskView.exportList()">📥 导出</button>
        <button class="btn btn-danger btn-sm" onclick="TaskView.batchComplete()">✅ 批量完成</button>
        <button class="btn btn-primary btn-sm" onclick="TaskView.create()">➕ 创建任务</button>
      </div>
    </div>
    <div class="stats-grid">
      <div class="stat-card" onclick="TaskView.setFilter('all')" style="cursor:pointer"><div class="stat-label">全部任务</div><div class="stat-value">${DB.tasks.length}</div><div class="stat-trend">点击查看全部</div></div>
      <div class="stat-card warning" onclick="TaskView.setFilter('progress')" style="cursor:pointer"><div class="stat-label">进行中</div><div class="stat-value">${s.tasksProgress}</div><div class="stat-trend trend-warn">点击筛选</div></div>
      <div class="stat-card danger" onclick="TaskView.setFilter('pending')" style="cursor:pointer"><div class="stat-label">待派发</div><div class="stat-value">${s.tasksPending}</div><div class="stat-trend trend-down">需立即处置</div></div>
      <div class="stat-card success" onclick="TaskView.setFilter('done')" style="cursor:pointer"><div class="stat-label">已完成</div><div class="stat-value">${s.tasksDone}</div><div class="stat-trend trend-up">今日累计</div></div>
    </div>
    <div class="filters">
      <span style="font-size:12px;color:var(--text2)">状态：</span>
      ${['all','pending','progress','done'].map(f => `<button class="filter-btn ${this.filter===f?'active':''}" onclick="TaskView.setFilter('${f}')">${{all:'全部',pending:'待派发',progress:'进行中',done:'已完成'}[f]}</button>`).join('')}
      <span style="margin-left:10px;font-size:12px;color:var(--text2)">类型：</span>
      <button class="filter-btn ${this.typeFilter==='all'?'active':''}" onclick="TaskView.setType('all')">全部</button>
      ${['洪水救援','山地搜救','水上救援','医疗救护','物资运送','无人机航拍','火灾救援'].map(t => `<button class="filter-btn ${this.typeFilter===t?'active':''}" onclick="TaskView.setType('${t}')">${t}</button>`).join('')}
    </div>
    <div style="display:flex;gap:8px;align-items:center;margin-bottom:10px">
      <input class="form-input" data-search="true" style="max-width:300px" placeholder="🔍 搜索任务（名称/编号/队伍/地点）" value="${this.keyword}" oninput="TaskView.setKeyword(this.value)">
      <span style="font-size:12px;color:var(--text3)" id="taskCount">${this._getList().length} 条</span>
      <button class="btn btn-secondary btn-xs" onclick="TaskView.clearFilter()">清除筛选</button>
    </div>
    <div id="taskTable">${this.renderTable()}</div>
    <div class="card" style="margin-top:14px">
      <div style="font-weight:700;font-size:15px;margin-bottom:10px">🔄 任务流转流程（点击节点筛选）</div>
      <div class="flow-container" style="margin-bottom:0">
        <div class="flow-steps">
          <div class="flow-node" style="cursor:pointer" onclick="TaskView.setFilter('pending')"><div class="flow-node-title">📌 待派发</div><div class="flow-node-desc">${s.tasksPending} 个</div></div>
          <div class="flow-arrow">→</div>
          <div class="flow-node" style="cursor:pointer" onclick="TaskView.setFilter('progress')"><div class="flow-node-title">⚡ 进行中</div><div class="flow-node-desc">${s.tasksProgress} 个</div></div>
          <div class="flow-arrow">→</div>
          <div class="flow-node" style="cursor:pointer" onclick="TaskView.setFilter('done')"><div class="flow-node-title">✅ 已完成</div><div class="flow-node-desc">${s.tasksDone} 个</div></div>
        </div>
      </div>
    </div>`;
  },
  _getList() {
    let list = DB.tasks.slice();
    if (this.filter !== 'all') list = list.filter(t => t.status === this.filter);
    if (this.typeFilter !== 'all') list = list.filter(t => t.type === this.typeFilter);
    if (this.keyword) list = Store.search('tasks', this.keyword, ['id','name','team','leader','location','type']);
    return list;
  },
  renderTable() {
    const list = this._getList();
    if (list.length === 0) return `<div class="card" style="text-align:center;padding:40px;color:var(--text2)">📭 暂无符合条件的任务</div>`;
    return `<div class="table-wrap">
      <table>
        <thead><tr><th><input type="checkbox" onchange="TaskView.toggleAll(this.checked)"></th><th>任务编号</th><th>名称</th><th>类型</th><th>优先级</th><th>负责队伍</th><th>状态</th><th>进度</th><th>操作</th></tr></thead>
        <tbody>
          ${list.map(t => `<tr class="clickable" onclick="TaskView.detail('${t.id}')">
            <td onclick="event.stopPropagation()"><input type="checkbox" data-id="${t.id}" ${this.selectedIds.includes(t.id)?'checked':''} onchange="TaskView.toggleSelect('${t.id}', this.checked)"></td>
            <td style="font-family:monospace;font-size:11px;color:var(--accent)">${Search.highlight(t.id, this.keyword)}</td>
            <td><strong>${Search.highlight(t.name, this.keyword)}</strong></td>
            <td>${t.type}</td>
            <td>${statusBadge(t.priority)}</td>
            <td>${Search.highlight(t.team, this.keyword)}<div style="font-size:10px;color:var(--text3)">${t.leader} · ${t.members}人</div></td>
            <td>${statusBadge(t.status)}</td>
            <td><div class="progress-bar" style="width:80px"><div class="progress-fill ${t.progress<30?'danger':''}" style="width:${t.progress}%"></div></div><div style="font-size:10px;color:var(--text2);margin-top:2px">${t.progress}%</div></td>
            <td onclick="event.stopPropagation()">
              ${t.status === 'pending' ? `<button class="btn btn-warning btn-xs" onclick="TaskView.dispatch('${t.id}')">派发</button>` : ''}
              ${t.status === 'progress' ? `<button class="btn btn-success btn-xs" onclick="TaskView.complete('${t.id}')">完成</button>` : ''}
              <button class="btn btn-secondary btn-xs" onclick="TaskView.detail('${t.id}')">详情</button>
              <button class="btn btn-secondary btn-xs" onclick="TaskView.edit('${t.id}')">编辑</button>
              <button class="btn btn-danger btn-xs" onclick="TaskView.remove('${t.id}')">删除</button>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
  },
  setFilter(f) { this.filter = f; this.refresh(); },
  setType(t) { this.typeFilter = t; this.refresh(); },
  setKeyword(kw) { this.keyword = kw; this.refresh(); },
  clearFilter() { this.filter='all'; this.typeFilter='all'; this.keyword=''; this.refresh(); },
  toggleSelect(id, checked) {
    if (checked && !this.selectedIds.includes(id)) this.selectedIds.push(id);
    if (!checked) this.selectedIds = this.selectedIds.filter(x => x !== id);
  },
  toggleAll(checked) {
    this.selectedIds = checked ? this._getList().map(t => t.id) : [];
    this.refresh();
  },
  refresh() {
    const el = document.getElementById('content');
    if (el && currentPage === 'task') el.innerHTML = this.render();
  },
  detail(id) {
    const t = Store.get('tasks', id);
    if (!t) return;
    const actions = [
      `<button class="btn btn-secondary btn-sm" onclick="Drawer.close()">关闭</button>`,
      `<button class="btn btn-primary btn-sm" onclick="TaskView.edit('${t.id}')">✏️ 编辑</button>`,
    ];
    if (t.status === 'pending') actions.push(`<button class="btn btn-warning btn-sm" onclick="TaskView.dispatch('${t.id}')">🚀 派发</button>`);
    if (t.status === 'progress') actions.push(`<button class="btn btn-success btn-sm" onclick="TaskView.complete('${t.id}')">✅ 完成</button>`);
    actions.push(`<button class="btn btn-danger btn-sm" onclick="TaskView.remove('${t.id}')">🗑️ 删除</button>`);
    Drawer.open(`📋 ${t.name}`, `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 14px;font-size:13px;margin-bottom:14px">
        <div><span style="color:var(--text2)">编号：</span><span style="font-family:monospace;color:var(--accent)">${t.id}</span></div>
        <div><span style="color:var(--text2)">类型：</span>${t.type}</div>
        <div><span style="color:var(--text2)">优先级：</span>${statusBadge(t.priority)}</div>
        <div><span style="color:var(--text2)">状态：</span>${statusBadge(t.status)}</div>
        <div><span style="color:var(--text2)">负责队伍：</span>${t.team}</div>
        <div><span style="color:var(--text2)">队长：</span>${t.leader}</div>
        <div><span style="color:var(--text2)">人数：</span>${t.members} 人</div>
        <div><span style="color:var(--text2)">创建时间：</span>${t.createdAt}</div>
        <div style="grid-column:span 2"><span style="color:var(--text2)">地点：</span>${t.location}</div>
        <div style="grid-column:span 2"><span style="color:var(--text2)">描述：</span>${t.desc}</div>
      </div>
      <div style="margin-top:10px">
        <div style="font-size:12px;color:var(--text2);margin-bottom:6px">完成进度：${t.progress}%</div>
        <div class="progress-bar" style="height:10px"><div class="progress-fill" style="width:${t.progress}%"></div></div>
      </div>
      <div style="margin-top:14px;padding:10px;background:var(--bg2);border-radius:8px">
        <div style="font-size:12px;font-weight:600;margin-bottom:6px">📍 时间线</div>
        <div class="timeline">
          <div class="timeline-item done"><div class="timeline-time">${t.createdAt}</div><div class="timeline-content">任务创建</div></div>
          ${t.status !== 'pending' ? `<div class="timeline-item done"><div class="timeline-time">+5min</div><div class="timeline-content">已派发至 ${t.team}</div></div>` : ''}
          ${t.status === 'progress' || t.status === 'done' ? `<div class="timeline-item done"><div class="timeline-time">+15min</div><div class="timeline-content">队伍接受任务</div></div>` : ''}
          ${t.status === 'progress' || t.status === 'done' ? `<div class="timeline-item done"><div class="timeline-time">+30min</div><div class="timeline-content">到达现场开始处置</div></div>` : ''}
          ${t.status === 'done' ? `<div class="timeline-item done"><div class="timeline-time">完成</div><div class="timeline-content">任务完成</div></div>` : `<div class="timeline-item"><div class="timeline-time">进行中</div><div class="timeline-content">实时进展 ${t.progress}%</div></div>`}
        </div>
      </div>`, actions.join(' '));
  },
  dispatch(id) {
    Store.updateTaskStatus(id, 'progress', 5);
    Store.logCrossEvent('web', 'dispatch', 'tasks', Store.get('tasks', id));
    toast(`✅ 任务 ${id} 已派发，队伍已接受`);
    Drawer.close();
    this.refresh();
  },
  complete(id) {
    Store.updateTaskStatus(id, 'done');
    Store.logCrossEvent('web', 'complete', 'tasks', Store.get('tasks', id));
    toast(`🎉 任务 ${id} 已完成`);
    Drawer.close();
    this.refresh();
  },
  create() {
    showModal('创建应急任务', Forms.createTask(), '下发任务', (formData) => {
      if (!formData || !formData.name) { toast('⚠️ 请输入任务名称', 'error'); return; }
      const t = Store.add('tasks', {
        name: formData.name,
        type: formData.type || '综合救援',
        priority: formData.priority || 'high',
        team: formData.team || '待分配',
        leader: formData.leader || '待分配',
        members: 0, progress: 0, status: 'pending',
        location: formData.location || '待填写',
        desc: formData.desc || formData.resources || '指挥中心新建任务',
      }, {idPrefix: 'TSK-20260704-'});
      Store.logCrossEvent('web', 'add', 'tasks', t);
      toast(`✅ 任务已创建：${t.id}`);
      this.refresh();
    });
  },
  edit(id) {
    const t = Store.get('tasks', id);
    if (!t) return;
    showModal(`编辑任务 - ${t.id}`, Forms.createTask(t), '保存修改', (formData) => {
      if (!formData || !formData.name) { toast('⚠️ 请输入任务名称', 'error'); return; }
      Store.update('tasks', id, {
        name: formData.name, type: formData.type, priority: formData.priority,
        team: formData.team, leader: formData.leader,
        location: formData.location, desc: formData.desc,
      });
      Store.logCrossEvent('web', 'update', 'tasks', Store.get('tasks', id));
      toast(`✅ 任务 ${id} 已更新`);
      Drawer.close();
      this.refresh();
    });
  },
  remove(id) {
    Confirm(`确定删除任务 <strong style="color:var(--accent)">${id}</strong>？此操作不可恢复。`, () => {
      Store.remove('tasks', id);
      Store.logCrossEvent('web', 'remove', 'tasks', {id});
      toast(`🗑️ 任务 ${id} 已删除`);
      Drawer.close();
      this.refresh();
    }, {danger: true, title: '⚠️ 删除任务'});
  },
  batchComplete() {
    if (this.selectedIds.length === 0) { toast('⚠️ 请先勾选任务', 'error'); return; }
    Confirm(`确定批量完成 <strong>${this.selectedIds.length}</strong> 个任务？`, () => {
      this.selectedIds.forEach(id => Store.updateTaskStatus(id, 'done'));
      toast(`✅ 已批量完成 ${this.selectedIds.length} 个任务`);
      this.selectedIds = [];
      this.refresh();
    });
  },
  exportList() {
    toast(`📥 已导出 ${this._getList().length} 条任务为 Excel`);
  },
  _subscribe() {
    Store.subscribePage('task', ['tasks:add','tasks:update','tasks:remove','global:change','task:update'], () => {
      if (currentPage === 'task') this.refresh();
    });
  },
  _cleanup() { Store.cleanupPage('task'); },
};

// ---------- SOS 视图（交互式，对象式 View） ----------
const SosView = {
  pageId: 'sos',
  filter: 'all',
  keyword: '',
  render() {
    const s = Store.stats();
    this._subscribe();
    return `
    <div class="page-header">
      <div>
        <div class="page-title">🆘 SOS 求助管理</div>
        <div class="page-subtitle">市民紧急求助 · 实时处置 · 联动三端 · 快捷键 n=新建 /=搜索</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-danger btn-sm" onclick="SosView.batchAccept()">🚨 一键响应</button>
        <button class="btn btn-primary btn-sm" onclick="SosView.create()">➕ 录入求助</button>
        <button class="btn btn-secondary btn-sm" onclick="goPage('flow-demo')">🎯 完整流程</button>
      </div>
    </div>
    <div class="stats-grid">
      <div class="stat-card danger" onclick="SosView.setFilter('pending')" style="cursor:pointer"><div class="stat-label">待响应</div><div class="stat-value">${s.sosPending}</div><div class="stat-trend trend-down">需立即处置</div></div>
      <div class="stat-card warning" onclick="SosView.setFilter('progress')" style="cursor:pointer"><div class="stat-label">处置中</div><div class="stat-value">${s.sosProgress}</div><div class="stat-trend trend-warn">救援进行中</div></div>
      <div class="stat-card success" onclick="SosView.setFilter('done')" style="cursor:pointer"><div class="stat-label">已解决</div><div class="stat-value">${DB.sos.filter(x=>x.status==='done').length}</div><div class="stat-trend trend-up">今日累计</div></div>
      <div class="stat-card purple"><div class="stat-label">平均响应</div><div class="stat-value">4.2</div><div class="stat-trend">分钟</div></div>
    </div>
    <div class="grid grid-2">
      <div>
        <div class="filters">
          <button class="filter-btn ${this.filter==='all'?'active':''}" onclick="SosView.setFilter('all')">全部</button>
          <button class="filter-btn ${this.filter==='pending'?'active':''}" onclick="SosView.setFilter('pending')">待响应</button>
          <button class="filter-btn ${this.filter==='progress'?'active':''}" onclick="SosView.setFilter('progress')">处置中</button>
          <button class="filter-btn ${this.filter==='done'?'active':''}" onclick="SosView.setFilter('done')">已解决</button>
        </div>
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:10px">
          <input class="form-input" data-search="true" style="max-width:260px" placeholder="🔍 搜索 SOS（类型/求助人/地点）" value="${this.keyword}" oninput="SosView.setKeyword(this.value)">
          <span style="font-size:12px;color:var(--text3)">${this._getList().length} 条</span>
          <button class="btn btn-secondary btn-xs" onclick="SosView.clearFilter()">清除</button>
        </div>
        <div id="sosList">${this.renderList()}</div>
      </div>
      <div class="card">
        <div style="font-weight:700;font-size:15px;margin-bottom:12px">🗺️ SOS 位置分布（点击查看详情）</div>
        <div class="map-box" style="height:380px">
          <div class="map-bg"></div>
          <div class="map-grid"></div>
          ${DB.sos.map((s, i) => {
            const top = 20 + (i * 18) % 60;
            const left = 20 + (i * 25) % 60;
            const marker = s.status === 'pending' ? 'm-sos' : s.status === 'progress' ? 'm-task' : 'm-shelter';
            return `<div class="map-marker ${marker}" style="top:${top}%;left:${left}%" onclick="SosView.detail('${s.id}')" title="${s.type}">${s.status === 'pending' ? '🆘' : s.status === 'progress' ? '🚑' : '✅'}</div>`;
          }).join('')}
          <div class="map-info">📍 城南市 · ${s.sosPending + s.sosProgress} 个活跃 SOS</div>
          <div class="map-legend">
            <div class="legend-item"><div class="legend-dot" style="background:var(--danger)"></div>待响应</div>
            <div class="legend-item"><div class="legend-dot" style="background:var(--accent)"></div>处置中</div>
            <div class="legend-item"><div class="legend-dot" style="background:var(--success)"></div>已解决</div>
          </div>
        </div>
      </div>
    </div>`;
  },
  _getList() {
    let list = DB.sos.slice();
    if (this.filter !== 'all') list = list.filter(s => s.status === this.filter);
    if (this.keyword) list = Store.search('sos', this.keyword, ['id','type','reporter','location','phone','desc']);
    return list;
  },
  renderList() {
    const list = this._getList();
    if (list.length === 0) return `<div class="card" style="text-align:center;padding:40px;color:var(--text2)">📭 暂无符合条件的 SOS</div>`;
    return list.map(s => `
      <div class="card" style="margin-bottom:10px;border-left:4px solid ${s.status==='pending'?'var(--danger)':s.status==='progress'?'var(--warning)':'var(--success)'}">
        <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px">
          <div>
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
              <span style="font-size:18px">${s.status === 'pending' ? '🆘' : s.status === 'progress' ? '🚑' : '✅'}</span>
              <strong>${Search.highlight(s.type, this.keyword)}</strong>
              ${statusBadge(s.status)}
              <span class="badge badge-${s.level === 1 ? 'urgent' : s.level === 2 ? 'pending' : 'gray'}">${s.level}级</span>
            </div>
            <div style="font-size:12px;color:var(--text2)">${Search.highlight(s.desc, this.keyword)}</div>
          </div>
          <div style="text-align:right;font-size:11px;color:var(--text3)">
            <div style="font-family:monospace">${s.id}</div>
            <div>${s.time}</div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 14px;font-size:11px;color:var(--text2);margin-bottom:10px">
          <div>📍 ${Search.highlight(s.location, this.keyword)}</div>
          <div>👥 ${s.count} 人</div>
          <div>👤 ${Search.highlight(s.reporter, this.keyword)}</div>
          <div>📞 ${s.phone}</div>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <button class="btn btn-primary btn-xs" onclick="SosView.detail('${s.id}')">详情</button>
          ${s.status === 'pending' ? `<button class="btn btn-success btn-xs" onclick="SosView.accept('${s.id}')">接受处置</button>` : ''}
          ${s.status === 'progress' ? `<button class="btn btn-success btn-xs" onclick="SosView.resolve('${s.id}')">标记解决</button>` : ''}
          <button class="btn btn-secondary btn-xs" onclick="showModal('联系求助人', Forms.call('${s.phone}'), '呼叫')">📞 联系</button>
          <button class="btn btn-danger btn-xs" onclick="SosView.remove('${s.id}')">🗑️ 删除</button>
        </div>
      </div>
    `).join('');
  },
  setFilter(f) { this.filter = f; this.refresh(); },
  setKeyword(kw) { this.keyword = kw; this.refresh(); },
  clearFilter() { this.filter='all'; this.keyword=''; this.refresh(); },
  refresh() {
    const el = document.getElementById('content');
    if (el && currentPage === 'sos') el.innerHTML = this.render();
  },
  detail(id) {
    const s = Store.get('sos', id);
    if (!s) return;
    const actions = [
      `<button class="btn btn-secondary btn-sm" onclick="Drawer.close()">关闭</button>`,
      `<button class="btn btn-secondary btn-xs" onclick="showModal('联系求助人', Forms.call('${s.phone}'), '呼叫')">📞 联系</button>`,
      `<button class="btn btn-danger btn-sm" onclick="SosView.remove('${s.id}')">🗑️ 删除</button>`,
    ];
    if (s.status === 'pending') actions.push(`<button class="btn btn-success btn-sm" onclick="SosView.accept('${s.id}')">✅ 接受处置</button>`);
    if (s.status === 'progress') actions.push(`<button class="btn btn-success btn-sm" onclick="SosView.resolve('${s.id}')">🎉 标记解决</button>`);
    Drawer.open(`🆘 ${s.type} · ${s.id}`, `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 14px;font-size:13px;margin-bottom:14px">
        <div><span style="color:var(--text2)">类型：</span>${s.type}</div>
        <div><span style="color:var(--text2)">等级：</span>${s.level} 级紧急</div>
        <div><span style="color:var(--text2)">状态：</span>${statusBadge(s.status)}</div>
        <div><span style="color:var(--text2)">被困人数：</span>${s.count} 人</div>
        <div><span style="color:var(--text2)">求助人：</span>${s.reporter}</div>
        <div><span style="color:var(--text2)">电话：</span>${s.phone}</div>
        <div style="grid-column:span 2"><span style="color:var(--text2)">地点：</span>${s.location}</div>
        <div style="grid-column:span 2"><span style="color:var(--text2)">描述：</span>${s.desc}</div>
      </div>
      <div style="padding:10px;background:var(--bg2);border-radius:8px;font-size:12px">
        <div style="font-weight:600;margin-bottom:6px">🤖 AI 处置建议</div>
        <ul style="line-height:1.8;color:var(--text)">
          <li>📍 已自动定位，距最近队伍 ${(Math.random()*3+2).toFixed(1)}km</li>
          <li>🚒 建议派遣：${s.type.includes('落水') ? '水域救援组 + 冲锋舟' : s.type.includes('迷路') ? '山地救援组 + 无人机' : '就近救援队'}</li>
          <li>📞 已通知 ${s.count > 1 ? '120 急救' : '求助人家属'}</li>
          <li>🏛️ 已生成政府应急上报草稿</li>
        </ul>
      </div>`, actions.join(' '));
  },
  accept(id) {
    Store.acceptSOS(id);
    Store.logCrossEvent('web', 'accept', 'sos', Store.get('sos', id));
    toast(`✅ SOS ${id} 已接受，正在派发救援`);
    Drawer.close();
    this.refresh();
  },
  resolve(id) {
    Store.resolveSOS(id);
    Store.logCrossEvent('web', 'resolve', 'sos', Store.get('sos', id));
    toast(`🎉 SOS ${id} 已成功解决`);
    Drawer.close();
    this.refresh();
  },
  create() {
    showModal('录入求助信息', Forms.createSOS(), '提交', (formData) => {
      if (!formData || !formData.type || !formData.location) { toast('⚠️ 请填写类型和地点', 'error'); return; }
      const s = Store.add('sos', {
        type: formData.type,
        level: Number(formData.level) || 2,
        status: 'pending',
        reporter: formData.reporter || '市民',
        phone: formData.phone || '138****0000',
        location: formData.location,
        lng: 116.35 + Math.random() * 0.15,
        lat: 39.88 + Math.random() * 0.10,
        time: new Date().toTimeString().slice(0,5),
        desc: formData.desc || 'Web 端录入',
        count: Number(formData.count) || 1,
      }, {idPrefix: 'SOS-'});
      Store.logCrossEvent(formData.platform || 'web', 'add', 'sos', s);
      toast(`✅ 求助已录入：${s.id}`);
      this.refresh();
    });
  },
  remove(id) {
    Confirm(`确定删除 SOS <strong style="color:var(--accent)">${id}</strong>？`, () => {
      Store.remove('sos', id);
      Store.logCrossEvent('web', 'remove', 'sos', {id});
      toast(`🗑️ SOS ${id} 已删除`);
      Drawer.close();
      this.refresh();
    }, {danger: true, title: '⚠️ 删除 SOS'});
  },
  batchAccept() {
    const pendings = DB.sos.filter(s => s.status === 'pending');
    if (pendings.length === 0) { toast('当前无待响应 SOS', 'error'); return; }
    Confirm(`确定一键接受 <strong>${pendings.length}</strong> 个待响应 SOS？`, () => {
      pendings.forEach(s => Store.acceptSOS(s.id));
      toast(`✅ 已批量接受 ${pendings.length} 个 SOS`);
      this.refresh();
    });
  },
  _subscribe() {
    Store.subscribePage('sos', ['sos:add','sos:update','sos:remove','global:change'], () => {
      if (currentPage === 'sos') this.refresh();
    });
  },
  _cleanup() { Store.cleanupPage('sos'); },
};

// ---------- 装备视图（对象式 View） ----------
const EquipmentView = {
  pageId: 'equipment',
  filter: 'all',
  keyword: '',
  render() {
    this._subscribe();
    const total = DB.equipment.reduce((a,e)=>a+e.total,0);
    const available = DB.equipment.reduce((a,e)=>a+e.available,0);
    const borrowed = total - available;
    return `
    <div class="page-header">
      <div>
        <div class="page-title">🎒 装备管理</div>
        <div class="page-subtitle">装备档案 · 库存 · 借用归还 · 维保 · 数据实时联动</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary btn-sm" onclick="goPage('app-equip-scan')">📷 扫码</button>
        <button class="btn btn-primary btn-sm" onclick="EquipmentView.create()">➕ 新增装备</button>
      </div>
    </div>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-label">装备总数</div><div class="stat-value">${total}</div></div>
      <div class="stat-card success"><div class="stat-label">在库</div><div class="stat-value">${available}</div></div>
      <div class="stat-card warning"><div class="stat-label">借出</div><div class="stat-value">${borrowed}</div></div>
      <div class="stat-card danger"><div class="stat-label">预警</div><div class="stat-value">${DB.equipment.filter(e=>e.status==='warning').length}</div></div>
    </div>
    <div class="filters">
      <span style="font-size:12px;color:var(--text2)">类别：</span>
      <button class="filter-btn ${this.filter==='all'?'active':''}" onclick="EquipmentView.setFilter('all')">全部</button>
      ${['防护类','通讯类','医疗类','工具类','特种装备'].map(c => `<button class="filter-btn ${this.filter===c?'active':''}" onclick="EquipmentView.setFilter('${c}')">${c}</button>`).join('')}
    </div>
    <div style="display:flex;gap:8px;align-items:center;margin-bottom:10px">
      <input class="form-input" data-search="true" style="max-width:300px" placeholder="🔍 搜索装备（名称/型号/归属）" value="${this.keyword}" oninput="EquipmentView.setKeyword(this.value)">
      <span style="font-size:12px;color:var(--text3)">${this._getList().length} 条</span>
      <button class="btn btn-secondary btn-xs" onclick="EquipmentView.clearFilter()">清除</button>
    </div>
    <div id="equipTable">${this.renderTable()}</div>
    <div class="card" style="margin-top:14px">
      <div style="font-weight:700;font-size:15px;margin-bottom:10px">📊 库存占比</div>
      ${Charts.bar(['防护类','通讯类','医疗类','工具类','特种装备'].map(c => ({
        label: c, value: DB.equipment.filter(e=>e.category===c).reduce((a,e)=>a+e.total,0)
      })), {height: 180})}
    </div>`;
  },
  _getList() {
    let list = DB.equipment.slice();
    if (this.filter !== 'all') list = list.filter(e => e.category === this.filter);
    if (this.keyword) list = Store.search('equipment', this.keyword, ['id','name','model','owner','location']);
    return list;
  },
  renderTable() {
    const list = this._getList();
    if (list.length === 0) return `<div class="card" style="text-align:center;padding:40px;color:var(--text2)">📭 暂无符合条件的装备</div>`;
    return `<div class="table-wrap">
      <table>
        <thead><tr><th>编号</th><th>名称</th><th>类别</th><th>型号</th><th>总数</th><th>可用</th><th>状态</th><th>操作</th></tr></thead>
        <tbody>
          ${list.map(e => `<tr class="clickable" onclick="EquipmentView.detail('${e.id}')">
            <td style="font-family:monospace;font-size:11px;color:var(--accent)">${e.id}</td>
            <td><strong>${Search.highlight(e.name, this.keyword)}</strong></td>
            <td>${e.category}</td>
            <td>${Search.highlight(e.model, this.keyword)}</td>
            <td>${e.total}</td>
            <td style="color:${e.available<e.total*0.3?'var(--danger)':'var(--text)'}">${e.available}</td>
            <td>${e.status==='warning'?statusBadge('warning'):statusBadge('normal')}</td>
            <td onclick="event.stopPropagation()">
              <button class="btn btn-primary btn-xs" onclick="EquipmentView.borrow('${e.id}')">借用</button>
              <button class="btn btn-secondary btn-xs" onclick="EquipmentView.detail('${e.id}')">详情</button>
              <button class="btn btn-secondary btn-xs" onclick="EquipmentView.edit('${e.id}')">编辑</button>
              <button class="btn btn-danger btn-xs" onclick="EquipmentView.remove('${e.id}')">删除</button>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
  },
  setFilter(f) { this.filter = f; this.refresh(); },
  setKeyword(kw) { this.keyword = kw; this.refresh(); },
  clearFilter() { this.filter='all'; this.keyword=''; this.refresh(); },
  refresh() {
    const el = document.getElementById('content');
    if (el && currentPage === 'equipment') el.innerHTML = this.render();
  },
  detail(id) {
    const e = Store.get('equipment', id);
    if (!e) return;
    const actions = [
      `<button class="btn btn-secondary btn-sm" onclick="Drawer.close()">关闭</button>`,
      `<button class="btn btn-secondary btn-sm" onclick="EquipmentView.edit('${e.id}')">✏️ 编辑</button>`,
      `<button class="btn btn-primary btn-sm" onclick="EquipmentView.borrow('${e.id}')">📤 借用</button>`,
      `<button class="btn btn-danger btn-sm" onclick="EquipmentView.remove('${e.id}')">🗑️ 删除</button>`,
    ];
    Drawer.open(`🎒 ${e.name}`, `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 14px;font-size:13px;margin-bottom:14px">
        <div><span style="color:var(--text2)">编号：</span><span style="font-family:monospace;color:var(--accent)">${e.id}</span></div>
        <div><span style="color:var(--text2)">类别：</span>${e.category}</div>
        <div><span style="color:var(--text2)">型号：</span>${e.model}</div>
        <div><span style="color:var(--text2)">归属：</span>${e.owner}</div>
        <div><span style="color:var(--text2)">总数：</span>${e.total}</div>
        <div><span style="color:var(--text2)">可用：</span>${e.available}</div>
        <div style="grid-column:span 2"><span style="color:var(--text2)">存放位置：</span>${e.location}</div>
      </div>
      <div style="margin-top:10px">
        <div style="font-size:12px;color:var(--text2);margin-bottom:6px">可用率：${Math.round(e.available/e.total*100)}%</div>
        <div class="progress-bar" style="height:10px"><div class="progress-fill ${e.available/e.total<0.3?'danger':''}" style="width:${e.available/e.total*100}%"></div></div>
      </div>
      ${e.warning ? `<div style="margin-top:10px;padding:10px;background:rgba(245,158,11,.1);border-radius:8px;border-left:3px solid var(--warning);font-size:12px;color:var(--warning)">⚠️ ${e.warning}</div>` : ''}`, actions.join(' '));
  },
  create() {
    showModal('新增装备', Forms.addEquip(), '添加', (formData) => {
      if (!formData || !formData.name) { toast('⚠️ 请输入装备名称', 'error'); return; }
      const e = Store.add('equipment', {
        name: formData.name, category: formData.category,
        model: formData.model || '通用', total: Number(formData.total) || 1,
        available: Number(formData.total) || 1, status: 'normal',
        location: formData.location || '装备库A', owner: formData.owner || '共用',
      }, {idPrefix: 'EQ-'});
      Store.logCrossEvent('web', 'add', 'equipment', e);
      toast(`✅ 装备已添加：${e.id}`);
      this.refresh();
    });
  },
  edit(id) {
    const e = Store.get('equipment', id);
    if (!e) return;
    showModal(`编辑装备 - ${e.id}`, Forms.addEquip(e), '保存', (formData) => {
      if (!formData || !formData.name) return;
      Store.update('equipment', id, {
        name: formData.name, category: formData.category,
        model: formData.model, location: formData.location, owner: formData.owner,
      });
      toast(`✅ 装备 ${id} 已更新`);
      Drawer.close();
      this.refresh();
    });
  },
  remove(id) {
    Confirm(`确定删除装备 <strong style="color:var(--accent)">${id}</strong>？`, () => {
      Store.remove('equipment', id);
      toast(`🗑️ 装备 ${id} 已删除`);
      Drawer.close();
      this.refresh();
    }, {danger: true, title: '⚠️ 删除装备'});
  },
  borrow(id) {
    const e = Store.get('equipment', id);
    if (!e) return;
    showModal(`借用 - ${e.name}`, Forms.borrow(e.name), '确认借用', (formData) => {
      if (!formData || !formData.qty) return;
      const qty = Number(formData.qty);
      if (e.available < qty) { toast('⚠️ 库存不足', 'error'); return; }
      Store.update('equipment', id, {available: e.available - qty});
      Store.logCrossEvent('web', 'borrow', 'equipment', {id, name: e.name, qty});
      toast(`📤 ${e.name} 已借出 ${qty} 件`);
      this.refresh();
    });
  },
  _subscribe() {
    Store.subscribePage('equipment', ['equipment:add','equipment:update','equipment:remove','global:change','equip:update'], () => {
      if (currentPage === 'equipment') this.refresh();
    });
  },
  _cleanup() { Store.cleanupPage('equipment'); },
};

// ---------- 队伍视图（对象式 View） ----------
const TeamView = {
  pageId: 'team',
  filter: 'all',
  keyword: '',
  render() {
    this._subscribe();
    const s = Store.stats();
    return `
    <div class="page-header">
      <div>
        <div class="page-title">👥 队伍管理</div>
        <div class="page-subtitle">救援队伍 · 人员档案 · 在岗状态 · 数据实时联动</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary btn-sm" onclick="toast('已导出队伍名册')">📥 导出</button>
        <button class="btn btn-primary btn-sm" onclick="TeamView.create()">➕ 新建队伍</button>
      </div>
    </div>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-label">队伍总数</div><div class="stat-value">${DB.teams.length}</div></div>
      <div class="stat-card success"><div class="stat-label">在岗人员</div><div class="stat-value">${DB.teams.reduce((a,t)=>a+t.available,0)}</div></div>
      <div class="stat-card warning"><div class="stat-label">执行中</div><div class="stat-value">${s.teamsBusy}</div></div>
      <div class="stat-card purple"><div class="stat-label">待命</div><div class="stat-value">${s.teamsIdle}</div></div>
    </div>
    <div class="filters">
      <span style="font-size:12px;color:var(--text2)">类型：</span>
      <button class="filter-btn ${this.filter==='all'?'active':''}" onclick="TeamView.setFilter('all')">全部</button>
      ${['综合救援','山地救援','水上救援','医疗救援','物流运输','无人机','通讯'].map(t => `<button class="filter-btn ${this.filter===t?'active':''}" onclick="TeamView.setFilter('${t}')">${t}</button>`).join('')}
    </div>
    <div style="display:flex;gap:8px;align-items:center;margin-bottom:10px">
      <input class="form-input" data-search="true" style="max-width:300px" placeholder="🔍 搜索队伍（名称/队长/驻地）" value="${this.keyword}" oninput="TeamView.setKeyword(this.value)">
      <span style="font-size:12px;color:var(--text3)">${this._getList().length} 条</span>
      <button class="btn btn-secondary btn-xs" onclick="TeamView.clearFilter()">清除</button>
    </div>
    <div class="grid grid-2">${this.renderList()}</div>`;
  },
  _getList() {
    let list = DB.teams.slice();
    if (this.filter !== 'all') list = list.filter(t => t.type === this.filter);
    if (this.keyword) list = Store.search('teams', this.keyword, ['id','name','leader','location','type']);
    return list;
  },
  renderList() {
    const list = this._getList();
    if (list.length === 0) return `<div class="card" style="text-align:center;padding:40px;color:var(--text2);grid-column:span 2">📭 暂无符合条件的队伍</div>`;
    return list.map(t => `
      <div class="item-card clickable" onclick="TeamView.detail('${t.id}')">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <strong>${Search.highlight(t.name, this.keyword)}</strong>
          ${statusBadge(t.status)}
        </div>
        <div style="font-size:12px;color:var(--text2);line-height:1.7">
          <p>👨‍✈️ 队长：${Search.highlight(t.leader, this.keyword)} · ${t.type} · ${t.level}</p>
          <p>👥 ${t.available}/${t.members} 人在岗 · 驻地：${Search.highlight(t.location, this.keyword)}</p>
          <p>📋 当前任务：${t.tasks} 个</p>
        </div>
        <div class="members" style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">
          <button class="btn btn-secondary btn-xs" onclick="event.stopPropagation();TeamView.detail('${t.id}')">详情</button>
          <button class="btn btn-secondary btn-xs" onclick="event.stopPropagation();TeamView.edit('${t.id}')">编辑</button>
          <button class="btn btn-danger btn-xs" onclick="event.stopPropagation();TeamView.remove('${t.id}')">删除</button>
        </div>
      </div>
    `).join('');
  },
  setFilter(f) { this.filter = f; this.refresh(); },
  setKeyword(kw) { this.keyword = kw; this.refresh(); },
  clearFilter() { this.filter='all'; this.keyword=''; this.refresh(); },
  refresh() {
    const el = document.getElementById('content');
    if (el && currentPage === 'team') el.innerHTML = this.render();
  },
  detail(id) {
    const t = Store.get('teams', id);
    if (!t) return;
    const actions = [
      `<button class="btn btn-secondary btn-sm" onclick="Drawer.close()">关闭</button>`,
      `<button class="btn btn-secondary btn-sm" onclick="TeamView.edit('${t.id}')">✏️ 编辑</button>`,
      `<button class="btn btn-danger btn-sm" onclick="TeamView.remove('${t.id}')">🗑️ 删除</button>`,
    ];
    Drawer.open(`👥 ${t.name}`, `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 14px;font-size:13px;margin-bottom:14px">
        <div><span style="color:var(--text2)">编号：</span><span style="font-family:monospace;color:var(--accent)">${t.id}</span></div>
        <div><span style="color:var(--text2)">类型：</span>${t.type}</div>
        <div><span style="color:var(--text2)">等级：</span>${t.level}</div>
        <div><span style="color:var(--text2)">状态：</span>${statusBadge(t.status)}</div>
        <div><span style="color:var(--text2)">队长：</span>${t.leader}</div>
        <div><span style="color:var(--text2)">人数：</span>${t.available}/${t.members} 在岗</div>
        <div style="grid-column:span 2"><span style="color:var(--text2)">驻地：</span>${t.location}</div>
      </div>
      <div style="margin-top:10px">
        <div style="font-size:12px;color:var(--text2);margin-bottom:6px">在岗率：${Math.round(t.available/t.members*100)}%</div>
        <div class="progress-bar" style="height:10px"><div class="progress-fill" style="width:${t.available/t.members*100}%"></div></div>
      </div>
      <div style="margin-top:14px;padding:10px;background:var(--bg2);border-radius:8px">
        <div style="font-weight:600;margin-bottom:6px">📋 队伍动态</div>
        <div class="timeline">
          <div class="timeline-item done"><div class="timeline-time">今日</div><div class="timeline-content">执行任务 ${t.tasks} 个</div></div>
          <div class="timeline-item"><div class="timeline-time">本周</div><div class="timeline-content">出勤率 ${(85+Math.random()*15).toFixed(0)}%</div></div>
        </div>
      </div>`, actions.join(' '));
  },
  create() {
    showModal('新建队伍', Forms.createTeam(), '创建', (formData) => {
      if (!formData || !formData.name) { toast('⚠️ 请输入队伍名称', 'error'); return; }
      const t = Store.add('teams', {
        name: formData.name, type: formData.type, level: formData.level,
        leader: formData.leader || '待指派', members: Number(formData.members) || 10,
        available: Number(formData.members) || 10, status: 'idle',
        location: formData.location || '基地', tasks: 0,
      }, {idPrefix: 'T-'});
      Store.logCrossEvent('web', 'add', 'teams', t);
      toast(`✅ 队伍已创建：${t.id}`);
      this.refresh();
    });
  },
  edit(id) {
    const t = Store.get('teams', id);
    if (!t) return;
    showModal(`编辑队伍 - ${t.id}`, Forms.createTeam(t), '保存', (formData) => {
      if (!formData || !formData.name) return;
      Store.update('teams', id, {
        name: formData.name, type: formData.type, level: formData.level,
        leader: formData.leader, members: Number(formData.members), location: formData.location,
      });
      toast(`✅ 队伍 ${id} 已更新`);
      Drawer.close();
      this.refresh();
    });
  },
  remove(id) {
    Confirm(`确定删除队伍 <strong style="color:var(--accent)">${id}</strong>？`, () => {
      Store.remove('teams', id);
      toast(`🗑️ 队伍 ${id} 已删除`);
      Drawer.close();
      this.refresh();
    }, {danger: true, title: '⚠️ 删除队伍'});
  },
  _subscribe() {
    Store.subscribePage('team', ['teams:add','teams:update','teams:remove','global:change'], () => {
      if (currentPage === 'team') this.refresh();
    });
  },
  _cleanup() { Store.cleanupPage('team'); },
};

// ---------- 培训视图（对象式 View） ----------
const TrainingView = {
  pageId: 'training',
  filter: 'all',
  keyword: '',
  render() {
    this._subscribe();
    return `
    <div class="page-header">
      <div>
        <div class="page-title">📚 培训管理</div>
        <div class="page-subtitle">技能培训 · 证书培训 · 在线学习 · 数据实时联动</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary btn-sm" onclick="TrainingView.create()">➕ 发布培训</button>
      </div>
    </div>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-label">本期培训</div><div class="stat-value">${DB.trainings.length}</div></div>
      <div class="stat-card warning"><div class="stat-label">报名中</div><div class="stat-value">${DB.trainings.filter(t=>t.status==='enrolling').length}</div></div>
      <div class="stat-card danger"><div class="stat-label">已满员</div><div class="stat-value">${DB.trainings.filter(t=>t.status==='full').length}</div></div>
      <div class="stat-card purple"><div class="stat-label">参与人次</div><div class="stat-value">${DB.trainings.reduce((a,t)=>a+t.enrolled,0)}</div></div>
    </div>
    <div class="filters">
      <span style="font-size:12px;color:var(--text2)">状态：</span>
      <button class="filter-btn ${this.filter==='all'?'active':''}" onclick="TrainingView.setFilter('all')">全部</button>
      <button class="filter-btn ${this.filter==='enrolling'?'active':''}" onclick="TrainingView.setFilter('enrolling')">报名中</button>
      <button class="filter-btn ${this.filter==='full'?'active':''}" onclick="TrainingView.setFilter('full')">已满员</button>
      <button class="filter-btn ${this.filter==='done'?'active':''}" onclick="TrainingView.setFilter('done')">已完成</button>
    </div>
    <div style="display:flex;gap:8px;align-items:center;margin-bottom:10px">
      <input class="form-input" data-search="true" style="max-width:300px" placeholder="🔍 搜索培训（名称/讲师/地点）" value="${this.keyword}" oninput="TrainingView.setKeyword(this.value)">
      <span style="font-size:12px;color:var(--text3)">${this._getList().length} 条</span>
      <button class="btn btn-secondary btn-xs" onclick="TrainingView.clearFilter()">清除</button>
    </div>
    <div class="grid grid-2">${this.renderList()}</div>`;
  },
  _getList() {
    let list = DB.trainings.slice();
    if (this.filter !== 'all') list = list.filter(t => t.status === this.filter);
    if (this.keyword) list = Store.search('trainings', this.keyword, ['id','name','trainer','location','type']);
    return list;
  },
  renderList() {
    const list = this._getList();
    if (list.length === 0) return `<div class="card" style="text-align:center;padding:40px;color:var(--text2);grid-column:span 2">📭 暂无符合条件的培训</div>`;
    return list.map(t => `
      <div class="item-card clickable" onclick="TrainingView.detail('${t.id}')">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <strong>${Search.highlight(t.name, this.keyword)}</strong>
          ${statusBadge(t.status)}
        </div>
        <div style="font-size:12px;color:var(--text2);line-height:1.7">
          <p>📅 ${t.time} · ${Search.highlight(t.location, this.keyword)}</p>
          <p>👨‍🏫 讲师：${Search.highlight(t.trainer, this.keyword)} · 容量 ${t.enrolled}/${t.capacity}</p>
          <p>📝 类型：${t.type}</p>
        </div>
        <div style="margin-top:8px"><div class="progress-bar"><div class="progress-fill ${t.enrolled===t.capacity?'danger':''}" style="width:${t.enrolled/t.capacity*100}%"></div></div></div>
        <div class="members" style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">
          <button class="btn btn-secondary btn-xs" onclick="event.stopPropagation();TrainingView.detail('${t.id}')">详情</button>
          ${t.status==='enrolling' ? `<button class="btn btn-success btn-xs" onclick="event.stopPropagation();TrainingView.enroll('${t.id}')">报名</button>` : ''}
          <button class="btn btn-secondary btn-xs" onclick="event.stopPropagation();TrainingView.edit('${t.id}')">编辑</button>
          <button class="btn btn-danger btn-xs" onclick="event.stopPropagation();TrainingView.remove('${t.id}')">删除</button>
        </div>
      </div>
    `).join('');
  },
  setFilter(f) { this.filter = f; this.refresh(); },
  setKeyword(kw) { this.keyword = kw; this.refresh(); },
  clearFilter() { this.filter='all'; this.keyword=''; this.refresh(); },
  refresh() {
    const el = document.getElementById('content');
    if (el && currentPage === 'training') el.innerHTML = this.render();
  },
  detail(id) {
    const t = Store.get('trainings', id);
    if (!t) return;
    const actions = [
      `<button class="btn btn-secondary btn-sm" onclick="Drawer.close()">关闭</button>`,
      `<button class="btn btn-secondary btn-sm" onclick="TrainingView.edit('${t.id}')">✏️ 编辑</button>`,
      `<button class="btn btn-danger btn-sm" onclick="TrainingView.remove('${t.id}')">🗑️ 删除</button>`,
    ];
    if (t.status==='enrolling') actions.push(`<button class="btn btn-success btn-sm" onclick="TrainingView.enroll('${t.id}')">➕ 报名</button>`);
    Drawer.open(`📚 ${t.name}`, `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 14px;font-size:13px;margin-bottom:14px">
        <div><span style="color:var(--text2)">编号：</span><span style="font-family:monospace;color:var(--accent)">${t.id}</span></div>
        <div><span style="color:var(--text2)">类型：</span>${t.type}</div>
        <div><span style="color:var(--text2)">讲师：</span>${t.trainer}</div>
        <div><span style="color:var(--text2)">状态：</span>${statusBadge(t.status)}</div>
        <div><span style="color:var(--text2)">时间：</span>${t.time}</div>
        <div><span style="color:var(--text2)">地点：</span>${t.location}</div>
        <div><span style="color:var(--text2)">报名：</span>${t.enrolled}/${t.capacity}</div>
      </div>
      <div style="margin-top:10px">
        <div style="font-size:12px;color:var(--text2);margin-bottom:6px">报名率：${Math.round(t.enrolled/t.capacity*100)}%</div>
        <div class="progress-bar" style="height:10px"><div class="progress-fill" style="width:${t.enrolled/t.capacity*100}%"></div></div>
      </div>`, actions.join(' '));
  },
  create() {
    showModal('发布培训', Forms.createTraining(), '发布', (formData) => {
      if (!formData || !formData.name) { toast('⚠️ 请输入培训名称', 'error'); return; }
      const t = Store.add('trainings', {
        name: formData.name, type: formData.type,
        trainer: formData.trainer || '待指派',
        capacity: Number(formData.capacity) || 30, enrolled: 0,
        time: formData.time || '待定', location: formData.location || '待定',
        status: 'enrolling',
      }, {idPrefix: 'TR-'});
      Store.logCrossEvent('web', 'add', 'trainings', t);
      toast(`✅ 培训已发布：${t.id}`);
      this.refresh();
    });
  },
  edit(id) {
    const t = Store.get('trainings', id);
    if (!t) return;
    showModal(`编辑培训 - ${t.id}`, Forms.createTraining(t), '保存', (formData) => {
      if (!formData || !formData.name) return;
      Store.update('trainings', id, {
        name: formData.name, type: formData.type, trainer: formData.trainer,
        capacity: Number(formData.capacity), time: formData.time, location: formData.location,
      });
      toast(`✅ 培训 ${id} 已更新`);
      Drawer.close();
      this.refresh();
    });
  },
  remove(id) {
    Confirm(`确定删除培训 <strong style="color:var(--accent)">${id}</strong>？`, () => {
      Store.remove('trainings', id);
      toast(`🗑️ 培训 ${id} 已删除`);
      Drawer.close();
      this.refresh();
    }, {danger: true, title: '⚠️ 删除培训'});
  },
  enroll(id) {
    const ok = Store.enrollTraining(id);
    if (ok) {
      toast(`✅ 报名成功`);
      this.refresh();
    } else {
      toast('⚠️ 报名已满', 'error');
    }
  },
  _subscribe() {
    Store.subscribePage('training', ['trainings:add','trainings:update','trainings:remove','global:change','training:update'], () => {
      if (currentPage === 'training') this.refresh();
    });
  },
  _cleanup() { Store.cleanupPage('training'); },
};

// ---------- 消息视图（对象式 View） ----------
const MessageView = {
  pageId: 'message',
  filter: 'all',
  keyword: '',
  render() {
    this._subscribe();
    const s = Store.stats();
    return `
    <div class="page-header">
      <div>
        <div class="page-title">💬 消息通知</div>
        <div class="page-subtitle">系统通知 · 任务消息 · SOS 告警 · 公告 · 实时推送</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary btn-sm" onclick="MessageView.markAllRead()">✓ 全部已读</button>
        <button class="btn btn-primary btn-sm" onclick="MessageView.create()">📢 发布通告</button>
      </div>
    </div>
    <div class="stats-grid">
      <div class="stat-card danger"><div class="stat-label">未读</div><div class="stat-value">${s.unreadMsgs}</div></div>
      <div class="stat-card success"><div class="stat-label">已读</div><div class="stat-value">${DB.messages.filter(m=>m.status==='read').length}</div></div>
      <div class="stat-card warning"><div class="stat-label">紧急</div><div class="stat-value">${DB.messages.filter(m=>m.priority==='urgent').length}</div></div>
      <div class="stat-card purple"><div class="stat-label">总数</div><div class="stat-value">${DB.messages.length}</div></div>
    </div>
    <div class="filters">
      <button class="filter-btn ${this.filter==='all'?'active':''}" onclick="MessageView.setFilter('all')">全部</button>
      <button class="filter-btn ${this.filter==='unread'?'active':''}" onclick="MessageView.setFilter('unread')">未读</button>
      <button class="filter-btn ${this.filter==='urgent'?'active':''}" onclick="MessageView.setFilter('urgent')">紧急</button>
      ${['通知','预警','任务','审批'].map(t => `<button class="filter-btn ${this.filter===t?'active':''}" onclick="MessageView.setFilter('${t}')">${t}</button>`).join('')}
    </div>
    <div style="display:flex;gap:8px;align-items:center;margin-bottom:10px">
      <input class="form-input" data-search="true" style="max-width:300px" placeholder="🔍 搜索消息（标题/来源）" value="${this.keyword}" oninput="MessageView.setKeyword(this.value)">
      <span style="font-size:12px;color:var(--text3)">${this._getList().length} 条</span>
      <button class="btn btn-secondary btn-xs" onclick="MessageView.clearFilter()">清除</button>
    </div>
    <div id="msgList">${this.renderList()}</div>`;
  },
  _getList() {
    let list = DB.messages.slice();
    if (this.filter === 'unread') list = list.filter(m => m.status === 'unread');
    else if (this.filter === 'urgent') list = list.filter(m => m.priority === 'urgent');
    else if (this.filter !== 'all') list = list.filter(m => m.type === this.filter);
    if (this.keyword) list = Store.search('messages', this.keyword, ['id','title','from','type']);
    return list;
  },
  renderList() {
    const list = this._getList();
    if (list.length === 0) return `<div class="card" style="text-align:center;padding:40px;color:var(--text2)">📭 暂无符合条件的消息</div>`;
    return list.map(m => `
      <div class="card" style="margin-bottom:8px;border-left:3px solid ${m.priority==='urgent'?'var(--danger)':m.priority==='high'?'var(--warning)':'var(--primary-light)'};cursor:pointer" onclick="MessageView.detail('${m.id}')">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="display:flex;align-items:center;gap:8px">
              ${m.status==='unread'?'<span style="color:var(--accent)">●</span>':''}
              <strong style="color:${m.priority==='urgent'?'var(--danger)':'var(--text)'}">${Search.highlight(m.title, this.keyword)}</strong>
              ${m.priority==='urgent'?'<span class="badge badge-urgent">紧急</span>':''}
              <span class="badge badge-gray">${m.type}</span>
            </div>
            <div style="font-size:12px;color:var(--text2);margin-top:3px">来源：${m.from} · ${m.time}</div>
          </div>
          <div style="display:flex;gap:6px" onclick="event.stopPropagation()">
            ${m.status==='unread' ? `<button class="btn btn-secondary btn-xs" onclick="MessageView.markRead('${m.id}')">已读</button>` : ''}
            <button class="btn btn-danger btn-xs" onclick="MessageView.remove('${m.id}')">🗑️</button>
          </div>
        </div>
      </div>
    `).join('');
  },
  setFilter(f) { this.filter = f; this.refresh(); },
  setKeyword(kw) { this.keyword = kw; this.refresh(); },
  clearFilter() { this.filter='all'; this.keyword=''; this.refresh(); },
  refresh() {
    const el = document.getElementById('content');
    if (el && currentPage === 'message') el.innerHTML = this.render();
  },
  detail(id) {
    const m = Store.get('messages', id);
    if (!m) return;
    if (m.status === 'unread') Store.markMessageRead(id);
    const actions = [
      `<button class="btn btn-secondary btn-sm" onclick="Drawer.close()">关闭</button>`,
      `<button class="btn btn-danger btn-sm" onclick="MessageView.remove('${m.id}')">🗑️ 删除</button>`,
    ];
    Drawer.open(`💬 ${m.title}`, `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 14px;font-size:13px;margin-bottom:14px">
        <div><span style="color:var(--text2)">编号：</span><span style="font-family:monospace;color:var(--accent)">${m.id}</span></div>
        <div><span style="color:var(--text2)">类型：</span>${m.type}</div>
        <div><span style="color:var(--text2)">来源：</span>${m.from}</div>
        <div><span style="color:var(--text2)">时间：</span>${m.time}</div>
        <div><span style="color:var(--text2)">优先级：</span>${statusBadge(m.priority)}</div>
        <div><span style="color:var(--text2)">状态：</span>${statusBadge(m.status)}</div>
      </div>
      <div style="padding:14px;background:var(--bg2);border-radius:8px;font-size:13px;line-height:1.8">
        ${m.title} - ${m.from} 于 ${m.time} 发布。详细内容：${m.type === '任务' ? '请前往任务管理查看' : m.type === '审批' ? '请前往待办事项处理' : m.type === '预警' ? '请立即关注并采取应对措施' : '请相关人员知悉'}。
      </div>`, actions.join(' '));
  },
  create() {
    showModal('发布公告', Forms.publish(), '发布', (formData) => {
      if (!formData || !formData.title) { toast('⚠️ 请输入标题', 'error'); return; }
      const m = Store.add('messages', {
        type: formData.type || '通知',
        title: formData.title,
        from: '指挥中心',
        time: new Date().toTimeString().slice(0,5),
        status: 'unread',
        priority: formData.priority || 'normal',
      }, {idPrefix: 'MSG-'});
      Store.logCrossEvent('web', 'publish', 'messages', m);
      toast(`📢 公告已发布：${m.id}`);
      this.refresh();
    });
  },
  markRead(id) {
    Store.markMessageRead(id);
    toast('✅ 已标记为已读');
    this.refresh();
  },
  markAllRead() {
    DB.messages.forEach(m => { if (m.status === 'unread') { m.status = 'read'; Store.emit('messages:update', m); } });
    toast(`✅ 已全部标记为已读`);
    this.refresh();
  },
  remove(id) {
    Confirm(`确定删除消息 <strong style="color:var(--accent)">${id}</strong>？`, () => {
      Store.remove('messages', id);
      toast(`🗑️ 消息 ${id} 已删除`);
      Drawer.close();
      this.refresh();
    }, {danger: true, title: '⚠️ 删除消息'});
  },
  _subscribe() {
    Store.subscribePage('message', ['messages:add','messages:update','messages:remove','global:change','msg:update','live:update'], () => {
      if (currentPage === 'message') this.refresh();
    });
  },
  _cleanup() { Store.cleanupPage('message'); },
};

// ---------- 物流视图（对象式 View） ----------
const LogisticsView = {
  pageId: 'logistics',
  filter: 'all',
  keyword: '',
  render() {
    this._subscribe();
    return `
    <div class="page-header">
      <div>
        <div class="page-title">📦 物流管理</div>
        <div class="page-subtitle">应急物资 · 运输调度 · 全程追踪 · 进度实时推进</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary btn-sm" onclick="LogisticsView.create()">➕ 新建运输</button>
      </div>
    </div>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-label">运单总数</div><div class="stat-value">${DB.logistics.length}</div></div>
      <div class="stat-card warning"><div class="stat-label">运输中</div><div class="stat-value">${DB.logistics.filter(l=>l.status==='transporting'||l.status==='loading').length}</div></div>
      <div class="stat-card success"><div class="stat-label">已送达</div><div class="stat-value">${DB.logistics.filter(l=>l.status==='delivered').length}</div></div>
      <div class="stat-card purple"><div class="stat-label">平均进度</div><div class="stat-value">${Math.round(DB.logistics.reduce((a,l)=>a+l.progress,0)/DB.logistics.length)}%</div></div>
    </div>
    <div class="filters">
      <button class="filter-btn ${this.filter==='all'?'active':''}" onclick="LogisticsView.setFilter('all')">全部</button>
      <button class="filter-btn ${this.filter==='loading'?'active':''}" onclick="LogisticsView.setFilter('loading')">装车中</button>
      <button class="filter-btn ${this.filter==='transporting'?'active':''}" onclick="LogisticsView.setFilter('transporting')">运输中</button>
      <button class="filter-btn ${this.filter==='delivered'?'active':''}" onclick="LogisticsView.setFilter('delivered')">已送达</button>
    </div>
    <div style="display:flex;gap:8px;align-items:center;margin-bottom:10px">
      <input class="form-input" data-search="true" style="max-width:300px" placeholder="🔍 搜索运单（物资/司机/目的地）" value="${this.keyword}" oninput="LogisticsView.setKeyword(this.value)">
      <span style="font-size:12px;color:var(--text3)">${this._getList().length} 条</span>
      <button class="btn btn-secondary btn-xs" onclick="LogisticsView.clearFilter()">清除</button>
    </div>
    <div id="logTable">${this.renderTable()}</div>`;
  },
  _getList() {
    let list = DB.logistics.slice();
    if (this.filter !== 'all') list = list.filter(l => l.status === this.filter);
    if (this.keyword) list = Store.search('logistics', this.keyword, ['id','goods','driver','from','to','type']);
    return list;
  },
  renderTable() {
    const list = this._getList();
    if (list.length === 0) return `<div class="card" style="text-align:center;padding:40px;color:var(--text2)">📭 暂无符合条件的运单</div>`;
    return `<div class="table-wrap">
      <table>
        <thead><tr><th>运单号</th><th>物资</th><th>出发地</th><th>目的地</th><th>车辆</th><th>司机</th><th>状态</th><th>进度</th><th>操作</th></tr></thead>
        <tbody>
          ${list.map(l => `<tr class="clickable" onclick="LogisticsView.detail('${l.id}')">
            <td style="font-family:monospace;font-size:11px;color:var(--accent)">${l.id}</td>
            <td>${Search.highlight(l.goods, this.keyword)}</td>
            <td>${Search.highlight(l.from, this.keyword)}</td>
            <td>${Search.highlight(l.to, this.keyword)}</td>
            <td>${l.vehicle}</td>
            <td>${Search.highlight(l.driver, this.keyword)}</td>
            <td>${statusBadge(l.status)}</td>
            <td><div class="progress-bar" style="width:80px"><div class="progress-fill" style="width:${l.progress}%"></div></div><div style="font-size:10px;color:var(--text2);margin-top:2px">${l.progress}% · ${l.eta}</div></td>
            <td onclick="event.stopPropagation()">
              <button class="btn btn-secondary btn-xs" onclick="LogisticsView.detail('${l.id}')">详情</button>
              <button class="btn btn-danger btn-xs" onclick="LogisticsView.remove('${l.id}')">删除</button>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
  },
  setFilter(f) { this.filter = f; this.refresh(); },
  setKeyword(kw) { this.keyword = kw; this.refresh(); },
  clearFilter() { this.filter='all'; this.keyword=''; this.refresh(); },
  refresh() {
    const el = document.getElementById('content');
    if (el && currentPage === 'logistics') el.innerHTML = this.render();
  },
  detail(id) {
    const l = Store.get('logistics', id);
    if (!l) return;
    const actions = [
      `<button class="btn btn-secondary btn-sm" onclick="Drawer.close()">关闭</button>`,
      `<button class="btn btn-primary btn-sm" onclick="goPage('gis')">🗺️ 地图追踪</button>`,
      `<button class="btn btn-danger btn-sm" onclick="LogisticsView.remove('${l.id}')">🗑️ 删除</button>`,
    ];
    Drawer.open(`📦 ${l.id} - ${l.goods}`, `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 14px;font-size:13px;margin-bottom:14px">
        <div><span style="color:var(--text2)">运单号：</span><span style="font-family:monospace;color:var(--accent)">${l.id}</span></div>
        <div><span style="color:var(--text2)">类型：</span>${l.type}</div>
        <div><span style="color:var(--text2)">出发地：</span>${l.from}</div>
        <div><span style="color:var(--text2)">目的地：</span>${l.to}</div>
        <div><span style="color:var(--text2)">车辆：</span>${l.vehicle}</div>
        <div><span style="color:var(--text2)">司机：</span>${l.driver}</div>
        <div><span style="color:var(--text2)">状态：</span>${statusBadge(l.status)}</div>
        <div><span style="color:var(--text2)">预计：</span>${l.eta}</div>
        <div style="grid-column:span 2"><span style="color:var(--text2)">物资：</span>${l.goods}</div>
      </div>
      <div style="margin-top:10px">
        <div style="font-size:12px;color:var(--text2);margin-bottom:6px">运输进度：${l.progress}%</div>
        <div class="progress-bar" style="height:10px"><div class="progress-fill" style="width:${l.progress}%"></div></div>
      </div>
      <div style="margin-top:14px;padding:10px;background:var(--bg2);border-radius:8px">
        <div style="font-weight:600;margin-bottom:6px">📍 运输节点</div>
        <div class="timeline">
          <div class="timeline-item ${l.progress>=20?'done':''}"><div class="timeline-time">已下单</div><div class="timeline-content">运单创建</div></div>
          <div class="timeline-item ${l.progress>=40?'done':''}"><div class="timeline-time">装车中</div><div class="timeline-content">物资装车</div></div>
          <div class="timeline-item ${l.progress>=80?'done':''}"><div class="timeline-time">运输中</div><div class="timeline-content">车辆出发</div></div>
          <div class="timeline-item ${l.progress>=100?'done':''}"><div class="timeline-time">${l.eta}</div><div class="timeline-content">${l.status==='delivered'?'已送达':'预计送达'}</div></div>
        </div>
      </div>`, actions.join(' '));
  },
  create() {
    showModal('新建运输任务', Forms.createLogistics(), '创建', (formData) => {
      if (!formData || !formData.goods || !formData.to) { toast('⚠️ 请填写物资和目的地', 'error'); return; }
      const l = Store.add('logistics', {
        type: formData.type, goods: formData.goods,
        count: Number(formData.count) || 1, vehicle: formData.vehicle || '货车1台',
        from: formData.from || '中心仓库', to: formData.to, driver: formData.driver || '待指派',
        status: 'loading', eta: '45分钟', progress: 0,
      }, {idPrefix: 'LG-'});
      Store.logCrossEvent('web', 'add', 'logistics', l);
      toast(`✅ 运单已创建：${l.id}`);
      this.refresh();
    });
  },
  remove(id) {
    Confirm(`确定删除运单 <strong style="color:var(--accent)">${id}</strong>？`, () => {
      Store.remove('logistics', id);
      toast(`🗑️ 运单 ${id} 已删除`);
      Drawer.close();
      this.refresh();
    }, {danger: true, title: '⚠️ 删除运单'});
  },
  _subscribe() {
    Store.subscribePage('logistics', ['logistics:add','logistics:update','logistics:remove','global:change','live:update'], () => {
      if (currentPage === 'logistics') this.refresh();
    });
  },
  _cleanup() { Store.cleanupPage('logistics'); },
};

// ---------- 死信治理视图（对象式 View） ----------
const OutboxView = {
  pageId: 'outbox',
  filter: 'all',
  keyword: '',
  selectedIds: [],
  render() {
    this._subscribe();
    const s = Store.stats();
    return `
    <div class="page-header">
      <div>
        <div class="page-title">⚠️ 死信治理</div>
        <div class="page-subtitle">消息可靠性 · 失败重试 · 死信分析 · 数据实时联动</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-warning btn-sm" onclick="OutboxView.batchRetry()">🔄 批量重试</button>
        <button class="btn btn-secondary btn-sm" onclick="OutboxView.batchClear()">🧹 清理已处理</button>
      </div>
    </div>
    <div class="stats-grid">
      <div class="stat-card danger"><div class="stat-label">死信队列</div><div class="stat-value">${DB.outbox.length}</div></div>
      <div class="stat-card warning"><div class="stat-label">待处理</div><div class="stat-value">${s.pendingOutbox}</div></div>
      <div class="stat-card success"><div class="stat-label">已处理</div><div class="stat-value">${DB.outbox.filter(o=>o.status==='resolved').length}</div></div>
      <div class="stat-card"><div class="stat-label">成功率</div><div class="stat-value">98.5%</div></div>
    </div>
    <div class="filters">
      <button class="filter-btn ${this.filter==='all'?'active':''}" onclick="OutboxView.setFilter('all')">全部</button>
      <button class="filter-btn ${this.filter==='pending'?'active':''}" onclick="OutboxView.setFilter('pending')">待处理</button>
      <button class="filter-btn ${this.filter==='resolved'?'active':''}" onclick="OutboxView.setFilter('resolved')">已处理</button>
    </div>
    <div style="display:flex;gap:8px;align-items:center;margin-bottom:10px">
      <input class="form-input" data-search="true" style="max-width:300px" placeholder="🔍 搜索死信（队列/消息/原因）" value="${this.keyword}" oninput="OutboxView.setKeyword(this.value)">
      <span style="font-size:12px;color:var(--text3)">${this._getList().length} 条</span>
      <button class="btn btn-secondary btn-xs" onclick="OutboxView.clearFilter()">清除</button>
    </div>
    <div id="outboxTable">${this.renderTable()}</div>`;
  },
  _getList() {
    let list = DB.outbox.slice();
    if (this.filter !== 'all') list = list.filter(o => o.status === this.filter);
    if (this.keyword) list = Store.search('outbox', this.keyword, ['id','queue','msg','reason']);
    return list;
  },
  renderTable() {
    const list = this._getList();
    if (list.length === 0) return `<div class="card" style="text-align:center;padding:40px;color:var(--text2)">📭 暂无符合条件的死信</div>`;
    return `<div class="table-wrap">
      <table>
        <thead><tr><th><input type="checkbox" onchange="OutboxView.toggleAll(this.checked)"></th><th>消息 ID</th><th>队列</th><th>消息</th><th>失败原因</th><th>重试</th><th>时间</th><th>状态</th><th>操作</th></tr></thead>
        <tbody>
          ${list.map(o => `<tr class="clickable" onclick="OutboxView.detail('${o.id}')">
            <td onclick="event.stopPropagation()"><input type="checkbox" data-id="${o.id}" ${this.selectedIds.includes(o.id)?'checked':''} onchange="OutboxView.toggleSelect('${o.id}', this.checked)"></td>
            <td style="font-family:monospace;font-size:11px;color:var(--accent)">${o.id}</td>
            <td>${Search.highlight(o.queue, this.keyword)}</td>
            <td>${Search.highlight(o.msg, this.keyword)}</td>
            <td style="font-size:11px;color:var(--text2)">${Search.highlight(o.reason, this.keyword)}</td>
            <td>${o.retry}/5</td>
            <td>${o.time}</td>
            <td>${statusBadge(o.status==='resolved'?'done':'pending')}</td>
            <td onclick="event.stopPropagation()">
              ${o.status==='pending' ? `<button class="btn btn-primary btn-xs" onclick="OutboxView.retry('${o.id}')">重试</button>` : ''}
              <button class="btn btn-secondary btn-xs" onclick="OutboxView.detail('${o.id}')">详情</button>
              <button class="btn btn-danger btn-xs" onclick="OutboxView.remove('${o.id}')">丢弃</button>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
  },
  setFilter(f) { this.filter = f; this.refresh(); },
  setKeyword(kw) { this.keyword = kw; this.refresh(); },
  clearFilter() { this.filter='all'; this.keyword=''; this.refresh(); },
  toggleSelect(id, checked) {
    if (checked && !this.selectedIds.includes(id)) this.selectedIds.push(id);
    if (!checked) this.selectedIds = this.selectedIds.filter(x => x !== id);
  },
  toggleAll(checked) {
    this.selectedIds = checked ? this._getList().map(o => o.id) : [];
    this.refresh();
  },
  refresh() {
    const el = document.getElementById('content');
    if (el && currentPage === 'outbox') el.innerHTML = this.render();
  },
  detail(id) {
    const o = Store.get('outbox', id);
    if (!o) return;
    const actions = [
      `<button class="btn btn-secondary btn-sm" onclick="Drawer.close()">关闭</button>`,
      `<button class="btn btn-danger btn-sm" onclick="OutboxView.remove('${o.id}')">🗑️ 丢弃</button>`,
    ];
    if (o.status==='pending') actions.unshift(`<button class="btn btn-primary btn-sm" onclick="OutboxView.retry('${o.id}')">🔄 重试</button>`);
    Drawer.open(`⚠️ ${o.id} - ${o.msg}`, `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 14px;font-size:13px;margin-bottom:14px">
        <div><span style="color:var(--text2)">消息 ID：</span><span style="font-family:monospace;color:var(--accent)">${o.id}</span></div>
        <div><span style="color:var(--text2)">队列：</span>${o.queue}</div>
        <div><span style="color:var(--text2)">消息：</span>${o.msg}</div>
        <div><span style="color:var(--text2)">重试次数：</span>${o.retry}/5</div>
        <div><span style="color:var(--text2)">时间：</span>${o.time}</div>
        <div><span style="color:var(--text2)">状态：</span>${statusBadge(o.status==='resolved'?'done':'pending')}</div>
        <div style="grid-column:span 2"><span style="color:var(--text2)">失败原因：</span>${o.reason}</div>
      </div>
      <div style="margin-top:14px;padding:10px;background:var(--bg2);border-radius:8px">
        <div style="font-weight:600;margin-bottom:6px">🔄 重试历史</div>
        <div class="timeline">
          ${Array.from({length: o.retry}, (_, i) => `<div class="timeline-item done"><div class="timeline-time">第 ${i+1} 次</div><div class="timeline-content">重试失败 - ${o.reason}</div></div>`).join('')}
          ${o.retry < 5 ? `<div class="timeline-item"><div class="timeline-time">下一次</div><div class="timeline-content">可继续重试 ${5-o.retry} 次</div></div>` : `<div class="timeline-item done"><div class="timeline-time">已用尽</div><div class="timeline-content">即将进入死信</div></div>`}
        </div>
      </div>`, actions.join(' '));
  },
  retry(id) {
    const o = Store.get('outbox', id);
    if (!o || o.retry >= 5) { toast('⚠️ 重试次数已用尽', 'error'); return; }
    // 50% 概率成功
    if (Math.random() > 0.5) {
      Store.update('outbox', id, {status: 'resolved', retry: o.retry + 1});
      toast(`✅ ${id} 重试成功`);
    } else {
      Store.update('outbox', id, {retry: o.retry + 1});
      toast(`⚠️ ${id} 重试失败（${o.retry + 1}/5）`, 'warning');
    }
    Drawer.close();
    this.refresh();
  },
  remove(id) {
    Confirm(`确定丢弃死信 <strong style="color:var(--accent)">${id}</strong>？`, () => {
      Store.remove('outbox', id);
      toast(`🗑️ 死信 ${id} 已丢弃`);
      Drawer.close();
      this.refresh();
    }, {danger: true, title: '⚠️ 丢弃死信'});
  },
  batchRetry() {
    if (this.selectedIds.length === 0) { toast('⚠️ 请先勾选', 'error'); return; }
    Confirm(`确定批量重试 <strong>${this.selectedIds.length}</strong> 条死信？`, () => {
      let success = 0;
      this.selectedIds.forEach(id => {
        const o = Store.get('outbox', id);
        if (o && o.status === 'pending') {
          if (Math.random() > 0.5) { Store.update('outbox', id, {status: 'resolved', retry: o.retry + 1}); success++; }
          else Store.update('outbox', id, {retry: o.retry + 1});
        }
      });
      toast(`✅ 批量重试完成，成功 ${success}/${this.selectedIds.length}`);
      this.selectedIds = [];
      this.refresh();
    });
  },
  batchClear() {
    Confirm(`确定清理所有已处理的死信？`, () => {
      DB.outbox = DB.outbox.filter(o => o.status !== 'resolved');
      Store.emit('outbox:remove', {});
      toast(`🧹 已清理已处理死信`);
      this.refresh();
    });
  },
  _subscribe() {
    Store.subscribePage('outbox', ['outbox:add','outbox:update','outbox:remove','global:change'], () => {
      if (currentPage === 'outbox') this.refresh();
    });
  },
  _cleanup() { Store.cleanupPage('outbox'); },
};



const PagesWeb = {
  // ---------- 指挥中心 ----------
  dashboard: () => {
    const s = Store.stats();
    return `
    <div class="demo-banner" onclick="goPage('flow-demo')" style="cursor:pointer">
      <div class="demo-banner-icon">🎯</div>
      <div style="flex:1">
        <div class="demo-banner-title">⭐ 推荐：端到端救援流程演示</div>
        <div class="demo-banner-desc">点击体验从 SOS 接报到复盘报告的完整业务闭环，8 步可交互推进</div>
      </div>
      <button class="btn btn-warning btn-sm">立即体验 →</button>
    </div>
    <div class="page-header">
      <div>
        <div class="page-title">📊 指挥中心</div>
        <div class="page-subtitle">实时态势 · ${new Date().toLocaleString('zh-CN')} · 数据实时联动</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary btn-sm" onclick="dashboardRefresh()">🔄 刷新</button>
        <button class="btn btn-primary btn-sm" onclick="TaskView.create(); goPage('task')">➕ 创建任务</button>
        <button class="btn btn-danger btn-sm" onclick="showModal('一键响应', '<p>将向 <strong>${s.teamsIdle}</strong> 支空闲队伍、<strong>${s.dronesFlying}</strong> 架无人机发送紧急出动指令</p>', '确认响应')">🚨 一键响应</button>
      </div>
    </div>
    <div class="stats-grid">
      <div class="stat-card" onclick="goPage('task')" style="cursor:pointer"><div class="stat-label">进行中任务</div><div class="stat-value">${s.tasksProgress + s.tasksPending}</div><div class="stat-trend trend-up">▲ ${s.tasksDone} 已完成</div></div>
      <div class="stat-card danger" onclick="goPage('sos')" style="cursor:pointer"><div class="stat-label">待响应 SOS</div><div class="stat-value">${s.sosPending}</div><div class="stat-trend trend-down">需立即处置</div></div>
      <div class="stat-card success" onclick="goPage('team')" style="cursor:pointer"><div class="stat-label">在线救援人员</div><div class="stat-value">${s.membersOnline}</div><div class="stat-trend trend-up">${s.teamsBusy} 队执行中</div></div>
      <div class="stat-card warning" onclick="goPage('equipment')" style="cursor:pointer"><div class="stat-label">装备总数</div><div class="stat-value">${DB.equipment.reduce((a,e)=>a+e.total,0)}</div><div class="stat-trend trend-warn">可用 ${DB.equipment.reduce((a,e)=>a+e.available,0)}</div></div>
      <div class="stat-card purple" onclick="goPage('device')" style="cursor:pointer"><div class="stat-label">在线无人机</div><div class="stat-value">${s.dronesFlying}</div><div class="stat-trend trend-up">实时图传中</div></div>
      <div class="stat-card cyan" onclick="goPage('training')" style="cursor:pointer"><div class="stat-label">培训报名中</div><div class="stat-value">${DB.trainings.filter(t=>t.status==='enrolling').length}</div><div class="stat-trend trend-up">${DB.trainings.reduce((a,t)=>a+t.enrolled,0)} 人参与</div></div>
    </div>
    <div class="card" style="border-left:3px solid var(--purple);margin-bottom:14px;cursor:pointer" onclick="goPage('decision')">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div style="font-weight:700;font-size:14px">🤖 AI 快速态势研判（点击进入完整分析）</div>
        <span class="badge badge-purple">AI 自动生成 · 实时数据</span>
      </div>
      <div style="font-size:12px;line-height:1.8;color:var(--text2);max-height:60px;overflow:hidden">${AI.situationalAnalysis().replace(/<br><br>/g,' · ').replace(/<strong>/g,'').replace(/<\/strong>/g,'').slice(0,300)}...</div>
    </div>
    <div class="grid grid-2" style="margin-bottom:14px">
      <div class="card">
        <div style="font-weight:700;font-size:15px;margin-bottom:10px">📈 近 7 日任务趋势</div>
        ${Charts.line([
          {label:'6/28', value:5},{label:'6/29', value:8},{label:'6/30', value:6},
          {label:'7/01', value:9},{label:'7/02', value:7},{label:'7/03', value:11},{label:'7/04', value:s.tasksProgress+s.tasksDone},
        ], {height:180})}
      </div>
      <div class="card">
        <div style="font-weight:700;font-size:15px;margin-bottom:10px">🥧 任务类型分布（实时）</div>
        ${Charts.pie(Object.entries(
          DB.tasks.reduce((m, t) => { m[t.type] = (m[t.type]||0)+1; return m; }, {})
        ).map(([label, value]) => ({label, value})))}
      </div>
    </div>
    <div class="grid grid-2">
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <div style="font-weight:700;font-size:15px">🚨 实时告警</div>
          <span class="badge badge-urgent">${DB.sos.filter(s=>s.status==='pending').length + DB.equipment.filter(e=>e.status==='warning').length + DB.tasks.filter(t=>t.status==='progress'&&t.progress<50).length} 条待处理</span>
        </div>
        <div class="timeline">
          ${DB.sos.filter(s=>s.status==='pending').slice(0,2).map(s=>`
          <div class="timeline-item"><div class="timeline-time">${s.time}</div><div class="timeline-content"><strong style="color:var(--danger)">SOS 求助</strong> · ${s.type}@${s.location} ${s.count}人 <button class="btn btn-danger btn-xs" style="margin-left:8px" onclick="SosView.detail('${s.id}')">立即处置</button></div></div>
          `).join('')}
          ${DB.equipment.filter(e=>e.status==='warning').map(e=>`
          <div class="timeline-item"><div class="timeline-time">--:--</div><div class="timeline-content"><strong style="color:var(--warning)">装备预警</strong> · ${e.name} ${e.warning||'状态异常'}</div></div>
          `).join('')}
          ${DB.tasks.filter(t=>t.status==='progress'&&t.progress<50).slice(0,1).map(t=>`
          <div class="timeline-item"><div class="timeline-time">${t.createdAt}</div><div class="timeline-content"><strong style="color:var(--accent)">任务进行中</strong> · ${t.name} 进度 ${t.progress}%</div></div>
          `).join('')}
          ${DB.tasks.filter(t=>t.status==='done').slice(0,1).map(t=>`
          <div class="timeline-item done"><div class="timeline-time">${t.createdAt}</div><div class="timeline-content"><strong style="color:var(--success)">已完成</strong> · ${t.name}</div></div>
          `).join('')}
        </div>
      </div>
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <div style="font-weight:700;font-size:15px">📋 待办事项</div>
          <span class="badge badge-pending">12 项</span>
        </div>
        <div class="table-wrap" style="border:none">
          <table>
            <tr><td>考勤审核（救援一队）</td><td><span class="badge badge-pending">待审</span></td><td><button class="btn btn-primary btn-xs" onclick="showModal('考勤审核', Forms.audit(), '提交审核')">审核</button></td></tr>
            <tr><td>装备申请（救援三队）</td><td><span class="badge badge-pending">待审</span></td><td><button class="btn btn-primary btn-xs" onclick="showModal('装备借用', Forms.borrow('对讲机'), '批准借用')">审批</button></td></tr>
            <tr><td>培训报名（水域救援）</td><td><span class="badge badge-pending">待审</span></td><td><button class="btn btn-primary btn-xs" onclick="toast('已查看报名详情')">查看</button></td></tr>
            <tr><td>志愿者申请（5 人）</td><td><span class="badge badge-pending">待审</span></td><td><button class="btn btn-primary btn-xs" onclick="showModal('志愿者审核', Forms.volunteer(), '批准申请')">审核</button></td></tr>
            <tr><td>政府上报（应急管理局）</td><td><span class="badge badge-urgent">紧急</span></td><td><button class="btn btn-danger btn-xs" onclick="goPage('gov')">去上报</button></td></tr>
          </table>
        </div>
      </div>
    </div>
    <div class="card" style="margin-top:14px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div style="font-weight:700;font-size:15px">🗺️ 全局态势图</div>
        <button class="btn btn-secondary btn-sm" onclick="goPage('gis')">查看完整 GIS →</button>
      </div>
      <div class="map-box" style="height:300px">
        <div class="map-bg"></div>
        <div class="map-grid"></div>
        <div class="map-marker m-team" style="top:30%;left:25%" onclick="toast('救援一队 · 12人在岗')" title="救援一队">🚒</div>
        <div class="map-marker m-team" style="top:55%;left:60%" onclick="toast('救援二队 · 8人在岗')" title="救援二队">🚒</div>
        <div class="map-marker m-task" style="top:40%;left:45%" onclick="toast('洪水救援任务 · 进行中')" title="洪水救援">📋</div>
        <div class="map-marker m-sos" style="top:65%;left:35%" onclick="goPage('sos')" title="SOS 求助">🆘</div>
        <div class="map-marker m-drone" style="top:25%;left:70%" onclick="goPage('app-drone')" title="无人机">🚁</div>
        <div class="map-marker m-shelter" style="top:70%;left:75%" onclick="toast('城西安置点 · 120 人')" title="安置点">🏕️</div>
        <div class="map-info">📍 城南市 · 5 支队伍 · 8 个任务点</div>
        <div class="map-legend">
          <div class="legend-item"><div class="legend-dot" style="background:var(--primary-light)"></div>救援队伍</div>
          <div class="legend-item"><div class="legend-dot" style="background:var(--accent)"></div>任务点</div>
          <div class="legend-item"><div class="legend-dot" style="background:var(--danger)"></div>SOS 求助</div>
          <div class="legend-item"><div class="legend-dot" style="background:var(--purple)"></div>无人机</div>
          <div class="legend-item"><div class="legend-dot" style="background:var(--success)"></div>安置点</div>
        </div>
      </div>
    </div>
  `;
},

  // ---------- 指挥大屏 ----------
  command: () => `
    <div class="page-header">
      <div>
        <div class="page-title">🖥️ 指挥大屏</div>
        <div class="page-subtitle">全屏可视化 · 多源数据融合 · 实时联动</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary btn-sm" onclick="toast('已切换至全屏')">⛶ 全屏</button>
        <button class="btn btn-primary btn-sm" onclick="goPage('app-video-wall')">🎥 视频墙</button>
        <button class="btn btn-warning btn-sm" onclick="showModal('指挥调度', '<p>选择指挥模式：</p><ul><li>📌 集群调度（多队协同）</li><li>🚁 无人机指挥</li><li>📞 融合通信</li></ul>', '进入指挥')">⚡ 调度</button>
      </div>
    </div>
    <div class="stats-grid">
      <div class="stat-card danger"><div class="stat-label">险情总数</div><div class="stat-value">23</div><div class="stat-trend">今日</div></div>
      <div class="stat-card success"><div class="stat-label">已处置</div><div class="stat-value">18</div><div class="stat-trend trend-up">处置率 78%</div></div>
      <div class="stat-card warning"><div class="stat-label">处置中</div><div class="stat-value">5</div><div class="stat-trend trend-warn">需关注</div></div>
      <div class="stat-card purple"><div class="stat-label">出动人次</div><div class="stat-value">412</div><div class="stat-trend trend-up">▲ 56</div></div>
    </div>
    <div class="grid grid-2" style="margin-bottom:14px">
      <div class="card">
        <div style="font-weight:700;font-size:15px;margin-bottom:12px">🗺️ 实时态势图</div>
        <div class="map-box" style="height:340px">
          <div class="map-bg"></div>
          <div class="map-grid"></div>
          <div class="map-marker m-team" style="top:25%;left:20%">🚒</div>
          <div class="map-marker m-team" style="top:60%;left:55%">🚒</div>
          <div class="map-marker m-task" style="top:40%;left:40%">📋</div>
          <div class="map-marker m-sos" style="top:70%;left:30%">🆘</div>
          <div class="map-marker m-drone" style="top:20%;left:65%">🚁</div>
          <div class="map-info">📍 实时位置 · 每 5 秒更新</div>
        </div>
      </div>
      <div class="card">
        <div style="font-weight:700;font-size:15px;margin-bottom:12px">📊 任务类型分布</div>
        <div style="margin-top:10px">
          <div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px"><span>洪水救援</span><span>8 起 / 35%</span></div><div class="progress-bar"><div class="progress-fill" style="width:35%"></div></div></div>
          <div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px"><span>山地搜救</span><span>5 起 / 22%</span></div><div class="progress-bar"><div class="progress-fill" style="width:22%"></div></div></div>
          <div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px"><span>水上救援</span><span>4 起 / 17%</span></div><div class="progress-bar"><div class="progress-fill" style="width:17%"></div></div></div>
          <div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px"><span>医疗救护</span><span>3 起 / 13%</span></div><div class="progress-bar"><div class="progress-fill" style="width:13%"></div></div></div>
          <div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px"><span>物资运送</span><span>2 起 / 9%</span></div><div class="progress-bar"><div class="progress-fill" style="width:9%"></div></div></div>
          <div><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px"><span>无人机航拍</span><span>1 起 / 4%</span></div><div class="progress-bar"><div class="progress-fill" style="width:4%"></div></div></div>
        </div>
        <div style="margin-top:14px;padding:10px;background:var(--bg2);border-radius:8px;border-left:3px solid var(--accent);font-size:12px">
          <strong style="color:var(--accent)">🤖 AI 分析建议：</strong> 近 3 小时洪水救援上升 50%，建议预派 2 支水上救援队伍至城南片区待命。
        </div>
      </div>
    </div>
    <div class="grid grid-3">
      <div class="card">
        <div style="font-weight:700;font-size:13px;margin-bottom:8px">🚒 队伍状态</div>
        <div style="font-size:12px;line-height:1.9">
          <div>🟢 救援一队 · 12 人在岗 · 执行中</div>
          <div>🟡 救援二队 · 8 人在岗 · 待命</div>
          <div>🟢 救援三队 · 15 人在岗 · 执行中</div>
          <div>🔴 救援四队 · 3 人在岗 · 休整</div>
          <div>🟢 水域组 · 10 人在岗 · 执行中</div>
        </div>
      </div>
      <div class="card">
        <div style="font-weight:700;font-size:13px;margin-bottom:8px">🚁 无人机编队</div>
        <div style="font-size:12px;line-height:1.9">
          <div>🟣 大疆 M300 · 飞行中 · 高度 120m</div>
          <div>🟣 大疆 M30T · 飞行中 · 高度 80m</div>
          <div>⚪ 经纬 M210 · 待命</div>
          <div>🟣 悟 2 · 飞行中 · 高度 100m</div>
          <div>⚪ Mavic 3 · 充电中</div>
        </div>
      </div>
      <div class="card">
        <div style="font-weight:700;font-size:13px;margin-bottom:8px">📡 通讯状态</div>
        <div style="font-size:12px;line-height:1.9">
          <div>🟢 5G 专网 · 正常 · 延迟 8ms</div>
          <div>🟢 卫星链路 · 正常 · 延迟 45ms</div>
          <div>🟢 对讲机集群 · 在线 28 台</div>
          <div>🟡 4G 公网 · 拥塞 · 延迟 120ms</div>
          <div>🟢 视频会议 · 3 路在线</div>
        </div>
      </div>
    </div>
  `,

  // ---------- 任务管理（交互式） ----------
  task: () => TaskView.render(),

  // ---------- SOS 管理（交互式） ----------
  sos: () => SosView.render(),

  // ---------- GIS 态势（对象式 View，见 demo-gis.js） ----------
  gis: () => GisView.render(),

  // ---------- 队伍管理（对象式 View） ----------
  team: () => TeamView.render(),

  // ---------- 装备管理（对象式 View） ----------
  equipment: () => EquipmentView.render(),

  // ---------- 设备管理 ----------
  device: () => `
    <div class="page-header">
      <div>
        <div class="page-title">📡 设备管理</div>
        <div class="page-subtitle">IoT 传感器 · 无人机 · 报警源 · 实时监控</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary btn-sm" onclick="showModal('绑定设备', Forms.bindDevice(), '绑定')">➕ 绑定设备</button>
      </div>
    </div>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-label">设备总数</div><div class="stat-value">348</div></div>
      <div class="stat-card success"><div class="stat-label">在线</div><div class="stat-value">312</div></div>
      <div class="stat-card danger"><div class="stat-label">离线</div><div class="stat-value">8</div></div>
      <div class="stat-card purple"><div class="stat-label">无人机</div><div class="stat-value">5</div></div>
    </div>
    <div class="grid grid-2">
      <div class="card">
        <div style="font-weight:700;font-size:15px;margin-bottom:10px">🌊 水位监测点</div>
        <div class="table-wrap" style="border:none">
          <table>
            <thead><tr><th>位置</th><th>水位</th><th>预警</th><th>状态</th></tr></thead>
            <tbody>
              <tr><td>城南河道</td><td>3.8m</td><td>⚠️ 黄色</td><td><span class="badge badge-progress">在线</span></td></tr>
              <tr><td>城北水库</td><td>5.2m</td><td>🔴 红色</td><td><span class="badge badge-progress">在线</span></td></tr>
              <tr><td>东湖闸口</td><td>2.1m</td><td>🟢 正常</td><td><span class="badge badge-progress">在线</span></td></tr>
              <tr><td>西河桥</td><td>—</td><td>—</td><td><span class="badge badge-urgent">离线</span></td></tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="card">
        <div style="font-weight:700;font-size:15px;margin-bottom:10px">🌧️ 雨量监测</div>
        <div class="table-wrap" style="border:none">
          <table>
            <thead><tr><th>位置</th><th>1H</th><th>24H</th><th>预警</th></tr></thead>
            <tbody>
              <tr><td>城南站</td><td>12mm</td><td>85mm</td><td>⚠️ 黄色</td></tr>
              <tr><td>北山站</td><td>5mm</td><td>42mm</td><td>🟢 正常</td></tr>
              <tr><td>城东站</td><td>18mm</td><td>102mm</td><td>🔴 红色</td></tr>
              <tr><td>城西站</td><td>3mm</td><td>28mm</td><td>🟢 正常</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <div class="card" style="margin-top:14px">
      <div style="font-weight:700;font-size:15px;margin-bottom:10px">🚁 无人机设备</div>
      <div class="table-wrap" style="border:none">
        <table>
          <thead><tr><th>编号</th><th>型号</th><th>飞手</th><th>状态</th><th>电量</th><th>高度</th><th>操作</th></tr></thead>
          <tbody>
            <tr><td>DR-001</td><td>大疆 M300</td><td>王飞宇</td><td><span class="badge badge-purple">飞行中</span></td><td>78%</td><td>120m</td><td><button class="btn btn-primary btn-xs" onclick="goPage('app-drone-video')">图传</button> <button class="btn btn-secondary btn-xs" onclick="goPage('app-telemetry')">遥测</button></td></tr>
            <tr><td>DR-002</td><td>大疆 M30T</td><td>李航</td><td><span class="badge badge-purple">飞行中</span></td><td>62%</td><td>80m</td><td><button class="btn btn-primary btn-xs" onclick="goPage('app-drone-video')">图传</button></td></tr>
            <tr><td>DR-003</td><td>经纬 M210</td><td>张翔</td><td><span class="badge badge-pending">待命</span></td><td>100%</td><td>—</td><td><button class="btn btn-warning btn-xs" onclick="toast('已下发起飞指令')">起飞</button></td></tr>
            <tr><td>DR-004</td><td>悟 2</td><td>王飞宇</td><td><span class="badge badge-purple">飞行中</span></td><td>45%</td><td>100m</td><td><button class="btn btn-primary btn-xs" onclick="goPage('app-drone-video')">图传</button></td></tr>
            <tr><td>DR-005</td><td>Mavic 3</td><td>—</td><td><span class="badge badge-gray">充电中</span></td><td>32%</td><td>—</td><td>—</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `,

  // ---------- 物流管理（对象式 View） ----------
  logistics: () => LogisticsView.render(),

  // ---------- 培训管理（对象式 View） ----------
  training: () => TrainingView.render(),

  // ---------- 证书管理 ----------
  cert: () => `
    <div class="page-header">
      <div>
        <div class="page-title">📜 证书管理</div>
        <div class="page-subtitle">救援资格证 · 飞手执照 · 培训证书</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary btn-sm" onclick="toast('已导出证书清单')">📥 导出</button>
        <button class="btn btn-primary btn-sm" onclick="showModal('颁发证书', '<div class=\\'form-group\\'><label class=\\'form-label\\'>证书类型</label><select class=\\'form-select\\'><option>救援资格证</option><option>无人机执照</option><option>急救证</option></select></div><div class=\\'form-group\\'><label class=\\'form-label\\'>持有人</label><input class=\\'form-input\\' placeholder=\\'姓名\\'></div>', '颁发')">➕ 颁发证书</button>
      </div>
    </div>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-label">证书总数</div><div class="stat-value">682</div></div>
      <div class="stat-card success"><div class="stat-label">有效</div><div class="stat-value">612</div></div>
      <div class="stat-card warning"><div class="stat-label">即将到期</div><div class="stat-value">38</div></div>
      <div class="stat-card danger"><div class="stat-label">已过期</div><div class="stat-value">32</div></div>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>证书编号</th><th>类型</th><th>持有人</th><th>队伍</th><th>颁发日期</th><th>有效期</th><th>状态</th><th>操作</th></tr></thead>
        <tbody>
          <tr><td>CRT-001</td><td>救援资格证</td><td>张建国</td><td>救援一队</td><td>2024-03-15</td><td>2027-03-15</td><td><span class="badge badge-done">有效</span></td><td><button class="btn btn-secondary btn-xs" onclick="toast('查看证书')">查看</button></td></tr>
          <tr><td>CRT-002</td><td>无人机执照</td><td>王飞宇</td><td>无人机中队</td><td>2023-08-20</td><td>2026-08-20</td><td><span class="badge badge-pending">即将到期</span></td><td><button class="btn btn-warning btn-xs" onclick="toast('已通知复审')">复审</button></td></tr>
          <tr><td>CRT-003</td><td>急救证</td><td>陈医生</td><td>医疗组</td><td>2024-06-10</td><td>2026-06-10</td><td><span class="badge badge-urgent">已过期</span></td><td><button class="btn btn-danger btn-xs" onclick="toast('已通知重新培训')">复训</button></td></tr>
          <tr><td>CRT-004</td><td>水域救援证</td><td>赵海洋</td><td>水域组</td><td>2025-01-12</td><td>2028-01-12</td><td><span class="badge badge-done">有效</span></td><td><button class="btn btn-secondary btn-xs" onclick="toast('查看证书')">查看</button></td></tr>
          <tr><td>CRT-005</td><td>山地救援证</td><td>刘志强</td><td>救援二队</td><td>2024-11-05</td><td>2027-11-05</td><td><span class="badge badge-done">有效</span></td><td><button class="btn btn-secondary btn-xs" onclick="toast('查看证书')">查看</button></td></tr>
        </tbody>
      </table>
    </div>
  `,

  // ---------- 融合通信 ----------
  fusion: () => `
    <div class="page-header">
      <div>
        <div class="page-title">📞 融合通信</div>
        <div class="page-subtitle">电话 / 视频 / 对讲 / 短信 · 多通道统一调度</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-success btn-sm" onclick="showModal('发起通话', Forms.call('调度中心'), '开始通话')">📞 发起通话</button>
        <button class="btn btn-primary btn-sm" onclick="goPage('app-video-wall')">🎥 视频会议</button>
      </div>
    </div>
    <div class="stats-grid">
      <div class="stat-card success"><div class="stat-label">5G 专网</div><div class="stat-value">正常</div><div class="stat-trend">延迟 8ms</div></div>
      <div class="stat-card success"><div class="stat-label">卫星链路</div><div class="stat-value">正常</div><div class="stat-trend">延迟 45ms</div></div>
      <div class="stat-card warning"><div class="stat-label">4G 公网</div><div class="stat-value">拥塞</div><div class="stat-trend trend-warn">延迟 120ms</div></div>
      <div class="stat-card purple"><div class="stat-label">在线对讲机</div><div class="stat-value">28</div><div class="stat-trend">集群在线</div></div>
    </div>
    <div class="grid grid-2">
      <div class="card">
        <div style="font-weight:700;font-size:15px;margin-bottom:10px">📞 通讯录快捷拨号</div>
        <div class="icon-grid">
          <div class="icon-item" onclick="showModal('发起通话', Forms.call('张建国'), '呼叫')"><div class="icon-emoji">👨‍✈️</div><div class="icon-text">张队长</div></div>
          <div class="icon-item" onclick="showModal('发起通话', Forms.call('刘志强'), '呼叫')"><div class="icon-emoji">👨‍✈️</div><div class="icon-text">刘队长</div></div>
          <div class="icon-item" onclick="showModal('发起通话', Forms.call('赵海洋'), '呼叫')"><div class="icon-emoji">👨‍✈️</div><div class="icon-text">赵队长</div></div>
          <div class="icon-item" onclick="showModal('发起通话', Forms.call('王飞宇'), '呼叫')"><div class="icon-emoji">👨‍✈️</div><div class="icon-text">王队长</div></div>
          <div class="icon-item" onclick="showModal('发起通话', Forms.call('陈医生'), '呼叫')"><div class="icon-emoji">⚕️</div><div class="icon-text">陈医生</div></div>
          <div class="icon-item" onclick="showModal('发起通话', Forms.call('110'), '呼叫')"><div class="icon-emoji">🚓</div><div class="icon-text">110</div></div>
          <div class="icon-item" onclick="showModal('发起通话', Forms.call('119'), '呼叫')"><div class="icon-emoji">🚒</div><div class="icon-text">119</div></div>
          <div class="icon-item" onclick="showModal('发起通话', Forms.call('120'), '呼叫')"><div class="icon-emoji">🚑</div><div class="icon-text">120</div></div>
        </div>
      </div>
      <div class="card">
        <div style="font-weight:700;font-size:15px;margin-bottom:10px">🎥 视频会议</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <div style="background:var(--bg2);border-radius:8px;aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;font-size:30px;position:relative;cursor:pointer" onclick="goPage('app-video-wall')">🚒<span style="position:absolute;bottom:4px;left:6px;font-size:10px;color:var(--success)">● 救援一队</span></div>
          <div style="background:var(--bg2);border-radius:8px;aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;font-size:30px;position:relative;cursor:pointer" onclick="goPage('app-video-wall')">🚒<span style="position:absolute;bottom:4px;left:6px;font-size:10px;color:var(--success)">● 救援二队</span></div>
          <div style="background:var(--bg2);border-radius:8px;aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;font-size:30px;position:relative;cursor:pointer" onclick="goPage('app-video-wall')">🚁<span style="position:absolute;bottom:4px;left:6px;font-size:10px;color:var(--success)">● 无人机</span></div>
          <div style="background:var(--bg2);border-radius:8px;aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;font-size:30px;position:relative;cursor:pointer" onclick="toast('邀请参会')">➕<span style="position:absolute;bottom:4px;left:6px;font-size:10px;color:var(--text2)">邀请</span></div>
        </div>
        <div style="margin-top:10px;display:flex;gap:6px">
          <button class="btn btn-success btn-sm" style="flex:1" onclick="toast('已开启麦克风')">🎤 麦克风</button>
          <button class="btn btn-success btn-sm" style="flex:1" onclick="toast('已开启摄像头')">📹 摄像头</button>
          <button class="btn btn-danger btn-sm" style="flex:1" onclick="toast('已共享屏幕')">🖥️ 共享</button>
        </div>
      </div>
    </div>
    <div class="card" style="margin-top:14px">
      <div style="font-weight:700;font-size:15px;margin-bottom:10px">📻 对讲机集群</div>
      <div class="table-wrap" style="border:none">
        <table>
          <thead><tr><th>编号</th><th>持有人</th><th>队伍</th><th>频道</th><th>电量</th><th>状态</th><th>操作</th></tr></thead>
          <tbody>
            <tr><td>RT-01</td><td>张建国</td><td>救援一队</td><td>CH-1</td><td>78%</td><td><span class="badge badge-progress">在线</span></td><td><button class="btn btn-primary btn-xs" onclick="toast('已呼叫')">呼叫</button></td></tr>
            <tr><td>RT-02</td><td>刘志强</td><td>救援二队</td><td>CH-1</td><td>18%</td><td><span class="badge badge-urgent">低电</span></td><td><button class="btn btn-warning btn-xs" onclick="toast('已提醒充电')">提醒</button></td></tr>
            <tr><td>RT-03</td><td>赵海洋</td><td>水域组</td><td>CH-2</td><td>62%</td><td><span class="badge badge-progress">在线</span></td><td><button class="btn btn-primary btn-xs" onclick="toast('已呼叫')">呼叫</button></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `,

  // ---------- 政府对接 ----------
  gov: () => `
    <div class="page-header">
      <div>
        <div class="page-title">🏛️ 政府对接</div>
        <div class="page-subtitle">应急管理局 · 110/119/120 · 数据上报与接收</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-danger btn-sm" onclick="showModal('事件上报', Forms.report(), '立即上报')">📤 事件上报</button>
        <button class="btn btn-primary btn-sm" onclick="showModal('发布公告', Forms.publish(), '发布')">📢 发布公告</button>
      </div>
    </div>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-label">本月上报</div><div class="stat-value">28</div></div>
      <div class="stat-card success"><div class="stat-label">已接收</div><div class="stat-value">15</div></div>
      <div class="stat-card warning"><div class="stat-label">待上报</div><div class="stat-value">2</div></div>
      <div class="stat-card purple"><div class="stat-label">对接单位</div><div class="stat-value">8</div></div>
    </div>
    <div class="grid grid-2">
      <div class="card">
        <div style="font-weight:700;font-size:15px;margin-bottom:10px">📤 上报记录</div>
        <div class="table-wrap" style="border:none">
          <table>
            <thead><tr><th>事件</th><th>单位</th><th>时间</th><th>状态</th></tr></thead>
            <tbody>
              <tr><td>城南洪水险情</td><td>应急管理局</td><td>07-04 14:35</td><td><span class="badge badge-done">已接收</span></td></tr>
              <tr><td>北山迷路搜救</td><td>110 指挥中心</td><td>07-04 15:15</td><td><span class="badge badge-done">已接收</span></td></tr>
              <tr><td>河道落水救援</td><td>120 急救</td><td>07-04 16:22</td><td><span class="badge badge-progress">待响应</span></td></tr>
              <tr><td>灾后航拍评估</td><td>应急管理局</td><td>—</td><td><span class="badge badge-pending">待上报</span></td></tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="card">
        <div style="font-weight:700;font-size:15px;margin-bottom:10px">📥 接收指令</div>
        <div class="table-wrap" style="border:none">
          <table>
            <thead><tr><th>来源</th><th>指令</th><th>时间</th><th>状态</th></tr></thead>
            <tbody>
              <tr><td>应急管理局</td><td>启动三级应急响应</td><td>07-04 14:00</td><td><span class="badge badge-progress">执行中</span></td></tr>
              <tr><td>110 指挥中心</td><td>协助城东交通事故处置</td><td>07-04 12:00</td><td><span class="badge badge-done">已完成</span></td></tr>
              <tr><td>气象局</td><td>暴雨橙色预警</td><td>07-04 09:30</td><td><span class="badge badge-pending">关注</span></td></tr>
              <tr><td>应急管理局</td><td>报送今日救援数据</td><td>07-04 18:00</td><td><span class="badge badge-pending">待执行</span></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <div class="card" style="margin-top:14px">
      <div style="font-weight:700;font-size:15px;margin-bottom:10px">🏛️ 对接单位</div>
      <div class="icon-grid">
        <div class="icon-item" onclick="toast('应急管理局 · 在线')"><div class="icon-emoji">🏛️</div><div class="icon-text">应急局</div></div>
        <div class="icon-item" onclick="showModal('发起通话', Forms.call('110'), '呼叫')"><div class="icon-emoji">🚓</div><div class="icon-text">110</div></div>
        <div class="icon-item" onclick="showModal('发起通话', Forms.call('119'), '呼叫')"><div class="icon-emoji">🚒</div><div class="icon-text">119</div></div>
        <div class="icon-item" onclick="showModal('发起通话', Forms.call('120'), '呼叫')"><div class="icon-emoji">🚑</div><div class="icon-text">120</div></div>
        <div class="icon-item" onclick="toast('气象局 · 在线')"><div class="icon-emoji">🌧️</div><div class="icon-text">气象局</div></div>
        <div class="icon-item" onclick="toast('水利局 · 在线')"><div class="icon-emoji">💧</div><div class="icon-text">水利局</div></div>
        <div class="icon-item" onclick="toast('民政局 · 在线')"><div class="icon-emoji">🏚️</div><div class="icon-text">民政局</div></div>
        <div class="icon-item" onclick="toast('红十字会 · 在线')"><div class="icon-emoji">红十字</div><div class="icon-text">红十字</div></div>
      </div>
    </div>
  `,

  // ---------- AI 决策（对象式 View，见 WebDecisionView） ----------
  decision: () => WebDecisionView.render(),

  // ---------- 报表导出 ----------
  report: () => `
    <div class="page-header">
      <div>
        <div class="page-title">📈 报表导出</div>
        <div class="page-subtitle">考勤 · 任务 · 队伍 · 装备 · 培训 多维报表</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary btn-sm" onclick="showModal('导出报表', Forms.export(), '导出')">📥 自定义导出</button>
      </div>
    </div>
    <div class="grid grid-3">
      <div class="item-card" onclick="showModal('导出考勤报表', Forms.export(), '导出')"><div style="font-size:30px">⏰</div><strong style="display:block;margin:6px 0">考勤报表</strong><div style="font-size:12px;color:var(--text2)">按月/按队/按人统计出勤</div></div>
      <div class="item-card" onclick="showModal('导出任务报表', Forms.export(), '导出')"><div style="font-size:30px">📋</div><strong style="display:block;margin:6px 0">任务报表</strong><div style="font-size:12px;color:var(--text2)">任务量/完成率/响应时长</div></div>
      <div class="item-card" onclick="showModal('导出队伍报表', Forms.export(), '导出')"><div style="font-size:30px">👥</div><strong style="display:block;margin:6px 0">队伍报表</strong><div style="font-size:12px;color:var(--text2)">队伍状态/出动频次</div></div>
      <div class="item-card" onclick="showModal('导出装备报表', Forms.export(), '导出')"><div style="font-size:30px">🎒</div><strong style="display:block;margin:6px 0">装备报表</strong><div style="font-size:12px;color:var(--text2)">库存/借用/维保</div></div>
      <div class="item-card" onclick="showModal('导出培训报表', Forms.export(), '导出')"><div style="font-size:30px">📚</div><strong style="display:block;margin:6px 0">培训报表</strong><div style="font-size:12px;color:var(--text2)">培训场次/参与人数</div></div>
      <div class="item-card" onclick="showModal('导出 SOS 报表', Forms.export(), '导出')"><div style="font-size:30px">🆘</div><strong style="display:block;margin:6px 0">SOS 报表</strong><div style="font-size:12px;color:var(--text2)">求助量/响应率/解决率</div></div>
    </div>
    <div class="card" style="margin-top:14px">
      <div style="font-weight:700;font-size:15px;margin-bottom:10px">📊 本月数据概览</div>
      <div style="margin-top:10px">
        <div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px"><span>任务完成率</span><span>89%</span></div><div class="progress-bar"><div class="progress-fill" style="width:89%"></div></div></div>
        <div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px"><span>SOS 响应率</span><span>96%</span></div><div class="progress-bar"><div class="progress-fill" style="width:96%"></div></div></div>
        <div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px"><span>装备可用率</span><span>92%</span></div><div class="progress-bar"><div class="progress-fill" style="width:92%"></div></div></div>
        <div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px"><span>人员出勤率</span><span>85%</span></div><div class="progress-bar"><div class="progress-fill" style="width:85%"></div></div></div>
        <div><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px"><span>培训覆盖率</span><span>78%</span></div><div class="progress-bar"><div class="progress-fill" style="width:78%"></div></div></div>
      </div>
    </div>
  `,

  // ---------- 消息通知（对象式 View） ----------
  message: () => MessageView.render(),

  // ---------- 系统管理 ----------
  system: () => `
    <div class="page-header">
      <div>
        <div class="page-title">⚙️ 系统管理</div>
        <div class="page-subtitle">用户 · 角色 · 权限 · 配置 · 审计日志</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary btn-sm" onclick="showModal('新增用户', '<div class=\\'form-group\\'><label class=\\'form-label\\'>用户名</label><input class=\\'form-input\\' placeholder=\\'用户名\\'></div><div class=\\'form-row\\'><div class=\\'form-group\\'><label class=\\'form-label\\'>角色</label><select class=\\'form-select\\'><option>管理员</option><option>队长</option><option>救援人员</option><option>飞手</option></select></div><div class=\\'form-group\\'><label class=\\'form-label\\'>所属队伍</label><select class=\\'form-select\\'><option>救援一队</option><option>救援二队</option></select></div></div>', '创建用户')">➕ 新增用户</button>
      </div>
    </div>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-label">用户总数</div><div class="stat-value">186</div></div>
      <div class="stat-card success"><div class="stat-label">在线</div><div class="stat-value">42</div></div>
      <div class="stat-card warning"><div class="stat-label">角色数</div><div class="stat-value">6</div></div>
      <div class="stat-card purple"><div class="stat-label">今日操作</div><div class="stat-value">1,238</div></div>
    </div>
    <div class="grid grid-2">
      <div class="card">
        <div style="font-weight:700;font-size:15px;margin-bottom:10px">👥 用户列表</div>
        <div class="table-wrap" style="border:none">
          <table>
            <thead><tr><th>用户</th><th>角色</th><th>队伍</th><th>状态</th><th>操作</th></tr></thead>
            <tbody>
              <tr><td>张建国</td><td><span class="badge badge-purple">管理员</span></td><td>救援一队</td><td><span class="badge badge-done">在线</span></td><td><button class="btn btn-secondary btn-xs" onclick="toast('编辑用户')">编辑</button></td></tr>
              <tr><td>刘志强</td><td><span class="badge badge-progress">队长</span></td><td>救援二队</td><td><span class="badge badge-done">在线</span></td><td><button class="btn btn-secondary btn-xs" onclick="toast('编辑用户')">编辑</button></td></tr>
              <tr><td>赵海洋</td><td><span class="badge badge-progress">队长</span></td><td>水域组</td><td><span class="badge badge-done">在线</span></td><td><button class="btn btn-secondary btn-xs" onclick="toast('编辑用户')">编辑</button></td></tr>
              <tr><td>王飞宇</td><td><span class="badge badge-cyan">飞手</span></td><td>无人机中队</td><td><span class="badge badge-done">在线</span></td><td><button class="btn btn-secondary btn-xs" onclick="toast('编辑用户')">编辑</button></td></tr>
              <tr><td>陈医生</td><td><span class="badge badge-gray">医疗</span></td><td>医疗组</td><td><span class="badge badge-gray">离线</span></td><td><button class="btn btn-secondary btn-xs" onclick="toast('编辑用户')">编辑</button></td></tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="card">
        <div style="font-weight:700;font-size:15px;margin-bottom:10px">🔑 角色权限</div>
        <div class="table-wrap" style="border:none">
          <table>
            <thead><tr><th>角色</th><th>用户数</th><th>权限</th></tr></thead>
            <tbody>
              <tr><td>超级管理员</td><td>2</td><td><span class="badge badge-purple">全部</span></td></tr>
              <tr><td>队长</td><td>12</td><td><span class="badge badge-progress">本队管理</span></td></tr>
              <tr><td>救援人员</td><td>142</td><td><span class="badge badge-gray">执行</span></td></tr>
              <tr><td>飞手</td><td>8</td><td><span class="badge badge-cyan">无人机</span></td></tr>
              <tr><td>医疗</td><td>15</td><td><span class="badge badge-gray">医疗</span></td></tr>
              <tr><td>调度员</td><td>7</td><td><span class="badge badge-warning" style="background:rgba(245,158,11,.2);color:var(--warning)">调度</span></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <div class="card" style="margin-top:14px">
      <div style="font-weight:700;font-size:15px;margin-bottom:10px">📜 审计日志</div>
      <div class="table-wrap" style="border:none">
        <table>
          <thead><tr><th>时间</th><th>用户</th><th>操作</th><th>对象</th><th>IP</th></tr></thead>
          <tbody>
            <tr><td>16:42</td><td>张建国</td><td><span class="badge badge-progress">创建任务</span></td><td>TSK-0704-001</td><td>10.0.1.12</td></tr>
            <tr><td>16:30</td><td>刘志强</td><td><span class="badge badge-done">接受任务</span></td><td>TSK-0704-002</td><td>10.0.1.25</td></tr>
            <tr><td>16:20</td><td>系统</td><td><span class="badge badge-urgent">SOS 接入</span></td><td>SOS-0704-001</td><td>—</td></tr>
            <tr><td>15:50</td><td>王飞宇</td><td><span class="badge badge-purple">无人机起飞</span></td><td>DR-001</td><td>10.0.1.45</td></tr>
            <tr><td>15:30</td><td>张建国</td><td><span class="badge badge-done">任务归档</span></td><td>TSK-0704-002</td><td>10.0.1.12</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `,

  // ---------- 死信治理（对象式 View） ----------
  outbox: () => OutboxView.render(),

  // ---------- 多端协同 ----------
  collab: () => `
    <div class="page-header">
      <div>
        <div class="page-title">🔗 多端协同</div>
        <div class="page-subtitle">Web · APP · 小程序 三端联动场景演示</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary btn-sm" onclick="toast('已启动协同演练')">🎬 启动协同演练</button>
      </div>
    </div>
    <div class="card" style="border-left:3px solid var(--success);margin-bottom:14px">
      <div style="font-weight:700;font-size:15px;margin-bottom:10px">🎯 场景一：市民 SOS 求助全链路</div>
      <div class="flow-container" style="margin-bottom:0">
        <div class="flow-steps">
          <div class="flow-node" onclick="goPage('mini-sos')" style="cursor:pointer"><div class="flow-node-title">📱 小程序</div><div class="flow-node-desc">市民一键求助</div></div>
          <div class="flow-arrow">→</div>
          <div class="flow-node" onclick="goPage('sos')" style="cursor:pointer"><div class="flow-node-title">🖥️ Web 后台</div><div class="flow-node-desc">指挥中心接报</div></div>
          <div class="flow-arrow">→</div>
          <div class="flow-node" onclick="goPage('app-task-detail')" style="cursor:pointer"><div class="flow-node-title">📲 APP</div><div class="flow-node-desc">救援人员出动</div></div>
          <div class="flow-arrow">→</div>
          <div class="flow-node" onclick="goPage('gis')" style="cursor:pointer"><div class="flow-node-title">🗺️ GIS</div><div class="flow-node-desc">实时态势跟踪</div></div>
          <div class="flow-arrow">→</div>
          <div class="flow-node" onclick="goPage('app-sos-detail')" style="cursor:pointer"><div class="flow-node-title">✅ 完成</div><div class="flow-node-desc">市民收到反馈</div></div>
        </div>
      </div>
    </div>
    <div class="card" style="border-left:3px solid var(--purple);margin-bottom:14px">
      <div style="font-weight:700;font-size:15px;margin-bottom:10px">🎯 场景二：任务派发与执行</div>
      <div class="flow-container" style="margin-bottom:0">
        <div class="flow-steps">
          <div class="flow-node" onclick="goPage('task')" style="cursor:pointer"><div class="flow-node-title">🖥️ Web</div><div class="flow-node-desc">指挥中心创建任务</div></div>
          <div class="flow-arrow">→</div>
          <div class="flow-node" onclick="goPage('app-commander')" style="cursor:pointer"><div class="flow-node-title">📲 APP 队长</div><div class="flow-node-desc">接受并指派</div></div>
          <div class="flow-arrow">→</div>
          <div class="flow-node" onclick="goPage('app-rescuer')" style="cursor:pointer"><div class="flow-node-title">📲 APP 队员</div><div class="flow-node-desc">领取装备出发</div></div>
          <div class="flow-arrow">→</div>
          <div class="flow-node" onclick="goPage('app-equip-scan')" style="cursor:pointer"><div class="flow-node-title">📷 扫码</div><div class="flow-node-desc">装备出库</div></div>
          <div class="flow-arrow">→</div>
          <div class="flow-node" onclick="goPage('app-location')" style="cursor:pointer"><div class="flow-node-title">📍 位置</div><div class="flow-node-desc">实时回传</div></div>
          <div class="flow-arrow">→</div>
          <div class="flow-node" onclick="goPage('report')" style="cursor:pointer"><div class="flow-node-title">📈 报表</div><div class="flow-node-desc">数据归档</div></div>
        </div>
      </div>
    </div>
    <div class="card" style="border-left:3px solid var(--accent);margin-bottom:14px">
      <div style="font-weight:700;font-size:15px;margin-bottom:10px">🎯 场景三：无人机指挥救援</div>
      <div class="flow-container" style="margin-bottom:0">
        <div class="flow-steps">
          <div class="flow-node" onclick="goPage('app-flight-plan')" style="cursor:pointer"><div class="flow-node-title">🗺️ 航线</div><div class="flow-node-desc">飞手规划航线</div></div>
          <div class="flow-arrow">→</div>
          <div class="flow-node" onclick="goPage('app-drone-video')" style="cursor:pointer"><div class="flow-node-title">📡 图传</div><div class="flow-node-desc">实时图传</div></div>
          <div class="flow-arrow">→</div>
          <div class="flow-node" onclick="goPage('app-video-wall')" style="cursor:pointer"><div class="flow-node-title">🎥 视频墙</div><div class="flow-node-desc">指挥大屏观看</div></div>
          <div class="flow-arrow">→</div>
          <div class="flow-node" onclick="goPage('app-decision')" style="cursor:pointer"><div class="flow-node-title">🧠 AI</div><div class="flow-node-desc">目标识别</div></div>
          <div class="flow-arrow">→</div>
          <div class="flow-node" onclick="goPage('app-swarm')" style="cursor:pointer"><div class="flow-node-title">🎯 集群</div><div class="flow-node-desc">多机协同</div></div>
        </div>
      </div>
    </div>
    <div class="card" style="border-left:3px solid var(--cyan)">
      <div style="font-weight:700;font-size:15px;margin-bottom:10px">🎯 场景四：志愿者招募与培训</div>
      <div class="flow-container" style="margin-bottom:0">
        <div class="flow-steps">
          <div class="flow-node" onclick="goPage('mini-volunteer')" style="cursor:pointer"><div class="flow-node-title">📱 小程序</div><div class="flow-node-desc">志愿者报名</div></div>
          <div class="flow-arrow">→</div>
          <div class="flow-node" onclick="goPage('dashboard')" style="cursor:pointer"><div class="flow-node-title">🖥️ Web</div><div class="flow-node-desc">审核通过</div></div>
          <div class="flow-arrow">→</div>
          <div class="flow-node" onclick="goPage('mini-training')" style="cursor:pointer"><div class="flow-node-title">📱 小程序</div><div class="flow-node-desc">报名培训</div></div>
          <div class="flow-arrow">→</div>
          <div class="flow-node" onclick="goPage('training')" style="cursor:pointer"><div class="flow-node-title">🖥️ Web</div><div class="flow-node-desc">培训管理</div></div>
          <div class="flow-arrow">→</div>
          <div class="flow-node" onclick="goPage('cert')" style="cursor:pointer"><div class="flow-node-title">📜 证书</div><div class="flow-node-desc">颁发证书</div></div>
        </div>
      </div>
    </div>
  `,

  // ---------- 默认页 ----------
  default: () => `<div class="page-header"><div class="page-title">🚧 页面建设中</div></div><div class="card"><p style="color:var(--text2)">该功能模块正在开发中，敬请期待。</p></div>`,
};

// ============ AI 决策 View（数据驱动 + 嵌入 AI 对话） ============
const WebDecisionView = {
  pageId: 'web-decision',
  render() {
    const pendingSos = DB.sos.filter(s => s.status === 'pending').length;
    const idleTeams = DB.teams.filter(t => t.status === 'idle').length;
    const warningEquip = DB.equipment.filter(e => e.status === 'warning').length;
    const availableMembers = DB.members.filter(m => m.status === 'online' || m.status === 'busy').length;
    const idleDrones = DB.devices.filter(d => d.type === '无人机' && d.status !== 'flying' && d.battery > 30).length;
    const availableEquip = DB.equipment.reduce((s, e) => s + e.available, 0);

    return `
      <div class="page-header">
        <div>
          <div class="page-title">🤖 AI 智能决策</div>
          <div class="page-subtitle">大模型驱动 · 实时态势分析 · 智能调度建议 · 对话式交互</div>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary btn-sm" onclick="WebDecisionView.refresh()">🔄 刷新分析</button>
          <button class="btn btn-danger btn-sm" onclick="WebDecisionView.riskReport()">⚠️ 风险评估</button>
          <button class="btn btn-warning btn-sm" onclick="WebDecisionView.dispatch()">⚡ 一键调度</button>
        </div>
      </div>
      <div class="card" style="border-left:3px solid var(--purple);margin-bottom:14px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <div style="font-weight:700;font-size:15px">🧠 AI 实时态势研判</div>
          <span class="badge badge-purple">基于系统实时数据 · 自动生成</span>
        </div>
        <div id="webDecisionAnalysis" style="font-size:13px;line-height:1.9;color:var(--text)">${AI.situationalAnalysis()}</div>
      </div>
      <div class="grid grid-3">
        <div class="card" style="cursor:pointer" onclick="WebDecisionView.historyCases()">
          <div style="font-weight:700;font-size:13px;margin-bottom:8px">📊 历史相似案例</div>
          <div style="font-size:12px;color:var(--text2);line-height:1.8">
            ${AI.historyCases().map(c => `<p>📌 ${c.time} ${c.name}</p>`).join('')}
          </div>
          <button class="btn btn-secondary btn-xs" style="margin-top:8px">查看详情</button>
        </div>
        <div class="card" style="cursor:pointer" onclick="WebDecisionView.riskReport()">
          <div style="font-weight:700;font-size:13px;margin-bottom:8px">🚨 实时风险预警</div>
          <div style="font-size:12px;color:var(--text2);line-height:1.8">
            ${pendingSos >= 3 ? `<p style="color:var(--danger)">🔴 SOS 待响应 ${pendingSos} 起</p>` : '<p style="color:var(--success)">🟢 SOS 响应正常</p>'}
            ${idleTeams <= 1 ? `<p style="color:var(--warning)">🟡 待命队伍仅 ${idleTeams} 支</p>` : '<p style="color:var(--success)">🟢 队伍储备充足</p>'}
            ${warningEquip ? `<p style="color:var(--warning)">🟡 ${warningEquip} 件装备预警</p>` : '<p style="color:var(--success)">🟢 装备状态正常</p>'}
          </div>
          <button class="btn btn-warning btn-xs" style="margin-top:8px">生成报告</button>
        </div>
        <div class="card">
          <div style="font-weight:700;font-size:13px;margin-bottom:8px">📈 资源预测</div>
          <div style="font-size:12px;color:var(--text2);line-height:1.8">
            <p>👥 可用人员：${availableMembers} 人</p>
            <p>🚒 待命队伍：${idleTeams} 支</p>
            <p>🚁 待飞无人机：${idleDrones} 架</p>
            <p>🎒 可用装备：${availableEquip} 件</p>
          </div>
          <button class="btn btn-primary btn-xs" style="margin-top:8px" onclick="WebDecisionView.dispatch()">立即调度</button>
        </div>
      </div>
      <div class="card" style="margin-top:14px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <div style="font-weight:700;font-size:15px">🤖 AI 对话助手 · 可询问任意救援问题</div>
          <button class="btn btn-secondary btn-xs" onclick="AI.clear('web-decision')">🗑️ 清空对话</button>
        </div>
        ${AI.chatContainer('web-decision', {maxHeight:'380px'})}
      </div>
    `;
  },
  refresh() {
    const box = document.getElementById('webDecisionAnalysis');
    if (box) {
      box.innerHTML = AI.situationalAnalysis();
      toast('🔄 态势分析已刷新');
    }
  },
  dispatch() {
    showModal('⚡ AI 一键调度建议', `<div style="font-size:13px;line-height:1.9;color:var(--text)">${AI.dispatchSuggestion()}</div>`, '采纳方案', () => {
      toast('✅ 已采纳 AI 调度方案，任务已分配');
    });
  },
  riskReport() {
    showModal('⚠️ AI 风险评估报告', `<div style="font-size:13px;line-height:1.9;color:var(--text)">${AI.riskAssessment()}</div>`, '关闭');
  },
  historyCases() {
    const cases = AI.historyCases();
    showModal('📊 历史相似案例', `<div style="font-size:13px;line-height:1.9;color:var(--text)">${cases.map(c => `<p><strong>📌 ${c.time} ${c.name}</strong><br>${c.desc}<br><span style="color:var(--text2)">匹配关键词：${c.match}</span></p>`).join('<hr style="border-color:var(--border);margin:8px 0">')}</div>`, '关闭');
  },
};

