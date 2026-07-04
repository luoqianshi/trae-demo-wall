export class HUD {
  constructor(game) {
    this.game = game;
  }

  update() {
    this.updateLevel();
    this.updateScore();
    this.updateHP();
    this.updateTimer();
    this.updateRadicals();
  }

  updateLevel() {
    document.getElementById('level-num').textContent = this.game.level;
    if (this.game.currentChar) {
      document.getElementById('current-char').textContent = this.game.currentChar.char;
    }
  }

  updateScore() {
    document.querySelector('.score-value').textContent = this.game.score;
  }

  updateHP() {
    const hearts = document.querySelectorAll('.heart');
    hearts.forEach((heart, index) => {
      if (index < this.game.hp) {
        heart.classList.add('active');
      } else {
        heart.classList.remove('active');
      }
    });
  }

  updateTimer() {
    const timerText = document.querySelector('.timer-text');
    const timerFill = document.querySelector('.timer-fill');
    
    const seconds = Math.ceil(this.game.timer);
    timerText.textContent = `${seconds}s`;
    
    const percentage = (this.game.timer / 20) * 100;
    timerFill.style.width = `${percentage}%`;
    
    if (this.game.timer <= 5) {
      timerFill.style.backgroundColor = '#c41e3a';
    } else if (this.game.timer <= 10) {
      timerFill.style.backgroundColor = '#d4af37';
    } else {
      timerFill.style.backgroundColor = '#228b22';
    }
  }

  updateRadicals() {
    const container = document.getElementById('radical-slots');
    container.innerHTML = '';
    
    if (!this.game.currentChar) return;
    
    this.game.currentChar.radicals.forEach((radical, index) => {
      const slot = document.createElement('div');
      slot.className = 'radical-slot';
      
      if (this.game.collectedRadicals.includes(radical)) {
        slot.classList.add('collected');
        slot.textContent = radical;
      } else {
        slot.classList.add('empty');
        slot.textContent = `${index + 1}`;
      }
      
      container.appendChild(slot);
    });
  }
}