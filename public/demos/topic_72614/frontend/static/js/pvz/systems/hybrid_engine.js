import hybridConfig from '../data/hybrids.js';

// 品阶加成：杂交结果会按品阶整体增强，确保杂交植物强于亲本
// stat: 生命/伤害倍率；speed: 攻速/产出间隔倍率（越小越快）；range: 射程额外格数；costMul: 费用倍率
const GRADE_BONUS = {
  blue:   { stat: 1.15, speed: 0.90, range: 0, costMul: 0.95, maxMutations: 1, guaranteeMutation: false },
  purple: { stat: 1.35, speed: 0.80, range: 1, costMul: 0.92, maxMutations: 2, guaranteeMutation: true },
  gold:   { stat: 1.60, speed: 0.70, range: 1, costMul: 0.90, maxMutations: 2, guaranteeMutation: true },
  red:    { stat: 1.90, speed: 0.60, range: 2, costMul: 0.88, maxMutations: 3, guaranteeMutation: true }
};

const GRADE_ORDER = ['blue', 'purple', 'gold', 'red'];

export class HybridEngine {
  constructor(game) {
    this.game = game;
  }

  fuse(plants, energyGrade) {
    const gradeConfig = hybridConfig.energyGrades[energyGrade];
    if (!gradeConfig) {
      return { error: '无效的能量等级' };
    }

    if (!plants || plants.length < 2) {
      return { error: '至少需要2株植物进行杂交' };
    }

    if (plants.length !== gradeConfig.fusionCount) {
      return { error: `${energyGrade}级能量需要${gradeConfig.fusionCount}株植物` };
    }

    const genePool = this._collectGenePool(plants);

    const dominantPlant = this._selectDominant(plants);
    const recessiveGenes = this._selectRecessive(plants, dominantPlant, gradeConfig);
    const crossGenes = this._rollCrossGenes(genePool, gradeConfig);

    const stats = this.calculateStats(plants, energyGrade);

    // 高品阶可触发多个变异，紫色及以上保底至少 1 个变异
    const mutations = this._rollMutations(stats, energyGrade);

    this._guaranteeCoreAttribute(stats, plants);

    const name = this.generateHybridName(plants);

    return {
      name,
      parents: plants.map(p => p.id || p.name_cn),
      genePool: [...new Set([...genePool, ...recessiveGenes, ...crossGenes])],
      stats: {
        hp: Math.round(stats.hp),
        damage: Math.round(stats.damage),
        attackSpeed: Math.round(stats.attackSpeed * 100) / 100,
        range: Math.round(stats.range),
        cost: Math.round(stats.cost),
        special: stats.special
      },
      mutations,
      grade: energyGrade
    };
  }

  _collectGenePool(plants) {
    const pool = new Set();
    for (const plant of plants) {
      if (plant.gene_pool) {
        pool.add(plant.gene_pool);
      }
    }
    return [...pool];
  }

  _selectDominant(plants) {
    const roll = Math.random();
    if (roll < hybridConfig.hybridFormulas.dominantProb) {
      return plants[0];
    }
    return plants[Math.floor(Math.random() * plants.length)];
  }

  _selectRecessive(plants, dominant, gradeConfig) {
    const recessiveGenes = [];
    const recessiveProb = hybridConfig.hybridFormulas.recessiveProb;

    for (const plant of plants) {
      if (plant === dominant) continue;
      if (plant.gene_pool && Math.random() < recessiveProb) {
        recessiveGenes.push(plant.gene_pool);
      }
    }
    return recessiveGenes;
  }

  _rollCrossGenes(genePool, gradeConfig) {
    const crossGenes = [];
    const allPools = Object.keys(hybridConfig.genePools);
    const crossProb = gradeConfig.crossGeneProb;

    if (Math.random() < crossProb) {
      const available = allPools.filter(g => !genePool.includes(g));
      if (available.length > 0) {
        crossGenes.push(available[Math.floor(Math.random() * available.length)]);
      }
    }
    return crossGenes;
  }

