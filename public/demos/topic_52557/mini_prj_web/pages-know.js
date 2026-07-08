// pages-know.js —— 知识库相关 5 个页面（知识包详情/知识商店/设备健康仪表板/团队管理/新手引导）
(function(){
  const style = document.createElement('style');
  style.textContent = `
  /* ===== packageDetail 知识包详情 ===== */
  .pd-breadcrumb{display:flex;align-items:center;font-size:12px;color:var(--muted);margin-bottom:12px}
  .pd-breadcrumb .bc-link{color:var(--blue);cursor:pointer}
  .pd-breadcrumb .sep{margin:0 6px;color:var(--weak)}
  .pd-breadcrumb .cur{color:var(--ink)}
  .pd-tabs{display:flex;background:var(--bg3);border:1px solid var(--rule);border-radius:8px;padding:3px;margin-bottom:14px}
  .pd-tab{flex:1;text-align:center;padding:8px 0;font-size:12px;color:var(--muted);border-radius:6px;cursor:pointer}
  .pd-tab.active{background:var(--blue);color:#fff;font-weight:600}
  .pd-fault-card{background:var(--bg3);border:1px solid var(--rule);border-radius:8px;padding:12px;margin-bottom:8px}
  .pd-fault-code{font-size:14px;font-weight:700;color:var(--blue);margin-bottom:4px;font-family:Menlo,Consolas,monospace}
  .pd-fault-desc{font-size:13px;color:var(--ink);margin-bottom:6px}
  .pd-fault-cat{display:inline-block;font-size:10px;color:var(--muted);background:rgba(136,153,176,.12);padding:2px 6px;border-radius:4px}
  .pd-step{display:flex;align-items:flex-start;background:var(--bg3);border:1px solid var(--rule);border-radius:8px;padding:12px;margin-bottom:8px}
  .pd-step-num{width:24px;height:24px;border-radius:50%;background:rgba(59,130,246,.15);color:var(--blue);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;margin-right:10px;flex-shrink:0}
  .pd-step-text{font-size:13px;color:var(--ink);line-height:1.5;flex:1;padding-top:3px}
  .pd-wiring{background:var(--bg3);border:1px solid var(--rule);border-radius:8px;padding:20px;text-align:center}
  .pd-wiring-box{width:100%;height:140px;border:2px dashed var(--rule);border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;margin-bottom:12px}
  .pd-wiring-cross{font-size:40px;color:var(--muted);line-height:1;margin-bottom:8px}
  .pd-wiring-tip{font-size:12px;color:var(--muted)}
  .pd-faq{background:var(--bg3);border:1px solid var(--rule);border-left:3px solid var(--blue);border-radius:8px;padding:12px;margin-bottom:8px}
  .pd-faq-q{font-size:13px;font-weight:600;color:var(--ink);margin-bottom:6px}
  .pd-faq-a{font-size:12px;color:var(--muted);line-height:1.6}

  /* ===== knowledgeStore 知识商店 ===== */
  .ks-cat-scroll{display:flex;gap:8px;overflow-x:auto;padding-bottom:12px;margin-bottom:4px;-webkit-overflow-scrolling:touch}
  .ks-cat-scroll::-webkit-scrollbar{display:none}
  .ks-cat-chip{flex-shrink:0;padding:6px 14px;font-size:12px;color:var(--muted);background:var(--bg3);border:1px solid var(--rule);border-radius:16px;cursor:pointer;white-space:nowrap}
  .ks-cat-chip.active{background:var(--blue);color:#fff;border-color:var(--blue);font-weight:600}
  .ks-pkg-item{display:flex;align-items:center;background:var(--bg3);border:1px solid var(--rule);border-radius:8px;padding:12px;margin-bottom:10px}
  .ks-pkg-icon{width:36px;height:36px;border-radius:8px;background:rgba(59,130,246,.15);color:var(--blue);display:flex;align-items:center;justify-content:center;font-size:18px;margin-right:12px;flex-shrink:0}
  .ks-pkg-content{flex:1;overflow:hidden}
  .ks-pkg-name{font-size:14px;font-weight:600;color:var(--ink);margin-bottom:4px}
  .ks-pkg-meta{display:flex;flex-wrap:wrap;align-items:center}
  .ks-dl-btn{flex-shrink:0;font-size:12px;font-weight:600;padding:7px 16px;border-radius:16px;cursor:default;border:none;white-space:nowrap}
  .ks-dl-go{background:var(--blue);color:#fff;cursor:pointer}
  .ks-dl-ing{background:rgba(245,158,11,.15);color:var(--warn)}
  .ks-dl-done{background:rgba(136,153,176,.12);color:var(--muted)}

  /* ===== dashboard 设备健康仪表板 ===== */
  .db-top-cards{display:flex;gap:8px;margin-bottom:16px}
  .db-top-card{flex:1;background:var(--bg3);border:1px solid var(--rule);border-radius:8px;padding:14px 8px;text-align:center}
  .db-stat-num{font-size:22px;font-weight:700;color:var(--ink);line-height:1.2}
  .db-stat-num.green{color:var(--green)}
  .db-stat-num.orange{color:var(--warn)}
  .db-stat-unit{font-size:13px;font-weight:400}
  .db-stat-label{font-size:11px;color:var(--muted);margin-top:4px}
  .db-trend-chart{background:var(--bg);border:1px solid var(--rule);border-radius:8px;padding:10px 8px 6px}
  .db-trend-bars{display:flex;align-items:flex-end;justify-content:space-around;height:110px}
  .db-trend-bar-wrap{display:flex;flex-direction:column;justify-content:flex-end;align-items:center;flex:1;height:100%}
  .db-trend-bar{width:20px;border-radius:3px 3px 0 0}
  .db-trend-dates{display:flex;justify-content:space-around;margin-top:6px}
  .db-trend-date{flex:1;text-align:center;font-size:9px;color:var(--weak)}
  .db-legend{display:flex;justify-content:center;gap:16px;margin-top:10px;font-size:11px;color:var(--muted)}
  .db-legend-dot{display:inline-block;width:8px;height:8px;border-radius:2px;margin-right:4px;vertical-align:middle}
  .db-fault-row{display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--rule)}
  .db-fault-row:last-child{border-bottom:none}
  .db-fault-name{font-size:13px;color:var(--ink)}
  .db-fault-count{font-size:13px;font-weight:600;color:var(--blue)}
  .db-warning{background:var(--bg3);border:1px solid var(--rule);border-left:3px solid var(--warn);border-radius:8px;padding:12px;margin-top:12px}
  .db-warning-title{font-size:13px;font-weight:600;color:var(--warn);margin-bottom:8px}
  .db-warning-item{font-size:12px;color:var(--muted);line-height:1.6;padding:3px 0}

  /* ===== team 团队管理 ===== */
  .tm-stats-card{display:flex;background:var(--bg3);border:1px solid var(--rule);border-left:3px solid var(--blue);border-radius:8px;padding:14px;margin-bottom:16px}
  .tm-stat{flex:1;text-align:center}
  .tm-stat-num{font-size:20px;font-weight:700;color:var(--ink)}
  .tm-stat-label{font-size:11px;color:var(--muted);margin-top:3px}
  .tm-divider{width:1px;background:var(--rule)}
  .tm-member{display:flex;align-items:center;background:var(--bg3);border:1px solid var(--rule);border-radius:8px;padding:12px;margin-bottom:10px}
  .tm-avatar{width:40px;height:40px;border-radius:50%;background:var(--blue);color:#fff;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:600;margin-right:12px;flex-shrink:0}
  .tm-mid{flex:1;overflow:hidden}
  .tm-mid-top{display:flex;align-items:center;margin-bottom:6px}
  .tm-mid-name{font-size:14px;font-weight:600;color:var(--ink);margin-right:8px}
  .tm-mid-role{font-size:10px;color:var(--purple);background:rgba(139,92,246,.12);padding:1px 6px;border-radius:4px}
  .tm-mid-stats{display:flex;gap:12px;font-size:11px;color:var(--muted)}
  .tm-approval{background:var(--bg3);border:1px solid var(--rule);border-left:3px solid var(--warn);border-radius:8px;padding:12px;margin-bottom:10px}
  .tm-ap-title{font-size:14px;font-weight:600;color:var(--ink);margin-bottom:6px}
  .tm-ap-meta{display:flex;align-items:center;font-size:11px;color:var(--muted);margin-bottom:6px;gap:6px}
  .tm-ap-desc{font-size:12px;color:var(--muted);line-height:1.5;margin-bottom:10px}
  .tm-ap-btns{display:flex;gap:8px}
  .tm-btn{flex:1;height:34px;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center}
  .tm-btn-approve{background:var(--blue);color:#fff;border:none}
  .tm-btn-reject{background:transparent;color:var(--red);border:1px solid var(--red)}
  .tm-approved{background:var(--bg3);border:1px solid var(--rule);border-left:3px solid var(--green);border-radius:8px;padding:12px;margin-bottom:10px}
  .tm-ap-status{font-size:11px;color:var(--green);font-weight:600;margin-top:4px}

  /* ===== guide 新手引导 ===== */
  .gd-wrap{display:flex;flex-direction:column;min-height:540px}
  .gd-progress{display:flex;align-items:center;justify-content:center;padding:24px 0 36px}
  .gd-dot{width:12px;height:12px;border-radius:50%;background:var(--rule);transition:all .3s}
  .gd-dot.active{background:var(--blue);box-shadow:0 0 12px rgba(59,130,246,.6)}
  .gd-line{width:50px;height:2px;background:var(--rule)}
  .gd-line.active{background:var(--blue)}
  .gd-content{flex:1;display:flex;flex-direction:column;align-items:center;text-align:center;padding:0 24px}
  .gd-icon-circle{width:110px;height:110px;border-radius:50%;background:rgba(59,130,246,.1);border:2px solid var(--blue);display:flex;align-items:center;justify-content:center;font-size:52px;margin-bottom:24px;box-shadow:0 0 30px rgba(59,130,246,.2)}
  .gd-title{font-size:20px;font-weight:700;color:var(--ink);margin-bottom:10px}
  .gd-desc{font-size:13px;color:var(--muted);line-height:1.6;margin-bottom:16px}
  .gd-step-num{font-size:12px;color:var(--weak)}
  .gd-footer{padding:20px 0;display:flex;gap:10px}
  .gd-btn-skip{flex:1;height:44px;border-radius:8px;background:var(--bg3);color:var(--muted);font-size:14px;border:1px solid var(--rule);cursor:pointer;display:flex;align-items:center;justify-content:center}
  .gd-btn-next{flex:2;height:44px;border-radius:8px;background:var(--blue);color:#fff;font-size:14px;font-weight:600;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center}
  .gd-btn-start{flex:1;height:44px;border-radius:8px;background:var(--blue);color:#fff;font-size:15px;font-weight:600;border:none;cursor:pointer;box-shadow:0 0 20px rgba(59,130,246,.5);display:flex;align-items:center;justify-content:center}
  `;
  document.head.appendChild(style);
})();

