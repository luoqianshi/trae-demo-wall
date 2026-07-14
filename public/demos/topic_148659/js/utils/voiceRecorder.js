window.VoiceRecorder = {
  recorder: null,
  audioContext: null,
  analyser: null,
  dataArray: null,
  stream: null,
  isRecording: false,
  onWaveData: null,
  onRecordingComplete: null,
  animationId: null,
  recordedChunks: [],

  init: function() {
    if ('AudioContext' in window) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
  },

  startRecording: function(onWaveCallback, onCompleteCallback) {
    const self = this;
    
    if (this.isRecording) return;
    
    this.onWaveData = onWaveCallback;
    this.onRecordingComplete = onCompleteCallback;
    this.recordedChunks = [];

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(function(stream) {
        self.stream = stream;
        
        if (!self.audioContext) {
          self.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        const source = self.audioContext.createMediaStreamSource(stream);
        self.analyser = self.audioContext.createAnalyser();
        self.analyser.fftSize = 256;
        source.connect(self.analyser);
        
        const bufferLength = self.analyser.frequencyBinCount;
        self.dataArray = new Uint8Array(bufferLength);
        
        const options = { mimeType: 'audio/webm' };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options.mimeType = 'audio/mp4';
        }
        
        self.recorder = new MediaRecorder(stream, options);
        
        self.recorder.ondataavailable = function(e) {
          if (e.data.size > 0) {
            self.recordedChunks.push(e.data);
          }
        };
        
        self.recorder.onstop = function() {
          const blob = new Blob(self.recordedChunks, { type: 'audio/webm' });
          if (self.onRecordingComplete) {
            self.onRecordingComplete(blob);
          }
        };
        
        self.recorder.start();
        self.isRecording = true;
        self.drawWave();
      })
      .catch(function(err) {
        console.error('[VoiceRecorder] 麦克风权限获取失败:', err);
        if (self.onRecordingComplete) {
          self.onRecordingComplete(null, '麦克风权限获取失败，请检查浏览器设置');
        }
      });
  },

  drawWave: function() {
    if (!this.isRecording || !this.analyser) return;
    
    const self = this;
    this.analyser.getByteFrequencyData(this.dataArray);
    
    const waveData = [];
    for (let i = 0; i < this.dataArray.length; i += 4) {
      waveData.push(this.dataArray[i]);
    }
    
    if (this.onWaveData) {
      this.onWaveData(waveData);
    }
    
    this.animationId = requestAnimationFrame(function() {
      self.drawWave();
    });
  },

  stopRecording: function() {
    if (!this.isRecording) return;
    
    this.isRecording = false;
    
    if (this.recorder && this.recorder.state !== 'inactive') {
      this.recorder.stop();
    }
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    this.onWaveData = null;
  },

  destroy: function() {
    this.stopRecording();
    this.recordedChunks = [];
    this.onRecordingComplete = null;
    this.onWaveData = null;
    this.recorder = null;
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(function() {});
    }
    this.audioContext = null;
    this.analyser = null;
    this.dataArray = null;
  },

  playRecording: function(blob) {
    return new Promise(function(resolve, reject) {
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = function() {
        URL.revokeObjectURL(url);
        resolve();
      };
      audio.onerror = function() {
        URL.revokeObjectURL(url);
        reject(new Error('播放失败'));
      };
      audio.play().catch(reject);
    });
  },

  calculateScore: function(blob) {
    let score = 0;
    const duration = blob.size / 1000;
    
    if (duration > 0.5 && duration < 5) {
      score += 40;
    } else if (duration >= 5) {
      score += 30;
    } else {
      score += 10;
    }
    
    if (blob.size > 1000) {
      score += 30;
    } else if (blob.size > 500) {
      score += 20;
    } else {
      score += 10;
    }
    
    const randomFactor = Math.floor(Math.random() * 40) - 10;
    score += randomFactor;
    
    score = Math.max(0, Math.min(100, score));
    
    return score;
  },

  getFeedback: function(score) {
    if (score >= 80) {
      return { emoji: '🎉', text: '太棒了！发音很标准', color: '#10B981' };
    } else if (score >= 60) {
      return { emoji: '👍', text: '不错哦！继续加油', color: '#3B82F6' };
    } else if (score >= 40) {
      return { emoji: '💪', text: '还需要练习，再试一次', color: '#F59E0B' };
    } else {
      return { emoji: '📢', text: '请跟着口型再试一次', color: '#EF4444' };
    }
  },

  isSupported: function() {
    return 'MediaRecorder' in window && 'navigator' in window && 'mediaDevices' in navigator;
  }
};

document.addEventListener('DOMContentLoaded', function() {
  window.VoiceRecorder.init();
});
