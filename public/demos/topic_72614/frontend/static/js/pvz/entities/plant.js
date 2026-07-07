// plant.js - PVZ植物实体类

const CELL_SIZE = 80;
const GRID_OFFSET_X = 80;
const GRID_OFFSET_Y = 100;

export class Plant {
  constructor(plantData, row, col) {
    this.id = plantData.id;
    this.name = plantData.name_cn || plantData.name_en;
    this.genePool = plantData.gene_pool;
    this.category = plantData.category;
    this.cost = plantData.cost;
    this.hp = plantData.hp;
    this.maxHp = plantData.hp;
    this.cooldown = plantData.cooldown;
    this.damage = plantData.damage;
    this.attackSpeed = plantData.attack_speed;
    this.range = plantData.range;
    this.special = plantData.special;
    this.isNight = plantData.is_night;
    this.isAquatic = plantData.is_aquatic;

    this.row = row;
    this.col = col;
    this.x = col * CELL_SIZE + GRID_OFFSET_X;
    this.y = row * CELL_SIZE + GRID_OFFSET_Y;

    this.state = 'idle';
    this.attackTimer = 0;
    this.sprite = null;

    // 蘑菇类默认休眠（需要咖啡豆唤醒）
    if (this.isNight && this.genePool !== 'support') {
      this.state = 'sleeping';
    }

    // 生产类计时器
    this.productionTimer = this.attackSpeed > 0 ? this.attackSpeed : 0;

    // 爆炸类是否已爆炸
    this.hasExploded = false;

    // 土豆雷准备时间（减半以提升平衡性）
    this.isReady = this.id !== 'potato_mine';
    this.readyTimer = this.id === 'potato_mine' ? 7.5 : 0;

    // 大嘴花消化中
    this.isDigesting = false;
    this.digestTimer = 0;

    // 胆小蘑菇躲藏
    this.isHiding = false;

    // 阳光菇升级状态
    this.sunShroomLevel = this.id === 'sun_shroom' ? 1 : 0;

    // 磁力菇冷却
    this.magnetCooldown = 0;

    // 玉米大炮装填
    this.isCannonLoaded = this.id === 'cob_cannon';
    this.cannonReloadTimer = 0;
  }

  // update() 方法已删除 — 植物行为由 game.js:_updatePlant 主循环驱动
  // 保留的 _updateXxx 辅助方法仅供 _updateMelee 等被 game.js 调用的方法内部复用

  _updateMelee(deltaTime, zombies, game) {
    this.attackTimer -= deltaTime;

    // 地刺类：对踩在身上的僵尸造成伤害
    if (this.id === 'spikeweed' || this.id === 'spikerock') {
      const zombiesOnCell = zombies.filter(z =>
        z.state !== 'dead' && z.state !== 'dying' &&
        z.row === this.row &&
        Math.abs(z.x - this.x) < CELL_SIZE * 0.6 &&
        z.headType !== 'balloon'
      );
      if (zombiesOnCell.length > 0 && this.attackTimer <= 0) {
        zombiesOnCell.forEach(z => z.takeDamage(this.damage));
        this.attackTimer = this.attackSpeed;
        this.state = 'attacking';
      } else {
        this.state = 'idle';
      }
      return;
    }

    // 窝瓜：跳跃攻击
    if (this.id === 'squash') {
      const targetZombie = zombies.find(z =>
        z.state !== 'dead' && z.state !== 'dying' &&
        z.row === this.row &&
        z.x > this.x &&
        z.x <= this.x + this.range * CELL_SIZE
      );
      if (targetZombie && this.attackTimer <= 0) {
        this.state = 'attacking';
        targetZombie.takeDamage(this.damage);
        this.attackTimer = this.attackSpeed;
        // 窝瓜攻击后自毁
        this.die();
      }
      return;
    }

    // 大嘴花：吞噬
    if (this.id === 'chomper') {
      if (this.isDigesting) return;
      const adjacentZombie = zombies.find(z =>
        z.state !== 'dead' && z.state !== 'dying' &&
        z.row === this.row &&
        Math.abs(z.x - this.x) < CELL_SIZE * 1.2 &&
        z.x > this.x
      );
      if (adjacentZombie && this.attackTimer <= 0) {
        this.state = 'attacking';
        adjacentZombie.takeDamage(this.damage);
        if (adjacentZombie.hp <= 0) {
          adjacentZombie.die();
        }
        this.isDigesting = true;
        this.digestTimer = 30;
        this.attackTimer = this.attackSpeed;
      }
      return;
    }

    // 海藻
    if (this.id === 'tangle_kelp') {
      const adjacentZombie = zombies.find(z =>
        z.state !== 'dead' && z.state !== 'dying' &&
        z.row === this.row &&
        Math.abs(z.x - this.x) < CELL_SIZE * 1.2
      );
      if (adjacentZombie && this.attackTimer <= 0) {
        this.state = 'attacking';
        adjacentZombie.takeDamage(this.damage);
        this.die();
      }
      return;
    }
  }

