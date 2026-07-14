/**
 * 社区页面 - community.js
 * 功能：匿名身份管理、帖子列表、发帖、评论、点赞
 */
(function () {
  'use strict';

  // ========== 工具函数 ==========

  /**
   * 获取 token
   */
  function getToken() {
    return localStorage.getItem('token') || localStorage.getItem('accessToken');
  }

  /**
   * 封装 API 请求
   */
  function apiRequest(url, options) {
    var token = getToken();
    var headers = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = 'Bearer ' + token;
    }
    return fetch(url, Object.assign({ headers: headers }, options))
      .then(function (res) {
        return res.json().then(function (data) {
          if (res.ok) return data;
          return Promise.reject(data);
        });
      });
  }

  /**
   * 格式化时间
   */
  function formatTime(dateStr) {
    if (!dateStr) return '';
    var d = new Date(dateStr);
    var now = new Date();
    var diff = Math.floor((now - d) / 1000);
    if (diff < 60) return '刚刚';
    if (diff < 3600) return Math.floor(diff / 60) + '分钟前';
    if (diff < 86400) return Math.floor(diff / 3600) + '小时前';
    if (diff < 604800) return Math.floor(diff / 86400) + '天前';
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    var dd = String(d.getDate()).padStart(2, '0');
    var hh = String(d.getHours()).padStart(2, '0');
    var mi = String(d.getMinutes()).padStart(2, '0');
    return mm + '-' + dd + ' ' + hh + ':' + mi;
  }

  /**
   * 根据昵称生成头像颜色
   */
  function getAvatarColor(nickname) {
    if (!nickname) return '#0d9488';
    var colors = [
      '#0d9488', '#f59e0b', '#ef4444', '#8b5cf6',
      '#3b82f6', '#ec4899', '#14b8a6', '#f97316',
      '#6366f1', '#10b981', '#e11d48', '#0ea5e9'
    ];
    var hash = 0;
    for (var i = 0; i < nickname.length; i++) {
      hash = nickname.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  /**
   * 生成匿名头像 HTML（彩色圆圈 + 首字母）
   */
  function renderAvatar(nickname) {
    var color = getAvatarColor(nickname);
    var letter = nickname ? nickname.charAt(0).toUpperCase() : '?';
    return '<div class="anonymous-avatar" style="background-color:' + color + ';">' + escapeHtml(letter) + '</div>';
  }

  /**
   * HTML 转义
   */
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /**
   * 生成随机昵称
   */
  function generateRandomNickname() {
    var prefixes = ['养生达人', '健康先锋', '活力使者', '轻养小能手', '健康达人'];
    var prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    var num = Math.floor(Math.random() * 9000) + 1000;
    return prefix + num;
  }

  // ========== 状态管理 ==========

  var state = {
    profile: null,       // 当前匿名身份
    posts: [],           // 帖子列表
    expandedPosts: {},   // 已展开的帖子 id 集合
    likedPosts: {},      // 已点赞的帖子 id 集合
    commentsVisible: {}, // 显示评论区的帖子 id 集合
    comments: {},        // 帖子评论缓存 { postId: [comments] }
    loading: false
  };

  // ========== API 调用 ==========

  /**
   * 获取用户的匿名身份（通过发帖接口隐式获取，或直接检查）
   * 这里尝试发帖来检测，简单方案：直接查看是否有 profile
   */
  function fetchProfile() {
    return apiRequest('/api/v1/community/posts', { method: 'GET' })
      .then(function (res) {
        // 帖子列表不直接返回 profile 信息
        // 我们需要在发帖时自动创建，或者通过专门的接口获取
        // 后端目前没有 GET /profiles 接口
        // 策略：尝试创建一次匿名身份，如果已存在则返回已有的
        return createProfile();
      })
      .catch(function () {
        return null;
      });
  }

  /**
   * 创建匿名身份
   */
  function createProfile(nickname) {
    return apiRequest('/api/v1/community/profiles', {
      method: 'POST',
      body: JSON.stringify({ nickname: nickname || undefined })
    });
  }

  /**
   * 获取帖子列表
   */
  function fetchPosts() {
    state.loading = true;
    return apiRequest('/api/v1/community/posts?page=1&limit=20', {
      method: 'GET'
    });
  }

  /**
   * 发帖
   */
  function createPost(content) {
    return apiRequest('/api/v1/community/posts', {
      method: 'POST',
      body: JSON.stringify({ content: content })
    });
  }

  /**
   * 发表评论
   */
  function createComment(postId, content) {
    return apiRequest('/api/v1/community/posts/' + postId + '/comments', {
      method: 'POST',
      body: JSON.stringify({ content: content })
    });
  }

  // ========== 渲染函数 ==========

  /**
   * 注入社区页面样式
   */
  function injectStyles() {
    if (document.getElementById('community-page-style')) return;
    var style = document.createElement('style');
    style.id = 'community-page-style';
    style.textContent = '\
/* ===== 社区页面样式 ===== */\
.community-page { padding: 16px; padding-bottom: 80px; }\
\
/* 社区头部 */\
.community-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }\
.community-header .tag { background: linear-gradient(135deg, #0d9488, #14b8a6); color: #fff; padding: 6px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; }\
.community-header .btn-post { background: linear-gradient(135deg, #0d9488, #0d9488); color: #fff; border: none; padding: 8px 20px; border-radius: 20px; font-size: 14px; cursor: pointer; transition: opacity 0.2s; }\
.community-header .btn-post:active { opacity: 0.8; }\
\
/* 身份提示 */\
.profile-notice { background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 12px; padding: 14px 16px; margin-bottom: 16px; text-align: center; }\
.profile-notice p { color: #0f766e; font-size: 13px; margin-bottom: 10px; }\
.profile-notice .btn-create-profile { background: linear-gradient(135deg, #0d9488, #14b8a6); color: #fff; border: none; padding: 10px 28px; border-radius: 20px; font-size: 14px; cursor: pointer; font-weight: 500; }\
\
/* 帖子卡片 */\
.post-card { background: #fff; border-radius: 12px; padding: 16px; margin-bottom: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); border: 1px solid #f1f5f9; }\
.post-card .post-header { display: flex; align-items: center; margin-bottom: 12px; }\
.post-card .post-header .post-meta { margin-left: 10px; flex: 1; }\
.post-card .post-header .post-nickname { font-size: 14px; font-weight: 600; color: #334155; }\
.post-card .post-header .post-time { font-size: 12px; color: #94a3b8; margin-top: 2px; }\
\
/* 匿名头像 */\
.anonymous-avatar { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 18px; font-weight: 700; flex-shrink: 0; }\
.anonymous-avatar.small { width: 32px; height: 32px; font-size: 14px; }\
\
/* 帖子内容 */\
.post-content { font-size: 15px; color: #334155; line-height: 1.6; margin-bottom: 12px; word-break: break-all; }\
.post-content.collapsed { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }\
.post-content .btn-expand { color: #0d9488; font-size: 13px; cursor: pointer; margin-left: 4px; }\
\
/* 帖子操作栏 */\
.post-actions { display: flex; align-items: center; gap: 20px; padding-top: 10px; border-top: 1px solid #f1f5f9; }\
.post-actions .action-btn { display: flex; align-items: center; gap: 4px; background: none; border: none; color: #64748b; font-size: 13px; cursor: pointer; padding: 4px 8px; border-radius: 6px; transition: all 0.2s; }\
.post-actions .action-btn:active { background: #f1f5f9; }\
.post-actions .action-btn.liked { color: #ef4444; }\
.post-actions .action-btn .icon { font-size: 16px; }\
\
/* 评论区 */\
.comments-section { margin-top: 12px; padding-top: 12px; border-top: 1px solid #f1f5f9; }\
.comments-section .comment-item { display: flex; align-items: flex-start; padding: 8px 0; gap: 8px; }\
.comments-section .comment-item .comment-body { flex: 1; }\
.comments-section .comment-item .comment-nickname { font-size: 13px; font-weight: 600; color: #334155; }\
.comments-section .comment-item .comment-text { font-size: 13px; color: #64748b; margin-top: 2px; line-height: 1.5; word-break: break-all; }\
.comments-section .comment-item .comment-time { font-size: 11px; color: #94a3b8; margin-top: 2px; }\
\
/* 评论输入 */\
.comment-input-wrap { display: flex; align-items: center; gap: 8px; margin-top: 10px; padding-top: 10px; border-top: 1px solid #f1f5f9; }\
.comment-input-wrap input { flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 20px; padding: 8px 14px; font-size: 13px; outline: none; transition: border-color 0.2s; }\
.comment-input-wrap input:focus { border-color: #0d9488; }\
.comment-input-wrap .btn-send { background: #0d9488; color: #fff; border: none; padding: 8px 16px; border-radius: 20px; font-size: 13px; cursor: pointer; white-space: nowrap; }\
\
/* 发帖弹窗 */\
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: flex-end; justify-content: center; animation: fadeIn 0.2s ease; }\
.modal-content { background: #fff; width: 100%; max-width: 480px; border-radius: 16px 16px 0 0; padding: 20px; animation: slideUp 0.3s ease; }\
.modal-content .modal-title { font-size: 16px; font-weight: 600; color: #1e293b; margin-bottom: 16px; text-align: center; }\
.modal-content textarea { width: 100%; height: 150px; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; font-size: 15px; resize: none; outline: none; font-family: inherit; box-sizing: border-box; transition: border-color 0.2s; }\
.modal-content textarea:focus { border-color: #0d9488; }\
.modal-content .modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 16px; }\
.modal-content .modal-actions button { padding: 10px 24px; border-radius: 20px; font-size: 14px; cursor: pointer; border: none; }\
.modal-content .modal-actions .btn-cancel { background: #f1f5f9; color: #64748b; }\
.modal-content .modal-actions .btn-submit { background: linear-gradient(135deg, #0d9488, #14b8a6); color: #fff; font-weight: 500; }\
.modal-content .char-count { text-align: right; font-size: 12px; color: #94a3b8; margin-top: 6px; }\
\
/* 创建身份弹窗 */\
.create-profile-form { padding: 10px 0; }\
.create-profile-form label { display: block; font-size: 14px; color: #475569; margin-bottom: 6px; }\
.create-profile-form input { width: 100%; padding: 10px 14px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 14px; outline: none; box-sizing: border-box; margin-bottom: 16px; }\
.create-profile-form input:focus { border-color: #0d9488; }\
.create-profile-form .hint { font-size: 12px; color: #94a3b8; margin-top: -12px; margin-bottom: 16px; }\
\
/* 空状态 */\
.empty-state { text-align: center; padding: 48px 20px; color: #94a3b8; }\
.empty-state .empty-icon { font-size: 48px; margin-bottom: 12px; }\
.empty-state p { font-size: 14px; }\
\
/* 加载中 */\
.loading-spinner { text-align: center; padding: 32px; color: #94a3b8; font-size: 14px; }\
\
/* Toast 提示 */\
.toast { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: #1e293b; color: #fff; padding: 10px 24px; border-radius: 8px; font-size: 14px; z-index: 2000; animation: fadeIn 0.2s ease; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }\
\
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }\
@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }\
    ';
    document.head.appendChild(style);
  }

  /**
   * 显示 Toast 提示
   */
  function showToast(msg, duration) {
    duration = duration || 2000;
    var existing = document.querySelector('.toast');
    if (existing) existing.remove();
    var toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(function () {
      toast.remove();
    }, duration);
  }

  /**
   * 渲染帖子卡片
   */
  function renderPostCard(post) {
    var expanded = state.expandedPosts[post.id];
    var liked = state.likedPosts[post.id];
    var showComments = state.commentsVisible[post.id];
    var likes = post.likes || 0;
    var likedClass = liked ? ' liked' : '';
    var likesDisplay = liked ? likes + 1 : likes;

    var contentHtml = escapeHtml(post.content);
    var longContent = post.content && post.content.length > 100;
    var contentClass = (longContent && !expanded) ? ' collapsed' : '';
    var expandBtn = (longContent && !expanded) ? '<span class="btn-expand" data-action="expand" data-id="' + post.id + '">...展开</span>' : '';

    // 评论列表
    var commentsHtml = '';
    if (showComments) {
      var comments = state.comments[post.id] || [];
      if (comments.length > 0) {
        comments.forEach(function (c) {
          commentsHtml += '\
            <div class="comment-item">\
              ' + renderAvatar(c.nickname || '').replace('anonymous-avatar', 'anonymous-avatar small') + '\
              <div class="comment-body">\
                <div class="comment-nickname">' + escapeHtml(c.nickname || '匿名用户') + '</div>\
                <div class="comment-text">' + escapeHtml(c.content) + '</div>\
                <div class="comment-time">' + formatTime(c.created_at) + '</div>\
              </div>\
            </div>';
        });
      } else {
        commentsHtml = '<div style="text-align:center;color:#94a3b8;font-size:13px;padding:12px 0;">暂无评论</div>';
      }

      commentsHtml += '\
        <div class="comment-input-wrap">\
          <input type="text" placeholder="写评论..." data-comment-input="' + post.id + '" maxlength="500">\
          <button class="btn-send" data-action="send-comment" data-id="' + post.id + '">发送</button>\
        </div>';
    }

    return '\
      <div class="post-card" data-post-id="' + post.id + '">\
        <div class="post-header">\
          ' + renderAvatar(post.nickname || '') + '\
          <div class="post-meta">\
            <div class="post-nickname">' + escapeHtml(post.nickname || '匿名用户') + '</div>\
            <div class="post-time">' + formatTime(post.created_at) + '</div>\
          </div>\
        </div>\
        <div class="post-content' + contentClass + '">' + contentHtml + expandBtn + '</div>\
        <div class="post-actions">\
          <button class="action-btn' + likedClass + '" data-action="like" data-id="' + post.id + '">\
            <span class="icon">' + (liked ? '&#10084;' : '&#9825;') + '</span>\
            <span class="like-count">' + likesDisplay + '</span>\
          </button>\
          <button class="action-btn" data-action="toggle-comments" data-id="' + post.id + '">\
            <span class="icon">&#9993;</span>\
            <span>' + (post.comment_count || 0) + '</span>\
          </button>\
        </div>\
        ' + (showComments ? '<div class="comments-section">' + commentsHtml + '</div>' : '') + '\
      </div>';
  }

  /**
   * 渲染整个社区页面
   */
  function render(container) {
    injectStyles();

    var html = '\
      <div class="community-page">\
        <div class="community-header">\
          <span class="tag">&#127758; 轻养社区</span>\
          <button class="btn-post" id="btn-create-post">+ 发帖</button>\
        </div>\
        <div id="profile-notice-area"></div>\
        <div id="posts-container">\
          <div class="loading-spinner">加载中...</div>\
        </div>\
      </div>';

    container.innerHTML = html;
    bindEvents(container);
    loadPosts(container);
  }

  /**
   * 绑定事件
   */
  function bindEvents(container) {
    // 发帖按钮
    var btnCreatePost = container.querySelector('#btn-create-post');
    if (btnCreatePost) {
      btnCreatePost.addEventListener('click', function () {
        showPostModal();
      });
    }

    // 帖子列表事件代理
    var postsContainer = container.querySelector('#posts-container');
    if (postsContainer) {
      postsContainer.addEventListener('click', function (e) {
        var target = e.target.closest('[data-action]');
        if (!target) return;

        var action = target.getAttribute('data-action');
        var id = parseInt(target.getAttribute('data-id'));

        switch (action) {
          case 'expand':
            state.expandedPosts[id] = true;
            refreshPosts();
            break;
          case 'like':
            handleLike(id);
            break;
          case 'toggle-comments':
            handleToggleComments(id);
            break;
          case 'send-comment':
            handleSendComment(id);
            break;
        }
      });
    }

    // 评论输入回车提交
    postsContainer.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.target.matches('[data-comment-input]')) {
        var postId = parseInt(e.target.getAttribute('data-comment-input'));
        handleSendComment(postId);
      }
    });
  }

  /**
   * 加载帖子列表
   */
  function loadPosts(container) {
    var postsContainer = container.querySelector('#posts-container');
    fetchPosts().then(function (res) {
      state.loading = false;
      if (res.code === 0 && res.data) {
        state.posts = res.data.posts || [];
        refreshPosts();
        checkProfileNotice(container);
      } else {
        postsContainer.innerHTML = '<div class="empty-state"><div class="empty-icon">&#128172;</div><p>暂无帖子，快来发布第一条吧</p></div>';
      }
    }).catch(function (err) {
      state.loading = false;
      console.error('加载帖子失败:', err);
      postsContainer.innerHTML = '<div class="empty-state"><div class="empty-icon">&#128533;</div><p>加载失败，请稍后重试</p></div>';
    });
  }

  /**
   * 刷新帖子渲染
   */
  function refreshPosts() {
    var postsContainer = document.querySelector('#posts-container');
    if (!postsContainer) return;

    if (state.posts.length === 0) {
      postsContainer.innerHTML = '<div class="empty-state"><div class="empty-icon">&#128172;</div><p>暂无帖子，快来发布第一条吧</p></div>';
      return;
    }

    var html = '';
    state.posts.forEach(function (post) {
      html += renderPostCard(post);
    });
    postsContainer.innerHTML = html;
  }

  /**
   * 检查并显示身份提示
   */
  function checkProfileNotice(container) {
    // 简单策略：尝试获取帖子时，如果发帖失败提示需要创建身份
    // 由于后端发帖时会自动创建身份，这里只在页面上提供显式创建入口
    var noticeArea = container.querySelector('#profile-notice-area');
    if (!noticeArea) return;

    // 检查 localStorage 中是否有 profile 信息
    var savedProfile = localStorage.getItem('community_profile');
    if (savedProfile) {
      state.profile = JSON.parse(savedProfile);
      return; // 已有身份，不显示提示
    }

    // 显示创建身份提示
    noticeArea.innerHTML = '\
      <div class="profile-notice">\
        <p>&#127758; 加入轻养社区，创建一个匿名身份分享你的健康故事</p>\
        <button class="btn-create-profile" id="btn-create-profile">创建匿名身份</button>\
      </div>';

    noticeArea.querySelector('#btn-create-profile').addEventListener('click', function () {
      showCreateProfileModal();
    });
  }

  /**
   * 显示创建身份弹窗
   */
  function showCreateProfileModal() {
    var randomName = generateRandomNickname();
    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = '\
      <div class="modal-content">\
        <div class="modal-title">创建匿名身份</div>\
        <div class="create-profile-form">\
          <label>匿名昵称</label>\
          <input type="text" id="input-nickname" placeholder="' + escapeHtml(randomName) + '" maxlength="20">\
          <div class="hint">留空将自动生成随机昵称</div>\
        </div>\
        <div class="modal-actions">\
          <button class="btn-cancel" id="btn-profile-cancel">取消</button>\
          <button class="btn-submit" id="btn-profile-confirm">确认创建</button>\
        </div>\
      </div>';

    document.body.appendChild(overlay);

    // 点击遮罩关闭
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) overlay.remove();
    });

    overlay.querySelector('#btn-profile-cancel').addEventListener('click', function () {
      overlay.remove();
    });

    overlay.querySelector('#btn-profile-confirm').addEventListener('click', function () {
      var nickname = overlay.querySelector('#input-nickname').value.trim();
      var btnConfirm = overlay.querySelector('#btn-profile-confirm');
      btnConfirm.disabled = true;
      btnConfirm.textContent = '创建中...';

      createProfile(nickname || undefined).then(function (res) {
        if (res.code === 0 && res.data) {
          state.profile = res.data;
          localStorage.setItem('community_profile', JSON.stringify(res.data));
          showToast('匿名身份创建成功');
          overlay.remove();

          // 隐藏提示
          var noticeArea = document.querySelector('#profile-notice-area');
          if (noticeArea) noticeArea.innerHTML = '';
        } else {
          showToast(res.message || '创建失败');
          btnConfirm.disabled = false;
          btnConfirm.textContent = '确认创建';
        }
      }).catch(function (err) {
        showToast('创建失败，请稍后重试');
        btnConfirm.disabled = false;
        btnConfirm.textContent = '确认创建';
      });
    });
  }

  /**
   * 显示发帖弹窗
   */
  function showPostModal() {
    // 如果没有身份，先提示创建
    if (!state.profile) {
      showCreateProfileModal();
      return;
    }

    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = '\
      <div class="modal-content">\
        <div class="modal-title">发布帖子</div>\
        <textarea id="input-post-content" placeholder="分享你的健康心得、养生经验..." maxlength="2000"></textarea>\
        <div class="char-count"><span id="post-char-count">0</span>/2000</div>\
        <div class="modal-actions">\
          <button class="btn-cancel" id="btn-post-cancel">取消</button>\
          <button class="btn-submit" id="btn-post-submit">发布</button>\
        </div>\
      </div>';

    document.body.appendChild(overlay);

    var textarea = overlay.querySelector('#input-post-content');
    var charCount = overlay.querySelector('#post-char-count');
    textarea.addEventListener('input', function () {
      charCount.textContent = textarea.value.length;
    });

    // 点击遮罩关闭
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) overlay.remove();
    });

    overlay.querySelector('#btn-post-cancel').addEventListener('click', function () {
      overlay.remove();
    });

    overlay.querySelector('#btn-post-submit').addEventListener('click', function () {
      var content = textarea.value.trim();
      if (!content) {
        showToast('请输入帖子内容');
        return;
      }

      var btnSubmit = overlay.querySelector('#btn-post-submit');
      btnSubmit.disabled = true;
      btnSubmit.textContent = '发布中...';

      createPost(content).then(function (res) {
        if (res.code === 0) {
          showToast('发布成功 +2积分');
          overlay.remove();

          // 刷新帖子列表
          fetchPosts().then(function (fetchRes) {
            if (fetchRes.code === 0 && fetchRes.data) {
              state.posts = fetchRes.data.posts || [];
              refreshPosts();
            }
          });
        } else {
          showToast(res.message || '发布失败');
          btnSubmit.disabled = false;
          btnSubmit.textContent = '发布';
        }
      }).catch(function () {
        showToast('发布失败，请稍后重试');
        btnSubmit.disabled = false;
        btnSubmit.textContent = '发布';
      });
    });
  }

  /**
   * 点赞处理
   */
  function handleLike(postId) {
    if (state.likedPosts[postId]) {
      state.likedPosts[postId] = false;
    } else {
      state.likedPosts[postId] = true;
    }
    refreshPosts();
  }

  /**
   * 切换评论显示
   */
  function handleToggleComments(postId) {
    if (state.commentsVisible[postId]) {
      state.commentsVisible[postId] = false;
      refreshPosts();
      return;
    }

    state.commentsVisible[postId] = true;
    // 尝试加载评论（后端目前没有独立获取评论接口，通过帖子列表中的 comment_count 展示）
    state.comments[postId] = [];
    refreshPosts();
  }

  /**
   * 发送评论
   */
  function handleSendComment(postId) {
    var input = document.querySelector('[data-comment-input="' + postId + '"]');
    if (!input) return;

    var content = input.value.trim();
    if (!content) {
      showToast('请输入评论内容');
      return;
    }

    // 如果没有身份，先创建
    if (!state.profile) {
      createProfile().then(function (res) {
        if (res.code === 0 && res.data) {
          state.profile = res.data;
          localStorage.setItem('community_profile', JSON.stringify(res.data));
          doSendComment(postId, content);
        } else {
          showToast('请先创建匿名身份');
        }
      }).catch(function () {
        showToast('操作失败，请稍后重试');
      });
      return;
    }

    doSendComment(postId, content);
  }

  function doSendComment(postId, content) {
    createComment(postId, content).then(function (res) {
      if (res.code === 0) {
        showToast('评论成功 +1积分');
        // 将新评论添加到本地缓存
        if (!state.comments[postId]) state.comments[postId] = [];
        state.comments[postId].push(res.data);
        // 更新帖子评论计数
        state.posts.forEach(function (p) {
          if (p.id === postId) {
            p.comment_count = (p.comment_count || 0) + 1;
          }
        });
        refreshPosts();
      } else {
        showToast(res.message || '评论失败');
      }
    }).catch(function () {
      showToast('评论失败，请稍后重试');
    });
  }

  // ========== 暴露全局接口 ==========

  window.Pages = window.Pages || {};
  window.Pages.community = render;

})();
