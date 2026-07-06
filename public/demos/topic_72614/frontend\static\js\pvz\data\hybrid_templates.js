/**
 * 分类杂交模板系统
 *
 * 为8大类植物之间的允许杂交组合设计通用模板。
 * 同类别组合（如射手×射手）和跨类别组合（如射手×蘑菇）各有模板。
 * 模板定义基础款属性，强化亚型单独定义。
 *
 * 模板生成规则：
 * - 基础款：融合两种父本的核心特性
 * - 强化亚型：在基础款上有显著提升，约25%组合拥有
 */

// === 类别组合模板 ===
// 键名格式: "类别A_类别B"（按字母序排序）
// 每个模板定义基础款的属性生成函数和可选的强化亚型
export const CATEGORY_TEMPLATES = {

  // ========== 射手类 × 射手类 ==========
  shooter_shooter: {
    canFuse: true,
    baseName: '连射射手',
    baseCost: 200,
    baseHp: 300,
    baseDamage: 20,
    baseAttackSpeed: 1.5,
    baseRange: 9,
    baseCooldown: 7.5,
    baseSpecial: '同时发射两种父本的子弹',
    genePool: 'ranged',
    category: 'attack_ranged',
    generateBase(plantA, plantB, catA, catB) {
      // 合并攻击力，取较高攻速
      const dmg = Math.max(plantA.damage || 20, plantB.damage || 20);
      const speed = Math.min(plantA.attack_speed || 1.5, plantB.attack_speed || 1.5);
      const cost = Math.round((plantA.cost + plantB.cost) * 0.6);
      return {
        name_cn: `连射${plantA.name_cn[0]}${plantB.name_cn[0]}射手`,
        cost: Math.min(400, Math.max(125, cost)),
        hp: 300,
        damage: dmg,
        attack_speed: speed,
        range: 9,
        cooldown: 7.5,
        special: `同时发射${plantA.name_cn}和${plantB.name_cn}的子弹`
      };
    },
    rare: {
      name_cn: '风暴射手',
      probability: 0.15,
      cost: 300,
      hp: 350,
      damage: 30,
      attack_speed: 1.0,
      range: 9,
      special: '三连发射击，每发子弹附带父本特效',
      splash_damage: 10
    }
  },

  // ========== 射手类 × 蘑菇类 ==========
  mushroom_shooter: {
    canFuse: true,
    baseName: '射手蘑菇',
    baseCost: 175,
    baseHp: 250,
    baseDamage: 20,
    baseAttackSpeed: 1.5,
    baseRange: 9,
    baseCooldown: 7.5,
    baseSpecial: '蘑菇形态的射手，夜间攻击力提升',
    genePool: 'hybrid_ranged',
    category: 'attack_ranged',
    generateBase(plantA, plantB, catA, catB) {
      const shooter = catA === 'shooter' ? plantA : plantB;
      const mushroom = catA === 'mushroom' ? plantA : plantB;
      const dmg = Math.max(shooter.damage || 20, mushroom.damage || 20);
      const cost = Math.round((shooter.cost + mushroom.cost) * 0.6);
      return {
        name_cn: `${shooter.name_cn[0]}${mushroom.name_cn[0]}射手菇`,
        cost: Math.min(350, Math.max(100, cost)),
        hp: 250,
        damage: dmg,
        attack_speed: 1.5,
        range: 9,
        cooldown: 7.5,
        special: `蘑菇形态的射手，夜间攻击力+50%，发射${shooter.name_cn}的子弹`
      };
    },
    rare: {
      name_cn: '暗影射手',
      probability: 0.12,
      cost: 250,
      hp: 300,
      damage: 35,
      attack_speed: 1.2,
      range: 9,
      special: '夜间三连发，子弹穿透2个僵尸',
      night_bonus: true,
      pierce: 2
    }
  },

  // ========== 射手类 × 防御类 ==========
  defense_shooter: {
    canFuse: true,
    baseName: '坚果射手',
    baseCost: 150,
    baseHp: 1500,
    baseDamage: 20,
    baseAttackSpeed: 1.5,
    baseRange: 9,
    baseCooldown: 15,
    baseSpecial: '高HP防御型射手',
    genePool: 'hybrid_defense',
    category: 'defense_ranged',
    generateBase(plantA, plantB, catA, catB) {
      const shooter = catA === 'shooter' ? plantA : plantB;
      const defense = catA === 'defense' ? plantA : plantB;
      const hp = Math.max(1500, (defense.hp || 4000) * 0.4);
      const cost = Math.round((shooter.cost + defense.cost) * 0.7);
      return {
        name_cn: `${defense.name_cn[0]}${shooter.name_cn[0]}射手`,
        cost: Math.min(300, Math.max(100, cost)),
        hp: Math.round(hp),
        damage: shooter.damage || 20,
        attack_speed: shooter.attack_speed || 1.5,
        range: 9,
        cooldown: 15,
        special: `拥有${defense.name_cn}的防御力，同时能发射子弹`
      };
    },
    rare: {
      name_cn: '铁壁射手',
      probability: 0.12,
      cost: 250,
      hp: 2500,
      damage: 25,
      attack_speed: 1.5,
      range: 9,
      special: '受到攻击时25%概率反击，HP极高',
      counter_attack: 0.25
    }
  },

  // ========== 射手类 × 产出类 ==========
  producer_shooter: {
    canFuse: true,
    baseName: '阳光射手',
    baseCost: 125,
    baseHp: 250,
    baseDamage: 20,
    baseAttackSpeed: 1.5,
    baseRange: 9,
    baseCooldown: 7.5,
    baseSpecial: '既能发射子弹又能产出阳光',
    genePool: 'hybrid_producer',
    category: 'producer_ranged',
    generateBase(plantA, plantB, catA, catB) {
      const shooter = catA === 'shooter' ? plantA : plantB;
      const producer = catA === 'producer' ? plantA : plantB;
      const cost = Math.round((shooter.cost + producer.cost) * 0.8);
      return {
        name_cn: `${producer.name_cn[0]}${shooter.name_cn[0]}射手`,
        cost: Math.min(300, Math.max(100, cost)),
        hp: 250,
        damage: shooter.damage || 20,
        attack_speed: shooter.attack_speed || 1.5,
        range: 9,
        cooldown: 7.5,
        special: `发射子弹并每25秒产出25阳光`,
        sun_production: 25,
        sun_interval: 25
      };
    },
    rare: {
      name_cn: '光辉射手',
      probability: 0.15,
      cost: 175,
      hp: 250,
      damage: 15,
      attack_speed: 2.0,
      range: 9,
      special: '发射阳光子弹，命中僵尸掉落10阳光',
      sun_bullet: true,
      sun_drop: 10
    }
  },

  // ========== 射手类 × 近战类 ==========
  melee_shooter: {
    canFuse: true,
    baseName: '猎手射手',
    baseCost: 175,
    baseHp: 300,
    baseDamage: 25,
    baseAttackSpeed: 1.5,
    baseRange: 9,
    baseCooldown: 10,
    baseSpecial: '远程+近战双模式攻击',
    genePool: 'hybrid_melee',
    category: 'attack_hybrid',
    generateBase(plantA, plantB, catA, catB) {
      const shooter = catA === 'shooter' ? plantA : plantB;
      const melee = catA === 'melee' ? plantA : plantB;
      const cost = Math.round((shooter.cost + melee.cost) * 0.7);
      return {
        name_cn: `${melee.name_cn[0]}${shooter.name_cn[0]}猎手`,
        cost: Math.min(350, Math.max(125, cost)),
        hp: 300,
        damage: Math.max(shooter.damage || 20, melee.damage || 40),
        attack_speed: 1.5,
        range: 9,
        cooldown: 10,
        special: `远程发射子弹，近身僵尸遭受${melee.name_cn}攻击`,
        melee_damage: melee.damage || 40
      };
    },
    rare: {
      name_cn: '吞噬射手',
      probability: 0.12,
      cost: 250,
      hp: 350,
      damage: 30,
      attack_speed: 1.2,
      range: 9,
      special: '远程射击+吞噬近身僵尸（吞噬后消化30秒）',
      devour: true,
      devour_damage: 300
    }
  },

  // ========== 射手类 × 辅助类（部分允许）==========
  shooter_support: {
    canFuse: true,
    baseName: '功能射手',
    baseCost: 175,
    baseHp: 250,
    baseDamage: 20,
    baseAttackSpeed: 1.5,
    baseRange: 9,
    baseCooldown: 10,
    baseSpecial: '射手附带辅助功能',
    genePool: 'hybrid_support',
    category: 'support_ranged',
    generateBase(plantA, plantB, catA, catB) {
      const shooter = catA === 'shooter' ? plantA : plantB;
      const support = catA === 'support' ? plantA : plantB;
      const cost = Math.round((shooter.cost + support.cost) * 0.7);
      return {
        name_cn: `${support.name_cn[0]}${shooter.name_cn[0]}射手`,
        cost: Math.min(300, Math.max(100, cost)),
        hp: 250,
        damage: shooter.damage || 20,
        attack_speed: 1.5,
        range: 9,
        cooldown: 10,
        special: `发射子弹，同时具备${support.name_cn}的功能`
      };
    },
    rare: {
      name_cn: '全能射手',
      probability: 0.15,
      cost: 300,
      hp: 350,
      damage: 30,
      attack_speed: 1.0,
      range: 9,
      special: '射击附带强力辅助效果，攻速提升'
    }
  },

  // ========== 蘑菇类 × 蘑菇类 ==========
  mushroom_mushroom: {
    canFuse: true,
    baseName: '混合蘑菇',
    baseCost: 100,
    baseHp: 200,
    baseDamage: 20,
    baseAttackSpeed: 1.5,
    baseRange: 9,
    baseCooldown: 7.5,
    baseSpecial: '融合两种蘑菇特性',
    genePool: 'mushroom',
    category: 'attack_mushroom',
    generateBase(plantA, plantB, catA, catB) {
      const dmg = Math.max(plantA.damage || 20, plantB.damage || 20);
      const cost = Math.round((plantA.cost + plantB.cost) * 0.5);
      return {
        name_cn: `${plantA.name_cn[0]}${plantB.name_cn[0]}混合菇`,
        cost: Math.min(250, Math.max(50, cost)),
        hp: 200,
        damage: dmg,
        attack_speed: 1.5,
        range: 9,
        cooldown: 7.5,
        special: `融合${plantA.name_cn}和${plantB.name_cn}的特性，夜间更强`
      };
    },
    rare: {
      name_cn: '暗夜领主',
      probability: 0.15,
      cost: 200,
      hp: 300,
      damage: 40,
      attack_speed: 1.0,
      range: 9,
      special: '夜间攻击力翻倍，范围攻击',
      night_double: true,
      aoe: true
    }
  },

  // ========== 蘑菇类 × 防御类 ==========
  defense_mushroom: {
    canFuse: true,
    baseName: '坚果蘑菇',
    baseCost: 125,
    baseHp: 1200,
    baseDamage: 20,
    baseAttackSpeed: 1.5,
    baseRange: 9,
    baseCooldown: 15,
    baseSpecial: '高HP防御型蘑菇',
    genePool: 'hybrid_defense',
    category: 'defense_mushroom',
    generateBase(plantA, plantB, catA, catB) {
      const mushroom = catA === 'mushroom' ? plantA : plantB;
      const defense = catA === 'defense' ? plantA : plantB;
      const hp = Math.max(1200, (defense.hp || 4000) * 0.35);
      const cost = Math.round((mushroom.cost + defense.cost) * 0.6);
      return {
        name_cn: `${defense.name_cn[0]}${mushroom.name_cn[0]}坚果菇`,
        cost: Math.min(250, Math.max(75, cost)),
        hp: Math.round(hp),
        damage: mushroom.damage || 20,
        attack_speed: 1.5,
        range: 9,
        cooldown: 15,
        special: `拥有${defense.name_cn}的防御力，蘑菇形态攻击`
      };
    }
  },

  // ========== 蘑菇类 × 产出类 ==========
  mushroom_producer: {
    canFuse: true,
    baseName: '阳光蘑菇',
    baseCost: 75,
    baseHp: 200,
    baseDamage: 0,
    baseAttackSpeed: 0,
    baseRange: 0,
    baseCooldown: 7.5,
    baseSpecial: '产出阳光的蘑菇',
    genePool: 'hybrid_producer',
    category: 'producer_mushroom',
    generateBase(plantA, plantB, catA, catB) {
      const mushroom = catA === 'mushroom' ? plantA : plantB;
      const producer = catA === 'producer' ? plantA : plantB;
      const cost = Math.round((mushroom.cost + producer.cost) * 0.7);
      return {
        name_cn: `${producer.name_cn[0]}${mushroom.name_cn[0]}阳光菇`,
        cost: Math.min(200, Math.max(50, cost)),
        hp: 200,
        damage: 0,
        attack_speed: 0,
        range: 0,
        cooldown: 7.5,
        special: '每25秒产出25阳光，夜间产出翻倍',
        sun_production: 25,
        sun_interval: 25,
        night_double: true
      };
    },
    rare: {
      name_cn: '光辉蘑菇',
      probability: 0.18,
      cost: 150,
      hp: 250,
      damage: 15,
      attack_speed: 2.0,
      range: 9,
      special: '产出阳光的同时能发射孢子攻击',
      sun_production: 25,
      sun_interval: 20
    }
  },

  // ========== 蘑菇类 × 近战类 ==========
  melee_mushroom: {
    canFuse: true,
    baseName: '猎手蘑菇',
    baseCost: 125,
    baseHp: 250,
    baseDamage: 30,
    baseAttackSpeed: 1.5,
    baseRange: 9,
    baseCooldown: 10,
    baseSpecial: '近战蘑菇，夜间更强',
    genePool: 'hybrid_melee',
    category: 'attack_melee',
    generateBase(plantA, plantB, catA, catB) {
      const mushroom = catA === 'mushroom' ? plantA : plantB;
      const melee = catA === 'melee' ? plantA : plantB;
      const cost = Math.round((mushroom.cost + melee.cost) * 0.7);
      return {
        name_cn: `${melee.name_cn[0]}${mushroom.name_cn[0]}猎手菇`,
        cost: Math.min(250, Math.max(75, cost)),
        hp: 250,
        damage: Math.max(mushroom.damage || 20, melee.damage || 40),
        attack_speed: 1.5,
        range: 9,
        cooldown: 10,
        special: `近战攻击僵尸，夜间攻击力+50%`,
        melee_damage: melee.damage || 40
      };
    }
  },

  // ========== 蘑菇类 × 辅助类（部分允许）==========
  mushroom_support: {
    canFuse: true,
    baseName: '功能蘑菇',
    baseCost: 100,
    baseHp: 200,
    baseDamage: 15,
    baseAttackSpeed: 1.5,
    baseRange: 9,
    baseCooldown: 10,
    baseSpecial: '附带辅助功能的蘑菇',
    genePool: 'hybrid_support',
    category: 'support_mushroom',
    generateBase(plantA, plantB, catA, catB) {
      const mushroom = catA === 'mushroom' ? plantA : plantB;
      const support = catA === 'support' ? plantA : plantB;
      const cost = Math.round((mushroom.cost + support.cost) * 0.6);
      return {
        name_cn: `${support.name_cn[0]}${mushroom.name_cn[0]}功能菇`,
        cost: Math.min(200, Math.max(50, cost)),
        hp: 200,
        damage: mushroom.damage || 15,
        attack_speed: 1.5,
        range: 9,
        cooldown: 10,
        special: `蘑菇形态，具备${support.name_cn}的功能`
      };
    }
  },

  // ========== 投掷类 × 投掷类 ==========
  pult_pult: {
    canFuse: true,
    baseName: '双重投手',
    baseCost: 225,
    baseHp: 300,
    baseDamage: 30,
    baseAttackSpeed: 2.0,
    baseRange: 9,
    baseCooldown: 10,
    baseSpecial: '同时投掷两种父本的弹药',
    genePool: 'pult',
    category: 'attack_pult',
    generateBase(plantA, plantB, catA, catB) {
      const dmg = Math.max(plantA.damage || 30, plantB.damage || 30);
      const cost = Math.round((plantA.cost + plantB.cost) * 0.7);
      return {
        name_cn: `${plantA.name_cn[0]}${plantB.name_cn[0]}双投手`,
        cost: Math.min(400, Math.max(150, cost)),
        hp: 300,
        damage: dmg,
        attack_speed: 2.0,
        range: 9,
        cooldown: 10,
        special: `同时投掷${plantA.name_cn}和${plantB.name_cn}的弹药`
      };
    },
    rare: {
      name_cn: '风暴投手',
      probability: 0.15,
      cost: 350,
      hp: 350,
      damage: 40,
      attack_speed: 1.5,
      range: 9,
      special: '投掷弹药造成3x3范围溅射伤害',
      splash_damage: 20,
      splash_range: 3
    }
  },

  // ========== 投掷类 × 防御类 ==========
  defense_pult: {
    canFuse: true,
    baseName: '坚果投手',
    baseCost: 175,
    baseHp: 1500,
    baseDamage: 30,
    baseAttackSpeed: 2.0,
    baseRange: 9,
    baseCooldown: 15,
    baseSpecial: '高HP防御型投手',
    genePool: 'hybrid_defense',
    category: 'defense_pult',
    generateBase(plantA, plantB, catA, catB) {
      const pult = catA === 'pult' ? plantA : plantB;
      const defense = catA === 'defense' ? plantA : plantB;
      const hp = Math.max(1500, (defense.hp || 4000) * 0.4);
      const cost = Math.round((pult.cost + defense.cost) * 0.7);
      return {
        name_cn: `${defense.name_cn[0]}${pult.name_cn[0]}坚果投手`,
        cost: Math.min(350, Math.max(125, cost)),
        hp: Math.round(hp),
        damage: pult.damage || 30,
        attack_speed: 2.0,
        range: 9,
        cooldown: 15,
        special: `拥有${defense.name_cn}的防御力，投掷攻击`
      };
    }
  },

  // ========== 投掷类 × 产出类 ==========
  pult_producer: {
    canFuse: true,
    baseName: '阳光投手',
    baseCost: 150,
    baseHp: 250,
    baseDamage: 25,
    baseAttackSpeed: 2.0,
    baseRange: 9,
    baseCooldown: 10,
    baseSpecial: '投掷攻击并产出阳光',
    genePool: 'hybrid_producer',
    category: 'producer_pult',
    generateBase(plantA, plantB, catA, catB) {
      const pult = catA === 'pult' ? plantA : plantB;
      const producer = catA === 'producer' ? plantA : plantB;
      const cost = Math.round((pult.cost + producer.cost) * 0.8);
      return {
        name_cn: `${producer.name_cn[0]}${pult.name_cn[0]}阳光投手`,
        cost: Math.min(300, Math.max(100, cost)),
        hp: 250,
        damage: pult.damage || 25,
        attack_speed: 2.0,
        range: 9,
        cooldown: 10,
        special: '投掷攻击，每25秒产出25阳光',
        sun_production: 25,
        sun_interval: 25
      };
    },
    rare: {
      name_cn: '金辉投手',
      probability: 0.15,
      cost: 225,
      hp: 300,
      damage: 20,
      attack_speed: 2.0,
      range: 9,
      special: '投掷阳光弹药，命中僵尸掉落15阳光',
      sun_bullet: true,
      sun_drop: 15
    }
  },

  // ========== 投掷类 × 近战类 ==========
  melee_pult: {
    canFuse: true,
    baseName: '猎手投手',
    baseCost: 200,
    baseHp: 300,
    baseDamage: 35,
    baseAttackSpeed: 2.0,
    baseRange: 9,
    baseCooldown: 12,
    baseSpecial: '远程投掷+近战双模式',
    genePool: 'hybrid_melee',
    category: 'attack_hybrid',
    generateBase(plantA, plantB, catA, catB) {
      const pult = catA === 'pult' ? plantA : plantB;
      const melee = catA === 'melee' ? plantA : plantB;
      const cost = Math.round((pult.cost + melee.cost) * 0.7);
      return {
        name_cn: `${melee.name_cn[0]}${pult.name_cn[0]}猎手投手`,
        cost: Math.min(350, Math.max(125, cost)),
        hp: 300,
        damage: Math.max(pult.damage || 30, melee.damage || 40),
        attack_speed: 2.0,
        range: 9,
        cooldown: 12,
        special: `远程投掷攻击，近身僵尸遭受${melee.name_cn}攻击`,
        melee_damage: melee.damage || 40
      };
    }
  },

  // ========== 投掷类 × 射手类 ==========
  pult_shooter: {
    canFuse: true,
    baseName: '射击投手',
    baseCost: 225,
    baseHp: 300,
    baseDamage: 25,
    baseAttackSpeed: 1.5,
    baseRange: 9,
    baseCooldown: 10,
    baseSpecial: '同时发射子弹和投掷弹药',
    genePool: 'hybrid_ranged',
    category: 'attack_ranged',
    generateBase(plantA, plantB, catA, catB) {
      const shooter = catA === 'shooter' ? plantA : plantB;
      const pult = catA === 'pult' ? plantA : plantB;
      const cost = Math.round((shooter.cost + pult.cost) * 0.7);
      return {
        name_cn: `${shooter.name_cn[0]}${pult.name_cn[0]}射击投手`,
        cost: Math.min(400, Math.max(150, cost)),
        hp: 300,
        damage: Math.max(shooter.damage || 20, pult.damage || 30),
        attack_speed: 1.5,
        range: 9,
        cooldown: 10,
        special: `同时发射${shooter.name_cn}的子弹和投掷${pult.name_cn}的弹药`
      };
    },
    rare: {
      name_cn: '弹幕大师',
      probability: 0.12,
      cost: 300,
      hp: 350,
      damage: 35,
      attack_speed: 1.0,
      range: 9,
      special: '高速连发子弹+投掷弹药，压制力极强'
    }
  },

  // ========== 防御类 × 防御类 ==========
  defense_defense: {
    canFuse: true,
    baseName: '双重防御',
    baseCost: 100,
    baseHp: 3000,
    baseDamage: 0,
    baseAttackSpeed: 0,
    baseRange: 0,
    baseCooldown: 20,
    baseSpecial: '超高HP防御植物',
    genePool: 'defense',
    category: 'defense',
    generateBase(plantA, plantB, catA, catB) {
      const hp = Math.round((plantA.hp + plantB.hp) * 0.7);
      const cost = Math.round((plantA.cost + plantB.cost) * 0.6);
      return {
        name_cn: `${plantA.name_cn[0]}${plantB.name_cn[0]}双重防御`,
        cost: Math.min(200, Math.max(50, cost)),
        hp: Math.min(6000, hp),
        damage: 0,
        attack_speed: 0,
        range: 0,
        cooldown: 20,
        special: '融合两种防御特性，HP极高'
      };
    },
    rare: {
      name_cn: '不朽之墙',
      probability: 0.15,
      cost: 200,
      hp: 5000,
      damage: 0,
      attack_speed: 0,
      range: 0,
      special: '受到攻击时恢复HP，几乎无法被摧毁',
      self_heal: true
    }
  },

  // ========== 防御类 × 产出类 ==========
  defense_producer: {
    canFuse: true,
    baseName: '坚果向日葵',
    baseCost: 100,
    baseHp: 2000,
    baseDamage: 0,
    baseAttackSpeed: 0,
    baseRange: 0,
    baseCooldown: 15,
    baseSpecial: '高HP防御型产出植物',
    genePool: 'hybrid_defense',
    category: 'defense_producer',
    generateBase(plantA, plantB, catA, catB) {
      const defense = catA === 'defense' ? plantA : plantB;
      const producer = catA === 'producer' ? plantA : plantB;
      const hp = Math.max(2000, (defense.hp || 4000) * 0.5);
      const cost = Math.round((defense.cost + producer.cost) * 0.8);
      return {
        name_cn: `${producer.name_cn[0]}${defense.name_cn[0]}坚果花`,
        cost: Math.min(200, Math.max(75, cost)),
        hp: Math.round(hp),
        damage: 0,
        attack_speed: 0,
        range: 0,
        cooldown: 15,
        special: '高HP防御，每25秒产出25阳光',
        sun_production: 25,
        sun_interval: 25
      };
    }
  },

  // ========== 防御类 × 近战类 ==========
  defense_melee: {
    canFuse: true,
    baseName: '坚果猎手',
    baseCost: 175,
    baseHp: 2000,
    baseDamage: 40,
    baseAttackSpeed: 30,
    baseRange: 1,
    baseCooldown: 20,
    baseSpecial: '高HP近战植物',
    genePool: 'hybrid_defense',
    category: 'defense_melee',
    generateBase(plantA, plantB, catA, catB) {
      const defense = catA === 'defense' ? plantA : plantB;
      const melee = catA === 'melee' ? plantA : plantB;
      const hp = Math.max(2000, (defense.hp || 4000) * 0.5);
      const cost = Math.round((defense.cost + melee.cost) * 0.7);
      return {
        name_cn: `${defense.name_cn[0]}${melee.name_cn[0]}坚果猎手`,
        cost: Math.min(300, Math.max(100, cost)),
        hp: Math.round(hp),
        damage: melee.damage || 40,
        attack_speed: 30,
        range: 1,
        cooldown: 20,
        special: `高HP防御，近身僵尸遭受${melee.name_cn}攻击`
      };
    },
    rare: {
      name_cn: '钢铁猎手',
      probability: 0.15,
      cost: 300,
      hp: 3500,
      damage: 60,
      attack_speed: 20,
      range: 1,
      special: '极高HP，近战伤害大幅提升，攻速加快'
    }
  },

  // ========== 防御类 × 辅助类（部分允许）==========
  defense_support: {
    canFuse: true,
    baseName: '功能防御',
    baseCost: 125,
    baseHp: 2500,
    baseDamage: 0,
    baseAttackSpeed: 0,
    baseRange: 0,
    baseCooldown: 15,
    baseSpecial: '附带辅助功能的防御植物',
    genePool: 'hybrid_support',
    category: 'defense_support',
    generateBase(plantA, plantB, catA, catB) {
      const defense = catA === 'defense' ? plantA : plantB;
      const support = catA === 'support' ? plantA : plantB;
      const hp = Math.max(2500, (defense.hp || 4000) * 0.6);
      const cost = Math.round((defense.cost + support.cost) * 0.7);
      return {
        name_cn: `${support.name_cn[0]}${defense.name_cn[0]}功能墙`,
        cost: Math.min(250, Math.max(75, cost)),
        hp: Math.round(hp),
        damage: 0,
        attack_speed: 0,
        range: 0,
        cooldown: 15,
        special: `高HP防御，具备${support.name_cn}的功能`
      };
    },
    rare: {
      name_cn: '神盾功能墙',
      probability: 0.15,
      cost: 250,
      hp: 4000,
      damage: 0,
      attack_speed: 0,
      range: 0,
      special: '极高HP防御，辅助效果增强，可抵挡一次致命攻击'
    }
  },

  // ========== 产出类 × 产出类 ==========
  producer_producer: {
    canFuse: true,
    baseName: '双重产出',
    baseCost: 75,
    baseHp: 200,
    baseDamage: 0,
    baseAttackSpeed: 0,
    baseRange: 0,
    baseCooldown: 7.5,
    baseSpecial: '高效产出阳光',
    genePool: 'producer',
    category: 'producer',
    generateBase(plantA, plantB, catA, catB) {
      const cost = Math.round((plantA.cost + plantB.cost) * 0.7);
      return {
        name_cn: `${plantA.name_cn[0]}${plantB.name_cn[0]}双花`,
        cost: Math.min(150, Math.max(50, cost)),
        hp: 200,
        damage: 0,
        attack_speed: 0,
        range: 0,
        cooldown: 7.5,
        special: '每20秒产出35阳光',
        sun_production: 35,
        sun_interval: 20
      };
    },
    rare: {
      name_cn: '光辉之花',
      probability: 0.18,
      cost: 150,
      hp: 250,
      damage: 0,
      attack_speed: 0,
      range: 0,
      special: '每15秒产出50阳光，产出翻倍',
      sun_production: 50,
      sun_interval: 15
    }
  },

  // ========== 产出类 × 近战类 ==========
  melee_producer: {
    canFuse: true,
    baseName: '猎手之花',
    baseCost: 150,
    baseHp: 250,
    baseDamage: 40,
    baseAttackSpeed: 30,
    baseRange: 1,
    baseCooldown: 12,
    baseSpecial: '近战攻击并产出阳光',
    genePool: 'hybrid_melee',
    category: 'producer_melee',
    generateBase(plantA, plantB, catA, catB) {
      const producer = catA === 'producer' ? plantA : plantB;
      const melee = catA === 'melee' ? plantA : plantB;
      const cost = Math.round((producer.cost + melee.cost) * 0.8);
      return {
        name_cn: `${producer.name_cn[0]}${melee.name_cn[0]}猎手花`,
        cost: Math.min(250, Math.max(100, cost)),
        hp: 250,
        damage: melee.damage || 40,
        attack_speed: 30,
        range: 1,
        cooldown: 12,
        special: '近战攻击僵尸，每30秒产出25阳光',
        sun_production: 25,
        sun_interval: 30
      };
    }
  },

  // ========== 产出类 × 辅助类（部分允许）==========
  producer_support: {
    canFuse: true,
    baseName: '功能之花',
    baseCost: 75,
    baseHp: 200,
    baseDamage: 0,
    baseAttackSpeed: 0,
    baseRange: 0,
    baseCooldown: 10,
    baseSpecial: '产出阳光并具备辅助功能',
    genePool: 'hybrid_support',
    category: 'producer_support',
    generateBase(plantA, plantB, catA, catB) {
      const producer = catA === 'producer' ? plantA : plantB;
      const support = catA === 'support' ? plantA : plantB;
      const cost = Math.round((producer.cost + support.cost) * 0.7);
      return {
        name_cn: `${support.name_cn[0]}${producer.name_cn[0]}功能花`,
        cost: Math.min(150, Math.max(50, cost)),
        hp: 200,
        damage: 0,
        attack_speed: 0,
        range: 0,
        cooldown: 10,
        special: `产出阳光，具备${support.name_cn}的功能`,
        sun_production: 25,
        sun_interval: 25
      };
    }
  },

  // ========== 近战类 × 近战类 ==========
  melee_melee: {
    canFuse: true,
    baseName: '双重猎手',
    baseCost: 175,
    baseHp: 300,
    baseDamage: 50,
    baseAttackSpeed: 25,
    baseRange: 1,
    baseCooldown: 12,
    baseSpecial: '强力近战攻击',
    genePool: 'melee',
    category: 'attack_melee',
    generateBase(plantA, plantB, catA, catB) {
      const dmg = Math.round((plantA.damage + plantB.damage) * 0.7);
      const cost = Math.round((plantA.cost + plantB.cost) * 0.7);
      return {
        name_cn: `${plantA.name_cn[0]}${plantB.name_cn[0]}双猎手`,
        cost: Math.min(300, Math.max(125, cost)),
        hp: 300,
        damage: dmg,
        attack_speed: 25,
        range: 1,
        cooldown: 12,
        special: '融合两种近战特性，攻击力强'
      };
    },
    rare: {
      name_cn: '深渊吞噬者',
      probability: 0.15,
      cost: 275,
      hp: 400,
      damage: 80,
      attack_speed: 20,
      range: 1,
      special: '吞噬僵尸后恢复HP，攻击力极强',
      devour_heal: true
    }
  },

  // ========== 近战类 × 辅助类（部分允许）==========
  melee_support: {
    canFuse: true,
    baseName: '功能猎手',
    baseCost: 150,
    baseHp: 250,
    baseDamage: 35,
    baseAttackSpeed: 30,
    baseRange: 1,
    baseCooldown: 12,
    baseSpecial: '近战攻击并具备辅助功能',
    genePool: 'hybrid_support',
    category: 'support_melee',
    generateBase(plantA, plantB, catA, catB) {
      const melee = catA === 'melee' ? plantA : plantB;
      const support = catA === 'support' ? plantA : plantB;
      const cost = Math.round((melee.cost + support.cost) * 0.7);
      return {
        name_cn: `${support.name_cn[0]}${melee.name_cn[0]}功能猎手`,
        cost: Math.min(250, Math.max(100, cost)),
        hp: 250,
        damage: melee.damage || 35,
        attack_speed: 30,
        range: 1,
        cooldown: 12,
        special: `近战攻击，具备${support.name_cn}的功能`
      };
    }
  },

  // ========== 爆炸类 × 射手类 ==========
  explosive_shooter: {
    canFuse: true,
    baseName: '爆炸射手',
    baseCost: 175,
    baseHp: 300,
    baseDamage: 30,
    baseAttackSpeed: 1.5,
    baseRange: 9,
    baseCooldown: 7.5,
    baseSpecial: '发射爆炸子弹',
    genePool: 'explosive',
    category: 'attack_ranged',
    generateBase(plantA, plantB, catA, catB) {
      const shooter = catA === 'shooter' ? plantA : plantB;
      const explosive = catA === 'explosive' ? plantA : plantB;
      const cost = Math.round((shooter.cost + explosive.cost) * 0.7);
      return {
        name_cn: `${explosive.name_cn[0]}${shooter.name_cn[0]}爆炸射手`,
        cost: Math.min(300, Math.max(125, cost)),
        hp: 300,
        damage: 30,
        attack_speed: 1.5,
        range: 9,
        cooldown: 7.5,
        special: '发射爆炸子弹，命中后小范围溅射',
        splash_damage: 15,
        splash_range: 1
      };
    },
    rare: {
      name_cn: '爆裂射手',
      probability: 0.15,
      cost: 250,
      hp: 300,
      damage: 35,
      attack_speed: 1.8,
      range: 9,
      special: '子弹命中后引发3x3爆炸',
      splash_damage: 30,
      splash_range: 3
    }
  },

  // ========== 爆炸类 × 投掷类 ==========
  explosive_pult: {
    canFuse: true,
    baseName: '爆炸投手',
    baseCost: 200,
    baseHp: 300,
    baseDamage: 40,
    baseAttackSpeed: 2.0,
    baseRange: 9,
    baseCooldown: 10,
    baseSpecial: '投掷爆炸弹药',
    genePool: 'explosive',
    category: 'attack_pult',
    generateBase(plantA, plantB, catA, catB) {
      const pult = catA === 'pult' ? plantA : plantB;
      const explosive = catA === 'explosive' ? plantA : plantB;
      const cost = Math.round((pult.cost + explosive.cost) * 0.7);
      return {
        name_cn: `${explosive.name_cn[0]}${pult.name_cn[0]}爆炸投手`,
        cost: Math.min(350, Math.max(150, cost)),
        hp: 300,
        damage: 40,
        attack_speed: 2.0,
        range: 9,
        cooldown: 10,
        special: '投掷爆炸弹药，命中后范围伤害',
        splash_damage: 25,
        splash_range: 1
      };
    }
  },

  // ========== 爆炸类 × 近战类 ==========
  explosive_melee: {
    canFuse: true,
    baseName: '爆破猎手',
    baseCost: 200,
    baseHp: 300,
    baseDamage: 300,
    baseAttackSpeed: 30,
    baseRange: 1,
    baseCooldown: 30,
    baseSpecial: '吞噬后引发爆炸',
    genePool: 'explosive',
    category: 'attack_melee',
    generateBase(plantA, plantB, catA, catB) {
      const melee = catA === 'melee' ? plantA : plantB;
      const explosive = catA === 'explosive' ? plantA : plantB;
      const cost = Math.round((melee.cost + explosive.cost) * 0.7);
      return {
        name_cn: `${explosive.name_cn[0]}${melee.name_cn[0]}爆破猎手`,
        cost: Math.min(300, Math.max(150, cost)),
        hp: 300,
        damage: 300,
        attack_speed: 30,
        range: 1,
        cooldown: 30,
        special: '吞噬僵尸后引发爆炸，对周围1格造成600伤害',
        explosion_damage: 600,
        explosion_range: 1
      };
    },
    rare: {
      name_cn: '毁灭猎手',
      probability: 0.12,
      cost: 275,
      hp: 300,
      damage: 300,
      attack_speed: 30,
      range: 1,
      special: '吞噬后引发3x3范围爆炸，造成1200伤害',
      explosion_damage: 1200,
      explosion_range: 3
    }
  },

  // ========== 辅助类 × 辅助类（已在规则中设为失败）==========
  // support_support: 失败（功能干扰）
};

// === 获取类别组合模板 ===
export function getCategoryTemplate(catA, catB) {
  const [a, b] = [catA, catB].sort();
  const key = `${a}_${b}`;
  return CATEGORY_TEMPLATES[key] || null;
}

// === 统计模板数量 ===
export function getTemplateStats() {
  const total = Object.keys(CATEGORY_TEMPLATES).length;
  const withRare = Object.values(CATEGORY_TEMPLATES).filter(t => t.rare).length;
  return {
    totalTemplates: total,
    templatesWithRare: withRare,
    rarePercentage: Math.round((withRare / total) * 100)
  };
}
