// 全局状态对象
const state = {
  water: 7,
  waterGoal: 8,
  healthScore: 82,
  currentTab: 'dashboard',
  selectedMood: 7,
  breathingOn: false,
  breathingTimer: null,
  storyPlaying: false,
  storyTimer: null,
  todayHabits: [
    { icon: '🥛', name: '喝够 2L 水', done: true },
    { icon: '🏃', name: '运动 30 分钟', done: true },
    { icon: '🧘', name: '5 分钟冥想', done: false },
    { icon: '📖', name: '记录心情', done: false },
    { icon: '🌙', name: '23:30 前入睡', done: false }
  ]
};

function init() {
  updateGreeting();
  updateHealthRing(state.healthScore);
  updateWaterUI();
  renderMoodChart();
  renderWeekChart();
  renderHabits();
  updateHabitsProgress();
  bindEvents();
}

function switchTab(tabName) {
  state.currentTab = tabName;
  document.querySelectorAll('.tab').forEach((t) => {
    if (t.dataset.tab === tabName) t.classList.add('active');
    else t.classList.remove('active');
  });
  document.querySelectorAll('.tab-content').forEach((c) => {
    if (c.id === 'tab-' + tabName) c.classList.add('active');
    else c.classList.remove('active');
  });
}

function updateGreeting() {
  const h = new Date().getHours();
  let text = '你好', hero = '今天也要好好照顾自己哦 ✨';
  if (h >= 5 && h < 11) { text = '早上好'; hero = '早上好，新的一天开始啦 ☀️'; }
  else if (h >= 11 && h < 14) { text = '中午好'; hero = '中午好，记得吃一顿美味的午餐 🍜'; }
  else if (h >= 14 && h < 18) { text = '下午好'; hero = '下午好，别忘了起来活动一下 🌸'; }
  else if (h >= 18 && h < 22) { text = '晚上好'; hero = '晚上好，忙碌的一天辛苦啦 ✨'; }
  else { text = '夜深啦'; hero = '夜深啦，准备好进入梦乡了吗 🌙'; }
  const g = document.getElementById('greeting');
  const hg = document.getElementById('hero-greeting');
  if (g) g.textContent = text;
  if (hg) hg.textContent = hero;
  const sleepTime = document.getElementById('sleepTime');
  const hh = String(new Date().getHours()).padStart(2, '0');
  const mm = String(new Date().getMinutes()).padStart(2, '0');
  if (sleepTime) sleepTime.textContent = '现在是 ' + hh + ':' + mm + '，正是放松的好时光～';
  const reportDate = document.getElementById('reportDate');
  if (reportDate) {
    const d = new Date();
    const weekday = ['周日','周一','周二','周三','周四','周五','周六'];
    reportDate.textContent = d.getFullYear() + ' 年 ' + (d.getMonth()+1) + ' 月 ' + d.getDate() + ' 日  ' + weekday[d.getDay()];
  }
}

function updateHealthRing(score) {
  const ring = document.getElementById('healthRing');
  const scoreText = document.getElementById('healthScore');
  const r = 50;
  const circumference = 2 * Math.PI * r;
  const ratio = Math.max(0, Math.min(1, score / 100));
  const offset = circumference * (1 - ratio);
  if (ring) { ring.setAttribute('stroke-dasharray', String(circumference)); ring.setAttribute('stroke-dashoffset', String(offset)); }
  if (scoreText) scoreText.textContent = score;
}

function addWater() {
  if (state.water < state.waterGoal) {
    state.water++;
    updateWaterUI();
    showToast('已记录一杯水，继续加油 💧');
  } else {
    showToast('今日目标已达成，你真棒！🎉');
  }
}

function updateWaterUI() {
  const waterValue = document.getElementById('waterValue');
  if (waterValue) {
    const amount = (state.water * 0.25).toFixed(2);
    waterValue.textContent = amount + 'L / ' + (state.waterGoal * 0.25).toFixed(2) + 'L';
  }
}

function showToast(msg) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => { toast.classList.remove('show'); }, 2200);
}

