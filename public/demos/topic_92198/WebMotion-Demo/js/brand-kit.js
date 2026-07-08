/**
 * WebMotion - 品牌套件模块（Brand Kit）
 *
 * 管理品牌颜色、字体与 Logo，持久化到 localStorage。
 * 核心能力：
 *   - 保存/加载品牌数据（颜色、字体、Logo）到 localStorage（key: webmotion_brand_kit）
 *   - 将品牌配色应用到单个场景的代码（替换 registerElement / ctx 中的颜色值）
 *   - "一键换色"：将品牌配色应用到全部场景
 *   - 导入/导出品牌套件 JSON
 *
 * 颜色替换策略（基于使用频率）：
 *   1. 扫描场景代码 + 可视化元素中的所有颜色（hex 与 rgba）
 *   2. 按出现频率排序，出现最多的颜色 → 品牌主色（palette[0]），
 *      次多的 → palette[1]，以此类推（超出调色板长度时取模循环）
 *   3. 纯黑(#000000)与纯白(#ffffff)视为结构色（背景/基础文字），默认保留不替换
 *   4. rgba() 颜色按 RGB 基色映射到品牌色，并保留原始透明度（含 ${var} 模板变量）
 *
 * 依赖：SceneManager、Preview（同应用内的其他模块，非外部库）
 * 不依赖任何第三方库，纯原生 JS 实现。
 */
