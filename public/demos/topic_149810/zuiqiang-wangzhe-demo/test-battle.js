#!/usr/bin/env node
/**
 * ============================================================
 *  嘴强王者 · 典型对战过程测试脚本
 * ============================================================
 *
 *  本脚本在 Node.js 中模拟浏览器环境，加载游戏代码，
 *  自动执行一次完整的典型对战过程（战前会议→战斗→结束），
 *  并输出详细的对战报告和断言结果。
 *
 *  运行方式:  node test-battle.js
 *
 *  无需任何外部依赖，纯 Node.js 运行。
 * ============================================================
 */

const fs = require('fs');
const path = require('path');

// ================================================================
//  第一部分：Mock 浏览器环境
// ================================================================

/** 所有 mock DOM 元素的存储 */
const mockElements = new Map();

/** requestAnimationFrame 回调队列 */
let rafCallback = null;
let rafIdCounter = 0;

/** setTimeout 任务队列 */
const timeouts = [];

/**
 * Mock DOM 元素 - 模拟 HTMLElement 的关键行为
 */
class MockElement {
  constructor(id) {
    this.id = id || '';
    this._textContent = '';
    this._innerHTML = '';
    this.style = {};
    this._className = '';
    this.classList = {
      _set: new Set(),
      add: (...cs) => cs.forEach(c => this.classList._set.add(c)),
      remove: (...cs) => cs.forEach(c => this.classList._set.delete(c)),
      contains: c => this.classList._set.has(c),
      toggle: c => { this.classList._set.has(c) ? this.classList._set.delete(c) : this.classList._set.add(c); }
    };
    this._listeners = {};
    this.children = [];
    this.firstChild = null;
    this.value = '';
    this.disabled = false;
    this.onclick = null;
    this.scrollTop = 0;
    this.scrollHeight = 0;
    this.tagName = 'DIV';
    this.width = 900;
    this.height = 560;
    this._ctx = null;
  }

  get textContent() { return this._textContent; }
  set textContent(v) { this._textContent = String(v); }

  get innerHTML() { return this._innerHTML; }
  set innerHTML(v) {
    this._innerHTML = String(v);
    this.children = [];
    // 从 innerHTML 中提取 id 属性，自动创建对应的 mock 元素
    const re = /id="([^"]+)"/g;
    let m;
    while ((m = re.exec(this._innerHTML)) !== null) {
      if (!mockElements.has(m[1])) {
        mockElements.set(m[1], new MockElement(m[1]));
      }
    }
  }

  get className() { return this._className; }
  set className(v) {
    this._className = String(v);
    this.classList._set = new Set(String(v).split(/\s+/).filter(Boolean));
  }

  addEventListener(event, cb) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(cb);
  }

  removeEventListener(event, cb) {
    if (this._listeners[event]) {
      this._listeners[event] = this._listeners[event].filter(c => c !== cb);
    }
  }

  appendChild(child) {
    this.children.push(child);
    if (this.children.length === 1) this.firstChild = child;
    return child;
  }

  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx >= 0) {
      this.children.splice(idx, 1);
      this.firstChild = this.children.length > 0 ? this.children[0] : null;
    }
    return child;
  }

  /** 模拟点击事件 */
  click() {
    if (this.onclick) this.onclick({});
    if (this._listeners.click) {
      this._listeners.click.forEach(cb => cb({}));
    }
  }

  /** Canvas: 获取 2D 上下文 */
  getContext(type) {
    if (!this._ctx) this._ctx = createMockContext();
    return this._ctx;
  }
}

/**
 * 创建 Mock Canvas 2D 上下文
 * 所有渲染方法为空操作，仅维护属性状态
 */
function createMockContext() {
  const noop = () => {};
  const ctx = {
    clearRect: noop, fillRect: noop, strokeRect: noop,
    beginPath: noop, moveTo: noop, lineTo: noop, closePath: noop,
    fill: noop, stroke: noop, arc: noop, ellipse: noop,
    save: noop, restore: noop, translate: noop, rotate: noop,
    fillText: noop, strokeText: noop,
    measureText: () => ({ width: 10 }),
    setLineDash: noop,
    createRadialGradient: () => ({ addColorStop: noop }),
    createLinearGradient: () => ({ addColorStop: noop }),
    // 属性
    fillStyle: '', strokeStyle: '', lineWidth: 1,
    shadowColor: '', shadowBlur: 0, globalAlpha: 1,
    font: '', textAlign: 'left',
    imageSmoothingEnabled: true,
  };
  return ctx;
}

