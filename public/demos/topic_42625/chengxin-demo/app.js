const STORAGE_KEY = "chengxin-demo-state";

const exercises = [
  {
    type: "传统养生",
    name: "五禽戏 · 虎举",
    desc: "双脚站稳，双手缓慢上举再下按，配合深呼吸，做 2 分钟。"
  },
  {
    type: "身体控制",
    name: "提肛运动",
    desc: "吸气时轻轻收缩，保持 3 秒，呼气放松，重复 20 次。身体不适时停止。"
  },
  {
    type: "有氧转移",
    name: "慢跑 5 分钟",
    desc: "离开当前环境，慢跑或快走 5 分钟，把注意力转回身体。"
  },
  {
    type: "居家训练",
    name: "深蹲 20 次",
    desc: "保持膝盖方向稳定，慢慢下蹲再站起，完成后喝水休息。"
  },
  {
    type: "放松拉伸",
    name: "肩颈拉伸",
    desc: "坐直或站直，轻轻拉伸肩颈和背部，配合 6 次慢呼吸。"
  }
];

const residents = [
  { name: "林澈", job: "书店店员", mood: "平静", energy: 82, dream: "开一家河边书店" },
  { name: "阿禾", job: "跑步教练", mood: "专注", energy: 91, dream: "带全镇跑一次晨跑" },
  { name: "小岚", job: "面包师", mood: "开心", energy: 76, dream: "做出最好的核桃面包" },
  { name: "江远", job: "木匠", mood: "稳定", energy: 69, dream: "修好山脚的小桥" },
  { name: "青木", job: "学生", mood: "好奇", energy: 88, dream: "去山顶看日出" }
];

let state = loadState();
let selectedSymptoms = new Set();

const streakCount = document.getElementById("streakCount");
const pointCount = document.getElementById("pointCount");
const daysLeft = document.getElementById("daysLeft");
const todayStatus = document.getElementById("todayStatus");
const successPanel = document.getElementById("successPanel");
const failPanel = document.getElementById("failPanel");
const triagePanel = document.getElementById("triagePanel");
const adviceBox = document.getElementById("adviceBox");
const miniWorld = document.getElementById("miniWorld");
const worldLock = document.getElementById("worldLock");
const generateWorldBtn = document.getElementById("generateWorldBtn");
const worldMap = document.getElementById("worldMap");
const residentPanel = document.getElementById("residentPanel");

document.getElementById("successBtn").addEventListener("click", handleSuccess);
document.getElementById("failBtn").addEventListener("click", handleFail);
document.getElementById("completeExerciseBtn").addEventListener("click", completeExercise);
document.getElementById("startTriageBtn").addEventListener("click", startTriage);
document.getElementById("getAdviceBtn").addEventListener("click", getAdvice);
document.getElementById("demoUnlockBtn").addEventListener("click", demoUnlock);
document.getElementById("generateWorldBtn").addEventListener("click", generateWorld);
document.getElementById("resetBtn").addEventListener("click", resetDemo);

document.querySelectorAll("#symptomTags button").forEach((button) => {
  button.addEventListener("click", () => {
    const symptom = button.dataset.symptom;
    if (selectedSymptoms.has(symptom)) {
      selectedSymptoms.delete(symptom);
      button.classList.remove("active");
    } else {
      selectedSymptoms.add(symptom);
      button.classList.add("active");
    }
  });
});

