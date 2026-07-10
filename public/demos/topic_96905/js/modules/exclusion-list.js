/**
 * 排除列表模块
 * 管理"不喜欢"排除列表，使用 localStorage 持久化。
 * 纯前端模块，无外部依赖。
 */
const ExclusionList = (function () {

  var STORAGE_KEY = 'random_travel_exclusion_list';

  /** 获取排除列表（城市 ID 数组） */
  function getExcludedCityIds() {
    try {
      var data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('读取排除列表失败', e);
      return [];
    }
  }

  /** 保存排除列表 */
  function saveExclusion(ids) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch (e) {
      console.error('保存排除列表失败', e);
    }
  }

  /** 添加城市到排除列表 */
  function addToExclusion(cityId) {
    var ids = getExcludedCityIds();
    if (ids.indexOf(cityId) === -1) {
      ids.push(cityId);
      saveExclusion(ids);
    }
  }

  /** 从排除列表移除城市 */
  function removeFromExclusion(cityId) {
    var ids = getExcludedCityIds();
    var idx = ids.indexOf(cityId);
    if (idx !== -1) {
      ids.splice(idx, 1);
      saveExclusion(ids);
    }
  }

  /** 清空排除列表 */
  function clearExclusion() {
    saveExclusion([]);
  }

  /** 获取排除列表中的城市名称（用于展示） */
  function getExcludedCityNames(data) {
    var ids = getExcludedCityIds();
    return ids.map(function (id) {
      var city = data.cities.find(function (c) { return c.id === id; });
      return city ? city.name : ('\u57ce\u5e02#' + id);
    });
  }

  return {
    getExcludedCityIds: getExcludedCityIds,
    addToExclusion: addToExclusion,
    removeFromExclusion: removeFromExclusion,
    clearExclusion: clearExclusion,
    getExcludedCityNames: getExcludedCityNames
  };
})();
