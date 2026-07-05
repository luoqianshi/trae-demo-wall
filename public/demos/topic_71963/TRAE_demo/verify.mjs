/**
 * 验收脚本 — 多职业系统 + 暴击 + 恶龙强化
 * 纯 Node.js 实现，无需外部依赖。
 *
 * 用法: node verify.mjs
 */

import { readFileSync } from 'fs';

// ── 统计 ────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

function check(description, condition) {
    if (condition) {
        console.log(`  ✅ ${description}`);
        passed++;
    } else {
        console.log(`  ❌ ${description}`);
        failed++;
    }
}

// ── 1. 读取源码 ───────────────────────────────────────────
const html = readFileSync('index.html', 'utf-8');
let cssExists = false;
try { readFileSync('style.css', 'utf-8'); cssExists = true; } catch {}

const jsCode = readFileSync('game.js', 'utf-8');

// ── 2. 构建 Mock 浏览器环境 ─────────────────────────────────────
function createMockElement(id, tagName = 'button') {
    return {
        id,
        tagName: tagName.toUpperCase(),
        disabled: false,
        classList: {
            _list: [],
            add(cls) { if (!this._list.includes(cls)) this._list.push(cls); },
            remove(cls) { this._list = this._list.filter(c => c !== cls); },
            contains(cls) { return this._list.includes(cls); }
        },
        innerHTML: '',
        _listeners: {},
        addEventListener(event, fn) {
            this._listeners[event] = this._listeners[event] || [];
            this._listeners[event].push(fn);
        },
        click() {
            (this._listeners['click'] || []).forEach(fn => fn());
        }
    };
}

const mockCanvas = {
    width: 800,
    height: 500,
    getContext() { return mockCtx; }
};

const mockCtx = {
    _calls: [],
    clearRect(x, y, w, h) { this._calls.push(['clearRect', x, y, w, h]); },
    fillText(text, x, y) { this._calls.push(['fillText', text, x, y]); },
    fillRect(x, y, w, h) { this._calls.push(['fillRect', x, y, w, h]); },
    beginPath() { this._calls.push(['beginPath']); },
    fill() { this._calls.push(['fill']); },
    stroke() { this._calls.push(['stroke']); },
    moveTo() {},
    lineTo() {},
    closePath() {},
    arc() { this._calls.push(['arc']); },
    ellipse() { this._calls.push(['ellipse']); },
    save() {},
    restore() {},
    translate() {},
    scale() {},
    createLinearGradient() { return { addColorStop() {} }; },
    createRadialGradient() { return { addColorStop() {} }; },
    roundRect() { this._calls.push(['roundRect']); },
    set fillStyle(v) { this._fillStyle = v; },
    get fillStyle() { return this._fillStyle; },
    set font(v) { this._font = v; },
    get font() { return this._font; },
    set textAlign(v) { this._textAlign = v; },
    get textAlign() { return this._textAlign; },
    set textBaseline(v) { this._textBaseline = v; },
    get textBaseline() { return this._textBaseline; },
    set strokeStyle(v) { this._strokeStyle = v; },
    set lineWidth(v) { this._lineWidth = v; },
    set globalAlpha(v) { this._globalAlpha = v; },
    get globalAlpha() { return this._globalAlpha; },
    reset() { this._calls = []; }
};

const mockLogContent = { innerHTML: '' };
const mockClassBtns = [0, 1, 2, 3].map(i => createMockElement('classBtn' + i));
const mockSkillBtns = [0, 1, 2, 3].map(i => createMockElement('skillBtn' + i));
const mockResetBtn = createMockElement('resetBtn');

const mockDocument = {
    getElementById(id) {
        if (id === 'gameCanvas') return mockCanvas;
        if (id === 'resetBtn') return mockResetBtn;
        if (id === 'logContent') return mockLogContent;
        const classMatch = id.match(/^classBtn(\d)$/);
        if (classMatch) return mockClassBtns[parseInt(classMatch[1])];
        const skillMatch = id.match(/^skillBtn(\d)$/);
        if (skillMatch) return mockSkillBtns[parseInt(skillMatch[1])];
        return null;
    }
};

