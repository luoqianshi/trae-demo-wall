const KEY = "mediread.v2";
let state = loadState();
const $ = (id) => document.getElementById(id);

const ids = ["medicineId", "name", "purpose", "source", "dose", "times", "stock", "expiry", "caregiver", "active", "notes"];
const fields = ids.reduce((acc, id) => ({ ...acc, [id]: $(id) }), {});

$("todayDate").value = today();
$("medicineForm").addEventListener("submit", saveMedicine);
$("cancelEditBtn").addEventListener("click", clearForm);
$("searchInput").addEventListener("input", renderMedicines);
$("todayDate").addEventListener("change", renderTimeline);
$("seedBtn").addEventListener("click", seedData);
$("exportBtn").addEventListener("click", exportData);
$("importFile").addEventListener("change", importData);
$("resetBtn").addEventListener("click", resetData);

$("elderModeBtn").addEventListener("click", toggleElderMode);
$("scanBtn").addEventListener("click", openScanner);
$("closeScannerBtn").addEventListener("click", closeScanner);
$("simulateScanBtn").addEventListener("click", () => simulateScan());
$("scanFile").addEventListener("change", handleScanFile);
$("closeAiBtn").addEventListener("click", () => $("aiResultPanel").classList.add("hidden"));
$("aiResultBox").addEventListener("click", handleAiBoxClick);
$("readTodayBtn").addEventListener("click", readTodayPlan);
$("reminderBtn").addEventListener("click", toggleReminder);
$("exportImageBtn").addEventListener("click", exportTodayImage);
$("closeGuideBtn").addEventListener("click", closeGuide);

initElderMode();
initReminder();
initGuide();
render();

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || { medicines: [], logs: [] };
  } catch {
    return { medicines: [], logs: [] };
  }
}

function persist() {
  localStorage.setItem(KEY, JSON.stringify(state));
}

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function saveMedicine(event) {
  event.preventDefault();
  const medicine = {
    id: fields.medicineId.value || uid("medicine"),
    name: fields.name.value.trim(),
    purpose: fields.purpose.value.trim(),
    source: fields.source.value.trim(),
    dose: fields.dose.value.trim(),
    times: parseTimes(fields.times.value),
    stock: Number(fields.stock.value || 0),
    expiry: fields.expiry.value,
    caregiver: fields.caregiver.value.trim(),
    active: fields.active.value === "true",
    notes: fields.notes.value.trim()
  };
  const index = state.medicines.findIndex((item) => item.id === medicine.id);
  if (index >= 0) state.medicines[index] = medicine;
  else state.medicines.unshift(medicine);
  clearForm();
  persist();
  render();
}

function parseTimes(value) {
  return value
    .split(/[，,、\s]+/)
    .map((time) => time.trim())
    .filter(Boolean)
    .map((time) => {
      const match = time.match(/^(\d{1,2}):?(\d{2})$/);
      if (!match) return time;
      return `${String(match[1]).padStart(2, "0")}:${match[2]}`;
    });
}

function clearForm() {
  $("medicineForm").reset();
  fields.medicineId.value = "";
  fields.stock.value = 0;
  fields.active.value = "true";
  $("cancelEditBtn").classList.add("hidden");
}

function render() {
  renderMedicines();
  renderTimeline();
  renderLogs();
}

