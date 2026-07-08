// ============ 援力通 2.0 GIS 可交互地图 ============
// 从 DB 动态聚合标记，支持图层切换/缩放/平移/路径规划/标记点击详情

const GisView = {
  pageId: 'gis',
  // 图层开关
  layers: { team: true, task: true, sos: true, drone: true, shelter: true },
  // 视图变换
  _zoom: 1,
  _panX: 0,
  _panY: 0,
  // 图层配置
  _layerCfg: {
    team:    { icon: '🚒', label: '救援队伍', color: 'var(--primary-light)', cls: 'm-team' },
    task:    { icon: '📋', label: '任务点',   color: 'var(--accent)',        cls: 'm-task' },
    sos:     { icon: '🆘', label: 'SOS 求助', color: 'var(--danger)',         cls: 'm-sos' },
    drone:   { icon: '🚁', label: '无人机',   color: 'var(--purple)',         cls: 'm-drone' },
    shelter: { icon: '🏕️', label: '安置点',   color: 'var(--success)',        cls: 'm-shelter' },
  },
  // 安置点固定位置（DB 中无安置点集合，用固定坐标）
  _shelters: [
    { id: 'SH-01', name: '城西安置点', lng: 116.35, lat: 39.88, capacity: 200, current: 120 },
    { id: 'SH-02', name: '城北安置点', lng: 116.40, lat: 39.96, capacity: 150, current: 65 },
    { id: 'SH-03', name: '城东安置点', lng: 116.48, lat: 39.90, capacity: 180, current: 80 },
  ],

  // 经纬度 → top/left 百分比（北京地区映射）
  _project(lng, lat) {
    const left = (lng - 116.30) / 0.20 * 100;
    const top = (39.98 - lat) / 0.12 * 100;
    return {
      left: Math.max(3, Math.min(95, left)),
      top: Math.max(5, Math.min(90, top)),
    };
  },

  // location 文字 → 坐标（teams 无 lat/lng，用 location 映射）
  _locToCoord(loc) {
    const map = {
      '城南': { lng: 116.42, lat: 39.91 },
      '城北': { lng: 116.40, lat: 39.96 },
      '城东': { lng: 116.48, lat: 39.90 },
      '城西': { lng: 116.35, lat: 39.88 },
      '基地': { lng: 116.41, lat: 39.93 },
      '灾区': { lng: 116.41, lat: 39.93 },
      '北山': { lng: 116.38, lat: 39.95 },
      '西山': { lng: 116.30, lat: 39.94 },
    };
    if (!loc) return { lng: 116.41, lat: 39.93 };
    for (const key in map) {
      if (loc.includes(key)) return map[key];
    }
    return { lng: 116.41, lat: 39.93 };
  },

  // 从 DB 聚合所有标记
  _getMarkers() {
    const markers = [];
    if (this.layers.team) {
      DB.teams.forEach(t => {
        const coord = this._locToCoord(t.location);
        markers.push({ type: 'team', id: t.id, name: t.name, lng: coord.lng, lat: coord.lat });
      });
    }
    if (this.layers.task) {
      DB.tasks.forEach(t => {
        if (t.lng && t.lat) markers.push({ type: 'task', id: t.id, name: t.name, lng: t.lng, lat: t.lat });
      });
    }
    if (this.layers.sos) {
      DB.sos.forEach(s => {
        if (s.lng && s.lat) markers.push({ type: 'sos', id: s.id, name: s.type, lng: s.lng, lat: s.lat });
      });
    }
    if (this.layers.drone) {
      DB.devices.filter(d => d.type === '无人机').forEach(d => {
        markers.push({ type: 'drone', id: d.id, name: d.name, lng: d.lng, lat: d.lat });
      });
    }
    if (this.layers.shelter) {
      this._shelters.forEach(s => {
        markers.push({ type: 'shelter', id: s.id, name: s.name, lng: s.lng, lat: s.lat });
      });
    }
    return markers;
  },

  // 渲染标记 HTML
  _renderMarkersHtml(markers) {
    return markers.map(m => {
      const pos = this._project(m.lng, m.lat);
      const cfg = this._layerCfg[m.type];
      return `<div class="map-marker ${cfg.cls}" style="top:${pos.top}%;left:${pos.left}%;cursor:pointer" onclick="GisView.markerDetail('${m.type}','${m.id}')" title="${m.name}">${cfg.icon}</div>`;
    }).join('');
  },

  // 按类型计数
  _countByType(type) {
    if (type === 'team') return DB.teams.length;
    if (type === 'task') return DB.tasks.length;
    if (type === 'sos') return DB.sos.length;
    if (type === 'drone') return DB.devices.filter(d => d.type === '无人机').length;
    if (type === 'shelter') return this._shelters.length;
    return 0;
  },

  render() {
    this._subscribe();
    const markers = this._getMarkers();
    const layerBtns = Object.entries(this._layerCfg).map(([key, cfg]) => `
      <button class="filter-btn ${this.layers[key] ? 'active' : ''}" data-layer="${key}" onclick="GisView.toggleLayer('${key}')">${cfg.icon} ${cfg.label}</button>
    `).join('');
    const tf = `translate(${this._panX}px, ${this._panY}px) scale(${this._zoom})`;

    return `
    <div class="page-header">
      <div>
        <div class="page-title">🗺️ GIS 态势分析</div>
        <div class="page-subtitle">多源数据融合 · 实时图层 · 路径规划 · 点击标记查看详情</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary btn-sm" onclick="GisView.drawPath()">🧭 路径规划</button>
        <button class="btn btn-secondary btn-sm" onclick="GisView.resetView()">🎯 复位</button>
      </div>
    </div>
    <div class="filters">
      <span style="font-size:12px;color:var(--text2)">图层：</span>
      ${layerBtns}
    </div>
    <div class="map-box" style="height:520px" id="gisMap">
      <div id="gisViewport" style="position:absolute;inset:0;transform:${tf};transform-origin:center center">
        <div class="map-bg"></div>
        <div class="map-grid"></div>
        <svg style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none">
          <path d="M 0 300 Q 200 280 400 320 T 800 340" stroke="#3b82f6" stroke-width="20" fill="none" opacity="0.3"/>
          <path d="M 100 0 Q 150 200 300 400 T 500 700" stroke="#3b82f6" stroke-width="15" fill="none" opacity="0.2"/>
        </svg>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none">
          <path id="gisPath" d="" stroke="#f59e0b" stroke-width="0.5" fill="none" stroke-dasharray="2,1" opacity="0" vector-effect="non-scaling-stroke">
            <animate attributeName="stroke-dashoffset" from="0" to="-6" dur="1s" repeatCount="indefinite"/>
          </path>
        </svg>
        <div id="gisMarkers" style="position:absolute;inset:0">
          ${this._renderMarkersHtml(markers)}
        </div>
      </div>
      <div class="map-info" id="gisInfo">📍 城南市 · 实时态势 · ${DB.teams.length} 支队伍 · ${DB.tasks.length} 任务 · ${DB.sos.filter(s => s.status !== 'done').length} SOS 待处置</div>
      <div class="map-ctrls">
        <div class="map-ctrl" onclick="GisView.zoom(0.2)" title="放大">➕</div>
        <div class="map-ctrl" onclick="GisView.zoom(-0.2)" title="缩小">➖</div>
        <div class="map-ctrl" onclick="GisView.pan(0,20)" title="向上">⬆️</div>
        <div class="map-ctrl" onclick="GisView.pan(0,-20)" title="向下">⬇️</div>
        <div class="map-ctrl" onclick="GisView.pan(20,0)" title="向左">⬅️</div>
        <div class="map-ctrl" onclick="GisView.pan(-20,0)" title="向右">➡️</div>
        <div class="map-ctrl" onclick="GisView.resetView()" title="复位">🎯</div>
      </div>
      <div class="map-legend" id="gisLegend">
        ${Object.entries(this._layerCfg).filter(([k]) => this.layers[k]).map(([k, cfg]) => `
          <div class="legend-item"><div class="legend-dot" style="background:${cfg.color}"></div>${cfg.label} (${this._countByType(k)})</div>
        `).join('')}
      </div>
    </div>
    <div class="grid grid-3" style="margin-top:14px">
      <div class="card">
        <div style="font-weight:700;font-size:13px;margin-bottom:8px">📊 图层统计</div>
        <div style="font-size:12px;color:var(--text2);line-height:1.8">
          <p>🚒 救援队伍：${DB.teams.length} 支（${DB.teams.filter(t => t.status === 'busy').length} 执行任务中）</p>
          <p>📋 任务点：${DB.tasks.length} 个（${DB.tasks.filter(t => t.status === 'progress').length} 进行中）</p>
          <p>🆘 SOS 求助：${DB.sos.length} 个（${DB.sos.filter(s => s.status === 'pending').length} 待处置）</p>
          <p>🚁 无人机：${DB.devices.filter(d => d.type === '无人机').length} 架（${DB.devices.filter(d => d.type === '无人机' && d.status === 'flying').length} 飞行中）</p>
          <p>🏕️ 安置点：${this._shelters.length} 个（${this._shelters.reduce((s, x) => s + x.current, 0)} 人）</p>
        </div>
      </div>
      <div class="card">
        <div style="font-weight:700;font-size:13px;margin-bottom:8px">🌧️ 气象联动</div>
        <div style="font-size:12px;color:var(--text2);line-height:1.8">
          <p>🌧️ 24 小时降雨 85mm</p>
          <p>💨 风速 6.5 m/s</p>
          <p>⚠️ 洪水预警：黄色</p>
          <p>🌡️ 气温 26°C · 湿度 85%</p>
        </div>
      </div>
      <div class="card">
        <div style="font-weight:700;font-size:13px;margin-bottom:8px">🚦 交通状况</div>
        <div style="font-size:12px;color:var(--text2);line-height:1.8">
          <p>🟢 城东快速路：畅通</p>
          <p>🔴 城南大道：拥堵</p>
          <p>🟡 北山路：缓行</p>
          <p>🟢 西环路：畅通</p>
        </div>
      </div>
    </div>
    `;
  },

  // 局部刷新标记（不重渲染整个页面）
  _refreshMarkers() {
    const el = document.getElementById('gisMarkers');
    if (!el) return;
    el.innerHTML = this._renderMarkersHtml(this._getMarkers());
    const info = document.getElementById('gisInfo');
    if (info) info.textContent = `📍 城南市 · 实时态势 · ${DB.teams.length} 支队伍 · ${DB.tasks.length} 任务 · ${DB.sos.filter(s => s.status !== 'done').length} SOS 待处置`;
    const legend = document.getElementById('gisLegend');
    if (legend) {
      legend.innerHTML = Object.entries(this._layerCfg).filter(([k]) => this.layers[k]).map(([k, cfg]) => `
        <div class="legend-item"><div class="legend-dot" style="background:${cfg.color}"></div>${cfg.label} (${this._countByType(k)})</div>
      `).join('');
    }
  },

  // 切换图层
  toggleLayer(name) {
    this.layers[name] = !this.layers[name];
    const btn = document.querySelector(`[data-layer="${name}"]`);
    if (btn) btn.classList.toggle('active', this.layers[name]);
    this._refreshMarkers();
    toast(`图层「${this._layerCfg[name].label}」已${this.layers[name] ? '显示' : '隐藏'}`);
  },

  // 标记点击 → Drawer 详情
  markerDetail(type, id) {
    let title, body, actions;
    if (type === 'team') {
      const d = Store.get('teams', id);
      if (!d) return;
      title = `🚒 ${d.name}`;
      body = `<div style="line-height:2;font-size:13px">
        <div><strong>类型：</strong>${d.type} · ${d.level}</div>
        <div><strong>队长：</strong>${d.leader}</div>
        <div><strong>人数：</strong>${d.members} 人（${d.available} 可用）</div>
        <div><strong>状态：</strong><span class="badge badge-${d.status === 'busy' ? 'progress' : 'done'}">${d.status === 'busy' ? '执行任务中' : '待命'}</span></div>
        <div><strong>驻地：</strong>${d.location}</div>
        <div><strong>当前任务：</strong>${d.tasks} 个</div>
      </div>`;
      actions = `<button class="btn btn-secondary btn-sm" onclick="Drawer.close()">关闭</button><button class="btn btn-primary btn-sm" onclick="Drawer.close();TeamView.detail('${id}')">队伍详情</button>`;
    } else if (type === 'task') {
      const d = Store.get('tasks', id);
      if (!d) return;
      const statusMap = { pending: '待开始', progress: '进行中', done: '已完成' };
      const priorityMap = { urgent: '紧急', high: '高', normal: '中', low: '低' };
      title = `📋 ${d.name}`;
      body = `<div style="line-height:2;font-size:13px">
        <div><strong>编号：</strong>${d.id}</div>
        <div><strong>类型：</strong>${d.type}</div>
        <div><strong>状态：</strong><span class="badge badge-${d.status === 'done' ? 'done' : d.status === 'progress' ? 'progress' : 'pending'}">${statusMap[d.status]}</span> · <strong>优先级：</strong>${priorityMap[d.priority]}</div>
        <div><strong>负责队伍：</strong>${d.team}（${d.leader}）</div>
        <div><strong>地点：</strong>${d.location}</div>
        <div><strong>进度：</strong>${d.progress}%</div>
        <div class="progress-bar" style="margin:6px 0"><div class="progress-fill" style="width:${d.progress}%"></div></div>
        <div><strong>描述：</strong>${d.desc}</div>
      </div>`;
      actions = `<button class="btn btn-secondary btn-sm" onclick="Drawer.close()">关闭</button><button class="btn btn-primary btn-sm" onclick="Drawer.close();TaskView.detail('${id}')">任务详情</button>`;
    } else if (type === 'sos') {
      const d = Store.get('sos', id);
      if (!d) return;
      const levelMap = { 1: '一级紧急', 2: '二级紧急', 3: '三级紧急' };
      const statusMap = { pending: '待处置', progress: '处置中', done: '已解决' };
      title = `🆘 ${d.type}`;
      body = `<div style="line-height:2;font-size:13px">
        <div><strong>编号：</strong>${d.id}</div>
        <div><strong>紧急程度：</strong><span class="badge badge-urgent">${levelMap[d.level]}</span></div>
        <div><strong>状态：</strong>${statusMap[d.status]}</div>
        <div><strong>求助人：</strong>${d.reporter}（${d.phone}）</div>
        <div><strong>地点：</strong>${d.location}</div>
        <div><strong>被困人数：</strong>${d.count} 人</div>
        <div><strong>描述：</strong>${d.desc}</div>
        <div><strong>时间：</strong>${d.time}</div>
      </div>`;
      actions = `<button class="btn btn-secondary btn-sm" onclick="Drawer.close()">关闭</button><button class="btn btn-danger btn-sm" onclick="Drawer.close();SosView.detail('${id}')">立即处置</button>`;
    } else if (type === 'drone') {
      const d = Store.get('devices', id);
      if (!d) return;
      title = `🚁 ${d.name}`;
      body = `<div style="line-height:2;font-size:13px">
        <div><strong>型号：</strong>${d.model}</div>
        <div><strong>状态：</strong><span class="badge badge-${d.status === 'flying' ? 'progress' : 'done'}">${d.status === 'flying' ? '飞行中' : '在线'}</span></div>
        <div><strong>归属：</strong>${d.owner}</div>
        <div><strong>电量：</strong>${d.battery}%</div>
        <div class="progress-bar" style="margin:4px 0"><div class="progress-fill" style="width:${d.battery}%;background:${d.battery < 30 ? 'var(--danger)' : 'var(--success)'}"></div></div>
        <div><strong>位置：</strong>${d.lat.toFixed(4)}, ${d.lng.toFixed(4)} · 海拔 ${d.alt}m</div>
      </div>`;
      actions = `<button class="btn btn-secondary btn-sm" onclick="Drawer.close()">关闭</button>`;
    } else if (type === 'shelter') {
      const d = this._shelters.find(s => s.id === id);
      if (!d) return;
      title = `🏕️ ${d.name}`;
      body = `<div style="line-height:2;font-size:13px">
        <div><strong>容量：</strong>${d.capacity} 人</div>
        <div><strong>当前安置：</strong>${d.current} 人（${Math.round(d.current / d.capacity * 100)}%）</div>
        <div class="progress-bar" style="margin:6px 0"><div class="progress-fill" style="width:${d.current / d.capacity * 100}%"></div></div>
        <div><strong>位置：</strong>${d.lng}, ${d.lat}</div>
      </div>`;
      actions = `<button class="btn btn-secondary btn-sm" onclick="Drawer.close()">关闭</button>`;
    }
    Drawer.open(title, body, actions);
  },

  // 路径规划：从最近的队伍到待处置 SOS
  drawPath() {
    const team = DB.teams.find(t => t.status === 'idle') || DB.teams[0];
    const sos = DB.sos.find(s => s.status === 'pending') || DB.sos[0];
    if (!team || !sos) { toast('暂无可规划路径的标记'); return; }
    const teamCoord = this._locToCoord(team.location);
    const from = this._project(teamCoord.lng, teamCoord.lat);
    const to = this._project(sos.lng, sos.lat);
    const path = document.getElementById('gisPath');
    if (path) {
      path.setAttribute('d', `M ${from.left} ${from.top} Q ${(from.left + to.left) / 2} ${Math.min(from.top, to.top) - 8} ${to.left} ${to.top}`);
      path.setAttribute('opacity', '0.9');
    }
    // 简化距离计算（经纬度差 → km）
    const dx = (sos.lng - teamCoord.lng) * 111 * Math.cos(39.93 * Math.PI / 180);
    const dy = (sos.lat - teamCoord.lat) * 111;
    const dist = Math.sqrt(dx * dx + dy * dy).toFixed(1);
    const eta = Math.max(5, Math.round(dist / 30 * 60));
    toast(`🧭 路径已规划：${team.name} → ${sos.type}（${sos.location}）· 约 ${dist}km · 预计 ${eta} 分钟`);
  },

  // 缩放
  zoom(delta) {
    this._zoom = Math.max(0.5, Math.min(3, this._zoom + delta));
    this._applyTransform();
    toast(`🔍 缩放：${Math.round(this._zoom * 100)}%`);
  },

  // 平移
  pan(dx, dy) {
    this._panX += dx;
    this._panY += dy;
    this._applyTransform();
  },

  // 复位
  resetView() {
    this._zoom = 1;
    this._panX = 0;
    this._panY = 0;
    this._applyTransform();
    const path = document.getElementById('gisPath');
    if (path) path.setAttribute('opacity', '0');
    toast('🎯 已复位');
  },

  // 应用变换到视口
  _applyTransform() {
    const vp = document.getElementById('gisViewport');
    if (vp) vp.style.transform = `translate(${this._panX}px, ${this._panY}px) scale(${this._zoom})`;
  },

  // 订阅实时更新（无人机移动、数据变化时刷新标记）
  _subscribe() {
    Store.subscribePage('gis', ['live:update', 'global:change', 'tasks:update', 'sos:update', 'equip:update'], () => {
      this._refreshMarkers();
    });
  },

  _cleanup() {
    Store.cleanupPage('gis');
  },
};