// ── 3. 执行游戏代码 ─────────────────────────────────────────────
import vm from 'vm';

let pendingTimeout = null;
const mockSetTimeout = (fn, ms) => {
    pendingTimeout = fn;
    return 0;
};
const flushTimeout = () => {
    if (pendingTimeout) {
        const cb = pendingTimeout;
        pendingTimeout = null;
        cb();
    }
};

const sandbox = {
    document: mockDocument,
    setTimeout: mockSetTimeout,
    Math,
    console,
    gameState: undefined,
    getPlayer: undefined,
    switchClass: undefined,
    playerAction: undefined,
    enemyTurn: undefined,
    checkGameOver: undefined,
    render: undefined,
    resetGame: undefined,
    tryCrit: undefined,
    addLog: undefined,
    updateButtons: undefined,
    updateLogUI: undefined,
    updateClassButtons: undefined,
    updateSkillButtons: undefined,
    regenMp: undefined,
    cloneClassDefs: undefined,
    CLASS_DEFS: undefined,
    canvas: mockCanvas,
    ctx: mockCtx,
    classBtns: mockClassBtns,
    skillBtns: mockSkillBtns,
    resetBtn: mockResetBtn,
    logContent: mockLogContent,
};

vm.createContext(sandbox);

const adaptedCode = jsCode
    .replace(/\bconst\b/g, 'var ')
    .replace(/\blet\b/g, 'var ');

try {
    vm.runInContext(adaptedCode, sandbox);
} catch (e) {
    console.error('执行游戏代码时出错:', e.message);
    console.error(e.stack);
    process.exit(1);
}

const gameState = sandbox.gameState;
const getPlayer = sandbox.getPlayer;
const switchClass = sandbox.switchClass;
const playerAction = sandbox.playerAction;
const enemyTurn = sandbox.enemyTurn;
const checkGameOver = sandbox.checkGameOver;
const render = sandbox.render;
const resetGame = sandbox.resetGame;
const tryCrit = sandbox.tryCrit;
const addLog = sandbox.addLog;
const updateButtons = sandbox.updateButtons;
const regenMp = sandbox.regenMp;
const CLASS_DEFS = sandbox.CLASS_DEFS;

// ── 4. 开始验收 ─────────────────────────────────────────────────
console.log('\n═══════════════════════════════════════════');
console.log('  多职业 + 暴击系统 — 验收报告');
console.log('═══════════════════════════════════════════\n');

// ── 项目结构 ────────────────────────────────────────────────────
console.log('📁 项目结构');
check('index.html 存在', html.length > 0);
check('style.css 存在', cssExists);
check('game.js 存在', jsCode.length > 0);
check('index.html 引用外部 CSS', html.includes('style.css'));
check('index.html 引用外部 JS', html.includes('game.js'));

// ── 职业定义 ────────────────────────────────────────────────────
console.log('\n🎭 职业定义');
check('CLASS_DEFS 定义了 4 个职业', CLASS_DEFS.length === 4);
check('职业 0: 战士 (HP=150, MP=60, crit=15%)',
    CLASS_DEFS[0].name === '战士' && CLASS_DEFS[0].maxHp === 150 && CLASS_DEFS[0].maxMp === 60 && CLASS_DEFS[0].critChance === 0.15);
check('职业 1: 法师 (HP=80, MP=150, crit=25%)',
    CLASS_DEFS[1].name === '法师' && CLASS_DEFS[1].maxHp === 80 && CLASS_DEFS[1].maxMp === 150 && CLASS_DEFS[1].critChance === 0.25);
check('职业 2: 牧师 (HP=100, MP=120, crit=10%)',
    CLASS_DEFS[2].name === '牧师' && CLASS_DEFS[2].maxHp === 100 && CLASS_DEFS[2].maxMp === 120 && CLASS_DEFS[2].critChance === 0.10);
