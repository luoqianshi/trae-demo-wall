import hybridRecipes from '../data/hybrid_recipes.js';
import { HybridEngine } from './hybrid_engine.js';

// 杂交能源等级配置（不再需要升级实验室）
const ENERGY_GRADES = {
  blue: { level: 0, fusionCount: 2, name: '蓝色能源' },
  purple: { level: 1, fusionCount: 3, name: '紫色能源' },
  gold: { level: 2, fusionCount: 4, name: '金色能源' },
  red: { level: 3, fusionCount: 5, name: '红色能源' }
};

const MUTATION_REFRESH_COST = 3000;
const MAX_MUTATION_REFRESHES = 2;

export class Lab {
  constructor(game) {
    this.game = game;
    this.hybridEngine = new HybridEngine(game);
    this.mutationRefreshes = {};
    // 玩家拥有的植物库存（用于杂交消耗）
    // 格式: { plantId: count }
    this.plantInventory = {};
  }

  // 初始化植物库存（基于已解锁植物）
  initInventory() {
    if (!this.game.unlockedPlants) return;
    // 库存由玩家获得的植物决定
    // unlockedPlants 只包含唯一ID，每种植物初始库存为1
    for (const plantId of this.game.unlockedPlants) {
      const data = this.game.plantData?.[plantId];
      // 只为非杂交、非特殊植物初始化库存
      if (data && !data.is_hybrid && !data.is_special) {
        // 仅对尚未加入库存的植物初始化（已消耗的植物库存为0，不重置）
        if (this.plantInventory[plantId] === undefined) {
          this.plantInventory[plantId] = 1;
        }
      }
    }
  }

  // 同步库存与玩家拥有的植物（每次进入实验室时调用）
  // 注意：syncInventory 只为新解锁的植物添加库存，不会恢复已消耗的植物
  syncInventory() {
    if (!this.game.unlockedPlants) return;
    // 仅对新解锁的植物初始化库存（已消耗的植物库存为0，不重置）
    for (const plantId of this.game.unlockedPlants) {
      const data = this.game.plantData?.[plantId];
      if (data && !data.is_hybrid && !data.is_special) {
        if (this.plantInventory[plantId] === undefined) {
          this.plantInventory[plantId] = 1;
        }
      }
    }
    // 清理已不在 unlockedPlants 中的植物库存（避免旧存档残留）
    for (const plantId in this.plantInventory) {
      if (this.plantInventory[plantId] > 0) {
        const data = this.game.plantData?.[plantId];
        // 如果植物数据不存在或是杂交/特殊植物，清理库存
        if (!data || data.is_hybrid || data.is_special) {
          delete this.plantInventory[plantId];
        }
      }
    }
  }

  // 添加植物到库存（玩家获得新植物时调用）
  addPlant(plantId, count = 1) {
    if (!this.plantInventory[plantId]) {
      this.plantInventory[plantId] = 0;
    }
    this.plantInventory[plantId] += count;
  }

  // 获取植物库存数量
  getPlantCount(plantId) {
    return this.plantInventory[plantId] || 0;
  }

  // 获取所有可用的植物（库存>0且非杂交植物、非特殊植物）
  getAvailablePlants() {
    const available = [];
    for (const plantId in this.plantInventory) {
      if (this.plantInventory[plantId] > 0) {
        const data = this.game.plantData?.[plantId];
        // 排除杂交植物（不能二次杂交）和特殊植物（不可杂交）
        if (data && !data.is_hybrid && !data.is_special && data.can_hybridize !== false) {
          available.push({
            id: plantId,
            name: data.name_cn || plantId,
            count: this.plantInventory[plantId]
          });
        }
      }
    }
    return available;
  }

  // 检查是否有足够的能源进行杂交
  canFuse(energyGrade) {
    const gradeConfig = ENERGY_GRADES[energyGrade];
    if (!gradeConfig) {
      return { canFuse: false, reason: '无效的能源等级' };
    }

    const energyCost = this._getEnergyCost(energyGrade);
    const currentEnergy = (this.game.energy && this.game.energy[energyGrade]) || 0;

    if (currentEnergy < energyCost) {
      return { 
        canFuse: false, 
        reason: `${gradeConfig.name}不足（需要${energyCost}，当前${currentEnergy}）` 
      };
    }

    return { canFuse: true, cost: energyCost };
  }

