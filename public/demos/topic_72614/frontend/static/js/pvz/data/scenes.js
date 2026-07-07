export default {
  lawn: {
    id: 'lawn',
    name_cn: '草坪',
    name_en: 'Lawn',
    rows: 5,
    cols: 9,
    waterRows: [],
    hasFog: false,
    sunMultiplier: 1,
    cooldownMultiplier: 1,
    zombieSpeedMultiplier: 1,
    flyingZombieBonus: 0
  },
  pool: {
    id: 'pool',
    name_cn: '泳池',
    name_en: 'Pool',
    rows: 5,
    cols: 9,
    waterRows: [2, 3],
    hasFog: false,
    sunMultiplier: 1,
    cooldownMultiplier: 1.3,
    zombieSpeedMultiplier: 1,
    flyingZombieBonus: 0,
    aquaticBonus: 0.2
  },
  roof: {
    id: 'roof',
    name_cn: '屋顶',
    name_en: 'Roof',
    rows: 5,
    cols: 9,
    waterRows: [],
    hasFog: false,
    sunMultiplier: 1,
    cooldownMultiplier: 1.3,
    zombieSpeedMultiplier: 1,
    flyingZombieBonus: 0.5,
    hasSlope: true
  },
  fog_forest: {
    id: 'fog_forest',
    name_cn: '迷雾森林',
    name_en: 'Fog Forest',
    rows: 5,
    cols: 9,
    waterRows: [],
    hasFog: true,
    fogRadius: 2,
    sunMultiplier: 1,
    cooldownMultiplier: 1,
    zombieSpeedMultiplier: 1.1,
    flyingZombieBonus: 0,
    trackerBonus: 0.3
  }
};