function renderMedicines() {
  const query = $("searchInput").value.trim().toLowerCase();
  const medicines = state.medicines.filter((item) => !query || `${item.name} ${item.purpose} ${item.notes}`.toLowerCase().includes(query));
  $("medicineSummary").textContent = `${medicines.length} / ${state.medicines.length} 项`;
  const list = $("medicineList");
  if (!medicines.length) {
    list.innerHTML = `<div class="empty">还没有药品档案。</div>`;
    return;
  }
  list.innerHTML = medicines.map((medicine) => {
    const expiring = medicine.expiry && daysUntil(medicine.expiry) <= 30;
    return `
      <article class="medicine-card ${medicine.active ? "" : "inactive"} ${expiring ? "expiring" : ""}">
        <div>
          <div class="title">${escapeHtml(medicine.name)} ${medicine.active ? "" : "<span class=\"pill\">已停用</span>"}</div>
          <div class="meta">
            <span>用途：${escapeHtml(medicine.purpose || "未填")}</span>
            <span>用量：${escapeHtml(medicine.dose || "按医嘱")}</span>
            <span>时间：${medicine.times.map(escapeHtml).join("、") || "未设置"}</span>
            <span>库存：${medicine.stock}</span>
            <span>有效期：${medicine.expiry || "未填"}</span>
          </div>
          <div class="meta">注意：${escapeHtml(medicine.notes || "未摘录")}</div>
        </div>
        <div class="card-actions">
          ${MEDICINE_DB[medicine.name] ? `<button class="voice-btn" data-name="${escapeHtml(medicine.name)}" data-action="read-ai" title="AI解读">💡</button>` : ""}
          <button data-id="${medicine.id}" data-action="edit" title="编辑">✎</button>
          <button data-id="${medicine.id}" data-action="toggle" title="启停">⏻</button>
          <button data-id="${medicine.id}" data-action="delete" title="删除">×</button>
        </div>
      </article>`;
  }).join("");
  list.querySelectorAll("button").forEach((button) => button.addEventListener("click", handleMedicineAction));
}

function handleMedicineAction(event) {
  const button = event.currentTarget;
  const action = button.dataset.action;
  if (action === "read-ai") {
    showAiResult(button.dataset.name);
    return;
  }
  const medicine = state.medicines.find((item) => item.id === button.dataset.id);
  if (!medicine) return;
  if (action === "edit") {
    fields.medicineId.value = medicine.id;
    fields.name.value = medicine.name;
    fields.purpose.value = medicine.purpose;
    fields.source.value = medicine.source;
    fields.dose.value = medicine.dose;
    fields.times.value = medicine.times.join(", ");
    fields.stock.value = medicine.stock;
    fields.expiry.value = medicine.expiry;
    fields.caregiver.value = medicine.caregiver;
    fields.active.value = String(medicine.active);
    fields.notes.value = medicine.notes;
    $("cancelEditBtn").classList.remove("hidden");
    window.scrollTo({ top: 150, behavior: "smooth" });
  }
  if (action === "toggle") medicine.active = !medicine.active;
  if (action === "delete" && confirm("删除这个药品档案和相关记录？")) {
    state.medicines = state.medicines.filter((item) => item.id !== medicine.id);
    state.logs = state.logs.filter((item) => item.medicineId !== medicine.id);
  }
  persist();
  render();
}

function renderTimeline() {
  const date = $("todayDate").value || today();
  const doses = state.medicines
    .filter((medicine) => medicine.active)
    .flatMap((medicine) => medicine.times.map((time) => ({ medicine, time })))
    .sort((a, b) => a.time.localeCompare(b.time));
  const box = $("timeline");
  if (!doses.length) {
    box.innerHTML = `<div class="empty">今日没有已设置时间的药品。</div>`;
    return;
  }
  box.innerHTML = doses.map(({ medicine, time }) => {
    const log = state.logs.find((item) => item.medicineId === medicine.id && item.date === date && item.time === time);
    const status = log?.status || "待服";
    return `
      <article class="dose-card ${status === "已服" ? "done" : status === "漏服" ? "missed" : ""}">
        <div class="title">${time} · ${escapeHtml(medicine.name)}</div>
        <div class="meta"><span>${escapeHtml(medicine.dose || "按医嘱")}</span><span>${status}</span><span>库存 ${medicine.stock}</span></div>
        <div class="dose-actions">
          <button data-id="${medicine.id}" data-time="${time}" data-status="已服">已服</button>
          <button data-id="${medicine.id}" data-time="${time}" data-status="漏服" class="ghost">漏服</button>
          <button data-id="${medicine.id}" data-time="${time}" data-status="撤销" class="ghost">撤销</button>
        </div>
      </article>`;
  }).join("");
  box.querySelectorAll("button").forEach((button) => button.addEventListener("click", handleDose));
}

