// repositories/record-repository.js
// 排便记录仓库：基于 storageManager 封装 CRUD 与查询
// 修复：getRecordById 接受字符串/数字 ID（兼容 parseInt 后的数字）

const storageManager = require('../storage/storage-manager.js');
const STORAGE_KEYS = require('../storage/storage-keys.js');
const Record = require('../models/record.js');

const recordRepository = {
  /**
   * 获取所有记录，按 timestamp 降序
   * @returns {Record[]}
   */
  getAllRecords() {
    const list = storageManager.get(STORAGE_KEYS.RECORDS, []);
    if (!Array.isArray(list)) return [];
    const records = list
      .map(item => Record.fromObject(item))
      .filter(r => r !== null);
    records.sort((a, b) => b.timestamp - a.timestamp);
    return records;
  },

  /**
   * 私有：按 id 查记录的统一入口
   * 匹配策略（按优先级）：
   *   1) 完整字符串完全相等
   *   2) target 是 recId 的数字前缀且下一字符是下划线（截断 ID 兜底）
   *   3) recId 是 target 的数字前缀且下一字符是下划线（对称情况）
   * 返回首个匹配；若仅依赖前缀且存在多条候选则返回 timestamp 最接近 target
   * 的那条（因为 ID 的数字部分就是 timestamp），避免随机返回。
   * @returns {Record|null}
   */
  _findById(list, target) {
    if (!list || list.length === 0) return null;
    // 1. 完全相等
    for (let i = 0; i < list.length; i++) {
      if (String(list[i].id) === target) return list[i];
    }
    // 2. 前缀匹配（带下划线边界）— 截断 ID 兜底
    const candidates = [];
    const targetNum = Number(target);
    const isNumericTarget = !isNaN(targetNum) && isFinite(targetNum) && /^\d+$/.test(target);
    for (let i = 0; i < list.length; i++) {
      const recId = String(list[i].id);
      if (recId.length > target.length && recId.startsWith(target) && recId.charAt(target.length) === '_') {
        candidates.push(list[i]);
      } else if (target.length > recId.length && target.startsWith(recId) && target.charAt(recId.length) === '_') {
        candidates.push(list[i]);
      }
    }
    if (candidates.length === 0) return null;
    if (candidates.length === 1) return candidates[0];
    // 多条候选：取 timestamp 最接近 target 数值的那条
    if (isNumericTarget) {
      candidates.sort((a, b) =>
        Math.abs(a.timestamp - targetNum) - Math.abs(b.timestamp - targetNum)
      );
      return candidates[0];
    }
    return candidates[0];
  },

  /**
   * 按 id 查找
   * 修复 PT-mp-004/005：兼容 parseInt 截断的 ID（按时间戳选最接近的一条）
   * @param {string|number} id
   * @returns {Record|null}
   */
  getRecordById(id) {
    if (id === null || id === undefined || id === '') return null;
    return this._findById(this.getAllRecords(), String(id));
  },

  /**
   * 按时间区间筛选 [start, end]
   * @param {number} start
   * @param {number} end
   * @returns {Record[]}
   */
  getRecordsByDateRange(start, end) {
    const all = this.getAllRecords();
    return all.filter(r => r.timestamp >= start && r.timestamp <= end);
  },

  /**
   * 按某天（已给定 startOfDay / endOfDay）筛选
   */
  getRecordsByDate(startOfDay, endOfDay) {
    return this.getRecordsByDateRange(startOfDay, endOfDay);
  },

  /**
   * 按月筛选
   * @param {number} year
   * @param {number} month 0-11
   */
  getRecordsByMonth(year, month) {
    const start = new Date(year, month, 1, 0, 0, 0, 0).getTime();
    const end = new Date(year, month + 1, 0, 23, 59, 59, 999).getTime();
    return this.getRecordsByDateRange(start, end);
  },

  /**
   * 生成新 id
   */
  generateId() {
    return String(Date.now()) + '_' + Math.floor(Math.random() * 1000);
  },

  /**
   * 插入一条记录。如未提供 id/createdAt/updatedAt 自动补齐。
   * 修复 PT-mp-009：强制规范化 timestamp 为合法正整数，
   * 防止 string/NaN/负数等脏数据让"本周次数"统计失真。
   * @param {Record|object} record
   * @returns {Record|null} 落库后的实例；timestamp 无法规范化时返回 null
   */
  insertRecord(record) {
    const list = storageManager.get(STORAGE_KEYS.RECORDS, []);
    const arr = Array.isArray(list) ? list : [];

    let rec = record instanceof Record ? record : Record.fromObject(record);
    if (!rec) {
      rec = new Record({});
    }
    // 强制规范化 timestamp
    let ts = Number(rec.timestamp);
    if (!isFinite(ts) || ts <= 0) {
      // 非法时间戳：回退到 createdAt/updatedAt/Date.now()，最后兜底为当前时间
      ts = Number(rec.createdAt) || Number(rec.updatedAt) || Date.now();
    }
    rec.timestamp = Math.floor(ts);
    if (!rec.id) {
      rec.id = this.generateId();
    }
    const now = Date.now();
    if (!rec.createdAt) rec.createdAt = now;
    rec.updatedAt = now;

    arr.push(rec.toObject());
    storageManager.set(STORAGE_KEYS.RECORDS, arr);
    return rec;
  },

  /**
   * 更新记录
   * @param {Record|object} record
   * @returns {Record|null}
   */
  updateRecord(record) {
    if (!record) return null;
    const rec = record instanceof Record ? record : Record.fromObject(record);
    if (!rec || !rec.id) return null;

    const list = storageManager.get(STORAGE_KEYS.RECORDS, []);
    const arr = Array.isArray(list) ? list : [];
    let found = false;
    for (let i = 0; i < arr.length; i++) {
      if (String(arr[i].id) === String(rec.id)) {
        rec.updatedAt = Date.now();
        if (!rec.createdAt) rec.createdAt = arr[i].createdAt || rec.updatedAt;
        arr[i] = rec.toObject();
        found = true;
        break;
      }
    }
    if (!found) return null;
    storageManager.set(STORAGE_KEYS.RECORDS, arr);
    return rec;
  },

  /**
   * 按 id 删除（兼容 parseInt 后的数字 ID）
   * 修复：删除时只精确移除通过 _findById 找到的那一条（不多删）
   * @param {string|number} id
   * @returns {boolean}
   */
  deleteRecord(id) {
    if (id === null || id === undefined) return false;
    const list = storageManager.get(STORAGE_KEYS.RECORDS, []);
    const arr = Array.isArray(list) ? list : [];
    const target = String(id);

    const targetRec = this._findById(arr, target);
    if (!targetRec) return false;

    // 用 _findById 实际命中的那一条的 id 作为精确删除 key
    const exactId = String(targetRec.id);
    const next = arr.filter(item => String(item.id) !== exactId);
    if (next.length === arr.length) return false;
    storageManager.set(STORAGE_KEYS.RECORDS, next);
    return true;
  },

  /**
   * 清空所有记录
   */
  clearAll() {
    storageManager.set(STORAGE_KEYS.RECORDS, []);
  },

  /**
   * 记录总数
   */
  getRecordCount() {
    return this.getAllRecords().length;
  },

  /**
   * BristolType 平均值（仅统计合法记录）
   * @returns {number} 平均值；无记录时返回 0
   */
  getAverageBristolType() {
    const all = this.getAllRecords();
    const valid = all.filter(r => r.isValid());
    if (valid.length === 0) return 0;
    const sum = valid.reduce((acc, r) => acc + Number(r.bristolType), 0);
    return sum / valid.length;
  }
};

module.exports = recordRepository;
