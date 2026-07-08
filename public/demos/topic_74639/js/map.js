// ========== 地图模块 - 高德地图 ==========

let mapInstance = null;
let mapMarkers = [];
let mapFilter = 'all';

function renderMapPage() {
  // 确保容器可见后再初始化（否则地图宽高为0）
  setTimeout(function() {
    if (!mapInstance) {
      initMap();
    } else {
      refreshMapMarkers();
    }
  }, 50);
}

function initMap() {
  if (typeof AMap === 'undefined') {
    setTimeout(initMap, 200);
    return;
  }

  const mapContainer = document.getElementById('map');
  if (!mapContainer) return;

  // 确保容器有明确尺寸
  mapContainer.style.width = '100%';
  mapContainer.style.height = '100%';
  mapContainer.style.minHeight = '500px';

  try {
    mapInstance = new AMap.Map('map', {
      zoom: 5,
      center: [104.1954, 35.8617],
      viewMode: '2D',
      mapStyle: 'amap://styles/normal'
    });

    // 添加缩放工具条（通过 plugins 参数，兼容模式）
    AMap.plugin(['AMap.ToolBar', 'AMap.Scale'], function() {
      try {
        if (mapInstance && typeof AMap.ToolBar === 'function') {
          mapInstance.addControl(new AMap.ToolBar({
            position: 'RB'
          }));
        }
        if (mapInstance && typeof AMap.Scale === 'function') {
          mapInstance.addControl(new AMap.Scale());
        }
      } catch (e) {
        console.warn('地图控件加载失败:', e);
      }
    });

    // 地图加载完成后刷新
    mapInstance.on('complete', function() {
      refreshMapMarkers();
    });

    // 延迟刷新一次，确保容器尺寸正确
    setTimeout(function() {
      if (mapInstance) {
        try { mapInstance.resize(); } catch(e) {}
        refreshMapMarkers();
      }
    }, 300);
  } catch (e) {
    console.error('地图初始化失败:', e);
    mapContainer.innerHTML = `
      <div style="text-align:center;padding:80px 20px;color:#6b7280;">
        <i class="fa-solid fa-triangle-exclamation text-5xl mb-4"></i>
        <p class="text-lg font-semibold mb-2">地图加载失败</p>
        <p class="text-sm">请检查 API Key 是否正确，或稍后重试</p>
        <p class="text-xs mt-2" style="color:#ef4444;">${e.message || ''}</p>
      </div>
    `;
  }
}

function setMapFilter(filter) {
  mapFilter = filter;

  // 更新按钮样式
  document.querySelectorAll('.map-filter-btn').forEach(btn => {
    if (btn.dataset.filter === filter) {
      btn.classList.add('bg-reunion', 'text-white', 'shadow');
      btn.classList.remove('bg-white', 'text-gray-700');
    } else {
      btn.classList.remove('bg-reunion', 'text-white', 'shadow');
      btn.classList.add('bg-white', 'text-gray-700');
    }
  });

  // 刷新地图
  if (mapInstance) {
    refreshMapMarkers();
  }
}

function refreshMapMarkers() {
  if (!mapInstance) return;

  // 清除旧标记
  try {
    mapInstance.clearMap();
  } catch (e) {
    // 如果 clearMap 不可用，手动清除
    mapMarkers.forEach(m => {
      try { mapInstance.remove(m); } catch(e) {}
    });
  }
  mapMarkers = [];

  const allPersons = getAllPersons();
  let filtered = allPersons;

  if (mapFilter === 'missing') {
    filtered = allPersons.filter(p => p.status === 'missing');
  } else if (mapFilter === 'reunited') {
    filtered = allPersons.filter(p => p.status === 'reunited');
  }

  // 收集所有标记用于视野调整
  const markerList = [];

  // 添加标记
  filtered.forEach(person => {
    const isReunited = person.status === 'reunited';

    // 失踪地标记
    if (person.latitude && person.longitude) {
      const m = addMarker(person, isReunited, false);
      if (m) markerList.push(m);
    }

    // 已团聚的人，添加团聚地标记和连线
    if (isReunited && person.reunion && person.reunion.latitude && person.reunion.longitude) {
      const reunionMarker = addMarker(person, true, true);
      if (reunionMarker) markerList.push(reunionMarker);

      // 连线（仅当失踪地和团聚地不同时）
      if (person.latitude !== person.reunion.latitude || person.longitude !== person.reunion.longitude) {
        try {
          const polyline = new AMap.Polyline({
            path: [
              [person.longitude, person.latitude],
              [person.reunion.longitude, person.reunion.latitude]
            ],
            strokeColor: '#22c55e',
            strokeWeight: 3,
            strokeOpacity: 0.6,
            strokeStyle: 'dashed',
            strokeDasharray: [10, 10]
          });
          mapInstance.add(polyline);
          mapMarkers.push(polyline);
        } catch(e) {
          console.warn('连线绘制失败:', e);
        }
      }
    }
  });

  // 更新侧边栏
  renderMapSidebar(filtered);

  // 自动调整视野
  if (markerList.length > 0) {
    try {
      mapInstance.setFitView(markerList, false, [50, 50, 50, 50]);
    } catch(e) {}
  }
}

