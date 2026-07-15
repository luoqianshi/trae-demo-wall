// Soloist HTML Demo - Canvas图表绘制

/**
 * 绘制五维雷达图
 * @param {string} canvasId - canvas元素ID
 * @param {Array} dimensions - 维度数据 [{name, score, weight}]
 */
function drawRadarChart(canvasId, dimensions) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth * 2;
  const height = canvas.height = 300 * 2;
  canvas.style.height = '300px';
  ctx.scale(2, 2);

  const w = canvas.offsetWidth;
  const h = 300;
  const centerX = w / 2;
  const centerY = h / 2;
  const maxRadius = 90;
  const angleStep = (Math.PI * 2) / 5;
  const startAngle = -Math.PI / 2;

  ctx.clearRect(0, 0, w, h);

  // 1. 背景网格
  for (let level = 1; level <= 5; level++) {
    const radius = (maxRadius / 5) * level;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = startAngle + angleStep * i;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = level === 5 ? '#D1D5DB' : '#E5E7EB';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // 2. 轴线
  for (let i = 0; i < 5; i++) {
    const angle = startAngle + angleStep * i;
    const x = centerX + maxRadius * Math.cos(angle);
    const y = centerY + maxRadius * Math.sin(angle);
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // 3. 数据多边形
  ctx.beginPath();
  for (let i = 0; i < dimensions.length; i++) {
    const score = dimensions[i].score;
    const radius = (maxRadius * score) / 100;
    const angle = startAngle + angleStep * i;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = 'rgba(108, 99, 255, 0.25)';
  ctx.fill();
  ctx.strokeStyle = '#6C63FF';
  ctx.lineWidth = 2;
  ctx.stroke();

  // 4. 数据点
  for (let i = 0; i < dimensions.length; i++) {
    const score = dimensions[i].score;
    const radius = (maxRadius * score) / 100;
    const angle = startAngle + angleStep * i;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#6C63FF';
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // 5. 标签
  ctx.font = '13px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < dimensions.length; i++) {
    const angle = startAngle + angleStep * i;
    const labelRadius = maxRadius + 22;
    const x = centerX + labelRadius * Math.cos(angle);
    const y = centerY + labelRadius * Math.sin(angle);
    ctx.fillStyle = '#1A1A2E';
    ctx.fillText(dimensions[i].name, x, y - 8);
    ctx.fillStyle = '#6C63FF';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(`${dimensions[i].score}`, x, y + 10);
    ctx.font = '13px sans-serif';
  }
}

/**
 * 音准曲线动画器
 */
class PitchCurveAnimator {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = this.canvas.offsetWidth * 2;
    this.canvas.height = 200 * 2;
    this.canvas.style.height = '200px';
    this.ctx.scale(2, 2);

    this.width = this.canvas.offsetWidth;
    this.height = 200;
    this.pitchData = [];
    this.dataIndex = 0;
    this.isRunning = false;
    this.animationId = null;

    this.mockNotes = [
      { note: 'C4', freq: 261.63 }, { note: 'D4', freq: 293.66 },
      { note: 'E4', freq: 329.63 }, { note: 'F4', freq: 349.23 },
      { note: 'G4', freq: 392.00 }, { note: 'A4', freq: 440.00 },
      { note: 'B4', freq: 493.88 }, { note: 'C5', freq: 523.25 }
    ];
    this.noteRange = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];
  }

  start() {
    this.isRunning = true;
    this.animate();
  }

  stop() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  reset() {
    this.pitchData = [];
    this.dataIndex = 0;
    this.drawBackground();
  }

  addPitchPoint() {
    const noteIdx = Math.floor(this.dataIndex / 8) % this.mockNotes.length;
    const baseFreq = this.mockNotes[noteIdx].freq;
    const variation = (Math.random() - 0.5) * 30;
    const cents = Math.round(variation);
    this.pitchData.push({
      timestamp: this.dataIndex * 200,
      frequency: baseFreq * Math.pow(2, cents / 1200),
      noteName: this.mockNotes[noteIdx].note,
      cents: cents,
      isCorrect: Math.abs(cents) < 50
    });
    if (this.pitchData.length > 50) {
      this.pitchData.shift();
    }
    this.dataIndex++;
  }

  animate() {
    if (!this.isRunning) return;

    // 每3帧添加一个数据点
    if (this.dataIndex % 3 === 0 || this.pitchData.length === 0) {
      this.addPitchPoint();
    }
    this.dataIndex++;

    this.drawCurve();
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  drawBackground() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 钢琴卷帘背景
    const rowHeight = this.height / this.noteRange.length;
    for (let i = 0; i < this.noteRange.length; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#F9FAFB' : '#F3F4F6';
      ctx.fillRect(0, i * rowHeight, this.width, rowHeight);
      ctx.fillStyle = '#9CA3AF';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.noteRange[this.noteRange.length - 1 - i], 4, i * rowHeight + rowHeight / 2);
    }
  }

  drawCurve() {
    const ctx = this.ctx;
    this.drawBackground();

    if (this.pitchData.length < 2) return;

    const minFreq = 261.63;
    const maxFreq = 523.25;
    const stepX = this.width / 50;

    // 标准音高虚线
    ctx.beginPath();
    ctx.setLineDash([5, 3]);
    for (let i = 0; i < this.pitchData.length; i++) {
      const point = this.pitchData[i];
      const standardFreq = this.getStandardFreq(point.noteName);
      const y = this.height - ((standardFreq - minFreq) / (maxFreq - minFreq)) * this.height;
      const x = i * stepX;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#9CA3AF';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);

    // 用户音高曲线
    ctx.beginPath();
    for (let i = 0; i < this.pitchData.length; i++) {
      const point = this.pitchData[i];
      const y = this.height - ((point.frequency - minFreq) / (maxFreq - minFreq)) * this.height;
      const x = i * stepX;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#6C63FF';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 偏差区域着色
    for (let i = 0; i < this.pitchData.length; i++) {
      const point = this.pitchData[i];
      const standardFreq = this.getStandardFreq(point.noteName);
      const y1 = this.height - ((standardFreq - minFreq) / (maxFreq - minFreq)) * this.height;
      const y2 = this.height - ((point.frequency - minFreq) / (maxFreq - minFreq)) * this.height;
      const x = i * stepX;
      ctx.fillStyle = point.isCorrect ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)';
      ctx.fillRect(x - 1, Math.min(y1, y2), 3, Math.abs(y1 - y2));
    }

    // 当前光标
    if (this.pitchData.length > 0) {
      const lastX = (this.pitchData.length - 1) * stepX;
      ctx.beginPath();
      ctx.moveTo(lastX, 0);
      ctx.lineTo(lastX, this.height);
      ctx.strokeStyle = '#FF6584';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  getStandardFreq(noteName) {
    const note = this.mockNotes.find(n => n.note === noteName);
    return note ? note.freq : 440;
  }

  getCurrentNote() {
    if (this.pitchData.length === 0) return '--';
    return this.pitchData[this.pitchData.length - 1].noteName;
  }

  getCurrentCents() {
    if (this.pitchData.length === 0) return 0;
    return this.pitchData[this.pitchData.length - 1].cents;
  }
}

/**
 * 绘制折线图
 * @param {string} canvasId
 * @param {Array} data - 数据点
 * @param {Array} labels - X轴标签
 * @param {string} lineColor
 */
function drawLineChart(canvasId, data, labels, lineColor = '#6C63FF') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.offsetWidth * 2;
  canvas.height = 200 * 2;
  canvas.style.height = '200px';
  ctx.scale(2, 2);

  const width = canvas.offsetWidth;
  const height = 200;
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  ctx.clearRect(0, 0, width, height);

  if (data.length === 0) {
    ctx.fillStyle = '#9CA3AF';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('暂无数据', width / 2, height / 2);
    return;
  }

  const maxValue = Math.max(...data, 100);
  const minValue = Math.min(...data, 0);
  const valueRange = maxValue - minValue || 1;

  // Y轴网格
  const ySteps = 4;
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let i = 0; i <= ySteps; i++) {
    const value = minValue + (valueRange / ySteps) * (ySteps - i);
    const y = padding.top + (chartHeight / ySteps) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.strokeStyle = '#F3F4F6';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#9CA3AF';
    ctx.fillText(Math.round(value), padding.left - 4, y);
  }

  // X轴标签
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const stepX = chartWidth / Math.max(data.length - 1, 1);
  for (let i = 0; i < data.length; i++) {
    const x = padding.left + stepX * i;
    if (labels[i]) {
      ctx.fillStyle = '#9CA3AF';
      ctx.fillText(labels[i], x, height - padding.bottom + 6);
    }
  }

  // 填充区域
  ctx.beginPath();
  ctx.moveTo(padding.left, height - padding.bottom);
  for (let i = 0; i < data.length; i++) {
    const x = padding.left + stepX * i;
    const y = padding.top + chartHeight - ((data[i] - minValue) / valueRange) * chartHeight;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(padding.left + stepX * (data.length - 1), height - padding.bottom);
  ctx.closePath();
  ctx.fillStyle = 'rgba(108, 99, 255, 0.15)';
  ctx.fill();

  // 折线
  ctx.beginPath();
  for (let i = 0; i < data.length; i++) {
    const x = padding.left + stepX * i;
    const y = padding.top + chartHeight - ((data[i] - minValue) / valueRange) * chartHeight;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 2;
  ctx.stroke();

  // 数据点
  for (let i = 0; i < data.length; i++) {
    const x = padding.left + stepX * i;
    const y = padding.top + chartHeight - ((data[i] - minValue) / valueRange) * chartHeight;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = lineColor;
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

/**
 * 绘制环形进度条
 * @param {string} canvasId
 * @param {number} percent
 * @param {string} color
 */
function drawProgressRing(canvasId, percent, color = '#6C63FF') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const size = 72;
  canvas.width = size * 2;
  canvas.height = size * 2;
  canvas.style.width = size + 'px';
  canvas.style.height = size + 'px';
  ctx.scale(2, 2);

  const center = size / 2;
  const radius = center - 6;
  const startAngle = -Math.PI / 2;
  const endAngle = startAngle + (Math.PI * 2 * percent) / 100;

  ctx.clearRect(0, 0, size, size);

  // 背景圆环
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.strokeStyle = '#E5E7EB';
  ctx.lineWidth = 6;
  ctx.stroke();

  // 进度圆环
  ctx.beginPath();
  ctx.arc(center, center, radius, startAngle, endAngle);
  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.stroke();

  // 中心文字
  ctx.fillStyle = '#1A1A2E';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${percent}%`, center, center);
}
