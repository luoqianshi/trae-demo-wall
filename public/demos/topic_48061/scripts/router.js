/**
 * router.js · 哈希路由 + 模板克隆 + onMount 分发
 */
import { $, $$, cnDate } from './utils.js';
import { state } from './state.js';
import { mountToday } from './views/today.js';
import { mountLibrary } from './views/library.js';
import { mountHistory } from './views/history.js';
import { mountMe } from './views/me.js';

export const TABS = {
  today:   { title: '今日回血',   templateId: 'tpl-today',   onMount: mountToday },
  library: { title: '卡牌图鉴',   templateId: 'tpl-library', onMount: mountLibrary },
  history: { title: '历史 & 周报', templateId: 'tpl-history', onMount: mountHistory },
  me:      { title: '我的',       templateId: 'tpl-me',      onMount: mountMe },
};

export function getTab() {
  const hash = (location.hash || '#today').replace('#', '');
  return TABS[hash] ? hash : 'today';
}

export function render() {
  const key = getTab();
  const tab = TABS[key];
  const $root = $('#viewRoot');
  $root.innerHTML = '';
  const tpl = document.getElementById(tab.templateId);
  if (tpl && 'content' in tpl) {
    $root.appendChild(tpl.content.cloneNode(true));
  }
  $('#topTitle').textContent = tab.title;
  $$('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.tab === key));
  syncDate();
  syncTopMeta();
  if (typeof tab.onMount === 'function') {
    try { tab.onMount(); }
    catch (err) { console.error('[router] mount error', key, err); }
  }
}

export function syncDate() {
  const $d = $('#topDate');
  if ($d) $d.textContent = cnDate();
}

export function syncTopMeta() {
  const set = (id, v) => { const n = $(id); if (n) n.textContent = v; };
  set('#topStreak', state.streak);
  set('#topDrawn',  state.today.drawn);
  set('#topRound',  state.today.round || 0);
  set('#topHp',     state.hpTotal);
}

export function initRouter() {
  window.addEventListener('hashchange', render);
  if (!location.hash) location.hash = '#today';
  render();
}
