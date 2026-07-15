/**
 * UserProfile 模型 + 仓库测试
 */

if (typeof wx === 'undefined') {
  global.wx = {
    _storage: {},
    getStorageSync(k) { return this._storage[k] !== undefined ? this._storage[k] : ''; },
    setStorageSync(k, v) { this._storage[k] = v; },
    removeStorageSync(k) { delete this._storage[k]; },
    clearStorageSync() { this._storage = {}; },
    getStorageInfoSync() {
      return { keys: Object.keys(this._storage), currentSize: 0, limitSize: 10240 };
    }
  };
}

const UserProfile = require('../../data/models/user-profile.js');
const userProfileRepository = require('../../data/repositories/user-profile-repository.js');

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log('  ✓ ' + testName);
    passed++;
  } else {
    console.error('  ✗ ' + testName);
    failed++;
  }
}

console.log('\n=== UserProfile 测试 ===');

wx.clearStorageSync();

// 1. 默认值
const empty = new UserProfile();
assert(empty.id === 1, '默认 id = 1');
assert(empty.gender === 'unknown', '默认 gender = unknown');
assert(empty.concernLevel === 'none', '默认 concernLevel = none');

// 2. 名称映射
assert(empty.getGenderName() === '不愿透露', 'unknown → 不愿透露');
assert(empty.getConcernLevelName() === '无', 'none → 无');

const male = new UserProfile({ gender: 'male' });
assert(male.getGenderName() === '男', 'male → 男');
const female = new UserProfile({ gender: 'female' });
assert(female.getGenderName() === '女', 'female → 女');

const severe = new UserProfile({ concernLevel: 'severe' });
assert(severe.getConcernLevelName() === '重度', 'severe → 重度');

// 3. 仓库空状态
const gotNull = userProfileRepository.getProfile();
assert(gotNull === null, '空仓库返回 null');

// 4. 保存档案
const saved = userProfileRepository.saveProfile({
  gender: 'male',
  ageRange: '25-35',
  concernLevel: 'moderate'
});
assert(saved instanceof UserProfile, 'saveProfile 返回 UserProfile 实例');
assert(saved.gender === 'male', '保存的 gender 正确');
assert(saved.ageRange === '25-35', '保存的 ageRange 正确');
assert(saved.concernLevel === 'moderate', '保存的 concernLevel 正确');

// 5. 读取档案
const loaded = userProfileRepository.getProfile();
assert(loaded !== null, '读取后非 null');
assert(loaded.gender === 'male', '读取的 gender 正确');
assert(loaded.getGenderName() === '男', '读取的 getGenderName 正确');
assert(loaded.getConcernLevelName() === '中度', '读取的 getConcernLevelName 正确');

// 6. 更新档案
userProfileRepository.saveProfile({
  gender: 'female',
  ageRange: '36-50',
  concernLevel: 'severe'
});
const updated = userProfileRepository.getProfile();
assert(updated.gender === 'female', '更新后 gender = female');
assert(updated.ageRange === '36-50', '更新后 ageRange = 36-50');
assert(updated.concernLevel === 'severe', '更新后 concernLevel = severe');

// 7. 清空
userProfileRepository.clear();
assert(userProfileRepository.getProfile() === null, '清空后 getProfile 返回 null');

// 8. saveProfile(null) 容错
const nullRes = userProfileRepository.saveProfile(null);
assert(nullRes === null, 'saveProfile(null) 返回 null');

console.log('\n通过 ' + passed + ' / 失败 ' + failed);
process.exit(failed > 0 ? 1 : 0);
