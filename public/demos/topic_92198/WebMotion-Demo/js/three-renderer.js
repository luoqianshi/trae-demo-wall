/**
 * WebMotion - 3D 渲染模块
 * 基于 Three.js，支持在动画中使用 3D 效果
 *
 * 3D 代码格式：
 * 用户代码接收 (THREE, scene, camera, width, height, utils) 参数
 * 设置场景后返回一个 animate(t) 函数用于每帧动画
 *
 * 示例：
 * const cube = new THREE.Mesh(
 *   new THREE.BoxGeometry(1, 1, 1),
 *   new THREE.MeshPhongMaterial({ color: 0xc9a96e })
 * );
 * scene.add(cube);
 * camera.position.z = 3;
 * return function(t) {
 *   cube.rotation.x = t * 0.5;
 *   cube.rotation.y = t * 1.0;
 * };
 *
 * 高级能力（r128 + addons，自动兼容检测，不可用时优雅降级为直接渲染）：
 * - 后处理管线：EffectComposer + RenderPass + UnrealBloomPass（泛光）
 * - 环境光照：PMREMGenerator + RoomEnvironment（IBL），降级 AmbientLight + DirectionalLight
 * - 着色器辅助：utils.createShader / createParticles / createGradientTexture / addBloom
 * - 后处理控制：setBloom / setPostProcessing / getAvailableEffects
 */
