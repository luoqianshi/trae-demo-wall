const fs = require('fs');
const html = fs.readFileSync('/Users/annette/Desktop/使用手册trae/My_English/zhixueban.html', 'utf-8');

function extractDictionary(text, marker) {
  const start = text.indexOf(marker);
  const end = text.indexOf('};', start);
  const dictText = text.substring(start, end + 2);
  return dictText;
}

// 构建词典
eval(extractDictionary(html, 'const wordDictionary = {'));
eval(extractDictionary(html, 'const extendedDictionary = {'));
eval(extractDictionary(html, 'const phraseDictionary = {'));
for (const [k, v] of Object.entries(extendedDictionary)) {
  if (!wordDictionary[k]) wordDictionary[k] = v;
}

globalThis.wd = wordDictionary;
globalThis.pd = phraseDictionary;

const wordsToCheck = ['greece', 'familiar', 'special', 'italy', 'adult', 'has changed', 'need to', 'this means that'];
for (const w of wordsToCheck) {
  const inWD = !!wd[w];
  const inPD = !!pd[w];
  const match = inWD || inPD;
  console.log(w.padEnd(20) + ' wordDict=' + (inWD ? '✅' : '❌') + ' phraseDict=' + (inPD ? '✅' : '❌') + ' = ' + (match ? '匹配' : '未收录'));
}

// 检查 orderedWordList
const owlStart = html.indexOf('const orderedWordList =');
if (owlStart > 0) {
  const owlEnd = html.indexOf('];', owlStart);
  const owlCode = html.substring(owlStart, owlEnd + 2);
  eval(owlCode);
  console.log('\norderedWordList 总词条数:', orderedWordList.length);
  console.log('前 30 个词条:');
  for (let i = 0; i < Math.min(30, orderedWordList.length); i++) {
    console.log('  ' + (i + 1) + '. ' + JSON.stringify(orderedWordList[i]).substring(0, 80));
  }
}
