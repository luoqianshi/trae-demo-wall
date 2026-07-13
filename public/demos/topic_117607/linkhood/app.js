const state = {
  route: "home",
  activeCategory: "全部",
  selectedNeedId: 1,
  selectedCircleId: 1,
  isLoggedIn: true,
  user: {
    name: "林小满",
    role: "认证用户",
    credit: 92,
    circle: "梧桐里小区",
    avatar: "林",
  },
};

const circles = [
  {
    id: 1,
    name: "梧桐里小区",
    type: "小区",
    members: 3268,
    safety: "实名率 96%",
    desc: "围绕物业维修、闲置交易、邻里互助和民生建议形成的真实社区邻圈。",
    services: ["物业电话", "维修上报", "微信群列表", "通知公告", "意见反馈", "打卡共治"],
    groups: ["业主总群", "二手闲置群", "跑步搭子群", "宝妈互助群"],
  },
  {
    id: 2,
    name: "江北大学邻圈",
    type: "大学",
    members: 14820,
    safety: "学籍认证",
    desc: "覆盖宿舍维修、校园活动、技能互助、创业摊位和校园建议的大学生活圈。",
    services: ["宿舍报修", "校园活动", "考研互助", "社团招新", "意见反馈", "失物招领"],
    groups: ["25级新生群", "羽毛球群", "兼职互助群", "创业集市群"],
  },
  {
    id: 3,
    name: "老友朋友圈",
    type: "朋友圈",
    members: 216,
    safety: "好友验证",
    desc: "以微信好友和线下熟人关系为基础的私密邻圈，适合小范围活动和交易。",
    services: ["好友动态", "聚会报名", "私域交易", "心情树洞", "问答互助", "共同收藏"],
    groups: ["周末骑行群", "桌游群", "宠物互助群"],
  },
];

const needs = [
  {
    id: 1,
    title: "周六羽毛球双打缺 2 人",
    category: "活动",
    circle: "江北大学邻圈",
    price: "AA 28 元",
    distance: "800m",
    publisher: "周屿",
    avatar: "周",
    credit: 95,
    desc: "校体育馆 3 号场，19:00-21:00，水平不限，希望大家线下认识新朋友。",
    tags: ["实名", "线下活动", "可报名"],
    boosts: 86,
  },
  {
    id: 2,
    title: "出 9 成新小米显示器 27 寸",
    category: "闲置物品",
    circle: "梧桐里小区",
    price: "￥520",
    distance: "120m",
    publisher: "陈一",
    avatar: "陈",
    credit: 89,
    desc: "支持上门验货，小区门口交易，带原包装和电源线。",
    tags: ["小区自提", "平台担保", "可议价"],
    boosts: 38,
  },
  {
    id: 3,
    title: "下班后辅导 Python 入门",
    category: "技能服务",
    circle: "老友朋友圈",
    price: "￥80/小时",
    distance: "1.6km",
    publisher: "许安",
    avatar: "许",
    credit: 98,
    desc: "互联网后端工程师，支持线上讲解或社区咖啡厅面对面辅导。",
    tags: ["行业认证", "可试看", "好友可见"],
    boosts: 64,
  },
  {
    id: 4,
    title: "建议增设夜间照明和电动车棚",
    category: "那些事儿",
    circle: "梧桐里小区",
    price: "民生建议",
    distance: "本小区",
    publisher: "业委会观察员",
    avatar: "业",
    credit: 91,
    desc: "3 栋到北门小路夜间偏暗，建议物业与社区街道共同推进改造。",
    tags: ["意见反馈", "助力排名", "社区共治"],
    boosts: 214,
  },
  {
    id: 5,
    title: "居家烘焙接生日蛋糕预定",
    category: "居家创业",
    circle: "梧桐里小区",
    price: "￥88 起",
    distance: "300m",
    publisher: "南瓜烘焙",
    avatar: "南",
    credit: 96,
    desc: "持食品健康证，支持小区自提，提前 24 小时预约。",
    tags: ["创业者", "行业认证", "邻里优惠"],
    boosts: 102,
  },
];

const activities = [
  { title: "邻里露天电影夜", time: "周五 19:30", place: "小区中心花园", people: 68, type: "文化" },
  { title: "校园创业跳蚤市集", time: "周六 14:00", place: "江北大学东广场", people: 126, type: "交易" },
  { title: "新手友好桌游局", time: "周日 15:00", place: "邻聚共享客厅", people: 12, type: "棋牌" },
];

