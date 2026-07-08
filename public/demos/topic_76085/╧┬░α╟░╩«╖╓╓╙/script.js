/* ============================================================
   下班前十分钟 · Editorial iOS · Quiet Confidence
   ============================================================ */

// ============ tab 切换 ============
const tabs = document.querySelectorAll('.tab');
const pages = document.querySelectorAll('.page');
const navTitle = document.getElementById('navTitle');

const tabTitleMap = {
  home: '今日',
  report: '日报',
  history: '记录',
  mine: '我的'
};

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.tab;
    if (tab.classList.contains('active')) return;
    tabs.forEach(t => t.classList.remove('active'));
    pages.forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.querySelector(`.page[data-tab="${target}"]`).classList.add('active');
    navTitle.textContent = tabTitleMap[target];
  });
});

// ============ 进度环 & 任务勾选 ============
const tasks = document.querySelectorAll('.task');
const progNum = document.getElementById('progNum');
const progBar = document.getElementById('progBar');
const progPct = document.getElementById('progPct');
const ringFg = document.getElementById('ringFg');
const homeFooter = document.getElementById('homeFooter');
const taskCnt = document.getElementById('taskCnt');

// 岛屿 Live Activity
const island = document.getElementById('island');
const islandRing = document.getElementById('islandRing');
const ilNum = document.getElementById('ilNum');
const ilTitle = document.getElementById('ilTitle');
const ilSub = document.getElementById('ilSub');

// 日报页 mini-progress
const mpFill = document.getElementById('mpFill');
const mpPct = document.getElementById('mpPct');

const RING_CIRC = 2 * Math.PI * 52;       // 326.7 — 主进度环（r=52）
const ISLAND_CIRC = 2 * Math.PI * 13;     // 81.68 — 岛屿环（r=13）

ringFg.style.strokeDasharray = RING_CIRC;
ringFg.style.strokeDashoffset = RING_CIRC;
islandRing.style.strokeDasharray = ISLAND_CIRC;
islandRing.style.strokeDashoffset = ISLAND_CIRC;

let finished = false;

function updateProgress(animateIsland) {
  const total = tasks.length;
  const done = document.querySelectorAll('.task.done').length;
  const pct = total ? done / total : 0;

  progNum.textContent = done;
  ringFg.style.strokeDashoffset = RING_CIRC * (1 - pct);
  progBar.style.width = (pct * 100) + '%';
  progPct.textContent = Math.round(pct * 100) + '%';
  taskCnt.textContent = `${done} / ${total}`;

  // 岛屿 Live Activity 同步
  islandRing.style.strokeDashoffset = ISLAND_CIRC * (1 - pct);
  ilNum.textContent = done;
  if (done < total) {
    ilTitle.textContent = '收尾中';
    ilSub.textContent = `${(total - done) * 2 + 1} 分钟 · ${total - done} 项`;
  }

  // 日报页完成度同步
  if (mpFill) mpFill.style.width = (pct * 100) + '%';
  if (mpPct) mpPct.textContent = Math.round(pct * 100) + '%';

  if (done === total && !finished) {
    finished = true;
    homeFooter.classList.add('completed');
    showToast('今日已收尾，干得漂亮');
    successIsland();
  } else if (done < total) {
    finished = false;
    homeFooter.classList.remove('completed');
    island.classList.remove('success');
  }

  // 勾选时触发灵动岛反馈
  if (animateIsland && done < total) {
    bumpIsland();
  }
}

tasks.forEach(task => {
  task.addEventListener('click', () => {
    const turningDone = !task.classList.contains('done');
    task.classList.toggle('done');
    updateProgress(turningDone);
  });
});

// ============ Dynamic Island 状态机 ============
let bumpTimer = null;
let successTimer = null;
let userToggled = false;

// 临时展开（用于 bump / 初始演示）
function expandIslandTemporary(duration) {
  island.classList.add('active');
  clearTimeout(bumpTimer);
  bumpTimer = setTimeout(() => {
    if (!userToggled && !island.classList.contains('success')) {
      island.classList.remove('active');
    }
  }, duration);
}

// 勾选任务时的弹性反馈
function bumpIsland() {
  if (island.classList.contains('success')) return;
  // 触发 scale 弹性动画
  island.classList.remove('bump');
  void island.offsetWidth;
  island.classList.add('bump');
  // 若当前未展开 → 临时展开显示进度
  if (!island.classList.contains('active') && !userToggled) {
    expandIslandTemporary(1600);
  }
}

// 全部完成的庆祝态
function successIsland() {
  clearTimeout(successTimer);
  island.classList.remove('success');
  void island.offsetWidth;
  island.classList.add('active', 'success');
  ilTitle.textContent = '已收尾';
  ilSub.textContent = '今日完成 · 干得漂亮';
  successTimer = setTimeout(() => {
    island.classList.remove('success');
    if (!userToggled) island.classList.remove('active');
    // 恢复文字
    ilTitle.textContent = '收尾中';
    ilSub.textContent = '10 分钟 · 5 项';
  }, 4500);
}

