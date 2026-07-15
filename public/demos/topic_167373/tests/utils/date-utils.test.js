/**
 * 日期工具测试
 */

const dateUtils = require('../../utils/date-utils.js');

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

console.log('\n=== date-utils.js 测试 ===');

// 1. formatDate
const ts = new Date('2026-07-02T14:30:00').getTime();
const formatted = dateUtils.formatDate(ts);
assert(typeof formatted === 'string' && formatted.length > 0, 'formatDate 返回字符串');
assert(/^\d{4}-\d{2}-\d{2}/.test(formatted), 'formatDate 包含 YYYY-MM-DD 前缀');

// 2. isToday（签名：isToday(year, month, day)）
const nowDate = new Date();
const isTodayNow = dateUtils.isToday(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate());
assert(isTodayNow === true, '今天 isToday 为 true');
const isTodayYesterday = dateUtils.isToday(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate() - 1);
assert(isTodayYesterday === false, '昨天 isToday 为 false');

// 3. isSameDay
const morning = new Date('2026-07-02T08:00:00').getTime();
const evening = new Date('2026-07-02T22:00:00').getTime();
const nextDay = new Date('2026-07-03T00:00:00').getTime();
assert(dateUtils.isSameDay(morning, evening) === true, '同一天不同时间 isSameDay 为 true');
assert(dateUtils.isSameDay(morning, nextDay) === false, '相邻天 isSameDay 为 false');

// 4. getStartOfToday / getEndOfToday
const start = dateUtils.getStartOfToday();
const end = dateUtils.getEndOfToday();
assert(start < end, 'getStartOfToday 早于 getEndOfToday');
const startDate = new Date(start);
assert(startDate.getHours() === 0 && startDate.getMinutes() === 0, 'start 时间为 00:00');
const endDate = new Date(end);
assert(endDate.getHours() === 23, 'end 时间为 23:xx');

// 5. getMonthDays
const cells = dateUtils.getMonthDays(2026, 6); // 2026年7月，0-indexed
assert(Array.isArray(cells), 'getMonthDays 返回数组');
assert(cells.length === 42, '日历网格固定 42 个单元格 (6行 x 7列)');
const firstCell = cells[0];
assert(typeof firstCell.year === 'number', '单元格包含 year 字段');
assert(typeof firstCell.month === 'number', '单元格包含 month 字段');
assert(typeof firstCell.day === 'number', '单元格包含 day 字段');
assert(typeof firstCell.isCurrentMonth === 'boolean', '单元格包含 isCurrentMonth 字段');

// 验证 7 月第一天是周三（2026-07-01 是星期三，getMonth() 返回 6）
const july1 = cells.find(c => c.year === 2026 && c.month === 6 && c.day === 1);
assert(july1 !== undefined, '能找到 2026-07-01');
// 周三位于第 4 个位置（周日=0，周三=3）
assert(july1 && cells.indexOf(july1) === 3, '2026-07-01 位于第 4 格（周三）');

// 6. getStartOfMonth / getEndOfMonth
const monthStart = dateUtils.getStartOfMonth(2026, 6);
const monthEnd = dateUtils.getEndOfMonth(2026, 6);
assert(monthStart < monthEnd, '月份 start < end');

// 6. getWeekStart
const weekStart = dateUtils.getWeekStart();
assert(typeof weekStart === 'number', 'getWeekStart 返回 number');

console.log('\n通过 ' + passed + ' / 失败 ' + failed);
process.exit(failed > 0 ? 1 : 0);
