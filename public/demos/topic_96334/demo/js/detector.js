class TapDetector {
  constructor(options = {}) {
    this.threshold = options.threshold || 2.5;
    this.minDuration = options.minDuration || 20;
    this.maxDuration = options.maxDuration || 150;
    this.cooldown = options.cooldown || 80;
    this.onTap = options.onTap || (() => {});
    this.onData = options.onData || (() => {});

    this.isListening = false;
    this.lastTapTime = 0;
    this.tapBuffer = [];
    this.canvas = null;
    this.ctx = null;
    this.dataHistory = [];
    this.maxHistory = 200;

    // For gravity estimation (simple high-pass filter)
    this.gravity = { x: 0, y: 0, z: 0 };
    this.alpha = 0.8;
  }

  initCanvas(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  resizeCanvas() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width * window.devicePixelRatio;
    this.canvas.height = rect.height * window.devicePixelRatio;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  async start() {
    if (this.isListening) return;

    // Check if DeviceMotion is supported
    if (!window.DeviceMotionEvent) {
      console.warn('DeviceMotion not supported');
      return false;
    }

    // Request permission on iOS 13+
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
      try {
        const permission = await DeviceMotionEvent.requestPermission();
        if (permission !== 'granted') {
          console.warn('DeviceMotion permission denied');
          return false;
        }
      } catch (e) {
        console.warn('DeviceMotion permission error:', e);
        return false;
      }
    }

    this.isListening = true;
    window.addEventListener('devicemotion', this.handleMotion);
    this.drawLoop();
    return true;
  }

  stop() {
    this.isListening = false;
    window.removeEventListener('devicemotion', this.handleMotion);
  }

  handleMotion = (event) => {
    const acc = event.accelerationIncludingGravity;
    if (!acc) return;

    // High-pass filter to remove gravity
    this.gravity.x = this.alpha * this.gravity.x + (1 - this.alpha) * acc.x;
    this.gravity.y = this.alpha * this.gravity.y + (1 - this.alpha) * acc.y;
    this.gravity.z = this.alpha * this.gravity.z + (1 - this.alpha) * acc.z;

    const filteredX = acc.x - this.gravity.x;
    const filteredY = acc.y - this.gravity.y;
    const filteredZ = acc.z - this.gravity.z;

    const magnitude = Math.sqrt(filteredX ** 2 + filteredY ** 2 + filteredZ ** 2);

    // Store for visualization
    this.dataHistory.push(magnitude);
    if (this.dataHistory.length > this.maxHistory) {
      this.dataHistory.shift();
    }

    this.onData(magnitude);

    // Tap detection
    const now = Date.now();
    if (now - this.lastTapTime < this.cooldown) return;

    if (magnitude > this.threshold) {
      this.lastTapTime = now;
      this.onTap({
        magnitude,
        timestamp: now,
        x: filteredX,
        y: filteredY,
        z: filteredZ
      });
    }
  };

  drawLoop = () => {
    if (!this.isListening || !this.ctx || !this.canvas) {
      requestAnimationFrame(this.drawLoop);
      return;
    }

    const width = this.canvas.width / window.devicePixelRatio;
    const height = this.canvas.height / window.devicePixelRatio;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, width, height);

    // Draw threshold line
    const thresholdY = height * 0.3;
    ctx.strokeStyle = 'rgba(212, 165, 116, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, thresholdY);
    ctx.lineTo(width, thresholdY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw waveform
    if (this.dataHistory.length < 2) {
      requestAnimationFrame(this.drawLoop);
      return;
    }

    ctx.strokeStyle = '#d4a574';
    ctx.lineWidth = 2;
    ctx.beginPath();

    const step = width / this.maxHistory;
    const centerY = height * 0.7;
    const scale = height * 0.4 / 15;

    for (let i = 0; i < this.dataHistory.length; i++) {
      const x = i * step;
      const y = centerY - Math.min(this.dataHistory[i], 15) * scale;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // Draw center line
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();

    requestAnimationFrame(this.drawLoop);
  };

  // Simulate a tap (for virtual buttons)
  simulateTap(strength = 5.0) {
    this.onTap({
      magnitude: strength,
      timestamp: Date.now(),
      x: strength * 0.5,
      y: strength * 0.5,
      z: strength * 0.7,
      simulated: true
    });
  }

  setThreshold(value) {
    this.threshold = value;
  }
}

export default TapDetector;