check('职业 3: 盗贼 (HP=90, MP=80, crit=30%)',
    CLASS_DEFS[3].name === '盗贼' && CLASS_DEFS[3].maxHp === 90 && CLASS_DEFS[3].maxMp === 80 && CLASS_DEFS[3].critChance === 0.30);
check('每个职业有 4 个技能', CLASS_DEFS.every(c => c.skills.length === 4));

// ── 3. 核心机制 ─────────────────────────────────────────────────
console.log('\n⚙️  核心机制');

// 3.1 战斗循环
console.log('  3.1 战斗循环');
check('isPlayerTurn 初始为 true', gameState.isPlayerTurn === true);
check('currentClass 初始为 0', gameState.currentClass === 0);
check('4 个职业按钮均存在', mockClassBtns.every(b => b !== null));
check('4 个技能按钮均存在', mockSkillBtns.every(b => b !== null));
check('重置按钮存在', mockResetBtn !== null);
check('Canvas 元素存在', mockCanvas !== null);

// 3.2 属性与数值
console.log('  3.2 属性与数值');
const player = getPlayer();
check('初始职业为战士', player.name === '战士');
check('战士 HP 上限 = 150', player.maxHp === 150);
check('战士初始 HP = 150', player.hp === 150);
check('战士 MP 上限 = 60', player.maxMp === 60);
check('战士初始 MP = 60', player.mp === 60);
check('恶龙 HP 上限 = 300', gameState.enemy.maxHp === 300);
check('恶龙初始 HP = 300', gameState.enemy.hp === 300);
check('恶龙 MP 上限 = 150', gameState.enemy.maxMp === 150);
check('恶龙初始 MP = 150', gameState.enemy.mp === 150);
check('恶龙暴击率 = 10%', gameState.enemy.critChance === 0.10);

// 3.3 胜负判定
console.log('  3.3 胜负判定');

resetGame();
gameState.enemy.hp = 0;
const result1 = checkGameOver();
check('敌人 HP ≤ 0 → checkGameOver 返回 true', result1 === true);
check('敌人 HP ≤ 0 → isGameOver = true', gameState.isGameOver === true);
check('敌人 HP ≤ 0 → 日志包含 "胜利"', gameState.logs.some(l => l.includes('胜利')));

resetGame();
getPlayer().hp = 0;
const result2 = checkGameOver();
check('玩家 HP ≤ 0 → checkGameOver 返回 true', result2 === true);
check('玩家 HP ≤ 0 → isGameOver = true', gameState.isGameOver === true);
check('玩家 HP ≤ 0 → 日志包含 "败北"', gameState.logs.some(l => l.includes('败北')));

resetGame();
getPlayer().hp = 50;
gameState.enemy.hp = 50;
const result3 = checkGameOver();
check('双方 HP > 0 → 返回 false', result3 === false);
check('双方 HP > 0 → isGameOver = false', gameState.isGameOver === false);

resetGame();
gameState.isGameOver = true;
updateButtons();
check('游戏结束后所有技能按钮禁用', mockSkillBtns.every(b => b.disabled === true));

// ── 职业切换 ────────────────────────────────────────────────────
console.log('\n🔄 职业切换');

resetGame();
switchClass(1);
check('切换到法师 (index 1)', gameState.currentClass === 1);
check('法师按钮高亮', mockClassBtns[1].classList.contains('class-btn-active'));
check('战士按钮取消高亮', !mockClassBtns[0].classList.contains('class-btn-active'));

switchClass(2);
check('切换到牧师 (index 2)', gameState.currentClass === 2);
const priest = getPlayer();
check('牧师 HP = 100', priest.maxHp === 100);
check('牧师 MP = 120', priest.maxMp === 120);

// 切换回战士
switchClass(0);
check('切回战士', gameState.currentClass === 0);

// ── 暴击系统 ────────────────────────────────────────────────────
console.log('\n💥 暴击系统');