  // 检查两株植物是否可以杂交（包含库存检查）
  canFusePlants(plantAId, plantBId) {
    // 检查库存
    if (this.getPlantCount(plantAId) <= 0) {
      return { canFuse: false, reason: '植物A库存不足' };
    }
    if (this.getPlantCount(plantBId) <= 0) {
      return { canFuse: false, reason: '植物B库存不足' };
    }

    // 同种植物不能杂交
    if (plantAId === plantBId) {
      // 但如果库存>=2，允许同种杂交？不，根据设计同种不能杂交
      if (this.getPlantCount(plantAId) < 2) {
        return { canFuse: false, reason: '同种植物库存不足' };
      }
      return { canFuse: false, reason: '同种植物不能杂交' };
    }

    // 获取植物数据
    const plantA = this.game.plantData?.[plantAId];
    const plantB = this.game.plantData?.[plantBId];
    if (!plantA || !plantB) {
      return { canFuse: false, reason: '植物数据不存在' };
    }

    // 使用引擎检查可杂交性
    return this.hybridEngine.canFuse(plantA, plantB);
  }

  // 执行杂交（消耗能源+父本植物）
  // 支持二元（2株）、三元（3株）、四元（4株）和五元（5株）杂交
  fuse(plantAId, plantBId, energyGrade, plantCId, plantDId, plantEId) {
    // 检查能源
    const energyCheck = this.canFuse(energyGrade);
    if (!energyCheck.canFuse) {
      return { error: energyCheck.reason };
    }

    // 五元杂交
    if (plantEId) {
      return this._fusePenta(plantAId, plantBId, plantCId, plantDId, plantEId, energyGrade, energyCheck);
    }

    // 四元杂交
    if (plantDId) {
      return this._fuseQuad(plantAId, plantBId, plantCId, plantDId, energyGrade, energyCheck);
    }

    // 三元杂交
    if (plantCId) {
      return this._fuseTriple(plantAId, plantBId, plantCId, energyGrade, energyCheck);
    }

    // 二元杂交
    // 检查植物可杂交性
    const plantCheck = this.canFusePlants(plantAId, plantBId);
    if (!plantCheck.canFuse) {
      return { error: plantCheck.reason, isFailure: plantCheck.isFailure };
    }

    // 获取植物数据
    const plantA = this.game.plantData[plantAId];
    const plantB = this.game.plantData[plantBId];

    // 消耗能源
    if (this.game.energy) {
      this.game.energy[energyGrade] -= energyCheck.cost;
    }

    // 消耗父本植物
    this.plantInventory[plantAId]--;
    this.plantInventory[plantBId]--;

    // 执行杂交
    const rawResult = this.hybridEngine.fuse([plantA, plantB], energyGrade);
    if (rawResult.error) {
      // 杂交失败，退还植物（但不退还能源）
      this.plantInventory[plantAId]++;
      this.plantInventory[plantBId]++;
      return rawResult;
    }

    // 规范化为 _registerHybridPlant 和 UI 期望的格式
    const result = this._normalizeHybridResult(rawResult, 2);

    // 记录刷新次数
    this.mutationRefreshes[result.instanceId] = 0;

    // 将杂交植物添加到游戏数据
    this._registerHybridPlant(result);

    return result;
  }

