const HomeModule = {
    render() {
        const container = document.getElementById('page-home');
        const currentMember = App.currentMember;
        const todos = Storage.getTodayTodos();
        const pendingTodos = todos.filter(t => !t.completed);
        const moments = Storage.getMoments().slice(0, 2);
        const events = Storage.getEvents();
        const upcomingEvents = Lunar.getUpcomingEventsThisYear(events).slice(0, 3);
        const members = Storage.getMembers();

        const greeting = () => {
            const hour = new Date().getHours();
            if (hour < 6) return '夜深了';
            if (hour < 12) return '早上好';
            if (hour < 14) return '中午好';
            if (hour < 18) return '下午好';
            return '晚上好';
        };

        container.innerHTML = `
            <div class="card">
                <div style="display:flex;align-items:center;gap:var(--spacing-md);margin-bottom:var(--spacing-lg)">
                    <div style="font-size:var(--font-xxl)">👋</div>
                    <div>
                        <div style="font-size:var(--font-lg);font-weight:600">${greeting()}，${currentMember ? currentMember.name : '家人'}</div>
                        <div style="font-size:var(--font-sm);color:var(--text-secondary);margin-top:var(--spacing-xs)">今天是 ${new Date().toLocaleDateString('zh-CN', {month:'long',day:'numeric',weekday:'long'})}</div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-title">快捷功能</div>
                <div class="quick-grid">
                    <div class="quick-item" onclick="App.navigate('album')">
                        <div class="quick-icon" style="background:#FFF3E8">📷</div>
                        <span class="quick-text">相册</span>
                    </div>
                    <div class="quick-item" onclick="App.navigate('books')">
                        <div class="quick-icon" style="background:#E8F4FF">📚</div>
                        <span class="quick-text">书库</span>
                    </div>
                    <div class="quick-item" onclick="App.navigate('shopping')">
                        <div class="quick-icon" style="background:#FFF0F0">🛒</div>
                        <span class="quick-text">购物</span>
                    </div>
                    <div class="quick-item" onclick="App.navigate('events')">
                        <div class="quick-icon" style="background:#F0FFF0">📅</div>
                        <span class="quick-text">大事件</span>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-title">
                    今日待办
                    <span class="more" onclick="App.navigate('todo')">查看全部 ></span>
                </div>
                ${pendingTodos.length === 0 ? `
                    <div class="empty-state" style="padding:var(--spacing-lg) 0">
                        <div class="empty-icon">✅</div>
                        <div class="empty-text">今天没有待办事项</div>
                    </div>
                ` : pendingTodos.slice(0, 4).map(todo => {
                    const assignee = members.find(m => m.id === todo.assignee);
                    return `
                        <div class="list-item" onclick="TodoModule.toggleTodo('${todo.id}')">
                            <div class="checkbox ${todo.completed ? 'checked' : ''}"></div>
                            <div class="list-item-content">
                                <div class="list-item-title ${todo.completed ? 'line-through' : ''}">${App.escapeHtml(todo.content)}</div>
                                ${todo.note ? `<div class="list-item-desc">${App.escapeHtml(todo.note)}</div>` : ''}
                                <div style="display:flex;gap:var(--spacing-sm);margin-top:var(--spacing-xs);align-items:center">
                                    <span class="tag ${todo.completed ? 'tag-success' : ''}">${todo.completed ? '已完成' : '待办'}</span>
                                    ${assignee ? `<span class="tag">负责人：${App.escapeHtml(assignee.name)}</span>` : ''}
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
                <div style="margin-top:var(--spacing-md)">
                    <button class="btn btn-secondary btn-block" onclick="TodoModule.openAddModal()">+ 添加待办</button>
                </div>
            </div>

            ${upcomingEvents.length > 0 ? `
                <div class="card">
                    <div class="card-title">
                        近期提醒
                        <span class="more" onclick="App.navigate('events')">查看全部 ></span>
                    </div>
                    ${upcomingEvents.map(event => {
                        const relatedMember = event.relatedMember ? members.find(m => m.id === event.relatedMember) : null;
                        let daysText = event.diffDays === 0 ? '就是今天' : `还有${event.diffDays}天`;
                        let tagClass = event.diffDays === 0 ? 'tag-danger' : event.diffDays <= 3 ? 'tag-warning' : 'tag-primary';
                        return `
                            <div class="list-item">
                                <div style="font-size:var(--font-xl);width:40px;text-align:center">🎂</div>
                                <div class="list-item-content">
                                    <div class="list-item-title">${App.escapeHtml(event.title)}</div>
                                    <div class="list-item-desc">${event.solarDate.getMonth()+1}月${event.solarDate.getDate()}日 · ${event.isLunar ? '阴历' : '阳历'}</div>
                                </div>
                                <span class="tag ${tagClass}">${daysText}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            ` : ''}

            ${moments.length > 0 ? `
                <div class="card">
                    <div class="card-title">
                        最新家庭圈
                        <span class="more" onclick="App.navigate('moments')">查看全部 ></span>
                    </div>
                    ${moments.map(moment => {
                        const author = members.find(m => m.id === moment.authorId);
                        return `
                            <div style="padding:var(--spacing-md) 0;border-bottom:1px solid var(--border-color)">
                                <div style="display:flex;align-items:center;gap:var(--spacing-sm);margin-bottom:var(--spacing-sm)">
                                    <div class="avatar-sm">${author && author.avatar && author.avatar.startsWith('data:') ? `<img src="${author.avatar}">` : (author ? (author.avatar || author.name.charAt(0)) : '?')}</div>
                                    <div>
                                        <div style="font-size:var(--font-md);font-weight:500">${author ? App.escapeHtml(author.name) : '家人'}</div>
                                        <div style="font-size:var(--font-xs);color:var(--text-hint)">${this.formatTime(moment.createdAt)}</div>
                                    </div>
                                </div>
                                <div style="font-size:var(--font-md);line-height:1.6">${App.escapeHtml(moment.content)}</div>
                                ${moment.images && moment.images.length > 0 ? `
                                    <div class="moment-images count-${Math.min(moment.images.length, 9)}" style="margin-top:var(--spacing-sm)">
                                        ${moment.images.slice(0, 3).map(img => `<img src="${img}" onclick="App.viewImage('${img}')">`).join('')}
                                    </div>
                                ` : ''}
                            </div>
                        `;
                    }).join('')}
                </div>
            ` : ''}

            <div style="text-align:center;padding:var(--spacing-xl);color:var(--text-hint);font-size:var(--font-sm)">
                🏠 幸福的一家人
            </div>
        `;

        App.updateHeader('首页');
    },

    formatTime(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        if (diff < 60000) return '刚刚';
        if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
        if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
        if (diff < 604800000) return Math.floor(diff / 86400000) + '天前';
        const date = new Date(timestamp);
        return `${date.getMonth()+1}月${date.getDate()}日`;
    }
};

App.registerModule('home', HomeModule);