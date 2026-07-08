// ============ 援力通 2.0 可视化图表组件 ============
// 纯 SVG/CSS 实现，无第三方依赖，支持动画

const Charts = {
  // ---------- 折线图 ----------
  // data: [{label, value}], 多系列: [{label, values:[a,b,c]}], seriesNames可选
  line(data, opts = {}) {
    const w = opts.width || 600, h = opts.height || 240;
    const pad = {l:40, r:20, t:30, b:30};
    const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
    const seriesNames = opts.series || (data[0] && Array.isArray(data[0].values) ? ['系列1','系列2'] : null);
    const colors = opts.colors || ['#3b82f6','#f59e0b','#10b981','#ef4444'];
    const allVals = data.flatMap(d => Array.isArray(d.values) ? d.values : [d.value]);
    const max = Math.max(...allVals) * 1.15 || 100;
    const min = 0;
    const xStep = iw / Math.max(1, data.length - 1);

    const pts = (idx) => data.map((d, i) => {
      const v = Array.isArray(d.values) ? d.values[idx] : d.value;
      const x = pad.l + i * xStep;
      const y = pad.t + ih - (v - min) / (max - min) * ih;
      return `${x},${y}`;
    }).join(' ');

    const polylines = seriesNames
      ? seriesNames.map((_, idx) => `<polyline points="${pts(idx)}" fill="none" stroke="${colors[idx]}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" style="stroke-dasharray:1000;stroke-dashoffset:1000;animation:drawLine 1.5s ease forwards ${idx*0.3}s"/>`).join('')
      : `<polyline points="${pts(0)}" fill="none" stroke="${colors[0]}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" style="stroke-dasharray:1000;stroke-dashoffset:1000;animation:drawLine 1.5s ease forwards"/>`;

    const areaPath = seriesNames
      ? ''
      : `<polygon points="${pts(0)} ${pad.l + iw},${pad.t + ih} ${pad.l},${pad.t + ih}" fill="url(#grad1)" opacity="0.4"/>`;

    const dots = seriesNames
      ? seriesNames.flatMap((_, idx) => data.map((d, i) => {
          const v = d.values[idx]; const x = pad.l + i * xStep; const y = pad.t + ih - (v - min) / (max - min) * ih;
          return `<circle cx="${x}" cy="${y}" r="3.5" fill="${colors[idx]}" stroke="#0f172a" stroke-width="1.5"><title>${d.label}: ${v}</title></circle>`;
        }).join('')).join('')
      : data.map((d, i) => {
          const x = pad.l + i * xStep; const y = pad.t + ih - (d.value - min) / (max - min) * ih;
          return `<circle cx="${x}" cy="${y}" r="3.5" fill="${colors[0]}" stroke="#0f172a" stroke-width="1.5"><title>${d.label}: ${d.value}</title></circle>`;
        }).join('');

    const xLabels = data.map((d, i) => `<text x="${pad.l + i * xStep}" y="${h - 8}" text-anchor="middle" fill="#94a3b8" font-size="10">${d.label}</text>`).join('');
    const ySteps = 4;
    const yLabels = Array.from({length: ySteps + 1}, (_, i) => {
      const v = Math.round(max - i * max / ySteps);
      const y = pad.t + i * ih / ySteps;
      return `<text x="${pad.l - 6}" y="${y + 3}" text-anchor="end" fill="#94a3b8" font-size="10">${v}</text><line x1="${pad.l}" y1="${y}" x2="${pad.l + iw}" y2="${y}" stroke="#334155" stroke-width="0.5" stroke-dasharray="3,3"/>`;
    }).join('');

    const legend = seriesNames
      ? `<div style="display:flex;gap:14px;justify-content:center;margin-top:8px">${seriesNames.map((n, i) => `<span style="display:flex;align-items:center;gap:5px;font-size:11px;color:#94a3b8"><span style="width:12px;height:3px;background:${colors[i]};border-radius:2px"></span>${n}</span>`).join('')}</div>`
      : '';

    return `<div class="chart-box"><svg viewBox="0 0 ${w} ${h}" style="width:100%;height:auto">
      <defs><linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#3b82f6" stop-opacity="0.5"/><stop offset="100%" stop-color="#3b82f6" stop-opacity="0"/></linearGradient></defs>
      ${yLabels}${areaPath}${polylines}${dots}${xLabels}
    </svg>${legend}</div>`;
  },

  // ---------- 饼图 ----------
  // data: [{label, value, color?}]
  pie(data, opts = {}) {
    const total = data.reduce((s, d) => s + d.value, 0) || 1;
    const colors = ['#3b82f6','#f59e0b','#10b981','#ef4444','#8b5cf6','#06b6d4','#ec4899','#94a3b8'];
    const r = opts.radius || 80, cx = 90, cy = 90;
    let startAngle = -Math.PI / 2;
    const slices = data.map((d, i) => {
      const angle = (d.value / total) * Math.PI * 2;
      const endAngle = startAngle + angle;
      const x1 = cx + r * Math.cos(startAngle), y1 = cy + r * Math.sin(startAngle);
      const x2 = cx + r * Math.cos(endAngle), y2 = cy + r * Math.sin(endAngle);
      const large = angle > Math.PI ? 1 : 0;
      const color = d.color || colors[i % colors.length];
      const midAngle = (startAngle + endAngle) / 2;
      const labelX = cx + r * 0.65 * Math.cos(midAngle);
      const labelY = cy + r * 0.65 * Math.sin(midAngle);
      const pct = Math.round(d.value / total * 100);
      startAngle = endAngle;
      return `<path d="M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z" fill="${color}" stroke="#0f172a" stroke-width="2" opacity="0.9" style="cursor:pointer" onmouseover="this.setAttribute('opacity','1')" onmouseout="this.setAttribute('opacity','0.9')"><title>${d.label}: ${d.value} (${pct}%)</title></path>${pct > 8 ? `<text x="${labelX}" y="${labelY + 4}" text-anchor="middle" fill="#fff" font-size="11" font-weight="700">${pct}%</text>` : ''}`;
    }).join('');

    const legend = `<div style="margin-left:12px;display:flex;flex-direction:column;gap:6px;justify-content:center">${data.map((d, i) => `<div style="display:flex;align-items:center;gap:6px;font-size:11px;color:#cbd5e1"><span style="width:10px;height:10px;border-radius:2px;background:${d.color || colors[i % colors.length]}"></span>${d.label}<span style="color:#64748b;margin-left:auto">${d.value}</span></div>`).join('')}</div>`;

    return `<div style="display:flex;align-items:center;justify-content:center"><svg viewBox="0 0 180 180" style="width:180px;height:180px"><circle cx="${cx}" cy="${cy}" r="${r}" fill="#1e293b"/>${slices}<circle cx="${cx}" cy="${cy}" r="${r*0.5}" fill="#0f172a"/><text x="${cx}" y="${cy-4}" text-anchor="middle" fill="#f1f5f9" font-size="20" font-weight="700">${total}</text><text x="${cx}" y="${cy+14}" text-anchor="middle" fill="#94a3b8" font-size="10">总计</text></svg>${legend}</div>`;
  },

  // ---------- 柱状图 ----------
  // data: [{label, value, color?}]
  bar(data, opts = {}) {
    const w = opts.width || 600, h = opts.height || 220;
    const pad = {l:40, r:20, t:20, b:30};
    const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
    const max = Math.max(...data.map(d => d.value)) * 1.15 || 100;
    const barW = iw / data.length * 0.6;
    const gap = iw / data.length;
    const colors = opts.colors || ['#3b82f6','#f59e0b','#10b981','#ef4444','#8b5cf6','#06b6d4'];
    const bars = data.map((d, i) => {
      const bh = (d.value / max) * ih;
      const x = pad.l + i * gap + (gap - barW) / 2;
      const y = pad.t + ih - bh;
      const color = d.color || colors[i % colors.length];
      return `<rect x="${x}" y="${y}" width="${barW}" height="${bh}" fill="${color}" rx="3" opacity="0.9" style="cursor:pointer;transform-origin:${x+barW/2}px ${pad.t+ih}px;animation:growBar 0.8s ease forwards ${i*0.1}s;transform:scaleY(0)"><title>${d.label}: ${d.value}</title></rect>
      <text x="${x+barW/2}" y="${y-5}" text-anchor="middle" fill="#cbd5e1" font-size="11" font-weight="600">${d.value}</text>
      <text x="${x+barW/2}" y="${h-8}" text-anchor="middle" fill="#94a3b8" font-size="10">${d.label}</text>`;
    }).join('');
    const ySteps = 4;
    const yLabels = Array.from({length: ySteps + 1}, (_, i) => {
      const v = Math.round(max - i * max / ySteps);
      const y = pad.t + i * ih / ySteps;
      return `<text x="${pad.l - 6}" y="${y + 3}" text-anchor="end" fill="#94a3b8" font-size="10">${v}</text><line x1="${pad.l}" y1="${y}" x2="${pad.l + iw}" y2="${y}" stroke="#334155" stroke-width="0.5" stroke-dasharray="3,3"/>`;
    }).join('');
    return `<div class="chart-box"><svg viewBox="0 0 ${w} ${h}" style="width:100%;height:auto">${yLabels}${bars}</svg></div>`;
  },

  // ---------- 雷达图 ----------
  // data: [{label, value}], max=100
  radar(data, opts = {}) {
    const cx = 100, cy = 100, r = opts.radius || 70;
    const max = opts.max || 100;
    const n = data.length;
    const angleStep = (Math.PI * 2) / n;
    const colors = ['#3b82f6','#f59e0b'];

    const grids = [0.25, 0.5, 0.75, 1].map(scale => {
      const pts = data.map((_, i) => {
        const a = -Math.PI / 2 + i * angleStep;
        return `${cx + r * scale * Math.cos(a)},${cy + r * scale * Math.sin(a)}`;
      }).join(' ');
      return `<polygon points="${pts}" fill="none" stroke="#334155" stroke-width="0.5"/>`;
    }).join('');

    const axes = data.map((d, i) => {
      const a = -Math.PI / 2 + i * angleStep;
      const x = cx + r * Math.cos(a), y = cy + r * Math.sin(a);
      const lx = cx + (r + 14) * Math.cos(a), ly = cy + (r + 14) * Math.sin(a);
      return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#334155" stroke-width="0.5"/><text x="${lx}" y="${ly+3}" text-anchor="middle" fill="#94a3b8" font-size="10">${d.label}</text>`;
    }).join('');

    const dataPts = data.map((d, i) => {
      const a = -Math.PI / 2 + i * angleStep;
      const scale = d.value / max;
      return `${cx + r * scale * Math.cos(a)},${cy + r * scale * Math.sin(a)}`;
    }).join(' ');
    const dataDots = data.map((d, i) => {
      const a = -Math.PI / 2 + i * angleStep;
      const scale = d.value / max;
      const x = cx + r * scale * Math.cos(a), y = cy + r * scale * Math.sin(a);
      return `<circle cx="${x}" cy="${y}" r="3" fill="${colors[0]}"><title>${d.label}: ${d.value}</title></circle>`;
    }).join('');

    return `<div style="display:flex;justify-content:center"><svg viewBox="0 0 200 200" style="width:200px;height:200px">${grids}${axes}<polygon points="${dataPts}" fill="${colors[0]}" fill-opacity="0.3" stroke="${colors[0]}" stroke-width="2" style="transform-origin:${cx}px ${cy}px;animation:radarIn 1s ease forwards"/>${dataDots}</svg></div>`;
  },

  // ---------- 热力图 ----------
  // data: [[v,v,...],[v,v,...],...], xLabels, yLabels
  heat(data, xLabels, yLabels, opts = {}) {
    const max = Math.max(...data.flat()) || 1;
    const cellW = 38, cellH = 28;
    const cols = xLabels.length, rows = yLabels.length;
    const w = cols * cellW + 60, h = rows * cellH + 30;
    const cells = data.flatMap((row, i) => row.map((v, j) => {
      const intensity = v / max;
      const color = intensity > 0.75 ? '#ef4444' : intensity > 0.5 ? '#f59e0b' : intensity > 0.25 ? '#3b82f6' : '#1e3a8a';
      const x = 50 + j * cellW, y = 15 + i * cellH;
      return `<rect x="${x}" y="${y}" width="${cellW-2}" height="${cellH-2}" fill="${color}" opacity="${0.3 + intensity * 0.7}" rx="2"><title>${yLabels[i]} ${xLabels[j]}: ${v}</title></rect>
      <text x="${x + cellW/2 - 1}" y="${y + cellH/2 + 3}" text-anchor="middle" fill="${intensity > 0.5 ? '#fff' : '#cbd5e1'}" font-size="10" font-weight="600">${v}</text>`;
    }).join('')).join('');
    const xLabs = xLabels.map((l, j) => `<text x="${50 + j * cellW + cellW/2 - 1}" y="${h - 5}" text-anchor="middle" fill="#94a3b8" font-size="10">${l}</text>`).join('');
    const yLabs = yLabels.map((l, i) => `<text x="45" y="${15 + i * cellH + cellH/2 + 3}" text-anchor="end" fill="#94a3b8" font-size="10">${l}</text>`).join('');
    return `<div class="chart-box"><svg viewBox="0 0 ${w} ${h}" style="width:100%;height:auto">${cells}${xLabs}${yLabs}</svg></div>`;
  },

  // ---------- 进度环 ----------
  ring(value, opts = {}) {
    const r = opts.radius || 50, cx = 60, cy = 60;
    const c = 2 * Math.PI * r;
    const offset = c - (value / 100) * c;
    const color = opts.color || (value > 75 ? '#10b981' : value > 50 ? '#3b82f6' : value > 25 ? '#f59e0b' : '#ef4444');
    return `<svg viewBox="0 0 120 120" style="width:${opts.size || 120}px;height:${opts.size || 120}px">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#1e293b" stroke-width="8"/>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="8" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c}" transform="rotate(-90 ${cx} ${cy})" style="animation:ringIn 1.2s ease forwards;stroke-dashoffset:${offset}"/>
      <text x="${cx}" y="${cy + 6}" text-anchor="middle" fill="#f1f5f9" font-size="20" font-weight="700">${value}%</text>
      ${opts.label ? `<text x="${cx}" y="${cy + 24}" text-anchor="middle" fill="#94a3b8" font-size="10">${opts.label}</text>` : ''}
    </svg>`;
  },

  // ---------- 横向进度条（带标签） ----------
  barH(label, value, total, opts = {}) {
    const pct = Math.round(value / total * 100) || 0;
    const color = opts.color || '#3b82f6';
    return `<div style="margin-bottom:8px">
      <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px"><span style="color:#cbd5e1">${label}</span><span style="color:#94a3b8">${value} / ${total} (${pct}%)</span></div>
      <div class="progress-bar" style="height:8px"><div class="progress-fill" style="width:${pct}%;background:${color}"></div></div>
    </div>`;
  },
};

// ============ 图表动画 CSS（动态注入） ============
(function injectChartCss() {
  const css = `
  @keyframes drawLine { to { stroke-dashoffset: 0; } }
  @keyframes growBar { to { transform: scaleY(1); } }
  @keyframes radarIn { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  @keyframes ringIn { from { stroke-dashoffset: 999; } }
  .chart-box { background: var(--card); border-radius: 12px; padding: 14px; border: 1px solid var(--border); }
  `;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
})();
