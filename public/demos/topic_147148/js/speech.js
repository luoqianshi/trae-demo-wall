/**
 * 语音合成 - Web Speech API
 * 用于单词发音
 */

const Speech = {
  synth: window.speechSynthesis,
  voices: [],
  enabled: true,

  init() {
    if (this.synth) {
      // 加载语音列表
      const loadVoices = () => {
        this.voices = this.synth.getVoices().filter(v => v.lang.startsWith('en'));
      };
      loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = loadVoices;
      }
    }
    this.enabled = window.Store.getSettings().sound;
  },

  speak(text, rate = 0.9) {
    if (!this.enabled || !this.synth) return;
    // 取消正在播放的
    this.synth.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'en-US';
    utter.rate = rate;
    utter.pitch = 1;
    // 优先选择英文语音
    if (this.voices.length > 0) {
      utter.voice = this.voices[0];
    }
    this.synth.speak(utter);
  },

  setEnabled(enabled) {
    this.enabled = enabled;
  }
};

window.Speech = Speech;
