var currentTaskId = null;
var currentAction = null;
var currentFilter = 'all';

function init() {
    renderCategories();
    renderHomeTasks();
    renderTaskSquare();
    renderFilters();
    setupPublishForm();
    updateUserInfo();
}

function navigateTo(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    
    document.getElementById(pageId).classList.add('active');
    
    var navMap = {
        'home-page': 'nav-home',
        'task-square-page': 'nav-task',
        'my-take-page': 'nav-task',
        'publish-task-page': 'nav-publish',
        'my-publish-page': 'nav-publish',
        'profile-page': 'nav-profile'
    };
    
    var navElement = document.getElementById(navMap[pageId]);
    if (navElement) {
        navElement.classList.add('active');
    }
    
    if (pageId === 'my-publish-page') {
        renderMyPublishTasks();
    } else if (pageId === 'my-take-page') {
        renderMyTakeTasks();
    } else if (pageId === 'task-square-page') {
        renderTaskSquare();
    }
}

function switchRole(role) {
    pageState.currentRole = role;
    
    document.getElementById('role-publisher').classList.toggle('active', role === 'publisher');
    document.getElementById('role-publisher').classList.toggle('inactive', role !== 'publisher');
    document.getElementById('role-taker').classList.toggle('active', role === 'taker');
    document.getElementById('role-taker').classList.toggle('inactive', role !== 'taker');
    
    if (role === 'publisher') {
        currentUser = { id: 1, name: '王阿姨', avatar: '👵', role: 'publisher' };
    } else {
        currentUser = { id: 3, name: '张小明', avatar: '👨‍🎓', role: 'taker' };
    }
    
    updateUserInfo();
    alert('角色已切换为：' + (role === 'publisher' ? '老人/家属' : '暖伴儿女'));
}

function updateUserInfo() {
    document.getElementById('user-avatar').textContent = currentUser.avatar;
    document.getElementById('user-name').textContent = currentUser.name;
    document.getElementById('user-role').textContent = currentUser.role === 'publisher' ? '任务发布者' : '服务提供者';
}

function renderCategories() {
    var container = document.getElementById('category-list');
    container.innerHTML = mockData.categories.map(cat => `
        <div class="category-item" onclick="filterTasksByCategory('${cat.id}')">
            <span class="icon">${cat.icon}</span>
            <span class="name">${cat.name}</span>
        </div>
    `).join('');
}

function renderHomeTasks() {
    var container = document.getElementById('home-task-list');
    var tasks = mockData.tasks.slice(0, 3);
    container.innerHTML = tasks.map(task => renderTaskItem(task)).join('');
}

function renderTaskSquare() {
    var container = document.getElementById('task-list');
    var tasks = mockData.tasks.filter(t => t.status === 'pending');
    container.innerHTML = tasks.map(task => renderTaskItem(task)).join('');
}

function renderTaskItem(task) {
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
    
    return `
        <div class="task-item" onclick="showTaskDetail(${task.id})">
            <div class="task-header">
                <span class="task-title">${category ? category.icon : ''} ${task.title}</span>
                <span class="task-reward">¥${task.reward}</span>
            </div>
            <div class="task-info">
                <span>📅 ${task.date}</span>
                <span>⏰ ${task.time}</span>
                <span>📍 ${task.location}</span>
            </div>
            <div class="task-desc">${task.description}</div>
            <div class="task-status">
                <span class="status-badge ${statusClass}">${statusText[task.status]}</span>
                ${publisher ? ' · 发布者：' + publisher.name : ''}
                ${taker ? ' · 服务者：' + taker.name : ''}
            </div>
        </div>
    `;
}

