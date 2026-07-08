/**
 * WebMotion - 场景管理模块
 * 一个项目包含多个场景，每个场景是一段独立的动画
 * 核心概念：文案 → AI 拆分为多个重点 → 每个重点生成一个场景动画
 */
const SceneManager = (function() {
  let scenes = [];
  let activeSceneIndex = 0;
  let listeners = [];
  let notifyScheduled = false; // 防抖标志，确保一帧内只通知一次

  function createScene(data = {}) {
    return {
      id: Utils.uid(),
      name: data.name || '未命名场景',
      duration: data.duration || 3,
      code: data.code || '',
      is3D: data.is3D || false,
      elements: data.elements || [],  // 可视化编辑器的元素
      thumbnail: data.thumbnail || null, // base64 缩略图
      description: data.description || '',
      // 场景转场（借鉴 Remotion transitions）
      transition: data.transition || 'fade',  // 'fade'|'slideLeft'|'slideRight'|'slideUp'|'slideDown'|'wipe'|'zoom'|'iris'|'none'
      transitionDuration: data.transitionDuration || 0.5  // 转场时长（秒）
    };
  }

  function init() {
    // 优先加载默认项目（浮空岛开放日）
    if (typeof DEFAULT_PROJECT !== 'undefined' && DEFAULT_PROJECT.scenes && DEFAULT_PROJECT.scenes.length > 0) {
      scenes = DEFAULT_PROJECT.scenes.map(s => createScene(s));
      activeSceneIndex = 0;
    } else {
      // 回退：从模板创建单个空场景
      const defaultTemplate = (typeof TEMPLATES !== 'undefined' && TEMPLATES.length > 0) ? TEMPLATES[0] : null;
      scenes = [createScene({
        name: '场景 1',
        code: defaultTemplate ? defaultTemplate.js : '',
        duration: defaultTemplate ? defaultTemplate.duration : 3
      })];
      activeSceneIndex = 0;
    }
    notifyImmediate();
  }

  function getScenes() { return scenes; }
  function getActiveScene() { return scenes[activeSceneIndex]; }
  function getActiveIndex() { return activeSceneIndex; }

  function setActiveIndex(index) {
    if (index >= 0 && index < scenes.length) {
      activeSceneIndex = index;
      notifyImmediate();
    }
  }

  function addScene(data = {}) {
    const scene = createScene(data);
    scenes.push(scene);
    activeSceneIndex = scenes.length - 1;
    notifyImmediate();
    return scene;
  }

  function insertScene(index, data = {}) {
    const scene = createScene(data);
    scenes.splice(index, 0, scene);
    activeSceneIndex = index;
    notifyImmediate();
    return scene;
  }

  function removeScene(index) {
    if (scenes.length <= 1) return;
    scenes.splice(index, 1);
    if (activeSceneIndex >= scenes.length) {
      activeSceneIndex = scenes.length - 1;
    }
    notifyImmediate();
  }

  function updateScene(index, data) {
    if (index < 0 || index >= scenes.length) return;
    Object.assign(scenes[index], data);
    notify();
  }

  function updateActiveScene(data) {
    updateScene(activeSceneIndex, data);
  }

  /**
   * 静默更新当前活动场景：更新数据但不触发通知。
   * 适用于需要批量更新多个属性后只通知一次的场景。
   * 配合 notify() 或 notifyImmediate() 使用。
   */
  function updateActiveSceneSilent(updates) {
    if (activeSceneIndex < 0 || activeSceneIndex >= scenes.length) return;
    Object.assign(scenes[activeSceneIndex], updates);
    // 不调用 notify
  }

  function moveScene(from, to) {
    if (from < 0 || from >= scenes.length || to < 0 || to >= scenes.length) return;
    const [scene] = scenes.splice(from, 1);
    scenes.splice(to, 0, scene);
    activeSceneIndex = to;
    notifyImmediate();
  }

  function getTotalDuration() {
    return scenes.reduce((sum, s) => sum + s.duration, 0);
  }

  /**
   * 根据全局时间获取场景和局部时间
   * @param {number} globalTime - 全局时间
   * @returns {{ scene, sceneIndex, localTime, scene }}
   */
  function getSceneAtTime(globalTime) {
    if (scenes.length === 0) return null;
    let acc = 0;
    for (let i = 0; i < scenes.length; i++) {
      if (globalTime < acc + scenes[i].duration) {
        return {
          scene: scenes[i],
          sceneIndex: i,
          localTime: globalTime - acc
        };
      }
      acc += scenes[i].duration;
    }
    // 超出范围，返回最后一个场景
    const last = scenes.length - 1;
    return {
      scene: scenes[last],
      sceneIndex: last,
      localTime: scenes[last].duration
    };
  }

  /**
   * 获取场景在全局时间轴中的起始时间
   */
  function getSceneStartTime(index) {
    let acc = 0;
    for (let i = 0; i < index && i < scenes.length; i++) {
      acc += scenes[i].duration;
    }
    return acc;
  }

  function clearAll() {
    scenes = [createScene({ name: '场景 1' })];
    activeSceneIndex = 0;
    notifyImmediate();
  }

  function loadProject(data) {
    scenes = (data.scenes && data.scenes.length > 0) ? data.scenes : [createScene({ name: '场景 1' })];
    activeSceneIndex = 0;
    notifyImmediate();
  }

  function exportProject() {
    return {
      version: '1.0',
      tool: 'WebMotion',
      scenes: scenes.map(s => ({
        name: s.name,
        duration: s.duration,
        code: s.code,
        is3D: s.is3D || false,
        elements: s.elements,
        description: s.description,
        transition: s.transition || 'fade',
        transitionDuration: s.transitionDuration || 0.5,
        _savedOverrides: s._savedOverrides || null
      })),
      createdAt: new Date().toISOString()
    };
  }

  function onChange(callback) {
    listeners.push(callback);
  }

  /**
   * 防抖通知：使用 requestAnimationFrame 确保一帧内只通知一次。
   * 适用于拖拽等高频更新场景（如 updateActiveScene）。
   */
  function notify() {
    if (notifyScheduled) return;
    notifyScheduled = true;
    requestAnimationFrame(() => {
      if (!notifyScheduled) return; // 已被 notifyImmediate 取消
      notifyScheduled = false;
      listeners.forEach(fn => fn({
        scenes,
        activeSceneIndex,
        totalDuration: getTotalDuration()
      }));
    });
  }

  /**
   * 立即通知：跳过防抖，同步触发所有监听器。
   * 适用于切换场景、添加/删除场景等需要立即更新 UI 的场景。
   */
  function notifyImmediate() {
    notifyScheduled = false; // 取消待执行的防抖通知
    listeners.forEach(fn => fn({
      scenes,
      activeSceneIndex,
      totalDuration: getTotalDuration()
    }));
  }

  return {
    init,
    createScene,
    getScenes,
    getActiveScene,
    getActiveIndex,
    setActiveIndex,
    addScene,
    insertScene,
    removeScene,
    updateScene,
    updateActiveScene,
    updateActiveSceneSilent,
    moveScene,
    getTotalDuration,
    getSceneAtTime,
    getSceneStartTime,
    clearAll,
    loadProject,
    exportProject,
    onChange,
    notifyImmediate
  };
})();
