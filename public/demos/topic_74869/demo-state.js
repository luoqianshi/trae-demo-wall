// ============ 援力通 2.0 交互式状态管理 ============
// 模拟数据库 + CRUD + 事件订阅 + 状态流转
// 所有数据均在内存中，刷新页面后重置

const DB = {
  // ---------- 任务 ----------
  tasks: [
    {id:'TSK-20260704-001', name:'城南河道洪水救援', type:'洪水救援', priority:'urgent', status:'progress', team:'救援一队', leader:'张志强', members:12, location:'城南街道低洼区域', lng:116.42, lat:39.92, createdAt:'14:30', progress:60, desc:'连续暴雨导致积水严重，约200名居民需转移'},
    {id:'TSK-20260704-002', name:'北山迷路驴友搜救', type:'山地搜救', priority:'high', status:'done', team:'救援二队', leader:'李建国', members:8, location:'北山森林公园', lng:116.38, lat:39.95, createdAt:'12:10', progress:100, desc:'3名驴友迷路，已安全找到并护送下山'},
    {id:'TSK-20260704-003', name:'城东交通事故救援', type:'医疗救护', priority:'high', status:'progress', team:'医疗救援组', leader:'王晓明', members:6, location:'城东高速出口', lng:116.48, lat:39.90, createdAt:'15:00', progress:45, desc:'两车追尾，2人受伤需现场救治'},
    {id:'TSK-20260704-004', name:'水上救援-落水人员', type:'水上救援', priority:'urgent', status:'progress', team:'水域救援组', leader:'陈海军', members:6, location:'城北水库', lng:116.40, lat:39.96, createdAt:'16:20', progress:30, desc:'1人落水，正在组织冲锋舟搜救'},
    {id:'TSK-20260704-005', name:'物资运送-安置点', type:'物资运送', priority:'normal', status:'pending', team:'运输组A', leader:'赵大勇', members:4, location:'城西安置点', lng:116.35, lat:39.88, createdAt:'15:45', progress:0, desc:'运送医疗物资50箱至城西安置点'},
    {id:'TSK-20260704-006', name:'无人机航拍-灾情评估', type:'无人机航拍', priority:'normal', status:'progress', team:'飞手组', leader:'孙飞翔', members:2, location:'灾区全域', lng:116.41, lat:39.93, createdAt:'14:00', progress:70, desc:'对灾区进行航拍评估，生成正射影像'},
    {id:'TSK-20260703-018', name:'西山森林火情扑救', type:'火灾救援', priority:'urgent', status:'done', team:'救援一队', leader:'张志强', members:15, location:'西山林区', lng:116.30, lat:39.94, createdAt:'昨日 10:20', progress:100, desc:'森林火情已扑灭，正在进行余火清理'},
  ],

  // ---------- SOS 求助 ----------
  sos: [
    {id:'SOS-001', type:'人员落水', level:1, status:'pending', reporter:'王女士', phone:'138****6677', location:'城北水库东岸', lng:116.40, lat:39.96, time:'16:20', desc:'1人落水，水流湍急，急需救援', count:1},
    {id:'SOS-002', type:'人员迷路', level:2, status:'progress', reporter:'登山队', phone:'139****8899', location:'北山主峰', lng:116.38, lat:39.96, time:'15:10', desc:'3人迷路，天色渐暗，需要引导', count:3},
    {id:'SOS-003', type:'人员被困', level:1, status:'pending', reporter:'李先生', phone:'137****5566', location:'城南低洼区', lng:116.42, lat:39.91, time:'16:05', desc:'5人被困屋顶，水位上涨', count:5},
    {id:'SOS-004', type:'缺物资', level:3, status:'done', reporter:'安置点', phone:'136****4455', location:'城西安置点', lng:116.35, lat:39.88, time:'14:00', desc:'安置点物资短缺，需要补给', count:120},
  ],

  // ---------- 队伍 ----------
  teams: [
    {id:'T-001', name:'救援一队', type:'综合救援', leader:'张志强', members:15, available:12, status:'busy', location:'城南街道', tasks:2, level:'甲级'},
    {id:'T-002', name:'救援二队', type:'山地救援', leader:'李建国', members:12, available:8, status:'idle', location:'基地', tasks:0, level:'甲级'},
    {id:'T-003', name:'水域救援组', type:'水上救援', leader:'陈海军', members:8, available:6, status:'busy', location:'城北水库', tasks:1, level:'甲级'},
    {id:'T-004', name:'医疗救援组', type:'医疗救援', leader:'王晓明', members:10, available:6, status:'busy', location:'城东高速', tasks:1, level:'乙级'},
    {id:'T-005', name:'运输组A', type:'物流运输', leader:'赵大勇', members:6, available:4, status:'idle', location:'基地', tasks:0, level:'乙级'},
    {id:'T-006', name:'飞手组', type:'无人机', leader:'孙飞翔', members:4, available:2, status:'busy', location:'灾区全域', tasks:1, level:'甲级'},
    {id:'T-007', name:'通讯保障组', type:'通讯', leader:'周信号', members:5, available:5, status:'idle', location:'基地', tasks:0, level:'乙级'},
  ],

  // ---------- 装备 ----------
  equipment: [
    {id:'EQ-001', name:'冲锋舟', category:'特种装备', model:'CZ-5.0', total:8, available:3, status:'normal', location:'装备库A', owner:'水域救援组'},
    {id:'EQ-002', name:'救生衣', category:'防护类', model:'JSJ-Ⅱ', total:120, available:42, status:'normal', location:'装备库A', owner:'共用'},
    {id:'EQ-003', name:'对讲机', category:'通讯类', model:'P-8R', total:50, available:18, status:'warning', location:'装备库B', owner:'通讯组', warning:'3 台电量低于 20%'},
    {id:'EQ-004', name:'担架', category:'医疗类', model:'DJ-折叠', total:20, available:12, status:'normal', location:'装备库B', owner:'医疗组'},
    {id:'EQ-005', name:'液压剪', category:'工具类', model:'YYJ-100', total:6, available:4, status:'normal', location:'装备库C', owner:'救援一队'},
    {id:'EQ-006', name:'无人机', category:'特种装备', model:'DJI-M300', total:5, available:2, status:'normal', location:'装备库C', owner:'飞手组'},
    {id:'EQ-007', name:'急救箱', category:'医疗类', model:'JJX-标准', total:30, available:15, status:'normal', location:'装备库B', owner:'医疗组'},
    {id:'EQ-008', name:'生命探测仪', category:'特种装备', model:'SMY-Ⅲ', total:3, available:2, status:'normal', location:'装备库C', owner:'救援一队'},
    {id:'EQ-009', name:'救援绳索', category:'防护类', model:'JY-100m', total:25, available:10, status:'normal', location:'装备库A', owner:'共用'},
    {id:'EQ-010', name:'卫星电话', category:'通讯类', model:'WXDH-便携', total:8, available:5, status:'normal', location:'装备库B', owner:'通讯组'},
  ],

  // ---------- 人员 ----------
  members: [
    {id:'M-001', name:'张志强', role:'队长', team:'救援一队', phone:'138****0001', status:'online', cert:'高级救援师', tasks:128, attendance:98},
    {id:'M-002', name:'李建国', role:'队长', team:'救援二队', phone:'138****0002', status:'online', cert:'山地救援师', tasks:96, attendance:95},
    {id:'M-003', name:'陈海军', role:'队长', team:'水域救援组', phone:'138****0003', status:'busy', cert:'水域救援师', tasks:78, attendance:96},
    {id:'M-004', name:'王晓明', role:'队长', team:'医疗救援组', phone:'138****0004', status:'busy', cert:'急救医师', tasks:65, attendance:92},
    {id:'M-005', name:'孙飞翔', role:'飞手', team:'飞手组', phone:'138****0005', status:'busy', cert:'无人机飞手证', tasks:42, attendance:99},
    {id:'M-006', name:'赵大勇', role:'队长', team:'运输组A', phone:'138****0006', status:'online', cert:'物流师', tasks:54, attendance:94},
    {id:'M-007', name:'周信号', role:'队长', team:'通讯保障组', phone:'138****0007', status:'online', cert:'通讯工程师', tasks:38, attendance:97},
    {id:'M-008', name:'刘救援', role:'队员', team:'救援一队', phone:'138****0008', status:'busy', cert:'中级救援师', tasks:56, attendance:93},
  ],

  // ---------- 培训 ----------
  trainings: [
    {id:'TR-001', name:'水域救援专项培训', type:'技能培训', trainer:'陈海军', capacity:30, enrolled:18, time:'2026-07-10 09:00', location:'训练池', status:'enrolling'},
    {id:'TR-002', name:'高空绳索救援', type:'技能培训', trainer:'李建国', capacity:20, enrolled:20, time:'2026-07-08 14:00', location:'训练塔', status:'full'},
    {id:'TR-003', name:'急救技能证书培训', type:'证书培训', trainer:'王晓明', capacity:40, enrolled:25, time:'2026-07-15 09:00', location:'培训中心', status:'enrolling'},
    {id:'TR-004', name:'灾后心理援助', type:'安全培训', trainer:'心理专家', capacity:50, enrolled:32, time:'2026-07-12 10:00', location:'会议室', status:'enrolling'},
    {id:'TR-005', name:'无人机航拍技术', type:'技能培训', trainer:'孙飞翔', capacity:15, enrolled:12, time:'2026-07-09 14:00', location:'飞行场', status:'enrolling'},
  ],

  // ---------- 设备 ----------
  devices: [
    {id:'D-001', name:'DJI-M300-001', type:'无人机', model:'M300 RTK', status:'flying', owner:'飞手组', battery:78, lat:39.93, lng:116.41, alt:120},
    {id:'D-002', name:'DJI-M300-002', type:'无人机', model:'M300 RTK', status:'flying', owner:'飞手组', battery:65, lat:39.94, lng:116.42, alt:150},
    {id:'D-003', name:'水位传感器-01', type:'IoT传感器', model:'WS-100', status:'online', owner:'通讯组', battery:88, lat:39.96, lng:116.40, alt:0},
    {id:'D-004', name:'水位传感器-02', type:'IoT传感器', model:'WS-100', status:'online', owner:'通讯组', battery:92, lat:39.91, lng:116.42, alt:0},
    {id:'D-005', name:'雨量计-01', type:'IoT传感器', model:'RG-200', status:'online', owner:'通讯组', battery:75, lat:39.93, lng:116.41, alt:0},
    {id:'D-006', name:'报警柱-01', type:'报警源', model:'BJ-柱', status:'online', owner:'共用', battery:100, lat:39.92, lng:116.43, alt:0},
  ],

  // ---------- 物流 ----------
  logistics: [
    {id:'LG-001', type:'应急物资', from:'中心仓库', to:'城西安置点', goods:'医疗物资50箱', vehicle:'货车2台', status:'transporting', driver:'赵大勇', eta:'30分钟', progress:55},
    {id:'LG-002', type:'装备物资', from:'装备库A', to:'城南现场', goods:'冲锋舟2艘+救生衣30件', vehicle:'平板车1台', status:'loading', driver:'刘运输', eta:'45分钟', progress:20},
    {id:'LG-003', type:'应急物资', from:'中心仓库', to:'城北水库', goods:'救生圈20个+绳索10条', vehicle:'皮卡1台', status:'delivered', driver:'孙运输', eta:'已送达', progress:100},
  ],

  // ---------- 消息 ----------
  messages: [
    {id:'MSG-001', type:'通知', title:'关于启动防汛III级应急响应的通知', from:'应急管理局', time:'16:30', status:'unread', priority:'urgent'},
    {id:'MSG-002', type:'预警', title:'暴雨橙色预警信号', from:'气象局', time:'15:45', status:'unread', priority:'high'},
    {id:'MSG-003', type:'任务', title:'新任务待接受-TSK-20260704-005', from:'指挥中心', time:'15:45', status:'unread', priority:'normal'},
    {id:'MSG-004', type:'审批', title:'救援三队装备申请待审批', from:'系统', time:'15:20', status:'unread', priority:'normal'},
    {id:'MSG-005', type:'通知', title:'本周救援演练安排', from:'训练部', time:'14:00', status:'read', priority:'normal'},
  ],

  // ---------- 死信队列 ----------
  outbox: [
    {id:'DL-001', queue:'task-service', msg:'SubmitInspection', reason:'service 端 RPC 未实现', time:'16:25', retry:3, status:'pending'},
    {id:'DL-002', queue:'training-service', msg:'EnrollTraining', reason:'容量已满', time:'15:30', retry:2, status:'resolved'},
    {id:'DL-003', queue:'message-service', msg:'DeleteAnnouncement', reason:'权限不足', time:'14:10', retry:1, status:'pending'},
  ],
};

