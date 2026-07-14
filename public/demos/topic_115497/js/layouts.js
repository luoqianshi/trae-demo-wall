// ============================================================
// js/layouts.js
// 中华文化粒子云引擎 · 6 种粒子布局算法
// 纯函数：输入 content 数组 + particleCount + options，输出 Float32Array(length = particleCount*3)
// 输出坐标为粒子目标位置（XYZ），供 Engine3D 的粒子系统 setTargets 使用
// ============================================================

// ==================== 内部工具 ====================

/**
 * 高斯随机数（Box-Muller）
 * @returns {number} 标准正态分布 N(0,1)
 */
function gaussian() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/**
 * 球面上均匀分布的随机点
 * @param {number} radius
 * @returns {{x:number,y:number,z:number}}
 */
function randomOnSphere(radius) {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  return {
    x: radius * Math.sin(phi) * Math.cos(theta),
    y: radius * Math.sin(phi) * Math.sin(theta),
    z: radius * Math.cos(phi)
  };
}

// ==================== galaxy：多臂螺旋星河 ====================

/**
 * galaxy 星河螺旋布局
 * 多臂螺旋（默认 4 臂），半径按对数螺旋增长，z 轴加高斯噪声模拟厚度
 * @param {Array} content 内容数组（仅用于决定粒子分配，本布局不直接使用文本）
 * @param {number} particleCount 粒子数
 * @param {object} [options]
 * @param {number} [options.arms=4]        螺旋臂数
 * @param {number} [options.maxRadius=600] 最大半径
 * @param {number} [options.thickness=40]  z 轴厚度（高斯 sigma）
 * @param {number} [options.spin=4.5]      螺旋紧密度（角速度系数）
 * @returns {Float32Array} 长度 = particleCount * 3
 */
function galaxy(content, particleCount, options = {}) {
  const arms      = Math.max(1, options.arms || 4);
  const maxRadius = options.maxRadius || 600;
  const thickness = options.thickness ?? 40;
  const spin      = options.spin || 4.5;

  const out = new Float32Array(particleCount * 3);
  const count = Math.max(1, particleCount);

  for (let i = 0; i < count; i++) {
    const t = i / count;                                   // 0 → 1
    // 对数螺旋半径：r = t * maxR * (1 + 0.2 * log(i))
    const r = t * maxRadius * (1 + 0.2 * Math.log(i + 1));
    // 第 i 个粒子分配到某条臂
    const arm = i % arms;
    const armOffset = (arm / arms) * Math.PI * 2;
    // 螺旋角：随 r 增大而旋转
    const angle = armOffset + (r / maxRadius) * spin * Math.PI;
    // 在臂上加少量切向抖动，让臂有羽化感
    const jitter = gaussian() * 0.06 * Math.PI;
    const a = angle + jitter;

    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    // z 轴高斯噪声模拟星河厚度
    const z = gaussian() * thickness * (1 - t * 0.5);

    out[i * 3]     = x;
    out[i * 3 + 1] = y;
    out[i * 3 + 2] = z;
  }
  return out;
}

// ==================== scroll：长卷 ====================

/**
 * scroll 长卷布局
 * 沿 X 轴一字排开（如长卷轴展开），Y 轴少量随机抖动，Z 轴分层（多层卷面，每层前后错开）
 * 适合宋词长卷
 * @param {Array} content
 * @param {number} particleCount
 * @param {object} [options]
 * @param {number} [options.length=1200]    卷轴总长（X 方向跨度）
 * @param {number} [options.yJitter=20]      Y 轴抖动幅度
 * @param {number} [options.layers=4]        卷面层数
 * @param {number} [options.layerGap=30]    层间 Z 距离
 * @returns {Float32Array}
 */
function scroll(content, particleCount, options = {}) {
  const length    = options.length || 1200;
  const yJitter   = options.yJitter ?? 20;
  const layers    = Math.max(1, options.layers || 4);
  const layerGap  = options.layerGap ?? 30;

  const out = new Float32Array(particleCount * 3);
  const count = Math.max(1, particleCount);

  for (let i = 0; i < count; i++) {
    const t = i / count;
    const x = (t - 0.5) * length;
    const y = gaussian() * yJitter;
    // 分层：根据 index % layers 决定 z
    const layer = i % layers;
    const z = (layer - (layers - 1) / 2) * layerGap + gaussian() * 4;

    out[i * 3]     = x;
    out[i * 3 + 1] = y;
    out[i * 3 + 2] = z;
  }
  return out;
}

// ==================== constellation：星座 ====================

