/* =========================================================
 * liquid-glass.js
 * 核心 SVG 渲染器：
 *   - 圆角矩形 SDF 计算每像素到边距离
 *   - Snell 定律物理折射剖面 (基于 archisvaze 思路)
 *   - Specular 高光贴图
 *   - 多节点 SVG 滤镜链 (blur -> displace -> saturate -> spec)
 *
 * 暴露 API:
 *   LiquidGlass.detect()       -> { svgBackdrop, webgl }
 *   LiquidGlass.svg(el, opts)  -> { destroy() }
 *   LiquidGlass.webgl(el, opts)-> 见 liquid-glass-webgl.js
 * ========================================================= */

(function (global) {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';
  const XLINK = 'http://www.w3.org/1999/xlink';

  /* ---------- 能力检测 ---------- */
  function detect() {
    const test = document.createElement('div');
    test.style.cssText = 'backdrop-filter: url(#x); -webkit-backdrop-filter: url(#x);';
    const svgBackdrop = !!(test.style.backdropFilter || test.style.webkitBackdropFilter);

    let webgl = false;
    try {
      const c = document.createElement('canvas');
      webgl = !!(c.getContext('webgl2') || c.getContext('webgl') || c.getContext('experimental-webgl'));
    } catch (e) { /* noop */ }

    return { svgBackdrop, webgl };
  }

  /* ---------- 数学工具 ---------- */
  const length = (x, y) => Math.sqrt(x * x + y * y);

  // 圆角矩形 SDF (按像素，居中坐标系)
  function roundedRectSDF(x, y, halfW, halfH, r) {
    const qx = Math.abs(x) - halfW + r;
    const qy = Math.abs(y) - halfH + r;
    return Math.min(Math.max(qx, qy), 0) + length(Math.max(qx, 0), Math.max(qy, 0)) - r;
  }

  // 凸 squircle 玻璃曲面
  const surfaceFn = (x) => Math.pow(1 - Math.pow(1 - x, 4), 0.25);

  // Snell 折射：返回折射光线
  function refract(nx, ny, eta) {
    const dot = ny;
    const k = 1 - eta * eta * (1 - dot * dot);
    if (k < 0) return null;
    const sq = Math.sqrt(k);
    return [-(eta * dot + sq) * nx, eta - (eta * dot + sq) * ny];
  }

  // 计算折射剖面：返回 length=samples 的偏移量数组
  function calcRefractionProfile(thick, bezel, ior, samples) {
    samples = samples || 128;
    const eta = 1 / ior;
    const profile = new Float64Array(samples);
    for (let i = 0; i < samples; i++) {
      const x = i / samples;
      const y = surfaceFn(x);
      const dx = x < 1 ? 0.0001 : -0.0001;
      const y2 = surfaceFn(x + dx);
      const deriv = (y2 - y) / dx;
      const mag = Math.sqrt(deriv * deriv + 1);
      const ref = refract(-deriv / mag, -1 / mag, eta);
      if (!ref) { profile[i] = 0; continue; }
      profile[i] = ref[0] * ((y * bezel + thick) / ref[1]);
    }
    return profile;
  }

  /* ---------- 生成置换贴图 ---------- */
  function buildDisplacementMap(w, h, radius, bezel, profile, maxDisp) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(w, h);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      d[i] = 128; d[i + 1] = 128; d[i + 2] = 0; d[i + 3] = 255;
    }
    const r = radius;
    const rSq = r * r;
    const r1Sq = (r + 1) ** 2;
    const rBSq = Math.max(r - bezel, 0) ** 2;
    const wB = w - r * 2;
    const hB = h - r * 2;
    const S = profile.length;

    for (let y1 = 0; y1 < h; y1++) {
      for (let x1 = 0; x1 < w; x1++) {
        // 将像素映射到"最近圆角中心"的相对坐标
        const x = x1 < r ? x1 - r : (x1 >= w - r ? x1 - r - wB : 0);
        const y = y1 < r ? y1 - r : (y1 >= h - r ? y1 - r - hB : 0);
        const dSq = x * x + y * y;
        if (dSq > r1Sq || dSq < rBSq) continue;
        const dist = Math.sqrt(dSq);
        const fromSide = r - dist;
        const op = dSq < rSq ? 1 : 1 - (dist - Math.sqrt(rSq)) / (Math.sqrt(r1Sq) - Math.sqrt(rSq));
        if (op <= 0 || dist === 0) continue;

        const cos = x / dist;
        const sin = y / dist;
        const bi = Math.min(((fromSide / bezel) * S) | 0, S - 1);
        const disp = profile[bi] || 0;
        const dX = (-cos * disp) / maxDisp;
        const dY = (-sin * disp) / maxDisp;
        const idx = (y1 * w + x1) * 4;
        d[idx]     = (128 + dX * 127 * op + 0.5) | 0;
        d[idx + 1] = (128 + dY * 127 * op + 0.5) | 0;
      }
    }
    ctx.putImageData(img, 0, 0);
    return c.toDataURL();
  }

  /* ---------- 生成 specular 高光贴图 ---------- */
  function buildSpecularMap(w, h, radius, bezel, angle) {
    angle = angle != null ? angle : Math.PI / 3;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(w, h);
    const d = img.data;
    d.fill(0);
    const r = radius;
    const rSq = r * r;
    const r1Sq = (r + 1) ** 2;
    const rBSq = Math.max(r - bezel, 0) ** 2;
    const wB = w - r * 2;
    const hB = h - r * 2;
    const sv = [Math.cos(angle), Math.sin(angle)];

    for (let y1 = 0; y1 < h; y1++) {
      for (let x1 = 0; x1 < w; x1++) {
        const x = x1 < r ? x1 - r : (x1 >= w - r ? x1 - r - wB : 0);
        const y = y1 < r ? y1 - r : (y1 >= h - r ? y1 - r - hB : 0);
        const dSq = x * x + y * y;
        if (dSq > r1Sq || dSq < rBSq) continue;
        const dist = Math.sqrt(dSq);
        const fromSide = r - dist;
        const op = dSq < rSq ? 1 : 1 - (dist - Math.sqrt(rSq)) / (Math.sqrt(r1Sq) - Math.sqrt(rSq));
        if (op <= 0 || dist === 0) continue;
        const cos = x / dist;
        const sin = -y / dist;
        const dot = Math.abs(cos * sv[0] + sin * sv[1]);
        const edge = Math.sqrt(Math.max(0, 1 - (1 - fromSide) ** 2));
        const coeff = dot * edge;
        const col = (255 * coeff) | 0;
        const alpha = (col * coeff * op) | 0;
        const idx = (y1 * w + x1) * 4;
        d[idx] = col; d[idx + 1] = col; d[idx + 2] = col; d[idx + 3] = alpha;
      }
    }
    ctx.putImageData(img, 0, 0);
    return c.toDataURL();
  }

  /* ---------- SVG 渲染器 ---------- */
  function createSvgInstance(el, opts) {
    opts = Object.assign({
      displace: 18,
      bezel: 40,
      thick: 80,
      ior: 1.8,
      blur: 0.6,
      saturate: 1.6,
      specular: 0.55,
    }, opts || {});

    const rect = el.getBoundingClientRect();
    const w = Math.max(2, Math.round(rect.width));
    const h = Math.max(2, Math.round(rect.height));
    const radius = +el.dataset.radius || 28;
    const bezel = Math.min(opts.bezel, radius - 1, Math.min(w, h) / 2 - 1);

    // 1. 折射剖面
    const profile = calcRefractionProfile(opts.thick, bezel, opts.ior, 128);
    const maxDisp = Math.max.apply(null, Array.from(profile).map(Math.abs)) || 1;

    // 2. 生成两张贴图
    const dispUrl = buildDisplacementMap(w, h, radius, bezel, profile, maxDisp);
    const specUrl = buildSpecularMap(w, h, radius, Math.min(bezel * 2.2, radius));

    // 3. 创建 filter
    const defs = document.getElementById('lg-defs');
    const id = 'lg-' + Math.random().toString(36).slice(2, 9);
    const filter = document.createElementNS(NS, 'filter');
    filter.setAttribute('id', id);
    filter.setAttribute('filterUnits', 'userSpaceOnUse');
    filter.setAttribute('colorInterpolationFilters', 'sRGB');
    filter.setAttribute('x', '0');
    filter.setAttribute('y', '0');
    filter.setAttribute('width', w);
    filter.setAttribute('height', h);

    // 实际的 displacement scale = maxDisp * displace 的归一化系数
    const scale = maxDisp * (opts.displace / 20);  // 用户调 0~40 → 0~2 倍

    filter.innerHTML = `
      <feGaussianBlur in="SourceGraphic" stdDeviation="${opts.blur}" result="blurred"/>
      <feImage href="${dispUrl}" x="0" y="0" width="${w}" height="${h}" result="dispMap"/>
      <feDisplacementMap in="blurred" in2="dispMap" scale="${scale}" xChannelSelector="R" yChannelSelector="G" result="displaced"/>
      <feColorMatrix in="displaced" type="saturate" values="${opts.saturate}" result="satted"/>
      <feImage href="${specUrl}" x="0" y="0" width="${w}" height="${h}" result="specLayer"/>
      <feComposite in="satted" in2="specLayer" operator="in" result="specMasked"/>
      <feComponentTransfer in="specLayer" result="specFaded">
        <feFuncA type="linear" slope="${opts.specular}"/>
      </feComponentTransfer>
      <feBlend in="specMasked" in2="satted" mode="normal" result="withSpec"/>
      <feBlend in="specFaded" in2="withSpec" mode="normal"/>
    `;
    defs.appendChild(filter);

    // 4. 应用到目标元素
    const filterCss = `url(#${id})`;
    el.style.backdropFilter = filterCss;
    el.style.webkitBackdropFilter = filterCss;

    return {
      id,
      destroy() {
        el.style.backdropFilter = '';
        el.style.webkitBackdropFilter = '';
        if (filter.parentNode) filter.parentNode.removeChild(filter);
      }
    };
  }

  /* ---------- 对外导出 ---------- */
  global.LiquidGlass = Object.assign(global.LiquidGlass || {}, {
    detect,
    svg: createSvgInstance,
    _internal: { calcRefractionProfile, buildDisplacementMap, buildSpecularMap, roundedRectSDF },
  });
})(window);
