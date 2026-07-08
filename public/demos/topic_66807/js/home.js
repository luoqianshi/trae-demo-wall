/* ============================================
   无聊APP · 首页
   ============================================ */

const Home = {
  render() {
    const d = DATA;
    const changeTxt = d.boredIndex.change >= 0
      ? `比昨天上升了 ${d.boredIndex.change}%，恭喜你`
      : `比昨天下降了 ${-d.boredIndex.change}%，不行`;
    const status = d.boredIndex.value >= 90 ? '病入膏肓' : d.boredIndex.value >= 75 ? '晚期' : d.boredIndex.value >= 60 ? '中期' : '正常';

    return `
      <div class="home-hero">
        <h2>今日无聊指数</h2>
        <div class="bored-num">${d.boredIndex.value}%</div>
        <div class="bar bored-bar"><div class="bar-fill" style="width:${d.boredIndex.value}%"></div></div>
        <div class="hero-sub">${changeTxt} · 当前状态：${status}</div>
      </div>

      <div class="weather-card">
        <div class="weather-ico">${d.weather.icon}</div>
        <div class="weather-text">
          <b>无聊天气预报</b>
          ${d.weather.text}
        </div>
      </div>

      <div class="dice-entry" onclick="Home.rollHomeDice(this)">
        <span class="big-dice">🎲</span>
        <p>点我决定今天做什么</p>
      </div>

      <div class="feature-grid">
        <!-- 左列：选择困难症（大卡片，跨2行） -->
        <div class="feat feat-big" onclick="App.switchTab('select')">
          <span class="feat-ico">🎯</span>
          <div>
            <div class="feat-name">选择困难症</div>
            <div class="feat-desc">穿什么吃什么<br>我帮你选</div>
          </div>
        </div>
        <!-- 右列第1行 -->
        <div class="feat feat-square" onclick="App.switchTab('square')">
          <span class="feat-ico">🏛️</span>
          <div class="feat-name">无聊广场</div>
          <div class="feat-desc">社区/树洞/吹牛</div>
        </div>
        <!-- 右列第2行 -->
        <div class="feat feat-park" onclick="App.switchTab('park')">
          <span class="feat-ico">🎮</span>
          <div class="feat-name">无聊乐园</div>
          <div class="feat-desc">火锅/盲盒/许愿</div>
        </div>
        <!-- 左列第3行：两个小卡片并排 -->
        <div class="feat-row">
          <div class="feat feat-wish" onclick="App.goto('park-wish')">
            <span class="feat-ico">🌠</span>
            <div class="feat-name">云许愿</div>
          </div>
          <div class="feat feat-plane" onclick="App.goto('park-plane')">
            <span class="feat-ico">✈️</span>
            <div class="feat-name">无聊飞机</div>
          </div>
        </div>
        <!-- 右列第3行 -->
        <div class="feat feat-challenge" onclick="App.goto('square-challenge')">
          <span class="feat-ico">⚡</span>
          <div class="feat-name">无聊挑战</div>
          <div class="feat-desc">打卡挑战</div>
        </div>
      </div>

      <div class="picks">
        <div class="section-title">今日精选</div>
        ${d.picks.map(p => `
          <div class="pick">
            <div class="pick-tag">${p.tag}</div>
            <div class="pick-text">${p.text}<br><small>${p.sub}</small></div>
          </div>
        `).join('')}
      </div>
      <div style="height:20px"></div>
    `;
  },

  init() {},

  rollHomeDice(el) {
    el.classList.add('spinning');
    setTimeout(() => {
      el.classList.remove('spinning');
      const entry = U.pick(DATA.diceEntries);
      U.modal(`
        <div style="text-align:center">
          <div style="font-size:60px">${entry.icon}</div>
          <h3 style="font-family:var(--font-display);font-size:22px;margin:8px 0">今天去：${entry.name}</h3>
          <p style="font-size:13px;color:var(--ink-soft);margin-bottom:14px">命运骰子已经转动，去吧！</p>
          <button class="btn btn-primary btn-block btn-lg" onclick="U.closeModal();App.goto('${entry.target}')">出发 →</button>
          <button class="btn btn-block" style="margin-top:8px" onclick="U.closeModal()">不了，谢谢</button>
        </div>
      `);
    }, 800);
  },
};

window.Home = Home;
