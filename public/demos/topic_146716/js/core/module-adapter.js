// ============================================================
// 模块适配器 - 连接新模块与旧代码的桥梁
// 作用：在完全迁移前，让新模块与旧代码共存
// ============================================================

const ModuleAdapter = {
  initialized: false,
  
  // 初始化所有新模块
  init(scene, camera, renderer) {
    if (this.initialized) return;
    
    console.log('[ModuleAdapter] 初始化模块...');
    
    try {
      // 初始化玩家系统
      if (window.PlayerSystem) {
        PlayerSystem.init(scene, camera);
        console.log('[ModuleAdapter] PlayerSystem 已初始化');
      }
      
      // 初始化战斗系统
      if (window.CombatSystem) {
        CombatSystem.init(scene, camera);
        console.log('[ModuleAdapter] CombatSystem 已初始化');
      }
      
      // 初始化HUD系统
      if (window.HUDSystem) {
        HUDSystem.init(camera);
        console.log('[ModuleAdapter] HUDSystem 已初始化');
      }
      
      // 初始化特效系统 - 传入camera用于屏幕坐标转换
      if (window.EffectsSystem) {
        EffectsSystem.init(scene, camera);
        console.log('[ModuleAdapter] EffectsSystem 已初始化');
      }
      
      this.initialized = true;
      console.log('[ModuleAdapter] 所有模块初始化完成');
    } catch (e) {
      console.error('[ModuleAdapter] 初始化失败:', e);
    }
  },
  
  // 同步旧代码状态到新模块（游戏开始时调用）
  syncFromLegacy() {
    try {
      // 同步玩家数据
      if (window.PlayerSystem && window.player) {
        PlayerSystem.player = window.player;
        PlayerSystem.level = window.level || 1;
        PlayerSystem.xp = window.xp || 0;
        PlayerSystem.xpToLevel = window.xpToLevel || 50;
        PlayerSystem.upgradePoints = window.upgradePoints || 0;
      }
      
      // 同步战斗数据：只同步UI显示用的波次信息
      // 不同步enemies/allies/bullets——旧系统是这些数据的主管理者
      if (window.CombatSystem) {
        window.wave = window.wave || 1;
        window.waveActive = window.waveActive || false;
      }
      
      // 同步HUD数据
      if (window.HUDSystem) {
        HUDSystem.kills = window.kills || 0;
        HUDSystem.surviveTime = window.surviveTime || 0;
      }
    } catch (e) {
      console.error('[ModuleAdapter] 同步失败:', e);
    }
  },
  
  // 同步新模块状态到旧代码（需要时调用）
  syncToLegacy() {
    try {
      // 从玩家系统同步
      if (window.PlayerSystem) {
        window.player = PlayerSystem.player;
        window.level = PlayerSystem.level;
        window.xp = PlayerSystem.xp;
        window.xpToLevel = PlayerSystem.xpToLevel;
        window.upgradePoints = PlayerSystem.upgradePoints;
      }
      
      // 不同步战斗数据——旧系统是主管理者
      // if (window.CombatSystem) { ... } // 不覆盖window.enemies/allies/bullets/wave
    } catch (e) {
      console.error('[ModuleAdapter] 反向同步失败:', e);
    }
  },
  
  // 更新所有模块
  update(dt) {
    if (!this.initialized) return;
    
    try {
      // 同步旧代码状态到新模块
      this.syncFromLegacy();
      
      // 更新玩家系统
      if (window.PlayerSystem) {
        PlayerSystem.update(dt);
      }
      
      // 更新战斗系统
      if (window.CombatSystem) {
        CombatSystem.update(dt);
      }
      
      // 更新HUD系统 - 只更新小地图和击杀提示
      // 波次/敌人/武器/血量等由旧 updateHUD() 管理，这里不重复更新
      // 否则 HUDSystem 会用错误数据（window.enemies 为 undefined）覆盖正确值
      if (window.HUDSystem && HUDSystem.initialized) {
        // 只更新小地图（需要单独调用，旧 updateHUD 不包含小地图绘制）
        if (typeof HUDSystem.updateMinimap === 'function') {
          HUDSystem.updateMinimap(enemies, allies, buildings, pickups);
        }
        // 只更新击杀提示（旧 updateHUD 不包含此功能）
        if (typeof HUDSystem.updateKillFeed === 'function') {
          HUDSystem.updateKillFeed();
        }
      }
      
      // 更新特效系统
      if (window.EffectsSystem) {
        EffectsSystem.update(dt);
      }
    } catch (e) {
      console.error('[ModuleAdapter] 更新失败:', e);
    }
  },
  
  // 清理所有模块
  cleanup() {
    console.log('[ModuleAdapter] 清理模块...');
    
    try {
      if (window.PlayerSystem) PlayerSystem.cleanup();
      if (window.CombatSystem) CombatSystem.cleanup();
      if (window.HUDSystem) HUDSystem.cleanup();
      if (window.EffectsSystem) EffectsSystem.cleanup();
    } catch (e) {
      console.error('[ModuleAdapter] 清理失败:', e);
    }
    
    this.initialized = false;
  }
};

window.ModuleAdapter = ModuleAdapter;
