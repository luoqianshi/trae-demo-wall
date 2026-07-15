// ===== 地图页（全局对象 MapPage） =====
// 使用 Leaflet.js + OpenStreetMap 真实地图
const MapPage = {
  // 默认坐标：北京天安门
  DEFAULT_LAT: 39.908,
  DEFAULT_LNG: 116.397,
  DEFAULT_ZOOM: 14,

  // 状态
  markers: [],            // 当前标记数据
  markerLayer: null,      // Leaflet 标记图层组
  userPosMarker: null,    // 当前位置标记
  currentLatLng: null,    // 当前定位 { lat, lng }
  selectedType: 'all',    // 当前功能筛选
  selectedDistance: 5000,// 当前距离筛选（默认 5km）
  filterExpanded: false,  // 筛选折叠区是否展开

  // 发布标记表单
  createForm: null,
  // 详情面板
  detailMarker: null,
  detailImageIndex: 0,
  // 当前弹窗引用
  currentSheet: { sheet: null, mask: null },

  // 距离筛选选项
  DISTANCE_OPTIONS: [
    { value: 1000, label: '1km' },
    { value: 3000, label: '3km' },
    { value: 5000, label: '5km' },
    { value: 10000, label: '10km' },
    { value: 0, label: '不限' }
  ],

  // 功能筛选 chips（always=true 默认显示，false 折叠）
  FILTER_CHIPS: [
    { key: 'all', label: '全部', always: true },
    { key: 'urgent', label: '紧急', always: true },
    { key: 'adoption', label: '领养', always: true },
    { key: 'rescue', label: '流浪', always: false },
    { key: 'place', label: '场所', always: false },
    { key: 'hospital', label: '医院', always: false },
    { key: 'service', label: '服务', always: false }
  ],

  // 标记类型配置：emoji + 颜色
  TYPE_CONFIG: {
    rescue:    { label: '救助', emoji: '🆘', color: '#FF6B6B' },
    adoption:  { label: '领养', emoji: '🏠', color: '#6C5CE7' },
    place:     { label: '场所', emoji: '🌳', color: '#00B894' },
    hospital:  { label: '医院', emoji: '🏥', color: '#4A9EFF' },
    service:   { label: '服务', emoji: '🐾', color: '#FEA940' }
  },

  // 健康标签选项
  HEALTH_TAGS: ['已绝育', '已疫苗', '已驱虫', '已体检', '胆小', '亲人', '需特殊照顾'],

  // ===== 初始化：渲染页面 HTML 到 #page-map =====
  // 注：Leaflet 地图需在 DOM 可见时初始化，实际地图初始化放在 onShow()
  init() {
    const page = document.getElementById('page-map')
    page.innerHTML = this.renderPageHTML()
    this.bindPageEvents()
  },

  // 渲染页面 HTML
  renderPageHTML() {
    const curDist = this.DISTANCE_OPTIONS.find(o => o.value === this.selectedDistance) || this.DISTANCE_OPTIONS[2]
    return `
      <div class="map-page">
        <div class="map-container" id="leafletMap"></div>

        <div class="map-header">
          <div class="map-search">
            <span class="search-icon">🔍</span>
            <span>搜索地点、标记或地址</span>
          </div>
          <div class="map-filters">
            <div class="distance-filter" id="distanceFilter">
              <span class="dist-icon">📍</span>
              <span id="distanceLabel">${this.getDistanceText(curDist)}</span>
              <span class="dist-arrow">▼</span>
              <div class="distance-dropdown" id="distanceDropdown">
                ${this.DISTANCE_OPTIONS.map(o => `
                  <div class="distance-option ${o.value === this.selectedDistance ? 'active' : ''}" data-value="${o.value}">
                    ${this.getDistanceText(o)}
                  </div>`).join('')}
              </div>
            </div>
            <div class="filter-chips-wrap">
              <div class="filter-chips" id="filterChips">
                ${this.FILTER_CHIPS.map(c => `
                  <div class="chip ${c.key === this.selectedType ? 'active' : ''} ${c.key === 'urgent' ? 'urgent' : ''} ${c.always ? '' : 'extra'}" data-type="${c.key}">${c.label}</div>
                `).join('')}
              </div>
              <div class="filter-more-toggle ${this.filterExpanded ? 'open' : ''}" id="filterMoreToggle">
                <span class="arrow">▼</span>
              </div>
            </div>
          </div>
        </div>

        <div class="map-locate-btn" id="mapLocateBtn">📍</div>
        <div class="map-fab" id="mapFab"><span class="fab-plus">＋</span></div>
      </div>
    `
  },

  // 获取距离选项展示文本
  getDistanceText(opt) {
    return opt.value === 0 ? '不限' : '附近 ' + opt.label
  },

  // 获取描述 placeholder（随动物类型切换）
  getDescPlaceholder(animalType) {
    if (animalType === 'cat') return '描述猫咪的特征、发现地点、健康状况等'
    if (animalType === 'dog') return '描述狗狗的特征、发现地点、健康状况等'
    return '描述动物的特征、发现地点、健康状况等'
  },

  // 绑定页面元素事件
  bindPageEvents() {
    // 距离筛选下拉
    const distFilter = document.getElementById('distanceFilter')
    const distDropdown = document.getElementById('distanceDropdown')
    distFilter.addEventListener('click', (e) => {
      if (e.target.closest('.distance-option')) return
      distFilter.classList.toggle('open')
      distDropdown.classList.toggle('show')
    })
    distDropdown.querySelectorAll('.distance-option').forEach(opt => {
      opt.addEventListener('click', (e) => {
        e.stopPropagation()
        this.selectedDistance = parseInt(opt.dataset.value)
        document.getElementById('distanceLabel').textContent = opt.textContent
        distDropdown.querySelectorAll('.distance-option').forEach(o => o.classList.remove('active'))
        opt.classList.add('active')
        distFilter.classList.remove('open')
        distDropdown.classList.remove('show')
        this.loadMarkers()
      })
    })
    // 点击外部关闭下拉
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#distanceFilter')) {
        distFilter.classList.remove('open')
        distDropdown.classList.remove('show')
      }
    })

    // 功能筛选 chips
    document.getElementById('filterChips').addEventListener('click', (e) => {
      const chip = e.target.closest('.chip')
      if (!chip) return
      this.selectedType = chip.dataset.type
      document.querySelectorAll('#filterChips .chip').forEach(c => c.classList.remove('active'))
      chip.classList.add('active')
      this.loadMarkers()
    })

    // 展开/收起更多筛选
    document.getElementById('filterMoreToggle').addEventListener('click', () => {
      this.filterExpanded = !this.filterExpanded
      const toggle = document.getElementById('filterMoreToggle')
      const chips = document.getElementById('filterChips')
      toggle.classList.toggle('open', this.filterExpanded)
      chips.classList.toggle('expanded', this.filterExpanded)
    })

    // 定位按钮
    document.getElementById('mapLocateBtn').addEventListener('click', () => {
      this.locateAndMove()
    })

    // 发布标记按钮
    document.getElementById('mapFab').addEventListener('click', () => {
      this.openCreateSheet()
    })
  },

  // ===== 页面显示回调 =====
  onShow() {
    if (!App.map) {
      // 首次显示：初始化 Leaflet 地图（延迟确保 DOM 可见）
      setTimeout(() => this.initMap(), 50)
    } else {
      // 已初始化：重新计算地图尺寸并刷新标记
      setTimeout(() => App.map.invalidateSize(), 100)
      this.loadMarkers()
    }
  },

  // 初始化 Leaflet 地图
  initMap() {
    const container = document.getElementById('leafletMap')
    if (!container || typeof L === 'undefined') {
      console.error('地图容器或 Leaflet 未就绪', container, typeof L)
      return
    }
    // 确保容器有尺寸
    const rect = container.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) {
      console.warn('地图容器尺寸为 0，延迟重试', rect)
      setTimeout(() => this.initMap(), 100)
      return
    }
    console.log('初始化地图，容器尺寸:', rect.width, 'x', rect.height)
    App.map = L.map(container, {
      center: [this.DEFAULT_LAT, this.DEFAULT_LNG],
      zoom: this.DEFAULT_ZOOM,
      zoomControl: false,
      attributionControl: false
    })
    // 瓦片层：高德地图（国内访问快，无需 key）
    L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
      subdomains: ['1', '2', '3', '4'],
      maxZoom: 18
    }).addTo(App.map)
    // 标记图层组
    this.markerLayer = L.layerGroup().addTo(App.map)
    // 延迟 invalidateSize 确保 DOM 渲染完成
    setTimeout(() => {
      App.map.invalidateSize()
      this.loadMarkers()
      // 自动获取定位
      this.locateAndMove(true)
    }, 200)
  },

  // 获取定位并移动地图
  locateAndMove(silent = false) {
    if (!navigator.geolocation) {
      this.loadMarkers()
      if (!silent) this._showUnsupportedTip()
      return
    }
    if (!silent) Util.showLoading('定位中...')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        Util.hideLoading()
        const { latitude, longitude } = pos.coords
        this.currentLatLng = { lat: latitude, lng: longitude }
        if (App.map) {
          App.map.setView([latitude, longitude], 15)
          if (this.userPosMarker) this.userPosMarker.remove()
          this.userPosMarker = L.circleMarker([latitude, longitude], {
            radius: 8,
            color: '#fff',
            fillColor: '#4A9EFF',
            fillOpacity: 1,
            weight: 3
          }).addTo(App.map)
        }
        this.loadMarkers()
        if (!silent) Util.toast('已定位到当前位置')
      },
      (err) => {
        Util.hideLoading()
        this.currentLatLng = null
        this.loadMarkers()
        if (silent) return
        // 根据错误类型给出对应引导
        if (err.code === 1) {
          // PERMISSION_DENIED：用户拒绝授权
          this._showPermissionGuide()
        } else if (err.code === 2) {
          // POSITION_UNAVAILABLE：定位不可用
          Util.toast('定位信号弱，请到开阔地带重试')
        } else if (err.code === 3) {
          // TIMEOUT：超时
          Util.toast('定位超时，请重试')
        } else {
          Util.toast('定位失败，已显示默认区域')
        }
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
    )
  },

  // 检查定位权限状态
  _checkPermission() {
    return new Promise((resolve) => {
      if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions.query({ name: 'geolocation' }).then(result => {
          resolve(result.state) // granted / prompt / denied
        }).catch(() => resolve('prompt'))
      } else {
        resolve('prompt')
      }
    })
  },

  // 显示权限申请弹窗（首次或重新申请）
  async _showPermissionGuide() {
    // 先检查当前权限状态
    const state = await this._checkPermission()

    const modal = document.createElement('div')
    modal.className = 'center-modal show'
    modal.style.zIndex = '600'
    modal.innerHTML = `
      <div style="padding:28px 24px 20px;text-align:center;">
        <div style="font-size:56px;margin-bottom:12px;">📍</div>
        <div style="font-size:17px;font-weight:700;margin-bottom:8px;">需要位置权限</div>
        <div style="font-size:14px;color:var(--text-2);line-height:1.6;margin-bottom:16px;">
          PawMap 需要获取您的位置来显示附近的流浪动物救助标记和领养信息
        </div>
        ${state === 'denied' ? `
          <div style="background:var(--accent-bg);color:var(--accent);padding:10px 12px;border-radius:10px;font-size:12px;line-height:1.5;margin-bottom:16px;text-align:left;">
            <b>⚠️ 您已拒绝位置权限</b><br>
            请点击下方「去设置开启」按钮，在浏览器设置中允许位置访问后刷新页面。
          </div>
        ` : ''}
        <div style="display:flex;gap:10px;">
          <button class="btn btn-outline" style="flex:1;" id="permDismiss">暂不授权</button>
          <button class="btn btn-primary" style="flex:1;" id="permGrant">
            ${state === 'denied' ? '去设置开启' : '允许定位'}
          </button>
        </div>
      </div>
    `
    const mask = document.createElement('div')
    mask.className = 'bottom-sheet-mask show'
    mask.style.zIndex = '599'

    document.body.appendChild(mask)
    document.body.appendChild(modal)

    const close = () => { modal.remove(); mask.remove() }
    modal.querySelector('#permDismiss').addEventListener('click', close)
    mask.addEventListener('click', close)

    modal.querySelector('#permGrant').addEventListener('click', async () => {
      if (state === 'denied') {
        // 权限已被拒绝，浏览器无法再次弹窗，只能引导用户去设置
        this._showBrowserSettingsTip()
        close()
      } else {
        // 权限是 prompt 或 granted，直接请求定位
        close()
        // 浏览器会再次弹出授权框
        Util.showLoading('定位中...')
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            Util.hideLoading()
            const { latitude, longitude } = pos.coords
            this.currentLatLng = { lat: latitude, lng: longitude }
            if (App.map) {
              App.map.setView([latitude, longitude], 15)
              if (this.userPosMarker) this.userPosMarker.remove()
              this.userPosMarker = L.circleMarker([latitude, longitude], {
                radius: 8, color: '#fff', fillColor: '#4A9EFF', fillOpacity: 1, weight: 3
              }).addTo(App.map)
            }
            this.loadMarkers()
            Util.toast('已定位到当前位置')
          },
          () => {
            Util.hideLoading()
            this._showPermissionGuide()
          },
          { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
        )
      }
    })
  },

  // 显示浏览器设置引导
  _showBrowserSettingsTip() {
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent)
    const isChrome = /Chrome/.test(navigator.userAgent)
    const isSafari = /Safari/.test(navigator.userAgent) && !isChrome

    let tip = ''
    if (isIOS && isSafari) {
      tip = '设置 → Safari → 位置 → 允许 → 返回刷新页面'
    } else if (isIOS && isChrome) {
      tip = '设置 → Chrome → 位置 → 允许 → 返回刷新页面'
    } else if (isChrome) {
      tip = '点击地址栏左侧 🔒 图标 → 网站设置 → 位置 → 允许 → 刷新页面'
    } else {
      tip = '浏览器设置 → 隐私/安全 → 网站设置 → 位置 → 允许 → 刷新页面'
    }

    Util.toast('请在浏览器设置中开启位置权限：\n' + tip, 5000)
  },

  // 设备不支持定位提示
  _showUnsupportedTip() {
    const modal = document.createElement('div')
    modal.className = 'center-modal show'
    modal.style.zIndex = '600'
    modal.innerHTML = `
      <div style="padding:28px 24px 20px;text-align:center;">
        <div style="font-size:48px;margin-bottom:12px;">😞</div>
        <div style="font-size:17px;font-weight:700;margin-bottom:8px;">设备不支持定位</div>
        <div style="font-size:14px;color:var(--text-2);margin-bottom:16px;">
          您的浏览器不支持地理位置功能，已为您显示默认区域（北京）的标记
        </div>
        <button class="btn btn-primary btn-block" onclick="this.closest('.center-modal').remove();document.querySelector('.bottom-sheet-mask').remove()">知道了</button>
      </div>
    `
    const mask = document.createElement('div')
    mask.className = 'bottom-sheet-mask show'
    mask.style.zIndex = '599'
    document.body.appendChild(mask)
    document.body.appendChild(modal)
    mask.addEventListener('click', () => { modal.remove(); mask.remove() })
  },

  // 加载标记（根据当前筛选条件）
  loadMarkers() {
    if (!App.map || !this.markerLayer) return
    const base = this.currentLatLng || { lat: this.DEFAULT_LAT, lng: this.DEFAULT_LNG }
    API.getMarkers({
      lat: base.lat,
      lng: base.lng,
      radius: this.selectedDistance,
      type: this.selectedType
    }).then(markers => {
      this.markers = markers
      this.renderMarkers()
    })
  },

  // 渲染地图标记
  renderMarkers() {
    this.markerLayer.clearLayers()
    this.markers.forEach(m => {
      const cfg = this.TYPE_CONFIG[m.type] || this.TYPE_CONFIG.rescue
      const urgent = !!m.isUrgent
      const html = `<div class="map-marker ${urgent ? 'urgent' : ''}" style="background:${cfg.color}">${cfg.emoji}</div>`
      const icon = L.divIcon({
        html,
        className: 'map-marker-wrap',
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      })
      const marker = L.marker([m.lat, m.lng], { icon })
      marker.on('click', () => this.openDetailSheet(m))
      marker.addTo(this.markerLayer)
    })
  },

  // ===== 通用弹窗：打开 =====
  openSheet(html, className) {
    const mask = document.createElement('div')
    mask.className = 'bottom-sheet-mask'
    const sheet = document.createElement('div')
    sheet.className = 'bottom-sheet ' + className
    sheet.innerHTML = html
    document.body.appendChild(mask)
    document.body.appendChild(sheet)
    this.currentSheet = { sheet, mask }
    requestAnimationFrame(() => {
      mask.classList.add('show')
      sheet.classList.add('show')
    })
    // 点击遮罩关闭
    mask.addEventListener('click', () => this.closeSheet())
    // 关闭按钮
    sheet.querySelectorAll('.sheet-close').forEach(btn => {
      btn.addEventListener('click', () => this.closeSheet())
    })
    return sheet
  },

  // 通用弹窗：关闭
  closeSheet() {
    const { sheet, mask } = this.currentSheet
    if (!sheet) return
    sheet.classList.remove('show')
    mask.classList.remove('show')
    const toRemove = { sheet, mask }
    this.currentSheet = { sheet: null, mask: null }
    setTimeout(() => {
      toRemove.sheet.remove()
      toRemove.mask.remove()
    }, 300)
  },

  // ===== 发布标记弹窗 =====
  openCreateSheet() {
    // 重置表单
    this.createForm = {
      images: [],
      type: 'rescue',
      animalType: 'cat',
      lat: null,
      lng: null,
      desc: '',
      isUrgent: false,
      // 领养扩展字段
      petName: '',
      breed: '',
      age: '',
      gender: '',
      tags: [],
      minPoints: 2000
    }
    const sheet = this.openSheet(this.renderCreateSheetHTML(), 'create-marker-sheet')
    this.bindCreateSheetEvents(sheet)
  },

  // 渲染发布标记表单 HTML
  renderCreateSheetHTML() {
    const f = this.createForm
    // 发布表单可选的标记类型（rescue 即流浪救助，与小程序对齐）
    const createTypes = ['rescue', 'adoption', 'place', 'hospital', 'service']
    return `
      <div class="sheet-handle"></div>
      <div class="sheet-header">
        <div class="sheet-title">发布标记</div>
        <div class="sheet-close">✕</div>
      </div>
      <div class="sheet-body">
        <!-- 上传图片 -->
        <div class="form-group">
          <label class="form-label">上传图片</label>
          <div class="upload-area" id="createUploadArea">
            <div class="upload-box" id="createUploadBox">
              <span class="upload-icon">📷</span>
              <span>添加图片</span>
            </div>
          </div>
          <input type="file" id="createImageInput" accept="image/*" multiple style="display:none">
        </div>

        <!-- 标记类型 -->
        <div class="form-group">
          <label class="form-label">标记类型</label>
          <div class="type-options" id="typeOptions">
            ${createTypes.map(k => {
              const cfg = this.TYPE_CONFIG[k]
              return `<div class="type-option ${f.type === k ? 'active' : ''}" data-type="${k}">
                <span class="type-emoji">${cfg.emoji}</span>
                <span>${cfg.label}</span>
              </div>`
            }).join('')}
          </div>
        </div>

        <!-- 动物类型 -->
        <div class="form-group">
          <label class="form-label">动物类型</label>
          <div class="animal-options" id="animalOptions">
            <div class="animal-option ${f.animalType === 'cat' ? 'active' : ''}" data-animal="cat">🐱 猫</div>
            <div class="animal-option ${f.animalType === 'dog' ? 'active' : ''}" data-animal="dog">🐶 狗</div>
            <div class="animal-option ${f.animalType === 'other' ? 'active' : ''}" data-animal="other">🐾 其他</div>
          </div>
        </div>

        <!-- 所在位置 -->
        <div class="form-group">
          <label class="form-label">所在位置</label>
          <button class="location-btn" id="locationBtn">
            <span>📍</span>
            <span id="locationText">点击获取当前位置</span>
          </button>
        </div>

        <!-- 详细描述 -->
        <div class="form-group">
          <label class="form-label">详细描述</label>
          <textarea class="form-textarea" id="descInput" maxlength="200" placeholder="${this.getDescPlaceholder(f.animalType)}">${f.desc}</textarea>
          <div class="char-count"><span id="charCount">0</span>/200</div>
        </div>

        <!-- 领养扩展字段（仅 type=adoption 时显示） -->
        <div class="adoption-fields ${f.type === 'adoption' ? 'show' : ''}" id="adoptionFields">
          <div class="form-group">
            <label class="form-label">宠物名字</label>
            <input class="form-input" id="petNameInput" placeholder="请输入宠物名字">
          </div>
          <div class="form-group">
            <label class="form-label">品种</label>
            <input class="form-input" id="breedInput" placeholder="如：橘猫、柴犬">
          </div>
          <div class="form-group">
            <label class="form-label">年龄</label>
            <input class="form-input" id="ageInput" placeholder="如：约1岁">
          </div>
          <div class="form-group">
            <label class="form-label">性别</label>
            <div class="animal-options" id="genderOptions">
              <div class="animal-option" data-gender="male">♂ 公</div>
              <div class="animal-option" data-gender="female">♀ 母</div>
              <div class="animal-option" data-gender="unknown">？ 未知</div>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">健康标签</label>
            <div class="health-tags" id="healthTags">
              ${this.HEALTH_TAGS.map(t => `<div class="health-tag" data-tag="${t}">${t}</div>`).join('')}
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">积分要求</label>
            <select class="form-input" id="minPointsSelect">
              <option value="0" ${f.minPoints === 0 ? 'selected' : ''}>无要求</option>
              <option value="1000" ${f.minPoints === 1000 ? 'selected' : ''}>1000 积分</option>
              <option value="1500" ${f.minPoints === 1500 ? 'selected' : ''}>1500 积分</option>
              <option value="2000" ${f.minPoints === 2000 ? 'selected' : ''}>2000 积分</option>
              <option value="3000" ${f.minPoints === 3000 ? 'selected' : ''}>3000 积分</option>
            </select>
          </div>
        </div>

        <!-- 紧急情况开关 -->
        <div class="form-group">
          <div class="urgent-row">
            <div class="urgent-label"><span>🚨</span>紧急情况</div>
            <div class="toggle" id="urgentToggle">
              <div class="toggle-knob"></div>
            </div>
          </div>
          <div style="font-size:12px;color:var(--text-2);margin-top:6px;line-height:1.5;">受伤/危险/急需救助时开启</div>
        </div>

        <!-- 提交按钮（position:relative，跟随内容滚动） -->
        <button class="submit-btn" id="submitBtn">发布标记 +50积分</button>
      </div>
    `
  },

  // 绑定发布标记表单事件
  bindCreateSheetEvents(sheet) {
    const f = this.createForm

    // 图片上传
    const uploadBox = sheet.querySelector('#createUploadBox')
    const imageInput = sheet.querySelector('#createImageInput')
    uploadBox.addEventListener('click', () => imageInput.click())
    imageInput.addEventListener('change', (e) => this.handleImageUpload(e))
    // 删除图片（事件委托）
    sheet.querySelector('#createUploadArea').addEventListener('click', (e) => {
      if (e.target.classList.contains('remove-btn')) {
        const idx = parseInt(e.target.dataset.idx)
        f.images.splice(idx, 1)
        this.rerenderImages()
      }
    })

    // 标记类型
    sheet.querySelector('#typeOptions').addEventListener('click', (e) => {
      const opt = e.target.closest('.type-option')
      if (!opt) return
      f.type = opt.dataset.type
      sheet.querySelectorAll('.type-option').forEach(o => o.classList.remove('active'))
      opt.classList.add('active')
      sheet.querySelector('#adoptionFields').classList.toggle('show', f.type === 'adoption')
    })

    // 动物类型
    sheet.querySelector('#animalOptions').addEventListener('click', (e) => {
      const opt = e.target.closest('.animal-option')
      if (!opt) return
      f.animalType = opt.dataset.animal
      sheet.querySelectorAll('#animalOptions .animal-option').forEach(o => o.classList.remove('active'))
      opt.classList.add('active')
      // 同步更新描述 placeholder
      const descInput = sheet.querySelector('#descInput')
      if (descInput) descInput.placeholder = this.getDescPlaceholder(f.animalType)
    })

    // 获取位置
    sheet.querySelector('#locationBtn').addEventListener('click', () => {
      if (!navigator.geolocation) { Util.toast('设备不支持定位'); return }
      Util.showLoading('定位中...')
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          Util.hideLoading()
          f.lat = pos.coords.latitude
          f.lng = pos.coords.longitude
          f.address = `${f.lat.toFixed(4)}, ${f.lng.toFixed(4)}`
          const btn = sheet.querySelector('#locationBtn')
          btn.classList.add('located')
          sheet.querySelector('#locationText').textContent = '已定位 ' + f.address
        },
        () => { Util.hideLoading(); Util.toast('定位失败，请检查权限') },
        { enableHighAccuracy: true, timeout: 8000 }
      )
    })

    // 描述输入 + 字数统计
    const descInput = sheet.querySelector('#descInput')
    const charCount = sheet.querySelector('#charCount')
    descInput.addEventListener('input', () => {
      f.desc = descInput.value
      charCount.textContent = descInput.value.length
    })

    // 性别选择
    sheet.querySelector('#genderOptions').addEventListener('click', (e) => {
      const opt = e.target.closest('.animal-option')
      if (!opt) return
      f.gender = opt.dataset.gender
      sheet.querySelectorAll('#genderOptions .animal-option').forEach(o => o.classList.remove('active'))
      opt.classList.add('active')
    })

    // 健康标签
    sheet.querySelector('#healthTags').addEventListener('click', (e) => {
      const tag = e.target.closest('.health-tag')
      if (!tag) return
      const t = tag.dataset.tag
      const idx = f.tags.indexOf(t)
      if (idx >= 0) {
        f.tags.splice(idx, 1)
        tag.classList.remove('active')
      } else {
        f.tags.push(t)
        tag.classList.add('active')
      }
    })

    // 领养扩展输入
    sheet.querySelector('#petNameInput').addEventListener('input', e => f.petName = e.target.value)
    sheet.querySelector('#breedInput').addEventListener('input', e => f.breed = e.target.value)
    sheet.querySelector('#ageInput').addEventListener('input', e => f.age = e.target.value)
    sheet.querySelector('#minPointsSelect').addEventListener('change', e => f.minPoints = parseInt(e.target.value))

    // 紧急开关
    sheet.querySelector('#urgentToggle').addEventListener('click', () => {
      f.isUrgent = !f.isUrgent
      sheet.querySelector('#urgentToggle').classList.toggle('on', f.isUrgent)
    })

    // 提交
    sheet.querySelector('#submitBtn').addEventListener('click', () => this.submitCreateMarker())
  },

  // 处理图片上传（压缩）
  handleImageUpload(e) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    const f = this.createForm
    const remain = 6 - f.images.length
    if (remain <= 0) { Util.toast('最多上传 6 张图片'); e.target.value = ''; return }
    Util.showLoading('处理图片中...')
    Promise.all(files.slice(0, remain).map(file => Util.compressImage(file)))
      .then(compressed => {
        Util.hideLoading()
        compressed.forEach(img => f.images.push(img))
        this.rerenderImages()
      })
      .catch(() => {
        Util.hideLoading()
        Util.toast('图片处理失败')
      })
    e.target.value = ''
  },

  // 重新渲染图片预览区
  rerenderImages() {
    const f = this.createForm
    const area = document.getElementById('createUploadArea')
    if (!area) return
    const uploadBox = document.getElementById('createUploadBox')
    area.querySelectorAll('.upload-item').forEach(el => el.remove())
    f.images.forEach((src, idx) => {
      const item = document.createElement('div')
      item.className = 'upload-item'
      item.innerHTML = `<img src="${src}"><div class="remove-btn" data-idx="${idx}">✕</div>`
      area.insertBefore(item, uploadBox)
    })
    uploadBox.style.display = f.images.length >= 6 ? 'none' : 'flex'
  },

  // 构建标记标题
  buildMarkerTitle(f) {
    const animalMap = { cat: '猫', dog: '狗', other: '动物' }
    const animal = animalMap[f.animalType] || '动物'
    if (f.type === 'adoption' && f.petName) return f.petName + '找家'
    if (f.type === 'rescue') return '流浪' + animal + '求救助'
    if (f.type === 'place') return '宠物友好场所'
    if (f.type === 'hospital') return '宠物医院'
    if (f.type === 'service') return '宠物服务'
    return '新标记'
  },

  // 提交发布标记
  submitCreateMarker() {
    const f = this.createForm
    // 校验
    if (!f.desc || !f.desc.trim()) { Util.toast('请填写详细描述'); return }
    if (f.lat == null || f.lng == null) { Util.toast('请获取所在位置'); return }
    if (f.type === 'adoption' && !f.petName.trim()) { Util.toast('请填写宠物名字'); return }

    const data = {
      type: f.type,
      title: this.buildMarkerTitle(f),
      desc: f.desc.trim(),
      images: f.images,
      lat: f.lat,
      lng: f.lng,
      location: { lat: f.lat, lng: f.lng },
      address: f.address || '',
      area: f.area || '',
      street: f.street || '',
      isUrgent: f.isUrgent,
      animalType: f.animalType
    }
    // 领养扩展字段
    if (f.type === 'adoption') {
      data.petName = f.petName.trim()
      data.breed = f.breed
      data.age = f.age
      data.gender = f.gender
      data.tags = f.tags
      data.minPoints = f.minPoints
    }

    const btn = document.getElementById('submitBtn')
    btn.disabled = true
    btn.textContent = '发布中...'

    // 如果是领养类型：先创建领养信息，再创建标记并关联
    if (f.type === 'adoption') {
      const adoptionData = {
        name: f.petName.trim(),
        type: f.animalType || 'other',
        breed: f.breed || '',
        gender: f.gender || '',
        age: f.age || '',
        weight: '',
        tags: f.tags || [],
        images: f.images || [],
        desc: f.desc.trim(),
        requirements: ['有稳定住所', '科学喂养', '定期回访', '不弃养'],
        location: f.address || '',
        minPoints: f.minPoints || 0,
        isUrgent: f.isUrgent || false
      }
      API.createAdoption(adoptionData).then(adoption => {
        // 领养创建成功，额外加 100 积分
        return API.addPoints('friendly', 100, '发布领养信息').then(() => adoption)
      }).then(adoption => {
        // 关联 adoptionId 到标记
        data.adoptionId = adoption.id
        return API.createMarker(data)
      }).then(() => {
        // 发布标记 +50 积分
        return API.addPoints('friendly', 50, '发布救助标记')
      }).then(() => {
        this.closeSheet()
        App.showPointsReward(150, '发布领养标记（领养+100 标记+50）')
        this.loadMarkers()
        Util.toast('领养标记发布成功')
      }).catch(() => {
        btn.disabled = false
        btn.textContent = '发布标记 +50积分'
        Util.toast('发布失败，请重试')
      })
      return
    }

    // 非领养类型：直接创建标记
    API.createMarker(data)
      .then(() => API.addPoints('friendly', 50, '发布救助标记'))
      .then(() => {
        this.closeSheet()
        App.showPointsReward(50, '发布救助标记')
        this.loadMarkers()
        Util.toast('标记发布成功')
      })
      .catch(() => {
        btn.disabled = false
        btn.textContent = '发布标记 +50积分'
        Util.toast('发布失败，请重试')
      })
  },

  // ===== 标记详情面板 =====
  openDetailSheet(marker) {
    this.detailMarker = marker
    this.detailImageIndex = 0
    const sheet = this.openSheet(this.renderDetailSheetHTML(marker), 'detail-sheet')
    this.bindDetailEvents(marker)
  },

  // 渲染详情面板 HTML
  renderDetailSheetHTML(m) {
    const cfg = this.TYPE_CONFIG[m.type] || this.TYPE_CONFIG.rescue
    const user = Store.findById('users', m.userId)
    const userName = user ? user.nickname : '匿名用户'
    const userAvatar = user ? user.avatar : '🐾'
    const images = m.images || []
    const hasImages = images.length > 0

    return `
      <div class="sheet-handle"></div>
      <div class="sheet-header">
        <div class="sheet-title">标记详情</div>
        <div class="sheet-close">✕</div>
      </div>
      <div class="sheet-body">
        <!-- 图片轮播 -->
        <div class="detail-carousel" id="detailCarousel">
          ${hasImages
            ? images.map((src, i) => `<img src="${src}" class="${i === 0 ? 'show' : ''}" data-idx="${i}">`).join('')
            : `<div class="carousel-empty">${cfg.emoji}</div>`}
          ${hasImages && images.length > 1 ? `
            <div class="carousel-arrow prev" id="carouselPrev">‹</div>
            <div class="carousel-arrow next" id="carouselNext">›</div>
            <div class="carousel-dots">
              ${images.map((_, i) => `<div class="carousel-dot ${i === 0 ? 'active' : ''}" data-idx="${i}"></div>`).join('')}
            </div>` : ''}
        </div>

        <div class="detail-content">
          <div class="detail-title">${m.title || '未命名标记'}</div>
          <div class="detail-tags">
            <span class="tag tag-primary">${cfg.emoji} ${cfg.label}</span>
            ${m.isUrgent ? '<span class="tag tag-red">🚨 紧急</span>' : ''}
            ${m.status === 'rescuing' ? '<span class="tag tag-orange">救助中</span>' : ''}
            ${m.status === 'resolved' ? '<span class="tag tag-green">已完成</span>' : ''}
          </div>
          <div class="detail-desc">${m.desc || '暂无描述'}</div>
          <div class="detail-meta">
            <div class="detail-meta-row"><span class="meta-icon">📍</span><span>${m.address || '未知地址'}</span></div>
            ${this.currentLatLng ? `<div class="detail-meta-row"><span class="meta-icon">📏</span><span>距您 ${Util.formatDistance(Util.getDistance(this.currentLatLng.lat, this.currentLatLng.lng, m.lat, m.lng))}</span></div>` : ''}
            <div class="detail-meta-row"><span class="meta-icon">🕐</span><span>${Util.timeAgo(m.createdAt)}</span></div>
            <div class="detail-meta-row"><span class="meta-icon">${userAvatar}</span><span>${userName}</span></div>
          </div>

          <!-- 操作按钮（按类型动态生成） -->
          ${this.renderDetailActions(m)}
        </div>
      </div>
    `
  },

  // 按类型动态生成详情操作按钮（与小程序对齐）
  renderDetailActions(m) {
    const type = m.type
    const isUrgent = !!m.isUrgent
    let primary = ''
    let secondary = ''

    if (type === 'rescue' || isUrgent) {
      // rescue/urgent 类型：我来救助 + 追踪
      primary = `<button class="detail-action-btn rescue-btn" id="rescueBtn">
        <span class="action-emoji">🤝</span><span>我来救助 +50积分</span>
      </button>`
      secondary += `<button class="detail-action-btn" id="trackBtn">
        <span class="action-emoji">📍</span><span>追踪</span>
      </button>`
    } else if (type === 'adoption') {
      // adoption 类型：收藏 + 查看领养详情
      secondary += `<button class="detail-action-btn" id="favBtn">
        <span class="action-emoji">⭐</span><span>收藏</span>
      </button>`
      if (m.adoptionId) {
        secondary += `<button class="detail-action-btn" id="viewAdoptionBtn">
          <span class="action-emoji">🏠</span><span>查看领养详情</span>
        </button>`
      }
    } else if (type === 'place' || type === 'hospital') {
      // place/hospital 类型：收藏
      secondary += `<button class="detail-action-btn" id="favBtn">
        <span class="action-emoji">⭐</span><span>收藏</span>
      </button>`
    } else if (type === 'service') {
      // service 类型：接单 + 联系发布者
      primary = `<button class="detail-action-btn rescue-btn" id="acceptOrderBtn">
        <span class="action-emoji">📋</span><span>接单 +30积分</span>
      </button>`
      secondary += `<button class="detail-action-btn" id="contactBtn">
        <span class="action-emoji">💬</span><span>联系发布者</span>
      </button>`
    }

    // 所有类型都显示：导航
    secondary += `<button class="detail-action-btn" id="navBtn">
      <span class="action-emoji">🧭</span><span>导航</span>
    </button>`

    return `
      <div class="detail-actions">
        ${primary}
        <div class="detail-action-row">${secondary}</div>
      </div>
    `
  },

  // 绑定详情面板事件
  bindDetailEvents(m) {
    const images = m.images || []

    // 图片轮播
    if (images.length > 1) {
      const go = (delta) => {
        this.detailImageIndex = (this.detailImageIndex + delta + images.length) % images.length
        this.updateCarousel()
      }
      document.getElementById('carouselPrev')?.addEventListener('click', () => go(-1))
      document.getElementById('carouselNext')?.addEventListener('click', () => go(1))
    }

    // 查看领养详情：通过 AdoptionPage.openDetail 预取数据后渲染
    document.getElementById('viewAdoptionBtn')?.addEventListener('click', () => {
      const adoptionId = m.adoptionId
      this.closeSheet()
      setTimeout(() => {
        if (typeof AdoptionPage !== 'undefined' && AdoptionPage.openDetail) {
          AdoptionPage.openDetail(adoptionId)
        } else {
          Util.toast('领养模块加载中')
        }
      }, 320)
    })

    // 我来救助（+50积分，由 API.respondRescue 内部发放）
    document.getElementById('rescueBtn')?.addEventListener('click', () => {
      API.respondRescue(m.id).then(res => {
        if (res.success) {
          App.showPointsReward(50, '响应救助')
          this.closeSheet()
          this.loadMarkers()
        } else {
          Util.toast(res.message || '操作失败')
        }
      })
    })

    // 追踪
    document.getElementById('trackBtn')?.addEventListener('click', (e) => {
      API.toggleTrack(m.id).then(res => {
        e.currentTarget.classList.toggle('active', res.isTracking)
        Util.toast(res.isTracking ? '已追踪' : '已取消追踪')
      })
    })

    // 收藏
    document.getElementById('favBtn')?.addEventListener('click', (e) => {
      API.toggleFavorite(m.id).then(res => {
        e.currentTarget.classList.toggle('active', res.isFavorite)
        Util.toast(res.isFavorite ? '已收藏' : '已取消收藏')
      })
    })

    // 接单（service 类型，+30积分）
    document.getElementById('acceptOrderBtn')?.addEventListener('click', () => {
      API.addPoints('friendly', 30, '接单').then(() => {
        Util.toast('接单成功 +30积分')
        this.closeSheet()
      })
    })

    // 联系发布者（service 类型，跳转聊天）
    document.getElementById('contactBtn')?.addEventListener('click', () => {
      this.closeSheet()
      setTimeout(() => {
        if (typeof ChatPage !== 'undefined' && ChatPage.open) {
          ChatPage.open(m.userId)
        } else {
          Util.toast('聊天模块加载中')
        }
      }, 320)
    })

    // 导航（Google Maps）
    document.getElementById('navBtn')?.addEventListener('click', () => {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${m.lat},${m.lng}`
      window.open(url, '_blank')
    })
  },

  // 更新轮播图显示
  updateCarousel() {
    const carousel = document.getElementById('detailCarousel')
    if (!carousel) return
    carousel.querySelectorAll('img').forEach((img, i) => {
      img.classList.toggle('show', i === this.detailImageIndex)
    })
    carousel.querySelectorAll('.carousel-dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === this.detailImageIndex)
    })
  }
}