// ============ 状态管理 ============
const Store = {
  // 事件订阅
  _listeners: {},
  on(event, cb) {
    (this._listeners[event] = this._listeners[event] || []).push(cb);
  },
  emit(event, data) {
    (this._listeners[event] || []).forEach(cb => cb(data));
  },

  // ---------- 通用查询 ----------
  list(collection, filter) {
    let arr = DB[collection] || [];
    if (filter) arr = arr.filter(filter);
    return arr;
  },
  get(collection, id) {
    return (DB[collection] || []).find(x => x.id === id);
  },

  // ---------- 任务 ----------
  addTask(task) {
    const id = 'TSK-20260704-' + String(DB.tasks.length + 1).padStart(3, '0');
    const newTask = {id, status:'pending', progress:0, createdAt: new Date().toTimeString().slice(0,5), ...task};
    DB.tasks.unshift(newTask);
    this.emit('task:add', newTask);
    return newTask;
  },
  updateTaskStatus(id, status, progress) {
    const t = this.get('tasks', id);
    if (!t) return;
    t.status = status;
    if (progress !== undefined) t.progress = progress;
    if (status === 'done') t.progress = 100;
    this.emit('task:update', t);
  },

  // ---------- SOS ----------
  acceptSOS(id) {
    const s = this.get('sos', id);
    if (s) { s.status = 'progress'; this.emit('sos:update', s); }
  },
  resolveSOS(id) {
    const s = this.get('sos', id);
    if (s) { s.status = 'done'; this.emit('sos:update', s); }
  },

  // ---------- 装备 ----------
  borrowEquipment(id, qty) {
    const e = this.get('equipment', id);
    if (!e || e.available < qty) return false;
    e.available -= qty;
    this.emit('equip:update', e);
    return true;
  },

  // ---------- 培训 ----------
  enrollTraining(id) {
    const t = this.get('trainings', id);
    if (!t || t.enrolled >= t.capacity) return false;
    t.enrolled++;
    if (t.enrolled === t.capacity) t.status = 'full';
    this.emit('training:update', t);
    return true;
  },

  // ---------- 消息 ----------
  markMessageRead(id) {
    const m = this.get('messages', id);
    if (m) { m.status = 'read'; this.emit('msg:update', m); }
  },

  // ---------- 统计 ----------
  stats() {
    return {
      tasksProgress: DB.tasks.filter(t => t.status === 'progress').length,
      tasksDone: DB.tasks.filter(t => t.status === 'done').length,
      tasksPending: DB.tasks.filter(t => t.status === 'pending').length,
      sosPending: DB.sos.filter(s => s.status === 'pending').length,
      sosProgress: DB.sos.filter(s => s.status === 'progress').length,
      teamsBusy: DB.teams.filter(t => t.status === 'busy').length,
      teamsIdle: DB.teams.filter(t => t.status === 'idle').length,
      membersOnline: DB.members.filter(m => m.status === 'online' || m.status === 'busy').length,
      dronesFlying: DB.devices.filter(d => d.type === '无人机' && d.status === 'flying').length,
      unreadMsgs: DB.messages.filter(m => m.status === 'unread').length,
      pendingOutbox: DB.outbox.filter(o => o.status === 'pending').length,
    };
  },

  // ---------- 通用 CRUD（自动 emit 事件） ----------
  _pageSubs: {},
  _idCounters: {tasks:100, sos:100, teams:100, equipment:100, members:100, trainings:100, devices:100, logistics:100, messages:100, outbox:100, maintenance:1, crossEvents:1, govReports:1, users:1, roles:1, certs:1, flightPlans:1},

  add(collection, item, opts = {}) {
    if (!DB[collection]) DB[collection] = [];
    const idField = opts.idField || 'id';
    const idPrefix = opts.idPrefix || (collection === 'tasks' ? 'TSK-' : collection === 'sos' ? 'SOS-' : collection === 'messages' ? 'MSG-' : collection === 'outbox' ? 'DL-' : (collection.slice(0,1).toUpperCase() + '-'));
    let id = item[idField];
    if (!id) {
      this._idCounters[collection] = (this._idCounters[collection] || 100) + 1;
      id = idPrefix + String(this._idCounters[collection]).padStart(3, '0');
    }
    const newItem = {...item, [idField]: id, createdAt: item.createdAt || new Date().toTimeString().slice(0,5)};
    DB[collection].unshift(newItem);
    this.emit(collection + ':add', newItem);
    this.emit('global:change', {collection, action: 'add', item: newItem});
    return newItem;
  },

  update(collection, id, patch) {
    const item = this.get(collection, id);
    if (!item) return null;
    Object.assign(item, patch);
    this.emit(collection + ':update', item);
    this.emit('global:change', {collection, action: 'update', item});
    return item;
  },

  remove(collection, id) {
    const arr = DB[collection] || [];
    const idx = arr.findIndex(x => x.id === id);
    if (idx < 0) return false;
    const [removed] = arr.splice(idx, 1);
    this.emit(collection + ':remove', removed);
    this.emit('global:change', {collection, action: 'remove', item: removed});
    return true;
  },

  batchUpdate(collection, ids, patch) {
    ids.forEach(id => this.update(collection, id, patch));
  },

  // ---------- 查询工具 ----------
  search(collection, keyword, fields) {
    if (!keyword) return DB[collection] || [];
    const kw = String(keyword).toLowerCase();
    return (DB[collection] || []).filter(item =>
      (fields || Object.keys(item)).some(f =>
        String(item[f] || '').toLowerCase().includes(kw)
      )
    );
  },

  query(collection, opts = {}) {
    let arr = DB[collection] ? DB[collection].slice() : [];
    if (opts.filter) arr = arr.filter(opts.filter);
    if (opts.keyword && opts.fields) {
      const kw = opts.keyword.toLowerCase();
      arr = arr.filter(item => opts.fields.some(f => String(item[f] || '').toLowerCase().includes(kw)));
    }
    if (opts.sort) arr.sort(opts.sort);
    const total = arr.length;
    if (opts.page && opts.pageSize) {
      const start = (opts.page - 1) * opts.pageSize;
      arr = arr.slice(start, start + opts.pageSize);
    }
    return {list: arr, total};
  },

  // ---------- 页面订阅管理 ----------
  subscribePage(pageId, events, handler) {
    this.cleanupPage(pageId);
    this._pageSubs[pageId] = events.map(ev => {
      const wrapped = (data) => { try { handler(data); } catch(e) { console.error('订阅回调错误:', e); } };
      this.on(ev, wrapped);
      return {event: ev, cb: wrapped};
    });
  },

  cleanupPage(pageId) {
    const subs = this._pageSubs[pageId];
    if (!subs) return;
    subs.forEach(s => {
      const arr = this._listeners[s.event] || [];
      const i = arr.indexOf(s.cb);
      if (i >= 0) arr.splice(i, 1);
    });
    delete this._pageSubs[pageId];
  },

  // ---------- 跨端事件总线 ----------
  logCrossEvent(platform, action, collection, item) {
    if (!DB.crossEvents) DB.crossEvents = [];
    const evt = {
      time: new Date().toTimeString().slice(0,8),
      platform,
      action,
      collection,
      itemId: item && item.id,
      title: item && (item.name || item.type || item.title || '新事件'),
      desc: `${platform}端 ${action} ${collection}`,
      icon: platform === 'web' ? '📡' : platform === 'mini' ? '🆘' : '📲',
      impact: platform === 'web' ? 'web 下发 + app/mini 同步' : platform === 'mini' ? 'web 接收 + app 推送' : 'web 同步 + mini 通知',
    };
    DB.crossEvents.unshift(evt);
    if (DB.crossEvents.length > 50) DB.crossEvents.length = 50;
    this.emit('cross:update', evt);
    return evt;
  },

  actionFrom(platform, collection, action, item) {
    let result;
    if (action === 'add') result = this.add(collection, item);
    else if (action === 'update') result = this.update(collection, item.id, item);
    else if (action === 'remove') result = this.remove(collection, item.id);
    if (result) this.logCrossEvent(platform, action, collection, item);
    return result;
  },
};

