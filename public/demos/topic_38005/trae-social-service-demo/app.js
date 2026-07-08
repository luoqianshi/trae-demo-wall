const services = [
  {
    id: "residence",
    icon: "住",
    title: "居住证办理",
    desc: "适合租住、就业、子女入学等需要证明常住信息的居民。",
    time: "预计 6 分钟",
    window: "社区综合窗口",
    docs: [
      ["身份证原件", "需与申请人本人一致"],
      ["居住地址证明", "租房合同、房产证明或单位宿舍证明均可"],
      ["近期证件照", "建议白底或蓝底电子版"],
      ["就业或就读证明", "可选，能提高审核通过率"]
    ],
    defaultScenario: "我在本社区租房满 8 个月，想办理居住证，房东暂时不在本地。",
    script: "您好，我想办理居住证。身份证和证件照已准备，居住地址证明目前是租房合同，请帮我确认是否还需要房东补充签字或社区核验。"
  },
  {
    id: "medical",
    icon: "医",
    title: "医保零星报销",
    desc: "适合异地就医、门诊急诊、未联网结算后的材料预检查。",
    time: "预计 8 分钟",
    window: "医保经办窗口",
    docs: [
      ["医保电子凭证或社保卡", "用于核验参保身份"],
      ["医疗费用发票", "需保留发票原件或电子票据"],
      ["费用明细清单", "医院盖章或电子明细均可"],
      ["诊断证明或病历", "门急诊和住院材料不同"]
    ],
    defaultScenario: "我上个月在外地急诊，没有直接刷医保，想回来报销。",
    script: "您好，我需要办理医保零星报销。医保凭证、发票和费用明细已准备，想确认急诊病历是否可以用电子版提交。"
  },
  {
    id: "senior",
    icon: "老",
    title: "老年优待卡",
    desc: "适合老年人办理公共交通、文化场馆等本地优待服务。",
    time: "预计 5 分钟",
    window: "民生服务窗口",
    docs: [
      ["身份证原件", "核验年龄与户籍信息"],
      ["近期免冠照片", "用于制卡"],
      ["户口簿或居住证明", "非本地户籍需补充"],
      ["代办委托说明", "家属代办时需要"]
    ],
    defaultScenario: "我想帮父亲办理老年优待卡，他行动不方便，准备由我代办。",
    script: "您好，我为家人代办老年优待卡。身份证、照片和居住证明已准备，请确认是否需要本人到场或填写代办委托。"
  },
  {
    id: "subsidy",
    icon: "补",
    title: "灵活就业社保补贴",
    desc: "适合灵活就业人员提前确认资格、社保缴费和申请材料。",
    time: "预计 10 分钟",
    window: "就业服务窗口",
    docs: [
      ["身份证原件", "核验申请人身份"],
      ["就业困难认定材料", "不同城市条件不同"],
      ["社保缴费记录", "建议准备近 6 个月记录"],
      ["银行卡信息", "用于补贴发放"]
    ],
    defaultScenario: "我做自由职业，连续缴纳社保 7 个月，想申请灵活就业社保补贴。",
    script: "您好，我想申请灵活就业社保补贴。身份证、社保缴费记录和银行卡已准备，请帮我确认是否需要先做就业困难认定。"
  }
];

let selectedService = services[0];
let checkedDocs = new Set([0, 2]);
let currentView = "services";
let lastAnalysis = null;

const serviceList = document.querySelector("#serviceList");
const docList = document.querySelector("#docList");
const scenarioInput = document.querySelector("#scenarioInput");
const selectedServiceLabel = document.querySelector("#selectedServiceLabel");
const progressTitle = document.querySelector("#progressTitle");
const progressSub = document.querySelector("#progressSub");
const progressRing = document.querySelector("#progressRing");
const resultHeadline = document.querySelector("#resultHeadline");
const resultStatus = document.querySelector("#resultStatus");
const checklistList = document.querySelector("#checklistList");
const riskBadge = document.querySelector("#riskBadge");
const scriptText = document.querySelector("#scriptText");
const workerQueue = document.querySelector("#workerQueue");
const metricTotal = document.querySelector("#metricTotal");
const metricRisk = document.querySelector("#metricRisk");
const citizenHero = document.querySelector("#citizenHero");
const workerHero = document.querySelector("#workerHero");