const ThreeRenderer = (function() {

  let renderer = null;
  let scene = null;
  let camera = null;
  let canvas = null;
  let animateFn = null;
  let initCode = null;
  let isReady = false;
  let lastError = null; // 错误追踪

  // ===== 后处理管线 =====
  let composer = null;
  let renderPass = null;
  let bloomPass = null;
  let bloomEnabled = false;
  let bloomOptions = { strength: 0.6, radius: 0.4, threshold: 0.1 };

  // ===== 默认环境光照 =====
  let defaultLights = [];     // 降级时添加到场景的 Light 对象（用于追踪/清理）
  let envRenderTarget = null; // PMREM 生成的环境贴图 RT（用于清理）

  /**
   * 初始化 Three.js 渲染器
   */
  function init(width, height) {
    if (typeof THREE === 'undefined') {
      lastError = 'Three.js 未加载';
      console.error(lastError);
      return false;
    }

    // 检查 WebGL 支持
    if (typeof WebGLRenderingContext === 'undefined') {
      lastError = 'WebGL 不受支持，无法使用 3D 模式';
      console.error(lastError);
      return false;
    }
    const testCanvas = document.createElement('canvas');
    const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
    if (!gl) {
      lastError = 'WebGL 不受支持，无法使用 3D 模式';
      console.error(lastError);
      return false;
    }
    // 释放测试用的 WebGL 上下文，防止上下文数量超限
    try {
      const loseExt = gl.getExtension('WEBGL_lose_context');
      if (loseExt) loseExt.loseContext();
    } catch (e) { /* 忽略 */ }

    canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        antialias: true,
        preserveDrawingBuffer: true // 导出需要
      });
    } catch (e) {
      lastError = 'WebGL 不受支持，无法使用 3D 模式';
      console.error(lastError, e);
      return false;
    }
    renderer.setSize(width, height);
    renderer.setPixelRatio(1);
    renderer.setClearColor(0x000000, 0); // 透明背景

    // 监听 WebGL 上下文丢失，防止 GPU 重置后渲染空白帧
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      isReady = false;
      console.warn('WebGL 上下文丢失，3D 渲染暂停');
    }, false);
    canvas.addEventListener('webglcontextrestored', () => {
      console.log('WebGL 上下文已恢复，重新编译场景');
      isReady = true;
      // 旧的渲染目标随上下文丢失已失效，丢弃后重建后处理链
      composer = null;
      renderPass = null;
      bloomPass = null;
      setupPostProcessing();
      if (initCode) {
        compileCode(initCode); // 重新编译场景代码
      }
    }, false);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.z = 5;

    // 初始化后处理管线（addons 不可用时自动降级）
    setupPostProcessing();

    isReady = true;
    return true;
  }

  /**
   * 初始化后处理管线
   * 需要 THREE.EffectComposer / RenderPass / UnrealBloomPass（r128 addons）
   * 任一不可用则降级为直接渲染
   * @returns {boolean} 是否成功启用后处理
   */
  function setupPostProcessing() {
    if (!renderer || !scene || !camera) return false;
    if (typeof THREE.EffectComposer === 'undefined') {
      // EffectComposer 不可用，降级为直接渲染
      return false;
    }
    try {
      composer = new THREE.EffectComposer(renderer);

      if (typeof THREE.RenderPass !== 'undefined') {
        renderPass = new THREE.RenderPass(scene, camera);
        composer.addPass(renderPass);
      }

      if (typeof THREE.UnrealBloomPass !== 'undefined') {
        bloomPass = new THREE.UnrealBloomPass(
          new THREE.Vector2(canvas.width, canvas.height),
          bloomOptions.strength,
          bloomOptions.radius,
          bloomOptions.threshold
        );
        bloomPass.enabled = bloomEnabled; // 默认不启用，由 bloomEnabled 控制（上下文恢复后保持状态）
        composer.addPass(bloomPass);
      }

      composer.setSize(canvas.width, canvas.height);
      return true;
    } catch (e) {
      console.warn('后处理管线初始化失败，降级为直接渲染:', e);
      composer = null;
      renderPass = null;
      bloomPass = null;
      return false;
    }
  }

  /**
   * 设置泛光（Bloom）效果
   * @param {boolean} enabled - 是否启用
   * @param {object} [options] - { strength, radius, threshold }
   * @returns {boolean} 当前是否启用
   */
  function setBloom(enabled, options) {
    bloomEnabled = !!enabled;

    if (options) {
      if (options.strength !== undefined) bloomOptions.strength = options.strength;
      if (options.radius !== undefined) bloomOptions.radius = options.radius;
      if (options.threshold !== undefined) bloomOptions.threshold = options.threshold;
      if (bloomPass) {
        if (options.strength !== undefined) bloomPass.strength = options.strength;
        if (options.radius !== undefined) bloomPass.radius = options.radius;
        if (options.threshold !== undefined) bloomPass.threshold = options.threshold;
      }
    }
    if (bloomPass) bloomPass.enabled = bloomEnabled;

    // 启用时若后处理尚未就绪，尝试懒加载（addons 可能延迟可用）
    if (bloomEnabled && !composer) {
      setupPostProcessing();
      if (!composer) {
        console.warn('后处理不可用（EffectComposer 未加载），bloom 无法生效');
      }
    }
    return bloomEnabled;
  }

  /**
   * 统一控制后处理效果
   * @param {object} options - { bloom, bokeh, glitch }
   *   bloom: boolean | { enabled?, strength?, radius?, threshold? }
   *   bokeh/glitch: boolean | object（需要对应 Pass 可用，不可用时仅告警）
   */
  function setPostProcessing(options) {
    if (!options) return;

    if (options.bloom !== undefined) {
      if (typeof options.bloom === 'boolean') {
        setBloom(options.bloom);
      } else if (typeof options.bloom === 'object' && options.bloom !== null) {
        setBloom(options.bloom.enabled !== false, options.bloom);
      }
    }

    if (options.bokeh !== undefined && options.bokeh) {
      if (typeof THREE === 'undefined' || typeof THREE.BokehPass === 'undefined') {
        console.warn('Bokeh 效果不可用（THREE.BokehPass 未加载）');
      }
      // 若 BokehPass 可用，可在此处接入对应 Pass
    }

    if (options.glitch !== undefined && options.glitch) {
      if (typeof THREE === 'undefined' || typeof THREE.GlitchPass === 'undefined') {
        console.warn('Glitch 效果不可用（THREE.GlitchPass 未加载）');
      }
      // 若 GlitchPass 可用，可在此处接入对应 Pass
    }
  }

  /**
   * 返回当前可用的后处理效果列表
   * @returns {string[]}
   */
  function getAvailableEffects() {
    const effects = [];
    if (typeof THREE !== 'undefined' &&
        typeof THREE.EffectComposer !== 'undefined' &&
        typeof THREE.RenderPass !== 'undefined' &&
        typeof THREE.UnrealBloomPass !== 'undefined') {
      effects.push('bloom');
    }
    if (typeof THREE !== 'undefined' && typeof THREE.BokehPass !== 'undefined') {
      effects.push('bokeh');
    }
    if (typeof THREE !== 'undefined' && typeof THREE.GlitchPass !== 'undefined') {
      effects.push('glitch');
    }
    return effects;
  }

  /**
   * 获取初始化失败的错误信息
   * @returns {string|null} 错误信息，初始化成功时为 null
   */
  function getInitError() {
    return lastError;
  }

  /**
   * 设置分辨率
   */
  function setResolution(width, height) {
    if (!isReady) {
      return init(width, height);
    }
    canvas.width = width;
    canvas.height = height;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    // 同步后处理尺寸
    if (composer) composer.setSize(width, height);
    if (bloomPass) bloomPass.setSize(width, height);
  }

  /**
   * 编译 3D 代码
   * 用户代码设置场景并返回 animate 函数
   */
  function compileCode(code) {
    if (!isReady || !code || !code.trim()) return false;
    lastError = null;
    clearScene();
    camera.position.set(0, 0, 5);
    camera.rotation.set(0, 0, 0);

    // 注入默认环境光照（用户代码可自由添加自己的光源，默认光照不影响）
    setupDefaultLights();

    try {
      const sanitized = Utils.sanitizeCode(code, '3d');
      // 构造继承自 Utils 的 3D 辅助工具集，并注入着色器/粒子等辅助方法
      const utils3d = Object.create(Utils);
      inject3DUtils(utils3d);

      const userFn = new Function('THREE', 'scene', 'camera', 'width', 'height', 'utils', sanitized);
      const result = userFn(THREE, scene, camera, canvas.width, canvas.height, utils3d);
      animateFn = typeof result === 'function' ? result : null;
      initCode = code;
      return true;
    } catch (e) {
      lastError = e.message;
      console.error('3D 代码编译错误:', e);
      animateFn = null;
      return false;
    }
  }

  /**
   * 注入 3D 辅助工具到 utils 对象（基于继承自 Utils 的对象）
   * @param {object} utils3d - 继承自 Utils 的对象
   */
  function inject3DUtils(utils3d) {
    /**
     * 创建 ShaderMaterial
     * @param {object} opts - ShaderMaterial 构造参数
     * @returns {THREE.ShaderMaterial}
     */
    utils3d.createShader = (opts) => new THREE.ShaderMaterial(opts);

    /**
     * 创建粒子系统
     * @param {number} count - 粒子数量
     * @param {Float32Array|number[]} positions - 长度 count*3 的位置数组
     * @param {object} [options] - { size, color, sizeAttenuation, transparent, opacity, blending }
     * @returns {THREE.Points}
     */
    utils3d.createParticles = (count, positions, options = {}) => {
      const geometry = new THREE.BufferGeometry();
      const pos = positions instanceof Float32Array
        ? positions
        : new Float32Array(positions);
      geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));

      const material = new THREE.PointsMaterial({
        size: options.size !== undefined ? options.size : 0.1,
        color: options.color !== undefined ? options.color : 0xffffff,
        sizeAttenuation: options.sizeAttenuation !== undefined ? options.sizeAttenuation : true,
        transparent: options.transparent !== undefined ? options.transparent : true,
        opacity: options.opacity !== undefined ? options.opacity : 1,
        blending: options.blending !== undefined ? options.blending : THREE.NormalBlending,
        depthWrite: false
      });

      const points = new THREE.Points(geometry, material);
      points.userData.count = count;
      return points;
    };

    /**
     * 创建渐变纹理
     * @param {string[]} colors - 颜色数组（如 ['#ff0000', '#00ff00']）
     * @returns {THREE.CanvasTexture}
     */
    utils3d.createGradientTexture = (colors) => {
      const c = document.createElement('canvas');
      c.width = 256;
      c.height = 256;
      const ctx = c.getContext('2d');
      const gradient = ctx.createLinearGradient(0, 0, 0, c.height);
      const arr = Array.isArray(colors) && colors.length > 0 ? colors : ['#ffffff', '#000000'];
      const n = arr.length;
      arr.forEach((color, i) => {
        const stop = n <= 1 ? 0 : i / (n - 1);
        try { gradient.addColorStop(stop, color); } catch (e) { /* 忽略非法颜色 */ }
      });
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, c.width, c.height);
      const texture = new THREE.CanvasTexture(c);
      texture.needsUpdate = true;
      return texture;
    };

    /**
     * 启用泛光（Bloom）后处理
     * @param {number} [strength=0.6]
     * @param {number} [radius=0.4]
     * @param {number} [threshold=0.1]
     * @returns {boolean} 是否成功启用
     */
    utils3d.addBloom = (strength = 0.6, radius = 0.4, threshold = 0.1) => {
      return setBloom(true, { strength, radius, threshold });
    };
  }

  /**
   * 渲染一帧
   * @param {number} t - 当前时间（秒）
   * @returns {HTMLCanvasElement} 3D 画布
   */
  function render(t) {
    if (!isReady) return null;

    if (animateFn) {
      try {
        animateFn(t);
      } catch (e) {
        lastError = e.message;
        console.error('3D 动画错误:', e);
      }
    }

    // 后处理管线可用且启用泛光时走 EffectComposer，否则直接渲染
    if (composer && bloomEnabled) {
      try {
        composer.render();
      } catch (e) {
        lastError = e.message;
        console.error('后处理渲染错误，回退直接渲染:', e);
        renderer.render(scene, camera);
      }
    } else {
      renderer.render(scene, camera);
    }
    return canvas;
  }

  /**
   * 设置默认环境光照
   * 优先使用 PMREMGenerator + RoomEnvironment 生成 IBL 环境贴图；
   * 不可用时降级为 AmbientLight + DirectionalLight。
   * 用户代码可自由添加自己的光源，默认光照不影响。
   */
  function setupDefaultLights() {
    defaultLights = [];
    envRenderTarget = null;

    // 优先尝试 PMREM + RoomEnvironment（基于图像的光照）
    if (typeof THREE.PMREMGenerator !== 'undefined' &&
        typeof THREE.RoomEnvironment !== 'undefined' &&
        renderer) {
      try {
        const pmrem = new THREE.PMREMGenerator(renderer);
        const roomEnv = new THREE.RoomEnvironment();
        const rt = pmrem.fromScene(roomEnv, 0.04);
        scene.environment = rt.texture;
        envRenderTarget = rt;
        pmrem.dispose();
        // 释放 RoomEnvironment 场景内的几何/材质资源
        disposeObject(roomEnv);
        return;
      } catch (e) {
        console.warn('PMREM 环境光照生成失败，降级为基础光照:', e);
        envRenderTarget = null;
        if (scene) scene.environment = null;
      }
    }

    // 降级：环境光 + 平行光
    const ambient = new THREE.AmbientLight(0x404040, 0.5);
    const directional = new THREE.DirectionalLight(0xffffff, 0.8);
    directional.position.set(5, 10, 7.5);
    scene.add(ambient);
    scene.add(directional);
    defaultLights.push(ambient, directional);
  }

  /**
   * 清空场景中的所有对象
   */
  function clearScene() {
    if (!scene) return;

    // 清理默认环境光照资源
    if (envRenderTarget) {
      try { envRenderTarget.dispose(); } catch (e) { /* 忽略 */ }
      envRenderTarget = null;
    }
    if (scene.environment) {
      scene.environment = null;
    }
    defaultLights = [];

    while (scene.children.length > 0) {
      const obj = scene.children[0];
      scene.remove(obj);
      disposeObject(obj);
    }
    scene.userData = {};
  }

  /**
   * 递归释放对象资源
   */
  function disposeObject(obj) {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      if (Array.isArray(obj.material)) {
        obj.material.forEach(m => disposeMaterial(m));
      } else {
        disposeMaterial(obj.material);
      }
    }
    if (obj.children) {
      obj.children.forEach(child => disposeObject(child));
    }
  }

  function disposeMaterial(mat) {
    if (mat.map) mat.map.dispose();
    mat.dispose();
  }

  /**
   * 获取 3D 画布
   */
  function getCanvas() {
    return canvas;
  }

  /**
   * 是否已初始化
   */
  function isInitialized() {
    return isReady;
  }

  /**
   * 是否已加载 Three.js
   */
  function isAvailable() {
    return typeof THREE !== 'undefined';
  }

  return {
    init, setResolution, compileCode, render,
    clearScene, getCanvas, isInitialized, isAvailable,
    getInitError,
    getError: () => lastError,
    // 新增：后处理控制 API
    setBloom,
    setPostProcessing,
    getAvailableEffects,
    dispose: () => {
      clearScene();
      // 释放后处理资源
      if (bloomPass) { try { bloomPass.dispose(); } catch (e) { /* 忽略 */ } bloomPass = null; }
      if (composer) {
        try {
          if (composer.renderTarget1) composer.renderTarget1.dispose();
          if (composer.renderTarget2) composer.renderTarget2.dispose();
        } catch (e) { /* 忽略 */ }
        composer = null;
      }
      renderPass = null;
      bloomEnabled = false;
      if (renderer) { renderer.dispose(); renderer = null; }
      scene = null; camera = null; canvas = null;
      isReady = false;
      // 重置编译状态，防止 dispose 后重新 init 时跳过编译导致空白渲染
      animateFn = null;
      initCode = null;
    }
  };
})();
