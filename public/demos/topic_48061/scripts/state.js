/**
 * state.js · LocalStorage 数据层
 * 数据键：heal-app-state-v1
 */
import { todayStr, yesterdayStr } from './utils.js';

export const STORAGE_KEY = 'heal-app-state-v1';

/** 默认状态结构 */
export function defaultState() {
  return {
    streak: 0,
    lastDrawDate: '',
    installDate: todayStr(),
    today: { date: todayStr(), drawn: 0, round: 0, hpToday: 0, cards: [], moods: [] },
    hpTotal: 0,
    pity: 0,
    library: {},
    history: [],
    settings: {
      remindOn: false,
      remindTime: '14:30',
      hourLimit: true,
      disabledTags: [],
    },
  };
}

/** 读取并执行跨日重置 */
export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const s = JSON.parse(raw);
    const t = todayStr();
    if (!s.today || s.today.date !== t) {
      // 跨日：昨天有抽 = 连签延续；否则归零
      if (s.lastDrawDate && s.lastDrawDate !== yesterdayStr()) {
        s.streak = 0;
      }
      s.today = { date: t, drawn: 0, round: 0, hpToday: 0, cards: [], moods: [] };
    }
    if (s.today && typeof s.today.round !== 'number') {
      s.today.round = s.today.cards?.length ? 1 : 0;
    }
    // 兼容老数据：补 settings 默认字段
    const merged = Object.assign(defaultState(), s);
    merged.settings = Object.assign(defaultState().settings, s.settings || {});
    if (!merged.installDate) merged.installDate = todayStr();
    return merged;
  } catch (err) {
    console.warn('[state] load failed, fallback to default', err);
    return defaultState();
  }
}

export function saveState(s) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }
  catch (err) { console.warn('[state] save failed', err); }
}

export function resetState() {
  localStorage.removeItem(STORAGE_KEY);
}

/** 单例 state */
export const state = loadState();

/** 重新加载（导入数据后用） */
export function reloadState() {
  const fresh = loadState();
  Object.keys(state).forEach(k => delete state[k]);
  Object.assign(state, fresh);
  return state;
}

/** 抽卡时累加连签：每日首次 +1 */
export function bumpStreakIfFirstToday() {
  const t = todayStr();
  if (state.lastDrawDate === t) return;
  const y = yesterdayStr();
  state.streak = (state.lastDrawDate === y) ? (state.streak + 1) : 1;
  state.lastDrawDate = t;
}
