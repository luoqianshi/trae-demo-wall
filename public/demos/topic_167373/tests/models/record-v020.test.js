/**
 * V0.2.0 升级测试 - Record 模型新增 4 个身体感受字段
 *
 * 验证：
 *  - 默认值正确（painLevel=0, 其余 false）
 *  - 边界值（painLevel 强制 0-3 范围）
 *  - 布尔值归一（true/1 -> true）
 *  - toObject/fromObject 双向序列化保留字段
 *  - 老数据（无 4 字段）反序列化容错
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

const Record = require('../../data/models/record.js');

let passed = 0, failed = 0;
function assert(cond, name) {
  if (cond) { console.log('  ✓ ' + name); passed++; }
  else { console.error('  ✗ ' + name); failed++; }
}

console.log('\n=== V0.2.0 Record 身体感受字段测试 ===');

// 1. 默认值
const r1 = new Record({ bristolType: 4, color: 'brown' });
assert(r1.painLevel === 0, '默认 painLevel = 0');
assert(r1.swelling === false, '默认 swelling = false');
assert(r1.residue === false, '默认 residue = false');
assert(r1.unfinished === false, '默认 unfinished = false');

// 2. painLevel 范围强制
const r2 = new Record({ painLevel: 5 });
assert(r2.painLevel === 3, 'painLevel=5 强制为 3');
const r3 = new Record({ painLevel: -2 });
assert(r3.painLevel === 0, 'painLevel=-2 强制为 0');
const r4 = new Record({ painLevel: 1.7 });
assert(r4.painLevel === 1, 'painLevel=1.7 取整为 1');

// 3. 布尔值归一
const r5 = new Record({ swelling: 1, residue: 0, unfinished: true });
assert(r5.swelling === true, 'swelling=1 -> true');
assert(r5.residue === false, 'residue=0 -> false');
assert(r5.unfinished === true, 'unfinished=true -> true');

// 4. toObject 保留 4 字段
const r6 = new Record({ bristolType: 3, color: 'yellow', painLevel: 2, swelling: true, residue: false, unfinished: true });
const obj = r6.toObject();
assert(obj.painLevel === 2, 'toObject 保留 painLevel');
assert(obj.swelling === true, 'toObject 保留 swelling');
assert(obj.residue === false, 'toObject 保留 residue');
assert(obj.unfinished === true, 'toObject 保留 unfinished');

// 5. fromObject 老数据兼容（无 4 字段）
const r7 = Record.fromObject({ id: 'old-1', bristolType: 4, color: 'brown', timestamp: Date.now() });
assert(r7 && r7.painLevel === 0, '老数据 painLevel 默认为 0');
assert(r7 && r7.swelling === false, '老数据 swelling 默认为 false');
assert(r7 && r7.residue === false, '老数据 residue 默认为 false');
assert(r7 && r7.unfinished === false, '老数据 unfinished 默认为 false');

// 6. fromObject 新数据保留
const r8 = Record.fromObject({ id: 'new-1', bristolType: 4, color: 'brown', painLevel: 1, swelling: true, residue: true, unfinished: true });
assert(r8 && r8.painLevel === 1, '新数据 painLevel 保留');
assert(r8 && r8.swelling === true, '新数据 swelling 保留');
assert(r8 && r8.residue === true, '新数据 residue 保留');
assert(r8 && r8.unfinished === true, '新数据 unfinished 保留');

// 7. null/undefined 参数容错
const r9 = new Record();
assert(r9.painLevel === 0, '无参数 painLevel 默认为 0');
assert(r9.swelling === false, '无参数 swelling 默认为 false');

console.log(`\n通过 ${passed} / 失败 ${failed}`);
process.exit(failed > 0 ? 1 : 0);
