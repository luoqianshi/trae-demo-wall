/* ============================================================
   山西省主题党团日活动规划地图 - 主应用逻辑
   ============================================================ */

// ---------- 地址搜索工具（内置山西热门地址 + 高德 Geocoder 备选） ----------
const AddressSearch = {
    available: true,
    builtInAddresses: [
        { name: '太原火车站', district: '太原市迎泽区', coords: [112.569, 37.863] },
        { name: '太原武宿国际机场', district: '太原市小店区', coords: [112.629, 37.743] },
        { name: '太原南站', district: '太原市小店区', coords: [112.594, 37.790] },
        { name: '太原市政府', district: '太原市杏花岭区', coords: [112.549, 37.877] },
        { name: '太原市人民政府', district: '太原市杏花岭区', coords: [112.549, 37.877] },
        { name: '五一广场', district: '太原市迎泽区', coords: [112.560, 37.866] },
        { name: '迎泽大街', district: '太原市迎泽区', coords: [112.550, 37.869] },
        { name: '柳巷', district: '太原市迎泽区', coords: [112.558, 37.873] },
        { name: '长风商务区', district: '太原市万柏林区', coords: [112.528, 37.841] },
        { name: '大同火车站', district: '大同市平城区', coords: [113.299, 40.088] },
        { name: '大同云冈机场', district: '大同市云冈区', coords: [113.242, 40.056] },
        { name: '大同南站', district: '大同市平城区', coords: [113.317, 40.057] },
        { name: '阳泉北站', district: '阳泉市郊区', coords: [113.596, 37.912] },
        { name: '长治站', district: '长治市潞州区', coords: [113.113, 36.197] },
        { name: '晋城站', district: '晋城市城区', coords: [112.836, 35.505] },
        { name: '朔州站', district: '朔州市朔城区', coords: [112.439, 39.333] },
        { name: '晋中站', district: '晋中市榆次区', coords: [112.722, 37.691] },
        { name: '运城北高铁站', district: '运城市盐湖区', coords: [111.005, 35.059] },
        { name: '忻州站', district: '忻州市忻府区', coords: [112.742, 38.412] },
        { name: '临汾西站', district: '临汾市尧都区', coords: [111.479, 36.085] },
        { name: '吕梁站', district: '吕梁市离石区', coords: [111.148, 37.526] },
        { name: '山西省人民政府', district: '太原市小店区', coords: [112.553, 37.872] },
        { name: '山西博物院', district: '太原市万柏林区', coords: [112.525, 37.858] },
        { name: '太原理工大学', district: '太原市万柏林区', coords: [112.531, 37.855] },
        { name: '山西大学', district: '太原市小店区', coords: [112.594, 37.798] },
        { name: '太原迎泽宾馆', district: '太原市迎泽区', coords: [112.554, 37.867] },
        { name: '太原汽车站', district: '太原市迎泽区', coords: [112.566, 37.865] },
        { name: '建南汽车站', district: '太原市小店区', coords: [112.578, 37.844] },
        { name: '西客站', district: '太原市万柏林区', coords: [112.492, 37.862] },
        { name: '东客站', district: '太原市杏花岭区', coords: [112.588, 37.883] },
        { name: '晋阳湖公园', district: '太原市晋源区', coords: [112.513, 37.776] },
        { name: '晋祠公园', district: '太原市晋源区', coords: [112.445, 37.717] },
    ],

    search(keyword, callback) {
        if (!keyword || keyword.trim().length < 1) {
            callback([]);
            return;
        }
        const kw = keyword.trim().toLowerCase();
        const results = this.builtInAddresses
            .filter(addr => 
                addr.name.toLowerCase().includes(kw) || 
                addr.district.toLowerCase().includes(kw)
            )
            .slice(0, 10);
        setTimeout(() => callback(results), 100);
    }
};

