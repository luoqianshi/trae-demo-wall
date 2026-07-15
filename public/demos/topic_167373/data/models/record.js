// models/record.js
// 单条排便记录模型

class Record {
  /**
   * @param {object} options
   * @param {string|number} [options.id]
   * @param {number} [options.timestamp] 记录发生时间
   * @param {number} [options.bristolType] 1-7
   * @param {string} [options.color] brown/yellow/green/black/red/gray/white
   * @param {string} [options.note]
   * @param {number} [options.painLevel] 0-3 · V0.2.0 身体感受：疼痛强度
   * @param {boolean} [options.swelling] V0.2.0 身体感受：腹胀
   * @param {boolean} [options.residue] V0.2.0 身体感受：残留感
   * @param {boolean} [options.unfinished] V0.2.0 身体感受：排不尽
   * @param {number} [options.createdAt]
   * @param {number} [options.updatedAt]
   */
  constructor(options) {
    options = options || {};
    this.id = options.id != null ? String(options.id) : null;
    this.timestamp = options.timestamp != null ? Number(options.timestamp) : 0;
    this.bristolType = options.bristolType != null ? Number(options.bristolType) : 0;
    this.color = options.color || '';
    this.note = options.note || '';
    // V0.2.0 身体感受字段 · 老数据自动默认 0/false，无须迁移
    this.painLevel = (options.painLevel != null && isFinite(options.painLevel))
      ? Math.max(0, Math.min(3, Math.floor(Number(options.painLevel))))
      : 0;
    this.swelling = options.swelling === true || options.swelling === 1;
    this.residue = options.residue === true || options.residue === 1;
    this.unfinished = options.unfinished === true || options.unfinished === 1;
    this.createdAt = options.createdAt || Date.now();
    this.updatedAt = options.updatedAt || Date.now();
  }

  /**
   * 静态工厂方法：从普通对象构建 Record，兼容 null/undefined
   * @param {object|null|undefined} obj
   * @returns {Record|null}
   */
  static fromObject(obj) {
    if (!obj || typeof obj !== 'object') return null;
    return new Record({
      id: obj.id,
      bristolType: obj.bristolType,
      color: obj.color,
      timestamp: obj.timestamp,
      note: obj.note,
      // V0.2.0 身体感受字段（老数据缺失时默认为 0/false）
      painLevel: obj.painLevel,
      swelling: obj.swelling,
      residue: obj.residue,
      unfinished: obj.unfinished,
      createdAt: obj.createdAt,
      updatedAt: obj.updatedAt
    });
  }

  /**
   * 序列化为可存储的纯对象
   */
  toObject() {
    return {
      id: this.id,
      bristolType: this.bristolType,
      color: this.color,
      timestamp: this.timestamp,
      note: this.note,
      // V0.2.0 身体感受字段
      painLevel: this.painLevel,
      swelling: this.swelling,
      residue: this.residue,
      unfinished: this.unfinished,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * 验证记录是否合法
   * 规则：bristolType 必须为 1-7 的整数；timestamp 必须为正数
   */
  isValid() {
    const t = Number(this.bristolType);
    if (!Number.isInteger(t) || t < 1 || t > 7) {
      return false;
    }
    if (typeof this.timestamp !== 'number' || this.timestamp <= 0) {
      return false;
    }
    return true;
  }
}

module.exports = Record;
