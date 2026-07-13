/**
 * 体验流程控制器：渲染阶段、处理输入、推进步骤、结算
 * 依赖：LP（experience.js）
 */
(function () {
  'use strict';

  var LP = window.LP;
  if (!LP) return;

  // ===== 状态 =====
  var mode = LP.getQueryParam('mode') || 'job'; // job | startup
  var targetId = LP.getQueryParam('id') || '';
  var archive = LP.loadArchive();
  var ageMode = archive.ageMode || '11-15';
  var target = null;
  var stageIndex = 0;
  var stageState = {}; // 每步的中间状态
  var startedAt = Date.now();
  var sessionLog = { answers: [], xp: 0 };

  if (mode === 'job') {
    target = LP.findById(LP.JOBS, targetId);
  } else if (mode === 'startup') {
    target = LP.findById(LP.STARTUPS, targetId);
  }

  // ===== 初始化失败兜底 =====
  if (!target) {
    document.addEventListener('DOMContentLoaded', function () {
      var stageEl = document.getElementById('xp-stage');
      if (stageEl) {
        stageEl.innerHTML =
          '<div class="p-12 text-center">' +
            '<div class="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">' +
              '<i data-lucide="alert-triangle" class="w-8 h-8"></i>' +
            '</div>' +
            '<h3 class="text-lg font-semibold text-[var(--foreground)] mb-2">未找到体验目标</h3>' +
            '<p class="text-sm text-[var(--muted-foreground)] mb-6">请返回选择页重新选择</p>' +
            '<a href="' + (mode === 'startup' ? 'create.html' : 'explore.html') + '" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--color-primary)] text-white text-sm font-semibold hover:bg-[var(--color-primary-dark)] transition-colors">' +
              '<span>返回选择</span>' +
              '<i data-lucide="arrow-right" class="w-4 h-4"></i>' +
            '</a>' +
          '</div>';
      }
    });
    return;
  }

  // ===== DOM 引用 =====
  var $title, $subtitle, $scenarioTag, $stage, $stepper, $prev, $next, $stageHint, $ageSwitcher, $xpTotal, $restart;

  function $(id) { return document.getElementById(id); }

  // ===== 渲染：年龄切换器 =====
  function renderAgeSwitcher() {
    var buttons = $ageSwitcher.querySelectorAll('.age-tab');
    buttons.forEach(function (btn) {
      var a = btn.dataset.age;
      btn.classList.toggle('is-active', a === ageMode);
      btn.addEventListener('click', function () {
        if (ageMode === a) return;
        ageMode = a;
        archive.ageMode = a;
        try { localStorage.setItem('life_preview_archive_v1', JSON.stringify(archive)); } catch (e) {}
        renderAgeSwitcher();
        renderHeader();
        renderStage();
      });
    });
  }

  // ===== 渲染：顶部信息 =====
  function renderHeader() {
    var cfg = LP.AGE_MODES[ageMode];
    var prefix = mode === 'job' ? '就业体验 · ' : '创业体验 · ';
    $scenarioTag.textContent = prefix + cfg.label + '（' + cfg.style + '）';
    if (mode === 'job') {
      $title.textContent = target.name;
      $subtitle.textContent = target.company + ' · ' + target.industry + ' · ' + target.salary + '/月';
    } else {
      $title.textContent = '创办一家「' + target.name + '」公司';
      $subtitle.textContent = target.summary;
    }
    $xpTotal.textContent = (archive.totalXP || 0).toString();
  }

  // ===== 渲染：步骤条 =====
  function renderStepper() {
    var stages = LP.STAGES[mode];
    var html = stages.map(function (s, i) {
      var cls = 'xp-step';
      if (i < stageIndex) cls += ' is-done';
      else if (i === stageIndex) cls += ' is-active';
      return '<div class="' + cls + '">' +
        '<span class="num">' + (i < stageIndex ? '✓' : (i + 1)) + '</span>' +
        '<span class="name">' + s.name + '</span>' +
      '</div>';
    }).join('<i data-lucide="chevron-right" class="w-3.5 h-3.5 text-[var(--border)] flex-shrink-0"></i>');
    $stepper.innerHTML = html;
  }

  // ===== 渲染：当前阶段 =====
  function renderStage() {
    var stages = LP.STAGES[mode];
    if (stageIndex >= stages.length) {
      renderResult();
      return;
    }
    var stage = stages[stageIndex];
    if (mode === 'job') {
      if (stage.key === 'intro') renderJobIntro();
      else if (stage.key === 'interview') renderInterview();
      else if (stage.key === 'onboard') renderOnboard();
      else if (stage.key === 'task') renderTasks();
    } else {
      renderStartupStage(stage.key);
    }

    // 按钮状态
    $prev.disabled = stageIndex === 0;
    if (stageIndex === stages.length - 1) {
      $next.innerHTML = '<span>完成体验</span><i data-lucide="check" class="w-4 h-4"></i>';
    } else {
      $next.innerHTML = '<span>下一步</span><i data-lucide="arrow-right" class="w-4 h-4"></i>';
    }
    $stageHint.textContent = '第 ' + (stageIndex + 1) + ' 步 / 共 ' + stages.length + ' 步';

    // 刷新 lucide 图标
    if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
  }

  // ===== 就业：自我介绍 =====
  function renderJobIntro() {
    var cfg = LP.AGE_MODES[ageMode];
    if (!stageState.intro) {
      stageState.intro = { name: '', tags: [], motivation: '' };
    }
    var s = stageState.intro;
    var tagPool = ['细心', '耐心', '好奇心强', '爱表达', '逻辑好', '爱动手', '会画画', '会写代码', '朋友多', '爱运动', '爱阅读', '会弹琴'];
    var html =
      sceneHeaderHTML(target.hr.avatar, target.hr.name, target.hr.title) +
      '<div class="p-6 sm:p-8 space-y-6">' +
        '<div>' +
          '<label class="block text-sm font-semibold text-[var(--foreground)] mb-2">1. 你叫什么名字？</label>' +
          '<input id="intro-name" type="text" maxlength="20" value="' + (s.name || '') + '" placeholder="输入你的名字" class="lp-input" />' +
        '</div>' +
        '<div>' +
          '<label class="block text-sm font-semibold text-[var(--foreground)] mb-2">2. 选 3 个最像你的标签</label>' +
          '<div class="flex flex-wrap gap-2">' +
            tagPool.map(function (t) {
              return '<span class="tag-chip' + (s.tags.indexOf(t) >= 0 ? ' is-selected' : '') + '" data-tag="' + t + '">' + t + '</span>';
            }).join('') +
          '</div>' +
        '</div>' +
        '<div>' +
          '<label class="block text-sm font-semibold text-[var(--foreground)] mb-2">3. ' + cfg.questionHint + '</label>' +
          '<p class="text-xs text-[var(--muted-foreground)] mb-2">提示：' + cfg.taskHint + '</p>' +
          '<textarea id="intro-motivation" rows="3" maxlength="200" placeholder="例如：因为我对' + target.industry + '行业很感兴趣..." class="lp-input">' + (s.motivation || '') + '</textarea>' +
        '</div>' +
      '</div>';
    $stage.innerHTML = html;

    // 绑定
    $stage.querySelectorAll('.tag-chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        var t = chip.dataset.tag;
        var idx = s.tags.indexOf(t);
        if (idx >= 0) { s.tags.splice(idx, 1); chip.classList.remove('is-selected'); }
        else {
          if (s.tags.length >= 3) {
            // 替换最早的
            var old = s.tags.shift();
            $stage.querySelectorAll('.tag-chip').forEach(function (c) {
              if (c.dataset.tag === old) c.classList.remove('is-selected');
            });
          }
          s.tags.push(t);
          chip.classList.add('is-selected');
        }
      });
    });
    $stage.querySelector('#intro-name').addEventListener('input', function (e) { s.name = e.target.value; });
    $stage.querySelector('#intro-motivation').addEventListener('input', function (e) { s.motivation = e.target.value; });
  }

  function introValid() {
    var s = stageState.intro;
    if (!s) return false;
    if (!s.name || s.name.trim().length < 1) return false;
    if (!s.tags || s.tags.length < 1) return false;
    if (!s.motivation || s.motivation.trim().length < 5) return false;
    return true;
  }

  // ===== 就业：AI 面试 =====
  function renderInterview() {
    if (!stageState.interview) {
      var qs = LP.buildInterviewQuestions(target, ageMode);
      stageState.interview = { questions: qs, current: 0, history: [] };
    }
    var iv = stageState.interview;
    // 保护：如果已经完成所有问题，渲染完成页面
    if (iv.current >= iv.questions.length) {
      renderInterviewDone();
      return;
    }
    var cfg = LP.AGE_MODES[ageMode];
    var isHR = iv.current < 2;
    var speaker = isHR ? target.hr : target.manager;
    var currentQ = iv.questions[iv.current];

    var chatHTML = iv.history.map(function (m) {
      var who = m.from === 'user' ? 'is-user' : '';
      var av = m.from === 'user' ? '🙂' : (m.from === 'hr' ? target.hr.avatar : target.manager.avatar);
      return '<div class="chat-bubble ' + who + '">' +
        '<div class="chat-avatar">' + av + '</div>' +
        '<div class="chat-text">' + escapeHTML(m.text) + '</div>' +
      '</div>';
    }).join('');

    var html =
      sceneHeaderHTML(speaker.avatar, speaker.name + '（' + (isHR ? target.hr.title : target.manager.title) + '）', target.company) +
      '<div class="p-6 sm:p-8 space-y-4">' +
        '<div class="chat-area" id="chat-area">' + chatHTML +
          '<div class="chat-bubble" id="current-question">' +
            '<div class="chat-avatar">' + speaker.avatar + '</div>' +
            '<div class="chat-text">' + escapeHTML(currentQ.text) + '</div>' +
          '</div>' +
        '</div>' +
        '<div>' +
          '<label class="block text-xs text-[var(--muted-foreground)] mb-2">你的回答 <span class="opacity-60">（' + cfg.questionHint + '）</span></label>' +
          '<div class="flex flex-col sm:flex-row gap-2">' +
            '<textarea id="iv-input" rows="2" placeholder="在这里输入..." class="lp-input flex-1"></textarea>' +
            '<button id="iv-send" class="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg bg-[var(--color-primary)] text-white text-sm font-semibold hover:bg-[var(--color-primary-dark)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">' +
              '<i data-lucide="send" class="w-4 h-4"></i>' +
              '<span>发送</span>' +
            '</button>' +
          '</div>' +
          '<div class="mt-2 text-xs text-[var(--muted-foreground)]">第 ' + (iv.current + 1) + ' / ' + iv.questions.length + ' 题</div>' +
        '</div>' +
      '</div>';
    $stage.innerHTML = html;

    scrollChatToBottom();

    var $input = $stage.querySelector('#iv-input');
    var $send = $stage.querySelector('#iv-send');

    // 防止重复发送锁
    if (!iv.hasOwnProperty('_isSending')) iv._isSending = false;

    function showTyping() {
      var area = $stage.querySelector('#chat-area');
      if (!area) return;
      var el = document.createElement('div');
      el.id = 'typing-indicator';
      el.className = 'chat-typing';
      el.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span><span style="margin-left:4px">对方正在输入…</span>';
      area.appendChild(el);
      scrollChatToBottom();
    }
    function hideTyping() {
      var el = $stage.querySelector('#typing-indicator');
      if (el) el.remove();
    }

    function send() {
      if (iv._isSending) return;
      var text = $input.value.trim();
      if (!text) return;
      iv._isSending = true;
      $input.value = '';          // 立即清空，防止重复点击发送同样内容
      $send.disabled = true;      // 禁用按钮
      $input.disabled = true;     // 禁用输入框

      // 先把用户消息追加到界面，体验更即时
      iv.history.push({ from: 'user', text: text });
      var area = $stage.querySelector('#chat-area');
      if (area) {
        var userBubble = document.createElement('div');
        userBubble.className = 'chat-bubble is-user';
        userBubble.innerHTML = '<div class="chat-avatar">🙂</div><div class="chat-text">' + escapeHTML(text) + '</div>';
        area.appendChild(userBubble);
        scrollChatToBottom();
      }

      showTyping();

      // 模拟网络延迟，让“正在输入”动画可见
      setTimeout(function () {
        hideTyping();
        var reply = LP.generateReply(text, isHR ? 'hr' : 'manager', ageMode);
        iv.history.push({ from: isHR ? 'hr' : 'manager', text: reply });

        // 给回答打分
        var score = scoreAnswer(text, ageMode);
        sessionLog.answers.push({ stage: 'interview', q: currentQ.text, a: text, score: score });
        sessionLog.xp += score;

        iv.current++;
        iv._isSending = false;

        if (iv.current >= iv.questions.length) {
          renderInterviewDone();
          return;
        }
        renderInterview();
      }, 600 + Math.random() * 400);
    }
    $send.addEventListener('click', send);
    $input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        send();
      }
    });
    $input.focus();
  }

  function scoreAnswer(text, ageMode) {
    var len = text.length;
    var pos = /喜欢|热爱|因为|所以|想|希望|可以|例如|比如/.test(text);
    if (ageMode === '6-10') {
      if (len >= 4) return 8;
      return 4;
    }
    if (ageMode === '11-15') {
      if (len >= 15 && pos) return 15;
      if (len >= 10) return 10;
      return 5;
    }
    if (len >= 30 && pos) return 20;
    if (len >= 15) return 12;
    return 5;
  }

  function renderInterviewDone() {
    var html =
      sceneHeaderHTML('🎉', '面试完成', target.company) +
      '<div class="p-6 sm:p-8 text-center space-y-4">' +
        '<div class="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-3xl">🎊</div>' +
        '<h3 class="text-xl font-bold text-[var(--foreground)]">恭喜！你收到了 offer</h3>' +
        '<p class="text-sm text-[var(--muted-foreground)] max-w-md mx-auto">基于你的面试表现，' + target.company + ' 的 HR 已经为你准备好了入职材料。点击下一步进入你的第一个工作日。</p>' +
        '<div class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-100 text-amber-700 text-sm font-medium">' +
          '<i data-lucide="file-signature" class="w-4 h-4"></i>' +
          '<span>已自动生成电子合同 · 入职日期：明天</span>' +
        '</div>' +
      '</div>';
    $stage.innerHTML = html;
    if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
  }

  // ===== 就业：入职日 =====
  function renderOnboard() {
    var html =
      sceneHeaderHTML(target.manager.avatar, target.manager.name + '（直属上级）', '报到：' + target.office) +
      '<div class="p-6 sm:p-8 space-y-5">' +
        '<div class="bg-amber-50 border border-amber-200 rounded-xl p-4">' +
          '<p class="text-sm text-[var(--foreground)] leading-relaxed"><strong>欢迎加入 ' + target.company + '！</strong>我是你的直属上级 ' + target.manager.name + '。今天是你入职的第一天，让我们开始熟悉环境吧。</p>' +
        '</div>' +
        '<div>' +
          '<h4 class="text-sm font-semibold text-[var(--foreground)] mb-3">📋 今天你需要完成：</h4>' +
          '<div class="space-y-2">' +
            [
              { t: '签署入职文件 & 领取办公设备', d: '由 HR 引导完成' },
              { t: '认识团队成员（至少 3 位）', d: '主动打招呼 & 互换联系方式' },
              { t: '了解公司业务与产品', d: target.industry + ' 行业入门资料' },
              { t: '与上级 1v1 沟通', d: '明确第一个月的工作目标' },
            ].map(function (item, i) {
              return '<div class="task-card" data-task-idx="' + i + '">' +
                '<div class="check"><i data-lucide="check" class="w-3.5 h-3.5"></i></div>' +
                '<div class="flex-1">' +
                  '<div class="text-sm font-semibold text-[var(--foreground)]">' + item.t + '</div>' +
                  '<div class="text-xs text-[var(--muted-foreground)] mt-0.5">' + item.d + '</div>' +
                '</div>' +
              '</div>';
            }).join('') +
          '</div>' +
        '</div>' +
        '<div>' +
          '<label class="block text-sm font-semibold text-[var(--foreground)] mb-2">📝 写下你入职第一天的感受</label>' +
          '<textarea id="onboard-note" rows="3" maxlength="300" placeholder="今天最让你印象深刻的事是..." class="lp-input"></textarea>' +
        '</div>' +
      '</div>';
    $stage.innerHTML = html;

    if (!stageState.onboard) stageState.onboard = { done: [], note: '' };
    var ob = stageState.onboard;
    ob.done.forEach(function (idx) {
      var card = $stage.querySelector('[data-task-idx="' + idx + '"]');
      if (card) card.classList.add('is-done');
    });
    if (ob.note) $stage.querySelector('#onboard-note').value = ob.note;

    $stage.querySelectorAll('.task-card').forEach(function (card) {
      card.addEventListener('click', function () {
        var idx = parseInt(card.dataset.taskIdx, 10);
        if (ob.done.indexOf(idx) >= 0) {
          ob.done = ob.done.filter(function (i) { return i !== idx; });
          card.classList.remove('is-done');
        } else {
          ob.done.push(idx);
          card.classList.add('is-done');
          sessionLog.xp += 5;
        }
      });
    });
    $stage.querySelector('#onboard-note').addEventListener('input', function (e) { ob.note = e.target.value; });
  }

  function onboardValid() {
    return stageState.onboard && stageState.onboard.done.length >= 3;
  }

  // ===== 就业：工作任务 =====
  function renderTasks() {
    if (!stageState.tasks) {
      stageState.tasks = { list: LP.buildJobTasks(target, ageMode), picked: [] };
    }
    var ts = stageState.tasks;
    var html =
      sceneHeaderHTML(target.manager.avatar, '今日工作台', target.company) +
      '<div class="p-6 sm:p-8 space-y-5">' +
        '<div class="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">' +
          '<p class="text-sm text-[var(--foreground)] leading-relaxed"><strong>本周工作挑战</strong>：完成 3 个不同类型的任务，每个任务选择你倾向的处理方式。AI 会基于你的选择给出评估。</p>' +
        '</div>' +
        '<div class="space-y-4">' +
          ts.list.map(function (task, i) {
            return '<div class="bg-white border border-[var(--border)] rounded-xl p-5">' +
              '<div class="flex items-start justify-between gap-3 mb-3">' +
                '<div>' +
                  '<div class="text-sm font-bold text-[var(--foreground)]">任务 ' + (i + 1) + '：' + task.title + '</div>' +
                  '<div class="text-xs text-[var(--muted-foreground)] mt-1">' + task.desc + '</div>' +
                '</div>' +
                (ts.picked[i] !== undefined
                  ? '<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ' + (ts.picked[i].score >= 12 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700') + '">' +
                      '<i data-lucide="' + (ts.picked[i].score >= 12 ? 'trending-up' : 'minus') + '" class="w-3 h-3"></i>' +
                      '<span>+' + ts.picked[i].score + ' XP</span>' +
                    '</span>'
                  : '') +
              '</div>' +
              '<div class="choice-grid">' +
                task.options.map(function (opt, j) {
                  var picked = ts.picked[i] && ts.picked[i].idx === j;
                  return '<button class="choice-option' + (picked ? ' is-selected' : '') + '" data-task="' + i + '" data-opt="' + j + '">' +
                    '<span class="label">' + opt.label + '</span>' +
                    (picked ? '<span class="hint">' + getOptionHint(i, j) + '</span>' : '') +
                  '</button>';
                }).join('') +
              '</div>' +
            '</div>';
          }).join('') +
        '</div>' +
      '</div>';
    $stage.innerHTML = html;

    $stage.querySelectorAll('.choice-option').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var i = parseInt(btn.dataset.task, 10);
        var j = parseInt(btn.dataset.opt, 10);
        if (ts.picked[i] && ts.picked[i].idx === j) {
          // 取消选择
          ts.picked[i] = undefined;
        } else {
          var opt = ts.list[i].options[j];
          if (ts.picked[i]) sessionLog.xp -= ts.picked[i].score;
          ts.picked[i] = { idx: j, score: opt.score };
          sessionLog.xp += opt.score;
        }
        renderTasks();
      });
    });
  }

  function getOptionHint(taskIdx, optIdx) {
    var hints = {
      0: ['', '', ''], // 留给具体任务
      1: ['', '', ''],
      2: ['', '', ''],
    };
    return hints[taskIdx] ? hints[taskIdx][optIdx] : '';
  }

  function tasksValid() {
    return stageState.tasks && stageState.tasks.picked.filter(function (x) { return x !== undefined; }).length >= 2;
  }

  // ===== 创业：单阶段渲染 =====
  function renderStartupStage(stageKey) {
    if (!stageState.startup) {
      stageState.startup = { stages: LP.buildStartupStages(target, ageMode), decisions: {} };
    }
    var ss = stageState.startup;
    var stgIdx = LP.STAGES.startup.findIndex(function (s) { return s.key === stageKey; });
    var stg = ss.stages[stgIdx];
    var userStats = computeStartupStats(ss.decisions);

    var sceneIcon = stageKey === 'market' ? '📊' : stageKey === 'product' ? '📦' : stageKey === 'team' ? '👥' : stageKey === 'funding' ? '💰' : '⚠️';
    var html =
      '<div class="scene-header">' +
        '<div class="scene-avatar">' + sceneIcon + '</div>' +
        '<div class="scene-info">' +
          '<div class="name">阶段 ' + (stgIdx + 1) + '：' + stg.title + '</div>' +
          '<div class="meta">' + target.product + ' · ' + target.name + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="p-6 sm:p-8 space-y-5">' +
        // 数据面板（融资阶段前显示）
        (stageKey !== 'funding' && stageKey !== 'crisis' ? statRowHTML(userStats) : '') +
        '<div class="bg-amber-50 border border-amber-200 rounded-xl p-4">' +
          '<p class="text-sm text-[var(--foreground)] leading-relaxed">' + stg.scene + '</p>' +
        '</div>' +
        (stageKey === 'market' && !ss.decisions.market
          ? '<div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">' +
              '<div class="bg-white border border-[var(--border)] rounded-lg p-4 text-center">' +
                '<div class="text-xs text-[var(--muted-foreground)]">市场规模</div>' +
                '<div class="mt-1 text-lg font-bold text-[var(--foreground)]">' + stg.data.tam + '</div>' +
              '</div>' +
              '<div class="bg-white border border-[var(--border)] rounded-lg p-4 text-center">' +
                '<div class="text-xs text-[var(--muted-foreground)]">年增长率</div>' +
                '<div class="mt-1 text-lg font-bold text-emerald-600">' + stg.data.growth + '</div>' +
              '</div>' +
              '<div class="bg-white border border-[var(--border)] rounded-lg p-4 text-center">' +
                '<div class="text-xs text-[var(--muted-foreground)]">竞品数量</div>' +
                '<div class="mt-1 text-lg font-bold text-[var(--foreground)]">' + stg.data.competitors + '</div>' +
              '</div>' +
            '</div>'
          : '') +
        '<div>' +
          '<label class="block text-sm font-semibold text-[var(--foreground)] mb-3">🎯 ' + stg.question + '</label>' +
          '<div class="choice-grid">' +
            stg.options.map(function (opt, j) {
              var picked = ss.decisions[stageKey] === j;
              return '<button class="choice-option' + (picked ? ' is-selected' : '') + '" data-stage="' + stageKey + '" data-opt="' + j + '">' +
                '<span class="label">' + opt.label + '</span>' +
                (picked ? '<span class="hint">已选择</span>' : '') +
              '</button>';
            }).join('') +
          '</div>' +
        '</div>' +
        (stageKey === 'crisis' ? statRowHTML(userStats) : '') +
      '</div>';
    $stage.innerHTML = html;

    $stage.querySelectorAll('.choice-option').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var k = btn.dataset.stage;
        var j = parseInt(btn.dataset.opt, 10);
        if (ss.decisions[k] === j) {
          delete ss.decisions[k];
          sessionLog.xp -= 10;
        } else {
          if (ss.decisions[k] !== undefined) sessionLog.xp -= 10;
          ss.decisions[k] = j;
          sessionLog.xp += 10;
        }
        renderStartupStage(stageKey);
      });
    });
  }

  function statRowHTML(stats) {
    return '<div class="stat-row">' +
      '<div class="stat-cell"><div class="num">' + stats.users.toFixed(1) + 'K</div><div class="label">用户增长</div></div>' +
      '<div class="stat-cell"><div class="num">' + stats.fund.toFixed(0) + 'W</div><div class="label">资金</div></div>' +
      '<div class="stat-cell"><div class="num">' + stats.team + '</div><div class="label">团队</div></div>' +
      '<div class="stat-cell"><div class="num">' + stats.share.toFixed(1) + '%</div><div class="label">市场份额</div></div>' +
    '</div>';
  }

  function computeStartupStats(decisions) {
    var users = 1.0;
    var fund = target.initialFund;
    var team = 3;
    var share = 0.5;
    // 使用已缓存的 stages，避免重新生成随机数据
    var cachedStages = stageState.startup && stageState.startup.stages ? stageState.startup.stages : LP.buildStartupStages(target, ageMode);
    LP.STAGES.startup.forEach(function (s, idx) {
      if (decisions[s.key] === undefined) return;
      var stg = cachedStages[idx];
      if (!stg) return;
      var opt = stg.options[decisions[s.key]];
      if (opt && opt.score) {
        users *= (opt.score.users || 1);
        fund *= (opt.score.fund || 1);
        if (s.key === 'team') team = 3 + decisions[s.key] + 2;
        share += (opt.score.users - 1) * 0.3;
      }
    });
    return { users: users, fund: fund, team: team, share: Math.max(share, 0.1) };
  }

  function startupStageValid(stageKey) {
    return stageState.startup && stageState.startup.decisions[stageKey] !== undefined;
  }

  // ===== 结算页 =====
  function renderResult() {
    var duration = Date.now() - startedAt;
    var stats = mode === 'startup' ? computeStartupStats(stageState.startup ? stageState.startup.decisions : {}) : null;
    var grade = sessionLog.xp >= 80 ? '优秀' : sessionLog.xp >= 50 ? '良好' : '入门';

    // 组装详情数据
    var details = null;
    if (mode === 'job') {
      details = {
        intro: stageState.intro || null,
        interviewAnswers: sessionLog.answers.filter(function (a) { return a.stage === 'interview'; }),
        onboardDone: stageState.onboard ? stageState.onboard.done.length : 0,
        tasksPicked: stageState.tasks ? stageState.tasks.picked.map(function (p) {
          return p ? { label: stageState.tasks.list[p.idx].options[p.idx] ? stageState.tasks.list[p.idx].options[p.idx].label : '', score: p.score } : null;
        }) : [],
      };
    } else {
      var ss = stageState.startup || {};
      details = {
        decisions: ss.decisions || {},
        stages: (ss.stages || []).map(function (stg, i) {
          return {
            title: stg.title,
            picked: ss.decisions && ss.decisions[stg.key] !== undefined ? stg.options[ss.decisions[stg.key]].label : null,
          };
        }),
      };
    }

    // 持久化
    var session = {
      id: Date.now().toString(36),
      type: mode,
      targetId: target.id,
      targetName: target.name,
      xp: sessionLog.xp,
      duration: duration,
      grade: grade,
      finishedAt: new Date().toISOString(),
      stats: stats,
      details: details,
    };
    archive = LP.recordSession(archive, session);

    var summaryHTML = mode === 'job'
      ? '<p class="text-sm text-[var(--muted-foreground)] max-w-md mx-auto leading-relaxed">你完成了 <strong>' + target.name + '</strong> 的完整预演。从投递到拿到 offer，再到处理日常工作挑战——这只是开始。回到首页探索更多职业，或尝试创业路线。</p>'
      : '<p class="text-sm text-[var(--muted-foreground)] max-w-md mx-auto leading-relaxed">你的 <strong>' + target.name + '</strong> 公司完成了 5 个关键阶段。最终数据：用户 ' + stats.users.toFixed(1) + 'K / 资金 ' + stats.fund.toFixed(0) + 'W / 市场份额 ' + stats.share.toFixed(1) + '%。</p>';

    var statsHTML = mode === 'job'
      ? '<div class="grid grid-cols-3 gap-3 max-w-sm mx-auto">' +
          '<div class="stat-cell"><div class="num">' + sessionLog.answers.length + '</div><div class="label">回答数</div></div>' +
          '<div class="stat-cell"><div class="num">' + LP.formatTime(duration) + '</div><div class="label">用时</div></div>' +
          '<div class="stat-cell"><div class="num">' + grade + '</div><div class="label">评级</div></div>' +
        '</div>'
      : '<div class="max-w-md mx-auto">' + statRowHTML(stats) + '</div>';

    var html =
      '<div class="result-card">' +
        '<div class="result-icon"><i data-lucide="award" class="w-10 h-10"></i></div>' +
        '<h2 class="text-2xl font-bold text-[var(--foreground)] mb-2">' + (mode === 'job' ? '体验完成！' : '创业预演完成！') + '</h2>' +
        '<p class="text-base text-[var(--color-primary)] font-semibold mb-6">+' + sessionLog.xp + ' XP · ' + grade + '</p>' +
        statsHTML +
        '<div class="mt-6">' + summaryHTML + '</div>' +
        '<div class="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">' +
          '<a href="archive.html" class="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-[var(--color-primary)] text-white text-sm font-semibold hover:bg-[var(--color-primary-dark)] transition-colors">' +
            '<i data-lucide="book-open" class="w-4 h-4"></i>' +
            '<span>查看成长档案</span>' +
          '</a>' +
          '<a href="' + (mode === 'job' ? 'explore.html' : 'create.html') + '" class="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg border border-[var(--border)] text-sm font-medium text-[var(--foreground)] hover:bg-amber-50 transition-colors">' +
            '<i data-lucide="rotate-ccw" class="w-4 h-4"></i>' +
            '<span>再试一次</span>' +
          '</a>' +
          '<a href="index.html" class="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg border border-[var(--border)] text-sm font-medium text-[var(--foreground)] hover:bg-amber-50 transition-colors">' +
            '<i data-lucide="home" class="w-4 h-4"></i>' +
            '<span>回到首页</span>' +
          '</a>' +
        '</div>' +
      '</div>';
    $stage.innerHTML = html;
    $prev.disabled = true;
    $next.disabled = true;
    $stageHint.textContent = '已完成';
    $xpTotal.textContent = archive.totalXP.toString();
    if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
  }

  // ===== 工具 =====
  function sceneHeaderHTML(avatar, name, meta) {
    return '<div class="scene-header">' +
      '<div class="scene-avatar">' + avatar + '</div>' +
      '<div class="scene-info">' +
        '<div class="name">' + escapeHTML(name) + '</div>' +
        '<div class="meta">' + escapeHTML(meta) + '</div>' +
      '</div>' +
    '</div>';
  }

  function escapeHTML(s) {
    if (!s) return '';
    return s.replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function scrollChatToBottom() {
    setTimeout(function () {
      var area = $stage.querySelector('#chat-area');
      if (area) area.scrollTop = area.scrollHeight;
    }, 50);
  }

  // ===== 步骤切换 =====
  function goNext() {
    var stages = LP.STAGES[mode];
    if (stageIndex >= stages.length) return;
    var stage = stages[stageIndex];
    // 校验
    if (mode === 'job') {
      if (stage.key === 'intro' && !introValid()) return alert('请填写完整：名字、至少 1 个标签、不少于 5 个字的自我介绍');
      if (stage.key === 'interview' && (!stageState.interview || stageState.interview.current < stageState.interview.questions.length)) return alert('请完成所有面试问题');
      if (stage.key === 'onboard' && !onboardValid()) return alert('请至少完成 3 项入职任务');
      if (stage.key === 'task' && !tasksValid()) return alert('请至少完成 2 个工作挑战');
    } else {
      if (!startupStageValid(stage.key)) return alert('请做出你的决策');
    }
    stageIndex++;
    renderStepper();
    renderStage();
    window.scrollTo({ top: 200, behavior: 'smooth' });
  }

  function goPrev() {
    if (stageIndex === 0) return;
    stageIndex--;
    renderStepper();
    renderStage();
    window.scrollTo({ top: 200, behavior: 'smooth' });
  }

  // ===== 启动 =====
  document.addEventListener('DOMContentLoaded', function () {
    $title = $('xp-title');
    $subtitle = $('xp-subtitle');
    $scenarioTag = $('xp-scenario-tag');
    $stage = $('xp-stage');
    $stepper = $('xp-stepper');
    $prev = $('xp-prev');
    $next = $('xp-next');
    $stageHint = $('xp-stage-hint');
    $ageSwitcher = $('age-switcher');
    $xpTotal = $('xp-total');
    $restart = $('xp-restart');

    renderAgeSwitcher();
    renderHeader();
    renderStepper();
    renderStage();

    $prev.addEventListener('click', goPrev);
    $next.addEventListener('click', goNext);
    $restart.addEventListener('click', function () {
      if (confirm('重新开始此体验？当前进度将清空。')) {
        stageIndex = 0;
        stageState = {};
        sessionLog = { answers: [], xp: 0 };
        startedAt = Date.now();
        renderStepper();
        renderStage();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });
})();
