/* ==========================================
   音乐播放器 - Web Audio API 生成配套轻音乐
   纯浏览器端合成，无需外部音频文件
   ========================================== */

const MusicPlayer = (() => {
  let audioCtx = null;
  let currentNodes = [];
  let isPlaying = false;
  let currentMood = null;
  let volume = 0.4;
  let masterGain = null;

  // 各情绪的音频参数
  const MOOD_CONFIG = {
    sweet: {
      name: '甜宠BGM',
      // C大调甜蜜旋律 - 音符序列
      notes: [
        523.25, 587.33, 659.25, 698.46, 783.99, 698.46, 659.25, 587.33,
        523.25, 587.33, 659.25, 783.99, 880.00, 783.99, 659.25, 587.33
      ],
      tempo: 0.4,
      waveType: 'sine',
      padFreq: [261.63, 329.63], // C4, E4 和弦
      filterFreq: 2000,
      filterQ: 1
    },
    angsty: {
      name: '虐心BGM',
      notes: [
        293.66, 329.63, 349.23, 392.00, 349.23, 329.63, 293.66, 261.63,
        246.94, 261.63, 293.66, 329.63, 293.66, 261.63, 246.94, 220.00
      ],
      tempo: 0.55,
      waveType: 'triangle',
      padFreq: [146.83, 220.00], // D3, A3 小调
      filterFreq: 1200,
      filterQ: 2
    },
    passionate: {
      name: '热血BGM',
      notes: [
        220.00, 261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 440.00,
        392.00, 329.63, 293.66, 261.63, 220.00, 261.63, 329.63, 392.00
      ],
      tempo: 0.25,
      waveType: 'sawtooth',
      padFreq: [110.00, 164.81, 220.00], // A2, E3, A3 power chord
      filterFreq: 3000,
      filterQ: 0.5
    },
    suspense: {
      name: '悬疑BGM',
      notes: [
        440.00, 0, 466.16, 0, 415.30, 0, 392.00, 0,
        440.00, 0, 466.16, 415.30, 0, 440.00, 0, 392.00
      ],
      tempo: 0.35,
      waveType: 'sine',
      padFreq: [110.00, 138.59, 164.81], // A2, C#3, E3 augmented
      filterFreq: 800,
      filterQ: 5
    }
  };

  /**
   * 初始化音频上下文
   */
  function initAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = volume;
    masterGain.connect(audioCtx.destination);
  }

  /**
   * 播放旋律
   */
  function playMelody(mood) {
    initAudio();
    stop();

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const config = MOOD_CONFIG[mood];
    if (!config) return;

    currentMood = mood;
    isPlaying = true;

    // 创建低音pad
    for (const freq of config.padFreq) {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const filter = audioCtx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.value = freq;

      filter.type = 'lowpass';
      filter.frequency.value = config.filterFreq;
      filter.Q.value = config.filterQ;

      gain.gain.value = 0.06;
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
      osc.start();

      currentNodes.push({ osc, gain, filter });
    }

    // 循环播放旋律
    let noteIndex = 0;

    function playNote() {
      if (!isPlaying || currentMood !== mood) return;

      const freq = config.notes[noteIndex % config.notes.length];

      if (freq > 0) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        const filter = audioCtx.createBiquadFilter();

        osc.type = config.waveType;
        osc.frequency.value = freq;

        filter.type = 'lowpass';
        filter.frequency.value = config.filterFreq;
        filter.Q.value = config.filterQ;

        // ADSR 包络
        const now = audioCtx.currentTime;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.08, now + 0.05);
        gain.gain.linearRampToValueAtTime(0.04, now + 0.15);
        gain.gain.linearRampToValueAtTime(0, now + config.tempo * 0.9);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);

        osc.start(now);
        osc.stop(now + config.tempo);
      }

      noteIndex++;
      setTimeout(playNote, config.tempo * 1000);
    }

    playNote();
  }

  /**
   * 停止播放
   */
  function stop() {
    isPlaying = false;
    currentMood = null;

    for (const node of currentNodes) {
      try {
        node.osc.stop();
        node.osc.disconnect();
        node.gain.disconnect();
        if (node.filter) node.filter.disconnect();
      } catch (e) { /* 忽略 */ }
    }
    currentNodes = [];

    // 更新按钮状态
    document.querySelectorAll('.music-btn').forEach(btn => {
      btn.classList.remove('playing', 'active');
      const icon = btn.querySelector('i');
      if (icon) {
        icon.className = 'fas fa-play';
      }
    });
  }

  /**
   * 切换播放/暂停
   */
  function toggle(mood) {
    initAudio();

    if (currentMood === mood && isPlaying) {
      stop();
      return;
    }

    playMelody(mood);

    // 更新按钮状态
    document.querySelectorAll('.music-btn').forEach(btn => {
      btn.classList.remove('playing', 'active');
      const icon = btn.querySelector('i');
      if (icon) icon.className = 'fas fa-play';
    });

    const activeBtn = document.querySelector(`.music-btn[data-music="${mood}"]`);
    if (activeBtn) {
      activeBtn.classList.add('playing', 'active');
      const icon = activeBtn.querySelector('i');
      if (icon) icon.className = 'fas fa-pause';
    }
  }

  /**
   * 设置音量
   */
  function setVolume(val) {
    volume = val;
    if (masterGain) {
      masterGain.gain.value = val;
    }
  }

  /**
   * 根据情绪自动播放
   */
  function autoPlay(emotion) {
    if (emotion && MOOD_CONFIG[emotion]) {
      playMelody(emotion);
      // 更新按钮状态
      document.querySelectorAll('.music-btn').forEach(btn => {
        btn.classList.remove('playing', 'active');
        const icon = btn.querySelector('i');
        if (icon) icon.className = 'fas fa-play';
      });
      const activeBtn = document.querySelector(`.music-btn[data-music="${emotion}"]`);
      if (activeBtn) {
        activeBtn.classList.add('playing', 'active');
        const icon = activeBtn.querySelector('i');
        if (icon) icon.className = 'fas fa-pause';
      }
    }
  }

  return {
    toggle,
    stop,
    setVolume,
    autoPlay,
    isPlaying: () => isPlaying,
    getCurrentMood: () => currentMood
  };
})();
