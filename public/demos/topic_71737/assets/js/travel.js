/* ============================================
   文旅地图 - 交互逻辑
   ============================================ */

(function () {
  const D = WF_DATA;
  let chart;
  let currentMapName = 'weifang_travel';

  /* 颜色映射 */
  const catColor = {
    '木版年画': '#C8392F',
    '年画': '#C8392F',
    '泥塑': '#C9A14A',
    '剪纸': '#A82820',
    '风筝': '#C8392F',
    '传统音乐': '#2E8B7A',
    '古琴': '#2E8B7A',
    '织造': '#C9A14A'
  };

  function colorOf(cat) {
    return catColor[cat] || '#C9A14A';
  }

  /* 简化版潍坊地图（用于文旅地图） */
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

  function initMap() {
    const el = document.getElementById('travel-map');
    chart = echarts.init(el);

    const renderChart = (mapName) => {
      chart.setOption({
        backgroundColor: 'transparent',
        geo: {
          map: mapName,
          roam: false,
          zoom: 1.1,
          label: {
            show: true,
            color: 'rgba(232, 201, 122, 0.85)',
            fontSize: 11,
            fontFamily: 'Noto Serif SC',
            fontWeight: 600
          },
          itemStyle: {
            areaColor: 'rgba(30, 45, 75, 0.85)',
            borderColor: 'rgba(201, 161, 74, 0.6)',
            borderWidth: 1.2,
            shadowColor: 'rgba(201, 161, 74, 0.4)',
            shadowBlur: 12
          },
          emphasis: {
            itemStyle: {
              areaColor: 'rgba(201, 161, 74, 0.25)',
              borderColor: '#E8C97A',
              borderWidth: 2
            },
            label: { color: '#E8C97A', fontSize: 12 }
          }
        },
        series: []
      });
      renderMarkers();
    };

    // 尝试加载真实 GeoJSON
    fetch('https://geo.datav.aliyun.com/areas_v3/bound/370700_full.json')
      .then(r => r.json())
      .then(geo => {
        echarts.registerMap(currentMapName, geo);
        renderChart(currentMapName);
      })
      .catch(() => {
        echarts.registerMap(currentMapName, buildSimplifiedWeifang());
        renderChart(currentMapName);
      });
  }

  /* 渲染自定义标记 */
  function renderMarkers() {
    const layer = document.getElementById('marker-layer');
    if (!layer || !chart) return;
    layer.innerHTML = '';

    D.hotspots.forEach((spot, i) => {
      const pixel = chart.convertToPixel('geo', [spot.lng, spot.lat]);
      if (!pixel) return;

      const color = colorOf(spot.cat);
      const firstChar = spot.name.charAt(0);

      const marker = document.createElement('div');
      marker.className = 'travel-marker';
      marker.style.left = pixel[0] + 'px';
      marker.style.top = pixel[1] + 'px';
      marker.style.color = color;
      marker.style.animationDelay = (i * 0.1) + 's';
      marker.innerHTML = `
        <div class="marker-label">${spot.name}</div>
        <div class="marker-pulse"></div>
        <div class="marker-pin" style="background:linear-gradient(135deg, ${color}, ${shadeColor(color, -20)})">
          <span>${firstChar}</span>
        </div>
      `;

      marker.addEventListener('click', (e) => {
        e.stopPropagation();
        showPopup(spot, pixel);
      });

      layer.appendChild(marker);
    });
  }

  /* 颜色加深 */
  function shadeColor(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + percent));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0xFF) + percent));
    const b = Math.max(0, Math.min(255, (num & 0xFF) + percent));
    return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
  }

  /* 显示弹窗 */
  function showPopup(spot, pixel) {
    const layer = document.getElementById('popup-layer');
    layer.innerHTML = '';

    const popup = document.createElement('div');
    popup.className = 'travel-popup';
    popup.style.left = pixel[0] + 'px';
    popup.style.top = pixel[1] + 'px';

    popup.innerHTML = `
      <div class="popup-close">✕</div>
      <div class="popup-img">${WF.illustrationSvg(spot.img, 340, 140)}</div>
      <div class="popup-body">
        <div class="popup-cat">${spot.cat}</div>
        <div class="popup-name">${spot.name}</div>
        <div class="popup-region">📍 ${spot.region} · 打卡点 ${spot.lng.toFixed(2)}, ${spot.lat.toFixed(2)}</div>
        <p class="popup-desc">${spot.desc}</p>
        <div class="popup-actions">
          <button class="popup-btn primary" id="book-btn">体验工坊预约</button>
          <button class="popup-btn ghost" id="route-btn">查看路线</button>
        </div>
      </div>
    `;

    layer.appendChild(popup);

    // 关闭
    popup.querySelector('.popup-close').addEventListener('click', () => popup.remove());

    // 预约按钮
    popup.querySelector('#book-btn').addEventListener('click', () => {
      WF.toast(`已为您预约「${spot.name}」体验工坊，工作人员将致电确认`, 'success');
    });

    // 路线按钮
    popup.querySelector('#route-btn').addEventListener('click', () => {
      WF.toast(`正在规划前往「${spot.name}」的最佳路线…`, 'info');
    });

    // 点击外部关闭
    setTimeout(() => {
      const handler = (e) => {
        if (!popup.contains(e.target)) {
          popup.remove();
          document.removeEventListener('click', handler);
        }
      };
      document.addEventListener('click', handler);
    }, 100);
  }

  /* 底部列表 */
  function renderBottomList() {
    const list = document.getElementById('bottom-list');
    list.innerHTML = D.hotspots.map((spot, i) => `
      <div class="spot-card" data-idx="${i}">
        <div class="spot-thumb">${WF.illustrationSvg(spot.img, 64, 64)}</div>
        <div class="spot-info">
          <div class="spot-name">${spot.name}</div>
          <div class="spot-meta">📍 ${spot.region}</div>
          <span class="spot-tag">${spot.cat}</span>
        </div>
      </div>
    `).join('');

    list.querySelectorAll('.spot-card').forEach((card) => {
      card.addEventListener('click', () => {
        const idx = +card.dataset.idx;
        const spot = D.hotspots[idx];
        const pixel = chart.convertToPixel('geo', [spot.lng, spot.lat]);
        if (pixel) {
          showPopup(spot, pixel);
          // 滚动到地图
          document.querySelector('.travel-map-wrap').scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    });

    document.getElementById('bottom-tip').textContent = `共 ${D.hotspots.length} 处非遗体验点 · 持续上新`;
  }

  function init() {
    initMap();
    renderBottomList();

    window.addEventListener('resize', WF.debounce(() => {
      if (chart) {
        chart.resize();
        renderMarkers();
      }
    }, 250));
  }

  window.addEventListener('hashchange', () => {
    if (chart) chart.dispose();
  }, { once: true });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
