/**
 * home.js - 首页：绳结卡片展示
 * 依赖：data.js, app.js（AppState, startProcess）
 */
function renderHome() {
  var builtinDiv = document.getElementById('builtinKnots');

  builtinDiv.innerHTML = DEFAULT_KNOTS.map(function (k) {
    return '<div class="knot-card" onclick="selectKnot(\'' + k.id + '\')">' +
      '<span class="kc-badge">\u5185\u7F6E</span>' +
      '<span class="kc-icon">' + k.icon + '</span>' +
      '<div class="kc-name">' + k.name + '</div>' +
      '<div class="kc-desc">' + k.desc + '</div>' +
      '<div class="kc-meta"><span>' + k.difficulty + '</span><span>' + k.time + '</span></div>' +
      '</div>';
  }).join('');
}

function selectKnot(knotId) {
  AppState.selectedKnotData = DEFAULT_KNOTS.find(function (k) { return k.id === knotId; });
  if (!AppState.selectedKnotData) return;
  AppState.selectedKnot = knotId;
  startProcess();
}
