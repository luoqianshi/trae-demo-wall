// ============================================================
// 独立测试：模拟 extractWordsFromText 的核心逻辑
// ============================================================

// 从 zhixueban.html 读取词典数据
const fs = require('fs');
const html = fs.readFileSync('/Users/annette/Desktop/使用手册trae/My_English/zhixueban.html', 'utf-8');

// 用简单的字符串搜索提取词典
function extractDictionary(text, marker) {
  const start = text.indexOf(marker);
  if (start < 0) return null;
  const end = text.indexOf('};', start);
  const dictText = text.substring(start, end + 2);
  return dictText;
}

// 构建词典（用 globalThis 让 eval 产生的变量可访问）
const code = [
  extractDictionary(html, 'const wordDictionary = {'),
  extractDictionary(html, 'const extendedDictionary = {'),
  extractDictionary(html, 'const phraseDictionary = {'),
  `
  for (const [key, value] of Object.entries(extendedDictionary)) {
    if (!wordDictionary[key]) wordDictionary[key] = value;
  }
  globalThis.wordDictionary = wordDictionary;
  globalThis.phraseDictionary = phraseDictionary;
  `
].join('\n');
eval(code);
const wordDictionary = globalThis.wordDictionary;
const phraseDictionary = globalThis.phraseDictionary;

console.log('词典加载完成: wordDictionary=' + Object.keys(wordDictionary).length +
  ', phraseDictionary=' + Object.keys(phraseDictionary).length);

// ============================================================
// 复制 extractWordsFromText 函数（使用与 zhixueban.html 相同的逻辑）
// ============================================================

