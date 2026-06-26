/**
 * 食光机 - 社区页逻辑
 * 帖子的发布、浏览、点赞、评论、删除
 */

// ===== 状态管理 =====
let currentUserId = null;
let currentPage = 1;
let currentTab = 'feed';       // feed / hot / mine
let hasMorePages = false;
let myRecords = [];            // 当前用户的记录列表（用于发帖时关联）
let currentPostImageFile = null; // 当前发帖选择的图片文件
let currentPostImagePath = null; // 当前发帖图片的服务器路径
let currentDetailPost = null;    // 当前查看详情的帖子

// ===== 初始化 =====
(async function () {
  // 渲染导航栏（高亮"社区"）
  await renderNav('community');

  // 必须登录
  const user = await checkAuth({});
  if (!user) return;
  currentUserId = user.id;

  // 渲染发帖区头像
  const composerAvatar = document.getElementById('composerAvatar');
  if (composerAvatar) composerAvatar.textContent = '👤';

  // 绑定事件
  bindEvents();

  // 并行加载动态流和我的记录（用于关联选择）
  await Promise.all([
    loadFeed(1),
    loadMyRecords()
  ]);
})();

/**
 * 绑定所有事件
 */
function bindEvents() {
  // 标签切换
  document.querySelectorAll('.community-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      switchTab(tab.dataset.tab);
    });
  });

  // 发布帖子
  document.getElementById('publishPostBtn').addEventListener('click', createPost);

  // 图片上传
  document.getElementById('postImageBtn').addEventListener('click', function () {
    document.getElementById('postImageInput').click();
  });
  document.getElementById('postImageInput').addEventListener('change', handlePostImageSelect);
  document.getElementById('composerImageRemove').addEventListener('click', removePostImage);

  // 加载更多
  document.getElementById('loadMoreBtn').addEventListener('click', function () {
    currentPage++;
    loadFeed(currentPage, true);
  });
}

// ===== 标签切换 =====

/**
 * 切换标签
 */
function switchTab(tab) {
  if (currentTab === tab) return;
  currentTab = tab;
  currentPage = 1;

  // 更新标签高亮
  document.querySelectorAll('.community-tab').forEach(function (t) {
    t.classList.toggle('active', t.dataset.tab === tab);
  });

  // 隐藏加载更多
  document.getElementById('loadMoreWrapper').style.display = 'none';

  // 清空列表并显示加载中
  const container = document.getElementById('postsContainer');
  container.innerHTML = createLoadingState('加载中...');

  if (tab === 'feed') {
    loadFeed(1);
  } else if (tab === 'hot') {
    loadHot();
  } else if (tab === 'mine') {
    loadMine();
  }
}

// ===== 数据加载 =====

/**
 * 加载动态流
 * @param {number} page - 页码
 * @param {boolean} append - 是否追加（加载更多）
 */
async function loadFeed(page, append) {
  page = page || 1;
  const container = document.getElementById('postsContainer');

  if (!append) {
    container.innerHTML = createLoadingState('加载中...');
  }

  try {
    const res = await API.community.getFeed(page, 10);
    if (res.success && res.data) {
      const posts = res.data.posts || res.data;
      renderPosts(posts, 'postsContainer', append);
      // 简单判断是否还有更多
      hasMorePages = posts.length >= 10;
      document.getElementById('loadMoreWrapper').style.display = (hasMorePages && !append) ? 'block' : 'none';
    } else {
      if (!append) container.innerHTML = createEmptyState('暂无动态', '成为第一个分享美食故事的人', '🌐');
    }
  } catch (err) {
    if (!append) {
      container.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><h3>加载失败</h3><p>' + escapeHtml(err.message) + '</p></div>';
    } else {
      showToast('加载更多失败: ' + err.message, 'error');
    }
  }
}

/**
 * 加载热门帖子
 */
async function loadHot() {
  const container = document.getElementById('postsContainer');
  container.innerHTML = createLoadingState('加载中...');

  try {
    const res = await API.community.getHot();
    if (res.success && res.data) {
      renderPosts(res.data, 'postsContainer', false);
    } else {
      container.innerHTML = createEmptyState('暂无热门', '快来抢占热门榜', '🔥');
    }
  } catch (err) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><h3>加载失败</h3><p>' + escapeHtml(err.message) + '</p></div>';
  }
}

/**
 * 加载我的帖子
 */