function sendChat() {
  const input = document.getElementById('chatInput');
  const chatBox = document.getElementById('chatBox');
  if (!input || !chatBox) return;
  const text = input.value.trim();
  if (!text) return;
  const userMsg = document.createElement('div');
  userMsg.className = 'chat-msg user';
  userMsg.innerHTML = '<div class="chat-avatar">😊</div><div class="chat-bubble"></div>';
  userMsg.querySelector('.chat-bubble').textContent = text;
  chatBox.appendChild(userMsg);
  input.value = '';
  chatBox.scrollTop = chatBox.scrollHeight;
  setTimeout(() => {
    const aiMsg = document.createElement('div');
    aiMsg.className = 'chat-msg ai';
    aiMsg.innerHTML = '<div class="chat-avatar">🤖</div><div class="chat-bubble"></div>';
    aiMsg.querySelector('.chat-bubble').textContent = generateAIReply(text);
    chatBox.appendChild(aiMsg);
    chatBox.scrollTop = chatBox.scrollHeight;
  }, 600);
}

function generateAIReply(text) {
  const t = (text || '').toLowerCase();
  if (t.includes('压力') || t.includes('累') || t.includes('加班') || t.includes('焦虑')) {
    return '我理解你，压力大的时候真的会很辛苦。先做 3 次深呼吸好吗？记得今晚尽量 23:30 前入睡，明天我们再一起来计划 ✨';
  }
  if (t.includes('失眠') || t.includes('睡不着') || t.includes('睡不好')) {
    return '失眠真的让人烦恼。你可以先试试 4-7-8 呼吸法，或者去「入睡引导」页面听一段助眠故事。放下手机，把灯光调暗一点～🌙';
  }
  if (t.includes('运动') || t.includes('跑步') || t.includes('锻炼')) {
    return '太棒啦！运动是调节心情的良药。记得运动后补充足够的水分和拉伸哦，让身体好好恢复一下 💪';
  }
  if (t.includes('吵架') || t.includes('难过') || t.includes('不开心') || t.includes('委屈')) {
    return '我陪你一起难过，情绪需要被看见才会慢慢过去。今晚给自己一点温柔的时间，吃点好东西、早点休息，明天会更好的 🌷';
  }
  if (t.includes('开心') || t.includes('很好') || t.includes('棒') || t.includes('高兴') || t.includes('特别好')) {
    return '能开心真的太好了！这种积极的能量非常珍贵，记得把它记录下来，以后低落时回看会是温暖的力量 ✨';
  }
  if (t.includes('吃') || t.includes('饿')) {
    return '记得选择营养均衡的食物，尽量清淡一点哦。饭后可以散步 10 分钟，让身体消化得更舒服 🍀';
  }
  return '谢谢你愿意和我分享。你可以告诉我更多，也可以去「心情」页面打个分数，我们一起慢慢梳理～';
}

function fillAndSend(text) {
  const input = document.getElementById('chatInput');
  if (input) { input.value = text; sendChat(); }
}

function selectMood(btn) {
  const score = parseInt(btn.dataset.score || '7', 10);
  const name = btn.dataset.name || '还不错';
  state.selectedMood = score;
  document.querySelectorAll('.mood-btn').forEach((b) => b.classList.remove('active'));
  btn.classList.add('active');
  const moodValue = document.getElementById('moodValue');
  if (moodValue) moodValue.textContent = score.toFixed(1);
  showToast('已记录心情：' + name + '（' + score + ' 分）');
}

function renderMoodChart() {
  const chart = document.getElementById('moodChart');
  if (!chart) return;
  chart.innerHTML = '';
  const data = [
    { label: '周一', value: 7 },
    { label: '周二', value: 6 },
    { label: '周三', value: 5 },
    { label: '周四', value: 7 },
    { label: '周五', value: 8 },
    { label: '周六', value: 9 },
    { label: '周日', value: 8 }
  ];
  data.forEach((d) => {
    const col = document.createElement('div');
    col.className = 'mood-bar';
    const bar = document.createElement('div');
    bar.className = 'mood-bar-inner';
    bar.style.height = (d.value * 10) + '%';
    bar.textContent = d.value;
    const label = document.createElement('div');
    label.className = 'mood-bar-label';
    label.textContent = d.label;
    col.appendChild(bar);
    col.appendChild(label);
    chart.appendChild(col);
  });
}

function renderWeekChart() {
  const chart = document.getElementById('weekChart');
  if (!chart) return;
  chart.innerHTML = '';
  const data = [
    { label: '周一', value: 7.2 },
    { label: '周二', value: 6.8 },
    { label: '周三', value: 7.0 },
    { label: '周四', value: 7.5 },
    { label: '周五', value: 7.3 },
    { label: '周六', value: 8.1 },
    { label: '周日', value: 7.5 }
  ];
  const maxH = 9;
  data.forEach((d) => {
    const col = document.createElement('div');
    col.className = 'mood-bar';
    const bar = document.createElement('div');
    bar.className = 'mood-bar-inner';
    bar.style.height = ((d.value / maxH) * 100) + '%';
    bar.textContent = d.value.toFixed(1) + 'h';
    const label = document.createElement('div');
    label.className = 'mood-bar-label';
    label.textContent = d.label;
    col.appendChild(bar);
    col.appendChild(label);
    chart.appendChild(col);
  });
}

