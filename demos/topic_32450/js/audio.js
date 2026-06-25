(function () {
  "use strict";

  var context = null;

  function getContext() {
    if (!context) {
      var AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) {
        return null;
      }
      context = new AudioContext();
    }
    if (context.state === "suspended") {
      context.resume();
    }
    return context;
  }

  function isEnabled() {
    return window.MoodStorage.loadSettings().sound !== false;
  }

  function tone(freq, duration, type, gainValue, slideTo) {
    if (!isEnabled()) {
      return;
    }
    var ctx = getContext();
    if (!ctx) {
      return;
    }
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    var now = ctx.currentTime;
    osc.type = type || "sine";
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
    }
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(gainValue || 0.08, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  function noise(duration, gainValue) {
    if (!isEnabled()) {
      return;
    }
    var ctx = getContext();
    if (!ctx) {
      return;
    }
    var buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < data.length; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }
    var source = ctx.createBufferSource();
    var gain = ctx.createGain();
    var now = ctx.currentTime;
    gain.gain.setValueAtTime(gainValue || 0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    source.buffer = buffer;
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start(now);
    source.stop(now + duration);
  }

  window.MoodAudio = {
    pop: function () {
      tone(720, 0.09, "sine", 0.07, 1180);
      noise(0.06, 0.03);
    },
    squish: function () {
      tone(160, 0.16, "triangle", 0.07, 90);
    },
    crush: function () {
      noise(0.26, 0.08);
      tone(240, 0.2, "sawtooth", 0.045, 80);
    },
    flip: function () {
      tone(420, 0.08, "square", 0.04, 760);
      setTimeout(function () {
        tone(640, 0.07, "sine", 0.035, 920);
      }, 70);
    },
    success: function () {
      tone(520, 0.1, "sine", 0.045, 660);
      setTimeout(function () {
        tone(780, 0.14, "sine", 0.045, 980);
      }, 95);
    },
    // 温柔音阶：按给定频率弹一个柔和的音
    chime: function (freq) {
      tone(freq || 523, 0.5, "sine", 0.06);
      tone((freq || 523) * 2, 0.32, "triangle", 0.02);
    },
    // 擦雾见晴：轻柔的“呼”一声
    wipe: function () {
      noise(0.12, 0.022);
    },
    // 敲木鱼：清脆的“笃”一声
    knock: function () {
      tone(440, 0.14, "sine", 0.07, 150);
      noise(0.05, 0.02);
    }
  };
})();
