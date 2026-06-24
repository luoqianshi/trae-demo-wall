const form = document.querySelector("#heritageForm");
const presetButtons = Array.from(document.querySelectorAll(".preset-chip"));
const cardsRoot = document.querySelector("#contentCards");
const badge = document.querySelector("#contentBadge");
const contentSubtitle = document.querySelector("#contentSubtitle");
const brandMark = document.querySelector("#brandMark");
const generateBtn = document.querySelector("#generateBtn");
const generateStatus = document.querySelector("#generateStatus");
const demoBtn = document.querySelector("#demoBtn");
const copyAllBtn = document.querySelector("#copyAllBtn");
const copyExhibitBtn = document.querySelector("#copyExhibitBtn");
const toast = document.querySelector("#toast");
const previewTitle = document.querySelector("#previewTitle");
const previewRegion = document.querySelector("#previewRegion");
const previewStory = document.querySelector("#previewStory");
const previewSteps = document.querySelector("#previewSteps");
const previewQuiz = document.querySelector("#previewQuiz");
const previewPoster = document.querySelector("#previewPoster");
const exhibitMeta = document.querySelector("#exhibitMeta");

const presets = {
  blueprint: {
    mark: "染",
    theme: "",
    name: "蓝印花布",
    region: "江苏南通",
    materials: "棉布、蓼蓝、刻花版、防染浆",
    steps: "刻版、刮浆、防染、浸染、晾晒、刮灰、清洗",
    audience: "社区亲子家庭",
    tone: "warm",
    hook: "蓝白之间的地方记忆",
    question: "为什么蓝印花布能留下白色花纹？",
    object: "一块亲手拓印的蓝白纹样卡"
  },
  shadow: {
    mark: "影",
    theme: "theme-shadow",
    name: "皮影戏",
    region: "陕西华县",
    materials: "牛皮、刻刀、彩绘颜料、竹签、灯幕",
    steps: "选皮、制皮、画稿、雕刻、敷彩、装杆、试演",
    audience: "小学研学团队",
    tone: "lively",
    hook: "一束灯光里的民间剧场",
    question: "为什么一张薄薄的皮影能在幕布上像角色一样行动？",
    object: "一个可以摆动的小皮影角色"
  },
  fan: {
    mark: "漆",
    theme: "theme-fan",
    name: "漆扇",
    region: "福建福州",
    materials: "团扇、天然大漆、色漆、水槽、护具",
    steps: "调漆、滴色、拨纹、入水、提扇、晾干、封护",
    audience: "城市游客",
    tone: "rigorous",
    hook: "水面纹路凝成的东方色彩",
    question: "为什么每一把漆扇的纹理都很难完全复制？",
    object: "一把拥有独一纹理的体验扇"
  }
};

const toneLabels = {
  warm: "温润亲和",
  rigorous: "严谨讲解",
  lively: "活泼趣味"
};

let latestContent = [];
let demoTimer = null;

function splitSteps(value) {
  return value
    .split(/[、,，\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 7);
}

function readForm() {
  const formData = new FormData(form);
  return {
    name: String(formData.get("name") || "").trim() || "未命名非遗项目",
    region: String(formData.get("region") || "").trim() || "本地社区",
    materials: String(formData.get("materials") || "").trim() || "传统材料",
    steps: String(formData.get("steps") || "").trim() || "观察、体验、分享",
    audience: String(formData.get("audience") || "社区亲子家庭"),
    tone: String(formData.get("tone") || "warm")
  };
}

function getActivePreset(data) {
  return Object.values(presets).find((preset) => preset.name === data.name) || {
    mark: "展",
    theme: "",
    hook: "从地方生活里长出的手艺",
    question: `你会把${data.name}带到生活的哪个场景里？`,
    object: "一张可带走的体验说明卡"
  };
}

function buildContent(data) {
  const steps = splitSteps(data.steps);
  const preset = getActivePreset(data);
  const firstStep = steps[0] || "观察材料";
  const finalStep = steps[steps.length - 1] || "分享作品";
  const tone = toneLabels[data.tone] || "温润亲和";

  return [
    {
      title: "三分钟讲解词",
      body: `${data.name}来自${data.region}，它把${data.materials}变成${preset.hook}。今天的讲解从${firstStep}开始：先看材料怎样被选择，再看手艺人如何控制每一次纹路、光影或色彩。最后到${finalStep}，观众会发现，非遗不是遥远的展柜知识，而是一套仍然能进入当代生活的创造方法。`
    },
    {
      title: "儿童版解释",
      body: `${data.name}像一场手工小实验。我们先认识材料，再一步一步完成${firstStep}、体验变化，最后得到${preset.object}。每个人做出来的结果都不一样，所以它很适合让孩子理解“传统也可以自己动手创造”。`
    },
    {
      title: "互动问答",
      body: `问题：${preset.question} 引导：请${data.audience}先观察材料，再说出一个自己的猜想，最后用工艺步骤来验证。`
    },
    {
      title: "文创灵感",
      body: `围绕${data.name}开发四件轻量文创：研学贴纸、城市书签、体验证书和帆布袋角标。每件文创都附一个“我参与了哪一步工艺”的小标签，让纪念品同时成为传播线索。`
    },
    {
      title: "短视频脚本",
      body: `镜头一：手触摸${data.materials.split("、")[0] || "材料"}。镜头二：特写${firstStep}。镜头三：邀请${data.audience}猜结果。镜头四：展示${finalStep}后的作品。结尾字幕：把${data.region}的${data.name}带回今天的生活。`
    },
    {
      title: "微展故事卡",
      body: `${data.name}不是只被观看的老手艺，而是一段可以被重新讲述的地方经验。这个微展用${tone}的语气，把“看展、提问、动手、带走”串成一条短路径，让${data.audience}在几分钟内建立真实连接。`
    },
    {
      title: "工艺步骤",
      body: steps.map((step, index) => `${index + 1}. ${step}`).join("  ")
    },
    {
      title: "小测验",
      body: `选择题：以下哪一步最能体现${data.name}的独特性？A. ${steps[0] || "观察"} B. ${steps[1] || "体验"} C. ${steps[2] || "分享"}。答完后让观众说明理由，而不是只给标准答案。`
    },
    {
      title: "传播海报文案",
      body: `一项手艺，一段地方记忆，一次亲手参与的微展体验。来${data.region}的${data.name}展台，把传统带进今天。`
    }
  ];
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  })[char]);
}

