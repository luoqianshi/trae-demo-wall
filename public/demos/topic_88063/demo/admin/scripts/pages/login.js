/**
 * 登录页
 * 管理员登录，支持三种角色快捷登录
 */
(function (global) {
    const LJ = global.LJ || (global.LJ = {})
    LJ.admin = LJ.admin || {}
    LJ.admin.pages = LJ.admin.pages || {}

    /**
     * 渲染登录页
     */
    function render() {
        return `
      <div class="login-page">
        <div class="login-box">
          <div class="login-logo">
            <div class="logo-icon" style="background: var(--color-primary); width:64px; height:64px; border-radius: var(--radius-md); display:flex; align-items:center; justify-content:center; margin:0 auto 12px; color:#fff; font-size:28px; font-weight:700;">路</div>
            <h1>路见管理后台</h1>
            <p>无障碍设施上报平台</p>
          </div>
          <form class="login-form" id="loginForm">
            <div class="form-group">
              <label class="form-label" for="username">用户名</label>
              <input type="text" class="form-input" id="username" name="username" placeholder="请输入用户名" value="admin" autocomplete="username" required>
            </div>
            <div class="form-group">
              <label class="form-label" for="password">密码</label>
              <input type="password" class="form-input" id="password" name="password" placeholder="请输入密码" value="123456" autocomplete="current-password" required>
            </div>
            <button type="submit" class="btn btn-primary btn-lg" style="width:100%;" id="loginBtn">登 录</button>
          </form>
          <div class="login-tips">
            <p><strong>演示账号：</strong></p>
            <p>· admin / 123456 （超级管理员）</p>
            <p>· auditor / 123456 （审核员）</p>
            <p>· handler / 123456 （处理员）</p>
          </div>
        </div>
      </div>
    `
    }

    /**
     * 页面挂载
     */
    function onMount(container) {
        const form = container.querySelector('#loginForm')
        form.addEventListener('submit', async (e) => {
            e.preventDefault()
            const username = container.querySelector('#username').value.trim()
            const password = container.querySelector('#password').value.trim()
            const btn = container.querySelector('#loginBtn')

            if (!username || !password) {
                LJ.admin.showToast('请输入用户名和密码')
                return
            }

            btn.disabled = true
            btn.textContent = '登录中…'

            try {
                const res = await LJ.mockAdminApi.login(username, password)
                if (res.code === 0) {
                    LJ.admin.showToast('登录成功')
                    setTimeout(() => LJ.admin.navigate('/dashboard'), 500)
                } else {
                    LJ.admin.showToast(res.message || '登录失败')
                    btn.disabled = false
                    btn.textContent = '登 录'
                }
            } catch (err) {
                console.error('登录失败：', err)
                LJ.admin.showToast('登录失败，请重试')
                btn.disabled = false
                btn.textContent = '登 录'
            }
        })
    }

    LJ.admin.pages.login = { render, onMount }
})(window)
