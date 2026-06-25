/* ============================================================
   邻声 NeighborLink AI — 原型 Demo 共享交互
   ============================================================ */

// -------- 1. 子导航切换（tab） --------
function initSubnav() {
  document.querySelectorAll('[data-subnav]').forEach(nav => {
    const items = nav.querySelectorAll('.subnav-item');
    const target = nav.dataset.subnav; // 选择器，对应一组 .tab-pane 的父容器
    items.forEach(item => {
      item.addEventListener('click', () => {
        items.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        const key = item.dataset.target;
        const root = document.querySelector(target);
        if (!root) return;
        root.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        const pane = root.querySelector(`.tab-pane[data-key="${key}"]`);
        if (pane) pane.classList.add('active');
      });
    });
  });
}

// -------- 2. 模拟订单/服务状态推进 --------
function simulateProgress(timelineEl, totalMs = 12000) {
  const items = timelineEl.querySelectorAll('.timeline-item');
  if (!items.length) return;
  const stepMs = totalMs / items.length;
  let i = 0;
  items[0].classList.add('current');
  const t = setInterval(() => {
    items[i].classList.remove('current');
    items[i].classList.add('done');
    i++;
    if (i >= items.length) { clearInterval(t); return; }
    items[i].classList.add('current');
  }, stepMs);
}

// -------- 3. 6 维匹配分数动画 --------
function animateMatchBars(card) {
  card.querySelectorAll('.match-row .bar .fill').forEach(bar => {
    const w = bar.dataset.width || '0%';
    bar.style.width = '0%';
    setTimeout(() => { bar.style.width = w; }, 100);
  });
}

// -------- 4. 紧急链路时序展开 --------
function playEmergencySequence(container) {
  const steps = container.querySelectorAll('.emerg-step');
  steps.forEach(s => s.classList.remove('active', 'done'));
  let i = 0;
  const tick = () => {
    if (i > 0) steps[i - 1].classList.replace('active', 'done');
    if (i >= steps.length) return;
    steps[i].classList.add('active');
    i++;
    setTimeout(tick, 1100);
  };
  tick();
}

// -------- 5. 数字计数动画 --------
function animateCount(el, to, duration = 1200) {
  const from = 0;
  const start = performance.now();
  const step = (now) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    const v = from + (to - from) * eased;
    el.textContent = Number.isInteger(to) ? Math.round(v).toLocaleString() : v.toFixed(1);
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function initCounters() {
  document.querySelectorAll('[data-count]').forEach(el => {
    const v = parseFloat(el.dataset.count);
    animateCount(el, v, 1500);
  });
}

// -------- 6. 智能音箱语音打字效果 --------
function playSpeakerTranscript(container) {
  const text = container.dataset.text || '';
  const target = container.querySelector('.voice-text');
  if (!target) return;
  target.textContent = '';
  let i = 0;
  const t = setInterval(() => {
    target.textContent += text[i] || '';
    i++;
    if (i > text.length) clearInterval(t);
  }, 80);
}

// -------- 7. 5 步下单 stepper --------
function initStepper(container) {
  const steps = container.querySelectorAll('.step-progress .step');
  let cur = parseInt(container.dataset.current || '0');
  const render = () => {
    steps.forEach((s, i) => {
      s.classList.toggle('done', i < cur);
      s.classList.toggle('current', i === cur);
    });
    container.dataset.current = cur;
    // 切换步骤内容
    const panes = document.querySelectorAll('.stepper-pane');
    panes.forEach((p, i) => p.classList.toggle('active', i === cur));
  };
  container.querySelectorAll('[data-step]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = parseInt(btn.dataset.step);
      if (target >= 0 && target < steps.length) {
        cur = target;
        render();
      }
    });
  });
  render();
}

// -------- 8. 价格日历选择 --------
function initPriceTabs() {
  document.querySelectorAll('[data-price-tabs]').forEach(grp => {
    const items = grp.querySelectorAll('.price-tab');
    items.forEach(item => {
      item.addEventListener('click', () => {
        items.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
      });
    });
  });
}

// -------- 9. 数据驾驶舱：通用条形图动画 --------
function initAnimateBars() {
  document.querySelectorAll('[data-animate-bars]').forEach(group => {
    group.querySelectorAll('.bar-fill, .fill').forEach((bar, idx) => {
      const w = bar.dataset.width || '0%';
      bar.style.width = '0%';
      setTimeout(() => { bar.style.width = w; }, 100 + idx * 60);
    });
  });
}

// -------- 10. 演示场景：故事播放器 --------
const storyScripts = {
  1: { total: 10, color: 'ink' },
  2: { total: 10, color: 'alert' },
  3: { total: 9, color: 'gold' }
};

function resetStory(id) {
  const msgs = document.querySelectorAll(`[data-story-msgs="${id}"] .scene-msg`);
  msgs.forEach(m => m.classList.remove('show'));
  const result = document.querySelector(`[data-result="${id}"]`);
  if (result) result.classList.remove('show');
  const progress = document.querySelector(`[data-progress="${id}"]`);
  if (progress) progress.style.width = '0%';
}

