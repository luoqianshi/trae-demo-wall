/**
 * store.js - localStorage 持久化层
 * 依赖：无
 */
const STORAGE_KEY_STATS = 'knots_stats';

function loadStats() {
  var def = {
    completed: 0,
    viewedBuiltin: {},
    completedKnotIds: {},
    bothModesDone: false,
    expandedCompleted: {},
    processCompleted: {}
  };
  try { return Object.assign(def, JSON.parse(localStorage.getItem(STORAGE_KEY_STATS) || '{}')); }
  catch (e) { return def; }
}

function saveStats(s) {
  localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(s));
}

/* ----- 宠物数据持久化 ----- */
const STORAGE_KEY_PET = 'knots_pet';

function loadPetData() {
  var def = {
    intimacy: 0,
    position: null,
    lastFeedTime: 0,
    lastPetTime: 0,
    todayIntimacy: 0,
    todayDate: ''
  };
  try { return Object.assign(def, JSON.parse(localStorage.getItem(STORAGE_KEY_PET) || '{}')); }
  catch (e) { return def; }
}

function savePetData(p) {
  localStorage.setItem(STORAGE_KEY_PET, JSON.stringify(p));
}