function addMarker(person, isReunited, isReunionLocation) {
  if (!mapInstance) return null;

  const lng = isReunionLocation ? person.reunion.longitude : person.longitude;
  const lat = isReunionLocation ? person.reunion.latitude : person.latitude;

  if (!lng || !lat) return null;

  // 标记颜色
  let markerColor = '#ef4444'; // 默认红色（寻找中）
  let borderColor = '#ffffff';
  if (isReunionLocation) {
    markerColor = '#22c55e';
    borderColor = '#fbbf24';
  } else if (isReunited) {
    markerColor = '#22c55e';
    borderColor = '#ffffff';
  }

  // 创建自定义标记内容
  const innerDot = (isReunited || isReunionLocation)
    ? '<div style="width:10px;height:10px;background:white;border-radius:50%;"></div>'
    : '';

  const markerContent = `
    <div style="width:28px;height:28px;background:${markerColor};border:3px solid ${borderColor};border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
      ${innerDot}
    </div>
  `;

  try {
    const marker = new AMap.Marker({
      position: [lng, lat],
      content: markerContent,
      offset: new AMap.Pixel(-14, -14)
    });

    // 信息窗体内容
    const statusLabel = isReunionLocation
      ? '<span style="display:inline-block;background:#dcfce7;color:#15803d;padding:2px 8px;border-radius:12px;font-size:12px;margin-bottom:6px;">团聚地</span>'
      : (isReunited
        ? '<span style="display:inline-block;background:#dcfce7;color:#15803d;padding:2px 8px;border-radius:12px;font-size:12px;margin-bottom:6px;">已团聚</span>'
        : '<span style="display:inline-block;background:#fee2e2;color:#b91c1c;padding:2px 8px;border-radius:12px;font-size:12px;margin-bottom:6px;">寻找中</span>');

    const photo = isReunionLocation
      ? (person.reunion.reunitedPhotos ? person.reunion.reunitedPhotos[0] : person.photos[0])
      : person.photos[0];

    const locationText = isReunionLocation
      ? person.reunion.location
      : person.missingLocation;

    const buttonText = isReunionLocation
      ? '<i class="fa-solid fa-heart" style="margin-right:4px;"></i>查看团聚故事'
      : '<i class="fa-solid fa-circle-info" style="margin-right:4px;"></i>查看详情';

    const personId = person.id;
    const escapedName = String(person.name).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const escapedLocation = String(locationText).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const infoContent = `
      <div style="width:240px;background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.15);">
        <img src="${photo || ''}" style="width:100%;height:110px;object-fit:cover;display:block;" />
        <div style="padding:12px;">
          ${statusLabel}
          <div style="font-weight:700;font-size:15px;color:#1f2937;margin-bottom:4px;">${escapedName}${isReunionLocation ? ' 回家了' : ''}</div>
          <div style="font-size:12px;color:#6b7280;margin-bottom:10px;">
            <i class="fa-solid fa-location-dot" style="margin-right:4px;"></i>${escapedLocation}
          </div>
          <button onclick="navigateTo('detail', '${personId}')" style="display:block;width:100%;padding:8px 12px;background:linear-gradient(to right,#22c55e,#16a34a);color:white;text-align:center;border-radius:8px;font-size:13px;font-weight:600;border:none;cursor:pointer;">
            ${buttonText}
          </button>
        </div>
      </div>
    `;

    const infoWindow = new AMap.InfoWindow({
      content: infoContent,
      offset: new AMap.Pixel(0, -30),
      closeWhenClickMap: true
    });

    marker.on('click', function() {
      infoWindow.open(mapInstance, [lng, lat]);
    });

    mapInstance.add(marker);
    mapMarkers.push(marker);
    return marker;
  } catch(e) {
    console.error('标记添加失败:', e);
    return null;
  }
}

function renderMapSidebar(persons) {
  const sidebarEl = document.getElementById('map-sidebar-list');
  if (!sidebarEl) return;

  if (persons.length === 0) {
    sidebarEl.innerHTML = `
      <div class="text-center py-8 text-gray-500">
        <i class="fa-solid fa-map-location-dot text-4xl mb-3 text-gray-300"></i>
        <p>暂无信息</p>
      </div>
    `;
    return;
  }

  sidebarEl.innerHTML = persons.map(p => {
    const isReunited = p.status === 'reunited';
    const escapedName = String(p.name).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const escapedLocation = String(p.missingLocation).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `
      <div class="sidebar-card" onclick="navigateTo('detail', '${p.id}')">
        <img src="${p.photos[0] || ''}" alt="${escapedName}" class="sidebar-card-img" onerror="this.onerror=null;this.src='data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 width=%2260%22 height=%2260%22%3E%3Crect fill=%22%23f3f4f6%22 width=%2260%22 height=%2260%22%2F%3E%3C%2Fsvg%3E';" />
        <div class="sidebar-card-info">
          <div class="sidebar-card-name">
            ${escapedName}
            <span class="inline-block ml-2 text-xs px-2 py-0.5 rounded-full ${isReunited ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
              ${isReunited ? '已团聚' : '寻找中'}
            </span>
          </div>
          <div class="sidebar-card-meta">
            <i class="fa-solid fa-location-dot mr-1"></i>${escapedLocation}
          </div>
          <div class="sidebar-card-meta text-gray-400">
            <i class="fa-solid fa-calendar mr-1"></i>${p.missingDate}
          </div>
        </div>
      </div>
    `;
  }).join('');
}
