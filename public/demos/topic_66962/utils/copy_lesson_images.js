/**
 * 批量复制二级插图 → images/lessons/level2_{courseId}.jpg
 * 中文数字 → 课程 courseId 映射
 */
const fs = require('fs');
const path = require('path');

const srcDir = 'C:\\Users\\15122\\Desktop\\3 二级插画';
const dstDir = path.join(__dirname, '..', 'images', 'lessons');

// 中文数字 → 数字 映射（1~38）
const numMap = {
  '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
  '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
  '十一': 11, '十二': 12, '十三': 13, '十四': 14, '十五': 15,
  '十六': 16, '十七': 17, '十八': 18, '十九': 19, '二十': 20,
  '二十一': 21, '二十二': 22, '二十三': 23, '二十四': 24, '二十五': 25,
  '二十六': 26, '二十七': 27, '二十八': 28, '二十九': 29, '三十': 30,
  '三十一': 31, '三十二': 32, '三十三': 33, '三十四': 34, '三十五': 35,
  '三十六': 36, '三十七': 37, '三十八': 38
};

if (!fs.existsSync(dstDir)) {
  fs.mkdirSync(dstDir, { recursive: true });
}

const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.jpg'));
let copied = 0;
let failed = [];

for (const file of files) {
  // 文件名格式: "第X讲.jpg"
  const match = file.match(/^第(.+)讲\.jpg$/);
  if (!match) {
    failed.push(`${file} → 无法解析`);
    continue;
  }
  const chNum = match[1];
  const courseId = numMap[chNum];
  if (!courseId) {
    failed.push(`${file} → 无法映射数字"${chNum}"`);
    continue;
  }
  const src = path.join(srcDir, file);
  const dst = path.join(dstDir, `level2_${courseId}.jpg`);
  try {
    fs.copyFileSync(src, dst);
    console.log(`✅  ${file} → level2_${courseId}.jpg`);
    copied++;
  } catch (err) {
    failed.push(`${file} → ${err.message}`);
  }
}

console.log(`\n========================`);
console.log(`共复制: ${copied} 张`);
if (failed.length > 0) {
  console.log(`失败: ${failed.length} 张`);
  failed.forEach(f => console.log(`  ❌ ${f}`));
}