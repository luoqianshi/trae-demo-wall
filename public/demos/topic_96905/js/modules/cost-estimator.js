/**
 * 预算估算模块
 * 估算交通费（高铁/机票/自驾）和当地消费，计算总花费明细。
 */
const CostEstimator = (function () {

  const FUEL_CONSUMPTION = 8;  // 百公里油耗 8L
  const TOLL_RATE = 0.5;       // 过路费 0.5 元/km

  /**
   * 估算高铁票价
   * @param {number} distanceKm - 直线距离
   * @param {object} modelParams - 模型参数
   * @returns {{p25:number, p50:number, p75:number}}
   */
  function estimateHsrPrice(distanceKm, modelParams) {
    const { slope, intercept, discountThresholdKm, discountRate, floatFactor } = modelParams;

    // 递远递减：超过阈值距离部分按折扣率计算
    let effectiveDist;
    if (distanceKm <= discountThresholdKm) {
      effectiveDist = distanceKm;
    } else {
      effectiveDist = discountThresholdKm + (distanceKm - discountThresholdKm) * discountRate;
    }

    const basePrice = (effectiveDist * slope + intercept) * floatFactor;

    return {
      p25: Math.round(basePrice * 0.9),
      p50: Math.round(basePrice),
      p75: Math.round(basePrice * 1.1)
    };
  }

  /**
   * 估算自驾费用
   * @param {number} straightDistKm - 直线距离
   * @param {number} oilPrice - 92# 油价（元/L）
   * @param {number} roadDistFactor - 驾车距离修正系数
   * @returns {{p25:number, p50:number, p75:number}}
   */
  function estimateCarPrice(straightDistKm, oilPrice, roadDistFactor) {
    const distanceKm = straightDistKm * (roadDistFactor || 1.3);
    const fuelCost = (distanceKm / 100) * FUEL_CONSUMPTION * oilPrice;
    const tollCost = TOLL_RATE * distanceKm;
    const basePrice = fuelCost + tollCost;

    return {
      p25: Math.round(basePrice * 0.95),
      p50: Math.round(basePrice),
      p75: Math.round(basePrice * 1.05)
    };
  }

  /**
   * 估算所有勾选交通方式的往返费用
   * @param {object} originCity - 出发城市
   * @param {object} destCity - 目的城市
   * @param {number} month - 月份
   * @param {string[]} transportPref - 交通方式偏好
   * @param {object} data - 全部数据
   * @returns {array} [{ mode, low, mid, high, durationHours }]
   */
  function estimateAllTransports(originCity, destCity, month, transportPref, data) {
    const modes = transportPref && transportPref.length > 0
      ? transportPref
      : ['highspeed', 'flight', 'car'];
    const prices = [];

    const straightDistKm = haversineDistance(
      originCity.lat, originCity.lng, destCity.lat, destCity.lng
    );

    for (const mode of modes) {
      let price = null;

      if (mode === 'highspeed' && destCity.hasHsr) {
        const hsr = estimateHsrPrice(straightDistKm, data.hsrModelParams);
        price = {
          p25: hsr.p25, p50: hsr.p50, p75: hsr.p75,
          surcharge: 0,
          durationHours: straightDistKm / 250
        };
      } else if (mode === 'flight' && destCity.airportCode) {
        const fp = data.flightModelParams;
        const monthFactorObj = data.flightFactors.find(f => f.month === month);
        const monthFactor = monthFactorObj ? monthFactorObj.factor : 1.0;
        const flightBase = (straightDistKm * fp.slope + fp.intercept) * monthFactor;
        price = {
          p25: Math.round(flightBase * 0.9),
          p50: Math.round(flightBase),
          p75: Math.round(flightBase * 1.1),
          surcharge: fp.surcharge,
          durationHours: straightDistKm / 800 + 1
        };
      } else if (mode === 'car') {
        const oilPriceObj = data.oilPrices.find(o => o.province === originCity.province);
        const oilPrice = oilPriceObj ? oilPriceObj.price92 : 8.0;
        const car = estimateCarPrice(straightDistKm, oilPrice, destCity.roadDistFactor);
        price = {
          p25: car.p25, p50: car.p50, p75: car.p75,
          surcharge: 0,
          durationHours: straightDistKm * (destCity.roadDistFactor || 1.3) / 80
        };
      }

      if (price) {
        prices.push({
          mode: mode,
          low: (price.p25 + price.surcharge) * 2,
          mid: (price.p50 + price.surcharge) * 2,
          high: (price.p75 + price.surcharge) * 2,
          durationHours: price.durationHours
        });
      }
    }

    return prices;
  }

  /**
   * 估算往返交通费，取最便宜的方式
   * @param {object} originCity - 出发城市
   * @param {object} destCity - 目的城市
   * @param {number} month - 月份
   * @param {string[]} transportPref - 交通方式偏好
   * @param {object} data - 全部数据
   * @returns {object|null} { mode, low, mid, high, durationHours }
   */
  function estimateRoundTripTransport(originCity, destCity, month, transportPref, data) {
    const prices = estimateAllTransports(originCity, destCity, month, transportPref, data);
    if (prices.length === 0) return null;
    // 取 P50 最低的方式
    return prices.reduce((min, p) => p.mid < min.mid ? p : min);
  }

  /**
   * 估算目的地日均消费
   * @param {number} cityId - 目的城市 ID
   * @param {object} data - 全部数据
   * @returns {object|null} { lodging, food, transport, attraction, total }
   */
  function estimateDailyCost(cityId, data) {
    const cost = data.costIndex.find(c => c.cityId === cityId);
    if (!cost) return null;

    const daily = {
      lodging: cost.avgHotelPrice,
      food: cost.avgMealPrice * 3,
      transport: cost.avgTransportDaily,
      attraction: cost.avgAttractionPrice * 2
    };
    daily.total = daily.lodging + daily.food + daily.transport + daily.attraction;
    return daily;
  }

  /**
   * 计算多日行程总花费
   * @param {object} originCity - 出发城市
   * @param {object} destCity - 目的城市
   * @param {number} month - 月份
   * @param {number} days - 天数
   * @param {string[]} transportPref - 交通偏好
   * @param {object} data - 全部数据
   * @returns {object|null} 总花费明细
   */
  function estimateTotalCost(originCity, destCity, month, days, transportPref, data) {
    const allTransports = estimateAllTransports(originCity, destCity, month, transportPref, data);
    if (allTransports.length === 0) return null;

    const transport = allTransports.reduce((min, p) => p.mid < min.mid ? p : min);
    const daily = estimateDailyCost(destCity.id, data);

    if (!daily) return null;

    const nonLodgingDaily = daily.food + daily.transport + daily.attraction;
    const lodgingTotal = daily.lodging * (days - 1);
    const localTotal = nonLodgingDaily * days + lodgingTotal;

    // 为每种交通方式计算总费用
    const transportTotals = allTransports.map(function (t) {
      return {
        mode: t.mode,
        transportCost: t,
        durationHours: t.durationHours,
        total: Math.round(t.mid + localTotal)
      };
    });

    return {
      transport: transport,
      allTransports: transportTotals,
      lodging: { perNight: daily.lodging, nights: days - 1, total: lodgingTotal },
      food: { perDay: daily.food, days: days, total: daily.food * days },
      localTransport: { perDay: daily.transport, days: days, total: daily.transport * days },
      attraction: { perDay: daily.attraction, days: days, total: daily.attraction * days },
      localTotal: localTotal,
      totalLow: transport.low + localTotal,
      totalMid: transport.mid + localTotal,
      totalHigh: transport.high + localTotal
    };
  }

  return {
    estimateHsrPrice,
    estimateCarPrice,
    estimateAllTransports,
    estimateRoundTripTransport,
    estimateDailyCost,
    estimateTotalCost
  };
})();