const PagesKnow = {};

/* ===== 1. packageDetail 知识包详情页 ===== */
PagesKnow.packageDetail = {
  data:{
    name:'',
    tabs:['故障码对照','维修步骤','接线图','FAQ'],
    activeTab:0,
    searchKw:'',
    faultCodes:[],
    repairSteps:[],
    faqList:[]
  },
  navTitle(data){ return (data && data.name) ? data.name : '知识包详情'; },
  onLoad(options){
    this.setData({ name: options.name || '' });
    this.initContent();
  },
  // 从 knowledgeStore 加载内容数据
  initContent(){
    // 将 wfetFaq（"Q: ...\nA: ..." 字符串）拆分为 {question, answer}
    const faqList = knowledgeStore.wfetFaq.map(s=>{
      const lines = s.split('\n');
      let question='', answer='';
      lines.forEach(l=>{
        if(l.indexOf('Q:')===0) question = l.replace(/^Q:\s*/, '');
        else if(l.indexOf('A:')===0) answer = l.replace(/^A:\s*/, '');
      });
      return { question, answer };
    });
    this.setData({
      faultCodes: knowledgeStore.wfetFaultCodes,
      repairSteps: knowledgeStore.wfetRepairSteps,
      faqList: faqList
    });
  },
  // 切换 Tab
  onTabTap(idx){ this.setData({ activeTab: idx }); },
  // 包内搜索：过滤故障码并强制切回 Tab0
  onSearchInput(e){
    const kw = e.target.value;
    this.setData({
      searchKw: kw,
      faultCodes: knowledgeStore.searchFaultCodes(kw),
      activeTab: 0
    });
  },
  // 返回知识库
  onBackToKnowledge(){ this.navigateBack(); },
  render(d){
    // 按 activeTab 渲染对应内容
    const tabContent = (()=>{
      switch(d.activeTab){
        case 0: // 故障码对照
          return d.faultCodes.length ? d.faultCodes.map(f=>`
            <div class="pd-fault-card">
              <div class="pd-fault-code">${f.code}</div>
              <div class="pd-fault-desc">${f.description}</div>
              <span class="pd-fault-cat">${f.category}</span>
            </div>`).join('') : '<div class="empty-tip">未找到匹配的故障码</div>';
        case 1: // 维修步骤
          return d.repairSteps.map((s,idx)=>`
            <div class="pd-step">
              <div class="pd-step-num">${idx+1}</div>
              <div class="pd-step-text">${s}</div>
            </div>`).join('');
        case 2: // 接线图（纯展示占位）
          return `<div class="pd-wiring">
            <div class="pd-wiring-box">
              <div class="pd-wiring-cross">+</div>
              <div class="pd-wiring-tip">接线图示意图</div>
            </div>
            <div class="pd-wiring-tip">点击查看完整接线图</div>
          </div>`;
        case 3: // FAQ
          return d.faqList.length ? d.faqList.map(f=>`
            <div class="pd-faq">
              <div class="pd-faq-q">${f.question}</div>
              <div class="pd-faq-a">${f.answer}</div>
            </div>`).join('') : '<div class="empty-tip">暂无 FAQ</div>';
        default: return '';
      }
    })();
    return `<div>
      <div class="pd-breadcrumb">
        <span class="bc-link" data-act="back">知识库</span>
        <span class="sep">›</span>
        <span class="cur">${d.name||'知识包详情'}</span>
      </div>
      <div class="search-box"><span class="si">🔍</span><input placeholder="搜索故障码或关键词" /></div>
      <div class="pd-tabs">
        ${d.tabs.map((t,i)=>`<div class="pd-tab ${d.activeTab===i?'active':''}" data-tab="${i}">${t}</div>`).join('')}
      </div>
      ${tabContent}
    </div>`;
  },
  bindEvents(view, inst){
    const input = view.querySelector('.search-box input');
    if(input){
      input.value = inst.data.searchKw;
      input.addEventListener('input', e=>inst.onSearchInput(e));
    }
    view.querySelectorAll('[data-tab]').forEach(el=>{ el.onclick=()=>inst.onTabTap(parseInt(el.dataset.tab)); });
    const back = view.querySelector('[data-act="back"]');
    if(back) back.onclick=()=>inst.onBackToKnowledge();
  }
};

