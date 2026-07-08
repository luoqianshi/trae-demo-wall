/**
 * RenderEngine.js — 统一渲染管线
 * 合并 preview.js 和 exporter.js 的渲染逻辑
 * 三层架构: 背景层 → 内容层 → 叠加层
 */

const RenderEngine = (function() {
  'use strict';

  let width = 1920, height = 1080;
  let mainCtx = null;
  let bgCtx = null;       // 背景层 (静态)
  let overlayCtx = null;  // 叠加层 (HUD, 进度条)
  let bgDirty = true;

  // 缓存
  const codeCache = new Map();
  let last3DCode = null;

  function init() {
    const mainCanvas = document.getElementById('preview-canvas');
    if (!mainCanvas) return;
    mainCtx = mainCanvas.getContext('2d');
    setResolution(width, height);
  }

  function setResolution(w, h) {
    width = w; height = h;
    bgDirty = true;
    if (mainCtx && mainCtx.canvas) {
      mainCtx.canvas.width = w;
      mainCtx.canvas.height = h;
    }
    // 通知其他模块
    if (typeof EventBus !== 'undefined') {
      EventBus.emit('render:resolution', { width: w, height: h });
    }
  }

  function getResolution() {
    return { width, height };
  }

  /**
   * 渲染错误覆盖层
   */
  function renderError(ctx, message, x, y) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = Typography.fontString('400', 'body', width);
    ctx.textAlign = 'center';
    ctx.fillText(message, width / 2, height / 2);
    ctx.restore();
  }

  /**
   * 编译用户代码 (带缓存)
   */
  function compileCode(code) {
    if (!code || !code.trim()) return null;
    if (codeCache.has(code)) return codeCache.get(code);

    try {
      const sanitized = (typeof Utils !== 'undefined' && Utils.sanitizeCode)
        ? Utils.sanitizeCode(code, '2d')
        : code;
      const fn = new Function('ctx', 't', 'width', 'height', 'utils', sanitized);
      codeCache.set(code, fn);
      return fn;
    } catch (e) {
      console.error('[RenderEngine] Compile error:', e);
      return null;
    }
  }

  function invalidateCache() {
    codeCache.clear();
    last3DCode = null;
    bgDirty = true;
  }

  /**
   * 核心渲染函数
   * @param {number} globalTime - 全局时间（秒）
   * @param {object} options
   * @param {boolean} options.skipHUD - 导出时跳过 HUD
   * @param {boolean} options.skipValidation - 跳过规则验证
   */
  function renderFrame(globalTime, options) {
    const opts = options || {};
    const ctx = mainCtx;
    if (!ctx) return;

    // 1. 确定当前场景 + 局部时间
    let scene, localTime;
    if (typeof SceneManager !== 'undefined') {
      const result = SceneManager.getSceneAtTime(globalTime);
      scene = result.scene;
      localTime = result.localTime;
    } else {
      return;
    }

    if (!scene) return;

    // 2. 清空画布
    ctx.clearRect(0, 0, width, height);

    // 3. 转场效果
    if (typeof Utils !== 'undefined') {
      const transEffect = Utils.calcTransition(scene, localTime);
      if (Utils.applyTransition) {
        Utils.applyTransition(ctx, transEffect, width, height);
      }
    }

    try {
      // 4. 3D 模式
      if (scene.is3D && typeof ThreeRenderer !== 'undefined' && ThreeRenderer.isAvailable()) {
        ThreeRenderer.setResolution(width, height);
        if (scene.code !== last3DCode) {
          ThreeRenderer.compileCode(scene.code);
          last3DCode = scene.code;
        }
        const threeCanvas = ThreeRenderer.render(localTime);
        if (threeCanvas) {
          ctx.drawImage(threeCanvas, 0, 0, width, height);
        }
        // 叠加 scene.elements（文字、装饰等）在 3D 渲染之上
        const sceneElements3D = scene.elements || [];
        if (sceneElements3D.length > 0 && typeof VisualEditor !== 'undefined') {
          VisualEditor.setResolution(width, height);
          VisualEditor.setElements(sceneElements3D);
          VisualEditor.setCurrentTime(localTime);
          VisualEditor.drawElementsOnly(ctx, localTime, scene.duration);
        }
      }
      // 5. 2D 代码模式
      else if (scene.code && scene.code.trim()) {
        const renderFn = compileCode(scene.code);
        if (renderFn) {
          if (typeof ElementRegistry !== 'undefined') {
            ElementRegistry.beginFrame(localTime, scene.duration);
          }
          if (typeof VisualEditor !== 'undefined') {
            VisualEditor.setResolution(width, height);
          }
          const runtimeUtils = createRuntimeUtils();
          renderFn(ctx, localTime, width, height, runtimeUtils);
          if (typeof ElementRegistry !== 'undefined') {
            ElementRegistry.endFrame();
          }
        } else {
          renderError(ctx, '代码编译错误', width / 2, height / 2);
        }
        // 叠加 scene.elements（文字、装饰等）在代码渲染之上
        const sceneElements = scene.elements || [];
        if (sceneElements.length > 0 && typeof VisualEditor !== 'undefined') {
          VisualEditor.setElements(sceneElements);
          VisualEditor.setCurrentTime(localTime);
          VisualEditor.drawElementsOnly(ctx, localTime, scene.duration);
        }
      }
      // 6. 纯可视化元素模式
      else if (typeof VisualEditor !== 'undefined') {
        VisualEditor.setResolution(width, height);
        VisualEditor.setElements(scene.elements || []);
        VisualEditor.setCurrentTime(localTime);
        VisualEditor.render(ctx, localTime, scene.duration);
      }
    } catch (e) {
      console.error('[RenderEngine] Render error:', e);
      renderError(ctx, '渲染错误: ' + e.message, width / 2, height / 2);
    }

    // 7. 叠加层 (HUD + 进度条) — 导出时跳过
    if (!opts.skipHUD) {
      drawHUD(ctx, scene, localTime);
    }

    // 8. 胶片噪点 — 如果启用
    if (typeof NoiseOverlay !== 'undefined' && !opts.skipNoise) {
      NoiseOverlay.draw(ctx, width, height, globalTime);
    }

    // 9. 规则验证 — 开发模式
    if (!opts.skipValidation && typeof RuleEngine !== 'undefined') {
      RuleEngine.validate(ctx, width, height);
    }

    // 10. 通知
    if (typeof EventBus !== 'undefined') {
      EventBus.emit('render:frame', { scene, localTime, globalTime });
    }
  }

  /**
   * 创建运行时工具集 (注入给用户代码)
   */
  function createRuntimeUtils() {
    const u = Object.create(typeof Utils !== 'undefined' ? Utils : {});

    // 视觉套件注入
    if (typeof gsap !== 'undefined') u.gsap = gsap;
    if (typeof p5 !== 'undefined') u.p5 = p5;
    if (typeof d3 !== 'undefined') u.d3 = d3;
    if (typeof anime !== 'undefined') u.anime = anime;
    if (typeof flubber !== 'undefined') u.flubber = flubber;
    if (typeof lottie !== 'undefined') u.lottie = lottie;
    if (typeof THREE !== 'undefined') u.THREE = THREE;

    // 元素注册
    if (typeof ElementRegistry !== 'undefined') {
      u.registerElement = (type, props) => ElementRegistry.registerElement(type, props);
    }

    // 视觉特效
    if (typeof VisualFX !== 'undefined') u.fx = VisualFX;

    // 排版系统
    u.Typography = Typography;
    u.TOKENS = window.TOKENS;

    return u;
  }

  /**
   * 绘制 HUD (信息面板 + 进度条)
   */
  function drawHUD(ctx, scene, localTime) {
    if (!scene) return;

    const progress = scene.duration ? Math.min(localTime / scene.duration, 1) : 0;
    const pw = 480, ph = 160;
    const margin = Math.round(width * 0.025);
    const px = margin, py = margin;

    ctx.save();

    // 玻璃态面板背景
    ctx.fillStyle = 'rgba(17,21,34,0.55)';
    ctx.strokeStyle = 'rgba(240,236,228,0.06)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(px, py, pw, ph, 14); ctx.fill(); ctx.stroke();

    // 内边缘高光
    ctx.strokeStyle = 'rgba(240,236,228,0.04)';
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.roundRect(px + 1.5, py + 1.5, pw - 3, ph - 3, 13); ctx.stroke();

    // 顶部强调线
    ctx.strokeStyle = '#c9a96e66';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(px + 24, py); ctx.lineTo(px + pw - 24, py); ctx.stroke();

    // 场景编号
    const sceneIdx = SceneManager.getScenes().indexOf(scene);
    ctx.fillStyle = '#c9a96e';
    ctx.font = Typography.fontString('700', 'small', width);
    ctx.textAlign = 'left';
    ctx.fillText('SCENE ' + String(sceneIdx + 1).padStart(2, '0'), px + 32, py + 42);

    // 场景名称
    ctx.fillStyle = '#f0ece4';
    ctx.font = Typography.fontString('800', 'h2', width);
    ctx.fillText(scene.name || '未命名场景', px + 32, py + 82);

    // 持续时间
    ctx.fillStyle = 'rgba(240,236,228,0.6)';
    ctx.font = Typography.fontString('400', 'caption', width);
    ctx.fillText((scene.duration || 0).toFixed(1) + 's', px + 32, py + 110);

    // 进度条
    const barH = 3;
    const barY = height - barH;
    ctx.fillStyle = 'rgba(240,236,228,0.03)';
    ctx.fillRect(0, barY, width, barH);

    if (progress > 0) {
      const barGrad = ctx.createLinearGradient(0, 0, width, 0);
      barGrad.addColorStop(0, '#c9a96e');
      barGrad.addColorStop(0.5, '#5eead4');
      barGrad.addColorStop(1, '#c9a96e');
      ctx.fillStyle = barGrad;
      ctx.fillRect(0, barY, width * progress, barH);

      // 发光
      ctx.fillStyle = 'rgba(201,169,110,0.3)';
      ctx.fillRect(0, barY - 1, width * progress, 1);
    }

    ctx.restore();
  }

  /**
   * 渲染到指定 context (导出用)
   */
  function renderFrameToCtx(targetCtx, globalTime, options) {
    const origCtx = mainCtx;
    mainCtx = targetCtx;
    renderFrame(globalTime, Object.assign({ skipHUD: true }, options || {}));
    mainCtx = origCtx;
  }

  return {
    init, setResolution, getResolution,
    renderFrame, renderFrameToCtx,
    compileCode, invalidateCache,
    get mainCtx() { return mainCtx; }
  };
})();