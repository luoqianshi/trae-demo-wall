export class Economy {
  constructor(game) {
    this.game = game;
    this.sun = 50;
    this.coins = 0;
    this.energy = {
      blue: 0,
      purple: 0,
      gold: 0,
      red: 0
    };
    this._coinDropBonus = 0;
    this._sunProductionBonus = 0;
  }

  addSun(amount) {
    const bonus = 1 + this._sunProductionBonus;
    this.sun += Math.floor(amount * bonus);
  }

  spendSun(amount) {
    if (this.sun < amount) return false;
    this.sun -= amount;
    return true;
  }

  addCoins(amount) {
    const bonus = 1 + this._coinDropBonus;
    this.coins += Math.floor(amount * bonus);
  }

  spendCoins(amount) {
    if (this.coins < amount) return false;
    this.coins -= amount;
    return true;
  }

  addEnergy(grade, amount) {
    if (!this.energy.hasOwnProperty(grade)) return;
    this.energy[grade] += amount;
  }

  canAfford(cost) {
    return this.sun >= cost;
  }

  canAffordCoins(cost) {
    return this.coins >= cost;
  }

  getSunPerSecond() {
    let sunflowerCount = 0;
    if (this.game && this.game.grid) {
      for (let row = 0; row < this.game.grid.rows; row++) {
        for (let col = 0; col < this.game.grid.cols; col++) {
          const plant = this.game.grid.getPlant(row, col);
          if (plant) {
            if (plant.id === 'sunflower') sunflowerCount++;
            if (plant.id === 'twin_sunflower') sunflowerCount += 2;
            if (plant.id === 'sun_shroom') sunflowerCount += 0.5;
          }
        }
      }
    }
    const baseSunPerFlower = 50 / 24;
    return sunflowerCount * baseSunPerFlower * (1 + this._sunProductionBonus);
  }

  onZombieKill(zombie) {
    if (!zombie) return;

    let coinDrop = 0;
    let energyGrade = null;
    let energyAmount = 0;

    if (zombie.isBoss) {
      coinDrop = 150;
      energyGrade = 'gold';
      energyAmount = 3;
      if (Math.random() < 0.3) {
        energyGrade = 'red';
        energyAmount = 1;
      }
    } else if (zombie.isElite) {
      coinDrop = 50;
      energyGrade = 'purple';
      energyAmount = 2;
      if (Math.random() < 0.2) {
        energyGrade = 'gold';
        energyAmount = 1;
      }
    } else {
      coinDrop = this._randomInt(1, 5);
      energyGrade = 'blue';
      energyAmount = 1;
      if (Math.random() < 0.15) {
        energyGrade = 'purple';
        energyAmount = 1;
      }
    }

    this.addCoins(coinDrop);
    if (energyGrade) {
      this.addEnergy(energyGrade, energyAmount);
    }
  }

  applyRelicBonus(effectType, value) {
    if (effectType === 'coin_drop_bonus') {
      this._coinDropBonus += value;
    }
    if (effectType === 'sun_production_bonus') {
      this._sunProductionBonus += value;
    }
  }

  _randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  serialize() {
    return {
      sun: this.sun,
      coins: this.coins,
      energy: { ...this.energy },
      coinDropBonus: this._coinDropBonus,
      sunProductionBonus: this._sunProductionBonus
    };
  }

  deserialize(data) {
    this.sun = data.sun ?? 50;
    this.coins = data.coins ?? 0;
    this.energy = data.energy ? { ...data.energy } : { blue: 0, purple: 0, gold: 0, red: 0 };
    this._coinDropBonus = data.coinDropBonus ?? 0;
    this._sunProductionBonus = data.sunProductionBonus ?? 0;
  }
}