function handleDose(event) {
  const medicine = state.medicines.find((item) => item.id === event.currentTarget.dataset.id);
  const date = $("todayDate").value || today();
  const time = event.currentTarget.dataset.time;
  const status = event.currentTarget.dataset.status;
  const previous = state.logs.find((item) => item.medicineId === medicine.id && item.date === date && item.time === time);
  state.logs = state.logs.filter((item) => !(item.medicineId === medicine.id && item.date === date && item.time === time));
  if (previous?.status === "已服" && status !== "已服") {
    medicine.stock += 1;
  }
  if (status !== "撤销") {
    state.logs.unshift({ id: uid("log"), medicineId: medicine.id, medicineName: medicine.name, date, time, status, createdAt: new Date().toISOString() });
    if (status === "已服" && previous?.status !== "已服" && medicine.stock > 0) medicine.stock -= 1;
  }
  persist();
  render();
}

function renderLogs() {
  $("logSummary").textContent = `${state.logs.length} 条`;
  $("logList").innerHTML = state.logs.length ? state.logs.slice(0, 20).map((log) => `
    <div class="log-card">
      <div class="title">${log.date} ${log.time} · ${escapeHtml(log.medicineName)}</div>
      <div class="meta"><span>${log.status}</span><span>${new Date(log.createdAt).toLocaleString("zh-CN", { hour12: false })}</span></div>
    </div>`).join("") : `<div class="empty">暂无服药记录。</div>`;
}

function seedData() {
  state = {
    medicines: [{
      id: uid("medicine"),
      name: "示例降压药",
      purpose: "按医生处方控制血压",
      source: "家庭录入示例",
      dose: "1片",
      times: ["08:00", "20:00"],
      stock: 24,
      expiry: addDays(90),
      caregiver: "女儿",
      active: true,
      notes: "示例数据，不代表真实用药建议。"
    }],
    logs: []
  };
  persist();
  render();
}

function daysUntil(date) {
  return Math.ceil((new Date(date) - new Date(today())) / 86400000);
}

function today() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function addDays(days) {
  const next = new Date();
  next.setDate(next.getDate() + days);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}`;
}

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `mediread-${today()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!Array.isArray(data.medicines) || !Array.isArray(data.logs)) throw new Error("bad data");
      state = data;
      persist();
      render();
    } catch {
      alert("导入失败：文件格式不正确。");
    }
  };
  reader.readAsText(file);
  event.target.value = "";
}

function resetData() {
  if (!confirm("确认清空本应用的本地数据？")) return;
  state = { medicines: [], logs: [] };
  persist();
  render();
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
  })[char]);
}

// 长辈模式
function initElderMode() {
  const enabled = localStorage.getItem("mediread.elder") === "true";
  if (enabled) document.documentElement.classList.add("elder-mode");
  updateElderButton();
}

function toggleElderMode() {
  document.documentElement.classList.toggle("elder-mode");
  localStorage.setItem("mediread.elder", document.documentElement.classList.contains("elder-mode"));
  updateElderButton();
}

function updateElderButton() {
  const enabled = document.documentElement.classList.contains("elder-mode");
  $("elderModeBtn").textContent = enabled ? "标准模式" : "长辈模式";
  $("elderModeBtn").title = enabled ? "切换标准模式" : "切换长辈大字模式";
}

// 扫描与 AI 识别
let zxingReader = null;
let zxingControls = null;
let isScanning = false;

function openScanner() {
  $("scannerModal").classList.remove("hidden");
  $("scanProgress").classList.add("hidden");
  $("scanStatus").textContent = "";
  startCameraScan();
}

function closeScanner() {
  $("scannerModal").classList.add("hidden");
  stopSpeech();
  stopCameraScan();
}

function stopCameraScan() {
  if (zxingControls) {
    zxingControls.stop();
    zxingControls = null;
  }
  if (zxingReader) {
    zxingReader = null;
  }
  isScanning = false;
  const video = $("scanVideo");
  if (video.srcObject) {
    video.srcObject.getTracks().forEach((track) => track.stop());
    video.srcObject = null;
  }
  video.classList.add("hidden");
  $("scanPlaceholder").classList.remove("hidden");
}

