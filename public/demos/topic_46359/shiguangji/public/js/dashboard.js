/**
 * 食光机 - 仪表盘页逻辑
 * 整合个人数据与社区动态
 */

let currentUser = null;

// ===== 初始化 =====
(async function () {
  // 渲染导航栏（高亮"我的"）
  await renderNav('dashboard');

  // 必须登录
  const user = await checkAuth({});
  if (!user) return;
  currentUser = user;

  // 渲染欢迎区用户信息
  renderWelcome(user);

  // 并行加载各模块数据
  await Promise.all([
    loadUserStats(),
    loadRecentRecords(),
    loadCommunityFeed(),
    loadHotPosts(),
    loadCommunityProfile()
  ]);
})();

/**
 * 渲染欢迎区用户信息
 */
function renderWelcome(user) {
  const avatarEl = document.getElementById('welcomeAvatar');
  const nameEl = document.getElementById('welcomeName');
  if (avatarEl) avatarEl.textContent = '👤';
  if (nameEl) nameEl.textContent = '你好，' + (user.username || '美食家');
}

/**
 * 加载用户统计（来自记录统计 API）
 */
async function loadUserStats() {
  try {
    const res = await API.getStats();
    if (res.success && res.data) {
      const stats = res.data;

      const elTotal = document.getElementById('statTotal');
      const elTags = document.getElementById('statTags');
      const elRating = document.getElementById('statRating');
      const elMonth = document.getElementById('statMonth');

      if (elTotal) elTotal.textContent = stats.total || 0;
      if (elTags) elTags.textContent = stats.tagCount ? Object.keys(stats.tagCount).length : 0;
      if (elRating) elRating.textContent = stats.avgRating || '0.0';

      // 本月烹饪数
      if (elMonth) {
        const now = new Date();
        const monthKey = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
        elMonth.textContent = (stats.monthlyCount && stats.monthlyCount[monthKey]) || 0;
      }
    }
  } catch (err) {
    console.error('加载用户统计失败:', err);
  }
}

/**
 * 加载最近 3 条记录
 */
async function loadRecentRecords() {
  const container = document.getElementById('recentRecords');
  if (!container) return;

  try {
    const res = await API.getRecords();
    if (res.success && res.data) {
      const records = res.data.slice(0, 3);
      renderRecentRecords(records);
    } else {
      container.innerHTML = createEmptyState('暂无记录', '去记录你的第一道菜吧', '🍳');
    }
  } catch (err) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><h3>加载失败</h3><p>' + escapeHtml(err.message) + '</p></div>';
  }
}

/**
 * 渲染最近记录
 */
function renderRecentRecords(records) {
  const container = document.getElementById('recentRecords');
  if (!container) return;

  if (!records || records.length === 0) {
    container.innerHTML = createEmptyState('暂无记录', '去记录你的第一道菜吧', '🍳');
    return;
  }

  let html = '';
  records.forEach(function (record) {
    const mealInfo = MEAL_TYPE_MAP[record.mealType] || MEAL_TYPE_MAP.dinner;
    const imgUrl = getRecordImageUrl(record);
    const imageHtml = imgUrl
      ? '<img src="' + imgUrl + '" alt="' + escapeHtml(record.dishName) + '">'
      : (record.emoji || '🍽️');

    const ratingHtml = record.rating
      ? '<span class="rr-rating">' + '★'.repeat(record.rating) + '</span>'
      : '';

    html +=
      '<div class="recent-record" onclick="window.location.href=\'timeline.html\'">' +
      '<div class="rr-img">' + imageHtml + '</div>' +
      '<div class="rr-info">' +
      '<div class="rr-name">' + escapeHtml(record.dishName) + '</div>' +
      '<div class="rr-meta">' +
      '<span>📅 ' + formatDate(record.date) + '</span>' +
      '<span>' + mealInfo.icon + ' ' + mealInfo.label + '</span>' +
      ratingHtml +
      '</div>' +
      '</div>' +
      '</div>';
  });

  container.innerHTML = html;
}

/**
 * 加载社区动态流（5 条最新帖子）
 */
async function loadCommunityFeed() {
  const container = document.getElementById('feedList');
  if (!container) return;

  try {
    const res = await API.community.getFeed(1, 5);
    if (res.success && res.data) {
      const posts = res.data.posts || res.data;
      renderFeed(posts);
    } else {
      container.innerHTML = createEmptyState('暂无动态', '成为第一个分享美食故事的人', '🌐');
    }
  } catch (err) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><h3>加载失败</h3><p>' + escapeHtml(err.message) + '</p></div>';
  }
}

/**
 * 渲染社区动态流
 */
function renderFeed(posts) {
  const container = document.getElementById('feedList');
  if (!container) return;

  if (!posts || posts.length === 0) {
    container.innerHTML = createEmptyState('暂无动态', '去社区分享你的美食故事吧', '🌐');
    return;
  }

  let html = '';
  posts.forEach(function (post) {
    html += renderFeedPost(post);
  });

  container.innerHTML = html;
}

