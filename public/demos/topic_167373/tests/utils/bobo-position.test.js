/**
 * 波波位置工具测试 (V0.2.0-fix)
 *
 * 覆盖：
 *  - calcScreenHeightRpx：px → rpx 换算
 *  - clampBoboPosition：边界保护（左右上下四个方向都裁剪到合法范围）
 *  - parseBoboPosition：合法 {x,y} / null / 缺字段 / 非有限值
 *  - pxToRpx：触摸坐标换算
 *  - moveDeltaToRpx：起止坐标 → 落点 rpx（模拟拖动）
 *  - isOverDragThreshold：8rpx 阈值判断
 */

if (typeof wx === 'undefined') {
  global.wx = {
    getSystemInfoSync: () => ({ platform: 'devtools', version: '2.32.0', windowWidth: 375, windowHeight: 667 })
  };
}

const boboPos = require('../../utils/bobo-position.js');

let passed = 0, failed = 0;
function assert(cond, name) {
  if (cond) { console.log('  ✓ ' + name); passed++; }
  else { console.error('  ✗ ' + name); failed++; }
}

console.log('\n=== V0.2.0-fix 波波位置工具测试 ===');

// ===== 1. 常量导出 =====
assert(boboPos.DEFAULT_BOBO_SIZE_RPX === 192, 'DEFAULT_BOBO_SIZE_RPX = 192（2 倍 FAB）');
assert(boboPos.SCREEN_WIDTH_RPX === 750, 'SCREEN_WIDTH_RPX = 750');
assert(boboPos.SAFE_TOP_RPX === 40, 'SAFE_TOP_RPX = 40（状态栏下方留白）');
assert(boboPos.SAFE_BOTTOM_RESERVE_RPX === 280, 'SAFE_BOTTOM_RESERVE_RPX = 280（tabBar + FAB + 缓冲）');

// ===== 2. calcScreenHeightRpx =====
const h1 = boboPos.calcScreenHeightRpx({ windowWidth: 375, windowHeight: 667 });
assert(h1 > 0, 'calcScreenHeightRpx 返回正数');
assert(Math.abs(h1 - 667 * 2) < 0.001, '375px 宽下，667px 高度对应 1334rpx');

const h2 = boboPos.calcScreenHeightRpx({ windowWidth: 750, windowHeight: 1624 });
assert(Math.abs(h2 - 1624) < 0.001, '750px 宽下，1px = 1rpx');

// 缺字段兜底
const h3 = boboPos.calcScreenHeightRpx({});
assert(h3 > 0, '缺字段时 calcScreenHeightRpx 兜底返回正数');

// ===== 3. clampBoboPosition - 默认 192rpx，screenH=1334rpx =====
// maxX = 750 - 192 = 558
// maxY = 1334 - 280 - 192 = 862
// minX = 0, minY = 40

// (1) 居中合法位置
const a = boboPos.clampBoboPosition(200, 400, { boboSize: 192, screenHeightRpx: 1334 });
assert(a.x === 200 && a.y === 400, '合法位置不裁剪 (200, 400)');

// (2) 越左 → 0
const b = boboPos.clampBoboPosition(-50, 100, { boboSize: 192, screenHeightRpx: 1334 });
assert(b.x === 0 && b.y === 100, 'x=-50 裁剪到 0');

// (3) 越右 → maxX=558
const c = boboPos.clampBoboPosition(800, 100, { boboSize: 192, screenHeightRpx: 1334 });
assert(c.x === 558 && c.y === 100, 'x=800 裁剪到 558（=750-192）');

// (4) 越上 → 40
const d = boboPos.clampBoboPosition(100, -10, { boboSize: 192, screenHeightRpx: 1334 });
assert(d.x === 100 && d.y === 40, 'y=-10 裁剪到 40');

// (5) 越下 → maxY=862
const e = boboPos.clampBoboPosition(100, 1200, { boboSize: 192, screenHeightRpx: 1334 });
assert(e.x === 100 && e.y === 862, 'y=1200 裁剪到 862（=1334-280-192）');

// (6) 四角同时越界 → 全部裁剪
const f = boboPos.clampBoboPosition(-999, 9999, { boboSize: 192, screenHeightRpx: 1334 });
assert(f.x === 0 && f.y === 862, '四角同时越界 → 左上 (0, 862)');

// (7) NaN/非数 → 0
const g = boboPos.clampBoboPosition(NaN, NaN, { boboSize: 192, screenHeightRpx: 1334 });
assert(g.x === 0 && g.y === 40, 'NaN 输入 → 0/40');

// (8) 不传 opts 走默认 192
const h = boboPos.clampBoboPosition(800, 200);
assert(typeof h.x === 'number' && typeof h.y === 'number', '无 opts 不报错');

// (9) 自定义 boboSize
const i = boboPos.clampBoboPosition(800, 100, { boboSize: 96, screenHeightRpx: 1334 });
assert(i.x === 654, 'boboSize=96 时 maxX=750-96=654');

// ===== 4. parseBoboPosition =====
assert(boboPos.parseBoboPosition(null) === null, 'null → null');
assert(boboPos.parseBoboPosition(undefined) === null, 'undefined → null');
assert(boboPos.parseBoboPosition('foo') === null, '字符串 → null');
assert(boboPos.parseBoboPosition(42) === null, '数字 → null');

