// 爪印城市 - 地图首页
Router.register('home', () => {
  return `
    <div class="home-page">
      <div class="nav-header">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
          <span style="font-size:20px;font-weight:700;color:var(--primary);">🐾 爪印城市</span>
          <span class="city-switcher" id="city-switcher" style="font-size:11px;background:var(--bg);padding:4px 10px;border-radius:12px;cursor:pointer;display:inline-flex;align-items:center;gap:4px;">
            <span id="current-city">北京</span>
            <span style="font-size:10px;">▼</span>
          </span>
        </div>
        <div class="search-bar">
          <span class="search-icon">🔍</span>
          <input type="text" id="search-input" placeholder="搜索场所名称或商圈..." />
        </div>
      </div>
      <div class="filter-tags" id="filter-tags">
        <span class="filter-tag active" data-type="全部">全部</span>
        <span class="filter-tag" data-type="餐饮">🍽️ 餐饮</span>
        <span class="filter-tag" data-type="住宿">🏨 住宿</span>
        <span class="filter-tag" data-type="商场">🛍️ 商场</span>
        <span class="filter-tag" data-type="公园">🌳 公园</span>
        <span class="filter-tag filter-advanced" id="advanced-filter-btn">⚙️ 高级筛选</span>
      </div>
      <div class="map-container" id="home-map"></div>
      <!-- POI 搜索结果面板 -->
      <div class="poi-results-panel" id="poi-results-panel" style="display:none;">
        <div class="poi-results-header">
          <span class="poi-results-title" id="poi-results-title">搜索结果</span>
          <span class="poi-results-close" id="poi-results-close">✕</span>
        </div>
        <div class="poi-results-list" id="poi-results-list"></div>
      </div>
    </div>
    <!-- 城市选择弹窗 -->
    <div class="modal-overlay" id="city-modal-overlay" style="display:none;">
      <div class="modal-content" id="city-modal-content"></div>
    </div>
    <!-- 高级筛选抽屉 -->
    <div class="drawer-overlay" id="drawer-overlay"></div>
    <div class="drawer-panel" id="drawer-panel">
      <div class="drawer-handle"></div>
      <div class="drawer-header">
        <span class="drawer-title">高级筛选</span>
        <span class="drawer-reset" id="drawer-reset">重置</span>
      </div>
      <div class="drawer-body">
        <div class="drawer-section">
          <div class="drawer-section-title">宠物类型</div>
          <div class="option-group" data-filter="petType">
            <span class="option-chip" data-value="犬类">🐕 犬类友好</span>
            <span class="option-chip" data-value="猫类">🐱 猫类友好</span>
            <span class="option-chip" data-value="全品类">🐾 全品类友好</span>
          </div>
        </div>
        <div class="drawer-section">
          <div class="drawer-section-title">体型限制</div>
          <div class="option-group" data-filter="size">
            <span class="option-chip" data-value="小型">小型犬</span>
            <span class="option-chip" data-value="中型">中型犬</span>
            <span class="option-chip" data-value="大型">大型犬</span>
          </div>
        </div>
        <div class="drawer-section">
          <div class="drawer-section-title">配套设施</div>
          <div class="option-group" data-filter="facilities">
            <span class="option-chip" data-value="宠物水碗">💧 宠物水碗</span>
            <span class="option-chip" data-value="拾便袋">🪣 拾便袋</span>
            <span class="option-chip" data-value="宠物专区">🏠 宠物专区</span>
            <span class="option-chip" data-value="免费宠物零食">🍪 免费零食</span>
          </div>
        </div>
      </div>
      <div class="drawer-footer">
        <button class="btn btn-outline btn-block" id="drawer-cancel">取消</button>
        <button class="btn btn-primary btn-block" id="drawer-confirm">确认筛选</button>
      </div>
    </div>
  `;
});

// 首页初始化
let currentCity = '北京';
let allPlacesCache = [];