async function loadMine() {
  const container = document.getElementById('postsContainer');
  container.innerHTML = createLoadingState('加载中...');

  try {
    const res = await API.community.getUserPosts(currentUserId);
    if (res.success && res.data) {
      const posts = res.data.posts || res.data;
      renderPosts(posts, 'postsContainer', false);
    } else {
      container.innerHTML = createEmptyState('暂无帖子', '去分享你的第一篇美食故事吧', '📝');
    }
  } catch (err) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><h3>加载失败</h3><p>' + escapeHtml(err.message) + '</p></div>';
  }
}

/**
 * 加载我的记录（用于发帖时关联选择）
 */
async function loadMyRecords() {
  try {
    const res = await API.getRecords();
    if (res.success && res.data) {
      myRecords = res.data;
      renderRecordSelect();
    }
  } catch (err) {
    console.error('加载记录失败:', err);
  }
}

/**
 * 渲染关联记录下拉
 */
function renderRecordSelect() {
  const select = document.getElementById('postRecordSelect');
  if (!select) return;

  let html = '<option value="">🔗 关联美食记录（可选）</option>';
  myRecords.forEach(function (record) {
    html += '<option value="' + record.id + '">' + (record.emoji || '🍽️') + ' ' + escapeHtml(record.dishName) + ' · ' + formatDate(record.date) + '</option>';
  });
  select.innerHTML = html;
}

// ===== 渲染 =====

/**
 * 渲染帖子列表
 * @param {Array} posts - 帖子数组
 * @param {string} containerId - 容器ID
 * @param {boolean} append - 是否追加
 */
function renderPosts(posts, containerId, append) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!posts || posts.length === 0) {
    if (!append) {
      let emptyTitle = '暂无动态';
      let emptyDesc = '成为第一个分享美食故事的人';
      let emptyIcon = '🌐';
      if (currentTab === 'hot') {
        emptyTitle = '暂无热门'; emptyDesc = '快来抢占热门榜'; emptyIcon = '🔥';
      } else if (currentTab === 'mine') {
        emptyTitle = '暂无帖子'; emptyDesc = '去分享你的第一篇美食故事吧'; emptyIcon = '📝';
      }
      container.innerHTML = createEmptyState(emptyTitle, emptyDesc, emptyIcon);
    }
    return;
  }

  let html = '';
  posts.forEach(function (post) {
    html += renderPostCard(post);
  });

  if (append) {
    container.innerHTML += html;
  } else {
    container.innerHTML = html;
  }
}

/**
 * 渲染单个帖子卡片
 */
function renderPostCard(post) {
  const author = post.author || {};
  const authorName = author.username || '匿名用户';
  const avatarText = (authorName || '?').charAt(0).toUpperCase();
  const isMine = author.id === currentUserId;
  const likedClass = post.liked ? ' liked' : '';

  // 图片处理
  let imageHtml = '';
  if (post.imagePath) {
    const imgUrl = getPostImageUrl(post.imagePath);
    imageHtml = '<img class="post-image" src="' + imgUrl + '" alt="' + escapeHtml(post.title || '') + '" loading="lazy" onclick="viewPost(' + post.id + ')">';
  }

  // 关联记录标签
  let recordTagHtml = '';
  if (post.record) {
    recordTagHtml = '<div class="post-record-tag">' +
      (post.record.emoji || '🍽️') + ' ' + escapeHtml(post.record.dishName || '关联记录') +
      (post.record.date ? ' · ' + formatDate(post.record.date) : '') +
      '</div>';
  }

  // 删除按钮（仅作者可见）
  const deleteBtnHtml = isMine
    ? '<button class="post-delete-btn" onclick="event.stopPropagation();deletePost(' + post.id + ')">🗑️ 删除</button>'
    : '';

  return (
    '<div class="post-card">' +
    '<div class="post-card-header">' +
    '<div class="post-avatar">' + escapeHtml(avatarText) + '</div>' +
    '<div class="post-author-info">' +
    '<div class="post-author-name">' + escapeHtml(authorName) + '</div>' +
    '<div class="post-time">' + formatDate(post.createdAt) + '</div>' +
    '</div>' +
    deleteBtnHtml +
    '</div>' +
    '<div class="post-title" onclick="viewPost(' + post.id + ')">' + escapeHtml(post.title || '无标题') + '</div>' +
    (post.content ? '<div class="post-content collapsed">' + escapeHtml(post.content) + '</div>' : '') +
    imageHtml +
    recordTagHtml +
    '<div class="post-actions">' +
    '<button class="post-action' + likedClass + '" onclick="event.stopPropagation();toggleLike(' + post.id + ', this)">' +
    '<span class="pa-icon">' + (post.liked ? '❤️' : '🤍') + '</span>' +
    '<span class="pa-count">' + (post.likesCount || 0) + '</span>' +
    '</button>' +
    '<button class="post-action" onclick="event.stopPropagation();viewPost(' + post.id + ')">' +
    '<span>💬</span><span>' + (post.commentsCount || 0) + '</span>' +
    '</button>' +
    '</div>' +
    '</div>'
  );
}

