const data = window.DEMO_DATA;

const state = {
  role: "owner",
  page: "overview",
  metric: data.metrics[0].label,
  demo: loadDemoState()
};

function defaultDemoState() {
  return {
    appetiteRecorded: false,
    manualReadingAdded: false,
    careCompleted: false,
    reportGenerated: false,
    reportShared: false,
    doctorAdviceSent: false,
    grantActive: true,
    deviceSynced: false,
    alertAcknowledged: false,
    dataExported: false,
    webhookTested: false,
    timeline: [
      ["今天 08:20", "食物未吃完，剩余约 38%。"],
      ["今天 10:10", "多次进入厕所，暂无明确排泄结果。"],
      ["今天 11:30", "体温 39.3°C，略高于个体常态。"]
    ],
    ownerMessages: []
  };
}

function loadDemoState() {
  try {
    return { ...defaultDemoState(), ...JSON.parse(sessionStorage.getItem("chongban-demo-state") || "{}") };
  } catch {
    return defaultDemoState();
  }
}

function saveDemoState() {
  sessionStorage.setItem("chongban-demo-state", JSON.stringify(state.demo));
}

function updateDemo(mutator, message) {
  mutator(state.demo);
  saveDemoState();
  render();
  if (message) showToast(message);
}

const ownerPages = [
  ["overview", "总览", "⌂"],
  ["data", "数据", "⌁"],
  ["alerts", "预警", "!"],
  ["care", "照护", "✓"],
  ["records", "档案", "□"],
  ["privacy", "授权", "◎"]
];

const doctorPages = [
  ["clinic", "工作台", "⌂"],
  ["patients", "授权宠物", "◇"],
  ["reports", "报告", "▤"],
  ["advice", "机构建议", "↗"],
  ["integration", "设置", "⌘"],
  ["audit", "审计", "◎"]
];

const content = document.querySelector("#content");
const nav = document.querySelector("#nav");
const drawer = document.querySelector("#drawer");
const drawerTitle = document.querySelector("#drawer-title");
const drawerKicker = document.querySelector("#drawer-kicker");
const drawerBody = document.querySelector("#drawer-body");
const toast = document.querySelector("#toast");

function html(strings, ...values) {
  return strings.reduce((out, item, index) => out + item + (values[index] ?? ""), "");
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 2200);
}

function setRole(role) {
  state.role = role;
  state.page = role === "owner" ? "overview" : "clinic";
  document.querySelectorAll("[data-role]").forEach((button) => {
    button.classList.toggle("active", button.dataset.role === role);
  });
  document.querySelector("#workspace-label").textContent = role === "owner" ? "主人端" : "医生端";
  document.querySelector("[data-action='openGrant']").style.display = role === "owner" ? "" : "none";
  render();
}

function setPage(page) {
  state.page = page;
  render();
}

function currentPages() {
  return state.role === "owner" ? ownerPages : doctorPages;
}

function renderNav() {
  nav.innerHTML = currentPages().map(([id, label, icon]) => html`
    <button class="nav-btn ${state.page === id ? "active" : ""}" type="button" data-page="${id}">
      <span class="nav-icon">${icon}</span>
      <span class="nav-label">${label}</span>
      <span class="nav-arrow">›</span>
    </button>
  `).join("");
}

function card(title, body, className = "") {
  return html`<section class="card ${className}"><h2>${title}</h2>${body}</section>`;
}

function statGrid(items) {
  return html`<div class="stat-grid">${items.map(([label, value]) => html`
    <div class="stat"><span>${label}</span><strong>${value}</strong></div>
  `).join("")}</div>`;
}

function listRows(items, action) {
  return html`<div class="grid">${items.map((item, index) => html`
    <button class="list-row" type="button" ${action ? `data-action="${action}" data-index="${index}"` : ""}>
      <strong>${item[0]}</strong>
      <span>${item[1]}</span>
    </button>
  `).join("")}</div>`;
}

