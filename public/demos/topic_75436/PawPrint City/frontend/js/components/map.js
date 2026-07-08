// 爪印城市 - 地图组件（支持高德地图和模拟地图）

// 统一地图管理器
const MapManager = {
  currentMap: null, // 当前使用的地图实例
  isAMap: false,    // 是否使用高德地图
  places: [],
  onMarkerClick: null,

  // 初始化地图
  async init(containerId, places, onMarkerClick, options = {}) {
    this.places = places;
    this.onMarkerClick = onMarkerClick;

    const key = window.APP_CONFIG?.AMAP_KEY || '';
    const city = options.city || window.APP_CONFIG?.DEFAULT_CITY || '北京';
    const center = window.APP_CONFIG?.DEFAULT_CENTER?.[city] || [116.45, 39.92];
    const zoom = window.APP_CONFIG?.DEFAULT_ZOOM || 14;

    // 尝试使用高德地图
    if (key && window.AMapComponent) {
      const amap = new AMapComponent(containerId, { center, zoom, city });
      const success = await amap.init();
      if (success) {
        this.currentMap = amap;
        this.isAMap = true;
        amap.setPlaces(places);
        console.log('使用高德地图');
        return;
      }
    }

    // 使用模拟地图
    this.isAMap = false;
    PawMap.init(containerId, places, onMarkerClick);
    console.log('使用模拟地图');
  },

  // 更新场所数据
  updatePlaces(places, filterFn = null) {
    this.places = places;
    if (this.isAMap && this.currentMap) {
      this.currentMap.setPlaces(places);
      this.currentMap.renderMarkers(filterFn);
    } else {
      PawMap.updatePlaces(places);
    }
  },

  // 设置城市
  setCity(city) {
    if (this.isAMap && this.currentMap) {
      this.currentMap.setCity(city);
    } else {
      // 模拟地图暂不支持城市切换
      console.log('模拟地图不支持城市切换');
    }
  },

  // 搜索（POI关键词搜索）
  search(keyword, callback) {
    if (this.isAMap && this.currentMap) {
      this.currentMap.searchPOI(keyword, callback);
    } else {
      // 模拟地图的搜索逻辑在home.js中处理
    }
  },

  // 清除搜索，恢复本地数据
  clearSearch() {
    if (this.isAMap && this.currentMap) {
      this.currentMap.clearSearch();
    }
  },

  // 销毁地图
  destroy() {
    if (this.isAMap && this.currentMap) {
      this.currentMap.destroy();
    }
    this.currentMap = null;
    this.isAMap = false;
  }
};

