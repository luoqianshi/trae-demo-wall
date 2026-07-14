/**
 * achievements-page.js - 成就页渲染
 * 依赖：data.js, store.js, achievements.js
 */
function renderAchievementsPage() {
  var stats = loadStats();
  var unlocked = checkAchievements(stats);

  document.getElementById('statsBar').innerHTML =
    '<div class="stat-item"><div class="si-num">' + (stats.completed || 0) + '</div><div class="si-label">\u5DF2\u5B8C\u6210\u7EF3\u7ED3</div></div>' +
    '<div class="stat-item"><div class="si-num">' + Object.keys(unlocked).length + '</div><div class="si-label">\u5DF2\u89E3\u9501\u6210\u5C31</div></div>';

  document.getElementById('achGrid').innerHTML = ACHIEVEMENTS.map(function (a) {
    var isUnlocked = !!unlocked[a.id];
    return '<div class="ach-card ' + (isUnlocked ? 'unlocked' : 'locked') + '">' +
      '<span class="ac-icon">' + (isUnlocked ? a.icon : '\uD83D\uDD12') + '</span>' +
      '<div class="ac-name">' + a.name + '</div>' +
      '<div class="ac-desc">' + a.desc + '</div>' +
      '</div>';
  }).join('');
}
