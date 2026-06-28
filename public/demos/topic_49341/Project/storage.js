const Storage = {
  KEY_PREFIX: 'shaoniandu_',
  
  KEYS: {
    GAME_STATE: 'game_state',
    BADGES: 'badges',
    CHOICES: 'choices',
    SETTINGS: 'settings'
  },

  getKey(key) {
    return this.KEY_PREFIX + key;
  },

  save(key, value) {
    try {
      localStorage.setItem(this.getKey(key), JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn('Storage save failed:', e);
      return false;
    }
  },

  load(key, defaultValue = null) {
    try {
      const data = localStorage.getItem(this.getKey(key));
      return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
      console.warn('Storage load failed:', e);
      return defaultValue;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(this.getKey(key));
      return true;
    } catch (e) {
      console.warn('Storage remove failed:', e);
      return false;
    }
  },

  clearAll() {
    try {
      Object.values(this.KEYS).forEach(key => {
        localStorage.removeItem(this.getKey(key));
      });
      return true;
    } catch (e) {
      console.warn('Storage clear failed:', e);
      return false;
    }
  },

  saveGameState(state) {
    return this.save(this.KEYS.GAME_STATE, state);
  },

  loadGameState() {
    return this.load(this.KEYS.GAME_STATE);
  },

  saveBadges(badges) {
    return this.save(this.KEYS.BADGES, badges);
  },

  loadBadges() {
    return this.load(this.KEYS.BADGES, []);
  },

  saveChoices(choices) {
    return this.save(this.KEYS.CHOICES, choices);
  },

  loadChoices() {
    return this.load(this.KEYS.CHOICES, []);
  },

  saveSettings(settings) {
    return this.save(this.KEYS.SETTINGS, settings);
  },

  loadSettings() {
    return this.load(this.KEYS.SETTINGS, {
      audioEnabled: true,
      bgmVolume: 0.3,
      sfxVolume: 0.5
    });
  }
};
