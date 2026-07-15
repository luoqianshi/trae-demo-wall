/**
 * AppSettings 模型测试 - 覆盖新增引导字段
 * 修复 PT-mp-welcome-001：hasAcceptedTerms/hasAcceptedDisclaimer/hasSeenFabHint 字段
 */

if (typeof wx === 'undefined') {
  global.wx = {
    _storage: {},
    getStorageSync(k) { return this._storage[k] !== undefined ? this._storage[k] : ''; },
    setStorageSync(k, v) { this._storage[k] = v; },
    removeStorageSync(k) { delete this._storage[k]; },
    clearStorageSync() { this._storage = {}; },
    getStorageInfoSync() { return { keys: Object.keys(this._storage), currentSize: 0, limitSize: 10240 }; }
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

console.log('\n=== AppSettings 引导字段测试 ===');

wx.clearStorageSync();

// 1. 默认设置：未勾选任何条款
const defaults = AppSettings.fromObject(null);
assert(defaults.hasCompletedOnboarding === false, '默认 hasCompletedOnboarding=false');
assert(defaults.hasAcceptedTerms === false, '默认 hasAcceptedTerms=false');
assert(defaults.hasAcceptedDisclaimer === false, '默认 hasAcceptedDisclaimer=false');
assert(defaults.hasSeenFabHint === false, '默认 hasSeenFabHint=false');

// 2. fromObject 接受部分字段：未提供的字段使用默认值
const partial = AppSettings.fromObject({ hasAcceptedTerms: true });
assert(partial.hasAcceptedTerms === true, '部分对象 hasAcceptedTerms=true');
assert(partial.hasAcceptedDisclaimer === false, '未提供 hasAcceptedDisclaimer 走默认值 false');
assert(partial.hasSeenFabHint === false, '未提供 hasSeenFabHint 走默认值 false');

// 3. toObject 包含所有字段
const full = new AppSettings({});
const obj = full.toObject();
assert('hasCompletedOnboarding' in obj, 'toObject 包含 hasCompletedOnboarding');
assert('hasAcceptedTerms' in obj, 'toObject 包含 hasAcceptedTerms');
assert('hasAcceptedDisclaimer' in obj, 'toObject 包含 hasAcceptedDisclaimer');
assert('hasSeenFabHint' in obj, 'toObject 包含 hasSeenFabHint');

// 4. 仓库 getSettings 返回 AppSettings 实例
const got = appSettingsRepository.getSettings();
assert(got instanceof AppSettings, 'getSettings 返回 AppSettings 实例');
assert(got.hasAcceptedTerms === false, 'getSettings hasAcceptedTerms 默认 false');
assert(got.hasAcceptedDisclaimer === false, 'getSettings hasAcceptedDisclaimer 默认 false');

// 5. 保存勾选状态
const s = appSettingsRepository.getSettings();
s.hasAcceptedTerms = true;
s.hasAcceptedDisclaimer = true;
s.hasCompletedOnboarding = true;
appSettingsRepository.saveSettings(s);

const reloaded = appSettingsRepository.getSettings();
assert(reloaded.hasAcceptedTerms === true, '持久化 hasAcceptedTerms=true');
assert(reloaded.hasAcceptedDisclaimer === true, '持久化 hasAcceptedDisclaimer=true');
assert(reloaded.hasCompletedOnboarding === true, '持久化 hasCompletedOnboarding=true');

// 6. hasSeenFabHint 流程模拟
wx.clearStorageSync();
const s2 = appSettingsRepository.getSettings();
assert(s2.hasSeenFabHint === false, '初始 hasSeenFabHint=false');
s2.hasSeenFabHint = true;
appSettingsRepository.saveSettings(s2);
const reloaded2 = appSettingsRepository.getSettings();
assert(reloaded2.hasSeenFabHint === true, '关闭 FAB 气泡后 hasSeenFabHint=true');

console.log('\n通过 ' + passed + ' / 失败 ' + failed);
process.exit(failed > 0 ? 1 : 0);