function extractWordsFromText(text) {
  if (!text || text.trim().length === 0) {
    return [];
  }

  console.log('【OCR原始文本前800字】', text.substring(0, 800).replace(/\n/g, ' | '));

  // === Step 0: 文本预处理 ===
  let cleanedText = text
    .replace(/[\u4e00-\u9fa5]/g, ' ')
    .replace(/[\u3040-\u30ff]/g, ' ')
    .replace(/[\uac00-\ud7a3]/g, ' ')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  cleanedText = cleanedText.replace(/(\d)([a-zA-Z])/g, '$1 $2');
  cleanedText = cleanedText.replace(/([a-zA-Z])(\d)/g, '$1 $2');

  console.log('【预处理文本】', cleanedText.substring(0, 500));

  const result = [];
  const seen = new Set();

  const numPattern = /(\d+)/g;
  const numPositions = [];
  let m;
  while ((m = numPattern.exec(cleanedText)) !== null) {
    numPositions.push({ num: m[1], start: m.index, end: m.index + m[1].length });
  }

  console.log('【发现的数字】 共 ' + numPositions.length + ' 个');
  for (let i = 0; i < Math.min(15, numPositions.length); i++) {
    const np = numPositions[i];
    const context = cleanedText.substring(np.end, Math.min(np.end + 40, cleanedText.length));
    console.log('  [' + i + '] 序号=' + np.num + ', 后续内容="' + context + '"');
  }

  // === Phase 1: 按数字位置分割，提取每个词项 ===
  for (let i = 0; i < numPositions.length; i++) {
    const currentNum = numPositions[i];
    const nextNum = numPositions[i + 1];

    const contentStart = currentNum.end;
    const contentEnd = nextNum ? nextNum.start : cleanedText.length;

    let englishContent = cleanedText.substring(contentStart, contentEnd)
      .replace(/[^\w\s'-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    englishContent = englishContent
      .replace(/\s\d+\s/g, ' ')
      .replace(/^\d+\s/, '')
      .replace(/\s\d+$/, '')
      .trim();

    if (!englishContent || englishContent.length < 2) continue;

    const lowerPhrase = englishContent.toLowerCase();

    if (seen.has(lowerPhrase)) continue;

    let phonetic = '';
    let meaning = '';
    let pos = '';
    let finalWord = englishContent;
    let matched = false;

    if (phraseDictionary[lowerPhrase]) {
      phonetic = phraseDictionary[lowerPhrase].phonetic;
      meaning = phraseDictionary[lowerPhrase].meaning;
      pos = phraseDictionary[lowerPhrase].pos;
      matched = true;
    } else if (wordDictionary[lowerPhrase]) {
      phonetic = wordDictionary[lowerPhrase].phonetic;
      meaning = wordDictionary[lowerPhrase].meaning;
      pos = wordDictionary[lowerPhrase].pos;
      matched = true;
    }

    seen.add(lowerPhrase);

    result.push({
      word: finalWord,
      phonetic: phonetic,
      meaning: meaning,
      pos: pos,
      number: currentNum.num,
      _raw: englishContent,
      _matched: matched
    });
  }

  // === Phase 2: 二次检测 ===
  console.log('');
  console.log('【Phase 2: 二次检测】 未匹配项共 ' + result.filter(r => !r._matched).length + ' 个');

  for (let i = 0; i < result.length; i++) {
    const item = result[i];
    if (item._matched) continue;

    const rawLower = item._raw.toLowerCase();
    console.log('  📋 二次检测 #' + item.number + ': 原始="' + item._raw + '"');

    const words = rawLower.split(/[\s'-]+/).filter(w => w.length >= 2);

    // 策略 A: phraseDictionary 子词组匹配
    let bestPhrase = null;
    let bestPhraseLen = 0;
    const allPhraseKeys = Object.keys(phraseDictionary);
    for (const pKey of allPhraseKeys) {
      if (rawLower.includes(pKey) && pKey.length > bestPhraseLen) {
        bestPhrase = pKey;
        bestPhraseLen = pKey.length;
      }
    }

    if (bestPhrase) {
      console.log('    ✅ 策略A: 找到词组 "' + bestPhrase + '"');
      const entry = phraseDictionary[bestPhrase];
      item.word = bestPhrase;
      item.phonetic = entry.phonetic;
      item.meaning = entry.meaning;
      item.pos = entry.pos;
      item._matched = true;
      continue;
    }

    // 策略 B: 拆分成独立单词，在 wordDictionary 中找（优先第一个）
    let firstWord = null;
    let matchedWords = [];
    for (const w of words) {
      if (wordDictionary[w]) {
        matchedWords.push(w);
        if (!firstWord) firstWord = w;
      }
    }

    if (firstWord) {
      console.log('    ✅ 策略B: 找到单词 "' + firstWord + '"（词典中可识别的词: ' + matchedWords.join(', ') + '）');
      const entry = wordDictionary[firstWord];
      item.word = firstWord;
      item.phonetic = entry.phonetic;
      item.meaning = entry.meaning;
      item.pos = entry.pos;
      item._matched = true;
      continue;
    }

    console.log('    ❌ 无有效词典匹配');
  }

  // === Phase 3: 过滤无匹配项 ===
  const finalResult = [];
  const finalSeen = new Set();
  let unmatchedCount = 0;

  for (let i = 0; i < result.length; i++) {
    const item = result[i];
    const key = item.word.toLowerCase();

    if (finalSeen.has(key)) continue;

    if (!item._matched) {
      unmatchedCount++;
      continue;
    }

    finalSeen.add(key);
    finalResult.push({
      word: item.word,
      phonetic: item.phonetic,
      meaning: item.meaning,
      pos: item.pos,
      number: item.number
    });
  }

  if (unmatchedCount > 0) {
    console.log('【删除了 ' + unmatchedCount + ' 个无法识别的项】');
  }

  // === Phase 4: 备用方案 ===
  if (finalResult.length === 0) {
    const allPhrases = Object.keys(phraseDictionary);
    let fallbackCount = 0;
    for (const phrase of allPhrases) {
      if (cleanedText.includes(phrase)) {
        finalResult.push({
          word: phrase,
          phonetic: phraseDictionary[phrase].phonetic,
          meaning: phraseDictionary[phrase].meaning,
          pos: phraseDictionary[phrase].pos,
          number: String(++fallbackCount)
        });
      }
    }
    const wordMatches = cleanedText.match(/[a-zA-Z]{2,}(?:['-][a-zA-Z]+)*/g) || [];
    for (const w of wordMatches) {
      const wLower = w.toLowerCase();
      if (finalSeen.has(wLower)) continue;
      finalSeen.add(wLower);
      const dictEntry = wordDictionary[wLower];
      if (dictEntry) {
        finalResult.push({
          word: wLower,
          phonetic: dictEntry.phonetic,
          meaning: dictEntry.meaning,
          pos: dictEntry.pos,
          number: String(++fallbackCount)
        });
      }
    }
  }

  console.log('');
  console.log('【最终结果】 总词数=' + finalResult.length);
  for (let i = 0; i < finalResult.length; i++) {
    const r = finalResult[i];
    console.log('  [' + (i + 1) + ']  #' + r.number + ' → "' + r.word + '"  音标=' + r.phonetic + '  释义=' + r.meaning);
  }

  return finalResult;
}

// ============================================================
// 测试场景
// ============================================================

console.log('\n\n' + '='.repeat(70));
console.log('测试 1: OCR 识别错误（"37 Greece fa"，"fa" 是多余碎片）');
console.log('='.repeat(70));
{
  const text = '37 Greece fa 38 familiar 39 special';
  const result = extractWordsFromText(text);
  console.log('\n期望: Greece → /ɡriːs/希腊, familiar → /fəˈmɪliə/熟悉的, special → /ˈspeʃl/特别的');
  console.log('实际: ' + result.length + ' 项');
  for (const r of result) {
    console.log('  ' + r.number + '. ' + r.word + ' (' + (r.phonetic ? '✅ ' + r.phonetic : '❌ 无音标') + ')');
  }
}

console.log('\n\n' + '='.repeat(70));
console.log('测试 2: 词组 "26 has changed"（应匹配 phraseDictionary）');
console.log('='.repeat(70));
{
  const text = '25 italy 26 has changed 27 receive';
  const result = extractWordsFromText(text);
  console.log('\n期望: 25.italy, 26.has changed, 27.receive');
  console.log('实际: ' + result.length + ' 项');
  for (const r of result) {
    console.log('  ' + r.number + '. ' + r.word + ' (' + (r.phonetic ? '✅ ' + r.phonetic : '❌ 无音标') + ')');
  }
}

console.log('\n\n' + '='.repeat(70));
console.log('测试 3: 典型单词 "136 remember"');
console.log('='.repeat(70));
{
  const text = '135 italy 136 remember 137 holiday';
  const result = extractWordsFromText(text);
  console.log('\n实际: ' + result.length + ' 项');
  for (const r of result) {
    console.log('  ' + r.number + '. ' + r.word + ' (' + (r.phonetic ? '✅ ' + r.phonetic : '❌ 无音标') + ')');
  }
}

console.log('\n\n' + '='.repeat(70));
console.log('测试 4: OCR 粘合 "1adult 2receive 3free"（数字+字母无空格）');
console.log('='.repeat(70));
{
  const text = '1adult 2receive 3free';
  const result = extractWordsFromText(text);
  console.log('\n实际: ' + result.length + ' 项');
  for (const r of result) {
    console.log('  ' + r.number + '. ' + r.word + ' (' + (r.phonetic ? '✅ ' + r.phonetic : '❌ 无音标') + ')');
  }
}

console.log('\n\n' + '='.repeat(70));
console.log('测试 5: 长词组 "123 this means that extra"（带多余碎片）');
console.log('='.repeat(70));
{
  const text = '123 this means that extra 124 need to hurry';
  const result = extractWordsFromText(text);
  console.log('\n实际: ' + result.length + ' 项');
  for (const r of result) {
    console.log('  ' + r.number + '. ' + r.word + ' (' + (r.phonetic ? '✅ ' + r.phonetic : '❌ 无音标') + ')');
  }
}

console.log('\n\n' + '='.repeat(70));
console.log('测试 6: 真实图片模拟 - 多列布局 10 个词');
console.log('='.repeat(70));
{
  const text = '1 adult 2 receive 3 free 4 discount 5 notice 6 italy 7 library 8 computer 9 remember 10 holiday';
  const result = extractWordsFromText(text);
  console.log('\n实际: ' + result.length + ' 项');
  const allHavePhonetic = result.every(r => r.phonetic);
  console.log('音标覆盖率: ' + (allHavePhonetic ? '✅ 100%' : '❌ 有缺失'));
  for (const r of result) {
    console.log('  ' + r.number + '. ' + r.word + ' (' + (r.phonetic ? '✅ ' + r.phonetic : '❌ 无音标') + ')');
  }
}

console.log('\n\n=== 所有测试完成 ===');