async function startCameraScan() {
  if (isScanning || !("ZXingBrowser" in window)) return;
  try {
    isScanning = true;
    zxingReader = new window.ZXingBrowser.BrowserMultiFormatReader();
    const video = $("scanVideo");
    video.classList.remove("hidden");
    $("scanPlaceholder").classList.add("hidden");
    zxingControls = await zxingReader.decodeFromVideoDevice(undefined, "scanVideo", (result, error) => {
      if (result) {
        handleBarcode(result.getText());
      }
    });
  } catch (err) {
    isScanning = false;
    $("scanStatus").textContent = "摄像头未启动，可使用“模拟识别”或拍照上传。";
    $("scanVideo").classList.add("hidden");
    $("scanPlaceholder").classList.remove("hidden");
  }
}

async function handleScanFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  event.target.value = "";
  $("scanProgress").classList.remove("hidden");
  try {
    const imageData = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const frame = $("scannerFrame");
    frame.innerHTML = `<img src="${imageData}" alt="药盒照片" style="width:100%;height:100%;object-fit:cover;border-radius:12px;"><div class="scanner-laser"></div>`;
    if ("ZXingBrowser" in window) {
      const reader = new window.ZXingBrowser.BrowserMultiFormatReader();
      const result = await reader.decodeFromImageUrl(undefined, imageData);
      handleBarcode(result.getText());
    } else {
      fallbackRandomScan();
    }
  } catch {
    fallbackRandomScan();
  }
}

function handleBarcode(code) {
  const matched = Object.keys(MEDICINE_DB).find((name) => MEDICINE_DB[name].barcode === code);
  if (matched) {
    showAiResult(matched);
    $("scanProgress").classList.add("hidden");
    closeScanner();
  } else {
    $("scanStatus").textContent = `识别到条码：${code}，未匹配到演示药品，可换示例识别。`;
    $("scanProgress").classList.add("hidden");
  }
}

function simulateScan() {
  $("scanProgress").classList.remove("hidden");
  $("scanStatus").textContent = "";
  setTimeout(() => {
    fallbackRandomScan();
  }, 1200);
}

function fallbackRandomScan() {
  const pool = Object.keys(MEDICINE_DB);
  const name = pool[Math.floor(Math.random() * pool.length)];
  showAiResult(name);
  $("scanProgress").classList.add("hidden");
  closeScanner();
}

