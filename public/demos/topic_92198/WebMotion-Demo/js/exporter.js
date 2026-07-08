/**
 * WebMotion - 导出模块（多场景版）
 * 支持多场景导出：PNG 序列帧（ZIP）、WebM with Alpha、GIF 动图
 * LOOP refactor: delegates code compilation to RenderEngine
 */
const Exporter = (function() {

  // 优化：缓存上次编译的 3D 场景代码，避免导出时每帧重复调用 compileCode
  let lastExport3DCode = null;
  // 优化：缓存已编译的 2D 渲染函数（按代码内容索引），避免导出时每帧重复 new Function
  const export2DCodeCache = new Map();

  /**
   * 创建运行时 utils（与 preview.js 共享 RenderEngine 基础）
   */
  function createExportUtils() {
    const exportUtils = Object.create(Utils);
    exportUtils.registerElement = (type, props) => ElementRegistry.registerElement(type, props);
    if (typeof VisualFX !== 'undefined') exportUtils.fx = VisualFX;
    // 注入视觉套件库
    if (typeof gsap !== 'undefined') exportUtils.gsap = gsap;
    if (typeof p5 !== 'undefined') exportUtils.p5 = p5;
    if (typeof d3 !== 'undefined') exportUtils.d3 = d3;
    if (typeof anime !== 'undefined') exportUtils.anime = anime;
    if (typeof flubber !== 'undefined') exportUtils.flubber = flubber;
    if (typeof lottie !== 'undefined') exportUtils.lottie = lottie;
    if (typeof THREE !== 'undefined') exportUtils.THREE = THREE;
    // LOOP refactor: Typography/SafeZone 排版系统
    if (typeof Typography !== 'undefined') {
      exportUtils.typography = Typography;
      exportUtils.safeZone = (w, h) => Typography.safeZone(w, h);
      exportUtils.fontSize = (size, w) => Typography.fontSize(size, w);
      exportUtils.fontString = (weight, size, w) => Typography.fontString(weight, size, w);
    }
    if (typeof TOKENS !== 'undefined') exportUtils.TOKENS = TOKENS;
    return exportUtils;
  }

  // 胶片质感：预生成噪点纹理（质感原则）
  let grainTexture = null;
  function getGrainTexture() {
    if (grainTexture) return grainTexture;
    const size = 256;
    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    const gctx = c.getContext('2d');
    const imgData = gctx.createImageData(size, size);
    for (let i = 0; i < imgData.data.length; i += 4) {
      const v = Math.random() * 255;
      imgData.data[i] = v;
      imgData.data[i + 1] = v;
      imgData.data[i + 2] = v;
      imgData.data[i + 3] = 255;
    }
    gctx.putImageData(imgData, 0, 0);
    grainTexture = c;
    return grainTexture;
  }

  /**
   * 叠加胶片质感噪点（质感原则 - 软默认，用户可选）
   * 使用预生成噪点纹理 + 随机偏移，模拟胶片颗粒感
   */
  function applyFilmGrain(targetCtx, width, height, frameIndex) {
    const grain = getGrainTexture();
    targetCtx.save();
    targetCtx.globalAlpha = 0.04; // 非常微弱，不喧宾夺主
    // 使用 source-atop 只在有内容的地方叠加噪点，保留透明通道
    targetCtx.globalCompositeOperation = 'source-atop';
    // 每帧随机偏移，模拟胶片颗粒的动态感
    const ox = (frameIndex * 37 + 13) % grain.width;
    const oy = (frameIndex * 61 + 29) % grain.height;
    // 平铺绘制覆盖整个画布
    for (let x = -ox; x < width; x += grain.width) {
      for (let y = -oy; y < height; y += grain.height) {
        targetCtx.drawImage(grain, x, y);
      }
    }
    targetCtx.restore();
  }

  /**
   * 获取要导出的场景列表
   * @param {boolean} allScenes - true=所有场景, false=仅当前场景
   */
  function getScenesToExport(allScenes) {
    if (allScenes) return SceneManager.getScenes();
    return [SceneManager.getActiveScene()];
  }

  /**
   * 将指定时间的一帧渲染到目标 context — 统一渲染路径
   * @param {CanvasRenderingContext2D} targetCtx
   * @param {Array} scenes - 场景列表
   * @param {number} globalTime - 全局时间（秒）
   * @param {number} width, height
   */
  function renderFrameToCtx(targetCtx, scenes, globalTime, width, height) {
    // 找到当前时间对应的场景和局部时间
    let acc = 0;
    let activeScene = scenes[0];
    let localTime = globalTime;
    let sceneIndex = 0;
    let found = false;

    for (let i = 0; i < scenes.length; i++) {
      if (globalTime < acc + scenes[i].duration) {
        activeScene = scenes[i];
        localTime = globalTime - acc;
        sceneIndex = i;
        found = true;
        break;
      }
      acc += scenes[i].duration;
    }

    // 超出范围，用最后一个场景
    if (!found) {
      sceneIndex = scenes.length - 1;
      activeScene = scenes[sceneIndex];
      localTime = activeScene.duration;
    }

    // 先清空画布（在转场变换之前，避免变换坐标系中 clearRect 留残影）
    targetCtx.clearRect(0, 0, width, height);

    // 统一转场计算（与 preview.js 共用）
    const transEffect = Utils.calcTransition(activeScene, localTime);
    const hasTrans = Utils.applyTransition(targetCtx, transEffect, width, height);

    try {
      // 1. 3D 模式
      if (activeScene.is3D && ThreeRenderer.isAvailable()) {
        ThreeRenderer.setResolution(width, height);
        if (activeScene.code !== lastExport3DCode) {
          ThreeRenderer.compileCode(activeScene.code);
          lastExport3DCode = activeScene.code;
        }
        const threeCanvas = ThreeRenderer.render(localTime);
        if (threeCanvas) {
          targetCtx.drawImage(threeCanvas, 0, 0, width, height);
        }
      }
      // 1b. 3D 模式但 ThreeRenderer 不可用 — 跳过，避免将 3D 代码当 2D 编译
      else if (activeScene.is3D && !ThreeRenderer.isAvailable()) {
        targetCtx.fillStyle = '#06060e';
        targetCtx.fillRect(0, 0, width, height);
        targetCtx.fillStyle = 'rgba(240,236,228,0.4)';
        targetCtx.font = '400 24px sans-serif';
        targetCtx.textAlign = 'center';
        targetCtx.fillText('3D 模式不可用', width/2, height/2);
      }
      // 2. 代码模式（含 ElementRegistry）— 仅在非 3D 模式时执行
      else if (activeScene.code && activeScene.code.trim()) {
        try {
          let renderFn = export2DCodeCache.get(activeScene.code);
          if (!renderFn) {
            const sanitized = Utils.sanitizeCode(activeScene.code, '2d');
            renderFn = new Function('ctx', 't', 'width', 'height', 'utils', sanitized);
            export2DCodeCache.set(activeScene.code, renderFn);
            // Sync with RenderEngine (shared cache)
            if (typeof RenderEngine !== 'undefined') RenderEngine.compileCode(activeScene.code);
            // 新代码场景切换时清空注册表，防止上一个场景的元素泄漏
            ElementRegistry.clear();
          }
          // 确保代码场景也设置正确分辨率（影响 slide/scale 动画偏移量）
          VisualEditor.setResolution(width, height);
          // 使用 ElementRegistry 支持注册元素
          ElementRegistry.beginFrame(localTime, activeScene.duration);
          const exportUtils = createExportUtils();
          renderFn(targetCtx, localTime, width, height, exportUtils);
        } catch (e) {
          console.error('导出渲染错误:', e);
        } finally {
          ElementRegistry.endFrame();
        }
      }

      // 可视化元素（叠加在代码之上，或独立渲染）
      if (activeScene.elements && activeScene.elements.length > 0) {
        VisualEditor.setElements(activeScene.elements);
        VisualEditor.setResolution(width, height);
        if (activeScene.code && activeScene.code.trim()) {
          // 代码已渲染，只叠加元素（不清空画布）
          VisualEditor.drawElementsOnly(targetCtx, localTime, activeScene.duration);
        } else {
          // 无代码，完整渲染（含清空画布）
          VisualEditor.render(targetCtx, localTime, activeScene.duration);
        }
      }
    } finally {
      // 确保 ctx.restore() 始终执行，即使渲染抛出异常
      if (hasTrans) targetCtx.restore();
    }
  }

  /**
   * 导出 PNG 序列帧（多场景）
   */
  async function exportPNGSequence(allScenes, onProgress, options = {}) {
    export2DCodeCache.clear(); // 清理上次导出的缓存，防止内存泄漏
    lastExport3DCode = null; // 重置 3D 代码缓存，防止 dispose 后跳过编译
    const { width, height } = Preview.getSize();
    const fps = Timeline.getFps();
    const scenes = getScenesToExport(allScenes);
    const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0);
    const totalFrames = Math.max(1, Math.floor(totalDuration * fps));
    const filmGrain = options.filmGrain || false;
    const noise = options.noise || false;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = width;
    exportCanvas.height = height;
    const exportCtx = exportCanvas.getContext('2d');

    const files = [];

    for (let i = 0; i < totalFrames; i++) {
      const t = i / fps;
      // 帧渲染重试机制：最多重试 2 次
      let rendered = false;
      for (let attempt = 0; attempt < 3 && !rendered; attempt++) {
        try {
          renderFrameToCtx(exportCtx, scenes, t, width, height);
          rendered = true;
        } catch (e) {
          if (attempt === 2) console.warn(`帧 ${i + 1} 渲染失败，已跳过:`, e.message);
          else await new Promise(r => setTimeout(r, 10));
        }
      }
      if (noise) NoiseOverlay.draw(exportCtx, width, height, t);
      if (filmGrain) applyFilmGrain(exportCtx, width, height, i);

      const blob = await new Promise((resolve, reject) => {
        // 优化：检查 toBlob 返回的 blob 是否为 null，避免导出失败时 Promise 永远 pending
        exportCanvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error('PNG 导出失败：toBlob 返回 null'));
        }, 'image/png');
      });

      files.push({
        name: `frame_${String(i + 1).padStart(5, '0')}.png`,
        blob: blob
      });

      if (onProgress) onProgress((i + 1) / totalFrames, i + 1, totalFrames);
      if (i % 5 === 0) await new Promise(r => setTimeout(r, 0));
    }

    return createZip(files, { width, height, fps, duration: totalDuration, totalFrames });
  }

  /**
   * 导出 WebM with Alpha（多场景）
   */
  async function exportWebM(allScenes, onProgress, options = {}) {
    export2DCodeCache.clear(); // 清理上次导出的缓存，防止内存泄漏
    lastExport3DCode = null; // 重置 3D 代码缓存，防止 dispose 后跳过编译
    const { width, height } = Preview.getSize();
    const fps = Timeline.getFps();
    const scenes = getScenesToExport(allScenes);
    const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0);
    const totalFrames = Math.max(1, Math.floor(totalDuration * fps));
    const filmGrain = options.filmGrain || false;
    const noise = options.noise || false;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = width;
    exportCanvas.height = height;
    const exportCtx = exportCanvas.getContext('2d');

    // 检测浏览器是否支持 canvas.captureStream 和 MediaRecorder
    if (typeof exportCanvas.captureStream !== 'function') {
      throw new Error('当前浏览器不支持 canvas.captureStream，无法导出 WebM。请使用 Chrome 或 Firefox。');
    }
    if (typeof MediaRecorder === 'undefined') {
      throw new Error('当前浏览器不支持 MediaRecorder，无法导出 WebM。请使用 Chrome 或 Firefox。');
    }

    const stream = exportCanvas.captureStream(fps);

    const mimeTypes = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm'
    ];
    let mimeType = '';
    for (const mt of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mt)) { mimeType = mt; break; }
    }
    if (!mimeType) throw new Error('当前浏览器不支持 WebM 录制');

    const recorder = new MediaRecorder(stream, {
      mimeType: mimeType,
      videoBitsPerSecond: 8000000
    });

    const chunks = [];
    recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
    // 优化：处理录制错误，避免出错时 Promise 永远 pending
    const finished = new Promise((resolve, reject) => {
      recorder.onstop = resolve;
      recorder.onerror = (e) => reject(new Error('录制失败: ' + e.error.name));
    });

    recorder.start();

    try {
      const frameDuration = 1000 / fps;
      for (let i = 0; i < totalFrames; i++) {
        const t = i / fps;
        // 帧渲染重试机制
        try {
          renderFrameToCtx(exportCtx, scenes, t, width, height);
          if (noise) NoiseOverlay.draw(exportCtx, width, height, t);
          if (filmGrain) applyFilmGrain(exportCtx, width, height, i);
        } catch (e) {
          console.warn(`WebM 帧 ${i + 1} 渲染失败，已跳过:`, e.message);
        }

        if (onProgress) onProgress((i + 1) / totalFrames, i + 1, totalFrames);
        await new Promise(r => setTimeout(r, frameDuration));
      }

      await new Promise(r => setTimeout(r, 200));
    } finally {
      // 确保录制器始终被停止，防止资源泄漏和 Promise 永远 pending
      if (recorder.state !== 'inactive') {
        recorder.stop();
      }
    }
    await finished;

    return new Blob(chunks, { type: 'video/webm' });
  }

  /**
   * 导出 GIF 动图（多场景）
   * 使用内置 GIF 编码器，支持透明通道或指定背景色
   */
  async function exportGIF(allScenes, onProgress, options = {}) {
    export2DCodeCache.clear(); // 清理上次导出的缓存，防止内存泄漏
    lastExport3DCode = null; // 重置 3D 代码缓存，防止 dispose 后跳过编译
    const { width, height } = Preview.getSize();
    const fps = Timeline.getFps();
    const scenes = getScenesToExport(allScenes);
    const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0);
    const totalFrames = Math.max(1, Math.floor(totalDuration * fps));
    const delayCs = Math.round(100 / fps); // GIF 延迟单位：1/100 秒
    const bgColor = options.bgColor || null; // 背景色（如 '#000000'），null 表示透明
    const filmGrain = options.filmGrain || false;
    const noise = options.noise || false;

    // GIF 内存安全限制：每帧约 width*height*4 字节，总内存不超过 ~500MB
    const maxFrames = Math.min(totalFrames, Math.floor(500 * 1024 * 1024 / (width * height * 4)));
    if (totalFrames > maxFrames) {
      throw new Error(`GIF 帧数过多（${totalFrames} 帧），请缩短时长或降低帧率。建议不超过 ${maxFrames} 帧。`);
    }

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = width;
    exportCanvas.height = height;
    const exportCtx = exportCanvas.getContext('2d');

    // 收集所有帧的像素数据
    const frames = [];
    for (let i = 0; i < totalFrames; i++) {
      const t = i / fps;
      // 帧渲染重试机制
      try {
        renderFrameToCtx(exportCtx, scenes, t, width, height);
      } catch (e) {
        console.warn(`GIF 帧 ${i + 1} 渲染失败，已跳过:`, e.message);
      }
      if (noise) NoiseOverlay.draw(exportCtx, width, height, t);
      if (filmGrain) applyFilmGrain(exportCtx, width, height, i);
      const imageData = exportCtx.getImageData(0, 0, width, height);
      frames.push(imageData);

      if (onProgress) onProgress((i + 1) / totalFrames * 0.5, i + 1, totalFrames);
      if (i % 5 === 0) await new Promise(r => setTimeout(r, 0));
    }

    // 编码 GIF
    if (onProgress) onProgress(0.5, 0, totalFrames);
    const gifBytes = encodeGIF(frames, width, height, delayCs, bgColor, (p) => {
      if (onProgress) onProgress(0.5 + p * 0.5, Math.round(p * totalFrames), totalFrames);
    });

    return new Blob([gifBytes], { type: 'image/gif' });
  }

  // ===== GIF 编码器 =====

  /**
   * GIF89a 编码器
   * @param {ImageData[]} frames - 帧数据数组
   * @param {number} width, height
   * @param {number} delayCs - 每帧延迟（1/100 秒）
   * @param {function} onProgress
   * @returns {Uint8Array} GIF 二进制数据
   */
  function encodeGIF(frames, width, height, delayCs, bgColor, onProgress) {
    const TRANSPARENT_IDX = 0; // 透明色索引
    const MAX_COLORS = 256;    // 最大颜色数（含透明色）
    const useTransparency = !bgColor;

    // 解析背景色
    let bgRGB = null;
    if (bgColor) {
      const hex = bgColor.replace('#', '');
      bgRGB = [
        parseInt(hex.substring(0, 2), 16),
        parseInt(hex.substring(2, 4), 16),
        parseInt(hex.substring(4, 6), 16)
      ];
    }

    const PALETTE_COLORS = useTransparency ? 255 : 256; // 透明模式留 1 个透明色

    // Step 1: 采样像素用于颜色量化
    const samples = [];
    const sampleStep = Math.max(1, Math.floor((width * height) / 50000)); // 采样约5万个像素
    for (const frame of frames) {
      const data = frame.data;
      for (let i = 0; i < data.length; i += 4 * sampleStep) {
        if (useTransparency) {
          if (data[i + 3] > 128) { // 非透明像素
            samples.push([data[i], data[i + 1], data[i + 2]]);
          }
        } else {
          if (data[i + 3] > 128) {
            samples.push([data[i], data[i + 1], data[i + 2]]);
          } else {
            samples.push(bgRGB); // 透明像素用背景色
          }
        }
      }
      if (samples.length > 100000) break; // 限制采样数量
    }

    // Step 2: 中位切分法生成调色板
    const palette = medianCut(samples, PALETTE_COLORS);
    let fullPalette;
    if (useTransparency) {
      // 透明色放在索引 0
      fullPalette = [[0, 0, 0], ...palette];
    } else {
      fullPalette = palette;
    }
    const paletteSize = fullPalette.length;

    // 计算颜色表大小（必须是 2 的幂）
    let gctBits = 1;
    while ((1 << gctBits) < paletteSize) gctBits++;
    if (gctBits < 2) gctBits = 2; // GIF 最小 2 位
    const gctLength = 1 << gctBits;
    const minCodeSize = gctBits;

    // 填充调色板到 2 的幂
    while (fullPalette.length < gctLength) fullPalette.push([0, 0, 0]);

    // 构建颜色查找表（加速最近色搜索）
    const colorLUT = buildColorLUT(fullPalette, useTransparency);

    const parts = [];

    // GIF Header
    parts.push(strToBytes('GIF89a'));

    // Logical Screen Descriptor
    const lsd = new Uint8Array(7);
    lsd[0] = width & 0xFF;
    lsd[1] = (width >> 8) & 0xFF;
    lsd[2] = height & 0xFF;
    lsd[3] = (height >> 8) & 0xFF;
    lsd[4] = 0x80 | ((gctBits - 1) << 4) | (gctBits - 1); // GCT flag + color resolution + GCT size
    lsd[5] = useTransparency ? TRANSPARENT_IDX : 0; // 背景色索引
    lsd[6] = 0; // 像素宽高比
    parts.push(lsd);

    // Global Color Table
    const gct = new Uint8Array(gctLength * 3);
    for (let i = 0; i < gctLength; i++) {
      gct[i * 3] = fullPalette[i][0];
      gct[i * 3 + 1] = fullPalette[i][1];
      gct[i * 3 + 2] = fullPalette[i][2];
    }
    parts.push(gct);

    // Netscape Application Extension（循环播放）
    parts.push(new Uint8Array([
      0x21, 0xFF, 0x0B,
      0x4E, 0x45, 0x54, 0x53, 0x43, 0x41, 0x50, 0x45, 0x32, 0x2E, 0x30, // "NETSCAPE2.0"
      0x03, 0x01, 0x00, 0x00, 0x00
    ]));

    // 每帧编码
    for (let f = 0; f < frames.length; f++) {
      if (onProgress) onProgress(f / frames.length);

      const frameData = frames[f].data;
      const indices = new Uint8Array(width * height);

      // 将像素映射到调色板索引
      for (let i = 0, p = 0; i < frameData.length; i += 4, p++) {
        if (useTransparency && frameData[i + 3] < 128) {
          indices[p] = TRANSPARENT_IDX; // 透明
        } else if (!useTransparency && frameData[i + 3] < 128) {
          // 不透明模式：透明像素用背景色
          indices[p] = findNearestColor(bgRGB[0], bgRGB[1], bgRGB[2], colorLUT, fullPalette);
        } else {
          indices[p] = findNearestColor(frameData[i], frameData[i + 1], frameData[i + 2], colorLUT, fullPalette);
        }
      }

      // Graphics Control Extension
      if (useTransparency) {
        parts.push(new Uint8Array([
          0x21, 0xF9, 0x04,
          0x01, // 透明色标志
          delayCs & 0xFF, (delayCs >> 8) & 0xFF, // 延迟
          TRANSPARENT_IDX, // 透明色索引
          0x00
        ]));
      } else {
        parts.push(new Uint8Array([
          0x21, 0xF9, 0x04,
          0x00, // 无透明色
          delayCs & 0xFF, (delayCs >> 8) & 0xFF, // 延迟
          0x00,
          0x00
        ]));
      }

      // Image Descriptor
      parts.push(new Uint8Array([
        0x2C,
        0x00, 0x00, // 左偏移
        0x00, 0x00, // 上偏移
        width & 0xFF, (width >> 8) & 0xFF,
        height & 0xFF, (height >> 8) & 0xFF,
        0x00 // 无局部颜色表
      ]));

      // LZW 压缩
      const compressed = lzwCompress(indices, minCodeSize);
      parts.push(compressed);
    }

    // Trailer
    parts.push(new Uint8Array([0x3B]));

    // 合并所有部分
    return concatUint8Arrays(parts);
  }

  /**
   * 中位切分法颜色量化
   */
  function medianCut(pixels, maxColors) {
    if (pixels.length === 0) return [[128, 128, 128]];

    let boxes = [pixels.slice()];

    while (boxes.length < maxColors) {
      // 找到范围最大的盒子
      let maxRange = 0;
      let maxBoxIdx = -1;
      let maxChannel = 0;

      for (let i = 0; i < boxes.length; i++) {
        const box = boxes[i];
        if (box.length < 2) continue;

        let minR = 255, maxR = 0, minG = 255, maxG = 0, minB = 255, maxB = 0;
        for (const p of box) {
          if (p[0] < minR) minR = p[0]; if (p[0] > maxR) maxR = p[0];
          if (p[1] < minG) minG = p[1]; if (p[1] > maxG) maxG = p[1];
          if (p[2] < minB) minB = p[2]; if (p[2] > maxB) maxB = p[2];
        }
        const rR = maxR - minR, rG = maxG - minG, rB = maxB - minB;
        const range = Math.max(rR, rG, rB);

        if (range > maxRange) {
          maxRange = range;
          maxBoxIdx = i;
          maxChannel = rR >= rG ? (rR >= rB ? 0 : 2) : (rG >= rB ? 1 : 2);
        }
      }

      if (maxBoxIdx === -1) break;

      // 沿最大范围通道切分
      const box = boxes[maxBoxIdx];
      box.sort((a, b) => a[maxChannel] - b[maxChannel]);
      const mid = Math.floor(box.length / 2);
      boxes.splice(maxBoxIdx, 1, box.slice(0, mid), box.slice(mid));
    }

    // 每个盒子取平均值
    return boxes.map(box => {
      let r = 0, g = 0, b = 0;
      for (const p of box) { r += p[0]; g += p[1]; b += p[2]; }
      const n = box.length || 1;
      return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
    });
  }

  /**
   * 构建颜色查找表（5x5x5 立方体，加速最近色搜索）
   */
  function buildColorLUT(palette, skipFirst) {
    const startIdx = skipFirst ? 1 : 0;
    const defaultIdx = skipFirst ? 1 : 0;
    const lut = new Uint8Array(32 * 32 * 32);
    for (let r = 0; r < 32; r++) {
      for (let g = 0; g < 32; g++) {
        for (let b = 0; b < 32; b++) {
          const cr = r * 8, cg = g * 8, cb = b * 8;
          let minDist = Infinity, minIdx = defaultIdx;
          for (let i = startIdx; i < palette.length; i++) {
            const dr = cr - palette[i][0];
            const dg = cg - palette[i][1];
            const db = cb - palette[i][2];
            const dist = dr * dr + dg * dg + db * db;
            if (dist < minDist) { minDist = dist; minIdx = i; }
          }
          lut[r * 1024 + g * 32 + b] = minIdx;
        }
      }
    }
    return lut;
  }

  /**
   * 查找最近颜色索引
   */
  function findNearestColor(r, g, b, lut, palette) {
    // 先用 LUT 快速查找
    const idx = lut[(r >> 3) * 1024 + (g >> 3) * 32 + (b >> 3)];
    // 精确验证（可选，LUT 已经足够精确）
    return idx;
  }

  /**
   * LZW 压缩（GIF 格式）
   */
  function lzwCompress(indices, minCodeSize) {
    const clearCode = 1 << minCodeSize;
    const endCode = clearCode + 1;
    // Dictionary stores (prevCode, char) pairs -> new code
    // Single chars (0..clearCode-1) are implicit: their code equals their value
    const dictReset = () => new Map();

    let dict = dictReset();
    let nextCode = endCode + 1;
    let codeSize = minCodeSize + 1;

    const bytes = [];
    let bitBuffer = 0;
    let bitCount = 0;

    function writeCode(code, size) {
      bitBuffer |= (code << bitCount);
      bitCount += size;
      while (bitCount >= 8) {
        bytes.push(bitBuffer & 0xFF);
        bitBuffer >>= 8;
        bitCount -= 8;
      }
    }

    writeCode(clearCode, codeSize);

    let w = -1;
    for (let i = 0; i < indices.length; i++) {
      const c = indices[i];

      if (w === -1) {
        w = c;
        continue;
      }

      // Use string key to avoid collisions
      const key = w + '_' + c;
      if (dict.has(key)) {
        w = dict.get(key);
      } else {
        writeCode(w, codeSize);
        dict.set(key, nextCode);
        nextCode++;
        // Increase code size when next code needs more bits
        if (nextCode >= (1 << codeSize) && codeSize < 12) codeSize++;
        // Reset dictionary at max capacity
        if (nextCode >= 4096) {
          writeCode(clearCode, codeSize);
          dict = dictReset();
          nextCode = endCode + 1;
          codeSize = minCodeSize + 1;
        }
        w = c;
      }
    }

    if (w !== -1) writeCode(w, codeSize);
    writeCode(endCode, codeSize);

    if (bitCount > 0) bytes.push(bitBuffer & 0xFF);

    // 转换为 GIF 子块格式
    const result = [minCodeSize];
    let pos = 0;
    while (pos < bytes.length) {
      const blockSize = Math.min(255, bytes.length - pos);
      result.push(blockSize);
      for (let i = 0; i < blockSize; i++) result.push(bytes[pos + i]);
      pos += blockSize;
    }
    result.push(0); // 块终止符

    return new Uint8Array(result);
  }

  // ===== 工具函数 =====

  function strToBytes(str) {
    return new Uint8Array(str.split('').map(c => c.charCodeAt(0)));
  }

  function concatUint8Arrays(arrays) {
    let total = 0;
    for (const a of arrays) total += a.length;
    const result = new Uint8Array(total);
    let pos = 0;
    for (const a of arrays) { result.set(a, pos); pos += a.length; }
    return result;
  }

  /**
   * 创建 ZIP 文件（纯 JS 实现）
   */
  async function createZip(files, meta) {
    const crc32Table = (() => {
      const table = new Uint32Array(256);
      for (let i = 0; i < 256; i++) {
        let c = i;
        for (let j = 0; j < 8; j++) {
          c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        }
        table[i] = c;
      }
      return table;
    })();

    function crc32(data) {
      let crc = 0xFFFFFFFF;
      for (let i = 0; i < data.length; i++) {
        crc = crc32Table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
      }
      return (crc ^ 0xFFFFFFFF) >>> 0;
    }

    const metaContent = JSON.stringify({
      tool: 'WebMotion',
      width: meta.width,
      height: meta.height,
      fps: meta.fps,
      duration: meta.duration,
      totalFrames: meta.totalFrames,
      format: 'PNG Sequence with Alpha',
      createdAt: new Date().toISOString()
    }, null, 2);

    const allFiles = [{ name: 'metadata.json', data: new TextEncoder().encode(metaContent) }];
    for (const f of files) {
      allFiles.push({ name: f.name, data: new Uint8Array(await f.blob.arrayBuffer()) });
    }

    const localParts = [];
    const centralParts = [];
    let offset = 0;

    for (const file of allFiles) {
      const nameBytes = new TextEncoder().encode(file.name);
      const fileData = file.data;
      const crc = crc32(fileData);
      const compressedSize = fileData.length;
      const uncompressedSize = fileData.length;

      const localHeader = new Uint8Array(30 + nameBytes.length);
      const localView = new DataView(localHeader.buffer);
      localView.setUint32(0, 0x04034b50, true);
      localView.setUint16(4, 20, true);
      localView.setUint16(6, 0, true);
      localView.setUint16(8, 0, true);
      localView.setUint16(10, 0, true);
      localView.setUint16(12, 0, true);
      localView.setUint32(14, crc, true);
      localView.setUint32(18, compressedSize, true);
      localView.setUint32(22, uncompressedSize, true);
      localView.setUint16(26, nameBytes.length, true);
      localView.setUint16(28, 0, true);
      localHeader.set(nameBytes, 30);

      const centralHeader = new Uint8Array(46 + nameBytes.length);
      const centralView = new DataView(centralHeader.buffer);
      centralView.setUint32(0, 0x02014b50, true);
      centralView.setUint16(4, 20, true);
      centralView.setUint16(6, 20, true);
      centralView.setUint16(8, 0, true);
      centralView.setUint16(10, 0, true);
      centralView.setUint16(12, 0, true);
      centralView.setUint16(14, 0, true);
      centralView.setUint32(16, crc, true);
      centralView.setUint32(20, compressedSize, true);
      centralView.setUint32(24, uncompressedSize, true);
      centralView.setUint16(28, nameBytes.length, true);
      centralView.setUint16(30, 0, true);
      centralView.setUint16(32, 0, true);
      centralView.setUint16(34, 0, true);
      centralView.setUint16(36, 0, true);
      centralView.setUint32(38, 0, true);
      centralView.setUint32(42, offset, true);
      centralHeader.set(nameBytes, 46);

      localParts.push(localHeader, fileData);
      centralParts.push(centralHeader);
      offset += localHeader.length + fileData.length;
    }

    const centralSize = centralParts.reduce((s, p) => s + p.length, 0);
    const endRecord = new Uint8Array(22);
    const endView = new DataView(endRecord.buffer);
    endView.setUint32(0, 0x06054b50, true);
    endView.setUint16(4, 0, true);
    endView.setUint16(6, 0, true);
    endView.setUint16(8, allFiles.length, true);
    endView.setUint16(10, allFiles.length, true);
    endView.setUint32(12, centralSize, true);
    endView.setUint32(16, offset, true);
    endView.setUint16(20, 0, true);

    const totalSize = localParts.reduce((s, p) => s + p.length, 0) + centralSize + endRecord.length;
    const result = new Uint8Array(totalSize);
    let pos = 0;
    for (const part of [...localParts, ...centralParts, endRecord]) {
      result.set(part, pos);
      pos += part.length;
    }

    return new Blob([result], { type: 'application/zip' });
  }

  function downloadBlob(blob, filename) {
    Utils.downloadBlob(blob, filename);
  }

  /**
   * 检测浏览器是否支持 WebCodecs API
   */
  function isWebCodecsSupported() {
    return typeof VideoEncoder !== 'undefined' && typeof VideoFrame !== 'undefined';
  }

  /**
   * 使用 WebCodecs API 导出 WebM（比 MediaRecorder 快 2-5x）
   * 支持 VP9 + Alpha 通道
   */
  async function exportWebCodecs(allScenes, onProgress, options = {}) {
    if (!isWebCodecsSupported()) {
      throw new Error('当前浏览器不支持 WebCodecs API，请使用 Chrome 94+ 或 Edge 94+');
    }
    export2DCodeCache.clear();
    lastExport3DCode = null;
    const { width, height } = Preview.getSize();
    const fps = Timeline.getFps();
    const scenes = getScenesToExport(allScenes);
    const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0);
    const totalFrames = Math.max(1, Math.floor(totalDuration * fps));
    const filmGrain = options.filmGrain || false;
    const noise = options.noise || false;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = width;
    exportCanvas.height = height;
    const exportCtx = exportCanvas.getContext('2d', { alpha: true });

    // 选择编码器：优先 VP9 with alpha，退回无 alpha
    const codecCandidates = [
      'vp09.00.10.08',  // VP9 profile 0, level 4.0
      'vp09.02.10.08',  // VP9 profile 2 (10-bit)
      'vp8'
    ];
    let codec = '';
    let useAlpha = true;
    // 先尝试带 alpha 的配置
    for (const c of codecCandidates) {
      try {
        const support = await VideoEncoder.isConfigSupported({
          codec: c,
          width: width,
          height: height,
          framerate: fps,
          bitrate: 8_000_000,
          alpha: 'keep'
        });
        if (support.supported) { codec = c; useAlpha = true; break; }
      } catch (e) { /* try next */ }
    }
    // 如果带 alpha 不行，尝试不带 alpha
    if (!codec) {
      for (const c of codecCandidates) {
        try {
          const support = await VideoEncoder.isConfigSupported({
            codec: c,
            width: width,
            height: height,
            framerate: fps,
            bitrate: 8_000_000
          });
          if (support.supported) { codec = c; useAlpha = false; break; }
        } catch (e) { /* try next */ }
      }
    }
    if (!codec) throw new Error('WebCodecs 不支持当前编码配置');

    // 收集编码后的数据块
    const encodedChunks = [];
    let frameIndex = 0;
    let lastKeyFrame = -Infinity;

    // ── 创建 webm-muxer 实例（替代手写 EBML muxer）──
    const codecID = codec.startsWith('vp8') ? 'V_VP8' : 'V_VP9';
    let muxer = null;
    let muxerTarget = null;

    if (typeof WebMMuxer !== 'undefined') {
      muxerTarget = new WebMMuxer.ArrayBufferTarget();
      muxer = new WebMMuxer.Muxer({
        target: muxerTarget,
        video: {
          codec: codecID,
          width: width,
          height: height,
          frameRate: fps,
          alpha: useAlpha
        },
        fastStart: 'in-memory',
        firstTimestampBehavior: 'offset'
      });
    } else {
      console.warn('[WebCodecs Export] webm-muxer 库未加载，将使用回退方案');
    }

    const encoder = new VideoEncoder({
      output: (chunk, metadata) => {
        if (muxer) {
          muxer.addVideoChunk(chunk, metadata);
        } else {
          encodedChunks.push({ chunk, metadata });
        }
      },
      error: (e) => {
        console.error('WebCodecs 编码错误:', e);
      }
    });

    const encoderConfig = {
      codec: codec,
      width: width,
      height: height,
      framerate: fps,
      bitrate: 8_000_000,
      latencyMode: 'quality'
    };
    if (useAlpha) encoderConfig.alpha = 'keep';
    encoder.configure(encoderConfig);

    // 逐帧渲染 + 编码
    for (let i = 0; i < totalFrames; i++) {
      const t = i / fps;
      try {
        renderFrameToCtx(exportCtx, scenes, t, width, height);
        if (noise) NoiseOverlay.draw(exportCtx, width, height, t);
        if (filmGrain) applyFilmGrain(exportCtx, width, height, i);
      } catch (e) {
        console.warn(`WebCodecs 帧 ${i + 1} 渲染失败:`, e.message);
        exportCtx.clearRect(0, 0, width, height);
      }

      // 如果不支持 alpha，用黑色背景合成
      if (!useAlpha) {
        const composite = document.createElement('canvas');
        composite.width = width;
        composite.height = height;
        const compCtx = composite.getContext('2d');
        compCtx.fillStyle = '#000000';
        compCtx.fillRect(0, 0, width, height);
        compCtx.drawImage(exportCanvas, 0, 0);
        var frameSource = composite;
      } else {
        var frameSource = exportCanvas;
      }

      // 创建 VideoFrame 并编码
      const frameOpts = {
        timestamp: Math.round((i * 1_000_000) / fps),
        duration: Math.round(1_000_000 / fps)
      };
      if (useAlpha) frameOpts.alpha = 'keep';
      const frame = new VideoFrame(frameSource, frameOpts);

      // 每 30 帧或第一帧插入关键帧
      const keyFrame = (i === 0 || i - lastKeyFrame >= 30);
      if (keyFrame) lastKeyFrame = i;

      encoder.encode(frame, { keyFrame });
      frame.close();

      if (onProgress) onProgress((i + 1) / totalFrames, i + 1, totalFrames);

      // 防止编码队列积压过多
      if (encoder.encodeQueueSize > 10) {
        await new Promise(r => setTimeout(r, 5));
      }
      if (i % 10 === 0) await new Promise(r => setTimeout(r, 0));
    }

    await encoder.flush();
    encoder.close();

    // ── 使用 webm-muxer 生成最终 WebM 文件 ──
    if (muxer) {
      muxer.finalize();
      if (!muxerTarget.buffer || muxerTarget.buffer.byteLength === 0) {
        throw new Error('WebCodecs 编码完成但 muxer 没有输出数据');
      }
      return new Blob([muxerTarget.buffer], { type: 'video/webm' });
    }

    // 回退方案：手写 muxer（仅当 webm-muxer 库未加载时）
    if (encodedChunks.length === 0) {
      throw new Error('WebCodecs 编码完成但没有输出数据');
    }

    const webmBlob = muxWebM(encodedChunks, width, height, fps, totalDuration, useAlpha, codec);
    return webmBlob;
  }

  /**
   * WebM 封装器（EBML 格式）
   * 将 EncodedVideoChunk 数组封装为可播放的 WebM 文件
   */
  function muxWebM(chunks, width, height, fps, duration, useAlpha, codecStr) {
    // 根据编码器实际使用的 codec 决定 CodecID
    const codecID = (codecStr && codecStr.startsWith('vp8')) ? 'V_VP8' : 'V_VP9';
    // EBML 元素 ID
    const EBML = {
      EBML: 0x1A45DFA3,
      Segment: 0x18538067,
      SegmentInfo: 0x1549A966,
      Tracks: 0x1654AE6B,
      Cluster: 0x1F43B675,
      Timecode: 0xE7,
      SimpleBlock: 0xA3,
      TrackEntry: 0xAE,
      TrackNumber: 0xD7,
      TrackUID: 0x73C5,
      TrackType: 0x83,
      CodecID: 0x86,
      CodecPrivate: 0x63A2,
      Video: 0xE0,
      PixelWidth: 0xB0,
      PixelHeight: 0xBA,
      AlphaMode: 0x53C0,
      Duration: 0x4489,
      TimecodeScale: 0x2AD7B1,
      MuxingApp: 0x4D80,
      WritingApp: 0x5741,
      DefaultDuration: 0x23E383
    };

    // codecID 已根据编码器实际使用的 codec 确定（见函数参数）

    // 构建 EBML Header
    const header = buildEBML([
      { id: EBML.EBML, data: [
        { id: 0x4286, data: 1 },           // EBMLVersion
        { id: 0x42F7, data: 1 },           // EBMLReadVersion
        { id: 0x42F2, data: 4 },           // EBMLMaxIDLength
        { id: 0x42F3, data: 8 },           // EBMLMaxSizeLength
      ]},
      { id: EBML.Segment, data: buildSegment(chunks, width, height, fps, duration, codecID, useAlpha) }
    ]);

    return new Blob([header], { type: 'video/webm' });
  }

  function buildSegment(chunks, width, height, fps, duration, codecID, useAlpha) {
    // 完整的 EBML 元素 ID 常量
    const ID = {
      SegmentInfo:  0x1549A966,
      Tracks:       0x1654AE6B,
      Cluster:      0x1F43B675,
      Timecode:     0xE7,
      SimpleBlock:  0xA3,
      TimecodeScale: 0x2AD7B1,
      Duration:     0x4489,
      MuxingApp:    0x4D80,
      WritingApp:   0x5741,
      TrackEntry:   0xAE,
      TrackNumber:  0xD7,
      TrackUID:     0x73C5,
      TrackType:    0x83,
      CodecID:      0x86,
      DefaultDuration: 0x23E383,
      Video:        0xE0,
      PixelWidth:   0xB0,
      PixelHeight:  0xBA,
      AlphaMode:    0x53C0,
    };

    const timecodeScale = 1000000; // 1ms = 1000000ns
    const frameDuration = Math.round(1000000000 / fps); // ns per frame

    // SegmentInfo — 必须包裹在 0x1549A966 元素中
    const segInfo = {
      id: ID.SegmentInfo,
      data: [
        { id: ID.TimecodeScale, data: timecodeScale },
        { id: ID.Duration,      data: Math.round(duration * 1000) }, // ms
        { id: ID.MuxingApp,     data: strToBytes('WebMotion') },
        { id: ID.WritingApp,    data: strToBytes('WebMotion WebCodecs') }
      ]
    };

    // Tracks — 必须包裹在 0x1654AE6B 元素中
    const videoElements = [
      { id: ID.PixelWidth,  data: width },
      { id: ID.PixelHeight, data: height }
    ];
    if (useAlpha) {
      videoElements.push({ id: ID.AlphaMode, data: 1 });
    }

    const tracks = {
      id: ID.Tracks,
      data: [
        { id: ID.TrackEntry, data: [
          { id: ID.TrackNumber,  data: 1 },
          { id: ID.TrackUID,     data: 1 },
          { id: ID.TrackType,    data: 1 },           // 1 = Video
          { id: ID.CodecID,      data: strToBytes(codecID) },
          { id: ID.DefaultDuration, data: frameDuration }, // ns
          { id: ID.Video, data: videoElements }
        ]}
      ]
    };

    // Clusters（每 30 帧一组）
    const clusterSize = 30;
    const clusters = [];
    for (let i = 0; i < chunks.length; i += clusterSize) {
      const clusterFrames = chunks.slice(i, i + clusterSize);
      const clusterTimecode = Math.round((i * 1000) / fps); // ms

      const simpleBlocks = clusterFrames.map((cf, j) => {
        const chunk = cf.chunk;
        const relTimecode = Math.round(((i + j) * 1000) / fps) - clusterTimecode;
        const flags = (chunk.type === 'key' ? 0x80 : 0x00);
        // SimpleBlock: TrackNumber(VINT) + Timecode(2B signed) + Flags(1B) + Data
        const blockHeader = new Uint8Array(4);
        blockHeader[0] = 0x81; // TrackNumber = 1 (VINT)
        blockHeader[1] = (relTimecode >> 8) & 0xFF;
        blockHeader[2] = relTimecode & 0xFF;
        blockHeader[3] = flags;

        const blockData = new Uint8Array(chunk.byteLength);
        chunk.copyTo(blockData);

        const fullBlock = concatUint8Arrays([blockHeader, blockData]);
        return { id: ID.SimpleBlock, data: fullBlock, raw: true };
      });

      clusters.push({
        id: ID.Cluster,
        data: [
          { id: ID.Timecode, data: clusterTimecode },
          ...simpleBlocks
        ]
      });
    }

    // 返回 Segment 的子元素数组（全是 {id, data} 对象，不再有裸 Uint8Array）
    return [segInfo, tracks, ...clusters];
  }

  function buildEBML(elements) {
    const parts = [];
    for (const el of elements) {
      // 处理原始 Uint8Array（已预编码的 EBML 元素，直接拼接）
      if (el instanceof Uint8Array) {
        parts.push(el);
        continue;
      }
      // EBML 元素 ID 已经是 VINT 编码形式，直接按字节数转大端序
      const idBytes = encodeNumber(el.id);
      let dataBytes;
      if (el.raw && el.data instanceof Uint8Array) {
        dataBytes = el.data;
      } else if (Array.isArray(el.data)) {
        dataBytes = buildEBML(el.data);
      } else if (typeof el.data === 'number') {
        dataBytes = encodeNumber(el.data);
      } else if (typeof el.data === 'string') {
        dataBytes = strToBytes(el.data);
      } else if (el.data instanceof Uint8Array) {
        dataBytes = el.data;
      } else {
        dataBytes = new Uint8Array(0);
      }
      // 大小是原始整数，需要 VINT 编码
      const sizeBytes = encodeVINT(dataBytes.length);
      parts.push(idBytes, sizeBytes, dataBytes);
    }
    return concatUint8Arrays(parts);
  }

  function encodeVINT(value) {
    if (value < 0x7F) return new Uint8Array([value | 0x80]);
    if (value < 0x3FFF) return new Uint8Array([(value >> 8) | 0x40, value & 0xFF]);
    if (value < 0x1FFFFF) return new Uint8Array([(value >> 16) | 0x20, (value >> 8) & 0xFF, value & 0xFF]);
    if (value < 0x0FFFFFFF) return new Uint8Array([(value >> 24) | 0x10, (value >> 16) & 0xFF, (value >> 8) & 0xFF, value & 0xFF]);
    return new Uint8Array([0x08 | ((value >> 32) & 0x07), (value >> 24) & 0xFF, (value >> 16) & 0xFF, (value >> 8) & 0xFF, value & 0xFF]);
  }

  function encodeNumber(value) {
    if (value <= 0xFF) return new Uint8Array([value]);
    if (value <= 0xFFFF) return new Uint8Array([(value >> 8) & 0xFF, value & 0xFF]);
    if (value <= 0xFFFFFF) return new Uint8Array([(value >> 16) & 0xFF, (value >> 8) & 0xFF, value & 0xFF]);
    return new Uint8Array([(value >> 24) & 0xFF, (value >> 16) & 0xFF, (value >> 8) & 0xFF, value & 0xFF]);
  }

  /**
   * 估算导出时间（秒）
   * @param {string} format - 'png' | 'webm' | 'gif'
   * @param {number} totalFrames - 总帧数
   * @param {boolean} useWebCodecs - 是否使用 WebCodecs
   * @returns {number} 预估秒数
   */
  function estimateExportTime(format, totalFrames, useWebCodecs) {
    if (format === 'png') {
      // PNG: 约 50 帧/秒（渲染 + toBlob + ZIP）
      return Math.ceil(totalFrames / 50);
    } else if (format === 'webm') {
      if (useWebCodecs) {
        // WebCodecs: 离屏编码，无实时等待，约 60 帧/秒
        return Math.ceil(totalFrames / 60);
      } else {
        // MediaRecorder: 实时录制，1 帧 = 1/fps 秒（30fps → 30帧/秒）
        return Math.ceil(totalFrames / 30);
      }
    } else if (format === 'gif') {
      // GIF: 渲染 + 颜色量化 + LZW 压缩，约 15 帧/秒
      return Math.ceil(totalFrames / 15);
    }
    return 0;
  }

  return {
    exportPNGSequence,
    exportWebM,
    exportGIF,
    exportWebCodecs,
    isWebCodecsSupported,
    estimateExportTime,
    downloadBlob
  };
})();
