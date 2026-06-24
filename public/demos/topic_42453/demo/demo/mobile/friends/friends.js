/* =========================================================================
 * 「知行」App 本体 Demo —— Phase 4 / 好友页逻辑（friends.js）
 * -------------------------------------------------------------------------
 * 职责：
 *   1. 视图栈：list（默认 · 好友 / 群聊 / 团队 三 segment 切换）
 *               → chat（1对1 · 全屏覆盖 · 隐藏底部 tab）
 *               → group（群聊 · 全屏覆盖）
 *               → add（添加好友 · 全屏覆盖 · 含二维码 + 推荐关注）
 *   2. 好友列表：「我的好友」· 左滑（hover）置顶/删除 · 长按备注/免打扰/删除
 *   3. 群聊列表：3 类群（学习小组 / 主题讨论 / 项目协作）
 *   4. 团队列表：协作主体（成员/管理员角色 + 成员数 + 描述）
 *   5. 1对1 / 群聊：消息流 · 笔记分享卡 · 讨论邀请卡 · @提及 · 群公告 · 共享笔记
 *   6. AI 介入：顶栏 ✦ → 顶部出现「AI 正在旁观你们的对话」状态条，
 *               此后每发送 2 条用户消息，AI 主动插话一条 mock 建议
 *   7. 访客视角：聊天页 / 添加好友页点头像 → switchTab('profile') + toast
 * 依赖：../../demo/shared/icons.js（ZX.icon）、../../demo/shared/mock-data.js（ZX_MOCK）
 * 挂载：window.ZX_FRIENDS
 * 约束：原生 JS + 事件委托，无框架，无 alert/prompt/confirm
 * =======================================================================*/

