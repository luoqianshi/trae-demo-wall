const SAVE_KEY_PREFIX = 'pvz_save_';
const SAVE_LIST_KEY = 'pvz_saves';
const API_BASE = '/pvz';
const SAVE_VERSION = 2; // v1=旧随机杂交系统, v2=分类模板杂交系统

export class SaveManager {
  constructor(game) {
    this.game = game;
    this.autoSaveInterval = 30000; // 30 seconds
    this.cache = {};
  }

  init() {
    this._loadFromLocalStorageCache();
  }

  _loadFromLocalStorageCache() {
    try {
      const listRaw = localStorage.getItem(SAVE_LIST_KEY);
      if (listRaw) {
        const slots = JSON.parse(listRaw);
        for (const slot of slots) {
          const raw = localStorage.getItem(SAVE_KEY_PREFIX + slot);
          if (raw) {
            this.cache[slot] = JSON.parse(raw);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load save cache:', e);
    }
  }

  loadFromCache() {
    // Return the most recent save from cache
    let latest = null;
    let latestTime = 0;
    for (const slot of Object.keys(this.cache)) {
      const data = this.cache[slot];
      if (data && data.timestamp > latestTime) {
        latestTime = data.timestamp;
        latest = data;
      }
    }
    return latest;
  }

  save(slot, name) {
    const saveData = this.getSaveData();
    saveData.slot = slot;
    saveData.name = name || `Save ${slot}`;
    saveData.timestamp = Date.now();

    // Save to localStorage
    try {
      localStorage.setItem(SAVE_KEY_PREFIX + slot, JSON.stringify(saveData));
      this._updateSaveList(slot);
      this.cache[slot] = saveData;
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }

    // Save to backend API
    this._postToBackend(saveData);

    return saveData;
  }

  load(slot) {
    // Try localStorage first
    try {
      const raw = localStorage.getItem(SAVE_KEY_PREFIX + slot);
      if (raw) {
        const data = JSON.parse(raw);
        this.cache[slot] = data;
        this.loadSaveData(data);
        return data;
      }
    } catch (e) {
      console.warn('Failed to load from localStorage:', e);
    }

    // Fallback to backend API
    return this._loadFromBackend(slot);
  }

  async listSaves() {
    try {
      const response = await fetch(`${API_BASE}/saves`);
      if (response.ok) {
        return await response.json();
      }
    } catch (e) {
      console.warn('Failed to list saves from backend:', e);
    }

    // Fallback to localStorage
    const saves = [];
    try {
      const listRaw = localStorage.getItem(SAVE_LIST_KEY);
      if (listRaw) {
        const slots = JSON.parse(listRaw);
        for (const slot of slots) {
          const raw = localStorage.getItem(SAVE_KEY_PREFIX + slot);
          if (raw) {
            saves.push(JSON.parse(raw));
          }
        }
      }
    } catch (e) {
      console.warn('Failed to list saves from localStorage:', e);
    }
    return saves;
  }

  deleteSave(slot) {
    // Delete from localStorage
    try {
      localStorage.removeItem(SAVE_KEY_PREFIX + slot);
      this._removeFromSaveList(slot);
      delete this.cache[slot];
    } catch (e) {
      console.warn('Failed to delete save from localStorage:', e);
    }

    // Delete from backend
    this._deleteFromBackend(slot);
  }

  autoSave() {
    if (this.game.getState() !== 'playing') return;

    const slot = 'autosave';
    this.save(slot, 'Auto Save');
  }

  getSaveData() {
    const game = this.game;
    return {
      version: SAVE_VERSION,
      slot: null,
      name: '',
      timestamp: Date.now(),
      progress: {
        floor: game.currentFloor || game.floor || 1,
        wave: game.currentWave,
        difficulty: game.difficulty,
        mode: game.mode,
        scene: game.sceneType
      },
      resources: {
        coins: game.coins,
        sun: game.sun,
        energy: game.energy
      },
      unlocked: {
        plants: game.unlockedPlants,
        specialPlants: game.specialPlants || [],
        cardSlots: game.cardSlots,
        labLevel: game.labLevel,
        relics: game.relics,
        autoCollectSun: game.autoCollectSun,
        introCompleted: game.introCompleted || false
      },
      loadout: game.loadout,
      hybridPlants: game.hybridPlants,
      lab: game.lab ? game.lab.serialize() : null,
      achievements: game.achievements ? game.achievements.serialize() : null,
      // 塔地图状态（杀戮之塔风格：保存节点连接和访问状态）
      towerMapState: {
        towerMap: game.towerMap || [],
        currentFloor: game.currentFloor || 1,
        completedNodes: game.completedNodes || []
      },
      fieldState: {
        plants: game.plants.map(p => ({
          id: p.id,
          row: p.row,
          col: p.col,
          hp: p.hp,
          maxHp: p.maxHp,
          pumpkinHp: p.pumpkinHp || 0,
          pumpkinMaxHp: p.pumpkinMaxHp || 0
        })),
        zombies: game.zombies.map(z => ({
          type: z.type,
          row: z.row,
          x: z.x,
          hp: z.hp,
          maxHp: z.maxHp,
          isElite: z.isElite,
          isBoss: z.isBoss
        }))
      },
      // 小推车持久化：基于 lostMowerRows 记录每行小推车是否已丢失
      lawnMowers: Array.from({ length: (game.sceneConfig && game.sceneConfig.rows) || 5 }, (_, r) => ({
        row: r,
        lost: (game.lostMowerRows && game.lostMowerRows.has(r)) || false
      }))
    };
  }

  loadSaveData(data) {
    if (!data) return;

    const game = this.game;

    // 存档版本迁移：旧版本存档（v1或无版本）需要清理旧随机杂交数据
    const saveVersion = data.version || 1;
    const isOldSave = saveVersion < SAVE_VERSION;

    // === 存档隔离：清除上一存档残留在 plantData 中的杂交/特殊植物 ===
    // 防止新存档继承其他存档的植物数据
    if (game.plantData) {
      for (const key of Object.keys(game.plantData)) {
        const pd = game.plantData[key];
        if (pd && (pd.is_hybrid || pd.is_special || key.startsWith('hybrid_'))) {
          delete game.plantData[key];
        }
      }
    }
    // 清除上一存档的状态
    game.hybridPlants = [];
    game.specialPlants = [];

    // Restore progress
    if (data.progress) {
      game.floor = data.progress.floor || 1;
      game.currentFloor = data.progress.floor || 1;  // 塔模式使用 currentFloor
      game.currentWave = data.progress.wave || 0;
      game.difficulty = data.progress.difficulty || 'normal';
      game.mode = data.progress.mode || 'adventure';
      game.sceneType = data.progress.scene || 'lawn';
    }

    // Restore resources
    if (data.resources) {
      game.coins = data.resources.coins || 0;
      game.sun = data.resources.sun || 50;
      // energy 是对象 {blue, purple, gold, red}，不能回退到数字0
      game.energy = (data.resources.energy && typeof data.resources.energy === 'object')
        ? data.resources.energy
        : { blue: 0, purple: 0, gold: 0, red: 0 };
    }

    // Restore unlocks - 恢复玩家拥有的植物（初始为空，通过对话/奖励获得）
    if (data.unlocked) {
      // 恢复玩家拥有的基础植物列表
      if (data.unlocked.plants && Array.isArray(data.unlocked.plants)) {
        game.unlockedPlants = data.unlocked.plants;
      }
      // 恢复特殊植物
      if (data.unlocked.specialPlants && Array.isArray(data.unlocked.specialPlants)) {
        game.specialPlants = data.unlocked.specialPlants;
        // 重新注册到plantData
        for (const sp of game.specialPlants) {
          if (sp && sp.id && !game.plantData[sp.id]) {
            game.plantData[sp.id] = { ...sp };
          }
        }
      }
      game.cardSlots = data.unlocked.cardSlots || 6;
      game.labLevel = data.unlocked.labLevel || 1;
      game.relics = data.unlocked.relics || [];
      // 自动拾取阳光默认开启，旧存档没有该字段时也保持开启
      game.autoCollectSun = data.unlocked.autoCollectSun !== undefined ? data.unlocked.autoCollectSun : true;
      game.introCompleted = data.unlocked.introCompleted || false;
    }

    // Restore loadout
    if (data.loadout) {
      // 过滤掉旧的随机版本杂交植物（只保留基础植物和新的分类杂交植物）
      game.loadout = data.loadout.filter(id => {
        // 基础植物始终可用
        if (game.plantData && game.plantData[id]) return true;
        // 新的杂交植物以 hybrid_ 开头且有 instanceId
        if (id.startsWith('hybrid_')) return true;
        return false;
      });
      // 旧存档：loadout 可能包含已不存在的旧杂交ID，清空到只剩基础植物
      if (isOldSave) {
        game.loadout = game.loadout.filter(id => game.plantData && game.plantData[id] && !game.plantData[id].is_hybrid);
      }
    }

    // Restore hybrid plants - 过滤掉旧的随机版本
    if (data.hybridPlants) {
      game.hybridPlants = data.hybridPlants.filter(h => {
        // 新系统标记：有instanceId、visual.shape 为 hybrid_dual_head / hybrid_triple_head / hybrid_quad_head / hybrid_penta_head
        if (h.instanceId && h.visual &&
            (h.visual.shape === 'hybrid_dual_head' ||
             h.visual.shape === 'hybrid_triple_head' ||
             h.visual.shape === 'hybrid_quad_head' ||
             h.visual.shape === 'hybrid_penta_head')) {
          return true;
        }
        // 旧系统标记：有stats字段（随机生成版本）- 丢弃
        return false;
      });
    }

    // Restore lab state (植物库存、刷新次数、已发现失败组合)
    // 注意：lab 可能在 loadSaveData 调用时还未初始化，由调用方负责在 lab 初始化后调用 deserialize
    if (data.lab && game.lab) {
      game.lab.deserialize(data.lab);
    } else if (data.lab) {
      // lab 尚未初始化，缓存到 game._pendingLabData 供后续恢复
      game._pendingLabData = data.lab;
    }

    // Restore achievements
    if (data.achievements && game.achievements) {
      game.achievements.deserialize(data.achievements);
    }

    // Restore tower map state (杀戮之塔风格：恢复节点连接和访问状态)
    if (data.towerMapState && data.towerMapState.towerMap && data.towerMapState.towerMap.length > 0) {
      game.towerMap = data.towerMapState.towerMap;
      game.completedNodes = data.towerMapState.completedNodes || [];
      // currentFloor 已在 progress 中恢复，这里确保一致
      if (data.towerMapState.currentFloor) {
        game.currentFloor = data.towerMapState.currentFloor;
      }
    }

    // Restore lawn mowers - 缓存到 savedLawnMowers，由 startGame 消费
    // 已丢失（lost）的行在 startGame 中不会重新生成小推车
    if (data.lawnMowers && Array.isArray(data.lawnMowers)) {
      game.savedLawnMowers = data.lawnMowers.map(m => ({
        row: m.row,
        lost: m.lost || false,
        triggered: m.triggered || false
      }));
    }

    // Field state is not restored directly - player would need to restart the level
    // The progress (floor, wave) determines where they resume
    // 但暂存 fieldState（含 pumpkinHp/pumpkinMaxHp）以备断点续战使用
    if (data.fieldState) {
      game._pendingFieldState = data.fieldState;
    }
  }

  _updateSaveList(slot) {
    try {
      let slots = [];
      const raw = localStorage.getItem(SAVE_LIST_KEY);
      if (raw) {
        slots = JSON.parse(raw);
      }
      if (!slots.includes(slot)) {
        slots.push(slot);
        localStorage.setItem(SAVE_LIST_KEY, JSON.stringify(slots));
      }
    } catch (e) {
      console.warn('Failed to update save list:', e);
    }
  }

  _removeFromSaveList(slot) {
    try {
      const raw = localStorage.getItem(SAVE_LIST_KEY);
      if (raw) {
        let slots = JSON.parse(raw);
        slots = slots.filter(s => s !== slot);
        localStorage.setItem(SAVE_LIST_KEY, JSON.stringify(slots));
      }
    } catch (e) {
      console.warn('Failed to remove from save list:', e);
    }
  }

  async _postToBackend(saveData) {
    try {
      await fetch(`${API_BASE}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saveData)
      });
    } catch (e) {
      console.warn('Failed to save to backend:', e);
    }
  }

  async _loadFromBackend(slot) {
    try {
      const response = await fetch(`${API_BASE}/save/${slot}`);
      if (response.ok) {
        const data = await response.json();
        if (data) {
          this.loadSaveData(data);
          // Cache to localStorage
          localStorage.setItem(SAVE_KEY_PREFIX + slot, JSON.stringify(data));
          this.cache[slot] = data;
          return data;
        }
      }
    } catch (e) {
      console.warn('Failed to load from backend:', e);
    }
    return null;
  }

  async _deleteFromBackend(slot) {
    try {
      await fetch(`${API_BASE}/save/${slot}`, {
        method: 'DELETE'
      });
    } catch (e) {
      console.warn('Failed to delete from backend:', e);
    }
  }
}
