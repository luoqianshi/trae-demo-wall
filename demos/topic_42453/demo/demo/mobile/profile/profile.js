/* =========================================================================
 * 「知行」App 本体 Demo —— Phase 5 / 个人页逻辑（profile.js）
 * -------------------------------------------------------------------------
 * 设计哲学：
 *   个人页聚焦于"人"本身，不搬运笔记本的内容。
 *   不用"创作者"叙事定义用户，不用成就系统定义用户。
 *   权威分是内部算法的总分，不暴露三向构成（本质是社交数据的重复）。
 *   团队只展示公开团队作为入口，完整团队界面归好友页。
 *
 * 职责：
 *   1. Hero 区：头像 + 用户名 + 等级 + 用户自填格言（空占位引导）+ 权威分总分 + 社交
 *   2. 公开团队区：只展示公开团队卡片，点击跳好友页团队详情
 *   3. 工作流模板横向滚动 → 点击触发（toast）
 *   4. 设置子页（右入）：账号 / 通知 / 隐私 / AI 偏好 / 主题 / 扫码 / 切换账号 / 关于 / 退出
 * 依赖：../../demo/shared/icons.js（ZX.icon）、../../demo/shared/mock-data.js（ZX_MOCK）
 * 约束：原生 JS + 事件委托，无框架，无 alert/prompt/confirm
 * 挂载：window.ZX_PROFILE
 * =======================================================================*/

