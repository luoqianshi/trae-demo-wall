// pages-diag.js —— 诊断流程 6 个页面（拍照诊断/识别结果/诊断对话/诊断结论/报告预览/我的报告）

// ===== 注入页面特有样式 =====
(function(){
  const style = document.createElement('style');
  style.textContent = `
  /* ===== photo 拍照诊断 ===== */
  .photo-page{display:flex;flex-direction:column;height:calc(100vh - 170px);max-height:622px}
  .photo-hint{display:flex;align-items:center;gap:8px;background:rgba(59,130,246,.12);border:1px solid rgba(59,130,246,.3);border-radius:8px;padding:10px 14px;margin-bottom:16px}
  .ph-icon{font-size:18px}
  .ph-text{font-size:13px;color:var(--blue);font-weight:600}
  .viewfinder{flex:1;position:relative;background:#000;border-radius:8px;overflow:hidden;display:flex;align-items:center;justify-content:center;margin-bottom:16px;min-height:280px;border:1px dashed var(--rule)}
  .vf-corner{position:absolute;width:28px;height:28px;border:3px solid var(--blue)}
  .vf-tl{top:14px;left:14px;border-right:none;border-bottom:none;border-top-left-radius:4px}
  .vf-tr{top:14px;right:14px;border-left:none;border-bottom:none;border-top-right-radius:4px}
  .vf-bl{bottom:14px;left:14px;border-right:none;border-top:none;border-bottom-left-radius:4px}
  .vf-br{bottom:14px;right:14px;border-left:none;border-top:none;border-bottom-right-radius:4px}
  .vf-placeholder{text-align:center}
  .vf-emoji{font-size:56px;margin-bottom:10px;opacity:.7}
  .vf-label{font-size:15px;color:var(--muted);margin-bottom:6px}
  .vf-tip{font-size:12px;color:var(--weak)}
  .photo-actions{display:flex;align-items:center;justify-content:space-around;padding:8px 0}
  .album-link,.manual-link{font-size:13px;color:var(--blue);cursor:pointer;padding:8px 12px}
  .album-link:active,.manual-link:active{opacity:.7}
  .shutter-btn{width:68px;height:68px;border-radius:50%;background:#fff;border:4px solid rgba(255,255,255,.3);cursor:pointer;box-shadow:0 0 0 3px var(--bg),0 4px 12px rgba(59,130,246,.3);transition:transform .15s}
  .shutter-btn:active{transform:scale(.92)}
  .shutter-btn.capturing{opacity:.6;transform:scale(.92)}

  /* ===== recognition 识别结果 ===== */
  .recog-summary{position:relative;border-left:3px solid var(--blue);padding-left:14px;margin-bottom:16px}
  .rs-row{display:flex;justify-content:space-between;align-items:center;padding:4px 0}
  .rs-label{font-size:12px;color:var(--muted)}
  .rs-value{font-size:14px;color:var(--ink);font-weight:600;display:flex;align-items:center}
  .cand-card{position:relative;background:var(--bg3);border:2px solid var(--rule);border-radius:10px;padding:14px;margin-bottom:10px;cursor:pointer;transition:border-color .2s}
  .cand-card.selected{border-color:var(--blue);background:rgba(59,130,246,.05)}
  .cand-card:active{opacity:.88}
  .cand-check{position:absolute;top:10px;right:12px;width:22px;height:22px;border-radius:50%;background:var(--blue);color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700}
  .cand-card:not(.selected) .cand-check{display:none}
  .cand-top{display:flex;align-items:center;gap:8px;margin-bottom:6px}
  .cand-code{font-size:13px;color:var(--blue);font-weight:600;background:rgba(59,130,246,.12);padding:2px 8px;border-radius:4px}
  .conf-tag{font-size:11px;font-weight:600;padding:2px 8px;border-radius:4px;margin-left:auto}
  .conf-high{background:rgba(59,130,246,.15);color:var(--blue)}
  .conf-medium{background:rgba(245,158,11,.15);color:var(--warn)}
  .conf-low{background:rgba(90,107,130,.2);color:var(--muted)}
  .cand-name{font-size:15px;font-weight:600;color:var(--ink);margin-bottom:4px}
  .cand-desc{font-size:12px;color:var(--muted);margin-bottom:6px}
  .cand-model{font-size:11px;color:var(--weak)}
  .recog-tip{font-size:11px;color:var(--weak);text-align:center;padding:8px 0 12px}
  .recog-actions{display:flex;gap:10px}

  /* ===== diagnosis 诊断对话 ===== */
  .diag-root{display:flex;flex-direction:column;height:calc(100vh - 170px);max-height:622px}
  .diag-progress{flex-shrink:0;margin-bottom:12px}
  .dp-text{font-size:12px;color:var(--muted);margin-bottom:6px}
  .dp-bar{height:6px;background:var(--bg3);border-radius:3px;overflow:hidden}
  .dp-fill{height:100%;background:var(--blue);border-radius:3px;transition:width .4s}
  .dp-excluded{font-size:11px;color:var(--green);margin-top:6px}
  .diag-messages{flex:1;overflow-y:auto;margin-bottom:12px;padding-right:4px;-webkit-overflow-scrolling:touch}
  .diag-messages::-webkit-scrollbar{width:0}
  .msg{display:flex;margin-bottom:12px;align-items:flex-start}
  .msg-ai{flex-direction:row}
  .msg-user{flex-direction:row-reverse}
  .msg-avatar{width:32px;height:32px;border-radius:50%;background:var(--blue);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;flex-shrink:0;margin-right:8px}
  .msg-bubble{max-width:78%;padding:10px 12px;border-radius:12px;font-size:13px;line-height:1.5;white-space:pre-wrap;word-break:break-word}
  .ai-bubble{background:var(--bg3);border:1px solid var(--blue);border-top-left-radius:2px}
  .user-bubble{background:var(--blue);color:#fff;border-top-right-radius:2px}
  .msg-title{font-weight:600;color:var(--blue);margin-bottom:4px;font-size:12px}
  .user-bubble .msg-title{color:rgba(255,255,255,.9)}
  .thinking-dots{display:flex;gap:4px;align-items:center;padding:2px 0}
  .thinking-dots .dot{width:6px;height:6px;border-radius:50%;background:var(--muted);animation:dotBounce 1.2s infinite}
  .thinking-dots .dot:nth-child(2){animation-delay:.2s}
  .thinking-dots .dot:nth-child(3){animation-delay:.4s}
  @keyframes dotBounce{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-5px);opacity:1}}
  .diag-input{flex-shrink:0}
  .di-prompt{font-size:13px;color:var(--muted);margin-bottom:8px;font-weight:600}
  .opt-card{background:var(--bg3);border:1px solid var(--rule);border-radius:8px;padding:12px;margin-bottom:8px;cursor:pointer;font-size:13px;color:var(--ink);transition:border-color .2s}
  .opt-card:active{border-color:var(--blue);background:rgba(59,130,246,.05)}
  .sup-actions{display:flex;gap:8px}
  .skip-link{text-align:center;font-size:12px;color:var(--weak);padding:10px 0;cursor:pointer;margin-top:8px}
  .skip-link:active{color:var(--muted)}

  /* ===== conclusion 诊断结论 ===== */
  .concl-success{text-align:center;padding:20px 0 16px}
  .cs-circle{width:64px;height:64px;border-radius:50%;background:rgba(34,197,94,.15);color:var(--green);display:flex;align-items:center;justify-content:center;font-size:32px;margin:0 auto 12px;border:2px solid var(--green)}
  .cs-text{font-size:18px;font-weight:600;color:var(--ink)}
  .concl-card{position:relative;border-left:3px solid var(--blue);padding-left:14px;margin-bottom:12px}
  .cc-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
  .cc-label{font-size:14px;font-weight:600;color:var(--ink)}
  .cc-cause{font-size:13px;color:var(--ink);line-height:1.6}
  .repair-list{margin-top:4px}
  .repair-item{font-size:13px;color:var(--ink);line-height:1.8;padding:3px 0}
  .concl-cols{display:flex;gap:10px;margin-top:12px}
  .concl-col{flex:1;padding:12px}
  .concl-safety{border-left:3px solid var(--warn)}
  .cc-title{font-size:13px;font-weight:600;color:var(--ink);margin-bottom:6px}
  .concl-safety .cc-title{color:var(--warn)}
  .cc-list{font-size:12px;color:var(--muted);line-height:1.6;white-space:pre-wrap}
  .cc-li{padding:2px 0}
  .concl-footer{display:flex;justify-content:center;align-items:center;gap:12px;padding:16px 0}
  .cf-btn{font-size:13px;color:var(--blue);cursor:pointer}
  .cf-div{color:var(--weak)}

  /* ===== reportPreview 报告预览 ===== */
  .rp-header{margin-bottom:14px}
  .rp-title{font-size:18px;font-weight:700;color:var(--ink)}
  .rp-sub{font-size:11px;color:var(--weak);margin-top:4px}
  .rp-field{position:relative;border-left:3px solid var(--blue);padding-left:14px;margin-bottom:10px;cursor:pointer}
  .rp-field:active{opacity:.85}
  .rf-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
  .rf-label{font-size:13px;font-weight:600;color:var(--ink)}
  .rf-edit{font-size:12px;color:var(--blue)}
  .rf-value{font-size:13px;color:var(--muted);line-height:1.6}
  .rf-value.multiline{white-space:pre-wrap;word-break:break-word}
  .rf-ph{color:var(--weak)}
  .rp-attach{font-size:11px;color:var(--weak);text-align:center;padding:8px 0 12px}
  .rp-actions{display:flex;gap:10px}

  /* ===== myReports 我的报告 ===== */
  .mr-count{font-size:13px;color:var(--muted);margin-bottom:12px}
  .mr-item{position:relative;border-left:3px solid var(--blue);padding-left:14px;margin-bottom:10px;cursor:pointer}
  .mr-item:active{background:#1E2F45}
  .mr-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
  .mr-title{font-size:14px;font-weight:600;color:var(--ink);flex:1;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;margin-right:8px}
  .mr-device{font-size:12px;color:var(--muted);margin-bottom:4px}
  .mr-date{font-size:11px;color:var(--weak);margin-bottom:8px}
  .mr-actions{display:flex;align-items:center;gap:8px;border-top:1px solid var(--rule);padding-top:8px}
  .mr-act{font-size:12px;color:var(--blue);cursor:pointer;padding:2px 4px}
  .mr-act:active{opacity:.7}
  .mr-div{color:var(--weak);font-size:11px}
  `;
  document.head.appendChild(style);
})();