function renderServices() {
  serviceList.innerHTML = "";
  services.forEach((service) => {
    const button = document.createElement("button");
    button.className = `service-card${service.id === selectedService.id ? " is-selected" : ""}`;
    button.type = "button";
    button.innerHTML = `
      <span class="service-icon" aria-hidden="true">${service.icon}</span>
      <span>
        <h3>${service.title}</h3>
        <p>${service.desc}</p>
        <span class="service-meta">
          <span>${service.time}</span>
          <span>${service.window}</span>
        </span>
      </span>
    `;
    button.addEventListener("click", () => selectService(service.id));
    serviceList.appendChild(button);
  });
}

function selectService(serviceId) {
  selectedService = services.find((service) => service.id === serviceId) || services[0];
  checkedDocs = new Set([0]);
  lastAnalysis = null;
  scenarioInput.value = selectedService.defaultScenario;
  renderServices();
  renderDocs();
  updateProgress();
  renderResult();
  switchView("precheck");
}

function renderDocs() {
  selectedServiceLabel.textContent = selectedService.title;
  docList.innerHTML = "";
  selectedService.docs.forEach(([name, note], index) => {
    const card = document.createElement("article");
    card.className = "doc-card";
    card.innerHTML = `
      <div>
        <h3>${name}</h3>
        <p>${note}</p>
      </div>
      <button class="check-switch${checkedDocs.has(index) ? " is-on" : ""}" type="button" aria-label="切换 ${name}">
        <span></span>
      </button>
    `;
    card.querySelector("button").addEventListener("click", () => {
      if (checkedDocs.has(index)) {
        checkedDocs.delete(index);
      } else {
        checkedDocs.add(index);
      }
      lastAnalysis = null;
      renderDocs();
      updateProgress();
      renderResult();
    });
    docList.appendChild(card);
  });
}

function updateProgress() {
  const total = selectedService.docs.length;
  const ready = checkedDocs.size;
  const percent = Math.round((ready / total) * 100);
  progressRing.textContent = `${percent}%`;
  progressRing.style.background = `conic-gradient(var(--green) ${percent * 3.6}deg, #e8efec 0deg)`;
  progressTitle.textContent = `${selectedService.title}材料完整度`;
  progressSub.textContent = ready === total ? "材料已齐，可直接前往窗口" : `还缺 ${total - ready} 项关键材料`;
}

// ==================== Session 3: 预审逻辑优化 ====================

const DISCLAIMER = "（仅作预审参考，最终以窗口要求为准）";

/* 场景关键词识别：代办、异地、电子材料、不在本地、老人行动不便 */
function getScenarioRisks(text) {
  const risks = [];

  if (/代办|代[办交跑]|替[人我他]|帮[人我他忙]|委托人|受托人|替办/.test(text)) {
    risks.push({
      tag: "代办",
      tip: "代办人需携带本人身份证原件及申请人签署的授权委托书（可现场领取或提前打印）。部分事项要求申请人本人到场，建议提前电话确认。"
    });
  }

  if (/外地|异地|不在本[地市]|跨[省市区]|外[省市区]|回老家|返乡/.test(text)) {
    risks.push({
      tag: "异地",
      tip: "异地办理可能需额外提供本地居住证明或异地备案材料，建议提前电话咨询窗口确认是否接受跨地区材料。"
    });
  }

  if (/电子[版档件票据]|拍照|截图|扫描|手机拍|相册|照片上传|电子版/.test(text)) {
    risks.push({
      tag: "电子材料",
      tip: "部分窗口仅接受原件或盖章纸质复印件，手机拍照/截图可能不被认可。建议先打印纸质版并携带原件备查。"
    });
  }

  if (/老人|行动不[便利]|腿脚|年迈|高龄|[67七八九][0-9]岁|不便[于行]走路|行动困难|卧床|轮椅|出行不便/.test(text)) {
    risks.push({
      tag: "行动不便",
      tip: "如申请人行动不便，可联系社区网格员预约上门帮办服务，或授权家属代办（需双方身份证及授权书）。"
    });
  }

  if (/不[在]本地|外出|还没回[来到]|暂时[不未]在|人在外/.test(text) && !risks.find(r => r.tag === "异地")) {
    risks.push({
      tag: "不在本地",
      tip: "您当前不在本地，建议先联系窗口确认是否支持邮寄办理或线上提交，避免白跑。"
    });
  }

  return risks;
}

