/**
 * WebMotion - 可视化编辑器模块
 * 类似"剪映"的简单编辑方式：拖拽元素、属性面板、关键帧动画
 *
 * 元素类型：text, rect, circle, image, arrow
 * 每个元素有属性：x, y, w, h, rotation, opacity, color, text, fontSize, ...
 * 关键帧系统：在时间轴上记录属性值，自动插值
 */
const VisualEditor = (function() {
  let width = 1280, height = 720;
  let elements = []; // 当前场景的元素列表
  let selectedId = null;
  let currentTime = 0;
  let currentDuration = 0;
  let glowEnabled = true; // 辉光效果开关

  function init() {
  }

  function setResolution(w, h) {
    width = w;
    height = h;
  }

  // ===== 元素管理 =====

  function addElement(type, props = {}) {
    const el = {
      id: Utils.uid(),
      type, // text, rect, circle, image, arrow
      x: props.x || width / 2,
      y: props.y || height / 2,
      w: props.w || 200,
      h: props.h || 60,
      rotation: props.rotation || 0,
      opacity: props.opacity !== undefined ? props.opacity : 1,
      color: props.color || '#ffffff',
      // text 特有
      text: props.text || '双击编辑文字',
      fontSize: props.fontSize || 36,
      fontFamily: props.fontFamily || 'sans-serif',
      fontWeight: props.fontWeight || 'bold',
      textAlign: props.textAlign || 'center',
      // rect 特有
      borderRadius: props.borderRadius || 0,
      fillColor: props.fillColor || 'transparent',
      strokeColor: props.strokeColor || 'transparent',
      strokeWidth: props.strokeWidth || 0,
      // image 特有
      assetId: props.assetId || null,
      // 多边形/星形/线条参数
      sides: props.sides || 6,
      points: props.points || 5,
      innerRadius: props.innerRadius !== undefined ? props.innerRadius : 0.5,
      x2: props.x2 || 0,
      y2: props.y2 || 0,
      lineCap: props.lineCap || 'round',
      // 动画属性（生长原则：默认从原点生长，而非飞入）
      animIn: props.animIn || 'scale', // grow, fade, slideLeft, slideRight, slideUp, slideDown, scale, bounce
      animInDuration: props.animInDuration || 0.5,
      animInDelay: props.animInDelay || 0, // 错峰入场延迟（节奏原则）
      animOut: props.animOut || 'fade',
      animOutDuration: props.animOutDuration || 0.5,
      // 设计经验属性（层次原则 + 强调原则）
      role: props.role || 'support', // 'main' | 'support' | 'background'
      emphasis: props.emphasis || 1, // 1-3
      // 关键帧（保留字段兼容性，但不再插值处理）
      keyframes: props.keyframes || []
    };
    elements.push(el);
    selectedId = el.id;
    return el;
  }

  function removeElement(id) {
    elements = elements.filter(e => e.id !== id);
    if (selectedId === id) selectedId = null;
  }

  function updateElement(id, props) {
    const el = elements.find(e => e.id === id);
    if (el) {
      Object.assign(el, props);
    }
  }

  function getElements() { return elements; }
  function setElements(els) {
    elements = els || [];
    // 清除无效的选中状态（切换场景时旧 selectedId 可能指向不存在的元素）
    if (selectedId && !elements.find(e => e.id === selectedId)) {
      selectedId = null;
    }
  }
  function getSelected() { return elements.find(e => e.id === selectedId); }
  function getSelectedId() { return selectedId; }
  function selectElement(id) {
    selectedId = id;
  }

  function setOnElementsChange(fn) {}
  function setOnSelectChange(fn) {}
  function setCurrentTime(t) { currentTime = t; }

  /**
   * 计算元素在当前时间的属性（纯渲染器版本）
   * 不再处理 keyframes 数组中的自定义关键帧，仅返回基础属性
   */
  function interpolateProps(el, time, duration) {
    // 基础属性：始终返回元素当前值
    return {
      x: el.x, y: el.y, w: el.w, h: el.h,
      rotation: el.rotation, opacity: el.opacity,
      text: el.text, color: el.color, fontSize: el.fontSize,
      fontFamily: el.fontFamily, fontWeight: el.fontWeight, textAlign: el.textAlign,
      fillColor: el.fillColor, strokeColor: el.strokeColor, strokeWidth: el.strokeWidth,
      borderRadius: el.borderRadius
    };
  }

  /**
   * 计算入场/出场动画的透明度和位移
   * 支持延迟入场（错峰）和生长动画
   */
  function getAnimOffset(el, t, duration) {
    const delay = el.animInDelay || 0;
    const inEnd = el.animInDuration + delay;
    const animOutDur = el.animOutDuration || 0;
    const outStart = duration - animOutDur;
    let offsetX = 0, offsetY = 0, scale = 1, opacity = 1, blurAmount = 0;

    // 入场动画（考虑延迟）
    if (t < delay) {
      opacity = 0;
      scale = (el.animIn === 'scale' || el.animIn === 'grow' || el.animIn === 'bounce' || el.animIn === 'elastic' || el.animIn === 'flip3d') ? 0 : 1;
      // blurFocus 在延迟期间保持高度模糊
      if (el.animIn === 'blurFocus') blurAmount = 20;
    } else if (t < inEnd) {
      const progress = Utils.clamp((t - delay) / el.animInDuration, 0, 1);
      const eased = Utils.ease.outCubic(progress);
      opacity = eased;

      switch (el.animIn) {
        case 'grow': scale = Utils.lerp(0, 1, eased); break;
        case 'slideLeft': offsetX = Utils.lerp(-width, 0, eased); break;
        case 'slideRight': offsetX = Utils.lerp(width, 0, eased); break;
        case 'slideUp': offsetY = Utils.lerp(height, 0, eased); break;
        case 'slideDown': offsetY = Utils.lerp(-height, 0, eased); break;
        case 'scale': scale = Utils.lerp(0, 1, eased); break;
        case 'bounce':
          // 使用 spring 物理动画（借鉴 Remotion spring，比简单 bounce 缓动更自然）
          const fps = 60;
          const frame = progress * el.animInDuration * fps;
          const springVal = Utils.spring(frame, fps, Utils.springPresets.bouncy);
          scale = Utils.lerp(0, 1, springVal);
          opacity = Utils.lerp(0, 1, progress);
          break;
        case 'typewriter':
          // 逐字显示：根据 progress 截取文字子串（仅影响 text 元素的显示）
          // 这里返回 opacity=1，实际截取在 drawAllElements 中处理
          opacity = 1;
          break;
        case 'blurFocus':
          // 从模糊到清晰：用 filter blur 从大到小
          opacity = eased;
          blurAmount = Utils.lerp(20, 0, eased);
          break;
        case 'glitch':
          // 故障入场：随机偏移 + RGB 分离感
          offsetX = (Math.random() - 0.5) * 20 * (1 - eased);
          offsetY = (Math.random() - 0.5) * 10 * (1 - eased);
          opacity = eased;
          break;
        case 'elastic': {
          // 弹性入场（比 bounce 更夸张）
          const fps2 = 60;
          const frame2 = progress * el.animInDuration * fps2;
          const springVal2 = Utils.spring(frame2, fps2, { damping: 5, mass: 1, stiffness: 200 });
          scale = Utils.lerp(0, 1, springVal2);
          opacity = Utils.lerp(0, 1, progress);
          break;
        }
        case 'flip3d':
          // 3D 翻转入场（用 scale 模拟）
          scale = Utils.lerp(0, 1, eased);
          break;
      }
    }

    // 出场动画
    if (t > outStart) {
      const progress = Utils.clamp((t - outStart) / animOutDur, 0, 1);
      const eased = Utils.ease.inCubic(progress);
      opacity = 1 - eased;

      switch (el.animOut) {
        case 'slideLeft': offsetX = Utils.lerp(0, -width, eased); break;
        case 'slideRight': offsetX = Utils.lerp(0, width, eased); break;
        case 'slideUp': offsetY = Utils.lerp(0, -height, eased); break;
        case 'slideDown': offsetY = Utils.lerp(0, height, eased); break;
        case 'scale': scale = Utils.lerp(1, 0, eased); break;
        case 'grow': scale = Utils.lerp(1, 0, eased); break;
        case 'bounce':
          // 出场也使用 spring 反向
          const fps = 60;
          const frame = progress * animOutDur * fps;
          const springVal = Utils.spring(frame, fps, Utils.springPresets.bouncy);
          scale = Utils.lerp(1, 0, springVal);
          break;
      }
    }

    return { offsetX, offsetY, scale, opacity, blurAmount, animType: el.animIn || 'fade' };
  }

  // ===== 渲染 =====

  /** 绘制所有元素的核心循环（render 和 drawElementsOnly 共用） */
  function drawAllElements(targetCtx, t, duration) {
    elements.forEach(el => {
      const props = interpolateProps(el, t, duration);
      const anim = getAnimOffset(el, t, duration);

      targetCtx.save();
      targetCtx.globalAlpha = props.opacity * anim.opacity;

      const cx = props.x + props.w / 2 + anim.offsetX;
      const cy = props.y + props.h / 2 + anim.offsetY;

      targetCtx.translate(cx, cy);
      targetCtx.rotate(Utils.deg2rad(props.rotation));
      targetCtx.scale(anim.scale, anim.scale);
      targetCtx.translate(-props.w / 2, -props.h / 2);

      // 动画驱动的模糊效果（blurFocus 入场）
      if (anim.blurAmount > 0) {
        targetCtx.filter = 'blur(' + anim.blurAmount + 'px)';
      }

      // 打字机效果：根据进度截取文字子串
      let drawProps = props;
      if (anim.animType === 'typewriter' && el.type === 'text') {
        const delay = el.animInDelay || 0;
        const progress = Utils.clamp((t - delay) / el.animInDuration, 0, 1);
        const fullText = props.text !== undefined ? props.text : el.text;
        const visibleChars = Math.floor(fullText.length * progress);
        drawProps = { ...props, text: fullText.substring(0, visibleChars) };
      }

      drawElement(targetCtx, el, drawProps);

      // 重置动画模糊滤镜
      if (anim.blurAmount > 0) {
        targetCtx.filter = 'none';
      }

      targetCtx.restore();
    });
  }

  /**
   * 渲染所有元素到 Canvas（清空画布 + 绘制元素）
   */
  function render(targetCtx, t, duration) {
    currentTime = t;
    currentDuration = duration;
    targetCtx.clearRect(0, 0, width, height);
    drawAllElements(targetCtx, t, duration);
  }

  /**
   * 仅绘制元素（不清空画布，不绘制选择框）
   * 用于在代码渲染之上叠加可视化元素
   */
  function drawElementsOnly(targetCtx, t, duration) {
    currentTime = t;
    currentDuration = duration;
    drawAllElements(targetCtx, t, duration);
  }

  /**
   * 应用辉光效果（基于元素角色）
   * 主角：强光晕（drop-shadow 风格），配角：微光晕，背景：无光晕
   */
  function applyGlow(ctx, el, props) {
    if (!glowEnabled) {
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      return;
    }
    const p = props || el;
    const role = (p.role || el.role) || 'support';
    // 自定义辉光属性（优先于角色默认值）
    const glowColor = p.glowColor !== undefined ? p.glowColor : (el.glowColor || null);
    const glowIntensity = p.glowIntensity !== undefined ? p.glowIntensity : (el.glowIntensity !== undefined ? el.glowIntensity : null);
    const color = glowColor || p.color || p.fillColor || el.color || el.fillColor || '#c9a96e';

    // 如果有自定义辉光属性，直接应用（优先级最高）
    if (glowColor || glowIntensity !== null) {
      ctx.shadowColor = colorToRgba(color, 0.5);
      ctx.shadowBlur = glowIntensity !== null ? glowIntensity : 20;
      ctx.shadowOffsetY = 0;
      ctx.shadowOffsetX = 0;
      return;
    }

    // 否则使用角色默认辉光逻辑
    if (role === 'main') {
      ctx.shadowColor = colorToRgba(color, 0.5);
      ctx.shadowBlur = 20;
      ctx.shadowOffsetY = 0;
      ctx.shadowOffsetX = 0;
    } else if (role === 'support') {
      ctx.shadowColor = colorToRgba(color, 0.25);
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 1;
    } else {
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
    }
  }

  /** 将颜色转换为 rgba 格式 */
  function colorToRgba(color, alpha) {
    if (!color || color === 'transparent') return `rgba(201, 169, 110,${alpha})`;
    // 简单的 hex 转 rgba
    if (color.startsWith('#')) {
      const hex = color.replace('#', '');
      let r, g, b;
      if (hex.length === 3) {
        r = parseInt(hex[0] + hex[0], 16);
        g = parseInt(hex[1] + hex[1], 16);
        b = parseInt(hex[2] + hex[2], 16);
      } else if (hex.length === 6) {
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
      } else {
        return `rgba(201, 169, 110,${alpha})`;
      }
      if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(201, 169, 110,${alpha})`;
      return `rgba(${r},${g},${b},${alpha})`;
    }
    // 已经是 rgba 格式 — 解析后重组
    const rgbaMatch = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*[\d.]+)?\s*\)/);
    if (rgbaMatch) {
      return `rgba(${rgbaMatch[1]},${rgbaMatch[2]},${rgbaMatch[3]},${alpha})`;
    }
    return `rgba(201, 169, 110,${alpha})`;
  }

  /** 创建渐变对象（线性或径向），在元素局部坐标系中（x=0,y=0 为左上角，w/h 为元素宽高） */
  function createGradient(ctx, w, h, gradient) {
    if (!gradient || !gradient.stops || gradient.stops.length === 0) return null;
    let grad;
    if (gradient.type === 'radial') {
      // radial 渐变从中心向外扩散
      const cx = w / 2, cy = h / 2;
      const r = Math.max(w, h) / 2;
      grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    } else {
      // linear 渐变用 angle 计算起止点（0度=从左到右，90度=从上到下）
      const angle = gradient.angle || 0;
      const rad = Utils.deg2rad(angle);
      const dx = Math.cos(rad);
      const dy = Math.sin(rad);
      // 渐变线长度取元素在方向上的投影，确保完整覆盖
      const len = (Math.abs(w * dx) + Math.abs(h * dy)) / 2;
      const cx = w / 2, cy = h / 2;
      grad = ctx.createLinearGradient(cx - dx * len, cy - dy * len, cx + dx * len, cy + dy * len);
    }
    gradient.stops.forEach(stop => {
      grad.addColorStop(stop.offset, stop.color);
    });
    return grad;
  }

  function drawElement(targetCtx, el, props) {
    // 优先使用 props（已插值的关键帧值），回退到 el（基础属性）
    const p = props || el;
    const { x, y, w, h } = { x: 0, y: 0, w: p.w, h: p.h };

    // 滤镜支持（与动画模糊叠加）
    const elFilter = p.filter || el.filter;
    if (elFilter) {
      const currentFilter = targetCtx.filter;
      targetCtx.filter = (currentFilter && currentFilter !== 'none')
        ? currentFilter + ' ' + elFilter
        : elFilter;
    }

    // 混合模式支持
    targetCtx.globalCompositeOperation = p.blendMode || el.blendMode || 'source-over';

    switch (el.type) {
      case 'text': {
        targetCtx.font = `${p.fontWeight || el.fontWeight || 'normal'} ${p.fontSize || el.fontSize || 24}px ${p.fontFamily || el.fontFamily || 'sans-serif'}`;
        targetCtx.textAlign = p.textAlign || el.textAlign || 'left';
        targetCtx.textBaseline = 'middle';
        // 渐变文字支持
        const textGrad = p.gradient || el.gradient;
        if (textGrad) {
          targetCtx.fillStyle = createGradient(targetCtx, w, h, textGrad) || p.color || el.color || '#ffffff';
        } else {
          targetCtx.fillStyle = p.color || el.color || '#ffffff';
        }

        // 辉光阴影（基于角色浓度）
        applyGlow(targetCtx, el, p);

        const textX = (p.textAlign || el.textAlign) === 'center' ? w / 2 : ((p.textAlign || el.textAlign) === 'right' ? w : 0);
        targetCtx.fillText(p.text !== undefined ? p.text : el.text, textX, h / 2);
        targetCtx.shadowBlur = 0;
        break;
      }

      case 'rect': {
        applyGlow(targetCtx, el, p);
        // 渐变填充支持
        const rectGrad = p.gradient || el.gradient;
        const rectFill = rectGrad ? createGradient(targetCtx, w, h, rectGrad) : (p.fillColor || el.fillColor);
        if (rectFill && rectFill !== 'transparent') {
          targetCtx.fillStyle = rectFill;
          const br = p.borderRadius !== undefined ? p.borderRadius : (el.borderRadius || 0);
          if (br > 0) {
            roundRect(targetCtx, x, y, w, h, br);
            targetCtx.fill();
          } else {
            targetCtx.fillRect(x, y, w, h);
          }
        }
        const sw_rect = p.strokeWidth !== undefined ? p.strokeWidth : el.strokeWidth;
        if (sw_rect > 0 && (p.strokeColor || el.strokeColor) !== 'transparent') {
          targetCtx.strokeStyle = p.strokeColor || el.strokeColor;
          targetCtx.lineWidth = sw_rect;
          const br = p.borderRadius !== undefined ? p.borderRadius : (el.borderRadius || 0);
          if (br > 0) {
            roundRect(targetCtx, x, y, w, h, br);
            targetCtx.stroke();
          } else {
            targetCtx.strokeRect(x, y, w, h);
          }
        }
        targetCtx.shadowBlur = 0;
        break;
      }

      case 'circle': {
        applyGlow(targetCtx, el, p);
        targetCtx.beginPath();
        targetCtx.arc(w / 2, h / 2, Math.min(w, h) / 2, 0, Math.PI * 2);
        // 渐变填充支持
        const circleGrad = p.gradient || el.gradient;
        const circleFill = circleGrad ? createGradient(targetCtx, w, h, circleGrad) : (p.fillColor || el.fillColor);
        if (circleFill && circleFill !== 'transparent') {
          targetCtx.fillStyle = circleFill;
          targetCtx.fill();
        }
        const sw_circle = p.strokeWidth !== undefined ? p.strokeWidth : el.strokeWidth;
        if (sw_circle > 0) {
          targetCtx.strokeStyle = p.strokeColor || el.strokeColor;
          targetCtx.lineWidth = sw_circle;
          targetCtx.stroke();
        }
        targetCtx.shadowBlur = 0;
        break;
      }

      case 'image':
        if (p.assetId || el.assetId) {
          AssetManager.drawImage(p.assetId || el.assetId, targetCtx, x, y, w, h, {
            borderRadius: p.borderRadius !== undefined ? p.borderRadius : el.borderRadius
          });
        }
        break;

      case 'arrow':
        applyGlow(targetCtx, el, p);
        targetCtx.strokeStyle = p.color || el.color;
        targetCtx.lineWidth = (p.strokeWidth !== undefined ? p.strokeWidth : el.strokeWidth) || 4;
        targetCtx.lineCap = 'round';
        targetCtx.beginPath();
        targetCtx.moveTo(x, h / 2);
        targetCtx.lineTo(w - 20, h / 2);
        targetCtx.stroke();
        // 箭头头
        targetCtx.beginPath();
        targetCtx.moveTo(w, h / 2);
        targetCtx.lineTo(w - 20, h / 2 - 10);
        targetCtx.lineTo(w - 20, h / 2 + 10);
        targetCtx.closePath();
        targetCtx.fillStyle = p.color || el.color;
        targetCtx.fill();
        targetCtx.shadowBlur = 0;
        break;

      case 'triangle': {
        applyGlow(targetCtx, el, p);
        drawRegularPolygon(targetCtx, w / 2, h / 2, Math.min(w, h) / 2, 3, -Math.PI / 2);
        // 渐变填充支持
        const triGrad = p.gradient || el.gradient;
        const triFill = triGrad ? createGradient(targetCtx, w, h, triGrad) : (p.fillColor || el.fillColor);
        if (triFill && triFill !== 'transparent') {
          targetCtx.fillStyle = triFill;
          targetCtx.fill();
        }
        const sw_tri = p.strokeWidth !== undefined ? p.strokeWidth : el.strokeWidth;
        if (sw_tri > 0 && (p.strokeColor || el.strokeColor) !== 'transparent') {
          targetCtx.strokeStyle = p.strokeColor || el.strokeColor;
          targetCtx.lineWidth = sw_tri;
          targetCtx.stroke();
        }
        targetCtx.shadowBlur = 0;
        break;
      }

      case 'polygon': {
        applyGlow(targetCtx, el, p);
        const numSides = p.sides || el.sides || 6;
        drawRegularPolygon(targetCtx, w / 2, h / 2, Math.min(w, h) / 2, numSides, -Math.PI / 2);
        // 渐变填充支持
        const polyGrad = p.gradient || el.gradient;
        const polyFill = polyGrad ? createGradient(targetCtx, w, h, polyGrad) : (p.fillColor || el.fillColor);
        if (polyFill && polyFill !== 'transparent') {
          targetCtx.fillStyle = polyFill;
          targetCtx.fill();
        }
        const sw_poly = p.strokeWidth !== undefined ? p.strokeWidth : el.strokeWidth;
        if (sw_poly > 0 && (p.strokeColor || el.strokeColor) !== 'transparent') {
          targetCtx.strokeStyle = p.strokeColor || el.strokeColor;
          targetCtx.lineWidth = sw_poly;
          targetCtx.stroke();
        }
        targetCtx.shadowBlur = 0;
        break;
      }

      case 'star': {
        applyGlow(targetCtx, el, p);
        const numPoints = p.points || el.points || 5;
        const outerR = Math.min(w, h) / 2;
        const innerR = outerR * (p.innerRadius !== undefined ? p.innerRadius : (el.innerRadius || 0.5));
        drawStar(targetCtx, w / 2, h / 2, outerR, innerR, numPoints, -Math.PI / 2);
        // 渐变填充支持
        const starGrad = p.gradient || el.gradient;
        const starFill = starGrad ? createGradient(targetCtx, w, h, starGrad) : (p.fillColor || el.fillColor);
        if (starFill && starFill !== 'transparent') {
          targetCtx.fillStyle = starFill;
          targetCtx.fill();
        }
        const sw_star = p.strokeWidth !== undefined ? p.strokeWidth : el.strokeWidth;
        if (sw_star > 0 && (p.strokeColor || el.strokeColor) !== 'transparent') {
          targetCtx.strokeStyle = p.strokeColor || el.strokeColor;
          targetCtx.lineWidth = sw_star;
          targetCtx.stroke();
        }
        targetCtx.shadowBlur = 0;
        break;
      }

      case 'line': {
        applyGlow(targetCtx, el, p);
        targetCtx.strokeStyle = p.color || el.color;
        targetCtx.lineWidth = (p.strokeWidth !== undefined ? p.strokeWidth : el.strokeWidth) || 4;
        targetCtx.lineCap = el.lineCap || 'round';
        targetCtx.beginPath();
        targetCtx.moveTo(x, y);
        const x2 = p.x2 !== undefined ? p.x2 : (el.x2 !== undefined ? el.x2 : w);
        const y2 = p.y2 !== undefined ? p.y2 : (el.y2 !== undefined ? el.y2 : h);
        targetCtx.lineTo(x2, y2);
        targetCtx.stroke();
        targetCtx.shadowBlur = 0;
        break;
      }
    }

    // 重置滤镜和混合模式（确保不影响后续元素）
    targetCtx.filter = 'none';
    targetCtx.globalCompositeOperation = 'source-over';
  }

  /** 绘制正多边形路径 */
  function drawRegularPolygon(ctx, cx, cy, r, sides, startAngle) {
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const a = startAngle + (i / sides) * Math.PI * 2;
      const px = cx + Math.cos(a) * r;
      const py = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }

  /** 绘制星形路径 */
  function drawStar(ctx, cx, cy, outerR, innerR, points, startAngle) {
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const a = startAngle + (i / (points * 2)) * Math.PI * 2;
      const px = cx + Math.cos(a) * r;
      const py = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // ===== 纯渲染器占位 =====
  function drawOverlayOnly() {}
  function clearOverlay() {}

  return {
    init,
    setResolution,
    addElement,
    removeElement,
    updateElement,
    getElements,
    setElements,
    getSelected,
    getSelectedId,
    selectElement,
    setOnElementsChange,
    setOnSelectChange,
    setCurrentTime,
    render,
    getElementById: (id) => elements.find(e => e.id === id),
    // 供 ElementRegistry 使用
    drawElement,
    getAnimOffset,
    interpolateProps,
    // 仅绘制元素（不清空画布，用于代码+可视化共存）
    drawElementsOnly,
    drawOverlayOnly,
    clearOverlay,
    // 辉光效果开关
    setGlowEnabled: (v) => { glowEnabled = v; },
    isGlowEnabled: () => glowEnabled
  };
})();