/**
 * 渲染单条动态卡片
 */
function renderFeedPost(post) {
  const author = post.author || {};
  const authorName = author.username || '匿名用户';
  const avatarText = (authorName || '?').charAt(0).toUpperCase();
  const likedClass = post.liked ? ' liked' : '';

  // 图片处理：路径加上 /uploads/ 前缀（若已以 /uploads 开头则不加）
  let imageHtml = '';
  if (post.imagePath) {
    const imgUrl = getPostImageUrl(post.imagePath);
    imageHtml = '<img class="fp-image" src="' + imgUrl + '" alt="' + escapeHtml(post.title || '') + '" loading="lazy">';
  }

  // 关联记录标签
  let recordTagHtml = '';
  if (post.record) {
    recordTagHtml = '<span style="font-size:0.72rem;color:var(--accent2);background:var(--bg2);padding:0.1rem 0.5rem;border-radius:100px;margin-top:0.4rem;display:inline-block;">' +
      (post.record.emoji || '🍽️') + ' ' + escapeHtml(post.record.dishName || '关联记录') + '</span>';
  }

  return (
    '<div class="feed-post" onclick="window.location.href=\'community.html\'">' +
    '<div class="fp-header">' +
    '<div class="fp-avatar">' + escapeHtml(avatarText) + '</div>' +
    '<div class="fp-author">' + escapeHtml(authorName) + '</div>' +
    '<div class="fp-time">' + formatDate(post.createdAt) + '</div>' +
    '</div>' +
    '<div class="fp-title">' + escapeHtml(post.title || '无标题') + '</div>' +
    (post.content ? '<div class="fp-content">' + escapeHtml(post.content) + '</div>' : '') +
    imageHtml +
    recordTagHtml +
    '<div class="fp-actions">' +
    '<span class="fp-action' + likedClass + '">❤️ ' + (post.likesCount || 0) + '</span>' +
    '<span class="fp-action">💬 ' + (post.commentsCount || 0) + '</span>' +
    '</div>' +
    '</div>'
  );
}

/**
 * 加载热门帖子
 */
async function loadHotPosts() {
  const container = document.getElementById('hotList');
  if (!container) return;

  try {
    const res = await API.community.getHot();
    if (res.success && res.data) {
      renderHotPosts(res.data);
    } else {
      container.innerHTML = createEmptyState('暂无热门', '快来抢占热门榜', '🔥');
    }
  } catch (err) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><h3>加载失败</h3><p>' + escapeHtml(err.message) + '</p></div>';
  }
}

/**
 * 渲染热门帖子列表
 */
function renderHotPosts(posts) {
  const container = document.getElementById('hotList');
  if (!container) return;

  if (!posts || posts.length === 0) {
    container.innerHTML = createEmptyState('暂无热门', '快来抢占热门榜', '🔥');
    return;
  }

  let html = '';
  posts.slice(0, 5).forEach(function (post, index) {
    html +=
      '<div class="hot-item" onclick="window.location.href=\'community.html\'">' +
      '<div class="hot-rank">' + (index + 1) + '</div>' +
      '<div class="hot-info">' +
      '<div class="hot-title">' + escapeHtml(post.title || '无标题') + '</div>' +
      '<div class="hot-meta">' + escapeHtml((post.author && post.author.username) || '匿名') + ' · ' + formatDate(post.createdAt) + '</div>' +
      '</div>' +
      '<div class="hot-likes">❤️ ' + (post.likesCount || 0) + '</div>' +
      '</div>';
  });

  container.innerHTML = html;
}

/**
 * 加载社区资料（更新欢迎区统计）
 */
async function loadCommunityProfile() {
  try {
    const res = await API.community.getProfile();
    if (res.success && res.data) {
      const profile = res.data;
      const elPosts = document.getElementById('welcomePosts');
      const elFollowers = document.getElementById('welcomeFollowers');
      const elFollowing = document.getElementById('welcomeFollowing');
      const elLikes = document.getElementById('welcomeLikes');

      if (elPosts) elPosts.textContent = profile.postCount || 0;
      if (elFollowers) elFollowers.textContent = profile.followerCount || 0;
      if (elFollowing) elFollowing.textContent = profile.followingCount || 0;
      if (elLikes) elLikes.textContent = profile.likeCount || 0;
    }
  } catch (err) {
    // 社区资料接口可能尚未实现，静默处理
    console.error('加载社区资料失败:', err);
  }
}

/**
 * 获取帖子图片完整 URL
 * 若路径以 /uploads 或 http 开头则直接使用，否则加上 /uploads/ 前缀
 */
function getPostImageUrl(imagePath) {
  if (!imagePath) return '';
  if (imagePath.startsWith('http') || imagePath.startsWith('/uploads')) {
    return imagePath;
  }
  // 去掉开头的 / 避免双斜杠
  const cleanPath = imagePath.replace(/^\/+/, '');
  return '/uploads/' + cleanPath;
}
