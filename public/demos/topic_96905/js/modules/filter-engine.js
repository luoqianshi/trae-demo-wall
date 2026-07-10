/**
 * 筛选引擎模块
 * 根据用户条件（出发地、预算、天数、月份、特色偏好、区域偏好、交通偏好、排除列表）
 * 筛选候选目的地，返回含费用估算和特色匹配度的候选列表。
 * 依赖：CostEstimator（筛选时需估算费用）
 */
const FilterEngine = (function () {

  var MIN_TAG_THRESHOLD = 0.3;

  /**
   * 计算城市特色标签与用户偏好的匹配度
   * @param {number} cityId
   * @param {object} tagsPref - { food: 0.8, scenery: 0.6, ... }
   * @param {object} data
   * @returns {number} 匹配度 0-1
   */
  function calculateTagMatch(cityId, tagsPref, data) {
    var cityTag = data.tags.find(function (t) { return t.cityId === cityId; });
    if (!cityTag) return 0;

    // 无偏好时返回默认中等匹配
    if (!tagsPref || Object.keys(tagsPref).length === 0) {
      return 0.5;
    }

    var weightedSum = 0;
    var totalWeight = 0;

    for (var tag in tagsPref) {
      if (tagsPref.hasOwnProperty(tag)) {
        var cityScore = cityTag.tags[tag] || 0;
        weightedSum += tagsPref[tag] * cityScore;
        totalWeight += tagsPref[tag];
      }
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 0.5;
  }

  /**
   * 根据用户条件筛选候选目的地
   * @param {object} params - 筛选参数
   * @param {object} data - 已加载的全部数据
   * @returns {array} 候选目的地列表
   */
  function filterDestinations(params, data) {
    var originCityId = params.originCityId;
    var budgetMax = params.budgetMax;
    var days = params.days;
    var month = params.month;
    var tagsPref = params.tagsPref;
    var regionPref = params.regionPref;
    var transportPref = params.transportPref;
    var excludedCityIds = params.excludedCityIds || [];

    var candidates = [];

    // 查找出发城市
    var originCity = data.cities.find(function (c) { return c.id === originCityId; });
    if (!originCity) return [];

    // Step 1: 取所有活跃城市
    var cities = data.cities.filter(function (c) { return c.active; });

    // Step 2: 区域过滤
    if (regionPref && regionPref.length > 0) {
      cities = cities.filter(function (c) {
        return regionPref.indexOf(c.region) !== -1;
      });
    }

    // 排除列表
    var excludedSet = {};
    excludedCityIds.forEach(function (id) { excludedSet[id] = true; });

    for (var i = 0; i < cities.length; i++) {
      var city = cities[i];

      // Step 3: 排除出发地和排除列表中的城市
      if (city.id === originCityId) continue;
      if (excludedSet[city.id]) continue;

      // Step 4: 交通费估算（运行时计算距离）
      var transportCost = CostEstimator.estimateRoundTripTransport(
        originCity, city, month, transportPref, data
      );
      if (!transportCost) continue;

      // Step 5: 当地消费估算
      var dailyCost = CostEstimator.estimateDailyCost(city.id, data);
      if (!dailyCost) continue;

      // Step 6: 总花费计算（与 estimateTotalCost 保持一致：住宿算 days-1 晚）
      var nonLodgingDaily = dailyCost.food + dailyCost.transport + dailyCost.attraction;
      var lodgingTotal = dailyCost.lodging * (days - 1);
      var totalMid = transportCost.mid + nonLodgingDaily * days + lodgingTotal;

      // Step 7: 预算过滤（用中价判断）
      if (totalMid > budgetMax) continue;

      // Step 8: 特色匹配
      var tagScore = calculateTagMatch(city.id, tagsPref, data);
      if (tagScore < MIN_TAG_THRESHOLD) continue;

      // Step 9: 加入候选列表
      candidates.push({
        city: city,
        transportCost: transportCost,
        dailyCost: dailyCost,
        totalCost: {
          low: transportCost.low + nonLodgingDaily * days + lodgingTotal,
          mid: totalMid,
          high: transportCost.high + nonLodgingDaily * days + lodgingTotal
        },
        tagScore: tagScore
      });
    }

    return candidates;
  }

  return {
    filterDestinations: filterDestinations,
    calculateTagMatch: calculateTagMatch
  };
})();
