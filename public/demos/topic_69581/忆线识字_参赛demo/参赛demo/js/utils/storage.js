window.StorageManager = {
  KEYS: {
    LEARNED_CARDS: 'yixian_learned_cards',
    WRONG_CARDS: 'yixian_wrong_cards',
    MASTERED_CARDS: 'yixian_mastered_cards'
  },

  defaultLearnedCards: [
    { char: '人', pinyin: 'rén', category: '人物', learnedAt: Date.now() - 86400000 * 10 },
    { char: '大', pinyin: 'dà', category: '形容词', learnedAt: Date.now() - 86400000 * 9 },
    { char: '小', pinyin: 'xiǎo', category: '形容词', learnedAt: Date.now() - 86400000 * 8 },
    { char: '山', pinyin: 'shān', category: '自然', learnedAt: Date.now() - 86400000 * 7 },
    { char: '水', pinyin: 'shuǐ', category: '自然', learnedAt: Date.now() - 86400000 * 6 },
    { char: '日', pinyin: 'rì', category: '自然', learnedAt: Date.now() - 86400000 * 5 },
    { char: '月', pinyin: 'yuè', category: '自然', learnedAt: Date.now() - 86400000 * 4 },
    { char: '明', pinyin: 'míng', category: '形容词', learnedAt: Date.now() - 86400000 * 3 },
    { char: '天', pinyin: 'tiān', category: '自然', learnedAt: Date.now() - 86400000 * 2 },
    { char: '地', pinyin: 'dì', category: '自然', learnedAt: Date.now() - 86400000 * 1 }
  ],

  defaultWrongCards: [
    { char: '辨', pinyin: 'biàn', wrongCount: 3, lastWrong: Date.now() - 86400000 * 2 },
    { char: '辩', pinyin: 'biàn', wrongCount: 2, lastWrong: Date.now() - 86400000 * 1 },
    { char: '辫', pinyin: 'biàn', wrongCount: 2, lastWrong: Date.now() - 86400000 * 3 },
    { char: '掇', pinyin: 'duō', wrongCount: 1, lastWrong: Date.now() - 86400000 * 5 },
    { char: '辍', pinyin: 'chuò', wrongCount: 1, lastWrong: Date.now() - 86400000 * 4 },
    { char: '缀', pinyin: 'zhuì', wrongCount: 1, lastWrong: Date.now() - 86400000 * 6 },
    { char: '戮', pinyin: 'lù', wrongCount: 1, lastWrong: Date.now() - 86400000 * 7 },
    { char: '戳', pinyin: 'chuō', wrongCount: 1, lastWrong: Date.now() - 86400000 * 8 }
  ],

  defaultMasteredCards: [
    { char: '人', pinyin: 'rén', category: '人物', masteredAt: Date.now() - 86400000 * 7 },
    { char: '大', pinyin: 'dà', category: '形容词', masteredAt: Date.now() - 86400000 * 6 },
    { char: '小', pinyin: 'xiǎo', category: '形容词', masteredAt: Date.now() - 86400000 * 5 },
    { char: '山', pinyin: 'shān', category: '自然', masteredAt: Date.now() - 86400000 * 4 },
    { char: '水', pinyin: 'shuǐ', category: '自然', masteredAt: Date.now() - 86400000 * 3 },
    { char: '日', pinyin: 'rì', category: '自然', masteredAt: Date.now() - 86400000 * 2 },
    { char: '月', pinyin: 'yuè', category: '自然', masteredAt: Date.now() - 86400000 * 1 }
  ],

  _get: function(key, defaultValue) {
    try {
      const data = localStorage.getItem(key);
      if (data === null) {
        return defaultValue || [];
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('[StorageManager] 读取数据失败:', key, e);
      return defaultValue || [];
    }
  },

  _set: function(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('[StorageManager] 保存数据失败:', key, e);
      return false;
    }
  },

  getLearnedCards: function() {
    const cards = this._get(this.KEYS.LEARNED_CARDS, null);
    if (cards.length === 0) {
      this._set(this.KEYS.LEARNED_CARDS, this.defaultLearnedCards);
      return [...this.defaultLearnedCards];
    }
    return cards;
  },

  addLearnedCard: function(card) {
    const cards = this.getLearnedCards();
    const exists = cards.find(c => c.char === card.char);
    if (!exists) {
      cards.push({
        char: card.char,
        pinyin: card.pinyin || '',
        category: card.category || '',
        learnedAt: Date.now()
      });
      this._set(this.KEYS.LEARNED_CARDS, cards);
      return true;
    }
    return false;
  },

  getWrongCards: function() {
    const cards = this._get(this.KEYS.WRONG_CARDS, null);
    if (cards.length === 0) {
      this._set(this.KEYS.WRONG_CARDS, this.defaultWrongCards);
      return [...this.defaultWrongCards];
    }
    return cards;
  },

  addWrongCard: function(card) {
    const cards = this.getWrongCards();
    const exists = cards.find(c => c.char === card.char);
    if (exists) {
      exists.wrongCount = (exists.wrongCount || 0) + 1;
      exists.lastWrong = Date.now();
    } else {
      cards.push({
        char: card.char,
        pinyin: card.pinyin || '',
        wrongCount: 1,
        lastWrong: Date.now()
      });
    }
    this._set(this.KEYS.WRONG_CARDS, cards);
    return true;
  },

  removeWrongCard: function(char) {
    const cards = this.getWrongCards();
    const index = cards.findIndex(c => c.char === char);
    if (index > -1) {
      cards.splice(index, 1);
      this._set(this.KEYS.WRONG_CARDS, cards);
      return true;
    }
    return false;
  },

  getMasteredCards: function() {
    const cards = this._get(this.KEYS.MASTERED_CARDS, null);
    if (cards.length === 0) {
      this._set(this.KEYS.MASTERED_CARDS, this.defaultMasteredCards);
      return [...this.defaultMasteredCards];
    }
    return cards;
  },

  addMasteredCard: function(card) {
    const cards = this.getMasteredCards();
    const exists = cards.find(c => c.char === card.char);
    if (!exists) {
      cards.push({
        char: card.char,
        pinyin: card.pinyin || '',
        category: card.category || '',
        masteredAt: Date.now()
      });
      this._set(this.KEYS.MASTERED_CARDS, cards);
      return true;
    }
    return false;
  },

  getStats: function() {
    const learned = this.getLearnedCards().length;
    const wrong = this.getWrongCards().length;
    const mastered = this.getMasteredCards().length;
    return {
      totalLearned: learned,
      totalWrong: wrong,
      totalMastered: mastered,
      masteryRate: learned > 0 ? Math.round((mastered / learned) * 100) : 0
    };
  },

  resetAll: function() {
    localStorage.removeItem(this.KEYS.LEARNED_CARDS);
    localStorage.removeItem(this.KEYS.WRONG_CARDS);
    localStorage.removeItem(this.KEYS.MASTERED_CARDS);
  }
};

window.getLearnedCards = function() {
  return window.StorageManager.getLearnedCards();
};

window.addLearnedCard = function(card) {
  return window.StorageManager.addLearnedCard(card);
};

window.getWrongCards = function() {
  return window.StorageManager.getWrongCards();
};

window.addWrongCard = function(card) {
  return window.StorageManager.addWrongCard(card);
};

window.getMasteredCards = function() {
  return window.StorageManager.getMasteredCards();
};
