/**
 * record-repository 修复后的回归测试
 * 覆盖：
 * - getRecordById 接受完整字符串 ID（PT-mp-004/005 主路径）
 * - getRecordById 兼容 parseInt 截断的 ID（防御性兜底：按 timestamp 选最接近的）
 * - deleteRecord 删一条不多删（防误删关键回归）
 * - getAllRecords 自动按 timestamp 降序
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

const recordRepository = require('../../data/repositories/record-repository.js');

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

console.log('\n=== record-repository 回归测试 ===');

wx.clearStorageSync();

// 1. 插入 3 条记录
const r1 = recordRepository.insertRecord({ bristolType: 4, color: 'brown', timestamp: 1000 });
const r2 = recordRepository.insertRecord({ bristolType: 5, color: 'yellow', timestamp: 2000 });
const r3 = recordRepository.insertRecord({ bristolType: 6, color: 'green', timestamp: 3000 });

assert(typeof r1.id === 'string' && r1.id.indexOf('_') > 0, '插入的 id 格式为 "ts_xxx"');

// 2. 用完整字符串 id 查找（PT-mp-004/005 主路径）
const a1 = recordRepository.getRecordById(r1.id);
assert(a1 !== null && a1.bristolType === 4, '用完整字符串 id 找到 r1');

// 3. 防御性兜底：用 parseInt 后的数字 ID（截断了 _xxx）能找到 timestamp 最接近的记录
const numericId = parseInt(r1.id, 10);
const a2 = recordRepository.getRecordById(numericId);
assert(a2 !== null, 'parseInt 后纯数字 ID 也能找到记录（防御性兜底）');

// 4. String(numericId) 也能找到
const a3 = recordRepository.getRecordById(String(numericId));
assert(a3 !== null, 'String(numericId) 也能找到');

// 5. 不存在的 id
const a4 = recordRepository.getRecordById('not-exist-id');
assert(a4 === null, '不存在的 id 返回 null');

const a5 = recordRepository.getRecordById(999999999999);
assert(a5 === null, '不存在的数字 id 返回 null');

// 6. 关键回归：删除单条记录，不误删其他
const delResult = recordRepository.deleteRecord(r2.id);
assert(delResult === true, '用完整字符串 id 删除 r2 成功');
assert(recordRepository.getRecordById(r2.id) === null, 'r2 已删除');

// 7. 删除后剩 2 条（绝不能误删 r1/r3）
const all = recordRepository.getAllRecords();
assert(all.length === 2, '删除后剩 2 条 (实际：' + all.length + ')');
if (all.length >= 2) {
  assert(all[0].timestamp >= all[1].timestamp, '记录按 timestamp 降序');
}

// 8. 验证剩的是 r1 和 r3
const ids = all.map(r => r.id).sort();
const expected = [r1.id, r3.id].sort();
assert(JSON.stringify(ids) === JSON.stringify(expected), '剩下的是 r1 和 r3');

// 9. 用 parseInt 删除 r3（PT-mp-004/005 旧调用方路径）
const delByNum = recordRepository.deleteRecord(parseInt(r3.id, 10));
assert(delByNum === true, 'parseInt 后的数字 ID 也能删除 r3');
const all2 = recordRepository.getAllRecords();
assert(all2.length === 1, '删除后剩 1 条 (实际：' + all2.length + ')');
assert(all2[0].id === r1.id, '剩下的是 r1');

// 10. 不存在的数字 id 返回 false（不误删）
const delNonexist = recordRepository.deleteRecord(999999999999);
assert(delNonexist === false, '删除不存在的数字 id 返回 false');

// 11. 完整字符串 id 仍能删除
const r6 = recordRepository.insertRecord({ bristolType: 1, color: 'black', timestamp: 9000 });
const delExact = recordRepository.deleteRecord(r6.id);
assert(delExact === true, '完整字符串 id 删除成功');
const all3 = recordRepository.getAllRecords();
assert(!all3.find(r => r.id === r6.id), 'r6 已从列表移除');

// 12. insertRecord 后不同 id
const r7 = recordRepository.insertRecord({ bristolType: 3, color: 'brown', timestamp: 10000 });
const r8 = recordRepository.insertRecord({ bristolType: 2, color: 'black', timestamp: 10000 });
assert(r7.id !== r8.id, '同时间戳不同 id');

// 13. updateRecord
const updated = recordRepository.updateRecord({
  id: r1.id,
  bristolType: 7,
  color: 'red',
  timestamp: r1.timestamp,
  note: 'updated'
});
assert(updated && updated.bristolType === 7, 'updateRecord 修改 bristolType');
assert(updated && updated.note === 'updated', 'updateRecord 修改 note');
const after = recordRepository.getRecordById(r1.id);
assert(after && after.bristolType === 7, 'updateRecord 持久化');

console.log('\n通过 ' + passed + ' / 失败 ' + failed);
process.exit(failed > 0 ? 1 : 0);