island.addEventListener('click', () => {
  if (island.classList.contains('success')) return; // 成功态不响应切换
  userToggled = !userToggled;
  island.classList.toggle('active');
});

// 初始演示：600ms 后展开 2s 让用户看到 Live Activity
setTimeout(() => {
  expandIslandTemporary(2000);
}, 600);

// ============ 日报：字符计数 ============
['rpt1', 'rpt2', 'rpt3'].forEach(id => {
  const area = document.getElementById(id);
  const cnt = document.getElementById(id + 'Cnt');
  if (!area || !cnt) return;
  area.addEventListener('input', () => {
    cnt.textContent = area.value.length;
  });
});

// ============ 日报保存 ============
const rptSave = document.getElementById('rptSave');
rptSave.addEventListener('click', () => {
  const areas = document.querySelectorAll('.rpt-area');
  const filled = Array.from(areas).some(a => a.value.trim().length > 0);
  if (!filled) {
    showToast('先写点什么再保存吧');
    return;
  }
  showToast('日报已保存到本地');
  const txt = rptSave.querySelector('.pb-text');
  txt.textContent = '已保存';
  rptSave.style.background = 'linear-gradient(135deg,var(--accent),var(--orange))';
  setTimeout(() => {
    txt.textContent = '保存日报';
    rptSave.style.background = '';
  }, 2200);
});

// ============ 历史页：7 天条形图 ============
const chartBars = document.getElementById('chartBars');
const chartData = [
  { day: '23', week: 'TUE', pct: 1,    state: 'done' },
  { day: '24', week: 'WED', pct: 1,    state: 'done' },
  { day: '25', week: 'THU', pct: .8,   state: 'miss' },
  { day: '26', week: 'FRI', pct: 1,    state: 'done' },
  { day: '27', week: 'SAT', pct: 1,    state: 'done' },
  { day: '28', week: 'SUN', pct: 1,    state: 'done' },
  { day: '29', week: 'MON', pct: 0,    state: 'today' }
];

chartData.forEach((d, i) => {
  const el = document.createElement('div');
  el.className = 'cc-bar' + (d.state === 'today' ? ' today-day' : '');
  const fillClass = d.state === 'miss' ? 'cc-bar-fill miss' : 'cc-bar-fill' + (d.state === 'today' ? ' today' : '');
  el.innerHTML = `
    <div class="${fillClass}" style="height:0%"></div>
    <div class="cc-bar-day">${d.week}</div>
  `;
  el.addEventListener('click', () => {
    const label = d.state === 'today' ? '今天 · 进行中' : d.state === 'miss' ? '6 月 ' + d.day + ' 日 · 部分完成' : '6 月 ' + d.day + ' 日 · 全部完成';
    showToast(label);
  });
  chartBars.appendChild(el);
  // 入场动画
  requestAnimationFrame(() => {
    setTimeout(() => {
      el.querySelector('.cc-bar-fill').style.height = (d.pct * 100) + '%';
    }, 100 + i * 70);
  });
});

// ============ 历史明细列表 ============
const hisList = document.getElementById('hisList');
const historyData = [
  { day: '28', week: 'SUN', summary: '5/5 已完成 · 干净收尾', state: 'done' },
  { day: '27', week: 'SAT', summary: '5/5 已完成 · 周末加班', state: 'done' },
  { day: '26', week: 'FRI', summary: '5/5 已完成 · 周五收尾', state: 'done' },
  { day: '25', week: 'THU', summary: '4/5 已完成 · 漏了归档', state: 'miss' },
  { day: '24', week: 'WED', summary: '5/5 已完成 · 干净收尾', state: 'done' },
  { day: '23', week: 'TUE', summary: '5/5 已完成 · 干净收尾', state: 'done' },
  { day: '22', week: 'MON', summary: '5/5 已完成 · 首日开始', state: 'done' }
];

historyData.forEach(item => {
  const el = document.createElement('div');
  el.className = 'his-item';
  el.innerHTML = `
    <div class="his-date">${item.day}</div>
    <div class="his-info">
      <div class="his-week">${item.week}</div>
      <div class="his-summary">${item.summary}</div>
    </div>
    <div class="his-state ${item.state === 'miss' ? 'miss' : 'done'}">${item.state === 'miss' ? '未清' : '已清'}</div>
  `;
  el.addEventListener('click', () => showToast(`6 月 ${item.day} 日 · ${item.week}`));
  hisList.appendChild(el);
});

// ============ 我的页设置项 ============
document.querySelectorAll('.mine-item').forEach(item => {
  item.addEventListener('click', () => {
    const label = item.querySelector('.mi-label').textContent;
    showToast(`${label} · 演示版本暂未开放`);
  });
});

// ============ 胶囊按钮 ============
document.getElementById('capsule').addEventListener('click', e => {
  e.stopPropagation();
  showToast('小程序演示中');
});

// ============ toast ============
let toastTimer = null;
const toast = document.getElementById('toast');
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.remove('show');
  void toast.offsetWidth;
  // 重新插入圆点（::before 是伪元素，自动保留）
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 1800);
}

// ============ 初始化 ============
updateProgress();
