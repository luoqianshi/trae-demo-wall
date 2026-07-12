// family-plan-demo/assets/charts.js
// Complete application logic for Family Growth Plan Demo

(function() {
  'use strict';

  // ============ DATA STORE ============
  var state = {
    currentWeek: 0,
    weekOffset: 0,
    activities: [],
    tokens: { balance: 50, earned: 50, spent: 0, log: [] },
    breathing: { active: false, phase: 'idle', timer: null, count: 0 },
    parentBreathing: { active: false, phase: 'idle', timer: null, count: 0 },
    hug: { active: false, timer: null },
    counting: { active: false, timer: null },
    drawColor: '#E74C3C',
    isDrawing: false
  };

  // ============ ACTIVITY COLORS ============
  var typeConfig = {
    outdoor: { label: '户外活动', icon: '🌳', css: 'act-outdoor', tag: 'tag-green' },
    reading: { label: '阅读', icon: '📚', css: 'act-reading', tag: 'tag-purple' },
    course:  { label: '课程学习', icon: '📖', css: 'act-course', tag: 'tag-blue' },
    hobby:   { label: '兴趣爱好', icon: '🎨', css: 'act-hobby', tag: 'tag-pink' },
    game:    { label: '游戏时间', icon: '🎮', css: 'act-game', tag: 'tag-orange' },
    rest:    { label: '休息', icon: '😴', css: 'act-rest', tag: 'tag-warning' }
  };

  // ============ REWARD RULES ============
  var rewardRules = [
    { id: 'r1', type: 'reward', name: '按时完成作业', tokens: 3, desc: '在规定时间内完成当天作业任务', icon: '📖' },
    { id: 'r2', type: 'reward', name: '主动收拾房间', tokens: 2, desc: '不需要提醒，自己整理玩具和房间', icon: '🧹' },
    { id: 'r3', type: 'reward', name: '阅读30分钟', tokens: 2, desc: '连续阅读30分钟以上', icon: '📚' },
    { id: 'r4', type: 'reward', name: '户外活动1小时', tokens: 3, desc: '参与户外运动或活动1小时', icon: '🌳' },
    { id: 'r5', type: 'reward', name: '帮忙做家务', tokens: 2, desc: '主动参与一项家务（洗碗/扫地/折衣服等）', icon: '🏠' },
    { id: 'r6', type: 'reward', name: '按时作息', tokens: 2, desc: '在规定时间上床睡觉', icon: '😴' },
    { id: 'p1', type: 'penalty', name: '超时使用电子产品', tokens: -5, desc: '超过约定的游戏/屏幕时间仍不肯停止', icon: '📱' },
    { id: 'p2', type: 'penalty', name: '发脾气/说脏话', tokens: -3, desc: '因不满而发脾气或使用不当语言', icon: '😠' },
    { id: 'p3', type: 'penalty', name: '拒绝完成作业', tokens: -4, desc: '在约定时间内无正当理由拒绝完成作业', icon: '✍️' },
    { id: 'p4', type: 'penalty', name: '不收拾弄乱的东西', tokens: -2, desc: '提醒后仍不收拾自己弄乱的区域', icon: '🧹' },
    { id: 'p5', type: 'penalty', name: '说谎', tokens: -5, desc: '故意隐瞒事实或说谎', icon: '🤥' }
  ];

  // ============ REWARD SHOP ============
  var shopItems = [
    { id: 's1', name: '额外30分钟游戏时间', cost: 15, icon: '🎮', desc: '周末可兑换一次' },
    { id: 's2', name: '挑选零食一次', cost: 8, icon: '🍫', desc: '在合理范围内自选' },
    { id: 's3', name: '全家电影之夜', cost: 25, icon: '🎬', desc: '选一部全家一起看的电影' },
    { id: 's4', name: '公园/游乐场之旅', cost: 20, icon: '🎢', desc: '全家外出游玩半天' },
    { id: 's5', name: '选择晚餐菜单', cost: 10, icon: '🍕', desc: '决定今晚吃什么' },
    { id: 's6', name: '延迟起床许可', cost: 5, icon: '⏰', desc: '周末可多睡30分钟' },
    { id: 's7', name: '新书/文具', cost: 30, icon: '✏️', desc: '自选一本新书或一套文具' },
    { id: 's8', name: '和好朋友玩', cost: 12, icon: '👫', desc: '邀请朋友来家里玩' },
    { id: 's9', name: '免做家务一次', cost: 10, icon: '🛋️', desc: '跳过一次家务任务' },
    { id: 's10', name: '决定周末出游目的地', cost: 18, icon: '🗺️', desc: '在家长给出的选项中选' },
    { id: 's11', name: '学做一道菜', cost: 15, icon: '🍳', desc: '在家长指导下学习做一道菜' },
    { id: 's12', name: 'DIY手工材料包', cost: 22, icon: '🧶', desc: '自选一套手工/拼装材料' },
    { id: 's13', name: '额外30分钟阅读自由选', cost: 8, icon: '📖', desc: '延长阅读时间，书籍自选' },
    { id: 's14', name: '和朋友通电话/视频', cost: 6, icon: '📞', desc: '和朋友联络10分钟' },
    { id: 's15', name: '决定今晚的家庭游戏', cost: 10, icon: '🎯', desc: '选一个全家玩的游戏' },
    { id: 's16', name: '一次性购买小玩具', cost: 35, icon: '🧸', desc: '合理价格范围内自选一个小玩具' },
    { id: 's17', name: '骑自行车外出半小时', cost: 8, icon: '🚴', desc: '在家长允许的范围内骑行' },
    { id: 's18', name: '给好朋友写一封信/贺卡', cost: 5, icon: '✉️', desc: '用代币换彩色笔和信纸' }
  ];

  // ============ EMOTION DATA ============
  var emotions = [
    { icon: '😠', name: '生气', empathy: '我知道你现在很生气。生气是完全可以的，每个人都会生气。', tip: '试试先做3次深呼吸，然后告诉爸爸妈妈你为什么生气。等冷静下来我们一起想办法解决。' },
    { icon: '😢', name: '难过', empathy: '我能看出来你现在很难过。来，让我陪陪你。', tip: '有时候哭出来反而会舒服一些。你可以告诉我发生了什么，也可以什么都不说，只是让我陪着你。' },
    { icon: '😰', name: '害怕', empathy: '你看起来有些害怕。没关系，害怕是正常的，大人也会害怕。', tip: '你现在安全吗？让爸爸/妈妈抱抱你。告诉我你害怕什么，我们一起面对。' },
    { icon: '😤', name: '委屈', empathy: '你觉得不公平对吗？我理解你的感受。', tip: '有时候事情确实让人觉得不公平。你可以把心里的话说出来，我会认真听。你的感受很重要。' },
    { icon: '😣', name: '烦躁', empathy: '你现在好像很不耐烦，坐不住对不对？', tip: '要不要出去跑一圈？或者做几个跳跃运动？身体动一动，烦躁感会减少很多。' },
    { icon: '🥺', name: '失望', empathy: '你期待的事情没有发生，确实很让人失望。', tip: '失望的感觉很难受，但不会永远这样。想想有没有其他可以让心情变好的事情？我们可以一起试试。' },
    { icon: '😐', name: '无聊', empathy: '什么都不想做的时候，确实挺无聊的。', tip: '无聊其实是创造力最好的时候！试试画画、搭积木、或者发明一个新游戏？你也可以选择一项安静的活动。' },
    { icon: '😌', name: '平静', empathy: '看起来你现在状态还不错，继续保持哦。', tip: '心情好的时候最适合做一些让自己开心的事情。也许你可以记录一下是什么让你觉得平静的。' },
    { icon: '🤗', name: '想被关注', empathy: '你是不是希望爸爸妈妈多陪陪你？', tip: '直接告诉我们"我想和你一起玩"就可以了。大人有时候确实太忙了，但只要你开口，我们会尽量安排时间。' },
    { icon: '😤', name: '不甘心', empathy: '你觉得还可以更好对吗？这种不甘心其实说明你很有上进心！', tip: '不甘心可以变成动力。冷静下来后，想想下次怎么做会更好。进步比结果更重要。' }
  ];

  // ============ REFRAME CARDS ============
  var reframeData = [
    {
      auto: '他总是故意跟我作对！',
      reframe: '他遇到了困难，不知道怎么表达自己的需要。',
      explain: '孩子的"不听话"往往是能力不足的表现，而非故意对抗。3-12岁儿童的前额叶尚未发育成熟，自我控制能力有限。'
    },
    {
      auto: '这孩子就是不懂事！',
      reframe: '他还在学习如何处理这种情绪和情况。',
      explain: '"懂事"是大脑发育的结果。孩子需要大量练习才能学会管理情绪和行为，这正是你的角色所在。'
    },
    {
      auto: '我怎么生了这么个难管的娃！',
      reframe: '这个阶段确实有挑战，但很多家长都经历过。这是暂时的。',
      explain: '将困难归因于"孩子天生难管"会让你更有挫败感。事实上，大多数行为问题都和发育阶段有关，会随成长改善。'
    },
    {
      auto: '我说了一百遍他还是不听！',
      reframe: '也许我的方式需要调整，重复说教可能不是最好的方法。',
      explain: '研究表明，频繁重复指令会降低孩子的注意力。尝试用行动代替语言：蹲下来、眼神交流、简短指令。'
    },
    {
      auto: '别人家的孩子都那么乖！',
      reframe: '每个孩子都不同，比较只会让我和孩子都不开心。',
      explain: '社交媒体上的"完美孩子"是选择性展示。每个孩子都有自己的节奏和优势，比较会损害亲子关系。'
    },
    {
      auto: '我再不管他以后就废了！',
      reframe: '一次不配合不代表将来就会出问题。成长是长期的过程。',
      explain: '灾难化思维会加剧焦虑。回想一下，你小时候也有不听话的时候，现在你成了一个负责任的大人。'
    }
  ];

  // ============ PARENT WISDOM ============
  var wisdomList = [
    { text: '「孩子不是需要被修理的问题，而是需要被理解的秘密。」', author: 'Dan Siegel《全脑教养》' },
    { text: '「你的孩子在观察你的一举一动，然后模仿你。不是听你说什么，而是看你做什么。」', author: 'Jane Nelsen《正面管教》' },
    { text: '「孩子需要一个安全的环境来犯错——这是他们学习的方式。」', author: 'Adele Faber' },
    { text: '「当你改变自己对待孩子的方式，孩子的行为也会改变。」', author: 'Jesper Juul' },
    { text: '「先连接，再纠正。孩子只有在感受到被理解时，才愿意听从引导。」', author: 'Jane Nelsen' },
    { text: '「犯错是学习的机会，而不是惩罚的理由。」', author: '正面管教核心理念' },
    { text: '「80%的关注给好行为，20%用于纠正不当行为。」', author: 'CDC正面教养指南' },
    { text: '「一个愤怒的孩子底下，通常藏着一个害怕或受伤的孩子。」', author: '儿童心理学共识' },
    { text: '「一致性比严厉重要。说到做到比大声呵斥有效。」', author: '行为心理学原则' },
    { text: '「你不需要完美，你需要真实。道歉不会让你在孩子面前失去权威，反而会教会他们承担责任。」', author: 'Brene Brown' }
  ];

  // ============ INITIALIZATION ============
  function init() {
    loadDefaultActivities();
    renderWeeklyGrid();
    updateStats();
    renderRules();
    renderShop();
    renderEmotions();
    renderReframeCards();
    renderParentWisdom();
    initDrawCanvas();
    renderChart();
  }

  // ============ DEFAULT ACTIVITIES ============
  function loadDefaultActivities() {
    var today = new Date();
    var dayOfWeek = today.getDay();
    var monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

    var defaults = [
      // Monday 周一
      { name: '晨跑/骑车', type: 'outdoor', day: 0, time: '07:00', duration: 45, done: false },
      { name: '暑期作业', type: 'course', day: 0, time: '09:00', duration: 90, done: true },
      { name: '阅读时间', type: 'reading', day: 0, time: '14:00', duration: 30, done: false },
      { name: '游泳', type: 'outdoor', day: 0, time: '15:00', duration: 90, done: false },
      { name: '拼搭积木', type: 'hobby', day: 0, time: '19:00', duration: 60, done: false },
      // Tuesday 周二
      { name: '晨跑/骑车', type: 'outdoor', day: 1, time: '07:00', duration: 45, done: true },
      { name: '数学练习', type: 'course', day: 1, time: '09:00', duration: 60, done: true },
      { name: '画画/手工', type: 'hobby', day: 1, time: '14:00', duration: 60, done: false },
      { name: '游泳', type: 'outdoor', day: 1, time: '15:00', duration: 90, done: false },
      { name: '羽毛球', type: 'outdoor', day: 1, time: '17:00', duration: 90, done: false },
      { name: '游戏时间', type: 'game', day: 1, time: '19:00', duration: 30, done: false },
      // Wednesday 周三
      { name: '晨跑/骑车', type: 'outdoor', day: 2, time: '07:00', duration: 45, done: false },
      { name: '英语学习', type: 'course', day: 2, time: '09:00', duration: 60, done: false },
      { name: '阅读时间', type: 'reading', day: 2, time: '14:00', duration: 30, done: false },
      { name: '游泳', type: 'outdoor', day: 2, time: '15:00', duration: 90, done: false },
      { name: '钢琴练习', type: 'hobby', day: 2, time: '19:00', duration: 60, done: false },
      // Thursday 周四
      { name: '晨跑/骑车', type: 'outdoor', day: 3, time: '07:00', duration: 45, done: false },
      { name: '暑期作业', type: 'course', day: 3, time: '09:00', duration: 90, done: false },
      { name: '阅读时间', type: 'reading', day: 3, time: '14:00', duration: 30, done: false },
      { name: '游泳', type: 'outdoor', day: 3, time: '15:00', duration: 90, done: false },
      { name: '羽毛球', type: 'outdoor', day: 3, time: '17:00', duration: 90, done: false },
      { name: '自由阅读', type: 'reading', day: 3, time: '19:00', duration: 30, done: false },
      // Friday 周五
      { name: '晨跑/骑车', type: 'outdoor', day: 4, time: '07:00', duration: 45, done: false },
      { name: '语文写作', type: 'course', day: 4, time: '09:00', duration: 60, done: false },
      { name: '阅读时间', type: 'reading', day: 4, time: '14:00', duration: 30, done: false },
      { name: '游泳', type: 'outdoor', day: 4, time: '15:00', duration: 90, done: false },
      { name: '轮滑/滑板', type: 'outdoor', day: 4, time: '17:00', duration: 60, done: false },
      { name: '家庭电影', type: 'rest', day: 4, time: '19:00', duration: 90, done: false },
      // Saturday 周六
      { name: '户外徒步', type: 'outdoor', day: 5, time: '09:00', duration: 120, done: false },
      { name: '游泳', type: 'outdoor', day: 5, time: '14:00', duration: 90, done: false },
      { name: '自由阅读', type: 'reading', day: 5, time: '15:30', duration: 60, done: false },
      { name: '游戏时间', type: 'game', day: 5, time: '16:30', duration: 60, done: false },
      { name: '朋友玩耍', type: 'outdoor', day: 5, time: '17:30', duration: 90, done: false },
      // Sunday 周日
      { name: '家庭出游', type: 'outdoor', day: 6, time: '09:00', duration: 120, done: false },
      { name: '游泳', type: 'outdoor', day: 6, time: '14:00', duration: 90, done: false },
      { name: '羽毛球', type: 'outdoor', day: 6, time: '16:00', duration: 90, done: false },
      { name: '整理房间', type: 'rest', day: 6, time: '17:30', duration: 45, done: false },
      { name: '下周计划', type: 'rest', day: 6, time: '19:00', duration: 30, done: false },
    ];

    state.activities = defaults.map(function(a, i) {
      return Object.assign({}, a, { id: 'act_' + i });
    });
  }

  // ============ NAVIGATION ============
  window.switchPage = function(page) {
    var pages = document.querySelectorAll('.page');
    for (var i = 0; i < pages.length; i++) {
      pages[i].classList.remove('active');
    }
    document.getElementById('page-' + page).classList.add('active');

    var tabs = document.querySelectorAll('.nav-tab');
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].classList.remove('active');
    }
    var tabMap = { planner: 0, rewards: 1, childCalm: 2, parentCalm: 3 };
    if (tabMap[page] !== undefined) {
      tabs[tabMap[page]].classList.add('active');
    }

    var mobileItems = document.querySelectorAll('.mobile-nav-item');
    for (var i = 0; i < mobileItems.length; i++) {
      mobileItems[i].classList.remove('active');
    }
    if (tabMap[page] !== undefined) {
      mobileItems[tabMap[page]].classList.add('active');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (page === 'planner') {
      setTimeout(renderChart, 200);
    }
  };

  // ============ WEEKLY PLANNER ============
  function getWeekDates() {
    var today = new Date();
    var dayOfWeek = today.getDay();
    var monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) + state.weekOffset * 7);
    var dates = [];
    for (var i = 0; i < 7; i++) {
      var d = new Date(monday);
      d.setDate(monday.getDate() + i);
      dates.push(d);
    }
    return dates;
  }

  window.changeWeek = function(dir) {
    state.weekOffset += dir;
    renderWeeklyGrid();
    updateWeekLabel();
    updateStats();
  };

  function updateWeekLabel() {
    var dates = getWeekDates();
    var m1 = dates[0].getMonth() + 1;
    var d1 = dates[0].getDate();
    var m2 = dates[6].getMonth() + 1;
    var d2 = dates[6].getDate();
    document.getElementById('weekLabel').textContent = m1 + '月' + d1 + '日 — ' + m2 + '月' + d2 + '日';
  }

  function renderWeeklyGrid() {
    updateWeekLabel();
    var dates = getWeekDates();
    var today = new Date();
    var grid = document.getElementById('weeklyGrid');
    var dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

    var html = '';
    for (var d = 0; d < 7; d++) {
      var isToday = dates[d].toDateString() === today.toDateString();
      var activities = getActivitiesForDay(d);
      html += '<div class="day-col' + (isToday ? ' today' : '') + '">';
      html += '<div class="day-header">' + dayNames[d] + '</div>';
      html += '<div class="day-date">' + dates[d].getDate() + '</div>';

      if (activities.length === 0) {
        html += '<div class="text-muted text-sm" style="text-align:center;padding:12px 0">暂无安排</div>';
      } else {
        for (var a = 0; a < activities.length; a++) {
          var act = activities[a];
          var tc = typeConfig[act.type] || typeConfig.rest;
          var durLabel = act.duration >= 60 ? (act.duration % 60 === 0 ? (act.duration / 60) + 'h' : Math.floor(act.duration / 60) + 'h' + (act.duration % 60) + 'm') : act.duration + 'm';
          html += '<div class="activity-item ' + tc.css + '" title="' + tc.label + ' ' + durLabel + '">';
          html += '<span class="act-time">' + act.time + '</span>';
          html += '<span class="act-name">' + act.name + ' <small>(' + durLabel + ')</small></span>';
          html += '<span class="act-check' + (act.done ? ' done' : '') + '" onclick="toggleActivity(\'' + act.id + '\')">' + (act.done ? '✓' : '') + '</span>';
          html += '</div>';
        }
      }
      html += '</div>';
    }
    grid.innerHTML = html;
  }

  function getActivitiesForDay(day) {
    return state.activities.filter(function(a) { return a.day === day; })
      .sort(function(a, b) { return a.time.localeCompare(b.time); });
  }

  window.toggleActivity = function(id) {
    for (var i = 0; i < state.activities.length; i++) {
      if (state.activities[i].id === id) {
        state.activities[i].done = !state.activities[i].done;
        if (state.activities[i].done) {
          showToast('完成：' + state.activities[i].name, 'success');
          if (state.activities[i].type === 'outdoor' && state.activities[i].duration > 0) {
            var earnedTokens = Math.max(1, Math.round(state.activities[i].duration / 60));
            state.tokens.balance += earnedTokens;
            state.tokens.earned += earnedTokens;
            addTokenLog('完成户外活动「' + state.activities[i].name + '」', '+' + earnedTokens);
          }
        }
        break;
      }
    }
    renderWeeklyGrid();
    updateStats();
    renderTokenDisplay();
  };

  window.toggleAddForm = function() {
    var form = document.getElementById('addActivityForm');
    form.classList.toggle('show');
  };

  window.addActivity = function() {
    var name = document.getElementById('actName').value.trim();
    var type = document.getElementById('actType').value;
    var day = parseInt(document.getElementById('actDay').value);
    var time = document.getElementById('actTime').value;
    var duration = parseInt(document.getElementById('actDuration').value, 10);

    if (!name) { showToast('请输入活动名称', 'danger'); return; }

    var act = {
      id: 'act_' + Date.now(),
      name: name,
      type: type,
      day: day,
      time: time,
      duration: duration,
      done: false
    };
    state.activities.push(act);
    renderWeeklyGrid();
    updateStats();
    renderChart();
    toggleAddForm();
    document.getElementById('actName').value = '';
    showToast('已添加：' + name, 'success');
  };

  function updateStats() {
    var outdoorHours = 0, readingCount = 0, gameCount = 0;
    for (var i = 0; i < state.activities.length; i++) {
      var a = state.activities[i];
      if (a.done) {
        if (a.type === 'outdoor') outdoorHours += a.duration;
        if (a.type === 'reading') readingCount++;
        if (a.type === 'game') gameCount++;
      }
    }
    // duration is in minutes, convert to hours
    outdoorHours = outdoorHours / 60;
    var outdoorDisplay = (outdoorHours % 1 === 0) ? outdoorHours : outdoorHours.toFixed(1);
    document.getElementById('statOutdoor').textContent = outdoorDisplay;
    document.getElementById('statTokens').textContent = state.tokens.earned;
    document.getElementById('statReading').textContent = readingCount;
    document.getElementById('statScreen').textContent = gameCount;
    document.getElementById('outdoorHours').textContent = outdoorDisplay;

    var pct = Math.min(100, Math.round(outdoorHours / 16 * 100));
    document.getElementById('outdoorProgress').style.width = pct + '%';

    var alertEl = document.getElementById('outdoorAlert');
    if (outdoorHours >= 16) {
      alertEl.innerHTML = '<div class="alert alert-success"><span class="alert-icon">🎉</span>太棒了！本周户外活动已达标！继续加油！</div>';
    } else if (outdoorHours >= 10) {
      alertEl.innerHTML = '<div class="alert alert-info"><span class="alert-icon">💪</span>已完成 ' + pct + '%，再加把劲就能达标！</div>';
    } else if (outdoorHours > 0) {
      alertEl.innerHTML = '<div class="alert alert-warning"><span class="alert-icon">⚠️</span>户外时间还不够，建议增加户外活动。WHO建议5-17岁儿童每天至少60分钟中高强度运动。</div>';
    } else {
      alertEl.innerHTML = '<div class="alert alert-danger"><span class="alert-icon">❗</span>本周还没有户外活动记录。充足的户外活动对预防近视、促进身心健康至关重要。</div>';
    }
  }

  // ============ CHART ============
  function renderChart() {
    var el = document.getElementById('chart-activity');
    if (!el) return;

    var counts = { outdoor: 0, reading: 0, course: 0, hobby: 0, game: 0, rest: 0 };
    for (var i = 0; i < state.activities.length; i++) {
      counts[state.activities[i].type] = (counts[state.activities[i].type] || 0) + 1;
    }

    var style = getComputedStyle(document.documentElement);
    var accent = style.getPropertyValue('--accent').trim();
    var accent2 = style.getPropertyValue('--accent2').trim();
    var ink = style.getPropertyValue('--ink').trim();
    var muted = style.getPropertyValue('--muted').trim();
    var rule = style.getPropertyValue('--rule').trim();
    var bg2 = style.getPropertyValue('--bg2').trim();

    var chart = echarts.init(el, null, { renderer: 'svg' });
    chart.setOption({
      animation: false,
      tooltip: { trigger: 'item', appendToBody: true },
      legend: { bottom: 0, textStyle: { color: muted, fontSize: 13 } },
      series: [{
        type: 'pie',
        radius: ['40%', '65%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { show: true, color: ink, fontSize: 13, formatter: '{b}: {c}项' },
        data: [
          { value: counts.outdoor, name: '户外活动', itemStyle: { color: accent } },
          { value: counts.reading, name: '阅读', itemStyle: { color: '#9B72CF' } },
          { value: counts.course, name: '课程学习', itemStyle: { color: '#5B9BD5' } },
          { value: counts.hobby, name: '兴趣爱好', itemStyle: { color: '#E87BAC' } },
          { value: counts.game, name: '游戏时间', itemStyle: { color: accent2 } },
          { value: counts.rest, name: '休息', itemStyle: { color: muted } }
        ]
      }]
    });
    window.addEventListener('resize', function() { chart.resize(); });
  }
  window.renderChart = renderChart;

  // ============ REWARDS SYSTEM ============
  function renderRules() {
    var grid = document.getElementById('rulesGrid');
    var html = '';
    for (var i = 0; i < rewardRules.length; i++) {
      var r = rewardRules[i];
      var isReward = r.type === 'reward';
      html += '<div class="rule-card ' + (isReward ? 'rewards' : 'penalties') + '">';
      html += '<div class="rule-header">';
      html += '<span class="rule-name">' + r.icon + ' ' + r.name + '</span>';
      html += '<span class="rule-tokens ' + (isReward ? 'positive' : 'negative') + '">' + (isReward ? '+' : '') + r.tokens + '</span>';
      html += '</div>';
      html += '<div class="rule-desc">' + r.desc + '</div>';
      html += '<div class="rule-actions">';
      html += '<button class="btn btn-sm ' + (isReward ? 'btn-primary' : 'btn-danger') + '" onclick="applyRule(\'' + r.id + '\')">执行</button>';
      html += '</div>';
      html += '</div>';
    }
    grid.innerHTML = html;
  }

  window.applyRule = function(ruleId) {
    var rule = null;
    for (var i = 0; i < rewardRules.length; i++) {
      if (rewardRules[i].id === ruleId) { rule = rewardRules[i]; break; }
    }
    if (!rule) return;

    state.tokens.balance += rule.tokens;
    if (rule.tokens > 0) {
      state.tokens.earned += rule.tokens;
      showToast(rule.icon + ' ' + rule.name + '：+' + rule.tokens + '代币', 'success');
      addTokenLog('执行奖励「' + rule.name + '」', '+' + rule.tokens);
    } else {
      state.tokens.spent += Math.abs(rule.tokens);
      showToast(rule.icon + ' ' + rule.name + '：' + rule.tokens + '代币', 'danger');
      addTokenLog('执行惩罚「' + rule.name + '」', '' + rule.tokens);
    }
    renderTokenDisplay();
  };

  function renderTokenDisplay() {
    document.getElementById('tokenBalance').textContent = state.tokens.balance;
    document.getElementById('tokenHistory').textContent = '本周获得 +' + state.tokens.earned + ' ｜ 扣除 -' + state.tokens.spent;
    renderTokenLog();
    renderShop();
  }

  function addTokenLog(desc, amount) {
    var now = new Date();
    var timeStr = (now.getMonth() + 1) + '/' + now.getDate() + ' ' + now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0');
    state.tokens.log.unshift({ desc: desc, amount: amount, time: timeStr });
    if (state.tokens.log.length > 20) state.tokens.log.pop();
  }

  function renderTokenLog() {
    var el = document.getElementById('tokenLog');
    if (!el) return;
    if (state.tokens.log.length === 0) {
      el.innerHTML = '<div class="empty-state"><p>暂无记录</p></div>';
      return;
    }
    var html = '';
    for (var i = 0; i < state.tokens.log.length; i++) {
      var log = state.tokens.log[i];
      var isPositive = log.amount.indexOf('+') === 0;
      html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--bg2)">';
      html += '<div><span style="font-size:13px">' + log.desc + '</span><br><span class="text-muted text-sm">' + log.time + '</span></div>';
      html += '<span class="fw-700" style="color:' + (isPositive ? 'var(--accent)' : 'var(--danger)') + '">' + log.amount + '</span>';
      html += '</div>';
    }
    el.innerHTML = html;
  }

  function renderShop() {
    var grid = document.getElementById('shopGrid');
    if (!grid) return;
    var html = '';
    for (var i = 0; i < shopItems.length; i++) {
      var item = shopItems[i];
      var affordable = state.tokens.balance >= item.cost;
      html += '<div class="shop-item ' + (affordable ? 'affordable' : '') + '" onclick="' + (affordable ? 'redeemItem(\'' + item.id + '\')' : '') + '">';
      html += '<div class="shop-icon">' + item.icon + '</div>';
      html += '<div class="shop-name">' + item.name + '</div>';
      html += '<div class="shop-desc text-muted text-sm" style="margin-top:2px">' + item.desc + '</div>';
      html += '<div class="shop-cost">' + item.cost + ' 代币</div>';
      html += '<div class="mt-sm">' + (affordable ? '<span class="tag tag-green">可兑换</span>' : '<span class="tag tag-danger">代币不足</span>') + '</div>';
      html += '</div>';
    }
    grid.innerHTML = html;
  }

  window.redeemItem = function(itemId) {
    var item = null;
    for (var i = 0; i < shopItems.length; i++) {
      if (shopItems[i].id === itemId) { item = shopItems[i]; break; }
    }
    if (!item) return;

    if (state.tokens.balance < item.cost) {
      showToast('代币不足，无法兑换', 'danger');
      return;
    }

    state.tokens.balance -= item.cost;
    state.tokens.spent += item.cost;
    showToast('兑换成功：' + item.name, 'success');
    addTokenLog('兑换奖励「' + item.name + '」', '-' + item.cost);
    renderTokenDisplay();
  };

  // ============ CHILD CALM SYSTEM ============
  window.startChildExercise = function(type) {
    var landing = document.getElementById('childCalmLanding');
    landing.style.display = 'none';

    var exercises = ['childBreath', 'childGlitter', 'childEmotion', 'childHug', 'childCount', 'childDraw'];
    var exerciseMap = { breath: 0, glitter: 1, emotion: 2, hug: 3, count: 4, draw: 5 };
    for (var i = 0; i < exercises.length; i++) {
      document.getElementById(exercises[i]).classList.remove('active');
    }
    document.getElementById(exercises[exerciseMap[type]]).classList.add('active');

    if (type === 'glitter') initGlitterJar();
    if (type === 'draw') initDrawCanvas();
  };

  window.backToChildLanding = function() {
    document.getElementById('childCalmLanding').style.display = '';
    var exercises = ['childBreath', 'childGlitter', 'childEmotion', 'childHug', 'childCount', 'childDraw'];
    for (var i = 0; i < exercises.length; i++) {
      document.getElementById(exercises[i]).classList.remove('active');
    }
    stopBreathing();
  };

  // -- Breathing (Enhanced) --
  window.toggleBreathing = function() {
    if (state.breathing.active) {
      stopBreathing();
      return;
    }
    state.breathing.active = true;
    state.breathing.count = 0;
    document.getElementById('breathCelebration').classList.remove('show');
    doBreathCycle();
  };

  function doBreathCycle() {
    var container = document.getElementById('breathEnhanced');
    var core = document.getElementById('breathCore');
    var instr = document.getElementById('breathInstruction');

    // Inhale (4s)
    container.className = 'breath-enhanced inhale';
    core.textContent = '吸气...';
    instr.textContent = '吸气...气球变大 💨';
    setTimeout(function() {
      if (!state.breathing.active) return;
      // Hold (2s)
      container.className = 'breath-enhanced hold';
      core.textContent = '屏住...';
      instr.textContent = '屏住...保持住 ⏸️';
      setTimeout(function() {
        if (!state.breathing.active) return;
        // Exhale (4s)
        container.className = 'breath-enhanced';
        core.textContent = '呼气...';
        instr.textContent = '呼气...气球变小 🌬️';
        setTimeout(function() {
          if (!state.breathing.active) return;
          state.breathing.count++;
          if (state.breathing.count >= 5) {
            stopBreathing();
            instr.textContent = '';
            core.textContent = '✅';
            container.className = 'breath-enhanced';
            document.getElementById('breathCelebration').classList.add('show');
          } else {
            doBreathCycle();
          }
        }, 4000);
      }, 2000);
    }, 4000);
  }

  function stopBreathing() {
    state.breathing.active = false;
    var container = document.getElementById('breathEnhanced');
    var core = document.getElementById('breathCore');
    var instr = document.getElementById('breathInstruction');
    if (container) container.className = 'breath-enhanced';
    if (core && core.textContent !== '✅') core.textContent = '点击开始';
    if (instr && !instr.textContent.includes('太棒了') && instr.textContent !== '') {
      instr.textContent = '点击圆圈开始呼吸练习';
    }
  }

  // -- Glitter Jar (Enhanced) --
  function initGlitterJar() {
    var jar = document.getElementById('glitterJar');
    jar.innerHTML = '';
    var colors = ['#9B72CF', '#C4A0E8', '#7B52B0', '#D4B8F0', '#E8915A', '#5B9BD5', '#E87BAC', '#4A9D6E'];
    var shapes = ['50%', '30%', '0']; // circle, squircle, diamond
    for (var i = 0; i < 55; i++) {
      var p = document.createElement('div');
      p.className = 'glitter-particle-enhanced';
      var size = 3 + Math.random() * 8;
      p.style.width = size + 'px';
      p.style.height = size + 'px';
      p.style.left = (Math.random() * 92) + '%';
      p.style.top = (260 + Math.random() * 30) + 'px';
      p.style.background = colors[Math.floor(Math.random() * colors.length)];
      p.style.color = colors[Math.floor(Math.random() * colors.length)];
      p.style.opacity = (0.3 + Math.random() * 0.7);
      p.style.borderRadius = shapes[Math.floor(Math.random() * shapes.length)];
      p.dataset.origTop = p.style.top;
      p.dataset.origLeft = p.style.left;
      jar.appendChild(p);
    }
  }

  window.shakeGlitter = function() {
    var jar = document.getElementById('glitterJar');
    var particles = jar.querySelectorAll('.glitter-particle-enhanced');
    for (var i = 0; i < particles.length; i++) {
      particles[i].style.top = (5 + Math.random() * 80) + 'px';
      particles[i].style.left = (Math.random() * 92) + '%';
      particles[i].style.transform = 'rotate(' + (Math.random() * 360) + 'deg) scale(' + (0.5 + Math.random() * 1.5) + ')';
      particles[i].style.transition = 'top ' + (3 + Math.random() * 5) + 's cubic-bezier(0.25, 0.46, 0.45, 0.94), left 0.5s ease-out, transform 0.3s ease';
    }
    setTimeout(function() {
      for (var i = 0; i < particles.length; i++) {
        particles[i].style.top = particles[i].dataset.origTop;
        particles[i].style.left = particles[i].dataset.origLeft;
        particles[i].style.transform = 'rotate(0deg) scale(1)';
        particles[i].style.transition = 'top ' + (3 + Math.random() * 5) + 's cubic-bezier(0.25, 0.46, 0.45, 0.94), left 0.8s ease, transform 1s ease';
      }
    }, 150);
  };

  // -- Emotion Grid (Enhanced) --
  function renderEmotions() {
    var grid = document.getElementById('emotionGrid');
    var html = '';
    for (var i = 0; i < emotions.length; i++) {
      var e = emotions[i];
      html += '<div class="emotion-card-enhanced" onclick="selectEmotion(' + i + ')" style="animation-delay:' + (i * 0.06) + 's">';
      html += '<span class="emo-icon">' + e.icon + '</span>';
      html += '<span class="emo-name">' + e.name + '</span>';
      html += '</div>';
    }
    grid.innerHTML = html;
  }

  window.selectEmotion = function(idx) {
    var cards = document.querySelectorAll('.emotion-card-enhanced');
    for (var i = 0; i < cards.length; i++) {
      cards[i].classList.remove('selected');
    }
    cards[idx].classList.add('selected');

    var e = emotions[idx];
    document.getElementById('empathyText').innerHTML = '<strong>' + e.icon + ' 共情回应：</strong><br><br>' + e.empathy;
    document.getElementById('empathyTip').innerHTML = '<strong>💡 你可以试试：</strong><br>' + e.tip;
    document.getElementById('empathyResponse').classList.add('show');
  };

  // -- Hug Timer (Enhanced) --
  window.startHug = function() {
    if (state.hug.active) return;
    state.hug.active = true;
    var count = 20;
    document.getElementById('hugStartBtn').disabled = true;
    document.getElementById('hugStartBtn').textContent = '拥抱中...';
    document.getElementById('hugWrapper').classList.add('hug-active');
    document.getElementById('hugCelebration').classList.remove('show');
    document.getElementById('hugCount').textContent = count;

    state.hug.timer = setInterval(function() {
      count--;
      var el = document.getElementById('hugCount');
      el.textContent = count;
      // Pop animation on each tick
      el.classList.remove('count-pop');
      void el.offsetWidth; // force reflow
      el.classList.add('count-pop');

      if (count <= 0) {
        clearInterval(state.hug.timer);
        state.hug.active = false;
        document.getElementById('hugWrapper').classList.remove('hug-active');
        document.getElementById('hugStartBtn').disabled = false;
        document.getElementById('hugStartBtn').textContent = '再来一次！';
        el.textContent = '🎉';
        document.getElementById('hugCelebration').classList.add('show');
        showToast('20秒拥抱完成！拥抱可以促进催产素分泌哦~', 'success');
      }
    }, 1000);
  };

  // -- Count to 10 (Enhanced) --
  window.startCounting = function() {
    if (state.counting.active) return;
    state.counting.active = true;
    var count = 0;
    document.getElementById('countStartBtn').disabled = true;
    document.getElementById('countStartBtn').textContent = '数数中...';
    document.getElementById('countCelebration').classList.remove('show');
    document.getElementById('countNum').textContent = 0;

    state.counting.timer = setInterval(function() {
      count++;
      var el = document.getElementById('countNum');
      el.textContent = count;
      // Pop animation
      el.classList.remove('count-pop');
      void el.offsetWidth;
      el.classList.add('count-pop');
      // Rotate ring
      var ring = document.getElementById('countTimer').querySelector('.timer-ring');
      if (ring) ring.style.transform = 'rotate(' + (count * 36) + 'deg)';

      if (count >= 10) {
        clearInterval(state.counting.timer);
        state.counting.active = false;
        document.getElementById('countStartBtn').disabled = false;
        document.getElementById('countStartBtn').textContent = '再数一次';
        el.textContent = '🌟';
        document.getElementById('countCelebration').classList.add('show');
        showToast('数到10了！现在心情是不是平静了一些？', 'success');
      }
    }, 2000);
  };

  // -- Draw Canvas --
  function initDrawCanvas() {
    var canvas = document.getElementById('drawCanvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    canvas.onmousedown = function(e) { state.isDrawing = true; ctx.beginPath(); ctx.moveTo(e.offsetX, e.offsetY); };
    canvas.onmousemove = function(e) {
      if (!state.isDrawing) return;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.strokeStyle = state.drawColor;
      ctx.lineTo(e.offsetX, e.offsetY);
      ctx.stroke();
    };
    canvas.onmouseup = function() { state.isDrawing = false; };
    canvas.onmouseleave = function() { state.isDrawing = false; };

    // Touch support
    canvas.ontouchstart = function(e) {
      e.preventDefault();
      var rect = canvas.getBoundingClientRect();
      var touch = e.touches[0];
      state.isDrawing = true;
      ctx.beginPath();
      ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
    };
    canvas.ontouchmove = function(e) {
      e.preventDefault();
      if (!state.isDrawing) return;
      var rect = canvas.getBoundingClientRect();
      var touch = e.touches[0];
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.strokeStyle = state.drawColor;
      ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
      ctx.stroke();
    };
    canvas.ontouchend = function() { state.isDrawing = false; };
  }

  window.setDrawColor = function(color) {
    state.drawColor = color;
  };

  window.clearCanvas = function() {
    var canvas = document.getElementById('drawCanvas');
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  // ============ PARENT CALM SYSTEM ============
  window.triggerSOS = function() {
    startParentExercise('breath478');
    showToast('SOS已触发！先做几个深呼吸，你很棒。', 'info');
  };

  window.startParentExercise = function(type) {
    var exerciseMap = {
      breath478: 'parentBreath478',
      abc: 'parentABC',
      stop: 'parentSTOP',
      reframe: 'parentReframe'
    };
    // Close all exercises
    var ids = ['parentBreath478', 'parentABC', 'parentSTOP', 'parentReframe'];
    for (var i = 0; i < ids.length; i++) {
      document.getElementById(ids[i]).classList.remove('active');
    }
    // Open target
    document.getElementById(exerciseMap[type]).classList.add('active');
    // Hide landing
    document.getElementById('parentCalmLanding').style.display = 'none';
  };

  window.closeParentExercise = function(id) {
    document.getElementById(id).classList.remove('active');
    document.getElementById('parentCalmLanding').style.display = '';
    stopParentBreathing();
  };

  // -- 4-7-8 Breathing --
  window.toggleParentBreathing = function() {
    if (state.parentBreathing.active) {
      stopParentBreathing();
      return;
    }
    state.parentBreathing.active = true;
    state.parentBreathing.count = 0;
    doParentBreathCycle();
  };

  function doParentBreathCycle() {
    var circle = document.getElementById('parentBreathCircle');
    var text = document.getElementById('parentBreathText');

    circle.className = 'breathing-circle inhale';
    text.textContent = '吸气 4...';
    setTimeout(function() {
      if (!state.parentBreathing.active) return;
      circle.className = 'breathing-circle hold';
      text.textContent = '屏息 7...';
      setTimeout(function() {
        if (!state.parentBreathing.active) return;
        circle.className = 'breathing-circle exhale';
        text.textContent = '呼气 8...';
        setTimeout(function() {
          if (!state.parentBreathing.active) return;
          state.parentBreathing.count++;
          if (state.parentBreathing.count >= 4) {
            stopParentBreathing();
            text.textContent = '完成4个循环，感觉好些了吗？';
          } else {
            doParentBreathCycle();
          }
        }, 8000);
      }, 7000);
    }, 4000);
  }

  function stopParentBreathing() {
    state.parentBreathing.active = false;
    var circle = document.getElementById('parentBreathCircle');
    if (circle) circle.className = 'breathing-circle';
    var text = document.getElementById('parentBreathText');
    if (text && !text.textContent.includes('完成')) {
      text.textContent = '吸气4秒 → 屏息7秒 → 呼气8秒';
    }
  }

  // -- ABC Model --
  window.showABCTip = function() {
    var event = document.getElementById('abcEvent').value;
    var belief = document.getElementById('abcBelief').value;
    var tipEl = document.getElementById('abcTipResult');

    if (!belief) {
      tipEl.style.display = 'block';
      tipEl.innerHTML = '<div class="alert alert-warning"><span class="alert-icon">💡</span>先填写B（你的信念），这样才能帮你找到不合理之处。</div>';
      return;
    }

    var tips = [
      '觉察到你的想法了吗？问自己：这个想法100%确定是真的吗？有没有其他可能的解释？',
      '尝试用"虽然...但是..."句式重构：虽然孩子行为让我困扰，但是他可能...（找到一个非恶意的解释）',
      '记住：孩子的大脑前额叶要到25岁才发育成熟。他们不是"故意"的，而是"还不会"。'
    ];

    tipEl.style.display = 'block';
    tipEl.innerHTML = '<div class="alert alert-success" style="margin-top:12px"><span class="alert-icon">🌿</span><strong>反思建议：</strong><br><br>';
    for (var i = 0; i < tips.length; i++) {
      tipEl.innerHTML += (i + 1) + '. ' + tips[i] + '<br><br>';
    }
    tipEl.innerHTML += '<em style="color:var(--muted);font-size:13px">这就是ABCDE中的D和E——质疑不合理信念，建立更有效的新信念。</em>';
    tipEl.innerHTML += '</div>';
  };

  // -- Reframe Cards --
  function renderReframeCards() {
    var el = document.getElementById('reframeCards');
    var html = '';
    for (var i = 0; i < reframeData.length; i++) {
      var r = reframeData[i];
      html += '<div class="abc-card" style="margin-bottom:16px">';
      html += '<div style="display:flex;gap:12px;flex-wrap:wrap">';
      html += '<div style="flex:1;min-width:200px">';
      html += '<div class="tag tag-danger mb-sm">自动化思维</div>';
      html += '<p style="font-size:15px;color:var(--danger);font-weight:600">"' + r.auto + '"</p>';
      html += '</div>';
      html += '<div style="display:flex;align-items:center;font-size:24px;color:var(--muted)">→</div>';
      html += '<div style="flex:1;min-width:200px">';
      html += '<div class="tag tag-green mb-sm">重构后的想法</div>';
      html += '<p style="font-size:15px;color:var(--accent);font-weight:600">"' + r.reframe + '"</p>';
      html += '</div>';
      html += '</div>';
      html += '<div style="margin-top:10px;padding:10px;background:var(--bg2);border-radius:var(--radius-xs);font-size:13px;color:var(--muted)">';
      html += r.explain;
      html += '</div>';
      html += '</div>';
    }
    el.innerHTML = html;
  }

  // -- Parent Wisdom --
  function renderParentWisdom() {
    var el = document.getElementById('parentWisdom');
    var html = '';
    for (var i = 0; i < wisdomList.length; i++) {
      var w = wisdomList[i];
      html += '<div style="padding:12px 0;border-bottom:1px solid var(--bg2);display:flex;gap:12px;align-items:flex-start">';
      html += '<span style="font-size:20px;flex-shrink:0">' + ['🌿','💡','🧠','❤️','🤝','🔄','⭐','🌈','🎯','💪'][i] + '</span>';
      html += '<div>';
      html += '<p style="font-size:15px;line-height:1.7">' + w.text + '</p>';
      html += '<p class="text-muted text-sm mt-sm">—— ' + w.author + '</p>';
      html += '</div>';
      html += '</div>';
    }
    el.innerHTML = html;
  }

  // ============ TOAST ============
  function showToast(msg, type) {
    var container = document.getElementById('toastContainer');
    var toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    var icon = type === 'success' ? '✓' : type === 'danger' ? '✗' : 'ℹ';
    toast.innerHTML = '<span>' + icon + '</span> ' + msg;
    container.appendChild(toast);
    setTimeout(function() {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(40px)';
      toast.style.transition = 'all 0.3s';
      setTimeout(function() { toast.remove(); }, 300);
    }, 2500);
  }

  // ============ MODAL ============
  window.openModal = function(title, body) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = body;
    document.getElementById('modalOverlay').classList.add('show');
  };

  window.closeModal = function(e) {
    if (e.target === document.getElementById('modalOverlay')) {
      document.getElementById('modalOverlay').classList.remove('show');
    }
  };

  window.closeModalDirect = function() {
    document.getElementById('modalOverlay').classList.remove('show');
  };

  // ============ INIT ============
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