function renderFilters() {
    var filters = [
        { id: 'all', name: '全部' },
        { id: 'chat', name: '聊天陪伴' },
        { id: 'home', name: '上门陪护' },
        { id: 'hospital', name: '陪同就医' },
        { id: 'run', name: '代购跑腿' },
        { id: 'festival', name: '节日慰问' },
        { id: 'walk', name: '日常散步' }
    ];
    
    document.getElementById('task-filter').innerHTML = filters.map(f => `
        <span class="filter-tag ${currentFilter === f.id ? 'active' : ''}" onclick="setFilter('${f.id}')">${f.name}</span>
    `).join('');
    
    document.getElementById('publish-filter').innerHTML = filters.slice(0, 1).concat([
        { id: 'pending', name: '待接单' },
        { id: 'accepted', name: '已接单' },
        { id: 'in_progress', name: '服务中' },
        { id: 'completed', name: '已完成' },
        { id: 'cancelled', name: '已关闭' }
    ]).map(f => `
        <span class="filter-tag" onclick="setPublishFilter('${f.id}')">${f.name}</span>
    `).join('');
    
    document.getElementById('take-filter').innerHTML = [
        { id: 'all', name: '全部' },
        { id: 'accepted', name: '已接单' },
        { id: 'in_progress', name: '服务中' },
        { id: 'completed', name: '已完成' }
    ].map(f => `
        <span class="filter-tag" onclick="setTakeFilter('${f.id}')">${f.name}</span>
    `).join('');
}

function setFilter(filterId) {
    currentFilter = filterId;
    renderFilters();
    var container = document.getElementById('task-list');
    var tasks = mockData.tasks.filter(t => t.status === 'pending');
    if (filterId !== 'all') {
        tasks = tasks.filter(t => t.type === filterId);
    }
    container.innerHTML = tasks.map(task => renderTaskItem(task)).join('');
}

function filterTasksByCategory(categoryId) {
    navigateTo('task-square-page');
    setFilter(categoryId);
}

function setupPublishForm() {
    document.getElementById('publish-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        var newTask = {
            id: mockData.tasks.length + 1,
            type: document.getElementById('service-type').value,
            title: mockData.categories.find(c => c.id === document.getElementById('service-type').value).name,
            serviceType: mockData.categories.find(c => c.id === document.getElementById('service-type').value).name,
            date: document.getElementById('service-date').value,
            time: document.getElementById('service-time').value,
            location: document.getElementById('service-location').value,
            description: document.getElementById('service-desc').value,
            reward: parseInt(document.getElementById('service-reward').value),
            status: 'pending',
            publisherId: currentUser.id,
            takerId: null,
            createdAt: new Date().toISOString().split('T')[0]
        };
        
        mockData.tasks.unshift(newTask);
        mockData.stats.totalTasks++;
        mockData.stats.pendingTasks++;
        
        alert('任务发布成功！');
        this.reset();
        navigateTo('home-page');
    });
}

function showTaskDetail(taskId) {
    var task = mockData.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    currentTaskId = taskId;
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
    
    document.getElementById('detail-title').textContent = task.title;
    document.getElementById('detail-content').innerHTML = `
        <div style="margin-bottom: 10px;">
            <strong>服务类型：</strong>${category ? category.icon + ' ' + category.name : task.type}
        </div>
        <div style="margin-bottom: 10px;">
            <strong>服务日期：</strong>${task.date}
        </div>
        <div style="margin-bottom: 10px;">
            <strong>服务时间：</strong>${task.time}
        </div>
        <div style="margin-bottom: 10px;">
            <strong>服务地点：</strong>${task.location}
        </div>
        <div style="margin-bottom: 10px;">
            <strong>需求描述：</strong>${task.description}
        </div>
        <div style="margin-bottom: 10px;">
            <strong>服务酬劳：</strong>¥${task.reward}
        </div>
        <div style="margin-bottom: 10px;">
            <strong>发布者：</strong>${publisher ? publisher.avatar + ' ' + publisher.name : '未知'}
        </div>
        ${taker ? `<div style="margin-bottom: 10px;"><strong>服务者：</strong>${taker.avatar + ' ' + taker.name}</div>` : ''}
        <div style="margin-bottom: 10px;">
            <strong>任务状态：</strong><span class="status-badge ${statusClass}">${statusText[task.status]}</span>
        </div>
    `;
    
    var actionBtn = document.getElementById('detail-action-btn');
    
    if (currentUser.role === 'publisher') {
        if (task.status === 'pending') {
            actionBtn.textContent = '取消任务';
            currentAction = 'cancel';
        } else if (task.status === 'pending_confirm') {
            actionBtn.textContent = '确认完成';
            currentAction = 'confirm_complete';
        } else {
            actionBtn.style.display = 'none';
        }
    } else {
        if (task.status === 'pending') {
            actionBtn.textContent = '一键接单';
            currentAction = 'accept';
        } else if (task.status === 'accepted') {
            actionBtn.textContent = '开始服务';
            currentAction = 'start_service';
        } else if (task.status === 'in_progress') {
            actionBtn.textContent = '完成服务';
            currentAction = 'complete';
        } else {
            actionBtn.style.display = 'none';
        }
    }
    
    actionBtn.style.display = 'block';
    document.getElementById('task-detail-modal').classList.add('active');
}