const PagesDiag = {};

/* ===== 1. photo 拍照诊断 ===== */
PagesDiag.photo = {
  data: { capturing: false },
  navTitle: '拍照诊断',
  // 点击拍摄按钮：模拟识别流程
  onCapture(){
    if(this.data.capturing) return;
    this.setData({ capturing: true });
    UI.toast('正在识别故障码和指示灯状态...', 'none', 800);
    UI.vibrateShort();
    this._timer = setTimeout(()=>{
      this.setData({ capturing: false });
      this.navigateTo('recognition');
    }, 800);
  },
  // 从相册选择：同拍摄流程
  onAlbum(){ this.onCapture(); },
  // 手动选择设备型号：直接进入诊断
  onManualSelect(){
    diagnosisEngine.startSession(diagnosisEngine.recognitionCandidates[0]);
    this.navigateTo('diagnosis');
  },
  onUnload(){
    if(this._timer) clearTimeout(this._timer);
  },
  render(d){
    return `<div class="photo-page">
      <div class="photo-hint">
        <span class="ph-icon">📸</span>
        <span class="ph-text">将设备故障区域对准取景框</span>
      </div>
      <div class="viewfinder">
        <div class="vf-corner vf-tl"></div>
        <div class="vf-corner vf-tr"></div>
        <div class="vf-corner vf-bl"></div>
        <div class="vf-corner vf-br"></div>
        <div class="vf-placeholder">
          <div class="vf-emoji">📷</div>
          <div class="vf-label">摄像头预览区</div>
          <div class="vf-tip">点击拍摄模拟识别</div>
        </div>
      </div>
      <div class="photo-actions">
        <div class="album-link" data-act="album">从相册选择</div>
        <div class="shutter-btn ${d.capturing?'capturing':''}" data-act="capture"></div>
        <div class="manual-link" data-act="manual">手动选择设备型号</div>
      </div>
    </div>`;
  },
  bindEvents(view, inst){
    view.querySelectorAll('[data-act]').forEach(el=>{
      el.onclick = ()=>{
        const a = el.dataset.act;
        if(a==='capture') inst.onCapture();
        else if(a==='album') inst.onAlbum();
        else if(a==='manual') inst.onManualSelect();
      };
    });
  }
};

