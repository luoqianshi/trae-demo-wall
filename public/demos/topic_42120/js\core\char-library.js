export class CharLibrary {
  constructor() {
    this.chars = [];
    this.loaded = false;
    this.loadPromise = null;
  }

  async loadChars() {
    if (this.loaded && this.chars.length > 0) return;
    if (this.loadPromise) return this.loadPromise;
    
    this.loadPromise = (async () => {
      try {
        const response = await fetch('data/char-100.json');
        this.chars = await response.json();
        this.loaded = true;
      } catch (error) {
        console.error('Failed to load character data:', error);
        this.chars = [
          { char: '一', difficulty: 1, radicals: ['一'] },
          { char: '二', difficulty: 1, radicals: ['一', '一'] },
          { char: '十', difficulty: 1, radicals: ['一', '丨'] },
          { char: '人', difficulty: 1, radicals: ['丿', '㇏'] },
          { char: '大', difficulty: 1, radicals: ['一', '丿', '㇏'] },
          { char: '小', difficulty: 1, radicals: ['亅', '丿', '丶'] },
          { char: '口', difficulty: 1, radicals: ['丨', '𠃌', '一'] },
          { char: '日', difficulty: 1, radicals: ['丨', '𠃌', '一', '一'] },
          { char: '月', difficulty: 1, radicals: ['丿', '𠃌', '一', '一'] },
          { char: '水', difficulty: 1, radicals: ['亅', '㇇', '㇏', '丶'] },
        ];
        this.loaded = true;
      }
      this.loadPromise = null;
    })();
    
    return this.loadPromise;
  }

  getCharByDifficulty(difficulty) {
    return this.chars.filter(c => c.difficulty === difficulty);
  }

  getRandomChar(excludeChars = [], maxDifficulty = 3) {
    const available = this.chars.filter(
      c => !excludeChars.includes(c.char) && c.difficulty <= maxDifficulty
    );
    if (available.length === 0) return this.chars[0];
    return available[Math.floor(Math.random() * available.length)];
  }

  getStartingChars() {
    return this.chars.filter(c => c.difficulty === 1).slice(0, 10);
  }
}