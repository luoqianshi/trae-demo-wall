export class LevelSystem {
  constructor(game) {
    this.game = game;
    this.usedChars = [];
  }

  async startLevel(level) {
    await this.game.charLibrary.loadChars();
    
    console.log('Chars loaded:', this.game.charLibrary.chars.length);
    console.log('Level:', level);
    
    let maxDifficulty = 1;
    if (level >= 3) {
      maxDifficulty = Math.min(3, Math.floor(level / 3) + 1);
    }
    
    const char = this.game.charLibrary.getRandomChar(this.usedChars, maxDifficulty);
    
    if (!char || !char.radicals || char.radicals.length === 0) {
      char = { char: '一', difficulty: 1, radicals: ['一'] };
    }
    
    console.log('Selected char:', char);
    
    this.game.currentChar = char;
    this.usedChars.push(char.char);
    
    this.game.timer = 20;
    this.game.collectedRadicals = [];
    
    this.game.battleSystem.reset();
    this.game.hud.update();
    this.game.hud.updateRadicals();
    
    this.game.floatTexts.push({
      x: this.game.centerX,
      y: this.game.centerY - 50,
      text: `第 ${level} 关: ${char.char}`,
      color: '#2c2c2c',
      alpha: 1
    });
  }

  getNextChar() {
    return this.game.charLibrary.getRandomChar(this.usedChars);
  }
}