let critCount = 0;
const critTrials = 2000;
for (let i = 0; i < critTrials; i++) {
    const result = tryCrit(gameState.classes[0]);
    if (result.isCrit) critCount++;
}
const critRatio = critCount / critTrials;
check(`战士暴击率 ≈ 15% (实测 ${(critRatio * 100).toFixed(1)}%)`, Math.abs(critRatio - 0.15) < 0.03);

// 盗贼暴击率
let rogueCrit = 0;
for (let i = 0; i < 2000; i++) {
    const result = tryCrit(gameState.classes[3]);
    if (result.isCrit) rogueCrit++;
}
const rogueRatio = rogueCrit / 2000;
check(`盗贼暴击率 ≈ 30% (实测 ${(rogueRatio * 100).toFixed(1)}%)`, Math.abs(rogueRatio - 0.30) < 0.04);

// ── 技能系统验证 ─────────────────────────────────────────────────
console.log('\n⚔️  技能系统验证');

// 战士技能 0
resetGame();
gameState.isPlayerTurn = true;
const enemyHpBefore0 = gameState.enemy.hp;
const playerMpBefore0 = getPlayer().mp;
playerAction(0);
const dmg0 = enemyHpBefore0 - gameState.enemy.hp;
const mpAfter0 = getPlayer().mp;
check('战士技能0(猛击): 敌人 HP 减少 (20-40)', dmg0 >= 20 && dmg0 <= 40);
check(`战士技能0: MP 不减少 (${playerMpBefore0}→${mpAfter0})`, mpAfter0 >= playerMpBefore0);
flushTimeout();

// 战士技能 1
resetGame();
gameState.isPlayerTurn = true;
const enemyHp1 = gameState.enemy.hp;
playerAction(1);
const dmg1 = enemyHp1 - gameState.enemy.hp;
check('战士技能1(旋风斩): 敌人 HP 减少 (35-70)', dmg1 >= 35 && dmg1 <= 70);
check('战士技能1: MP 消耗15 + 回复10', getPlayer().mp === 60 - 15 + 10);
flushTimeout();

// 战士技能 2 (治疗)
resetGame();
gameState.isPlayerTurn = true;
const warrior = getPlayer();
warrior.hp = 100;
playerAction(2);
check('战士技能2(战吼): HP +15', warrior.hp === 115);
check('战士技能2: MP 消耗 10 (含回复后 = 60)', warrior.mp === 60 - 10 + 10);
flushTimeout();

// 切换到法师测试
resetGame();
gameState.isPlayerTurn = true;
switchClass(1);
const mageEnemyHp = gameState.enemy.hp;
playerAction(0);
const mageDmg = mageEnemyHp - gameState.enemy.hp;
check('法师技能0(火球术): 敌人 HP 减少 (18-36)', mageDmg >= 18 && mageDmg <= 36);
flushTimeout();

// 切换到牧师测试
resetGame();
gameState.isPlayerTurn = true;
switchClass(2);
const priest2 = getPlayer();
priest2.hp = 70;
const priestHpBefore = priest2.hp;
playerAction(1);
const priestHeal = priest2.hp - priestHpBefore;
check('牧师技能1(圣光术): HP 恢复 (30-35)', priestHeal >= 30 && priestHeal <= 35);
check('牧师技能1: MP 消耗15 + 回复10', priest2.mp === 120 - 15 + 10);
flushTimeout();

// MP 不足
resetGame();
gameState.isPlayerTurn = true;
getPlayer().mp = 5;
updateButtons();
check('MP=5 时技能3(MP=25)禁用', mockSkillBtns[3].disabled === true);
check('MP=5 时技能0(MP=0)可用', mockSkillBtns[0].disabled === false);

// ── 渲染与交互 ─────────────────────────────────────────────────
console.log('\n🎨 渲染与交互');
check('render() 函数存在', typeof render === 'function');
check('getPlayer() 函数存在', typeof getPlayer === 'function');
check('switchClass() 函数存在', typeof switchClass === 'function');
check('tryCrit() 函数存在', typeof tryCrit === 'function');

