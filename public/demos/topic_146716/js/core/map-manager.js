/**
 * Map Manager Module
 * 统一地图管理器 - 管理所有地图的注册、切换和清理
 * 解决地图间干扰问题，提供统一的地图生命周期管理
 */

// ============================================================
// MapManager 主对象
// ============================================================
const MapManager = {
  // 当前状态
  currentMapId: 'city',
  currentMap: null,
  
  // 注册的地图模块
  maps: new Map(),
  
  // Three.js 核心对象
  scene: null,
  camera: null,
  renderer: null,
  
  // 初始化
  init(scene, camera, renderer) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.currentMapId = 'city';
    this.currentMap = null;
    this.maps.clear();
    
    console.log('[MapManager] Initialized');
  },
  
  // 注册地图模块
  registerMap(id, mapModule) {
    if (!mapModule || typeof mapModule.init !== 'function') {
      console.error(`[MapManager] Map ${id} must have init() method`);
      return false;
    }
    if (typeof mapModule.generate !== 'function') {
      console.error(`[MapManager] Map ${id} must have generate() method`);
      return false;
    }
    if (typeof mapModule.cleanup !== 'function') {
      console.error(`[MapManager] Map ${id} must have cleanup() method`);
      return false;
    }
    
    this.maps.set(id, mapModule);
    console.log(`[MapManager] Registered map: ${id}`);
    return true;
  },
  
  // 获取地图模块
  getMap(id) {
    return this.maps.get(id);
  },
  
  // 获取当前地图
  getCurrentMap() {
    return this.currentMap;
  },
  
  // 获取当前地图ID
  getCurrentMapId() {
    return this.currentMapId;
  },
  
  // 切换地图（统一入口）
  switchTo(mapId, options = {}) {
    console.log(`[MapManager] Switching to ${mapId}...`);

    const targetMap = this.maps.get(mapId);
    if (!targetMap) {
      console.error(`[MapManager] Map ${mapId} not found`);
      return false;
    }

    // 1. 清理当前地图
    if (this.currentMap && typeof this.currentMap.cleanup === 'function') {
      this.currentMap.cleanup();
    }

    // 2. 清理共享状态
    this.clearSharedState();

    // 3. 初始化新地图
    if (typeof targetMap.init === 'function') {
      targetMap.init(this.scene, this.camera, this.renderer);
    } else {
      console.warn(`[MapManager] Map ${mapId} has no init()`);
    }

    // 4. 生成新地图
    if (typeof targetMap.generate === 'function') {
      targetMap.generate(options);
    } else {
      console.warn(`[MapManager] Map ${mapId} has no generate()`);
    }

    // 5. 更新当前地图
    this.currentMap = targetMap;
    this.currentMapId = mapId;

    // 6. 更新全局状态
    window.currentMap = mapId;

    // 7. 保存存档
    this.saveMapState();

    console.log(`[MapManager] Switched to ${mapId}`);
    return true;
  },
  
  // 清理共享状态（统一清理）
  clearSharedState() {
    console.log('[MapManager] Clearing shared state...');
    
    // 清理实体数组
    if (typeof enemies !== 'undefined') {
      for (const e of enemies) {
        if (e && e.mesh && e.mesh.parent) {
          this.scene.remove(e.mesh);
        }
      }
      enemies.length = 0;
    }
    
    if (typeof allies !== 'undefined') {
      for (const a of allies) {
        if (a && a.mesh && a.mesh.parent) {
          this.scene.remove(a.mesh);
        }
      }
      allies.length = 0;
    }
    
    if (typeof bullets !== 'undefined') bullets.length = 0;
    if (typeof pickups !== 'undefined') pickups.length = 0;
    if (typeof missiles !== 'undefined') missiles.length = 0;
    
    // 清理特效
    if (typeof particles !== 'undefined') {
      for (const p of particles) {
        if (p && p.mesh && p.mesh.parent) {
          this.scene.remove(p.mesh);
        }
      }
      particles.length = 0;
    }
    
    if (typeof floatingTexts !== 'undefined') floatingTexts.length = 0;
    if (typeof damageNumbers !== 'undefined') damageNumbers.length = 0;
    
    // 清理碰撞体
    if (typeof clearColliders === 'function') {
      clearColliders();
    }
    
    // 清理工事
    if (typeof deployedFortifications !== 'undefined') {
      for (const f of deployedFortifications) {
        if (f && f.mesh && f.mesh.parent) {
          this.scene.remove(f.mesh);
        }
      }
      deployedFortifications.length = 0;
    }
    
    // 清理空投
    if (typeof airdropCrates !== 'undefined') {
      for (const crate of airdropCrates) {
        if (crate && crate.mesh && crate.mesh.parent) {
          this.scene.remove(crate.mesh);
        }
      }
      airdropCrates.length = 0;
    }
    
    // 清理毒液区
    if (typeof poisonZones !== 'undefined') {
      for (const zone of poisonZones) {
        if (zone && zone.mesh && zone.mesh.parent) {
          this.scene.remove(zone.mesh);
        }
      }
      poisonZones.length = 0;
    }
    
    // 重置波次状态
    if (typeof waveActive !== 'undefined') waveActive = false;
    if (typeof waveTimer !== 'undefined') waveTimer = 0;
    
    console.log('[MapManager] Shared state cleared');
  },
  
  // 更新当前地图（每帧调用）
  update(dt) {
    if (this.currentMap && typeof this.currentMap.update === 'function') {
      this.currentMap.update(dt);
    }
  },
  
  // 获取地图边界
  getMapBounds() {
    if (this.currentMap && typeof this.currentMap.getMapBounds === 'function') {
      return this.currentMap.getMapBounds();
    }
    
    // 默认边界
    let size = 500;
    if (this.currentMapId === 'snow' && typeof SNOW_MAP_CONFIG !== 'undefined') {
      size = SNOW_MAP_CONFIG.MAP_SIZE;
    } else if (this.currentMapId === 'desert' && typeof DESERT_MAP_CONFIG !== 'undefined') {
      size = DESERT_MAP_CONFIG.MAP_SIZE;
    } else if (typeof CONFIG !== 'undefined') {
      size = CONFIG.MAP_SIZE;
    }
    
    return {
      minX: -size,
      maxX: size,
      minZ: -size,
      maxZ: size
    };
  },
  
  // 获取地面高度（委托给当前地图）
  getGroundHeight(x, z) {
    // 优先使用当前地图的地形查询
    if (this.currentMapId === 'snow' && typeof SnowMap !== 'undefined' && SnowMap.getTerrainHeight) {
      return SnowMap.getTerrainHeight(x, z);
    }
    if (this.currentMapId === 'desert' && typeof DesertMap !== 'undefined' && DesertMap.getTerrainHeight) {
      return DesertMap.getTerrainHeight(x, z);
    }
    if (this.currentMapId === 'swamp' && typeof SwampMap !== 'undefined' && SwampMap.getTerrainHeight) {
      return SwampMap.getTerrainHeight(x, z);
    }
    if (this.currentMapId === 'island' && typeof IslandBase !== 'undefined' && IslandBase.getTerrainHeight) {
      return IslandBase.getTerrainHeight(x, z);
    }
    
    // 城市地图默认高度为0
    return 0;
  },
  
  // 保存地图状态
  saveMapState() {
    try {
      const data = {
        currentMap: this.currentMapId,
        timestamp: Date.now()
      };
      localStorage.setItem('mapManagerState', JSON.stringify(data));
    } catch (e) {
      console.warn('[MapManager] Failed to save state:', e);
    }
  },
  
  // 加载地图状态
  loadMapState() {
    try {
      const saved = localStorage.getItem('mapManagerState');
      if (saved) {
        const data = JSON.parse(saved);
        return data.currentMap || 'city';
      }
    } catch (e) {
      console.warn('[MapManager] Failed to load state:', e);
    }
    return 'city';
  },
  
  // 从存档恢复地图
  restoreFromSave(saveData) {
    if (!saveData) return false;
    
    const mapId = saveData.currentMap || 'city';
    console.log(`[MapManager] Restoring from save: ${mapId}`);
    
    return this.switchTo(mapId, { fromSave: true, saveData });
  },
  
  // 显示加载界面
  showLoadingScreen(message = 'Loading...') {
    // 创建或更新加载界面
    let loadingDiv = document.getElementById('mapLoadingScreen');
    if (!loadingDiv) {
      loadingDiv = document.createElement('div');
      loadingDiv.id = 'mapLoadingScreen';
      loadingDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.9);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        color: white;
        font-family: 'Segoe UI', sans-serif;
      `;
      document.body.appendChild(loadingDiv);
    }
    
    loadingDiv.innerHTML = `
      <div style="font-size: 24px; margin-bottom: 20px;">${message}</div>
      <div style="width: 200px; height: 4px; background: #333; border-radius: 2px;">
        <div id="mapLoadingBar" style="width: 0%; height: 100%; background: #4CAF50; border-radius: 2px; transition: width 0.3s;"></div>
      </div>
    `;
    
    loadingDiv.style.display = 'flex';
  },
  
  // 更新加载进度
  updateLoadingProgress(percent) {
    const bar = document.getElementById('mapLoadingBar');
    if (bar) {
      bar.style.width = percent + '%';
    }
  },
  
  // 隐藏加载界面
  hideLoadingScreen() {
    const loadingDiv = document.getElementById('mapLoadingScreen');
    if (loadingDiv) {
      loadingDiv.style.display = 'none';
    }
  },
  
  // 自动注册已知地图（在初始化后调用）
  autoRegister() {
    // 注册城市地图
    if (typeof CityMap !== 'undefined') {
      this.registerMap('city', CityMap);
    }
    
    // 注册雪山地图
    if (typeof SnowMap !== 'undefined') {
      this.registerMap('snow', SnowMap);
    }
    
    // 注册灼热荒漠地图
    if (typeof DesertMap !== 'undefined') {
      this.registerMap('desert', DesertMap);
    }
    
    // 注册毒雾沼泽地图
    if (typeof SwampMap !== 'undefined') {
      this.registerMap('swamp', SwampMap);
    }

    // 注册孤岛基地地图
    if (typeof IslandBase !== 'undefined') {
      this.registerMap('island', IslandBase);
    }

    console.log(`[MapManager] Auto-registered ${this.maps.size} maps`);
  }
};

// 导出到全局
window.MapManager = MapManager;
