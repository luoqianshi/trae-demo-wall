const fs = require('fs');
const html = fs.readFileSync('zhixueban.html', 'utf-8');

const scriptRegex = /<script(?![\s\S]*?src=["'])([^>]*)?>([\s\S]*?)<\/script>/gi;
let match;
let scriptIndex = 0;
let totalErrors = 0;
while ((match = scriptRegex.exec(html)) !== null) {
  const code = match[2];
  if (!code || !code.trim()) continue;
  try {
    new Function(code);
    console.log('Script #' + (++scriptIndex) + ': OK (length=' + code.length + ')');
  } catch (e) {
    totalErrors++;
    console.log('Script #' + (++scriptIndex) + ': 语法错误: ' + e.message);
    const lines = code.split('\n');
    const errMatch = e.message.match(/<anonymous>:(\d+)/);
    if (errMatch) {
      const lineNum = parseInt(errMatch[1]);
      console.log('  出错行 ~' + lineNum + ':');
      for (let i = Math.max(0, lineNum - 3); i < Math.min(lines.length, lineNum + 3); i++) {
        console.log('    [' + (i + 1) + '] ' + lines[i]);
      }
    }
  }
}
console.log('\n=== 检查完成，共 ' + scriptIndex + ' 个脚本，错误 ' + totalErrors + ' 个 ===');
