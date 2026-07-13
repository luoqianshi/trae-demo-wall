/**
 * BWT Demo - 动画工具库
 * 提供可复用的动画函数，用于数据可视化、滚动揭示和交互效果。
 * 无外部依赖，纯原生 JavaScript 实现。
 *
 * @module animations
 */

/**
 * easeOutQuart 缓动函数
 * 适用于数字递增动画，起步快、末尾慢
 *
 * @param {number} t - 进度值 [0, 1]
 * @returns {number} 缓动后的值
 */
function easeOutQuart(t) {
  return 1 - Math.pow(1 - t, 4);
}

/**
 * easeInOutCubic 缓动函数
 * 适用于进度条/环形进度动画，起止平滑
 *
 * @param {number} t - 进度值 [0, 1]
 * @returns {number} 缓动后的值
 */
function easeInOutCubic(t) {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * 创建并注入一次性 CSS @keyframes 动画规则
 *
 * @param {string} name - 动画名称
 * @param {string} keyframes - keyframes 内容
 * @returns {string} 完整的 CSS 规则文本
 */
function injectKeyframes(name, keyframes) {
  const styleId = `bwt-kf-${name}`;
  if (document.getElementById(styleId)) return styleId;

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `@keyframes ${name} { ${keyframes} }`;
  document.head.appendChild(style);
  return styleId;
}

/**
 * 动画计数器 - 从 0 递增到目标值
 * 支持整数和一位小数，可添加前缀/后缀
 *
 * @param {HTMLElement} element - 目标 DOM 元素
 * @param {number} targetValue - 目标数值
 * @param {number} [duration=1200] - 动画持续时间（毫秒）
 * @param {string} [prefix=''] - 数值前缀（如 "¥"）
 * @param {string} [suffix=''] - 数值后缀（如 "%"）
 * @returns {Function} 清理函数，调用后立即停止动画
 *
 * @example
 * // 基本用法
 * counterAnimation(document.getElementById('price'), 1280, 1200, '¥', '');
 *
 * @example
 * // 一位小数
 * counterAnimation(document.getElementById('rate'), 95.8, 1500, '', '%');
 */
function counterAnimation(element, targetValue, duration = 1200, prefix = '', suffix = '') {
  let animationId = null;
  let cancelled = false;
  const startTime = performance.now();
  const isFloat = !Number.isInteger(targetValue);

  function step(currentTime) {
    if (cancelled) return;

    const elapsed = currentTime - startTime;
    const rawProgress = Math.min(elapsed / duration, 1);
    const easedProgress = easeOutQuart(rawProgress);
    const currentValue = easedProgress * targetValue;

    if (isFloat) {
      element.textContent = prefix + currentValue.toFixed(1) + suffix;
    } else {
      element.textContent = prefix + Math.round(currentValue) + suffix;
    }

    if (rawProgress < 1) {
      animationId = requestAnimationFrame(step);
    }
  }

  animationId = requestAnimationFrame(step);

  return function cleanup() {
    cancelled = true;
    if (animationId !== null) {
      cancelAnimationFrame(animationId);
    }
  };
}

/**
 * 交错揭示动画 - 依次显示一组元素
 * 基于 IntersectionObserver，元素进入视口时触发动画
 *
 * @param {string} selector - CSS 选择器
 * @param {number} [delay=150] - 每个元素之间的延迟（毫秒）
 * @param {HTMLElement|null} [parent=null] - 可选的观察父元素（为 null 时观察每个元素自身）
 * @returns {Function} 清理函数，断开 Observer 并重置元素状态
 *
 * @example
 * // 揭示所有 .card 元素
 * staggerReveal('.card', 200);
 *
 * @example
 * // 当 .card-container 进入视口时揭示内部卡片
 * staggerReveal('.card-item', 100, document.querySelector('.card-container'));
 */
function staggerReveal(selector, delay = 150, parent = null) {
  const elements = document.querySelectorAll(selector);
  if (elements.length === 0) return function noop() {};

  // 设置初始状态
  elements.forEach(function (el) {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    el.style.willChange = 'opacity, transform';
  });

  const observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;

        // 观察的是父元素：揭示所有子元素
        if (parent && entry.target === parent) {
          elements.forEach(function (el, index) {
            setTimeout(function () {
              el.style.opacity = '1';
              el.style.transform = 'translateY(0)';
            }, index * delay);
          });
          observer.unobserve(parent);
          return;
        }

        // 观察的是各个元素自身
        const target = entry.target;
        const index = Array.prototype.indexOf.call(elements, target);
        setTimeout(function () {
          target.style.opacity = '1';
          target.style.transform = 'translateY(0)';
        }, index * delay);
        observer.unobserve(target);
      });
    },
    { threshold: 0.1 }
  );

  if (parent) {
    observer.observe(parent);
  } else {
    elements.forEach(function (el) {
      observer.observe(el);
    });
  }

  return function cleanup() {
    observer.disconnect();
    elements.forEach(function (el) {
      el.style.opacity = '';
      el.style.transform = '';
      el.style.transition = '';
      el.style.willChange = '';
    });
  };
}

