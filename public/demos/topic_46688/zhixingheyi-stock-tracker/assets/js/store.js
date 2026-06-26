/**
 * 知行合一盈亏记录系统 - 数据持久化层
 * 封装所有 localStorage 操作，提供类 ORM 接口
 */
var Store = (function() {
  'use strict';

  var KEYS = {
    trades: 'zhiXingHeYi_trades',
    settings: 'zhiXingHeYi_settings',
    version: 'zhiXingHeYi_version',
    landingViewed: 'zhiXingHeYi_landingViewed'
  };

  var CURRENT_VERSION = '1.0.0';
  var _trades = null;
  var _settings = null;
  var _cache = {};
  var CACHE_TTL = 30000; // 30秒缓存
  var _listeners = [];

  // === 初始化 ===
  function init() {
    _trades = _loadTrades();
    _settings = _loadSettings();
    // 版本迁移
    var storedVersion = localStorage.getItem(KEYS.version);
    if (storedVersion !== CURRENT_VERSION) {
      _migrate(storedVersion, CURRENT_VERSION);
      localStorage.setItem(KEYS.version, CURRENT_VERSION);
    }
  }

  // === 数据加载 ===
  function _loadTrades() {
    var raw = localStorage.getItem(KEYS.trades);
    if (!raw) return [];
    var data = Utils.safeJSONParse(raw, []);
    if (!Array.isArray(data)) return [];
    // 数据完整性校验
    return data.filter(function(t) {
      return t && t.id && t.date && t.stockCode && typeof t.pnlAmount === 'number';
    });
  }

  function _loadSettings() {
    var raw = localStorage.getItem(KEYS.settings);
    if (!raw) return _defaultSettings();
    var data = Utils.safeJSONParse(raw, null);
    return data && data.riskControl ? data : _defaultSettings();
  }

  function _defaultSettings() {
    return {
      riskControl: {
        dailyLossLimit: 3000,
        weeklyLossLimit: 10000,
        monthlyLossLimit: 30000,
        alertThreshold: 80
      }
    };
  }

  // === 数据保存 ===
  function _saveTrades() {
    try {
      localStorage.setItem(KEYS.trades, JSON.stringify(_trades));
    } catch (e) {
      console.error('存储空间不足:', e);
    }
    _clearCache();
  }

  function _saveSettings() {
    try {
      localStorage.setItem(KEYS.settings, JSON.stringify(_settings));
    } catch (e) {
      console.error('存储空间不足:', e);
    }
  }

  // === 数据迁移 ===
  function _migrate(fromVersion, toVersion) {
    // 预留迁移逻辑
  }

  // === 缓存管理 ===
  function _getCache(key) {
    var item = _cache[key];
    if (item && Date.now() - item.time < CACHE_TTL) {
      return item.data;
    }
    return null;
  }

  function _setCache(key, data) {
    _cache[key] = { data: data, time: Date.now() };
  }

  function _clearCache() {
    _cache = {};
  }

  // === 发布-订阅 ===
  function subscribe(fn) {
    _listeners.push(fn);
    return function() {
      _listeners = _listeners.filter(function(f) { return f !== fn; });
    };
  }

  function _notify(eventType, data) {
    _listeners.forEach(function(fn) {
      try { fn(eventType, data); } catch (e) { console.error('Listener error:', e); }
    });
  }

  // ==========================================
  // 交易记录 CRUD
  // ==========================================

  function getTrades(options) {
    options = options || {};
    var trades = _trades.slice();

    // 筛选
    if (options.startDate) {
      trades = trades.filter(function(t) { return t.date >= options.startDate; });
    }
    if (options.endDate) {
      trades = trades.filter(function(t) { return t.date <= options.endDate; });
    }
    if (options.stockCode) {
      trades = trades.filter(function(t) { return t.stockCode === options.stockCode; });
    }
    if (options.direction) {
      trades = trades.filter(function(t) { return t.direction === options.direction; });
    }
    if (options.emotion) {
      trades = trades.filter(function(t) { return t.emotion === options.emotion; });
    }
    if (options.pnlType === 'profit') {
      trades = trades.filter(function(t) { return t.pnlAmount > 0; });
    } else if (options.pnlType === 'loss') {
      trades = trades.filter(function(t) { return t.pnlAmount < 0; });
    } else if (options.pnlType === 'even') {
      trades = trades.filter(function(t) { return t.pnlAmount === 0; });
    }

    // 排序
    var sortField = options.sort || 'date';
    var sortOrder = options.order || 'desc';
    trades.sort(function(a, b) {
      var va = a[sortField];
      var vb = b[sortField];
      if (typeof va === 'string') {
        return sortOrder === 'desc' ? vb.localeCompare(va) : va.localeCompare(vb);
      }
      return sortOrder === 'desc' ? vb - va : va - vb;
    });

    // 分页
    var page = options.page || 1;
    var pageSize = options.pageSize || 20;
    var total = trades.length;
    var totalPages = Math.ceil(total / pageSize);
    var start = (page - 1) * pageSize;
    var items = trades.slice(start, start + pageSize);

    return {
      items: items,
      total: total,
      page: page,
      pageSize: pageSize,
      totalPages: totalPages
    };
  }

  function getAllTrades() {
    return _trades.slice();
  }

  function getTradeById(id) {
    for (var i = 0; i < _trades.length; i++) {
      if (_trades[i].id === id) return _trades[i];
    }
    return null;
  }

  function addTrade(data) {
    var trade = {
      id: Utils.generateId('trx'),
      date: data.date || Utils.formatDate(new Date()),
      stockCode: data.stockCode || '',
      stockName: data.stockName || Utils.getStockName(data.stockCode) || '',
      direction: data.direction || 'sell',
      pnlAmount: Number(data.pnlAmount) || 0,
      pnlPercent: Number(data.pnlPercent) || 0,
      costPrice: data.costPrice ? Number(data.costPrice) : null,
      sellPrice: data.sellPrice ? Number(data.sellPrice) : null,
      shares: data.shares ? Number(data.shares) : null,
      reason: data.reason || '',
      emotion: data.emotion || 'calm',
      notes: data.notes || '',
      tags: data.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    _trades.push(trade);
    _saveTrades();
    _notify('trade:add', trade);
    return trade;
  }

  function updateTrade(id, data) {
    for (var i = 0; i < _trades.length; i++) {
      if (_trades[i].id === id) {
        for (var key in data) {
          if (key !== 'id' && key !== 'createdAt' && data.hasOwnProperty(key)) {
            _trades[i][key] = data[key];
          }
        }
        _trades[i].stockName = data.stockName || Utils.getStockName(data.stockCode) || _trades[i].stockName;
        _trades[i].updatedAt = new Date().toISOString();
        _saveTrades();
        _notify('trade:update', _trades[i]);
        return _trades[i];
      }
    }
    return null;
  }

  function deleteTrade(id) {
    for (var i = 0; i < _trades.length; i++) {
      if (_trades[i].id === id) {
        var removed = _trades.splice(i, 1)[0];
        _saveTrades();
        _notify('trade:delete', removed);
        return removed;
      }
    }
    return null;
  }

  // ==========================================
  // 统计计算
  // ==========================================

  function _filterTradesByPeriod(period, dateStr) {
    var d = dateStr ? new Date(dateStr) : new Date();
    var y = d.getFullYear();
    var m = d.getMonth();
    var datePrefix, startDate, endDate;

    switch (period) {
      case 'day':
        var dayStr = Utils.formatDate(d);
        return _trades.filter(function(t) { return t.date === dayStr; });
      case 'week':
        var weekStart = Utils.getWeekStart(d);
        startDate = Utils.formatDate(weekStart);
        endDate = Utils.formatDate(new Date(weekStart.getTime() + 6 * 86400000));
        return _trades.filter(function(t) { return t.date >= startDate && t.date <= endDate; });
      case 'month':
        datePrefix = y + '-' + ('0' + (m + 1)).slice(-2);
        return _trades.filter(function(t) { return t.date.indexOf(datePrefix) === 0; });
      case 'year':
        datePrefix = y + '';
        return _trades.filter(function(t) { return t.date.indexOf(datePrefix) === 0; });
      default:
        return _trades.slice();
    }
  }

  function _calcPnL(trades) {
    var total = 0;
    for (var i = 0; i < trades.length; i++) {
      total += trades[i].pnlAmount;
    }
    return total;
  }

  function getDailyPnL(dateStr) {
    var cacheKey = 'daily_' + (dateStr || Utils.formatDate(new Date()));
    var cached = _getCache(cacheKey);
    if (cached !== null) return cached;
    var trades = _filterTradesByPeriod('day', dateStr);
    var result = _calcPnL(trades);
    _setCache(cacheKey, result);
    return result;
  }

  function getWeeklyPnL(dateStr) {
    var cacheKey = 'weekly_' + (dateStr || Utils.formatDate(new Date()));
    var cached = _getCache(cacheKey);
    if (cached !== null) return cached;
    var trades = _filterTradesByPeriod('week', dateStr);
    var result = _calcPnL(trades);
    _setCache(cacheKey, result);
    return result;
  }

  function getMonthlyPnL(dateStr) {
    var cacheKey = 'monthly_' + (dateStr || Utils.formatDate(new Date()));
    var cached = _getCache(cacheKey);
    if (cached !== null) return cached;
    var trades = _filterTradesByPeriod('month', dateStr);
    var result = _calcPnL(trades);
    _setCache(cacheKey, result);
    return result;
  }

  function getYearlyPnL(dateStr) {
    var cacheKey = 'yearly_' + (dateStr || Utils.formatDate(new Date()));
    var cached = _getCache(cacheKey);
    if (cached !== null) return cached;
    var trades = _filterTradesByPeriod('year', dateStr);
    var result = _calcPnL(trades);
    _setCache(cacheKey, result);
    return result;
  }

  function getTotalPnL() {
    return _calcPnL(_trades);
  }

  function getCumulativeCurve(startDate, endDate) {
    var sorted = _trades.slice().sort(function(a, b) { return a.date.localeCompare(b.date); });
    var cumulative = 0;
    var data = [];
    for (var i = 0; i < sorted.length; i++) {
      var t = sorted[i];
      if (startDate && t.date < startDate) continue;
      if (endDate && t.date > endDate) continue;
      cumulative += t.pnlAmount;
      data.push({ date: t.date, value: cumulative });
    }
    return data;
  }

  function getMaxDrawdown() {
    var curve = getCumulativeCurve();
    if (curve.length === 0) return { maxDrawdown: 0, peak: 0, trough: 0, startDate: '', endDate: '' };
    var peak = curve[0].value;
    var maxDD = 0;
    var peakDate = curve[0].date;
    var ddStart = '', ddEnd = '';
    var currentPeakDate = curve[0].date;
    for (var i = 1; i < curve.length; i++) {
      if (curve[i].value > peak) {
        peak = curve[i].value;
        currentPeakDate = curve[i].date;
      }
      var dd = peak - curve[i].value;
      if (dd > maxDD) {
        maxDD = dd;
        ddStart = currentPeakDate;
        ddEnd = curve[i].date;
      }
    }
    return { maxDrawdown: maxDD, peak: peak, startDate: ddStart, endDate: ddEnd };
  }

  function getWinRateStats(period) {
    var trades = period ? _filterTradesByPeriod(period) : _trades;
    if (trades.length === 0) {
      return {
        totalTrades: 0, winTrades: 0, lossTrades: 0, evenTrades: 0,
        winRate: 0, avgWinAmount: 0, avgLossAmount: 0,
        profitFactor: 0, maxSingleWin: 0, maxSingleLoss: 0,
        consecutiveWins: 0, consecutiveLosses: 0, expectancy: 0
      };
    }
    var win = 0, loss = 0, even = 0;
    var totalWin = 0, totalLoss = 0;
    var maxWin = 0, maxLoss = 0;
    var curWin = 0, curLoss = 0, maxConWin = 0, maxConLoss = 0;

    for (var i = 0; i < trades.length; i++) {
      var pnl = trades[i].pnlAmount;
      if (pnl > 0) {
        win++;
        totalWin += pnl;
        if (pnl > maxWin) maxWin = pnl;
        curWin++;
        maxConWin = Math.max(maxConWin, curWin);
        curLoss = 0;
      } else if (pnl < 0) {
        loss++;
        totalLoss += Math.abs(pnl);
        if (Math.abs(pnl) > maxLoss) maxLoss = Math.abs(pnl);
        curLoss++;
        maxConLoss = Math.max(maxConLoss, curLoss);
        curWin = 0;
      } else {
        even++;
      }
    }

    var avgWin = win > 0 ? totalWin / win : 0;
    var avgLoss = loss > 0 ? totalLoss / loss : 0;
    var winRate = trades.length > 0 ? (win / trades.length * 100) : 0;
    var profitFactor = avgLoss > 0 ? avgWin / avgLoss : 0;
    var expectancy = (winRate / 100) * avgWin - (1 - winRate / 100) * avgLoss;

    return {
      totalTrades: trades.length,
      winTrades: win,
      lossTrades: loss,
      evenTrades: even,
      winRate: winRate,
      avgWinAmount: avgWin,
      avgLossAmount: avgLoss,
      profitFactor: profitFactor,
      maxSingleWin: maxWin,
      maxSingleLoss: maxLoss,
      consecutiveWins: maxConWin,
      consecutiveLosses: maxConLoss,
      expectancy: expectancy
    };
  }

  function getEmotionCorrelation() {
    var result = {};
    for (var i = 0; i < _trades.length; i++) {
      var t = _trades[i];
      var key = t.emotion;
      if (!result[key]) {
        result[key] = { count: 0, totalPnL: 0, winCount: 0, amounts: [] };
      }
      result[key].count++;
      result[key].totalPnL += t.pnlAmount;
      result[key].amounts.push(t.pnlAmount);
      if (t.pnlAmount > 0) result[key].winCount++;
    }
    // 计算平均值和胜率
    for (var key in result) {
      var d = result[key];
      d.avgPnL = d.count > 0 ? d.totalPnL / d.count : 0;
      d.winRate = d.count > 0 ? (d.winCount / d.count * 100) : 0;
    }
    return result;
  }

  function getMonthlyPnLByDay(year, month) {
    var prefix = year + '-' + ('0' + month).slice(-2);
    var trades = _trades.filter(function(t) { return t.date.indexOf(prefix) === 0; });
    var daily = {};
    for (var i = 0; i < trades.length; i++) {
      var d = trades[i].date;
      daily[d] = (daily[d] || 0) + trades[i].pnlAmount;
    }
    return daily;
  }

  function getPnLDistribution(bins) {
    bins = bins || 10;
    if (_trades.length === 0) return [];
    var amounts = _trades.map(function(t) { return t.pnlAmount; });
    var min = Math.min.apply(null, amounts);
    var max = Math.max.apply(null, amounts);
    var range = max - min;
    if (range === 0) return [{ range: min + '~' + max, count: _trades.length }];
    var binSize = range / bins;
    var distribution = [];
    for (var i = 0; i < bins; i++) {
      var low = min + i * binSize;
      var high = low + binSize;
      var count = 0;
      for (var j = 0; j < amounts.length; j++) {
        if (i === bins - 1) {
          if (amounts[j] >= low && amounts[j] <= high) count++;
        } else {
          if (amounts[j] >= low && amounts[j] < high) count++;
        }
      }
      distribution.push({
        low: Math.round(low),
        high: Math.round(high),
        range: Math.round(low) + '~' + Math.round(high),
        count: count
      });
    }
    return distribution;
  }

  // ==========================================
  // 风控
  // ==========================================

  function getSettings() {
    return JSON.parse(JSON.stringify(_settings));
  }

  function updateSettings(data) {
    if (data.riskControl) {
      _settings.riskControl = data.riskControl;
    }
    _saveSettings();
    _notify('settings:update', _settings);
    return _settings;
  }

  function checkRiskAlerts() {
    var rc = _settings.riskControl;
    var alerts = [];

    if (rc.dailyLossLimit > 0) {
      var daily = getDailyPnL();
      if (daily < 0) {
        var ratio = Math.abs(daily) / rc.dailyLossLimit;
        if (ratio >= 1.0) {
          alerts.push({ level: 'danger', type: 'daily', message: '日亏损已超限！当前亏损 ' + Utils.formatMoney(Math.abs(daily)) + '，上限 ' + Utils.formatMoney(rc.dailyLossLimit), ratio: ratio });
        } else if (ratio >= rc.alertThreshold / 100) {
          alerts.push({ level: 'warning', type: 'daily', message: '日亏损已达 ' + Math.round(ratio * 100) + '%，注意控制风险', ratio: ratio });
        }
      }
    }

    if (rc.weeklyLossLimit > 0) {
      var weekly = getWeeklyPnL();
      if (weekly < 0) {
        var ratio2 = Math.abs(weekly) / rc.weeklyLossLimit;
        if (ratio2 >= 1.0) {
          alerts.push({ level: 'danger', type: 'weekly', message: '周亏损已超限！当前亏损 ' + Utils.formatMoney(Math.abs(weekly)) + '，上限 ' + Utils.formatMoney(rc.weeklyLossLimit), ratio: ratio2 });
        } else if (ratio2 >= rc.alertThreshold / 100) {
          alerts.push({ level: 'warning', type: 'weekly', message: '周亏损已达 ' + Math.round(ratio2 * 100) + '%，注意控制风险', ratio: ratio2 });
        }
      }
    }

    if (rc.monthlyLossLimit > 0) {
      var monthly = getMonthlyPnL();
      if (monthly < 0) {
        var ratio3 = Math.abs(monthly) / rc.monthlyLossLimit;
        if (ratio3 >= 1.0) {
          alerts.push({ level: 'danger', type: 'monthly', message: '月亏损已超限！当前亏损 ' + Utils.formatMoney(Math.abs(monthly)) + '，上限 ' + Utils.formatMoney(rc.monthlyLossLimit), ratio: ratio3 });
        } else if (ratio3 >= rc.alertThreshold / 100) {
          alerts.push({ level: 'warning', type: 'monthly', message: '月亏损已达 ' + Math.round(ratio3 * 100) + '%，注意控制风险', ratio: ratio3 });
        }
      }
    }

    return alerts;
  }

  function getRiskStatus() {
    var rc = _settings.riskControl;
    var status = { daily: null, weekly: null, monthly: null };
    var daily = getDailyPnL();
    var weekly = getWeeklyPnL();
    var monthly = getMonthlyPnL();

    if (rc.dailyLossLimit > 0) {
      var dr = daily < 0 ? Math.abs(daily) / rc.dailyLossLimit : 0;
      status.daily = { current: daily, limit: rc.dailyLossLimit, ratio: Math.min(dr, 1) };
    }
    if (rc.weeklyLossLimit > 0) {
      var wr = weekly < 0 ? Math.abs(weekly) / rc.weeklyLossLimit : 0;
      status.weekly = { current: weekly, limit: rc.weeklyLossLimit, ratio: Math.min(wr, 1) };
    }
    if (rc.monthlyLossLimit > 0) {
      var mr = monthly < 0 ? Math.abs(monthly) / rc.monthlyLossLimit : 0;
      status.monthly = { current: monthly, limit: rc.monthlyLossLimit, ratio: Math.min(mr, 1) };
    }
    return status;
  }

  // ==========================================
  // 数据导入导出
  // ==========================================

  function exportAllData() {
    return {
      version: CURRENT_VERSION,
      exportedAt: new Date().toISOString(),
      trades: _trades,
      settings: _settings
    };
  }

  function importData(jsonString) {
    var data = Utils.safeJSONParse(jsonString, null);
    if (!data || !Array.isArray(data.trades)) return false;
    // 合并导入：避免ID冲突
    var existingIds = {};
    _trades.forEach(function(t) { existingIds[t.id] = true; });
    var imported = 0;
    data.trades.forEach(function(t) {
      if (t && t.date && t.stockCode && typeof t.pnlAmount === 'number') {
        if (existingIds[t.id]) {
          t.id = Utils.generateId('trx'); // 重新生成ID避免冲突
        }
        if (!t.id) t.id = Utils.generateId('trx');
        if (!t.createdAt) t.createdAt = new Date().toISOString();
        if (!t.updatedAt) t.updatedAt = new Date().toISOString();
        _trades.push(t);
        imported++;
      }
    });
    if (data.settings && data.settings.riskControl) {
      _settings = data.settings;
    }
    _saveTrades();
    _saveSettings();
    _notify('data:import', { count: imported });
    return imported;
  }

  function clearAllData() {
    _trades = [];
    _settings = _defaultSettings();
    _saveTrades();
    _saveSettings();
    _clearCache();
    _notify('data:clear', null);
  }

  function importSampleData() {
    var samples = [
      { date: '2026-06-24', stockCode: '600519', stockName: '贵州茅台', direction: 'sell', pnlAmount: 2350, pnlPercent: 5.2, reason: '达到目标价位', emotion: 'calm', notes: '等待了3个月终于等到目标价' },
      { date: '2026-06-23', stockCode: '000858', stockName: '五粮液',   direction: 'sell', pnlAmount: -890,  pnlPercent: -2.1, reason: '止损离场',     emotion: 'regret', notes: '止损出局，后续可能继续下跌' },
      { date: '2026-06-20', stockCode: '300750', stockName: '宁德时代', direction: 'sell', pnlAmount: 4120,  pnlPercent: 8.7, reason: '利好消息兑现', emotion: 'excited', notes: '政策利好推动上涨' },
      { date: '2026-06-18', stockCode: '002594', stockName: '比亚迪',   direction: 'sell', pnlAmount: -1560, pnlPercent: -3.4, reason: '破位下跌',     emotion: 'anxious', notes: '跌破支撑位，及时止损' },
      { date: '2026-06-15', stockCode: '600036', stockName: '招商银行', direction: 'sell', pnlAmount: 780,   pnlPercent: 1.8, reason: '短线获利',     emotion: 'calm', notes: '银行板块小幅上涨' },
      { date: '2026-06-13', stockCode: '601318', stockName: '中国平安', direction: 'sell', pnlAmount: -2300, pnlPercent: -4.5, reason: '基本面恶化',   emotion: 'fear', notes: '保险板块整体走弱' },
      { date: '2026-06-11', stockCode: '000333', stockName: '美的集团', direction: 'sell', pnlAmount: 1560,  pnlPercent: 3.2, reason: '趋势跟踪',     emotion: 'rational', notes: '家电板块趋势向好' },
      { date: '2026-06-09', stockCode: '600900', stockName: '长江电力', direction: 'sell', pnlAmount: 450,   pnlPercent: 1.1, reason: '短线获利',     emotion: 'calm', notes: '防御性品种稳定获利' },
      { date: '2026-06-06', stockCode: '300059', stockName: '东方财富', direction: 'sell', pnlAmount: -3200, pnlPercent: -6.8, reason: '追涨入场',     emotion: 'fomo', notes: '追高被套，惨痛教训' },
      { date: '2026-06-04', stockCode: '601899', stockName: '紫金矿业', direction: 'sell', pnlAmount: 2890,  pnlPercent: 5.9, reason: '利好消息兑现', emotion: 'excited', notes: '金价上涨带动板块' }
    ];
    var count = 0;
    samples.forEach(function(s) {
      addTrade(s);
      count++;
    });
    return count;
  }

  // === 落地页查看标记 ===
  function isLandingViewed() {
    return localStorage.getItem(KEYS.landingViewed) === 'true';
  }
  function setLandingViewed(val) {
    localStorage.setItem(KEYS.landingViewed, val ? 'true' : 'false');
  }

  // === 统计摘要 ===
  function getSummary() {
    var total = getTotalPnL();
    var stats = getWinRateStats();
    var todayPnL = getDailyPnL();
    var monthPnL = getMonthlyPnL();
    return {
      totalPnL: total,
      totalTrades: _trades.length,
      todayPnL: todayPnL,
      monthPnL: monthPnL,
      winRate: stats.winRate,
      winTrades: stats.winTrades,
      lossTrades: stats.lossTrades,
      profitFactor: stats.profitFactor,
      maxDrawdown: getMaxDrawdown().maxDrawdown
    };
  }

  // 初始化
  init();

  return {
    init: init,
    subscribe: subscribe,
    getTrades: getTrades,
    getAllTrades: getAllTrades,
    getTradeById: getTradeById,
    addTrade: addTrade,
    updateTrade: updateTrade,
    deleteTrade: deleteTrade,
    getDailyPnL: getDailyPnL,
    getWeeklyPnL: getWeeklyPnL,
    getMonthlyPnL: getMonthlyPnL,
    getYearlyPnL: getYearlyPnL,
    getTotalPnL: getTotalPnL,
    getCumulativeCurve: getCumulativeCurve,
    getMaxDrawdown: getMaxDrawdown,
    getWinRateStats: getWinRateStats,
    getEmotionCorrelation: getEmotionCorrelation,
    getMonthlyPnLByDay: getMonthlyPnLByDay,
    getPnLDistribution: getPnLDistribution,
    getSettings: getSettings,
    updateSettings: updateSettings,
    checkRiskAlerts: checkRiskAlerts,
    getRiskStatus: getRiskStatus,
    exportAllData: exportAllData,
    importData: importData,
    clearAllData: clearAllData,
    importSampleData: importSampleData,
    isLandingViewed: isLandingViewed,
    setLandingViewed: setLandingViewed,
    getSummary: getSummary
  };
})();
