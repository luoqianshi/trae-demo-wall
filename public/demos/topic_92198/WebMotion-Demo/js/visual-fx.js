/**
 * WebMotion - Visual FX Library
 * Pre-composed visual effects for Canvas 2D animations.
 * Each function returns a STRING of JavaScript code that can be injected
 * into animation code where ctx, t, width, height, utils are in scope.
 *
 * Usage: const code = VisualFX.particles({ count: 50, behavior: 'float' });
 *        // inject code into animation render function
 */
window.VisualFX = (function () {
  'use strict';

  // ─── Internal helpers ───────────────────────────────────────────
  const _esc = (s) => String(s).replace(/`/g, '\\`').replace(/\$/g, '\\$');
  const _j = (v) => JSON.stringify(v);                       // JSON → string
  const _colorDef = (c, fallback) => c ? _esc(c) : _esc(fallback || '#ffffff');

  // ─── 1. Background Atmosphere ──────────────────────────────────
  function backgroundAtmosphere(options = {}) {
    const orbs = options.orbs || [];
    const grid = Object.assign({ visible: false, opacity: 0.06, gap: 60 }, options.grid || {});
    const particles = Object.assign({ count: 40, color: '#ffffff', size: 2, speed: 0.3 }, options.particles || {});
    const vignette = Object.assign({ opacity: 0.5 }, options.vignette || {});

    let code = `// [background-atmosphere]\n`;
    code += `(() => {\n`;
    code += `  const w = width, h = height;\n`;

    // Base gradient
    code += `  const bg = ctx.createRadialGradient(w * 0.5, h * 0.4, 0, w * 0.5, h * 0.5, w * 0.8);\n`;
    code += `  bg.addColorStop(0, '#1a1a2e');\n`;
    code += `  bg.addColorStop(0.5, '#16213e');\n`;
    code += `  bg.addColorStop(1, '#0f0f1a');\n`;
    code += `  ctx.fillStyle = bg;\n`;
    code += `  ctx.fillRect(0, 0, w, h);\n`;

    // Orbs
    if (orbs.length > 0) {
      code += `  const orbs = ${_j(orbs)};\n`;
      code += `  orbs.forEach((o) => {\n`;
      code += `    const ox = o.x !== undefined ? o.x * w / 100 : w * 0.5;\n`;
      code += `    const oy = o.y !== undefined ? o.y * h / 100 : h * 0.5;\n`;
      code += `    const or2 = o.radius || 200;\n`;
      code += `    const col = o.color || '#4a90d9';\n`;
      code += `    const alp = o.alpha || 0.15;\n`;
      code += `    const pulse = or2 * (1 + 0.08 * Math.sin(t * 1.5));\n`;
      code += `    const grad = ctx.createRadialGradient(ox, oy, 0, ox, oy, pulse);\n`;
      code += `    const rgb = utils.color.hexToRgb(col);\n`;
      code += `    grad.addColorStop(0, \`rgba(\${rgb.r},\${rgb.g},\${rgb.b},\${alp})\`);\n`;
      code += `    grad.addColorStop(1, 'rgba(0,0,0,0)');\n`;
      code += `    ctx.fillStyle = grad;\n`;
      code += `    ctx.fillRect(ox - pulse, oy - pulse, pulse * 2, pulse * 2);\n`;
      code += `  });\n`;
    }

    // Grid
    if (grid.visible) {
      code += `  ctx.save();\n`;
      code += `  ctx.strokeStyle = \`rgba(255,255,255,\${${grid.opacity}})\`;\n`;
      code += `  ctx.lineWidth = 0.5;\n`;
      code += `  const gap = ${grid.gap};\n`;
      code += `  for (let gx = 0; gx < w; gx += gap) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke(); }\n`;
      code += `  for (let gy = 0; gy < h; gy += gap) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke(); }\n`;
      code += `  ctx.restore();\n`;
    }

    // Floating particles
    if (particles.count > 0) {
      code += `  const pc = ${particles.count};\n`;
      code += `  const pColor = '${_esc(particles.color)}';\n`;
      code += `  const pSize = ${particles.size};\n`;
      code += `  const pSpeed = ${particles.speed};\n`;
      code += `  const rgb = utils.color.hexToRgb(pColor);\n`;
      code += `  for (let i = 0; i < pc; i++) {\n`;
      code += `    const seed = i * 137.508;\n`;
      code += `    const px = (seed * 7.31) % w;\n`;
      code += `    const py = (seed * 11.73 + t * ${particles.speed} * 60 * ((i % 3) + 1) * 0.3) % h;\n`;
      code += `    const alp = 0.15 + 0.2 * Math.sin(t * 0.8 + seed);\n`;
      code += `    const sz = pSize * (0.5 + 0.5 * Math.sin(t + seed));\n`;
      code += `    ctx.beginPath();\n`;
      code += `    ctx.arc(px, py < 0 ? py + h : py, sz, 0, Math.PI * 2);\n`;
      code += `    ctx.fillStyle = \`rgba(\${rgb.r},\${rgb.g},\${rgb.b},\${alp})\`;\n`;
      code += `    ctx.fill();\n`;
      code += `  }\n`;
    }

    // Vignette
    code += `  const vig = ctx.createRadialGradient(w / 2, h / 2, w * 0.2, w / 2, h / 2, w * 0.85);\n`;
    code += `  vig.addColorStop(0, 'rgba(0,0,0,0)');\n`;
    code += `  vig.addColorStop(1, \`rgba(0,0,0,\${${vignette.opacity}})\`);\n`;
    code += `  ctx.fillStyle = vig;\n`;
    code += `  ctx.fillRect(0, 0, w, h);\n`;

    code += `})();\n`;
    return code;
  }

  // ─── 2. Particle Systems ───────────────────────────────────────
  function particles(options = {}) {
    const count = options.count || 50;
    const behavior = options.behavior || 'float';
    const origin = Object.assign({ x: 0.5, y: 0.5 }, options.origin || {});
    const target = Object.assign({ x: 0.5, y: 0.5 }, options.target || {});
    const colors = options.colors || ['#4a90d9', '#a855f7', '#06b6d4'];
    const size = options.size || [1, 4];
    const shape = options.shape || 'circle';
    const glow = options.glow !== undefined ? options.glow : true;
    const connections = options.connections || false;
    const connectionDistance = options.connectionDistance || 100;

    const oxPct = origin.x;
    const oyPct = origin.y;
    const txPct = target.x;
    const tyPct = target.y;
    const minS = size[0];
    const maxS = size[1];
    const colorsStr = _j(colors);

    let code = `// [particles - ${behavior}]\n`;
    code += `(() => {\n`;
    code += `  const w = width, h = height, ox = w * ${oxPct}, oy = h * ${oyPct}, tx = w * ${txPct}, ty = h * ${tyPct};\n`;
    code += `  const colors = ${colorsStr};\n`;
    code += `  const n = ${count};\n`;
    code += `  const pts = [];\n`;

    // Generate particle positions based on behavior
    switch (behavior) {
      case 'float':
        code += `  for (let i = 0; i < n; i++) {\n`;
        code += `    const seed = i * 137.508;\n`;
        code += `    const bx = (seed * 7.31) % w;\n`;
        code += `    const by = (seed * 11.73) % h;\n`;
        code += `    pts.push({ x: bx + Math.sin(t * 0.5 + seed) * 30, y: by + Math.cos(t * 0.3 + seed) * 20 });\n`;
        code += `  }\n`;
        break;
      case 'converge':
        code += `  for (let i = 0; i < n; i++) {\n`;
        code += `    const seed = i * 137.508;\n`;
        code += `    const angle = seed * 0.1;\n`;
        code += `    const dist = 300 + (seed % 200);\n`;
        code += `    const progress = utils.clamp(t * 0.4 + i * 0.003, 0, 1);\n`;
        code += `    const ep = utils.ease.outCubic(progress);\n`;
        code += `    pts.push({ x: utils.lerp(ox + Math.cos(angle) * dist, tx, ep), y: utils.lerp(oy + Math.sin(angle) * dist, ty, ep) });\n`;
        code += `  }\n`;
        break;
      case 'explode':
        code += `  for (let i = 0; i < n; i++) {\n`;
        code += `    const seed = i * 137.508;\n`;
        code += `    const angle = seed * 0.1;\n`;
        code += `    const dist = (seed % 250) + 50;\n`;
        code += `    const progress = utils.clamp(t * 0.5 - i * 0.003, 0, 1);\n`;
        code += `    const ep = utils.ease.outQuart(progress);\n`;
        code += `    pts.push({ x: utils.lerp(ox, ox + Math.cos(angle) * dist, ep), y: utils.lerp(oy, oy + Math.sin(angle) * dist, ep) });\n`;
        code += `  }\n`;
        break;
      case 'orbit':
        code += `  for (let i = 0; i < n; i++) {\n`;
        code += `    const seed = i * 137.508;\n`;
        code += `    const orbitR = 60 + (seed % 180);\n`;
        code += `    const speed = 0.3 + (seed % 50) * 0.01;\n`;
        code += `    const angle = t * speed + seed * 0.1;\n`;
        code += `    pts.push({ x: ox + Math.cos(angle) * orbitR, y: oy + Math.sin(angle) * orbitR });\n`;
        code += `  }\n`;
        break;
      case 'trail':
        code += `  for (let i = 0; i < n; i++) {\n`;
        code += `    const seed = i * 137.508;\n`;
        code += `    const progress = utils.clamp(t * 0.3 + i * 0.005, 0, 1);\n`;
        code += `    const ep = utils.ease.inOutCubic(progress);\n`;
        code += `    const sx = w * 0.1, sy = h * 0.8;\n`;
        code += `    const cpx = w * 0.4, cpy = h * 0.2;\n`;
        code += `    const u = ep;\n`;
        code += `    pts.push({ x: (1-u)*(1-u)*sx + 2*(1-u)*u*cpx + u*u*tx, y: (1-u)*(1-u)*sy + 2*(1-u)*u*cpy + u*u*ty });\n`;
        code += `  }\n`;
        break;
      default:
        code += `  for (let i = 0; i < n; i++) {\n`;
        code += `    const seed = i * 137.508;\n`;
        code += `    pts.push({ x: (seed * 7.31) % w, y: (seed * 11.73) % h });\n`;
        code += `  }\n`;
    }

    // Draw particles
    code += `  for (let i = 0; i < pts.length; i++) {\n`;
    code += `    const p = pts[i];\n`;
    code += `    const c = colors[i % colors.length];\n`;
    code += `    const rgb = utils.color.hexToRgb(c);\n`;
    code += `    const sz = utils.lerp(${minS}, ${maxS}, (Math.sin(i + t * 2) + 1) * 0.5);\n`;
    code += `    const alpha = 0.5 + 0.5 * Math.sin(i * 0.5 + t);\n`;
    code += `    ctx.save();\n`;

    if (glow) {
      code += `    ctx.shadowColor = c;\n`;
      code += `    ctx.shadowBlur = 12;\n`;
    }

    code += `    ctx.fillStyle = \`rgba(\${rgb.r},\${rgb.g},\${rgb.b},\${alpha})\`;\n`;

    // Shape drawing
    code += `    const sh = '${shape}';\n`;
    code += `    if (sh === 'circle' || sh === 'mixed' && i % 3 !== 0) {\n`;
    code += `      ctx.beginPath(); ctx.arc(p.x, p.y, sz, 0, Math.PI * 2); ctx.fill();\n`;
    code += `    } else if (sh === 'star') {\n`;
    code += `      _drawStar(ctx, p.x, p.y, 5, sz, sz * 0.4); ctx.fill();\n`;
    code += `    } else if (sh === 'diamond') {\n`;
    code += `      ctx.beginPath(); ctx.moveTo(p.x, p.y - sz); ctx.lineTo(p.x + sz * 0.6, p.y); ctx.lineTo(p.x, p.y + sz); ctx.lineTo(p.x - sz * 0.6, p.y); ctx.closePath(); ctx.fill();\n`;
    code += `    } else if (sh === 'mixed') {\n`;
    code += `      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(t + i); ctx.fillRect(-sz, -sz * 0.3, sz * 2, sz * 0.6); ctx.restore();\n`;
    code += `    }\n`;
    code += `    ctx.restore();\n`;
    code += `  }\n`;

    // Connections
    if (connections) {
      code += `  if (${connections}) {\n`;
      code += `    ctx.save();\n`;
      code += `    const cDist = ${connectionDistance};\n`;
      code += `    for (let i = 0; i < pts.length; i++) {\n`;
      code += `      for (let j = i + 1; j < pts.length; j++) {\n`;
      code += `        const d = utils.dist(pts[i].x, pts[i].y, pts[j].x, pts[j].y);\n`;
      code += `        if (d < cDist) {\n`;
      code += `          ctx.strokeStyle = \`rgba(255,255,255,\${(1 - d / cDist) * 0.15})\`;\n`;
      code += `          ctx.lineWidth = 0.5;\n`;
      code += `          ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.stroke();\n`;
      code += `        }\n`;
      code += `      }\n`;
      code += `    }\n`;
      code += `    ctx.restore();\n`;
      code += `  }\n`;

      // Add the helper for stars
      code = code.replace(
        '(function ()',
        `// [particles] - helper for star shape\nfunction _drawStar(c, cx, cy, spikes, outerR, innerR) {\n  let rot = -Math.PI / 2, step = Math.PI / spikes;\n  c.beginPath(); c.moveTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);\n  for (let i = 0; i < spikes; i++) { rot += step; c.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR); rot += step; c.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR); }\n  c.closePath();\n}\n\n(function ()`
      );
    }

    code += `})();\n`;

    // Prepend the star helper if we reference it
    if (shape === 'star' || shape === 'mixed') {
      const helper = `// [particles] - star helper\nfunction _drawStar(c, cx, cy, spikes, outerR, innerR) {\n  let rot = -Math.PI / 2, step = Math.PI / spikes;\n  c.beginPath(); c.moveTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);\n  for (let i = 0; i < spikes; i++) { rot += step; c.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR); rot += step; c.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR); }\n  c.closePath();\n}\n`;
      code = helper + code;
    }

    return code;
  }

  // ─── 3. Glow Effects ────────────────────────────────────────────
  function glow(type, x, y, radius, color) {
    x = x !== undefined ? x : 'width * 0.5';
    y = y !== undefined ? y : 'height * 0.5';
    radius = radius || 100;
    color = color || '#4a90d9';

    let code = `// [glow - ${type}]\n`;
    code += `(() => {\n`;
    code += `  const rgb = utils.color.hexToRgb('${_esc(color)}');\n`;

    switch (type) {
      case 'orb':
        code += `  const r = ${radius} * (1 + 0.05 * Math.sin(t * 2));\n`;
        code += `  const g = ctx.createRadialGradient(${x}, ${y}, 0, ${x}, ${y}, r);\n`;
        code += `  g.addColorStop(0, \`rgba(\${rgb.r},\${rgb.g},\${rgb.b},0.6)\`);\n`;
        code += `  g.addColorStop(0.4, \`rgba(\${rgb.r},\${rgb.g},\${rgb.b},0.2)\`);\n`;
        code += `  g.addColorStop(1, 'rgba(0,0,0,0)');\n`;
        code += `  ctx.fillStyle = g;\n`;
        code += `  ctx.fillRect(${x} - r, ${y} - r, r * 2, r * 2);\n`;
        break;

      case 'pulse':
        code += `  const pulseR = ${radius} * (0.5 + 0.5 * Math.abs(Math.sin(t * 1.5)));\n`;
        code += `  for (let ring = 3; ring >= 0; ring--) {\n`;
        code += `    const rr = pulseR + ring * 20;\n`;
        code += `    const alp = 0.3 * (1 - ring / 4);\n`;
        code += `    const g = ctx.createRadialGradient(${x}, ${y}, 0, ${x}, ${y}, rr);\n`;
        code += `    g.addColorStop(0, \`rgba(\${rgb.r},\${rgb.g},\${rgb.b},\${alp})\`);\n`;
        code += `    g.addColorStop(1, 'rgba(0,0,0,0)');\n`;
        code += `    ctx.fillStyle = g;\n`;
        code += `    ctx.fillRect(${x} - rr, ${y} - rr, rr * 2, rr * 2);\n`;
        code += `  }\n`;
        break;

      case 'bloom':
        code += `  const br = ${radius} * (1 + 0.15 * Math.sin(t * 0.7));\n`;
        code += `  ctx.save();\n`;
        code += `  ctx.globalCompositeOperation = 'screen';\n`;
        code += `  for (let layer = 2; layer >= 0; layer--) {\n`;
        code += `    const lr = br * (1 + layer * 0.5);\n`;
        code += `    const alp = 0.15 / (layer + 1);\n`;
        code += `    const g = ctx.createRadialGradient(${x}, ${y}, 0, ${x}, ${y}, lr);\n`;
        code += `    g.addColorStop(0, \`rgba(\${rgb.r},\${rgb.g},\${rgb.b},\${alp})\`);\n`;
        code += `    g.addColorStop(0.5, \`rgba(\${rgb.r},\${rgb.g},\${rgb.b},\${alp * 0.3})\`);\n`;
        code += `    g.addColorStop(1, 'rgba(0,0,0,0)');\n`;
        code += `    ctx.fillStyle = g;\n`;
        code += `    ctx.fillRect(${x} - lr, ${y} - lr, lr * 2, lr * 2);\n`;
        code += `  }\n`;
        code += `  ctx.restore();\n`;
        break;

      case 'halo':
        code += `  const hr = ${radius};\n`;
        code += `  ctx.save();\n`;
        code += `  ctx.strokeStyle = \`rgba(\${rgb.r},\${rgb.g},\${rgb.b},0.4)\`;\n`;
        code += `  ctx.lineWidth = 3;\n`;
        code += `  ctx.shadowColor = '${_esc(color)}';\n`;
        code += `  ctx.shadowBlur = 20;\n`;
        code += `  ctx.beginPath();\n`;
        code += `  ctx.ellipse(${x}, ${y}, hr, hr * 0.4, 0, 0, Math.PI * 2);\n`;
        code += `  ctx.stroke();\n`;
        code += `  ctx.restore();\n`;
        break;

      case 'spotlight':
        code += `  const sr = ${radius};\n`;
        code += `  const angle = -Math.PI / 4;\n`;
        code += `  ctx.save();\n`;
        code += `  ctx.beginPath();\n`;
        code += `  ctx.moveTo(${x}, ${y});\n`;
        code += `  ctx.arc(${x}, ${y}, sr, angle - 0.3, angle + 0.3);\n`;
        code += `  ctx.closePath();\n`;
        code += `  const g = ctx.createRadialGradient(${x}, ${y}, 0, ${x}, ${y}, sr);\n`;
        code += `  g.addColorStop(0, \`rgba(\${rgb.r},\${rgb.g},\${rgb.b},0.3)\`);\n`;
        code += `  g.addColorStop(1, 'rgba(0,0,0,0)');\n`;
        code += `  ctx.fillStyle = g;\n`;
        code += `  ctx.fill();\n`;
        code += `  ctx.restore();\n`;
        break;

      case 'aurora':
        code += `  const ar = ${radius};\n`;
        code += `  ctx.save();\n`;
        code += `  ctx.globalCompositeOperation = 'screen';\n`;
        code += `  for (let band = 0; band < 3; band++) {\n`;
        code += `    const by = ${y} - ar + band * ar * 0.4;\n`;
        code += `    const wave = Math.sin(t * 0.5 + band * 1.2) * 30;\n`;
        code += `    ctx.beginPath();\n`;
        code += `    ctx.moveTo(${x} - ar, by);\n`;
        code += `    for (let px = -ar; px <= ar; px += 5) {\n`;
        code += `      const wy = by + Math.sin((px + t * 40) * 0.02 + band) * 20 + wave;\n`;
        code += `      ctx.lineTo(${x} + px, wy);\n`;
        code += `    }\n`;
        code += `    ctx.lineTo(${x} + ar, by + 40);\n`;
        code += `    ctx.lineTo(${x} - ar, by + 40);\n`;
        code += `    ctx.closePath();\n`;
        code += `    const alp = 0.08 * (1 - band * 0.25);\n`;
        code += `    ctx.fillStyle = \`rgba(\${rgb.r},\${rgb.g},\${rgb.b},\${alp})\`;\n`;
        code += `    ctx.fill();\n`;
        code += `  }\n`;
        code += `  ctx.restore();\n`;
        break;

      default:
        code += `  const r = ${radius};\n`;
        code += `  const g = ctx.createRadialGradient(${x}, ${y}, 0, ${x}, ${y}, r);\n`;
        code += `  g.addColorStop(0, \`rgba(\${rgb.r},\${rgb.g},\${rgb.b},0.5)\`);\n`;
        code += `  g.addColorStop(1, 'rgba(0,0,0,0)');\n`;
        code += `  ctx.fillStyle = g;\n`;
        code += `  ctx.fillRect(${x} - r, ${y} - r, r * 2, r * 2);\n`;
    }

    code += `})();\n`;
    return code;
  }

  function textGlow(text, x, y, fontSize, color, intensity = 'medium') {
    const levels = { low: 1, medium: 2, high: 3 };
    const maxLayers = levels[intensity] || 2;
    const hex = color || '#ffffff';

    let code = `// [text-glow - ${intensity}]\n`;
    code += `(() => {\n`;
    code += `  const rgb = utils.color.hexToRgb('${_esc(hex)}');\n`;
    code += `  ctx.save();\n`;
    code += `  ctx.font = '${_esc(fontSize)}px sans-serif';\n`;
    code += `  ctx.textAlign = 'center';\n`;
    code += `  ctx.textBaseline = 'middle';\n`;

    // Outer diffuse layers (outermost first)
    for (let i = maxLayers; i >= 1; i--) {
      const blur = 10 * i + 5;
      const alpha = 0.15 / i;
      code += `  ctx.shadowColor = \`rgba(\${rgb.r},\${rgb.g},\${rgb.b},\${${alpha}})\`;\n`;
      code += `  ctx.shadowBlur = ${blur};\n`;
      code += `  ctx.fillStyle = \`rgba(\${rgb.r},\${rgb.g},\${rgb.b},0.01)\`;\n`;
      code += `  ctx.fillText('${_esc(text)}', ${x}, ${y});\n`;
    }

    // Color fringe (subtle shift)
    if (maxLayers >= 2) {
      code += `  ctx.shadowColor = \`rgba(\${Math.min(255, rgb.r + 40)},\${Math.max(0, rgb.g - 20)},\${rgb.b},0.3)\`;\n`;
      code += `  ctx.shadowBlur = 8;\n`;
      code += `  ctx.fillStyle = \`rgba(\${rgb.r},\${rgb.g},\${rgb.b},0.02)\`;\n`;
      code += `  ctx.fillText('${_esc(text)}', ${x}, ${y});\n`;
    }

    // Main text
    code += `  ctx.shadowColor = '${_esc(hex)}';\n`;
    code += `  ctx.shadowBlur = 15;\n`;
    code += `  ctx.fillStyle = '${_esc(hex)}';\n`;
    code += `  ctx.fillText('${_esc(text)}', ${x}, ${y});\n`;

    // Inner bright pass
    code += `  ctx.shadowColor = 'rgba(255,255,255,0.5)';\n`;
    code += `  ctx.shadowBlur = 4;\n`;
    code += `  ctx.fillStyle = 'rgba(255,255,255,0.6)';\n`;
    code += `  ctx.fillText('${_esc(text)}', ${x}, ${y});\n`;

    code += `  ctx.restore();\n`;
    code += `})();\n`;
    return code;
  }

  // ─── 4. Typography Effects ──────────────────────────────────────
  function gradientText(text, x, y, fontSize, colors, fontWeight = 'bold', align = 'center') {
    const colorsArr = colors || ['#4a90d9', '#a855f7'];
    const colorsStr = _j(colorsArr);

    let code = `// [gradient-text]\n`;
    code += `(() => {\n`;
    code += `  ctx.save();\n`;
    code += `  ctx.font = '${_esc(fontWeight)} ${_esc(fontSize)}px sans-serif';\n`;
    code += `  ctx.textAlign = '${_esc(align)}';\n`;
    code += `  ctx.textBaseline = 'middle';\n`;
    code += `  const m = ctx.measureText('${_esc(text)}');\n`;
    code += `  const tx = ${x};\n`;
    code += `  const ty = ${y};\n`;
    code += `  const tw = m.width;\n`;
    code += `  const gx = tx - tw / 2;\n`;
    code += `  const grad = ctx.createLinearGradient(gx, ty, gx + tw, ty);\n`;
    code += `  const cols = ${colorsStr};\n`;
    code += `  cols.forEach((c, i) => grad.addColorStop(i / (cols.length - 1), c));\n`;
    code += `  ctx.fillStyle = grad;\n`;
    code += `  ctx.shadowColor = cols[0];\n`;
    code += `  ctx.shadowBlur = 10;\n`;
    code += `  ctx.fillText('${_esc(text)}', tx, ty);\n`;
    code += `  ctx.restore();\n`;
    code += `})();\n`;
    return code;
  }

  function textReveal(text, x, y, fontSize, color, revealType = 'leftToRight') {
    color = color || '#ffffff';
    const escapedText = _esc(text);

    let code = `// [text-reveal - ${revealType}]\n`;
    code += `(() => {\n`;
    code += `  const txt = '${escapedText}';\n`;
    code += `  ctx.save();\n`;
    code += `  ctx.font = '${_esc(fontSize)}px sans-serif';\n`;
    code += `  ctx.textAlign = 'center';\n`;
    code += `  ctx.textBaseline = 'middle';\n`;

    switch (revealType) {
      case 'leftToRight': {
        code += `  const tw = ctx.measureText(txt).width;\n`;
        code += `  const progress = utils.clamp(t * 1.2, 0, 1);\n`;
        code += `  const ep = utils.ease.outCubic(progress);\n`;
        code += `  ctx.save();\n`;
        code += `  ctx.beginPath();\n`;
        code += `  ctx.rect(${x} - tw / 2 - 10, 0, tw * ep + 20, height);\n`;
        code += `  ctx.clip();\n`;
        code += `  ctx.fillStyle = '${_esc(color)}';\n`;
        code += `  ctx.fillText(txt, ${x}, ${y});\n`;
        code += `  ctx.restore();\n`;
        break;
      }

      case 'centerOut': {
        code += `  const tw = ctx.measureText(txt).width;\n`;
        code += `  const progress = utils.clamp(t * 1.2, 0, 1);\n`;
        code += `  const ep = utils.ease.outCubic(progress);\n`;
        code += `  const half = tw * ep / 2;\n`;
        code += `  ctx.save();\n`;
        code += `  ctx.beginPath();\n`;
        code += `  ctx.rect(${x} - half, 0, half * 2, height);\n`;
        code += `  ctx.clip();\n`;
        code += `  ctx.fillStyle = '${_esc(color)}';\n`;
        code += `  ctx.fillText(txt, ${x}, ${y});\n`;
        code += `  ctx.restore();\n`;
        break;
      }

      case 'typewriter': {
        code += `  const charCount = Math.floor(utils.clamp(t * 8, 0, txt.length));\n`;
        code += `  ctx.fillStyle = '${_esc(color)}';\n`;
        code += `  ctx.textAlign = 'left';\n`;
        code += `  ctx.fillText(txt.substring(0, charCount), ${x}, ${y});\n`;
        code += `  if (charCount < txt.length && Math.sin(t * 10) > 0) {\n`;
        code += `    const cx = ${x} + ctx.measureText(txt.substring(0, charCount)).width;\n`;
        code += `    ctx.fillRect(cx, ${y} - ${fontSize} * 0.4, 3, ${fontSize} * 0.8);\n`;
        code += `  }\n`;
        break;
      }

      case 'charByChar': {
        code += `  const chars = txt.split('');\n`;
        code += `  ctx.textAlign = 'left';\n`;
        code += `  ctx.fillStyle = '${_esc(color)}';\n`;
        code += `  let cx = ${x} - ctx.measureText(txt).width / 2;\n`;
        code += `  chars.forEach((ch, i) => {\n`;
        code += `    const delay = i * 0.06;\n`;
        code += `    const cp = utils.clamp((t - delay) * 2, 0, 1);\n`;
        code += `    const ep = utils.ease.outBack(cp);\n`;
        code += `    ctx.save();\n`;
        code += `    ctx.globalAlpha = ep;\n`;
        code += `    ctx.translate(cx, ${y});\n`;
        code += `    const yOff = (1 - ep) * -20;\n`;
        code += `    ctx.translate(0, yOff);\n`;
        code += `    ctx.fillText(ch, 0, 0);\n`;
        code += `    cx += ctx.measureText(ch).width;\n`;
        code += `    ctx.restore();\n`;
        code += `  });\n`;
        break;
      }

      case 'lineByLine': {
        code += `  const lines = txt.split('\\\\n');\n`;
        code += `  const lh = ${fontSize} * 1.3;\n`;
        code += `  ctx.fillStyle = '${_esc(color)}';\n`;
        code += `  const totalH = lines.length * lh;\n`;
        code += `  lines.forEach((line, i) => {\n`;
        code += `    const delay = i * 0.3;\n`;
        code += `    const lp = utils.clamp((t - delay) * 1.5, 0, 1);\n`;
        code += `    const ep = utils.ease.outCubic(lp);\n`;
        code += `    ctx.save();\n`;
        code += `    ctx.globalAlpha = ep;\n`;
        code += `    ctx.textAlign = 'center';\n`;
        code += `    const yOff = (1 - ep) * 30;\n`;
        code += `    ctx.fillText(line, ${x}, ${y} - totalH / 2 + i * lh + lh / 2 + yOff);\n`;
        code += `    ctx.restore();\n`;
        code += `  });\n`;
        break;
      }

      case 'blurIn': {
        code += `  const progress = utils.clamp(t * 1.5, 0, 1);\n`;
        code += `  const ep = utils.ease.outCubic(progress);\n`;
        code += `  ctx.fillStyle = '${_esc(color)}';\n`;
        code += `  ctx.save();\n`;
        code += `  ctx.globalAlpha = ep;\n`;
        code += `  ctx.filter = \`blur(\${(1 - ep) * 20}px)\`;\n`;
        code += `  ctx.fillText(txt, ${x}, ${y});\n`;
        code += `  ctx.filter = 'none';\n`;
        code += `  ctx.restore();\n`;
        break;
      }

      default: {
        code += `  ctx.fillStyle = '${_esc(color)}';\n`;
        code += `  ctx.fillText(txt, ${x}, ${y});\n`;
      }
    }

    code += `  ctx.restore();\n`;
    code += `})();\n`;
    return code;
  }

  function kineticText(text, x, y, fontSize, color, behavior = 'wave') {
    color = color || '#ffffff';

    let code = `// [kinetic-text - ${behavior}]\n`;
    code += `(() => {\n`;
    code += `  const txt = '${_esc(text)}';\n`;
    code += `  const chars = txt.split('');\n`;
    code += `  ctx.save();\n`;
    code += `  ctx.font = '${_esc(fontSize)}px sans-serif';\n`;
    code += `  ctx.textAlign = 'left';\n`;
    code += `  ctx.textBaseline = 'middle';\n`;
    code += `  ctx.fillStyle = '${_esc(color)}';\n`;
    code += `  const totalW = ctx.measureText(txt).width;\n`;
    code += `  let cx = ${x} - totalW / 2;\n`;

    switch (behavior) {
      case 'wave':
        code += `  chars.forEach((ch, i) => {\n`;
        code += `    const yOff = Math.sin(t * 3 + i * 0.4) * ${fontSize} * 0.15;\n`;
        code += `    ctx.fillText(ch, cx, ${y} + yOff);\n`;
        code += `    cx += ctx.measureText(ch).width;\n`;
        code += `  });\n`;
        break;

      case 'bounce':
        code += `  chars.forEach((ch, i) => {\n`;
        code += `    const bounce = Math.abs(Math.sin(t * 4 + i * 0.5)) * ${fontSize} * 0.2;\n`;
        code += `    ctx.fillText(ch, cx, ${y} - bounce);\n`;
        code += `    cx += ctx.measureText(ch).width;\n`;
        code += `  });\n`;
        break;

      case 'shake':
        code += `  const shX = Math.sin(t * 30) * 2;\n`;
        code += `  const shY = Math.cos(t * 25) * 1;\n`;
        code += `  ctx.fillText(txt, ${x} + shX, ${y} + shY);\n`;
        break;

      case 'breathe':
        code += `  const scale = 1 + 0.05 * Math.sin(t * 2);\n`;
        code += `  ctx.save();\n`;
        code += `  ctx.translate(${x}, ${y});\n`;
        code += `  ctx.scale(scale, scale);\n`;
        code += `  ctx.textAlign = 'center';\n`;
        code += `  ctx.fillText(txt, 0, 0);\n`;
        code += `  ctx.restore();\n`;
        break;

      case 'slide':
        code += `  const slideX = ${x} + (1 - utils.clamp(t * 0.8, 0, 1)) * -200;\n`;
        code += `  const ep = utils.ease.outCubic(utils.clamp(t * 0.8, 0, 1));\n`;
        code += `  ctx.textAlign = 'center';\n`;
        code += `  ctx.fillText(txt, utils.lerp(slideX, ${x}, ep), ${y});\n`;
        break;

      case 'cascade':
        code += `  chars.forEach((ch, i) => {\n`;
        code += `    const delay = i * 0.05;\n`;
        code += `    const cp = utils.clamp((t - delay) * 2, 0, 1);\n`;
        code += `    const ep = utils.ease.outCubic(cp);\n`;
        code += `    ctx.save();\n`;
        code += `    ctx.globalAlpha = ep;\n`;
        code += `    const yOff = (1 - ep) * -40;\n`;
        code += `    const rot = (1 - ep) * -0.1;\n`;
        code += `    ctx.translate(cx + ctx.measureText(ch).width / 2, ${y});\n`;
        code += `    ctx.rotate(rot);\n`;
        code += `    ctx.translate(-ctx.measureText(ch).width / 2, yOff);\n`;
        code += `    ctx.fillText(ch, 0, 0);\n`;
        code += `    cx_orig = cx + ctx.measureText(ch).width;\n`;
        code += `    ctx.restore();\n`;
        code += `    cx += ctx.measureText(ch).width;\n`;
        code += `  });\n`;
        break;

      default:
        code += `  ctx.textAlign = 'center';\n`;
        code += `  ctx.fillText(txt, ${x}, ${y});\n`;
    }

    code += `  ctx.restore();\n`;
    code += `})();\n`;
    return code;
  }

  // ─── 5. Decorative Elements ─────────────────────────────────────
  function cornerAccents(x, y, w, h, size, color, style = 'L') {
    color = color || '#ffffff';
    const s = size || 20;

    let code = `// [corner-accents - ${style}]\n`;
    code += `(() => {\n`;
    code += `  ctx.save();\n`;
    code += `  ctx.strokeStyle = '${_esc(color)}';\n`;
    code += `  ctx.fillStyle = '${_esc(color)}';\n`;
    code += `  ctx.lineWidth = 2;\n`;
    code += `  const _x = ${x}, _y = ${y}, _w = ${w}, _h = ${h}, _s = ${s};\n`;

    if (style === 'L') {
      code += `  // Top-left\n  ctx.beginPath(); ctx.moveTo(_x, _y + _s); ctx.lineTo(_x, _y); ctx.lineTo(_x + _s, _y); ctx.stroke();\n`;
      code += `  // Top-right\n  ctx.beginPath(); ctx.moveTo(_x + _w - _s, _y); ctx.lineTo(_x + _w, _y); ctx.lineTo(_x + _w, _y + _s); ctx.stroke();\n`;
      code += `  // Bottom-left\n  ctx.beginPath(); ctx.moveTo(_x, _y + _h - _s); ctx.lineTo(_x, _y + _h); ctx.lineTo(_x + _s, _y + _h); ctx.stroke();\n`;
      code += `  // Bottom-right\n  ctx.beginPath(); ctx.moveTo(_x + _w - _s, _y + _h); ctx.lineTo(_x + _w, _y + _h); ctx.lineTo(_x + _w, _y + _h - _s); ctx.stroke();\n`;
    } else if (style === 'bracket') {
      code += `  const bk = _s * 0.6;\n`;
      code += `  // Top-left\n  ctx.beginPath(); ctx.moveTo(_x + bk, _y); ctx.lineTo(_x, _y); ctx.lineTo(_x, _y + bk); ctx.stroke();\n`;
      code += `  // Top-right\n  ctx.beginPath(); ctx.moveTo(_x + _w - bk, _y); ctx.lineTo(_x + _w, _y); ctx.lineTo(_x + _w, _y + bk); ctx.stroke();\n`;
      code += `  // Bottom-left\n  ctx.beginPath(); ctx.moveTo(_x + bk, _y + _h); ctx.lineTo(_x, _y + _h); ctx.lineTo(_x, _y + _h - bk); ctx.stroke();\n`;
      code += `  // Bottom-right\n  ctx.beginPath(); ctx.moveTo(_x + _w - bk, _y + _h); ctx.lineTo(_x + _w, _y + _h); ctx.lineTo(_x + _w, _y + _h - bk); ctx.stroke();\n`;
    } else if (style === 'circle') {
      code += `  const r = 4;\n`;
      code += `  ctx.beginPath(); ctx.arc(_x + r, _y + r, r, 0, Math.PI * 2); ctx.fill();\n`;
      code += `  ctx.beginPath(); ctx.arc(_x + _w - r, _y + r, r, 0, Math.PI * 2); ctx.fill();\n`;
      code += `  ctx.beginPath(); ctx.arc(_x + r, _y + _h - r, r, 0, Math.PI * 2); ctx.fill();\n`;
      code += `  ctx.beginPath(); ctx.arc(_x + _w - r, _y + _h - r, r, 0, Math.PI * 2); ctx.fill();\n`;
    } else if (style === 'diamond') {
      code += `  const d = 5;\n`;
      code += `  [[_x, _y], [_x + _w, _y], [_x, _y + _h], [_x + _w, _y + _h]].forEach(([cx, cy]) => {\n`;
      code += `    ctx.beginPath(); ctx.moveTo(cx, cy - d); ctx.lineTo(cx + d, cy); ctx.lineTo(cx, cy + d); ctx.lineTo(cx - d, cy); ctx.closePath(); ctx.fill();\n`;
      code += `  });\n`;
    }

    code += `  ctx.restore();\n`;
    code += `})();\n`;
    return code;
  }

  function decorativeLine(x1, y1, x2, y2, color, style = 'solid') {
    color = color || '#ffffff';

    let code = `// [decorative-line - ${style}]\n`;
    code += `(() => {\n`;
    code += `  ctx.save();\n`;

    switch (style) {
      case 'dashed':
        code += `  ctx.setLineDash([10, 6]);\n`;
        code += `  ctx.strokeStyle = '${_esc(color)}';\n`;
        code += `  ctx.lineWidth = 1;\n`;
        code += `  ctx.beginPath(); ctx.moveTo(${x1}, ${y1}); ctx.lineTo(${x2}, ${y2}); ctx.stroke();\n`;
        code += `  ctx.setLineDash([]);\n`;
        break;
      case 'dotted':
        code += `  ctx.setLineDash([2, 6]);\n`;
        code += `  ctx.strokeStyle = '${_esc(color)}';\n`;
        code += `  ctx.lineWidth = 2;\n`;
        code += `  ctx.lineCap = 'round';\n`;
        code += `  ctx.beginPath(); ctx.moveTo(${x1}, ${y1}); ctx.lineTo(${x2}, ${y2}); ctx.stroke();\n`;
        code += `  ctx.setLineDash([]);\n`;
        break;
      case 'gradient': {
        code += `  const grad = ctx.createLinearGradient(${x1}, ${y1}, ${x2}, ${y2});\n`;
        code += `  grad.addColorStop(0, '${_esc(color)}');\n`;
        code += `  grad.addColorStop(1, 'rgba(0,0,0,0)');\n`;
        code += `  ctx.strokeStyle = grad;\n`;
        code += `  ctx.lineWidth = 1.5;\n`;
        code += `  ctx.beginPath(); ctx.moveTo(${x1}, ${y1}); ctx.lineTo(${x2}, ${y2}); ctx.stroke();\n`;
        break;
      }
      case 'glowing':
        code += `  ctx.strokeStyle = '${_esc(color)}';\n`;
        code += `  ctx.lineWidth = 1.5;\n`;
        code += `  ctx.shadowColor = '${_esc(color)}';\n`;
        code += `  ctx.shadowBlur = 10;\n`;
        code += `  ctx.beginPath(); ctx.moveTo(${x1}, ${y1}); ctx.lineTo(${x2}, ${y2}); ctx.stroke();\n`;
        code += `  // bright core\n`;
        code += `  ctx.shadowBlur = 0;\n`;
        code += `  ctx.strokeStyle = 'rgba(255,255,255,0.6)';\n`;
        code += `  ctx.lineWidth = 0.5;\n`;
        code += `  ctx.beginPath(); ctx.moveTo(${x1}, ${y1}); ctx.lineTo(${x2}, ${y2}); ctx.stroke();\n`;
        break;
      default: // solid
        code += `  ctx.strokeStyle = '${_esc(color)}';\n`;
        code += `  ctx.lineWidth = 1;\n`;
        code += `  ctx.beginPath(); ctx.moveTo(${x1}, ${y1}); ctx.lineTo(${x2}, ${y2}); ctx.stroke();\n`;
    }

    code += `  ctx.restore();\n`;
    code += `})();\n`;
    return code;
  }

  function accentDots(pattern, x, y, w, h, color) {
    color = color || '#ffffff';

    let code = `// [accent-dots - ${pattern}]\n`;
    code += `(() => {\n`;
    code += `  ctx.save();\n`;
    code += `  ctx.fillStyle = '${_esc(color)}';\n`;
    code += `  const _x = ${x}, _y = ${y}, _w = ${w}, _h = ${h};\n`;

    switch (pattern) {
      case 'grid':
        code += `  const gap = 15, r = 1.5;\n`;
        code += `  for (let gx = _x; gx <= _x + _w; gx += gap) {\n`;
        code += `    for (let gy = _y; gy <= _y + _h; gy += gap) {\n`;
        code += `      ctx.globalAlpha = 0.3 + 0.2 * Math.sin(gx * 0.1 + gy * 0.1 + t);\n`;
        code += `      ctx.beginPath(); ctx.arc(gx, gy, r, 0, Math.PI * 2); ctx.fill();\n`;
        code += `    }\n`;
        code += `  }\n`;
        break;
      case 'scatter':
        code += `  for (let i = 0; i < 30; i++) {\n`;
        code += `    const seed = i * 137.508;\n`;
        code += `    const dx = _x + (seed * 7.31) % _w;\n`;
        code += `    const dy = _y + (seed * 11.73) % _h;\n`;
        code += `    const dr = 1 + (seed % 3);\n`;
        code += `    ctx.globalAlpha = 0.2 + 0.3 * Math.sin(t + seed);\n`;
        code += `    ctx.beginPath(); ctx.arc(dx, dy, dr, 0, Math.PI * 2); ctx.fill();\n`;
        code += `  }\n`;
        break;
      case 'circle':
        code += `  const cx = _x + _w / 2, cy = _y + _h / 2;\n`;
        code += `  const cr = Math.min(_w, _h) / 2 - 5;\n`;
        code += `  const count = 24;\n`;
        code += `  for (let i = 0; i < count; i++) {\n`;
        code += `    const angle = (i / count) * Math.PI * 2;\n`;
        code += `    const dx = cx + Math.cos(angle) * cr;\n`;
        code += `    const dy = cy + Math.sin(angle) * cr;\n`;
        code += `    ctx.globalAlpha = 0.3 + 0.3 * Math.sin(t * 2 + i * 0.3);\n`;
        code += `    ctx.beginPath(); ctx.arc(dx, dy, 2, 0, Math.PI * 2); ctx.fill();\n`;
        code += `  }\n`;
        break;
      case 'diagonal':
        code += `  const gap = 20, r = 1.5;\n`;
        code += `  for (let i = 0; i < 30; i++) {\n`;
        code += `    const dx = _x + (i * gap) % _w;\n`;
        code += `    const dy = _y + (i * gap * 0.7) % _h;\n`;
        code += `    ctx.globalAlpha = 0.2 + 0.3 * Math.sin(t + i);\n`;
        code += `    ctx.beginPath(); ctx.arc(dx, dy, r, 0, Math.PI * 2); ctx.fill();\n`;
        code += `  }\n`;
        break;
    }

    code += `  ctx.globalAlpha = 1;\n`;
    code += `  ctx.restore();\n`;
    code += `})();\n`;
    return code;
  }

  function divider(y, w, color, centerElement = 'diamond') {
    color = color || '#ffffff';

    let code = `// [divider - ${centerElement}]\n`;
    code += `(() => {\n`;
    code += `  ctx.save();\n`;
    code += `  const cx = width / 2;\n`;
    code += `  const pad = 40;\n`;
    code += `  ctx.strokeStyle = '${_esc(color)}';\n`;
    code += `  ctx.fillStyle = '${_esc(color)}';\n`;
    code += `  ctx.lineWidth = 1;\n`;
    code += `  ctx.globalAlpha = 0.5;\n`;
    code += `  ctx.beginPath(); ctx.moveTo(cx - ${w} / 2, ${y}); ctx.lineTo(cx - pad, ${y}); ctx.stroke();\n`;
    code += `  ctx.beginPath(); ctx.moveTo(cx + pad, ${y}); ctx.lineTo(cx + ${w} / 2, ${y}); ctx.stroke();\n`;

    if (centerElement === 'diamond') {
      code += `  ctx.globalAlpha = 0.8;\n`;
      code += `  ctx.beginPath(); ctx.moveTo(cx, ${y} - 5); ctx.lineTo(cx + 5, ${y}); ctx.lineTo(cx, ${y} + 5); ctx.lineTo(cx - 5, ${y}); ctx.closePath(); ctx.fill();\n`;
    } else if (centerElement === 'circle') {
      code += `  ctx.globalAlpha = 0.8;\n`;
      code += `  ctx.beginPath(); ctx.arc(cx, ${y}, 4, 0, Math.PI * 2); ctx.fill();\n`;
    } else if (centerElement === 'line') {
      code += `  ctx.globalAlpha = 1;\n`;
      code += `  ctx.lineWidth = 2;\n`;
      code += `  ctx.beginPath(); ctx.moveTo(cx - 15, ${y}); ctx.lineTo(cx + 15, ${y}); ctx.stroke();\n`;
    } else if (centerElement === 'dot') {
      code += `  ctx.globalAlpha = 1;\n`;
      code += `  ctx.beginPath(); ctx.arc(cx, ${y}, 2, 0, Math.PI * 2); ctx.fill();\n`;
    }

    code += `  ctx.globalAlpha = 1;\n`;
    code += `  ctx.restore();\n`;
    code += `})();\n`;
    return code;
  }

  // ─── 6. Data Visualization Enhancements ──────────────────────────
  function styledBar(x, y, w, h, color, options = {}) {
    const opts = Object.assign({ roundedTop: true, gradient: true, glow: false, shadow: false, highlight: false, label: '', value: '' }, options);

    let code = `// [styled-bar]\n`;
    code += `(() => {\n`;
    code += `  ctx.save();\n`;
    code += `  const _x = ${x}, _y = ${y}, _w = ${w}, _h = ${h};\n`;
    code += `  const r = ${opts.roundedTop} ? Math.min(8, _w / 2, _h / 2) : 0;\n`;
    code += `  const color = '${_esc(color)}';\n`;
    code += `  const rgb = utils.color.hexToRgb(color);\n`;

    if (opts.shadow) {
      code += `  ctx.shadowColor = \`rgba(0,0,0,0.3)\`;\n`;
      code += `  ctx.shadowBlur = 10;\n`;
      code += `  ctx.shadowOffsetY = 4;\n`;
    }

    // Draw rounded bar path
    code += `  ctx.beginPath();\n`;
    code += `  if (r > 0) {\n`;
    code += `    ctx.moveTo(_x + r, _y);\n`;
    code += `    ctx.lineTo(_x + _w - r, _y);\n`;
    code += `    ctx.arcTo(_x + _w, _y, _x + _w, _y + r, r);\n`;
    code += `    ctx.lineTo(_x + _w, _y + _h);\n`;
    code += `    ctx.lineTo(_x, _y + _h);\n`;
    code += `    ctx.lineTo(_x, _y + r);\n`;
    code += `    ctx.arcTo(_x, _y, _x + r, _y, r);\n`;
    code += `  } else {\n`;
    code += `    ctx.rect(_x, _y, _w, _h);\n`;
    code += `  }\n`;
    code += `  ctx.closePath();\n`;

    // Fill
    if (opts.gradient) {
      code += `  const grad = ctx.createLinearGradient(_x, _y, _x, _y + _h);\n`;
      code += `  grad.addColorStop(0, \`rgba(\${Math.min(255, rgb.r + 40)},\${Math.min(255, rgb.g + 40)},\${Math.min(255, rgb.b + 40)},1)\`);\n`;
      code += `  grad.addColorStop(1, color);\n`;
      code += `  ctx.fillStyle = grad;\n`;
    } else {
      code += `  ctx.fillStyle = color;\n`;
    }

    if (opts.glow) {
      code += `  ctx.shadowColor = color;\n`;
      code += `  ctx.shadowBlur = 12;\n`;
    }

    code += `  ctx.fill();\n`;

    // Highlight stripe
    if (opts.highlight) {
      code += `  ctx.save();\n`;
      code += `  ctx.clip();\n`;
      code += `  const hg = ctx.createLinearGradient(_x, 0, _x + _w, 0);\n`;
      code += `  hg.addColorStop(0, 'rgba(255,255,255,0)');\n`;
      code += `  hg.addColorStop(0.4, 'rgba(255,255,255,0.1)');\n`;
      code += `  hg.addColorStop(0.6, 'rgba(255,255,255,0.1)');\n`;
      code += `  hg.addColorStop(1, 'rgba(255,255,255,0)');\n`;
      code += `  ctx.fillStyle = hg;\n`;
      code += `  ctx.fillRect(_x, _y, _w, _h * 0.4);\n`;
      code += `  ctx.restore();\n`;
    }

    // Label and value
    if (opts.label) {
      code += `  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;\n`;
      code += `  ctx.font = '13px sans-serif';\n`;
      code += `  ctx.fillStyle = '#ffffff';\n`;
      code += `  ctx.textAlign = 'left';\n`;
      code += `  ctx.textBaseline = 'bottom';\n`;
      code += `  ctx.fillText('${_esc(opts.label)}', _x, _y - 6);\n`;
    }
    if (opts.value) {
      code += `  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;\n`;
      code += `  ctx.font = 'bold 14px sans-serif';\n`;
      code += `  ctx.fillStyle = color;\n`;
      code += `  ctx.textAlign = 'right';\n`;
      code += `  ctx.textBaseline = 'bottom';\n`;
      code += `  ctx.fillText('${_esc(opts.value)}', _x + _w, _y - 6);\n`;
    }

    code += `  ctx.restore();\n`;
    code += `})();\n`;
    return code;
  }

  function animatedCounter(value, x, y, fontSize, color, prefix = '', suffix = '') {
    let code = `// [animated-counter]\n`;
    code += `(() => {\n`;
    code += `  const target = ${value};\n`;
    code += `  const progress = utils.clamp(t * 0.8, 0, 1);\n`;
    code += `  const ep = utils.ease.outCubic(progress);\n`;
    code += `  const current = Math.round(target * ep);\n`;
    code += `  const display = '${_esc(prefix)}' + current.toLocaleString() + '${_esc(suffix)}';\n`;
    code += `  ctx.save();\n`;
    code += `  ctx.font = 'bold ${_esc(fontSize)}px sans-serif';\n`;
    code += `  ctx.fillStyle = '${_esc(color)}';\n`;
    code += `  ctx.textAlign = 'center';\n`;
    code += `  ctx.textBaseline = 'middle';\n`;
    code += `  ctx.shadowColor = '${_esc(color)}';\n`;
    code += `  ctx.shadowBlur = 8;\n`;
    code += `  ctx.fillText(display, ${x}, ${y});\n`;
    code += `  ctx.restore();\n`;
    code += `})();\n`;
    return code;
  }

  function progressRing(cx, cy, radius, progress, color, options = {}) {
    const opts = Object.assign({ trackColor: 'rgba(255,255,255,0.1)', lineWidth: 8, glow: false, rounded: true, gradient: false }, options);
    const lineWidth = opts.lineWidth || 8;
    const r = radius || 50;

    let code = `// [progress-ring]\n`;
    code += `(() => {\n`;
    code += `  ctx.save();\n`;
    code += `  const r = ${r}, lw = ${lineWidth};\n`;
    code += `  const startAngle = -Math.PI / 2;\n`;
    code += `  const endAngle = startAngle + Math.PI * 2 * ${progress};\n`;
    code += `  const color = '${_esc(color)}';\n`;
    code += `  const rgb = utils.color.hexToRgb(color);\n`;

    // Track
    code += `  ctx.beginPath();\n`;
    code += `  ctx.arc(${cx}, ${cy}, r, 0, Math.PI * 2);\n`;
    code += `  ctx.strokeStyle = '${_esc(opts.trackColor)}';\n`;
    code += `  ctx.lineWidth = lw;\n`;
    code += `  ctx.stroke();\n`;

    // Progress arc
    code += `  ctx.beginPath();\n`;
    code += `  ctx.arc(${cx}, ${cy}, r, startAngle, endAngle);\n`;
    if (opts.glow) {
      code += `  ctx.shadowColor = color;\n`;
      code += `  ctx.shadowBlur = 15;\n`;
    }
    if (opts.gradient) {
      code += `  const grad = ctx.createLinearGradient(${cx} - r, ${cy}, ${cx} + r, ${cy});\n`;
      code += `  grad.addColorStop(0, \`rgba(\${Math.min(255, rgb.r + 60)},\${rgb.g},\${rgb.b},1)\`);\n`;
      code += `  grad.addColorStop(1, color);\n`;
      code += `  ctx.strokeStyle = grad;\n`;
    } else {
      code += `  ctx.strokeStyle = color;\n`;
    }
    code += `  ctx.lineWidth = lw;\n`;
    code += `  ctx.lineCap = '${opts.rounded ? 'round' : 'butt'}';\n`;
    code += `  ctx.stroke();\n`;

    // Percentage text
    code += `  const pct = Math.round(${progress} * 100);\n`;
    code += `  ctx.shadowBlur = 0;\n`;
    code += `  ctx.font = 'bold ${Math.round(r * 0.4)}px sans-serif';\n`;
    code += `  ctx.fillStyle = '#ffffff';\n`;
    code += `  ctx.textAlign = 'center';\n`;
    code += `  ctx.textBaseline = 'middle';\n`;
    code += `  ctx.fillText(pct + '%', ${cx}, ${cy});\n`;

    code += `  ctx.restore();\n`;
    code += `})();\n`;
    return code;
  }

  // ─── 7. Scene Transitions ───────────────────────────────────────
  function transitionOverlay(type, progress) {
    let code = `// [transition-overlay - ${type}]\n`;
    code += `(() => {\n`;
    code += `  const p = ${progress};\n`;
    code += `  const w = width, h = height;\n`;
    code += `  ctx.save();\n`;

    switch (type) {
      case 'wipe':
        code += `  ctx.fillStyle = '#000000';\n`;
        code += `  ctx.fillRect(0, 0, w * p, h);\n`;
        break;

      case 'iris':
        code += `  const maxR = Math.sqrt(w * w + h * h) / 2;\n`;
        code += `  const r = maxR * (1 - p);\n`;
        code += `  ctx.fillStyle = '#000000';\n`;
        code += `  ctx.fillRect(0, 0, w, h);\n`;
        code += `  ctx.globalCompositeOperation = 'destination-out';\n`;
        code += `  ctx.beginPath(); ctx.arc(w / 2, h / 2, r, 0, Math.PI * 2); ctx.fill();\n`;
        break;

      case 'zoom':
        code += `  const scale = utils.lerp(0, 1, p);\n`;
        code += `  ctx.fillStyle = '#000000';\n`;
        code += `  ctx.fillRect(0, 0, w, h);\n`;
        code += `  ctx.globalCompositeOperation = 'destination-out';\n`;
        code += `  ctx.translate(w / 2, h / 2);\n`;
        code += `  ctx.scale(scale, scale);\n`;
        code += `  ctx.translate(-w / 2, -h / 2);\n`;
        code += `  ctx.fillRect(0, 0, w, h);\n`;
        break;

      case 'slide':
        code += `  ctx.fillStyle = '#000000';\n`;
        code += `  ctx.fillRect(0, 0, w, h);\n`;
        code += `  ctx.globalCompositeOperation = 'destination-out';\n`;
        code += `  ctx.translate(0, (1 - p) * h);\n`;
        code += `  ctx.fillRect(0, 0, w, h);\n`;
        break;

      case 'radialBlur':
        code += `  const alpha = 1 - p;\n`;
        code += `  ctx.fillStyle = \`rgba(0,0,0,\${alpha})\`;\n`;
        code += `  ctx.fillRect(0, 0, w, h);\n`;
        break;

      default:
        code += `  ctx.fillStyle = \`rgba(0,0,0,\${p})\`;\n`;
        code += `  ctx.fillRect(0, 0, w, h);\n`;
    }

    code += `  ctx.restore();\n`;
    code += `})();\n`;
    return code;
  }

  // ─── 8. Light and Shadow Effects ───────────────────────────────
  function lightRays(x, y, count, color, spread) {
    count = count || 12;
    color = color || '#ffdd88';
    spread = spread || 0.3;

    let code = `// [light-rays]\n`;
    code += `(() => {\n`;
    code += `  ctx.save();\n`;
    code += `  const rgb = utils.color.hexToRgb('${_esc(color)}');\n`;
    code += `  const n = ${count};\n`;
    code += `  const sp = ${spread};\n`;
    code += `  ctx.globalCompositeOperation = 'screen';\n`;

    code += `  for (let i = 0; i < n; i++) {\n`;
    code += `    const angle = (i / n) * Math.PI * 2 + t * 0.1;\n`;
    code += `    const len = Math.max(width, height);\n`;
    code += `    const halfAngle = sp / n;\n`;
    code += `    const wobble = 0.02 * Math.sin(t * 2 + i);\n`;
    code += `    ctx.beginPath();\n`;
    code += `    ctx.moveTo(${x}, ${y});\n`;
    code += `    ctx.lineTo(${x} + Math.cos(angle - halfAngle + wobble) * len, ${y} + Math.sin(angle - halfAngle + wobble) * len);\n`;
    code += `    ctx.lineTo(${x} + Math.cos(angle + halfAngle + wobble) * len, ${y} + Math.sin(angle + halfAngle + wobble) * len);\n`;
    code += `    ctx.closePath();\n`;
    code += `    const alp = 0.04 + 0.02 * Math.sin(t + i * 0.5);\n`;
    code += `    ctx.fillStyle = \`rgba(\${rgb.r},\${rgb.g},\${rgb.b},\${alp})\`;\n`;
    code += `    ctx.fill();\n`;
    code += `  }\n`;

    code += `  ctx.restore();\n`;
    code += `})();\n`;
    return code;
  }

  function depthShadow(x, y, w, h, distance, blur, opacity) {
    distance = distance || 8;
    blur = blur || 20;
    opacity = opacity || 0.3;

    let code = `// [depth-shadow]\n`;
    code += `(() => {\n`;
    code += `  ctx.save();\n`;
    code += `  const layers = 3;\n`;
    code += `  for (let i = layers; i >= 0; i--) {\n`;
    code += `    const mult = (i + 1) / layers;\n`;
    code += `    const offX = ${distance} * mult * 0.5;\n`;
    code += `    const offY = ${distance} * mult;\n`;
    code += `    const b = ${blur} * mult;\n`;
    code += `    const alp = ${opacity} * (1 - i * 0.2);\n`;
    code += `    ctx.shadowColor = \`rgba(0,0,0,\${alp})\`;\n`;
    code += `    ctx.shadowBlur = b;\n`;
    code += `    ctx.shadowOffsetX = offX;\n`;
    code += `    ctx.shadowOffsetY = offY;\n`;
    code += `    ctx.fillStyle = \`rgba(0,0,0,0.01)\`;\n`;
    code += `    ctx.fillRect(${x}, ${y}, ${w}, ${h});\n`;
    code += `  }\n`;
    code += `  ctx.restore();\n`;
    code += `})();\n`;
    return code;
  }

  function glassEffect(x, y, w, h, borderRadius, color) {
    color = color || '#ffffff';
    borderRadius = borderRadius || 16;

    let code = `// [glass-effect]\n`;
    code += `(() => {\n`;
    code += `  ctx.save();\n`;
    code += `  const _x = ${x}, _y = ${y}, _w = ${w}, _h = ${h}, _r = ${borderRadius};\n`;
    code += `  const rgb = utils.color.hexToRgb('${_esc(color)}');\n`;

    // Rounded rect path
    code += `  ctx.beginPath();\n`;
    code += `  ctx.moveTo(_x + _r, _y);\n`;
    code += `  ctx.lineTo(_x + _w - _r, _y);\n`;
    code += `  ctx.arcTo(_x + _w, _y, _x + _w, _y + _r, _r);\n`;
    code += `  ctx.lineTo(_x + _w, _y + _h - _r);\n`;
    code += `  ctx.arcTo(_x + _w, _y + _h, _x + _w - _r, _y + _h, _r);\n`;
    code += `  ctx.lineTo(_x + _r, _y + _h);\n`;
    code += `  ctx.arcTo(_x, _y + _h, _x, _y + _h - _r, _r);\n`;
    code += `  ctx.lineTo(_x, _y + _r);\n`;
    code += `  ctx.arcTo(_x, _y, _x + _r, _y, _r);\n`;
    code += `  ctx.closePath();\n`;

    // Glass fill
    code += `  const grad = ctx.createLinearGradient(_x, _y, _x, _y + _h);\n`;
    code += `  grad.addColorStop(0, \`rgba(\${rgb.r},\${rgb.g},\${rgb.b},0.12)\`);\n`;
    code += `  grad.addColorStop(1, \`rgba(\${rgb.r},\${rgb.g},\${rgb.b},0.04)\`);\n`;
    code += `  ctx.fillStyle = grad;\n`;
    code += `  ctx.fill();\n`;

    // Border
    code += `  ctx.strokeStyle = \`rgba(\${rgb.r},\${rgb.g},\${rgb.b},0.25)\`;\n`;
    code += `  ctx.lineWidth = 1;\n`;
    code += `  ctx.stroke();\n`;

    // Specular highlight
    code += `  ctx.save();\n`;
    code += `  ctx.clip();\n`;
    code += `  const spec = ctx.createLinearGradient(_x, _y, _x, _y + _h * 0.4);\n`;
    code += `  spec.addColorStop(0, 'rgba(255,255,255,0.15)');\n`;
    code += `  spec.addColorStop(1, 'rgba(255,255,255,0)');\n`;
    code += `  ctx.fillStyle = spec;\n`;
    code += `  ctx.fillRect(_x, _y, _w, _h * 0.4);\n`;
    code += `  ctx.restore();\n`;

    code += `  ctx.restore();\n`;
    code += `})();\n`;
    return code;
  }

  // ─── 9. Pre-composed Scene Presets ──────────────────────────────
  const scenePresets = {
    heroTitle(text, color) {
      text = text || 'HERO TITLE';
      color = color || '#ffffff';
      let code = `// [scene-preset: hero-title]\n`;
      code += `(() => {\n`;
      // Background gradient
      code += `  const bg = ctx.createRadialGradient(width * 0.5, height * 0.35, 0, width * 0.5, height * 0.5, width * 0.7);\n`;
      code += `  bg.addColorStop(0, '#1a1a3e');\n`;
      code += `  bg.addColorStop(1, '#0a0a1a');\n`;
      code += `  ctx.fillStyle = bg;\n`;
      code += `  ctx.fillRect(0, 0, width, height);\n`;
      // Accent glow behind text
      code += `  const gr = ctx.createRadialGradient(width * 0.5, height * 0.5, 0, width * 0.5, height * 0.5, 200);\n`;
      code += `  const rgb = utils.color.hexToRgb('${_esc(color)}');\n`;
      code += `  gr.addColorStop(0, \`rgba(\${rgb.r},\${rgb.g},\${rgb.b},0.15)\`);\n`;
      code += `  gr.addColorStop(1, 'rgba(0,0,0,0)');\n`;
      code += `  ctx.fillStyle = gr;\n`;
      code += `  ctx.fillRect(0, 0, width, height);\n`;
      // Floating particles
      code += `  for (let i = 0; i < 25; i++) {\n`;
      code += `    const seed = i * 137.508;\n`;
      code += `    const px = (seed * 7.31) % width;\n`;
      code += `    const py = ((seed * 11.73 + t * 20) % height + height) % height;\n`;
      code += `    ctx.beginPath(); ctx.arc(px, py, 1.5, 0, Math.PI * 2);\n`;
      code += `    ctx.fillStyle = \`rgba(\${rgb.r},\${rgb.g},\${rgb.b},\${0.15 + 0.15 * Math.sin(t + seed)})\`;\n`;
      code += `    ctx.fill();\n`;
      code += `  }\n`;
      // Vignette
      code += `  const vig = ctx.createRadialGradient(width / 2, height / 2, width * 0.2, width / 2, height / 2, width * 0.85);\n`;
      code += `  vig.addColorStop(0, 'rgba(0,0,0,0)');\n`;
      code += `  vig.addColorStop(1, 'rgba(0,0,0,0.5)');\n`;
      code += `  ctx.fillStyle = vig;\n`;
      code += `  ctx.fillRect(0, 0, width, height);\n`;
      // Title text
      code += `  const scale = Math.min(width / 1200, height / 800) * 72;\n`;
      code += `  ctx.save();\n`;
      code += `  ctx.font = \`bold \${scale}px sans-serif\`;\n`;
      code += `  ctx.textAlign = 'center';\n`;
      code += `  ctx.textBaseline = 'middle';\n`;
      code += `  ctx.shadowColor = '${_esc(color)}';\n`;
      code += `  ctx.shadowBlur = 30;\n`;
      code += `  ctx.fillStyle = '${_esc(color)}';\n`;
      code += `  ctx.fillText('${_esc(text)}', width / 2, height / 2);\n`;
      code += `  ctx.shadowColor = 'rgba(255,255,255,0.5)';\n`;
      code += `  ctx.shadowBlur = 6;\n`;
      code += `  ctx.fillStyle = 'rgba(255,255,255,0.7)';\n`;
      code += `  ctx.fillText('${_esc(text)}', width / 2, height / 2);\n`;
      code += `  ctx.restore();\n`;
      code += `})();\n`;
      return code;
    },

    dataShowcase(data, colors) {
      data = data || [{ label: 'A', value: 75 }, { label: 'B', value: 50 }, { label: 'C', value: 90 }];
      colors = colors || ['#4a90d9', '#a855f7', '#06b6d4'];
      let code = `// [scene-preset: data-showcase]\n`;
      code += `(() => {\n`;
      code += `  ctx.fillStyle = '#0f1117';\n`;
      code += `  ctx.fillRect(0, 0, width, height);\n`;
      code += `  const data = ${_j(data)};\n`;
      code += `  const colors = ${_j(colors)};\n`;
      code += `  const maxVal = Math.max(...data.map(d => d.value));\n`;
      code += `  const barW = Math.min(60, (width - 100) / data.length - 20);\n`;
      code += `  const startX = width / 2 - (data.length * (barW + 20) - 20) / 2;\n`;
      code += `  const baseY = height * 0.7;\n`;
      code += `  const maxH = height * 0.4;\n`;
      code += `  data.forEach((item, i) => {\n`;
      code += `    const bx = startX + i * (barW + 20);\n`;
      code += `    const barH = (item.value / maxVal) * maxH;\n`;
      code += `    const c = colors[i % colors.length];\n`;
      code += `    const rgb = utils.color.hexToRgb(c);\n`;
      code += `    const grad = ctx.createLinearGradient(bx, baseY - barH, bx, baseY);\n`;
      code += `    grad.addColorStop(0, \`rgba(\${Math.min(255, rgb.r + 40)},\${Math.min(255, rgb.g + 40)},\${Math.min(255, rgb.b + 40)},1)\`);\n`;
      code += `    grad.addColorStop(1, c);\n`;
      code += `    ctx.fillStyle = grad;\n`;
      code += `    ctx.shadowColor = c;\n`;
      code += `    ctx.shadowBlur = 10;\n`;
      code += `    const r = Math.min(6, barW / 2);\n`;
      code += `    ctx.beginPath();\n`;
      code += `    ctx.moveTo(bx + r, baseY - barH);\n`;
      code += `    ctx.lineTo(bx + barW - r, baseY - barH);\n`;
      code += `    ctx.arcTo(bx + barW, baseY - barH, bx + barW, baseY - barH + r, r);\n`;
      code += `    ctx.lineTo(bx + barW, baseY);\n`;
      code += `    ctx.lineTo(bx, baseY);\n`;
      code += `    ctx.lineTo(bx, baseY - barH + r);\n`;
      code += `    ctx.arcTo(bx, baseY - barH, bx + r, baseY - barH, r);\n`;
      code += `    ctx.closePath();\n`;
      code += `    ctx.fill();\n`;
      code += `    ctx.shadowBlur = 0;\n`;
      code += `    ctx.font = 'bold 14px sans-serif';\n`;
      code += `    ctx.fillStyle = '#ffffff';\n`;
      code += `    ctx.textAlign = 'center';\n`;
      code += `    ctx.fillText(item.value, bx + barW / 2, baseY - barH - 10);\n`;
      code += `    ctx.font = '12px sans-serif';\n`;
      code += `    ctx.fillStyle = 'rgba(255,255,255,0.6)';\n`;
      code += `    ctx.fillText(item.label, bx + barW / 2, baseY + 20);\n`;
      code += `  });\n`;
      code += `})();\n`;
      return code;
    },

    quoteCard(text, author) {
      text = text || '"Design is not just what it looks like. Design is how it works."';
      author = author || 'Steve Jobs';
      let code = `// [scene-preset: quote-card]\n`;
      code += `(() => {\n`;
      code += `  ctx.fillStyle = '#0f1117';\n`;
      code += `  ctx.fillRect(0, 0, width, height);\n`;
      code += `  const cw = Math.min(600, width * 0.7), ch = Math.min(300, height * 0.5);\n`;
      code += `  const cx = (width - cw) / 2, cy = (height - ch) / 2;\n`;
      code += `  const cr = 16;\n`;
      // Card background
      code += `  ctx.save();\n`;
      code += `  ctx.beginPath();\n`;
      code += `  ctx.moveTo(cx + cr, cy); ctx.lineTo(cx + cw - cr, cy); ctx.arcTo(cx + cw, cy, cx + cw, cy + cr, cr);\n`;
      code += `  ctx.lineTo(cx + cw, cy + ch - cr); ctx.arcTo(cx + cw, cy + ch, cx + cw - cr, cy + ch, cr);\n`;
      code += `  ctx.lineTo(cx + cr, cy + ch); ctx.arcTo(cx, cy + ch, cx, cy + ch - cr, cr);\n`;
      code += `  ctx.lineTo(cx, cy + cr); ctx.arcTo(cx, cy, cx + cr, cy, cr);\n`;
      code += `  ctx.closePath();\n`;
      code += `  ctx.fillStyle = 'rgba(255,255,255,0.06)';\n`;
      code += `  ctx.fill();\n`;
      code += `  ctx.strokeStyle = 'rgba(255,255,255,0.15)';\n`;
      code += `  ctx.lineWidth = 1;\n`;
      code += `  ctx.stroke();\n`;
      // Specular
      code += `  ctx.clip();\n`;
      code += `  const spec = ctx.createLinearGradient(cx, cy, cx, cy + ch * 0.3);\n`;
      code += `  spec.addColorStop(0, 'rgba(255,255,255,0.08)');\n`;
      code += `  spec.addColorStop(1, 'rgba(255,255,255,0)');\n`;
      code += `  ctx.fillStyle = spec;\n`;
      code += `  ctx.fillRect(cx, cy, cw, ch * 0.3);\n`;
      code += `  ctx.restore();\n`;
      // Quote mark
      code += `  ctx.font = \`bold \${Math.min(60, cw * 0.1)}px serif\`;\n`;
      code += `  ctx.fillStyle = 'rgba(255,255,255,0.15)';\n`;
      code += `  ctx.textAlign = 'left';\n`;
      code += `  ctx.fillText('\\u201C', cx + 20, cy + 60);\n`;
      // Quote text
      code += `  ctx.font = \`italic \${Math.min(20, cw * 0.035)}px sans-serif\`;\n`;
      code += `  ctx.fillStyle = '#e0e0e0';\n`;
      code += `  ctx.textAlign = 'center';\n`;
      code += `  const lines = ctx.wrapText ? ['${_esc(text)}'] : ['${_esc(text)}'];\n`;
      code += `  const maxW = cw - 60;\n`;
      code += `  let ly = cy + ch * 0.4;\n`;
      code += `  const words = '${_esc(text)}'.split(' ');\n`;
      code += `  let line = '';\n`;
      code += `  words.forEach(word => {\n`;
      code += `    const test = line ? line + ' ' + word : word;\n`;
      code += `    if (ctx.measureText(test).width > maxW && line) {\n`;
      code += `      ctx.fillText(line, cx + cw / 2, ly); ly += 28; line = word;\n`;
      code += `    } else { line = test; }\n`;
      code += `  });\n`;
      code += `  if (line) ctx.fillText(line, cx + cw / 2, ly);\n`;
      // Author
      code += `  ctx.font = \`bold \${Math.min(14, cw * 0.025)}px sans-serif\`;\n`;
      code += `  ctx.fillStyle = 'rgba(255,255,255,0.5)';\n`;
      code += `  ctx.fillText('-- ${_esc(author)}', cx + cw / 2, cy + ch - 25);\n`;
      code += `})();\n`;
      return code;
    },

    comparison(left, right) {
      left = left || { title: 'Before', desc: 'Old approach', color: '#ef4444' };
      right = right || { title: 'After', desc: 'New approach', color: '#22c55e' };
      let code = `// [scene-preset: comparison]\n`;
      code += `(() => {\n`;
      code += `  ctx.fillStyle = '#0f1117';\n`;
      code += `  ctx.fillRect(0, 0, width, height);\n`;
      code += `  const gap = 20, pad = 40;\n`;
      code += `  const cw = (width - pad * 2 - gap) / 2;\n`;
      code += `  const ch = Math.min(350, height * 0.6);\n`;
      code += `  const cy = (height - ch) / 2;\n`;
      code += `  [{...(${_j(left)}, {x: pad}), ...(${_j(right)}, {x: pad + cw + gap})].forEach((side, idx) => {\n`;
      code += `    const sx = side.x, cr = 12;\n`;
      code += `    const rgb = utils.color.hexToRgb(side.color);\n`;
      code += `    // Card\n`;
      code += `    ctx.save();\n`;
      code += `    ctx.beginPath();\n`;
      code += `    ctx.moveTo(sx + cr, cy); ctx.lineTo(sx + cw - cr, cy); ctx.arcTo(sx + cw, cy, sx + cw, cy + cr, cr);\n`;
      code += `    ctx.lineTo(sx + cw, cy + ch - cr); ctx.arcTo(sx + cw, cy + ch, sx + cw - cr, cy + ch, cr);\n`;
      code += `    ctx.lineTo(sx + cr, cy + ch); ctx.arcTo(sx, cy + ch, sx, cy + ch - cr, cr);\n`;
      code += `    ctx.lineTo(sx, cy + cr); ctx.arcTo(sx, cy, sx + cr, cy, cr);\n`;
      code += `    ctx.closePath();\n`;
      code += `    ctx.fillStyle = \`rgba(\${rgb.r},\${rgb.g},\${rgb.b},0.08)\`;\n`;
      code += `    ctx.fill();\n`;
      code += `    ctx.strokeStyle = \`rgba(\${rgb.r},\${rgb.g},\${rgb.b},0.3)\`;\n`;
      code += `    ctx.lineWidth = 1;\n`;
      code += `    ctx.stroke();\n`;
      code += `    // Top accent bar\n`;
      code += `    ctx.beginPath();\n`;
      code += `    ctx.moveTo(sx + cr, cy); ctx.lineTo(sx + cw - cr, cy); ctx.arcTo(sx + cw, cy, sx + cw, cy + cr, cr);\n`;
      code += `    ctx.lineTo(sx + cw, cy + 4); ctx.lineTo(sx, cy + 4); ctx.lineTo(sx, cy + cr); ctx.arcTo(sx, cy, sx + cr, cy, cr);\n`;
      code += `    ctx.closePath();\n`;
      code += `    ctx.fillStyle = \`rgba(\${rgb.r},\${rgb.g},\${rgb.b},0.6)\`;\n`;
      code += `    ctx.fill();\n`;
      code += `    // Title\n`;
      code += `    ctx.font = 'bold 22px sans-serif';\n`;
      code += `    ctx.fillStyle = '#ffffff';\n`;
      code += `    ctx.textAlign = 'center';\n`;
      code += `    ctx.fillText(side.title, sx + cw / 2, cy + 50);\n`;
      code += `    // Description\n`;
      code += `    ctx.font = '15px sans-serif';\n`;
      code += `    ctx.fillStyle = 'rgba(255,255,255,0.6)';\n`;
      code += `    ctx.fillText(side.desc, sx + cw / 2, cy + 80);\n`;
      code += `    ctx.restore();\n`;
      code += `  });\n`;
      // VS divider
      code += `  ctx.font = 'bold 20px sans-serif';\n`;
      code += `  ctx.fillStyle = 'rgba(255,255,255,0.4)';\n`;
      code += `  ctx.textAlign = 'center';\n`;
      code += `  ctx.fillText('VS', width / 2, cy + ch / 2);\n`;
      code += `})();\n`;
      return code;
    },

    timeline(events) {
      events = events || [
        { year: '2020', label: 'Started' },
        { year: '2022', label: 'Grew' },
        { year: '2024', label: 'Scaled' },
        { year: '2026', label: 'Leading' }
      ];
      let code = `// [scene-preset: timeline]\n`;
      code += `(() => {\n`;
      code += `  ctx.fillStyle = '#0f1117';\n`;
      code += `  ctx.fillRect(0, 0, width, height);\n`;
      code += `  const events = ${_j(events)};\n`;
      code += `  const lineY = height * 0.55;\n`;
      code += `  const startX = width * 0.1, endX = width * 0.9;\n`;
      code += `  // Main line\n`;
      code += `  ctx.strokeStyle = 'rgba(255,255,255,0.2)';\n`;
      code += `  ctx.lineWidth = 2;\n`;
      code += `  ctx.beginPath(); ctx.moveTo(startX, lineY); ctx.lineTo(endX, lineY); ctx.stroke();\n`;
      // Events
      code += `  events.forEach((ev, i) => {\n`;
      code += `    const ex = utils.lerp(startX, endX, i / (events.length - 1));\n`;
      code += `    const isTop = i % 2 === 0;\n`;
      code += `    const dotY = lineY;\n`;
      code += `    // Dot\n`;
      code += `    ctx.beginPath(); ctx.arc(ex, dotY, 6, 0, Math.PI * 2);\n`;
      code += `    ctx.fillStyle = '#4a90d9';\n`;
      code += `    ctx.shadowColor = '#4a90d9'; ctx.shadowBlur = 10;\n`;
      code += `    ctx.fill(); ctx.shadowBlur = 0;\n`;
      code += `    ctx.beginPath(); ctx.arc(ex, dotY, 3, 0, Math.PI * 2);\n`;
      code += `    ctx.fillStyle = '#ffffff'; ctx.fill();\n`;
      code += `    // Connector\n`;
      code += `    ctx.strokeStyle = 'rgba(255,255,255,0.15)';\n`;
      code += `    ctx.lineWidth = 1;\n`;
      code += `    ctx.beginPath(); ctx.moveTo(ex, dotY); ctx.lineTo(ex, isTop ? dotY - 50 : dotY + 50); ctx.stroke();\n`;
      code += `    // Year\n`;
      code += `    ctx.font = 'bold 16px sans-serif';\n`;
      code += `    ctx.fillStyle = '#ffffff';\n`;
      code += `    ctx.textAlign = 'center';\n`;
      code += `    ctx.fillText(ev.year, ex, isTop ? dotY - 60 : dotY + 75);\n`;
      code += `    // Label\n`;
      code += `    ctx.font = '13px sans-serif';\n`;
      code += `    ctx.fillStyle = 'rgba(255,255,255,0.5)';\n`;
      code += `    ctx.fillText(ev.label, ex, isTop ? dotY - 80 : dotY + 95);\n`;
      code += `  });\n`;
      code += `})();\n`;
      return code;
    },

    numberReveal(number, label) {
      number = number || 1000;
      label = label || 'Users';
      let code = `// [scene-preset: number-reveal]\n`;
      code += `(() => {\n`;
      code += `  ctx.fillStyle = '#0a0a1a';\n`;
      code += `  ctx.fillRect(0, 0, width, height);\n`;
      code += `  // Glow behind number\n`;
      code += `  const gr = ctx.createRadialGradient(width / 2, height * 0.45, 0, width / 2, height * 0.45, 250);\n`;
      code += `  gr.addColorStop(0, 'rgba(74,144,217,0.12)');\n`;
      code += `  gr.addColorStop(1, 'rgba(0,0,0,0)');\n`;
      code += `  ctx.fillStyle = gr;\n`;
      code += `  ctx.fillRect(0, 0, width, height);\n`;
      // Animated number\n`;
      code += `  const target = ${number};\n`;
      code += `  const progress = utils.clamp(t * 0.6, 0, 1);\n`;
      code += `  const ep = utils.ease.outCubic(progress);\n`;
      code += `  const current = Math.round(target * ep);\n`;
      code += `  const scale = Math.min(width / 800, 1) * 80;\n`;
      code += `  ctx.font = \`bold \${scale}px sans-serif\`;\n`;
      code += `  ctx.fillStyle = '#ffffff';\n`;
      code += `  ctx.textAlign = 'center';\n`;
      code += `  ctx.textBaseline = 'middle';\n`;
      code += `  ctx.shadowColor = '#4a90d9';\n`;
      code += `  ctx.shadowBlur = 30;\n`;
      code += `  ctx.fillText(current.toLocaleString(), width / 2, height * 0.45);\n`;
      code += `  ctx.shadowBlur = 0;\n`;
      // Label\n`;
      code += `  ctx.font = \`300 \${scale * 0.3}px sans-serif\`;\n`;
      code += `  ctx.fillStyle = 'rgba(255,255,255,0.5)';\n`;
      code += `  ctx.letterSpacing = '4px';\n`;
      code += `  ctx.fillText('${_esc(label).toUpperCase()}', width / 2, height * 0.45 + scale * 0.5);\n`;
      // Underline accent\n`;
      code += `  const uw = ctx.measureText('${_esc(label).toUpperCase()}').width;\n`;
      code += `  const ugr = ctx.createLinearGradient(width / 2 - uw / 2, 0, width / 2 + uw / 2, 0);\n`;
      code += `  ugr.addColorStop(0, 'rgba(74,144,217,0)');\n`;
      code += `  ugr.addColorStop(0.5, 'rgba(74,144,217,0.5)');\n`;
      code += `  ugr.addColorStop(1, 'rgba(74,144,217,0)');\n`;
      code += `  ctx.strokeStyle = ugr;\n`;
      code += `  ctx.lineWidth = 1;\n`;
      code += `  ctx.beginPath(); ctx.moveTo(width / 2 - uw / 2, height * 0.45 + scale * 0.6); ctx.lineTo(width / 2 + uw / 2, height * 0.45 + scale * 0.6); ctx.stroke();\n`;
      code += `})();\n`;
      return code;
    },

    processFlow(steps) {
      steps = steps || [
        { num: '01', title: 'Research' },
        { num: '02', title: 'Design' },
        { num: '03', title: 'Develop' },
        { num: '04', title: 'Deploy' }
      ];
      let code = `// [scene-preset: process-flow]\n`;
      code += `(() => {\n`;
      code += `  ctx.fillStyle = '#0f1117';\n`;
      code += `  ctx.fillRect(0, 0, width, height);\n`;
      code += `  const steps = ${_j(steps)};\n`;
      code += `  const n = steps.length;\n`;
      code += `  const stepW = Math.min(140, (width - 100) / n - 30);\n`;
      code += `  const totalW = n * stepW + (n - 1) * 30;\n`;
      code += `  const startX = (width - totalW) / 2;\n`;
      code += `  const cy = height * 0.5;\n`;
      code += `  steps.forEach((step, i) => {\n`;
      code += `    const sx = startX + i * (stepW + 30);\n`;
      code += `    const pulse = 1 + 0.03 * Math.sin(t * 2 + i * 0.8);\n`;
      code += `    // Circle\n`;
      code += `    const cr = stepW * 0.35;\n`;
      code += `    ctx.save();\n`;
      code += `    ctx.beginPath(); ctx.arc(sx + stepW / 2, cy, cr * pulse, 0, Math.PI * 2);\n`;
      code += `    ctx.strokeStyle = \`rgba(74,144,217,\${0.3 + 0.2 * Math.sin(t + i)})\`;\n`;
      code += `    ctx.lineWidth = 2;\n`;
      code += `    ctx.shadowColor = '#4a90d9';\n`;
      code += `    ctx.shadowBlur = 8;\n`;
      code += `    ctx.stroke();\n`;
      code += `    ctx.shadowBlur = 0;\n`;
      code += `    ctx.restore();\n`;
      code += `    // Number\n`;
      code += `    ctx.font = 'bold 16px sans-serif';\n`;
      code += `    ctx.fillStyle = '#4a90d9';\n`;
      code += `    ctx.textAlign = 'center';\n`;
      code += `    ctx.textBaseline = 'middle';\n`;
      code += `    ctx.fillText(step.num, sx + stepW / 2, cy);\n`;
      code += `    // Title\n`;
      code += `    ctx.font = '13px sans-serif';\n`;
      code += `    ctx.fillStyle = 'rgba(255,255,255,0.7)';\n`;
      code += `    ctx.fillText(step.title, sx + stepW / 2, cy + cr + 25);\n`;
      // Arrow connector
      code += `    if (i < n - 1) {\n`;
      code += `      const ax1 = sx + stepW + 2, ax2 = sx + stepW + 28;\n`;
      code += `      ctx.strokeStyle = 'rgba(255,255,255,0.15)';\n`;
      code += `      ctx.lineWidth = 1.5;\n`;
      code += `      ctx.beginPath(); ctx.moveTo(ax1, cy); ctx.lineTo(ax2, cy); ctx.stroke();\n`;
      code += `      ctx.beginPath(); ctx.moveTo(ax2, cy); ctx.lineTo(ax2 - 6, cy - 4); ctx.moveTo(ax2, cy); ctx.lineTo(ax2 - 6, cy + 4); ctx.stroke();\n`;
      code += `    }\n`;
      code += `  });\n`;
      code += `})();\n`;
      return code;
    }
  };

  // ─── 10. Utility Code Generators ─────────────────────────────────
  function roundedRect(x, y, w, h, r) {
    r = r || 8;
    let code = `// [rounded-rect]\n`;
    code += `ctx.beginPath();\n`;
    code += `const _r = Math.min(${r}, ${w} / 2, ${h} / 2);\n`;
    code += `ctx.moveTo(${x} + _r, ${y});\n`;
    code += `ctx.lineTo(${x} + ${w} - _r, ${y});\n`;
    code += `ctx.arcTo(${x} + ${w}, ${y}, ${x} + ${w}, ${y} + _r, _r);\n`;
    code += `ctx.lineTo(${x} + ${w}, ${y} + ${h} - _r);\n`;
    code += `ctx.arcTo(${x} + ${w}, ${y} + ${h}, ${x} + ${w} - _r, ${y} + ${h}, _r);\n`;
    code += `ctx.lineTo(${x} + _r, ${y} + ${h});\n`;
    code += `ctx.arcTo(${x}, ${y} + ${h}, ${x}, ${y} + ${h} - _r, _r);\n`;
    code += `ctx.lineTo(${x}, ${y} + _r);\n`;
    code += `ctx.arcTo(${x}, ${y}, ${x} + _r, ${y}, _r);\n`;
    code += `ctx.closePath();\n`;
    return code;
  }

  function animate(prop, from, to, duration, easing, delay = 0) {
    easing = easing || 'outCubic';
    let code = `// [animate ${prop}]\n`;
    code += `(() => {\n`;
    code += `  const raw = utils.clamp((t - ${delay}) / ${duration}, 0, 1);\n`;
    code += `  const ep = utils.ease.${easing}(raw);\n`;
    code += `  const ${prop} = utils.lerp(${from}, ${to}, ep);\n`;
    code += `  return ${prop};\n`;
    code += `})();\n`;
    return code;
  }

  function responsiveScale(baseSize, viewportWidth, idealWidth = 1920) {
    let code = `// [responsive-scale]\n`;
    code += `const _rs = Math.min(${baseSize}, ${baseSize} * (${viewportWidth} / ${idealWidth}));\n`;
    return code;
  }

  // ─── Public API ─────────────────────────────────────────────────
  return {
    // 1. Background
    backgroundAtmosphere,

    // 2. Particles
    particles,

    // 3. Glow
    glow,
    textGlow,

    // 4. Typography
    gradientText,
    textReveal,
    kineticText,

    // 5. Decorative
    cornerAccents,
    decorativeLine,
    accentDots,
    divider,

    // 6. Data Viz
    styledBar,
    animatedCounter,
    progressRing,

    // 7. Transitions
    transitionOverlay,

    // 8. Light & Shadow
    lightRays,
    depthShadow,
    glassEffect,

    // 9. Scene Presets
    scenePresets,

    // 10. Utilities
    roundedRect,
    animate,
    responsiveScale
  };
})();