resetGame();
mockCtx.reset();
render();
check('Canvas 宽度 = 800', mockCanvas.width === 800);
check('Canvas 高度 = 500', mockCanvas.height === 500);
check('render() 调用了 clearRect', mockCtx._calls.some(c => c[0] === 'clearRect'));

// 事件绑定
check('4 个职业按钮均注册了 click 监听', mockClassBtns.every(b => (b._listeners['click'] || []).length > 0));
check('4 个技能按钮均注册了 click 监听', mockSkillBtns.every(b => (b._listeners['click'] || []).length > 0));
check('resetBtn 注册了 click 监听', (mockResetBtn._listeners['click'] || []).length > 0);

// ── 重置功能 ─────────────────────────────────────────────────────
console.log('\n🔄 重置功能验证');

resetGame();
gameState.classes[0].hp = 50;
gameState.classes[0].mp = 20;
gameState.enemy.hp = 100;
gameState.enemy.mp = 50;
gameState.isGameOver = true;
gameState.logs = ['test1', 'test2'];
resetGame();
check('重置后战士 HP = 150', gameState.classes[0].hp === 150);
check('重置后战士 MP = 60', gameState.classes[0].mp === 60);
check('重置后恶龙 HP = 300', gameState.enemy.hp === 300);
check('重置后恶龙 MP = 150', gameState.enemy.mp === 150);
check('重置后 currentClass = 0', gameState.currentClass === 0);
check('重置后 isGameOver = false', gameState.isGameOver === false);
check('重置后 isPlayerTurn = true', gameState.isPlayerTurn === true);
check('重置后日志重新初始化', gameState.logs.length === 1 && gameState.logs[0].includes('新的战斗'));

// ── 日志系统 ─────────────────────────────────────────────────────
console.log('\n📜 日志系统验证');
resetGame();
for (let i = 0; i < 6; i++) {
    addLog(`测试日志 ${i + 1}`);
}
check('日志最多保留 4 条', gameState.logs.length === 4);
check('保留的是最新的 4 条', gameState.logs[0] === '测试日志 3');

// ── 回合流程 ─────────────────────────────────────────────────────
console.log('\n🔄 回合流程验证');
resetGame();
gameState.isPlayerTurn = true;
check('初始为玩家回合', gameState.isPlayerTurn === true);
playerAction(0);
check('玩家行动后 isPlayerTurn = false', gameState.isPlayerTurn === false);
flushTimeout();
check('电脑行动后 isPlayerTurn = true', gameState.isPlayerTurn === true);

// ── 电脑行动验证 ─────────────────────────────────────────────────
console.log('\n🤖 电脑行动验证');
resetGame();
gameState.isPlayerTurn = true;
gameState.enemy.hp = 200;
gameState.enemy.mp = 150;
const playerHpBefore = getPlayer().hp;
const enemyHpBefore = gameState.enemy.hp;
enemyTurn();
// 电脑行动后：玩家 HP 减少（攻击）或 恶龙 HP 增加（治疗）或 MP 变动
const effect = getPlayer().hp < playerHpBefore || gameState.enemy.hp > enemyHpBefore || gameState.enemy.mp !== 150;
check('电脑行动后产生效果', effect);

// ── 兼容性检查 ───────────────────────────────────────────────────
console.log('\n🌐 兼容性检查');
check('使用 HTML5 Canvas', html.includes('<canvas'));
check('使用 addEventListener', jsCode.includes('addEventListener'));
check('无外部依赖', !html.includes('cdn') && !html.includes('import '));
check('移动端 viewport', html.includes('viewport'));

// ── 总结 ─────────────────────────────────────────────────────────
console.log('\n═══════════════════════════════════════════');
const total = passed + failed;
console.log(`  验收结果: ${passed}/${total} 通过`);
if (failed > 0) {
    console.log(`  ❌ ${failed} 项未通过，请检查上述标记项。`);
    process.exit(1);
} else {
    console.log('  🎉 全部验收通过！');
}
console.log('═══════════════════════════════════════════\n');