// ===== 发布帖子 =====

/**
 * 处理发帖图片选择
 */
function handlePostImageSelect(e) {
  if (e.target.files.length === 0) return;
  const file = e.target.files[0];
  if (!file.type.startsWith('image/')) {
    showToast('请上传图片文件', 'error');
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    showToast('图片大小不能超过5MB', 'warning');
    return;
  }

  currentPostImageFile = file;
  currentPostImagePath = null; // 重置服务器路径

  // 显示预览
  const reader = new FileReader();
  reader.onload = function (ev) {
    const preview = document.getElementById('composerImagePreview');
    const img = document.getElementById('composerImageImg');
    img.src = ev.target.result;
    preview.style.display = 'block';
  };
  reader.readAsDataURL(file);
}

/**
 * 移除发帖图片
 */
function removePostImage() {
  currentPostImageFile = null;
  currentPostImagePath = null;
  const preview = document.getElementById('composerImagePreview');
  preview.style.display = 'none';
  document.getElementById('postImageInput').value = '';
}

/**
 * 上传发帖图片，返回服务器路径
 * 复用 AI 识别接口的上传能力获取 imagePath
 */
async function uploadPostImage() {
  if (!currentPostImageFile) return null;
  // 若已上传过则直接返回
  if (currentPostImagePath) return currentPostImagePath;

  const formData = new FormData();
  formData.append('image', currentPostImageFile);
  const res = await API.recognizeImage(formData);
  if (res && res.success && res.data && res.data.imagePath) {
    currentPostImagePath = res.data.imagePath;
    return currentPostImagePath;
  }
  throw new Error('图片上传失败');
}

/**
 * 发布帖子
 */
async function createPost() {
  const title = document.getElementById('postTitleInput').value.trim();
  const content = document.getElementById('postContentInput').value.trim();
  const recordId = document.getElementById('postRecordSelect').value || null;

  if (!title) {
    showToast('请输入标题', 'warning');
    return;
  }
  if (!content && !currentPostImageFile) {
    showToast('请输入内容或上传图片', 'warning');
    return;
  }

  const btn = document.getElementById('publishPostBtn');
  const originalText = btn.textContent;
  btn.textContent = '发布中...';
  btn.disabled = true;

  try {
    // 如有图片，先上传获取路径
    let imagePath = null;
    if (currentPostImageFile) {
      imagePath = await uploadPostImage();
    }

    const res = await API.community.createPost({
      title: title,
      content: content,
      imagePath: imagePath,
      recordId: recordId ? parseInt(recordId) : null
    });

    if (res.success) {
      showToast('发布成功！', 'success');
      // 重置表单
      document.getElementById('postTitleInput').value = '';
      document.getElementById('postContentInput').value = '';
      document.getElementById('postRecordSelect').value = '';
      removePostImage();
      // 刷新列表
      currentPage = 1;
      if (currentTab === 'feed') {
        loadFeed(1);
      } else {
        switchTab('feed');
      }
    } else {
      showToast(res.message || '发布失败', 'error');
    }
  } catch (err) {
    showToast(err.message || '发布失败', 'error');
  } finally {
    btn.textContent = originalText;
    btn.disabled = false;
  }
}

// ===== 点赞 =====

/**
 * 点赞 / 取消点赞
 */
async function toggleLike(postId, btnEl) {
  try {
    const res = await API.community.toggleLike(postId);
    if (res.success && res.data) {
      const liked = res.data.liked;
      const count = res.data.likesCount;

      // 更新当前卡片 UI
      if (btnEl) {
        btnEl.classList.toggle('liked', liked);
        const iconEl = btnEl.querySelector('.pa-icon');
        const countEl = btnEl.querySelector('.pa-count');
        if (iconEl) iconEl.textContent = liked ? '❤️' : '🤍';
        if (countEl) countEl.textContent = count;
      }

      // 同步详情模态框中的点赞状态
      updateDetailLikeUI(postId, liked, count);
    }
  } catch (err) {
    showToast(err.message || '操作失败', 'error');
  }
}

