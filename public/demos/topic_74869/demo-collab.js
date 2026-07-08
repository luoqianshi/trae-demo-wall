// ============ 援力通 2.0 三端协同演示 ============
// 同一救援事件在 Web 管理后台 / 微信小程序 / Flutter APP 三端的联动展示
// 分屏对比，展示多端协同价值

const Collab = {
  // 历史回放事件（硬编码初始事件，展示完整救援链路）
  _initialEvents: [
    {time:'16:20:15', platform:'mini',  icon:'🆘', title:'市民小程序 SOS 报警', desc:'王女士通过小程序发起 SOS，定位城北水库', impact:'web 接收告警 + app 推送通知'},
    {time:'16:20:18', platform:'web',   icon:'📡', title:'Web 后台自动接报', desc:'SOS 信号接入指挥中心，GIS 自动定位', impact:'web 高亮显示 + 推送 app 队长'},
    {time:'16:20:25', platform:'app',   icon:'📲', title:'APP 推送通知队长', desc:'救援一队队长张志强 APP 收到紧急通知', impact:'app 弹窗 + 震动 + 语音播报'},
    {time:'16:22:00', platform:'web',   icon:'📋', title:'Web 后台创建任务', desc:'指挥员基于 AI 建议创建救援任务', impact:'web 任务下发 + app 接收任务'},
    {time:'16:22:30', platform:'app',   icon:'✅', title:'APP 队长接受任务', desc:'张志强在 APP 上一键接受任务', impact:'app 状态同步至 web'},
    {time:'16:25:00', platform:'app',   icon:'🚒', title:'APP 调度队伍出发', desc:'队长在 APP 上调度队员，全员签到', impact:'app 实时位置共享至 web GIS'},
    {time:'16:30:00', platform:'mini',  icon:'📍', title:'小程序求助人位置更新', desc:'求助人小程序持续上报位置', impact:'mini 位置同步至 web + app'},
    {time:'16:45:12', platform:'app',   icon:'🚑', title:'APP 到场签到', desc:'救援队 APP 扫码签到，开始处置', impact:'app 现场视频回传 web'},
    {time:'17:15:00', platform:'app',   icon:'🎉', title:'APP 上报救援成功', desc:'落水者被救起，APP 上报完成', impact:'app 同步 web + mini 通知求助人'},
    {time:'17:15:30', platform:'mini',  icon:'✅', title:'小程序通知求助人', desc:'求助人小程序收到救援完成通知', impact:'mini 评价 + web 归档'},
    {time:'18:10:00', platform:'web',   icon:'📊', title:'Web 后台生成复盘报告', desc:'自动汇总多端数据，生成复盘', impact:'web AI 分析 + 三端归档'},
  ],

  // 实时模式开关：开启后合并 DB.crossEvents 实时事件
  liveMode: false,

  // events getter：实时模式下合并 DB.crossEvents
  get events() {
    if (!this.liveMode) return this._initialEvents;
    const live = (DB.crossEvents || []).map(e => ({
      time: e.time, platform: e.platform, icon: e.icon,
      title: e.title, desc: e.desc, impact: e.impact, live: true,
    }));
    return [...live, ...this._initialEvents].slice(0, 20);
  },

  render() {
    return `
    <div class="page-header">
      <div>
        <div class="page-title">🔗 三端协同演示</div>
        <div class="page-subtitle">同一救援事件 · Web + 小程序 + APP 实时联动 · 展示多端协同价值</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-warning btn-sm" onclick="Collab.triggerSOSFromMini()">🆘 模拟小程序SOS</button>
        <button class="btn btn-secondary btn-sm" onclick="Collab.toggleLive()">${this.liveMode ? '⏸ 关闭实时' : '📡 开启实时'}</button>
        <button class="btn btn-secondary btn-sm" onclick="Collab.replay()">🔄 重新播放</button>
        <button class="btn btn-primary btn-sm" onclick="Collab.play()">▶ 自动播放</button>
      </div>
    </div>

    <!-- 三端分屏对比 -->
    <div class="collab-split">
      <div class="collab-panel web">
        <div class="collab-header" style="background:linear-gradient(135deg,var(--primary),var(--primary-dark))">
          <span style="font-size:18px">🖥️</span>
          <span>Web 管理后台</span>
          <span class="collab-tag">指挥员视角</span>
        </div>
        <div class="collab-body" id="collabWeb">
          <div style="text-align:center;color:var(--text2);padding:40px 0;font-size:13px">等待事件触发...</div>
        </div>
      </div>
      <div class="collab-panel mini">
        <div class="collab-header" style="background:linear-gradient(135deg,#06b6d4,#0891b2)">
          <span style="font-size:18px">📱</span>
          <span>微信小程序</span>
          <span class="collab-tag">市民视角</span>
        </div>
        <div class="collab-body" id="collabMini">
          <div style="text-align:center;color:var(--text2);padding:40px 0;font-size:13px">等待事件触发...</div>
        </div>
      </div>
      <div class="collab-panel app">
        <div class="collab-header" style="background:linear-gradient(135deg,#8b5cf6,#7c3aed)">
          <span style="font-size:18px">📲</span>
          <span>Flutter APP</span>
          <span class="collab-tag">救援人员视角</span>
        </div>
        <div class="collab-body" id="collabApp">
          <div style="text-align:center;color:var(--text2);padding:40px 0;font-size:13px">等待事件触发...</div>
        </div>
      </div>
    </div>

    <!-- 共享事件时间线 -->
    <div class="card" style="margin-top:14px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <div style="font-weight:700;font-size:15px">📡 多端事件时间线</div>
        <div style="font-size:12px;color:var(--text2)">点击任意事件查看多端联动效果</div>
      </div>
      <div id="collabTimeline">
        ${this.events.map((e, i) => `
          <div class="collab-event" data-idx="${i}" onclick="Collab.show(${i})" style="display:flex;gap:12px;padding:10px;border-radius:8px;cursor:pointer;transition:.25s;border:1px solid transparent;${i === 0 ? 'background:rgba(59,130,246,.1);border-color:rgba(59,130,246,.3)' : ''}">
            <div style="width:60px;flex-shrink:0;font-size:11px;color:var(--text2);font-family:monospace;padding-top:2px">${e.time}</div>
            <div style="width:36px;height:36px;border-radius:50%;background:var(--bg2);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">${e.icon}</div>
            <div style="flex:1;min-width:0">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px">
                <span style="font-weight:600;font-size:13px">${e.title}</span>
                ${e.live ? '<span class="badge badge-done" style="font-size:9px;animation:pulse 1.5s infinite">● LIVE</span>' : ''}
                <span class="badge badge-${e.platform === 'web' ? 'progress' : e.platform === 'mini' ? 'cyan' : 'purple'}">${e.platform}</span>
              </div>
              <div style="font-size:12px;color:var(--text2)">${e.desc}</div>
              <div style="font-size:11px;color:var(--text3);margin-top:4px">↔ ${e.impact}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- 协同价值统计 -->
    <div class="stats-grid" style="margin-top:14px">
      <div class="stat-card success"><div class="stat-label">响应时间节省</div><div class="stat-value">68%</div><div class="stat-trend trend-up">较传统方式</div></div>
      <div class="stat-card"><div class="stat-label">多端同步延迟</div><div class="stat-value">&lt;3s</div><div class="stat-trend">实时联动</div></div>
      <div class="stat-card purple"><div class="stat-label">数据一致性</div><div class="stat-value">100%</div><div class="stat-trend trend-up">单一数据源</div></div>
      <div class="stat-card warning"><div class="stat-label">覆盖用户数</div><div class="stat-value">3端</div><div class="stat-trend">全场景</div></div>
    </div>
    `;
  },

  // 显示指定事件的联动效果
  show(idx) {
    const e = this.events[idx];
    // 更新时间线高亮
    document.querySelectorAll('.collab-event').forEach((el, i) => {
      if (i === idx) {
        el.style.background = 'rgba(59,130,246,.1)';
        el.style.borderColor = 'rgba(59,130,246,.3)';
      } else {
        el.style.background = '';
        el.style.borderColor = 'transparent';
      }
    });
    // 更新三端分屏
    this.renderWeb(e);
    this.renderMini(e);
    this.renderApp(e);
    toast('📡 ' + e.title);
  },

  renderWeb(e) {
    const el = document.getElementById('collabWeb');
    if (!el) return;
    const isRelevant = e.platform === 'web';
    el.innerHTML = `
      <div style="background:var(--bg2);border-radius:8px;padding:10px;margin-bottom:8px;height:120px;position:relative;overflow:hidden">
        <div style="position:absolute;inset:0;background:radial-gradient(circle at 30% 40%,rgba(59,130,246,.2),transparent 60%),linear-gradient(135deg,#0a0f1e,#1e293b)"></div>
        <div style="position:absolute;inset:0;background-image:linear-gradient(rgba(59,130,246,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,.08) 1px,transparent 1px);background-size:20px 20px"></div>
        <div style="position:relative;z-index:1;display:flex;align-items:center;justify-content:center;height:100%">
          ${isRelevant ? `
            <div style="text-align:center">
              <div style="font-size:28px;margin-bottom:4px">${e.icon}</div>
              <div style="font-size:11px;color:var(--primary-light);font-weight:600">${e.title}</div>
              <div style="font-size:10px;color:var(--success);margin-top:4px">● 当前活跃</div>
            </div>
          ` : `
            <div style="text-align:center;color:var(--text3)">
              <div style="font-size:24px;opacity:0.4">🖥️</div>
              <div style="font-size:10px;margin-top:4px">${e.platform === 'mini' ? '接收小程序数据' : e.platform === 'app' ? '接收 APP 数据' : '等待'}</div>
            </div>
          `}
        </div>
      </div>
      <div style="font-size:11px;color:var(--text2);line-height:1.6">
        <div><strong style="color:var(--text)">${e.time}</strong> · ${e.title}</div>
        <div style="margin-top:4px;color:var(--text3)">${e.impact}</div>
      </div>
    `;
  },

  renderMini(e) {
    const el = document.getElementById('collabMini');
    if (!el) return;
    const isRelevant = e.platform === 'mini';
    el.innerHTML = `
      <div style="background:#000;border-radius:12px;padding:4px;margin-bottom:8px">
        <div style="background:var(--bg);border-radius:8px;height:120px;position:relative;overflow:hidden;display:flex;flex-direction:column">
          <div style="background:linear-gradient(135deg,#06b6d4,#0891b2);padding:6px 10px;font-size:11px;font-weight:600;color:#fff">援力通 · 应急助手</div>
          <div style="flex:1;padding:8px;display:flex;align-items:center;justify-content:center">
            ${isRelevant ? `
              <div style="text-align:center">
                <div style="font-size:24px;margin-bottom:4px">${e.icon}</div>
                <div style="font-size:10px;color:#06b6d4;font-weight:600">${e.title}</div>
                <div style="font-size:9px;color:var(--success);margin-top:2px">● 当前活跃</div>
              </div>
            ` : `
              <div style="text-align:center;color:var(--text3)">
                <div style="font-size:20px;opacity:0.4">📱</div>
                <div style="font-size:9px;margin-top:2px">${e.platform === 'web' ? '后台处理中' : e.platform === 'app' ? '救援队处理中' : '等待'}</div>
              </div>
            `}
          </div>
        </div>
      </div>
      <div style="font-size:11px;color:var(--text2);line-height:1.6">
        <div><strong style="color:var(--text)">${e.time}</strong> · ${e.title}</div>
        <div style="margin-top:4px;color:var(--text3)">${e.impact}</div>
      </div>
    `;
  },

  renderApp(e) {
    const el = document.getElementById('collabApp');
    if (!el) return;
    const isRelevant = e.platform === 'app';
    el.innerHTML = `
      <div style="background:#000;border-radius:12px;padding:4px;margin-bottom:8px">
        <div style="background:var(--bg);border-radius:8px;height:120px;position:relative;overflow:hidden;display:flex;flex-direction:column">
          <div style="background:linear-gradient(135deg,#8b5cf6,#7c3aed);padding:6px 10px;font-size:11px;font-weight:600;color:#fff">援力通 · 救援端</div>
          <div style="flex:1;padding:8px;display:flex;align-items:center;justify-content:center">
            ${isRelevant ? `
              <div style="text-align:center">
                <div style="font-size:24px;margin-bottom:4px">${e.icon}</div>
                <div style="font-size:10px;color:#8b5cf6;font-weight:600">${e.title}</div>
                <div style="font-size:9px;color:var(--success);margin-top:2px">● 当前活跃</div>
              </div>
            ` : `
              <div style="text-align:center;color:var(--text3)">
                <div style="font-size:20px;opacity:0.4">📲</div>
                <div style="font-size:9px;margin-top:2px">${e.platform === 'web' ? '指挥中心处理中' : e.platform === 'mini' ? '市民端处理中' : '等待'}</div>
              </div>
            `}
          </div>
        </div>
      </div>
      <div style="font-size:11px;color:var(--text2);line-height:1.6">
        <div><strong style="color:var(--text)">${e.time}</strong> · ${e.title}</div>
        <div style="margin-top:4px;color:var(--text3)">${e.impact}</div>
      </div>
    `;
  },

  // 自动播放
  _timer: null,
  play() {
    if (this._timer) { clearInterval(this._timer); this._timer = null; toast('⏸ 已暂停'); return; }
    toast('▶ 开始自动播放协同演示');
    let i = 0;
    this.show(0);
    this._timer = setInterval(() => {
      i++;
      if (i >= this.events.length) {
        clearInterval(this._timer);
        this._timer = null;
        toast('✅ 协同演示完成');
        return;
      }
      this.show(i);
    }, 2500);
  },
  replay() {
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
    this.show(0);
    toast('🔄 已重置');
  },

  // 切换实时模式：开启后三端操作实时同步到时间线
  toggleLive() {
    this.liveMode = !this.liveMode;
    this.refreshTimeline();
    if (this.liveMode) {
      // 订阅跨端事件，新事件自动追加到时间线顶部
      if (!this._liveSub) {
        this._liveSub = true;
        Store.on('cross:update', () => { if (this.liveMode) this.refreshTimeline(); });
      }
      toast('📡 实时模式已开启，三端操作将实时同步到此时间线');
    } else {
      toast('⏸ 实时模式已关闭，显示历史回放事件');
    }
  },

  // 局部刷新时间线（不重渲染整个页面）
  refreshTimeline() {
    const el = document.getElementById('collabTimeline');
    if (!el) return;
    el.innerHTML = this.events.map((e, i) => `
      <div class="collab-event" data-idx="${i}" onclick="Collab.show(${i})" style="display:flex;gap:12px;padding:10px;border-radius:8px;cursor:pointer;transition:.25s;border:1px solid transparent;${i === 0 ? 'background:rgba(59,130,246,.1);border-color:rgba(59,130,246,.3)' : ''}">
        <div style="width:60px;flex-shrink:0;font-size:11px;color:var(--text2);font-family:monospace;padding-top:2px">${e.time}</div>
        <div style="width:36px;height:36px;border-radius:50%;background:var(--bg2);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">${e.icon}</div>
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px">
            <span style="font-weight:600;font-size:13px">${e.title}</span>
            ${e.live ? '<span class="badge badge-done" style="font-size:9px;animation:pulse 1.5s infinite">● LIVE</span>' : ''}
            <span class="badge badge-${e.platform === 'web' ? 'progress' : e.platform === 'mini' ? 'cyan' : 'purple'}">${e.platform}</span>
          </div>
          <div style="font-size:12px;color:var(--text2)">${e.desc}</div>
          <div style="font-size:11px;color:var(--text3);margin-top:4px">↔ ${e.impact}</div>
        </div>
      </div>
    `).join('');
  },

  // 模拟小程序发起 SOS（三端联动触发器）
  triggerSOSFromMini(type, location) {
    const newSos = Store.actionFrom('mini', 'sos', 'add', {
      type: type || '人员落水',
      level: 1,
      status: 'pending',
      reporter: '小程序用户',
      phone: '138****' + String(Math.floor(Math.random() * 9000 + 1000)),
      location: location || '城北水库东岸',
      lng: 116.40, lat: 39.96,
      time: new Date().toTimeString().slice(0, 5),
      desc: '小程序发起的紧急求助',
      count: 1,
    });
    toast(`🆘 小程序已发起 SOS：${newSos.type}（${newSos.location}）→ 已同步至 Web 后台`);
    return newSos;
  },

  // 模拟 APP 接受任务
  triggerAcceptFromApp(taskId) {
    const task = Store.get('tasks', taskId || (DB.tasks[0] && DB.tasks[0].id));
    if (!task) { toast('任务不存在'); return; }
    Store.actionFrom('app', 'tasks', 'update', { id: task.id, status: 'progress', progress: 10 });
    toast(`📲 APP 已接受任务：${task.name} → 已同步至 Web 后台`);
  },
};
