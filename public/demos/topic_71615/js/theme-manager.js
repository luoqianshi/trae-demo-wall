/* ==========================================
   主题管理器 - 四套皮肤切换 + 动态背景 + 滤镜
   ========================================== */

const ThemeManager = (() => {
  let currentTheme = 'ancient';
  let currentBg = 'auto';
  let currentEmotion = null;
  let particles = [];
  let animationFrameId = null;

  // 粒子动画状态
  let particleCanvas = null;
  let particleCtx = null;
  let particleW = 0;
  let particleH = 0;
  let lastFrameTime = 0;
  let lastResizeTime = 0;
  let boundResizeHandler = null;

  // 帧率限制
  const TARGET_FPS = 30;
  const FRAME_INTERVAL = 1000 / TARGET_FPS;

  // 减少动画模式
  let reducedMotion = false;

  // 页面可见性状态
  let isPageVisible = true;

  const THEME_CONFIG = {
    ancient: {
      name: '古风',
      particleType: 'inkWash'
    },
    campus: {
      name: '校园',
      particleType: 'cloud'
    },
    cyber: {
      name: '赛博',
      particleType: 'techLine'
    },
    republic: {
      name: '民国',
      particleType: 'fiberDust'
    }
  };

  /**
   * 切换主题
   */
  function switchTheme(theme) {
    if (theme === currentTheme) return;
    currentTheme = theme;

    // 更新 data-theme 属性
    document.documentElement.setAttribute('data-theme', theme);

    // 切换闪光效果
    const flash = document.createElement('div');
    flash.className = 'theme-flash';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 600);

    // 更新按钮状态
    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === theme);
    });

    // 重启粒子效果
    startParticles();

    // 通知
    showToast(`已切换至「${THEME_CONFIG[theme].name}」主题`, 'success');
  }

  /**
   * 设置动态背景
   */
  function setBackground(bgType, emotion) {
    const bgEl = document.getElementById('dynamic-bg');

    // 移除所有背景类
    bgEl.className = 'dynamic-bg';

    if (bgType === 'auto' && emotion) {
      const bgMap = {
        sweet: 'bg-cherry',
        angsty: 'bg-rain',
        passionate: 'bg-sunset',
        suspense: 'bg-stars'
      };
      if (bgMap[emotion]) {
        bgEl.classList.add(bgMap[emotion]);
      }
    } else if (bgType !== 'auto') {
      bgEl.classList.add(`bg-${bgType}`);
    }

    currentBg = bgType;
  }

  /**
   * 更新滤镜效果
   */
  function updateFilter(warmth, vignette, brightness) {
    const overlay = document.getElementById('filter-overlay');

    const warmAlpha = warmth / 100 * 0.12;

    const vigStart = Math.max(30, 70 - vignette * 0.4);
    const vigAlpha = (vignette / 100 * 0.6).toFixed(2);

    overlay.style.background = `
      linear-gradient(rgba(255, 180, 100, ${warmAlpha}), rgba(255, 180, 100, ${warmAlpha})),
      radial-gradient(ellipse at center, transparent ${vigStart}%, rgba(0,0,0,${vigAlpha}) 100%)
    `;
    overlay.style.mixBlendMode = 'normal';

    document.body.style.filter = `brightness(${brightness / 100})`;
  }

  /**
   * 新增：应用滤镜预设（供 app.js 情绪变化时调用）
   * @param {Object} preset - { warmth, vignette, brightness }
   */
  function applyFilterPreset(preset) {
    if (!preset) return;
    const { warmth = 50, vignette = 0, brightness = 100 } = preset;

    // 更新滤镜视觉效果
    updateFilter(warmth, vignette, brightness);

    // 同步更新三个滑块的值（如果滑块存在）
    const warmSlider = document.getElementById('filter-warmth');
    const vigSlider = document.getElementById('filter-vignette');
    const brightSlider = document.getElementById('filter-brightness');

    if (warmSlider) warmSlider.value = warmth;
    if (vigSlider) vigSlider.value = vignette;
    if (brightSlider) brightSlider.value = brightness;
  }

  /**
   * 新增：设置减少动画模式
   * @param {boolean} enabled - 是否启用减少动画
   */
  function setReducedMotion(enabled) {
    reducedMotion = !!enabled;

    const panels = document.querySelectorAll('.panel');
    panels.forEach(panel => {
      if (reducedMotion) {
        // 保存原始 backdrop-filter 以便恢复
        if (!panel._originalBackdrop) {
          panel._originalBackdrop = panel.style.backdropFilter || '';
        }
        // 移除 backdrop-filter，用纯色半透明背景替代
        panel.style.backdropFilter = 'none';
        panel.style.webkitBackdropFilter = 'none';
        panel.style.backgroundColor = 'rgba(255, 255, 255, 0.85)';
      } else {
        // 恢复原始值
        panel.style.backdropFilter = panel._originalBackdrop || '';
        panel.style.webkitBackdropFilter = panel._originalBackdrop || '';
        panel.style.backgroundColor = '';
        delete panel._originalBackdrop;
      }
    });

    // 减少动画模式下暂停粒子动画
    if (reducedMotion && animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    } else if (!reducedMotion && currentTheme && !animationFrameId && isPageVisible) {
      // 恢复粒子动画
      animateParticles();
    }
  }

  /**
   * 根据屏幕面积动态计算粒子数量
   */
  function calculateParticleCount(w, h) {
    const area = w * h;
    const count = Math.floor(area / 100000);
    return Math.min(Math.max(count, 1), 60);
  }

  /**
   * 启动主题粒子效果
   */
  function startParticles() {
    // 清除现有动画
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    particles = [];

    const container = document.getElementById('dynamic-bg');

    // 移除旧的粒子canvas
    const oldCanvas = container.querySelector('canvas');
    if (oldCanvas) oldCanvas.remove();

    // 移除旧的 resize 监听器
    if (boundResizeHandler) {
      window.removeEventListener('resize', boundResizeHandler);
      boundResizeHandler = null;
    }

    const config = THEME_CONFIG[currentTheme];
    if (!config) return;

    // 减少动画模式下不启动粒子
    if (reducedMotion) return;

    // 创建 canvas，优化 context
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;';
    container.appendChild(canvas);

    particleCanvas = canvas;
    particleCtx = canvas.getContext('2d', {
      willReadFrequently: false,
      alpha: true
    });

    particleW = canvas.width = window.innerWidth;
    particleH = canvas.height = window.innerHeight;

    // 生成粒子（根据屏幕面积动态计算数量）
    const count = calculateParticleCount(particleW, particleH);
    for (let i = 0; i < count; i++) {
      particles.push(createParticle(config, particleW, particleH));
    }

    // debounce resize（200ms）
    lastResizeTime = 0;
    boundResizeHandler = function () {
      const now = Date.now();
      lastResizeTime = now;
      setTimeout(() => {
        // 只有在 debounce 期间没有新 resize 时才执行
        if (lastResizeTime === now) {
          particleW = canvas.width = window.innerWidth;
          particleH = canvas.height = window.innerHeight;

          // 重新计算粒子数量
          const newCount = calculateParticleCount(particleW, particleH);
          if (newCount > particles.length) {
            const diff = newCount - particles.length;
            for (let i = 0; i < diff; i++) {
              particles.push(createParticle(config, particleW, particleH));
            }
          } else if (newCount < particles.length) {
            particles.length = newCount;
          }
        }
      }, 200);
    };
    window.addEventListener('resize', boundResizeHandler);

    lastFrameTime = performance.now();

    // 监听页面可见性
    if (!document._themeVisibilityHandler) {
      document._themeVisibilityHandler = handleVisibilityChange;
      document.addEventListener('visibilitychange', document._themeVisibilityHandler);
    }

    // 页面可见时才启动动画
    if (isPageVisible) {
      animateParticles();
    }
  }

  /**
   * 处理页面可见性变化
   */
  function handleVisibilityChange() {
    if (document.hidden) {
      // 页面不可见，暂停动画
      isPageVisible = false;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    } else {
      // 页面可见，恢复动画
      isPageVisible = true;
      if (!reducedMotion && !animationFrameId && particleCanvas) {
        lastFrameTime = performance.now();
        animateParticles();
      }
    }
  }

  /**
   * 粒子动画循环（帧率限制版）
   */
  function animateParticles() {
    if (!particleCtx || !particleCanvas) return;

    animationFrameId = requestAnimationFrame(function (now) {
      // 帧率控制：跳帧
      const elapsed = now - lastFrameTime;
      if (elapsed >= FRAME_INTERVAL) {
        lastFrameTime = now - (elapsed % FRAME_INTERVAL);

        const config = THEME_CONFIG[currentTheme];
        particleCtx.clearRect(0, 0, particleW, particleH);

        // 批量绘制
        batchDrawParticles(particleCtx, particles, config);
      }

      // 继续循环
      animateParticles();
    });
  }

  /* ==========================================
     粒子绘制 - 各主题独立逻辑
     ========================================== */

  /**
   * 生成随机贝塞尔控制点（水墨不规则形状辅助）
   */
  function generateInkBlobPoints(count) {
    const pts = [];
    for (let i = 0; i < count; i++) {
      pts.push({
        cpR: 0.4 + Math.random() * 0.6,
        cpAngle: Math.random() * Math.PI * 2,
        endR: 0.5 + Math.random() * 0.5,
        endAngle: Math.random() * Math.PI * 2
      });
    }
    return pts;
  }

  function createParticle(config, w, h) {
    switch (config.particleType) {
      case 'inkWash':
        return {
          x: Math.random() * w,
          y: Math.random() * h - h,
          size: 4 + Math.random() * 8,
          speedY: 0.2 + Math.random() * 0.4,
          swayPhase: Math.random() * Math.PI * 2,
          swaySpeed: 0.005 + Math.random() * 0.01,
          swayAmp: 15 + Math.random() * 25,
          // 颜色随机深浅
          colorMix: Math.random(),
          opacity: 0.08 + Math.random() * 0.12,
          // 不规则形状：贝塞尔控制点（生成一次）
          blobPoints: generateInkBlobPoints(5 + Math.floor(Math.random() * 3)),
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (-0.002 + Math.random() * 0.004) * (Math.random() > 0.5 ? 1 : -1)
        };

      case 'cloud':
        return {
          x: w + Math.random() * 100,
          y: Math.random() * h,
          size: 20 + Math.random() * 20,
          speedX: -(0.15 + Math.random() * 0.25),
          floatPhase: Math.random() * Math.PI * 2,
          floatSpeed: 0.003 + Math.random() * 0.005,
          floatAmp: 5 + Math.random() * 10,
          colorMix: Math.random(),
          opacity: 0.08 + Math.random() * 0.12,
          // 云朵的子圆偏移（生成一次）
          puffs: [
            { dx: 0, dy: 0, r: 0.5 },
            { dx: -0.35, dy: -0.1, r: 0.4 },
            { dx: 0.35, dy: -0.05, r: 0.42 },
            { dx: -0.15, dy: -0.25, r: 0.35 },
            { dx: 0.2, dy: -0.22, r: 0.33 },
            { dx: 0.5, dy: 0.05, r: 0.3 }
          ]
        };

      case 'techLine':
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          length: 30 + Math.random() * 50,
          speed: 0.8 + Math.random() * 1.5,
          direction: Math.random() > 0.4 ? 'down' : 'right',
          // 科技线条：由若干段直线+转角组成
          segments: generateTechSegments(3 + Math.floor(Math.random() * 3)),
          colorType: Math.random() > 0.5 ? 'cyan' : 'magenta',
          opacity: 0.15 + Math.random() * 0.2,
          progress: Math.random() // 动画进度
        };

      case 'fiberDust':
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          size: 1 + Math.random() * 2,
          shape: Math.random() > 0.4 ? 'rect' : 'circle',
          colorMix: Math.random(),
          opacity: 0.08 + Math.random() * 0.12,
          // 布朗运动
          vx: (-0.15 + Math.random() * 0.3),
          vy: (-0.15 + Math.random() * 0.3),
          // 随机翻动角度（矩形用）
          angle: Math.random() * Math.PI,
          angleSpeed: (-0.01 + Math.random() * 0.02)
        };

      default:
        return { x: 0, y: 0, size: 1, speedX: 0, speedY: 0, opacity: 0.3 };
    }
  }

  /**
   * 生成科技线条的段落数据（直线+转角）
   */
  function generateTechSegments(count) {
    const segs = [];
    let cumAngle = 0;
    for (let i = 0; i < count; i++) {
      const len = 8 + Math.random() * 15;
      segs.push({
        angle: cumAngle,
        length: len
      });
      // 在转角处随机偏转
      cumAngle += (Math.random() > 0.5 ? 1 : -1) * (Math.PI / 6 + Math.random() * Math.PI / 3);
    }
    return segs;
  }

  /**
   * 批量绘制粒子
   */
  function batchDrawParticles(ctx, particlesArr, config) {
    const w = particleW;
    const h = particleH;
    const type = config.particleType;

    // 先统一更新位置
    for (let i = 0; i < particlesArr.length; i++) {
      updateParticle(particlesArr[i], config, w, h);
    }

    // 按类型绘制
    switch (type) {
      case 'inkWash':
        drawInkWash(ctx, particlesArr);
        break;

      case 'cloud':
        drawClouds(ctx, particlesArr);
        break;

      case 'techLine':
        drawTechLines(ctx, particlesArr);
        break;

      case 'fiberDust':
        drawFiberDust(ctx, particlesArr);
        break;
    }

    // 重置 globalAlpha
    ctx.globalAlpha = 1;
  }

  /**
   * 古风 - 水墨飘落：用贝塞尔曲线绘制不规则墨点/墨迹
   */
  function drawInkWash(ctx, arr) {
    for (let i = 0; i < arr.length; i++) {
      const p = arr[i];

      // 颜色插值：深墨 -> 浅灰
      const r = Math.round(60 + p.colorMix * 60);
      const g = Math.round(40 + p.colorMix * 60);
      const b = Math.round(20 + p.colorMix * 60);
      const a = 0.15 - p.colorMix * 0.07;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = p.opacity;

      // 绘制不规则墨迹形状
      ctx.beginPath();
      const pts = p.blobPoints;
      const startPt = pts[0];
      const startX = Math.cos(startPt.endAngle) * startPt.endR * p.size;
      const startY = Math.sin(startPt.endAngle) * startPt.endR * p.size;
      ctx.moveTo(startX, startY);

      for (let j = 0; j < pts.length; j++) {
        const next = pts[(j + 1) % pts.length];
        const cpX = Math.cos(pts[j].cpAngle) * pts[j].cpR * p.size;
        const cpY = Math.sin(pts[j].cpAngle) * pts[j].cpR * p.size;
        const endX = Math.cos(next.endAngle) * next.endR * p.size;
        const endY = Math.sin(next.endAngle) * next.endR * p.size;
        ctx.quadraticCurveTo(cpX, cpY, endX, endY);
      }

      ctx.closePath();

      // 墨迹晕染效果：中心深边缘浅
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size);
      grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${a})`);
      grad.addColorStop(0.6, `rgba(${r}, ${g}, ${b}, ${a * 0.5})`);
      grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.restore();
    }
  }

  /**
   * 校园 - 云朵微动：多个重叠圆形组成柔和云朵
   */
  function drawClouds(ctx, arr) {
    for (let i = 0; i < arr.length; i++) {
      const p = arr[i];

      // 颜色插值：白色 -> 浅蓝白
      const r = 255 - Math.round(p.colorMix * 55);
      const g = 255 - Math.round(p.colorMix * 35);
      const b = 255 - Math.round(p.colorMix * 15);

      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;

      // 用多个重叠圆形绘制云朵
      const puffs = p.puffs;
      for (let j = 0; j < puffs.length; j++) {
        const pf = puffs[j];
        const cx = p.x + pf.dx * p.size;
        const cy = p.y + pf.dy * p.size;
        const radius = pf.r * p.size;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  /**
   * 赛博 - 科技线条：直线+转角的电路线，带发光效果
   */
  function drawTechLines(ctx, arr) {
    for (let i = 0; i < arr.length; i++) {
      const p = arr[i];

      const isCyan = p.colorType === 'cyan';
      const r = isCyan ? 0 : 255;
      const g = isCyan ? 240 : 0;
      const b = isCyan ? 255 : 128;

      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // 绘制线条路径
      ctx.beginPath();
      let curX = p.x;
      let curY = p.y;
      ctx.moveTo(curX, curY);

      for (let j = 0; j < p.segments.length; j++) {
        const seg = p.segments[j];
        const endX = curX + Math.cos(seg.angle) * seg.length;
        const endY = curY + Math.sin(seg.angle) * seg.length;
        ctx.lineTo(endX, endY);
        curX = endX;
        curY = endY;
      }

      // 发光层（宽线、低透明度）
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.3)`;
      ctx.lineWidth = 4;
      ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.6)`;
      ctx.shadowBlur = 8;
      ctx.stroke();

      // 核心线条层
      ctx.shadowBlur = 0;
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.7)`;
      ctx.lineWidth = 1;
      ctx.stroke();

      // 在转角处绘制小节点圆点
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.5)`;
      curX = p.x;
      curY = p.y;
      for (let j = 0; j < p.segments.length; j++) {
        const seg = p.segments[j];
        const endX = curX + Math.cos(seg.angle) * seg.length;
        const endY = curY + Math.sin(seg.angle) * seg.length;
        ctx.beginPath();
        ctx.arc(endX, endY, 1.5, 0, Math.PI * 2);
        ctx.fill();
        curX = endX;
        curY = endY;
      }

      ctx.restore();
    }
  }

  /**
   * 民国 - 旧报纸灰尘：细小矩形+圆形混合，布朗运动风格
   */
  function drawFiberDust(ctx, arr) {
    for (let i = 0; i < arr.length; i++) {
      const p = arr[i];

      // 颜色插值：淡黄棕 -> 浅灰
      const r = Math.round(160 + p.colorMix * 20);
      const g = Math.round(130 + p.colorMix * 40);
      const b = Math.round(80 + p.colorMix * 70);

      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;

      if (p.shape === 'rect') {
        // 纤维：细长矩形
        ctx.fillRect(-p.size * 1.5, -p.size * 0.3, p.size * 3, p.size * 0.6);
      } else {
        // 灰尘颗粒：小圆形
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  function updateParticle(p, config, w, h) {
    switch (config.particleType) {
      case 'inkWash':
        // 缓慢飘落 + 正弦水平摆动
        p.swayPhase += p.swaySpeed;
        p.x += Math.sin(p.swayPhase) * 0.5;
        p.y += p.speedY;
        p.rotation += p.rotSpeed;
        // 超出屏幕底部后重置到顶部
        if (p.y > h + p.size * 2) {
          p.y = -p.size * 2;
          p.x = Math.random() * w;
          p.swayPhase = Math.random() * Math.PI * 2;
        }
        break;

      case 'cloud':
        // 从右向左缓慢漂移 + 正弦上下浮动
        p.floatPhase += p.floatSpeed;
        p.x += p.speedX;
        p.y += Math.sin(p.floatPhase) * 0.3;
        // 超出左边界后重置到右边
        if (p.x < -p.size * 2) {
          p.x = w + p.size + Math.random() * 100;
          p.y = Math.random() * h;
          p.floatPhase = Math.random() * Math.PI * 2;
        }
        break;

      case 'techLine':
        // 流动 + 到达边界重置
        if (p.direction === 'down') {
          p.y += p.speed;
          if (p.y > h + p.length) {
            p.y = -p.length;
            p.x = Math.random() * w;
          }
        } else {
          p.x += p.speed;
          if (p.x > w + p.length) {
            p.x = -p.length;
            p.y = Math.random() * h;
          }
        }
        break;

      case 'fiberDust':
        // 布朗运动：随机微小加速
        p.vx += (-0.03 + Math.random() * 0.06);
        p.vy += (-0.03 + Math.random() * 0.06);
        // 速度衰减
        p.vx *= 0.98;
        p.vy *= 0.98;
        // 限速
        p.vx = Math.max(-0.5, Math.min(0.5, p.vx));
        p.vy = Math.max(-0.5, Math.min(0.5, p.vy));
        p.x += p.vx;
        p.y += p.vy;
        p.angle += p.angleSpeed;
        // 边界环绕
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;
        break;
    }
  }

  /**
   * 更新情绪对应的背景
   */
  function setEmotion(emotion) {
    currentEmotion = emotion;
    if (currentBg === 'auto') {
      setBackground('auto', emotion);
    }
  }

  return {
    switchTheme,
    setBackground,
    updateFilter,
    applyFilterPreset,
    setReducedMotion,
    setEmotion,
    startParticles,
    getCurrentTheme: () => currentTheme,
    THEME_CONFIG
  };
})();
