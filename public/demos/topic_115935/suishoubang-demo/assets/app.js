const examples = [
  "我在医院陪护老人，不方便下楼，想请附近的人帮忙带一份清淡晚饭。",
  "我刚到体育馆看演出，行李箱不方便带进去，想找附近可信的人临时寄存 2 小时。",
  "我家猫今天晚上需要喂食和换水，希望找同小区通过审核的人帮忙。",
  "孩子放学后我临时开会赶不过去，想找同班家长帮忙接到学校门口等我 15 分钟。",
  "我明天要路演，想找人帮我快速检查 PPT 逻辑和演讲稿表达。"
];

const helpers = [
  { name: "林同学", desc: "同小区住户｜已实名｜擅长跑腿代办", distance: "320m", score: "96%" },
  { name: "王阿姨", desc: "社区志愿者｜信用分 98｜常帮医院带饭", distance: "460m", score: "94%" },
  { name: "陈家长", desc: "同校家长｜已认证｜可做短时协助", distance: "510m", score: "91%" },
  { name: "小周", desc: "自由设计师｜擅长 PPT 和文稿优化", distance: "780m", score: "89%" }
];

const requestInput = document.querySelector("#requestInput");
const placeInput = document.querySelector("#placeInput");
const timeInput = document.querySelector("#timeInput");
const fillExample = document.querySelector("#fillExample");
const analyzeBtn = document.querySelector("#analyzeBtn");
const aiResult = document.querySelector("#aiResult");
const helperList = document.querySelector("#helperList");
const toast = document.querySelector("#toast");

fillExample.addEventListener("click", () => {
  const random = examples[Math.floor(Math.random() * examples.length)];
  requestInput.value = random;
});

analyzeBtn.addEventListener("click", () => {
  const text = requestInput.value.trim();
  if (!text) {
    showToast("请先输入一个真实需求");
    requestInput.focus();
    return;
  }

  const analysis = analyzeRequest(text);
  renderAnalysis(analysis);
  renderHelpers(analysis);
  showToast("AI 已完成分类与匹配");
});

function analyzeRequest(text) {
  const place = placeInput.value;
  const time = timeInput.value;
  let category = "生活应急";
  let risk = "低风险";
  let riskClass = "risk-low";
  let coins = 8;
  let audit = "基础实名即可";

  if (match(text, ["PPT", "演讲稿", "文稿", "设计", "化妆", "拍照"])) {
    category = "技能服务";
    coins = 25;
  }

  if (match(text, ["快递", "外卖", "买饭", "带饭", "跑腿", "纸巾", "寄存"])) {
    category = "跑腿代办";
    coins = 12;
  }

  if (match(text, ["猫", "狗", "宠物", "喂食", "遛狗"])) {
    category = "宠物照看";
    risk = "中风险";
    riskClass = "risk-mid";
    coins = 30;
    audit = "需宠物照看记录或双方确认";
  }

  if (match(text, ["孩子", "接送", "老人", "陪护", "陪诊"])) {
    category = "照护协助";
    risk = "高风险";
    riskClass = "risk-high";
    coins = 40;
    audit = "需实名、关系确认与平台二次审核";
  }

  if (time.includes("15")) {
    coins += 5;
  }

  return {
    category,
    risk,
    riskClass,
    coins,
    audit,
    place,
    time
  };
}

function match(text, words) {
  return words.some((word) => text.includes(word));
}

function renderAnalysis(data) {
  aiResult.className = "ai-grid";
  aiResult.innerHTML = `
    <div class="ai-item">
      <span>任务分类</span>
      <strong>${data.category}</strong>
    </div>
    <div class="ai-item">
      <span>风险等级</span>
      <strong class="${data.riskClass}">${data.risk}</strong>
    </div>
    <div class="ai-item">
      <span>建议帮帮币</span>
      <strong>${data.coins} 枚</strong>
    </div>
    <div class="ai-item">
      <span>审核建议</span>
      <strong>${data.audit}</strong>
    </div>
    <div class="ai-item">
      <span>所在场景</span>
      <strong>${data.place}</strong>
    </div>
    <div class="ai-item">
      <span>期望时间</span>
      <strong>${data.time}</strong>
    </div>
  `;
}

function renderHelpers(data) {
  const ranked = helpers
    .map((helper, index) => {
      let bonus = 0;
      if (data.category === "技能服务" && helper.name === "小周") bonus = 10;
      if (data.category === "照护协助" && helper.name === "陈家长") bonus = 8;
      if (data.category === "跑腿代办" && helper.name === "王阿姨") bonus = 7;
      return { ...helper, rank: Number(helper.score.replace("%", "")) + bonus - index };
    })
    .sort((a, b) => b.rank - a.rank)
    .slice(0, 3);

  helperList.innerHTML = ranked.map((helper) => `
    <div class="helper">
      <div class="avatar">${helper.name.slice(0, 1)}</div>
      <div>
        <strong>${helper.name}</strong>
        <span>${helper.desc}｜距离 ${helper.distance}</span>
      </div>
      <div class="match-score">${helper.score}</div>
    </div>
  `).join("");
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 1800);
}
