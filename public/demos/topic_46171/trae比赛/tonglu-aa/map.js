// ============================================================
// map.js — 同路 AA 地图模块
// 封装所有 Leaflet 交互逻辑，提供统一的状态管理 API
// 支持：路线绘制、起终点标记、瓦片容错、本地 fallback 模式
// ============================================================
//
// 关于 地图.pbf（项目根目录）：
//   PBF 是 OpenStreetMap 原始矢量数据格式，无法直接在前端 <img>/tile 层使用。
//   要在网页中展示，需要先转换为：
//     1. 栅格瓦片服务（用 tilemaker / osm2pgsql + renderd 生成 PNG 瓦片）
//     2. MBTiles（用 tilemaker 生成，可用 mbtileserver 提供服务）
//     3. PMTiles（用 tippecanoe / go-pmtiles 生成，可直接用 protomaps-leaflet 前端渲染）
//   本项目当前使用 OpenStreetMap 在线瓦片，未加载 pbf 文件。
// ============================================================

const MapController = (() => {

  // ===== 内部状态 =====
  let routeMap = null;          // 主路线地图实例
  let routePolyline = null;     // 路线 polyline
  let startMarker = null;       // 起点标记
  let endMarker = null;         // 终点标记
  let poiLayerGroup = null;     // POI 图层组
  let tileLayer = null;         // 瓦片图层引用（用于错误处理）
  let tileErrorCount = 0;       // 瓦片加载失败计数
  let tileLoadTimeout = null;   // 瓦片加载超时检测器
  let mapState = 'idle';        // idle | loading | ready | error | fallback

  let locationMap = null;       // 位置共享地图实例
  let locationRouteLine = null; // 位置共享地图上的路线

  // ===== 瓦片配置 =====
  function getTileConfig() {
    const cfg = (window.CONFIG && window.CONFIG.MAP) || {};
    const provider = cfg.PROVIDER || 'leaflet_osm';
    switch (provider) {
      case 'gaode':
        return {
          url: `https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}`,
          subdomains: ['1', '2', '3', '4'],
          attribution: '© 高德地图',
          maxZoom: 18,
          key: cfg.KEY || '',
        };
      case 'tencent':
        return {
          url: `https://rt{s}.map.gtimg.com/realtimerender?z={z}&x={x}&y={-y}&type=vector&style=0`,
          subdomains: ['0', '1', '2', '3'],
          attribution: '© 腾讯地图',
          maxZoom: 18,
          key: cfg.KEY || '',
        };
      default: // leaflet_osm
        return {
          url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          subdomains: 'abc',
          attribution: '© OpenStreetMap contributors',
          maxZoom: 18,
          key: '',
        };
    }
  }

  // ===== 创建瓦片图层（带错误处理 + 备用源） =====
  // 备用瓦片源列表（按优先级尝试）— 高德中文瓦片优先
  const TILE_SOURCES = [
    {
      url: 'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
      subdomains: ['1', '2', '3', '4'],
      attribution: '© 高德地图',
      maxZoom: 18,
    },
    {
      url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      subdomains: 'abcd',
      attribution: '© OpenStreetMap, © CARTO',
      maxZoom: 19,
    },
    {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      subdomains: 'abc',
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
    },
  ];

  function createTileLayer(map, onError) {
    tileErrorCount = 0;
    let errorFired = false;
    let currentSourceIdx = 0;
    let layer = null;

    function trySource(idx) {
      if (idx >= TILE_SOURCES.length) {
        // 所有源都失败了
        if (!errorFired) {
          errorFired = true;
          if (onError) onError('地图瓦片加载失败，已切换为路线示意模式。');
        }
        return;
      }
      const src = TILE_SOURCES[idx];
      if (layer) { try { map.removeLayer(layer); } catch (e) {} }

      layer = L.tileLayer(src.url, {
        subdomains: src.subdomains,
        attribution: src.attribution,
        maxZoom: src.maxZoom,
        crossOrigin: true,
      });

      let sourceErrorCount = 0;
      let sourceHasLoaded = false;

      layer.on('tileerror', (e) => {
        // 过滤 ERR_ABORTED 类型的错误（浏览器中止请求，正常行为）
        const tile = e.tile;
        if (tile && tile.src === '') return; // 被中止的请求不计数
        if (tile && !tile.src) return; // src 为空，中止请求
        sourceErrorCount++;
        // 连续失败超过 15 次且没有任何成功加载时切换备用源
        if (sourceErrorCount >= 15 && !sourceHasLoaded) {
          console.warn(`[MapController] Tile source ${idx} failed (${sourceErrorCount} errors), trying next...`);
          currentSourceIdx = idx + 1;
          trySource(currentSourceIdx);
        }
      });

      layer.on('tileload', () => {
        sourceHasLoaded = true;
        tileErrorCount = Math.max(0, tileErrorCount - 1);
      });

      layer.addTo(map);
    }

    trySource(0);

    // 超时检测：20 秒内没有任何瓦片加载成功则提示（适应弱网环境）
    if (tileLoadTimeout) clearTimeout(tileLoadTimeout);
    tileLoadTimeout = setTimeout(() => {
      if (!errorFired && tileErrorCount >= 3) {
        errorFired = true;
        if (onError) onError('地图瓦片加载超时，已切换为路线示意模式。');
      }
    }, 15000);

    return layer;
  }

  // ===== 创建自定义标记图标 =====
  function createStartIcon() {
    return L.divIcon({
      className: 'route-start-marker',
      html: '<div style="background:#c53d43;width:28px;height:28px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;color:#fff;font-size:15px;line-height:1">📍</div>',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
  }

  function createEndIcon() {
    return L.divIcon({
      className: 'route-end-marker',
      html: '<div style="background:#ef4444;width:28px;height:28px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;color:#fff;font-size:15px;line-height:1">🏁</div>',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
  }

  function createMemberIcon(color, status) {
    const ring = status === 'sos' ? '#ef4444' : status === 'deviation' ? '#ff9500' : color;
    const pulse = status !== 'normal' ? `box-shadow:0 0 0 4px ${ring}33,0 0 0 8px ${ring}22;` : '';
    const svg = `<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="14" fill="${color}" stroke="#fff" stroke-width="2.5" style="${pulse}"/>
      <circle cx="16" cy="13" r="5" fill="#fff"/>
      <path d="M8 26 Q16 18 24 26 L24 28 L8 28 Z" fill="#fff"/>
    </svg>`;
    return L.divIcon({
      html: svg,
      className: 'member-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16],
    });
  }

  // ===== GeoJSON 坐标转换 [lon,lat] → [lat,lon] =====
  function geoJsonToLeafletCoords(geometry) {
    if (!geometry || !geometry.coordinates) return [];
    return geometry.coordinates.map(c => [c[1], c[0]]);
  }

  // ===== 本地 fallback 路线（直线示意） =====
  function buildFallbackGeometry(originCoord, destCoord) {
    // 生成一条带中间点的折线（模拟路线弯曲）
    const lat1 = originCoord.lat, lon1 = originCoord.lon;
    const lat2 = destCoord.lat, lon2 = destCoord.lon;
    const midLat = (lat1 + lat2) / 2 + (Math.random() - 0.5) * 0.05;
    const midLon = (lon1 + lon2) / 2 + (Math.random() - 0.5) * 0.05;
    return {
      type: 'LineString',
      coordinates: [
        [lon1, lat1],
        [midLon, midLat],
        [lon2, lat2],
      ],
    };
  }

  // ===== 公开 API =====

  // --- 路线地图 ---

  /**
   * 初始化路线地图（稳定容器，不依赖数据）
   * @param {string} containerId - DOM 元素 ID
   * @param {object} opts - { onTileError: callback }
   */
  function initRouteMap(containerId, opts = {}) {
    const container = document.getElementById(containerId);
    if (!container) return null;

    // 清理旧实例
    if (routeMap) {
      try { routeMap.remove(); } catch (e) {}
      routeMap = null;
    }

    // 默认视角（中国中心）
    routeMap = L.map(containerId, {
      scrollWheelZoom: true,
      zoomControl: true,
      attributionControl: true,
    }).setView([35.86, 104.19], 4); // 中国中心

    tileLayer = createTileLayer(routeMap, (msg) => {
      console.warn('[MapController] Tile error:', msg);
      if (opts.onTileError) opts.onTileError(msg);
    });

    mapState = 'idle';
    return routeMap;
  }

  /**
   * 在地图上绘制路线
   * @param {object} routeData - { geometry: GeoJSON LineString, distanceKm, durationText }
   * @param {string} originName - 出发地名称
   * @param {string} destName - 目的地名称
   * @param {object} originCoord - { lat, lon } 出发地坐标
   * @param {object} destCoord - { lat, lon } 目的地坐标
   */
  function renderRoute(routeData, originName, destName, originCoord, destCoord) {
    if (!routeMap) {
      console.warn('[MapController] renderRoute: map not initialized');
      return;
    }

    // 清理旧图层
    clearRouteLayers();

    let coords, isFallback = false;

    if (routeData && routeData.geometry && routeData.geometry.coordinates) {
      coords = geoJsonToLeafletCoords(routeData.geometry);
    } else if (originCoord && destCoord) {
      // 本地 fallback 模式：用直线示意
      console.warn('[MapController] No route geometry, using fallback straight line');
      const fallbackGeom = buildFallbackGeometry(originCoord, destCoord);
      coords = geoJsonToLeafletCoords(fallbackGeom);
      isFallback = true;
    } else {
      console.warn('[MapController] renderRoute: no data');
      return;
    }

    if (coords.length < 2) return;

    const start = coords[0];
    const end = coords[coords.length - 1];

    // 起点标记
    startMarker = L.marker(start, { icon: createStartIcon(), title: originName })
      .addTo(routeMap)
      .bindPopup(`<b>出发地</b><br>${originName}`);

    // 终点标记
    endMarker = L.marker(end, { icon: createEndIcon(), title: destName })
      .addTo(routeMap)
      .bindPopup(`<b>目的地</b><br>${destName}`);

    // 路线 polyline
    const polyStyle = isFallback
      ? { color: '#ff9500', weight: 4, opacity: 0.7, dashArray: '10, 8', lineJoin: 'round' }
      : { color: '#c53d43', weight: 5, opacity: 0.85, lineJoin: 'round' };

    routePolyline = L.polyline(coords, polyStyle).addTo(routeMap);

    // 自动缩放到路线范围
    routeMap.fitBounds(routePolyline.getBounds(), { padding: [30, 30] });
    routeMap.invalidateSize();

    mapState = isFallback ? 'fallback' : 'ready';
  }

  /**
   * 清理路线图层（保留底图）
   */
  function clearRouteLayers() {
    if (startMarker) { try { routeMap.removeLayer(startMarker); } catch (e) {} startMarker = null; }
    if (endMarker) { try { routeMap.removeLayer(endMarker); } catch (e) {} endMarker = null; }
    if (routePolyline) { try { routeMap.removeLayer(routePolyline); } catch (e) {} routePolyline = null; }
    if (poiLayerGroup) { try { routeMap.removeLayer(poiLayerGroup); } catch (e) {} poiLayerGroup = null; }
  }

  /**
   * 渲染沿途 POI 标注
   * @param {Array} pois - POI 数组 [{name, icon, lat, lon, type}]
   */
  function renderPOIs(pois) {
    if (!routeMap || !pois || pois.length === 0) return;
    if (poiLayerGroup) { try { routeMap.removeLayer(poiLayerGroup); } catch (e) {} }
    poiLayerGroup = L.layerGroup();
    pois.forEach(poi => {
      // 使用 circleMarker：像素半径不随缩放变化，POI 始终可见且不偏离
      const colorMap = { fuel: '#c53d43', food: '#d4a843', view: '#5b8c5a', shop: '#6b5b95', restroom: '#8b7355' };
      const color = colorMap[poi.type] || '#c53d43';
      const marker = L.circleMarker([poi.lat, poi.lon], {
        radius: 10,
        fillColor: color,
        color: '#fff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.85,
      });
      marker.bindTooltip(`${poi.icon} ${poi.name}`, {
        permanent: false,
        direction: 'top',
        offset: [0, -8],
        className: 'poi-tooltip',
      });
      marker.bindPopup(`<div style="font-size:.8rem;font-weight:600">${poi.icon} ${poi.name}</div>`);
      poiLayerGroup.addLayer(marker);
    });
    poiLayerGroup.addTo(routeMap);
  }

  /**
   * 销毁路线地图
   */
  function destroyRouteMap() {
    clearRouteLayers();
    if (tileLoadTimeout) { clearTimeout(tileLoadTimeout); tileLoadTimeout = null; }
    if (routeMap) {
      try { routeMap.remove(); } catch (e) {}
      routeMap = null;
    }
    tileLayer = null;
    mapState = 'idle';
  }

  /**
   * 刷新地图尺寸（Tab 切换后调用）
   */
  function invalidateRouteSize() {
    if (routeMap) {
      try { routeMap.invalidateSize(); } catch (e) {}
    }
  }

  /**
   * 获取地图状态
   */
  function getRouteMapState() {
    return mapState;
  }

  /**
   * 地图是否已初始化
   */
  function isRouteMapReady() {
    return routeMap !== null;
  }

  // --- 位置共享地图 ---

  /**
   * 初始化位置共享地图
   */
  function initLocationMap(containerId) {
    if (locationMap) return locationMap;
    const el = document.getElementById(containerId);
    if (!el) return null;

    locationMap = L.map(containerId, {
      zoomControl: true,
      attributionControl: true,
    });

    createTileLayer(locationMap, (msg) => {
      console.warn('[MapController] Location map tile error:', msg);
    });

    return locationMap;
  }

  /**
   * 在位置共享地图上绘制计划路线
   */
  function drawPlannedRouteOnLocMap(routeData) {
    if (!locationMap || !routeData || !routeData.geometry) return;
    const coords = geoJsonToLeafletCoords(routeData.geometry);
    if (locationRouteLine) {
      try { locationMap.removeLayer(locationRouteLine); } catch (e) {}
    }
    locationRouteLine = L.polyline(coords, {
      color: '#c53d43', weight: 5, opacity: 0.7, dashArray: '8, 6',
    }).addTo(locationMap);
    locationMap.fitBounds(locationRouteLine.getBounds(), { padding: [40, 40] });
  }

  /**
   * 更新成员标记
   */
  function updateMemberMarker(member, lat, lon) {
    if (!locationMap) return;
    if (member.marker) {
      member.marker.setLatLng([lat, lon]);
    } else {
      member.marker = L.marker([lat, lon], {
        icon: createMemberIcon(member.color, member.status),
      }).addTo(locationMap);
    }
  }

  /**
   * 更新成员弹窗
   */
  function updateMemberPopup(member) {
    if (!member.marker) return;
    const ago = member.timestamp ? Math.max(0, Math.round((Date.now() - member.timestamp) / 60000)) : '-';
    const popupHtml = `
      <div style="font-family:inherit;font-size:.85rem;min-width:140px">
        <div style="font-weight:700;color:${member.color};margin-bottom:4px">${member.name}</div>
        <div style="color:#8e8e93;font-size:.78rem;line-height:1.5">
          <div>最后更新 ${ago === 0 ? '刚刚' : ago + ' 分钟前'}</div>
          <div>电量 ${member.battery ?? '--'}%</div>
          <div>状态 ${member.status === 'normal' ? '正常' : member.status === 'deviation' ? '偏离路线' : 'SOS 求助'}</div>
        </div>
      </div>`;
    member.marker.setIcon(createMemberIcon(member.color, member.status));
    member.marker.bindPopup(popupHtml).openPopup();
    setTimeout(() => { if (member.marker) member.marker.closePopup(); }, 2500);
  }

  /**
   * 平移到指定位置
   */
  function panToLocation(lat, lon) {
    if (locationMap) {
      locationMap.panTo([lat, lon], { animate: true, duration: 0.6 });
    }
  }

  /**
   * 刷新位置共享地图尺寸
   */
  function invalidateLocationSize() {
    if (locationMap) {
      try { locationMap.invalidateSize(); } catch (e) {}
    }
  }

  /**
   * 销毁位置共享地图
   */
  function destroyLocationMap() {
    if (locationRouteLine) { try { locationMap.removeLayer(locationRouteLine); } catch (e) {} locationRouteLine = null; }
    if (locationMap) {
      try { locationMap.remove(); } catch (e) {}
      locationMap = null;
    }
  }

  // --- 几何工具 ---

  /**
   * 计算点到线段的最短距离（米），简化 haversine
   */
  function pointToSegmentDistance(lat, lon, a, b) {
    const R = 6371000;
    const toRad = d => d * Math.PI / 180;
    const lat1 = toRad(a[1]), lon1 = toRad(a[0]);
    const lat2 = toRad(b[1]), lon2 = toRad(b[0]);
    const lat3 = toRad(lat), lon3 = toRad(lon);
    const dLat = lat2 - lat1, dLon = lon2 - lon1;
    const dLat3 = lat3 - lat1, dLon3 = lon3 - lon1;
    const len2 = dLat * dLat + dLon * dLon;
    let t = len2 === 0 ? 0 : Math.max(0, Math.min(1, (dLat3 * dLat + dLon3 * dLon) / len2));
    const latP = lat1 + t * dLat;
    const lonP = lon1 + t * dLon;
    const dLatP = lat3 - latP, dLonP = lon3 - lonP;
    return R * Math.sqrt(dLatP * dLatP + dLonP * dLonP);
  }

  /**
   * 计算点到路线的距离
   */
  function distanceToRoute(lat, lon, routeGeoJson) {
    if (!routeGeoJson || !routeGeoJson.coordinates) return Infinity;
    const coords = routeGeoJson.coordinates;
    let min = Infinity;
    for (let i = 0; i < coords.length - 1; i++) {
      const d = pointToSegmentDistance(lat, lon, coords[i], coords[i + 1]);
      if (d < min) min = d;
    }
    return min;
  }

  return {
    // 路线地图
    initRouteMap,
    renderRoute,
    renderPOIs,
    clearRouteLayers,
    destroyRouteMap,
    invalidateRouteSize,
    getRouteMapState,
    isRouteMapReady,
    // 位置共享地图
    initLocationMap,
    drawPlannedRouteOnLocMap,
    updateMemberMarker,
    updateMemberPopup,
    panToLocation,
    invalidateLocationSize,
    destroyLocationMap,
    // 几何工具
    pointToSegmentDistance,
    distanceToRoute,
  };
})();

// 暴露到全局
window.MapController = MapController;