// AI 药品解读库（示例数据，用于演示）
const MEDICINE_DB = {
  "阿托伐他汀钙片": {
    barcode: "6901234567890",
    how: "每天晚上睡前吃 1 片，固定时间吃效果更好。",
    when: "睡前服用。",
    attention: "吃药期间尽量少吃西柚或西柚汁；如果肌肉酸痛、尿液颜色变深，要马上去医院。",
    contraindication: "孕妇、哺乳期女性、活动性肝病患者不宜使用。",
    sideEffects: "常见：便秘、肚子胀、头痛；少见：肌肉疼痛、肝指标异常。"
  },
  "苯磺酸氨氯地平片": {
    barcode: "6901234567891",
    how: "每天早上吃 1 片，血压高的时候不要自己加量。",
    when: "早晨服用。",
    attention: "突然站起来可能会头晕，动作慢一些；不要擅自停药。",
    contraindication: "对药物过敏者、严重低血压者禁用。",
    sideEffects: "常见：脚踝水肿、头痛、面部发红、心跳加快。"
  },
  "二甲双胍片": {
    barcode: "6901234567892",
    how: "随餐或饭后吃，可以减少胃不舒服；起始通常每次半片或 1 片，按医生说的来。",
    when: "餐中或餐后服用。",
    attention: "长期吃要定期检查肾功能；做造影检查前可能需要暂停，听医生安排。",
    contraindication: "严重肾功能不全、酸中毒、严重感染时禁用。",
    sideEffects: "常见：拉肚子、恶心、肚子胀、金属味；会慢慢减轻。"
  },
  "阿司匹林肠溶片": {
    barcode: "6901234567893",
    how: "每天固定时间吃 1 片，建议空腹或饭前吃，不要掰开嚼碎。",
    when: "空腹或饭前服用。",
    attention: "如果有黑便、牙龈出血、皮肤容易瘀青，要及时就医；手术前需告知医生。",
    contraindication: "活动性出血、血友病、严重肝肾功能衰竭者禁用。",
    sideEffects: "常见：胃不舒服、反酸；少见：出血、过敏。"
  },
  "缬沙坦胶囊": {
    barcode: "6901234567894",
    how: "通常每天 1 次，每次 1 粒，可与食物同服也可空腹服用。",
    when: "每天固定时间服用，早晨或晚上均可。",
    attention: "定期监测血压和血钾；若出现头晕、乏力、血钾异常，及时就医。",
    contraindication: "孕妇、双侧肾动脉狭窄、严重肾功能不全者禁用。",
    sideEffects: "常见：头晕、血钾升高、咳嗽（较少见）；少见：血管性水肿。"
  },
  "硝苯地平控释片": {
    barcode: "6901234567895",
    how: "每天 1 次，每次 1 片，整片吞服，不能掰开、嚼碎或碾碎。",
    when: "早晨服用。",
    attention: "药片外壳会随大便排出，这是正常的；不要因看到空壳以为没吸收。",
    contraindication: "心源性休克、严重低血压、与利福平合用者禁用。",
    sideEffects: "常见：头痛、面部潮红、脚踝水肿、心慌。"
  },
  "格列美脲片": {
    barcode: "6901234567896",
    how: "一般早餐前或第一口饭时服用，每天 1 次，剂量严格按医嘱。",
    when: "早餐前或餐时服用。",
    attention: "容易低血糖，身边常备糖果；饭量很少或漏餐时要特别注意。",
    contraindication: "对磺胺类药物过敏、严重肝肾功能不全、1 型糖尿病患者禁用。",
    sideEffects: "常见：低血糖、体重增加；少见：过敏、肝指标异常。"
  },
  "辛伐他汀片": {
    barcode: "6901234567897",
    how: "每晚睡前服用 1 次，固定时间吃；避免大量饮酒。",
    when: "睡前服用。",
    attention: "避免与葡萄柚同服；出现肌肉酸痛或无力要及时检查。",
    contraindication: "活动性肝病、妊娠哺乳期、与某些抗生素/抗真菌药合用者禁用。",
    sideEffects: "常见：腹胀、便秘、头痛；少见：肌肉疼痛、肝酶升高。"
  },
  "氯吡格雷片": {
    barcode: "6901234567898",
    how: "每天 1 次，每次 1 片，固定时间服用，不要自行停药。",
    when: "每天固定时间服用。",
    attention: "手术前、拔牙前要告诉医生正在服用此药；注意有无异常出血。",
    contraindication: "活动性出血、严重肝损害者禁用。",
    sideEffects: "常见：瘀斑、鼻出血、胃不舒服；少见：严重出血、皮疹。"
  },
  "美托洛尔缓释片": {
    barcode: "6901234567899",
    how: "每天 1 次，每次 1 片，整片吞服，不要掰开嚼碎。",
    when: "早晨服用。",
    attention: "心率过慢、血压过低或气喘加重时要就医；不要突然停药。",
    contraindication: "严重心动过缓、房室传导阻滞、急性心衰、哮喘急性发作者禁用。",
    sideEffects: "常见：乏力、头晕、心率减慢、手脚发凉。"
  },
  "奥美拉唑肠溶胶囊": {
    barcode: "6901234567900",
    how: "每天 1 次，每次 1 粒，饭前 30 分钟服用，整粒吞服。",
    when: "早餐前 30 分钟服用。",
    attention: "长期服用要关注骨密度和维生素 B12；不要擅自长期大量使用。",
    contraindication: "对药物过敏者禁用。",
    sideEffects: "常见：腹胀、腹泻或便秘、头痛；长期少见：低镁、骨折风险增加。"
  }
};

function showAiResult(name) {
  const info = MEDICINE_DB[name];
  if (!info) {
    alert("未识别到示例药品，请尝试拍照或点击“模拟识别”。");
    return;
  }
  const html = `
    <div class="ai-card" data-name="${escapeHtml(name)}">
      <h3>${escapeHtml(name)} <button class="voice-btn" data-action="speak">🔊 读给我听</button></h3>
      <div class="ai-section"><strong>怎么吃：</strong>${escapeHtml(info.how)}</div>
      <div class="ai-section"><strong>什么时候吃：</strong>${escapeHtml(info.when)}</div>
      <div class="ai-section"><strong>要注意什么：</strong>${escapeHtml(info.attention)}</div>
      <div class="ai-section"><strong>哪些人不能吃：</strong>${escapeHtml(info.contraindication)}</div>
      <div class="ai-section"><strong>常见不良反应：</strong>${escapeHtml(info.sideEffects)}</div>
      <div class="toolbar" style="margin-top:14px;">
        <button data-action="add-to-list">加入我的用药清单</button>
      </div>
    </div>
  `;
  $("aiResultBox").innerHTML = html;
  $("aiResultPanel").classList.remove("hidden");
  $("aiResultPanel").scrollIntoView({ behavior: "smooth", block: "start" });
}