/**
 * 更新详情模态框中的点赞 UI
 */
function updateDetailLikeUI(postId, liked, count) {
  const detailBtn = document.getElementById('detailLikeBtn');
  if (!detailBtn || !currentDetailPost || currentDetailPost.id !== postId) return;
  currentDetailPost.liked = liked;
  currentDetailPost.likesCount = count;
  detailBtn.classList.toggle('liked', liked);
  detailBtn.innerHTML = '<span class="pa-icon">' + (liked ? '❤️' : '🤍') + '</span><span>' + count + '</span>';
}

// ===== 帖子详情 =====

/**
 * 查看帖子详情
 */
async function viewPost(postId) {
  const modal = document.getElementById('postDetailModal');
  const body = document.getElementById('postDetailBody');
  body.innerHTML = createLoadingState('加载中...');
  modal.classList.add('show');
  currentDetailPost = null;

  try {
    const res = await API.community.getPost(postId);
    if (res.success && res.data) {
      currentDetailPost = res.data;
      await renderPostDetail(res.data);
    } else {
      body.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><h3>加载失败</h3><p>帖子不存在或已被删除</p></div>';
    }
  } catch (err) {
    body.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><h3>加载失败</h3><p>' + escapeHtml(err.message) + '</p></div>';
  }
}

/**
 * 渲染帖子详情
 */
async function renderPostDetail(post) {
  const body = document.getElementById('postDetailBody');
  const author = post.author || {};
  const authorName = author.username || '匿名用户';
  const avatarText = (authorName || '?').charAt(0).toUpperCase();
  const isMine = author.id === currentUserId;
  const likedClass = post.liked ? ' liked' : '';

  // 图片
  let imageHtml = '';
  if (post.imagePath) {
    const imgUrl = getPostImageUrl(post.imagePath);
    imageHtml = '<img class="pd-image" src="' + imgUrl + '" alt="' + escapeHtml(post.title || '') + '">';
  }

  // 关联记录
  let recordTagHtml = '';
  if (post.record) {
    recordTagHtml = '<div class="pd-record-tag">' +
      (post.record.emoji || '🍽️') + ' ' + escapeHtml(post.record.dishName || '关联记录') +
      (post.record.date ? ' · ' + formatDate(post.record.date) : '') +
      '</div>';
  }

  // 详情头部 + 内容
  let html =
    '<div class="post-detail-body-content">' +
    '<div class="pd-header">' +
    '<div class="pd-avatar">' + escapeHtml(avatarText) + '</div>' +
    '<div>' +
    '<div class="pd-author-name">' + escapeHtml(authorName) + '</div>' +
    '<div class="pd-time">' + formatDate(post.createdAt) + '</div>' +
    '</div>' +
    (isMine ? '<button class="post-delete-btn" style="margin-left:auto;" onclick="deletePost(' + post.id + ')">🗑️ 删除</button>' : '') +
    '</div>' +
    '<h2 class="pd-title">' + escapeHtml(post.title || '无标题') + '</h2>' +
    (post.content ? '<div class="pd-content">' + escapeHtml(post.content) + '</div>' : '') +
    imageHtml +
    recordTagHtml +
    '<div class="pd-actions">' +
    '<button class="post-action' + likedClass + '" id="detailLikeBtn" onclick="toggleLike(' + post.id + ', this)">' +
    '<span class="pa-icon">' + (post.liked ? '❤️' : '🤍') + '</span>' +
    '<span>' + (post.likesCount || 0) + '</span>' +
    '</button>' +
    '<span class="post-action">💬 ' + (post.commentsCount || 0) + '</span>' +
    '</div>' +
    '<div class="comments-section">' +
    '<div class="comments-title">评论</div>' +
    '<div class="comment-list" id="commentList"><div class="loading-state"><div class="loading-spinner"></div><div class="loading-text">加载评论...</div></div></div>' +
    '<div class="comment-input-wrapper">' +
    '<input type="text" class="form-input" id="commentInput" placeholder="写下你的评论..." maxlength="500">' +
    '<button class="btn btn-primary btn-sm" onclick="addComment(' + post.id + ')">发送</button>' +
    '</div>' +
    '</div>' +
    '</div>';

  body.innerHTML = html;

  // 加载评论
  await loadComments(post.id);
}