const orders = [
  { title: "小米显示器 27 寸", status: "待支付", amount: "￥520", next: "确认担保支付后约定自提" },
  { title: "Python 入门辅导", status: "待参与", amount: "￥160", next: "双方确认周三 20:00 社区咖啡厅" },
  { title: "羽毛球双打活动", status: "待评价", amount: "￥28", next: "活动已结束，待评价队友体验" },
  { title: "生日蛋糕预定", status: "已完成", amount: "￥128", next: "交易完成，信用分已更新" },
];

const authItems = [
  { title: "实名认证", status: "已通过", desc: "姓名与证件信息已核验，用于提升邻圈信任度。" },
  { title: "行业认证", status: "审核中", desc: "正在核验互联网从业资质，预计 1 个工作日完成。" },
  { title: "小区认证", status: "已通过", desc: "已加入梧桐里小区，支持物业服务和业主群查看。" },
  { title: "大学认证", status: "未提交", desc: "可通过学籍信息申请加入大学邻圈。" },
];

const feedbacks = [
  { title: "北门人行道积水", circle: "梧桐里小区", boosts: 302, progress: "已转交物业" },
  { title: "宿舍热水供应时间延长", circle: "江北大学邻圈", boosts: 518, progress: "校务处处理中" },
  { title: "增设宠物便民箱", circle: "梧桐里小区", boosts: 167, progress: "征集中" },
];

const categories = ["全部", "活动", "闲置物品", "技能服务", "居家创业", "那些事儿"];

function routeTo(route, params = {}) {
  state.route = route;
  if (params.needId) state.selectedNeedId = Number(params.needId);
  if (params.circleId) state.selectedCircleId = Number(params.circleId);
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("active");
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => toast.classList.remove("active"), 2400);
}

function openModal(title, bodyHtml) {
  const modal = document.querySelector("#modal");
  modal.innerHTML = `
    <div class="modal-card">
      <div class="modal-head">
        <div>
          <h2>${title}</h2>
          <p class="muted">邻聚原型交互弹窗</p>
        </div>
        <button class="icon-btn" onclick="closeModal()">×</button>
      </div>
      ${bodyHtml}
    </div>
  `;
  modal.classList.add("active");
}

function closeModal() {
  document.querySelector("#modal").classList.remove("active");
}

function shell(content) {
  return `
    <div class="app-shell">
      <header class="topbar">
        <button class="brand" onclick="routeTo('home')">
          <span class="brand-logo">邻</span>
          <span>
            <span class="brand-title">邻聚</span>
            <span class="brand-subtitle">真实邻圈 · 面对面社交</span>
          </span>
        </button>
        <label class="search-box">
          <span>⌕</span>
          <input id="globalSearch" placeholder="搜索活动、闲置、技能、民生建议" onkeydown="if(event.key==='Enter') routeTo('needs')" />
        </label>
        <div class="top-actions">
          <button class="icon-btn" onclick="showToast('你有 3 条邻圈消息待查看')">🔔</button>
          <button class="ghost-btn" onclick="routeTo('auth')">认证中心</button>
          <button class="primary-btn" onclick="routeTo('publish')">发布</button>
        </div>
      </header>
      ${content}
    </div>
    ${bottomNav()}
    <div id="modal" class="modal" onclick="if(event.target.id==='modal') closeModal()"></div>
    <div id="toast" class="toast"></div>
  `;
}

function bottomNav() {
  const items = [
    ["home", "⌂", "首页"],
    ["circles", "◎", "邻圈"],
    ["publish", "＋", "发布"],
    ["mine", "☻", "我的"],
  ];
  return `
    <nav class="bottom-nav">
      ${items
        .map(
          ([route, icon, label]) => `
            <button class="nav-item ${state.route === route ? "active" : ""}" onclick="routeTo('${route}')">
              <span>${icon}</span>${label}
            </button>
          `,
        )
        .join("")}
    </nav>
  `;
}

