const fs = require('fs');
const html = fs.readFileSync('/Users/xiongchangjiang/coding/trae_solo_x/ai_career_copilot/index.html', 'utf-8');
const m = html.match(/<script>([\s\S]*?)<\/script>/);

// 语法检查
try {
    new Function(m[1]);
    console.log('✅ JS 语法检查通过');
} catch(e) {
    console.log('❌ JS 语法错误:', e.message);
    process.exit(1);
}

const endIdx = m[1].indexOf('// 加载动画');
const coreCode = m[1].substring(0, endIdx);

const testCode = `
${coreCode}

console.log('\\n===== 复现用户场景 =====');
// 模拟用户截图中的简历
const resume = '3年前端开发经验，熟练使用 React、Vue、TypeScript，熟悉 Webpack 和前端工程化。有独立项目经验。';
// 模拟用户截图中的 JD
const jd = '任职要求: 1. 熟练掌握 php、java、rocketmq 2. 熟悉后端性能优化 3. 有大型后端项目架构经验';
const template = JOB_TEMPLATES.frontend;

// 1) 检查 JD 提取
const extracted = extractSkillsFromJD(jd);
console.log('提取到的技能:', extracted.join(', '));

// 2) 生成匹配结果
const matches = generateJDMatch(jd, template, resume);
console.log('匹配结果:');
if (matches) {
    const matched = matches.filter(m => m.matched);
    const unmatched = matches.filter(m => !m.matched);
    const rate = Math.round((matched.length / matches.length) * 100);
    console.log('  总数:', matches.length, ' 已匹配:', matched.length, '(', matched.map(m=>m.skill).join('/'), ') 未匹配:', unmatched.length, '(', unmatched.map(m=>m.skill).join('/'), ') 匹配率:', rate + '%');
} else {
    console.log('  返回 null');
}

console.log('\\n===== 其他常见场景测试 =====');

// 场景 A: 后端 JD + 后端简历（大量匹配）
const resumeA = '5年Java后端经验，熟悉 Spring Boot、MySQL、Redis、Kafka、Docker、微服务架构';
const jdA = '任职要求：1. 熟练掌握 Java、Spring Boot 2. 熟悉 MySQL、Redis 3. 有微服务、Kafka 经验 4. 会 Docker 和 Kubernetes 优先';
const rA = generateJDMatch(jdA, JOB_TEMPLATES.backend, resumeA);
if (rA) {
    const matchedA = rA.filter(m=>m.matched);
    console.log('场景A (后端+后端JD): 匹配率=' + Math.round(matchedA.length/rA.length*100) + '% 已匹配=' + matchedA.map(m=>m.skill).join('/'));
} else {
    console.log('场景A: 返回 null ❌');
}

// 场景 B: 产品 JD + 产品经理简历
const resumeB = '3年产品经理经验，负责用户调研、需求分析、PRD撰写，熟悉数据分析';
const jdB = '任职要求：1. 熟练使用 Axure、Figma 2. 有用户调研、数据分析经验 3. 能独立撰写 PRD 4. 有 0-1 项目经验';
const rB = generateJDMatch(jdB, JOB_TEMPLATES.product, resumeB);
if (rB) {
    const matchedB = rB.filter(m=>m.matched);
    console.log('场景B (产品+产品JD): 匹配率=' + Math.round(matchedB.length/rB.length*100) + '% 已匹配=' + matchedB.map(m=>m.skill).join('/'));
} else {
    console.log('场景B: 返回 null ❌');
}

// 场景 C: 完全不匹配（前端JD + 后端简历）
const resumeC = '3年Java后端，熟悉 Spring、MySQL';
const jdC = '任职要求：1. 熟练使用 React、TypeScript、Webpack 5 2. 熟悉前端性能优化 3. 有大型前端项目经验';
const rC = generateJDMatch(jdC, JOB_TEMPLATES.frontend, resumeC);
if (rC) {
    const matchedC = rC.filter(m=>m.matched);
    console.log('场景C (后端简历+前端JD): 匹配率=' + Math.round(matchedC.length/rC.length*100) + '% 总数=' + rC.length + ' 已匹配=' + matchedC.map(m=>m.skill).join('/'));
} else {
    console.log('场景C: 返回 null ❌');
}

// 场景 D: 验证去重（Node.js 和 Node 不应重复）
const jdD = '熟悉 Node.js、Node、前端工程化';
const rD = generateJDMatch(jdD, JOB_TEMPLATES.frontend, '熟悉 Node.js 和前端工程化');
console.log('场景D (去重): 技能数=' + (rD ? rD.length : 0) + ' 详情=' + (rD ? rD.map(m=>m.skill).join('/') : 'null'));

console.log('\\n===== 渲染卡片测试 =====');
const cardHtml = renderJDMatchCard(matches, jd);
console.log('卡片包含 "JD 技能匹配":', cardHtml.includes('JD 技能匹配') ? '✅' : '❌');
console.log('卡片包含匹配率数字:', /\\d+%/.test(cardHtml) ? '✅' : '❌');
console.log('卡片包含 "需要补充":', cardHtml.includes('需要补充') ? '✅' : '❌');
console.log('卡片包含 "已具备":', cardHtml.includes('已具备') ? '✅' : '❌（若全部未匹配则正常）');

console.log('\\n===== 测试完成 =====');
`;

try {
    new Function(testCode)();
} catch(e) {
    console.log('❌ 运行时错误:', e.message);
    console.log(e.stack);
}
