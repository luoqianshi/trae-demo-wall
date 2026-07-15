/**
 * Storage Manager 测试
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

const storageManager = require('../../data/storage/storage-manager.js');
const STORAGE_KEYS = require('../../data/storage/storage-keys.js');

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

console.log('\n=== storage-manager 测试 ===');

wx.clearStorageSync();

// 1. 初始化
storageManager.init();
assert(storageManager.initialized === true, 'init 后 initialized = true');

// 2. set / get
const ok = storageManager.set('foo', { a: 1 });
assert(ok === true, 'set 返回 true');

const got = storageManager.get('foo');
assert(got && got.a === 1, 'get 返回原值');

// 3. get 不存在返回 default
const def = storageManager.get('not-exist', 'default');
assert(def === 'default', 'get 不存在 key 返回默认值');

// 4. get 空字符串返回 default
storageManager.set('empty', '');
const empty = storageManager.get('empty', 'fallback');
assert(empty === 'fallback', 'get 空字符串返回默认值');

// 5. get null / undefined 返回 default
storageManager.set('nullVal', null);
const nullRes = storageManager.get('nullVal', 'fb');
assert(nullRes === 'fb', 'get null 返回默认值');

// 6. remove
storageManager.set('tmp', 'value');
const removed = storageManager.remove('tmp');
assert(removed === true, 'remove 返回 true');
assert(storageManager.get('tmp', 'gone') === 'gone', 'remove 后不存在');

// 7. clear
storageManager.set('a', 1);
storageManager.set('b', 2);
storageManager.clear();
assert(storageManager.get('a', 'x') === 'x', 'clear 后 a 丢失');
assert(storageManager.get('b', 'x') === 'x', 'clear 后 b 丢失');

// 8. getInfo
storageManager.set('c', 1);
const info = storageManager.getInfo();
assert(Array.isArray(info.keys) && info.keys.length >= 1, 'getInfo 返回 keys 数组');
assert(info.keys.indexOf('c') >= 0, 'getInfo 包含已存储的 key');
assert(info.initialized === true, 'getInfo 返回 initialized');

// 9. 存储 key 常量
assert(STORAGE_KEYS.RECORDS === 'pt_records', 'RECORDS key 正确');
assert(STORAGE_KEYS.USER_PROFILE === 'pt_user_profile', 'USER_PROFILE key 正确');
assert(STORAGE_KEYS.APP_SETTINGS === 'pt_app_settings', 'APP_SETTINGS key 正确');

// 10. set 空 key 返回 false
assert(storageManager.set('', 'value') === false, 'set 空 key 返回 false');
assert(storageManager.get('', 'fb') === 'fb', 'get 空 key 返回默认值');

console.log('\n通过 ' + passed + ' / 失败 ' + failed);
process.exit(failed > 0 ? 1 : 0);
