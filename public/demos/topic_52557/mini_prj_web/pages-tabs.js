// pages-tabs.js —— 5 个 Tab 页面（首页/知识库/诊断记录/工具/我的）
(function(){
  const style = document.createElement('style');
  style.textContent = `
  /* ===== 通用页面样式 ===== */
  .section{margin-bottom:16px}
  .section-title{font-size:15px;font-weight:600;color:var(--ink);padding:0 4px;margin-bottom:10px}
  .search-box{display:flex;align-items:center;background:var(--bg3);border:1px solid var(--rule);border-radius:8px;padding:0 12px;height:42px;margin-bottom:16px}
  .search-box input{flex:1;background:transparent;border:none;color:var(--ink);font-size:13px;outline:none}
  .search-box input::placeholder{color:var(--weak)}
  .search-box .si{color:var(--muted);margin-right:8px;font-size:14px}
  .meta-tag{display:inline-block;font-size:10px;color:var(--blue);background:rgba(59,130,246,.12);padding:1px 6px;border-radius:4px;margin-right:4px}
  .meta-text{font-size:11px;color:var(--muted)}
  .meta-dot{color:var(--weak);margin:0 4px}
  .meta-recent{color:var(--green);font-size:11px}
  .arrow{color:var(--muted)}
  /* home */
  .header{padding:12px 4px 18px}
  .header-title{font-size:30px;font-weight:700;color:var(--ink);letter-spacing:3px}
  .header-subtitle{margin-top:5px;font-size:13px;color:var(--muted)}
  .action-section{margin-bottom:16px}
  .action-btn{display:flex;align-items:center;padding:16px;border-radius:10px;margin-bottom:12px;cursor:pointer}
  .action-btn-primary{background:var(--bg3);border:1px solid var(--blue);box-shadow:0 0 14px rgba(59,130,246,.15)}
  .action-btn-secondary{background:var(--bg3);border:1px solid var(--rule)}
  .action-btn:active{opacity:.85}
  .ab-icon{width:44px;height:44px;border-radius:10px;display:flex;align-items:center;justify-content:center;margin-right:12px;font-size:22px;flex-shrink:0}
  .ab-icon-p{background:rgba(59,130,246,.15);color:var(--blue)}
  .ab-icon-s{background:rgba(136,153,176,.12);color:var(--muted)}
  .ab-title{font-size:16px;font-weight:600;color:var(--ink);margin-bottom:2px}
  .ab-desc{font-size:12px;color:var(--muted)}
  .tools-entry{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;background:var(--bg3);border:1px solid var(--rule);border-left:3px solid var(--purple);border-radius:8px;margin-bottom:24px;cursor:pointer}
  .tools-entry:active{background:#1F3047}
  .tools-entry-left{display:flex;align-items:center;gap:10px}
  .tools-entry-icon{font-size:20px}
  .tools-entry-title{font-size:14px;font-weight:600;color:var(--ink)}
  .tools-entry-desc{font-size:11px;color:var(--muted);margin-top:3px}
  .report-item{background:var(--bg3);border:1px solid var(--rule);border-radius:8px;padding:12px;margin-bottom:10px;cursor:pointer}
  .report-item:active{background:#1E2F45}
  .report-item-h{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
  .report-device{font-size:14px;font-weight:600;color:var(--ink);flex:1;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;margin-right:8px}
  .report-symptom{font-size:12px;color:var(--muted);margin-bottom:7px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
  .report-time{font-size:11px;color:var(--weak)}
  /* knowledge */
  .pkg-list{}
  .pkg-item{display:flex;align-items:center;background:var(--bg3);border:1px solid var(--rule);border-radius:8px;padding:12px;margin-bottom:10px;cursor:pointer}
  .pkg-item:active{background:#1E2F45}
  .pkg-icon{width:36px;height:36px;border-radius:8px;background:rgba(59,130,246,.15);color:var(--blue);display:flex;align-items:center;justify-content:center;font-size:18px;margin-right:12px;flex-shrink:0}
  .pkg-content{flex:1;overflow:hidden}
  .pkg-name{font-size:14px;font-weight:600;color:var(--ink);margin-bottom:4px}
  .pkg-meta{display:flex;flex-wrap:wrap;align-items:center}
  /* records */
  .filter-tabs{display:flex;margin-bottom:14px;background:var(--bg3);border-radius:8px;padding:3px}
  .filter-tab{flex:1;text-align:center;padding:7px 0;font-size:13px;color:var(--muted);border-radius:6px;cursor:pointer}
  .filter-tab.active{background:var(--blue);color:#fff;font-weight:600}
  .record-item{background:var(--bg3);border:1px solid var(--rule);border-left:3px solid var(--blue);border-radius:8px;padding:12px;margin-bottom:10px;cursor:pointer}
  .record-item:active{background:#1E2F45}
  .record-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
  .record-date{font-size:12px;color:var(--muted)}
  .record-device{font-size:14px;color:var(--ink);margin-bottom:3px}
  .record-fault{font-size:12px;color:var(--muted)}
  .dashboard-entry{display:flex;align-items:center;justify-content:space-between;background:rgba(59,130,246,.1);border:1px solid rgba(59,130,246,.3);border-radius:8px;padding:14px;margin-top:8px;cursor:pointer}
  .dashboard-entry:active{opacity:.8}
  .de-text{font-size:13px;color:var(--blue);font-weight:600}
  /* tools */
  .cat-bar{width:4px;height:16px;background:var(--blue);border-radius:2px;margin-right:8px}
  .cat-title{font-size:14px;font-weight:600;color:var(--ink)}
  .tool-grid{display:flex;flex-wrap:wrap;justify-content:space-between;margin-bottom:8px}
  .tool-card{width:48%;background:var(--bg3);border:1px solid var(--rule);border-radius:8px;padding:14px 10px;margin-bottom:10px;cursor:pointer}
  .tool-card:active{background:#1E2F45}
  .tool-icon{font-size:24px;margin-bottom:6px}
  .tool-name-row{display:flex;align-items:center;gap:4px;margin-bottom:3px}
  .tool-name{font-size:13px;font-weight:600;color:var(--ink)}
  .tool-code{font-size:10px;color:var(--blue);background:rgba(59,130,246,.12);padding:1px 5px;border-radius:3px}
  .tool-desc{font-size:11px;color:var(--muted);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
  .footer-tip{text-align:center;font-size:12px;color:var(--weak);padding:8px 0 16px}
  /* mine */
  .user-card{display:flex;align-items:center;background:var(--bg3);border:1px solid var(--rule);border-left:3px solid var(--blue);border-radius:8px;padding:14px;margin-bottom:16px}
  .user-avatar{width:44px;height:44px;border-radius:50%;background:var(--blue);color:#fff;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:600;margin-right:12px}
  .user-name{font-size:15px;font-weight:600;color:var(--ink)}
  .user-role{font-size:12px;color:var(--muted);margin-top:2px}
  .menu-group{background:var(--bg3);border:1px solid var(--rule);border-radius:8px;overflow:hidden}
  .menu-item{display:flex;align-items:center;padding:13px 14px;cursor:pointer;border-bottom:1px solid var(--rule)}
  .menu-item:last-child{border-bottom:none}
  .menu-item:active{background:#1E2F45}
  .mi-icon{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;margin-right:12px;font-size:16px;flex-shrink:0}
  .mi-report{background:rgba(59,130,246,.15);color:var(--blue)}
  .mi-store{background:rgba(34,197,94,.15);color:var(--green)}
  .mi-dashboard{background:rgba(245,158,11,.15);color:var(--warn)}
  .mi-team{background:rgba(139,92,246,.15);color:var(--purple)}
  .mi-guide{background:rgba(236,72,153,.15);color:var(--pink)}
  .menu-name{flex:1;font-size:14px;color:var(--ink)}
  .menu-arrow{color:var(--muted);font-size:16px}
  `;
  document.head.appendChild(style);
})();

