// Canvas 趋势图绘制模块。不依赖任何外部库。

// 检测当前是否为暗色主题
function isDarkTheme() {
  return document.documentElement.getAttribute("data-theme") === "dark" ||
    window.matchMedia("(prefers-color-scheme: dark)").matches;
}

// 计算"美观"的最大刻度值（1/2/5 × 10^n）
function niceNumber(value) {
  if (value <= 0) return 1;
  const exp = Math.floor(Math.log10(value));
  const fraction = value / Math.pow(10, exp);
  let niceFraction;
  if (fraction <= 1) niceFraction = 1;
  else if (fraction <= 2) niceFraction = 2;
  else if (fraction <= 5) niceFraction = 5;
  else niceFraction = 10;
  return niceFraction * Math.pow(10, exp);
}

// 格式化简短数字（如 1.2k、3.4w）
function formatShortNumber(n) {
  if (n >= 10000) return (n / 10000).toFixed(1) + "w";
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return String(n);
}

// 在 canvas 上绘制折线图
// data: { dates: [...], views: [...], likes: [...], votes: [...] }
// options: { width, height, colors }
function drawTrendChart(canvas, data, options = {}) {
  if (!canvas || !data) return;
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;

  // 处理高 DPI 屏幕
  const width = options.width || canvas.clientWidth || 400;
  const height = options.height || canvas.clientHeight || 200;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = width + "px";
  canvas.style.height = height + "px";
  ctx.scale(dpr, dpr);

  ctx.clearRect(0, 0, width, height);

  const dark = isDarkTheme();
  const axisColor = dark ? "#4b5563" : "#d1d5db";
  const textColor = dark ? "#d1d5db" : "#4b5563";
  const gridColor = dark ? "#374151" : "#f3f4f6";
  const colors = options.colors || { views: "#00d97e", likes: "#f59e0b", votes: "#f97316" };

  const dates = data.dates || [];
  const views = data.views || [];
  const likes = data.likes || [];
  const votes = data.votes || [];

  if (!dates.length) return;

  // 图表边距
  const padding = { top: 30, right: 20, bottom: 40, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // 计算 Y 轴最大值
  const maxValue = Math.max(...views, ...likes, ...votes, 1);
  const niceMax = niceNumber(maxValue);

  // 绘制网格线和 Y 轴刻度
  ctx.strokeStyle = gridColor;
  ctx.fillStyle = textColor;
  ctx.font = "11px sans-serif";
  ctx.lineWidth = 1;

  const yTicks = 5;
  for (let i = 0; i <= yTicks; i++) {
    const y = padding.top + chartHeight - (i / yTicks) * chartHeight;
    const value = Math.round((i / yTicks) * niceMax);

    // 水平网格线
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(padding.left + chartWidth, y);
    ctx.stroke();

    // Y 轴标签
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(formatShortNumber(value), padding.left - 8, y);
  }

  // 绘制 X 轴和 Y 轴
  ctx.strokeStyle = axisColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top + chartHeight);
  ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top);
  ctx.lineTo(padding.left, padding.top + chartHeight);
  ctx.stroke();

  // 绘制 X 轴标签（数据多时稀疏显示）
  const xStep = dates.length > 10 ? Math.ceil(dates.length / 10) : 1;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  dates.forEach((date, i) => {
    if (i % xStep === 0 || i === dates.length - 1) {
      const x = padding.left + (i / Math.max(dates.length - 1, 1)) * chartWidth;
      ctx.fillText(date, x, padding.top + chartHeight + 8);
    }
  });

  // 绘制单条折线
  function drawLine(values, color) {
    if (!values.length) return;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();

    values.forEach((v, i) => {
      const x = padding.left + (i / Math.max(values.length - 1, 1)) * chartWidth;
      const y = padding.top + chartHeight - (v / niceMax) * chartHeight;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // 绘制数据点
    values.forEach((v, i) => {
      const x = padding.left + (i / Math.max(values.length - 1, 1)) * chartWidth;
      const y = padding.top + chartHeight - (v / niceMax) * chartHeight;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  drawLine(views, colors.views);
  drawLine(likes, colors.likes);
  drawLine(votes, colors.votes);

  // 绘制图例
  ctx.font = "12px sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";

  let legendX = padding.left;
  const legendY = 12;

  // 浏览图例
  ctx.fillStyle = colors.views;
  ctx.fillRect(legendX, legendY - 6, 12, 12);
  ctx.fillStyle = textColor;
  ctx.fillText("浏览", legendX + 16, legendY);
  legendX += 60;

  // 点赞图例
  ctx.fillStyle = colors.likes;
  ctx.fillRect(legendX, legendY - 6, 12, 12);
  ctx.fillStyle = textColor;
  ctx.fillText("点赞", legendX + 16, legendY);
  legendX += 60;

  // 投票图例
  ctx.fillStyle = colors.votes;
  ctx.fillRect(legendX, legendY - 6, 12, 12);
  ctx.fillStyle = textColor;
  ctx.fillText("投票", legendX + 16, legendY);
}

// 绘制横向柱状图（用于词频）
// data: [{ label, value }, ...]
// options: { width, height, color }
function drawBarChart(canvas, data, options = {}) {
  if (!canvas || !data) return;
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;

  const width = options.width || canvas.clientWidth || 400;
  const height = options.height || canvas.clientHeight || 300;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = width + "px";
  canvas.style.height = height + "px";
  ctx.scale(dpr, dpr);

  ctx.clearRect(0, 0, width, height);

  const dark = isDarkTheme();
  const textColor = dark ? "#d1d5db" : "#4b5563";
  const barColor = options.color || "#00d97e";

  // 最多显示 30 个柱子
  const items = data.slice(0, 30);
  if (!items.length) return;

  const maxValue = Math.max(...items.map(d => d.value), 1);

  // 边距：左侧留出标签空间
  const padding = { top: 10, right: 30, bottom: 10, left: 100 };
  const chartWidth = width - padding.left - padding.right;
  const availableHeight = height - padding.top - padding.bottom;
  const barHeight = Math.min(24, (availableHeight / items.length) - 4);
  const barGap = (availableHeight - barHeight * items.length) / Math.max(items.length - 1, 1);

  ctx.font = "12px sans-serif";

  items.forEach((item, i) => {
    const y = padding.top + i * (barHeight + barGap);
    const barWidth = (item.value / maxValue) * chartWidth;

    // 标签（左侧，超长截断）
    ctx.fillStyle = textColor;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    const label = item.label.length > 10 ? item.label.slice(0, 10) + "…" : item.label;
    ctx.fillText(label, padding.left - 8, y + barHeight / 2);

    // 柱子
    ctx.fillStyle = barColor;
    ctx.fillRect(padding.left, y, barWidth, barHeight);

    // 数值（柱子右侧）
    ctx.fillStyle = textColor;
    ctx.textAlign = "left";
    ctx.fillText(String(item.value), padding.left + barWidth + 4, y + barHeight / 2);
  });
}
