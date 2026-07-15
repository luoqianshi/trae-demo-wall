#!/usr/bin/env node
/**
 * 验证所有 4 个模板的输出 MOV
 */
const CONFIG = require('./config');
const { verifyOutput } = require('./verify-output');

const TEMPLATES = ['quote_highlight', 'data_card', 'timeline', 'title_card'];

console.log('╔══════════════════════════════════════════════════╗');
console.log('║    快讯包装生成器 - 输出验证                      ║');
console.log('╚══════════════════════════════════════════════════╝');

let allPassed = true;
for (const tpl of TEMPLATES) {
  const outputPath = CONFIG.getOutputPath(tpl);
  const result = verifyOutput(outputPath);
  if (!result.passed) allPassed = false;
}

console.log(`\nOverall: ${allPassed ? '✅ ALL PASSED' : '❌ SOME FAILED'}`);
process.exit(allPassed ? 0 : 1);