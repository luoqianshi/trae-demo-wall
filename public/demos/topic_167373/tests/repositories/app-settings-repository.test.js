/**
 * AppSettings 模型 + 仓库测试
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

const AppSettings = require('../../data/models/app-settings.js');
const appSettingsRepository = require('../../data/repositories/app-settings-repository.js');

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

console.log('\n=== AppSettings 测试 ===');

wx.clearStorageSync();

// 1. 默认值
const def = new AppSettings();
assert(def.id === 1, '默认 id = 1');
assert(def.hasCompletedOnboarding === false, '默认未完成引导');
assert(def.defaultBristolType === 4, '默认 Bristol 类型 = 4');
assert(def.defaultColor === 'brown', '默认颜色 = brown');
assert(def.reminderEnabled === false, '默认提醒关闭');
assert(def.reminderHour === 9, '默认提醒小时 = 9');
assert(def.reminderMinute === 0, '默认提醒分钟 = 0');
assert(def.reminderRepeatDays === '1,1,1,1,1,1,1', '默认提醒 7 天都开启');

// 2. 提醒时间格式化
assert(def.getReminderTime() === '09:00', '默认提醒时间 09:00');

// 3. 提醒日数组
const days = def.getRepeatDaysArray();
assert(Array.isArray(days) && days.length === 7, 'getRepeatDaysArray 返回 7 元素数组');
assert(days.every(d => d === true), '默认 7 天全部开启');

const noRepeat = new AppSettings({ reminderRepeatDays: '0,0,0,0,0,0,0' });
const noDays = noRepeat.getRepeatDaysArray();
assert(noDays.every(d => d === false), '全部 0 时 7 天全部关闭');

// 4. 仓库：未保存时返回默认
const init = appSettingsRepository.getSettings();
assert(init instanceof AppSettings, 'getSettings 返回 AppSettings');
assert(init.reminderHour === 9, '未保存时为默认值');

// 5. 仓库：保存自定义设置
const custom = new AppSettings({
  reminderEnabled: true,
  reminderHour: 21,
  reminderMinute: 30,
  reminderRepeatDays: '1,0,1,0,1,0,1'
});
appSettingsRepository.saveSettings(custom);

const loaded = appSettingsRepository.getSettings();
assert(loaded.reminderEnabled === true, '持久化 reminderEnabled');
assert(loaded.reminderHour === 21, '持久化 reminderHour');
assert(loaded.reminderMinute === 30, '持久化 reminderMinute');
assert(loaded.getReminderTime() === '21:30', 'getReminderTime 21:30');

const loadDays = loaded.getRepeatDaysArray();
assert(loadDays[0] === true && loadDays[1] === false, '周日开，周一关');

// 6. hasCompletedOnboarding / setOnboardingCompleted
async function runAsyncTests() {
  const before = await appSettingsRepository.hasCompletedOnboarding();
  assert(before === false, '初始未完成引导');

  await appSettingsRepository.setOnboardingCompleted();
  const after = await appSettingsRepository.hasCompletedOnboarding();
  assert(after === true, 'setOnboardingCompleted 后已完成');

  // getSettingsOnce 返回 Promise
  const settings = await appSettingsRepository.getSettingsOnce();
  assert(settings && settings.hasCompletedOnboarding === true, 'getSettingsOnce 返回最新设置');

  console.log('\n通过 ' + passed + ' / 失败 ' + failed);
  process.exit(failed > 0 ? 1 : 0);
}

runAsyncTests().catch(err => {
  console.error('异步测试执行失败: ' + err.message);
  console.error(err.stack);
  process.exit(1);
});