/* ===== 2. recognition 识别结果 ===== */
PagesDiag.recognition = {
  data: { candidates: [], selectedIndex: 0 },
  navTitle: '识别结果',
  onLoad(){
    // 候选项按置信度降序，预计算置信度等级
    const sorted = [...diagnosisEngine.recognitionCandidates]
      .sort((a,b)=>b.confidence-a.confidence)
      .map(c=>{
        let lvCls, lvLabel;
        if(c.confidence>=90){ lvCls='high'; lvLabel='高置信度'; }
        else if(c.confidence>=60){ lvCls='medium'; lvLabel='中置信度'; }
        else { lvCls='low'; lvLabel='低置信度'; }
        return { ...c, lvCls, lvLabel };
      });
    this.setData({ candidates: sorted, selectedIndex: 0 });
  },
  // 切换选中候选项
  onSelectCandidate(index){
    if(index === this.data.selectedIndex) return;
    this.setData({ selectedIndex: index });
  },
  // 开始诊断：用选中候选项启动会话
  onStartDiagnosis(){
    const sel = this.data.candidates[this.data.selectedIndex];
    if(!sel){ UI.toast('请选择匹配项'); return; }
    diagnosisEngine.startSession(sel);
    this.navigateTo('diagnosis');
  },
  // 重新拍摄：返回上一页
  onRetake(){ this.navigateBack(); },
  // 手动选择：用第一候选直接进入诊断
  onManualSelect(){
    const first = this.data.candidates[0];
    if(!first){ UI.toast('无可用候选'); return; }
    diagnosisEngine.startSession(first);
    this.navigateTo('diagnosis');
  },
  render(d){
    const top = d.candidates[0] || {};
    const list = d.candidates.map((c,i)=>{
      const selected = i===d.selectedIndex;
      return `<div class="cand-card ${selected?'selected':''}" data-idx="${i}">
        <div class="cand-check">✓</div>
        <div class="cand-top">
          <span class="cand-code">${c.code}</span>
          <span class="conf-tag conf-${c.lvCls}">${c.confidence}% · ${c.lvLabel}</span>
        </div>
        <div class="cand-name">${c.name}</div>
        <div class="cand-desc">${c.description}</div>
        <div class="cand-model">设备型号：${c.deviceModel}</div>
      </div>`;
    }).join('');
    return `<div>
      <div class="card recog-summary">
        <div class="rs-row"><span class="rs-label">已识别故障码</span><span class="rs-value">${top.code||'-'}</span></div>
        <div class="rs-row"><span class="rs-label">设备型号</span><span class="rs-value">${top.deviceModel||'-'}<span class="tag tag-info" style="margin-left:6px">自动匹配</span></span></div>
      </div>
      <div class="section-title">匹配结果（按置信度降序）</div>
      ${list}
      <div class="recog-tip">提示：置信度越高，匹配越精准。可点击切换选择。</div>
      <div class="recog-actions">
        <div class="btn btn-secondary" data-act="retake" style="flex:1">重新拍摄</div>
        <div class="btn btn-secondary" data-act="manual" style="flex:1">手动选择</div>
      </div>
      <div class="btn btn-primary btn-block" data-act="start" style="margin-top:12px">开始诊断 →</div>
    </div>`;
  },
  bindEvents(view, inst){
    view.querySelectorAll('[data-idx]').forEach(el=>{
      el.onclick = ()=>inst.onSelectCandidate(parseInt(el.dataset.idx));
    });
    view.querySelectorAll('[data-act]').forEach(el=>{
      el.onclick = ()=>{
        const a = el.dataset.act;
        if(a==='retake') inst.onRetake();
        else if(a==='manual') inst.onManualSelect();
        else if(a==='start') inst.onStartDiagnosis();
      };
    });
  }
};

