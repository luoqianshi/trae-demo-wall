/**
 * WebMotion - 共享工具库
 * 缓动函数、数学工具、颜色处理、物理动画等
 *
 * 借鉴 Remotion 先进经验：
 * - spring() 阻尼谐振子物理模型
 * - bezier() 三次贝塞尔曲线
 * - interpolate() 多段插值 + 外推策略
 * - 丰富的 Easing 预设
 */
const Utils = {
  // ===== 基础数学 =====

  lerp: (a, b, t) => a + (b - a) * t,
  clamp: (v, min, max) => Math.min(Math.max(v, min), max),
  map: (v, min1, max1, min2, max2) => min2 + (max2 - min2) * ((v - min1) / (max1 - min1)),
  deg2rad: (deg) => deg * Math.PI / 180,
  rad2deg: (rad) => rad * 180 / Math.PI,
  dist: (x1, y1, x2, y2) => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2),
  random: (min, max) => Math.random() * (max - min) + min,
  pick: (arr) => arr && arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : undefined,

  // ===== 多段插值（借鉴 Remotion interpolate） =====

  /**
   * 多段插值函数 — 支持多关键帧、按段缓动、外推策略
   * 借鉴 Remotion 的 interpolate() 设计
   *
   * @param {number} input - 输入值
   * @param {number[]} inputRange - 输入范围（必须单调递增）
   * @param {number[]|string[]} outputRange - 输出范围
   * @param {object} options - 选项
   * @param {function|function[]} options.easing - 缓动函数（单个或按段数组）
   * @param {string} options.extrapolateLeft - 左外推策略: 'extend'|'clamp'|'identity'|'wrap'
   * @param {string} options.extrapolateRight - 右外推策略: 'extend'|'clamp'|'identity'|'wrap'
   * @returns {number|string}
   */
  interpolate(input, inputRange, outputRange, options = {}) {
    const {
      easing = (t) => t,
      extrapolateLeft = 'clamp',
      extrapolateRight = 'clamp'
    } = options;

    // 单一缓动函数扩展为按段数组
    const easings = Array.isArray(easing) ? easing : inputRange.slice(1).map(() => easing);

    // 左外推
    if (input < inputRange[0]) {
      if (extrapolateLeft === 'clamp') return outputRange[0];
      if (extrapolateLeft === 'identity') return input;
      if (extrapolateLeft === 'wrap') {
        const range = inputRange[inputRange.length - 1] - inputRange[0];
        input = inputRange[0] + (((input - inputRange[0]) % range) + range) % range;
      }
      // extend: 继续往下计算
    }

    // 右外推
    if (input > inputRange[inputRange.length - 1]) {
      if (extrapolateRight === 'clamp') return outputRange[outputRange.length - 1];
      if (extrapolateRight === 'identity') return input;
      if (extrapolateRight === 'wrap') {
        const range = inputRange[inputRange.length - 1] - inputRange[0];
        input = inputRange[0] + (((input - inputRange[0]) % range) + range) % range;
      }
      // extend: 继续往下计算
    }

    // 找到所在区间段
    let i = 0;
    for (; i < inputRange.length - 1; i++) {
      if (input >= inputRange[i] && input <= inputRange[i + 1]) break;
    }
    if (i >= inputRange.length - 1) i = inputRange.length - 2;

    const inputMin = inputRange[i];
    const inputMax = inputRange[i + 1];
    const outputMin = outputRange[i];
    const outputMax = outputRange[i + 1];

    // 归一化
    let result = inputMin === inputMax ? 0 : (input - inputMin) / (inputMax - inputMin);
    // 应用缓动
    const easeFn = easings[i] || ((t) => t);
    result = easeFn(result);
    // 映射到输出范围
    result = result * (outputMax - outputMin) + outputMin;

    return result;
  },

  // ===== Spring 物理动画（借鉴 Remotion spring） =====

  /**
   * 阻尼谐振子物理模型 — 产生自然的弹性/回弹动画
   * 借鉴 Remotion 的 springCalculation() 实现
   *
   * @param {number} frame - 当前帧
   * @param {number} fps - 帧率
   * @param {object} config - 物理参数
   * @param {number} config.damping - 阻尼（默认10）
   * @param {number} config.mass - 质量（默认1）
   * @param {number} config.stiffness - 刚度（默认100）
   * @param {boolean} config.overshootClamping - 钳制过冲（默认false）
   * @returns {number} 0~1 的动画进度值
   */
  spring(frame, fps, config = {}) {
    const damping = config.damping ?? 10;
    const mass = config.mass ?? 1;
    const stiffness = config.stiffness ?? 100;
    const overshootClamping = config.overshootClamping ?? false;

    if (damping <= 0) throw new Error('Spring damping must be > 0');
    if (frame <= 0) return 0;

    const from = 0, to = 1;
    let current = from, velocity = 0, lastTimestamp = 0;

    const c = damping, m = mass, k = stiffness;
    const zeta = c / (2 * Math.sqrt(k * m));       // 阻尼比
    const omega0 = Math.sqrt(k / m);                 // 无阻尼固有角频率
    const omega1 = omega0 * Math.sqrt(1 - zeta ** 2); // 阻尼振荡频率

    const frameClamped = Math.max(0, frame);
    const unevenRest = frameClamped % 1;

    for (let f = 0; f <= Math.floor(frameClamped); f++) {
      const curFrame = f === Math.floor(frameClamped) ? f + unevenRest : f;
      const deltaTime = Math.min((curFrame / fps) * 1000 - lastTimestamp, 64);
      const t = deltaTime / 1000;

      const v0 = -velocity;
      const x0 = to - current;

      const sin1 = Math.sin(omega1 * t);
      const cos1 = Math.cos(omega1 * t);

      let position, newVelocity;

      if (zeta < 1) {
        // 欠阻尼：有弹跳振荡
        const envelope = Math.exp(-zeta * omega0 * t);
        const frag1 = envelope * (sin1 * ((v0 + zeta * omega0 * x0) / omega1) + x0 * cos1);
        position = to - frag1;
        newVelocity = zeta * omega0 * frag1 - envelope * (cos1 * (v0 + zeta * omega0 * x0) - omega1 * x0 * sin1);
      } else {
        // 临界阻尼：无振荡平滑收敛
        const envelope = Math.exp(-omega0 * t);
        position = to - envelope * (x0 + (v0 + omega0 * x0) * t);
        newVelocity = envelope * (v0 * (t * omega0 - 1) + t * x0 * omega0 * omega0);
      }

      if (overshootClamping) {
        if (from < to && position > to) position = to;
        if (from > to && position < to) position = to;
      }

      current = position;
      velocity = newVelocity;
      lastTimestamp = (curFrame / fps) * 1000;
    }

    return current;
  },

  /**
   * Spring 预设配置 — 常用弹性效果
   */
  springPresets: {
    gentle:    { damping: 15, mass: 1, stiffness: 80 },
    wobbly:    { damping: 8,  mass: 1, stiffness: 120 },
    stiff:     { damping: 20, mass: 1, stiffness: 200 },
    slow:      { damping: 18, mass: 1.5, stiffness: 60 },
    molasses:  { damping: 25, mass: 2, stiffness: 40 },
    bouncy:    { damping: 6,  mass: 1, stiffness: 150 }
  },

  // ===== 贝塞尔曲线（借鉴 Remotion bezier） =====

  /**
   * 三次贝塞尔曲线 — 支持 CSS cubic-bezier 语法
   * 借鉴 Remotion/WebKit 的实现
   *
   * @param {number} x1,y1,x2,y2 - 控制点坐标 (0~1)
   * @returns {function} 缓动函数
   */
  bezier(x1, y1, x2, y2) {
    // 预计算采样表
    const tableSize = 11;
    const sampleTable = [];
    for (let i = 0; i <= tableSize; i++) {
      const t = i / tableSize;
      sampleTable.push({
        x: 3 * (1 - t) ** 2 * t * x1 + 3 * (1 - t) * t ** 2 * x2 + t ** 3,
        y: 3 * (1 - t) ** 2 * t * y1 + 3 * (1 - t) * t ** 2 * y2 + t ** 3
      });
    }

    return function(t) {
      if (t <= 0) return 0;
      if (t >= 1) return 1;

      // 牛顿-拉夫森迭代求 t 对应的 x
      let targetX = t;
      let guessT = t;
      for (let iter = 0; iter < 4; iter++) {
        const x = 3 * (1 - guessT) ** 2 * guessT * x1 + 3 * (1 - guessT) * guessT ** 2 * x2 + guessT ** 3;
        const dx = 3 * (1 - guessT) ** 2 * x1 + 6 * (1 - guessT) * guessT * (x2 - x1) + 3 * guessT ** 2 * (1 - x2);
        if (Math.abs(dx) < 1e-6) break;
        guessT -= (x - targetX) / dx;
      }

      // 回退到二分查找
      if (guessT < 0 || guessT > 1) {
        let lo = 0, hi = tableSize;
        while (lo < hi - 1) {
          const mid = Math.floor((lo + hi) / 2);
          if (sampleTable[mid].x < targetX) lo = mid;
          else hi = mid;
        }
        const span = sampleTable[hi].x - sampleTable[lo].x;
        guessT = span > 0 ? lo + (targetX - sampleTable[lo].x) / span * (hi - lo) / tableSize : lo / tableSize;
      }

      // 计算 y 值
      return 3 * (1 - guessT) ** 2 * guessT * y1 + 3 * (1 - guessT) * guessT ** 2 * y2 + guessT ** 3;
    };
  },

  // ===== 缓动函数集（借鉴 Remotion Easing） =====

  ease: {
    linear: t => t,

    // 幂函数族
    inCubic: t => t * t * t,
    outCubic: t => 1 - Math.pow(1 - t, 3),
    inOutCubic: t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
    outQuart: t => 1 - Math.pow(1 - t, 4),
    inOutQuart: t => t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2,
    inQuad: t => t * t,
    outQuad: t => 1 - (1 - t) * (1 - t),
    inOutQuad: t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,

    // 正弦
    inSine: t => 1 - Math.cos((t * Math.PI) / 2),
    outSine: t => Math.sin((t * Math.PI) / 2),
    inOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2,

    // 圆形
    inCircle: t => 1 - Math.sqrt(1 - Math.min(1, t) * Math.min(1, t)),
    outCircle: t => Math.sqrt(1 - Math.min(1, 1 - t) * Math.min(1, 1 - t)),
    inOutCircle: t => t < 0.5
      ? (1 - Math.sqrt(1 - (2 * t) ** 2)) / 2
      : (Math.sqrt(1 - (-2 * t + 2) ** 2) + 1) / 2,

    // 指数
    inExpo: t => t === 0 ? 0 : 2 ** (10 * t - 10),
    outExpo: t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
    inOutExpo: t => t === 0 ? 0 : t === 1 ? 1 : t < 0.5
      ? 2 ** (20 * t - 10) / 2
      : (2 - 2 ** (-20 * t + 10)) / 2,

    // 回退
    inBack: t => {
      const s = 1.70158;
      return t * t * ((s + 1) * t - s);
    },
    outBack: t => {
      const c1 = 1.70158, c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    },
    // 夸张弹性入场：cubic-bezier(0.68, -0.55, 0.27, 1.55) 的近似
    // 物体"砸"进画面又弹起来，超过目标值后回弹，适合主角入场
    popIn: t => {
      const c1 = 2.5, c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    },
    // 弹性入场：cubic-bezier(0.34, 1.56, 0.64, 1) 的近似
    // 比 popIn 更柔和，适合次级元素
    bounceIn: t => {
      const c1 = 1.2, c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    },
    inOutBack: t => {
      const c1 = 1.70158, c2 = c1 * 1.525;
      return t < 0.5
        ? (2 * t) ** 2 * ((c2 + 1) * 2 * t - c2) / 2
        : ((2 * t - 2) ** 2 * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
    },

    // 弹性
    inElastic: t => {
      const c4 = (2 * Math.PI) / 3;
      return t === 0 ? 0 : t === 1 ? 1 : -(2 ** (10 * t - 10)) * Math.sin((t * 10 - 10.75) * c4);
    },
    outElastic: t => {
      const c4 = (2 * Math.PI) / 3;
      return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    },
    inOutElastic: t => {
      const c5 = (2 * Math.PI) / 4.5;
      return t === 0 ? 0 : t === 1 ? 1 : t < 0.5
        ? -(2 ** (20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2
        : (2 ** (-20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1;
    },

    // 弹跳
    bounce: t => {
      const n1 = 7.5625, d1 = 2.75;
      if (t < 1 / d1) return n1 * t * t;
      if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
      if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    },
    inBounce: t => 1 - Utils.ease.bounce(1 - t),
    inOutBounce: t => t < 0.5
      ? (1 - Utils.ease.bounce(1 - 2 * t)) / 2
      : (1 + Utils.ease.bounce(2 * t - 1)) / 2,

    // CSS 标准缓动（通过 bezier 实现，延迟初始化避免引用顺序问题）
    ease: null,
    easeIn: null,
    easeOut: null,
    easeInOut: null,

    // 修饰器（借鉴 Remotion Easing.in/out/inOut）
    in(easing) { return easing; },
    out(easing) { return (t) => 1 - easing(1 - t); },
    inOut(easing) {
      return (t) => t < 0.5 ? easing(t * 2) / 2 : 1 - easing((1 - t) * 2) / 2;
    }
  },

  // ===== 颜色工具 =====

  color: {
    hexToRgb: (hex) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return { r, g, b };
    },
    rgbToHex: (r, g, b) => '#' + [r, g, b].map(x => Math.round(x).toString(16).padStart(2, '0')).join(''),
    rgba: (hex, alpha) => {
      const { r, g, b } = Utils.color.hexToRgb(hex);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    },
    lerp: (c1, c2, t) => {
      const a = Utils.color.hexToRgb(c1);
      const b = Utils.color.hexToRgb(c2);
      return Utils.color.rgbToHex(
        Utils.lerp(a.r, b.r, t),
        Utils.lerp(a.g, b.g, t),
        Utils.lerp(a.b, b.b, t)
      );
    },

    // 带透明度的 rgba 字符串（支持 hex 和 rgb/rgba 输入）
    rgbaWithAlpha: (color, alpha) => {
      if (color == null || color === 'transparent') return `rgba(255,255,255,0)`;
      if (typeof color === 'string' && color.startsWith('#')) {
        const { r, g, b } = Utils.color.hexToRgb(color);
        return `rgba(${r},${g},${b},${alpha})`;
      }
      // 已经是 rgba/rgb 格式，替换或追加 alpha
      const m = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
      if (m) return `rgba(${m[1]},${m[2]},${m[3]},${alpha})`;
      return color;
    },

    // HSL 转 HEX
    hslToHex: (h = 0, s = 0, l = 0) => {
      l /= 100;
      const a = s * Math.min(l, 1 - l) / 100;
      const f = n => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
      };
      return `#${f(0)}${f(8)}${f(4)}`;
    }
  },

  // ===== 格式化与工具 =====

  formatTime: (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = (seconds % 60).toFixed(2);
    return `${m}:${s.padStart(5, '0')}`;
  },

  uid: () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7),

  downloadBlob: (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },

  debounce: (fn, delay) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  },

  // ===== 场景转场（借鉴 Remotion transitions） =====

  /**
   * 场景转场效果计算
   * 借鉴 Remotion TransitionSeries 的设计
   *
   * @param {number} localTime - 当前场景内的局部时间
   * @param {number} duration - 当前场景总时长
   * @param {string} transition - 转场类型: 'fade'|'slideLeft'|'slideRight'|'slideUp'|'slideDown'|'wipe'|'zoom'|'iris'
   * @param {number} transitionDuration - 转场时长（秒）
   * @returns {object} { enterProgress, exitProgress, enterOffset, exitOffset, enterScale, exitScale, enterOpacity, exitOpacity, enterClip, exitClip }
   */
  sceneTransition(localTime, duration, transition = 'fade', transitionDuration = 0.5) {
    const halfDur = transitionDuration / 2;
    const result = {
      enterOpacity: 1, exitOpacity: 1,
      enterOffsetX: 0, enterOffsetY: 0,
      exitOffsetX: 0, exitOffsetY: 0,
      enterScale: 1, exitScale: 1,
      enterClip: null, exitClip: null  // { type: 'wipe'|'iris', value: 0-1 }
    };

    // 入场转场（场景开始时）
    if (localTime < transitionDuration) {
      const progress = Utils.clamp(localTime / transitionDuration, 0, 1);
      const eased = Utils.ease.outCubic(progress);

      switch (transition) {
        case 'fade':
          result.enterOpacity = eased;
          break;
        case 'slideLeft':
          result.enterOpacity = eased;
          result.enterOffsetX = Utils.lerp(640, 0, eased);
          break;
        case 'slideRight':
          result.enterOpacity = eased;
          result.enterOffsetX = Utils.lerp(-640, 0, eased);
          break;
        case 'slideUp':
          result.enterOpacity = eased;
          result.enterOffsetY = Utils.lerp(360, 0, eased);
          break;
        case 'slideDown':
          result.enterOpacity = eased;
          result.enterOffsetY = Utils.lerp(-360, 0, eased);
          break;
        case 'zoom':
          result.enterOpacity = eased;
          result.enterScale = Utils.lerp(1.5, 1, eased);
          break;
        case 'wipe':
          // 从左到右揭示
          result.enterClip = { type: 'wipe', value: eased };
          break;
        case 'iris':
          // 从中心向外扩展
          result.enterClip = { type: 'iris', value: eased };
          break;
      }
    }

    // 出场转场（场景结束时）
    const exitStart = duration - transitionDuration;
    if (localTime > exitStart) {
      const progress = Utils.clamp((localTime - exitStart) / transitionDuration, 0, 1);
      const eased = Utils.ease.inCubic(progress);

      switch (transition) {
        case 'fade':
          result.exitOpacity = 1 - eased;
          break;
        case 'slideLeft':
          result.exitOpacity = 1 - eased;
          result.exitOffsetX = Utils.lerp(0, -640, eased);
          break;
        case 'slideRight':
          result.exitOpacity = 1 - eased;
          result.exitOffsetX = Utils.lerp(0, 640, eased);
          break;
        case 'slideUp':
          result.exitOpacity = 1 - eased;
          result.exitOffsetY = Utils.lerp(0, -360, eased);
          break;
        case 'slideDown':
          result.exitOpacity = 1 - eased;
          result.exitOffsetY = Utils.lerp(0, 360, eased);
          break;
        case 'zoom':
          result.exitOpacity = 1 - eased;
          result.exitScale = Utils.lerp(1, 1.5, eased);
          break;
        case 'wipe':
          // 从左到右隐藏
          result.exitClip = { type: 'wipe', value: 1 - eased };
          break;
        case 'iris':
          // 从外向中心收缩
          result.exitClip = { type: 'iris', value: 1 - eased };
          break;
      }
    }

    return result;
  },

  /**
   * 计算场景转场效果（统一入口，供 preview 和 exporter 共用）
   * @returns {object|null} 转场效果对象，null 表示无转场
   */
  calcTransition(scene, localTime) {
    const transition = scene.transition || 'none';
    const transDur = scene.transitionDuration || 0.5;
    if (!transition || transition === 'none') return null;
    return Utils.sceneTransition(localTime, scene.duration, transition, transDur);
  },

  /**
   * 应用转场变换到 Canvas 上下文（统一入口，供 preview 和 exporter 共用）
   * 调用后需在渲染完成后执行 ctx.restore()
   * @returns {boolean} 是否应用了转场（需要后续 restore）
   */
  applyTransition(ctx, transEffect, width, height) {
    if (!transEffect) return false;
    ctx.save();
    ctx.globalAlpha = transEffect.enterOpacity * transEffect.exitOpacity;
    const offsetX = transEffect.enterOffsetX + transEffect.exitOffsetX;
    const offsetY = transEffect.enterOffsetY + transEffect.exitOffsetY;
    if (offsetX !== 0 || offsetY !== 0) ctx.translate(offsetX, offsetY);
    const scale = transEffect.enterScale * transEffect.exitScale;
    if (scale !== 1) {
      ctx.translate(width / 2, height / 2);
      ctx.scale(scale, scale);
      ctx.translate(-width / 2, -height / 2);
    }
    // 应用裁剪转场（wipe / iris）
    // 取入场和出场中更严格（更小）的裁剪值
    const enterClip = transEffect.enterClip;
    const exitClip = transEffect.exitClip;
    if (enterClip || exitClip) {
      // 选择更严格的裁剪（value 更小）
      let clipType, clipValue;
      if (enterClip && exitClip) {
        clipType = enterClip.type;
        clipValue = Math.min(enterClip.value, exitClip.value);
      } else if (enterClip) {
        clipType = enterClip.type;
        clipValue = enterClip.value;
      } else {
        clipType = exitClip.type;
        clipValue = exitClip.value;
      }
      if (clipValue <= 0) {
        // 完全不可见 — 裁剪到空区域
        ctx.rect(0, 0, 0, 0);
        ctx.clip();
      } else if (clipType === 'wipe') {
        // 从左到右揭示：只显示 [0, width * value] 区域
        ctx.beginPath();
        ctx.rect(0, 0, width * clipValue, height);
        ctx.clip();
      } else if (clipType === 'iris') {
        // 从中心向外扩展：圆形裁剪
        const cx = width / 2, cy = height / 2;
        const maxRadius = Math.sqrt(cx * cx + cy * cy);
        ctx.beginPath();
        ctx.arc(cx, cy, maxRadius * clipValue, 0, Math.PI * 2);
        ctx.clip();
      }
    }
    return true;
  },

  // ===== 噪声函数 (Perlin/Simplex) =====

  // 2D Perlin 噪声 — 用于有机形状、烟雾扰动、地形
  // 使用闭包初始化置换表（只初始化一次）
  noise: (() => {
    // 初始化置换表
    const perm = new Uint8Array(512);
    const base = new Uint8Array(256);
    for (let i = 0; i < 256; i++) base[i] = i;
    // Fisher-Yates 打乱
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [base[i], base[j]] = [base[j], base[i]];
    }
    for (let i = 0; i < 512; i++) perm[i] = base[i & 255];

    const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
    const lerp = (a, b, t) => a + (b - a) * t;
    const grad = (hash, x, y) => {
      const h = hash & 3;
      const u = h < 2 ? x : y;
      const v = h < 2 ? y : x;
      return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
    };

    return function(x, y = 0) {
      const X = Math.floor(x) & 255;
      const Y = Math.floor(y) & 255;
      x -= Math.floor(x);
      y -= Math.floor(y);
      const u = fade(x);
      const v = fade(y);
      const A = perm[X] + Y;
      const B = perm[X + 1] + Y;
      return lerp(
        lerp(grad(perm[A], x, y), grad(perm[B], x - 1, y), u),
        lerp(grad(perm[A + 1], x, y - 1), grad(perm[B + 1], x - 1, y - 1), u),
        v
      ) * 0.5 + 0.5; // 归一化到 0~1
    };
  })(),

  // 分形布朗运动 (fBm) — 多倍频噪声叠加，用于云雾、地形细节
  fbm: function(x, y = 0, octaves = 4, persistence = 0.5, lacunarity = 2) {
    octaves = Math.max(0, Math.floor(octaves) || 0);
    let total = 0, frequency = 1, amplitude = 1, maxValue = 0;
    for (let i = 0; i < octaves; i++) {
      total += Utils.noise(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }
    return maxValue > 0 ? total / maxValue : 0;
  },

  // ===== 贝塞尔路径工具 =====

  // 三次贝塞尔曲线点计算
  bezierPoint: function(t, p0, p1, p2, p3) {
    if (typeof t !== 'number' || !p0 || !p1 || !p2 || !p3) return { x: 0, y: 0 };
    const u = 1 - t;
    const tt = t * t;
    const uu = u * u;
    const uuu = uu * u;
    const ttt = tt * t;
    return {
      x: uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
      y: uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y
    };
  },

  // 贝塞尔曲线切线方向（用于朝向旋转）
  bezierTangent: function(t, p0, p1, p2, p3) {
    if (typeof t !== 'number' || !p0 || !p1 || !p2 || !p3) return 0;
    const u = 1 - t;
    const x = 3 * u * u * (p1.x - p0.x) + 6 * u * t * (p2.x - p1.x) + 3 * t * t * (p3.x - p2.x);
    const y = 3 * u * u * (p1.y - p0.y) + 6 * u * t * (p2.y - p1.y) + 3 * t * t * (p3.y - p2.y);
    return Math.atan2(y, x);
  },

  // 沿贝塞尔路径运动 — 返回 {x, y, angle}
  pathMotion: function(t, points) {
    if (!Array.isArray(points) || points.length < 4) return { x: 0, y: 0, angle: 0 };
    const pos = Utils.bezierPoint(t, points[0], points[1], points[2], points[3]);
    const angle = Utils.bezierTangent(t, points[0], points[1], points[2], points[3]);
    return { x: pos.x, y: pos.y, angle: angle };
  },

  // ===== 粒子系统辅助 =====

  // 创建粒子数组（初始化用，不是每帧调用）
  createParticles: function(count, options = {}) {
    count = Math.max(0, Math.floor(count) || 0);
    const particles = [];
    const minX = options.minX || 0;
    const maxX = options.maxX || 1920;
    const minY = options.minY || 0;
    const maxY = options.maxY || 1080;
    const minSpeed = options.minSpeed || 10;
    const maxSpeed = options.maxSpeed || 50;
    const minSize = options.minSize || 1;
    const maxSize = options.maxSize || 4;
    const minLife = options.minLife || 1;
    const maxLife = options.maxLife || 3;
    const color = options.color || '#ffffff';
    const behavior = options.behavior || 'float'; // float, rise, fall, explode, spiral

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = minSpeed + Math.random() * (maxSpeed - minSpeed);
      let vx = Math.cos(angle) * speed;
      let vy = Math.sin(angle) * speed;

      if (behavior === 'rise') { vx = (Math.random() - 0.5) * 20; vy = -speed; }
      else if (behavior === 'fall') { vx = (Math.random() - 0.5) * 20; vy = speed; }
      else if (behavior === 'explode') { /* keep random angle */ }
      else if (behavior === 'spiral') { /* will be handled in update */ }

      const p = {
        x: minX + Math.random() * (maxX - minX),
        y: minY + Math.random() * (maxY - minY),
        vx, vy,
        size: minSize + Math.random() * (maxSize - minSize),
        life: minLife + Math.random() * (maxLife - minLife),
        maxLife: 0, // 设置后再赋值
        color,
        seed: Math.random() * 1000
      };
      p.maxLife = p.life;
      particles.push(p);
    }
    return particles;
  },

  // 更新粒子状态（每帧调用）
  // 返回更新后的 particles 数组（自动移除死亡粒子并补充新粒子）
  updateParticles: function(particles, dt, options = {}) {
    if (!Array.isArray(particles)) return particles;
    const gravity = options.gravity || 0;
    const wind = options.wind || 0;
    const turbulence = options.turbulence || 0;
    const behavior = options.behavior || 'float';
    const respawn = options.respawn !== false; // 默认重生
    const bounds = options.bounds || { minX: 0, maxX: 1920, minY: 0, maxY: 1080 };

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      if (!p) continue;
      p.life -= dt;

      if (p.life <= 0) {
        if (respawn) {
          // 重生
          p.x = bounds.minX + Math.random() * (bounds.maxX - bounds.minX);
          p.y = bounds.minY + Math.random() * (bounds.maxY - bounds.minY);
          p.life = p.maxLife;
          p.vx = (Math.random() - 0.5) * 50;
          p.vy = (Math.random() - 0.5) * 50;
        } else {
          particles.splice(i, 1);
        }
        continue;
      }

      // 噪声扰动
      if (turbulence > 0) {
        p.vx += (Utils.noise(p.x * 0.01, p.y * 0.01) - 0.5) * turbulence * dt * 100;
        p.vy += (Utils.noise(p.x * 0.01 + 100, p.y * 0.01 + 100) - 0.5) * turbulence * dt * 100;
      }

      // 重力/风力
      p.vy += gravity * dt;
      p.vx += wind * dt;

      // 螺旋行为
      if (behavior === 'spiral') {
        const cx = (bounds.minX + bounds.maxX) / 2;
        const cy = (bounds.minY + bounds.maxY) / 2;
        const dx = p.x - cx;
        const dy = p.y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        p.vx += -dy / (dist + 1) * 50 * dt;
        p.vy += dx / (dist + 1) * 50 * dt;
      }

      // 阻尼
      p.vx *= 0.99;
      p.vy *= 0.99;

      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }

    return particles;
  },

  // 绘制粒子到 ctx
  drawParticles: function(ctx, particles, options = {}) {
    if (!ctx || !Array.isArray(particles) || particles.length === 0) return;
    const blendMode = options.blendMode || 'lighter'; // 默认加法混合，产生发光效果
    const fadeWithLife = options.fadeWithLife !== false; // 默认随生命周期淡出
    const glow = options.glow || false; // 是否发光（用 shadowBlur）

    ctx.save();
    ctx.globalCompositeOperation = blendMode;

    for (const p of particles) {
      if (!p) continue;
      const maxLife = p.maxLife || 1;
      const lifeRatio = maxLife > 0 ? Utils.clamp(p.life / maxLife, 0, 1) : 1;
      const alpha = fadeWithLife ? lifeRatio : 1;
      const size = p.size * (fadeWithLife ? (0.5 + 0.5 * lifeRatio) : 1);

      if (glow) {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = size * 3;
      }

      // 径向渐变粒子（软边发光球）
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 2);
      const rgb = (p.color && typeof p.color === 'string' && p.color.startsWith('#'))
        ? Utils.color.hexToRgb(p.color)
        : { r: 255, g: 255, b: 255 };
      grad.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`);
      grad.addColorStop(0.5, `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha * 0.5})`);
      grad.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, size * 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  },

  // ===== 渐变创建辅助 =====

  // 快速创建线性渐变
  createLinearGradient: function(ctx, x0, y0, x1, y1, stops) {
    if (!ctx || !stops) return null;
    const grad = ctx.createLinearGradient(x0, y0, x1, y1);
    stops.forEach(s => grad.addColorStop(s.offset, s.color));
    return grad;
  },

  // 快速创建径向渐变
  createRadialGradient: function(ctx, x0, y0, r0, x1, y1, r1, stops) {
    if (!ctx || !stops) return null;
    const grad = ctx.createRadialGradient(x0, y0, r0, x1, y1, r1);
    stops.forEach(s => grad.addColorStop(s.offset, s.color));
    return grad;
  },

  // 从渐变定义创建（统一接口，供 registerElement 的 gradient 属性使用）
  createGradient: function(ctx, gradient, x, y, w, h) {
    if (!ctx || !gradient || !gradient.stops) return null;
    if (gradient.type === 'radial') {
      const cx = x + w / 2;
      const cy = y + h / 2;
      const r = Math.max(w, h) / 2;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      gradient.stops.forEach(s => grad.addColorStop(s.offset, s.color));
      return grad;
    } else {
      // linear
      const angle = (gradient.angle || 0) * Math.PI / 180;
      const cx = x + w / 2;
      const cy = y + h / 2;
      const len = Math.max(w, h) / 2;
      const x0 = cx - Math.cos(angle) * len;
      const y0 = cy - Math.sin(angle) * len;
      const x1 = cx + Math.cos(angle) * len;
      const y1 = cy + Math.sin(angle) * len;
      const grad = ctx.createLinearGradient(x0, y0, x1, y1);
      gradient.stops.forEach(s => grad.addColorStop(s.offset, s.color));
      return grad;
    }
  }
};

// 延迟初始化 CSS 标准缓动（依赖 bezier 函数，需在 Utils 定义后执行）
Utils.ease.ease = Utils.bezier(0.42, 0, 1, 1);
Utils.ease.easeIn = Utils.bezier(0.42, 0, 1, 1);
Utils.ease.easeOut = Utils.bezier(0, 0, 0.58, 1);
Utils.ease.easeInOut = Utils.bezier(0.42, 0, 0.58, 1);
// outBounce 是 bounce 的别名（bounce 本身就实现了 CSS easeOutBounce 效果）
Utils.ease.outBounce = Utils.ease.bounce;

/**
 * 代码消毒器：移除 AI 生成代码中对函数参数的重复声明
 * 解决 "Identifier 'utils' has already been declared" 等错误
 *
 * @param {string} code - AI 生成的原始代码
 * @param {'2d'|'3d'} mode - 渲染模式
 * @returns {string} 消毒后的代码
 */
Utils.sanitizeCode = function(code, mode) {
  if (!code) return code;
  const reserved2D = new Set(['ctx', 't', 'width', 'height', 'utils']);
  const reserved3D = new Set(['THREE', 'scene', 'camera', 'width', 'height', 'utils']);
  const reserved = mode === '3d' ? reserved3D : reserved2D;

  const lines = code.split('\n');
  const result = [];
  let skipMode = false;
  let braceDepth = 0;
  let templateDepth = 0; // 跟踪模板字符串（反引号）深度

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // 多行声明跳过模式：等待括号/大括号/模板字符串闭合
    if (skipMode) {
      for (const ch of line) {
        if (ch === '{' || ch === '[' || ch === '(') braceDepth++;
        if (ch === '}' || ch === ']' || ch === ')') braceDepth--;
        if (ch === '`') templateDepth++;
      }
      if (braceDepth <= 0 && templateDepth % 2 === 0) {
        skipMode = false;
        braceDepth = 0;
        templateDepth = 0;
      }
      continue; // 完全跳过被移除的行
    }

    // 检测: const/let/var reservedName = ...
    const match = trimmed.match(/^(?:const|let|var)\s+(\w+)\s*=/);
    if (match && reserved.has(match[1])) {
      // 例外：如果变量名是 t 但赋值来自 registerElement，重命名变量为 _handle_t
      // 避免 const t 与函数参数 t 冲突，同时保留 registerElement 调用
      if (match[1] === 't' && trimmed.includes('registerElement')) {
        // 将 const t = ... 改为 const _handle_t = ...，后续代码中 t.draw 也需替换
        // 但只替换当前行和后续引用（简单方案：直接保留并用 let 覆盖参数）
        // 更安全：重命名所有行中的 t 引用（仅当 t 是 registerElement 的返回值时）
        const renamedLine = line.replace(/^(const|let|var)\s+t\s*=/, '$1 _t =').replace(/\bt\./g, '_t.');
        result.push(renamedLine);
        // 检查是否为多行声明
        let opens = 0, closes = 0;
        for (const ch of line) {
          if (ch === '{' || ch === '[' || ch === '(') opens++;
          if (ch === '}' || ch === ']' || ch === ')') closes++;
        }
        if (opens > closes) {
          skipMode = true;
          braceDepth = opens - closes;
          templateDepth = 0;
        }
        continue;
      }
      // 检查是否为多行声明（开括号多于闭括号，或模板字符串未闭合）
      let opens = 0, closes = 0, backtickCount = 0;
      for (const ch of line) {
        if (ch === '{' || ch === '[' || ch === '(') opens++;
        if (ch === '}' || ch === ']' || ch === ')') closes++;
        if (ch === '`') backtickCount++;
      }
      const hasUnclosedTemplate = (backtickCount % 2) !== 0;
      if (opens > closes || hasUnclosedTemplate) {
        skipMode = true;
        braceDepth = opens - closes;
        templateDepth = hasUnclosedTemplate ? 1 : 0;
      }
      // 跳过此行（不加入 result）
      continue;
    }
    // 如果当前行引用了 t. 且之前有 registerElement handle，也需替换
    // （仅在该场景下，将 t. 替换为 _t.）
    // 这个处理放在 registerElement 例外之后，普通行处理之前
    if (skipMode === false && trimmed.includes('t.') && trimmed.includes('draw')) {
      // 可能是 t.draw(ctx) 调用
      // 检查之前是否有 registerElement handle（简单启发式）
      const hasHandle = result.some(r => r.includes('_t =') || r.includes('const _t'));
      if (hasHandle) {
        result.push(line.replace(/\bt\./g, '_t.'));
        continue;
      }
    }

    result.push(line);
  }

  return result.join('\n');
};