  _updateDefense(deltaTime, zombies) {
    // 大蒜：被啃后让僵尸换行
    if (this.id === 'garlic') {
      // 逻辑在僵尸吃植物时处理
    }
    // 坚果墙/高坚果/南瓜：纯防御
    this.state = 'idle';
  }

  _updateExplosive(deltaTime, zombies, game) {
    if (this.hasExploded) return;

    // 樱桃炸弹：立即爆炸
    if (this.id === 'cherry_bomb') {
      this._detonate(zombies, game, 3);
      return;
    }

    // 土豆雷：僵尸踩上时爆炸
    if (this.id === 'potato_mine') {
      if (!this.isReady) return;
      const zombieOnMine = zombies.some(z =>
        z.state !== 'dead' && z.state !== 'dying' &&
        z.row === this.row &&
        Math.abs(z.x - this.x) < CELL_SIZE * 0.6
      );
      if (zombieOnMine) {
        this._detonate(zombies, game, 1);
      }
      return;
    }

    // 火爆辣椒：立即整行爆炸
    if (this.id === 'jalapeno') {
      this._detonateRow(zombies, game);
      return;
    }

    // 毁灭蘑菇：大范围爆炸
    if (this.id === 'doom_shroom') {
      this._detonate(zombies, game, 7);
      return;
    }
  }

  _updateSupport(deltaTime, zombies, game) {
    this.attackTimer -= deltaTime;

    // 火炬树桩：被动增强豌豆
    if (this.id === 'torchwood') {
      // 逻辑在投射物经过时处理
      this.state = 'idle';
      return;
    }

    // 磁力菇：吸取金属防具
    if (this.id === 'magnet_shroom') {
      if (this.magnetCooldown > 0) {
        this.magnetCooldown -= deltaTime;
        this.state = 'idle';
        return;
      }
      const metalZombie = zombies.find(z =>
        z.state !== 'dead' && z.state !== 'dying' &&
        Math.abs(z.row - this.row) <= 2 &&
        Math.abs(z.x - this.x) <= this.range * CELL_SIZE &&
        z.hasMetal
      );
      if (metalZombie) {
        this.state = 'special';
        metalZombie.removeMetal();
        this.magnetCooldown = this.attackSpeed;
      }
      return;
    }

    // 吸金磁：自动吸取金币
    if (this.id === 'gold_magnet') {
      if (this.attackTimer <= 0) {
        this.state = 'special';
        game.collectNearbyCoins(this.x, this.y, this.range * CELL_SIZE);
        this.attackTimer = this.attackSpeed;
      }
      return;
    }

    // 咖啡豆：唤醒蘑菇（使用时处理）
    if (this.id === 'coffee_bean') {
      this.state = 'idle';
      return;
    }

    // 路灯花：照明迷雾
    if (this.id === 'plantern') {
      this.state = 'idle';
      return;
    }

    // 睡莲/花盆：平台
    if (this.id === 'lilypad' || this.id === 'flower_pot') {
      this.state = 'idle';
      return;
    }

    // 莴苣：保护3x3
    if (this.id === 'umbrella_leaf') {
      this.state = 'idle';
      return;
    }

    // 墓碑吞噬者
    if (this.id === 'grave_buster') {
      this.state = 'idle';
      return;
    }
  }

  _updateControl(deltaTime, zombies, game) {
    // 催眠蘑菇：被僵尸吃掉时魅惑
    if (this.id === 'hypno_shroom') {
      this.state = 'idle';
      return;
    }

    // 冰镇蘑菇：立即全屏冻结
    if (this.id === 'ice_shroom') {
      this.state = 'special';
      game.freezeAllZombies(5);
      zombies.forEach(z => {
        if (z.state !== 'dead' && z.state !== 'dying') {
          z.takeDamage(this.damage);
        }
      });
      this.die();
      return;
    }

    // 三叶草：吹飞空中僵尸
    if (this.id === 'blover') {
      this.state = 'special';
      zombies.forEach(z => {
        if (z.state !== 'dead' && z.state !== 'dying' && z.headType === 'balloon') {
          z.die();
        }
      });
      game.clearFog();
      this.die();
      return;
    }
  }

  _updateSpecial(deltaTime, zombies, game) {
    // 玉米大炮
    if (this.id === 'cob_cannon') {
      if (!this.isCannonLoaded) {
        this.cannonReloadTimer -= deltaTime;
        if (this.cannonReloadTimer <= 0) {
          this.isCannonLoaded = true;
        }
      }
      this.state = this.isCannonLoaded ? 'idle' : 'special';
      return;
    }

    // 模仿者
    if (this.id === 'imitater') {
      this.state = 'idle';
      return;
    }
  }

