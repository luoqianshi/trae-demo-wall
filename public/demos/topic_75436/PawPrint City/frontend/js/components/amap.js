// 爪印城市 - 高德地图组件

class AMapComponent {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this.map = null;
    this.markers = [];
    this.infoWindow = null;
    this.options = {
      center: options.center || [116.45, 39.92],
      zoom: options.zoom || 14,
      city: options.city || '北京'
    };
    this.places = [];
    this.isInitialized = false;
  }

  // 初始化地图
  async init() {
    const key = window.APP_CONFIG?.AMAP_KEY || '';

    if (!key) {
      console.log('未配置高德地图Key，使用模拟地图');
      return false;
    }

    // 动态加载高德地图JS API
    if (!window.AMap) {
      await this.loadAMapScript(key);
    }

    if (!window.AMap) {
      console.error('高德地图加载失败');
      return false;
    }

    // 创建地图实例
    this.map = new AMap.Map(this.containerId, {
      zoom: this.options.zoom,
      center: this.options.center,
      mapStyle: 'amap://styles/normal',
      features: ['bg', 'road', 'building', 'point']
    });

    // 创建信息窗口
    this.infoWindow = new AMap.InfoWindow({
      isCustom: true,
      content: '',
      offset: new AMap.Pixel(0, -45)
    });

    // 添加地图控件
    this.addControls();

    this.isInitialized = true;
    console.log('高德地图初始化成功');
    return true;
  }

  // 动态加载高德地图JS API
  loadAMapScript(key) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = `https://webapi.amap.com/maps?v=2.0&key=${key}&callback=onAMapLoaded`;
      script.onerror = () => {
        reject(new Error('高德地图JS API加载失败'));
      };

      // 定义回调函数
      window.onAMapLoaded = () => {
        resolve();
      };

      document.head.appendChild(script);
    });
  }

  // 添加地图控件
  addControls() {
    if (!this.map) return;

    // 异步加载多个控件
    AMap.plugin([
      'AMap.ToolBar',       // 缩放工具条
      'AMap.Scale',         // 比例尺
      'AMap.Geolocation',   // 定位控件
      'AMap.ControlBar'     // 罗盘控件（旋转、倾斜）
    ], () => {
      // 添加缩放工具条（包含放大、缩小）- 放在右下角上方
      const toolbar = new AMap.ToolBar({
        position: {
          right: '10px',
          bottom: '100px'
        },
        liteStyle: true // 简约风格
      });
      this.map.addControl(toolbar);

      // 添加比例尺控件
      const scale = new AMap.Scale({
        position: 'LB' // 左下角
      });
      this.map.addControl(scale);

      // 添加定位控件（定位当前位置）- 放在右下角
      const geolocation = new AMap.Geolocation({
        enableHighAccuracy: true, // 高精度定位
        timeout: 10000,           // 超时时间10秒
        buttonPosition: 'RB',     // 定位按钮位置（右下角）
        showMarker: true,         // 显示定位标记
        showCircle: true,         // 显示定位精度圈
        panToLocation: true,      // 定位成功后自动移动到定位点
        zoomToAccuracy: true      // 定位成功后自动调整精度范围
      });
      this.map.addControl(geolocation);
      this.geolocation = geolocation;

      // 添加罗盘控件（支持地图旋转和倾斜）
      const controlBar = new AMap.ControlBar({
        showControlButton: true, // 显示控制按钮
        position: {
          right: '10px',
          top: '10px'
        }
      });
      this.map.addControl(controlBar);

      console.log('地图控件已加载');
    });
  }

  // 设置场所数据
  setPlaces(places) {
    this.places = places;
    if (this.isInitialized) {
      this.renderMarkers();
    }
  }

  // 渲染标记点
  renderMarkers(filterFn = null) {
    if (!this.map) return;

    // 清除旧标记
    this.clearMarkers();

    // 过滤场所
    const filteredPlaces = filterFn ? this.places.filter(filterFn) : this.places;

    // 场所类型颜色
    const typeColors = {
      '餐饮': '#FF8C42',
      '住宿': '#5DADE2',
      '公共空间': '#86D9C8',
      '商业': '#A569BD'
    };

    // 城市中心坐标（用于像素坐标转换）
    const cityCenters = {
      '北京': { lng: 116.397428, lat: 39.90923, offsetLng: 0.08, offsetLat: 0.04 },
      '上海': { lng: 121.48, lat: 31.22, offsetLng: 0.08, offsetLat: 0.04 },
      '广州': { lng: 113.264385, lat: 23.12911, offsetLng: 0.08, offsetLat: 0.04 },
      '深圳': { lng: 114.085947, lat: 22.547, offsetLng: 0.08, offsetLat: 0.04 },
      '杭州': { lng: 120.153576, lat: 30.287459, offsetLng: 0.08, offsetLat: 0.04 },
      '成都': { lng: 104.065735, lat: 30.659462, offsetLng: 0.08, offsetLat: 0.04 },
      '重庆': { lng: 106.504962, lat: 29.533155, offsetLng: 0.08, offsetLat: 0.04 },
      '武汉': { lng: 114.298572, lat: 30.584355, offsetLng: 0.08, offsetLat: 0.04 },
      '西安': { lng: 108.948024, lat: 34.263161, offsetLng: 0.08, offsetLat: 0.04 },
      '南京': { lng: 118.78, lat: 32.04, offsetLng: 0.08, offsetLat: 0.04 },
      '苏州': { lng: 120.62, lat: 31.32, offsetLng: 0.08, offsetLat: 0.04 },
      '天津': { lng: 117.190182, lat: 39.125575, offsetLng: 0.08, offsetLat: 0.04 },
      '长沙': { lng: 112.982279, lat: 28.194591, offsetLng: 0.08, offsetLat: 0.04 },
      '郑州': { lng: 113.65, lat: 34.76, offsetLng: 0.08, offsetLat: 0.04 },
      '青岛': { lng: 120.33, lat: 36.07, offsetLng: 0.08, offsetLat: 0.04 },
      '大连': { lng: 121.62, lat: 38.92, offsetLng: 0.08, offsetLat: 0.04 },
      '厦门': { lng: 118.1, lat: 24.46, offsetLng: 0.08, offsetLat: 0.04 },
      '昆明': { lng: 102.712251, lat: 25.040609, offsetLng: 0.08, offsetLat: 0.04 },
      '沈阳': { lng: 123.429096, lat: 41.796767, offsetLng: 0.08, offsetLat: 0.04 },
      '哈尔滨': { lng: 126.642464, lat: 45.756967, offsetLng: 0.08, offsetLat: 0.04 }
    };

    // 使用城市配置或从全局配置获取
    const cityConfig = cityCenters[this.options.city] || {
      lng: 116.397428,
      lat: 39.90923,
      offsetLng: 0.08,
      offsetLat: 0.04
    };

    // 如果没有场所数据，显示提示
    if (filteredPlaces.length === 0) {
      // 不渲染任何标记，地图显示空白城市
      return;
    }

    // 创建标记
    filteredPlaces.forEach(place => {
      // 获取经纬度：优先使用location，否则根据coordinate计算
      let lng, lat;
      if (place.location && place.location.lng && place.location.lat) {
        lng = place.location.lng;
        lat = place.location.lat;
      } else if (place.coordinate) {
        // 将像素坐标转换为经纬度
        // 模拟地图尺寸 1200x900
        lng = cityConfig.lng - cityConfig.offsetLng / 2 + (place.coordinate.x / 1200) * cityConfig.offsetLng;
        lat = cityConfig.lat + cityConfig.offsetLat / 2 - (place.coordinate.y / 900) * cityConfig.offsetLat;
      } else {
        // 使用城市中心作为默认位置
        lng = cityConfig.lng;
        lat = cityConfig.lat;
      }

      const marker = new AMap.Marker({
        position: [lng, lat],
        title: place.name,
        extData: place
      });

      // 自定义标记样式
      const color = typeColors[place.type] || '#FF8C42';
      marker.setContent(`
        <div class="amap-marker-custom" style="
          width: 32px;
          height: 32px;
          background: ${color};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 18px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          cursor: pointer;
        ">🐾</div>
      `);

      // 点击事件
      marker.on('click', () => {
        this.showInfoWindow(place);
      });

      this.markers.push(marker);
      this.map.add(marker);
    });

    // 自适应显示所有标记
    if (filteredPlaces.length > 0) {
      this.map.setFitView(this.markers, false, [50, 50, 50, 50]);
    }
  }

  // 显示信息窗口
  showInfoWindow(place) {
    const content = `
      <div class="amap-info-card" onclick="Router.navigate('detail', {id:${place.id}})">
        <div class="amap-info-title">${place.name}</div>
        <div class="amap-info-rating">★ ${place.rating} · ${place.verifyCount}人验证</div>
        <div class="amap-info-tags">
          ${place.petPolicy.allowed ? '<span class="amap-tag allow">允许入内</span>' : '<span class="amap-tag deny">仅室外</span>'}
          ${place.petPolicy.petTypes?.map(t => `<span class="amap-tag">${t}</span>`).join('') || ''}
        </div>
      </div>
    `;

    this.infoWindow.setContent(content);
    this.infoWindow.open(this.map, [place.location.lng, place.location.lat]);
  }

  // 清除所有标记
  clearMarkers() {
    if (this.map && this.markers.length > 0) {
      this.map.remove(this.markers);
      this.markers = [];
    }
  }

  // 设置城市
  setCity(city) {
    const centers = window.APP_CONFIG?.DEFAULT_CENTER || {};
    const center = centers[city];

    if (center && this.map) {
      this.map.setCenter(center);
      this.map.setZoom(14);
      this.options.city = city;
      this.options.center = center;

      // 更新 PlaceSearch 的城市
      if (this.placeSearch) {
        this.placeSearch.setCity(city);
      }
    }
  }

  // 搜索并定位（地理编码）
  searchAndLocate(keyword) {
    if (!this.map || !keyword) return;

    AMap.Geocoder({
      city: this.options.city
    }).getLocation(keyword, (status, result) => {
      if (status === 'complete' && result.geocodes.length > 0) {
        const location = result.geocodes[0].location;
        this.map.setCenter([location.lng, location.lat]);
        this.map.setZoom(15);
      }
    });
  }

  // 初始化 POI 搜索插件
  initPlaceSearch(panelId) {
    if (!this.map) return null;

    return new Promise((resolve) => {
      AMap.plugin(['AMap.PlaceSearch'], () => {
        this.placeSearch = new AMap.PlaceSearch({
          pageSize: 10,
          pageIndex: 1,
          city: this.options.city,
          citylimit: true,
          map: this.map,
          panel: panelId,
          autoFitView: true
        });
        resolve(this.placeSearch);
      });
    });
  }

  // 关键字 POI 搜索
  searchPOI(keyword, callback) {
    if (!this.map || !keyword) return;

    // 确保插件已加载
    AMap.plugin(['AMap.PlaceSearch'], () => {
      if (!this.placeSearch) {
        this.placeSearch = new AMap.PlaceSearch({
          pageSize: 10,
          pageIndex: 1,
          city: this.options.city,
          citylimit: true,
          map: this.map,
          autoFitView: true
        });
      }

      // 清除之前的搜索结果标记
      this.clearSearchMarkers();

      // 执行搜索
      this.placeSearch.search(keyword, (status, result) => {
        if (status === 'complete' && result.poiList) {
          // 保存搜索标记
          this.searchMarkers = result.poiList.pois.map(poi => {
            const marker = new AMap.Marker({
              position: [poi.location.lng, poi.location.lat],
              title: poi.name,
              extData: { type: 'search', poi: poi }
            });
            marker.setContent(`
              <div style="
                width: 28px; height: 28px;
                background: #FF8C42; border-radius: 50%;
                display: flex; align-items: center; justify-content: center;
                color: white; font-size: 14px; font-weight: bold;
                box-shadow: 0 2px 8px rgba(255,140,66,0.5);
                cursor: pointer;
              ">📌</div>
            `);
            marker.on('click', () => {
              this.showSearchInfoWindow(poi);
            });
            this.map.add(marker);
            return marker;
          });

          if (callback) callback(status, result);
        }
      });
    });
  }

  // 显示搜索结果信息窗口
  showSearchInfoWindow(poi) {
    const content = `
      <div style="padding: 12px 14px; min-width: 200px; border-radius: 12px; background: #fff; box-shadow: 0 4px 16px rgba(0,0,0,0.15);">
        <div style="font-size: 15px; font-weight: 600; color: #2D2D2D; margin-bottom: 6px;">${poi.name}</div>
        <div style="font-size: 12px; color: #7A7A7A; margin-bottom: 4px;">📍 ${poi.address || '地址未知'}</div>
        ${poi.tel ? `<div style="font-size: 12px; color: #7A7A7A;">📞 ${poi.tel}</div>` : ''}
        <div style="font-size: 11px; color: #FF8C42; margin-top: 4px;">${poi.type ? poi.type.split(';').slice(0, 2).join(' · ') : ''}</div>
      </div>
    `;

    if (this.infoWindow) {
      this.infoWindow.setContent(content);
      this.infoWindow.open(this.map, [poi.location.lng, poi.location.lat]);
    }
  }

  // 清除搜索结果标记
  clearSearchMarkers() {
    if (this.searchMarkers && this.searchMarkers.length > 0) {
      this.map.remove(this.searchMarkers);
      this.searchMarkers = [];
    }
  }

  // 清除所有搜索（还原本地数据标记）
  clearSearch() {
    this.clearSearchMarkers();
    if (this.placeSearch) {
      this.placeSearch.clear();
    }
    // 恢复本地数据标记
    this.renderMarkers();
  }

  // 销毁地图
  destroy() {
    if (this.map) {
      this.map.destroy();
      this.map = null;
    }
    this.isInitialized = false;
  }
}

// 导出组件
window.AMapComponent = AMapComponent;