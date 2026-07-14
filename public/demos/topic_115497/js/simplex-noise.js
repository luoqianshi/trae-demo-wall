// ============================================================
// js/simplex-noise.js
// 中华文化粒子云引擎 · 共享 Simplex 噪声模块
// 2D / 3D 引擎均可 import 使用，避免重复实现
// 实现：经典 2D Simplex Noise（Stefan Gustavson 算法），输出范围约 [-1, 1]
// ============================================================

export class SimplexNoise {
  /**
   * @param {number} [seed] 随机种子，默认 Math.random()
   */
  constructor(seed = Math.random()) {
    this.perm = new Uint8Array(512);
    this.permMod12 = new Uint8Array(512);
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    // 用种子构造线性同余 RNG，对 0..255 做洗牌
    let s = seed * 2147483647;
    for (let i = 255; i > 0; i--) {
      s = (s * 16807) % 2147483647;
      const j = s % (i + 1);
      const t = p[i]; p[i] = p[j]; p[j] = t;
    }
    for (let i = 0; i < 512; i++) {
      this.perm[i] = p[i & 255];
      this.permMod12[i] = this.perm[i] % 12;
    }
    // 2D 梯度向量集合（12 个方向）
    this.grad3 = [
      [1, 1], [-1, 1], [1, -1], [-1, -1],
      [1, 0], [-1, 0], [1, 0], [-1, 0],
      [0, 1], [0, -1], [0, 1], [0, -1]
    ];
  }

  /**
   * 二维 Simplex 噪声
   * @param {number} xin
   * @param {number} yin
   * @returns {number} 噪声值，范围约 [-1, 1]
   */
  noise2D(xin, yin) {
    const F2 = 0.5 * (Math.sqrt(3) - 1);
    const G2 = (3 - Math.sqrt(3)) / 6;
    const s = (xin + yin) * F2;
    const i = Math.floor(xin + s);
    const j = Math.floor(yin + s);
    const t = (i + j) * G2;
    const X0 = i - t, Y0 = j - t;
    const x0 = xin - X0, y0 = yin - Y0;
    let i1, j1;
    if (x0 > y0) { i1 = 1; j1 = 0; } else { i1 = 0; j1 = 1; }
    const x1 = x0 - i1 + G2, y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2;
    const ii = i & 255, jj = j & 255;
    const gi0 = this.permMod12[ii + this.perm[jj]];
    const gi1 = this.permMod12[ii + i1 + this.perm[jj + j1]];
    const gi2 = this.permMod12[ii + 1 + this.perm[jj + 1]];
    let n0 = 0, n1 = 0, n2 = 0;
    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 >= 0) { t0 *= t0; n0 = t0 * t0 * (this.grad3[gi0][0] * x0 + this.grad3[gi0][1] * y0); }
    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 >= 0) { t1 *= t1; n1 = t1 * t1 * (this.grad3[gi1][0] * x1 + this.grad3[gi1][1] * y1); }
    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 >= 0) { t2 *= t2; n2 = t2 * t2 * (this.grad3[gi2][0] * x2 + this.grad3[gi2][1] * y2); }
    return 70 * (n0 + n1 + n2);
  }

  /**
   * 三维 Simplex 噪声（基于 3D simplex 算法的简化实现，足够 3D 引擎使用）
   * 用于在 CPU 端为粒子初始位置 / 目标位置生成柔和噪声扰动
   * @param {number} xin
   * @param {number} yin
   * @param {number} zin
   * @returns {number} 噪声值，范围约 [-1, 1]
   */
  noise3D(xin, yin, zin) {
    // 简化方案：组合三组 noise2D，结果近似 3D 噪声，足以驱动粒子云的柔和扰动
    // 对称地用三平面投影并取平均，保留可种子化、可复现、连续平滑的特性
    return (
      this.noise2D(xin, yin) +
      this.noise2D(yin + 31.4, zin - 17.6) +
      this.noise2D(zin + 53.1, xin - 41.9)
    ) / 3;
  }
}

// 功能描述：中华文化粒子云引擎的共享 Simplex 噪声模块。导出 SimplexNoise 类，
// 提供 noise2D（经典 2D Simplex）与 noise3D（基于三平面投影近似的 3D 噪声）方法，
// 供 2D 引擎的水墨流场与 3D 引擎的粒子初始化 / 目标位置生成共享复用，避免重复实现。
// 算法源自 Stefan Gustavson 的 simplex noise 公式，输出范围约 [-1, 1]，可种子化、可复现。