/** 获取或创建 mock 元素 */
function getElementById(id) {
  if (!mockElements.has(id)) {
    mockElements.set(id, new MockElement(id));
  }
  return mockElements.get(id);
}

/** 创建新元素 */
function createElement(tag) {
  const el = new MockElement();
  el.tagName = (tag || 'div').toUpperCase();
  return el;
}

// ================================================================
//  第二部分：构建全局环境并加载游戏代码
// ================================================================

// 预创建游戏需要的所有 DOM 元素
const ALL_ELEMENT_IDS = [
  'game', 'overlay', 'ovTitle', 'ovText', 'ovBtn',
  'btnMic', 'btnStart', 'btnPause', 'btnReset',
  'manualCmd', 'btnManual',
  'micDot', 'micText', 'permStatus', 'interim',
  'log',
  'redMin', 'blueMin', 'redUnits', 'blueUnits',
  'redKills', 'blueKills', 'redCmd', 'blueCmd',
  'redBaseHp', 'blueBaseHp', 'redHpFill', 'blueHpFill',
  'phaseTag',
  'meetingTranscript', 'meetingConfig', 'meetingActions',
  'meetingSpeaker', 'meetingHint',
  'stepRed', 'stepBlue', 'stepBattle',
];
for (const id of ALL_ELEMENT_IDS) {
  mockElements.set(id, new MockElement(id));
}

// 构建全局环境
const mockWindow = {
  document: {
    getElementById,
    createElement,
    querySelector: () => ({ appendChild: () => {}, remove: () => {} }),
    querySelectorAll: () => [],
  },
  requestAnimationFrame: (cb) => {
    rafCallback = cb;
    return ++rafIdCounter;
  },
  cancelAnimationFrame: () => {},
  addEventListener: () => {},
  SpeechRecognition: undefined,
  webkitSpeechRecognition: undefined,
  __reset: null,
  navigator: {
    mediaDevices: undefined,
  },
  setTimeout: (cb, ms) => {
    timeouts.push({ cb, ms, fired: false });
    return timeouts.length;
  },
  clearTimeout: () => {},
};

// 绑定到 global
global.document = mockWindow.document;
global.requestAnimationFrame = mockWindow.requestAnimationFrame;
global.cancelAnimationFrame = mockWindow.cancelAnimationFrame;
global.window = mockWindow;
global.navigator = mockWindow.navigator;
global.setTimeout = mockWindow.setTimeout;
global.clearTimeout = mockWindow.clearTimeout;
global.addEventListener = mockWindow.addEventListener;

// 提取游戏 JavaScript
const htmlPath = path.join(__dirname, 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
if (!scriptMatch) {
  console.error('错误：无法从 index.html 中提取 <script> 内容');
  process.exit(1);
}
let gameCode = scriptMatch[1];

// 修改 IIFE：将 (() => { ... })(); 改为 const __Game = (() => { ... return {...}; })();
// 在 IIFE 结尾的 })(); 之前插入 return 语句
gameCode = gameCode.replace(
  /^(\(\)\s*=>\s*\{)/,
  'const __Game = (function() {'
);

// 在结尾的 })(); 之前插入 return 语句
const exportBlock = `
  // === 测试导出 ===
  return {
    // 状态变量 (通过 getter 访问实时值)
    get phase() { return phase; },
    get paused() { return paused; },
    get frame() { return frame; },
    get units() { return units; },
    get kills() { return kills; },
    get minerals() { return minerals; },
    get meetingTurn() { return meetingTurn; },
    get meetingDone() { return meetingDone; },
    get meetingStrategies() { return meetingStrategies; },
    get teamFormations() { return teamFormations; },
    get teamSquads() { return teamSquads; },
    get buildQueue() { return buildQueue; },
    get rally() { return rally; },
    get lastCmd() { return lastCmd; },
    get projectiles() { return projectiles; },
    get effects() { return effects; },
    get stars() { return stars; },
    // 常量
    W, H, TEAMS, UNIT_TYPES, FORMATIONS, SQUAD_TACTICS, BASE_POS,
    // 核心函数
    enterMeeting, startBattle, resetGame, resetAll,
    handleVoiceInput, parseAndExecute,
    startMeetingTurn, finishMeetingTurn,
    setCommand, buildUnit, setFormation, addSquad,
    update, updateUI, countUnits, baseOf,
    executeCommand, previewCommands, parseCommand,
    applyFormation, applySquads,
    endGame, showOverlay, showMeetingOverlay,
    renderMeetingActions,
    makeUnit, dist, nearestEnemy, enemyTeam,
    cmdLabel, onKill, fireAt, moveTo,
    loop,
  };
`;

gameCode = gameCode.replace(
  /\}\)\(\)\s*;?\s*$/,
  exportBlock + '})();'
);

