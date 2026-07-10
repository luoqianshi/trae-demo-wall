const $ = (id) => document.getElementById(id);

const controls = {
  city: $("city"),
  scenario: $("scenario"),
  baseLoad: $("baseLoad"),
  pvCapacity: $("pvCapacity"),
  temp: $("temp"),
  rain: $("rain")
};

const cityInfo = {
  suzhou: { name: "苏州", loadFactor: 1.03, pvFactor: 1.00 },
  wuxi: { name: "无锡", loadFactor: 1.00, pvFactor: 0.98 },
  nanjing: { name: "南京", loadFactor: 1.08, pvFactor: 0.95 },
  changzhou: { name: "常州", loadFactor: 0.97, pvFactor: 1.02 }
};

const scenarioInfo = {
  sunny: { name: "晴热高辐照", tempDelta: 2, rain: 0, pvFactor: 1.18, loadBoost: 0.08, note: "中午光伏抵消明显，但高温会抬高全天空调负荷。" },
  cloudy: { name: "多云光伏减弱", tempDelta: 0, rain: 3, pvFactor: 0.72, loadBoost: 0.03, note: "云量增加会削弱光伏出力，平台负荷不一定随真实用电同步下降。" },
  rainy: { name: "梅雨降水", tempDelta: -1, rain: 28, pvFactor: 0.38, loadBoost: 0.01, note: "降水和低辐照会压低光伏抵消量，平台负荷可能偏高。" },
  hotnight: { name: "闷热夜间", tempDelta: 3, rain: 8, pvFactor: 0.66, loadBoost: 0.12, note: "夜间空调负荷维持高位，而夜间没有光伏抵消，晚高峰更需要关注。" }
};

const historicalDays = [
  { date: "2025-07-04", temp: 35, rain: 2, pv: 0.92, load: 126, tag: "晴热" },
  { date: "2025-07-09", temp: 34, rain: 6, pv: 0.78, load: 121, tag: "多云" },
  { date: "2025-07-13", temp: 31, rain: 42, pv: 0.35, load: 114, tag: "梅雨" },
  { date: "2025-07-21", temp: 38, rain: 0, pv: 1.05, load: 138, tag: "高温" },
  { date: "2025-08-02", temp: 36, rain: 12, pv: 0.62, load: 132, tag: "闷热" },
  { date: "2024-07-08", temp: 33, rain: 4, pv: 0.82, load: 119, tag: "多云" },
  { date: "2024-07-16", temp: 30, rain: 55, pv: 0.28, load: 109, tag: "强降水" },
  { date: "2024-08-06", temp: 39, rain: 1, pv: 1.02, load: 142, tag: "极端高温" }
];

function dailyShape(hour) {
  const morning = 0.72 + 0.22 * Math.exp(-Math.pow((hour - 9) / 3.2, 2));
  const afternoon = 0.82 + 0.32 * Math.exp(-Math.pow((hour - 15) / 4.0, 2));
  const evening = 0.74 + 0.20 * Math.exp(-Math.pow((hour - 20) / 3.0, 2));
  const nightDrop = hour >= 0 && hour <= 5 ? -0.12 : 0;
  return Math.max(0.45, (morning + afternoon + evening) / 2.55 + nightDrop);
}

function pvShape(hour) {
  if (hour < 6 || hour > 18) return 0;
  return Math.max(0, Math.sin(((hour - 6) / 12) * Math.PI));
}

