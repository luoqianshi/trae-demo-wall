/**
 * 饮食调养页面 - nutrition.js
 * 功能：食谱知识库、筛选、详情展开、AI推荐
 */
(function () {
  'use strict';

  var API_BASE = 'http://localhost:3000/api/v1';

  function getToken() {
    return localStorage.getItem('token') || localStorage.getItem('accessToken');
  }

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

  function showToast(msg, type) {
    type = type || 'info';
    var existing = document.querySelector('.toast');
    if (existing) existing.remove();
    var toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(function () {
      toast.style.animation = 'toastOut 0.3s ease forwards';
      setTimeout(function () { toast.remove(); }, 300);
    }, 2500);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  var state = {
    condition: 'all',
    category: 'all',
    recipes: [],
    loading: false,
    expandedId: null,
    aiMode: false,
    aiRecommendations: {},
    aiReasons: []
  };

  var conditions = [
    { value: 'all', label: '全部' },
    { value: 'hypertension', label: '降压' },
    { value: 'diabetes', label: '降糖' },
    { value: 'hyperlipidemia', label: '降脂' },
    { value: 'weight_loss', label: '减重' },
    { value: 'general', label: '通用' }
  ];

  var categories = [
    { value: 'all', label: '全部' },
    { value: 'breakfast', label: '早餐' },
    { value: 'lunch', label: '午餐' },
    { value: 'dinner', label: '晚餐' },
    { value: 'snack', label: '加餐' }
  ];

  function injectStyles() {
    if (document.getElementById('nutrition-page-style')) return;
    var style = document.createElement('style');
    style.id = 'nutrition-page-style';
    style.textContent = '\
.nutrition-page { padding-bottom: 80px; }\
.nutrition-header { background: var(--bg-card); border-bottom: 1px solid var(--border-light); position: sticky; top: 0; z-index: 10; }\
.filter-bar { display: flex; gap: 12px; padding: 12px 16px; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; }\
.filter-bar::-webkit-scrollbar { display: none; }\
.filter-group { display: flex; gap: 8px; flex-shrink: 0; }\
.filter-chip { padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s; border: 1.5px solid var(--border); background: var(--bg-card); color: var(--text-secondary); white-space: nowrap; }\
.filter-chip.active { background: var(--primary); color: #fff; border-color: var(--primary); }\
.recipe-list { padding: 12px 16px; }\
.ai-recommend-banner { background: linear-gradient(135deg, rgba(13,148,136,0.1), rgba(59,130,246,0.1)); border: 1px solid rgba(13,148,136,0.2); border-radius: var(--radius); padding: 14px; margin-bottom: 12px; }\
.ai-banner-title { font-size: 15px; font-weight: 600; color: var(--primary); margin-bottom: 8px; }\
.ai-banner-reasons { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px; }\
.ai-banner-reason { font-size: 12px; padding: 4px 10px; border-radius: 12px; background: rgba(13,148,136,0.15); color: var(--primary); }\
.ai-banner-footer { display: flex; justify-content: space-between; align-items: center; font-size: 13px; color: var(--text-secondary); }\
.ai-banner-footer strong { color: var(--primary); }\
.ai-banner-close { padding: 5px 12px; border-radius: 14px; font-size: 12px; border: 1px solid var(--primary); background: transparent; color: var(--primary); cursor: pointer; }\
.ai-category-section { margin-bottom: 20px; }\
.ai-category-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; padding: 0 2px; }\
.ai-category-title { font-size: 15px; font-weight: 600; color: var(--text); display: flex; align-items: center; gap: 6px; }\
.ai-category-count { font-size: 12px; color: var(--text-secondary); background: var(--bg-input); padding: 2px 10px; border-radius: 10px; }\
.recipe-card { background: var(--bg-card); border-radius: var(--radius); padding: 16px; margin-bottom: 12px; box-shadow: var(--shadow); transition: all 0.2s; }\
.recipe-card:active { box-shadow: var(--shadow-md); }\
.recipe-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }\
.recipe-name { font-size: 16px; font-weight: 600; color: var(--text); flex: 1; }\
.recipe-tags { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px; }\
.recipe-meta { display: flex; gap: 16px; font-size: 13px; color: var(--text-secondary); flex-wrap: wrap; }\
.recipe-meta span { display: flex; align-items: center; gap: 4px; }\
.recipe-brief { font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin-bottom: 10px; }\
.recipe-highlights { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 10px; }\
.recipe-highlights .highlight-tag { font-size: 11px; padding: 3px 8px; border-radius: 12px; background: rgba(13,148,136,0.08); color: var(--primary); }\
.recipe-card.breakfast { border-left: 3px solid #f59e0b; }\
.recipe-card.lunch { border-left: 3px solid var(--primary); }\
.recipe-card.dinner { border-left: 3px solid #8b5cf6; }\
.recipe-card.snack { border-left: 3px solid #ec4899; }\
.benefit-list li::before { content: "\\2714"; color: var(--success); }\
.tips-list li::before { content: "\\26A0"; color: var(--accent); }\
.suitable-list li::before { content: "\\2705"; color: var(--success); }\
.not-suitable-list li::before { content: "\\26A0"; color: var(--danger); }\
.tag-list { display: flex; gap: 6px; flex-wrap: wrap; }\
.tag-list .tag { background: rgba(139,92,246,0.1); color: #8b5cf6; border: 1px solid rgba(139,92,246,0.2); }\
.recipe-desc { font-size: 14px; color: var(--text-secondary); line-height: 1.6; margin-bottom: 12px; }\
.tips-list, .benefit-list, .suitable-list, .not-suitable-list { list-style: none; padding: 0; margin: 0 0 14px; }\
.tips-list li, .benefit-list li, .suitable-list li, .not-suitable-list li { position: relative; padding-left: 22px; font-size: 13px; color: var(--text-secondary); line-height: 1.6; margin-bottom: 6px; }\
.recipe-detail { margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--border-light); animation: fadeIn 0.3s ease; }\
.recipe-section-title { font-size: 14px; font-weight: 600; color: var(--text); margin-bottom: 8px; }\
.ingredient-table { width: 100%; border-collapse: collapse; font-size: 13px; }\
.ingredient-table th, .ingredient-table td { padding: 8px 10px; text-align: left; border-bottom: 1px solid var(--border-light); }\
.ingredient-table th { color: var(--text-secondary); font-weight: 500; background: var(--bg-input); }\
.nutrition-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 14px; }\
.nutrition-item { background: var(--bg-input); border-radius: var(--radius-sm); padding: 10px; text-align: center; }\
.nutrition-item .value { font-size: 16px; font-weight: 700; color: var(--primary); }\
.nutrition-item .label { font-size: 11px; color: var(--text-secondary); margin-top: 2px; }\
.steps-list { counter-reset: step; }\
.step-item { display: flex; gap: 10px; margin-bottom: 10px; align-items: flex-start; }\
.step-item::before { counter-increment: step; content: counter(step); width: 24px; height: 24px; border-radius: 50%; background: var(--primary); color: #fff; font-size: 12px; font-weight: 600; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px; }\
.step-text { font-size: 14px; color: var(--text-secondary); line-height: 1.6; flex: 1; }\
.ai-recommend-btn { position: fixed; bottom: calc(var(--nav-height) + 16px); left: 50%; transform: translateX(-50%); background: linear-gradient(135deg, var(--primary), var(--primary-dark)); color: #fff; border: none; padding: 12px 28px; border-radius: 28px; font-size: 14px; font-weight: 600; cursor: pointer; box-shadow: var(--shadow-md); z-index: 50; display: flex; align-items: center; gap: 6px; }\
.ai-recommend-btn:active { transform: translateX(-50%) scale(0.96); }\
.skeleton-card { background: var(--bg-card); border-radius: var(--radius); padding: 16px; margin-bottom: 12px; }\
.skeleton-line { height: 16px; border-radius: 4px; margin-bottom: 10px; }\
.skeleton-line.short { width: 60%; }\
.skeleton-line.meta { width: 40%; height: 14px; }\
';
    document.head.appendChild(style);
  }

  function renderSkeleton() {
    var html = '';
    for (var i = 0; i < 4; i++) {
      html += '\
        <div class="skeleton-card">\
          <div class="skeleton-line skeleton"></div>\
          <div class="skeleton-line short skeleton"></div>\
          <div class="skeleton-line meta skeleton"></div>\
        </div>';
    }
    return html;
  }

  function loadRecipes() {
    state.loading = true;
    state.aiMode = false;
    state.aiRecommendations = {};
    state.aiReasons = [];
    var container = document.getElementById('recipe-list');
    if (container) container.innerHTML = renderSkeleton();

    var params = [];
    if (state.condition && state.condition !== 'all') params.push('condition=' + state.condition);
    if (state.category && state.category !== 'all') params.push('category=' + state.category);
    params.push('pageSize=200');
    var url = API_BASE + '/nutrition/recipes' + (params.length > 0 ? '?' + params.join('&') : '');
    apiRequest(url, { method: 'GET' }).then(function (res) {
      state.loading = false;
      if (res.code === 0 && res.data) {
        state.recipes = res.data.list || res.data.recipes || [];
      } else {
        state.recipes = [];
      }
      renderRecipeList();
    }).catch(function () {
      state.loading = false;
      state.recipes = [];
      renderRecipeList();
      showToast('加载失败，请稍后重试', 'error');
    });
  }

  function renderRecipeList() {
    var container = document.getElementById('recipe-list');
    if (!container) return;

    if (state.recipes.length === 0) {
      container.innerHTML = '\
        <div class="empty-state">\
          <div class="empty-icon">\u{1F372}</div>\
          <div class="empty-title">暂无食谱</div>\
          <div class="empty-desc">换个筛选条件试试看</div>\
        </div>';
      return;
    }

    // AI推荐模式：顶部显示推荐理由，下方显示全部推荐食谱
    var aiBannerHtml = '';
    if (state.aiMode && state.aiReasons && state.aiReasons.length > 0) {
      aiBannerHtml = '<div class="ai-recommend-banner">\
        <div class="ai-banner-title">\u{2728} AI智能推荐</div>\
        <div class="ai-banner-reasons">';
      state.aiReasons.forEach(function (reason) {
        aiBannerHtml += '<span class="ai-banner-reason">' + escapeHtml(reason) + '</span>';
      });
      aiBannerHtml += '</div>\
        <div class="ai-banner-footer">\
          <span>共推荐 <strong>' + state.recipes.length + '</strong> 道食谱</span>\
          <button class="ai-banner-close" id="ai-banner-close">\u{21A9} 返回全部</button>\
        </div>\
      </div>';
    }

    // 生成单个食谱卡片的HTML
    function renderRecipeCard(recipe) {
      var tagsHtml = '';
      var tags = recipe.target_conditions || [];
      if (typeof tags === 'string') tags = tags.split(',');
      var tagLabelMap = {
        'hypertension': '降压', 'diabetes': '降糖', 'hyperlipidemia': '降脂',
        'weight_loss': '减重', 'general': '通用', 'low_salt': '低盐',
        'low_gi': '低GI', 'low_fat': '低脂', 'high_fiber': '高纤维'
      };
      tags.forEach(function (tag) {
        var label = tagLabelMap[tag] || tag;
        var tagCls = 'tag-primary';
        if (tag.indexOf('low') >= 0 || tag.indexOf('减重') >= 0) tagCls = 'tag-success';
        else if (tag.indexOf('hypertension') >= 0 || tag.indexOf('diabetes') >= 0 || tag.indexOf('hyperlipidemia') >= 0) tagCls = 'tag-accent';
        tagsHtml += '<span class="tag ' + tagCls + '">' + escapeHtml(label) + '</span>';
      });

      var isExpanded = state.expandedId !== null && String(state.expandedId) === String(recipe.id);
      var detailHtml = '';
      if (isExpanded) {
        var ingredients = recipe.ingredients || [];
        var ingredientsTable = '';
        if (ingredients.length > 0) {
          ingredientsTable = '<table class="ingredient-table"><thead><tr><th>食材</th><th>用量</th></tr></thead><tbody>';
          ingredients.forEach(function (ing) {
            ingredientsTable += '<tr><td>' + escapeHtml(ing.name) + '</td><td>' + escapeHtml(ing.amount) + '</td></tr>';
          });
          ingredientsTable += '</tbody></table>';
        }

        var nutrition = recipe.nutrition || {};
        var nutritionHtml = '\
          <div class="nutrition-grid">\
            <div class="nutrition-item"><div class="value">' + (nutrition.calories || '--') + '</div><div class="label">热量(kcal)</div></div>\
            <div class="nutrition-item"><div class="value">' + (nutrition.protein || '--') + '</div><div class="label">蛋白质(g)</div></div>\
            <div class="nutrition-item"><div class="value">' + (nutrition.carbs || '--') + '</div><div class="label">碳水(g)</div></div>\
            <div class="nutrition-item"><div class="value">' + (nutrition.fat || '--') + '</div><div class="label">脂肪(g)</div></div>\
            <div class="nutrition-item"><div class="value">' + (nutrition.sodium || '--') + '</div><div class="label">钠(mg)</div></div>\
          </div>';

        var steps = recipe.steps || [];
        var stepsHtml = '';
        if (steps.length > 0) {
          stepsHtml = '<div class="steps-list">';
          steps.forEach(function (step) {
            stepsHtml += '<div class="step-item"><div class="step-text">' + escapeHtml(step) + '</div></div>';
          });
          stepsHtml += '</div>';
        }

        var benefits = recipe.benefits || [];
        if (typeof benefits === 'string') benefits = [benefits];
        var benefitsHtml = '';
        if (benefits.length > 0) {
          benefitsHtml = '<ul class="benefit-list">';
          benefits.forEach(function (b) {
            benefitsHtml += '<li>' + escapeHtml(b) + '</li>';
          });
          benefitsHtml += '</ul>';
        }

        var tips = recipe.tips || [];
        if (typeof tips === 'string') tips = [tips];
        var tipsHtml = '';
        if (tips.length > 0) {
          tipsHtml = '<ul class="tips-list">';
          tips.forEach(function (t) {
            tipsHtml += '<li>' + escapeHtml(t) + '</li>';
          });
          tipsHtml += '</ul>';
        }

        var suitable = recipe.suitable_for || [];
        if (typeof suitable === 'string') suitable = [suitable];
        var suitableHtml = '';
        if (suitable.length > 0) {
          suitableHtml = '<ul class="suitable-list">';
          suitable.forEach(function (s) {
            suitableHtml += '<li>' + escapeHtml(s) + '</li>';
          });
          suitableHtml += '</ul>';
        }

        var notSuitable = recipe.not_suitable || [];
        if (typeof notSuitable === 'string') notSuitable = [notSuitable];
        var notSuitableHtml = '';
        if (notSuitable.length > 0) {
          notSuitableHtml = '<ul class="not-suitable-list">';
          notSuitable.forEach(function (n) {
            notSuitableHtml += '<li>' + escapeHtml(n) + '</li>';
          });
          notSuitableHtml += '</ul>';
        }

        var dishTags = recipe.tags || [];
        if (typeof dishTags === 'string') dishTags = [dishTags];
        var dishTagsHtml = '';
        if (dishTags.length > 0) {
          dishTagsHtml = '<div class="tag-list">';
          dishTags.forEach(function (t) {
            dishTagsHtml += '<span class="tag">' + escapeHtml(t) + '</span>';
          });
          dishTagsHtml += '</div>';
        }

        detailHtml = '\
          <div class="recipe-detail">\
            <div class="recipe-section-title">\u{1F4DD} 菜品介绍</div>\
            <div class="recipe-desc">' + escapeHtml(recipe.description || '暂无介绍') + '</div>\
            <div class="recipe-section-title" style="margin-top:14px;">\u{1F3C6} 食用功效</div>' + benefitsHtml + '\
            <div class="recipe-section-title" style="margin-top:14px;">\u{1F4CB} 食材清单</div>' + ingredientsTable + '\
            <div class="recipe-section-title" style="margin-top:14px;">\u{1F9E0} 营养信息</div>' + nutritionHtml + '\
            <div class="recipe-section-title" style="margin-top:14px;">\u{1F373} 做法步骤</div>' + stepsHtml + '\
            <div class="recipe-section-title" style="margin-top:14px;">\u{1F4A1} 烹饪小贴士</div>' + tipsHtml + '\
            <div class="recipe-section-title" style="margin-top:14px;">\u{2705} 适宜人群</div>' + suitableHtml + '\
            <div class="recipe-section-title" style="margin-top:14px;">\u{26A0} 不宜人群</div>' + notSuitableHtml + '\
            <div class="recipe-section-title" style="margin-top:14px;">\u{1F3F7} 菜品标签</div>' + dishTagsHtml + '\
          </div>';
      }

      var descText = recipe.description || '';
      if (descText && descText.length > 40) descText = descText.substring(0, 40) + '...';
      var descHtml = descText ? '<div class="recipe-brief">' + escapeHtml(descText) + '</div>' : '';

      var highlights = (recipe.benefits || []).slice(0, 2);
      var highlightsHtml = '';
      if (highlights.length > 0) {
        highlightsHtml = '<div class="recipe-highlights">';
        highlights.forEach(function (h) {
          var shortH = h.length > 12 ? h.substring(0, 12) + '...' : h;
          highlightsHtml += '<span class="highlight-tag">' + escapeHtml(shortH) + '</span>';
        });
        highlightsHtml += '</div>';
      }

      return '\
        <div class="recipe-card ' + escapeHtml(recipe.category || '') + '" data-recipe-id="' + recipe.id + '">\
          <div class="recipe-header">\
            <div class="recipe-name">' + escapeHtml(recipe.name) + '</div>\
          </div>\
          <div class="recipe-tags">' + tagsHtml + '</div>\
          ' + descHtml + '\
          ' + highlightsHtml + '\
          <div class="recipe-meta">\
            <span>\u{1F552} ' + (recipe.cook_time || '--') + '分钟</span>\
            <span>\u{1F3AF} ' + escapeHtml(recipe.difficulty || '--') + '</span>\
            <span>\u{1F525} ' + ((recipe.nutrition && recipe.nutrition.calories) || '--') + 'kcal</span>\
          </div>' + detailHtml + '\
        </div>';
    }

    var html = '';
    if (state.aiMode && state.aiRecommendations && Object.keys(state.aiRecommendations).length > 0) {
      // AI推荐模式：按分类展示全部推荐食谱
      var catLabelMap = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack: '加餐' };
      var catIconMap = { breakfast: '\u{1F305}', lunch: '\u{1F3D9}', dinner: '\u{1F303}', snack: '\u{1F35E}' };
      var catOrder = ['breakfast', 'lunch', 'dinner', 'snack'];

      catOrder.forEach(function (cat) {
        var recipes = state.aiRecommendations[cat] || [];
        if (recipes.length === 0) return;
        var label = catLabelMap[cat] || cat;
        var icon = catIconMap[cat] || '\u{1F372}';
        html += '<div class="ai-category-section">\
          <div class="ai-category-header">\
            <div class="ai-category-title">' + icon + ' ' + escapeHtml(label) + '推荐</div>\
            <div class="ai-category-count">' + recipes.length + '道</div>\
          </div>';
        recipes.forEach(function (recipe) {
          html += renderRecipeCard(recipe);
        });
        html += '</div>';
      });
    } else {
      // 正常模式：平铺展示
      state.recipes.forEach(function (recipe) {
        html += renderRecipeCard(recipe);
      });
    }

    container.innerHTML = aiBannerHtml + html;
    bindCardEvents();

    // AI推荐横幅的返回按钮
    if (state.aiMode) {
      var closeBtn = document.getElementById('ai-banner-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', function () {
          state.condition = 'all';
          state.category = 'all';
          document.querySelectorAll('.filter-chip').forEach(function (c) {
            if (c.dataset.value === 'all') c.classList.add('active');
            else c.classList.remove('active');
          });
          loadRecipes();
        });
      }
    }
  }

  function bindCardEvents() {
    document.querySelectorAll('.recipe-card').forEach(function (card) {
      card.addEventListener('click', function () {
        var id = card.dataset.recipeId;
        if (state.expandedId === id) {
          state.expandedId = null;
        } else {
          state.expandedId = id;
        }
        renderRecipeList();
      });
    });
  }

  function bindFilterEvents() {
    document.querySelectorAll('.filter-chip[data-filter="condition"]').forEach(function (chip) {
      chip.addEventListener('click', function () {
        state.condition = chip.dataset.value;
        state.expandedId = null;
        document.querySelectorAll('.filter-chip[data-filter="condition"]').forEach(function (c) { c.classList.remove('active'); });
        chip.classList.add('active');
        loadRecipes();
      });
    });

    document.querySelectorAll('.filter-chip[data-filter="category"]').forEach(function (chip) {
      chip.addEventListener('click', function () {
        state.category = chip.dataset.value;
        state.expandedId = null;
        document.querySelectorAll('.filter-chip[data-filter="category"]').forEach(function (c) { c.classList.remove('active'); });
        chip.classList.add('active');
        loadRecipes();
      });
    });
  }

  function doAIRecommend() {
    var btn = document.getElementById('ai-recommend-btn');
    if (btn) { btn.disabled = true; btn.innerHTML = '\u{1F504} 推荐中...'; }

    var apiObj = window.api;
    if (!apiObj) {
      // fallback：使用fetch
      doAIRecommendFallback(btn);
      return;
    }

    apiObj.request('/nutrition/recommend', { method: 'GET' })
      .then(function (res) {
        if (btn) { btn.disabled = false; btn.innerHTML = '\u{2728} AI推荐'; }
        if (res.code === 0 && res.data) {
          var recs = res.data.recommendations || {};
          var reasons = res.data.reasons || [];
          var flatList = [];
          for (var cat in recs) { if (Array.isArray(recs[cat])) flatList = flatList.concat(recs[cat]); }
          state.aiMode = true;
          state.aiRecommendations = recs;
          state.aiReasons = reasons;
          state.recipes = flatList;
          state.expandedId = null;
          renderRecipeList();
          showToast('已根据您的健康档案推荐食谱', 'success');
        } else {
          showToast(res.message || '推荐失败，请稍后重试', 'error');
        }
      })
      .catch(function (err) {
        if (btn) { btn.disabled = false; btn.innerHTML = '\u{2728} AI推荐'; }
        console.error('[AI推荐] 请求失败:', err);
        showToast('推荐失败，请稍后重试', 'error');
      });
  }

  function doAIRecommendFallback(btn) {
    fetch(API_BASE + '/nutrition/recommend', { method: 'GET', headers: { 'Content-Type': 'application/json' } })
      .then(function (res) { return res.json(); })
      .then(function (res) {
        if (btn) { btn.disabled = false; btn.innerHTML = '\u{2728} AI推荐'; }
        if (res.code === 0 && res.data) {
          var recs = res.data.recommendations || {};
          var reasons = res.data.reasons || [];
          var flatList = [];
          for (var cat in recs) { if (Array.isArray(recs[cat])) flatList = flatList.concat(recs[cat]); }
          state.aiMode = true;
          state.aiRecommendations = recs;
          state.aiReasons = reasons;
          state.recipes = flatList;
          state.expandedId = null;
          renderRecipeList();
          showToast('已根据您的健康档案推荐食谱', 'success');
        } else {
          showToast(res.message || '推荐失败，请稍后重试', 'error');
        }
      })
      .catch(function (err) {
        if (btn) { btn.disabled = false; btn.innerHTML = '\u{2728} AI推荐'; }
        console.error('[AI推荐] fallback请求失败:', err);
        showToast('推荐失败，请稍后重试', 'error');
      });
  }

  function render(container) {
    injectStyles();

    var conditionChips = conditions.map(function (c) {
      return '<button class="filter-chip ' + (state.condition === c.value ? 'active' : '') + '" data-filter="condition" data-value="' + c.value + '">' + c.label + '</button>';
    }).join('');

    var categoryChips = categories.map(function (c) {
      return '<button class="filter-chip ' + (state.category === c.value ? 'active' : '') + '" data-filter="category" data-value="' + c.value + '">' + c.label + '</button>';
    }).join('');

    var html = '\
      <div class="nutrition-page">\
        <div class="nutrition-header">\
          <div class="page-header" style="border-bottom:none;">\
            <h1>\u{1F372} 饮食调养</h1>\
            <div class="subtitle">健康饮食，从每一餐开始</div>\
          </div>\
          <div class="filter-bar">\
            <div class="filter-group">' + conditionChips + '</div>\
            <div class="filter-group">' + categoryChips + '</div>\
          </div>\
        </div>\
        <div class="recipe-list" id="recipe-list">' + renderSkeleton() + '</div>\
        <button class="ai-recommend-btn" id="ai-recommend-btn">\u{2728} AI推荐</button>\
      </div>';

    container.innerHTML = html;
    bindFilterEvents();

    document.getElementById('ai-recommend-btn').addEventListener('click', doAIRecommend);

    loadRecipes();
  }

  window.Pages = window.Pages || {};
  window.Pages.nutrition = render;
})();