/* ===== 2. knowledgeStore 知识商店页 ===== */
PagesKnow.knowledgeStore = {
  data:{
    categories:['全部','电力','水务','工控'],
    activeCategory:'全部',
    keyword:'',
    displayList:[],
    downloadingName:''
  },
  navTitle:'知识商店',
  onLoad(){ this.initData(); },
  // 加载全部数据并同步已下载状态
  initData(){
    knowledgeStore.storePackages.forEach(sp=>{
      if(knowledgeStore.downloadedPackages.find(dp=>dp.name===sp.name)){
        sp.downloaded = true;
      }
    });
    this.applyFilter();
  },
  // 筛选：先按分类，再按 keyword 过滤 name/industry
  applyFilter(){
    let list = knowledgeStore.filterStoreByCategory(this.data.activeCategory);
    const kw = this.data.keyword.trim().toLowerCase();
    if(kw){
      list = list.filter(p=>p.name.toLowerCase().includes(kw) || p.industry.toLowerCase().includes(kw));
    }
    this.setData({ displayList: list });
  },
  // 切换分类
  onCategoryTap(cat){
    this.setData({ activeCategory: cat });
    this.applyFilter();
  },
  // 搜索输入
  onSearchInput(e){
    this.setData({ keyword: e.target.value });
    this.applyFilter();
  },
  // 下载知识包（阻止冒泡）
  onDownload(name, e){
    if(e) e.stopPropagation();
    if(this.data.downloadingName) return;
    this.setData({ downloadingName: name });
    UI.toast('下载中...', 'none', 1500);
    setTimeout(()=>{
      knowledgeStore.downloadPackage(name);
      this.setData({ downloadingName: '' });
      this.applyFilter();
      UI.toast('下载成功', 'success');
    }, 1500);
  },
  render(d){
    return `<div>
      <div class="search-box"><span class="si">🔍</span><input placeholder="搜索知识包名称或行业" /></div>
      <div class="ks-cat-scroll">
        ${d.categories.map(c=>`<div class="ks-cat-chip ${d.activeCategory===c?'active':''}" data-cat="${c}">${c}</div>`).join('')}
      </div>
      <div class="section-title">可用知识包（${d.displayList.length}）</div>
      ${d.displayList.length ? d.displayList.map(p=>{
        const dl = p.downloaded;
        const ing = d.downloadingName===p.name;
        const cls = dl ? 'ks-dl-done' : (ing ? 'ks-dl-ing' : 'ks-dl-go');
        const txt = dl ? '已下载' : (ing ? '下载中' : '下载');
        const dlAttr = (!dl && !ing) ? `data-dl="${p.name}"` : '';
        return `<div class="ks-pkg-item">
          <div class="ks-pkg-icon">📖</div>
          <div class="ks-pkg-content">
            <div class="ks-pkg-name">${p.name}</div>
            <div class="ks-pkg-meta">
              <span class="meta-tag">${p.industry}</span><span class="meta-dot">·</span>
              <span class="meta-text">${p.size}</span><span class="meta-dot">·</span>
              <span class="meta-text">${p.version}</span>
            </div>
          </div>
          <div class="ks-dl-btn ${cls}" ${dlAttr}>${txt}</div>
        </div>`;
      }).join('') : '<div class="empty-tip">未找到匹配的知识包</div>'}
    </div>`;
  },
  bindEvents(view, inst){
    const input = view.querySelector('.search-box input');
    if(input){
      input.value = inst.data.keyword;
      input.addEventListener('input', e=>inst.onSearchInput(e));
    }
    view.querySelectorAll('[data-cat]').forEach(el=>{ el.onclick=()=>inst.onCategoryTap(el.dataset.cat); });
    view.querySelectorAll('[data-dl]').forEach(el=>{
      el.onclick = (e)=>inst.onDownload(el.dataset.dl, e);
    });
  }
};

