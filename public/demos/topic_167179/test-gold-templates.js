const { renderTemplate } = require('./renderer/render-template');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const CONFIG = require('./renderer/config');

const FFMPEG = CONFIG.ffmpegPath;

async function test() {
  // 1. single-stat
  const r1 = await renderTemplate('single-stat', {
    mainNumber: '75%',
    subText: '防灾资金占比',
    theme: 'amber'
  }, 'fixed-75pct');
  console.log('single-stat:', r1.passed ? '✅' : '❌', 'size:', r1.size);

  // 2. data-compare
  const r2 = await renderTemplate('data-compare', {
    textLeft: '防 75%',
    textRight: '救 25%',
    theme: 'amber'
  }, 'fixed-compare');
  console.log('data-compare:', r2.passed ? '✅' : '❌', 'size:', r2.size);

  // 3. quote-callout
  const r3 = await renderTemplate('quote-callout', {
    quoteText: '把人民生命安全放在首位',
    speaker: '中央政治局会议',
    theme: 'blue'
  }, 'fixed-quote');
  console.log('quote-callout:', r3.passed ? '✅' : '❌', 'size:', r3.size);

  // 4. trend-ratio
  const r4 = await renderTemplate('trend-ratio', {
    mainNumber: '+15.8%',
    subText: '较上季度',
    trendDirection: 'up',
    theme: 'amber'
  }, 'fixed-trend');
  console.log('trend-ratio:', r4.passed ? '✅' : '❌', 'size:', r4.size);

  // 5. data-to-conclusion
  const r5 = await renderTemplate('data-to-conclusion', {
    textLeft: '防 75%',
    textRight: '救 25%',
    textResult: '主动防患',
    theme: 'amber'
  }, 'fixed-conclusion');
  console.log('data-to-conclusion:', r5.passed ? '✅' : '❌', 'size:', r5.size);

  // 生成合成预览图
  const frames = [
    ['single-stat', 'output/single-stat/fixed-75pct.mov', 37],
    ['data-compare', 'output/data-compare/fixed-compare.mov', 37],
    ['quote-callout', 'output/quote-callout/fixed-quote.mov', 37],
    ['trend-ratio', 'output/trend-ratio/fixed-trend.mov', 37],
    ['data-to-conclusion', 'output/data-to-conclusion/fixed-conclusion.mov', 37],
  ];
  
  const outDir = 'output/acceptance-frames';
  fs.mkdirSync(outDir, { recursive: true });
  
  frames.forEach(([name, mov, frameNum]) => {
    const outPath = path.join(outDir, `${name}-on-blue.png`);
    const cmd = `"${FFMPEG}" -y -f lavfi -i "color=c=0x223344:s=1080x1700:d=1:r=25" -i "${mov}" -filter_complex "[0:v][1:v]overlay=0:0:enable='eq(n,${frameNum})'" -frames:v 1 "${outPath}"`;
    try {
      execSync(cmd, { stdio: 'pipe' });
      const size = fs.statSync(outPath).size;
      console.log(`  ${name} 预览图: ${(size/1024).toFixed(0)}KB`);
    } catch(e) {
      console.log(`  ${name} 预览图生成失败`);
    }
  });
  
  console.log('\n所有5个金标准模板渲染完成！');
}
test().catch(e => console.error('失败:', e));