function homePage() {
  return shell(`
    <main class="page active">
      <section class="hero">
        <div class="hero-card">
          <span class="eyebrow">实名认证 + 行业认证 + 邻圈验证</span>
          <h1>把陌生邻居变成可见、可信、可见面的生活伙伴。</h1>
          <p>邻聚以小区、大学和朋友圈为单位，融合活动、心情、问答、闲置交易、技能服务与民生反馈，帮助年轻人降低社交压力，并让社区供需更高效地匹配。</p>
          <div class="hero-actions">
            <button class="primary-btn" onclick="routeTo('circles')">加入邻圈</button>
            <button class="ghost-btn" onclick="routeTo('needs')">浏览供需</button>
            <button class="secondary-btn" onclick="routeTo('social')">参加活动</button>
          </div>
        </div>
        <div class="hero-side">
          <div class="metric-grid">
            <div class="metric"><strong>3</strong><span>邻圈类型</span></div>
            <div class="metric"><strong>18k+</strong><span>模拟成员</span></div>
            <div class="metric"><strong>96%</strong><span>实名验证率</span></div>
            <div class="metric"><strong>214</strong><span>民生建议助力</span></div>
          </div>
          <div class="notice-card">
            <h3>今日社区提醒</h3>
            <p>梧桐里 3 栋电梯维保已开放评价，江北大学校园市集开始报名，热门建议“夜间照明改造”进入助力榜前 3。</p>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="section-head">
          <div>
            <h2 class="section-title">热门供需</h2>
            <p class="section-desc">按邻圈、距离、分类和信用进行筛选。</p>
          </div>
          <button class="ghost-btn" onclick="routeTo('needs')">查看全部</button>
        </div>
        <div class="grid-3">${needs.slice(0, 3).map(needCard).join("")}</div>
      </section>

      <section class="section grid-2">
        <div class="panel">
          <div class="section-head">
            <div>
              <h2 class="section-title">推荐活动</h2>
              <p class="section-desc">促进线下见面，缓解社交恐惧。</p>
            </div>
          </div>
          <div class="feature-list">${activities.map(activityRow).join("")}</div>
        </div>
        <div class="panel">
          <div class="section-head">
            <div>
              <h2 class="section-title">意见与反馈榜</h2>
              <p class="section-desc">学校和小区民生问题可被助力排名。</p>
            </div>
          </div>
          <div class="feature-list">${feedbacks.map(feedbackRow).join("")}</div>
        </div>
      </section>
    </main>
  `);
}

function needCard(item) {
  return `
    <article class="need-card">
      <div class="tag-list">
        <span class="tag primary">${item.category}</span>
        <span class="tag">${item.distance}</span>
      </div>
      <h3>${item.title}</h3>
      <p>${item.desc}</p>
      <div class="tag-list">${item.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}</div>
      <div class="card-footer">
        <div class="avatar-row">
          <span class="avatar">${item.avatar}</span>
          <div><strong>${item.publisher}</strong><br><span class="muted">信用 ${item.credit}</span></div>
        </div>
        <strong>${item.price}</strong>
      </div>
      <div class="card-footer">
        <span class="muted">${item.circle} · ${item.boosts} 助力</span>
        <button class="primary-btn" onclick="routeTo('needDetail', { needId: ${item.id} })">查看详情</button>
      </div>
    </article>
  `;
}

function activityRow(item) {
  return `
    <div class="feature-row">
      <div>
        <strong>${item.title}</strong><br>
        <span>${item.time} · ${item.place} · ${item.people} 人报名</span>
      </div>
      <button class="secondary-btn" onclick="showToast('已提交 ${item.title} 报名意向')">${item.type}</button>
    </div>
  `;
}

function feedbackRow(item) {
  return `
    <div class="feature-row">
      <div>
        <strong>${item.title}</strong><br>
        <span>${item.circle} · ${item.progress}</span>
      </div>
      <button class="ghost-btn" onclick="showToast('已为「${item.title}」助力')">助力 ${item.boosts}</button>
    </div>
  `;
}

function circlesPage() {
  return shell(`
    <main class="page active">
      <div class="page-title">
        <h1>邻圈管理</h1>
        <p>支持小区、大学和朋友圈多种邻圈类型，加入时需通过定位、学籍、好友或管理员审核。</p>
      </div>
      <section class="circle-hero">
        <div class="panel circle-map">
          <div class="node main">邻聚</div>
          <div class="node a">小区</div>
          <div class="node b">大学</div>
          <div class="node c">好友</div>
          <div class="node d">服务</div>
        </div>
        <div class="grid-1">
          ${circles.map(circleCard).join("")}
        </div>
      </section>
    </main>
  `);
}