// 执行游戏代码
let Game;
try {
  Game = eval(gameCode);
} catch (err) {
  console.error('游戏代码加载失败:', err.message);
  console.error(err.stack);
  process.exit(1);
}

// ================================================================
//  第三部分：测试工具函数
// ================================================================

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function colorText(text, color) {
  return `${COLORS[color] || ''}${text}${COLORS.reset}`;
}

/** 测试日志缓冲 */
const testLog = [];

function log(msg, color) {
  const colored = color ? colorText(msg, color) : msg;
  console.log(colored);
  testLog.push(msg);
}

/** 断言计数 */
let assertions = { pass: 0, fail: 0 };
const failures = [];

function assert(condition, name) {
  if (condition) {
    assertions.pass++;
    log(`  ${colorText('PASS', 'green')} ${name}`, );
  } else {
    assertions.fail++;
    failures.push(name);
    log(`  ${colorText('FAIL', 'red')} ${name}`);
  }
}

function assertEqual(actual, expected, name) {
  const pass = actual === expected;
  if (pass) {
    assertions.pass++;
    log(`  ${colorText('PASS', 'green')} ${name} (${actual})`);
  } else {
    assertions.fail++;
    failures.push(name);
    log(`  ${colorText('FAIL', 'red')} ${name} (期望: ${expected}, 实际: ${actual})`);
  }
}

function assertTruthy(condition, name) {
  if (condition) {
    assertions.pass++;
    log(`  ${colorText('PASS', 'green')} ${name}`);
  } else {
    assertions.fail++;
    failures.push(name);
    log(`  ${colorText('FAIL', 'red')} ${name} (期望为真)`);
  }
}

/** 获取当前基地血量 */
function getBaseHp(team) {
  const base = Game.baseOf(team);
  return base ? Math.ceil(base.hp) : 0;
}

/** 获取当前单位数 */
function getUnitCount(team) {
  return Game.units.filter(u => u.team === team && u.type !== 'base' && u.hp > 0).length;
}

/** 获取非基地单位列表 */
function getCombatUnits(team) {
  return Game.units.filter(u => u.team === team && u.type !== 'base' && u.hp > 0);
}

// ================================================================
//  第四部分：典型对战流程
// ================================================================

log('');
log('============================================================', 'cyan');
log('  嘴强王者 · 典型对战过程测试', 'bright');
log('============================================================', 'cyan');
log('');

// ---- 阶段 0: 初始状态验证 ----
log('【阶段 0】初始状态验证', 'yellow');

assertEqual(Game.phase, 'menu', '初始阶段应为 menu');
assertTruthy(Game.units.length >= 2, '初始应有至少2个单位(双方基地)');
assertTruthy(getBaseHp('red') === 1000, '红方基地初始血量 1000');
assertTruthy(getBaseHp('blue') === 1000, '蓝方基地初始血量 1000');
assertEqual(getUnitCount('red'), 3, '红方初始3个机枪兵');
assertEqual(getUnitCount('blue'), 3, '蓝方初始3个机枪兵');
assertEqual(Game.minerals.red, 200, '红方初始矿物 200');
assertEqual(Game.minerals.blue, 200, '蓝方初始矿物 200');
assertEqual(Game.kills.red, 0, '红方初始击杀 0');
assertEqual(Game.kills.blue, 0, '蓝方初始击杀 0');
assertEqual(Game.teamFormations.red, 'line', '红方默认阵型 line');
assertEqual(Game.teamFormations.blue, 'line', '蓝方默认阵型 line');
log('');

// ---- 阶段 1: 进入战前会议 ----
log('【阶段 1】进入战前会议', 'yellow');