function render(data) {
  const content = buildContent(data);
  const steps = splitSteps(data.steps);
  const preset = getActivePreset(data);
  latestContent = content;

  document.body.classList.remove("theme-shadow", "theme-fan");
  if (preset.theme) document.body.classList.add(preset.theme);
  brandMark.textContent = preset.mark;

  cardsRoot.innerHTML = content
    .map((item, index) => `
      <article class="content-card" data-card-index="${index}">
        <button type="button" class="copy-card" data-copy-index="${index}">复制</button>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.body)}</p>
      </article>
    `)
    .join("");

  badge.textContent = `已生成 ${content.length} 项`;
  contentSubtitle.textContent = `${data.name}，面向${data.audience}，语气：${toneLabels[data.tone]}`;
  previewTitle.textContent = data.name;
  previewRegion.textContent = data.region;
  previewStory.textContent = content[5].body;
  previewQuiz.textContent = content[2].body.replace(/^问题：/, "");
  previewPoster.textContent = content[8].body;
  exhibitMeta.textContent = `目标观众：${data.audience}`;
  previewSteps.innerHTML = steps
    .slice(0, 5)
    .map((step, index) => `<div class="step-item"><b>${index + 1}</b><span>${escapeHtml(step)}</span></div>`)
    .join("");
}

function applyPreset(key) {
  const preset = presets[key];
  if (!preset) return;

  form.elements.name.value = preset.name;
  form.elements.region.value = preset.region;
  form.elements.materials.value = preset.materials;
  form.elements.steps.value = preset.steps;
  form.elements.audience.value = preset.audience;
  form.elements.tone.value = preset.tone;

  presetButtons.forEach((button) => {
    const selected = button.dataset.preset === key;
    button.classList.toggle("is-active", selected);
    button.setAttribute("aria-selected", String(selected));
  });

  render(readForm());
  generateStatus.textContent = `已载入「${preset.name}」样例，可以直接生成或修改字段。`;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("is-visible"), 1800);
}

async function copyText(text, label) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.append(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    showToast(`${label}已复制`);
  } catch {
    showToast("复制失败，请手动选择文本");
  }
}

function contentAsText() {
  return latestContent.map((item) => `${item.title}\n${item.body}`).join("\n\n");
}

function exhibitAsText() {
  return [
    `${previewRegion.textContent}｜${previewTitle.textContent}`,
    previewStory.textContent,
    "关键工艺：",
    Array.from(previewSteps.querySelectorAll(".step-item")).map((item) => item.textContent.trim()).join(" / "),
    `互动小测：${previewQuiz.textContent}`,
    `海报文案：${previewPoster.textContent}`
  ].join("\n");
}

function simulateGenerate() {
  generateBtn.classList.add("is-loading");
  generateBtn.disabled = true;
  generateStatus.textContent = "正在模拟 AI 生成：整理讲解词、互动问答和微展展卡。";

  window.setTimeout(() => {
    render(readForm());
    generateBtn.classList.remove("is-loading");
    generateBtn.disabled = false;
    generateStatus.textContent = `生成完成：${new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })} 已刷新 9 项内容。`;
    showToast("微展内容已更新");
  }, 620);
}

function startDemoMode() {
  if (demoTimer) {
    window.clearInterval(demoTimer);
    demoTimer = null;
    document.body.classList.remove("is-demoing");
    demoBtn.textContent = "演示模式";
    cardsRoot.querySelectorAll(".content-card").forEach((card) => card.classList.remove("is-highlighted"));
    generateStatus.textContent = "演示已结束，可以继续修改字段生成。";
    return;
  }

  let index = 0;
  document.body.classList.add("is-demoing");
  demoBtn.textContent = "停止演示";
  generateStatus.textContent = "演示模式：正在逐项高亮 AI 内容包，适合录制参赛视频。";

  const highlight = () => {
    const cards = Array.from(cardsRoot.querySelectorAll(".content-card"));
    cards.forEach((card) => card.classList.remove("is-highlighted"));
    const current = cards[index % cards.length];
    if (current) {
      current.classList.add("is-highlighted");
      current.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
    index += 1;
  };

  highlight();
  demoTimer = window.setInterval(highlight, 1400);
}

presetButtons.forEach((button) => {
  button.addEventListener("click", () => applyPreset(button.dataset.preset));
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  simulateGenerate();
});

cardsRoot.addEventListener("click", (event) => {
  const button = event.target.closest("[data-copy-index]");
  if (!button) return;
  const item = latestContent[Number(button.dataset.copyIndex)];
  if (item) copyText(`${item.title}\n${item.body}`, item.title);
});

copyAllBtn.addEventListener("click", () => copyText(contentAsText(), "全部内容"));
copyExhibitBtn.addEventListener("click", () => copyText(exhibitAsText(), "展卡文本"));
demoBtn.addEventListener("click", startDemoMode);

applyPreset("blueprint");
