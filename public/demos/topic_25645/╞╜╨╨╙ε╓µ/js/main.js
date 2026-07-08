/* ================================================
   平行宇宙人生模拟器 — Demo JS
   ================================================ */

// ===== Toast =====
function showToast(msg, duration = 3000) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

// ===== Step Navigation =====
let currentStep = 1;
const totalSteps = 5;

function goToStep(n) {
  if (n < 1 || n > totalSteps) return;
  currentStep = n;

  // Hide all steps
  document.querySelectorAll('.demo-step').forEach(s => s.classList.remove('active'));
  // Show target
  const target = document.getElementById('step-' + n);
  if (target) target.classList.add('active');

  // Update step dots
  document.querySelectorAll('.step-dot').forEach(dot => {
    const ds = parseInt(dot.dataset.step);
    dot.classList.remove('active', 'done');
    if (ds < n) dot.classList.add('done');
    if (ds === n) dot.classList.add('active');
  });

  // Update step lines
  document.querySelectorAll('.step-line').forEach((line, i) => {
    line.classList.toggle('done', i < n - 1);
  });

  // Scroll to demo
  const demo = document.getElementById('demo');
  if (demo) demo.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ===== Suggestion Tags =====
document.querySelectorAll('.suggestion-tag').forEach(tag => {
  tag.addEventListener('click', () => {
    const input = document.getElementById('decisionInput');
    if (input) {
      input.value = tag.dataset.text;
      input.focus();
    }
  });
});

// ===== Step 1 → Step 2 =====
document.getElementById('btnStep1').addEventListener('click', () => {
  const input = document.getElementById('decisionInput');
  const text = input ? input.value.trim() : '';
  if (!text) {
    showToast('💡 请先输入你的「如果当初」~');
    if (input) input.focus();
    return;
  }
  goToStep(2);
  startGenerating(text);
});

// ===== Simulated Generation =====
function startGenerating(decisionText) {
  const progressBar = document.getElementById('genProgressBar');
  const genLog = document.getElementById('genLog');
  const genStatus = document.getElementById('genStatus');

  // Reset
  if (progressBar) progressBar.style.width = '0%';
  if (genLog) genLog.querySelectorAll('.log-line').forEach(l => l.classList.remove('done'));
  if (genStatus) genStatus.textContent = '🪐 正在构建平行宇宙…';

  const steps = [
    { pct: 20,  logIdx: 0, text: '✓ 分析原始抉择...' },
    { pct: 45,  logIdx: 1, text: '⚡ 正在推演平行人生轨迹...' },
    { pct: 70,  logIdx: 2, text: '✓ 生成关键人生事件...' },
    { pct: 90,  logIdx: 3, text: '⚡ 构建角色卡...' },
  ];

  let i = 0;
  const tick = () => {
    if (i >= steps.length) {
      // Done
      if (progressBar) progressBar.style.width = '100%';
      const lines = genLog ? genLog.querySelectorAll('.log-line') : [];
      lines.forEach(l => l.classList.add('done'));
      if (genStatus) genStatus.textContent = '✅ 平行宇宙生成完成！';
      setTimeout(() => goToStep(3), 800);
      return;
    }
    const s = steps[i];
    if (progressBar) progressBar.style.width = s.pct + '%';
    const lines = genLog ? genLog.querySelectorAll('.log-line') : [];
    if (lines[s.logIdx]) lines[s.logIdx].classList.add('done');
    if (genStatus) genStatus.textContent = s.text;
    i++;
    setTimeout(tick, 600 + Math.random() * 400);
  };
  setTimeout(tick, 500);
}

// ===== Step 3 → Step 4 =====
const btnStep3 = document.getElementById('btnStep3');
if (btnStep3) {
  btnStep3.addEventListener('click', () => goToStep(4));
}

// ===== Choice Buttons (Step 4) =====
document.querySelectorAll('.choice-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const choice = btn.dataset.choice;
    const result = document.getElementById('branchResult');
    const title = document.getElementById('endingTitle');
    const text = document.getElementById('endingText');
    const btnNext = document.getElementById('btnStep4');

    if (choice === 'stay') {
      if (title) title.textContent = '你选择了：留下来，陪公司上市';
      if (text) text.textContent = '公司成功上市，你作为核心技术人员获得千万股权。33岁财务自由，开始做天使投资，同时支助家乡的教育事业。平行宇宙的你，活成了别人眼中的"人生赢家"。';
    } else {
      if (title) title.textContent = '你选择了：离职创业，做自己的产品';
      if (text) text.textContent = '创业维艰，前三年几乎没收入。但第四年产品突然爆火，被大厂以5亿收购。平行宇宙的你，现在是独立产品顾问，每年只工作6个月，剩下的时间环游世界。';
    }

    if (result) result.style.display = 'block';
    if (btnNext) {
      btnNext.style.display = 'inline-flex';
      btnNext.onclick = () => goToStep(5);
    }

    // Disable choice buttons
    document.querySelectorAll('.choice-btn').forEach(b => b.disabled = true);
  });
});