const PagesTabs = {};

/* ===== 首页 home ===== */
PagesTabs.home = {
  data:{ recentReports:[] },
  navTitle:'掌师',
  onShow(){
    const all = reportStore.getAllReports().slice(0,5).map(r=>({
      id:r.id, deviceInfo:r.deviceInfo, symptom:r.symptom, status:r.status,
      statusClass: r.status==='已提交'?'success':'warning', timeText:reportStore.formatDate(r.createTime)
    }));
    this.setData({ recentReports:all });
  },
  onPhotoDiagnosis(){ this.navigateTo('photo'); },
  onManualDiagnosis(){
    diagnosisEngine.startSession({code:'MANUAL',name:'手动诊断会话',deviceModel:'待识别设备',description:'用户手动发起的诊断会话'});
    this.navigateTo('diagnosis');
  },
  onToolsEntry(){ this.switchTab('tools'); },
  onSearch(e){ const k=e.target.value.trim(); if(k) UI.toast('搜索：'+k); },
  onReportTap(id){ this.navigateTo('reportPreview',{id:id}); },
  render(d){
    return `<div>
      <div class="header"><div class="header-title">掌师</div><div class="header-subtitle">工业运维 AI 随行助手</div></div>
      <div class="search-box"><span class="si">🔍</span><input placeholder="搜索设备型号、故障码或关键词" /></div>
      <div class="action-section">
        <div class="action-btn action-btn-primary" data-act="photo"><div class="ab-icon ab-icon-p">📷</div><div><div class="ab-title">拍照诊断</div><div class="ab-desc">拍摄设备故障，AI 自动识别</div></div></div>
        <div class="action-btn action-btn-secondary" data-act="manual"><div class="ab-icon ab-icon-s">📝</div><div><div class="ab-title">手动诊断</div><div class="ab-desc">手动描述故障，引导式排查</div></div></div>
      </div>
      <div class="tools-entry" data-act="tools"><div class="tools-entry-left"><span class="tools-entry-icon">🔧</span><div><div class="tools-entry-title">实用工具箱</div><div class="tools-entry-desc">报文解析 · 通信速查 · 拨码计算 · 单位换算</div></div></div><span class="arrow">›</span></div>
      <div class="section"><div class="section-title">最近报告</div>
      ${d.recentReports.length? d.recentReports.map(r=>`
        <div class="report-item" data-act="report" data-id="${r.id}">
          <div class="report-item-h"><span class="report-device">${r.deviceInfo}</span><span class="tag tag-${r.statusClass}">${r.status}</span></div>
          <div class="report-symptom">${r.symptom}</div>
          <div class="report-time">${r.timeText}</div>
        </div>`).join('') : '<div class="empty-tip">暂无诊断报告</div>'}
      </div>
    </div>`;
  },
  bindEvents(view, inst){
    const box = view.querySelector('.search-box input');
    if(box) box.addEventListener('keydown', e=>{ if(e.key==='Enter'){ inst.onSearch(e); } });
    view.querySelectorAll('[data-act]').forEach(el=>{
      el.onclick = ()=>{
        const a = el.dataset.act;
        if(a==='photo') inst.onPhotoDiagnosis();
        else if(a==='manual') inst.onManualDiagnosis();
        else if(a==='tools') inst.onToolsEntry();
        else if(a==='report') inst.onReportTap(el.dataset.id);
      };
    });
  }
};

