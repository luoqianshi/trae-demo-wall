// 登录权限检查
(function() {
    var username = localStorage.getItem('username');
    var userRole = localStorage.getItem('userRole');
    
    if (!username || !userRole) {
        // 未登录，跳转到登录页面，保存当前页面地址
        var currentPath = window.location.pathname.split('/').pop() || 'index.html';
        // 排除登录页面本身，防止循环重定向
        if (currentPath === 'login.html') return;
        window.location.href = 'login.html?redirect=' + encodeURIComponent(currentPath);
        return;
    }
    
    // 已登录，设置全局用户信息
    window.currentUser = {
        username: username,
        name: localStorage.getItem('userName') || username,
        role: userRole,
        avatar: localStorage.getItem('userAvatar') || null
    };
    
    // 角色权限定义
    window.permissions = {
        admin: ['all'],
        teacher: ['view', 'control', 'manage_students', 'manage_tasks', 'manage_assessments', 'view_data'],
        student: ['view', 'control_limited', 'view_own_tasks', 'view_own_assessments', 'view_resources']
    };
    
    // 检查权限
    window.hasPermission = function(permission) {
        var role = window.currentUser.role;
        var perms = window.permissions[role] || [];
        return perms.indexOf('all') !== -1 || perms.indexOf(permission) !== -1;
    };
    
    // 登出函数
    window.logout = function() {
        localStorage.removeItem('username');
        localStorage.removeItem('userName');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userAvatar');
        localStorage.removeItem('rememberMe');
        window.location.href = 'login.html';
    };
    
    // 根据角色隐藏/显示页面元素
    document.addEventListener('DOMContentLoaded', function() {
        // 管理员专属元素
        var adminEls = document.querySelectorAll('[role-admin]');
        for (var i = 0; i < adminEls.length; i++) {
            adminEls[i].style.display = window.hasPermission('all') ? '' : 'none';
        }
        // 教师专属元素
        var teacherEls = document.querySelectorAll('[role-teacher]');
        for (var i = 0; i < teacherEls.length; i++) {
            teacherEls[i].style.display = (window.hasPermission('manage_students') || window.hasPermission('all')) ? '' : 'none';
        }
        // 学生专属元素
        var studentEls = document.querySelectorAll('[role-student]');
        for (var i = 0; i < studentEls.length; i++) {
            studentEls[i].style.display = (window.currentUser.role === 'student') ? '' : 'none';
        }
        
        // 更新页面上的用户名显示
        var usernameEls = document.querySelectorAll('[data-username]');
        for (var i = 0; i < usernameEls.length; i++) {
            usernameEls[i].textContent = window.currentUser.name;
        }
        var roleEls = document.querySelectorAll('[data-userrole]');
        var roleNames = { admin: '管理员', teacher: '教师', student: '学生' };
        for (var i = 0; i < roleEls.length; i++) {
            roleEls[i].textContent = roleNames[window.currentUser.role] || window.currentUser.role;
        }
    });
})();