render();

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return {
      points: 0,
      streak: 0,
      today: "",
      exerciseDone: false,
      worldUnlocked: false,
      worldGenerated: false
    };
  }

  try {
    return JSON.parse(saved);
  } catch {
    return {
      points: 0,
      streak: 0,
      today: "",
      exerciseDone: false,
      worldUnlocked: false,
      worldGenerated: false
    };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function render() {
  streakCount.textContent = state.streak;
  pointCount.textContent = state.points;
  daysLeft.textContent = Math.max(0, 14 - state.streak);

  if (state.today === "success") {
    todayStatus.textContent = "今天已打卡：忍住了。";
  } else if (state.today === "fail") {
    todayStatus.textContent = "今天已打卡：没忍住，建议完成资料阅读和身体问答。";
  } else {
    todayStatus.textContent = "今天还没有打卡。";
  }

  state.worldUnlocked = state.worldUnlocked || state.streak >= 14;
  generateWorldBtn.disabled = !state.worldUnlocked;
  worldLock.innerHTML = state.worldUnlocked
    ? "已获得 <strong>1</strong> 张世界生成券。"
    : `还差 <strong>${Math.max(0, 14 - state.streak)}</strong> 天解锁世界生成券。`;

  if (state.worldGenerated) {
    miniWorld.classList.remove("hidden");
    if (!worldMap.hasChildNodes()) generateWorld();
  }
}

function handleSuccess() {
  hidePanels();
  state.today = "success";
  state.streak += 1;
  state.points += 10;
  state.exerciseDone = false;
  saveState();
  pickExercise();
  successPanel.classList.remove("hidden");
  render();
}

function handleFail() {
  hidePanels();
  state.today = "fail";
  state.streak = 0;
  state.exerciseDone = false;
  saveState();
  failPanel.classList.remove("hidden");
  render();
}

function completeExercise() {
  if (state.exerciseDone) return;
  state.points += 5;
  state.exerciseDone = true;
  saveState();
  render();
  document.getElementById("completeExerciseBtn").textContent = "已完成，积分 +5";
  document.getElementById("completeExerciseBtn").disabled = true;
}

function startTriage() {
  triagePanel.classList.remove("hidden");
  triagePanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function getAdvice() {
  const freeText = document.getElementById("symptomInput").value.trim();
  const symptoms = Array.from(selectedSymptoms).join("、");
  const combined = `${symptoms} ${freeText}`;

  let advice = "";

  if (/(睾丸|疼|痛|肿|坠|尿痛|尿频|排尿|血|发热)/.test(combined)) {
    advice = `
      <strong>建议尽快线下检查。</strong><br>
      你提到了疼痛、排尿不适或类似身体信号，这类情况不能靠 App 判断原因。建议尽快去泌尿外科、男科或综合医院检查。如果你害怕开口，可以先告诉家长或可信赖成年人：“我最近身体不舒服，想去医院检查一下。”<br><br>
      去医院不是丢脸，也不是承认自己做错了。身体不舒服就检查，越早确认越安心。
    `;
  } else if (/(焦虑|自责|睡不着|睡眠|害怕|恐惧|难受|崩溃)/.test(combined)) {
    advice = `
      <strong>建议同时关注情绪和睡眠。</strong><br>
      你提到的情况更像是情绪压力正在影响身体感受。今晚先减少刺激内容，做 5 分钟慢呼吸或慢跑。如果这种焦虑持续很多天，建议联系校心理老师、心理咨询师或医生。<br><br>
      你不是一个人遇到这种问题，早点求助可以少走很多弯路。
    `;
  } else if (/(遗精|没有明显不适|无不适)/.test(combined)) {
    advice = `
      <strong>可以先观察，但要保持规律生活。</strong><br>
      如果只是偶尔遗精、没有疼痛、没有排尿不适，也没有持续焦虑，可以先观察睡眠、运动和情绪状态。接下来建议做一个轻量运动，然后早点睡。<br><br>
      如果后续出现疼痛、尿痛、明显肿胀或持续焦虑，再去医院检查。
    `;
  } else {
    advice = `
      <strong>建议先记录，再判断是否就医。</strong><br>
      你可以记录最近一周的睡眠、运动、冲动频率和身体感受。如果出现疼痛、尿痛、肿胀、持续不适或严重焦虑，请不要拖延，建议去医院检查。<br><br>
      App 只能提供提醒，不能替代医生诊断。
    `;
  }

  adviceBox.innerHTML = advice;
  adviceBox.classList.remove("hidden");
}

function demoUnlock() {
  state.streak = 14;
  state.worldUnlocked = true;
  saveState();
  render();
}

function generateWorld() {
  state.worldGenerated = true;
  saveState();
  miniWorld.classList.remove("hidden");
  worldMap.innerHTML = "";

  const layout = [
    "ggggmmmggggg",
    "gggmmmtggggg",
    "ggggrrrggggg",
    "wwwwrrrhhggg",
    "wwwgrrhhsggg",
    "ggggrrhhsggg",
    "ggtgrrrrgggg",
    "ggtgggwwwwgg"
  ];

  const typeMap = {
    g: "grass",
    w: "water",
    r: "road",
    m: "mountain",
    h: "house",
    s: "shop",
    t: "tree"
  };

  layout.join("").split("").forEach((char, index) => {
    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = `tile ${typeMap[char] || "grass"}`;
    tile.setAttribute("aria-label", "地图格子");

    const resident = residents[index % residents.length];
    if ([16, 33, 46, 58, 71].includes(index)) {
      const dot = document.createElement("span");
      dot.className = "resident";
      tile.appendChild(dot);
      tile.addEventListener("click", () => showResident(resident));
    }

    worldMap.appendChild(tile);
  });
}

function showResident(person) {
  residentPanel.innerHTML = `
    <h3>${person.name}</h3>
    <dl>
      <dt>职业</dt><dd>${person.job}</dd>
      <dt>心情</dt><dd>${person.mood}</dd>
      <dt>精力</dt><dd>${person.energy}</dd>
      <dt>梦想</dt><dd>${person.dream}</dd>
    </dl>
  `;
}

function pickExercise() {
  const exercise = exercises[Math.floor(Math.random() * exercises.length)];
  document.getElementById("exerciseType").textContent = exercise.type;
  document.getElementById("exerciseName").textContent = exercise.name;
  document.getElementById("exerciseDesc").textContent = exercise.desc;
  document.getElementById("completeExerciseBtn").textContent = "完成运动 +5 分";
  document.getElementById("completeExerciseBtn").disabled = false;
}

function hidePanels() {
  successPanel.classList.add("hidden");
  failPanel.classList.add("hidden");
  triagePanel.classList.add("hidden");
  adviceBox.classList.add("hidden");
}

function resetDemo() {
  state = {
    points: 0,
    streak: 0,
    today: "",
    exerciseDone: false,
    worldUnlocked: false,
    worldGenerated: false
  };
  selectedSymptoms = new Set();
  document.querySelectorAll("#symptomTags button").forEach((button) => button.classList.remove("active"));
  document.getElementById("symptomInput").value = "";
  localStorage.removeItem(STORAGE_KEY);
  hidePanels();
  miniWorld.classList.add("hidden");
  worldMap.innerHTML = "";
  residentPanel.innerHTML = "<h3>点击小人查看属性</h3><p>这个小世界不能干预，只能观察。它象征更稳定、更有秩序的生活。</p>";
  render();
}
