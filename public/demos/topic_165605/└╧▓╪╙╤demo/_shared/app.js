/* 老藏友 demo · v0.6
   复刻 5 张设计稿 · 期刊头 / 圆形水墨 / 卡片大图 / 印章生肖 / 我的锁定
*/
(function () {
  'use strict';

  // ============== 商品数据（贴合设计稿） ==============
  // 编号 = 材质代码 + 周期号：LX=小叶紫檀 / HH=海南黄花梨 / LS=老山檀 / CX=沉香
  const IMG = (name) => '_shared/images/' + name;
  const PRODUCTS = [
    {
      id: 'p01',
      matCode: 'LX',
      no: 'No. 01',
      sn: 'LX-2026-0712',
      name: '小叶紫檀 · 满星 20mm',
      en: 'Pterocarpus santalinus · Sinking Grade · 20mm',
      price: 3680,
      origPrice: 4680,
      savePrice: 1000,
      category: 'p01',
      theme: 'red',                        // red / gold / beige / dark
      tags: ['限 时 抢', '老 料 · 满 星'],
      isRush: true,
      isUpcoming: false,
      isSold: false,
      initialLocks: 7,
      recentLocks: 3,
      imgCard: IMG('p01-card.webp'),
      imgDetailHero: IMG('p01-detail-hero.webp'),
      imgDetail1: IMG('p01-detail-1.webp'),
      imgDetailArchive: IMG('p01-detail-archive.webp'),
      imgDetailWhy: IMG('p01-detail-why.webp'),
      imgDetailPackage: IMG('p01-detail-package.webp'),
      imgShare: IMG('p01-share.webp'),
      teacher: '这串是 2019 年存料里挑出来的，盘出来会非常油润，适合长期持有。',
      attrs: [
        ['材 质', '小叶紫檀 · 印度老料'],
        ['规 格', '20mm × 12 颗'],
        ['密 度', '沉水级 · ≥ 1.26 g/cm³'],
        ['纹 理', '满 星 · 油 密 十 足'],
        ['存 货', '1 件 · 一 物 一 拍'],
        ['老 师 附 言', '从 2019 老 料 中 挑 出']
      ]
    },
    {
      id: 'p02',
      matCode: 'HH',
      no: 'No. 02',
      sn: 'HH-2026-0705',
      name: '海南黄花梨 · 鬼眼 18mm',
      en: 'Dalbergia odorifera · Ghost-eye · 18mm',
      price: 8200,
      origPrice: 9600,
      savePrice: 1400,
      category: 'p02',
      theme: 'gold',
      tags: ['限 时 抢', '海 黄 · 鬼 眼'],
      isRush: true,
      isUpcoming: false,
      isSold: false,
      initialLocks: 3,
      recentLocks: 1,
      imgCard: IMG('p02-share.webp'),
      imgShare: IMG('p02-share.webp'),
      teacher: '海黄老料越来越少，这串的鬼眼是整根料里挑出来的精华段。',
      attrs: [
        ['材 质', '海南黄花梨 · 油梨老料'],
        ['规 格', '18mm × 13 颗'],
        ['密 度', '沉 水 级'],
        ['纹 理', '鬼 眼 · 飘 逸'],
        ['存 货', '1 件 · 一 物 一 拍'],
        ['老 师 附 言', '整 根 料 精 华 段']
      ]
    },
    {
      id: 'p03',
      matCode: 'LS',
      no: 'No. 03',
      sn: 'LS-2026-0628',
      name: '老山檀 · 沉水级 15mm',
      en: 'Santalum album · Sinking Grade · 15mm',
      price: 1580,
      origPrice: 1980,
      savePrice: 400,
      category: 'p03',
      theme: 'beige',
      tags: ['上 架 中', '老 山 · 沉 水'],
      isRush: false,
      isUpcoming: false,
      isSold: false,
      initialLocks: 11,
      recentLocks: 2,
      imgCard: IMG('brand-cover.webp'),
      teacher: '30 年老料，密度极高能沉水，香味是奶香里带一点玫瑰。',
      attrs: [
        ['材 质', '老山檀 · 30 年老料'],
        ['规 格', '15mm × 14 颗'],
        ['密 度', '沉 水 级'],
        ['香 韵', '奶 香 · 微 玫 瑰'],
        ['存 货', '1 件 · 一 物 一 拍'],
        ['老 师 附 言', '30 年 料 · 整 串']
      ]
    },
    {
      id: 'u01',
      matCode: 'CX',
      no: 'No. 04',
      sn: 'CX-2026-0725',
      name: '沉 香 · 达 拉 干 16mm',
      en: 'Aquilaria · Darahan · 16mm',
      price: 4800,
      origPrice: null,
      savePrice: null,
      category: 'u01',
      theme: 'dark',
      tags: ['即 将 上 新', '7.25 · 达 拉 干'],
      isRush: false,
      isUpcoming: true,
      isSold: false,
      initialLocks: 0,
      recentLocks: 0,
      imgCard: IMG('u01-detail-texture.webp'),
      imgDetailTexture: IMG('u01-detail-texture.webp'),
      teacher: '这批达拉干从一位老藏家手里收回来的，机会难得。',
      attrs: [
        ['材 质', '达 拉 干 沉 水 级'],
        ['规 格', '16mm × 13 颗'],
        ['香 韵', '凉 甜 · 花 香'],
        ['上 新 时 间', '7 月 25 日 20:00'],
        ['存 货', '1 件 · 一 物 一 拍'],
        ['老 师 附 言', '老 藏 家 收 回 · 整 串']
      ]
    }
  ];

  // 12 生肖
  const ZODIAC = ['子·鼠', '丑·牛', '寅·虎', '卯·兔', '辰·龙', '巳·蛇', '午·马', '未·羊', '申·猴', '酉·鸡', '戌·狗', '亥·猪'];

  // 客户姓氏
  const USER_AVATARS = ['陈', '林', '王', '赵', '周', '吴', '徐', '孙', '马', '朱'];

  // ============== 示例锁数据 ==============
  const STORAGE_KEY = 'lao-cangyou-locks-v1';
  const SEED_FLAG = 'lao-cangyou-locks-v1-seeded';
  const FALLBACK_SEED = [
    // 待沟通 2 件
    { id: 'demo-1', pid: 'p01', sn: 'LX-2026-0712', name: '小叶紫檀 · 满星 20mm', price: 3680, lockedAt: Date.now() - 28 * 60 * 1000, expiresAt: Date.now() + 2 * 60 * 1000, status: 'pending', teacherWait: true,  hasMacro: false },
    { id: 'demo-2', pid: 'p02', sn: 'HH-2026-0705', name: '海南黄花梨 · 鬼眼 18mm', price: 8200, lockedAt: Date.now() - 23 * 60 * 60 * 1000, expiresAt: Date.now() - 22 * 60 * 60 * 1000, status: 'pending', teacherWait: false, hasMacro: true  },
    // 已成交 10 件（演示用 3 条）
    { id: 'demo-3', pid: 'p03', sn: 'LS-2026-0620', name: '老山檀 · 老料 15mm', price: 2980, lockedAt: Date.now() - 12 * 24 * 60 * 60 * 1000, expiresAt: Date.now() - 11 * 24 * 60 * 60 * 1000, status: 'done', teacherWait: false, hasMacro: true },
    { id: 'demo-4', pid: 'p01', sn: 'LX-2026-0610', name: '小叶紫檀 · 0.8 满星 18mm', price: 2280, lockedAt: Date.now() - 22 * 24 * 60 * 60 * 1000, expiresAt: Date.now() - 21 * 24 * 60 * 60 * 1000, status: 'done', teacherWait: false, hasMacro: true },
    { id: 'demo-5', pid: 'p02', sn: 'HH-2026-0601', name: '海南黄花梨 · 紫油梨 16mm', price: 5800, lockedAt: Date.now() - 32 * 24 * 60 * 60 * 1000, expiresAt: Date.now() - 31 * 24 * 60 * 60 * 1000, status: 'done', teacherWait: false, hasMacro: true }
  ];

  // ============== 状态 ==============
  let state = {
    screen: 'home',
    activePid: null,
    transitPid: null,
    transitLockId: null,
    activeMine: 'pending',          // pending / done
    locks: []
  };
  let timerHandles = [];
  const HOME_START_TS = Date.now();

  // 晒单 demo 数据
  const SHARED_POSTS = [
    {
      id: 's01',
      user: '陈 师 傅', avatar: '陈',
      product: '小叶紫檀 · 满星 20mm', sn: 'LX-2026-0610', cat: 'p01',
      bought: '12 天 前',
      patinaDays: 12,
      caption: '收 到 第 一 个 礼 拜 油 性 已 经 上 来 了，老 师 那 时 发 的 微 距 图 和 实 物 一 模 一 样。',
      teacher: '盘 得 很 规 范，第 二 个 月 棕 眼 会 进 一 步 收 敛。',
      likes: 23, comments: 4,
      tag: '12 天 包 浆',
      img: IMG('p01-share.webp')
    },
    {
      id: 's02',
      user: '林 师 奶', avatar: '林',
      product: '海南黄花梨 · 紫油梨 16mm', sn: 'HH-2026-0530', cat: 'p02',
      bought: '32 天 前',
      patinaDays: 32,
      caption: '香 气 开 始 沉 静 了，不 是 刚 开 箱 时 候 的 浮 香。 老 师 说 这 就 是 海 黄 老 料 的 调 性。',
      teacher: '紫 油 梨 老 料 沉 温 ， 30 天 后 鬼 眼 会 慢 慢 透 出 来。',
      likes: 41, comments: 9,
      tag: '32 天 包 浆',
      img: IMG('p02-share.webp')
    },
    {
      id: 's03',
      user: '王 师 兄', avatar: '王',
      product: '老山檀 · 30 年老料 15mm', sn: 'LS-2026-0428', cat: 'p03',
      bought: '58 天 前',
      patinaDays: 58,
      caption: '盘 出 玻 璃 底 了，工 夫 不 负 有 心 人。 老 师 视 频 里 教 的 盘 法 我 录 了 屏，慢 慢 来。',
      teacher: '老 山 檀 出 玻 璃 底 不 难，难 的 是 日 日 不 断。 这 份 耐 心 比 串 贵。',
      likes: 67, comments: 12,
      tag: '58 天 包 浆',
      img: IMG('brand-cover.webp')
    }
  ];

  // ============== 持久化 ==============
  function loadLocks () {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          if (!localStorage.getItem(SEED_FLAG)) {
            localStorage.setItem(SEED_FLAG, '1');
            // 首次进入追加 5 条种子
            const merged = arr.concat(FALLBACK_SEED);
            saveLocks(merged);
            return merged;
          }
          return arr;
        }
      }
    } catch (e) { /* ignore */ }
    saveLocks(FALLBACK_SEED.slice());
    localStorage.setItem(SEED_FLAG, '1');
    return FALLBACK_SEED.slice();
  }
  function saveLocks (arr) {
    state.locks = arr;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)); } catch (e) { /* ignore */ }
  }
  function addLock (lock) {
    const arr = state.locks.slice();
    arr.unshift(lock);
    saveLocks(arr);
  }
  function updateLock (id, patch) {
    const arr = state.locks.map(l => l.id === id ? Object.assign({}, l, patch) : l);
    saveLocks(arr);
  }
  function resetAll () {
    localStorage.removeItem(SEED_FLAG);
    localStorage.removeItem(STORAGE_KEY);
    state.locks = loadLocks();
    toast('已 归 位 · 示 例 数 据', '↺');
  }

  // ============== 工具 ==============
  function fmtCountdown (ms) {
    if (ms <= 0) return { h: '00', m: '00', s: '00', done: true };
    const total = Math.floor(ms / 1000);
    const h = String(Math.floor(total / 3600)).padStart(2, '0');
    const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
    const s = String(total % 60).padStart(2, '0');
    return { h, m, s, done: false };
  }
  function fmtTime (ts) {
    const d = new Date(ts);
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }
  function fmtDate (ts) {
    const d = new Date(ts);
    return (d.getMonth() + 1) + '月' + d.getDate() + '日';
  }
  function fmtRelative (ts) {
    const d = Date.now() - ts;
    const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0);
    if (ts >= dayStart.getTime()) return '今 ' + fmtTime(ts);
    if (ts >= dayStart.getTime() - 86400000) return '昨 ' + fmtTime(ts);
    return fmtDate(ts);
  }
  function nowTime () { return fmtTime(Date.now()); }
  function nowDateLine () {
    const d = new Date();
    const m = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'][d.getMonth()];
    return m + ' ' + String(d.getDate()).padStart(2, '0') + ' · 2026 · 第 27 期';
  }

  // ============== 路由 ==============
  function go (screen, opts) {
    opts = opts || {};
    const screens = ['home', 'detail', 'transit', 'share', 'mine'];
    const prev = state.screen;
    if (prev === screen && !opts.force) return;

    if (opts.pid) state.activePid = opts.pid;
    if (opts.mine) state.activeMine = opts.mine;
    if (opts.transitPid) state.transitPid = opts.transitPid;

    state.screen = screen;

    document.querySelectorAll('.spa-screen').forEach(el => {
      el.classList.remove('on', 'in-left');
    });
    const target = document.querySelector('.spa-screen[data-screen="' + screen + '"]');
    if (!target) return;
    if (screens.indexOf(screen) > screens.indexOf(prev)) {
      target.classList.remove('in-left');
    } else if (screen !== prev) {
      target.classList.add('in-left');
    }
    // 自身时保持 transform:0（既不带 in-left 也不带 on 前的位移）
    requestAnimationFrame(() => requestAnimationFrame(() => target.classList.add('on')));

    if (screen === 'home') renderHome();
    if (screen === 'detail') renderDetail();
    if (screen === 'transit') renderTransit();
    if (screen === 'share') renderShare();
    if (screen === 'mine') renderMine();

    // 顶导
    document.querySelectorAll('.demo-nav button[data-go]').forEach(b => {
      b.classList.toggle('on', b.getAttribute('data-go') === screen);
    });

    const scroll = target.querySelector('.scroll');
    if (scroll) scroll.scrollTop = 0;

    clearTimers();
    if (screen === 'home') startHomeTimers();
    if (screen === 'detail' && state.activePid) startDetailTimer(state.activePid);
    if (screen === 'transit') startTransit();
    if (screen === 'share') startShareTimers();
    if (screen === 'mine') startMineTimers();
  }
  function clearTimers () {
    timerHandles.forEach(t => {
      if (typeof t === 'number') clearInterval(t);
      else if (t && t.stop) t.stop();
    });
    timerHandles.forEach(t => { if (t && t.cleanup) t.cleanup(); });
    timerHandles = [];
  }

  // ============== 渲染：首页（期刊头 + 卡片大图） ==============
  function renderHome () {
    const wrap = document.querySelector('[data-screen="home"]');
    if (!wrap) return;
    const rush = PRODUCTS.filter(p => p.isRush);
    const live = PRODUCTS.filter(p => !p.isRush && !p.isUpcoming);
    const upcoming = PRODUCTS.filter(p => p.isUpcoming);

    // 倒计时基线（演示：从 0 起跳 60:00 倒计时）
    const elapsed = Math.floor((Date.now() - HOME_START_TS) / 1000);
    const rushCd = fmtCountdown(Math.max(0, 60 * 60 * 1000 - elapsed * 1000));

    const rushHtml = rush.map((p, i) => `
      <article class="card-d slide-in" data-pid="${p.id}" style="animation-delay:${0.05 + i * 0.06}s">
        <div class="photo photo-${p.category}">
          <img class="ph-img" src="${p.imgCard}" alt="${p.name}" loading="lazy" decoding="async" />
          <span class="ph-shade"></span>
          <span class="pill-tag urgent"><span class="dot"></span>${p.tags[0]}</span>
          <span class="pill-cat">${p.tags[1]}</span>
          <span class="ink-circle"></span>
          <span class="big-no">No.<em>${p.no.replace('No. ', '').replace('No.', '').padStart(2, '0')}</em></span>
          <span class="ph-spec">${p.category.toUpperCase()} · 一 物 一 拍</span>
        </div>
        <div class="body">
          <h4>${p.name}</h4>
          <p class="en">${p.en}</p>
          <p class="desc">老 料 · 油 性 十 足 · 棕 眼 细 到 几 不 可 见 · 一 物 一 拍。锁定后老师会单独发一组细节微距图。</p>
          <div class="price-card">
            <div class="now"><small>¥</small><strong>${p.price.toLocaleString()}</strong></div>
            <div class="meta">
              ${p.origPrice ? `<span class="orig">¥${p.origPrice.toLocaleString()}</span>` : ''}
              ${p.savePrice ? `<span class="save">立 省 ¥${p.savePrice.toLocaleString()}</span>` : ''}
            </div>
            <div class="time">
              <span class="t-label">距 离 结 束</span>
              <span class="t-num" data-cd="${p.id}"><span>${rushCd.h}</span>:<span>${rushCd.m}</span>:<span>${rushCd.s}</span></span>
            </div>
          </div>
          <div class="lock-stat">
            <span class="avt-row">
              ${USER_AVATARS.slice(0, 4).map(c => `<span>${c}</span>`).join('')}
            </span>
            <span class="lock-text"><strong>${p.initialLocks}</strong> 位 藏 友 已 圈 定 · 圈 内 人 解 锁</span>
          </div>
        </div>
      </article>
    `).join('');

    const liveHtml = live.map((p, i) => `
      <article class="card-d live slide-in" data-pid="${p.id}" style="animation-delay:${0.05 + (rush.length + i) * 0.06}s">
        <div class="photo photo-${p.category}">
          <img class="ph-img" src="${p.imgCard}" alt="${p.name}" loading="lazy" decoding="async" />
          <span class="ph-shade"></span>
          <span class="pill-tag live">${p.tags[0]}</span>
          <span class="pill-cat">${p.tags[1]}</span>
          <span class="ink-circle"></span>
          <span class="big-no">${p.no.replace('No. ', 'No.<em>')}</em></span>
          <span class="ph-spec">${p.category.toUpperCase()} · 一 物 一 拍</span>
        </div>
        <div class="body">
          <h4>${p.name}</h4>
          <p class="en">${p.en}</p>
          <p class="desc">${p.tags[1]} · 老师亲挑的料，可以放心锁。</p>
          <div class="price-card">
            <div class="now"><small>¥</small><strong>${p.price.toLocaleString()}</strong></div>
            <div class="time">
              <span class="t-label">上 架 中</span>
              <span class="t-num t-live">长 期 收 藏</span>
            </div>
          </div>
        </div>
      </article>
    `).join('');

    const upcomingHtml = upcoming.map((p, i) => `
      <article class="card-d upcoming slide-in" data-pid="${p.id}" style="animation-delay:${0.1 + i * 0.05}s">
        <div class="photo photo-${p.category} dim">
          <img class="ph-img" src="${p.imgCard}" alt="${p.name}" loading="lazy" decoding="async" />
          <span class="ph-shade"></span>
          <span class="pill-tag ghost">${p.tags[0]}</span>
          <span class="ink-circle dark"></span>
          <span class="ph-spec">7.25 · 20:00</span>
        </div>
        <div class="body">
          <h4>${p.name}</h4>
          <p class="en">${p.en}</p>
          <p class="desc">${p.teacher}</p>
          <div class="price-card">
            <div class="now"><small>¥</small><strong>${p.price.toLocaleString()}</strong></div>
            <button class="btn-uc">上 新 提 醒</button>
          </div>
        </div>
      </article>
    `).join('');

    wrap.innerHTML = `
      <div class="screen">
        <div class="statusbar"><span>${nowTime()}</span><span>●●●● 5G</span></div>
        <div class="scroll">
          <div class="poem">
            <div class="date">${nowDateLine()}</div>
            <h1>老 <strong>藏</strong> 友</h1>
            <div class="en">Serene Collectors · Bead Journal</div>
            <div class="quote">
              本 周 新 上 <strong>3 件</strong> · 老 师 亲 挑<br/>
              小 叶 紫 檀 / 海 南 黄 花 梨 / 老 山 檀<br/>
              价 格 比 市 面 低 约 <strong>¥1,000</strong>
            </div>
          </div>

          <div class="section-h">
            <span class="bar"></span>
            <h3>本 周 新 上</h3>
            <span class="count">3 件</span>
          </div>

          <div class="cards">${rushHtml}${liveHtml}</div>

          <div class="section-h muted">
            <span class="bar"></span>
            <h3>即 将 上 新</h3>
            <span class="count">1 件</span>
          </div>

          <div class="cards">${upcomingHtml}</div>

          <div class="footer-line">— 第 27 期 · 本 期 截 至 7 月 18 日 24:00 —</div>
          <div style="height:90px"></div>
        </div>
        <div class="tabbar">
          <button data-go="home" class="on">
            <span class="ic-home"></span>
            <span class="lbl">新 品<small>NEW ARRIVALS</small></span>
          </button>
          <button data-go="share">
            <span class="ic-share"></span>
            <span class="lbl">晒 单<small>SHARED</small></span>
          </button>
          <button data-go="mine">
            <span class="ic-mine"></span>
            <span class="lbl">我 的<small>MY LOCKS</small></span>
          </button>
        </div>
      </div>
    `;
    bindHomeEvents();
  }
  function bindHomeEvents () {
    document.querySelectorAll('[data-screen="home"] .card-d').forEach(c => {
      c.addEventListener('click', () => go('detail', { pid: c.dataset.pid }));
    });
    document.querySelectorAll('[data-screen="home"] .tabbar button[data-go]').forEach(b => {
      b.addEventListener('click', () => go(b.dataset.go));
    });
    document.querySelectorAll('[data-screen="home"] .btn-uc').forEach(b => {
      b.addEventListener('click', e => {
        e.stopPropagation();
        toast('已 预 约 · 7.25 20:00 提 醒 您', '✓');
      });
    });
  }
  function startHomeTimers () {
    const t = setInterval(() => {
      const elapsed = Math.floor((Date.now() - HOME_START_TS) / 1000);
      const remain = Math.max(0, 60 * 60 - elapsed);
      const cd = fmtCountdown(remain * 1000);
      PRODUCTS.forEach(p => {
        if (!p.isRush) return;
        const node = document.querySelector('[data-cd="' + p.id + '"]');
        if (node) node.innerHTML = `<span>${cd.h}</span>:<span>${cd.m}</span>:<span>${cd.s}</span>`;
      });
    }, 1000);
    timerHandles.push(t);
  }

  // ============== 渲染：详情 ==============
  function renderDetail () {
    const wrap = document.querySelector('[data-screen="detail"]');
    if (!wrap) return;
    const p = PRODUCTS.find(x => x.id === state.activePid);
    if (!p) { go('home', { force: true }); return; }

    const userPending = state.locks.find(l => l.pid === p.id && l.status === 'pending');
    const userDone = state.locks.find(l => l.pid === p.id && l.status === 'done');
    const totalLocks = p.initialLocks + (userPending || userDone ? 1 : 0);
    const elapsed = Math.floor((Date.now() - HOME_START_TS) / 1000);
    const cd = fmtCountdown(Math.max(0, 60 * 60 * 1000 - elapsed * 1000));

    wrap.innerHTML = `
      <div class="screen">
        <div class="statusbar"><span>${nowTime()}</span><span>●●●● 5G</span></div>
        <div class="scroll">
          <div class="detail-nav">
            <button class="back" data-go="home" aria-label="返回">‹</button>
            <span class="crumbs">本 期 · ${p.no} · ${p.sn}</span>
            <button class="share" aria-label="分享">↗</button>
          </div>

          <div class="detail-hero photo-${p.category}">
            <img class="detail-hero-img" src="${p.imgDetailHero || p.imgCard}" alt="${p.name}" decoding="async" />
            <div class="ph-shade"></div>
            <div class="dots"><i class="on"></i><i></i><i></i><i></i><i></i></div>
          </div>

          <div class="detail-meta">
            <h1>${p.name}</h1>
            <div class="en">${p.en} · No. ${p.sn}</div>
            <p class="desc">${p.tags[1]} · 老料 · 油密十足 · 棕眼细到几不可见 · 一物一拍。锁定后老师会单独发一组细节微距图。</p>
            <div class="price-card big">
              <div class="now"><small>¥</small><strong>${p.price.toLocaleString()}</strong></div>
              <div class="meta">
                ${p.origPrice ? `<span class="orig">¥${p.origPrice.toLocaleString()}</span>` : ''}
                ${p.savePrice ? `<span class="save">立 省 ¥${p.savePrice.toLocaleString()}</span>` : ''}
              </div>
            </div>
            <div class="time-card">
              <span class="t-label">距 离 结 束</span>
              <span class="t-num" data-cd="${p.id}"><span>${cd.h}</span>:<span>${cd.m}</span>:<span>${cd.s}</span></span>
            </div>
            <div class="social-proof">
              <span class="avatars">
                ${USER_AVATARS.slice(0, 4).map(c => `<span>${c}</span>`).join('')}
                <span class="more">+${Math.max(0, totalLocks - 4)}</span>
              </span>
              <div class="text">
                已 有 <strong>${totalLocks}</strong> 位 圈 内 人 锁 定
                <small>最 近 2 小 时 +${p.recentLocks} 人 · 老 师 已 发 微 距 图</small>
              </div>
            </div>
            <div class="lock-stat">
              <span>本 串 状 态</span>
              <span class="num">${userPending ? '你 已 锁 定' : (userDone ? '你 已 收 藏' : '未 锁 定')}</span>
            </div>
          </div>

          <div class="attr-list">
            <h5>商 品 属 性</h5>
            <table>
              ${p.attrs.map(a => `<tr><td>${a[0]}</td><td>${a[1]}</td></tr>`).join('')}
            </table>
          </div>

          <div class="teacher-msg">
            <div class="avt">串</div>
            <div class="body">
              <div class="name">串 老 板 <small>· 老 藏 友 主 理 人</small></div>
              <p>「${p.teacher}」</p>
            </div>
          </div>

          <div class="editorial-block">
            <div class="lbl">关 于 锁 定</div>
            <p>点 击「 我 要 · 锁 定 这 件 」 后 会 跳 到 微 信 ，把 你 和 老 师 私 聊 上 。 老 师 会 发 这 串 的 微 距 细 节 图 + 盘 玩 建 议 ，双 方 确 认 后 再 走 微 信 支 付 。</p>
            <p>我 们 不 托 管 资 金 ， 不 做 平 台 担 保 。 信 任 来 自 老 师 本 人 。</p>
          </div>

          ${p.imgDetailArchive ? `
          <div class="detail-section">
            <div class="lbl">藏 品 档 案</div>
            <img class="section-img" src="${p.imgDetailArchive}" alt="藏品档案" loading="lazy" decoding="async" />
          </div>` : ''}
          ${p.imgDetail1 ? `
          <div class="detail-section">
            <div class="lbl">细 节 鉴 赏</div>
            <img class="section-img" src="${p.imgDetail1}" alt="细节鉴赏" loading="lazy" decoding="async" />
          </div>` : ''}
          ${p.imgDetailWhy ? `
          <div class="detail-section">
            <div class="lbl">为 什 么 值 得 收 藏</div>
            <img class="section-img" src="${p.imgDetailWhy}" alt="值得收藏" loading="lazy" decoding="async" />
          </div>` : ''}
          ${p.imgDetailPackage ? `
          <div class="detail-section">
            <div class="lbl">包 装 与 交 付</div>
            <img class="section-img" src="${p.imgDetailPackage}" alt="包装与交付" loading="lazy" decoding="async" />
          </div>` : ''}
          ${p.imgDetailTexture ? `
          <div class="detail-section">
            <div class="lbl">纹 理 与 包 浆</div>
            <img class="section-img" src="${p.imgDetailTexture}" alt="纹理与包浆" loading="lazy" decoding="async" />
          </div>` : ''}

          <div style="height:90px"></div>
        </div>

        <div class="detail-foot">
          <button class="btn-icon" aria-label="收藏">♡</button>
          <button class="btn-icon" aria-label="分享">↗</button>
          <button class="btn-lock-d ${userPending ? 'locked' : ''}" data-lock="${p.id}">
            ${userPending ? '✓ 已 锁 定 · 待 老 师 接 通' : '我 要 · 锁 定 这 件'}
          </button>
        </div>
      </div>
    `;
    bindDetailEvents(p, userPending);
  }
  function bindDetailEvents (p, userPending) {
    document.querySelectorAll('[data-screen="detail"] .back').forEach(b => {
      b.addEventListener('click', () => go('home'));
    });
    document.querySelectorAll('[data-screen="detail"] .btn-icon').forEach((b, i) => {
      b.addEventListener('click', () => {
        toast(i === 0 ? '已 加 入 收 藏' : '链 接 已 复 制', i === 0 ? '☆' : '↗');
      });
    });
    const lockBtn = document.querySelector('[data-screen="detail"] .btn-lock-d');
    if (lockBtn && !userPending) {
      lockBtn.addEventListener('click', () => {
        lockBtn.classList.add('fired');
        go('transit', { transitPid: p.id });
      });
    }
  }
  function startDetailTimer (pid) {
    const t = setInterval(() => {
      const p = PRODUCTS.find(x => x.id === pid);
      if (!p) return;
      const elapsed = Math.floor((Date.now() - HOME_START_TS) / 1000);
      const remain = Math.max(0, 60 * 60 - elapsed);
      const cd = fmtCountdown(remain * 1000);
      const node = document.querySelector('[data-cd="' + pid + '"]');
      if (node) node.innerHTML = `<span>${cd.h}</span>:<span>${cd.m}</span>:<span>${cd.s}</span>`;
    }, 1000);
    timerHandles.push(t);
  }

  // ============== 渲染：中转（印章 + 十二生肖） ==============
  function renderTransit () {
    const wrap = document.querySelector('[data-screen="transit"]');
    if (!wrap) return;
    const p = PRODUCTS.find(x => x.id === state.transitPid);
    if (!p) { go('home', { force: true }); return; }

    // 写一条新 lock（pending）
    const lockId = 'lock-' + Date.now();
    const lock = {
      id: lockId,
      pid: p.id,
      sn: p.sn,
      name: p.name,
      price: p.price,
      lockedAt: Date.now(),
      expiresAt: Date.now() + 60 * 1000,
      status: 'pending',
      teacherWait: false,
      hasMacro: false
    };
    addLock(lock);
    state.transitLockId = lockId;

    wrap.innerHTML = `
      <div class="screen transit-bg">
        <div class="statusbar light"><span>${nowTime()}</span><span>●●●● 5G</span></div>
        <div class="scroll">
          <div class="transit-head">
            <div class="lbl">— 已 为 您 锁 定 —</div>
            <div class="title">${p.name}</div>
            <div class="en">LOCKED · TRANSIT TO WECHAT</div>
            <div class="sn">编 号 <strong>#${p.sn}</strong></div>
          </div>

          <div class="transit-seal-wrap">
            <div class="zodiac-ring">
              ${ZODIAC.map((z, i) => `<span class="z" style="--i:${i}">${z}</span>`).join('')}
            </div>
            <div class="transit-photo">
              <img class="transit-img" src="${p.imgDetailHero || p.imgCard}" alt="${p.name}" />
              <div class="transit-photo-shade"></div>
              <div class="transit-seal">
                <span class="seal-char">定</span>
              </div>
            </div>
          </div>

          <div class="transit-status">
            <span class="dot"></span>
            <span>老 师 微 信 正 在 为 您 打 开 ， 请 稍 候 …</span>
          </div>

          <div class="transit-toggle">
            <span class="check on"><i></i></span>
            <span class="lbl">携 带 商 品 信 息</span>
            <span class="hint">· 老 师 会 在 对 话 中 看 到 这 件 的 详 情</span>
          </div>

          <div style="height:120px"></div>
        </div>

        <div class="transit-foot">
          <button class="transit-cta" data-go="wechat">打 开 老 师 微 信</button>
          <button class="transit-alt" data-go="mine">查 看 我 的 锁 定 记 录</button>
        </div>
      </div>
    `;
    bindTransitEvents(p, lockId);
  }
  function bindTransitEvents (p, lockId) {
    document.querySelectorAll('[data-screen="transit"] [data-go]').forEach(b => {
      b.addEventListener('click', () => {
        if (b.dataset.go === 'wechat') {
          // 模拟"打开微信"
          updateLock(lockId, { teacherWait: true });
          toast('正 在 唤 起 微 信 · 携 带 商 品 信 息', '↗');
          setTimeout(() => go('mine', { force: true, mine: 'pending' }), 1200);
        } else if (b.dataset.go === 'mine') {
          go('mine', { force: true, mine: 'pending' });
        }
      });
    });
    // toggle 切换
    const toggle = document.querySelector('.transit-toggle .check');
    if (toggle) toggle.addEventListener('click', () => toggle.classList.toggle('on'));
  }
  function startTransit () {
    // 中转页无倒计时（仅 5s 后弱提示，不强制返回）
  }

  // ============== 渲染：我的锁定 ==============
  function renderMine () {
    const wrap = document.querySelector('[data-screen="mine"]');
    if (!wrap) return;
    const pending = state.locks.filter(l => l.status === 'pending');
    const done = state.locks.filter(l => l.status === 'done');

    const pendingHtml = pending.length === 0
      ? `<div class="empty">暂 无 待 沟 通 的 藏 品</div>`
      : pending.map((l, i) => renderMineRow(l, i, 'pending')).join('');
    const doneHtml = done.length === 0
      ? `<div class="empty">还 沒 有 成 交 记 录</div>`
      : done.map((l, i) => renderMineRow(l, i, 'done')).join('');

    const total = state.locks.length;

    wrap.innerHTML = `
      <div class="screen">
        <div class="statusbar"><span>${nowTime()}</span><span>●●●● 5G</span></div>
        <div class="scroll">
          <div class="mine-head">
            <div class="lbl">— COLLECTIONS · MY LOCKS —</div>
            <h1>我 的 锁 定</h1>
            <div class="en">My locks · Curated history</div>
          </div>

          <div class="user-card">
            <div class="avt">陈</div>
            <div class="info">
              <div class="name">陈 师 傅</div>
              <div class="vip"><span class="dia">◆</span>资 深 藏 友 · 红 木 老 客 户</div>
            </div>
            <div class="stat">
              <div class="n">${total}</div>
              <div class="l">累 积</div>
              <div class="n sub">${done.length}</div>
              <div class="l">收 藏</div>
            </div>
          </div>

          <div class="group-head">
            <span class="dot"></span>
            <span class="t">待 沟 通 · <strong>${pending.length}</strong> 件</span>
            <span class="r">老 师 24h 内 必 复</span>
          </div>
          <div class="list-d">${pendingHtml}</div>

          <div class="group-head">
            <span class="dot done"></span>
            <span class="t">已 成 交 · <strong>${done.length}</strong> 件</span>
            <span class="r">包 浆 记 录</span>
          </div>
          <div class="list-d">${doneHtml}</div>

          <div style="height:90px"></div>
        </div>
        <div class="tabbar">
          <button data-go="home">
            <span class="ic-home"></span>
            <span class="lbl">新 品<small>NEW ARRIVALS</small></span>
          </button>
          <button data-go="share">
            <span class="ic-share"></span>
            <span class="lbl">晒 单<small>SHARED</small></span>
          </button>
          <button data-go="mine" class="on">
            <span class="ic-mine"></span>
            <span class="lbl">我 的<small>MY LOCKS</small></span>
          </button>
        </div>
      </div>
    `;
    bindMineEvents();
  }
  function renderMineRow (l, i, group) {
    const p = PRODUCTS.find(x => x.id === l.pid);
    const cat = p ? p.category : 'p01';
    const seq = String(i + 1).padStart(2, '0');
    const sub = p ? p.tags[1] : '';
    const subTag = sub ? (sub.split('·')[1] || sub).trim() : '老 料';
    const isPending = l.status === 'pending';
    const remain = l.expiresAt - Date.now();
    const cd = remain > 0 ? fmtCountdown(remain) : { h: '00', m: '00', s: '00' };
    // 把倒计时拆成 3 个独立 span（避免每秒 textContent 变化导致 reflow）
    const cdHtml = isPending
      ? (remain > 0
        ? `剩 <span class="cd-h" data-cd-h="${l.id}">${cd.h}</span>:<span class="cd-m" data-cd-m="${l.id}">${cd.m}</span>:<span class="cd-s" data-cd-s="${l.id}">${cd.s}</span>`
        : '<span class="cd-exp">已 超 时</span>')
      : fmtRelative(l.lockedAt) + ' 锁 定';
    const stat = isPending
      ? (l.teacherWait ? '等 老 师 发 图' : '待 微 信 沟 通')
      : '交 易 完 成';
    const statCls = isPending ? 's-pending' : 's-done';
    const isDone = l.status === 'done';

    return `
      <div class="row slide-in" data-lock-id="${l.id}" style="animation-delay:${0.05 + i * 0.04}s">
        <div class="thumb photo-${cat}-sm ${isDone ? 'done' : ''}">
          <img class="thumb-img" src="${p ? (p.imgCard) : IMG('brand-cover.webp')}" alt="${l.name}" loading="lazy" decoding="async" />
          <span class="seq">${seq} · ${subTag}</span>
        </div>
        <div class="body">
          <div class="title">${l.name}</div>
          <div class="meta-line">
            <span class="no">${l.sn}</span>
            <span class="dot">·</span>
            <span class="cd" data-meta-id="${l.id}">${cdHtml}</span>
          </div>
          <div class="price"><small>¥</small>${l.price.toLocaleString()}</div>
        </div>
        <div class="status ${statCls}">${stat}</div>
      </div>
    `;
  }
  function bindMineEvents () {
    document.querySelectorAll('[data-screen="mine"] .tabbar button[data-go]').forEach(b => {
      b.addEventListener('click', () => go(b.dataset.go));
    });
    document.querySelectorAll('[data-screen="mine"] .row').forEach(r => {
      r.addEventListener('click', () => {
        const id = r.dataset.lockId;
        const l = state.locks.find(x => x.id === id);
        if (!l) return;
        go('detail', { pid: l.pid, force: true });
      });
    });
  }
  function startMineTimers () {
    // 30 秒一次：业务上倒计时粒度足够（用户不会盯着秒数看）
    // 加上 visibilitychange 暂停：用户切走页面就停掉，回到页面再重启
    const tick = () => {
      document.querySelectorAll('[data-screen="mine"] [data-lock-id]').forEach(row => {
        const id = row.dataset.lockId;
        const l = state.locks.find(x => x.id === id);
        if (!l || l.status !== 'pending') return;
        const remain = l.expiresAt - Date.now();
        if (remain <= 0) { renderMine(); return; }
        const cd = fmtCountdown(remain);
        // 只更新 3 个独立数字 span（contain: paint 隔离影响范围）
        const hEl = row.querySelector('[data-cd-h="' + id + '"]');
        const mEl = row.querySelector('[data-cd-m="' + id + '"]');
        const sEl = row.querySelector('[data-cd-s="' + id + '"]');
        if (hEl && hEl.textContent !== cd.h) hEl.textContent = cd.h;
        if (mEl && mEl.textContent !== cd.m) mEl.textContent = cd.m;
        if (sEl && sEl.textContent !== cd.s) sEl.textContent = cd.s;
      });
    };
    let handle = null;
    const start = () => { if (!handle) handle = setInterval(tick, 30000); };
    const stop = () => { if (handle) { clearInterval(handle); handle = null; } };
    const onVis = () => { document.hidden ? stop() : (tick(), start()); };
    start();
    document.addEventListener('visibilitychange', onVis);
    timerHandles.push(t);
    timerHandles.push({ stop, cleanup: () => document.removeEventListener('visibilitychange', onVis) });
  }

  // ============== 渲染：晒单 ==============
  function renderShare () {
    const wrap = document.querySelector('[data-screen="share"]');
    if (!wrap) return;

    const postHtml = SHARED_POSTS.map((p, i) => `
      <article class="share-card slide-in" style="animation-delay:${0.1 + i * 0.08}s">
        <div class="share-hero photo-${p.cat}">
          <img class="share-img" src="${p.img}" alt="${p.product}" loading="lazy" decoding="async" />
          <div class="ph-shade"></div>
          <span class="share-tag">${p.tag}</span>
        </div>
        <div class="share-body">
          <div class="share-head">
            <div class="avt">${p.avatar}</div>
            <div class="meta">
              <div class="name">${p.user} <span class="vip">◆</span></div>
              <div class="sub">收 入 · ${p.bought} · 盘 ${p.patinaDays} 天</div>
            </div>
            <div class="sn">${p.sn}</div>
          </div>
          <div class="share-product">
            <span class="lbl">关 于 这 件</span>
            <span class="name">${p.product}</span>
          </div>
          <p class="share-caption">「${p.caption}」</p>
          <div class="share-teacher">
            <div class="lbl">老 师 评</div>
            <p>${p.teacher}</p>
          </div>
          <div class="share-foot">
            <button class="like"><i>♡</i>${p.likes} 赞</button>
            <button class="cmt"><i>↺</i>${p.comments} 评 论</button>
            <button class="re-share">↗ 转 给 藏 友</button>
          </div>
        </div>
      </article>
    `).join('');

    wrap.innerHTML = `
      <div class="screen">
        <div class="statusbar"><span>${nowTime()}</span><span>●●●● 5G</span></div>
        <div class="scroll">
          <div class="poem">
            <div class="date">— COLLECTORS · PATINA DIARY —</div>
            <h1>藏 友 <strong>晒</strong> 单</h1>
            <div class="en">Patina · After Lock</div>
            <div class="quote">
              一 件 入 库 ， 一 段 时 间 。<br/>
              ${SHARED_POSTS.length} 位 藏 友 记 录 了 盘 玩 日 志 · 老 师 每 条 都 看
            </div>
          </div>
          <div class="share-tabs">
            <button class="on"><i></i>盘 玩 日 志<small>DIARY</small></button>
            <button><i></i>实 物 鉴 赏<small>PHOTOS</small></button>
            <button><i></i>老 师 答 疑<small>Q&A</small></button>
          </div>
          <div class="share-cards">${postHtml}</div>
          <div class="footer-line">— 老 藏 友 · 圈 内 资 源 · 暂 不 开 放 外 部 —</div>
          <div style="height:90px"></div>
        </div>
        <div class="tabbar">
          <button data-go="home">
            <span class="ic-home"></span>
            <span class="lbl">新 品<small>NEW ARRIVALS</small></span>
          </button>
          <button data-go="share" class="on">
            <span class="ic-share"></span>
            <span class="lbl">晒 单<small>SHARED</small></span>
          </button>
          <button data-go="mine">
            <span class="ic-mine"></span>
            <span class="lbl">我 的<small>MY LOCKS</small></span>
          </button>
        </div>
      </div>
    `;
    bindShareEvents();
  }
  function bindShareEvents () {
    document.querySelectorAll('[data-screen="share"] .tabbar button[data-go]').forEach(b => {
      b.addEventListener('click', () => go(b.dataset.go));
    });
    document.querySelectorAll('[data-screen="share"] .share-tabs button').forEach((b, i) => {
      b.addEventListener('click', () => {
        document.querySelectorAll('[data-screen="share"] .share-tabs button').forEach(x => x.classList.remove('on'));
        b.classList.add('on');
        if (i === 1) toast('实 物 鉴 赏 · 7 月 底 开 放', '·');
        if (i === 2) toast('老 师 答 疑 · 每 周 三 晚 8 点', '·');
      });
    });
    document.querySelectorAll('[data-screen="share"] .like').forEach(b => {
      b.addEventListener('click', () => {
        b.classList.toggle('liked');
        const c = b.classList.contains('liked');
        b.innerHTML = `<i>♥</i>${b.dataset.likes || '0'} 赞`;
        if (c) {
          const n = parseInt(b.textContent.match(/\d+/)?.[0] || '0', 10) + 1;
          b.innerHTML = `<i>♥</i>${n} 赞`;
        }
        toast(c ? '已 赞 · 老 师 会 看 到' : '取 消 赞', c ? '♥' : '♡');
      });
    });
    document.querySelectorAll('[data-screen="share"] .cmt').forEach(b => {
      b.addEventListener('click', () => toast('评 论 功 能 · 圈 内 私 域', '↺'));
    });
    document.querySelectorAll('[data-screen="share"] .re-share').forEach(b => {
      b.addEventListener('click', () => toast('链 接 已 复 制 · 可 转 给 藏 友', '↗'));
    });
  }
  function startShareTimers () {
    // 预留：未来点赞数 / 评论数 实时刷新
  }

  // ============== 工具：toast / 时间 ==============
  let toastTimer = null;
  function toast (msg, icon) {
    icon = icon || '✓';
    let el = document.querySelector('.toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'toast';
      document.body.appendChild(el);
    }
    el.innerHTML = '<span class="ic">' + icon + '</span><span>' + msg + '</span>';
    el.classList.add('on');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('on'), 1600);
  }

  // ============== 顶导 ==============
  function bindGlobalNav () {
    document.querySelectorAll('.demo-nav button[data-go]').forEach(b => {
      b.addEventListener('click', () => {
        const target = b.dataset.go;
        if (target === 'transit') {
          const rush = PRODUCTS.find(p => p.isRush);
          go('transit', { force: true, transitPid: rush ? rush.id : 'p01' });
        } else if (target === 'detail') {
          // 详情页要传一个默认 pid（取首页第一个 rush 商品）
          const pid = state.activePid || (PRODUCTS.find(p => p.isRush) || PRODUCTS[0]).id;
          go('detail', { pid: pid, force: true });
        } else {
          go(target, { force: true });
        }
      });
    });
    const reset = document.querySelector('.demo-nav .reset');
    if (reset) reset.addEventListener('click', resetAll);
  }

  // ============== 启动 ==============
  function start () {
    state.locks = loadLocks();
    bindGlobalNav();
    // URL hash 调试用：#transit / #share / #mine / #detail?pid=p01
    const h = (location.hash || '').replace('#','');
    if (h) {
      const [scr, qs] = h.split('?');
      const params = Object.fromEntries(new URLSearchParams(qs || ''));
      go(scr, Object.assign({ force: true }, params));
    } else {
      go('home', { force: true });
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