function chart(metric) {
  const points = metric.points.map((point, index) => `${(index / (metric.points.length - 1)) * 100},${100 - point}`).join(" ");
  return html`<div class="line-chart" aria-label="${metric.label}七日趋势">
    <div class="baseline-band" style="top:${100 - metric.baselineHigh}%;height:${metric.baselineHigh - metric.baselineLow}%"></div>
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <polyline points="${points}"></polyline>
    </svg>
    ${metric.points.map((point, index) => html`
      <span class="chart-point ${index === metric.anomalyIndex ? "anomaly" : ""}" style="left:${(index / (metric.points.length - 1)) * 100}%;top:${100 - point}%"></span>
    `).join("")}
  </div>`;
}

function renderOverview() {
  const pet = data.pet;
  const nextAction = state.demo.doctorAdviceSent
    ? ["查看医生建议", "张医生已回传建议，建议今晚继续记录排泄结果和体温。"]
    : state.demo.careCompleted
      ? ["等待晚间复测", "今日照护动作已安排，晚间补充体温和排泄记录。"]
      : ["今晚 20:00 复测体温", "若体温继续升高、排泄困难或精神明显变差，建议尽快联系医院。"];
  return html`
    <div class="sync-strip">
      <span><i class="status-dot"></i>最后同步：${state.demo.deviceSynced ? "刚刚" : "2 分钟前"}</span>
      <span><i class="status-dot"></i>设备在线：${state.demo.deviceSynced ? "4 / 4" : "3 / 4"}</span>
      <span><i class="status-dot ${state.demo.grantActive ? "" : "warning-dot"}"></i>授权机构：${state.demo.grantActive ? "XX 宠物医院" : "未授权"}</span>
    </div>
    <div class="overview-layout">
      <section class="card tint focus-panel health-summary">
        <div>
          <div class="card-head">
            <div>
              <p class="section-kicker">今日判断</p>
              <h2>先按轻中度异常观察</h2>
              <p class="copy">鱼丸今天同时出现猫砂盆、食欲和体温变化。当前建议先记录关键证据，今晚复测体温。</p>
            </div>
            <span class="pill warning">需要留意</span>
          </div>
          <div class="record-strip">
            <div><span>观察级别</span><strong>居家观察</strong></div>
            <div><span>建议时长</span><strong>48 小时</strong></div>
            <div><span>升级条件</span><strong>排泄困难 / 体温升高</strong></div>
          </div>
        </div>
        <div class="pet-mini">
          <img src="./assets/yuwan-avatar.jpg" alt="鱼丸头像">
          <div>
            <strong>鱼丸</strong>
            <span>${pet.type} · ${pet.age}</span>
          </div>
        </div>
      </section>
      <section class="card evidence-panel">
        <div class="card-head">
          <div>
            <p class="section-kicker">今日证据</p>
            <h2>三项变化来自设备和手动记录</h2>
          </div>
        </div>
          <div class="today-list">
            <div><strong>猫砂盆</strong><span>6 小时进出 7 次，比平时多</span></div>
            <div><strong>进食</strong><span>本餐吃了 62%，剩得比平时多</span></div>
            <div><strong>体温</strong><span>39.3°C，略高一点</span></div>
          </div>
          <div class="actions">
            <button class="primary-btn" type="button" data-action="openReport">生成就医报告</button>
            <button class="secondary-btn" type="button" data-action="openCarePlan">查看照护动作</button>
          </div>
      </section>
    </div>
    <div class="grid two action-row">
      ${card("下一步动作", `
        <div class="next-action">
          <strong>${nextAction[0]}</strong>
          <p class="copy">${nextAction[1]}</p>
        </div>
        <div class="actions">
          <button class="primary-btn" type="button" data-action="openCarePlan">安排照护</button>
          <button class="ghost-btn" type="button" data-action="openAppetite">记录食欲</button>
        </div>
      `, "action-card")}
      ${card("今晚记录顺序", `
        <div class="care-order">
          <div><span>1</span><strong>20:00 复测体温</strong><p class="copy">记录体温和精神状态。</p></div>
          <div><span>2</span><strong>记录猫砂盆结果</strong><p class="copy">重点看是否顺利排泄。</p></div>
          <div><span>3</span><strong>补充剩余食物量</strong><p class="copy">为医生报告保留证据。</p></div>
        </div>
      `)}
    </div>
    <div class="grid three summary-grid record-doc">
      ${card("鱼丸档案", statGrid([
        ["年龄", pet.age],
        ["体重", pet.weight],
        ["类型", pet.type],
        ["基线", pet.status]
      ]) + `<div class="actions"><button class="ghost-btn" type="button" data-action="openProfile">编辑档案</button></div>`)}
      ${card("当前预警", listRows(data.alerts.map((item) => [item.title, `${item.value} · ${item.detail}`]), "openAlertDetail"), "warning")}
      ${card("设备状态", listRows(deviceRows()) + `<div class="actions"><button class="secondary-btn" type="button" data-action="syncDevices">立即同步</button></div>`)}
    </div>
  `;
}