// ---------- 工具函数：景点数据查询 ----------
const SpotsUtils = {
    getAllSpots() {
        const all = [];
        Object.keys(ShanxiRedSpots).forEach(region => {
            ShanxiRedSpots[region].forEach(spot => all.push({ ...spot, region }));
        });
        return all;
    },

    // Haversine 公式计算两点球面距离（米）
    calculateDistance(lng1, lat1, lng2, lat2) {
        const R = 6371000;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLng / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    },

    filterSpots(region, category, keyword) {
        let spots = region === 'all'
            ? this.getAllSpots()
            : (ShanxiRedSpots[region] || []).map(s => ({ ...s, region }));
        if (category !== 'all') spots = spots.filter(s => s.category === category);
        if (keyword) {
            const kw = keyword.trim().toLowerCase();
            spots = spots.filter(s =>
                s.name.toLowerCase().includes(kw) ||
                s.address.toLowerCase().includes(kw) ||
                (s.description && s.description.toLowerCase().includes(kw))
            );
        }
        return spots;
    }
};

// ---------- 地图工具（高德 JS API 2.0） ----------
const MapUtils = {
    map: null,
    markers: [],
    infoWindow: null,
    activeMarkerEl: null,

    initMap(containerId) {
        return new Promise((resolve, reject) => {
            try {
                if (typeof AMap === 'undefined') {
                    reject(new Error('高德地图 JS API 未加载，请检查网络'));
                    return;
                }
                const container = document.getElementById(containerId);
                if (!container) {
                    reject(new Error('地图容器不存在'));
                    return;
                }
                // 确保容器有尺寸
                const rect = container.getBoundingClientRect();
                if (rect.width === 0 || rect.height === 0) {
                    container.style.height = '500px';
                }

                this.map = new AMap.Map(containerId, {
                    zoom: 7,
                    center: [112.548, 37.870],
                    viewMode: '2D',
                    resizeEnable: true
                });
                this.infoWindow = new AMap.InfoWindow({ offset: new AMap.Pixel(0, -32) });

                this.map.on('complete', () => {
                    resolve(this.map);
                });
                // 超时兜底
                setTimeout(() => {
                    if (this.map) resolve(this.map);
                }, 3000);
            } catch (e) {
                reject(e);
            }
        });
    },

    addSpotMarkers(spots, onClick) {
        this.clearMarkers();
        spots.forEach(spot => {
            const cfg = categoryConfig[spot.category] || categoryConfig['museum'];
            const markerContent = document.createElement('div');
            markerContent.className = `custom-marker ${spot.category}`;
            markerContent.innerHTML = `<i class="fas ${cfg.icon}"></i>`;

            const marker = new AMap.Marker({
                position: spot.coordinates,
                title: spot.name,
                content: markerContent,
                offset: new AMap.Pixel(-18, -18),
                anchor: 'center'
            });

            marker.on('click', () => {
                this.setActiveMarker(markerContent);
                this.showInfoWindow(spot);
                if (onClick) onClick(spot);
            });

            this.markers.push(marker);
            this.map.add(marker);
        });
    },

    setActiveMarker(el) {
        if (this.activeMarkerEl) this.activeMarkerEl.classList.remove('active');
        if (el) { el.classList.add('active'); this.activeMarkerEl = el; }
    },

    clearMarkers() {
        if (this.markers.length > 0 && this.map) {
            this.map.remove(this.markers);
        }
        this.markers = [];
        this.activeMarkerEl = null;
    },

    showInfoWindow(spot) {
        const cfg = categoryConfig[spot.category] || {};
        const content = `
            <div style="padding:10px;min-width:220px;border-top:3px solid ${cfg.color || '#c41e3a'};">
                <h4 style="color:${cfg.color || '#c41e3a'};margin:0 0 6px;font-size:14px;">${spot.name}</h4>
                <p style="margin:0 0 4px;font-size:12px;color:#666;"><i class="fas fa-map-marker-alt" style="color:#e74c3c;"></i> ${spot.address}</p>
                <p style="margin:0;font-size:12px;color:#888;"><i class="far fa-clock"></i> ${spot.openingHours}</p>
            </div>`;
        this.infoWindow.setContent(content);
        this.infoWindow.open(this.map, spot.coordinates);
    },

    flyTo(coords, zoom = 14) {
        if (this.map) this.map.setZoomAndCenter(zoom, coords);
    },

    getMap() { return this.map; }
};

