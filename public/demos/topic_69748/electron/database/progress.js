/**
 * 进展和附件文本解析模块
 * 负责将文本格式解析为对象数组，以及将对象数组序列化为文本
 */
const { parseProgressText, buildProgressText, parseAttachmentsText, buildAttachmentsText } = require('./text-parser');

module.exports = {
  parseProgressText,
  buildProgressText,
  parseAttachmentsText,
  buildAttachmentsText
};