/**
 * constellation 星座布局
 * 把 content 数组按聚类分组（每首诗一群粒子），每群在球面上随机选中心，再围绕中心做小范围散布
 * 群间留空隙
 * @param {Array} content
 * @param {number} particleCount
 * @param {object} [options]
 * @param {number} [options.sphereRadius=700] 星座中心所在球面半径
 * @param {number} [options.clusterRadius=80]  每群散布半径
 * @returns {Float32Array}
 */
function constellation(content, particleCount, options = {}) {
  const sphereRadius  = options.sphereRadius || 700;
  const clusterRadius = options.clusterRadius ?? 80;

  const out = new Float32Array(particleCount * 3);
  const count = Math.max(1, particleCount);

  // 群数 = content 长度（至少 1）
  const groups = Math.max(1, Array.isArray(content) ? content.length : 1);

  // 预先为每群选一个球面中心
  const centers = [];
  for (let g = 0; g < groups; g++) {
    centers.push(randomOnSphere(sphereRadius));
  }

  for (let i = 0; i < count; i++) {
    const g = i % groups;
    const c = centers[g];
    // 围绕中心做小范围散布（球内随机）
    const localR = Math.pow(Math.random(), 0.5) * clusterRadius;
    const local = randomOnSphere(localR);

    out[i * 3]     = c.x + local.x;
    out[i * 3 + 1] = c.y + local.y;
    out[i * 3 + 2] = c.z + local.z;
  }
  return out;
}

// ==================== grid：网格 ====================

/**
 * grid 网格布局
 * 二维平面网格（XZ 平面），行数 = sqrt(count)
 * 适合山海经异兽按方位排布，可选 options.bounds 划分九宫格
 * @param {Array} content
 * @param {number} particleCount
 * @param {object} [options]
 * @param {number} [options.spacing=20]  网格间距
 * @param {number[]} [options.bounds]    九宫格边界 [xMin,xMax,zMin,zMax]，传入则按 content 分区
 * @returns {Float32Array}
 */
function grid(content, particleCount, options = {}) {
  const spacing = options.spacing || 20;
  const bounds  = options.bounds || null;

  const out = new Float32Array(particleCount * 3);
  const count = Math.max(1, particleCount);

  // 若提供 bounds 且 content 有数据，按九宫格分区
  if (bounds && Array.isArray(content) && content.length > 0) {
    const [xMin, xMax, zMin, zMax] = bounds;
    const cellW = (xMax - xMin) / 3;
    const cellH = (zMax - zMin) / 3;
    const groups = content.length;
    // 每个内容项分配到一个九宫格
    for (let i = 0; i < count; i++) {
      const g = i % groups;
      const gx = g % 3;
      const gz = Math.floor(g / 3) % 3;
      const cx = xMin + (gx + 0.5) * cellW;
      const cz = zMin + (gz + 0.5) * cellH;
      // 在该格内随机散布
      const r = Math.sqrt(cellW * cellH) * 0.15;
      const local = randomOnSphere(r);
      out[i * 3]     = cx + local.x;
      out[i * 3 + 1] = 0 + local.y;
      out[i * 3 + 2] = cz + local.z;
    }
    return out;
  }

  // 默认：均匀网格
  const rows = Math.max(1, Math.round(Math.sqrt(count)));
  const cols = Math.ceil(count / rows);
  const totalW = (cols - 1) * spacing;
  const totalH = (rows - 1) * spacing;
  for (let i = 0; i < count; i++) {
    const r = Math.floor(i / cols);
    const c = i % cols;
    out[i * 3]     = c * spacing - totalW / 2;
    out[i * 3 + 1] = 0;
    out[i * 3 + 2] = r * spacing - totalH / 2;
  }
  return out;
}

// ==================== text：文字采样 ====================

/**
 * text 文字采样布局
 * 接收 content 数组每个 text 字段，用离屏 canvas 渲染文字（200px 加粗），getImageData 采样不透明像素
 * 把所有文字的采样点合并到 Float32Array（XY 平面 + 微小 Z 噪声）
 * 适合百家姓、兰亭等需要"粒子组成字"的场景
 * @param {Array} content
 * @param {number} particleCount
 * @param {object} [options]
 * @param {string}  [options.font='bold 200px "Ma Shan Zheng", serif'] 字体样式
 * @param {number}  [options.canvasSize=512]  离屏 canvas 边长
 * @param {number}  [options.scale=1.0]        采样点缩放（控制最终文字大小）
 * @returns {Float32Array}
 */