  _launchCatapult(game, projectileType) {
    // 找同行最前面的僵尸
    const targetZombie = game.getZombiesInRow(this.row)
      .filter(z => z.state !== 'dead' && z.state !== 'dying')
      .sort((a, b) => b.x - a.x)[0];

    const targetX = targetZombie ? targetZombie.x : this.x + this.range * CELL_SIZE;
    game.spawnProjectile(
      projectileType,
      this.x + CELL_SIZE / 2,
      this.y + CELL_SIZE / 2,
      this.row,
      this.damage,
      { targetX, arcHeight: 120 }
    );
  }

  _findNearestZombie(zombies) {
    let nearest = null;
    let minDist = Infinity;
    for (const z of zombies) {
      if (z.state === 'dead' || z.state === 'dying') continue;
      const dist = Math.hypot(z.x - this.x, z.y - this.y);
      if (dist < minDist) {
        minDist = dist;
        nearest = z;
      }
    }
    return nearest;
  }

  _detonate(zombies, game, radiusCells) {
    this.hasExploded = true;
    this.state = 'special';

    const affectedZombies = zombies.filter(z => {
      if (z.state === 'dead' || z.state === 'dying') return false;
      const colDiff = Math.abs(Math.floor((z.x - GRID_OFFSET_X) / CELL_SIZE) - this.col);
      const rowDiff = Math.abs(z.row - this.row);
      return colDiff <= Math.floor(radiusCells / 2) && rowDiff <= Math.floor(radiusCells / 2);
    });

    affectedZombies.forEach(z => z.takeDamage(this.damage));

    // 毁灭蘑菇留下弹坑
    if (this.id === 'doom_shroom') {
      game.createCrater(this.row, this.col);
    }

    this.die();
  }

  _detonateRow(zombies, game) {
    this.hasExploded = true;
    this.state = 'special';

    const affectedZombies = zombies.filter(z =>
      z.state !== 'dead' && z.state !== 'dying' &&
      z.row === this.row
    );

    affectedZombies.forEach(z => z.takeDamage(this.damage));
    this.die();
  }

  die() {
    this.state = 'dead';
    this.hp = 0;

    // 爆炸类植物死亡时触发爆炸（如果还没爆炸过）
    if (this.category === 'explosive' && !this.hasExploded) {
      // 已在 _updateExplosive 中处理
    }
  }

  wakeUp() {
    if (this.state === 'sleeping') {
      this.state = 'idle';
    }
  }

  getPosition() {
    return { x: this.x, y: this.y };
  }

  getCenter() {
    return { x: this.x + CELL_SIZE / 2, y: this.y + CELL_SIZE / 2 };
  }

  serialize() {
    return {
      id: this.id,
      row: this.row,
      col: this.col,
      hp: this.hp,
      maxHp: this.maxHp,
      state: this.state,
      attackTimer: this.attackTimer,
      productionTimer: this.productionTimer,
      isReady: this.isReady,
      readyTimer: this.readyTimer,
      isDigesting: this.isDigesting,
      digestTimer: this.digestTimer,
      isHiding: this.isHiding,
      sunShroomLevel: this.sunShroomLevel,
      magnetCooldown: this.magnetCooldown,
      isCannonLoaded: this.isCannonLoaded,
      cannonReloadTimer: this.cannonReloadTimer,
      hasExploded: this.hasExploded
    };
  }

  static deserialize(data) {
    const plantData = {
      id: data.id,
      hp: data.maxHp,
      cost: 0,
      cooldown: 0,
      damage: 0,
      attack_speed: 0,
      range: 0,
      special: '',
      is_night: false,
      is_aquatic: false,
      gene_pool: '',
      category: '',
      name_cn: '',
      name_en: ''
    };
    const plant = new Plant(plantData, data.row, data.col);
    plant.hp = data.hp;
    plant.state = data.state;
    plant.attackTimer = data.attackTimer;
    plant.productionTimer = data.productionTimer;
    plant.isReady = data.isReady;
    plant.readyTimer = data.readyTimer;
    plant.isDigesting = data.isDigesting;
    plant.digestTimer = data.digestTimer;
    plant.isHiding = data.isHiding;
    plant.sunShroomLevel = data.sunShroomLevel;
    plant.magnetCooldown = data.magnetCooldown;
    plant.isCannonLoaded = data.isCannonLoaded;
    plant.cannonReloadTimer = data.cannonReloadTimer;
    plant.hasExploded = data.hasExploded;
    return plant;
  }
}