/* 逐项材料的补材料建议（针对不同办事事项） */
function getSpecificSuggestion(serviceId, docName) {
  const map = {
    residence: {
      "身份证原件": "请确认身份证在有效期内，正反面信息清晰可辨。",
      "居住地址证明": "租房合同需包含房东签字与联系方式；单位宿舍证明需加盖单位公章。",
      "近期证件照": "建议白底或蓝底1寸免冠照，生活照、自拍照不符合制证要求。",
      "就业或就读证明": "在职证明需含公司公章，学生证需在有效期内且已注册。"
    },
    medical: {
      "医保电子凭证或社保卡": "请确认医保处于正常参保状态，电子凭证可在'国家医保服务平台'激活。",
      "医疗费用发票": "发票原件需清晰完整，电子票据需打印并保留原始文件备查。",
      "费用明细清单": "清单需医院盖章，至少包含药品名称、单价、数量三项信息。",
      "诊断证明或病历": "门诊需门诊病历，住院需出院小结及完整病历复印件。"
    },
    senior: {
      "身份证原件": "确认年龄符合当地政策（通常60周岁及以上）。",
      "近期免冠照片": "1寸白底免冠彩照2张，用于制卡及存档，不可使用生活照。",
      "户口簿或居住证明": "非本地户籍需提供有效期内的居住证或居住登记凭证。",
      "代办委托说明": "代办人需携带本人身份证原件，现场签署代办承诺书。"
    },
    subsidy: {
      "身份证原件": "确认身份证地址与补贴申请地一致，不一致需补充居住证明。",
      "就业困难认定材料": "需先到户籍地或常住地社区进行就业困难认定，取得《就业创业证》。",
      "社保缴费记录": "可通过当地人社APP或社保大厅自助机打印近6个月缴费记录。",
      "银行卡信息": "银行卡需为本人名下借记卡，建议使用四大行卡以确保发放顺畅。"
    }
  };
  return map[serviceId]?.[docName] || null;
}

/* 动态沟通话术生成 */
function generateTalkScript(text, isComplete) {
  const lines = [];

  if (isComplete) {
    lines.push(`您好，我来办理${selectedService.title}，材料已按清单全部准备齐全，请帮我核验。`);
  } else {
    lines.push(`您好，我来办理${selectedService.title}，已按预审清单准备了部分材料。`);

    if (/代办|替|帮.*办|委托/.test(text)) {
      lines.push("我是代办人，这是我的身份证和授权委托书，请查收。");
    }
    if (/外地|异地|外省/.test(text)) {
      lines.push("因异地原因，部分材料为异地获取，请帮忙确认是否可用。");
    }
    if (/老人|行动|不便|上门/.test(text)) {
      lines.push("申请人行动不便由我代办，如有需要可请社区协助上门服务。");
    }

    lines.push("如有缺失材料请告知具体要求，我尽快补交。");
  }

  return lines.join("");
}

