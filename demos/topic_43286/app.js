const demoData = {
  qingming: {
    title: "清明做青团的记忆",
    dialect:
      "清明辰光，屋里厢要摘艾草，糯米粉揉得软软个，包点豆沙，蒸出来一笼青团，先敬祖宗，再分给小囡吃。",
    standard:
      "清明时节，家里会采摘艾草，与糯米粉揉在一起，包入豆沙后蒸成青团。青团先用于祭祖，再分给孩子食用。",
    keywords: ["清明", "青团", "艾草", "祭祖", "寒食", "节令食俗"],
    classic:
      "系统匹配到地方志中关于“清明、寒食、艾草、祭祖、青团”的相关记载，可生成“古籍原文 + 白话解释 + 当代口述”的并置页面。"
  },
  wedding: {
    title: "旧时婚嫁礼俗",
    dialect:
      "从前讨亲眷要挑好日脚，媒人先来讲亲，嫁妆一担一担抬过去，门口还要唱几句讨彩头个话。",
    standard:
      "过去结婚要选择吉日，由媒人先上门说亲。嫁妆会一担一担送到男方家，进门时还会唱带有祝福意味的吉利话。",
    keywords: ["婚嫁", "媒人", "嫁妆", "吉日", "彩头话", "礼俗"],
    classic:
      "系统可匹配地方志与族谱中关于婚仪、纳采、迎亲、嫁妆和乡里礼制的条目，帮助解释口述中出现的旧称与仪式。"
  },
  nursery: {
    title: "方言童谣",
    dialect:
      "月亮婆婆照后门，阿囡困觉勿哭声，明朝买糖买糕饼，外婆桥上看花灯。",
    standard:
      "这是一首哄孩子睡觉的方言童谣，大意是月光照在后门，孩子不要哭，明天买糖和糕饼，再去外婆桥看花灯。",
    keywords: ["童谣", "哄睡", "月亮", "外婆桥", "花灯", "口头文学"],
    classic:
      "系统可关联地方歌谣、民间文学资料和古籍中关于上元灯俗、儿童游戏、口头传唱的记载，形成声音与文本并置的馆藏。"
  }
};

let latestRecord = demoData.qingming;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

function switchView(viewId) {
  $$(".view").forEach((view) => view.classList.remove("active"));
  $$(".nav-item").forEach((item) => item.classList.remove("active"));
  $(`#${viewId}`).classList.add("active");
  const nav = $(`.nav-item[data-view="${viewId}"]`);
  if (nav) nav.classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showToast(text) {
  const toast = $("#toast");
  toast.textContent = text;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 1800);
}

function setStatus(text, running = false) {
  const status = $("#aiStatus");
  status.querySelector("span").textContent = text;
  status.classList.toggle("running", running);
}

function renderResult(data) {
  $("#dialectText").textContent = `“${data.dialect}”`;
  $("#standardText").textContent = data.standard;
  $("#classicText").textContent = data.classic;
  $("#keywordTags").innerHTML = data.keywords.map((word) => `<span>${word}</span>`).join("");
  $("#resultPanel").classList.remove("hidden");
}

function renderArchive(data) {
  const speaker = $("#speakerName").value.trim() || "匿名讲述人";
  const location = $("#locationName").value.trim() || "未标注地点";
  const dialect = $("#dialectType").value;

  $("#archiveTitle").textContent = data.title;
  $("#archiveMeta").textContent = `讲述人：${speaker} · 地点：${location} · 方言：${dialect}`;
  $("#archiveDialect").textContent = `“${data.dialect}”`;
  $("#archiveStandard").textContent = data.standard;
  $("#archiveClassic").textContent = data.classic;
}

function simulateRecord() {
  const topic = $("#topic").value;
  const data = demoData[topic];
  latestRecord = data;
  $("#resultPanel").classList.add("hidden");
  $("#recordingBox").classList.add("active");
  $("#recordingBox").innerHTML = `
    <div class="recording-list">
      <div>正在采集老人方言口述音频...</div>
      <div>正在识别方言词、地名旧称、民俗关键词...</div>
      <div>正在生成普通话释义与馆藏摘要...</div>
    </div>
  `;
  setStatus("AI 处理中", true);

  setTimeout(() => {
    $("#recordingBox").innerHTML = `
      <div class="recording-list">
        <div><strong>录音完成：</strong>${data.title}</div>
        <div><strong>方言识别：</strong>已生成口述原文与普通话释义</div>
        <div><strong>古籍匹配：</strong>已找到相关民俗条目线索</div>
      </div>
    `;
    setStatus("整理完成", false);
    renderResult(data);
    showToast("AI 转写与古籍匹配完成");
  }, 1200);
}

function speakArchive() {
  const text = $("#archiveStandard").textContent;
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "zh-CN";
    utter.rate = 0.92;
    window.speechSynthesis.speak(utter);
    showToast("正在播放模拟馆藏旁白");
  } else {
    showToast("当前浏览器不支持语音播放");
  }
}

$$(".nav-item").forEach((item) => {
  item.addEventListener("click", () => switchView(item.dataset.view));
});

$$("[data-go]").forEach((button) => {
  button.addEventListener("click", () => switchView(button.dataset.go));
});

$("#startRecord").addEventListener("click", simulateRecord);

$("#generateArchive").addEventListener("click", () => {
  renderArchive(latestRecord);
  switchView("archive");
  showToast("已生成数字馆藏页");
});

$("#playVoice").addEventListener("click", speakArchive);
