// models/user-profile.js
// 用户档案模型

const GENDER_NAME_MAP = {
  male: '男',
  female: '女',
  unknown: '不愿透露'
};

const CONCERN_LEVEL_NAME_MAP = {
  none: '无',
  mild: '轻度',
  moderate: '中度',
  severe: '重度'
};

class UserProfile {
  /**
   * @param {object} options
   * @param {number} [options.id] 单例主键，默认 1
   * @param {string} [options.gender] male / female / unknown
   * @param {string} [options.ageRange] 年龄段描述
   * @param {string} [options.concernLevel] none / mild / moderate / severe
   * @param {number} [options.createdAt]
   */
  constructor(options) {
    options = options || {};
    this.id = options.id != null ? options.id : 1;
    this.gender = options.gender || 'unknown';
    this.ageRange = options.ageRange || '';
    this.concernLevel = options.concernLevel || 'none';
    this.createdAt = options.createdAt || Date.now();
  }

  /**
   * 静态工厂：从普通对象构建 UserProfile，null/undefined 返回 null
   */
  static fromObject(obj) {
    if (!obj || typeof obj !== 'object') return null;
    return new UserProfile({
      id: obj.id,
      gender: obj.gender,
      ageRange: obj.ageRange,
      concernLevel: obj.concernLevel,
      createdAt: obj.createdAt
    });
  }

  toObject() {
    return {
      id: this.id,
      gender: this.gender,
      ageRange: this.ageRange,
      concernLevel: this.concernLevel,
      createdAt: this.createdAt
    };
  }

  getGenderName() {
    return GENDER_NAME_MAP[this.gender] || '不愿透露';
  }

  getAgeRangeName() {
    return this.ageRange || '';
  }

  getConcernLevelName() {
    return CONCERN_LEVEL_NAME_MAP[this.concernLevel] || '无';
  }
}

module.exports = UserProfile;
