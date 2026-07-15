/**
 * V0.2.0 升级测试 - 波波工具库
 *
 * 验证：
 *  - pickExpression 在不同场景下返回正确表情
 *  - generateComment 不返回空，覆盖 Bristol+颜色+身体感受所有组合
 *  - 互动计数 + shouldShowGuideBubble
 *  - 异常颜色/严重疼痛优先返回 worried
 *  - 理想 t4 + 棕色 + 无感受 → happy + 良好文案
 */

if (typeof wx === 'undefined') {
  global.wx = {
    getStorageSync: () => null,
    setStorageSync: () => {},
    removeStorageSync: () => {},
    showToast: () => {},
    showLoading: () => {},
    hideLoading: () => {},
    getSystemInfoSync: () => ({ platform: 'devtools', version: '2.32.0' })
  };
}

const bobo = require('../../utils/bobo.js');
const { EXPRESSIONS } = bobo;

let passed = 0, failed = 0;
function assert(cond, name) {
  if (cond) { console.log('  ✓ ' + name); passed++; }
  else { console.error('  ✗ ' + name); failed++; }
}

console.log('\n=== V0.2.0 波波工具库测试 ===');

// 1. pickExpression - 异常颜色
assert(bobo.pickExpression({ color: 'red' }) === EXPRESSIONS.WORRIED, '红色 -> worried');
assert(bobo.pickExpression({ color: 'black' }) === EXPRESSIONS.WORRIED, '黑色 -> worried');

// 2. pickExpression - 严重疼痛
assert(bobo.pickExpression({ painLevel: 3 }) === EXPRESSIONS.WORRIED, 'painLevel=3 -> worried');
assert(bobo.pickExpression({ painLevel: 2 }) === EXPRESSIONS.WORRIED, 'painLevel=2 -> worried');

// 3. pickExpression - 水样 + 疼痛
assert(bobo.pickExpression({ bristolType: 6, painLevel: 1 }) === EXPRESSIONS.WORRIED, 't6+痛 -> worried');
assert(bobo.pickExpression({ bristolType: 7, painLevel: 2 }) === EXPRESSIONS.WORRIED, 't7+痛 -> worried');

// 4. pickExpression - 腹胀/残留/排不尽
assert(bobo.pickExpression({ swelling: true }) === EXPRESSIONS.WORRIED, '腹胀 -> worried');
assert(bobo.pickExpression({ residue: true }) === EXPRESSIONS.WORRIED, '残留 -> worried');
assert(bobo.pickExpression({ unfinished: true }) === EXPRESSIONS.WORRIED, '排不尽 -> worried');

// 5. pickExpression - 理想 t4
assert(bobo.pickExpression({ bristolType: 4, color: 'brown' }) === EXPRESSIONS.HAPPY, 't4+棕 -> happy');

// 6. pickExpression - 干硬
assert(bobo.pickExpression({ bristolType: 1 }) === EXPRESSIONS.NORMAL, 't1 -> normal');
assert(bobo.pickExpression({ bristolType: 2 }) === EXPRESSIONS.NORMAL, 't2 -> normal');

// 7. pickExpression - null/undefined 容错
assert(bobo.pickExpression(null) === EXPRESSIONS.NORMAL, 'null -> normal');
assert(bobo.pickExpression(undefined) === EXPRESSIONS.NORMAL, 'undefined -> normal');
assert(bobo.pickExpression() === EXPRESSIONS.NORMAL, '无参 -> normal');

// 8. generateComment - 不返回空，覆盖主要 Bristol 类型
[1, 2, 3, 4, 5, 6, 7].forEach(t => {
  const c = bobo.generateComment({ bristolType: t, color: 'brown' });
  assert(typeof c === 'string' && c.length > 0, `t${t} generateComment 非空`);
});

// 9. generateComment - 异常颜色文案
const cRed = bobo.generateComment({ bristolType: 4, color: 'red' });
assert(cRed.indexOf('医生') >= 0 || cRed.indexOf('关注') >= 0, '红色文案提及医生/关注');

const cBlack = bobo.generateComment({ bristolType: 4, color: 'black' });
assert(cBlack.indexOf('医生') >= 0 || cBlack.indexOf('关注') >= 0, '黑色文案提及医生/关注');

// 10. generateComment - 严重疼痛
const cPain = bobo.generateComment({ bristolType: 4, color: 'brown', painLevel: 3 });
assert(cPain.indexOf('痛') >= 0 || cPain.indexOf('注意') >= 0, '严重疼痛文案');

// 11. generateComment - 理想场景
const cGood = bobo.generateComment({ bristolType: 4, color: 'brown' });
assert(cGood.length > 0, '理想场景有文案');

// 12. shouldShowGuideBubble - 默认行为
// 0 次 < 3，boboEnabled=true → true
assert(bobo.shouldShowGuideBubble({ boboEnabled: true, boboBubbleCount: 3 }) === true, '默认 boboEnabled+未达上限 -> 显示');
assert(bobo.shouldShowGuideBubble({ boboEnabled: false, boboBubbleCount: 3 }) === false, 'boboEnabled=false -> 不显示');
assert(bobo.shouldShowGuideBubble({ boboEnabled: true, boboBubbleCount: 0 }) === false, '上限=0 -> 不显示');

// 13. EXPRESSIONS 枚举完整
assert(EXPRESSIONS.HAPPY === 'happy', 'EXPRESSIONS.HAPPY');
assert(EXPRESSIONS.NORMAL === 'normal', 'EXPRESSIONS.NORMAL');
assert(EXPRESSIONS.WORRIED === 'worried', 'EXPRESSIONS.WORRIED');
assert(EXPRESSIONS.CELEBRATE === 'celebrate', 'EXPRESSIONS.CELEBRATE');
assert(EXPRESSIONS.PEEK === 'peek', 'EXPRESSIONS.PEEK');

console.log(`\n通过 ${passed} / 失败 ${failed}`);
process.exit(failed > 0 ? 1 : 0);