function handleAiBoxClick(event) {
  const button = event.target.closest("button");
  if (!button) return;
  const action = button.dataset.action;
  const card = button.closest(".ai-card");
  const name = card?.dataset.name;
  if (action === "speak" && name) {
    const info = MEDICINE_DB[name];
    const text = `${name}。${info.how}${info.when}${info.attention}${info.sideEffects}`;
    speak(text, button);
  }
  if (action === "add-to-list" && name) addScannedMedicine(name);
}

function addScannedMedicine(name) {
  const info = MEDICINE_DB[name];
  const medicine = {
    id: uid("medicine"),
    name,
    purpose: "AI 识别示例药品",
    source: "药盒/说明书识别",
    dose: "请按医嘱或说明书",
    times: info.when.includes("睡前") ? ["21:00"] : info.when.includes("早晨") ? ["08:00"] : ["08:00"],
    stock: 0,
    expiry: "",
    caregiver: "",
    active: true,
    notes: `${info.how} ${info.attention} ${info.sideEffects}`
  };
  state.medicines.unshift(medicine);
  persist();
  render();
  $("aiResultPanel").classList.add("hidden");
  alert(`已将「${name}」加入用药清单，请再核对剂量和时间。`);
}

// 语音朗读
function readTodayPlan() {
  const date = $("todayDate").value || today();
  const doses = state.medicines
    .filter((m) => m.active)
    .flatMap((m) => m.times.map((t) => ({ name: m.name, dose: m.dose || "按医嘱", time: t })))
    .sort((a, b) => a.time.localeCompare(b.time));
  if (!doses.length) {
    speak("今天还没有设置需要服用的药品。");
    return;
  }
  const parts = doses.map((d) => `${d.time}，服用${d.name}，${d.dose}`);
  speak(`${date}的用药安排：${parts.join("。")}。请记得按时服药。`, $("readTodayBtn"));
}

function speak(text, button) {
  if (!("speechSynthesis" in window)) {
    alert("您的浏览器不支持语音朗读。");
    return;
  }
  stopSpeech();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "zh-CN";
  utter.rate = document.documentElement.classList.contains("elder-mode") ? 0.85 : 1;
  utter.pitch = 1;
  if (button) {
    button.classList.add("speaking");
    utter.onend = () => button.classList.remove("speaking");
    utter.onerror = () => button.classList.remove("speaking");
  }
  window.speechSynthesis.speak(utter);
}

function stopSpeech() {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  document.querySelectorAll(".speaking").forEach((el) => el.classList.remove("speaking"));
}

// 服药提醒
const notified = new Set();
let reminderInterval = null;

function initReminder() {
  updateReminderButton();
  if (localStorage.getItem("mediread.reminder") === "on") {
    startReminderChecks();
  }
}

function toggleReminder() {
  if (!("Notification" in window)) {
    alert("您的浏览器不支持桌面通知。");
    return;
  }
  if (Notification.permission === "denied") {
    alert("通知权限已被拒绝，请在浏览器设置中开启。");
    return;
  }
  if (Notification.permission !== "granted") {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        enableReminder();
      } else {
        $("reminderStatus").textContent = "通知权限未开启";
      }
    });
    return;
  }
  if (reminderInterval) {
    disableReminder();
  } else {
    enableReminder();
  }
}

function enableReminder() {
  localStorage.setItem("mediread.reminder", "on");
  startReminderChecks();
  updateReminderButton();
  $("reminderStatus").textContent = "提醒已开启";
  new Notification("MediRead 服药提醒", { body: "已开启服药时间提醒，到点会通知您。", icon: "💊" });
}

