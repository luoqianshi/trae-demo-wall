#!/usr/bin/env node
/**
 * 渲染所有 4 个模板
 */
const { renderTemplate } = require('./render-template');

const TEMPLATES = ['quote_highlight', 'data_card', 'timeline', 'title_card'];

(async () => {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║    快讯包装生成器 - 全模板渲染                    ║');
  console.log('╚══════════════════════════════════════════════════╝');

  const results = {};
  for (const tpl of TEMPLATES) {
    try {
      results[tpl] = await renderTemplate(tpl);
    } catch (e) {
      console.error(`\n❌ ${tpl} failed: ${e.message}`);
      results[tpl] = { passed: false, error: e.message };
    }
  }

  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║    渲染汇总                                      ║');
  console.log('╚══════════════════════════════════════════════════╝');
  for (const [tpl, r] of Object.entries(results)) {
    const icon = r.passed ? '✅' : '❌';
    console.log(`  ${icon} ${tpl}: ${r.passed ? 'PASSED' : r.error || 'FAILED'}`);
  }
})();