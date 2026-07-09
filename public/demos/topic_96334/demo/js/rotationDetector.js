// ===== ROTATION PATTERNS =====
const ROTATION_PATTERNS = {
  cw: {
    name: '顺时针',
    direction: 'cw',
    minDegrees: 30,
    action: '下一首 / 增加',
    savedSeconds: 5
  },
  ccw: {
    name: '逆时针',
    direction: 'ccw',
    minDegrees: 30,
    action: '上一首 / 减少',
    savedSeconds: 5
  },
  cw1: {
    name: '顺时针 1 圈',
    direction: 'cw',
    rotations: 1,
    action: '快进 15 秒',
    savedSeconds: 10
  },
  cw2: {
    name: '顺时针 2 圈',
    direction: 'cw',
    rotations: 2,
    action: '快进 60 秒',
    savedSeconds: 15
  },
  ccw1: {
    name: '逆时针 1 圈',
    direction: 'ccw',
    rotations: 1,
    action: '后退 15 秒',
    savedSeconds: 10
  },
  ccwHalf: {
    name: '逆时针 半圈',
    direction: 'ccw',
    rotations: 0.5,
    action: '暂停播放',
    savedSeconds: 8
  }
};

// ===== ROTATION DETECTOR =====
// Detects rotation via gyroscope (DeviceOrientation/DeviceMotion)
// Falls back to touch swipe for demo simulation

class RotationDetector {
  constructor(options = {}) {
    this.onRotation = options.onRotation || (() => {});
    this.onData = options.onData || (() => {});

    this.threshold = 30;        // degrees per second to start tracking
    this.deadzone = 10;         // degrees/sec ignored
    this.settleTimeout = 400;    // ms of no rotation to finalize
    this.minAngle = 30;         // minimum degrees to trigger

    this.isListening = false;
    this.isTracking = false;
    this.cumulativeAngle = 0;
    this.lastTimestamp = 0;
    this.lastAlpha = null;
    this.settleTimer = null;
    this.history = [];
    this.maxHistory = 200;
  }

  async start() {
    if (this.isListening) return;

    // Try DeviceOrientation for gyro data
    if (window.DeviceOrientationEvent) {
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        try {
          const perm = await DeviceOrientationEvent.requestPermission();
          if (perm !== 'granted') return false;
        } catch (e) {
          console.warn('DeviceOrientation permission error:', e);
          return false;
        }
      }
      this.isListening = true;
      window.addEventListener('deviceorientation', this.handleOrientation);
      return true;
    }

    return false;
  }

  stop() {
    this.isListening = false;
    window.removeEventListener('deviceorientation', this.handleOrientation);
  }

  handleOrientation = (event) => {
    const alpha = event.alpha;
    if (alpha === null) return;

    if (this.lastAlpha === null) {
      this.lastAlpha = alpha;
      this.lastTimestamp = Date.now();
      return;
    }

    // Calculate delta, handling 0-360 wrap
    let delta = alpha - this.lastAlpha;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;

    const now = Date.now();
    const dt = (now - this.lastTimestamp) / 1000;
    if (dt <= 0 || dt > 0.2) {
      this.lastAlpha = alpha;
      this.lastTimestamp = now;
      return;
    }

    const rate = Math.abs(delta) / dt; // degrees per second

    this.history.push({ delta, rate, timestamp: now });
    if (this.history.length > this.maxHistory) this.history.shift();
    this.onData(delta, rate);

    // Filter out noise
    if (rate < this.deadzone) {
      this.lastAlpha = alpha;
      this.lastTimestamp = now;
      return;
    }

    // Start tracking if above threshold
    if (rate > this.threshold && !this.isTracking) {
      this.isTracking = true;
      this.cumulativeAngle = 0;
    }

    // Accumulate if tracking
    if (this.isTracking) {
      this.cumulativeAngle += delta;
    }

    // Reset settle timer
    if (this.settleTimer) clearTimeout(this.settleTimer);
    this.settleTimer = setTimeout(() => {
      this.finalizeRotation();
    }, this.settleTimeout);

    this.lastAlpha = alpha;
    this.lastTimestamp = now;
  };

  finalizeRotation() {
    if (!this.isTracking) return;
    this.isTracking = false;

    const angle = this.cumulativeAngle;
    const absAngle = Math.abs(angle);
    const direction = angle > 0 ? 'cw' : 'ccw';
    const rotations = absAngle / 360;

    if (absAngle < this.minAngle) {
      this.cumulativeAngle = 0;
      return;
    }

    this.onRotation({
      angle,
      absAngle,
      direction,
      rotations: Math.round(rotations * 10) / 10,
      timestamp: Date.now()
    });

    this.cumulativeAngle = 0;
  }

  // Simulate rotation (for virtual buttons / touch swipe)
  simulateRotation(direction, degrees = 90) {
    const angle = direction === 'cw' ? degrees : -degrees;
    const rotations = Math.round((degrees / 360) * 10) / 10;

    this.onRotation({
      angle,
      absAngle: degrees,
      direction,
      rotations,
      timestamp: Date.now(),
      simulated: true
    });
  }

  setThreshold(value) {
    this.threshold = value;
  }
}

// ===== ROTATION RECOGNIZER =====
// Matches rotation events to ROTATION_PATTERNS

class RotationRecognizer {
  constructor(options = {}) {
    this.onPattern = options.onPattern || (() => {});
  }

  recognize(rotationData) {
    const { direction, absAngle, rotations } = rotationData;

    // Check multi-rotation patterns first (more specific)
    if (direction === 'cw' && rotations >= 1.8) {
      return { ...ROTATION_PATTERNS.cw2, key: 'cw2', confidence: 0.95 };
    }
    if (direction === 'cw' && rotations >= 0.8) {
      return { ...ROTATION_PATTERNS.cw1, key: 'cw1', confidence: 0.95 };
    }
    if (direction === 'ccw' && rotations >= 0.8) {
      return { ...ROTATION_PATTERNS.ccw1, key: 'ccw1', confidence: 0.95 };
    }
    if (direction === 'ccw' && rotations >= 0.3 && rotations < 0.8) {
      return { ...ROTATION_PATTERNS.ccwHalf, key: 'ccwHalf', confidence: 0.9 };
    }

    // Basic direction patterns
    if (direction === 'cw' && absAngle < 360) {
      return { ...ROTATION_PATTERNS.cw, key: 'cw', confidence: 0.95 };
    }
    if (direction === 'ccw' && absAngle < 360) {
      return { ...ROTATION_PATTERNS.ccw, key: 'ccw', confidence: 0.95 };
    }

    return null;
  }
}

export { RotationDetector, RotationRecognizer, ROTATION_PATTERNS };
