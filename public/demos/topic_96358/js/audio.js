/* ============================================================
   audio.js — Web Audio API 音频采集模块
   提供真实麦克风监听 + Demo 模式模拟流统一接口
   ============================================================ */
class AudioMonitor {
  constructor() {
    this.mode = "demo"; // demo | real
    this.running = false;
    this.paused = false;
    this.threshold = 50;
    this.samples = [];
    this.events = [];
    this.startTime = null;
    this.peakDb = 0;
    this.sumDb = 0;
    this.sampleCount = 0;
    this.peakTime = null;
    this.rafId = null;
    this.lastSampleT = 0;
    this.lastEventT = 0;

    // 真实模式资源
    this.audioCtx = null;
    this.analyser = null;
    this.stream = null;
    this.timeData = null;
    this.freqData = null;

    // Demo 模式流
    this.mockStream = null;
  }

  setMode(mode) { this.mode = mode; }
  setThreshold(db) { this.threshold = db; }

  async start(onDbUpdate, onSpectrum) {
    if (this.running) return;
    this.running = true;
    this.paused = false;
    this.samples = [];
    this.events = [];
    this.peakDb = 0;
    this.sumDb = 0;
    this.sampleCount = 0;
    this.peakTime = null;
    this.startTime = Date.now();
    this.lastSampleT = 0;
    this.lastEventT = 0;

    if (this.mode === "real") {
      try {
        await this._initReal();
      } catch (e) {
        this.running = false;
        throw e;
      }
    } else {
      this.mockStream = MockDataGenerator.createLiveStream();
    }
    this._loop(onDbUpdate, onSpectrum);
  }

  async _initReal() {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const source = this.audioCtx.createMediaStreamSource(this.stream);
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.6;
    source.connect(this.analyser);
    this.timeData = new Uint8Array(this.analyser.fftSize);
    this.freqData = new Uint8Array(this.analyser.frequencyBinCount);
  }

  _loop(onDbUpdate, onSpectrum) {
    if (!this.running) return;
    if (!this.paused) {
      let db, spectrum, waveform;
      if (this.mode === "real" && this.analyser) {
        this.analyser.getByteTimeDomainData(this.timeData);
        this.analyser.getByteFrequencyData(this.freqData);
        db = this._calcDb(this.timeData);
        spectrum = this.freqData;
        waveform = this.timeData;
      } else {
        const frame = this.mockStream.next();
        db = frame.db;
        spectrum = frame.spectrum;
        waveform = frame.waveform;
      }

      const now = Date.now();
      // 每 500ms 采样一次入库
      if (now - this.lastSampleT >= 500) {
        this.lastSampleT = now;
        const t = new Date().toISOString();
        this.samples.push({ t, db: +db.toFixed(1) });
        this.sumDb += db;
        this.sampleCount++;
        if (db > this.peakDb) { this.peakDb = db; this.peakTime = t; }
        // 自动标记超阈值事件（间隔至少 3 秒）
        if (db >= this.threshold && now - this.lastEventT >= 3000) {
          this.lastEventT = now;
          this.events.push({ t, db: +db.toFixed(1), label: "自动标记", auto: true });
        }
      }
      if (onDbUpdate) onDbUpdate(db, this.startTime);
      if (onSpectrum) onSpectrum(spectrum, waveform);
    }
    this.rafId = requestAnimationFrame(() => this._loop(onDbUpdate, onSpectrum));
  }

  _calcDb(waveform) {
    let sum = 0;
    for (let i = 0; i < waveform.length; i++) {
      const v = (waveform[i] - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / waveform.length);
    let db = 20 * Math.log10(rms + 0.00001) + 90;
    return Math.max(20, Math.min(100, db));
  }

  pause() { this.paused = true; }
  resume() { this.paused = false; }

  addManualEvent(label) {
    const now = new Date().toISOString();
    // 取最近一个采样 db 或当前
    const lastDb = this.samples.length ? this.samples[this.samples.length - 1].db : 0;
    const ev = { t: now, db: lastDb, label: label || "手动标记", auto: false };
    this.events.push(ev);
    return ev;
  }

  stop() {
    this.running = false;
    this.paused = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;
    if (this.audioCtx) { try { this.audioCtx.close(); } catch(e){} this.audioCtx = null; }
    if (this.stream) { this.stream.getTracks().forEach(t => t.stop()); this.stream = null; }
    this.analyser = null;
    this.mockStream = null;

    if (this.sampleCount === 0) return null;
    const durationSec = Math.round((Date.now() - this.startTime) / 1000);
    return {
      id: "sess_" + this.startTime,
      startTime: new Date(this.startTime).toISOString(),
      endTime: new Date().toISOString(),
      durationSec,
      avgDb: +(this.sumDb / this.sampleCount).toFixed(1),
      peakDb: +this.peakDb.toFixed(1),
      peakTime: this.peakTime,
      mode: this.mode,
      samples: this.samples,
      events: this.events
    };
  }

  isRunning() { return this.running; }
}

const audioMonitor = new AudioMonitor();
