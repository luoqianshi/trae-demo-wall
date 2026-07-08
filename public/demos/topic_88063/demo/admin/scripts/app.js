/**
 * Admin 端应用入口
 * 路由管理、登录拦截、布局渲染
 * 挂载到 window.LJ.admin
 */
(function (global) {
    const LJ = global.LJ || (global.LJ = {})
    LJ.admin = LJ.admin || {}
    LJ.admin.pages = LJ.admin.pages || {}

    /**
     * 路由配置表
     * path: { page, title, requireAuth }
     */
    const routes = {
        '/login': { page: 'login', title: '登录', requireAuth: false },
        '/dashboard': { page: 'dashboard', title: '数据看板', requireAuth: true },
        '/reports': { page: 'reports', title: '工单管理', requireAuth: true },
        '/report-detail': { page: 'report-detail', title: '工单详情', requireAuth: true },
        '/statistics': { page: 'statistics', title: '统计分析', requireAuth: true },
        '/users': { page: 'users', title: '上报者管理', requireAuth: true }
    }

    let currentPage = null
    let toastTimer = null

    /**
     * 解析当前 hash
     */
    function parseHash() {
        const hash = location.hash.slice(1) || '/login'
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
     * 渲染侧边栏菜单
     */
    function renderSidebar(currentPath) {
        const { ADMIN_MENUS } = LJ.constants
        const menuEl = document.getElementById('sidebarMenu')
        menuEl.innerHTML = ADMIN_MENUS.map((m) => {
            const isActive = currentPath === m.path.slice(1)
            return `
      <button type="button" class="menu-item ${isActive ? 'active' : ''}" data-path="${m.path}" aria-current="${isActive ? 'page' : 'false'}">
        <span class="icon" aria-hidden="true">${m.icon}</span>
        <span>${m.name}</span>
      </button>
    `
        }).join('')

        menuEl.querySelectorAll('.menu-item').forEach((item) => {
            item.addEventListener('click', () => navigate(item.dataset.path.slice(1)))
        })
    }

    /**
     * 渲染顶栏用户信息
     */
    function renderHeader(route) {
        document.getElementById('headerTitle').textContent = route.title
        const admin = LJ.mockAdminApi.getCurrentAdmin()
        if (admin) {
            document.getElementById('userAvatar').src = admin.avatar
            document.getElementById('userName').textContent = admin.name
            const { ADMIN_ROLES } = LJ.constants
            const role = ADMIN_ROLES.find((r) => r.id === admin.role)
            document.getElementById('userRole').textContent = role ? role.name : ''
        }
    }

    /**
     * 渲染当前页面
     */
    async function renderPage() {
        const { path, params } = parseHash()
        const route = routes[path] || routes['/dashboard']

        // 登录拦截
        const admin = LJ.mockAdminApi.getCurrentAdmin()
        if (route.requireAuth && !admin) {
            navigate('/login')
            return
        }
        // 已登录访问登录页，跳转到看板
        if (path === '/login' && admin) {
            navigate('/dashboard')
            return
        }

        const pageModule = LJ.admin.pages[route.page]
        const layout = document.getElementById('adminLayout')

        // 动态更新页面标题
        document.title = `${route.title} - 路见管理后台`

        // 登录页隐藏侧边栏和顶栏
        if (path === '/login') {
            layout.classList.add('login-mode')
        } else {
            layout.classList.remove('login-mode')
            renderSidebar(path)
            renderHeader(route)
        }

        // 内容区 loading
        const content = document.getElementById('adminContent')
        content.innerHTML = '<div class="page-loading"><div class="loading-spinner" role="img" aria-label="加载中"></div><p>加载中…</p></div>'

        // 销毁上一页
        if (currentPage && currentPage.onDestroy) {
            currentPage.onDestroy()
        }

        try {
            if (pageModule && pageModule.render) {
                content.innerHTML = pageModule.render(params)
                content.scrollTop = 0
                if (pageModule.onMount) {
                    currentPage = pageModule
                    await pageModule.onMount(content, params)
                }
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
        document.body.appendChild(toast)

        toastTimer = setTimeout(() => toast.remove(), duration)
    }

    /**
     * 显示模态弹窗
     */
    function showModal(opts = {}) {
        const mask = document.createElement('div')
        mask.className = 'modal-mask'
        mask.setAttribute('role', 'dialog')
        mask.setAttribute('aria-modal', 'true')
        if (opts.title) mask.setAttribute('aria-label', opts.title)
        mask.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <span>${LJ.utils.escapeHtml(opts.title || '提示')}</span>
          <button type="button" class="modal-close" data-action="close" aria-label="关闭弹窗"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
        </div>
        <div class="modal-body">${opts.content || ''}</div>
        <div class="modal-footer">
          ${opts.showCancel !== false ? `<button type="button" class="btn btn-outline" data-action="cancel">${opts.cancelText || '取消'}</button>` : ''}
          <button type="button" class="btn btn-primary" data-action="confirm">${opts.confirmText || '确定'}</button>
        </div>
      </div>
    `
        document.body.appendChild(mask)

        // 支持 ESC 关闭弹窗
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                mask.remove()
                document.removeEventListener('keydown', escHandler)
                opts.onCancel && opts.onCancel()
            }
        }
        document.addEventListener('keydown', escHandler)

        mask.addEventListener('click', async (e) => {
            // 用 closest 查找带 data-action 的祖先元素（兼容按钮内嵌 SVG/图标的情况）
            const actionEl = e.target.closest('[data-action]')
            const action = actionEl ? actionEl.dataset.action : ''

            if (action === 'confirm') {
                // 先执行 onConfirm，再根据返回值决定是否关闭弹窗
                if (opts.onConfirm) {
                    const result = await opts.onConfirm()
                    if (result === false) return
                }
                mask.remove()
                document.removeEventListener('keydown', escHandler)
            } else if (action === 'cancel' || action === 'close' || e.target === mask) {
                mask.remove()
                document.removeEventListener('keydown', escHandler)
                opts.onCancel && opts.onCancel()
            }
        })
    }

    /**
     * 初始化
     */
    function init() {
        LJ.mockApi.initData()

        // 退出登录
        document.getElementById('logoutBtn').addEventListener('click', () => {
            showModal({
                title: '确认退出',
                content: '确定要退出登录吗？',
                onConfirm: async () => {
                    await LJ.mockAdminApi.logout()
                    navigate('/login')
                }
            })
        })

        window.addEventListener('hashchange', renderPage)
        renderPage()
    }

    LJ.admin.navigate = navigate
    LJ.admin.showToast = showToast
    LJ.admin.showModal = showModal

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init)
    } else {
        init()
    }
})(window)
