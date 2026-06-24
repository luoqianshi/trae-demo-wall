export const i18n = {
  currentLang: 'zh',
  
  dictionaries: {
    zh: {
      start: '开始游戏',
      restart: '重新开始',
      nextLevel: '下一关',
      hp: '墨心',
      score: '积分',
      level: '关卡',
      radicals: '部首收集',
      drawHint: '按住鼠标描摹部首',
      drawHintBoss: '请描摹部首',
      cancel: '取消',
      confirm: '确认',
      victory: '通关成功!',
      gameOver: '游戏结束',
      finalScore: '最终得分',
      collectedChars: '收集汉字',
      collected: '收集汉字',
      reward: '获得道具',
      weakness: '弱点!',
    },
    en: {
      start: 'Start Game',
      restart: 'Restart',
      nextLevel: 'Next Level',
      hp: 'HP',
      score: 'Score',
      level: 'Level',
      radicals: 'Radicals',
      drawHint: 'Hold to draw the stroke',
      drawHintBoss: 'Please draw the character',
      cancel: 'Cancel',
      confirm: 'Confirm',
      victory: 'Victory!',
      gameOver: 'Game Over',
      finalScore: 'Final Score',
      collectedChars: 'Collected Characters',
      collected: 'Collected',
      reward: 'Reward',
      weakness: 'Weakness!',
    }
  },

  setLanguage(lang) {
    this.currentLang = lang;
  },

  get(key) {
    return this.dictionaries[this.currentLang][key] || key;
  }
};