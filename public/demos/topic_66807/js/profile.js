/* ============================================
   无聊APP · 我的
   ============================================ */

const Profile = {
  render() {
    const m = DATA.me;
    const unlocked = m.achievements.filter(a => a.unlocked).length;
    return `
      <div class="profile-hero">
        <div class="user-avatar">${m.avatar}</div>
        <div>
          <div class="p-name">${U.esc(m.name)}</div>
          <div class="p-meta">${m.decade} · ${m.sign} · ${m.gender} · ${m.region}</div>
          <div class="p-meta">连续签到 ${m.signDays} 天</div>
        </div>
      </div>

      <div class="coin-card">
        <span class="coin-ico">💰</span>
        <div>
          <div style="font-size:11px">无聊币余额</div>
          <div class="coin-num" id="coin-num">${m.coin}</div>
        </div>
        <button class="btn btn-primary coin-btn" onclick="App.goto('park-work')">打工赚币</button>
      </div>

      <div style="margin:0 12px 12px;display:flex;gap:10px">
        <button class="btn btn-mustard" style="flex:1" onclick="Profile.signin()">📅 签到 +1</button>
        <button class="btn btn-sky" style="flex:1" onclick="App.goto('park-dig')">⛏️ 去挖金</button>
      </div>

      <div class="section-title" style="margin:12px 12px 8px">🏆 无聊成就（${unlocked}/${m.achievements.length}）</div>
      <div class="achievement-grid">
        ${m.achievements.map(a => `
          <div class="achv ${a.unlocked?'':'locked'}" title="${a.name}">
            <span>${a.icon}</span>
            <span class="a-name">${U.esc(a.name)}</span>
          </div>
        `).join('')}
      </div>

      <div class="section" style="padding-top:0">
        <div class="section-title">⚙️ 设置</div>
        <div class="board-item" onclick="Select.editProfile();App.switchTab('select')">
          <div class="board-ico" style="background:var(--mint)">👤</div>
          <div><div class="board-name">修改个人画像</div><div class="board-desc">星座/年龄/性别/地区</div></div>
          <span class="board-arrow">›</span>
        </div>
        <div class="board-item" onclick="U.toast('偏好设置开发中…')">
          <div class="board-ico" style="background:var(--sky)">🎨</div>
          <div><div class="board-name">偏好设置</div><div class="board-desc">主题/通知/隐私</div></div>
          <span class="board-arrow">›</span>
        </div>
        <div class="board-item" onclick="U.toast('服装库空空如也，去选择困难症生成穿搭吧')">
          <div class="board-ico" style="background:var(--pink)">👔</div>
          <div><div class="board-name">我的服装库</div><div class="board-desc">收藏的穿搭</div></div>
          <span class="board-arrow">›</span>
        </div>
        <div class="board-item" onclick="U.toast('关于无聊APP：世界很大，无聊一下。')">
          <div class="board-ico" style="background:var(--mustard)">ℹ️</div>
          <div><div class="board-name">关于无聊</div><div class="board-desc">版本 V1.0 · TRAE比赛Demo</div></div>
          <span class="board-arrow">›</span>
        </div>
      </div>
      <div style="height:20px"></div>
    `;
  },
  init() {},
  signin() {
    DATA.me.signDays++;
    U.addCoin(1);
    U.toast(`签到成功！连续第${DATA.me.signDays}天 +1币`);
    App.renderCurrent();
  },

  // ===== 打工赚币 =====
  work() {
    const jobs = [
      { icon: '🍳', name: '炒饭工', pay: 10, time: '3秒' },
      { icon: '🧹', name: '扫地僧', pay: 8, time: '2秒' },
      { icon: '📦', name: '搬砖', pay: 12, time: '4秒' },
      { icon: '💻', name: '写代码', pay: 15, time: '5秒' },
      { icon: '🎤', name: '卖唱', pay: 7, time: '2秒' },
      { icon: '🐕', name: '遛狗', pay: 9, time: '3秒' },
    ];
    return `
      <div class="section">
        <div class="section-title">💼 打工赚取无聊币</div>
        <p style="font-size:13px;color:var(--ink-soft);margin-bottom:14px">选一份工作，等几秒就赚到币</p>
        <div class="opt-grid">
          ${jobs.map((j, i) => `
            <div class="choice-card" style="background:var(--paper);box-shadow:var(--sh-sm)" id="job-${i}">
              <span class="ico">${j.icon}</span>
              <div class="name">${j.name}</div>
              <div class="desc">+${j.pay}币 / ${j.time}</div>
              <button class="btn btn-primary" style="margin-top:8px;width:100%" onclick="Profile.doWork(${i})">开工</button>
            </div>
          `).join('')}
        </div>
        <div class="card card-mustard" style="margin-top:14px">
          <div style="font-family:var(--font-display);font-size:16px">💡 打工小贴士</div>
          <div style="font-size:13px;margin-top:4px;line-height:1.5">写代码工资最高但要5秒；卖唱最快但钱少。无聊币可以用来拆盲盒、买彩票、剧场打赏。</div>
        </div>
      </div>
    `;
  },
  workInit() {},
  doWork(i) {
    const jobs = [
      { icon: '🍳', name: '炒饭工', pay: 10, time: 3 },
      { icon: '🧹', name: '扫地僧', pay: 8, time: 2 },
      { icon: '📦', name: '搬砖', pay: 12, time: 4 },
      { icon: '💻', name: '写代码', pay: 15, time: 5 },
      { icon: '🎤', name: '卖唱', pay: 7, time: 2 },
      { icon: '🐕', name: '遛狗', pay: 9, time: 3 },
    ];
    const j = jobs[i];
    const card = document.getElementById(`job-${i}`);
    const btn = card.querySelector('button');
    btn.disabled = true;
    btn.textContent = `打工中…`;
    card.style.opacity = '.7';
    let left = j.time;
    const timer = setInterval(() => {
      left--;
      btn.textContent = `打工中…${left}s`;
      if (left <= 0) {
        clearInterval(timer);
        btn.disabled = false;
        btn.textContent = '开工';
        card.style.opacity = '1';
        U.addCoin(j.pay);
        U.toast(`${j.icon} ${j.name}完成！+${j.pay}币`);
      }
    }, 1000);
  },

  // ===== 金矿挖金 =====
  dig() {
    return `
      <div class="section">
        <div class="section-title">⛏️ 金矿挖金子</div>
        <div class="card card-mustard" style="margin-bottom:12px">
          <div style="font-family:var(--font-display);font-size:18px">💎 神秘金矿</div>
          <div style="font-size:13px;margin-top:4px">点格子挖矿，可能挖到金子（1-100币）、石头、或啥也没有</div>
        </div>
        <div class="dig-grid" id="dig-grid">
          ${Array.from({length: 25}, (_, i) => `<div class="dig-cell" data-idx="${i}" onclick="Profile.digCell(${i})">⛏️</div>`).join('')}
        </div>
        <div id="dig-result" style="text-align:center;margin-top:14px;font-family:var(--font-display);font-size:18px;min-height:24px;color:var(--red)">挖一挖试试运气！</div>
        <div style="text-align:center;font-size:12px;color:var(--ink-soft);margin-top:8px">剩余矿格：<span id="dig-left">25</span></div>
        <button class="btn btn-primary btn-block btn-lg" style="margin-top:14px" onclick="Profile.digReset()">🔄 重置矿场</button>
      </div>
    `;
  },
  digInit() {
    Profile._digLeft = 25;
    Profile._digRewards = [];
    // 随机布置奖励
    const cells = Array.from({length: 25}, () => null);
    // 3个大奖
    for (let i = 0; i < 3; i++) {
      const idx = U.rand(0, 24);
      cells[idx] = { type: 'gem', amount: U.rand(50, 100), icon: '💎' };
    }
    // 5个中奖
    for (let i = 0; i < 5; i++) {
      let idx;
      do { idx = U.rand(0, 24); } while (cells[idx]);
      cells[idx] = { type: 'gold', amount: U.rand(20, 49), icon: '🪙' };
    }
    // 7个小奖
    for (let i = 0; i < 7; i++) {
      let idx;
      do { idx = U.rand(0, 24); } while (cells[idx]);
      cells[idx] = { type: 'small', amount: U.rand(1, 15), icon: '✨' };
    }
    // 其余是石头/空
    for (let i = 0; i < 25; i++) {
      if (!cells[i]) {
        cells[i] = Math.random() < 0.5
          ? { type: 'rock', amount: 0, icon: '🪨' }
          : { type: 'empty', amount: 0, icon: '💨' };
      }
    }
    Profile._digCells = cells;
  },
  digCell(i) {
    const cell = document.querySelector(`.dig-cell[data-idx="${i}"]`);
    if (cell.classList.contains('dug')) return;
    cell.classList.add('dug');
    const r = Profile._digCells[i];
    cell.textContent = r.icon;
    cell.innerHTML = `<span class="gem">${r.icon}</span>`;
    Profile._digLeft--;
    document.getElementById('dig-left').textContent = Profile._digLeft;
    const result = document.getElementById('dig-result');
    if (r.amount > 0) {
      U.addCoin(r.amount);
      result.innerHTML = `${r.icon} 挖到了 <b style="color:var(--red)">+${r.amount}</b> 无聊币！`;
    } else if (r.type === 'rock') {
      result.innerHTML = `🪨 一块石头，啥也没有`;
    } else {
      result.innerHTML = `💨 空空如也，再试试别处`;
    }
    if (Profile._digLeft === 0) {
      result.innerHTML += `<br>🎉 矿场已挖空，点击下方按钮重置！`;
    }
  },
  digReset() {
    Profile.digInit();
    App.renderCurrent();
    U.toast('矿场已重置 🔨');
  },
};

window.Profile = Profile;
