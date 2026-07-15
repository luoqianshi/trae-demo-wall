/**
 * 导出工具测试（PT-mp-export-001 重写后版本）
 * 验证：用户易读文本、CSV 表格、字段映射、中文友好
 */

const exportUtils = require('../../utils/export-utils.js');
const UserProfile = require('../../data/models/user-profile.js');

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

console.log('\n=== export-utils.js 测试 ===');

const sampleRecords = [
  { id: 'r1', bristolType: 4, color: 'brown', timestamp: 1700000000000, note: '正常' },
  { id: 'r2', bristolType: 3, color: 'yellow', timestamp: 1700086400000, note: '略软' }
];
const sampleProfile = new UserProfile({ gender: 'male', ageRange: '25-35 岁', concernLevel: 'mild' });

// 1. exportToText：返回字符串
const text = exportUtils.exportToText(sampleRecords, sampleProfile);
assert(typeof text === 'string', 'exportToText 返回字符串');
assert(text.indexOf('用户信息') > 0, '文本包含"用户信息"段');
assert(text.indexOf('排便记录') > 0, '文本包含"排便记录"段');
assert(text.indexOf('性别') > 0, '文本包含"性别"字段');
assert(text.indexOf('年龄段') > 0, '文本包含"年龄段"字段');
assert(text.indexOf('关注程度') > 0, '文本包含"关注程度"字段');

// 2. 用户信息使用中文值
assert(text.indexOf('男') > 0, '性别显示为"男"');
assert(text.indexOf('轻度') > 0, '关注程度显示为"轻度"');

// 3. 记录表格：表头 + 中文列名
assert(text.indexOf('编号') > 0, '表格包含"编号"列');
assert(text.indexOf('记录时间') > 0, '表格包含"记录时间"列');
assert(text.indexOf('类型') > 0, '表格包含"类型"列');
assert(text.indexOf('颜色') > 0, '表格包含"颜色"列');
assert(text.indexOf('备注') > 0, '表格包含"备注"列');

// 4. 不应出现原始时间戳/英文/createdAt
assert(text.indexOf('1700000000000') === -1, '不出现十进制时间戳');
assert(text.indexOf('createdAt') === -1, '不出现 createdAt 字段');
assert(text.indexOf('updatedAt') === -1, '不出现 updatedAt 字段');
assert(text.indexOf('"bristolType"') === -1, '不出现英文 JSON 字段名');
assert(text.indexOf('"color"') === -1, '不出现英文 JSON 字段名');
assert(text.indexOf('"note"') === -1, '不出现英文 JSON 字段名');

// 5. 类型用中文描述
const textSample = exportUtils.exportToText([sampleRecords[0]], sampleProfile);
assert(textSample.indexOf('光滑香肠') > 0, '类型 4 显示为"光滑香肠"');

// 6. 颜色用中文
assert(textSample.indexOf('棕色') > 0, '颜色 brown 显示为"棕色"');

// 7. 时间格式 YYYY-MM-DD-HH-mm
assert(/\d{4}-\d{2}-\d{2}-\d{2}-\d{2}/.test(textSample), '时间格式为 YYYY-MM-DD-HH-mm');

// 8. 记录编号保留
assert(textSample.indexOf('r1') > 0, '保留原始 id（r1）');

// 9. CSV 导出
const csv = exportUtils.exportToCsv(sampleRecords);
assert(typeof csv === 'string', 'exportToCsv 返回字符串');
assert(csv.indexOf('\uFEFF') === 0, 'CSV 包含 UTF-8 BOM（兼容 Excel）');
assert(csv.indexOf('编号') > 0, 'CSV 包含"编号"表头');
assert(csv.indexOf('记录时间') > 0, 'CSV 包含"记录时间"表头');
assert(csv.indexOf('类型') > 0, 'CSV 包含"类型"表头');
assert(csv.indexOf('颜色') > 0, 'CSV 包含"颜色"表头');
assert(csv.indexOf('备注') > 0, 'CSV 包含"备注"表头');
assert(csv.indexOf('1700000000000') === -1, 'CSV 不出现原始时间戳');
assert(csv.indexOf('光滑香肠') > 0, 'CSV 类型显示为中文描述');
assert(csv.indexOf('棕色') > 0, 'CSV 颜色显示为中文');

// 10. 空数据容错
const emptyText = exportUtils.exportToText([], null);
assert(typeof emptyText === 'string' && emptyText.indexOf('暂无记录') > 0, '空数据文本提示"暂无记录"');

const emptyCsv = exportUtils.exportToCsv([]);
assert(typeof emptyCsv === 'string' && emptyCsv.indexOf('暂无记录') > 0, '空数据 CSV 提示"暂无记录"');

// 11. 工具函数：getBristolTypeName
assert(exportUtils.getBristolTypeName(1) === '坚果状', 'getBristolTypeName 1=坚果状');
assert(exportUtils.getBristolTypeName(4) === '光滑香肠', 'getBristolTypeName 4=光滑香肠');
assert(exportUtils.getBristolTypeName(7) === '水样', 'getBristolTypeName 7=水样');
assert(exportUtils.getBristolTypeName(99).indexOf('未知') >= 0, '未知类型回退');

