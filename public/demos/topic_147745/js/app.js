/**
 * 小学伴 - 纯净学生社区 Demo
 * 应用逻辑
 * 依赖: js/data.js (window.APP_DATA), css/app.css
 */
(function () {
  'use strict';

  var D = window.APP_DATA || {};
  var ZONES = D.ZONES || [];
  var POSTS = D.POSTS || [];
  var GROUPS = D.GROUPS || [];
  var selInt = ['编程', '魔方', '科学'];
  var curPost = null;
  var ckToday = false;
  var curGid = null;
  var joinApplyGid = null;
  var pendingApplies = {};
  var selGrpIcon = '💻';

  /* ==================== 工具函数 ==================== */

  function escHtml(s) {
    if (!s) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function toast(msg) {
    var el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(function () { el.classList.remove('show'); }, 2000);
  }

  function confetti() {
    var container = document.createElement('div');
    container.className = 'cfco';
    var app = document.getElementById('app');
    if (app) app.appendChild(container);
    var cols = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6', '#EC4899'];
    for (var i = 0; i < 40; i++) {
      var p = document.createElement('div');
      p.className = 'cfp';
      p.style.left = Math.random() * 100 + '%';
      p.style.background = cols[Math.floor(Math.random() * cols.length)];
      p.style.animationDelay = Math.random() * 0.8 + 's';
      p.style.animationDuration = (1.5 + Math.random()) + 's';
      var sz = 6 + Math.random() * 8;
      p.style.width = sz + 'px';
      p.style.height = sz + 'px';
      p.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
      container.appendChild(p);
    }
    setTimeout(function () { if (container.parentNode) container.parentNode.removeChild(container); }, 3000);
  }

  /* ==================== 导航 ==================== */

  function go(pageId) {
    var pages = document.querySelectorAll('.pg');
    for (var i = 0; i < pages.length; i++) { pages[i].classList.remove('on'); }
    var target = document.getElementById(pageId);
    if (target) {
      target.classList.add('on');
      var sc = target.querySelector('.psc');
      if (sc) sc.scrollTop = 0;
    }
  }

  var TAB_PAGES = ['P-hall', 'P-msg', 'P-groups', 'P-me', 'P-par'];
  var TAB_ITEMS = [
    { icon: '🏠', label: '大厅' },
    { icon: '💬', label: '消息' },
    { icon: '👥', label: '小组' },
    { icon: '👤', label: '我的' },
    { icon: '👨‍👩‍👧', label: '家长端' }
  ];

  function sTab(idx) {
    go(TAB_PAGES[idx]);
  }

  function tabs(containerId, activeIdx) {
    var el = document.getElementById(containerId);
    if (!el) return;
    var h = '';
    for (var i = 0; i < TAB_ITEMS.length; i++) {
      var cls = i === activeIdx ? ' tbi on' : ' tbi';
      h += '<button class="' + cls + '" onclick="sTab(' + i + ')">' +
        '<span class="ti">' + TAB_ITEMS[i].icon + '</span>' +
        '<span>' + TAB_ITEMS[i].label + '</span>' +
        '</button>';
    }
    el.innerHTML = h;
  }

  /* ==================== 注册 ==================== */

  function goReg2() {
    var n = document.getElementById('r-name');
    var s = document.getElementById('r-school');
    var g = document.getElementById('r-grade');
    var c = document.getElementById('r-city');
    if (!n || !s || !g || !c) return;
    if (!n.value.trim() || !s.value || !g.value || !c.value) {
      toast('请填写完整信息');
      return;
    }
    go('P-reg2');
  }

  function doUpload() {
    var area = document.getElementById('up-area');
    var icon = document.getElementById('up-icon');
    var text = document.getElementById('up-text');
    var ok = document.getElementById('up-ok');
    var btn = document.getElementById('btn-sub');
    if (area) area.classList.add('up');
    if (icon) icon.textContent = '✅';
    if (text) text.textContent = 'student_card.jpg';
    if (ok) ok.style.display = 'flex';
    if (btn) btn.disabled = false;
  }

  function doSubmit() {
    go('P-reg3');
    setTimeout(function () {
      var box = document.getElementById('audit-box');
      if (!box) return;
      box.innerHTML =
        '<div style="font-size:64px;margin-bottom:20px">🎉</div>' +
        '<div class="at">审核通过！</div>' +
        '<div class="ad">恭喜你，身份验证已通过！接下来请选择你感兴趣的领域</div>' +
        '<button class="btn-p" onclick="go(\'P-int\');renderInt()">选择兴趣标签</button>';
    }, 2000);
  }

  /* ==================== 兴趣选择 ==================== */

  function renderInt() {
    var grid = document.getElementById('ig-grid');
    if (!grid) return;
    var h = '';
    for (var i = 0; i < ZONES.length; i++) {
      var z = ZONES[i];
      var sel = selInt.indexOf(z.tag) >= 0 ? ' sel' : '';
      h += '<div class="ic' + sel + '" data-t="' + escHtml(z.tag) + '" onclick="togInt(this)">' +
        '<span class="ii">' + escHtml(z.icon) + '</span>' +
        '<span class="in">' + escHtml(z.tag) + '</span>' +
        '</div>';
    }
    grid.innerHTML = h;
    chkIntBtn();
  }

  function togInt(el) {
    el.classList.toggle('sel');
    selInt = [];
    var cards = document.querySelectorAll('.ic.sel');
    for (var i = 0; i < cards.length; i++) {
      selInt.push(cards[i].getAttribute('data-t'));
    }
    chkIntBtn();
  }

  function chkIntBtn() {
    var btn = document.getElementById('btn-int');
    if (btn) btn.disabled = selInt.length < 2;
  }

  function enterHall() {
    renderHall();
    go('P-hall');
    confetti();
  }

  /* ==================== 大厅 ==================== */

  function renderHall() {
    tabs('tab-hall', 0);
    renderZoneChips();
    renderHallGroups();
    renderPosts(POSTS);
  }

  function renderZoneChips() {
    var el = document.getElementById('z-chips');
    if (!el) return;
    var h = '<button class="zc on" onclick="fZone(\'全部\',this)">🌟 全部</button>';
    for (var i = 0; i < selInt.length; i++) {
      var tag = selInt[i];
      var zone = null;
      for (var j = 0; j < ZONES.length; j++) {
        if (ZONES[j].tag === tag) { zone = ZONES[j]; break; }
      }
      var icon = zone ? zone.icon : '📌';
      h += '<button class="zc" onclick="fZone(\'' + escHtml(tag) + '\',this)">' + icon + ' ' + escHtml(tag) + '</button>';
    }
    el.innerHTML = h;
  }

  function renderHallGroups() {
    var el = document.getElementById('h-groups');
    if (!el) return;
    var h = '';
    for (var i = 0; i < Math.min(2, GROUPS.length); i++) {
      h += buildGroupCard(GROUPS[i]);
    }
    el.innerHTML = h;
  }

  function buildGroupCard(g) {
    var btnState = '';
    if (pendingApplies[g.id]) {
      btnState = '<button class="gjb p">⏳ 审核中</button>';
    } else {
      btnState = '<button class="gjb" onclick="event.stopPropagation();openJoinApply(' + g.id + ')">加入</button>';
    }
    return '<div class="grc" onclick="openGrp(' + g.id + ')">' +
      '<div class="gh">' +
        '<div class="gi" style="background:' + escHtml(g.bg) + '">' + escHtml(g.icon) + '</div>' +
        '<div class="gnfo">' +
          '<div class="gnm">' + escHtml(g.name) + '</div>' +
          '<div class="gds">' + escHtml(g.desc) + '</div>' +
          '<div class="gst">' +
            '<span>👥 ' + g.members + ' 成员</span>' +
            '<span>📝 ' + g.posts + ' 帖子</span>' +
          '</div>' +
        '</div>' +
        btnState +
      '</div>' +
      '</div>';
  }

  /* ==================== 创建小组 ==================== */

  var CG_COLORS = [
    'linear-gradient(135deg, #10B981, #065F46)',
    'linear-gradient(135deg, #3B82F6, #1E40AF)',
    'linear-gradient(135deg, #8B5CF6, #5B21B6)',
    'linear-gradient(135deg, #F59E0B, #B45309)',
    'linear-gradient(135deg, #EF4444, #B91C1C)',
    'linear-gradient(135deg, #EC4899, #BE185D)',
    'linear-gradient(135deg, #06B6D4, #0E7490)',
    'linear-gradient(135deg, #F97316, #C2410C)'
  ];

  function openCreateGrp() {
    selGrpIcon = '💻';
    /* 填充兴趣分类下拉 */
    var sel = document.getElementById('cg-zone');
    if (sel) {
      var h = '<option value="">请选择兴趣分类</option>';
      for (var i = 0; i < ZONES.length; i++) {
        h += '<option value="' + escHtml(ZONES[i].tag) + '">' + escHtml(ZONES[i].icon) + ' ' + escHtml(ZONES[i].tag) + '</option>';
      }
      sel.innerHTML = h;
    }
    /* 清空表单 */
    var nameEl = document.getElementById('cg-name');
    var descEl = document.getElementById('cg-desc');
    if (nameEl) nameEl.value = '';
    if (descEl) descEl.value = '';
    updateCharCount('cg-desc', 'cg-desc-cnt', 200);
    /* 重置图标选择 */
    var icons = document.querySelectorAll('#cg-icon-picker .ip-item');
    for (var j = 0; j < icons.length; j++) {
      icons[j].classList.remove('sel');
    }
    var firstIcon = document.querySelector('#cg-icon-picker .ip-item');
    if (firstIcon) firstIcon.classList.add('sel');
    var hintEl = document.getElementById('cg-name-hint');
    if (hintEl) hintEl.textContent = '';

    go('P-create-grp');
  }

  function pickIcon(el) {
    var items = document.querySelectorAll('#cg-icon-picker .ip-item');
    for (var i = 0; i < items.length; i++) { items[i].classList.remove('sel'); }
    el.classList.add('sel');
    selGrpIcon = el.getAttribute('data-icon') || '💻';
  }

  function submitCreateGrp() {
    var name = document.getElementById('cg-name');
    var zone = document.getElementById('cg-zone');
    var desc = document.getElementById('cg-desc');
    var hint = document.getElementById('cg-name-hint');
    if (!name || !zone || !desc) return;

    var nameVal = name.value.trim();
    var zoneVal = zone.value;
    var descVal = desc.value.trim();

    if (!nameVal) {
      if (hint) hint.innerHTML = '<span style="color:#EF4444">请输入小组名称</span>';
      name.focus();
      return;
    }
    if (nameVal.length < 2) {
      if (hint) hint.innerHTML = '<span style="color:#EF4444">小组名称至少 2 个字</span>';
      name.focus();
      return;
    }
    if (hint) hint.textContent = '';

    if (!zoneVal) {
      toast('请选择兴趣分类');
      return;
    }
    if (!descVal) {
      toast('请填写小组简介');
      desc.focus();
      return;
    }

    /* 创建新小组并加入列表 */
    var newId = 100 + GROUPS.length;
    var colorIdx = GROUPS.length % CG_COLORS.length;
    var newGroup = {
      id: newId,
      name: nameVal,
      icon: selGrpIcon,
      color: '#10B981',
      bg: CG_COLORS[colorIdx],
      desc: descVal,
      members: 1,
      posts: 0,
      tasks: ['完善小组简介', '发布第一条动态', '邀请同好加入'],
      aiHistory: [
        { role: 'bot', text: '你好！我是本组的 AI 助教 🤖，有任何学习问题都可以问我哦！' }
      ],
      aiResponses: [
        '这是一个很好的问题！让我帮你分析一下...',
        '根据我的知识库，建议你可以从以下几个方面入手...',
        '别着急，这个知识点其实不难，我们一步步来理解。'
      ]
    };
    GROUPS.unshift(newGroup);

    toast('🎉 小组创建申请已提交，请等待审核');

    setTimeout(function () {
      renderGroups();
      go('P-groups');
    }, 1500);
  }

  /* ==================== 申请加入小组 ==================== */

  function openJoinApply(gid) {
    joinApplyGid = gid;
    var g = null;
    for (var i = 0; i < GROUPS.length; i++) {
      if (GROUPS[i].id === gid) { g = GROUPS[i]; break; }
    }
    if (!g) return;

    /* 渲染小组预览 */
    var preview = document.getElementById('ja-preview');
    if (preview) {
      preview.innerHTML =
        '<div class="jp-icon">' + escHtml(g.icon) + '</div>' +
        '<div class="jp-info">' +
          '<div class="jp-name">' + escHtml(g.name) + '</div>' +
          '<div class="jp-desc">' + escHtml(g.desc) + '</div>' +
        '</div>';
    }

    /* 设置小组名称 */
    var nameEl = document.getElementById('ja-grp-name');
    if (nameEl) nameEl.textContent = '「' + g.name + '」';

    /* 清空表单 */
    var introEl = document.getElementById('ja-intro');
    var reasonEl = document.getElementById('ja-reason');
    if (introEl) introEl.value = '';
    if (reasonEl) reasonEl.value = '';
    updateCharCount('ja-intro', 'ja-intro-cnt', 300);
    updateCharCount('ja-reason', 'ja-reason-cnt', 300);

    go('P-join-apply');
  }

  function submitJoinApply() {
    var intro = document.getElementById('ja-intro');
    var reason = document.getElementById('ja-reason');
    if (!intro || !reason) return;

    var introVal = intro.value.trim();
    var reasonVal = reason.value.trim();

    if (!introVal) {
      toast('请填写自我介绍');
      intro.focus();
      return;
    }
    if (introVal.length < 5) {
      toast('自我介绍至少 5 个字');
      intro.focus();
      return;
    }
    if (!reasonVal) {
      toast('请填写申请理由');
      reason.focus();
      return;
    }
    if (reasonVal.length < 5) {
      toast('申请理由至少 5 个字');
      reason.focus();
      return;
    }

    /* 记录申请状态 */
    pendingApplies[joinApplyGid] = {
      intro: introVal,
      reason: reasonVal,
      time: '刚刚'
    };

    /* 获取小组名称 */
    var gName = '该小组';
    for (var i = 0; i < GROUPS.length; i++) {
      if (GROUPS[i].id === joinApplyGid) { gName = GROUPS[i].name; break; }
    }

    toast('🎉 申请已提交，请等待审核');
    joinApplyGid = null;

    setTimeout(function () {
      renderGroups();
      go('P-groups');
    }, 1500);
  }

  /* ==================== 字数统计 ==================== */

  function updateCharCount(inputId, cntId, max) {
    var input = document.getElementById(inputId);
    var cnt = document.getElementById(cntId);
    if (!input || !cnt) return;
    var len = (input.value || '').length;
    cnt.textContent = len;
    if (len >= max) {
      cnt.style.color = '#EF4444';
    } else if (len >= max * 0.8) {
      cnt.style.color = '#F59E0B';
    } else {
      cnt.style.color = '#10B981';
    }
  }

  function renderPosts(posts) {
    var list = document.getElementById('p-list');
    if (!list) return;
    var h = '';
    for (var i = 0; i < posts.length; i++) {
      var p = posts[i];
      var avatarSrc = p.avatar ? ('assets/images/' + p.avatar) : 'assets/images/avatar-boy.svg';
      var imgH = p.hasImg ?
        '<img src="assets/images/placeholder-post.svg" alt="配图" class="pimg">' : '';
      h += '<div class="pc fi-anim" onclick="openPost(' + p.id + ')">' +
        '<div class="pa">' +
          '<img src="' + avatarSrc + '" alt="" class="pav">' +
          '<div class="pai">' +
            '<div class="pan">' + escHtml(p.author) + ' <span class="pt">' + escHtml(p.tag) + '</span></div>' +
            '<div class="pm">' + escHtml(p.school) + ' · ' + escHtml(p.time) + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="pco"><strong>' + escHtml(p.title) + '</strong><br>' +
          '<span style="color:#6B7280">' + escHtml(p.content.substring(0, 80)) + '...</span></div>' +
        imgH +
        '<div class="pacts">' +
          '<button class="pact" onclick="event.stopPropagation();likeP(this,' + p.id + ')">' +
            '<span class="pi">♡</span> ' + p.likes +
          '</button>' +
          '<button class="pact">' +
            '<span class="pi">💬</span> ' + (p.comments ? p.comments.length : 0) +
          '</button>' +
          '<button class="pact" onclick="event.stopPropagation();toast(\'已分享\')">' +
            '<span class="pi">↗</span> 分享' +
          '</button>' +
        '</div>' +
        '</div>';
    }
    list.innerHTML = h;
  }

  function fZone(tag, el) {
    var chips = document.querySelectorAll('#z-chips .zc');
    for (var i = 0; i < chips.length; i++) { chips[i].classList.remove('on'); }
    if (el) el.classList.add('on');

    var filtered = [];
    if (tag === '全部') {
      filtered = POSTS;
    } else {
      for (var i = 0; i < POSTS.length; i++) {
        if (POSTS[i].tag === tag) filtered.push(POSTS[i]);
      }
    }
    renderPosts(filtered);

    var titleEl = document.getElementById('posts-t');
    if (titleEl) {
      if (tag === '全部') {
        titleEl.innerHTML = '📝 知识分享';
      } else {
        var zone = null;
        for (var j = 0; j < ZONES.length; j++) {
          if (ZONES[j].tag === tag) { zone = ZONES[j]; break; }
        }
        titleEl.innerHTML = '📝 ' + (zone ? zone.icon : '') + ' ' + escHtml(tag) + '专区';
      }
    }
  }

  function doSearch() {
    var input = document.getElementById('h-search');
    if (!input) return;
    var q = input.value.trim().toLowerCase();
    var filtered = [];
    if (!q) {
      filtered = POSTS;
    } else {
      for (var i = 0; i < POSTS.length; i++) {
        var p = POSTS[i];
        if ((p.title && p.title.toLowerCase().indexOf(q) !== -1) ||
          (p.content && p.content.toLowerCase().indexOf(q) !== -1) ||
          (p.tag && p.tag.toLowerCase().indexOf(q) !== -1) ||
          (p.author && p.author.toLowerCase().indexOf(q) !== -1)) {
          filtered.push(p);
        }
      }
    }
    renderPosts(filtered);
  }

  function likeP(btn, id) {
    if (!btn) return;
    var liked = btn.classList.toggle('lk');
    var post = null;
    for (var i = 0; i < POSTS.length; i++) {
      if (POSTS[i].id === id) { post = POSTS[i]; break; }
    }
    if (!post) return;
    var num = liked ? post.likes + 1 : post.likes;
    var icon = liked ? '♥' : '♡';
    btn.innerHTML = '<span class="pi">' + icon + '</span> ' + num;
  }

  /* ==================== 帖子详情 ==================== */

  function openPost(id) {
    curPost = null;
    for (var i = 0; i < POSTS.length; i++) {
      if (POSTS[i].id === id) { curPost = POSTS[i]; break; }
    }
    if (!curPost) return;
    var p = curPost;
    var avatarSrc = p.avatar ? ('assets/images/' + p.avatar) : 'assets/images/avatar-boy.svg';

    var imgH = p.hasImg ?
      '<img src="assets/images/placeholder-post.svg" alt="配图" style="width:100%;border-radius:12px;margin-top:16px">' : '';

    var cmtH = '';
    if (p.comments) {
      for (var i = 0; i < p.comments.length; i++) {
        var c = p.comments[i];
        var cAvatar = c.avatar ? ('assets/images/' + c.avatar) : 'assets/images/avatar-boy.svg';
        cmtH += '<div class="ci">' +
          '<img src="' + cAvatar + '" alt="" class="cav">' +
          '<div class="cb">' +
            '<div class="cn">' + escHtml(c.author) + '</div>' +
            '<div class="cx">' + escHtml(c.text) + '</div>' +
            '<div class="ct">' + escHtml(c.time) + '</div>' +
          '</div>' +
          '</div>';
      }
    }

    var body = document.getElementById('pd-body');
    if (!body) return;
    body.innerHTML =
      '<div style="padding:16px">' +
        '<div class="pa" style="margin-bottom:16px">' +
          '<img src="' + avatarSrc + '" alt="" style="width:44px;height:44px;border-radius:50%;object-fit:cover">' +
          '<div class="pai">' +
            '<div class="pan" style="font-size:16px">' + escHtml(p.author) + ' <span class="pt">' + escHtml(p.tag) + '</span></div>' +
            '<div class="pm">' + escHtml(p.school) + ' · ' + escHtml(p.time) + '</div>' +
          '</div>' +
        '</div>' +
        '<h2 style="font-size:18px;font-weight:800;margin-bottom:12px;line-height:1.4">' + escHtml(p.title) + '</h2>' +
        '<div style="font-size:15px;line-height:1.7;color:#374151;white-space:pre-wrap">' + escHtml(p.content) + '</div>' +
        imgH +
        '<div style="display:flex;gap:20px;padding:16px 0;border-top:1px solid #E0ECE3;margin-top:20px">' +
          '<button class="pact" onclick="this.classList.toggle(\'lk\')"><span class="pi">♡</span> ' + p.likes + '</button>' +
          '<button class="pact"><span class="pi">💬</span> ' + (p.comments ? p.comments.length : 0) + ' 评论</button>' +
          '<button class="pact" onclick="toast(\'已收藏\')"><span class="pi">⭐</span> 收藏</button>' +
        '</div>' +
        '<div style="font-size:14px;font-weight:700;margin:16px 0 12px">评论 (' + (p.comments ? p.comments.length : 0) + ')</div>' +
      '</div>' +
      '<div class="cl" id="cmt-list">' + cmtH + '</div>';

    go('P-pd');
  }

  function sendCmt() {
    var input = document.getElementById('c-input');
    if (!input || !curPost) return;
    var text = input.value.trim();
    if (!text) return;

    curPost.comments.push({ author: '小明', avatar: 'avatar-boy.svg', text: text, time: '刚刚' });

    var list = document.getElementById('cmt-list');
    if (list) {
      var div = document.createElement('div');
      div.className = 'ci fi-anim';
      div.innerHTML =
        '<img src="assets/images/avatar-boy.svg" alt="" class="cav">' +
        '<div class="cb">' +
          '<div class="cn">小明</div>' +
          '<div class="cx">' + escHtml(text) + '</div>' +
          '<div class="ct">刚刚</div>' +
        '</div>';
      list.appendChild(div);
      list.scrollIntoView({ behavior: 'smooth' });
    }
    input.value = '';
    toast('评论发布成功');
  }

  /* ==================== 兴趣小组列表 ==================== */

  function renderGroups() {
    tabs('tab-groups', 2);
    var list = document.getElementById('g-list');
    if (!list) return;
    var h = '';
    for (var i = 0; i < GROUPS.length; i++) {
      h += buildGroupCard(GROUPS[i]);
    }
    list.innerHTML = h;
  }

  /* ==================== 小组详情 ==================== */

  function openGrp(id) {
    curGid = id;
    var g = null;
    for (var i = 0; i < GROUPS.length; i++) {
      if (GROUPS[i].id === id) { g = GROUPS[i]; break; }
    }
    if (!g) return;

    document.getElementById('gd-t').textContent = g.name;

    /* --- 日历 --- */
    var today = new Date().getDate();
    var checkedDays = [1, 2, 3, 5, 6, 7, today > 1 ? today - 1 : 0];
    var calH = '<div class="cal">';
    var dayNames = ['日', '一', '二', '三', '四', '五', '六'];
    for (var d = 0; d < 7; d++) calH += '<div class="ch">' + dayNames[d] + '</div>';
    var firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay();
    var daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    for (var e = 0; e < firstDay; e++) calH += '<div></div>';
    for (var dd = 1; dd <= daysInMonth; dd++) {
      var cls = 'cd';
      var isCk = false;
      for (var c = 0; c < checkedDays.length; c++) { if (checkedDays[c] === dd) { isCk = true; break; } }
      if (isCk) cls += ' ck';
      if (dd === today) cls += ' td';
      calH += '<div class="' + cls + '">' + dd + '</div>';
    }
    calH += '</div>';

    /* --- AI 历史消息 --- */
    var aiH = '';
    if (g.aiHistory) {
      for (var a = 0; a < g.aiHistory.length; a++) {
        var m = g.aiHistory[a];
        var isUser = m.role === 'user';
        aiH += '<div class="am ' + (isUser ? 'usr' : 'bot') + '">' +
          '<div class="ama">' + (isUser ? '👦' : '🤖') + '</div>' +
          '<div class="amb" style="white-space:pre-wrap">' + escHtml(m.text) + '</div>' +
          '</div>';
      }
    }

    /* --- 任务列表 --- */
    var taskH = '';
    if (g.tasks) {
      for (var t = 0; t < g.tasks.length; t++) {
        taskH += '<div class="task-item" onclick="toggleTask(this)">' +
          '<span class="tk1">⬜</span>' +
          '<span class="tk2">' + escHtml(g.tasks[t]) + '</span>' +
          '</div>';
      }
    }

    var body = document.getElementById('gd-body');
    if (!body) return;
    body.innerHTML =
      /* 头部 */
      '<div class="gdh">' +
        '<div class="gdt">' +
          '<div class="gdi">' + g.icon + '</div>' +
          '<div>' +
            '<div class="gdn">' + escHtml(g.name) + '</div>' +
            '<div class="gdm">👥 ' + g.members + ' 成员 · 📝 ' + g.posts + ' 帖子</div>' +
          '</div>' +
        '</div>' +
        '<div style="font-size:13px;opacity:.9;line-height:1.5">' + escHtml(g.desc) + '</div>' +
      '</div>' +
      /* Tabs */
      '<div class="gtabs">' +
        '<button class="gtab on" onclick="gTab(this,\'gtc-f\')">📂 动态</button>' +
        '<button class="gtab" onclick="gTab(this,\'gtc-c\')">✅ 打卡</button>' +
        '<button class="gtab" onclick="gTab(this,\'gtc-a\')">🤖 AI答疑</button>' +
        '<button class="gtab" onclick="gTab(this,\'gtc-t\')">📋 任务</button>' +
      '</div>' +
      /* 动态 */
      '<div class="gtc on" id="gtc-f" style="padding:16px;padding-bottom:20px">' +
        '<div style="text-align:center;padding:40px 0;color:#9CA3AF;font-size:14px">' +
          '📂 小组内的私密交流动态<br>' +
          '<span style="font-size:12px">（仅小组成员可见，需平台审核后开放）</span>' +
        '</div>' +
        '<div class="warn-card">' +
          '<span class="wc1">📢</span>' +
          '<div class="wc2">' +
            '<div class="wc3">活动申请需平台审核报备</div>' +
            '<div class="wc4">线下活动发布后将在 24 小时内完成安全审核</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      /* 打卡 */
      '<div class="gtc" id="gtc-c" style="display:none">' +
        '<div class="ckc fi-anim">' +
          '<div style="font-size:14px;font-weight:600;color:#6B7280;margin-bottom:8px">本月连续打卡</div>' +
          '<div class="ckn" id="streak-n">7</div>' +
          '<div class="ckl">天 🔥</div>' +
          '<button class="ckb" id="ck-btn" onclick="doCk()">今日打卡</button>' +
        '</div>' +
        calH +
      '</div>' +
      /* AI 答疑 */
      '<div class="gtc" id="gtc-a" style="display:none">' +
        '<div class="aic">' +
          '<div class="aims" id="ai-msgs">' + aiH + '</div>' +
          '<div class="aib">' +
            '<input type="text" placeholder="向 AI 助教提问..." id="ai-inp" class="fi" style="border-radius:99px" onkeypress="if(event.key===\'Enter\')sendAI()">' +
            '<button class="csb" onclick="sendAI()">➤</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      /* 任务 */
      '<div class="gtc" id="gtc-t" style="display:none;padding:16px">' +
        '<div style="font-size:14px;font-weight:600;color:#6B7280;margin-bottom:12px">当前打卡任务</div>' +
        taskH +
        '<div class="tip-card">' +
          '<span class="tp1">💡</span>' +
          '<div class="tp2">' +
            '<div class="tp3">完成打卡任务可获得社区徽章</div>' +
            '<div class="tp4">连续打卡 7 天获得"坚持之星"徽章</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    go('P-gd');
  }

  function gTab(btn, tabId) {
    var tabs = document.querySelectorAll('.gtab');
    for (var i = 0; i < tabs.length; i++) { tabs[i].classList.remove('on'); }
    btn.classList.add('on');

    var panes = document.querySelectorAll('.gtc');
    for (var j = 0; j < panes.length; j++) { panes[j].classList.remove('on'); panes[j].style.display = 'none'; }

    var target = document.getElementById(tabId);
    if (target) {
      target.style.display = tabId === 'gtc-a' ? 'flex' : 'block';
      target.classList.add('on');
    }

    if (tabId === 'gtc-a') {
      var msgs = document.getElementById('ai-msgs');
      if (msgs) msgs.scrollTop = msgs.scrollHeight;
    }
  }

  function doCk() {
    if (ckToday) return;
    ckToday = true;
    var btn = document.getElementById('ck-btn');
    if (btn) { btn.classList.add('dn'); btn.textContent = '已打卡 ✓'; }
    var streak = document.getElementById('streak-n');
    if (streak) streak.textContent = parseInt(streak.textContent, 10) + 1;
    toast('🎉 打卡成功！连续 8 天');
    confetti();
  }

  function toggleTask(el) {
    var icon = el.querySelector('.tk1');
    if (!icon) return;
    if (icon.textContent === '⬜') {
      icon.textContent = '☑️';
      el.style.opacity = '0.5';
    } else {
      icon.textContent = '⬜';
      el.style.opacity = '1';
    }
    toast('任务状态已更新');
  }

  function sendAI() {
    var inp = document.getElementById('ai-inp');
    if (!inp) return;
    var text = inp.value.trim();
    if (!text) return;

    var g = null;
    for (var i = 0; i < GROUPS.length; i++) {
      if (GROUPS[i].id === curGid) { g = GROUPS[i]; break; }
    }
    if (!g) return;

    var msgs = document.getElementById('ai-msgs');
    if (!msgs) return;

    /* 用户消息 */
    var uDiv = document.createElement('div');
    uDiv.className = 'am usr fi-anim';
    uDiv.innerHTML = '<div class="ama">👦</div><div class="amb">' + escHtml(text) + '</div>';
    msgs.appendChild(uDiv);
    inp.value = '';
    msgs.scrollTop = msgs.scrollHeight;

    /* 打字指示器 */
    var typingId = 'typing-' + Date.now();
    var tDiv = document.createElement('div');
    tDiv.className = 'am bot';
    tDiv.id = typingId;
    tDiv.innerHTML = '<div class="ama">🤖</div><div class="atp"><span></span><span></span><span></span></div>';
    msgs.appendChild(tDiv);
    msgs.scrollTop = msgs.scrollHeight;

    /* AI 回复 */
    setTimeout(function () {
      var el = document.getElementById(typingId);
      if (!el) return;
      var responses = g.aiResponses || ['这是一个好问题，让我想想...'];
      var answer = responses[Math.floor(Math.random() * responses.length)];
      el.innerHTML = '<div class="ama">🤖</div><div class="amb" style="white-space:pre-wrap">' + escHtml(answer) + '</div>';
      msgs.scrollTop = msgs.scrollHeight;
    }, 1200);
  }

  /* ==================== 个人中心 ==================== */

  function renderProfile() {
    /* 兴趣标签 */
    var tagsEl = document.getElementById('me-tags');
    if (tagsEl) {
      var h = '';
      for (var i = 0; i < selInt.length; i++) {
        var zone = null;
        for (var j = 0; j < ZONES.length; j++) {
          if (ZONES[j].tag === selInt[i]) { zone = ZONES[j]; break; }
        }
        var icon = zone ? zone.icon : '📌';
        h += '<span style="display:inline-block;padding:6px 14px;border-radius:99px;background:#ECFDF5;color:#10B981;font-size:13px;font-weight:600">' +
          icon + ' ' + escHtml(selInt[i]) + '</span>';
      }
      tagsEl.innerHTML = h;
    }

    /* 我的帖子 */
    var postsEl = document.getElementById('me-posts');
    if (postsEl) {
      var ph = '';
      for (var k = 0; k < POSTS.length; k++) {
        if (POSTS[k].author === '小明') {
          var p = POSTS[k];
          ph += '<div class="pc fi-anim" onclick="openPost(' + p.id + ')">' +
            '<div class="pa">' +
              '<img src="assets/images/avatar-boy.svg" alt="" class="pav">' +
              '<div class="pai">' +
                '<div class="pan">' + escHtml(p.author) + ' <span class="pt">' + escHtml(p.tag) + '</span></div>' +
                '<div class="pm">' + escHtml(p.time) + '</div>' +
              '</div>' +
            '</div>' +
            '<div class="pco"><strong>' + escHtml(p.title) + '</strong></div>' +
            '</div>';
        }
      }
      postsEl.innerHTML = ph;
    }
  }

  /* ==================== 初始化 ==================== */

  document.addEventListener('DOMContentLoaded', function () {
    renderInt();
    renderGroups();
    tabs('tab-hall', 0);
    tabs('tab-msg', 1);
    tabs('tab-me', 3);
    renderProfile();
  });

  /* 暴露全局函数供 HTML onclick 调用 */
  window.go = go;
  window.sTab = sTab;
  window.tabs = tabs;
  window.toast = toast;
  window.goReg2 = goReg2;
  window.doUpload = doUpload;
  window.doSubmit = doSubmit;
  window.renderInt = renderInt;
  window.togInt = togInt;
  window.enterHall = enterHall;
  window.renderHall = renderHall;
  window.fZone = fZone;
  window.doSearch = doSearch;
  window.likeP = likeP;
  window.openPost = openPost;
  window.sendCmt = sendCmt;
  window.renderGroups = renderGroups;
  window.openGrp = openGrp;
  window.gTab = gTab;
  window.doCk = doCk;
  window.toggleTask = toggleTask;
  window.sendAI = sendAI;
  window.openCreateGrp = openCreateGrp;
  window.pickIcon = pickIcon;
  window.submitCreateGrp = submitCreateGrp;
  window.openJoinApply = openJoinApply;
  window.submitJoinApply = submitJoinApply;
  window.updateCharCount = updateCharCount;
})();