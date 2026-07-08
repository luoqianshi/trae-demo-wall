/**
 * 鼓韵声纹 - 海报生成模块
 * 基于 Canvas 合成声纹文创海报
 */

const PosterGenerator = {
  // 画布尺寸
  canvasWidth: 750,
  canvasHeight: 1100,

  // 配色
  colors: {
    primary: '#C41E3A',
    gold: '#D4A84B',
    goldLight: '#E8C36A',
    brown: '#3D2914',
    ink: '#1A1A1A',
    bg: '#FDF8F0',
    bgWarm: '#F5E6C8',
    white: '#FFFFFF'
  },

  /**
   * 生成声纹纹样路径
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} centerX
   * @param {number} centerY
   * @param {number} radius
   * @param {string} trackId
   */
  drawSoundWavePattern(ctx, centerX, centerY, radius, trackId) {
    ctx.save();

    // 创建径向渐变
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    gradient.addColorStop(0, 'rgba(212, 168, 75, 0.4)');
    gradient.addColorStop(0.5, 'rgba(212, 168, 75, 0.2)');
    gradient.addColorStop(1, 'rgba(212, 168, 75, 0)');

    // 绘制背景圆
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    // 根据曲牌生成不同节奏的波形
    const rhythm = this.getTrackRhythm(trackId);
    const waveCount = rhythm.waveCount;
    const amplitude = rhythm.amplitude;

    // 绘制多层波形圆环
    for (let ring = 0; ring < 4; ring++) {
      const ringRadius = radius * (0.3 + ring * 0.2);
      const alpha = 0.6 - ring * 0.1;

      ctx.strokeStyle = `rgba(212, 168, 75, ${alpha})`;
      ctx.lineWidth = 2;
      ctx.beginPath();

      for (let angle = 0; angle <= Math.PI * 2; angle += 0.02) {
        const wave = Math.sin(angle * waveCount + ring * 0.5) * amplitude * (1 - ring * 0.15);
        const r = ringRadius + wave;
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;

        if (angle === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.closePath();
      ctx.stroke();
    }

    // 绘制云纹装饰
    this.drawCloudPattern(ctx, centerX, centerY, radius * 0.85);

    // 绘制中心圆点
    ctx.fillStyle = this.colors.gold;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  },

  /**
   * 获取曲牌节奏参数
   */
  getTrackRhythm(trackId) {
    const rhythms = {
      nian: { waveCount: 12, amplitude: 15 },      // 闹年夜 - 热闹
      yingqin: { waveCount: 8, amplitude: 12 },   // 迎亲调 - 欢快
      haocao: { waveCount: 6, amplitude: 10 },    // 薅草歌 - 明快
      chongtian: { waveCount: 15, amplitude: 18 } // 冲天炮 - 激情
    };
    return rhythms[trackId] || rhythms.nian;
  },

  /**
   * 绘制云纹装饰
   */
  drawCloudPattern(ctx, cx, cy, radius) {
    ctx.save();
    ctx.strokeStyle = `rgba(212, 168, 75, 0.3)`;
    ctx.lineWidth = 1.5;

    // 绘制 6 个云纹图案
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle + Math.PI / 2);

      // 简化的云纹路径
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, Math.PI, false);
      ctx.arc(-10, 8, 10, 0, Math.PI, false);
      ctx.arc(10, 8, 10, 0, Math.PI, false);
      ctx.stroke();

      ctx.restore();
    }

    ctx.restore();
  },

  /**
   * 绘制传统文化边框
   */
  drawTraditionalBorder(ctx) {
    const w = this.canvasWidth;
    const h = this.canvasHeight;
    const padding = 30;

    ctx.save();

    // 绘制外边框
    ctx.strokeStyle = this.colors.gold;
    ctx.lineWidth = 3;
    ctx.strokeRect(padding, padding, w - padding * 2, h - padding * 2);

    // 绘制内边框
    ctx.strokeStyle = `rgba(212, 168, 75, 0.5)`;
    ctx.lineWidth = 1;
    ctx.strokeRect(padding + 10, padding + 10, w - (padding + 10) * 2, h - (padding + 10) * 2);

    // 绘制四角装饰
    this.drawCornerDecoration(ctx, padding, padding, 1);
    this.drawCornerDecoration(ctx, w - padding, padding, 2);
    this.drawCornerDecoration(ctx, padding, h - padding, 3);
    this.drawCornerDecoration(ctx, w - padding, h - padding, 4);

    ctx.restore();
  },

  /**
   * 绘制角落装饰
   */
  drawCornerDecoration(ctx, x, y, position) {
    ctx.save();

    const size = 20;
    ctx.strokeStyle = this.colors.gold;
    ctx.lineWidth = 2;

    ctx.translate(x, y);

    // 根据位置旋转
    const angles = { 1: 0, 2: 90, 3: 270, 4: 180 };
    ctx.rotate((angles[position] * Math.PI) / 180);

    // 绘制 L 形装饰
    ctx.beginPath();
    ctx.moveTo(0, size);
    ctx.lineTo(0, 0);
    ctx.lineTo(size, 0);
    ctx.stroke();

    // 绘制小圆点
    ctx.fillStyle = this.colors.gold;
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  },

  /**
   * 绘制金句文字
   */
  drawQuote(ctx, quote, centerX) {
    ctx.save();

    ctx.font = 'bold 32px "Noto Serif SC", "Songti SC", serif';
    ctx.fillStyle = this.colors.primary;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 文字背景
    const metrics = ctx.measureText(quote);
    const textWidth = metrics.width;
    const bgWidth = textWidth + 60;
    const bgHeight = 56;

    ctx.fillStyle = `rgba(253, 248, 240, 0.95)`;
    this.roundRect(ctx, centerX - bgWidth / 2, 580 - bgHeight / 2, bgWidth, bgHeight, 8);
    ctx.fill();

    // 文字描边
    ctx.strokeStyle = this.colors.gold;
    ctx.lineWidth = 1;
    this.roundRect(ctx, centerX - bgWidth / 2, 580 - bgHeight / 2, bgWidth, bgHeight, 8);
    ctx.stroke();

    // 绘制文字
    ctx.fillStyle = this.colors.primary;
    ctx.fillText(quote, centerX, 580);

    ctx.restore();
  },

  /**
   * 绘制底部信息
   */
  drawBottomInfo(ctx, trackName, qrDataUrl) {
    const w = this.canvasWidth;

    // 曲牌名称
    ctx.save();
    ctx.font = '24px "Noto Serif SC", "Songti SC", serif';
    ctx.fillStyle = this.colors.gold;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText(trackName, 50, 980);
    ctx.restore();

    // 二维码
    if (qrDataUrl) {
      const qrSize = 100;
      const qrX = w - qrSize - 50;
      const qrY = 900;

      ctx.save();
      ctx.fillStyle = this.colors.white;
      this.roundRect(ctx, qrX - 10, qrY - 10, qrSize + 20, qrSize + 20, 8);
      ctx.fill();

      ctx.strokeStyle = this.colors.gold;
      ctx.lineWidth = 2;
      this.roundRect(ctx, qrX - 10, qrY - 10, qrSize + 20, qrSize + 20, 8);
      ctx.stroke();

      const qrImg = new Image();
      qrImg.src = qrDataUrl;
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
      ctx.restore();
    }

    // 品牌水印
    ctx.save();
    ctx.font = '14px "Noto Sans SC", "PingFang SC", sans-serif';
    ctx.fillStyle = `rgba(107, 93, 77, 0.6)`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('鼓韵声纹 · 梁平癞子锣鼓', w / 2, 1050);
    ctx.fillText('国家级非物质文化遗产', w / 2, 1070);
    ctx.restore();
  },

  /**
   * 绘制标题区域
   */
  drawHeader(ctx, title) {
    ctx.save();

    ctx.font = 'bold 36px "Noto Serif SC", "Songti SC", serif';
    ctx.fillStyle = this.colors.primary;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(title, this.canvasWidth / 2, 50);

    ctx.restore();
  },

  /**
   * 圆角矩形路径
   */
  roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  },

  /**
   * 主海报生成函数
   * @param {Object} options
   * @returns {string} Base64 编码的海报图片
   */
  generate(options) {
    const { userImage, trackId, trackName, quote } = options;

    // 创建画布
    const canvas = document.createElement('canvas');
    canvas.width = this.canvasWidth;
    canvas.height = this.canvasHeight;
    const ctx = canvas.getContext('2d');

    // 1. 绘制背景
    const bgGradient = ctx.createLinearGradient(0, 0, 0, this.canvasHeight);
    bgGradient.addColorStop(0, this.colors.bg);
    bgGradient.addColorStop(1, this.colors.bgWarm);
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    // 2. 绘制传统边框
    this.drawTraditionalBorder(ctx);

    // 3. 绘制标题
    this.drawHeader(ctx, '鼓韵声纹');

    // 4. 绘制用户照片
    if (userImage) {
      const photoSize = 350;
      const photoX = (this.canvasWidth - photoSize) / 2;
      const photoY = 130;

      ctx.save();

      // 照片圆形裁切
      ctx.beginPath();
      ctx.arc(this.canvasWidth / 2, photoY + photoSize / 2, photoSize / 2, 0, Math.PI * 2);
      ctx.clip();

      // 绘制照片
      const img = new Image();
      img.src = userImage;

      // 使用 sync 方式等待图片加载（假设图片已加载）
      ctx.drawImage(img, photoX, photoY, photoSize, photoSize);

      ctx.restore();

      // 5. 绘制声纹纹样（叠加在照片上）
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.globalCompositeOperation = 'overlay';
      this.drawSoundWavePattern(ctx, this.canvasWidth / 2, photoY + photoSize / 2, photoSize / 2 + 20, trackId);
      ctx.restore();

      // 照片边框
      ctx.save();
      ctx.strokeStyle = this.colors.gold;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(this.canvasWidth / 2, photoY + photoSize / 2, photoSize / 2, 0, Math.PI * 2);
      ctx.stroke();

      // 双层边框
      ctx.strokeStyle = `rgba(212, 168, 75, 0.5)`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.canvasWidth / 2, photoY + photoSize / 2, photoSize / 2 + 8, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    }

    // 6. 绘制金句
    if (quote) {
      this.drawQuote(ctx, quote, this.canvasWidth / 2);
    }

    // 7. 生成二维码（占位）
    const qrDataUrl = this.generateQRPlaceholder();

    // 8. 绘制底部信息
    this.drawBottomInfo(ctx, trackName, qrDataUrl);

    // 返回 Base64
    return canvas.toDataURL('image/jpeg', 0.95);
  },

  /**
   * 生成二维码占位符
   */
  generateQRPlaceholder() {
    const qrCanvas = document.createElement('canvas');
    qrCanvas.width = 100;
    qrCanvas.height = 100;
    const ctx = qrCanvas.getContext('2d');

    // 白色背景
    ctx.fillStyle = this.colors.white;
    ctx.fillRect(0, 0, 100, 100);

    // 绘制模拟二维码图案
    ctx.fillStyle = this.colors.ink;

    // 三个角定位符
    this.drawQRPositionPattern(ctx, 5, 5);
    this.drawQRPositionPattern(ctx, 65, 5);
    this.drawQRPositionPattern(ctx, 5, 65);

    // 模拟数据点
    for (let i = 0; i < 25; i++) {
      const x = 20 + (i % 5) * 12;
      const y = 20 + Math.floor(i / 5) * 12;
      if (Math.random() > 0.5) {
        ctx.fillRect(x, y, 6, 6);
      }
    }

    return qrCanvas.toDataURL('image/png');
  },

  /**
   * 绘制二维码定位符
   */
  drawQRPositionPattern(ctx, x, y) {
    // 外框
    ctx.fillRect(x, y, 25, 25);
    // 白色间隙
    ctx.fillStyle = this.colors.white;
    ctx.fillRect(x + 3, y + 3, 19, 19);
    // 中心块
    ctx.fillStyle = this.colors.ink;
    ctx.fillRect(x + 7, y + 7, 11, 11);
  }
};

// 导出
window.PosterGenerator = PosterGenerator;
