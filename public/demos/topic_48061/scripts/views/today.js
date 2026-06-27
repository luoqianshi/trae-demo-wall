/**
 * views/today.js · 今日回血 Tab
 * 状态选择 → 抽卡 → 翻牌 → 倒计时 → 完成
 */
import { state, saveState, bumpStreakIfFirstToday } from '../state.js';
import { drawCards } from '../draw.js';
import { CARD_POOL, RARITY_LABEL, TAG_LABEL, TAG_EMOJI, getCardById } from '../../data/cards.js';
import { animateHp, popHpDelta, confetti, toast } from '../ui.js';
import { syncTopMeta } from '../router.js';
import { $, $$, el, clamp, fmtMmSs, HP_MAX } from '../utils.js';

const TAG_ORDER = ['sit', 'eye', 'neck', 'back', 'meeting', 'stress', 'relax', 'mood', 'sleepy', 'brain', 'hungry'];

const cardTimers = new Map(); // cardEl → interval id

export function mountToday() {
  renderMoodChips();
  renderCardsArea();
  bindDrawBtn();
  syncTopMeta();
  animateHp(state.today.hpToday || 0, true);
  refreshHint();
}

/* ----- 状态选择 ----- */
function renderMoodChips() {
  const host = $('#moodChips');
  if (!host) return;
  host.innerHTML = '';
  TAG_ORDER.forEach(tag => {
    const on = state.today.moods.includes(tag);
    const chip = el('button', {
      class: `chip ${on ? 'is-on' : ''}`,
      dataset: { tag },
      'aria-pressed': String(on),
      onClick: () => toggleMood(tag, chip),
    }, [
      el('span', { class: 'chip-emoji' }, TAG_EMOJI[tag] || ''),
      `${TAG_LABEL[tag]}`,
    ]);
    host.appendChild(chip);
  });
}

function toggleMood(tag, chip) {
  const i = state.today.moods.indexOf(tag);
  if (i >= 0) state.today.moods.splice(i, 1);
  else state.today.moods.push(tag);
  chip.classList.toggle('is-on');
  chip.setAttribute('aria-pressed', String(state.today.moods.includes(tag)));
  saveState(state);
  refreshHint();
}

/* ----- 抽卡 ----- */
function bindDrawBtn() {
  const btn = $('#drawBtn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const status = batchStatus();
    if (status === 'active') {
      toast('当前批次还没完成，先做完手上的卡牌吧～');
      return;
    }
    doDraw();
  });
}

/** 当前批次状态：empty(无卡) / active(有未完成) / cleared(都完成) */
function batchStatus() {
  const c = state.today.cards;
  if (!c || c.length === 0) return 'empty';
  if (c.some(x => !x.done)) return 'active';
  return 'cleared';
}

function doDraw() {
  // 清空旧批次
  const moods = state.today.moods.slice();
  const picked = drawCards(moods);
  state.today.cards = picked.map(c => ({ id: c.id, done: false }));
  state.today.drawn = (state.today.drawn || 0) + picked.length;
  state.today.round = (state.today.round || 0) + 1;
  // 图鉴解锁次数 +1
  picked.forEach(c => {
    state.library[c.id] = (state.library[c.id] || 0) + 1;
  });
  bumpStreakIfFirstToday();
  saveState(state);
  syncTopMeta();
  renderCardsArea({ animate: true });
  refreshHint();
}

function refreshHint() {
  const hint = $('#drawHint');
  const btn = $('#drawBtn');
  if (!hint || !btn) return;
  const status = batchStatus();
  const moodCount = state.today.moods.length;
  const nextRound = (state.today.round || 0) + 1;
  if (status === 'empty') {
    btn.textContent = '开始抽卡 →';
    btn.disabled = false;
    hint.textContent = moodCount
      ? `已选 ${moodCount} 个状态，将按状态加权抽取`
      : '不选状态也可以，会从全卡池随机抽 3 张';
  } else if (status === 'active') {
    btn.textContent = '先完成手上的卡';
    btn.disabled = true;
    hint.textContent = '完成本批 3 张卡后即可抽下一轮';
  } else { // cleared
    btn.textContent = `🎲 抽第 ${nextRound} 轮`;
    btn.disabled = false;
    hint.textContent = '完美！再抽一轮继续累计 HP';
  }
}

