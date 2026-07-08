/**
 * Mobile 端应用入口
 * 路由管理、导航栏控制、全局工具方法
 * 挂载到 window.LJ.mobile
 */
(function (global) {
    const LJ = global.LJ || (global.LJ = {})
    LJ.mobile = LJ.mobile || {}
    LJ.mobile.pages = LJ.mobile.pages || {}

    /**
     * 路由配置表
     * path: { page, title, showTabbar, showBack }
     */
    const routes = {
        '/': { page: 'index', title: '路见', showTabbar: true, showBack: false },
        '/report': { page: 'report', title: '问题上报', showTabbar: false, showBack: true },
        '/my-reports': { page: 'my-reports', title: '我的上报', showTabbar: true, showBack: false },
        '/report-detail': { page: 'report-detail', title: '上报详情', showTabbar: false, showBack: true },
        '/verify': { page: 'verify', title: '修复验证', showTabbar: false, showBack: true },
        '/profile': { page: 'profile', title: '我的', showTabbar: true, showBack: false }
    }

    let currentPage = null  // 当前页面实例
    let toastTimer = null   // toast 定时器

    /**
     * 解析当前 hash，返回路径和参数
     */
    function parseHash() {
        const hash = location.hash.slice(1) || '/'
        const [path, queryStr] = hash.split('?')
        const params = {}
        if (queryStr) {
            queryStr.split('&').forEach((pair) => {
                const [key, value] = pair.split('=')
                params[decodeURIComponent(key)] = decodeURIComponent(value || '')
            })
        }
        return { path, params }
    }

    /**
     * 页面跳转
     * @param {string} path - 路由路径
     * @param {Object} [params] - 查询参数
     */
    function navigate(path, params = {}) {
        let hash = path
        const keys = Object.keys(params)
        if (keys.length > 0) {
            const query = keys.map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`).join('&')
            hash = `${path}?${query}`
        }
        location.hash = hash
    }

    /**
     * 返回上一页
     */
    function navigateBack() {
        if (history.length > 1) {
            history.back()
        } else {
            navigate('/')
        }
    }

    /**
     * 更新 TabBar 角标（我的上报未读反馈数）
     */
    async function updateTabbarBadge() {
        try {
            const res = await LJ.mockApi.getUnreadFeedbackCount()
            const badge = document.getElementById('myReportsBadge')
            if (!badge) return
            const count = res.data.count
            if (count > 0) {
                badge.textContent = count > 99 ? '99+' : count
                badge.style.display = 'inline-block'
            } else {
                badge.style.display = 'none'
            }
        } catch (err) {
            console.warn('更新角标失败：', err)
        }
    }

    /**
     * 渲染当前页面
     */
    async function renderPage() {
        const { path, params } = parseHash()
        const route = routes[path] || routes['/']
        const pageModule = LJ.mobile.pages[route.page]

        // 更新导航栏
        document.getElementById('navbarTitle').textContent = route.title
        document.getElementById('navbarBack').style.display = route.showBack ? 'flex' : 'none'
        // 动态更新页面标题
        document.title = `${route.title} - 路见`

        // 更新 TabBar
        const tabbar = document.getElementById('tabbar')
        tabbar.style.display = route.showTabbar ? 'flex' : 'none'
        if (route.showTabbar) {
            tabbar.querySelectorAll('.tabbar-item').forEach((item) => {
                const isActive = item.dataset.path === path
                item.classList.toggle('active', isActive)
                item.setAttribute('aria-selected', isActive ? 'true' : 'false')
            })
        }

        // 内容区显示 loading
        const content = document.getElementById('appContent')
        content.innerHTML = '<div class="page-loading" aria-live="polite"><div class="loading-spinner" role="img" aria-label="加载中"></div><p>加载中…</p></div>'

        // 调用页面的销毁方法（如果存在）
        if (currentPage && currentPage.onDestroy) {
            currentPage.onDestroy()
        }

        try {
            // 渲染页面 HTML
            if (pageModule && pageModule.render) {
                content.innerHTML = pageModule.render(params)
                // 滚动到顶部
                content.scrollTop = 0
                // 调用挂载方法
                if (pageModule.onMount) {
                    currentPage = pageModule
                    await pageModule.onMount(content, params)
                }
                // 页面渲染后更新角标
                updateTabbarBadge()
            } else {
                content.innerHTML = '<div class="empty-state"><div class="empty-icon" aria-hidden="true">⚠️</div><p>页面未找到</p></div>'
            }
        } catch (err) {
            console.error('页面渲染失败：', err)
            content.innerHTML = '<div class="empty-state"><div class="empty-icon" aria-hidden="true">⚠️</div><p>页面加载失败</p></div>'
        }
    }

    /**
     * 显示 Toast
     * @param {string} msg - 消息
     * @param {number} [duration=2000] - 持续时间
     */
    function showToast(msg, duration = 2000) {
        const existing = document.querySelector('.toast')
        if (existing) existing.remove()
        if (toastTimer) clearTimeout(toastTimer)

        const toast = document.createElement('div')
        toast.className = 'toast'
        toast.textContent = msg
        toast.setAttribute('role', 'status')
        toast.setAttribute('aria-live', 'polite')
        document.querySelector('.phone-shell').appendChild(toast)

        toastTimer = setTimeout(() => toast.remove(), duration)
    }

    /**
     * 显示大图预览（点击遮罩或图片关闭，支持 ESC 键）
     * @param {string} src - 图片地址
     */
    function showImagePreview(src) {
        const mask = document.createElement('div')
        mask.className = 'image-preview-mask'
        mask.setAttribute('role', 'dialog')
        mask.setAttribute('aria-modal', 'true')
        mask.setAttribute('aria-label', '图片预览')
        mask.innerHTML = `<img class="image-preview-img" src="${src}" alt="预览图片">`
        document.querySelector('.phone-shell').appendChild(mask)
        // 点击遮罩或图片关闭预览
        mask.addEventListener('click', () => {
            mask.remove()
            document.removeEventListener('keydown', escHandler)
        })
        // 支持 ESC 键关闭
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                mask.remove()
                document.removeEventListener('keydown', escHandler)
            }
        }
        document.addEventListener('keydown', escHandler)
    }

    /**
     * 显示模态弹窗
     * @param {Object} opts - { title, content, confirmText, cancelText, onConfirm, onCancel, showCancel }
     */
    function showModal(opts = {}) {
        const mask = document.createElement('div')
        mask.className = 'modal-mask'
        mask.setAttribute('role', 'dialog')
        mask.setAttribute('aria-modal', 'true')
        if (opts.title) mask.setAttribute('aria-label', opts.title)
        mask.innerHTML = `
      <div class="modal">
        <div class="modal-header">${LJ.utils.escapeHtml(opts.title || '提示')}</div>
        <div class="modal-body">${LJ.utils.escapeHtml(opts.content || '')}</div>
        <div class="modal-footer">
          ${opts.showCancel !== false ? `<button type="button" class="btn btn-outline" data-action="cancel">${opts.cancelText || '取消'}</button>` : ''}
          <button type="button" class="btn btn-primary" data-action="confirm">${opts.confirmText || '确定'}</button>
        </div>
      </div>
    `
        document.querySelector('.phone-shell').appendChild(mask)

        mask.addEventListener('click', (e) => {
            const action = e.target.dataset.action
            if (action === 'confirm') {
                mask.remove()
                document.removeEventListener('keydown', escHandler)
                opts.onConfirm && opts.onConfirm()
            } else if (action === 'cancel' || e.target === mask) {
                mask.remove()
                document.removeEventListener('keydown', escHandler)
                opts.onCancel && opts.onCancel()
            }
        })

        // 支持 ESC 键关闭弹窗
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                mask.remove()
                document.removeEventListener('keydown', escHandler)
                opts.onCancel && opts.onCancel()
            }
        }
        document.addEventListener('keydown', escHandler)
    }

    /**
     * 初始化应用
     */
    function init() {
        // 初始化数据
        LJ.mockApi.initData()

        // 状态栏时间
        const updateTime = () => {
            const now = new Date()
            document.getElementById('statusTime').textContent =
                `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
        }
        updateTime()
        setInterval(updateTime, 30000)

        // TabBar 点击
        document.getElementById('tabbar').addEventListener('click', (e) => {
            const item = e.target.closest('.tabbar-item')
            if (item) navigate(item.dataset.path)
        })

        // 导航栏返回
        document.getElementById('navbarBack').addEventListener('click', navigateBack)

        // 路由变化
        window.addEventListener('hashchange', renderPage)

        // 首次渲染
        renderPage()

        // 初始化角标
        updateTabbarBadge()
    }

    // 暴露 API
    LJ.mobile.navigate = navigate
    LJ.mobile.navigateBack = navigateBack
    LJ.mobile.showToast = showToast
    LJ.mobile.showModal = showModal
    LJ.mobile.showImagePreview = showImagePreview
    LJ.mobile.renderPage = renderPage
    LJ.mobile.updateTabbarBadge = updateTabbarBadge

    // DOM Ready 启动
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init)
    } else {
        init()
    }
})(window)
