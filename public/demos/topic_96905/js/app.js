/**
 * 应用入口
 * 页面流程：欢迎页 → 许愿页 → 欢迎页 → 摇奖页 → 结果页
 */
(function () {

  var savedParams = null;
  var lastSelectedCandidate = null;

  /**
   * 应用初始化
   */
  async function init() {
    try {
      await DataLoader.loadAllData();

      FilterPanel.initOriginSelect(DataLoader.getCities());
      FilterPanel.updateExclusionDisplay();
      FilterPanel.bindEvents({
        onWishDone: handleWishDone,
        onSpin: handleSpin
      });

      bindResultButtons();

      // 初始化默认参数
      savedParams = FilterPanel.getFilterParams();
      FilterPanel.updateSummaries();
      updateWelcomeSummary();

      showAppView();
      showPage('welcome');
    } catch (e) {
      console.error('初始化失败:', e);
      showErrorView();
    }
  }

  /**
   * 许愿完成：回到欢迎页，更新摘要
   */
  function handleWishDone() {
    savedParams = FilterPanel.getFilterParams();
    FilterPanel.updateSummaries();
    updateWelcomeSummary();
    showPage('welcome');
  }

  /**
   * 拉动摇臂：开始摇奖
   */
  function handleSpin() {
    if (!savedParams) {
      savedParams = FilterPanel.getFilterParams();
    }
    startSpin(savedParams);
  }

  /**
   * 启动摇奖流程
   */
  function startSpin(params) {
    var data = DataLoader.getData();
    var candidates = FilterEngine.filterDestinations(params, data);

    if (candidates.length === 0) {
      showPage('empty');
      return;
    }

    var selected = RandomSelector.weightedRandomSelect(candidates, 'tagScore');
    var selectedIndex = candidates.indexOf(selected);
    lastSelectedCandidate = selected;

    showPage('slot');
    SlotMachineAnimation.setHint('转动中...');

    SlotMachineAnimation.spinSlot(candidates, selectedIndex, function () {
      var originCity = data.cities.find(function (c) { return c.id === params.originCityId; });
      var costDetail = CostEstimator.estimateTotalCost(
        originCity, selected.city, params.month,
        params.days, params.transportPref, data
      );

      ResultDisplay.renderResult(selected, costDetail, data);
      showPage('result');

      // 加载攻略（本地数据，同步）
      var guides = GuideSearch.loadCityGuides(selected.city.name, selected.city.id);
      GuideSearch.renderGuideSection(guides);
    });
  }

  /**
   * 再摇一次
   */
  function handleRespin() {
    savedParams = FilterPanel.getFilterParams();
    startSpin(savedParams);
  }

  /**
   * 不喜欢：排除当前城市，重新摇
   */
  function handleDislike() {
    if (!lastSelectedCandidate || !savedParams) return;

    ExclusionList.addToExclusion(lastSelectedCandidate.city.id);
    FilterPanel.updateExclusionDisplay();
    FilterPanel.updateSummaries();

    savedParams.excludedCityIds = ExclusionList.getExcludedCityIds();
    var data = DataLoader.getData();
    var candidates = FilterEngine.filterDestinations(savedParams, data);

    if (candidates.length === 0) {
      showPage('exclusion-full');
      return;
    }

    var selected = RandomSelector.weightedRandomSelect(candidates, 'tagScore');
    var selectedIndex = candidates.indexOf(selected);
    lastSelectedCandidate = selected;

    showPage('slot');
    SlotMachineAnimation.setHint('正在为你重新选择...');

    SlotMachineAnimation.spinSlot(candidates, selectedIndex, function () {
      var originCity = data.cities.find(function (c) { return c.id === savedParams.originCityId; });
      var costDetail = CostEstimator.estimateTotalCost(
        originCity, selected.city, savedParams.month,
        savedParams.days, savedParams.transportPref, data
      );

      ResultDisplay.renderResult(selected, costDetail, data);
      showPage('result');

      var guides = GuideSearch.loadCityGuides(selected.city.name, selected.city.id);
      GuideSearch.renderGuideSection(guides);
    });
  }

  /**
   * 换个条件：去许愿页
   */
  function handleReset() {
    showPage('wish');
  }

  /**
   * 更新欢迎页的许愿条件摘要
   * 出发地、预算、天数、月份始终显示；
   * 交通方式、特色偏好、区域偏好仅在非默认值时显示；
   * 排除列表永远不显示。
   */
  function updateWelcomeSummary() {
    var summaryEl = document.getElementById('wish-summary');
    if (!summaryEl) return;

    var data = DataLoader.getData();
    var origin = data.cities.find(function (c) { return c.id === savedParams.originCityId; });

    // 始终显示：出发地、预算、天数、月份
    setText('ws-origin', origin ? origin.name : '未知');
    setText('ws-budget', '¥' + savedParams.budgetMax.toLocaleString());
    setText('ws-days', savedParams.days + '天');
    setText('ws-month', savedParams.month + '月');

    // 交通方式：默认全部勾选，非默认时才显示
    var defaultTransport = ['highspeed', 'flight', 'car'];
    var transportNames = { highspeed: '高铁', flight: '飞机', car: '自驾' };
    var isDefaultTransport = savedParams.transportPref.length === defaultTransport.length &&
      savedParams.transportPref.every(function (m) { return defaultTransport.indexOf(m) !== -1; });
    if (!isDefaultTransport) {
      var transportText = savedParams.transportPref.length > 0
        ? savedParams.transportPref.map(function (m) { return transportNames[m] || m; }).join('/')
        : '不限';
      setText('ws-transport', transportText);
      showEl('ws-transport-wrap');
    } else {
      hideEl('ws-transport-wrap');
    }

    // 特色偏好：默认无勾选，有勾选时才显示
    if (Object.keys(savedParams.tagsPref).length > 0) {
      var tagNames = { scenery: '风景', culture: '人文', food: '饮食', shopping: '购物', nightlife: '夜生活', family: '亲子' };
      var tagText = Object.keys(savedParams.tagsPref).map(function (t) { return tagNames[t] || t; }).join('、');
      setText('ws-tags', tagText);
      showEl('ws-tags-wrap');
    } else {
      hideEl('ws-tags-wrap');
    }

    // 区域偏好：默认无勾选，有勾选时才显示
    if (savedParams.regionPref.length > 0) {
      var regionNames = { north: '华北', south: '华南', east: '华东', central: '华中', southwest: '西南', northwest: '西北', northeast: '东北' };
      var regionText = savedParams.regionPref.map(function (r) { return regionNames[r] || r; }).join('、');
      setText('ws-region', regionText);
      showEl('ws-region-wrap');
    } else {
      hideEl('ws-region-wrap');
    }

    // 排除列表：永远不显示
    hideEl('ws-exclusion-wrap');

    summaryEl.classList.remove('hidden');
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function showEl(id) {
    var el = document.getElementById(id);
    if (el) el.style.display = '';
  }

  function hideEl(id) {
    var el = document.getElementById(id);
    if (el) el.style.display = 'none';
  }

  /**
   * 绑定结果区域按钮
   */
  function bindResultButtons() {
    document.getElementById('respin-btn').addEventListener('click', handleRespin);
    document.getElementById('dislike-btn').addEventListener('click', handleDislike);
    document.getElementById('reset-btn').addEventListener('click', handleReset);

    document.getElementById('empty-reset-btn').addEventListener('click', function () {
      showPage('wish');
    });

    document.getElementById('exclusion-full-clear-btn').addEventListener('click', function () {
      ExclusionList.clearExclusion();
      FilterPanel.updateExclusionDisplay();
      FilterPanel.updateSummaries();
      savedParams.excludedCityIds = [];
      showPage('welcome');
    });
  }

  /**
   * 页面切换
   */
  function showPage(pageName) {
    var pages = ['welcome', 'wish', 'slot', 'result', 'empty', 'exclusion-full'];
    pages.forEach(function (p) {
      var el = document.getElementById(p + '-section');
      if (el) el.classList.add('hidden');
    });

    var target = document.getElementById(pageName + '-section');
    if (target) target.classList.remove('hidden');
  }

  function showAppView() {
    document.getElementById('loading-view').classList.remove('view--active');
    document.getElementById('error-view').classList.remove('view--active');
    document.getElementById('app-view').classList.add('view--active');
  }

  function showErrorView() {
    document.getElementById('loading-view').classList.remove('view--active');
    document.getElementById('app-view').classList.remove('view--active');
    document.getElementById('error-view').classList.add('view--active');
  }

  // 重试按钮
  var retryBtn = document.getElementById('retry-btn');
  if (retryBtn) {
    retryBtn.addEventListener('click', function () {
      document.getElementById('error-view').classList.remove('view--active');
      document.getElementById('loading-view').classList.add('view--active');
      init();
    });
  }

  // 启动
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
