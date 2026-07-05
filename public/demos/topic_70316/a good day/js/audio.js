// 音频播放控制
const AudioPlayer = {
  audioContext: null,
  currentAudio: null,
  isPlaying: false,
  onWakeEnd: null,    // 唤醒语音结束回调
  onProgress: null,   // 进度回调 (0-100)

  // 初始化 AudioContext（必须在用户点击回调中同步调用）
  init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  },

  // 播放唤醒语音
  playWakeAudio(audioFile) {
    this.stop();
    this.isPlaying = true;

    const audio = new Audio();
    audio.src = 'assets/audio/' + audioFile;
    audio.preload = 'auto';
    this.currentAudio = audio;

    let progressInterval = null;
    audio.addEventListener('loadedmetadata', () => {
      const duration = audio.duration;
      progressInterval = setInterval(() => {
        if (audio.paused || audio.ended) return;
        const pct = Math.min(100, (audio.currentTime / duration) * 100);
        if (this.onProgress) this.onProgress(pct);
      }, 200);
    });

    audio.addEventListener('ended', () => {
      if (progressInterval) clearInterval(progressInterval);
      this.isPlaying = false;
      if (this.onProgress) this.onProgress(100);
      if (this.onWakeEnd) this.onWakeEnd();
    });

    audio.addEventListener('error', () => {
      if (progressInterval) clearInterval(progressInterval);
      this.isPlaying = false;
      if (this.onWakeEnd) this.onWakeEnd();
    });

    audio.play().catch(err => {
      console.warn('Audio play failed:', err);
      this.isPlaying = false;
      if (this.onWakeEnd) this.onWakeEnd();
    });
  },

  // 停止播放
  stop() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.src = '';
      this.currentAudio = null;
    }
    this.isPlaying = false;
  }
};