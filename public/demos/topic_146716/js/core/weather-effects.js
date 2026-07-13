// 天气特效系统 v5 - 修复版
// 关键修复：
// 1. 禁用雾影响 (fog: false) - 避免 Fog/FogExp2 不兼容问题
// 2. 增大粒子尺寸和透明度
// 3. 添加详细调试日志
// 4. 确保材质正确设置

const WeatherEffects = {
  scene: null,
  camera: null,
  time: 0,
  weatherType: 'clear',
  initialized: false,

  // 风场参数
  wind: {
    baseDirX: 1, baseDirZ: 0,
    baseStrength: 3.0,
    gustStrength: 5.0,
    gustFreq: 0.4,
    gustPhase: 0
  },

  // 雨滴系统
  rain: { mesh: null, count: 2000, activeCount: 2000, speed: 40, visible: false },
  // 雨滴水花溅射系统
  splashes: { mesh: null, count: 300, visible: false },
  // 雪花系统
  snow: { mesh: null, count: 1500, speed: 2.5, visible: false },
  // 沙尘暴系统
  sandstorm: { mesh: null, count: 3000, speed: 25, visible: false },
  // 地面涟漪
  ripples: { mesh: null, count: 200, visible: false },

  // ============ 初始化 ============
  init: function(scene, camera) {
    console.log('[WeatherEffects] init() called, scene:', !!scene, 'camera:', !!camera);
    
    if (!scene) {
      console.error('[WeatherEffects] ERROR: scene is null!');
      return;
    }
    
    this.scene = scene;
    this.camera = camera;
    
    try {
      this._createRain();
      this._createSplashes();
      this._createSnow();
      this._createSandstorm();
      this._createRipples();
      this.initialized = true;
      console.log('[WeatherEffects] Initialization completed successfully');
    } catch (e) {
      console.error('[WeatherEffects] Initialization failed:', e);
    }
  },

  syncCamera: function(cam) {
    console.log('[WeatherEffects] syncCamera() called');
    this.camera = cam;
  },

  // ============ 设置天气 ============
  setWeather: function(type) {
    console.log('[WeatherEffects] setWeather() called with type:', type);
    
    if (!this.initialized) {
      console.warn('[WeatherEffects] Not initialized yet!');
      return;
    }
    
    this.weatherType = type;
    this.rain.visible = (type === 'rain' || type === 'storm');
    this.snow.visible = (type === 'snow');
    this.splashes.visible = (type === 'rain' || type === 'storm');
    this.ripples.visible = (type === 'rain' || type === 'storm');

    if (this.rain.mesh) {
      this.rain.mesh.visible = this.rain.visible;
      console.log('[WeatherEffects] Rain mesh visible:', this.rain.mesh.visible);
    }
    if (this.snow.mesh) {
      this.snow.mesh.visible = this.snow.visible;
      console.log('[WeatherEffects] Snow mesh visible:', this.snow.mesh.visible);
    }
    if (this.splashes.mesh) this.splashes.mesh.visible = this.splashes.visible;
    if (this.ripples.mesh) this.ripples.mesh.visible = this.ripples.visible;

    this.sandstorm.visible = (type === 'sandstorm');
    if (this.sandstorm.mesh) {
      this.sandstorm.mesh.visible = this.sandstorm.visible;
    }
    if (type === 'sandstorm') {
      this.wind.baseStrength = 12.0;
      this.wind.gustStrength = 20.0;
    }

    if (type === 'storm') {
      this.rain.activeCount = this.rain.count;
      this.wind.baseStrength = 6.0;
      this.wind.gustStrength = 10.0;
      this.rain.speed = 50;
    } else if (type === 'rain') {
      this.rain.activeCount = Math.floor(this.rain.count * 0.6);
      this.wind.baseStrength = 3.0;
      this.wind.gustStrength = 5.0;
      this.rain.speed = 40;
    } else if (type === 'snow') {
      this.wind.baseStrength = 1.5;
      this.wind.gustStrength = 3.0;
    } else {
      this.wind.baseStrength = 0;
      this.wind.gustStrength = 0;
    }
  },

  // ============ 每帧更新 ============
  update: function(dt) {
    if (!this.initialized) return;
    
    this.time += dt;
    this.wind.gustPhase += dt * this.wind.gustFreq;

    if (this.rain.visible) this._updateRain(dt);
    if (this.splashes.visible) this._updateSplashes(dt);
    if (this.snow.visible) this._updateSnow(dt);
    if (this.ripples.visible) this._updateRipples(dt);
    if (this.sandstorm.visible) this._updateSandstorm(dt);
  },

  // ============ 风场计算 ============
  _getWind: function(x, z) {
    const t = this.wind.gustPhase;
    const n1 = Math.sin(x * 0.05 + t * 1.7) * Math.cos(z * 0.07 + t * 1.3);
    const n2 = Math.sin(x * 0.12 + z * 0.08 + t * 2.1) * 0.5;
    const gust = (n1 + n2) * this.wind.gustStrength;
    const total = this.wind.baseStrength + gust;
    return { x: this.wind.baseDirX * total, z: this.wind.baseDirZ * total };
  },

  _camPos: function() {
    if (this.camera && this.camera.position) return this.camera.position;
    return { x: 0, y: 5, z: 0 };
  },

  // ============ 创建雨滴纹理 ============
  _createRainTexture: function() {
    const size = 64;
    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    const ctx = c.getContext('2d');
    const cx = size / 2, cy = size / 2;

    // 清除背景（透明）
    ctx.clearRect(0, 0, size, size);

    // 绘制水滴形状
    ctx.save();
    ctx.translate(cx, cy);

    // 水滴主体 - 使用径向渐变
    const grad = ctx.createRadialGradient(0, -4, 2, 0, 0, 24);
    grad.addColorStop(0, 'rgba(230,240,255,1)');
    grad.addColorStop(0.4, 'rgba(180,210,245,0.95)');
    grad.addColorStop(0.7, 'rgba(140,180,230,0.8)');
    grad.addColorStop(1, 'rgba(100,150,210,0)');
    ctx.fillStyle = grad;

    ctx.beginPath();
    ctx.moveTo(0, -24);
    ctx.bezierCurveTo(10, -16, 12, 4, 0, 20);
    ctx.bezierCurveTo(-12, 4, -10, -16, 0, -24);
    ctx.fill();

    // 中心高光
    const highlight = ctx.createRadialGradient(-2, -6, 0, -2, -6, 8);
    highlight.addColorStop(0, 'rgba(255,255,255,1)');
    highlight.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = highlight;
    ctx.beginPath();
    ctx.arc(-2, -6, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    
    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
  },

  // ============ 创建雨滴系统 ============
  _createRain: function() {
    console.log('[WeatherEffects] Creating rain system...');
    
    const count = this.rain.count;
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      this._resetRainDrop(positions, velocities, i, true);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('velocity', new THREE.BufferAttribute(velocities, 1));

    const tex = this._createRainTexture();
    
    // 关键修复：
    // 1. fog: false - 禁用雾影响，避免 Fog/FogExp2 不兼容
    // 2. 增大 size 到 8.0
    // 3. 提高 opacity 到 1.0
    const mat = new THREE.PointsMaterial({
      color: 0xaaccff,
      size: 0.1,
      sizeAttenuation: true,
      map: tex,
      transparent: true,
      opacity: 1.0,
      depthWrite: false,
      blending: THREE.NormalBlending,
      fog: false  // 关键：禁用雾影响
    });

    this.rain.mesh = new THREE.Points(geo, mat);
    this.rain.mesh.visible = false;
    this.rain.mesh.frustumCulled = false;
    this.rain.mesh.renderOrder = 1000;
    this.rain.mesh.name = 'rainMesh';
    
    if (this.scene) {
      this.scene.add(this.rain.mesh);
      console.log('[WeatherEffects] Rain mesh added to scene');
    } else {
      console.error('[WeatherEffects] Cannot add rain mesh: scene is null');
    }
  },

  _resetRainDrop: function(pos, vel, i, randomY) {
    const cam = this._camPos();
    const spread = 50;
    const x = cam.x + (Math.random() - 0.5) * spread;
    const z = cam.z + (Math.random() - 0.5) * spread;
    const topY = 30 + Math.random() * 10;

    const idx = i * 3;
    pos[idx]     = x;
    pos[idx + 1] = randomY ? (Math.random() * (topY + 10)) : topY;
    pos[idx + 2] = z;

    vel[i] = this.rain.speed * (0.8 + Math.random() * 0.4);
  },

  _updateRain: function(dt) {
    const mesh = this.rain.mesh;
    if (!mesh) return;
    
    const pos = mesh.geometry.attributes.position.array;
    const vel = mesh.geometry.attributes.velocity.array;
    const active = this.rain.activeCount;
    const cam = this._camPos();

    for (let i = 0; i < active; i++) {
      const idx = i * 3;
      
      // 检查是否需要完全重置（太远或异常位置）
      const dx = pos[idx] - cam.x;
      const dz = pos[idx + 2] - cam.z;
      const distSq = dx * dx + dz * dz;
      
      // 如果离相机太远或位置异常（y过高或为负数但未触发落地），完全重置
      if (distSq > 2500 || pos[idx + 1] > 50 || pos[idx + 1] < -5) {
        pos[idx] = cam.x + (Math.random() - 0.5) * 50;
        pos[idx + 1] = 30 + Math.random() * 10;
        pos[idx + 2] = cam.z + (Math.random() - 0.5) * 50;
        continue;  // 跳过本次更新
      }

      const w = this._getWind(pos[idx], pos[idx + 2]);

      // 下落
      pos[idx + 1] -= vel[i] * dt;

      // 风吹
      pos[idx]     += w.x * dt;
      pos[idx + 2] += w.z * dt * 0.3;

      // 落地 → 生成水花溅射
      if (pos[idx + 1] < 0.1) {
        this._spawnSplash(pos[idx], 0.1, pos[idx + 2]);
        // 重置到顶部
        pos[idx + 1] = 30 + Math.random() * 10;
        pos[idx] = cam.x + (Math.random() - 0.5) * 50;
        pos[idx + 2] = cam.z + (Math.random() - 0.5) * 50;
      }
    }
    
    mesh.geometry.attributes.position.needsUpdate = true;
  },

  // ============ 创建水花溅射纹理 ============
  _createSplashTexture: function() {
    const size = 64;
    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    const ctx = c.getContext('2d');
    const cx = size / 2, cy = size / 2;

    ctx.clearRect(0, 0, size, size);

    // 放射状水花线条
    ctx.strokeStyle = 'rgba(200,230,255,1)';
    ctx.lineCap = 'round';
    for (let a = 0; a < 12; a++) {
      const angle = (a / 12) * Math.PI * 2;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * 22, cy + Math.sin(angle) * 22);
      ctx.stroke();
    }

    // 中心亮点
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 14);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.5, 'rgba(220,240,255,0.8)');
    grad.addColorStop(1, 'rgba(180,210,245,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.fill();

    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
  },

  // ============ 创建水花溅射系统 ============
  _createSplashes: function() {
    console.log('[WeatherEffects] Creating splash system...');
    
    const count = this.splashes.count;
    const positions = new Float32Array(count * 3);
    const lifetimes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 1] = -100;
      lifetimes[i] = 1;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('lifetime', new THREE.BufferAttribute(lifetimes, 1));

    const tex = this._createSplashTexture();
    const mat = new THREE.PointsMaterial({
      color: 0xeef8ff,
      size: 0.05,
      sizeAttenuation: true,
      map: tex,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      blending: THREE.NormalBlending,
      fog: false  // 禁用雾影响
    });

    this.splashes.mesh = new THREE.Points(geo, mat);
    this.splashes.mesh.visible = false;
    this.splashes.mesh.frustumCulled = false;
    this.splashes.mesh.renderOrder = 999;
    this.splashes.mesh.name = 'splashMesh';
    
    if (this.scene) {
      this.scene.add(this.splashes.mesh);
      console.log('[WeatherEffects] Splash mesh added to scene');
    }
  },

  _spawnSplash: function(x, y, z) {
    const mesh = this.splashes.mesh;
    if (!mesh) return;
    
    const pos = mesh.geometry.attributes.position.array;
    const life = mesh.geometry.attributes.lifetime.array;
    const count = this.splashes.count;

    // 找一个已结束的溅射重用
    for (let i = 0; i < count; i++) {
      if (life[i] >= 1) {
        pos[i * 3]     = x;
        pos[i * 3 + 1] = y;
        pos[i * 3 + 2] = z;
        life[i] = 0;
        break;
      }
    }
  },

  _updateSplashes: function(dt) {
    const mesh = this.splashes.mesh;
    if (!mesh) return;
    
    const pos = mesh.geometry.attributes.position.array;
    const life = mesh.geometry.attributes.lifetime.array;
    const count = this.splashes.count;

    for (let i = 0; i < count; i++) {
      if (life[i] < 1) {
        life[i] += dt * 3;
        pos[i * 3 + 1] += dt * 2 * (1 - life[i]);
        if (life[i] > 1) {
          life[i] = 1;
          pos[i * 3 + 1] = -100;
        }
      }
    }
    
    mesh.geometry.attributes.position.needsUpdate = true;
    mesh.geometry.attributes.lifetime.needsUpdate = true;
  },

  // ============ 创建六角雪花纹理 ============
  _createSnowflakeTexture: function() {
    const size = 128;
    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    const ctx = c.getContext('2d');
    const cx = size / 2, cy = size / 2;

    ctx.clearRect(0, 0, size, size);

    // 外层光晕
    const outerGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.48);
    outerGlow.addColorStop(0, 'rgba(255,255,255,0.3)');
    outerGlow.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = outerGlow;
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.48, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,1)';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const armLen = size * 0.4;

    // 六条主臂
    for (let a = 0; a < 6; a++) {
      const angle = (a / 6) * Math.PI * 2 - Math.PI / 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      // 主臂
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + cos * armLen, cy + sin * armLen);
      ctx.stroke();

      // 分支1（距中心55%）
      const b1Dist = armLen * 0.55;
      const bx = cx + cos * b1Dist;
      const by = cy + sin * b1Dist;
      const bAngle1 = angle + Math.PI / 3;
      const bAngle2 = angle - Math.PI / 3;
      const b1Len = armLen * 0.4;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + Math.cos(bAngle1) * b1Len, by + Math.sin(bAngle1) * b1Len);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + Math.cos(bAngle2) * b1Len, by + Math.sin(bAngle2) * b1Len);
      ctx.stroke();

      // 分支2（距中心80%）
      const b2Dist = armLen * 0.80;
      const bx2 = cx + cos * b2Dist;
      const by2 = cy + sin * b2Dist;
      const b2Len = armLen * 0.28;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(bx2, by2);
      ctx.lineTo(bx2 + Math.cos(bAngle1) * b2Len, by2 + Math.sin(bAngle1) * b2Len);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(bx2, by2);
      ctx.lineTo(bx2 + Math.cos(bAngle2) * b2Len, by2 + Math.sin(bAngle2) * b2Len);
      ctx.stroke();
    }

    // 中心装饰
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let a = 0; a < 6; a++) {
      const angle = (a / 6) * Math.PI * 2 - Math.PI / 2;
      const px = cx + Math.cos(angle) * 10;
      const py = cy + Math.sin(angle) * 10;
      if (a === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();

    // 中心光晕
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 16);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0.5)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, 16, 0, Math.PI * 2);
    ctx.fill();

    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
  },

  // ============ 创建雪花系统 ============
  _createSnow: function() {
    console.log('[WeatherEffects] Creating snow system...');
    
    const count = this.snow.count;
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const phases = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      this._resetSnowFlake(positions, velocities, phases, i, true);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    geo.setAttribute('phase', new THREE.BufferAttribute(phases, 1));

    const tex = this._createSnowflakeTexture();
    const mat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.2,
      sizeAttenuation: true,
      map: tex,
      transparent: true,
      opacity: 1.0,
      depthWrite: false,
      blending: THREE.NormalBlending,
      fog: false  // 禁用雾影响
    });

    this.snow.mesh = new THREE.Points(geo, mat);
    this.snow.mesh.visible = false;
    this.snow.mesh.frustumCulled = false;
    this.snow.mesh.renderOrder = 1000;
    this.snow.mesh.name = 'snowMesh';
    
    if (this.scene) {
      this.scene.add(this.snow.mesh);
      console.log('[WeatherEffects] Snow mesh added to scene');
    } else {
      console.error('[WeatherEffects] Cannot add snow mesh: scene is null');
    }
  },

  _resetSnowFlake: function(pos, vel, phases, i, randomY) {
    const cam = this._camPos();
    const spread = 50;
    const x = cam.x + (Math.random() - 0.5) * spread;
    const z = cam.z + (Math.random() - 0.5) * spread;
    const topY = 25 + Math.random() * 10;

    const idx = i * 3;
    pos[idx]     = x;
    pos[idx + 1] = randomY ? (Math.random() * (topY + 10)) : topY;
    pos[idx + 2] = z;

    vel[idx]     = (Math.random() - 0.5) * 0.8;
    vel[idx + 1] = -(this.snow.speed * (0.6 + Math.random() * 0.8));
    vel[idx + 2] = (Math.random() - 0.5) * 0.8;

    if (phases) phases[i] = Math.random() * Math.PI * 2;
  },

  _updateSnow: function(dt) {
    const mesh = this.snow.mesh;
    if (!mesh) return;
    
    const pos = mesh.geometry.attributes.position.array;
    const vel = mesh.geometry.attributes.velocity.array;
    const phases = mesh.geometry.attributes.phase.array;
    const t = this.time;
    const count = this.snow.count;
    const cam = this._camPos();

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      const phase = phases[i];

      // 检查是否需要完全重置（太远或异常位置）
      const dx = pos[idx] - cam.x;
      const dz = pos[idx + 2] - cam.z;
      const distSq = dx * dx + dz * dz;
      
      // 如果离相机太远或位置异常，完全重置
      if (distSq > 2500 || pos[idx + 1] > 50 || pos[idx + 1] < -5) {
        pos[idx] = cam.x + (Math.random() - 0.5) * 50;
        pos[idx + 1] = 25 + Math.random() * 10;
        pos[idx + 2] = cam.z + (Math.random() - 0.5) * 50;
        continue;
      }

      // 基础飘落
      pos[idx]     += vel[idx] * dt;
      pos[idx + 1] += vel[idx + 1] * dt;
      pos[idx + 2] += vel[idx + 2] * dt;

      // 正弦飘荡
      const sway = Math.sin(t * 1.5 + phase) * 1.0;
      const sway2 = Math.cos(t * 1.2 + phase * 1.3) * 0.8;
      pos[idx]     += sway * dt;
      pos[idx + 2] += sway2 * dt;

      // 风场
      const w = this._getWind(pos[idx], pos[idx + 2]);
      pos[idx]     += w.x * dt * 0.2;
      pos[idx + 2] += w.z * dt * 0.2;

      // 落地重置
      if (pos[idx + 1] < 0) {
        pos[idx + 1] = 25 + Math.random() * 10;
        pos[idx] = cam.x + (Math.random() - 0.5) * 50;
        pos[idx + 2] = cam.z + (Math.random() - 0.5) * 50;
      }
    }
    
    mesh.geometry.attributes.position.needsUpdate = true;
  },

  // ============ 创建地面涟漪 ============
  _createRipples: function() {
    console.log('[WeatherEffects] Creating ripple system...');
    
    const count = this.ripples.count;
    const positions = new Float32Array(count * 3);
    const states = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = -10;
      positions[i * 3 + 2] = 0;
      states[i] = 1;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('state', new THREE.BufferAttribute(states, 1));

    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = 'rgba(180,210,240,0.9)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(32, 32, 26, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(200,230,255,0.6)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(32, 32, 18, 0, Math.PI * 2);
    ctx.stroke();
    const tex = new THREE.CanvasTexture(canvas);

    const mat = new THREE.PointsMaterial({
      color: 0xccddff,
      size: 0.04,
      map: tex,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      blending: THREE.NormalBlending,
      sizeAttenuation: true,
      fog: false  // 禁用雾影响
    });

    this.ripples.mesh = new THREE.Points(geo, mat);
    this.ripples.mesh.visible = false;
    this.ripples.mesh.frustumCulled = false;
    this.ripples.mesh.renderOrder = 998;
    this.ripples._timer = 0;
    
    if (this.scene) {
      this.scene.add(this.ripples.mesh);
      console.log('[WeatherEffects] Ripple mesh added to scene');
    }
  },

  _updateRipples: function(dt) {
    const mesh = this.ripples.mesh;
    if (!mesh) return;
    
    const pos = mesh.geometry.attributes.position.array;
    const states = mesh.geometry.attributes.state.array;
    const count = this.ripples.count;
    const cam = this._camPos();

    this.ripples._timer += dt;
    const interval = this.weatherType === 'storm' ? 0.03 : 0.06;
    
    while (this.ripples._timer > interval) {
      this.ripples._timer -= interval;
      for (let i = 0; i < count; i++) {
        if (states[i] >= 1) {
          pos[i * 3]     = cam.x + (Math.random() - 0.5) * 40;
          pos[i * 3 + 1] = 0.05;
          pos[i * 3 + 2] = cam.z + (Math.random() - 0.5) * 40;
          states[i] = 0;
          break;
        }
      }
    }

    for (let i = 0; i < count; i++) {
      if (states[i] < 1) {
        states[i] += dt * 1.5;
        if (states[i] > 1) states[i] = 1;
      }
    }

    mesh.geometry.attributes.position.needsUpdate = true;
    mesh.geometry.attributes.state.needsUpdate = true;
  },

  // ============ 分形闪电生成 ============
  generateLightning: function(startPos, endPos) {
    const points = [startPos.clone(), endPos.clone()];
    const detail = 5;
    const displacement = 3.0;

    for (let d = 0; d < detail; d++) {
      const newPoints = [];
      const scale = displacement * Math.pow(0.5, d);
      for (let j = 0; j < points.length - 1; j++) {
        const a = points[j];
        const b = points[j + 1];
        const mid = a.clone().add(b).multiplyScalar(0.5);
        mid.x += (Math.random() - 0.5) * scale;
        mid.y += (Math.random() - 0.5) * scale * 0.3;
        mid.z += (Math.random() - 0.5) * scale;
        newPoints.push(a, mid);
      }
      newPoints.push(points[points.length - 1]);
      points.length = 0;
      for (let k = 0; k < newPoints.length; k++) points.push(newPoints[k]);
    }
    return points;
  },

  createLightningBolt: function(targetPos) {
    if (!this.scene) return null;
    
    // 闪电从目标头顶上方开始，向下劈到目标
    const start = new THREE.Vector3(
      targetPos.x + (Math.random() - 0.5) * 2,
      targetPos.y + 15 + Math.random() * 5,  // 目标头顶15-20米处
      targetPos.z + (Math.random() - 0.5) * 2
    );
    const end = targetPos.clone().add(new THREE.Vector3(0, 1.5, 0));  // 劈到目标位置

    const mainPoints = this.generateLightning(start, end);
    const mainGeo = new THREE.BufferGeometry().setFromPoints(mainPoints);
    const mainMat = new THREE.LineBasicMaterial({
      color: 0xccddff,
      transparent: true,
      opacity: 1,
      fog: false
    });
    const mainLine = new THREE.Line(mainGeo, mainMat);
    this.scene.add(mainLine);

    const light = new THREE.PointLight(0xccddff, 10, 50);
    light.position.copy(end);
    this.scene.add(light);

    const branches = [];
    const branchCount = 2 + Math.floor(Math.random() * 3);
    for (let b = 0; b < branchCount; b++) {
      const t = 0.15 + Math.random() * 0.6;
      const bStart = new THREE.Vector3().lerpVectors(start, end, t);
      const bEnd = bStart.clone().add(new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        -3 - Math.random() * 6,
        (Math.random() - 0.5) * 10
      ));
      const bPoints = this.generateLightning(bStart, bEnd);
      const bGeo = new THREE.BufferGeometry().setFromPoints(bPoints);
      const bMat = new THREE.LineBasicMaterial({
        color: 0x8899bb,
        transparent: true,
        opacity: 0.5,
        fog: false
      });
      const bLine = new THREE.Line(bGeo, bMat);
      this.scene.add(bLine);
      branches.push({ line: bLine, geo: bGeo, mat: bMat });
    }

    return {
      line: mainLine,
      light: light,
      geo: mainGeo,
      mat: mainMat,
      branches: branches,
      age: 0,
      life: 0.35,
      alive: true,

      update: function(delta) {
        this.age += delta;
        if (this.age > this.life) {
          this.alive = false;
          this.line.visible = false;
          this.light.intensity = 0;
          return;
        }
        const flicker = Math.random() > 0.15 ? 1 : 0.2;
        this.mat.opacity = flicker;
        this.light.intensity = 10 * flicker * (1 - this.age / this.life);
      },

      cleanup: function(scene) {
        scene.remove(this.line);
        scene.remove(this.light);
        this.geo.dispose();
        this.mat.dispose();
        this.branches.forEach(b => {
          scene.remove(b.line);
          b.geo.dispose();
          b.mat.dispose();
        });
      }
    };
  },

  // ============ 创建沙尘暴粒子系统 ============
  _createSandstorm: function() {
    console.log('[WeatherEffects] Creating sandstorm system...');

    const count = this.sandstorm.count;
    const positions = new Float32Array(count * 3);
    const mapHalf = 80;
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * mapHalf * 2;
      positions[i * 3 + 1] = Math.random() * 15;
      positions[i * 3 + 2] = (Math.random() - 0.5) * mapHalf * 2;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xD4B06A,
      size: 0.3,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
      fog: false
    });
    this.sandstorm.mesh = new THREE.Points(geo, mat);
    this.sandstorm.mesh.visible = false;
    this.sandstorm.mesh.name = 'sandstormParticles';
    this.sandstorm.mesh.frustumCulled = false;
    this.sandstorm.mesh.renderOrder = 1000;
    if (this.scene) {
      this.scene.add(this.sandstorm.mesh);
      console.log('[WeatherEffects] Sandstorm mesh added to scene');
    }
  },

  // ============ 更新沙尘暴粒子 ============
  _updateSandstorm: function(dt) {
    if (!this.sandstorm.mesh) return;
    const pos = this.sandstorm.mesh.geometry.attributes.position;
    const arr = pos.array;
    const mapHalf = 80;
    const windX = this.wind.baseDirX * this.wind.baseStrength;
    const windZ = this.wind.baseDirZ * this.wind.baseStrength;
    for (let i = 0; i < this.sandstorm.count; i++) {
      arr[i * 3] += windX * dt + (Math.random() - 0.3) * 2;
      arr[i * 3 + 1] -= 0.5 * dt;
      arr[i * 3 + 2] += windZ * dt + (Math.random() - 0.5) * dt;
      if (arr[i * 3] > mapHalf) arr[i * 3] = -mapHalf;
      if (arr[i * 3] < -mapHalf) arr[i * 3] = mapHalf;
      if (arr[i * 3 + 1] < 0) arr[i * 3 + 1] = 10 + Math.random() * 5;
      if (arr[i * 3 + 2] > mapHalf) arr[i * 3 + 2] = -mapHalf;
      if (arr[i * 3 + 2] < -mapHalf) arr[i * 3 + 2] = mapHalf;
    }
    pos.needsUpdate = true;
  }
};

window.WeatherEffects = WeatherEffects;