/* ===== 3. dashboard 设备健康仪表板页 ===== */
PagesKnow.dashboard = {
  data:{
    diagCount:0,
    submittedCount:0,
    healthScore:100,
    healthColor:'green',
    avgDuration:0,
    trend:[],
    faultDist:[],
    warnings:[]
  },
  navTitle:'设备健康仪表板',
  onLoad(){ this.computeStats(); },
  // 统计计算（复刻小程序逻辑）
  computeStats(){
    const records = reportStore.getRecords();
    const reports = reportStore.getAllReports();
    const diagCount = records.length;
    const submittedCount = records.filter(r=>r.status==='已提交').length;
    const healthScore = Math.max(60, 100 - submittedCount*10);
    const healthColor = healthScore>=80 ? 'green' : 'orange';
    // 平均耗时：遍历 reports，用正则从 duration 提取分钟数求平均
    let durSum=0, durCnt=0;
    reports.forEach(r=>{
      const m = r.duration && r.duration.match(/诊断耗时\s*(\d+)\s*分钟/);
      if(m){ durSum += parseInt(m[1]); durCnt++; }
    });
    const avgDuration = durCnt>0 ? Math.round(durSum/durCnt) : 0;
    // 趋势：取 records 前6条并 reverse（左旧右新）
    const trendRaw = records.slice(0,6).reverse();
    const trend = trendRaw.map((r,i)=>{
      const submitted = r.status==='已提交';
      return {
        date: r.date,
        color: submitted ? 'var(--warn)' : 'var(--blue)',
        height: submitted ? 78+(i%3)*6 : 38+(i%3)*5
      };
    });
    // 故障类型分布：按 fault 分组计数，按次数倒序
    const fmap = {};
    records.forEach(r=>{ fmap[r.fault] = (fmap[r.fault]||0)+1; });
    const faultDist = Object.keys(fmap).map(k=>({name:k, count:fmap[k]})).sort((a,b)=>b.count-a.count);
    // 预警：count>=2 的故障生成建议
    const warnings = faultDist.filter(f=>f.count>=2).map(f=>`「${f.name}」近期出现 ${f.count} 次，建议重点排查相关设备与通信链路。`);
    this.setData({ diagCount, submittedCount, healthScore, healthColor, avgDuration, trend, faultDist, warnings });
  },
  render(d){
    return `<div>
      <div class="db-top-cards">
        <div class="db-top-card">
          <div class="db-stat-num">${d.diagCount}</div>
          <div class="db-stat-label">诊断次数</div>
        </div>
        <div class="db-top-card">
          <div class="db-stat-num ${d.healthColor}">${d.healthScore}</div>
          <div class="db-stat-label">健康评分</div>
        </div>
        <div class="db-top-card">
          <div class="db-stat-num">${d.avgDuration}<span class="db-stat-unit">min</span></div>
          <div class="db-stat-label">平均耗时</div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">诊断趋势</div>
        <div class="card">
          <div class="db-trend-chart">
            <div class="db-trend-bars">
              ${d.trend.map(t=>`
                <div class="db-trend-bar-wrap">
                  <div class="db-trend-bar" style="height:${t.height}%;background:${t.color}"></div>
                </div>`).join('')}
            </div>
            <div class="db-trend-dates">
              ${d.trend.map(t=>`<div class="db-trend-date">${t.date}</div>`).join('')}
            </div>
          </div>
          <div class="db-legend">
            <span><span class="db-legend-dot" style="background:var(--warn)"></span>已提交</span>
            <span><span class="db-legend-dot" style="background:var(--blue)"></span>草稿</span>
          </div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">故障类型分布</div>
        <div class="card">
          ${d.faultDist.length ? d.faultDist.map(f=>`
            <div class="db-fault-row">
              <span class="db-fault-name">${f.name}</span>
              <span class="db-fault-count">${f.count} 次</span>
            </div>`).join('') : '<div class="empty-tip">暂无故障数据</div>'}
        </div>
      </div>
      ${d.warnings.length ? `<div class="db-warning">
        <div class="db-warning-title">⚠ 预警建议</div>
        ${d.warnings.map(w=>`<div class="db-warning-item">${w}</div>`).join('')}
      </div>` : ''}
    </div>`;
  },
  bindEvents(){}
};

