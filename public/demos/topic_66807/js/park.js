/* ============================================
   无聊APP · 无聊乐园
   - 火锅店：抢座+锅+10凳子+加料历史+溢出
   - 商城：店内场景+柜台+NPC+人物头顶提示
   - 云撸猫：触摸交互+文字对话
   - 盲盒：一堆盲盒选一个拆开
   - 彩票站：先发号码，1分钟后公布
   ============================================ */

const Park = {
  // 乐园主页
  render() {
    const tab = Park._parkTab || 'anytime';
    const anytimeList = DATA.parkAnytime.map(p => `
      <div class="park-card" onclick="App.goto('park-${p.id}')">
        <div class="board-ico" style="background:${p.color}">${p.icon}</div>
        <div style="flex:1">
          <div class="pk-name">${U.esc(p.name)}</div>
          <div class="pk-desc">${U.esc(p.desc)}</div>
        </div>
        <span class="pk-arrow">›</span>
      </div>
    `).join('');
    const scheduledList = DATA.parkScheduled.map(p => `
      <div class="park-card" onclick="App.goto('park-${p.id}')">
        <div class="board-ico" style="background:${p.color}">${p.icon}</div>
        <div style="flex:1">
          <div class="pk-name">${U.esc(p.name)}</div>
          <div class="pk-desc">${U.esc(p.desc)}</div>
          <div class="pk-tag">⏰ ${U.esc(p.time)}</div>
        </div>
        <span class="pk-arrow">›</span>
      </div>
    `).join('');
    return `
      <div class="park-list">
        <div class="park-tabs">
          <div class="park-tab ${tab==='anytime'?'active':''}" onclick="Park.setParkTab('anytime')">🎮 随便进</div>
          <div class="park-tab ${tab==='scheduled'?'active':''}" onclick="Park.setParkTab('scheduled')">⏰ 定时游戏</div>
        </div>
        ${tab === 'anytime' ? `
          <div class="park-section-title">随便进，随时玩</div>
          ${anytimeList}
        ` : `
          <div class="park-section-title">报名定点开放</div>
          ${scheduledList}
        `}
        <div style="height:20px"></div>
      </div>
    `;
  },
  init() {},
  setParkTab(tab) {
    Park._parkTab = tab;
    App.renderCurrent();
  },

  // ===== 火锅店：大锅 + 左侧加料 + 溢出 =====
  hotpot() {
    const h = DATA.hotpot;
    const fillPct = Math.min(100, (h.totalAdded / h.overflowAt) * 100);
    const overflowed = h.totalAdded >= h.overflowAt;
    const hostLine = overflowed ? '💥 锅要溢出来啦！别加了别加了！'
      : fillPct > 80 ? '🔥 锅快满了，再加要溢！'
      : fillPct > 50 ? '😋 这锅闻起来越来越香了~'
      : '👋 选数量，点加料，料就进锅！';
    return `
      <div class="hotpot-stage">
        <div class="park-host-row">
          <div class="park-host">🧑‍🍳</div>
          <div class="park-host-bubble" id="hotpot-host-bubble">${hostLine}</div>
        </div>
        <div class="hotpot-status">🔥 当前 <b>${h.online}</b> 人围观 · 锅里 <b>${h.totalAdded}</b> 份料</div>

        <div class="hotpot-scene">
          <div class="hotpot-controls">
            <div class="amount-pick">
              <span>数量</span>
              ${h.amounts.map(a => `<button class="btn ${Park._foodAmount===a?'btn-red':'btn-sky'}" onclick="Park.setAmount(${a})">${a}</button>`).join('')}
            </div>
            <div class="food-btns">
              ${h.foodTypes.map(f => `
                <button class="food-btn" onclick="Park.addFood('${f.key}','${f.ico}','${f.name}')">${f.ico} ${U.esc(f.name)}</button>
              `).join('')}
            </div>
          </div>

          <div class="hotpot-pot ${overflowed?'overflowing':''}" id="hotpot-pot">
            <div class="pot-fill" id="pot-fill" style="height:${fillPct}%"></div>
            <div class="pot-bubbles" id="pot-bubbles"></div>
          </div>
          ${overflowed ? '<div class="overflow-notice" id="overflow-notice">💥 料和汤往外溢啦！</div>' : ''}
        </div>

        <div class="hotpot-history">
          <div class="hotpot-history-title">📜 加料历史</div>
          <div class="hotpot-history-list" id="hotpot-history-list">
            ${h.history.slice(0, 10).map(rec => `
              <div class="history-item">
                <div class="hi-user">${rec.ico} ${U.esc(rec.user)}</div>
                <div class="hi-text">${U.esc(rec.text)}</div>
              </div>
            `).join('')}
            ${h.history.length === 0 ? '<div class="hi-text" style="opacity:.6">还没有人加料</div>' : ''}
          </div>
        </div>
      </div>
    `;
  },
  hotpotInit() {
    Park._foodAmount = 10;
    Park._bubbleTimer = setInterval(() => {
      const pot = document.getElementById('hotpot-pot');
      if (!pot) { clearInterval(Park._bubbleTimer); return; }
      const bubble = document.createElement('div');
      bubble.className = 'pot-bubble';
      bubble.style.left = (Math.random() * 60 + 20) + '%';
      bubble.style.bottom = '20%';
      pot.appendChild(bubble);
      setTimeout(() => bubble.remove(), 1500);
    }, 800);
    // 掌柜定时喊话
    Park._hostTimer = setInterval(() => {
      const bubble = document.getElementById('hotpot-host-bubble');
      if (!bubble) { clearInterval(Park._hostTimer); return; }
      const lines = ['🔥 滚烫滚烫，趁热加料！','🌶️ 今天辣锅特别香！','🥢 加完料记得搅拌一下','🍲 这锅快变成八宝粥了'];
      bubble.style.animation = 'none'; void bubble.offsetWidth;
      bubble.style.animation = 'pop .35s';
      bubble.textContent = U.pick(lines);
    }, 5000);
  },
  setAmount(n) {
    Park._foodAmount = n;
    App.renderCurrent();
  },
  addFood(key, ico, name) {
    const h = DATA.hotpot;
    const amount = Park._foodAmount;
    h.totalAdded += amount;
    const wasOverflow = h.totalAdded >= h.overflowAt;

    // 加料历史
    h.history.unshift({ user: DATA.me.name, text: `加了${amount}份${name}`, time: '刚刚', amount, ico });

    // 食材飞入动画 + 落进锅里
    const pot = document.getElementById('hotpot-pot');
    const stage = document.querySelector('.hotpot-scene');
    if (pot && stage) {
      const pr = pot.getBoundingClientRect();
      const sr = stage.getBoundingClientRect();
      const cx = pr.left - sr.left + pr.width / 2;
      const cy = pr.top - sr.top + pr.height / 2;
      for (let k = 0; k < Math.min(5, amount); k++) {
        const fly = document.createElement('div');
        fly.className = 'fly-food';
        fly.textContent = ico;
        fly.style.left = (10 + Math.random() * 70) + 'px';
        fly.style.top = (20 + Math.random() * (sr.height - 60)) + 'px';
        const fx = cx - parseFloat(fly.style.left);
        const fy = cy - parseFloat(fly.style.top);
        fly.style.setProperty('--fx', fx + 'px');
        fly.style.setProperty('--fy', fy + 'px');
        stage.appendChild(fly);
        setTimeout(() => fly.remove(), 800);
      }

      // 在锅里生成食材（数量有限制）
      const foodsToAdd = Math.min(3, amount);
      for (let k = 0; k < foodsToAdd; k++) {
        const pf = document.createElement('div');
        pf.className = 'pot-food';
        pf.textContent = ico;
        const angle = Math.random() * Math.PI * 2;
        const radius = 25 + Math.random() * 55;
        pf.style.left = `calc(50% + ${Math.cos(angle) * radius}px)`;
        pf.style.top = `calc(50% + ${Math.sin(angle) * radius}px)`;
        pf.style.animationDelay = (Math.random() * 1.5) + 's';
        pot.appendChild(pf);
      }
      while (pot.querySelectorAll('.pot-food').length > 30) {
        pot.querySelector('.pot-food').remove();
      }
    }

    // 更新状态文字
    const statusEl = document.querySelector('.hotpot-status');
    if (statusEl) {
      statusEl.innerHTML = `🔥 当前 <b>${h.online}</b> 人围观 · 锅里 <b>${h.totalAdded}</b> 份料`;
    }

    // 更新锅填充
    const fillEl = document.getElementById('pot-fill');
    if (fillEl) {
      const pct = Math.min(100, (h.totalAdded / h.overflowAt) * 100);
      fillEl.style.height = pct + '%';
    }

    // 溢出特效
    if (wasOverflow) {
      const pot2 = document.getElementById('hotpot-pot');
      pot2.classList.add('overflowing');
      for (let k = 0; k < 12; k++) {
        const spill = document.createElement('div');
        spill.style.cssText = `position:absolute;font-size:20px;pointer-events:none;z-index:10`;
        spill.textContent = U.pick(['💦','🍲','🔥']);
        spill.style.left = '50%';
        spill.style.top = '40%';
        pot2.appendChild(spill);
        const ang = (k / 12) * Math.PI * 2;
        const dist = 60 + Math.random() * 40;
        spill.animate([
          { transform: 'translate(0,0)', opacity: 1 },
          { transform: `translate(${Math.cos(ang)*dist}px,${Math.sin(ang)*dist + 30}px)`, opacity: 0 }
        ], { duration: 800 }).onfinish = () => spill.remove();
      }
      U.toast('💥 料和汤往外溢啦！');
    }

    // 更新历史列表
    const histList = document.getElementById('hotpot-history-list');
    if (histList) {
      histList.insertAdjacentHTML('afterbegin', `
        <div class="history-item" style="background:var(--mustard)">
          <span style="font-size:14px">${ico}</span>
          <div style="flex:1;font-size:11px;line-height:1.3">
            <b>${U.esc(DATA.me.name)}</b><br>
            加了${amount}份${U.esc(name)}
          </div>
          <span style="font-size:10px;color:var(--ink-soft)">刚刚</span>
        </div>
      `);
    }

    U.toast(`+${amount}份${name} 已下锅 🍲`);
  },

  // ===== 吹牛商城：奢侈品专售 =====
  shop() {
    return `
      <div class="shop-stage shop-interior">
        <div class="shop-banner">🏪 吹牛商城 · 奢侈品专售</div>

        <!-- 店内场景：奢侈品货架 + 柜台 + NPC + 顾客 -->
        <div class="shop-scene">
          <div class="shop-shelves">
            <div class="shelf">👜 👜 👜 👜</div>
            <div class="shelf">💎 ⌚ 💍 👠</div>
            <div class="shelf">🏎️ 🛥️ ✈️ 🏰</div>
          </div>
          <div class="shop-counter">
            <div style="font-family:var(--font-display);font-size:14px;color:var(--ink)">柜台</div>
            <div style="font-size:24px">🧾</div>
          </div>
          <div class="npc-stand" id="npc-stand">
            <div class="npc-avatar-big" id="npc-avatar">🎩</div>
            <div class="npc-name-tag">阿财·店员</div>
            <div class="npc-bubble" id="npc-bubble">您好！这里是吹牛商城，奢侈品随便买。</div>
          </div>
          <div class="cust-row">
            <div class="cust-char" id="cust-1">
              <div class="cc-avatar">🧑</div>
              <div class="cc-msg" id="cust-msg-1"></div>
            </div>
            <div class="cust-char" id="cust-2">
              <div class="cc-avatar">👩</div>
              <div class="cc-msg" id="cust-msg-2"></div>
            </div>
            <div class="cust-char" id="cust-3">
              <div class="cc-avatar">👴</div>
              <div class="cc-msg" id="cust-msg-3"></div>
            </div>
          </div>
        </div>

        <!-- 快捷购买（只卖奢侈品） -->
        <div class="shop-quick">
          <button class="btn btn-sky" onclick="Park.shopQuick('给我来十条爱马仕')">👜 十条爱马仕</button>
          <button class="btn btn-sky" onclick="Park.shopQuick('来一百克拉钻石')">💎 一百克拉钻石</button>
          <button class="btn btn-sky" onclick="Park.shopQuick('买一架私人飞机')">✈️ 私人飞机</button>
          <button class="btn btn-sky" onclick="Park.shopQuick('来一艘游艇')">🛥️ 游艇</button>
          <button class="btn btn-sky" onclick="Park.shopQuick('买一辆劳斯莱斯')">🏎️ 劳斯莱斯</button>
          <button class="btn btn-sky" onclick="Park.shopQuick('买下一座海岛')">🏝️ 买座海岛</button>
        </div>

        <div class="shop-input">
          <input id="shop-input" class="input" placeholder="输入离谱要求…"/>
          <button class="btn btn-mustard" onclick="Park.shopSend()">发送</button>
        </div>

        <div class="shop-msgs" id="shop-msgs">
          <div class="msg-line msg-user">🧑 顾客A：来十条爱马仕</div>
          <div class="msg-line msg-npc">🎩 阿财：好嘞！已包好金光闪闪的礼盒</div>
        </div>
      </div>
    `;
  },
  shopInit() {
    Park._plates = 0;
    Park._custIdx = 0;
  },
  shopSend() {
    const input = document.getElementById('shop-input');
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    Park._shopReply(text);
  },
  shopQuick(text) {
    document.getElementById('shop-input').value = text;
    Park.shopSend();
  },
  _shopReply(text) {
    const msgs = document.getElementById('shop-msgs');
    msgs.insertAdjacentHTML('beforeend', `<div class="msg-line msg-user">我：${U.esc(text)}</div>`);
    msgs.scrollTop = msgs.scrollHeight;

    // 匹配回复
    let reply = DATA.npcDefault.replace('{item}', text);
    for (const r of DATA.npcReplies) {
      if (r.keys.some(k => text.includes(k))) { reply = r.reply; break; }
    }
    const bubble = document.getElementById('npc-bubble');
    bubble.style.animation = 'none'; void bubble.offsetWidth;
    bubble.style.animation = 'pop .4s';
    bubble.textContent = reply;

    // 让顾客也冒泡
    Park._custIdx = (Park._custIdx + 1) % 3;
    const custBubble = document.getElementById(`cust-msg-${Park._custIdx + 1}`);
    if (custBubble) {
      custBubble.textContent = U.pick(['我也要！','加我一个！','老板真厉害','这店绝了']);
      custBubble.classList.add('show');
      setTimeout(() => custBubble.classList.remove('show'), 2500);
    }
    // 头顶提示：购买内容
    const npcAvatar = document.getElementById('npc-avatar');
    if (npcAvatar) {
      const tip = document.createElement('div');
      tip.className = 'npc-head-tip';
      tip.textContent = `已安排：${text}`;
      npcAvatar.appendChild(tip);
      setTimeout(() => tip.remove(), 2200);
    }

    setTimeout(() => {
      msgs.insertAdjacentHTML('beforeend', `<div class="msg-line msg-npc">🎩 阿财：${U.esc(reply)}</div>`);
      msgs.scrollTop = msgs.scrollHeight;
    }, 400);
  },

  // ===== 云许愿 =====
  wish() {
    return `
      <div class="wish-stage">
        <div class="wish-sky" id="wish-sky">
          ${Array.from({length: 30}, (_, i) => {
            const x = Math.random() * 100, y = Math.random() * 100;
            const d = Math.random() * 2;
            return `<div class="star" style="left:${x}%;top:${y}%;animation-delay:${d}s"></div>`;
          }).join('')}
        </div>
        <div style="text-align:center;font-family:var(--font-display);font-size:22px;color:var(--mustard);text-shadow:2px 2px 0 var(--red);margin-bottom:10px">🌟 云许愿</div>
        <p style="font-size:13px;text-align:center;opacity:.9;margin-bottom:14px">写下愿望，抛向天空<br>会有一位匿名天使回复你</p>
        <textarea id="wish-input" class="input" rows="3" placeholder="例如：希望明天不用上班" style="background:rgba(255,255,255,.95)"></textarea>
        <button class="btn btn-mustard btn-block btn-lg" style="margin-top:12px" onclick="Park.throwWish()">✨ 抛向天空</button>
        <div id="wish-result"></div>
      </div>
    `;
  },
  wishInit() {},
  throwWish() {
    const input = document.getElementById('wish-input');
    const text = input.value.trim();
    if (!text) { U.toast('先写个愿望吧'); return; }
    input.value = '';
    const sky = document.getElementById('wish-sky');
    const fly = document.createElement('div');
    fly.className = 'flying-wish';
    fly.textContent = '🌟';
    sky.appendChild(fly);
    U.toast('愿望已飞向天空…');
    setTimeout(() => fly.remove(), 2000);

    setTimeout(() => {
      const reply = U.pick(DATA.angelReplies);
      document.getElementById('wish-result').innerHTML = `
        <div class="wish-reply">
          <div style="display:flex;align-items:center;gap:8px">
            <span class="angel-ico">👼</span>
            <span class="angel-line">匿名天使回复了你</span>
          </div>
          <div class="angel-text" style="margin-top:8px">"${U.esc(reply)}"</div>
          <div style="font-size:11px;opacity:.7;margin-top:6px">你不知道是谁回的 ✨</div>
          <button class="btn btn-mint btn-block" style="margin-top:10px" onclick="Park.wishAgain()">再许一个</button>
        </div>
      `;
      document.getElementById('wish-result').scrollIntoView({behavior:'smooth'});
    }, 2200);
  },
  wishAgain() {
    document.getElementById('wish-result').innerHTML = '';
    U.toast('天空已为你清空 🌌');
  },

  // ===== 盲盒：一堆盲盒选一个 =====
  blindbox() {
    // 生成一堆盲盒（3行4列=12个）
    const pile = Array.from({length: 12}, (_, i) => ({
      idx: i,
      rotated: Math.random() * 30 - 15,
      offsetX: Math.random() * 10 - 5,
      offsetY: Math.random() * 10 - 5,
    }));
    return `
      <div class="blind-stage">
        <div class="park-host-row">
          <div class="park-host">🕵️</div>
          <div class="park-host-bubble" id="blind-host-bubble">选一个吧！每个盒子里都藏着一个离谱～</div>
        </div>
        <div style="font-family:var(--font-display);font-size:22px;color:var(--red);margin:4px 0;text-align:center">🎁 无聊盲盒堆</div>
        <p style="font-size:12px;color:var(--ink-soft);margin-bottom:12px;text-align:center">20无聊币/个 · 从一堆里挑一个拆开</p>
        <div class="blind-pile" id="blind-pile">
          ${pile.map(b => `
            <div class="blind-box-item" data-idx="${b.idx}" style="transform:rotate(${b.rotated}deg) translate(${b.offsetX}px,${b.offsetY}px)" onclick="Park.pickBlind(${b.idx})">
              <div class="blind-box-emoji">🎁</div>
              <div class="blind-box-q">?</div>
            </div>
          `).join('')}
        </div>
        <div id="blind-result"></div>
      </div>
    `;
  },
  blindboxInit() {
    Park._blindHostTimer = setInterval(() => {
      const bubble = document.getElementById('blind-host-bubble');
      if (!bubble) { clearInterval(Park._blindHostTimer); return; }
      const lines = ['左边第三个看起来有点鼓！','据说角落的盒子容易出稀有款～','随便挑，反正都是缘分','拆前吹口气，运气更好哦','手气不错的话给我打个赏～'];
      bubble.style.animation = 'none'; void bubble.offsetWidth;
      bubble.style.animation = 'pop .35s';
      bubble.textContent = U.pick(lines);
    }, 6000);
  },
  pickBlind(idx) {
    if (!U.spendCoin(20)) return;
    const bubble = document.getElementById('blind-host-bubble');
    if (bubble) {
      bubble.textContent = '好眼光！让我看看里面是什么…';
      bubble.style.animation = 'none'; void bubble.offsetWidth;
      bubble.style.animation = 'pop .35s';
    }
    // 高亮选中的，淡化其他
    const pile = document.getElementById('blind-pile');
    const all = pile.querySelectorAll('.blind-box-item');
    all.forEach((el, i) => {
      if (parseInt(el.dataset.idx) === idx) {
        el.classList.add('picked');
        el.innerHTML = '<div class="blind-box-emoji">✨</div>';
      } else {
        el.style.opacity = '0.3';
        el.style.pointerEvents = 'none';
      }
    });
    // 拆开动画
    setTimeout(() => {
      const prize = U.pick(DATA.blindboxPrizes);
      if (bubble) {
        bubble.textContent = prize.rare ? '⭐ 哇！稀有款！' : '🎉 拆到了好东西！';
      }
      document.getElementById('blind-result').innerHTML = `
        <div class="prize-show">
          ${prize.icon}<br>
          恭喜你拆到了<br>
          <span style="font-size:24px;color:var(--ink);font-family:var(--font-display)">${U.esc(prize.name)}</span>
          ${prize.rare ? '<div style="font-size:14px;color:var(--red);margin-top:6px">⭐ 稀有奖品！</div>' : ''}
        </div>
        <button class="btn btn-primary btn-block btn-lg" onclick="App.renderCurrent()">再拆一个 (20币)</button>
      `;
      document.getElementById('blind-result').scrollIntoView({behavior:'smooth'});
    }, 800);
  },

  // ===== 彩票：先发号码，1分钟后公布 =====
  lottery() {
    // 状态：idle / waiting / drawn
    if (!Park._lotteryState) Park._lotteryState = 'idle';
    const clerkIdle = '👋 来一注？中了我请你喝奶茶！';
    const clerkWaiting = Park._lotteryTimeLeft > 10 ? '⏳ 别着急，大奖正在路上～' : '🔥 马上开奖，心跳加速了没？';
    if (Park._lotteryState === 'idle') {
      return `
        <div class="lottery-stage">
          <div class="park-host-row lottery-host">
            <div class="park-host">🎰</div>
            <div class="park-host-bubble" id="lottery-host-bubble">${clerkIdle}</div>
          </div>
          <div style="font-family:var(--font-display);font-size:22px;color:var(--red);margin:4px 0;text-align:center">🎰 无聊彩票站</div>
          <p style="font-size:12px;color:var(--ink-soft);margin-bottom:12px;text-align:center">10无聊币/注 · 先发号码，1分钟后公布</p>
          <div class="lottery-machine" id="lottery-machine">
            <div class="lottery-ball" id="lottery-ball">?</div>
          </div>
          <div class="lottery-ticket" id="lottery-ticket">
            <div class="lottery-ticket-title">🎯 你的彩票</div>
            <div class="lottery-num-row">
              <div class="lottery-num">?</div>
              <div class="lottery-num">?</div>
              <div class="lottery-num">?</div>
              <div class="lottery-num">?</div>
              <div class="lottery-num">?</div>
            </div>
            <div style="font-size:11px;color:var(--ink-soft);margin-top:8px">点击下方按钮买注，号码会自动生成</div>
          </div>
          <button class="btn btn-primary btn-block btn-lg" style="margin-top:14px" onclick="Park.buyLottery()">🎫 买一注 (10币)</button>
          <div style="margin-top:18px;font-size:12px;color:var(--ink-soft);text-align:center">
            <div style="font-weight:800;margin-bottom:6px">中奖榜</div>
            ${DATA.lotteryPrizes.map(p => `<span class="tag tag-mustard" style="margin:3px">${U.esc(p.text)}</span>`).join('')}
          </div>
        </div>
      `;
    }
    if (Park._lotteryState === 'waiting') {
      const left = Park._lotteryTimeLeft;
      return `
        <div class="lottery-stage">
          <div class="park-host-row lottery-host">
            <div class="park-host">🎰</div>
            <div class="park-host-bubble" id="lottery-host-bubble">${clerkWaiting}</div>
          </div>
          <div style="font-family:var(--font-display);font-size:22px;color:var(--red);margin:4px 0;text-align:center">🎰 等待开奖…</div>
          <div class="lottery-machine">
            <div class="lottery-ball rolling">🎲</div>
          </div>
          <div class="lottery-ticket" style="background:var(--mustard)">
            <div class="lottery-ticket-title">🎯 你的号码</div>
            <div class="lottery-num-row">
              ${Park._myTicket.map(n => `<div class="lottery-num mine">${n}</div>`).join('')}
            </div>
          </div>
          <div class="countdown-big" id="lottery-countdown">${left}s</div>
          <div style="text-align:center;font-size:13px;color:var(--ink-soft)">⏰ 1分钟后公布中奖号码</div>
          <div style="text-align:center;font-size:11px;color:var(--ink-soft);margin-top:6px">（演示版加快到30秒）</div>
        </div>
      `;
    }
    // drawn
    const matched = Park._myTicket.filter((n, i) => n === Park._winningNum[i]).length;
    const won = matched >= 3;
    const prize = won ? U.pick(DATA.lotteryPrizes) : null;
    return `
      <div class="lottery-stage">
        <div class="park-host-row lottery-host">
          <div class="park-host">🎰</div>
          <div class="park-host-bubble" id="lottery-host-bubble">${won ? '🎉 中了！我就说你手气好！' : '😢 可惜，再来一注转运！'}</div>
        </div>
        <div style="font-family:var(--font-display);font-size:22px;color:var(--red);margin:4px 0;text-align:center">🎉 开奖结果</div>
        <div class="lottery-ticket">
          <div class="lottery-ticket-title">🎯 你的号码</div>
          <div class="lottery-num-row">
            ${Park._myTicket.map((n, i) => `<div class="lottery-num ${n===Park._winningNum[i]?'hit':''}">${n}</div>`).join('')}
          </div>
        </div>
        <div class="lottery-ticket" style="background:var(--red);color:#fff">
          <div class="lottery-ticket-title">🏆 中奖号码</div>
          <div class="lottery-num-row">
            ${Park._winningNum.map(n => `<div class="lottery-num win">${n}</div>`).join('')}
          </div>
        </div>
        <div style="text-align:center;font-size:18px;font-family:var(--font-display);color:${won?'var(--red)':'var(--ink-soft)'};margin:14px 0">
          ${won ? `🎉 中了${matched}个号码！` : `😢 只中了${matched}个，下次加油`}
        </div>
        ${won ? `
          <div class="prize-show">
            💰<br>${U.esc(prize.text)}<br>
            <span style="font-size:36px;color:var(--ink)">¥${U.esc(prize.amount)}</span>
          </div>
        ` : ''}
        <button class="btn btn-primary btn-block btn-lg" style="margin-top:14px" onclick="Park.resetLottery()">再买一注</button>
      </div>
    `;
  },
  lotteryInit() {
    Park._lotteryState = 'idle';
  },
  buyLottery() {
    if (!U.spendCoin(10)) return;
    Park._myTicket = Array.from({length: 5}, () => U.rand(0, 9));
    Park._lotteryState = 'waiting';
    Park._lotteryTimeLeft = 30;  // 演示版30秒
    App.renderCurrent();
    U.toast('🎫 已购买！等待开奖…');
    Park._lotteryTimer = setInterval(() => {
      Park._lotteryTimeLeft--;
      const el = document.getElementById('lottery-countdown');
      if (!el) { clearInterval(Park._lotteryTimer); return; }
      el.textContent = Park._lotteryTimeLeft + 's';
      if (Park._lotteryTimeLeft <= 0) {
        clearInterval(Park._lotteryTimer);
        Park.drawLottery();
      }
    }, 1000);
  },
  drawLottery() {
    // 铁定中奖：保留我的号码，再随机改动 0-2 位，保证至少中 3 个
    Park._winningNum = [...Park._myTicket];
    const positions = [0, 1, 2, 3, 4].sort(() => Math.random() - 0.5);
    const changeCount = U.rand(0, 2);
    for (let i = 0; i < changeCount; i++) {
      const pos = positions[i];
      let newNum;
      do { newNum = U.rand(0, 9); } while (newNum === Park._myTicket[pos]);
      Park._winningNum[pos] = newNum;
    }
    Park._lotteryState = 'drawn';
    App.renderCurrent();
    const matched = Park._myTicket.filter((n, i) => n === Park._winningNum[i]).length;
    if (matched >= 3) {
      U.toast('🎉 恭喜中奖！');
    } else {
      U.toast('😢 没中，下次再来');
    }
  },
  resetLottery() {
    Park._lotteryState = 'idle';
    App.renderCurrent();
  },

  // ===== 马拉松 =====
  marathon() {
    const m = DATA.marathon;
    const spectators = ['🧑','👩','👴','👵','🧒','👦'];
    return `
      <div class="marathon-stage">
        <div class="park-host-row" style="justify-content:flex-start">
          <div class="park-host">🎤</div>
          <div class="park-host-bubble" id="marathon-host-bubble">欢迎来到第7届无聊马拉松！报名即可领取号码牌～</div>
        </div>
        <div class="marathon-header">🏃 第7届无聊马拉松</div>
        <div style="text-align:center;font-size:13px;color:var(--ink-soft);margin-bottom:10px">报名人数：${m.runners.length + 20}人 · 全程42.195km</div>
        <div id="marathon-pre">
          <div style="text-align:center;margin:14px 0">
            <div class="bib" id="my-bib" style="display:none">🏅 0724</div>
          </div>
          <div class="countdown" id="countdown">--:--</div>
          <div class="spectator-row" id="spectator-row">
            ${spectators.map((s, i) => `<div class="spectator" style="animation-delay:${i*0.2}s">${s}</div>`).join('')}
          </div>
          <button class="btn btn-primary btn-block btn-lg" id="signup-btn" onclick="Park.signUpMarathon()">📝 报名参赛</button>
        </div>
        <div id="marathon-run" style="display:none">
          <div class="run-track">
            <div style="font-size:13px;margin-bottom:8px">🏃 实时里程</div>
            ${m.runners.map((r, i) => `
              <div class="runner-progress">
                <div class="rp-label"><span class="runner-avatar">${r.avatar}</span><span>${U.esc(r.name)}${r.me?' (我)':''}</span><span id="dist-${i}">0.0 km</span></div>
                <div class="bar"><div class="bar-fill" id="bar-${i}" style="width:0%"></div></div>
              </div>
            `).join('')}
            <div style="font-size:12px;margin-top:8px;color:var(--mustard)">配速：6:30/km · 预计完赛时间：4小时35分</div>
          </div>
          <div class="run-msgs" id="run-msgs"></div>
          <div class="comment-input">
            <input id="run-msg-input" class="input" placeholder="边跑边说点什么…"/>
            <button class="btn btn-primary" onclick="Park.sendRunMsg()">发送</button>
          </div>
        </div>
        <div id="marathon-finish" style="display:none;text-align:center">
          <div class="finish-line">🏁 FINISH 🏁</div>
          <div class="finish-scene">
            <div class="finish-avatar">🐱</div>
            <div class="finish-confetti">🎉🎊🎉</div>
          </div>
          <div class="prize-show" style="background:var(--mustard)">恭喜完赛！<br>获得无聊马拉松完赛奖牌</div>
          <button class="btn btn-primary btn-block btn-lg" onclick="App.renderCurrent()">再来一届</button>
        </div>
      </div>
    `;
  },
  marathonInit() {
    Park._marathon = { signed: false, running: false, timeLeft: 60, distances: DATA.marathon.runners.map(()=>0), finished: false };
  },
  signUpMarathon() {
    Park._marathon.signed = true;
    document.getElementById('my-bib').style.display = 'inline-block';
    document.getElementById('signup-btn').textContent = '等待发令枪…';
    document.getElementById('signup-btn').disabled = true;
    const hostBubble = document.getElementById('marathon-host-bubble');
    if (hostBubble) hostBubble.textContent = '号码牌0724！请到起跑线就位～';
    Park._marathon.timeLeft = 15;
    const cd = document.getElementById('countdown');
    const timer = setInterval(() => {
      Park._marathon.timeLeft--;
      cd.textContent = `00:${String(Park._marathon.timeLeft).padStart(2,'0')}`;
      if (Park._marathon.timeLeft <= 0) {
        clearInterval(timer);
        Park.startMarathon();
      }
    }, 1000);
    U.toast('报名成功！号码牌：0724');
  },
  startMarathon() {
    document.getElementById('marathon-pre').style.display = 'none';
    document.getElementById('marathon-run').style.display = 'block';
    Park._marathon.running = true;
    const hostBubble = document.getElementById('marathon-host-bubble');
    if (hostBubble) {
      hostBubble.textContent = '🔫 发令枪响！选手们冲出去了！';
      hostBubble.style.animation = 'none'; void hostBubble.offsetWidth;
      hostBubble.style.animation = 'pop .4s';
    }
    U.toast('🔫 发令枪响！开跑！');
    Park.addRunMsg('系统', '🔫 发令枪响！比赛开始！');
    const msgs = ['跑者A：我跑了2公里了','跑者B：加油！','补给站：请喝水','跑者A：我跑不动了','补给站：前方5公里补给点','跑者B：还有一半！'];
    let mi = 0;
    Park._marathon.msgTimer = setInterval(() => {
      if (mi < msgs.length) {
        const [u, t] = msgs[mi].split('：');
        Park.addRunMsg(u, t);
        mi++;
      }
    }, 3000);
    Park._marathon.runTimer = setInterval(() => {
      let allDone = true;
      Park._marathon.distances.forEach((d, i) => {
        if (d < 42.195) {
          Park._marathon.distances[i] = Math.min(42.195, d + 0.3 + Math.random() * 0.4);
          const distEl = document.getElementById(`dist-${i}`);
          const barEl = document.getElementById(`bar-${i}`);
          if (distEl) distEl.textContent = Park._marathon.distances[i].toFixed(2) + ' km';
          if (barEl) barEl.style.width = (Park._marathon.distances[i] / 42.195 * 100) + '%';
          allDone = false;
        }
      });
      if (allDone) Park.finishMarathon();
    }, 800);
  },
  finishMarathon() {
    clearInterval(Park._marathon.runTimer);
    clearInterval(Park._marathon.msgTimer);
    Park._marathon.finished = true;
    document.getElementById('marathon-run').style.display = 'none';
    document.getElementById('marathon-finish').style.display = 'block';
    Park.addRunMsg('系统', '🎉 比赛结束！全员完赛！');
    U.addCoin(20);
    // 撒花
    const finish = document.getElementById('marathon-finish');
    for (let k = 0; k < 24; k++) {
      const conf = document.createElement('div');
      conf.textContent = U.pick(['🎉','🎊','✨','🥳','🏅']);
      conf.style.cssText = `position:absolute;font-size:20px;pointer-events:none;z-index:10;left:${Math.random()*90+5}%;top:${Math.random()*40+10}%`;
      finish.appendChild(conf);
      conf.animate([
        { transform: 'translate(0,0) rotate(0)', opacity: 1 },
        { transform: `translate(${Math.random()*100-50}px, ${Math.random()*100+50}px) rotate(${Math.random()*360}deg)`, opacity: 0 }
      ], { duration: 1200, delay: Math.random()*300 }).onfinish = () => conf.remove();
    }
  },
  addRunMsg(user, text) {
    const msgs = document.getElementById('run-msgs');
    if (!msgs) return;
    msgs.insertAdjacentHTML('afterbegin', `<div class="msg-line">💬 ${U.esc(user)}：${U.esc(text)}</div>`);
  },
  sendRunMsg() {
    const input = document.getElementById('run-msg-input');
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    const msgs = document.getElementById('run-msgs');
    msgs.insertAdjacentHTML('afterbegin', `<div class="msg-line">💬 我：${U.esc(text)}（刚刚）</div>`);
  },

  // ===== 剧场（场景化） =====
  theater() {
    const hostLine = '欢迎来到无聊电影院！挑个本子，上台演一出好戏～';
    return `
      <div class="theater-stage">
        <div class="park-host-row">
          <div class="park-host">🎬</div>
          <div class="park-host-bubble theater-host-bubble" id="theater-host-bubble">${hostLine}</div>
        </div>

        <div class="theater-hall">
          <div class="theater-curtain left">🟥</div>
          <div class="theater-curtain right">🟥</div>
          <div class="theater-spotlight"></div>
          <div class="theater-stage-floor">
            <div class="director-stand">
              <div class="director">🎬</div>
              <div class="director-bubble">今日热映</div>
            </div>
          </div>
          <div class="theater-neon">🎭 无聊电影院 🎭</div>
        </div>

        <div class="section-title">🎞 正在热映</div>
        <div class="play-poster-list">
          ${DATA.plays.map((p, i) => `
            <div class="play-poster" onclick="App.goto('park-theater-detail',{idx:${i}})">
              <div class="poster-curtain-top"></div>
              <div class="poster-title">《${U.esc(p.title)}》</div>
              <div class="poster-cast">
                ${p.roles.slice(0,3).map(r => `<div class="poster-role" title="${U.esc(r.name)}">${r.avatar}</div>`).join('')}
              </div>
              <div class="poster-tags">
                <span class="tag tag-mint">${p.signedUp}人已报名</span>
                <span class="tag tag-sky">${p.audience}观众</span>
                <span class="tag tag-mustard">${p.tips}币打赏</span>
              </div>
              <div class="poster-deco">${U.pick(['🌟','🎭','🎪','✨'])}</div>
            </div>
          `).join('')}
        </div>

        <button class="btn btn-mustard btn-block btn-lg" style="margin-top:6px" onclick="U.toast('创建剧本功能开发中…')">+ 创建我的电影</button>
        <div style="height:20px"></div>
      </div>
    `;
  },
  theaterInit() {
    Park._theaterHostTimer = setInterval(() => {
      const bubble = document.getElementById('theater-host-bubble');
      if (!bubble) { clearInterval(Park._theaterHostTimer); return; }
      const lines = ['想演哪个角色？快来报名！','上台别紧张，忘词也没事～','观众们都等不及啦！','今晚最佳演员会获得额外打赏！'];
      bubble.style.animation = 'none'; void bubble.offsetWidth;
      bubble.style.animation = 'pop .35s';
      bubble.textContent = U.pick(lines);
    }, 6000);
  },

  theaterDetail(params) {
    const p = DATA.plays[params.idx];
    Park._playIdx = params.idx;
    Park._signedRoles = Park._signedRoles || {};
    const signedRoleName = Object.keys(Park._signedRoles).find(n => Park._signedRoles[n] && p.roles.some(r => r.name === n && r.type === 'open'));
    const myRole = p.roles.find(r => r.name === signedRoleName) || p.roles.find(r => r.type === 'open') || p.roles[0];
    return `
      <div class="theater-stage">
        <div class="theater-show">
          <div class="show-curtain left"></div>
          <div class="show-curtain right"></div>
          <div class="show-lights">
            <div class="spot s1"></div><div class="spot s2"></div><div class="spot s3"></div>
          </div>
          <div class="show-title">🎬 《${U.esc(p.title)}》</div>
          <div class="show-stage-floor">
            <div class="actor-line npc-line">
              ${p.roles.filter(r => r.type === 'npc').map((r, i) => `
                <div class="actor actor-npc" id="actor-npc-${i}" data-role="${U.esc(r.name)}">
                  <div class="actor-bubble" id="npc-bubble-${i}"></div>
                  <div class="actor-avatar">${r.avatar}</div>
                  <div class="actor-name">${U.esc(r.name)}</div>
                </div>
              `).join('')}
            </div>
            <div class="actor-line user-line">
              ${p.roles.filter(r => r.type === 'open').map((r, i) => `
                <div class="actor actor-user ${Park._signedRoles[r.name]?'signed':''}" id="actor-user-${i}" data-role="${U.esc(r.name)}">
                  <div class="actor-bubble" id="user-bubble-${i}"></div>
                  <div class="actor-avatar">${Park._signedRoles[r.name] ? DATA.me.avatar : r.avatar}</div>
                  <div class="actor-name">${U.esc(r.name)}${Park._signedRoles[r.name] ? ' (我)' : ''}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="show-controls">
          <div class="show-audience">
            <span>👥 观众 ${p.audience}人</span>
            <span>💰 打赏 ${p.tips}币</span>
          </div>
          <div class="show-actions">
            <button class="btn btn-mustard" onclick="Park.signRole(${params.idx})">🎭 报名角色</button>
            <button class="btn btn-sky" onclick="Park.npcContinue(${params.idx})">👉 NPC接话</button>
            <button class="btn btn-primary" onclick="Park.tipActor(${params.idx})">💰 打赏5币</button>
          </div>
        </div>

        <div class="section-title">📝 演出剧本</div>
        <div class="dialog-list" id="dialog-list">
          ${p.dialogs.map(d => `
            <div class="dialog-line ${d.type==='npc'?'npc':'user'}">
              <div class="dl-role">${d.avatar||'🎭'} ${U.esc(d.role)} · ${d.type==='npc'?'NPC':'用户'}</div>
              <div class="dl-text">${U.esc(d.text)}</div>
            </div>
          `).join('')}
        </div>

        <div class="role-picker" id="role-picker">
          ${p.roles.map((r, i) => `
            <div class="role-chip ${r.type==='npc'?'taken':''}${Park._signedRoles[r.name]?' taken':''}"
                 onclick="${r.type==='open' ? `Park.confirmRole(${params.idx}, ${i})` : `U.toast('${U.esc(r.name)} 是NPC角色')`}">
              ${r.avatar} ${U.esc(r.name)} ${r.type==='open' ? (Park._signedRoles[r.name] ? '(已报名)' : '(可报名)') : '(NPC)'}
            </div>
          `).join('')}
        </div>

        <div class="comment-input">
          <input id="dialog-input" class="input" placeholder="${signedRoleName ? `以 ${signedRoleName} 的身份说台词…` : '先报名角色，再说台词…'}"/>
          <button class="btn btn-primary" onclick="Park.sendDialog(${params.idx})">说台词</button>
        </div>
        <div style="height:16px"></div>
      </div>
    `;
  },
  theaterDetailInit(params) {
    Park._signedRoles = Park._signedRoles || {};
    const p = DATA.plays[params.idx];
    setTimeout(() => {
      if (p.dialogs.length > 0) {
        const last = p.dialogs[p.dialogs.length - 1];
        Park._theaterHighlightSpeaker(params.idx, last.role, last.text);
      }
    }, 100);
  },
  signRole(idx) {
    const picker = document.getElementById('role-picker');
    if (picker) {
      picker.style.display = picker.style.display === 'grid' ? 'none' : 'grid';
    }
  },
  confirmRole(idx, roleIdx) {
    const p = DATA.plays[idx];
    const role = p.roles[roleIdx];
    if (Park._signedRoles[role.name]) { U.toast('你已经报过这个角色了'); return; }
    Park._signedRoles[role.name] = true;
    p.signedUp++;
    U.toast(`🎭 已报名饰演 ${role.name}`);
    App.renderCurrent();
  },
  sendDialog(idx) {
    const input = document.getElementById('dialog-input');
    const text = input.value.trim();
    if (!text) return;
    const p = DATA.plays[idx];
    const signedRoleName = Object.keys(Park._signedRoles).find(n => Park._signedRoles[n] && p.roles.some(r => r.name === n && r.type === 'open'));
    if (!signedRoleName) { U.toast('先报名一个角色才能说台词'); return; }
    input.value = '';
    const myRole = p.roles.find(r => r.name === signedRoleName);
    p.dialogs.push({ role: myRole.name, type: 'user', text, avatar: myRole.avatar });
    Park._theaterHighlightSpeaker(idx, myRole.name, text);
    const list = document.getElementById('dialog-list');
    list.insertAdjacentHTML('beforeend', `
      <div class="dialog-line user">
        <div class="dl-role">${myRole.avatar} ${U.esc(myRole.name)} · 我</div>
        <div class="dl-text">${U.esc(text)}</div>
      </div>
    `);
    list.scrollTop = list.scrollHeight;
    // NPC 自动接话
    setTimeout(() => Park.npcContinue(idx), 1500);
  },
  npcContinue(idx) {
    const p = DATA.plays[idx];
    const npcRole = p.roles.find(r => r.type === 'npc');
    const lines = [
      '你这个想法很有创意，但本NPC表示看不懂！',
      '说得好！我决定给你加戏！',
      '咳咳，按照剧本，此时应该下起大雨…',
      '你的台词触动了本NPC的内心，我要即兴发挥！',
      '导演！导演在哪？这个人不按套路出牌！',
    ];
    const text = U.pick(lines);
    p.dialogs.push({ role: npcRole.name, type: 'npc', text, avatar: npcRole.avatar });
    Park._theaterHighlightSpeaker(idx, npcRole.name, text);
    const list = document.getElementById('dialog-list');
    list.insertAdjacentHTML('beforeend', `
      <div class="dialog-line npc">
        <div class="dl-role">${npcRole.avatar} ${U.esc(npcRole.name)} · NPC</div>
        <div class="dl-text">${U.esc(text)}</div>
      </div>
    `);
    list.scrollTop = list.scrollHeight;
  },
  _theaterHighlightSpeaker(idx, roleName, text) {
    document.querySelectorAll('.actor-bubble').forEach(b => b.textContent = '');
    document.querySelectorAll('.actor').forEach(a => a.classList.remove('speaking'));
    const actors = document.querySelectorAll('.actor');
    let matched = null;
    actors.forEach(a => { if (a.dataset.role === roleName) matched = a; });
    if (matched) {
      matched.classList.add('speaking');
      const bubble = matched.querySelector('.actor-bubble');
      if (bubble) {
        bubble.textContent = text.length > 18 ? text.slice(0, 18) + '…' : text;
        bubble.style.animation = 'none'; void bubble.offsetWidth;
        bubble.style.animation = 'pop .35s';
      }
    }
  },
  tipActor(idx) {
    if (!U.spendCoin(5)) return;
    DATA.plays[idx].tips += 5;
    U.toast('💰 打赏成功！舞台下起金币雨');
    const stage = document.querySelector('.theater-show');
    if (stage) {
      for (let k = 0; k < 15; k++) {
        const coin = document.createElement('div');
        coin.className = 'coin-rain';
        coin.textContent = U.pick(['💰','💸','🪙','✨']);
        coin.style.left = (Math.random() * 90 + 5) + '%';
        coin.style.animationDelay = (Math.random() * 0.4) + 's';
        stage.appendChild(coin);
        setTimeout(() => coin.remove(), 1200);
      }
    }
    const aud = document.querySelector('.show-audience');
    if (aud) aud.innerHTML = `<span>👥 观众 ${DATA.plays[idx].audience}人</span><span>💰 打赏 ${DATA.plays[idx].tips}币</span>`;
  },

  // ===== 高考 =====
  gaokao() {
    return `
      <div class="gaokao-stage">
        <div class="park-host-row" style="justify-content:flex-start">
          <div class="park-host">👨‍🏫</div>
          <div class="park-host-bubble" id="gk-host-bubble">📚 第3届无聊高考开始啦！请选择你的身份。</div>
        </div>
        <div style="text-align:center;font-family:var(--font-display);font-size:20px;color:var(--red);margin:6px 0">📚 第3届无聊高考</div>
        <div style="text-align:center;font-size:11px;color:var(--ink-soft);margin-bottom:12px">考生${DATA.gaokao.students}人 · 父母${DATA.gaokao.parents}人 · 集合时间：今晚8点</div>

        <div class="exam-hall" id="gk-hall">
          <div class="invigilator">👨‍🏫</div>
          <div class="desk-row">
            ${['👨‍🎓','👩‍🎓','👨‍🎓','👩‍🎓','🧑‍🎓'].map(a => `<div class="exam-desk">${a}</div>`).join('')}
          </div>
          <div class="desk-row">
            ${['👩‍🎓','👨‍🎓','🐱','👩‍🎓','👨‍🎓'].map(a => `<div class="exam-desk">${a}</div>`).join('')}
          </div>
        </div>

        <div id="gk-role" class="role-pick">
          <div class="role-opt" onclick="Park.gkPick('student')" style="background:var(--mustard)">
            <div class="r-ico">👨‍🎓</div>
            <div class="r-name">当考生</div>
            <div style="font-size:11px">答题·看分数</div>
          </div>
          <div class="role-opt" onclick="Park.gkPick('parent')" style="background:var(--pink)">
            <div class="r-ico">👩‍👦</div>
            <div class="r-name">当父母</div>
            <div style="font-size:11px">门口陪考·看榜</div>
          </div>
        </div>

        <div id="gk-exam" style="display:none">
          <div class="section-title">📝 考试科目</div>
          <div class="subject-list">
            ${DATA.gaokao.subjects.map((s, i) => `
              <div class="subject-item">
                <span>📝 ${U.esc(s.name)}</span>
                <span class="tag ${s.done?'tag-mint':'tag-red'}">${s.done?'✅ 已完成':'⏳ 未开始'}</span>
              </div>
            `).join('')}
          </div>
          <button class="btn btn-primary btn-block btn-lg" id="gk-start" onclick="Park.gkStartExam()">开始答题</button>
        </div>

        <div id="gk-result" style="display:none"></div>
      </div>
    `;
  },
  gaokaoInit() {
    Park._gkRole = null;
    Park._gkDone = 0;
  },
  gkPick(role) {
    Park._gkRole = role;
    document.getElementById('gk-role').style.display = 'none';
    document.getElementById('gk-exam').style.display = 'block';
    const bubble = document.getElementById('gk-host-bubble');
    if (bubble) {
      bubble.textContent = role === 'student'
        ? '👨‍🎓 考生请就位，考试即将开始，禁止作弊！'
        : '👩‍👦 家长请在门口等候，不要给孩子压力哦～';
    }
    U.toast(role === 'student' ? '已选择：考生 👨‍🎓' : '已选择：父母 👩‍👦（陪考模式）');
    if (role === 'parent') {
      document.getElementById('gk-start').textContent = '门口等孩子出来';
    }
  },
  gkStartExam() {
    const bubble = document.getElementById('gk-host-bubble');
    if (Park._gkRole === 'parent') {
      if (bubble) bubble.textContent = '⌛ 家长们焦急等待中…';
      Park.gkShowResult();
      return;
    }
    const btn = document.getElementById('gk-start');
    btn.textContent = '答题中…';
    btn.disabled = true;
    if (bubble) bubble.textContent = '📝 考试中…请保持安静！';
    U.toast('正在答题…');
    setTimeout(() => {
      Park._gkDone = 4;
      DATA.gaokao.subjects.forEach(s => { s.done = true; });
      Park.gkShowResult();
    }, 1800);
  },
  gkShowResult() {
    const g = DATA.gaokao;
    const isParent = Park._gkRole === 'parent';
    document.getElementById('gk-exam').style.display = 'none';
    document.getElementById('gk-result').style.display = 'block';
    const bubble = document.getElementById('gk-host-bubble');
    if (bubble) bubble.textContent = isParent ? '🎓 放榜啦！快看看孩子考了多少！' : '🎓 成绩出来啦！';
    document.getElementById('gk-result').innerHTML = `
      <div class="result-scene">
        <div class="result-avatar">${isParent ? '👩‍👦' : '👨‍🎓'}</div>
        <div class="result-reaction">${isParent ? '😭' : '🎉'}</div>
      </div>
      <div style="text-align:center;font-size:13px;color:var(--ink-soft);margin-bottom:8px">🎓 放榜</div>
      <div class="score-show">
        <div style="font-family:var(--font-display);font-size:18px">${isParent?'你孩子的':'你的'}成绩</div>
        ${g.subjects.map(s => `<div style="font-size:14px;margin:4px 0">${U.esc(s.name)}：${s.score}分</div>`).join('')}
        <div class="big-score">${g.total}分</div>
        <div style="font-size:14px">排名第${g.rank}名</div>
      </div>
      <div style="text-align:center;font-size:14px;color:var(--ink-soft)">
        ${isParent ? '家长激动痛哭："孩子你太争气了！"' : '恭喜你！考完啦！'}
      </div>
      <button class="btn btn-primary btn-block btn-lg" style="margin-top:14px" onclick="App.renderCurrent()">再来一次</button>
    `;
    U.addCoin(10);
  },

  // ===== 无聊飞机（漂流瓶） =====
  plane() {
    const b = DATA.planeBottle;
    return `
      <div class="section">
        <div class="section-title">✈️ 无聊飞机 · 漂流瓶</div>
        <div class="card card-sky" style="margin-bottom:12px">
          <div style="font-family:var(--font-display);font-size:16px;margin-bottom:6px">📦 当前在飞的话题</div>
          <div style="font-size:14px;line-height:1.5">${U.esc(b.topic)}</div>
          <div style="font-size:11px;opacity:.8;margin-top:6px">12小时后上岸展示 · 已传递${b.records.length}次</div>
        </div>

        <div class="section-title">📝 发起新话题</div>
        <textarea id="plane-input" class="input" rows="3" placeholder="写一个破话题，让它一直传递…"></textarea>
        <button class="btn btn-primary btn-block btn-lg" style="margin-top:10px" onclick="Park.sendPlane()">✈️ 扔出去</button>

        <div class="section-title">📜 传递记录</div>
        ${b.records.map(r => `
          <div class="card" style="margin-bottom:8px;padding:10px">
            <div style="font-size:11px;color:var(--ink-soft)">${U.esc(r.user)}</div>
            <div style="font-size:13px;margin-top:2px">${U.esc(r.text)}</div>
          </div>
        `).join('')}

        <div class="section-title">🏖️ 上岸展示区</div>
        <div class="card card-mustard">
          <div style="font-size:13px">上一个上岸话题：<br>"今天中午吃什么？"<br>共被传递 47 次</div>
        </div>
        <div style="height:16px"></div>
      </div>
    `;
  },
  planeInit() {},
  sendPlane() {
    const input = document.getElementById('plane-input');
    const text = input.value.trim();
    if (!text) { U.toast('写点什么再扔'); return; }
    input.value = '';
    DATA.planeBottle.records.push({ user: '匿名·我', text });
    U.toast('✈️ 已扔出去！将随机传给在线用户');
    setTimeout(() => App.renderCurrent(), 500);
  },

  // ===== 无聊减肥 =====
  diet() {
    return `
      <div class="section">
        <div class="section-title">🏃 无聊减肥打卡</div>
        <div class="card card-mint" style="margin-bottom:12px">
          <div style="font-family:var(--font-display);font-size:18px">今日打卡</div>
          <div style="font-size:12px;color:var(--ink-soft);margin-top:4px">记录你今天为减肥做的"努力"</div>
        </div>
        <div class="opt-grid">
          <div class="opt" onclick="Park.dietCheckin('今天跑了十公里')">🏃 跑了10公里</div>
          <div class="opt" onclick="Park.dietCheckin('今天没吃饭')">🚫 今天没吃饭</div>
          <div class="opt" onclick="Park.dietCheckin('今天只吃了一顿')">🍽️ 只吃一顿</div>
          <div class="opt" onclick="Park.dietCheckin('今天做了100个俯卧撑')">💪 100俯卧撑</div>
          <div class="opt" onclick="Park.dietCheckin('今天喝8杯水')">💧 喝8杯水</div>
          <div class="opt" onclick="Park.dietCheckin('今天睡了一整天')">😴 睡一整天</div>
        </div>
        <div class="section-title">📋 今日打卡墙</div>
        <div id="diet-wall">
          <div class="card" style="margin-bottom:8px;padding:10px">
            <div style="font-size:11px;color:var(--ink-soft)">火锅侠0923 · 10分钟前</div>
            <div style="font-size:13px;margin-top:2px">今天跑了十公里（其实只跑了两公里就回家了）</div>
          </div>
          <div class="card" style="margin-bottom:8px;padding:10px">
            <div style="font-size:11px;color:var(--ink-soft)">辣妹666 · 1小时前</div>
            <div style="font-size:13px;margin-top:2px">今天没吃饭（指没吃正餐，零食不算）</div>
          </div>
        </div>
        <div style="height:16px"></div>
      </div>
    `;
  },
  dietInit() {},
  dietCheckin(text) {
    const wall = document.getElementById('diet-wall');
    wall.insertAdjacentHTML('afterbegin', `
      <div class="card" style="margin-bottom:8px;padding:10px;background:var(--mustard)">
        <div style="font-size:11px;color:var(--ink-soft)">${U.esc(DATA.me.name)} · 刚刚</div>
        <div style="font-size:13px;margin-top:2px">${U.esc(text)}</div>
      </div>
    `);
    U.addCoin(3);
    U.toast('打卡成功！+3无聊币');
  },

  // ===== 云撸猫：点击换表情 + 说话 =====
  cat() {
    return `
      <div class="section cat-stage" id="cat-stage">
        <div class="section-title" style="justify-content:center">🐱 云撸猫 · 点它</div>
        <div class="cat-area" id="cat-area">
          <div class="cat-emoji" id="cat-emoji" onclick="Park.changeCatEmotion()">🐱</div>
          <div class="cat-mood" id="cat-mood">心情：等你来撸</div>
        </div>
        <div class="cat-dialog" id="cat-dialog">
          <div class="cat-bubble" id="cat-bubble">喵~ 点我试试</div>
        </div>
        <div style="font-size:12px;color:var(--ink-soft);margin-top:10px;text-align:center">每次点击都会换个表情，听听它说什么～</div>
        <div style="height:16px"></div>
      </div>
    `;
  },
  catInit() {
    Park._catMood = 50;
    Park._catPetCount = 0;
  },
  changeCatEmotion() {
    const emoji = document.getElementById('cat-emoji');
    const bubble = document.getElementById('cat-bubble');
    const moodEl = document.getElementById('cat-mood');
    const pairs = [
      { emoji: '😺', text: '主人你真棒~' },
      { emoji: '😸', text: '谢谢主人摸我下巴~' },
      { emoji: '😹', text: '喵~要抱抱~' },
      { emoji: '😻', text: '主人今天也要开心呀~' },
      { emoji: '😼', text: '本喵允许你再多点两下~' },
    ];
    const pair = U.pick(pairs);
    emoji.textContent = pair.emoji;
    bubble.textContent = pair.text;
    emoji.style.animation = 'none'; void emoji.offsetWidth;
    emoji.style.animation = 'pop .3s';
    Park._catPetCount++;
    Park._catMood = Math.min(100, Park._catMood + 5);
    moodEl.textContent = `心情：${'★'.repeat(Math.floor(Park._catMood/10))}${'☆'.repeat(10-Math.floor(Park._catMood/10))} (${Park._catMood})`;
    // 心心特效
    const stage = document.getElementById('cat-stage');
    const area = document.getElementById('cat-area');
    const r = area.getBoundingClientRect();
    const sr = stage.getBoundingClientRect();
    const heart = document.createElement('div');
    heart.textContent = U.pick(['💕','❤️','💛','✨']);
    heart.style.cssText = `position:absolute;left:${r.left - sr.left + r.width/2}px;top:${r.top - sr.top + r.height/2}px;font-size:20px;pointer-events:none;z-index:10`;
    stage.appendChild(heart);
    heart.animate([
      { transform: 'translate(0,0) scale(0)', opacity: 1 },
      { transform: 'translate(0,-50px) scale(1.5)', opacity: 0 }
    ], { duration: 800 }).onfinish = () => heart.remove();

    if (Park._catMood >= 100) {
      setTimeout(() => {
        bubble.textContent = '喵呜~ 我爱你！💕';
        U.toast('🎉 猫咪心情爆表！+5无聊币');
        U.addCoin(5);
        Park._catMood = 50;
        moodEl.textContent = `心情：${'★'.repeat(5)}${'☆'.repeat(5)} (50)`;
      }, 600);
    }
  },

  // ===== 无聊富豪：大哥大姐 / 小弟小妹 互动 =====
  rich() {
    return Park._richRender();
  },
  richInit() {
    if (Park._richRole === undefined) {
      Park._richRole = null;
      Park._richMsgs = [];
    }
  },
  _richRender() {
    if (!Park._richRole) {
      return `
        <div class="section">
          <div class="section-title">💎 无聊富豪</div>
          <p style="font-size:13px;color:var(--ink-soft);margin-bottom:14px">化身大哥大姐带人消费，或化身小弟小妹被带飞</p>
          <div class="role-pick">
            <div class="role-opt" onclick="Park.richPick('boss-m')" style="background:var(--mustard)">
              <div class="r-ico">🤵</div>
              <div class="r-name">当大哥</div>
              <div style="font-size:11px">主动买/被求</div>
            </div>
            <div class="role-opt" onclick="Park.richPick('boss-f')" style="background:var(--orange-soft)">
              <div class="r-ico">👸</div>
              <div class="r-name">当大姐</div>
              <div style="font-size:11px">主动买/被求</div>
            </div>
            <div class="role-opt" onclick="Park.richPick('follower-m')" style="background:var(--sky);color:#fff">
              <div class="r-ico">🧑‍🤝‍🧑</div>
              <div class="r-name">当小弟</div>
              <div style="font-size:11px">向大哥提需求</div>
            </div>
            <div class="role-opt" onclick="Park.richPick('follower-f')" style="background:var(--pink-soft)">
              <div class="r-ico">👯</div>
              <div class="r-name">当小妹</div>
              <div style="font-size:11px">向大姐提需求</div>
            </div>
          </div>
        </div>
      `;
    }
    const isBoss = Park._richRole.startsWith('boss');
    const isMale = Park._richRole.endsWith('-m');
    const bossTitle = isMale ? '大哥' : '大姐';
    const followerTitle = isMale ? '小弟' : '小妹';
    const bossAvatar = isMale ? '🤵' : '👸';
    const meAvatar = isBoss ? bossAvatar : DATA.me.avatar;

    if (isBoss) {
      return `
        <div class="section">
          <div class="section-title">${bossAvatar} ${bossTitle}消费中</div>
          <div class="rich-scene">
            <div class="rich-throne">
              <div class="rich-boss" id="rich-boss-avatar">${meAvatar}</div>
              <div class="rich-crown">👑</div>
              <div class="rich-head-tip" id="rich-head-tip"></div>
              <div class="rich-bubble" id="rich-boss-bubble">今天带你们飞！</div>
            </div>
            <div class="rich-followers">
              <div class="follower">🧑<div class="follower-msg" id="fw-1">${bossTitle}威武！</div></div>
              <div class="follower">👩<div class="follower-msg" id="fw-2">带我飞！</div></div>
              <div class="follower">🧑<div class="follower-msg" id="fw-3">666！</div></div>
            </div>
            <div class="money-rain" id="money-rain"></div>
          </div>

          <div class="section-title">🎁 主动消费</div>
          <div class="opt-grid">
            ${DATA.richPresets.boss.map(text => `
              <div class="opt" onclick="Park.richSpend('${U.esc(text)}')">${U.esc(text)}</div>
            `).join('')}
          </div>

          <div class="section-title">💬 ${followerTitle}们的请求</div>
          <div class="opt-grid">
            ${DATA.richPresets.follower.map(p => `
              <div class="opt" onclick="Park.richAnswer('${U.esc(p.role)}','${U.esc(p.text)}','${U.esc(p.reply)}')">
                ${p.role === '小弟' ? '🧑' : '👩'} ${U.esc(p.text)}
              </div>
            `).join('')}
          </div>

          <div style="display:flex;gap:8px;margin-top:14px">
            <input id="rich-input" class="input" placeholder="手动输入想买什么…" style="flex:1"/>
            <button class="btn btn-primary" onclick="Park.richSend()">买</button>
          </div>

          <div class="section-title" style="margin-top:16px">📜 消费历史</div>
          <div id="rich-msgs" style="margin-top:6px">
            ${Park._richMsgs.map(m => `
              <div class="card" style="margin-bottom:8px;padding:10px;background:${m.type==='spend'?'var(--mint)':'var(--sky-soft)'}">
                <div style="font-size:13px">${U.esc(m.text)}</div>
                <div style="font-size:11px;color:var(--ink-soft);margin-top:2px">${U.esc(m.sub)} · ${U.esc(m.time)}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    return `
      <div class="section">
        <div class="section-title">${isMale ? '🧑‍🤝‍🧑' : '👯'} ${followerTitle}跟随中</div>
        <div class="rich-scene">
          <div class="rich-boss" id="rich-boss-avatar">${bossAvatar}</div>
          <div class="rich-head-tip" id="rich-head-tip"></div>
          <div class="rich-followers">
            <div class="follower me">${meAvatar}<div class="follower-msg">${bossTitle}威武！</div></div>
            <div class="follower">🧑<div class="follower-msg">${bossTitle}带飞！</div></div>
            <div class="follower">👩<div class="follower-msg">谢谢红包！</div></div>
          </div>
        </div>

        <div class="section-title">🙋 向${bossTitle}提需求</div>
        <div class="opt-grid">
          ${DATA.richPresets.follower.filter(p => (isMale && p.role === '小弟') || (!isMale && p.role === '小妹')).map(p => `
            <div class="opt" onclick="Park.richAsk('${U.esc(p.text)}')">${U.esc(p.text)}</div>
          `).join('')}
        </div>

        <div style="display:flex;gap:8px;margin-top:14px">
          <input id="rich-input" class="input" placeholder="手动输入需求…" style="flex:1"/>
          <button class="btn btn-primary" onclick="Park.richSend()">求</button>
        </div>

        <div class="section-title" style="margin-top:16px">📜 请求历史</div>
        <div id="rich-msgs" style="margin-top:6px">
          ${Park._richMsgs.map(m => `
            <div class="card" style="margin-bottom:8px;padding:10px;background:${m.type==='ask'?'var(--pink-soft)':'var(--mustard)'}">
              <div style="font-size:13px">${U.esc(m.text)}</div>
              <div style="font-size:11px;color:var(--ink-soft);margin-top:2px">${U.esc(m.sub)} · ${U.esc(m.time)}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },
  richPick(role) {
    Park._richRole = role;
    Park._richMsgs = [];
    App.renderCurrent();
  },
  richSpend(text) {
    const isMale = Park._richRole.endsWith('-m');
    const bossTitle = isMale ? '大哥' : '大姐';
    const followerTitle = isMale ? '小弟' : '小妹';
    Park._richMsgs.unshift({ type: 'spend', text: `${bossTitle}${text}`, sub: `${followerTitle}们齐喊：${bossTitle}威武！`, time: '刚刚' });
    App.renderCurrent();
    setTimeout(() => {
      const bossBubble = document.getElementById('rich-boss-bubble');
      if (bossBubble) {
        bossBubble.textContent = text + '！';
        bossBubble.style.animation = 'none'; void bossBubble.offsetWidth;
        bossBubble.style.animation = 'pop .4s';
      }
      Park._richShowHeadTip(text);
      const fwIdx = U.rand(1, 3);
      const fw = document.getElementById(`fw-${fwIdx}`);
      if (fw) {
        fw.textContent = U.pick([`${bossTitle}威武！`,'带我飞！','666！','老板大气！']);
        fw.classList.add('show');
        setTimeout(() => fw.classList.remove('show'), 2000);
      }
      const rain = document.getElementById('money-rain');
      if (rain) {
        for (let k = 0; k < 12; k++) {
          const bill = document.createElement('div');
          bill.className = 'money-bill';
          bill.textContent = '💸';
          bill.style.left = (Math.random() * 90 + 5) + '%';
          bill.style.animationDelay = (Math.random() * 0.5) + 's';
          rain.appendChild(bill);
          setTimeout(() => bill.remove(), 1200);
        }
      }
      U.toast(`${bossTitle}花钱了！${followerTitle}们欢呼`);
    }, 50);
  },
  richAnswer(role, text, reply) {
    const isMale = Park._richRole.endsWith('-m');
    const bossTitle = isMale ? '大哥' : '大姐';
    Park._richMsgs.unshift({ type: 'answer', text: `${role}：${text}`, sub: `${bossTitle}回应：${reply}`, time: '刚刚' });
    App.renderCurrent();
    setTimeout(() => {
      const bossBubble = document.getElementById('rich-boss-bubble');
      if (bossBubble) {
        bossBubble.textContent = reply;
        bossBubble.style.animation = 'none'; void bossBubble.offsetWidth;
        bossBubble.style.animation = 'pop .4s';
      }
      Park._richShowHeadTip(text);
      const fwIdx = U.rand(1, 3);
      const fw = document.getElementById(`fw-${fwIdx}`);
      if (fw) {
        fw.textContent = U.pick(['谢谢大哥！','谢谢大姐！','666！','老板大气！']);
        fw.classList.add('show');
        setTimeout(() => fw.classList.remove('show'), 2000);
      }
      U.toast(`${bossTitle}答应了！`);
    }, 50);
  },
  richAsk(text) {
    const isMale = Park._richRole.endsWith('-m');
    const bossTitle = isMale ? '大哥' : '大姐';
    const role = isMale ? '小弟' : '小妹';
    Park._richMsgs.unshift({ type: 'ask', text: `${role}：${text}`, sub: `${bossTitle}正在考虑…`, time: '刚刚' });
    App.renderCurrent();
    setTimeout(() => {
      const replies = ['买！','安排！','小问题！','明天就到！','你说了算！'];
      U.toast(`${bossTitle}说：${U.pick(replies)}`);
      Park._richShowHeadTip(text);
    }, 50);
  },
  richSend() {
    const input = document.getElementById('rich-input');
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    const isBoss = Park._richRole.startsWith('boss');
    if (isBoss) Park.richSpend(text);
    else Park.richAsk(text);
  },
  _richShowHeadTip(text) {
    const tip = document.getElementById('rich-head-tip');
    if (!tip) return;
    tip.textContent = text.length > 8 ? text.slice(0, 8) + '…' : text;
    tip.style.animation = 'none'; void tip.offsetWidth;
    tip.style.animation = 'pop .4s';
    tip.classList.add('show');
    setTimeout(() => tip.classList.remove('show'), 2200);
  },

  // ===== 无聊恋爱：女神/舔狗/帅哥/舔狗妹 =====
  love() {
    return Park._loveRender();
  },
  loveInit() {
    // 只在首次进入时初始化；聊天过程中 renderCurrent 会再次调用，不能清空状态
    if (Park._lovePure === undefined) {
      Park._lovePure = null;
      Park._loveMode = null;
      Park._loveChat = [];
    }
  },
  lovePickMode(pure) {
    Park._lovePure = pure;
    Park._loveMode = null;
    Park._loveChat = [];
    App.renderCurrent();
  },
  _loveInfo(mode) {
    const pure = Park._lovePure;
    const map = {
      goddess: { name: '女神', avatar: '👸', partner: '舔狗', partnerAvatar: '🐕', isPopular: true },
      licker: { name: '舔狗', avatar: '🐕', partner: '女神', partnerAvatar: '👸', isPopular: false },
      handsome: { name: '帅哥', avatar: '🤴', partner: '舔狗妹', partnerAvatar: '👧', isPopular: true },
      'licker-girl': { name: '舔狗妹', avatar: '👧', partner: '帅哥', partnerAvatar: '🤴', isPopular: false },
    };
    const info = map[mode];
    info.partnerBubble = pure
      ? (info.isPopular ? '今天也想见到你~' : '我会一直陪着你~')
      : (info.isPopular ? '……有事？' : '嗨～今天想我了吗？');
    return info;
  },
  _loveRender() {
    if (Park._lovePure === null) {
      return `
        <div class="section">
          <div class="section-title">💕 无聊恋爱模拟</div>
          <p style="font-size:13px;color:var(--ink-soft);margin-bottom:14px">先选一种模式，再选角色</p>
          <div class="role-pick">
            <div class="role-opt" onclick="Park.lovePickMode(false)" style="background:var(--pink)">
              <div class="r-ico">💘</div>
              <div class="r-name">恋爱模式</div>
              <div style="font-size:11px">狗血互撩</div>
            </div>
            <div class="role-opt" onclick="Park.lovePickMode(true)" style="background:var(--mint)">
              <div class="r-ico">💚</div>
              <div class="r-name">纯爱模式</div>
              <div style="font-size:11px">甜甜治愈</div>
            </div>
          </div>
        </div>
      `;
    }
    if (!Park._loveMode) {
      const modeName = Park._lovePure ? '无聊纯爱模拟' : '无聊恋爱模拟';
      return `
        <div class="section">
          <div class="section-title">${Park._lovePure ? '💚' : '💕'} ${modeName}</div>
          <p style="font-size:13px;color:var(--ink-soft);margin-bottom:14px">选择你的角色，开始${Park._lovePure ? '纯爱' : '恋爱'}互动</p>
          <div class="role-pick">
            <div class="role-opt" onclick="Park.lovePick('goddess')" style="background:var(--pink)">
              <div class="r-ico">👸</div>
              <div class="r-name">女神</div>
              <div style="font-size:11px">${Park._lovePure ? '温柔被追' : '高冷被追'}</div>
            </div>
            <div class="role-opt" onclick="Park.lovePick('licker')" style="background:var(--red-soft)">
              <div class="r-ico">🐕</div>
              <div class="r-name">舔狗</div>
              <div style="font-size:11px">${Park._lovePure ? '默默守护' : '卑微追女神'}</div>
            </div>
            <div class="role-opt" onclick="Park.lovePick('handsome')" style="background:var(--mint)">
              <div class="r-ico">🤴</div>
              <div class="r-name">帅哥</div>
              <div style="font-size:11px">${Park._lovePure ? '甜宠治愈' : '甜宠被追'}</div>
            </div>
            <div class="role-opt" onclick="Park.lovePick('licker-girl')" style="background:var(--sky-soft)">
              <div class="r-ico">👧</div>
              <div class="r-name">舔狗妹</div>
              <div style="font-size:11px">${Park._lovePure ? '暖心陪伴' : '追帅哥'}</div>
            </div>
          </div>
          <button class="btn btn-block" style="margin-top:14px" onclick="Park.lovePickMode(null)">↩ 重选模式</button>
        </div>
      `;
    }
    const info = Park._loveInfo(Park._loveMode);
    const modeClass = info.isPopular ? 'popular' : 'licker';
    const pureClass = Park._lovePure ? 'pure' : '';
    const presets = Park._lovePure ? DATA.lovePresetsPure : DATA.lovePresets;
    const replies = Park._lovePure ? DATA.loveRepliesPure : DATA.loveReplies;
    return `
      <div class="section">
        <div class="section-title">${Park._lovePure ? '💚' : '💕'} 我是${info.name} · ${Park._lovePure ? '纯爱' : '恋爱'}模式</div>
        <div class="love-scene ${modeClass} ${pureClass}">
          <div class="love-partner" id="love-partner">
            <div class="love-avatar">${info.partnerAvatar}</div>
            <div class="love-name">${info.partner}</div>
            <div class="love-bubble" id="love-partner-bubble">${info.partnerBubble}</div>
          </div>
          <div class="love-me">
            <div class="love-avatar">${DATA.me.avatar}</div>
            <div class="love-name">我</div>
          </div>
          <div class="love-hearts" id="love-hearts"></div>
        </div>

        <div class="section-title">💬 快捷语句</div>
        <div class="opt-grid">
          ${presets[Park._loveMode].map(t => `
            <div class="opt" onclick="Park.loveQuick('${U.esc(t)}')">${U.esc(t)}</div>
          `).join('')}
        </div>

        <div class="dialog-list" id="love-chat">
          ${Park._loveChat.map(d => `
            <div class="dialog-line ${d.type==='npc'?'npc':'user'}">
              <div class="dl-role">${d.avatar} ${U.esc(d.role)}</div>
              <div class="dl-text">${U.esc(d.text)}</div>
            </div>
          `).join('')}
          ${Park._loveChat.length === 0 ? `<div style="text-align:center;color:var(--ink-soft);padding:20px">选一句快捷语，或自己输入～</div>` : ''}
        </div>
        <div class="comment-input">
          <input id="love-input" class="input" placeholder="对${U.esc(info.partner)}说点什么…"/>
          <button class="btn btn-primary" onclick="Park.loveSend()">发送</button>
        </div>
        <div style="display:flex;gap:8px;margin-top:10px">
          <button class="btn btn-block" style="flex:1" onclick="Park.lovePick(null)">↩ 重选角色</button>
          <button class="btn btn-block" style="flex:1" onclick="Park.lovePickMode(null)">↩ 重选模式</button>
        </div>
      </div>
    `;
  },
  lovePick(mode) {
    Park._loveMode = mode;
    Park._loveChat = [];
    App.renderCurrent();
  },
  loveQuick(text) {
    const input = document.getElementById('love-input');
    if (input) input.value = text;
    Park.loveSend();
  },
  loveSend() {
    const input = document.getElementById('love-input');
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    const info = Park._loveInfo(Park._loveMode);
    const replies = Park._lovePure ? DATA.loveRepliesPure : DATA.loveReplies;
    Park._loveChat.push({ role: info.name, type: 'user', text, avatar: DATA.me.avatar });
    const reply = U.pick(info.isPopular ? replies.toPopular : replies.toLicker);
    const partnerBubble = document.getElementById('love-partner-bubble');
    if (partnerBubble) partnerBubble.textContent = '对方正在输入…';
    setTimeout(() => {
      Park._loveChat.push({ role: info.partner, type: 'npc', text: reply, avatar: info.partnerAvatar });
      App.renderCurrent();
      setTimeout(() => {
        const b = document.getElementById('love-partner-bubble');
        if (b) {
          b.textContent = reply;
          b.style.animation = 'none'; void b.offsetWidth;
          b.style.animation = 'pop .4s';
        }
        if (!info.isPopular || Park._lovePure) Park._loveHeart();
      }, 50);
    }, 800);
    App.renderCurrent();
  },
  _loveHeart() {
    const container = document.getElementById('love-hearts');
    if (!container) return;
    for (let k = 0; k < 6; k++) {
      const heart = document.createElement('div');
      heart.className = 'love-heart';
      heart.textContent = U.pick(['💕','❤️','💗','💖']);
      heart.style.left = (Math.random() * 80 + 10) + '%';
      heart.style.animationDelay = (Math.random() * 0.4) + 's';
      container.appendChild(heart);
      setTimeout(() => heart.remove(), 1400);
    }
  },
};

window.Park = Park;
