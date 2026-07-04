export class BattleSystem {
  constructor(game) {
    this.game = game;
    this.monsterSpawnTimer = 0;
    this.monsterSpawnInterval = 1;
    this.spawnedCount = 0;
  }

  update(deltaTime) {
    if (this.game.state !== 'PLAYING') return;
    
    if (!this.game.currentChar) return;
    
    const maxMonsters = this.game.currentChar.radicals.length;
    
    if (this.spawnedCount < maxMonsters) {
      this.monsterSpawnTimer += deltaTime;
      if (this.monsterSpawnTimer >= this.monsterSpawnInterval) {
        this.monsterSpawnTimer = 0;
        this.spawnMonster();
      }
    }
    
    this.checkWeaknessClicks();
  }

  spawnMonster() {
    const radicals = this.game.currentChar.radicals;
    const availableRadicals = radicals.filter(r => 
      !this.game.monsters.some(m => m.radical === r && !m.isBoss)
    );
    
    if (availableRadicals.length === 0) return;
    
    const radical = availableRadicals[Math.floor(Math.random() * availableRadicals.length)];
    
    const padding = 150;
    const x = padding + Math.random() * (this.game.canvas.width - padding * 2);
    const y = padding + 80 + Math.random() * (this.game.canvas.height - padding * 2 - 80);
    
    console.log('Spawning monster at:', x, y, 'radical:', radical);
    
    this.game.addMonster(x, y, radical);
    this.spawnedCount++;
    console.log('Total monsters:', this.game.monsters.length);
    this.game.audio.playSpawn();
  }

  checkWeaknessClicks() {
    if (!this.game.mouseX || !this.game.mouseY) return;
    
    this.game.monsters.forEach(monster => {
      if (monster.weaknessActive && monster.isClicked(this.game.mouseX, this.game.mouseY)) {
        this.game.showDrawModal(monster.radical, monster);
        monster.deactivateWeakness();
      }
    });
  }

  reset() {
    this.monsterSpawnTimer = 0;
    this.spawnedCount = 0;
  }
}