/* ===== 知识库 knowledge ===== */
PagesTabs.knowledge = {
  data:{ filteredPackages:[], packageCount:0 },
  navTitle:'知识库',
  onLoad(){ this.loadPackages(); },
  onShow(){ this.loadPackages(); },
  loadPackages(){
    const list = knowledgeStore.getDownloadedPackages();
    this.setData({ filteredPackages:list, packageCount:list.length });
  },
  onSearchInput(e){
    const kw = e.target.value;
    this.setData({ filteredPackages: knowledgeStore.searchDownloaded(kw) });
  },
  onPackageTap(name){ this.navigateTo('packageDetail',{name:name}); },
  onGoStore(){ this.navigateTo('knowledgeStore'); },
  render(d){
    return `<div>
      <div class="search-box"><span class="si">🔍</span><input placeholder="搜索故障码、设备型号、关键词" /></div>
      <div class="section-title">已下载知识包（${d.packageCount}）</div>
      ${d.filteredPackages.length? d.filteredPackages.map(p=>`
        <div class="pkg-item" data-name="${p.name}">
          <div class="pkg-icon">📖</div>
          <div class="pkg-content">
            <div class="pkg-name">${p.name}</div>
            <div class="pkg-meta">
              <span class="meta-tag">${p.industry}</span><span class="meta-dot">·</span>
              <span class="meta-text">${p.size}</span><span class="meta-dot">·</span>
              <span class="meta-text">${p.version}</span>
              ${p.recentUsed?'<span class="meta-dot">·</span><span class="meta-recent">最近使用</span>':''}
            </div>
          </div><span class="arrow">›</span>
        </div>`).join('') : '<div class="empty-tip">未找到匹配的知识包</div>'}
      <div class="tools-entry" data-act="store" style="border-left-color:var(--blue);margin-top:16px">
        <div class="tools-entry-left"><span style="color:var(--blue);font-weight:600;font-size:13px">+ 浏览知识商店，下载更多知识包</span></div>
      </div>
    </div>`;
  },
  bindEvents(view, inst){
    const input = view.querySelector('.search-box input');
    if(input) input.addEventListener('input', e=>inst.onSearchInput(e));
    view.querySelectorAll('[data-name]').forEach(el=>{ el.onclick=()=>inst.onPackageTap(el.dataset.name); });
    const store = view.querySelector('[data-act="store"]'); if(store) store.onclick=()=>inst.onGoStore();
  }
};

