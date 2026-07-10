/**
 * 筛选面板 UI 模块（许愿页）
 * 管理折叠式条件设置，收集筛选参数，绑定交互事件。
 */
const FilterPanel = (function () {

  /**
   * 初始化出发地下拉框
   */
  function initOriginSelect(cities) {
    var select = document.getElementById('origin-select');
    if (!select) return;

    var grouped = {};
    cities.filter(function (c) { return c.active; }).forEach(function (c) {
      if (!grouped[c.province]) grouped[c.province] = [];
      grouped[c.province].push(c);
    });

    var html = '';
    for (var province in grouped) {
      if (grouped.hasOwnProperty(province)) {
        html += '<optgroup label="' + province + '">';
        grouped[province].forEach(function (c) {
          html += '<option value="' + c.id + '">' + c.name + '</option>';
        });
        html += '</optgroup>';
      }
    }
    select.innerHTML = html;
    select.value = '1';
  }

  /**
   * 获取筛选参数
   */
  function getFilterParams() {
    var originId = parseInt(document.getElementById('origin-select').value, 10);
    var budgetMax = parseInt(document.getElementById('budget-range').value, 10);
    var days = parseInt(document.getElementById('days-input').value, 10);
    var month = parseInt(document.getElementById('month-select').value, 10);

    var tagsPref = {};
    document.querySelectorAll('.tag-checkbox').forEach(function (cb) {
      if (cb.checked) {
        var tag = cb.getAttribute('data-tag');
        var weightInput = document.querySelector('.tag-weight[data-tag="' + tag + '"]');
        tagsPref[tag] = weightInput ? parseFloat(weightInput.value) : 0.5;
      }
    });

    var regionPref = [];
    document.querySelectorAll('.region-checkbox:checked').forEach(function (cb) {
      regionPref.push(cb.value);
    });

    var transportPref = [];
    document.querySelectorAll('.transport-checkbox:checked').forEach(function (cb) {
      transportPref.push(cb.value);
    });

    var excludedCityIds = ExclusionList.getExcludedCityIds();

    return {
      originCityId: originId,
      budgetMax: budgetMax,
      days: days,
      month: month,
      tagsPref: tagsPref,
      regionPref: regionPref,
      transportPref: transportPref,
      excludedCityIds: excludedCityIds
    };
  }

  /**
   * 更新各折叠组的摘要文字
   */
  function updateSummaries() {
    // 出发地
    var originSelect = document.getElementById('origin-select');
    var originSummary = document.getElementById('summary-origin');
    if (originSelect && originSummary) {
      originSummary.textContent = originSelect.options[originSelect.selectedIndex].text;
    }

    // 预算与天数
    var budget = parseInt(document.getElementById('budget-range').value, 10);
    var days = parseInt(document.getElementById('days-input').value, 10);
    var month = parseInt(document.getElementById('month-select').value, 10);
    var budgetSummary = document.getElementById('summary-budget');
    if (budgetSummary) {
      budgetSummary.textContent = '¥' + budget.toLocaleString() + ' · ' + days + '天 · ' + month + '月';
    }

    // 特色偏好
    var tagNames = { scenery: '风景', culture: '人文', food: '饮食', shopping: '购物', nightlife: '夜生活', family: '亲子' };
    var checkedTags = [];
    document.querySelectorAll('.tag-checkbox:checked').forEach(function (cb) {
      checkedTags.push(tagNames[cb.getAttribute('data-tag')] || cb.getAttribute('data-tag'));
    });
    var tagsSummary = document.getElementById('summary-tags');
    if (tagsSummary) {
      tagsSummary.textContent = checkedTags.length > 0 ? checkedTags.join('、') : '不限';
    }

    // 区域偏好
    var regionNames = { north: '华北', south: '华南', east: '华东', central: '华中', southwest: '西南', northwest: '西北', northeast: '东北' };
    var checkedRegions = [];
    document.querySelectorAll('.region-checkbox:checked').forEach(function (cb) {
      checkedRegions.push(regionNames[cb.value] || cb.value);
    });
    var regionSummary = document.getElementById('summary-region');
    if (regionSummary) {
      regionSummary.textContent = checkedRegions.length > 0 ? checkedRegions.join('、') : '不限';
    }

    // 交通方式
    var transportNames = { highspeed: '高铁', flight: '飞机', car: '自驾' };
    var checkedTransports = [];
    document.querySelectorAll('.transport-checkbox:checked').forEach(function (cb) {
      checkedTransports.push(transportNames[cb.value] || cb.value);
    });
    var transportSummary = document.getElementById('summary-transport');
    if (transportSummary) {
      transportSummary.textContent = checkedTransports.length > 0 ? checkedTransports.join('、') : '不限';
    }

    // 排除列表
    var exclCount = ExclusionList.getExcludedCityIds().length;
    var exclSummary = document.getElementById('summary-exclusion');
    if (exclSummary) {
      exclSummary.textContent = exclCount + '个城市';
    }
  }

  /**
   * 绑定事件
   * @param {object} handlers - { onWishDone, onSpin }
   */
  function bindEvents(handlers) {

    // 许愿入口按钮
    var wishEntryBtn = document.getElementById('wish-entry-btn');
    if (wishEntryBtn) {
      wishEntryBtn.addEventListener('click', function () {
        showPage('wish');
      });
    }

    // 许愿完成按钮
    var wishDoneBtn = document.getElementById('wish-done-btn');
    if (wishDoneBtn) {
      wishDoneBtn.addEventListener('click', function () {
        if (handlers.onWishDone) handlers.onWishDone();
      });
    }

    // 许愿页返回按钮
    var wishBackBtn = document.getElementById('wish-back-btn');
    if (wishBackBtn) {
      wishBackBtn.addEventListener('click', function () {
        showPage('welcome');
      });
    }

    // 摇臂按钮（欢迎页）
    var leverBtn = document.getElementById('lever-btn');
    if (leverBtn) {
      leverBtn.addEventListener('click', function () {
        if (handlers.onSpin) handlers.onSpin();
      });
    }

    // 摇奖按钮（与摇臂功能相同）
    var spinBtn = document.getElementById('spin-btn');
    if (spinBtn) {
      spinBtn.addEventListener('click', function () {
        if (handlers.onSpin) handlers.onSpin();
      });
    }

    // 折叠组展开/收起
    document.querySelectorAll('.wish-group__header').forEach(function (header) {
      header.addEventListener('click', function () {
        var group = this.closest('.wish-group');
        if (group) {
          group.classList.toggle('wish-group--open');
        }
      });
    });

    // 预算滑块
    var budgetRange = document.getElementById('budget-range');
    var budgetDisplay = document.getElementById('budget-display');
    if (budgetRange && budgetDisplay) {
      budgetRange.addEventListener('input', function () {
        budgetDisplay.textContent = parseInt(this.value, 10).toLocaleString();
        updateSummaries();
      });
    }

    // 天数/月份变化时更新摘要
    var daysInput = document.getElementById('days-input');
    if (daysInput) daysInput.addEventListener('change', updateSummaries);
    var monthSelect = document.getElementById('month-select');
    if (monthSelect) monthSelect.addEventListener('change', updateSummaries);
    var originSelect = document.getElementById('origin-select');
    if (originSelect) originSelect.addEventListener('change', updateSummaries);

    // 特色偏好复选框联动
    document.querySelectorAll('.tag-checkbox').forEach(function (cb) {
      cb.addEventListener('change', function () {
        var tag = this.getAttribute('data-tag');
        var weight = document.querySelector('.tag-weight[data-tag="' + tag + '"]');
        if (weight) weight.disabled = !this.checked;
        var item = this.closest('.tag-pref-item');
        if (item) item.classList.toggle('tag-pref-item--active', this.checked);
        updateSummaries();
      });
    });

    // 权重滑块变化
    document.querySelectorAll('.tag-weight').forEach(function (w) {
      w.addEventListener('input', updateSummaries);
    });

    // 区域/交通复选框
    document.querySelectorAll('.region-checkbox').forEach(function (cb) {
      cb.addEventListener('change', updateSummaries);
    });
    document.querySelectorAll('.transport-checkbox').forEach(function (cb) {
      cb.addEventListener('change', updateSummaries);
    });

    // 清空排除列表
    var clearBtn = document.getElementById('exclusion-clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        ExclusionList.clearExclusion();
        updateExclusionDisplay();
        updateSummaries();
      });
    }
  }

  /**
   * 更新排除列表显示
   */
  function updateExclusionDisplay() {
    var ids = ExclusionList.getExcludedCityIds();
    var itemsEl = document.getElementById('exclusion-items');
    if (!itemsEl) return;

    if (ids.length === 0) {
      itemsEl.innerHTML = '<li class="exclusion-empty-item">暂无排除城市</li>';
      return;
    }

    var data = DataLoader.getData();
    var html = '';
    ids.forEach(function (id) {
      var city = data ? data.cities.find(function (c) { return c.id === id; }) : null;
      var name = city ? city.name : ('城市#' + id);
      html += '<li class="exclusion-item">';
      html += '<span class="exclusion-item-name">' + name + '</span>';
      html += '<button class="btn btn--text btn--danger exclusion-remove" data-id="' + id + '">移除</button>';
      html += '</li>';
    });
    itemsEl.innerHTML = html;

    itemsEl.querySelectorAll('.exclusion-remove').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = parseInt(this.getAttribute('data-id'), 10);
        ExclusionList.removeFromExclusion(id);
        updateExclusionDisplay();
        updateSummaries();
      });
    });
  }

  /**
   * 页面切换（内部辅助）
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

  return {
    initOriginSelect: initOriginSelect,
    getFilterParams: getFilterParams,
    bindEvents: bindEvents,
    updateExclusionDisplay: updateExclusionDisplay,
    updateSummaries: updateSummaries
  };
})();