Game.enterMeeting();
assertEqual(Game.phase, 'meeting', '阶段应为 meeting');
assertTruthy(Game.meetingDone.red === false, '红方部署未完成');
assertTruthy(Game.meetingDone.blue === false, '蓝方部署未完成');
assertEqual(Game.meetingStrategies.red.length, 0, '红方策略列表为空');
assertEqual(Game.meetingStrategies.blue.length, 0, '蓝方策略列表为空');
log('');

// ---- 阶段 2: 红方战前部署 ----
log('【阶段 2】红方战前部署', 'yellow');

Game.startMeetingTurn('red');
assertEqual(Game.meetingTurn, 'red', '当前轮到红方部署');

// 红方指令 1: 设置楔形阵
Game.handleVoiceInput('红方阵型楔形');
assertEqual(Game.teamFormations.red, 'wedge', '红方阵型已设为 wedge');
log('  红方: "红方阵型楔形" → 阵型变为楔形阵');

// 红方指令 2: 创建前锋编队
Game.handleVoiceInput('红方编队前锋带机枪兵坦克进攻');
assertEqual(Game.teamSquads.red.length, 1, '红方创建1个编队(会议阶段)');
assertEqual(Game.teamSquads.red[0].name, '前锋', '编队名称为"前锋"');
assertEqual(Game.teamSquads.red[0].tactic, 'attack', '编队战术为 attack');
assertTruthy(Game.teamSquads.red[0].units.includes('marine'), '编队包含机枪兵');
assertTruthy(Game.teamSquads.red[0].units.includes('tank'), '编队包含坦克');
log('  红方: "红方编队前锋带机枪兵坦克进攻" → 创建前锋编队(机枪兵+坦克/进攻)');

// 红方指令 3: 造坦克
Game.handleVoiceInput('红方造坦克');
assertEqual(Game.meetingStrategies.red.length, 3, '红方记录3条策略');
log('  红方: "红方造坦克" → 记录建造坦克指令(开战时执行)');

// 红方部署完毕
Game.finishMeetingTurn();
assertTruthy(Game.meetingDone.red, '红方部署已完成');
assertEqual(Game.meetingTurn, null, 'meetingTurn 已重置');
log('  红方部署完毕');
log('');

// ---- 阶段 3: 蓝方战前部署 ----
log('【阶段 3】蓝方战前部署', 'yellow');

Game.startMeetingTurn('blue');
assertEqual(Game.meetingTurn, 'blue', '当前轮到蓝方部署');

// 蓝方指令 1: 设置横排阵
Game.handleVoiceInput('蓝方阵型横排');
assertEqual(Game.teamFormations.blue, 'line', '蓝方阵型已设为 line');
log('  蓝方: "蓝方阵型横排" → 阵型变为横排阵');

// 蓝方指令 2: 创建后卫编队
Game.handleVoiceInput('蓝方编队后卫带机枪兵防守');
assertEqual(Game.teamSquads.blue.length, 1, '蓝方创建1个编队');
assertEqual(Game.teamSquads.blue[0].name, '后卫', '编队名称为"后卫"');
assertEqual(Game.teamSquads.blue[0].tactic, 'defend', '编队战术为 defend');
log('  蓝方: "蓝方编队后卫带机枪兵防守" → 创建后卫编队(机枪兵/防守)');

// 蓝方指令 3: 造机枪兵
Game.handleVoiceInput('蓝方造机枪兵');
assertEqual(Game.meetingStrategies.blue.length, 3, '蓝方记录3条策略');
log('  蓝方: "蓝方造机枪兵" → 记录建造机枪兵指令(开战时执行)');

// 蓝方部署完毕
Game.finishMeetingTurn();
assertTruthy(Game.meetingDone.blue, '蓝方部署已完成');
assertEqual(Game.meetingTurn, null, 'meetingTurn 已重置');
log('  蓝方部署完毕');
log('');

// ---- 阶段 4: 开始战斗 ----
log('【阶段 4】开始战斗', 'yellow');

const mineralsBeforeRed = Game.minerals.red;
const mineralsBeforeBlue = Game.minerals.blue;

Game.startBattle();
assertEqual(Game.phase, 'battle', '阶段应为 battle');
assertTruthy(!Game.paused, '游戏未暂停');