async function init_home() {
  // 加载场所数据
  const res = await api.getPlaces();
  allPlacesCache = res.data || [];
  const places = filterByCity(allPlacesCache, currentCity);

  // 初始化地图
  await initMap(places);

  // 城市切换
  document.getElementById('city-switcher').addEventListener('click', () => {
    openCityModal();
  });

  // 搜索实时过滤
  let searchTimer;
  let isPOISearchActive = false;

  document.getElementById('search-input').addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(async () => {
      const keyword = e.target.value.trim();
      if (keyword) {
        // 搜索本地场所数据
        const params = { city: currentCity, keyword: keyword };
        if (currentType && currentType !== '全部') params.type = currentType;

        const res = await api.getPlaces(params);
        const matchedPlaces = res.data || [];

        if (matchedPlaces.length > 0) {
          // 显示本地数据搜索结果
          showLocalSearchResults(keyword, matchedPlaces);
          MapManager.updatePlaces(matchedPlaces);
          isPOISearchActive = false;
        } else if (MapManager.isAMap) {
          // 本地无数据时，使用高德 POI 搜索作为补充
          isPOISearchActive = true;
          MapManager.search(keyword, (status, result) => {
            if (status === 'complete') {
              showSearchResults(keyword, result);
            }
          });
        } else {
          // 无结果
          showLocalSearchResults(keyword, []);
        }
      } else {
        // 清空搜索，恢复全部数据
        hideSearchResults();
        if (MapManager.isAMap) {
          MapManager.clearSearch();
          isPOISearchActive = false;
        }
        // 恢复当前城市的全部场所
        const places = filterByCity(allPlacesCache, currentCity);
        MapManager.updatePlaces(places);
      }
    }, 300);
  });

  // 搜索框回车确认
  document.getElementById('search-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  });

  // 搜索框聚焦时清除 placeholder
  document.getElementById('search-input').addEventListener('focus', () => {
    document.getElementById('search-input').placeholder = '';
  });

  document.getElementById('search-input').addEventListener('blur', () => {
    document.getElementById('search-input').placeholder = '搜索场所名称或商圈...';
  });

  // 快捷筛选标签
  let currentType = '全部';
  document.querySelectorAll('#filter-tags .filter-tag[data-type]').forEach(tag => {
    tag.addEventListener('click', () => {
      document.querySelectorAll('#filter-tags .filter-tag[data-type]').forEach(t => t.classList.remove('active'));
      tag.classList.add('active');
      currentType = tag.dataset.type;
      applyFilters();
    });
  });

  // 高级筛选
  let drawerFilters = { petType: null, size: null, facilities: [] };

  // 打开抽屉
  document.getElementById('advanced-filter-btn').addEventListener('click', () => {
    document.getElementById('drawer-overlay').classList.add('open');
    document.getElementById('drawer-panel').classList.add('open');
  });

  // 关闭抽屉
  const closeDrawer = () => {
    document.getElementById('drawer-overlay').classList.remove('open');
    document.getElementById('drawer-panel').classList.remove('open');
  };
  document.getElementById('drawer-overlay').addEventListener('click', closeDrawer);
  document.getElementById('drawer-cancel').addEventListener('click', closeDrawer);

  // 抽屉选项点击
  document.querySelectorAll('.option-group').forEach(group => {
    const filterKey = group.dataset.filter;
    group.querySelectorAll('.option-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        if (filterKey === 'facilities') {
          chip.classList.toggle('selected');
          const val = chip.dataset.value;
          const idx = drawerFilters.facilities.indexOf(val);
          if (idx > -1) drawerFilters.facilities.splice(idx, 1);
          else drawerFilters.facilities.push(val);
        } else {
          group.querySelectorAll('.option-chip').forEach(c => c.classList.remove('selected'));
          chip.classList.add('selected');
          drawerFilters[filterKey] = chip.dataset.value;
        }
      });
    });
  });

  // 重置
  document.getElementById('drawer-reset').addEventListener('click', () => {
    document.querySelectorAll('.option-chip').forEach(c => c.classList.remove('selected'));
    drawerFilters = { petType: null, size: null, facilities: [] };
  });

  // 确认筛选
  document.getElementById('drawer-confirm').addEventListener('click', async () => {
    closeDrawer();
    await applyFilters();
  });

  // 应用筛选
  async function applyFilters() {
    const keyword = document.getElementById('search-input').value.trim();
    const params = {};
    if (currentCity) params.city = currentCity;
    if (currentType && currentType !== '全部') params.type = currentType;
    if (keyword && !MapManager.isAMap) params.keyword = keyword;
    if (drawerFilters.petType) params.petType = drawerFilters.petType;
    if (drawerFilters.size) params.size = drawerFilters.size;
    if (drawerFilters.facilities.length > 0) params.facilities = drawerFilters.facilities.join(',');

    const res = await api.getPlaces(params);
    MapManager.updatePlaces(res.data || []);
  }

  // POI 搜索结果面板关闭
  document.getElementById('poi-results-close').addEventListener('click', () => {
    hideSearchResults();
    document.getElementById('search-input').value = '';
    if (MapManager.isAMap) {
      MapManager.clearSearch();
      isPOISearchActive = false;
    }
    applyFilters();
  });
}

// 城市切换
function filterByCity(places, city) {
  return places.filter(p => p.city === city);
}