function renderHabits() {
  const list = document.getElementById('habitsList');
  if (!list) return;
  list.innerHTML = '';
  state.todayHabits.forEach((habit, idx) => {
    const item = document.createElement('div');
    item.className = 'habit-item' + (habit.done ? ' done' : '');
    item.innerHTML = '<div class="habit-icon">' + habit.icon + '</div><div class="habit-name">' + habit.name + '</div><div class="habit-check">' + (habit.done ? '✓' : '') + '</div>';
    item.addEventListener('click', () => {
      state.todayHabits[idx].done = !state.todayHabits[idx].done;
      renderHabits();
      updateHabitsProgress();
      if (state.todayHabits[idx].done) showToast('任务完成，真棒！✨');
    });
    list.appendChild(item);
  });
}

function updateHabitsProgress() {
  const total = state.todayHabits.length;
  const done = state.todayHabits.filter((h) => h.done).length;
  const txt = document.getElementById('habitsProgressText');
  const bar = document.getElementById('habitsProgressBar');
  if (txt) txt.textContent = done + ' / ' + total;
  if (bar) bar.style.width = ((done / total) * 100) + '%';
}

function toggleBreathing() {
  const circle = document.getElementById('breathCircle');
  const text = document.getElementById('breathText');
  const btn = document.getElementById('breathBtn');
  if (!circle) return;
  if (state.breathingOn) {
    state.breathingOn = false;
    if (state.breathingTimer) clearTimeout(state.breathingTimer);
    state.breathingTimer = null;
    circle.classList.remove('inhale', 'hold', 'exhale');
    if (text) text.textContent = '吸气';
    if (btn) btn.textContent = '开始呼吸引导';
    return;
  }
  state.breathingOn = true;
  if (btn) btn.textContent = '停止呼吸引导';
  let phase = 0;
  const phases = [
    { name: 'inhale', text: '吸气', duration: 4000 },
    { name: 'hold', text: '屏息', duration: 7000 },
    { name: 'exhale', text: '呼气', duration: 8000 }
  ];
  function runPhase() {
    const cur = phases[phase];
    circle.classList.remove('inhale', 'hold', 'exhale');
    circle.classList.add(cur.name);
    if (text) text.textContent = cur.text;
    state.breathingTimer = setTimeout(() => {
      phase = (phase + 1) % phases.length;
      if (state.breathingOn) runPhase();
    }, cur.duration);
  }
  runPhase();
}

function playStory(title, desc) {
  const player = document.getElementById('storyPlayer');
  const spTitle = document.getElementById('spTitle');
  const spDesc = document.getElementById('spDesc');
  const spBar = document.getElementById('spBar');
  if (!player) return;
  player.style.display = 'flex';
  if (spTitle) spTitle.textContent = title;
  if (spDesc) spDesc.textContent = desc;
  if (spBar) spBar.style.width = '0%';
  state.storyPlaying = true;
  if (state.storyTimer) clearInterval(state.storyTimer);
  let progress = 0;
  state.storyTimer = setInterval(() => {
    if (!state.storyPlaying) return;
    progress += 1;
    if (spBar) spBar.style.width = progress + '%';
    if (progress >= 100) {
      clearInterval(state.storyTimer);
      state.storyPlaying = false;
      if (spDesc) spDesc.textContent = '故事已播放完毕，祝你好梦 🌙';
    }
  }, 180);
}

function stopStory() {
  const player = document.getElementById('storyPlayer');
  if (state.storyTimer) clearInterval(state.storyTimer);
  state.storyTimer = null;
  state.storyPlaying = false;
  if (player) player.style.display = 'none';
}

function toggleNoise(btn, type) {
  const on = btn.classList.toggle('on');
  if (on) showToast('已开启：' + type + ' 白噪音 🎵');
  else showToast('已关闭：' + type + ' 白噪音');
}

function bindEvents() {
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });
  document.querySelectorAll('.mood-btn').forEach((btn) => {
    btn.addEventListener('click', () => selectMood(btn));
  });
  const chatInput = document.getElementById('chatInput');
  if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendChat();
    });
  }
}

document.addEventListener('DOMContentLoaded', init);