function deviceRows() {
  return state.demo.deviceSynced
    ? [
        ["猫砂盆识别", "在线 · 刚刚同步"],
        ["智能食盆", "在线 · 本餐 62%"],
        ["体温贴", "在线 · 39.3°C"],
        ["饮水机", "在线 · 今日饮水偏少"]
      ]
    : data.devices;
}

function renderData() {
  const metric = data.metrics.find((item) => item.label === state.metric) ?? data.metrics[0];
  return html`
    <section class="card data-panel">
      <div class="metric-tabs">
        ${data.metrics.map((item) => html`
          <button class="metric-tab ${item.label === metric.label ? "active" : ""}" type="button" data-metric="${item.label}">${item.label}</button>
        `).join("")}
      </div>
      <div class="card-head">
        <div>
          <h2>${metric.label}趋势</h2>
          <p class="copy">${metric.range}</p>
        </div>
        <p class="score">${metric.value}</p>
      </div>
      <div class="chart-toolbar">
        <span>近 7 天</span>
        <span>鱼丸平时范围</span>
        <span>今天记录</span>
      </div>
      ${chart(metric)}
      <div class="chart-legend">
        <span><i></i>趋势</span>
        <span><i class="band"></i>平时范围</span>
        <span><i class="danger"></i>今天异常</span>
      </div>
      <div class="actions">
        <button class="secondary-btn" type="button" data-action="openDevice">管理设备</button>
        <button class="ghost-btn" type="button" data-action="openManualReading">手动录入</button>
        <button class="ghost-btn" type="button" data-action="openFeeding">喂养计划</button>
      </div>
    </section>
    <div class="grid three">
      ${card("数据质量", statGrid([
        ["同步状态", state.demo.deviceSynced ? "全部在线" : "正常"],
        ["补充读数", state.demo.manualReadingAdded ? "已录入" : "未补充"],
        ["最近同步", state.demo.deviceSynced ? "刚刚" : "2 分钟前"],
        ["错误状态", "无"]
      ]))}
      ${card("个体基线", statGrid([["活动", "62%"], ["进食", "48%"], ["体温", "35%"], ["预计完成", "2-9 天"]]))}
      ${card("当前喂养计划", statGrid([["每日热量", "246 kcal"], ["建议食量", "58g/日"], ["饮水提醒", "已开启"], ["复查", "每 7 天"]]))}
    </div>
  `;
}

function renderAlerts() {
  const completeCount = alertWorkflowSteps().filter((item) => item.done).length;
  return html`
    <div class="grid two">
    <section class="card warning">
      <div class="card-head">
        <div>
          <h2>综合健康预警</h2>
          <p class="copy">鱼丸出现多项轻中度异常信号，建议今天减少活动，并持续观察饮食、排泄和体温。</p>
        </div>
        <span class="pill warning">需留意</span>
      </div>
      ${listRows(data.alerts.map((item) => [item.title, `${item.value} · ${item.detail}`]), "openAlertDetail")}
      <h3>估计的可能症状</h3>
      <div class="chips">${data.possibleSymptoms.map((item) => `<span class="pill warning">${item}</span>`).join("")}</div>
      <div class="actions">
        <button class="primary-btn" type="button" data-action="openReport">生成就医报告</button>
        <button class="secondary-btn" type="button" data-action="openAppetite">记录食欲</button>
        <button class="ghost-btn" type="button" data-action="ackAlert">已知晓</button>
      </div>
    </section>
    ${card("预警处理流程", `
      <div class="progress-summary">
        <strong>${completeCount} / 4</strong>
        <span>处理步骤已完成</span>
      </div>
      <div class="workflow">
        ${alertWorkflowSteps().map((item, index) => html`
          <div class="workflow-step ${item.done ? "done" : ""}">
            <span>${index + 1}</span>
            <div><strong>${item.title}</strong><p class="copy">${item.detail}</p></div>
          </div>
        `).join("")}
      </div>
      <div class="actions">
        <button class="primary-btn" type="button" data-action="openManualReading">补充记录</button>
        <button class="ghost-btn" type="button" data-action="openCarePlan">继续观察</button>
      </div>
    `)}
    </div>
  `;
}

