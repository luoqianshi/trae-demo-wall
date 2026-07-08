/**
 * WebMotion Agent API — 编程式接口
 * 
 * 让编程 Agent / Vibe Coding 直接控制 WebMotion，类似 Remotion 的编程式 API。
 * 
 * 用法示例：
 * 
 * // 1. 使用 AI API 从文案生成动画
 * WebMotionAPI.generateWithAI('今天讲解量子计算。量子比特可同时处于0和1的叠加态。');
 * 
 * // 2. 添加自定义场景
 * WebMotionAPI.addScene({
 *   name: '自定义标题',
 *   code: 'ctx.clearRect(0,0,width,height); ctx.fillStyle="#c9a96e"; ctx.font="bold 64px sans-serif"; ctx.textAlign="center"; ctx.fillText("Hello", width/2, height/2);',
 *   duration: 3
 * });
 * 
 * // 3. 播放预览
 * WebMotionAPI.play();
 * 
 * // 4. 导出
 * WebMotionAPI.exportPNG();
 * 
 * // 5. 获取当前状态
 * WebMotionAPI.getScenes();
 * WebMotionAPI.getCurrentTime();
 * 
 * 完整 API 文档：调用 WebMotionAPI.help()
 */
const WebMotionAPI = (function() {

  const VERSION = '1.0.0';
  const events = {};

  // ===== 事件系统 =====
  function on(event, callback) {
    if (!events[event]) events[event] = [];
    events[event].push(callback);
  }

  function off(event, callback) {
    if (!events[event]) return;
    events[event] = events[event].filter(fn => fn !== callback);
  }

  function emit(event, data) {
    if (!events[event]) return;
    events[event].forEach(fn => {
      try { fn(data); } catch(e) { console.error('[WebMotionAPI] Event handler error:', e); }
    });
  }

  // ===== 内部工具 =====
  function _requireApp() {
    if (typeof App === 'undefined') throw new Error('WebMotion 应用未初始化');
  }

  function _requireScene() {
    _requireApp();
    const scene = SceneManager.getActiveScene();
    if (!scene) throw new Error('没有活动场景');
    return scene;
  }

  function _normalizeSceneData(data) {
    if (!data) return {};
    return {
      name: data.name,
      code: data.code,
      duration: data.duration,
      description: data.description,
      is3D: data.is3D || false,
      transition: data.transition || 'fade',
      transitionDuration: data.transitionDuration || 0.5,
      elements: data.elements || []
    };
  }

  // ===== 生成 API =====

  /**
   * 使用 AI API 生成动画（需要配置 API Key）
   * @param {string} script - 文案脚本
   * @param {object} options - 选项
   * @param {function} options.onProgress - 进度回调
   * @returns {Promise<object>} 生成结果
   */
  async function generateWithAI(script, options = {}) {
    _requireApp();
    if (!AI.isConfigured()) {
      throw new Error('未配置 AI API，请先调用 setAIConfig() 或在界面设置中配置');
    }

    const { sceneCount, style, onProgress, playAfter = true } = options;
    const result = await AI.generateAnimation(script, { sceneCount, style }, onProgress);

    _loadScenes(result.scenes);

    if (playAfter) {
      Timeline.seekTo(0);
      Timeline.play();
    }

    emit('generate', { script, result });
    return result;
  }

  /**
   * 生成单个场景的动画代码
   * @param {string} description - 动画描述
   * @param {object} options - 选项
   * @returns {Promise<string>} 生成的代码
   */
  async function generateScene(description, options = {}) {
    if (!AI.isConfigured()) {
      throw new Error('未配置 AI API');
    }
    return await AI.generateSingleAnimation(description, options);
  }

  // ===== 场景管理 API =====

  /**
   * 获取所有场景
   * @returns {Array} 场景列表
   */
  function getScenes() {
    _requireApp();
    return SceneManager.getScenes().map((s, i) => ({
      index: i,
      name: s.name,
      duration: s.duration,
      is3D: s.is3D || false,
      transition: s.transition || 'fade',
      description: s.description || '',
      codeLength: (s.code || '').length,
      elementCount: (s.elements || []).length
    }));
  }

  /**
   * 获取场景详情（含完整代码）
   * @param {number} index - 场景索引
   * @returns {object} 场景数据
   */
  function getScene(index) {
    _requireApp();
    const scenes = SceneManager.getScenes();
    const idx = index !== undefined ? index : SceneManager.getActiveIndex();
    if (idx < 0 || idx >= scenes.length) throw new Error(`场景索引 ${idx} 超出范围`);
    const s = scenes[idx];
    return {
      index: idx,
      name: s.name,
      code: s.code,
      duration: s.duration,
      is3D: s.is3D || false,
      transition: s.transition || 'fade',
      transitionDuration: s.transitionDuration || 0.5,
      description: s.description || '',
      elements: s.elements || []
    };
  }

  /**
   * 选择当前活动场景
   * @param {number} index - 场景索引
   */
  function selectScene(index) {
    _requireApp();
    SceneManager.setActiveIndex(index);
    emit('sceneChange', { index });
    return WebMotionAPI;
  }

  /**
   * 添加新场景
   * @param {object} data - 场景数据
   * @param {string} data.name - 场景名称
   * @param {string} data.code - 动画代码
   * @param {number} data.duration - 时长（秒）
   * @param {boolean} data.is3D - 是否 3D 模式
   * @param {string} data.transition - 转场效果
   * @returns {object} 创建的场景
   */
  function addScene(data = {}) {
    _requireApp();
    const scene = SceneManager.addScene(_normalizeSceneData(data));
    emit('sceneAdd', { scene });
    return WebMotionAPI;
  }

  /**
   * 更新场景
   * @param {number} index - 场景索引（省略则更新当前场景）
   * @param {object} data - 更新数据
   */
  function updateScene(index, data) {
    _requireApp();
    if (data === undefined) {
      data = index;
      index = SceneManager.getActiveIndex();
    }
    SceneManager.updateScene(index, _normalizeSceneData(data));
    Preview.invalidateCache();
    Preview.renderFrame(Timeline.getCurrentTime());
    emit('sceneUpdate', { index, data });
    return WebMotionAPI;
  }

  /**
   * 删除场景
   * @param {number} index - 场景索引
   */
  function removeScene(index) {
    _requireApp();
    const idx = index !== undefined ? index : SceneManager.getActiveIndex();
    SceneManager.removeScene(idx);
    emit('sceneRemove', { index: idx });
    return WebMotionAPI;
  }

  /**
   * 清空所有场景
   */
  function clearScenes() {
    _requireApp();
    SceneManager.clearAll();
    emit('clear', {});
    return WebMotionAPI;
  }

  /**
   * 移动场景顺序
   * @param {number} from - 源索引
   * @param {number} to - 目标索引
   */
  function moveScene(from, to) {
    _requireApp();
    SceneManager.moveScene(from, to);
    emit('sceneMove', { from, to });
    return WebMotionAPI;
  }

  // ===== 代码编辑 API =====

  /**
   * 获取场景代码
   * @param {number} index - 场景索引（省略则获取当前场景）
   * @returns {string} 代码
   */
  function getCode(index) {
    _requireApp();
    const idx = index !== undefined ? index : SceneManager.getActiveIndex();
    const scenes = SceneManager.getScenes();
    if (idx < 0 || idx >= scenes.length) throw new Error(`场景索引 ${idx} 超出范围`);
    return scenes[idx].code || '';
  }

  /**
   * 设置场景代码
   * @param {number|string} indexOrCode - 场景索引或代码（省略索引则设置当前场景）
   * @param {string} [code] - 代码
   */
  function setCode(indexOrCode, code) {
    _requireApp();
    let index, newCode;
    if (code === undefined) {
      // 只传了代码，设置当前场景
      index = SceneManager.getActiveIndex();
      newCode = indexOrCode;
    } else {
      index = indexOrCode;
      newCode = code;
    }
    SceneManager.updateScene(index, { code: newCode });
    Preview.invalidateCache();
    Preview.renderFrame(Timeline.getCurrentTime());
    emit('codeChange', { index, code: newCode });
    return WebMotionAPI;
  }

  /**
   * 测试编译代码，返回错误信息
   * @param {string} code - 要测试的代码
   * @returns {object} { valid: boolean, error: string|null }
   */
  function compile(code) {
    if (!code || !code.trim()) return { valid: true, error: null };
    try {
      const sanitized = Utils.sanitizeCode(code, '2d');
      new Function('ctx', 't', 'width', 'height', 'utils', sanitized);
      return { valid: true, error: null };
    } catch(e) {
      return { valid: false, error: e.message };
    }
  }

  // ===== 预览控制 API =====

  /** 播放 */
  function play() {
    _requireApp();
    Timeline.play();
    emit('play', {});
    return WebMotionAPI;
  }

  /** 暂停 */
  function pause() {
    _requireApp();
    Timeline.pause();
    emit('pause', {});
    return WebMotionAPI;
  }

  /** 停止并回到起点 */
  function stop() {
    _requireApp();
    Timeline.stop();
    emit('stop', {});
    return WebMotionAPI;
  }

  /**
   * 跳转到指定时间
   * @param {number} time - 时间（秒）
   */
  function seekTo(time) {
    _requireApp();
    Timeline.seekTo(time);
    Preview.renderFrame(time);
    return WebMotionAPI;
  }

  /**
   * 获取当前播放时间
   * @returns {number} 当前时间（秒）
   */
  function getCurrentTime() {
    _requireApp();
    return Timeline.getCurrentTime();
  }

  /**
   * 获取总时长
   * @returns {number} 总时长（秒）
   */
  function getDuration() {
    _requireApp();
    return SceneManager.getTotalDuration();
  }

  /**
   * 渲染指定时间的帧
   * @param {number} time - 时间（秒）
   */
  function renderFrame(time) {
    _requireApp();
    Preview.renderFrame(time);
    return WebMotionAPI;
  }

  /**
   * 获取当前帧的缩略图
   * @param {string} format - 图片格式（默认 'image/png'）
   * @param {number} quality - 质量 0-1（仅 jpeg）
   * @returns {string} data URL
   */
  function getThumbnail(format = 'image/png', quality = 0.9) {
    _requireApp();
    const canvas = document.getElementById('preview-canvas');
    return canvas.toDataURL(format, quality);
  }

  /**
   * 设置分辨率
   * @param {number} w - 宽度
   * @param {number} h - 高度
   */
  function setResolution(w, h) {
    _requireApp();
    Preview.setResolution(w, h);
    Preview.renderFrame(Timeline.getCurrentTime());
    return WebMotionAPI;
  }

  /**
   * 获取当前分辨率
   * @returns {object} { width, height }
   */
  function getResolution() {
    _requireApp();
    return Preview.getSize();
  }

  // ===== 导出 API =====

  /**
   * 导出 PNG 序列帧（ZIP）
   * @param {object} options - 导出选项
   * @param {boolean} options.allScenes - 导出所有场景（默认 true）
   * @param {boolean} options.filmGrain - 胶片质感
   * @param {function} options.onProgress - 进度回调 (progress, current, total)
   * @returns {Promise<Blob>} ZIP 文件
   */
  async function exportPNG(options = {}) {
    _requireApp();
    const { allScenes = true, filmGrain = false, onProgress } = options;
    return await Exporter.exportPNGSequence(allScenes, onProgress, { filmGrain });
  }

  /**
   * 导出 WebM 视频（带透明通道）
   * @param {object} options - 导出选项
   * @param {boolean} options.allScenes - 导出所有场景（默认 true）
   * @param {boolean} options.filmGrain - 胶片质感
   * @param {function} options.onProgress - 进度回调
   * @returns {Promise<Blob>} WebM 文件
   */
  async function exportWebM(options = {}) {
    _requireApp();
    const { allScenes = true, filmGrain = false, onProgress } = options;
    return await Exporter.exportWebM(allScenes, onProgress, { filmGrain });
  }

  /**
   * 导出 GIF 动图
   * @param {object} options - 导出选项
   * @param {string} options.bgColor - 背景色（GIF 不支持透明，默认 '#000000'）
   * @param {boolean} options.allScenes - 导出所有场景（默认 true）
   * @param {boolean} options.filmGrain - 胶片质感
   * @param {function} options.onProgress - 进度回调
   * @returns {Promise<Blob>} GIF 文件
   */
  async function exportGIF(options = {}) {
    _requireApp();
    const { allScenes = true, bgColor = '#000000', filmGrain = false, onProgress } = options;
    return await Exporter.exportGIF(allScenes, onProgress, { bgColor, filmGrain });
  }

  /**
   * 下载导出的文件
   * @param {Blob} blob - 文件数据
   * @param {string} filename - 文件名
   */
  function download(blob, filename) {
    _requireApp();
    Exporter.downloadBlob(blob, filename);
    return WebMotionAPI;
  }

  // ===== 项目管理 API =====

  /**
   * 导出项目为 JSON
   * @returns {object} 项目数据
   */
  function exportProject() {
    _requireApp();
    return SceneManager.exportProject();
  }

  /**
   * 从 JSON 加载项目
   * @param {object} data - 项目数据
   */
  function loadProject(data) {
    _requireApp();
    SceneManager.loadProject(data);
    SceneManager.setActiveIndex(0);
    Preview.invalidateCache();
    Preview.renderFrame(0);
    emit('load', { data });
    return WebMotionAPI;
  }

  /**
   * 保存项目到 localStorage
   * @param {string} key - 存储键名
   */
  function saveProject(key = 'webmotion_project') {
    _requireApp();
    const data = SceneManager.exportProject();
    localStorage.setItem(key, JSON.stringify(data));
    return WebMotionAPI;
  }

  /**
   * 从 localStorage 加载项目
   * @param {string} key - 存储键名
   */
  function loadSavedProject(key = 'webmotion_project') {
    _requireApp();
    const saved = localStorage.getItem(key);
    if (!saved) throw new Error(`未找到保存的项目: ${key}`);
    loadProject(JSON.parse(saved));
    return WebMotionAPI;
  }

  // ===== AI 配置 API =====

  /**
   * 设置 AI API 配置
   * @param {object} config - 配置
   * @param {string} config.baseUrl - API 地址
   * @param {string} config.apiKey - API Key
   * @param {string} config.model - 模型名称
   * @param {number} config.temperature - 温度
   */
  function setAIConfig(config) {
    AI.setConfig(config);
    emit('configChange', { config });
    return WebMotionAPI;
  }

  /**
   * 获取 AI 配置状态
   * @returns {object} { configured, model, baseUrl }
   */
  function getAIConfig() {
    const config = AI.getConfig();
    return {
      configured: AI.isConfigured(),
      model: config.model,
      baseUrl: config.baseUrl
    };
  }

  // ===== 工具 API =====

  /**
   * 获取 Utils 工具对象（供 Agent 参考可用函数）
   * @returns {object} Utils 对象
   */
  function getUtils() {
    return Utils;
  }

  /**
   * 获取系统 Prompt（教 AI 如何生成 WebMotion 代码）
   * @returns {string} 系统提示词
   */
  function getSystemPrompt() {
    return AI.SYSTEM_PROMPT || '';
  }

  /**
   * 获取版本信息
   * @returns {object} { version, modules }
   */
  function getVersion() {
    return {
      version: VERSION,
      modules: ['AI', 'SceneManager', 'Preview', 'Timeline', 'Exporter', 'VisualEditor', 'ElementRegistry', 'Utils'],
      canvasModes: ['2D Canvas', '3D Three.js'],
      exportFormats: ['PNG (ZIP)', 'WebM (VP9 Alpha)', 'GIF']
    };
  }

  // ===== 内部方法 =====

  function _loadScenes(scenes) {
    SceneManager.clearAll();
    scenes.forEach((s, i) => {
      const sceneData = _normalizeSceneData(s);
      if (i === 0) {
        SceneManager.updateScene(0, sceneData);
      } else {
        SceneManager.addScene(sceneData);
      }
    });
    SceneManager.setActiveIndex(0);
    // 同步 UI
    if (typeof App !== 'undefined' && App.syncActiveScene) {
      App.syncActiveScene();
    }
    Preview.invalidateCache();
    Preview.renderFrame(0);
  }

  // ===== 帮助文档 =====

  function help() {
    const docs = `
╔══════════════════════════════════════════════════════════╗
║           WebMotion Agent API v${VERSION}                    ║
║         用代码做视频 — 编程式动画生成接口                   ║
╚══════════════════════════════════════════════════════════╝

【生成动画】
  WebMotionAPI.generateWithAI(script, options)
    → 使用 AI API 生成（需先 setAIConfig）
    → options: { sceneCount, style, onProgress }
    → 返回: Promise<{ summary, scenes }>

  WebMotionAPI.generateScene(description, options)
    → 生成单个场景代码（需 AI API）
    → 返回: Promise<string>

【场景管理】
  WebMotionAPI.getScenes()           → 获取所有场景概览
  WebMotionAPI.getScene(index)       → 获取场景详情（含代码）
  WebMotionAPI.selectScene(index)    → 选择活动场景
  WebMotionAPI.addScene(data)        → 添加场景
  WebMotionAPI.updateScene(index, data) → 更新场景
  WebMotionAPI.removeScene(index)    → 删除场景
  WebMotionAPI.clearScenes()         → 清空所有场景
  WebMotionAPI.moveScene(from, to)   → 移动场景顺序

【代码编辑】
  WebMotionAPI.getCode(index)        → 获取场景代码
  WebMotionAPI.setCode(index, code)  → 设置场景代码
  WebMotionAPI.compile(code)         → 测试编译，返回 { valid, error }

【预览控制】
  WebMotionAPI.play()                → 播放
  WebMotionAPI.pause()               → 暂停
  WebMotionAPI.stop()                → 停止
  WebMotionAPI.seekTo(time)          → 跳转到时间（秒）
  WebMotionAPI.getCurrentTime()      → 获取当前时间
  WebMotionAPI.getDuration()         → 获取总时长
  WebMotionAPI.renderFrame(time)     → 渲染指定帧
  WebMotionAPI.getThumbnail()        → 获取当前帧截图
  WebMotionAPI.setResolution(w, h)   → 设置分辨率

【导出】
  WebMotionAPI.exportPNG(options)    → 导出 PNG 序列帧 ZIP
  WebMotionAPI.exportWebM(options)   → 导出 WebM 视频
  WebMotionAPI.exportGIF(options)    → 导出 GIF 动图

【项目管理】
  WebMotionAPI.exportProject()       → 导出项目 JSON
  WebMotionAPI.loadProject(data)     → 加载项目 JSON
  WebMotionAPI.saveProject(key)      → 保存到 localStorage
  WebMotionAPI.loadSavedProject(key) → 从 localStorage 加载

【AI 配置】
  WebMotionAPI.setAIConfig(config)   → 设置 API 配置
  WebMotionAPI.getAIConfig()         → 获取配置状态

【工具】
  WebMotionAPI.getUtils()            → 获取 Utils 工具对象
  WebMotionAPI.getSystemPrompt()     → 获取系统提示词
  WebMotionAPI.getVersion()          → 获取版本信息
  WebMotionAPI.on(event, callback)   → 监听事件
  WebMotionAPI.off(event, callback)  → 取消监听

【动画代码格式】
  2D 模式: function(ctx, t, width, height, utils) { ... }
  3D 模式: function(THREE, scene, camera, width, height, utils) { return animate(t){} }

  utils 包含: lerp, clamp, map, ease.*, bezier, spring, interpolate, color, registerElement

【事件类型】
  generate, sceneChange, sceneAdd, sceneUpdate, sceneRemove, sceneMove,
  codeChange, play, pause, stop, clear, load, configChange

【链式调用】
  所有修改方法返回 WebMotionAPI，支持链式调用：
  WebMotionAPI.clearScenes().addScene({name:'A', code:'...', duration:3}).play();
`;
    console.log(docs);
    return docs;
  }

  // ===== 返回公共 API =====
  return {
    // 生成
    generateWithAI,
    generateScene,
    // 场景管理
    getScenes,
    getScene,
    selectScene,
    addScene,
    updateScene,
    removeScene,
    clearScenes,
    moveScene,
    // 代码编辑
    getCode,
    setCode,
    compile,
    // 预览控制
    play,
    pause,
    stop,
    seekTo,
    getCurrentTime,
    getDuration,
    renderFrame,
    getThumbnail,
    setResolution,
    getResolution,
    // 导出
    exportPNG,
    exportWebM,
    exportGIF,
    download,
    // 项目管理
    exportProject,
    loadProject,
    saveProject,
    loadSavedProject,
    // AI 配置
    setAIConfig,
    getAIConfig,
    // 工具
    getUtils,
    getSystemPrompt,
    getVersion,
    help,
    // 事件
    on,
    off
  };
})();

// 暴露到 window 供 Agent 和控制台使用
window.WebMotionAPI = WebMotionAPI;

// 启动时打印帮助信息
if (typeof console !== 'undefined') {
  console.log(
    '%c WebMotion Agent API v' + WebMotionAPI.getVersion().version + ' ',
    'background: linear-gradient(90deg, #c9a96e, #fb7185); color: white; font-size: 14px; font-weight: bold; padding: 4px 8px; border-radius: 4px;'
  );
  console.log('%c编程式接口已就绪。调用 WebMotionAPI.help() 查看完整文档。', 'color: #c9a96e;');
  console.log('%c快速开始：WebMotionAPI.generateWithAI("你的文案")', 'color: #22c55e;');
}