// ---------- 行程规划器 ----------
const RoutePlanner = {
    itinerary: { spots: [], days: 2, travelMode: 'driving' },

    addSpot(spot) {
        if (this.itinerary.spots.some(s => s.id === spot.id)) {
            return { success: false, message: '该景点已在行程中' };
        }
        this.itinerary.spots.push(spot);
        return { success: true };
    },

    removeSpot(spotId) {
        const idx = this.itinerary.spots.findIndex(s => s.id === spotId);
        if (idx > -1) { this.itinerary.spots.splice(idx, 1); return true; }
        return false;
    },

    getItinerary() { return this.itinerary; },
    setDays(days) { this.itinerary.days = parseInt(days); },
    setStartPoint(p) { this.itinerary.startPoint = p; },
    setTravelMode(m) { this.itinerary.travelMode = m; },
    clear() { this.itinerary.spots = []; },

    // 最近邻贪心优化路线（从出发地开始找最近景点）
    optimize() {
        const spots = [...this.itinerary.spots];
        if (spots.length < 2) return;
        const startCoords = this.getStartCoords();
        const optimized = [];
        const remaining = [...spots];
        let current = startCoords || spots[0].coordinates;
        // 若有出发地坐标，从出发地开始找最近；否则保留第一个景点为起点
        if (!startCoords) {
            optimized.push(remaining.shift());
        }
        while (remaining.length > 0) {
            let nearest = 0;
            let minDist = Infinity;
            remaining.forEach((s, i) => {
                const d = SpotsUtils.calculateDistance(current[0], current[1], s.coordinates[0], s.coordinates[1]);
                if (d < minDist) { minDist = d; nearest = i; }
            });
            current = remaining[nearest].coordinates;
            optimized.push(remaining.splice(nearest, 1)[0]);
        }
        this.itinerary.spots = optimized;
    },

    getTotalDistance() {
        let total = 0;
        const spots = this.itinerary.spots;
        // 出发地到首站
        const startCoordStr = document.getElementById('start-coords')?.value;
        if (startCoordStr && spots.length > 0) {
            const [slng, slat] = startCoordStr.split(',').map(Number);
            total += SpotsUtils.calculateDistance(slng, slat, spots[0].coordinates[0], spots[0].coordinates[1]);
        }
        // 景点间
        for (let i = 0; i < spots.length - 1; i++) {
            total += SpotsUtils.calculateDistance(
                spots[i].coordinates[0], spots[i].coordinates[1],
                spots[i + 1].coordinates[0], spots[i + 1].coordinates[1]
            );
        }
        return total;
    },

    getStartCoords() {
        const str = document.getElementById('start-coords')?.value;
        if (!str) return null;
        return str.split(',').map(Number);
    }
};

// ---------- 主应用类 ----------
class ShanxiRedMapApp {
    constructor() {
        this.currentSpot = null;
        this.filteredSpots = [];
        this.init();
    }

