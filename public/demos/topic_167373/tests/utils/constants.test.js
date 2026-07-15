/**
 * Bristol 常量与健康判断测试
 */

const constants = require('../../utils/constants.js');

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

console.log('\n=== constants.js 测试 ===');

// 1. BRISTOL_TYPES 完整性
assert(Array.isArray(constants.BRISTOL_TYPES), 'BRISTOL_TYPES 是数组');
assert(constants.BRISTOL_TYPES.length === 7, 'BRISTOL_TYPES 包含 7 个类型');

constants.BRISTOL_TYPES.forEach((item, idx) => {
  assert(item.type === idx + 1, '类型 ' + (idx + 1) + ' 的 type 字段正确');
  assert(typeof item.name === 'string' && item.name.length > 0, '类型 ' + (idx + 1) + ' 有名称');
  assert(typeof item.shortDesc === 'string' && item.shortDesc.length > 0, '类型 ' + (idx + 1) + ' 有简短描述');
});

// 2. BRISTOL_COLORS 完整性
assert(typeof constants.BRISTOL_COLORS === 'object', 'BRISTOL_COLORS 是对象');
for (let i = 1; i <= 7; i++) {
  const color = constants.BRISTOL_COLORS[i];
  assert(typeof color === 'string' && color.startsWith('#'), 'Bristol ' + i + ' 颜色为 hex 字符串');
}

// 3. getBristolHealthStatus 逻辑
const r1 = constants.getBristolHealthStatus(1);
assert(r1 && typeof r1.status === 'string', '类型 1 健康判断返回 status');
assert(r1 && typeof r1.color === 'string', '类型 1 健康判断返回 color');
assert(r1 && typeof r1.advice === 'string', '类型 1 健康判断返回 advice');

const r4 = constants.getBristolHealthStatus(4);
assert(r4 && r4.status === '正常', '类型 4 应判定为正常');

const r7 = constants.getBristolHealthStatus(7);
assert(r7 && (r7.status === '偏稀' || r7.status === '异常'),
  '类型 7 应判定为偏稀或异常（实际：' + (r7 ? r7.status : 'undefined') + '）');

// 边界：非法类型
const r0 = constants.getBristolHealthStatus(0);
assert(r0 && typeof r0.status === 'string', '非法类型 0 仍返回默认值');
const r9 = constants.getBristolHealthStatus(9);
assert(r9 && typeof r9.status === 'string', '非法类型 9 仍返回默认值');

// 4. STOOL_COLORS
assert(Array.isArray(constants.STOOL_COLORS), 'STOOL_COLORS 是数组');
assert(constants.STOOL_COLORS.length >= 5, 'STOOL_COLORS 至少 5 个颜色');

// 5. COLORS 主题色
assert(constants.COLORS && typeof constants.COLORS.PRIMARY === 'string',
  'COLORS.PRIMARY 存在');

console.log('\n通过 ' + passed + ' / 失败 ' + failed);
process.exit(failed > 0 ? 1 : 0);
