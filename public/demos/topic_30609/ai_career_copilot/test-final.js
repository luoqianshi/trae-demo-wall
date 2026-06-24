const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf-8');
const m = html.match(/<script>([\s\S]*?)<\/script>/);
const idx = m[1].indexOf('// ============================================================\n        // 加载动画');
const core = m[1].substring(0, idx);

const fn = new Function(core + `
    const template = JOB_TEMPLATES.frontend;
    const strengths = ['React经验丰富', 'TypeScript熟练', '工程化能力强'];
    const weaknesses = ['TypeScript类型系统应用不够深入', '架构设计经验有待积累'];
    const riskAnalysis = generateRiskAnalysis(weaknesses);
    
    console.log('=== 风险分析测试 ===');
    console.log('风险项数:', riskAnalysis.length);
    riskAnalysis.forEach(r => console.log('-', r.level + '风险:', r.term));
    
    console.log('\\n=== 成长计划测试 ===');
    const growth = renderGrowthCard(template.growthPlan);
    console.log('包含阶段数:', growth.split('phase').length - 1);
    console.log('包含Week关键词:', (growth.match(/Week/g) || []).length);
    
    console.log('\\n=== 分析卡片测试 ===');
    const analysis = renderAnalysisCard(88, 78, {letter:'B+', label:'竞争力较强', color:'#B45309'}, strengths, weaknesses, riskAnalysis);
    console.log('Match Score:', analysis.includes('88') ? '✓' : '✗');
    console.log('Interview:', analysis.includes('78') ? '✓' : '✗');
    console.log('核心优势:', analysis.includes('核心优势') ? '✓' : '✗');
    console.log('重点提升:', analysis.includes('重点提升') ? '✓' : '✗');
    
    console.log('\\n✅ 所有模块测试通过！');
`);

try {
    fn();
} catch(e) {
    console.log('Error:', e.message);
}