    async init() {
        // 5秒后强制隐藏加载动画，避免卡死
        const forceHide = setTimeout(() => {
            const loader = document.getElementById('initial-loading');
            if (loader && loader.style.display !== 'none') {
                loader.style.display = 'none';
                document.getElementById('app-container').style.display = 'flex';
            }
        }, 5000);

        try {
            document.getElementById('loading-text').textContent = '正在初始化地图...';
            // 先显示容器，确保地图容器有尺寸再初始化
            document.getElementById('app-container').style.display = 'flex';
            this.cacheUI();
            this.bindEvents();
            // 等待 DOM 渲染
            await new Promise(r => setTimeout(r, 100));

            // 检查 AMap 是否加载
            if (typeof AMap === 'undefined') {
                throw new Error('高德地图脚本未加载，请检查网络连接');
            }

            await MapUtils.initMap('map');
            this.loadSpots();

            clearTimeout(forceHide);
            document.getElementById('initial-loading').style.opacity = '0';
            setTimeout(() => {
                document.getElementById('initial-loading').style.display = 'none';
            }, 500);
        } catch (error) {
            console.error('地图初始化失败:', error);
            clearTimeout(forceHide);
            this.cacheUI();
            this.bindEvents();
            this.loadSpots();
            document.getElementById('initial-loading').style.display = 'none';
            document.getElementById('app-container').style.display = 'flex';
            // 在地图区域显示错误信息
            const mapDiv = document.getElementById('map');
            if (mapDiv) {
                mapDiv.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;flex-direction:column;color:#999;background:#f5f5f5;">
                    <i class="fas fa-exclamation-triangle" style="font-size:48px;color:#e74c3c;margin-bottom:16px;"></i>
                    <p style="font-size:16px;font-weight:bold;color:#333;margin-bottom:8px;">地图加载失败</p>
                    <p style="font-size:13px;color:#999;">${error.message}</p>
                    <p style="font-size:12px;color:#bbb;margin-top:8px;">景点列表和路线规划功能仍可正常使用</p>
                </div>`;
            }
            this.showToast('地图加载失败：' + error.message, 'error');
        }
    }

    cacheUI() {
        this.spotList = document.getElementById('spot-list');
        this.regionFilter = document.getElementById('region-filter');
        this.categoryFilter = document.getElementById('category-filter');
        this.searchInput = document.getElementById('search-input');
        this.customStartPoint = document.getElementById('custom-start-point');
        this.addressSuggestions = document.getElementById('address-suggestions');
        this.startCoords = document.getElementById('start-coords');
        this.travelModeSelect = document.getElementById('travel-mode');
        this.tripDaysSelect = document.getElementById('trip-days');
        this.routeStops = document.getElementById('route-stops');
        this.routeSummary = document.getElementById('route-summary');
        this.displayCount = document.getElementById('display-count');
        this.routeCount = document.getElementById('route-count');
    }

    bindEvents() {
        this.regionFilter.addEventListener('change', () => this.loadSpots());
        this.categoryFilter.addEventListener('change', () => this.loadSpots());
        this.searchInput.addEventListener('input', () => this.loadSpots());
        document.getElementById('search-btn').addEventListener('click', () => this.loadSpots());

        document.getElementById('add-to-route').addEventListener('click', () => this.handleAddToRoute());
        document.getElementById('close-detail').addEventListener('click', () => this.closeDetail());
        document.getElementById('route-planning-btn').addEventListener('click', () => this.showRoutePlanning());
        document.getElementById('start-navigation').addEventListener('click', () => this.handleNavigation());
        document.getElementById('clear-route').addEventListener('click', () => this.handleClearRoute());
        document.getElementById('optimize-route').addEventListener('click', () => this.handleOptimizeRoute());
        document.getElementById('generate-plan').addEventListener('click', () => this.handleGeneratePlan());
        document.getElementById('export-plan').addEventListener('click', () => this.handleExportPlan());

        // 出发地地址搜索
        this.customStartPoint.addEventListener('input', () => {
            this.startCoords.value = ''; // 清空坐标，需重新选择
            this.renderRouteSummary();
            this.handleAddressSearch(this.customStartPoint.value);
        });
        this.customStartPoint.addEventListener('focus', () => {
            if (this.customStartPoint.value.trim().length >= 1) {
                this.handleAddressSearch(this.customStartPoint.value);
            }
        });
        // 点击外部关闭下拉
        document.addEventListener('click', e => {
            if (!e.target.closest('.address-search-wrapper')) {
                this.addressSuggestions.classList.remove('show');
            }
        });
        this.tripDaysSelect.addEventListener('change', e => RoutePlanner.setDays(e.target.value));
        this.travelModeSelect.addEventListener('change', e => RoutePlanner.setTravelMode(e.target.value));

        document.getElementById('zoom-in').addEventListener('click', () => { if (MapUtils.getMap()) MapUtils.getMap().zoomIn(); });
        document.getElementById('zoom-out').addEventListener('click', () => { if (MapUtils.getMap()) MapUtils.getMap().zoomOut(); });
        document.getElementById('locate-btn').addEventListener('click', () => this.handleLocate());
        document.getElementById('reset-view').addEventListener('click', () => { if (MapUtils.getMap()) MapUtils.getMap().setZoomAndCenter(7, [112.548, 37.870]); });

        document.getElementById('close-route-modal').addEventListener('click', () => {
            document.getElementById('route-modal').classList.remove('show');
        });
        document.getElementById('route-modal').addEventListener('click', e => {
            if (e.target.id === 'route-modal') document.getElementById('route-modal').classList.remove('show');
        });

        document.getElementById('feedback-btn').addEventListener('click', () => {
            this.showToast('感谢您的反馈！联系电话：0351-8725058', 'info');
        });
    }

    loadSpots() {
        const region = this.regionFilter.value;
        const category = this.categoryFilter.value;
        const keyword = this.searchInput.value;
        this.filteredSpots = SpotsUtils.filterSpots(region, category, keyword);
        this.renderSpotList();
        MapUtils.addSpotMarkers(this.filteredSpots, spot => this.showSpotDetail(spot));
        this.displayCount.textContent = this.filteredSpots.length;
    }

    renderSpotList() {
        if (this.filteredSpots.length === 0) {
            this.spotList.innerHTML = '<div class="empty-state"><i class="fas fa-search"></i><p>暂无符合条件的景点</p></div>';
            return;
        }
        this.spotList.innerHTML = this.filteredSpots.map(spot => {
            const cfg = categoryConfig[spot.category] || {};
            const cityName = cityNames[spot.region] || spot.region;
            return `
                <div class="spot-item${this.currentSpot && this.currentSpot.id === spot.id ? ' active' : ''}" data-id="${spot.id}">
                    <div class="spot-icon ${spot.category}"><i class="fas ${cfg.icon}"></i></div>
                    <div class="spot-info">
                        <h4>${spot.name}</h4>
                        <p><i class="fas fa-map-marker-alt"></i> ${cityName} · <span class="rating">${'★'.repeat(Math.floor(spot.rating))}</span> ${spot.rating}</p>
                    </div>
                </div>`;
        }).join('');

        this.spotList.querySelectorAll('.spot-item').forEach(item => {
            item.addEventListener('click', () => {
                const spot = this.filteredSpots.find(s => s.id === item.dataset.id);
                if (spot) this.showSpotDetail(spot);
            });
        });
    }

    showSpotDetail(spot) {
        this.currentSpot = spot;
        document.getElementById('detail-title').textContent = spot.name;
        document.getElementById('detail-address').textContent = spot.address || '-';
        document.getElementById('detail-hours').textContent = spot.openingHours || '-';
        document.getElementById('detail-phone').textContent = spot.phone || '-';
        document.getElementById('detail-rating').innerHTML = `<span class="rating-stars">${'★'.repeat(Math.floor(spot.rating))}</span> ${spot.rating} <span style="color:#999;font-size:12px;">(${spot.reviewCount}条评价)</span>`;
        document.getElementById('detail-desc').textContent = spot.description || '-';

        // 详情图片用分类渐变占位
        const cfg = categoryConfig[spot.category] || {};
        const detailImage = document.getElementById('detail-image');
        detailImage.style.background = cfg.gradient || 'linear-gradient(135deg, #c41e3a, #8b0000)';
        detailImage.innerHTML = `<div class="placeholder-text"><i class="fas ${cfg.icon}" style="font-size:48px;"></i><span>${cfg.label || ''}</span></div>`;

        if (spot.coordinates) MapUtils.flyTo(spot.coordinates, 14);
        this.renderSpotList();
        this.switchTab('detail');
        if (window.innerWidth <= 768) document.getElementById('right-panel').classList.add('show');
    }

    closeDetail() {
        this.currentSpot = null;
        document.getElementById('detail-title').textContent = '选择景点查看详情';
        ['detail-address', 'detail-hours', 'detail-phone', 'detail-desc'].forEach(id => {
            document.getElementById(id).textContent = '-';
        });
        document.getElementById('detail-rating').textContent = '-';
        document.getElementById('detail-image').innerHTML = '<div class="placeholder-text"><i class="fas fa-image"></i><span>暂无图片</span></div>';
        this.renderSpotList();
        if (window.innerWidth <= 768) {
            document.getElementById('right-panel').classList.remove('show');
        } else {
            this.switchTab('route');
        }
    }

    showRoutePlanning() {
        this.switchTab('route');
        if (window.innerWidth <= 768) document.getElementById('right-panel').classList.add('show');
    }

    switchTab(tab) {
        const detailTab = document.getElementById('spot-detail-tab');
        const routeTab = document.getElementById('route-plan-tab');
        if (tab === 'route') {
            detailTab.classList.remove('active');
            routeTab.classList.add('active');
        } else {
            detailTab.classList.add('active');
            routeTab.classList.remove('active');
        }
    }

    handleAddToRoute() {
        if (!this.currentSpot) return;
        const result = RoutePlanner.addSpot(this.currentSpot);
        if (result.success) {
            this.showToast('已添加到行程', 'success');
            this.renderRouteStops();
            this.renderRouteSummary();
            this.routeCount.textContent = RoutePlanner.getItinerary().spots.length;
        } else {
            this.showToast(result.message, 'warning');
        }
    }

    handleNavigation() {
        if (!this.currentSpot || !this.currentSpot.coordinates) {
            this.showToast('无法获取景点位置信息', 'warning');
            return;
        }
        const [lng, lat] = this.currentSpot.coordinates;
        const name = encodeURIComponent(this.currentSpot.name);
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile) {
            window.location.href = `androidamap://route?sourceApplication=山西红色旅游地图&dlat=${lat}&dlon=${lng}&dname=${name}&dev=0&m=0&t=1`;
            setTimeout(() => window.open(`https://uri.amap.com/marker?position=${lng},${lat}&name=${name}`, '_blank'), 2000);
        } else {
            window.open(`https://www.amap.com/search?query=${name}&city=山西`, '_blank');
        }
        this.showToast('正在打开高德地图...', 'info');
    }

    handleClearRoute() {
        RoutePlanner.clear();
        this.renderRouteStops();
        this.renderRouteSummary();
        this.routeCount.textContent = '0';
        this.showToast('行程已清空', 'success');
    }

    handleOptimizeRoute() {
        const spots = RoutePlanner.getItinerary().spots;
        if (spots.length < 2) {
            this.showToast('至少需要2个景点才能优化', 'warning');
            return;
        }
        RoutePlanner.optimize();
        this.renderRouteStops();
        this.renderRouteSummary();
        this.showToast('路线已优化为最短路径', 'success');
    }

    handleLocate() {
        if (!navigator.geolocation) {
            this.showToast('浏览器不支持定位功能', 'warning');
            return;
        }
        if (!MapUtils.getMap()) {
            this.showToast('地图未加载，无法定位', 'warning');
            return;
        }
        this.showLoading();
        navigator.geolocation.getCurrentPosition(
            pos => {
                this.hideLoading();
                MapUtils.getMap().setZoomAndCenter(15, [pos.coords.longitude, pos.coords.latitude]);
                this.showToast('已定位到当前位置', 'success');
            },
            () => {
                this.hideLoading();
                this.showToast('定位失败，请检查权限设置', 'error');
            },
            { timeout: 8000 }
        );
    }

    // 出发地地址搜索
    handleAddressSearch(keyword) {
        const suggestionsEl = this.addressSuggestions;
        if (!keyword || keyword.trim().length < 1) {
            suggestionsEl.classList.remove('show');
            return;
        }
        suggestionsEl.innerHTML = '<div class="suggestion-loading"><i class="fas fa-spinner fa-spin"></i>搜索中...</div>';
        suggestionsEl.classList.add('show');

        AddressSearch.search(keyword, results => {
            if (results.length === 0) {
                suggestionsEl.innerHTML = '<div class="suggestion-loading">未找到相关地址</div>';
                return;
            }
            suggestionsEl.innerHTML = results.map((r, i) => `
                <div class="suggestion-item" data-index="${i}">
                    <span class="sug-name">${r.name}</span>
                    <span class="sug-addr">${r.district || ''}</span>
                </div>`).join('');

            // 缓存结果
            this._addressResults = results;

            // 绑定点击
            suggestionsEl.querySelectorAll('.suggestion-item').forEach(item => {
                item.addEventListener('click', () => {
                    const idx = parseInt(item.dataset.index);
                    const selected = this._addressResults[idx];
                    this.customStartPoint.value = selected.name;
                    this.startCoords.value = selected.coords.join(',');
                    suggestionsEl.classList.remove('show');
                    this.renderRouteSummary();
                    this.showToast('已设置出发地：' + selected.name, 'success');
                });
            });
        });
    }

    handleGeneratePlan() {
        const itinerary = RoutePlanner.getItinerary();
        if (itinerary.spots.length === 0) {
            this.showToast('请先添加景点到行程', 'warning');
            return;
        }
        const days = itinerary.days;
        const spotsPerDay = Math.ceil(itinerary.spots.length / days);

        // 出发地：读取自定义输入框
        const customAddr = this.customStartPoint.value.trim();
        const startCoords = this.startCoords.value;
        const hasStartCoords = !!startCoords;

        let html = '<div class="generated-plan"><h4>行程方案</h4>';

        // 距离计算
        let firstDist = 0;
        let interSpotDist = 0;
        const totalDist = RoutePlanner.getTotalDistance();
        for (let i = 0; i < itinerary.spots.length - 1; i++) {
            interSpotDist += SpotsUtils.calculateDistance(
                itinerary.spots[i].coordinates[0], itinerary.spots[i].coordinates[1],
                itinerary.spots[i + 1].coordinates[0], itinerary.spots[i + 1].coordinates[1]
            );
        }
        if (hasStartCoords) {
            const [slng, slat] = startCoords.split(',').map(Number);
            firstDist = SpotsUtils.calculateDistance(slng, slat, itinerary.spots[0].coordinates[0], itinerary.spots[0].coordinates[1]);
        }

        html += `<div class="plan-distance">
            <div class="dist-row"><span>出发地</span><strong>${customAddr || '未设置'}</strong></div>
            ${hasStartCoords ? `<div class="dist-row"><span>出发地 → 首站</span><span>约 ${(firstDist / 1000).toFixed(1)} 公里</span></div>` : ''}
            <div class="dist-row"><span>景点间距离</span><span>约 ${(interSpotDist / 1000).toFixed(1)} 公里</span></div>
            <div class="dist-row dist-total"><span>全程总距离</span><strong>约 ${(totalDist / 1000).toFixed(1)} 公里</strong></div>
        </div>`;
        if (!customAddr) {
            html += '<p style="margin:5px 0;color:#888;font-size:13px;">提示：请在出发地搜索框中选择地址，以计算完整路线距离</p>';
        } else if (!hasStartCoords) {
            html += '<p style="margin:5px 0;color:#888;font-size:13px;">提示：请从下拉建议中选择地址，以获取精确坐标计算距离</p>';
        }

        for (let day = 1; day <= days; day++) {
            const start = (day - 1) * spotsPerDay;
            const end = Math.min(start + spotsPerDay, itinerary.spots.length);
            const daySpots = itinerary.spots.slice(start, end);
            if (daySpots.length > 0) {
                html += `<div class="plan-day"><h5>第${day}天</h5><ol>`;
                daySpots.forEach((s, i) => {
                    const city = cityNames[s.region] || s.region;
                    html += `<li><strong>${s.name}</strong><br><span style="font-size:12px;color:#888;">${city} · ${s.address}</span></li>`;
                });
                html += '</ol></div>';
            }
        }
        html += '</div>';

        document.getElementById('route-modal-body').innerHTML = html;
        document.getElementById('route-modal').classList.add('show');
    }

    handleExportPlan() {
        const itinerary = RoutePlanner.getItinerary();
        if (itinerary.spots.length === 0) {
            this.showToast('请先添加景点到行程', 'warning');
            return;
        }
        const days = itinerary.days;
        const spotsPerDay = Math.ceil(itinerary.spots.length / days);
        const totalDist = RoutePlanner.getTotalDistance();
        const startPointName = this.customStartPoint.value.trim() || '未设置出发地';

        const modeMap = { driving: '驾车', walking: '步行', transit: '公共交通' };
        let content = '═══════════════════════════════════\n';
        content += '    山西省主题党团日活动行程规划\n';
        content += '═══════════════════════════════════\n\n';
        content += `出发地：${startPointName}\n`;
        content += `出行方式：${modeMap[itinerary.travelMode] || '驾车'}\n`;
        content += `行程天数：${days} 天\n`;
        content += `景点数量：${itinerary.spots.length} 个\n`;
        if (totalDist > 0) content += `全程距离：约 ${(totalDist / 1000).toFixed(1)} 公里\n`;
        content += `\n───────────────────────────────────\n行程安排\n───────────────────────────────────\n`;

        for (let day = 1; day <= days; day++) {
            const start = (day - 1) * spotsPerDay;
            const end = Math.min(start + spotsPerDay, itinerary.spots.length);
            const daySpots = itinerary.spots.slice(start, end);
            if (daySpots.length > 0) {
                content += `\n【第${day}天】\n`;
                daySpots.forEach((s, i) => {
                    const city = cityNames[s.region] || s.region;
                    content += `  ${i + 1}. ${s.name}（${city}）\n`;
                    content += `     地址：${s.address}\n`;
                    content += `     电话：${s.phone}\n`;
                    content += `     开放：${s.openingHours}\n`;
                });
            }
        }
        content += '\n═══════════════════════════════════\n';
        content += '祝您活动顺利！\n';

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = '山西红色旅游行程规划.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.showToast('行程已导出', 'success');
    }

    renderRouteStops() {
        const spots = RoutePlanner.getItinerary().spots;
        if (spots.length === 0) {
            this.routeStops.innerHTML = '<div class="empty-state"><i class="fas fa-route"></i><p>暂无行程站点，请添加景点</p></div>';
            return;
        }
        this.routeStops.innerHTML = spots.map((spot, index) => {
            const cityName = cityNames[spot.region] || spot.region;
            return `
                <div class="route-stop-item" data-id="${spot.id}">
                    <div class="route-stop-number">${index + 1}</div>
                    <div class="route-stop-info">
                        <h4>${spot.name}</h4>
                        <p><i class="fas fa-map-marker-alt"></i> ${cityName}</p>
                    </div>
                    <button class="route-stop-remove" data-id="${spot.id}"><i class="fas fa-times"></i></button>
                </div>`;
        }).join('');

        this.routeStops.querySelectorAll('.route-stop-remove').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                RoutePlanner.removeSpot(btn.dataset.id);
                this.renderRouteStops();
                this.renderRouteSummary();
                this.routeCount.textContent = RoutePlanner.getItinerary().spots.length;
                this.showToast('已从行程中移除', 'info');
            });
        });
    }

    renderRouteSummary() {
        const itinerary = RoutePlanner.getItinerary();
        if (itinerary.spots.length === 0) {
            this.routeSummary.innerHTML = '';
            return;
        }
        const dist = RoutePlanner.getTotalDistance();
        const distKm = dist > 0 ? (dist / 1000).toFixed(1) : '—';
        this.routeSummary.innerHTML = `
            <div class="summary-row"><span>景点数量</span><strong>${itinerary.spots.length} 个</strong></div>
            <div class="summary-row"><span>预计距离</span><strong>${distKm} 公里</strong></div>
            <div class="summary-row"><span>行程天数</span><strong>${itinerary.days} 天</strong></div>`;
    }

    showLoading() { document.getElementById('loading').classList.add('show'); }
    hideLoading() { document.getElementById('loading').classList.remove('show'); }

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        const icons = { success: 'check-circle', error: 'times-circle', warning: 'exclamation-triangle', info: 'info-circle' };
        toast.innerHTML = `<i class="fas fa-${icons[type] || 'info-circle'}"></i><span>${message}</span>`;
        container.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// ---------- 启动 ----------
window.onload = () => {
    window.app = new ShanxiRedMapApp();
};
