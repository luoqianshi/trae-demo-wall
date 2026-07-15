/* ============================================================
   Drop Snacks · V6B Application Logic
   从内联脚本迁移，集成 Store / CopyEngine / Motion
   ============================================================ */
(function(){
  "use strict";

  /* ---------- 数据层（使用 Store 模块） ---------- */
  var Store = window.DropSnacksStore;
  var CopyBank = window.DropSnacksCopyBank;
  var CopyEngine = window.DropSnacksCopyEngine;
  var Motion = window.DropSnacksMotion;
  var AfterglowEngine = window.DropSnacksAfterglowEngine;
  var EchoBank = window.DropSnacksEchoBank;
  var EchoEngine = window.DropSnacksEchoEngine;

  /* 竞赛模式：使用 CompetitionDemo adapter（sessionStorage 隔离） */
  /* 正常模式：使用 Store adapter（localStorage dropSnacks_v4） */
  var CompetitionDemo = window.DropSnacksCompetitionDemo;
  var isCompetition = !!(CompetitionDemo && CompetitionDemo.isActive());
  var DB;
  if(isCompetition){
    DB = CompetitionDemo.getAdapter();
  } else {
    DB = {
      key: Store.STORAGE_KEY,
      load: function(){ return Store.load(); },
      save: function(data){ return Store.save(data); }
    };
  }

  var state = DB.load();
  var currentFoodId = null;
  var currentChoice = null;
  var currentFeeling = null;
  var lastFocusedChoiceBtn = null;
  var ritualCompleted = false;
  var dragging = false;
  var startX = 0;
  var trackRect = null;

  /* ---------- Afterglow 运行时（Demo Time 仅存内存） ---------- */
  var agRefreshTimer = null;
  var demoAfterglow = null; /* 内存演示视图，不写入 localStorage */

  /* ---------- PACKS（不再包含 complete） ---------- */
  var PACKS = {
    signature:{
      name:'Signature',
      bg:'linear-gradient(160deg,#0f172a,#0c2a3e 40%,#0e3a4f 70%,#0d4a4a)',
      c1:'#14b8a6', c2:'#38bdf8', c3:'#fbbf24', c4:'#5eead4',
      glow:'#14b8a6', fg:'#e0f2f1',
      line:'把今晚留给自己。',
      prompt:'滑动以完成选择',
      fillGrad:'linear-gradient(90deg,#14b8a6,#38bdf8,#5eead4)'
    },
    quiet:{
      name:'Quiet',
      bg:'linear-gradient(160deg,#0f172a,#1e293b 40%,#334155 70%,#475569)',
      c1:'#64748b', c2:'#94a3b8', c3:'#cbd5e1', c4:'#e2e8f0',
      glow:'#94a3b8', fg:'#f1f5f9',
      line:'安静地，把它处理完。',
      prompt:'滑动以完成',
      fillGrad:'linear-gradient(90deg,#475569,#94a3b8,#cbd5e1)'
    },
    evening:{
      name:'Evening',
      bg:'linear-gradient(160deg,#0a0f2e,#0f1a3d 40%,#162456 70%,#1f3a6e)',
      c1:'#2a4d9e', c2:'#3a6dbf', c3:'#5a9ee0', c4:'#8fd4f5',
      glow:'#4a7dc8', fg:'#e8f0ff',
      line:'把夜晚还给自己。',
      prompt:'滑动以完成选择',
      fillGrad:'linear-gradient(90deg,#2a4d9e,#3a6dbf,#5a9ee0)'
    }
  };

  /* ---------- Toast（手机内部） ---------- */
  function toast(msg){
    var t = document.getElementById('toast');
    if(!t) return;
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(function(){ t.classList.remove('show'); }, 2200);
  }

  /* ---------- 视图切换 ---------- */
  function showView(name){
    ['home','process','foods','review','cycle'].forEach(function(v){
      var el = document.getElementById('view-'+v);
      if(el) el.classList.toggle('active', v===name);
    });
    if(name==='home') renderHome();
    if(name==='foods') renderFoodList();
    if(name==='cycle') renderCycleMobile();
    if(name==='process') startProcess();
    var statusEl = document.getElementById('p-status');
    if(statusEl){
      var labels = {home:'就绪',process:'处理中',foods:'食品',review:'查看中',cycle:'回顾中'};
      statusEl.textContent = labels[name] || '就绪';
    }
    var activeTab = (name==='review') ? 'process' : name;
    document.querySelectorAll('.phone-tab').forEach(function(tab){
      tab.setAttribute('aria-selected', tab.dataset.view === activeTab ? 'true' : 'false');
    });
    var phoneBody = document.getElementById('phone-body');
    if(phoneBody) phoneBody.scrollTop = 0;
  }

  /* ---------- Home 渲染 ---------- */
  function renderHome(){
    var h = new Date().getHours();
    var greet = '你好。';
    if(h>=6 && h<12) greet='早上好。';
    else if(h>=12 && h<18) greet='下午好。';
    else if(h>=18) greet='晚上好。';
    else greet='夜深了。';
    document.getElementById('home-greeting').textContent = greet;

    var now = Date.now();
    var thirtyDaysAgo = now - 30*24*60*60*1000;
    var recentChoices = state.choices.filter(function(c){ return c.createdAt >= thirtyDaysAgo; });
    var pscHome = document.getElementById('psc-home-total');
    if(pscHome) pscHome.textContent = recentChoices.length;

    var pending = state.foods.filter(function(f){ return !f.handled; });
    var listEl = document.getElementById('pending-list');
    if(pending.length===0){
      listEl.innerHTML = '<div class="p-empty">没有待处理食品。点击"现在处理一件"或到食品页添加。</div>';
    } else {
      listEl.innerHTML = pending.slice(0,3).map(function(f){
        return '<button type="button" class="p-pending-item" onclick="openReview(\''+f.id+'\')">' +
          '<div><div class="ppi-name">'+escapeAppHtml(f.name)+'</div>' +
          '<div class="ppi-meta">'+f.category+' · '+f.openedState+' · '+escapeAppHtml(f.location||'—')+'</div></div>' +
          '<span class="ppi-arrow">→</span></button>';
      }).join('');
    }

    var recent = document.getElementById('recent-choice');
    if(state.choices.length===0){
      recent.innerHTML = '<div class="p-empty">还没有做过选择。</div>';
    } else {
      var last = state.choices[state.choices.length-1];
      var food = state.foods.find(function(f){ return f.id===last.foodId; });
      var choiceLabels = {eat:'吃掉',drop:'完成处理',save:'保存',share:'分享分装'};
      var feelingLabels = {want:'还想继续',hesitate:'有点犹豫',dont_want:'不太想要','dont-want':'不太想要',dontwant:'不太想要',waste:'不舍得浪费'};
      var time = new Date(last.createdAt);
      var feelingTag = last.feeling ? '<span class="prc-tag" style="background:var(--mint-3)">'+(feelingLabels[last.feeling]||'—')+'</span>' : '';
      recent.innerHTML =
        '<div class="p-recent-card">' +
        '<div class="prc-name">'+(food?escapeAppHtml(food.name):'已删除食品')+'</div>' +
        '<div class="prc-meta">'+choiceLabels[last.choiceType]+' · '+time.toLocaleString('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})+'</div>' +
        '<span class="prc-tag">'+choiceLabels[last.choiceType]+'</span>'+feelingTag+'</div>';
    }

    var pTime = document.getElementById('p-time');
    if(pTime) pTime.textContent = new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'});

    /* Afterglow 区域渲染 */
    renderAfterglow();
    /* Shared Echoes 渲染（Afterglow 之后） */
    renderEchoes();
  }

  /* ---------- Afterglow 渲染 ---------- */
  function afterglowEnabled(){
    return state.userPreferences && state.userPreferences.afterglowEnabled !== undefined
      ? state.userPreferences.afterglowEnabled : true;
  }

  /* 极小通用 HTML 转义，用于 Afterglow / 食品名称 / 位置等动态文本。
     不修改用户实际存储的数据，不写回 Store。 */
  function escapeAppHtml(value){
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function renderAfterglow(){
    var section = document.getElementById('afterglow-section');
    if(!section) return;
    scheduleAfterglowRefresh();

    /* 关闭回访态：紧凑说明 + 重新开启 */
    if(!afterglowEnabled()){
      section.innerHTML =
        '<div class="ag-closed-note">' +
        '<span class="ag-closed-text">余波回访已关闭</span>' +
        '<button type="button" class="ag-inline-link" id="afterglow-enable" onclick="enableAfterglow()">重新开启</button>' +
        '</div>';
      section.style.display = '';
      return;
    }

    /* Demo Time 优先展示 */
    if(demoAfterglow){
      renderAfterglowDemo();
      return;
    }

    var now = Date.now();
    var next = AfterglowEngine ? AfterglowEngine.getNextAfterglow(state, now) : null;

    /* 有 available：展示一个问题 */
    if(next && !next.__pendingHint){
      renderAfterglowAvailable(next);
      return;
    }

    /* 仅有 pending：安静提示 + 演示入口 */
    if(next && next.__pendingHint && next.afterglow){
      renderAfterglowPending(next.afterglow);
      return;
    }

    /* 无待处理：不显示空白卡片 */
    section.style.display = 'none';
    section.innerHTML = '';
  }

  function renderAfterglowAvailable(ag){
    var section = document.getElementById('afterglow-section');
    var promptText = AfterglowEngine ? AfterglowEngine.getPromptText(ag.promptId) : '';
    var foodName = ag.foodSnapshot ? ag.foodSnapshot.name : '—';
    /* 转义动态值，防止用户输入的食品名 / 文案注入 HTML */
    var safeFood = escapeAppHtml(foodName);
    var safePrompt = escapeAppHtml(promptText);
    section.innerHTML =
      '<div class="ag-card ag-card--available" id="afterglow-card">' +
        '<div class="ag-card-head">' +
          '<span class="ag-status" id="afterglow-status">一小时以后</span>' +
          '<span class="ag-food">' + safeFood + '</span>' +
        '</div>' +
        '<div class="ag-question" id="afterglow-question">' + safePrompt + '</div>' +
        '<textarea class="ag-response" id="afterglow-response" maxlength="120" ' +
          'placeholder="留下一句话（1–120 字）" aria-label="余波回答"></textarea>' +
        '<div class="ag-actions">' +
          '<button type="button" class="ag-btn ag-btn--primary" id="afterglow-answer" onclick="answerAfterglow()">留下这次余波</button>' +
          '<button type="button" class="ag-btn ag-btn--ghost" id="afterglow-defer" onclick="deferAfterglow()">稍后再看</button>' +
          '<button type="button" class="ag-btn ag-btn--ghost" id="afterglow-dismiss" onclick="dismissAfterglow()">这次先不回答</button>' +
        '</div>' +
        '<div class="ag-foot">' +
          '<button type="button" class="ag-inline-link" id="afterglow-disable" onclick="disableAfterglow()">关闭余波回访</button>' +
        '</div>' +
      '</div>';
    section.style.display = '';
    /* 不被动抢焦点：首次加载 / window focus / visibilitychange 后不自动聚焦 textarea，
       避免移动端弹起软键盘。保存失败和验证失败时由调用方主动恢复焦点。 */
  }

  function renderAfterglowPending(ag){
    var section = document.getElementById('afterglow-section');
    var foodName = ag.foodSnapshot ? ag.foodSnapshot.name : '—';
    var safeFood = escapeAppHtml(foodName);
    var availableAtText = new Date(ag.availableAt).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'});
    section.innerHTML =
      '<div class="ag-card ag-card--pending">' +
        '<div class="ag-pending-text">一小时以后，再回来看看这次选择。</div>' +
        '<div class="ag-pending-meta">' + safeFood + ' · 大约 ' + availableAtText + '</div>' +
        '<div class="ag-foot">' +
          '<button type="button" class="ag-btn ag-btn--ghost ag-btn--sm" id="afterglow-demo" onclick="startAfterglowDemo()">演示一小时以后</button>' +
          '<button type="button" class="ag-inline-link" id="afterglow-disable" onclick="disableAfterglow()">关闭余波回访</button>' +
        '</div>' +
      '</div>';
    section.style.display = '';
  }

  function renderAfterglowDemo(){
    var section = document.getElementById('afterglow-section');
    if(!demoAfterglow) return;
    var promptText = AfterglowEngine ? AfterglowEngine.getPromptText(demoAfterglow.promptId) : '';
    var foodName = demoAfterglow.foodSnapshot ? demoAfterglow.foodSnapshot.name : '—';
    var safeFood = escapeAppHtml(foodName);
    var safePrompt = escapeAppHtml(promptText);

    /* completed=true：演示完成态。
       即使 window focus / visibilitychange / renderHome 再次触发 renderAfterglow，
       由于 demoAfterglow 仍存在且 completed=true，继续保持完成说明，直到用户点击“退出演示”。 */
    if(demoAfterglow.completed === true){
      section.innerHTML =
        '<div class="ag-card ag-card--demo">' +
          '<div class="ag-demo-badge">DEMO TIME · 未写入记录</div>' +
          '<div class="ag-pending-text">演示完成，未写入你的记录。</div>' +
          '<div class="ag-foot">' +
            '<button type="button" class="ag-inline-link" onclick="exitAfterglowDemo()">退出演示</button>' +
          '</div>' +
        '</div>';
      section.style.display = '';
      return;
    }

    /* completed=false：演示输入态 */
    section.innerHTML =
      '<div class="ag-card ag-card--demo" id="afterglow-card">' +
        '<div class="ag-demo-badge" id="afterglow-demo-badge">DEMO TIME · 未写入记录</div>' +
        '<div class="ag-card-head">' +
          '<span class="ag-status" id="afterglow-status">演示中</span>' +
          '<span class="ag-food">' + safeFood + '</span>' +
        '</div>' +
        '<div class="ag-question" id="afterglow-question">' + safePrompt + '</div>' +
        '<textarea class="ag-response" id="afterglow-response" maxlength="120" ' +
          'placeholder="留下一句话（1–120 字，演示）" aria-label="演示余波回答"></textarea>' +
        '<div class="ag-actions">' +
          '<button type="button" class="ag-btn ag-btn--primary" id="afterglow-answer" onclick="submitAfterglowDemo()">留下这次余波</button>' +
        '</div>' +
        '<div class="ag-foot">' +
          '<button type="button" class="ag-inline-link" onclick="exitAfterglowDemo()">退出演示</button>' +
        '</div>' +
      '</div>';
    section.style.display = '';
    /* 不被动抢焦点：renderAfterglowDemo 重新渲染时不自动 focus。
       演示由用户主动点击“演示一小时以后”启动，startAfterglowDemo 中显式聚焦。 */
  }

  /* ---------- Afterglow 操作（原子保存 + 回滚） ---------- */
  function replaceAfterglow(updated){
    if(!state.afterglows || !updated) return false;
    for(var i = 0; i < state.afterglows.length; i++){
      if(state.afterglows[i].id === updated.id){
        state.afterglows[i] = updated;
        return true;
      }
    }
    return false;
  }

  function answerAfterglow(){
    var now = Date.now();
    var next = AfterglowEngine ? AfterglowEngine.getNextAfterglow(state, now) : null;
    if(!next || next.__pendingHint){
      toast('没有可回答的余波');
      return;
    }
    var ag = next;
    var respEl = document.getElementById('afterglow-response');
    var text = respEl ? respEl.value : '';
    if(!AfterglowEngine.isValidResponse(text)){
      toast('请输入 1–120 字');
      if(respEl) respEl.focus();
      return;
    }
    var updated = AfterglowEngine.answer(ag, text, now);
    if(!updated){
      toast('回答无效');
      return;
    }
    /* 保存前快照 */
    var savedAg = Object.assign({}, ag);
    var buttons = ['afterglow-answer','afterglow-defer','afterglow-dismiss'];
    buttons.forEach(function(id){ var b = document.getElementById(id); if(b) b.disabled = true; });

    replaceAfterglow(updated);
    if(!DB.save(state)){
      /* 回滚 */
      replaceAfterglow(savedAg);
      buttons.forEach(function(id){ var b = document.getElementById(id); if(b) b.disabled = false; });
      toast('保存失败，请重试');
      var restoreResp = document.getElementById('afterglow-response');
      if(restoreResp){ restoreResp.value = text; restoreResp.focus(); }
      return;
    }
    toast('已留下这次余波');
    renderAfterglow();
    renderEchoes();
  }

  function deferAfterglow(){
    var now = Date.now();
    var next = AfterglowEngine ? AfterglowEngine.getNextAfterglow(state, now) : null;
    if(!next || next.__pendingHint){
      toast('没有可延后的余波');
      return;
    }
    var ag = next;
    var updated = AfterglowEngine.defer(ag, now);
    var savedAg = Object.assign({}, ag);
    var buttons = ['afterglow-answer','afterglow-defer','afterglow-dismiss'];
    buttons.forEach(function(id){ var b = document.getElementById(id); if(b) b.disabled = true; });

    replaceAfterglow(updated);
    if(!DB.save(state)){
      replaceAfterglow(savedAg);
      buttons.forEach(function(id){ var b = document.getElementById(id); if(b) b.disabled = false; });
      toast('保存失败，请重试');
      return;
    }
    toast('已延后一小时');
    renderAfterglow();
    renderEchoes();
  }

  function dismissAfterglow(){
    var now = Date.now();
    var next = AfterglowEngine ? AfterglowEngine.getNextAfterglow(state, now) : null;
    if(!next || next.__pendingHint){
      toast('没有可忽略的余波');
      return;
    }
    var ag = next;
    var updated = AfterglowEngine.dismiss(ag, now);
    var savedAg = Object.assign({}, ag);
    var buttons = ['afterglow-answer','afterglow-defer','afterglow-dismiss'];
    buttons.forEach(function(id){ var b = document.getElementById(id); if(b) b.disabled = true; });

    replaceAfterglow(updated);
    if(!DB.save(state)){
      replaceAfterglow(savedAg);
      buttons.forEach(function(id){ var b = document.getElementById(id); if(b) b.disabled = false; });
      toast('保存失败，请重试');
      return;
    }
    toast('已忽略本次');
    renderAfterglow();
    renderEchoes();
  }

  function disableAfterglow(){
    if(!state.userPreferences) state.userPreferences = {tone:'calm',language:'zh-CN',recentCopyIds:[]};
    var saved = state.userPreferences.afterglowEnabled;
    state.userPreferences.afterglowEnabled = false;
    if(!DB.save(state)){
      state.userPreferences.afterglowEnabled = saved;
      toast('保存失败，请重试');
      return;
    }
    toast('余波回访已关闭');
    renderAfterglow();
    renderEchoes();
  }

  function enableAfterglow(){
    if(!state.userPreferences) state.userPreferences = {tone:'calm',language:'zh-CN',recentCopyIds:[]};
    var saved = state.userPreferences.afterglowEnabled;
    state.userPreferences.afterglowEnabled = true;
    if(!DB.save(state)){
      state.userPreferences.afterglowEnabled = saved;
      toast('保存失败，请重试');
      return;
    }
    toast('余波回访已开启');
    renderAfterglow();
    renderEchoes();
  }

  /* ---------- Demo Time（纯内存） ---------- */
  function startAfterglowDemo(){
    var now = Date.now();
    var pending = AfterglowEngine ? AfterglowEngine.getEarliestPending(state, now) : null;
    if(!pending){
      toast('没有可演示的余波');
      return;
    }
    /* 复制真实 promptId 和 foodSnapshot，不写入任何持久字段。
       completed=false 表示演示输入态；提交后置为 true 进入完成态。 */
    demoAfterglow = {
      id: 'demo_' + now,
      promptId: pending.promptId,
      foodSnapshot: { name: pending.foodSnapshot.name, category: pending.foodSnapshot.category },
      completed: false
    };
    renderAfterglowDemo();
    /* 用户主动点击“演示一小时以后”启动演示，显式聚焦演示 textarea */
    var resp = document.getElementById('afterglow-response');
    if(resp) setTimeout(function(){ resp.focus(); }, 50);
  }

  function submitAfterglowDemo(){
    if(!demoAfterglow) return;
    var respEl = document.getElementById('afterglow-response');
    var text = respEl ? respEl.value : '';
    if(!AfterglowEngine.isValidResponse(text)){
      toast('请输入 1–120 字');
      if(respEl) respEl.focus();
      return;
    }
    /* 演示完成：不保存真实回答文本，不生成 answeredAt，不写入 localStorage/sessionStorage。
       仅将 completed 置为 true，由 renderAfterglowDemo 统一渲染完成态。
       这样 window focus / visibilitychange / renderHome 再次触发 renderAfterglow 时，
       由于 demoAfterglow 仍存在且 completed=true，会继续保持完成说明。 */
    demoAfterglow.completed = true;
    toast('演示完成，未写入你的记录。');
    renderAfterglowDemo();
  }

  function exitAfterglowDemo(){
    demoAfterglow = null;
    renderAfterglow();
    renderEchoes();
  }

  /* ---------- Afterglow 时间刷新 ---------- */
  function scheduleAfterglowRefresh(){
    if(agRefreshTimer){
      clearTimeout(agRefreshTimer);
      agRefreshTimer = null;
    }
    if(!afterglowEnabled()){ return; }
    var now = Date.now();
    var pending = AfterglowEngine ? AfterglowEngine.getEarliestPending(state, now) : null;
    if(!pending) return;
    var ms = pending.availableAt - now;
    if(ms <= 0) return; /* 已可回答，无需定时 */
    /* 仅在当前页面打开时设置单次刷新；页面隐藏或重新渲染时清理 */
    if(document.hidden) return;
    agRefreshTimer = setTimeout(function(){
      agRefreshTimer = null;
      /* 仅当首页激活时刷新，避免后台渲染 */
      var homeEl = document.getElementById('view-home');
      if(homeEl && homeEl.classList.contains('active')){
        renderAfterglow();
      }
    }, ms + 500);
  }

  /* ---------- Shared Echoes 同类回声渲染 (V6D-C) ----------
     纯只读渲染：不写 localStorage，不修改 state，不修改 Afterglow。
     用户先回答自己的 Afterglow → 再看到经过审核的匿名经验示例。
     所有动态文本使用 textContent / createElement / appendChild 安全渲染。
  */
  function renderEchoes(){
    var section = document.getElementById('echoes-section');
    if(!section) return;
    /* 每次清空，无资格时隐藏 */
    section.innerHTML = '';
    section.style.display = 'none';

    if(!EchoEngine || !EchoBank) return;

    /* 只有存在 answered Afterglow 才显示 */
    var afterglow = EchoEngine.getLatestAnsweredAfterglow(state);
    if(!afterglow) return;

    var echoes = EchoEngine.selectEchoes(afterglow, state, 3);
    if(echoes.length === 0) return;

    var intro = EchoEngine.selectIntro(afterglow);
    var introText = intro ? intro.text : '';

    /* 使用 createElement / appendChild 安全构建，不拼接动态值到 innerHTML */
    var panel = document.createElement('div');
    panel.className = 'echoes-panel';

    /* 1. 标题：同类回声 */
    var head = document.createElement('div');
    head.className = 'echoes-head';
    head.textContent = '同类回声';
    panel.appendChild(head);

    /* 2. Echo Intro */
    if(introText){
      var introEl = document.createElement('div');
      introEl.className = 'echoes-intro';
      introEl.textContent = introText;
      panel.appendChild(introEl);
    }

    /* 3. 自己刚才留下的回答（必须先于示例出现） */
    var selfEl = document.createElement('div');
    selfEl.className = 'echoes-self';
    var selfLabel = document.createElement('div');
    selfLabel.className = 'echoes-self-label';
    selfLabel.textContent = '你刚才留下的';
    var selfText = document.createElement('div');
    selfText.className = 'echoes-self-text';
    selfText.textContent = afterglow.responseText || '';
    selfEl.appendChild(selfLabel);
    selfEl.appendChild(selfText);
    panel.appendChild(selfEl);

    /* 4. 三条 reviewed example */
    var list = document.createElement('div');
    list.className = 'echoes-list';
    echoes.forEach(function(item){
      var echoItem = document.createElement('div');
      echoItem.className = 'echo-item';
      var textEl = document.createElement('div');
      textEl.className = 'echo-item__text';
      textEl.textContent = item.entry.text;
      var matchEl = document.createElement('div');
      matchEl.className = 'echo-item__match';
      matchEl.textContent = item.matchLabel;
      echoItem.appendChild(textEl);
      echoItem.appendChild(matchEl);
      list.appendChild(echoItem);
    });
    panel.appendChild(list);

    /* 5. 数据来源说明 */
    var note = document.createElement('div');
    note.className = 'echoes-source-note';
    note.textContent = '以下为经过审核的匿名经验示例，不代表实时社区、真实在线用户或用户数量。';
    panel.appendChild(note);

    section.appendChild(panel);
    section.style.display = '';
  }

  /* ---------- 食品管理 (CRUD) ---------- */
  var foodFilter = 'all';

  function setFoodFilter(filter){
    foodFilter = filter;
    document.querySelectorAll('.ffb-btn').forEach(function(btn){
      btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    renderFoodList();
  }

  function renderFoodList(){
    var listEl = document.getElementById('food-list');
    if(!listEl) return;
    var foods = state.foods.slice().reverse();
    if(foodFilter === 'pending') foods = foods.filter(function(f){ return !f.handled; });
    else if(foodFilter === 'completed') foods = foods.filter(function(f){ return f.handled; });

    if(foods.length === 0){
      listEl.innerHTML = '<div class="p-empty">没有食品。点击"+ 添加"开始。</div>';
      return;
    }
    var choiceLabels = {eat:'吃掉',drop:'完成处理',save:'保存',share:'分享分装'};
    listEl.innerHTML = foods.map(function(f){
      var choices = state.choices.filter(function(c){ return c.foodId === f.id; });
      var lastChoice = choices.length > 0 ? choices[choices.length-1] : null;
      return '<div class="food-card'+(f.handled?' completed':'')+'">' +
        '<button type="button" class="fc-main" onclick="'+(f.handled?'':'openReview(\''+f.id+'\')')+'">' +
        '<div><div class="fc-name">'+escapeAppHtml(f.name)+'</div>' +
        '<div class="fc-meta">'+f.category+' · '+f.openedState+' · '+escapeAppHtml(f.location||'—')+(lastChoice?' · '+choiceLabels[lastChoice.choiceType]:'')+'</div></div>' +
        '<span class="fc-arrow">'+(f.handled?'✓':'→')+'</span></button>' +
        '<div class="fc-actions">' +
        (f.handled ? '<button class="fc-act-btn restore" onclick="restoreFood(\''+f.id+'\')">恢复待处理</button>' : '<button class="fc-act-btn" onclick="editFood(\''+f.id+'\')">编辑</button>') +
        '<button class="fc-act-btn danger" onclick="deleteFood(\''+f.id+'\')">删除</button></div></div>';
    }).join('');
  }

  function showFoodForm(){
    document.getElementById('food-form-area').style.display = '';
    document.getElementById('food-form-title').textContent = '添加食品';
    document.getElementById('food-form-submit').textContent = '加入';
    document.getElementById('f-edit-id').value = '';
    document.getElementById('food-form').reset();
    setTimeout(function(){ document.getElementById('f-name').focus(); }, 100);
  }

  function hideFoodForm(){
    document.getElementById('food-form-area').style.display = 'none';
    document.getElementById('food-form').reset();
  }

  function saveFood(e){
    e.preventDefault();
    var editId = document.getElementById('f-edit-id').value;
    var foodData = {
      name: document.getElementById('f-name').value.trim(),
      category: document.getElementById('f-category').value,
      openedState: document.getElementById('f-opened').value,
      location: document.getElementById('f-location').value.trim() || '未记录',
      purchaseReason: document.getElementById('f-reason').value,
      energyBand: getCategoryReminder(document.getElementById('f-category').value)
    };
    if(editId){
      var food = state.foods.find(function(f){ return f.id===editId; });
      if(food){
        var savedFood = Object.assign({}, food);
        Object.assign(food, foodData);
        if(DB.save(state)){
          toast('已更新');
        } else {
          Object.assign(food, savedFood);
          toast('保存失败');
          return false;
        }
      }
    } else {
      var newFood = {
        id: 'f_'+Date.now()+'_'+Math.random().toString(36).slice(2,6),
        name: foodData.name,
        category: foodData.category,
        openedState: foodData.openedState,
        location: foodData.location,
        purchaseReason: foodData.purchaseReason,
        energyBand: foodData.energyBand,
        createdAt: Date.now(),
        handled: false,
        contextTags: [],
        deleted: false
      };
      state.foods.push(newFood);
      if(DB.save(state)){
        toast('已加入待处理');
      } else {
        state.foods.pop();
        toast('保存失败');
        return false;
      }
    }
    hideFoodForm();
    renderFoodList();
    return false;
  }

  function editFood(id){
    var food = state.foods.find(function(f){ return f.id===id; });
    if(!food) return;
    document.getElementById('food-form-area').style.display = '';
    document.getElementById('food-form-title').textContent = '编辑食品';
    document.getElementById('food-form-submit').textContent = '保存';
    document.getElementById('f-edit-id').value = id;
    document.getElementById('f-name').value = food.name;
    document.getElementById('f-category').value = food.category;
    document.getElementById('f-opened').value = food.openedState;
    document.getElementById('f-location').value = food.location;
    document.getElementById('f-reason').value = food.purchaseReason;
    setTimeout(function(){ document.getElementById('f-name').focus(); }, 100);
  }

  function deleteFood(id){
    var food = state.foods.find(function(f){ return f.id===id; });
    if(!food) return;
    var idx = state.foods.indexOf(food);
    state.foods = state.foods.filter(function(f){ return f.id !== id; });
    if(DB.save(state)){
      toast('已删除');
    } else {
      state.foods.splice(idx, 0, food);
      toast('删除失败');
    }
    renderFoodList();
  }

  function restoreFood(id){
    var food = state.foods.find(function(f){ return f.id===id; });
    if(!food) return;
    var savedHandled = food.handled;
    food.handled = false;
    if(DB.save(state)){
      toast('已恢复为待处理');
    } else {
      food.handled = savedHandled;
      toast('恢复失败');
    }
    renderFoodList();
  }

  /* ---------- 处理流程 ---------- */
  function startProcess(){
    var pending = state.foods.filter(function(f){ return !f.handled; });
    var listEl = document.getElementById('process-food-list');
    if(pending.length === 0){
      listEl.innerHTML = '<div class="p-empty">没有待处理食品。到食品页添加一件。</div>';
    } else {
      listEl.innerHTML = pending.map(function(f){
        return '<button type="button" class="p-pending-item" onclick="selectProcessFood(\''+f.id+'\')">' +
          '<div><div class="ppi-name">'+escapeAppHtml(f.name)+'</div>' +
          '<div class="ppi-meta">'+f.category+' · '+f.openedState+' · '+escapeAppHtml(f.location||'—')+'</div></div>' +
          '<span class="ppi-arrow">→</span></button>';
      }).join('');
    }
    document.getElementById('process-step1').style.display = '';
    document.getElementById('process-step2').style.display = 'none';
    document.getElementById('process-step3').style.display = 'none';
    document.getElementById('psi-1').className = 'psi-dot active';
    document.getElementById('psi-2').className = 'psi-dot';
    document.getElementById('psi-3').className = 'psi-dot';
    currentFeeling = null;
  }

  function selectProcessFood(id){
    currentFoodId = id;
    var food = state.foods.find(function(f){ return f.id===id; });
    if(!food) return;
    document.getElementById('pf-name').textContent = food.name;
    document.getElementById('pf-cat').textContent = food.category + ' · ' + food.openedState;
    document.getElementById('process-step1').style.display = 'none';
    document.getElementById('process-step2').style.display = '';
    document.getElementById('psi-1').className = 'psi-dot done';
    document.getElementById('psi-2').className = 'psi-dot active';
    document.querySelectorAll('.feeling-btn').forEach(function(b){ b.classList.remove('selected'); });
    currentFeeling = null;
  }

  function selectFeeling(feeling){
    currentFeeling = feeling;
    document.querySelectorAll('.feeling-btn').forEach(function(b){
      b.classList.toggle('selected', b.dataset.feeling === feeling);
    });
    renderProcessChoices(feeling);
    setTimeout(function(){
      document.getElementById('process-step2').style.display = 'none';
      document.getElementById('process-step3').style.display = '';
      document.getElementById('psi-2').className = 'psi-dot done';
      document.getElementById('psi-3').className = 'psi-dot active';
    }, 300);
  }

  function processBack(toStep){
    if(toStep === 1){
      document.getElementById('process-step2').style.display = 'none';
      document.getElementById('process-step1').style.display = '';
      document.getElementById('psi-1').className = 'psi-dot active';
      document.getElementById('psi-2').className = 'psi-dot';
    } else if(toStep === 2){
      document.getElementById('process-step3').style.display = 'none';
      document.getElementById('process-step2').style.display = '';
      document.getElementById('psi-2').className = 'psi-dot active';
      document.getElementById('psi-3').className = 'psi-dot';
    }
  }

  var FEELING_HINTS = {
    want: '还想继续——冲动还在。看看哪种方式能让此刻最舒服。',
    hesitate: '有一点犹豫——冲动和判断在拉扯。不需要立刻吃掉。',
    'dont-want': '冲动已经过去——也许它已经完成了它的任务。',
    dont_want: '冲动已经过去——也许它已经完成了它的任务。',
    waste: '主要是不舍得浪费——但吃掉不等于不浪费，只是换了一种代价。'
  };

  var CHOICE_DEFS = [
    {key:'eat', name:'吃掉', cost:'代价：健康顾虑、补偿压力'},
    {key:'drop', name:'完成处理', cost:'代价：金钱损失、浪费感'},
    {key:'save', name:'保存', cost:'代价：继续占用注意力'},
    {key:'share', name:'分享分装', cost:'代价：需要场景配合'}
  ];

  /* 根据感受调整排序（不隐藏选项，不标注推荐） */
  function getOrderedChoices(feeling){
    var order = {
      want: ['eat','save','share','drop'],
      hesitate: ['save','share','drop','eat'],
      'dont-want': ['drop','share','save','eat'],
      dont_want: ['drop','share','save','eat'],
      waste: ['share','save','drop','eat']
    };
    var ord = order[feeling] || ['eat','drop','save','share'];
    return ord.map(function(k){ return CHOICE_DEFS.find(function(c){ return c.key===k; }); });
  }

  function renderProcessChoices(feeling){
    var hintEl = document.getElementById('feeling-hint');
    hintEl.textContent = FEELING_HINTS[feeling] || '看看哪种方式能让此刻最舒服。';
    var choicesEl = document.getElementById('process-choices');
    var ordered = getOrderedChoices(feeling);
    /* 移除"推荐"标记，仅按感受排序 */
    choicesEl.innerHTML = ordered.map(function(c){
      return '<button class="p-choice-btn" data-choice="'+c.key+'" onclick="enterEmotionalSpace(\''+c.key+'\')">' +
        '<div class="pcb-name">'+c.name+'</div>' +
        '<div class="pcb-cost">'+c.cost+'</div>' +
        '<div class="pcb-cta">进入情绪空间 →</div></button>';
    }).join('');
  }

  /* ---------- Review Item ---------- */
  function openReview(id){
    var food = state.foods.find(function(f){ return f.id===id; });
    if(!food) return;
    currentFoodId = id;
    document.getElementById('r-name').textContent = food.name;
    document.getElementById('r-cat').textContent = food.category;
    document.getElementById('r-opened').textContent = food.openedState;
    document.getElementById('r-location').textContent = food.location;
    document.getElementById('r-reason').textContent = food.purchaseReason;
    document.getElementById('r-energy').textContent = getCategoryReminder(food.category);

    var peakTexts = {
      '未开封':'它还没开封。也许你还没到达峰值窗口。',
      '已开封':'它已经开封了。峰值可能已经过去，但它还在占用你的注意力。',
      '刚开封':'刚开封——这可能是它的峰值窗口。'
    };
    document.getElementById('r-peak-text').textContent = peakTexts[food.openedState] || peakTexts['未开封'];

    var choicesEl = document.getElementById('review-choices');
    if(choicesEl){
      choicesEl.innerHTML = CHOICE_DEFS.map(function(c){
        return '<button class="p-choice-btn" data-choice="'+c.key+'" onclick="enterEmotionalSpace(\''+c.key+'\')">' +
          '<div class="pcb-name">'+c.name+'</div>' +
          '<div class="pcb-cost">'+c.cost+'</div>' +
          '<div class="pcb-cta">进入情绪空间 →</div></button>';
      }).join('');
    }

    showView('review');
  }

  function getCategoryReminder(category){
    var reminders = {
      '含糖饮料':'口感变化较快',
      '薯片':'开封后口感会变化',
      '冰淇淋':'适合留意保存状态',
      '甜品':'新鲜感可能变化',
      '巧克力':'容易受环境影响',
      '奶茶':'适合及时做出选择',
      '夜宵':'先看看此刻是否还想要',
      '聚会剩余':'可以考虑保存或分享',
      '大包装':'可以考虑分装处理'
    };
    return reminders[category] || '可以留意此刻的感受';
  }

  /* 旧版能量档值 → 中性提醒映射 */
  var LEGACY_ENERGY_VALUES = ['高糖刺激','高盐高脂','高糖冷食','高糖','高糖高脂','高热量','混合','超量'];

  function migrateLegacyFoods(){
    var changed = false;
    /* 保存修改前的 energyBand 用于精确回滚 */
    var savedBands = [];
    state.foods.forEach(function(f){
      if(LEGACY_ENERGY_VALUES.indexOf(f.energyBand) >= 0 || !f.energyBand){
        var newReminder = getCategoryReminder(f.category);
        if(f.energyBand !== newReminder){
          savedBands.push({
            food: f,
            hadOwnProperty: Object.prototype.hasOwnProperty.call(f, 'energyBand'),
            oldValue: f.energyBand
          });
          f.energyBand = newReminder;
          changed = true;
        }
      }
    });
    if(changed){
      if(!DB.save(state)){
        /* 保存失败 — 精确恢复原始对象状态 */
        savedBands.forEach(function(s){
          if(s.hadOwnProperty){
            s.food.energyBand = s.oldValue;
          } else {
            delete s.food.energyBand;
          }
        });
      }
    }
  }

  /* ---------- 示例数据 ---------- */
  var SEED_DEFINITIONS = [
    {name:'冰镇可乐',category:'含糖饮料',openedState:'已开封',location:'冰箱',purchaseReason:'顺手买'},
    {name:'原味薯片',category:'薯片',openedState:'已开封',location:'桌上',purchaseReason:'情绪奖励'},
    {name:'巧克力冰淇淋',category:'冰淇淋',openedState:'未开封',location:'冰箱',purchaseReason:'运动后奖励'}
  ];

  function matchesCanonical(food, seed){
    return food.name === seed.name &&
           food.category === seed.category &&
           food.openedState === seed.openedState &&
           food.location === seed.location &&
           food.purchaseReason === seed.purchaseReason;
  }

  function findExistingSeed(seed){
    var match = state.foods.find(function(f){ return f.isDemoSeed === true && f.name === seed.name && f.category === seed.category; });
    if(match) return match;
    match = state.foods.find(function(f){ return f.isDemoSeed !== true && matchesCanonical(f, seed); });
    return match;
  }

  function seedDemo(){
    var added = 0;
    var tagged = 0;
    /* 保存修改前的快照用于回滚 */
    var savedFoods = state.foods.map(function(f){ return Object.assign({}, f); });
    var newFoodIds = [];

    SEED_DEFINITIONS.forEach(function(s){
      var existing = findExistingSeed(s);
      if(existing){
        if(!existing.isDemoSeed){
          existing.isDemoSeed = true;
          existing.energyBand = getCategoryReminder(s.category);
          tagged++;
        }
      } else {
        var newId = 'f_'+Date.now()+'_'+Math.random().toString(36).slice(2,6);
        state.foods.push({
          id: newId,
          name:s.name, category:s.category, openedState:s.openedState,
          location:s.location, purchaseReason:s.purchaseReason,
          energyBand:getCategoryReminder(s.category),
          createdAt:Date.now(), handled:false, isDemoSeed:true,
          contextTags:[], deleted:false
        });
        newFoodIds.push(newId);
        added++;
      }
    });
    var saveOk = DB.save(state);
    if(saveOk){
      if(added===0 && tagged===0){
        toast('示例数据已存在');
      } else if(added>0 && tagged>0){
        toast('已补入 ' + added + ' 件示例食品');
      } else if(added===3){
        toast('已载入 3 件示例食品');
      } else if(added>0){
        toast('已补入 ' + added + ' 件示例食品');
      } else {
        toast('示例数据已存在');
      }
    } else {
      /* 保存失败 — 完整回滚内存 */
      state.foods = savedFoods;
      /* 恢复被 tag 的已有食品 */
      /* savedFoods 已包含修改前的完整状态，直接恢复 */
      toast('保存失败');
    }
    updateSeedBtn();
    renderHome();
    renderFoodList();
  }

  function updateSeedBtn(){
    var btn = document.getElementById('seed-btn');
    if(!btn) return;
    var allExist = true;
    for(var i=0; i<SEED_DEFINITIONS.length; i++){
      var match = findExistingSeed(SEED_DEFINITIONS[i]);
      if(!match){ allExist = false; break; }
    }
    if(allExist){
      btn.style.display='none';
    } else {
      btn.style.display='';
    }
  }

  /* ---------- 情绪空间 ---------- */
  var esOverlay, beginBtn, slideTrack, slideFill, slideHandle, slideHint, esCopy, esComplete;
  var ringOuter, ringMid, ringInner, coreGlow, coreDot;

  function initEmotionalSpace(){
    esOverlay = document.getElementById('es-overlay');
    beginBtn = document.getElementById('begin-btn');
    slideTrack = document.getElementById('slide-track');
    slideFill = document.getElementById('slide-fill');
    slideHandle = document.getElementById('slide-handle');
    slideHint = document.getElementById('slide-hint');
    esCopy = document.getElementById('es-copy');
    esComplete = document.getElementById('es-complete');
    ringOuter = document.getElementById('ring-outer');
    ringMid = document.getElementById('ring-mid');
    ringInner = document.getElementById('ring-inner');
    coreGlow = document.getElementById('core-glow');
    coreDot = document.getElementById('core-dot');

    /* 初始化 Motion 模块 */
    Motion.init({
      outer: ringOuter,
      mid: ringMid,
      inner: ringInner,
      coreGlow: coreGlow,
      coreDot: coreDot
    });

    /* Begin→Slide Morph */
    beginBtn.addEventListener('click', function(){
      /* 点击 Begin 后立即停止静息呼吸，由 Motion 独立控制 ring */
      esOverlay.classList.add('ritual-interacting');
      beginBtn.classList.add('morphing');
      setTimeout(function(){
        beginBtn.style.display='none';
        slideTrack.classList.add('active');
        slideHandle.style.display='flex';
        slideHandle.tabIndex = 0;
        slideHint.textContent = 'Slide to confirm';
        document.getElementById('es-choice-prompt').textContent = PACKS[state.currentPack].prompt;
        slideHandle.focus();
      }, 300);
    });

    /* 滑动事件 */
    slideHandle.addEventListener('mousedown', startDrag);
    slideHandle.addEventListener('touchstart', startDrag, {passive:false});
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('touchmove', onDrag, {passive:false});
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchend', endDrag);

    /* 键盘滑动支持 */
    slideHandle.addEventListener('keydown', function(e){
      if(slideHandle.style.display==='none' || ritualCompleted) return;
      var currentProgress = parseFloat(slideFill.style.width) / 100 || 0;
      if(e.key==='ArrowRight'){
        e.preventDefault();
        setRitualProgress(Math.min(1, currentProgress + 0.1));
      } else if(e.key==='ArrowLeft'){
        e.preventDefault();
        setRitualProgress(Math.max(0, currentProgress - 0.1));
      } else if(e.key==='Home'){
        e.preventDefault();
        setRitualProgress(0);
      } else if(e.key==='End'){
        e.preventDefault();
        setRitualProgress(1);
      } else if(e.key==='Enter' || e.key===' '){
        e.preventDefault();
        if(currentProgress >= 0.5){
          setRitualProgress(1);
        }
      }
    });

    /* Esc 退出未完成的情绪空间 */
    document.addEventListener('keydown', function(e){
      if(e.key==='Escape' && esOverlay.classList.contains('active')){
        if(esComplete.classList.contains('active')) return;
        exitEmotionalSpace();
      }
    });

    /* Focus Trap */
    document.addEventListener('keydown', function(e){
      if(!esOverlay.classList.contains('active')) return;
      if(e.key !== 'Tab') return;
      var focusable = esOverlay.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      var visible = Array.from(focusable).filter(function(el){ return el.offsetParent !== null && !el.disabled; });
      if(visible.length === 0) return;
      var first = visible[0];
      var last = visible[visible.length - 1];
      if(!esOverlay.contains(document.activeElement)){
        e.preventDefault();
        if(e.shiftKey) last.focus(); else first.focus();
        return;
      }
      if(e.shiftKey){
        if(document.activeElement === first){ e.preventDefault(); last.focus(); }
      } else {
        if(document.activeElement === last){ e.preventDefault(); first.focus(); }
      }
    });

    /* 返回按钮 */
    document.getElementById('ec-cta').addEventListener('click', function(){
      /* 退出前取消 Motion 的 pending completion timeout，清理 lit/charged/inline transform */
      Motion.reset();
      /* 清除 ritual-interacting，下次进入时恢复呼吸 */
      esOverlay.classList.remove('ritual-interacting');
      esOverlay.classList.remove('active');
      esOverlay.setAttribute('aria-hidden','true');
      var phoneTabs = document.getElementById('phone-tabs');
      if(phoneTabs) phoneTabs.classList.remove('es-hidden');
      setTimeout(function(){
        showView('home');
        renderReview();
        var greeting = document.getElementById('home-greeting');
        if(greeting) greeting.focus();
      }, 400);
    });

    /* 退出按钮 */
    document.getElementById('es-close').addEventListener('click', exitEmotionalSpace);

    /* Mood Space Pack 切换 */
    document.querySelectorAll('.pack-chip').forEach(function(chip){
      chip.addEventListener('click', function(){
        var packKey = chip.dataset.pack;
        var savedPack = state.currentPack;
        state.currentPack = packKey;
        if(!DB.save(state)){
          state.currentPack = savedPack;
          toast('保存失败');
          return;
        }
        applyPack(packKey);
        if(!esComplete.classList.contains('active')){
          document.getElementById('es-line').textContent = PACKS[packKey].line;
          document.getElementById('es-choice-prompt').textContent = PACKS[packKey].prompt;
        }
      });
    });
  }

  function enterEmotionalSpace(choiceType){
    currentChoice = choiceType;
    lastFocusedChoiceBtn = document.activeElement;
    applyPack(state.currentPack);
    var food = state.foods.find(function(f){ return f.id===currentFoodId; });

    /* 顶部只显示一次食品名称（使用 es-food-name，不再设置 es-status-name） */
    document.getElementById('es-food-name').textContent = food ? food.name : '—';

    /* 状态视觉桥梁：感受 + 选择方向（不含食品名称） */
    var choiceLabels = {eat:'吃掉',drop:'完成处理',save:'保存',share:'分享分装'};
    var choiceColors = {eat:'var(--lemon)',drop:'var(--coral)',save:'var(--sky)',share:'var(--aqua)'};
    var feelingLabels = {want:'还想继续',hesitate:'有点犹豫',dont_want:'不太想要','dont-want':'不太想要',dontwant:'不太想要',waste:'不舍得浪费'};
    var statusAnchor = document.getElementById('es-status-anchor');
    var statusChoice = document.getElementById('es-status-choice');
    var statusFeeling = document.getElementById('es-status-feeling');
    if(statusAnchor && statusChoice){
      statusChoice.textContent = choiceLabels[choiceType] || choiceType;
      statusChoice.style.color = choiceColors[choiceType] || 'var(--es-fg)';
      if(statusFeeling){
        if(currentFeeling){
          statusFeeling.textContent = feelingLabels[currentFeeling] || '';
          statusFeeling.style.display = '';
        } else {
          statusFeeling.style.display = 'none';
        }
      }
      statusAnchor.style.display = 'flex';
    }

    /* 重置控件状态 */
    ritualCompleted = false;
    beginBtn.classList.remove('morphing');
    beginBtn.style.display='';
    slideTrack.classList.remove('active');
    slideHandle.style.display='none';
    slideHandle.tabIndex = -1;
    slideFill.style.width='0%';
    slideHandle.style.left='0px';
    slideHandle.setAttribute('aria-valuenow','0');
    slideHint.classList.remove('fade');
    esCopy.style.display='';
    esComplete.classList.remove('active');
    Motion.reset();

    /* 重新进入情绪空间：清除 ritual-interacting，恢复静息呼吸 */
    esOverlay.classList.remove('ritual-interacting');

    /* 隐藏手机 UI 层 */
    var phoneTabs = document.getElementById('phone-tabs');
    if(phoneTabs) phoneTabs.classList.add('es-hidden');

    esOverlay.classList.add('active');
    esOverlay.setAttribute('aria-hidden','false');
    setTimeout(function(){ beginBtn.focus(); }, 350);
  }

  function applyPack(packKey){
    var p = PACKS[packKey];
    var root = document.documentElement;
    root.style.setProperty('--es-bg-grad', p.bg);
    document.querySelector('.es-bg').style.background = p.bg;
    root.style.setProperty('--es-c1', p.c1);
    root.style.setProperty('--es-c2', p.c2);
    root.style.setProperty('--es-c3', p.c3);
    root.style.setProperty('--es-c4', p.c4);
    root.style.setProperty('--es-glow', p.glow);
    root.style.setProperty('--es-fg', p.fg);
    document.getElementById('es-line').textContent = p.line;
    /* 不再设置 ec-text 为 PACKS complete — 由 Copy Engine 决定 */
    slideFill.style.background = p.fillGrad;
    document.querySelectorAll('.pack-chip').forEach(function(c){
      c.classList.toggle('active', c.dataset.pack===packKey);
    });
  }

  function startDrag(e){
    if(ritualCompleted) return;
    dragging=true;
    slideHandle.classList.add('dragging');
    slideHint.classList.add('fade');
    trackRect = slideTrack.getBoundingClientRect();
    var clientX = e.touches ? e.touches[0].clientX : e.clientX;
    startX = clientX;
    e.preventDefault();
  }

  /* 统一进度函数：鼠标、触摸、键盘共用 */
  function setRitualProgress(progress){
    if(ritualCompleted) return;
    progress = Math.max(0, Math.min(1, progress));
    var trackRectKb = slideTrack.getBoundingClientRect();
    var maxX = trackRectKb.width - 56;

    slideFill.style.width = (progress * 100) + '%';
    slideHandle.style.left = (progress * maxX) + 'px';
    slideHandle.setAttribute('aria-valuenow', Math.round(progress * 100));
    slideHint.classList.add('fade');

    /* 使用 Motion 模块驱动圆环 */
    Motion.setProgress(progress);

    if(progress >= 0.96){
      dragging = false;
      completeRitual();
    }
  }

  function onDrag(e){
    if(!dragging) return;
    var clientX = e.touches ? e.touches[0].clientX : e.clientX;
    var delta = clientX - trackRect.left;
    var maxX = trackRect.width - 56;
    var progress = Math.max(0, Math.min(1, delta / maxX));
    setRitualProgress(progress);
  }

  function endDrag(){
    if(!dragging) return;
    dragging=false;
    slideHandle.classList.remove('dragging');
    var fillWidth = parseFloat(slideFill.style.width);
    if(fillWidth < 96 && !ritualCompleted){
      slideFill.style.width='0%';
      slideHandle.style.left='0px';
      slideHandle.setAttribute('aria-valuenow','0');
      slideHint.classList.remove('fade');
      Motion.reset();
    }
  }

  /* 完成仪式 — 集成 Copy Engine */
  function completeRitual(){
    if(ritualCompleted) return;
    ritualCompleted = true;

    /* 准备 Copy Engine 上下文 */
    var food = state.foods.find(function(f){ return f.id===currentFoodId; });
    var timeContext = Store.getTimeContext();
    var recentCopyIds = Store.getRecentCopyIdsFromChoices(state);

    /* feeling 规范化：dont-want → dont_want */
    var normalizedFeeling = currentFeeling;
    if(normalizedFeeling === 'dont-want' || normalizedFeeling === 'dontwant'){
      normalizedFeeling = 'dont_want';
    }

    var ctx = {
      choiceType: currentChoice,
      feeling: normalizedFeeling,
      foodCategory: food ? food.category : 'unknown',
      openedState: food ? food.openedState : 'unknown',
      purchaseReason: food ? food.purchaseReason : 'unknown',
      timeContext: timeContext,
      currentPack: state.currentPack,
      contextTags: food && food.contextTags ? food.contextTags : [],
      recentCopyIds: recentCopyIds,
      recentChoicesCopyIds: recentCopyIds,
      confidence: 'unknown',
      needState: 'unknown',
      tone: state.userPreferences ? state.userPreferences.tone : 'calm'
    };

    /* 调用 Copy Engine */
    var result = CopyEngine.select(ctx);
    var contextSnapshot = CopyEngine.buildSnapshot(ctx);
    var copyResponse = CopyEngine.buildCopyResponse(result);

    /* 记录选择（包含 copyResponse 和 contextSnapshot） */
    var choice = {
      id: 'c_'+Date.now(),
      foodId: currentFoodId,
      choiceType: currentChoice,
      feeling: normalizedFeeling,
      createdAt: Date.now(),
      pack: state.currentPack,
      copyResponse: copyResponse,
      contextSnapshot: contextSnapshot,
      afterglowId: null
    };

    /* 构造 Afterglow（如果用户未关闭余波回访） */
    var afterglowEnabled = state.userPreferences && state.userPreferences.afterglowEnabled !== undefined
      ? state.userPreferences.afterglowEnabled : true;
    var newAfterglow = null;
    if(afterglowEnabled && AfterglowEngine){
      newAfterglow = AfterglowEngine.createForChoice(choice, food, contextSnapshot);
      if(newAfterglow){
        choice.afterglowId = newAfterglow.id;
      }
    }

    /* 保存状态快照用于回滚 */
    var savedChoicesLength = state.choices.length;
    var savedAfterglowsLength = state.afterglows ? state.afterglows.length : 0;
    var savedRecentCopyIds = state.userPreferences && state.userPreferences.recentCopyIds
      ? state.userPreferences.recentCopyIds.slice() : [];
    var savedFoodHandled = food ? food.handled : null;

    state.choices.push(choice);
    if(newAfterglow){
      if(!Array.isArray(state.afterglows)) state.afterglows = [];
      state.afterglows.push(newAfterglow);
    }

    /* 更新 recentCopyIds — 同时记录 Primary 和 Life Prompt */
    Store.pushRecentCopyId(state, copyResponse.primaryId);
    if(copyResponse.lifePromptId){
      Store.pushRecentCopyId(state, copyResponse.lifePromptId);
    }

    /* 标记食品已处理 */
    if(food) food.handled = true;

    /* 保存 — 失败时完整回滚（Choice + Afterglow + recentCopyIds + Food） */
    var saveOk = DB.save(state);
    if(!saveOk){
      state.choices.length = savedChoicesLength;
      if(state.afterglows && state.afterglows.length > savedAfterglowsLength){
        state.afterglows.length = savedAfterglowsLength;
      }
      if(state.userPreferences){
        state.userPreferences.recentCopyIds = savedRecentCopyIds;
      }
      if(food) food.handled = savedFoodHandled;
      ritualCompleted = false;
      dragging = false;
      toast('未能保存，本次选择尚未完成。');
      /* 方案 A：回到 Begin 未开始状态 */
      beginBtn.classList.remove('morphing');
      beginBtn.style.display = '';
      esCopy.style.display = '';
      esComplete.classList.remove('active');
      slideTrack.classList.remove('active');
      slideHandle.style.display = 'none';
      slideHandle.tabIndex = -1;
      slideFill.style.width = '0%';
      slideHandle.style.left = '0px';
      slideHandle.setAttribute('aria-valuenow', '0');
      slideHint.classList.remove('fade');
      Motion.reset();
      /* 焦点回到唯一重试控件 */
      setTimeout(function(){ beginBtn.focus(); }, 100);
      return;
    }

    /* 展示完成态 */
    esCopy.style.display='none';
    beginBtn.style.display='none';
    slideTrack.classList.remove('active');
    slideHandle.style.display='none';

    /* 使用 Motion 完成序列：超调 → 回弹 → 释放 → 安静 */
    Motion.complete({
      onDone: function(){
        /* 渲染完成文案 */
        var ecTextEl = document.getElementById('ec-text');
        var ecLifePromptEl = document.getElementById('ec-life-prompt');

        /* Primary 文案 */
        if(ecTextEl && result.primary){
          ecTextEl.textContent = result.primary.text;
        }

        /* Life Prompt 文案（0-1 条） */
        if(ecLifePromptEl){
          if(result.lifePrompt){
            ecLifePromptEl.textContent = result.lifePrompt.text;
            ecLifePromptEl.style.display = '';
          } else {
            ecLifePromptEl.textContent = '';
            ecLifePromptEl.style.display = 'none';
          }
        }

        esComplete.classList.add('active');
        requestAnimationFrame(function(){
          var ecCta = document.getElementById('ec-cta');
          if(ecCta) ecCta.focus();
        });
      }
    });

    toast('本次处理已完成');
  }

  /* 退出情绪空间（不完成仪式） */
  function exitEmotionalSpace(){
    /* 退出前取消 Motion 的 pending completion timeout，清理 lit/charged/inline transform */
    Motion.reset();
    /* 清除 ritual-interacting，下次进入时恢复呼吸 */
    esOverlay.classList.remove('ritual-interacting');
    esOverlay.classList.remove('active');
    esOverlay.setAttribute('aria-hidden','true');
    var phoneTabs = document.getElementById('phone-tabs');
    if(phoneTabs) phoneTabs.classList.remove('es-hidden');
    setTimeout(function(){
      if(lastFocusedChoiceBtn && lastFocusedChoiceBtn.focus && lastFocusedChoiceBtn.offsetParent !== null){
        lastFocusedChoiceBtn.focus();
      }
    }, 200);
  }

  /* ---------- Light Review ---------- */
  function renderReview(){
    var choices = state.choices;
    var now = Date.now();
    var thirtyDaysAgo = now - 30*24*60*60*1000;
    var recent = choices.filter(function(c){ return c.createdAt >= thirtyDaysAgo; });

    var csTotal = recent.length;
    var eveningKeep = recent.filter(function(c){
      var t = new Date(c.createdAt).getHours();
      return (t>=18 && t<24);
    }).length;
    var inWindow = recent.filter(function(c){
      var food = state.foods.find(function(f){ return f.id===c.foodId; });
      return food && (food.openedState==='已开封'||food.openedState==='刚开封');
    }).length;
    var catCount = {};
    recent.forEach(function(c){
      var food = state.foods.find(function(f){ return f.id===c.foodId; });
      if(food){ catCount[food.category] = (catCount[food.category]||0)+1; }
    });
    var topCat = Object.entries(catCount).sort(function(a,b){ return b[1]-a[1]; })[0];
    var topCatText = topCat ? topCat[0] : '—';

    var dTotal = document.getElementById('cs-total');
    if(dTotal) dTotal.textContent = csTotal;
    var dEvening = document.getElementById('cs-evening');
    if(dEvening) dEvening.textContent = eveningKeep;
    var dWindow = document.getElementById('cs-window');
    if(dWindow) dWindow.textContent = inWindow;
    var dTopcat = document.getElementById('cs-topcat');
    if(dTopcat) dTopcat.textContent = topCatText;

    var pTotal = document.getElementById('pcs-total');
    if(pTotal) pTotal.textContent = csTotal;
    var pEvening = document.getElementById('pcs-evening');
    if(pEvening) pEvening.textContent = eveningKeep;
    var pWindow = document.getElementById('pcs-window');
    if(pWindow) pWindow.textContent = inWindow;
    var pTopcat = document.getElementById('pcs-topcat');
    if(pTopcat) pTopcat.textContent = topCatText;

    if(choices.length>0){
      var earliest = choices[0].createdAt;
      var days = Math.ceil((now - earliest)/(24*60*60*1000));
      var dp = document.getElementById('cycle-period');
      if(dp) dp.textContent = '近 ' + days + ' 天';
      var pp = document.getElementById('p-cycle-period');
      if(pp) pp.textContent = '近 ' + days + ' 天';
    }

    var logEl = document.getElementById('cycle-log');
    if(logEl){
      if(choices.length===0){
        logEl.innerHTML = '<div class="log-empty">还没有记录。完成一次情绪空间仪式后，这里会出现你的选择。</div>';
      } else {
        var choiceLabels = {eat:'吃掉',drop:'完成处理',save:'保存',share:'分享分装'};
        var sorted = choices.slice().reverse();
        logEl.innerHTML = sorted.map(function(c){
          var food = state.foods.find(function(f){ return f.id===c.foodId; });
          var time = new Date(c.createdAt);
          var packLabel = PACKS[c.pack] ? PACKS[c.pack].name : '—';
          return '<div class="log-row">' +
            '<span class="lr-time">'+time.toLocaleString('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})+'</span>' +
            '<span class="lr-food">'+(food?escapeAppHtml(food.name):'已删除')+'</span>' +
            '<span class="lr-choice">'+choiceLabels[c.choiceType]+'</span>' +
            '<span style="font-family:var(--mono);font-size:10px;color:var(--ink-3)">'+packLabel+'</span></div>';
        }).join('');
      }
    }

    var pLogEl = document.getElementById('p-cycle-log');
    if(pLogEl){
      if(choices.length===0){
        pLogEl.innerHTML = '<div class="p-log-empty">还没有记录</div>';
      } else {
        var choiceLabels2 = {eat:'吃掉',drop:'完成处理',save:'保存',share:'分享分装'};
        var sorted2 = choices.slice().reverse();
        pLogEl.innerHTML = sorted2.slice(0,20).map(function(c){
          var food = state.foods.find(function(f){ return f.id===c.foodId; });
          var time = new Date(c.createdAt);
          return '<div class="p-log-row">' +
            '<div class="plr-time">'+time.toLocaleString('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})+'</div>' +
            '<div class="plr-main">'+(food?escapeAppHtml(food.name):'已删除')+'</div>' +
            '<span class="plr-tag">'+choiceLabels2[c.choiceType]+'</span></div>';
        }).join('');
      }
    }
  }

  /* ---------- 手机内回顾渲染 ---------- */
  function renderCycleMobile(){
    var choices = state.choices;
    var now = Date.now();
    var thirtyDaysAgo = now - 30*24*60*60*1000;
    var recent = choices.filter(function(c){ return c.createdAt >= thirtyDaysAgo; });

    var csTotal = recent.length;
    var eveningKeep = recent.filter(function(c){
      var t = new Date(c.createdAt).getHours();
      return (t>=18 && t<24);
    }).length;
    var inWindow = recent.filter(function(c){
      var food = state.foods.find(function(f){ return f.id===c.foodId; });
      return food && (food.openedState==='已开封'||food.openedState==='刚开封');
    }).length;
    var catCount = {};
    recent.forEach(function(c){
      var food = state.foods.find(function(f){ return f.id===c.foodId; });
      if(food){ catCount[food.category] = (catCount[food.category]||0)+1; }
    });
    var topCat = Object.entries(catCount).sort(function(a,b){ return b[1]-a[1]; })[0];
    var topCatText = topCat ? topCat[0] : '—';

    var pTotal = document.getElementById('pcs-total');
    if(pTotal) pTotal.textContent = csTotal;
    var pEvening = document.getElementById('pcs-evening');
    if(pEvening) pEvening.textContent = eveningKeep;
    var pWindow = document.getElementById('pcs-window');
    if(pWindow) pWindow.textContent = inWindow;
    var pTopcat = document.getElementById('pcs-topcat');
    if(pTopcat) pTopcat.textContent = topCatText;

    if(choices.length>0){
      var earliest = choices[0].createdAt;
      var days = Math.ceil((now - earliest)/(24*60*60*1000));
      var pp = document.getElementById('p-cycle-period');
      if(pp) pp.textContent = '近 ' + days + ' 天';
    }

    var choiceLabels = {eat:'吃掉',drop:'完成处理',save:'保存',share:'分享分装'};
    var choiceColors = {eat:'#fbbf24',drop:'#fb7185',save:'#38bdf8',share:'#14b8a6'};
    var distBar = document.getElementById('p-dist-bar');
    var distLegend = document.getElementById('p-dist-legend');
    if(distBar && distLegend){
      var counts = {eat:0,drop:0,save:0,share:0};
      recent.forEach(function(c){ if(counts[c.choiceType]!==undefined) counts[c.choiceType]++; });
      var total = recent.length || 1;
      distBar.innerHTML = Object.entries(counts).map(function(pair){
        var k = pair[0], v = pair[1];
        return '<div class="p-dist-segment" style="flex:'+v+';background:'+choiceColors[k]+';min-width:'+(v>0?'8px':'0')+'"></div>';
      }).join('');
      distLegend.innerHTML = Object.entries(counts).map(function(pair){
        var k = pair[0], v = pair[1];
        return '<div class="p-dist-item"><div class="p-dist-dot" style="background:'+choiceColors[k]+'"></div>'+choiceLabels[k]+' '+v+'</div>';
      }).join('');
    }

    var timeline = document.getElementById('p-timeline');
    if(timeline){
      if(choices.length===0){
        timeline.innerHTML = '<div class="p-log-empty">还没有记录</div>';
      } else {
        var sorted = choices.slice().reverse().slice(0,8);
        timeline.innerHTML = sorted.map(function(c){
          var food = state.foods.find(function(f){ return f.id===c.foodId; });
          var time = new Date(c.createdAt);
          return '<div class="p-tl-item">' +
            '<div class="p-tl-dot" style="background:'+(choiceColors[c.choiceType]||'#94a3b8')+'"></div>' +
            '<div class="p-tl-content">' +
            '<div class="p-tl-name">'+(food?escapeAppHtml(food.name):'已删除')+'</div>' +
            '<div class="p-tl-meta">'+choiceLabels[c.choiceType]+' · '+time.toLocaleString('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})+'</div></div></div>';
        }).join('');
      }
    }

    var feelingMap = document.getElementById('p-feeling-map');
    if(feelingMap){
      var feelingLabels = {want:'还想继续',hesitate:'有点犹豫',dont_want:'不太想要','dont-want':'不太想要',dontwant:'不太想要',waste:'不舍得浪费'};
      var feelingCounts = {};
      recent.forEach(function(c){
        if(c.feeling){
          if(!feelingCounts[c.feeling]) feelingCounts[c.feeling] = {eat:0,drop:0,save:0,share:0,total:0};
          if(feelingCounts[c.feeling][c.choiceType]!==undefined) feelingCounts[c.feeling][c.choiceType]++;
          feelingCounts[c.feeling].total++;
        }
      });
      var entries = Object.entries(feelingCounts);
      if(entries.length===0){
        feelingMap.innerHTML = '<div class="p-log-empty">还没有感受记录</div>';
      } else {
        feelingMap.innerHTML = entries.map(function(pair){
          var feeling = pair[0], data = pair[1];
          var parts = ['eat','drop','save','share'].map(function(k){
            var v = data[k];
            return v>0 ? '<span style="font-family:var(--mono);font-size:9px;color:'+choiceColors[k]+';margin-right:8px">'+choiceLabels[k]+' '+v+'</span>' : '';
          }).join('');
          return '<div style="padding:6px 0;border-bottom:1px solid var(--line)">' +
            '<div style="font-weight:600;font-size:12px;color:var(--navy)">'+(feelingLabels[feeling]||feeling)+' <span style="color:var(--navy-3);font-weight:normal;font-size:10px">('+data.total+')</span></div>' +
            '<div style="margin-top:4px">'+parts+'</div></div>';
        }).join('');
      }
    }
  }

  /* ---------- Tab Bar 逻辑 ---------- */
  var TAB_VIEWS = ['home', 'process', 'foods', 'cycle'];

  function initTabBar(){
    document.querySelectorAll('.phone-tab').forEach(function(tab){
      tab.addEventListener('click', function(){
        showView(tab.dataset.view);
      });
      tab.addEventListener('keydown', function(e){
        var idx = TAB_VIEWS.indexOf(tab.dataset.view);
        if(idx === -1) return;
        if(e.key==='ArrowRight'){
          e.preventDefault();
          var next = TAB_VIEWS[Math.min(idx + 1, TAB_VIEWS.length - 1)];
          var nextTab = document.getElementById('tab-' + next);
          if(nextTab){ showView(next); nextTab.focus(); }
        } else if(e.key==='ArrowLeft'){
          e.preventDefault();
          var prev = TAB_VIEWS[Math.max(idx - 1, 0)];
          var prevTab = document.getElementById('tab-' + prev);
          if(prevTab){ showView(prev); prevTab.focus(); }
        } else if(e.key==='Home'){
          e.preventDefault();
          var firstTab = document.getElementById('tab-' + TAB_VIEWS[0]);
          if(firstTab){ showView(TAB_VIEWS[0]); firstTab.focus(); }
        } else if(e.key==='End'){
          e.preventDefault();
          var lastTab = document.getElementById('tab-' + TAB_VIEWS[TAB_VIEWS.length - 1]);
          if(lastTab){ showView(TAB_VIEWS[TAB_VIEWS.length - 1]); lastTab.focus(); }
        }
      });
    });
  }

  /* ---------- 暴露到全局 ---------- */
  window.showView = showView;
  window.renderHome = renderHome;
  window.renderFoodList = renderFoodList;
  window.setFoodFilter = setFoodFilter;
  window.showFoodForm = showFoodForm;
  window.hideFoodForm = hideFoodForm;
  window.saveFood = saveFood;
  window.editFood = editFood;
  window.deleteFood = deleteFood;
  window.restoreFood = restoreFood;
  window.startProcess = startProcess;
  window.selectProcessFood = selectProcessFood;
  window.selectFeeling = selectFeeling;
  window.processBack = processBack;
  window.openReview = openReview;
  window.seedDemo = seedDemo;
  window.enterEmotionalSpace = enterEmotionalSpace;
  window.toast = toast;
  /* Afterglow */
  window.answerAfterglow = answerAfterglow;
  window.deferAfterglow = deferAfterglow;
  window.dismissAfterglow = dismissAfterglow;
  window.disableAfterglow = disableAfterglow;
  window.enableAfterglow = enableAfterglow;
  window.startAfterglowDemo = startAfterglowDemo;
  window.submitAfterglowDemo = submitAfterglowDemo;
  window.exitAfterglowDemo = exitAfterglowDemo;

  /* ---------- 竞赛演示模式 ---------- */
  function initCompetitionMode(){
    if(!isCompetition) return;
    var banner = document.getElementById('comp-banner');
    if(banner) banner.style.display = 'flex';
    /* 私人空间链接携带 ?competition=1 */
    var link = document.getElementById('private-space-link');
    if(link) link.href = '../app/index.html?competition=1';
    /* 重置演示 */
    var resetBtn = document.getElementById('comp-reset-btn');
    if(resetBtn){
      resetBtn.addEventListener('click', function(){
        CompetitionDemo.reset();
        state = DB.load();
        /* 清理 Demo Time 完成态内存变量，否则 renderAfterglow 会继续优先渲染 demoAfterglow */
        demoAfterglow = null;
        currentFoodId = null;
        currentChoice = null;
        currentFeeling = null;
        lastFocusedChoiceBtn = null;
        ritualCompleted = false;
        dragging = false;
        startX = 0;
        trackRect = null;
        /* 若情绪空间仍 active，退出并恢复手机 UI */
        if(esOverlay && esOverlay.classList.contains('active')){
          esOverlay.classList.remove('active');
          esOverlay.setAttribute('aria-hidden','true');
          var ptabs = document.getElementById('phone-tabs');
          if(ptabs) ptabs.classList.remove('es-hidden');
        }
        /* 清除 ritual-interacting，下次进入时恢复呼吸 */
        esOverlay.classList.remove('ritual-interacting');
        /* 取消 Motion 的 pending completion timeout，清理 lit/charged/inline transform */
        Motion.reset();
        showView('home');
        renderHome();
        renderReview();
        renderAfterglow();
        renderEchoes();
        toast('演示数据已重置');
      });
    }
    /* 退出演示并清除 */
    var exitBtn = document.getElementById('comp-exit-btn');
    if(exitBtn){
      exitBtn.addEventListener('click', function(){
        CompetitionDemo.clear();
        window.location.href = './index.html';
      });
    }
  }

  /* ---------- 初始化 ---------- */
  function init(){
    initCompetitionMode();
    var status = Store.getStatus();
    if(!status.writable){
      toast('本地数据暂时无法读取，原始数据已保护。');
    }
    migrateLegacyFoods();
    initEmotionalSpace();
    initTabBar();
    renderHome();
    renderReview();
    updateSeedBtn();

    /* Afterglow 时间刷新：window focus + visibilitychange */
    window.addEventListener('focus', function(){
      var homeEl = document.getElementById('view-home');
      if(homeEl && homeEl.classList.contains('active')){
        renderAfterglow();
        renderEchoes();
      }
    });
    document.addEventListener('visibilitychange', function(){
      if(!document.hidden){
        var homeEl = document.getElementById('view-home');
        if(homeEl && homeEl.classList.contains('active')){
          renderAfterglow();
          renderEchoes();
        }
      } else {
        /* 页面隐藏时清理单次定时器 */
        if(agRefreshTimer){
          clearTimeout(agRefreshTimer);
          agRefreshTimer = null;
        }
      }
    });
  }

  /* DOMContentLoaded 后初始化 */
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