/* ===== 3. diagnosis 诊断对话（核心复杂页） ===== */
PagesDiag.diagnosis = {
  data: {
    messages: [],          // 消息列表 {id,type:'ai'/'user',title,content}
    thinking: false,        // AI 思考中
    recording: false,      // 语音录入中
    showOptions: false,    // 是否显示选项
    currentOptions: [],    // 当前选项列表
    phase: 'diagnosing',   // diagnosing | supplementing
    progressWidth: 0,      // 进度条宽度
    excludedCount: 0,      // 已完成步骤数
    totalSteps: 0,         // 总步骤数
    excludedText: ''      // 已排除项文本
  },
  navTitle: '诊断',
  onLoad(){
    this._timers = [];
    this._msgCounter = 0;
    // 校验会话
    const session = diagnosisEngine.getSession();
    if(!session){
      UI.toast('诊断会话不存在');
      this._timers.push(setTimeout(()=>this.navigateBack(), 1500));
      return;
    }
    const total = diagnosisEngine.getTotalSteps();
    this.setData({ totalSteps: total });
    this.updateProgress();
    this.showCurrentStep();
  },
  onUnload(){
    if(this._timers){ this._timers.forEach(t=>clearTimeout(t)); this._timers = []; }
  },
  // 推入一条消息
  _pushMessage(type, title, content){
    this._msgCounter = (this._msgCounter||0) + 1;
    const messages = [...this.data.messages, { id:'msg_'+this._msgCounter, type, title, content }];
    this.setData({ messages });
  },
  // 滚动对话区到底部
  _scrollToBottom(){
    const view = document.getElementById('pageView');
    if(!view) return;
    const box = view.querySelector('.diag-messages');
    if(box) box.scrollTop = box.scrollHeight;
  },
  // 显示当前步骤
  showCurrentStep(){
    if(diagnosisEngine.isComplete()){
      this.enterSupplementPhase();
      return;
    }
    const step = diagnosisEngine.getCurrentStep();
    if(!step) return;
    this._pushMessage('ai', step.title, step.question);
    this.setData({ showOptions: true, currentOptions: step.options });
    this._timers.push(setTimeout(()=>this._scrollToBottom(), 150));
  },
  // 提交答案
  submitAnswer(answer, skipped){
    // 推入用户消息
    this._pushMessage('user', '', skipped?'已跳过':answer);
    this.setData({ thinking: true, showOptions: false });
    // 提交给引擎
    diagnosisEngine.submitAnswer(answer, skipped);
    this.updateProgress();
    // 延迟后显示下一步
    this._timers.push(setTimeout(()=>{
      this.setData({ thinking: false });
      this.showCurrentStep();
    }, 1200));
  },
  // 更新进度
  updateProgress(){
    const session = diagnosisEngine.getSession();
    if(!session) return;
    const completed = session.answeredSteps.length;
    const total = this.data.totalSteps || 1;
    const progressWidth = Math.round(completed / total * 100);
    const excludedText = session.excludedCauses.length
      ? session.excludedCauses.join(' ✓ · ') + ' ✓'
      : '';
    this.setData({ excludedCount: completed, progressWidth, excludedText });
  },
  // 进入补充阶段
  enterSupplementPhase(){
    this._pushMessage('ai', '状态补充', '请补充现场情况，帮助完善诊断结论');
    this.setData({ phase: 'supplementing', showOptions: false });
    this._timers.push(setTimeout(()=>this._scrollToBottom(), 150));
  },
  // 点击选项
  onOptionTap(option){
    this.submitAnswer(option, false);
  },
  // 语音输入
  onVoiceInput(){
    UI.toast('语音识别完成', 'success');
    this._timers.push(setTimeout(()=>this._showSupplementInput(), 800));
  },
  // 显示语音识别结果供确认
  _showSupplementInput(){
    UI.showModal({
      title: '语音识别结果',
      editable: true,
      content: '现场设备运行声音正常，无异味，通信指示灯红灯常亮',
      cancelText: '重新说',
      confirmText: '确认提交'
    }).then(text=>{
      if(text) this.submitSupplement(text);
    });
  },
  // 文字输入
  onTextInput(){
    UI.showModal({
      title: '文字输入',
      editable: true,
      content: '',
      cancelText: '取消',
      confirmText: '提交'
    }).then(text=>{
      if(text) this.submitSupplement(text);
    });
  },
  // 提交补充内容
  submitSupplement(content){
    this._pushMessage('user', '', content);
    const session = diagnosisEngine.getSession();
    if(session) session.supplement = content;
    this._timers.push(setTimeout(()=>{
      if(session) session.endTime = Date.now();
      this.redirectTo('conclusion');
    }, 1500));
  },
  // 跳过
  onSkip(){
    if(this.data.phase === 'supplementing'){
      // 补充阶段跳过：直接进入结论
      const session = diagnosisEngine.getSession();
      this._timers.push(setTimeout(()=>{
        if(session) session.endTime = Date.now();
        this.redirectTo('conclusion');
      }, 500));
    } else {
      // 诊断阶段跳过：提交跳过答案
      this.submitAnswer('跳过', true);
    }
  },
  render(d){
    // 消息列表渲染
    const msgList = d.messages.map(m=>{
      if(m.type === 'ai'){
        return `<div class="msg msg-ai">
          <div class="msg-avatar">AI</div>
          <div class="msg-bubble ai-bubble">
            ${m.title ? `<div class="msg-title">${m.title}</div>` : ''}
            <div>${m.content}</div>
          </div>
        </div>`;
      } else {
        return `<div class="msg msg-user">
          <div class="msg-bubble user-bubble">${m.content}</div>
        </div>`;
      }
    }).join('');
    // AI 思考中动画
    const thinkingHtml = d.thinking ? `
      <div class="msg msg-ai">
        <div class="msg-avatar">AI</div>
        <div class="msg-bubble ai-bubble">
          <div class="thinking-dots"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>
        </div>
      </div>` : '';

    // 底部交互区
    let inputHtml = '';
    if(d.phase === 'diagnosing' && d.showOptions){
      // 诊断阶段：显示选项
      inputHtml = `<div class="diag-input">
        <div class="di-prompt">请选择故障现象</div>
        ${d.currentOptions.map((o,i)=>`<div class="opt-card" data-opt-idx="${i}">${o}</div>`).join('')}
        <div class="skip-link" data-act="skip">跳过此步</div>
      </div>`;
    } else if(d.phase === 'supplementing'){
      // 补充阶段：三按钮
      inputHtml = `<div class="diag-input">
        <div class="di-prompt">状态补充：请补充现场情况</div>
        <div class="sup-actions">
          <div class="btn btn-primary" data-act="voice" style="flex:1">🎤 语音输入</div>
          <div class="btn btn-secondary" data-act="text" style="flex:1">⌨️ 文字输入</div>
          <div class="btn btn-secondary" data-act="skip" style="flex:1">跳过</div>
        </div>
      </div>`;
    }
    return `<div class="diag-root">
      <div class="diag-progress">
        <div class="dp-text">排查进度：已排除 ${d.excludedCount}/${d.totalSteps}</div>
        <div class="dp-bar"><div class="dp-fill" style="width:${d.progressWidth}%"></div></div>
        ${d.excludedText ? `<div class="dp-excluded">已排除：${d.excludedText}</div>` : ''}
      </div>
      <div class="diag-messages">${msgList}${thinkingHtml}</div>
      ${inputHtml}
    </div>`;
  },
  bindEvents(view, inst){
    // 滚动到底部
    const box = view.querySelector('.diag-messages');
    if(box){
      setTimeout(()=>{ box.scrollTop = box.scrollHeight; }, 150);
    }
    // 选项点击
    view.querySelectorAll('[data-opt-idx]').forEach(el=>{
      el.onclick = ()=>{
        const idx = parseInt(el.dataset.optIdx);
        const opt = inst.data.currentOptions[idx];
        if(opt) inst.onOptionTap(opt);
      };
    });
    // 动作按钮
    view.querySelectorAll('[data-act]').forEach(el=>{
      el.onclick = ()=>{
        const a = el.dataset.act;
        if(a==='skip') inst.onSkip();
        else if(a==='voice') inst.onVoiceInput();
        else if(a==='text') inst.onTextInput();
      };
    });
  }
};

