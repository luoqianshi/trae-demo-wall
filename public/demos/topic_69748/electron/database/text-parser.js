/**
 * 文本解析工具模块
 */

/**
 * 将四位数字补零
 */
function pad4(num) {
  return String(num).padStart(4, '0');
}

/**
 * 生成进展ID
 */
function genProgressId(projectId, index) {
  return 'P' + projectId + '-' + pad4(index);
}

/**
 * 生成附件ID
 */
function genAttachmentId(projectId, index) {
  return 'A' + projectId + '-' + pad4(index);
}

/**
 * 解析进展文本为对象数组
 * 格式: id|日期|内容
 */
function parseProgressText(text) {
  if (!text) return [];
  const lines = text.split('\n').filter(Boolean);
  const result = [];
  for (const line of lines) {
    const parts = line.split('|');
    if (parts.length >= 3) {
      result.push({
        id: parts[0],
        createdAt: parts[1],
        content: parts.slice(2).join('|')
      });
    }
  }
  return result;
}

/**
 * 将进展对象数组序列化为文本
 */
function buildProgressText(items) {
  if (!items || items.length === 0) return '';
  return items.map(it => `${it.id}|${it.createdAt}|${it.content}`).join('\n');
}

/**
 * 解析附件文本为对象数组
 * 格式: id|日期|文件名|文件路径|文件大小|文件类型
 */
function parseAttachmentsText(text) {
  if (!text) return [];
  const lines = text.split('\n').filter(Boolean);
  const result = [];
  for (const line of lines) {
    const parts = line.split('|');
    if (parts.length >= 6) {
      result.push({
        id: parts[0],
        createdAt: parts[1],
        fileName: parts[2],
        filePath: parts[3],
        fileSize: Number(parts[4]) || 0,
        fileType: parts[5] || ''
      });
    } else if (parts.length >= 3) {
      result.push({
        id: parts[0],
        createdAt: parts[1],
        fileName: parts[2],
        filePath: '',
        fileSize: 0,
        fileType: ''
      });
    }
  }
  return result;
}

/**
 * 将附件对象数组序列化为文本
 */
function buildAttachmentsText(items) {
  if (!items || items.length === 0) return '';
  return items.map(it => `${it.id}|${it.createdAt}|${it.fileName}|${it.filePath}|${it.fileSize}|${it.fileType}`).join('\n');
}

module.exports = {
  pad4,
  genProgressId,
  genAttachmentId,
  parseProgressText,
  buildProgressText,
  parseAttachmentsText,
  buildAttachmentsText
};