/**
 * 环形进度动画 - SVG 圆环从 0 填充到目标百分比
 * 动画期间添加发光滤镜效果
 *
 * @param {SVGElement} svgElement - 包含 circle 的 SVG 元素
 * @param {number} percent - 目标百分比（0-100）
 * @param {number} [duration=1500] - 动画持续时间（毫秒）
 * @param {string} [color='#00D4AA'] - 进度条颜色
 * @returns {Function} 清理函数，停止动画并移除滤镜
 *
 * @example
 * // 85% 进度环
 * ringProgress(document.querySelector('.progress-ring'), 85, 1500, '#00D4AA');
 */
function ringProgress(svgElement, percent, duration = 1500, color = '#00D4AA') {
  let animationId = null;
  let cancelled = false;
  const startTime = performance.now();

  const circle = svgElement.querySelector('circle');
  if (!circle) return function noop() {};

  // 获取半径并计算周长
  const radius = parseFloat(circle.getAttribute('r')) || 45;
  const circumference = 2 * Math.PI * radius;

  // 初始化圆环
  circle.style.fill = 'none';
  circle.style.stroke = color;
  circle.style.strokeWidth = '8';
  circle.style.strokeLinecap = 'round';
  circle.style.strokeDasharray = circumference;
  circle.style.strokeDashoffset = String(circumference);
  circle.style.transformOrigin = 'center';
  circle.style.transform = 'rotate(-90deg)';

  // 注入发光滤镜
  const filterId = `bwt-glow-${Date.now()}`;
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  defs.innerHTML =
    '<filter id="' +
    filterId +
    '" x="-50%" y="-50%" width="200%" height="200%">' +
    '<feGaussianBlur stdDeviation="3" result="blur"/>' +
    '<feFlood flood-color="' +
    color +
    '" flood-opacity="0.4" result="color"/>' +
    '<feComposite in="color" in2="blur" operator="in" result="glow"/>' +
    '<feMerge>' +
    '<feMergeNode in="glow"/>' +
    '<feMergeNode in="SourceGraphic"/>' +
    '</feMerge>' +
    '</filter>';
  svgElement.insertBefore(defs, svgElement.firstChild);
  circle.style.filter = 'url(#' + filterId + ')';

  const targetOffset = circumference - (percent / 100) * circumference;

  function step(currentTime) {
    if (cancelled) return;

    const elapsed = currentTime - startTime;
    const rawProgress = Math.min(elapsed / duration, 1);
    const easedProgress = easeInOutCubic(rawProgress);
    const currentOffset = circumference - easedProgress * (circumference - targetOffset);

    circle.style.strokeDashoffset = String(currentOffset);

    if (rawProgress < 1) {
      animationId = requestAnimationFrame(step);
    } else {
      // 动画结束后移除发光
      setTimeout(function () {
        if (!cancelled) {
          circle.style.filter = 'none';
        }
      }, 300);
    }
  }

  animationId = requestAnimationFrame(step);

  return function cleanup() {
    cancelled = true;
    if (animationId !== null) {
      cancelAnimationFrame(animationId);
    }
    circle.style.filter = 'none';
    const defsNode = svgElement.querySelector('defs');
    if (defsNode) svgElement.removeChild(defsNode);
  };
}

/**
 * 脉冲动画 - 持续呼吸式 box-shadow 发光效果
 * 通过注入 CSS keyframes 实现，返回清理函数以移除动画
 *
 * @param {HTMLElement} element - 目标 DOM 元素
 * @param {number} [intensity=1] - 强度系数（1 为默认，控制扩散范围 10-30px）
 * @param {string} [color='#00D4AA'] - 发光颜色
 * @returns {Function} 清理函数，移除动画样式和注入的 keyframes
 *
 * @example
 * const cleanup = pulseAnimation(card, 1.5, '#FF6B6B');
 * // 稍后停止动画
 * cleanup();
 */
function pulseAnimation(element, intensity = 1, color = '#00D4AA') {
  const name = 'bwt-pulse-' + Date.now();
  const minSpread = 10 * intensity;
  const maxSpread = 30 * intensity;
  const opacity = Math.min(0.6 * intensity, 0.8);

  injectKeyframes(
    name,
    '0%, 100% { box-shadow: 0 0 ' +
      minSpread +
      'px 0 ' +
      color +
      Math.round(opacity * 40).toString(16).padStart(2, '0') +
      '; }' +
      '50% { box-shadow: 0 0 ' +
      maxSpread +
      'px 0 ' +
      color +
      Math.round(opacity * 255).toString(16).padStart(2, '0') +
      '; }'
  );

  element.style.animation = name + ' 2s ease-in-out infinite';

  return function cleanup() {
    element.style.animation = '';
    const styleNode = document.getElementById('bwt-kf-' + name);
    if (styleNode) styleNode.remove();
  };
}

