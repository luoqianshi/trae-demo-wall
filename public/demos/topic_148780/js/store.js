// ============================================
// 状态管理（Store + localStorage）
// ============================================
const STORAGE_KEY = 'kidgo_state';

const store = {
  _state: {
    collections: [],
    records: [],
    weights: {},
    params: {},
    recommendations: [],
    selectedDestination: null,
    tab: 'home',
    p4State: 'list',
    profile: {
      babyName: '荔枝',
      ageGroup: '3-6',
      gender: '',
      interests: ['动物', '自然'],
      allergies: [],
      preferredDuration: 'half',
      transport: 'drive',
      needsStroller: true,
      preferredTime: 'morning',
      maxDistance: 60,
      stats: {
        totalTrips: 0,
        outdoorRatio: 0,
        likedTypes: [],
        dislikedTypes: [],
        avgDuration: 'half',
        timePreference: 'morning'
      }
    }
  },
  
  get(key) {
    return this._state[key];
  },
  
  set(key, value) {
    this._state[key] = value;
    this.persist();
  },
  
  getState() {
    return this._state;
  },
  
  init(defaults) {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.collections) this._state.collections = parsed.collections;
        if (parsed.records) this._state.records = parsed.records;
        if (parsed.weights) this._state.weights = parsed.weights;
        if (parsed.profile) this._state.profile = { ...this._state.profile, ...parsed.profile };
      }
    } catch (e) {
      console.warn('localStorage load failed:', e);
    }
    if (this._state.collections.length === 0 && defaults.collections) {
      this._state.collections = defaults.collections;
    }
    if (this._state.records.length === 0 && defaults.records) {
      this._state.records = defaults.records;
    }
    if (Object.keys(this._state.weights).length === 0 && defaults.weights) {
      this._state.weights = defaults.weights;
    }
    this._state.params = defaults.params || {};
    this._state.tab = defaults.tab || 'home';
  },
  
  persist() {
    try {
      const toSave = {
        collections: this._state.collections,
        records: this._state.records,
        weights: this._state.weights,
        profile: this._state.profile
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (e) {
      console.warn('localStorage save failed:', e);
    }
  },
  
  clear() {
    localStorage.removeItem(STORAGE_KEY);
  }
};
