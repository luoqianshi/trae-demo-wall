// 敏感词过滤（本地关键词列表）
const sensitiveWords = [
  '傻逼', '妈的', '操你', 'fuck', 'shit', '变态', '废物',
  '去死', '垃圾', '混蛋', '狗屎', '白痴', '脑残',
  '操你妈', 'cnm', 'nmsl', 'sb', 'tmd', 'wbd',
  '色情', '赌博', '毒品', '暴力', '杀', '死',
  // 增加常见不当词汇
  '装逼', '滚蛋', '恶心', '不要脸', '臭不要脸',
  '去你妈', '你妈逼', '草泥马'
];

// 过滤函数，返回 true 表示通过过滤
function isMessageValid(text) {
  if (!text || text.trim().length === 0) return false;
  const trimmed = text.trim();
  for (const word of sensitiveWords) {
    if (trimmed.includes(word)) return false;
  }
  return true;
}