/**
 * HUD Module
 * HUD系统 - 从game.js提取
 * 负责游戏界面、小地图、击杀提示等
 * 
 * 注意：此版本复用index.html中已有的DOM元素，不创建新元素
 */

// ============================================================
// HUDSystem 主对象
// ============================================================
const HUDSystem = {
  // DOM元素引用（复用index.html中的元素）
  elements: {},
  
  // 小地图
  minimapCanvas: null,
  minimapCtx: null,
  minimapSize: 140,
  
  // 击杀提示
  killFeed: [],
  maxKillFeedItems: 5,
  
  // 相机引用
  camera: null,
  
  // 初始化标志
  initialized: false,
  
  // 初始化
  init(camera) {
    if (this.initialized) {
      console.log('[HUDSystem] Already initialized');
      return;
    }
    
    try {
      this.camera = camera;
      
      // 获取已存在的DOM元素
      this.cacheElements();
      
      // 获取小地图canvas
      this.minimapCanvas = document.getElementById('minimap-canvas');
      if (this.minimapCanvas) {
        this.minimapCtx = this.minimapCanvas.getContext('2d');
        this.minimapSize = this.minimapCanvas.width || 140;
      }
      
      this.initialized = true;
      console.log('[HUDSystem] Initialized successfully');
    } catch (e) {
      console.error('[HUDSystem] Initialization failed:', e);
    }
  },
  
  // 缓存DOM元素引用
  cacheElements() {
    this.elements = {
      // 玩家面板
      hpBar: document.getElementById('hp-bar'),
      hpText: document.getElementById('hp-text'),
      shieldBar: document.getElementById('shield-bar'),
      shieldText: document.getElementById('shield-text'),
      xpBar: document.getElementById('xp-bar'),
      xpText: document.getElementById('xp-text'),
      levelText: document.getElementById('level-text'),
      
      // 弹药面板
      weaponName: document.getElementById('weapon-name'),
      ammoCount: document.getElementById('ammo-count'),
      reloadText: document.getElementById('reload-text'),
      killCount: document.getElementById('kill-count'),
      surviveTime: document.getElementById('survive-time'),
      
      // 波次信息
      waveNum: document.getElementById('wave-num'),
      enemyCount: document.getElementById('enemy-count'),
      
      // 击杀提示
      killFeed: document.getElementById('kill-feed'),
      
      // 队友信息
      allyInfo: document.getElementById('ally-info'),
      
      // 时间显示
      timeDisplay: document.getElementById('time-display'),
      
      // 交互提示
      interactionPrompt: document.getElementById('interaction-prompt'),
      promptText: document.getElementById('prompt-text'),
      
      // 升级面板
      upgradePanel: document.getElementById('upgrade-panel'),
      upgradeOptions: document.getElementById('upgrade-options'),
      
      // 属性提示
      statHint: document.getElementById('stat-hint'),
      
      // 空投提示
      airdropHint: document.getElementById('airdrop-hint'),
      ammoStationHint: document.getElementById('ammo-station-hint'),
    };
  },
  
  // 更新生命值显示
  updateHealth(hp, maxHp, shield, maxShield) {
    if (this.elements.hpBar) {
      const percent = maxHp > 0 ? (hp / maxHp) * 100 : 0;
      this.elements.hpBar.style.width = percent + '%';
    }
    if (this.elements.hpText) {
      this.elements.hpText.textContent = `${Math.ceil(hp)} / ${maxHp}`;
    }
    if (this.elements.shieldBar) {
      const percent = maxShield > 0 ? (shield / maxShield) * 100 : 0;
      this.elements.shieldBar.style.width = percent + '%';
    }
    if (this.elements.shieldText && shield > 0) {
      this.elements.shieldText.textContent = `${Math.ceil(shield)} / ${maxShield}`;
    }
  },
  
  // 更新经验值显示
  updateXP(xp, xpToLevel, level) {
    if (this.elements.xpBar) {
      const percent = xpToLevel > 0 ? (xp / xpToLevel) * 100 : 0;
      this.elements.xpBar.style.width = percent + '%';
    }
    if (this.elements.xpText) {
      this.elements.xpText.textContent = `${Math.floor(xp)} / ${xpToLevel}`;
    }
    if (this.elements.levelText) {
      this.elements.levelText.textContent = `等级 ${level}`;
    }
  },
  
  // 更新弹药显示
  updateAmmo(weaponName, currentAmmo, maxAmmo, isReloading) {
    if (this.elements.weaponName) {
      this.elements.weaponName.textContent = weaponName || '武器';
    }
    if (this.elements.ammoCount) {
      this.elements.ammoCount.textContent = `${currentAmmo} / ${maxAmmo}`;
    }
    if (this.elements.reloadText) {
      this.elements.reloadText.textContent = isReloading ? '换弹中...' : '';
    }
  },
  
  // 更新击杀和生存时间
  updateStats(kills, surviveTimeSeconds) {
    if (this.elements.killCount) {
      this.elements.killCount.textContent = `击杀: ${kills}`;
    }
    if (this.elements.surviveTime) {
      const mins = Math.floor(surviveTimeSeconds / 60).toString().padStart(2, '0');
      const secs = Math.floor(surviveTimeSeconds % 60).toString().padStart(2, '0');
      this.elements.surviveTime.textContent = `存活: ${mins}:${secs}`;
    }
  },
  
  // 更新波次信息
  updateWave(wave, enemiesRemaining) {
    if (this.elements.waveNum) {
      this.elements.waveNum.textContent = `第 ${wave} 波`;
    }
    if (this.elements.enemyCount) {
      this.elements.enemyCount.textContent = `剩余敌人: ${enemiesRemaining}`;
    }
  },
  
  // 更新小地图
  updateMinimap(enemies, allies, buildings, pickups) {
    if (!this.minimapCtx || !this.camera) return;
    
    const ctx = this.minimapCtx;
    const size = this.minimapSize;
    const cx = size / 2;
    const cy = size / 2;
    
    // 根据地图类型调整缩放
    const mapSize = (window.currentMap === 'snow' && window.SNOW_MAP_CONFIG) 
      ? window.SNOW_MAP_CONFIG.MAP_SIZE 
      : (window.CONFIG ? window.CONFIG.MAP_SIZE : 200);
    const scale = (size / 2) / (mapSize * 0.6);
    
    // 清空
    ctx.clearRect(0, 0, size, size);
    
    // 绘制背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.beginPath();
    ctx.arc(cx, cy, size/2 - 2, 0, Math.PI * 2);
    ctx.fill();
    
    // 绘制边框
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // 绘制网格
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    const gridSize = 20;
    for (let i = -2; i <= 2; i++) {
      const offset = i * gridSize * scale;
      ctx.beginPath();
      ctx.moveTo(cx + offset, 0);
      ctx.lineTo(cx + offset, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, cy + offset);
      ctx.lineTo(size, cy + offset);
      ctx.stroke();
    }
    
    const playerX = this.camera.position.x;
    const playerZ = this.camera.position.z;
    
    // 绘制建筑
    if (buildings) {
      ctx.fillStyle = 'rgba(100, 100, 100, 0.6)';
      for (const b of buildings) {
        if (!b.position && !b.x) continue;
        const bx = b.position ? b.position.x : b.x;
        const bz = b.position ? b.position.z : b.z;
        const rx = cx + (bx - playerX) * scale;
        const ry = cy + (bz - playerZ) * scale;
        
        if (rx >= 0 && rx <= size && ry >= 0 && ry <= size) {
          const dist = Math.sqrt((rx-cx)**2 + (ry-cy)**2);
          if (dist < size/2 - 2) {
            ctx.fillRect(rx - 2, ry - 2, 4, 4);
          }
        }
      }
    }
    
    // 绘制补给品
    if (pickups) {
      for (const p of pickups) {
        if (!p.position && !p.x) continue;
        const px = p.position ? p.position.x : p.x;
        const pz = p.position ? p.position.z : p.z;
        const rx = cx + (px - playerX) * scale;
        const ry = cy + (pz - playerZ) * scale;
        
        const dist = Math.sqrt((rx-cx)**2 + (ry-cy)**2);
        if (dist < size/2 - 3) {
          // 根据类型显示不同颜色
          if (p.type === 'ammo' || (p.mesh && p.mesh.userData && p.mesh.userData.type === 'ammo')) {
            ctx.fillStyle = '#44ff88';
          } else if (p.type === 'health') {
            ctx.fillStyle = '#ff4444';
          } else {
            ctx.fillStyle = '#ffff00';
          }
          ctx.beginPath();
          ctx.arc(rx, ry, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    
    // 绘制队友
    if (allies) {
      ctx.fillStyle = '#4488ff';
      for (const ally of allies) {
        if (ally.dead) continue;
        const ax = ally.position ? ally.position.x : (ally.x || 0);
        const az = ally.position ? ally.position.z : (ally.z || 0);
        const rx = cx + (ax - playerX) * scale;
        const ry = cy + (az - playerZ) * scale;
        
        const dist = Math.sqrt((rx-cx)**2 + (ry-cy)**2);
        if (dist < size/2 - 3) {
          ctx.beginPath();
          ctx.arc(rx, ry, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    
    // 绘制敌人
    if (enemies) {
      for (const enemy of enemies) {
        if (enemy.state === 'dead' || enemy.hp <= 0) continue;
        const ex = enemy.position ? enemy.position.x : (enemy.x || 0);
        const ez = enemy.position ? enemy.position.z : (enemy.z || 0);
        const rx = cx + (ex - playerX) * scale;
        const ry = cy + (ez - playerZ) * scale;
        
        const dist = Math.sqrt((rx-cx)**2 + (ry-cy)**2);
        if (dist < size/2 - 2) {
          // Boss显示更大
          const isBoss = enemy.type && (enemy.type.includes('boss') || enemy.type.includes('wyvern'));
          ctx.fillStyle = isBoss ? '#ff00ff' : '#ff4444';
          ctx.beginPath();
          ctx.arc(rx, ry, isBoss ? 5 : 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    
    // 绘制玩家（中心）
    ctx.fillStyle = '#00ff00';
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // 绘制玩家朝向
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    // 根据相机旋转计算朝向
    const rot = this.camera.rotation.y;
    ctx.lineTo(cx + Math.sin(rot) * 8, cy - Math.cos(rot) * 8);
    ctx.stroke();
  },
  
  // 添加击杀提示
  addKillFeed(killer, victim, isPlayer = true) {
    if (!this.elements.killFeed) return;
    
    const item = document.createElement('div');
    item.className = 'kill-feed-item';
    item.style.cssText = `
      background: rgba(0,0,0,0.7);
      color: ${isPlayer ? '#ffff00' : '#ff8800'};
      padding: 5px 10px;
      margin: 2px 0;
      border-radius: 4px;
      font-size: 14px;
      font-family: monospace;
      text-align: right;
      animation: fadeOut 3s forwards;
    `;
    item.textContent = isPlayer ? `你 击杀了 ${victim}` : `${killer} 击杀了 ${victim}`;
    
    this.elements.killFeed.appendChild(item);
    this.killFeed.push(item);
    
    // 限制数量
    while (this.killFeed.length > this.maxKillFeedItems) {
      const old = this.killFeed.shift();
      if (old && old.parentNode) {
        old.parentNode.removeChild(old);
      }
    }
    
    // 3秒后移除
    setTimeout(() => {
      if (item.parentNode) {
        item.parentNode.removeChild(item);
      }
      const idx = this.killFeed.indexOf(item);
      if (idx >= 0) this.killFeed.splice(idx, 1);
    }, 3000);
  },
  
  // 显示交互提示
  showInteractionPrompt(text) {
    if (this.elements.interactionPrompt && this.elements.promptText) {
      this.elements.promptText.textContent = text || '按 E 交互';
      this.elements.interactionPrompt.style.display = 'block';
    }
  },
  
  // 隐藏交互提示
  hideInteractionPrompt() {
    if (this.elements.interactionPrompt) {
      this.elements.interactionPrompt.style.display = 'none';
    }
  },
  
  // 显示提示消息
  showMessage(text, type = 'info', duration = 2000) {
    const colors = {
      info: '#ffffff',
      success: '#00ff00',
      warning: '#ffff00',
      error: '#ff0000'
    };
    
    const msg = document.createElement('div');
    msg.style.cssText = `
      position: fixed;
      top: 30%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0,0,0,0.8);
      color: ${colors[type] || colors.info};
      padding: 15px 30px;
      border-radius: 8px;
      font-size: 18px;
      font-family: monospace;
      z-index: 1000;
      pointer-events: none;
      border: 1px solid ${colors[type] || colors.info};
    `;
    msg.textContent = text;
    
    document.body.appendChild(msg);
    
    setTimeout(() => {
      if (msg.parentNode) {
        msg.parentNode.removeChild(msg);
      }
    }, duration);
  },
  
  // 更新队友HUD
  updateAllyHUD(allies) {
    if (!this.elements.allyInfo) return;
    
    // 清空现有内容
    this.elements.allyInfo.innerHTML = '';
    
    if (!allies || allies.length === 0) return;
    
    for (const ally of allies) {
      if (ally.dead) continue;
      
      const allyDiv = document.createElement('div');
      allyDiv.className = 'ally-status';
      
      const hpPercent = (ally.hp / ally.maxHp) * 100;
      const color = hpPercent > 50 ? '#44ff44' : (hpPercent > 25 ? '#ffff44' : '#ff4444');
      
      allyDiv.innerHTML = `
        <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
          <span>${ally.name || '队友'}</span>
          <span style="color:${color}">${Math.ceil(ally.hp)}/${ally.maxHp}</span>
        </div>
        <div style="width:100%;height:4px;background:rgba(0,0,0,0.5);border-radius:2px;">
          <div style="width:${hpPercent}%;height:100%;background:${color};border-radius:2px;transition:width 0.3s;"></div>
        </div>
      `;
      
      this.elements.allyInfo.appendChild(allyDiv);
    }
  },
  
  // 更新时间显示
  updateTime(hour, minute, isDay) {
    if (this.elements.timeDisplay) {
      const icon = isDay ? '☀️' : '🌙';
      const h = hour.toString().padStart(2, '0');
      const m = minute.toString().padStart(2, '0');
      this.elements.timeDisplay.textContent = `${icon} ${h}:${m}`;
    }
  },
  
  // 显示/隐藏升级面板
  showUpgradePanel(show) {
    if (this.elements.upgradePanel) {
      this.elements.upgradePanel.style.display = show ? 'block' : 'none';
    }
  },
  
  // 更新属性点提示
  updateStatHint(points) {
    if (this.elements.statHint) {
      if (points > 0) {
        this.elements.statHint.textContent = `(${points} 属性点可用)`;
        this.elements.statHint.style.color = '#ffcc00';
      } else {
        this.elements.statHint.textContent = '';
      }
    }
  },
  
  // 主更新函数（每帧调用）
  update(dt, player, weapon, wave, kills, surviveTime, enemies, allies, buildings, pickups) {
    if (!this.initialized) return;
    
    // 更新玩家状态
    if (player) {
      this.updateHealth(player.hp, player.maxHp, player.shield, player.maxShield);
      this.updateXP(player.xp || 0, player.xpToLevel || 50, player.level || 1);
    }
    
    // 更新武器
    if (weapon) {
      this.updateAmmo(weapon.name, weapon.ammo, weapon.maxAmmo, weapon.isReloading);
    }
    
    // 更新统计
    this.updateStats(kills, surviveTime);
    
    // 更新波次
    this.updateWave(wave, enemies ? enemies.filter(e => e.state !== 'dead' && e.hp > 0).length : 0);
    
    // 更新小地图
    this.updateMinimap(enemies, allies, buildings, pickups);
    
    // 更新队友HUD
    this.updateAllyHUD(allies);
  },
  
  // 清理
  cleanup() {
    this.initialized = false;
    this.killFeed = [];
    this.elements = {};
    this.minimapCanvas = null;
    this.minimapCtx = null;
    console.log('[HUDSystem] Cleaned up');
  }
};

// 导出到全局
window.HUDSystem = HUDSystem;
