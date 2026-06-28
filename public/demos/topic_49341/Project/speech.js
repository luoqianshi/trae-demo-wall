const SpeechManager = {
  synth: null,
  voices: [],
  currentUtterance: null,
  isSpeaking: false,
  currentText: '',
  estimatedDuration: 0,
  startTime: 0,
  
  // 优化参数：更慢的语速，更柔和的语调
  defaultRate: 0.75,      // 稍慢的语速，更有感情
  defaultPitch: 1.1,      // 稍高的音调，更温柔
  defaultVolume: 0.8,
  
  // 情感模式参数
  emotions: {
    sad: { rate: 0.65, pitch: 0.95, volume: 0.7 },      // 悲伤：慢、低沉、轻声
    calm: { rate: 0.7, pitch: 1.0, volume: 0.75 },      // 平静：慢、稳定
    warm: { rate: 0.75, pitch: 1.1, volume: 0.8 },       // 温暖：稍慢、明亮
    anxious: { rate: 0.8, pitch: 1.2, volume: 0.75 },     // 焦虑：稍快、紧张
    hopeful: { rate: 0.8, pitch: 1.15, volume: 0.85 },   // 希望：轻快、明亮
  },

  init() {
    if ('speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this._loadVoices();
      
      // 延迟加载语音，确保浏览器完全初始化
      setTimeout(() => this._loadVoices(), 100);
      
      window.speechSynthesis.onvoiceschanged = () => {
        this._loadVoices();
      };
    }
  },

  _loadVoices() {
    if (!this.synth) return;
    try {
      this.voices = this.synth.getVoices();
    } catch (e) {
      console.warn('Failed to load voices:', e);
    }
  },

  _getChineseVoice() {
    if (!this.voices.length) {
      this._loadVoices();
    }
    
    // 优先选择高质量的语音
    const preferredVoices = [
      'Google 普通话（中国大陆）',
      'Google 普通话',
      'Google Chinese (Simplified, Han)',
      'Microsoft Huihui',
      'Microsoft Yaoyao',
      'Microsoft Kangkang',
      'zh-CN'
    ];

    for (const name of preferredVoices) {
      const voice = this.voices.find(v => 
        v.name.includes(name) || v.lang === 'zh-CN' || v.lang === 'zh'
      );
      if (voice) return voice;
    }

    // 回退：选择任何中文语音
    const chineseVoice = this.voices.find(v => 
      v.lang.startsWith('zh') || v.lang.includes('Chinese')
    );
    
    return chineseVoice || null;
  },

  // 根据文字情感选择参数
  _getEmotionParams(text) {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('不会') || lowerText.includes('不懂') || 
        lowerText.includes('难过') || lowerText.includes('委屈') ||
        lowerText.includes('害怕') || lowerText.includes('迷茫')) {
      return this.emotions.sad;
    }
    
    if (lowerText.includes('帮助') || lowerText.includes('记得') ||
        lowerText.includes('温暖') || lowerText.includes('谢谢') ||
        lowerText.includes('理解')) {
      return this.emotions.warm;
    }
    
    if (lowerText.includes('希望') || lowerText.includes('加油') ||
        lowerText.includes('成长') || lowerText.includes('勇敢')) {
      return this.emotions.hopeful;
    }
    
    if (lowerText.includes('紧张') || lowerText.includes('焦虑') ||
        lowerText.includes('担心')) {
      return this.emotions.anxious;
    }
    
    return this.emotions.calm;
  },

  speak(text, emotion = 'calm', callback) {
    if (!this.synth) {
      if (callback) callback(false);
      return false;
    }

    this.stop();
    this.currentText = text;

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = this._getChineseVoice();
    const emotionParams = this._getEmotionParams(text);
    
    if (voice) {
      utterance.voice = voice;
    }
    
    utterance.lang = 'zh-CN';
    utterance.rate = emotionParams.rate;
    utterance.pitch = emotionParams.pitch;
    utterance.volume = emotionParams.volume;

    // 计算预估朗读时长（每字符约150ms）
    this.estimatedDuration = text.length * 150 + 400;
    this.startTime = Date.now();

    utterance.onstart = () => {
      this.isSpeaking = true;
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      if (callback) callback(true);
    };

    utterance.onerror = (e) => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      console.warn('Speech error:', e);
      if (callback) callback(false);
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
    
    return true;
  },

  // 同步朗读：等待朗读完成
  speakSync(text, emotion = 'calm', onProgress = null) {
    return new Promise((resolve) => {
      this.speak(text, emotion, (completed) => {
        resolve(completed);
      });
    });
  },

  // 获取当前朗读进度（0-1）
  getProgress() {
    if (!this.isSpeaking || !this.startTime) return 0;
    const elapsed = Date.now() - this.startTime;
    return Math.min(elapsed / this.estimatedDuration, 1);
  },

  // 获取剩余时间（毫秒）
  getRemainingTime() {
    if (!this.isSpeaking || !this.startTime) return 0;
    const elapsed = Date.now() - this.startTime;
    return Math.max(this.estimatedDuration - elapsed, 0);
  },

  stop() {
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch (e) {
        // 忽略错误
      }
    }
    this.isSpeaking = false;
    this.currentUtterance = null;
    this.currentText = '';
    this.startTime = 0;
  },

  pause() {
    if (this.synth && this.isSpeaking) {
      this.synth.pause();
    }
  },

  resume() {
    if (this.synth) {
      this.synth.resume();
    }
  },

  toggle() {
    if (this.isSpeaking) {
      this.stop();
      return false;
    }
    return true;
  },

  isSupported() {
    return 'speechSynthesis' in window;
  }
};
