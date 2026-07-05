const TodoModule = {
    currentTab: 'today',

    render() {
        const container = document.getElementById('page-todo');
        const members = Storage.getMembers();
        const currentMember = App.currentMember;

        let todos;
        let title;
        if (this.currentTab === 'today') {
            todos = Storage.getTodayTodos();
            title = '今日待办';
        } else {
            const allTodos = Storage.getTodos();
            todos = allTodos.filter(t => t.completed).sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
            title = '已完成';
        }

        container.innerHTML = `
            <div class="tabs">
                <div class="tab-item ${this.currentTab === 'today' ? 'active' : ''}" onclick="TodoModule.switchTab('today')">今日待办</div>
                <div class="tab-item ${this.currentTab === 'done' ? 'active' : ''}" onclick="TodoModule.switchTab('done')">已完成</div>
            </div>

            ${todos.length === 0 ? `
                <div class="empty-state">
                    <div class="empty-icon">📝</div>
                    <div class="empty-text">${this.currentTab === 'today' ? '今天还没有待办事项' : '还没有已完成的事项'}</div>
                    <button class="btn btn-primary" onclick="TodoModule.openAddModal()">添加待办</button>
                </div>
            ` : `
                <div class="card">
                    ${todos.map(todo => {
                        const assignee = members.find(m => m.id === todo.assignee);
                        const adder = members.find(m => m.id === todo.addedBy);
                        return `
                            <div class="list-item">
                                <div class="checkbox ${todo.completed ? 'checked' : ''}" onclick="TodoModule.toggleTodo('${todo.id}')"></div>
                                <div class="list-item-content">
                                    <div class="list-item-title ${todo.completed ? 'line-through' : ''}">${App.escapeHtml(todo.content)}</div>
                                    ${todo.note ? `<div class="list-item-desc">${App.escapeHtml(todo.note)}</div>` : ''}
                                    <div style="display:flex;gap:var(--spacing-sm);margin-top:var(--spacing-xs);flex-wrap:wrap;align-items:center">
                                        ${assignee ? `<span class="tag">👤 ${App.escapeHtml(assignee.name)}</span>` : ''}
                                        ${adder && (!assignee || adder.id !== assignee.id) ? `<span class="tag">添加：${App.escapeHtml(adder.name)}</span>` : ''}
                                    </div>
                                </div>
                                <div class="list-item-action">
                                    <button class="btn btn-sm btn-outline" onclick="TodoModule.deleteTodo('${todo.id}')">删除</button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `}

            <button class="fab" onclick="TodoModule.openAddModal()">+</button>
        `;

        App.updateHeader(title);
    },

    switchTab(tab) {
        this.currentTab = tab;
        this.render();
    },

    toggleTodo(id) {
        Storage.toggleTodo(id);
        this.render();
        if (App.currentPage === 'home') {
            App.modules.home.render();
        }
    },

    deleteTodo(id) {
        if (confirm('确定删除这个待办吗？')) {
            Storage.deleteTodo(id);
            this.render();
            App.showToast('已删除');
        }
    },

    openAddModal() {
        const members = Storage.getMembers();
        const currentMember = App.currentMember;

        const html = `
            <div class="modal-header">
                <div class="modal-title">添加待办</div>
                <div class="modal-close" onclick="App.closeModal()">×</div>
            </div>
            <div class="modal-body">
                <div class="input-group">
                    <label class="input-label">待办内容</label>
                    <input class="input" id="todoContent" placeholder="例如：下班买馒头" autofocus>
                </div>
                <div class="input-group">
                    <label class="input-label">备注（选填）</label>
                    <textarea class="textarea" id="todoNote" placeholder="例如：在小区门口那家买"></textarea>
                </div>
                <div class="input-group">
                    <label class="input-label">指派给</label>
                    <select class="select" id="todoAssignee">
                        <option value="">不指派</option>
                        ${members.map(m => `<option value="${m.id}" ${currentMember && m.id === currentMember.id ? 'selected' : ''}>${App.escapeHtml(m.name)}（${App.escapeHtml(m.role)}）</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary btn-block" onclick="TodoModule.saveTodo()">保存</button>
            </div>
        `;

        App.showModal(html);

        setTimeout(() => {
            document.getElementById('todoContent').focus();
        }, 100);
    },

    saveTodo() {
        const content = document.getElementById('todoContent').value.trim();
        const note = document.getElementById('todoNote').value.trim();
        const assignee = document.getElementById('todoAssignee').value;
        const currentMember = App.currentMember;

        if (!content) {
            App.showToast('请输入待办内容');
            return;
        }

        Storage.addTodo({
            content,
            note,
            assignee: assignee || null,
            addedBy: currentMember ? currentMember.id : null,
            date: new Date().toISOString().split('T')[0]
        });

        App.closeModal();
        App.showToast('添加成功');
        this.render();
        if (App.currentPage === 'home') {
            App.modules.home.render();
        }
    }
};

App.registerModule('todo', TodoModule);