// 模拟地图组件（原有代码）
const PawMap = {
  scale: 0.55,
  offsetX: -180,
  offsetY: -60,
  minScale: 0.35,
  maxScale: 1.2,
  isDragging: false,
  dragStart: { x: 0, y: 0 },
  dragOffset: { x: 0, y: 0 },
  places: [],
  markers: [],
  selectedId: null,
  onMarkerClick: null,
  // 惯性拖拽
  velocityX: 0,
  velocityY: 0,
  lastMoveTime: 0,
  lastMoveX: 0,
  lastMoveY: 0,
  inertiaTimer: null,
  // 双指缩放
  initialPinchDistance: 0,
  initialPinchScale: 0,

  init(containerId, places, onMarkerClick) {
    this.places = places;
    this.onMarkerClick = onMarkerClick;
    const container = document.getElementById(containerId);
    if (!container) return;

    // 构建地图底图HTML
    const mapHTML = this._buildMapBase();
    container.innerHTML = `
      <div class="map-canvas" id="map-canvas">
        ${mapHTML}
        <div id="markers-layer" style="position:absolute;inset:0;z-index:10;"></div>
      </div>
      <div class="map-controls">
        <button class="map-ctrl-btn" id="map-zoom-in">+</button>
        <button class="map-ctrl-btn" id="map-zoom-out">−</button>
        <button class="map-ctrl-btn" id="map-locate">📍</button>
      </div>
      <div id="info-card-container" style="position:absolute;bottom:0;left:0;right:0;z-index:30;"></div>
    `;

    this._updateTransform();
    this._renderMarkers();
    this._bindEvents();
  },

  _buildMapBase() {
    // 模拟道路
    const roads = [
      { x: 200, y: 0, w: 30, h: 900 }, { x: 420, y: 0, w: 28, h: 900 },
      { x: 600, y: 0, w: 30, h: 900 }, { x: 780, y: 0, w: 25, h: 900 },
      { x: 0, y: 160, w: 1200, h: 25 }, { x: 0, y: 320, w: 1200, h: 28 },
      { x: 0, y: 480, w: 1200, h: 22 }, { x: 0, y: 620, w: 1200, h: 25 }
    ];
    // 绿地
    const greens = [
      { cx: 300, cy: 100, r: 60 }, { cx: 620, cy: 380, r: 80 },
      { cx: 100, cy: 500, r: 55 }, { cx: 800, cy: 200, r: 65 },
      { cx: 500, cy: 650, r: 70 }, { cx: 900, cy: 500, r: 50 }
    ];
    // 水域
    const waters = [
      { x: 40, y: 200, w: 80, h: 50 }, { x: 700, y: 500, w: 100, h: 40 }
    ];
    // 标签
    const labels = [
      { x: 280, y: 80, text: '奥林匹克森林公园', bold: true },
      { x: 520, y: 150, text: '798艺术区', bold: true },
      { x: 440, y: 260, text: '三里屯商圈', bold: true },
      { x: 580, y: 320, text: '工体北路', bold: false },
      { x: 600, y: 380, text: '朝阳公园', bold: true },
      { x: 480, y: 420, text: '国贸CBD', bold: true },
      { x: 260, y: 340, text: '中关村', bold: true },
      { x: 360, y: 280, text: '望京SOHO', bold: false },
      { x: 680, y: 240, text: '朝阳大悦城', bold: false },
      { x: 700, y: 340, text: '常营天街', bold: false },
      { x: 780, y: 400, text: '大运河', bold: false },
      { x: 500, y: 520, text: '花市文化广场', bold: false },
      { x: 620, y: 480, text: '广渠路', bold: false }
    ];

    let html = '<div class="map-bg-grid"></div>';

    greens.forEach(g => {
      html += `<div class="map-green" style="left:${g.cx - g.r}px;top:${g.cy - g.r}px;width:${g.r * 2}px;height:${g.r * 2}px;"></div>`;
    });
    waters.forEach(w => {
      html += `<div class="map-water" style="left:${w.x}px;top:${w.y}px;width:${w.w}px;height:${w.h}px;"></div>`;
    });
    roads.forEach(r => {
      html += `<div class="map-road" style="left:${r.x}px;top:${r.y}px;width:${r.w}px;height:${r.h}px;"></div>`;
    });
    labels.forEach(l => {
      html += `<div class="map-label${l.bold ? ' bold' : ''}" style="left:${l.x}px;top:${l.y}px;">${l.text}</div>`;
    });

    return html;
  },

  _renderMarkers() {
    const layer = document.getElementById('markers-layer');
    if (!layer) return;
    this.markers = [];

    const typeClass = { '餐饮': 'dining', '住宿': 'hotel', '公共空间': 'park', '商业': 'shop' };

    this.places.forEach(place => {
      const marker = document.createElement('div');
      marker.className = `paw-marker ${typeClass[place.type] || 'dining'}`;
      marker.style.left = place.coordinate.x + 'px';
      marker.style.top = place.coordinate.y + 'px';
      marker.textContent = '🐾';
      marker.title = place.name;
      marker.addEventListener('click', (e) => {
        e.stopPropagation();
        this._showInfoCard(place);
      });
      layer.appendChild(marker);
      this.markers.push({ el: marker, place });
    });
  },

  _showInfoCard(place) {
    this.selectedId = place.id;
    const container = document.getElementById('info-card-container');
    const typeClass = { '餐饮': 'tag-dining', '住宿': 'tag-hotel', '公共空间': 'tag-park', '商业': 'tag-shop' };

    const facilities = place.petPolicy.facilities.slice(0, 2).map(f =>
      `<span class="tag tag-facility">${f}</span>`
    ).join('');

    container.innerHTML = `
      <div class="info-card" onclick="PawMap._goDetail(${place.id})">
        <div class="info-name">${place.name}</div>
        <div class="info-meta">
          <span class="info-rating">★ ${place.rating}</span>
          <span>${place.reviewCount}条评价</span>
          <span class="tag ${typeClass[place.type] || 'tag-dining'}">${place.type}</span>
        </div>
        <div class="info-tags">
          ${facilities}
          <span class="tag tag-pet">${place.petPolicy.petTypes.join('/')}</span>
        </div>
      </div>
    `;
  },

  _goDetail(id) {
    if (this.onMarkerClick) {
      this.onMarkerClick(id);
    }
  },

  hideInfoCard() {
    const container = document.getElementById('info-card-container');
    if (container) container.innerHTML = '';
    this.selectedId = null;
  },

  _updateTransform() {
    const canvas = document.getElementById('map-canvas');
    if (canvas) {
      canvas.style.transform = `translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;
      canvas.style.transition = 'none';
    }
  },

  _smoothTransform() {
    const canvas = document.getElementById('map-canvas');
    if (canvas) {
      canvas.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      canvas.style.transform = `translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;
      setTimeout(() => { canvas.style.transition = 'none'; }, 300);
    }
  },

  _bindEvents() {
    const container = document.querySelector('.map-container');
    if (!container) return;
    const self = this;

    // 鼠标/触摸拖拽
    const onStart = (e) => {
      self.isDragging = true;
      const pt = e.touches ? e.touches[0] : e;
      self.dragStart = { x: pt.clientX, y: pt.clientY };
      self.dragOffset = { x: self.offsetX, y: self.offsetY };
      self.lastMoveX = pt.clientX;
      self.lastMoveY = pt.clientY;
      self.lastMoveTime = Date.now();
      self.velocityX = 0;
      self.velocityY = 0;
      self.hideInfoCard();
      // 停止惯性动画
      if (self.inertiaTimer) {
        cancelAnimationFrame(self.inertiaTimer);
        self.inertiaTimer = null;
      }
    };

    const onMove = (e) => {
      if (!self.isDragging) return;
      e.preventDefault();
      const pt = e.touches ? e.touches[0] : e;
      const now = Date.now();
      const dt = now - self.lastMoveTime;
      if (dt > 0) {
        self.velocityX = (pt.clientX - self.lastMoveX) / dt;
        self.velocityY = (pt.clientY - self.lastMoveY) / dt;
      }
      self.lastMoveX = pt.clientX;
      self.lastMoveY = pt.clientY;
      self.lastMoveTime = now;

      self.offsetX = self.dragOffset.x + (pt.clientX - self.dragStart.x);
      self.offsetY = self.dragOffset.y + (pt.clientY - self.dragStart.y);
      self._updateTransform();
    };

    const onEnd = () => {
      if (!self.isDragging) return;
      self.isDragging = false;
      // 惯性动画
      self._startInertia();
    };

    container.addEventListener('mousedown', onStart);
    container.addEventListener('touchstart', onStart, { passive: false });
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchend', onEnd);

    // 双指缩放
    container.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        self.isDragging = false;
        self.initialPinchDistance = self._getPinchDistance(e.touches);
        self.initialPinchScale = self.scale;
      }
    }, { passive: false });

    container.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const currentDistance = self._getPinchDistance(e.touches);
        if (self.initialPinchDistance > 0) {
          const scaleFactor = currentDistance / self.initialPinchDistance;
          self.scale = Math.max(self.minScale, Math.min(self.maxScale, self.initialPinchScale * scaleFactor));
          self._updateTransform();
        }
      }
    }, { passive: false });

    container.addEventListener('touchend', () => {
      self.initialPinchDistance = 0;
    });

    // 缩放按钮
    document.getElementById('map-zoom-in')?.addEventListener('click', () => {
      self.scale = Math.min(self.maxScale, self.scale + 0.1);
      self._smoothTransform();
    });
    document.getElementById('map-zoom-out')?.addEventListener('click', () => {
      self.scale = Math.max(self.minScale, self.scale - 0.1);
      self._smoothTransform();
    });
    document.getElementById('map-locate')?.addEventListener('click', () => {
      self.scale = 0.55;
      self.offsetX = -180;
      self.offsetY = -60;
      self._smoothTransform();
      self.hideInfoCard();
    });

    // 滚轮缩放
    container.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      self.scale = Math.max(self.minScale, Math.min(self.maxScale, self.scale + delta));
      self._updateTransform();
    }, { passive: false });
  },

  _getPinchDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  },

  _startInertia() {
    const self = this;
    const friction = 0.92;
    const minVelocity = 0.05;

    function animate() {
      self.velocityX *= friction;
      self.velocityY *= friction;

      if (Math.abs(self.velocityX) < minVelocity && Math.abs(self.velocityY) < minVelocity) {
        self.inertiaTimer = null;
        return;
      }

      self.offsetX += self.velocityX * 16;
      self.offsetY += self.velocityY * 16;
      self._updateTransform();
      self.inertiaTimer = requestAnimationFrame(animate);
    }

    if (Math.abs(self.velocityX) > minVelocity || Math.abs(self.velocityY) > minVelocity) {
      self.inertiaTimer = requestAnimationFrame(animate);
    }
  },

  updatePlaces(places) {
    this.places = places;
    const layer = document.getElementById('markers-layer');
    if (layer) layer.innerHTML = '';
    this.hideInfoCard();
    this._renderMarkers();
  }
};

// 导出地图管理器
window.MapManager = MapManager;