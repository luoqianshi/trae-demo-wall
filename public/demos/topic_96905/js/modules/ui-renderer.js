/**
 * 结果展示模块
 * 渲染城市预览卡、城市信息、费用明细表（按交通方式分列），管理视图区域切换。
 */
const ResultDisplay = (function () {

  var REGION_NAMES = {
    north: '华北', south: '华南', east: '华东', central: '华中',
    southwest: '西南', northwest: '西北', northeast: '东北'
  };

  var REGION_GRADIENTS = {
    north: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    south: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    east: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    central: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    southwest: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    northwest: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    northeast: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
  };

  var TRANSPORT_NAMES = {
    highspeed: '高铁', flight: '飞机', car: '自驾'
  };

  var TRANSPORT_ICONS = {
    highspeed: '🚄', flight: '✈️', car: '🚗'
  };

  function formatYuan(n) {
    return '¥' + Math.round(n).toLocaleString();
  }

  /**
   * 渲染城市预览卡（整合头部信息）
   */
  function renderCityPreview(city, tags) {
    var container = document.getElementById('city-preview');
    if (!container) return;

    var gradient = REGION_GRADIENTS[city.region] || REGION_GRADIENTS.north;
    var keywordsHtml = '';
    var description = '';
    if (tags) {
      description = tags.description || '';
      if (tags.keywords) {
        keywordsHtml = tags.keywords.slice(0, 5).map(function (kw) {
          return '<span class="preview-keyword">' + kw + '</span>';
        }).join('');
      }
    }

    var regionName = REGION_NAMES[city.region] || city.region;

    container.innerHTML =
      '<div class="city-preview__bg" style="background: ' + gradient + '">' +
        '<div class="city-preview__overlay"></div>' +
        '<div class="city-preview__content">' +
          '<div class="city-preview__region">' + city.province + ' · ' + regionName + '</div>' +
          '<h2 class="city-preview__name">' + city.name + '</h2>' +
          (description ? '<p class="city-preview__desc">' + description + '</p>' : '') +
          '<div class="city-preview__keywords">' + keywordsHtml + '</div>' +
        '</div>' +
      '</div>';
  }

  /**
   * 渲染结果
   */
  function renderResult(candidate, costDetail, data) {
    var city = candidate.city;
    var tags = data ? data.tags.find(function (t) { return t.cityId === city.id; }) : null;

    renderCityPreview(city, tags);
    renderCostTable(costDetail);
  }

  /**
   * 渲染费用明细表（按交通方式分列）
   * 每列对应一种勾选的交通方式，同时显示该方式下的总费用。
   */
  function renderCostTable(costDetail) {
    var thead = document.querySelector('#result-section .cost-table thead');
    var tbody = document.getElementById('cost-table-body');
    var tfoot = document.querySelector('#result-section .cost-table tfoot');

    if (!thead || !tbody || !tfoot) return;

    var transports = costDetail.allTransports || [];
    if (transports.length === 0) return;

    // 表头：费用项 + 各交通方式列
    var headHtml = '<tr><th>费用项</th>';
    transports.forEach(function (t) {
      var name = TRANSPORT_NAMES[t.mode] || t.mode;
      var icon = TRANSPORT_ICONS[t.mode] || '';
      headHtml += '<th class="th-transport">' + icon + ' ' + name + '</th>';
    });
    headHtml += '</tr>';
    thead.innerHTML = headHtml;

    // 表体：住宿、餐饮、市内交通、景点（当地消费各方式相同）
    var rows = [
      { label: '住宿（' + costDetail.lodging.nights + '晚）', value: costDetail.lodging.total },
      { label: '餐饮（' + costDetail.food.days + '天）', value: costDetail.food.total },
      { label: '市内交通（' + costDetail.localTransport.days + '天）', value: costDetail.localTransport.total },
      { label: '景点（' + costDetail.attraction.days + '天）', value: costDetail.attraction.total }
    ];

    var bodyHtml = '';
    rows.forEach(function (row) {
      bodyHtml += '<tr><td>' + row.label + '</td>';
      transports.forEach(function (t) {
        bodyHtml += '<td>' + formatYuan(row.value) + '</td>';
      });
      bodyHtml += '</tr>';
    });

    // 往返交通（各方式不同）
    bodyHtml += '<tr><td>往返交通</td>';
    transports.forEach(function (t) {
      bodyHtml += '<td>' + formatYuan(t.transportCost.mid) + '</td>';
    });
    bodyHtml += '</tr>';

    tbody.innerHTML = bodyHtml;

    // 合计行：各方式总费用
    var footHtml = '<tr class="cost-total"><td>合计</td>';
    transports.forEach(function (t) {
      var isMin = t.total === Math.min.apply(null, transports.map(function (x) { return x.total; }));
      footHtml += '<td' + (isMin ? ' class="cost-best"' : '') + '>' +
        formatYuan(t.total) + (isMin ? '<span class="cost-best-tag">最省</span>' : '') + '</td>';
    });
    footHtml += '</tr>';
    tfoot.innerHTML = footHtml;
  }

  return {
    renderResult: renderResult,
    renderCostTable: renderCostTable,
    renderCityPreview: renderCityPreview
  };
})();