/* ----- 卡牌区域 ----- */
function renderCardsArea(opts = {}) {
  const panel = $('#cardsPanel');
  const grid = $('#cardGrid');
  if (!panel || !grid) return;
  const cards = state.today.cards;
  if (!cards || cards.length === 0) {
    panel.classList.add('hide');
    return;
  }
  panel.classList.remove('hide');
  grid.innerHTML = '';
  cards.forEach((entry, idx) => {
    const card = getCardById(entry.id);
    if (!card) return;
    const node = renderCard(card, entry, idx, !!opts.animate);
    grid.appendChild(node);
  });
  updateProgress();
  bindActionRow();
}

function renderCard(card, entry, idx, animate) {
  const rar = card.rarity;
  const cardEl = el('div', {
    class: `card ${entry.done ? 'is-flipped is-done' : ''}`,
    dataset: { id: card.id, idx: String(idx) },
    role: 'button',
    tabIndex: '0',
    'aria-label': `${card.name}（${RARITY_LABEL[rar]}）`,
  });
  if (animate) cardEl.style.animationDelay = `${idx * 150}ms`;

  const back = el('div', { class: 'card-face card-back' }, [
    el('div', { class: 'glyph' }, '⊕'),
    el('div', { class: 'tip' }, 'HEAL · CLICK TO FLIP'),
  ]);

  const tagRow = el('div', { class: 'tag-row' }, card.tags.slice(0, 3).map(t =>
    el('span', { class: 'tag' }, TAG_LABEL[t] || t)
  ));

  const front = el('div', { class: `card-face card-front rar-front-${rar}` }, [
    el('div', { class: 'card-top' }, [
      el('span', { class: `rar rar-${rar}` }, RARITY_LABEL[rar]),
      card.hourRange ? el('span', { class: 'hour-tag' }, '⏰ 饭点') : null,
      el('span', { class: 'card-hp' }, `+${card.hp} HP`),
    ]),
    el('div', { class: 'card-emoji' }, card.emoji),
    el('div', { class: 'card-name' }, card.name),
    el('div', { class: 'card-desc' }, card.desc),
    tagRow,
    el('div', { class: 'card-bottom' }, [
      buildTimer(card.dur),
      el('button', { class: 'card-done-btn', onClick: (e) => { e.stopPropagation(); completeCard(card, entry, cardEl); } },
        entry.done ? '✅ 已完成' : '我做完了'),
    ]),
  ]);

  cardEl.appendChild(el('div', { class: 'card-inner' }, [back, front]));

  // 翻牌交互
  cardEl.addEventListener('click', (e) => {
    if (e.target.closest('.card-done-btn')) return;
    flipCard(cardEl, card);
  });
  cardEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flipCard(cardEl, card); }
  });

  return cardEl;
}

function buildTimer(dur) {
  const R = 22;
  const C = 2 * Math.PI * R;
  const svg = `<svg width="48" height="48" viewBox="0 0 48 48">
    <circle class="timer-track" cx="24" cy="24" r="${R}"></circle>
    <circle class="timer-fill" cx="24" cy="24" r="${R}" stroke-dasharray="${C.toFixed(2)}" stroke-dashoffset="0"></circle>
  </svg>`;
  const wrap = el('div', { class: 'card-timer', dataset: { dur: String(dur), c: C.toFixed(2) } });
  wrap.innerHTML = svg + `<div class="timer-text">${fmtMmSs(dur)}</div>`;
  return wrap;
}

function flipCard(cardEl, card) {
  const wasFlipped = cardEl.classList.contains('is-flipped');
  cardEl.classList.toggle('is-flipped');
  if (!wasFlipped && !cardTimers.has(cardEl) && !cardEl.classList.contains('is-done')) {
    startTimer(cardEl, card);
  }
}

function startTimer(cardEl, card) {
  const timerWrap = cardEl.querySelector('.card-timer');
  const fill = timerWrap?.querySelector('.timer-fill');
  const text = timerWrap?.querySelector('.timer-text');
  const btn = cardEl.querySelector('.card-done-btn');
  if (!timerWrap || !fill || !text) return;
  const dur = parseFloat(timerWrap.dataset.dur);
  const C = parseFloat(timerWrap.dataset.c);
  let left = dur;
  const tick = () => {
    left -= 1;
    if (left <= 0) {
      fill.style.strokeDashoffset = String(-C);
      text.textContent = 'OK';
      if (btn && !btn.disabled) btn.textContent = '✅ 完成回血';
      stopTimer(cardEl);
      return;
    }
    const ratio = 1 - (left / dur);
    fill.style.strokeDashoffset = String(-C * ratio);
    text.textContent = fmtMmSs(left);
  };
  cardTimers.set(cardEl, setInterval(tick, 1000));
}
function stopTimer(cardEl) {
  const id = cardTimers.get(cardEl);
  if (id) { clearInterval(id); cardTimers.delete(cardEl); }
}