/* ===== 4. team 团队管理页 ===== */
PagesKnow.team = {
  data:{
    members:[],
    approvals:[],
    approvedCases:[],
    totalReports:0,
    avgAccuracy:0,
    avgDuration:0
  },
  navTitle:'团队管理',
  onLoad(){ this.loadData(); },
  onShow(){ this.loadData(); },
  // 从 teamStore 加载数据
  loadData(){
    this.setData({
      members: teamStore.members,
      approvals: teamStore.getPendingApprovals(),
      approvedCases: teamStore.getApprovedCases(),
      totalReports: teamStore.totalReports(),
      avgAccuracy: teamStore.avgAccuracy(),
      avgDuration: teamStore.avgDuration()
    });
  },
  // 通过审批（阻止冒泡）
  onApprove(id, e){
    if(e) e.stopPropagation();
    teamStore.approve(id);
    this.loadData();
    UI.toast('已通过', 'success');
  },
  // 驳回审批（阻止冒泡）
  onReject(id, e){
    if(e) e.stopPropagation();
    teamStore.reject(id);
    this.loadData();
    UI.toast('已驳回', 'none');
  },
  render(d){
    return `<div>
      <div class="tm-stats-card">
        <div class="tm-stat">
          <div class="tm-stat-num">${d.totalReports}</div>
          <div class="tm-stat-label">总报告数</div>
        </div>
        <div class="tm-divider"></div>
        <div class="tm-stat">
          <div class="tm-stat-num">${d.avgAccuracy}%</div>
          <div class="tm-stat-label">平均准确率</div>
        </div>
        <div class="tm-divider"></div>
        <div class="tm-stat">
          <div class="tm-stat-num">${d.avgDuration}min</div>
          <div class="tm-stat-label">平均耗时</div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">团队成员（${d.members.length}）</div>
        ${d.members.map(m=>`
          <div class="tm-member">
            <div class="tm-avatar">${m.name.charAt(0)}</div>
            <div class="tm-mid">
              <div class="tm-mid-top">
                <span class="tm-mid-name">${m.name}</span>
                <span class="tm-mid-role">${m.role}</span>
              </div>
              <div class="tm-mid-stats">
                <span>报告 ${m.reportCount}</span>
                <span>准确率 ${m.accuracy}%</span>
                <span>耗时 ${m.avgDuration}min</span>
              </div>
            </div>
          </div>`).join('')}
      </div>
      <div class="section">
        <div class="section-title">待审批案例（${d.approvals.length}）</div>
        ${d.approvals.length ? d.approvals.map(c=>`
          <div class="tm-approval">
            <div class="tm-ap-title">${c.title}</div>
            <div class="tm-ap-meta"><span>${c.author}</span><span>·</span><span>${c.date}</span></div>
            <div class="tm-ap-desc">${c.description}</div>
            <div class="tm-ap-btns">
              <div class="tm-btn tm-btn-approve" data-approve="${c.id}">通过</div>
              <div class="tm-btn tm-btn-reject" data-reject="${c.id}">驳回</div>
            </div>
          </div>`).join('') : '<div class="empty-tip">暂无待审批案例</div>'}
      </div>
      <div class="section">
        <div class="section-title">已通过案例（${d.approvedCases.length}）</div>
        ${d.approvedCases.length ? d.approvedCases.map(c=>`
          <div class="tm-approved">
            <div class="tm-ap-title">${c.title}</div>
            <div class="tm-ap-meta"><span>${c.author}</span><span>·</span><span>${c.date}</span></div>
            <div class="tm-ap-desc">${c.description}</div>
            <div class="tm-ap-status">已通过</div>
          </div>`).join('') : '<div class="empty-tip">暂无已通过案例</div>'}
      </div>
    </div>`;
  },
  bindEvents(view, inst){
    view.querySelectorAll('[data-approve]').forEach(el=>{
      el.onclick = (e)=>inst.onApprove(el.dataset.approve, e);
    });
    view.querySelectorAll('[data-reject]').forEach(el=>{
      el.onclick = (e)=>inst.onReject(el.dataset.reject, e);
    });
  }
};

