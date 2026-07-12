const AnimPluginLoader = (function() {
  const PLUGIN_VERSION = '1.0.0';
  const PLUGIN_FORMAT = 'animation-preset-v1';
  const STORAGE_KEY = 'jgw_custom_anim_plugins';
  
  let loadedPlugins = {};
  let pluginCSS = {}; // 存储每个自定义插件的CSS文本
  let pluginRawData = {}; // 存储原始插件数据（用于导出）
  let allAnimations = {
    in: [],
    out: [],
    preset: [],
    path: [],
    weight: []
  };
  let categories = [];
  let presetCategories = [];
  let styleElement = null;
  let isLoaded = false;
  let builtinAnimValues = new Set();
  
  function getStyleElement() {
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'anim-plugin-styles';
      document.head.appendChild(styleElement);
    }
    return styleElement;
  }
  
  function validatePlugin(pluginData) {
    if (!pluginData || typeof pluginData !== 'object') return false;
    if (pluginData.format !== PLUGIN_FORMAT && pluginData.pluginFormat !== PLUGIN_FORMAT) {
      console.warn('[AnimPlugin] 格式不匹配:', pluginData.format || pluginData.pluginFormat);
      return false;
    }
    if (!pluginData.animations || !Array.isArray(pluginData.animations)) {
      console.warn('[AnimPlugin] 缺少 animations 数组');
      return false;
    }
    return true;
  }
  
  function validateAnimation(anim) {
    if (!anim || typeof anim !== 'object') return false;
    if (!anim.name || !anim.value) return false;
    return true;
  }
  
  function hasKeyframes(anim) {
    if (!anim.keyframes) return false;
    if (typeof anim.keyframes === 'string') return anim.keyframes.length > 0;
    if (typeof anim.keyframes === 'object') return Object.keys(anim.keyframes).length > 0;
    return false;
  }
  
  function keyframesToCSS(name, keyframes) {
    if (typeof keyframes === 'string') {
      return `@keyframes ${name}{${keyframes}}`;
    }
    let css = `@keyframes ${name}{`;
    for (const [percent, props] of Object.entries(keyframes)) {
      let propStr = '';
      if (typeof props === 'string') {
        propStr = props;
      } else {
        const parts = [];
        for (const [prop, val] of Object.entries(props)) {
          parts.push(`${prop}:${val}`);
        }
        propStr = parts.join(';');
      }
      css += `${percent}{${propStr}}`;
    }
    css += '}';
    return css;
  }
  
  function animClassToCSS(value, duration, timing, iteration, fillMode) {
    const dur = duration || '1s';
    const tim = timing || 'ease-in-out';
    const iter = iteration || 'infinite';
    const fill = fillMode || 'none';
    return `.anim-${value}{animation:${value} var(--animation-duration, ${dur}) ${tim} ${iter} !important;animation-fill-mode:${fill} !important}`;
  }
  
  function rebuildStyles() {
    const styleEl = getStyleElement();
    let css = '';
    for (const id of Object.keys(pluginCSS)) {
      css += pluginCSS[id];
    }
    styleEl.textContent = css;
  }
  
  function registerPlugin(pluginData, options = {}) {
    if (!validatePlugin(pluginData)) return false;
    
    const pluginId = pluginData.id || pluginData.name || `plugin_${Date.now()}`;
    const category = pluginData.category || 'preset';
    const categoryName = pluginData.categoryName || pluginData.name || '自定义动画';
    const isBuiltin = options.isBuiltin === true;
    
    if (loadedPlugins[pluginId] && !options.force) {
      console.warn('[AnimPlugin] 插件已存在:', pluginId);
      return false;
    }
    
    // 如果已存在且force=true，先卸载旧的
    if (loadedPlugins[pluginId] && options.force) {
      unregisterPluginInternal(pluginId);
    }
    
    const validAnims = [];
    let cssText = '';
    
    for (const anim of pluginData.animations) {
      if (!validateAnimation(anim)) {
        console.warn('[AnimPlugin] 无效动画定义:', anim);
        continue;
      }
      
      const animValue = anim.value;
      
      if (isBuiltin) {
        builtinAnimValues.add(animValue);
      }
      
      if (!isBuiltin && hasKeyframes(anim)) {
        cssText += keyframesToCSS(animValue, anim.keyframes);
        cssText += animClassToCSS(
          animValue,
          anim.defaultDuration,
          anim.timingFunction,
          anim.iterationCount,
          anim.fillMode
        );
        if (anim.transformOrigin) {
          cssText += `.anim-${animValue}{transform-origin:${anim.transformOrigin} !important}`;
        }
      }
      
      validAnims.push({
        name: anim.name,
        value: animValue,
        category: category,
        pluginId: pluginId,
        defaultDuration: anim.defaultDuration || '1s',
        timingFunction: anim.timingFunction || 'ease-in-out',
        iterationCount: anim.iterationCount || 'infinite',
        fillMode: anim.fillMode || 'none',
        transformOrigin: anim.transformOrigin || 'center center',
        description: anim.description || '',
        hasKeyframes: hasKeyframes(anim),
        isBuiltin: isBuiltin,
        perChar: anim.perChar || false,
        scatter: anim.scatter || 0,
        scatterMode: anim.scatterMode || 'radial'
      });
    }
    
    if (validAnims.length === 0) {
      console.warn('[AnimPlugin] 没有有效动画');
      return false;
    }
    
    if (cssText) {
      pluginCSS[pluginId] = cssText;
      rebuildStyles();
    }
    
    if (!allAnimations[category]) {
      allAnimations[category] = [];
    }
    allAnimations[category].push(...validAnims);
    
    loadedPlugins[pluginId] = {
      id: pluginId,
      name: pluginData.name || pluginId,
      description: pluginData.description || '',
      author: pluginData.author || '',
      version: pluginData.version || '1.0.0',
      category: category,
      categoryName: categoryName,
      icon: pluginData.icon || '',
      animations: validAnims,
      isBuiltin: isBuiltin
    };
    
    // 保存原始数据（用于导出和 keyframe 计算）
    // 内置插件也需保存，以便 calcCustomAnimTransform 读取 keyframes
    pluginRawData[pluginId] = pluginData;
    
    console.log(`[AnimPlugin] 插件 "${pluginData.name || pluginId}" 已加载，共 ${validAnims.length} 个动画`);
    return true;
  }
  
  function unregisterPluginInternal(pluginId) {
    const plugin = loadedPlugins[pluginId];
    if (!plugin) return;
    
    // 从allAnimations中移除
    const cat = plugin.category;
    if (allAnimations[cat]) {
      allAnimations[cat] = allAnimations[cat].filter(a => a.pluginId !== pluginId);
    }
    
    // 移除CSS
    delete pluginCSS[pluginId];
    rebuildStyles();
    
    // 移除原始数据
    delete pluginRawData[pluginId];
    
    // 从presetCategories中移除（如果是自定义预设分类）
    if (!plugin.isBuiltin && plugin.category === 'preset') {
      presetCategories = presetCategories.filter(c => c.id !== pluginId);
    }
    
    delete loadedPlugins[pluginId];
  }
  
  // ============ localStorage 持久化 ============
  
  function saveCustomPluginsToStorage() {
    try {
      const customData = {};
      for (const id of Object.keys(pluginRawData)) {
        // 只持久化非内置插件（内置插件从磁盘加载）
        if (loadedPlugins[id] && !loadedPlugins[id].isBuiltin) {
          customData[id] = pluginRawData[id];
        }
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customData));
      return true;
    } catch (e) {
      console.error('[AnimPlugin] 保存到localStorage失败:', e);
      return false;
    }
  }
  
  function loadCustomPluginsFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const customData = JSON.parse(raw);
      for (const id of Object.keys(customData)) {
        // 跳过与内置插件同 ID 的缓存项，避免旧版本覆盖新版内置插件
        if (loadedPlugins[id] && loadedPlugins[id].isBuiltin) {
          console.warn('[AnimPlugin] 跳过 localStorage 中与内置插件冲突的项:', id);
          continue;
        }
        const data = customData[id];
        if (registerPlugin(data, { force: true })) {
          // 自定义预设插件添加到presetCategories
          if (data.category === 'preset' || !data.category) {
            const existIdx = presetCategories.findIndex(c => c.id === id);
            if (existIdx === -1) {
              presetCategories.push({
                id: id,
                name: data.categoryName || data.name || '自定义',
                icon: data.icon || '✨',
                type: 'preset',
                order: 100 + presetCategories.length
              });
            }
          }
        }
      }
      console.log('[AnimPlugin] 已从localStorage加载自定义插件');
    } catch (e) {
      console.error('[AnimPlugin] 从localStorage加载失败:', e);
    }
  }
  
  // ============ 公开API ============
  
  function importPlugin(pluginData) {
    if (!validatePlugin(pluginData)) {
      return { success: false, message: '插件格式无效' };
    }
    
    const pluginId = pluginData.id || `plugin_${Date.now()}`;
    pluginData.id = pluginId;
    
    const success = registerPlugin(pluginData, { force: true });
    if (!success) {
      return { success: false, message: '插件注册失败，没有有效动画' };
    }
    
    // 添加到presetCategories
    const cat = pluginData.category || 'preset';
    if (cat === 'preset') {
      const existIdx = presetCategories.findIndex(c => c.id === pluginId);
      if (existIdx === -1) {
        presetCategories.push({
          id: pluginId,
          name: pluginData.categoryName || pluginData.name || '自定义',
          icon: pluginData.icon || '✨',
          type: 'preset',
          order: 100 + presetCategories.length
        });
      }
    }
    
    saveCustomPluginsToStorage();
    return { success: true, message: `插件 "${pluginData.name}" 导入成功`, pluginId: pluginId };
  }
  
  function importPluginFromFile(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          const result = importPlugin(data);
          resolve(result);
        } catch (err) {
          console.error('[AnimPlugin] 解析失败:', err);
          resolve({ success: false, message: 'JSON解析失败: ' + err.message });
        }
      };
      reader.onerror = () => resolve({ success: false, message: '文件读取失败' });
      reader.readAsText(file);
    });
  }
  
  function exportPlugin(pluginId) {
    const plugin = loadedPlugins[pluginId];
    if (!plugin || plugin.isBuiltin) return null; // 内置插件不允许导出
    const raw = pluginRawData[pluginId];
    if (!raw) return null;
    return JSON.parse(JSON.stringify(raw)); // 深拷贝
  }
  
  function exportAllCustomPlugins() {
    const result = {};
    for (const id of Object.keys(pluginRawData)) {
      if (loadedPlugins[id] && !loadedPlugins[id].isBuiltin) {
        result[id] = pluginRawData[id];
      }
    }
    return result;
  }
  
  function deletePlugin(pluginId) {
    const plugin = loadedPlugins[pluginId];
    if (!plugin) return { success: false, message: '插件不存在' };
    if (plugin.isBuiltin) return { success: false, message: '内置插件不可删除' };
    
    const pluginName = plugin.name;
    unregisterPluginInternal(pluginId);
    saveCustomPluginsToStorage();
    return { success: true, message: `插件 "${pluginName}" 已删除` };
  }
  
  function restorePlugins() {
    let count = 0;
    // 删除所有非内置插件
    const customIds = Object.keys(loadedPlugins).filter(id => !loadedPlugins[id].isBuiltin);
    for (const id of customIds) {
      unregisterPluginInternal(id);
      count++;
    }
    // 清除localStorage
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('[AnimPlugin] 清除localStorage失败:', e);
    }
    return { success: true, message: `已还原，移除了 ${count} 个自定义插件`, count: count };
  }
  
  function getCustomPlugins() {
    const result = [];
    for (const id of Object.keys(loadedPlugins)) {
      if (!loadedPlugins[id].isBuiltin) {
        result.push(loadedPlugins[id]);
      }
    }
    return result;
  }
  
  function getBuiltinPlugins() {
    const result = [];
    for (const id of Object.keys(loadedPlugins)) {
      if (loadedPlugins[id].isBuiltin) {
        result.push(loadedPlugins[id]);
      }
    }
    return result;
  }
  
  // ============ 原有API ============
  
  async function loadPluginFromURL(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return registerPlugin(data);
    } catch (e) {
      console.error('[AnimPlugin] 加载失败:', url, e);
      return false;
    }
  }
  
  async function loadPluginFromFile(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          resolve(registerPlugin(data));
        } catch (err) {
          console.error('[AnimPlugin] 解析失败:', err);
          resolve(false);
        }
      };
      reader.readAsText(file);
    });
  }
  
  async function loadBuiltinPlugins() {
    if (isLoaded) return;
    
    try {
      const response = await fetch('animpresets/index.json');
      if (!response.ok) throw new Error('无法加载索引文件');
      const index = await response.json();
      
      categories = index.categories || [];
      
      presetCategories = categories.filter(c => c.type === 'preset').sort((a, b) => a.order - b.order);
      
      const loadPromises = [];
      for (const cat of categories) {
        if (cat.file) {
          loadPromises.push(
            fetch(`animpresets/${cat.file}`)
              .then(r => r.ok ? r.json() : null)
              .then(data => {
                if (data && data.animations) {
                  data.category = cat.type || 'preset';
                  data.categoryName = cat.name;
                  data.id = cat.id;
                  data.name = cat.name;
                  data.icon = cat.icon;
                  registerPlugin(data, { isBuiltin: true });
                }
              })
              .catch(e => console.warn(`[AnimPlugin] 加载 ${cat.file} 失败:`, e))
          );
        }
      }
      
      if (index.customPlugins && Array.isArray(index.customPlugins)) {
        for (const custom of index.customPlugins) {
          if (custom.url || custom.file) {
            loadPromises.push(
              loadPluginFromURL(custom.url || `animpresets/${custom.file}`)
            );
          }
        }
      }
      
      await Promise.all(loadPromises);
      
      // 加载localStorage中的自定义插件
      loadCustomPluginsFromStorage();
      
      isLoaded = true;
      console.log('[AnimPlugin] 内置插件加载完成');
      
    } catch (e) {
      console.warn('[AnimPlugin] 加载内置插件失败:', e);
      // 即使加载失败也尝试加载localStorage
      loadCustomPluginsFromStorage();
      isLoaded = true;
    }
  }
  
  function getAllAnimations(type) {
    if (type) {
      return allAnimations[type] || [];
    }
    return allAnimations;
  }
  
  function getCategories() {
    return categories;
  }
  
  function getPresetCategories() {
    return presetCategories;
  }
  
  function getLoadedPlugins() {
    return loadedPlugins;
  }
  
  function getAnimationByName(name) {
    for (const type of Object.keys(allAnimations)) {
      const found = allAnimations[type].find(a => a.value === name);
      if (found) return found;
    }
    return null;
  }
  
  function getAnimName(type, animValue) {
    const anim = getAnimationByName(animValue);
    if (anim) return anim.name;
    return animValue;
  }
  
  function getDefaultDuration(animName) {
    const anim = getAnimationByName(animName);
    if (anim && anim.defaultDuration) {
      const dur = parseFloat(anim.defaultDuration);
      return isNaN(dur) ? 1 : dur;
    }
    return 1;
  }
  
  function getAnimEffects() {
    const result = {};
    for (const type of Object.keys(allAnimations)) {
      result[type] = allAnimations[type].map(a => ({
        name: a.name,
        value: a.value
      }));
    }
    return result;
  }
  
  function waitForLoaded() {
    return new Promise((resolve) => {
      if (isLoaded) {
        resolve();
      } else {
        const check = () => {
          if (isLoaded) {
            resolve();
          } else {
            setTimeout(check, 50);
          }
        };
        check();
      }
    });
  }
  
  // ============ 自定义插件动画 JS 计算（用于时间轴播放） ============
  
  // 解析CSS transform字符串，返回 { x, y, scaleX, scaleY, rotate, opacity }
  function parseTransformStyle(props) {
    const result = { x: 0, y: 0, scaleX: 1, scaleY: 1, rotate: 0, skewX: 0, skewY: 0, opacity: 1 };
    if (!props) return result;
    
    let transform = '';
    if (typeof props === 'string') {
      const opacityMatch = props.match(/opacity\s*:\s*([\d.]+)/);
      if (opacityMatch) result.opacity = parseFloat(opacityMatch[1]);
      const transformMatch = props.match(/transform\s*:\s*([^;]+)/);
      if (transformMatch) transform = transformMatch[1].trim();
    } else if (typeof props === 'object') {
      if (props.opacity !== undefined) result.opacity = parseFloat(props.opacity);
      if (props.transform) transform = props.transform;
    }
    
    if (!transform) return result;
    
    const translateXMatch = transform.match(/translateX\(\s*(-?[\d.]+)(?:px)?\s*\)/);
    if (translateXMatch) result.x = parseFloat(translateXMatch[1]);
    
    const translateYMatch = transform.match(/translateY\(\s*(-?[\d.]+)(?:px)?\s*\)/);
    if (translateYMatch) result.y = parseFloat(translateYMatch[1]);
    
    const translateMatch = transform.match(/translate\(\s*(-?[\d.]+)(?:px)?\s*,\s*(-?[\d.]+)(?:px)?\s*\)/);
    if (translateMatch) {
      result.x = parseFloat(translateMatch[1]);
      result.y = parseFloat(translateMatch[2]);
    } else {
      const translateSingleMatch = transform.match(/translate\(\s*(-?[\d.]+)(?:px)?\s*\)/);
      if (translateSingleMatch) result.x = parseFloat(translateSingleMatch[1]);
    }
    
    const scaleXMatch = transform.match(/scaleX\(\s*(-?[\d.]+)\s*\)/);
    if (scaleXMatch) result.scaleX = parseFloat(scaleXMatch[1]);
    
    const scaleYMatch = transform.match(/scaleY\(\s*(-?[\d.]+)\s*\)/);
    if (scaleYMatch) result.scaleY = parseFloat(scaleYMatch[1]);
    
    const scaleMatch = transform.match(/scale\(\s*(-?[\d.]+)\s*(?:,\s*(-?[\d.]+)\s*)?\)/);
    if (scaleMatch) {
      result.scaleX = parseFloat(scaleMatch[1]);
      result.scaleY = scaleMatch[2] !== undefined ? parseFloat(scaleMatch[2]) : parseFloat(scaleMatch[1]);
    }
    
    const rotateMatch = transform.match(/rotate\(\s*(-?[\d.]+)(?:deg)?\s*\)/);
    if (rotateMatch) result.rotate = parseFloat(rotateMatch[1]);
    
    const skewXMatch = transform.match(/skewX\(\s*(-?[\d.]+)(?:deg)?\s*\)/);
    if (skewXMatch) result.skewX = parseFloat(skewXMatch[1]);
    
    const skewYMatch = transform.match(/skewY\(\s*(-?[\d.]+)(?:deg)?\s*\)/);
    if (skewYMatch) result.skewY = parseFloat(skewYMatch[1]);
    
    return result;
  }
  
  // 获取keyframes中指定百分比的属性值（支持插值）
  function getKeyframeValueAtProgress(keyframes, progress) {
    if (!keyframes) return null;
    
    let keys = [];
    let values = {};
    
    if (typeof keyframes === 'object') {
      for (const key of Object.keys(keyframes)) {
        const parts = key.split(/[,\s]+/).filter(p => p.length > 0);
        for (const part of parts) {
          const p = parseFloat(part) / 100;
          if (!isNaN(p)) {
            keys.push(p);
            values[p] = keyframes[key];
          }
        }
      }
      keys.sort((a, b) => a - b);
    } else {
      return null;
    }
    
    if (keys.length === 0) return null;
    if (progress <= keys[0]) return parseTransformStyle(values[keys[0]]);
    if (progress >= keys[keys.length - 1]) return parseTransformStyle(values[keys[keys.length - 1]]);
    
    for (let i = 0; i < keys.length - 1; i++) {
      const t0 = keys[i];
      const t1 = keys[i + 1];
      if (progress >= t0 && progress <= t1) {
        const v0 = parseTransformStyle(values[t0]);
        const v1 = parseTransformStyle(values[t1]);
        const t = (progress - t0) / (t1 - t0);
        return {
          x: v0.x + (v1.x - v0.x) * t,
          y: v0.y + (v1.y - v0.y) * t,
          scaleX: v0.scaleX + (v1.scaleX - v0.scaleX) * t,
          scaleY: v0.scaleY + (v1.scaleY - v0.scaleY) * t,
          rotate: v0.rotate + (v1.rotate - v0.rotate) * t,
          skewX: v0.skewX + (v1.skewX - v0.skewX) * t,
          skewY: v0.skewY + (v1.skewY - v0.skewY) * t,
          opacity: v0.opacity + (v1.opacity - v0.opacity) * t
        };
      }
    }
    
    return null;
  }
  
  // 计算自定义插件动画的 transform（供外部调用）
  function calcCustomAnimTransform(animName, progress, scale = 1) {
    const anim = getAnimationByName(animName);
    if (!anim || !anim.hasKeyframes) return null;
    
    const plugin = loadedPlugins[anim.pluginId];
    if (!plugin || !pluginRawData[anim.pluginId]) return null;
    
    const rawAnim = pluginRawData[anim.pluginId].animations.find(a => a.value === animName);
    if (!rawAnim || !rawAnim.keyframes) return null;
    
    const val = getKeyframeValueAtProgress(rawAnim.keyframes, progress);
    if (!val) return null;
    
    return {
      x: val.x * scale,
      y: val.y * scale,
      scaleX: val.scaleX,
      scaleY: val.scaleY,
      rotate: val.rotate,
      opacity: val.opacity
    };
  }
  
  return {
    PLUGIN_VERSION,
    PLUGIN_FORMAT,
    // 原有API
    registerPlugin,
    loadPluginFromURL,
    loadPluginFromFile,
    loadBuiltinPlugins,
    getAllAnimations,
    getCategories,
    getPresetCategories,
    getLoadedPlugins,
    getAnimationByName,
    getAnimName,
    getDefaultDuration,
    getAnimEffects,
    waitForLoaded,
    isLoaded: () => isLoaded,
    isBuiltinAnim: (name) => builtinAnimValues.has(name),
    // 新增插件管理API
    importPlugin,
    importPluginFromFile,
    exportPlugin,
    exportAllCustomPlugins,
    deletePlugin,
    restorePlugins,
    getCustomPlugins,
    getBuiltinPlugins,
    // 动画JS计算
    calcCustomAnimTransform
  };
})();
