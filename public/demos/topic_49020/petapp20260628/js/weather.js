/* weather.js — 天气系统（全局单例 Weather） */
/* 在人物面板背景显示手绘涂鸦风格天气：晴/多云/雨/雪/夜晚 */
/* 粒子分前后两层：部分在小人后(z-index:1)，部分在小人前(z-index:15)，营造层次感 */

const Weather = {
  el: null,            // 天气背景容器
  layerBack: null,     // 后景粒子层（小人物后）
  layerFront: null,    // 前景粒子层（小人物前）
  current: 'sunny',
  types: ['sunny', 'cloudy', 'rainy', 'snowy', 'night'],
  labels: {
    sunny: '☀️ 晴天', cloudy: '☁️ 多云', rainy: '🌧️ 下雨',
    snowy: '❄️ 下雪', night: '🌙 夜晚'
  },
  particleTimer: null,

  init() {
    this.el = document.getElementById('weather-layer');
    if (!this.el) return;
    this.layerBack = document.getElementById('weather-particles-back');
    this.layerFront = document.getElementById('weather-particles-front');
    this.set('sunny');
  },

  /** 设置天气 */
  set(type) {
    if (!this.types.includes(type)) return;
    this.current = type;
    this.el.className = 'weather-layer ' + type;
    this.el.innerHTML = this._buildScene(type);
    this._stopParticles();
    if (type === 'rainy') this._startRain();
    else if (type === 'snowy') this._startSnow();
    this._updateStatus();
  },

  /** 循环切换天气 */
  cycle() {
    const idx = this.types.indexOf(this.current);
    const next = this.types[(idx + 1) % this.types.length];
    this.set(next);
  },

  _updateStatus() {
    const statusEl = document.getElementById('weather-status');
    if (statusEl) statusEl.textContent = this.labels[this.current];
  },

  /** 随机选前/后层（约 40% 前景，60% 后景） */
  _pickLayer() {
    return Math.random() < 0.4 ? this.layerFront : this.layerBack;
  },

  /** 构建天气场景 SVG（手绘涂鸦风，带闪烁/飘移动画） */
  _buildScene(type) {
    if (type === 'sunny') {
      return `
        <svg class="weather-scene" viewBox="0 0 360 200" preserveAspectRatio="xMidYMid meet">
          <g filter="url(#sketchy)">
            <g class="w-sun-rays">
              <g stroke="#e0a830" stroke-width="2.5" stroke-linecap="round" fill="none">
                <line x1="290" y1="10" x2="290" y2="2"/>
                <line x1="290" y1="98" x2="290" y2="90"/>
                <line x1="250" y1="50" x2="242" y2="50"/>
                <line x1="338" y1="50" x2="330" y2="50"/>
                <line x1="262" y1="22" x2="256" y2="16"/>
                <line x1="318" y1="78" x2="324" y2="84"/>
                <line x1="262" y1="78" x2="256" y2="84"/>
                <line x1="318" y1="22" x2="324" y2="16"/>
              </g>
            </g>
            <circle class="w-sun" cx="290" cy="50" r="26" fill="#ffd96b" stroke="#333" stroke-width="2.5"/>
            <path d="M 0 180 Q 90 165 180 172 Q 270 178 360 168 L 360 200 L 0 200 Z" fill="#c8e6a0" stroke="#333" stroke-width="2" opacity="0.7"/>
          </g>
        </svg>`;
    }
    if (type === 'cloudy') {
      return `
        <svg class="weather-scene" viewBox="0 0 360 200" preserveAspectRatio="xMidYMid meet">
          <g filter="url(#sketchy)">
            <circle class="w-sun" cx="60" cy="45" r="20" fill="#ffd96b" stroke="#333" stroke-width="2" opacity="0.6"/>
            <g fill="#fff" stroke="#333" stroke-width="2.5" stroke-linejoin="round">
              <path class="w-cloud c1" d="M 180 60 Q 165 35 190 32 Q 200 18 220 28 Q 240 20 248 38 Q 268 42 258 62 Q 250 72 230 68 L 195 70 Q 175 70 180 60 Z"/>
              <path class="w-cloud c2" d="M 80 90 Q 70 72 88 70 Q 95 58 110 65 Q 125 60 130 75 Q 145 78 138 92 Q 132 100 118 97 L 92 98 Q 78 98 80 90 Z" opacity="0.85"/>
              <path class="w-cloud c3" d="M 250 110 Q 242 96 256 94 Q 262 84 274 90 Q 286 86 290 98 Q 300 100 295 112 Q 290 120 278 118 L 258 118 Q 248 118 250 110 Z" opacity="0.7"/>
            </g>
            <path d="M 0 180 Q 90 165 180 172 Q 270 178 360 168 L 360 200 L 0 200 Z" fill="#b8d690" stroke="#333" stroke-width="2" opacity="0.7"/>
          </g>
        </svg>`;
    }
    if (type === 'rainy') {
      return `
        <svg class="weather-scene" viewBox="0 0 360 200" preserveAspectRatio="xMidYMid meet">
          <g filter="url(#sketchy)">
            <g fill="#9ab4c9" stroke="#333" stroke-width="2.5" stroke-linejoin="round">
              <path class="w-cloud c1" d="M 120 50 Q 105 25 130 22 Q 140 8 160 18 Q 180 10 188 28 Q 208 32 198 52 Q 190 62 170 58 L 135 60 Q 115 60 120 50 Z"/>
              <path class="w-cloud c2" d="M 220 70 Q 210 52 228 50 Q 235 38 250 45 Q 265 40 270 55 Q 285 58 278 72 Q 272 80 258 77 L 232 78 Q 218 78 220 70 Z" opacity="0.8"/>
            </g>
            <path d="M 0 180 Q 90 170 180 175 Q 270 180 360 172 L 360 200 L 0 200 Z" fill="#8fa68b" stroke="#333" stroke-width="2" opacity="0.7"/>
          </g>
        </svg>`;
    }
    if (type === 'snowy') {
      return `
        <svg class="weather-scene" viewBox="0 0 360 200" preserveAspectRatio="xMidYMid meet">
          <g filter="url(#sketchy)">
            <g fill="#e8eef5" stroke="#333" stroke-width="2.5" stroke-linejoin="round">
              <path class="w-cloud c1" d="M 130 48 Q 115 23 140 20 Q 150 6 170 16 Q 190 8 198 26 Q 218 30 208 50 Q 200 60 180 56 L 145 58 Q 125 58 130 48 Z"/>
            </g>
            <g fill="#fff" stroke="#333" stroke-width="1.5">
              <circle cx="100" cy="120" r="4"/>
              <circle cx="260" cy="100" r="3.5"/>
              <circle cx="200" cy="140" r="5"/>
              <circle cx="300" cy="130" r="3"/>
            </g>
            <path d="M 0 180 Q 90 165 180 172 Q 270 178 360 168 L 360 200 L 0 200 Z" fill="#e8eef5" stroke="#333" stroke-width="2" opacity="0.85"/>
          </g>
        </svg>`;
    }
    if (type === 'night') {
      return `
        <svg class="weather-scene" viewBox="0 0 360 200" preserveAspectRatio="xMidYMid meet">
          <g filter="url(#sketchy)">
            <path class="w-moon" d="M 270 40 Q 250 35 248 55 Q 246 75 268 80 Q 290 82 295 62 Q 300 42 280 38 Q 275 38 270 40 Z" fill="#f5e6a8" stroke="#333" stroke-width="2.5"/>
            <g fill="#fff" stroke="#333" stroke-width="1">
              <circle class="w-star s1" cx="50" cy="40" r="2.5"/>
              <circle class="w-star s2" cx="120" cy="30" r="2"/>
              <circle class="w-star s3" cx="180" cy="55" r="2.5"/>
              <circle class="w-star s4" cx="90" cy="70" r="1.8"/>
              <circle class="w-star s5" cx="220" cy="25" r="2"/>
              <circle class="w-star s6" cx="320" cy="60" r="2.5"/>
            </g>
            <path d="M 0 180 Q 90 165 180 172 Q 270 178 360 168 L 360 200 L 0 200 Z" fill="#3a4a5a" stroke="#333" stroke-width="2" opacity="0.8"/>
          </g>
        </svg>`;
    }
    return '';
  },

  /** 生成 SVG 雪花形状（6瓣对称） */
  _makeSnowflakeSVG(size) {
    const s = size;
    const half = s / 2;
    // 6 条主轴 + 分叉，手绘风格
    let arms = '';
    for (let i = 0; i < 6; i++) {
      const angle = (i * 60);
      arms += `<g transform="rotate(${angle} ${half} ${half})">
        <line x1="${half}" y1="${half}" x2="${half}" y2="2" stroke="#fff" stroke-width="${s * 0.06}" stroke-linecap="round"/>
        <line x1="${half}" y1="${s * 0.3}" x2="${s * 0.32}" y2="${s * 0.18}" stroke="#fff" stroke-width="${s * 0.05}" stroke-linecap="round"/>
        <line x1="${half}" y1="${s * 0.3}" x2="${s * 0.68}" y2="${s * 0.18}" stroke="#fff" stroke-width="${s * 0.05}" stroke-linecap="round"/>
        <line x1="${half}" y1="${s * 0.15}" x2="${s * 0.4}" y2="${s * 0.07}" stroke="#fff" stroke-width="${s * 0.04}" stroke-linecap="round"/>
        <line x1="${half}" y1="${s * 0.15}" x2="${s * 0.6}" y2="${s * 0.07}" stroke="#fff" stroke-width="${s * 0.04}" stroke-linecap="round"/>
      </g>`;
    }
    return `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">${arms}<circle cx="${half}" cy="${half}" r="${s * 0.08}" fill="#fff"/></svg>`;
  },

  // ===== 雨滴粒子（带风吹倾斜+随机性+前后分层）=====
  _startRain() {
    if (!this.layerBack && !this.layerFront) return;
    if (this.layerBack) this.layerBack.innerHTML = '';
    if (this.layerFront) this.layerFront.innerHTML = '';
    this.particleTimer = setInterval(() => {
      if (this.current !== 'rainy') return;
      const drop = document.createElement('div');
      drop.className = 'rain-drop';
      // 随机起始位置
      drop.style.left = (Math.random() * 110 - 5) + '%';
      // 随机下落速度
      const dur = 0.45 + Math.random() * 0.4;
      drop.style.animationDuration = dur + 's';
      // 随机透明度
      drop.style.opacity = 0.35 + Math.random() * 0.45;
      // 随机长度
      drop.style.height = (12 + Math.random() * 8) + 'px';
      // 随机风偏移（每滴水平位移不同，模拟阵风）
      const windX = -60 - Math.random() * 50;
      drop.style.setProperty('--wind-x', windX + 'px');
      // 随机倾斜角度
      const tilt = 14 + Math.random() * 10;
      drop.style.setProperty('--tilt', tilt + 'deg');
      // 随机分前后层
      const layer = this._pickLayer();
      if (layer) layer.appendChild(drop);
      setTimeout(() => drop.remove(), dur * 1000 + 100);
    }, 25);
  },

  // ===== 雪花粒子（SVG 雪花形状+飘落+水平摆动+前后分层）=====
  _startSnow() {
    if (!this.layerBack && !this.layerFront) return;
    if (this.layerBack) this.layerBack.innerHTML = '';
    if (this.layerFront) this.layerFront.innerHTML = '';
    this.particleTimer = setInterval(() => {
      if (this.current !== 'snowy') return;
      const flake = document.createElement('div');
      flake.className = 'snow-flake';
      // 随机起始位置
      flake.style.left = (Math.random() * 110 - 5) + '%';
      // 随机大小
      const size = 10 + Math.random() * 16;
      flake.innerHTML = this._makeSnowflakeSVG(size);
      // 随机下落速度
      const dur = 3 + Math.random() * 4;
      flake.style.animationDuration = dur + 's';
      // 随机透明度
      flake.style.opacity = 0.5 + Math.random() * 0.5;
      // 随机水平摆动幅度（模拟风）
      const sway1 = -8 - Math.random() * 12;
      const sway2 = 6 + Math.random() * 14;
      flake.style.setProperty('--sway1', sway1 + 'px');
      flake.style.setProperty('--sway2', sway2 + 'px');
      // 随机分前后层
      const layer = this._pickLayer();
      if (layer) layer.appendChild(flake);
      setTimeout(() => flake.remove(), dur * 1000 + 200);
    }, 90);
  },

  _stopParticles() {
    if (this.particleTimer) {
      clearInterval(this.particleTimer);
      this.particleTimer = null;
    }
    if (this.layerBack) this.layerBack.innerHTML = '';
    if (this.layerFront) this.layerFront.innerHTML = '';
  }
};
