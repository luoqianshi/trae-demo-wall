/**
 * Combat Module
 * 战斗系统 - 从game.js提取
 * 负责敌人、队友、子弹、波次管理等
 */

// ============================================================
// CombatSystem 主对象
// ============================================================
const CombatSystem = {
  // 实体数组
  enemies: [],
  allies: [],
  bullets: [],
  missiles: [],
  
  // 波次状态
  wave: 1,
  waveActive: false,
  waveTimer: 0,
  enemiesRemaining: 0,
  waveSpawnTimer: 0,
  waveSpawned: 0,
  waveEnemyCount: 0,
  
  // 击杀统计
  kills: 0,
  
  // 场景和相机
  scene: null,
  camera: null,
  
  // 初始化
  init(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.cleanup();
    console.log('[CombatSystem] Initialized');
  },
  
  // 生成敌人
  spawnEnemy(type, options = {}) {
    const enemy = {
      id: Math.random().toString(36).substr(2, 9),
      type: type || 'zombie',
      hp: 100,
      maxHp: 100,
      damage: 10,
      speed: 2,
      position: options.position || { x: 0, y: 0, z: 0 },
      mesh: null,
      state: 'idle', // idle, chase, attack, dead
      attackTimer: 0,
      attackCooldown: 1.5,
      ...options
    };
    
    // 根据类型设置属性
    this.applyEnemyType(enemy);
    
    // 创建敌人模型
    this.createEnemyMesh(enemy);
    
    // 添加到场景和数组
    if (enemy.mesh) {
      this.scene.add(enemy.mesh);
    }
    this.enemies.push(enemy);
    
    return enemy;
  },
  
  // 应用敌人类型属性
  applyEnemyType(enemy) {
    if (typeof ZOMBIE_DEFS === 'undefined') return;
    
    const def = ZOMBIE_DEFS.find(z => z.id === enemy.type);
    if (!def) return;
    
    enemy.hp = def.hp || 100;
    enemy.maxHp = def.hp || 100;
    enemy.damage = def.damage || 10;
    enemy.speed = def.speed || 2;
  },
  
  // 创建敌人模型
  createEnemyMesh(enemy) {
    const group = new THREE.Group();
    
    // 身体
    const bodyGeo = new THREE.BoxGeometry(0.6, 1.5, 0.4);
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x556677 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.75;
    group.add(body);
    
    // 头部
    const headGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    const headMat = new THREE.MeshLambertMaterial({ color: 0x667788 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.7;
    group.add(head);
    
    group.position.set(enemy.position.x, enemy.position.y, enemy.position.z);
    enemy.mesh = group;
  },
  
  // 更新所有敌人
  updateEnemies(dt) {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      
      if (enemy.state === 'dead') {
        this.removeEnemy(enemy, i);
        continue;
      }
      
      // 更新AI
      this.updateEnemyAI(enemy, dt);
      
      // 更新攻击计时器
      if (enemy.attackTimer > 0) {
        enemy.attackTimer -= dt;
      }
    }
  },
  
  // 更新敌人AI
  updateEnemyAI(enemy, dt) {
    if (!this.camera) return;
    
    const playerPos = this.camera.position;
    const dx = playerPos.x - enemy.position.x;
    const dz = playerPos.z - enemy.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    
    // 简单AI：追击玩家
    if (dist < 30) {
      enemy.state = 'chase';
      
      // 移动向玩家
      const moveSpeed = enemy.speed * dt;
      enemy.position.x += (dx / dist) * moveSpeed;
      enemy.position.z += (dz / dist) * moveSpeed;
      
      // 更新模型位置
      if (enemy.mesh) {
        enemy.mesh.position.set(enemy.position.x, enemy.position.y, enemy.position.z);
        enemy.mesh.lookAt(playerPos.x, enemy.position.y, playerPos.z);
      }
      
      // 攻击
      if (dist < 2 && enemy.attackTimer <= 0) {
        this.enemyAttack(enemy);
      }
    } else {
      enemy.state = 'idle';
    }
  },
  
  // 敌人攻击
  enemyAttack(enemy) {
    enemy.attackTimer = enemy.attackCooldown;
    
    // 对玩家造成伤害
    if (typeof window.damagePlayer === 'function') {
      window.damagePlayer(enemy.damage);
    }
    
    // 播放攻击音效
    if (typeof window.playSound === 'function') {
      AudioSystem.playSound('zombie_attack');
    }
  },
  
  // 对敌人造成伤害
  damageEnemy(enemy, damage, options = {}) {
    if (!enemy || enemy.state === 'dead') return false;
    
    // 应用伤害
    enemy.hp -= damage;
    
    // 显示伤害数字
    if (typeof window.showFloatingText === 'function') {
      window.showFloatingText(damage, enemy.position, '#ffff00');
    }
    
    // 检查死亡
    if (enemy.hp <= 0) {
      this.killEnemy(enemy, options);
    }
    
    return true;
  },
  
  // 击杀敌人
  killEnemy(enemy, options = {}) {
    if (!enemy || enemy.state === 'dead') return;
    
    enemy.state = 'dead';
    this.kills++;
    
    // 增加经验
    if (typeof window.PlayerSystem !== 'undefined') {
      window.PlayerSystem.addXp(15);
    }
    
    // 击杀提示
    if (typeof window.addKillFeed === 'function') {
      window.addKillFeed(enemy.type);
    }
    
    // 掉落物品
    if (Math.random() < 0.25 && typeof window.spawnPickup === 'function') {
      window.spawnPickup(enemy.position);
    }
  },
  
  // 移除敌人
  removeEnemy(enemy, index) {
    if (enemy.mesh && enemy.mesh.parent) {
      this.scene.remove(enemy.mesh);
    }
    this.enemies.splice(index, 1);
  },
  
  // 生成队友
  spawnAlly(type, options = {}) {
    const ally = {
      id: Math.random().toString(36).substr(2, 9),
      type: type || 'soldier',
      hp: 100,
      maxHp: 100,
      damage: 15,
      position: options.position || { x: 0, y: 0, z: 0 },
      mesh: null,
      state: 'follow',
      attackTarget: null,
      ...options
    };
    
    // 创建队友模型
    this.createAllyMesh(ally);
    
    if (ally.mesh) {
      this.scene.add(ally.mesh);
    }
    this.allies.push(ally);
    
    return ally;
  },
  
  // 创建队友模型
  createAllyMesh(ally) {
    const group = new THREE.Group();
    
    // 身体
    const bodyGeo = new THREE.BoxGeometry(0.5, 1.4, 0.35);
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x4477aa });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.7;
    group.add(body);
    
    // 头部
    const headGeo = new THREE.BoxGeometry(0.35, 0.35, 0.35);
    const headMat = new THREE.MeshLambertMaterial({ color: 0x5599cc });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.6;
    group.add(head);
    
    group.position.set(ally.position.x, ally.position.y, ally.position.z);
    ally.mesh = group;
  },
  
  // 更新所有队友
  updateAllies(dt) {
    for (const ally of this.allies) {
      if (!this.camera) continue;
      
      const playerPos = this.camera.position;
      const dx = playerPos.x - ally.position.x;
      const dz = playerPos.z - ally.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      
      // 跟随玩家
      if (dist > 5) {
        const moveSpeed = 3 * dt;
        ally.position.x += (dx / dist) * moveSpeed;
        ally.position.z += (dz / dist) * moveSpeed;
        
        if (ally.mesh) {
          ally.mesh.position.set(ally.position.x, ally.position.y, ally.position.z);
        }
      }
      
      // 寻找攻击目标
      this.findAllyTarget(ally);
      
      // 攻击
      if (ally.attackTarget) {
        this.allyAttack(ally, dt);
      }
    }
  },
  
  // 寻找队友攻击目标
  findAllyTarget(ally) {
    let closest = null;
    let closestDist = 20;
    
    for (const enemy of this.enemies) {
      if (enemy.state === 'dead') continue;
      
      const dx = enemy.position.x - ally.position.x;
      const dz = enemy.position.z - ally.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      
      if (dist < closestDist) {
        closest = enemy;
        closestDist = dist;
      }
    }
    
    ally.attackTarget = closest;
  },
  
  // 队友攻击
  allyAttack(ally, dt) {
    const target = ally.attackTarget;
    if (!target || target.state === 'dead') return;
    
    // 面向目标
    if (ally.mesh) {
      ally.mesh.lookAt(target.position.x, ally.position.y, target.position.z);
    }
    
    // 射击
    if (Math.random() < 0.1) {
      this.damageEnemy(target, ally.damage);
    }
  },
  
  // 更新子弹
  updateBullets(dt) {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      
      // 移动子弹
      bullet.position.addScaledVector(bullet.velocity, dt);
      
      // 更新模型
      if (bullet.mesh) {
        bullet.mesh.position.copy(bullet.position);
      }
      
      // 检查碰撞
      if (this.checkBulletCollision(bullet)) {
        this.removeBullet(bullet, i);
        continue;
      }
      
      // 检查生命周期
      bullet.life -= dt;
      if (bullet.life <= 0) {
        this.removeBullet(bullet, i);
      }
    }
  },
  
  // 检查子弹碰撞
  checkBulletCollision(bullet) {
    // 检查与敌人的碰撞
    for (const enemy of this.enemies) {
      if (enemy.state === 'dead') continue;
      
      const dx = enemy.position.x - bullet.position.x;
      const dy = enemy.position.y - bullet.position.y;
      const dz = enemy.position.z - bullet.position.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      
      if (dist < 1) {
        this.damageEnemy(enemy, bullet.damage, { isHeadshot: false });
        return true;
      }
    }
    
    return false;
  },
  
  // 移除子弹
  removeBullet(bullet, index) {
    if (bullet.mesh && bullet.mesh.parent) {
      this.scene.remove(bullet.mesh);
    }
    this.bullets.splice(index, 1);
  },
  
  // 开始波次
  startWave(waveNumber) {
    this.wave = waveNumber;
    this.waveActive = true;
    this.waveTimer = 0;
    this.waveSpawned = 0;
    
    // 计算敌人数量
    this.waveEnemyCount = 5 + waveNumber * 3;
    this.enemiesRemaining = this.waveEnemyCount;
    
    console.log(`[CombatSystem] Wave ${waveNumber} started, ${this.waveEnemyCount} enemies`);
    
    // 显示波次提示
    if (typeof window.showToast === 'function') {
      window.showToast(`Wave ${waveNumber}`, 'warning');
    }
  },
  
  // 更新波次系统
  updateWaveSystem(dt) {
    if (!this.waveActive) return;
    
    this.waveTimer += dt;
    this.waveSpawnTimer += dt;
    
    // 生成敌人
    if (this.waveSpawned < this.waveEnemyCount && this.waveSpawnTimer > 2) {
      this.spawnEnemy('zombie', { position: this.getRandomSpawnPos() });
      this.waveSpawned++;
      this.waveSpawnTimer = 0;
    }
    
    // 检查波次结束
    if (this.waveSpawned >= this.waveEnemyCount && this.enemies.length === 0) {
      this.waveComplete();
    }
  },
  
  // 波次完成
  waveComplete() {
    this.waveActive = false;
    
    console.log(`[CombatSystem] Wave ${this.wave} complete`);
    
    // 显示完成提示
    if (typeof window.showToast === 'function') {
      window.showToast(`Wave ${this.wave} Complete!`, 'success');
    }
    
    // 延迟开始下一波
    setTimeout(() => {
      this.startWave(this.wave + 1);
    }, 5000);
  },
  
  // 获取随机生成位置
  getRandomSpawnPos() {
    const angle = Math.random() * Math.PI * 2;
    const dist = 30 + Math.random() * 20;
    
    let pos = {
      x: this.camera.position.x + Math.cos(angle) * dist,
      y: 0,
      z: this.camera.position.z + Math.sin(angle) * dist
    };
    
    // 使用MapManager的边界
    if (typeof MapManager !== 'undefined') {
      const bounds = MapManager.getMapBounds();
      pos.x = Math.max(bounds.minX + 5, Math.min(bounds.maxX - 5, pos.x));
      pos.z = Math.max(bounds.minZ + 5, Math.min(bounds.maxZ - 5, pos.z));
    }
    
    return pos;
  },
  
  // 更新（每帧调用）
  update(dt) {
    this.updateEnemies(dt);
    this.updateAllies(dt);
    this.updateBullets(dt);
    this.updateWaveSystem(dt);
  },
  
  // 清理
  cleanup() {
    // 清理敌人
    for (const enemy of this.enemies) {
      if (enemy.mesh && enemy.mesh.parent) {
        this.scene.remove(enemy.mesh);
      }
    }
    this.enemies = [];
    
    // 清理队友
    for (const ally of this.allies) {
      if (ally.mesh && ally.mesh.parent) {
        this.scene.remove(ally.mesh);
      }
    }
    this.allies = [];
    
    // 清理子弹
    for (const bullet of this.bullets) {
      if (bullet.mesh && bullet.mesh.parent) {
        this.scene.remove(bullet.mesh);
      }
    }
    this.bullets = [];
    
    // 重置波次
    this.wave = 1;
    this.waveActive = false;
    this.waveTimer = 0;
    this.kills = 0;
    
    console.log('[CombatSystem] Cleaned up');
  }
};

// 导出到全局
window.CombatSystem = CombatSystem;