function playStory(id) {
  resetStory(id);
  const meta = storyScripts[id];
  if (!meta) return;
  const msgs = document.querySelectorAll(`[data-story-msgs="${id}"] .scene-msg`);
  const progress = document.querySelector(`[data-progress="${id}"]`);
  const result = document.querySelector(`[data-result="${id}"]`);
  const stepMs = 900;
  msgs.forEach((msg, idx) => {
    setTimeout(() => {
      msg.classList.add('show');
      if (progress) progress.style.width = ((idx + 1) / meta.total * 100) + '%';
      if (idx === msgs.length - 1 && result) {
        setTimeout(() => result.classList.add('show'), 500);
      }
    }, 300 + idx * stepMs);
  });
}

function initStoryPlayers() {
  document.querySelectorAll('[data-play-story]').forEach(btn => {
    btn.addEventListener('click', () => playStory(parseInt(btn.dataset.playStory)));
  });
  document.querySelectorAll('[data-reset-story]').forEach(btn => {
    btn.addEventListener('click', () => resetStory(parseInt(btn.dataset.resetStory)));
  });
}

// -------- 11. 智能音箱：场景脚本切换 --------
const speakerScripts = {
  medical: {
    user: '小邻小邻，我明天要去医院拿药，腿脚不方便...',
    reply: '已识别您需要：陪诊（拿药）· 普通需求'
  },
  urgent: {
    user: '小邻小邻，我突然头晕得厉害...',
    reply: '已识别您需要：紧急救助 · 5 秒内为您拨打 120'
  },
  lonely: {
    user: '小邻小邻...今天家里就我一个人，心里闷得慌',
    reply: '我陪您聊聊天吧。要不要让志愿者来陪您说说？'
  }
};

function initSpeakerDemo() {
  const wrap = document.querySelector('[data-speaker-demo]');
  if (!wrap) return;
  const lineEl = wrap.querySelector('[data-speaker-line]');
  const replyEl = wrap.querySelector('[data-speaker-reply]');
  const circle = wrap.querySelector('[data-speaker-circle]');
  wrap.querySelectorAll('[data-speaker-script]').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.speakerScript;
      const s = speakerScripts[key];
      if (!s) return;
      // 切换为"听"状态
      circle.classList.add('listening');
      // 清空并打字
      lineEl.textContent = '';
      replyEl.textContent = '';
      let i = 0;
      const t1 = setInterval(() => {
        lineEl.textContent += s.user[i] || '';
        i++;
        if (i > s.user.length) { clearInterval(t1);
          // 用户说完，AI 思考 + 回复
          setTimeout(() => {
            circle.classList.remove('listening');
            let j = 0;
            const t2 = setInterval(() => {
              replyEl.textContent += s.reply[j] || '';
              j++;
              if (j > s.reply.length) clearInterval(t2);
            }, 50);
          }, 600);
        }
      }, 70);
    });
  });
}

// -------- 12. SOS 倒计时按钮 --------
function initSosButton() {
  const btn = document.querySelector('[data-sos-button]');
  const counter = document.querySelector('[data-sos-counter]');
  const status = document.querySelector('[data-sos-status] .num-text');
  if (!btn || !counter) return;
  let timer = null, count = 3;
  const start = (e) => {
    e.preventDefault();
    count = 3;
    counter.textContent = count;
    if (status) status.textContent = '长按中...松手取消';
    btn.classList.add('pressed');
    timer = setInterval(() => {
      count--;
      counter.textContent = Math.max(count, 0);
      if (count <= 0) {
        clearInterval(timer);
        if (status) status.textContent = '✓ 已触发 · 正在拨 120';
        counter.style.color = 'var(--green)';
      }
    }, 1000);
  };
  const cancel = () => {
    if (timer) { clearInterval(timer); timer = null; }
    btn.classList.remove('pressed');
    count = 3;
    counter.textContent = count;
    counter.style.color = '';
    if (status) status.textContent = '长按 3 秒触发紧急求助';
  };
  btn.addEventListener('mousedown', start);
  btn.addEventListener('touchstart', start, { passive: false });
  btn.addEventListener('mouseup', cancel);
  btn.addEventListener('mouseleave', cancel);
  btn.addEventListener('touchend', cancel);
}

// -------- 13. 接单倒计时 --------
function initCountdown() {
  document.querySelectorAll('[data-countdown]').forEach(el => {
    let sec = parseInt(el.dataset.countdown);
    el.textContent = sec;
    const t = setInterval(() => {
      sec--;
      if (sec < 0) { clearInterval(t); el.textContent = '0'; return; }
      el.textContent = sec;
      if (sec < 30) el.style.color = 'var(--alert)';
    }, 1000);
  });
}