(function () {
  'use strict';

  /* ----------------------------- 工具 ----------------------------- */

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }

  function svg(inner, size) {
    size = size || 22;
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + inner + '</svg>';
  }
  function zicon(name, size) { return (window.ZX && typeof window.ZX.icon === 'function') ? window.ZX.icon(name, size || 22) : svg('', size); }

  /* 自定义图标 + 别名快捷方式 */
  var IC = {
    chev: function (s) { return svg('<path d="M9 6l6 6-6 6"/>', s); },
    chevDown: function (s) { return svg('<path d="M6 9l6 6 6-6"/>', s); },
    bell: function (s) { return svg('<path d="M6 8a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6"/><path d="M10 19a2 2 0 0 0 4 0"/>', s); },
    lock: function (s) { return svg('<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>', s); },
    shield: function (s) { return svg('<path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z"/>', s); },
    bot: function (s) { return svg('<rect x="4" y="8" width="16" height="11" rx="3"/><path d="M12 8V5"/><circle cx="9" cy="13" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="13" r="1" fill="currentColor" stroke="none"/>', s); },
    palette: function (s) { return svg('<path d="M12 3a9 9 0 0 0 0 18c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.2 0-1 .9-1.8 2-1.8h2.5A4.5 4.5 0 0 0 21 9c0-3.3-4-6-9-6z"/><circle cx="8" cy="11" r="1.1" fill="currentColor" stroke="none"/><circle cx="12" cy="8" r="1.1" fill="currentColor" stroke="none"/><circle cx="16" cy="11" r="1.1" fill="currentColor" stroke="none"/>', s); },
    sun: function (s) { return svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19"/>', s); },
    moon: function (s) { return svg('<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>', s); },
    image: function (s) { return svg('<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/>', s); },
    info: function (s) { return svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8h.01"/>', s); },
    logout: function (s) { return svg('<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/><path d="M10 12H4"/><path d="M4 12l3.5-3.5M4 12l3.5 3.5"/>', s); },
    user: function (s) { return svg('<circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-3.6 3-6 7-6s7 2.4 7 6"/>', s); },
    pencil: function (s) { return svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>', s); },
    scan: function (s) { return svg('<path d="M4 8V5a1 1 0 0 1 1-1h3"/><path d="M16 4h3a1 1 0 0 1 1 1v3"/><path d="M20 16v3a1 1 0 0 1-1 1h-3"/><path d="M8 20H5a1 1 0 0 1-1-1v-3"/><path d="M4 12h16"/>', s); },
    switchUser: function (s) { return svg('<path d="M16 3h5v5"/><path d="M21 3l-7 7"/><path d="M8 21H3v-5"/><path d="M3 21l7-7"/>', s); },
    team: function (s) { return svg('<circle cx="6" cy="7" r="2.4"/><circle cx="18" cy="9" r="2.4"/><circle cx="12" cy="18" r="2.4"/><path d="M8.2 8.1l3.2 8M15.7 10.2l-3.3 6M8.1 7.4l7.6 1.3"/>', s); },
    lockSmall: function (s) { return svg('<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>', s); },
    globe: function (s) { return svg('<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18"/><path d="M12 3a14 14 0 0 0 0 18"/>', s); },
    userCheck: function (s) { return svg('<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6"/><path d="M16 11l2 2 4-4"/>', s); },
    users: function (s) { return svg('<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M16 5.5a3 3 0 0 1 0 5"/><path d="M18 20c0-2.5-1-4.5-2.5-5.5"/>', s); },
    like: function (s) { return zicon('like', s); },
    spark: function (s) { return zicon('spark', s); },
    plus: function (s) { return zicon('plus', s); },
    /* 齿轮（设置） */
    gear: function (s) { return svg('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>', s); },
    /* 三横线（功能菜单） */
    menu: function (s) { return svg('<path d="M4 7h16M4 12h16M4 17h16"/>', s); },
    /* 排序 */
    sort: function (s) { return svg('<path d="M4 6h10M4 12h7M4 18h4M14 9l3-3 3 3M17 6v12"/>', s); },
    /* 返回箭头 */
    back: function (s) { return svg('<path d="M19 12H5"/><path d="M11 6l-6 6 6 6"/>', s); },
    /* 评论 */
    comment: function (s) { return svg('<path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.5 9 9 0 0 1-3.9-.9L3 21l1.4-4.4A8.4 8.4 0 0 1 12.5 3 8.4 8.4 0 0 1 21 11.5z"/>', s); },
    /* 收藏（书签） */
    bookmark: function (s) { return svg('<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>', s); },
    /* 三横+笔（编辑标签入口） */
    tagEdit: function (s) { return svg('<path d="M4 7h9M4 12h7"/><path d="M14 20h6M16.5 3.5a2.1 2.1 0 0 1 3 3L8 19l-4 1 1-4z"/>', s); },
    /* 对勾（已选） */
    checkMark: function (s) { return svg('<path d="M5 12l5 5L20 7"/>', s); }
  };

  function formatK(n) {
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return String(n);
  }

  /* ----------------------------- Mock 数据 ----------------------------- */
  var currentUser = (function () {
    var src = (window.ZX_MOCK && window.ZX_MOCK.users && window.ZX_MOCK.users[0]) || {};
    return {
      id: src.id || 'u-me',
      name: src.name || '我',
      initials: src.initials || '我',
      avatarColor: src.avatarColor || '#1D5B7A',
      level: src.authority || 67,
      motto: ''  // 用户自填格言，默认空
    };
  })();

  var MOCK_PROFILE = {
    user: currentUser,
    /* 社交顺序：获赞（最大）→ 关注 → 粉丝 → 团队 */
    social: [
      { key: 'likes', num: 1340, label: '获赞' },
      { key: 'following', num: 48, label: '关注' },
      { key: 'followers', num: 126, label: '粉丝' },
      { key: 'teams', num: 3, label: '团队' }
    ],
    /* 获赞用户列表 */
    likeUsers: [
      { id: 'u-jiangyue', name: '江月', avatar: '#1D5B7A', time: '2 小时前', note: '固态电池界面阻抗' },
      { id: 'u-wangshi', name: '王石', avatar: '#B4602C', time: '昨天', note: '锂电池范式转移' },
      { id: 'u-zhouye', name: '周野', avatar: '#9C7E2E', time: '3 天前', note: '钠枝晶复盘' },
      { id: 'u-chenyan', name: '陈砚', avatar: '#C1272D', time: '5 天前', note: '界面阻抗' },
      { id: 'u-linxi', name: '林溪', avatar: '#1D5B7A', time: '1 周前', note: 'SEI 膜' }
    ],
    /* 关注的用户列表 */
    followingUsers: [
      { id: 'u-jiangyue', name: '江月', avatar: '#1D5B7A', bio: '固态电池方向，界面工程', followed: true },
      { id: 'u-wangshi', name: '王石', avatar: '#B4602C', bio: '产业分析，5年路线图', followed: true },
      { id: 'u-zhouye', name: '周野', avatar: '#9C7E2E', bio: '钠电枝晶与界面', followed: true }
    ],
    /* 粉丝列表 */
    followersUsers: [
      { id: 'u-chenyan', name: '陈砚', avatar: '#C1272D', bio: '正极材料研发', followed: false },
      { id: 'u-linxi', name: '林溪', avatar: '#1D5B7A', bio: '电解质合成', followed: true },
      { id: 'u-zhaoming', name: '赵明', avatar: '#B4602C', bio: '半固态电池工程化', followed: false }
    ],
    /* 团队列表（不跳好友页，本页内展示） */
    teamsList: [
      { id: 't-solid-dojo', name: '固态电池研习社', members: 6, role: '成员', desc: '每周一篇文献精读，月度讨论复盘', visibility: '公开' },
      { id: 't-impedance', name: '界面阻抗攻坚组', members: 4, role: '管理员', desc: '聚焦正极/电解质界面工程', visibility: '公开' },
      { id: 't-na-team', name: '钠电兴趣小组', members: 3, role: '成员', desc: '钠枝晶与界面稳定性讨论', visibility: '公开' }
    ],
    /* Tab 1 · 作品：三级分类（作品集 / 智能体 / 工作流） */
    worksV2: {
      /* 作品集（笔记文件夹） */
      collections: [
        { name: '界面阻抗专题', count: 8, color: '#C1272D', notes: [
          { title: '固态电池界面阻抗：从 1200 到 80 Ω·cm²', excerpt: '把 Wang et al. 2024 的原位 XPS 数据重做了一遍拟合...', fingerprint: 'human', fpLabel: '人写', likes: 1200, time: '3 天前' },
          { title: 'LiNbO₃ 涂层厚度优化', excerpt: '3nm 是最优厚度，5nm 反而阻抗上升...', fingerprint: 'human', fpLabel: '人写', likes: 456, time: '5 天前' },
          { title: '界面阻抗测量方法对比', excerpt: 'EIS vs 四电极体系，测量结果差异...', fingerprint: 'cocreate', fpLabel: '人机共创', likes: 234, time: '1 周前' }
        ]},
        { name: '钠电枝晶', count: 5, color: '#B4602C', notes: [
          { title: '钠枝晶 137 篇论文的可重复性复盘', excerpt: '几乎没有一篇文章能稳定复现...', fingerprint: 'human', fpLabel: '人写', likes: 412, time: '4 天前' },
          { title: '钠枝晶的真正成因', excerpt: '钠枝晶不是单一因素导致...', fingerprint: 'human', fpLabel: '人写', likes: 198, time: '1 周前' }
        ]},
        { name: '产业路线', count: 4, color: '#1D5B7A', notes: [
          { title: '锂电池范式转移：5 年路线图笔记', excerpt: 'AI 协助整理了 80+ 篇产业报告...', fingerprint: 'cocreate', fpLabel: '人机共创', likes: 768, time: '5 天前' },
          { title: '为什么 2026 是固态电池量产元年', excerpt: '从产业链各环节进度看...', fingerprint: 'ai-pdf', fpLabel: 'AI + PDF', likes: 623, time: '6 天前' }
        ]},
        { name: '复习卡', count: 3, color: '#9C7E2E', notes: [
          { title: '复习卡：液态 vs 固态核心差异', excerpt: '液态靠浸润、固态靠贴合...', fingerprint: 'human', fpLabel: '人写', likes: 234, time: '1 周前' }
        ]}
      ],
      /* 智能体 */
      agents: [
        { name: '文献摘要助手', desc: '自动抽取论文关键论点，生成结构化摘要', uses: 156, icon: 'spark' },
        { name: '数据拟合专家', desc: 'EIS 数据拟合 + 等效电路推荐', uses: 89, icon: 'bot' },
        { name: '讨论对手', desc: '针对你的笔记生成反方论据，帮助发现盲点', uses: 34, icon: 'vs' }
      ],
      /* 工作流 */
      workflows: [
        { name: '每日研读', desc: '晨间推送 3 张复习卡 + 1 个待讨论点', uses: 42, icon: 'spark' },
        { name: '周报生成', desc: '本周笔记/讨论/沉淀自动汇总成周报', uses: 18, icon: 'template' },
        { name: '深度调研', desc: '多轮搜索 + 总结，输出一份结构化报告', uses: 7, icon: 'search' },
        { name: '文献速读', desc: 'PDF 陪读 + 关键论点抽取为卡片', uses: 23, icon: 'clipboard' },
        { name: '讨论复盘', desc: '把参与过的讨论整理成正反论据表', uses: 5, icon: 'vs' }
      ]
    },
    /* Tab 2 · 收藏 */
    favorites: [
      { title: '为什么 2026 是固态电池量产元年', author: '王石', time: '6 天前', fingerprint: 'ai-pdf', fpLabel: 'AI + PDF', excerpt: '从产业链各环节进度看，2026 年硫化物路线将进入中试阶段，半固态已率先上车。' },
      { title: '三分钟看懂 SEI 膜', author: '周野', time: '2 天前', fingerprint: 'ai', fpLabel: 'AI 生成', excerpt: 'SEI 膜的形成机制、稳定性与界面阻抗的关系，一图看懂。' },
      { title: '界面阻抗是否被高估了？', author: '江月', time: '昨天', fingerprint: 'human', fpLabel: '人写', excerpt: '界面阻抗只是性能指标之一，循环寿命和安全性同样关键。' },
      { title: '钠枝晶的真正成因', author: '陈砚', time: '1 周前', fingerprint: 'human', fpLabel: '人写', excerpt: '钠枝晶不是单一因素导致，而是电流分布不均的宏观表现。' }
    ],
    /* Tab 3 · 评论 */
    comments: [
      { noteTitle: '固态电池界面阻抗：从 1200 到 80 Ω·cm²', content: 'LiNbO₃ 涂层的厚度优化曲线你做过吗？我这边 5nm 反而阻抗上升了。', time: '2 小时前', likes: 8 },
      { noteTitle: '钠枝晶 137 篇论文的可重复性复盘', content: '临界电流密度的测量方法不统一是核心问题，建议补充电化学窗口的对比。', time: '昨天', likes: 15 },
      { noteTitle: '锂电池范式转移：5 年路线图笔记', content: '硫化物 2026 中试的判断偏乐观，丰田和 Quantumscape 的进度差异很大。', time: '3 天前', likes: 23 }
    ],
    /* Tab 4 · 点赞 */
    likedNotes: [
      { title: '界面阻抗是否被高估了？', author: '江月', time: '昨天', fingerprint: 'human', fpLabel: '人写', excerpt: '界面阻抗只是性能指标之一，循环寿命和安全性同样关键。' },
      { title: '为什么 2026 是固态电池量产元年', author: '王石', time: '6 天前', fingerprint: 'ai-pdf', fpLabel: 'AI + PDF', excerpt: '从产业链各环节进度看，2026 年硫化物路线将进入中试阶段。' },
      { title: '三分钟看懂 SEI 膜', author: '周野', time: '2 天前', fingerprint: 'ai', fpLabel: 'AI 生成', excerpt: 'SEI 膜的形成机制、稳定性与界面阻抗的关系。' },
      { title: '钠枝晶的真正成因', author: '陈砚', time: '1 周前', fingerprint: 'human', fpLabel: '人写', excerpt: '钠枝晶不是单一因素导致，而是电流分布不均的宏观表现。' }
    ],
    /* 收藏夹 */
    collections: [
      { name: '界面工程', count: 12, color: '#C1272D' },
      { name: '钠电专题', count: 8, color: '#B4602C' },
      { name: '产业报告', count: 5, color: '#1D5B7A' },
      { name: '方法论', count: 3, color: '#9C7E2E' }
    ],
    /* 个人标签：用户已选 + 预设分类 */
    tags: {
      user: ['材料学', '固态电池', '界面阻抗'],
      preset: [
        { category: '学校', items: ['清华大学', '北京大学', '复旦大学', '上海交大', '浙江大学', '中科大'] },
        { category: '专业', items: ['材料学', '化学', '物理学', '电子工程', '机械工程', '计算材料'] },
        { category: '关注点', items: ['固态电池', '钠电池', '锂硫电池', 'SEI 膜', '界面阻抗', '枝晶', '正极材料', '电解质'] },
        { category: '爱好', items: ['阅读', '跑步', '摄影', '音乐', '编程', '围棋'] }
      ]
    },
    /* 隐私设置（toggle 开关，关闭的项显示锁图标） */
    privacy: {
      publicWorks: true,
      publicFavorites: false,
      publicComments: true,
      publicLikes: false
    },
    /* 默认可见度（写入数据，供发布/笔记编辑器读取） */
    defaultVisibility: window.VIS ? VIS.defaultVisibility() : { scope: 'all', preview: 'summary', paywall: 'free' },
    /* 社交授权（谁可以加好友/@我/私信，陌生人消息处理） */
    socialAuth: {
      addFriend: 'all',      /* all | friends | nobody */
      mention: 'friends',    /* all | friends | nobody */
      message: 'friends',    /* all | friends | nobody */
      stranger: 'fold'       /* fold | block | allow */
    },
    /* 登录设备（可变：点击非当前设备可删除） */
    devices: [
      { id: 'dev-iphone',   name: 'iPhone 15 · 当前', hint: '上海 · 在线', isCurrent: true },
      { id: 'dev-ipad',     name: 'iPad Air',         hint: '3 天前',     isCurrent: false },
      { id: 'dev-mac',      name: 'MacBook Pro',      hint: '1 周前',     isCurrent: false }
    ],
    settings: [
      {
        label: '账号与安全',
        items: [
          { key: 'account', name: '账号设置', icon: 'user', hint: '手机号 · 邮箱 · 密码' },
          { key: 'notification', name: '通知设置', icon: 'bell', hint: '讨论回复 · 每日推送' },
          { key: 'privacy', name: '隐私设置', icon: 'shield', hint: '谁能看到我的笔记' }
        ]
      },
      {
        label: '外观与工具',
        items: [
          { key: 'theme', name: '主题', icon: 'palette', hint: '浅色 · 深色 · 跟随系统' },
          { key: 'switch-account', name: '切换账号', icon: 'switchUser', hint: '多账号管理' }
        ]
      },
      {
        label: '关于',
        items: [
          { key: 'about', name: '关于知行', icon: 'info', hint: 'v0.5 · Phase 5 Demo' }
        ]
      },
      {
        label: '',
        items: [
          { key: 'logout', name: '退出登录', icon: 'logout', danger: true }
        ]
      }
    ]
  };

  /* ----------------------------- 状态 ----------------------------- */
  var toastTimer = null;

  /* 访客视角：viewingUserId 为 null 表示查看自己，否则表示查看其他用户。
   * 访客栈：支持「好友→A→A的关注→B」多层跳转，返回时逐层回退。
   * 每层记录 { uid, fromTab, fromView } —— 进入下一层前把当前层压栈。 */
  var viewingUserId = null;
  var viewingFromTab = 'friends';
  var viewingFromView = null;
  var guestStack = [];
  /* 当前 profile 激活视图（switchView 同步），用于 viewUser 记录来源 */
  var currentPfView = 'main';
  /* 备份自己的用户数据 + 作品集 + 标签，便于 viewSelf 恢复（访客视角会覆盖这些） */
  var selfUserData = JSON.parse(JSON.stringify(MOCK_PROFILE.user));
  var selfCollections = JSON.parse(JSON.stringify(MOCK_PROFILE.worksV2.collections));
  var selfTags = JSON.parse(JSON.stringify(MOCK_PROFILE.tags.user));

  /* 顶部栏：访客视角下，左上角 menu 改为返回箭头，右上角隐藏（关注键移到底部 CTA） */
  function updateTopbar() {
    var root = $('[data-pf-root]');
    var leftBtn = $('[data-pf-top-left]');
    var rightBtn = $('[data-pf-top-right]');
    if (root) root.classList.toggle('is-guest', !!viewingUserId);
    if (leftBtn) {
      if (viewingUserId) {
        /* 返回箭头 */
        leftBtn.setAttribute('data-action', 'back-to-self');
        leftBtn.setAttribute('aria-label', '返回');
        leftBtn.innerHTML = IC.back(22);
      } else {
        /* 三横菜单 */
        leftBtn.setAttribute('data-action', 'menu');
        leftBtn.setAttribute('aria-label', '功能菜单');
        leftBtn.innerHTML = svg('<path d="M4 7h16M4 12h16M4 17h16"/>', 22);
      }
    }
    if (rightBtn) {
      if (viewingUserId) {
        /* 访客视角：右上角隐藏（关注键在底部 CTA） */
        rightBtn.style.display = 'none';
      } else {
        /* 自己主页：恢复设置齿轮 */
        rightBtn.style.display = '';
        rightBtn.removeAttribute('aria-pressed');
        rightBtn.className = 'zx-icon-btn';
        rightBtn.setAttribute('data-action', 'settings');
        rightBtn.setAttribute('aria-label', '打开设置');
        rightBtn.innerHTML = svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>', 22);
      }
    }
  }

  /* 访客主页关注键已移至 Hero 右上角（renderHero 内联），此处仅清理遗留的底部 CTA 节点 */
  function renderGuestCta() {
    var mainView = $('[data-pf-view="main"]');
    if (mainView) {
      var existing = mainView.querySelector('.pf-guest-cta');
      if (existing) existing.parentNode.removeChild(existing);
    }
  }

  /* 本地 guest 兜底字典：合并 likeUsers/followingUsers/followersUsers，
   * 让 viewUser 在 ZX_MOCK 查不到时（如 u-chenyan）也能拿到 name/avatar/bio。
   * 返回时把 avatar 归一化为 avatarColor，并补 authority/domain，保证访客主页字段完整。 */
  function getGuestById(uid) {
    var pool = []
      .concat(MOCK_PROFILE.likeUsers)
      .concat(MOCK_PROFILE.followingUsers)
      .concat(MOCK_PROFILE.followersUsers);
    var found = null;
    for (var i = 0; i < pool.length; i++) {
      if (pool[i] && pool[i].id === uid) { found = pool[i]; break; }
    }
    if (!found) return null;
    return {
      id: found.id,
      name: found.name,
      initials: found.name ? found.name.charAt(0) : '?',
      avatarColor: found.avatar || found.avatarColor || '#6B655C',
      bio: found.bio || (found.note ? '赞了《' + found.note + '》' : ''),
      authority: found.authority || (50 + (found.name ? found.name.length * 7 : 0))
    };
  }

  /* 统一关注状态读取：bridge 闭环 OR 本地 mock 任一为真即真 */
  function isFollowing(uid) {
    if (window.ZX_BRIDGE && typeof window.ZX_BRIDGE.isFollowing === 'function') {
      if (window.ZX_BRIDGE.isFollowing(uid)) return true;
    }
    var lists = [MOCK_PROFILE.followingUsers, MOCK_PROFILE.followersUsers];
    for (var i = 0; i < lists.length; i++) {
      for (var j = 0; j < lists[i].length; j++) {
        if (lists[i][j].id === uid && lists[i][j].followed) return true;
      }
    }
    return false;
  }

  /* 统一关注写入：同步 bridge + 本地 mock（followingUsers/followersUsers） */
  function setFollow(uid, val) {
    if (window.ZX_BRIDGE) {
      if (val) {
        if (typeof window.ZX_BRIDGE.follow === 'function') window.ZX_BRIDGE.follow(uid);
      } else {
        if (typeof window.ZX_BRIDGE.unfollow === 'function') window.ZX_BRIDGE.unfollow(uid);
      }
    }
    var lists = [MOCK_PROFILE.followingUsers, MOCK_PROFILE.followersUsers];
    for (var i = 0; i < lists.length; i++) {
      for (var j = 0; j < lists[i].length; j++) {
        if (lists[i][j].id === uid) lists[i][j].followed = !!val;
      }
    }
  }

  /* 判断是否已关注某访客（统一走 isFollowing） */
  function isGuestFollowing(uid) { return isFollowing(uid); }

  /* 切换对当前访客的关注状态 */
  function toggleGuestFollow() {
    if (!viewingUserId) return;
    var uid = viewingUserId;
    var wasFollowing = isFollowing(uid);
    setFollow(uid, !wasFollowing);
    /* 关注键在 Hero 内，需重渲 Hero 刷新按钮态 */
    renderHero();
    toast(wasFollowing ? '已取消关注' : '已关注');
  }

  /* 访客视角：加载其他用户数据并重新渲染。fromTab 可选：返回时切到该 tab */
  function viewUser(uid, fromTab) {
    if (!uid || uid === MOCK_PROFILE.user.id) { viewSelf(); return; }
    var src = null;
    if (window.ZX_MOCK && window.ZX_MOCK.users) {
      for (var i = 0; i < window.ZX_MOCK.users.length; i++) {
        if (window.ZX_MOCK.users[i].id === uid) { src = window.ZX_MOCK.users[i]; break; }
      }
    }
    /* ZX_MOCK 查不到则用本地 guest 字典兜底（不再 toast 报错） */
    if (!src) { src = getGuestById(uid); }
    if (!src) { toast('未找到该用户'); return; }
    /* 访客栈：若已在访客视角（viewingUserId 非空），先把当前层压栈，
     * 这样从「A的关注列表」点 B 头像进入 B 主页后，返回时能回到 A 主页而非自己。 */
    if (viewingUserId) {
      guestStack.push({
        uid: viewingUserId,
        fromTab: viewingFromTab,
        fromView: viewingFromView
      });
    }
    /* 记录来源：从哪个 tab + profile 内哪个视图进入，便于返回 */
    viewingUserId = uid;
    if (fromTab) viewingFromTab = fromTab;
    viewingFromView = currentPfView || null;
    /* 用 mock 用户数据覆盖自己 */
    MOCK_PROFILE.user = {
      id: src.id,
      name: src.name || '用户',
      initials: src.initials || (src.name || '?').charAt(0),
      avatarColor: src.avatarColor || '#6B655C',
      level: src.authority || 50,
      motto: src.bio || ''
    };
    /* 访客主页差异化：用该用户真实笔记派生作品集 + 标签 */
    var gp = buildGuestProfile(src.id);
    MOCK_PROFILE.worksV2.collections = gp.collections.length ? gp.collections : [{
      name: '暂无作品', count: 0, color: '#8A8478', notes: []
    }];
    MOCK_PROFILE.tags.user = gp.tags;
    /* 进入文件夹视图时重置，避免上一个访客的 activeCollectionIdx 越界 */
    activeCollectionIdx = -1;
    /* 访客主页全屏：覆盖在当前视图之上（main z-index 提升），隐底栏 */
    document.body.classList.add('is-pf-guest-open');
    updateTopbar();
    renderAll();
  }

  /* 退出访客视角：恢复自己的数据 + 切回来源 tab */
  function viewSelf() {
    /* 访客栈非空：返回到上一层访客主页（而非自己）。
     * 场景：好友→A→A的关注→B，在 B 主页点 ← 应回到 A 主页。 */
    if (guestStack.length > 0) {
      var prev = guestStack.pop();
      /* 恢复上一层状态，重新加载该访客数据（不压栈，因为 prev 已是历史层） */
      viewingUserId = null;
      var prevSrc = null;
      if (window.ZX_MOCK && window.ZX_MOCK.users) {
        for (var i = 0; i < window.ZX_MOCK.users.length; i++) {
          if (window.ZX_MOCK.users[i].id === prev.uid) { prevSrc = window.ZX_MOCK.users[i]; break; }
        }
      }
      if (!prevSrc) prevSrc = getGuestById(prev.uid);
      if (!prevSrc) { toast('未找到该用户'); return; }
      viewingUserId = prev.uid;
      viewingFromTab = prev.fromTab;
      viewingFromView = prev.fromView;
      MOCK_PROFILE.user = {
        id: prevSrc.id,
        name: prevSrc.name || '用户',
        initials: prevSrc.initials || (prevSrc.name || '?').charAt(0),
        avatarColor: prevSrc.avatarColor || '#6B655C',
        level: prevSrc.authority || 50,
        motto: prevSrc.bio || ''
      };
      /* 恢复上一层访客的作品集 + 标签 */
      var prevGp = buildGuestProfile(prevSrc.id);
      MOCK_PROFILE.worksV2.collections = prevGp.collections.length ? prevGp.collections : [{
        name: '暂无作品', count: 0, color: '#8A8478', notes: []
      }];
      MOCK_PROFILE.tags.user = prevGp.tags;
      activeCollectionIdx = -1;
      document.body.classList.add('is-pf-guest-open');
      updateTopbar();
      renderAll();
      return;
    }
    if (!viewingUserId) return;
    viewingUserId = null;
    /* 先记录来源，再清状态（switchView/switchTab 会触发重渲） */
    var fromTab = viewingFromTab;
    var fromView = viewingFromView;
    MOCK_PROFILE.user = JSON.parse(JSON.stringify(selfUserData));
    /* 恢复自己的作品集 + 标签（访客视角覆盖过它们）
     * 优先从 ZX_BRIDGE 实时读取（处理笔记本工作区新建/删除笔记后的同步） */
    var freshCols = buildCollectionsFromBridge();
    if (freshCols.length) {
      MOCK_PROFILE.worksV2.collections = freshCols;
      selfCollections = JSON.parse(JSON.stringify(freshCols));
    } else {
      MOCK_PROFILE.worksV2.collections = JSON.parse(JSON.stringify(selfCollections));
    }
    MOCK_PROFILE.tags.user = JSON.parse(JSON.stringify(selfTags));
    activeCollectionIdx = -1;
    /* 移除访客全屏态 */
    document.body.classList.remove('is-pf-guest-open');
    updateTopbar();
    renderAll();
    /* 恢复来源：profile 内先回到来源视图（following-list 等），再切 tab；
     * 来自 friends 则直接切回 friends tab */
    if (fromTab && fromTab !== 'profile') {
      if (window.ZX_BRIDGE && typeof window.ZX_BRIDGE.switchTab === 'function') {
        window.ZX_BRIDGE.switchTab(fromTab);
      } else if (window.ZX && typeof window.ZX.switchTab === 'function') {
        window.ZX.switchTab(fromTab);
      } else {
        var tab = document.querySelector('[data-tab="' + fromTab + '"]');
        if (tab) tab.click();
      }
    } else if (fromView && fromView !== 'main') {
      /* 来源是 profile 内的列表视图 → 恢复该视图（重新全屏展开） */
      switchView(fromView);
    }
    viewingFromView = null;
  }

  /* ----------------------------- 渲染：Hero ----------------------------- */

  function renderHero() {
    var host = $('[data-pf-hero]');
    if (!host) return;
    var u = MOCK_PROFILE.user;

    /* 格言：有内容显示文字+右侧编辑图标；空占位显示引导。两者都可点击编辑 */
    var mottoHtml = u.motto
      ? '<button class="pf-motto" data-pf-motto-edit aria-label="编辑格言">'
        + '<span class="pf-motto__text">' + escapeHtml(u.motto) + '</span>'
        + '<span class="pf-motto__edit">' + IC.pencil(13) + '</span>'
        + '</button>'
      : '<button class="pf-motto pf-motto--empty" data-pf-motto-edit aria-label="设置格言">'
        + '<span class="pf-motto__text">点击设置你的格言</span>'
        + '<span class="pf-motto__edit">' + IC.pencil(13) + '</span>'
        + '</button>';

    /* social 区：始终显示社交按钮（标签编辑模式由 [data-pf-tags] 容器整体替换处理） */
    var socialAreaHtml = renderSocialHtml();

    /* 访客视角：Hero 右上角放关注/已关注键（与名字同一行的右侧） */
    var followHtml = '';
    if (viewingUserId) {
      var following = isGuestFollowing(viewingUserId);
      var btnCls = following ? 'pf-follow-btn is-following' : 'pf-follow-btn';
      followHtml = '<button class="' + btnCls + ' pf-hero__follow" data-action="toggle-follow-guest" aria-pressed="' + following + '">'
        + (following ? '已关注' : '＋ 关注')
        + '</button>';
    }

    host.innerHTML = ''
      + '<div class="pf-hero">'
      +   '<div class="pf-hero__top">'
      +     '<div class="pf-avatar" data-action="upload-avatar" role="button" aria-label="更换头像" tabindex="0" style="background:' + u.avatarColor + '">' + escapeHtml(u.initials) + '</div>'
      +     '<div class="pf-hero__id">'
      +       '<h2 class="pf-name">' + escapeHtml(u.name) + '<span class="pf-level">Lv.' + u.level + '</span></h2>'
      +       mottoHtml
      +     '</div>'
      +     followHtml
      +     (viewingUserId ? '' : '<button class="pf-hero__bg-btn" data-action="upload-bg" aria-label="更换背景图">'
      +       IC.image(18) + '<span>背景</span>'
      +     '</button>')
      +   '</div>'
      +   '<div class="pf-social-area">' + socialAreaHtml + '</div>'
      + '</div>';
  }

  /* 社交行：获赞 / 关注 / 粉丝 / 团队 4 个按钮 */
  /* 访客社交数据差异化：基于 uid 哈希生成确定性数字（同一人每次相同，不同人不同）。
   * 避免所有访客主页都是同一份 1.3k/48/126/3。 */
  function hashStr(s) {
    var h = 0;
    for (var i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) | 0; }
    return Math.abs(h);
  }
  /* 从 ZX_MOCK.users 读取真实社交数据（followers/following/likes）；查不到则 hash 兜底。
   * teams 仍用 hash 派生（mock 无此字段）。 */
  function guestStats(uid) {
    var u = null;
    if (window.ZX_MOCK && window.ZX_MOCK.users) {
      for (var i = 0; i < window.ZX_MOCK.users.length; i++) {
        if (window.ZX_MOCK.users[i].id === uid) { u = window.ZX_MOCK.users[i]; break; }
      }
    }
    if (u) {
      return {
        likes: u.likes != null ? u.likes : 0,
        following: u.following != null ? u.following : 0,
        followers: u.followers != null ? u.followers : 0,
        teams: 1 + (hashStr(uid || 'x') % 4)
      };
    }
    var h = hashStr(uid || 'x');
    function n(base, step) { return base + (h % step); }
    return { likes: n(120, 2400), following: n(12, 180), followers: n(40, 900), teams: n(1, 8) };
  }
  /* 自己/访客的社交数据统一从真实用户数据派生（自己用 u-me，访客用 viewingUserId） */
  function currentSocial() {
    var uid = viewingUserId || (MOCK_PROFILE.user && MOCK_PROFILE.user.id) || 'u-me';
    var st = guestStats(uid);
    return [
      { key: 'likes', num: st.likes, label: '获赞' },
      { key: 'following', num: st.following, label: '关注' },
      { key: 'followers', num: st.followers, label: '粉丝' },
      { key: 'teams', num: st.teams, label: '团队' }
    ];
  }

  function renderSocialHtml() {
    return '<div class="pf-social">' + currentSocial().map(function (s) {
      return socialBtn(s.key, s.num, s.label);
    }).join('') + '</div>';
  }

  /* 访客列表上下文：查看某访客的获赞/关注/粉丝/团队时，记录目标，列表据此渲染差异化数据。
   * guestListCtx = { uid, name } ；为 null 表示查看自己的列表（用 MOCK_PROFILE） */
  var guestListCtx = null;

  /* 基于 uid 生成"对方的"列表数据：从 ZX_MOCK.users 按 hash 抽样，
   * 保证同一人每次相同、不同人不同，且与"我"的列表区分开。 */
  function buildGuestListData(uid) {
    var pool = (window.ZX_MOCK && window.ZX_MOCK.users) ? window.ZX_MOCK.users.slice() : [];
    if (!pool.length) {
      pool = [].concat(MOCK_PROFILE.likeUsers).concat(MOCK_PROFILE.followingUsers);
    }
    /* 过滤掉访客自己 + 当前用户（u-me），避免出现"我关注我"的奇葩选项 */
    var meId = (selfUserData && selfUserData.id) || 'u-me';
    pool = pool.filter(function (u) { return u.id !== uid && u.id !== meId; });
    var h = hashStr(uid || 'x');
    function pick(arr, n) {
      var out = [];
      for (var k = 0; k < n; k++) { out.push(arr[(h + k * 7) % arr.length]); }
      return out;
    }
    var likes = pick(pool, Math.min(6, pool.length)).map(function (u, i) {
      return {
        id: u.id, name: u.name, avatar: u.avatarColor || '#6B655C',
        time: ['刚刚', '2 小时前', '昨天', '3 天前'][i % 4],
        note: ['界面阻抗是否被高估', '锂电池范式转移', '钠枝晶复盘', 'SEI 膜的形成'][i % 4]
      };
    });
    var following = pick(pool, Math.min(4, pool.length)).map(function (u) {
      return { id: u.id, name: u.name, avatar: u.avatarColor || '#6B655C', bio: u.bio || '该用户', followed: true };
    });
    var followers = pick(pool, Math.min(4, pool.length)).map(function (u, i) {
      return { id: u.id, name: u.name, avatar: u.avatarColor || '#6B655C', bio: u.bio || '该用户', followed: i % 2 === 0 };
    });
    var teams = [
      { name: MOCK_PROFILE.teamsList[h % MOCK_PROFILE.teamsList.length].name, members: 8 + (h % 30), role: '成员', desc: '该用户参与的小组', visibility: '公开' }
    ];
    return { likes: likes, following: following, followers: followers, teams: teams };
  }

  /* 从该用户的真实笔记（ZX_MOCK.notes 中 authorId === uid）派生访客主页的
   * 作品集（worksV2.collections）与个人标签（tags）。
   * 让每个访客主页差异化、且与广场 feed 数据一致。 */
  var STREAM_META_PF = {
    knowledge:  { label: '知识', color: '#1D5B7A' },
    creation:   { label: '创作', color: '#C7A24A' },
    review:     { label: '复盘', color: '#3E8DB0' },
    discussion: { label: '讨论', color: '#C1272D' }
  };
  var FP_LABEL = { human: '人写', cocreate: '人机共创', 'ai-pdf': 'AI + PDF', ai: 'AI 生成' };
  function buildGuestProfile(uid) {
    var allNotes = (window.ZX_MOCK && window.ZX_MOCK.notes) || [];
    var myNotes = allNotes.filter(function (n) { return n.authorId === uid; });

    /* 按 stream 分组成作品集 */
    var groups = {};
    myNotes.forEach(function (n) {
      var s = n.stream || 'knowledge';
      if (!groups[s]) groups[s] = [];
      groups[s].push(n);
    });
    var collections = Object.keys(groups).map(function (stream) {
      var arr = groups[stream];
      var meta = STREAM_META_PF[stream] || STREAM_META_PF.knowledge;
      return {
        name: meta.label,
        count: arr.length,
        color: meta.color,
        notes: arr.map(function (n) {
          var excerpt = n.summary || '';
          if (!excerpt && typeof n.body === 'string') excerpt = n.body.replace(/<[^>]+>/g, '').slice(0, 40);
          return {
            title: n.title,
            excerpt: excerpt,
            fingerprint: n.fingerprint || 'human',
            fpLabel: FP_LABEL[n.fingerprint] || '人写',
            likes: n.likes || 0,
            time: n.createdAt || '最近'
          };
        })
      };
    });

    /* 个人标签：优先用 user.tags，查不到则按领域兜底 */
    var userObj = null;
    if (window.ZX_MOCK && window.ZX_MOCK.users) {
      for (var i = 0; i < window.ZX_MOCK.users.length; i++) {
        if (window.ZX_MOCK.users[i].id === uid) { userObj = window.ZX_MOCK.users[i]; break; }
      }
    }
    var tags = (userObj && userObj.tags && userObj.tags.length)
      ? userObj.tags.slice()
      : ['该用户'];

    return { collections: collections, tags: tags };
  }

  /* 从 ZX_BRIDGE 构建作品集（与笔记本树同源数据）
   * 映射：每个 Notebook → 一个 Collection；其下 note 类型 File → Collection 内的笔记
   * 这样个人页的"作品集"与笔记本工作区的"笔记本"数据完全打通 */
  var NB_COLOR_PALETTE = ['#C1272D', '#B4602C', '#1D5B7A', '#9C7E2E', '#3E8DB0', '#C7A24A'];
  var FP_LABEL_MAP = { human: '人写', cocreate: '人机共创', 'ai-pdf': 'AI + PDF', ai: 'AI 生成' };
  function buildCollectionsFromBridge() {
    var b = window.ZX_BRIDGE;
    if (!b || !b.getPortfolios || !b.getNotebooks || !b.getFilesByNotebook) return [];
    var portfolios = b.getPortfolios();
    var collections = [];
    var colorIdx = 0;
    portfolios.forEach(function (p) {
      var nbs = b.getNotebooks(p.id);
      nbs.forEach(function (nb) {
        var files = b.getFilesByNotebook(nb.id, 'note');
        if (!files.length) return; /* 跳过空笔记本 */
        var color = NB_COLOR_PALETTE[colorIdx % NB_COLOR_PALETTE.length];
        colorIdx++;
        collections.push({
          id: nb.id,
          name: nb.name || '未命名笔记本',
          count: files.length,
          color: color,
          notes: files.map(function (f) {
            var excerpt = f.summary || '';
            if (!excerpt && typeof f.body === 'string') excerpt = f.body.replace(/<[^>]+>/g, '').slice(0, 40);
            var fp = f.aiCo ? 'cocreate' : 'human';
            return {
              id: f.id,
              title: f.title || f.name || '未命名笔记',
              excerpt: excerpt,
              fingerprint: fp,
              fpLabel: FP_LABEL_MAP[fp] || '人写',
              likes: f.likes || 0,
              time: f.modified || '最近'
            };
          })
        });
      });
    });
    return collections;
  }

  /* 标签分类编辑器已移到独立的 tag-add 视图，使用 renderTagAdd() */
  function socialBtn(key, num, label) {
    return '<button class="pf-social__item" data-pf-social="' + key + '">'
      + '<span class="pf-social__num">' + formatK(num) + '</span>'
      + '<span class="pf-social__label">' + label + '</span>'
      + '</button>';
  }

  /* ----------------------------- 渲染：个人标签 ----------------------------- */
  function renderTags() {
    var host = $('[data-pf-tags]');
    if (!host) return;
    var userTags = MOCK_PROFILE.tags.user;
    var tagsHtml = userTags.map(function (t, i) {
      return '<span class="pf-tag" data-pf-tag-idx="' + i + '">'
        + escapeHtml(t)
        + '<button class="pf-tag__x" data-pf-tag-remove="' + i + '" aria-label="删除标签 ' + escapeHtml(t) + '">×</button>'
        + '</span>';
    }).join('');
    /* 标签 + "+" 同一行，紧凑排列 */
    var html = '<div class="pf-tags">'
      + '<div class="pf-tags__row">'
      +   tagsHtml
      +   '<button class="pf-tag pf-tag--add" data-pf-tag-add aria-label="添加标签">' + IC.plus(14) + '</button>'
      + '</div>'
      + '</div>';
    host.innerHTML = html;
  }

  function addTag(tag) {
    tag = String(tag || '').trim();
    if (!tag) return false;
    if (MOCK_PROFILE.tags.user.indexOf(tag) >= 0) return false;
    MOCK_PROFILE.tags.user.push(tag);
    return true;
  }

  function removeTagByIdx(idx) {
    if (idx < 0 || idx >= MOCK_PROFILE.tags.user.length) return;
    MOCK_PROFILE.tags.user.splice(idx, 1);
  }

  /* ----------------------------- 渲染：Tab 分页（作品/点赞/评论/收藏） ----------------------------- */
  var TABS = [
    { key: 'works', label: '作品' },
    { key: 'likes', label: '点赞' },
    { key: 'comments', label: '评论' },
    { key: 'favorites', label: '收藏' }
  ];
  var activeTab = 'works';
  /* 作品子 tab：collections(作品集) / agents(智能体) / workflows(工作流) */
  var worksSubTab = 'collections';
  /* 文件夹详情：-1 表示未进入，>=0 表示查看对应文件夹 */
  var activeCollectionIdx = -1;
  /* 文件夹详情内笔记排序：time(时间) / type(类型) / hot(热度) */
  var collectionSort = 'time';
  /* 获赞列表分组方式：time(按时间) / note(按笔记) */
  var likesGroup = 'time';

  function renderTabs() {
    var host = $('[data-pf-works]');
    if (!host) return;
    /* 隐私映射：tab key → privacy key（仅自己主页生效，访客视角不显示锁） */
    var privacyMap = { works: 'publicWorks', likes: 'publicLikes', comments: 'publicComments', favorites: 'publicFavorites' };
    var isGuest = !!viewingUserId;
    var tabsHtml = TABS.map(function (t) {
      var cls = t.key === activeTab ? 'pf-tab is-active' : 'pf-tab';
      var pk = privacyMap[t.key];
      var locked = pk && !isGuest && MOCK_PROFILE.privacy[pk] === false;
      var lockHtml = locked ? '<span class="pf-tab__lock" aria-label="已设为私密">' + IC.lockSmall(11) + '</span>' : '';
      return '<button class="' + cls + '" data-pf-tab="' + t.key + '">' + escapeHtml(t.label) + lockHtml + '</button>';
    }).join('');
    host.innerHTML = ''
      + '<div class="pf-tabs">' + tabsHtml + '</div>'
      + '<div class="pf-tab-body" data-pf-tab-body></div>';
    renderTabBody();
  }

  function renderTabBody() {
    var body = $('[data-pf-tab-body]');
    if (!body) return;
    switch (activeTab) {
      case 'works': body.innerHTML = renderWorksV2Html(); break;
      case 'favorites': body.innerHTML = renderFavoritesHtml(); break;
      case 'comments': body.innerHTML = renderCommentsHtml(); break;
      case 'likes': body.innerHTML = renderLikesHtml(); break;
      default: body.innerHTML = '';
    }
  }

  /* Tab 1 · 作品（三级分类：作品集 / 智能体 / 工作流） */
  var WORKS_SUBTABS = [
    { key: 'collections', label: '作品集' },
    { key: 'agents', label: '智能体' },
    { key: 'workflows', label: '工作流' }
  ];

  /* 作品筛选下拉菜单开关 */
  var worksFilterOpen = false;

  function renderWorksV2Html() {
    /* 顶部工具栏：左侧空 / 右侧筛选按钮（点击弹出下拉菜单选分类） */
    var currentLabel = '';
    for (var i = 0; i < WORKS_SUBTABS.length; i++) {
      if (WORKS_SUBTABS[i].key === worksSubTab) { currentLabel = WORKS_SUBTABS[i].label; break; }
    }
    var html = '<div class="pf-filter-bar">'
      + '<span class="pf-filter-bar__hint">共 ' + worksCountFor(worksSubTab) + ' 项</span>'
      + '<button class="pf-filter-btn' + (worksFilterOpen ? ' is-active' : '') + '" data-pf-filter-toggle aria-label="筛选作品分类">'
      +   IC.chevDown(13) + escapeHtml(currentLabel)
      + '</button>'
      + '</div>';
    /* 下拉菜单（展开时显示）：每个分类带数量 + 内容摘要，避免空洞 */
    if (worksFilterOpen) {
      var wv = MOCK_PROFILE.worksV2 || {};
      var filterMeta = {
        collections: { count: (wv.collections || []).length, unit: '个作品集', hint: '笔记文件夹 · 按主题归档' },
        agents: { count: (wv.agents || []).length, unit: '个智能体', hint: '领域专用 · 可调用' },
        workflows: { count: (wv.workflows || []).length, unit: '个工作流', hint: '多步骤 · 可复用' }
      };
      html += '<div class="pf-filter-menu" role="menu">';
      WORKS_SUBTABS.forEach(function (t) {
        var cls = t.key === worksSubTab ? 'pf-filter-item is-active' : 'pf-filter-item';
        var m = filterMeta[t.key] || {};
        html += '<button class="' + cls + '" data-pf-filter="' + t.key + '" role="menuitem">'
          + '<span class="pf-filter-item__main">'
          +   '<span class="pf-filter-item__name">' + escapeHtml(t.label) + '</span>'
          +   '<span class="pf-filter-item__hint">' + escapeHtml(m.hint || '') + '</span>'
          + '</span>'
          + '<span class="pf-filter-item__count">' + (m.count != null ? m.count : 0) + ' ' + escapeHtml(m.unit || '') + '</span>'
          + '</button>';
      });
      html += '</div>';
    }
    /* 内容 body */
    html += '<div class="pf-subtab-body">';
    switch (worksSubTab) {
      case 'collections':
        if (activeCollectionIdx >= 0) {
          html += renderCollectionDetailHtml(activeCollectionIdx);
        } else {
          html += renderCollectionsHtml();
        }
        break;
      case 'agents': html += renderAgentsHtml(); break;
      case 'workflows': html += renderWorkflowsHtml(); break;
      default: html += '';
    }
    html += '</div>';
    return html;
  }

  /* 当前分类的作品数量（用于筛选栏左侧提示） */
  function worksCountFor(key) {
    if (key === 'collections') {
      var coll = MOCK_PROFILE.worksV2.collections;
      return coll ? coll.length : 0;
    }
    if (key === 'agents') {
      var a = MOCK_PROFILE.worksV2.agents;
      return a ? a.length : 0;
    }
    if (key === 'workflows') {
      var w = MOCK_PROFILE.worksV2.workflows;
      return w ? w.length : 0;
    }
    return 0;
  }

  /* 作品集：垂直列表卡片（高度变大，含摘要 + 获赞/评论/收藏指标） */
  function renderCollectionsHtml() {
    var collections = MOCK_PROFILE.worksV2.collections;
    if (!collections || !collections.length) return emptyHtml('还没有作品集');
    var html = '<div class="pf-folder-list">';
    collections.forEach(function (c, i) {
      /* 汇总该文件夹内笔记的互动指标（评论/收藏按比例 mock） */
      var totalLikes = 0;
      (c.notes || []).forEach(function (n) { totalLikes += (n.likes || 0); });
      var totalComments = Math.max(c.count, Math.floor(totalLikes / 6));
      var totalCollects = Math.floor(totalLikes / 4);
      /* 摘要：N 篇笔记 · 主题方向（取首篇摘要前 18 字符） */
      var firstExcerpt = (c.notes && c.notes[0]) ? c.notes[0].excerpt : '';
      var summary = c.count + ' 篇笔记 · ' + escapeHtml((firstExcerpt || '').slice(0, 18));
      html += '<button class="pf-folder-card" data-pf-folder="' + i + '">'
        + '<span class="pf-folder-card__color" style="background:' + c.color + '"></span>'
        + '<div class="pf-folder-card__body">'
        +   '<span class="pf-folder-card__name">' + escapeHtml(c.name) + '</span>'
        +   '<span class="pf-folder-card__summary">' + summary + (firstExcerpt.length > 18 ? '…' : '') + '</span>'
        +   '<div class="pf-folder-card__stats">'
        +     '<span class="pf-folder-card__stat">' + IC.like(12) + formatK(totalLikes) + '</span>'
        +     '<span class="pf-folder-card__stat">' + IC.comment(12) + formatK(totalComments) + '</span>'
        +     '<span class="pf-folder-card__stat">' + IC.bookmark(12) + formatK(totalCollects) + '</span>'
        +   '</div>'
        + '</div>'
        + '<span class="pf-folder-card__chev">' + IC.chev(16) + '</span>'
        + '</button>';
    });
    html += '</div>';
    return html;
  }

  /* 文件夹详情：返回栏 + 排序栏 + 笔记列表 */
  function renderCollectionDetailHtml(idx) {
    var coll = MOCK_PROFILE.worksV2.collections[idx];
    if (!coll) return emptyHtml('文件夹不存在');
    var html = '<div class="pf-folder-detail">';
    /* 返回栏 */
    html += '<div class="pf-back-bar">'
      + '<button class="pf-back-btn" data-pf-folder-back aria-label="返回作品集">' + IC.back(16) + '</button>'
      + '<span class="pf-back-title">' + escapeHtml(coll.name) + '</span>'
      + '</div>';
    /* 排序栏（编辑按钮复用 .pf-tags__edit 样式） */
    html += '<div class="pf-sort-bar">'
      + '<button class="pf-sort-btn' + (collectionSort === 'time' ? ' is-active' : '') + '" data-pf-coll-sort="time">时间</button>'
      + '<button class="pf-sort-btn' + (collectionSort === 'type' ? ' is-active' : '') + '" data-pf-coll-sort="type">类型</button>'
      + '<button class="pf-sort-btn' + (collectionSort === 'hot' ? ' is-active' : '') + '" data-pf-coll-sort="hot">热度</button>'
      + '<button class="pf-tags__edit" data-pf-work-edit>' + IC.pencil(13) + '编辑</button>'
      + '</div>';
    /* 笔记列表 */
    if (!coll.notes || !coll.notes.length) {
      html += emptyHtml('文件夹内还没有笔记');
    } else {
      html += '<div class="pf-list">';
      getSortedNotes(coll.notes).forEach(function (item) {
        html += renderNoteCard(item.n, item.i);
      });
      html += '</div>';
    }
    html += '</div>';
    return html;
  }

  /* 按当前排序方式返回笔记列表（保留原始索引） */
  function getSortedNotes(notes) {
    var list = notes.map(function (n, i) { return { n: n, i: i }; });
    if (collectionSort === 'hot') {
      list.sort(function (a, b) {
        return (b.n.likes || 0) - (a.n.likes || 0);
      });
    }
    /* time / type: 保持原顺序 */
    return list;
  }

  function renderNoteCard(n, i) {
    var fp = n.fingerprint ? '<span class="zx-fingerprint zx-fingerprint--' + n.fingerprint + '">' + escapeHtml(n.fpLabel || '') + '</span>' : '';
    var idAttr = n.id ? ' data-pf-note-id="' + escapeHtml(n.id) + '"' : '';
    return ''
      + '<button class="pf-item pf-item--note" data-pf-note="' + i + '"' + idAttr + '>'
      +   '<div class="pf-item__main">'
      +     '<span class="pf-item__tag pf-item__tag--note">笔记</span>'
      +     '<h4 class="pf-item__title">' + escapeHtml(n.title) + '</h4>'
      +     '<p class="pf-item__excerpt">' + escapeHtml(n.excerpt) + '</p>'
      +   '<div class="pf-item__meta">' + fp + '<span>' + IC.like(12) + formatK(n.likes) + '</span><span>·</span><span>' + escapeHtml(n.time) + '</span></div>'
      +   '</div>'
      +   '<span class="pf-item__chev">' + IC.chev(16) + '</span>'
      + '</button>';
  }

  /* 智能体列表 */
  function renderAgentsHtml() {
    var agents = MOCK_PROFILE.worksV2.agents;
    if (!agents || !agents.length) return emptyHtml('还没有智能体');
    var html = '<div class="pf-list">';
    agents.forEach(function (a, i) {
      var iconHtml = IC[a.icon] ? IC[a.icon](16) : zicon(a.icon, 16);
      html += ''
        + '<button class="pf-item pf-item--flow" data-pf-agent="' + i + '">'
        +   '<div class="pf-item__main">'
        +     '<div class="pf-item__flow-head">'
        +       '<span class="pf-item__flow-icon">' + iconHtml + '</span>'
        +       '<span class="pf-item__tag pf-item__tag--flow">智能体</span>'
        +     '</div>'
        +     '<h4 class="pf-item__title">' + escapeHtml(a.name) + '</h4>'
        +     '<p class="pf-item__excerpt">' + escapeHtml(a.desc) + '</p>'
        +     '<div class="pf-item__meta"><span class="pf-item__uses">已用 ' + a.uses + ' 次</span></div>'
        +   '</div>'
        +   '<span class="pf-item__chev">' + IC.chev(16) + '</span>'
        + '</button>';
    });
    html += '</div>';
    return html;
  }

  /* 工作流列表 */
  function renderWorkflowsHtml() {
    var workflows = MOCK_PROFILE.worksV2.workflows;
    if (!workflows || !workflows.length) return emptyHtml('还没有工作流');
    var html = '<div class="pf-list">';
    workflows.forEach(function (w, i) {
      var iconHtml = IC[w.icon] ? IC[w.icon](16) : zicon(w.icon, 16);
      html += ''
        + '<button class="pf-item pf-item--flow" data-pf-workflow="' + i + '">'
        +   '<div class="pf-item__main">'
        +     '<div class="pf-item__flow-head">'
        +       '<span class="pf-item__flow-icon">' + iconHtml + '</span>'
        +       '<span class="pf-item__tag pf-item__tag--flow">工作流</span>'
        +     '</div>'
        +     '<h4 class="pf-item__title">' + escapeHtml(w.name) + '</h4>'
        +     '<p class="pf-item__excerpt">' + escapeHtml(w.desc) + '</p>'
        +     '<div class="pf-item__meta"><span class="pf-item__uses">已用 ' + w.uses + ' 次</span></div>'
        +   '</div>'
        +   '<span class="pf-item__chev">' + IC.chev(16) + '</span>'
        + '</button>';
    });
    html += '</div>';
    return html;
  }

  /* Tab 2 · 收藏：以收藏夹为主体，采用网格布局（与作品集的垂直列表区分） */
  /* 收藏夹详情：-1 表示未进入，>=0 表示查看对应收藏夹 */
  var activeFavCollectionIdx = -1;
  function renderFavoritesHtml() {
    /* 在收藏夹详情中渲染详情，否则渲染收藏夹网格 */
    if (activeFavCollectionIdx >= 0) {
      return renderFavCollectionDetailHtml(activeFavCollectionIdx);
    }
    var html = '';
    if (MOCK_PROFILE.collections && MOCK_PROFILE.collections.length) {
      /* 网格布局：每个收藏夹是一张小卡片，书签图标 + 名称 + 数量 */
      html += '<div class="pf-fav-grid">';
      MOCK_PROFILE.collections.forEach(function (c, i) {
        html += '<button class="pf-fav-card" data-pf-fav-folder="' + i + '">'
          + '<span class="pf-fav-card__icon" style="color:' + c.color + '">' + IC.bookmark(22) + '</span>'
          + '<span class="pf-fav-card__name">' + escapeHtml(c.name) + '</span>'
          + '<span class="pf-fav-card__count">' + c.count + ' 篇</span>'
          + '</button>';
      });
      html += '</div>';
    }
    if (!MOCK_PROFILE.favorites.length && (!MOCK_PROFILE.collections || !MOCK_PROFILE.collections.length)) {
      html += emptyHtml('还没有收藏');
    }
    return html;
  }

  /* 收藏夹详情：返回栏 + 单篇收藏列表（mock 复用 favorites 全部，demo 简化） */
  function renderFavCollectionDetailHtml(idx) {
    var coll = MOCK_PROFILE.collections[idx];
    if (!coll) return emptyHtml('收藏夹不存在');
    var html = '<div class="pf-folder-detail">';
    html += '<div class="pf-back-bar">'
      + '<button class="pf-back-btn" data-pf-fav-folder-back aria-label="返回收藏夹">' + IC.back(16) + '</button>'
      + '<span class="pf-back-title">' + escapeHtml(coll.name) + '</span>'
      + '</div>';
    if (!MOCK_PROFILE.favorites.length) {
      html += emptyHtml('文件夹内还没有收藏');
    } else {
      html += '<div class="pf-list">';
      MOCK_PROFILE.favorites.forEach(function (f, i) {
        var fp = f.fingerprint ? '<span class="zx-fingerprint zx-fingerprint--' + f.fingerprint + '">' + escapeHtml(f.fpLabel || '') + '</span>' : '';
        html += ''
          + '<button class="pf-item" data-pf-fav="' + i + '">'
          +   '<div class="pf-item__main">'
          +     '<h4 class="pf-item__title">' + escapeHtml(f.title) + '</h4>'
          +     '<p class="pf-item__excerpt">' + escapeHtml(f.excerpt) + '</p>'
          +     '<div class="pf-item__meta">' + fp + '<span>@' + escapeHtml(f.author) + '</span><span>·</span><span>' + escapeHtml(f.time) + '</span></div>'
          +   '</div>'
          +   '<span class="pf-item__chev">' + IC.chev(16) + '</span>'
          + '</button>';
      });
      html += '</div>';
    }
    html += '</div>';
    return html;
  }

  /* Tab 3 · 评论（用户发过的评论） */
  function renderCommentsHtml() {
    if (!MOCK_PROFILE.comments.length) return emptyHtml('还没有评论');
    var html = '<div class="pf-list">';
    MOCK_PROFILE.comments.forEach(function (c, i) {
      html += ''
        + '<button class="pf-item pf-item--comment" data-pf-comment="' + i + '">'
        +   '<div class="pf-item__main">'
        +     '<p class="pf-item__reply-on">回复《' + escapeHtml(c.noteTitle) + '》</p>'
        +     '<p class="pf-item__content">' + escapeHtml(c.content) + '</p>'
        +     '<div class="pf-item__meta"><span>' + escapeHtml(c.time) + '</span><span>·</span><span>' + IC.like(12) + c.likes + ' 赞</span></div>'
        +   '</div>'
        + '</button>';
    });
    html += '</div>';
    return html;
  }

  /* Tab 4 · 点赞（点赞过的笔记） */
  function renderLikesHtml() {
    if (!MOCK_PROFILE.likedNotes.length) return emptyHtml('还没有点赞');
    var html = '<div class="pf-list">';
    MOCK_PROFILE.likedNotes.forEach(function (l, i) {
      var fp = l.fingerprint ? '<span class="zx-fingerprint zx-fingerprint--' + l.fingerprint + '">' + escapeHtml(l.fpLabel || '') + '</span>' : '';
      html += ''
        + '<button class="pf-item" data-pf-like="' + i + '">'
        +   '<div class="pf-item__main">'
        +     '<h4 class="pf-item__title">' + escapeHtml(l.title) + '</h4>'
        +     '<p class="pf-item__excerpt">' + escapeHtml(l.excerpt) + '</p>'
        +     '<div class="pf-item__meta">' + fp + '<span>@' + escapeHtml(l.author) + '</span><span>·</span><span>' + escapeHtml(l.time) + '</span></div>'
        +   '</div>'
        +   '<span class="pf-item__chev">' + IC.chev(16) + '</span>'
        + '</button>';
    });
    html += '</div>';
    return html;
  }

  function emptyHtml(msg) {
    return '<div class="pf-empty">' + escapeHtml(msg) + '</div>';
  }

  /* ----------------------------- 渲染：设置子页 ----------------------------- */
  function renderSettings() {
    var host = $('[data-pf-settings-body]');
    var titleEl = $('.pf-settings-title');
    var backBtn = $('[data-pf-settings-close]');
    if (!host) return;

    /* 详情模式：渲染对应详情页，标题改为详情名，返回键标记为「回列表」 */
    if (settingsDetailKey) {
      if (titleEl) titleEl.textContent = settingName(settingsDetailKey);
      if (backBtn) backBtn.setAttribute('data-pf-detail-back', '1');
      host.innerHTML = renderSettingsDetail(settingsDetailKey);
      return;
    }
    /* 列表模式 */
    if (titleEl) titleEl.textContent = '设置';
    if (backBtn) backBtn.removeAttribute('data-pf-detail-back');
    var html = '';
    MOCK_PROFILE.settings.forEach(function (g) {
      html += '<div class="pf-settings-group">'
        + (g.label ? '<p class="pf-settings-group__label">' + escapeHtml(g.label) + '</p>' : '')
        + '<div class="pf-settings-list">';
      g.items.forEach(function (it) {
        var danger = it.danger ? ' pf-settings-item--danger' : '';
        var iconHtml = IC[it.icon] ? IC[it.icon](17) : zicon(it.icon, 17);
        html += ''
          + '<button class="pf-settings-item' + danger + '" data-pf-setting="' + escapeHtml(it.key) + '">'
          +   '<span class="pf-settings-item__icon">' + iconHtml + '</span>'
          +   '<span class="pf-settings-item__main">'
          +     '<span class="pf-settings-item__name">' + escapeHtml(it.name) + '</span>'
          +     (it.hint ? '<span class="pf-settings-item__hint">' + escapeHtml(it.hint) + '</span>' : '')
          +   '</span>'
          +   '<span class="pf-settings-item__chev">' + IC.chev(16) + '</span>'
          + '</button>';
      });
      html += '</div></div>';
    });
    host.innerHTML = html;
  }

  /* 设置详情内容：key → HTML（复用 .pf-settings-list 样式） */
  function renderSettingsDetail(key) {
    var html = '<div class="pf-settings-detail">';
    if (key === 'account') {
      html += pfDetailGroup('', [
        pfDetailRow('手机号', '138 **** 6688', 'account-phone'),
        pfDetailRow('邮箱', 'me@zhixing.app', 'account-email'),
        pfDetailRow('密码', '已设置 · 点击修改', 'account-pwd')
      ]);
    } else if (key === 'notification') {
      html += '<div class="pf-settings-group"><div class="pf-settings-list">';
      html += pfToggleRow('讨论回复', 'notif-reply', true);
      html += pfToggleRow('@ 提及', 'notif-mention', true);
      html += pfToggleRow('好友请求', 'notif-friend', true);
      html += pfToggleRow('每日推送', 'notif-daily', false);
      html += '</div></div>';
    } else if (key === 'privacy') {
      /* 分组一：内容公开范围（4 个 toggle，联动 tab 小锁） */
      html += '<div class="pf-settings-group">'
        + '<p class="pf-settings-group__label">内容公开范围</p><div class="pf-settings-list">';
      html += pfToggleRow('公开作品', 'publicWorks', MOCK_PROFILE.privacy.publicWorks);
      html += pfToggleRow('公开收藏', 'publicFavorites', MOCK_PROFILE.privacy.publicFavorites);
      html += pfToggleRow('公开评论', 'publicComments', MOCK_PROFILE.privacy.publicComments);
      html += pfToggleRow('公开点赞', 'publicLikes', MOCK_PROFILE.privacy.publicLikes);
      html += '</div></div>';
      /* 分组二：默认可见度（与好友分组设计联动：所有人/好友/指定分组/仅自己） */
      html += '<div class="pf-settings-group">'
        + '<p class="pf-settings-group__label">默认可见度</p><div class="pf-settings-list">';
      html += pfChoiceRow('all', '所有人', true, IC.globe(17), 'data-pf-visibility');
      html += pfChoiceRow('friends', '仅好友', false, IC.userCheck(17), 'data-pf-visibility');
      html += pfChoiceRow('group', '指定分组', false, IC.users(17), 'data-pf-visibility');
      html += pfChoiceRow('self', '仅自己', false, IC.lockSmall(17), 'data-pf-visibility');
      html += '</div></div>';
      /* 分组三：社交授权（谁可以加好友/@我/私信，陌生人消息）—— 点击弹出选择面板 */
      html += '<div class="pf-settings-group">'
        + '<p class="pf-settings-group__label">社交授权</p><div class="pf-settings-list">';
      (function () {
        var labels = { addFriend: '谁可以加好友', mention: '谁可以 @ 我', message: '谁可以私信' };
        var scopeMap = { all: '所有人', friends: '仅好友', nobody: '不允许' };
        ['addFriend', 'mention', 'message'].forEach(function (k) {
          html += pfDetailRow(labels[k], scopeMap[MOCK_PROFILE.socialAuth[k]], 'social-' + k);
        });
        var strangerMap = { fold: '折叠', block: '屏蔽', allow: '允许' };
        html += pfDetailRow('陌生人消息', strangerMap[MOCK_PROFILE.socialAuth.stranger], 'social-stranger');
      })();
      html += '</div></div>';
      /* 分组四：登录设备（当前设备不可删，其他设备点击弹确认删除） */
      html += '<div class="pf-settings-group"><p class="pf-settings-group__label">登录设备</p><div class="pf-settings-list">';
      (MOCK_PROFILE.devices || []).forEach(function (d) {
        /* 当前设备：无 chevron、无 act（点击不响应）；其他设备：有 chevron，点击弹删除确认 */
        if (d.isCurrent) {
          html += pfDetailRow(d.name, d.hint, null, true);  /* act=null 禁用点击 */
        } else {
          html += pfDetailRow(d.name, d.hint, 'device-del-' + d.id, false);
        }
      });
      html += '</div></div>';
      /* 分组五：数据控制 */
      html += '<div class="pf-settings-group"><p class="pf-settings-group__label">数据控制</p><div class="pf-settings-list">';
      html += pfDetailRow('导出笔记', '', 'data-export', '');
      html += pfDetailRow('注销账号', '', 'data-delete', true);
      html += '</div></div>';
    } else if (key === 'export-notes') {
      html += renderExportNotes();
    } else if (key === 'theme') {
      html += '<div class="pf-settings-group"><div class="pf-settings-list">';
      html += pfChoiceRow('light', '浅色', themeMode === 'light', IC.sun(17));
      html += pfChoiceRow('dark', '深色', themeMode === 'dark', IC.moon(17));
      html += pfChoiceRow('auto', '跟随系统', themeMode === 'auto', IC.palette(17));
      html += '</div></div>';
    } else if (key === 'switch-account') {
      html += '<div class="pf-settings-group"><div class="pf-settings-list">';
      html += pfAccountRow('我', '#1D5B7A', true);
      html += pfAccountRow('工作号', '#B4602C', false);
      html += pfAccountRow('小号', '#9C7E2E', false);
      html += '</div></div>';
      html += '<div class="pf-settings-group"><div class="pf-settings-list">';
      html += pfDetailRow(IC.plus(15) + ' 添加账号', '', 'add-account', true);
      html += '</div></div>';
    } else if (key === 'about') {
      html += '<div class="pf-about">'
        + '<div class="pf-about__logo">知</div>'
        + '<h3 class="pf-about__name">知行</h3>'
        + '<p class="pf-about__ver">v0.5 · Phase 5 Demo</p>'
        + '</div>';
      html += pfDetailGroup('信息', [
        pfDetailRow('版本号', '0.5.0', null),
        pfDetailRow('开发者', '知行团队', null),
        pfDetailRow('用户协议', '', 'about-agreement'),
        pfDetailRow('隐私政策', '', 'about-privacy')
      ]);
    }
    html += '</div>';
    return html;
  }

  /* —— 详情行构件 —— */
  function pfDetailGroup(label, rows) {
    return '<div class="pf-settings-group">'
      + (label ? '<p class="pf-settings-group__label">' + escapeHtml(label) + '</p>' : '')
      + '<div class="pf-settings-list">' + rows.join('') + '</div></div>';
  }
  function pfDetailRow(name, val, act, noChev) {
    return '<button class="pf-settings-item" data-pf-detail-act="' + escapeHtml(act || '') + '"' + (act ? '' : ' disabled') + '>'
      + '<span class="pf-settings-item__main"><span class="pf-settings-item__name">' + name + '</span></span>'
      + (val ? '<span class="pf-settings-item__hint">' + escapeHtml(val) + '</span>' : '')
      + (noChev ? '' : '<span class="pf-settings-item__chev">' + IC.chev(16) + '</span>')
      + '</button>';
  }
  function pfToggleRow(name, pk, isOn) {
    return '<div class="pf-settings-item pf-settings-item--toggle">'
      + '<span class="pf-settings-item__main"><span class="pf-settings-item__name">' + escapeHtml(name) + '</span></span>'
      + '<span class="pf-toggle' + (isOn ? ' is-on' : '') + '" data-pf-toggle="' + escapeHtml(pk) + '" role="switch" aria-checked="' + isOn + '" tabindex="0">'
      + '<span class="pf-toggle__knob"></span></span></div>';
  }
  function pfChoiceRow(val, name, selected, iconHtml, attr) {
    var a = attr || 'data-pf-theme';
    return '<button class="pf-settings-item pf-settings-item--choice' + (selected ? ' is-selected' : '') + '" ' + a + '="' + escapeHtml(val) + '">'
      + '<span class="pf-settings-item__icon">' + iconHtml + '</span>'
      + '<span class="pf-settings-item__main"><span class="pf-settings-item__name">' + escapeHtml(name) + '</span></span>'
      + (selected ? '<span class="pf-settings-item__check">' + IC.checkMark(16) + '</span>' : '')
      + '</button>';
  }
  function pfAccountRow(name, color, current) {
    var initial = name.charAt(0);
    return '<button class="pf-settings-item pf-settings-item--account' + (current ? ' is-current' : '') + '" data-pf-account="' + escapeHtml(name) + '">'
      + '<span class="pf-settings-item__icon pf-account-mini" style="background:' + color + '">' + escapeHtml(initial) + '</span>'
      + '<span class="pf-settings-item__main"><span class="pf-settings-item__name">' + escapeHtml(name) + (current ? '（当前）' : '') + '</span></span>'
      + (current ? '<span class="pf-settings-item__check">' + IC.checkMark(16) + '</span>' : '')
      + '</button>';
  }

  /* ----------------------------- 渲染：列表视图（获赞/关注/粉丝/团队） ----------------------------- */

  /* 获赞列表：支持按时间 / 按笔记分组 */
  function renderLikesList() {
    var host = $('[data-pf-likes-body]');
    if (!host) return;
    var likeData = guestListCtx ? guestListCtx.likes : MOCK_PROFILE.likeUsers;
    var html = '<div class="pf-group-bar">'
      + '<button class="pf-group-btn' + (likesGroup === 'time' ? ' is-active' : '') + '" data-pf-group="time">按时间</button>'
      + '<button class="pf-group-btn' + (likesGroup === 'note' ? ' is-active' : '') + '" data-pf-group="note">按笔记</button>'
      + '</div>';
    if (likesGroup === 'time') {
      html += '<div class="pf-list pf-list--users">';
      likeData.forEach(function (u, i) {
        html += userLikeCard(u, i);
      });
      html += '</div>';
    } else {
      /* 按笔记分组 */
      var groups = {};
      var order = [];
      likeData.forEach(function (u) {
        if (!groups[u.note]) { groups[u.note] = []; order.push(u.note); }
        groups[u.note].push(u);
      });
      order.forEach(function (noteName) {
        html += '<p class="pf-group-title">' + escapeHtml(noteName) + '</p>';
        html += '<div class="pf-list pf-list--users">';
        groups[noteName].forEach(function (u, i) {
          html += userLikeCard(u, i);
        });
        html += '</div>';
      });
    }
    host.innerHTML = html;
  }

  function userLikeCard(u, i) {
    var initial = u.name.charAt(0);
    /* 获赞行：双点击区
     *   头像（button）→ 该用户主页（open-guest-profile）
     *   正文（button）→ 对应笔记详情（open-like-note）
     * 外层 div 不包 click，避免两个 button 嵌套冲突 */
    return '<div class="pf-user-item pf-user-item--like">'
      + '<button class="pf-user-avatar pf-user-avatar--tap" data-action="open-guest-profile" data-uid="' + escapeHtml(u.id) + '" style="background:' + u.avatar + '" aria-label="查看 ' + escapeHtml(u.name) + ' 的主页">' + escapeHtml(initial) + '</button>'
      + '<button class="pf-user-item__body" data-action="open-like-note" data-note-name="' + escapeHtml(u.note) + '" data-like-user="' + escapeHtml(u.name) + '" aria-label="打开笔记《' + escapeHtml(u.note) + '》">'
      +   '<span class="pf-user-name">' + escapeHtml(u.name) + '</span>'
      +   '<span class="pf-user-sub">' + escapeHtml(u.time) + ' · 赞了《' + escapeHtml(u.note) + '》</span>'
      + '</button>'
      + '<span class="pf-user-item__chev" aria-hidden="true">' + IC.chev(16) + '</span>'
      + '</div>';
  }

  /* 关注列表 */
  function renderFollowingList() {
    var host = $('[data-pf-following-body]');
    if (!host) return;
    var data = guestListCtx ? guestListCtx.following : MOCK_PROFILE.followingUsers;
    var html = '<div class="pf-list pf-list--users">';
    data.forEach(function (u, i) {
      html += followCard(u, i, 'following');
    });
    html += '</div>';
    host.innerHTML = html;
  }

  /* 粉丝列表 */
  function renderFollowersList() {
    var host = $('[data-pf-followers-body]');
    if (!host) return;
    var data = guestListCtx ? guestListCtx.followers : MOCK_PROFILE.followersUsers;
    var html = '<div class="pf-list pf-list--users">';
    data.forEach(function (u, i) {
      html += followCard(u, i, 'followers');
    });
    html += '</div>';
    host.innerHTML = html;
  }

  function followCard(u, i, type) {
    var initial = u.name.charAt(0);
    /* 关注状态统一读 isFollowing（bridge + 本地 mock 合并），不再单读 u.followed */
    var following = isFollowing(u.id);
    var btnLabel = following ? '已关注' : '关注';
    var btnCls = following ? 'pf-follow-btn is-following' : 'pf-follow-btn';
    /* action 根据当前状态：已关注→取关，未关注→关注 */
    var action = following ? 'unfollow' : 'follow';
    /* 关注/粉丝行：只有头像和关注键可点
     *   头像（button）→ 该用户主页（open-guest-profile）
     *   正文（div）→ 纯展示，不可点
     *   关注键（button）→ 独立，外层不包 click 避免覆盖 */
    return '<div class="pf-user-item pf-user-item--follow">'
      + '<button class="pf-user-avatar pf-user-avatar--tap" data-action="open-guest-profile" data-uid="' + escapeHtml(u.id) + '" style="background:' + u.avatar + '" aria-label="查看 ' + escapeHtml(u.name) + ' 的主页">' + escapeHtml(initial) + '</button>'
      + '<div class="pf-user-item__body-static">'
      +   '<span class="pf-user-name">' + escapeHtml(u.name) + '</span>'
      +   '<span class="pf-user-sub">' + escapeHtml(u.bio) + '</span>'
      + '</div>'
      + '<button class="' + btnCls + '" data-pf-follow="' + i + '" data-pf-follow-action="' + action + '">' + btnLabel + '</button>'
      + '</div>';
  }

  /* 团队列表 */
  function renderTeamsList() {
    var host = $('[data-pf-teams-body]');
    if (!host) return;
    var list = guestListCtx ? guestListCtx.teams : MOCK_PROFILE.teamsList;
    var html = '<div class="pf-list pf-list--teams">';
    list.forEach(function (t, i) {
      html += ''
        + '<div class="pf-team-item">'
        +   '<div class="pf-team-main">'
        +     '<div class="pf-team-head">'
        +       '<span class="pf-team-name">' + escapeHtml(t.name) + '</span>'
        +       '<span class="pf-team-role">' + escapeHtml(t.role) + '</span>'
        +     '</div>'
        +     '<p class="pf-team-desc">' + escapeHtml(t.desc) + '</p>'
        +     '<div class="pf-team-meta">'
        +       '<span>' + IC.team(12) + t.members + ' 人</span>'
        +       '<span>·</span>'
        +       '<span>' + escapeHtml(t.visibility) + '</span>'
        +     '</div>'
        +   '</div>'
        +   '<button class="pf-team-view" data-pf-team-view="' + i + '">查看</button>'
        + '</div>';
    });
    html += '</div>';
    host.innerHTML = html;
  }

  /* ----------------------------- 渲染：标签添加视图 ----------------------------- */
  function renderTagAdd() {
    var host = $('[data-pf-tag-add-body]');
    if (!host) return;
    var userTags = MOCK_PROFILE.tags.user;
    var html = '<div class="pf-tag-add">';
    /* 已选标签预览 */
    html += '<div class="pf-tag-add__selected">'
      + '<p class="pf-tag-add__label">已选标签</p>'
      + '<div class="pf-tag-add__chips">';
    if (userTags.length) {
      userTags.forEach(function (t, i) {
        html += '<span class="pf-tag" data-pf-tag-idx="' + i + '">'
          + escapeHtml(t)
          + '<button class="pf-tag__x" data-pf-tag-remove="' + i + '" aria-label="删除标签 ' + escapeHtml(t) + '">×</button>'
          + '</span>';
      });
    } else {
      html += '<span class="pf-tag-add__empty">还没有添加标签</span>';
    }
    html += '</div></div>';
    /* 分类 tab + 标签 */
    html += '<div class="pf-tag-add__tabs" role="tablist">';
    MOCK_PROFILE.tags.preset.forEach(function (g, i) {
      var cls = i === 0 ? 'pf-tag-cat is-active' : 'pf-tag-cat';
      html += '<button class="' + cls + '" data-pf-tag-cat="' + i + '" role="tab">' + escapeHtml(g.category) + '</button>';
    });
    html += '</div>';
    /* 第一个分类的标签 */
    html += '<div class="pf-tag-add__body" data-pf-tag-add-body-inner>';
    html += renderTagCategory(0);
    html += '</div>';
    /* 自定义输入 */
    html += '<div class="pf-tag-add__custom">'
      + '<input class="pf-tag-add__input" type="text" placeholder="自定义标签…" data-pf-tag-input maxlength="12">'
      + '<button class="pf-tag-add__confirm" data-pf-tag-confirm>添加</button>'
      + '</div>';
    html += '</div>';
    host.innerHTML = html;
  }

  function renderTagCategory(idx) {
    var g = MOCK_PROFILE.tags.preset[idx];
    if (!g) return '';
    var userTags = MOCK_PROFILE.tags.user;
    var html = '<div class="pf-tag-add__group">'
      + '<p class="pf-tag-add__cat-label">' + escapeHtml(g.category) + '</p>'
      + '<div class="pf-tag-add__items">';
    g.items.forEach(function (item) {
      var selected = userTags.indexOf(item) >= 0;
      var cls = selected ? 'pf-tag-preset is-selected' : 'pf-tag-preset';
      html += '<button class="' + cls + '" data-pf-tag-preset="' + escapeHtml(item) + '"' + (selected ? ' disabled' : '') + '>' + escapeHtml(item) + '</button>';
    });
    html += '</div></div>';
    return html;
  }

  /* ----------------------------- 交互 ----------------------------- */
  /* 视图切换：main 始终保持 is-on 作为底层，子视图从右滑入覆盖 */
  function switchView(name) {
    currentPfView = name;
    $all('[data-pf-view]').forEach(function (v) {
      var vname = v.getAttribute('data-pf-view');
      if (vname === 'main') {
        /* main 始终保持 is-on 作为底层 */
        v.classList.add('is-on');
      } else {
        v.classList.toggle('is-on', vname === name);
      }
    });
    var root = $('[data-pf-root]');
    if (root) root.classList.toggle('is-sub', name !== 'main');
    /* 获赞/关注/粉丝/团队/标签添加/设置 全屏视图：真全屏（隐顶栏 + 底栏，仅留自身返回箭头） */
    var FULLSCREEN_VIEWS = { 'likes-list': 1, 'following-list': 1, 'followers-list': 1, 'teams-list': 1, 'tag-add': 1, 'settings': 1, 'account-info': 1 };
    document.body.classList.toggle('is-pf-list-open', !!FULLSCREEN_VIEWS[name]);
    /* 渲染对应视图内容 */
    /* 访客列表：标题加对方名字前缀（如"江月的关注"） */
    if (guestListCtx) {
      var vn = name.replace('-list', '');
      var labelZh = { likes: '获赞', following: '关注', followers: '粉丝', teams: '团队' }[vn];
      var view = $('[data-pf-view="' + name + '"]');
      if (view) {
        var ttl = view.querySelector('.pf-list-title');
        if (ttl && labelZh) ttl.textContent = (guestListCtx.name || 'TA') + ' 的' + labelZh;
      }
    }
    switch (name) {
      case 'likes-list': renderLikesList(); break;
      case 'following-list': renderFollowingList(); break;
      case 'followers-list': renderFollowersList(); break;
      case 'teams-list': renderTeamsList(); break;
      case 'tag-add': renderTagAdd(); break;
      case 'settings': renderSettings(); break;
      case 'account-info': renderAccountInfo(); break;
    }
  }

  /* 账户信息详情页：比个人主页更细致的数据展示 */
  function openAccountInfo() { switchView('account-info'); }
  function renderAccountInfo() {
    var host = $('[data-pf-account-body]');
    if (!host) return;
    var u = MOCK_PROFILE.user;
    var social = currentSocial();
    var byKey = {};
    social.forEach(function (s) { byKey[s.key] = s.num; });
    var worksCount = (MOCK_PROFILE.works) ? MOCK_PROFILE.works.length : 12;
    var favCount = (MOCK_PROFILE.favorites) ? MOCK_PROFILE.favorites.length : 8;

    var html = '';
    /* 顶部用户大卡 */
    html += '<div class="pf-acc-hero">'
      + '<div class="pf-acc-hero__ava" style="background:' + (u.avatarColor || '#6B655C') + '">' + escapeHtml(u.initials || u.name) + '</div>'
      + '<div class="pf-acc-hero__main">'
      +   '<h2 class="pf-acc-hero__name">' + escapeHtml(u.name) + '</h2>'
      +   '<span class="pf-acc-hero__level">Lv.' + (u.level || 50) + '</span>'
      +   '<p class="pf-acc-hero__motto">' + escapeHtml(u.motto || '你还没设置格言') + '</p>'
      + '</div></div>';

    /* 数据总览网格 */
    html += '<div class="pf-settings-group"><p class="pf-settings-group__label">数据总览</p>'
      + '<div class="pf-acc-grid">'
      + accStatCell(worksCount, '作品')
      + accStatCell(byKey.likes || 0, '获赞')
      + accStatCell(byKey.following || 0, '关注')
      + accStatCell(byKey.followers || 0, '粉丝')
      + accStatCell(favCount, '收藏')
      + accStatCell(byKey.teams || 0, '团队')
      + '</div></div>';

    /* 账户信息行 */
    html += '<div class="pf-settings-group"><p class="pf-settings-group__label">账户信息</p><div class="pf-settings-list">'
      + pfDetailRow('用户 ID', u.id || 'u-me', null)
      + pfDetailRow('等级', 'Lv.' + (u.level || 50), null)
      + pfDetailRow('加入时间', '2024-03-15', null)
      + pfDetailRow('所在地', '上海', null)
      + pfDetailRow('连续打卡', '47 天', null)
      + '</div></div>';

    /* 近期活跃 */
    html += '<div class="pf-settings-group"><p class="pf-settings-group__label">近期活跃</p><div class="pf-settings-list">'
      + pfDetailRow('本周发布', '3 篇', null)
      + pfDetailRow('本月获赞', '+128', null)
      + pfDetailRow('新增粉丝', '+12', null)
      + '</div></div>';

    host.innerHTML = html;
  }
  function accStatCell(num, label) {
    return '<div class="pf-acc-stat">'
      + '<span class="pf-acc-stat__num">' + escapeHtml(formatK(num)) + '</span>'
      + '<span class="pf-acc-stat__label">' + escapeHtml(label) + '</span>'
      + '</div>';
  }

  /* 设置详情：settingsDetailKey 为 null 显示列表，否则显示对应详情 */
  /* 主题模式：light / dark / auto（auto = 跟随系统偏好） */
  var themeMode = 'light';
  function applyThemeMode() {
    var dark = themeMode === 'dark' || (themeMode === 'auto' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.body.classList.toggle('zx-theme-dark', dark);
  }

  var settingsDetailKey = null;
  var settingsDetailParent = null;  /* 二级详情父级（如 export-notes → privacy），返回时回到父级 */
  function openSettingsDetail(key, parent) {
    settingsDetailParent = parent || null;
    settingsDetailKey = key;
    renderSettings();
  }
  function closeSettingsDetail() {
    if (settingsDetailParent) {
      var p = settingsDetailParent; settingsDetailParent = null;
      settingsDetailKey = p;
      renderSettings();
    } else {
      settingsDetailKey = null;
      settingsDetailParent = null;
      renderSettings();
    }
  }

  function openSettings() { switchView('settings'); }
  function closeSettings() { switchView('main'); }

  function toast(msg) {
    var t = $('[data-pf-toast]');
    if (!t) return;
    t.innerHTML = '<span class="pf-toast__ico">' + IC.spark(14) + '</span>' + escapeHtml(msg);
    t.classList.add('is-show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('is-show'); }, 1800);
  }

  /* 账号设置二级操作面板（底部 sheet）：title + 当前值 + 操作项列表 */
  function showAccSheet(title, value, actions) {
    closeAccSheet();
    var sheet = document.createElement('div');
    sheet.className = 'pf-acc-sheet';
    sheet.setAttribute('data-pf-acc-sheet', '');
    var html = '<div class="pf-acc-sheet__overlay" data-pf-acc-sheet-close></div>'
      + '<div class="pf-acc-sheet__card" role="dialog" aria-modal="true" aria-label="' + escapeHtml(title) + '">'
      +   '<div class="pf-acc-sheet__head">'
      +     '<span class="pf-acc-sheet__title">' + escapeHtml(title) + '</span>'
      +     '<span class="pf-acc-sheet__value">' + escapeHtml(value) + '</span>'
      +   '</div>'
      +   '<div class="pf-acc-sheet__list">';
    actions.forEach(function (a) {
      html += '<button class="pf-acc-sheet__item" data-pf-acc-act="' + escapeHtml(a) + '">' + escapeHtml(a) + '</button>';
    });
    html += '</div></div>';
    sheet.innerHTML = html;
    /* 加到 .zx-phone（整个手机外壳），使 absolute inset:0 铺满全屏并盖住底栏 */
    var phone = document.querySelector('.zx-phone') || document.body;
    phone.appendChild(sheet);
    bindSheetClick(sheet);
  }
  function closeAccSheet() {
    var s = $('[data-pf-acc-sheet]');
    if (s) s.parentNode.removeChild(s);
  }

  /* sheet 加到 .zx-phone（root 外），delegate(root) 收不到点击，
   * 所以给每个 sheet 元素单独绑监听处理内部操作。 */
  function bindSheetClick(el) {
    el.addEventListener('click', function (e) {
      var n;
      if ((n = e.target.closest('[data-pf-acc-sheet-close]'))) { closeAccSheet(); return; }
      if ((n = e.target.closest('[data-pf-acc-act]'))) {
        var aa = n.getAttribute('data-pf-acc-act');
        closeAccSheet();
        toast(aa + '（demo）');
        return;
      }
      if ((n = e.target.closest('[data-pf-motto-cancel]'))) { closeMottoEditor(); return; }
      if ((n = e.target.closest('[data-pf-motto-save]'))) { saveMotto(); return; }
    });
  }

  /* ===== 导出笔记：选择状态 + 渲染 ===== */
  var exportSelection = {};
  function getMockNotes() {
    return (window.ZX_MOCK && window.ZX_MOCK.notes)
      || (window.ZX && window.ZX.mock && window.ZX.mock.notes) || [];
  }
  function renderExportNotes() {
    var notes = getMockNotes();
    var html = '<div class="pf-export">'
      + '<div class="pf-export__hint">选择要导出的笔记，确认后打包下载（Markdown）</div>'
      + '<div class="pf-export__list">';
    if (!notes.length) {
      html += '<div class="pf-empty">暂无笔记</div>';
    } else {
      notes.forEach(function (n) {
        var sel = !!exportSelection[n.id];
        html += '<button class="pf-export__item' + (sel ? ' is-selected' : '') + '" data-pf-export-note="' + escapeHtml(n.id) + '">'
          + '<span class="pf-export__check">' + (sel ? IC.checkMark(16) : '') + '</span>'
          + '<span class="pf-export__title">' + escapeHtml(n.title) + '</span>'
          + '</button>';
      });
    }
    html += '</div>';
    var count = Object.keys(exportSelection).length;
    var allSel = notes.length > 0 && count === notes.length;
    html += '<div class="pf-export__bar">'
      + '<button class="pf-export__all" data-pf-export-all>' + (allSel ? '取消全选' : '全选') + '</button>'
      + '<button class="pf-export__go" data-pf-export-go' + (count ? '' : ' disabled') + '>导出 ' + count + ' 篇</button>'
      + '</div></div>';
    return html;
  }

  /* ===== 通用选择面板（底部 sheet，单选，高亮当前值） ===== */
  function showChoiceSheet(title, options, currentVal, onSelect) {
    closeAccSheet();
    var old = $('[data-pf-choice-sheet]'); if (old) old.parentNode.removeChild(old);
    var sheet = document.createElement('div');
    sheet.className = 'pf-acc-sheet';
    sheet.setAttribute('data-pf-choice-sheet', '');
    var html = '<div class="pf-acc-sheet__overlay" data-pf-choice-close></div>'
      + '<div class="pf-acc-sheet__card" role="dialog" aria-modal="true" aria-label="' + escapeHtml(title) + '">'
      +   '<div class="pf-acc-sheet__head"><span class="pf-acc-sheet__title">' + escapeHtml(title) + '</span></div>'
      +   '<div class="pf-acc-sheet__list">';
    options.forEach(function (opt) {
      var sel = opt.value === currentVal;
      html += '<button class="pf-choice-row' + (sel ? ' is-selected' : '') + '" data-pf-choice="' + escapeHtml(opt.value) + '">'
        + '<span class="pf-choice-row__name">' + escapeHtml(opt.label) + '</span>'
        + (sel ? '<span class="pf-choice-row__check">' + IC.checkMark(16) + '</span>' : '')
        + '</button>';
    });
    html += '</div></div>';
    sheet.innerHTML = html;
    var phone = document.querySelector('.zx-phone') || document.body;
    phone.appendChild(sheet);
    sheet.addEventListener('click', function (e) {
      var n;
      if ((n = e.target.closest('[data-pf-choice-close]'))) { sheet.parentNode.removeChild(sheet); return; }
      if ((n = e.target.closest('[data-pf-choice]'))) {
        var v = n.getAttribute('data-pf-choice');
        sheet.parentNode.removeChild(sheet);
        if (typeof onSelect === 'function') onSelect(v);
      }
    });
  }

  /* ===== 分组多选面板（指定分组可见范围，联动好友分组） ===== */
  function showGroupPicker(onConfirm) {
    closeAccSheet();
    var old = $('[data-pf-group-sheet]'); if (old) old.parentNode.removeChild(old);
    var groups = (window.ZX_FRIENDS && window.ZX_FRIENDS.state && window.ZX_FRIENDS.state.groups) || [
      { id: 'g-academic', name: '学界朋友' },
      { id: 'g-colleague', name: '同事' },
      { id: 'g-study', name: '研习社' }
    ];
    var selected = {};
    var sheet = document.createElement('div');
    sheet.className = 'pf-acc-sheet';
    sheet.setAttribute('data-pf-group-sheet', '');
    function render() {
      var html = '<div class="pf-acc-sheet__overlay" data-pf-group-close></div>'
        + '<div class="pf-acc-sheet__card" role="dialog" aria-modal="true" aria-label="指定分组">'
        +   '<div class="pf-acc-sheet__head"><span class="pf-acc-sheet__title">指定分组</span><span class="pf-acc-sheet__value">选择可见的分组</span></div>'
        +   '<div class="pf-acc-sheet__list">';
      groups.forEach(function (g) {
        var sel = !!selected[g.id];
        html += '<button class="pf-choice-row' + (sel ? ' is-selected' : '') + '" data-pf-group="' + escapeHtml(g.id) + '">'
          + '<span class="pf-choice-row__name">' + escapeHtml(g.name) + '</span>'
          + '<span class="pf-choice-row__check">' + (sel ? IC.checkMark(16) : '') + '</span>'
          + '</button>';
      });
      html += '</div>';
      var count = Object.keys(selected).length;
      html += '<div class="pf-group-bar"><button class="pf-group-bar__go" data-pf-group-confirm' + (count ? '' : ' disabled') + '>确定' + (count ? '（' + count + '）' : '') + '</button></div>';
      html += '</div>';
      sheet.innerHTML = html;
    }
    render();
    var phone = document.querySelector('.zx-phone') || document.body;
    phone.appendChild(sheet);
    sheet.addEventListener('click', function (e) {
      var n;
      if ((n = e.target.closest('[data-pf-group-close]'))) { sheet.parentNode.removeChild(sheet); return; }
      if ((n = e.target.closest('[data-pf-group]'))) {
        var gid = n.getAttribute('data-pf-group');
        if (selected[gid]) delete selected[gid]; else selected[gid] = true;
        render();
        return;
      }
      if ((n = e.target.closest('[data-pf-group-confirm]'))) {
        if (n.disabled) return;
        var ids = Object.keys(selected);
        sheet.parentNode.removeChild(sheet);
        if (typeof onConfirm === 'function') onConfirm(ids);
      }
    });
  }

  /* ===== 确认对话框（居中模态，用于注销账号等破坏性操作） ===== */
  function showConfirmModal(opts) {
    var old = $('[data-pf-confirm]'); if (old) old.parentNode.removeChild(old);
    var modal = document.createElement('div');
    modal.className = 'pf-confirm';
    modal.setAttribute('data-pf-confirm', '');
    var html = '<div class="pf-confirm__overlay" data-pf-confirm-cancel></div>'
      + '<div class="pf-confirm__card" role="dialog" aria-modal="true" aria-label="' + escapeHtml(opts.title) + '">'
      +   '<div class="pf-confirm__icon">' + (opts.icon || IC.info(28)) + '</div>'
      +   '<h3 class="pf-confirm__title">' + escapeHtml(opts.title) + '</h3>'
      +   '<p class="pf-confirm__desc">' + escapeHtml(opts.desc) + '</p>'
      +   '<div class="pf-confirm__actions">'
      +     '<button class="pf-confirm__btn pf-confirm__btn--cancel" data-pf-confirm-cancel>' + escapeHtml(opts.cancelText || '取消') + '</button>'
      +     '<button class="pf-confirm__btn pf-confirm__btn--danger" data-pf-confirm-ok>' + escapeHtml(opts.okText || '确认') + '</button>'
      +   '</div>'
      + '</div>';
    modal.innerHTML = html;
    var phone = document.querySelector('.zx-phone') || document.body;
    phone.appendChild(modal);
    modal.addEventListener('click', function (e) {
      var n;
      if ((n = e.target.closest('[data-pf-confirm-cancel]'))) { modal.parentNode.removeChild(modal); return; }
      if ((n = e.target.closest('[data-pf-confirm-ok]'))) {
        modal.parentNode.removeChild(modal);
        if (typeof opts.onOk === 'function') opts.onOk();
      }
    });
  }

  /* 格言内联编辑器：底部弹框 + 文本输入框，确认后保存 */
  function openMottoEditor() {
    closeMottoEditor();
    var cur = MOCK_PROFILE.user.motto || '';
    var editor = document.createElement('div');
    editor.className = 'pf-acc-sheet';
    editor.setAttribute('data-pf-motto-sheet', '');
    editor.innerHTML = ''
      + '<div class="pf-acc-sheet__overlay" data-pf-motto-cancel></div>'
      + '<div class="pf-acc-sheet__card" role="dialog" aria-modal="true" aria-label="编辑格言">'
      +   '<div class="pf-acc-sheet__head">'
      +     '<span class="pf-acc-sheet__title">编辑格言</span>'
      +     '<span class="pf-acc-sheet__value">一句话介绍你自己</span>'
      +   '</div>'
      +   '<div class="pf-motto-input-wrap">'
      +     '<textarea class="pf-motto-input" data-pf-motto-input maxlength="60" placeholder="例如：正在拆解固态电池这条主线">' + escapeHtml(cur) + '</textarea>'
      +     '<span class="pf-motto-input__count" data-pf-motto-count>' + cur.length + '/60</span>'
      +   '</div>'
      +   '<div class="pf-motto-input-actions">'
      +     '<button class="pf-detail-btn pf-detail-btn--ghost" data-pf-motto-cancel>取消</button>'
      +     '<button class="pf-detail-btn" data-pf-motto-save>保存</button>'
      +   '</div>'
      + '</div>';
    /* 加到 .zx-phone（整个手机外壳，含底栏），确保 absolute inset:0 铺满全屏并盖住底栏。
     * 不能加到 [data-pf-root]：root 仅占 tabbar 上方，会导致面板与底栏重叠。 */
    var phone = document.querySelector('.zx-phone') || document.body;
    phone.appendChild(editor);
    bindSheetClick(editor);
    /* 自动聚焦 + 实时字数 */
    setTimeout(function () {
      var inp = $('[data-pf-motto-input]');
      if (inp) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }
    }, 100);
    var inp = $('[data-pf-motto-input]');
    if (inp) {
      inp.addEventListener('input', function () {
        var c = $('[data-pf-motto-count]');
        if (c) c.textContent = inp.value.length + '/60';
      });
    }
  }
  function closeMottoEditor() {
    var s = $('[data-pf-motto-sheet]');
    if (s) s.parentNode.removeChild(s);
  }
  function saveMotto() {
    var inp = $('[data-pf-motto-input]');
    if (!inp) return;
    var val = (inp.value || '').trim();
    MOCK_PROFILE.user.motto = val;
    closeMottoEditor();
    renderHero();
    toast(val ? '格言已更新' : '格言已清空');
  }

  function settingName(key) {
    if (key === 'export-notes') return '导出笔记';
    var name = key;
    MOCK_PROFILE.settings.forEach(function (g) {
      g.items.forEach(function (it) { if (it.key === key) name = it.name; });
    });
    return name;
  }

  /* 跳转到好友页团队详情（跨 tab 闭环） */
  function gotoFriendsTeams() {
    if (window.ZX_BRIDGE && typeof window.ZX_BRIDGE.switchTab === 'function') {
      window.ZX_BRIDGE.switchTab('friends');
    } else if (window.ZX && typeof window.ZX.switchTab === 'function') {
      window.ZX.switchTab('friends');
    } else {
      /* 兜底：直接触发底部 tab 点击 */
      var tab = document.querySelector('[data-tab="friends"]');
      if (tab) tab.click();
    }
    toast('已跳转好友页，团队详情在那里');
  }

  /* 顶栏事件委托（处理在 [data-pf-root] 之外的按钮：menu / back-to-self / settings / settings-close） */
  function delegateTopbar(scope) {
    scope.addEventListener('click', function (e) {
      var node;
      /* menu 已由全局 drawer.js 接管（capture 阶段），此处不再处理 */
      if ((node = e.target.closest('[data-action="back-to-self"]'))) { viewSelf(); return; }
      if ((node = e.target.closest('[data-action="settings"]'))) { openSettings(); return; }
      if ((node = e.target.closest('[data-action="toggle-follow-guest"]'))) { toggleGuestFollow(); return; }
      if ((node = e.target.closest('[data-pf-settings-close]'))) {
        /* 详情模式 → 回列表；列表模式 → 回主页 */
        if (settingsDetailKey) { closeSettingsDetail(); } else { closeSettings(); }
        return;
      }
    });
  }

  function delegate(root) {
    root.addEventListener('click', function (e) {
      var node;
      /* 这里只处理位于 root 内的 settings-close 按钮：详情模式回列表，列表模式回主页。
       * stopPropagation 阻止冒泡到 delegateTopbar(page) 重复处理（否则 root 先清 settingsDetailKey，
       * page 再看到 null 就 closeSettings 回主页，导致详情返回出错） */
      if ((node = e.target.closest('[data-pf-settings-close]'))) {
        if (settingsDetailKey) { closeSettingsDetail(); } else { closeSettings(); }
        e.stopPropagation();
        return;
      }

      /* 列表视图返回按钮 */
      if ((node = e.target.closest('[data-pf-list-back]'))) {
        /* 访客列表返回：清掉上下文 + 还原标题，回到访客主页（main，is-pf-guest-open 仍在） */
        if (guestListCtx) {
          guestListCtx = null;
          $all('.pf-view--list .pf-list-title').forEach(function (t, idx) {
            var def = ['获赞', '关注', '粉丝', '团队', '添加标签'][idx];
            if (def) t.textContent = def;
          });
        }
        switchView('main');
        return;
      }

      /* 获赞/关注/粉丝列表：点头像或整行 → 查看该用户主页（本 tab 内访客视角）。
       * 注意：capture 兜底监听已抢先处理并 stopPropagation，此处通常不再触发，
       * 但保留逻辑作为双保险（若 capture 未注册，此处仍可正确收列表）。 */
      if ((node = e.target.closest('[data-action="open-guest-profile"]'))) {
        var guestUid = node.getAttribute('data-uid');
        if (guestUid) {
          /* 若在任何社交列表视图（自己的或访客的）中，switchView('main') 收起列表，
           * 否则列表 is-on 仍显示，会盖住访客主页，看起来像没跳转 */
          var inLV = ['likes-list', 'following-list', 'followers-list', 'teams-list'].indexOf(currentPfView) >= 0;
          if (inLV) {
            if (guestListCtx) {
              guestListCtx = null;
              $all('.pf-view--list .pf-list-title').forEach(function (t, idx) {
                var def = ['获赞', '关注', '粉丝', '团队', '添加标签'][idx];
                if (def) t.textContent = def;
              });
            }
            switchView('main');
          }
          viewUser(guestUid, 'profile');
        }
        return;
      }
      /* 获赞列表：点正文（非头像）→ 打开对应笔记详情（demo toast） */
      if ((node = e.target.closest('[data-action="open-like-note"]'))) {
        var noteName = node.getAttribute('data-note-name') || '';
        var likeUser = node.getAttribute('data-like-user') || '';
        toast('打开笔记《' + noteName + '》' + (likeUser ? '（' + likeUser + ' 赞过）' : '') + '（demo）');
        return;
      }

      /* 格言编辑：弹出内联输入框，确认后保存并重渲 */
      if ((node = e.target.closest('[data-pf-motto-edit]'))) {
        e.preventDefault();
        e.stopPropagation();
        openMottoEditor();
        return;
      }

      /* 社交按钮：点击进入对应列表视图 */
      if ((node = e.target.closest('[data-pf-social]'))) {
        var sk = node.getAttribute('data-pf-social');
        /* 访客视角：进入"对方的"列表（数据用 buildGuestListData 差异化生成） */
        if (viewingUserId) {
          var built = buildGuestListData(viewingUserId);
          guestListCtx = { uid: viewingUserId, name: MOCK_PROFILE.user.name || '该用户',
            likes: built.likes, following: built.following, followers: built.followers, teams: built.teams };
          var vmap2 = { likes: 'likes-list', following: 'following-list', followers: 'followers-list', teams: 'teams-list' };
          if (vmap2[sk]) switchView(vmap2[sk]);
          return;
        }
        var viewMap = {
          likes: 'likes-list',
          following: 'following-list',
          followers: 'followers-list',
          teams: 'teams-list'
        };
        if (viewMap[sk]) { switchView(viewMap[sk]); }
        return;
      }

      /* "+"按钮：进入标签添加全屏页面（与获赞/关注/粉丝/团队列表同款） */
      if ((node = e.target.closest('[data-pf-tag-add]'))) {
        switchView('tag-add');
        return;
      }
      /* 删除已选标签（主视图、标签添加视图共用） */
      if ((node = e.target.closest('[data-pf-tag-remove]'))) {
        var rmIdx = +node.getAttribute('data-pf-tag-remove');
        removeTagByIdx(rmIdx);
        var tagAddView = $('[data-pf-view="tag-add"]');
        if (tagAddView && tagAddView.classList.contains('is-on')) {
          renderTagAdd();
        } else {
          renderTags();
        }
        return;
      }
      /* 选择预设标签（标签添加视图内） */
      if ((node = e.target.closest('[data-pf-tag-preset]'))) {
        var presetTag = node.getAttribute('data-pf-tag-preset');
        if (addTag(presetTag)) {
          renderTagAdd();
          toast('已添加「' + presetTag + '」');
        }
        return;
      }
      /* 自定义标签添加（标签添加视图内） */
      if ((node = e.target.closest('[data-pf-tag-confirm]'))) {
        var input = $('[data-pf-tag-input]');
        if (input && addTag(input.value)) {
          renderTagAdd();
          toast('已添加「' + input.value.trim() + '」');
        } else if (input) {
          toast('标签为空或已存在');
        }
        return;
      }
      /* 标签分类 tab 切换（标签添加视图内） */
      if ((node = e.target.closest('[data-pf-tag-cat]'))) {
        var catIdx = +node.getAttribute('data-pf-tag-cat');
        $all('[data-pf-tag-cat]').forEach(function (b) { b.classList.remove('is-active'); });
        node.classList.add('is-active');
        var body = $('[data-pf-tag-add-body-inner]');
        if (body) body.innerHTML = renderTagCategory(catIdx);
        return;
      }

      /* Tab 切换 */
      /* 主 tab 切换：切 active class + 重新渲染 body（保留小锁等渲染细节） */
      if ((node = e.target.closest('[data-pf-tab]'))) {
        activeTab = node.getAttribute('data-pf-tab');
        activeCollectionIdx = -1;
        activeFavCollectionIdx = -1;
        renderTabs();
        return;
      }

      /* 作品筛选：切换下拉菜单开/关 */
      if ((node = e.target.closest('[data-pf-filter-toggle]'))) {
        worksFilterOpen = !worksFilterOpen;
        renderTabBody();
        return;
      }
      /* 作品筛选：选择某个分类 */
      if ((node = e.target.closest('[data-pf-filter]'))) {
        worksSubTab = node.getAttribute('data-pf-filter');
        worksFilterOpen = false;
        activeCollectionIdx = -1;
        renderTabBody();
        return;
      }
      /* 兼容旧的 data-pf-subtab（已弃用） */
      if ((node = e.target.closest('[data-pf-subtab]'))) {
        worksSubTab = node.getAttribute('data-pf-subtab');
        activeCollectionIdx = -1;
        renderTabBody();
        return;
      }
      /* 文件夹详情排序按钮 */
      if ((node = e.target.closest('[data-pf-coll-sort]'))) {
        collectionSort = node.getAttribute('data-pf-coll-sort');
        renderTabBody();
        return;
      }
      /* 作品编辑入口 */
      if ((node = e.target.closest('[data-pf-work-edit]'))) {
        toast('作品管理（demo）');
        return;
      }

      /* 文件夹点击 → 进入文件夹详情 */
      if ((node = e.target.closest('[data-pf-folder]'))) {
        activeCollectionIdx = +node.getAttribute('data-pf-folder');
        renderTabBody();
        return;
      }
      /* 文件夹详情返回 */
      if ((node = e.target.closest('[data-pf-folder-back]'))) {
        activeCollectionIdx = -1;
        renderTabBody();
        return;
      }

      /* 笔记 / 智能体 / 工作流 卡片点击 */
      if ((node = e.target.closest('[data-pf-note]'))) {
        var noteId = node.getAttribute('data-pf-note-id');
        if (noteId && window.ZX_BRIDGE && window.ZX_BRIDGE.openNoteInEditor) {
          window.ZX_BRIDGE.openNoteInEditor(noteId);
        } else {
          toast('打开笔记（demo）');
        }
        return;
      }
      if ((node = e.target.closest('[data-pf-agent]'))) {
        var ai = +node.getAttribute('data-pf-agent');
        var agent = MOCK_PROFILE.worksV2.agents[ai];
        toast('打开智能体「' + agent.name + '」');
        return;
      }
      if ((node = e.target.closest('[data-pf-workflow]'))) {
        var wfi = +node.getAttribute('data-pf-workflow');
        var wf = MOCK_PROFILE.worksV2.workflows[wfi];
        toast('触发工作流「' + wf.name + '」');
        return;
      }

      /* 收藏夹点击 */
      /* 收藏夹卡片：点击进入收藏夹详情 */
      if ((node = e.target.closest('[data-pf-fav-folder]'))) {
        activeFavCollectionIdx = +node.getAttribute('data-pf-fav-folder');
        renderTabBody();
        return;
      }
      /* 收藏夹详情返回 */
      if ((node = e.target.closest('[data-pf-fav-folder-back]'))) {
        activeFavCollectionIdx = -1;
        renderTabBody();
        return;
      }

      /* 兼容旧的 data-pf-collection（已弃用，统一改用 data-pf-fav-folder） */
      if ((node = e.target.closest('[data-pf-collection]'))) {
        var ci = +node.getAttribute('data-pf-collection');
        var coll = MOCK_PROFILE.collections[ci];
        toast('打开收藏夹「' + coll.name + '」（demo）');
        return;
      }

      /* 收藏 / 评论 / 点赞 列表项点击 */
      if ((node = e.target.closest('[data-pf-fav],[data-pf-comment],[data-pf-like]'))) {
        toast('打开详情（demo）');
        return;
      }

      /* 获赞列表分组切换 */
      if ((node = e.target.closest('[data-pf-group]'))) {
        likesGroup = node.getAttribute('data-pf-group');
        renderLikesList();
        return;
      }

      /* 关注/粉丝列表：关注/取关/回关按钮（统一走 setFollow，与访客主页同步） */
      if ((node = e.target.closest('[data-pf-follow]'))) {
        var fi = +node.getAttribute('data-pf-follow');
        var faction = node.getAttribute('data-pf-follow-action');
        /* 判断当前在哪个列表 */
        var followingView = $('[data-pf-view="following-list"]');
        var list = (followingView && followingView.classList.contains('is-on'))
          ? MOCK_PROFILE.followingUsers
          : MOCK_PROFILE.followersUsers;
        if (list[fi]) {
          /* setFollow 同步 bridge + 本地 mock，访客主页/好友页都能感知 */
          setFollow(list[fi].id, faction !== 'unfollow');
          toast(faction === 'unfollow' ? '已取关' : '已关注');
          /* 重新渲染当前列表 */
          if (followingView && followingView.classList.contains('is-on')) {
            renderFollowingList();
          } else {
            renderFollowersList();
          }
        }
        return;
      }

      /* 团队列表：查看按钮 → 自己的团队跳转聊天，他人的团队只能跳转详情页 */
      if ((node = e.target.closest('[data-pf-team-view]'))) {
        var ti = +node.getAttribute('data-pf-team-view');
        var team = MOCK_PROFILE.teamsList[ti];
        if (team && team.id) {
          /* 切换到好友 tab */
          if (window.ZX_BRIDGE && typeof window.ZX_BRIDGE.switchTab === 'function') {
            window.ZX_BRIDGE.switchTab('friends');
          } else if (window.ZX && typeof window.ZX.switchTab === 'function') {
            window.ZX.switchTab('friends');
          }
          if (guestListCtx) {
            /* 他人团队：只能跳转详情页，不能进入群内 */
            if (window.ZX_FRIENDS && typeof window.ZX_FRIENDS.openInfo === 'function') {
              setTimeout(function () { window.ZX_FRIENDS.openInfo('team', team.id); }, 100);
            } else {
              toast('查看「' + team.name + '」团队详情');
            }
          } else {
            /* 自己的团队：直接进入团队聊天 */
            if (window.ZX_FRIENDS && typeof window.ZX_FRIENDS.openTeamChat === 'function') {
              setTimeout(function () { window.ZX_FRIENDS.openTeamChat(team.id); }, 100);
            } else {
              toast('跳转到「' + team.name + '」团队聊天');
            }
          }
        } else {
          toast('查看「' + (team ? team.name : '团队') + '」（demo）');
        }
        return;
      }

      /* 隐私设置 toggle 开关：改动后刷新 settings 和主页 tabs（更新小锁） */
      if ((node = e.target.closest('[data-pf-toggle]'))) {
        var pk = node.getAttribute('data-pf-toggle');
        if (MOCK_PROFILE.privacy.hasOwnProperty(pk)) {
          /* 隐私类 toggle：写 mock + 刷新 tabs 小锁 */
          MOCK_PROFILE.privacy[pk] = !MOCK_PROFILE.privacy[pk];
          renderSettings();
          renderTabs();
          toast(MOCK_PROFILE.privacy[pk] ? '已公开' : '已设为私密');
        } else {
          /* 通知等其他 toggle：本地翻转 + 重渲（demo 无持久态） */
          var wasOn = node.classList.contains('is-on');
          node.classList.toggle('is-on', !wasOn);
          node.setAttribute('aria-checked', String(!wasOn));
          toast(wasOn ? '已关闭' : '已开启');
        }
        return;
      }

      /* 设置项：有详情的进详情页，其余特殊处理 */
      if ((node = e.target.closest('[data-pf-setting]'))) {
        var key = node.getAttribute('data-pf-setting');
        if (key === 'logout') { toast('已退出登录（demo）'); return; }
        /* account/notification/privacy/theme/switch-account/about 进详情页 */
        if (['account', 'notification', 'privacy', 'theme', 'switch-account', 'about'].indexOf(key) >= 0) {
          openSettingsDetail(key); return;
        }
        toast('打开「' + settingName(key) + '」（demo）');
        return;
      }
      /* 详情页内：详情行点击 */
      if ((node = e.target.closest('[data-pf-detail-act]'))) {
        var dact = node.getAttribute('data-pf-detail-act');
        if (!dact || dact === 'null') return;
        /* 账号设置三项：手机号/邮箱/密码 → 二级操作面板 */
        if (dact === 'account-phone') { showAccSheet('手机号', '138 **** 6688', ['更换手机号', '解绑手机号']); return; }
        if (dact === 'account-email') { showAccSheet('邮箱', 'me@zhixing.app', ['修改邮箱', '解绑邮箱']); return; }
        if (dact === 'account-pwd') { showAccSheet('登录密码', '已设置', ['修改密码', '找回密码']); return; }
        /* 社交授权：弹出单选面板（联动好友可见度语义） */
        if (dact === 'social-addFriend' || dact === 'social-mention' || dact === 'social-message') {
          var skey = dact.replace('social-', '');
          var sLabels = { addFriend: '谁可以加好友', mention: '谁可以 @ 我', message: '谁可以私信' };
          var sScopeName = { all: '所有人', friends: '仅好友', nobody: '不允许' };
          showChoiceSheet(sLabels[skey], [
            { value: 'all', label: '所有人' },
            { value: 'friends', label: '仅好友' },
            { value: 'nobody', label: '不允许' }
          ], MOCK_PROFILE.socialAuth[skey], function (v) {
            MOCK_PROFILE.socialAuth[skey] = v;
            renderSettings();
            toast(sLabels[skey] + '：' + sScopeName[v]);
          });
          return;
        }
        if (dact === 'social-stranger') {
          var strangerName = { fold: '折叠', block: '屏蔽', allow: '允许' };
          showChoiceSheet('陌生人消息', [
            { value: 'fold', label: '折叠' },
            { value: 'block', label: '屏蔽' },
            { value: 'allow', label: '允许' }
          ], MOCK_PROFILE.socialAuth.stranger, function (v) {
            MOCK_PROFILE.socialAuth.stranger = v;
            renderSettings();
            toast('陌生人消息：' + strangerName[v]);
          });
          return;
        }
        /* 导出笔记 → 进入笔记选择页（返回时回到隐私设置） */
        if (dact === 'data-export') {
          exportSelection = {};
          openSettingsDetail('export-notes', settingsDetailKey);
          return;
        }
        /* 注销账号 → 二次确认对话框 */
        if (dact === 'data-delete') {
          showConfirmModal({
            title: '注销账号',
            desc: '注销后，你的全部笔记、好友、互动数据将被永久删除，且无法恢复。请确认是否继续。',
            okText: '确认注销',
            onOk: function () { toast('账号已注销（demo）'); }
          });
          return;
        }
        /* 登录设备删除：device-del-<id>，当前设备不会走到这里（act=null） */
        if (dact.indexOf('device-del-') === 0) {
          var devId = dact.replace('device-del-', '');
          var dev = null;
          (MOCK_PROFILE.devices || []).forEach(function (d) { if (d.id === devId) dev = d; });
          if (!dev) return;
          showConfirmModal({
            title: '下线设备',
            desc: '将该设备从登录列表中移除，对方需要重新登录。设备：' + dev.name,
            okText: '确认下线',
            onOk: function () {
              MOCK_PROFILE.devices = (MOCK_PROFILE.devices || []).filter(function (d) { return d.id !== devId; });
              renderSettings();
              toast('已下线 ' + dev.name);
            }
          });
          return;
        }
        toast(settingName(settingsDetailKey) + ' · ' + dact + '（demo）');
        return;
      }
      /* 头像/背景上传：仅自己主页可改（访客视角忽略） */
      if ((node = e.target.closest('[data-action="upload-avatar"]'))) {
        if (viewingUserId) return;
        showAccSheet('更换头像', MOCK_PROFILE.user.initials, ['拍照', '从相册选择', '保存当前头像']);
        return;
      }
      if ((node = e.target.closest('[data-action="upload-bg"]'))) {
        if (viewingUserId) return;
        showAccSheet('更换背景图', '当前无背景', ['从相册选择', '设置纯色背景', '移除背景']);
        return;
      }
      /* 账号操作面板：关闭 / 选择操作 */
      if ((node = e.target.closest('[data-pf-acc-sheet-close]'))) { closeAccSheet(); return; }
      if ((node = e.target.closest('[data-pf-acc-act]'))) {
        var aa = node.getAttribute('data-pf-acc-act');
        closeAccSheet();
        toast(aa + '（demo）');
        return;
      }
      /* 格言编辑面板：取消 / 保存 */
      if ((node = e.target.closest('[data-pf-motto-cancel]'))) { closeMottoEditor(); return; }
      if ((node = e.target.closest('[data-pf-motto-save]'))) { saveMotto(); return; }
      /* 详情页内：主题选择 */
      if ((node = e.target.closest('[data-pf-theme]'))) {
        themeMode = node.getAttribute('data-pf-theme');
        applyThemeMode();
        renderSettings();
        toast(themeMode === 'dark' ? '已切换深色' : (themeMode === 'auto' ? '跟随系统' : '已切换浅色'));
        return;
      }
      /* 详情页内：账号切换 */
      if ((node = e.target.closest('[data-pf-account]'))) {
        var aname = node.getAttribute('data-pf-account');
        toast('切换到「' + aname + '」（demo）');
        return;
      }
      /* 详情页内：隐私可见度选择 */
      if ((node = e.target.closest('[data-pf-visibility]'))) {
        var vv = node.getAttribute('data-pf-visibility');
        var visMap = { all: '所有人', friends: '仅好友', group: '指定分组', self: '仅自己' };
        /* 指定分组：弹出分组多选面板（联动好友分组） */
        if (vv === 'group') {
          showGroupPicker(function (ids) {
            $all('[data-pf-visibility]').forEach(function (n) {
              var sel = n.getAttribute('data-pf-visibility') === 'group';
              n.classList.toggle('is-selected', sel);
              var chk = n.querySelector('.pf-settings-item__check');
              if (sel && !chk) n.insertAdjacentHTML('beforeend', '<span class="pf-settings-item__check">' + IC.checkMark(16) + '</span>');
              else if (!sel && chk) chk.parentNode.removeChild(chk);
            });
            if (MOCK_PROFILE.defaultVisibility) {
              MOCK_PROFILE.defaultVisibility.scope = 'group';
              MOCK_PROFILE.defaultVisibility.groups = ids;
            }
            toast('默认可见度：指定分组（' + ids.length + ' 个分组）');
          });
          return;
        }
        /* 本地切换选中态（demo） */
        $all('[data-pf-visibility]').forEach(function (n) {
          var sel = n.getAttribute('data-pf-visibility') === vv;
          n.classList.toggle('is-selected', sel);
          var chk = n.querySelector('.pf-settings-item__check');
          if (sel && !chk) n.insertAdjacentHTML('beforeend', '<span class="pf-settings-item__check">' + IC.checkMark(16) + '</span>');
          else if (!sel && chk) chk.parentNode.removeChild(chk);
        });
        if (MOCK_PROFILE.defaultVisibility) MOCK_PROFILE.defaultVisibility.scope = vv;
        toast('默认可见度：' + (visMap[vv] || vv) + '（demo）');
        return;
      }
      /* 导出笔记页：选择 / 全选 / 导出 */
      if ((node = e.target.closest('[data-pf-export-note]'))) {
        var nid = node.getAttribute('data-pf-export-note');
        if (exportSelection[nid]) delete exportSelection[nid]; else exportSelection[nid] = true;
        renderSettings();
        return;
      }
      if ((node = e.target.closest('[data-pf-export-all]'))) {
        var allNotes = getMockNotes();
        var allSelNow = allNotes.length > 0 && Object.keys(exportSelection).length === allNotes.length;
        exportSelection = {};
        if (!allSelNow) allNotes.forEach(function (n) { exportSelection[n.id] = true; });
        renderSettings();
        return;
      }
      if ((node = e.target.closest('[data-pf-export-go]'))) {
        var exportCnt = Object.keys(exportSelection).length;
        if (!exportCnt) return;
        toast('已开始导出 ' + exportCnt + ' 篇笔记（demo）');
        return;
      }
    });

    /* 自定义标签输入框：回车添加 */
    root.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;
      var input = e.target.closest('[data-pf-tag-input]');
      if (!input) return;
      e.preventDefault();
      if (addTag(input.value)) {
        renderTagAdd();
        toast('已添加「' + input.value.trim() + '」');
      } else {
        toast('标签为空或已存在');
      }
    });
  }

  /* ----------------------------- 初始化 ----------------------------- */
  function renderAll() {
    renderHero();
    renderTags();
    renderTabs();
    renderSettings();
  }

  function init() {
    var root = $('[data-pf-root]');
    if (!root) return;
    /* 动态注入 account-info 全屏视图容器（与 likes-list 同款结构：pf-list-top + body） */
    if (!$('[data-pf-view="account-info"]')) {
      var aiView = document.createElement('div');
      aiView.className = 'pf-view pf-view--list';
      aiView.setAttribute('data-pf-view', 'account-info');
      aiView.innerHTML = ''
        + '<div class="pf-list-top">'
        +   '<button class="zx-icon-btn" data-pf-list-back aria-label="返回">' + IC.back(16) + '</button>'
        +   '<h2 class="pf-list-title">账户信息</h2>'
        + '</div>'
        + '<div class="pf-scroll"><div class="pf-account-body" data-pf-account-body></div></div>';
      root.appendChild(aiView);
    }
    /* 暴露 MOCK_PROFILE 给抽屉等跨模块读取（motto/works/social 总览） */
    window.MOCK_PROFILE = MOCK_PROFILE;
    /* 初始化时同步自己的真实 tags + 作品集：
     * 作品集优先从 ZX_BRIDGE 读取（与笔记本工作区同源数据），兜底用 buildGuestProfile */
    var bridgeCols = buildCollectionsFromBridge();
    if (bridgeCols.length) {
      MOCK_PROFILE.worksV2.collections = bridgeCols;
      selfCollections = JSON.parse(JSON.stringify(bridgeCols));
    } else {
      var selfGp = buildGuestProfile(MOCK_PROFILE.user.id);
      if (selfGp.collections.length) {
        MOCK_PROFILE.worksV2.collections = selfGp.collections;
        selfCollections = JSON.parse(JSON.stringify(selfGp.collections));
      }
      if (selfGp.tags.length) {
        MOCK_PROFILE.tags.user = selfGp.tags;
        selfTags = JSON.parse(JSON.stringify(selfGp.tags));
      }
    }
    renderAll();
    /* 顶栏按钮（位于 .pf-topbar，在 [data-pf-root] 之外）单独绑定到 profile page */
    var page = document.querySelector('.zx-page[data-page="profile"]');
    if (page) delegateTopbar(page);
    delegate(root);
    /* 全局 capture 兜底：profile 页（.pf-root 容器）内的 open-guest-profile 头像点击统一跳转。
     * 用 capture 阶段（比所有 bubble 委托更早），且只处理落在 .pf-root 内的点击，
     * 避免 friends 页同 action 干扰。stopPropagation 防止 delegate(root) 重复处理。 */
    document.addEventListener('click', function (e) {
      var node = e.target.closest('[data-action="open-guest-profile"]');
      if (!node) return;
      if (!e.target.closest('.pf-root')) return;
      var uid = node.getAttribute('data-uid');
      if (!uid) return;
      e.preventDefault();
      e.stopPropagation();
      /* 若在任何社交列表视图（自己的关注/粉丝/获赞列表，或访客的）中点头像，
       * 必须 switchView('main') 收起列表（移除 is-on），否则列表仍显示着会盖住
       * 访客主页，看起来像没跳转。之前只判断 guestListCtx，漏了自己主页的列表。 */
      var inListView = ['likes-list', 'following-list', 'followers-list', 'teams-list'].indexOf(currentPfView) >= 0;
      if (inListView) {
        if (guestListCtx) {
          guestListCtx = null;
          $all('.pf-view--list .pf-list-title').forEach(function (t, idx) {
            var def = ['获赞', '关注', '粉丝', '团队', '添加标签'][idx];
            if (def) t.textContent = def;
          });
        }
        switchView('main');
      }
      viewUser(uid, 'profile');
    }, true);
    /* 全局 capture 兜底：作品筛选拉开/收起。
     * 原因：访客视角下 main 视图覆盖层可能影响 bubble 委托的触发，capture 阶段更可靠。 */
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.pf-root')) return;
      var node = e.target.closest('[data-pf-filter-toggle]');
      if (!node) return;
      e.preventDefault();
      e.stopPropagation();
      worksFilterOpen = !worksFilterOpen;
      renderTabBody();
    }, true);
  }

  window.ZX_PROFILE = { init: init, mock: MOCK_PROFILE, viewUser: viewUser, viewSelf: viewSelf, openAccountInfo: openAccountInfo, openMottoEditor: openMottoEditor };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
