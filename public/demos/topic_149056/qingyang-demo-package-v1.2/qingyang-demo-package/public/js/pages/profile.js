/**
 * 个人中心页面 - profile.js
 * 功能：用户信息、积分等级、排行榜、功能列表、退出登录
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
   * 获取用户信息
   */
  function getUserInfo() {
    var saved = localStorage.getItem('userInfo');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return null; }
    }
    return null;
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
   * 手机号脱敏
   */
  function maskPhone(phone) {
    if (!phone) return '未绑定';
    if (phone.length === 11) {
      return phone.slice(0, 3) + '****' + phone.slice(7);
    }
    return phone;
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
   * 格式化日期
   */
  function formatDate(dateStr) {
    if (!dateStr) return '';
    var d = new Date(dateStr);
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var dd = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + dd;
  }

  /**
   * 计算BMI
   */
  function calcBMI(height, weight) {
    if (!height || !weight || height <= 0 || weight <= 0) return null;
    var h = height / 100; // 转为米
    return (weight / (h * h)).toFixed(1);
  }

  /**
   * BMI 评价
   */
  function bmiEvaluate(bmi) {
    if (bmi < 18.5) return { label: '偏瘦', color: '#3b82f6' };
    if (bmi < 24) return { label: '正常', color: '#10b981' };
    if (bmi < 28) return { label: '偏胖', color: '#f59e0b' };
    return { label: '肥胖', color: '#ef4444' };
  }

  /**
   * 根据积分计算等级
   */
  function getLevel(score) {
    score = score || 0;
    if (score >= 2000) return { name: '大师', level: 4, min: 2000, max: 5000, color: '#f59e0b' };
    if (score >= 500) return { name: '专家', level: 3, min: 500, max: 2000, color: '#8b5cf6' };
    if (score >= 100) return { name: '达人', level: 2, min: 100, max: 500, color: '#0d9488' };
    return { name: '新手', level: 1, min: 0, max: 100, color: '#64748b' };
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

  // ========== 状态 ==========

  var state = {
    score: 0,
    leaderboard: null,
    myRank: null,
    userProfile: null
  };

  // ========== 注入样式 ==========

  function injectStyles() {
    if (document.getElementById('profile-page-style')) return;
    var style = document.createElement('style');
    style.id = 'profile-page-style';
    style.textContent = '\
/* ===== 个人中心页面样式 ===== */\
.profile-page { padding: 16px; padding-bottom: 80px; }\
\
/* 用户信息卡片 */\
.user-info-card { background: linear-gradient(135deg, #0d9488, #14b8a6); border-radius: 16px; padding: 24px 20px; color: #fff; margin-bottom: 16px; position: relative; overflow: hidden; }\
.user-info-card::after { content: ""; position: absolute; top: -30px; right: -30px; width: 120px; height: 120px; background: rgba(255,255,255,0.1); border-radius: 50%; }\
.user-info-card::before { content: ""; position: absolute; bottom: -40px; left: -20px; width: 100px; height: 100px; background: rgba(255,255,255,0.08); border-radius: 50%; }\
.user-info-card .user-avatar { width: 56px; height: 56px; border-radius: 50%; background: rgba(255,255,255,0.25); display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 700; margin-bottom: 12px; }\
.user-info-card .user-phone { font-size: 18px; font-weight: 600; margin-bottom: 4px; }\
.user-info-card .user-login-name { font-size: 13px; opacity: 0.85; margin-bottom: 8px; }\
.user-info-card .user-reg-date { font-size: 12px; opacity: 0.7; }\
.user-info-card .bmi-tag { display: inline-block; margin-top: 10px; background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 12px; font-size: 12px; }\
\
/* 积分与等级卡片 */\
.score-card { background: #fff; border-radius: 16px; padding: 20px; margin-bottom: 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); border: 1px solid #f1f5f9; }\
.score-card .score-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }\
.score-card .score-value { font-size: 32px; font-weight: 700; color: #f59e0b; }\
.score-card .score-label { font-size: 13px; color: #94a3b8; margin-top: 2px; }\
.score-card .level-badge { display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; color: #fff; }\
.score-card .progress-wrap { margin-top: 12px; }\
.score-card .progress-info { display: flex; justify-content: space-between; font-size: 12px; color: #94a3b8; margin-bottom: 6px; }\
.score-card .progress-bar { width: 100%; height: 8px; background: #f1f5f9; border-radius: 4px; overflow: hidden; }\
.score-card .progress-fill { height: 100%; border-radius: 4px; transition: width 0.6s ease; }\
.score-card .btn-leaderboard { display: block; width: 100%; margin-top: 16px; padding: 10px; border: 1px dashed #0d9488; background: #f0fdfa; color: #0d9488; border-radius: 10px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s; }\
.score-card .btn-leaderboard:active { background: #ccfbf1; }\
\
/* 功能列表 */\
.menu-section { background: #fff; border-radius: 16px; overflow: hidden; margin-bottom: 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); border: 1px solid #f1f5f9; }\
.menu-section .section-title { font-size: 13px; color: #94a3b8; padding: 12px 16px 8px; font-weight: 500; }\
.menu-item { display: flex; align-items: center; padding: 14px 16px; border-bottom: 1px solid #f8fafc; cursor: pointer; transition: background 0.15s; text-decoration: none; color: inherit; }\
.menu-item:last-child { border-bottom: none; }\
.menu-item:active { background: #f8fafc; }\
.menu-item .menu-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; margin-right: 12px; flex-shrink: 0; }\
.menu-item .menu-text { flex: 1; font-size: 15px; color: #334155; }\
.menu-item .menu-arrow { color: #cbd5e1; font-size: 14px; }\
.menu-item.danger .menu-text { color: #ef4444; }\
\
/* 排行榜弹窗 */\
.leaderboard-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; animation: fadeIn 0.2s ease; }\
.leaderboard-panel { background: #fff; width: 90%; max-width: 400px; border-radius: 16px; padding: 24px 20px; max-height: 80vh; overflow-y: auto; animation: scaleIn 0.2s ease; }\
.leaderboard-panel .lb-title { font-size: 18px; font-weight: 700; color: #1e293b; text-align: center; margin-bottom: 4px; }\
.leaderboard-panel .lb-subtitle { font-size: 13px; color: #94a3b8; text-align: center; margin-bottom: 20px; }\
.leaderboard-panel .lb-close { position: absolute; top: 16px; right: 16px; background: none; border: none; font-size: 20px; color: #94a3b8; cursor: pointer; }\
\
/* 排行榜条目 */\
.lb-item { display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid #f8fafc; }\
.lb-item:last-child { border-bottom: none; }\
.lb-item.is-self { background: #f0fdfa; border-radius: 10px; padding: 12px; margin: 4px -12px; border: 1px solid #99f6e4; }\
.lb-item .lb-rank { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; margin-right: 12px; flex-shrink: 0; }\
.lb-item .lb-rank.rank-1 { background: linear-gradient(135deg, #f59e0b, #fbbf24); color: #fff; }\
.lb-item .lb-rank.rank-2 { background: linear-gradient(135deg, #94a3b8, #cbd5e1); color: #fff; }\
.lb-item .lb-rank.rank-3 { background: linear-gradient(135deg, #b45309, #d97706); color: #fff; }\
.lb-item .lb-rank.rank-other { background: #f1f5f9; color: #64748b; }\
.lb-item .lb-info { flex: 1; }\
.lb-item .lb-nickname { font-size: 14px; font-weight: 600; color: #334155; }\
.lb-item .lb-score { font-size: 13px; color: #f59e0b; font-weight: 600; }\
.lb-item.is-self .lb-nickname { color: #0d9488; }\
\
/* 积分明细弹窗 */\
.score-detail-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; animation: fadeIn 0.2s ease; }\
.score-detail-panel { background: #fff; width: 90%; max-width: 400px; border-radius: 16px; padding: 24px 20px; max-height: 80vh; overflow-y: auto; animation: scaleIn 0.2s ease; }\
.score-detail-panel .sd-title { font-size: 18px; font-weight: 700; color: #1e293b; text-align: center; margin-bottom: 20px; }\
.sd-item { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f8fafc; }\
.sd-item:last-child { border-bottom: none; }\
.sd-item .sd-event { font-size: 14px; color: #334155; }\
.sd-item .sd-points { font-size: 14px; color: #f59e0b; font-weight: 600; }\
.sd-item .sd-time { font-size: 11px; color: #94a3b8; margin-top: 2px; }\
\
/* 确认弹窗 */\
.confirm-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1100; display: flex; align-items: center; justify-content: center; animation: fadeIn 0.2s ease; }\
.confirm-panel { background: #fff; width: 80%; max-width: 320px; border-radius: 16px; padding: 28px 24px; text-align: center; animation: scaleIn 0.2s ease; }\
.confirm-panel .confirm-msg { font-size: 15px; color: #334155; margin-bottom: 20px; line-height: 1.5; }\
.confirm-panel .confirm-actions { display: flex; gap: 12px; }\
.confirm-panel .confirm-actions button { flex: 1; padding: 10px; border-radius: 10px; font-size: 14px; cursor: pointer; border: none; }\
.confirm-panel .btn-confirm-cancel { background: #f1f5f9; color: #64748b; }\
.confirm-panel .btn-confirm-ok { background: #ef4444; color: #fff; font-weight: 500; }\
\
/* Toast */\
.toast { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: #1e293b; color: #fff; padding: 10px 24px; border-radius: 8px; font-size: 14px; z-index: 2000; animation: fadeIn 0.2s ease; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }\
\
/* 加载中 */\
.loading-spinner { text-align: center; padding: 24px; color: #94a3b8; font-size: 14px; }\
\
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }\
@keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }\
    ';
    document.head.appendChild(style);
  }

  // ========== 数据加载 ==========

  /**
   * 加载积分信息
   */
  function loadScore() {
    return apiRequest('/api/v1/achievements/score', { method: 'GET' })
      .then(function (res) {
        if (res.code === 0 && res.data) {
          state.score = res.data.total_score || 0;
          return res.data;
        }
        return null;
      })
      .catch(function () {
        return null;
      });
  }

  /**
   * 加载排行榜
   */
  function loadLeaderboard() {
    return apiRequest('/api/v1/achievements/leaderboard', { method: 'GET' })
      .then(function (res) {
        if (res.code === 0 && res.data) {
          state.leaderboard = res.data.leaderboard || [];
          state.myRank = res.data.my_rank;
          return res.data;
        }
        return null;
      })
      .catch(function () {
        return null;
      });
  }

  /**
   * 加载用户基础信息
   */
  function loadUserProfile() {
    return apiRequest('/api/v1/health/profile', { method: 'GET' })
      .then(function (res) {
        if (res.code === 0 && res.data) {
          state.userProfile = res.data;
          return res.data;
        }
        return null;
      })
      .catch(function () {
        return null;
      });
  }

  // ========== 渲染 ==========

  /**
   * 渲染整个页面
   */
  function render(container) {
    injectStyles();

    var userInfo = getUserInfo();
    var phone = userInfo ? (userInfo.phone || '') : '';
    var loginName = userInfo ? (userInfo.login_name || '') : '';
    var avatarLetter = loginName ? loginName.charAt(0).toUpperCase() : (phone ? 'U' : '?');

    var html = '\
      <div class="profile-page">\
        <!-- 用户信息卡片 -->\
        <div class="user-info-card">\
          <div class="user-avatar">' + escapeHtml(avatarLetter) + '</div>\
          <div class="user-phone" id="user-phone">' + maskPhone(phone) + '</div>\
          ' + (loginName ? '<div class="user-login-name">' + escapeHtml(loginName) + '</div>' : '') + '\
          <div class="user-reg-date" id="user-reg-date">加载中...</div>\
          <div id="bmi-area"></div>\
        </div>\
\
        <!-- 积分与等级 -->\
        <div class="score-card">\
          <div class="score-header">\
            <div>\
              <div class="score-value" id="score-value">-</div>\
              <div class="score-label">当前积分</div>\
            </div>\
            <span class="level-badge" id="level-badge" style="display:none;"></span>\
          </div>\
          <div class="progress-wrap" id="progress-wrap">\
            <div class="progress-info">\
              <span id="level-name">新手</span>\
              <span id="level-next">下一级：100分</span>\
            </div>\
            <div class="progress-bar">\
              <div class="progress-fill" id="progress-fill" style="width:0%;background:#64748b;"></div>\
            </div>\
          </div>\
          <button class="btn-leaderboard" id="btn-score-detail">&#127942; 查看积分明细</button>\
          <button class="btn-leaderboard" id="btn-leaderboard">&#127941; 查看排行榜</button>\
        </div>\
\
        <!-- 功能列表 -->\
        <div class="menu-section">\
          <div class="section-title">功能</div>\
          <div class="menu-item" data-menu="edit-profile">\
            <div class="menu-icon" style="background:#f0fdfa;color:#0d9488;">&#9998;</div>\
            <span class="menu-text">修改基础信息</span>\
            <span class="menu-arrow">&#10095;</span>\
          </div>\
          <div class="menu-item" data-menu="health-data">\
            <div class="menu-icon" style="background:#fef3c7;color:#f59e0b;">&#128137;</div>\
            <span class="menu-text">录入体检数据</span>\
            <span class="menu-arrow">&#10095;</span>\
          </div>\
          <div class="menu-item" data-menu="health-report">\
            <div class="menu-icon" style="background:#ede9fe;color:#8b5cf6;">&#128202;</div>\
            <span class="menu-text">查看健康报告</span>\
            <span class="menu-arrow">&#10095;</span>\
          </div>\
          <div class="menu-item" data-menu="set-reminder">\
            <div class="menu-icon" style="background:#fce7f3;color:#ec4899;">&#9200;</div>\
            <span class="menu-text">设置提醒时间</span>\
            <span class="menu-arrow">&#10095;</span>\
          </div>\
        </div>\
\
        <div class="menu-section">\
          <div class="section-title">其他</div>\
          <div class="menu-item" data-menu="about">\
            <div class="menu-icon" style="background:#f1f5f9;color:#64748b;">&#9432;</div>\
            <span class="menu-text">关于轻养助手</span>\
            <span class="menu-arrow">&#10095;</span>\
          </div>\
          <div class="menu-item danger" data-menu="logout">\
            <div class="menu-icon" style="background:#fef2f2;color:#ef4444;">&#10145;</div>\
            <span class="menu-text">退出登录</span>\
            <span class="menu-arrow">&#10095;</span>\
          </div>\
        </div>\
      </div>';

    container.innerHTML = html;
    bindEvents(container);
    loadData(container);
  }

  /**
   * 加载数据
   */
  function loadData(container) {
    // 并行加载积分和用户信息
    Promise.all([
      loadScore(),
      loadUserProfile()
    ]).then(function (results) {
      var scoreData = results[0];
      var profileData = results[1];

      // 更新积分与等级
      updateScoreUI(scoreData);

      // 更新用户信息
      updateProfileUI(profileData);

      // 更新注册日期
      var userInfo = getUserInfo();
      var regDateEl = container.querySelector('#user-reg-date');
      if (regDateEl) {
        regDateEl.textContent = '注册于 ' + (userInfo && userInfo.created_at ? formatDate(userInfo.created_at) : '未知');
      }
    });
  }

  /**
   * 更新积分 UI
   */
  function updateScoreUI(scoreData) {
    var score = scoreData ? scoreData.total_score : 0;
    var levelInfo = getLevel(score);

    // 积分数值
    var scoreValueEl = document.querySelector('#score-value');
    if (scoreValueEl) scoreValueEl.textContent = score;

    // 等级徽章
    var levelBadgeEl = document.querySelector('#level-badge');
    if (levelBadgeEl) {
      levelBadgeEl.textContent = levelInfo.name;
      levelBadgeEl.style.display = 'inline-block';
      levelBadgeEl.style.background = levelInfo.color;
    }

    // 进度条
    var levelNameEl = document.querySelector('#level-name');
    var levelNextEl = document.querySelector('#level-next');
    var progressFillEl = document.querySelector('#progress-fill');

    if (levelNameEl) levelNameEl.textContent = levelInfo.name;

    if (levelInfo.level === 4) {
      // 已满级
      if (levelNextEl) levelNextEl.textContent = '已达到最高等级';
      if (progressFillEl) {
        progressFillEl.style.width = '100%';
        progressFillEl.style.background = levelInfo.color;
      }
    } else {
      if (levelNextEl) levelNextEl.textContent = '下一级：' + levelInfo.max + '分';
      var progress = Math.min(((score - levelInfo.min) / (levelInfo.max - levelInfo.min)) * 100, 100);
      if (progressFillEl) {
        progressFillEl.style.width = progress + '%';
        progressFillEl.style.background = levelInfo.color;
      }
    }

    // 保存 scoreData 供积分明细使用
    state.scoreData = scoreData;
  }

  /**
   * 更新用户信息 UI
   */
  function updateProfileUI(profileData) {
    var bmiArea = document.querySelector('#bmi-area');
    if (!bmiArea) return;

    if (profileData && profileData.height && profileData.weight) {
      var bmi = calcBMI(profileData.height, profileData.weight);
      if (bmi) {
        var bmiInfo = bmiEvaluate(parseFloat(bmi));
        bmiArea.innerHTML = '<span class="bmi-tag" style="border:1px solid rgba(255,255,255,0.4);">BMI: ' + bmi + ' (' + bmiInfo.label + ')</span>';
      }
    }
  }

  /**
   * 绑定事件
   */
  function bindEvents(container) {
    // 功能菜单点击
    container.addEventListener('click', function (e) {
      var menuItem = e.target.closest('[data-menu]');
      if (menuItem) {
        var menu = menuItem.getAttribute('data-menu');
        handleMenuAction(menu);
      }
    });

    // 查看积分明细
    var btnScoreDetail = container.querySelector('#btn-score-detail');
    if (btnScoreDetail) {
      btnScoreDetail.addEventListener('click', function () {
        showScoreDetail();
      });
    }

    // 查看排行榜
    var btnLeaderboard = container.querySelector('#btn-leaderboard');
    if (btnLeaderboard) {
      btnLeaderboard.addEventListener('click', function () {
        showLeaderboard();
      });
    }
  }

  /**
   * 处理菜单操作
   */
  function handleMenuAction(menu) {
    switch (menu) {
      case 'edit-profile':
        showEditProfile();
        break;
      case 'health-data':
        window.location.hash = '#/analysis';
        break;
      case 'health-report':
        showHealthReport();
        break;
      case 'set-reminder':
        showReminderSetting();
        break;
      case 'about':
        showAbout();
        break;
      case 'logout':
        showLogoutConfirm();
        break;
    }
  }

  /**
   * 修改基础信息
   */
  function showEditProfile() {
    var profile = state.userProfile || {};
    var overlay = document.createElement('div');
    overlay.className = 'leaderboard-overlay';
    overlay.innerHTML = '\
      <div class="leaderboard-panel" style="position:relative;max-height:85vh;overflow-y:auto;">\
        <button class="lb-close" id="edit-profile-close">&times;</button>\
        <div class="lb-title">&#9998; 修改基础信息</div>\
        <div style="padding:16px 0;">\
          <div class="form-group">\
            <label class="form-label" style="display:block;font-size:14px;font-weight:500;color:#334155;margin-bottom:6px;">身高 (cm)</label>\
            <input class="form-input" type="number" id="edit-height" value="' + (profile.height || '') + '" placeholder="170" style="width:100%;height:48px;padding:0 14px;background:#f1f5f9;border:1.5px solid transparent;border-radius:8px;font-size:15px;">\
          </div>\
          <div class="form-group">\
            <label class="form-label" style="display:block;font-size:14px;font-weight:500;color:#334155;margin-bottom:6px;">体重 (kg)</label>\
            <input class="form-input" type="number" id="edit-weight" value="' + (profile.weight || '') + '" placeholder="65" style="width:100%;height:48px;padding:0 14px;background:#f1f5f9;border:1.5px solid transparent;border-radius:8px;font-size:15px;">\
          </div>\
          <div class="form-group">\
            <label class="form-label" style="display:block;font-size:14px;font-weight:500;color:#334155;margin-bottom:6px;">年龄</label>\
            <input class="form-input" type="number" id="edit-age" value="' + (profile.age || '') + '" placeholder="30" style="width:100%;height:48px;padding:0 14px;background:#f1f5f9;border:1.5px solid transparent;border-radius:8px;font-size:15px;">\
          </div>\
          <div class="form-group">\
            <label class="form-label" style="display:block;font-size:14px;font-weight:500;color:#334155;margin-bottom:6px;">性别</label>\
            <select id="edit-gender" style="width:100%;height:48px;padding:0 14px;background:#f1f5f9;border:1.5px solid transparent;border-radius:8px;font-size:15px;">\
              <option value="male"' + (profile.gender === 'male' ? ' selected' : '') + '>男</option>\
              <option value="female"' + (profile.gender === 'female' ? ' selected' : '') + '>女</option>\
            </select>\
          </div>\
          <button id="btn-save-profile" style="width:100%;height:48px;background:#0d9488;color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer;margin-top:8px;">保存</button>\
        </div>\
      </div>';

    document.body.appendChild(overlay);

    overlay.querySelector('#edit-profile-close').addEventListener('click', function () {
      overlay.remove();
    });
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) overlay.remove();
    });

    overlay.querySelector('#btn-save-profile').addEventListener('click', function () {
      var height = parseFloat(document.getElementById('edit-height').value) || null;
      var weight = parseFloat(document.getElementById('edit-weight').value) || null;
      var age = parseInt(document.getElementById('edit-age').value) || null;
      var gender = document.getElementById('edit-gender').value;

      var btn = overlay.querySelector('#btn-save-profile');
      btn.disabled = true;
      btn.textContent = '保存中...';

      apiRequest('/api/v1/health/profile', {
        method: 'PUT',
        body: JSON.stringify({ height: height, weight: weight, age: age, gender: gender })
      }).then(function (res) {
        btn.disabled = false;
        btn.textContent = '保存';
        if (res.code === 0) {
          state.userProfile = res.data;
          showToast('保存成功');
          overlay.remove();
          // Refresh profile page to update BMI display
          updateProfileUI(res.data);
        } else {
          showToast(res.message || '保存失败');
        }
      }).catch(function () {
        btn.disabled = false;
        btn.textContent = '保存';
        showToast('网络错误，请重试');
      });
    });
  }

  /**
   * 查看健康报告
   */
  function showHealthReport() {
    var overlay = document.createElement('div');
    overlay.className = 'leaderboard-overlay';
    overlay.innerHTML = '\
      <div class="leaderboard-panel" style="position:relative;max-height:85vh;overflow-y:auto;">\
        <button class="lb-close" id="report-close">&times;</button>\
        <div class="lb-title">&#128202; 健康报告</div>\
        <div id="report-content" style="padding:16px 0;"><div class="loading-spinner">加载中...</div></div>\
      </div>';

    document.body.appendChild(overlay);

    overlay.querySelector('#report-close').addEventListener('click', function () {
      overlay.remove();
    });
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) overlay.remove();
    });

    // 加载分析报告
    apiRequest('/api/v1/analysis/report', { method: 'GET' }).then(function (res) {
      var content = overlay.querySelector('#report-content');
      if (!content) return;

      if (res.code === 0 && res.data) {
        var data = res.data;
        var score = data.score || data.overall_score || 0;
        var riskLabel = data.risk_label || '未知';
        var risks = data.risks || [];
        var dietAdvice = data.dietAdvice || data.diet_suggestions || ['保持均衡饮食'];
        var exerciseAdvice = data.exerciseAdvice || data.exercise_suggestions || ['保持规律运动'];
        if (typeof dietAdvice === 'string') dietAdvice = [dietAdvice];
        if (typeof exerciseAdvice === 'string') exerciseAdvice = [exerciseAdvice];

        var scoreColor = score >= 80 ? '#22c55e' : (score >= 60 ? '#f59e0b' : '#ef4444');

        var risksHtml = '';
        if (risks.length === 0) {
          risksHtml = '<div style="color:#22c55e;font-size:14px;padding:8px 0;">&#10004; 各项指标正常</div>';
        } else {
          risks.forEach(function (r) {
            var color = r.level === 'danger' ? '#ef4444' : '#f59e0b';
            risksHtml += '<div style="color:' + color + ';font-size:14px;padding:4px 0;">&#9888; ' + escapeHtml(r.name) + '</div>';
          });
        }

        var dietHtml = '';
        dietAdvice.forEach(function (item) {
          dietHtml += '<li style="font-size:13px;color:#475569;line-height:1.8;">' + escapeHtml(item) + '</li>';
        });
        var exerciseHtml = '';
        exerciseAdvice.forEach(function (item) {
          exerciseHtml += '<li style="font-size:13px;color:#475569;line-height:1.8;">' + escapeHtml(item) + '</li>';
        });

        content.innerHTML = '\
          <div style="text-align:center;padding:16px 0 12px;">\
            <div style="font-size:48px;font-weight:700;color:' + scoreColor + ';">' + score + '</div>\
            <div style="font-size:14px;color:#64748b;">综合健康评分</div>\
            <div style="margin-top:8px;display:inline-block;padding:4px 16px;border-radius:20px;font-size:13px;font-weight:500;background:' + (score >= 80 ? '#dcfce7' : score >= 60 ? '#fef3c7' : '#fee2e2') + ';color:' + scoreColor + ';">' + riskLabel + '</div>\
          </div>\
          <div style="margin:12px 0;padding:12px;background:#f8fafc;border-radius:10px;">\
            <div style="font-size:14px;font-weight:600;color:#334155;margin-bottom:8px;">&#9888; 风险提示</div>\
            ' + risksHtml + '\
          </div>\
          <div style="margin:12px 0;">\
            <div style="font-size:14px;font-weight:600;color:#334155;margin-bottom:8px;">&#127858; 饮食建议</div>\
            <ul style="padding-left:18px;margin:0;">' + dietHtml + '</ul>\
          </div>\
          <div style="margin:12px 0;">\
            <div style="font-size:14px;font-weight:600;color:#334155;margin-bottom:8px;">&#127939; 运动建议</div>\
            <ul style="padding-left:18px;margin:0;">' + exerciseHtml + '</ul>\
          </div>';
      } else {
        content.innerHTML = '<div style="text-align:center;color:#94a3b8;padding:32px;font-size:14px;">' + (res.message || '暂无健康报告数据，请先录入体检数据') + '</div>';
      }
    }).catch(function () {
      var content = overlay.querySelector('#report-content');
      if (content) {
        content.innerHTML = '<div style="text-align:center;color:#94a3b8;padding:32px;font-size:14px;">加载失败，请检查网络后重试</div>';
      }
    });
  }

  /**
   * 设置提醒时间
   */
  function showReminderSetting() {
    var savedTime = localStorage.getItem('reminderTime') || '08:00';
    var enabled = localStorage.getItem('reminderEnabled') !== 'false';

    var overlay = document.createElement('div');
    overlay.className = 'leaderboard-overlay';
    overlay.innerHTML = '\
      <div class="leaderboard-panel" style="position:relative;">\
        <button class="lb-close" id="reminder-close">&times;</button>\
        <div class="lb-title">&#9200; 设置提醒时间</div>\
        <div style="padding:16px 0;">\
          <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid #f1f5f9;">\
            <span style="font-size:15px;color:#334155;">启用每日提醒</span>\
            <label style="position:relative;display:inline-block;width:48px;height:28px;cursor:pointer;">\
              <input type="checkbox" id="reminder-toggle" ' + (enabled ? 'checked' : '') + ' style="opacity:0;width:0;height:0;">\
              <span style="position:absolute;inset:0;background:' + (enabled ? '#0d9488' : '#cbd5e1') + ';border-radius:14px;transition:0.3s;"></span>\
              <span id="reminder-dot" style="position:absolute;top:3px;left:' + (enabled ? '23px' : '3px') + ';width:22px;height:22px;background:#fff;border-radius:50%;transition:0.3s;box-shadow:0 1px 3px rgba(0,0,0,0.2);"></span>\
            </label>\
          </div>\
          <div style="padding:12px 0;">\
            <label style="display:block;font-size:14px;font-weight:500;color:#334155;margin-bottom:8px;">提醒时间</label>\
            <input type="time" id="reminder-time" value="' + savedTime + '" style="width:100%;height:48px;padding:0 14px;background:#f1f5f9;border:1.5px solid transparent;border-radius:8px;font-size:18px;color:#334155;">\
          </div>\
          <div style="padding:8px 0;font-size:13px;color:#94a3b8;">&#128161; 每日将在设定时间提醒你记录健康数据和完成健康任务</div>\
          <button id="btn-save-reminder" style="width:100%;height:48px;background:#0d9488;color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer;margin-top:12px;">保存设置</button>\
        </div>\
      </div>';

    document.body.appendChild(overlay);

    overlay.querySelector('#reminder-close').addEventListener('click', function () {
      overlay.remove();
    });
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) overlay.remove();
    });

    // Toggle switch
    var toggle = overlay.querySelector('#reminder-toggle');
    var dot = overlay.querySelector('#reminder-dot');
    var track = toggle.nextElementSibling;
    toggle.addEventListener('change', function () {
      if (toggle.checked) {
        track.style.background = '#0d9488';
        dot.style.left = '23px';
      } else {
        track.style.background = '#cbd5e1';
        dot.style.left = '3px';
      }
    });

    // Save
    overlay.querySelector('#btn-save-reminder').addEventListener('click', function () {
      var time = document.getElementById('reminder-time').value;
      var isEnabled = document.getElementById('reminder-toggle').checked;
      localStorage.setItem('reminderTime', time);
      localStorage.setItem('reminderEnabled', isEnabled ? 'true' : 'false');
      showToast('提醒设置已保存');
      overlay.remove();
    });
  }

  /**
   * 显示积分明细弹窗
   */
  function showScoreDetail() {
    var scoreData = state.scoreData;
    if (!scoreData) {
      showToast('积分数据加载中，请稍后');
      return;
    }

    var records = scoreData.recent_records || [];
    var typeStats = scoreData.type_stats || [];

    var recordsHtml = '';
    if (records.length > 0) {
      records.forEach(function (r) {
        recordsHtml += '\
          <div class="sd-item">\
            <div>\
              <div class="sd-event">' + getEventName(r.event_type) + '</div>\
              <div class="sd-time">' + formatTime(r.created_at) + '</div>\
            </div>\
            <div class="sd-points">+' + r.points + '</div>\
          </div>';
      });
    } else {
      recordsHtml = '<div style="text-align:center;color:#94a3b8;padding:24px;font-size:14px;">暂无积分记录</div>';
    }

    var overlay = document.createElement('div');
    overlay.className = 'score-detail-overlay';
    overlay.innerHTML = '\
      <div class="score-detail-panel">\
        <div class="sd-title">&#127942; 积分明细</div>\
        ' + recordsHtml + '\
      </div>';

    document.body.appendChild(overlay);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) overlay.remove();
    });
  }

  function getEventName(type) {
    var map = {
      register: '注册奖励',
      confirm_plan: '确认方案',
      daily_feedback: '每日反馈',
      post: '发布帖子',
      comment: '发表评论',
      weekly_complete: '周度完成奖励'
    };
    return map[type] || type;
  }

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
    return mm + '-' + dd;
  }

  /**
   * 显示排行榜弹窗
   */
  function showLeaderboard() {
    var panel = document.createElement('div');
    panel.className = 'leaderboard-overlay';
    panel.innerHTML = '\
      <div class="leaderboard-panel" style="position:relative;">\
        <button class="lb-close" id="lb-close">&times;</button>\
        <div class="lb-title">&#127941; 积分排行榜</div>\
        <div class="lb-subtitle">Top 10 健康达人</div>\
        <div id="lb-list"><div class="loading-spinner">加载中...</div></div>\
      </div>';

    document.body.appendChild(panel);

    // 关闭按钮
    panel.querySelector('#lb-close').addEventListener('click', function () {
      panel.remove();
    });
    panel.addEventListener('click', function (e) {
      if (e.target === panel) panel.remove();
    });

    // 加载排行榜数据
    loadLeaderboard().then(function (data) {
      var lbList = panel.querySelector('#lb-list');
      if (!lbList) return;

      if (!data || !data.leaderboard || data.leaderboard.length === 0) {
        lbList.innerHTML = '<div style="text-align:center;color:#94a3b8;padding:32px;font-size:14px;">暂无排行数据</div>';
        return;
      }

      var html = '';
      data.leaderboard.forEach(function (item) {
        var rankClass = 'rank-other';
        if (item.rank === 1) rankClass = 'rank-1';
        else if (item.rank === 2) rankClass = 'rank-2';
        else if (item.rank === 3) rankClass = 'rank-3';

        var selfClass = item.is_self ? ' is-self' : '';

        html += '\
          <div class="lb-item' + selfClass + '">\
            <div class="lb-rank ' + rankClass + '">' + item.rank + '</div>\
            <div class="lb-info">\
              <div class="lb-nickname">' + escapeHtml(item.nickname) + (item.is_self ? ' (我)' : '') + '</div>\
            </div>\
            <div class="lb-score">' + item.total_score + '分</div>\
          </div>';
      });

      // 显示当前用户排名
      if (data.my_rank && data.my_rank > 10) {
        html += '\
          <div style="text-align:center;padding:12px;color:#94a3b8;font-size:13px;border-top:1px solid #f1f5f9;margin-top:8px;">\
            你的当前排名：第 ' + data.my_rank + ' 名\
          </div>';
      }

      lbList.innerHTML = html;
    });
  }

  /**
   * 显示关于信息
   */
  function showAbout() {
    var overlay = document.createElement('div');
    overlay.className = 'leaderboard-overlay';
    overlay.innerHTML = '\
      <div class="leaderboard-panel" style="position:relative;">\
        <button class="lb-close" id="about-close">&times;</button>\
        <div class="lb-title">&#127793; 关于轻养助手</div>\
        <div style="padding:16px 0;font-size:14px;color:#475569;line-height:1.8;">\
          <p style="margin-bottom:12px;">轻养助手是一款专注于个人健康管理的应用，帮助你记录健康数据、制定养生计划、追踪执行进度。</p>\
          <p style="margin-bottom:12px;"><strong>版本：</strong>测试版 v1.0.0</p>\
          <p style="margin-bottom:12px;"><strong>功能：</strong></p>\
          <ul style="padding-left:20px;margin-bottom:12px;">\
            <li>健康档案管理</li>\
            <li>AI 养生方案</li>\
            <li>每日计划追踪</li>\
            <li>社区交流分享</li>\
            <li>积分与成就系统</li>\
          </ul>\
          <p style="color:#94a3b8;font-size:12px;">本应用为测试版本，数据仅供参考。</p>\
        </div>\
      </div>';

    document.body.appendChild(overlay);
    overlay.querySelector('#about-close').addEventListener('click', function () {
      overlay.remove();
    });
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) overlay.remove();
    });
  }

  /**
   * 退出登录确认
   */
  function showLogoutConfirm() {
    var overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';
    overlay.innerHTML = '\
      <div class="confirm-panel">\
        <div class="confirm-msg">确定要退出登录吗？</div>\
        <div class="confirm-actions">\
          <button class="btn-confirm-cancel" id="logout-cancel">取消</button>\
          <button class="btn-confirm-ok" id="logout-ok">确认退出</button>\
        </div>\
      </div>';

    document.body.appendChild(overlay);

    overlay.querySelector('#logout-cancel').addEventListener('click', function () {
      overlay.remove();
    });
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) overlay.remove();
    });

    overlay.querySelector('#logout-ok').addEventListener('click', function () {
      // 清除所有登录信息
      localStorage.removeItem('token');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userInfo');
      localStorage.removeItem('community_profile');

      showToast('已退出登录');

      // 跳转到登录页
      setTimeout(function () {
        // 如果使用 hash 路由，跳转到登录
        if (window.location.hash) {
          window.location.hash = '#/login';
        } else {
          window.location.href = '/login.html';
        }
      }, 500);

      overlay.remove();
    });
  }

  // ========== 暴露全局接口 ==========

  window.Pages = window.Pages || {};
  window.Pages.profile = render;

})();