function alertWorkflowSteps() {
  return [
    { title: "识别异常", detail: "已完成 · 体温、进食、厕所信号同时触发", done: true },
    { title: "补充记录", detail: state.demo.appetiteRecorded || state.demo.manualReadingAdded ? "已完成 · 食欲/读数已补充" : "进行中 · 食欲、排泄、精神状态", done: state.demo.appetiteRecorded || state.demo.manualReadingAdded },
    { title: "生成报告", detail: state.demo.reportGenerated ? "已完成 · 报告已生成" : "待处理 · 给 XX 宠物医院", done: state.demo.reportGenerated },
    { title: "医生建议", detail: state.demo.doctorAdviceSent ? "已完成 · 医生建议已回传" : "待处理 · 等待机构回复", done: state.demo.doctorAdviceSent }
  ];
}

function renderCare() {
  return html`
    <div class="grid two">
      ${card("今日照护动作", taskRows() + `<div class="actions"><button class="primary-btn" type="button" data-action="completeCare">${state.demo.careCompleted ? "已安排" : "标记已安排"}</button></div>`)}
      ${card("观察计划", statGrid([["计划", "48 小时观察"], ["进度", state.demo.careCompleted ? "第 1 天 · 已执行" : "第 1 天"], ["升级条件", "排泄困难 / 体温升高"], ["状态", state.demo.doctorAdviceSent ? "医生已建议" : "执行中"]]) + `<div class="actions"><button class="secondary-btn" type="button" data-action="openCarePlan">查看计划</button></div>`, "tint")}
    </div>
    ${card("数据解释", `
      <div class="chat-panel" id="chat-panel">
        <div class="bubble">鱼丸今天出现频繁出入厕所、进食未完成和体温略高。建议记录排泄和晚间体温。</div>
        <div class="bubble owner">今天需要就医吗？</div>
        ${state.demo.ownerMessages.map((item) => `<div class="bubble ${item.from === "owner" ? "owner" : ""}">${item.text}</div>`).join("")}
      </div>
      <div class="actions">
        <button class="ghost-btn" type="button" data-chat="这些变化需要就医吗？">需要就医吗</button>
        <button class="ghost-btn" type="button" data-chat="帮我生成今天摘要">今日摘要</button>
      </div>
      <div class="chat-input">
        <input id="chat-input" value="今天精神怎么样？" aria-label="询问近期数据变化">
        <button class="primary-btn" type="button" data-action="sendChat">发送</button>
      </div>
    `)}
  `;
}

function taskRows() {
  return html`<div class="grid">${data.careTasks.map((item, index) => html`
    <button class="list-row ${state.demo.careCompleted ? "completed" : ""}" type="button" data-action="toggleCareTask" data-index="${index}">
      <strong>${state.demo.careCompleted ? "✓ " : ""}${item[0]}</strong>
      <span>${state.demo.careCompleted ? "已安排 · " : ""}${item[1]}</span>
    </button>
  `).join("")}</div>`;
}

function renderRecords() {
  return html`
    <div class="grid two">
      ${card("就医档案", listRows(data.records) + `<div class="actions"><button class="secondary-btn" type="button" data-action="openReport">生成报告</button></div>`)}
      ${card("长期风险", listRows([
        ["体重管理", "建议继续执行减重喂养计划"],
        ["关节负担", "关注活动量骤降和起身困难"],
        ["皮肤与耳部", "关注抓挠、甩头或异味"]
      ]), "tint")}
    </div>
  `;
}

