/**
 * V0.2.0 升级测试 - 健康分析加入身体感受阈值
 *
 * 验证：
 *  - 中度以上疼痛（painLevel>=2）出现 ≥2 次 → "请关注"
 *  - 腹胀/残留/排不尽 任一 ≥50% → "建议关注"
 *  - t6/t7 + 疼痛 >= 1 → "请关注"
 *  - countTrue 工具函数
 *  - 老数据（无 4 字段）不误判
 */

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

const { getHealthAnalysis, countTrue } = require('../../utils/health-analyzer.js');

let passed = 0, failed = 0;
function assert(cond, name) {
  if (cond) { console.log('  ✓ ' + name); passed++; }
  else { console.error('  ✗ ' + name); failed++; }
}

console.log('\n=== V0.2.0 健康分析身体感受阈值测试 ===');

// 1. countTrue 工具
assert(countTrue([], 'painLevel') === 0, '空数组 countTrue = 0');
assert(countTrue([{ painLevel: 2 }, { painLevel: 3 }], 'painLevel') === 0, 'painLevel 不在 countTrue 字段中（仅当值=1 才误计）');
assert(countTrue([{ swelling: true }, { swelling: 1 }, { swelling: false }], 'swelling') === 2, 'countTrue(swelling) = 2');
assert(countTrue([{ swelling: false }, { swelling: 0 }], 'swelling') === 0, 'countTrue 全 false = 0');
assert(countTrue(null, 'swelling') === 0, 'null 容错');

// 2. 严重疼痛 2 次 → "请关注"
const recs1 = [
  { bristolType: 4, color: 'brown', painLevel: 3, swelling: false, residue: false, unfinished: false, timestamp: Date.now() },
  { bristolType: 4, color: 'brown', painLevel: 2, swelling: false, residue: false, unfinished: false, timestamp: Date.now() - 86400000 },
  { bristolType: 4, color: 'brown', painLevel: 0, swelling: false, residue: false, unfinished: false, timestamp: Date.now() - 172800000 }
];
const a1 = getHealthAnalysis(recs1);
assert(a1.level === 'alert', '严重疼痛 2 次 -> alert');
assert(a1.status === '请关注', '严重疼痛 2 次 -> "请关注"');

// 3. 腹胀 ≥50% → "建议关注"
const recs2 = [
  { bristolType: 4, color: 'brown', painLevel: 0, swelling: true, residue: false, unfinished: false, timestamp: Date.now() },
  { bristolType: 4, color: 'brown', painLevel: 0, swelling: true, residue: false, unfinished: false, timestamp: Date.now() - 86400000 },
  { bristolType: 4, color: 'brown', painLevel: 0, swelling: false, residue: false, unfinished: false, timestamp: Date.now() - 172800000 }
];
const a2 = getHealthAnalysis(recs2);
assert(a2.level === 'warning', '腹胀 2/3 -> warning');
assert(a2.status === '建议关注', '腹胀 -> "建议关注"');

// 4. 水样 + 疼痛 → "请关注"
const recs3 = [
  { bristolType: 7, color: 'yellow', painLevel: 1, swelling: false, residue: false, unfinished: false, timestamp: Date.now() },
  { bristolType: 4, color: 'brown', painLevel: 0, swelling: false, residue: false, unfinished: false, timestamp: Date.now() - 86400000 },
  { bristolType: 4, color: 'brown', painLevel: 0, swelling: false, residue: false, unfinished: false, timestamp: Date.now() - 172800000 }
];
const a3 = getHealthAnalysis(recs3);
assert(a3.level === 'alert', 't7+疼痛 -> alert');

// 5. 残留感 ≥50% → "建议关注"
const recs4 = [
  { bristolType: 4, color: 'brown', painLevel: 0, swelling: false, residue: true, unfinished: false, timestamp: Date.now() },
  { bristolType: 4, color: 'brown', painLevel: 0, swelling: false, residue: true, unfinished: false, timestamp: Date.now() - 86400000 },
  { bristolType: 4, color: 'brown', painLevel: 0, swelling: false, residue: false, unfinished: false, timestamp: Date.now() - 172800000 }
];
const a4 = getHealthAnalysis(recs4);
assert(a4.level === 'warning', '残留感 2/3 -> warning');

// 6. 排不尽 ≥50% → "建议关注"
const recs5 = [
  { bristolType: 4, color: 'brown', painLevel: 0, swelling: false, residue: false, unfinished: true, timestamp: Date.now() },
  { bristolType: 4, color: 'brown', painLevel: 0, swelling: false, residue: false, unfinished: true, timestamp: Date.now() - 86400000 },
  { bristolType: 4, color: 'brown', painLevel: 0, swelling: false, residue: false, unfinished: false, timestamp: Date.now() - 172800000 }
];
const a5 = getHealthAnalysis(recs5);
assert(a5.level === 'warning', '排不尽 2/3 -> warning');

// 7. 老数据（无 4 字段）不误判
const recs6 = [
  { bristolType: 4, color: 'brown', timestamp: Date.now() },
  { bristolType: 4, color: 'brown', timestamp: Date.now() - 86400000 },
  { bristolType: 4, color: 'brown', timestamp: Date.now() - 172800000 }
];
const a6 = getHealthAnalysis(recs6);
assert(a6.level !== 'alert' && a6.level !== 'warning', '老数据不误判为异常');

// 8. 全无痛无感受 → 正常
const recs7 = [
  { bristolType: 4, color: 'brown', painLevel: 0, swelling: false, residue: false, unfinished: false, timestamp: Date.now() },
  { bristolType: 4, color: 'brown', painLevel: 0, swelling: false, residue: false, unfinished: false, timestamp: Date.now() - 86400000 },
  { bristolType: 4, color: 'brown', painLevel: 0, swelling: false, residue: false, unfinished: false, timestamp: Date.now() - 172800000 }
];
const a7 = getHealthAnalysis(recs7);
assert(a7.level === 'good', '全无感受 -> good');

console.log(`\n通过 ${passed} / 失败 ${failed}`);
process.exit(failed > 0 ? 1 : 0);
