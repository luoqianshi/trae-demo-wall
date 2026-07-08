/* ============================================================
   梦邮局 · Dream Post Office · 交互逻辑
   ============================================================ */

(function() {
  'use strict';

  /* ===== 视图切换 ===== */
  const views = document.querySelectorAll('.view');
  const navItems = document.querySelectorAll('.nav-item');

  // 为折叠态 tooltip 准备文本
  navItems.forEach(item => {
    const label = item.querySelector('span');
    if (label) item.dataset.tip = label.textContent.trim();
  });

  function switchView(viewName) {
    views.forEach(v => v.classList.remove('active'));
    navItems.forEach(n => n.classList.remove('active'));

    const view = document.getElementById('view-' + viewName);
    const nav = document.querySelector(`.nav-item[data-view="${viewName}"]`);

    if (view) {
      view.classList.add('active');
      view.querySelector('.view-body')?.scrollTo(0, 0);
    }
    if (nav) nav.classList.add('active');
  }

  /* ===== 侧边栏折叠 ===== */
  const sidebar = document.querySelector('.sidebar');
  const sidebarToggle = document.getElementById('sidebarToggle');

  sidebarToggle?.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
  });

  navItems.forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      switchView(item.dataset.view);
    });
  });

  document.querySelectorAll('[data-goto]').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.goto));
  });

  /* ===== 回信箱：列表切换 + 详情数据 ===== */
  const lettersData = [
    {
      avatar: 'images/avatars/avatar-2.jpg',
      from: '梦友 #2847', time: '2小时前 · 情绪共振',
      dream: '"我梦见自己走在一条没有尽头的走廊里，墙壁是水做的，能看见里面的鱼在游。走廊尽头有一扇门，但每次我走近，门就退远一些。"',
      reply: '"走廊是潜意识的通道，水墙说明你在尝试看见自己情绪下面的东西。鱼是好的——那意味着生命。门退远，是因为你还没准备好打开它，但你在走向它，这本身就是答案。"',
      signature: '— 一个也做过类似梦的人'
    },
    {
      avatar: 'images/avatars/avatar-1.jpg',
      from: '梦友 #3391', time: '14分钟前 · 情绪共振',
      dream: '"森林里下着雪，每一片雪花落地都会发出风铃的声音。我蹲下来想听清楚，但雪化得很快。"',
      reply: '"雪的声音是你内心在尝试被听见，那些风铃是情绪的形状。雪化得快，是因为那些感受本来就脆弱——但你在蹲下听，说明你愿意停下来。"',
      signature: '— 一个也曾在梦里听见声音的人'
    },
    {
      avatar: 'images/avatars/avatar-7.jpg',
      from: '梦友 #1923', time: '昨天 · 情绪共振',
      dream: '"梦里我在一片金色的麦田上空飞行，下方有人在招手，但我听不见声音。"',
      reply: '"飞翔通常意味着你正在某种意义上获得自由。听不见声音，或许你还没有准备好回应地面上的人——但这不影响你继续飞。"',
      signature: '— 一个也曾飞过麦田的人'
    },
    {
      avatar: 'images/avatars/avatar-4.jpg',
      from: '梦友 #0721', time: '3天前 · 情绪共振',
      dream: '"我回到小时候住过的房子，但所有门都打不开，只有窗户能看见里面。"',
      reply: '"窗是你愿意向外看的角度，而门代表着进入的勇气。你回到童年，但还没准备好重新进入它——没关系，先看看也好。"',
      signature: '— 一个也回过老家的人'
    },
    {
      avatar: 'images/avatars/avatar-6.jpg',
      from: '梦友 #0512', time: '5天前 · 情绪共振',
      dream: '"海水慢慢涨上来，我没跑，就站在那里，水漫过脚踝、膝盖，但我并不害怕。"',
      reply: '"你不害怕，那是一种接受的姿态。水是情绪，你没有逃，说明你正在学会和它共处。该走了——是你自己在梦里说的。"',
      signature: '— 一个也曾被水淹没的人'
    }
  ];

  const letterCards = document.querySelectorAll('.letter-card');
  const letterDetail = document.getElementById('letterDetail');
  let currentLetterIdx = 0;
  const favorites = new Set();

  letterCards.forEach(card => {
    card.addEventListener('click', () => {
      const idx = parseInt(card.dataset.letter);
      const data = lettersData[idx];
      if (!data) return;

      letterCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      currentLetterIdx = idx;

      if (card.classList.contains('unread')) {
        card.classList.remove('unread');
        updateBadge();
      }

      renderLetterDetail(data, idx);
    });
  });

  function renderLetterDetail(data, idx) {
    if (!letterDetail) return;
    const isFav = favorites.has(idx);
    letterDetail.innerHTML = `
      <div class="detail-header">
        <div class="detail-avatar img-avatar" style="background-image: url('${data.avatar}')"></div>
        <div>
          <div class="detail-from">来自 · ${data.from}</div>
          <div class="detail-time">${data.time}</div>
        </div>
      </div>
      <div class="detail-section">
        <div class="detail-label">TA 寄来的梦</div>
        <div class="detail-dream"><p>${data.dream}</p></div>
      </div>
      <div class="detail-section">
        <div class="detail-label">TA 给你的回信</div>
        <div class="detail-reply">
          <p>${data.reply}</p>
          <div class="detail-signature">${data.signature}</div>
        </div>
      </div>
      <div class="detail-actions">
        <button class="btn-secondary ${isFav ? 'fav-active' : ''}" id="favBtn">
          <svg viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>
          ${isFav ? '已收藏' : '收藏这封回信'}
        </button>
        <button class="btn-primary" id="replyBtn">
          <svg viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>
          回信给 TA
        </button>
      </div>
    `;

    document.getElementById('favBtn')?.addEventListener('click', () => toggleFavorite(idx));
    document.getElementById('replyBtn')?.addEventListener('click', () => openReplyModal(data));
  }

  // 初始渲染第一封
  if (lettersData[0]) renderLetterDetail(lettersData[0], 0);

  function updateBadge() {
    const unreadCount = document.querySelectorAll('.letter-card.unread').length;
    const badge = document.querySelector('.nav-item[data-view="inbox"] .nav-badge');
    if (badge) {
      if (unreadCount === 0) badge.style.display = 'none';
      else { badge.style.display = ''; badge.textContent = unreadCount; }
    }
  }

  /* ===== 筛选：全部 / 未读 / 已读 ===== */
  const inboxFilter = document.getElementById('inboxFilter');
  inboxFilter?.querySelectorAll('.pill').forEach(pill => {
    pill.addEventListener('click', () => {
      inboxFilter.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const filter = pill.dataset.filter;
      let visibleCount = 0;
      letterCards.forEach(card => {
        const isUnread = card.classList.contains('unread');
        let show = true;
        if (filter === 'unread') show = isUnread;
        else if (filter === 'read') show = !isUnread;
        card.style.display = show ? '' : 'none';
        if (show) visibleCount++;
      });
    });
  });

  /* ===== 收藏功能 ===== */
  function toggleFavorite(idx) {
    const btn = document.getElementById('favBtn');
    if (!btn) return;
    const data = lettersData[idx];
    if (favorites.has(idx)) {
      favorites.delete(idx);
      btn.classList.remove('fav-active');
      btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>收藏这封回信`;
      showToast('已取消收藏', false);
    } else {
      favorites.add(idx);
      btn.classList.add('fav-active');
      btn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>已收藏`;
      showToast('已加入收藏夹', true);
    }
    if (typeof renderFavorites === 'function') renderFavorites();
  }

  /* ===== 回信功能 ===== */
  const replyModal = document.getElementById('replyModal');
  const replyModalClose = document.getElementById('replyModalClose');
  const replyQuote = document.getElementById('replyQuote');
  const replyInput = document.getElementById('replyInput');
  const replyCount = document.getElementById('replyCount');
  const replySend = document.getElementById('replySend');

  function openReplyModal(data) {
    replyQuote.textContent = data.dream;
    replyInput.value = '';
    replyCount.textContent = '0 字';
    replyModal.classList.add('active');
    setTimeout(() => replyInput.focus(), 100);
  }

  function closeReplyModal() {
    replyModal.classList.remove('active');
    if (replyInput) replyInput.value = '';
    if (replyCount) replyCount.textContent = '0 字';
  }

  replyModalClose?.addEventListener('click', closeReplyModal);
  replyModal?.addEventListener('click', e => {
    if (e.target === replyModal) closeReplyModal();
  });

  replyInput?.addEventListener('input', () => {
    replyCount.textContent = replyInput.value.length + ' 字';
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && replyModal?.classList.contains('active')) closeReplyModal();
  });

  replySend?.addEventListener('click', () => {
    const text = replyInput.value.trim();
    if (!text) {
      replyInput.focus();
      return;
    }
    closeReplyModal();
    runSendAnimation({
      title: '正在寄出回信',
      desc: '你的话正在穿越梦境，送达 TA',
      finalTitle: '回信已寄出',
      finalDesc: 'TA 会在下次打开信箱时收到',
      onComplete: () => {
        showToast('回信已寄出', true);
        if (typeof appendToExchangeHistory === 'function') {
          appendToExchangeHistory({
            avatar: 'linear-gradient(135deg, #c97b5a, #e8b89c)',
            title: '你寄出 1 封回信',
            desc: '对方将在下次打开信箱时收到'
          });
        }
      }
    });
  });

  /* ===== Toast 提示 ===== */
  const toast = document.getElementById('toast');
  let toastTimer;
  function showToast(msg, success = true) {
    if (!toast) return;
    const icon = success
      ? '<svg viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      : '';
    toast.innerHTML = icon + '<span>' + msg + '</span>';
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
  }

  /* ===== 筛选标签（分类等其他分组保持通用切换） ===== */
  document.querySelectorAll('.category-tabs').forEach(group => {
    group.querySelectorAll('.cat-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        group.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
      });
    });
  });

  /* ===== 记梦：文字/语音切换 ===== */
  const modeBtns = document.querySelectorAll('.mode-btn');
  const voicePanel = document.getElementById('voicePanel');
  const composePaper = document.querySelector('.compose-paper');

  modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      modeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      if (btn.dataset.mode === 'voice') {
        voicePanel?.classList.add('active');
        if (composePaper) composePaper.style.display = 'none';
      } else {
        voicePanel?.classList.remove('active');
        if (composePaper) composePaper.style.display = '';
      }
    });
  });

  /* ===== 字数统计 ===== */
  const dreamInput = document.getElementById('dreamInput');
  const charCount = document.querySelector('.char-count');

  if (dreamInput && charCount) {
    dreamInput.addEventListener('input', () => {
      charCount.textContent = `${dreamInput.value.length} 字`;
    });
  }

  /* ===== 语音录制（模拟） ===== */
  const voiceRecord = document.getElementById('voiceRecord');
  const voiceStatus = document.querySelector('.voice-status');
  const voiceDuration = document.querySelector('.voice-duration');
  const voiceWaves = document.querySelector('.voice-waves');
  let recording = false;
  let recordTimer = null;
  let recordSecs = 0;

  if (voiceRecord) {
    voiceRecord.addEventListener('click', () => {
      if (!recording) {
        recording = true;
        voiceRecord.classList.add('recording');
        voiceWaves?.classList.add('active');
        voiceStatus.textContent = '正在录音... 再次点击结束';
        recordSecs = 0;
        recordTimer = setInterval(() => {
          recordSecs++;
          const m = Math.floor(recordSecs / 60);
          const s = recordSecs % 60;
          if (voiceDuration) voiceDuration.textContent = `${m}:${String(s).padStart(2,'0')}`;
        }, 1000);
      } else {
        recording = false;
        voiceRecord.classList.remove('recording');
        voiceWaves?.classList.remove('active');
        voiceStatus.textContent = '已识别 · 点击重新录制';
        clearInterval(recordTimer);

        if (dreamInput && !dreamInput.value.trim()) {
          dreamInput.value = '我梦见自己在一片深蓝色的海底行走，周围漂浮着发光的水母，它们一闪一闪地像在跟我说话。远处有一扇发光的门，我朝它走去，但怎么也走不到。';
          if (charCount) charCount.textContent = `${dreamInput.value.length} 字`;
          dreamInput.classList.remove('voice-flash');
          void dreamInput.offsetWidth;
          dreamInput.classList.add('voice-flash');
        }
      }
    });
  }

  /* ===== 情绪选择 ===== */
  const emotions = document.querySelectorAll('.emotion');
  emotions.forEach(emo => {
    emo.addEventListener('click', () => {
      emotions.forEach(e => e.classList.remove('selected'));
      emo.classList.add('selected');
    });
  });

  /* ===== 关键词标签 ===== */
  const tagField = document.getElementById('tagField');
  const tagInput = document.getElementById('tagInput');

  function addTag(text) {
    if (!text.trim()) return;
    const chip = document.createElement('span');
    chip.className = 'tag-chip';
    chip.innerHTML = `${text} <button class="tag-x">×</button>`;
    chip.querySelector('.tag-x').addEventListener('click', () => chip.remove());
    tagField.insertBefore(chip, tagInput);
  }

  if (tagInput) {
    tagInput.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        addTag(tagInput.value);
        tagInput.value = '';
      }
    });
  }

  document.querySelectorAll('.tag-x').forEach(btn => {
    btn.addEventListener('click', () => btn.closest('.tag-chip').remove());
  });

  /* ===== 投递梦境 ===== */
  const sendBtn = document.getElementById('sendDream');
  const sendModal = document.getElementById('sendModal');
  const steps = [
    document.getElementById('sendStep1'),
    document.getElementById('sendStep2'),
    document.getElementById('sendStep3')
  ];
  const sendTitle = document.querySelector('.send-title');
  const sendDesc = document.querySelector('.send-desc');

  if (sendBtn) {
    sendBtn.addEventListener('click', () => {
      if (dreamInput && !dreamInput.value.trim()) {
        dreamInput.style.borderColor = 'var(--clay)';
        dreamInput.style.boxShadow = '0 0 0 3px rgba(168,92,62,0.15)';
        dreamInput.placeholder = '先写下你的梦，再投递出去...';
        setTimeout(() => {
          dreamInput.style.borderColor = '';
          dreamInput.style.boxShadow = '';
          dreamInput.placeholder = '我梦见...';
        }, 2000);
        return;
      }

      sendModal.classList.add('active');
      runSendAnimation({
        onComplete: () => {
          switchView('exchange');
          if (dreamInput) dreamInput.value = '';
          if (charCount) charCount.textContent = '0 字';
          emotions.forEach(e => e.classList.remove('selected'));
          document.querySelectorAll('.tag-chip').forEach(t => t.remove());
          if (voiceStatus) voiceStatus.textContent = '点击开始录音';
          if (voiceDuration) voiceDuration.textContent = '0:00';
        }
      });
    });
  }

  function runSendAnimation(opts = {}) {
    const title = opts.title || '正在投递你的梦';
    const desc = opts.desc || 'AI 正在解析梦境，寻找共振的梦友';
    const finalTitle = opts.finalTitle || '已找到你的梦友';
    const finalDesc = opts.finalDesc || '梦境已寄出，等待回信中...';
    const onComplete = opts.onComplete;

    steps.forEach(s => s.classList.remove('active', 'done'));
    if (sendTitle) sendTitle.textContent = title;
    if (sendDesc) sendDesc.textContent = desc;

    setTimeout(() => steps[0]?.classList.add('active'), 200);
    setTimeout(() => {
      steps[0]?.classList.remove('active');
      steps[0]?.classList.add('done');
      steps[1]?.classList.add('active');
    }, 1400);
    setTimeout(() => {
      steps[1]?.classList.remove('active');
      steps[1]?.classList.add('done');
      steps[2]?.classList.add('active');
    }, 2600);
    setTimeout(() => {
      steps[2]?.classList.remove('active');
      steps[2]?.classList.add('done');
      if (sendTitle) sendTitle.textContent = finalTitle;
      if (sendDesc) sendDesc.textContent = finalDesc;
    }, 3800);
    setTimeout(() => {
      sendModal.classList.remove('active');
      if (onComplete) onComplete();
    }, 5200);
  }

  /* ===== 博物馆：梦境卡片详情 ===== */
  const dreamModal = document.getElementById('dreamModal');
  const dreamModalClose = document.getElementById('dreamModalClose');
  const dreamModalImg = document.getElementById('dreamModalImg');
  const dreamModalText = document.getElementById('dreamModalText');
  const dreamModalEmotion = document.getElementById('dreamModalEmotion');
  const dreamModalMeta = document.getElementById('dreamModalMeta');

  document.querySelectorAll('.dream-card').forEach(card => {
    card.addEventListener('click', () => {
      const img = card.querySelector('.dream-card-img');
      const emotion = card.querySelector('.dream-emotion');
      const text = card.querySelector('.dream-card-body p');
      const meta = card.querySelector('.dream-card-foot');

      if (img) dreamModalImg.style.backgroundImage = img.style.backgroundImage;
      if (emotion) {
        dreamModalEmotion.textContent = emotion.textContent;
        dreamModalEmotion.style.background = emotion.style.background;
      }
      if (text) dreamModalText.textContent = text.textContent;
      if (meta) {
        const spans = meta.querySelectorAll('span');
        dreamModalMeta.textContent = Array.from(spans).map(s => s.textContent).join(' ');
      }

      dreamModal.classList.add('active');
    });
  });

  if (dreamModalClose) {
    dreamModalClose.addEventListener('click', () => dreamModal.classList.remove('active'));
  }

  dreamModal?.addEventListener('click', e => {
    if (e.target === dreamModal) dreamModal.classList.remove('active');
  });

  /* ===== ESC 关闭模态框 ===== */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      sendModal?.classList.remove('active');
      dreamModal?.classList.remove('active');
    }
  });

  /* ===== 键盘快捷键切换视图（1-9, 0） ===== */
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (sendModal?.classList.contains('active')) return;
    if (dreamModal?.classList.contains('active')) return;
    if (replyModal?.classList.contains('active')) return;

    const keyMap = {
      '1': 'inbox',
      '2': 'drafts',
      '3': 'favorites',
      '4': 'compose',
      '5': 'calendar',
      '6': 'exchange',
      '7': 'penpals',
      '8': 'museum',
      '9': 'profile',
      '0': 'settings'
    };
    if (keyMap[e.key]) switchView(keyMap[e.key]);
  });

  /* ===== 梦境日历：生成日历网格 ===== */
  const calGrid = document.getElementById('calGrid');
  if (calGrid) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const today = now.getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // 模拟数据：本月有梦的日期 + 情绪
    const dreamDays = {
      1: 'emotion-sage',
      3: 'emotion-plum',
      5: 'emotion-ochre',
      7: 'emotion-ocean',
      9: 'emotion-clay',
      11: 'emotion-sage',
      13: 'emotion-plum',
      15: 'emotion-ochre',
      17: 'emotion-ocean',
      19: 'emotion-clay',
      21: 'emotion-sage',
      23: 'emotion-plum'
    };

    let html = '';
    // 前置空格
    for (let i = 0; i < firstDay; i++) {
      html += '<div class="cal-cell empty"></div>';
    }
    // 日期
    for (let d = 1; d <= daysInMonth; d++) {
      const classes = ['cal-cell'];
      if (dreamDays[d]) {
        classes.push('has-dream', dreamDays[d]);
      }
      if (d === today) classes.push('today');
      html += `<div class="${classes.join(' ')}">${d}</div>`;
    }
    calGrid.innerHTML = html;
  }

  /* ===== 设置：主题选择器交互 ===== */
  document.querySelectorAll('.theme-picker').forEach(picker => {
    picker.querySelectorAll('.theme-opt').forEach(opt => {
      opt.addEventListener('click', () => {
        picker.querySelectorAll('.theme-opt').forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
      });
    });
  });

  /* ===== 滚动渐入动画 ===== */
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll(
    '.letter-card, .match-card, .dream-card, .history-item, .archive-item, .chart-row, ' +
    '.draft-card, .fav-card, .penpal-card, .cal-stat, .rhythm-bar, .archive-card'
  ).forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(12px)';
    el.style.transition = 'opacity 0.4s var(--ease), transform 0.4s var(--ease)';
    observer.observe(el);
  });

  /* ===== 情绪图表条形动画 ===== */
  setTimeout(() => {
    document.querySelectorAll('.chart-fill').forEach(fill => {
      const width = fill.style.width;
      fill.style.width = '0';
      setTimeout(() => fill.style.width = width, 100);
    });
  }, 300);

  /* ===== 情绪节律条形动画 ===== */
  setTimeout(() => {
    document.querySelectorAll('.rhythm-bar').forEach((bar, i) => {
      const h = bar.style.height;
      bar.style.height = '0';
      setTimeout(() => bar.style.height = h, 80 + i * 30);
    });
  }, 300);

  /* ============================================================
     Bug 修复区
     ============================================================ */

  /* ===== 草稿数据 + 继续编辑加载 ===== */
  const drafts = [
    { id: 0, title: '关于水的梦', content: '我梦见自己在一片深蓝色的海底行走，周围漂浮着发光的水母，它们一闪一闪地像在跟我说话。远处有一扇发光的门，我朝它走去，但怎么也走不到。', tags: ['海', '水母', '行走'] },
    { id: 1, title: '未命名的梦', content: '一扇门一直在我面前打开又关上，但门后面什么都没有，只有光。我伸手去摸那道光，指尖却触碰到了冰冷的空气。', tags: ['门', '光'] },
    { id: 2, title: '关于奶奶的梦', content: '已故的奶奶在厨房做饭，她回头说：还早呢，再睡会儿。但厨房的灯是冷的，她的身影被拉得很长。', tags: ['童年', '奶奶'] }
  ];

  document.querySelectorAll('[data-draft-load]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.draftLoad, 10);
      const draft = drafts[id];
      if (!draft) return;
      const composeInput = document.getElementById('dreamInput');
      if (composeInput) {
        composeInput.value = draft.content;
        composeInput.focus();
        composeInput.setSelectionRange(draft.content.length, draft.content.length);
        const charCount = document.getElementById('charCount');
        if (charCount) charCount.textContent = `${draft.content.length} 字`;
      }
    });
  });

  /* ===== 收藏夹动态渲染（与 Inbox 的 favorites Set 同步） ===== */
  function renderFavorites() {
    const grid = document.getElementById('favGrid');
    const empty = document.getElementById('favEmpty');
    if (!grid) return;

    if (favorites.size === 0) {
      grid.innerHTML = '';
      if (empty) empty.hidden = false;
      return;
    }
    if (empty) empty.hidden = true;

    const sorted = Array.from(favorites).sort((a, b) => a - b);
    grid.innerHTML = sorted.map(idx => {
      const data = lettersData[idx];
      if (!data) return '';
      const excerpt = data.text.split('。').slice(0, 2).join('。') + '。';
      const fromLabel = data.from.replace('梦友 ', '');
      return `
        <article class="fav-card" data-letter="${idx}">
          <div class="fav-quote">"</div>
          <p class="fav-text">${excerpt}</p>
          <div class="fav-foot">
            <div class="fav-avatar img-avatar" style="background-image: url('${data.avatar}')"></div>
            <div>
              <div class="fav-from">梦友 ${fromLabel} 的回信</div>
              <div class="fav-date">收藏于 ${data.time}</div>
            </div>
          </div>
        </article>`;
    }).join('');

    // 点击收藏卡 → 跳到 Inbox 并选中
    grid.querySelectorAll('.fav-card').forEach(card => {
      card.addEventListener('click', () => {
        const idx = parseInt(card.dataset.letter, 10);
        switchView('inbox');
        const target = document.querySelector(`.letter-card[data-letter="${idx}"]`);
        if (target) target.click();
      });
    });
  }

  // 预填两封默认收藏，演示效果
  favorites.add(0);
  favorites.add(3);
  renderFavorites();

  /* ===== 寄出回信后：追加到 exchange 历史 ===== */
  function appendToExchangeHistory(meta) {
    const list = document.querySelector('.history-list');
    if (!list) return;
    const item = document.createElement('div');
    item.className = 'history-item';
    item.style.opacity = '0';
    item.style.transform = 'translateY(8px)';
    item.innerHTML = `
      <div class="history-avatar" style="background-image: ${meta.avatar}"></div>
      <div class="history-body">
        <div class="history-top">
          <span class="history-name">${meta.title}</span>
          <span class="history-date">刚刚</span>
        </div>
        <p class="history-dream">${meta.desc}</p>
      </div>
    `;
    list.prepend(item);
    requestAnimationFrame(() => {
      item.style.transition = 'opacity 0.4s, transform 0.4s';
      item.style.opacity = '1';
      item.style.transform = 'translateY(0)';
    });
  }

  // 在回信寄出动画完成时，调用（已通过 replySend 的 onComplete 直接调用）

  /* ===== 博物馆"回应这个梦"按钮 ===== */
  const dreamRespondBtn = document.getElementById('dreamRespondBtn');
  if (dreamRespondBtn) {
    dreamRespondBtn.addEventListener('click', () => {
      const text = document.getElementById('dreamModalText')?.textContent || '';
      const emotion = document.getElementById('dreamModalEmotion')?.textContent || '';
      // 关闭博物馆弹窗
      if (dreamModal) dreamModal.classList.remove('active');
      // 跳到 compose 并预填梦境文本
      switchView('compose');
      const dreamInput = document.getElementById('dreamInput');
      if (dreamInput) {
        const tag = emotion ? `【${emotion}】` : '';
        dreamInput.value = `${tag} ${text}`.trim();
        const charCount = document.getElementById('charCount');
        if (charCount) charCount.textContent = `${dreamInput.value.length} 字`;
        dreamInput.focus();
      }
      showToast('梦境已带入编辑器，可写下你的回应', true);
    });
  }

  /* ===== 用户菜单（...）===== */
  const userSettings = document.querySelector('.user-settings');
  if (userSettings) {
    userSettings.addEventListener('click', e => {
      e.stopPropagation();
      const existing = document.querySelector('.user-menu-popover');
      if (existing) { existing.remove(); return; }
      const pop = document.createElement('div');
      pop.className = 'user-menu-popover';
      pop.innerHTML = `
        <button data-goto="profile"><svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.6"/><path d="M19 21v-1a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>我的梦境</button>
        <button data-goto="settings"><svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.6"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>设置</button>
        <button class="danger" data-action="logout"><svg viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>退出登录</button>
      `;
      document.body.appendChild(pop);

      // 定位
      const rect = userSettings.getBoundingClientRect();
      pop.style.position = 'fixed';
      pop.style.bottom = `${window.innerHeight - rect.top + 6}px`;
      pop.style.left = `${rect.left - 200}px`;

      // 点击选项
      pop.querySelectorAll('button').forEach(b => {
        b.addEventListener('click', () => {
          const goto = b.dataset.goto;
          const action = b.dataset.action;
          pop.remove();
          if (goto) {
            if (goto === 'profile' || goto === 'settings') {
              const navItem = document.querySelector(`.nav-item[data-view="${goto}"]`);
              if (navItem) navItem.click();
            }
          } else if (action === 'logout') {
            showToast('已退出（演示）', false);
          }
        });
      });

      // 外部点击关闭
      setTimeout(() => {
        document.addEventListener('click', function close() {
          pop.remove();
          document.removeEventListener('click', close);
        }, { once: true });
      }, 0);
    });
  }

  /* ===== 我的梦境 → 导出 ===== */
  const exportBtn = document.getElementById('exportBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const data = {
        name: '匿名 #1024',
        joined: '第 47 天',
        dreams: lettersData.map(l => ({ from: l.from, text: l.text, time: l.time })),
        exportedAt: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `梦邮局档案-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showToast('梦境档案已导出', true);
    });
  }

  /* ===== 梦友卡片"查看回信" ===== */
  document.querySelectorAll('.penpal-card').forEach(card => {
    const btn = card.querySelector('.btn-secondary');
    if (!btn) return;
    btn.addEventListener('click', e => {
      e.stopPropagation();
      switchView('inbox');
    });
  });

  /* ===== 日历翻页 ===== */
  const calMonthLabel = document.getElementById('calMonthLabel');
  const calPrev = document.getElementById('calPrev');
  const calNext = document.getElementById('calNext');
  const _months = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  let calYear = 2026, calMonth = 6; // 6 月（0 索引），即 7 月
  function updateCalLabel() {
    if (calMonthLabel) calMonthLabel.textContent = `${calYear} 年 ${calMonth} 月`;
  }
  if (calPrev) {
    calPrev.addEventListener('click', () => {
      calMonth--;
      if (calMonth < 1) { calMonth = 12; calYear--; }
      updateCalLabel();
      showToast(`已切换到 ${calYear} 年 ${calMonth} 月`, false);
    });
  }
  if (calNext) {
    calNext.addEventListener('click', () => {
      calMonth++;
      if (calMonth > 12) { calMonth = 1; calYear++; }
      updateCalLabel();
      showToast(`已切换到 ${calYear} 年 ${calMonth} 月`, false);
    });
  }

  /* ===== 搜索过滤 ===== */
  function setupSearch(inputId, itemSelector, textSelector) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      const items = document.querySelectorAll(itemSelector);
      let visible = 0;
      items.forEach(item => {
        const text = (textSelector ? item.querySelector(textSelector)?.textContent : item.textContent) || '';
        const match = !q || text.toLowerCase().includes(q);
        item.style.display = match ? '' : 'none';
        if (match) visible++;
      });
      // 空状态
      const view = input.closest('.view');
      if (!view) return;
      let emptyHint = view.querySelector('.search-empty');
      if (visible === 0 && q) {
        if (!emptyHint) {
          emptyHint = document.createElement('div');
          emptyHint.className = 'search-empty empty-state';
          emptyHint.innerHTML = `<div class="empty-illus"><svg viewBox="0 0 64 64" fill="none"><circle cx="28" cy="28" r="18" stroke="currentColor" stroke-width="1.4"/><path d="M42 42l12 12" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></div><h3 class="empty-title">没有匹配的结果</h3><p class="empty-desc">没有找到与 "<span class="search-q"></span>" 相关的内容</p>`;
          view.querySelector('.view-body').appendChild(emptyHint);
        }
        emptyHint.querySelector('.search-q').textContent = q;
        emptyHint.hidden = false;
      } else if (emptyHint) {
        emptyHint.hidden = true;
      }
    });
  }
  setupSearch('inboxSearch', '#view-inbox .letter-card', '.letter-head, .letter-preview');
  setupSearch('penpalSearch', '#view-penpals .penpal-card', '.penpal-name, .penpal-freq');
  setupSearch('museumSearch', '#view-museum .dream-card', '.dream-card-body p, .dream-emotion');

  /* ===== 设置：主题 / 字号切换 ===== */
  document.querySelectorAll('[data-picker]').forEach(group => {
    const kind = group.dataset.picker;
    group.querySelectorAll('.theme-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        group.querySelectorAll('.theme-opt').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const val = btn.dataset.value;

        if (kind === 'theme') {
          document.documentElement.setAttribute('data-theme', val === 'auto' ? '' : val);
          try { localStorage.setItem('mp:theme', val); } catch (e) {}
        } else if (kind === 'size') {
          const map = { small: '14px', medium: '15px', large: '16.5px' };
          document.documentElement.style.setProperty('--font-size-base', map[val] || '15px');
          try { localStorage.setItem('mp:size', val); } catch (e) {}
        }
      });
    });
  });

  // 恢复主题/字号
  try {
    const savedTheme = localStorage.getItem('mp:theme');
    if (savedTheme && savedTheme !== 'auto') {
      document.documentElement.setAttribute('data-theme', savedTheme);
      const themeBtn = document.querySelector(`[data-picker="theme"] [data-value="${savedTheme}"]`);
      if (themeBtn) {
        document.querySelectorAll('[data-picker="theme"] .theme-opt').forEach(b => b.classList.remove('active'));
        themeBtn.classList.add('active');
      }
    }
    const savedSize = localStorage.getItem('mp:size');
    if (savedSize) {
      const map = { small: '14px', medium: '15px', large: '16.5px' };
      document.documentElement.style.setProperty('--font-size-base', map[savedSize] || '15px');
      const sizeBtn = document.querySelector(`[data-picker="size"] [data-value="${savedSize}"]`);
      if (sizeBtn) {
        document.querySelectorAll('[data-picker="size"] .theme-opt').forEach(b => b.classList.remove('active'));
        sizeBtn.classList.add('active');
      }
    }
  } catch (e) {}

  /* ===== 设置：开关（通知/隐私）持久化 ===== */
  document.querySelectorAll('.switch input[type="checkbox"]').forEach(sw => {
    const key = `mp:sw:${sw.id || sw.name || Math.random().toString(36).slice(2)}`;
    try {
      const saved = localStorage.getItem(key);
      if (saved !== null) sw.checked = saved === '1';
    } catch (e) {}
    sw.addEventListener('change', () => {
      try { localStorage.setItem(key, sw.checked ? '1' : '0'); } catch (e) {}
      showToast(sw.checked ? '已开启' : '已关闭', sw.checked);
    });
  });

  /* ===== 暗色主题 CSS ===== */
  // 通过 data-theme="dark" 切换
  const darkStyles = document.createElement('style');
  darkStyles.textContent = `
    [data-theme="dark"] {
      --bg-canvas: #1a1a1f;
      --bg-elevated: #232329;
      --bg-card: #2a2a31;
      --bg-hover: #34343c;
      --bg-input: #1f1f24;
      --text-primary: #f0f0f3;
      --text-secondary: #b8b8c0;
      --text-tertiary: #888893;
      --text-quaternary: #5a5a64;
      --border-color: #34343c;
    }
    [data-theme="dark"] body { background: #14141a; }
    [data-theme="dark"] .topbar { background: rgba(26, 26, 31, 0.7); }
  `;
  document.head.appendChild(darkStyles);

})();
