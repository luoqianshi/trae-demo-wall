// 录音 + 氛围卡片生成
// 录音用 MediaRecorder（浏览器需 HTTPS/localhost）
// 卡片用 Canvas 合成：粒子背景 + 元数据 + 圆角 + 二维码占位
(function (global) {
  'use strict';

  class Recorder {
    constructor() {
      this.stream = null;
      this.rec = null;
      this.chunks = [];
      this.startTs = 0;
      this.state = 'idle';
    }

    async start() {
      if (this.state === 'recording') return;
      this.chunks = [];
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (e) {
        throw new Error('需要麦克风权限才能录音');
      }
      this.rec = new MediaRecorder(this.stream);
      this.rec.ondataavailable = (e) => { if (e.data && e.data.size) this.chunks.push(e.data); };
      this.rec.start();
      this.startTs = Date.now();
      this.state = 'recording';
    }

    async stop() {
      if (this.state !== 'recording') return null;
      const duration = (Date.now() - this.startTs) / 1000;
      return new Promise((resolve) => {
        this.rec.onstop = () => {
          const blob = new Blob(this.chunks, { type: 'audio/webm' });
          this._cleanup();
          this.state = 'idle';
          resolve({ blob, duration });
        };
        this.rec.stop();
      });
    }

    _cleanup() {
      if (this.stream) {
        this.stream.getTracks().forEach(t => t.stop());
        this.stream = null;
      }
    }

    // 合成氛围卡片
    // opts: { song, mood, duration, width, height }
    static renderCard(canvas, opts) {
      const ctx = canvas.getContext('2d');
      const W = canvas.width, H = canvas.height;
      const { song, mood, duration } = opts;

      // 背景渐变
      const bg = ctx.createLinearGradient(0, 0, W, H);
      bg.addColorStop(0, mood.palette.from);
      bg.addColorStop(0.6, mood.palette.to);
      bg.addColorStop(1, '#0B0B14');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // 粒子装饰
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 90; i++) {
        const x = Math.random() * W;
        const y = Math.random() * H * 0.7;
        const r = 2 + Math.random() * 8;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, 'rgba(255,255,255,0.5)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';

      // 暗角
      const vg = ctx.createRadialGradient(W / 2, H * 0.4, W * 0.2, W / 2, H * 0.5, W * 0.8);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, 'rgba(0,0,0,0.55)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);

      // 顶部小标签：心情
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      roundRect(ctx, 36, 36, 168, 40, 20);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '500 20px "Noto Sans SC", "PingFang SC", sans-serif';
      ctx.textBaseline = 'middle';
      ctx.fillText((mood.icon || '·') + '  ' + mood.name, 56, 58);

      // 曲名（大字）
      ctx.fillStyle = '#fff';
      ctx.font = '600 56px "Noto Serif SC", "PingFang SC", serif';
      ctx.textBaseline = 'top';
      wrapText(ctx, song.title, 48, 200, W - 96, 64);

      // 艺人
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.font = '500 22px "Noto Sans SC", sans-serif';
      ctx.fillText(song.artist, 48, 320);

      // 录音时长
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = '500 22px "Noto Sans SC", sans-serif';
      ctx.fillText('录制时长  ' + duration.toFixed(1) + ' s', 48, 360);

      // 底部二维码占位
      const qrSize = 100, qrX = W - qrSize - 48, qrY = H - qrSize - 48;
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      roundRect(ctx, qrX, qrY, qrSize, qrSize, 12);
      ctx.fill();
      // 模拟二维码图案
      ctx.fillStyle = '#0B0B14';
      const cells = 9;
      const cell = qrSize / cells;
      for (let y = 0; y < cells; y++) {
        for (let x = 0; x < cells; x++) {
          if ((x + y + (song.id.charCodeAt(1) || 0)) % 3 === 0 || (x < 3 && y < 3) || (x > 5 && y < 3) || (x < 3 && y > 5)) {
            ctx.fillRect(qrX + x * cell, qrY + y * cell, cell - 1, cell - 1);
          }
        }
      }
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = '500 16px "Noto Sans SC", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('扫码听我翻唱', W - 48, H - 24);
      ctx.textAlign = 'left';

      // 底部水印
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '500 22px "Fraunces", "Noto Serif SC", serif';
      ctx.fillText('MoodWave', 48, H - 56);
      ctx.font = '400 16px "Noto Sans SC", sans-serif';
      ctx.fillText('此刻电台 · 把心情唱给你听', 48, H - 28);
    }
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function wrapText(ctx, text, x, y, maxW, lineH) {
    const chars = text.split('');
    let line = '', curY = y;
    for (let i = 0; i < chars.length; i++) {
      const test = line + chars[i];
      if (ctx.measureText(test).width > maxW && line.length) {
        ctx.fillText(line, x, curY);
        line = chars[i];
        curY += lineH;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, x, curY);
  }

  global.Recorder = Recorder;
})(window);
