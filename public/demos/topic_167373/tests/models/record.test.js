/**
 * Record 模型单元测试
 * 测试 Bristol 类型、颜色、备注、时间戳等字段校验逻辑
 */

// 模拟 wx 存储 API（如有）
if (typeof wx === 'undefined') {
  global.wx = {
    getStorageSync: () => null,
    setStorageSync: () => {},
    removeStorageSync: () => {},
    showToast: () => {},
    showLoading: () => {},
    hideLoading: () => {},
    getSystemInfoSync: () => ({ platform: 'devtools', version: '2.32.0' })
  };
}

const Record = require('../../data/models/record.js');

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

console.log('\n=== Record 模型测试 ===');

// 1. 必填字段校验
const incomplete = new Record();
assert(incomplete.isValid() === false, '空对象应校验失败');

const noBristol = new Record({ id: '1', color: 'brown', timestamp: Date.now() });
assert(noBristol.isValid() === false, '缺少 bristolType 应校验失败');

const noColor = new Record({ id: '1', bristolType: 4, timestamp: Date.now() });
// color 默认为 'brown'，模型不强制必填，校验依赖 bristolType + timestamp
assert(noColor.isValid() === true, 'color 缺省时仍合法（默认 brown）');

const noTime = new Record({ id: '1', bristolType: 4, color: 'brown' });
assert(noTime.isValid() === false, '缺少 timestamp 应校验失败');

// 2. Bristol 类型范围校验
const valid = new Record({
  id: 'r1',
  bristolType: 4,
  color: 'brown',
  timestamp: Date.now(),
  note: '测试'
});
assert(valid.isValid() === true, '完整数据应校验通过');

// 3. Bristol 类型边界
for (let i = 1; i <= 7; i++) {
  const r = new Record({ bristolType: i, color: 'brown', timestamp: Date.now() });
  assert(r.isValid() === true, 'Bristol 类型 ' + i + ' 应合法');
}

// 4. Bristol 类型越界
const r0 = new Record({ bristolType: 0, color: 'brown', timestamp: Date.now() });
assert(r0.isValid() === false, 'Bristol 类型 0 应非法');
const r8 = new Record({ bristolType: 8, color: 'brown', timestamp: Date.now() });
assert(r8.isValid() === false, 'Bristol 类型 8 应非法');
const rNeg = new Record({ bristolType: -1, color: 'brown', timestamp: Date.now() });
assert(rNeg.isValid() === false, 'Bristol 类型 -1 应非法');

// 5. 默认值
const r = new Record({ bristolType: 4, color: 'brown', timestamp: Date.now() });
assert(r.id === null, 'id 默认为 null (实际: ' + r.id + ')');
assert(typeof r.createdAt === 'number', 'createdAt 默认存在');
assert(typeof r.updatedAt === 'number', 'updatedAt 默认存在');

console.log('\n通过 ' + passed + ' / 失败 ' + failed);
process.exit(failed > 0 ? 1 : 0);