function completeCard(card, entry, cardEl) {
  if (entry.done) return;
  entry.done = true;
  stopTimer(cardEl);

  // HP 累加（封顶今日 100，但总数不封顶）
  const before = state.today.hpToday || 0;
  state.today.hpToday = clamp(before + card.hp, 0, HP_MAX);
  state.hpTotal = (state.hpTotal || 0) + card.hp;

  // 历史事件
  state.history.push({
    date: state.today.date,
    ts: Date.now(),
    id: card.id,
    hp: card.hp,
    rarity: card.rarity,
  });

  saveState(state);

  // 视觉反馈
  cardEl.classList.add('is-done', 'is-flipped');
  const btn = cardEl.querySelector('.card-done-btn');
  if (btn) { btn.textContent = '✅ 已完成'; btn.disabled = true; }

  animateHp(state.today.hpToday);
  popHpDelta(card.hp, $('.hp-panel'));
  syncTopMeta();
  updateProgress();
  refreshHint();

  if (state.today.cards.every(c => c.done)) {
    maybeShowAllDone();
  }
}

/* ----- 进度概览段 + 行动段 ----- */
function updateProgress() {
  const cards = state.today.cards || [];
  const total = cards.length;
  const done = cards.filter(c => c.done).length;
  const pct = total ? Math.round(done / total * 100) : 0;
  const $badge = $('#todayProgressBadge');
  const $fill = $('#todayProgressFill');
  const $meta = $('#todayProgressMeta');
  const $sum  = $('#todayActionsSummary');
  const hpBatch = cards.filter(c => c.done).reduce((acc, c) => {
    const card = getCardById(c.id);
    return acc + (card?.hp || 0);
  }, 0);
  if ($badge) $badge.textContent = `${done} / ${total}`;
  if ($fill) $fill.style.width = `${pct}%`;
  if ($meta) {
    $meta.textContent = total === 0
      ? '还没抽卡，去抽 3 张开始今日回血～'
      : done === total
        ? `第 ${state.today.round} 轮已全部完成 🎉`
        : `第 ${state.today.round} 轮进行中…`;
  }
  if ($sum) {
    $sum.innerHTML = total === 0
      ? '尚未开始'
      : `已完成 <strong>${done}</strong> 张 · <strong>+${hpBatch}</strong> HP · 第 <strong>${state.today.round}</strong> 轮`;
  }
  // 翻牌按钮 / 重抽按钮态
  const $flip = $('#flipAllBtn');
  if ($flip) $flip.disabled = total === 0 || cards.every(c => c.done && document.querySelector(`.card[data-id="${c.id}"]`)?.classList.contains('is-flipped'));
  const $re = $('#redrawBtn');
  if ($re) $re.disabled = total === 0;
}

function bindActionRow() {
  const flip = $('#flipAllBtn');
  const re   = $('#redrawBtn');
  if (flip) flip.onclick = () => {
    $$('.card').forEach((c, i) => {
      if (!c.classList.contains('is-flipped')) {
        setTimeout(() => {
          const id = c.dataset.id;
          const card = getCardById(id);
          if (card) flipCard(c, card);
        }, i * 120);
      }
    });
  };
  if (re) re.onclick = () => {
    if (!confirm('确定要重抽今日卡牌吗？\n（未完成的卡将被丢弃，已完成的 HP 记录会保留）')) return;
    // 清空当前批次
    state.today.cards = [];
    saveState(state);
    renderCardsArea();
    refreshHint();
    toast('已重置当前批次，可以重新抽卡', 'success');
  };
}

function maybeShowAllDone() {
  const allDoneBox = $('#allDoneBox');
  if (!allDoneBox) return;
  const hp = state.today.cards.reduce((acc, c) => acc + (getCardById(c.id)?.hp || 0), 0);
  allDoneBox.classList.remove('hide');
  allDoneBox.innerHTML = `
    <div class="emoji">🎉</div>
    <h3>第 ${state.today.round} 轮 全部完成！</h3>
    <p>本轮收获 <strong style="color:var(--mint)">+${hp} HP</strong> · 连签 <strong>${state.streak}</strong> 天 · 今日累计 <strong>${state.today.hpToday}/100</strong></p>
    <p class="text-dim" style="margin-top:8px">点上方按钮抽下一轮，或去图鉴看看新解锁的卡牌 ✨</p>
  `;
  confetti();
}