const p1 = boboPos.parseBoboPosition({ x: 100, y: 200 });
assert(p1 && p1.x === 100 && p1.y === 200, '合法 {x:100,y:200}');

const p2 = boboPos.parseBoboPosition({ x: '100', y: '200' });
assert(p2 && p2.x === 100 && p2.y === 200, '字符串数字转 Number');

const p3 = boboPos.parseBoboPosition({ x: 100 });
assert(p3 === null, '缺 y 字段 → null');

const p4 = boboPos.parseBoboPosition({ x: NaN, y: 200 });
assert(p4 === null, 'x=NaN → null');

const p5 = boboPos.parseBoboPosition({ x: Infinity, y: 200 });
assert(p5 === null, 'x=Infinity → null');

const p6 = boboPos.parseBoboPosition({});
assert(p6 === null, '空对象 → null');

// ===== 5. pxToRpx =====
assert(boboPos.pxToRpx(187.5, 375) === 375, '375px 宽下 187.5px = 375rpx');
assert(boboPos.pxToRpx(0, 375) === 0, '0px → 0rpx');
assert(boboPos.pxToRpx(750, 750) === 750, '750px 宽下 1px = 1rpx');
assert(boboPos.pxToRpx(NaN, 375) === 0, 'NaN px → 0rpx');
assert(boboPos.pxToRpx(null, 375) === 0, 'null px → 0rpx');

// ===== 6. moveDeltaToRpx - 模拟拖动 =====
const r1 = boboPos.moveDeltaToRpx(0, 0, 50, 0, 100, 200, { boboSize: 192, screenHeightRpx: 1334, windowWidthPx: 375 });
// dx = (50) * (750/375) = 100rpx，newX = 100 + 100 = 200
assert(r1.x === 200 && r1.y === 200, '右拖 50px → x 增 100rpx');

const r2 = boboPos.moveDeltaToRpx(0, 0, 0, 50, 100, 200, { boboSize: 192, screenHeightRpx: 1334, windowWidthPx: 375 });
// dy = 50 * 2 = 100, newY = 200 + 100 = 300
assert(r2.x === 100 && r2.y === 300, '下拖 50px → y 增 100rpx');

// 越界：起 0,0 → 终 1000,1000
const r3 = boboPos.moveDeltaToRpx(0, 0, 1000, 1000, 0, 0, { boboSize: 192, screenHeightRpx: 1334, windowWidthPx: 375 });
// dx=2000rpx, dy=2000rpx → newX=2000, newY=2000 → 裁剪到 (558, 862)
assert(r3.x === 558 && r3.y === 862, '大幅拖动越界 → 裁剪到 (558, 862)');

// ===== 7. isOverDragThreshold =====
assert(boboPos.isOverDragThreshold(0, 0) === false, '(0,0) 不超阈值');
assert(boboPos.isOverDragThreshold(5, 5) === false, '(5,5) 不超 8rpx 阈值');
assert(boboPos.isOverDragThreshold(9, 0) === true, 'x=9 超阈值');
assert(boboPos.isOverDragThreshold(0, 9) === true, 'y=9 超阈值');
assert(boboPos.isOverDragThreshold(-9, 0) === true, 'x=-9（绝对值）超阈值');
assert(boboPos.isOverDragThreshold(100, 100) === true, '大幅位移超阈值');
assert(boboPos.isOverDragThreshold(5, 5, 3) === true, '自定义阈值 3rpx 时 (5,5) 超阈值');
assert(boboPos.isOverDragThreshold(2, 2, 3) === false, '自定义阈值 3rpx 时 (2,2) 不超');
assert(boboPos.isOverDragThreshold(NaN, NaN) === false, 'NaN 不超阈值');

// ===== 8. SVG 立绘资源（V0.2.0-fix 改用 SVG 后必需存在） =====
const fs = require('fs');
const path = require('path');
const imgDir = path.join(__dirname, '..', '..', 'images', 'bobo');
assert(fs.existsSync(path.join(imgDir, 'bobo-normal.svg')), 'images/bobo/bobo-normal.svg 存在');
assert(fs.existsSync(path.join(imgDir, 'bobo-happy.svg')), 'images/bobo/bobo-happy.svg 存在');
assert(fs.existsSync(path.join(imgDir, 'bobo-worried.svg')), 'images/bobo/bobo-worried.svg 存在');

// 资源必须是合法 XML（SVG）
function assertValidSvg(file) {
  const content = fs.readFileSync(file, 'utf-8');
  return content.indexOf('<svg') >= 0 && content.indexOf('</svg>') > 0;
}
assert(assertValidSvg(path.join(imgDir, 'bobo-normal.svg')), 'bobo-normal.svg 含 <svg> 根节点');
assert(assertValidSvg(path.join(imgDir, 'bobo-happy.svg')), 'bobo-happy.svg 含 <svg> 根节点');
assert(assertValidSvg(path.join(imgDir, 'bobo-worried.svg')), 'bobo-worried.svg 含 <svg> 根节点');

console.log('\n通过 ' + passed + ' / 失败 ' + failed);
process.exit(failed > 0 ? 1 : 0);