const BrandKit = (function () {
  'use strict';

  var STORAGE_KEY = 'webmotion_brand_kit';

  // ===== 内部状态 =====
  var kit = {
    colors: [],        // 调色板：hex 颜色字符串数组，如 ['#c9a96e', '#fb7185']
    primaryColor: '',  // 主品牌色
    font: '',          // 字体族名称
    logo: null         // Logo 图片（base64 字符串或 null）
  };
  var listeners = [];  // 变更监听器

  // 视为"结构色"的颜色（背景/基础文字），换色时默认保留
  var STRUCTURAL_COLORS = { '#000000': true, '#ffffff': true };

  // 可被替换颜色的属性名（递归应用到元素及关键帧）
  var COLOR_PROPS = { color: true, fillColor: true, strokeColor: true };

  // ====================================================================
  // 颜色工具函数
  // ====================================================================

  /**
   * 规范化 hex 颜色：补 #、3 位扩展为 6 位、转小写
   * @param {string} hex
   * @returns {string} 规范化后的 #rrggbb，非法返回 ''
   */
  function normalizeHex(hex) {
    if (!hex || typeof hex !== 'string') return '';
    hex = hex.trim();
    if (!hex) return '';
    if (hex.charAt(0) !== '#') hex = '#' + hex;
    // 3 位扩展为 6 位
    if (/^#[0-9a-fA-F]{3}$/.test(hex)) {
      hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
    }
    if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return '';
    return hex.toLowerCase();
  }

  /** hex → {r, g, b} */
  function hexToRgb(hex) {
    var h = normalizeHex(hex);
    if (!h) return { r: 0, g: 0, b: 0 };
    return {
      r: parseInt(h.slice(1, 3), 16),
      g: parseInt(h.slice(3, 5), 16),
      b: parseInt(h.slice(5, 7), 16)
    };
  }

  /** {r,g,b} → #rrggbb */
  function rgbToHex(r, g, b) {
    function toHex(n) {
      n = Math.max(0, Math.min(255, Math.round(n)));
      var s = n.toString(16);
      return s.length === 1 ? '0' + s : s;
    }
    return '#' + toHex(r) + toHex(g) + toHex(b);
  }

  /** 是否为结构色（纯黑/纯白） */
  function isStructuralColor(hex) {
    return !!STRUCTURAL_COLORS[hex];
  }

  /** 深拷贝（元素为纯数据结构，JSON 拷贝安全） */
  function deepCopy(obj) {
    if (obj === undefined || obj === null) return obj;
    return JSON.parse(JSON.stringify(obj));
  }

  // ====================================================================
  // 存储层（localStorage）
  // ====================================================================

  /** 从 localStorage 加载品牌数据 */
  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var data = JSON.parse(raw);
        kit = defaultKit(data);
        ensurePrimaryInPalette();
      }
    } catch (e) {
      console.warn('[BrandKit] 加载失败:', e);
    }
  }

  /** 保存品牌数据到 localStorage */
  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(kit));
    } catch (e) {
      console.warn('[BrandKit] 保存失败:', e);
    }
  }

  /** 构造默认 kit（可合并外部数据） */
  function defaultKit(data) {
    var base = {
      colors: [],
      primaryColor: '',
      font: '',
      logo: null
    };
    if (data && typeof data === 'object') {
      if (Array.isArray(data.colors)) base.colors = data.colors.slice();
      if (typeof data.primaryColor === 'string') base.primaryColor = data.primaryColor;
      if (typeof data.font === 'string') base.font = data.font;
      base.logo = data.logo != null ? data.logo : null;
    }
    return base;
  }

  /** 确保主色存在于调色板中（置于首位） */
  function ensurePrimaryInPalette() {
    if (kit.primaryColor) {
      var norm = normalizeHex(kit.primaryColor);
      if (norm) {
        kit.primaryColor = norm;
        var idx = kit.colors.indexOf(norm);
        if (idx === -1) {
          kit.colors.unshift(norm);
        } else if (idx !== 0) {
          // 主色已存在但不在首位，移到首位
          kit.colors.splice(idx, 1);
          kit.colors.unshift(norm);
        }
      }
    }
    // 规范化调色板颜色
    kit.colors = kit.colors
      .map(normalizeHex)
      .filter(function (c, i, arr) { return c && arr.indexOf(c) === i; });
  }

  // ====================================================================
  // Kit CRUD
  // ====================================================================

  /** 初始化：从 localStorage 加载 */
  function init() {
    load();
  }

  /** 返回当前 kit 的深拷贝（防止外部直接修改内部状态） */
  function getKit() {
    return deepCopy(kit);
  }

  /** 更新 kit 并保存 */
  function setKit(data) {
    kit = defaultKit(data);
    ensurePrimaryInPalette();
    save();
    notify();
  }

  /** 添加一个颜色到调色板 */
  function addColor(hex) {
    var norm = normalizeHex(hex);
    if (!norm) return;
    if (kit.colors.indexOf(norm) === -1) {
      kit.colors.push(norm);
    }
    if (!kit.primaryColor) {
      kit.primaryColor = norm;
    }
    save();
    notify();
  }

  /** 从调色板移除一个颜色 */
  function removeColor(hex) {
    var norm = normalizeHex(hex);
    var idx = kit.colors.indexOf(norm);
    if (idx !== -1) {
      kit.colors.splice(idx, 1);
    }
    if (kit.primaryColor === norm) {
      kit.primaryColor = kit.colors.length > 0 ? kit.colors[0] : '';
    }
    save();
    notify();
  }

  /** 设置主品牌色 */
  function setPrimaryColor(hex) {
    var norm = normalizeHex(hex);
    if (!norm) return;
    kit.primaryColor = norm;
    var idx = kit.colors.indexOf(norm);
    if (idx === -1) {
      kit.colors.unshift(norm);
    } else if (idx !== 0) {
      kit.colors.splice(idx, 1);
      kit.colors.unshift(norm);
    }
    save();
    notify();
  }

  /** 设置字体族 */
  function setFont(fontFamily) {
    kit.font = fontFamily || '';
    save();
    notify();
  }

  /** 设置 Logo（base64 图片数据） */
  function setLogo(base64) {
    kit.logo = base64 || null;
    save();
    notify();
  }

  // ====================================================================
  // 调色板
  // ====================================================================

  /**
   * 获取生效调色板：主色在前，其余按序去重
   * @returns {string[]} 规范化的 hex 颜色数组
   */
  function getPalette() {
    var palette = [];
    var primary = normalizeHex(kit.primaryColor);
    if (primary) palette.push(primary);
    kit.colors.forEach(function (c) {
      var norm = normalizeHex(c);
      if (norm && palette.indexOf(norm) === -1) palette.push(norm);
    });
    return palette;
  }

  // ====================================================================
  // 颜色采集（频率统计）
  // ====================================================================

  /** 将单个颜色字符串计入频率表 */
  function addColorToFreq(val, freq) {
    if (typeof val !== 'string' || !val) return;
    // hex
    var norm = normalizeHex(val);
    if (norm) {
      if (!isStructuralColor(norm)) freq[norm] = (freq[norm] || 0) + 1;
      return;
    }
    // rgba/rgb（取 RGB 基色转为 hex 统计）
    var m = val.match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/);
    if (m) {
      var hex = rgbToHex(parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10));
      if (!isStructuralColor(hex)) freq[hex] = (freq[hex] || 0) + 1;
    }
  }

  /** 从场景代码中采集颜色频率 */
  function collectColorsFromCode(code, freq) {
    if (!code) return;
    // hex 颜色（#rrggbb 或 #rgb）
    var hexRegex = /#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g;
    var m;
    while ((m = hexRegex.exec(code)) !== null) {
      var norm = normalizeHex(m[0]);
      if (norm && !isStructuralColor(norm)) {
        freq[norm] = (freq[norm] || 0) + 1;
      }
    }
    // rgba/rgb 颜色（alpha 可能是数字或 ${var} 模板变量，不允许内含括号）
    var rgbaRegex = /rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*([^()]*)\s*)?\)/g;
    while ((m = rgbaRegex.exec(code)) !== null) {
      var r = parseInt(m[1], 10), g = parseInt(m[2], 10), b = parseInt(m[3], 10);
      if (r <= 255 && g <= 255 && b <= 255) {
        var hex = rgbToHex(r, g, b);
        if (!isStructuralColor(hex)) freq[hex] = (freq[hex] || 0) + 1;
      }
    }
  }

  /** 从可视化元素中递归采集颜色频率 */
  function collectColorsFromElements(elements, freq) {
    if (!elements) return;
    function walk(obj) {
      if (!obj || typeof obj !== 'object') return;
      if (Array.isArray(obj)) {
        for (var i = 0; i < obj.length; i++) walk(obj[i]);
        return;
      }
      var keys = Object.keys(obj);
      for (var k = 0; k < keys.length; k++) {
        var key = keys[k];
        var val = obj[key];
        if (COLOR_PROPS[key] && typeof val === 'string') {
          addColorToFreq(val, freq);
        } else if (val && typeof val === 'object') {
          walk(val);
        }
      }
    }
    walk(elements);
  }

  // ====================================================================
  // 颜色应用（代码 + 元素）
  // ====================================================================

  /**
   * 将颜色映射应用到代码字符串
   * 替换所有 hex 与 rgba/rgb 颜色（rgba 保留原始透明度，含 ${var}）
   * @param {string} code - 原始代码
   * @param {object} colorMap - { 原始规范化hex: 品牌hex }
   * @returns {string} 替换后的代码
   */
  function applyColorMapToCode(code, colorMap) {
    if (!code) return code;

    // 1. 替换 hex 颜色
    var hexRegex = /#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g;
    var result = code.replace(hexRegex, function (match) {
      var norm = normalizeHex(match);
      if (!norm || isStructuralColor(norm)) return match; // 结构色保留
      return colorMap[norm] || match;
    });

    // 2. 替换 rgba/rgb 颜色（保留透明度）
    var rgbaRegex = /rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*([^()]*)\s*)?\)/g;
    result = result.replace(rgbaRegex, function (match, r, g, b, a) {
      var ri = parseInt(r, 10), gi = parseInt(g, 10), bi = parseInt(b, 10);
      if (ri > 255 || gi > 255 || bi > 255) return match;
      var hex = rgbToHex(ri, gi, bi);
      if (isStructuralColor(hex)) return match; // 结构色保留
      var target = colorMap[hex];
      if (!target) return match;
      var alpha = (a !== undefined && a !== '') ? a : '1';
      var rgb = hexToRgb(target);
      return 'rgba(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ', ' + alpha + ')';
    });

    return result;
  }

  /** 对单个颜色字符串值应用映射（用于元素属性） */
  function applyColorMapToValue(val, colorMap) {
    if (typeof val !== 'string' || !val) return val;
    // hex
    var norm = normalizeHex(val);
    if (norm) {
      if (isStructuralColor(norm)) return val;
      return colorMap[norm] || val;
    }
    // rgba/rgb（整体匹配）
    var m = val.match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*([^()]*)\s*)?\)$/);
    if (m) {
      var ri = parseInt(m[1], 10), gi = parseInt(m[2], 10), bi = parseInt(m[3], 10);
      if (ri <= 255 && gi <= 255 && bi <= 255) {
        var hex = rgbToHex(ri, gi, bi);
        if (!isStructuralColor(hex) && colorMap[hex]) {
          var target = colorMap[hex];
          var alpha = (m[4] !== undefined && m[4] !== '') ? m[4] : '1';
          var rgb = hexToRgb(target);
          return 'rgba(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ', ' + alpha + ')';
        }
      }
    }
    return val;
  }

  /** 递归替换元素对象中的颜色属性（原地修改） */
  function walkAndReplaceColors(obj, colorMap) {
    if (!obj || typeof obj !== 'object') return;
    if (Array.isArray(obj)) {
      for (var i = 0; i < obj.length; i++) walkAndReplaceColors(obj[i], colorMap);
      return;
    }
    var keys = Object.keys(obj);
    for (var k = 0; k < keys.length; k++) {
      var key = keys[k];
      var val = obj[key];
      if (COLOR_PROPS[key] && typeof val === 'string') {
        obj[key] = applyColorMapToValue(val, colorMap);
      } else if (val && typeof val === 'object') {
        walkAndReplaceColors(val, colorMap);
      }
    }
  }

  // ====================================================================
  // 字体应用
  // ====================================================================

  /**
   * 将字体族应用到代码（替换 registerElement 中的 fontFamily 属性）
   * 匹配 fontFamily: 'xxx' 或 fontFamily: "xxx"
   */
  function applyFontToCode(code, font) {
    if (!code || !font) return code;
    var safeFont = font.replace(/'/g, "\\'");
    return code.replace(/fontFamily\s*:\s*['"][^'"]*['"]/g, "fontFamily: '" + safeFont + "'");
  }

  /** 递归设置元素对象的 fontFamily（原地修改） */
  function walkAndReplaceFont(obj, font) {
    if (!obj || typeof obj !== 'object') return;
    if (Array.isArray(obj)) {
      for (var i = 0; i < obj.length; i++) walkAndReplaceFont(obj[i], font);
      return;
    }
    var keys = Object.keys(obj);
    for (var k = 0; k < keys.length; k++) {
      var key = keys[k];
      var val = obj[key];
      if (key === 'fontFamily') {
        obj[key] = font;
      } else if (val && typeof val === 'object') {
        walkAndReplaceFont(val, font);
      }
    }
  }

  // ====================================================================
  // 场景应用
  // ====================================================================

  /**
   * 将品牌配色/字体应用到指定场景的代码与可视化元素
   * @param {number} sceneIndex - 场景索引
   */
  function applyToScene(sceneIndex) {
    var scenes = (typeof SceneManager !== 'undefined') ? SceneManager.getScenes() : null;
    if (!scenes || sceneIndex < 0 || sceneIndex >= scenes.length) return;
    var scene = scenes[sceneIndex];

    var palette = getPalette();
    var normPalette = palette; // getPalette 已返回规范化颜色
    var hasColors = normPalette.length > 0;
    var hasFont = !!kit.font;
    if (!hasColors && !hasFont) return;

    // 1. 构建颜色映射（基于代码 + 元素的频率统计）
    var colorMap = null;
    if (hasColors) {
      var freq = {};
      collectColorsFromCode(scene.code, freq);
      collectColorsFromElements(scene.elements, freq);
      var sortedColors = Object.keys(freq).sort(function (a, b) {
        return freq[b] - freq[a];
      });
      if (sortedColors.length > 0) {
        colorMap = {};
        // 出现最多的颜色 → palette[0]（主色），依次映射，超出取模循环
        for (var i = 0; i < sortedColors.length; i++) {
          colorMap[sortedColors[i]] = normPalette[i % normPalette.length];
        }
      }
    }

    var updates = {};

    // 2. 应用颜色到代码
    if (scene.code && colorMap) {
      var newCode = applyColorMapToCode(scene.code, colorMap);
      if (newCode !== scene.code) {
        updates.code = newCode;
      }
    }

    // 3. 应用字体到代码（在颜色替换后的基础上继续替换）
    if (scene.code && hasFont) {
      var baseCode = updates.code || scene.code;
      var codeWithFont = applyFontToCode(baseCode, kit.font);
      if (codeWithFont !== baseCode) {
        updates.code = codeWithFont;
      }
    }

    // 4. 应用到可视化元素（颜色 + 字体，递归处理含关键帧）
    if (scene.elements && scene.elements.length > 0) {
      var newElements = deepCopy(scene.elements);
      if (colorMap) {
        walkAndReplaceColors(newElements, colorMap);
      }
      if (hasFont) {
        walkAndReplaceFont(newElements, kit.font);
      }
      // 仅在发生变化时更新
      if (JSON.stringify(newElements) !== JSON.stringify(scene.elements)) {
        updates.elements = newElements;
      }
    }

    // 5. 写回场景
    if (Object.keys(updates).length > 0) {
      SceneManager.updateScene(sceneIndex, updates);
    }
  }

  /**
   * "一键换色"：将品牌配色应用到所有场景
   * 完成后清除预览编译缓存以触发重新渲染
   */
  function applyToAllScenes() {
    var scenes = (typeof SceneManager !== 'undefined') ? SceneManager.getScenes() : null;
    if (!scenes) return;
    for (var i = 0; i < scenes.length; i++) {
      applyToScene(i);
    }
    // 清除预览缓存，确保所有场景重新编译渲染
    if (typeof Preview !== 'undefined' && typeof Preview.invalidateCache === 'function') {
      Preview.invalidateCache();
    }
  }

  // ====================================================================
  // 导入 / 导出
  // ====================================================================

  /** 导出品牌套件为 JSON 字符串 */
  function exportKit() {
    return JSON.stringify(kit, null, 2);
  }

  /**
   * 从 JSON 字符串导入品牌套件
   * @param {string} json - JSON 字符串
   * @returns {boolean} 是否导入成功
   */
  function importKit(json) {
    try {
      var data = JSON.parse(json);
      setKit(data);
      return true;
    } catch (e) {
      console.warn('[BrandKit] 导入失败:', e);
      return false;
    }
  }

  // ====================================================================
  // 变更监听
  // ====================================================================

  /** 注册变更监听器 */
  function onChange(fn) {
    if (typeof fn === 'function') {
      listeners.push(fn);
    }
  }

  /** 通知所有监听器（传入当前 kit 的拷贝） */
  function notify() {
    var snapshot = getKit();
    for (var i = 0; i < listeners.length; i++) {
      try {
        listeners[i](snapshot);
      } catch (e) {
        console.warn('[BrandKit] 监听器异常:', e);
      }
    }
  }

  // ====================================================================
  // 公开 API
  // ====================================================================
  return {
    init: init,
    getKit: getKit,
    setKit: setKit,
    addColor: addColor,
    removeColor: removeColor,
    setPrimaryColor: setPrimaryColor,
    setFont: setFont,
    setLogo: setLogo,
    applyToScene: applyToScene,
    applyToAllScenes: applyToAllScenes,
    exportKit: exportKit,
    importKit: importKit,
    onChange: onChange
  };
})();
