/**
 * 首页 - 地图展示与问题上报入口
 * 展示周边无障碍设施问题点位，提供拍照上报入口
 */
(function (global) {
    const LJ = global.LJ || (global.LJ = {})
    LJ.mobile = LJ.mobile || {}
    LJ.mobile.pages = LJ.mobile.pages || {}

    let mapInstance = null
    let markers = []
    let currentLocationMarker = null
    let currentFilter = ''
    let currentLocation = { latitude: 39.908823, longitude: 116.397470 }

    /**
     * 渲染页面 HTML
     */
    function render() {
        return `
      <div class="page" style="padding-bottom: 0;">
        <div class="home-location">
          <div class="loc-text">📍 <span id="locText" aria-live="polite">定位中…</span></div>
          <button type="button" class="loc-relocate" id="relocateBtn" aria-label="重新定位">重新定位</button>
        </div>
        <div class="home-map">
          <div id="amapContainer" role="img" aria-label="问题分布地图"></div>
        </div>
        <div class="home-section-title">
          <h3>附近问题</h3>
          <button type="button" class="filter-btn" id="filterBtn" aria-label="筛选问题">筛选 ▼</button>
        </div>
        <div class="home-report-list" id="reportList" aria-live="polite">
          <div class="page-loading"><div class="loading-spinner" role="img" aria-label="加载中"></div><p>加载中…</p></div>
        </div>
      </div>
      <button type="button" class="fab-report" id="fabReport" aria-label="新增问题上报">+</button>
    `
    }

    /**
     * 页面挂载
     */
    async function onMount(container, params) {
        // 初始化地图
        initMap()

        // 将 fab 按钮移到 phone-shell 下，实现固定定位
        const fab = container.querySelector('#fabReport')
        if (fab) {
            document.querySelector('.phone-shell').appendChild(fab)
        }

        // 自动定位并加载（有缓存则用缓存，无缓存才定位）
        getLocationAndLoad(container)

        // 重新定位（强制刷新，忽略缓存）
        container.querySelector('#relocateBtn').addEventListener('click', () => {
            container.querySelector('#locText').textContent = '定位中…'
            getLocationAndLoad(container, true)
        })

        // 筛选按钮
        container.querySelector('#filterBtn').addEventListener('click', () => {
            showFilterSheet(container)
        })

        // 上报按钮
        const fabBtn = document.querySelector('.phone-shell > .fab-report')
        if (fabBtn) {
            fabBtn.addEventListener('click', () => {
                LJ.mobile.navigate('/report')
            })
        }

        // 列表点击事件委托
        container.querySelector('#reportList').addEventListener('click', (e) => {
            const item = e.target.closest('.report-item')
            if (item) {
                LJ.mobile.navigate('/report-detail', { id: item.dataset.id })
            }
        })
    }

    /**
     * 初始化高德地图
     */
    function initMap() {
        if (typeof AMap === 'undefined') {
            console.warn('高德地图 SDK 未加载')
            return
        }
        const { AMAP_CONFIG } = LJ.constants
        mapInstance = new AMap.Map('amapContainer', {
            zoom: AMAP_CONFIG.zoom,
            center: AMAP_CONFIG.center,
            mapStyle: 'amap://styles/whitesmoke'
        })
    }

    /**
     * 获取定位并加载
     * 优先读取本地缓存（同一设备仅首次定位），无缓存时才发起定位
     * @param {HTMLElement} container - 页面容器
     * @param {boolean} forceRefresh - 是否强制刷新（忽略缓存）
     */
    function getLocationAndLoad(container, forceRefresh = false) {
        // 非强制刷新时，先尝试读取缓存
        if (!forceRefresh) {
            const cached = LJ.utils.getStorage(LJ.constants.STORAGE_KEYS.locationCache, null)
            if (cached && cached.latitude && cached.longitude) {
                console.log('[定位] 使用缓存位置：', cached)
                currentLocation = {
                    latitude: cached.latitude,
                    longitude: cached.longitude
                }
                // 更新位置文本（优先用缓存的地址，无地址时重新逆地理编码）
                if (cached.address) {
                    const el = container.querySelector('#locText')
                    if (el) el.textContent = cached.address
                } else {
                    updateLocationText(container)
                }
                if (mapInstance) {
                    mapInstance.setCenter([currentLocation.longitude, currentLocation.latitude])
                }
                updateCurrentLocationMarker()
                loadNearbyReports()
                return
            }
        }

        console.log('[定位] 无缓存或强制刷新，开始定位...')
        // 优先使用高德 Geolocation 插件，自动返回 GCJ02 坐标
        if (typeof AMap !== 'undefined' && AMap.Geolocation) {
            console.log('[定位] 使用高德 Geolocation 插件')
            const geolocation = new AMap.Geolocation({
                enableHighAccuracy: true,
                timeout: 10000,
                GeoLocationFirst: true
            })
            geolocation.getCurrentPosition((status, result) => {
                if (status === 'complete') {
                    console.log('[定位] 高德定位成功：', result.position)
                    currentLocation = {
                        latitude: result.position.lat,
                        longitude: result.position.lng
                    }
                    saveLocationCache()
                    updateLocationText(container)
                    if (mapInstance) {
                        mapInstance.setCenter([currentLocation.longitude, currentLocation.latitude])
                    }
                    updateCurrentLocationMarker()
                    loadNearbyReports()
                } else {
                    console.warn('[定位] 高德定位失败，回退浏览器定位：', result)
                    locateByBrowser(container)
                }
            })
        } else {
            console.log('[定位] 高德插件未就绪，使用浏览器定位')
            locateByBrowser(container)
        }
    }

    /**
     * 保存定位信息到 localStorage 缓存
     * @param {string} [address] - 逆地理编码得到的地址（可选）
     */
    function saveLocationCache(address) {
        const cacheData = {
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            address: address || '',
            timestamp: Date.now()
        }
        LJ.utils.setStorage(LJ.constants.STORAGE_KEYS.locationCache, cacheData)
    }

    /**
     * 在地图上添加/更新当前位置定位标志
     * 使用蓝色定位点样式，与工单标记点（彩色圆点）区分
     */
    function updateCurrentLocationMarker() {
        if (!mapInstance || typeof AMap === 'undefined') return
        // 移除旧的位置标记
        if (currentLocationMarker) {
            mapInstance.remove(currentLocationMarker)
            currentLocationMarker = null
        }
        // 创建当前位置标记（蓝色定位点 + 外圈光晕）
        currentLocationMarker = new AMap.Marker({
            position: [currentLocation.longitude, currentLocation.latitude],
            content: `<div style="position:relative;width:24px;height:24px;">
                <div style="position:absolute;top:4px;left:4px;width:16px;height:16px;background:#3B82F6;border:2px solid #fff;border-radius:50%;box-shadow:0 0 8px rgba(59,130,246,0.6);"></div>
                <div style="position:absolute;top:0;left:0;width:24px;height:24px;background:rgba(59,130,246,0.2);border-radius:50%;"></div>
            </div>`,
            offset: new AMap.Pixel(-12, -12),
            zIndex: 200
        })
        mapInstance.add(currentLocationMarker)
    }

    /**
     * 浏览器原生定位（WGS84），需转换为 GCJ02
     */
    function locateByBrowser(container) {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    console.log('[定位] 浏览器定位成功（WGS84）：', pos.coords.latitude, pos.coords.longitude)
                    // WGS84 转 GCJ02
                    const gcj02 = LJ.utils.wgs84ToGcj02(pos.coords.longitude, pos.coords.latitude)
                    console.log('[定位] 转换为 GCJ02：', gcj02)
                    currentLocation = { latitude: gcj02.latitude, longitude: gcj02.longitude }
                    saveLocationCache()
                    updateLocationText(container)
                    if (mapInstance) {
                        mapInstance.setCenter([currentLocation.longitude, currentLocation.latitude])
                    }
                    updateCurrentLocationMarker()
                    loadNearbyReports()
                },
                (err) => {
                    console.warn('[定位] 浏览器定位失败：', err.message, '（可能非 HTTPS 环境）')
                    // 定位失败用默认位置（北京天安门，已是 GCJ02），不写入缓存
                    currentLocation = { latitude: 39.908823, longitude: 116.397470 }
                    updateLocationText(container)
                    loadNearbyReports()
                    LJ.mobile.showToast('定位失败，使用默认位置')
                }
            )
        } else {
            console.warn('[定位] 浏览器不支持定位')
            // 不支持定位，使用默认位置，不写入缓存
            currentLocation = { latitude: 39.908823, longitude: 116.397470 }
            updateLocationText(container)
            loadNearbyReports()
        }
    }

    /**
     * 更新位置文字（使用逆地理编码 REST API 获取道路名称）
     * 直接调用高德 Web服务 REST API，避免 JS SDK 插件的平台限制
     */
    function updateLocationText(container) {
        const el = container.querySelector('#locText')
        if (!el) return
        el.textContent = '解析地址中…'

        console.log('[逆地理] 开始解析：', currentLocation.longitude, currentLocation.latitude)
        // 高德逆地理编码 REST API（Web服务），与 key 平台匹配
        const url = `https://restapi.amap.com/v3/geocode/regeo?key=a47b35619b3fd91ba3c61ee001ccf472&location=${currentLocation.longitude},${currentLocation.latitude}&extensions=all&radius=1000`

        fetch(url)
            .then((res) => res.json())
            .then((data) => {
                console.log('[逆地理] REST API 返回：', data)
                if (data.status === '1' && data.regeocode) {
                    const regeocode = data.regeocode
                    const addr = regeocode.formatted_address || ''
                    const comp = regeocode.addressComponent || {}
                    // 高德 REST API 中 road/neighborhood 可能是空数组 []，需判断是否为非空字符串
                    const road = Array.isArray(comp.road) ? '' : (comp.road || '')
                    const neighborhood = Array.isArray(comp.neighborhood) ? '' : (comp.neighborhood || '')
                    // roads 数组优先（包含附近道路信息）
                    const roads = regeocode.roads || []
                    const firstRoad = roads.length > 0 ? (roads[0].name || '') : ''
                    // pois 数组（附近兴趣点）
                    const pois = regeocode.pois || []
                    const firstPoi = pois.length > 0 ? (pois[0].name || '') : ''

                    // 优先级：道路名 > 附近道路 > 附近 POI > 社区 > 格式化地址
                    let resolvedAddress = ''
                    if (road) {
                        console.log('[逆地理] 命中道路：', road)
                        el.textContent = road
                        resolvedAddress = road
                    } else if (firstRoad) {
                        console.log('[逆地理] 命中附近道路：', firstRoad)
                        el.textContent = firstRoad
                        resolvedAddress = firstRoad
                    } else if (firstPoi) {
                        console.log('[逆地理] 命中附近 POI：', firstPoi)
                        el.textContent = firstPoi
                        resolvedAddress = firstPoi
                    } else if (neighborhood) {
                        console.log('[逆地理] 命中社区：', neighborhood)
                        el.textContent = neighborhood
                        resolvedAddress = neighborhood
                    } else if (addr) {
                        console.log('[逆地理] 使用格式化地址：', addr)
                        // 去掉省市前缀，显示简洁地址
                        const simpleAddr = addr.replace(/^.*?省/, '').replace(/^.*?市/, '') || addr
                        el.textContent = simpleAddr
                        resolvedAddress = simpleAddr
                    } else {
                        el.textContent = '位置未知'
                    }
                    // 把解析出的地址回写到缓存，下次直接用
                    if (resolvedAddress) {
                        saveLocationCache(resolvedAddress)
                    }
                } else {
                    console.warn('[逆地理] REST API 失败：', data.status, data.info)
                    el.textContent = `${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}`
                }
            })
            .catch((err) => {
                console.warn('[逆地理] 请求异常：', err)
                el.textContent = `${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}`
            })
    }

    /**
     * 加载附近问题列表
     */
    async function loadNearbyReports() {
        const listEl = document.getElementById('reportList')
        if (!listEl) return

        try {
            const res = await LJ.mockApi.getNearbyReports({
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
                radius: 5000,
                page: 1
            })

            if (res.code !== 0) {
                listEl.innerHTML = '<div class="empty-state"><div class="empty-icon" aria-hidden="true">⚠️</div><p>加载失败</p></div>'
                return
            }

            let list = res.data.list
            if (currentFilter) {
                list = list.filter((r) => r.status === currentFilter)
            }

            renderReportList(list)
            updateMapMarkers(list)
        } catch (err) {
            console.error('加载附近问题失败：', err)
            listEl.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><p>加载失败</p></div>'
        }
    }

    /**
     * 渲染问题列表
     */
    function renderReportList(list) {
        const listEl = document.getElementById('reportList')
        if (!listEl) return

        if (list.length === 0) {
            listEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon" aria-hidden="true">📋</div>
          <p>附近暂无问题上报</p>
          <p style="margin-top:8px;font-size:13px;">点击右下角按钮上报问题</p>
        </div>
      `
            return
        }

        listEl.innerHTML = list.map((item) => {
            const status = LJ.utils.getStatusInfo(item.status)
            return `
        <button type="button" class="report-item" data-id="${item._id}" aria-label="查看问题：${LJ.utils.escapeHtml(item.title)}">
          <div class="report-item-header">
            <div class="report-item-title">${LJ.utils.escapeHtml(item.title)}</div>
            <span class="status-tag" style="color:${status.color};background:${status.bgColor};">${status.name}</span>
          </div>
          <div class="report-item-meta">
            <span>📍 ${LJ.utils.escapeHtml(item.location.address)}</span>
            <span class="report-item-distance">${LJ.utils.formatDistance(item.distance)}</span>
          </div>
          <div class="report-item-desc">${LJ.utils.escapeHtml(item.description)}</div>
          <div class="report-item-meta" style="margin-top:6px;">
            <span>🕐 ${item.createTime}</span>
            <span>👤 ${LJ.utils.escapeHtml(item.reporterName)}</span>
          </div>
        </button>
      `
        }).join('')
    }

    /**
     * 更新地图标记点
     */
    function updateMapMarkers(list) {
        if (!mapInstance || typeof AMap === 'undefined') return

        // 清除旧标记
        markers.forEach((m) => mapInstance.remove(m))
        markers = []

        const statusColorMap = {
            pending: '#78716C',
            approved: '#E8792B',
            processing: '#D97706',
            fixed: '#0D9488',
            verified: '#16A34A',
            rejected: '#DC2626'
        }

        list.forEach((item) => {
            const color = statusColorMap[item.status] || '#E8792B'
            const marker = new AMap.Marker({
                position: [item.location.longitude, item.location.latitude],
                title: item.title,
                content: `<div style="width:20px;height:20px;background:${color};border:2px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
                offset: new AMap.Pixel(-10, -10)
            })
            marker.on('click', () => {
                LJ.mobile.navigate('/report-detail', { id: item._id })
            })
            markers.push(marker)
            mapInstance.add(marker)
        })
    }

    /**
     * 显示筛选弹层
     */
    function showFilterSheet(container) {
        const { STATUS_LIST } = LJ.constants
        const mask = document.createElement('div')
        mask.className = 'modal-mask'
        mask.style.alignItems = 'flex-end'
        mask.innerHTML = `
      <div class="filter-sheet" style="width:100%;">
        <div class="filter-sheet-header">
          <h4>按状态筛选</h4>
          <button type="button" class="close" id="filterClose" aria-label="关闭筛选">✕</button>
        </div>
        <div class="filter-options" role="group" aria-label="状态筛选选项">
          <button type="button" class="filter-option ${currentFilter === '' ? 'active' : ''}" data-status="" aria-pressed="${currentFilter === '' ? 'true' : 'false'}">全部</button>
          ${STATUS_LIST.map((s) => `
            <button type="button" class="filter-option ${currentFilter === s.id ? 'active' : ''}" data-status="${s.id}" aria-pressed="${currentFilter === s.id ? 'true' : 'false'}">${s.name}</button>
          `).join('')}
        </div>
        <div class="filter-actions">
          <button type="button" class="btn btn-outline" id="filterReset">重置</button>
          <button type="button" class="btn btn-primary" id="filterConfirm">确定</button>
        </div>
      </div>
    `
        document.querySelector('.phone-shell').appendChild(mask)

        let selected = currentFilter
        mask.querySelectorAll('.filter-option').forEach((opt) => {
            opt.addEventListener('click', () => {
                mask.querySelectorAll('.filter-option').forEach((o) => o.classList.remove('active'))
                opt.classList.add('active')
                selected = opt.dataset.status
            })
        })

        mask.querySelector('#filterClose').addEventListener('click', () => mask.remove())
        mask.querySelector('#filterReset').addEventListener('click', () => {
            currentFilter = ''
            mask.remove()
            loadNearbyReports()
        })
        mask.querySelector('#filterConfirm').addEventListener('click', () => {
            currentFilter = selected
            mask.remove()
            loadNearbyReports()
        })
    }

    /**
   * 页面销毁
   */
    function onDestroy() {
        if (mapInstance) {
            mapInstance.destroy()
            mapInstance = null
        }
        markers = []
        currentLocationMarker = null
        // 清理移到 phone-shell 下的 fab 按钮
        const fab = document.querySelector('.phone-shell > .fab-report')
        if (fab) fab.remove()
    }

    LJ.mobile.pages.index = { render, onMount, onDestroy }
})(window)
