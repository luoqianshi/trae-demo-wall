/* ============================================================
   Drop Snacks · V6D-D Private Space
   只读本地数据视图：当前余波、已回答余波、选择时间线、同类回声、导出
   ------------------------------------------------------------
   不写 localStorage；不调用 Store.save；不使用 fetch；
   不使用 WebSocket；不分析文本语义；不修改 state。
   动态值（食品名称、responseText、Echo text、Intro text）
   一律使用 textContent / createElement / appendChild。
   ============================================================ */
(function(){
  "use strict";

  var STORAGE_KEY = "dropSnacks_v4";

  /* 竞赛模式：读取 sessionStorage 隔离的演示数据 */
  var CompetitionDemo = window.DropSnacksCompetitionDemo;
  var isCompetition = !!(CompetitionDemo && CompetitionDemo.isActive());

  function expHref(path){
    return isCompetition ? path + '?competition=1' : path;
  }

  var CHOICE_LABELS = {eat:'吃掉',drop:'完成处理',save:'保存',share:'分享分装'};
  var FEELING_LABELS = {
    want:'还想继续', hesitate:'有点犹豫',
    dont_want:'不太想要', 'dont-want':'不太想要', dontwant:'不太想要',
    waste:'不舍得浪费', tired:'累了', reward:'犒赏自己'
  };

  /* ---------- DOM 工具（安全创建） ---------- */
  function el(tag, opts){
    opts = opts || {};
    var node = document.createElement(tag);
    if(opts.className) node.className = opts.className;
    if(opts.text != null) node.textContent = opts.text;
    if(opts.href != null) node.href = opts.href;
    if(opts.id != null) node.id = opts.id;
    return node;
  }

  function clearNode(node){
    while(node && node.firstChild) node.removeChild(node.firstChild);
  }

  /* ---------- 时间格式化 ---------- */
  function pad(n){ return n < 10 ? '0' + n : '' + n; }

  function formatTime(ts){
    if(!ts || typeof ts !== 'number') return '—';
    var d = new Date(ts);
    if(isNaN(d.getTime())) return '—';
    return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+' '+pad(d.getHours())+':'+pad(d.getMinutes());
  }

  /* ---------- 数据查询（只读） ---------- */
  function findFood(state, foodId){
    if(!foodId || !Array.isArray(state.foods)) return null;
    for(var i=0;i<state.foods.length;i++){
      if(state.foods[i] && state.foods[i].id === foodId) return state.foods[i];
    }
    return null;
  }

  function getFoodName(state, foodId, snapshot){
    var food = findFood(state, foodId);
    if(food && !food.deleted && food.name) return food.name;
    if(snapshot && snapshot.name) return snapshot.name;
    return '已删除食品';
  }

  function findAfterglowForChoice(state, choice){
    if(!Array.isArray(state.afterglows)) return null;
    if(choice.afterglowId){
      for(var i=0;i<state.afterglows.length;i++){
        if(state.afterglows[i] && state.afterglows[i].id === choice.afterglowId) return state.afterglows[i];
      }
    }
    if(choice.id){
      for(var j=0;j<state.afterglows.length;j++){
        var ag = state.afterglows[j];
        if(ag && ag.choiceId === choice.id) return ag;
      }
    }
    return null;
  }

  function getChoiceTypeForAfterglow(state, ag){
    if(ag.contextSnapshot && ag.contextSnapshot.choiceType) return ag.contextSnapshot.choiceType;
    if(ag.choiceId && Array.isArray(state.choices)){
      for(var i=0;i<state.choices.length;i++){
        var c = state.choices[i];
        if(c && c.id === ag.choiceId && c.choiceType) return c.choiceType;
      }
    }
    return null;
  }

  function choiceLabel(t){ return t ? (CHOICE_LABELS[t] || '—') : '—'; }
  function feelingLabel(f){ return f ? (FEELING_LABELS[f] || '—') : '—'; }

  /* ---------- 渲染：当前余波（最多一条） ---------- */
  function renderCurrent(state, now){
    var host = document.getElementById('ps-current');
    if(!host) return;
    clearNode(host);

    host.appendChild(el('h2',{className:'ps-section-title', text:'当前余波'}));

    /* afterglowEnabled=false：尊重用户偏好，不展示待回应余波 */
    if(state && state.userPreferences && state.userPreferences.afterglowEnabled === false){
      var closed = el('div',{className:'private-empty'});
      closed.appendChild(el('p',{text:'余波回访已关闭。'}));
      closed.appendChild(el('p',{className:'ps-hint', text:'已回答的余波仍保留在下方；待回应项目暂不展示。'}));
      closed.appendChild(el('a',{className:'ps-link', href:expHref('../experience/index.html'), text:'返回当前体验重新开启'}));
      host.appendChild(closed);
      return;
    }

    var eng = window.DropSnacksAfterglowEngine;
    var next = eng ? eng.getNextAfterglow(state, now) : null;

    if(!next){
      var empty = el('div',{className:'private-empty'});
      empty.appendChild(el('p',{text:'目前没有等待回应的余波。'}));
      empty.appendChild(el('p',{className:'ps-hint', text:'完成一次选择后，一小时后会在这里出现可以回应的余波。'}));
      host.appendChild(empty);
      return;
    }

    var ag = next.__pendingHint ? next.afterglow : next;
    var isPending = !!next.__pendingHint;
    var foodName = getFoodName(state, ag.foodId, ag.foodSnapshot);
    var promptText = (eng && ag.promptId) ? (eng.getPromptText(ag.promptId) || '') : '';
    var statusText = isPending ? '一小时以后' : '可以回应';
    var timeText = isPending ? ('约 ' + formatTime(ag.availableAt) + ' 可回应') : '现在可以回应';

    var card = el('div',{className:'ag-focus-card'});
    var head = el('div',{className:'ag-focus-head'});
    head.appendChild(el('span',{className:'ag-focus-food', text:foodName}));
    head.appendChild(el('span',{className:'ag-focus-status ' + (isPending?'is-pending':'is-available'), text:statusText}));
    card.appendChild(head);
    if(promptText) card.appendChild(el('p',{className:'ag-focus-prompt', text:promptText}));
    card.appendChild(el('p',{className:'ag-focus-time', text:timeText}));
    card.appendChild(el('a',{className:'ps-link', href:expHref('../experience/index.html'), text:'回到当前体验回应'}));

    host.appendChild(card);
  }

  /* ---------- 渲染：已回答余波（最近 10 条） ---------- */
  function renderAnswered(state, now){
    var host = document.getElementById('ps-answered');
    if(!host) return;
    clearNode(host);

    host.appendChild(el('h2',{className:'ps-section-title', text:'已回答余波'}));

    var answered = [];
    if(Array.isArray(state.afterglows)){
      for(var i=0;i<state.afterglows.length;i++){
        if(state.afterglows[i] && state.afterglows[i].status === 'answered') answered.push(state.afterglows[i]);
      }
    }
    if(answered.length === 0){
      var empty = el('div',{className:'private-empty'});
      empty.appendChild(el('p',{text:'还没有已回答的余波。'}));
      host.appendChild(empty);
      return;
    }

    answered.sort(function(a,b){ return (b.answeredAt||0) - (a.answeredAt||0); });
    var top = answered.slice(0, 10);

    var list = el('div',{className:'ag-history-list'});
    for(var j=0;j<top.length;j++){
      var item = top[j];
      var card = el('div',{className:'ag-history-card'});
      var head = el('div',{className:'ag-history-head'});
      head.appendChild(el('span',{className:'ag-history-food', text:getFoodName(state, item.foodId, item.foodSnapshot)}));
      head.appendChild(el('span',{className:'ag-history-choice', text:choiceLabel(getChoiceTypeForAfterglow(state, item))}));
      card.appendChild(head);
      if(item.responseText) card.appendChild(el('p',{className:'ag-history-response', text:item.responseText}));
      card.appendChild(el('div',{className:'ag-history-time', text:formatTime(item.answeredAt)}));
      list.appendChild(card);
    }
    host.appendChild(list);
    host.appendChild(el('p',{className:'ps-count', text:'显示最近 ' + top.length + ' 条。'}));
  }

  /* ---------- 渲染：选择时间线（最近 12 条） ---------- */
  function renderTimeline(state, now){
    var host = document.getElementById('ps-timeline');
    if(!host) return;
    clearNode(host);

    host.appendChild(el('h2',{className:'ps-section-title', text:'选择时间线'}));

    var choices = [];
    if(Array.isArray(state.choices)){
      for(var i=0;i<state.choices.length;i++){
        if(state.choices[i]) choices.push(state.choices[i]);
      }
    }
    if(choices.length === 0){
      var empty = el('div',{className:'private-empty'});
      empty.appendChild(el('p',{text:'还没有选择记录。'}));
      host.appendChild(empty);
      return;
    }

    choices.sort(function(a,b){ return (b.createdAt||0) - (a.createdAt||0); });
    var top = choices.slice(0, 12);

    var list = el('div',{className:'timeline-list'});
    for(var j=0;j<top.length;j++){
      var c = top[j];
      var foodName = getFoodName(state, c.foodId, null);
      if(foodName === '已删除食品'){
        var ag = findAfterglowForChoice(state, c);
        if(ag && ag.foodSnapshot && ag.foodSnapshot.name) foodName = ag.foodSnapshot.name;
      }
      var row = el('div',{className:'timeline-row'});
      row.appendChild(el('span',{className:'tl-food', text:foodName}));
      row.appendChild(el('span',{className:'tl-choice', text:choiceLabel(c.choiceType)}));
      row.appendChild(el('span',{className:'tl-feeling', text:feelingLabel(c.feeling)}));
      row.appendChild(el('span',{className:'tl-time', text:formatTime(c.createdAt)}));
      list.appendChild(row);
    }
    host.appendChild(list);
    host.appendChild(el('p',{className:'ps-count', text:'显示最近 ' + top.length + ' 条。'}));
  }

  /* ---------- 渲染：同类回声 ---------- */
  function renderEchoes(state, now){
    var host = document.getElementById('ps-echoes');
    if(!host) return;
    clearNode(host);

    host.appendChild(el('h2',{className:'ps-section-title', text:'同类回声'}));

    var echoEng = window.DropSnacksEchoEngine;
    if(!echoEng){
      var engEmpty = el('div',{className:'private-empty'});
      engEmpty.appendChild(el('p',{text:'审核示例回声暂时不可用。'}));
      engEmpty.appendChild(el('p',{className:'ps-hint', text:'你的回答仍保存在此浏览器中。'}));
      host.appendChild(engEmpty);
      return;
    }

    var latest = echoEng.getLatestAnsweredAfterglow(state);
    if(!latest){
      var empty = el('div',{className:'private-empty'});
      empty.appendChild(el('p',{text:'你还没有回答过余波。'}));
      empty.appendChild(el('p',{className:'ps-hint', text:'先在体验里回答一次余波，这里会出现三条经过审核的同类回声。'}));
      host.appendChild(empty);
      return;
    }

    var intro = echoEng.selectIntro(latest);
    var echoes = echoEng.selectEchoes(latest, state, 3);

    /* 安全降级：只有 Intro 有效 + 恰好 3 条结构完整才渲染完整 Echoes */
    var echoesOk = echoes.length === 3 && echoes.every(function(r){
      return r && r.entry && r.entry.text && r.matchLabel;
    });

    if(!intro || !intro.text || !echoesOk){
      var degraded = el('div',{className:'private-empty'});
      degraded.appendChild(el('p',{text:'审核示例回声暂时不可用。'}));
      degraded.appendChild(el('p',{className:'ps-hint', text:'你的回答仍保存在此浏览器中。'}));
      host.appendChild(degraded);
      return;
    }

    if(intro.text){
      host.appendChild(el('p',{className:'echo-intro', text:intro.text}));
    }

    /* 自己的回答先显示 */
    var mine = el('div',{className:'echo-mine'});
    mine.appendChild(el('div',{className:'echo-mine-label', text:'你的回答'}));
    mine.appendChild(el('div',{className:'echo-mine-food', text:getFoodName(state, latest.foodId, latest.foodSnapshot)}));
    if(latest.responseText) mine.appendChild(el('p',{className:'echo-mine-text', text:latest.responseText}));
    host.appendChild(mine);

    var list = el('div',{className:'echo-list'});
    for(var i=0;i<echoes.length;i++){
      var item = el('div',{className:'echo-item'});
      item.appendChild(el('p',{className:'echo-text', text:echoes[i].entry.text}));
      item.appendChild(el('div',{className:'echo-meta', text:echoes[i].matchLabel}));
      list.appendChild(item);
    }
    host.appendChild(list);

    host.appendChild(el('p',{className:'echo-source', text:'以上三条是经过审核的本地匿名经验示例，不是真实社区数据，不涉及点赞、排名或人数。'}));
  }

  /* ---------- 渲染：数据与信任 ---------- */
  function renderDataTrust(state){
    var host = document.getElementById('ps-data');
    if(!host) return;
    clearNode(host);

    host.appendChild(el('h2',{className:'ps-section-title', text:'数据与信任'}));
    host.appendChild(el('p',{className:'ps-note', text:'导出文件只在你的设备上生成。不上传，不联网，不修改本地记录。'}));

    var btn = el('button',{className:'ps-export-btn', text:'导出本地数据'});
    btn.type = 'button';
    btn.addEventListener('click', function(){ exportData(state); });
    host.appendChild(btn);

    var boundary = el('ul',{className:'ps-boundary-list'});
    var storageDesc = isCompetition
      ? '竞赛演示数据保存在 sessionStorage，键名 dropSnacks_v6_competition_demo，关闭标签页后清除。'
      : '数据仅保存在此浏览器的 localStorage，键名 dropSnacks_v4。';
    boundary.appendChild(el('li',{text:storageDesc}));
    boundary.appendChild(el('li',{text:'Schema 版本为 1，未升级。'}));
    boundary.appendChild(el('li',{text:'不实现导入、清空或破坏性删除。'}));
    boundary.appendChild(el('li',{text:'账号、云端同步、远程控制尚未实现。'}));
    host.appendChild(boundary);
  }

  /* ---------- 导出本地数据 ---------- */
  function exportData(state){
    try{
      var payload;
      var fname;
      var d = new Date();
      if(isCompetition){
        payload = CompetitionDemo.getExportMeta(state);
        payload.exportVersion = 1;
        payload.exportedAt = d.toISOString();
        fname = 'drop-snacks-competition-demo-'+d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+'.json';
      } else {
        payload = {
          exportVersion: 1,
          exportedAt: d.toISOString(),
          storageKey: STORAGE_KEY,
          schemaVersion: 1,
          data: state
        };
        fname = 'drop-snacks-export-'+d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+'.json';
      }
      var json = JSON.stringify(payload, null, 2);
      var blob = new Blob([json], {type:'application/json'});
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = fname;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function(){ URL.revokeObjectURL(url); }, 1500);
    }catch(e){
      console.error('[PrivateSpace] 导出失败:', e);
    }
  }

  /* ---------- 竞赛演示 Banner ---------- */
  function renderCompetitionBanner(){
    var intro = document.querySelector('.private-intro');
    if(!intro) return;
    var banner = el('div',{className:'ps-comp-banner'});
    var body = el('div',{className:'ps-comp-banner-body'});
    body.appendChild(el('div',{className:'ps-comp-banner-label', text:'COMPETITION DEMO'}));
    body.appendChild(el('div',{className:'ps-comp-banner-sub', text:'当前为隔离的竞赛演示记录'}));
    banner.appendChild(body);
    var actions = el('div',{className:'ps-comp-banner-actions'});
    var back = el('a',{className:'ps-comp-banner-btn', href:expHref('../experience/index.html'), text:'返回演示体验'});
    actions.appendChild(back);
    var reset = el('button',{className:'ps-comp-banner-btn', text:'重置演示'});
    reset.type = 'button';
    reset.addEventListener('click', function(){
      CompetitionDemo.reset();
      window.location.reload();
    });
    actions.appendChild(reset);
    var exit = el('button',{className:'ps-comp-banner-btn ps-comp-banner-btn--exit', text:'退出演示并清除'});
    exit.type = 'button';
    exit.addEventListener('click', function(){
      CompetitionDemo.clear();
      window.location.href = '../experience/index.html';
    });
    actions.appendChild(exit);
    banner.appendChild(actions);
    intro.parentNode.insertBefore(banner, intro);
  }

  function fixCompetitionHeaderLinks(){
    var links = document.querySelectorAll('.ps-header-links a');
    for(var i=0;i<links.length;i++){
      var href = links[i].getAttribute('href');
      if(href && href.indexOf('../experience/index.html') === 0 && href.indexOf('competition=1') === -1){
        links[i].setAttribute('href', href + '?competition=1');
      }
    }
  }

  /* ---------- 主入口 ---------- */
  function init(){
    var store = window.DropSnacksStore;
    if(!store){
      var host = document.getElementById('ps-current');
      if(host){ clearNode(host); host.appendChild(el('div',{className:'private-error', text:'数据层不可用。'})); }
      return;
    }
    /* 竞赛模式：读取 CompetitionDemo.load()；普通模式：读取 Store.load() */
    var state = isCompetition ? CompetitionDemo.load() : store.load();
    var now = Date.now();

    if(isCompetition){
      renderCompetitionBanner();
      fixCompetitionHeaderLinks();
    }

    renderCurrent(state, now);
    renderAnswered(state, now);
    renderTimeline(state, now);
    renderEchoes(state, now);
    renderDataTrust(state);
  }

  if(document.readyState !== 'loading'){
    init();
  }else{
    document.addEventListener('DOMContentLoaded', init);
  }
})();
