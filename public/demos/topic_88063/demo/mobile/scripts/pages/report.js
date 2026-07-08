/**
 * 问题上报页 - 6 步流程
 * 拍照 → AI 识别 → 定位 → 描述 → 确认 → 成功
 */
(function (global) {
    const LJ = global.LJ || (global.LJ = {})
    LJ.mobile.pages = LJ.mobile.pages || {}

    // 页面状态
    const state = {
        step: 1,
        photoPath: '',
        aiLoading: false,
        aiResult: { facilityType: '', facilityTypeId: '', problemType: '', problemTypeId: '', confidence: 0 },
        location: { latitude: 0, longitude: 0, address: '' },
        description: '',
        submitting: false
    }

    const stepNames = ['拍照', '识别', '定位', '描述', '确认']

    /**
     * 渲染页面骨架
     */
    function render() {
        return `
      <div class="page">
        <div class="steps-bar" id="stepsBar"></div>
        <div class="step-content" id="stepContent"></div>
      </div>
    `
    }

    /**
     * 渲染步骤条
     */
    function renderSteps() {
        const bar = document.getElementById('stepsBar')
        if (!bar) return
        bar.innerHTML = stepNames.map((name, i) => {
            const stepNum = i + 1
            const cls = stepNum === state.step ? 'active' : (stepNum < state.step ? 'done' : '')
            return `
        <div class="step-item ${cls}">
          ${i < stepNames.length - 1 ? '<div class="step-line"></div>' : ''}
          <div class="step-circle">${stepNum < state.step ? '✓' : stepNum}</div>
          <div class="step-name">${name}</div>
        </div>
      `
        }).join('')
    }

    /**
     * 渲染当前步骤内容
     */
    function renderStepContent() {
        const el = document.getElementById('stepContent')
        if (!el) return
        el.innerHTML = getStepHTML(state.step)
        bindStepEvents()
    }

    /**
     * 获取各步骤 HTML
     */
    function getStepHTML(step) {
        switch (step) {
            case 1: return renderStep1()
            case 2: return renderStep2()
            case 3: return renderStep3()
            case 4: return renderStep4()
            case 5: return renderStep5()
            case 6: return renderStep6()
            default: return ''
        }
    }

    /* ===== Step 1: 拍照 ===== */
    function renderStep1() {
        if (state.photoPath) {
            return `
        <div class="step-title">拍照确认</div>
        <div class="step-desc">确认拍摄的照片清晰可见</div>
        <div class="photo-preview">
          <img src="${state.photoPath}" alt="上报照片">
          <button type="button" class="retake-btn" id="retakeBtn">重新拍摄</button>
        </div>
        <div class="step-actions">
          <button type="button" class="btn btn-primary btn-block btn-lg" id="nextBtn">使用此照片</button>
        </div>
      `
        }
        return `
      <div class="step-title">拍摄问题照片</div>
      <div class="step-desc">请拍摄无障碍设施问题的现场照片</div>
      <button type="button" class="photo-area" id="photoArea" aria-label="点击拍照或从相册选择">
        <div class="photo-icon" aria-hidden="true">📷</div>
        <div class="photo-text">点击拍照或从相册选择</div>
      </button>
      <div class="photo-actions">
        <button type="button" class="btn btn-outline" id="cameraBtn">📷 拍照</button>
        <button type="button" class="btn btn-outline" id="albumBtn">🖼️ 相册</button>
      </div>
      <input type="file" id="fileInput" accept="image/*" style="display:none;" capture="environment">
    `
    }

    /* ===== Step 2: AI 识别 ===== */
    function renderStep2() {
        if (state.aiLoading) {
            return `
        <div class="step-title">AI 智能识别中</div>
        <div class="step-desc">正在分析照片，识别设施类型和问题分类…</div>
        <div class="ai-loading">
          <div class="loading-spinner" role="img" aria-label="AI 识别中"></div>
          <p style="color:var(--color-text-secondary);">AI 识别通常需要 1-2 秒</p>
        </div>
      `
        }
        const r = state.aiResult
        return `
      <div class="step-title">AI 识别结果</div>
      <div class="step-desc">系统已自动识别，您可以修改确认</div>
      <div class="ai-result">
        <div class="ai-result-header">
          <span class="ai-badge">AI 识别</span>
          <span class="ai-confidence">置信度 ${(r.confidence * 100).toFixed(0)}%</span>
        </div>
        <div class="ai-fields">
          <button type="button" class="ai-field" id="facilityField" aria-label="选择设施类型，当前：${r.facilityType || '未选择'}">
            <span class="ai-field-label">设施类型</span>
            <span class="ai-field-value">${r.facilityType || '请选择'} ▾</span>
          </button>
          <button type="button" class="ai-field" id="problemField" aria-label="选择问题分类，当前：${r.problemType || '未选择'}">
            <span class="ai-field-label">问题分类</span>
            <span class="ai-field-value">${r.problemType || '请选择'} ▾</span>
          </button>
        </div>
      </div>
      <div class="step-actions">
        <button type="button" class="btn btn-outline" id="reRecognizeBtn">重新识别</button>
        <button type="button" class="btn btn-primary" id="confirmAiBtn">确认</button>
      </div>
    `
    }

    /* ===== Step 3: 定位 ===== */
    function renderStep3() {
        const loc = state.location
        const coordText = loc.latitude && loc.longitude ? `${loc.latitude.toFixed(6)}, ${loc.longitude.toFixed(6)}` : ''
        return `
      <div class="step-title">确认问题位置</div>
      <div class="step-desc">系统已自动定位，请确认位置是否准确</div>
      <div class="location-card">
        <div class="location-icon" aria-hidden="true">📍</div>
        <div class="location-info">
          <div class="location-address" aria-live="polite">${loc.address || '定位中…'}</div>
          <div class="location-coord">${coordText}</div>
        </div>
      </div>
      <div class="step-actions">
        <button type="button" class="btn btn-outline" id="relocateBtn">重新定位</button>
        <button type="button" class="btn btn-primary" id="confirmLocBtn">确认位置</button>
      </div>
    `
    }

    /* ===== Step 4: 描述 ===== */
    function renderStep4() {
        return `
      <div class="step-title">补充问题描述</div>
      <div class="step-desc">请描述问题的具体情况（选填）</div>
      <div class="form-group">
        <textarea class="form-textarea" id="descInput" placeholder="例如：该处盲道被共享单车大面积占用，影响视障人士通行…" maxlength="200">${state.description}</textarea>
        <div class="desc-counter"><span id="descCount">${state.description.length}</span>/200</div>
      </div>
      <div class="step-actions">
        <button type="button" class="btn btn-outline" id="skipDescBtn">跳过</button>
        <button type="button" class="btn btn-primary" id="confirmDescBtn">下一步</button>
      </div>
    `
    }

    /* ===== Step 5: 预览确认 ===== */
    function renderStep5() {
        const r = state.aiResult
        const loc = state.location
        return `
      <div class="step-title">确认上报信息</div>
      <div class="step-desc">请核对以下信息，确认无误后提交</div>
      <div class="preview-section">
        <h4>问题照片</h4>
        <img class="preview-photo" src="${state.photoPath}" alt="照片">
      </div>
      <div class="preview-section">
        <h4>设施类型</h4>
        <div class="preview-value">${r.facilityType}</div>
      </div>
      <div class="preview-section">
        <h4>问题分类</h4>
        <div class="preview-value">${r.problemType}</div>
      </div>
      <div class="preview-section">
        <h4>位置</h4>
        <div class="preview-value">${loc.address || (loc.latitude ? `${loc.latitude.toFixed(6)}, ${loc.longitude.toFixed(6)}` : '未定位')}</div>
      </div>
      <div class="preview-section">
        <h4>描述</h4>
        <div class="preview-value">${state.description || '未填写'}</div>
      </div>
      <div class="step-actions">
        <button type="button" class="btn btn-outline" id="prevBtn">上一步</button>
        <button type="button" class="btn btn-primary" id="submitBtn" ${state.submitting ? 'disabled' : ''}>${state.submitting ? '提交中…' : '提交上报'}</button>
      </div>
    `
    }

    /* ===== Step 6: 成功 ===== */
    function renderStep6() {
        return `
      <div class="success-page">
        <div class="success-icon" aria-hidden="true">✓</div>
        <div class="success-title">上报成功！</div>
        <div class="success-desc">感谢您为无障碍环境做出的贡献<br>我们会尽快处理您反映的问题</div>
        <div class="success-orderid">工单编号：${state.orderId || 'LJ' + Date.now()}</div>
        <div class="step-actions">
          <button type="button" class="btn btn-outline" id="goHomeBtn">返回首页</button>
          <button type="button" class="btn btn-primary" id="goMyReportsBtn">查看我的上报</button>
        </div>
        <button type="button" class="btn btn-outline btn-block" id="continueBtn" style="margin-top:12px;">继续上报</button>
      </div>
    `
    }

    /**
     * 绑定各步骤事件
     */
    function bindStepEvents() {
        const handlers = {
            1: bindStep1,
            2: bindStep2,
            3: bindStep3,
            4: bindStep4,
            5: bindStep5,
            6: bindStep6
        }
        const handler = handlers[state.step]
        if (handler) handler()
    }

    function bindStep1() {
        const fileInput = document.getElementById('fileInput')
        const photoArea = document.getElementById('photoArea')
        const cameraBtn = document.getElementById('cameraBtn')
        const albumBtn = document.getElementById('albumBtn')

        const handleFile = (file) => {
            if (!file || !file.type.startsWith('image/')) {
                LJ.mobile.showToast('请选择图片文件')
                return
            }
            const reader = new FileReader()
            reader.onload = (e) => {
                state.photoPath = e.target.result
                renderSteps()
                renderStepContent()
            }
            reader.readAsDataURL(file)
        }

        if (photoArea) photoArea.addEventListener('click', () => fileInput.click())
        if (cameraBtn) cameraBtn.addEventListener('click', () => { fileInput.capture = 'environment'; fileInput.click() })
        if (albumBtn) albumBtn.addEventListener('click', () => { fileInput.capture = ''; fileInput.click() })
        if (fileInput) fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]))

        const retakeBtn = document.getElementById('retakeBtn')
        if (retakeBtn) retakeBtn.addEventListener('click', () => {
            state.photoPath = ''
            renderStepContent()
        })

        const nextBtn = document.getElementById('nextBtn')
        if (nextBtn) nextBtn.addEventListener('click', () => {
            state.step = 2
            state.aiLoading = true
            renderSteps()
            renderStepContent()
            startAIRecognition()
        })
    }

    function bindStep2() {
        const facilityField = document.getElementById('facilityField')
        const problemField = document.getElementById('problemField')
        const reRecognizeBtn = document.getElementById('reRecognizeBtn')
        const confirmAiBtn = document.getElementById('confirmAiBtn')

        if (facilityField) facilityField.addEventListener('click', () => showPicker('facility'))
        if (problemField) problemField.addEventListener('click', () => showPicker('problem'))
        if (reRecognizeBtn) reRecognizeBtn.addEventListener('click', () => {
            state.aiLoading = true
            renderStepContent()
            startAIRecognition()
        })
        if (confirmAiBtn) confirmAiBtn.addEventListener('click', () => {
            if (!state.aiResult.facilityType || !state.aiResult.problemType) {
                LJ.mobile.showToast('请选择设施类型和问题分类')
                return
            }
            state.step = 3
            renderSteps()
            renderStepContent()
            getLocation()
        })
    }

    function bindStep3() {
        const relocateBtn = document.getElementById('relocateBtn')
        const confirmLocBtn = document.getElementById('confirmLocBtn')
        if (relocateBtn) relocateBtn.addEventListener('click', getLocation)
        if (confirmLocBtn) confirmLocBtn.addEventListener('click', () => {
            if (!state.location.latitude) {
                LJ.mobile.showToast('请等待定位完成')
                return
            }
            state.step = 4
            renderSteps()
            renderStepContent()
        })
    }

    function bindStep4() {
        const descInput = document.getElementById('descInput')
        const descCount = document.getElementById('descCount')
        const skipBtn = document.getElementById('skipDescBtn')
        const confirmBtn = document.getElementById('confirmDescBtn')

        if (descInput) descInput.addEventListener('input', (e) => {
            state.description = e.target.value
            if (descCount) descCount.textContent = e.target.value.length
        })
        if (skipBtn) skipBtn.addEventListener('click', () => {
            state.step = 5
            renderSteps()
            renderStepContent()
        })
        if (confirmBtn) confirmBtn.addEventListener('click', () => {
            state.step = 5
            renderSteps()
            renderStepContent()
        })
    }

    function bindStep5() {
        const prevBtn = document.getElementById('prevBtn')
        const submitBtn = document.getElementById('submitBtn')
        if (prevBtn) prevBtn.addEventListener('click', () => {
            state.step = 4
            renderSteps()
            renderStepContent()
        })
        if (submitBtn) submitBtn.addEventListener('click', submitReport)
    }

    function bindStep6() {
        const goHomeBtn = document.getElementById('goHomeBtn')
        const goMyReportsBtn = document.getElementById('goMyReportsBtn')
        const continueBtn = document.getElementById('continueBtn')
        if (goHomeBtn) goHomeBtn.addEventListener('click', () => LJ.mobile.navigate('/'))
        if (goMyReportsBtn) goMyReportsBtn.addEventListener('click', () => LJ.mobile.navigate('/my-reports'))
        if (continueBtn) continueBtn.addEventListener('click', () => {
            Object.assign(state, {
                step: 1, photoPath: '', aiLoading: false,
                aiResult: { facilityType: '', facilityTypeId: '', problemType: '', problemTypeId: '', confidence: 0 },
                location: { latitude: 0, longitude: 0, address: '' },
                description: '', submitting: false, orderId: ''
            })
            renderSteps()
            renderStepContent()
        })
    }

    /**
     * AI 识别
     */
    async function startAIRecognition() {
        try {
            const res = await LJ.mockApi.recognizeImage(state.photoPath)
            if (res.code === 0) {
                state.aiResult = {
                    facilityType: res.data.facilityType,
                    facilityTypeId: res.data.facilityTypeId,
                    problemType: res.data.problemType,
                    problemTypeId: res.data.problemTypeId,
                    confidence: res.data.confidence
                }
            }
        } catch (err) {
            console.error('AI 识别失败：', err)
            LJ.mobile.showToast('AI 识别失败，请手动选择')
        }
        state.aiLoading = false
        renderStepContent()
    }

    /**
     * 显示选择器
     * 设施类型选择后，问题分类只显示该类型下的选项 + "其他"分类
     */
    function showPicker(type) {
        const { PROBLEM_TYPES, PROBLEM_CATEGORIES } = LJ.constants
        let list
        let current
        let title

        if (type === 'facility') {
            // 设施类型：显示全部分类
            list = PROBLEM_CATEGORIES
            current = state.aiResult.facilityTypeId
            title = '选择设施类型'
        } else {
            // 问题分类：根据已选设施类型过滤
            const facilityTypeId = state.aiResult.facilityTypeId
            if (facilityTypeId) {
                // 只显示该设施类型下的问题 + "其他"分类下的其他问题
                list = PROBLEM_TYPES.filter((t) => t.category === facilityTypeId || t.category === 'other')
            } else {
                // 未选设施类型，显示全部
                list = PROBLEM_TYPES
            }
            current = state.aiResult.problemTypeId
            title = facilityTypeId ? `选择问题分类（${PROBLEM_CATEGORIES.find((c) => c.id === facilityTypeId)?.name || ''}）` : '选择问题分类'
        }

        const mask = document.createElement('div')
        mask.className = 'modal-mask'
        mask.style.alignItems = 'flex-end'
        mask.innerHTML = `
      <div class="picker-sheet" style="width:100%;">
        <div class="picker-sheet-header">
          <h4>${title}</h4>
          <button type="button" class="close" id="pickerClose" aria-label="关闭选择器">✕</button>
        </div>
        <div class="picker-options" role="listbox" aria-label="${title}">
          ${list.map((item) => `
            <button type="button" class="picker-option ${item.id === current ? 'selected' : ''}" data-id="${item.id}" data-name="${item.name}" role="option" aria-selected="${item.id === current ? 'true' : 'false'}">${item.name}</button>
          `).join('')}
        </div>
      </div>
    `
        document.querySelector('.phone-shell').appendChild(mask)

        mask.querySelectorAll('.picker-option').forEach((opt) => {
            opt.addEventListener('click', () => {
                if (type === 'facility') {
                    state.aiResult.facilityType = opt.dataset.name
                    state.aiResult.facilityTypeId = opt.dataset.id
                    // 设施类型变更后，清空已选问题分类（如果不在新类型下）
                    const problemType = PROBLEM_TYPES.find((t) => t.id === state.aiResult.problemTypeId)
                    if (problemType && problemType.category !== opt.dataset.id && problemType.category !== 'other') {
                        state.aiResult.problemType = ''
                        state.aiResult.problemTypeId = ''
                    }
                } else {
                    state.aiResult.problemType = opt.dataset.name
                    state.aiResult.problemTypeId = opt.dataset.id
                }
                mask.remove()
                renderStepContent()
            })
        })
        mask.querySelector('#pickerClose').addEventListener('click', () => mask.remove())
        mask.addEventListener('click', (e) => {
            if (e.target === mask) mask.remove()
        })
    }

    /**
     * 获取定位
     * 优先使用高德 Geolocation 插件（自动 GCJ02），回退浏览器定位 + WGS84 转换
     */
    function getLocation() {
        // 优先使用高德 Geolocation 插件
        if (typeof AMap !== 'undefined' && AMap.Geolocation) {
            const geolocation = new AMap.Geolocation({
                enableHighAccuracy: true,
                timeout: 10000,
                GeoLocationFirst: true
            })
            geolocation.getCurrentPosition((status, result) => {
                if (status === 'complete') {
                    state.location = {
                        latitude: result.position.lat,
                        longitude: result.position.lng,
                        address: ''
                    }
                    reverseGeocode(result.position.lat, result.position.lng)
                } else {
                    locateByBrowser()
                }
            })
        } else {
            locateByBrowser()
        }
    }

    /**
     * 浏览器原生定位（WGS84），需转换为 GCJ02
     */
    function locateByBrowser() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    // WGS84 转 GCJ02
                    const gcj02 = wgs84ToGcj02(pos.coords.longitude, pos.coords.latitude)
                    state.location = {
                        latitude: gcj02.latitude,
                        longitude: gcj02.longitude,
                        address: ''
                    }
                    reverseGeocode(gcj02.latitude, gcj02.longitude)
                },
                () => {
                    state.location = {
                        latitude: 39.908823,
                        longitude: 116.397470,
                        address: '北京市东城区（默认位置）'
                    }
                    renderStepContent()
                    LJ.mobile.showToast('定位失败，使用默认位置')
                }
            )
        } else {
            state.location = {
                latitude: 39.908823,
                longitude: 116.397470,
                address: '北京市东城区（默认位置）'
            }
            renderStepContent()
        }
    }

    /**
     * WGS84 坐标转 GCJ02 坐标（火星坐标系）
     * @param {number} lng - 经度
     * @param {number} lat - 纬度
     * @returns {{longitude: number, latitude: number}} GCJ02 坐标
     */
    function wgs84ToGcj02(lng, lat) {
        const a = 6378245.0
        const ee = 0.00669342162296594323
        let dLat = transformLat(lng - 105.0, lat - 35.0)
        let dLng = transformLng(lng - 105.0, lat - 35.0)
        const radLat = (lat / 180.0) * Math.PI
        let magic = Math.sin(radLat)
        magic = 1 - ee * magic * magic
        const sqrtMagic = Math.sqrt(magic)
        dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * Math.PI)
        dLng = (dLng * 180.0) / (a / sqrtMagic * Math.cos(radLat) * Math.PI)
        return { longitude: lng + dLng, latitude: lat + dLat }
    }

    /**
     * 纬度转换辅助函数
     */
    function transformLat(x, y) {
        let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x))
        ret += (20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0 / 3.0
        ret += (20.0 * Math.sin(y * Math.PI) + 40.0 * Math.sin(y / 3.0 * Math.PI)) * 2.0 / 3.0
        ret += (160.0 * Math.sin(y / 12.0 * Math.PI) + 320 * Math.sin(y * Math.PI / 30.0)) * 2.0 / 3.0
        return ret
    }

    /**
     * 经度转换辅助函数
     */
    function transformLng(x, y) {
        let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x))
        ret += (20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0 / 3.0
        ret += (20.0 * Math.sin(x * Math.PI) + 40.0 * Math.sin(x / 3.0 * Math.PI)) * 2.0 / 3.0
        ret += (150.0 * Math.sin(x / 12.0 * Math.PI) + 300.0 * Math.sin(x / 30.0 * Math.PI)) * 2.0 / 3.0
        return ret
    }

    /**
     * 逆地理编码（使用高德 REST API，与 key 平台匹配）
     * 地址格式：市区+道路，如"西安市雁塔区松风路"
     */
    function reverseGeocode(lat, lng) {
        const url = `https://restapi.amap.com/v3/geocode/regeo?key=a47b35619b3fd91ba3c61ee001ccf472&location=${lng},${lat}&extensions=all&radius=1000`
        fetch(url)
            .then((res) => res.json())
            .then((data) => {
                if (data.status === '1' && data.regeocode) {
                    const regeocode = data.regeocode
                    const comp = regeocode.addressComponent || {}
                    // city/district 可能是空数组，需判断
                    const city = Array.isArray(comp.city) ? '' : (comp.city || '')
                    const district = Array.isArray(comp.district) ? '' : (comp.district || '')
                    // road 字段有值时是字符串，无值时是空数组
                    const road = Array.isArray(comp.road) ? '' : (comp.road || '')
                    const roads = regeocode.roads || []
                    const firstRoad = roads.length > 0 ? (roads[0].name || '') : ''
                    const pois = regeocode.pois || []
                    const firstPoi = pois.length > 0 ? (pois[0].name || '') : ''
                    const addr = regeocode.formatted_address || ''

                    // 拼接"市区道路"格式
                    const cityPart = city || ''
                    const districtPart = district || ''
                    const roadPart = road || firstRoad || firstPoi || ''
                    let formattedAddr = ''
                    if (cityPart && districtPart && roadPart) {
                        formattedAddr = `${cityPart}${districtPart}${roadPart}`
                    } else if (districtPart && roadPart) {
                        formattedAddr = `${districtPart}${roadPart}`
                    } else if (roadPart) {
                        formattedAddr = roadPart
                    } else {
                        // 无道路信息时，使用格式化地址去掉省市前缀
                        formattedAddr = addr.replace(/^.*?省/, '').replace(/^.*?市/, '') || addr || `${lat.toFixed(6)}, ${lng.toFixed(6)}`
                    }
                    state.location.address = formattedAddr
                } else {
                    state.location.address = `${lat.toFixed(6)}, ${lng.toFixed(6)}`
                }
                renderStepContent()
            })
            .catch(() => {
                state.location.address = `${lat.toFixed(6)}, ${lng.toFixed(6)}`
                renderStepContent()
            })
    }

    /**
     * 提交上报
     */
    async function submitReport() {
        if (state.submitting) return
        state.submitting = true
        renderStepContent()

        try {
            const res = await LJ.mockApi.submitReport({
                typeId: state.aiResult.problemTypeId,
                description: state.description,
                location: state.location,
                imageIds: [state.photoPath]
            })
            if (res.code === 0) {
                state.orderId = res.data.orderId
                state.step = 6
                renderSteps()
                renderStepContent()
            } else {
                LJ.mobile.showToast(res.message || '提交失败')
                state.submitting = false
                renderStepContent()
            }
        } catch (err) {
            console.error('提交失败：', err)
            LJ.mobile.showToast('提交失败，请重试')
            state.submitting = false
            renderStepContent()
        }
    }

    /**
     * 页面挂载
     */
    function onMount() {
        // 重置状态
        Object.assign(state, {
            step: 1, photoPath: '', aiLoading: false,
            aiResult: { facilityType: '', facilityTypeId: '', problemType: '', problemTypeId: '', confidence: 0 },
            location: { latitude: 0, longitude: 0, address: '' },
            description: '', submitting: false, orderId: ''
        })
        renderSteps()
        renderStepContent()
    }

    LJ.mobile.pages.report = { render, onMount }
})(window)