function handleDetailAction() {
    var task = mockData.tasks.find(t => t.id === currentTaskId);
    if (!task) return;
    
    switch (currentAction) {
        case 'cancel':
            if (confirm('确定要取消此任务吗？')) {
                task.status = 'cancelled';
                mockData.stats.pendingTasks--;
                alert('任务已取消');
                closeModal();
                refreshCurrentPage();
            }
            break;
        case 'accept':
            if (confirm('确定要接下此任务吗？')) {
                task.takerId = currentUser.id;
                task.status = 'accepted';
                mockData.stats.pendingTasks--;
                alert('接单成功！');
                closeModal();
                refreshCurrentPage();
            }
            break;
        case 'start_service':
            if (confirm('确定开始服务吗？')) {
                task.status = 'in_progress';
                alert('服务已开始');
                closeModal();
                refreshCurrentPage();
            }
            break;
        case 'complete':
            if (confirm('确定服务已完成吗？')) {
                task.status = 'pending_confirm';
                alert('服务已完成，请等待发布者确认');
                closeModal();
                refreshCurrentPage();
            }
            break;
        case 'confirm_complete':
            if (confirm('确认服务已完成并支付酬劳？')) {
                task.status = 'completed';
                mockData.stats.completedServices++;
                alert('服务已确认完成！');
                closeModal();
                refreshCurrentPage();
            }
            break;
    }
}

function closeModal() {
    document.getElementById('modal').classList.remove('active');
    document.getElementById('task-detail-modal').classList.remove('active');
}

function refreshCurrentPage() {
    var activePage = document.querySelector('.page.active');
    if (activePage) {
        var pageId = activePage.id;
        navigateTo(pageId);
    }
}

function renderMyPublishTasks() {
    var container = document.getElementById('my-publish-list');
    var tasks = mockData.tasks.filter(t => t.publisherId === currentUser.id);
    container.innerHTML = tasks.length > 0 ? tasks.map(task => renderTaskItem(task)).join('') : '<p style="text-align: center; color: #999;">暂无发布任务</p>';
}

function renderMyTakeTasks() {
    var container = document.getElementById('my-take-list');
    var tasks = mockData.tasks.filter(t => t.takerId === currentUser.id);
    container.innerHTML = tasks.length > 0 ? tasks.map(task => renderTaskItem(task)).join('') : '<p style="text-align: center; color: #999;">暂无服务任务</p>';
}

function setPublishFilter(filterId) {
    var container = document.getElementById('my-publish-list');
    var tasks = mockData.tasks.filter(t => t.publisherId === currentUser.id);
    if (filterId !== 'all') {
        tasks = tasks.filter(t => t.status === filterId);
    }
    container.innerHTML = tasks.length > 0 ? tasks.map(task => renderTaskItem(task)).join('') : '<p style="text-align: center; color: #999;">暂无任务</p>';
}

function setTakeFilter(filterId) {
    var container = document.getElementById('my-take-list');
    var tasks = mockData.tasks.filter(t => t.takerId === currentUser.id);
    if (filterId !== 'all') {
        tasks = tasks.filter(t => t.status === filterId);
    }
    container.innerHTML = tasks.length > 0 ? tasks.map(task => renderTaskItem(task)).join('') : '<p style="text-align: center; color: #999;">暂无任务</p>';
}

function openAdmin() {
    window.open('admin.html', '_blank');
}

function confirmModal() {
    closeModal();
}

window.addEventListener('load', init);