/* ===== 4. conclusion 诊断结论 ===== */
PagesDiag.conclusion = {
  data: { conclusion: null, confClass: '', repairSteps: [] },
  navTitle: '诊断结论',
  onLoad(){
    const session = diagnosisEngine.getSession();
    if(session) session.endTime = Date.now();
    const conclusion = diagnosisEngine.generateConclusion();
    // 置信度映射样式
    let confClass = 'tag-danger';
    if(conclusion.confidenceLevel.includes('高')) confClass = 'tag-success';
    else if(conclusion.confidenceLevel.includes('中')) confClass = 'tag-warning';
    // 维修步骤加序号
    const repairSteps = conclusion.repairSteps.map((s,i)=>`${i+1}. ${s}`);
    this.setData({ conclusion, confClass, repairSteps });
  },
  // 生成工单报告
  onGenerateReport(){ this.navigateTo('reportPreview'); },
  // 重新诊断
  onRestartDiagnosis(){
    diagnosisEngine.clearSession();
    this.switchTab('home');
  },
  // 分享诊断结果
  async onShareResult(){
    const c = this.data.conclusion;
    if(!c) return;
    const text = `【诊断结论】\n根因：${c.rootCause}\n置信度：${c.confidenceLevel}\n\n维修措施：\n${this.data.repairSteps.join('\n')}\n\n所需工具：${c.tools.join('、')}\n安全须知：${c.safetyNotes}`;
    try{
      await navigator.clipboard.writeText(text);
      UI.toast('已复制到剪贴板', 'success');
    }catch(e){
      UI.toast('复制失败');
    }
  },
  render(d){
    const c = d.conclusion;
    if(!c) return '<div class="empty-tip">暂无诊断结论</div>';
    return `<div>
      <div class="concl-success">
        <div class="cs-circle">✓</div>
        <div class="cs-text">诊断完成</div>
      </div>
      <div class="card concl-card">
        <div class="cc-head">
          <span class="cc-label">根因结论</span>
          <span class="tag ${d.confClass}">${c.confidenceLevel}</span>
        </div>
        <div class="cc-cause">${c.rootCause}</div>
      </div>
      <div class="card" style="margin-top:12px">
        <div class="section-title">维修措施</div>
        <div class="repair-list">
          ${d.repairSteps.map(s=>`<div class="repair-item">${s}</div>`).join('')}
        </div>
      </div>
      <div class="concl-cols">
        <div class="card concl-col">
          <div class="cc-title">所需工具</div>
          <div class="cc-list">${c.tools.map(t=>`<div class="cc-li">• ${t}</div>`).join('')}</div>
        </div>
        <div class="card concl-col concl-safety">
          <div class="cc-title">安全须知</div>
          <div class="cc-list">${c.safetyNotes}</div>
        </div>
      </div>
      <div class="btn btn-primary btn-block" data-act="report" style="margin-top:16px">生成工单报告</div>
      <div class="concl-footer">
        <div class="cf-btn" data-act="restart">重新诊断</div>
        <div class="cf-div">|</div>
        <div class="cf-btn" data-act="share">分享诊断结果</div>
      </div>
    </div>`;
  },
  bindEvents(view, inst){
    view.querySelectorAll('[data-act]').forEach(el=>{
      el.onclick = ()=>{
        const a = el.dataset.act;
        if(a==='report') inst.onGenerateReport();
        else if(a==='restart') inst.onRestartDiagnosis();
        else if(a==='share') inst.onShareResult();
      };
    });
  }
};