function text(content, particleCount, options = {}) {
  const font       = options.font || 'bold 200px "Ma Shan Zheng", serif';
  const canvasSize = options.canvasSize || 512;
  const scale      = options.scale || 1.0;

  const out = new Float32Array(particleCount * 3);
  const count = Math.max(1, particleCount);

  // 收集所有要渲染的文字
  const texts = Array.isArray(content)
    ? content.map(c => (c && typeof c.text === 'string') ? c.text : '').filter(t => t.length > 0)
    : [];
  if (texts.length === 0) {
    // 无文本则退化为随机散点
    for (let i = 0; i < count; i++) {
      out[i * 3]     = (Math.random() - 0.5) * 400;
      out[i * 3 + 1] = (Math.random() - 0.5) * 400;
      out[i * 3 + 2] = 0;
    }
    return out;
  }

  // 离屏 canvas 渲染所有文字并采样
  const off = document.createElement('canvas');
  off.width = canvasSize;
  off.height = canvasSize;
  const ctx = off.getContext('2d', { willReadFrequently: true });
  ctx.clearRect(0, 0, canvasSize, canvasSize);
  ctx.fillStyle = '#fff';
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 多文字按行排列：每行一个字（或短句），垂直堆叠
  const lineHeight = canvasSize / (texts.length + 1);
  texts.forEach((t, idx) => {
    ctx.fillText(t, canvasSize / 2, (idx + 1) * lineHeight);
  });

  const imageData = ctx.getImageData(0, 0, canvasSize, canvasSize);
  const data = imageData.data;
  // 收集不透明像素点
  const points = [];
  const step = 3; // 采样步长（像素）
  for (let y = 0; y < canvasSize; y += step) {
    for (let x = 0; x < canvasSize; x += step) {
      const idx = (y * canvasSize + x) * 4 + 3; // alpha 通道
      if (data[idx] > 128) {
        points.push([x, y]);
      }
    }
  }

  if (points.length === 0) {
    // 兜底：随机散点
    for (let i = 0; i < count; i++) {
      out[i * 3]     = (Math.random() - 0.5) * 400;
      out[i * 3 + 1] = (Math.random() - 0.5) * 400;
      out[i * 3 + 2] = 0;
    }
    return out;
  }

  // 把 canvas 坐标映射到世界坐标（居中 + 缩放）
  // canvas [0,canvasSize] -> world [-W/2, W/2]
  const half = canvasSize / 2;
  for (let i = 0; i < count; i++) {
    const p = points[i % points.length];
    const jitterX = (Math.random() - 0.5) * 2;
    const jitterY = (Math.random() - 0.5) * 2;
    out[i * 3]     = (p[0] - half + jitterX) * scale;
    out[i * 3 + 1] = (half - p[1] + jitterY) * scale; // Y 轴翻转
    out[i * 3 + 2] = gaussian() * 4;                  // 微小 Z 噪声
  }
  return out;
}

// ==================== custom：自定义 ====================

/**
 * custom 自定义布局
 * 接收 options.targets 直接传入 Float32Array，做简单校验后透传
 * 供 Task 6「自定义输入」使用
 * @param {Array} content
 * @param {number} particleCount
 * @param {object} options
 * @param {Float32Array|number[]} options.targets 目标坐标数组（长度应 = particleCount*3）
 * @returns {Float32Array}
 */
function custom(content, particleCount, options = {}) {
  const targets = options.targets;
  if (!targets) {
    throw new Error('custom 布局需要 options.targets 参数');
  }
  // 转 Float32Array
  const arr = targets instanceof Float32Array ? targets : new Float32Array(targets);
  // 校验长度
  const expected = particleCount * 3;
  if (arr.length < expected) {
    throw new Error(`custom 布局 targets 长度不足：期望 ${expected}，实为 ${arr.length}`);
  }
  // 透传（截断到期望长度，保证调用方契约）
  if (arr.length === expected) return arr;
  return arr.slice(0, expected);
}

// ==================== 导出 ====================

export const Layouts = {
  galaxy,
  scroll,
  constellation,
  grid,
  text,
  custom
};

export { galaxy, scroll, constellation, grid, text, custom };

// 功能描述：中华文化粒子云引擎的 6 种粒子布局算法模块。导出 Layouts 对象（含 galaxy/scroll/constellation/grid/text/custom 六个纯函数），每个函数签名 (content, particleCount, options) => Float32Array(length = particleCount*3)，输出 XYZ 三维坐标供 Engine3D 粒子系统 setTargets 使用。galaxy 多臂对数螺旋星河；scroll 长卷沿 X 轴展开分层；constellation 按 content 群聚球面星座；grid 二维网格（可选九宫格 bounds）；text 离屏 canvas 渲染文字并采样不透明像素组字；custom 直接透传 options.targets。内部封装 Box-Muller 高斯随机与球面均匀采样工具，全部无副作用便于测试。