// ============ 工具函数 ============
// 根据状态返回徽章 HTML
function statusBadge(status) {
  const map = {
    pending: '<span class="badge badge-pending">待处理</span>',
    progress: '<span class="badge badge-progress">进行中</span>',
    done: '<span class="badge badge-done">已完成</span>',
    urgent: '<span class="badge badge-urgent">紧急</span>',
    high: '<span class="badge badge-urgent">高</span>',
    normal: '<span class="badge badge-progress">中</span>',
    low: '<span class="badge badge-gray">低</span>',
    busy: '<span class="badge badge-urgent">执行中</span>',
    idle: '<span class="badge badge-success">空闲</span>',
    online: '<span class="badge badge-done">在线</span>',
    offline: '<span class="badge badge-gray">离线</span>',
    flying: '<span class="badge badge-purple">飞行中</span>',
    transporting: '<span class="badge badge-progress">运输中</span>',
    loading: '<span class="badge badge-pending">装车中</span>',
    delivered: '<span class="badge badge-done">已送达</span>',
    enrolling: '<span class="badge badge-progress">报名中</span>',
    full: '<span class="badge badge-urgent">已满员</span>',
    warning: '<span class="badge badge-pending">预警</span>',
    unread: '<span class="badge badge-urgent">未读</span>',
    read: '<span class="badge badge-gray">已读</span>',
  };
  return map[status] || `<span class="badge badge-gray">${status}</span>`;
}