  // 三元杂交内部实现
  _fuseTriple(plantAId, plantBId, plantCId, energyGrade, energyCheck) {
    // 检查库存
    if (this.getPlantCount(plantAId) <= 0) {
      return { error: '植物A库存不足' };
    }
    if (this.getPlantCount(plantBId) <= 0) {
      return { error: '植物B库存不足' };
    }
    if (this.getPlantCount(plantCId) <= 0) {
      return { error: '植物C库存不足' };
    }

    // 三株必须互不相同
    if (plantAId === plantBId || plantAId === plantCId || plantBId === plantCId) {
      return { error: '三元杂交需要3种不同的植物' };
    }

    // 获取植物数据
    const plantA = this.game.plantData[plantAId];
    const plantB = this.game.plantData[plantBId];
    const plantC = this.game.plantData[plantCId];
    if (!plantA || !plantB || !plantC) {
      return { error: '植物数据不存在' };
    }

    // 预检查三元杂交兼容性（避免浪费能源）
    const compatCheck = this.hybridEngine.canFuseTriple(plantA, plantB, plantC);
    if (!compatCheck.canFuse) {
      return { error: compatCheck.reason };
    }

    // 预检查能源等级是否支持三元杂交
    if (!this.hybridEngine.canTripleFuse(energyGrade)) {
      return { error: '三元杂交需要紫色及以上能源' };
    }

    // 检查能源是否足够支付双倍消耗
    const tripleCost = energyCheck.cost * 2;
    if (this.game.energy && this.game.energy[energyGrade] < tripleCost) {
      return { error: '三元杂交需要更多能源' };
    }

    // 消耗能源（三元杂交消耗更多能源）
    if (this.game.energy) {
      this.game.energy[energyGrade] -= tripleCost;
    }

    // 消耗父本植物
    this.plantInventory[plantAId]--;
    this.plantInventory[plantBId]--;
    this.plantInventory[plantCId]--;

    // 执行三元杂交
    const rawResult = this.hybridEngine.fuse([plantA, plantB, plantC], energyGrade);
    if (rawResult.error) {
      // 杂交失败，退还植物和能源
      this.plantInventory[plantAId]++;
      this.plantInventory[plantBId]++;
      this.plantInventory[plantCId]++;
      if (this.game.energy) {
        this.game.energy[energyGrade] += tripleCost;
      }
      return rawResult;
    }

    // 规范化为 _registerHybridPlant 和 UI 期望的格式
    const result = this._normalizeHybridResult(rawResult, 3);

    // 记录刷新次数
    this.mutationRefreshes[result.instanceId] = 0;

    // 将杂交植物添加到游戏数据
    this._registerHybridPlant(result);

    return result;
  }

  // 四元杂交内部实现
  _fuseQuad(plantAId, plantBId, plantCId, plantDId, energyGrade, energyCheck) {
    // 检查库存
    if (this.getPlantCount(plantAId) <= 0) {
      return { error: '植物A库存不足' };
    }
    if (this.getPlantCount(plantBId) <= 0) {
      return { error: '植物B库存不足' };
    }
    if (this.getPlantCount(plantCId) <= 0) {
      return { error: '植物C库存不足' };
    }
    if (this.getPlantCount(plantDId) <= 0) {
      return { error: '植物D库存不足' };
    }

    // 四株必须互不相同
    const ids = [plantAId, plantBId, plantCId, plantDId];
    if (new Set(ids).size !== 4) {
      return { error: '四元杂交需要4种不同的植物' };
    }

    // 获取植物数据
    const plantA = this.game.plantData[plantAId];
    const plantB = this.game.plantData[plantBId];
    const plantC = this.game.plantData[plantCId];
    const plantD = this.game.plantData[plantDId];
    if (!plantA || !plantB || !plantC || !plantD) {
      return { error: '植物数据不存在' };
    }

    // 预检查四元杂交兼容性（避免浪费能源）
    const compatCheck = this.hybridEngine.canFuseQuad(plantA, plantB, plantC, plantD);
    if (!compatCheck.canFuse) {
      return { error: compatCheck.reason };
    }

    // 预检查能源等级是否支持四元杂交
    if (!this.hybridEngine.canQuadFuse(energyGrade)) {
      return { error: '四元杂交需要金色及以上能源' };
    }

    // 检查能源是否足够支付三倍消耗
    const quadCost = energyCheck.cost * 3;
    if (this.game.energy && this.game.energy[energyGrade] < quadCost) {
      return { error: '四元杂交需要更多能源' };
    }

    // 消耗能源（四元杂交消耗三倍能源）
    if (this.game.energy) {
      this.game.energy[energyGrade] -= quadCost;
    }

    // 消耗父本植物
    this.plantInventory[plantAId]--;
    this.plantInventory[plantBId]--;
    this.plantInventory[plantCId]--;
    this.plantInventory[plantDId]--;

    // 执行四元杂交
    const rawResult = this.hybridEngine.fuse([plantA, plantB, plantC, plantD], energyGrade);
    if (rawResult.error) {
      // 杂交失败，退还植物和能源
      this.plantInventory[plantAId]++;
      this.plantInventory[plantBId]++;
      this.plantInventory[plantCId]++;
      this.plantInventory[plantDId]++;
      if (this.game.energy) {
        this.game.energy[energyGrade] += quadCost;
      }
      return rawResult;
    }

    // 规范化为 _registerHybridPlant 和 UI 期望的格式
    const result = this._normalizeHybridResult(rawResult, 4);

    // 记录刷新次数
    this.mutationRefreshes[result.instanceId] = 0;

    // 将杂交植物添加到游戏数据
    this._registerHybridPlant(result);

    return result;
  }

