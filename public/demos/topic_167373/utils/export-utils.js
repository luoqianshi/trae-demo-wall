// utils/export-utils.js
// 导出工具 - 以"用户易读"为第一原则
//   - 用户信息：中文标签 + 字符串值
//   - 记录数据：表格（CSV/TSV）+ 中文描述
//   - 字段：编号 / 记录时间（YYYY-MM-DD-HH-mm） / 类型（中文描述） / 颜色（中文） / 备注

const { BRISTOL_TYPES } = require('./constants.js');
const { STOOL_COLOR_NAME_MAP } = require('./constants.js');

/**
 * 工具：把时间戳格式化为 YYYY-MM-DD-HH-mm（本地时区）
 * 修复 PT-mp-export-001：导出时间不再用十进制时间戳
 */
function formatDateTimeReadable(timestamp) {
  const t = Number(timestamp);
  if (!isFinite(t) || t <= 0) return '';
  const d = new Date(t);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}-${pad(d.getMinutes())}`;
}

/**
 * 工具：把数字类型(1-7)转为中文描述
 */
function getBristolTypeName(type) {
  const n = Number(type);
  const found = BRISTOL_TYPES.find(t => t.type === n);
  return found ? found.name : `未知类型(${n})`;
}

/**
 * 工具：把英文颜色 key 转为中文
 */
function getColorChineseName(color) {
  if (!color) return '未填写';
  return STOOL_COLOR_NAME_MAP[color] || String(color);
}

/**
 * 把用户信息转成"用户易读"格式（纯文本，无代码符号）
 * 输出格式：
 *   ===== 用户信息 =====
 *   性别：男
 *   年龄段：18-30 岁
 *   关注程度：中度
 */
function formatUserProfileText(userProfile) {
  if (!userProfile) {
    return '===== 用户信息 =====\n尚未设置用户信息';
  }
  const lines = [];
  lines.push('===== 用户信息 =====');
  lines.push(`性别：${userProfile.getGenderName ? userProfile.getGenderName() : '未知'}`);
  lines.push(`年龄段：${userProfile.getAgeRangeName ? userProfile.getAgeRangeName() : '未填写'}`);
  lines.push(`关注程度：${userProfile.getConcernLevelName ? userProfile.getConcernLevelName() : '未填写'}`);
  return lines.join('\n');
}

/**
 * 工具：把 0-3 疼痛数值映射为中文
 */
function getPainLevelText(level) {
  // null/string 视为"未填写"；undefined/数字按 0-3 处理（老数据未存此字段默认 0）
  if (level === null || typeof level === 'string') return '未填写';
  if (level === undefined) return '无痛';
  const n = Number(level);
  if (!isFinite(n)) return '未填写';
  if (n <= 0) return '无痛';
  if (n === 1) return '轻微';
  if (n === 2) return '中等';
  if (n >= 3) return '严重';
  return '未填写';
}

/**
 * 工具：把布尔值映射为是/否
 */
function getBoolText(v) {
  return (v === true || v === 1) ? '是' : '否';
}

/**
 * 把记录数组转成"用户易读"格式（表格风格，TSV，便于粘贴到 Excel/Numbers/飞书）
 * 列：编号 | 记录时间 | 类型 | 颜色 | 疼痛 | 腹胀 | 残留 | 排不尽 | 备注
 * V0.2.0：新增 4 列身体感受
 */
function formatRecordsAsTable(records) {
  if (!Array.isArray(records) || records.length === 0) {
    return '===== 排便记录 =====\n暂无记录';
  }
  // 表头
  const header = ['编号', '记录时间', '类型', '颜色', '疼痛', '腹胀', '残留', '排不尽', '备注'];
  const rows = [header];

  records.forEach((r, idx) => {
    const id = r && r.id ? r.id : String(idx + 1);
    const time = formatDateTimeReadable(r && r.timestamp);
    const typeName = getBristolTypeName(r && r.bristolType);
    const colorName = getColorChineseName(r && r.color);
    // V0.2.0 4 个身体感受字段（老记录默认为 0/false）
    const pain = getPainLevelText(r && r.painLevel);
    const swelling = getBoolText(r && r.swelling);
    const residue = getBoolText(r && r.residue);
    const unfinished = getBoolText(r && r.unfinished);
    const note = r && r.note ? String(r.note).replace(/[\t\r\n]+/g, ' ') : '';
    rows.push([id, time, typeName, colorName, pain, swelling, residue, unfinished, note]);
  });

  // 计算每列最小宽度（中文按 2 个字符算 + 2 缓冲）
  const colWidths = [];
  for (let c = 0; c < header.length; c++) {
    let max = 0;
    for (let i = 0; i < rows.length; i++) {
      const s = String(rows[i][c] == null ? '' : rows[i][c]);
      // 中文字符宽度
      let w = 0;
      for (let k = 0; k < s.length; k++) {
        const code = s.charCodeAt(k);
        w += (code >= 0x3000 && code <= 0x9FFF) || (code >= 0xFF00) ? 2 : 1;
      }
      if (w > max) max = w;
    }
    colWidths.push(max);
  }

  // 构造分隔行 + 行
  function padCell(s, w) {
    let cellStr = String(s == null ? '' : s);
    let realW = 0;
    for (let k = 0; k < cellStr.length; k++) {
      const code = cellStr.charCodeAt(k);
      realW += (code >= 0x3000 && code <= 0x9FFF) || (code >= 0xFF00) ? 2 : 1;
    }
    const pad = ' '.repeat(Math.max(0, w - realW));
    return cellStr + pad;
  }
  function makeRow(cells) {
    return cells.map((c, i) => padCell(c, colWidths[i])).join(' | ');
  }
  function makeSep() {
    return colWidths.map(w => '-'.repeat(w)).join('-+-');
  }

  const out = [];
  out.push('===== 排便记录（按时间从新到旧）共 ' + records.length + ' 条 =====');
  out.push(makeRow(header));
  out.push(makeSep());
  for (let i = 1; i < rows.length; i++) {
    out.push(makeRow(rows[i]));
  }
  return out.join('\n');
}

/**
 * 导出为人类可读文本（首推用于剪贴板）
 * 结构：
 *   应用标题
 *   导出时间
 *   ----- 用户信息 -----
 *   字段：值
 *   ----- 排便记录 -----
 *   表格
 * 修复 PT-mp-export-001：用户易读、表格、中文、时间格式化
 */
function exportToText(records, userProfile, options) {
  const opts = options || {};
  const now = new Date();
  const exportTime = formatDateTimeReadable(now.getTime());

  const lines = [];
  lines.push('排便健康记录 - 数据导出');
  lines.push(`导出时间：${exportTime}`);
  lines.push('');
  lines.push(formatUserProfileText(userProfile));
  lines.push('');
  lines.push(formatRecordsAsTable(records));
  return lines.join('\n');
}

/**
 * 导出为 CSV（UTF-8 BOM，便于 Excel 直接打开中文）
 * 列：编号 / 记录时间 / 类型 / 颜色 / 疼痛 / 腹胀 / 残留 / 排不尽 / 备注
 * V0.2.0：新增 4 列身体感受
 */
function exportToCsv(records) {
  const BOM = '\uFEFF';
  const header = ['编号', '记录时间', '类型', '颜色', '疼痛', '腹胀', '残留', '排不尽', '备注'];
  const rows = [header];

  if (Array.isArray(records) && records.length > 0) {
    records.forEach((r, idx) => {
      const id = r && r.id ? r.id : String(idx + 1);
      const time = formatDateTimeReadable(r && r.timestamp);
      const typeName = getBristolTypeName(r && r.bristolType);
      const colorName = getColorChineseName(r && r.color);
      const pain = getPainLevelText(r && r.painLevel);
      const swelling = getBoolText(r && r.swelling);
      const residue = getBoolText(r && r.residue);
      const unfinished = getBoolText(r && r.unfinished);
      const note = r && r.note ? String(r.note).replace(/[\r\n]+/g, ' ') : '';
      rows.push([id, time, typeName, colorName, pain, swelling, residue, unfinished, note]);
    });
  } else {
    rows.push(['(暂无记录)', '', '', '', '', '', '', '', '']);
  }

  function escapeCsvCell(v) {
    const s = String(v == null ? '' : v);
    if (s.indexOf(',') >= 0 || s.indexOf('"') >= 0 || s.indexOf('\n') >= 0) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  }

  return BOM + rows.map(row => row.map(escapeCsvCell).join(',')).join('\n');
}

/**
 * 兼容旧 API：导出 JSON 文本（保持原接口，返回字符串）
 * 仍然按"用户易读"输出：首部用户信息 + 表格化记录
 */
function exportToJson(records, userProfile) {
  return exportToText(records, userProfile);
}

module.exports = {
  exportToText,
  exportToCsv,
  exportToJson,
  // 暴露内部工具（便于测试和复用）
  formatDateTimeReadable,
  getBristolTypeName,
  getColorChineseName,
  formatUserProfileText,
  formatRecordsAsTable,
  // V0.2.0 工具
  getPainLevelText,
  getBoolText
};
