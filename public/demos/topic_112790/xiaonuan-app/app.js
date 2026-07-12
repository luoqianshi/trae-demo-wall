/* 小暖同学 · 青少年心理健康 AI 树洞 —— 前端应用逻辑
   说明：纯前端演示版，所有数据仅保存在浏览器 localStorage，不上传服务器。 */
(function () {
  'use strict';

  /* ---------- 视图切换 ---------- */
  var navItems = document.querySelectorAll('.nav-item');
  var views = document.querySelectorAll('.view');
  navItems.forEach(function (item) {
    item.addEventListener('click', function () {
      var target = item.getAttribute('data-view');
      navItems.forEach(function (n) { n.classList.remove('active'); });
      item.classList.add('active');
      views.forEach(function (v) { v.classList.remove('active'); });
      document.getElementById('view-' + target).classList.add('active');
      if (target === 'diary') { renderDiary(); }
    });
  });

  /* ================= 聊天引擎 ================= */
  var chatBody = document.getElementById('chatBody');
  var chatInput = document.getElementById('chatInput');
  var sendBtn = document.getElementById('sendBtn');
  var moodBar = document.getElementById('moodBar');
  var stressBar = document.getElementById('stressBar');
  var moodTxt = document.getElementById('moodTxt');
  var stressTxt = document.getElementById('stressTxt');
  var riskBadge = document.getElementById('riskBadge');

  // 情绪状态：mood 越低越消极；stress 越高压力越大
  var state = { mood: 60, stress: 25 };

  // 关键词规则库
  var rules = [
    {
      key: '危机',
      words: ['不想活', '活不下去', '自杀', '轻生', '结束生命', '不想活了', '想死', '消失', '割', '自残', '伤害自己', '没有意义', '解脱'],
      mood: -40, stress: +35, crisis: true,
      reply: '听到你这样说，我很心疼，也很担心你。你愿意把这些告诉我，说明你其实还在努力撑着，这非常了不起。💛 但有些痛苦太沉重了，需要更专业的人来陪你一起扛。请一定拨打 24 小时心理援助热线 **12356**，或者青少年服务台 **12355**，那边有受过训练的人在等你。你现在身边有没有一个可以信任的人？'
    },
    {
      key: '学业',
      words: ['学习', '压力', '考试', '成绩', '作业', '排名', '学不进', '努力', '成绩差', '补课', '高考', '中考'],
      mood: -12, stress: +25,
      reply: '学习上的压力真的会让人喘不过气。你能坚持到现在，其实已经很不容易了。成绩只是你的一部分，绝不是你的全部。可以跟我说说，是哪一科、或者哪件事让你觉得最累吗？我们一点点来。'
    },
    {
      key: '人际',
      words: ['孤单', '没朋友', '孤独', '没人懂', '被孤立', '合群', '朋友', '社交', '同学', '被排挤', '尴尬'],
      mood: -14, stress: +18,
      reply: '觉得没有人真正懂自己，是一种很深的孤单。谢谢你愿意让我走近一点。渴望被理解，说明你内心是温暖而真诚的。愿意说说最近发生了什么，让你有这种感觉吗？我一直都在。'
    },
    {
      key: '家庭',
      words: ['爸妈', '父母', '家里', '吵架', '家庭', '离婚', '妈妈', '爸爸', '打我', '骂我', '不理解'],
      mood: -14, stress: +22,
      reply: '家本该是最安心的地方，当它变成压力的来源，真的会特别难受。你的感受完全是合理的，不是你的错。可以和我讲讲刚刚发生了什么吗？在这里，你不用假装懂事。'
    },
    {
      key: '低落',
      words: ['低落', '难过', '抑郁', '想哭', '没意思', '提不起劲', '累', '空虚', '烦', '焦虑', '害怕', '失眠', '睡不着'],
      mood: -18, stress: +20,
      reply: '这种提不起劲、心里闷闷的感觉，一定持续了一段时间了吧。能说出来，就已经是在照顾自己了。💛 你不需要马上好起来，我们可以慢慢来。最近有没有哪个瞬间，让你稍微轻松了一点点？'
    },
    {
      key: '积极',
      words: ['开心', '高兴', '好起来', '谢谢', '好多了', '轻松', '快乐', '希望', '加油'],
      mood: +20, stress: -18,
      reply: '听到你这么说，我也觉得很温暖！😊 能感受到你身上的力量。记得把这种好心情记在情绪日记里，以后回头看会很珍贵。还有什么想和我分享的吗？'
    }
  ];

  var defaultReplies = [
    '我在听，你可以慢慢说，不用着急。',
    '谢谢你愿意告诉我这些。可以再多说一点吗？我想更懂你。',
    '嗯，我感受到了。此刻的你，最希望被怎样对待呢？',
    '不管你说什么，我都不会评判你。继续说吧，我一直在。'
  ];

  function analyze(text) {
    var matched = null;
    for (var i = 0; i < rules.length; i++) {
      var r = rules[i];
      for (var j = 0; j < r.words.length; j++) {
        if (text.indexOf(r.words[j]) !== -1) { matched = r; break; }
      }
      if (matched) break;
    }
    return matched;
  }

  function clamp(v) { return Math.max(0, Math.min(100, v)); }

  function updateGauges() {
    // mood 高 = 情绪好；显示条用“消极程度”反向不直观，这里直接用积极度
    var moodPct = clamp(state.mood);
    var stressPct = clamp(state.stress);
    moodBar.style.width = moodPct + '%';
    stressBar.style.width = stressPct + '%';

    if (moodPct >= 60) { moodTxt.textContent = '平稳'; moodBar.style.background = 'var(--green)'; }
    else if (moodPct >= 35) { moodTxt.textContent = '有些低落'; moodBar.style.background = '#e0a040'; }
    else { moodTxt.textContent = '很低落'; moodBar.style.background = 'var(--warn)'; }

    if (stressPct < 40) { stressTxt.textContent = '较低'; }
    else if (stressPct < 70) { stressTxt.textContent = '偏高'; }
    else { stressTxt.textContent = '很高'; }

    // 风险评估
    var risk = 'low';
    if (moodPct < 25 || stressPct > 78) risk = 'mid';
    if (state.crisis) risk = 'high';
    riskBadge.className = 'risk-badge' + (risk === 'mid' ? ' mid' : risk === 'high' ? ' high' : '');
    riskBadge.textContent = '风险评估：' + (risk === 'high' ? '高 · 已启动关怀' : risk === 'mid' ? '中 · 请多关注自己' : '低');
  }

  function addMsg(text, cls) {
    var d = document.createElement('div');
    d.className = 'msg ' + cls;
    d.innerHTML = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    chatBody.appendChild(d);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function showTyping() {
    var t = document.createElement('div');
    t.className = 'typing';
    t.id = 'typing';
    t.innerHTML = '<span></span><span></span><span></span>';
    chatBody.appendChild(t);
    chatBody.scrollTop = chatBody.scrollHeight;
  }
  function hideTyping() {
    var t = document.getElementById('typing');
    if (t) t.remove();
  }

  function crisisMessage() {
    addMsg('⚠️ 小暖检测到你可能正处在很危险的情绪里，已为你准备紧急支持：12356（24h 心理援助）· 12355（青少年服务台）。请一定联系他们，你值得被好好接住。', 'sys');
  }

  function botReply(userText) {
    var matched = analyze(userText);
    if (matched) {
      state.mood = clamp(state.mood + matched.mood);
      state.stress = clamp(state.stress + matched.stress);
      if (matched.crisis) state.crisis = true;
    }
    updateGauges();

    showTyping();
    setTimeout(function () {
      hideTyping();
      var reply = matched ? matched.reply : defaultReplies[Math.floor(Math.random() * defaultReplies.length)];
      addMsg(reply, 'bot');
      if (matched && matched.crisis) { crisisMessage(); }
    }, 900 + Math.random() * 600);
  }

  function sendMessage(text) {
    text = (text || chatInput.value).trim();
    if (!text) return;
    addMsg(text, 'me');
    chatInput.value = '';
    botReply(text);
  }

  sendBtn.addEventListener('click', function () { sendMessage(); });
  chatInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') sendMessage(); });
  document.getElementById('chatQuick').addEventListener('click', function (e) {
    var chip = e.target.closest('.chip');
    if (chip) sendMessage(chip.getAttribute('data-q'));
  });

  // 开场白
  addMsg('嗨，我是小暖同学 🌱 这里是只属于你的树洞。你说的每句话我都会认真听，也永远不会告诉别人。今天，想和我聊点什么呢？', 'bot');

  /* ================= 情绪日记 ================= */
  var DIARY_KEY = 'xiaonuan_diary';
  var moodPicker = document.getElementById('moodPicker');
  var selectedMood = null;

  moodPicker.addEventListener('click', function (e) {
    var opt = e.target.closest('.mood-opt');
    if (!opt) return;
    moodPicker.querySelectorAll('.mood-opt').forEach(function (o) { o.classList.remove('sel'); });
    opt.classList.add('sel');
    selectedMood = { v: parseInt(opt.getAttribute('data-v'), 10), l: opt.getAttribute('data-l') };
  });

  function getDiary() {
    try { return JSON.parse(localStorage.getItem(DIARY_KEY) || '[]'); }
    catch (e) { return []; }
  }
  function setDiary(list) { localStorage.setItem(DIARY_KEY, JSON.stringify(list)); }

  document.getElementById('saveDiary').addEventListener('click', function () {
    var txt = document.getElementById('diaryText').value.trim();
    if (!selectedMood) { alert('先选一个此刻的心情吧 🙂'); return; }
    if (!txt) { alert('写点什么再保存哦~'); return; }
    var list = getDiary();
    var now = new Date();
    list.unshift({
      v: selectedMood.v, l: selectedMood.l, txt: txt,
      date: now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()) + ' ' + pad(now.getHours()) + ':' + pad(now.getMinutes())
    });
    setDiary(list);
    document.getElementById('diaryText').value = '';
    moodPicker.querySelectorAll('.mood-opt').forEach(function (o) { o.classList.remove('sel'); });
    selectedMood = null;
    renderDiary();
  });

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  var emojiMap = { 5: '😄', 4: '🙂', 3: '😐', 2: '😔', 1: '😢' };

  function renderDiary() {
    var list = getDiary();
    var listEl = document.getElementById('diaryList');
    var trendEl = document.getElementById('trend');

    // 趋势图（最近 7 条，按时间正序）
    var recent = list.slice(0, 7).reverse();
    trendEl.innerHTML = '';
    if (recent.length === 0) {
      trendEl.innerHTML = '<p class="empty" style="width:100%;">还没有记录，写下第一篇日记吧 ✍️</p>';
    } else {
      recent.forEach(function (item) {
        var col = document.createElement('div');
        col.className = 'col';
        var h = 20 + item.v * 18;
        col.innerHTML = '<i style="height:' + h + 'px;"></i><div class="d">' + emojiMap[item.v] + '</div>';
        trendEl.appendChild(col);
      });
    }

    // 列表
    if (list.length === 0) {
      listEl.innerHTML = '<div class="card card-pad"><p class="empty">这里会保存你写下的每一份心情 💛</p></div>';
      return;
    }
    listEl.innerHTML = '';
    list.forEach(function (item, idx) {
      var el = document.createElement('div');
      el.className = 'diary-entry';
      el.innerHTML =
        '<div class="top"><span>' + emojiMap[item.v] + ' <strong>' + item.l + '</strong></span>' +
        '<span class="date">' + item.date + ' <span class="del" data-i="' + idx + '">删除</span></span></div>' +
        '<div class="txt">' + escapeHtml(item.txt) + '</div>';
      listEl.appendChild(el);
    });
    listEl.querySelectorAll('.del').forEach(function (d) {
      d.addEventListener('click', function () {
        var i = parseInt(d.getAttribute('data-i'), 10);
        var l = getDiary();
        l.splice(i, 1);
        setDiary(l);
        renderDiary();
      });
    });
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  renderDiary();

  /* ================= 心理科普 ================= */
  var topics = [
    {
      ic: '🌧️', t: '什么是情绪低落？', d: '区分“不开心”和需要关注的信号',
      body: '<p>每个人都会有心情不好的时候，这很正常。但如果这种低落<strong>持续两周以上</strong>，并且影响到你的睡眠、食欲、学习和兴趣，那可能就不只是普通的难过了。</p><p>常见的信号包括：</p><ul><li>对以前喜欢的事情失去兴趣</li><li>总是感到疲惫、没力气</li><li>容易自责，觉得自己没用</li><li>睡不着或睡太多</li></ul><p>如果你有这些感觉，<strong>请记住这不是你的错，也不是“矫情”</strong>。及时和信任的人聊聊，或寻求专业帮助，是很勇敢的选择。</p>'
    },
    {
      ic: '😮‍💨', t: '如何应对考试焦虑', d: '把压力变成动力的小技巧',
      body: '<p>考试前紧张是身体在帮你集中注意力，适度的紧张其实是有益的。但过度焦虑会让人发挥失常。试试这些方法：</p><ul><li><strong>拆解目标：</strong>把“考好”拆成一个个小任务，完成一项就打个勾</li><li><strong>深呼吸：</strong>紧张时做 4-7-8 呼吸（去“正念放松”试试）</li><li><strong>接纳情绪：</strong>告诉自己“紧张是正常的”，而不是对抗它</li><li><strong>充足睡眠：</strong>熬夜复习不如睡好觉，大脑需要休息才能记牢</li></ul><p>记住：一次考试不能定义你的人生。💛</p>'
    },
    {
      ic: '🤝', t: '为什么会觉得孤单', d: '孤独感背后的心理学',
      body: '<p>孤单不等于“没朋友”，很多人身处人群中依然觉得孤独。这是因为孤独感来自于<strong>“不被理解”和“缺乏深度连接”</strong>，而不是身边人数的多少。</p><p>青春期本来就是自我意识觉醒的阶段，你开始更在意“别人怎么看我”，也更渴望被真正读懂——这很正常。</p><p>可以试着：主动分享一点真实的自己；从一次真诚的对话开始；或者先做自己的好朋友，善待自己。连接，往往从一个小小的勇敢开始。</p>'
    },
    {
      ic: '🏠', t: '和父母沟通的方法', d: '当家里让你感到累的时候',
      body: '<p>和父母有矛盾，几乎是每个青少年都会经历的。你们其实都爱着对方，只是表达和理解的方式不同步。</p><ul><li><strong>用“我”开头：</strong>说“我感到很委屈”比“你们总是不理解我”更容易被听见</li><li><strong>选对时机：</strong>避开双方都在气头上的时候</li><li><strong>先听后说：</strong>试着理解他们的担心，他们也会更愿意听你的</li></ul><p>如果家庭关系让你长期痛苦甚至受到伤害，请一定告诉学校老师或拨打 12355，你值得被保护。</p>'
    },
    {
      ic: '💪', t: '什么是心理韧性', d: '为什么有人更能扛住挫折',
      body: '<p>心理韧性（Resilience）指的是<strong>从困难中恢复过来的能力</strong>。它不是天生的，而是可以通过练习慢慢培养的。</p><p>提升韧性的方法：</p><ul><li>建立支持系统：有可以倾诉的人</li><li>培养成长型思维：把失败看成“还没成功”</li><li>照顾好身体：规律作息、运动、饮食</li><li>记录小成就：每天肯定自己一点点</li></ul><p>你已经在读这篇文章、在照顾自己的心情了——这本身就是韧性的体现。</p>'
    },
    {
      ic: '🌟', t: '如何善待自己', d: '自我关怀不是自私',
      body: '<p>很多青少年对别人很宽容，对自己却很严苛。其实，<strong>善待自己是心理健康的重要基础</strong>。</p><p>试试“自我关怀三步法”：</p><ul><li><strong>觉察：</strong>“我现在很难受”——允许自己承认</li><li><strong>共通：</strong>“很多人也会这样”——你并不孤单</li><li><strong>善意：</strong>像安慰好朋友一样安慰自己</li></ul><p>你不需要完美，也值得被爱。把对别人的温柔，也分一点给自己吧。💛</p>'
    }
  ];

  var topicGrid = document.getElementById('topicGrid');
  var article = document.getElementById('article');
  topics.forEach(function (tp, i) {
    var c = document.createElement('div');
    c.className = 'topic';
    c.innerHTML = '<div class="ic">' + tp.ic + '</div><h4>' + tp.t + '</h4><p>' + tp.d + '</p>';
    c.addEventListener('click', function () {
      article.innerHTML = '<span class="back" id="backBtn">← 返回列表</span><h3>' + tp.ic + ' ' + tp.t + '</h3>' + tp.body;
      article.classList.add('open');
      topicGrid.style.display = 'none';
      document.getElementById('backBtn').addEventListener('click', function () {
        article.classList.remove('open');
        topicGrid.style.display = '';
      });
      article.scrollIntoView({ behavior: 'smooth' });
    });
    topicGrid.appendChild(c);
  });

  /* ================= 正念呼吸 ================= */
  var circle = document.getElementById('breathCircle');
  var breathTimer = null;
  var phase = 0; // 0吸 1屏 2呼
  var phases = [
    { txt: '吸气…', dur: 4000, cls: true },
    { txt: '屏息…', dur: 7000, cls: true },
    { txt: '呼气…', dur: 8000, cls: false }
  ];

  function runBreath() {
    var p = phases[phase];
    circle.textContent = p.txt;
    if (p.cls) circle.classList.add('in'); else circle.classList.remove('in');
    breathTimer = setTimeout(function () {
      phase = (phase + 1) % phases.length;
      runBreath();
    }, p.dur);
  }

  document.getElementById('breathStart').addEventListener('click', function () {
    if (breathTimer) return;
    phase = 0;
    runBreath();
  });
  document.getElementById('breathStop').addEventListener('click', function () {
    clearTimeout(breathTimer);
    breathTimer = null;
    circle.classList.remove('in');
    circle.textContent = '做得很好 💛';
  });

  /* ================= 清除数据 ================= */
  document.getElementById('clearAll').addEventListener('click', function () {
    if (confirm('确定清除所有情绪日记记录吗？此操作无法撤销。')) {
      localStorage.removeItem(DIARY_KEY);
      renderDiary();
      alert('已清除，你的树洞干干净净 🌿');
    }
  });

  updateGauges();
})();
