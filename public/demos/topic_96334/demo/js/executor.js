class CommandExecutor {
  constructor(options = {}) {
    this.onFeedback = options.onFeedback || (() => {});
    this.audioCtx = null;
    this.musicPlaying = false;
    this.musicInterval = null;
    this.callActive = false;
    this.volume = 50;
    this.currentTrack = 1;
  }

  initAudio() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  playTone(freq = 800, duration = 0.1, type = 'sine') {
    this.initAudio();
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);
    osc.start();
    osc.stop(this.audioCtx.currentTime + duration);
  }

  playSuccess() {
    this.playTone(880, 0.08);
    setTimeout(() => this.playTone(1100, 0.12), 80);
  }

  playError() {
    this.playTone(300, 0.15, 'sawtooth');
  }

  playTap() {
    this.playTone(1200, 0.05);
  }

  vibrate(pattern) {
    if (navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }

  // ===== COMMANDS =====

  toggleMusic() {
    this.musicPlaying = !this.musicPlaying;

    if (this.musicPlaying) {
      this.playSuccess();
      this.vibrate([50, 30, 50]);
      this.onFeedback({
        type: 'success',
        title: '音乐已播放',
        desc: '正在播放音乐',
        icon: 'music'
      });
    } else {
      this.playSuccess();
      this.vibrate([50]);
      this.onFeedback({
        type: 'success',
        title: '音乐已暂停',
        desc: '音乐已暂停',
        icon: 'music-off'
      });
    }

    return { action: this.musicPlaying ? '播放音乐' : '暂停音乐', savedSeconds: 8 };
  }

  handleCall() {
    this.callActive = !this.callActive;

    if (this.callActive) {
      // Simulate incoming call
      this.playTone(600, 0.3);
      this.vibrate([300, 200, 300, 200, 300]);
      this.onFeedback({
        type: 'success',
        title: '来电模拟',
        desc: '正在模拟来电...',
        icon: 'phone'
      });
      // Show call overlay after a short delay
      setTimeout(() => {
        this.showCallOverlay();
      }, 500);
    } else {
      this.playSuccess();
      this.vibrate([100]);
      this.hideCallOverlay();
      this.onFeedback({
        type: 'success',
        title: '已挂断',
        desc: '通话已结束',
        icon: 'phone-off'
      });
    }

    return { action: this.callActive ? '接听来电' : '挂断来电', savedSeconds: 10 };
  }

  rejectCall() {
    this.callActive = false;
    this.hideCallOverlay();
    this.playSuccess();
    this.vibrate([50, 30, 50]);
    this.onFeedback({
      type: 'success',
      title: '已拒接 + 发送短信',
      desc: '已拒接来电，并发送"稍后联系"',
      icon: 'message'
    });
    return { action: '拒接来电 + 发送短信', savedSeconds: 15 };
  }

  sendLocation() {
    this.playSuccess();
    this.vibrate([50, 30, 50, 30, 50]);
    this.onFeedback({
      type: 'success',
      title: '已发送定位',
      desc: '已将当前位置发送给紧急联系人',
      icon: 'map-pin'
    });
    return { action: '发送定位', savedSeconds: 20 };
  }

  triggerShortcut() {
    this.playSuccess();
    this.vibrate([100]);
    this.onFeedback({
      type: 'success',
      title: '快捷指令已触发',
      desc: '已执行预设快捷指令',
      icon: 'zap'
    });
    return { action: '触发快捷指令', savedSeconds: 12 };
  }

  execute(patternKey) {
    switch (patternKey) {
      case 'single':
        return this.toggleMusic();
      case 'double':
        return this.handleCall();
      case 'triple':
        return this.rejectCall();
      case 'longShort':
        return this.sendLocation();
      case 'doubleLong':
        return this.triggerShortcut();
      // Rotation commands
      case 'cw':
        return this.nextTrack();
      case 'ccw':
        return this.prevTrack();
      case 'cw1':
        return this.forward15s();
      case 'cw2':
        return this.forward60s();
      case 'ccw1':
        return this.rewind15s();
      case 'ccwHalf':
        return this.toggleMusic();
      default:
        this.playError();
        this.vibrate([200]);
        this.onFeedback({
          type: 'error',
          title: '未识别',
          desc: '无法识别该操作模式',
          icon: 'alert'
        });
        return null;
    }
  }

  // ===== ROTATION COMMANDS =====

  nextTrack() {
    this.currentTrack++;
    this.playSuccess();
    this.vibrate([30, 20, 30]);
    this.onFeedback({
      type: 'success',
      title: '下一首',
      desc: `切换到第 ${this.currentTrack} 首`,
      icon: 'skipForward'
    });
    return { action: '下一首', savedSeconds: 5 };
  }

  prevTrack() {
    this.currentTrack = Math.max(1, this.currentTrack - 1);
    this.playSuccess();
    this.vibrate([30, 20, 30]);
    this.onFeedback({
      type: 'success',
      title: '上一首',
      desc: `切换到第 ${this.currentTrack} 首`,
      icon: 'skipBack'
    });
    return { action: '上一首', savedSeconds: 5 };
  }

  forward15s() {
    this.playTone(1000, 0.05);
    setTimeout(() => this.playTone(1200, 0.05), 50);
    this.vibrate([20]);
    this.onFeedback({
      type: 'success',
      title: '快进 15 秒',
      desc: '已快进 15 秒',
      icon: 'fastForward'
    });
    return { action: '快进 15 秒', savedSeconds: 10 };
  }

  forward60s() {
    this.playTone(1000, 0.05);
    setTimeout(() => this.playTone(1200, 0.05), 50);
    setTimeout(() => this.playTone(1400, 0.08), 100);
    this.vibrate([20, 20, 20]);
    this.onFeedback({
      type: 'success',
      title: '快进 60 秒',
      desc: '已快进 60 秒',
      icon: 'fastForward'
    });
    return { action: '快进 60 秒', savedSeconds: 15 };
  }

  rewind15s() {
    this.playTone(1200, 0.05);
    setTimeout(() => this.playTone(1000, 0.05), 50);
    this.vibrate([20]);
    this.onFeedback({
      type: 'success',
      title: '后退 15 秒',
      desc: '已后退 15 秒',
      icon: 'rewind'
    });
    return { action: '后退 15 秒', savedSeconds: 10 };
  }

  showCallOverlay() {
    const overlay = document.getElementById('callOverlay');
    if (overlay) overlay.classList.add('show');
  }

  hideCallOverlay() {
    const overlay = document.getElementById('callOverlay');
    if (overlay) overlay.classList.remove('show');
  }
}

export default CommandExecutor;