function circleCard(circle) {
  return `
    <article class="circle-card">
      <div class="tag-list">
        <span class="tag primary">${circle.type}</span>
        <span class="tag blue">${circle.safety}</span>
      </div>
      <h3>${circle.name}</h3>
      <p>${circle.desc}</p>
      <div class="tag-list">${circle.services.slice(0, 4).map((s) => `<span class="tag">${s}</span>`).join("")}</div>
      <div class="card-footer">
        <span class="muted">${circle.members.toLocaleString()} 位成员 · ${circle.groups.length} 个群资料</span>
        <div>
          <button class="ghost-btn" onclick="openJoin(${circle.id})">申请加入</button>
          <button class="primary-btn" onclick="routeTo('circleDetail', { circleId: ${circle.id} })">详情</button>
        </div>
      </div>
    </article>
  `;
}

function openJoin(circleId) {
  const circle = circles.find((item) => item.id === circleId);
  openModal(
    `申请加入 ${circle.name}`,
    `
      <div class="form-grid">
        <label class="field"><span>验证方式</span><select><option>定位 + 管理员审核</option><option>学信网/学籍认证</option><option>微信好友验证</option></select></label>
        <label class="field"><span>真实姓名</span><input placeholder="请输入姓名"></label>
        <label class="field full"><span>补充说明</span><textarea placeholder="例如楼栋房号、学院班级、共同好友等"></textarea></label>
      </div>
      <div class="card-footer">
        <span class="muted">提交后管理员将在 24 小时内审核。</span>
        <button class="primary-btn" onclick="closeModal(); showToast('加入申请已提交')">提交申请</button>
      </div>
    `,
  );
}

function circleDetailPage() {
  const circle = circles.find((item) => item.id === state.selectedCircleId) || circles[0];
  return shell(`
    <main class="page active">
      <div class="page-title">
        <h1>${circle.name}</h1>
        <p>${circle.desc}</p>
      </div>
      <section class="grid-2">
        <div class="panel">
          <h2 class="section-title">服务列表</h2>
          <div class="service-grid" style="grid-template-columns: repeat(2, minmax(0, 1fr)); margin-top: 14px;">
            ${circle.services.map((service) => `<div class="service-item"><strong>${service}</strong><span>认证成员可使用</span></div>`).join("")}
          </div>
        </div>
        <div class="panel">
          <h2 class="section-title">群资料列表</h2>
          <div class="feature-list" style="margin-top: 14px;">
            ${circle.groups.map((group) => `<div class="feature-row"><strong>${group}</strong><button class="ghost-btn" onclick="showToast('已发起查看 ${group} 的验证')">验证查看</button></div>`).join("")}
          </div>
        </div>
      </section>
      <section class="section grid-2">
        <div class="panel">
          <h2 class="section-title">通知公告</h2>
          <div class="timeline" style="margin-top: 14px;">
            <div class="timeline-item"><time>今天</time><div><strong>安全提醒</strong><p class="muted">请通过平台担保交易，不要提前线下转账。</p></div></div>
            <div class="timeline-item"><time>周五</time><div><strong>公共服务</strong><p class="muted">维修服务和意见反馈已开放助力榜。</p></div></div>
          </div>
        </div>
        <div class="panel">
          <h2 class="section-title">成员管理</h2>
          <p class="muted">管理员可以审核加入申请、发布公告、维护群资料并处理反馈。</p>
          <div class="card-footer">
            <button class="secondary-btn" onclick="showToast('已打开管理员审核队列')">审核队列</button>
            <button class="ghost-btn" onclick="showToast('已生成成员信用报表')">信用报表</button>
          </div>
        </div>
      </section>
    </main>
  `);
}

function needsPage() {
  const list = state.activeCategory === "全部" ? needs : needs.filter((item) => item.category === state.activeCategory);
  return shell(`
    <main class="page active">
      <div class="page-title">
        <h1>供需广场</h1>
        <p>支持邻圈范围、距离、分类和关键词筛选，所有交易意向可进入担保订单流程。</p>
      </div>
      <div class="filters">
        ${categories.map((cat) => `<button class="chip ${state.activeCategory === cat ? "active" : ""}" onclick="state.activeCategory='${cat}'; render();">${cat}</button>`).join("")}
      </div>
      <div class="grid-3">${list.length ? list.map(needCard).join("") : `<div class="empty-state">当前分类暂无内容</div>`}</div>
    </main>
  `);
}

