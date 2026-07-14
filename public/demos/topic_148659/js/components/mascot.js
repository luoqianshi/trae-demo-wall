window.Mascot = {
  emotions: {
    idle: '🐰',
    happy: '😄',
    sad: '😢',
    surprised: '😲',
    excited: '🤩'
  },
  
  currentEmotion: 'idle',
  
  render: function(container) {
    container.innerHTML = `
      <div class="game-mascot-area">
        <div class="game-mascot" id="mascot" data-emotion="${this.currentEmotion}">${this.emotions[this.currentEmotion]}</div>
        <div class="game-mascot-text" id="mascotText">你好呀！一起学习吧~</div>
      </div>
    `;
    
    const mascot = document.getElementById('mascot');
    if (mascot) {
      mascot.addEventListener('click', () => this.onClick());
    }
  },
  
  setEmotion: function(emotion) {
    this.currentEmotion = emotion;
    const mascot = document.getElementById('mascot');
    if (mascot) {
      mascot.textContent = this.emotions[emotion];
      mascot.dataset.emotion = emotion;
      mascot.classList.remove('happy', 'sad', 'surprised');
      mascot.classList.add(emotion);
    }
    
    const text = document.getElementById('mascotText');
    if (text) {
      text.textContent = this.getEmotionText(emotion);
    }
    
    setTimeout(() => {
      if (mascot) {
        mascot.classList.remove('happy', 'sad', 'surprised');
      }
    }, 1000);
  },
  
  getEmotionText: function(emotion) {
    const texts = {
      idle: '你好呀！一起学习吧~',
      happy: '太棒了！继续加油！',
      sad: '别灰心，再来一次！',
      surprised: '哇！升级了！',
      excited: '🎉 太厉害了！'
    };
    return texts[emotion] || texts.idle;
  },
  
  onClick: function() {
    const emotions = ['happy', 'excited', 'surprised'];
    const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
    this.setEmotion(randomEmotion);
  }
};

document.addEventListener('mascotEmotion', function(e) {
  window.Mascot.setEmotion(e.detail);
});