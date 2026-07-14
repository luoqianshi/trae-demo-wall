/**
 * achievements.js - 成就判定与记录模块
 * 依赖：data.js（ACHIEVEMENTS, DEFAULT_KNOTS）、store.js（loadStats, saveStats）
 */
function checkAchievements(stats) {
  var unlocked = {};
  ACHIEVEMENTS.forEach(function (a) {
    if (a.check(stats)) unlocked[a.id] = true;
  });
  return unlocked;
}

function recordCompletion(mode) {
  var stats = loadStats();
  var kid = AppState.selectedKnot;

  if (!stats.completedKnotIds) stats.completedKnotIds = {};
  if (!stats.processCompleted) stats.processCompleted = {};
  if (!stats.expandedCompleted) stats.expandedCompleted = {};
  if (!stats.viewedBuiltin) stats.viewedBuiltin = {};

  if (!stats.completedKnotIds[kid]) {
    stats.completedKnotIds[kid] = true;
    stats.completed = (stats.completed || 0) + 1;
  }

  if (mode === 'process') stats.processCompleted[kid] = true;
  if (mode === 'expanded') stats.expandedCompleted[kid] = true;

  if (DEFAULT_KNOTS.some(function (k) { return k.id === kid; }) && !stats.viewedBuiltin[kid]) {
    stats.viewedBuiltin[kid] = true;
  }

  if (stats.processCompleted[kid] && stats.expandedCompleted[kid]) {
    stats.bothModesDone = true;
  }

  saveStats(stats);

  showToast('\uD83C\uDF89 \u300C' + AppState.selectedKnotData.name + '\u300D\u5B8C\u6210\uFF01');
  if (window.Pet && Pet.announce) Pet.announce('achievement', { name: AppState.selectedKnotData.name });
}
