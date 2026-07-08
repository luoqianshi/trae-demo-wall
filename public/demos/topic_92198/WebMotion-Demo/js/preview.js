/**
 * WebMotion - 预览渲染引擎（多场景版）
 * 统一渲染路径：代码优先 → 可视化元素 → 3D
 * LOOP refactor: delegates code compilation to RenderEngine
 */
const Preview = (function() {
  let canvas, ctx, overlayCanvas;
  let width = 1920, height = 1080;
  let renderFn = null;
  let renderError = null;
  let last3DCode = null; // 跟踪上次编译的 3D 代码
  let last2DCode = null; // 跟踪上次编译的 2D 代码（性能优化）
  let lastSceneIndex = -1; // 跟踪上次渲染的场景索引，避免每帧重复设置元素
  let domCache = {}; // 缓存 DOM 引用，避免每帧 getElementById

  function init() {
    canvas = document.getElementById('preview-canvas');
    ctx = canvas.getContext('2d');
    overlayCanvas = document.getElementById('overlay-canvas');
    domCache.infoScene = document.getElementById('info-scene');
    setResolution(1920, 1080);
    // 始终启用 overlay 交互
    if (overlayCanvas) {
      overlayCanvas.style.pointerEvents = 'auto';
    }
    // LOOP: 初始化 RenderEngine（共享渲染管线）
    if (typeof RenderEngine !== 'undefined') {
      RenderEngine.init();
      RenderEngine.setResolution(width, height);
    }
    // LOOP: 初始化 RuleEngine（如果可用）
    if (typeof RuleEngine !== 'undefined') {
      RuleEngine.enable();
    }
    // 广播初始化事件
    if (typeof EventBus !== 'undefined') {
      EventBus.emit('preview:initialized', { width, height });
    }
  }

  function setResolution(w, h) {
    width = w; height = h;
    canvas.width = w; canvas.height = h;
    if (overlayCanvas) {
      overlayCanvas.width = w;
      overlayCanvas.height = h;
    }
    if (typeof RenderEngine !== 'undefined') RenderEngine.setResolution(w, h);
    fitCanvasToStage();
    VisualEditor.setResolution(w, h);
    if (ThreeRenderer.isAvailable()) {
      ThreeRenderer.setResolution(w, h);
    }
    // 分辨率变化时重置缓存
    last2DCode = null;
    last3DCode = null;
  }

  function fitCanvasToStage() {
    const stage = document.getElementById('preview-stage');
    const wrapper = document.getElementById('canvas-wrapper');
    const stageW = stage.clientWidth - 64;
    const stageH = stage.clientHeight - 64;
    const scale = Math.min(stageW / width, stageH / height, 1);
    const dispW = width * scale + 'px';
    const dispH = height * scale + 'px';
    canvas.style.width = dispW;
    canvas.style.height = dispH;
    if (overlayCanvas) {
      overlayCanvas.style.width = dispW;
      overlayCanvas.style.height = dispH;
    }
    wrapper.style.width = dispW;
    wrapper.style.height = dispH;
  }

  function compileUserCode(code) {
    renderError = null;
    if (!code || !code.trim()) { renderFn = null; last2DCode = null; return; }
    // Delegate to RenderEngine (shared with export pipeline)
    if (typeof RenderEngine !== 'undefined') {
      RenderEngine.compileCode(code);
    }
    try {
      const sanitized = Utils.sanitizeCode(code, '2d');
      renderFn = new Function('ctx', 't', 'width', 'height', 'utils', sanitized);
      last2DCode = code;
    } catch (e) {
      renderError = e.message;
      renderFn = null;
    }
  }

  /**
   * 渲染指定时间的一帧 — 统一渲染路径
   * 优先级：3D > 代码（含 ElementRegistry） > 可视化元素
   * 支持场景转场效果（借鉴 Remotion transitions）
   */
  function renderFrame(globalTime) {
    const { scene, sceneIndex, localTime } = SceneManager.getSceneAtTime(globalTime);

    // 始终同步 VisualEditor 的内部时间为当前场景的局部时间
    // （onTick 回调传入的是全局时间，不能直接用于关键帧/动画计算）
    VisualEditor.setCurrentTime(localTime);

    // 场景切换时：保存旧场景的覆盖值，恢复新场景的覆盖值
    if (sceneIndex !== lastSceneIndex) {
      // 保存旧场景的元素覆盖值
      if (lastSceneIndex >= 0) {
        const oldScenes = SceneManager.getScenes();
        if (oldScenes[lastSceneIndex]) {
          oldScenes[lastSceneIndex]._savedOverrides = ElementRegistry.getOverrides();
        }
      }
      lastSceneIndex = sceneIndex;
      // 恢复新场景的覆盖值（将在下方的代码编译后应用）
      // LOOP: 广播场景切换事件
      if (typeof EventBus !== 'undefined') {
        EventBus.emit('scene:changed', { sceneIndex, sceneName: scene.name, scene });
      }
    }

    // 先清空画布（在转场变换之前，避免变换坐标系中 clearRect 留残影）
    ctx.clearRect(0, 0, width, height);

    // 计算场景转场效果（统一入口）
    const transEffect = Utils.calcTransition(scene, localTime);
    const hasTrans = Utils.applyTransition(ctx, transEffect, width, height);

    // 1. 3D 模式（含容错降级）
    if (scene.is3D) {
      if (!ThreeRenderer.isAvailable()) {
        // Three.js 未加载 — 降级到 2D 并提示
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('3D 模式不可用：Three.js 未加载，已降级到 2D 模式', width / 2, height / 2);
        renderError = 'Three.js 未加载';
        if (hasTrans) ctx.restore();
        NoiseOverlay.draw(ctx, width, height, globalTime);
        updateInfo(sceneIndex);
        postRender(sceneIndex, globalTime);
        return;
      }
      // 确保 ThreeRenderer 已初始化
      if (!ThreeRenderer.isInitialized()) {
        if (!ThreeRenderer.init(width, height)) {
          // 初始化失败（如 WebGL 不支持）— 降级到 2D
          ctx.clearRect(0, 0, width, height);
          const initErr = ThreeRenderer.getInitError ? ThreeRenderer.getInitError() : '初始化失败';
          ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
          ctx.font = '14px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('3D 模式不可用：' + initErr, width / 2, height / 2);
          renderError = initErr;
          if (hasTrans) ctx.restore();
          NoiseOverlay.draw(ctx, width, height, globalTime);
          updateInfo(sceneIndex);
          postRender(sceneIndex, globalTime);
          return;
        }
      }
      if (scene.code !== last3DCode) {
        ThreeRenderer.compileCode(scene.code);
        last3DCode = scene.code;
        // 清除上一场景的 2D 注册元素，防止残留
        ElementRegistry.clear();
      }
      ctx.clearRect(0, 0, width, height);
      const threeCanvas = ThreeRenderer.render(localTime);
      if (threeCanvas) {
        ctx.drawImage(threeCanvas, 0, 0, width, height);
      }
      const threeErr = ThreeRenderer.getError ? ThreeRenderer.getError() : null;
      if (threeErr) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
        ctx.font = '14px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('3D Error: ' + threeErr, 20, 20);
        renderError = threeErr;
      } else {
        renderError = null;
      }

      // 渲染 2D 叠加元素（文字、装饰条等，叠加在 3D 之上）
      const sceneElements3D = scene.elements || [];
      if (sceneElements3D.length > 0) {
        VisualEditor.setElements(sceneElements3D);
        VisualEditor.setCurrentTime(localTime);
        VisualEditor.drawElementsOnly(ctx, localTime, scene.duration);
      }

      if (hasTrans) ctx.restore();

      // 噪点叠加层（胶片颗粒效果）
      NoiseOverlay.draw(ctx, width, height, globalTime);

      updateInfo(sceneIndex);
      postRender(sceneIndex, globalTime);
      return;
    }

    // 2. 代码模式（含 ElementRegistry）
    if (scene.code && scene.code.trim()) {
      // 仅在代码变化时重新编译
      if (scene.code !== last2DCode) {
        compileUserCode(scene.code);
        // 编译成功才清空注册表，防止编译失败时误清
        if (renderFn) {
          ElementRegistry.clear();
          // 恢复该场景之前保存的覆盖值（在第一帧 registerElement 时自动应用）
          if (scene._savedOverrides) {
            ElementRegistry.setPendingOverrides(scene._savedOverrides);
          }
        }
      }

      if (!renderFn) {
        ctx.clearRect(0, 0, width, height);
        if (renderError) {
          ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
          ctx.font = '14px monospace';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          ctx.fillText('Error: ' + renderError, 20, 20);
        } else {
          ctx.fillStyle = 'rgba(255,255,255,0.3)';
          ctx.font = '18px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('在左侧编写动画代码，或从模板库选择', width / 2, height / 2);
        }
      } else {
        try {
          ctx.clearRect(0, 0, width, height);

          // 每帧开始：初始化元素注册表
          ElementRegistry.beginFrame(localTime, scene.duration);

          // 创建带 registerElement 的 runtime utils
          const runtimeUtils = createRuntimeUtils();

          // 执行用户代码
          renderFn(ctx, localTime, width, height, runtimeUtils);

          // 每帧结束：清理未注册元素
          ElementRegistry.endFrame();
          // 清除待应用的覆盖值（已在 registerElement 中消费）
          ElementRegistry.clearPendingOverrides();

          renderError = null;
        } catch (e) {
          ctx.clearRect(0, 0, width, height);
          ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
          ctx.font = '14px monospace';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          ctx.fillText('Error: ' + e.message, 20, 20);
          renderError = e.message;
        }
      }

      // 渲染可视化元素（叠加在代码之上，不清空画布）
      const sceneElements = scene.elements || [];
      if (sceneElements.length > 0) {
        VisualEditor.setElements(sceneElements);
        VisualEditor.setCurrentTime(localTime);
        VisualEditor.drawElementsOnly(ctx, localTime, scene.duration);
      }

      // 合并注册元素和可视化元素，绘制选择框
      const registered = ElementRegistry.hasElements() ? ElementRegistry.getElements() : [];
      VisualEditor.setElements([...registered, ...sceneElements]);
      // 始终更新局部时间，确保命中检测和选中框使用正确的动画偏移
      VisualEditor.setCurrentTime(localTime);

      if (hasTrans) ctx.restore();

      // 噪点叠加层（胶片颗粒效果）
      NoiseOverlay.draw(ctx, width, height, globalTime);

      updateInfo(sceneIndex);
      postRender(sceneIndex, globalTime);
      return;
    }

    // 3. 可视化元素模式（无代码时）
    VisualEditor.setElements(scene.elements || []);
    VisualEditor.setCurrentTime(localTime);
    VisualEditor.render(ctx, localTime, scene.duration);
    renderError = null;
    if (hasTrans) ctx.restore();

    // 噪点叠加层（胶片颗粒效果）
    NoiseOverlay.draw(ctx, width, height, globalTime);

    updateInfo(sceneIndex);
    postRender(sceneIndex, globalTime);
  }

  function updateInfo(sceneIndex) {
    if (domCache.infoScene) {
      domCache.infoScene.textContent = `场景 ${sceneIndex + 1}`;
    }
  }

  /** LOOP: 每帧后处理 — EventBus 广播 + RuleEngine 校验 */
  function postRender(sceneIndex, globalTime) {
    // 广播渲染帧事件
    if (typeof EventBus !== 'undefined') {
      EventBus.emit('render:frame', { sceneIndex, globalTime, width, height });
    }
    // RuleEngine 实时校验（仅在启用时）
    if (typeof RuleEngine !== 'undefined' && RuleEngine.isEnabled()) {
      RuleEngine.validate(ctx, width, height);
    }
  }

  /** 强制清除编译缓存（切换场景/加载项目时调用） */
  function invalidateCache() {
    last2DCode = null;
    last3DCode = null;
    lastSceneIndex = -1;
    ElementRegistry.clearPendingOverrides();
    ElementRegistry.clear();
  }

  /** 创建运行时 utils，扩展 registerElement + VisualFX + 高级工具 API + Typography/SafeZone */
  function createRuntimeUtils() {
    const u = Object.create(Utils);
    u.registerElement = (type, props) => ElementRegistry.registerElement(type, props);
    // 注入 VisualFX 特效库（渐变文字、玻璃态、粒子系统、动态文字、光线等）
    if (typeof VisualFX !== 'undefined') u.fx = VisualFX;
    // 注入视觉套件库（AI 根据文案内容自动选择合适的套件组合）
    if (typeof gsap !== 'undefined') u.gsap = gsap;               // 动画引擎：复杂时间轴、交错特效
    if (typeof p5 !== 'undefined') u.p5 = p5;                     // 创意编程：生成艺术、噪声、有机形状
    if (typeof d3 !== 'undefined') u.d3 = d3;                     // 数据可视化：图表、比例尺、路径生成
    if (typeof anime !== 'undefined') u.anime = anime;             // 轻量动画：交错特效、弹簧物理
    if (typeof flubber !== 'undefined') u.flubber = flubber;       // SVG 形状变形：路径插值、平滑形变
    if (typeof lottie !== 'undefined') u.lottie = lottie;         // AE 动画播放：JSON 格式动效
    if (typeof THREE !== 'undefined') u.THREE = THREE;             // 3D 引擎（2D 模式也可用 Vector3 等）
    // LOOP refactor: 注入 Typography 排版系统和 SafeZone 安全区
    if (typeof Typography !== 'undefined') {
      u.typography = Typography;
      u.safeZone = (w, h) => Typography.safeZone(w, h);
      u.fontSize = (size, w) => Typography.fontSize(size, w);
      u.fontString = (weight, size, w) => Typography.fontString(weight, size, w);
    }
    // 注入 TOKENS 设计令牌（单源真值）
    if (typeof TOKENS !== 'undefined') u.TOKENS = TOKENS;
    return u;
  }

  function getError() { return renderError; }
  function getSize() { return { width, height }; }
  function getCtx() { return ctx; }

  /** 捕获当前预览的缩略图（用于历史记录） */
  function captureThumbnail(maxW = 160) {
    try {
      const scale = Math.min(1, maxW / width);
      const thumbW = Math.round(width * scale);
      const thumbH = Math.round(height * scale);
      const thumbCanvas = document.createElement('canvas');
      thumbCanvas.width = thumbW;
      thumbCanvas.height = thumbH;
      const thumbCtx = thumbCanvas.getContext('2d');
      thumbCtx.drawImage(canvas, 0, 0, thumbW, thumbH);
      return thumbCanvas.toDataURL('image/jpeg', 0.6);
    } catch (e) {
      return null;
    }
  }

  return {
    init, setResolution, fitCanvasToStage,
    compileUserCode, renderFrame, getError, getSize, getCtx,
    invalidateCache, captureThumbnail,
    utils: Utils
  };
})();
