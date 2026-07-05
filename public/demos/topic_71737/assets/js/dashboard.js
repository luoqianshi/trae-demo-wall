/* ============================================
   首页总览大屏 - 逻辑
   ============================================ */

(function () {
  const D = WF_DATA;
  const charts = [];

  /* ===== KPI 卡片 ===== */
  function renderKpis() {
    const wrap = document.getElementById('db-kpis');
    wrap.innerHTML = D.kpis.map((k, i) => `
      <div class="kpi-card ${k.color}" style="animation-delay:${i * 0.08}s">
        <div class="kpi-label">${k.label}</div>
        <div class="kpi-num-row">
          <span class="kpi-num scroll-num" data-target="${k.value}">0</span>
          <span class="kpi-unit">${k.unit}${k.suffix || ''}</span>
        </div>
        <div class="kpi-arrow">▲ 较去年增长 ${Math.floor(Math.random() * 20 + 5)}.${Math.floor(Math.random() * 9)}%</div>
      </div>
    `).join('');

    // 数字滚动
    wrap.querySelectorAll('.scroll-num').forEach((el, i) => {
      setTimeout(() => WF.animateNumber(el, +el.dataset.target, { duration: 1800 + i * 100 }), 200 + i * 80);
    });
  }

  /* ===== 品类饼图 ===== */
  function renderCategory() {
    const el = document.getElementById('chart-category');
    const chart = echarts.init(el);
    charts.push(chart);
    const colors = ['#C8392F', '#C9A14A', '#2E8B7A', '#1F4E8C', '#A82820', '#E8C97A', '#5A4F44'];

    chart.setOption({
      tooltip: { trigger: 'item', formatter: '{b}<br/>{c} 项 ({d}%)' },
      legend: {
        bottom: 0, left: 'center',
        textStyle: { color: '#5A4F44', fontSize: 11 },
        itemWidth: 10, itemHeight: 10
      },
      color: colors,
      series: [{
        type: 'pie',
        radius: ['38%', '62%'],
        center: ['50%', '42%'],
        roseType: 'radius',
        itemStyle: { borderRadius: 6, borderColor: '#F5EFE0', borderWidth: 2 },
        label: { color: '#2A2520', fontSize: 11 },
        labelLine: { length: 8, length2: 8 },
        data: D.categories,
        animationDuration: 1400,
        animationEasing: 'cubicOut'
      }]
    });
  }

  /* ===== 传承人等级 ===== */
  function renderLevel() {
    const el = document.getElementById('chart-level');
    const chart = echarts.init(el);
    charts.push(chart);
    const data = [
      { name: '国家级', value: 42 },
      { name: '省级', value: 168 },
      { name: '市级', value: 386 },
      { name: '县级', value: 240 }
    ];
    chart.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 50, right: 30, top: 20, bottom: 30 },
      xAxis: {
        type: 'category', data: data.map(d => d.name),
        axisLine: { lineStyle: { color: '#8A7C6E' } },
        axisLabel: { color: '#5A4F44', fontSize: 11 },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: 'rgba(138,124,110,0.2)', type: 'dashed' } },
        axisLabel: { color: '#8A7C6E', fontSize: 11 }
      },
      series: [{
        type: 'bar',
        data: data.map((d, i) => ({
          value: d.value,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: ['#C8392F', '#C9A14A', '#2E8B7A', '#1F4E8C'][i] },
              { offset: 1, color: 'rgba(201, 161, 74, 0.3)' }
            ]),
            borderRadius: [6, 6, 0, 0]
          }
        })),
        barWidth: '45%',
        animationDelay: function (idx) { return idx * 120; },
        animationDuration: 1000
      }]
    });
  }

  /* ===== 区县柱状图 ===== */
  function renderDistrict() {
    const el = document.getElementById('chart-district');
    const chart = echarts.init(el);
    charts.push(chart);
    const sorted = [...D.districts].sort((a, b) => b.value - a.value);

    chart.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: '{b}<br/>非遗数量：{c} 项' },
      grid: { left: 70, right: 30, top: 15, bottom: 20 },
      xAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: 'rgba(138,124,110,0.2)', type: 'dashed' } },
        axisLabel: { color: '#8A7C6E', fontSize: 11 }
      },
      yAxis: {
        type: 'category',
        data: sorted.map(d => d.name).reverse(),
        axisLine: { lineStyle: { color: '#8A7C6E' } },
        axisLabel: { color: '#5A4F44', fontSize: 11 },
        axisTick: { show: false }
      },
      series: [{
        type: 'bar',
        data: sorted.map(d => d.value).reverse().map((v, i) => ({
          value: v,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: 'rgba(201, 161, 74, 0.4)' },
              { offset: 1, color: '#C8392F' }
            ]),
            borderRadius: [0, 6, 6, 0]
          }
        })),
        barWidth: '55%',
        label: { show: true, position: 'right', color: '#5A4F44', fontSize: 11 },
        animationDuration: 1400,
        animationEasing: 'cubicOut'
      }]
    });

    window.__districtChart = chart;
    window.__districtSorted = sorted;
  }

  /* ===== 增长趋势 ===== */
  function renderTrend() {
    const el = document.getElementById('chart-trend');
    const chart = echarts.init(el);
    charts.push(chart);
    const years = ['2019', '2020', '2021', '2022', '2023', '2024', '2025'];
    const project = [980, 1120, 1280, 1390, 1510, 1632, 1742];

    chart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: 45, right: 25, top: 30, bottom: 30 },
      xAxis: {
        type: 'category', data: years, boundaryGap: false,
        axisLine: { lineStyle: { color: '#8A7C6E' } },
        axisLabel: { color: '#5A4F44', fontSize: 11 }
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: 'rgba(138,124,110,0.2)', type: 'dashed' } },
        axisLabel: { color: '#8A7C6E', fontSize: 11 }
      },
      series: [{
        type: 'line',
        data: project,
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { width: 3, color: '#C8392F' },
        itemStyle: { color: '#C8392F', borderColor: '#FFF6E6', borderWidth: 2 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(200, 57, 47, 0.4)' },
            { offset: 1, color: 'rgba(200, 57, 47, 0.02)' }
          ])
        },
        animationDuration: 1800,
        animationEasing: 'cubicOut'
      }]
    });
  }

  /* ===== 潍坊热力地图 ===== */
  function renderMap() {
    const el = document.getElementById('chart-map');
    const chart = echarts.init(el);
    charts.push(chart);

    const renderMapChart = (mapName) => {
      chart.setOption({
        tooltip: {
          trigger: 'item',
          formatter: (p) => {
            const d = D.districts.find(x => x.name === p.name);
            if (!d) return p.name;
            return `<div style="font-family:'Noto Serif SC',serif">
              <b style="color:#C8392F;font-size:14px">${p.name}</b><br/>
              非遗项目：<b>${d.value}</b> 项<br/>
              代表项目：${d.hot}
            </div>`;
          }
        },
        visualMap: {
          min: 50, max: 140,
          left: 20, bottom: 20,
          text: ['密集', '稀少'],
          textStyle: { color: '#5A4F44', fontSize: 11 },
          inRange: { color: ['#2E8B7A', '#C9A14A', '#C8392F'] },
          calculable: true,
          itemWidth: 14, itemHeight: 80
        },
        geo: {
          map: mapName,
          roam: false,
          zoom: 1.15,
          label: {
            show: true,
            color: '#2A2520',
            fontSize: 11,
            fontFamily: 'Noto Serif SC'
          },
          itemStyle: {
            borderColor: 'rgba(201, 161, 74, 0.6)',
            borderWidth: 1,
            areaColor: 'rgba(245, 239, 224, 0.5)'
          },
          emphasis: {
            itemStyle: { areaColor: '#E8C97A', borderColor: '#C8392F', borderWidth: 2, shadowBlur: 20, shadowColor: 'rgba(200,57,47,0.5)' },
            label: { color: '#C8392F', fontWeight: 700 }
          }
        },
        series: [{
          type: 'map',
          map: mapName,
          geoIndex: 0,
          data: D.districts.map(d => ({ name: d.name, value: d.value })),
          animationDuration: 1200
        }, {
          // 散点标记
          type: 'scatter',
          coordinateSystem: 'geo',
          symbol: 'pin',
          symbolSize: 32,
          symbolOffset: [0, '-50%'],
          data: D.districts.map(d => ({
            name: d.name,
            value: [d.lng, d.lat, d.value]
          })),
          label: { show: false },
          itemStyle: { color: '#C8392F', opacity: 0.85, borderColor: '#FFF6E6', borderWidth: 1 },
          emphasis: { itemStyle: { color: '#A82820' }, scale: 1.3 },
          animationDuration: 1600,
          animationDelay: function (i) { return i * 80; }
        }]
      });

      // 联动区县柱状图
      chart.on('click', (params) => {
        if (params.componentType === 'series' && (params.seriesType === 'map' || params.seriesType === 'scatter')) {
          const name = params.name;
          const tip = document.getElementById('map-tip');
          const d = D.districts.find(x => x.name === name);
          if (d && tip) tip.textContent = `${name} · ${d.value} 项 · ${d.hot}`;
          // 高亮柱状图
          if (window.__districtChart && window.__districtSorted) {
            window.__districtChart.dispatchAction({ type: 'highlight', seriesIndex: 0, name });
            setTimeout(() => {
              window.__districtChart.dispatchAction({ type: 'downplay', seriesIndex: 0, name });
            }, 2200);
          }
        }
      });
    };

    // 尝试加载真实 GeoJSON，失败则用简化版
    fetch('https://geo.datav.aliyun.com/areas_v3/bound/370700_full.json')
      .then(r => r.json())
      .then(geo => {
        echarts.registerMap('weifang', geo);
        renderMapChart('weifang');
      })
      .catch(() => {
        echarts.registerMap('weifang_simplify', buildSimplifiedWeifang());
        renderMapChart('weifang_simplify');
      });
  }

  /* 简化版潍坊地图（fallback） */
  function buildSimplifiedWeifang() {
    const layout = {
      '寿光市': [[118.4, 36.95], [119.1, 36.95], [119.1, 36.75], [118.7, 36.6], [118.4, 36.7]],
      '昌邑市': [[119.1, 37.0], [119.7, 37.0], [119.7, 36.7], [119.1, 36.7]],
      '寒亭区': [[119.05, 36.85], [119.4, 36.85], [119.4, 36.65], [119.05, 36.65]],
      '奎文区': [[119.05, 36.78], [119.22, 36.78], [119.22, 36.65], [119.05, 36.65]],
      '潍城区': [[118.95, 36.78], [119.1, 36.78], [119.1, 36.62], [118.95, 36.62]],
      '坊子区': [[119.05, 36.65], [119.32, 36.65], [119.32, 36.5], [119.05, 36.5]],
      '昌乐县': [[118.55, 36.82], [118.95, 36.82], [118.95, 36.6], [118.55, 36.6]],
      '青州市': [[118.2, 36.82], [118.6, 36.82], [118.6, 36.5], [118.2, 36.55]],
      '临朐县': [[118.2, 36.55], [118.7, 36.55], [118.7, 36.2], [118.3, 36.2]],
      '安丘市': [[118.95, 36.55], [119.5, 36.55], [119.5, 36.2], [119.0, 36.2]],
      '昌邑市2': [], // placeholder
      '诸城市': [[118.9, 36.2], [119.7, 36.2], [119.85, 35.85], [119.0, 35.8]],
      '高密市': [[119.5, 36.55], [119.95, 36.55], [119.95, 36.15], [119.55, 36.15]]
    };
    const features = D.districts.map(d => {
      const coords = layout[d.name] || [[d.lng - 0.18, d.lat - 0.12], [d.lng + 0.18, d.lat - 0.12], [d.lng + 0.18, d.lat + 0.12], [d.lng - 0.18, d.lat + 0.12]];
      return {
        type: 'Feature',
        properties: { name: d.name },
        geometry: { type: 'Polygon', coordinates: [coords] }
      };
    });
    return { type: 'FeatureCollection', features };
  }

  /* ===== 3D 轮播 ===== */
  function renderCarousel() {
    const track = document.getElementById('carousel-track');
    const items = D.heritageItems;
    const total = items.length;
    let current = 0;

    track.innerHTML = items.map((it, i) => `
      <div class="car-card" data-idx="${i}">
        <span class="car-card-region">${it.region}</span>
        <div class="car-card-img">${WF.illustrationSvg(it.img, 220, 170)}</div>
        <div class="car-card-info">
          <div class="car-card-name">${it.name}</div>
          <div class="car-card-cat">${it.cat}</div>
        </div>
      </div>
    `).join('');

    const cards = track.querySelectorAll('.car-card');

    function layout() {
      cards.forEach((card, i) => {
        let offset = i - current;
        // 循环
        if (offset > total / 2) offset -= total;
        if (offset < -total / 2) offset += total;

        const abs = Math.abs(offset);
        const isCenter = offset === 0;
        const translateX = offset * 200;
        const translateZ = -abs * 140;
        const rotateY = offset * -28;
        const scale = isCenter ? 1 : Math.max(0.7, 1 - abs * 0.12);
        const opacity = abs > 2 ? 0 : 1 - abs * 0.25;
        const filter = isCenter ? 'none' : `blur(${abs * 1.5}px) brightness(0.85)`;

        card.style.transform = `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`;
        card.style.opacity = opacity;
        card.style.filter = filter;
        card.style.zIndex = 20 - abs;
      });
    }

    layout();

    document.getElementById('car-prev').addEventListener('click', () => {
      current = (current - 1 + total) % total;
      layout();
    });
    document.getElementById('car-next').addEventListener('click', () => {
      current = (current + 1) % total;
      layout();
    });

    cards.forEach((card) => {
      card.addEventListener('click', () => {
        current = +card.dataset.idx;
        layout();
      });
    });

    // 自动播放
    let timer = setInterval(() => {
      current = (current + 1) % total;
      layout();
    }, 3800);

    track.addEventListener('mouseenter', () => clearInterval(timer));
    track.addEventListener('mouseleave', () => {
      timer = setInterval(() => {
        current = (current + 1) % total;
        layout();
      }, 3800);
    });
  }

  /* ===== 初始化 ===== */
  function init() {
    renderKpis();
    renderCategory();
    renderLevel();
    renderDistrict();
    renderTrend();
    renderMap();
    renderCarousel();

    window.addEventListener('resize', WF.debounce(() => {
      charts.forEach(c => c.resize());
    }, 200));
  }

  // 等待 DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // 页面切换时销毁图表
  window.addEventListener('hashchange', () => {
    charts.forEach(c => c.dispose());
  }, { once: true });
})();
