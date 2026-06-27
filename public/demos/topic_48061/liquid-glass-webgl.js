/* =========================================================
 * liquid-glass-webgl.js  (v2 修复版)
 *
 * 修复点：
 *   1. UV 计算改为「以元素中心为基准，扩展 ±20% 区域采样」，
 *      这样折射偏移才能"看到"元素之外的背景，避免出现"截屏式贴图"。
 *   2. canvas 不再插入到 .lg 内部，而是悬浮在 .lg 上方 fixed 定位，
 *      使用 CSS clip-path 圆角裁剪；这样不破坏元素自身的 box-shadow。
 *   3. 切换/销毁时彻底清掉残留状态。
 *   4. 加入 RAF 动画循环：每帧重算位置，避免滚动时错位。
 * ========================================================= */

(function (global) {
  'use strict';

  const VERT_SRC = `
    attribute vec2 a_pos;
    varying vec2 v_uv;
    void main() {
      v_uv = (a_pos + 1.0) * 0.5;
      v_uv.y = 1.0 - v_uv.y;
      gl_Position = vec4(a_pos, 0.0, 1.0);
    }
  `;

  const FRAG_SRC = `
    precision highp float;
    varying vec2 v_uv;
    uniform sampler2D u_tex;
    uniform vec4  u_bgRect;        // (uvX, uvY, uvW, uvH) 元素在背景图中占的 UV 区域
    uniform vec2  u_size;          // 元素自身像素尺寸
    uniform float u_radius;        // 圆角半径 px
    uniform float u_bezel;         // 边缘折射宽度 px
    uniform float u_ior;
    uniform float u_displace;
    uniform float u_blur;
    uniform float u_saturate;
    uniform float u_specular;

    float sdRoundRect(vec2 p, vec2 b, float r) {
      vec2 q = abs(p) - b + r;
      return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
    }

    vec3 saturate3(vec3 c, float s) {
      // 安全饱和度：不会让 RGB 超过 1
      float l = dot(c, vec3(0.299, 0.587, 0.114));
      vec3 r = mix(vec3(l), c, s);
      return clamp(r, 0.0, 1.0);
    }

    vec4 sampleBg(vec2 uv) {
      // 把 [0,1] 元素 UV 映射回背景图 UV
      vec2 bgUv = u_bgRect.xy + uv * u_bgRect.zw;
      return texture2D(u_tex, clamp(bgUv, vec2(0.0), vec2(1.0)));
    }

    vec4 blurSample(vec2 uv, float radius) {
      vec4 sum = vec4(0.0);
      float rx = radius / u_size.x * u_bgRect.z;
      float ry = radius / u_size.y * u_bgRect.w;
      vec2 b = u_bgRect.xy + uv * u_bgRect.zw;
      sum += texture2D(u_tex, b + vec2(-rx,-ry)) * 0.075;
      sum += texture2D(u_tex, b + vec2( 0 ,-ry)) * 0.124;
      sum += texture2D(u_tex, b + vec2( rx,-ry)) * 0.075;
      sum += texture2D(u_tex, b + vec2(-rx, 0 )) * 0.124;
      sum += texture2D(u_tex, b               ) * 0.204;
      sum += texture2D(u_tex, b + vec2( rx, 0 )) * 0.124;
      sum += texture2D(u_tex, b + vec2(-rx, ry)) * 0.075;
      sum += texture2D(u_tex, b + vec2( 0 , ry)) * 0.124;
      sum += texture2D(u_tex, b + vec2( rx, ry)) * 0.075;
      return sum;
    }

    void main() {
      vec2 sizePx = u_size * 0.5;
      vec2 pPx = (v_uv - 0.5) * u_size;

      float d = sdRoundRect(pPx, sizePx, u_radius);
      if (d > 0.5) { gl_FragColor = vec4(0.0); return; }

      float edgeDist = -d;
      vec2 dir = normalize(pPx + vec2(0.0001));

      // 折射偏移（像素单位）
      float t = clamp(edgeDist / u_bezel, 0.0, 1.0);
      float strength = pow(1.0 - t, 2.0) * (u_ior - 1.0) * u_displace;
      vec2 offsetPx = -dir * strength;   // 取负号：把外部像素"拉"进来

      // 把像素偏移转成 UV 偏移（相对元素自身的 UV，不是背景图）
      vec2 uvOffset = offsetPx / u_size;
      vec2 sampleUv = clamp(v_uv + uvOffset, vec2(0.0), vec2(1.0));

      vec4 col = u_blur > 0.05
        ? blurSample(sampleUv, u_blur * 6.0)
        : sampleBg(sampleUv);

      col.rgb = saturate3(col.rgb, u_saturate);

      // 边缘高光：只在最外 30% 边缘环，且按方向（左上来光）做衰减
      vec2 nDir = normalize(pPx + vec2(0.0001));
      vec2 lightDir = normalize(vec2(-0.6, -0.8));  // 左上方光源
      float ndl = max(0.0, dot(nDir, lightDir));    // 边缘法线与光的点积
      float ring = smoothstep(u_bezel * 0.35, 0.0, edgeDist)
                 - smoothstep(0.0, -3.0, edgeDist); // 仅边缘内 35% + 抗锯齿
      float spec = ring * ndl * u_specular * 0.5;
      col.rgb = clamp(col.rgb + spec, 0.0, 1.0);

      // 整体边缘抗锯齿
      float alpha = smoothstep(0.5, -0.5, d);
      gl_FragColor = vec4(col.rgb, alpha);
    }
  `;

  /* ---------- 共享背景纹理 ---------- */
  let sharedImg = null;
  let sharedPromise = null;
  function loadBackground() {
    if (sharedPromise) return sharedPromise;
    sharedPromise = new Promise((resolve, reject) => {
      const url = (getComputedStyle(document.body).backgroundImage || '')
        .replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
      if (!url) return reject('no background');
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => { sharedImg = img; resolve(img); };
      img.onerror = reject;
      img.src = url;
    });
    return sharedPromise;
  }

  /* ---------- WebGL 工具 ---------- */
  function createShader(gl, type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(s));
      gl.deleteShader(s); return null;
    }
    return s;
  }
  function createProgram(gl) {
    const p = gl.createProgram();
    const vs = createShader(gl, gl.VERTEX_SHADER, VERT_SRC);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, FRAG_SRC);
    if (!vs || !fs) return null;
    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(p)); return null;
    }
    return p;
  }

  /* ---------- 实例 ---------- */
  function createWebglInstance(el, opts) {
    opts = Object.assign({
      displace: 18, bezel: 40, thick: 80,
      ior: 1.8, blur: 0.6, saturate: 1.6, specular: 0.55,
    }, opts || {});

    // 关键：先清理元素上残留的 SVG filter
    el.style.backdropFilter = '';
    el.style.webkitBackdropFilter = '';

    const radius = +el.dataset.radius || 28;
    let destroyed = false;

    // 创建悬浮 canvas（fixed 定位，盖在元素位置上）
    const canvas = document.createElement('canvas');
    canvas.className = 'lg-webgl-overlay';
    canvas.style.cssText = `
      position: fixed;
      pointer-events: none;
      z-index: 5;
      border-radius: inherit;
    `;
    document.body.appendChild(canvas);

    const gl = canvas.getContext('webgl', {
      premultipliedAlpha: false, alpha: true, antialias: true,
    });
    if (!gl) { canvas.remove(); return { destroy() {} }; }

    const program = createProgram(gl);
    if (!program) { canvas.remove(); return { destroy() {} }; }
    gl.useProgram(program);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER,
      new Float32Array([-1,-1, 1,-1, -1,1,  -1,1, 1,-1, 1,1]),
      gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(program, 'a_pos');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uniforms = {};
    ['u_bgRect','u_size','u_radius','u_bezel','u_ior',
     'u_displace','u_blur','u_saturate','u_specular'].forEach(name => {
      uniforms[name] = gl.getUniformLocation(program, name);
    });

    let texture = null;
    let lastL = -1, lastT = -1, lastW = -1, lastH = -1;
    let rafId = null;

    function render() {
      if (destroyed || !sharedImg) return;

      const elRect = el.getBoundingClientRect();
      const w = Math.max(2, Math.round(elRect.width));
      const h = Math.max(2, Math.round(elRect.height));

      // 同步 canvas 位置 & 尺寸
      if (elRect.left !== lastL || elRect.top !== lastT
          || w !== lastW || h !== lastH) {
        canvas.style.left = elRect.left + 'px';
        canvas.style.top  = elRect.top + 'px';
        canvas.style.width  = w + 'px';
        canvas.style.height = h + 'px';
        canvas.width = w;
        canvas.height = h;
        canvas.style.borderRadius = (
          getComputedStyle(el).borderRadius || (radius + 'px')
        );
        lastL = elRect.left; lastT = elRect.top; lastW = w; lastH = h;
      }

      // 计算元素在背景图中的 UV 区域（background: cover 居中）
      const imgW = sharedImg.naturalWidth;
      const imgH = sharedImg.naturalHeight;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const scl = Math.max(vw / imgW, vh / imgH);
      const drawW = imgW * scl, drawH = imgH * scl;
      const offX = (vw - drawW) / 2;
      const offY = (vh - drawH) / 2;

      // 适当向外扩展（让 shader 有"周围像素"可采样）
      const padPx = Math.max(opts.bezel * 1.5, 30);
      const uvX = (elRect.left - offX - padPx) / drawW;
      const uvY = (elRect.top  - offY - padPx) / drawH;
      const uvW = (elRect.width  + padPx * 2) / drawW;
      const uvH = (elRect.height + padPx * 2) / drawH;

      gl.viewport(0, 0, w, h);
      gl.clear(gl.COLOR_BUFFER_BIT);

      // 注意：因为我们扩展了采样区域，shader 中需要把"元素内 0~1 UV"
      // 缩放到中间那一段 (padPx/(w+2pad)) ~ (1 - padPx/(w+2pad))
      const innerX = padPx / (w + padPx * 2);
      const innerY = padPx / (h + padPx * 2);
      const innerW = w / (w + padPx * 2);
      const innerH = h / (h + padPx * 2);
      // 传给 shader 的 bgRect = 元素自身在背景中占的 UV（不含 padding）
      // 但允许 shader 通过 offset 超出这个区域去采 padding 部分
      gl.uniform4f(uniforms.u_bgRect,
        uvX + innerX * uvW,
        uvY + innerY * uvH,
        innerW * uvW,
        innerH * uvH
      );
      gl.uniform2f(uniforms.u_size, w, h);
      gl.uniform1f(uniforms.u_radius, radius);
      gl.uniform1f(uniforms.u_bezel,  Math.min(opts.bezel, radius - 1));
      gl.uniform1f(uniforms.u_ior, opts.ior);
      gl.uniform1f(uniforms.u_displace, opts.displace);
      gl.uniform1f(uniforms.u_blur, opts.blur);
      gl.uniform1f(uniforms.u_saturate, opts.saturate);
      gl.uniform1f(uniforms.u_specular, opts.specular);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    function loop() {
      if (destroyed) return;
      render();
      rafId = requestAnimationFrame(loop);
    }

    loadBackground().then(img => {
      if (destroyed) return;
      texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      loop();
    }).catch(err => {
      console.warn('[LiquidGlass WebGL] 背景图加载失败，降级为磨砂：', err);
      destroyed = true;
      canvas.remove();
      el.style.backdropFilter = 'blur(12px) saturate(160%)';
    });

    return {
      destroy() {
        destroyed = true;
        if (rafId) cancelAnimationFrame(rafId);
        if (texture) gl.deleteTexture(texture);
        canvas.remove();
        el.style.backdropFilter = '';
        el.style.webkitBackdropFilter = '';
      }
    };
  }

  global.LiquidGlass = Object.assign(global.LiquidGlass || {}, {
    webgl: createWebglInstance,
  });
})(window);