function renderPrivacy() {
  return html`
    <div class="grid two">
      ${card("授权管理", listRows(grantRows()) + `<div class="actions"><button class="primary-btn" type="button" data-action="openGrant">授权合作机构</button><button class="ghost-btn" type="button" data-action="revokeGrant">撤回授权</button></div>`)}
      ${card("访问日志", listRows(accessLogRows()))}
    </div>
    ${card("数据权益", statGrid([["可导出", "档案 / 读数 / 预警 / 授权"], ["定位数据", "默认不共享"], ["数据包", state.demo.dataExported ? "已生成" : "可生成"], ["删除权", "支持申请"]]) + `<div class="actions"><button class="secondary-btn" type="button" data-action="exportData">${state.demo.dataExported ? "重新生成数据包" : "生成数据包"}</button></div>`)}
  `;
}

function grantRows() {
  return state.demo.grantActive ? data.grants : [["暂无授权机构", "医生端不可查看鱼丸数据"]];
}

function accessLogRows() {
  const rows = [...data.accessLogs];
  if (state.demo.reportShared) rows.unshift(["你分享了就医报告", "刚刚 · 报告权限"]);
  if (state.demo.doctorAdviceSent) rows.unshift(["张医生发送机构建议", "刚刚 · 机构建议"]);
  if (!state.demo.grantActive) rows.unshift(["你撤回机构授权", "刚刚 · 授权变更"]);
  return rows;
}

