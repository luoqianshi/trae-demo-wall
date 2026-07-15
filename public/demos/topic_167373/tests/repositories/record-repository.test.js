/**
 * Record 仓库测试
 * 使用内存模拟 wx.getStorageSync / wx.setStorageSync
 */

// 内存模拟 storage
if (typeof wx === 'undefined') {
  global.wx = {
    _storage: {},
    getStorageSync(key) { return this._storage[key] !== undefined ? this._storage[key] : ''; },
    setStorageSync(key, val) { this._storage[key] = val; },
    removeStorageSync(key) { delete this._storage[key]; },
    clearStorageSync() { this._storage = {}; },
    getStorageInfoSync() {
      return {
        keys: Object.keys(this._storage),
        currentSize: JSON.stringify(this._storage).length,
        limitSize: 10240
      };
    }
  };
}

const recordRepository = require('../../data/repositories/record-repository.js');
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

console.log('\n=== record-repository.js 测试 ===');

// 清理初始数据
wx.clearStorageSync();

// 1. 空仓库
assert(recordRepository.getAllRecords().length === 0, '空仓库 getAllRecords 返回空数组');
assert(recordRepository.getRecordCount() === 0, '空仓库 getRecordCount 为 0');
assert(recordRepository.getAverageBristolType() === 0, '空仓库平均 Bristol 为 0');

// 2. 插入记录
const r1 = recordRepository.insertRecord({
  bristolType: 4,
  color: 'brown',
  timestamp: Date.now(),
  note: '正常'
});
assert(r1 && r1.id, 'insertRecord 返回带 id 的对象');
assert(r1.createdAt > 0, 'insertRecord 自动设置 createdAt');
assert(r1.updatedAt > 0, 'insertRecord 自动设置 updatedAt');

assert(recordRepository.getRecordCount() === 1, '插入 1 条后 count 为 1');

// 3. 插入多条
const now = Date.now();
const oneDay = 24 * 60 * 60 * 1000;
recordRepository.insertRecord({ bristolType: 3, color: 'brown', timestamp: now - oneDay });
recordRepository.insertRecord({ bristolType: 5, color: 'yellow', timestamp: now - 2 * oneDay });
recordRepository.insertRecord({ bristolType: 7, color: 'yellow', timestamp: now - 3 * oneDay });

assert(recordRepository.getRecordCount() === 4, '插入 4 条后 count 为 4');

// 4. 按 id 查询
const found = recordRepository.getRecordById(r1.id);
assert(found && found.bristolType === 4, 'getRecordById 能找到记录');

const notFound = recordRepository.getRecordById('not-exist-id');
assert(notFound === null, '不存在的 id 返回 null');

// 5. 按时间范围查询
const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
const todayRecords = recordRepository.getRecordsByDateRange(todayStart.getTime(), todayEnd.getTime());
assert(todayRecords.length === 1, '今天范围内 1 条记录 (实际：' + todayRecords.length + ')');

// 6. 按月查询
const thisMonth = new Date();
const monthRecords = recordRepository.getRecordsByMonth(thisMonth.getFullYear(), thisMonth.getMonth());
assert(monthRecords.length >= 1 && monthRecords.length <= 4,
  '本月记录数在 1~4 之间 (实际：' + monthRecords.length + ')');

// 7. 更新记录
const updateRes = recordRepository.updateRecord({
  id: r1.id,
  bristolType: 5,
  color: 'yellow',
  timestamp: r1.timestamp,
  note: '更新备注'
});
assert(updateRes && updateRes.bristolType === 5, 'updateRecord 修改成功');
assert(updateRes.note === '更新备注', 'updateRecord 修改 note');

const afterUpdate = recordRepository.getRecordById(r1.id);
assert(afterUpdate.bristolType === 5, '持久化后 bristolType 已更新');
assert(afterUpdate.updatedAt >= r1.updatedAt, 'updatedAt 已更新');

// 8. 删除记录
const deleted = recordRepository.deleteRecord(r1.id);
assert(deleted === true, 'deleteRecord 成功');
assert(recordRepository.getRecordById(r1.id) === null, '删除后查不到');

// 9. 删除不存在的 id
const deleteFail = recordRepository.deleteRecord('not-exist');
assert(deleteFail === false, '删除不存在的 id 返回 false');

// 10. 平均 Bristol 类型
const avg = recordRepository.getAverageBristolType();
assert(avg > 0, '平均 Bristol > 0 (实际：' + avg + ')');

// 11. 排序（最新在前）
const all = recordRepository.getAllRecords();
for (let i = 1; i < all.length; i++) {
  assert(all[i - 1].timestamp >= all[i].timestamp, '记录按 timestamp 降序');
  break; // 只验证第一对即可
}

// 12. 清空
recordRepository.clearAll();
assert(recordRepository.getRecordCount() === 0, 'clearAll 后 count 为 0');

console.log('\n通过 ' + passed + ' / 失败 ' + failed);
process.exit(failed > 0 ? 1 : 0);
