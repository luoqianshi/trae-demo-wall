/* ============================================================
   charts.js — Chart.js 图表封装
   ============================================================ */
const Charts = (() => {
  // 深夜观测台主题色
  const COLORS = {
    primary: "#f5a623",
    primarySoft: "rgba(245,166,35,0.15)",
    primaryLine: "rgba(245,166,35,0.9)",
    coral: "#ff6b6b",
    mint: "#4ecdc4",
    mintSoft: "rgba(78,205,196,0.12)",
    text: "#9aa3bd",
    grid: "rgba(245,241,232,0.06)",
    tipBg: "#1e2742",
    tipBorder: "rgba(245,166,35,0.3)"
  };

  Chart.defaults.font.family = "'Manrope','Noto Sans SC',sans-serif";
  Chart.defaults.color = COLORS.text;
  Chart.defaults.borderColor = COLORS.grid;

  const baseOpts = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: {
        labels: { color: COLORS.text, font: { size: 12 }, usePointStyle: true, pointStyle: "circle", padding: 16 }
      },
      tooltip: {
        backgroundColor: COLORS.tipBg,
        borderColor: COLORS.tipBorder,
        borderWidth: 1,
        titleColor: "#f5f1e8",
        bodyColor: "#f5f1e8",
        padding: 12,
        cornerRadius: 8,
        titleFont: { size: 12, weight: "600" },
        bodyFont: { size: 13, family: "'JetBrains Mono',monospace" },
        displayColors: false
      }
    },
    scales: {
      x: {
        grid: { color: COLORS.grid, drawBorder: false },
        ticks: { color: COLORS.text, font: { size: 11, family: "'JetBrains Mono',monospace" } }
      },
      y: {
        grid: { color: COLORS.grid, drawBorder: false },
        ticks: { color: COLORS.text, font: { size: 11, family: "'JetBrains Mono',monospace" }, callback: v => v + " dB" },
        beginAtZero: false,
        suggestedMin: 25,
        suggestedMax: 75
      }
    }
  };

  const instances = {};

  function destroy(key) {
    if (instances[key]) { instances[key].destroy(); delete instances[key]; }
  }

  // 24h 今日曲线
  function renderToday(canvas, sessions) {
    destroy("today");
    const today = new Date(); today.setHours(0,0,0,0);
    const next = new Date(today.getTime() + 86400000);
    const todaySessions = sessions.filter(s => {
      const t = new Date(s.startTime); return t >= today && t < next;
    });
    // 聚合到小时
    const hours = new Array(24).fill(null).map(()=>({sum:0,count:0,max:0}));
    todaySessions.forEach(s => {
      s.samples.forEach(sm => {
        const h = new Date(sm.t).getHours();
        hours[h].sum += sm.db;
        hours[h].count++;
        hours[h].max = Math.max(hours[h].max, sm.db);
      });
    });
    const labels = hours.map((_,i)=> i.toString().padStart(2,"0")+":00");
    const avgData = hours.map(h => h.count ? +h.sum.toFixed(1)/h.count : null);
    const maxData = hours.map(h => h.max || null);

    const ctx = canvas.getContext("2d");
    const grad = ctx.createLinearGradient(0,0,0,220);
    grad.addColorStop(0, "rgba(245,166,35,0.35)");
    grad.addColorStop(1, "rgba(245,166,35,0)");

    instances.today = new Chart(canvas, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "平均噪音",
            data: avgData,
            borderColor: COLORS.primaryLine,
            backgroundColor: grad,
            borderWidth: 2.5,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: COLORS.primary,
            spanGaps: true
          },
          {
            label: "峰值",
            data: maxData,
            borderColor: COLORS.coral,
            backgroundColor: "transparent",
            borderWidth: 1.5,
            borderDash: [4,4],
            fill: false,
            tension: 0.3,
            pointRadius: 0,
            spanGaps: true
          }
        ]
      },
      options: {
        ...baseOpts,
        plugins: {
          ...baseOpts.plugins,
          tooltip: {
            ...baseOpts.plugins.tooltip,
            callbacks: {
              title: items => items[0].label,
              label: ctx => ctx.raw ? `${ctx.dataset.label}: ${ctx.raw.toFixed(1)} dB` : null
            }
          }
        }
      }
    });
  }

  // 单会话时段曲线
  function renderSession(canvas, session) {
    destroy("session");
    if (!session || !session.samples.length) return;
    const labels = session.samples.map(s => {
      const d = new Date(s.t);
      return d.getHours().toString().padStart(2,"0")+":"+d.getMinutes().toString().padStart(2,"0")+":"+d.getSeconds().toString().padStart(2,"0");
    });
    const data = session.samples.map(s => s.db);
    const threshold = Storage.getSettings().threshold;

    const ctx = canvas.getContext("2d");
    const grad = ctx.createLinearGradient(0,0,0,280);
    grad.addColorStop(0, "rgba(245,166,35,0.4)");
    grad.addColorStop(1, "rgba(245,166,35,0)");

    // 峰值点
    const peakIdx = data.indexOf(Math.max(...data));

    instances.session = new Chart(canvas, {
      type: "line",
      data: {
        labels,
        datasets: [{
          label: "分贝",
          data,
          borderColor: COLORS.primaryLine,
          backgroundColor: grad,
          borderWidth: 2,
          fill: true,
          tension: 0.35,
          pointRadius: data.map((_,i)=> i===peakIdx?6:0),
          pointBackgroundColor: data.map((_,i)=> i===peakIdx?COLORS.coral:COLORS.primary),
          pointBorderColor: "#0f1528",
          pointBorderWidth: 2,
          segment: {
            borderColor: ctx => ctx.p1.parsed.y >= threshold ? COLORS.coral : COLORS.primaryLine
          }
        }]
      },
      options: {
        ...baseOpts,
        plugins: {
          ...baseOpts.plugins,
          tooltip: {
            ...baseOpts.plugins.tooltip,
            callbacks: {
              label: ctx => `${ctx.raw.toFixed(1)} dB` + (ctx.raw >= threshold ? "  ⚠ 超阈值" : "")
            }
          }
        },
        scales: {
          ...baseOpts.scales,
          x: {
            ...baseOpts.scales.x,
            ticks: {
              ...baseOpts.scales.x.ticks,
              maxTicksLimit: 8,
              callback: function(val, idx) {
                // 稀疏显示
                const step = Math.ceil(labels.length / 8);
                return idx % step === 0 ? labels[idx] : "";
              }
            }
          }
        }
      }
    });
  }

  // 周对比
  function renderCompare(canvas, comp) {
    destroy("compare");
    if (!comp) return;
    const labels = ["周一","周二","周三","周四","周五","周六","周日"];

    instances.compare = new Chart(canvas, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "本周平均",
            data: Array(7).fill(comp.thisWeek.avg),
            borderColor: COLORS.primary,
            backgroundColor: COLORS.primarySoft,
            borderWidth: 2.5,
            fill: false,
            tension: 0.3,
            pointRadius: 4,
            pointBackgroundColor: COLORS.primary
          },
          {
            label: "上周平均",
            data: Array(7).fill(comp.lastWeek.avg),
            borderColor: COLORS.mint,
            backgroundColor: "transparent",
            borderWidth: 2,
            borderDash: [6,4],
            fill: false,
            tension: 0.3,
            pointRadius: 4,
            pointBackgroundColor: COLORS.mint
          }
        ]
      },
      options: {
        ...baseOpts,
        plugins: {
          ...baseOpts.plugins,
          tooltip: {
            ...baseOpts.plugins.tooltip,
            callbacks: { label: ctx => `${ctx.dataset.label}: ${ctx.raw.toFixed(1)} dB` }
          }
        }
      }
    });
  }

  return { renderToday, renderSession, renderCompare, destroy };
})();
