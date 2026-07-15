function initAdmin() {
    updateStats();
    renderRecentTasks();
    renderAdminTasks();
    renderAdminUsers();
}

function showAdminPage(pageId) {
    document.querySelectorAll('.admin-page').forEach(page => page.classList.remove('active'));
    document.querySelectorAll('.nav-links a').forEach(link => link.classList.remove('active'));
    
    document.getElementById(pageId + '-page').classList.add('active');
    
    var activeLink = document.querySelector('.nav-links a[onclick*="' + pageId + '"]');
    if (activeLink) {
        activeLink.classList.add('active');
    }
    
    if (pageId === 'tasks') {
        renderAdminTasks();
    } else if (pageId === 'users') {
        renderAdminUsers();
    } else if (pageId === 'dashboard') {
        updateStats();
        renderRecentTasks();
    }
}

function updateStats() {
    document.getElementById('stat-total').textContent = mockData.stats.totalTasks;
    document.getElementById('stat-pending').textContent = mockData.stats.pendingTasks;
    document.getElementById('stat-completed').textContent = mockData.stats.completedServices;
    document.getElementById('stat-active').textContent = mockData.stats.activeUsers;
    document.getElementById('stat-publishers').textContent = mockData.stats.publishers;
    document.getElementById('stat-takers').textContent = mockData.stats.takers;
}

function renderRecentTasks() {
    var container = document.getElementById('recent-tasks-table');
    var tasks = mockData.tasks.slice(0, 5);
    container.innerHTML = tasks.map(task => renderAdminTaskRow(task)).join('');
}

function renderAdminTasks() {
    var container = document.getElementById('admin-tasks-table');
    container.innerHTML = mockData.tasks.map(task => renderAdminTaskRow(task, true)).join('');
}

function renderAdminTaskRow(task, showAll = false) {
    var publisher = mockData.users.find(u => u.id === task.publisherId);
    var taker = task.takerId ? mockData.users.find(u => u.id === task.takerId) : null;
    var category = mockData.categories.find(c => c.id === task.type);
    
    var statusText = {
        'pending': '待接单',
        'accepted': '已接单',
        'in_progress': '服务中',
        'pending_confirm': '待确认',
        'completed': '已完成',
        'cancelled': '已关闭'
    };
    
    var statusClass = 'status-' + task.status;
    
    var actions = `
        <div class="action-buttons">
            <button class="action-btn approve" onclick="approveTask(${task.id})">审核通过</button>
            <button class="action-btn reject" onclick="rejectTask(${task.id})">驳回</button>
            <button class="action-btn edit" onclick="editTask(${task.id})">编辑</button>
            <button class="action-btn delete" onclick="deleteTask(${task.id})">删除</button>
        </div>
    `;
    
    if (showAll) {
        return `
            <tr>
                <td>#${task.id}</td>
                <td>${category ? category.icon + ' ' + category.name : task.type}</td>
                <td>${task.date}</td>
                <td>${task.location}</td>
                <td>¥${task.reward}</td>
                <td>${publisher ? publisher.avatar + ' ' + publisher.name : '未知'}</td>
                <td>${taker ? taker.avatar + ' ' + taker.name : '-'}</td>
                <td><span class="status-badge ${statusClass}">${statusText[task.status]}</span></td>
                <td>${actions}</td>
            </tr>
        `;
    } else {
        return `
            <tr>
                <td>#${task.id}</td>
                <td>${category ? category.icon + ' ' + category.name : task.type}</td>
                <td>${publisher ? publisher.name : '未知'}</td>
                <td>${taker ? taker.name : '-'}</td>
                <td><span class="status-badge ${statusClass}">${statusText[task.status]}</span></td>
                <td>${task.createdAt}</td>
                <td>${actions}</td>
            </tr>
        `;
    }
}

function renderAdminUsers() {
    var container = document.getElementById('admin-users-table');
    container.innerHTML = mockData.users.map(user => renderAdminUserRow(user)).join('');
}

function renderAdminUserRow(user) {
    var roleText = user.role === 'publisher' ? '任务发布者' : '服务承接者';
    var statusClass = user.status === 'active' ? 'status-completed' : 'status-cancelled';
    var statusText = user.status === 'active' ? '活跃' : '禁用';
    
    return `
        <tr>
            <td>#${user.id}</td>
            <td style="font-size: 24px;">${user.avatar}</td>
            <td>${user.name}</td>
            <td>${roleText}</td>
            <td>${user.phone}</td>
            <td>${user.address}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>${user.description || '-'}</td>
        </tr>
    `;
}

function filterAdminTasks(status, event) {
    var container = document.getElementById('admin-tasks-table');
    var tasks = status === 'all' ? mockData.tasks : mockData.tasks.filter(t => t.status === status);
    container.innerHTML = tasks.map(task => renderAdminTaskRow(task, true)).join('');
    
    document.querySelectorAll('#tasks-page .filter-tag').forEach(tag => tag.classList.remove('active'));
    if (event && event.target) {
        event.target.classList.add('active');
    }
}

function filterAdminUsers(role, event) {
    var container = document.getElementById('admin-users-table');
    var users = role === 'all' ? mockData.users : mockData.users.filter(u => u.role === role);
    container.innerHTML = users.map(user => renderAdminUserRow(user)).join('');
    
    document.querySelectorAll('#users-page .filter-tag').forEach(tag => tag.classList.remove('active'));
    if (event && event.target) {
        event.target.classList.add('active');
    }
}

function approveTask(taskId) {
    var task = mockData.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    if (confirm('确定审核通过此任务吗？')) {
        task.status = 'pending';
        alert('任务已审核通过！');
        refreshAdminPage();
    }
}

function rejectTask(taskId) {
    var task = mockData.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    if (confirm('确定驳回此任务吗？')) {
        task.status = 'cancelled';
        alert('任务已驳回！');
        refreshAdminPage();
    }
}

function editTask(taskId) {
    var task = mockData.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    var newStatus = prompt('请选择新状态:', 'pending/accepted/in_progress/pending_confirm/completed/cancelled');
    if (newStatus && ['pending', 'accepted', 'in_progress', 'pending_confirm', 'completed', 'cancelled'].includes(newStatus)) {
        task.status = newStatus;
        alert('任务状态已更新！');
        refreshAdminPage();
    }
}

function deleteTask(taskId) {
    if (confirm('确定要删除此任务吗？')) {
        mockData.tasks = mockData.tasks.filter(t => t.id !== taskId);
        mockData.stats.totalTasks--;
        alert('任务已删除！');
        refreshAdminPage();
    }
}

function refreshAdminPage() {
    var activePage = document.querySelector('.admin-page.active');
    if (activePage) {
        var pageId = activePage.id.replace('-page', '');
        showAdminPage(pageId);
    }
}

window.addEventListener('load', initAdmin);