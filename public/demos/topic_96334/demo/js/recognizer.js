const PATTERNS = {
  single: {
    name: '单击',
    taps: 1,
    maxInterval: 400,
    isLong: false,
    action: '播放/暂停音乐',
    savedSeconds: 8
  },
  double: {
    name: '双击',
    taps: 2,
    maxInterval: 400,
    isLong: false,
    action: '接听/挂断来电',
    savedSeconds: 10
  },
  triple: {
    name: '三连击',
    taps: 3,
    maxInterval: 400,
    isLong: false,
    action: '拒接来电 + 发送短信',
    savedSeconds: 15
  },
  longShort: {
    name: '长短',
    taps: 2,
    maxInterval: 600,
    isLong: true,
    action: '发送定位',
    savedSeconds: 20
  },
  doubleLong: {
    name: '双长',
    taps: 2,
    maxInterval: 800,
    isLong: true,
    doubleLong: true,
    action: '触发快捷指令',
    savedSeconds: 12
  }
};

class TapRecognizer {
  constructor(options = {}) {
    this.onPattern = options.onPattern || (() => {});
    this.onPartial = options.onPartial || (() => {});
    this.onTimeout = options.onTimeout || (() => {});

    this.tapSequence = [];
    this.sequenceTimeout = null;
    this.timeoutDuration = 800;
    this.longThreshold = 400;
    this.shortMax = 400;
  }

  addTap(tapData) {
    const now = Date.now();

    // Clear previous timeout
    if (this.sequenceTimeout) {
      clearTimeout(this.sequenceTimeout);
    }

    this.tapSequence.push({
      timestamp: now,
      magnitude: tapData.magnitude,
      simulated: tapData.simulated || false
    });

    this.onPartial(this.tapSequence);

    // Set timeout to finalize sequence
    this.sequenceTimeout = setTimeout(() => {
      this.finalizeSequence();
    }, this.timeoutDuration);
  }

  finalizeSequence() {
    const sequence = [...this.tapSequence];
    this.tapSequence = [];
    this.sequenceTimeout = null;

    if (sequence.length === 0) return;

    const pattern = this.matchPattern(sequence);
    if (pattern) {
      this.onPattern(pattern);
    } else {
      this.onTimeout(sequence);
    }
  }

  matchPattern(sequence) {
    const tapCount = sequence.length;
    const intervals = [];

    for (let i = 1; i < sequence.length; i++) {
      intervals.push(sequence[i].timestamp - sequence[i - 1].timestamp);
    }

    // Check each pattern
    for (const [key, def] of Object.entries(PATTERNS)) {
      if (def.taps !== tapCount) continue;

      if (tapCount === 1) {
        // Single tap always matches
        return { ...def, key, confidence: 1.0, sequence };
      }

      if (tapCount === 2) {
        const interval = intervals[0];

        if (def.doubleLong) {
          // Double long: both taps are long presses
          // In our simplified model, both intervals (start to start) should be > 800ms
          if (interval > 700 && interval < 1500) {
            return { ...def, key, confidence: 0.9, sequence };
          }
        } else if (def.isLong) {
          // Long-short: first tap is long
          // We approximate: if interval is 400-700ms, it's long-short
          if (interval > 400 && interval < 700) {
            return { ...def, key, confidence: 0.9, sequence };
          }
        } else {
          // Short-short: quick double tap
          if (interval <= 400) {
            return { ...def, key, confidence: 0.95, sequence };
          }
        }
      }

      if (tapCount === 3) {
        // All intervals should be short
        const allShort = intervals.every(i => i <= 400);
        if (allShort) {
          return { ...def, key, confidence: 0.95, sequence };
        }
      }
    }

    return null;
  }

  reset() {
    this.tapSequence = [];
    if (this.sequenceTimeout) {
      clearTimeout(this.sequenceTimeout);
      this.sequenceTimeout = null;
    }
  }
}

export { TapRecognizer, PATTERNS };