function needDetailPage() {
  const item = needs.find((need) => need.id === state.selectedNeedId) || needs[0];
  return shell(`
    <main class="page active">
      <div class="page-title">
        <h1>${item.title}</h1>
        <p>${item.circle} · ${item.distance} · ${item.category}</p>
      </div>
      <section class="grid-2">
        <article class="panel">
          <div class="tag-list">
            ${item.tags.map((tag) => `<span class="tag primary">${tag}</span>`).join("")}
          </div>
          <h2>${item.price}</h2>
          <p class="muted">${item.desc}</p>
          <div class="service-grid" style="grid-template-columns: repeat(2, minmax(0, 1fr));">
            <div class="service-item"><strong>地址</strong><span>${item.circle} 附近</span></div>
            <div class="service-item"><strong>联系方式</strong><span>接受需求后可见</span></div>
            <div class="service-item"><strong>物品/服务参数</strong><span>规格、成色、时间可协商</span></div>
            <div class="service-item"><strong>平台保障</strong><span>担保支付 + 双方确认</span></div>
          </div>
          <div class="card-footer">
            <button class="ghost-btn" onclick="showToast('已收藏该需求')">收藏</button>
            <button class="secondary-btn" onclick="showToast('已为该内容助力')">助力 ${item.boosts}</button>
            <button class="primary-btn" onclick="createOrder('${item.title}')">接受需求</button>
          </div>
        </article>
        <aside class="panel">
          <h2 class="section-title">发布者信息</h2>
          <div class="profile-head" style="margin-top: 14px;">
            <span class="big-avatar">${item.avatar}</span>
            <div>
              <h3>${item.publisher}</h3>
              <p class="muted">信用分 ${item.credit} · 已实名认证 · ${item.tags.includes("行业认证") ? "行业认证" : "邻圈认证"}</p>
            </div>
          </div>
          <div class="timeline" style="margin-top: 18px;">
            <div class="timeline-item"><time>评论</time><div><strong>邻友 A</strong><p class="muted">请问今晚方便线下确认吗？</p></div></div>
            <div class="timeline-item"><time>提醒</time><div><strong>平台提示</strong><p class="muted">线下见面建议选择社区公共空间，并使用平台担保支付。</p></div></div>
          </div>
        </aside>
      </section>
    </main>
  `);
}

function createOrder(title) {
  openModal(
    "发起交易意向",
    `
      <div class="form-grid">
        <label class="field"><span>交易地点</span><input value="社区共享客厅 / 校园广场"></label>
        <label class="field"><span>交易时间</span><input value="今天 19:30"></label>
        <label class="field full"><span>留言</span><textarea>你好，我想接受「${title}」，可以确认时间和地点吗？</textarea></label>
      </div>
      <div class="card-footer">
        <span class="muted">双方确认后进入待支付或待参与状态。</span>
        <button class="primary-btn" onclick="closeModal(); routeTo('orders'); showToast('交易意向已发送')">确认发起</button>
      </div>
    `,
  );
}

function publishPage() {
  return shell(`
    <main class="page active">
      <div class="page-title">
        <h1>快速发布</h1>
        <p>发布需求或供给时可选择小区、大学、朋友圈等可见范围。</p>
      </div>
      <section class="panel">
        <div class="form-grid">
          <label class="field"><span>发布类型</span><select><option>需求</option><option>供给</option><option>活动</option><option>意见反馈</option></select></label>
          <label class="field"><span>邻圈范围</span><select>${circles.map((circle) => `<option>${circle.name}</option>`).join("")}</select></label>
          <label class="field"><span>分类</span><select>${categories.filter((cat) => cat !== "全部").map((cat) => `<option>${cat}</option>`).join("")}</select></label>
          <label class="field"><span>价格/预算</span><input placeholder="如 ￥50、AA、免费、民生建议"></label>
          <label class="field full"><span>标题</span><input placeholder="用一句话说明你要发布的内容"></label>
          <label class="field full"><span>描述</span><textarea placeholder="补充物品参数、规格、成色、活动时间、服务内容、民生问题等"></textarea></label>
          <label class="field"><span>地址</span><input placeholder="社区公共空间、楼栋附近、校园地点"></label>
          <label class="field"><span>联系方式</span><input placeholder="接受后可见，也可填写备用联系方式"></label>
          <label class="field full"><span>图片</span><input type="file" multiple></label>
        </div>
        <div class="card-footer">
          <span class="muted">发布后将进入邻圈动态和对应分类列表。</span>
          <button class="primary-btn" onclick="showToast('发布成功，已进入邻圈动态')">提交发布</button>
        </div>
      </section>
    </main>
  `);
}

