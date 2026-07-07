/**
 * 食光机 - AI推荐页逻辑
 */

// 缓存推荐列表，供点击时按索引引用
let cachedRecommendations = [];

// ===== 初始化 =====
(async function () {
  const user = await checkAuth();
  if (!user) return;

  await renderNav('recommend');

  document.getElementById('refreshBtn').addEventListener('click', function () {
    loadRecommendations();
  });

  await loadRecommendations();
})();

/**
 * 加载推荐
 */
async function loadRecommendations() {
  const list = document.getElementById('recommendList');
  const subtitle = document.getElementById('recommendSubtitle');
  list.innerHTML = createLoadingState('AI 正在为你挑选...');

  try {
    const res = await API.getRecommendations();
    if (res.success && res.data) {
      renderRecommendations(res.data);
      subtitle.textContent = '根据你最近爱吃的口味，为你精选了以下推荐';
    } else {
      list.innerHTML = createEmptyState('暂无推荐', '先记录几道菜，AI 才能更好地推荐', '🤖');
    }
  } catch (err) {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><h3>加载失败</h3><p>' + escapeHtml(err.message) + '</p></div>';
  }
}

/**
 * 渲染推荐列表
 */
function renderRecommendations(recommendations) {
  const list = document.getElementById('recommendList');

  if (!recommendations || recommendations.length === 0) {
    cachedRecommendations = [];
    list.innerHTML = createEmptyState('暂无推荐', '先记录几道菜，AI 才能更好地推荐', '🤖');
    return;
  }

  // 缓存推荐数据，供点击时按索引引用
  cachedRecommendations = recommendations;

  let html = '';
  recommendations.forEach(function (rec, index) {
    const matchScore = rec.matchScore || 0;
    const matchColor = matchScore >= 90 ? '#5A8A6E' : matchScore >= 80 ? '#D4653B' : '#8C7B72';
    const diffInfo = DIFFICULTY_MAP[rec.difficulty] || DIFFICULTY_MAP.easy;

    const tagsHtml = (rec.tags && rec.tags.length > 0)
      ? '<div class="rec-tags">' + rec.tags.slice(0, 4).map(function (t) { return '<span class="tag-chip">' + escapeHtml(t) + '</span>'; }).join('') + '</div>'
      : '';

    const infoLine = [
      rec.cuisine,
      rec.cookTime ? rec.cookTime + '分钟' : null,
      diffInfo.label,
      rec.calories ? rec.calories + '卡' : null,
      rec.flavor
    ].filter(Boolean).join(' · ');

    html +=
      '<div class="recommend-item" onclick="addRecommendToRecord(' + index + ')">' +
      '<div class="rec-img">' + (rec.emoji || '🍽️') + '</div>' +
      '<div class="rec-info">' +
      '<h4>' + escapeHtml(rec.name) + '</h4>' +
      '<p>' + escapeHtml(infoLine) + '</p>' +
      (rec.reason ? '<p class="rec-reason">💡 ' + escapeHtml(rec.reason) + '</p>' : '') +
      tagsHtml +
      '</div>' +
      '<div class="rec-match" style="color:' + matchColor + ';background:' + matchColor + '1a;">' + matchScore + '% 匹配</div>' +
      '<div class="rec-action">记录这道菜</div>' +
      '</div>';
  });

  list.innerHTML = html;
}

/**
 * 将推荐菜品添加到记录（跳转到时光轴并预填）
 * @param {number} index - 推荐列表中的索引
 */
function addRecommendToRecord(index) {
  var rec = cachedRecommendations[index];
  if (!rec) return;
  // 存入 sessionStorage，时光轴页面会读取
  sessionStorage.setItem('pendingRecommend', JSON.stringify(rec));
  window.location.href = 'timeline.html?action=add';
}