// ===== Step 5: Radar Chart =====
function drawRadarChart() {
  const canvas = document.getElementById('radarChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const cx = W / 2, cy = H / 2;
  const R = Math.min(W, H) * 0.35;
  const labels = ['财富', '职业成就', '人际关系', '生活平衡', '健康', '幸福感'];
  const real = [0.45, 0.5, 0.8, 0.75, 0.7, 0.72];
  const para = [0.9, 0.95, 0.5, 0.4, 0.65, 0.6];
  const n = labels.length;

  ctx.clearRect(0, 0, W, H);

  // Grid
  for (let g = 1; g <= 5; g++) {
    const r = R * g / 5;
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const a = -Math.PI / 2 + (2 * Math.PI * i / n);
      const x = cx + r * Math.cos(a);
      const y = cy + r * Math.sin(a);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Spokes
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (2 * Math.PI * i / n);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + R * Math.cos(a), cy + R * Math.sin(a));
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)';
    ctx.stroke();
  }

  // Labels
  ctx.font = '13px "Noto Sans SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (2 * Math.PI * i / n);
    const x = cx + (R + 28) * Math.cos(a);
    const y = cy + (R + 28) * Math.sin(a);
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(labels[i], x, y);
  }

  // Real data (cyan)
  drawData(ctx, cx, cy, R, real, 'rgba(0, 245, 255, 0.25)', '#00f5ff');

  // Parallel data (magenta)
  drawData(ctx, cx, cy, R, para, 'rgba(255, 0, 255, 0.25)', '#ff00ff');
}

function drawData(ctx, cx, cy, R, data, fill, stroke) {
  const n = data.length;
  ctx.beginPath();
  for (let i = 0; i <= n; i++) {
    const idx = i % n;
    const a = -Math.PI / 2 + (2 * Math.PI * idx / n);
    const r = R * data[idx];
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Dots
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (2 * Math.PI * i / n);
    const r = R * data[i];
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, 2 * Math.PI);
    ctx.fillStyle = stroke;
    ctx.fill();
  }
}

// ===== Restart =====
const btnRestart = document.getElementById('btnRestart');
if (btnRestart) {
  btnRestart.addEventListener('click', () => {
    // Reset
    const input = document.getElementById('decisionInput');
    if (input) input.value = '';
    const result = document.getElementById('branchResult');
    if (result) result.style.display = 'none';
    document.querySelectorAll('.choice-btn').forEach(b => b.disabled = false);
    const btnNext = document.getElementById('btnStep4');
    if (btnNext) btnNext.style.display = 'none';
    const lines = document.querySelectorAll('#genLog .log-line');
    lines.forEach(l => l.classList.remove('done'));
    const pb = document.getElementById('genProgressBar');
    if (pb) pb.style.width = '0%';
    const gs = document.getElementById('genStatus');
    if (gs) gs.textContent = '🪐 正在构建平行宇宙…';

    goToStep(1);
  });
}

// ===== Feature card hover mouse-tracking =====
document.querySelectorAll('.feature-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--mouse-x', (e.clientX - rect.left) + 'px');
    card.style.setProperty('--mouse-y', (e.clientY - rect.top) + 'px');
  });
});

// ===== Smooth scroll for nav =====
document.querySelectorAll('.nav-links a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector(a.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// ===== Init =====
window.addEventListener('DOMContentLoaded', () => {
  drawRadarChart();
});
