/* 双树心境 · 互动 Demo (v3)
 * 庄园养成 + 时间池互助 + 情绪喂养宠物人格 + 跨终端 Agent
 */
(function () {
  var state = {
    joy: 0, courage: 0, grit: 0,
    petStage: 0,
    month: 1,
    manor: [],
    harvestedApples: 0,
    memory: 0,
    worries: [],
    happies: [],
    pool: [],
    agentLog: [],
    activeDevice: '手机',
    deviceUnlocked: ['手机'],
    personality: {
      温柔: 0, 勇敢: 0, 自律: 0, 好奇: 0, 松弛: 0, 创造: 0
    },
    appleSpots: [[110,90],[150,70],[195,75],[225,95],[85,130],[130,145],[180,130],[220,150],[105,175],[170,175],[210,185],[140,105],[195,115],[135,175],[240,130]],
    flowerSpots: [[110,90],[150,70],[195,75],[225,95],[85,130],[130,145],[180,130],[220,150],[105,175],[170,175],[210,185],[140,105],[195,115],[135,175],[240,130]]
  };

  var STAGE_NAMES = ['🥚 孵化中', '🌱 萌芽期 · 情绪镜子', '🌿 幼年期 · 计划管家', '✨ 成熟期 · 心灵教练', '◐ Agent 期 · 理想的你'];
  var STAGE_BG = ['rgba(246,200,115,0.25)','rgba(243,164,181,0.22)','rgba(136,184,154,0.22)','rgba(184,164,212,0.28)','rgba(58,51,41,0.12)'];
  var STAGE_COLOR = ['#a3782b','#b85c75','#4f7d63','#6f568f','#3a3329'];
  var devices = ['手机', '平板', '电脑', '车机', '家用机器人'];

  var petLines = {
    welcome: [
      '嗨～我会把你的烦恼和开心都变成养分。你喂养的不是我，而是那个更会爱自己的你。',
      '先种下今天的一颗苹果或一朵花吧，庄园会慢慢长出来。'
    ],
    worry: [
      '我收到了这颗酸苹果。它先不急着变甜，我们一起看看它从哪里来。',
      '你把它写清楚的那一刻，它就不再只是压在心里的东西了。'
    ],
    happy: [
      '这朵花很重要，它会让我学会你真正喜欢的生活。',
      '小确幸已收进我的人格记忆里，我会越来越懂你的光。'
    ],
    resolve: [
      '青苹果变甜了。你不是没有办法，你是在慢慢长出经验。',
      '这颗红苹果会被收进庄园，成为你以后面对类似事情的底气。'
    ],
    task: [
      '完成任务啦。行动不是为了惩罚自己，而是在给未来的你铺路。',
      '这颗毅力星会让我更会帮你安排生活，也会让你更相信自己。'
    ]
  };

  var $ = function (id) { return document.getElementById(id); };
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[c];
    });
  }
  function setPet(text) {
    var el = $('petSpeech');
    if (!el) return;
    el.textContent = text;
    el.style.opacity = 0.45;
    setTimeout(function () { el.style.transition = 'opacity .35s ease'; el.style.opacity = 1; }, 30);
  }
  function popText(text, color) {
    var stage = $('stage');
    if (!stage) return;
    var s = document.createElement('div');
    s.className = 'star-pop';
    s.textContent = text;
    s.style.color = color || '#f6c873';
    s.style.fontWeight = '700';
    s.style.left = (34 + Math.random() * 58) + '%';
    s.style.top = (55 + Math.random() * 20) + '%';
    stage.appendChild(s);
    setTimeout(function () { s.remove(); }, 1200);
  }
  function addLog(text) {
    state.agentLog.unshift(text);
    state.agentLog = state.agentLog.slice(0, 8);
  }
  function minuteKey(dt) {
    if (!dt) return '刚刚';
    return String(dt).replace('T', ' ');
  }
  function feedTrait(kind) {
    var map = {
      '学业节奏': '自律', '家庭沟通': '温柔', '同伴关系': '温柔',
      '职场压力': '勇敢', '未来迷茫': '好奇', '生活秩序': '自律',
      '小事喜悦': '松弛', '自我突破': '勇敢', '收获成长': '创造',
      '被他人善待': '温柔', '完成新事情': '创造'
    };
    var t = map[kind] || '温柔';
    state.personality[t] += 1;
  }
  function checkStage() {
    var old = state.petStage;
    var s = 0;
    if (state.joy >= 3 && state.courage >= 1) s = 1;
    if (s >= 1 && state.grit >= 3 && state.memory >= 4) s = 2;
    if (s >= 2 && state.courage >= 5 && state.memory >= 8) s = 3;
    if (s >= 3 && state.manor.length >= 3 && state.memory >= 14) s = 4;
    state.petStage = s;
    if (s !== old) {
      var msg = [
        '',
        '🌱 宠物进入萌芽期：它开始识别你的高频情绪词，像一面温柔的情绪镜子。',
        '🌿 宠物进入幼年期：它会把你的行动偏好变成轻量计划，帮你少想一点繁杂的事。',
        '✨ 宠物进入成熟期：它会基于你的旧模式，提醒你尝试新的选择。',
        '◐ 宠物进入 Agent 期：它成为你的专属成长终端，可跨设备延续同一套人格记忆。'
      ][s];
      addLog(msg);
      setPet(msg);
    }
  }
  function unlockDevices() {
    var count = Math.min(devices.length, 1 + Math.floor(state.memory / 5));
    state.deviceUnlocked = devices.slice(0, count);
    if (state.deviceUnlocked.indexOf(state.activeDevice) === -1) state.activeDevice = state.deviceUnlocked[0];
  }
  function updateBar() {
    $('joyCount').textContent = state.joy;
    $('courageCount').textContent = state.courage;
    $('gritCount').textContent = state.grit;
    $('appleGreen').textContent = state.worries.filter(function (w) { return !w.resolved; }).length;
    $('appleRed').textContent = state.worries.filter(function (w) { return w.resolved; }).length;
    $('flowerCount').textContent = state.happies.length;
    $('monthCount').textContent = state.month + '月';
    $('harvestCount').textContent = state.harvestedApples;
    $('memoryCount').textContent = state.memory;
    $('manorLevel').textContent = 'Lv.' + (1 + Math.floor(state.manor.length / 2));
    $('agentDevice').textContent = state.activeDevice;
    var stageEl = $('petStage');
    stageEl.textContent = STAGE_NAMES[state.petStage];
    stageEl.style.background = STAGE_BG[state.petStage];
    stageEl.style.color = STAGE_COLOR[state.petStage];
  }

  function renderApples() {
    var layer = $('appleLayer'); if (!layer) return;
    layer.innerHTML = '';
    var ns = 'http://www.w3.org/2000/svg';
    state.worries.forEach(function (w, i) {
      var spot = state.appleSpots[i % state.appleSpots.length];
      var x = spot[0] + Math.floor(i / state.appleSpots.length) * 6, y = spot[1];
      var g = document.createElementNS(ns, 'g');
      g.setAttribute('transform', 'translate(' + x + ',' + y + ')');
      g.style.cursor = 'pointer';
      var leaf = document.createElementNS(ns, 'path');
      leaf.setAttribute('d', 'M0 -10 Q4 -14 8 -10 Q4 -7 0 -10 Z'); leaf.setAttribute('fill', '#7a9b5b');
      var stem = document.createElementNS(ns, 'rect');
      stem.setAttribute('x', -1); stem.setAttribute('y', -10); stem.setAttribute('width', 2); stem.setAttribute('height', 5); stem.setAttribute('fill', '#7a4f2e');
      var apple = document.createElementNS(ns, 'circle');
      apple.setAttribute('r', 7); apple.setAttribute('fill', w.resolved ? '#e07a5f' : '#a8c98a'); apple.setAttribute('stroke', w.resolved ? '#b85c40' : '#7a9b5b'); apple.setAttribute('stroke-width', 1.2);
      var shine = document.createElementNS(ns, 'ellipse');
      shine.setAttribute('cx', -2); shine.setAttribute('cy', -2); shine.setAttribute('rx', 1.5); shine.setAttribute('ry', 1); shine.setAttribute('fill', 'rgba(255,255,255,0.7)');
      g.appendChild(leaf); g.appendChild(stem); g.appendChild(apple); g.appendChild(shine);
      g.addEventListener('mouseenter', function () { apple.setAttribute('r', 8.5); });
      g.addEventListener('mouseleave', function () { apple.setAttribute('r', 7); });
      g.addEventListener('click', function () { resolveWorry(w); });
      layer.appendChild(g);
    });
  }
  function renderFlowers() {
    var layer = $('flowerLayer'); if (!layer) return;
    layer.innerHTML = '';
    var ns = 'http://www.w3.org/2000/svg';
    state.happies.forEach(function (h, i) {
      var spot = state.flowerSpots[i % state.flowerSpots.length];
      var x = spot[0] + Math.floor(i / state.flowerSpots.length) * 6, y = spot[1];
      var g = document.createElementNS(ns, 'g');
      g.setAttribute('transform', 'translate(' + x + ',' + y + ')');
      for (var p = 0; p < 5; p++) {
        var petal = document.createElementNS(ns, 'ellipse');
        var ang = p * 72 * Math.PI / 180;
        petal.setAttribute('cx', Math.cos(ang) * 4.5); petal.setAttribute('cy', Math.sin(ang) * 4.5);
        petal.setAttribute('rx', 4); petal.setAttribute('ry', 3); petal.setAttribute('fill', '#fda4b8'); petal.setAttribute('opacity', 0.92);
        g.appendChild(petal);
      }
      var center = document.createElementNS(ns, 'circle'); center.setAttribute('r', 2.5); center.setAttribute('fill', '#f6c873'); g.appendChild(center);
      layer.appendChild(g);
    });
  }
  function renderLogs() {
    var box = $('worryLog'); box.innerHTML = '';
    state.worries.slice().reverse().forEach(function (w) {
      var item = document.createElement('div'); item.className = 'item' + (w.resolved ? ' resolved' : '');
      var text = document.createElement('div'); text.className = 'text';
      text.innerHTML = '<div>' + escapeHtml(w.what) + '</div><div class="meta">' + escapeHtml(w.when) + ' · ' + escapeHtml(w.where) + ' · ' + escapeHtml(w.category) + ' · ' + escapeHtml(w.feel) + '</div>';
      item.appendChild(text);
      if (!w.resolved) {
        var btn = document.createElement('button'); btn.textContent = '想开了 +勇气';
        btn.addEventListener('click', function () { resolveWorry(w); });
        item.appendChild(btn);
      }
      box.appendChild(item);
    });
    var happyBox = $('happyLog'); happyBox.innerHTML = '';
    state.happies.slice().reverse().forEach(function (h) {
      var item = document.createElement('div'); item.className = 'item';
      item.innerHTML = '<div class="text"><div>' + escapeHtml(h.text) + '</div><div class="meta">' + escapeHtml(h.type) + ' · ' + escapeHtml(h.time) + '</div></div>';
      happyBox.appendChild(item);
    });
  }
  function renderManor() {
    var grid = $('manorGrid'); grid.innerHTML = '';
    for (var i = 1; i <= 12; i++) {
      var found = state.manor.filter(function (m) { return m.month === i; })[0];
      var div = document.createElement('div'); div.className = 'month-tree' + (state.month === i ? ' active' : '');
      if (found) {
        div.innerHTML = '<span class="tree-icon">' + (found.balance >= 0 ? '🌳' : '🍂') + '</span><span>' + i + '月 · ' + found.apples + '果/' + found.flowers + '花</span>';
      } else {
        div.innerHTML = '<span class="tree-icon">·</span><span>' + i + '月空地</span>';
      }
      grid.appendChild(div);
    }
  }
  function renderPool() {
    var box = $('timePool');
    if (!state.pool.length) {
      box.innerHTML = '<div class="pool-item">还没有进入时间池。记录烦心事后，点击「进入时间池互助」，会模拟同一时间段的匿名支持。</div>';
      return;
    }
    box.innerHTML = state.pool.slice(0, 6).map(function (p) {
      return '<div class="pool-item"><strong>' + escapeHtml(p.time) + '</strong> · ' + escapeHtml(p.text) + '</div>';
    }).join('');
  }
  function renderAgent() {
    var traits = Object.keys(state.personality).sort(function (a,b) { return state.personality[b] - state.personality[a]; });
    $('traitCloud').innerHTML = traits.map(function (t) { return '<span>' + t + ' ' + state.personality[t] + '</span>'; }).join('');
    $('deviceRow').innerHTML = state.deviceUnlocked.map(function (d) {
      return '<button class="' + (d === state.activeDevice ? 'active' : '') + '" data-device="' + d + '">' + d + '</button>';
    }).join('');
    Array.prototype.forEach.call($('deviceRow').querySelectorAll('button'), function (btn) {
      btn.addEventListener('click', function () {
        state.activeDevice = btn.getAttribute('data-device');
        addLog('已切换到「' + state.activeDevice + '」：同一个宠物人格继续接管你的计划、提醒与陪伴。');
        renderAll();
      });
    });
    $('agentLog').innerHTML = (state.agentLog.length ? state.agentLog : ['宠物人格还在学习。多记录故事、收获果实、完成任务，它会更像那个理想的你。'])
      .map(function (x) { return '<div class="agent-item">' + escapeHtml(x) + '</div>'; }).join('');
  }
  function renderAll() {
    unlockDevices();
    updateBar();
    renderApples();
    renderFlowers();
    renderLogs();
    renderManor();
    renderPool();
    renderAgent();
  }

  function resolveWorry(w) {
    if (w.resolved) return;
    if (!confirm('这颗青苹果代表「' + w.what.slice(0, 16) + '…」。要把它标记为已经想开 / 顺利解决，并收获 1 颗勇气星吗？')) return;
    w.resolved = true;
    state.courage += 1;
    state.memory += 1;
    state.harvestedApples += 1;
    feedTrait(w.category);
    addLog('宠物吸收了一颗红苹果：它学到你面对「' + w.category + '」时需要的支持方式。');
    checkStage();
    setPet(pick(petLines.resolve));
    popText('🍎 +1 勇气星', '#88b89a');
    renderAll();
  }

  $('addWorry').addEventListener('click', function () {
    var when = minuteKey($('worryWhen').value);
    var where = $('worryWhere').value.trim();
    var category = $('worryCategory').value;
    var what = $('worryWhat').value.trim();
    var feel = $('worryFeel').value.trim();
    if (!where || !feel || what.length < 6) {
      alert('请完整填写地点、具体烦恼和感受词。写清楚，宠物才能学会真正理解你。');
      return;
    }
    var w = { when: when, where: where, category: category, what: what, feel: feel, resolved: false };
    state.worries.push(w);
    state.pool.unshift({ time: when, text: '同一时间池出现了一个「' + category + '」烦恼：有人正在等待一句温和的支持。' });
    state.memory += 1;
    feedTrait(category);
    addLog('已记录酸苹果：' + feel + '。宠物开始学习你的高频情绪词。');
    $('worryWhere').value = ''; $('worryWhat').value = ''; $('worryFeel').value = '';
    checkStage(); renderAll(); setPet(pick(petLines.worry));
  });

  $('addHappy').addEventListener('click', function () {
    var type = $('happyType').value;
    var text = $('happyText').value.trim();
    if (text.length < 4) { alert('写一句你今天的暖心瞬间吧，至少 4 个字。'); return; }
    var time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    state.happies.push({ type: type, text: text, time: time });
    state.joy += 1; state.memory += 1;
    feedTrait(type);
    addLog('宠物吸收了一朵开心花：它更懂你喜欢怎样的生活。');
    $('happyText').value = '';
    checkStage(); renderAll(); setPet(pick(petLines.happy)); popText('🌸 +1 美好星', '#f3a4b5');
  });

  $('btnTask').addEventListener('click', function () {
    var tasks = ['散步 15 分钟', '学一个 10 分钟小爱好', '做 3 分钟拉伸', '整理书桌一角', '投篮或踢球 15 分钟', '写 100 字随笔', '做一次 4-7-8 呼吸', '睡前 20 分钟不刷手机'];
    var t = pick(tasks);
    if (!confirm('宠物给你的今日小目标：' + t + '\\n完成后获得 1 颗毅力星，并让宠物活力上升。')) return;
    state.grit += 1; state.memory += 1; state.personality.自律 += 1;
    addLog('完成行动任务：' + t + '。宠物更会为你制定松弛但有效的计划。');
    checkStage(); renderAll(); setPet(pick(petLines.task)); popText('🌿 +1 毅力星', '#b8a4d4');
  });

  $('btnPool').addEventListener('click', function () {
    if (!state.worries.length) { alert('先记录一颗青苹果，才能进入对应的时间池。'); return; }
    var last = state.worries[state.worries.length - 1];
    var supports = ['有人回复：我也有过类似时刻，先把今晚过好就可以。', '有人递来一盏灯：你不是一个人，我们都在慢慢学会处理。', '有人分享方法：把能控制的事列出来，只做第一件。'];
    state.pool.unshift({ time: last.when, text: pick(supports) });
    state.joy += 1; state.personality.温柔 += 1;
    addLog('你在时间池给出 / 收到支持，获得 1 颗美好星。社区不是诉苦墙，而是互相点灯。');
    renderAll(); setPet('你参与了一次温柔互助。每一次支持他人，也是在教会我如何支持你。'); popText('🪷 +1 美好星', '#f3a4b5');
  });

  $('btnHarvest').addEventListener('click', function () {
    if (!state.worries.length && !state.happies.length) { alert('本月还没有树可以收获，先记录一点故事吧。'); return; }
    var red = state.worries.filter(function (w) { return w.resolved; }).length;
    var green = state.worries.length - red;
    var flowers = state.happies.length;
    state.manor = state.manor.filter(function (m) { return m.month !== state.month; });
    state.manor.push({ month: state.month, apples: red + green, red: red, green: green, flowers: flowers, balance: flowers - green });
    state.memory += red + flowers;
    addLog(state.month + '月双树已收进庄园：' + red + '颗红苹果、' + green + '颗酸苹果、' + flowers + '朵花，全部成为宠物人格素材。');
    state.month = state.month >= 12 ? 1 : state.month + 1;
    state.worries = []; state.happies = [];
    checkStage(); renderAll(); setPet('本月双树已收获。庄园多了一棵月树，而我也更接近那个理想的你。'); popText('🏡 月树入园', '#88b89a');
  });

  $('btnAi').addEventListener('click', function () {
    if (state.joy < 2 || state.courage < 1) {
      alert('深度疏导需要 2 颗美好星 + 1 颗勇气星。先记录开心瞬间、化解青苹果，或进入时间池互助吧。');
      return;
    }
    if (!state.worries.length) { alert('当前没有可分析的烦恼。先种下一颗青苹果。'); return; }
    state.joy -= 2; state.courage -= 1; state.personality.勇敢 += 1;
    var last = state.worries[state.worries.length - 1];
    var msg = '我读到你的「' + last.category + '」里有「' + last.feel + '」。建议：① 把事实和想象分开写；② 今天只完成一个 15 分钟小行动；③ 若持续很久，向可信任的大人、老师或专业机构寻求帮助。';
    addLog('深度疏导完成：已根据最近青苹果生成温和解决方案。');
    renderAll(); setPet(msg);
  });

  $('btnFeed').addEventListener('click', function () {
    if (state.joy + state.courage + state.grit < 1) { alert('还没有可喂养的星星。先记录或完成任务吧。'); return; }
    var top = Object.keys(state.personality).sort(function (a,b) { return state.personality[b] - state.personality[a]; })[0];
    state.memory += 1;
    addLog('情绪喂养完成：宠物人格更偏向「' + top + '」。它不是另一个工具，而是你关注自己的证明。');
    checkStage(); renderAll(); setPet('我吃到的不是情绪垃圾，而是你的故事。它们会让我长成更懂你的那一个你。'); popText('✦ 人格+1', '#f6c873');
  });

  $('btnAgent').addEventListener('click', function () {
    var top = Object.keys(state.personality).sort(function (a,b) { return state.personality[b] - state.personality[a]; })[0];
    var suggestions = {
      温柔: '今天减少自责，安排 20 分钟安静整理，把难题拆成一句可以开口的话。',
      勇敢: '把最纠结的事写成「我真实想要的是……」，先练习表达，不急着改变结果。',
      自律: '今日计划：15 分钟运动 + 25 分钟专注 + 10 分钟复盘，避免过度紧绷。',
      好奇: '给未来迷茫留一个探索任务：查一个新方向、问一个人、试一个小技能。',
      松弛: '保留 30 分钟完全不追赶的时间，让身体知道今天是安全的。',
      创造: '把一个想法写成草图，不追求完美，只保留创造性的部分。'
    };
    var msg = '「' + state.activeDevice + '」Agent 规划：' + suggestions[top];
    addLog(msg);
    renderAll(); setPet(msg);
  });

  $('btnSummary').addEventListener('click', function () {
    var top = Object.keys(state.personality).sort(function (a,b) { return state.personality[b] - state.personality[a]; }).slice(0,3).join('、');
    alert('【心境庄园成长报告】\\n\\n当前月树：' + state.month + '月\\n庄园树木：' + state.manor.length + ' 棵\\n已收获苹果：' + state.harvestedApples + ' 颗\\n人格记忆：' + state.memory + ' 片\\n宠物阶段：' + STAGE_NAMES[state.petStage] + '\\n主要人格：' + top + '\\n可用终端：' + state.deviceUnlocked.join('、') + '\\n\\n结论：你正在把烦恼与开心都转化为理解自己的能力。你喂养的宠物，最终是在提醒你更爱自己。');
  });

  $('btnReset').addEventListener('click', function () {
    if (!confirm('确定重置整个心境庄园吗？')) return;
    state.joy = state.courage = state.grit = 0;
    state.petStage = 0; state.month = 1; state.manor = []; state.harvestedApples = 0; state.memory = 0;
    state.worries = []; state.happies = []; state.pool = []; state.agentLog = []; state.activeDevice = '手机'; state.deviceUnlocked = ['手机'];
    state.personality = { 温柔: 0, 勇敢: 0, 自律: 0, 好奇: 0, 松弛: 0, 创造: 0 };
    renderAll(); setPet('庄园已重新开始。每一次重新开始，也是一种照顾自己。');
  });

  setPet(pick(petLines.welcome));
  addLog('心境庄园已开启：记录越真实，宠物越像理想的你。');
  renderAll();
})();