  // 五元杂交内部实现
  _fusePenta(plantAId, plantBId, plantCId, plantDId, plantEId, energyGrade, energyCheck) {
    // 检查库存
    if (this.getPlantCount(plantAId) <= 0) {
      return { error: '植物A库存不足' };
    }
    if (this.getPlantCount(plantBId) <= 0) {
      return { error: '植物B库存不足' };
    }
    if (this.getPlantCount(plantCId) <= 0) {
      return { error: '植物C库存不足' };
    }
    if (this.getPlantCount(plantDId) <= 0) {
      return { error: '植物D库存不足' };
    }
    if (this.getPlantCount(plantEId) <= 0) {
      return { error: '植物E库存不足' };
    }

    // 五株必须互不相同
    const ids = [plantAId, plantBId, plantCId, plantDId, plantEId];
    if (new Set(ids).size !== 5) {
      return { error: '五元杂交需要5种不同的植物' };
    }

    // 获取植物数据
    const plantA = this.game.plantData[plantAId];
    const plantB = this.game.plantData[plantBId];
    const plantC = this.game.plantData[plantCId];
    const plantD = this.game.plantData[plantDId];
    const plantE = this.game.plantData[plantEId];
    if (!plantA || !plantB || !plantC || !plantD || !plantE) {
      return { error: '植物数据不存在' };
    }

    // 预检查五元杂交兼容性（避免浪费能源）
    const compatCheck = this.hybridEngine.canFusePenta(plantA, plantB, plantC, plantD, plantE);
    if (!compatCheck.canFuse) {
      return { error: compatCheck.reason };
    }

    // 预检查能源等级是否支持五元杂交
    if (!this.hybridEngine.canPentaFuse(energyGrade)) {
      return { error: '五元杂交需要红色能源' };
    }

    // 检查能源是否足够支付四倍消耗
    const pentaCost = energyCheck.cost * 4;
    if (this.game.energy && this.game.energy[energyGrade] < pentaCost) {
      return { error: '五元杂交需要更多能源' };
    }

    // 消耗能源（五元杂交消耗四倍能源）
    if (this.game.energy) {
      this.game.energy[energyGrade] -= pentaCost;
    }

    // 消耗父本植物
    this.plantInventory[plantAId]--;
    this.plantInventory[plantBId]--;
    this.plantInventory[plantCId]--;
    this.plantInventory[plantDId]--;
    this.plantInventory[plantEId]--;

    // 执行五元杂交
    const rawResult = this.hybridEngine.fuse([plantA, plantB, plantC, plantD, plantE], energyGrade);
    if (rawResult.error) {
      // 杂交失败，退还植物和能源
      this.plantInventory[plantAId]++;
      this.plantInventory[plantBId]++;
      this.plantInventory[plantCId]++;
      this.plantInventory[plantDId]++;
      this.plantInventory[plantEId]++;
      if (this.game.energy) {
        this.game.energy[energyGrade] += pentaCost;
      }
      return rawResult;
    }

    // 规范化为 _registerHybridPlant 和 UI 期望的格式
    const result = this._normalizeHybridResult(rawResult, 5);

    // 记录刷新次数
    this.mutationRefreshes[result.instanceId] = 0;

    // 将杂交植物添加到游戏数据
    this._registerHybridPlant(result);

    return result;
  }

  // 预览三元杂交结果
  previewTripleFusion(plantAId, plantBId, plantCId, energyGrade) {
    const plantA = this.game.plantData?.[plantAId];
    const plantB = this.game.plantData?.[plantBId];
    const plantC = this.game.plantData?.[plantCId];
    if (!plantA || !plantB || !plantC) {
      return { error: '植物数据不存在' };
    }
    return this.hybridEngine.previewTripleFusion(plantA, plantB, plantC, energyGrade);
  }

