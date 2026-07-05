/* ============================================
   鸢韵潍风 - 通用工具
   ============================================ */

const WF = {
  /* 数字滚动动画（easeOut） */
  animateNumber(el, target, opts = {}) {
    const duration = opts.duration || 1800;
    const decimals = opts.decimals || 0;
    const prefix = opts.prefix || '';
    const suffix = opts.suffix || '';
    const start = 0;
    const startTime = performance.now();

    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      const current = start + (target - start) * eased;
      el.textContent = prefix + WF.formatNum(current, decimals) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = prefix + WF.formatNum(target, decimals) + suffix;
    };
    requestAnimationFrame(tick);
  },

  /* 数字格式化（千分位） */
  formatNum(num, decimals = 0) {
    const fixed = Number(num).toFixed(decimals);
    const parts = fixed.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  },

  /* Toast 提示 */
  toast(msg, type = 'success') {
    let wrap = document.querySelector('.cn-toast-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'cn-toast-wrap';
      document.body.appendChild(wrap);
    }
    const t = document.createElement('div');
    t.className = 'cn-toast';
    const icon = type === 'success' ? '✓' : (type === 'warn' ? '!' : 'i');
    t.innerHTML = `<span class="toast-icon">${icon}</span><span>${msg}</span>`;
    wrap.appendChild(t);
    setTimeout(() => {
      t.classList.add('out');
      setTimeout(() => t.remove(), 400);
    }, 2600);
  },

  /* 顶部时钟 */
  startClock(el) {
    const update = () => {
      const d = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const week = ['日','一','二','三','四','五','六'][d.getDay()];
      el.textContent = `${d.getFullYear()}.${pad(d.getMonth()+1)}.${pad(d.getDate())} 周${week}  ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    };
    update();
    setInterval(update, 1000);
  },

  /* 国风 SVG 纹样占位图（基于类别生成不同图案） */
  patternSvg(seed, palette, w = 400, h = 300) {
    const colors = palette && palette.length ? palette : ['#C8392F', '#C9A14A', '#2E8B7A'];
    const rng = WF.seedRandom(seed);
    const bg = '#F5EFE0';
    let elements = '';

    // 背景纹
    elements += `<rect width="${w}" height="${h}" fill="${bg}"/>`;
    // 边框
    elements += `<rect x="8" y="8" width="${w-16}" height="${h-16}" fill="none" stroke="${colors[0]}" stroke-width="2" opacity="0.4"/>`;
    elements += `<rect x="14" y="14" width="${w-28}" height="${h-28}" fill="none" stroke="${colors[1] || colors[0]}" stroke-width="1" stroke-dasharray="4 4" opacity="0.5"/>`;

    // 中央对称团花
    const cx = w / 2, cy = h / 2;
    const petals = 8 + Math.floor(rng() * 4);
    for (let i = 0; i < petals; i++) {
      const angle = (i / petals) * Math.PI * 2;
      const r = 50 + rng() * 40;
      const px = cx + Math.cos(angle) * r;
      const py = cy + Math.sin(angle) * r;
      const color = colors[i % colors.length];
      elements += `<circle cx="${px}" cy="${py}" r="${12 + rng()*10}" fill="${color}" opacity="${0.55 + rng()*0.4}"/>`;
    }
    // 中央圆
    elements += `<circle cx="${cx}" cy="${cy}" r="22" fill="${colors[0]}" opacity="0.85"/>`;
    elements += `<circle cx="${cx}" cy="${cy}" r="14" fill="${bg}" opacity="0.9"/>`;
    elements += `<circle cx="${cx}" cy="${cy}" r="8" fill="${colors[1] || colors[0]}" opacity="0.9"/>`;

    // 角花
    const corners = [[20,20],[w-20,20],[20,h-20],[w-20,h-20]];
    corners.forEach(([x, y]) => {
      const c = colors[Math.floor(rng() * colors.length)];
      elements += `<path d="M ${x} ${y} L ${x + (x<w/2?20:-20)} ${y} L ${x} ${y + (y<h/2?20:-20)} Z" fill="${c}" opacity="0.7"/>`;
      elements += `<circle cx="${x}" cy="${y}" r="4" fill="${colors[1] || c}" opacity="0.9"/>`;
    });

    // 散点云纹
    for (let i = 0; i < 6; i++) {
      const x = 40 + rng() * (w - 80);
      const y = 40 + rng() * (h - 80);
      const c = colors[Math.floor(rng() * colors.length)];
      elements += `<path d="M ${x} ${y} q 8 -10 18 0 q 10 8 0 14 q -8 6 -14 -2 q -8 -6 -4 -12 z" fill="${c}" opacity="0.25"/>`;
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${elements}</svg>`;
  },

  /* 展品/纹样图片（使用真实图片 + 国风装饰边框） */
  illustrationSvg(type, w = 400, h = 400) {
    const palette = ['#C8392F','#C9A14A','#2E8B7A','#1A1208','#FFF6E6','#2A2520','#8B2500','#E8B33A','#2E6BB5','#4A90C8'];
    const bg = '#F5EFE0';
    // 图片映射表
    const imgMap = {
      kite: 'assets/images/kite.png',
      claytiger: 'assets/images/claytiger.png',
      newyearpic: 'assets/images/newyearpic.webp',
      paper: 'assets/images/paper.webp',
      silk: 'assets/images/silk.png',
      guqin: 'assets/images/guqin.png'
    };
    const imgPath = imgMap[type];
    // 如果有真实图片，使用图片 + 精美装饰边框
    if (imgPath) {
      let s = '';
      s += `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`;
      s += `<defs>
        <linearGradient id="frameGrad-${type}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#E8B33A"/>
          <stop offset="50%" stop-color="#C9A14A"/>
          <stop offset="100%" stop-color="#8B6F1F"/>
        </linearGradient>
        <linearGradient id="innerShadow-${type}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="rgba(0,0,0,0.15)"/>
          <stop offset="30%" stop-color="rgba(0,0,0,0)"/>
          <stop offset="100%" stop-color="rgba(0,0,0,0.1)"/>
        </linearGradient>
        <clipPath id="imgClip-${type}">
          <rect x="14" y="14" width="${w-28}" height="${h-28}" rx="6"/>
        </clipPath>
      </defs>`;
      // 背景
      s += `<rect width="${w}" height="${h}" fill="${bg}"/>`;
      // 外层金边框
      s += `<rect x="6" y="6" width="${w-12}" height="${h-12}" rx="8" fill="none" stroke="url(#frameGrad-${type})" stroke-width="3"/>`;
      // 内层红细线
      s += `<rect x="11" y="11" width="${w-22}" height="${h-22}" rx="5" fill="none" stroke="${palette[0]}" stroke-width="1" opacity="0.5"/>`;
      // 图片（带圆角裁剪）
      s += `<image href="${imgPath}" x="14" y="14" width="${w-28}" height="${h-28}" clip-path="url(#imgClip-${type})" preserveAspectRatio="xMidYMid slice"/>`;
      // 内阴影增加立体感
      s += `<rect x="14" y="14" width="${w-28}" height="${h-28}" rx="6" fill="url(#innerShadow-${type})" pointer-events="none"/>`;
      // 四角回纹装饰
      const cs = 18;
      [[14,14,0],[w-14,14,90],[w-14,h-14,180],[14,h-14,270]].forEach(([cx,cy,rot]) => {
        s += `<g transform="translate(${cx},${cy}) rotate(${rot})"><path d="M 0 0 L ${cs} 0 L ${cs} ${cs/2} L ${cs/3} ${cs/2} L ${cs/3} ${cs} L 0 ${cs} Z" fill="none" stroke="url(#frameGrad-${type})" stroke-width="1.5" opacity="0.85"/></g>`;
      });
      // 底部装饰条
      s += `<rect x="14" y="${h-22}" width="${w-28}" height="8" fill="url(#frameGrad-${type})" opacity="0.3"/>`;
      s += `</svg>`;
      return s;
    }
    // 后备：保留原 SVG 插画（已简化）
    let s = '';
    s += `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`;
    s += `<rect width="${w}" height="${h}" fill="${bg}"/>`;
    s += `<rect x="8" y="8" width="${w-16}" height="${h-16}" fill="none" stroke="${palette[1]}" stroke-width="2.5" opacity="0.7"/>`;
    const cx = w/2, cy = h/2;
    s += `<g transform="translate(${cx},${cy})">`;
    for (let i = 0; i < 8; i++) {
      s += `<g transform="rotate(${i*45})"><path d="M 0 -80 Q -15 -60 -8 -50 Q 0 -58 8 -50 Q 15 -60 0 -80" fill="${palette[i%2?1:0]}" opacity="0.7"/></g>`;
    }
    s += `<circle cx="0" cy="0" r="20" fill="${palette[1]}"/>`;
    s += `<circle cx="0" cy="0" r="12" fill="${palette[0]}"/>`;
    s += `</g>`;
    s += `</svg>`;
    return s;
  },

  /* 头像占位（首字 + 渐变背景） */
  avatarSvg(text, color1 = '#C8392F', color2 = '#C9A14A') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${color1}"/><stop offset="100%" stop-color="${color2}"/>
      </linearGradient></defs>
      <rect width="120" height="120" rx="60" fill="url(#g)"/>
      <circle cx="60" cy="60" r="54" fill="none" stroke="#FFF6E6" stroke-width="2" opacity="0.5"/>
      <text x="60" y="78" font-size="48" fill="#FFF6E6" text-anchor="middle" font-family="serif" font-weight="700">${text}</text>
    </svg>`;
  },

  /* 种子随机数 */
  seedRandom(seed) {
    let s = 0;
    for (let i = 0; i < String(seed).length; i++) s = (s * 31 + String(seed).charCodeAt(i)) >>> 0;
    return function() {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  },

  /* 防抖 */
  debounce(fn, wait = 200) {
    let t;
    return function(...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }
};

window.WF = WF;