// 12. 工具函数：getColorChineseName
assert(exportUtils.getColorChineseName('brown') === '棕色', 'getColorChineseName brown=棕色');
assert(exportUtils.getColorChineseName(null) === '未填写', 'null 颜色=未填写');

// 13. 工具函数：formatDateTimeReadable
const fmt = exportUtils.formatDateTimeReadable(1700000000000);
assert(/^\d{4}-\d{2}-\d{2}-\d{2}-\d{2}$/.test(fmt), 'formatDateTimeReadable 格式正确');

// 14. exportToJson 兼容旧 API
const jsonApi = exportUtils.exportToJson(sampleRecords, sampleProfile);
assert(typeof jsonApi === 'string' && jsonApi.indexOf('用户信息') > 0, 'exportToJson 兼容旧 API 并返回用户易读文本');

// 15. 表格不出现英文/代码符号 (除 r1/r2 编号外)
const tableText = exportUtils.formatRecordsAsTable(sampleRecords);
assert(tableText.indexOf('{') === -1 && tableText.indexOf('}') === -1, '表格不出现 JSON 括号');
assert(tableText.indexOf('"id"') === -1, '表格不出现"id" 字段名');
assert(tableText.indexOf('"timestamp"') === -1, '表格不出现 timestamp 字段名');

// ===== V0.2.0 身体感受字段 =====
console.log('\n  --- V0.2.0 身体感受字段 ---');

// 16. 工具函数 getPainLevelText
assert(exportUtils.getPainLevelText(0) === '无痛', 'painLevel 0=无痛');
assert(exportUtils.getPainLevelText(1) === '轻微', 'painLevel 1=轻微');
assert(exportUtils.getPainLevelText(2) === '中等', 'painLevel 2=中等');
assert(exportUtils.getPainLevelText(3) === '严重', 'painLevel 3=严重');
assert(exportUtils.getPainLevelText(null) === '未填写', 'painLevel null=未填写');
assert(exportUtils.getPainLevelText(undefined) === '无痛', 'painLevel undefined=无痛（老数据兼容）');
assert(exportUtils.getPainLevelText(99) === '严重', 'painLevel 99=严重（边界外）');

// 17. 工具函数 getBoolText
assert(exportUtils.getBoolText(true) === '是', 'true=是');
assert(exportUtils.getBoolText(false) === '否', 'false=否');
assert(exportUtils.getBoolText(1) === '是', '1=是');
assert(exportUtils.getBoolText(0) === '否', '0=否');
assert(exportUtils.getBoolText(null) === '否', 'null=否');

// 18. 表格新增 4 列（疼痛/腹胀/残留/排不尽）
const v020Records = [
  { id: 'v1', bristolType: 4, color: 'brown', timestamp: 1700000000000, note: '正常', painLevel: 1, swelling: true, residue: false, unfinished: false },
  { id: 'v2', bristolType: 3, color: 'yellow', timestamp: 1700086400000, note: '略软', painLevel: 0, swelling: false, residue: true, unfinished: true }
];
const v020Text = exportUtils.formatRecordsAsTable(v020Records);
assert(v020Text.indexOf('疼痛') > 0, 'V0.2.0 表格含"疼痛"列');
assert(v020Text.indexOf('腹胀') > 0, 'V0.2.0 表格含"腹胀"列');
assert(v020Text.indexOf('残留') > 0, 'V0.2.0 表格含"残留"列');
assert(v020Text.indexOf('排不尽') > 0, 'V0.2.0 表格含"排不尽"列');
assert(v020Text.indexOf('轻微') > 0, 'V0.2.0 表格含疼痛值 轻微');
assert(v020Text.indexOf('是') > 0, 'V0.2.0 表格含布尔 是');

// 19. 老数据（无 4 字段）不崩
const oldRecords = [
  { id: 'o1', bristolType: 4, color: 'brown', timestamp: 1700000000000, note: '老记录' }
];
const oldText = exportUtils.formatRecordsAsTable(oldRecords);
assert(oldText.indexOf('无痛') > 0, '老记录疼痛默认为 无痛');
assert(oldText.indexOf('否') > 0, '老记录腹胀/残留/排不尽默认为 否');

// 20. CSV 含 V0.2.0 4 列
const v020Csv = exportUtils.exportToCsv(v020Records);
assert(v020Csv.indexOf('疼痛') > 0, 'CSV 含"疼痛"列');
assert(v020Csv.indexOf('腹胀') > 0, 'CSV 含"腹胀"列');
assert(v020Csv.indexOf('残留') > 0, 'CSV 含"残留"列');
assert(v020Csv.indexOf('排不尽') > 0, 'CSV 含"排不尽"列');

console.log('\n通过 ' + passed + ' / 失败 ' + failed);
process.exit(failed > 0 ? 1 : 0);