/**
 * 半圆仪表盘动画 - SVG 路径弧形从左到右填充
 * 根据百分比自动着色：绿色(>70)、黄色(40-70)、红色(<40)
 *
 * @param {SVGElement} svgElement - 包含路径弧线的 SVG 元素
 * @param {number} percent - 目标百分比（0-100）
 * @param {number} [duration=1800] - 动画持续时间（毫秒）
 * @param {string} [color='#00D4AA'] - 默认颜色（实际颜色由百分比决定）
 * @returns {Function} 清理函数，停止动画
 *
 * @example
 * gaugeAnimation(document.querySelector('.gauge'), 62, 1800);
 */
function gaugeAnimation(svgElement, percent, duration = 1800, color = '#00D4AA') {
  let animationId = null;
  let cancelled = false;
  const startTime = performance.now();

  // 根据百分比决定颜色
  let activeColor = color;
  if (percent > 70) {
    activeColor = '#00D4AA'; // 绿色 - 优秀
  } else if (percent >= 40) {
    activeColor = '#FFB800'; // 黄色 - 一般
  } else {
    activeColor = '#FF4757'; // 红色 - 警告
  }

  // 查找路径元素
  const path = svgElement.querySelector('path, circle');
  if (!path) return function noop() {};

  // 尝试获取路径长度
  let totalLength;
  try {
    totalLength = path.getTotalLength();
  } catch (_) {
    // 如果 getTotalLength 不可用，从属性计算
    if (path.tagName.toLowerCase() === 'circle') {
      const r = parseFloat(path.getAttribute('r')) || 45;
      // 半圆弧长 = PI * r
      totalLength = Math.PI * r;
    } else {
      totalLength = 283; // 常见半圆仪表盘默认长度
    }
  }

  // 初始化路径样式
  path.style.fill = 'none';
  path.style.stroke = activeColor;
  path.style.strokeWidth = '10';
  path.style.strokeLinecap = 'round';
  path.style.strokeDasharray = String(totalLength);
  path.style.strokeDashoffset = String(totalLength);

  const targetOffset = totalLength - (percent / 100) * totalLength;

  function step(currentTime) {
    if (cancelled) return;

    const elapsed = currentTime - startTime;
    const rawProgress = Math.min(elapsed / duration, 1);
    const easedProgress = easeInOutCubic(rawProgress);
    const currentOffset = totalLength - easedProgress * (totalLength - targetOffset);

    path.style.strokeDashoffset = String(currentOffset);

    if (rawProgress < 1) {
      animationId = requestAnimationFrame(step);
    }
  }

  animationId = requestAnimationFrame(step);

  return function cleanup() {
    cancelled = true;
    if (animationId !== null) {
      cancelAnimationFrame(animationId);
    }
  };
}

/**
 * 初始化滚动揭示 - 为所有 .bwt-fade-up 元素添加进入视口时的淡入上滑效果
 * 页面加载时调用一次即可
 *
 * @returns {Function} 清理函数，断开 Observer 并移除样式
 *
 * @example
 * // 页面初始化
 * document.addEventListener('DOMContentLoaded', function () {
 *   initScrollReveal();
 * });
 */
function initScrollReveal() {
  const fadeEls = document.querySelectorAll('.bwt-fade-up');
  const sectionEls = document.querySelectorAll('.bwt-section-reveal');
  if (fadeEls.length === 0 && sectionEls.length === 0) return function noop() {};

  // 设置 fade-up 初始状态
  fadeEls.forEach(function (el) {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
    el.style.willChange = 'opacity, transform';
  });

  // 设置 section-reveal 初始状态
  sectionEls.forEach(function (el) {
    el.style.opacity = '0';
    el.style.transform = 'translateY(40px)';
    el.style.transition = 'opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1), transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)';
    el.style.willChange = 'opacity, transform';
  });

  var allElements = Array.from(fadeEls).concat(Array.from(sectionEls));

  const observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;

        entry.target.classList.add('revealed');
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';

        // 动画完成后清除 will-change 以释放 GPU 资源
        setTimeout(function () {
          entry.target.style.willChange = 'auto';
        }, 800);

        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.1 }
  );

  allElements.forEach(function (el) {
    observer.observe(el);
  });

  return function cleanup() {
    observer.disconnect();
    allElements.forEach(function (el) {
      el.classList.remove('revealed');
      el.style.opacity = '';
      el.style.transform = '';
      el.style.transition = '';
      el.style.willChange = '';
    });
  };
}

// ---------------------------------------------------------------------------
// 全局挂载：同时支持 ES Module 导入和 window 全局访问
// ---------------------------------------------------------------------------
const BWTAnimations = {
  counterAnimation,
  staggerReveal,
  ringProgress,
  pulseAnimation,
  gaugeAnimation,
  initScrollReveal,
};

if (typeof window !== 'undefined') {
  window.BWTAnimations = BWTAnimations;
}