// 根据优先级返回颜色
function priorityColor(priority) {
  return {urgent:'var(--danger)', high:'var(--warning)', normal:'var(--primary-light)', low:'var(--text2)'}[priority] || 'var(--text2)';
}

// 模拟实时数据更新（多 tick，让评审看到真实数据流动）
function startLiveUpdate() {
  // ---------- 无人机电池+位置（5s） ----------
  setInterval(() => {
    DB.devices.filter(d => d.status === 'flying').forEach(d => {
      if (d.battery > 20) d.battery -= 1;
      d.lat += (Math.random() - 0.5) * 0.001;
      d.lng += (Math.random() - 0.5) * 0.001;
    });
    Store.emit('live:update', Store.stats());
    Store.emit('device:update', null);
  }, 5000);

  // ---------- 任务进度推进（8s） ----------
  setInterval(() => {
    DB.tasks.filter(t => t.status === 'progress' && t.progress < 100).forEach(t => {
      t.progress = Math.min(100, t.progress + Math.floor(Math.random() * 3) + 1);
      if (t.progress >= 100) { t.status = 'done'; Store.emit('task:update', t); }
    });
    Store.emit('task:update', null);
  }, 8000);

  // ---------- 物流进度推进（10s） ----------
  setInterval(() => {
    DB.logistics.filter(l => l.status !== 'delivered').forEach(l => {
      l.progress = Math.min(100, l.progress + Math.floor(Math.random() * 5) + 2);
      if (l.progress >= 100) { l.status = 'delivered'; l.eta = '已送达'; }
    });
    Store.emit('logistics:update', null);
  }, 10000);

  // ---------- 新 SOS 涌入（30s，让评审看到实时险情） ----------
  const sosTypes = ['人员落水','人员迷路','人员被困','缺物资','车辆事故'];
  const sosLocs = ['城东河道','北山景区','城南低洼区','城西路口','城北水库'];
  setInterval(() => {
    const newSos = {
      type: sosTypes[Math.floor(Math.random() * sosTypes.length)],
      level: Math.floor(Math.random() * 3) + 1,
      status: 'pending',
      reporter: '市民' + Math.floor(Math.random() * 1000),
      phone: '13' + String(Math.floor(Math.random() * 100000000)).padStart(8, '0'),
      location: sosLocs[Math.floor(Math.random() * sosLocs.length)],
      lng: 116.35 + Math.random() * 0.15,
      lat: 39.88 + Math.random() * 0.10,
      time: new Date().toTimeString().slice(0,5),
      desc: '自动接入的求助信号',
      count: Math.floor(Math.random() * 5) + 1,
    };
    Store.add('sos', newSos, {idPrefix: 'SOS-'});
    Store.logCrossEvent('mini', 'add', 'sos', newSos);
    toast('🆘 新 SOS 求助接入：' + newSos.type + ' @ ' + newSos.location, 'warning');
  }, 30000);

  // ---------- 新消息推送（20s） ----------
  const msgTitles = ['防汛预警升级','新任务待接受','装备申请审批','培训签到提醒','系统巡检完成'];
  setInterval(() => {
    const newMsg = {
      type: ['通知','预警','任务','审批'][Math.floor(Math.random() * 4)],
      title: msgTitles[Math.floor(Math.random() * msgTitles.length)],
      from: '系统',
      time: new Date().toTimeString().slice(0,5),
      status: 'unread',
      priority: ['urgent','high','normal'][Math.floor(Math.random() * 3)],
    };
    Store.add('messages', newMsg, {idPrefix: 'MSG-'});
  }, 20000);
}