// 验证战前指令已执行 (造坦克消耗150矿)
assertTruthy(Game.minerals.red < mineralsBeforeRed, '红方矿物已消耗(造坦克)');
assertTruthy(Game.minerals.blue < mineralsBeforeBlue, '蓝方矿物已消耗(造机枪兵)');

// 验证建造队列
assertTruthy(Game.buildQueue.red.length > 0, '红方有建造中的单位');
assertTruthy(Game.buildQueue.blue.length > 0, '蓝方有建造中的单位');

// 验证编队双重创建: 会议阶段创建1个，startBattle重复执行cmds又创建1个，共2个
assertEqual(Game.teamSquads.red.length, 2, '红方编队2个(会议+开战双重执行)');
assertEqual(Game.teamSquads.blue.length, 2, '蓝方编队2个(会议+开战双重执行)');
log('  战前部署指令已执行');
log(`  红方矿物: ${Math.floor(Game.minerals.red)} | 蓝方矿物: ${Math.floor(Game.minerals.blue)}`);
log(`  红方建造队列: ${Game.buildQueue.red.length} | 蓝方建造队列: ${Game.buildQueue.blue.length}`);
log('');

// ---- 阶段 5: 战斗过程模拟 ----
log('【阶段 5】战斗过程模拟', 'yellow');

/** 战斗命令调度表: [触发帧, 指令, 描述] */
const battleCommands = [
  [30,   '红方进攻',         '红方全军进攻'],
  [30,   '蓝方进攻',         '蓝方全军进攻'],
  [100,  '红方造机枪兵',     '红方建造机枪兵'],
  [100,  '蓝方造机枪兵',     '蓝方建造机枪兵'],
  [200,  '红方造坦克',       '红方建造坦克'],
  [200,  '蓝方造坦克',       '蓝方建造坦克'],
  [300,  '红方进攻',         '红方持续进攻'],
  [300,  '蓝方进攻',         '蓝方持续进攻'],
  [400,  '红方阵型紧凑',     '红方切换紧凑阵型'],
  [400,  '蓝方阵型散开',     '蓝方切换散开阵型'],
  [500,  '红方造机枪兵',     '红方补充机枪兵'],
  [500,  '蓝方造机枪兵',     '蓝方补充机枪兵'],
  [600,  '红方进攻',         '红方全军冲锋'],
  [600,  '蓝方进攻',         '蓝方全军冲锋'],
  [800,  '红方造坦克',       '红方补充坦克'],
  [800,  '蓝方造坦克',       '蓝方补充坦克'],
  [1000, '红方进攻',         '红方总攻'],
  [1000, '蓝方进攻',         '蓝方总攻'],
  [1200, '红方造机枪兵',     '红方持续暴兵'],
  [1200, '蓝方造机枪兵',     '蓝方持续暴兵'],
  [1400, '红方进攻',         '红方持续进攻'],
  [1400, '蓝方进攻',         '蓝方持续进攻'],
  [1600, '红方造坦克',       '红方补充重型单位'],
  [1600, '蓝方造坦克',       '蓝方补充重型单位'],
  [1800, '红方进攻',         '红方决死冲锋'],
  [1800, '蓝方进攻',         '蓝方决死冲锋'],
  [2000, '红方造机枪兵',     '红方最后增援'],
  [2000, '蓝方造机枪兵',     '蓝方最后增援'],
  [2200, '红方进攻',         '红方终局进攻'],
  [2200, '蓝方进攻',         '蓝方终局进攻'],
];

let cmdIndex = 0;
let battleEnded = false;
let winner = null;
let battleFrames = 0;
const MAX_FRAMES = 5000; // 安全上限: 防止死循环

/** 战斗快照记录 */
const snapshots = [];
function takeSnapshot(label) {
  snapshots.push({
    label,
    frame: Game.frame,
    redUnits: getUnitCount('red'),
    blueUnits: getUnitCount('blue'),
    redKills: Game.kills.red,
    blueKills: Game.kills.blue,
    redBaseHp: getBaseHp('red'),
    blueBaseHp: getBaseHp('blue'),
    redMin: Math.floor(Game.minerals.red),
    blueMin: Math.floor(Game.minerals.blue),
  });
}

takeSnapshot('战斗开始');

