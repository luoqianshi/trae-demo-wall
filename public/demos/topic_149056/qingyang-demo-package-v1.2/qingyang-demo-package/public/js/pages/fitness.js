/**
 * 运动健身页面 - fitness.js
 * 功能：运动知识库、筛选、详情展开、AI推荐、新手指导
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
    category: 'all',
    difficulty: 'all',
    exercises: [],
    loading: false,
    expandedId: null,
    aiMode: false,
    aiRecommendations: {},
    aiReasons: []
  };

  var categories = [
    { value: 'all', label: '全部' },
    { value: 'aerobic', label: '有氧' },
    { value: 'resistance', label: '抗阻' },
    { value: 'flexibility', label: '拉伸' }
  ];

  var diffMap = {
    beginner: '新手',
    intermediate: '进阶',
    advanced: '高级'
  };

  var difficulties = [
    { value: 'all', label: '全部' },
    { value: 'beginner', label: '新手' },
    { value: 'intermediate', label: '进阶' },
    { value: 'advanced', label: '高级' }
  ];

  function injectStyles() {
    if (document.getElementById('fitness-page-style')) return;
    var style = document.createElement('style');
    style.id = 'fitness-page-style';
    style.textContent = '\
.fitness-page { padding-bottom: 80px; }\
.fitness-header { background: var(--bg-card); border-bottom: 1px solid var(--border-light); position: sticky; top: 0; z-index: 10; }\
.filter-bar { display: flex; gap: 12px; padding: 12px 16px; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; }\
.filter-bar::-webkit-scrollbar { display: none; }\
.filter-group { display: flex; gap: 8px; flex-shrink: 0; }\
.filter-chip { padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s; border: 1.5px solid var(--border); background: var(--bg-card); color: var(--text-secondary); white-space: nowrap; }\
.filter-chip.active { background: var(--primary); color: #fff; border-color: var(--primary); }\
.beginner-section { background: linear-gradient(135deg, var(--primary-light), var(--primary)); border-radius: var(--radius); margin: 12px 16px; padding: 16px; color: #fff; }\
.beginner-section .section-title { font-size: 16px; font-weight: 600; margin-bottom: 12px; display: flex; align-items: center; gap: 6px; }\
.beginner-cards { display: flex; gap: 10px; overflow-x: auto; scrollbar-width: none; }\
.beginner-cards::-webkit-scrollbar { display: none; }\
.beginner-card { flex-shrink: 0; background: rgba(255,255,255,0.2); backdrop-filter: blur(4px); border-radius: var(--radius-sm); padding: 12px; width: 140px; cursor: pointer; transition: all 0.2s; }\
.beginner-card:active { transform: scale(0.96); }\
.beginner-card .name { font-size: 14px; font-weight: 600; margin-bottom: 4px; }\
.beginner-card .meta { font-size: 12px; opacity: 0.9; }\
.exercise-list { padding: 12px 16px; }\
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
.exercise-card { background: var(--bg-card); border-radius: var(--radius); padding: 16px; margin-bottom: 12px; box-shadow: var(--shadow); transition: all 0.2s; }\
.exercise-card:active { box-shadow: var(--shadow-md); }\
.exercise-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }\
.exercise-name { font-size: 16px; font-weight: 600; color: var(--text); flex: 1; }\
.exercise-tags { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px; }\
.exercise-meta { display: flex; gap: 16px; font-size: 13px; color: var(--text-secondary); flex-wrap: wrap; }\
.exercise-meta span { display: flex; align-items: center; gap: 4px; }\
.exercise-brief { font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin-bottom: 10px; }\
.exercise-highlights { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 10px; }\
.exercise-highlights .highlight-tag { font-size: 11px; padding: 3px 8px; border-radius: 12px; background: rgba(13,148,136,0.08); color: var(--primary); }\
.exercise-card.aerobic { border-left: 3px solid var(--primary); }\
.exercise-card.resistance { border-left: 3px solid var(--accent); }\
.exercise-card.flexibility { border-left: 3px solid #8b5cf6; }\
.exercise-detail { margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--border-light); animation: fadeIn 0.3s ease; }\
.exercise-section-title { font-size: 14px; font-weight: 600; color: var(--text); margin-bottom: 8px; }\
.exercise-desc { font-size: 14px; color: var(--text-secondary); line-height: 1.6; margin-bottom: 12px; }\
.step-cards { display: flex; flex-direction: column; gap: 10px; margin-bottom: 14px; }\
.step-card { background: var(--bg-input); border-radius: var(--radius-sm); padding: 12px; display: flex; gap: 10px; align-items: flex-start; }\
.step-card .step-num { width: 28px; height: 28px; border-radius: 50%; background: var(--primary); color: #fff; font-size: 12px; font-weight: 600; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }\
.step-card .step-text { font-size: 14px; color: var(--text-secondary); line-height: 1.5; flex: 1; }\
.tips-list { list-style: none; padding: 0; margin: 0 0 14px; }\
.tips-list li { position: relative; padding-left: 18px; font-size: 13px; color: var(--text-secondary); line-height: 1.6; margin-bottom: 6px; }\
.tips-list li::before { content: "\\2022"; position: absolute; left: 0; color: var(--accent); font-weight: 700; }\
.muscle-tags { display: flex; gap: 6px; flex-wrap: wrap; }\
.muscle-tags .tag { background: rgba(13,148,136,0.08); color: var(--primary); border: 1px solid rgba(13,148,136,0.15); }\
.add-plan-btn { margin-top: 14px; width: 100%; }\
.ai-recommend-btn { position: fixed; bottom: calc(var(--nav-height) + 16px); left: 50%; transform: translateX(-50%); background: linear-gradient(135deg, var(--primary), var(--primary-dark)); color: #fff; border: none; padding: 12px 28px; border-radius: 28px; font-size: 14px; font-weight: 600; cursor: pointer; box-shadow: var(--shadow-md); z-index: 50; display: flex; align-items: center; gap: 6px; }\
.ai-recommend-btn:active { transform: translateX(-50%) scale(0.96); }\
.skeleton-card { background: var(--bg-card); border-radius: var(--radius); padding: 16px; margin-bottom: 12px; }\
.skeleton-line { height: 16px; border-radius: 4px; margin-bottom: 10px; }\
.skeleton-line.short { width: 60%; }\
.skeleton-line.meta { width: 40%; height: 14px; }\
.tutorial-section { margin-bottom: 14px; border-radius: var(--radius-sm); overflow: hidden; background: var(--bg-input); }\
.tutorial-gif { width: 100%; border-radius: var(--radius-sm); display: block; }\
.tutorial-link { display: flex; align-items: center; gap: 6px; padding: 10px; background: var(--bg-input); border-radius: var(--radius-sm); color: var(--primary); text-decoration: none; }\
.tutorial-link-btn { display: flex; align-items: center; justify-content: center; gap: 6px; padding: 12px; background: linear-gradient(135deg, rgba(13,148,136,0.1), rgba(13,148,136,0.05)); border: 1px solid rgba(13,148,136,0.2); border-radius: var(--radius-sm); color: var(--primary); text-decoration: none; font-size: 14px; font-weight: 500; transition: all 0.2s; }\
.tutorial-link-btn:hover { background: rgba(13,148,136,0.15); }\
.benefit-list li::before { content: "\\2714"; color: var(--success); }\
.mistake-list li::before { content: "\\2716"; color: var(--danger); }\
.variation-tags { display: flex; gap: 8px; flex-wrap: wrap; }\
.variation-tags .tag { background: rgba(245,158,11,0.1); color: var(--accent); border: 1px solid rgba(245,158,11,0.2); }\
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

  function loadExercises() {
    state.loading = true;
    state.aiMode = false;
    state.aiRecommendations = {};
    state.aiReasons = [];
    var container = document.getElementById('exercise-list');
    if (container) container.innerHTML = renderSkeleton();

    var params = [];
    if (state.category && state.category !== 'all') params.push('category=' + state.category);
    if (state.difficulty && state.difficulty !== 'all') params.push('difficulty=' + state.difficulty);
    params.push('pageSize=100');
    var url = API_BASE + '/fitness/exercises' + (params.length > 0 ? '?' + params.join('&') : '');
    apiRequest(url, { method: 'GET' }).then(function (res) {
      state.loading = false;
      if (res.code === 0 && res.data) {
        state.exercises = res.data.list || res.data.exercises || [];
      } else {
        state.exercises = [];
      }
      renderExerciseList();
      renderBeginnerSection();
    }).catch(function () {
      state.loading = false;
      state.exercises = [];
      renderExerciseList();
      renderBeginnerSection();
      showToast('加载失败，请稍后重试', 'error');
    });
  }

  function renderBeginnerSection() {
    var container = document.getElementById('beginner-section');
    if (!container) return;

    // 新手入门：按名称去重，覆盖有氧/抗阻/拉伸三类，每类最多3个，共8个
    var allBeginners = state.exercises.filter(function (e) {
      return e.difficulty === '新手' || e.difficulty === 'beginner';
    });
    // 按名称去重（防止数据库重复数据）
    var seenNames = {};
    var uniqueBeginners = allBeginners.filter(function (e) {
      if (seenNames[e.name]) return false;
      seenNames[e.name] = true;
      return true;
    });
    // 按类别分组，每类取前3个，保证多样性
    var byCategory = { aerobic: [], resistance: [], flexibility: [] };
    uniqueBeginners.forEach(function (e) {
      var cat = e.category;
      if (byCategory[cat]) byCategory[cat].push(e);
    });
    var beginners = [];
    ['aerobic', 'resistance', 'flexibility'].forEach(function (cat) {
      beginners = beginners.concat(byCategory[cat].slice(0, 3));
    });
    beginners = beginners.slice(0, 8);

    if (beginners.length === 0) {
      container.style.display = 'none';
      return;
    }

    var cardsHtml = '';
    beginners.forEach(function (ex) {
      cardsHtml += '\
        <div class="beginner-card" data-exercise-id="' + ex.id + '">\
          <div class="name">' + escapeHtml(ex.name) + '</div>\
          <div class="meta">' + (ex.duration || '--') + '分钟 · ' + (ex.calories_per_hour || '--') + 'kcal</div>\
        </div>';
    });

    container.innerHTML = '\
      <div class="beginner-section">\
        <div class="section-title">\u{1F31F} 新手入门</div>\
        <div class="beginner-cards">' + cardsHtml + '</div>\
      </div>';

    container.querySelectorAll('.beginner-card').forEach(function (card) {
      card.addEventListener('click', function () {
        var id = card.dataset.exerciseId;
        state.expandedId = state.expandedId === id ? null : id;
        renderExerciseList();
        setTimeout(function () {
          var el = document.querySelector('.exercise-card[data-exercise-id="' + id + '"]');
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      });
    });
  }

  function renderExerciseList() {
    var container = document.getElementById('exercise-list');
    if (!container) return;

    if (state.exercises.length === 0) {
      container.innerHTML = '\
        <div class="empty-state">\
          <div class="empty-icon">\u{1F3C3}</div>\
          <div class="empty-title">暂无运动</div>\
          <div class="empty-desc">换个筛选条件试试看</div>\
        </div>';
      return;
    }

    // AI推荐模式：顶部显示推荐理由
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
          <span>共推荐 <strong>' + state.exercises.length + '</strong> 项运动</span>\
          <button class="ai-banner-close" id="ai-banner-close">\u{21A9} 返回全部</button>\
        </div>\
      </div>';
    }

    // 生成单个运动卡片的HTML
    function renderExerciseCard(ex) {
      var typeMap = { aerobic: '有氧运动', resistance: '力量训练', flexibility: '拉伸放松', warmup: '热身' };
      var typeLabel = typeMap[ex.category] || ex.category || '--';
      var diffLabel = diffMap[ex.difficulty] || ex.difficulty || '--';
      var diffColor = ex.difficulty === 'beginner' || ex.difficulty === '新手' ? 'tag-success' : (ex.difficulty === 'advanced' || ex.difficulty === '高级' ? 'tag-danger' : 'tag-warning');

      var isExpanded = state.expandedId !== null && String(state.expandedId) === String(ex.id);
      var detailHtml = '';
      if (isExpanded) {
        var steps = ex.steps || [];
        var stepsHtml = '';
        if (steps.length > 0) {
          stepsHtml = '<div class="step-cards">';
          steps.forEach(function (step, idx) {
            stepsHtml += '\
              <div class="step-card">\
                <div class="step-num">' + (idx + 1) + '</div>\
                <div class="step-text">' + escapeHtml(step) + '</div>\
              </div>';
          });
          stepsHtml += '</div>';
        }

        var tips = ex.tips || [];
        if (typeof tips === 'string') tips = [tips];
        var tipsHtml = '';
        if (tips.length > 0) {
          tipsHtml = '<ul class="tips-list">';
          tips.forEach(function (tip) {
            tipsHtml += '<li>' + escapeHtml(tip) + '</li>';
          });
          tipsHtml += '</ul>';
        }

        var muscles = ex.muscle_groups || ex.muscles || ex.targetMuscles || [];
        if (typeof muscles === 'string') muscles = muscles.split(',');
        if (typeof muscles === 'object' && !Array.isArray(muscles)) muscles = Object.values(muscles);
        var muscleHtml = '';
        if (muscles.length > 0) {
          muscleHtml = '<div class="muscle-tags">';
          muscles.forEach(function (m) {
            muscleHtml += '<span class="tag">' + escapeHtml(m) + '</span>';
          });
          muscleHtml += '</div>';
        }

        var benefits = ex.benefits || [];
        if (typeof benefits === 'string') benefits = [benefits];
        var benefitsHtml = '';
        if (benefits.length > 0) {
          benefitsHtml = '<ul class="tips-list benefit-list">';
          benefits.forEach(function (b) {
            benefitsHtml += '<li>' + escapeHtml(b) + '</li>';
          });
          benefitsHtml += '</ul>';
        }

        var mistakes = ex.common_mistakes || [];
        if (typeof mistakes === 'string') mistakes = [mistakes];
        var mistakesHtml = '';
        if (mistakes.length > 0) {
          mistakesHtml = '<ul class="tips-list mistake-list">';
          mistakes.forEach(function (m) {
            mistakesHtml += '<li>' + escapeHtml(m) + '</li>';
          });
          mistakesHtml += '</ul>';
        }

        var variations = ex.variations || [];
        if (typeof variations === 'string') variations = [variations];
        var variationsHtml = '';
        if (variations.length > 0) {
          variationsHtml = '<div class="variation-tags">';
          variations.forEach(function (v) {
            variationsHtml += '<span class="tag tag-accent">' + escapeHtml(v) + '</span>';
          });
          variationsHtml += '</div>';
        }

        var tutorialHtml = '';
        var tutorialUrl = ex.video_url || ('https://www.baidu.com/s?wd=' + encodeURIComponent(ex.name + ' 正确动作 教学 GIF'));
        tutorialHtml = '<div class="exercise-section-title" style="margin-top:14px;">&#127916; 动作教程</div>' +
          '<div class="tutorial-section">' +
          '<a href="' + escapeHtml(tutorialUrl) + '" target="_blank" class="tutorial-link-btn">&#127916; 点击查看 ' + escapeHtml(ex.name) + ' 动作教程（含动图演示）</a></div>';

        detailHtml = '\
          <div class="exercise-detail">\
            <div class="exercise-section-title">\u{1F4DD} 运动介绍</div>\
            <div class="exercise-desc">' + escapeHtml(ex.description || '暂无介绍') + '</div>\
            ' + tutorialHtml + '\
            <div class="exercise-section-title" style="margin-top:14px;">&#127942; 运动好处</div>' + benefitsHtml + '\
            <div class="exercise-section-title" style="margin-top:14px;">\u{1F3AF} 步骤分解</div>' + stepsHtml + '\
            <div class="exercise-section-title" style="margin-top:14px;">\u{274C} 常见错误</div>' + mistakesHtml + '\
            <div class="exercise-section-title" style="margin-top:14px;">\u{26A0} 注意要点</div>' + tipsHtml + '\
            <div class="exercise-section-title" style="margin-top:14px;">\u{1F4AA} 锻炼肌群</div>' + muscleHtml + '\
            <div class="exercise-section-title" style="margin-top:14px;">&#128200; 进阶变式</div>' + variationsHtml + '\
            <button class="btn btn-primary btn-sm add-plan-btn" data-add-plan="' + ex.id + '">\u{2795} 添加到今日计划</button>\
          </div>';
      }

      var descText = ex.description || '';
      if (descText && descText.length > 35) descText = descText.substring(0, 35) + '...';
      var descHtml = descText ? '<div class="exercise-brief">' + escapeHtml(descText) + '</div>' : '';

      var highlights = (ex.benefits || []).slice(0, 2);
      var highlightsHtml = '';
      if (highlights.length > 0) {
        highlightsHtml = '<div class="exercise-highlights">';
        highlights.forEach(function (h) {
          var shortH = h.length > 10 ? h.substring(0, 10) + '...' : h;
          highlightsHtml += '<span class="highlight-tag">' + escapeHtml(shortH) + '</span>';
        });
        highlightsHtml += '</div>';
      }

      return '\
        <div class="exercise-card ' + escapeHtml(ex.category || '') + '" data-exercise-id="' + ex.id + '">\
          <div class="exercise-header">\
            <div class="exercise-name">' + escapeHtml(ex.name) + '</div>\
          </div>\
          <div class="exercise-tags">\
            <span class="tag tag-primary">' + escapeHtml(typeLabel) + '</span>\
            <span class="tag ' + diffColor + '">' + escapeHtml(diffLabel) + '</span>\
          </div>\
          ' + descHtml + '\
          ' + highlightsHtml + '\
          <div class="exercise-meta">\
            <span>\u{1F552} ' + (ex.duration || '--') + '分钟</span>\
            <span>\u{1F525} ' + (ex.calories_per_hour || '--') + 'kcal/时</span>\
            <span>\u{1F3CB} ' + (ex.equipment || '无需器械') + '</span>\
          </div>' + detailHtml + '\
        </div>';
    }

    var html = '';
    if (state.aiMode && state.aiRecommendations && Object.keys(state.aiRecommendations).length > 0) {
      // AI推荐模式：按分类展示全部推荐运动
      var catLabelMap = { aerobic: '有氧运动', resistance: '力量训练', flexibility: '拉伸放松' };
      var catIconMap = { aerobic: '\u{1F3C3}', resistance: '\u{1F4AA}', flexibility: '\u{1F9D8}' };
      var catOrder = ['aerobic', 'resistance', 'flexibility'];

      catOrder.forEach(function (cat) {
        var exercises = state.aiRecommendations[cat] || [];
        if (exercises.length === 0) return;
        var label = catLabelMap[cat] || cat;
        var icon = catIconMap[cat] || '\u{1F3CB}';
        html += '<div class="ai-category-section">\
          <div class="ai-category-header">\
            <div class="ai-category-title">' + icon + ' ' + escapeHtml(label) + '推荐</div>\
            <div class="ai-category-count">' + exercises.length + '项</div>\
          </div>';
        exercises.forEach(function (ex) {
          html += renderExerciseCard(ex);
        });
        html += '</div>';
      });
    } else {
      // 正常模式：平铺展示
      state.exercises.forEach(function (ex) {
        html += renderExerciseCard(ex);
      });
    }

    container.innerHTML = aiBannerHtml + html;
    bindCardEvents();

    document.querySelectorAll('[data-add-plan]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        showToast('已添加到今日计划', 'success');
      });
    });

    // AI推荐横幅的返回按钮
    if (state.aiMode) {
      var closeBtn = document.getElementById('ai-banner-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', function () {
          state.category = 'all';
          state.difficulty = 'all';
          document.querySelectorAll('.filter-chip').forEach(function (c) {
            if (c.dataset.value === 'all') c.classList.add('active');
            else c.classList.remove('active');
          });
          loadExercises();
        });
      }
    }
  }

  function bindCardEvents() {
    document.querySelectorAll('.exercise-card').forEach(function (card) {
      card.addEventListener('click', function () {
        var id = card.dataset.exerciseId;
        // 使用字符串比较，避免 parseInt 对非数字ID返回NaN的问题
        if (state.expandedId === id) {
          state.expandedId = null;
        } else {
          state.expandedId = id;
        }
        renderExerciseList();
      });
    });
  }

  function bindFilterEvents() {
    document.querySelectorAll('.filter-chip[data-filter="category"]').forEach(function (chip) {
      chip.addEventListener('click', function () {
        state.category = chip.dataset.value;
        state.expandedId = null;
        document.querySelectorAll('.filter-chip[data-filter="category"]').forEach(function (c) { c.classList.remove('active'); });
        chip.classList.add('active');
        loadExercises();
      });
    });

    document.querySelectorAll('.filter-chip[data-filter="difficulty"]').forEach(function (chip) {
      chip.addEventListener('click', function () {
        state.difficulty = chip.dataset.value;
        state.expandedId = null;
        document.querySelectorAll('.filter-chip[data-filter="difficulty"]').forEach(function (c) { c.classList.remove('active'); });
        chip.classList.add('active');
        loadExercises();
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

    apiObj.request('/fitness/recommend', { method: 'GET' })
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
          state.exercises = flatList;
          state.expandedId = null;
          renderExerciseList();
          renderBeginnerSection();
          showToast('已根据您的健康档案推荐运动', 'success');
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
    fetch(API_BASE + '/fitness/recommend', { method: 'GET', headers: { 'Content-Type': 'application/json' } })
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
          state.exercises = flatList;
          state.expandedId = null;
          renderExerciseList();
          renderBeginnerSection();
          showToast('已根据您的健康档案推荐运动', 'success');
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

    var categoryChips = categories.map(function (c) {
      return '<button class="filter-chip ' + (state.category === c.value ? 'active' : '') + '" data-filter="category" data-value="' + c.value + '">' + c.label + '</button>';
    }).join('');

    var difficultyChips = difficulties.map(function (c) {
      return '<button class="filter-chip ' + (state.difficulty === c.value ? 'active' : '') + '" data-filter="difficulty" data-value="' + c.value + '">' + c.label + '</button>';
    }).join('');

    var html = '\
      <div class="fitness-page">\
        <div class="fitness-header">\
          <div class="page-header" style="border-bottom:none;">\
            <h1>\u{1F3C3} 运动健身</h1>\
            <div class="subtitle">科学运动，循序渐进</div>\
          </div>\
          <div class="filter-bar">\
            <div class="filter-group">' + categoryChips + '</div>\
            <div class="filter-group">' + difficultyChips + '</div>\
          </div>\
        </div>\
        <div id="beginner-section"></div>\
        <div class="exercise-list" id="exercise-list">' + renderSkeleton() + '</div>\
        <button class="ai-recommend-btn" id="ai-recommend-btn">\u{2728} AI推荐</button>\
      </div>';

    container.innerHTML = html;
    bindFilterEvents();

    document.getElementById('ai-recommend-btn').addEventListener('click', doAIRecommend);

    loadExercises();
  }

  window.Pages = window.Pages || {};
  window.Pages.fitness = render;
})();