  // 预览四元杂交结果
  previewQuadFusion(plantAId, plantBId, plantCId, plantDId, energyGrade) {
    const plantA = this.game.plantData?.[plantAId];
    const plantB = this.game.plantData?.[plantBId];
    const plantC = this.game.plantData?.[plantCId];
    const plantD = this.game.plantData?.[plantDId];
    if (!plantA || !plantB || !plantC || !plantD) {
      return { error: '植物数据不存在' };
    }
    return this.hybridEngine.previewQuadFusion(plantA, plantB, plantC, plantD, energyGrade);
  }

  // 预览五元杂交结果
  previewPentaFusion(plantAId, plantBId, plantCId, plantDId, plantEId, energyGrade) {
    const plantA = this.game.plantData?.[plantAId];
    const plantB = this.game.plantData?.[plantBId];
    const plantC = this.game.plantData?.[plantCId];
    const plantD = this.game.plantData?.[plantDId];
    const plantE = this.game.plantData?.[plantEId];
    if (!plantA || !plantB || !plantC || !plantD || !plantE) {
      return { error: '植物数据不存在' };
    }
    return this.hybridEngine.previewPentaFusion(plantA, plantB, plantC, plantD, plantE, energyGrade);
  }

  // 将 hybridEngine.fuse() 的返回值规范化为 _registerHybridPlant 和 UI 期望的格式
  // fuse() 返回驼峰命名+嵌套stats，此处转换为蛇形命名+扁平结构，并生成缺失字段
  _normalizeHybridResult(rawResult, plantCount) {
    if (!rawResult || rawResult.error) return rawResult;

    const fusionType = plantCount === 5 ? 'penta'
      : plantCount === 4 ? 'quad'
      : plantCount === 3 ? 'triple'
      : 'dual';

    const visualScales = {
      dual:   { shape: 'hybrid_dual_head',   scale: 0.70 },
      triple: { shape: 'hybrid_triple_head', scale: 0.55 },
      quad:   { shape: 'hybrid_quad_head',   scale: 0.45 },
      penta:  { shape: 'hybrid_penta_head',  scale: 0.35 }
    };

    const stats = rawResult.stats || {};
    const genePool = rawResult.genePool || [];
    const parents = rawResult.parents || [];

    return {
      instanceId: `hybrid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name_cn: rawResult.name || '未知杂交体',
      name_en: rawResult.name || 'Unknown Hybrid',
      gene_pool: genePool[0] || 'hybrid',
      genePool: genePool,
      category: 'hybrid',
      hp: stats.hp || 0,
      damage: stats.damage || 0,
      attack_speed: stats.attackSpeed || 0,
      range: stats.range || 0,
      cost: stats.cost || 0,
      special: stats.special || '无特殊能力',
      cooldown: 7.5,
      parents: parents,
      mutations: rawResult.mutations || [],
      grade: rawResult.grade || 'blue',
      isRare: (rawResult.mutations && rawResult.mutations.length > 0),
      fusionType: fusionType,
      visual: {
        ...visualScales[fusionType],
        parentIds: parents
      }
    };
  }

  // 注册杂交植物到游戏数据
  _registerHybridPlant(hybridResult) {
    if (!this.game.plantData) this.game.plantData = {};
    if (!this.game.unlockedPlants) this.game.unlockedPlants = [];
    if (!this.game.hybridPlants) this.game.hybridPlants = [];

    // 使用instanceId作为唯一标识
    const plantId = hybridResult.instanceId;

    // 添加到植物数据
    this.game.plantData[plantId] = {
      id: plantId,
      name_cn: hybridResult.name_cn,
      name_en: hybridResult.name_en,
      gene_pool: hybridResult.gene_pool,
      category: hybridResult.category,
      cost: hybridResult.cost,
      hp: hybridResult.hp,
      cooldown: hybridResult.cooldown || 7.5,
      damage: hybridResult.damage,
      attack_speed: hybridResult.attack_speed,
      range: hybridResult.range,
      special: hybridResult.special,
      is_hybrid: true,  // 标记为杂交植物，禁止二次杂交
      parents: hybridResult.parents,
      isRare: hybridResult.isRare,
      fusionType: hybridResult.fusionType || 'dual', // 杂交类型：dual/triple
      mutations: hybridResult.mutations,
      visual: hybridResult.visual  // 绘制信息（双头/三头并排）
    };

    // 添加到已解锁植物
    if (!this.game.unlockedPlants.includes(plantId)) {
      this.game.unlockedPlants.push(plantId);
    }

    // 添加到杂交植物列表
    this.game.hybridPlants.push(hybridResult);

    // 记录最近一次杂交的植物（供 gene_scrambler 遗物重投使用）
    this._lastHybridPlant = hybridResult;
  }

  _getEnergyCost(energyGrade) {
    const costs = {
      blue: 1,
      purple: 2,
      gold: 3,
      red: 5
    };
    return costs[energyGrade] || 1;
  }

  // 获取指定能源等级需要的植物数量
  getFusionSlots(energyGrade) {
    const gradeConfig = ENERGY_GRADES[energyGrade];
    return gradeConfig ? gradeConfig.fusionCount : 2;
  }

  // 刷新突变（花费金币）
  refreshMutation(hybridPlant) {
    if (!hybridPlant || !hybridPlant.instanceId) {
      return { error: '无效的杂交植物' };
    }

    const refreshCount = this.mutationRefreshes[hybridPlant.instanceId] || 0;
    if (refreshCount >= MAX_MUTATION_REFRESHES) {
      return { error: '已达到最大刷新次数' };
    }

    if (this.game) {
      const cost = MUTATION_REFRESH_COST * (refreshCount + 1);
      // 应用 lab_refresh_free 遗物加成（lab_upgrade 等）：每株植物前 N 次免费
      const freeCount = (this.game._getLabRefreshFree && this.game._getLabRefreshFree()) || 0;
      if (refreshCount < freeCount) {
        // 免费刷新，不扣金币
      } else {
        if ((this.game.coins || 0) < cost) {
          return { error: '金币不足' };
        }
        this.game.coins -= cost;
      }
    }

    this.mutationRefreshes[hybridPlant.instanceId] = refreshCount + 1;

    const newMutation = this.hybridEngine.rollMutation(hybridPlant.grade || 'blue');
    if (newMutation) {
      let mutationResult = null;
      // 先逆向移除旧变异效果，再应用新变异
      const plantData = this.game.plantData?.[hybridPlant.instanceId];
      if (plantData) {
        // 逆向移除旧变异的属性加成
        const oldMutations = plantData.mutations || [];
        for (const oldMut of oldMutations) {
          this.hybridEngine.revertMutation(plantData, oldMut.id);
        }
        // 同步逆向到 hybridPlant 对象上的属性
        // 注意：hybridPlant 上的属性是初始值，plantData 上的属性已被变异修改
        // 我们需要让 hybridPlant 的属性与 plantData 保持一致
        hybridPlant.damage = plantData.damage;
        hybridPlant.hp = plantData.hp;
        hybridPlant.attack_speed = plantData.attack_speed;
        hybridPlant.range = plantData.range;

        // 应用新变异
        const newMutations = [];
        mutationResult = this.hybridEngine.applyMutation(plantData, newMutation);
        if (mutationResult) {
          newMutations.push(mutationResult);
        }
        plantData.mutations = newMutations;
        hybridPlant.mutations = newMutations;
        // 同步属性到 hybridPlant
        hybridPlant.damage = plantData.damage;
        hybridPlant.hp = plantData.hp;
        hybridPlant.attack_speed = plantData.attack_speed;
        hybridPlant.range = plantData.range;
      }

      return {
        success: true,
        newMutations: mutationResult ? [mutationResult] : [],
        refreshesLeft: MAX_MUTATION_REFRESHES - this.mutationRefreshes[hybridPlant.instanceId]
      };
    }

    return {
      success: true,
      newMutations: [],
      refreshesLeft: MAX_MUTATION_REFRESHES - this.mutationRefreshes[hybridPlant.instanceId]
    };
  }

  // 基因搅拌器（gene_scrambler 遗物）：免费重投上次杂交的变异结果
  // 不消耗金币、不增加刷新次数计数
  rerollLastHybrid() {
    const hybridPlant = this._lastHybridPlant;
    if (!hybridPlant || !hybridPlant.instanceId) {
      return { error: '没有可重投的杂交植物' };
    }
    const newMutation = this.hybridEngine.rollMutation(hybridPlant.grade || 'blue');
    if (!newMutation) {
      return { error: '本次未获得新变异' };
    }
    let mutationResult = null;
    const plantData = this.game.plantData?.[hybridPlant.instanceId];
    if (plantData) {
      // 逆向移除旧变异属性加成
      const oldMutations = plantData.mutations || [];
      for (const oldMut of oldMutations) {
        this.hybridEngine.revertMutation(plantData, oldMut.id);
      }
      // 同步属性
      hybridPlant.damage = plantData.damage;
      hybridPlant.hp = plantData.hp;
      hybridPlant.attack_speed = plantData.attack_speed;
      hybridPlant.range = plantData.range;

      // 应用新变异
      const newMutations = [];
      mutationResult = this.hybridEngine.applyMutation(plantData, newMutation);
      if (mutationResult) newMutations.push(mutationResult);
      plantData.mutations = newMutations;
      hybridPlant.mutations = newMutations;
      hybridPlant.damage = plantData.damage;
      hybridPlant.hp = plantData.hp;
      hybridPlant.attack_speed = plantData.attack_speed;
      hybridPlant.range = plantData.range;
    } else {
      // 兜底：仅在 hybridPlant 上应用
      mutationResult = this.hybridEngine.applyMutation(
        { damage: hybridPlant.damage, hp: hybridPlant.hp, attackSpeed: hybridPlant.attack_speed, range: hybridPlant.range },
        newMutation
      );
      if (mutationResult) hybridPlant.mutations = [mutationResult];
    }

    return {
      success: true,
      newMutations: mutationResult ? [mutationResult] : [],
      plantName: hybridPlant.name || hybridPlant.instanceId
    };
  }

  // 清洗杂交植物词条（锻造功能）
  cleanseHybrid(hybridPlant) {
    if (!hybridPlant || !hybridPlant.instanceId) {
      return { error: '无效的杂交植物' };
    }

    const cleanseCost = 5000;
    if (this.game) {
      if ((this.game.coins || 0) < cleanseCost) {
        return { error: '金币不足（需要5000金币）' };
      }
      this.game.coins -= cleanseCost;
    }

    // 逆向移除所有变异的属性加成
    const plantData = this.game.plantData?.[hybridPlant.instanceId];
    const oldMutations = (plantData ? plantData.mutations : hybridPlant.mutations) || [];
    if (plantData) {
      for (const oldMut of oldMutations) {
        this.hybridEngine.revertMutation(plantData, oldMut.id);
      }
      plantData.mutations = [];
    }
    // 同步属性到 hybridPlant
    if (plantData) {
      hybridPlant.damage = plantData.damage;
      hybridPlant.hp = plantData.hp;
      hybridPlant.attack_speed = plantData.attack_speed;
      hybridPlant.range = plantData.range;
    }
    hybridPlant.mutations = [];

    return {
      success: true,
      message: '已成功清洗杂交植物词条'
    };
  }

  // 预览杂交结果（不消耗资源）
  previewFusion(plantAId, plantBId) {
    const plantA = this.game.plantData?.[plantAId];
    const plantB = this.game.plantData?.[plantBId];
    if (!plantA || !plantB) {
      return { error: '植物数据不存在' };
    }
    return this.hybridEngine.previewFusion(plantA, plantB);
  }

  serialize() {
    return {
      mutationRefreshes: { ...this.mutationRefreshes },
      plantInventory: { ...this.plantInventory },
      discoveredFailures: this.hybridEngine.serialize()
    };
  }

  deserialize(data) {
    if (data) {
      this.mutationRefreshes = data.mutationRefreshes || {};
      // 恢复保存的库存数据（包含已消耗状态）
      // 存档隔离：只恢复当前存档 unlockedPlants 中的植物，避免旧存档残留
      const savedInventory = data.plantInventory || {};
      this.plantInventory = {};
      const unlockedSet = new Set(this.game.unlockedPlants || []);
      for (const plantId in savedInventory) {
        // 只恢复当前存档已解锁的植物（基础植物）
        if (unlockedSet.has(plantId)) {
          this.plantInventory[plantId] = savedInventory[plantId];
        }
      }
      if (data.discoveredFailures) {
        this.hybridEngine.deserialize(data.discoveredFailures);
      }
    } else {
      this.plantInventory = {};
    }
    // 基于当前 unlockedPlants 补充新解锁的植物（不覆盖已消耗的库存）
    this.initInventory();
  }
}