  generateHybridName(parents) {
    if (!parents || parents.length === 0) return '未知杂交体';

    const prefixes = parents.map(p => {
      const name = p.name_cn || p.name_en || '未知';
      return name.substring(0, Math.ceil(name.length / 2));
    });

    const suffixes = ['战士', '守卫', '使者', '猎手', '领主', '使者', '先驱', '守望者', '征服者', '幻影'];

    const mainPrefix = prefixes[0];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];

    if (parents.length >= 3) {
      const subPrefix = prefixes[1] || '';
      return `${mainPrefix}${subPrefix}${suffix}`;
    }

    return `${mainPrefix}${suffix}`;
  }

  calculateStats(parents, grade) {
    const gradeConfig = hybridConfig.energyGrades[grade];
    const fluctuation = gradeConfig ? gradeConfig.valueFluctuation : 0.1;
    const bonus = GRADE_BONUS[grade] || GRADE_BONUS.blue;

    // 取每个属性的最强亲本值（而非加权平均），保证杂交至少不弱于最强亲本
    let maxHp = 0;
    let maxDamage = 0;
    let minAttackSpeed = Infinity;   // 攻速 / 产出间隔：越小越快
    let maxRange = 0;
    let maxCost = 0;
    const specials = [];

    for (const plant of parents) {
      if ((plant.hp || 0) > maxHp) maxHp = plant.hp || 0;
      if ((plant.damage || 0) > maxDamage) maxDamage = plant.damage || 0;
      if ((plant.attack_speed || 0) > 0 && plant.attack_speed < minAttackSpeed) {
        minAttackSpeed = plant.attack_speed;
      }
      if ((plant.range || 0) > maxRange) maxRange = plant.range || 0;
      if ((plant.cost || 0) > maxCost) maxCost = plant.cost || 0;

      // 合并所有亲本特性（去重），而非只随机保留一个
      const sp = plant.special;
      if (sp && sp !== '无特殊能力' && sp !== '无' && !specials.includes(sp)) {
        specials.push(sp);
      }
    }

    const hasAttackSpeed = minAttackSpeed !== Infinity;

    // 仅正向波动：杂交结果只会比最强亲本更强，不会更弱
    const positiveFluctuation = (value) => {
      if (!value) return value;
      const factor = 1 + Math.random() * fluctuation;  // [1, 1 + fluctuation]
      return value * factor;
    };

    let hp = positiveFluctuation(maxHp * bonus.stat);
    let damage = positiveFluctuation(maxDamage * bonus.stat);
    let attackSpeed = hasAttackSpeed
      ? Math.max(0.1, minAttackSpeed * bonus.speed)
      : 0;
    let range = Math.min(15, maxRange + bonus.range);
    // 费用：略低于最贵亲本（体现杂交性价比），但不低于 25
    let cost = Math.max(25, Math.round(maxCost * bonus.costMul));

    // 合并所有亲本特性为一条描述
    const special = specials.length > 0 ? specials.join(' / ') : '无特殊能力';

    return {
      hp,
      damage,
      attackSpeed,
      range,
      cost,
      special,
      specials   // 数组形式，便于后续扩展
    };
  }

  rollMutation(grade) {
    const gradeConfig = hybridConfig.energyGrades[grade];
    if (!gradeConfig) return null;

    // 应用遗物加成：hybrid_success_bonus + mutation_prob_bonus 线性叠加
    const successBonus = this.game._getRelicEffectSum
      ? this.game._getRelicEffectSum('hybrid_success_bonus')
      : 0;
    const mutationBonus = this.game._getRelicEffectSum
      ? this.game._getRelicEffectSum('mutation_prob_bonus')
      : 0;
    const effectiveProb = gradeConfig.mutationProb + successBonus + mutationBonus;

    if (Math.random() > effectiveProb) return null;

    const eligibleMutations = Object.entries(hybridConfig.mutationTypes)
      .filter(([_, mut]) => this._isGradeSufficient(grade, mut.minGrade))
      .map(([id, mut]) => ({ id, ...mut }));

    if (eligibleMutations.length === 0) return null;

    const totalWeight = eligibleMutations.reduce((sum, m) => sum + m.weight, 0);
    let roll = Math.random() * totalWeight;

    for (const mutation of eligibleMutations) {
      roll -= mutation.weight;
      if (roll <= 0) {
        return mutation.id;
      }
    }

    return eligibleMutations[eligibleMutations.length - 1].id;
  }

  _isGradeSufficient(currentGrade, minGrade) {
    const gradeOrder = ['blue', 'purple', 'gold', 'red'];
    const currentIndex = gradeOrder.indexOf(currentGrade);
    const minIndex = gradeOrder.indexOf(minGrade);
    return currentIndex >= minIndex;
  }

  applyMutation(baseStats, mutationType) {
    const mutationDef = hybridConfig.mutationTypes[mutationType];
    if (!mutationDef) return null;

    switch (mutationType) {
      case 'pierce':
        baseStats.damage *= 1.15;
        break;
      case 'attack_speed_up':
        baseStats.attackSpeed *= 0.7;
        break;
      case 'random_bullet':
        baseStats.damage *= 1.1;
        break;
      case 'hp_up':
        baseStats.hp *= 1.4;
        break;
      case 'attack_type_change':
        baseStats.damage *= 1.2;
        baseStats.attackSpeed *= 0.85;
        break;
      case 'crush_resist':
        baseStats.hp *= 1.2;
        break;
      case 'reflect_bullet':
        baseStats.hp *= 1.1;
        break;
      case 'armor_break':
        baseStats.damage *= 1.25;
        break;
      case 'range_expand':
        baseStats.range *= 1.3;
        break;
      case 'chain_attack':
        baseStats.damage *= 0.9;
        break;
      case 'self_heal':
        baseStats.hp *= 1.15;
        break;
      case 'hidden_aoe':
        baseStats.damage *= 1.1;
        baseStats.range *= 1.1;
        break;
    }

    return {
      id: mutationType,
      name_cn: mutationDef.name_cn,
      name_en: mutationDef.name_en,
      description: mutationDef.description
    };
  }

  // 多变异滚动：高品阶可叠加多个变异，紫色及以上保底至少 1 个
  _rollMutations(stats, grade) {
    const mutations = [];
    const bonus = GRADE_BONUS[grade] || GRADE_BONUS.blue;

    // 候选变异池（按品阶筛选）
    const eligibleIds = Object.entries(hybridConfig.mutationTypes)
      .filter(([_, mut]) => this._isGradeSufficient(grade, mut.minGrade))
      .map(([id]) => id);

    if (eligibleIds.length === 0) return mutations;

    const pool = [...eligibleIds];
    // chaos_seed 遗物：multi_mutation 扩展最大变异数
    const multiBonus = (this.game && this.game._getRelicEffectSum && this.game._getRelicEffectSum('multi_mutation')) || 1;
    const maxMutations = Math.min(bonus.maxMutations + (multiBonus - 1), pool.length);

    for (let i = 0; i < maxMutations; i++) {
      let mutationId = null;

      if (i === 0 && bonus.guaranteeMutation) {
        // 紫色及以上：首个变异保底必出
        mutationId = pool[Math.floor(Math.random() * pool.length)];
      } else {
        mutationId = this.rollMutation(grade);
      }

      if (!mutationId) continue;

      // 去重：若已存在则从剩余池中补一个
      if (mutations.some(m => m.id === mutationId)) {
        const remaining = pool.filter(id => !mutations.some(m => m.id === id));
        if (remaining.length === 0) break;
        mutationId = remaining[Math.floor(Math.random() * remaining.length)];
      }

      const applied = this.applyMutation(stats, mutationId);
      if (applied) mutations.push(applied);
    }

    // 终极保底：紫色及以上若仍未获得任何变异，强制补一个
    if (mutations.length === 0 && bonus.guaranteeMutation) {
      const forcedId = pool[Math.floor(Math.random() * pool.length)];
      const applied = this.applyMutation(stats, forcedId);
      if (applied) mutations.push(applied);
    }

    return mutations;
  }

  _guaranteeCoreAttribute(stats, plants) {
    if (!hybridConfig.hybridFormulas.guaranteeOneCore) return;
    if (!plants || plants.length === 0) return;

    // 以所有亲本中的最强值作为保底基准（而非仅 parents[0]）
    const strongest = plants.reduce((best, p) => {
      if (!best) return p;
      return {
        hp: Math.max(best.hp || 0, p.hp || 0),
        damage: Math.max(best.damage || 0, p.damage || 0),
        attack_speed: Math.min(
          (best.attack_speed && best.attack_speed > 0) ? best.attack_speed : Infinity,
          (p.attack_speed && p.attack_speed > 0) ? p.attack_speed : Infinity
        ),
        range: Math.max(best.range || 0, p.range || 0)
      };
    }, null);

    if (!strongest) return;

    // 取主导亲本（parents[0]）的基因池决定保底哪个核心属性
    const dominant = plants[0];
    const genePool = hybridConfig.genePools[dominant.gene_pool];
    if (!genePool) return;

    const coreAttr = genePool.coreAttribute;
    switch (coreAttr) {
      case 'ranged_attack':
      case 'aoe_damage':
      case 'penetrate_attack':
      case 'homing_attack':
      case 'arc_attack':
      case 'fire_damage':
      case 'pierce_damage':
      case 'metal_attract':
        // 攻击类核心：伤害不低于最强亲本
        if (stats.damage < strongest.damage) stats.damage = strongest.damage;
        break;
      case 'sun_production':
        // 产能类核心：产出间隔不慢于最快亲本
        if (isFinite(strongest.attack_speed) && stats.attackSpeed > strongest.attack_speed) {
          stats.attackSpeed = strongest.attack_speed;
        }
        break;
      case 'high_hp':
      case 'knockback_resist':
        // 防御类核心：生命不低于最肉亲本
        if (stats.hp < strongest.hp) stats.hp = strongest.hp;
        break;
      case 'slow_effect':
      case 'freeze_chance':
        // 控制类核心：保留控制能力的同时不丢失伤害
        if (stats.damage < strongest.damage) stats.damage = strongest.damage;
        break;
      case 'instant_kill':
        // 吞噬类核心：伤害不低于最强亲本
        if (stats.damage < strongest.damage) stats.damage = strongest.damage;
        break;
      default:
        if (stats.damage < strongest.damage) stats.damage = strongest.damage;
        break;
    }
  }

  getAvailableFusions(ownedPlants, labLevel) {
    const gradeConfig = hybridConfig.energyGrades[labLevel];
    if (!gradeConfig) return [];

    const fusionCount = gradeConfig.fusionCount;
    if (!ownedPlants || ownedPlants.length < fusionCount) return [];

    const results = [];
    const combos = this._combinations(ownedPlants, fusionCount);

    for (const combo of combos) {
      const validation = this.validateFusion(combo, labLevel, labLevel);
      if (validation.valid) {
        results.push({
          plants: combo,
          grade: labLevel,
          estimatedResult: this._estimateResult(combo, labLevel)
        });
      }
    }

    return results;
  }

  validateFusion(plants, energyGrade, labLevel) {
    const gradeConfig = hybridConfig.energyGrades[energyGrade];
    if (!gradeConfig) {
      return { valid: false, reason: '无效的能量等级' };
    }

    const labGradeConfig = hybridConfig.energyGrades[labLevel];
    if (!labGradeConfig) {
      return { valid: false, reason: '实验室等级不足' };
    }

    const labFusionCount = labGradeConfig.fusionCount;
    if (plants.length > labFusionCount) {
      return { valid: false, reason: `实验室等级仅支持${labFusionCount}株融合` };
    }

    if (plants.length !== gradeConfig.fusionCount) {
      return { valid: false, reason: `${energyGrade}级能量需要${gradeConfig.fusionCount}株植物` };
    }

    const gradeOrder = ['blue', 'purple', 'gold', 'red'];
    const labIndex = gradeOrder.indexOf(labLevel);
    const energyIndex = gradeOrder.indexOf(energyGrade);
    if (energyIndex > labIndex) {
      return { valid: false, reason: '实验室等级不足以使用该能量等级' };
    }

    return { valid: true };
  }

  _estimateResult(plants, grade) {
    const genePool = this._collectGenePool(plants);
    const gradeConfig = hybridConfig.energyGrades[grade];

    return {
      genePool,
      mutationChance: gradeConfig.mutationProb,
      crossGeneChance: gradeConfig.crossGeneProb,
      valueFluctuation: gradeConfig.valueFluctuation
    };
  }

  _combinations(arr, k) {
    if (k === 0) return [[]];
    if (arr.length < k) return [];

    const results = [];
    const combine = (start, combo) => {
      if (combo.length === k) {
        results.push([...combo]);
        return;
      }
      for (let i = start; i < arr.length; i++) {
        combo.push(arr[i]);
        combine(i + 1, combo);
        combo.pop();
      }
    };
    combine(0, []);
    return results;
  }

  // === 能源等级检查 ===

  canTripleFuse(energyGrade) {
    return this._isGradeSufficient(energyGrade, 'purple');
  }

  canQuadFuse(energyGrade) {
    return this._isGradeSufficient(energyGrade, 'gold');
  }

  canPentaFuse(energyGrade) {
    return this._isGradeSufficient(energyGrade, 'red');
  }

  // === 兼容性检查 ===

  // 检查两株植物是否可以杂交
  canFuse(plantA, plantB) {
    if (!plantA || !plantB) {
      return { canFuse: false, reason: '植物数据不存在' };
    }

    // 同种植物不能杂交
    if (plantA.id === plantB.id) {
      return { canFuse: false, reason: '同种植物不能杂交' };
    }

    // 杂交植物不能二次杂交
    if (plantA.is_hybrid || plantB.is_hybrid) {
      return { canFuse: false, reason: '杂交植物不能再次杂交' };
    }

    // 特殊植物不可杂交
    if (plantA.is_special || plantB.is_special) {
      return { canFuse: false, reason: '特殊植物不可杂交' };
    }

    // 明确标记不可杂交
    if (plantA.can_hybridize === false || plantB.can_hybridize === false) {
      return { canFuse: false, reason: '该植物不可杂交' };
    }

    // 同源植物（相同基因池）不能杂交
    if (plantA.gene_pool && plantA.gene_pool === plantB.gene_pool) {
      return { canFuse: false, reason: '同源植物不能杂交' };
    }

    // 爆炸类冲突规则
    const incompatiblePools = {
      explosive: ['explosive', 'defense', 'support', 'photosynthesis']
    };
    const poolA = plantA.gene_pool;
    const poolB = plantB.gene_pool;
    // cross_gene_bonus 遗物（dimensional_key）允许跨基因池杂交
    const hasCrossGeneRelic = this.game && this.game._hasRelic &&
      this.game._hasRelic('dimensional_key');
    if (poolA && poolB && !hasCrossGeneRelic) {
      for (const [base, blocked] of Object.entries(incompatiblePools)) {
        if ((poolA === base && blocked.includes(poolB)) ||
            (poolB === base && blocked.includes(poolA))) {
          return { canFuse: false, reason: '爆炸类植物与该类型不兼容' };
        }
      }
    }

    return { canFuse: true };
  }

  // 检查多株植物两两兼容性
  _checkAllPairs(plants) {
    for (let i = 0; i < plants.length; i++) {
      for (let j = i + 1; j < plants.length; j++) {
        const check = this.canFuse(plants[i], plants[j]);
        if (!check.canFuse) {
          return check;
        }
      }
    }
    return { canFuse: true };
  }

  canFuseTriple(plantA, plantB, plantC) {
    return this._checkAllPairs([plantA, plantB, plantC]);
  }

  canFuseQuad(plantA, plantB, plantC, plantD) {
    return this._checkAllPairs([plantA, plantB, plantC, plantD]);
  }

  canFusePenta(plantA, plantB, plantC, plantD, plantE) {
    return this._checkAllPairs([plantA, plantB, plantC, plantD, plantE]);
  }

  // === 预览方法 ===

  // 将 fuse 结果转为预览格式
  _toPreviewResult(fuseResult) {
    if (fuseResult.error) {
      return { error: fuseResult.error };
    }

    const normal = {
      name_cn: fuseResult.name,
      hp: fuseResult.stats.hp,
      damage: fuseResult.stats.damage,
      attack_speed: fuseResult.stats.attackSpeed,
      range: fuseResult.stats.range,
      cost: fuseResult.stats.cost,
      special: fuseResult.stats.special,
      genePool: fuseResult.genePool,
      mutations: fuseResult.mutations || []
    };

    // 30% 概率出现更强亚种
    let rare = null;
    if (Math.random() < 0.3) {
      rare = {
        name_cn: fuseResult.name + '·强化',
        hp: Math.round(normal.hp * 1.3),
        damage: Math.round(normal.damage * 1.3),
        attack_speed: Math.round(normal.attack_speed * 0.85 * 100) / 100,
        cost: Math.round(normal.cost * 1.1),
        special: normal.special,
        probability: 0.3
      };
    }

    return { normal, rare };
  }

  previewFusion(plantA, plantB) {
    const compat = this.canFuse(plantA, plantB);
    if (!compat.canFuse) {
      return { error: compat.reason, isFailure: true };
    }
    const fuseResult = this.fuse([plantA, plantB], 'blue');
    return this._toPreviewResult(fuseResult);
  }

  previewTripleFusion(plantA, plantB, plantC, energyGrade) {
    const compat = this.canFuseTriple(plantA, plantB, plantC);
    if (!compat.canFuse) {
      return { error: compat.reason, isFailure: true };
    }
    const grade = energyGrade || 'purple';
    const fuseResult = this.fuse([plantA, plantB, plantC], grade);
    return this._toPreviewResult(fuseResult);
  }

  previewQuadFusion(plantA, plantB, plantC, plantD, energyGrade) {
    const compat = this.canFuseQuad(plantA, plantB, plantC, plantD);
    if (!compat.canFuse) {
      return { error: compat.reason, isFailure: true };
    }
    const grade = energyGrade || 'gold';
    const fuseResult = this.fuse([plantA, plantB, plantC, plantD], grade);
    return this._toPreviewResult(fuseResult);
  }

  previewPentaFusion(plantA, plantB, plantC, plantD, plantE, energyGrade) {
    const compat = this.canFusePenta(plantA, plantB, plantC, plantD, plantE);
    if (!compat.canFuse) {
      return { error: compat.reason, isFailure: true };
    }
    const grade = energyGrade || 'red';
    const fuseResult = this.fuse([plantA, plantB, plantC, plantD, plantE], grade);
    return this._toPreviewResult(fuseResult);
  }

  // === 变异逆向 ===

  // 逆向 applyMutation 的属性加成
  revertMutation(stats, mutationId) {
    const mutationDef = hybridConfig.mutationTypes[mutationId];
    if (!mutationDef) return null;

    switch (mutationId) {
      case 'pierce':
        stats.damage /= 1.15;
        break;
      case 'attack_speed_up':
        stats.attackSpeed /= 0.7;
        break;
      case 'random_bullet':
        stats.damage /= 1.1;
        break;
      case 'hp_up':
        stats.hp /= 1.4;
        break;
      case 'attack_type_change':
        stats.damage /= 1.2;
        stats.attackSpeed /= 0.85;
        break;
      case 'crush_resist':
        stats.hp /= 1.2;
        break;
      case 'reflect_bullet':
        stats.hp /= 1.1;
        break;
      case 'armor_break':
        stats.damage /= 1.25;
        break;
      case 'range_expand':
        stats.range /= 1.3;
        break;
      case 'chain_attack':
        stats.damage /= 0.9;
        break;
      case 'self_heal':
        stats.hp /= 1.15;
        break;
      case 'hidden_aoe':
        stats.damage /= 1.1;
        stats.range /= 1.1;
        break;
      case 'sun_double':
        // 阳光产量翻倍变异不修改属性，无需逆向
        break;
    }

    return {
      id: mutationId,
      name_cn: mutationDef.name_cn,
      name_en: mutationDef.name_en,
      description: mutationDef.description
    };
  }

  serialize() {
    return {};
  }

  deserialize(_data) {
  }
}
