/**
 * 修复验证页
 * 用户拍摄修复后照片、确认位置并提交验证结果
 */
(function (global) {
    const LJ = global.LJ || (global.LJ = {})
    LJ.mobile.pages = LJ.mobile.pages || {}

    const { MAX_VERIFY_DISTANCE } = LJ.constants

    // 页面状态
    const state = {
        reportId: '',
        originalReport: null,
        verifyPhoto: '',
        location: null,
        distanceOk: false,
        verifyResult: null,
        submitting: false
    }

    /**
     * 渲染页面骨架
     */
    function render() {
        return `
      <div class="page" id="verifyPage">
        <div class="page-loading"><div class="loading-spinner" role="img" aria-label="加载中"></div><p>加载中…</p></div>
      </div>
    `
    }

    /**
     * 页面挂载
     */
    async function onMount(container, params) {
        if (!params.id) {
            container.querySelector('#verifyPage').innerHTML = '<div class="empty-state"><div class="empty-icon" aria-hidden="true">⚠️</div><p>参数错误</p></div>'
            return
        }
        state.reportId = params.id
        await loadOriginalReport(container)
    }

    /**
     * 加载原始上报信息
     */
    async function loadOriginalReport(container) {
        try {
            const res = await LJ.mockApi.getReportDetail(state.reportId)
            if (res.code !== 0) {
                container.querySelector('#verifyPage').innerHTML = '<div class="empty-state"><div class="empty-icon" aria-hidden="true">⚠️</div><p>记录不存在</p></div>'
                return
            }
            state.originalReport = res.data
            renderPage(container)
            bindEvents(container)
        } catch (err) {
            console.error('加载失败：', err)
            container.querySelector('#verifyPage').innerHTML = '<div class="empty-state"><div class="empty-icon" aria-hidden="true">⚠️</div><p>加载失败</p></div>'
        }
    }

    /**
     * 渲染页面
     */
    function renderPage(container) {
        const r = state.originalReport
        container.querySelector('#verifyPage').innerHTML = `
      <!-- 原始上报信息 -->
      <div class="verify-section">
        <h3>原始上报信息</h3>
        <div class="verify-original">
          <div style="font-size:15px;font-weight:600;margin-bottom:6px;">${LJ.utils.escapeHtml(r.title)}</div>
          <div style="font-size:13px;color:var(--color-text-secondary);margin-bottom:4px;">📍 ${LJ.utils.escapeHtml(r.location.address)}</div>
          <div style="font-size:13px;color:var(--color-text-secondary);">🕐 ${r.createTime}</div>
        </div>
      </div>

      <!-- 拍摄修复照片 -->
      <div class="verify-section">
        <h3>拍摄修复后照片</h3>
        <div id="photoArea">
          ${state.verifyPhoto ? `
            <div class="photo-preview">
              <img src="${state.verifyPhoto}" alt="修复照片">
              <button type="button" class="retake-btn" id="retakeBtn">重新拍摄</button>
            </div>
          ` : `
            <button type="button" class="photo-area" id="takePhotoBtn" aria-label="点击拍摄修复后的现场照片">
              <div class="photo-icon" aria-hidden="true">📷</div>
              <div class="photo-text">点击拍摄修复后的现场照片</div>
            </button>
          `}
        </div>
        <input type="file" id="fileInput" accept="image/*" style="display:none;" capture="environment">
      </div>

      <!-- 位置校验 -->
      <div class="verify-section">
        <h3>位置校验</h3>
        <p style="font-size:13px;color:var(--color-text-secondary);margin-bottom:12px;">需在问题现场 ${MAX_VERIFY_DISTANCE} 米范围内进行验证</p>
        <button type="button" class="btn btn-outline btn-block" id="checkLocBtn">📍 获取当前位置</button>
        <div id="locationResult" aria-live="polite"></div>
      </div>

      <!-- 验证结果 -->
      <div class="verify-section">
        <h3>验证结果</h3>
        <div class="verify-result-options" role="radiogroup" aria-label="验证结果">
          <button type="button" class="verify-result-option ${state.verifyResult === true ? 'selected' : ''}" data-result="true" role="radio" aria-checked="${state.verifyResult === true ? 'true' : 'false'}" aria-label="已修复">
            <div class="icon" aria-hidden="true">✅</div>
            <div class="text">已修复</div>
          </button>
          <button type="button" class="verify-result-option ${state.verifyResult === false ? 'selected' : ''}" data-result="false" role="radio" aria-checked="${state.verifyResult === false ? 'true' : 'false'}" aria-label="未修复">
            <div class="icon" aria-hidden="true">❌</div>
            <div class="text">未修复</div>
          </button>
        </div>
      </div>

      <!-- 提交按钮 -->
      <div style="padding:12px 0 24px;">
        <button type="button" class="btn btn-primary btn-block btn-lg" id="submitBtn" ${!canSubmit() ? 'disabled' : ''}>
          ${state.submitting ? '提交中…' : '提交验证'}
        </button>
      </div>
    `
    }

    /**
     * 是否可以提交
     */
    function canSubmit() {
        return state.verifyPhoto && state.verifyResult !== null
    }

    /**
     * 绑定事件
     */
    function bindEvents(container) {
        // 拍照
        const fileInput = container.querySelector('#fileInput')
        const takePhotoBtn = container.querySelector('#takePhotoBtn')
        const retakeBtn = container.querySelector('#retakeBtn')

        if (takePhotoBtn) takePhotoBtn.addEventListener('click', () => fileInput.click())
        if (retakeBtn) retakeBtn.addEventListener('click', () => {
            state.verifyPhoto = ''
            renderPage(container)
            bindEvents(container)
        })
        if (fileInput) fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0]
            if (!file) return
            const reader = new FileReader()
            reader.onload = (ev) => {
                state.verifyPhoto = ev.target.result
                renderPage(container)
                bindEvents(container)
            }
            reader.readAsDataURL(file)
        })

        // 位置校验
        const checkLocBtn = container.querySelector('#checkLocBtn')
        if (checkLocBtn) checkLocBtn.addEventListener('click', () => checkLocation(container))

        // 验证结果选择
        container.querySelectorAll('.verify-result-option').forEach((opt) => {
            opt.addEventListener('click', () => {
                state.verifyResult = opt.dataset.result === 'true'
                renderPage(container)
                bindEvents(container)
            })
        })

        // 提交
        const submitBtn = container.querySelector('#submitBtn')
        if (submitBtn) submitBtn.addEventListener('click', () => submitVerify(container))
    }

    /**
     * 检查位置
     * 优先使用高德 Geolocation 插件获取 GCJ02 坐标（与工单坐标系一致）
     * 回退到浏览器定位（WGS84）并转换为 GCJ02
     */
    function checkLocation(container) {
        const resultEl = container.querySelector('#locationResult')
        resultEl.innerHTML = '<div style="padding:10px;text-align:center;color:var(--color-text-tertiary);">定位中…</div>'

        // 优先使用高德 Geolocation 插件，自动返回 GCJ02 坐标
        if (typeof AMap !== 'undefined' && AMap.Geolocation) {
            console.log('[验证定位] 使用高德 Geolocation 插件')
            const geolocation = new AMap.Geolocation({
                enableHighAccuracy: true,
                timeout: 10000,
                GeoLocationFirst: true
            })
            geolocation.getCurrentPosition((status, result) => {
                if (status === 'complete') {
                    console.log('[验证定位] 高德定位成功：', result.position)
                    calcDistanceAndRender(
                        container,
                        result.position.lat,
                        result.position.lng
                    )
                } else {
                    console.warn('[验证定位] 高德定位失败，回退浏览器定位：', result)
                    locateByBrowser(container)
                }
            })
        } else {
            console.log('[验证定位] 高德插件未就绪，使用浏览器定位')
            locateByBrowser(container)
        }
    }

    /**
     * 浏览器定位回退方案
     * 获取 WGS84 坐标后转换为 GCJ02，再与工单位置比较
     */
    function locateByBrowser(container) {
        if (!navigator.geolocation) {
            // 不支持定位，模拟在范围内
            state.location = { latitude: 39.908823, longitude: 116.397470, distance: 15 }
            state.distanceOk = true
            renderLocationResult(container)
            return
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                console.log('[验证定位] 浏览器定位成功（WGS84）：', pos.coords.latitude, pos.coords.longitude)
                // WGS84 转 GCJ02
                const gcj02 = LJ.utils.wgs84ToGcj02(pos.coords.longitude, pos.coords.latitude)
                console.log('[验证定位] 转换为 GCJ02：', gcj02)
                calcDistanceAndRender(container, gcj02.latitude, gcj02.longitude)
            },
            () => {
                // 定位失败，模拟在范围内
                state.location = { latitude: 39.908823, longitude: 116.397470, distance: 15 }
                state.distanceOk = true
                renderLocationResult(container)
                LJ.mobile.showToast('定位失败，已模拟位置')
            }
        )
    }

    /**
     * 计算与工单位置的距离并渲染结果
     * @param {HTMLElement} container - 页面容器
     * @param {number} lat - 当前位置纬度（GCJ02）
     * @param {number} lng - 当前位置经度（GCJ02）
     */
    function calcDistanceAndRender(container, lat, lng) {
        const orig = state.originalReport.location
        const distance = LJ.utils.calcDistance(lat, lng, orig.latitude, orig.longitude)
        state.location = {
            latitude: lat,
            longitude: lng,
            distance: Math.round(distance)
        }
        state.distanceOk = distance <= MAX_VERIFY_DISTANCE
        renderLocationResult(container)
    }

    /**
     * 渲染位置结果
     */
    function renderLocationResult(container) {
        const resultEl = container.querySelector('#locationResult')
        if (!resultEl) return
        const cls = state.distanceOk ? 'ok' : 'fail'
        const text = state.distanceOk
            ? `✓ 距离问题位置 ${state.location.distance} 米，在验证范围内`
            : `✗ 距离问题位置 ${state.location.distance} 米，超出验证范围`
        resultEl.innerHTML = `<div class="verify-distance ${cls}">${text}</div>`
    }

    /**
     * 提交验证
     */
    async function submitVerify(container) {
        if (!canSubmit() || state.submitting) return
        state.submitting = true
        renderPage(container)
        bindEvents(container)

        try {
            const res = await LJ.mockApi.verifyReport(
                state.reportId,
                state.verifyResult,
                state.verifyPhoto,
                state.verifyResult ? '确认已修复' : '未修复，需继续处理'
            )

            if (res.code === 0) {
                LJ.mobile.showModal({
                    title: '验证成功',
                    content: state.verifyResult
                        ? '感谢您的验证！您为无障碍环境改善做出了贡献。'
                        : '感谢您的反馈！我们会通知相关部门继续处理。',
                    showCancel: false,
                    confirmText: '好的',
                    onConfirm: () => LJ.mobile.navigateBack()
                })
            } else {
                LJ.mobile.showToast(res.message || '提交失败')
                state.submitting = false
                renderPage(container)
                bindEvents(container)
            }
        } catch (err) {
            console.error('提交验证失败：', err)
            LJ.mobile.showToast('提交失败，请重试')
            state.submitting = false
            renderPage(container)
            bindEvents(container)
        }
    }

    LJ.mobile.pages.verify = { render, onMount }
})(window)
