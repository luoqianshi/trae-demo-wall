/**
 * views/library.js · 卡牌图鉴 Tab
 */
import { state } from '../state.js';
import { CARD_POOL, RARITY_LABEL, TAG_LABEL } from '../../data/cards.js';
import { openModal } from '../ui.js';
import { $, $$, el, fmtMmSs } from '../utils.js';

let currentFilter = 'all';

export function mountLibrary() {
  renderHero();
  renderStats();
  renderFilter();
  renderGrid();
}

function renderHero() {
  const got = Object.keys(state.library).filter(k => state.library[k] > 0).length;
  const total = CARD_POOL.length;
  const R = 72;
  const C = 2 * Math.PI * R;
  const offset = C * (1 - got / total);

  const wrap = $('#libRingWrap');
  if (!wrap) return;
  wrap.innerHTML = `
    <svg width="160" height="160" viewBox="0 0 160 160">
      <defs>
        <linearGradient id="libRingGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"  stop-color="#7CFFB2"/>
          <stop offset="100%" stop-color="#5DB4FF"/>
        </linearGradient>
      </defs>
      <circle class="ring-bg" cx="80" cy="80" r="${R}"></circle>
      <circle class="ring-fg" cx="80" cy="80" r="${R}"
        stroke-dasharray="${C.toFixed(2)}"
        stroke-dashoffset="${offset.toFixed(2)}"></circle>
    </svg>
    <div class="lib-ring-text">
      <div class="num">${got}</div>
      <div class="total">/ ${total}</div>
    </div>
  `;
}

function renderStats() {
  const host = $('#libStats');
  if (!host) return;
  host.innerHTML = '';
  ['n', 'r', 'sr', 'ssr'].forEach(rar => {
    const totalOfRar = CARD_POOL.filter(c => c.rarity === rar).length;
    const gotOfRar = CARD_POOL.filter(c => c.rarity === rar && (state.library[c.id] || 0) > 0).length;
    const cell = el('div', { class: `lib-stat lib-stat-${rar}` }, [
      el('div', { class: `rar rar-${rar}` }, RARITY_LABEL[rar].split(' · ')[0]),
      el('div', { class: 'got' }, String(gotOfRar)),
      el('div', { class: 'of' }, `/ ${totalOfRar}`),
    ]);
    host.appendChild(cell);
  });
}

function renderFilter() {
  const host = $('#libFilter');
  if (!host) return;
  host.innerHTML = '';
  const opts = [
    { k: 'all', l: '全部' },
    { k: 'n',   l: 'N · 普通' },
    { k: 'r',   l: 'R · 稀有' },
    { k: 'sr',  l: 'SR · 史诗' },
    { k: 'ssr', l: 'SSR · 传说' },
  ];
  opts.forEach(o => {
    const pool = o.k === 'all' ? CARD_POOL : CARD_POOL.filter(c => c.rarity === o.k);
    const total = pool.length;
    const got = pool.filter(c => (state.library[c.id] || 0) > 0).length;
    const rarClass = o.k === 'all' ? '' : `chip-${o.k}`;
    const chip = el('button', {
      class: `chip ${rarClass} ${currentFilter === o.k ? 'is-on' : ''}`,
      onClick: () => { currentFilter = o.k; renderFilter(); renderGrid(); },
    }, [
      el('span', { class: 'chip-label' }, o.l),
      el('span', { class: 'chip-count' }, `${got}/${total}`),
    ]);
    host.appendChild(chip);
  });
}

function renderGrid() {
  const host = $('#libGrid');
  if (!host) return;
  host.innerHTML = '';
  const base = currentFilter === 'all'
    ? CARD_POOL
    : CARD_POOL.filter(c => c.rarity === currentFilter);
  const rarityOrder = { ssr: 0, sr: 1, r: 2, n: 3 };
  const list = base.slice().sort((a, b) => {
    const ua = (state.library[a.id] || 0) > 0 ? 0 : 1;
    const ub = (state.library[b.id] || 0) > 0 ? 0 : 1;
    if (ua !== ub) return ua - ub;
    const ra = rarityOrder[a.rarity] ?? 99;
    const rb = rarityOrder[b.rarity] ?? 99;
    if (ra !== rb) return ra - rb;
    return 0;
  });
  list.forEach(card => {
    const count = state.library[card.id] || 0;
    const unlocked = count > 0;
    const node = el('div', {
      class: `lib-card ${unlocked ? '' : 'is-locked'}`,
      onClick: () => { if (unlocked) openLibModal(card, count); },
    }, [
      el('div', { class: 'lib-card-emoji' }, unlocked ? card.emoji : '❔'),
      el('div', { class: 'lib-card-name' }, unlocked ? card.name : '未解锁'),
      unlocked ? el('div', { class: 'lib-card-count' }, `已抽 ${count} 次`) : null,
      el('div', { class: `rar rar-${card.rarity}` }, RARITY_LABEL[card.rarity].split(' · ')[0]),
    ]);
    host.appendChild(node);
  });
}

function openLibModal(card, count) {
  const body = el('div', { class: 'lib-modal' }, [
    el('div', { class: `rar rar-${card.rarity}` }, RARITY_LABEL[card.rarity]),
    el('div', { class: 'big-emoji' }, card.emoji),
    el('h3', {}, card.name),
    el('div', { class: 'desc' }, card.desc),
    el('div', { class: 'stat-row' }, [
      el('div', { class: 'stat-cell' }, [
        el('div', { class: 'k' }, 'HP'),
        el('div', { class: 'v' }, `+${card.hp}`),
      ]),
      el('div', { class: 'stat-cell' }, [
        el('div', { class: 'k' }, '时长'),
        el('div', { class: 'v' }, fmtMmSs(card.dur)),
      ]),
      el('div', { class: 'stat-cell' }, [
        el('div', { class: 'k' }, '已抽'),
        el('div', { class: 'v' }, `${count} 次`),
      ]),
    ]),
    card.hourRange ? el('div', { class: 'hour-tag', style: { margin: '0 auto' } }, '⏰ 仅饭点出现') : null,
    el('div', { class: 'tag-row lib-tag-row' }, card.tags.map(t =>
      el('span', { class: 'tag' }, TAG_LABEL[t] || t)
    )),
  ]);
  openModal(body);
}
