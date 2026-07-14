const fs = require('fs');
const content = fs.readFileSync('zhixueban.html', 'utf-8');

// 简单方法：统计 "  { word:" 出现次数
const entries = content.match(/\{\s*word:\s*'[^']+',\s*phonetic:/g);
console.log('orderedWordList 词条数:', entries.length);

// 提取并显示所有单词
const listMatch = content.match(/const orderedWordList = \[([\s\S]*?)\n\];/);
if (listMatch) {
  const listContent = listMatch[1];
  // 用更稳健的方式解析：按行提取 word
  const wordPattern = /word:\s*'([^']+)'/g;
  const words = [];
  let m;
  while ((m = wordPattern.exec(listContent)) !== null) {
    words.push(m[1]);
  }
  console.log('');
  console.log('提取到的词总数:', words.length);
  console.log('');
  words.forEach((w, i) => {
    console.log((i+1).toString().padStart(3) + '. ' + w);
  });
}