function renderClinic() {
  return html`
    <section class="card clinic-hero">
      <div>
        <p class="section-kicker">今日工作台</p>
        <h2>优先处理鱼丸的异常记录</h2>
        <p class="copy">主人已授权体征、报告和预警数据。当前重点查看厕所进出、进食完成度和体温曲线。</p>
      </div>
      <div class="clinic-metrics">
        ${doctorCohort().map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`).join("")}
      </div>
    </section>
    <div class="grid two doctor-layout record-doc">
      ${card("今日待处理队列", `
        <div class="queue-list">
          ${data.doctor.queue.map((item, index) => html`
            <button class="queue-row" type="button" data-action="openPatient" data-index="${item[3]}">
              <span class="queue-rank">${index + 1}</span>
              <div><strong>${item[0]}</strong><p class="copy">${item[1]}</p></div>
              <span class="muted">${item[2]}</span>
            </button>
          `).join("")}
        </div>
      `)}
      ${card("鱼丸健康摘要", `
        <p class="copy">${state.demo.reportShared ? "主人已分享报告，可查看完整时间线。" : "频繁出入厕所、进食未完成、体温略高。建议结合排泄和精神状态判断。"}</p>
        <div class="chips"><span class="pill">体征数据</span><span class="pill">就医报告</span><span class="pill">健康预警</span><span class="pill warning">无定位授权</span></div>
        <div class="actions"><button class="primary-btn" type="button" data-action="openDoctorReport">查看报告</button><button class="secondary-btn" type="button" data-action="sendAdvice">发送建议</button></div>
      `)}
    </div>
    ${card("授权宠物", listRows(data.doctor.patients, "openPatient"), "record-doc")}
  `;
}

function doctorCohort() {
  return [
    ["授权中", state.demo.grantActive ? "3" : "2"],
    ["需留意", state.demo.doctorAdviceSent ? "0" : "1"],
    ["报告待读", state.demo.reportShared ? "1" : "2"],
    ["本周异常", state.demo.alertAcknowledged ? "3" : "4"]
  ];
}

function renderPatients() {
  return html`
    <div class="grid two">
      ${card("授权宠物", listRows(data.doctor.patients, "openPatient"))}
      ${card("今日筛选", statGrid([["需先看", "鱼丸"], ["报告待读", "2 份"], ["复诊提醒", "1 条"], ["已回复", state.demo.doctorAdviceSent ? "1 条" : "0 条"]]))}
    </div>
  `;
}

function renderReports() {
  return html`
    <div class="grid two">
      ${card("报告列表", listRows([
        ["鱼丸 30 天就医报告", state.demo.reportGenerated ? "已生成 · 厕所进出、进食完成度、体温曲线和主人记录" : "待生成 · 需要主人分享"],
        ["汤圆健康摘要", "基线稳定，无明显异常"]
      ], "openDoctorReport"))}
      ${card("报告权限", statGrid([["体征", state.demo.grantActive ? "已授权" : "已撤回"], ["报告", state.demo.grantActive ? "已授权" : "已撤回"], ["定位", "未授权"], ["有效期", state.demo.grantActive ? "90 天" : "无"]]))}
    </div>
  `;
}

function renderAdvice() {
  return html`
    <section class="card">
      <h2>机构建议</h2>
      <p class="copy">建议内容会同步给主人端，并保留在授权记录下。</p>
      <textarea id="advice-input">建议今晚记录每次厕所结果、剩余食物量和体温。若频繁进出厕所持续、出现排泄困难、体温继续升高或精神明显变差，请尽快到院检查。</textarea>
      <div class="actions">
        <button class="primary-btn" type="button" data-action="sendAdvice">发送建议</button>
        <button class="ghost-btn" type="button" data-action="saveDraft">存为草稿</button>
      </div>
    </section>
  `;
}

function renderIntegration() {
  return html`
    <div class="grid two">
      ${card("机构设置", statGrid([["机构", "XX 宠物医院"], ["成员", "张医生 / 护士小林"], ["通知", "预警和报告"], ["状态", "已连接"]]))}
      ${card("通知检查", statGrid([["预警提醒", "已开启"], ["报告提醒", "已开启"], ["授权变更", "已开启"], ["最近检查", state.demo.webhookTested ? "刚刚" : "今天 10:21"]]) + `<div class="actions"><button class="primary-btn" type="button" data-action="checkNotification">检查通知连接</button></div>`)}
    </div>
  `;
}

function renderAudit() {
  return html`
    <div class="grid two">
      ${card("访问日志", listRows(data.accessLogs))}
      ${card("成员筛选", statGrid([["医生", "张医生"], ["护士", "小林"], ["操作", "查看 / 导出"], ["审计", "已记录"]]) + `<div class="actions"><button class="secondary-btn" type="button" data-action="filterAudit">仅看张医生</button></div>`)}
    </div>
  `;
}

const renderers = {
  overview: renderOverview,
  data: renderData,
  alerts: renderAlerts,
  care: renderCare,
  records: renderRecords,
  privacy: renderPrivacy,
  clinic: renderClinic,
  patients: renderPatients,
  reports: renderReports,
  advice: renderAdvice,
  integration: renderIntegration,
  audit: renderAudit
};

function render() {
  renderNav();
  const page = currentPages().find(([id]) => id === state.page);
  document.querySelector("#page-title").textContent = page ? page[1] : "宠伴";
  content.innerHTML = renderers[state.page]();
}

function openDrawer(title, kicker, body) {
  drawerTitle.textContent = title;
  drawerKicker.textContent = kicker;
  drawerBody.innerHTML = body;
  drawer.classList.add("open");
  drawer.setAttribute("aria-hidden", "false");
}

function closeDrawer() {
  drawer.classList.remove("open");
  drawer.setAttribute("aria-hidden", "true");
}

function formDrawer(title, fields, actionLabel, message) {
  openDrawer(title, "表单", html`
    ${fields.map((field) => html`
      <label class="grid">
        <span class="muted">${field[0]}</span>
        ${field[2] === "textarea" ? `<textarea>${field[1]}</textarea>` : `<input value="${field[1]}">`}
      </label>
    `).join("")}
    <button class="primary-btn" type="button" data-action="drawerSubmit" data-form="${title}" data-message="${message}">${actionLabel}</button>
  `);
}

function handleAction(action, target) {
  if (action === "closeDrawer") closeDrawer();
  if (action === "openProfile") formDrawer("编辑鱼丸档案", [["昵称", "鱼丸"], ["年龄", data.pet.age], ["体重", "6.8 kg"], ["类型", data.pet.type]], "保存档案", "档案已保存");
  if (action === "openGrant") formDrawer("授权合作机构", [["机构 ID", "partner-hospital-24"], ["有效期", "90 天"], ["授权范围", "体征数据 / 就医报告 / 健康预警"]], "确认授权", "授权已创建");
  if (action === "openReport") {
    updateDemo((demo) => {
      demo.reportGenerated = true;
      addTimeline(demo, "刚刚", "已生成 30 天就医报告。");
    });
    openReport("30 天就医报告", "主人端报告");
  }
  if (action === "openDoctorReport") openReport("医生端报告", "机构端报告");
  if (action === "openCarePlan") openDrawer("观察计划", "照护", listRows(data.careTasks) + `<div class="stat"><span>升级条件</span><strong>体温继续升高、排泄困难或精神明显变差</strong></div>`);
  if (action === "openDevice") formDrawer("管理设备", data.devices.map((item) => [item[0], item[1]]), "绑定设备", "设备已更新");
  if (action === "openManualReading") formDrawer("手动录入读数", [["指标", "进食完成度"], ["读数", "62%"], ["备注", "早餐剩余较多，精神一般"]], "记录", "读数已记录");
  if (action === "openFeeding") formDrawer("喂养计划", [["食物热量密度", "3600 kcal/kg"], ["目标体重", "6.2 kg"], ["计划", "温和控重"]], "保存计划", "喂养计划已保存");
  if (action === "openAppetite") formDrawer("记录食欲", [["本餐完成度", "62%"], ["精神状态", "一般"], ["备注", "晚间继续观察"]], "保存记录", "食欲记录已保存");
  if (action === "openNotifications") openDrawer("通知中心", "提醒", listRows([["年度疫苗", "7 天后"], ["体内外驱虫", "21 天后"], ["机构建议", "张医生刚刚发送"]]));
  if (action === "openGlobalSearch") formDrawer("搜索", [["关键词", "鱼丸 体温"]], "搜索", "已展示匹配结果");
  if (action === "ackAlert") updateDemo((demo) => {
    demo.alertAcknowledged = true;
    addTimeline(demo, "刚刚", "主人已确认本次健康预警。");
  }, "已确认，本次预警会保留在历史记录中");
  if (action === "completeCare" || action === "toggleCareTask") updateDemo((demo) => {
    demo.careCompleted = true;
    addTimeline(demo, "刚刚", "今日照护动作已安排。");
  }, "今日照护动作已安排");
  if (action === "revokeGrant") updateDemo((demo) => {
    demo.grantActive = false;
    addTimeline(demo, "刚刚", "已撤回 XX 宠物医院授权。");
  }, "授权已撤回");
  if (action === "exportData") updateDemo((demo) => {
    demo.dataExported = true;
  }, "数据包已生成：yuwan-export-demo.zip");
  if (action === "sendAdvice") updateDemo((demo) => {
    demo.doctorAdviceSent = true;
    demo.ownerMessages.push({ from: "pet", text: "张医生建议今晚记录每次厕所结果、剩余食物量和体温；如排泄困难或体温继续升高，请尽快到院。" });
    addTimeline(demo, "刚刚", "张医生已发送机构建议。");
  }, "建议已发送，主人端会收到机构建议提醒");
  if (action === "saveDraft") showToast("草稿已保存");
  if (action === "checkNotification") updateDemo((demo) => {
    demo.webhookTested = true;
  }, "通知连接正常");
  if (action === "filterAudit") showToast("已切换为张医生访问记录");
  if (action === "syncDevices") updateDemo((demo) => {
    demo.deviceSynced = true;
    addTimeline(demo, "刚刚", "所有设备已完成同步。");
  }, "设备已同步");
  if (action === "shareReport") updateDemo((demo) => {
    demo.reportGenerated = true;
    demo.reportShared = true;
    demo.grantActive = true;
    addTimeline(demo, "刚刚", "已将就医报告分享给 XX 宠物医院。");
  }, "报告已分享给 XX 宠物医院");
  if (action === "shareReport") closeDrawer();
  if (action === "resetDemo") {
    sessionStorage.removeItem("chongban-demo-state");
    state.demo = defaultDemoState();
    render();
    showToast("演示状态已重置");
  }
  if (action === "sendChat") sendChat();
  if (action === "drawerSubmit") {
    applyFormSubmit(target.dataset.form);
    showToast(target.dataset.message);
    closeDrawer();
  }
}

function addTimeline(demo, time, text) {
  if (!demo.timeline.some((item) => item[1] === text)) demo.timeline.unshift([time, text]);
}

function applyFormSubmit(formName) {
  updateDemo((demo) => {
    if (formName === "记录食欲") {
      demo.appetiteRecorded = true;
      addTimeline(demo, "刚刚", "已补充食欲记录：本餐完成度 62%，精神状态一般。");
    }
    if (formName === "手动录入读数") {
      demo.manualReadingAdded = true;
      addTimeline(demo, "刚刚", "已手动录入进食完成度读数。");
    }
    if (formName === "管理设备") {
      demo.deviceSynced = true;
      addTimeline(demo, "刚刚", "设备绑定信息已更新。");
    }
    if (formName === "授权合作机构") {
      demo.grantActive = true;
      addTimeline(demo, "刚刚", "已授权 XX 宠物医院查看体征、报告和健康预警。");
    }
  });
}

function openReport(title, kicker) {
  openDrawer(title, kicker, html`
    ${statGrid([
      ["异常次数", "1 次"],
      ["体温峰值", "39.3°C"],
      ["本餐完成度", "62%"],
      ["厕所进出", "7 次/6 小时"]
    ])}
    <div class="timeline">
      ${state.demo.timeline.map((item) => html`<div class="timeline-item"><span class="dot"></span><div><strong>${item[0]}</strong><p class="copy">${item[1]}</p></div></div>`).join("")}
    </div>
    <button class="primary-btn" type="button" data-action="shareReport">分享报告</button>
  `);
}

function openAlertDetail(index) {
  const alert = data.alerts[index];
  openDrawer(alert.title, "预警依据", html`
    <div class="stat"><span>当前读数</span><strong>${alert.value}</strong></div>
    <p class="copy">${alert.detail}</p>
    <h3>可能方向</h3>
    <div class="chips">${data.possibleSymptoms.map((item) => `<span class="pill warning">${item}</span>`).join("")}</div>
    <button class="primary-btn" type="button" data-action="openReport">生成就医报告</button>
  `);
}

function openPatient(index) {
  const patient = data.doctor.patients[index];
  openDrawer(patient[0], "授权宠物详情", html`
    ${statGrid([["状态", patient[2]], ["授权", "体征 / 报告 / 预警"], ["最近体温", "39.3°C"], ["进食完成度", "62%"]])}
    <p class="copy">${patient[1]}</p>
    <button class="primary-btn" type="button" data-action="openDoctorReport">查看完整报告</button>
  `);
}

function sendChat(preset) {
  const panel = document.querySelector("#chat-panel");
  const input = document.querySelector("#chat-input");
  const text = preset ?? input?.value.trim();
  if (!panel || !text) return;
  state.demo.ownerMessages.push({ from: "owner", text });
  panel.insertAdjacentHTML("beforeend", `<div class="bubble owner">${text}</div>`);
  const reply = text.includes("摘要")
    ? "今日摘要：食欲下降、厕所进出变多、体温略高。建议晚间复测体温并记录排泄结果。"
    : "目前建议先严密观察；如果 24 小时内仍频繁进出厕所、排泄困难、体温继续升高或精神明显变差，就尽快就医。";
  state.demo.ownerMessages.push({ from: "pet", text: reply });
  saveDemoState();
  panel.insertAdjacentHTML("beforeend", `<div class="bubble">${reply}</div>`);
  if (input) input.value = "";
}

document.addEventListener("click", (event) => {
  const roleButton = event.target.closest("[data-role]");
  if (roleButton) setRole(roleButton.dataset.role);

  const pageButton = event.target.closest("[data-page]");
  if (pageButton) setPage(pageButton.dataset.page);

  const metricButton = event.target.closest("[data-metric]");
  if (metricButton) {
    state.metric = metricButton.dataset.metric;
    render();
  }

  const alertButton = event.target.closest("[data-action='openAlertDetail']");
  if (alertButton) openAlertDetail(Number(alertButton.dataset.index));

  const patientButton = event.target.closest("[data-action='openPatient']");
  if (patientButton) openPatient(Number(patientButton.dataset.index));

  const actionButton = event.target.closest("[data-action]");
  if (actionButton && !["openAlertDetail", "openPatient"].includes(actionButton.dataset.action)) {
    handleAction(actionButton.dataset.action, actionButton);
  }

  const chatButton = event.target.closest("[data-chat]");
  if (chatButton) sendChat(chatButton.dataset.chat);

  if (event.target === drawer) closeDrawer();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeDrawer();
  if (event.key === "Enter" && event.target.id === "chat-input") sendChat();
});

setRole("owner");