/* 生成 3~5 条一页式办事清单 */
function buildChecklist(text, missing) {
  const items = [];
  const total = selectedService.docs.length;
  const ready = total - missing.length;
  const isComplete = missing.length === 0;

  // 第1条：材料完整度判断
  items.push({
    icon: isComplete ? "✅" : "⚠",
    title: "材料完整度",
    body: isComplete
      ? `基础材料已齐备（${ready}/${total}），建议携带所有材料原件并保留电子备份，可直接前往窗口办理。<br><br>${DISCLAIMER}`
      : `已准备 ${ready}/${total} 项，还缺 ${missing.length} 项：${missing.map(m => `<b>${m.name}</b>`).join("、")}。<br><br>${DISCLAIMER}`,
    status: isComplete ? "ok" : "warn"
  });

  // 第2条：补材料具体要求（仅缺失时）
  if (missing.length > 0) {
    const lines = missing.map(m => {
      const s = getSpecificSuggestion(selectedService.id, m.name);
      return `· <b>${m.name}</b>：${s || "请按窗口要求准备原件和复印件。"}`;
    }).join("<br>");

    items.push({
      icon: "📋",
      title: "补材料具体要求",
      body: `${lines}<br><br>${DISCLAIMER}`,
      status: "warn"
    });
  }

  // 第3条：场景识别与风险提醒
  const risks = getScenarioRisks(text);
  if (risks.length > 0) {
    const riskLines = risks.map(r => `· <b>[${r.tag}]</b> ${r.tip}`).join("<br>");
    items.push({
      icon: "🔍",
      title: "场景识别与风险提醒",
      body: `识别到以下特殊情况：<br>${riskLines}<br><br>${DISCLAIMER}`,
      status: "warn"
    });
  } else {
    items.push({
      icon: "🔍",
      title: "场景识别与风险提醒",
      body: `未识别到代办、异地、电子材料等特殊情况。如实际存在特殊情形，请在输入框中补充描述。<br><br>${DISCLAIMER}`,
      status: "ok"
    });
  }

  // 第4条：办事指引
  items.push({
    icon: "📍",
    title: "办事指引",
    body: `办理窗口：${selectedService.window}<br>预计耗时：${selectedService.time}<br>建议提前致电确认办公时间和排队情况。<br><br>${DISCLAIMER}`,
    status: "ok"
  });

  // 第5条：窗口沟通话术
  const script = generateTalkScript(text, isComplete);
  items.push({
    icon: "💬",
    title: "窗口沟通话术",
    body: `${script}<br><br>${DISCLAIMER}`,
    status: "tip"
  });

  return items; // 始终 4~5 条
}

/* 预审分析入口 */
function analyze() {
  const missing = selectedService.docs
    .map(([name], index) => ({ name, index }))
    .filter((item) => !checkedDocs.has(item.index));
  const text = scenarioInput.value.trim();

  const checklist = buildChecklist(text, missing);

  lastAnalysis = {
    missing,
    risk: missing.length > 1 ? "high" : missing.length === 1 ? "medium" : "low",
    checklist,
    scenarioText: text
  };
  renderResult();
  renderWorkerQueue();
  switchView("result");
}

/* 渲染一页式办事清单 */
function renderResult() {
  const total = selectedService.docs.length;
  const missing = lastAnalysis
    ? lastAnalysis.missing
    : selectedService.docs.map(([name], index) => ({ name, index })).filter((item) => !checkedDocs.has(item.index));
  const readyCount = total - missing.length;

  resultStatus.textContent = lastAnalysis ? "已生成" : "预览";

  if (missing.length === 0) {
    resultHeadline.textContent = "材料齐备，可预约办理";
    riskBadge.textContent = "低风险";
    riskBadge.className = "badge ok";
  } else if (missing.length === 1) {
    resultHeadline.textContent = "基本可办，需补 1 项";
    riskBadge.textContent = "需补充";
    riskBadge.className = "badge warn";
  } else {
    resultHeadline.textContent = `暂缓前往，还缺 ${missing.length} 项`;
    riskBadge.textContent = "高风险";
    riskBadge.className = "badge warn";
  }

  // 渲染结构化清单
  checklistList.innerHTML = "";
  const items = lastAnalysis
    ? lastAnalysis.checklist
    : [{
      icon: "📝",
      title: "待生成",
      body: `选择办事事项并补充你的情况后，点击"生成预审建议"即可查看 3~5 条一页式办事清单。<br><br>${DISCLAIMER}`,
      status: "ok"
    }];

  items.forEach((item, i) => {
    const div = document.createElement("div");
    div.className = `checklist-item${item.status === "warn" ? " is-warn" : ""}${item.status === "tip" ? " is-tip" : ""}`;
    div.innerHTML = `
      <div class="item-head">
        <span class="item-num">${i + 1}</span>
        <span class="item-icon">${item.icon}</span>
        <span class="item-title">${item.title}</span>
      </div>
      <div class="item-body">${item.body}</div>
    `;
    checklistList.appendChild(div);
  });

  scriptText.textContent = lastAnalysis
    ? generateTalkScript(lastAnalysis.scenarioText || "", missing.length === 0)
    : selectedService.script;
}