function ordersPage() {
  const statusClass = { 待支付: "waiting", 待参与: "waiting", 待评价: "ok", 已完成: "ok" };
  return shell(`
    <main class="page active">
      <div class="page-title">
        <h1>我的订单</h1>
        <p>覆盖待支付、待参与/待取货、待评价和已完成状态，形成交易闭环。</p>
      </div>
      <div class="grid-2">
        ${orders
          .map(
            (order) => `
              <article class="order-card">
                <span class="status ${statusClass[order.status]}">${order.status}</span>
                <h3>${order.title}</h3>
                <p>${order.next}</p>
                <div class="card-footer">
                  <strong>${order.amount}</strong>
                  <button class="primary-btn" onclick="openOrder('${order.title}', '${order.status}')">订单详情</button>
                </div>
              </article>
            `,
          )
          .join("")}
      </div>
    </main>
  `);
}

function openOrder(title, status) {
  openModal(
    title,
    `
      <div class="timeline">
        <div class="timeline-item"><time>1</time><div><strong>接受需求</strong><p class="muted">买卖或活动双方建立交易意向。</p></div></div>
        <div class="timeline-item"><time>2</time><div><strong>确认时间地点</strong><p class="muted">约定线下见面的公共安全地点。</p></div></div>
        <div class="timeline-item"><time>3</time><div><strong>平台担保支付</strong><p class="muted">参考闲鱼模式，完成确认后释放款项。</p></div></div>
        <div class="timeline-item"><time>4</time><div><strong>评价反馈</strong><p class="muted">影响用户信用分和邻圈能力体系。</p></div></div>
      </div>
      <div class="card-footer">
        <span class="status waiting">当前：${status}</span>
        <button class="primary-btn" onclick="closeModal(); showToast('已更新订单状态')">确认下一步</button>
      </div>
    `,
  );
}

function socialPage() {
  return shell(`
    <main class="page active">
      <div class="page-title">
        <h1>社交与活动</h1>
        <p>活动报名、心情树洞、问答与奇思妙想共同组成轻压力社交场。</p>
      </div>
      <section class="grid-3">
        ${activities
          .map(
            (item) => `
              <article class="feed-card">
                <span class="tag orange">${item.type}</span>
                <h3>${item.title}</h3>
                <p>${item.time} · ${item.place}</p>
                <div class="card-footer">
                  <span class="muted">${item.people} 人报名</span>
                  <button class="primary-btn" onclick="showToast('报名成功，活动前会提醒你')">报名</button>
                </div>
              </article>
            `,
          )
          .join("")}
      </section>
      <section class="section grid-2">
        <div class="panel">
          <h2 class="section-title">心情树洞</h2>
          <p class="muted">可选择匿名或实名发布心情，让邻友用低压力方式回应。</p>
          <div class="feature-list">
            <div class="feature-row"><strong>今天不想说话，但想有人一起散步</strong><span>匿名 · 18 个拥抱</span></div>
            <div class="feature-row"><strong>第一次参加邻里活动，有点紧张</strong><span>实名 · 12 条鼓励</span></div>
          </div>
        </div>
        <div class="panel">
          <h2 class="section-title">问答与奇思妙想</h2>
          <p class="muted">生活问题、校园问题和创意灵感都可以被邻圈回应。</p>
          <div class="feature-list">
            <div class="feature-row"><strong>小区附近哪里适合晚上自习？</strong><button class="ghost-btn">回答</button></div>
            <div class="feature-row"><strong>想做社区咖啡拼单，有人感兴趣吗？</strong><button class="ghost-btn">参与</button></div>
          </div>
        </div>
      </section>
    </main>
  `);
}

