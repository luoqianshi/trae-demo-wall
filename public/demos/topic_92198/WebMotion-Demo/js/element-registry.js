/**
 * WebMotion - 元素注册表
 * 代码模式与可视化模式的桥梁
 *
 * 核心机制：
 * - 代码执行时通过 utils.registerElement() 注册可编辑元素
 * - 每帧重新注册（更新代码默认值），用户覆盖值跨帧持久化
 * - 属性优先级：关键帧 > 用户覆盖 > 代码默认值 > 静态值
 * - 不调用 registerElement 的旧代码照常运行（降级为纯代码模式）
 */
const ElementRegistry = (function() {
  let registry = [];        // 当前场景的注册元素（跨帧持久）
  let deletedRegIds = new Set(); // 已删除的注册 ID（防止代码重新注册）
  let frameCallIndex = 0;   // 本帧 registerElement 调用计数
  let currentTime = 0;
  let currentDuration = 0;
  let active = false;       // 是否在代码模式渲染中

  // 所有可覆盖的属性列表
  const OVERRIDABLE_PROPS = [
    // 几何
    'x', 'y', 'w', 'h', 'rotation', 'opacity',
    // 文字
    'text', 'fontSize', 'fontFamily', 'fontWeight', 'textAlign', 'color',
    // 形状
    'fillColor', 'strokeColor', 'strokeWidth', 'borderRadius',
    // 多边形/星形
    'sides', 'points', 'innerRadius',
    // 线条
    'x2', 'y2', 'lineCap',
    // 动画
    'animIn', 'animOut', 'animInDuration', 'animOutDuration', 'animInDelay',
    // 设计经验
    'role', 'emphasis',
    // 图片
    'assetId',
    // 高级渲染
    'gradient', 'filter', 'blendMode', 'glowColor', 'glowIntensity'
  ];

  /** 每帧开始时调用，重置调用计数并标记元素为"未访问" */
  function beginFrame(t, duration) {
    currentTime = t;
    currentDuration = duration;
    frameCallIndex = 0;
    active = true;
    registry.forEach(el => { el._seen = false; });
  }

  /**
   * 注册一个可编辑元素（代码每帧调用）
   * @param {string} type - 'text' | 'rect' | 'circle' | 'image' | 'arrow' | 'triangle' | 'polygon' | 'star' | 'line'
   * @param {object} props - 元素属性（代码提供的默认值）
   * @returns {object} handle — 包含解析后的属性和 draw(ctx) 方法
   */
  function registerElement(type, props = {}) {
    if (!active) return createDummyHandle(type, props);

    // 稳定 ID：优先用显式 id，否则按调用序号自动生成
    const regId = props.id || `__auto_${frameCallIndex++}`;

    // 已删除的元素不再注册（用户手动删除后阻止代码重新创建）
    if (deletedRegIds.has(regId)) return createDummyHandle(type, props);

    let el = registry.find(e => e._regId === regId);

    if (!el) {
      // 首次注册：创建元素，合并默认属性
      el = createRegistryElement(regId, type, props);
      registry.push(el);
      // 场景切换后恢复覆盖值
      const pendingOverride = consumePendingOverrides(regId);
      if (pendingOverride) {
        el._userOverride = { ...pendingOverride };
        // 立即应用覆盖值到元素属性，使 getElements() 返回正确位置
        const resolved = resolveProps(el);
        Object.assign(el, resolved);
      }
    } else {
      // 后续帧：更新代码默认值，保留用户覆盖值和关键帧
      el._seen = true;
      el._codeProps = { ...props };
      // 同步可能每帧变化的内容属性（仅当用户未覆盖时）
      OVERRIDABLE_PROPS.forEach(p => {
        if (props[p] !== undefined && el._userOverride[p] === undefined) {
          el[p] = props[p];
        }
      });
    }

    return createHandle(el);
  }

  /** 创建注册表元素对象 */
  function createRegistryElement(regId, type, props) {
    return {
      _regId: regId,
      _seen: true,
      _isRegistry: true,           // 标记为代码注册元素
      _codeProps: { ...props },     // 代码每帧更新的默认值
      _userOverride: {},            // 用户编辑的覆盖值
      // 元素属性（与 VisualEditor.addElement 格式一致）
      id: Utils.uid(),
      type,
      x: props.x || 640,
      y: props.y || 360,
      w: props.w || 200,
      h: props.h || 60,
      rotation: props.rotation || 0,
      opacity: props.opacity !== undefined ? props.opacity : 1,
      color: props.color || '#ffffff',
      text: props.text || '',
      fontSize: props.fontSize || 36,
      fontFamily: props.fontFamily || 'sans-serif',
      fontWeight: props.fontWeight || 'bold',
      textAlign: props.textAlign || 'center',
      fillColor: props.fillColor || 'transparent',
      strokeColor: props.strokeColor || 'transparent',
      strokeWidth: props.strokeWidth || 0,
      borderRadius: props.borderRadius || 0,
      assetId: props.assetId || null,
      // 多边形/星形参数
      sides: props.sides || 6,
      points: props.points || 5,
      innerRadius: props.innerRadius || 0.5,
      // 线条参数
      x2: props.x2 || 0,
      y2: props.y2 || 0,
      lineCap: props.lineCap || 'round',
      // 动画
      animIn: props.animIn || 'fade',
      animInDuration: props.animInDuration !== undefined ? props.animInDuration : 0.5,
      animInDelay: props.animInDelay || 0,
      animOut: props.animOut || 'fade',
      animOutDuration: props.animOutDuration !== undefined ? props.animOutDuration : 0.5,
      // 角色与强调
      role: props.role || 'support',
      emphasis: props.emphasis !== undefined ? props.emphasis : 1,
      // 高级渲染属性
      gradient: props.gradient || null,
      filter: props.filter || null,
      blendMode: props.blendMode || 'source-over',
      glowColor: props.glowColor || null,
      glowIntensity: props.glowIntensity !== undefined ? props.glowIntensity : null,
      // 父元素（用于元素组合）
      parentId: props.parentId || null,
      // 关键帧
      keyframes: props.keyframes || []
    };
  }

  /**
   * 创建 live handle — 代码通过 handle 读取属性并绘制
   * 属性解析优先级：keyframe > _userOverride > _codeProps > 静态值
   */
  function createHandle(el) {
    const props = resolveProps(el, currentTime);
    const anim = VisualEditor.getAnimOffset(el, currentTime, currentDuration);

    const handle = {
      id: el._regId,
      type: el.type,
      // 几何属性（已解析 + 动画偏移）
      x: props.x + anim.offsetX,
      y: props.y + anim.offsetY,
      w: props.w,
      h: props.h,
      rotation: props.rotation,
      // 动画状态
      opacity: props.opacity * anim.opacity,
      scale: anim.scale,
      // 内容属性（全部从解析后的 props 获取）
      text: props.text !== undefined ? props.text : el.text,
      color: props.color !== undefined ? props.color : el.color,
      fontSize: props.fontSize !== undefined ? props.fontSize : el.fontSize,
      fontFamily: props.fontFamily !== undefined ? props.fontFamily : el.fontFamily,
      fontWeight: props.fontWeight !== undefined ? props.fontWeight : el.fontWeight,
      textAlign: props.textAlign !== undefined ? props.textAlign : el.textAlign,
      fillColor: props.fillColor !== undefined ? props.fillColor : el.fillColor,
      strokeColor: props.strokeColor !== undefined ? props.strokeColor : el.strokeColor,
      strokeWidth: props.strokeWidth !== undefined ? props.strokeWidth : el.strokeWidth,
      borderRadius: props.borderRadius !== undefined ? props.borderRadius : el.borderRadius,
      sides: props.sides !== undefined ? props.sides : el.sides,
      points: props.points !== undefined ? props.points : el.points,
      innerRadius: props.innerRadius !== undefined ? props.innerRadius : el.innerRadius,
      x2: props.x2 !== undefined ? props.x2 : el.x2,
      y2: props.y2 !== undefined ? props.y2 : el.y2,
      lineCap: props.lineCap !== undefined ? props.lineCap : el.lineCap,
      // 高级渲染属性
      gradient: props.gradient !== undefined ? props.gradient : el.gradient,
      filter: props.filter !== undefined ? props.filter : el.filter,
      blendMode: props.blendMode !== undefined ? props.blendMode : el.blendMode,
      glowColor: props.glowColor !== undefined ? props.glowColor : el.glowColor,
      glowIntensity: props.glowIntensity !== undefined ? props.glowIntensity : el.glowIntensity,
      // 原始属性（不含动画偏移，用于命中检测）
      _raw: props,
      _anim: anim,
      _el: el,

      /** 自动绘制（封装 transform + anim + drawElement） */
      draw(ctx) {
        ctx.save();
        ctx.globalAlpha = props.opacity * anim.opacity;
        const cx = props.x + props.w / 2 + anim.offsetX;
        const cy = props.y + props.h / 2 + anim.offsetY;
        ctx.translate(cx, cy);
        ctx.rotate(Utils.deg2rad(props.rotation));
        ctx.scale(anim.scale, anim.scale);
        ctx.translate(-props.w / 2, -props.h / 2);
        VisualEditor.drawElement(ctx, el, props);
        ctx.restore();
      }
    };
    return handle;
  }

  /** 降级 handle（非代码模式时返回，不注册） */
  function createDummyHandle(type, props) {
    return { ...props, type, draw(ctx) {} };
  }

  /**
   * 属性解析：决定元素在当前时间的最终属性值
   * 优先级：关键帧 > 用户覆盖 > 代码默认值 > 静态值
   */
  function resolveProps(el, t) {
    // 如果没有传入 t，跳过关键帧插值，直接用基础属性（防止 NaN 污染）
    let base;
    if (t !== undefined && t !== null) {
      base = VisualEditor.interpolateProps(el, t);
    } else {
      // 无时间参数时，直接返回元素当前属性（不含关键帧插值）
      base = { ...el };
      // 移除内部字段
      delete base._seen;
      delete base._codeProps;
      delete base._userOverride;
      delete base._isRegistry;
      delete base._regId;
    }

    // 如果有用户覆盖值，覆盖对应属性
    const result = { ...base };
    OVERRIDABLE_PROPS.forEach(p => {
      if (el._userOverride && el._userOverride[p] !== undefined) {
        result[p] = el._userOverride[p];
      }
    });

    return result;
  }

  /** 每帧结束时调用，清理代码不再注册的元素 */
  function endFrame() {
    const before = registry.length;
    registry = registry.filter(el => el._seen);
    active = false;
    return before - registry.length; // 返回清理数量
  }

  /** 用户拖拽/编辑时写入覆盖值（支持所有属性） */
  function setOverride(regId, props) {
    const el = registry.find(e => e._regId === regId);
    if (el) {
      Object.assign(el._userOverride, props);
      // 同步到元素属性（供 interpolateProps / drawElement 使用）
      Object.assign(el, props);
    }
  }

  /** 清除某个元素的所有覆盖（恢复代码控制） */
  function clearOverride(regId) {
    const el = registry.find(e => e._regId === regId);
    if (el) {
      // 恢复代码默认值
      OVERRIDABLE_PROPS.forEach(p => {
        if (el._codeProps[p] !== undefined) el[p] = el._codeProps[p];
      });
      el._userOverride = {};
    }
  }

  /** 清除所有元素的覆盖 */
  function clearAllOverrides() {
    registry.forEach(el => {
      OVERRIDABLE_PROPS.forEach(p => {
        if (el._codeProps[p] !== undefined) el[p] = el._codeProps[p];
      });
      el._userOverride = {};
    });
  }

  /** 删除一个注册元素（阻止代码重新注册） */
  function removeElement(regId) {
    registry = registry.filter(el => el._regId !== regId);
    deletedRegIds.add(regId);
  }

  /** 恢复已删除的元素（撤销删除） */
  function restoreElement(regId) {
    deletedRegIds.delete(regId);
  }

  function getElements() { return registry; }
  function getElementByRegId(regId) { return registry.find(e => e._regId === regId); }
  function hasElements() { return registry.length > 0; }
  function clear() { registry = []; deletedRegIds.clear(); active = false; }
  function getOverridableProps() { return OVERRIDABLE_PROPS; }

  /** 序列化用于持久化到 scene.elements */
  function serialize() {
    return registry.map(el => {
      const serialized = { ...el };
      // 移除运行时内部字段
      delete serialized._seen;
      delete serialized._codeProps;
      delete serialized._userOverride;
      delete serialized._isRegistry;
      // 保留 _regId 用于反序列化匹配
      return serialized;
    });
  }

  /** 从持久化数据恢复 */
  function deserialize(elements) {
    registry = (elements || []).map(el => ({
      ...el,
      _regId: el._regId || el.id,
      _seen: false,
      _isRegistry: true,
      _codeProps: {},
      _userOverride: {}
    }));
  }

  /**
   * 保存所有用户覆盖值（用于场景切换时持久化）
   * 返回 { regId: { prop: value, ... }, ... }
   */
  function getOverrides() {
    const overrides = {};
    registry.forEach(el => {
      if (el._userOverride && Object.keys(el._userOverride).length > 0) {
        overrides[el._regId] = { ...el._userOverride };
      }
    });
    return overrides;
  }

  /**
   * 设置待应用的覆盖值（在下一帧 registerElement 时生效）
   * @param {object} overrides - getOverrides() 返回的对象
   */
  function setOverrides(overrides) {
    if (!overrides) return;
    // 直接应用到已存在的元素
    Object.keys(overrides).forEach(regId => {
      const el = registry.find(e => e._regId === regId);
      if (el) {
        el._userOverride = { ...overrides[regId] };
        // 立即重新解析属性
        const resolved = resolveProps(el);
        Object.assign(el, resolved);
      }
    });
  }

  /**
   * 设置待应用的覆盖值（用于场景切换后，在第一帧 registerElement 之前调用）
   * 这些覆盖值会在 registerElement 创建/更新元素时自动应用
   */
  let _pendingOverrides = null;
  function setPendingOverrides(overrides) {
    _pendingOverrides = overrides;
  }

  function consumePendingOverrides(regId) {
    if (!_pendingOverrides || !_pendingOverrides[regId]) return null;
    const override = _pendingOverrides[regId];
    // 不清除 _pendingOverrides，因为同一帧可能有多个元素需要恢复
    return override;
  }

  function clearPendingOverrides() {
    _pendingOverrides = null;
  }

  return {
    beginFrame,
    registerElement,
    endFrame,
    setOverride,
    removeElement,
    resolveProps,
    getElements,
    hasElements,
    clear,
    getOverrides,
    setPendingOverrides,
    clearPendingOverrides
  };
})();
