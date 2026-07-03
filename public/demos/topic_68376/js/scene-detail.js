/**
 * 你好，我的小孩 - 场景详情页逻辑
 * 功能：场景信息展示、对话气泡渲染、多轮追问、进度追踪、深度对话
 */
(function (window) {
  'use strict';

  // ==================== 状态管理 ====================
  var state = {
    scene: null,
    currentRound: 0,
    totalRounds: 0,
    isLoading: false,
    mode: 'basic',
    deepDialog: null,
    deepCurrentRound: 0,
    deepTotalRounds: 0,
    deepDialogs: []
  };

  // ==================== DOM 元素 ====================
  var $ = function (id) { return document.getElementById(id); };

  var els = {};

  function cacheElements() {
    els.loadingState = $('loadingState');
    els.errorState = $('errorState');
    els.detailContent = $('detailContent');
    els.sceneTitle = $('sceneTitle');
    els.backBtn = $('backBtn');
    els.restartBtn = $('restartBtn');

    els.sceneIcon = $('sceneIcon');
    els.sceneCategory = $('sceneCategory');
    els.sceneDifficulty = $('sceneDifficulty');
    els.sceneOverviewTitle = $('sceneOverviewTitle');
    els.sceneDesc = $('sceneDesc');
    els.sceneTime = $('sceneTime');
    els.sceneRounds = $('sceneRounds');
    els.sceneWarning = $('sceneWarning');

    els.progressFill = $('progressFill');
    els.progressSteps = $('progressSteps');
    els.progressText = $('progressText');

    els.dialogContainer = $('dialogContainer');
    els.nextRoundSection = $('nextRoundSection');
    els.nextRoundBtn = $('nextRoundBtn');
    els.completeSection = $('completeSection');
    els.completeRestartBtn = $('completeRestartBtn');

    els.deepDialogEntry = $('deepDialogEntry');
    els.enterDeepDialogBtn = $('enterDeepDialogBtn');

    els.deepDialogSection = $('deepDialogSection');
    els.backToBasicBtn = $('backToBasicBtn');
    els.rebellionCards = $('rebellionCards');

    els.deepDialogContainer = $('deepDialogContainer');
    els.backToRebellionBtn = $('backToRebellionBtn');
    els.deepDialogTitle = $('deepDialogTitle');
    els.deepDialogSubtitle = $('deepDialogSubtitle');
    els.deepProgressFill = $('deepProgressFill');
    els.deepProgressText = $('deepProgressText');
    els.deepDialogBubbles = $('deepDialogBubbles');
    els.deepNextRoundSection = $('deepNextRoundSection');
    els.deepNextRoundBtn = $('deepNextRoundBtn');
    els.deepCompleteSection = $('deepCompleteSection');
    els.deepRestartBtn = $('deepRestartBtn');
    els.deepTryOtherBtn = $('deepTryOtherBtn');

    els.similarScenesSection = $('similarScenesSection');
    els.similarScenesGrid = $('similarScenesGrid');
    els.disclaimerFloating = $('disclaimerFloating');
    els.disclaimerToggle = $('disclaimerToggle');
    els.dialogSummaryBody = $('dialogSummaryBody');
    els.childResponseSection = $('childResponseSection');
    els.childResponseOptions = $('childResponseOptions');
    els.customChildInput = $('customChildInput');
    els.customChildBtn = $('customChildBtn');
  }

  // ==================== 初始化 ====================
  function init() {
    cacheElements();
    bindEvents();
    initDisclaimer();

    var sceneId = getSceneIdFromUrl();
    if (!sceneId) {
      showError();
      return;
    }

    loadScene(sceneId);
  }

  // ==================== 免责声明交互 ====================
  function initDisclaimer() {
    if (!els.disclaimerToggle) return;

    document.body.style.paddingBottom = '48px';

    els.disclaimerToggle.addEventListener('click', function () {
      if (els.disclaimerFloating.classList.contains('disclaimer-floating--collapsed')) {
        els.disclaimerFloating.classList.remove('disclaimer-floating--collapsed');
        els.disclaimerToggle.textContent = '收起';
        document.body.style.paddingBottom = '48px';
      } else {
        els.disclaimerFloating.classList.add('disclaimer-floating--collapsed');
        els.disclaimerToggle.textContent = '展开';
        document.body.style.paddingBottom = '36px';
      }
    });
  }

  function getSceneIdFromUrl() {
    if (window.App && window.App.getQueryParam) {
      return window.App.getQueryParam('id');
    }
    var params = new URLSearchParams(window.location.search);
    return params.get('id');
  }

  // ==================== 加载场景 ====================
  function loadScene(sceneId) {
    showLoading();

    setTimeout(function () {
      var scene = null;
      var isCustom = false;

      var params = new URLSearchParams(window.location.search);
      if (params.get('custom') === '1' || sceneId.indexOf('custom-') === 0) {
        try {
          var savedScenes = JSON.parse(localStorage.getItem('customScenes') || '{}');
          if (savedScenes[sceneId]) {
            scene = savedScenes[sceneId];
            isCustom = true;
          }
        } catch (e) {}
      }

      if (!scene) {
        if (window.App && window.App.getSceneById) {
          scene = window.App.getSceneById(sceneId);
        } else if (window.MockData && window.MockData.scenes) {
          var scenes = window.MockData.scenes;
          for (var i = 0; i < scenes.length; i++) {
            if (scenes[i].id === sceneId) {
              scene = scenes[i];
              break;
            }
          }
        }
      }

      if (!scene) {
        showError();
        return;
      }

      state.scene = scene;
      state.isCustom = isCustom;
      state.totalRounds = scene.rounds ? scene.rounds.length : 0;
      state.currentRound = 0;

      renderSceneInfo();
      renderProgressSteps();
      showContent();

      if (isCustom && scene.similarScenes && scene.similarScenes.length > 0) {
        renderSimilarScenes(scene.similarScenes);
      }

      setTimeout(function () {
        expandNextRound();
      }, 500);
    }, 300);
  }

  // ==================== 渲染场景信息 ====================
  function renderSceneInfo() {
    var scene = state.scene;

    els.sceneTitle.textContent = scene.title;
    els.sceneIcon.textContent = scene.icon;
    els.sceneOverviewTitle.textContent = scene.title;
    els.sceneDesc.textContent = scene.description;
    els.sceneTime.textContent = scene.estimatedTime;
    els.sceneRounds.textContent = state.totalRounds + '轮';
    els.sceneWarning.textContent = scene.warning;

    var catName = scene.categoryName || getCategoryName(scene.category);
    els.sceneCategory.textContent = catName;

    if (state.isCustom) {
      els.sceneCategory.textContent = '✨ ' + catName + ' · 自定义';
    }

    if (window.App && window.App.difficultyStars) {
      els.sceneDifficulty.innerHTML = window.App.difficultyStars(scene.difficulty);
    } else {
      var stars = '';
      for (var i = 0; i < scene.difficulty; i++) {
        stars += '⭐';
      }
      els.sceneDifficulty.textContent = stars;
    }

    if (scene.coverGradient) {
      els.sceneIcon.style.background = scene.coverGradient;
    }
  }

  function getCategoryName(categoryId) {
    if (window.App && window.App.getAllCategories) {
      var cats = window.App.getAllCategories();
      for (var i = 0; i < cats.length; i++) {
        if (cats[i].id === categoryId) {
          return cats[i].name;
        }
      }
    }
    if (window.MockData && window.MockData.categories) {
      var cats2 = window.MockData.categories;
      for (var j = 0; j < cats2.length; j++) {
        if (cats2[j].id === categoryId) {
          return cats2[j].name;
        }
      }
    }
    return categoryId;
  }

  // ==================== 渲染进度步骤 ====================
  function renderProgressSteps() {
    var html = '';
    for (var i = 1; i <= state.totalRounds; i++) {
      html += '<div class="progress-step" data-step="' + i + '">' + i + '</div>';
    }
    els.progressSteps.innerHTML = html;
    updateProgress();
  }

  function updateProgress() {
    var percent = (state.currentRound / state.totalRounds) * 100;
    els.progressFill.style.width = percent + '%';
    els.progressText.textContent = '第 ' + Math.max(state.currentRound, 1) + ' 轮 / 共 ' + state.totalRounds + ' 轮';

    var steps = els.progressSteps.querySelectorAll('.progress-step');
    steps.forEach(function (stepEl, index) {
      var stepNum = index + 1;
      stepEl.classList.remove('active', 'completed');
      if (stepNum < state.currentRound) {
        stepEl.classList.add('completed');
      } else if (stepNum === state.currentRound) {
        stepEl.classList.add('active');
      }
    });
  }

  // ==================== 展开下一轮 ====================
  function expandNextRound() {
    if (state.isLoading) return;
    if (state.currentRound >= state.totalRounds) {
      showComplete();
      return;
    }

    state.currentRound++;
    var round = state.scene.rounds[state.currentRound - 1];

    state.isLoading = true;
    els.nextRoundBtn.classList.add('loading');

    // 隐藏"继续"按钮，显示加载态
    els.nextRoundSection.style.display = 'none';

    setTimeout(function () {
      // 只渲染家长话术 + 提示，不渲染孩子回应
      renderRound(round, state.currentRound);
      updateProgress();

      state.isLoading = false;
      els.nextRoundBtn.classList.remove('loading');

      // 显示孩子回应选择区域
      showChildResponseOptions();

      if (state.currentRound > 1) {
        els.restartBtn.style.display = 'inline-flex';
      }
    }, 800);
  }

  // ==================== 显示孩子回应选项 ====================
  function showChildResponseOptions() {
    var options = [];
    if (window.MockData && window.MockData.getChildResponseOptions) {
      options = window.MockData.getChildResponseOptions(state.scene, state.currentRound);
    }

    if (options.length === 0) {
      // 无选项时直接显示"继续"按钮
      els.childResponseSection.style.display = 'none';
      els.nextRoundSection.style.display = 'block';
      return;
    }

    var html = '';
    for (var i = 0; i < options.length; i++) {
      var opt = options[i];
      html +=
        '<button class="child-response-option" data-index="' + i + '">' +
          '<span class="child-response-option__icon">' + opt.icon + '</span>' +
          '<span class="child-response-option__text">' + escapeHtml(opt.text) + '</span>' +
          '<span class="child-response-option__tag">' + opt.label + '</span>' +
        '</button>';
    }
    els.childResponseOptions.innerHTML = html;
    els.childResponseSection.style.display = 'block';
    els.nextRoundSection.style.display = 'none';

    // 绑定选项点击事件
    var btns = els.childResponseOptions.querySelectorAll('.child-response-option');
    for (var j = 0; j < btns.length; j++) {
      (function (index) {
        btns[index].addEventListener('click', function () {
          selectChildResponse(options[index]);
        });
      })(j);
    }

    // 滚动到选项区域
    setTimeout(function () {
      els.childResponseSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }

  // ==================== 选择孩子回应 ====================
  function selectChildResponse(option) {
    // 隐藏选择区域
    els.childResponseSection.style.display = 'none';

    // 添加孩子回应气泡 + 家长回应气泡到对话区
    var round = state.scene.rounds[state.currentRound - 1];
    appendChildResponseBubbles(option);

    // 显示"继续下一轮"按钮（或完成）
    if (state.currentRound >= state.totalRounds) {
      setTimeout(function () {
        showComplete();
      }, 600);
    } else {
      els.nextRoundSection.style.display = 'block';
      setTimeout(function () {
        els.nextRoundSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }

  // ==================== 追加孩子回应+家长回应气泡 ====================
  function appendChildResponseBubbles(option) {
    var container = els.dialogContainer;
    var lastRound = container.querySelector('.dialog-round:last-child');
    if (!lastRound) return;

    // 孩子回应气泡
    var childBubbleHtml =
      '<div class="bubble-group bubble-group--child">' +
        '<div class="bubble-label">' + option.icon + ' 孩子说</div>' +
        '<div class="dialog-bubble dialog-bubble--child">' +
          escapeHtml(option.text) +
        '</div>' +
      '</div>';

    // 如果是自定义输入，添加分析标签
    if (option.isCustom && option.type !== 'unknown') {
      childBubbleHtml +=
        '<div class="child-response-analysis">' +
          '<span class="child-response-analysis__label">语义分析：' + option.label + '</span>' +
        '</div>';
    }

    // 家长回应气泡
    var parentBubbleHtml =
      '<div class="bubble-group bubble-group--parent bubble-group--followup">' +
        '<div class="bubble-label">👨‍👩‍👧 你可以这样回应</div>' +
        '<div class="dialog-bubble dialog-bubble--parent dialog-bubble--followup">' +
          escapeHtml(option.parentFollowUp) +
        '</div>' +
      '</div>';

    lastRound.insertAdjacentHTML('beforeend', childBubbleHtml + parentBubbleHtml);
  }

  // ==================== 处理自定义输入 ====================
  function handleCustomInput() {
    var input = els.customChildInput.value.trim();
    if (!input) {
      els.customChildInput.focus();
      return;
    }

    // 分析语义
    var result = null;
    if (window.MockData && window.MockData.analyzeChildResponse) {
      result = window.MockData.analyzeChildResponse(input, state.scene, state.currentRound);
    }

    if (!result) {
      result = {
        type: 'unknown',
        icon: '💬',
        label: '自定义',
        text: input,
        parentFollowUp: '我听到了你说的。不管你现在的感受是什么，都是真实的、合理的。你能告诉我更多吗？',
        isCustom: true
      };
    }

    // 清空输入框
    els.customChildInput.value = '';

    // 显示加载动效
    els.customChildBtn.classList.add('loading');
    els.customChildBtn.textContent = '分析中...';

    setTimeout(function () {
      els.customChildBtn.classList.remove('loading');
      els.customChildBtn.textContent = '分析并回应';
      selectChildResponse(result);
    }, 800);
  }

  // ==================== 渲染单轮对话 ====================
  function renderRound(round, stepNum) {
    var roundEl = document.createElement('div');
    roundEl.className = 'dialog-round';

    var headerHtml =
      '<div class="dialog-round__header">' +
        '<span class="round-badge">第' + stepNum + '步</span>' +
        '<span class="round-title">' + escapeHtml(round.title) + '</span>' +
      '</div>';

    var parentBubbleHtml =
      '<div class="bubble-group bubble-group--parent">' +
        '<div class="bubble-label">👨‍👩‍👧 你可以这样说</div>' +
        '<div class="dialog-bubble dialog-bubble--parent">' +
          escapeHtml(round.parentLine) +
        '</div>' +
      '</div>';

    // 孩子回应不再自动渲染，改为用户在"孩子可能会怎么说"区域选择
    var tipsHtml = '';
    if (round.tips && round.tips.length > 0) {
      var tipsItems = '';
      round.tips.forEach(function (tip) {
        tipsItems += '<li class="tips-panel__item">' + escapeHtml(tip) + '</li>';
      });
      tipsHtml =
        '<div class="tips-panel">' +
          '<div class="tips-panel__title">💡 沟通要点</div>' +
          '<ul class="tips-panel__list">' + tipsItems + '</ul>' +
        '</div>';
    }

    var whyHtml = '';
    if (round.whyItWorks) {
      whyHtml =
        '<div class="why-panel">' +
          '<button class="why-panel__toggle" aria-expanded="false">' +
            '<span class="why-panel__toggle-icon">▶</span>' +
            '<span>为什么要这样说？</span>' +
          '</button>' +
          '<div class="why-panel__content">' +
            '<p class="why-panel__text">' + escapeHtml(round.whyItWorks) + '</p>' +
          '</div>' +
        '</div>';
    }

    roundEl.innerHTML = headerHtml + parentBubbleHtml + tipsHtml + whyHtml;
    els.dialogContainer.appendChild(roundEl);

    if (whyHtml) {
      var toggleBtn = roundEl.querySelector('.why-panel__toggle');
      var content = roundEl.querySelector('.why-panel__content');
      toggleBtn.addEventListener('click', function () {
        var expanded = toggleBtn.getAttribute('aria-expanded') === 'true';
        toggleBtn.setAttribute('aria-expanded', !expanded);
        if (expanded) {
          content.classList.remove('open');
        } else {
          content.classList.add('open');
        }
      });
    }
  }

  // ==================== 显示/隐藏状态 ====================
  function showLoading() {
    els.loadingState.style.display = 'block';
    els.errorState.style.display = 'none';
    els.detailContent.style.display = 'none';
  }

  function showError() {
    els.loadingState.style.display = 'none';
    els.errorState.style.display = 'block';
    els.detailContent.style.display = 'none';
    els.sceneTitle.textContent = '场景未找到';
  }

  function showContent() {
    els.loadingState.style.display = 'none';
    els.errorState.style.display = 'none';
    els.detailContent.style.display = 'block';
  }

  function showComplete() {
    els.nextRoundSection.style.display = 'none';
    els.completeSection.style.display = 'block';
    els.restartBtn.style.display = 'inline-flex';

    renderDialogSummary();

    if (state.scene && state.scene.hasDeepDialog && els.deepDialogEntry) {
      els.deepDialogEntry.style.display = 'block';
    }

    if (state.isCustom && els.similarScenesSection) {
      els.similarScenesSection.style.display = 'block';
    }
  }

  // ==================== 对话总结 ====================
  function renderDialogSummary() {
    if (!els.dialogSummaryBody || !state.scene || !state.scene.rounds) return;

    var rounds = state.scene.rounds;
    var scene = state.scene;

    var stepsHtml = '';
    for (var i = 0; i < rounds.length; i++) {
      var r = rounds[i];
      stepsHtml +=
        '<div class="summary-step">' +
          '<div class="summary-step__num">' + (i + 1) + '</div>' +
          '<div class="summary-step__content">' +
            '<h5 class="summary-step__title">' + escapeHtml(r.title || ('第' + (i + 1) + '步')) + '</h5>' +
            '<p class="summary-step__line">' + escapeHtml(r.parentLine || r.tips && r.tips[0] || '') + '</p>' +
          '</div>' +
        '</div>';
    }

    var principles = generateSummaryPrinciples(scene);
    var principlesHtml = '';
    for (var j = 0; j < principles.length; j++) {
      principlesHtml += '<li>' + escapeHtml(principles[j]) + '</li>';
    }

    var rememberHtml = '';
    if (scene.warning) {
      rememberHtml += '<li>' + escapeHtml(scene.warning) + '</li>';
    }
    rememberHtml += '<li>先处理情绪，再处理问题——这是所有沟通的前提</li>';
    rememberHtml += '<li>说话的语气比内容更重要，保持平静和真诚</li>';
    if (scene.category === 'phone' || scene.category === 'academic') {
      rememberHtml += '<li>避免说教和命令，多用"你觉得呢"代替"你应该"</li>';
    } else if (scene.category === 'rebellion') {
      rememberHtml += '<li>给孩子选择权，不要强行逼迫，允许他说"不"</li>';
    } else if (scene.category === 'romance') {
      rememberHtml += '<li>不要羞辱和禁止，引导比堵截更有效</li>';
    } else {
      rememberHtml += '<li>多听少说，给孩子表达的空间</li>';
    }

    var html =
      '<div class="summary-section">' +
        '<h5 class="summary-section__title">沟通四步法回顾</h5>' +
        '<div class="summary-steps">' + stepsHtml + '</div>' +
      '</div>' +
      '<div class="summary-section">' +
        '<h5 class="summary-section__title">核心原则</h5>' +
        '<ul class="summary-principles">' + principlesHtml + '</ul>' +
      '</div>' +
      '<div class="summary-section">' +
        '<h5 class="summary-section__title">注意事项</h5>' +
        '<ul class="summary-remember">' + rememberHtml + '</ul>' +
      '</div>' +
      '<div class="summary-footer">' +
        '<span class="summary-footer__icon">💪</span>' +
        '<span>改变需要时间，一次对话不够，请保持耐心和信心</span>' +
      '</div>';

    els.dialogSummaryBody.innerHTML = html;
  }

  function generateSummaryPrinciples(scene) {
    var principles = [];

    if (scene.category === 'phone') {
      principles.push('先共情再管教：承认手机对孩子的吸引力，再谈规则');
      principles.push('以身作则：家长也要放下手机，一起执行约定');
      principles.push('给选择权：让孩子参与制定规则，而非单方面强加');
    } else if (scene.category === 'academic') {
      principles.push('分离人和事：考不好不等于孩子不好，对事不对人');
      principles.push('关注过程而非结果：肯定努力，一起找方法');
      principles.push('降低压力：让孩子知道不管结果如何，你都在');
    } else if (scene.category === 'rebellion') {
      principles.push('情绪优先：先接住孩子的情绪，再谈事情');
      principles.push('尊重边界：给孩子空间，不逼他立刻开口');
      principles.push('说到做到：承诺的事一定要做到，重建信任');
    } else if (scene.category === 'romance') {
      principles.push('不禁止不羞辱：正常化感情，设底线而非一刀切');
      principles.push('开放沟通：让孩子愿意跟你说，比禁止更有效');
      principles.push('关注安全：保护好自己是底线');
    } else if (scene.category === 'weariness') {
      principles.push('不否定梦想：先理解孩子的想法，再引导思考');
      principles.push('多条路思维：学习不是唯一出路，但要多给自己选择');
      principles.push('降低目标：先定小目标，让孩子有成就感');
    } else if (scene.category === 'social') {
      principles.push('站在孩子这边：让孩子知道你不是他的对立面');
      principles.push('不包办代替：先问孩子希望你怎么帮，不擅自行动');
      principles.push('持续关注：不是一次聊完就好，要持续跟进');
    } else if (scene.category === 'identity') {
      principles.push('认真对待：孩子说的每句消极的话都要当真');
      principles.push('表达爱和支持：让孩子知道他对你很重要');
      principles.push('及时求助：必要时寻求专业心理咨询');
    } else if (scene.category === 'family') {
      principles.push('给孩子安全感：明确告诉他这不是他的错');
      principles.push('大人解决大人的问题：不要让孩子承担大人的情绪');
    } else {
      principles.push('先接情绪，再解问题——这是沟通的核心');
      principles.push('多听少说，让孩子感受到被理解');
      principles.push('一起想办法，不是单方面给答案');
    }

    return principles;
  }

  // ==================== 相似场景推荐 ====================
  function renderSimilarScenes(scenes) {
    if (!scenes || scenes.length === 0) return;

    var html = '';
    for (var i = 0; i < scenes.length; i++) {
      var scene = scenes[i];
      html +=
        '<article class="similar-scene-card" data-id="' + scene.id + '">' +
          '<div class="similar-scene-card__icon" style="background: ' + (scene.coverGradient || 'linear-gradient(135deg, #FF9A56, #FF6B6B)') + ';">' +
            '<span>' + (scene.icon || '💬') + '</span>' +
          '</div>' +
          '<div class="similar-scene-card__body">' +
            '<h4 class="similar-scene-card__title">' + escapeHtml(scene.title) + '</h4>' +
            '<p class="similar-scene-card__desc">' + escapeHtml(scene.description) + '</p>' +
          '</div>' +
          '<div class="similar-scene-card__arrow">→</div>' +
        '</article>';
    }
    els.similarScenesGrid.innerHTML = html;

    var cards = els.similarScenesGrid.querySelectorAll('.similar-scene-card');
    for (var j = 0; j < cards.length; j++) {
      (function (index) {
        cards[index].addEventListener('click', function () {
          var sceneId = scenes[index].id;
          window.location.href = 'scene-detail.html?id=' + sceneId;
        });
      })(j);
    }
  }

  // ==================== 深度对话 ====================
  function enterDeepDialog() {
    state.mode = 'deep-select';
    els.completeSection.style.display = 'none';
    els.nextRoundSection.style.display = 'none';
    els.deepDialogSection.style.display = 'block';

    state.deepDialogs = getDeepDialogs(state.scene.id);
    renderRebellionCards();
  }

  function getDeepDialogs(sceneId) {
    if (window.MockData && window.MockData.deepDialogs && window.MockData.deepDialogs[sceneId]) {
      return window.MockData.deepDialogs[sceneId];
    }
    return [];
  }

  function renderRebellionCards() {
    var html = '';
    for (var i = 0; i < state.deepDialogs.length; i++) {
      var dialog = state.deepDialogs[i];
      html +=
        '<div class="rebellion-card" data-index="' + i + '">' +
          '<div class="rebellion-card__icon">💬</div>' +
          '<div class="rebellion-card__content">' +
            '<h4 class="rebellion-card__title">' + escapeHtml(dialog.title) + '</h4>' +
            '<p class="rebellion-card__preview">' + escapeHtml(dialog.childOpening) + '</p>' +
          '</div>' +
          '<div class="rebellion-card__arrow">→</div>' +
        '</div>';
    }
    els.rebellionCards.innerHTML = html;

    var cards = els.rebellionCards.querySelectorAll('.rebellion-card');
    for (var j = 0; j < cards.length; j++) {
      (function (index) {
        cards[index].addEventListener('click', function () {
          selectRebellion(index);
        });
      })(j);
    }
  }

  function selectRebellion(index) {
    state.mode = 'deep-dialog';
    state.deepDialog = state.deepDialogs[index];
    state.deepTotalRounds = state.deepDialog.rounds.length;
    state.deepCurrentRound = 0;

    els.deepDialogSection.style.display = 'none';
    els.deepDialogContainer.style.display = 'block';

    els.deepDialogTitle.textContent = state.deepDialog.title;
    els.deepDialogSubtitle.textContent = '共 ' + state.deepTotalRounds + ' 轮深度对话，帮你从容应对';

    els.deepDialogBubbles.innerHTML = '';
    els.deepNextRoundSection.style.display = 'block';
    els.deepCompleteSection.style.display = 'none';
    updateDeepProgress();

    setTimeout(function () {
      expandDeepNextRound();
    }, 500);
  }

  function expandDeepNextRound() {
    if (state.isLoading) return;
    if (state.deepCurrentRound >= state.deepTotalRounds) {
      showDeepComplete();
      return;
    }

    state.deepCurrentRound++;
    var round = state.deepDialog.rounds[state.deepCurrentRound - 1];

    state.isLoading = true;
    els.deepNextRoundBtn.classList.add('loading');

    setTimeout(function () {
      renderDeepRound(round, state.deepCurrentRound);
      updateDeepProgress();
      scrollToDeepBottom();

      state.isLoading = false;
      els.deepNextRoundBtn.classList.remove('loading');

      if (state.deepCurrentRound >= state.deepTotalRounds) {
        showDeepComplete();
      }
    }, 1000);
  }

  function renderDeepRound(round, roundNum) {
    var roundEl = document.createElement('div');
    roundEl.className = 'deep-dialog-round';

    var roundBadge = '<div class="deep-round-badge">第 ' + roundNum + ' 轮</div>';

    var childBubbleHtml = '';
    if (round.childNext && roundNum > 1) {
      childBubbleHtml =
        '<div class="bubble-group bubble-group--child">' +
          '<div class="bubble-label">🧒 孩子说</div>' +
          '<div class="dialog-bubble dialog-bubble--child">' +
            escapeHtml(round.childNext) +
          '</div>' +
        '</div>';
    } else if (roundNum === 1 && state.deepDialog.childOpening) {
      childBubbleHtml =
        '<div class="bubble-group bubble-group--child">' +
          '<div class="bubble-label">🧒 孩子说</div>' +
          '<div class="dialog-bubble dialog-bubble--child">' +
            escapeHtml(state.deepDialog.childOpening) +
          '</div>' +
        '</div>';
    }

    var parentBubbleHtml =
      '<div class="bubble-group bubble-group--parent">' +
        '<div class="bubble-label">👨‍👩‍👧 你可以这样回应</div>' +
        '<div class="dialog-bubble dialog-bubble--parent">' +
          escapeHtml(round.parentLine) +
        '</div>' +
      '</div>';

    roundEl.innerHTML = roundBadge + childBubbleHtml + parentBubbleHtml;
    els.deepDialogBubbles.appendChild(roundEl);
  }

  function updateDeepProgress() {
    var percent = (state.deepCurrentRound / state.deepTotalRounds) * 100;
    els.deepProgressFill.style.width = percent + '%';
    els.deepProgressText.textContent = '第 ' + Math.max(state.deepCurrentRound, 1) + ' 轮 / 共 ' + state.deepTotalRounds + ' 轮';
  }

  function showDeepComplete() {
    els.deepNextRoundSection.style.display = 'none';
    els.deepCompleteSection.style.display = 'block';
  }

  function backToRebellion() {
    state.mode = 'deep-select';
    state.deepDialog = null;
    state.deepCurrentRound = 0;
    els.deepDialogContainer.style.display = 'none';
    els.deepDialogSection.style.display = 'block';
  }

  function backToBasic() {
    state.mode = 'basic';
    state.deepDialog = null;
    state.deepCurrentRound = 0;
    els.deepDialogSection.style.display = 'none';
    els.deepDialogContainer.style.display = 'none';
    els.completeSection.style.display = 'block';
    if (state.scene && state.scene.hasDeepDialog && els.deepDialogEntry) {
      els.deepDialogEntry.style.display = 'block';
    }
  }

  function restartDeepDialog() {
    state.deepCurrentRound = 0;
    state.isLoading = false;
    els.deepDialogBubbles.innerHTML = '';
    els.deepNextRoundSection.style.display = 'block';
    els.deepCompleteSection.style.display = 'none';
    els.deepNextRoundBtn.classList.remove('loading');
    updateDeepProgress();

    setTimeout(function () {
      expandDeepNextRound();
    }, 300);
  }

  function scrollToDeepBottom() {
    setTimeout(function () {
      els.deepNextRoundSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }

  // ==================== 重新开始 ====================
  function restart() {
    state.currentRound = 0;
    state.isLoading = false;
    els.dialogContainer.innerHTML = '';
    els.nextRoundSection.style.display = 'block';
    els.completeSection.style.display = 'none';
    els.nextRoundBtn.classList.remove('loading');
    els.restartBtn.style.display = 'none';

    // 清理孩子回应选择区域
    if (els.childResponseSection) {
      els.childResponseSection.style.display = 'none';
    }
    if (els.childResponseOptions) {
      els.childResponseOptions.innerHTML = '';
    }
    if (els.customChildInput) {
      els.customChildInput.value = '';
    }

    updateProgress();

    setTimeout(function () {
      expandNextRound();
    }, 300);
  }

  // ==================== 滚动到底部 ====================
  function scrollToBottom() {
    setTimeout(function () {
      els.nextRoundSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }

  // ==================== 工具函数 ====================
  function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  // ==================== 事件绑定 ====================
  function bindEvents() {
    els.backBtn.addEventListener('click', function () {
      if (window.App && window.App.goBack) {
        window.App.goBack();
      } else if (document.referrer) {
        history.back();
      } else {
        location.href = 'scenes.html';
      }
    });

    els.nextRoundBtn.addEventListener('click', expandNextRound);

    els.restartBtn.addEventListener('click', restart);

    // 自定义孩子回应输入
    if (els.customChildBtn) {
      els.customChildBtn.addEventListener('click', handleCustomInput);
    }
    if (els.customChildInput) {
      els.customChildInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.keyCode === 13) {
          e.preventDefault();
          handleCustomInput();
        }
      });
    }

    if (els.completeRestartBtn) {
      els.completeRestartBtn.addEventListener('click', restart);
    }

    if (els.enterDeepDialogBtn) {
      els.enterDeepDialogBtn.addEventListener('click', enterDeepDialog);
    }

    if (els.backToBasicBtn) {
      els.backToBasicBtn.addEventListener('click', backToBasic);
    }

    if (els.backToRebellionBtn) {
      els.backToRebellionBtn.addEventListener('click', backToRebellion);
    }

    if (els.deepNextRoundBtn) {
      els.deepNextRoundBtn.addEventListener('click', expandDeepNextRound);
    }

    if (els.deepRestartBtn) {
      els.deepRestartBtn.addEventListener('click', restartDeepDialog);
    }

    if (els.deepTryOtherBtn) {
      els.deepTryOtherBtn.addEventListener('click', backToRebellion);
    }

    window.addEventListener('scroll', function () {
      var header = document.querySelector('.detail-header');
      if (window.scrollY > 10) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });
  }

  // ==================== 启动 ====================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(window);