function calculate() {
  const city = cityInfo[controls.city.value];
  const scenario = scenarioInfo[controls.scenario.value];
  const baseLoad = Number(controls.baseLoad.value);
  const pvCapacity = Number(controls.pvCapacity.value);
  const temp = Number(controls.temp.value) + scenario.tempDelta;
  const rain = Math.max(0, Number(controls.rain.value) + scenario.rain);

  const tempEffect = Math.max(0, temp - 28) * 0.018;
  const rainEffect = rain > 20 ? -0.035 : rain > 5 ? -0.012 : 0;
  const weatherRate = tempEffect + scenario.loadBoost + rainEffect;
  const dailyRealLoad = baseLoad * city.loadFactor * (1 + weatherRate);

  const pvWeatherLoss = rain > 30 ? 0.45 : rain > 10 ? 0.68 : 1;
  const pvDailyKwh = pvCapacity * 3.6 * city.pvFactor * scenario.pvFactor * pvWeatherLoss;
  const pvDailyMwh = pvDailyKwh / 1000;

  const hours = [...Array(24)].map((_, i) => i);
  const shapeSum = hours.reduce((sum, h) => sum + dailyShape(h), 0);
  const pvShapeSum = hours.reduce((sum, h) => sum + pvShape(h), 0) || 1;

  const realSeries = [];
  const pvSeries = [];
  const platformSeries = [];
  hours.forEach((h) => {
    const real = dailyRealLoad * dailyShape(h) / shapeSum;
    const pv = pvDailyMwh * pvShape(h) / pvShapeSum;
    realSeries.push(real);
    pvSeries.push(pv);
    platformSeries.push(Math.max(real - pv, real * 0.55));
  });

  return {
    city,
    scenario,
    baseLoad,
    pvCapacity,
    temp,
    rain,
    weatherRate,
    dailyRealLoad,
    pvDailyMwh,
    platformLoad: platformSeries.reduce((a, b) => a + b, 0),
    hours,
    realSeries,
    pvSeries,
    platformSeries
  };
}