/* 社区端概览：动态同步待补材料 + 高优先级 + 今日预审数 */
function renderWorkerQueue() {
  // 背景模拟数据（其他居民）
  const bgRecords = [
    { title: "居住证办理", desc: "张先生 - 居住地址证明缺失，无房东签字 - 已推送提醒", priority: "高", tag: "异地" },
    { title: "医保零星报销", desc: "王女士 - 费用明细清单缺医院盖章 - 已提醒补盖章后办理", priority: "中", tag: "电子材料" },
    { title: "老年优待卡", desc: "李爷爷 - 代办场景，代办人未带本人身份证 - 已提醒并推送模板消息", priority: "高", tag: "代办·老人" },
    { title: "灵活就业社保补贴", desc: "赵先生 - 未做就业困难认定 - 已推送认定流程指引", priority: "中", tag: "补材料" }
  ];

  let records = [...bgRecords];

  // 用户当前预审结果动态插入（置顶）
  if (lastAnalysis) {
    const missingNames = lastAnalysis.missing.map(m => m.name).join("、");
    const userDesc = lastAnalysis.missing.length === 0
      ? `当前居民 - 材料完整，建议前往${selectedService.window}办理`
      : `当前居民 - 缺${lastAnalysis.missing.length}项（${missingNames}），已推送补材料提醒`;

    records.unshift({
      title: selectedService.title,
      desc: userDesc,
      priority: lastAnalysis.risk === "high" ? "高" : "中",
      tag: lastAnalysis.missing.length > 0 ? "待补材料" : "材料齐备",
      isCurrent: true
    });
  }

  // 指标计算
  const highCount = records.filter(r => r.priority === "高").length;
  metricTotal.textContent = String(lastAnalysis ? 13 : 12);
  metricRisk.textContent = String(highCount);
  workerQueue.innerHTML = "";

  records.forEach(({ title, desc, priority, tag, isCurrent }) => {
    const card = document.createElement("article");
    card.className = `queue-card${isCurrent ? " is-relevant" : ""}`;
    card.innerHTML = `
      <header>
        <h3>${title} ${isCurrent ? " ← 当前" : ""}</h3>
        <span class="priority ${priority === "高" ? "is-high" : "is-mid"}">${priority}优先级</span>
      </header>
      <p>${desc}</p>
      <span class="queue-tag">${tag}</span>
    `;
    workerQueue.appendChild(card);
  });
}

function switchView(viewName) {
  currentView = viewName;
  document.querySelectorAll(".view").forEach((view) => {
    view.classList.toggle("is-active", view.id === `${viewName}View`);
  });
  document.querySelectorAll(".tab, .bottom-item").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.view === viewName);
  });
  const workerMode = viewName === "worker";
  citizenHero.classList.toggle("is-hidden", workerMode);
  workerHero.classList.toggle("is-hidden", !workerMode);
}

document.querySelectorAll("[data-view]").forEach((button) => {
  button.addEventListener("click", () => switchView(button.dataset.view));
});

document.querySelector("#analyzeBtn").addEventListener("click", analyze);

document.querySelector("#copyScriptBtn").addEventListener("click", async () => {
  const text = scriptText.textContent;
  try {
    await navigator.clipboard.writeText(text);
    scriptText.textContent = "已复制：" + text;
  } catch {
    scriptText.textContent = text;
  }
});

document.querySelector("#roleToggle").addEventListener("click", () => {
  switchView(currentView === "worker" ? "services" : "worker");
});

scenarioInput.value = selectedService.defaultScenario;
renderServices();
renderDocs();
updateProgress();
renderResult();
renderWorkerQueue();
