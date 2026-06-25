const fs = require('fs');
const html = fs.readFileSync('/Users/xiongchangjiang/coding/trae_solo_x/ai_career_copilot/index.html', 'utf-8');
const m = html.match(/<script>([\s\S]*?)<\/script>/);
const endIdx = m[1].indexOf('// 加载动画');
const coreCode = m[1].substring(0, endIdx);

const testCode = `
${coreCode}

// 场景 E: 前端 + 前端JD（应该大量匹配）
console.log('===== 前端JD匹配测试 =====');
const resumeE = '3年前端经验，React、Vue、TypeScript，熟悉 Webpack，关注前端性能优化';
const jdE = '1. 熟练掌握 React、TypeScript、Webpack 5 2. 熟悉前端性能优化 3. 了解 Next.js 优先';
const rE = generateJDMatch(jdE, JOB_TEMPLATES.frontend, resumeE);
if (rE) {
    const matched = rE.filter(m=>m.matched);
    console.log('  总数:', rE.length, ' 已匹配:', matched.length, '(', matched.map(m=>m.skill).join('/'), ') 匹配率:', Math.round(matched.length/rE.length*100) + '%');
} else { console.log('  返回 null ❌'); }

// 场景 F: 混合 JD + 混合简历
console.log('\\n===== 混合JD匹配测试 =====');
const resumeF = '全栈工程师，3年经验，React、Node.js、MySQL、Docker，熟悉产品需求沟通';
const jdF = '1. 熟悉 React、TypeScript、Node.js 2. 有 MySQL 数据库优化经验 3. 了解 Docker、CI/CD 4. 有产品 sense';
const rF = generateJDMatch(jdF, JOB_TEMPLATES.frontend, resumeF);
if (rF) {
    const matched = rF.filter(m=>m.matched);
    console.log('  总数:', rF.length, ' 已匹配:', matched.length, '(', matched.map(m=>m.skill).join('/'), ') 未匹配:', rF.filter(m=>!m.matched).map(m=>m.skill).join('/'), ' 匹配率:', Math.round(matched.length/rF.length*100) + '%');
} else { console.log('  返回 null ❌'); }

// 场景 G: 空 JD
console.log('\\n===== 空 JD 测试 =====');
const rG = generateJDMatch('', JOB_TEMPLATES.frontend, 'React 经验');
console.log('  空 JD:', rG === null ? '✅ 返回 null' : '❌ 不该返回内容');

// 场景 H: 纯泛化 JD（全中文废话）
console.log('\\n===== 泛化JD测试 =====');
const rH = generateJDMatch('责任心强，自驱力好，有团队合作精神', JOB_TEMPLATES.general, '有责任心，自驱力强');
if (rH) {
    const matched = rH.filter(m=>m.matched);
    console.log('  总数:', rH.length, ' 已匹配:', matched.map(m=>m.skill).join('/'), ' 匹配率:', Math.round(matched.length/rH.length*100) + '%');
} else { console.log('  返回 null (JD 中未匹配到技能关键词)'); }

console.log('\\n✅ 全部完成');
`;

try { new Function(testCode)(); }
catch(e) { console.log('❌ Error:', e.message); console.log(e.stack); }
