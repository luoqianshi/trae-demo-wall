/* ============================================
   无聊APP · 无聊广场
   7个子板块 + 5种特色交互
   - 一起去无聊：10个胶囊，每秒随机放大1个，点展开/踢飞
   - 投票：增加评论功能
   - 挑战：发起人按天显示，参与者点开按天显示
   ============================================ */

const Square = {
  // ===== 广场主页 =====
  render() {
    return `
      <div class="board-list">
        <div class="section-title">无聊广场 · 选个地方无聊一下</div>
        ${DATA.squareBoards.map(b => `
          <div class="board-item" onclick="App.goto('square-${b.id}')">
            <div class="board-ico" style="background:${b.color}">${b.icon}</div>
            <div>
              <div class="board-name">${U.esc(b.name)}</div>
              <div class="board-desc">${U.esc(b.desc)}</div>
              <div class="board-interact">交互：${U.esc(b.interact)}</div>
            </div>
            <span class="board-arrow">›</span>
          </div>
        `).join('')}
      </div>
    `;
  },
  init() {},

  // ===== 1. 一起去无聊 - 小方块瀑布流 =====
  together() {
    Square._capBatchData = DATA.capsules;
    return `
      <div class="together-scene">
        <div class="together-host">🫧</div>
        <div class="together-host-bubble">满屏都是无聊的人，点一个看看，不爽就踢飞</div>
      </div>
      <div class="capsule-stage" id="cap-stage">
        ${DATA.capsules.map((c, i) => `
          <div class="capsule ${c.premium?'premium':''}" data-idx="${i}"
              style="background:${c.color}"
              onclick="Square.openCapsule(${i})">
            <button class="cap-kick-btn" onclick="event.stopPropagation();Square.kickOne(${i})">🦶</button>
            <div class="cap-avatar">${c.avatar}</div>
            <div class="cap-title">${U.esc(c.title)}</div>
            <div class="cap-preview">${U.esc(c.preview)}</div>
            <div class="cap-tag">${U.esc(c.tag)}</div>
          </div>
        `).join('')}
      </div>
      <div class="swipe-tip">👆 点胶囊看详情 · 点 🦶 踢飞 · 焦点会自动轮换</div>
      <div style="padding:0 14px 16px;display:flex;gap:8px">
        <button class="btn btn-mustard" style="flex:1" onclick="Square.kickRandom()">🦶 随机踢飞</button>
        <button class="btn btn-red" style="flex:1" onclick="Square.kickCrazy()">💥 疯狂踢飞</button>
      </div>
    `;
  },
  togetherInit() {
    Square._capFocusIdx = 0;
    // 焦点轮换：每秒放大一个
    Square._capFocusTimer = setInterval(() => {
      const stage = document.getElementById('cap-stage');
      if (!stage) { clearInterval(Square._capFocusTimer); return; }
      const caps = stage.querySelectorAll('.capsule:not(.kicked)');
      if (caps.length === 0) {
        // 没了，换一批
        Square._capBatch = (Square._capBatch || 0) + 1;
        App.renderCurrent();
        return;
      }
      caps.forEach(c => c.classList.remove('focused'));
      const next = caps[Square._capFocusIdx % caps.length];
      next.classList.add('focused');
      Square._capFocusIdx = (Square._capFocusIdx + 1) % caps.length;
      setTimeout(() => next.classList.remove('focused'), 1000);
    }, 1000);
  },
  openCapsule(i) {
    const c = Square._capBatchData[i];
    const idx = DATA.capsules.indexOf(c);
    App.navigate('square-post', { idx });
  },
  kickOne(i) {
    const stage = document.getElementById('cap-stage');
    if (!stage) return;
    const cap = stage.querySelector(`.capsule[data-idx="${i}"]`);
    if (!cap || cap.classList.contains('kicked')) return;
    cap.classList.add('kicked');
    U.toast('嗖——飞出去了 🦶');
    setTimeout(() => {
      cap.style.display = 'none';
      Square._checkEmpty();
    }, 800);
  },
  kickRandom() {
    const stage = document.getElementById('cap-stage');
    if (!stage) return;
    const caps = stage.querySelectorAll('.capsule:not(.kicked)');
    if (!caps.length) { U.toast('都被踢飞啦！'); return; }
    const c = U.pick(Array.from(caps));
    c.classList.add('kicked');
    U.toast('嗖——飞出去了 🦶');
    setTimeout(() => {
      c.style.display = 'none';
      Square._checkEmpty();
    }, 800);
  },
  kickCrazy() {
    const stage = document.getElementById('cap-stage');
    if (!stage) return;
    const caps = stage.querySelectorAll('.capsule:not(.kicked)');
    if (!caps.length) { U.toast('都被踢飞啦！'); return; }
    // 疯狂点击 = 疯狂踢飞，连踢3个
    const arr = U.pickN(Array.from(caps), Math.min(3, caps.length));
    arr.forEach((c, i) => {
      setTimeout(() => {
        c.classList.add('kicked');
        setTimeout(() => {
          c.style.display = 'none';
          Square._checkEmpty();
        }, 800);
      }, i * 150);
    });
    U.toast('💥💥💥 疯狂踢飞！');
  },
  _checkEmpty() {
    const stage = document.getElementById('cap-stage');
    if (!stage) return;
    const remaining = stage.querySelectorAll('.capsule:not(.kicked)').length;
    if (remaining === 0) {
      U.toast('✨ 踢没啦！来一批新的');
      setTimeout(() => {
        Square._capBatch = (Square._capBatch || 0) + 1;
        App.renderCurrent();
      }, 600);
    }
  },

  // 帖子详情 - 10人围坐
  postDetail(params) {
    const c = DATA.capsules[params.idx];
    const emos = [['😂','哈哈哈'],['😑','无聊'],['🤔','我选另一个'],['👎','鄙视一下就跑'],['💪','我也要选'],['🎲','随机选一个']];
    const seats = Array.from({length:10}, (_,i) => i < 6 ? {avatar:['🐱','🦁','😇','💃','🐟','🦉'][i], tag:['00后·天秤','90后·天蝎','00后·巨蟹','90后·狮子','80后·双鱼','90后·水瓶'][i]} : null);
    return `
      <div class="post-detail">
        <div class="post-center">
          <div class="post-avatar-big">${c.avatar}</div>
          <h3>${U.esc(c.title)}</h3>
          <p>${U.esc(c.preview)}</p>
          <div style="margin-top:8px"><span class="tag">${U.esc(c.tag)}</span> <span class="tag tag-red">${U.esc(c.poster)}</span></div>
        </div>

        <div class="section-title">情绪按钮</div>
        <div class="emo-bar">
          ${emos.map((e,i) => `<button class="emo-btn" onclick="Square.react(${i})">${e[0]} ${e[1]}</button>`).join('')}
        </div>

        <div class="section-title">10人围坐（谁共鸣谁上座）</div>
        <div class="seats">
          ${seats.map(s => s
            ? `<div class="seat filled"><span>${s.avatar}</span><span class="seat-tag">${s.tag}</span></div>`
            : `<div class="seat"><span style="opacity:.3">💺</span><span class="seat-tag">空座</span></div>`
          ).join('')}
        </div>

        <div class="section-title">情绪墙（实时滚动）</div>
        <div class="emo-wall" id="emo-wall">
          <div class="emo-line">[天使在人间] 😂 笑死</div>
          <div class="emo-line">[火锅侠0923] 💪 我也要选</div>
          <div class="emo-line">[辣妹666] 🤔 我选另一个</div>
        </div>
        <div style="height:16px"></div>
      </div>
    `;
  },
  postDetailInit(params) {
    Square._postIdx = params.idx;
  },
  react(i) {
    const emos = ['😂','😑','🤔','👎','💪','🎲'];
    const wall = document.getElementById('emo-wall');
    const line = document.createElement('div');
    line.className = 'emo-line';
    line.textContent = `[我] ${emos[i]} 刚刚按下了`;
    wall.insertBefore(line, wall.firstChild);
    U.toast(`${emos[i]} 已记录`);
  },

  // ===== 2/3. 戳气泡（树洞 & 吹牛共用） =====
  treehole() {
    return Square._bubbleStage('treehole', DATA.treeholePosts, '🧱', '无聊树洞 · 戳破看看');
  },
  treeholeInit() {
    Square._bubbleInit('treehole', DATA.treeholePosts, '🧱');
  },
  brag() {
    const posts = DATA.bragPosts.map(p => ({ text: p.content, extra: `👍 ${p.likes}` }));
    return Square._bubbleStage('brag', posts, '🐂', '无聊吹牛 · 戳破看看');
  },
  bragInit() {
    const posts = DATA.bragPosts.map(p => ({ text: p.content, extra: `👍 ${p.likes}` }));
    Square._bubbleInit('brag', posts, '🐂');
  },

  _bubbleStage(key, posts, ico, title) {
    return `
      <div class="bubble-fall-stage" id="${key}-bubble-stage">
        <div class="bubble-fall-title">${U.esc(title)}</div>
        <div class="bubble-fall-hint">👆 戳破飘下来的气泡，看帖子</div>
      </div>
    `;
  },
  _bubbleInit(key, posts, ico) {
    Square[`_${key}Posts`] = posts;
    Square[`_${key}Count`] = 0;
    const stage = document.getElementById(`${key}-bubble-stage`);
    if (!stage) return;

    // 持续生成气泡
    Square[`_${key}Spawn`] = setInterval(() => {
      const s = document.getElementById(`${key}-bubble-stage`);
      if (!s) { clearInterval(Square[`_${key}Spawn`]); return; }
      Square._spawnFallBubble(key, posts, ico);
    }, 800);

    // 先生成一批
    for (let i = 0; i < 5; i++) setTimeout(() => Square._spawnFallBubble(key, posts, ico), i * 220);
  },
  _spawnFallBubble(key, posts, ico) {
    const stage = document.getElementById(`${key}-bubble-stage`);
    if (!stage) return;
    // 限制同屏气泡数量，避免 DOM 堆积
    if ((Square[`_${key}Count`] || 0) >= 15) return;
    Square[`_${key}Count`] = (Square[`_${key}Count`] || 0) + 1;

    const post = U.pick(posts);
    const idx = posts.indexOf(post);
    const size = 54 + Math.floor(Math.random() * 26);
    const left = 6 + Math.random() * 74;
    const duration = 4 + Math.random() * 2.5;
    const el = document.createElement('div');
    el.className = 'fall-bubble';
    el.style.cssText = `width:${size}px;height:${size}px;left:${left}%;top:-80px;animation-duration:${duration}s`;
    el.innerHTML = `<span class="fb-ico">${ico}</span>`;
    el.dataset.type = key;
    el.dataset.idx = idx;
    el.onclick = () => Square._popFallBubble(key, el, post);

    // 动画结束自动清理，减少 setTimeout 堆积
    const onEnd = (e) => {
      if (e.animationName === 'fallDown') {
        el.removeEventListener('animationend', onEnd);
        if (el.parentNode) el.remove();
        Square[`_${key}Count`] = Math.max(0, (Square[`_${key}Count`] || 0) - 1);
      }
    };
    el.addEventListener('animationend', onEnd);
    stage.appendChild(el);
  },
  _popFallBubble(key, el, post) {
    if (el.classList.contains('popped')) return;
    el.classList.add('popped');
    Square[`_${key}Count`] = Math.max(0, (Square[`_${key}Count`] || 0) - 1);

    const stage = document.getElementById(`${key}-bubble-stage`);
    if (!stage) return;

    // 用 animationend 清理被戳破的气泡
    const onPopEnd = (e) => {
      if (e.animationName === 'popBubble') {
        el.removeEventListener('animationend', onPopEnd);
        if (el.parentNode) el.remove();
      }
    };
    el.addEventListener('animationend', onPopEnd);

    // 碎屑
    for (let k = 0; k < 6; k++) {
      const frag = document.createElement('div');
      frag.className = 'bubble-frag';
      frag.style.left = (el.offsetLeft + el.offsetWidth / 2) + 'px';
      frag.style.top = (el.offsetTop + el.offsetHeight / 2) + 'px';
      stage.appendChild(frag);
      const ang = Math.random() * Math.PI * 2;
      const dist = 20 + Math.random() * 30;
      frag.animate([
        { transform: 'translate(0,0)', opacity: 1 },
        { transform: `translate(${Math.cos(ang)*dist}px,${Math.sin(ang)*dist}px)`, opacity: 0 }
      ], { duration: 500 }).onfinish = () => frag.remove();
    }
    // 弹窗展示帖子
    const idx = parseInt(el.dataset.idx, 10);
    const text = typeof post === 'string' ? post : post.text;
    const extra = typeof post === 'string' ? '' : (post.extra ? `<div style="margin-top:8px;font-size:12px;color:var(--ink-soft)">${U.esc(post.extra)}</div>` : '');
    const popup = document.createElement('div');
    popup.className = 'fall-bubble-popup';
    popup.id = 'fall-popup-' + key;
    popup.innerHTML = `
      <div style="font-size:28px;margin-bottom:6px">${key==='treehole'?'🧱':'🐂'}</div>
      <div style="font-family:var(--font-display);font-size:17px;line-height:1.5">${U.esc(text)}</div>
      ${extra}
      <button class="btn btn-primary" style="margin-top:14px;width:100%" onclick="App.goto('square-${key}-post',{idx:${idx}})">查看帖子 & 评论</button>
      <button class="btn btn-sky" style="margin-top:8px;width:100%" onclick="this.closest('.fall-bubble-popup').remove()">再戳一个</button>
    `;
    stage.appendChild(popup);
  },

  // 树洞/吹牛帖子详情
  treeholePostDetail(params) {
    const post = DATA.treeholePosts[params.idx];
    if (!post) return Square.treehole();
    return Square._postDetailHtml('treehole', '🧱', post.text, params.idx);
  },
  treeholePostDetailInit(params) { Square._postIdx = params.idx; },
  bragPostDetail(params) {
    const post = DATA.bragPosts[params.idx];
    if (!post) return Square.brag();
    return Square._postDetailHtml('brag', '🐂', post.content, params.idx, `👍 ${post.likes}`);
  },
  bragPostDetailInit(params) { Square._postIdx = params.idx; },
  _postDetailHtml(type, ico, text, idx, extra) {
    const list = type === 'treehole' ? DATA.treeholePosts : DATA.bragPosts;
    const post = list[idx];
    const comments = (post.comments || []).map(cm => `
      <div class="comment-item">
        <small>${U.esc(cm.user)} · ${U.esc(cm.time)}</small>
        <div style="margin-top:2px">${U.esc(cm.text)}</div>
      </div>
    `).join('') || '<div style="font-size:13px;color:var(--ink-soft);padding:10px 0">还没有评论，抢沙发～</div>';
    return `
      <div class="section">
        <div class="result-card" style="margin-top:0">
          <div style="font-size:32px;margin-bottom:6px">${ico}</div>
          <h3 style="font-family:var(--font-display);font-size:18px;line-height:1.5">${U.esc(text)}</h3>
          ${extra ? `<div style="margin-top:8px;font-size:12px;color:var(--ink-soft)">${U.esc(extra)}</div>` : ''}
        </div>
        <div class="section-title">💬 评论</div>
        <div class="comment-list" id="${type}-comment-list">${comments}</div>
        <div class="comment-input">
          <input id="${type}-comment-text" class="input" placeholder="说点什么…"/>
          <button class="btn btn-primary" onclick="Square.postComment('${type}', ${idx})">发送</button>
        </div>
      </div>
    `;
  },
  postComment(type, idx) {
    const input = document.getElementById(`${type}-comment-text`);
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    const list = type === 'treehole' ? DATA.treeholePosts : DATA.bragPosts;
    list[idx].comments = list[idx].comments || [];
    list[idx].comments.unshift({ user: `${DATA.me.decade}·${DATA.me.sign.replace('座','')}`, text, time: '刚刚' });
    App.renderCurrent();
    U.toast('评论已发送 💬');
  },

  // ===== 4. 投票（带评论） =====
  vote() {
    const v = DATA.votes[0];
    return `
      <div class="vote-card">
        <span class="tag tag-mustard">${v.day}</span>
        <div class="vote-q">${U.esc(v.q)}</div>
        <div class="vote-options">
          <button class="vote-opt a" id="vote-a" onclick="Square.doVote('A')">
            <div>${U.esc(v.a)}</div>
            <div class="pct" id="pct-a">—</div>
          </button>
          <button class="vote-opt b" id="vote-b" onclick="Square.doVote('B')">
            <div>${U.esc(v.b)}</div>
            <div class="pct" id="pct-b">—</div>
          </button>
        </div>
        <div class="vote-result" id="vote-result">投完显示你和多少无聊的人一样</div>
      </div>

      <div class="section">
        <div class="section-title">💬 评论（${DATA.voteComments.length}）</div>
        <div class="comment-list" id="vote-comment-list">
          ${DATA.voteComments.map(cm => `
            <div class="comment-item">
              <div style="font-size:13px">${U.esc(cm.text)}</div>
              <small>${U.esc(cm.user)} · ${U.esc(cm.time)} · 选了${cm.side}</small>
            </div>
          `).join('')}
        </div>
        <div class="comment-input">
          <input id="vote-comment-text" class="input" placeholder="说说你的看法…"/>
          <button class="btn btn-primary" onclick="Square.addVoteComment()">发送</button>
        </div>
      </div>

      <div class="section">
        <div class="section-title">往期投票</div>
        ${DATA.votes.slice(1).map(v => `
          <div class="card" style="margin-bottom:10px">
            <span class="tag">${v.day}</span>
            <div style="font-weight:700;margin:6px 0">${U.esc(v.q)}</div>
            <div style="display:flex;gap:8px;font-size:12px">
              <span class="tag tag-sky">${U.esc(v.a)} ${v.va}%</span>
              <span class="tag tag-red">${U.esc(v.b)} ${v.vb}%</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },
  voteInit() {
    Square._voted = false;
    Square._voteData = { ...DATA.votes[0] };
  },
  doVote(opt) {
    if (Square._voted) { U.toast('今天已经投过了！'); return; }
    Square._voted = true;
    Square._myVote = opt;
    const v = Square._voteData;
    if (opt === 'A') v.va++; else v.vb++;
    const total = v.va + v.vb;
    const pa = (v.va / total * 100).toFixed(1);
    const pb = (v.vb / total * 100).toFixed(1);
    document.getElementById('pct-a').textContent = pa + '%';
    document.getElementById('pct-b').textContent = pb + '%';
    document.getElementById('vote-a').classList.toggle('voted', opt === 'A');
    document.getElementById('vote-b').classList.toggle('voted', opt === 'B');
    const myPct = opt === 'A' ? pa : pb;
    document.getElementById('vote-result').innerHTML =
      `😂 和你一样无聊的人占 <b style="color:var(--red);font-size:18px">${myPct}%</b>（共 ${total} 人投票）`;
    U.toast('投票成功！可以下方评论');
  },
  addVoteComment() {
    const input = document.getElementById('vote-comment-text');
    const text = input.value.trim();
    if (!text) return;
    if (!Square._voted) { U.toast('先投票再评论吧~'); return; }
    const cm = { user: `匿名·${DATA.me.decade}·${DATA.me.sign.replace('座','')}`, text, time: '刚刚', side: Square._myVote };
    DATA.voteComments.unshift(cm);
    const list = document.getElementById('vote-comment-list');
    list.insertAdjacentHTML('afterbegin', `
      <div class="comment-item" style="background:var(--mustard)">
        <div style="font-size:13px">${U.esc(text)}</div>
        <small>${U.esc(cm.user)} · 刚刚 · 选了${cm.side}</small>
      </div>
    `);
    input.value = '';
    U.toast('评论已发送');
  },

  // ===== 5. 变废为废 - 切西瓜 =====
  waste() {
    return `
      <div class="slice-stage" id="slice-stage">
        <div class="combo-display" id="combo-display" style="display:none">连击 x0</div>
        <div style="position:absolute;top:14px;left:14px;font-size:13px;font-weight:700;color:var(--ink-soft);background:var(--paper);border:2px solid var(--ink);border-radius:20px;padding:4px 12px">👆 在屏幕上划线切开！</div>
      </div>
    `;
  },
  wasteInit() {
    Square._combo = 0;
    Square._slicePosts = [...DATA.wastePosts];
    Square._activeItems = [];
    const stage = document.getElementById('slice-stage');
    for (let i = 0; i < 3; i++) {
      setTimeout(() => Square._spawnFall(), i * 700);
    }
    Square._sliceTimer = setInterval(() => {
      if (!document.getElementById('slice-stage')) {
        clearInterval(Square._sliceTimer);
        return;
      }
      if (Square._activeItems.length < 4) Square._spawnFall();
    }, 1500);

    let drawing = false;
    let lastX = 0, lastY = 0;
    const rect = () => stage.getBoundingClientRect();
    const start = (x, y) => { drawing = true; lastX = x; lastY = y; };
    const move = (x, y) => {
      if (!drawing) return;
      Square._checkSlice(lastX, lastY, x, y);
      lastX = x; lastY = y;
    };
    const end = () => { drawing = false; };

    stage.addEventListener('mousedown', e => { const r = rect(); start(e.clientX - r.left, e.clientY - r.top); });
    stage.addEventListener('mousemove', e => { const r = rect(); move(e.clientX - r.left, e.clientY - r.top); });
    stage.addEventListener('mouseup', end);
    stage.addEventListener('mouseleave', end);
    stage.addEventListener('touchstart', e => {
      const r = rect();
      start(e.touches[0].clientX - r.left, e.touches[0].clientY - r.top);
    });
    stage.addEventListener('touchmove', e => {
      e.preventDefault();
      const r = rect();
      move(e.touches[0].clientX - r.left, e.touches[0].clientY - r.top);
    }, { passive: false });
    stage.addEventListener('touchend', end);
  },
  _spawnFall() {
    const stage = document.getElementById('slice-stage');
    if (!stage) return;
    const post = U.pick(DATA.wastePosts);
    const el = document.createElement('div');
    el.className = 'fall-item';
    el.textContent = post.icon;
    const startX = U.rand(20, stage.offsetWidth - 60);
    el.style.left = startX + 'px';
    el.style.top = '-50px';
    el._post = post;
    el._x = startX;
    el._y = -50;
    el._vy = 1 + Math.random() * 1.5;
    el._vx = (Math.random() - 0.5) * 0.5;
    stage.appendChild(el);
    Square._activeItems.push(el);

    const fall = () => {
      if (!el.parentNode) return;
      el._y += el._vy;
      el._x += el._vx;
      el.style.top = el._y + 'px';
      el.style.left = el._x + 'px';
      if (el._y > stage.offsetHeight) {
        el.remove();
        Square._activeItems = Square._activeItems.filter(i => i !== el);
        if (Square._combo > 0) {
          Square._combo = 0;
          const cd = document.getElementById('combo-display');
          cd.style.display = 'none';
        }
        return;
      }
      el._raf = requestAnimationFrame(fall);
    };
    fall();
  },
  _checkSlice(x1, y1, x2, y2) {
    Square._activeItems.forEach(el => {
      if (el.classList.contains('sliced')) return;
      const ex = el._x + 20, ey = el._y + 20;
      const dist = Square._pointToLineDist(ex, ey, x1, y1, x2, y2);
      if (dist < 35) {
        Square._sliceItem(el);
      }
    });
  },
  _pointToLineDist(px, py, x1, y1, x2, y2) {
    const A = px - x1, B = py - y1, C = x2 - x1, D = y2 - y1;
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let t = lenSq ? dot / lenSq : -1;
    t = Math.max(0, Math.min(1, t));
    const xx = x1 + t * C, yy = y1 + t * D;
    return Math.hypot(px - xx, py - yy);
  },
  _sliceItem(el) {
    el.classList.add('sliced');
    Square._combo++;
    const cd = document.getElementById('combo-display');
    cd.style.display = 'block';
    cd.textContent = `连击 x${Square._combo}`;
    cd.style.animation = 'none'; void cd.offsetWidth; cd.style.animation = 'pop .3s';
    const stage = document.getElementById('slice-stage');
    const colors = ['#FF5C5C','#FFB627','#5BD8A0','#4D9DE0','#B084CC'];
    for (let i = 0; i < 8; i++) {
      const j = document.createElement('div');
      j.className = 'juice';
      j.style.background = U.pick(colors);
      j.style.left = (el._x + 20) + 'px';
      j.style.top = (el._y + 20) + 'px';
      stage.appendChild(j);
      const ang = Math.random() * Math.PI * 2;
      const dist = 20 + Math.random() * 40;
      j.animate([
        { transform: 'translate(0,0) scale(1)', opacity: 1 },
        { transform: `translate(${Math.cos(ang)*dist}px,${Math.sin(ang)*dist}px) scale(0)`, opacity: 0 }
      ], { duration: 500 }).onfinish = () => j.remove();
    }
    const post = el._post;
    const content = document.createElement('div');
    content.className = 'slice-content';
    content.innerHTML = `<div style="font-family:var(--font-display);font-size:16px">${post.icon} ${U.esc(post.title)}</div><div style="font-size:13px;margin-top:6px;line-height:1.5">${U.esc(post.text)}</div>`;
    stage.appendChild(content);
    setTimeout(() => content.remove(), 2500);

    Square._activeItems = Square._activeItems.filter(i => i !== el);
    setTimeout(() => el.remove(), 500);
    setTimeout(() => Square._spawnFall(), 300);
  },

  // ===== 6. 夸夸墙 - 戳气泡 =====
  praise() {
    const mineCount = DATA.praises.filter(p => p.mine).length;
    return `
      <div class="bubble-stage" id="bubble-stage">
        <div style="position:absolute;top:10px;left:50%;transform:translateX(-50%);font-size:13px;font-weight:700;color:var(--ink-soft);background:var(--paper);border:2px solid var(--ink);border-radius:20px;padding:4px 14px;z-index:5">👆 戳破气泡看夸夸 · 共${mineCount}条是夸你的</div>
        ${DATA.praises.map((p, i) => {
          const x = 5 + (i * 23) % 75;
          const y = 12 + (i * 37) % 70;
          const delay = (i * 0.4) % 3;
          return `<div class="bubble ${p.mine?'mine':''}" data-idx="${i}"
              style="left:${x}%;top:${y}%;animation-delay:${delay}s"
              onclick="Square.popBubble(${i}, this)">💭</div>`;
        }).join('')}
      </div>
    `;
  },
  praiseInit() {},
  popBubble(i, el) {
    if (el.classList.contains('popped')) return;
    el.classList.add('popped');
    const p = DATA.praises[i];
    const stage = document.getElementById('bubble-stage');
    for (let k = 0; k < 6; k++) {
      const frag = document.createElement('div');
      frag.style.cssText = `position:absolute;width:6px;height:6px;border-radius:50%;background:${p.mine?'#FF8FB1':'#B084CC'};left:${el.offsetLeft+30}px;top:${el.offsetTop+30}px;pointer-events:none;z-index:6`;
      stage.appendChild(frag);
      const ang = Math.random() * Math.PI * 2;
      const dist = 20 + Math.random() * 30;
      frag.animate([
        { transform: 'translate(0,0)', opacity: 1 },
        { transform: `translate(${Math.cos(ang)*dist}px,${Math.sin(ang)*dist}px)`, opacity: 0 }
      ], { duration: 500 }).onfinish = () => frag.remove();
    }
    const old = stage.querySelector('.praise-popup');
    if (old) old.remove();
    const popup = document.createElement('div');
    popup.className = `praise-popup ${p.mine?'mine-praise':''}`;
    popup.innerHTML = `
      <div style="font-size:24px">${p.mine?'✨':'💌'}</div>
      <div style="font-family:var(--font-display);font-size:17px;margin:4px 0">${U.esc(p.content)}</div>
      <div style="font-size:11px;opacity:.8">—— 匿名夸夸</div>
      ${p.mine ? '<div style="font-size:13px;font-weight:700;color:var(--red);margin-top:6px">⭐ 这是夸你的！</div>' : ''}
    `;
    stage.appendChild(popup);
    setTimeout(() => { if (popup.parentNode) popup.remove(); }, 3500);
    U.toast(p.mine ? '⭐ 这是夸你的！' : '啵~');
    setTimeout(() => el.remove(), 400);
  },

  // ===== 7. 无聊挑战（带按天显示） =====
  challenge() {
    return `
      <div class="section">
        <div class="section-title">🔥 进行中的挑战</div>
        ${DATA.challenges.map((c, i) => `
          <div class="challenge-card" onclick="App.goto('square-challenge-detail', {idx:${i}})">
            <div class="ch-title">📌 ${U.esc(c.title)}</div>
            <div style="font-size:12px;color:var(--ink-soft);margin-top:2px">发起人：${U.esc(c.founder)}</div>
            <div class="ch-progress">
              <div class="ch-progress-text"><span>进度</span><span>第${c.current}/${c.total}天</span></div>
              <div class="bar"><div class="bar-fill" style="width:${c.current/c.total*100}%"></div></div>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span class="tag">${c.participants.length}人参与</span>
              <span class="tag ${c.joined?'tag-mint':'tag-red'}">${c.joined?'已加入':'未加入'}</span>
            </div>
          </div>
        `).join('')}
        <button class="btn btn-mustard btn-block btn-lg" onclick="U.toast('创建功能开发中…')">+ 发起我的挑战</button>
      </div>
    `;
  },
  challengeInit() {},

  // 挑战详情 - 发起人在最上，参与者按天展开
  challengeDetail(params) {
    const c = DATA.challenges[params.idx];
    Square._challengeIdx = params.idx;
    return `
      <div class="section">
        <!-- 发起人进度卡 -->
        <div class="challenge-card">
          <div class="ch-title">📌 ${U.esc(c.title)}</div>
          <div style="font-size:12px;color:var(--ink-soft)">发起人：${U.esc(c.founder)} · 共${c.total}天</div>
          <div class="ch-progress">
            <div class="ch-progress-text"><span>发起人进度</span><span>第${c.current}/${c.total}天</span></div>
            <div class="bar"><div class="bar-fill" style="width:${c.current/c.total*100}%"></div></div>
          </div>
          <button class="btn btn-mint btn-block" onclick="Square.expandFounder(${params.idx})">📅 查看发起人每日打卡</button>
          <div id="founder-days" style="display:none;margin-top:12px"></div>
        </div>

        ${c.joined
          ? `<button class="btn btn-primary btn-block btn-lg" style="margin-top:12px" onclick="Square.checkIn(${params.idx})">✅ 增加第${c.myDay+1}天（照片+描述）</button>`
          : `<button class="btn btn-primary btn-block btn-lg" style="margin-top:12px" onclick="Square.joinChallenge(${params.idx})">💪 加入挑战</button>`
        }

        <!-- 10个参与者卡 -->
        <div class="section-title">👥 参与者（点开看每日打卡）</div>
        <div class="participants-grid" id="parti-grid">
          ${c.participants.map((p, i) => `
            <div class="parti-block ${p.me?'me':''}" onclick="Square.expandParticipant(${i})">
              <div class="p-ico">${p.avatar}</div>
              <div style="font-size:11px">${U.esc(p.sign)}</div>
              <div style="font-size:11px">${U.esc(p.decade)}</div>
              <div class="p-day">第${p.day}天</div>
            </div>
          `).join('')}
        </div>
        <div id="parti-days" style="margin-top:12px"></div>

        <div class="section-title">💬 评论区</div>
        <div class="comment-list" id="comment-list">
          ${c.comments.map(cm => `
            <div class="comment-item">
              ${U.esc(cm.text)}
              <br><small>${U.esc(cm.user)} · ${U.esc(cm.time)}</small>
            </div>
          `).join('')}
        </div>
        <div class="comment-input">
          <input id="comment-text" class="input" placeholder="说点什么…"/>
          <button class="btn btn-primary" onclick="Square.addComment(${params.idx})">发送</button>
        </div>
        <button class="btn btn-sky btn-block" style="margin-top:10px" onclick="Square.shareChallenge(${params.idx})">📤 分享：我正在参加挑战</button>
        <div style="height:16px"></div>
      </div>
    `;
  },
  challengeDetailInit(params) {
    Square._challengeIdx = params.idx;
  },
  expandFounder(idx) {
    const c = DATA.challenges[idx];
    const el = document.getElementById('founder-days');
    if (el.style.display === 'none') {
      el.style.display = 'block';
      el.innerHTML = `
        <div class="section-title">发起人每日打卡</div>
        ${c.founderDays.map(d => `
          <div class="day-strip">
            <div class="day-cell">
              <div style="font-size:24px">${d.photo}</div>
              <div style="font-size:11px;color:var(--ink-soft)">第${d.day}天</div>
            </div>
            <div style="flex:1;font-size:13px;line-height:1.5">${U.esc(d.desc)}</div>
          </div>
        `).join('')}
      `;
    } else {
      el.style.display = 'none';
    }
  },
  expandParticipant(i) {
    const c = DATA.challenges[Square._challengeIdx];
    const p = c.participants[i];
    const el = document.getElementById('parti-days');
    el.innerHTML = `
      <div class="card" style="background:var(--paper);border:3px solid var(--ink)">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
          <span style="font-size:32px">${p.avatar}</span>
          <div>
            <div style="font-family:var(--font-display);font-size:18px">${U.esc(p.name)}${p.me?' (我)':''}</div>
            <div style="font-size:12px;color:var(--ink-soft)">${U.esc(p.decade)} · ${U.esc(p.sign)}座 · 第${p.day}天</div>
          </div>
          <button class="btn" style="margin-left:auto;padding:4px 10px" onclick="document.getElementById('parti-days').innerHTML=''">✕</button>
        </div>
        ${p.days && p.days.length ? p.days.map(d => `
          <div class="day-strip">
            <div class="day-cell">
              <div style="font-size:24px">${d.photo}</div>
              <div style="font-size:11px;color:var(--ink-soft)">第${d.day}天</div>
            </div>
            <div style="flex:1;font-size:13px;line-height:1.5">${U.esc(d.desc)}</div>
          </div>
        `).join('') : '<div style="text-align:center;color:var(--ink-soft);padding:12px">还没开始打卡</div>'}
        ${p.me ? `<button class="btn btn-mint btn-block" style="margin-top:10px" onclick="Square.editMyDay(${Square._challengeIdx})">✏️ 编辑我的打卡</button>` : ''}
      </div>
    `;
    el.scrollIntoView({behavior:'smooth', block:'nearest'});
  },
  editMyDay(idx) {
    const c = DATA.challenges[idx];
    const me = c.participants.find(p => p.me);
    if (!me) return;
    U.modal(`
      <h3 style="font-family:var(--font-display);font-size:18px;margin-bottom:10px">编辑第${c.myDay}天打卡</h3>
      <label style="font-size:12px;font-weight:700">照片/表情</label>
      <input id="ed-day-photo" class="input" value="${me.days[c.myDay-1]?.photo || '🧦'}" style="margin:6px 0 12px"/>
      <label style="font-size:12px;font-weight:700">描述</label>
      <textarea id="ed-day-desc" class="input" rows="3" style="margin:6px 0 12px">${me.days[c.myDay-1]?.desc || ''}</textarea>
      <button class="btn btn-primary btn-block btn-lg" onclick="Square.saveMyDay(${idx})">保存</button>
    `);
  },
  saveMyDay(idx) {
    const c = DATA.challenges[idx];
    const me = c.participants.find(p => p.me);
    if (!me) return;
    if (!me.days) me.days = [];
    const photo = document.getElementById('ed-day-photo').value.trim() || '🧦';
    const desc = document.getElementById('ed-day-desc').value.trim() || `第${c.myDay}天打卡`;
    me.days[c.myDay - 1] = { day: c.myDay, photo, desc };
    U.closeModal();
    App.renderCurrent();
    U.toast('打卡已保存');
  },
  joinChallenge(idx) {
    const c = DATA.challenges[idx];
    c.joined = true;
    c.myDay = 0;
    c.participants.push({ name: DATA.me.name, sign: DATA.me.sign.replace('座',''), decade: DATA.me.decade, day: 0, me: true, avatar: DATA.me.avatar, days: [] });
    App.renderCurrent();
    U.toast('加入成功！明天开始打卡 💪');
  },
  checkIn(idx) {
    const c = DATA.challenges[idx];
    if (c.myDay >= c.total) { U.toast('已挑战完成！🎉'); return; }
    c.myDay++;
    c.current = Math.max(c.current, c.myDay);
    const me = c.participants.find(p => p.me);
    if (me) {
      me.day = c.myDay;
      if (!me.days) me.days = [];
      me.days.push({ day: c.myDay, photo: '🧦', desc: `第${c.myDay}天打卡` });
    }
    App.renderCurrent();
    U.addCoin(5);
    U.toast(`第${c.myDay}天打卡成功！+5无聊币，记得编辑详细内容`);
  },
  shareChallenge(idx) {
    const c = DATA.challenges[idx];
    const me = c.participants.find(p => p.me);
    const pos = me ? `第${me.day}天` : '围观中';
    U.toast(`📤 已分享：我正在参加"${c.title}"，当前${pos}`);
  },
  addComment(idx) {
    const input = document.getElementById('comment-text');
    const text = input.value.trim();
    if (!text) return;
    DATA.challenges[idx].comments.unshift({ user: `匿名·${DATA.me.decade}·${DATA.me.sign.replace('座','')}`, text, time: '刚刚' });
    App.renderCurrent();
    U.toast('评论已发送');
  },
};

window.Square = Square;
