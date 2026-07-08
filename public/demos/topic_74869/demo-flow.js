// ============ 援力通 2.0 端到端救援流程演示 ============
// 亮点页面：完整业务闭环，可交互推进步骤
// SOS接报 → 任务创建 → 队伍调度 → 现场处置 → 实时追踪 → 任务完成 → 复盘报告

const Flow = {
  // 当前步骤
  current: 0,
  steps: [
    {key:'report',  name:'SOS 接报',     icon:'🆘', time:'16:20'},
    {key:'create',  name:'任务创建',     icon:'📋', time:'16:22'},
    {key:'dispatch',name:'队伍调度',     icon:'🚒', time:'16:25'},
    {key:'enroute', name:'途中追踪',     icon:'🛣️', time:'16:30'},
    {key:'arrive',  name:'到场处置',     icon:'🚑', time:'16:45'},
    {key:'progress',name:'实时进展',     icon:'📈', time:'17:20'},
    {key:'done',    name:'任务完成',     icon:'✅', time:'18:10'},
    {key:'review',  name:'复盘报告',     icon:'📊', time:'18:30'},
  ],

  // ---------- 主入口 ----------
  render() {
    return `
    <div class="page-header">
      <div>
        <div class="page-title">🎯 端到端救援流程演示</div>
        <div class="page-subtitle">完整业务闭环 · 可交互推进 · 展示援力通 2.0 全链路价值</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary btn-sm" onclick="Flow.restart()">🔄 重置</button>
        <button class="btn btn-primary btn-sm" onclick="Flow.auto()">⏩ 自动播放</button>
      </div>
    </div>

    <!-- 流程步骤条 -->
    <div class="flow-container" style="margin-bottom:14px">
      <div class="flow-steps" style="overflow-x:auto;padding-bottom:6px">
        ${this.steps.map((s, i) => `
          <div class="flow-node ${i === this.current ? 'current' : i < this.current ? 'done' : ''}" onclick="Flow.go(${i})" style="cursor:pointer;${i === this.current ? 'border-color:var(--accent);background:rgba(245,158,11,.1)' : i < this.current ? 'border-color:var(--success);background:rgba(16,185,129,.08)' : ''}">
            <div style="font-size:22px;margin-bottom:4px">${i < this.current ? '✅' : s.icon}</div>
            <div class="flow-node-title">${s.name}</div>
            <div class="flow-node-desc">${s.time}</div>
          </div>
          ${i < this.steps.length - 1 ? `<div class="flow-arrow" style="${i < this.current ? 'color:var(--success)' : ''}">→</div>` : ''}
        `).join('')}
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px;padding-top:12px;border-top:1px solid var(--border)">
        <div style="font-size:12px;color:var(--text2)">步骤 <strong style="color:var(--accent)">${this.current + 1}</strong> / ${this.steps.length} · 当前: <strong style="color:var(--text)">${this.steps[this.current].name}</strong></div>
        <div style="display:flex;gap:6px">
          ${this.current > 0 ? `<button class="btn btn-secondary btn-sm" onclick="Flow.prev()">← 上一步</button>` : ''}
          ${this.current < this.steps.length - 1 ? `<button class="btn btn-primary btn-sm" onclick="Flow.next()">下一步 →</button>` : `<button class="btn btn-success btn-sm" onclick="Flow.restart()">🔄 重新开始</button>`}
        </div>
      </div>
    </div>

    <div id="flowStage">${this.stage()}</div>
    `;
  },

  // ---------- 步骤内容 ----------
  stage() {
    const step = this.steps[this.current];
    const stageRender = this['stage_' + step.key];
    return stageRender ? stageRender.call(this) : `<div class="card">步骤内容</div>`;
  },

  // 步骤1：SOS 接报
  stage_report() {
    return `
    <div class="grid grid-2">
      <div class="card">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
          <div style="width:48px;height:48px;border-radius:50%;background:var(--danger);display:flex;align-items:center;justify-content:center;font-size:24px;animation:pulseD 1s infinite">🆘</div>
          <div>
            <div style="font-weight:700;font-size:16px;color:var(--danger)">SOS 求助信号接入</div>
            <div style="font-size:12px;color:var(--text2)">2026-07-04 16:20:15 · 来源：微信小程序</div>
          </div>
        </div>
        <div style="background:var(--bg2);border-radius:10px;padding:14px;margin-bottom:14px">
          <div style="display:grid;grid-template-columns:auto 1fr;gap:8px 14px;font-size:13px">
            <span style="color:var(--text2)">求助类型：</span><span style="color:var(--danger);font-weight:600">人员落水（一级紧急）</span>
            <span style="color:var(--text2)">求助人：</span><span>王女士</span>
            <span style="color:var(--text2)">联系电话：</span><span>138****6677</span>
            <span style="color:var(--text2)">被困人数：</span><span style="color:var(--accent);font-weight:600">1 人</span>
            <span style="color:var(--text2)">事发地点：</span><span>城北水库东岸</span>
            <span style="color:var(--text2)">坐标：</span><span style="font-family:monospace">116.40°E, 39.96°N</span>
          </div>
          <div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border)">
            <div style="color:var(--text2);font-size:12px;margin-bottom:4px">情况描述：</div>
            <div style="color:var(--text)">1人落水，水流湍急，急需救援</div>
          </div>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-success" onclick="Flow.next()">✓ 受理并创建任务</button>
          <button class="btn btn-secondary" onclick="showModal('联系求助人', Forms.call('138****6677'), '呼叫')">📞 联系求助人</button>
        </div>
      </div>

      <div class="card">
        <div style="font-weight:700;font-size:15px;margin-bottom:12px">📍 事发位置 GIS 定位</div>
        <div class="map-box" style="height:280px">
          <div class="map-bg"></div>
          <div class="map-grid"></div>
          <div class="map-marker m-sos" style="top:35%;left:50%;transform:translate(-50%,-50%);width:40px;height:40px;font-size:18px">🆘</div>
          <div class="map-marker m-team" style="top:60%;left:30%">🚒</div>
          <div class="map-marker m-team" style="top:70%;left:65%">🚒</div>
          <div class="map-marker m-drone" style="top:25%;left:70%">🚁</div>
          <div class="map-info">📍 城北水库 · 距最近队伍 3.2km</div>
          <div class="map-legend">
            <div class="legend-item"><div class="legend-dot" style="background:var(--danger)"></div>SOS 求助点</div>
            <div class="legend-item"><div class="legend-dot" style="background:var(--primary-light)"></div>附近队伍</div>
            <div class="legend-item"><div class="legend-dot" style="background:var(--purple)"></div>无人机</div>
          </div>
        </div>
        <div style="margin-top:12px;padding:10px;background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.3);border-radius:8px;font-size:12px;color:var(--warning)">
          ⚠️ 系统自动分析：附近 3km 内有 <strong>2 支</strong>可调度队伍，<strong>1 架</strong>无人机可先行抵达侦查
        </div>
      </div>
    </div>
    `;
  },

  // 步骤2：任务创建
  stage_create() {
    return `
    <div class="grid grid-2">
      <div class="card">
        <div style="font-weight:700;font-size:15px;margin-bottom:12px">📋 任务创建表单（已自动填充）</div>
        <div style="background:var(--bg2);border-radius:10px;padding:14px">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 14px;font-size:13px">
            <div><div style="color:var(--text2);font-size:11px">任务编号</div><div style="font-family:monospace;color:var(--accent)">TSK-20260704-007</div></div>
            <div><div style="color:var(--text2);font-size:11px">任务类型</div><div>水上救援</div></div>
            <div><div style="color:var(--text2);font-size:11px">优先级</div><div><span class="badge badge-urgent">紧急</span></div></div>
            <div><div style="color:var(--text2);font-size:11px">任务名称</div><div>城北水库落水人员救援</div></div>
            <div style="grid-column:span 2"><div style="color:var(--text2);font-size:11px">事发地点</div><div>城北水库东岸（116.40°E, 39.96°N）</div></div>
            <div style="grid-column:span 2"><div style="color:var(--text2);font-size:11px">任务描述</div><div>1人落水，水流湍急，急需冲锋舟支援</div></div>
            <div><div style="color:var(--text2);font-size:11px">所需资源</div><div>冲锋舟 1 艘、救生衣 5 件、救生圈 3 个</div></div>
            <div><div style="color:var(--text2);font-size:11px">建议队伍</div><div>水域救援组（3.2km）</div></div>
          </div>
        </div>
        <div style="display:flex;gap:8px;margin-top:14px">
          <button class="btn btn-success" onclick="Flow.next()">✓ 确认创建并下发</button>
          <button class="btn btn-secondary" onclick="toast('已保存为草稿')">保存草稿</button>
        </div>
      </div>

      <div class="card">
        <div style="font-weight:700;font-size:15px;margin-bottom:12px">🤖 AI 智能分析建议</div>
        <div style="background:linear-gradient(135deg,rgba(139,92,246,.15),rgba(59,130,246,.05));border:1px solid rgba(139,92,246,.3);border-radius:10px;padding:14px;margin-bottom:10px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            <span style="font-size:18px">🧠</span>
            <span style="font-weight:600;color:var(--purple)">AI 决策引擎分析</span>
          </div>
          <ul style="font-size:12px;color:var(--text);line-height:1.8;list-style:none;padding-left:0">
            <li>📊 历史相似案例 <strong>28 起</strong>，平均救援时长 <strong>42 分钟</strong></li>
            <li>⚠️ 当前水位较昨日上涨 <strong>0.8m</strong>，建议增加 <strong>1 艘冲锋舟</strong> 备用</li>
            <li>🚁 建议同步派遣 <strong>无人机</strong> 先行侦查定位落水者</li>
            <li>🏥 距离最近三甲医院 <strong>5.6km</strong>，建议同步通知 <strong>120 急救</strong></li>
            <li>📞 已自动生成 <strong>政府应急上报</strong> 草稿（III级响应）</li>
          </ul>
        </div>
        <div style="font-size:11px;color:var(--text3);text-align:center">💡 AI 建议基于历史数据、实时水文、气象、交通多源数据综合分析</div>
      </div>
    </div>
    `;
  },

  // 步骤3：队伍调度
  stage_dispatch() {
    return `
    <div class="grid grid-2">
      <div class="card">
        <div style="font-weight:700;font-size:15px;margin-bottom:12px">🚒 智能调度建议</div>
        <div style="display:flex;flex-direction:column;gap:10px">
          ${DB.teams.filter(t => t.type === '水上救援' || t.type === '无人机' || t.type === '医疗救援').map(t => `
            <div style="background:var(--bg2);border-radius:10px;padding:12px;border-left:3px solid ${t.status === 'idle' ? 'var(--success)' : 'var(--warning)'}">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                <div style="font-weight:600">${t.name} ${statusBadge(t.status)}</div>
                <div style="font-size:11px;color:var(--text2)">距离 ${(Math.random()*5+2).toFixed(1)}km</div>
              </div>
              <div style="font-size:12px;color:var(--text2);margin-bottom:8px">队长 ${t.leader} · 可用 ${t.available}/${t.members} 人 · ${t.type}</div>
              <button class="btn btn-primary btn-sm" onclick="toast('${t.name} 已接受调度，正在集结')">调度 ${t.name}</button>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="card">
        <div style="font-weight:700;font-size:15px;margin-bottom:12px">🎒 装备自动配置</div>
        <div style="background:var(--bg2);border-radius:10px;padding:12px;margin-bottom:10px">
          <div style="font-size:12px;color:var(--text2);margin-bottom:8px">基于任务类型 AI 推荐装备清单：</div>
          ${DB.equipment.filter(e => ['冲锋舟','救生衣','救生圈','急救箱'].some(k => e.name.includes(k)) || e.category === '防护类').slice(0,5).map(e => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border)">
              <div style="font-size:12px">${e.name} <span style="color:var(--text3);font-size:11px">(${e.model})</span></div>
              <div style="display:flex;align-items:center;gap:8px">
                <span style="font-size:11px;color:var(--text2)">可用 ${e.available}/${e.total}</span>
                <input type="number" value="${Math.min(2, e.available)}" min="0" max="${e.available}" style="width:50px;background:var(--card);border:1px solid var(--border);color:var(--text);border-radius:4px;padding:2px 6px;font-size:11px">
              </div>
            </div>
          `).join('')}
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-success" onclick="Flow.next()">✓ 确认调度并出发</button>
          <button class="btn btn-secondary" onclick="toast('已通知装备库管理员出库')">通知出库</button>
        </div>
      </div>
    </div>
    `;
  },

  // 步骤4：途中追踪
  stage_enroute() {
    return `
    <div class="grid grid-2">
      <div class="card">
        <div style="font-weight:700;font-size:15px;margin-bottom:12px">🛣️ 实时位置追踪</div>
        <div class="map-box" style="height:340px">
          <div class="map-bg"></div>
          <div class="map-grid"></div>
          <div class="map-marker m-sos" style="top:30%;left:60%;width:36px;height:36px">🆘</div>
          <div class="map-marker m-team" style="top:70%;left:25%;animation:moveToSos 3s infinite">🚒</div>
          <div class="map-marker m-drone" style="top:50%;left:45%;animation:pulse 2s infinite">🚁</div>
          <svg style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none">
            <path d="M 25% 70% Q 40% 50% 60% 30%" fill="none" stroke="var(--primary-light)" stroke-width="2" stroke-dasharray="5,5" opacity="0.6"/>
          </svg>
          <div class="map-info">🚒 水域救援组 · 距现场 1.8km · 预计 4 分钟</div>
          <div class="map-legend">
            <div class="legend-item"><div class="legend-dot" style="background:var(--danger)"></div>求助点</div>
            <div class="legend-item"><div class="legend-dot" style="background:var(--primary-light)"></div>救援队</div>
            <div class="legend-item"><div class="legend-dot" style="background:var(--purple)"></div>无人机</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div style="font-weight:700;font-size:15px;margin-bottom:12px">📞 多端实时通讯</div>
        <div style="display:flex;flex-direction:column;gap:8px">
          <div style="background:var(--bg2);border-radius:10px;padding:12px">
            <div style="display:flex;justify-content:space-between;margin-bottom:6px"><span style="font-weight:600;font-size:13px">📹 视频连线 · 无人机</span><span class="badge badge-purple">实时</span></div>
            <div style="background:#000;height:100px;border-radius:8px;display:flex;align-items:center;justify-content:center;color:var(--text2);font-size:12px;position:relative;overflow:hidden">
              <div style="position:absolute;inset:0;background:linear-gradient(135deg,#1e293b,#0f172a)"></div>
              <div style="position:absolute;top:10px;left:10px;background:rgba(239,68,68,.8);color:#fff;padding:2px 6px;border-radius:4px;font-size:10px">● REC 00:08:32</div>
              <div style="position:absolute;bottom:10px;left:10px;font-size:10px;color:#94a3b8">DJI-M300-001 · 高度 120m</div>
              <div style="position:relative;z-index:1">🚁 实时图传</div>
            </div>
            <div style="font-size:11px;color:var(--text2);margin-top:6px">已定位落水者位置，水流速度 1.2m/s</div>
          </div>
          <div style="background:var(--bg2);border-radius:10px;padding:12px">
            <div style="display:flex;justify-content:space-between;margin-bottom:6px"><span style="font-weight:600;font-size:13px">💬 集群对讲 · 救援组</span><span class="badge badge-success">在线 6 人</span></div>
            <div style="font-size:12px;line-height:1.8">
              <div><strong>张志强：</strong>各单位注意，预计 4 分钟抵达现场</div>
              <div><strong>陈海军：</strong>收到，冲锋舟准备就绪</div>
              <div><strong>孙飞翔：</strong>无人机已锁定目标，坐标已同步</div>
            </div>
          </div>
          <div style="background:var(--bg2);border-radius:10px;padding:12px">
            <div style="display:flex;justify-content:space-between;margin-bottom:6px"><span style="font-weight:600;font-size:13px">📍 位置共享 · 求助人</span><span class="badge badge-urgent">SOS 进行中</span></div>
            <div style="font-size:12px;color:var(--text2)">求助人位置每 5 秒更新一次，已同步至所有救援单位</div>
          </div>
        </div>
        <button class="btn btn-success" style="width:100%;margin-top:12px" onclick="Flow.next()">✓ 救援队已抵达现场</button>
      </div>
    </div>
    `;
  },

  // 步骤5：到场处置
  stage_arrive() {
    return `
    <div class="grid grid-2">
      <div class="card">
        <div style="font-weight:700;font-size:15px;margin-bottom:12px">🚑 现场处置记录</div>
        <div style="background:var(--bg2);border-radius:10px;padding:14px">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 14px;font-size:13px">
            <div><div style="color:var(--text2);font-size:11px">到场时间</div><div>16:45:12</div></div>
            <div><div style="color:var(--text2);font-size:11px">现场指挥</div><div>张志强</div></div>
            <div><div style="color:var(--text2);font-size:11px">到场人员</div><div>水域救援组 6 人</div></div>
            <div><div style="color:var(--text2);font-size:11px">携带装备</div><div>冲锋舟 1 艘、救生衣 6 件、救生圈 3 个</div></div>
            <div style="grid-column:span 2"><div style="color:var(--text2);font-size:11px">现场情况</div><div>落水者抓住树枝漂浮，意识清醒，距岸约 15 米</div></div>
          </div>
        </div>
        <div style="margin-top:14px">
          <div style="font-weight:600;font-size:13px;margin-bottom:8px">处置措施（可勾选）：</div>
          <div style="display:flex;flex-direction:column;gap:6px;font-size:12px">
            <label style="display:flex;align-items:center;gap:8px;background:var(--bg2);padding:8px 10px;border-radius:6px;cursor:pointer"><input type="checkbox" checked> 冲锋舟下水接近落水者</label>
            <label style="display:flex;align-items:center;gap:8px;background:var(--bg2);padding:8px 10px;border-radius:6px;cursor:pointer"><input type="checkbox" checked> 抛投救生圈备用</label>
            <label style="display:flex;align-items:center;gap:8px;background:var(--bg2);padding:8px 10px;border-radius:6px;cursor:pointer"><input type="checkbox" checked> 无人机持续监控</label>
            <label style="display:flex;align-items:center;gap:8px;background:var(--bg2);padding:8px 10px;border-radius:6px;cursor:pointer"><input type="checkbox"> 通知 120 急救待命</label>
            <label style="display:flex;align-items:center;gap:8px;background:var(--bg2);padding:8px 10px;border-radius:6px;cursor:pointer"><input type="checkbox"> 现场警戒疏散</label>
          </div>
        </div>
        <button class="btn btn-success" style="width:100%;margin-top:14px" onclick="Flow.next()">✓ 开始救援处置</button>
      </div>

      <div class="card">
        <div style="font-weight:700;font-size:15px;margin-bottom:12px">📊 现场实时态势</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
          <div style="background:var(--bg2);border-radius:8px;padding:10px;text-align:center">
            <div style="font-size:11px;color:var(--text2)">水位</div>
            <div style="font-size:22px;font-weight:700;color:var(--warning)">+0.8m</div>
            <div style="font-size:10px;color:var(--danger)">↑ 上涨中</div>
          </div>
          <div style="background:var(--bg2);border-radius:8px;padding:10px;text-align:center">
            <div style="font-size:11px;color:var(--text2)">流速</div>
            <div style="font-size:22px;font-weight:700;color:var(--accent)">1.2m/s</div>
            <div style="font-size:10px;color:var(--text2)">→ 偏东</div>
          </div>
          <div style="background:var(--bg2);border-radius:8px;padding:10px;text-align:center">
            <div style="font-size:11px;color:var(--text2)">能见度</div>
            <div style="font-size:22px;font-weight:700;color:var(--success)">良好</div>
            <div style="font-size:10px;color:var(--text2)">2.5km</div>
          </div>
          <div style="background:var(--bg2);border-radius:8px;padding:10px;text-align:center">
            <div style="font-size:11px;color:var(--text2)">天气</div>
            <div style="font-size:22px;font-weight:700;color:var(--primary-light)">小雨</div>
            <div style="font-size:10px;color:var(--text2)">24°C</div>
          </div>
        </div>
        <div style="background:rgba(139,92,246,.1);border:1px solid rgba(139,92,246,.3);border-radius:10px;padding:12px;font-size:12px">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px"><span>🧠</span><strong style="color:var(--purple)">AI 实时建议</strong></div>
          <ul style="color:var(--text);line-height:1.7;list-style:none;padding-left:0">
            <li>⚠️ 水流速度加快，建议 10 分钟内完成救援</li>
            <li>✅ 冲锋舟应从下游 30° 角接近落水者</li>
            <li>📢 已自动通知下游 2km 处设置第二道拦截点</li>
          </ul>
        </div>
      </div>
    </div>
    `;
  },

  // 步骤6：实时进展
  stage_progress() {
    return `
    <div class="card" style="margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <div style="font-weight:700;font-size:15px">📈 救援进展时间线</div>
        <span class="badge badge-progress">救援中 · 已用时 35 分钟</span>
      </div>
      <div class="timeline">
        <div class="timeline-item done"><div class="timeline-time">16:20</div><div class="timeline-content"><strong>SOS 接报</strong> · 王女士报警，1人落水</div></div>
        <div class="timeline-item done"><div class="timeline-time">16:22</div><div class="timeline-content"><strong>任务创建</strong> · TSK-20260704-007 自动生成</div></div>
        <div class="timeline-item done"><div class="timeline-time">16:25</div><div class="timeline-content"><strong>队伍调度</strong> · 水域救援组 6 人 + 无人机 1 架</div></div>
        <div class="timeline-item done"><div class="timeline-time">16:45</div><div class="timeline-content"><strong>抵达现场</strong> · 冲锋舟下水</div></div>
        <div class="timeline-item done"><div class="timeline-time">17:05</div><div class="timeline-content"><strong>接近落水者</strong> · 距离 5 米</div></div>
        <div class="timeline-item done"><div class="timeline-time">17:15</div><div class="timeline-content"><strong>成功救起</strong> · 落水者已上船，意识清醒</div></div>
        <div class="timeline-item"><div class="timeline-time">17:20</div><div class="timeline-content"><strong>医学检查</strong> · 进行中...</div></div>
        <div class="timeline-item"><div class="timeline-time">~18:10</div><div class="timeline-content"><strong>预计完成</strong> · 转交 120 急救</div></div>
      </div>
    </div>

    <div class="grid grid-2">
      <div class="card">
        <div style="font-weight:700;font-size:15px;margin-bottom:12px">📹 实时图传</div>
        <div style="background:#000;height:200px;border-radius:10px;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden">
          <div style="position:absolute;inset:0;background:linear-gradient(135deg,#0a0f1e,#1e293b)"></div>
          <div style="position:absolute;top:10px;left:10px;background:rgba(239,68,68,.8);color:#fff;padding:2px 6px;border-radius:4px;font-size:10px">● REC 01:00:15</div>
          <div style="position:absolute;top:10px;right:10px;background:rgba(0,0,0,.6);color:#fff;padding:2px 6px;border-radius:4px;font-size:10px">📡 信号良好</div>
          <div style="position:relative;z-index:1;text-align:center">
            <div style="font-size:36px">🚁🚤</div>
            <div style="color:#cbd5e1;font-size:12px;margin-top:6px">无人机视角 · 冲锋舟正在靠岸</div>
          </div>
          <div style="position:absolute;bottom:10px;left:10px;font-size:10px;color:#94a3b8">高度 80m · 速度 5m/s</div>
        </div>
        <div style="display:flex;gap:6px;margin-top:10px">
          <button class="btn btn-secondary btn-sm" onclick="toast('已切换至冲锋舟视角')">🚤 冲锋舟</button>
          <button class="btn btn-secondary btn-sm" onclick="toast('已切换至无人机视角')">🚁 无人机</button>
          <button class="btn btn-secondary btn-sm" onclick="toast('已切换至岸上视角')">📷 岸上</button>
        </div>
      </div>

      <div class="card">
        <div style="font-weight:700;font-size:15px;margin-bottom:12px">💾 资源消耗实时监控</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div style="text-align:center">
            ${Charts.ring(75, {label:'人员体力', color:'#10b981', size:100})}
          </div>
          <div style="text-align:center">
            ${Charts.ring(62, {label:'装备燃料', color:'#f59e0b', size:100})}
          </div>
        </div>
        <div style="margin-top:14px">
          ${Charts.barH('冲锋舟燃油', 62, 100, {color:'#f59e0b'})}
          ${Charts.barH('无人机电池', 45, 100, {color:'#ef4444'})}
          ${Charts.barH('对讲机电量', 78, 100, {color:'#10b981'})}
        </div>
      </div>
    </div>

    <div style="margin-top:14px;text-align:center">
      <button class="btn btn-success btn-lg" style="padding:12px 32px;font-size:15px" onclick="Flow.next()">✓ 救援完成，转交 120 急救 →</button>
    </div>
    `;
  },

  // 步骤7：任务完成
  stage_done() {
    return `
    <div class="card" style="text-align:center;padding:30px;margin-bottom:14px;background:linear-gradient(135deg,rgba(16,185,129,.15),rgba(59,130,246,.05));border:1px solid rgba(16,185,129,.3)">
      <div style="font-size:64px;margin-bottom:14px">🎉</div>
      <div style="font-size:24px;font-weight:700;color:var(--success);margin-bottom:8px">任务圆满完成</div>
      <div style="color:var(--text2);font-size:14px">城北水库落水人员救援 · 用时 1 小时 50 分钟</div>
    </div>

    <div class="stats-grid">
      <div class="stat-card success"><div class="stat-label">救援人员</div><div class="stat-value">6</div><div class="stat-trend">水域救援组</div></div>
      <div class="stat-card"><div class="stat-label">使用装备</div><div class="stat-value">10</div><div class="stat-trend">冲锋舟等</div></div>
      <div class="stat-card warning"><div class="stat-label">救援时长</div><div class="stat-value">1h50m</div><div class="stat-trend trend-up">较平均 -8 分钟</div></div>
      <div class="stat-card purple"><div class="stat-label">无人机飞行</div><div class="stat-value">110</div><div class="stat-trend">分钟</div></div>
    </div>

    <div class="grid grid-2">
      <div class="card">
        <div style="font-weight:700;font-size:15px;margin-bottom:12px">✅ 完成清单</div>
        <ul style="font-size:13px;line-height:2;list-style:none;padding-left:0">
          <li>✓ 落水者已安全救起并转交 120</li>
          <li>✓ 装备已清点归还入库</li>
          <li>✓ 现场已清理，无遗留物</li>
          <li>✓ 政府应急上报已自动提交</li>
          <li>✓ 救援过程视频已归档</li>
          <li>✓ 参与人员考勤已自动记录</li>
        </ul>
      </div>
      <div class="card">
        <div style="font-weight:700;font-size:15px;margin-bottom:12px">📊 关键指标</div>
        ${Charts.barH('响应时间', 5, 15, {color:'#10b981'})}
        ${Charts.barH('到达时间', 25, 30, {color:'#3b82f6'})}
        ${Charts.barH('救援效率', 92, 100, {color:'#10b981'})}
        ${Charts.barH('协同评分', 88, 100, {color:'#8b5cf6'})}
      </div>
    </div>

    <div style="margin-top:14px;text-align:center">
      <button class="btn btn-primary btn-lg" style="padding:12px 32px;font-size:15px" onclick="Flow.next()">📊 查看复盘报告 →</button>
    </div>
    `;
  },

  // 步骤8：复盘报告
  stage_review() {
    return `
    <div class="card" style="margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <div style="font-weight:700;font-size:15px">📊 救援复盘报告</div>
        <div style="display:flex;gap:6px">
          <button class="btn btn-secondary btn-sm" onclick="toast('已导出 PDF')">📥 导出 PDF</button>
          <button class="btn btn-secondary btn-sm" onclick="toast('已分享至上级单位')">📤 分享</button>
        </div>
      </div>
      <div style="background:var(--bg2);border-radius:10px;padding:14px;margin-bottom:14px">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 14px;font-size:13px">
          <div><span style="color:var(--text2)">任务编号：</span>TSK-20260704-007</div>
          <div><span style="color:var(--text2)">任务类型：</span>水上救援</div>
          <div><span style="color:var(--text2)">开始时间：</span>2026-07-04 16:20</div>
          <div><span style="color:var(--text2)">结束时间：</span>2026-07-04 18:10</div>
          <div><span style="color:var(--text2)">总时长：</span>1 小时 50 分钟</div>
          <div><span style="color:var(--text2)">结果：</span><span class="badge badge-done">成功</span></div>
        </div>
      </div>
    </div>

    <div class="grid grid-2">
      <div class="card">
        <div style="font-weight:700;font-size:14px;margin-bottom:10px">📈 近 7 日任务趋势</div>
        ${Charts.line([
          {label:'6/28', value:5},
          {label:'6/29', value:8},
          {label:'6/30', value:6},
          {label:'7/01', value:9},
          {label:'7/02', value:7},
          {label:'7/03', value:11},
          {label:'7/04', value:8},
        ], {height:200})}
      </div>
      <div class="card">
        <div style="font-weight:700;font-size:14px;margin-bottom:10px">🥧 任务类型分布</div>
        ${Charts.pie([
          {label:'洪水救援', value:8},
          {label:'山地搜救', value:5},
          {label:'水上救援', value:4},
          {label:'医疗救护', value:3},
          {label:'物资运送', value:2},
          {label:'无人机航拍', value:1},
        ])}
      </div>
      <div class="card">
        <div style="font-weight:700;font-size:14px;margin-bottom:10px">📊 各队伍任务量</div>
        ${Charts.bar([
          {label:'救援一队', value:18},
          {label:'救援二队', value:12},
          {label:'水域组', value:9},
          {label:'医疗组', value:7},
          {label:'飞手组', value:5},
          {label:'运输组', value:6},
        ])}
      </div>
      <div class="card">
        <div style="font-weight:700;font-size:14px;margin-bottom:10px">🎯 队伍能力雷达</div>
        ${Charts.radar([
          {label:'响应速度', value:92},
          {label:'专业技能', value:88},
          {label:'装备水平', value:85},
          {label:'协同能力', value:90},
          {label:'安全记录', value:95},
          {label:'培训完成', value:82},
        ])}
      </div>
    </div>

    <div class="card" style="margin-top:14px">
      <div style="font-weight:700;font-size:15px;margin-bottom:12px">💡 AI 复盘建议</div>
      <div style="background:linear-gradient(135deg,rgba(139,92,246,.15),rgba(59,130,246,.05));border:1px solid rgba(139,92,246,.3);border-radius:10px;padding:14px">
        <ul style="font-size:13px;line-height:1.9;list-style:none;padding-left:0">
          <li>✅ <strong>响应迅速</strong>：从接报到到场仅 25 分钟，优于行业平均 35 分钟</li>
          <li>✅ <strong>协同高效</strong>：三端联动（小程序报警 → 后台调度 → APP 执行）顺畅</li>
          <li>⚠️ <strong>改进点</strong>：装备燃料消耗略高，建议优化冲锋舟接近路线</li>
          <li>⚠️ <strong>改进点</strong>：夜间救援照明设备不足，建议增配防水手电</li>
          <li>📈 <strong>趋势</strong>：本月水上救援同比增加 35%，建议加强水域专项培训</li>
          <li>🎯 <strong>建议</strong>：推荐水域救援组参加高级水域救援师认证培训</li>
        </ul>
      </div>
    </div>

    <div style="margin-top:14px;text-align:center">
      <button class="btn btn-success btn-lg" style="padding:12px 32px;font-size:15px" onclick="Flow.restart()">🔄 演示完成，重新开始</button>
    </div>
    `;
  },

  // ---------- 控制函数 ----------
  next() {
    if (this.current < this.steps.length - 1) {
      this.current++;
      this.refresh();
      toast('▶ ' + this.steps[this.current].name);
    }
  },
  prev() {
    if (this.current > 0) {
      this.current--;
      this.refresh();
    }
  },
  go(i) {
    this.current = i;
    this.refresh();
  },
  restart() {
    this.current = 0;
    this.refresh();
    toast('🔄 已重置流程演示');
  },
  refresh() {
    // 重新渲染整个流程页面（保留当前步骤状态）
    const content = document.getElementById('content');
    if (content) content.innerHTML = this.render();
    content.scrollTop = 0;
  },
  auto() {
    toast('⏩ 开始自动播放');
    let i = this.current;
    const timer = setInterval(() => {
      if (i >= this.steps.length - 1) {
        clearInterval(timer);
        toast('✅ 演示完成');
        return;
      }
      this.next();
      i++;
    }, 3000);
  },
};
