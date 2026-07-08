/**
 * 专注计时 Focus
 */

let focusDuration = 25;
let focusRemaining = 25 * 60;
let focusTimer = null;
let focusRunning = false;
let focusStartTime = null;

const CIRCUMFERENCE = 339.292;

function setFocusDuration(minutes) {
  if (focusRunning) return;
  focusDuration = minutes;
  focusRemaining = minutes * 60;
  updateFocusDisplay();

  document.querySelectorAll('.duration-btn').forEach(btn => {
    const isActive = parseInt(btn.dataset.duration) === minutes;
    btn.className = isActive
      ? 'duration-btn px-4 py-2 rounded-xl text-sm bg-blue-100 text-blue-600 font-medium'
      : 'duration-btn px-4 py-2 rounded-xl text-sm bg-gray-100 text-gray-600';
  });
}

function updateFocusDisplay() {
  const minutes = Math.floor(focusRemaining / 60);
  const seconds = focusRemaining % 60;
  document.getElementById('focus-time').textContent =
    `${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`;

  const offset = CIRCUMFERENCE - (focusRemaining / (focusDuration * 60)) * CIRCUMFERENCE;
  document.getElementById('progress-circle').style.strokeDashoffset = offset;
}

function startFocus() {
  if (focusRunning) return;
  focusRunning = true;
  focusStartTime = Date.now();
  document.getElementById('focus-status').textContent = '专注学习中...';
  document.getElementById('focus-start').classList.add('hidden');
  document.getElementById('focus-pause').classList.remove('hidden');

  focusTimer = setInterval(() => {
    focusRemaining--;
    updateFocusDisplay();
    if (focusRemaining <= 0) {
      completeFocus();
    }
  }, 1000);
}

function pauseFocus() {
  if (!focusRunning) return;
  focusRunning = false;
  clearInterval(focusTimer);
  document.getElementById('focus-status').textContent = '已暂停';
  document.getElementById('focus-start').classList.remove('hidden');
  document.getElementById('focus-pause').classList.add('hidden');
}

function resetFocus() {
  pauseFocus();
  focusRemaining = focusDuration * 60;
  updateFocusDisplay();
  document.getElementById('focus-status').textContent = '准备开始';
}

function completeFocus() {
  pauseFocus();
  const actualDuration = Math.round((Date.now() - focusStartTime) / 60000);
  addFocusRecord({
    duration: focusDuration,
    actualDuration: Math.min(actualDuration, focusDuration),
    startTime: focusStartTime,
    endTime: Date.now(),
    completed: true
  });
  focusRemaining = focusDuration * 60;
  updateFocusDisplay();
  document.getElementById('focus-status').textContent = '专注完成！';
  showToast('🎉 专注完成，继续保持！');
  renderFocusRecords();
  renderDashboard();
  renderReview();
}

function renderFocusRecords() {
  const container = document.getElementById('focus-records');
  const today = getToday();
  const records = getFocusRecords()
    .filter(r => {
      const d = new Date(r.startTime);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      return dateStr === today;
    })
    .sort((a, b) => b.startTime - a.startTime);

  if (records.length === 0) {
    container.innerHTML = '<div class="text-center text-gray-400 py-2">今天还没有专注记录</div>';
    return;
  }

  container.innerHTML = records.map(r => {
    const time = new Date(r.startTime);
    const timeStr = `${String(time.getHours()).padStart(2,'0')}:${String(time.getMinutes()).padStart(2,'0')}`;
    return `
      <div class="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
        <div class="flex items-center">
          <div class="w-8 h-8 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center text-sm mr-3">🍅</div>
          <div>
            <div class="text-sm text-gray-800">专注 ${r.actualDuration} 分钟</div>
            <div class="text-xs text-gray-400">${timeStr}</div>
          </div>
        </div>
        <span class="text-xs text-green-600">已完成</span>
      </div>
    `;
  }).join('');
}
