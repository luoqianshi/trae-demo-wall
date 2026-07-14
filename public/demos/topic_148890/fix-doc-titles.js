const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'js', 'rag', 'knowledge-base.js');
let content = fs.readFileSync(filePath, 'utf8');

const replacements = [
  // 标题格式统一
  ['- 核心条款', '- 核心要点'],
  ['- 注意事项', '- 核心要点'],
  ['- 撰写要点', '- 核心要点'],
  ['- 模板', '- 核心要点'],
  ['- 结构要点', '- 核心要点'],
  ['- 模板要点', '- 核心要点'],
  ['- 详细条款模板', '- 核心要点'],
  ['- 收集指南', '- 核心要点'],
  ['- 收集与保存指南', '- 核心要点'],
  ['- 证据收集指南', '- 核心要点'],
  ['- 原告方', '- 原告方'],
  ['- 被告方', '- 被告方'],
  ['- 核心条款', '- 核心要点'],
];

replacements.forEach(([from, to]) => {
  // 只替换文书类的标题
  const regex = new RegExp("(type: '文书',[^}]*title: '[^']*)" + from.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + "([^']*')", 'g');
  content = content.replace(regex, '$1' + to + '$2');
});

// 分类统一
const categoryReplacements = [
  ['家暴维权', '诉讼程序'],
  ['调解', '诉讼程序'],
  ['夫妻关系', '其他'],
  ['继承家事', '其他'],
  ['彩礼纠纷', '其他'],
];

categoryReplacements.forEach(([from, to]) => {
  const regex = new RegExp("(type: '文书',\\s*category: ')" + from + "(')", 'g');
  content = content.replace(regex, '$1' + to + '$2');
});

fs.writeFileSync(filePath, content, 'utf8');
console.log('完成：统一文书标题格式和分类');