(function () {
  'use strict';

  /* ----------------------------- 工具 ----------------------------- */

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }
  function svg(inner, size) {
    size = size || 22;
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" '
      + 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" '
      + 'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'
      + inner + '</svg>';
  }
  function zicon(name, size) {
    return (window.ZX && typeof window.ZX.icon === 'function')
      ? window.ZX.icon(name, size || 22)
      : svg('', size);
  }

  /* —— 本页用到的图标（部分沿用 ZX.icon 库，部分内联） —— */
  var IC = {
    back:    function () { return zicon('arrow-left'); },
    plus:    function () { return zicon('plus'); },
    search:  function () { return zicon('search'); },
    spark:   function () { return zicon('spark'); },
    bell:    function () { return svg('<path d="M6 8a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6z"/><path d="M10.5 19a1.8 1.8 0 0 0 3 0"/>'); },
    gear:    function () { return svg('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>'); },
    more:    function () { return svg('<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>'); },
    clip:    function () { return svg('<path d="M21 11.5l-8.2 8.2a5 5 0 0 1-7.1-7.1l8.8-8.8a3.3 3.3 0 0 1 4.7 4.7l-8.3 8.3a1.6 1.6 0 0 1-2.3-2.3l7.1-7.1"/>'); },
    send:    function () { return zicon('arrow-up'); },
    note:    function () { return svg('<path d="M6 4h10a1.5 1.5 0 0 1 1.5 1.5v14a1 1 0 0 0-1-1H6z"/><path d="M17.5 5.5H19a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-1.5"/><path d="M9 8h5M9 11h5"/>'); },
    vs:      function () { return svg('<path d="M7 4l-3 8 3 8"/><path d="M17 4l3 8-3 8"/>'); },
    image:   function () { return svg('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5L5 20"/>'); },
    pencil:  function () { return svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>'); },
    forbid:  function () { return svg('<circle cx="12" cy="12" r="9"/><path d="M5.5 5.5l13 13"/>'); },
    trash:   function () { return svg('<path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6 7l1 13h10l1-13"/>'); },
    pin:     function () { return svg('<path d="M12 2v8"/><path d="M8 10h8l-2 5-2 7-2-7z"/>'); },
    doc:     function () { return svg('<path d="M14 3v5h5"/><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>'); }
  };

  /* ----------------------------- Mock 数据来源 ----------------------------- */

  function mock() {
    return window.ZX_MOCK || (window.ZX && window.ZX.mock) || { users: [], notes: [] };
  }
  function users() { return mock().users || []; }
  function userById(id) {
    var us = users();
    for (var i = 0; i < us.length; i++) { if (us[i].id === id) return us[i]; }
    return null;
  }
  function noteById(id) {
    var ns = mock().notes || [];
    for (var i = 0; i < ns.length; i++) { if (ns[i].id === id) return ns[i]; }
    return null;
  }
  function nowHHMM() {
    var d = new Date();
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  /* ----------------------------- 内联 Mock：1对1 / 群聊 -----------------------------
   * 1对1 消息按 chatId（peerId）取；群消息按 groupId 取
   * 消息字段：role (peer | me | ai | sys) · text? · kind? (text | note | debate)
   *           · authorId? · noteId? · debateTitle? · pro? · con? · time · date?
   * -------------------------------------------------------------------------- */

  var ME_ID = 'u-me';

  /* —— 好友分组（可变，支持 CRUD）+ 屏蔽/静音 —— */
  state = state || {};
  state.isTeamChat = false;   /* Task 12：默认非团队聊天（群聊/团队聊天复用 group 视图，靠此标记区分） */
  state.addTab = 'friend';    /* Task 4：添加页当前 tab —— friend | group | team */
  state.groups = [
    { id: 'g-academic',  name: '学界朋友', memberIds: ['u-shenyan','u-hanxing','u-zhouye','u-guci','u-liqy'] },
    { id: 'g-colleague', name: '同事',     memberIds: ['u-linzw','u-zhangheng','u-suqing'] },
    { id: 'g-study',     name: '研习社',   memberIds: ['u-chenmb','u-jiangyue','u-zhouye'] }
  ];
  state.blocked = [
    { uid: 'u-blocked-1', name: '某屏蔽用户', blockedAt: '2026-06-01' }
  ];
  state.muted = [
    { uid: 'u-muted-1', name: '某静音用户', mutedAt: '2026-06-10' }
  ];
  state.friendsView = 'list';  /* 双视图：list | group（Task 2.2） */

  /* 兼容旧 FRIEND_GROUPS.partners 引用 */
  var FRIEND_GROUPS = {
    partners: state.groups.reduce(function (arr, g) { return arr.concat(g.memberIds); }, []),
    recommends: [
      { id: 'u-liqy',     reason: '也在考研，方法论控，焦虑时互相打气很合适。' },
      { id: 'u-hanxing',  reason: '健身+编程双修，自律达人，能带你一起打卡。' },
      { id: 'u-guci',     reason: '认知科学视角，爱聊思维模型，讨论问题很带感。' },
      { id: 'u-zhouye',   reason: '全职科普 UP 主，十万粉，能把复杂的事说简单。' }
    ]
  };

  /* —— 用户名称覆盖（已停用：u-linzw 恢复为真实用户「林知微」） ——
   * 保留 patchAIUserNames 以备后续独立的 AI 角色（如 u-ai-helper）使用
   */
  var AI_USER_OVERRIDES = {};
  function patchAIUserNames() {
    var us = users();
    for (var i = 0; i < us.length; i++) {
      var o = AI_USER_OVERRIDES[us[i].id];
      if (o) {
        if (o.name) us[i].name = o.name;
        if (o.initials) us[i].initials = o.initials;
      }
    }
  }

  /* —— 好友在线状态 / 未读 mock —— */
  var FRIEND_STATE = {
    'u-linzw':    { online: true,  last: '在线',           unread: 2 },
    'u-zhangheng':{ online: false, last: '15 分钟前',      unread: 0 },
    'u-suqing':   { online: true,  last: '在线',           unread: 0 },
    'u-chenmb':   { online: false, last: '1 小时前',       unread: 1 },
    'u-jiangyue': { online: true,  last: '在线',           unread: 0 },
    'u-shenyan':  { online: false, last: '昨天 22:14',     unread: 3 },
    'u-hanxing':  { online: false, last: '2 小时前',       unread: 0 },
    'u-zhouye':   { online: true,  last: '在线',           unread: 0 },
    'u-guci':     { online: false, last: '昨天',           unread: 0 },
    'u-liqy':     { online: true,  last: '在线',           unread: 1 }
  };

  /* —— 最近点击顺序：点击好友后置顶（Task 5） —— */
  var recentClickOrder = [];

  /* —— 1对1 消息（key = peerId） —— */
  var MOCK_CHATS = {
    'u-linzw': [
      { role: 'sys',  text: '你们因为《固态电池界面阻抗的真相》成为知识伙伴', time: '3 天前' },
      { role: 'peer', authorId: 'u-linzw', text: '你昨天在那篇固态电池笔记下问的问题挺到位的，3nm 涂层这块争议确实大。', time: '09:12' },
      { role: 'me',   text: '我刚接触这块，Wang 2024 那个 3nm 的数据靠谱吗？', time: '09:14' },
      { role: 'peer', authorId: 'u-linzw', kind: 'note', noteId: 'n-solid-battery-impedance', time: '09:15' },
      { role: 'peer', authorId: 'u-linzw', text: '我把这条线索整理在这篇里了，尽量用大白话写的，你可以对照张衡老师的硫化物 vs 氧化物一起读。', time: '09:15' },
      { role: 'me',   text: '好，我读完。其实我想发起一个讨论，让大家来投投票。', time: '09:18' },
      { role: 'peer', authorId: 'u-linzw', kind: 'debate', debateTitle: '界面阻抗是不是被高估了？', pro: 40, con: 60, time: '09:20' }
    ],
    'u-suqing': [
      { role: 'sys',  text: '苏青加入了对话', time: '昨天' },
      { role: 'peer', authorId: 'u-suqing', text: '厂里产线最近在爬良率，固态电池的界面工艺真的比液态难一个数量级。', time: '昨天 14:30' },
      { role: 'me',   text: '那半固态和全固态现在差多少？', time: '昨天 14:33' },
      { role: 'peer', authorId: 'u-suqing', text: '半固态成熟太多了，全固态还在中试。具体的数我不方便说，但方向是这样。', time: '昨天 14:34' },
      { role: 'peer', authorId: 'u-suqing', text: '对了，我最近还在写一篇月光族存钱的笔记，打工人也得管钱，你感兴趣可以看看。', time: '昨天 14:35' },
      { role: 'peer', authorId: 'u-suqing', kind: 'note', noteId: 'n-moonlight-saver-ledger', time: '昨天 14:35' }
    ],
    'u-chenmb': [
      { role: 'peer', authorId: 'u-chenmb', text: '今天又加班到九点，回家只想撸猫。我家那只橘猫最近胖成球了。', time: '10:02' },
      { role: 'me',   text: '哈哈科研狗的日常。你那个懒人做饭攻略我试了，真香。', time: '10:05' },
      { role: 'peer', authorId: 'u-chenmb', kind: 'note', noteId: 'n-lazy-weekly-cooking', time: '10:06' },
      { role: 'peer', authorId: 'u-chenmb', text: '这套真的能坚持，我吃了两个月没腻。周末备菜一小时，工作日开饭 20 分钟。', time: '10:07' }
    ],
    'u-shenyan': [
      { role: 'peer', authorId: 'u-shenyan', text: '最近在写一篇关于短视频上瘾的东西，写到一半发现我自己也在刷。', time: '昨天 22:10' },
      { role: 'me',   text: '哈哈，写的人也逃不过。', time: '昨天 22:12' },
      { role: 'peer', authorId: 'u-shenyan', text: '后来想明白了，这不是意志力问题，是多巴胺被精准投喂了。几百个顶尖工程师在算你。', time: '昨天 22:14' },
      { role: 'peer', authorId: 'u-shenyan', kind: 'note', noteId: 'n-why-cant-stop-short-video', time: '昨天 22:15' },
      { role: 'peer', authorId: 'u-shenyan', text: '极简生活教会我一件事：与其对抗欲望，不如改造环境。把 APP 移到第二屏，比硬扛管用。', time: '昨天 22:16' }
    ],
    'u-zhangheng': [
      { role: 'sys',  text: '你们因为「硫化物 vs 氧化物」的讨论成为知识伙伴', time: '1 周前' },
      { role: 'peer', authorId: 'u-zhangheng', text: '你问我固态电池哪条路线能赢，我只能说：科学共识还没形成，但产业逻辑已经分叉了。', time: '昨天 10:20' },
      { role: 'me',   text: '张老师，您课上讲的那个「先上车再换轮子」是什么意思？', time: '昨天 10:25' },
      { role: 'peer', authorId: 'u-zhangheng', kind: 'note', noteId: 'n-sulfide-vs-oxide', time: '昨天 10:26' },
      { role: 'peer', authorId: 'u-zhangheng', text: '硫化物派强调先落地，氧化物派强调绝对安全。表面是材料取舍，实质是两种产业哲学。', time: '昨天 10:28' },
      { role: 'me',   text: '跟您聊科学总能在最后聊到哲学。', time: '昨天 10:30' },
      { role: 'peer', authorId: 'u-zhangheng', text: '哈哈，科学走到尽头都是哲学问题。这也是我上课爱跑题的原因。', time: '昨天 10:31' }
    ],
    'u-jiangyue': [
      { role: 'peer', authorId: 'u-jiangyue', text: '上周去了趟大理，在洱海边坐了一下午，什么都没想。', time: '今天 08:50' },
      { role: 'me',   text: '羡慕，我最近被考研压得喘不过气。', time: '今天 08:55' },
      { role: 'peer', authorId: 'u-jiangyue', text: '考研是马拉松，别把自己逼太紧。能允许自己停下来的人，反而走得远。', time: '今天 09:01' },
      { role: 'peer', authorId: 'u-jiangyue', text: '其实情感博主不是教你坚强，是教你承认自己也会脆弱。脆弱本身不可耻。', time: '今天 09:02' }
    ],
    'u-hanxing': [
      { role: 'peer', authorId: 'u-hanxing', text: '今天卧推 PR 了，80kg×5，爽。白天写了一天代码，晚上举铁才是真生活。', time: '2 小时前' },
      { role: 'me',   text: '厉害，我才刚开始练，第一个月都不知道怎么安排。', time: '2 小时前' },
      { role: 'peer', authorId: 'u-hanxing', kind: 'note', noteId: 'n-gym-beginner-mistakes', time: '2 小时前' },
      { role: 'peer', authorId: 'u-hanxing', text: '新手第一个月最容易栽坑，我写过一篇避坑指南。记住一个原则：先把动作练标准，重量是后面自然而然的事。', time: '2 小时前' }
    ],
    'u-zhouye': [
      { role: 'peer', authorId: 'u-zhouye', text: '哥们儿！我那条量子力学的视频爆了，三天涨了两万粉，现在十万了！', time: '昨天' },
      { role: 'me',   text: '牛啊恭喜恭喜。', time: '昨天' },
      { role: 'peer', authorId: 'u-zhouye', kind: 'note', noteId: 'n-quantum-counterintuitive-facts', time: '昨天' },
      { role: 'peer', authorId: 'u-zhouye', text: '就是这条，我赌它能破百万播放。做科普最难的不是懂，是怎么把硬核的东西讲成人话。', time: '昨天' },
      { role: 'me',   text: '你确实有这本事，我看完都觉得自己懂了点量子力学。', time: '昨天' },
      { role: 'peer', authorId: 'u-zhouye', text: '哈哈那是你的错觉，量子力学没人真懂。但我能让你产生「我懂了」的错觉，这就是我的价值。', time: '昨天' }
    ],
    'u-guci': [
      { role: 'peer', authorId: 'u-guci', text: '我最近在写一个老问题：先有鸡还是先有蛋。听起来像抬杠，但认真想下去会一路带到进化论和因果的时间方向。', time: '昨天' },
      { role: 'me',   text: '这问题不是有标准答案吗？先有蛋啊。', time: '昨天' },
      { role: 'peer', authorId: 'u-guci', kind: 'note', noteId: 'n-chicken-or-egg-first', time: '昨天' },
      { role: 'peer', authorId: 'u-guci', text: '演化生物学的答案确实是先有蛋，但哲学角度的反驳更有意思：你凭什么认定那颗突变后的蛋「属于鸡的蛋」？物种是连续渐变的，「鸡」这个分类本身是人类事后画的线。', time: '昨天' },
      { role: 'me',   text: '这个角度我没想过。所以问题本身问错了？', time: '昨天' },
      { role: 'peer', authorId: 'u-guci', text: '对。真正的价值不在答案，在它逼你思考因果在时间里往哪个方向流。', time: '昨天' }
    ],
    'u-liqy': [
      { role: 'peer', authorId: 'u-liqy', text: '最近焦虑到失眠，二战的阴影又回来了。你备考怎么样？', time: '今天 09:30' },
      { role: 'me',   text: '怎么了？你不是已经上岸了吗？', time: '今天 09:35' },
      { role: 'peer', authorId: 'u-liqy', text: '上岸了但研二压力更大。我把一战踩的坑都写出来了，你正在备考，一定要看。', time: '今天 09:36' },
      { role: 'peer', authorId: 'u-liqy', kind: 'note', noteId: 'n-kaoyan-second-try-lessons', time: '今天 09:36' },
      { role: 'me',   text: '好，我正需要这个。我最近也怕自己又是「自以为努力」。', time: '今天 09:38' },
      { role: 'peer', authorId: 'u-liqy', text: '记住一句话：能稳住节奏的人，才走得完。别比时长，比有效学习时间。我那一年坐 12 小时，有效可能只有 5 小时。', time: '今天 09:39' }
    ]
  };

  /* —— 群聊列表 —— */
  var MOCK_GROUPS = [
    {
      id: 'g-materials-dojo',
      name: '考研互助小分队',
      type: 'study',
      typeLabel: '学习小组',
      avatarColor: '#1D5B7A',
      avatarText: '考',
      members: ['u-liqy', 'u-guci', 'u-hanxing', 'u-chenmb', ME_ID],
      owner: 'u-liqy',            /* Task 10：群主 */
      admins: ['u-guci'],         /* Task 10：管理员 */
      announcement: '本周共读《考研二战上岸：走过的弯路》，周五 20:00 围绕「有效学习时长 vs 自我感动」展开讨论。',
      sharedNotes: ['n-kaoyan-second-try-lessons', 'n-why-cant-stop-short-video'],
      preview: '李轻语：别比时长，比有效学习时间…',
      time: '09:15',
      unread: 5
    },
    {
      id: 'g-impedance-debate',
      name: '先有鸡还是先有蛋',
      type: 'topic',
      typeLabel: '主题讨论',
      avatarColor: '#B4602C',
      avatarText: '辩',
      members: ['u-guci', 'u-zhangheng', 'u-shenyan', 'u-jiangyue', ME_ID],
      owner: 'u-guci',
      admins: [],
      announcement: '顾辞发起：先有鸡还是先有蛋？一个被吵了千年的问题，认真想下去会一路带到进化论和因果的时间方向。',
      sharedNotes: ['n-chicken-or-egg-first', 'n-why-cant-stop-short-video'],
      preview: '顾辞：真正的价值不在答案，在它逼你思考因果…',
      time: '昨天',
      unread: 12
    },
    {
      id: 'g-na-battery-project',
      name: '健身打卡群',
      type: 'project',
      typeLabel: '项目协作',
      avatarColor: '#C7A24A',
      avatarText: '健',
      members: ['u-hanxing', 'u-chenmb', ME_ID],
      owner: 'u-hanxing',
      admins: ['u-chenmb'],
      announcement: '本周任务：每天打卡训练 + 做饭备菜，互相监督别偷懒。陈墨白负责投喂。',
      sharedNotes: ['n-gym-beginner-mistakes', 'n-lazy-weekly-cooking'],
      preview: '韩星：今天卧推 PR 了，80kg×5…',
      time: '2 天前',
      unread: 0
    },
    {
      id: 'g-industry-watch',
      name: '职场情报站',
      type: 'topic',
      typeLabel: '主题讨论',
      avatarColor: '#2A2724',
      avatarText: '职',
      members: ['u-wangshi', 'u-suqing', 'u-zhouye', ME_ID],
      owner: 'u-wangshi',
      admins: [],
      announcement: '持续跟踪 2026 就业市场、行业趋势与打工人怎么管钱。',
      sharedNotes: ['n-2026-graduate-job-guide', 'n-moonlight-saver-ledger'],
      preview: '王石：今年应届生数量再创新高，别再海投简历了…',
      time: '3 天前',
      unread: 0
    }
  ];

  /* —— 团队列表（协作主体：好友=一对一 / 群聊=面向陌生人 / 团队=协作主体） —— */
  var MOCK_TEAMS = [
    {
      id: 't-solid-dojo',
      name: '硬核科普工作室',
      avatarColor: '#1D5B7A',
      avatarText: '科',
      members: 5,
      role: '成员',
      desc: '把硬核知识翻译成人话，每周一篇科普内容',
      memberIds: ['u-linzw', 'u-zhangheng', 'u-zhouye', 'u-suqing'],
      owner: 'u-zhouye',
      admins: ['u-linzw', 'u-zhangheng'],
      unread: 3
    },
    {
      id: 't-impedance',
      name: '生活思考者联盟',
      avatarColor: '#B4602C',
      avatarText: '思',
      members: 4,
      role: '管理员',
      desc: '聊哲学、认知与生活，把日子想清楚',
      memberIds: ['u-shenyan', 'u-guci', 'u-jiangyue'],
      owner: 'u-shenyan',
      admins: ['u-guci'],
      unread: 0
    },
    {
      id: 't-na-team',
      name: '自律打卡小队',
      avatarColor: '#C7A24A',
      avatarText: '律',
      members: 4,
      role: '成员',
      desc: '健身、学习、做饭打卡，互相监督别躺平',
      memberIds: ['u-hanxing', 'u-liqy', 'u-chenmb'],
      owner: 'u-hanxing',
      admins: ['u-liqy'],
      unread: 7
    }
  ];

  /* —— 群聊消息（key = groupId） —— */
  var MOCK_GROUP_CHATS = {
    'g-materials-dojo': [
      { role: 'sys',  text: '你被李轻语邀请加入「考研互助小分队」', time: '5 天前' },
      { role: 'peer', authorId: 'u-liqy',  text: '本周共读《考研二战上岸：走过的弯路》。大家先读完，周五 20:00 围绕「有效学习时长 vs 自我感动」讨论。', time: '周一 09:00' },
      { role: 'peer', authorId: 'u-liqy',  kind: 'note', noteId: 'n-kaoyan-second-try-lessons', time: '周一 09:01' },
      { role: 'peer', authorId: 'u-guci',  text: '我补一个认知科学的角度：很多人不是不努力，是掉进了「伪工作」陷阱——看起来很忙，但没在难的地方发力。', time: '昨天 14:30' },
      { role: 'me',   text: '@李轻语 我最近就是这种状态，坐 10 小时有效可能只有 4 小时。', time: '09:10' },
      { role: 'peer', authorId: 'u-hanxing', text: '我健身也是这个道理，训练 1 小时高质量比摸鱼 3 小时强。自律不是时长，是密度。', time: '09:12' },
      { role: 'peer', authorId: 'u-liqy',  text: '对！所以周五重点聊：怎么把有效学习时间拉长，而不是总时长。', time: '09:13' },
      { role: 'peer', authorId: 'u-chenmb', text: '我负责投喂，周五讨论我带饭。懒人做饭攻略亲测能坚持两个月。', time: '09:15' }
    ],
    'g-impedance-debate': [
      { role: 'sys',  text: '顾辞发起了「先有鸡还是先有蛋」主题讨论', time: '昨天' },
      { role: 'peer', authorId: 'u-guci',     kind: 'note', noteId: 'n-chicken-or-egg-first', time: '昨天 19:00' },
      { role: 'peer', authorId: 'u-guci',     text: '演化生物学的答案是先有蛋，但哲学角度的反驳更有意思：你凭什么认定那颗突变后的蛋「属于鸡的蛋」？', time: '昨天 19:05' },
      { role: 'peer', authorId: 'u-zhangheng', text: '这个问题我课上跟学生聊过。物种是连续渐变的，「鸡」这个分类是人类事后画的线。', time: '昨天 19:10' },
      { role: 'peer', authorId: 'u-shenyan',  text: '更深一层：因果在时间里到底往哪个方向流？我们习惯从因到果，但很多现象其实是反向定义的。', time: '昨天 19:30' },
      { role: 'me',   text: '听完有点怀疑人生，连「先有」这个动作本身都不确定了。', time: '今天 08:45' },
      { role: 'peer', authorId: 'u-jiangyue', text: '哈哈这就是哲学的魅力，不给你答案，但让你重新看问题。', time: '今天 08:50' },
      { role: 'peer', authorId: 'u-guci',     kind: 'debate', debateTitle: '先有鸡还是先有蛋？', pro: 30, con: 70, time: '今天 09:00' }
    ],
    'g-na-battery-project': [
      { role: 'sys',  text: '你加入了「健身打卡群」', time: '3 天前' },
      { role: 'peer', authorId: 'u-hanxing', text: '本周打卡开始！今天我练了胸+三头，卧推 80kg×5。', time: '3 天前 18:00' },
      { role: 'peer', authorId: 'u-chenmb',  text: '我今天跑步 5 公里，然后回家做了三顿懒人饭。运动 + 做饭两不误。', time: '2 天前 20:00' },
      { role: 'peer', authorId: 'u-chenmb',  kind: 'note', noteId: 'n-lazy-weekly-cooking', time: '2 天前 20:01' },
      { role: 'me',   text: '我今天刚开始，跟着韩星的避坑指南练了背。', time: '昨天 21:00' },
      { role: 'peer', authorId: 'u-hanxing', kind: 'note', noteId: 'n-gym-beginner-mistakes', time: '昨天 21:05' },
      { role: 'peer', authorId: 'u-hanxing', text: '新手先把动作练标准，别冲重量。有不懂的随时问。', time: '昨天 21:06' }
    ],
    'g-industry-watch': [
      { role: 'peer', authorId: 'u-wangshi', text: '今年应届生数量再创新高，海投简历几乎是最低效的找工作的方式。', time: '3 天前' },
      { role: 'peer', authorId: 'u-wangshi', kind: 'note', noteId: 'n-2026-graduate-job-guide', time: '3 天前' },
      { role: 'peer', authorId: 'u-suqing',  text: '作为打工人深有体会，当年我也是海投了 200 份才拿到 3 个面试。', time: '2 天前' },
      { role: 'peer', authorId: 'u-zhouye',  text: '做自媒体之后发现，作品比简历管用多了。我那条量子力学视频比我简历上任何一行都值钱。', time: '2 天前' },
      { role: 'me',   text: '记下了，我现在就开始攒作品。', time: '昨天' },
      { role: 'peer', authorId: 'u-wangshi', text: '对，用作品替代学历。一个能直接展示的项目比一纸文凭有说服力得多。', time: '昨天' }
    ]
  };

  /* —— 团队聊天消息（key = teamId）—— Task 12/13：团队与群组严格区分，团队有独立聊天视角 + 共同作品 —— */
  var MOCK_TEAM_CHATS = {
    't-solid-dojo': [
      { role: 'sys',  text: '你加入了团队「硬核科普工作室」', time: '1 周前' },
      { role: 'peer', authorId: 'u-zhouye', text: '本周选题：固态电池为什么这么难量产。我做视频，林知微和张衡老师负责内容把关。', time: '周一 09:00' },
      { role: 'peer', authorId: 'u-linzw', text: '我把界面阻抗这块用大白话拆了一遍，挂在共同作品区了，大家批注。', time: '周一 09:12' },
      { role: 'me',   text: '我可以帮忙做一版面向小白的脚本初稿。', time: '周一 10:30' },
      { role: 'peer', authorId: 'u-suqing', text: '产线视角我补一段：半固态和全固态差的不是一星半点，别让外行以为明年就能量产。', time: '周二 14:00' }
    ],
    't-impedance': [
      { role: 'sys',  text: '你加入了团队「生活思考者联盟」', time: '3 天前' },
      { role: 'peer', authorId: 'u-shenyan', text: '本周主题：为什么我们停不下刷短视频。我写了一篇初稿，大家看看。', time: '今天 09:00' },
      { role: 'peer', authorId: 'u-guci', text: '我从认知科学角度补一段：多巴胺的间歇性奖励机制，跟老虎机一个原理。', time: '今天 09:15' },
      { role: 'peer', authorId: 'u-jiangyue', text: '我从情感角度加一段：很多时候刷视频不是想看，是在逃避什么。', time: '今天 09:30' }
    ],
    't-na-team': [
      { role: 'sys',  text: '你加入了团队「自律打卡小队」', time: '5 天前' },
      { role: 'peer', authorId: 'u-hanxing', text: '本周打卡目标：训练 4 次 + 自己做饭 3 顿。做不到的发红包。', time: '2 天前' },
      { role: 'peer', authorId: 'u-liqy', text: '我加一条：有效学习 25 小时。考研党不能躺。', time: '2 天前' },
      { role: 'peer', authorId: 'u-chenmb', text: '做饭我包了，懒人攻略已经备好菜。你们练完来我家吃。', time: '昨天' },
      { role: 'me',   text: '我认领训练 3 次 + 学习 20 小时。', time: '昨天' }
    ]
  };

  /* —— 团队共同作品（key = teamId）：笔记 + 工作流 + 报告 —— */
  var MOCK_TEAM_WORKS = {
    't-solid-dojo': [
      { type: 'note', title: '固态电池界面阻抗大白话拆解', author: '林知微', time: '2 天前' },
      { type: 'note', title: '硫化物 vs 氧化物路线对比', author: '张衡', time: '3 天前' },
      { type: 'workflow', title: '每周科普内容生产流程', author: '团队', time: '1 周前' },
      { type: 'report', title: '固态电池量产路线图 v1', author: '苏青', time: '5 天前' }
    ],
    't-impedance': [
      { type: 'note', title: '为什么我们停不下刷短视频', author: '沈砚', time: '今天' },
      { type: 'note', title: '多巴胺与间歇性奖励机制', author: '顾辞', time: '昨天' },
      { type: 'report', title: '短视频脱瘾方法报告 v1', author: '江月', time: '昨天' }
    ],
    't-na-team': [
      { type: 'note', title: '健身新手避坑指南', author: '韩星', time: '2 天前' },
      { type: 'note', title: '懒人一周做饭攻略', author: '陈墨白', time: '3 天前' },
      { type: 'workflow', title: '每周自律打卡流程', author: '团队', time: '4 天前' }
    ]
  };

  /* —— AI 介入时会生成的插话（轮转 mock） —— */
  var AI_INTERJECTIONS_1ON1 = [
    '你们聊到了「有效努力 vs 自我感动」这个点，挺多人都会踩。我整理了几个判断有效学习/工作的方法，挂在笔记区，要不要看看？',
    '从对话看，你们在「怎么定义有效」上有不同看法。我建议把「时长」和「产出」拆成两栏再聊，会更清楚。',
    '我可以把你们这段对话沉淀为一张笔记，标 tag「待复盘 · 生活方法」，方便以后回看。'
  ];
  var AI_INTERJECTIONS_GROUP = [
    '群里目前聚焦在「怎么把日子过好」这个大主题。我整理了大家提到的 3 个切入点——学习方法、自律习惯、管钱思路，挂在共享笔记区，欢迎补充。',
    '@我 随时可以拉一组相关笔记的对照表。要不要先把大家各自的方法论基准对齐一下？',
    '从讨论看，「有效 vs 自我感动」这个分歧值得专门立一个讨论卡。@李轻语 你那条考研复盘正好能做引子吧？'
  ];

  /* —— 添加好友 mock 推荐列表（去重已关注） —— */
  function addRecommendList() {
    var exist = {};
    FRIEND_GROUPS.partners.forEach(function (id) { exist[id] = true; });
    FRIEND_GROUPS.recommends.forEach(function (r) { exist[r.id] = true; });
    return users().filter(function (u) { return u.id !== ME_ID && !exist[u.id]; });
  }

  /* ----------------------------- 渲染：好友/群/团队行 ----------------------------- */

  function avatarHtml(u, cls) {
    cls = cls || '';
    var color = (u && u.avatarColor) || '#6B655C';
    var text = (u && (u.initials || u.name)) || '?';
    return '<span class="fr-avatar ' + cls + '" style="background:' + color + '">' + escapeHtml(text) + '</span>';
  }

  /* 带徽章的头像：在线点（右下角）+ 未读数（右上角），均绝对定位，位置固定不互相影响 */
  function avatarWithBadges(u, state) {
    var online = state && state.online;
    var unread = state ? state.unread : 0;
    var color = (u && u.avatarColor) || '#6B655C';
    var text = (u && (u.initials || u.name)) || '?';
    var dotCls = online ? '' : 'is-offline';
    return '<span class="fr-avatar fr-avatar--badged">'
      + '<span class="fr-avatar__face" style="background:' + color + '">' + escapeHtml(text) + '</span>'
      + '<span class="fr-avatar__dot ' + dotCls + '" aria-label="' + (online ? '在线' : '离线') + '"></span>'
      + (unread > 0 ? '<span class="fr-avatar__unread">' + unread + '</span>' : '')
      + '</span>';
  }

  /* renderFriendRow：在线点 + 未读红点贴在头像上（位置固定），meta 行只保留时间 */
  function renderFriendRow(u, state) {
    var last = state ? state.last : '';
    var metaHtml = '<span class="fr-row__time">' + escapeHtml(last || '') + '</span>';
    return ''
      + avatarWithBadges(u, state)
      + '<div class="fr-row__main">'
        + '<div class="fr-row__top">'
          + '<span class="fr-row__name">' + escapeHtml(u.name) + '</span>'
        + '</div>'
        + '<div class="fr-row__sub">'
          + '<span class="fr-row__domain">' + escapeHtml(u.domain || '') + '</span>'
          + '<span class="fr-row__preview">' + escapeHtml(u.bio || '') + '</span>'
        + '</div>'
      + '</div>'
      + '<div class="fr-row__meta">' + metaHtml + '</div>';
  }

  /* renderRecommendRow：点击头像 → 访客视角个人主页；点击行其余区域同样进入访客视角
   * 外层用 div（而非 button）避免与内层关注 button 嵌套（HTML 规范不允许 button 套 button） */
  function renderRecommendRow(item) {
    var u = userById(item.id);
    if (!u) return '';
    return ''
      + '<div class="fr-row" data-action="open-guest-profile" data-uid="' + u.id + '" role="button" tabindex="0">'
        + '<span class="fr-avatar fr-avatar--tap" data-action="open-guest-profile" data-uid="' + u.id + '" style="background:' + (u.avatarColor || '#6B655C') + '">' + escapeHtml(u.initials || u.name) + '</span>'
        + '<div class="fr-row__main">'
          + '<div class="fr-row__top">'
            + '<span class="fr-row__name">' + escapeHtml(u.name) + '</span>'
          + '</div>'
          + '<div class="fr-row__sub">'
            + '<span class="fr-row__domain">' + escapeHtml(u.domain || '') + '</span>'
            + '<span class="fr-row__preview">' + escapeHtml(u.bio || '') + '</span>'
          + '</div>'
        + '</div>'
        + '<button class="fr-follow" data-action="follow" data-uid="' + u.id + '">' + IC.plus() + '关注</button>'
      + '</div>';
  }

  function renderGroupRow(g) {
    /* Task 3：与好友行统一 —— 未读红点贴在头像上，右侧只留时间 */
    var unread = g.unread > 0;
    var isPinned = !!state.pinnedGroups[g.id];
    var avatar = '<span class="fr-avatar fr-avatar--badged fr-avatar--group">'
      + '<span class="fr-avatar__face" style="background:' + g.avatarColor + '">' + escapeHtml(g.avatarText) + '</span>'
      + (unread ? '<span class="fr-avatar__unread">' + g.unread + '</span>' : '')
      + '</span>';
    var typeClass = 'fr-grouptype--' + g.type;
    var row = ''
      + '<button class="fr-row" data-action="open-group" data-gid="' + g.id + '">'
        + avatar
        + '<div class="fr-row__main">'
          + '<div class="fr-row__top">'
            + '<span class="fr-row__name">' + escapeHtml(g.name) + '</span>'
            + '<span class="fr-grouptype ' + typeClass + '">' + escapeHtml(g.typeLabel) + '</span>'
            + (isPinned ? '<span class="fr-pin-mark" aria-label="已置顶">' + IC.pin(12) + '</span>' : '')
          + '</div>'
          + '<div class="fr-row__sub">'
            + '<span class="fr-row__preview">' + escapeHtml(g.preview || '') + '</span>'
          + '</div>'
        + '</div>'
        + '<div class="fr-row__meta">'
          + '<span class="fr-row__time">' + escapeHtml(g.time || '') + '</span>'
        + '</div>'
      + '</button>';
    /* 与好友行一致：左滑置顶操作 + 右侧 chevron 触发 */
    return ''
      + '<div class="fr-slidable">'
        + '<div class="fr-slide-actions">'
          + '<button class="fr-slide-act fr-slide-act--pin" data-action="slide-pin-group" data-gid="' + g.id + '" aria-label="' + (isPinned ? '取消置顶' : '置顶') + '">' + IC.pin() + '<span>' + (isPinned ? '取消' : '置顶') + '</span></button>'
        + '</div>'
        + row
        + '<button class="fr-slide-trigger" data-action="toggle-slide" aria-label="更多操作">' + svg('<path d="M4 9l4-4 4 4"/><path d="M4 15l4 4 4-4"/>', 16) + '</button>'
      + '</div>';
  }

  /* renderTeamRow：团队 = 协作主体（区别于好友一对一 / 群聊面向陌生人）
   * Task 3/12：与好友/群聊行统一高度，团队徽章 + 角色，右侧仅留成员数
   * 新增：未读红点（与群聊一致）+ 左滑置顶 */
  function renderTeamRow(t) {
    var unread = t.unread > 0;
    var isPinned = !!state.pinnedTeams[t.id];
    var avatar = '<span class="fr-avatar fr-avatar--badged fr-avatar--team">'
      + '<span class="fr-avatar__face" style="background:' + t.avatarColor + '">' + escapeHtml(t.avatarText) + '</span>'
      + (unread ? '<span class="fr-avatar__unread">' + t.unread + '</span>' : '')
      + '</span>';
    var roleClass = t.role === '管理员' ? 'fr-team-role--admin' : 'fr-team-role--member';
    var row = ''
      + '<button class="fr-row fr-row--team" data-action="open-team" data-tid="' + t.id + '">'
        + avatar
        + '<div class="fr-row__main">'
          + '<div class="fr-row__top">'
            + '<span class="fr-row__name">' + escapeHtml(t.name) + '</span>'
            + '<span class="fr-team-badge">团队</span>'
            + '<span class="fr-team-role ' + roleClass + '">' + escapeHtml(t.role) + '</span>'
            + (isPinned ? '<span class="fr-pin-mark" aria-label="已置顶">' + IC.pin(12) + '</span>' : '')
          + '</div>'
          + '<div class="fr-row__sub">'
            + '<span class="fr-row__preview">' + escapeHtml(t.desc || '') + '</span>'
          + '</div>'
        + '</div>'
        + '<div class="fr-row__meta">'
          + '<span class="fr-row__time">' + t.members + '人</span>'
        + '</div>'
      + '</button>';
    /* 与好友/群聊行一致：左滑置顶操作 + 右侧 chevron 触发 */
    return ''
      + '<div class="fr-slidable">'
        + '<div class="fr-slide-actions">'
          + '<button class="fr-slide-act fr-slide-act--pin" data-action="slide-pin-team" data-tid="' + t.id + '" aria-label="' + (isPinned ? '取消置顶' : '置顶') + '">' + IC.pin() + '<span>' + (isPinned ? '取消' : '置顶') + '</span></button>'
        + '</div>'
        + row
        + '<button class="fr-slide-trigger" data-action="toggle-slide" aria-label="更多操作">' + svg('<path d="M4 9l4-4 4 4"/><path d="M4 15l4 4 4-4"/>', 16) + '</button>'
      + '</div>';
  }

  /* ----------------------------- 渲染：消息流 ----------------------------- */

  function renderMessage(m, ctx) {
    /* ctx: { isGroup, me, peer } */
    if (m.role === 'sys' || m.role === 'system') {
      return '<div class="fr-sysmsg">' + escapeHtml(m.text) + '</div>';
    }
    if (m.date) {
      return '<div class="fr-datebreak">' + escapeHtml(m.date) + '</div>';
    }

    var author = m.authorId ? userById(m.authorId) : null;
    var role = m.role; /* peer | me | ai */
    var cls = 'fr-msg fr-msg--' + (role === 'me' ? 'me' : (role === 'ai' ? 'ai' : 'peer'));

    /* 头像 */
    var avaHtml = '';
    if (role === 'me') {
      var me = ctx.me || userById(ME_ID) || { initials: '我', avatarColor: '#1D5B7A' };
      avaHtml = '<span class="fr-msg__ava" style="background:' + (me.avatarColor || '#1D5B7A') + '">'
        + escapeHtml(me.initials || '我') + '</span>';
    } else if (role === 'ai') {
      avaHtml = '<span class="fr-msg__ava" style="background:var(--gold-500);color:var(--ink-900)">AI</span>';
    } else if (author) {
      avaHtml = '<button class="fr-msg__ava fr-msg__ava--tap" data-action="open-guest-profile" data-uid="' + escapeHtml(author.id) + '" style="background:' + (author.avatarColor || '#6B655C') + '" aria-label="查看 ' + escapeHtml(author.name) + ' 的主页">'
        + escapeHtml(author.initials || author.name) + '</button>';
    }

    /* 内容 */
    var contentHtml = '';
    if (m.kind === 'note' && m.noteId) {
      var note = noteById(m.noteId);
      if (note) {
        contentHtml = ''
          + '<div class="fr-notecard" data-action="open-note" data-note-id="' + note.id + '">'
            + '<div class="fr-notecard__tag">' + IC.note() + '笔记分享</div>'
            + '<p class="fr-notecard__title">' + escapeHtml(note.title) + '</p>'
            + '<p class="fr-notecard__excerpt">' + escapeHtml(note.summary) + '</p>'
            + '<span class="fr-notecard__cta">点击查看全文 →</span>'
          + '</div>';
      }
    } else if (m.kind === 'debate') {
      var pro = m.pro != null ? m.pro : 50;
      var con = m.con != null ? m.con : 50;
      contentHtml = ''
        + '<div class="fr-debatecard">'
          + '<div class="fr-debatecard__tag">' + IC.vs() + '讨论邀请</div>'
          + '<p class="fr-debatecard__title">' + escapeHtml(m.debateTitle || '一场讨论') + '</p>'
          + '<div class="fr-debatecard__bar">'
            + '<div class="fr-debatecard__bar--pro" style="width:' + pro + '%"></div>'
            + '<div class="fr-debatecard__bar--con" style="width:' + con + '%"></div>'
          + '</div>'
          + '<div class="fr-debatecard__stats">'
            + '<span class="fr-debatecard__stats--pro">赞成 ' + pro + '%</span>'
            + '<span class="fr-debatecard__stats--con">反对 ' + con + '%</span>'
          + '</div>'
          + '<button class="fr-debatecard__join" data-action="join-debate">加入这场讨论</button>'
        + '</div>';
    } else {
      var safeText = highlightMentions(escapeHtml(m.text || ''));
      contentHtml = '<div class="fr-msg__bubble">' + safeText + '</div>';
    }

    /* 群聊显示发送者名（我的消息不显示） */
    var senderHtml = '';
    if (ctx.isGroup && role !== 'me' && author) {
      senderHtml = '<div class="fr-msg__sender">' + escapeHtml(author.name) + '</div>';
    }

    /* AI 插话前缀 */
    var aiPrefix = '';
    if (role === 'ai') {
      aiPrefix = '<div class="fr-ai-prefix">' + IC.spark() + 'AI · 旁观插话</div>';
    }

    return ''
      + '<div class="' + cls + '" data-role="' + role + '">'
        + avaHtml
        + '<div class="fr-msg__col">'
          + senderHtml
          + aiPrefix
          + contentHtml
          + '<div class="fr-msg__time">' + escapeHtml(m.time || '') + '</div>'
        + '</div>'
      + '</div>';
  }

  function highlightMentions(safeHtml) {
    /* safeHtml 已转义；只匹配 @中文/字母数字 字符 */
    return safeHtml.replace(/@([^\s@<>&]{1,12})/g, function (_, name) {
      return '<span class="fr-mention-tag">@' + name + '</span>';
    });
  }

  /* ----------------------------- 状态机 ----------------------------- */

  var state = Object.assign(state || {}, {
    tab: 'friends',        /* friends | groups | teams */
    view: 'list',          /* list | chat | group | add */
    peerId: null,
    groupId: null,
    aiOn: false,           /* 当前聊天页 AI 介入开关 */
    aiCounters: { '1on1': 0, group: 0 },
    search: { friends: '', groups: '', teams: '', add: '', addGroup: '' },
    pinnedGroups: {},      /* 群聊置顶状态（id → true） */
    pinnedTeams: {},       /* 团队置顶状态（id → true） */
    appliedGroups: {},     /* 已申请加入的群聊（id → true） */
    recentGroups: [],      /* 最近点击的群聊顺序（id 数组，最近的在前） */
    recentTeams: [],       /* 最近点击的团队顺序 */
    recentFriends: []      /* 最近点击的好友顺序 */
  });

  var dom = {};

  function cacheDom() {
    dom.root = $('.fr-root');
    dom.viewList = $('[data-fr-view="list"]');
    dom.viewChat = $('[data-fr-view="chat"]');
    dom.viewGroup = $('[data-fr-view="group"]');
    dom.viewAdd = $('[data-fr-view="add"]');
    dom.viewManage = $('[data-fr-view="manage"]');

    /* 群/团队详情视图：动态创建（与 list/chat/group/add 同级，右入全屏） */
    if (dom.root && !$('[data-fr-view="info"]')) {
      var infoView = el('div', 'fr-view fr-view--fullscreen fr-info');
      infoView.setAttribute('data-fr-view', 'info');
      infoView.setAttribute('data-axis', 'right');
      dom.root.appendChild(infoView);
    }
    dom.viewInfo = $('[data-fr-view="info"]');

    /* segment（好友 / 群聊 / 团队） */
    dom.segFriends = $('[data-fr-seg="friends"]');
    dom.segGroups = $('[data-fr-seg="groups"]');
    dom.segTeams = $('[data-fr-seg="teams"]');
    dom.btnAdd = $('[data-fr-action="add"]');
    /* 右上角搜索图标 + 顶部下拉搜索浮层 */
    dom.btnSearch = $('[data-fr-action="search"]');
    dom.searchOverlay = $('[data-fr-search-overlay]');
    dom.searchInput = $('[data-fr-search-input]');

    /* tab containers */
    dom.tabFriends = $('[data-fr-tab="friends"]');
    dom.tabGroups = $('[data-fr-tab="groups"]');
    dom.tabTeams = $('[data-fr-tab="teams"]');

    /* 添加页内独立搜索（过滤推荐） */
    dom.searchAdd = $('[data-fr-search="add"]');

    /* list containers */
    dom.friendsBody = $('[data-fr-list="friends"]');
    dom.groupsBody = $('[data-fr-list="groups"]');
    dom.teamsBody = $('[data-fr-list="teams"]');
    dom.addBody = $('[data-fr-list="add"]');
    /* Task 4：添加页三段切换 */
    dom.addSegment = $('[data-fr-add-segment]');
    dom.addTitle = $('[data-fr-add-title]');

    /* chat */
    dom.chatTop = $('[data-fr-chat-top]');
    dom.chatMsgs = $('[data-fr-chat-msgs]');
    dom.chatInputRow = $('[data-fr-chat-input-row]');
    dom.chatInput = $('[data-fr-chat-input]');
    dom.chatSend = $('[data-fr-chat-send]');
    dom.chatAiBar = $('[data-fr-chat-ai-bar]');
    dom.chatAttachBtn = $('[data-fr-chat-attach]');
    dom.chatVoice = $('[data-fr-chat-voice]');
    dom.chatVoiceHold = $('[data-fr-chat-voice-hold]');
    dom.chatEmoji = $('[data-fr-chat-emoji]');
    dom.chatKeyboard = $('[data-fr-chat-keyboard]');
    dom.chatEmojiPanel = $('[data-fr-chat-emoji-panel]');
    dom.chatAttachPanel = $('[data-fr-chat-attach-panel]');
    dom.chatAttachMenu = $('[data-fr-chat-attach-menu]');
    dom.chatAttachTray = $('[data-fr-chat-attach-tray]');

    /* group */
    dom.groupTop = $('[data-fr-group-top]');
    dom.groupAnnounce = $('[data-fr-group-announce]');
    dom.groupShared = $('[data-fr-group-shared]');
    dom.groupMsgs = $('[data-fr-group-msgs]');
    dom.groupInput = $('[data-fr-group-input]');
    dom.groupSend = $('[data-fr-group-send]');
    dom.groupAiBar = $('[data-fr-group-ai-bar]');
    dom.groupAttachBtn = $('[data-fr-group-attach]');
    dom.groupVoice = $('[data-fr-group-voice]');
    dom.groupVoiceHold = $('[data-fr-group-voice-hold]');
    dom.groupEmoji = $('[data-fr-group-emoji]');
    dom.groupKeyboard = $('[data-fr-group-keyboard]');
    dom.groupEmojiPanel = $('[data-fr-group-emoji-panel]');
    dom.groupAttachPanel = $('[data-fr-group-attach-panel]');
    dom.groupAttachMenu = $('[data-fr-group-attach-menu]');
    dom.groupAttachTray = $('[data-fr-group-attach-tray]');
    dom.groupMention = $('[data-fr-group-mention]');

    /* context menu + scrim */
    dom.scrim = $('[data-fr-scrim]');
    dom.contextMenu = $('[data-fr-context]');
    dom.contextHead = $('[data-fr-context-head]');
    dom.contextItems = $('[data-fr-context-items]');
  }

  /* —— 视图栈切换 ——
   * chat / group / add 为全屏覆盖视图：进入时给 body 加 .is-fr-chat-open
   * 隐藏底部 5-tab 导航（见 shell.css），退出时恢复
   */
  function showView(name) {
    state.view = name;
    var map = { list: dom.viewList, chat: dom.viewChat, group: dom.viewGroup, add: dom.viewAdd, manage: dom.viewManage, info: dom.viewInfo };
    Object.keys(map).forEach(function (k) {
      var v = map[k];
      if (!v) return;
      v.classList.toggle('is-on', k === name);
      v.classList.toggle('is-covered', k !== name && name !== 'list' && k === 'list');
    });
    if (name === 'list') {
      dom.viewList.classList.remove('is-covered');
    }
    /* 全屏覆盖视图：隐藏底部 tab */
    var fullscreen = name === 'chat' || name === 'group' || name === 'add' || name === 'manage' || name === 'info';
    document.body.classList.toggle('is-fr-chat-open', fullscreen);
  }

  /* —— segment 切换（三 tab：好友 / 群聊 / 团队） —— */
  function setTab(tab) {
    state.tab = tab;
    var onF = tab === 'friends';
    var onG = tab === 'groups';
    var onT = tab === 'teams';
    if (dom.segFriends) dom.segFriends.classList.toggle('is-active', onF);
    if (dom.segGroups) dom.segGroups.classList.toggle('is-active', onG);
    if (dom.segTeams) dom.segTeams.classList.toggle('is-active', onT);
    if (dom.tabFriends) dom.tabFriends.style.display = onF ? 'flex' : 'none';
    if (dom.tabGroups) dom.tabGroups.style.display = onG ? 'flex' : 'none';
    if (dom.tabTeams) dom.tabTeams.style.display = onT ? 'flex' : 'none';
    if (dom.btnAdd) {
      dom.btnAdd.setAttribute('aria-label', onF ? '添加好友' : (onT ? '新建团队' : '新建群聊'));
    }
    /* 搜索浮层跟随当前 tab 输入 */
    syncSearchOverlay();
  }

  /* —— 双视图切换：再点已激活的好友 tab → 切换列表/分组视图（Task 2.2） —— */
  function onFriendsSegClick() {
    if (state.tab !== 'friends') return;
    state.friendsView = state.friendsView === 'group' ? 'list' : 'group';
    applyFriendsView();
  }
  function applyFriendsView() {
    var isGroup = state.friendsView === 'group';
    if (dom.segFriends) dom.segFriends.classList.toggle('is-group-view', isGroup);
    var lv = document.querySelector('[data-fr-list="friends"], .fr-friends-list');
    var gv = document.querySelector('[data-fr-group-view]');
    if (lv) lv.style.display = isGroup ? 'none' : '';
    if (gv) gv.style.display = isGroup ? 'block' : 'none';
    /* 齿轮按钮显隐（Task 2.4 会加齿轮按钮，此处先安全检查） */
    var gear = document.querySelector('[data-fr-friends-gear]');
    if (gear) gear.style.display = isGroup ? '' : 'none';
    if (isGroup && typeof renderGroupView === 'function') renderGroupView();
  }

  /* —— 分组视图渲染：每个分组可折叠展开，未分组好友单独显示（Task 2.3） —— */
  function renderGroupView() {
    var gv = document.querySelector('[data-fr-group-view]');
    if (!gv) return;
    var html = '';
    state.groups.forEach(function (g) {
      var members = (g.memberIds || []).map(userById).filter(Boolean);
      html += '<div class="fr-group-row" data-gid="' + g.id + '">'
        + '<div class="fr-group-row__head" data-toggle-group="' + g.id + '">'
        + '<span class="fr-group-row__name">\uD83D\uDDC2 ' + escapeHtml(g.name) + '</span>'
        + '<span class="fr-group-row__count">' + members.length + ' \u25BE</span>'
        + '</div>'
        + '<div class="fr-group-row__body" hidden>'
        + members.map(function (u) {
            return '<div class="fr-group-row__member" data-action="open-chat" data-uid="' + u.id + '">'
              + avatarHtml(u, 'fr-avatar--sm') + '<span>' + escapeHtml(u.name) + '</span></div>';
          }).join('')
        + '</div></div>';
    });
    /* 未分组 */
    var grouped = {};
    state.groups.forEach(function (g) { (g.memberIds || []).forEach(function (id) { grouped[id] = true; }); });
    var ungrouped = users().filter(function (u) { return u.id !== ME_ID && !grouped[u.id]; });
    if (ungrouped.length) {
      html += '<div class="fr-group-row"><div class="fr-group-row__head" data-toggle-group="ungrouped">'
        + '<span class="fr-group-row__name" style="color:var(--ink-500)">\uD83D\uDDC2 未分组</span>'
        + '<span class="fr-group-row__count">' + ungrouped.length + ' \u25BE</span></div>'
        + '<div class="fr-group-row__body" hidden>'
        + ungrouped.map(function (u) {
            return '<div class="fr-group-row__member" data-action="open-chat" data-uid="' + u.id + '">'
              + avatarHtml(u, 'fr-avatar--sm') + '<span>' + escapeHtml(u.name) + '</span></div>';
          }).join('')
        + '</div></div>';
    }
    gv.innerHTML = html;
    /* 折叠委托 */
    gv.querySelectorAll('[data-toggle-group]').forEach(function (head) {
      head.onclick = function () {
        var body = head.nextElementSibling;
        if (body) body.hidden = !body.hidden;
      };
    });
  }

  /* —— 搜索浮层：根据 state.tab 显示对应占位 / 同步输入值 —— */
  function syncSearchOverlay() {
    if (!dom.searchInput || !dom.searchOverlay) return;
    var ph = ({
      friends: '搜索 · 好友名字 / 领域 / 兴趣',
      groups: '搜索 · 群名 / 群类型',
      teams: '搜索 · 团队名 / 描述'
    })[state.tab] || '搜索';
    dom.searchInput.placeholder = ph;
    dom.searchInput.value = state.search[state.tab] || '';
  }

  function openSearchOverlay() {
    if (!dom.searchOverlay) return;
    dom.searchOverlay.classList.remove('is-hidden');
    syncSearchOverlay();
    if (dom.searchInput) setTimeout(function () { dom.searchInput.focus(); }, 60);
  }
  function closeSearchOverlay() {
    if (!dom.searchOverlay) return;
    dom.searchOverlay.classList.add('is-hidden');
    /* 关闭时清空当前 tab 搜索并重渲 */
    state.search[state.tab] = '';
    rerenderCurrentTab();
  }
  function rerenderCurrentTab() {
    if (state.tab === 'friends') renderFriendsList();
    else if (state.tab === 'groups') renderGroupsList();
    else if (state.tab === 'teams') renderTeamsList();
  }

  /* —— 全屏「查找」独立页：搜索全部用户/群/团队，点结果进入对应主页 —— */
  function openSearchPage() {
    closeSearchPage();
    var page = document.createElement('div');
    page.className = 'fr-search-page';
    page.setAttribute('data-fr-search-page', '');
    page.innerHTML = ''
      + '<div class="fr-search-page__top">'
      +   '<button class="zx-icon-btn" data-fr-search-back aria-label="返回">' + IC.back() + '</button>'
      +   '<div class="fr-search-page__input-wrap">'
      +     IC.search()
      +     '<input class="fr-search-page__input" data-fr-search-page-input placeholder="搜索好友 · 群 · 团队" />'
      +   '</div>'
      + '</div>'
      + '<div class="fr-search-page__body" data-fr-search-page-body></div>';
    /* 加到 friends 页（zx-phone 内），全屏覆盖 */
    var host = document.querySelector('.zx-phone') || document.body;
    host.appendChild(page);
    /* 初始渲染（热门/推荐） */
    renderSearchPageResults('');
    /* 绑定事件 */
    var inp = page.querySelector('[data-fr-search-page-input]');
    if (inp) {
      setTimeout(function () { inp.focus(); }, 80);
      inp.addEventListener('input', function () {
        renderSearchPageResults(inp.value.trim());
      });
      inp.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') e.preventDefault();
      });
    }
    var back = page.querySelector('[data-fr-search-back]');
    if (back) back.addEventListener('click', closeSearchPage);
    /* 结果项点击委托（头像→访客主页） */
    page.addEventListener('click', function (e) {
      var card = e.target.closest('[data-fr-search-uid]');
      if (card) {
        var uid = card.getAttribute('data-fr-search-uid');
        closeSearchPage();
        if (window.ZX_PROFILE && typeof window.ZX_PROFILE.viewUser === 'function') {
          window.ZX_PROFILE.viewUser(uid, 'friends');
          if (window.ZX_BRIDGE && typeof window.ZX_BRIDGE.switchTab === 'function') {
            window.ZX_BRIDGE.switchTab('profile');
          }
        }
      }
    });
  }
  function closeSearchPage() {
    var p = document.querySelector('[data-fr-search-page]');
    if (p) p.parentNode.removeChild(p);
  }
  function renderSearchPageResults(q) {
    var body = document.querySelector('[data-fr-search-page-body]');
    if (!body) return;
    var us = users();
    var groups = (mock().groups || []);
    var teams = (mock().teams || []);
    var ql = q.toLowerCase();
    var html = '';
    if (!q) {
      /* 无关键词：搜索是搜已有内容，不需要"推荐"，显示搜索引导 */
      body.innerHTML = '<div class="fr-search-page__empty">'
        + '<p class="fr-search-page__empty-title">搜索好友 · 群 · 团队</p>'
        + '<p class="fr-search-page__empty-sub">输入名字、领域或关键词开始查找</p>'
        + '</div>';
      return;
    }
    /* 有关键词：过滤用户/群/团队 */
    var matchedUsers = us.filter(function (u) {
      return u.id !== 'me' && (
        (u.name && u.name.toLowerCase().indexOf(ql) >= 0) ||
        (u.domain && u.domain.toLowerCase().indexOf(ql) >= 0) ||
        (u.bio && u.bio.toLowerCase().indexOf(ql) >= 0)
      );
    });
    var matchedGroups = groups.filter(function (g) {
      return (g.name && g.name.toLowerCase().indexOf(ql) >= 0) ||
             (g.type && g.type.toLowerCase().indexOf(ql) >= 0);
    });
    var matchedTeams = teams.filter(function (t) {
      return (t.name && t.name.toLowerCase().indexOf(ql) >= 0) ||
             (t.desc && t.desc.toLowerCase().indexOf(ql) >= 0);
    });
    if (!matchedUsers.length && !matchedGroups.length && !matchedTeams.length) {
      body.innerHTML = '<div class="fr-search-page__empty">没有找到「' + escapeHtml(q) + '」相关结果</div>';
      return;
    }
    html = '';
    if (matchedUsers.length) {
      html += '<p class="fr-search-page__label">用户（' + matchedUsers.length + '）</p>';
      html += '<div class="fr-search-page__list">';
      matchedUsers.forEach(function (u) { html += searchUserCard(u); });
      html += '</div>';
    }
    if (matchedGroups.length) {
      html += '<p class="fr-search-page__label">群聊（' + matchedGroups.length + '）</p>';
      html += '<div class="fr-search-page__list">';
      matchedGroups.forEach(function (g) {
        html += '<div class="fr-search-page__group-row">'
          + '<span class="fr-avatar fr-avatar--group" style="background:' + g.avatarColor + '">' + escapeHtml(g.avatarText) + '</span>'
          + '<div class="fr-search-page__group-main"><span class="fr-search-page__group-name">' + escapeHtml(g.name) + '</span>'
          + '<span class="fr-search-page__group-sub">' + escapeHtml(g.type || '') + '</span></div></div>';
      });
      html += '</div>';
    }
    if (matchedTeams.length) {
      html += '<p class="fr-search-page__label">团队（' + matchedTeams.length + '）</p>';
      html += '<div class="fr-search-page__list">';
      matchedTeams.forEach(function (t) {
        html += '<div class="fr-search-page__group-row>'
          + '<span class="fr-avatar fr-avatar--group" style="background:' + (t.avatarColor || '#6B655C') + '">' + escapeHtml(t.avatarText || (t.name || '?').charAt(0)) + '</span>'
          + '<div class="fr-search-page__group-main"><span class="fr-search-page__group-name">' + escapeHtml(t.name) + '</span>'
          + '<span class="fr-search-page__group-sub">' + escapeHtml(t.desc || '') + '</span></div></div>';
      });
      html += '</div>';
    }
    body.innerHTML = html;
  }
  function searchUserCard(u) {
    var color = u.avatarColor || '#6B655C';
    var text = u.initials || (u.name || '?').charAt(0);
    return '<div class="fr-search-page__user" data-fr-search-uid="' + escapeHtml(u.id) + '">'
      + '<span class="fr-avatar" style="background:' + color + '">' + escapeHtml(text) + '</span>'
      + '<div class="fr-search-page__user-main">'
      +   '<span class="fr-search-page__user-name">' + escapeHtml(u.name) + '</span>'
      +   '<span class="fr-search-page__user-sub">' + escapeHtml(u.domain || u.bio || '') + '</span>'
      + '</div></div>';
  }

  /* ----------------------------- 渲染：列表 ----------------------------- */

  function renderFriendsList() {
    var q = (state.search.friends || '').trim().toLowerCase();

    /* 好友 = 互关（partners）；关注 = 我关注但非互关 */
    var partnerIds = (FRIEND_GROUPS.partners || []).slice();
    var bridgeIds = (window.ZX_BRIDGE && window.ZX_BRIDGE.getFollowingIds()) || [];
    var followingIds = bridgeIds.filter(function (id) { return partnerIds.indexOf(id) < 0; });

    var partners = partnerIds.map(userById).filter(Boolean);
    var followings = followingIds.map(userById).filter(Boolean);

    if (q) {
      partners = partners.filter(function (u) {
        return u.name.toLowerCase().indexOf(q) >= 0
          || (u.domain || '').toLowerCase().indexOf(q) >= 0
          || (u.bio || '').toLowerCase().indexOf(q) >= 0;
      });
      followings = followings.filter(function (u) {
        return u.name.toLowerCase().indexOf(q) >= 0
          || (u.domain || '').toLowerCase().indexOf(q) >= 0;
      });
    }

    /* Task 5：按最近点击顺序排序（recentClickOrder 靠前的排前面） */
    if (!q && recentClickOrder.length) {
      var sortFn = function (a, b) {
        var ia = recentClickOrder.indexOf(a.id);
        var ib = recentClickOrder.indexOf(b.id);
        if (ia < 0) ia = 9999;
        if (ib < 0) ib = 9999;
        return ia - ib;
      };
      partners.sort(sortFn);
      followings.sort(sortFn);
    }

    var html = '';
    var total = partners.length + followings.length;
    if (total === 0) {
      html = emptyHtml('没找到匹配的好友', '试试其它昵称、领域或兴趣标签');
    } else {
      /* 我的好友（互关） */
      if (partners.length) {
        html += '<section class="fr-section">'
          + '<div class="fr-section__head"><h3 class="fr-section__title">我的好友</h3>'
          + '<span class="fr-section__count">' + partners.length + ' 位</span></div>';
        partners.forEach(function (u) {
          html += '<div class="fr-slidable">'
            + '<div class="fr-slide-actions">'
              + '<button class="fr-slide-act fr-slide-act--pin" data-action="slide-pin" data-uid="' + u.id + '" aria-label="置顶">' + IC.pin() + '<span>置顶</span></button>'
            + '</div>'
            + '<button class="fr-row" data-action="open-chat" data-uid="' + u.id + '">'
              + renderFriendRow(u, FRIEND_STATE[u.id])
            + '</button>'
            + '<button class="fr-slide-trigger" data-action="toggle-slide" aria-label="更多操作">' + svg('<path d="M4 9l4-4 4 4"/><path d="M4 15l4 4 4-4"/>', 16) + '</button>'
          + '</div>';
        });
        html += '</section>';
      }

      /* 我的关注（非互关，可聊天） */
      if (followings.length) {
        html += '<section class="fr-section">'
          + '<div class="fr-section__head"><h3 class="fr-section__title">我的关注</h3>'
          + '<span class="fr-section__count">' + followings.length + ' 位</span></div>';
        followings.forEach(function (u) {
          html += '<div class="fr-slidable">'
            + '<div class="fr-slide-actions">'
              + '<button class="fr-slide-act fr-slide-act--pin" data-action="slide-pin" data-uid="' + u.id + '" aria-label="置顶">' + IC.pin() + '<span>置顶</span></button>'
            + '</div>'
            + '<button class="fr-row" data-action="open-chat" data-uid="' + u.id + '">'
              + renderFriendRow(u, FRIEND_STATE[u.id])
            + '</button>'
            + '<button class="fr-slide-trigger" data-action="toggle-slide" aria-label="更多操作">' + svg('<path d="M4 9l4-4 4 4"/><path d="M4 15l4 4 4-4"/>', 16) + '</button>'
          + '</div>';
        });
        html += '</section>';
      }
    }
    dom.friendsBody.innerHTML = html;
  }

  function renderGroupsList() {
    var q = (state.search.groups || '').trim().toLowerCase();
    var list = MOCK_GROUPS.slice();
    if (q) {
      list = list.filter(function (g) {
        return g.name.toLowerCase().indexOf(q) >= 0
          || g.typeLabel.toLowerCase().indexOf(q) >= 0
          || (g.preview || '').toLowerCase().indexOf(q) >= 0;
      });
    }
    /* 置顶排序 + 最近点击排序：pinned 在前，其次最近点击的，最后保持原顺序 */
    list.sort(function (a, b) {
      var pa = state.pinnedGroups[a.id] ? 1 : 0;
      var pb = state.pinnedGroups[b.id] ? 1 : 0;
      if (pa !== pb) return pb - pa;
      var ra = recentRank(state.recentGroups, a.id);
      var rb = recentRank(state.recentGroups, b.id);
      return ra - rb;
    });
    var html = '';
    if (list.length === 0) {
      html = emptyHtml('没有匹配的群聊', '试试群名或群类型');
    } else {
      html += '<section class="fr-section">'
        + '<div class="fr-section__head"><h3 class="fr-section__title">我的群聊</h3>'
        + '<span class="fr-section__count">' + list.length + ' 个</span></div>';
      list.forEach(function (g) { html += renderGroupRow(g); });
      html += '</section>';
    }
    dom.groupsBody.innerHTML = html;
  }

  /* 团队列表（协作主体） */
  function renderTeamsList() {
    var q = (state.search.teams || '').trim().toLowerCase();
    var list = MOCK_TEAMS.slice();
    if (q) {
      list = list.filter(function (t) {
        return t.name.toLowerCase().indexOf(q) >= 0
          || (t.desc || '').toLowerCase().indexOf(q) >= 0
          || (t.role || '').toLowerCase().indexOf(q) >= 0;
      });
    }
    /* 置顶排序 + 最近点击排序：pinned 在前，其次最近点击的，最后保持原顺序 */
    list.sort(function (a, b) {
      var pa = state.pinnedTeams[a.id] ? 1 : 0;
      var pb = state.pinnedTeams[b.id] ? 1 : 0;
      if (pa !== pb) return pb - pa;
      var ra = recentRank(state.recentTeams, a.id);
      var rb = recentRank(state.recentTeams, b.id);
      return ra - rb;
    });
    var html = '';
    if (list.length === 0) {
      html = emptyHtml('没有匹配的团队', '试试团队名或描述');
    } else {
      html += '<section class="fr-section">'
        + '<div class="fr-section__head"><h3 class="fr-section__title">我的团队</h3>'
        + '<span class="fr-section__count">' + list.length + ' 个</span></div>';
      list.forEach(function (t) { html += renderTeamRow(t); });
      html += '</section>';
    }
    if (dom.teamsBody) dom.teamsBody.innerHTML = html;
  }

  function renderAddList() {
    /* Task 4：根据 state.addTab 渲染不同内容 —— 好友推荐 / 群聊搜索 / 组建团队 */
    var tab = state.addTab || 'friend';
    /* 更新标题 */
    if (dom.addTitle) {
      dom.addTitle.textContent = tab === 'friend' ? '添加好友' : (tab === 'group' ? '搜索群聊' : '组建团队');
    }
    /* 更新 segment 激活态 */
    if (dom.addSegment) {
      var segs = dom.addSegment.querySelectorAll('[data-fr-add-tab]');
      segs.forEach(function (s) {
        s.classList.toggle('is-active', s.getAttribute('data-fr-add-tab') === tab);
      });
    }

    if (tab === 'friend') {
      renderAddFriend();
    } else if (tab === 'group') {
      renderAddGroup();
    } else {
      renderAddTeam();
    }
  }

  /* Task 4：添加好友 tab —— 二维码 + 推荐关注（不推荐群聊/团队） */
  function renderAddFriend() {
    var q = (state.search.add || '').trim().toLowerCase();
    var list = addRecommendList();
    if (q) {
      list = list.filter(function (u) {
        return u.name.toLowerCase().indexOf(q) >= 0
          || (u.domain || '').toLowerCase().indexOf(q) >= 0
          || (u.bio || '').toLowerCase().indexOf(q) >= 0;
      });
    }
    var html = '';
    /* 我的二维码 */
    html += '<div class="fr-qr"><div class="fr-qr__img" data-fr-qr></div><p class="fr-qr__hint">扫一扫，加我为好友</p></div>';
    /* 搜索框 */
    html += '<div class="fr-add-search-wrap"><label class="fr-add-search__field">'
      + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>'
      + '<input class="fr-add-search__input" data-fr-search="add" type="search" placeholder="搜索用户名 / ID" aria-label="搜索用户" value="' + escapeHtml(state.search.add || '') + '">'
      + '</label></div>';
    if (list.length === 0) {
      html += emptyHtml('暂无更多推荐', '已经把全部相关研究者都推给你了');
    } else {
      html += '<section class="fr-section">'
        + '<div class="fr-section__head"><h3 class="fr-section__title">为你推荐</h3>'
        + '<span class="fr-section__count">' + list.length + ' 位</span></div>';
      list.forEach(function (u) {
        var reason = (u.domain || '') + ' · ' + (u.bio || '');
        html += renderRecommendRow({ id: u.id, reason: reason });
      });
      html += '</section>';
    }
    dom.addBody.innerHTML = html;
    /* 重新绑定搜索输入 */
    var si = dom.addBody.querySelector('[data-fr-search="add"]');
    if (si) {
      si.addEventListener('input', function (ev) {
        state.search.add = ev.target.value;
        renderAddFriend();
        /* 保持焦点 */
        var nf = dom.addBody.querySelector('[data-fr-search="add"]');
        if (nf) { nf.focus(); nf.setSelectionRange(nf.value.length, nf.value.length); }
      });
    }
  }

  /* Task 4：搜索群聊 tab —— 搜索框 + 可加入的群聊列表（不推荐） */
  function renderAddGroup() {
    var q = (state.search.addGroup || '').trim().toLowerCase();
    /* 可加入的群聊 = 所有 MOCK_GROUPS（demo：都显示为可加入） */
    var list = MOCK_GROUPS.slice();
    if (q) {
      list = list.filter(function (g) {
        return g.name.toLowerCase().indexOf(q) >= 0
          || g.typeLabel.toLowerCase().indexOf(q) >= 0
          || (g.announcement || '').toLowerCase().indexOf(q) >= 0;
      });
    }
    var html = '';
    /* 搜索框 */
    html += '<div class="fr-add-search-wrap"><label class="fr-add-search__field">'
      + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>'
      + '<input class="fr-add-search__input" data-fr-search="addGroup" type="search" placeholder="搜索群名 / 类型 / 公告" aria-label="搜索群聊" value="' + escapeHtml(state.search.addGroup || '') + '">'
      + '</label></div>';
    if (list.length === 0) {
      html += emptyHtml('没有匹配的群聊', '试试其他关键词');
    } else {
      html += '<section class="fr-section">'
        + '<div class="fr-section__head"><h3 class="fr-section__title">可加入的群聊</h3>'
        + '<span class="fr-section__count">' + list.length + ' 个</span></div>';
      list.forEach(function (g) {
        var avatar = '<span class="fr-avatar fr-avatar--group" style="background:' + g.avatarColor + '">' + escapeHtml(g.avatarText) + '</span>';
        var applied = !!state.appliedGroups[g.id];
        var joinBtn = applied
          ? '<button class="fr-follow is-following" data-action="join-group" data-gid="' + g.id + '" disabled>已申请</button>'
          : '<button class="fr-follow" data-action="join-group" data-gid="' + g.id + '">' + IC.plus() + '加入</button>';
        html += '<div class="fr-row" data-gid="' + g.id + '">'
          + avatar
          + '<div class="fr-row__main">'
            + '<div class="fr-row__top"><span class="fr-row__name">' + escapeHtml(g.name) + '</span>'
            + '<span class="fr-grouptype fr-grouptype--' + g.type + '">' + escapeHtml(g.typeLabel) + '</span></div>'
            + '<div class="fr-row__sub"><span class="fr-row__preview">' + escapeHtml(g.announcement || '') + '</span></div>'
          + '</div>'
          + joinBtn
        + '</div>';
      });
      html += '</section>';
    }
    dom.addBody.innerHTML = html;
    var si = dom.addBody.querySelector('[data-fr-search="addGroup"]');
    if (si) {
      si.addEventListener('input', function (ev) {
        state.search.addGroup = ev.target.value;
        renderAddGroup();
        var nf = dom.addBody.querySelector('[data-fr-search="addGroup"]');
        if (nf) { nf.focus(); nf.setSelectionRange(nf.value.length, nf.value.length); }
      });
    }
  }

  /* Task 4：组建团队 tab —— 团队名 + 描述 + 邀请成员（demo：表单 + 创建按钮） */
  function renderAddTeam() {
    var html = '';
    html += '<div class="fr-create-team">';
    /* 团队名 */
    html += '<div class="fr-create-team__field"><label class="fr-create-team__label">团队名称</label>'
      + '<input class="fr-create-team__input" data-fr-team-name type="text" placeholder="例如：固态电池攻坚组" maxlength="20"></div>';
    /* 团队描述 */
    html += '<div class="fr-create-team__field"><label class="fr-create-team__label">团队目标</label>'
      + '<textarea class="fr-create-team__textarea" data-fr-team-desc rows="3" placeholder="一句话描述团队协作目标" maxlength="80"></textarea></div>';
    /* 邀请成员（从好友列表选） */
    html += '<div class="fr-create-team__field"><label class="fr-create-team__label">邀请成员</label>';
    html += '<div class="fr-create-team__members">';
    var partnerIds = FRIEND_GROUPS.partners || [];
    partnerIds.forEach(function (uid) {
      var u = userById(uid);
      if (!u) return;
      html += '<button class="fr-create-team__member" data-action="toggle-invite" data-uid="' + u.id + '">'
        + '<span class="fr-avatar fr-avatar--tap" style="background:' + (u.avatarColor || '#6B655C') + '">' + escapeHtml(u.initials || u.name) + '</span>'
        + '<span class="fr-create-team__member-name">' + escapeHtml(u.name) + '</span>'
        + '</button>';
    });
    html += '</div></div>';
    /* 创建按钮 */
    html += '<button class="fr-create-team__submit" data-action="create-team">' + IC.plus() + '创建团队</button>';
    html += '</div>';
    dom.addBody.innerHTML = html;
  }

  function emptyHtml(title, sub) {
    return '<div class="fr-empty"><p class="fr-empty__title">' + escapeHtml(title) + '</p>'
      + '<p class="fr-empty__sub">' + escapeHtml(sub) + '</p></div>';
  }

  /* ----------------------------- 渲染：聊天页 ----------------------------- */

  function openChat(peerId) {
    state.peerId = peerId;
    state.aiOn = false;
    state.peerAiMode = false;  /* Task 3：每次打开聊天重置对方 AI 模式 */
    state.aiCounters['1on1'] = 0;
    var peer = userById(peerId);
    if (!peer) return;

    /* Task 4：点击好友后清除未读红点 */
    if (FRIEND_STATE[peerId]) {
      FRIEND_STATE[peerId].unread = 0;
    }
    /* Task 5：最近点击的好友置顶（移到 recentClickOrder 最前） */
    var idx = recentClickOrder.indexOf(peerId);
    if (idx >= 0) recentClickOrder.splice(idx, 1);
    recentClickOrder.unshift(peerId);
    /* 限制队列长度，避免无限增长 */
    if (recentClickOrder.length > 20) recentClickOrder.length = 20;
    /* 重新渲染好友列表，让红点消失 + 顺序更新（列表当前被 chat 覆盖，返回时可见） */
    try { renderFriendsList(); } catch (e) {}

    /* 顶栏：点头像 → 访客视角个人主页；状态不再展示权威分 */
    var st = FRIEND_STATE[peerId] || {};
    var statusText = st.online ? '在线' : (st.last || '离线');
    var statusCls = st.online ? '' : 'is-offline';
    dom.chatTop.innerHTML = ''
      + '<button class="fr-iconbtn" data-action="back-list" aria-label="返回">' + IC.back() + '</button>'
      + '<div class="fr-chat-head">'
        + '<button class="fr-chat-head__ava fr-chat-head__ava--tap" data-action="open-guest-profile" data-uid="' + peerId + '" style="background:' + (peer.avatarColor || '#6B655C') + '" aria-label="查看 ' + escapeHtml(peer.name) + ' 的个人主页">' + escapeHtml(peer.initials || peer.name) + '</button>'
        + '<div class="fr-chat-head__main">'
          + '<span class="fr-chat-head__name">' + escapeHtml(peer.name) + '</span>'
          + '<span class="fr-chat-head__status ' + statusCls + '">' + escapeHtml(statusText) + '</span>'
        + '</div>'
      + '</div>'
      + '<button class="fr-ai-btn" data-fr-chat-ai data-action="toggle-ai" data-ctx="1on1" aria-label="林介入对话" aria-pressed="false">' + IC.spark() + '</button>'
      + '<button class="fr-iconbtn" data-action="peer-more" aria-label="更多">' + IC.more() + '</button>';

    /* AI 条初始关闭 */
    dom.chatAiBar.classList.remove('is-on');
    dom.chatAiBar.innerHTML = ''
      + '<span class="fr-ai-bar__spark">' + IC.spark() + '</span>'
      + '<span class="fr-ai-bar__text">AI 正在旁观你们的对话 · 可随时被 @ 召唤</span>'
      + '<button class="fr-ai-bar__close" data-action="toggle-ai" data-ctx="1on1" aria-label="关闭 AI 旁观">×</button>';

    /* 消息流 */
    var msgs = MOCK_CHATS[peerId] ? MOCK_CHATS[peerId].slice() : [];
    renderChatMessages(msgs, false);
    showView('chat');

    /* 输入框聚焦状态初始化 */
    if (dom.chatInput) { dom.chatInput.value = ''; updateSendState(dom.chatInput, dom.chatSend); }
  }

  function openGroup(groupId) {
    state.groupId = groupId;
    state.isTeamChat = false;   /* Task 12：进入群聊时重置团队聊天标记 */
    state.aiOn = false;
    state.aiCounters.group = 0;
    var g = null;
    for (var i = 0; i < MOCK_GROUPS.length; i++) { if (MOCK_GROUPS[i].id === groupId) g = MOCK_GROUPS[i]; }
    if (!g) return;

    /* 点击后清除红点（未读归零并重渲染列表） */
    if (g.unread > 0) {
      g.unread = 0;
      renderGroupsList();
    }
    /* Task 4：记录最近点击（置顶到最上方） */
    bumpRecent(state.recentGroups, groupId);

    /* 顶栏（Task 7：群聊不显示 AI 介入按钮，仅保留群设置三点） */
    dom.groupTop.innerHTML = ''
      + '<button class="fr-iconbtn" data-action="back-list" aria-label="返回">' + IC.back() + '</button>'
      + '<div class="fr-chat-head">'
        + '<button class="fr-chat-head__ava fr-chat-head__ava--group fr-chat-head__ava--tap" data-action="open-group-info" data-gid="' + g.id + '" style="background:' + g.avatarColor + '" aria-label="查看群「' + escapeHtml(g.name) + '」详情">' + escapeHtml(g.avatarText) + '</button>'
        + '<div class="fr-chat-head__main">'
          + '<span class="fr-chat-head__name">' + escapeHtml(g.name) + '</span>'
          + '<span class="fr-chat-head__status">' + g.members.length + ' 位成员 · ' + escapeHtml(g.typeLabel) + '</span>'
        + '</div>'
      + '</div>'
      + '<button class="fr-iconbtn" data-action="group-settings" aria-label="群设置">' + IC.more() + '</button>';

    /* 群公告条 */
    dom.groupAnnounce.classList.remove('is-hidden');
    dom.groupAnnounce.innerHTML = ''
      + '<span class="fr-announce__tag">公告</span>'
      + '<span class="fr-announce__text">' + escapeHtml(g.announcement || '') + '</span>';

    /* 共享笔记区：聊天页不再展示（移至群详情页，避免重复累赘） */
    if (dom.groupShared) { dom.groupShared.innerHTML = ''; dom.groupShared.style.display = 'none'; }

    /* AI 条 */
    dom.groupAiBar.classList.remove('is-on');
    dom.groupAiBar.innerHTML = ''
      + '<span class="fr-ai-bar__spark">' + IC.spark() + '</span>'
      + '<span class="fr-ai-bar__text">AI 正在旁观群聊 · 可被 @ 召唤 · 偶尔主动插话</span>'
      + '<button class="fr-ai-bar__close" data-action="toggle-ai" data-ctx="group" aria-label="关闭 AI 旁观">×</button>';

    /* 消息流 */
    var msgs = MOCK_GROUP_CHATS[groupId] ? MOCK_GROUP_CHATS[groupId].slice() : [];
    renderChatMessages(msgs, true, dom.groupMsgs);
    showView('group');

    if (dom.groupInput) { dom.groupInput.value = ''; updateSendState(dom.groupInput, dom.groupSend); }
  }

  /* ----------------------------- Task 12/13：团队聊天视角 + 共同作品 -----------------------------
   * 团队与群组严格区分：团队是协作主体，有共同作品区（笔记/工作流/报告）
   * 复用 group 视图 DOM，但顶栏标注「团队」，并在共享笔记区替换为「共同作品」 */
  function openTeamChat(teamId) {
    state.groupId = teamId;       /* 复用 group 视图机制 */
    state.isTeamChat = true;      /* Task 12：标记当前是团队聊天（区别于群聊） */
    state.aiOn = false;
    state.aiCounters.group = 0;
    var t = null;
    for (var i = 0; i < MOCK_TEAMS.length; i++) { if (MOCK_TEAMS[i].id === teamId) { t = MOCK_TEAMS[i]; break; } }
    if (!t) return;

    /* 点击后清除红点（未读归零并重渲染列表） */
    if (t.unread > 0) {
      t.unread = 0;
      renderTeamsList();
    }
    /* Task 4：记录最近点击（置顶到最上方） */
    bumpRecent(state.recentTeams, teamId);

    /* 顶栏：团队头像 + 团队名 + 「团队」标识 + 三点（进团队详情） */
    dom.groupTop.innerHTML = ''
      + '<button class="fr-iconbtn" data-action="back-list" aria-label="返回">' + IC.back() + '</button>'
      + '<div class="fr-chat-head">'
        + '<button class="fr-chat-head__ava fr-chat-head__ava--group fr-chat-head__ava--tap" data-action="open-team-info" data-tid="' + t.id + '" style="background:' + t.avatarColor + '" aria-label="查看团队「' + escapeHtml(t.name) + '」详情">' + escapeHtml(t.avatarText) + '</button>'
        + '<div class="fr-chat-head__main">'
          + '<span class="fr-chat-head__name">' + escapeHtml(t.name) + '</span>'
          + '<span class="fr-chat-head__status">' + t.members + ' 位成员 · 我是' + escapeHtml(t.role) + '</span>'
        + '</div>'
      + '</div>'
      + '<button class="fr-iconbtn" data-action="team-settings" aria-label="团队设置">' + IC.more() + '</button>';

    /* 团队公告/目标条 */
    dom.groupAnnounce.classList.remove('is-hidden');
    dom.groupAnnounce.innerHTML = ''
      + '<span class="fr-announce__tag fr-announce__tag--team">目标</span>'
      + '<span class="fr-announce__text">' + escapeHtml(t.desc || '') + '</span>';

    /* Task 13：共同作品区已移至团队详情页，聊天页不再展示（避免重复累赘） */
    if (dom.groupShared) { dom.groupShared.innerHTML = ''; dom.groupShared.style.display = 'none'; }

    /* AI 条（团队不显示 AI 按钮，但保留 @ 召唤能力） */
    dom.groupAiBar.classList.remove('is-on');

    /* 消息流：团队聊天 */
    var msgs = MOCK_TEAM_CHATS[teamId] ? MOCK_TEAM_CHATS[teamId].slice() : [];
    renderChatMessages(msgs, true, dom.groupMsgs);
    showView('group');

    if (dom.groupInput) {
      dom.groupInput.value = '';
      dom.groupInput.placeholder = '在团队中发言 · 输入 @ 提及成员';
      updateSendState(dom.groupInput, dom.groupSend);
    }
  }

  /* ----------------------------- 群/团队详情页 -----------------------------
   * kind = 'group' | 'team'
   * 展示头像/名称/简介 +（群）公告与共享笔记 + 成员列表（点头像/行 → 进成员主页）
   * Task 10：成员列表区分群主/管理员/普通成员 */
  function openInfo(kind, id) {
    if (!dom.viewInfo) return;
    /* 记录来源：群详情→回群聊；团队详情→回团队聊天；聊天设置→回聊天页 */
    state.infoFrom = (kind === 'group') ? 'group' : (kind === 'team' ? 'team' : 'list');
    var title, heroColor, heroText, heroName, heroSub, announceHtml = '', sharedHtml = '', memberIds = [];
    var owner = null, admins = [];
    var kindTag = '';  /* Task 12：群/团队严格区分的视觉标签 */

    if (kind === 'group') {
      var g = null;
      for (var i = 0; i < MOCK_GROUPS.length; i++) { if (MOCK_GROUPS[i].id === id) { g = MOCK_GROUPS[i]; break; } }
      if (!g) return;
      title = g.name; heroColor = g.avatarColor; heroText = g.avatarText;
      heroName = g.name; heroSub = g.members.length + ' 位成员 · ' + g.typeLabel;
      owner = g.owner || null; admins = g.admins || [];
      kindTag = '<span class="fr-info-kind fr-info-kind--group">群聊</span>';
      announceHtml = '<div class="fr-announce fr-info__announce">'
        + '<span class="fr-announce__tag">公告</span>'
        + '<span class="fr-announce__text">' + escapeHtml(g.announcement || '') + '</span>'
        + '</div>';
      var sh = '';
      (g.sharedNotes || []).forEach(function (nid) {
        var n = noteById(nid); if (!n) return;
        sh += '<button class="fr-shared__chip" data-action="open-note" data-note-id="' + n.id + '">'
          + IC.doc() + escapeHtml(truncate(n.title, 14)) + '</button>';
      });
      if (sh) sharedHtml = '<div class="fr-shared fr-info__shared"><div class="fr-shared__title">共享笔记</div>' + sh + '</div>';
      memberIds = g.members || [];
    } else {
      var t = null;
      for (var j = 0; j < MOCK_TEAMS.length; j++) { if (MOCK_TEAMS[j].id === id) { t = MOCK_TEAMS[j]; break; } }
      if (!t) return;
      title = t.name; heroColor = t.avatarColor; heroText = t.avatarText;
      heroName = t.name; heroSub = t.members + ' 位成员 · 我是' + t.role + ' · ' + escapeHtml(t.desc || '');
      owner = t.owner || null; admins = t.admins || [];
      kindTag = '<span class="fr-info-kind fr-info-kind--team">团队</span>';
      announceHtml = '<div class="fr-announce fr-info__announce">'
        + '<span class="fr-announce__tag fr-announce__tag--team">目标</span>'
        + '<span class="fr-announce__text">' + escapeHtml(t.desc || '') + '</span>'
        + '</div>';
      /* Task 13：团队详情页展示共同作品区 */
      var tw = '';
      var works = MOCK_TEAM_WORKS[id] || [];
      works.forEach(function (w) {
        var typeIcon = w.type === 'workflow' ? IC.gear() : (w.type === 'report' ? IC.doc() : IC.note());
        var typeLabel = w.type === 'workflow' ? '工作流' : (w.type === 'report' ? '报告' : '笔记');
        tw += '<button class="fr-work-chip" data-action="open-team-work" data-wtype="' + w.type + '">'
          + '<span class="fr-work-chip__icon">' + typeIcon + '</span>'
          + '<span class="fr-work-chip__main"><span class="fr-work-chip__title">' + escapeHtml(w.title) + '</span>'
          + '<span class="fr-work-chip__meta">' + typeLabel + ' · ' + escapeHtml(w.author) + ' · ' + escapeHtml(w.time) + '</span></span>'
          + '</button>';
      });
      if (tw) sharedHtml = '<div class="fr-works fr-info__works"><div class="fr-works-header"><span class="fr-works-header__title">共同作品</span><span class="fr-works-header__count">' + works.length + '</span></div>' + tw + '</div>';
      memberIds = t.memberIds || [];
    }

    var shown = 0;
    var rows = '';
    /* Task 5/6：判断当前用户是否为群主/管理员（有踢人/发公告权限） */
    var isOwner = (owner === ME_ID);
    var isAdmin = isOwner || (admins.indexOf(ME_ID) >= 0);
    memberIds.forEach(function (uid) {
      var u = userById(uid);
      if (!u) return;
      shown++;
      var role = (uid === owner) ? 'owner' : (admins.indexOf(uid) >= 0 ? 'admin' : null);
      /* Task 6：管理员可踢非群主、非自己的成员 */
      var canKick = isAdmin && uid !== owner && uid !== ME_ID;
      rows += renderInfoMemberRow(u, role, canKick, kind);
    });

    /* Task 5：成员区头部 —— 邀请成员入口 */
    var inviteHtml = '<button class="fr-info-invite" data-action="invite-member" data-kind="' + kind + '" data-id="' + id + '">'
      + IC.plus() + '<span>邀请' + (kind === 'group' ? '群成员' : '团队成员') + '</span></button>';

    /* Task 6：管理员操作区（发公告等） */
    var adminHtml = '';
    if (isAdmin) {
      adminHtml = '<div class="fr-info-admin">'
        + '<div class="fr-section__head"><h3 class="fr-section__title">管理</h3></div>'
        + '<div class="fr-settings-block">'
        + '<button class="fr-set-row" data-action="edit-announce" data-kind="' + kind + '" data-id="' + id + '">'
        + '<span class="fr-set-row__icon">' + IC.pencil() + '</span>'
        + '<span class="fr-set-row__name">' + (kind === 'group' ? '修改群公告' : '修改团队目标') + '</span>'
        + '<span class="fr-set-row__chev">›</span></button>'
        + (kind === 'group'
          ? '<button class="fr-set-row" data-action="manage-members" data-id="' + id + '">'
            + '<span class="fr-set-row__icon">' + IC.gear() + '</span>'
            + '<span class="fr-set-row__name">成员管理</span>'
            + '<span class="fr-set-row__chev">›</span></button>'
          : '')
        + '</div></div>';
    }

    /* Task 6：退群/退出团队按钮 */
    var leaveLabel = kind === 'group' ? '退出群聊' : '退出团队';
    var leaveHtml = '<div class="fr-info-leave"><button class="fr-info-leave__btn" data-action="leave-' + kind + '" data-id="' + id + '">' + escapeHtml(leaveLabel) + '</button></div>';

    var html = ''
      + '<div class="fr-info-top">'
      +   '<button class="fr-iconbtn" data-action="info-back" aria-label="返回">' + IC.back() + '</button>'
      +   '<span class="fr-info-title">' + escapeHtml(title) + '</span>'
      +   '<span class="fr-info-spacer" aria-hidden="true"></span>'
      + '</div>'
      + '<div class="fr-info-scroll">'
      +   '<div class="fr-info-hero">'
      +     '<span class="fr-info-hero__ava" style="background:' + heroColor + '">' + escapeHtml(heroText) + '</span>'
      +     '<div class="fr-info-hero__main">'
      +       '<span class="fr-info-hero__name">' + escapeHtml(heroName) + kindTag + '</span>'
      +       '<span class="fr-info-hero__sub">' + heroSub + '</span>'
      +     '</div>'
      +   '</div>'
      +   announceHtml
      +   sharedHtml
      +   adminHtml
      +   '<div class="fr-section fr-info__members">'
      +     '<div class="fr-section__head"><h3 class="fr-section__title">成员</h3>'
      +     '<span class="fr-section__count">' + shown + ' 位</span></div>'
      +     '<div class="fr-info-members">' + rows + '</div>'
      +     inviteHtml
      +   '</div>'
      +   leaveHtml
      + '</div>';
    dom.viewInfo.innerHTML = html;
    showView('info');
  }

  function renderInfoMemberRow(u, role, canKick, kind) {
    /* Task 10：role = 'owner' | 'admin' | null，显示群主/管理员标签
     * Task 6：canKick = true 时显示踢人按钮（管理员/群主可用） */
    var roleHtml = '';
    if (role === 'owner') {
      roleHtml = '<span class="fr-member-role fr-member-role--owner">' + (kind === 'team' ? '创建者' : '群主') + '</span>';
    } else if (role === 'admin') {
      roleHtml = '<span class="fr-member-role fr-member-role--admin">管理员</span>';
    }
    var kickHtml = canKick ? '<button class="fr-member-kick" data-action="kick-member" data-uid="' + u.id + '" data-kind="' + (kind || 'group') + '" aria-label="移出">移出</button>' : '';
    return '<button class="fr-row" data-action="open-guest-profile" data-uid="' + u.id + '">'
      + avatarHtml(u)
      + '<div class="fr-row__main">'
      +   '<div class="fr-row__top"><span class="fr-row__name">' + escapeHtml(u.name) + '</span>' + roleHtml + '</div>'
      +   '<div class="fr-row__sub"><span class="fr-row__domain">' + escapeHtml(u.domain || '') + '</span>'
      +     '<span class="fr-row__preview">' + escapeHtml(u.bio || '') + '</span></div>'
      + '</div>'
      + kickHtml
      + '<span class="fr-row__chev">' + svg('<path d="M9 6l6 6-6 6"/>', 16) + '</span>'
      + '</button>';
  }

  /* ----------------------------- Task 2：1对1 聊天设置页 -----------------------------
   * 好友聊天页右上角三点 → 进入聊天设置新页（类似微信/QQ）
   * 包含：查找聊天记录 / 消息免打扰 / 置顶 / 聊天背景 / 举报 / 清空聊天记录 / 删除好友
   * 复用 dom.viewInfo 全屏视图；infoFrom='chat'，返回时回到聊天页 */
  function openChatSettings(peerId) {
    if (!dom.viewInfo) return;
    var peer = userById(peerId);
    if (!peer) return;
    state.infoFrom = 'chat';
    var st = FRIEND_STATE[peerId] || {};
    var statusText = st.online ? '在线' : (st.last || '离线');

    /* 聊天设置项状态（demo：默认关闭，点击切换） */
    if (!state.chatSettings) state.chatSettings = {};
    var cs = state.chatSettings[peerId] || { mute: false, pin: false };

    var html = ''
      + '<div class="fr-info-top">'
      +   '<button class="fr-iconbtn" data-action="info-back" aria-label="返回">' + IC.back() + '</button>'
      +   '<span class="fr-info-title">聊天设置</span>'
      +   '<span class="fr-info-spacer" aria-hidden="true"></span>'
      + '</div>'
      + '<div class="fr-info-scroll">'
      /* 好友卡片：头像 + 名字 + 状态 */
      +   '<div class="fr-info-hero">'
      +     '<button class="fr-info-hero__ava fr-info-hero__ava--tap" data-action="open-guest-profile" data-uid="' + peerId + '" style="background:' + (peer.avatarColor || '#6B655C') + '" aria-label="查看 ' + escapeHtml(peer.name) + ' 的主页">' + escapeHtml(peer.initials || peer.name) + '</button>'
      +     '<div class="fr-info-hero__main">'
      +       '<span class="fr-info-hero__name">' + escapeHtml(peer.name) + '</span>'
      +       '<span class="fr-info-hero__sub">' + escapeHtml(peer.domain || '') + ' · ' + escapeHtml(statusText) + '</span>'
      +     '</div>'
      +   '</div>'
      /* 分组一：基础设置 */
      +   '<div class="fr-settings-block">'
      +     '<button class="fr-set-row" data-action="cs-search"><span class="fr-set-row__icon">' + IC.search() + '</span><span class="fr-set-row__name">查找聊天记录</span><span class="fr-set-row__chev">›</span></button>'
      +     '<div class="fr-set-row fr-set-row--toggle">'
      +       '<span class="fr-set-row__icon">' + IC.forbid() + '</span>'
      +       '<span class="fr-set-row__name">消息免打扰</span>'
      +       '<span class="fr-set-toggle' + (cs.mute ? ' is-on' : '') + '" data-action="cs-toggle-mute" data-uid="' + peerId + '" role="switch" aria-checked="' + cs.mute + '" aria-label="消息免打扰" tabindex="0"><span class="fr-set-toggle__knob"></span></span>'
      +     '</div>'
      +     '<div class="fr-set-row fr-set-row--toggle">'
      +       '<span class="fr-set-row__icon">' + IC.pin() + '</span>'
      +       '<span class="fr-set-row__name">置顶聊天</span>'
      +       '<span class="fr-set-toggle' + (cs.pin ? ' is-on' : '') + '" data-action="cs-toggle-pin" data-uid="' + peerId + '" role="switch" aria-checked="' + cs.pin + '" aria-label="置顶聊天" tabindex="0"><span class="fr-set-toggle__knob"></span></span>'
      +     '</div>'
      +     '<button class="fr-set-row" data-action="cs-bg"><span class="fr-set-row__icon">' + IC.image() + '</span><span class="fr-set-row__name">聊天背景</span><span class="fr-set-row__chev">›</span></button>'
      +   '</div>'
      /* 分组二：内容与互动 */
      +   '<div class="fr-settings-block">'
      +     '<button class="fr-set-row" data-action="cs-shared"><span class="fr-set-row__icon">' + IC.note() + '</span><span class="fr-set-row__name">共享笔记</span><span class="fr-set-row__chev">›</span></button>'
      +     '<button class="fr-set-row" data-action="cs-debates"><span class="fr-set-row__icon">' + IC.vs() + '</span><span class="fr-set-row__name">共同讨论</span><span class="fr-set-row__chev">›</span></button>'
      +   '</div>'
      /* 分组三：风险操作 */
      +   '<div class="fr-settings-block">'
      +     '<button class="fr-set-row fr-set-row--danger" data-action="cs-report"><span class="fr-set-row__icon">' + IC.forbid() + '</span><span class="fr-set-row__name">举报</span><span class="fr-set-row__chev">›</span></button>'
      +     '<button class="fr-set-row fr-set-row--danger" data-action="cs-clear"><span class="fr-set-row__icon">' + IC.trash() + '</span><span class="fr-set-row__name">清空聊天记录</span><span class="fr-set-row__chev">›</span></button>'
      +     '<button class="fr-set-row fr-set-row--danger" data-action="cs-delete"><span class="fr-set-row__icon">' + IC.trash() + '</span><span class="fr-set-row__name">删除好友</span><span class="fr-set-row__chev">›</span></button>'
      +   '</div>'
      + '</div>';
    dom.viewInfo.innerHTML = html;
    showView('info');
  }

  function renderChatMessages(msgs, isGroup, target) {
    var host = target || dom.chatMsgs;
    var me = userById(ME_ID);
    var html = '';
    msgs.forEach(function (m) {
      html += renderMessage(m, { isGroup: !!isGroup, me: me });
    });
    host.innerHTML = html;
    /* 滚到底 */
    requestAnimationFrame(function () {
      host.scrollTop = host.scrollHeight;
    });
  }

  function appendMessage(m, isGroup) {
    var host = isGroup ? dom.groupMsgs : dom.chatMsgs;
    var me = userById(ME_ID);
    var node = el('div');
    node.innerHTML = renderMessage(m, { isGroup: !!isGroup, me: me });
    var frag = document.createDocumentFragment();
    while (node.firstChild) frag.appendChild(node.firstChild);
    host.appendChild(frag);
    requestAnimationFrame(function () { host.scrollTop = host.scrollHeight; });
  }

  function truncate(s, n) {
    s = s || '';
    return s.length > n ? s.slice(0, n) + '…' : s;
  }

  /* ----------------------------- AI 介入 -----------------------------
   * Task 3：1对1 聊天的 AI 按钮 → 切换到「对方的 AI」聊天视图
   *   - 顶栏头像变金色 AI 头像，名字变「对方名字的 AI」
   *   - 消息流切换为与对方 AI 的对话
   *   - 再点一次切换回正常聊天
   * 群聊已移除 AI 按钮（Task 7），group 上下文保留兼容旧逻辑 */

  /* 对方 AI 的对话数据（key = peerId）；首次切换时初始化 */
  var MOCK_PEER_AI_CHATS = {};

  /* 对方 AI 回复池：基于对方新人设生成（demo 轮转） */
  var PEER_AI_REPLIES = {
    'u-linzw': [
      '我是林知微的 AI 助手。她是材料学博士，专攻固态电池，有什么硬核问题我可以帮你梳理。',
      '从她的笔记看，LiNbO₃ 涂层 3nm 是目前最优值，但样品数还不够。想深入的话我可以调出她的界面阻抗数据。',
      '她习惯用第一性原理看问题。你的这个问题，她会先问：本质是界面化学还是界面物理？'
    ],
    'u-zhangheng': [
      '我是张衡老师的 AI 助手。他是大学化学老师，爱从哲学角度聊科学问题。',
      '他会建议你：化学实验的统计涨落比想象的大，至少 20 个样品跨 3 个批次才能下结论。',
      '他的口头禅是「先问为什么，再问怎么做」。你的问题他会先反问：你为什么觉得这个方向值得做？'
    ],
    'u-suqing': [
      '我是苏青的 AI 助手。她是电池厂工程师，最近也在研究理财和存钱。',
      '从产线角度，她会说：加了涂层确实有效，但工艺窗口很窄，成本也得算进去。',
      '她最近在记账本里用 50/30/20 分配法，第一个月就存下了 2000 块。你要聊理财也行。'
    ],
    'u-chenmb': [
      '我是陈墨白的 AI 助手。他是科研民工，下班就撸猫和做饭。',
      '他最近写了一篇懒人一周做饭攻略，30 块吃好一周，你要看看吗？',
      '他会提醒你：实验室和厨房的最大的区别是，厨房可以试错，实验不行。'
    ],
    'u-jiangyue': [
      '我是江月的 AI 助手。她是生活博主，最近在大理旅行，聊情感和日常。',
      '她会说：考研焦虑很正常，但别让它吞噬你的生活。大理的阳光很治愈。',
      '她反问你：你上一次完全不想正事是什么时候？如果记不清了，该休息了。'
    ],
    'u-shenyan': [
      '我是沈砚的 AI 助手。他是自由职业者，聊哲学和极简生活。',
      '他的观点：短视频的即时反馈确实在利用多巴胺，但叫它"绑架"过于简化了，人是有选择权的。',
      '他会建议你：试试一天不刷短视频，把那段时间用来发呆也行。你会发现焦虑减轻不少。'
    ],
    'u-hanxing': [
      '我是韩星的 AI 助手。他是健身爱好者+程序员，生活特别自律。',
      '他会指出：健身新手第一个月最容易犯的错就是上太大重量，动作变形比练不够严重多了。',
      '他的建议：先练好动作模式，再加重量。编程和健身一样，基础不牢地动山摇。'
    ],
    'u-zhouye': [
      '我是周野的 AI 助手。他是全职科普 UP 主，十万粉，话特别多。',
      '他最近做的量子力学视频破了十万播放，他可以把复杂的事说得很简单。',
      '他会问你：这个话题要做成视频的话，目标受众是谁？决定了解释的深度。'
    ],
    'u-guci': [
      '我是顾辞的 AI 助手。她有认知科学背景，爱聊思维模型和反直觉问题。',
      '她的观点：先有鸡还是先有蛋，从生物学角度来说是先有蛋——因为基因变异发生在生殖细胞里。',
      '她会建议你：遇到这类问题，先拆清楚定义再争论，不然吵到天亮也没结果。'
    ],
    'u-liqy': [
      '我是李轻语的 AI 助手。她是研二学生，考研二战上岸，方法论控。',
      '她整理了二战的复盘方法：每道错题拆成三个问题——错在哪、为什么错、怎么避免。',
      '她会问你：你现在是焦虑还是迷茫？焦虑就拆任务，迷茫就先做一件小事。'
    ]
  };

  /* 默认回复（未命中具体用户时） */
  function peerAiReply(peerId, idx) {
    var pool = PEER_AI_REPLIES[peerId] || [
      '我是对方的 AI 助手，可以帮你梳理 TA 的研究主线和观点。',
      '基于 TA 的笔记和讨论记录，我建议你从这个角度切入。',
      '你的问题很有意思，我可以调出 TA 相关的笔记和数据。'
    ];
    return pool[idx % pool.length];
  }

  function toggleAI(ctx) {
    if (ctx === 'group') {
      /* Task 12：团队聊天不启用 AI 旁观（团队与群聊严格区分） */
      if (state.isTeamChat) return;
      /* 群聊：保留旧逻辑（AI 旁观条），但群聊已无 AI 按钮，此处兜底 */
      state.aiOn = !state.aiOn;
      var gBtn = $('[data-fr-group-ai]');
      if (gBtn) {
        gBtn.classList.toggle('is-active', state.aiOn);
        gBtn.setAttribute('aria-pressed', state.aiOn ? 'true' : 'false');
      }
      if (dom.groupAiBar) dom.groupAiBar.classList.toggle('is-on', state.aiOn);
      return;
    }

    /* Task 3：1对1 → 切换「对方的 AI」聊天视图 */
    state.peerAiMode = !state.peerAiMode;
    var btn = $('[data-fr-chat-ai]');
    if (btn) {
      btn.classList.toggle('is-active', state.peerAiMode);
      btn.setAttribute('aria-pressed', state.peerAiMode ? 'true' : 'false');
    }
    /* 隐藏旧的 AI 旁观条（不再使用） */
    if (dom.chatAiBar) dom.chatAiBar.classList.remove('is-on');

    if (state.peerAiMode) {
      /* 进入对方 AI 视图：重渲顶栏 + 消息流 */
      renderPeerAiChatTop();
      var peerId = state.peerId;
      if (!MOCK_PEER_AI_CHATS[peerId]) {
        /* 初始化：AI 主动开场 */
        var peer = userById(peerId);
        var aiName = (peer ? peer.name : '对方') + '的 AI';
        MOCK_PEER_AI_CHATS[peerId] = [
          { role: 'ai', text: '你好，我是' + aiName + '。我可以帮你梳理 ' + (peer ? peer.name : 'TA') + ' 的研究主线、笔记和观点。有什么想了解的？', time: nowHHMM() }
        ];
      }
      renderChatMessages(MOCK_PEER_AI_CHATS[peerId].slice(), false);
      toast('已切换到对方的 AI');
    } else {
      /* 切回正常聊天 */
      var p = state.peerId;
      renderChatTopNormal();
      var msgs = MOCK_CHATS[p] ? MOCK_CHATS[p].slice() : [];
      renderChatMessages(msgs, false);
      toast('已切回正常对话');
    }
  }

  /* Task 3：对方 AI 模式下的顶栏（金色 AI 头像 + 对方名字的 AI） */
  function renderPeerAiChatTop() {
    var peer = userById(state.peerId);
    if (!peer || !dom.chatTop) return;
    var aiName = peer.name + '的 AI';
    dom.chatTop.innerHTML = ''
      + '<button class="fr-iconbtn" data-action="back-list" aria-label="返回">' + IC.back() + '</button>'
      + '<div class="fr-chat-head">'
        + '<span class="fr-chat-head__ava" style="background:var(--gold-500);color:var(--ink-900)" aria-label="' + escapeHtml(aiName) + '">AI</span>'
        + '<div class="fr-chat-head__main">'
          + '<span class="fr-chat-head__name">' + escapeHtml(aiName) + '</span>'
          + '<span class="fr-chat-head__status">AI 助手 · 基于 ' + escapeHtml(peer.name) + ' 的笔记与讨论</span>'
        + '</div>'
      + '</div>'
      + '<button class="fr-ai-btn is-active" data-fr-chat-ai data-action="toggle-ai" data-ctx="1on1" aria-label="切回正常对话" aria-pressed="true">' + IC.spark() + '</button>'
      + '<button class="fr-iconbtn" data-action="peer-more" aria-label="更多">' + IC.more() + '</button>';
  }

  /* 切回正常聊天顶栏 */
  function renderChatTopNormal() {
    var peer = userById(state.peerId);
    if (!peer || !dom.chatTop) return;
    var st = FRIEND_STATE[state.peerId] || {};
    var statusText = st.online ? '在线' : (st.last || '离线');
    var statusCls = st.online ? '' : 'is-offline';
    dom.chatTop.innerHTML = ''
      + '<button class="fr-iconbtn" data-action="back-list" aria-label="返回">' + IC.back() + '</button>'
      + '<div class="fr-chat-head">'
        + '<button class="fr-chat-head__ava fr-chat-head__ava--tap" data-action="open-guest-profile" data-uid="' + state.peerId + '" style="background:' + (peer.avatarColor || '#6B655C') + '" aria-label="查看 ' + escapeHtml(peer.name) + ' 的个人主页">' + escapeHtml(peer.initials || peer.name) + '</button>'
        + '<div class="fr-chat-head__main">'
          + '<span class="fr-chat-head__name">' + escapeHtml(peer.name) + '</span>'
          + '<span class="fr-chat-head__status ' + statusCls + '">' + escapeHtml(statusText) + '</span>'
        + '</div>'
      + '</div>'
      + '<button class="fr-ai-btn" data-fr-chat-ai data-action="toggle-ai" data-ctx="1on1" aria-label="切换到对方的 AI" aria-pressed="false">' + IC.spark() + '</button>'
      + '<button class="fr-iconbtn" data-action="peer-more" aria-label="更多">' + IC.more() + '</button>';
  }

  function maybeAIInterject(ctx) {
    if (!state.aiOn) return;
    var key = ctx === 'group' ? 'group' : '1on1';
    state.aiCounters[key] = (state.aiCounters[key] || 0) + 1;
    if (state.aiCounters[key] % 2 !== 0) return; /* 每 2 条用户消息插话一次 */

    var pool = ctx === 'group' ? AI_INTERJECTIONS_GROUP : AI_INTERJECTIONS_1ON1;
    var text = pool[(state.aiCounters[key] / 2 - 1) % pool.length];

    /* 思考动画占位 */
    var typingMsg = { role: 'ai', text: '__typing__', time: nowHHMM() };
    appendTyping(ctx);
    setTimeout(function () {
      removeTyping(ctx);
      appendMessage({ role: 'ai', text: text, time: nowHHMM() }, ctx === 'group');
    }, 1100);
  }

  function appendTyping(ctx) {
    var host = ctx === 'group' ? dom.groupMsgs : dom.chatMsgs;
    var node = el('div', 'fr-msg fr-msg--ai', ''
      + '<span class="fr-msg__ava" style="background:var(--gold-500);color:var(--ink-900)">AI</span>'
      + '<div class="fr-msg__col">'
      + '<div class="fr-ai-prefix">' + IC.spark() + 'AI · 正在思考…</div>'
      + '<div class="fr-msg__bubble"><span class="fr-typing"><span class="fr-typing__dots">'
      + '<span class="fr-typing__dot"></span><span class="fr-typing__dot"></span><span class="fr-typing__dot"></span>'
      + '</span></span></div>'
      + '</div>');
    node.setAttribute('data-typing', '1');
    host.appendChild(node);
    requestAnimationFrame(function () { host.scrollTop = host.scrollHeight; });
  }
  function removeTyping(ctx) {
    var host = ctx === 'group' ? dom.groupMsgs : dom.chatMsgs;
    var t = host.querySelector('[data-typing="1"]');
    if (t) t.parentNode.removeChild(t);
  }

  /* ----------------------------- 发送消息 ----------------------------- */

  function sendMessage(ctx) {
    var input = ctx === 'group' ? dom.groupInput : dom.chatInput;
    var sendBtn = ctx === 'group' ? dom.groupSend : dom.chatSend;
    var text = (input.value || '').trim();
    if (!text) return;
    var msg = { role: 'me', text: text, time: nowHHMM() };
    appendMessage(msg, ctx === 'group');

    /* 写回 mock（保证返回时仍可见） */
    if (ctx === 'group') {
      var g = state.groupId;
      if (state.isTeamChat) {
        /* Task 12/13：团队聊天消息写入 MOCK_TEAM_CHATS */
        (MOCK_TEAM_CHATS[g] = MOCK_TEAM_CHATS[g] || []).push(msg);
      } else {
        (MOCK_GROUP_CHATS[g] = MOCK_GROUP_CHATS[g] || []).push(msg);
      }
    } else if (state.peerAiMode) {
      /* Task 3：对方 AI 模式下，消息写入 MOCK_PEER_AI_CHATS，并触发对方 AI 回复 */
      var paPid = state.peerId;
      (MOCK_PEER_AI_CHATS[paPid] = MOCK_PEER_AI_CHATS[paPid] || []).push(msg);
      input.value = '';
      updateSendState(input, sendBtn);
      closeAttachMenu(ctx);
      closeMention();
      /* 对方 AI 回复（带思考动画） */
      var replyIdx = MOCK_PEER_AI_CHATS[paPid].filter(function (m) { return m.role === 'me'; }).length - 1;
      var replyText = peerAiReply(paPid, replyIdx);
      appendTyping('1on1');
      setTimeout(function () {
        removeTyping('1on1');
        var aiMsg = { role: 'ai', text: replyText, time: nowHHMM() };
        appendMessage(aiMsg, false);
        MOCK_PEER_AI_CHATS[paPid].push(aiMsg);
      }, 900);
      return;
    } else {
      var p = state.peerId;
      (MOCK_CHATS[p] = MOCK_CHATS[p] || []).push(msg);
    }

    input.value = '';
    updateSendState(input, sendBtn);
    closeAttachMenu(ctx);
    closeMention();

    /* AI 是否插话（群聊旁观；团队聊天不触发 AI 旁观插话） */
    if (ctx === 'group' && !state.isTeamChat) maybeAIInterject(ctx);
  }

  function updateSendState(input, btn) {
    if (!input || !btn) return;
    var has = (input.value || '').trim().length > 0;
    btn.disabled = !has;
    /* 有文字时给 input-row 加 is-composing：显示发送、隐藏 +号（微信式） */
    var row = input.closest('.fr-input-row');
    if (row) { row.classList.toggle('is-composing', has); }
  }

  /* ----------------------------- 附件菜单 ----------------------------- */

  function toggleAttachMenu(ctx) {
    var menu = ctx === 'group' ? dom.groupAttachMenu : dom.chatAttachMenu;
    if (!menu) return;
    menu.classList.toggle('is-open');
  }
  function closeAttachMenu(ctx) {
    var menu = ctx === 'group' ? dom.groupAttachMenu : dom.chatAttachMenu;
    if (menu) menu.classList.remove('is-open');
  }

  /* 语音/文字切换：点语音按钮，输入框 ↔ "按住说话" 长条（参考微信） */
  function toggleVoiceMode(ctx) {
    var voiceBtn = ctx === 'group' ? dom.groupVoice : dom.chatVoice;
    var input = ctx === 'group' ? dom.groupInput : dom.chatInput;
    var hold = ctx === 'group' ? dom.groupVoiceHold : dom.chatVoiceHold;
    if (!voiceBtn || !input || !hold) return;
    var voiceOn = !hold.hasAttribute('hidden');
    if (voiceOn) {
      /* 切回文字 */
      hold.setAttribute('hidden', '');
      input.style.display = '';
      voiceBtn.classList.remove('is-active');
    } else {
      /* 切到语音 */
      input.style.display = 'none';
      hold.removeAttribute('hidden');
      voiceBtn.classList.add('is-active');
      input.blur();
    }
  }

  /* 模拟键盘：focus 时滑入，blur 时收起；点击按键往输入框插字 */
  function showKeyboard(ctx) {
    var isGroup = ctx === 'group';
    var kb = isGroup ? dom.groupKeyboard : dom.chatKeyboard;
    var ep = isGroup ? dom.groupEmojiPanel : dom.chatEmojiPanel;
    var ap = isGroup ? dom.groupAttachPanel : dom.chatAttachPanel;
    var row = isGroup ? dom.groupInput : dom.chatInput;
    /* 互斥：弹键盘时强制关闭表情/附件面板 */
    if (ep) ep.setAttribute('hidden', '');
    if (ap) ap.setAttribute('hidden', '');
    if (kb) kb.removeAttribute('hidden');
    if (row) row.closest('.fr-input-row').classList.add('is-typing');
  }
  function hideKeyboard(ctx) {
    var kb = ctx === 'group' ? dom.groupKeyboard : dom.chatKeyboard;
    var row = ctx === 'group' ? dom.groupInput : dom.chatInput;
    if (kb) kb.setAttribute('hidden', '');
    if (row) row.closest('.fr-input-row').classList.remove('is-typing');
  }
  /* 收起所有面板（键盘/表情/附件）：点击消息区/顶栏等非输入区域时调用 */
  function closeAllPanels(ctx) {
    var isGroup = ctx === 'group';
    var kb = isGroup ? dom.groupKeyboard : dom.chatKeyboard;
    var ep = isGroup ? dom.groupEmojiPanel : dom.chatEmojiPanel;
    var ap = isGroup ? dom.groupAttachPanel : dom.chatAttachPanel;
    var input = isGroup ? dom.groupInput : dom.chatInput;
    if (kb) kb.setAttribute('hidden', '');
    if (ep) ep.setAttribute('hidden', '');
    if (ap) ap.setAttribute('hidden', '');
    if (input) { input.blur(); input.closest('.fr-input-row').classList.remove('is-typing'); }
  }
  function bindKeyboard(kb, input, sendBtn) {
    if (!kb || !input) return;
    kb.addEventListener('mousedown', function (e) {
      /* 防止点击键盘导致输入框 blur */
      e.preventDefault();
    });
    kb.addEventListener('click', function (e) {
      var key = e.target.closest('.fr-key');
      if (!key) return;
      var special = key.getAttribute('data-fr-key');
      if (special === 'back') {
        input.value = input.value.slice(0, -1);
      } else if (special === 'space') {
        input.value += ' ';
      } else if (special === 'enter') {
        input.value += '\n';
      } else if (special === 'shift') {
        /* 简单大小写切换 */
        var upper = key.classList.toggle('is-on');
        kb.querySelectorAll('.fr-key').forEach(function (k) {
          if (k.type === 'button' && !k.getAttribute('data-fr-key')) {
            k.textContent = upper ? (k.textContent.toUpperCase()) : (k.textContent.toLowerCase());
          }
        });
      } else {
        input.value += key.textContent;
      }
      onInputScrollHeight(input);
      updateSendState(input, sendBtn);
      input.focus();
    });
  }

  /* —— 表情 / 附件 面板：与键盘等高同位，三者互斥 —— */
  var EMOJIS = ['😀','😁','😂','🤣','😃','😄','😅','😆','😉','😊','😋','😎','😍','😘','🥳','😇','🙂','🙃','😉','😌','🤔','🤨','😐','😑','😶','🙄','😏','😬','😴','🤤','😪','😵','🤯','🤠','🥳','🥺','😭','😢','😡','😠','🤬','😈','💀','👻','🤖','💩','👍','👎','👏','🙏','💪','🤝','✌️','🤞','🤟','👌','🌹','🌸','🌺','🌻','🍀','🔥','✨','💡','📚','✏️','📝','🔬','🧪','🔋','⚡','🎯','🚀','❤️','🧡','💛','💚','💙','💜','🖤','🤍'];
  function renderEmojiPanel(panel, input, sendBtn) {
    if (!panel || panel.dataset.rendered) return;
    var html = '<div class="fr-emoji-grid">';
    EMOJIS.forEach(function (e) { html += '<button class="fr-emoji-item" type="button">' + e + '</button>'; });
    html += '</div>';
    panel.innerHTML = html;
    panel.dataset.rendered = '1';
    panel.addEventListener('mousedown', function (ev) { ev.preventDefault(); });
    panel.addEventListener('click', function (ev) {
      var item = ev.target.closest('.fr-emoji-item');
      if (!item || !input) return;
      input.value += item.textContent;
      onInputScrollHeight(input);
      updateSendState(input, sendBtn);
      /* 不 focus：避免触发 showKeyboard 关闭表情面板 */
    });
  }
  function renderAttachPanel(panel, ctx) {
    if (!panel || panel.dataset.rendered) return;
    var cells = [
      { kind: 'image', label: '图片', svg: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5L5 20"/>' },
      { kind: 'file',  label: '文件', svg: '<path d="M14 3v5h5"/><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>' },
      { kind: 'note',  label: '笔记', svg: '<path d="M6 4h10a1.5 1.5 0 0 1 1.5 1.5v14a1 1 0 0 0-1-1H6z"/><path d="M17.5 5.5H19a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-1.5"/>' },
      { kind: 'debate', label: '讨论', svg: '<path d="M7 4l-3 8 3 8"/><path d="M17 4l3 8-3 8"/>' }
    ];
    var html = '<div class="fr-attach-grid">';
    cells.forEach(function (c) {
      html += '<button class="fr-attach-cell" type="button" data-fr-panel-attach="' + c.kind + '" data-ctx="' + ctx + '">'
        + '<span class="fr-attach-cell__icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + c.svg + '</svg></span>'
        + '<span class="fr-attach-cell__label">' + c.label + '</span>'
        + '</button>';
    });
    html += '</div>';
    panel.innerHTML = html;
    panel.dataset.rendered = '1';
    panel.addEventListener('mousedown', function (ev) { ev.preventDefault(); });
    panel.addEventListener('click', function (ev) {
      var cell = ev.target.closest('[data-fr-panel-attach]');
      if (!cell) return;
      var kind = cell.getAttribute('data-fr-panel-attach');
      var c = cell.getAttribute('data-ctx');
      attachKind(kind, c || '1on1');
      togglePanel('attach', c || '1on1', false);
    });
  }
  /* 面板互斥切换：panel='keyboard'|'emoji'|'attach'，force 强制开关 */
  function togglePanel(panel, ctx, force) {
    var isGroup = ctx === 'group';
    var kb = isGroup ? dom.groupKeyboard : dom.chatKeyboard;
    var ep = isGroup ? dom.groupEmojiPanel : dom.chatEmojiPanel;
    var ap = isGroup ? dom.groupAttachPanel : dom.chatAttachPanel;
    var input = isGroup ? dom.groupInput : dom.chatInput;
    var sendBtn = isGroup ? dom.groupSend : dom.chatSend;
    var all = [kb, ep, ap];
    var target = panel === 'emoji' ? ep : (panel === 'attach' ? ap : kb);
    /* emoji/attach 面板需要内容，首次渲染 */
    if (panel === 'emoji' && ep) renderEmojiPanel(ep, input, sendBtn);
    if (panel === 'attach' && ap) renderAttachPanel(ap, ctx);
    /* 决定显示状态：目标面板当前可见 → 关闭切回键盘；否则显示目标面板 */
    var isVisible = target ? !target.hasAttribute('hidden') : false;
    var willShow = force !== undefined ? force : !isVisible;
    /* 先全部关闭 */
    all.forEach(function (el) { if (el) el.setAttribute('hidden', ''); });
    if (willShow && target) {
      /* 显示目标面板（表情/附件）：确保键盘关闭，textarea blur 避免键盘再弹出 */
      target.removeAttribute('hidden');
      if (panel !== 'keyboard' && input) {
        input.blur();
      }
    } else {
      /* 关闭 → 显示键盘（重新 focus textarea） */
      if (kb) kb.removeAttribute('hidden');
      if (input) input.focus();
    }
  }

  function attachKind(kind, ctx) {
    closeAttachMenu(ctx);
    var tray = ctx === 'group' ? dom.groupAttachTray : dom.chatAttachTray;
    if (!tray) return;
    var label = '';
    var iconHtml = '';
    if (kind === 'note') {
      var n = noteById('n-solid-battery-impedance');
      label = n ? truncate(n.title, 16) : '笔记';
      iconHtml = IC.note();
    } else if (kind === 'debate') {
      label = '发起一场讨论';
      iconHtml = IC.vs();
    } else if (kind === 'image') {
      label = '图片附件';
      iconHtml = IC.image();
    } else if (kind === 'file') {
      label = '文件附件';
      iconHtml = IC.doc();
    }
    var chip = el('span', 'fr-attach-chip', iconHtml + '<span>' + escapeHtml(label) + '</span>'
      + '<button data-action="remove-attach" aria-label="移除">×</button>');
    tray.appendChild(chip);
    tray.classList.add('is-open');
  }

  /* ----------------------------- @提及（群聊） ----------------------------- */

  function openMention(filter) {
    if (!dom.groupMention) return;
    var group = currentGroup();
    if (!group) return;
    var members = group.members.map(userById).filter(Boolean);
    if (filter) {
      var f = filter.toLowerCase();
      members = members.filter(function (u) { return u.name.toLowerCase().indexOf(f) >= 0; });
    }
    var html = '';
    members.forEach(function (u) {
      html += '<div class="fr-mention__item" data-action="pick-mention" data-uid="' + u.id + '">'
        + '<span class="fr-mention__ava" style="background:' + (u.avatarColor || '#6B655C') + '">' + escapeHtml(u.initials || u.name) + '</span>'
        + '<span class="fr-mention__name">' + escapeHtml(u.name) + '</span>'
        + '</div>';
    });
    if (!html) html = '<div class="fr-mention__item"><span class="fr-mention__name" style="color:var(--neutral-500)">未匹配到成员</span></div>';
    dom.groupMention.innerHTML = html;
    dom.groupMention.classList.add('is-open');
    /* Task 9：防止点击 mention 项时 textarea blur 导致面板提前关闭 */
    dom.groupMention.onmousedown = function (ev) { ev.preventDefault(); };
  }
  function closeMention() { if (dom.groupMention) dom.groupMention.classList.remove('is-open'); }

  function currentGroup() {
    for (var i = 0; i < MOCK_GROUPS.length; i++) {
      if (MOCK_GROUPS[i].id === state.groupId) return MOCK_GROUPS[i];
    }
    return null;
  }

  /* ----------------------------- 长按菜单 ----------------------------- */

  var longPressTimer = null;
  var longPressTarget = null;

  function openContextMenu(uid) {
    var u = userById(uid); if (!u) return;
    /* 防御性：部分页面可能缺少 context / scrim 元素，仅 toast 提示 */
    if (!dom.contextMenu || !dom.scrim) {
      toast('更多操作（演示）');
      return;
    }
    /* 头部不再展示权威分；置顶已移至左滑操作，菜单仅保留备注 / 免打扰 / 删除 */
    dom.contextHead.innerHTML = ''
      + avatarHtml(u)
      + '<div><div class="fr-context__name">' + escapeHtml(u.name) + '</div>'
      + '<div class="fr-context__sub">' + escapeHtml(u.domain || '') + '</div></div>';
    dom.contextItems.innerHTML = ''
      + '<button class="fr-context__item" data-action="ctx-remark">' + IC.pencil() + '设置备注名</button>'
      + '<button class="fr-context__item" data-action="ctx-mute">' + IC.forbid() + '消息免打扰</button>'
      + '<button class="fr-context__item fr-context__item--danger" data-action="ctx-delete">' + IC.trash() + '删除好友</button>';
    dom.contextMenu.classList.add('is-open');
    dom.scrim.classList.add('is-open');
  }
  function closeContextMenu() {
    if (dom.contextMenu) dom.contextMenu.classList.remove('is-open');
    if (dom.scrim) dom.scrim.classList.remove('is-open');
  }

  /* ----------------------------- 好友信息 Sheet -----------------------------
   * 访客视角简化版：点击好友头像弹出底部 sheet，显示好友简要信息卡片
   * 不跳转到 profile（那是用户自己的主页），提供「发消息」和「关闭」操作
   * ----------------------------------------------------------------------- */

  /* ----------------------------- 事件绑定 ----------------------------- */

  function onInputScrollHeight(input) {
    input.style.height = 'auto';
    input.style.height = Math.min(96, input.scrollHeight) + 'px';
  }

  function bindGlobal() {
    /* segment（三 tab）：好友 tab 再点已激活时切换列表/分组视图 */
    if (dom.segFriends) dom.segFriends.addEventListener('click', function () {
      if (state.tab === 'friends') { onFriendsSegClick(); }
      else { setTab('friends'); }
    });
    if (dom.segGroups) dom.segGroups.addEventListener('click', function () { setTab('groups'); });
    if (dom.segTeams) dom.segTeams.addEventListener('click', function () { setTab('teams'); });

    /* 右上 + （好友→添加好友 / 群聊·团队→复用添加页） */
    if (dom.btnAdd) {
      dom.btnAdd.addEventListener('click', function () { openAdd(); });
    }

    /* 右上角搜索图标 → 打开全屏「查找好友/群/团队」独立页 */
    if (dom.btnSearch) {
      dom.btnSearch.addEventListener('click', function () { openSearchPage(); });
    }
    if (dom.searchInput) {
      dom.searchInput.addEventListener('input', function () {
        state.search[state.tab] = dom.searchInput.value || '';
        rerenderCurrentTab();
      });
    }
    /* 取消按钮（data-fr-action 不走 onRootClick 委托，单独绑定） */
    var searchCancelBtn = document.querySelector('[data-fr-action="search-cancel"]');
    if (searchCancelBtn) {
      searchCancelBtn.addEventListener('click', closeSearchOverlay);
    }

    /* 添加页内独立搜索（过滤推荐） */
    if (dom.searchAdd) {
      dom.searchAdd.addEventListener('input', function () {
        state.search.add = dom.searchAdd.value || '';
        renderAddList();
      });
    }

    /* 输入框（1对1） */
    if (dom.chatInput) {
      dom.chatInput.addEventListener('input', function () {
        onInputScrollHeight(dom.chatInput);
        updateSendState(dom.chatInput, dom.chatSend);
      });
      dom.chatInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage('1on1');
        }
      });
      /* focus 弹键盘 + 隐藏语音；blur 收键盘 */
      dom.chatInput.addEventListener('focus', function () { showKeyboard('1on1'); });
      dom.chatInput.addEventListener('blur', function () { hideKeyboard('1on1'); });
    }
    if (dom.chatSend) {
      /* mousedown preventDefault：避免键盘打开时第一次点击被"收键盘"吞掉 */
      dom.chatSend.addEventListener('mousedown', function (e) { e.preventDefault(); });
      dom.chatSend.addEventListener('click', function () { sendMessage('1on1'); });
    }
    bindKeyboard(dom.chatKeyboard, dom.chatInput, dom.chatSend);
    /* 点击消息区/顶栏 → 收起所有面板（键盘/表情/附件） */
    [dom.chatMsgs, dom.chatTop].forEach(function (el) {
      if (el) el.addEventListener('mousedown', function () { closeAllPanels('1on1'); });
    });
    /* 表情 / +号：mousedown 阻止 textarea blur（避免键盘先收起干扰），click 切面板 */
    if (dom.chatEmoji) {
      dom.chatEmoji.addEventListener('mousedown', function (e) { e.preventDefault(); });
      dom.chatEmoji.addEventListener('click', function () { togglePanel('emoji', '1on1'); });
    }
    if (dom.chatAttachBtn) {
      dom.chatAttachBtn.addEventListener('mousedown', function (e) { e.preventDefault(); });
      dom.chatAttachBtn.addEventListener('click', function () { togglePanel('attach', '1on1'); });
    }

    /* 输入框（群聊） + @ 检测 */
    if (dom.groupInput) {
      dom.groupInput.addEventListener('input', function () {
        onInputScrollHeight(dom.groupInput);
        updateSendState(dom.groupInput, dom.groupSend);
        detectMention();
      });
      dom.groupInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage('group');
        }
      });
      dom.groupInput.addEventListener('blur', function () {
        setTimeout(closeMention, 150);
        hideKeyboard('group');
      });
      dom.groupInput.addEventListener('focus', function () { showKeyboard('group'); });
    }
    if (dom.groupSend) {
      dom.groupSend.addEventListener('mousedown', function (e) { e.preventDefault(); });
      dom.groupSend.addEventListener('click', function () { sendMessage('group'); });
    }
    bindKeyboard(dom.groupKeyboard, dom.groupInput, dom.groupSend);
    /* 点击消息区/顶栏 → 收起所有面板（键盘/表情/附件） */
    [dom.groupMsgs, dom.groupTop].forEach(function (el) {
      if (el) el.addEventListener('mousedown', function () { closeAllPanels('group'); });
    });
    if (dom.groupEmoji) {
      dom.groupEmoji.addEventListener('mousedown', function (e) { e.preventDefault(); });
      dom.groupEmoji.addEventListener('click', function () { togglePanel('emoji', 'group'); });
    }
    if (dom.groupAttachBtn) {
      dom.groupAttachBtn.addEventListener('mousedown', function (e) { e.preventDefault(); });
      dom.groupAttachBtn.addEventListener('click', function () { togglePanel('attach', 'group'); });
    }

    /* scrim 关闭（防御性：部分页面可能缺少 scrim 元素） */
    if (dom.scrim) dom.scrim.addEventListener('click', closeContextMenu);

    /* 事件委托：根级路由（顶栏按钮、行按钮、AI 按键、附件菜单项 等） */
    dom.root.addEventListener('click', onRootClick);

    /* 长按好友行（绑定在 list view，便于 stopPropagation） */
    bindLongPress(dom.friendsBody);

    /* 初始化禁用发送键 */
    updateSendState(dom.chatInput, dom.chatSend);
    updateSendState(dom.groupInput, dom.groupSend);

    /* 好友管理页绑定（Task 2.4） */
    bindManage();
  }

  function bindLongPress(host) {
    if (!host) return;
    host.addEventListener('touchstart', function (e) {
      var row = e.target.closest('.fr-row'); if (!row) return;
      var uid = row.getAttribute('data-uid');
      if (!uid) return;
      longPressTarget = row;
      longPressTimer = setTimeout(function () {
        if (longPressTarget === row) {
          e.preventDefault();
          openContextMenu(uid);
          if (navigator.vibrate) navigator.vibrate(10);
        }
      }, 550);
    }, { passive: true });
    host.addEventListener('touchend', function () {
      clearTimeout(longPressTimer);
      longPressTarget = null;
    });
    host.addEventListener('touchmove', function () {
      clearTimeout(longPressTimer);
      longPressTarget = null;
    });
    /* 桌面端右键 */
    host.addEventListener('contextmenu', function (e) {
      var row = e.target.closest('.fr-row');
      if (!row) return;
      var uid = row.getAttribute('data-uid'); if (!uid) return;
      e.preventDefault();
      openContextMenu(uid);
    });
  }

  function detectMention() {
    if (!dom.groupInput) return;
    var val = dom.groupInput.value;
    var caret = dom.groupInput.selectionStart || val.length;
    var left = val.slice(0, caret);
    var match = left.match(/@([^\s@]*)$/);
    if (match) {
      openMention(match[1]);
    } else {
      closeMention();
    }
  }

  /* 轻量 toast：friends 模块自带（无独立 toast 元素，动态创建） */
  var frToastEl = null, frToastTimer = null;
  function toast(msg) {
    if (!dom.root) return;
    if (!frToastEl) {
      frToastEl = document.createElement('div');
      frToastEl.className = 'fr-toast';
      dom.root.appendChild(frToastEl);
    }
    frToastEl.textContent = msg;
    frToastEl.classList.add('is-show');
    if (frToastTimer) clearTimeout(frToastTimer);
    frToastTimer = setTimeout(function () { frToastEl.classList.remove('is-show'); }, 2000);
  }

  function onRootClick(e) {
    var btn = e.target.closest('[data-action]');
    if (!btn) return;
    var action = btn.getAttribute('data-action');
    var ctx = btn.getAttribute('data-ctx');

    switch (action) {
      case 'back-list':
        showView('list');
        state.isTeamChat = false;   /* Task 12：返回列表时重置团队聊天标记 */
        closeAttachMenu('1on1'); closeAttachMenu('group'); closeMention();
        break;
      case 'info-back':
        /* 详情页返回：群详情→回群聊；团队详情→回团队聊天；聊天设置→回聊天页 */
        showView(state.infoFrom === 'group' ? 'group' : (state.infoFrom === 'team' ? 'group' : (state.infoFrom === 'chat' ? 'chat' : 'list')));
        break;
      case 'toggle-ai':
        toggleAI(ctx || '1on1');
        break;
      case 'peer-more':
        /* Task 2：好友聊天页三点 → 进入聊天设置新页（查找记录/免打扰/置顶/举报/清空） */
        if (state.peerId) openChatSettings(state.peerId);
        break;
      case 'group-settings': {
        /* Task 8：群设置三点 → 进入群详情页（成员/公告/共享笔记） */
        if (state.groupId && !state.isTeamChat) openInfo('group', state.groupId);
        break;
      }
      case 'team-settings': {
        /* Task 12/13：团队设置三点 → 进入团队详情页（成员/目标/共同作品） */
        if (state.groupId && state.isTeamChat) openInfo('team', state.groupId);
        break;
      }
      case 'open-team-info': {
        /* 团队聊天页点头像 → 进入团队详情 */
        var tiTid = btn.getAttribute('data-tid');
        if (tiTid) openInfo('team', tiTid);
        break;
      }
      /* Task 5：邀请成员 */
      case 'invite-member': {
        var ik = btn.getAttribute('data-kind');
        toast('邀请' + (ik === 'group' ? '群成员' : '团队成员') + '（demo）：可从好友列表或二维码邀请');
        break;
      }
      /* Task 6：修改公告/目标 */
      case 'edit-announce': {
        var ak = btn.getAttribute('data-kind');
        toast((ak === 'group' ? '修改群公告' : '修改团队目标') + '（demo）');
        break;
      }
      /* Task 6：成员管理 */
      case 'manage-members': {
        toast('成员管理（demo）：可设置管理员/转让群主/踢人');
        break;
      }
      /* Task 6：踢人 */
      case 'kick-member': {
        var ku = userById(btn.getAttribute('data-uid'));
        toast('已将「' + (ku ? ku.name : '成员') + '」移出（demo）');
        break;
      }
      /* Task 6：退群 —— 从列表移除 */
      case 'leave-group': {
        var lgId = state.groupId;
        toast('已退出群聊');
        state.groupId = null;
        state.isTeamChat = false;
        /* 从 MOCK_GROUPS 中移除 */
        for (var li = 0; li < MOCK_GROUPS.length; li++) {
          if (MOCK_GROUPS[li].id === lgId) { MOCK_GROUPS.splice(li, 1); break; }
        }
        delete state.pinnedGroups[lgId];
        showView('list');
        renderGroupsList();
        break;
      }
      /* Task 6：退出团队 —— 从列表移除 */
      case 'leave-team': {
        var ltId = state.groupId;
        toast('已退出团队');
        state.groupId = null;
        state.isTeamChat = false;
        /* 从 MOCK_TEAMS 中移除 */
        for (var lti = 0; lti < MOCK_TEAMS.length; lti++) {
          if (MOCK_TEAMS[lti].id === ltId) { MOCK_TEAMS.splice(lti, 1); break; }
        }
        delete state.pinnedTeams[ltId];
        showView('list');
        renderTeamsList();
        break;
      }
      case 'notify':
        toast('通知（演示）：3 条新互动 · 1 个讨论邀请');
        break;
      /* case 'menu' 已由全局 drawer.js 接管（capture 阶段） */
      case 'open-chat':
        openChat(btn.getAttribute('data-uid'));
        break;
      case 'open-guest-profile': {
        /* 聊天页 / 添加好友页 / 详情页成员点头像 → 跳转到对方的个人主页（与自己的主页同款布局）
         * 离开 friends 全屏视图前清掉 is-fr-chat-open，让访客主页的底栏正常显示 */
        var guestUid = btn.getAttribute('data-uid');
        document.body.classList.remove('is-fr-chat-open');
        if (window.ZX_BRIDGE && typeof window.ZX_BRIDGE.switchTab === 'function') {
          window.ZX_BRIDGE.switchTab('profile');
        } else if (window.ZX && typeof window.ZX.switchTab === 'function') {
          window.ZX.switchTab('profile');
        }
        if (window.ZX_PROFILE && typeof window.ZX_PROFILE.viewUser === 'function') {
          /* 传入来源 tab，便于访客主页 ← 返回时切回好友页（聊天界面） */
          window.ZX_PROFILE.viewUser(guestUid, 'friends');
        }
        break;
      }
      case 'open-team': {
        /* Task 12/13：团队列表点击 → 进入团队聊天视角（不是详情页） */
        openTeamChat(btn.getAttribute('data-tid'));
        break;
      }
      case 'open-team-work': {
        /* Task 13：点击共同作品（笔记/工作流/报告） */
        var wType = btn.getAttribute('data-wtype');
        var wLabel = wType === 'workflow' ? '工作流' : (wType === 'report' ? '报告' : '笔记');
        toast('打开团队' + wLabel + '（演示）');
        break;
      }
      case 'add-team-work': {
        /* Task 13：添加共同作品 */
        toast('添加共同作品（演示）：可从笔记 / 工作流 / 报告中选择');
        break;
      }
      case 'open-group-info': {
        /* 群聊页点头像 → 进入群详情（团队聊天用 open-team-info） */
        if (state.isTeamChat) break;
        openInfo('group', btn.getAttribute('data-gid') || (state.groupId || ''));
        break;
      }
      case 'slide-pin': {
        /* 左滑「置顶」（demo 仅 toast），操作完成后收起 */
        var pinUid = btn.getAttribute('data-uid');
        var pinUser = userById(pinUid);
        var pinSlide = btn.closest('.fr-slidable');
        if (pinSlide) pinSlide.classList.remove('is-open');
        toast('已置顶 ' + (pinUser ? pinUser.name : '对话') + '（演示）');
        break;
      }
      case 'slide-pin-group': {
        /* 群聊置顶：切换 pinned 状态并重渲染 */
        var pinGid = btn.getAttribute('data-gid');
        var pinGroup = null;
        for (var gi = 0; gi < MOCK_GROUPS.length; gi++) { if (MOCK_GROUPS[gi].id === pinGid) pinGroup = MOCK_GROUPS[gi]; }
        var pinSlideG = btn.closest('.fr-slidable');
        if (pinSlideG) pinSlideG.classList.remove('is-open');
        if (state.pinnedGroups[pinGid]) {
          delete state.pinnedGroups[pinGid];
          toast('已取消置顶 ' + (pinGroup ? pinGroup.name : '群聊'));
        } else {
          state.pinnedGroups[pinGid] = true;
          toast('已置顶 ' + (pinGroup ? pinGroup.name : '群聊'));
        }
        renderGroupsList();
        break;
      }
      case 'slide-pin-team': {
        /* 团队置顶：切换 pinned 状态并重渲染 */
        var pinTid = btn.getAttribute('data-tid');
        var pinTeam = null;
        for (var ti = 0; ti < MOCK_TEAMS.length; ti++) { if (MOCK_TEAMS[ti].id === pinTid) pinTeam = MOCK_TEAMS[ti]; }
        var pinSlideT = btn.closest('.fr-slidable');
        if (pinSlideT) pinSlideT.classList.remove('is-open');
        if (state.pinnedTeams[pinTid]) {
          delete state.pinnedTeams[pinTid];
          toast('已取消置顶 ' + (pinTeam ? pinTeam.name : '团队'));
        } else {
          state.pinnedTeams[pinTid] = true;
          toast('已置顶 ' + (pinTeam ? pinTeam.name : '团队'));
        }
        renderTeamsList();
        break;
      }
      case 'slide-delete': {
        /* 已移除左滑删除入口，保留 case 兜底 */
        var delUid = btn.getAttribute('data-uid');
        var delUser = userById(delUid);
        toast('已删除 ' + (delUser ? delUser.name : '好友') + '（演示）');
        break;
      }
      case 'toggle-slide': {
        /* 点击右侧 chevron 展开/收起操作（替代 hover） */
        e.stopPropagation();
        var slide = btn.closest('.fr-slidable');
        if (!slide) break;
        var willOpen = !slide.classList.contains('is-open');
        /* 先收起其他已展开的行 */
        $all('.fr-slidable.is-open').forEach(function (s) { s.classList.remove('is-open'); });
        if (willOpen) slide.classList.add('is-open');
        break;
      }
      case 'open-group':
        openGroup(btn.getAttribute('data-gid'));
        break;
      case 'follow': {
        e.stopPropagation();
        e.preventDefault();
        btn.classList.toggle('is-following');
        btn.innerHTML = btn.classList.contains('is-following') ? IC.spark() + '已关注' : IC.plus() + '关注';
        break;
      }
      case 'open-note': {
        /* 笔记卡：若 noteId 可识别，打开笔记编辑器；否则闪烁提示 */
        var nid = btn.getAttribute('data-note-id');
        if (nid && window.ZX_EDITOR && window.ZX_EDITOR.open) {
          /* 切回工作区 tab，再打开编辑器 */
          var nbTab = document.querySelector('[data-tab="notebook"]');
          if (nbTab) nbTab.click();
          setTimeout(function () {
            window.ZX_EDITOR.open({ noteId: nid });
          }, 150);
        } else {
          flashNoteCard(btn);
        }
        break;
      }
      case 'join-debate':
        flashDebateCard(btn);
        break;
      /* toggle-attach / toggle-emoji 由按钮独立监听处理，
         不走 root 委托（避免双重触发导致面板开关互相抵消） */
      case 'toggle-voice':
        toggleVoiceMode(ctx || '1on1');
        break;
      case 'attach-note':
        attachKind('note', ctx || '1on1');
        break;
      case 'attach-debate':
        attachKind('debate', ctx || '1on1');
        break;
      case 'attach-image':
        attachKind('image', ctx || '1on1');
        break;
      case 'attach-summary':
        closeAttachMenu(ctx || '1on1');
        openSummaryPicker(ctx || '1on1');
        break;
      /* 总结功能：选取界面 → 配置界面 → 执行 */
      case 'sum-cancel':
        closeSummaryPicker();
        break;
      case 'sum-next':
        openSummaryConfig(btn.getAttribute('data-ctx') || '1on1');
        break;
      case 'sum-cfg-back':
        closeSummaryConfig();
        openSummaryPicker(btn.getAttribute('data-ctx') || '1on1');
        break;
      case 'sum-execute':
        executeSummary(btn.getAttribute('data-ctx') || '1on1');
        break;
      case 'remove-attach': {
        var chip = btn.closest('.fr-attach-chip');
        if (chip && chip.parentNode) chip.parentNode.removeChild(chip);
        break;
      }
      case 'add-shared-note':
        flashSharedAdd(btn);
        break;
      /* Task 4：添加页三段切换 */
      case 'switch-add-tab': {
        var tab = btn.getAttribute('data-fr-add-tab');
        if (tab && tab !== state.addTab) {
          state.addTab = tab;
          state.search.add = '';
          state.search.addGroup = '';
          renderAddList();
        }
        break;
      }
      /* Task 4：加入群聊 —— 弹出申请确认框，确认后转变为已申请 */
      case 'join-group': {
        var jgId = btn.getAttribute('data-gid');
        if (state.appliedGroups[jgId]) { toast('已申请，请等待管理员通过'); break; }
        var jg = null;
        for (var ji = 0; ji < MOCK_GROUPS.length; ji++) { if (MOCK_GROUPS[ji].id === jgId) { jg = MOCK_GROUPS[ji]; break; } }
        if (jg) {
          openJoinConfirm(jg);
        }
        break;
      }
      /* Task 4：组建团队 —— 邀请成员切换 */
      case 'toggle-invite': {
        btn.classList.toggle('is-selected');
        break;
      }
      /* Task 4：组建团队 —— 创建 */
      case 'create-team': {
        var nameInput = dom.addBody ? dom.addBody.querySelector('[data-fr-team-name]') : null;
        var descInput = dom.addBody ? dom.addBody.querySelector('[data-fr-team-desc]') : null;
        var tName = nameInput ? nameInput.value.trim() : '';
        if (!tName) { toast('请填写团队名称'); return; }
        var tDesc = descInput ? descInput.value.trim() : '';
        /* 真正创建团队并添加到列表 */
        var newTid = 't-' + Date.now();
        var invited = dom.addBody ? dom.addBody.querySelectorAll('[data-invite-uid].is-selected') : [];
        var newMemberIds = [ME_ID];
        for (var ii = 0; ii < invited.length; ii++) {
          var iu = invited[ii].getAttribute('data-invite-uid');
          if (iu && newMemberIds.indexOf(iu) < 0) newMemberIds.push(iu);
        }
        MOCK_TEAMS.push({
          id: newTid,
          name: tName,
          avatarColor: '#1D5B7A',
          avatarText: tName.charAt(0),
          members: newMemberIds.length,
          role: '群主',
          desc: tDesc || '新创建的团队',
          memberIds: newMemberIds,
          owner: ME_ID,
          admins: [],
          unread: 0
        });
        toast('团队「' + tName + '」已创建');
        state.addTab = 'friend';
        showView('list');
        /* 切换到团队 tab 并刷新 */
        setTab('teams');
        break;
      }
      case 'join-cancel': closeJoinConfirm(); break;
      case 'join-confirm': confirmJoinGroup(actEl.getAttribute('data-gid')); break;
      case 'pick-mention': {
        var uid = btn.getAttribute('data-uid');
        var u = userById(uid);
        if (u && dom.groupInput) {
          var v = dom.groupInput.value;
          var c = dom.groupInput.selectionStart || v.length;
          var left = v.slice(0, c).replace(/@([^\s@]*)$/, '@' + u.name + ' ');
          var right = v.slice(c);
          dom.groupInput.value = left + right;
          updateSendState(dom.groupInput, dom.groupSend);
          dom.groupInput.focus();
          var pos = left.length;
          try { dom.groupInput.setSelectionRange(pos, pos); } catch (_) {}
        }
        closeMention();
        break;
      }
      case 'ctx-remark':
      case 'ctx-mute':
      case 'ctx-delete':
      case 'close-context':
        closeContextMenu();
        break;
      /* Task 2：聊天设置页 action 处理 */
      case 'cs-toggle-mute':
      case 'cs-toggle-pin': {
        var csUid = btn.getAttribute('data-uid');
        if (!state.chatSettings) state.chatSettings = {};
        if (!state.chatSettings[csUid]) state.chatSettings[csUid] = { mute: false, pin: false };
        if (action === 'cs-toggle-mute') {
          state.chatSettings[csUid].mute = !state.chatSettings[csUid].mute;
          toast(state.chatSettings[csUid].mute ? '已开启消息免打扰' : '已关闭消息免打扰');
        } else {
          state.chatSettings[csUid].pin = !state.chatSettings[csUid].pin;
          toast(state.chatSettings[csUid].pin ? '已置顶聊天' : '已取消置顶');
        }
        /* 重新渲染设置页以更新 toggle 状态 */
        if (state.peerId) openChatSettings(state.peerId);
        break;
      }
      case 'cs-search':
        toast('查找聊天记录（demo）');
        break;
      case 'cs-bg':
        toast('设置聊天背景（demo）');
        break;
      case 'cs-shared':
        toast('查看共享笔记（demo）');
        break;
      case 'cs-debates':
        toast('查看共同讨论（demo）');
        break;
      case 'cs-report':
        toast('已提交举报，平台将审核（demo）');
        break;
      case 'cs-clear':
        if (state.peerId) {
          MOCK_CHATS[state.peerId] = [];
          toast('已清空聊天记录');
          /* 返回聊天页并刷新消息流 */
          showView('chat');
          renderChatMessages([], false);
        }
        break;
      case 'cs-delete':
        if (state.peerId) {
          var delPeer = userById(state.peerId);
          toast('已删除好友 ' + (delPeer ? delPeer.name : '') + '（demo）');
          state.peerId = null;
          showView('list');
          renderFriendsList();
        }
        break;
      default:
        break;
    }
  }

  function flashNoteCard(node) {
    node.style.transition = 'transform 160ms';
    node.style.transform = 'scale(0.97)';
    setTimeout(function () { node.style.transform = ''; }, 160);
  }
  function flashDebateCard(node) {
    var card = node.closest('.fr-debatecard') || node;
    card.style.transition = 'transform 160ms';
    card.style.transform = 'scale(0.97)';
    setTimeout(function () { card.style.transform = ''; }, 160);
  }
  function flashSharedAdd(node) {
    node.style.transition = 'transform 160ms';
    node.style.transform = 'rotate(90deg)';
    setTimeout(function () { node.style.transform = ''; }, 200);
  }

  /* ----------------------------- 添加好友子页 ----------------------------- */

  /* —— 好友管理页（Task 2.4）：齿轮按钮进入，展示分组/屏蔽/静音入口 —— */
  function openManage() {
    showView('manage');
    renderManage();
  }
  function renderManage() {
    var body = document.querySelector('[data-fr-manage-body]');
    if (!body) return;
    var html = '<div class="fr-manage-group"><p class="fr-manage-group__label">好友分组</p>';
    state.groups.forEach(function (g) {
      html += '<div class="fr-manage-row" data-mg-act="edit-group" data-gid="' + g.id + '">'
        + '<span class="fr-manage-row__name">' + escapeHtml(g.name) + '</span>'
        + '<span class="fr-manage-row__hint">' + (g.memberIds || []).length + ' 人 ›</span></div>';
    });
    html += '<div class="fr-manage-row" data-mg-act="new-group"><span class="fr-manage-row__name">+ 新建分组</span></div></div>';
    html += '<div class="fr-manage-group"><p class="fr-manage-group__label">屏蔽与静音</p>';
    html += '<div class="fr-manage-row" data-mg-act="blocked"><span class="fr-manage-row__name">屏蔽名单</span><span class="fr-manage-row__hint">' + state.blocked.length + ' 人 ›</span></div>';
    html += '<div class="fr-manage-row" data-mg-act="muted"><span class="fr-manage-row__name">不看他</span><span class="fr-manage-row__hint">' + state.muted.length + ' 人 ›</span></div></div>';
    body.innerHTML = html;
  }
  function bindManage() {
    var gear = document.querySelector('[data-fr-friends-gear]');
    if (gear) gear.onclick = openManage;
    var back = document.querySelector('[data-fr-manage-back]');
    if (back) back.onclick = function () { showView('list'); applyFriendsView(); };
    var body = document.querySelector('[data-fr-manage-body]');
    if (body) body.addEventListener('click', function (e) {
      var row = e.target.closest('[data-mg-act]');
      if (!row) return;
      var act = row.getAttribute('data-mg-act');
      toast(act + '（demo）');
    });
  }

  function openAdd() {
    state.search.add = '';
    state.search.addGroup = '';   /* Task 4：重置群聊搜索词，避免残留 */
    if (dom.searchAdd) dom.searchAdd.value = '';
    /* 顶栏返回 + 标题 */
    renderAddList();
    showView('add');
  }

  /* ----------------------------- 加入群聊申请框 ----------------------------- */
  function openJoinConfirm(g) {
    closeJoinConfirm();
    var scrim = document.createElement('div');
    scrim.className = 'fr-join-scrim';
    scrim.setAttribute('data-join-scrim', '');
    scrim.onclick = closeJoinConfirm;
    var panel = document.createElement('div');
    panel.className = 'fr-join-sheet';
    panel.innerHTML =
      '<div class="fr-join__handle"></div>' +
      '<div class="fr-join__head">' +
        '<span class="fr-join__avatar" style="background:' + g.avatarColor + '">' + escapeHtml(g.avatarText) + '</span>' +
        '<div class="fr-join__info">' +
          '<span class="fr-join__name">' + escapeHtml(g.name) + '</span>' +
          '<span class="fr-join__type">' + escapeHtml(g.typeLabel) + ' · ' + g.members.length + ' 人</span>' +
        '</div>' +
      '</div>' +
      '<div class="fr-join__field">' +
        '<label class="fr-join__label">申请理由（选填）</label>' +
        '<textarea class="fr-join__textarea" data-join-reason rows="3" placeholder="简单介绍一下自己，让管理员更快通过" maxlength="80"></textarea>' +
      '</div>' +
      '<div class="fr-join__actions">' +
        '<button class="fr-join__btn fr-join__btn--cancel" data-action="join-cancel">取消</button>' +
        '<button class="fr-join__btn fr-join__btn--confirm" data-action="join-confirm" data-gid="' + g.id + '">确认申请</button>' +
      '</div>';
    var phone = document.querySelector('.zx-phone') || document.body;
    phone.appendChild(scrim);
    phone.appendChild(panel);
    /* panel 挂在 .zx-phone 下，不在 .fr-root 内，事件委托捕获不到 —— 直接绑定 */
    var cancelBtn = panel.querySelector('[data-action="join-cancel"]');
    var confirmBtn = panel.querySelector('[data-action="join-confirm"]');
    if (cancelBtn) cancelBtn.addEventListener('click', closeJoinConfirm);
    if (confirmBtn) confirmBtn.addEventListener('click', function () { confirmJoinGroup(g.id); });
  }
  function closeJoinConfirm() {
    var s = document.querySelector('[data-join-scrim]');
    if (s) s.parentNode.removeChild(s);
    var p = document.querySelector('.fr-join-sheet');
    if (p) p.parentNode.removeChild(p);
  }
  function confirmJoinGroup(gid) {
    var g = null;
    for (var i = 0; i < MOCK_GROUPS.length; i++) { if (MOCK_GROUPS[i].id === gid) { g = MOCK_GROUPS[i]; break; } }
    if (!g) { closeJoinConfirm(); return; }
    state.appliedGroups[gid] = true;
    closeJoinConfirm();
    toast('已申请加入「' + g.name + '」，等待管理员通过');
    /* 如果当前在添加页群聊 tab，刷新按钮状态 */
    if (state.view === 'add' && state.addTab === 'group') {
      renderAddGroup();
    }
  }

  /* ----------------------------- AI 总结功能 -----------------------------
   * 流程：附件菜单「总结」→ 选取界面（选消息）→ 配置界面（格式/模型/参数）→ AI 总结并形成笔记
   * 设计理念：将对话中的碎片知识沉淀为结构化笔记，发挥 AI 的 agentic 能力 */
  function getCurrentMsgs(ctx) {
    if (ctx === 'group') {
      if (state.isTeamChat) return MOCK_TEAM_CHATS[state.groupId] || [];
      return MOCK_GROUP_CHATS[state.groupId] || [];
    }
    return MOCK_CHATS[state.peerId] || [];
  }

  /* 第一步：选取界面 —— 列出聊天记录，用户勾选要总结的消息 */
  function openSummaryPicker(ctx) {
    closeSummaryPicker();
    var msgs = getCurrentMsgs(ctx).filter(function (m) {
      return m.text && m.role !== 'sys' && m.role !== 'system' && !m.date;
    });
    if (msgs.length === 0) {
      toast('没有可总结的对话内容');
      return;
    }
    var listHtml = msgs.map(function (m, i) {
      var author = m.authorId ? userById(m.authorId) : null;
      var name = m.role === 'me' ? '我' : (m.role === 'ai' ? 'AI' : (author ? author.name : '对方'));
      return '<label class="fr-sum-pick__item">'
        + '<input type="checkbox" data-sum-idx="' + i + '" checked>'
        + '<span class="fr-sum-pick__name">' + escapeHtml(name) + '</span>'
        + '<span class="fr-sum-pick__text">' + escapeHtml(m.text.slice(0, 80) + (m.text.length > 80 ? '…' : '')) + '</span>'
        + '</label>';
    }).join('');
    var scrim = document.createElement('div');
    scrim.className = 'fr-sum-scrim';
    scrim.setAttribute('data-sum-scrim', '');
    var panel = document.createElement('div');
    panel.className = 'fr-sum-sheet';
    panel.innerHTML =
      '<div class="fr-sum__handle"></div>'
      + '<div class="fr-sum__head">'
        + '<button class="fr-sum__back" data-action="sum-cancel" aria-label="取消">' + IC.back(18) + '</button>'
        + '<h3 class="fr-sum__title">选取总结内容</h3>'
        + '<span class="fr-sum__count" data-sum-count>' + msgs.length + ' 条</span>'
      + '</div>'
      + '<div class="fr-sum-pick__list">' + listHtml + '</div>'
      + '<button class="fr-sum__next" data-action="sum-next" data-ctx="' + ctx + '">下一步：配置总结</button>';
    var phone = document.querySelector('.zx-phone') || document.body;
    phone.appendChild(scrim);
    phone.appendChild(panel);
    /* 更新选中计数 */
    var updateCount = function () {
      var checked = panel.querySelectorAll('input[type=checkbox]:checked').length;
      var countEl = panel.querySelector('[data-sum-count]');
      if (countEl) countEl.textContent = checked + ' 条';
      var nextBtn = panel.querySelector('[data-action="sum-next"]');
      if (nextBtn) nextBtn.disabled = (checked === 0);
    };
    panel.addEventListener('change', function (e) {
      if (e.target.type === 'checkbox') updateCount();
    });
  }
  function closeSummaryPicker() {
    var s = document.querySelector('[data-sum-scrim]');
    if (s) s.parentNode.removeChild(s);
    var p = document.querySelector('.fr-sum-sheet');
    if (p) p.parentNode.removeChild(p);
  }

  /* 第二步：配置界面 —— 选择笔记格式 / 总结模型 / 参数 */
  function openSummaryConfig(ctx) {
    var picker = document.querySelector('.fr-sum-sheet');
    if (!picker) return;
    var checked = picker.querySelectorAll('input[type=checkbox]:checked');
    if (checked.length === 0) { toast('请至少选择一条消息'); return; }
    var msgs = getCurrentMsgs(ctx);
    var selectedTexts = [];
    for (var i = 0; i < checked.length; i++) {
      var idx = parseInt(checked[i].getAttribute('data-sum-idx'), 10);
      if (msgs[idx] && msgs[idx].text) selectedTexts.push(msgs[idx].text);
    }
    closeSummaryPicker();
    openSummaryConfigPanel(selectedTexts, ctx);
  }
  function openSummaryConfigPanel(selectedTexts, ctx) {
    closeSummaryConfig();
    var previewText = selectedTexts.slice(0, 3).map(function (t) {
      return t.slice(0, 60) + (t.length > 60 ? '…' : '');
    }).join('\n');
    var formats = [
      { key: 'outline', label: '大纲笔记', desc: '层级结构' },
      { key: 'mindmap', label: '思维导图', desc: '节点辐射' },
      { key: 'qa', label: '问答卡片', desc: 'Q&A 形式' },
      { key: 'summary', label: '摘要总结', desc: '精炼概述' }
    ];
    var models = [
      { key: 'fast', label: '林·快速', desc: '秒级响应' },
      { key: 'deep', label: '林·深度', desc: '深度推理' },
      { key: 'academic', label: '林·学术', desc: '学术规范' }
    ];
    var lengths = ['精简', '适中', '详细'];
    var styles = ['客观', '口语化', '学术'];

    var formatHtml = formats.map(function (f, i) {
      return '<button class="fr-sum-cfg__opt' + (i === 0 ? ' is-active' : '') + '" data-sum-dim="format" data-pick="' + f.key + '">'
        + '<span class="fr-sum-cfg__opt-label">' + f.label + '</span>'
        + '<span class="fr-sum-cfg__opt-desc">' + f.desc + '</span>'
        + '</button>';
    }).join('');
    var modelHtml = models.map(function (m, i) {
      return '<button class="fr-sum-cfg__opt' + (i === 0 ? ' is-active' : '') + '" data-sum-dim="model" data-pick="' + m.key + '">'
        + '<span class="fr-sum-cfg__opt-label">' + m.label + '</span>'
        + '<span class="fr-sum-cfg__opt-desc">' + m.desc + '</span>'
        + '</button>';
    }).join('');
    var lengthHtml = lengths.map(function (l, i) {
      return '<button class="fr-sum-cfg__chip' + (i === 1 ? ' is-active' : '') + '" data-sum-dim="length" data-pick="' + l + '">' + l + '</button>';
    }).join('');
    var styleHtml = styles.map(function (s, i) {
      return '<button class="fr-sum-cfg__chip' + (i === 0 ? ' is-active' : '') + '" data-sum-dim="style" data-pick="' + s + '">' + s + '</button>';
    }).join('');

    var scrim = document.createElement('div');
    scrim.className = 'fr-sum-scrim';
    scrim.setAttribute('data-sum-cfg-scrim', '');
    var panel = document.createElement('div');
    panel.className = 'fr-sum-sheet fr-sum-sheet--cfg';
    panel.innerHTML =
      '<div class="fr-sum__handle"></div>'
      + '<div class="fr-sum__head">'
        + '<button class="fr-sum__back" data-action="sum-cfg-back" aria-label="返回">' + IC.back(18) + '</button>'
        + '<h3 class="fr-sum__title">总结配置</h3>'
      + '</div>'
      + '<div class="fr-sum-cfg__body">'
        + '<div class="fr-sum-cfg__preview">'
          + '<p class="fr-sum-cfg__preview-label">已选 ' + selectedTexts.length + ' 条内容</p>'
          + '<div class="fr-sum-cfg__preview-text">' + escapeHtml(previewText) + (selectedTexts.length > 3 ? '\n…' : '') + '</div>'
        + '</div>'
        + '<div class="fr-sum-cfg__section">'
          + '<p class="fr-sum-cfg__section-label">笔记格式</p>'
          + '<div class="fr-sum-cfg__grid">' + formatHtml + '</div>'
        + '</div>'
        + '<div class="fr-sum-cfg__section">'
          + '<p class="fr-sum-cfg__section-label">总结模型</p>'
          + '<div class="fr-sum-cfg__grid">' + modelHtml + '</div>'
        + '</div>'
        + '<div class="fr-sum-cfg__section">'
          + '<p class="fr-sum-cfg__section-label">篇幅</p>'
          + '<div class="fr-sum-cfg__chips">' + lengthHtml + '</div>'
        + '</div>'
        + '<div class="fr-sum-cfg__section">'
          + '<p class="fr-sum-cfg__section-label">风格</p>'
          + '<div class="fr-sum-cfg__chips">' + styleHtml + '</div>'
        + '</div>'
      + '</div>'
      + '<button class="fr-sum__next" data-action="sum-execute" data-ctx="' + ctx + '">让林总结并形成笔记</button>';
    var phone = document.querySelector('.zx-phone') || document.body;
    phone.appendChild(scrim);
    phone.appendChild(panel);
    /* 选项切换 */
    panel.addEventListener('click', function (e) {
      var opt = e.target.closest('[data-sum-dim]');
      if (!opt) return;
      var dim = opt.getAttribute('data-sum-dim');
      var siblings = panel.querySelectorAll('[data-sum-dim="' + dim + '"]');
      siblings.forEach(function (s) { s.classList.remove('is-active'); });
      opt.classList.add('is-active');
    });
    /* 存储选中文本供执行时使用 */
    panel.setAttribute('data-selected-texts', JSON.stringify(selectedTexts));
  }
  function closeSummaryConfig() {
    var s = document.querySelector('[data-sum-cfg-scrim]');
    if (s) s.parentNode.removeChild(s);
    var p = document.querySelector('.fr-sum-sheet--cfg');
    if (p) p.parentNode.removeChild(p);
  }

  /* 第三步：执行总结 —— AI 总结并形成笔记 */
  function executeSummary(ctx) {
    var panel = document.querySelector('.fr-sum-sheet--cfg');
    if (!panel) return;
    var selectedTexts = [];
    try { selectedTexts = JSON.parse(panel.getAttribute('data-selected-texts') || '[]'); } catch (e) {}
    var format = 'outline', model = 'fast', length = '适中', style = '客观';
    var fmtEl = panel.querySelector('[data-sum-dim="format"].is-active');
    if (fmtEl) format = fmtEl.getAttribute('data-pick');
    var mdlEl = panel.querySelector('[data-sum-dim="model"].is-active');
    if (mdlEl) model = mdlEl.getAttribute('data-pick');
    var lenEl = panel.querySelector('[data-sum-dim="length"].is-active');
    if (lenEl) length = lenEl.getAttribute('data-pick');
    var styEl = panel.querySelector('[data-sum-dim="style"].is-active');
    if (styEl) style = styEl.getAttribute('data-pick');

    closeSummaryConfig();
    /* 显示 AI 正在总结的动画 */
    showSummaryLoading();
    /* 模拟 AI 总结过程 */
    setTimeout(function () {
      closeSummaryLoading();
      var formatLabel = { outline: '大纲笔记', mindmap: '思维导图', qa: '问答卡片', summary: '摘要总结' }[format] || '笔记';
      var modelLabel = { fast: '林·快速', deep: '林·深度', academic: '林·学术' }[model] || '林';
      toast(modelLabel + ' 已生成' + formatLabel + '（' + length + '·' + style + '），已保存到工作区');
    }, 2000);
  }
  function showSummaryLoading() {
    var scrim = document.createElement('div');
    scrim.className = 'fr-sum-scrim';
    scrim.setAttribute('data-sum-load-scrim', '');
    var panel = document.createElement('div');
    panel.className = 'fr-sum-loading';
    panel.innerHTML =
      '<div class="fr-sum-loading__icon">' + IC.spark(32) + '</div>'
      + '<p class="fr-sum-loading__text">林正在总结对话内容…</p>'
      + '<div class="fr-sum-loading__bar"><span></span></div>';
    var phone = document.querySelector('.zx-phone') || document.body;
    phone.appendChild(scrim);
    phone.appendChild(panel);
  }
  function closeSummaryLoading() {
    var s = document.querySelector('[data-sum-load-scrim]');
    if (s) s.parentNode.removeChild(s);
    var p = document.querySelector('.fr-sum-loading');
    if (p) p.parentNode.removeChild(p);
  }

  /* ----------------------------- 最近点击置顶辅助 ----------------------------- */
  function bumpRecent(arr, id) {
    var idx = arr.indexOf(id);
    if (idx >= 0) arr.splice(idx, 1);
    arr.unshift(id);
    if (arr.length > 20) arr.length = 20;
  }
  function recentRank(arr, id) {
    var i = arr.indexOf(id);
    return i < 0 ? 999 : i;
  }

  /* ----------------------------- 初始化 ----------------------------- */

  function buildAttachMenu(items, ctx) {
    return items.map(function (it) {
      return '<button class="fr-attach-menu__item ' + it.cls + '" data-action="' + it.action + '" data-ctx="' + ctx + '">'
        + it.icon + '<span>' + it.label + '</span></button>';
    }).join('');
  }

  function init() {
    cacheDom();
    if (!dom.root) return;

    /* 用户名称覆盖（当前为空，保留以备后续独立 AI 角色使用） */
    patchAIUserNames();

    /* 给输入栏预先填充附件菜单 DOM（供 1对1 / 群聊共用） */
    if (dom.chatAttachMenu && !dom.chatAttachMenu.hasChildNodes()) {
      dom.chatAttachMenu.innerHTML = buildAttachMenu([
        { cls: 'fr-attach-menu__item--note',    action: 'attach-note',    icon: IC.note(),    label: '分享笔记' },
        { cls: 'fr-attach-menu__item--debate',  action: 'attach-debate',  icon: IC.vs(),     label: '发起讨论' },
        { cls: 'fr-attach-menu__item--image',   action: 'attach-image',   icon: IC.image(),  label: '发送图片' },
        { cls: 'fr-attach-menu__item--summary', action: 'attach-summary', icon: IC.spark(),  label: '总结' }
      ], '1on1');
    }
    if (dom.groupAttachMenu && !dom.groupAttachMenu.hasChildNodes()) {
      dom.groupAttachMenu.innerHTML = buildAttachMenu([
        { cls: 'fr-attach-menu__item--note',    action: 'attach-note',    icon: IC.note(),    label: '分享笔记' },
        { cls: 'fr-attach-menu__item--debate',  action: 'attach-debate',  icon: IC.vs(),     label: '发起讨论' },
        { cls: 'fr-attach-menu__item--image',   action: 'attach-image',   icon: IC.image(),  label: '发送图片' },
        { cls: 'fr-attach-menu__item--summary', action: 'attach-summary', icon: IC.spark(),  label: '总结' }
      ], 'group');
    }

    /* segment 默认好友；三 tab（好友 / 群聊 / 团队） */
    setTab('friends');
    renderFriendsList();
    renderGroupsList();
    renderTeamsList();
    renderAddList();
    showView('list');

    bindGlobal();
  }

  /* ----------------------------- 暴露 ----------------------------- */

  window.ZX_FRIENDS = {
    init: init,
    state: state,
    openChat: openChat,
    openGroup: openGroup,
    openTeamChat: openTeamChat,
    openInfo: openInfo,
    openAdd: openAdd,
    showList: function () { showView('list'); },
    /* 分享笔记到好友聊天：切到好友 tab → 打开 peer 聊天 → 追加笔记卡片消息 */
    shareNoteToPeer: function (peerId, noteTitle, noteId) {
      /* 切到好友 tab */
      var tab = document.querySelector('[data-tab="friends"]');
      if (tab) tab.click();
      /* 等 tab 切换 + chat DOM 就绪后打开聊天 */
      setTimeout(function () {
        if (!MOCK_CHATS[peerId]) MOCK_CHATS[peerId] = [];
        /* 追加笔记分享消息（me 角色，kind=note） */
        var msg = { role: 'me', kind: 'note', noteId: noteId || ('share-' + Date.now()), noteTitle: noteTitle, time: nowHHMM() };
        /* 如果 noteId 不在 mock.notes 里，临时注入一个 placeholder 让 noteById 能找到 */
        if (noteId && !noteById(noteId)) {
          var m = mock();
          if (m && m.notes) {
            m.notes.push({ id: noteId, title: noteTitle || '无标题笔记', summary: '从笔记编辑器分享', tags: [] });
          }
        }
        MOCK_CHATS[peerId].push(msg);
        openChat(peerId);
        /* openChat 用 slice() 渲染，已经包含新追加的消息 */
      }, 200);
    }
  };

  /* 闭环：切回好友页时刷新伙伴列表（让新关注的作者出现） */
  window.addEventListener('zx-tab-active', function (e) {
    if (e.detail && e.detail.tab === 'friends') {
      try { renderFriendsList(); } catch (x) {}
      /* 回到好友页时按当前 view 重新同步全屏态：
       * 从访客主页 ← 返回时，若此前在 chat/group/info/add 视图，需恢复 is-fr-chat-open */
      try { showView(state.view || 'list'); } catch (x2) {}
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
