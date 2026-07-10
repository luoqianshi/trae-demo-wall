/**
 * 数据加载器
 * 从内联的 data.bundle.js 全局变量读取数据，无需网络请求。
 * 支持 file:// 协议直接打开 HTML 文件。
 */
const DataLoader = (function () {

  let allData = null;

  /**
   * 加载所有数据（从全局变量 TRAVEL_DATA 读取）
   * @returns {Promise<object>} 全部数据
   */
  async function loadAllData() {
    if (typeof TRAVEL_DATA === 'undefined') {
      throw new Error('数据包未加载，请检查 data.bundle.js 是否正确引入');
    }

    const cities = TRAVEL_DATA.cities;
    const costIndex = TRAVEL_DATA.costIndex;
    const tags = TRAVEL_DATA.tags;
    const hsrRates = TRAVEL_DATA.hsrRates;
    const flightFactors = TRAVEL_DATA.flightFactors;
    const hsrModelParams = TRAVEL_DATA.hsrModelParams;
    const flightModelParams = TRAVEL_DATA.flightModelParams;
    const oilPrices = TRAVEL_DATA.oilPrices;
    const cityGuides = TRAVEL_DATA.cityGuides || [];

    allData = {
      cities, costIndex, tags, hsrRates,
      flightFactors, hsrModelParams, flightModelParams, oilPrices, cityGuides
    };

    // 预建索引（用 Map 加速查询）
    allData._cityMap = new Map(cities.map(c => [c.id, c]));
    allData._costMap = new Map(costIndex.map(c => [c.cityId, c]));
    allData._tagMap = new Map(tags.map(t => [t.cityId, t]));
    allData._oilMap = new Map(oilPrices.map(o => [o.province, o]));
    allData._monthMap = new Map(flightFactors.map(f => [f.month, f]));
    allData._guideMap = new Map(cityGuides.map(g => [g.cityId, g]));

    return allData;
  }

  /** 获取全部数据对象 */
  function getData() {
    return allData;
  }

  /** 获取所有城市列表 */
  function getCities() {
    return allData ? allData.cities : [];
  }

  /** 按 ID 获取城市 */
  function getCityById(id) {
    return allData ? (allData._cityMap.get(id) || null) : null;
  }

  /** 获取城市消费系数 */
  function getCityCostIndex(cityId) {
    return allData ? (allData._costMap.get(cityId) || null) : null;
  }

  /** 获取城市特色标签 */
  function getCityTags(cityId) {
    return allData ? (allData._tagMap.get(cityId) || null) : null;
  }

  /** 获取高铁模型参数 */
  function getHsrModelParams() {
    return allData ? allData.hsrModelParams : null;
  }

  /** 获取机票模型参数 */
  function getFlightModelParams() {
    return allData ? allData.flightModelParams : null;
  }

  /** 获取指定月份的机票系数 */
  function getFlightMonthFactor(month) {
    return allData ? (allData._monthMap.get(month) || null) : null;
  }

  /** 获取指定省份的油价 */
  function getOilPrice(province) {
    return allData ? (allData._oilMap.get(province) || null) : null;
  }

  /** 获取城市的马蜂窝游记 */
  function getCityGuides(cityId) {
    return allData ? (allData._guideMap.get(cityId) || null) : null;
  }

  return {
    loadAllData,
    getData,
    getCities,
    getCityById,
    getCityCostIndex,
    getCityTags,
    getHsrModelParams,
    getFlightModelParams,
    getFlightMonthFactor,
    getOilPrice,
    getCityGuides
  };
})();