/* ===== 诊断记录 records ===== */
PagesTabs.records = {
  data:{ filters:['全部','已提交','草稿'], currentFilter:'全部', records:[] },
  navTitle:'诊断记录',
  onLoad(){ this.loadRecords(); },
  onShow(){ this.loadRecords(); },
  loadRecords(){
    const list = reportStore.filterRecords(this.data.currentFilter).map(r=>({
      ...r, statusClass: r.status==='已提交'?'tag-success':'tag-warning'
    }));
    this.setData({ records:list });
  },
  onFilterTap(status){ if(status===this.data.currentFilter) return; this.setData({currentFilter:status}); this.loadRecords(); },
  onRecordTap(id){
    const rec = this.data.records.find(r=>r.id===id);
    const reports = reportStore.getAllReports();
    let rep = reports.find(r=>r.id===id);
    if(!rep){
      const parts = rec.device.split(' · ');
      rep = reports.find(r=> parts.every(p=>r.deviceInfo.includes(p)) );
    }
    if(!rep) rep = reports.find(r=>r.symptom.includes(rec.fault));
    if(rep) this.navigateTo('reportPreview',{id:rep.id});
    else UI.toast('未找到对应报告');
  },
  onGoDashboard(){ this.navigateTo('dashboard'); },
  render(d){
    return `<div>
      <div class="filter-tabs">${d.filters.map(f=>`<div class="filter-tab ${d.currentFilter===f?'active':''}" data-status="${f}">${f}</div>`).join('')}</div>
      ${d.records.length? d.records.map(r=>`
        <div class="record-item" data-id="${r.id}">
          <div class="record-top"><span class="record-date">${r.date}</span><span class="tag ${r.statusClass}">${r.status}</span></div>
          <div class="record-device">${r.device}</div>
          <div class="record-fault">${r.fault}</div>
        </div>`).join('') : '<div class="empty-tip">📋<br>暂无诊断记录</div>'}
      <div class="dashboard-entry" data-act="dash"><span class="de-text">查看设备健康仪表板</span><span class="arrow">→</span></div>
    </div>`;
  },
  bindEvents(view, inst){
    view.querySelectorAll('[data-status]').forEach(el=>{ el.onclick=()=>inst.onFilterTap(el.dataset.status); });
    view.querySelectorAll('[data-id]').forEach(el=>{ el.onclick=()=>inst.onRecordTap(el.dataset.id); });
    const d=view.querySelector('[data-act="dash"]'); if(d) d.onclick=()=>inst.onGoDashboard();
  }
};