/* ===== 5. reportPreview 报告预览/编辑 ===== */
PagesDiag.reportPreview = {
  data: { fields: [], isNew: true, reportId: '' },
  navTitle: '运维工单报告',
  onLoad(options){
    if(options && options.id){
      this.loadExistingReport(options.id);
    } else {
      this.generateNewReport();
    }
  },
  // 加载已有报告
  loadExistingReport(id){
    const report = reportStore.getReportById(id);
    if(!report){
      UI.toast('报告不存在');
      setTimeout(()=>this.navigateBack(), 1500);
      return;
    }
    this._origReport = report;
    const fields = this.buildFields(report);
    this.setData({ fields, isNew: false, reportId: id });
  },
  // 生成新报告
  generateNewReport(){
    const session = diagnosisEngine.getSession();
    if(!session){
      // 无会话则用空值
      const empty = { deviceInfo:'', symptom:'', process:'', rootCause:'', duration:'' };
      this._origReport = { ...empty, id: reportStore.newReportId(), createTime: Date.now() };
      this.setData({ fields: this.buildFields(this._origReport), isNew: true, reportId: this._origReport.id });
      return;
    }
    const conclusion = diagnosisEngine.generateConclusion();
    const modelLast6 = (session.deviceModel||'').slice(-6);
    const sessLast4 = (session.sessionId||'').slice(-4);
    const deviceInfo = `${session.deviceModel} · ${session.deviceSite} · ID:${modelLast6}${sessLast4}`;
    const rootCauseFirst = (conclusion.rootCause||'').split('。')[0] || conclusion.rootCause;
    const symptom = `${session.faultName}（${session.faultCode}）：${rootCauseFirst}`;
    const process = diagnosisEngine.generateProcessText();
    const repairList = conclusion.repairSteps.map((s,i)=>`${i+1}. ${s}`).join('\n');
    const rootCause = `${conclusion.rootCause}\n\n维修措施：\n${repairList}`;
    const duration = diagnosisEngine.getDuration();
    const report = {
      id: reportStore.newReportId(),
      deviceInfo, symptom, process, rootCause, duration,
      createTime: Date.now()
    };
    this._origReport = report;
    const fields = this.buildFields(report);
    this.setData({ fields, isNew: true, reportId: report.id });
  },
  // 构造字段列表
  buildFields(report){
    return [
      { key:'deviceInfo', label:'设备信息', value:report.deviceInfo||'', placeholder:'请输入设备信息', multiline:false },
      { key:'symptom', label:'故障现象', value:report.symptom||'', placeholder:'请输入故障现象', multiline:true },
      { key:'process', label:'诊断过程', value:report.process||'', placeholder:'请输入诊断过程', multiline:true },
      { key:'rootCause', label:'根因与维修措施', value:report.rootCause||'', placeholder:'请输入根因与维修措施', multiline:true },
      { key:'duration', label:'耗时', value:report.duration||'', placeholder:'请输入耗时', multiline:false }
    ];
  },
  // 编辑字段
  async onEditField(index){
    const field = this.data.fields[index];
    const text = await UI.showModal({
      title: '编辑'+field.label,
      editable: true,
      content: field.value,
      cancelText: '取消',
      confirmText: '保存'
    });
    if(text && text !== false){
      const fields = [...this.data.fields];
      fields[index] = { ...field, value: text };
      this.setData({ fields });
    }
  },
  // 导出 PDF（复制到剪贴板）
  async onExportPDF(){
    const f = this.data.fields;
    const text = `运维工单报告\n\n设备信息：${f[0].value}\n\n故障现象：\n${f[1].value}\n\n诊断过程：\n${f[2].value}\n\n根因与维修措施：\n${f[3].value}\n\n耗时：${f[4].value}`;
    try{
      await navigator.clipboard.writeText(text);
      UI.toast('报告内容已复制，可粘贴导出', 'success');
    }catch(e){
      UI.toast('复制失败');
    }
  },
  // 确认保存
  onConfirmSave(){
    const f = this.data.fields;
    if(!f[0].value.trim()){ UI.toast('请填写设备信息'); return; }
    if(!f[1].value.trim()){ UI.toast('请填写故障现象'); return; }
    const existing = this.data.isNew ? null : reportStore.getReportById(this.data.reportId);
    const report = {
      id: this.data.reportId,
      deviceInfo: f[0].value,
      symptom: f[1].value,
      process: f[2].value,
      rootCause: f[3].value,
      duration: f[4].value,
      status: '已提交',
      createTime: existing ? existing.createTime : Date.now()
    };
    reportStore.saveReport(report);
    // 新报告则添加记录
    if(this.data.isNew){
      const session = diagnosisEngine.getSession();
      const d = new Date(report.createTime);
      const p = n=>n<10?'0'+n:n;
      const dateStr = (d.getMonth()+1)+'/'+d.getDate()+' '+p(d.getHours())+':'+p(d.getMinutes());
      const faultName = session ? session.faultName : (report.symptom.split('（')[0] || '故障');
      const site = session ? session.deviceSite : '';
      reportStore.addRecord({
        id: report.id,
        date: dateStr,
        device: report.deviceInfo,
        fault: faultName,
        status: '已提交',
        site: site
      });
    }
    diagnosisEngine.clearSession();
    UI.toast('保存成功', 'success');
    setTimeout(()=>this.redirectTo('myReports'), 800);
  },
  render(d){
    return `<div>
      <div class="rp-header">
        <div class="rp-title">${d.isNew ? '生成新报告' : '编辑报告'}</div>
        <div class="rp-sub">报告编号：${d.reportId}</div>
      </div>
      ${d.fields.map((f,i)=>`
        <div class="card rp-field" data-idx="${i}">
          <div class="rf-head">
            <span class="rf-label">${f.label}</span>
            <span class="rf-edit">✎ 编辑</span>
          </div>
          <div class="rf-value ${f.multiline?'multiline':''}">${f.value || '<span class="rf-ph">'+f.placeholder+'</span>'}</div>
        </div>
      `).join('')}
      <div class="rp-attach">照片附件：2 张 / 点击字段可编辑</div>
      <div class="rp-actions">
        <div class="btn btn-secondary" data-act="pdf" style="flex:1">导出PDF</div>
        <div class="btn btn-primary" data-act="save" style="flex:1">确认保存</div>
      </div>
    </div>`;
  },
  bindEvents(view, inst){
    // 点击字段卡片编辑
    view.querySelectorAll('[data-idx]').forEach(el=>{
      el.onclick = ()=>inst.onEditField(parseInt(el.dataset.idx));
    });
    // 动作按钮
    view.querySelectorAll('[data-act]').forEach(el=>{
      el.onclick = ()=>{
        const a = el.dataset.act;
        if(a==='pdf') inst.onExportPDF();
        else if(a==='save') inst.onConfirmSave();
      };
    });
  }
};

