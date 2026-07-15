/**
 * 健康分析器测试
 */

const healthAnalyzer = require('../../utils/health-analyzer.js');

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

console.log('\n=== health-analyzer.js 测试 ===');

// 1. 空数据容错
const emptyFreq = healthAnalyzer.getThisWeekFrequency([]);
assert(emptyFreq === 0, '空数据 getThisWeekFrequency 返回 0');

const emptyDist = healthAnalyzer.getBristolDistribution([]);
assert(typeof emptyDist === 'object', '空数据 getBristolDistribution 返回对象');

const emptyAnalysis = healthAnalyzer.getHealthAnalysis([]);
assert(emptyAnalysis && typeof emptyAnalysis.status === 'string',
  '空数据 getHealthAnalysis 返回默认结果');

const emptyAvg = healthAnalyzer.getAverageBristolType([]);
assert(emptyAvg === 0 || emptyAvg === null, '空数据 getAverageBristolType 返回 0 或 null');

// 3. 数据构造：模拟本周内的 5 条记录
const now = Date.now();
const oneDay = 24 * 60 * 60 * 1000;
const sampleRecords = [
  { timestamp: now, bristolType: 4, color: 'brown' },
  { timestamp: now - oneDay, bristolType: 4, color: 'brown' },
  { timestamp: now - 2 * oneDay, bristolType: 3, color: 'brown' },
  { timestamp: now - 3 * oneDay, bristolType: 4, color: 'brown' },
  { timestamp: now - 4 * oneDay, bristolType: 5, color: 'yellow' }
];

// 3. 本周频率（应至少包含最近几天的记录）
const freq = healthAnalyzer.getThisWeekFrequency(sampleRecords);
assert(freq >= 3 && freq <= 5,
  '本周至少 3 条记录 (实际：' + freq + '，说明：根据 getWeekStart 实现)');

// 4. Bristol 分布
const dist = healthAnalyzer.getBristolDistribution(sampleRecords);
assert(dist[3] === 1, 'Bristol 3 出现 1 次');
assert(dist[4] === 3, 'Bristol 4 出现 3 次');
assert(dist[5] === 1, 'Bristol 5 出现 1 次');

// 5. 平均 Bristol 类型
const avg = healthAnalyzer.getAverageBristolType(sampleRecords);
assert(avg >= 3.5 && avg <= 4.5, '平均 Bristol 类型约等于 4 (实际：' + avg + ')');

// 6. 健康分析
const analysis = healthAnalyzer.getHealthAnalysis(sampleRecords);
assert(analysis && analysis.status, '健康分析返回 status');
assert(analysis && analysis.color, '健康分析返回 color');
assert(analysis && analysis.advice, '健康分析返回 advice');

// 7. 边界：100% 正常记录
const allNormal = [
  { timestamp: now, bristolType: 4, color: 'brown' },
  { timestamp: now - oneDay, bristolType: 3, color: 'brown' },
  { timestamp: now - 2 * oneDay, bristolType: 4, color: 'brown' },
  { timestamp: now - 3 * oneDay, bristolType: 5, color: 'yellow' }
];
const normalAnalysis = healthAnalyzer.getHealthAnalysis(allNormal);
assert(normalAnalysis.status === '正常' || normalAnalysis.status === '健康' || normalAnalysis.status.indexOf('正常') >= 0,
  'Bristol 3-5 范围应判定为正常 (实际：' + normalAnalysis.status + ')');

// 8. 边界：包含严重便秘记录
const constipated = [
  { timestamp: now, bristolType: 1, color: 'brown' },
  { timestamp: now - oneDay, bristolType: 1, color: 'brown' }
];
const constAnalysis = healthAnalyzer.getHealthAnalysis(constipated);
assert(constAnalysis && constAnalysis.status, '便秘分析有 status (实际：' + constAnalysis.status + ')');

// 9. 边界：包含腹泻记录
const diarrhea = [
  { timestamp: now, bristolType: 7, color: 'yellow' },
  { timestamp: now - oneDay, bristolType: 6, color: 'yellow' }
];
const diarAnalysis = healthAnalyzer.getHealthAnalysis(diarrhea);
assert(diarAnalysis && diarAnalysis.status, '腹泻分析有 status (实际：' + diarAnalysis.status + ')');

// 10. getRecentRecords
const recent = healthAnalyzer.getRecentRecords(sampleRecords, 3);
assert(Array.isArray(recent), 'getRecentRecords 返回数组');
assert(recent.length === 3, 'getRecentRecords 限制 3 条 (实际：' + recent.length + ')');

