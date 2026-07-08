// ============ Flutter APP 页面（18 个） ============
const PagesApp = {
  // ---------- APP 救援人员端 ----------
  'app-rescuer': () => phoneFrame('救援人员工作台', `
    <div style="background:linear-gradient(135deg,#1e40af,#3b82f6);margin:-12px -12px 12px;padding:16px 12px;color:#fff">
      <div style="display:flex;align-items:center;gap:10px">
        <div style="width:42px;height:42px;background:rgba(255,255,255,.2);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:22px">🧑</div>
        <div style="flex:1"><div style="font-size:13px;font-weight:700">李救援 · 救援一队</div><div style="font-size:11px;opacity:.9">🟢 在岗 · 距驻地 1.2km</div></div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:10px;text-align:center">
      <div class="mini-card" style="padding:10px 4px"><div style="font-size:16px;font-weight:700;color:var(--primary-light)">${DB.tasks.length}</div><div style="font-size:10px;color:var(--text2)">今日任务</div></div>
      <div class="mini-card" style="padding:10px 4px"><div style="font-size:16px;font-weight:700;color:var(--success)">128</div><div style="font-size:10px;color:var(--text2)">累计救援</div></div>
      <div class="mini-card" style="padding:10px 4px"><div style="font-size:16px;font-weight:700;color:var(--accent)">86h</div><div style="font-size:10px;color:var(--text2)">本月工时</div></div>
    </div>
    <div style="background:#ef4444;color:#fff;padding:12px;border-radius:10px;margin-bottom:10px;cursor:pointer;text-align:center" onclick="goPage('app-sos-detail')">
      <div style="font-size:13px;font-weight:700">🚨 紧急任务待响应</div>
      <div style="font-size:10px;opacity:.9;margin-top:2px">城南河道 · 1 人落水</div>
    </div>
    <div style="font-size:12px;font-weight:700;margin-bottom:8px">⚡ 快捷操作</div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:12px">
      <div class="mini-card" style="text-align:center;padding:10px 4px;cursor:pointer" onclick="goPage('app-task-detail')"><div style="font-size:18px">📋</div><div style="font-size:10px;margin-top:3px">任务</div></div>
      <div class="mini-card" style="text-align:center;padding:10px 4px;cursor:pointer" onclick="goPage('app-equip-scan')"><div style="font-size:18px">📷</div><div style="font-size:10px;margin-top:3px">扫码</div></div>
      <div class="mini-card" style="text-align:center;padding:10px 4px;cursor:pointer" onclick="goPage('app-location')"><div style="font-size:18px">📍</div><div style="font-size:10px;margin-top:3px">位置</div></div>
      <div class="mini-card" style="text-align:center;padding:10px 4px;cursor:pointer" onclick="goPage('app-ai-chat')"><div style="font-size:18px">🤖</div><div style="font-size:10px;margin-top:3px">AI</div></div>
      <div class="mini-card" style="text-align:center;padding:10px 4px;cursor:pointer" onclick="goPage('app-sos-detail')"><div style="font-size:18px">🆘</div><div style="font-size:10px;margin-top:3px">SOS</div></div>
      <div class="mini-card" style="text-align:center;padding:10px 4px;cursor:pointer" onclick="goPage('app-attendance')"><div style="font-size:18px">⏰</div><div style="font-size:10px;margin-top:3px">考勤</div></div>
      <div class="mini-card" style="text-align:center;padding:10px 4px;cursor:pointer" onclick="goPage('app-contacts')"><div style="font-size:18px">📇</div><div style="font-size:10px;margin-top:3px">通讯录</div></div>
      <div class="mini-card" style="text-align:center;padding:10px 4px;cursor:pointer" onclick="toast('更多功能')"><div style="font-size:18px">⋯</div><div style="font-size:10px;margin-top:3px">更多</div></div>
    </div>
    <div style="font-size:12px;font-weight:700;margin-bottom:8px">📋 进行中任务（${DB.tasks.filter(t => t.status === 'progress' || t.status === 'pending').length}）</div>
    ${DB.tasks.filter(t => t.status === 'progress' || t.status === 'pending').map(t => `
    <div class="mini-card" style="${t.priority === 'urgent' ? 'border:1px solid var(--danger)' : 'border-left:3px solid var(--primary-light)'};margin-bottom:8px;cursor:pointer" onclick="window._currentTaskId='${t.id}';goPage('app-task-detail')">
      <div style="display:flex;justify-content:space-between;align-items:center"><strong style="font-size:13px">${t.name}</strong>${statusBadge(t.status)}</div>
      <div class="mini-info" style="margin-top:5px">${t.type} · 📍 ${t.location}<br>👥 ${t.team} · ${t.progress}% 完成</div>
      <div class="progress-bar" style="margin-top:6px"><div class="progress-fill" style="width:${t.progress}%"></div></div>
    </div>
    `).join('')}
    <button class="mini-btn" onclick="showModal('一键出动', '<p>将向指挥中心上报您已就绪</p>', '确认')">🚨 一键出动</button>
  `, 0, ['工作台','任务','SOS','我的']) + descPanel('救援人员工作台',
    '救援人员 APP 主页：个人状态、今日任务、快捷操作、进行中任务、一键出动。',
    `<div class="feature-list"><h4>核心能力</h4><ul><li>个人状态显示（在岗/距离）</li><li>任务列表与详情</li><li>装备扫码领用</li><li>位置实时回传</li><li>AI 助手对话</li><li>一键出动</li><li>考勤打卡</li><li>通讯录</li></ul></div>`),

  // ---------- APP 任务详情 ----------
  'app-task-detail': () => {
    // 支持从工作台跳转携带任务 id，缺省回退首个任务
    const tid = window._currentTaskId || (DB.tasks[0] && DB.tasks[0].id);
    const task = tid ? Store.get('tasks', tid) : null;
    const detailDesc = '救援人员查看任务详情：基本信息、描述、时间线、位置导航、参与人员、进度反馈、请求支援、完成任务。';
    const detailFeatures = `<div class="feature-list"><h4>核心能力</h4><ul><li>任务信息全览</li><li>实时时间线</li><li>位置导航</li><li>参与人员</li><li>进度反馈</li><li>请求支援</li><li>完成确认</li></ul></div>`;
    if (!task) {
      return phoneFrame('任务详情', `
    <div style="text-align:center;padding:60px 12px;color:var(--text2)">
      <div style="font-size:40px;margin-bottom:8px">📭</div>
      <div style="font-size:13px">任务不存在</div>
      <button class="mini-btn" style="margin-top:12px" onclick="goPage('app-rescuer')">返回工作台</button>
    </div>
  `, 1, ['工作台','任务','SOS','我的']) + descPanel('任务详情', detailDesc, detailFeatures);
    }
    const priorityLabel = {urgent:'紧急', high:'高', normal:'中'}[task.priority] || task.priority;
    // 进度按 20% 步进上报，渲染时计算下次目标值写入按钮
    const nextProgress = Math.min(100, (task.progress || 0) + 20);
    return phoneFrame('任务详情', `
    <div style="background:linear-gradient(135deg,#1e40af,#3b82f6);margin:-12px -12px 12px;padding:14px 12px;color:#fff">
      <div style="font-size:13px;font-weight:700">${task.name} · ${task.id}</div>
      <div style="font-size:11px;opacity:.9;margin-top:3px">📍 ${task.location} · ${priorityLabel}</div>
    </div>
    <div class="mini-card">
      <div class="mini-title">📌 任务信息</div>
      <div class="mini-info">类型：${task.type}<br>优先级：${priorityLabel}<br>负责人：${task.leader}<br>队伍：${task.team}（${task.members}人）<br>地点：${task.location}<br>创建时间：${task.createdAt}<br>进度：${task.progress}%</div>
      <div class="progress-bar" style="margin-top:6px"><div class="progress-fill" style="width:${task.progress}%"></div></div>
    </div>
    <div class="mini-card">
      <div class="mini-title">📝 任务描述</div>
      <div class="mini-info">${task.desc}</div>
    </div>
    <div class="mini-card">
      <div class="mini-title">⏱️ 时间线</div>
      <div class="timeline" style="margin-top:6px">
        <div class="timeline-item done"><div class="timeline-time">${task.createdAt}</div><div class="timeline-content">创建任务</div></div>
        <div class="timeline-item ${task.progress > 0 ? 'done' : ''}"><div class="timeline-time">执行中</div><div class="timeline-content">进度 ${task.progress}%</div></div>
        <div class="timeline-item ${task.status === 'done' ? 'done' : ''}"><div class="timeline-time">完成</div><div class="timeline-content">${task.status === 'done' ? '已完成' : '待完成'}</div></div>
      </div>
    </div>
    <div class="mini-card">
      <div class="mini-title">📍 任务位置</div>
      <div class="map-box" style="height:140px;margin-top:6px">
        <div class="map-bg"></div><div class="map-grid"></div>
        <div class="map-marker m-task" style="top:40%;left:45%">📋</div>
        <div class="map-marker m-team" style="top:30%;left:30%">🚒</div>
        <div class="map-info">📍 ${task.location}</div>
      </div>
      <button class="mini-btn" onclick="goPage('app-location')">开始导航</button>
    </div>
    <div class="mini-card">
      <div class="mini-title">👥 参与人员 (${task.members})</div>
      <div class="members" style="margin-top:6px">
        <div class="member-av">${task.leader ? task.leader.charAt(0) : '?'}</div>
        <div class="member-av member-more">+${Math.max(0, task.members - 1)}</div>
      </div>
    </div>
    <div style="display:flex;gap:6px;margin-top:8px">
      <button class="mini-btn success" style="flex:1" onclick="Store.actionFrom('app','tasks','update',{id:'${task.id}',progress:${nextProgress}});toast('📈 进度已上报：${nextProgress}%');goPage('app-task-detail')">📈 上报进度</button>
      <button class="mini-btn danger" style="flex:1" onclick="toast('已请求支援')">请求支援</button>
    </div>
    <button class="mini-btn secondary" style="margin-top:6px" onclick="Confirm('确认完成此任务？',()=>{Store.actionFrom('app','tasks','update',{id:'${task.id}',status:'done',progress:100});toast('✅ 任务已完成，已同步至指挥中心');goPage('app-rescuer');})">✅ 完成任务</button>
  `, 1, ['工作台','任务','SOS','我的']) + descPanel('任务详情', detailDesc, detailFeatures);
  },

  // ---------- APP 装备扫码 ----------
  'app-equip-scan': () => phoneFrame('装备扫码', `
    <div style="background:#000;border-radius:12px;height:280px;position:relative;margin-bottom:12px;overflow:hidden">
      <div style="position:absolute;inset:0;background:linear-gradient(135deg,#1e293b,#0f172a)"></div>
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:200px;height:200px;border:2px solid var(--success);border-radius:8px">
        <div style="position:absolute;top:-2px;left:-2px;width:20px;height:20px;border-top:4px solid var(--success);border-left:4px solid var(--success)"></div>
        <div style="position:absolute;top:-2px;right:-2px;width:20px;height:20px;border-top:4px solid var(--success);border-right:4px solid var(--success)"></div>
        <div style="position:absolute;bottom:-2px;left:-2px;width:20px;height:20px;border-bottom:4px solid var(--success);border-left:4px solid var(--success)"></div>
        <div style="position:absolute;bottom:-2px;right:-2px;width:20px;height:20px;border-bottom:4px solid var(--success);border-right:4px solid var(--success)"></div>
        <div style="position:absolute;top:50%;left:0;right:0;height:2px;background:var(--success);box-shadow:0 0 8px var(--success);animation:scan 2s infinite"></div>
      </div>
      <div style="position:absolute;bottom:14px;left:0;right:0;text-align:center;color:var(--success);font-size:12px">📷 将二维码对准扫描框</div>
    </div>
    <style>@keyframes scan{0%{top:0}50%{top:100%}100%{top:0}}</style>
    <div style="display:flex;gap:6px;margin-bottom:12px">
      <button class="mini-btn" style="flex:1" onclick="toast('已开启手电筒')">🔦 手电</button>
      <button class="mini-btn secondary" style="flex:1" onclick="toast('已切换相册')">🖼️ 相册</button>
      <button class="mini-btn secondary" style="flex:1" onclick="toast('手动输入')">⌨️ 手输</button>
    </div>
    <div style="font-size:12px;font-weight:700;margin-bottom:8px">📦 最近扫描</div>
    <div class="mini-card" style="border-left:3px solid var(--success)">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div><div class="mini-title">🦺 救生衣 · EQ-001</div><div class="mini-info">型号：maritime-5 · 库存 120</div></div>
        <button class="btn btn-success btn-sm" onclick="showModal('领用装备', Forms.borrow('救生衣'), '确认领用')">领用</button>
      </div>
    </div>
    <div class="mini-card" style="border-left:3px solid var(--success)">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div><div class="mini-title">📡 对讲机 · EQ-003</div><div class="mini-info">型号：KT-9R · 库存 50</div></div>
        <button class="btn btn-success btn-sm" onclick="showModal('领用装备', Forms.borrow('对讲机'), '确认领用')">领用</button>
      </div>
    </div>
    <div class="mini-card" style="border-left:3px solid var(--success)">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div><div class="mini-title">🚤 冲锋舟 · EQ-002</div><div class="mini-info">型号：CZ-8.0 · 库存 5</div></div>
        <button class="btn btn-success btn-sm" onclick="showModal('领用装备', Forms.borrow('冲锋舟'), '确认领用')">领用</button>
      </div>
    </div>
    <button class="mini-btn" onclick="toast('开始扫码')">📷 开始扫码</button>
  `, 0, ['工作台','任务','SOS','我的']) + descPanel('装备扫码',
    '通过摄像头扫描装备二维码快速领用 / 归还装备，自动记录出入库时间。',
    `<div class="feature-list"><h4>核心能力</h4><ul><li>二维码 / 条形码扫描</li><li>手电筒辅助</li><li>相册识别</li><li>手动输入</li><li>领用 / 归还记录</li><li>库存实时查询</li></ul></div>`),

  // ---------- APP SOS 等待 ----------
  'app-sos-detail': () => phoneFrame('SOS 求助响应', `
    <div style="background:#ef4444;color:#fff;padding:14px;border-radius:10px;margin-bottom:10px">
      <div style="font-size:13px;font-weight:700">🚨 SOS-0704-001 · 人员落水</div>
      <div style="font-size:11px;opacity:.9;margin-top:3px">📍 城南河道 · 一级紧急</div>
    </div>
    <div class="map-box" style="height:180px;margin-bottom:12px">
      <div class="map-bg"></div><div class="map-grid"></div>
      <div class="map-marker m-sos" style="top:45%;left:50%">🆘</div>
      <div class="map-marker m-team" style="top:30%;left:30%">🚒</div>
      <div class="map-info">📍 距您 1.2km · 预计 8 分钟</div>
    </div>
    <div class="mini-card">
      <div class="mini-title">👤 求助人信息</div>
      <div class="mini-info">姓名：刘先生<br>电话：138****1234<br>位置：116.40, 39.98<br>时间：16:20</div>
      <button class="mini-btn success" style="margin-top:6px" onclick="showModal('发起通话', Forms.call('刘先生'), '呼叫')">📞 联系求助人</button>
    </div>
    <div class="mini-card">
      <div class="mini-title">📝 求助描述</div>
      <div class="mini-info">1 人落水，水流湍急，需要冲锋舟救援。被困人员抓住河道树枝，体力不支。</div>
    </div>
    <div class="mini-card">
      <div class="mini-title">🚒 响应队伍</div>
      <div class="mini-info">救援一队 · 5 人<br>携带：冲锋舟 1 艘、救生衣 5 件<br>状态：前往中</div>
      <div class="progress-bar" style="margin-top:6px"><div class="progress-fill" style="width:40%"></div></div>
    </div>
    <div class="mini-card">
      <div class="mini-title">⏱️ 响应进度</div>
      <div class="timeline" style="margin-top:6px">
        <div class="timeline-item done"><div class="timeline-time">16:20</div><div class="timeline-content">求助接入</div></div>
        <div class="timeline-item done"><div class="timeline-time">16:22</div><div class="timeline-content">指挥中心接报</div></div>
        <div class="timeline-item done"><div class="timeline-time">16:25</div><div class="timeline-content">救援一队出动</div></div>
        <div class="timeline-item"><div class="timeline-time">16:42</div><div class="timeline-content">前往现场（40%）</div></div>
      </div>
    </div>
    <div style="display:flex;gap:6px">
      <button class="mini-btn success" style="flex:1" onclick="toast('已到达现场')">到达现场</button>
      <button class="mini-btn danger" style="flex:1" onclick="showModal('完成救援', '<p>确认救援完成？</p><p>• 被困人员已救起</p><p>• 无伤亡</p>', '确认完成')">完成救援</button>
    </div>
  `, 2, ['工作台','任务','SOS','我的']) + descPanel('SOS 求助响应',
    '救援人员接收 SOS 求助后查看详情、导航、联系求助人、反馈进度、完成救援。',
    `<div class="feature-list"><h4>核心能力</h4><ul><li>SOS 详情查看</li><li>实时位置导航</li><li>联系求助人</li><li>响应进度跟踪</li><li>到达 / 完成反馈</li><li>多端状态同步</li></ul></div>`),

  // ---------- APP AI 助手（接入 AI 引擎，真实交互） ----------
  'app-ai-chat': () => phoneFrame('AI 助手', `
    <div style="background:linear-gradient(135deg,#8b5cf6,#6366f1);color:#fff;padding:12px;border-radius:10px;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between">
      <div style="display:flex;align-items:center;gap:8px">
        <div style="width:36px;height:36px;background:rgba(255,255,255,.2);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px">🤖</div>
        <div><div style="font-size:13px;font-weight:700">援力通 AI 助手</div><div style="font-size:10px;opacity:.9">基于大模型 · 应急救援专家 · 实时态势</div></div>
      </div>
      <button class="mini-btn secondary" style="width:auto;padding:4px 8px;margin:0;font-size:10px" onclick="AI.clear('app-ai-chat')">🗑️</button>
    </div>
    ${AI.chatContainer('app-ai-chat', {compact:true, maxHeight:'440px'})}
  `, 0, ['工作台','任务','SOS','我的']) + descPanel('AI 助手',
    '基于大模型的应急救援 AI 助手，支持自然语言问答、专业知识查询、场景化建议、实时态势分析。<strong>真实交互</strong>：输入问题或点击快捷问题即可获得 AI 回答，支持多轮对话。',
    `<div class="feature-list"><h4>核心能力</h4><ul><li>自然语言问答（真实交互）</li><li>15 类应急救援知识库</li><li>实时态势分析（读 DB 数据）</li><li>调度建议与风险评估</li><li>多轮对话（按页面隔离）</li><li>快捷问题推荐</li></ul></div>`),

  // ---------- APP 位置共享 ----------
  'app-location': () => phoneFrame('位置共享', `
    <div class="map-box" style="height:280px;margin-bottom:12px">
      <div class="map-bg"></div><div class="map-grid"></div>
      <svg style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none">
        <path d="M 0 200 Q 200 180 400 220 T 800 240" stroke="#3b82f6" stroke-width="20" fill="none" opacity="0.3"/>
      </svg>
      <div class="map-marker m-team" style="top:35%;left:20%">🚒</div>
      <div class="map-marker m-team" style="top:55%;left:60%">🚒</div>
      <div class="map-marker m-task" style="top:45%;left:45%">📋</div>
      <div class="map-marker m-sos" style="top:65%;left:35%">🆘</div>
      <div class="map-info">📍 您的位置 · 116.40, 39.98</div>
      <div class="map-legend">
        <div class="legend-item"><div class="legend-dot" style="background:var(--primary-light)"></div>我</div>
        <div class="legend-item"><div class="legend-dot" style="background:var(--accent)"></div>任务</div>
      </div>
    </div>
    <div class="mini-card">
      <div class="mini-title">📍 我的位置</div>
      <div class="mini-info">坐标：116.40, 39.98<br>精度：5m · 速度：0 m/s<br>更新：实时（每 3 秒）</div>
      <div style="display:flex;gap:6px;margin-top:8px">
        <button class="mini-btn" style="flex:1" onclick="toast('已开始共享')">📤 共享位置</button>
        <button class="mini-btn secondary" style="flex:1" onclick="toast('已停止共享')">⏹ 停止</button>
      </div>
    </div>
    <div class="mini-card">
      <div class="mini-title">👥 队伍位置（5 人在线）</div>
      <div class="mini-info">🟢 张队长 · 距您 0.5km<br>🟢 李救援 · 距您 0.8km<br>🟢 王救援 · 距您 1.2km<br>🟡 赵救援 · 信号弱<br>🔴 孙救援 · 离线</div>
    </div>
    <div class="mini-card">
      <div class="mini-title">🧭 导航</div>
      <div class="mini-info">目标：城南河道 SOS 点<br>距离：1.2km · 预计 8 分钟</div>
      <button class="mini-btn" style="margin-top:6px" onclick="toast('已开始导航')">开始导航</button>
    </div>
    <div class="mini-card">
      <div class="mini-title">📜 位置轨迹</div>
      <div class="mini-info">今日轨迹：8.6 km<br>时长：2 小时 15 分</div>
      <button class="mini-btn secondary" style="margin-top:6px" onclick="toast('查看轨迹回放')">查看回放</button>
    </div>
  `, 0, ['工作台','任务','SOS','我的']) + descPanel('位置共享',
    '救援人员实时位置共享：自己的位置、队友位置、任务点导航、轨迹回放。',
    `<div class="feature-list"><h4>核心能力</h4><ul><li>实时位置上报（3 秒/次）</li><li>队友位置查看</li><li>任务点导航</li><li>轨迹回放</li><li>位置共享开关</li><li>离线补偿</li></ul></div>`),

  // ---------- APP 队长工作台 ----------
  'app-commander': () => {
    // 筛选状态持久化在 window，切换时重新渲染当前页
    const filter = window._commanderFilter || 'all';
    const stats = Store.stats();
    const teamMembers = DB.teams.reduce((s, t) => s + (t.members || 0), 0);
    const filtered = Store.list('tasks').filter(t =>
      filter === 'all' ? true :
      filter === 'progress' ? t.status === 'progress' :
      filter === 'pending' ? t.status === 'pending' :
      t.status === 'done'
    );
    const filterBtn = (key, label) =>
      `<button class="mini-btn ${filter === key ? '' : 'secondary'}" style="flex:1;padding:6px 4px;font-size:11px" onclick="window._commanderFilter='${key}';goPage('app-commander')">${label}</button>`;
    const taskCard = t => `
    <div class="mini-card" style="${t.priority === 'urgent' ? 'border:1px solid var(--danger)' : 'border-left:3px solid var(--primary-light)'};margin-bottom:8px;cursor:pointer" onclick="window._currentTaskId='${t.id}';goPage('app-task-detail')">
      <div style="display:flex;justify-content:space-between;align-items:center"><strong style="font-size:13px">${t.name}</strong>${statusBadge(t.status)}</div>
      <div class="mini-info" style="margin-top:5px">${t.type} · 📍 ${t.location}<br>👥 ${t.team} · ${t.members}人</div>
      <div class="progress-bar" style="margin-top:6px"><div class="progress-fill" style="width:${t.progress}%"></div></div>
      <div style="font-size:10px;color:var(--text2);margin-top:4px">进度 ${t.progress}%</div>
    </div>`;
    return phoneFrame('队长工作台', `
    <div style="background:linear-gradient(135deg,#f59e0b,#d97706);margin:-12px -12px 12px;padding:16px 12px;color:#fff">
      <div style="display:flex;align-items:center;gap:10px">
        <div style="width:42px;height:42px;background:rgba(255,255,255,.2);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:22px">👨‍✈️</div>
        <div style="flex:1"><div style="font-size:13px;font-weight:700">张队长 · 救援一队</div><div style="font-size:11px;opacity:.9">🟢 ${teamMembers} 人在岗 · ${stats.tasksProgress} 任务执行中</div></div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:10px;text-align:center">
      <div class="mini-card" style="padding:8px 4px"><div style="font-size:14px;font-weight:700;color:var(--primary-light)">${stats.tasksProgress}</div><div style="font-size:9px;color:var(--text2)">进行中</div></div>
      <div class="mini-card" style="padding:8px 4px"><div style="font-size:14px;font-weight:700;color:var(--success)">${stats.tasksDone}</div><div style="font-size:9px;color:var(--text2)">已完成</div></div>
      <div class="mini-card" style="padding:8px 4px"><div style="font-size:14px;font-weight:700;color:var(--accent)">${stats.tasksPending}</div><div style="font-size:9px;color:var(--text2)">待开始</div></div>
      <div class="mini-card" style="padding:8px 4px"><div style="font-size:14px;font-weight:700;color:var(--purple)">${teamMembers}</div><div style="font-size:9px;color:var(--text2)">队伍人数</div></div>
    </div>
    <div style="font-size:12px;font-weight:700;margin-bottom:8px">📋 任务列表（${filtered.length}）</div>
    <div style="display:flex;gap:4px;margin-bottom:10px">
      ${filterBtn('all', '全部')}
      ${filterBtn('progress', '进行中')}
      ${filterBtn('pending', '待开始')}
      ${filterBtn('done', '已完成')}
    </div>
    ${filtered.length === 0 ? '<div class="mini-info" style="text-align:center;padding:20px;color:var(--text2)">暂无任务</div>' : filtered.map(taskCard).join('')}
    <div style="font-size:12px;font-weight:700;margin:12px 0 8px">⚡ 队长功能</div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:12px">
      <div class="mini-card" style="text-align:center;padding:10px 4px;cursor:pointer" onclick="goPage('app-swarm')"><div style="font-size:18px">🎯</div><div style="font-size:10px;margin-top:3px">集群调度</div></div>
      <div class="mini-card" style="text-align:center;padding:10px 4px;cursor:pointer" onclick="goPage('app-video-wall')"><div style="font-size:18px">🎥</div><div style="font-size:10px;margin-top:3px">视频墙</div></div>
      <div class="mini-card" style="text-align:center;padding:10px 4px;cursor:pointer" onclick="goPage('app-decision')"><div style="font-size:18px">🧠</div><div style="font-size:10px;margin-top:3px">AI 决策</div></div>
      <div class="mini-card" style="text-align:center;padding:10px 4px;cursor:pointer" onclick="goPage('app-attendance')"><div style="font-size:18px">⏰</div><div style="font-size:10px;margin-top:3px">考勤</div></div>
      <div class="mini-card" style="text-align:center;padding:10px 4px;cursor:pointer" onclick="goPage('app-contacts')"><div style="font-size:18px">📇</div><div style="font-size:10px;margin-top:3px">通讯录</div></div>
      <div class="mini-card" style="text-align:center;padding:10px 4px;cursor:pointer" onclick="goPage('app-location')"><div style="font-size:18px">📍</div><div style="font-size:10px;margin-top:3px">位置</div></div>
      <div class="mini-card" style="text-align:center;padding:10px 4px;cursor:pointer" onclick="showModal('任务派发', Forms.createTask(), '下发')"><div style="font-size:18px">📋</div><div style="font-size:10px;margin-top:3px">派任务</div></div>
      <div class="mini-card" style="text-align:center;padding:10px 4px;cursor:pointer" onclick="toast('队伍管理')"><div style="font-size:18px">👥</div><div style="font-size:10px;margin-top:3px">队伍</div></div>
    </div>
    <button class="mini-btn" onclick="goPage('app-swarm')">🎯 集群调度</button>
  `, 0, ['工作台','任务','SOS','我的']) + descPanel('队长工作台',
    '队长端工作台：队伍状态、任务派发与跟踪、集群调度、视频墙、AI 决策、考勤管理、通讯录。',
    `<div class="feature-list"><h4>核心能力</h4><ul><li>队伍状态总览</li><li>任务派发与跟踪</li><li>集群调度（多队协同）</li><li>视频墙监控</li><li>AI 决策支持</li><li>考勤审核</li><li>通讯录管理</li><li>成员位置查看</li></ul></div>`);
  },

  // ---------- APP 集群调度 ----------
  'app-swarm': () => phoneFrame('集群调度', `
    <div style="font-size:12px;font-weight:700;margin-bottom:8px">🎯 多队伍协同调度</div>
    <div class="map-box" style="height:240px;margin-bottom:12px">
      <div class="map-bg"></div><div class="map-grid"></div>
      <svg style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none">
        <path d="M 80 180 Q 200 150 320 200" stroke="#3b82f6" stroke-width="2" fill="none" stroke-dasharray="5,5"/>
        <path d="M 200 100 Q 250 150 320 200" stroke="#f59e0b" stroke-width="2" fill="none" stroke-dasharray="5,5"/>
      </svg>
      <div class="map-marker m-task" style="top:60%;left:60%">📋</div>
      <div class="map-marker m-team" style="top:55%;left:20%">🚒</div>
      <div class="map-marker m-team" style="top:30%;left:40%">🚒</div>
      <div class="map-marker m-team" style="top:70%;left:80%">🚒</div>
      <div class="map-marker m-drone" style="top:20%;left:65%">🚁</div>
      <div class="map-info">📍 集群调度 · 3 队伍 + 1 无人机</div>
    </div>
    <div style="font-size:12px;font-weight:700;margin-bottom:8px">🚒 协同队伍</div>
    <div class="mini-card" style="border-left:3px solid var(--primary-light)">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div><div class="mini-title">救援一队</div><div class="mini-info">12 人 · 距目标 1.2km</div></div>
        <span class="badge badge-progress" style="font-size:9px">前往中</span>
      </div>
    </div>
    <div class="mini-card" style="border-left:3px solid var(--accent)">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div><div class="mini-title">水域组</div><div class="mini-info">10 人 · 距目标 2.5km</div></div>
        <span class="badge badge-pending" style="font-size:9px">待命</span>
      </div>
    </div>
    <div class="mini-card" style="border-left:3px solid var(--success)">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div><div class="mini-title">医疗组</div><div class="mini-info">8 人 · 距目标 0.5km</div></div>
        <span class="badge badge-done" style="font-size:9px">已就位</span>
      </div>
    </div>
    <div class="mini-card" style="border-left:3px solid var(--purple)">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div><div class="mini-title">无人机 DR-001</div><div class="mini-info">高度 120m · 电量 78%</div></div>
        <span class="badge badge-purple" style="font-size:9px">航拍中</span>
      </div>
    </div>
    <div class="mini-card">
      <div class="mini-title">⚡ 调度指令</div>
      <div class="mini-info">• 救援一队 → 现场救援<br>• 水域组 → 增援待命<br>• 医疗组 → 现场医疗保障<br>• 无人机 → 持续航拍监控</div>
    </div>
    <button class="mini-btn" onclick="showModal('下发指令', '<p>将向所有协同队伍下发调度指令</p>', '确认下发')">📤 下发调度指令</button>
  `, 0, ['工作台','任务','SOS','我的']) + descPanel('集群调度',
    '多队伍、多无人机的集群协同调度，可视化指挥，下发指令，跟踪执行。',
    `<div class="feature-list"><h4>核心能力</h4><ul><li>多队伍位置可视化</li><li>无人机协同</li><li>调度指令下发</li><li>执行进度跟踪</li><li>路径规划</li><li>实时通讯</li></ul></div>`),

  // ---------- APP 视频墙 ----------
  'app-video-wall': () => phoneFrame('视频墙', `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
      <div style="font-size:12px;font-weight:700">🎥 实时视频墙</div>
      <div style="display:flex;gap:4px">
        <button class="mini-btn secondary" style="width:auto;padding:3px 8px;margin:0;font-size:10px">2×2</button>
        <button class="mini-btn secondary" style="width:auto;padding:3px 8px;margin:0;font-size:10px">3×3</button>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px">
      <div style="background:#000;border-radius:8px;aspect-ratio:16/9;position:relative;cursor:pointer" onclick="toast('全屏观看')">
        <div style="position:absolute;inset:0;background:linear-gradient(135deg,#1e3a8a,#0f172a);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:24px">🚒</div>
        <div style="position:absolute;top:4px;left:4px;background:rgba(239,68,68,.8);color:#fff;font-size:9px;padding:2px 6px;border-radius:4px">● LIVE</div>
        <div style="position:absolute;bottom:4px;left:4px;font-size:9px;color:#fff;background:rgba(0,0,0,.6);padding:2px 6px;border-radius:4px">救援一队 · 现场</div>
      </div>
      <div style="background:#000;border-radius:8px;aspect-ratio:16/9;position:relative;cursor:pointer" onclick="toast('全屏观看')">
        <div style="position:absolute;inset:0;background:linear-gradient(135deg,#7c2d12,#0f172a);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:24px">🌊</div>
        <div style="position:absolute;top:4px;left:4px;background:rgba(239,68,68,.8);color:#fff;font-size:9px;padding:2px 6px;border-radius:4px">● LIVE</div>
        <div style="position:absolute;bottom:4px;left:4px;font-size:9px;color:#fff;background:rgba(0,0,0,.6);padding:2px 6px;border-radius:4px">水域组 · 河道</div>
      </div>
      <div style="background:#000;border-radius:8px;aspect-ratio:16/9;position:relative;cursor:pointer" onclick="goPage('app-drone-video')">
        <div style="position:absolute;inset:0;background:linear-gradient(135deg,#581c87,#0f172a);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:24px">🚁</div>
        <div style="position:absolute;top:4px;left:4px;background:rgba(239,68,68,.8);color:#fff;font-size:9px;padding:2px 6px;border-radius:4px">● LIVE</div>
        <div style="position:absolute;bottom:4px;left:4px;font-size:9px;color:#fff;background:rgba(0,0,0,.6);padding:2px 6px;border-radius:4px">无人机 DR-001</div>
      </div>
      <div style="background:#000;border-radius:8px;aspect-ratio:16/9;position:relative;cursor:pointer" onclick="toast('全屏观看')">
        <div style="position:absolute;inset:0;background:linear-gradient(135deg,#064e3b,#0f172a);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:24px">🏕️</div>
        <div style="position:absolute;top:4px;left:4px;background:rgba(239,68,68,.8);color:#fff;font-size:9px;padding:2px 6px;border-radius:4px">● LIVE</div>
        <div style="position:absolute;bottom:4px;left:4px;font-size:9px;color:#fff;background:rgba(0,0,0,.6);padding:2px 6px;border-radius:4px">城西安置点</div>
      </div>
    </div>
    <div class="mini-card">
      <div class="mini-title">📹 视频源（4 路）</div>
      <div class="mini-info">🟢 救援一队单兵 · 720P<br>🟢 水域组单兵 · 720P<br>🟁 无人机 DR-001 · 4K<br>🟢 城西安置点监控 · 1080P</div>
    </div>
    <div style="display:flex;gap:6px">
      <button class="mini-btn" style="flex:1" onclick="toast('已开始录制')">🔴 录制</button>
      <button class="mini-btn secondary" style="flex:1" onclick="toast('已截图')">📷 截图</button>
      <button class="mini-btn secondary" style="flex:1" onclick="toast('已共享')">📤 共享</button>
    </div>
  `, 0, ['工作台','任务','SOS','我的']) + descPanel('视频墙',
    '多路实时视频监控：单兵图传、无人机图传、固定监控，支持多分屏、录制、截图、共享。',
    `<div class="feature-list"><h4>核心能力</h4><ul><li>多路视频实时接入</li><li>2×2 / 3×3 分屏</li><li>单兵图传</li><li>无人机图传</li><li>固定监控</li><li>录制 / 截图 / 共享</li><li>全屏观看</li></ul></div>`),

  // ---------- APP AI 决策面板 ----------
  'app-decision': () => phoneFrame('AI 决策面板', `
    <div style="background:linear-gradient(135deg,#8b5cf6,#6366f1);color:#fff;padding:12px;border-radius:10px;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between">
      <div style="display:flex;align-items:center;gap:8px">
        <div style="font-size:24px">🧠</div>
        <div><div style="font-size:13px;font-weight:700">AI 决策支持</div><div style="font-size:10px;opacity:.9">实时分析 · 智能建议 · 基于系统数据</div></div>
      </div>
      <button class="mini-btn secondary" style="width:auto;padding:4px 8px;margin:0;font-size:10px;background:rgba(255,255,255,.2);color:#fff" onclick="goPage('app-ai-chat')">💬 对话</button>
    </div>
    <div class="mini-card" style="border-left:3px solid var(--purple);font-size:11px;line-height:1.7">
      <div class="mini-title">📊 实时态势（AI 自动生成）</div>
      ${AI.situationalAnalysis()}
    </div>
    <button class="mini-btn" onclick="AI.showDispatch()">⚡ AI 一键调度</button>
    <button class="mini-btn secondary" style="margin-top:6px" onclick="AI.showRisk()">⚠️ 风险评估</button>
    <button class="mini-btn secondary" style="margin-top:6px" onclick="AI.showCases()">📊 历史案例</button>
    <button class="mini-btn secondary" style="margin-top:6px" onclick="goPage('app-ai-chat')">💬 AI 对话助手</button>
  `, 0, ['工作台','任务','SOS','我的']) + descPanel('AI 决策面板',
    '基于大模型的 AI 决策支持：<strong>实时态势分析（读 DB 数据自动生成）</strong>、调度建议、风险评估、一键采纳方案、AI 对话交互。',
    `<div class="feature-list"><h4>核心能力</h4><ul><li>实时态势分析（数据驱动）</li><li>智能调度建议</li><li>风险评估报告</li><li>一键采纳方案</li><li>历史案例匹配</li><li>AI 对话交互</li></ul></div>`),

  // ---------- APP 考勤审核 ----------
  'app-attendance': () => phoneFrame('考勤审核', `
    <div style="font-size:12px;font-weight:700;margin-bottom:8px">⏰ 今日考勤（救援一队）</div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:10px;text-align:center">
      <div class="mini-card" style="padding:8px 4px"><div style="font-size:14px;font-weight:700;color:var(--success)">12</div><div style="font-size:9px;color:var(--text2)">已打卡</div></div>
      <div class="mini-card" style="padding:8px 4px"><div style="font-size:14px;font-weight:700;color:var(--warning)">2</div><div style="font-size:9px;color:var(--text2)">迟到</div></div>
      <div class="mini-card" style="padding:8px 4px"><div style="font-size:14px;font-weight:700;color:var(--danger)">1</div><div style="font-size:9px;color:var(--text2)">缺勤</div></div>
    </div>
    <div class="mini-card">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div style="display:flex;align-items:center;gap:8px">
          <div class="member-av">李</div>
          <div><div style="font-size:12px;font-weight:600">李救援</div><div style="font-size:10px;color:var(--text2)">07:50 上岗 · 16:30 下岗</div></div>
        </div>
        <span class="badge badge-done" style="font-size:9px">正常</span>
      </div>
    </div>
    <div class="mini-card">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div style="display:flex;align-items:center;gap:8px">
          <div class="member-av">王</div>
          <div><div style="font-size:12px;font-weight:600">王救援</div><div style="font-size:10px;color:var(--text2)">08:15 上岗 · 迟到 15 分钟</div></div>
        </div>
        <span class="badge badge-pending" style="font-size:9px">迟到</span>
      </div>
      <button class="btn btn-warning btn-xs" style="margin-top:6px" onclick="showModal('考勤审核', Forms.audit(), '提交审核')">审核</button>
    </div>
    <div class="mini-card">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div style="display:flex;align-items:center;gap:8px">
          <div class="member-av">赵</div>
          <div><div style="font-size:12px;font-weight:600">赵救援</div><div style="font-size:10px;color:var(--text2)">未打卡</div></div>
        </div>
        <span class="badge badge-urgent" style="font-size:9px">缺勤</span>
      </div>
      <button class="btn btn-danger btn-xs" style="margin-top:6px" onclick="showModal('考勤审核', Forms.audit(), '提交审核')">处理</button>
    </div>
    <div class="mini-card">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div style="display:flex;align-items:center;gap:8px">
          <div class="member-av">孙</div>
          <div><div style="font-size:12px;font-weight:600">孙救援</div><div style="font-size:10px;color:var(--text2)">07:45 上岗 · 16:30 下岗</div></div>
        </div>
        <span class="badge badge-done" style="font-size:9px">正常</span>
      </div>
    </div>
    <div class="mini-card">
      <div class="mini-title">📊 本月考勤统计</div>
      <div class="mini-info">出勤率：85%<br>迟到：8 次<br>缺勤：2 次<br>平均工时：8.2h/天</div>
    </div>
    <button class="mini-btn" onclick="goPage('report')">📈 导出考勤报表</button>
  `, 0, ['工作台','任务','SOS','我的']) + descPanel('考勤审核',
    '队长对队员考勤进行审核：打卡记录、异常处理、月度统计、报表导出。',
    `<div class="feature-list"><h4>核心能力</h4><ul><li>打卡记录查看</li><li>异常考勤处理</li><li>迟到 / 缺勤审核</li><li>月度统计</li><li>报表导出</li><li>GPS 打卡定位</li></ul></div>`),

  // ---------- APP 通讯录 ----------
  'app-contacts': () => phoneFrame('通讯录', `
    <div style="background:var(--card);border-radius:10px;padding:8px;margin-bottom:10px;display:flex;align-items:center;gap:6px">
      <span style="font-size:14px">🔍</span>
      <input style="flex:1;background:transparent;border:none;color:var(--text);outline:none;font-size:12px" placeholder="搜索姓名 / 队伍">
    </div>
    <div style="font-size:11px;color:var(--text2);margin-bottom:6px">救援一队</div>
    <div class="mini-card" onclick="showModal('发起通话', Forms.call('张队长'), '呼叫')">
      <div style="display:flex;align-items:center;gap:8px">
        <div class="member-av" style="background:var(--accent)">张</div>
        <div style="flex:1"><div style="font-size:12px;font-weight:600">张队长</div><div style="font-size:10px;color:var(--text2)">👨‍✈️ 队长 · 138****0001</div></div>
        <button class="btn btn-primary btn-xs">📞</button>
      </div>
    </div>
    <div class="mini-card" onclick="showModal('发起通话', Forms.call('李救援'), '呼叫')">
      <div style="display:flex;align-items:center;gap:8px">
        <div class="member-av">李</div>
        <div style="flex:1"><div style="font-size:12px;font-weight:600">李救援</div><div style="font-size:10px;color:var(--text2)">🧑 救援员 · 138****0002</div></div>
        <button class="btn btn-primary btn-xs">📞</button>
      </div>
    </div>
    <div class="mini-card" onclick="showModal('发起通话', Forms.call('王救援'), '呼叫')">
      <div style="display:flex;align-items:center;gap:8px">
        <div class="member-av">王</div>
        <div style="flex:1"><div style="font-size:12px;font-weight:600">王救援</div><div style="font-size:10px;color:var(--text2)">🧑 救援员 · 138****0003</div></div>
        <button class="btn btn-primary btn-xs">📞</button>
      </div>
    </div>
    <div style="font-size:11px;color:var(--text2);margin:10px 0 6px">其他队伍</div>
    <div class="mini-card" onclick="showModal('发起通话', Forms.call('刘队长'), '呼叫')">
      <div style="display:flex;align-items:center;gap:8px">
        <div class="member-av" style="background:var(--success)">刘</div>
        <div style="flex:1"><div style="font-size:12px;font-weight:600">刘队长</div><div style="font-size:10px;color:var(--text2)">👨‍✈️ 救援二队 · 138****0004</div></div>
        <button class="btn btn-primary btn-xs">📞</button>
      </div>
    </div>
    <div class="mini-card" onclick="showModal('发起通话', Forms.call('赵队长'), '呼叫')">
      <div style="display:flex;align-items:center;gap:8px">
        <div class="member-av" style="background:var(--cyan)">赵</div>
        <div style="flex:1"><div style="font-size:12px;font-weight:600">赵队长</div><div style="font-size:10px;color:var(--text2)">👨‍✈️ 水域组 · 138****0005</div></div>
        <button class="btn btn-primary btn-xs">📞</button>
      </div>
    </div>
    <div class="mini-card" onclick="showModal('发起通话', Forms.call('王飞宇'), '呼叫')">
      <div style="display:flex;align-items:center;gap:8px">
        <div class="member-av" style="background:var(--purple)">王</div>
        <div style="flex:1"><div style="font-size:12px;font-weight:600">王飞宇</div><div style="font-size:10px;color:var(--text2)">🚁 无人机中队 · 138****0006</div></div>
        <button class="btn btn-primary btn-xs">📞</button>
      </div>
    </div>
    <div class="mini-card" onclick="showModal('发起通话', Forms.call('陈医生'), '呼叫')">
      <div style="display:flex;align-items:center;gap:8px">
        <div class="member-av" style="background:var(--danger)">陈</div>
        <div style="flex:1"><div style="font-size:12px;font-weight:600">陈医生</div><div style="font-size:10px;color:var(--text2)">⚕️ 医疗组 · 138****0007</div></div>
        <button class="btn btn-primary btn-xs">📞</button>
      </div>
    </div>
  `, 0, ['工作台','任务','SOS','我的']) + descPanel('通讯录',
    '救援队伍通讯录，按队伍分组，支持搜索、一键拨号、发起通话。',
    `<div class="feature-list"><h4>核心能力</h4><ul><li>按队伍分组</li><li>关键词搜索</li><li>一键拨号</li><li>发起通话</li><li>联系人详情</li><li>常用收藏</li></ul></div>`),

  // ---------- APP 无人机列表 ----------
  'app-drone': () => phoneFrame('无人机列表', `
    <div style="font-size:12px;font-weight:700;margin-bottom:8px">🚁 我的无人机（5 架）</div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:12px;text-align:center">
      <div class="mini-card" style="padding:8px 4px"><div style="font-size:14px;font-weight:700;color:var(--purple)">3</div><div style="font-size:9px;color:var(--text2)">飞行中</div></div>
      <div class="mini-card" style="padding:8px 4px"><div style="font-size:14px;font-weight:700;color:var(--success)">1</div><div style="font-size:9px;color:var(--text2)">待命</div></div>
      <div class="mini-card" style="padding:8px 4px"><div style="font-size:14px;font-weight:700;color:var(--warning)">1</div><div style="font-size:9px;color:var(--text2)">充电中</div></div>
    </div>
    <div class="mini-card" style="border-left:3px solid var(--purple)">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div><div class="mini-title">🚁 DR-001 · 大疆 M300</div><div class="mini-info">高度 120m · 电量 78%<br>任务：城南航拍</div></div>
        <span class="badge badge-purple" style="font-size:9px">飞行中</span>
      </div>
      <div class="progress-bar" style="margin-top:6px"><div class="progress-fill" style="width:78%"></div></div>
      <div style="display:flex;gap:6px;margin-top:8px">
        <button class="mini-btn" style="flex:1;padding:6px;font-size:11px" onclick="goPage('app-drone-video')">📡 图传</button>
        <button class="mini-btn secondary" style="flex:1;padding:6px;font-size:11px" onclick="goPage('app-telemetry')">📊 遥测</button>
      </div>
    </div>
    <div class="mini-card" style="border-left:3px solid var(--purple)">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div><div class="mini-title">🚁 DR-002 · 大疆 M30T</div><div class="mini-info">高度 80m · 电量 62%<br>任务：北山搜救</div></div>
        <span class="badge badge-purple" style="font-size:9px">飞行中</span>
      </div>
      <div class="progress-bar" style="margin-top:6px"><div class="progress-fill" style="width:62%"></div></div>
      <button class="mini-btn" style="margin-top:8px" onclick="goPage('app-drone-video')">📡 查看图传</button>
    </div>
    <div class="mini-card" style="border-left:3px solid var(--success)">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div><div class="mini-title">🚁 DR-003 · 经纬 M210</div><div class="mini-info">待命 · 电量 100%</div></div>
        <span class="badge badge-pending" style="font-size:9px">待命</span>
      </div>
      <div style="display:flex;gap:6px;margin-top:8px">
        <button class="mini-btn" style="flex:1;padding:6px;font-size:11px" onclick="goPage('app-flight-plan')">🗺️ 航线</button>
        <button class="mini-btn success" style="flex:1;padding:6px;font-size:11px" onclick="toast('已下发起飞指令')">🚀 起飞</button>
      </div>
    </div>
    <div class="mini-card" style="border-left:3px solid var(--purple)">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div><div class="mini-title">🚁 DR-004 · 悟 2</div><div class="mini-info">高度 100m · 电量 45%</div></div>
        <span class="badge badge-purple" style="font-size:9px">飞行中</span>
      </div>
      <div class="progress-bar" style="margin-top:6px"><div class="progress-fill danger" style="width:45%"></div></div>
      <button class="mini-btn danger" style="margin-top:8px" onclick="toast('已召回')">🛬 召回</button>
    </div>
    <div class="mini-card" style="border-left:3px solid var(--warning)">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div><div class="mini-title">🚁 DR-005 · Mavic 3</div><div class="mini-info">充电中 · 电量 32%</div></div>
        <span class="badge badge-gray" style="font-size:9px">充电</span>
      </div>
      <div class="progress-bar" style="margin-top:6px"><div class="progress-fill" style="width:32%"></div></div>
    </div>
    <button class="mini-btn" onclick="goPage('app-flight-plan')">🗺️ 规划新航线</button>
  `, 0, ['工作台','任务','SOS','我的']) + descPanel('无人机列表',
    '飞手管理的无人机列表：状态、电量、高度、任务，可查看图传、遥测、规划航线、起飞/召回。',
    `<div class="feature-list"><h4>核心能力</h4><ul><li>多机型管理（M300/M30T/M210/悟2/Mavic3）</li><li>实时状态（飞行/待命/充电）</li><li>电量监控</li><li>一键起飞 / 召回</li><li>图传 / 遥测查看</li><li>航线规划入口</li></ul></div>`),

  // ---------- APP 航线规划 ----------
  'app-flight-plan': () => phoneFrame('航线规划', `
    <div style="font-size:12px;font-weight:700;margin-bottom:8px">🗺️ 航线规划 · DR-003</div>
    <div class="map-box" style="height:280px;margin-bottom:12px">
      <div class="map-bg"></div><div class="map-grid"></div>
      <svg style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none">
        <path d="M 60 220 L 120 180 L 180 200 L 240 140 L 300 100 L 280 60" stroke="#8b5cf6" stroke-width="3" fill="none" stroke-dasharray="6,4"/>
        <circle cx="60" cy="220" r="6" fill="#10b981"/>
        <circle cx="120" cy="180" r="4" fill="#3b82f6"/>
        <circle cx="180" cy="200" r="4" fill="#3b82f6"/>
        <circle cx="240" cy="140" r="4" fill="#3b82f6"/>
        <circle cx="300" cy="100" r="4" fill="#3b82f6"/>
        <circle cx="280" cy="60" r="6" fill="#ef4444"/>
      </svg>
      <div class="map-info">📍 起点 → 终点 · 6 航点 · 3.2km</div>
    </div>
    <div class="mini-card">
      <div class="mini-title">📋 航线信息</div>
      <div class="mini-info">起点：城东基地<br>终点：城南河道<br>航点：6 个<br>总距离：3.2 km<br>预计时长：18 分钟<br>飞行高度：100m<br>航速：8 m/s</div>
    </div>
    <div class="mini-card">
      <div class="mini-title">⚙️ 飞行参数</div>
      <div class="mini-info">模式：航点飞行<br>返航高度：120m<br>失控行为：自动返航<br>避障：开启</div>
    </div>
    <div class="mini-card">
      <div class="mini-title">📷 拍摄任务</div>
      <div class="mini-info">航点 2：悬停拍照<br>航点 4：录制视频 30s<br>航点 6：全景拍摄</div>
    </div>
    <div class="mini-card">
      <div class="mini-title">🚧 电子围栏</div>
      <div class="mini-info">已加载 3 个禁飞区<br>已加载 2 个限高区</div>
      <button class="mini-btn secondary" style="margin-top:6px" onclick="goPage('app-geo-fence')">查看围栏</button>
    </div>
    <div style="display:flex;gap:6px">
      <button class="mini-btn secondary" style="flex:1" onclick="toast('已保存航线')">💾 保存</button>
      <button class="mini-btn success" style="flex:1" onclick="showModal('开始飞行', '<p>航线已规划完成：</p><ul><li>航点：6 个</li><li>距离：3.2km</li><li>时长：18 分钟</li></ul><p>是否开始执行？</p>', '开始飞行')">🚀 开始飞行</button>
    </div>
  `, 0, ['工作台','任务','SOS','我的']) + descPanel('航线规划',
    '无人机航线规划：地图标点、航点设置、飞行参数、拍摄任务、电子围栏检查、一键起飞。',
    `<div class="feature-list"><h4>核心能力</h4><ul><li>地图航点规划</li><li>飞行参数配置</li><li>拍摄任务编排</li><li>电子围栏检查</li><li>航线保存 / 加载</li><li>一键起飞执行</li><li>自动避障</li></ul></div>`),

  // ---------- APP 实时图传 ----------
  'app-drone-video': () => phoneFrame('实时图传 · DR-001', `
    <div style="background:#000;border-radius:10px;height:240px;position:relative;margin-bottom:10px;overflow:hidden">
      <div style="position:absolute;inset:0;background:linear-gradient(135deg,#1e3a8a,#0f172a,#1e293b)"></div>
      <div style="position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px);background-size:30px 30px"></div>
      <svg style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none">
        <path d="M 50 180 Q 150 100 250 140 T 350 100" stroke="#3b82f6" stroke-width="8" fill="none" opacity="0.4"/>
      </svg>
      <div style="position:absolute;top:10%;left:30%;font-size:30px">🏠</div>
      <div style="position:absolute;top:60%;left:60%;font-size:24px">🌳</div>
      <div style="position:absolute;top:40%;left:50%;font-size:18px">🚗</div>
      <div style="position:absolute;top:8px;left:8px;background:rgba(239,68,68,.9);color:#fff;font-size:10px;padding:3px 8px;border-radius:4px">● REC 4K</div>
      <div style="position:absolute;top:8px;right:8px;background:rgba(0,0,0,.6);color:#fff;font-size:10px;padding:3px 8px;border-radius:4px">16:42:18</div>
      <div style="position:absolute;bottom:8px;left:8px;background:rgba(0,0,0,.6);color:#fff;font-size:10px;padding:3px 8px;border-radius:4px">📍 116.40, 39.98 · 120m</div>
      <div style="position:absolute;bottom:8px;right:8px;background:rgba(0,0,0,.6);color:#fff;font-size:10px;padding:3px 8px;border-radius:4px">📷 4K 30fps</div>
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:30px;height:30px;border:1px solid rgba(255,255,255,.5);border-radius:50%"></div>
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:2px;height:20px;background:rgba(255,255,255,.5)"></div>
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:20px;height:2px;background:rgba(255,255,255,.5)"></div>
    </div>
    <div class="mini-card">
      <div class="mini-title">📊 飞行状态</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:6px;text-align:center;font-size:11px">
        <div><div style="color:var(--success);font-weight:700">120m</div><div style="color:var(--text2)">高度</div></div>
        <div><div style="color:var(--success);font-weight:700">8m/s</div><div style="color:var(--text2)">速度</div></div>
        <div><div style="color:var(--success);font-weight:700">78%</div><div style="color:var(--text2)">电量</div></div>
        <div><div style="color:var(--success);font-weight:700">320m</div><div style="color:var(--text2)">距离</div></div>
      </div>
    </div>
    <div class="mini-card">
      <div class="mini-title">📹 拍摄控制</div>
      <div style="display:flex;gap:6px;margin-top:6px">
        <button class="mini-btn danger" style="flex:1;padding:6px;font-size:11px" onclick="toast('已开始录制')">🔴 录制</button>
        <button class="mini-btn" style="flex:1;padding:6px;font-size:11px" onclick="toast('已拍照')">📷 拍照</button>
        <button class="mini-btn secondary" style="flex:1;padding:6px;font-size:11px" onclick="toast('已切换相机')">🔄 相机</button>
      </div>
    </div>
    <div class="mini-card">
      <div class="mini-title">🎛️ 飞行控制</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:6px;text-align:center">
        <button class="mini-btn secondary" style="padding:6px;font-size:11px" onclick="toast('上升')">⬆️</button>
        <button class="mini-btn secondary" style="padding:6px;font-size:11px" onclick="toast('前进')">⬆️</button>
        <button class="mini-btn secondary" style="padding:6px;font-size:11px" onclick="toast('下降')">⬇️</button>
        <button class="mini-btn secondary" style="padding:6px;font-size:11px" onclick="toast('左转')">⬅️</button>
        <button class="mini-btn secondary" style="padding:6px;font-size:11px" onclick="toast('悬停')">⏸️</button>
        <button class="mini-btn secondary" style="padding:6px;font-size:11px" onclick="toast('右转')">➡️</button>
      </div>
    </div>
    <div style="display:flex;gap:6px">
      <button class="mini-btn warning" style="flex:1" onclick="toast('已开始返航')">🛬 返航</button>
      <button class="mini-btn danger" style="flex:1" onclick="showModal('紧急停止', '<p style=color:var(--danger)>将立即停止电机！</p>', '确认停止')">🚨 紧停</button>
    </div>
  `, 0, ['工作台','任务','SOS','我的']) + descPanel('实时图传',
    '无人机实时图传：4K 视频、飞行状态、拍摄控制、飞行控制、返航、紧急停止。',
    `<div class="feature-list"><h4>核心能力</h4><ul><li>4K 实时图传</li><li>飞行状态显示（高度/速度/电量/距离）</li><li>录制 / 拍照</li><li>相机切换</li><li>飞行控制（6 向）</li><li>一键返航</li><li>紧急停止</li><li>云台控制</li></ul></div>`),

  // ---------- APP 遥测监控 ----------
  'app-telemetry': () => phoneFrame('遥测监控 · DR-001', `
    <div style="font-size:12px;font-weight:700;margin-bottom:8px">📊 实时遥测数据</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">
      <div class="mini-card" style="text-align:center;padding:10px"><div style="font-size:18px;font-weight:700;color:var(--primary-light)">120<span style="font-size:10px">m</span></div><div style="font-size:10px;color:var(--text2)">高度</div></div>
      <div class="mini-card" style="text-align:center;padding:10px"><div style="font-size:18px;font-weight:700;color:var(--success)">8<span style="font-size:10px">m/s</span></div><div style="font-size:10px;color:var(--text2)">速度</div></div>
      <div class="mini-card" style="text-align:center;padding:10px"><div style="font-size:18px;font-weight:700;color:var(--accent)">78<span style="font-size:10px">%</span></div><div style="font-size:10px;color:var(--text2)">电量</div></div>
      <div class="mini-card" style="text-align:center;padding:10px"><div style="font-size:18px;font-weight:700;color:var(--purple)">320<span style="font-size:10px">m</span></div><div style="font-size:10px;color:var(--text2)">距离</div></div>
    </div>
    <div class="mini-card">
      <div class="mini-title">📈 电量曲线（最近 10 分钟）</div>
      <div style="background:var(--bg);border-radius:8px;padding:8px;margin-top:6px;height:80px;position:relative">
        <svg style="width:100%;height:100%" viewBox="0 0 280 60">
          <polyline points="0,10 30,12 60,15 90,18 120,22 150,28 180,32 210,38 240,42 270,48" stroke="#10b981" stroke-width="2" fill="none"/>
          <polyline points="0,10 30,12 60,15 90,18 120,22 150,28 180,32 210,38 240,42 270,48 270,60 0,60" fill="rgba(16,185,129,.15)"/>
        </svg>
        <div style="position:absolute;top:4px;left:8px;font-size:10px;color:var(--success)">100%</div>
        <div style="position:absolute;bottom:4px;right:8px;font-size:10px;color:var(--warning)">78%</div>
      </div>
    </div>
    <div class="mini-card">
      <div class="mini-title">🌡️ 设备状态</div>
      <div class="mini-info">🌡️ 机身温度：32°C<br>💡 GPS 信号：强（14 颗）<br>📡 图传信号：-45dBm<br>🔋 电池温度：28°C<br>⚙️ 电机转速：8500 RPM</div>
    </div>
    <div class="mini-card">
      <div class="mini-title">📍 位置信息</div>
      <div class="mini-info">坐标：116.40, 39.98<br>航向：北偏东 30°<br>风速：3.2 m/s<br>风向：西南</div>
    </div>
    <div class="mini-card">
      <div class="mini-title">⚠️ 告警信息</div>
      <div class="mini-info" style="color:var(--warning)">⚠️ 电量低于 80%，建议返航<br>⚠️ 风速接近上限</div>
    </div>
    <div class="mini-card">
      <div class="mini-title">📝 飞行记录</div>
      <div class="timeline" style="margin-top:6px">
        <div class="timeline-item done"><div class="timeline-time">15:50</div><div class="timeline-content">起飞</div></div>
        <div class="timeline-item done"><div class="timeline-time">15:55</div><div class="timeline-content">到达航点 1</div></div>
        <div class="timeline-item done"><div class="timeline-time">16:10</div><div class="timeline-content">到达航点 2 · 拍照</div></div>
        <div class="timeline-item"><div class="timeline-time">16:42</div><div class="timeline-content">飞行中 · 航点 3</div></div>
      </div>
    </div>
    <button class="mini-btn" onclick="goPage('app-drone-video')">📡 查看图传</button>
  `, 0, ['工作台','任务','SOS','我的']) + descPanel('遥测监控',
    '无人机实时遥测数据监控：高度/速度/电量/距离、电量曲线、设备状态、位置、告警、飞行记录。',
    `<div class="feature-list"><h4>核心能力</h4><ul><li>实时遥测数据</li><li>电量曲线</li><li>设备健康监控</li><li>GPS 信号</li><li>风速 / 风向</li><li>告警提醒</li><li>飞行记录回放</li></ul></div>`),

  // ---------- APP 电子围栏 ----------
  'app-geo-fence': () => phoneFrame('电子围栏', `
    <div style="font-size:12px;font-weight:700;margin-bottom:8px">🚧 电子围栏管理</div>
    <div class="map-box" style="height:240px;margin-bottom:12px">
      <div class="map-bg"></div><div class="map-grid"></div>
      <svg style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none">
        <polygon points="80,60 200,50 280,120 240,200 100,180 60,100" fill="rgba(239,68,68,.1)" stroke="#ef4444" stroke-width="2" stroke-dasharray="5,3"/>
        <polygon points="300,200 380,180 400,260 320,280" fill="rgba(245,158,11,.1)" stroke="#f59e0b" stroke-width="2" stroke-dasharray="5,3"/>
        <circle cx="200" cy="140" r="60" fill="rgba(59,130,246,.08)" stroke="#3b82f6" stroke-width="2" stroke-dasharray="5,3"/>
      </svg>
      <div class="map-info">🚧 3 个围栏区域</div>
      <div class="map-legend">
        <div class="legend-item"><div class="legend-dot" style="background:var(--danger)"></div>禁飞区</div>
        <div class="legend-item"><div class="legend-dot" style="background:var(--warning)"></div>限高区</div>
        <div class="legend-item"><div class="legend-dot" style="background:var(--primary-light)"></div>限飞区</div>
      </div>
    </div>
    <div class="mini-card" style="border-left:3px solid var(--danger)">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div><div class="mini-title">🚫 军事禁飞区</div><div class="mini-info">城北 · 全高度禁飞</div></div>
        <span class="badge badge-urgent" style="font-size:9px">禁飞</span>
      </div>
    </div>
    <div class="mini-card" style="border-left:3px solid var(--warning)">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div><div class="mini-title">⚠️ 机场限高区</div><div class="mini-info">城东 · 限高 50m</div></div>
        <span class="badge badge-pending" style="font-size:9px">限高</span>
      </div>
    </div>
    <div class="mini-card" style="border-left:3px solid var(--primary-light)">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div><div class="mini-title">📍 临时限飞区</div><div class="mini-info">城南河道 · 限高 120m</div></div>
        <span class="badge badge-progress" style="font-size:9px">限飞</span>
      </div>
    </div>
    <div class="mini-card">
      <div class="mini-title">⚙️ 围栏设置</div>
      <div class="mini-info">最大飞行高度：120m<br>最大飞行半径：500m<br>失控行为：自动返航<br>围栏告警：开启</div>
    </div>
    <div class="mini-card">
      <div class="mini-title">📊 围栏统计</div>
      <div class="mini-info">禁飞区：1 个<br>限高区：1 个<br>限飞区：1 个<br>本月违规：0 次</div>
    </div>
    <button class="mini-btn" onclick="goPage('app-flight-plan')">🗺️ 返回航线规划</button>
  `, 0, ['工作台','任务','SOS','我的']) + descPanel('电子围栏',
    '无人机电子围栏：禁飞区、限高区、限飞区管理，围栏设置，违规统计。',
    `<div class="feature-list"><h4>核心能力</h4><ul><li>禁飞区 / 限高区 / 限飞区</li><li>地图可视化</li><li>围栏参数设置</li><li>失控行为配置</li><li>违规告警</li><li>围栏统计</li></ul></div>`),

  // ---------- APP 飞手认证 ----------
  'app-pilot-cert': () => phoneFrame('飞手认证', `
    <div style="background:linear-gradient(135deg,#06b6d4,#0891b2);color:#fff;padding:14px;border-radius:10px;margin-bottom:10px;text-align:center">
      <div style="font-size:30px">📜</div>
      <div style="font-size:13px;font-weight:700;margin-top:5px">无人机飞手执照</div>
      <div style="font-size:10px;opacity:.9;margin-top:3px">民航局认证 · 全国通用</div>
    </div>
    <div class="mini-card" style="border:1px solid rgba(6,182,212,.3)">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <strong style="font-size:13px">🪪 飞手执照</strong>
        <span class="badge badge-done" style="font-size:9px">有效</span>
      </div>
      <div class="mini-info">执照号：UAS-2026-000123<br>姓名：王飞宇<br>类型：多旋翼 · 视距内<br>颁发：2024-08-20<br>有效期：2026-08-20<br>颁发机构：民航局</div>
      <div style="margin-top:8px;padding:8px;background:var(--bg);border-radius:6px;text-align:center">
        <div style="font-size:24px">🔲</div>
        <div style="font-size:10px;color:var(--text2);margin-top:3px">扫码验证执照</div>
      </div>
    </div>
    <div class="mini-card">
      <div class="mini-title">📊 飞行记录</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:6px;text-align:center">
        <div><div style="font-size:14px;font-weight:700;color:var(--primary-light)">328</div><div style="font-size:9px;color:var(--text2)">总架次</div></div>
        <div><div style="font-size:14px;font-weight:700;color:var(--success)">186h</div><div style="font-size:9px;color:var(--text2)">总时长</div></div>
        <div><div style="font-size:14px;font-weight:700;color:var(--accent)">12</div><div style="font-size:9px;color:var(--text2)">本月</div></div>
      </div>
    </div>
    <div class="mini-card">
      <div class="mini-title">🏆 资质证书</div>
      <div class="mini-info">✓ 多旋翼视距内<br>✓ 多旋翼超视距<br>✓ 航拍师认证<br>✓ 应急救援认证</div>
    </div>
    <div class="mini-card" style="border-left:3px solid var(--warning)">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div><div class="mini-title">⚠️ 执照即将到期</div><div class="mini-info">剩余 47 天 · 建议尽快复审</div></div>
        <button class="btn btn-warning btn-xs" onclick="toast('已提交复审申请')">复审</button>
      </div>
    </div>
    <div class="mini-card">
      <div class="mini-title">📚 培训记录</div>
      <div class="mini-info">📌 2024-08 无人机操作培训<br>📌 2025-06 应急救援培训<br>📌 2026-03 航拍技术提升</div>
    </div>
    <button class="mini-btn" onclick="toast('查看执照详情')">📜 查看执照</button>
    <button class="mini-btn secondary" style="margin-top:6px" onclick="toast('已提交复审申请')">📝 申请复审</button>
  `, 0, ['工作台','任务','SOS','我的']) + descPanel('飞手认证',
    '飞手执照管理：执照信息、飞行记录、资质证书、培训记录、复审申请。',
    `<div class="feature-list"><h4>核心能力</h4><ul><li>飞手执照展示</li><li>扫码验证</li><li>飞行记录统计</li><li>资质证书管理</li><li>到期提醒</li><li>复审申请</li><li>培训记录</li></ul></div>`),
};