/* ===== 5. guide 新手引导页 ===== */
PagesKnow.guide = {
  data:{
    steps:[
      { title:'下载知识包', desc:'选择对应设备型号，下载离线知识包', icon:'package' },
      { title:'拍照示例', desc:'拍摄设备故障，AI 自动识别型号', icon:'camera' },
      { title:'完成模拟诊断', desc:'跟随 AI 引导完成一次完整诊断', icon:'diagnosis' }
    ],
    currentIndex:0,
    currentStep:null
  },
  navTitle:'新手引导',
  onLoad(){
    // 初始化 currentStep 为第一步
    this.setData({ currentIndex:0, currentStep:this.data.steps[0] });
  },
  // 下一步：currentIndex+1（不越界）并更新 currentStep
  onNext(){
    const idx = Math.min(this.data.currentIndex+1, this.data.steps.length-1);
    this.setData({ currentIndex:idx, currentStep:this.data.steps[idx] });
  },
  // 跳过
  onSkip(){ this.switchTab('home'); },
  // 开始使用
  onStart(){ this.switchTab('home'); },
  render(d){
    const step = d.currentStep || d.steps[d.currentIndex];
    const isLast = d.currentIndex === d.steps.length-1;
    // icon 字符串映射为 emoji
    const iconMap = { package:'📦', camera:'📷', diagnosis:'🔬' };
    const icon = iconMap[step.icon] || '💡';
    return `<div class="gd-wrap">
      <div class="gd-progress">
        ${d.steps.map((s,i)=>{
          let html = '';
          if(i>0) html += `<div class="gd-line ${i<=d.currentIndex?'active':''}"></div>`;
          html += `<div class="gd-dot ${i<=d.currentIndex?'active':''}"></div>`;
          return html;
        }).join('')}
      </div>
      <div class="gd-content">
        <div class="gd-icon-circle">${icon}</div>
        <div class="gd-title">${step.title}</div>
        <div class="gd-desc">${step.desc}</div>
        <div class="gd-step-num">第 ${d.currentIndex+1} / ${d.steps.length} 步</div>
      </div>
      <div class="gd-footer">
        ${isLast
          ? `<div class="gd-btn-start" data-act="start">开始使用</div>`
          : `<div class="gd-btn-skip" data-act="skip">跳过</div><div class="gd-btn-next" data-act="next">下一步</div>`}
      </div>
    </div>`;
  },
  bindEvents(view, inst){
    view.querySelectorAll('[data-act]').forEach(el=>{
      el.onclick = ()=>{
        const a = el.dataset.act;
        if(a==='next') inst.onNext();
        else if(a==='skip') inst.onSkip();
        else if(a==='start') inst.onStart();
      };
    });
  }
};