function authPage() {
  return shell(`
    <main class="page active">
      <div class="page-title">
        <h1>认证与信用体系</h1>
        <p>通过实名、行业、小区、大学认证构建邻聚独有的信用和能力考核体系。</p>
      </div>
      <div class="grid-2">
        ${authItems
          .map((item) => {
            const cls = item.status === "已通过" ? "ok" : item.status === "审核中" ? "waiting" : "fail";
            return `
              <article class="auth-card">
                <span class="status ${cls}">${item.status}</span>
                <h3>${item.title}</h3>
                <p>${item.desc}</p>
                <button class="primary-btn" onclick="openAuth('${item.title}')">查看/提交</button>
              </article>
            `;
          })
          .join("")}
      </div>
    </main>
  `);
}

function openAuth(title) {
  openModal(
    title,
    `
      <div class="form-grid">
        <label class="field"><span>认证姓名</span><input placeholder="请输入真实姓名"></label>
        <label class="field"><span>证件/资质编号</span><input placeholder="身份证、学籍或行业资质编号"></label>
        <label class="field full"><span>上传材料</span><input type="file" multiple></label>
        <label class="field full"><span>说明</span><textarea placeholder="请补充认证用途和相关说明"></textarea></label>
      </div>
      <div class="card-footer">
        <span class="muted">认证信息仅用于平台审核和信用展示。</span>
        <button class="primary-btn" onclick="closeModal(); showToast('${title}资料已提交')">提交审核</button>
      </div>
    `,
  );
}

function minePage() {
  return shell(`
    <main class="page active">
      <div class="page-title">
        <h1>我的中心</h1>
        <p>管理发布、订单、收藏、浏览记录、认证状态、创业者商品和隐私安全设置。</p>
      </div>
      <section class="profile-layout">
        <aside class="profile-card">
          <div class="profile-head">
            <span class="big-avatar">${state.user.avatar}</span>
            <div>
              <h2>${state.user.name}</h2>
              <p class="muted">${state.user.role} · 信用分 ${state.user.credit}</p>
            </div>
          </div>
          <div class="tag-list" style="margin-top: 18px;">
            <span class="tag primary">实名认证</span>
            <span class="tag blue">小区认证</span>
            <span class="tag orange">创业者待开通</span>
          </div>
          <div class="menu-list">
            <button class="menu-item" onclick="routeTo('orders')"><span>我的订单</span><strong>›</strong></button>
            <button class="menu-item" onclick="routeTo('auth')"><span>我的认证</span><strong>›</strong></button>
            <button class="menu-item" onclick="showToast('已进入隐私、安全、通知设置')"><span>设置</span><strong>›</strong></button>
          </div>
        </aside>
        <div class="grid-2">
          <div class="panel"><h3>我的发布</h3><p class="muted">管理供需、活动、心情、问答和意见反馈。</p><button class="ghost-btn" onclick="routeTo('publish')">去发布</button></div>
          <div class="panel"><h3>我的收藏</h3><p class="muted">收藏的闲置物品、技能服务和活动入口。</p><button class="ghost-btn" onclick="showToast('已打开收藏列表')">查看</button></div>
          <div class="panel"><h3>浏览记录</h3><p class="muted">按邻圈和分类查看近期访问记录。</p><button class="ghost-btn" onclick="showToast('已打开浏览记录')">查看</button></div>
          <div class="panel"><h3>居家创业者管理</h3><p class="muted">管理产品、库存、订单和邻里优惠。</p><button class="ghost-btn" onclick="showToast('请先完成行业认证')">开通</button></div>
        </div>
      </section>
    </main>
  `);
}

function render() {
  const routes = {
    home: homePage,
    circles: circlesPage,
    circleDetail: circleDetailPage,
    needs: needsPage,
    needDetail: needDetailPage,
    publish: publishPage,
    orders: ordersPage,
    social: socialPage,
    auth: authPage,
    mine: minePage,
  };
  document.querySelector("#app").innerHTML = (routes[state.route] || homePage)();
}

window.routeTo = routeTo;
window.showToast = showToast;
window.openModal = openModal;
window.closeModal = closeModal;
window.openJoin = openJoin;
window.createOrder = createOrder;
window.openOrder = openOrder;
window.openAuth = openAuth;
window.state = state;
window.render = render;

render();
