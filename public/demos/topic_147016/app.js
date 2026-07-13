(function () {
  'use strict';

  var Core = window.OutfitCore;
  var app = document.getElementById('app');
  var toastRegion = document.getElementById('toastRegion');
  var favoriteCount = document.getElementById('favoriteCount');
  var STORAGE_KEY = 'ai_outfit_demo_favorites_v2';
  var state = {
    selection: { temperature: 22, scene: 'class', style: 'clean', gender: 'female' },
    favorites: loadFavorites()
  };

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char];
    });
  }

  function loadFavorites() {
    try {
      var value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(value) ? value.filter(function (id) { return Core.parseOutfitId(id); }) : [];
    } catch (error) {
      return [];
    }
  }

  function saveFavorites() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.favorites));
    updateFavoriteCount();
  }

  function updateFavoriteCount() {
    favoriteCount.textContent = String(state.favorites.length);
  }

  function navigate(path) {
    location.hash = path.charAt(0) === '#' ? path : '#' + path;
  }

  function showToast(message) {
    toastRegion.innerHTML = '<div class="toast">' + escapeHtml(message) + '</div>';
    window.setTimeout(function () { toastRegion.innerHTML = ''; }, 1900);
  }

  function isFavorite(id) {
    return state.favorites.includes(id);
  }

  function toggleFavorite(id) {
    if (!Core.parseOutfitId(id)) return false;
    var index = state.favorites.indexOf(id);
    if (index >= 0) state.favorites.splice(index, 1);
    else state.favorites.push(id);
    saveFavorites();
    return index < 0;
  }

  function restoreSelectionFromId(id) {
    var selection = Core.selectionFromOutfitId(id);
    if (selection) state.selection = selection;
    return selection;
  }

  function pageHeader(title, subtitle, backPath) {
    return '<div class="page-header">' +
      '<div><p class="eyebrow">' + escapeHtml(subtitle) + '</p><h2>' + escapeHtml(title) + '</h2></div>' +
      '<button class="back-button" type="button" data-action="back" data-path="' + escapeHtml(backPath) + '">← 返回</button>' +
      '</div>';
  }

  function renderHome() {
    return '<section class="page hero glass">' +
      '<div class="hero-copy">' +
        '<p class="eyebrow">Offline Interactive Fashion Demo</p>' +
        '<h1>不用等 AI 生成，<span class="gradient-text">现在就能试穿搭。</span></h1>' +
        '<p class="lead">选择性别、体感温度、出门场景和偏好风格，系统会从 96 套本地预设方案中立即找到对应图片。全程离线，无需 API。</p>' +
        '<div class="button-row">' +
          '<button class="button button-primary" type="button" data-action="start">开始搭配 <span>→</span></button>' +
          '<button class="button button-secondary" type="button" data-action="favorite" data-target="page">查看我的收藏</button>' +
        '</div>' +
        '<div class="feature-row">' +
          '<div class="feature glass-soft"><strong>四项自由选择</strong><span>每一次点击或滑动都会即时更新预览。</span></div>' +
          '<div class="feature glass-soft"><strong>96 套独立图片</strong><span>不同组合稳定导向不同的本地预设图。</span></div>' +
          '<div class="feature glass-soft"><strong>完整页面路径</strong><span>从首页到选择、结果、详情和收藏均可返回。</span></div>' +
        '</div>' +
      '</div>' +
      '<div class="hero-preview"><img src="assets/mild-travel-soft-female.jpg" alt="AI 穿搭镜预设方案示例"></div>' +
    '</section>';
  }

  function choiceButton(action, value, active, icon, label) {
    return '<button class="choice' + (active ? ' active' : '') + '" type="button" data-action="' + action + '" data-value="' + value + '" aria-pressed="' + active + '">' +
      '<span class="choice-icon">' + icon + '</span><span class="choice-label">' + label + '</span></button>';
  }

  function renderSelect() {
    var selection = state.selection;
    var preview = Core.createOutfit(selection);
    var genderButtons = Object.keys(Core.GENDERS).map(function (key) {
      return choiceButton('gender', key, selection.gender === key, key === 'female' ? '♀' : '♂', Core.GENDERS[key].label);
    }).join('');
    var sceneButtons = Object.keys(Core.SCENES).map(function (key) {
      var item = Core.SCENES[key];
      return choiceButton('scene', key, selection.scene === key, item.icon, item.label);
    }).join('');
    var styleButtons = Object.keys(Core.STYLES).map(function (key) {
      var item = Core.STYLES[key];
      return choiceButton('style', key, selection.style === key, item.icon, item.label);
    }).join('');

    return '<section class="page">' +
      pageHeader('告诉我今天怎么穿', '第二级 · 条件选择', '/home') +
      '<div class="progress"><span></span></div>' +
      '<div class="selector-layout">' +
        '<div class="selector-panel glass">' +
          '<div class="control-block"><div class="control-heading"><strong>1. 选择款式</strong><span>两种款式均有完整图片</span></div><div class="choice-grid two">' + genderButtons + '</div></div>' +
          '<div class="control-block"><div class="control-heading"><strong>2. 调整体感温度</strong><span id="bandLabel">' + Core.BANDS[preview.band].label + '</span></div>' +
            '<div class="temperature-box"><div class="temperature-readout"><strong id="temperatureValue">' + selection.temperature + '°C</strong><span id="temperatureTip">' + Core.BANDS[preview.band].range + '</span></div>' +
            '<input type="range" min="8" max="34" step="1" value="' + selection.temperature + '" data-action="temperature" aria-label="体感温度">' +
            '<div class="range-labels"><span>8°C 保暖</span><span>22°C 层搭</span><span>34°C 轻薄</span></div></div></div>' +
          '<div class="control-block"><div class="control-heading"><strong>3. 选择出门场景</strong><span>决定实用侧重点</span></div><div class="choice-grid">' + sceneButtons + '</div></div>' +
          '<div class="control-block"><div class="control-heading"><strong>4. 选择偏好风格</strong><span>决定配色和轮廓</span></div><div class="choice-grid">' + styleButtons + '</div></div>' +
        '</div>' +
        '<aside class="live-preview glass" id="livePreview">' + renderLivePreview(preview) + '</aside>' +
      '</div>' +
    '</section>';
  }

  function renderLivePreview(outfit) {
    return '<div class="live-preview-image"><img src="' + outfit.image + '" alt="' + escapeHtml(outfit.title) + '"><span class="live-badge">即时预览</span></div>' +
      '<div><h3>' + escapeHtml(outfit.title) + '</h3><p>' + escapeHtml(outfit.eyebrow + ' · ' + outfit.sceneLabel) + '</p></div>' +
      '<button class="button button-primary" type="button" data-action="generate">生成完整建议</button>';
  }

  function renderResult() {
    var outfit = Core.createOutfit(state.selection);
    var favorite = isFavorite(outfit.id);
    return '<section class="page">' +
      pageHeader('你的今日推荐已经准备好', '第三级 · 推荐结果', '/select') +
      '<div class="result-layout">' +
        '<div class="result-image-card glass"><img class="result-image" src="' + outfit.image + '" alt="' + escapeHtml(outfit.title) + '"></div>' +
        '<article class="result-copy glass">' +
          '<p class="eyebrow">' + escapeHtml(outfit.eyebrow) + '</p><h2>' + escapeHtml(outfit.title) + '</h2><p class="lead">' + escapeHtml(outfit.summary) + '</p>' +
          '<div class="tag-row">' + outfit.keywords.map(function (tag) { return '<span class="tag">' + escapeHtml(tag) + '</span>'; }).join('') + '</div>' +
          '<div class="info-grid"><div class="info-card"><strong>推荐配色</strong><span>' + escapeHtml(outfit.palette) + '</span></div><div class="info-card"><strong>版型重点</strong><span>' + escapeHtml(outfit.shape) + '</span></div></div>' +
          '<ul class="item-list">' + outfit.items.map(function (item) { return '<li>' + escapeHtml(item) + '</li>'; }).join('') + '</ul>' +
          '<div class="button-row">' +
            '<button class="button button-primary" type="button" data-action="detail" data-id="' + outfit.id + '">查看方案详情</button>' +
            '<button class="button button-secondary' + (favorite ? ' is-favorite' : '') + '" type="button" data-action="favorite" data-id="' + outfit.id + '">' + (favorite ? '♥ 已收藏' : '♡ 收藏方案') + '</button>' +
            '<button class="button button-ghost" type="button" data-action="back" data-path="/select">重新选择</button>' +
          '</div>' +
        '</article>' +
      '</div>' +
    '</section>';
  }

  function renderDetail(id) {
    if (!restoreSelectionFromId(id)) return renderNotFound();
    var outfit = Core.createOutfit(state.selection);
    var alternatives = Core.getAlternativeStyles(outfit.style).map(function (style) {
      var selection = Object.assign({}, state.selection, { style: style });
      var item = Core.createOutfit(selection);
      return '<button class="alternative" type="button" data-action="alternative" data-style="' + style + '">' +
        '<img src="' + item.image + '" alt="' + escapeHtml(item.title) + '"><span><strong>' + escapeHtml(item.styleLabel) + '</strong>' + escapeHtml(Core.STYLES[style].keywords.join(' · ')) + '</span></button>';
    }).join('');
    var favorite = isFavorite(outfit.id);

    return '<section class="page">' +
      pageHeader(outfit.title, '第四级 · 方案详情', '/result') +
      '<div class="detail-layout">' +
        '<div class="result-image-card glass"><img class="result-image" src="' + outfit.image + '" alt="' + escapeHtml(outfit.title) + '"></div>' +
        '<article class="result-copy glass">' +
          '<p class="eyebrow">' + escapeHtml(outfit.eyebrow + ' · ' + outfit.genderLabel) + '</p><h2>为什么这套适合你</h2>' +
          '<p class="lead">' + escapeHtml(outfit.temperatureTip) + '</p>' +
          '<div class="info-grid"><div class="info-card"><strong>当前场景</strong><span>' + escapeHtml(outfit.sceneLabel) + '</span></div><div class="info-card"><strong>当前风格</strong><span>' + escapeHtml(outfit.styleLabel) + '</span></div><div class="info-card"><strong>配色策略</strong><span>' + escapeHtml(outfit.palette) + '</span></div><div class="info-card"><strong>轮廓策略</strong><span>' + escapeHtml(outfit.shape) + '</span></div></div>' +
          '<div class="button-row"><button class="button button-primary' + (favorite ? ' is-favorite' : '') + '" type="button" data-action="favorite" data-id="' + outfit.id + '">' + (favorite ? '♥ 已加入收藏' : '♡ 加入收藏') + '</button><button class="button button-secondary" type="button" data-action="back" data-path="/favorites">查看收藏页</button></div>' +
          '<div class="alternative-section"><p class="eyebrow">同条件替换风格</p><div class="alternative-grid">' + alternatives + '</div></div>' +
        '</article>' +
      '</div>' +
    '</section>';
  }

  function renderFavorites() {
    if (!state.favorites.length) {
      return '<section class="page">' + pageHeader('我的收藏', '独立页面 · 本地保存', '/home') + '<div class="empty-state glass"><div class="empty-icon">♡</div><h2>还没有收藏方案</h2><p class="lead" style="margin-left:auto;margin-right:auto">完成一次搭配推荐，在结果页或详情页点击收藏，这里就会保留你的预设方案。</p><button class="button button-primary" type="button" data-action="start">去选择一套</button></div></section>';
    }
    var cards = state.favorites.map(function (id) {
      var selection = Core.selectionFromOutfitId(id);
      var outfit = Core.createOutfit(selection);
      return '<article class="favorite-card glass"><img src="' + outfit.image + '" alt="' + escapeHtml(outfit.title) + '"><div class="favorite-card-body"><h3>' + escapeHtml(outfit.title) + '</h3><p>' + escapeHtml(outfit.eyebrow + ' · ' + outfit.sceneLabel) + '</p><div class="favorite-card-actions"><button class="button button-primary" type="button" data-action="detail" data-id="' + outfit.id + '">查看详情</button><button class="button button-danger" type="button" data-action="favorite" data-id="' + outfit.id + '">取消收藏</button></div></div></article>';
    }).join('');
    return '<section class="page">' + pageHeader('我的收藏', '独立页面 · 本地保存', '/home') + '<div class="favorites-grid">' + cards + '</div></section>';
  }

  function renderNotFound() {
    return '<section class="page empty-state glass"><div class="empty-icon">?</div><h2>没有找到这套方案</h2><p class="lead" style="margin-left:auto;margin-right:auto">链接参数可能不完整，请重新选择条件。</p><button class="button button-primary" type="button" data-action="start">重新开始</button></section>';
  }

  var routes = {
    home: renderHome,
    select: renderSelect,
    result: renderResult,
    detail: renderDetail,
    favorites: renderFavorites
  };

  function renderRoute() {
    var route = Core.parseRoute(location.hash);
    var renderer = routes[route.page] || routes.home;
    app.innerHTML = renderer(route.param);
    updateFavoriteCount();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    app.focus({ preventScroll: true });
  }

  function refreshSelectionControls() {
    var outfit = Core.createOutfit(state.selection);
    var tempValue = document.getElementById('temperatureValue');
    var bandLabel = document.getElementById('bandLabel');
    var temperatureTip = document.getElementById('temperatureTip');
    var livePreview = document.getElementById('livePreview');
    if (tempValue) tempValue.textContent = state.selection.temperature + '°C';
    if (bandLabel) bandLabel.textContent = Core.BANDS[outfit.band].label;
    if (temperatureTip) temperatureTip.textContent = Core.BANDS[outfit.band].range;
    if (livePreview) livePreview.innerHTML = renderLivePreview(outfit);
  }

  app.addEventListener('input', function (event) {
    var control = event.target.closest('[data-action="temperature"]');
    if (!control) return;
    state.selection.temperature = Core.clampTemperature(control.value);
    refreshSelectionControls();
  });

  document.addEventListener('click', function (event) {
    var target = event.target.closest('[data-action]');
    if (!target) return;
    var action = target.dataset.action;

    switch (action) {
      case 'start':
        navigate('/select');
        break;
      case 'gender':
      case 'scene':
      case 'style':
        state.selection[action] = target.dataset.value;
        renderRoute();
        break;
      case 'generate':
        navigate('/result');
        break;
      case 'detail':
        navigate('/detail/' + target.dataset.id);
        break;
      case 'favorite':
        if (target.dataset.target === 'page' || !target.dataset.id) {
          navigate('/favorites');
        } else {
          var added = toggleFavorite(target.dataset.id);
          showToast(added ? '已加入收藏' : '已取消收藏');
          renderRoute();
        }
        break;
      case 'alternative':
        state.selection.style = target.dataset.style;
        var alternative = Core.createOutfit(state.selection);
        navigate('/detail/' + alternative.id);
        break;
      case 'back':
        navigate(target.dataset.path || '/home');
        break;
    }
  });

  window.addEventListener('hashchange', renderRoute);
  if (!location.hash) location.replace('#/home');
  else renderRoute();
})();
