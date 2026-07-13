/**
 * Player Module
 * 玩家系统 - 从game.js提取
 * 负责玩家创建、移动、射击、换弹、属性升级等
 */

// ============================================================
// PlayerSystem 主对象
// ============================================================
const PlayerSystem = {
  // 状态
  player: null,
  camera: null,
  scene: null,
  
  // 玩家属性
  level: 1,
  xp: 0,
  xpToLevel: 50,
  upgradePoints: 0,
  
  // 武器
  weapons: [],
  currentWeaponIndex: 0,
  
  // 输入状态
  keys: {},
  mouseDown: false,
  rightMouseDown: false,
  isAiming: false,
  
  // 视角
  yaw: 0,
  pitch: 0,
  
  // 移动
  playerVelocity: null,
  onGround: true,
  jumpCount: 0,
  spacePressed: false,
  
  // 呼吸效果
  breathingInterval: null,
  breathingOffset: { x: 0, y: 0 },
  
  // BUFF
  buffs: {},
  
  // 初始化
  init(scene, camera, options = {}) {
    this.scene = scene;
    this.camera = camera;
    this.keys = options.keys || {};
    
    // 重置属性
    this.level = 1;
    this.xp = 0;
    this.xpToLevel = 50;
    this.upgradePoints = 0;
    this.buffs = {};
    
    console.log('[PlayerSystem] Initialized');
  },
  
  // 创建玩家
  createPlayer() {
    // 创建玩家数据对象
    this.player = {
      hp: 100,
      maxHp: 100,
      shield: 0,
      maxShield: 100,
      stamina: 100,
      maxStamina: 100,
      
      // 属性
      stats: {
        damage: 0,      // 伤害加成
        defense: 0,     // 防御加成
        speed: 0,       // 速度加成
        hpBonus: 0,     // 生命加成
        critRate: 0,    // 暴击率
        critDamage: 0,  // 暴击伤害
        reloadSpeed: 0, // 换弹速度
        expGain: 0,     // 经验获取
        luck: 0,        // 幸运值
        fireRate: 0,    // 射速
        accuracy: 0,    // 精准度
        range: 0,       // 射程
        penetration: 0, // 穿透
        lifeSteal: 0,   // 生命偷取
        damageReduction: 0, // 伤害减免
        moveSpeed: 0,   // 移动速度
        jumpHeight: 0,  // 跳跃高度
        staminaRecovery: 0, // 耐力恢复
        shieldRecovery: 0,  // 护盾恢复
        itemDuration: 0,    // 道具持续时间
        headshotDamage: 0,  // 爆头伤害
        explosionDamage: 0, // 爆炸伤害
        poisonDamage: 0,    // 毒伤
        electricDamage: 0,  // 电伤
        fireDamage: 0,      // 火伤
        iceDamage: 0,       // 冰伤
        darkDamage: 0,      // 暗伤
        holyDamage: 0,      // 圣伤
        summonPower: 0,     // 召唤物强度
        skillCooldown: 0,   // 技能冷却
      },
      
      // 武器槽
      weapons: [],
      currentWeapon: 0,
    };
    
    // 初始化武器
    this.initWeapons();
    
    console.log('[PlayerSystem] Player created');
    return this.player;
  },
  
  // 初始化武器
  initWeapons() {
    this.weapons = [];
    this.currentWeaponIndex = 0;
    
    // 默认武器：手枪
    if (typeof WEAPON_DEFS !== 'undefined') {
      const pistol = JSON.parse(JSON.stringify(WEAPON_DEFS.find(w => w.id === 'pistol')));
      this.weapons.push(pistol);
    }
  },
  
  // 获取当前玩家数据
  getPlayer() {
    return this.player;
  },
  
  // 获取当前武器
  getCurrentWeapon() {
    return this.weapons[this.currentWeaponIndex];
  },
  
  // 切换武器
  switchWeapon(index) {
    if (index < 0 || index >= this.weapons.length) return false;
    
    this.currentWeaponIndex = index;
    if (this.player) {
      this.player.currentWeapon = index;
    }
    
    // 更新武器模型
    this.updateWeaponModel();
    
    return true;
  },
  
  // 切换到下一个可用武器
  switchToNextAvailableWeapon() {
    const nextIndex = (this.currentWeaponIndex + 1) % this.weapons.length;
    this.switchWeapon(nextIndex);
  },
  
  // 更新武器模型
  updateWeaponModel() {
    // 武器模型更新逻辑
    // 这里需要与game.js中的武器模型系统配合
    if (typeof window.updateWeaponModel === 'function') {
      window.updateWeaponModel();
    }
  },
  
  // 切换瞄准
  toggleAim() {
    this.isAiming = !this.isAiming;
    
    // 更新FOV
    if (this.camera) {
      if (this.isAiming) {
        this.camera.fov = 45;
      } else {
        this.camera.fov = 75;
      }
      this.camera.updateProjectionMatrix();
    }
    
    return this.isAiming;
  },
  
  // 射击
  shoot() {
    const weapon = this.getCurrentWeapon();
    if (!weapon) return false;
    
    // 检查弹药
    if (weapon.ammo <= 0) {
      // 自动换弹
      this.reloadWeapon();
      return false;
    }
    
    // 消耗弹药
    weapon.ammo--;
    
    // 创建子弹
    this.createBullet();
    
    // 后坐力
    this.applyRecoil(weapon);
    
    // 播放音效
    if (typeof window.playSound === 'function') {
      AudioSystem.playSound('shoot');
    }
    
    return true;
  },
  
  // 创建子弹
  createBullet() {
    // 子弹创建逻辑
    // 这里需要与game.js中的子弹系统配合
    if (typeof window.createBullet === 'function') {
      window.createBullet();
    }
  },
  
  // 应用后坐力
  applyRecoil(weapon) {
    // 后坐力逻辑
    const recoil = weapon.recoil || 0.1;
    this.pitch -= recoil;
  },
  
  // 换弹
  reloadWeapon() {
    const weapon = this.getCurrentWeapon();
    if (!weapon) return false;
    
    if (weapon.ammo >= weapon.maxAmmo) return false;
    if (weapon.reloading) return false;
    
    weapon.reloading = true;
    
    // 计算换弹时间（受属性影响）
    let reloadTime = weapon.reloadTime || 2000;
    reloadTime *= (1 - this.player.stats.reloadSpeed * 0.05);
    
    // 播放换弹音效
    if (typeof window.playSound === 'function') {
      AudioSystem.playSound('reload');
    }
    
    // 延迟完成换弹
    setTimeout(() => {
      this.finishReload();
    }, reloadTime);
    
    return true;
  },
  
  // 完成换弹
  finishReload() {
    const weapon = this.getCurrentWeapon();
    if (!weapon) return;
    
    weapon.ammo = weapon.maxAmmo;
    weapon.reloading = false;
    
    console.log('[PlayerSystem] Reload complete');
  },
  
  // 投掷手雷
  throwGrenade() {
    // 手雷投掷逻辑
    if (typeof window.throwGrenade === 'function') {
      window.throwGrenade();
    }
  },
  
  // 更新玩家（每帧调用）
  update(dt) {
    if (!this.player || !this.camera) return;
    
    // 更新呼吸效果
    this.updateBreathing(dt);
    
    // 更新BUFF
    this.updateBuffs(dt);
    
    // 更新耐力恢复
    this.updateStamina(dt);
    
    // 更新护盾恢复
    this.updateShield(dt);
  },
  
  // 更新呼吸效果
  updateBreathing(dt) {
    if (!this.breathingInterval) {
      this.startBreathingEffect();
    }
  },
  
  // 开始呼吸效果
  startBreathingEffect() {
    if (this.breathingInterval) return;
    
    this.breathingInterval = setInterval(() => {
      if (!this.isAiming) {
        this.breathingOffset.y = Math.sin(Date.now() * 0.002) * 0.02;
      }
    }, 16);
  },
  
  // 停止呼吸效果
  stopBreathingEffect() {
    if (this.breathingInterval) {
      clearInterval(this.breathingInterval);
      this.breathingInterval = null;
    }
  },
  
  // 更新耐力
  updateStamina(dt) {
    if (this.player.stamina < this.player.maxStamina) {
      const recovery = (1 + this.player.stats.staminaRecovery * 0.1) * dt;
      this.player.stamina = Math.min(this.player.maxStamina, this.player.stamina + recovery);
    }
  },
  
  // 更新护盾
  updateShield(dt) {
    if (this.player.shield < this.player.maxShield) {
      const recovery = (1 + this.player.stats.shieldRecovery * 0.1) * dt;
      this.player.shield = Math.min(this.player.maxShield, this.player.shield + recovery);
    }
  },
  
  // 受到伤害
  damagePlayer(damage, options = {}) {
    if (!this.player) return false;
    
    // 计算实际伤害（受防御属性影响）
    let actualDamage = damage;
    actualDamage *= (1 - this.player.stats.defense * 0.02);
    actualDamage *= (1 - this.player.stats.damageReduction * 0.01);
    
    // 先扣护盾
    if (this.player.shield > 0) {
      const shieldAbsorb = Math.min(this.player.shield, actualDamage);
      this.player.shield -= shieldAbsorb;
      actualDamage -= shieldAbsorb;
    }
    
    // 再扣生命
    if (actualDamage > 0) {
      this.player.hp -= actualDamage;
    }
    
    // 检查死亡
    if (this.player.hp <= 0) {
      this.player.hp = 0;
      this.onPlayerDeath();
    }
    
    // 显示伤害数字
    if (typeof window.showFloatingText === 'function') {
      window.showFloatingText(Math.floor(actualDamage), this.camera.position, '#ff0000');
    }
    
    return true;
  },
  
  // 玩家死亡
  onPlayerDeath() {
    console.log('[PlayerSystem] Player died');
    
    if (typeof window.gameOver === 'function') {
      window.gameOver();
    }
  },
  
  // 治疗
  healPlayer(amount) {
    if (!this.player) return false;
    
    this.player.hp = Math.min(this.player.maxHp, this.player.hp + amount);
    
    // 显示治疗数字
    if (typeof window.showFloatingText === 'function') {
      window.showFloatingText(amount, this.camera.position, '#00ff00');
    }
    
    return true;
  },
  
  // 增加经验
  addXp(amount) {
    if (!this.player) return false;
    
    // 应用经验加成
    const bonus = 1 + this.player.stats.expGain * 0.1;
    const actualAmount = Math.floor(amount * bonus);
    
    this.xp += actualAmount;
    
    // 检查升级
    this.checkLevelUp();
    
    return actualAmount;
  },
  
  // 检查升级
  checkLevelUp() {
    while (this.xp >= this.xpToLevel) {
      this.xp -= this.xpToLevel;
      this.level++;
      this.upgradePoints++;
      
      // 增加最大生命
      this.player.maxHp += 5;
      this.player.hp += 5;
      
      // 显示升级提示
      if (typeof window.showLevelUpNotification === 'function') {
        window.showLevelUpNotification(this.level);
      }
      
      console.log(`[PlayerSystem] Level up! Now level ${this.level}`);
    }
  },
  
  // 添加属性点
  addStat(statName) {
    if (!this.player || this.upgradePoints <= 0) return false;
    if (!this.player.stats.hasOwnProperty(statName)) return false;
    
    // 检查上限
    const STAT_LIMITS = {
      damage: 50, defense: 50, speed: 20, hpBonus: 50,
      critRate: 100, critDamage: 200, reloadSpeed: 50,
      expGain: 50, luck: 50, fireRate: 50, accuracy: 50,
      range: 50, penetration: 20, lifeSteal: 20,
      damageReduction: 50, moveSpeed: 50, jumpHeight: 20,
      staminaRecovery: 50, shieldRecovery: 50,
      itemDuration: 50, headshotDamage: 100,
      explosionDamage: 50, poisonDamage: 50,
      electricDamage: 50, fireDamage: 50,
      iceDamage: 50, darkDamage: 50, holyDamage: 50,
      summonPower: 50, skillCooldown: 50
    };
    
    if (this.player.stats[statName] >= (STAT_LIMITS[statName] || 50)) {
      return false;
    }
    
    this.player.stats[statName]++;
    this.upgradePoints--;
    
    // 应用属性效果
    this.applyStatEffects();
    
    return true;
  },
  
  // 应用属性效果
  applyStatEffects() {
    if (!this.player) return;
    
    // 生命加成
    const hpBonus = this.player.stats.hpBonus * 2;
    this.player.maxHp = 100 + hpBonus;
    
    // 其他属性效果在相关系统中实时计算
  },
  
  // 激活BUFF
  activateBuff(buffType, duration, value) {
    this.buffs[buffType] = {
      duration: duration,
      remaining: duration,
      value: value
    };
    
    console.log(`[PlayerSystem] Buff activated: ${buffType}`);
  },
  
  // 更新BUFF
  updateBuffs(dt) {
    for (const [type, buff] of Object.entries(this.buffs)) {
      buff.remaining -= dt;
      
      if (buff.remaining <= 0) {
        delete this.buffs[type];
        console.log(`[PlayerSystem] Buff expired: ${type}`);
      }
    }
  },
  
  // 获取BUFF值
  getBuffValue(buffType) {
    const buff = this.buffs[buffType];
    return buff ? buff.value : 0;
  },
  
  // 清理
  cleanup() {
    this.stopBreathingEffect();
    this.player = null;
    this.weapons = [];
    this.currentWeaponIndex = 0;
    this.buffs = {};
    
    console.log('[PlayerSystem] Cleaned up');
  }
};

// 导出到全局
window.PlayerSystem = PlayerSystem;
