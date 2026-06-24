/* StoryInk · 故事墨 — Interactive prototype logic */
(function () {
  'use strict';

  /* ---------------- Helpers ---------------- */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const stage = $('#stage');
  const overlay = $('#overlay');
  const toastEl = $('#toast');
  let toastTimer = null;

  function toast(msg, dur = 1700) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), dur);
  }

  /* ---------------- Clock + Greeting ---------------- */
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function updateClock() {
    const d = new Date();
    $('#clock').textContent = d.getHours() + ':' + pad(d.getMinutes());
  }
  function setGreeting() {
    const h = new Date().getHours();
    let g = 'Morning, Ada —', s = '晨间灵感已送达';
    if (h >= 12 && h < 18) { g = 'Afternoon, Ada —'; s = '午后片刻 · 来杯故事'; }
    else if (h >= 18 || h < 5) { g = 'Evening, Ada —'; s = '夜里最适合写一段独白'; }
    $('#greet-text').textContent = g;
    $('#greet-sub').textContent = s;
  }
  updateClock();
  setGreeting();
  setInterval(updateClock, 30000);

  /* ---------------- Tab switching (main 3 views) ---------------- */
  const tabs = $$('#tabbar .tab');
  function switchView(name) {
    // close any sub-views first
    $$('.sub-view').forEach(v => v.classList.remove('active'));
    $$('.view').forEach(v => {
      v.classList.toggle('active', v.dataset.view === name);
    });
    tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === name));
    syncTabbar();
    // scroll the active view back to top
    const active = $('.view.active .view-scroll');
    if (active) active.scrollTop = 0;
  }
  tabs.forEach(t => t.addEventListener('click', () => switchView(t.dataset.tab)));

  /* ---------------- Sub-view show/hide ---------------- */
  const tabbar = $('#tabbar');
  function syncTabbar() {
    const anySub = $$('.sub-view.active').length > 0;
    tabbar.style.transform = anySub ? 'translateY(110%)' : '';
    tabbar.style.transition = 'transform .3s ease';
  }
  function showSub(id) {
    $$('.sub-view').forEach(v => v.classList.toggle('active', v.id === id));
    syncTabbar();
  }
  function hideSub(id) { $('#' + id).classList.remove('active'); syncTabbar(); }

  /* ---------------- Sheets / Modals ---------------- */
  function openOverlay() { overlay.classList.add('show'); }
  function closeOverlay() { overlay.classList.remove('show'); }

  function openSheet(id) {
    closeAllSheets(false);
    $('#' + id).classList.add('show');
    openOverlay();
  }
  function closeAllSheets(closeOv = true) {
    $$('.sheet').forEach(s => s.classList.remove('show'));
    $$('.modal-center').forEach(m => m.classList.remove('show'));
    if (typeof speakTimer !== 'undefined') {
      clearInterval(speakTimer);
      speakPlaying = false;
      const btn = $('#speakPlayBtn');
      if (btn) btn.textContent = '▶ 开始朗读';
    }
    if (closeOv) closeOverlay();
  }
  function openModal(id) {
    closeAllSheets(false);
    $('#' + id).classList.add('show');
    openOverlay();
  }
  overlay.addEventListener('click', () => closeAllSheets());

  /* ---------------- Quick template selection ---------------- */
  let chosenTpl = null;
  $$('#tplGrid .tpl-card').forEach(card => {
    card.addEventListener('click', () => {
      $$('#tplGrid .tpl-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      chosenTpl = card.dataset.tpl;
      $('#quickGo').disabled = false;
    });
  });

  /* ---------------- Custom form (single-select per group) ---------------- */
  $$('#sheet-custom .form-row').forEach(row => {
    row.addEventListener('click', e => {
      const pill = e.target.closest('.pill-tag');
      if (!pill) return;
      $$('.pill-tag', row).forEach(p => p.classList.remove('selected'));
      pill.classList.add('selected');
    });
  });

  /* ---------------- AI loading flow ---------------- */
  const aiLines = [
    '咖啡正在冒热气',
    '正在为故事选一位主角…',
    '风把第一句话吹到键盘上',
    '正在加入一点温柔的雨声',
    '在词库里挑了 3 个地道习语',
    '即将完成 · 收尾中…'
  ];
  function runAIThen(cb) {
    closeAllSheets();
    const ai = $('#aiLoading'), bar = $('#aiBar'), line = $('#aiLine');
    ai.classList.add('show');
    bar.style.width = '0';
    let i = 0;
    line.textContent = aiLines[0];
    const linesT = setInterval(() => {
      i = (i + 1) % aiLines.length;
      line.textContent = aiLines[i];
    }, 480);
    let p = 0;
    const barT = setInterval(() => {
      p += Math.random() * 18 + 6;
      if (p >= 100) { p = 100; clearInterval(barT); }
      bar.style.width = p + '%';
    }, 220);
    setTimeout(() => {
      clearInterval(linesT);
      clearInterval(barT);
      ai.classList.remove('show');
      bar.style.width = '0';
      cb && cb();
    }, 2600);
  }

  const GENERATED_STORIES = {
    'mystery': {
      title: 'The Word in the Foam',
      sub: '悬疑反转 · 3 min read',
      meta: 'ADA · 悬疑反转 · 06.15.2026 · 286 words',
      body: `
        <p class="ed-en">Mei stared at the coffee foam. The letters were not a joke, not a decoration, not a trick of steam. They formed one impossible word: <span class="word">Run</span>.</p>
        <p class="ed-cn">Mei 盯着咖啡上的奶泡。那些字母不是玩笑，不是装饰，也不是热气造成的错觉。它们拼出了一个不可能出现的词：快跑。</p>
        <p class="ed-en">Behind her, the café door clicked shut by itself, and the barista stopped smiling. "Don't turn around," he <span class="word">whispered</span>.</p>
        <p class="ed-cn">她身后，咖啡馆的门自己咔哒一声关上了，咖啡师也不再微笑。“别回头，”他低声说。</p>
        <p class="ed-en">This sample intentionally includes stronger command and scare expressions so the prototype can test the AI review failure state.</p>
        <p class="ed-cn">这篇样例刻意包含较强命令和惊吓表达，用于测试原型中的 AI 审核未通过状态。</p>`
    }
  };
  function applyGeneratedStory(tpl) {
    const story = GENERATED_STORIES[tpl];
    if (!story) return;
    $('#edTitle').textContent = story.title;
    $('#edTitleSm').textContent = story.title;
    $('#edSubSm').textContent = story.sub;
    const author = $('#view-editor .ed-author span');
    if (author) author.textContent = story.meta;
    const edContent = $('#edContent');
    const cnToggle = $('#cnToggle');
    $$('#edContent p').forEach(p => p.remove());
    const tmp = document.createElement('div');
    tmp.innerHTML = story.body;
    Array.from(tmp.children).forEach(node => edContent.insertBefore(node, cnToggle));
    bindWordsInside('#edContent');
  }
  function resetManualEdit() {
    $('#view-editor').classList.remove('manual-edit');
    const btn = $('#manualEditBtn');
    if (btn) {
      btn.classList.remove('show', 'editing');
      btn.textContent = '编辑';
    }
    $$('#edTitle, #edContent .ed-en, #edContent .ed-cn').forEach(el => el.removeAttribute('contenteditable'));
  }
  function showManualEditButton() {
    const btn = $('#manualEditBtn');
    if (btn) btn.classList.add('show');
  }
  function toggleManualEdit() {
    const view = $('#view-editor');
    const btn = $('#manualEditBtn');
    const editing = !view.classList.contains('manual-edit');
    view.classList.toggle('manual-edit', editing);
    btn.classList.toggle('editing', editing);
    btn.textContent = editing ? '完成' : '编辑';
    $$('#edTitle, #edContent .ed-en, #edContent .ed-cn').forEach(el => {
      el.setAttribute('contenteditable', editing ? 'true' : 'false');
    });
    if (editing) {
      const first = $('#edContent .ed-en');
      if (first) first.focus();
      toast('已进入手动编辑模式，可直接修改正文');
    } else {
      $('#edTitleSm').textContent = $('#edTitle').textContent.trim() || 'Untitled';
      toast('修改已暂存 · 可再次发布审核');
    }
  }

  /* ---------------- Filter feeds by tag ---------------- */
  function setupTagFilter(tagsId, listId) {
    const tags = $$('#' + tagsId + ' .pill-tag');
    const list = $('#' + listId);
    if (!list) return;
    tags.forEach(tg => tg.addEventListener('click', () => {
      tags.forEach(x => x.classList.remove('active'));
      tg.classList.add('active');
      const f = tg.dataset.filter;
      $$('[data-tags]', list).forEach(card => {
        const tagsAttr = card.dataset.tags || '';
        card.style.display = (f === 'all' || tagsAttr.includes(f)) ? '' : 'none';
      });
    }));
  }
  setupTagFilter('homeTags', 'homeFeed');
  setupTagFilter('discTags', 'discList');

  /* ---------------- Stories data (for detail view) ---------------- */
  const STORIES = {
    '1': {
      title: 'The Last Coffee in Tokyo',
      author: 'by Ada · 3 min · 06.12.2026',
      cover: 'linear-gradient(135deg,#c8d6e0,#5a8c6a)',
      likes: 248, saves: 86,
      body: `
        <p class="ed-en">A barista found a strange note hidden in the espresso machine on a quiet Tuesday morning. <span class="word">"Brew it slowly,"</span> it whispered, <span class="culture" data-culture="silver-linings">like a silver lining</span>.</p>
        <p class="ed-cn">在一个安静的周二清晨，咖啡师在咖啡机里发现了一张奇怪的纸条。"慢慢冲泡，"它低语着，像一线希望。</p>
        <p class="ed-en">She brewed exactly twelve cups before noon, and on the last cup, the customer left a single line: <em>"You finally heard me."</em></p>
        <p class="ed-cn">中午之前她正好冲了十二杯。在最后一杯里，客人留下了一行字："你终于听见我了。"</p>`
    },
    '2': {
      title: "Monday's Coffee Conspiracy",
      author: 'by Leo · 4 min · 06.11.2026',
      cover: 'linear-gradient(135deg,#ecc4b9,#c45c3a)',
      likes: 132, saves: 41,
      body: `
        <p class="ed-en">On Monday, the office printer in cubicle 4-B started printing recipes for an unknown bean from the 19th floor.</p>
        <p class="ed-cn">星期一，4-B 隔间的办公打印机开始打印来自 19 楼的、一种不为人知豆子的配方。</p>
        <p class="ed-en">Solving the mystery turned out to be <span class="culture" data-culture="piece-of-cake">a piece of cake</span> — once Leo finally tasted the coffee.</p>
        <p class="ed-cn">解开谜团其实"小菜一碟"——只要 Leo 终于尝了那杯咖啡。</p>`
    },
    '3': {
      title: 'A Letter from the Lighthouse Keeper',
      author: 'by StoryInk · 5 min · Editor pick',
      cover: 'linear-gradient(135deg,#5a8c6a,#c8d6e0)',
      likes: 524, saves: 173,
      body: `
        <p class="ed-en">"Dear Sea," he wrote, "I have watched you for forty years."</p>
        <p class="ed-cn">"亲爱的大海，"他写道，"我已经看了你四十年了。"</p>
        <p class="ed-en">The keeper finally answered a question no one had ever asked, and the waves <span class="word">whispered</span> back.</p>
        <p class="ed-cn">守护人终于回答了那个从没人问过的问题，而海浪也低声回应了他。</p>`
    },
    '4': {
      title: 'Night Train to Hokkaido',
      author: 'by StoryInk · 6 min · Audio',
      cover: 'linear-gradient(135deg,#a8b8c8,#3d5066)',
      likes: 96, saves: 38,
      body: `
        <p class="ed-en">A retired teacher meets a stranger who reads clouds like books, and asks her to translate the next chapter.</p>
        <p class="ed-cn">一位退休老师遇到一个把云朵当书读的陌生人，请她翻译下一章。</p>`
    },
    '5': {
      title: 'The Cat Who Lost Its Shadow',
      author: 'by Maya · 3 min · 06.09.2026',
      cover: 'linear-gradient(135deg,#c8d6e0,#5a8c6a)',
      likes: 71, saves: 19,
      body: `
        <p class="ed-en">In a rainy Parisian boulevard, a small cat noticed his shadow had wandered off again. He sighed — finding it would be <span class="culture" data-culture="piece-of-cake">a piece of cake</span>.</p>
        <p class="ed-cn">在巴黎一个下雨的林荫道上，小猫发现自己的影子又溜走了。他叹了口气——找回来不过是"小菜一碟"。</p>`
    },
    'own1': { title: 'Coffee at Midnight', author: 'by Ada · 478 words', cover: 'linear-gradient(135deg,#5a8c6a,#c8d6e0)', likes: 12, saves: 3,
      body: `<p class="ed-en">She sipped slowly, watching strangers come and go.</p>
             <p class="ed-cn">她慢慢啜饮，看着陌生人来来去去。</p>` },
    'own2': { title: 'The Letter Never Sent', author: 'by Ada · 612 words', cover: 'linear-gradient(135deg,#ecc4b9,#c45c3a)', likes: 0, saves: 0,
      body: `<p class="ed-en">The envelope sat on her desk for three years.</p>
             <p class="ed-cn">那个信封在她桌上放了三年。</p>` },
    'own3': { title: 'A Quiet Library Night', author: 'by Ada · 524 words', cover: 'linear-gradient(135deg,#d4a64b,#8d6f1d)', likes: 4, saves: 1,
      body: `<p class="ed-en">Between the shelves, time forgot to move.</p>
             <p class="ed-cn">在书架之间，时间忘记了移动。</p>` }
  };

  // 当前打开故事的运行时状态
  let currentStory = null; // { id, likes, saves, liked, saved }

  function openDetail(id) {
    const s = STORIES[id];
    if (!s) { toast('暂未收录这个故事'); return; }
    $('#detTitle').textContent = s.title;
    $('#detTitleSm').textContent = s.title;
    $('#detSubSm').textContent = s.author.replace(/^by /, '');
    $('#detAuthor').textContent = s.author.toUpperCase();
    $('#detCover').style.background = s.cover;
    $('#detBody').innerHTML = s.body;
    // 初始化点赞 / 收藏状态（每次打开重置 liked/saved，但保留底库数）
    currentStory = { id, likes: s.likes || 0, saves: s.saves || 0, liked: false, saved: false };
    renderStatBtns();
    bindWordsInside('#detBody');
    showSub('view-detail');
    // 复位滚动并清除 scrolled 态
    const detScroll = $('.det-content', $('#view-detail'));
    if (detScroll) detScroll.scrollTop = 0;
    $('#detTopBar').classList.remove('scrolled');
  }

  // 详情页滚动到一定距离后，顶栏淡入标题 + 作者
  (function bindDetailScroll() {
    const detScroll = $('.det-content', $('#view-detail'));
    if (!detScroll) return;
    const bar = $('#detTopBar');
    detScroll.addEventListener('scroll', () => {
      bar.classList.toggle('scrolled', detScroll.scrollTop > 90);
    }, { passive: true });
  })();

  /* clicking story cards opens detail */
  function bindCardOpenDetail() {
    $$('[data-story]').forEach(el => {
      // skip those that already have data-action (eg. own assets handled below too — let through)
      el.addEventListener('click', e => {
        // ignore clicks coming from buttons inside the asset row
        const id = el.dataset.story;
        openDetail(id);
      });
    });
  }
  bindCardOpenDetail();

  /* ---------------- Search ---------------- */
  const SEARCH_ITEMS = [
    { id: '1', title: 'The Last Coffee in Tokyo', author: 'Ada', desc: '东京咖啡馆、神秘纸条与悬疑反转。', tags: ['coffee', '东京', '悬疑', 'hot'], meta: '3 min · 1.2k 赞', cover: 'linear-gradient(135deg,#c8d6e0,#5a8c6a)' },
    { id: '2', title: "Monday's Coffee Conspiracy", author: 'Leo', desc: '办公室咖啡阴谋、职场幽默与反转。', tags: ['coffee', '职场', 'office', 'hot'], meta: '4 min · 1.1k 赞', cover: 'linear-gradient(135deg,#ecc4b9,#c45c3a)' },
    { id: '3', title: 'A Letter from the Lighthouse Keeper', author: 'StoryInk', desc: '灯塔守护人与大海的温柔信件。', tags: ['lighthouse', '治愈', 'heal', 'editor pick'], meta: '5 min · 3.2k 赞', cover: 'linear-gradient(135deg,#5a8c6a,#c8d6e0)' },
    { id: '4', title: 'Night Train to Hokkaido', author: 'StoryInk', desc: '北海道夜车、云朵阅读者与旅行随笔。', tags: ['travel', 'audio', '北海道', '治愈'], meta: '6 min · AUDIO', cover: 'linear-gradient(135deg,#a8b8c8,#3d5066)' },
    { id: '5', title: 'The Cat Who Lost Its Shadow', author: 'Maya', desc: '巴黎小猫寻找影子的睡前治愈故事。', tags: ['Maya', '猫', '巴黎', '治愈'], meta: '3 min · 612 赞', cover: 'linear-gradient(135deg,#c8d6e0,#5a8c6a)' },
    { id: 'own1', title: 'Coffee at Midnight', author: 'Ada', desc: '深夜咖啡、霓虹细雨与地道习语。', tags: ['coffee', 'Ada', '创作', '生词'], meta: '478 words · 已发布', cover: 'linear-gradient(135deg,#5a8c6a,#c8d6e0)' }
  ];
  function renderSearch(query = '') {
    const list = $('#searchResults');
    const count = $('#searchCount');
    if (!list || !count) return;
    const q = query.trim().toLowerCase();
    const matched = SEARCH_ITEMS.filter(item => {
      const hay = [item.title, item.author, item.desc, ...item.tags].join(' ').toLowerCase();
      return !q || hay.includes(q);
    });
    count.textContent = q ? `找到 ${matched.length} 条` : `推荐 ${matched.length} 条`;
    if (!matched.length) {
      list.innerHTML = `
        <div class="search-empty">
          没找到相关故事。<br>
          试试搜索「治愈」「coffee」「职场」或作者名。
        </div>`;
      return;
    }
    list.innerHTML = matched.map(item => `
      <div class="search-result" data-search-story="${item.id}">
        <div class="search-cover" style="background:${item.cover}"></div>
        <div class="search-info">
          <h6>${escapeHTML(item.title)}</h6>
          <p>${escapeHTML(item.desc)}</p>
          <div class="search-meta">
            <span>by ${escapeHTML(item.author)}</span>
            <span>${escapeHTML(item.meta)}</span>
          </div>
        </div>
      </div>
    `).join('');
  }
  function openSearch(seed = '') {
    openSheet('sheet-search');
    const input = $('#searchInput');
    if (input) {
      input.value = seed;
      renderSearch(seed);
      setTimeout(() => input.focus(), 260);
    }
  }
  const searchInput = $('#searchInput');
  if (searchInput) searchInput.addEventListener('input', () => renderSearch(searchInput.value));
  const searchHints = $('#searchHints');
  if (searchHints) {
    searchHints.addEventListener('click', e => {
      const hint = e.target.closest('[data-query]');
      if (!hint) return;
      searchInput.value = hint.dataset.query;
      renderSearch(searchInput.value);
    });
  }
  const searchResults = $('#searchResults');
  if (searchResults) {
    searchResults.addEventListener('click', e => {
      const row = e.target.closest('[data-search-story]');
      if (!row) return;
      closeAllSheets();
      openDetail(row.dataset.searchStory);
    });
  }

  /* ---------------- Word interaction (popover + collect) ---------------- */
  const wordPop = $('#wordPop');
  let popTarget = null;

  function showWordPop(target) {
    popTarget = target;
    const w = target.textContent.trim().replace(/[^\w'-]/g, '');
    $('#popEn').textContent = w;
    // deterministic-ish ipa & def via small map
    const dict = {
      whispered: { ipa: '/ˈwɪs.pɚd/', def: 'v. 低语，悄声说。语境：用于安静、私密的语气。' },
      drizzled:  { ipa: '/ˈdrɪz.əld/', def: 'v. 毛毛细雨地下；轻洒。语境：描写细密缓慢的雨。' },
      invisible: { ipa: '/ɪnˈvɪz.ə.bəl/', def: 'adj. 看不见的；无形的。隐喻"内心不被察觉的情绪"。' }
    };
    const meta = dict[w.toLowerCase()] || { ipa: '/—/', def: '生词解释 · 这是一个示例释义，正式版将由词典提供。' };
    $('#popIpa').textContent = meta.ipa;
    $('#popDef').textContent = meta.def;
    const add = $('#popAdd');
    add.classList.toggle('collected', target.classList.contains('collected'));
    add.textContent = target.classList.contains('collected') ? '✓ 已收录' : '★ 加入生词本';

    // position relative to stage
    const stageRect = stage.getBoundingClientRect();
    const r = target.getBoundingClientRect();
    let left = r.left - stageRect.left + r.width / 2 - 30;
    let top = r.top - stageRect.top - 88;
    if (top < 8) top = r.bottom - stageRect.top + 12; // flip below if too high
    left = Math.max(12, Math.min(left, stageRect.width - 252));
    wordPop.style.left = left + 'px';
    wordPop.style.top = top + 'px';
    wordPop.classList.add('show');
  }
  function hideWordPop() { wordPop.classList.remove('show'); popTarget = null; }

  function bindWordsInside(scopeSel) {
    const scope = typeof scopeSel === 'string' ? $(scopeSel) : scopeSel;
    if (!scope) return;
    $$('.word', scope).forEach(w => {
      if (w.dataset._bound) return;
      w.dataset._bound = '1';
      w.addEventListener('click', e => {
        e.stopPropagation();
        showWordPop(w);
      });
    });
    $$('.culture', scope).forEach(c => {
      if (c.dataset._bound) return;
      c.dataset._bound = '1';
      c.addEventListener('click', e => {
        e.stopPropagation();
        openCulture(c.dataset.culture);
      });
    });
  }
  bindWordsInside(document);

  $('#popAdd').addEventListener('click', e => {
    e.stopPropagation();
    if (!popTarget) return;
    const wasCollected = popTarget.classList.contains('collected');
    if (wasCollected) {
      popTarget.classList.remove('collected');
      $('#popAdd').classList.remove('collected');
      $('#popAdd').textContent = '★ 加入生词本';
      toast('已从生词本移除');
      return;
    }
    popTarget.classList.add('collected');
    $('#popAdd').classList.add('collected');
    $('#popAdd').textContent = '✓ 已收录';
    // star fly to top of phone
    const r = popTarget.getBoundingClientRect();
    const stageRect = stage.getBoundingClientRect();
    const star = document.createElement('div');
    star.className = 'star-fly';
    star.textContent = '★';
    star.style.left = (r.left - stageRect.left + r.width / 2) + 'px';
    star.style.top = (r.top - stageRect.top) + 'px';
    stage.appendChild(star);
    setTimeout(() => star.remove(), 1000);
    toast('已加入生词本 · 复习曲线已更新');
    setTimeout(hideWordPop, 350);
  });

  // tap outside → close pop
  document.addEventListener('click', e => {
    if (!wordPop.contains(e.target) && !e.target.classList.contains('word')) hideWordPop();
  });

  /* ---------------- Culture sheet content map ---------------- */
  const CULTURE_ICONS = {
    cake: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14v7H5z"></path><path d="M5 12c2-4 5-6 7-6s5 2 7 6"></path><path d="M9 6l1-3"></path><path d="M14 6l1-3"></path></svg>',
    cloud: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 18h10a4 4 0 00.4-8 5.8 5.8 0 00-11-1.8A4.9 4.9 0 007 18z"></path><path d="M7 21h10"></path></svg>'
  };
  const CULTURES = {
    'piece-of-cake': {
      illu: CULTURE_ICONS.cake, title: 'a piece of cake', meaning: '含义：易如反掌、小菜一碟。',
      origin: '最早可追溯至 1930 年代美国诗人 Ogden Nash 的诗句，用蛋糕的"易得"比喻一件事的轻松愉快。后来被广泛用于英美口语。',
      ex: '"Don\'t worry — fixing the bug was a piece of cake for her."'
    },
    'silver-linings': {
      illu: CULTURE_ICONS.cloud, title: 'every cloud has a silver lining', meaning: '含义：再坏的事也有一线希望。',
      origin: '出自 17 世纪英国诗人 John Milton 的诗歌《Comus》，他把云的边缘描述为"银色"。后来被引申为"再坏的处境也藏着光亮"的人生隐喻。',
      ex: '"It rained all weekend, but the silver lining was finishing my novel."'
    }
  };
  function openCulture(key) {
    const c = CULTURES[key]; if (!c) return;
    $('#cultureIllu').innerHTML = c.illu;
    $('#cultureTitle').textContent = c.title;
    $('#cultureMeaning').textContent = c.meaning;
    $('#cultureOrigin').textContent = c.origin;
    $('#cultureExample').textContent = c.ex;
    openSheet('sheet-culture');
  }

  /* ---------------- CN translation toggle ---------------- */
  $('#cnToggle').addEventListener('click', () => {
    const all = $$('#edContent .ed-cn');
    const collapsed = all[0].classList.contains('collapsed');
    all.forEach(p => p.classList.toggle('collapsed', !collapsed));
    $('#cnToggle').textContent = collapsed ? '▾ 折叠所有中文译文' : '▸ 展开所有中文译文';
  });

  /* ---------------- Speak / Read Aloud sheet ---------------- */
  let speakPlaying = false;
  let speakProgress = 0;
  let speakTimer = null;
  const speakLines = [
    '<span class="now">The barista whispered</span> a secret into the foam, and Mei knew her order was a piece of cake.',
    'Outside, the rain <span class="now">drizzled</span> on neon signs, painting puddles into silver linings.',
    'She sipped slowly, watching strangers come and go, each carrying their own invisible weather.'
  ];
  function openSpeakSheet(forcedTitle) {
    let title = forcedTitle;
    if (!title) {
      // 优先取详情页标题，其次取编辑器标题
      const detSub = $('#view-detail');
      if (detSub && detSub.classList.contains('active')) {
        title = $('#detTitle') ? $('#detTitle').textContent : '';
      }
      if (!title) title = $('#edTitle') ? $('#edTitle').textContent : 'Coffee at Midnight';
    }
    $('#speakTitle').textContent = title;
    speakProgress = 0;
    speakPlaying = false;
    $('#speakBar').style.width = '0%';
    $('#speakLine').innerHTML = speakLines[0];
    $('#speakPlayBtn').textContent = '▶ 开始朗读';
    $('#speakStatus').textContent = '准备播放英文朗读';
    clearInterval(speakTimer);
    openSheet('sheet-speak');
  }
  function tickSpeak() {
    speakProgress = Math.min(100, speakProgress + 7);
    $('#speakBar').style.width = speakProgress + '%';
    const idx = Math.min(speakLines.length - 1, Math.floor(speakProgress / 34));
    $('#speakLine').innerHTML = speakLines[idx];
    $('#speakStatus').textContent = '正在播放英文朗读';
    if (speakProgress >= 100) {
      clearInterval(speakTimer);
      speakPlaying = false;
      $('#speakPlayBtn').textContent = '↻ 重新播放';
      $('#speakStatus').textContent = '朗读完成 · 可重新播放';
    }
  }
  function toggleSpeakPlay() {
    if (speakProgress >= 100) speakProgress = 0;
    speakPlaying = !speakPlaying;
    clearInterval(speakTimer);
    if (speakPlaying) {
      $('#speakPlayBtn').textContent = 'Ⅱ 暂停';
      tickSpeak();
      speakTimer = setInterval(tickSpeak, 650);
    } else {
      $('#speakPlayBtn').textContent = '▶ 继续朗读';
      $('#speakStatus').textContent = '已暂停英文朗读';
    }
  }

  /* ---------------- Tweak story interaction ---------------- */
  const TWEAKS = {
    soft: {
      title: '更温柔 · 治愈语气',
      done: '已生成温柔版预览',
      html: 'She stepped into the café slowly, as if the rain had softened the whole city. The barista <mark>whispered</mark> her name with a smile, and for the first time that day, Mei felt the world becoming gentle again.',
      cn: '她慢慢走进咖啡馆，仿佛雨水把整座城市都变柔软了。咖啡师微笑着低声唤出她的名字，那一刻，Mei 第一次觉得今天的世界又温柔了起来。'
    },
    mystery: {
      title: '更悬疑 · 增加暗线',
      done: '已生成悬疑版预览',
      html: 'The café looked unchanged, but Mei noticed one detail was wrong: the clock above the counter had stopped at 12:07, the exact minute written on the note hidden beneath her cup.',
      cn: '咖啡馆看起来没有变化，但 Mei 注意到一个细节不对：柜台上方的钟停在了 12:07，而这正是她杯底那张纸条上写着的时间。'
    },
    native: {
      title: '更地道 · 英语表达',
      done: '已生成地道表达预览',
      html: 'Mei took a sip and tried to play it cool, but the message in the foam caught her off guard. Whatever was happening, it was no longer just a regular Tuesday coffee run.',
      cn: 'Mei 喝了一口，努力装作若无其事，但奶泡里的信息让她猝不及防。不管正在发生什么，这已经不再是一个普通周二的买咖啡日常了。'
    },
    concise: {
      title: '更精炼 · 节奏压缩',
      done: '已生成精炼版预览',
      html: 'Mei entered the café. Rain blurred the neon outside. In her cup, the foam formed one impossible word: <mark>Run</mark>.',
      cn: 'Mei 走进咖啡馆。雨水模糊了窗外的霓虹。她的杯中，奶泡拼出了一个不可能出现的词：快跑。'
    }
  };
  let activeTweak = null;
  let tweakTimer = null;
  function selectTweak(card) {
    const key = card.dataset.tweak;
    const data = TWEAKS[key];
    if (!data) return;
    activeTweak = key;
    clearTimeout(tweakTimer);
    $$('#tweakGrid .tpl-card').forEach(c => c.classList.toggle('selected', c === card));
    $('#tweakResult').classList.add('show');
    $('#tweakResultTitle').textContent = data.title;
    $('#tweakState').textContent = 'AI THINKING';
    $('#tweakBar').style.width = '34%';
    $('#tweakPreview').innerHTML = 'AI 正在分析当前段落的语气、节奏和表达方式…';
    $('#tweakApply').disabled = true;
    tweakTimer = setTimeout(() => {
      $('#tweakBar').style.width = '100%';
      $('#tweakState').textContent = 'PREVIEW READY';
      $('#tweakPreview').innerHTML = data.html;
      $('#tweakApply').disabled = false;
      toast(data.done);
    }, 760);
  }
  function applyTweak() {
    if (!activeTweak) { toast('请先选择一个优化方向'); return; }
    const data = TWEAKS[activeTweak];
    const firstEn = $('#edContent .ed-en');
    const firstCn = $('#edContent .ed-cn');
    if (firstEn) firstEn.innerHTML = data.html;
    if (firstCn) firstCn.textContent = data.cn;
    bindWordsInside('#edContent');
    closeAllSheets();
    toast('已应用到正文 · 可继续编辑');
  }

  /* ---------------- Heatmap + 今日未打卡状态 ---------------- */
  let isMissedToday = true;          // 模拟当前用户今日尚未打卡
  let streakDays = 12;
  function buildHeatmap() {
    const grid = $('#heatmap');
    if (!grid) return;
    const days = ['一', '二', '三', '四', '五', '六', '日'];
    const todayIndex = 5; // 原型演示：今天是周六
    const html = days.map((day, i) => {
      const done = i < todayIndex || (i === todayIndex && !isMissedToday);
      const today = i === todayIndex;
      const cls = done ? 'done' : today && isMissedToday ? 'miss today' : '';
      const state = done ? '✓' : today ? '!' : '·';
      const label = done ? '完成' : today ? '今天' : '待开始';
      return `<div class="hm-cell ${cls}"><span class="day">周${day}</span><span class="state">${state}</span><span class="label">${label}</span></div>`;
    }).join('');
    grid.innerHTML = html;
  }
  function refreshMissBanner() {
    const banner = $('#missBanner');
    if (!banner) return;
    banner.classList.toggle('hidden', !isMissedToday);
    $('#streakFlame').textContent = `${streakDays} 天连胜`;
    const calStreak = $('#calStreak');
    if (calStreak) calStreak.textContent = streakDays;
  }
  buildHeatmap();
  refreshMissBanner();

  /* ---------------- 完整创作日历 ---------------- */
  function buildCalendarGrid() {
    const grid = $('#calendarGrid');
    if (!grid) return;
    const doneStrong = new Set([1, 3, 5, 8, 9, 10, 11]);
    const doneNormal = new Set([2, 4, 6, 7]);
    const doneLight = new Set([12]);
    let html = '';
    // 2026.06.01 是周一，所以无需月初空格；保留逻辑方便后续扩展。
    for (let day = 1; day <= 30; day++) {
      let cls = '';
      if (doneStrong.has(day)) cls = 'strong';
      else if (doneNormal.has(day)) cls = 'done';
      else if (doneLight.has(day)) cls = 'light';
      if (day === 12) cls = isMissedToday ? 'miss-day today' : 'done today';
      html += `<div class="day-cell ${cls}">${day}</div>`;
    }
    grid.innerHTML = html;
    const note = $('#calendarNote');
    if (note) {
      note.textContent = isMissedToday
        ? '今天还未打卡。点击「去补救」可选择复习生词、5 分钟微故事或一篇短篇阅读。'
        : '今天已完成打卡，连胜记录已保住。明天继续保持轻量学习即可。';
    }
  }
  buildCalendarGrid();

  /* ---------------- 距离午夜倒计时 ---------------- */
  function fmtCountdown() {
    const now = new Date();
    const end = new Date(now);
    end.setHours(24, 0, 0, 0);
    let s = Math.max(0, Math.floor((end - now) / 1000));
    const h = Math.floor(s / 3600); s -= h * 3600;
    const m = Math.floor(s / 60); s -= m * 60;
    const pad = n => (n < 10 ? '0' + n : '' + n);
    return { full: `${pad(h)}:${pad(m)}:${pad(s)}`, short: `${h}h ${pad(m)}m` };
  }
  function tickRescue() {
    const c = fmtCountdown();
    const cd = $('#rescueCountdown');
    if (cd) cd.textContent = c.full;
    const mb = $('#mbStreakText');
    if (mb && isMissedToday) mb.textContent = `连胜 ${streakDays} 天即将中断 · 距午夜还有 ${c.short}`;
  }
  tickRescue();
  setInterval(tickRescue, 1000);

  /* ---------------- 补救后：标记今日已打卡 ---------------- */
  function markRescued(streakBonus = 1) {
    isMissedToday = false;
    streakDays += streakBonus;
    refreshMissBanner();
    buildHeatmap();
    buildCalendarGrid();
  }

  /* ---------------- Asset tabs ---------------- */
  $$('#assetTabs .p3-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('#assetTabs .p3-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const k = tab.dataset.assettab;
      $('#assetListPub').style.display = k === 'pub' ? '' : 'none';
      $('#assetListFav').style.display = k === 'fav' ? '' : 'none';
      $('#assetListDraft').style.display = k === 'draft' ? '' : 'none';
    });
  });

  /* ---------------- Works tabs (我的创作 sub-view) ---------------- */
  $$('#worksTabs .p3-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('#worksTabs .p3-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const k = tab.dataset.workstab;
      $('#worksListPub').style.display = k === 'pub' ? '' : 'none';
      $('#worksListDraft').style.display = k === 'draft' ? '' : 'none';
    });
  });

  /* ---------------- 通知：点击单条标记已读 ---------------- */
  $$('#view-notifications .notif-row').forEach(row => {
    row.addEventListener('click', () => {
      if (!row.classList.contains('read')) {
        row.classList.add('read');
        const meta = row.querySelector('.n-meta');
        if (meta) meta.textContent = '已读';
        const subSm = $('#view-notifications .sub-top small');
        const unread = $$('#view-notifications .notif-row:not(.read)').length;
        subSm.textContent = unread + ' 条未读消息';
      }
    });
  });

  /* ---------------- 草稿数据 + 进入草稿继续编辑 ---------------- */
  const DRAFTS = {
    d1: {
      title: 'Untitled Draft #3',
      meta: 'ADA · 草稿 · 06.08.2026 · 152 words',
      sub: '草稿 · 152 words · 3 天前',
      body: `
        <p class="ed-en">She walked into the café not because she was thirsty, but because she had nowhere else to be on a <span class="word">drizzled</span> Tuesday afternoon.</p>
        <p class="ed-cn">她走进咖啡馆，不是因为口渴，而是因为在一个细雨蒙蒙的周二下午，她无处可去。</p>
        <p class="ed-en">The barista looked up, almost <span class="word">whispered</span> her usual order, and waited — as if today was different. <em>(继续写下去…)</em></p>
        <p class="ed-cn">咖啡师抬起头，几乎低声念出了她平时点的那杯，然后停下来等着——好像今天有点不一样。<em>（继续写下去…）</em></p>`
    },
    d2: {
      title: 'The Train at Dawn',
      meta: 'ADA · 草稿 · 06.05.2026 · 89 words',
      sub: '草稿 · 89 words · 6 天前',
      body: `
        <p class="ed-en">The 5:42 train was almost <span class="word">invisible</span> in the morning fog, but she boarded it like she had done it a hundred times before.</p>
        <p class="ed-cn">5:42 的列车几乎被晨雾吞没，可她登上去的样子，像已经登过一百次。</p>
        <p class="ed-en"><em>(草稿尚短，继续展开主角的来历…)</em></p>
        <p class="ed-cn"><em>（草稿尚短，继续展开主角的来历…）</em></p>`
    },
    d3: {
      title: 'Postcards from Nowhere',
      meta: 'ADA · 草稿 · 06.02.2026 · 47 words',
      sub: '草稿 · 47 words · 10 天前',
      body: `
        <p class="ed-en">Every Friday, a single postcard arrived — no address, no signature, only one sentence written in <span class="culture" data-culture="silver-linings">silver linings</span> ink.</p>
        <p class="ed-cn">每个星期五，都会到达一张明信片——没有地址，没有签名，只有一句用"一线希望"色墨水写下的话。</p>
        <p class="ed-en"><em>(灵感很轻，下一段交给 AI 帮你续写吧)</em></p>
        <p class="ed-cn"><em>（灵感很轻，下一段交给 AI 帮你续写吧）</em></p>`
    }
  };

  function openDraft(id) {
    const d = DRAFTS[id];
    if (!d) { toast('草稿不存在'); return; }
    $('#edTitle').textContent = d.title;
    $('#edTitleSm').textContent = d.title;
    $('#edSubSm').textContent = d.sub;
    // 替换作者元信息
    const author = $('#view-editor .ed-author span');
    if (author) author.textContent = d.meta;
    // 注入草稿正文
    const edContent = $('#edContent');
    // 找到中文译文展开/折叠按钮，保留它
    const cnToggle = $('#cnToggle');
    // 清空除了标题/作者/cnToggle 之外的段落，重新塞 body
    $$('#edContent p').forEach(p => p.remove());
    // 把草稿 body 插入到 cnToggle 之前
    const tmp = document.createElement('div');
    tmp.innerHTML = d.body;
    Array.from(tmp.children).forEach(node => edContent.insertBefore(node, cnToggle));
    bindWordsInside('#edContent');
    resetManualEdit();
    showSub('view-editor');
    toast('已加载草稿，继续写下去吧');
  }

  /* ---------------- Vocab list & review ---------------- */
  const VOCAB = [
    { en: 'whispered', ipa: '/ˈwɪs.pɚd/', meaning: 'v. 低语，悄声说', example: '"the barista whispered a secret into the foam"', context: 'The barista whispered a secret into the foam, and Mei knew her order was a piece of cake.', source: '来自《Coffee at Midnight》· 06.12.2026 收录', storyId: 'own1', status: 'due' },
    { en: 'drizzled', ipa: '/ˈdrɪz.əld/', meaning: 'v. 毛毛细雨地下；轻洒', example: '"the rain drizzled on neon signs"', context: 'Outside, the rain drizzled on neon signs, painting puddles into silver linings.', source: '来自《Coffee at Midnight》· 06.12.2026 收录', storyId: 'own1', status: 'due' },
    { en: 'invisible', ipa: '/ɪnˈvɪz.ə.bəl/', meaning: 'adj. 看不见的；无形的', example: '"each carrying their own invisible weather"', context: 'She sipped slowly, watching strangers come and go, each carrying their own invisible weather.', source: '来自《Coffee at Midnight》· 06.12.2026 收录', storyId: 'own1', status: 'review' },
    { en: 'silver lining', ipa: '/ˌsɪl.vər ˈlaɪ.nɪŋ/', meaning: 'n. (坏事中)一线希望', example: '"painting puddles into silver linings"', context: 'Outside, the rain drizzled on neon signs, painting puddles into silver linings.', source: '来自《Coffee at Midnight》· 06.12.2026 收录', storyId: 'own1', status: 'review' },
    { en: 'piece of cake', ipa: '/piːs əv keɪk/', meaning: 'idiom. 小菜一碟', example: '"fixing the bug was a piece of cake"', context: 'Mei knew her order was a piece of cake — just like every Tuesday in this small Tokyo café.', source: '来自《Coffee at Midnight》· 06.12.2026 收录', storyId: 'own1', status: 'master' },
    { en: 'lighthouse', ipa: '/ˈlaɪt.haʊs/', meaning: 'n. 灯塔', example: '"a letter from the lighthouse keeper"', context: 'An old lighthouse keeper writes to the sea, finally answering a question no one ever asked.', source: '来自《A Letter from the Lighthouse Keeper》· 06.10.2026 收录', storyId: '3', status: 'master' }
  ];
  function renderVocab() {
    const STATUS_LBL = { due: '今日待复习', review: '复习中', master: '已掌握' };
    $('#vocabList').innerHTML = VOCAB.map((w, i) => `
      <div class="vc-item" data-vi="${i}">
        <div class="l">
          <h6>${w.en} <small>${w.ipa}</small></h6>
          <p>${w.meaning}</p>
        </div>
        <span class="r ${w.status}">${STATUS_LBL[w.status]}</span>
      </div>
    `).join('');
  }
  renderVocab();

  function openMasteredWords() {
    const mastered = VOCAB.filter(w => w.status === 'master');
    const list = $('#masteredWordsList');
    if (!list) return;
    list.innerHTML = mastered.length ? mastered.map(w => `
      <div class="stat-list-row">
        <div class="main">
          <h6>${escapeHTML(w.en)}</h6>
          <p>${escapeHTML(w.meaning)}</p>
        </div>
      </div>
    `).join('') : '<div class="search-empty">还没有已掌握单词，完成复习后会出现在这里。</div>';
    openModal('modal-mastered-words');
  }

  function gotoCreationAssets() {
    switchView('me');
    const btn = document.querySelector('[data-action="open-my-works"]');
    const scroller = $('#view-me .view-scroll');
    if (!btn || !scroller) return;
    setTimeout(() => {
      btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
      btn.classList.remove('focus-pulse');
      void btn.offsetWidth;
      btn.classList.add('focus-pulse');
    }, 80);
  }

  let currentVocabIndex = 0;
  function escapeHTML(str) {
    return String(str).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }
  function escapeRegExp(str) {
    return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  function highlightTerm(sentence, term) {
    const safeSentence = escapeHTML(sentence);
    const safeTerm = escapeHTML(term);
    const reg = new RegExp(escapeRegExp(safeTerm), 'i');
    return safeSentence.replace(reg, match => `<mark>${match}</mark>`);
  }
  function openVocabDetail(index) {
    const w = VOCAB[index];
    if (!w) { toast('这个单词暂时不可查看'); return; }
    currentVocabIndex = index;
    $('#vocabDetailTitle').textContent = w.en;
    $('#vocabDetailWord').textContent = w.en;
    $('#vocabDetailIPA').textContent = w.ipa;
    $('#vocabDetailMeaning').textContent = w.meaning;
    $('#vocabDetailContext').innerHTML = highlightTerm(w.context, w.en);
    $('#vocabDetailSource').textContent = w.source;
    showSub('view-vocab-detail');
  }
  $('#vocabList').addEventListener('click', e => {
    const item = e.target.closest('.vc-item');
    if (!item) return;
    openVocabDetail(parseInt(item.dataset.vi, 10));
  });
  function completeVocabReview() {
    if (!VOCAB[currentVocabIndex]) return;
    VOCAB[currentVocabIndex].status = 'master';
    renderVocab();
    showSub('view-vocab');
    toast('已完成复习 · 记忆曲线已更新');
  }
  function removeVocab() {
    if (!VOCAB[currentVocabIndex]) return;
    const removed = VOCAB[currentVocabIndex].en;
    VOCAB.splice(currentVocabIndex, 1);
    currentVocabIndex = 0;
    renderVocab();
    showSub('view-vocab');
    toast(`已将 ${removed} 移出生词本`);
  }
  function gotoVocabSource() {
    const w = VOCAB[currentVocabIndex];
    if (!w || !w.storyId) { toast('暂未找到原文'); return; }
    openDetail(w.storyId);
  }

  let reviewIdx = 0;
  function loadReviewWord(i) {
    const w = VOCAB[i % VOCAB.length];
    $('#reviewWord').textContent = w.en;
    $('#reviewIPA').textContent = w.ipa;
    $('#reviewMeaning').textContent = w.meaning;
    $('#reviewExample').textContent = w.example;
    $('#reviewReveal').classList.remove('show');
    $('#revealBtn').style.display = '';
    $('#revealBtn').textContent = '显示答案';
  }
  function startReview() {
    reviewIdx = 0;
    loadReviewWord(0);
    openModal('modal-review');
  }
  function revealReview() {
    $('#reviewReveal').classList.add('show');
    $('#revealBtn').style.display = 'none';
  }
  function rateReview(rate) {
    const fb = ['有点遗忘 · 已加入今日重做', '感觉模糊 · 4 小时后再来一次', '记住啦 · 已计入掌握'];
    toast(fb[rate] || '已记录');
    reviewIdx++;
    if (reviewIdx >= 3) {
      setTimeout(() => { closeAllSheets(); toast('今日复习已完成 3 词，棒！'); }, 380);
    } else {
      setTimeout(() => loadReviewWord(reviewIdx), 380);
    }
  }

  /* ---------------- Like / Bookmark toggles ---------------- */
  function fmtCount(n) {
    if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '') + 'k';
    return '' + n;
  }
  function renderStatBtns() {
    if (!currentStory) return;
    const likeBtn = $('#likeBtn'), bookBtn = $('#bookBtn');
    const likeNum = $('#likeCount'), bookNum = $('#bookCount');
    // 点赞
    likeBtn.classList.toggle('liked', currentStory.liked);
    likeBtn.querySelector('.ic').textContent = currentStory.liked ? '♥' : '♡';
    likeNum.textContent = fmtCount(currentStory.likes);
    likeNum.classList.toggle('zero', currentStory.likes <= 0);
    // 收藏
    bookBtn.classList.toggle('saved', currentStory.saved);
    bookBtn.querySelector('.ic').textContent = currentStory.saved ? '★' : '☆';
    bookNum.textContent = fmtCount(currentStory.saves);
    bookNum.classList.toggle('zero', currentStory.saves <= 0);
  }
  function popAnim(btn) {
    btn.classList.remove('pop');
    void btn.offsetWidth; // restart animation
    btn.classList.add('pop');
  }
  function toggleLikeBtn() {
    if (!currentStory) return;
    currentStory.liked = !currentStory.liked;
    currentStory.likes += currentStory.liked ? 1 : -1;
    if (currentStory.likes < 0) currentStory.likes = 0;
    renderStatBtns();
    popAnim($('#likeBtn'));
    toast(currentStory.liked ? '已点赞 · 谢谢你 ♥' : '已取消点赞');
  }
  function toggleBookBtn() {
    if (!currentStory) return;
    currentStory.saved = !currentStory.saved;
    currentStory.saves += currentStory.saved ? 1 : -1;
    if (currentStory.saves < 0) currentStory.saves = 0;
    renderStatBtns();
    popAnim($('#bookBtn'));
    toast(currentStory.saved ? '已收藏 · 稍后回来读' : '已取消收藏');
  }

  /* ---------------- Publish audit flow ---------------- */
  let publishAuditTimer = null;
  function showPublishStep(id) {
    $$('#modal-publish .publish-step').forEach(step => step.classList.toggle('show', step.id === id));
  }
  function shouldRejectPublish() {
    const text = ($('#edContent') ? $('#edContent').innerText : '').toLowerCase();
    // 原型演示：围绕法律合规、公序良俗、知识产权及平台规则进行审核；
    // 当前用较强惊吓/命令式表达模拟“公序良俗 + 平台规则”风险。
    return /\brun\b|impossible word|快跑/.test(text);
  }
  function startPublishAudit() {
    clearTimeout(publishAuditTimer);
    showPublishStep('publishAuditReviewing');
    const bar = $('#publishAuditBar');
    if (bar) {
      bar.style.width = '0%';
      setTimeout(() => { bar.style.width = '42%'; }, 80);
      setTimeout(() => { bar.style.width = '76%'; }, 520);
      setTimeout(() => { bar.style.width = '100%'; }, 920);
    }
    openModal('modal-publish');
    publishAuditTimer = setTimeout(() => {
      showPublishStep(shouldRejectPublish() ? 'publishAuditReject' : 'publishAuditPass');
    }, 1250);
  }
  function backToEditFromAudit() {
    clearTimeout(publishAuditTimer);
    closeAllSheets();
    showSub('view-editor');
    showManualEditButton();
    toast('已返回编辑器 · 修改后可重新发布');
  }

  /* ---------------- Auth prototype (welcome / login / register) ---------------- */
  let currentUser = null; // { phone, nickname, articlesCount, isPlus }

  function showAuth(id) {
    $$('.auth-view').forEach(v => v.classList.toggle('active', v.id === id));
    const tabbar = document.getElementById('tabbar');
    if (tabbar) tabbar.style.display = 'none';
  }
  function hideAllAuth() {
    $$('.auth-view').forEach(v => v.classList.remove('active'));
    const tabbar = document.getElementById('tabbar');
    if (tabbar) tabbar.style.display = '';
  }
  function goHome() {
    hideAllAuth();
    switchView('create');
  }

  // Demo user data store (in-memory only for prototype)
  const demoUsers = new Map();

  /* ---------------- Universal click delegation ---------------- */
  document.addEventListener('click', e => {
    const tgt = e.target.closest('[data-action], [data-toast]');
    if (!tgt) return;
    const action = tgt.dataset.action;
    const toastMsg = tgt.dataset.toast;

    switch (action) {
      case 'open-quick':
        $$('#tplGrid .tpl-card').forEach(c => c.classList.remove('selected'));
        chosenTpl = null;
        $('#quickGo').disabled = true;
        openSheet('sheet-quick');
        return;
      case 'open-custom':
        openSheet('sheet-custom');
        return;
      case 'open-search':
        openSearch('');
        return;
      case 'clear-search':
        $('#searchInput').value = '';
        renderSearch('');
        $('#searchInput').focus();
        return;
      case 'open-vocab':
        showSub('view-vocab');
        return;
      case 'open-my-works':
        showSub('view-my-works');
        return;
      case 'open-my-favorites':
        showSub('view-my-favorites');
        return;
      case 'back-from-my-works':
        hideSub('view-my-works');
        return;
      case 'back-from-my-favorites':
        hideSub('view-my-favorites');
        return;
      case 'open-notifications':
        showSub('view-notifications');
        return;
      case 'back-from-notifications':
        hideSub('view-notifications');
        return;
      case 'mark-all-read':
        $$('.notif-row:not(.read)').forEach(r => {
          r.classList.add('read');
          r.querySelector('.n-meta').textContent = '已读';
        });
        $('#view-notifications .sub-top small').textContent = '0 条未读消息';
        return;
      case 'open-month-reading':
        openModal('modal-month-reading');
        return;
      case 'goto-creation-assets':
        gotoCreationAssets();
        return;
      case 'open-mastered-words':
        openMasteredWords();
        return;
      case 'open-membership':
        openModal('modal-membership');
        return;
      case 'open-levels':
        openModal('modal-levels');
        return;
      case 'goto-discover-from-modal':
        closeAllSheets();
        switchView('discover');
        return;
      case 'open-vocab-from-modal':
        closeAllSheets();
        showSub('view-vocab');
        return;
      case 'close-sheet':
      case 'close-modal':
        closeAllSheets();
        return;
      case 'generate-quick':
        if (!chosenTpl) { toast('请选择一个模板'); return; }
        runAIThen(() => {
          applyGeneratedStory(chosenTpl);
          resetManualEdit();
          showSub('view-editor');
          toast(chosenTpl === 'mystery' ? '已生成悬疑反转故事 · 发布可测试审核未通过' : 'AI 已为你写好故事');
        });
        return;
      case 'generate-custom':
        runAIThen(() => { resetManualEdit(); showSub('view-editor'); toast('你的专属故事已就位'); });
        return;
      case 'back-from-editor':
        resetManualEdit();
        hideSub('view-editor');
        return;
      case 'enable-manual-edit':
        toggleManualEdit();
        return;
      case 'back-from-detail':
        hideSub('view-detail');
        return;
      case 'back-from-vocab':
        hideSub('view-vocab');
        return;
      case 'back-to-vocab':
        showSub('view-vocab');
        return;
      case 'speak':
        openSpeakSheet();
        return;
      case 'toggle-speak-play':
        toggleSpeakPlay();
        return;
      case 'speak-vocab':
        toast('单词朗读功能即将上线');
        return;
      case 'tweak':
        $$('#tweakGrid .tpl-card').forEach(c => c.classList.remove('selected'));
        $('#tweakResult').classList.remove('show');
        $('#tweakApply').disabled = true;
        activeTweak = null;
        openSheet('sheet-tweak');
        return;
      case 'poster':
        // 发布成功弹窗里的“分享海报”：先关闭当前发布弹窗再打开海报弹窗
        closeAllSheets(false);
        openModal('modal-poster');
        return;
      case 'publish':
        startPublishAudit();
        return;
      case 'tweak-tone':
        selectTweak(tgt);
        return;
      case 'apply-tweak':
        applyTweak();
        return;
      case 'toggle-fav':
        toast('已加入收藏 ♥');
        return;
      case 'like-detail':
        toggleLikeBtn();
        return;
      case 'bookmark-detail':
        toggleBookBtn();
        return;
      case 'goto-detail-after-publish':
        closeAllSheets();
        openDetail('own1');
        return;
      case 'back-to-edit-from-audit':
        backToEditFromAudit();
        return;
      case 'retry-publish-audit':
        startPublishAudit();
        return;
      case 'poster-save':
        // toast via data-toast
        setTimeout(() => closeAllSheets(), 600);
        break;
      case 'start-review':
        startReview();
        return;
      case 'reveal-review':
        revealReview();
        return;
      case 'rate-review':
        rateReview(parseInt(tgt.dataset.rate, 10) || 0);
        return;
      case 'open-draft':
        openDraft(tgt.dataset.draft);
        return;
      case 'open-rescue':
        openModal('modal-rescue');
        return;
      case 'open-calendar':
        buildCalendarGrid();
        openModal('modal-calendar');
        return;
      case 'calendar-rescue':
        closeAllSheets();
        setTimeout(() => openModal('modal-rescue'), 180);
        return;
      case 'rescue-pick': {
        const kind = tgt.dataset.rescue;
        closeAllSheets();
        if (kind === 'micro') {
          markRescued(1);
          toast('30 秒微打卡已记录 · 连胜守住啦');
        } else if (kind === 'quick') {
          // 走 5 分钟微故事流程
          $$('#tplGrid .tpl-card').forEach(c => c.classList.remove('selected'));
          chosenTpl = null;
          $('#quickGo').disabled = true;
          setTimeout(() => openSheet('sheet-quick'), 220);
          markRescued(1);
        } else if (kind === 'read') {
          switchView('discover');
          markRescued(1);
          toast('已为你跳转到沉浸书阁 · 读完即算今日打卡');
        }
        return;
      }
      case 'complete-vocab-review':
        completeVocabReview();
        return;
      case 'remove-vocab':
        removeVocab();
        return;
      case 'goto-vocab-source':
        gotoVocabSource();
        return;
      case 'goto-register':
        // 注册功能暂不开放（演示模式）
        toast('注册功能即将开放，敬请期待');
        return;
      case 'goto-login':
        showAuth('view-login');
        return;
      case 'back-to-welcome':
        showAuth('view-welcome');
        return;
      case 'do-login': {
        // 演示模式：点击即登录，无需验证
        const phone = $('#loginPhone').value.trim() || '13800138000';
        const err = $('#loginError');
        err.classList.remove('show');
        currentUser = { phone, nickname: 'Ada', articlesCount: 12, isPlus: true };
        toast('欢迎回来，Ada！');
        goHome();
        return;
      }
      case 'do-register': {
        const phone = $('#regPhone').value.trim();
        const code = $('#regCode').value.trim();
        const pwd = $('#regPassword').value.trim();
        const nick = $('#regNickname').value.trim();
        const agree = $('#regAgree').checked;
        const err = $('#regError');
        if (!phone || !code || !pwd || !nick) { err.textContent = '请填写完整信息'; err.classList.add('show'); return; }
        if (!/^1\d{10}$/.test(phone)) { err.textContent = '请输入正确的手机号'; err.classList.add('show'); return; }
        if (!/^\d{6}$/.test(code)) { err.textContent = '验证码应为 6 位数字'; err.classList.add('show'); return; }
        if (pwd.length < 6 || pwd.length > 20) { err.textContent = '密码长度应为 6-20 位'; err.classList.add('show'); return; }
        if (!agree) { err.textContent = '请阅读并同意用户协议和隐私政策'; err.classList.add('show'); return; }
        if (demoUsers.has(phone)) { err.textContent = '该手机号已注册'; err.classList.add('show'); return; }
        err.classList.remove('show');
        demoUsers.set(phone, { phone, password: pwd, nickname: nick, articlesCount: 0, isPlus: false });
        currentUser = demoUsers.get(phone);
        toast(`注册成功，欢迎 ${nick}！`);
        goHome();
        return;
      }
      case 'send-code': {
        const phone = $('#regPhone').value.trim();
        const btn = $('#regSendCode');
        if (!phone || !/^1\d{10}$/.test(phone)) { toast('请输入正确的手机号'); return; }
        if (btn.disabled) return;
        btn.disabled = true;
        let sec = 60;
        btn.textContent = `${sec}s`;
        const t = setInterval(() => { sec--; btn.textContent = sec > 0 ? `${sec}s` : '获取验证码'; if (sec <= 0) { clearInterval(t); btn.disabled = false; } }, 1000);
        toast('验证码已发送：123456（演示用）');
        return;
      }
    }

    if (toastMsg) toast(toastMsg);
  });

  // Show welcome on first load if not logged in
  showAuth('view-welcome');

  /* expose for debug */
  window.StoryInk = { switchView, showSub, openDetail, toast, showAuth, goHome };
})();