function disableReminder() {
  localStorage.setItem("mediread.reminder", "off");
  if (reminderInterval) {
    clearInterval(reminderInterval);
    reminderInterval = null;
  }
  notified.clear();
  updateReminderButton();
  $("reminderStatus").textContent = "提醒已关闭";
}

function updateReminderButton() {
  const on = localStorage.getItem("mediread.reminder") === "on";
  $("reminderBtn").textContent = on ? "🔕 关闭服药提醒" : "🔔 开启服药提醒";
  $("reminderStatus").textContent = on ? "提醒已开启" : "";
}

function startReminderChecks() {
  if (reminderInterval) return;
  checkReminders();
  reminderInterval = setInterval(checkReminders, 30000);
}

function checkReminders() {
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const dateStr = today();
  state.medicines
    .filter((m) => m.active)
    .forEach((medicine) => {
      medicine.times.forEach((time) => {
        if (time !== timeStr) return;
        const key = `${dateStr}-${medicine.id}-${time}`;
        if (notified.has(key)) return;
        const taken = state.logs.some((log) => log.medicineId === medicine.id && log.date === dateStr && log.time === time);
        if (taken) return;
        notified.add(key);
        sendReminder(medicine, time);
      });
    });
}

function sendReminder(medicine, time) {
  playReminderSound();
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("⏰ 该吃药了", {
      body: `${time}，请服用 ${medicine.name}，${medicine.dose || "按医嘱"}。`,
      tag: `mediread-${medicine.id}-${time}`
    });
  }
}

function playReminderSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch {
    // 忽略音频错误
  }
}

// 导出今日用药清单图片
function exportTodayImage() {
  const date = $("todayDate").value || today();
  const doses = state.medicines
    .filter((m) => m.active)
    .flatMap((m) => m.times.map((t) => ({ name: m.name, dose: m.dose || "按医嘱", time: t })))
    .sort((a, b) => a.time.localeCompare(b.time));

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const width = 640;
  const lineHeight = 72;
  const headerHeight = 140;
  const footerHeight = 60;
  const height = headerHeight + Math.max(doses.length, 1) * lineHeight + footerHeight;
  canvas.width = width;
  canvas.height = height;

  // 背景
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // 标题
  ctx.fillStyle = "#1d5f8a";
  ctx.fillRect(0, 0, width, headerHeight);
  ctx.fillStyle = "#ffffff";
  ctx.font = 'bold 44px "Microsoft YaHei", sans-serif';
  ctx.textAlign = "center";
  ctx.fillText("今日用药清单", width / 2, 70);
  ctx.font = '28px "Microsoft YaHei", sans-serif';
  ctx.fillText(date, width / 2, 115);

  // 内容
  ctx.textAlign = "left";
  if (!doses.length) {
    ctx.fillStyle = "#667085";
    ctx.font = '28px "Microsoft YaHei", sans-serif';
    ctx.fillText("今日没有已设置时间的药品。", 40, headerHeight + 50);
  } else {
    doses.forEach((d, i) => {
      const y = headerHeight + i * lineHeight;
      if (i % 2 === 0) {
        ctx.fillStyle = "#f5f7fb";
        ctx.fillRect(0, y, width, lineHeight);
      }
      ctx.fillStyle = "#172033";
      ctx.font = 'bold 32px "Microsoft YaHei", sans-serif';
      ctx.fillText(d.time, 40, y + 48);
      ctx.font = '28px "Microsoft YaHei", sans-serif';
      ctx.fillText(`${d.name}  ${d.dose}`, 180, y + 48);
    });
  }

  // 底部提示
  ctx.fillStyle = "#667085";
  ctx.font = '22px "Microsoft YaHei", sans-serif';
  ctx.textAlign = "center";
  ctx.fillText("用药变更请咨询医生或药师", width / 2, height - 25);

  const url = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = url;
  a.download = `今日用药清单-${date}.png`;
  a.click();
}

// 首次使用引导
function initGuide() {
  if (localStorage.getItem("mediread.guide") !== "done") {
    $("guideModal").classList.remove("hidden");
  }
}

function closeGuide() {
  localStorage.setItem("mediread.guide", "done");
  $("guideModal").classList.add("hidden");
}
