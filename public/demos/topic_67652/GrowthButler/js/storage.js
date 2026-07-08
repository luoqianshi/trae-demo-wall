/* ============================================
   storage.js - 数据存储层
   负责 localStorage 数据加载/保存/初始化，
   以及各实体（babies/behaviors/records/rewards/
   exchanges/operators）的 CRUD 操作。
   挂载到全局命名空间 App.Storage
   ============================================ */

(function (global) {
  'use strict';

  global.App = global.App || {};
  var Utils = global.App.Utils;

  /** localStorage 键名 */
  var STORAGE_KEY = 'baby_points_data';

  /** 数据版本号 */
  var DATA_VERSION = 1;

  /** 内存中的数据缓存 */
  var data = null;

  // ---------- 默认初始化数据 ----------
  /** 构造默认数据结构 */
  function createDefaultData() {
    var now = new Date().toISOString();
    var operators = [
      { id: Utils.uuid(), name: '妈妈', createdAt: now },
      { id: Utils.uuid(), name: '爸爸', createdAt: now },
      { id: Utils.uuid(), name: '奶奶', createdAt: now },
      { id: Utils.uuid(), name: '爷爷', createdAt: now }
    ];
    var behaviors = [
      { id: Utils.uuid(), name: '按时睡觉', points: 1, icon: '🛏️', type: 'add', createdAt: now },
      { id: Utils.uuid(), name: '专心吃饭', points: 1, icon: '🍚', type: 'add', createdAt: now },
      { id: Utils.uuid(), name: '自己刷牙', points: 1, icon: '🪥', type: 'add', createdAt: now },
      { id: Utils.uuid(), name: '说脏话', points: 1, icon: '🤬', type: 'deduct', createdAt: now },
      { id: Utils.uuid(), name: '乱扔玩具', points: 1, icon: '🧸', type: 'deduct', createdAt: now }
    ];
    return {
      version: DATA_VERSION,
      currentBabyId: null,
      currentOperatorId: operators[0].id,
      babies: [],
      behaviors: behaviors,
      records: [],
      rewards: [],
      exchanges: [],
      operators: operators
    };
  }

  /** 从 localStorage 加载数据，无则初始化默认数据 */
  function loadData() {
    if (data) return data;
    try {
      var raw = global.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        data = JSON.parse(raw);
        // 兼容性补全字段
        if (!data.babies) data.babies = [];
        if (!data.behaviors) data.behaviors = [];
        if (!data.records) data.records = [];
        if (!data.rewards) data.rewards = [];
        if (!data.exchanges) data.exchanges = [];
        if (!data.operators) data.operators = [];
        if (!data.version) data.version = DATA_VERSION;
      } else {
        data = createDefaultData();
        saveData();
      }
    } catch (e) {
      console.error('加载数据失败，重置为默认数据', e);
      data = createDefaultData();
      saveData();
    }
    return data;
  }

  /** 保存数据到 localStorage */
  function saveData() {
    if (!data) return;
    try {
      global.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('保存数据失败', e);
      Utils.toast('数据保存失败', 'warning');
    }
  }

  /** 获取完整数据对象 */
  function getData() {
    if (!data) loadData();
    return data;
  }

  // ---------- 通用查找 ----------
  function findById(list, id) {
    return list.find(function (item) { return item.id === id; });
  }

  // ---------- 宝宝 CRUD ----------
  function getBabies() { return getData().babies; }
  function getBaby(id) { return findById(getData().babies, id); }
  function getCurrentBaby() {
    var d = getData();
    return d.currentBabyId ? findById(d.babies, d.currentBabyId) : null;
  }
  function addBaby(baby) {
    var d = getData();
    var now = new Date().toISOString();
    var item = {
      id: Utils.uuid(),
      name: baby.name,
      avatar: baby.avatar || '👶',
      birthday: baby.birthday || '',
      color: baby.color || '#FF9F43',
      createdAt: now
    };
    d.babies.push(item);
    // 第一个宝宝自动设为当前宝宝
    if (!d.currentBabyId) d.currentBabyId = item.id;
    saveData();
    return item;
  }
  function updateBaby(id, patch) {
    var d = getData();
    var item = findById(d.babies, id);
    if (!item) return null;
    Object.keys(patch).forEach(function (k) { item[k] = patch[k]; });
    saveData();
    return item;
  }
  /** 删除宝宝，并级联删除其 records 和 exchanges */
  function deleteBaby(id) {
    var d = getData();
    d.babies = d.babies.filter(function (b) { return b.id !== id; });
    d.records = d.records.filter(function (r) { return r.babyId !== id; });
    d.exchanges = d.exchanges.filter(function (e) { return e.babyId !== id; });
    if (d.currentBabyId === id) {
      d.currentBabyId = d.babies.length > 0 ? d.babies[0].id : null;
    }
    saveData();
  }
  function setCurrentBaby(id) {
    var d = getData();
    if (findById(d.babies, id)) {
      d.currentBabyId = id;
      saveData();
    }
  }

  // ---------- 行为 CRUD ----------
  function getBehaviors() { return getData().behaviors; }
  function getBehavior(id) { return findById(getData().behaviors, id); }
  function getBehaviorsByType(type) {
    return getData().behaviors.filter(function (b) { return b.type === type; });
  }
  function addBehavior(b) {
    var d = getData();
    var now = new Date().toISOString();
    var item = {
      id: Utils.uuid(),
      name: b.name,
      points: Math.floor(Number(b.points)) || 1,
      icon: b.icon || '⭐',
      type: b.type === 'deduct' ? 'deduct' : 'add',
      createdAt: now
    };
    d.behaviors.push(item);
    saveData();
    return item;
  }
  function updateBehavior(id, patch) {
    var d = getData();
    var item = findById(d.behaviors, id);
    if (!item) return null;
    Object.keys(patch).forEach(function (k) { item[k] = patch[k]; });
    if (typeof item.points === 'number') item.points = Math.floor(item.points);
    saveData();
    return item;
  }
  /** 删除行为模板（历史记录保留） */
  function deleteBehavior(id) {
    var d = getData();
    d.behaviors = d.behaviors.filter(function (b) { return b.id !== id; });
    saveData();
  }

  // ---------- 记录 CRUD ----------
  function getRecords() { return getData().records; }
  function getRecordsByBaby(babyId) {
    return getData().records.filter(function (r) { return r.babyId === babyId; });
  }
  function addRecord(r) {
    var d = getData();
    var item = {
      id: Utils.uuid(),
      babyId: r.babyId,
      behaviorId: r.behaviorId,
      behaviorName: r.behaviorName,
      behaviorIcon: r.behaviorIcon,
      points: Math.floor(Number(r.points)) || 0,
      type: r.type === 'deduct' ? 'deduct' : 'add',
      operatorId: r.operatorId,
      operatorName: r.operatorName,
      timestamp: r.timestamp || new Date().toISOString()
    };
    d.records.push(item);
    saveData();
    return item;
  }
  function deleteRecord(id) {
    var d = getData();
    d.records = d.records.filter(function (r) { return r.id !== id; });
    saveData();
  }

  // ---------- 奖励 CRUD ----------
  function getRewards() { return getData().rewards; }
  function getReward(id) { return findById(getData().rewards, id); }
  function addReward(r) {
    var d = getData();
    var now = new Date().toISOString();
    var item = {
      id: Utils.uuid(),
      name: r.name,
      cost: Math.floor(Number(r.cost)) || 1,
      icon: r.icon || '🎁',
      createdAt: now
    };
    d.rewards.push(item);
    saveData();
    return item;
  }
  function updateReward(id, patch) {
    var d = getData();
    var item = findById(d.rewards, id);
    if (!item) return null;
    Object.keys(patch).forEach(function (k) { item[k] = patch[k]; });
    if (typeof item.cost === 'number') item.cost = Math.floor(item.cost);
    saveData();
    return item;
  }
  function deleteReward(id) {
    var d = getData();
    d.rewards = d.rewards.filter(function (r) { return r.id !== id; });
    saveData();
  }

  // ---------- 兑换 CRUD ----------
  function getExchanges() { return getData().exchanges; }
  function getExchangesByBaby(babyId) {
    return getData().exchanges.filter(function (e) { return e.babyId === babyId; });
  }
  function addExchange(e) {
    var d = getData();
    var item = {
      id: Utils.uuid(),
      babyId: e.babyId,
      rewardId: e.rewardId,
      rewardName: e.rewardName,
      rewardIcon: e.rewardIcon,
      cost: Math.floor(Number(e.cost)) || 0,
      status: 'pending',
      operatorId: e.operatorId,
      operatorName: e.operatorName,
      timestamp: new Date().toISOString(),
      resolvedAt: null
    };
    d.exchanges.push(item);
    saveData();
    return item;
  }
  function updateExchange(id, patch) {
    var d = getData();
    var item = findById(d.exchanges, id);
    if (!item) return null;
    Object.keys(patch).forEach(function (k) { item[k] = patch[k]; });
    saveData();
    return item;
  }
  function deleteExchange(id) {
    var d = getData();
    d.exchanges = d.exchanges.filter(function (e) { return e.id !== id; });
    saveData();
  }

  // ---------- 操作人 CRUD ----------
  function getOperators() { return getData().operators; }
  function getOperator(id) { return findById(getData().operators, id); }
  function getCurrentOperator() {
    var d = getData();
    return d.currentOperatorId ? findById(d.operators, d.currentOperatorId) : null;
  }
  function addOperator(name) {
    var d = getData();
    var now = new Date().toISOString();
    var item = { id: Utils.uuid(), name: name, createdAt: now };
    d.operators.push(item);
    saveData();
    return item;
  }
  function updateOperator(id, name) {
    var d = getData();
    var item = findById(d.operators, id);
    if (!item) return null;
    item.name = name;
    saveData();
    return item;
  }
  function deleteOperator(id) {
    var d = getData();
    d.operators = d.operators.filter(function (o) { return o.id !== id; });
    if (d.currentOperatorId === id) {
      d.currentOperatorId = d.operators.length > 0 ? d.operators[0].id : null;
    }
    saveData();
  }
  function setCurrentOperator(id) {
    var d = getData();
    if (findById(d.operators, id)) {
      d.currentOperatorId = id;
      saveData();
    }
  }

  // ---------- 业务计算 ----------
  /** 计算宝宝总积分（所有加分 - 所有扣分 - 已兑换积分） */
  function getBabyTotalPoints(babyId) {
    var d = getData();
    var total = 0;
    d.records.forEach(function (r) {
      if (r.babyId === babyId) {
        total += r.type === 'add' ? r.points : -r.points;
      }
    });
    // 已兑换的奖励扣除积分
    d.exchanges.forEach(function (e) {
      if (e.babyId === babyId && e.status === 'approved') {
        total -= e.cost;
      }
    });
    return total;
  }

  /** 获取宝宝某天的净积分 */
  function getBabyDayNetPoints(babyId, date) {
    var d = getData();
    var dayStart = Utils.startOfDay(date).getTime();
    var dayEnd = dayStart + 24 * 60 * 60 * 1000;
    var net = 0;
    d.records.forEach(function (r) {
      if (r.babyId === babyId) {
        var t = new Date(r.timestamp).getTime();
        if (t >= dayStart && t < dayEnd) {
          net += r.type === 'add' ? r.points : -r.points;
        }
      }
    });
    return net;
  }

  /** 今日摘要：加分次数、扣分次数、净积分 */
  function getBabyTodaySummary(babyId) {
    var d = getData();
    var dayStart = Utils.startOfDay(new Date()).getTime();
    var dayEnd = dayStart + 24 * 60 * 60 * 1000;
    var addCount = 0, deductCount = 0, net = 0;
    d.records.forEach(function (r) {
      if (r.babyId === babyId) {
        var t = new Date(r.timestamp).getTime();
        if (t >= dayStart && t < dayEnd) {
          if (r.type === 'add') { addCount++; net += r.points; }
          else { deductCount++; net -= r.points; }
        }
      }
    });
    return { addCount: addCount, deductCount: deductCount, net: net };
  }

  // ---------- 暴露 API ----------
  App.Storage = {
    STORAGE_KEY: STORAGE_KEY,
    loadData: loadData,
    saveData: saveData,
    getData: getData,
    // 宝宝
    getBabies: getBabies,
    getBaby: getBaby,
    getCurrentBaby: getCurrentBaby,
    addBaby: addBaby,
    updateBaby: updateBaby,
    deleteBaby: deleteBaby,
    setCurrentBaby: setCurrentBaby,
    // 行为
    getBehaviors: getBehaviors,
    getBehavior: getBehavior,
    getBehaviorsByType: getBehaviorsByType,
    addBehavior: addBehavior,
    updateBehavior: updateBehavior,
    deleteBehavior: deleteBehavior,
    // 记录
    getRecords: getRecords,
    getRecordsByBaby: getRecordsByBaby,
    addRecord: addRecord,
    deleteRecord: deleteRecord,
    // 奖励
    getRewards: getRewards,
    getReward: getReward,
    addReward: addReward,
    updateReward: updateReward,
    deleteReward: deleteReward,
    // 兑换
    getExchanges: getExchanges,
    getExchangesByBaby: getExchangesByBaby,
    addExchange: addExchange,
    updateExchange: updateExchange,
    deleteExchange: deleteExchange,
    // 操作人
    getOperators: getOperators,
    getOperator: getOperator,
    getCurrentOperator: getCurrentOperator,
    addOperator: addOperator,
    updateOperator: updateOperator,
    deleteOperator: deleteOperator,
    setCurrentOperator: setCurrentOperator,
    // 计算
    getBabyTotalPoints: getBabyTotalPoints,
    getBabyDayNetPoints: getBabyDayNetPoints,
    getBabyTodaySummary: getBabyTodaySummary
  };

})(typeof window !== 'undefined' ? window : this);
