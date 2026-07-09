const sourceText = document.querySelector("#sourceText");
const audience = document.querySelector("#audience");
const scene = document.querySelector("#scene");
const form = document.querySelector("#repairForm");
const result = document.querySelector("#result");
const outputTitle = document.querySelector("#outputTitle");
const readScore = document.querySelector("#readScore");
const actionScore = document.querySelector("#actionScore");
const riskCount = document.querySelector("#riskCount");
const copyResult = document.querySelector("#copyResult");
const toast = document.querySelector("#toast");
const loadSampleHero = document.querySelector("#loadSampleHero");

const samples = {
  community: {
    scene: "community",
    text: "请相关住户于本周五前携带有效证件至物业服务中心完成信息核验，逾期将影响后续办理。"
  },
  hospital: {
    scene: "hospital",
    text: "请复诊患者于检查当日先至自助机完成签到缴费，再前往二楼检验科采样，报告出具后按门诊安排复查。"
  },
  gov: {
    scene: "gov",
    text: "申请人需携带本人身份证、户口簿及相关证明材料，于工作日至综合窗口提交申请，材料不齐的不予受理。"
  },
  school: {
    scene: "school",
    text: "请家长于本周三前完成学生信息确认，并将纸质回执交至班主任处，未按时提交将影响后续活动安排。"
  }
};

const audienceLabels = {
  normal: "普通人版说明书",
  elder: "老人版说明书",
  outsider: "外地人版说明书",
  student: "学生版待办单",
  publisher: "发布者修复报告"
};

const sceneDefaults = {
  community: {
    place: "物业服务中心或社区服务点",
    contact: "物业前台或社区工作人员",
    object: "相关居民"
  },
  hospital: {
    place: "医院门诊楼、检验科或自助机区域",
    contact: "导诊台或挂号窗口",
    object: "复诊患者"
  },
  gov: {
    place: "政务服务中心综合窗口",
    contact: "综合窗口工作人员",
    object: "申请人"
  },
  school: {
    place: "班主任处或学校指定提交点",
    contact: "班主任或教务老师",
    object: "学生家长或学生本人"
  },
  transport: {
    place: "车站服务台或现场指引处",
    contact: "车站工作人员",
    object: "乘客"
  }
};

function includesAny(text, keys) {
  return keys.some((key) => text.includes(key));
}

function extractInfo(text) {
  const chosenScene = sceneDefaults[scene.value];
  const timeMatch = text.match(/(本周[一二三四五六日天]|周[一二三四五六日天]|工作日|检查当日|当日|规定时间|月底前|[0-9]{1,2}月[0-9]{1,2}日|[0-9]{1,2}[:：][0-9]{2})/);
  const placeMatch = text.match(/(物业服务中心|社区服务点|综合窗口|二楼检验科|检验科|门诊|班主任处|自助机|服务台|窗口|学校|医院|大厅)/);
  const materialWords = [];
  ["身份证", "户口簿", "证明材料", "有效证件", "回执", "报告", "申请表", "缴费凭证"].forEach((word) => {
    if (text.includes(word)) materialWords.push(word);
  });

  const action = inferAction(text);
  const risks = inferRisks(text);
  const questions = buildQuestions(text, risks);

  return {
    action,
    time: timeMatch ? timeMatch[0] : "原文没有写清楚具体时间",
    place: placeMatch ? placeMatch[0] : chosenScene.place,
    materials: materialWords.length ? materialWords : ["原文没有写清楚全部材料"],
    object: inferObject(text, chosenScene.object),
    contact: chosenScene.contact,
    risks,
    questions
  };
}

function inferAction(text) {
  if (includesAny(text, ["信息核验", "核验"])) return "完成个人信息核验";
  if (includesAny(text, ["复查", "复诊"])) return "按医院流程完成复查";
  if (includesAny(text, ["提交申请", "不予受理", "材料"])) return "准备材料并提交申请";
  if (includesAny(text, ["回执", "家长", "班主任"])) return "确认学生信息并提交回执";
  if (includesAny(text, ["签到", "缴费"])) return "先签到缴费，再按地点办理下一步";
  return "按通知要求完成指定事项";
}

function inferObject(text, fallback) {
  if (text.includes("住户")) return "相关住户";
  if (text.includes("患者")) return "复诊患者";
  if (text.includes("申请人")) return "申请人";
  if (text.includes("家长")) return "学生家长";
  return fallback;
}

function inferRisks(text) {
  const risks = [];
  if (includesAny(text, ["相关", "后续办理", "规定时间", "相关证明材料", "按门诊安排"])) {
    risks.push("原文有模糊词，用户可能不知道自己是否属于办理对象，或不知道影响哪个后续事项。");
  }
  if (!includesAny(text, ["电话", "联系", "咨询", "前台", "窗口", "班主任"])) {
    risks.push("原文缺少明确咨询方式，看不懂时不知道该问谁。");
  }
  if (!includesAny(text, ["地点", "中心", "窗口", "科", "班主任处", "自助机", "服务台"])) {
    risks.push("办理地点不够具体，用户可能到现场后继续找人问路。");
  }
  if (!includesAny(text, ["身份证", "户口簿", "证件", "材料", "回执", "报告", "凭证"])) {
    risks.push("材料要求不清楚，可能导致用户白跑一趟。");
  }
  if (!includesAny(text, ["补办", "逾期", "错过", "不予受理", "影响"])) {
    risks.push("没有说明错过或材料不齐后的处理方式。");
  }
  return risks;
}