/* ===== 工具箱 tools ===== */
PagesTabs.tools = {
  data:{ categories:[
    { name:'协议解析类', tools:[
      {code:'T1',name:'报文解析器',icon:'📜',desc:'解析 Modbus、645、376.1 协议报文',path:'protocolParser'},
      {code:'T7',name:'CRC校验',icon:'🔢',desc:'计算 CRC-16/CRC-32/CS/XOR 校验值',path:'crcCalculator'} ] },
    { name:'通信调试类', tools:[
      {code:'T2',name:'通信速查卡',icon:'📡',desc:'RS485/232 引脚定义与波特率速查',path:'commReference'},
      {code:'T3',name:'拨码计算器',icon:'🔘',desc:'拨码开关地址快速换算',path:'dipCalculator'} ] },
    { name:'现场记录类', tools:[
      {code:'T4',name:'拍照标注',icon:'📷',desc:'现场拍照并添加故障标注',path:'photoAnnotate'},
      {code:'T5',name:'语音速记',icon:'🎤',desc:'语音转文字记录现场情况',path:'voiceMemo'} ] },
    { name:'通用工具类', tools:[
      {code:'T6',name:'单位换算',icon:'📐',desc:'功率/电压/温度/线径等单位换算',path:'unitConverter'},
      {code:'T8',name:'维保提醒',icon:'⏰',desc:'设备保养周期提醒与记录',path:'maintenanceReminder'} ] }
  ]},
  navTitle:'实用工具箱',
  onToolTap(path,name){ UI.vibrateShort(); this.navigateTo(path); },
  render(d){
    return `<div>
      <div class="header" style="padding-top:4px"><div class="header-title" style="font-size:20px">实用工具箱</div><div class="header-subtitle" style="font-size:12px">工业运维场景常用工具集</div></div>
      ${d.categories.map(c=>`
        <div class="section">
          <div style="display:flex;align-items:center;margin-bottom:10px"><span class="cat-bar"></span><span class="cat-title">${c.name}</span></div>
          <div class="tool-grid">${c.tools.map(t=>`
            <div class="tool-card" data-path="${t.path}" data-name="${t.name}">
              <div class="tool-icon">${t.icon}</div>
              <div class="tool-name-row"><span class="tool-name">${t.name}</span><span class="tool-code">${t.code}</span></div>
              <div class="tool-desc">${t.desc}</div>
            </div>`).join('')}</div>
        </div>`).join('')}
      <div class="footer-tip">更多工具持续更新中</div>
    </div>`;
  },
  bindEvents(view, inst){
    view.querySelectorAll('[data-path]').forEach(el=>{ el.onclick=()=>inst.onToolTap(el.dataset.path, el.dataset.name); });
  }
};

/* ===== 我的 mine ===== */
PagesTabs.mine = {
  data:{ menuList:[
    {name:'我的报告',path:'myReports',icon:'report',emoji:'📄'},
    {name:'知识商店',path:'knowledgeStore',icon:'store',emoji:'🛒'},
    {name:'设备健康仪表板',path:'dashboard',icon:'dashboard',emoji:'📊'},
    {name:'团队管理',path:'team',icon:'team',emoji:'👥'},
    {name:'新手引导',path:'guide',icon:'guide',emoji:'💡'}
  ]},
  navTitle:'我的',
  onMenuTap(path){ this.navigateTo(path); },
  render(d){
    return `<div>
      <div class="user-card"><div class="user-avatar">运</div><div><div class="user-name">运维工程师</div><div class="user-role">一线运维</div></div></div>
      <div class="menu-group">
        ${d.menuList.map(m=>`
          <div class="menu-item" data-path="${m.path}">
            <div class="mi-icon mi-${m.icon}">${m.emoji}</div>
            <div class="menu-name">${m.name}</div>
            <span class="menu-arrow">›</span>
          </div>`).join('')}
      </div>
    </div>`;
  },
  bindEvents(view, inst){
    view.querySelectorAll('[data-path]').forEach(el=>{ el.onclick=()=>inst.onMenuTap(el.dataset.path); });
  }
};