log('  帧数  | 红方单位 | 蓝方单位 | 红方击杀 | 蓝方击杀 | 红方基地 | 蓝方基地 | 事件');
  log('  ------|----------|----------|----------|----------|----------|----------|------');

let lastSnapshotFrame = 0;

// 运行战斗循环
while (Game.phase === 'battle' && battleFrames < MAX_FRAMES) {
  // 检查是否需要发送命令
  while (cmdIndex < battleCommands.length && Game.frame >= battleCommands[cmdIndex][0]) {
    const [frame, cmd, desc] = battleCommands[cmdIndex];
    Game.parseAndExecute(cmd);
    log(`  ${String(Game.frame).padStart(5)} |  ${String(getUnitCount('red')).padStart(7)} |  ${String(getUnitCount('blue')).padStart(7)} |  ${String(Game.kills.red).padStart(7)} |  ${String(Game.kills.blue).padStart(7)} |  ${String(getBaseHp('red')).padStart(7)} |  ${String(getBaseHp('blue')).padStart(7)} | ${desc}`);
    cmdIndex++;
  }

  // 每200帧记录一次快照
  if (Game.frame > 0 && Game.frame % 200 === 0 && Game.frame !== lastSnapshotFrame) {
    lastSnapshotFrame = Game.frame;
    takeSnapshot(`第${Game.frame}帧`);
  }

  // 执行一帧游戏逻辑
  Game.update();
  battleFrames++;

  // 检查游戏是否结束
  if (Game.phase === 'ended') {
    battleEnded = true;
    // 判断胜方
    if (getBaseHp('red') <= 0) winner = 'blue';
    else if (getBaseHp('blue') <= 0) winner = 'red';
    break;
  }
}

takeSnapshot('战斗结束');

if (!battleEnded) {
  log(`  ${colorText('警告: 战斗达到最大帧数上限未分出胜负', 'yellow')}`);
}

log('');

// ---- 阶段 6: 战斗结果报告 ----
log('【阶段 6】战斗结果报告', 'yellow');
log('');

if (winner) {
  const winName = Game.TEAMS[winner].name;
  log(`  ${colorText('胜利方: ' + winName, winner === 'red' ? 'red' : 'blue')}`);
} else {
  log(`  ${colorText('平局/未决出胜负', 'yellow')}`);
}

log('');
log('  最终状态:', 'bright');
log(`    战斗持续帧数: ${Game.frame}`);
log(`    红方击杀: ${Game.kills.red}  |  蓝方击杀: ${Game.kills.blue}`);
log(`    红方剩余单位: ${getUnitCount('red')}  |  蓝方剩余单位: ${getUnitCount('blue')}`);
log(`    红方基地血量: ${getBaseHp('red')}  |  蓝方基地血量: ${getBaseHp('blue')}`);
log(`    红方矿物: ${Math.floor(Game.minerals.red)}  |  蓝方矿物: ${Math.floor(Game.minerals.blue)}`);
log(`    红方阵型: ${Game.FORMATIONS[Game.teamFormations.red].name}  |  蓝方阵型: ${Game.FORMATIONS[Game.teamFormations.blue].name}`);
log(`    红方编队: ${Game.teamSquads.red.length}个  |  蓝方编队: ${Game.teamSquads.blue.length}个`);
log('');

// 快照表格
log('  战斗过程快照:', 'bright');
log('  ┌─────────────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┐');
log('  │  时间点     │ 帧数 │红单位│蓝单位│红击杀│蓝击杀│红基地│蓝基地│');
log('  ├─────────────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┤');
for (const s of snapshots) {
  log(`  │ ${s.label.padEnd(11)} │ ${String(s.frame).padStart(4)} │ ${String(s.redUnits).padStart(4)} │ ${String(s.blueUnits).padStart(4)} │ ${String(s.redKills).padStart(4)} │ ${String(s.blueKills).padStart(4)} │ ${String(s.redBaseHp).padStart(4)} │ ${String(s.blueBaseHp).padStart(4)} │`);
}
log('  └─────────────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┘');
log('');

// ---- 阶段 7: 断言验证 ----
log('【阶段 7】断言验证', 'yellow');

// 战斗流程断言
assertTruthy(battleFrames > 0, '战斗至少运行了1帧');
assertTruthy(Game.frame > 0, '游戏帧数已推进');