function buildQuestions(text, risks) {
  const questions = [];
  if (text.includes("相关")) questions.push("我是否属于这次通知里的“相关人员”？");
  if (text.includes("后续办理")) questions.push("会影响哪个具体业务？错过以后能补办吗？");
  if (text.includes("材料") || text.includes("证件")) questions.push("除了原文提到的材料，还需要复印件或照片吗？");
  if (risks.some((risk) => risk.includes("咨询方式"))) questions.push("如果我看不懂，应该联系哪个电话或窗口？");
  if (questions.length === 0) questions.push("这件事最晚什么时候办完？材料不齐能不能先受理？");
  return questions;
}

function buildManual(info) {
  const prefix = audience.value === "elder" ? "请你这样做" : audience.value === "student" ? "你的待办事项" : "你现在要做什么";
  const shortStyle = audience.value === "elder";
  const outsiderNote = audience.value === "outsider" ? `<li>如果不熟悉地点，先到${info.contact}问“${info.place}怎么走”。</li>` : "";

  return `
    <section class="manual-block">
      <span class="tag">${audienceLabels[audience.value]}</span>
      <h4>${prefix}</h4>
      <ol>
        <li>${shortStyle ? "先确认你是不是办理对象。" : `确认自己是否属于“${info.object}”。`}</li>
        <li>${shortStyle ? `在${info.time}之前去办理。` : `在 ${info.time} 之前，前往 ${info.place}。`}</li>
        <li>${shortStyle ? "带上材料。" : `带上：${info.materials.join("、")}。`}</li>
        <li>${shortStyle ? "到现场后说明你要办什么。" : `到现场后直接说：“我要${info.action}。”`}</li>
        ${outsiderNote}
      </ol>
    </section>
  `;
}

function buildRiskBlock(info) {
  return `
    <section class="manual-block">
      <span class="tag warn">容易踩坑</span>
      <h4>原文里还不够清楚的地方</h4>
      <ul class="issue-list">
        ${info.risks.map((risk) => `<li>${risk}</li>`).join("")}
      </ul>
    </section>
  `;
}

function buildQuestionBlock(info) {
  return `
    <section class="manual-block">
      <span class="tag">可以这样问</span>
      <h4>如果现场或电话咨询，直接问这些话</h4>
      <ul>
        ${info.questions.map((question) => `<li>${question}</li>`).join("")}
      </ul>
    </section>
  `;
}

function buildPublisherBlock(info) {
  const materials = info.materials.includes("原文没有写清楚全部材料") ? "请列出完整材料名称，说明是否需要原件、复印件或照片。" : `材料写为：${info.materials.join("、")}，建议补充是否需要复印件。`;
  return `
    <section class="manual-block">
      <span class="tag">发布者版</span>
      <h4>这段通知建议这样改</h4>
      <p>请把通知改成“谁、什么时候前、去哪里、带什么、办什么、错过怎么办、问谁”七个要素。</p>
      <ol>
        <li>办理对象：${info.object}。</li>
        <li>办理时间：${info.time}。</li>
        <li>办理地点：${info.place}。</li>
        <li>${materials}</li>
        <li>咨询方式：建议补充电话、窗口或负责人。</li>
        <li>逾期影响：请写清楚影响的具体业务，以及是否能补办。</li>
      </ol>
    </section>
  `;
}

function buildReadableRewrite(info) {
  return `
    <section class="manual-block">
      <span class="tag">修复后通知</span>
      <h4>更像“人能看懂”的版本</h4>
      <p>${info.object}请在${info.time}前，到${info.place}${info.action}。请带上${info.materials.join("、")}。如果不确定自己是否需要办理，或不清楚逾期影响，请先咨询${info.contact}。</p>
    </section>
  `;
}

function scoreText(info, text) {
  let riskPenalty = Math.min(info.risks.length * 8, 36);
  let lengthPenalty = text.length > 120 ? 8 : 0;
  let score = Math.max(58, 96 - riskPenalty - lengthPenalty);
  let action = Math.max(60, 92 - Math.min(info.risks.length * 7, 28));
  return { read: score, action };
}

function render() {
  const text = sourceText.value.trim();
  const info = extractInfo(text);
  const scores = scoreText(info, text);

  outputTitle.textContent = audienceLabels[audience.value];
  readScore.textContent = scores.read;
  actionScore.textContent = scores.action;
  riskCount.textContent = info.risks.length;

  if (audience.value === "publisher") {
    result.innerHTML = buildPublisherBlock(info) + buildReadableRewrite(info) + buildRiskBlock(info);
  } else {
    result.innerHTML = buildManual(info) + buildRiskBlock(info) + buildQuestionBlock(info) + buildReadableRewrite(info);
  }
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 1600);
}

function getPlainResult() {
  return result.innerText.replace(/\n{3,}/g, "\n\n").trim();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  render();
});

[audience, scene].forEach((element) => element.addEventListener("change", render));
sourceText.addEventListener("input", () => {
  window.clearTimeout(sourceText.timer);
  sourceText.timer = window.setTimeout(render, 280);
});

document.querySelectorAll("[data-sample]").forEach((button) => {
  button.addEventListener("click", () => {
    const sample = samples[button.dataset.sample];
    sourceText.value = sample.text;
    scene.value = sample.scene;
    render();
  });
});

loadSampleHero.addEventListener("click", () => {
  sourceText.value = samples.gov.text;
  scene.value = samples.gov.scene;
  document.querySelector("#demo").scrollIntoView({ behavior: "smooth" });
  render();
});

copyResult.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(getPlainResult());
    showToast("结果已复制");
  } catch (error) {
    showToast("浏览器限制复制，请手动选中结果");
  }
});

render();
