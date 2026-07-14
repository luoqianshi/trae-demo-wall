/* ===== TTS 语音朗读 ===== */
var TTS = {
  speaking: false,
  synth: window.speechSynthesis,

  speak: function(text, callback) {
    if (!this.synth) return;
    this.synth.cancel();
    var utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'zh-CN';
    utter.rate = 0.9;
    utter.pitch = 1.1;
    utter.onend = function() {
      TTS.speaking = false;
      if (callback) callback();
    };
    utter.onerror = function() {
      TTS.speaking = false;
    };
    this.speaking = true;
    this.synth.speak(utter);
  },

  stop: function() {
    if (this.synth) {
      this.synth.cancel();
      this.speaking = false;
    }
  },

  toggle: function(text, btnEl, callback) {
    if (this.speaking) {
      this.stop();
      if (btnEl) btnEl.classList.remove('speaking');
    } else {
      var self = this;
      if (btnEl) btnEl.classList.add('speaking');
      this.speak(text, function() {
        if (btnEl) btnEl.classList.remove('speaking');
        if (callback) callback();
      });
    }
  }
};