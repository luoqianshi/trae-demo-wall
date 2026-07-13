// 天气系统 - 动态环境影响战斗
// 版本: 1.0

const WeatherSystem = {
  // 当前天气状态
  currentWeather: 'clear',      // clear, rain, fog, storm, snow, bloodmoon
  lastWeather: 'clear',         // 上一次天气（防止连续相同）
  weatherTimer: 0,              // 天气持续时间计时器
  lightningTimer: 0,            // 落雷计时器
  
  // 视觉效果
  rainParticles: null,          // 雨滴粒子系统
  snowParticles: null,          // 雪花粒子系统
  fogMesh: null,                // 雾效果网格
  lightningLight: null,         // 闪电光源
  
  // 天气配置
  config: {
    // 解锁波次: 雨3、雾7、雷暴5、雪6、血月4
    unlockWaves: {
      rain: 3,
      fog: 7,
      storm: 5,
      snow: 6,
      bloodmoon: 4,
      sandstorm: 1
    },
    // 触发概率（自动归一化）
    probabilities: {
      clear: 0.18,
      rain: 0.12,
      fog: 0.12,
      storm: 0.12,
      snow: 0.12,
      bloodmoon: 0.17,
      sandstorm: 0.17
    },
    // 天气效果
    effects: {
      rain: {
        playerSpeed: 0.85,      // 玩家移速-15%
        enemySpeed: 0.85,       // 敌人移速-15%
        spreadMult: 1.3,        // 散布+30%
        fogDensity: 0.02,
        bgm: 'rain'
      },
      fog: {
        visibility: 0.3,        // 视野30%
        enemySpotting: 1.0,     // 敌人不受影响
        rangeMult: 1.0,         // 射程不受影响
        fogDensity: 0.15,
        bgm: 'fog'
      },
      storm: {
        playerSpeed: 0.9,       // 全体移速-10%
        enemySpeed: 0.9,
        fogDensity: 0.05,
        bgm: 'storm',
        lightningInterval: [5, 10]  // 落雷间隔5-10秒
      },
      snow: {
        playerSpeed: 0.7,       // 移速-30%
        enemySpeed: 0.7,
        explosionRange: 0.5,    // 爆炸范围-50%
        fogDensity: 0.03,
        bgm: 'snow'
      },
      bloodmoon: {
        enemyHealth: 1.2,       // 敌人全属性+20%
        enemySpeed: 1.2,
        enemyDamage: 1.2,
        xpMult: 1.5,            // 经验+50%
        fogDensity: 0.02,
        bgm: 'bloodmoon'
      },
      sandstorm: {
        playerSpeed: 0.8,
        enemySpeed: 0.6,
        spreadMult: 1.5,
        fogDensity: 0.08,
        bgm: 'sandstorm',
        visibility: 0.25
      },
      clear: {
        fogDensity: 0.005,
        bgm: 'normal'
      }
    }
  },
  
  // 初始化天气系统
  init: function(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    
    console.log('[Weather] Initializing with scene:', !!scene, 'camera:', !!camera);
    
    // 初始化新的天气特效系统（雨滴、雪花）
    if (window.WeatherEffects) {
      WeatherEffects.init(scene, camera);
    }
    
    // 创建闪电光源
    this.createLightningLight();
    
    // 注意：雾效由 game.js 初始化，这里不再覆盖
    // game.js 使用 THREE.Fog（线性雾），我们适配它
    
    console.log('[Weather] 天气系统初始化完成');
  },
  
  // 创建闪电光源
  createLightningLight: function() {
    this.lightningLight = new THREE.PointLight(0xffffff, 0, 100);
    this.lightningLight.visible = false;
    if (this.scene) this.scene.add(this.lightningLight);
  },
  
  // 根据波次决定天气
  changeWeatherForWave: function(wave) {
    const availableWeathers = this.getAvailableWeathers(wave);
    
    // 计算概率权重 - 使用配置中的概率
    let totalWeight = 0;
    const weights = {};
    
    for (const weather of availableWeathers) {
      // 使用配置中定义的概率
      weights[weather] = this.config.probabilities[weather] || 0.1;
      totalWeight += weights[weather];
    }
    
    // 归一化权重
    for (const weather of availableWeathers) {
      weights[weather] /= totalWeight;
    }
    
    // 随机选择
    let random = Math.random();
    let selectedWeather = 'clear';
    let cumulativeWeight = 0;
    
    for (const weather of availableWeathers) {
      cumulativeWeight += weights[weather];
      if (random <= cumulativeWeight) {
        selectedWeather = weather;
        break;
      }
    }
    
    // 防止连续相同天气
    if (selectedWeather === this.currentWeather && availableWeathers.length > 1) {
      const otherWeathers = availableWeathers.filter(w => w !== this.currentWeather);
      selectedWeather = otherWeathers[Math.floor(Math.random() * otherWeathers.length)];
    }
    
    this.changeWeather(selectedWeather);
    return selectedWeather;
  },
  
  // 获取当前波次可用的天气
  getAvailableWeathers: function(wave) {
    const available = ['clear'];
    
    if (wave >= this.config.unlockWaves.rain) available.push('rain');
    if (wave >= this.config.unlockWaves.fog) available.push('fog');
    if (wave >= this.config.unlockWaves.storm) available.push('storm');
    if (wave >= this.config.unlockWaves.snow) available.push('snow');
    if (wave >= this.config.unlockWaves.bloodmoon) available.push('bloodmoon');
    
    return available;
  },
  
  // 切换天气
  changeWeather: function(type) {
    // 沙漠地图强制使用沙尘暴或晴朗天气（不刷雨/雪）
    if (window.currentMap === 'desert') {
      if (type !== 'sandstorm' && type !== 'clear' && type !== 'bloodmoon') {
        type = Math.random() < 0.6 ? 'sandstorm' : 'clear';
      }
    }
    
    this.lastWeather = this.currentWeather;
    this.currentWeather = type;
    this.weatherTimer = 0;
    
    const config = this.config.effects[type];
    
    // 更新雾效 - 适配 THREE.Fog（线性雾）
    if (this.scene && this.scene.fog) {
      // 线性雾使用 near 和 far 而不是 density
      // 根据 fogDensity 计算合适的 near/far 值
      const density = config.fogDensity || 0.005;
      // density 越大，雾越浓，near 越小，far 越小
      const baseFar = 120;
      const newFar = Math.max(30, baseFar / (1 + density * 50));
      const newNear = Math.max(10, newFar * 0.25);
      
      this.scene.fog.near = newNear;
      this.scene.fog.far = newFar;
      
      // 根据天气改变雾的颜色
      switch(type) {
        case 'rain':
          this.scene.fog.color.setHex(0x6b7b8c);
          break;
        case 'fog':
          this.scene.fog.color.setHex(0xcccccc);
           // 浓雾时大幅降低能见度（减少50%-70%）
           this.scene.fog.near = 1;
           this.scene.fog.far = 15;
           break;
        case 'storm':
          this.scene.fog.color.setHex(0x2a2a3a);
          break;
        case 'snow':
          this.scene.fog.color.setHex(0xe8e8e8);
          break;
        case 'bloodmoon':
          this.scene.fog.color.setHex(0x4a1a1a);
          break;
        case 'sandstorm':
          this.scene.fog.color.setHex(0xB88040);
          this.scene.fog.near = 5;
          this.scene.fog.far = 25;
          break;
        default:
          this.scene.fog.color.setHex(0x87CEEB);
      }
    }
    
    // 控制粒子效果 - 使用新的 WeatherEffects 系统
    if (window.WeatherEffects) {
      // 如果 WeatherEffects 尚未初始化（scene为空），先初始化
      if (!WeatherEffects.scene && this.scene) {
        WeatherEffects.init(this.scene, this.camera || window.camera);
        if (window.camera) WeatherEffects.syncCamera(window.camera);
      }
      WeatherEffects.setWeather(type);
    }
    
    // 重置落雷计时器
    if (type === 'storm') {
      this.lightningTimer = this.getRandomLightningInterval();
    }
    
    // 切换背景音乐
    this.updateBackgroundMusic(config.bgm);
    
    // 显示天气通知
    this.showWeatherNotification(type);
    
    console.log(`[Weather] 天气切换为: ${type}`);
  },
  
  // 获取随机落雷间隔
  getRandomLightningInterval: function() {
    const [min, max] = this.config.effects.storm.lightningInterval;
    return min + Math.random() * (max - min);
  },
  
  // 更新背景音乐
  updateBackgroundMusic: function(bgmType) {
    if (window.AudioSystem && typeof AudioSystem.switchWeatherMusic === 'function') {
      AudioSystem.switchWeatherMusic(bgmType);
    }
  },
  
  // 显示天气通知
  showWeatherNotification: function(type) {
    const weatherNames = {
      clear: '☀️ 晴朗',
      rain: '🌧️ 雨天',
      fog: '🌫️ 浓雾',
      storm: '⛈️ 雷暴',
      snow: '❄️ 大雪',
      bloodmoon: '🩸 血月',
      sandstorm: '🏜️ 沙尘暴'
    };
    
    const weatherTips = {
      clear: '',
      rain: '地面湿滑，移动和射击受影响',
      fog: '视野受限，小心近身敌人',
      storm: '落雷危险，注意躲避',
      snow: '严寒减缓移动，爆炸范围减小',
      bloodmoon: '敌人狂暴，但经验丰厚',
      sandstorm: '沙尘漫天，视野和移动严重受限'
    };
    
    const name = weatherNames[type] || type;
    const tip = weatherTips[type];
    
    // 更新波次通知区域
    const waveInfo = document.getElementById('wave-info');
    if (waveInfo) {
      const existingWeather = waveInfo.querySelector('.weather-info');
      if (existingWeather) {
        existingWeather.remove();
      }
      
      const weatherDiv = document.createElement('div');
      weatherDiv.className = 'weather-info';
      weatherDiv.innerHTML = `<span style="color:#FFD700">${name}</span>${tip ? `<br><small>${tip}</small>` : ''}`;
      waveInfo.appendChild(weatherDiv);
    }
    
    // Toast通知
    if (typeof window.showToast === 'function') {
      window.showToast(`今天是${name}。${tip ? tip : ''}`, 'info');
    }
  },
  
  // 每帧更新
  update: function(dt, player, enemies, forts) {
    this.weatherTimer += dt;
    
    // 更新粒子效果 - 使用新的 WeatherEffects 系统
    if (window.WeatherEffects) {
      WeatherEffects.update(dt);
    }
    
    // 更新活跃闪电
    if (this._activeBolts && this._activeBolts.length > 0) {
      this._activeBolts = this._activeBolts.filter(bolt => {
        bolt.update(dt);
        if (!bolt.alive) {
          bolt.cleanup(this.scene);
          return false;
        }
        return true;
      });
    }
    
    // 雷暴天气处理落雷
    if (this.currentWeather === 'storm') {
      this.updateLightning(dt, player, enemies, forts);
    }
  },
  
  // 更新落雷
  updateLightning: function(dt, player, enemies, forts) {
    this.lightningTimer -= dt;
    
    if (this.lightningTimer <= 0) {
      this.spawnLightning(player, enemies, forts);
      this.lightningTimer = this.getRandomLightningInterval();
    }
  },
  
  // 生成落雷（必中目标，不放空雷）
  spawnLightning: function(player, enemies, forts) {
    let target = null;
    let targetType = '';
    
    // 构建候选目标池，确保至少有一个目标
    const candidates = [];
    
    // 候选：地面僵尸
    if (enemies && enemies.length > 0) {
      const groundEnemies = enemies.filter(e => !e.dead && !e.def.flying);
      groundEnemies.forEach(e => candidates.push({ target: e, type: 'enemy' }));
    }
    
    // 候选：炮塔
    if (forts && forts.length > 0) {
      const turrets = forts.filter(f => f.def.type === 'turret' && f.health > 0);
      turrets.forEach(f => candidates.push({ target: f, type: 'fort' }));
    }
    
    // 候选：玩家
    if (player && player.hp > 0) {
      candidates.push({ target: player, type: 'player' });
    }
    
    // 没有目标则不放雷
    if (candidates.length === 0) return;
    
    // 加权随机选择：僵尸60%，炮塔20%，玩家20%
    let chosen = null;
    const r = Math.random();
    const enemyCandidates = candidates.filter(c => c.type === 'enemy');
    const fortCandidates = candidates.filter(c => c.type === 'fort');
    const playerCandidates = candidates.filter(c => c.type === 'player');
    
    if (r < 0.6 && enemyCandidates.length > 0) {
      chosen = enemyCandidates[Math.floor(Math.random() * enemyCandidates.length)];
    } else if (r < 0.8 && fortCandidates.length > 0) {
      chosen = fortCandidates[Math.floor(Math.random() * fortCandidates.length)];
    } else if (playerCandidates.length > 0) {
      chosen = playerCandidates[0];
    } else if (enemyCandidates.length > 0) {
      chosen = enemyCandidates[Math.floor(Math.random() * enemyCandidates.length)];
    } else if (fortCandidates.length > 0) {
      chosen = fortCandidates[Math.floor(Math.random() * fortCandidates.length)];
    }
    
    if (!chosen) return;
    
    target = chosen.target;
    targetType = chosen.type;
    
    // 获取目标位置
    let pos;
    if (targetType === 'player') {
      pos = target.pos ? new THREE.Vector3(target.pos.x, target.pos.y, target.pos.z) : new THREE.Vector3(0, 0, 0);
    } else {
      pos = target.mesh.position.clone();
    }
    
    // 从天而降的闪电视觉效果
    this.showLightningBolt(pos);
    
    // 应用效果
    switch(targetType) {
      case 'enemy':
        target.lastAttacker = '闪电';
        target.hp = 0;
        // 调用killEnemy实际处理死亡
        if (typeof window.killEnemy === 'function') {
          window.killEnemy(target);
        }
        if (typeof window.showFloatingText === 'function') {
          window.showFloatingText(pos.clone().add(new THREE.Vector3(0, 2, 0)), '⚡落雷击毙!', 0xffff00);
        }
        // 使用与玩家击杀相同的通知格式
        if (typeof window.addKillFeed === 'function') {
          window.addKillFeed('闪电', target.def ? target.def.name : '敌人');
        }
        break;
        
      case 'fort':
        if (!target.stunned) target.stunned = 0;
        target.stunned = 5;
        if (typeof window.showFloatingText === 'function') {
          window.showFloatingText(pos.clone().add(new THREE.Vector3(0, 2, 0)), '⚡炮塔失灵!', 0xffff00);
        }
        if (typeof window.showToast === 'function') {
          window.showToast('⚡闪电击中了' + (target.def ? target.def.name : '炮塔'), 'warning');
        }
        break;
        
      case 'player':
        if (player) {
          player.shield = 0;
          this.shakeScreen();
          this.flashScreen(0xFFD700);
          if (typeof window.showToast === 'function') {
            window.showToast('⚡落雷击中！护盾清零', 'warning');
          }
        }
        break;
    }
    
    // 播放雷声
    if (typeof window.playSound === 'function') {
      AudioSystem.playSound('thunder');
    }
  },
  
  // 从天而降的闪电光束效果（使用分形闪电）
  showLightningBolt: function(targetPos) {
    // 优先使用 WeatherEffects 的分形闪电
    if (window.WeatherEffects && WeatherEffects.createLightningBolt) {
      const bolt = WeatherEffects.createLightningBolt(targetPos);
      if (bolt) {
        if (!this._activeBolts) this._activeBolts = [];
        this._activeBolts.push(bolt);
      }
    }
    // 全屏闪光
    this.flashScreen(0xffffff, 0.4);
  },
  
  // 屏幕抖动
  shakeScreen: function() {
    if (!this.camera) return;
    
    const originalPos = this.camera.position.clone();
    let shakeTime = 0;
    const shakeDuration = 0.5;
    
    const shakeInterval = setInterval(() => {
      shakeTime += 0.016;
      const intensity = (1 - shakeTime / shakeDuration) * 0.3;
      
      this.camera.position.x = originalPos.x + (Math.random() - 0.5) * intensity;
      this.camera.position.y = originalPos.y + (Math.random() - 0.5) * intensity;
      this.camera.position.z = originalPos.z + (Math.random() - 0.5) * intensity;
      
      if (shakeTime >= shakeDuration) {
        this.camera.position.copy(originalPos);
        clearInterval(shakeInterval);
      }
    }, 16);
  },
  
  // 屏幕闪光
  flashScreen: function(color, duration = 0.5) {
    let flashDiv = document.getElementById('screen-flash');
    if (!flashDiv) {
      flashDiv = document.createElement('div');
      flashDiv.id = 'screen-flash';
      flashDiv.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        pointer-events: none; z-index: 99999;
        transition: opacity ${duration}s;
      `;
      document.body.appendChild(flashDiv);
    }
    
    const hexColor = '#' + color.toString(16).padStart(6, '0');
    flashDiv.style.backgroundColor = hexColor;
    flashDiv.style.opacity = '0.7';
    
    setTimeout(() => {
      flashDiv.style.opacity = '0';
    }, 50);
  },
  
  // 获取当前天气效果
  getCurrentEffects: function() {
    return this.config.effects[this.currentWeather] || this.config.effects.clear;
  },
  
  // 获取玩家移速倍率
  getPlayerSpeedMult: function() {
    return this.getCurrentEffects().playerSpeed || 1;
  },
  
  // 获取敌人移速倍率
  getEnemySpeedMult: function() {
    return this.getCurrentEffects().enemySpeed || 1;
  },
  
  // 获取散布倍率
  getSpreadMult: function() {
    return this.getCurrentEffects().spreadMult || 1;
  },
  
  // 获取视野倍率
  getVisibilityMult: function() {
    return this.getCurrentEffects().visibility || 1;
  },
  
  // 获取爆炸范围倍率
  getExplosionRangeMult: function() {
    return this.getCurrentEffects().explosionRange || 1;
  },
  
  // 获取经验倍率
  getXpMult: function() {
    return this.getCurrentEffects().xpMult || 1;
  },
  
  // 获取敌人属性倍率
  getEnemyStatMult: function() {
    return {
      health: this.getCurrentEffects().enemyHealth || 1,
      speed: this.getCurrentEffects().enemySpeed || 1,
      damage: this.getCurrentEffects().enemyDamage || 1
    };
  },
  
  // 强制切换天气（调试用）
  forceWeather: function(type) {
    console.log('[Weather] Force weather:', type);
    if (!this.config.effects[type]) {
      console.warn('[Weather] Unknown weather type:', type);
      return false;
    }
    this.changeWeather(type);
    return true;
  }
};

// 暴露到全局
window.WeatherSystem = WeatherSystem;