// 会议阶段验证
assertEqual(Game.meetingStrategies.red.length, 3, '红方战前部署3条指令');
assertEqual(Game.meetingStrategies.blue.length, 3, '蓝方战前部署3条指令');

// 阵型验证
assertEqual(Game.teamFormations.red, 'compact', '红方最终阵型为 compact (第400帧切换)');
assertEqual(Game.teamFormations.blue, 'spread', '蓝方最终阵型为 spread (第400帧切换)');

// 编队验证 (注意: 游戏在会议阶段和startBattle中各创建一次编队，共2个)
assertEqual(Game.teamSquads.red.length, 2, '红方2个编队(会议+开战各创建1次)');
assertEqual(Game.teamSquads.blue.length, 2, '蓝方2个编队(会议+开战各创建1次)');
assertEqual(Game.teamSquads.red[0].name, '前锋', '红方首个编队名"前锋"');
assertEqual(Game.teamSquads.blue[0].name, '后卫', '蓝方首个编队名"后卫"');

// 战斗结果验证
if (winner) {
  const loser = winner === 'red' ? 'blue' : 'red';
  assertEqual(getBaseHp(loser), 0, `败方(${loser})基地血量应为0`);
  assertTruthy(getBaseHp(winner) > 0, `胜方(${winner})基地血量应大于0`);
}

// 矿物经济验证
assertTruthy(Game.minerals.red >= 0, '红方矿物非负');
assertTruthy(Game.minerals.blue >= 0, '蓝方矿物非负');

// 击杀验证
assertTruthy(Game.kills.red + Game.kills.blue > 0, '双方总击杀应大于0(发生过战斗)');

// 指令解析验证
const testCmd = Game.parseCommand('红方进攻', null);
assertTruthy(testCmd !== null, '解析"红方进攻"返回非null');
assertEqual(testCmd.team, 'red', '"红方进攻"解析team为red');
assertEqual(testCmd.action, 'attack', '"红方进攻"解析action为attack');

const testCmd2 = Game.parseCommand('蓝方造坦克', null);
assertEqual(testCmd2.team, 'blue', '"蓝方造坦克"解析team为blue');
assertEqual(testCmd2.action, 'build', '"蓝方造坦克"解析action为build');
assertEqual(testCmd2.unit, 'tank', '"蓝方造坦克"解析unit为tank');

const testCmd3 = Game.parseCommand('红方阵型横排', null);
assertEqual(testCmd3.action, 'formation', '"红方阵型横排"解析action为formation');
assertEqual(testCmd3.formation, 'line', '"红方阵型横排"解析formation为line');

const testCmd4 = Game.parseCommand('红方编队突击带机枪兵坦克进攻', null);
assertEqual(testCmd4.action, 'squad', '编队指令解析action为squad');
assertEqual(testCmd4.squadName, '突击', '编队名称解析为"突击"');
assertTruthy(testCmd4.squadUnits.includes('tank'), '编队包含坦克');
assertEqual(testCmd4.tactic, 'attack', '编队战术为attack');

const testCmd5 = Game.parseCommand('停火', null);
assertEqual(testCmd5.team, 'both', '"停火"解析team为both');
assertEqual(testCmd5.action, 'hold', '"停火"解析action为hold');

log('');

// ---- 最终结果 ----
log('============================================================', 'cyan');
log('  测试结果汇总', 'bright');
log('============================================================', 'cyan');
log(`  通过: ${colorText(String(assertions.pass), 'green')}  |  失败: ${colorText(String(assertions.fail), assertions.fail > 0 ? 'red' : 'green')}`);
log(`  总断言数: ${assertions.pass + assertions.fail}`);
log('');

if (failures.length > 0) {
  log('  失败项:', 'red');
  for (const f of failures) {
    log(`    - ${f}`, 'red');
  }
  log('');
}

if (winner) {
  log(`  对战结果: ${colorText(Game.TEAMS[winner].name + ' 胜利', winner === 'red' ? 'red' : 'blue')} (持续 ${Game.frame} 帧)`);
} else {
  log(`  对战结果: ${colorText('未分出胜负', 'yellow')} (达到 ${MAX_FRAMES} 帧上限)`);
}

log('');
log('============================================================', 'cyan');

// 退出码: 有失败则返回1
process.exit(assertions.fail > 0 ? 1 : 0);