function drawChart(result) {
  const canvas = $("loadChart");
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const padding = { left: 58, right: 24, top: 34, bottom: 54 };
  const plotW = w - padding.left - padding.right;
  const plotH = h - padding.top - padding.bottom;
  const allValues = [...result.realSeries, ...result.platformSeries, ...result.pvSeries];
  const maxVal = Math.ceil(Math.max(...allValues) * 1.25);

  ctx.font = "14px Microsoft YaHei, Arial";
  ctx.strokeStyle = "rgba(148, 163, 184, 0.15)";
  ctx.lineWidth = 1;
  ctx.fillStyle = "#64748b";

  for (let i = 0; i <= 5; i++) {
    const y = padding.top + (plotH * i) / 5;
    const value = maxVal - (maxVal * i) / 5;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(w - padding.right, y);
    ctx.stroke();
    ctx.fillText(value.toFixed(1), 14, y + 4);
  }

  for (let i = 0; i < 24; i += 3) {
    const x = padding.left + (plotW * i) / 23;
    ctx.fillText(String(i).padStart(2, "0") + ":00", x - 16, h - 22);
  }

  ctx.save();
  ctx.translate(18, h / 2 + 42);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("MWh / hour", 0, 0);
  ctx.restore();

  function point(series, i) {
    const x = padding.left + (plotW * i) / 23;
    const y = padding.top + plotH - (series[i] / maxVal) * plotH;
    return { x, y };
  }

  function line(series, color, width = 3) {
    ctx.shadowColor = color;
    ctx.shadowBlur = width === 4 ? 12 : 8;
    ctx.beginPath();
    series.forEach((_, i) => {
      const p = point(series, i);
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  function area(series, color) {
    ctx.beginPath();
    series.forEach((_, i) => {
      const p = point(series, i);
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    const last = point(series, series.length - 1);
    const first = point(series, 0);
    ctx.lineTo(last.x, padding.top + plotH);
    ctx.lineTo(first.x, padding.top + plotH);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  area(result.pvSeries, "rgba(245, 158, 11, 0.12)");
  line(result.realSeries, "#8b5cf6", 3);
  line(result.pvSeries, "#f59e0b", 3);
  line(result.platformSeries, "#3b82f6", 4);
}

function updateKPIs(result) {
  $("baseLoadText").textContent = result.baseLoad;
  $("pvCapacityText").textContent = result.pvCapacity;
  $("tempText").textContent = controls.temp.value;
  $("rainText").textContent = controls.rain.value;
  $("kpiReal").textContent = result.dailyRealLoad.toFixed(1);
  $("kpiPV").textContent = result.pvDailyMwh.toFixed(1);
  $("kpiPlatform").textContent = result.platformLoad.toFixed(1);
  $("kpiWeather").textContent = (result.weatherRate * 100).toFixed(1);

  const platformGap = result.platformLoad - result.baseLoad;
  const direction = platformGap >= 0 ? "偏高" : "偏低";
  $("heroConclusion").textContent = `${result.city.name}${result.scenario.name}情景下，平台负荷较基准${direction} ${Math.abs(platformGap).toFixed(1)} MWh`;
}

function renderSimilarDays(result) {
  const targetPv = result.pvDailyMwh / Math.max(result.pvCapacity * 3.6 / 1000, 0.1);
  const ranked = historicalDays.map(day => {
    const tempScore = Math.abs(day.temp - result.temp) / 12;
    const rainScore = Math.abs(day.rain - result.rain) / 80;
    const pvScore = Math.abs(day.pv - targetPv) / 1.1;
    const distance = tempScore * 0.45 + rainScore * 0.25 + pvScore * 0.30;
    return { ...day, score: Math.max(0, 100 - distance * 100) };
  }).sort((a, b) => b.score - a.score).slice(0, 5);

  $("similarDays").innerHTML = ranked.map(day => `
    <div class="similar-item">
      <div>
        <strong>${day.date} · ${day.tag}</strong>
        <small>最高气温 ${day.temp}℃，降水 ${day.rain}mm，历史真实用电 ${day.load}MWh</small>
      </div>
      <span class="score-pill">相似度 ${day.score.toFixed(0)}%</span>
    </div>
  `).join("");
}

function buildAdvice(result) {
  const noonPV = result.pvSeries.slice(10, 15).reduce((a, b) => a + b, 0);
  const eveningPlatform = result.platformSeries.slice(18, 22).reduce((a, b) => a + b, 0);
  const rainText = result.rain >= 30 ? "降水明显，光伏抵消偏弱" : result.rain >= 8 ? "有云雨影响，光伏出力存在折减" : "降水较少，光伏抵消相对稳定";
  const tempText = result.temp >= 36 ? "高温显著，空调负荷会抬高真实用电" : result.temp >= 32 ? "气温偏高，真实用电有一定上行压力" : "气温压力不强，负荷主要受生产节奏影响";
  const platformText = result.platformLoad > result.baseLoad ? "平台负荷高于基准，需要重点解释天气增负荷和光伏减弱的共同作用" : "平台负荷低于基准，主要原因是中午光伏抵消较强";

  return `【${result.city.name} · ${result.scenario.name}】\n${tempText}；${rainText}。预计真实用电约 ${result.dailyRealLoad.toFixed(1)} MWh，光伏抵消约 ${result.pvDailyMwh.toFixed(1)} MWh，平台负荷约 ${result.platformLoad.toFixed(1)} MWh。\n\n从小时曲线看，10–14 时光伏抵消约 ${noonPV.toFixed(1)} MWh，容易造成平台负荷中午下凹；18–21 时平台负荷约 ${eveningPlatform.toFixed(1)} MWh，基本不受光伏抵消影响，更适合用来观察真实用电强弱。\n\n业务判断：${platformText}。后续可以把真实历史负荷、企业生产日历和真实气象预报接入，替代当前 Demo 的模拟参数。`;
}

function renderAdvice(result) {
  const text = buildAdvice(result);
  $("adviceText").textContent = text;
}

function updateAll() {
  const result = calculate();
  updateKPIs(result);
  drawChart(result);
  renderSimilarDays(result);
  renderAdvice(result);
}

Object.values(controls).forEach(control => control.addEventListener("input", updateAll));
Object.values(controls).forEach(control => control.addEventListener("change", updateAll));

$("copyAdvice").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText($("adviceText").textContent);
    $("copyTip").textContent = "已复制，可以粘贴到日报或参赛说明里。";
  } catch (error) {
    $("copyTip").textContent = "浏览器不允许自动复制，请手动选中文本复制。";
  }
});

updateAll();
