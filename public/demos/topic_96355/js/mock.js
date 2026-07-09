/* ============================================================
   mock.js — 模拟噪音数据生成器
   生成贴近真实家庭场景的噪音数据：夜间脚步声、电视声等
   ============================================================ */
const MockDataGenerator = (() => {

  // 一天中不同小时的基准噪音（夜间低，傍晚高）
  const HOURLY_BASE = [
    32, 31, 30, 29, 29, 30, 33, 38, 42, 45, 44, 43, 42, 41, 42, 43, 45, 48, 52, 55, 53, 48, 42, 36
  ];

  function rand(min, max) { return Math.random() * (max - min) + min; }
  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

  // 生成一个采样点（带偶发噪音事件）
  function genSample(date, hour, threshold) {
    const base = HOURLY_BASE[hour] + rand(-2, 2);
    let db = base;
    let event = null;

    // 夜间（22-次日6点）偶发脚步声突增
    const isNight = hour >= 22 || hour < 6;
    if (isNight && Math.random() < 0.04) {
      db = base + rand(18, 32); // 突增
      event = { label: "脚步声", auto: true };
    }
    // 傍晚（18-22点）电视声持续偏高
    else if (hour >= 18 && hour < 22 && Math.random() < 0.12) {
      db = base + rand(8, 18);
      event = { label: "电视声", auto: true };
    }
    // 白天偶发
    else if (Math.random() < 0.02) {
      db = base + rand(10, 20);
      event = { label: "说话声", auto: true };
    }
    else {
      db = base + rand(-3, 3);
    }

    db = clamp(db, 25, 95);
    return { db, event: (db >= threshold && event) ? event : null };
  }

  // 生成一天的会话（拆为若干段，覆盖关键时段）
  function generateDay(dateStr) {
    const sessions = [];
    const date = new Date(dateStr);
    // 夜间段 22:00 - 02:00（最关键）
    // 傍晚段 19:00 - 21:00
    // 早晨段 07:00 - 08:30
    const segments = [
      { startH: 22, startM: 0, durMin: 240 },
      { startH: 19, startM: 0, durMin: 120 },
      { startH: 7, startM: 0, durMin: 90 }
    ];
    const settings = Storage.getSettings();

    segments.forEach(seg => {
      const start = new Date(date);
      start.setHours(seg.startH, seg.startM, 0, 0);
      // 处理跨天
      if (seg.startH >= 22) {
        // 保持当天起点
      }
      const end = new Date(start.getTime() + seg.durMin * 60000);
      const samples = [];
      const events = [];
      const sampleCount = Math.floor(seg.durMin * 60 / 5); // 每5秒一个点（数据量大时降采样）
      const stepSec = seg.durMin * 60 / sampleCount;

      let peakDb = 0, sumDb = 0, peakTime = null;
      for (let i = 0; i < sampleCount; i++) {
        const t = new Date(start.getTime() + i * stepSec * 1000);
        const hour = t.getHours();
        const { db, event } = genSample(t, hour, settings.threshold);
        samples.push({ t: t.toISOString(), db: +db.toFixed(1) });
        sumDb += db;
        if (db > peakDb) { peakDb = db; peakTime = t.toISOString(); }
        if (event) {
          events.push({ t: t.toISOString(), db: +db.toFixed(1), label: event.label, auto: event.auto });
        }
      }
      // 降采样：如果点太多，只保留关键转折点 + 等间距
      const trimmed = downsample(samples, 240);

      sessions.push({
        id: "sess_" + start.getTime(),
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        durationSec: seg.durMin * 60,
        avgDb: +(sumDb / sampleCount).toFixed(1),
        peakDb: +peakDb.toFixed(1),
        peakTime: peakTime,
        mode: "mock",
        samples: trimmed,
        events: events.slice(0, 20)
      });
    });
    return sessions;
  }

  // 降采样：保留峰值附近 + 等间距
  function downsample(samples, target) {
    if (samples.length <= target) return samples;
    const step = samples.length / target;
    const result = [];
    for (let i = 0; i < target; i++) {
      result.push(samples[Math.floor(i * step)]);
    }
    return result;
  }

  // 生成最近 N 天的历史
  function generateWeek(days = 7) {
    const all = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 86400000);
      all.push(...generateDay(d.toISOString()));
    }
    // 上周数据（用于对比）
    for (let i = days; i < days * 2; i++) {
      const d = new Date(today.getTime() - i * 86400000);
      all.push(...generateDay(d.toISOString()));
    }
    return all;
  }

  // 实时模拟流：用于 Demo 模式实时监听
  function createLiveStream() {
    let lastHour = new Date().getHours();
    return {
      next() {
        const now = new Date();
        const hour = now.getHours();
        const { db } = genSample(now, hour, 999); // 不触发事件标记
        return {
          db: +db.toFixed(1),
          spectrum: generateSpectrum(db, hour),
          waveform: generateWaveform(db)
        };
      }
    };
  }

  // 生成模拟频谱（32 个频段）
  function generateSpectrum(db, hour) {
    const bands = 32;
    const arr = new Uint8Array(bands);
    const base = Math.max(20, db);
    for (let i = 0; i < bands; i++) {
      // 低频偏高，高频衰减
      const freqWeight = Math.exp(-i / 20) * 0.7 + 0.3;
      const noise = rand(0.3, 1);
      arr[i] = clamp(base * freqWeight * noise * 2.2, 0, 255);
    }
    return arr;
  }

  // 生成模拟时域波形（128 点）
  function generateWaveform(db) {
    const len = 128;
    const arr = new Uint8Array(len);
    const amp = Math.max(2, (db - 25) * 1.8);
    for (let i = 0; i < len; i++) {
      const v = Math.sin(i * 0.3) * amp * rand(0.4, 1) + rand(-amp * 0.4, amp * 0.4);
      arr[i] = clamp(128 + v, 0, 255);
    }
    return arr;
  }

  return { generateDay, generateWeek, createLiveStream, generateSpectrum, generateWaveform };
})();