// -------- 14. 信用分条动画 --------
function initCreditBar() {
  document.querySelectorAll('[data-credit-width]').forEach(bar => {
    const w = bar.dataset.creditWidth;
    bar.style.width = '0%';
    setTimeout(() => { bar.style.width = w; }, 200);
  });
}

// -------- 15a. 移动端汉堡菜单 --------
function initHamburger() {
  const btn = document.querySelector('.hamburger');
  const menu = document.querySelector('.mobile-menu');
  if (!btn || !menu) return;
  btn.addEventListener('click', () => {
    btn.classList.toggle('open');
    menu.classList.toggle('open');
    document.body.style.overflow = menu.classList.contains('open') ? 'hidden' : '';
  });
  // 点击菜单项后关闭
  menu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      btn.classList.remove('open');
      menu.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}

// -------- 15b. URL Hash 自动激活 Tab（跨页面锚点跳转） --------
//
// 用法：访问 邻声-原型-子女端.html#order 即自动切换到"下单"tab
//       访问 邻声-原型-演示场景.html#story2 即自动播放"跌倒救命"故事
//
function initHashTabs() {
  const hash = window.location.hash.replace('#', '');
  if (!hash) return;
  // 1. 找到匹配 data-target 的子导航并点击
  const navItem = document.querySelector(`[data-target="${hash}"]`);
  if (navItem) {
    navItem.click();
    // 滚动到内容区
    setTimeout(() => {
      navItem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);
    return;
  }
  // 2. 找到匹配 data-play-story 的按钮并自动播放
  const playBtn = document.querySelector(`[data-play-story="${hash.replace('story','')}"]`);
  if (playBtn) {
    // 先切换到对应故事 tab
    const storyTab = document.querySelector(`[data-target="${hash}"]`);
    if (storyTab) storyTab.click();
    setTimeout(() => playStory(parseInt(hash.replace('story',''))), 600);
  }
}

// -------- 15c. 首次访问提示条 --------
function initProtoHint() {
  const hint = document.querySelector('.proto-hint');
  if (!hint) return;
  // 同一会话只显示一次
  if (sessionStorage.getItem('proto-hint-shown')) {
    hint.remove();
    return;
  }
  sessionStorage.setItem('proto-hint-shown', '1');
  const close = hint.querySelector('.close');
  if (close) {
    close.addEventListener('click', (e) => {
      e.stopPropagation();
      hint.classList.add('hidden');
      setTimeout(() => hint.remove(), 300);
    });
  }
}

// -------- 15. 初始化 --------
document.addEventListener('DOMContentLoaded', () => {
  initSubnav();
  initCounters();
  initPriceTabs();
  initAnimateBars();
  initStoryPlayers();
  initSpeakerDemo();
  initSosButton();
  initCountdown();
  initCreditBar();
  initHamburger();
  initHashTabs();
  initProtoHint();
  document.querySelectorAll('[data-stepper]').forEach(initStepper);

  // 匹配分数入场动画
  document.querySelectorAll('.match-card, [data-animate-bars] .vol-card').forEach((card, idx) => {
    setTimeout(() => animateMatchBars(card), 200 + idx * 150);
  });

  // 紧急链路自动播放
  document.querySelectorAll('[data-emergency]').forEach(el => {
    setTimeout(() => playEmergencySequence(el), 600);
  });

  // 时间线自动推进
  document.querySelectorAll('[data-timeline]').forEach((el, idx) => {
    setTimeout(() => simulateProgress(el, 8000), 800 + idx * 500);
  });

  // 智能音箱打字
  document.querySelectorAll('[data-voice]').forEach(el => {
    setTimeout(() => playSpeakerTranscript(el), 400);
  });

  // 切换 subnav 时强制重新计算动画
  document.querySelectorAll('.subnav-item').forEach(item => {
    item.addEventListener('click', () => {
      const key = item.dataset.target;
      setTimeout(() => {
        const pane = document.querySelector(`.tab-pane[data-key="${key}"]`);
        if (!pane) return;
        pane.querySelectorAll('.match-card, .vol-card').forEach((card, idx) => {
          setTimeout(() => animateMatchBars(card), 100 + idx * 100);
        });
        pane.querySelectorAll('[data-animate-bars]').forEach(g => {
          g.querySelectorAll('.bar-fill, .fill').forEach((bar, idx) => {
            const w = bar.dataset.width || '0%';
            bar.style.width = '0%';
            setTimeout(() => { bar.style.width = w; }, 100 + idx * 50);
          });
        });
        const tl = pane.querySelector('[data-timeline]');
        if (tl) simulateProgress(tl, 8000);
        const em = pane.querySelector('[data-emergency]');
        if (em) playEmergencySequence(em);
        const vc = pane.querySelector('[data-voice]');
        if (vc) playSpeakerTranscript(vc);
        const cd = pane.querySelector('[data-countdown]');
        if (cd) { let s = parseInt(cd.dataset.countdown); cd.textContent = s; }
      }, 200);
    });
  });
});