/**
 * 加载评论列表
 */
async function loadComments(postId) {
  const container = document.getElementById('commentList');
  if (!container) return;

  try {
    const res = await API.community.getComments(postId);
    if (res.success && res.data) {
      renderComments(res.data, postId);
    } else {
      container.innerHTML = '<div class="empty-text" style="padding:1rem 0;">暂无评论，快来抢沙发</div>';
    }
  } catch (err) {
    container.innerHTML = '<div class="empty-text" style="padding:1rem 0;color:#E63946;">评论加载失败: ' + escapeHtml(err.message) + '</div>';
  }
}

/**
 * 渲染评论列表
 */
function renderComments(comments, postId) {
  const container = document.getElementById('commentList');
  if (!container) return;

  if (!comments || comments.length === 0) {
    container.innerHTML = '<div class="empty-text" style="padding:1rem 0;">暂无评论，快来抢沙发</div>';
    return;
  }

  let html = '';
  comments.forEach(function (comment) {
    const author = comment.author || {};
    const authorName = author.username || '匿名用户';
    const avatarText = (authorName || '?').charAt(0).toUpperCase();
    const isMine = author.id === currentUserId;

    html +=
      '<div class="comment-item">' +
      '<div class="comment-avatar">' + escapeHtml(avatarText) + '</div>' +
      '<div class="comment-body">' +
      '<div class="comment-header">' +
      '<span class="comment-author">' + escapeHtml(authorName) + '</span>' +
      '<span class="comment-time">' + formatDate(comment.createdAt) + '</span>' +
      (isMine ? '<button class="comment-delete" onclick="deleteComment(' + comment.id + ', ' + postId + ')">删除</button>' : '') +
      '</div>' +
      '<div class="comment-content">' + escapeHtml(comment.content) + '</div>' +
      '</div>' +
      '</div>';
  });

  container.innerHTML = html;
}

/**
 * 发表评论
 */
async function addComment(postId) {
  const input = document.getElementById('commentInput');
  if (!input) return;
  const content = input.value.trim();
  if (!content) {
    showToast('请输入评论内容', 'warning');
    return;
  }

  try {
    const res = await API.community.addComment(postId, content);
    if (res.success) {
      showToast('评论成功', 'success');
      input.value = '';
      // 刷新评论列表
      await loadComments(postId);
      // 更新详情帖子的评论数
      if (currentDetailPost && currentDetailPost.id === postId) {
        currentDetailPost.commentsCount = (currentDetailPost.commentsCount || 0) + 1;
      }
    } else {
      showToast(res.message || '评论失败', 'error');
    }
  } catch (err) {
    showToast(err.message || '评论失败', 'error');
  }
}

// ===== 删除 =====

/**
 * 删除帖子
 */
function deletePost(postId) {
  showConfirm('确定要删除这篇帖子吗？此操作不可撤销。', async function () {
    try {
      const res = await API.community.deletePost(postId);
      if (res.success) {
        showToast('帖子已删除', 'success');
        // 关闭详情模态框
        closeAllModals();
        // 刷新当前列表
        if (currentTab === 'feed') {
          loadFeed(currentPage);
        } else if (currentTab === 'hot') {
          loadHot();
        } else if (currentTab === 'mine') {
          loadMine();
        }
      } else {
        showToast(res.message || '删除失败', 'error');
      }
    } catch (err) {
      showToast(err.message || '删除失败', 'error');
    }
  });
}

/**
 * 删除评论
 */
function deleteComment(commentId, postId) {
  showConfirm('确定要删除这条评论吗？', async function () {
    try {
      const res = await API.community.deleteComment(commentId);
      if (res.success) {
        showToast('评论已删除', 'success');
        // 刷新评论列表
        await loadComments(postId);
        // 更新详情帖子的评论数
        if (currentDetailPost && currentDetailPost.id === postId) {
          currentDetailPost.commentsCount = Math.max(0, (currentDetailPost.commentsCount || 0) - 1);
        }
      } else {
        showToast(res.message || '删除失败', 'error');
      }
    } catch (err) {
      showToast(err.message || '删除失败', 'error');
    }
  });
}

// ===== 工具函数 =====

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
