/**
 * AI私人咖啡甜度师 - UI 渲染层
 * 负责所有页面内容的 DOM 生成与渲染
 */
(function (global) {
  'use strict';

  // ============ 工具函数 ============
  function el(tag, className, html) {
    var e = document.createElement(tag);
    if (className) e.className = className;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  function fmtTime(ts) {
    var d = new Date(ts);
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    var dd = String(d.getDate()).padStart(2, '0');
    var hh = String(d.getHours()).padStart(2, '0');
    var mi = String(d.getMinutes()).padStart(2, '0');
    return mm + '/' + dd + ' ' + hh + ':' + mi;
  }

  // 生成选项按钮组
  function optionGroup(title, items, name, selected) {
    var wrap = el('div', 'form-group');
    wrap.appendChild(el('label', 'form-label', title));
    var grid = el('div', 'option-grid');
    var keys = Object.keys(items);
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      var item = items[k];
      var btn = el('button', 'option-btn' + (selected === k ? ' selected' : ''),
        '<span class="opt-icon">' + (item.icon || '') + '</span>' +
        '<span class="opt-label">' + item.label + '</span>');
      btn.setAttribute('data-name', name);
      btn.setAttribute('data-value', k);
      grid.appendChild(btn);
    }
    wrap.appendChild(grid);
    return wrap;
  }

  // ============ 首页 ============
  function renderHome(container) {
    var stats = Store.getStats();
    var nickname = Store.getNickname();
    var profile = Store.getProfile();
    var level = Engine.sweetnessLevel(profile.basePreference);

    var hour = new Date().getHours();
    var greeting = hour < 11 ? '早上好' : hour < 14 ? '中午好' : hour < 18 ? '下午好' : '晚上好';
    var todayPercent = Math.min(100, Math.round((stats.todaySugar / stats.dailyLimit) * 100));

    container.innerHTML = '';

    // 顶部问候
    var hero = el('div', 'home-hero');
    hero.innerHTML =
      '<div class="greeting">' + greeting + '，' + nickname + ' ☕</div>' +
      '<div class="hero-subtitle">今天来一杯什么咖啡？</div>';
    container.appendChild(hero);

    // 甜度画像卡片
    var profileCard = el('div', 'card profile-card');
    profileCard.innerHTML =
      '<div class="card-title">你的甜度画像</div>' +
      '<div class="profile-level" style="color:' + level.color + '">' + level.label + '</div>' +
      '<div class="profile-score">偏好指数 ' + profile.basePreference.toFixed(1) + ' / 10</div>' +
      '<div class="profile-desc">' + level.desc + '</div>' +
      '<div class="profile-meta">' +
        '<span>已记录 ' + stats.totalRecords + ' 杯</span>' +
        '<span>·</span>' +
        '<span>AI学习 ' + (profile.adaptCount || 0) + ' 次</span>' +
      '</div>';
    container.appendChild(profileCard);

    // 今日控糖进度
    var sugarCard = el('div', 'card sugar-card');
    sugarCard.innerHTML =
      '<div class="card-title">今日控糖进度</div>' +
      '<div class="sugar-ring">' +
        '<div class="sugar-num">' + stats.todaySugar + '<small>g</small></div>' +
        '<div class="sugar-limit">/ ' + stats.dailyLimit + 'g 上限</div>' +
      '</div>' +
      '<div class="progress-bar">' +
        '<div class="progress-fill ' + (todayPercent > 80 ? 'warn' : '') + '" style="width:' + todayPercent + '%"></div>' +
      '</div>' +
      '<div class="sugar-hint">' + (todayPercent > 80 ? '今日糖分接近上限，建议少糖' : '糖分摄入健康，继续保持') + '</div>';
    container.appendChild(sugarCard);

    // 快捷入口
    var quickCard = el('div', 'card quick-card');
    quickCard.innerHTML =
      '<div class="quick-row" data-action="recommend">' +
        '<span class="quick-icon">🎯</span>' +
        '<div class="quick-text"><div class="quick-title">开始甜度推荐</div><div class="quick-desc">告诉我你的心情和咖啡，AI为你找到黄金甜度</div></div>' +
        '<span class="quick-arrow">›</span>' +
      '</div>' +
      '<div class="quick-row" data-action="history">' +
        '<span class="quick-icon">📋</span>' +
        '<div class="quick-text"><div class="quick-title">历史记录</div><div class="quick-desc">回顾每次推荐与口味变化</div></div>' +
        '<span class="quick-arrow">›</span>' +
      '</div>' +
      '<div class="quick-row" data-action="profile">' +
        '<span class="quick-icon">⚙️</span>' +
        '<div class="quick-text"><div class="quick-title">个人设置</div><div class="quick-desc">昵称、健康目标、数据管理</div></div>' +
        '<span class="quick-arrow">›</span>' +
      '</div>';
    container.appendChild(quickCard);

    // 绑定快捷入口
    var rows = quickCard.querySelectorAll('.quick-row');
    for (var i = 0; i < rows.length; i++) {
      rows[i].addEventListener('click', function () {
        App.navigate(this.getAttribute('data-action'));
      });
    }
  }

  // ============ 推荐表单页 ============
  function renderRecommend(container) {
    var settings = Store.getSettings();
    var profile = Store.getProfile();

    container.innerHTML = '';

    var header = el('div', 'page-header');
    header.innerHTML = '<div class="page-title">甜度推荐</div><div class="page-subtitle">选择你的场景，AI为你定制黄金甜度</div>';
    container.appendChild(header);

    var form = el('div', 'recommend-form');

    // 心情
    form.appendChild(optionGroup('今天的心情', Engine.MOOD_FACTOR, 'mood', 'relaxed'));
    // 咖啡类型
    form.appendChild(optionGroup('咖啡类型', Engine.DRINK_FACTOR, 'drink', 'americano'));
    // 烘焙度
    form.appendChild(optionGroup('咖啡豆烘焙度', Engine.ROAST_FACTOR, 'roast', 'medium'));
    // 产区
    form.appendChild(optionGroup('咖啡豆产区', Engine.ORIGIN_FACTOR, 'origin', 'blend'));
    // 食物搭配
    form.appendChild(optionGroup('搭配食物', Engine.FOOD_FACTOR, 'food', 'none'));
    // 健康目标（默认取设置）
    form.appendChild(optionGroup('健康目标', Engine.HEALTH_FACTOR, 'health', settings.healthGoal || 'none'));

    container.appendChild(form);

    // 推荐按钮
    var btnWrap = el('div', 'btn-wrap');
    var btn = el('button', 'btn-primary btn-large', '🤖 AI 推荐黄金甜度');
    btn.id = 'btn-recommend';
    btnWrap.appendChild(btn);
    container.appendChild(btnWrap);

    // 选项绑定
    var grids = form.querySelectorAll('.option-grid');
    for (var i = 0; i < grids.length; i++) {
      grids[i].addEventListener('click', function (e) {
        var target = e.target.closest('.option-btn');
        if (!target) return;
        var siblings = this.querySelectorAll('.option-btn');
        for (var j = 0; j < siblings.length; j++) siblings[j].classList.remove('selected');
        target.classList.add('selected');
      });
    }

    btn.addEventListener('click', function () {
      var selected = {};
      var btns = form.querySelectorAll('.option-btn.selected');
      for (var j = 0; j < btns.length; j++) {
        var b = btns[j];
        selected[b.getAttribute('data-name')] = b.getAttribute('data-value');
      }
      App.doRecommend(selected);
    });
  }

  // ============ 推荐结果页 ============
  function renderResult(container, result) {
    container.innerHTML = '';

    var card = el('div', 'result-card');
    card.innerHTML =
      '<div class="result-header">AI推荐结果</div>' +
      '<div class="result-grams" style="color:' + result.level.color + '">' +
        result.grams + '<small>g</small>' +
      '</div>' +
      '<div class="result-level" style="background:' + result.level.color + '">' + result.level.label + '</div>' +
      '<div class="result-desc">' + result.level.desc + '</div>' +
      '<div class="result-extra">' +
        '<div class="extra-item"><span class="extra-label">糖浆泵数</span><span class="extra-value">' + result.pumps + ' 泵</span></div>' +
        '<div class="extra-item"><span class="extra-label">甜度指数</span><span class="extra-value">' + result.score + ' / 10</span></div>' +
      '</div>';
    container.appendChild(card);

    // 因子分解
    var factorCard = el('div', 'card factor-card');
    factorCard.innerHTML = '<div class="card-title">推荐因子分解</div>';
    var factorList = el('div', 'factor-list');
    for (var i = 0; i < result.factors.length; i++) {
      var f = result.factors[i];
      var isPositive = f.effect.indexOf('+') === 0 || f.effect.indexOf('×') === 0;
      var isNegative = f.effect.indexOf('-') === 0;
      var effectClass = isNegative ? 'neg' : (isPositive && f.effect !== '基准' && f.effect !== '×1.00' ? 'pos' : '');
      var row = el('div', 'factor-row');
      row.innerHTML =
        '<span class="factor-icon">' + f.icon + '</span>' +
        '<div class="factor-info"><div class="factor-name">' + f.name + '</div><div class="factor-value">' + f.value + '</div></div>' +
        '<span class="factor-effect ' + effectClass + '">' + f.effect + '</span>';
      factorList.appendChild(row);
    }
    factorCard.appendChild(factorList);
    container.appendChild(factorCard);

    // 反馈区
    var fbCard = el('div', 'card feedback-card');
    fbCard.innerHTML =
      '<div class="card-title">这杯怎么样？</div>' +
      '<div class="feedback-desc">你的反馈会帮助AI学习你的口味</div>' +
      '<div class="feedback-btns">' +
        '<button class="fb-btn bland" data-fb="bland">🙂 太淡了</button>' +
        '<button class="fb-btn perfect" data-fb="perfect">😍 刚刚好</button>' +
        '<button class="fb-btn sweet" data-fb="sweet">😬 太甜了</button>' +
      '</div>';
    container.appendChild(fbCard);

    // 操作按钮
    var actWrap = el('div', 'btn-wrap btn-group');
    actWrap.innerHTML =
      '<button class="btn-secondary" id="btn-back-recommend">重新推荐</button>' +
      '<button class="btn-primary" id="btn-save-home">保存并回家</button>';
    container.appendChild(actWrap);

    // 绑定反馈
    var fbBtns = fbCard.querySelectorAll('.fb-btn');
    for (var j = 0; j < fbBtns.length; j++) {
      fbBtns[j].addEventListener('click', function () {
        var fb = this.getAttribute('data-fb');
        App.handleFeedback(fb, result);
        // 标记选中
        for (var k = 0; k < fbBtns.length; k++) fbBtns[k].classList.remove('active');
        this.classList.add('active');
        fbCard.querySelector('.feedback-desc').textContent = '已记录！AI正在学习你的口味偏好…';
      });
    }

    document.getElementById('btn-back-recommend').addEventListener('click', function () {
      App.navigate('recommend');
    });
    document.getElementById('btn-save-home').addEventListener('click', function () {
      App.navigate('home');
    });
  }

  // ============ 历史记录页 ============
  function renderHistory(container) {
    var history = Store.getHistory();
    container.innerHTML = '';

    var header = el('div', 'page-header');
    header.innerHTML = '<div class="page-title">历史记录</div><div class="page-subtitle">共 ' + history.length + ' 条推荐记录</div>';
    container.appendChild(header);

    if (history.length === 0) {
      var empty = el('div', 'empty-state');
      empty.innerHTML = '<div class="empty-icon">☕</div><div class="empty-text">还没有记录</div><div class="empty-hint">去推荐一杯咖啡吧</div>';
      container.appendChild(empty);

      var btn = el('button', 'btn-primary', '开始推荐');
      btn.style.marginTop = '1rem';
      btn.addEventListener('click', function () { App.navigate('recommend'); });
      container.appendChild(btn);
      return;
    }

    var list = el('div', 'history-list');
    for (var i = 0; i < history.length; i++) {
      var r = history[i];
      var item = el('div', 'history-item');
      var drinkLabel = Engine.DRINK_FACTOR[r.input.drink] ? Engine.DRINK_FACTOR[r.input.drink].label : r.input.drink;
      var moodLabel = Engine.MOOD_FACTOR[r.input.mood] ? Engine.MOOD_FACTOR[r.input.mood].label : '';
      var fbIcon = r.feedback === 'bland' ? '🙂' : r.feedback === 'perfect' ? '😍' : r.feedback === 'sweet' ? '😬' : '';

      item.innerHTML =
        '<div class="hist-left">' +
          '<div class="hist-grams" style="color:' + r.level.color + '">' + r.grams + 'g</div>' +
          '<div class="hist-level" style="background:' + r.level.color + '">' + r.level.label + '</div>' +
        '</div>' +
        '<div class="hist-info">' +
          '<div class="hist-drink">' + drinkLabel + (fbIcon ? ' ' + fbIcon : '') + '</div>' +
          '<div class="hist-meta">' + moodLabel + ' · ' + fmtTime(r.timestamp) + '</div>' +
        '</div>';
      list.appendChild(item);
    }
    container.appendChild(list);

    // 清空按钮
    if (history.length > 0) {
      var clearBtn = el('button', 'btn-text-danger', '清空所有记录');
      clearBtn.style.marginTop = '1.5rem';
      clearBtn.addEventListener('click', function () {
        if (confirm('确定清空所有历史记录吗？此操作不可撤销。')) {
          Store.clearHistory();
          renderHistory(container);
        }
      });
      container.appendChild(clearBtn);
    }
  }

  // ============ 个人设置页 ============
  function renderProfile(container) {
    var profile = Store.getProfile();
    var settings = Store.getSettings();
    var stats = Store.getStats();
    var nickname = Store.getNickname();
    var level = Engine.sweetnessLevel(profile.basePreference);

    container.innerHTML = '';

    var header = el('div', 'page-header');
    header.innerHTML = '<div class="page-title">个人中心</div>';
    container.appendChild(header);

    // 用户信息卡
    var userCard = el('div', 'card user-card');
    userCard.innerHTML =
      '<div class="user-avatar">☕</div>' +
      '<div class="user-info">' +
        '<input class="user-name-input" id="input-nickname" value="' + nickname + '" maxlength="12">' +
        '<div class="user-level" style="color:' + level.color + '">' + level.label + ' · 指数 ' + profile.basePreference.toFixed(1) + '</div>' +
      '</div>';
    container.appendChild(userCard);

    // 数据统计
    var statsCard = el('div', 'card stats-card');
    statsCard.innerHTML =
      '<div class="card-title">数据统计</div>' +
      '<div class="stats-grid">' +
        '<div class="stat-item"><div class="stat-num">' + stats.totalRecords + '</div><div class="stat-label">总推荐</div></div>' +
        '<div class="stat-item"><div class="stat-num">' + stats.totalSugar + 'g</div><div class="stat-label">累计糖分</div></div>' +
        '<div class="stat-item"><div class="stat-num">' + stats.avgSugar + 'g</div><div class="stat-label">平均糖量</div></div>' +
        '<div class="stat-item"><div class="stat-num">' + (profile.adaptCount || 0) + '</div><div class="stat-label">学习次数</div></div>' +
      '</div>';
    container.appendChild(statsCard);

    // 健康目标设置
    var healthCard = el('div', 'card');
    healthCard.appendChild(el('div', 'card-title', '健康目标'));
    healthCard.appendChild(optionGroup('', Engine.HEALTH_FACTOR, 'health-setting', settings.healthGoal || 'none'));
    container.appendChild(healthCard);

    // 每日糖上限
    var limitCard = el('div', 'card');
    limitCard.innerHTML =
      '<div class="card-title">每日糖分上限</div>' +
      '<div class="limit-row">' +
        '<input type="range" id="slider-limit" min="10" max="60" step="5" value="' + settings.dailySugarLimit + '" class="slider">' +
        '<span class="limit-value" id="limit-value">' + settings.dailySugarLimit + 'g</span>' +
      '</div>' +
      '<div class="limit-hint">WHO建议成人每日游离糖摄入不超过25g</div>';
    container.appendChild(limitCard);

    // 数据管理
    var mgmtCard = el('div', 'card');
    mgmtCard.innerHTML = '<div class="card-title">数据管理</div>';
    var resetBtn = el('button', 'btn-text-danger', '重置所有数据');
    resetBtn.addEventListener('click', function () {
      if (confirm('确定重置所有数据吗？包括画像、历史记录和设置，此操作不可撤销。')) {
        Store.resetAll();
        App.navigate('home');
      }
    });
    mgmtCard.appendChild(resetBtn);
    container.appendChild(mgmtCard);

    // 关于
    var aboutCard = el('div', 'card about-card');
    aboutCard.innerHTML =
      '<div class="card-title">关于</div>' +
      '<div class="about-text">AI私人咖啡甜度师 v1.0</div>' +
      '<div class="about-text">基于多因子加权模型，让每一杯咖啡都找到属于你的黄金甜度。</div>' +
      '<div class="about-text about-muted">TRAE AI创造力大赛 · 生活娱乐赛道</div>';
    container.appendChild(aboutCard);

    // 绑定事件
    var nameInput = document.getElementById('input-nickname');
    nameInput.addEventListener('change', function () {
      Store.setNickname(this.value.trim());
    });

    var slider = document.getElementById('slider-limit');
    var limitVal = document.getElementById('limit-value');
    slider.addEventListener('input', function () {
      limitVal.textContent = this.value + 'g';
    });
    slider.addEventListener('change', function () {
      Store.updateSettings(function (s) { s.dailySugarLimit = parseInt(this.value, 10); return s; }.bind(this));
    });

    // 健康目标切换
    var healthGrid = healthCard.querySelector('.option-grid');
    healthGrid.addEventListener('click', function (e) {
      var target = e.target.closest('.option-btn');
      if (!target) return;
      var siblings = this.querySelectorAll('.option-btn');
      for (var j = 0; j < siblings.length; j++) siblings[j].classList.remove('selected');
      target.classList.add('selected');
      Store.updateSettings(function (s) { s.healthGoal = target.getAttribute('data-value'); return s; });
    });
  }

  // ============ 导出 ============
  global.UI = {
    renderHome: renderHome,
    renderRecommend: renderRecommend,
    renderResult: renderResult,
    renderHistory: renderHistory,
    renderProfile: renderProfile
  };
})(window);