/* ===== 6. myReports 我的报告 ===== */
PagesDiag.myReports = {
  data: { reports: [], count: 0 },
  navTitle: '我的报告',
  onShow(){ this.loadReports(); },
  // 加载报告列表
  loadReports(){
    const list = reportStore.getAllReports().map(r=>{
      const title = (r.symptom||'').split('\n')[0] || '未命名报告';
      const dateText = reportStore.formatDate(r.createTime);
      const statusClass = r.status === '已提交' ? 'tag-success' : 'tag-warning';
      return { ...r, title, dateText, statusClass };
    });
    this.setData({ reports: list, count: list.length });
  },
  // 点击报告：预览
  onTapReport(id){ this.navigateTo('reportPreview', { id }); },
  // 导出报告
  async onExportReport(r){
    if(!r) return;
    const text = `运维工单报告\n\n设备：${r.deviceInfo}\n故障：${r.symptom}\n\n诊断过程：\n${r.process}\n\n根因与措施：\n${r.rootCause}\n\n耗时：${r.duration}`;
    try{
      await navigator.clipboard.writeText(text);
      UI.toast('报告已复制到剪贴板', 'success');
    }catch(e){ UI.toast('复制失败'); }
  },
  // 分享报告
  async onShareReport(r){
    if(!r) return;
    const text = `【${r.title}】${r.deviceInfo} · ${r.dateText} · 状态：${r.status}`;
    try{
      await navigator.clipboard.writeText(text);
      UI.toast('已复制分享内容', 'success');
    }catch(e){ UI.toast('复制失败'); }
  },
  render(d){
    return `<div>
      <div class="mr-count">共 ${d.count} 份报告</div>
      ${d.reports.length ? d.reports.map(r=>`
        <div class="card mr-item" data-id="${r.id}">
          <div class="mr-head">
            <span class="mr-title">${r.title}</span>
            <span class="tag ${r.statusClass}">${r.status}</span>
          </div>
          <div class="mr-device">${r.deviceInfo}</div>
          <div class="mr-date">${r.dateText}</div>
          <div class="mr-actions">
            <div class="mr-act" data-act="view" data-id="${r.id}">预览</div>
            <div class="mr-div">|</div>
            <div class="mr-act" data-act="export" data-id="${r.id}">导出</div>
            <div class="mr-div">|</div>
            <div class="mr-act" data-act="share" data-id="${r.id}">分享</div>
          </div>
        </div>
      `).join('') : '<div class="empty-tip">📄<br>暂无报告</div>'}
    </div>`;
  },
  bindEvents(view, inst){
    view.querySelectorAll('[data-id]').forEach(el=>{
      el.onclick = (e)=>{
        const act = el.dataset.act;
        const id = el.dataset.id;
        if(act){
          // 操作按钮：阻止冒泡，不触发卡片点击
          e.stopPropagation();
          const r = inst.data.reports.find(x=>x.id===id);
          if(act==='view') inst.onTapReport(id);
          else if(act==='export') inst.onExportReport(r);
          else if(act==='share') inst.onShareReport(r);
        } else {
          // 卡片点击：预览
          inst.onTapReport(id);
        }
      };
    });
  }
};