// 11. PT-mp-009 回归：跨月混合数据，本周次数只算本周
const nowMs = Date.now();
const lastMonth = new Date();
lastMonth.setMonth(lastMonth.getMonth() - 1);
lastMonth.setDate(15);
lastMonth.setHours(10, 0, 0, 0);
const olderThanWeek = new Date();
olderThanWeek.setDate(olderThanWeek.getDate() - 10);
olderThanWeek.setHours(10, 0, 0, 0);
const mixed = [
  { timestamp: lastMonth.getTime(), bristolType: 4, color: 'brown' }, // 上月 → 不算本周
  { timestamp: olderThanWeek.getTime(), bristolType: 4, color: 'brown' }, // 10 天前 → 不算本周
  { timestamp: nowMs, bristolType: 4, color: 'brown' }, // 今天 → 算本周
  { timestamp: nowMs - 24 * 60 * 60 * 1000, bristolType: 4, color: 'brown' } // 昨天 → 算本周
];
const mixedWeekFreq = healthAnalyzer.getThisWeekFrequency(mixed);
assert(mixedWeekFreq === 2, '跨月数据本周次数=2 (实际：' + mixedWeekFreq + ')');
assert(mixedWeekFreq !== mixed.length, '本周次数不等于总记录数');

// 12. PT-mp-009 防御：timestamp 为字符串也不能误算
const stringTsRecords = [
  { timestamp: String(nowMs), bristolType: 4, color: 'brown' },
  { timestamp: String(lastMonth.getTime()), bristolType: 4, color: 'brown' }
];
const strTsFreq = healthAnalyzer.getThisWeekFrequency(stringTsRecords);
assert(strTsFreq === 1, '字符串 timestamp 本周次数=1 (实际：' + strTsFreq + ')');

// 13. PT-mp-009 防御：空数组 / null 不崩
assert(healthAnalyzer.getThisWeekFrequency(null) === 0, 'null 本周次数=0');
assert(healthAnalyzer.getThisWeekFrequency(undefined) === 0, 'undefined 本周次数=0');
assert(healthAnalyzer.getThisMonthRecords(null).length === 0, 'null 本月条数=0');

// 14. getRecentRecords 防御字符串 timestamp
const strRecent = healthAnalyzer.getRecentRecords(stringTsRecords, 5);
assert(strRecent.length === 2, '字符串 timestamp getRecentRecords 返回 2 条');

// 15. PT-mp-insights-001：分层洞察 - 0 条记录也返回非 null 健康分析
const a0 = healthAnalyzer.getHealthAnalysis([]);
assert(a0 && a0.status === '等待记录', '0 条记录 status="等待记录"');
assert(a0.level === 'empty', '0 条记录 level=empty');

// 16. 1 条记录
const a1 = healthAnalyzer.getHealthAnalysis([
  { bristolType: 4, color: 'brown', timestamp: Date.now() }
]);
assert(a1.status.indexOf('已记录 1') >= 0, '1 条记录 status 含"已记录 1"');
assert(a1.level === 'insufficient', '1 条记录 level=insufficient');

// 17. 2 条记录
const a2 = healthAnalyzer.getHealthAnalysis([
  { bristolType: 4, color: 'brown', timestamp: Date.now() - 86400000 },
  { bristolType: 4, color: 'brown', timestamp: Date.now() }
]);
assert(a2.status.indexOf('已记录 2') >= 0, '2 条记录 status 含"已记录 2"');
assert(a2.level === 'insufficient', '2 条记录 level=insufficient');

// 18. 3 条及以上：进入分析模式
const a3 = healthAnalyzer.getHealthAnalysis([
  { bristolType: 4, color: 'brown', timestamp: Date.now() - 2 * 86400000 },
  { bristolType: 4, color: 'brown', timestamp: Date.now() - 86400000 },
  { bristolType: 4, color: 'brown', timestamp: Date.now() }
]);
assert(a3 && typeof a3.status === 'string', '3 条记录仍返回非 null 分析');
assert(['good', 'warning', 'alert'].indexOf(a3.level) >= 0, '3 条记录 level 属于 good/warning/alert');

// 19. null/undefined 输入不崩
assert(healthAnalyzer.getHealthAnalysis(null) && healthAnalyzer.getHealthAnalysis(null).level === 'empty', 'null 输入返回 empty 等级');
assert(healthAnalyzer.getHealthAnalysis(undefined) && healthAnalyzer.getHealthAnalysis(undefined).level === 'empty', 'undefined 输入返回 empty 等级');

// 20. 全部返回值都包含 level 字段
[0, 1, 2, 3, 5, 10].forEach(n => {
  const arr = [];
  for (let i = 0; i < n; i++) arr.push({ bristolType: 4, color: 'brown', timestamp: Date.now() - i * 86400000 });
  const a = healthAnalyzer.getHealthAnalysis(arr);
  assert(a && a.level, 'n=' + n + ' 时 level 字段存在');
});

console.log('\n通过 ' + passed + ' / 失败 ' + failed);
process.exit(failed > 0 ? 1 : 0);