async function openCityModal() {
  const res = await api.getCities();
  const cities = res.data || [];

  // 分组城市：有数据的城市和无数据的城市
  const citiesWithData = cities.filter(c => c.hasData);
  const citiesWithoutData = cities.filter(c => !c.hasData);

  // 热门城市（前10个）
  const hotCities = cities.slice(0, 10);

  document.getElementById('city-modal-overlay').style.display = 'flex';
  document.getElementById('city-modal-content').innerHTML = `
    <div class="city-modal-header">
      <span class="city-modal-title">选择城市</span>
      <span class="city-modal-close" onclick="closeCityModal()">✕</span>
    </div>
    <div class="city-search">
      <input type="text" id="city-search-input" placeholder="搜索城市..." oninput="filterCityList(this.value)">
    </div>
    <div class="city-list" id="city-list-container">
      <div class="city-section">
        <div class="city-section-title">🔥 热门城市</div>
        <div class="city-grid">
          ${hotCities.map(c => `
            <div class="city-grid-item ${c.name === currentCity ? 'active' : ''}" onclick="switchCity('${c.name}')">
              ${c.name}
              ${c.hasData ? `<span class="city-badge">${c.count}</span>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
      ${citiesWithData.length > 0 ? `
        <div class="city-section">
          <div class="city-section-title">📍 已收录场所</div>
          <div class="city-grid">
            ${citiesWithData.map(c => `
              <div class="city-grid-item ${c.name === currentCity ? 'active' : ''}" onclick="switchCity('${c.name}')">
                ${c.name}
                <span class="city-badge">${c.count}</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
      <div class="city-section">
        <div class="city-section-title">🗺️ 其他城市</div>
        <div class="city-grid" id="other-cities-grid">
          ${citiesWithoutData.slice(0, 20).map(c => `
            <div class="city-grid-item ${c.name === currentCity ? 'active' : ''}" onclick="switchCity('${c.name}')">
              ${c.name}
            </div>
          `).join('')}
        </div>
        ${citiesWithoutData.length > 20 ? `
          <div class="city-more" onclick="showAllCities()">展开全部 ${citiesWithoutData.length} 个城市</div>
        ` : ''}
      </div>
    </div>
  `;

  // 保存完整城市列表供搜索使用
  window.allCitiesList = cities;

  // 点击 overlay 背景（弹窗外部）关闭弹窗
  const overlay = document.getElementById('city-modal-overlay');
  overlay.onclick = (e) => {
    if (e.target === overlay) {
      closeCityModal();
    }
  };
}

function filterCityList(keyword) {
  const cities = window.allCitiesList || [];
  const container = document.getElementById('city-list-container');

  if (!keyword.trim()) {
    // 恢复默认显示
    openCityModal();
    return;
  }

  const filtered = cities.filter(c => c.name.toLowerCase().includes(keyword.toLowerCase()));

  container.innerHTML = `
    <div class="city-section">
      <div class="city-section-title">🔍 搜索结果 (${filtered.length}个)</div>
      <div class="city-grid">
        ${filtered.map(c => `
          <div class="city-grid-item ${c.name === currentCity ? 'active' : ''}" onclick="switchCity('${c.name}')">
            ${c.name}
            ${c.hasData ? `<span class="city-badge">${c.count}</span>` : ''}
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function showAllCities() {
  const cities = window.allCitiesList || [];
  const citiesWithoutData = cities.filter(c => !c.hasData);
  const grid = document.getElementById('other-cities-grid');

  grid.innerHTML = citiesWithoutData.map(c => `
    <div class="city-grid-item ${c.name === currentCity ? 'active' : ''}" onclick="switchCity('${c.name}')">
      ${c.name}
    </div>
  `).join('');

  // 隐藏"展开全部"按钮
  const moreBtn = document.querySelector('.city-more');
  if (moreBtn) moreBtn.style.display = 'none';
}

// 关闭城市选择弹窗
function closeCityModal() {
  const overlay = document.getElementById('city-modal-overlay');
  if (overlay) {
    overlay.style.display = 'none';
  }
}

async function switchCity(city) {
  currentCity = city;
  document.getElementById('current-city').textContent = city;
  closeCityModal();

  // 切换城市地图
  MapManager.setCity(city);

  // 更新地图标记
  const places = filterByCity(allPlacesCache, city);
  MapManager.updatePlaces(places);

  // 重置筛选标签
  document.querySelectorAll('#filter-tags .filter-tag[data-type]').forEach(t => t.classList.remove('active'));
  document.querySelector('#filter-tags .filter-tag[data-type="全部"]').classList.add('active');
  document.getElementById('search-input').value = '';

  // 清除搜索
  hideSearchResults();
  if (MapManager.isAMap) {
    MapManager.clearSearch();
  }
}

// 显示本地场所搜索结果面板
function showLocalSearchResults(keyword, places) {
  const panel = document.getElementById('poi-results-panel');
  const title = document.getElementById('poi-results-title');
  const list = document.getElementById('poi-results-list');

  if (!panel || !list) return;

  title.textContent = `搜索"${keyword}" (${places.length}个场所)`;

  // 场所类型标签颜色
  const typeClass = {
    '餐饮': 'tag-dining',
    '住宿': 'tag-hotel',
    '公共空间': 'tag-park',
    '商业': 'tag-shop'
  };

  // 场所类型图标
  const typeIcon = {
    '餐饮': '🍽️',
    '住宿': '🏨',
    '公共空间': '🌳',
    '商业': '🛍️'
  };

  if (places.length === 0) {
    list.innerHTML = `<div class="poi-results-empty">
      <div style="font-size:32px;margin-bottom:8px;">🔍</div>
      <div>未找到"${keyword}"相关场所</div>
    </div>`;
  } else {
    list.innerHTML = places.map((place, index) => `
      <div class="poi-result-item" onclick="goToPlaceDetail(${place.id})" data-index="${index}">
        <div class="poi-result-left">
          <div class="poi-result-name">${place.name}</div>
          <div class="poi-result-addr">📍 ${place.address || '地址未知'}</div>
          <div class="poi-result-meta">
            <span class="poi-result-rating">★ ${place.rating}</span>
            <span class="tag ${typeClass[place.type] || 'tag-dining'}">${typeIcon[place.type] || '🐾'} ${place.type}</span>
            <span style="color:var(--text-light);">${place.verifyCount}人验证</span>
          </div>
        </div>
        <div class="poi-result-arrow">›</div>
      </div>
    `).join('');
  }

  panel.style.display = 'flex';
  window.currentPOIResults = null; // 清除 POI 搜索结果
  window.currentLocalPlaces = places; // 保存本地场所结果
}

// 跳转到场所详情
function goToPlaceDetail(id) {
  Router.navigate('detail', { id });
}

// 显示 POI 搜索结果面板
function showSearchResults(keyword, result) {
  const panel = document.getElementById('poi-results-panel');
  const title = document.getElementById('poi-results-title');
  const list = document.getElementById('poi-results-list');

  if (!panel || !list) return;

  const pois = result.poiList?.pois || [];
  const count = result.poiList?.count || pois.length;

  title.textContent = `搜索"${keyword}" (${count}个结果)`;

  if (pois.length === 0) {
    list.innerHTML = `<div class="poi-results-empty">未找到相关结果</div>`;
  } else {
    list.innerHTML = pois.map((poi, index) => `
      <div class="poi-result-item" onclick="focusPOI(${index})" data-index="${index}">
        <div class="poi-result-left">
          <div class="poi-result-name">${poi.name}</div>
          <div class="poi-result-addr">📍 ${poi.address || '地址未知'}</div>
          ${poi.type ? `<div class="poi-result-type">${poi.type.split(';').slice(0, 3).join(' · ')}</div>` : ''}
        </div>
        <div class="poi-result-arrow">›</div>
      </div>
    `).join('');
  }

  panel.style.display = 'flex';

  // 保存搜索结果供 focusPOI 使用
  window.currentPOIResults = pois;
}

// 隐藏 POI 搜索结果面板
function hideSearchResults() {
  const panel = document.getElementById('poi-results-panel');
  if (panel) {
    panel.style.display = 'none';
  }
  window.currentPOIResults = null;
}

// 聚焦到搜索结果中的 POI
function focusPOI(index) {
  const pois = window.currentPOIResults;
  if (!pois || !pois[index]) return;

  const poi = pois[index];

  if (MapManager.isAMap && MapManager.currentMap) {
    // 定位到该 POI
    MapManager.currentMap.map.setCenter([poi.location.lng, poi.location.lat]);
    MapManager.currentMap.map.setZoom(16);
    // 显示信息窗口
    MapManager.currentMap.showSearchInfoWindow(poi);
  }

  // 高亮选中项
  document.querySelectorAll('.poi-result-item').forEach(el => el.classList.remove('active'));
  const target = document.querySelector(`.poi-result-item[data-index="${index}"]`);
  if (target) target.classList.add('active');
}

async function initMap(places) {
  await MapManager.init('home-map', places, (id) => {
    Router.navigate('detail', { id });
  }, { city: currentCity });
}