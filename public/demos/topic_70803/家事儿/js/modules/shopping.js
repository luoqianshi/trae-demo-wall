const ShoppingModule = {
    currentTab: 'todo',

    render() {
        const container = document.getElementById('page-shopping');
        const items = Storage.getShoppingItems();
        const members = Storage.getMembers();

        let filteredItems;
        let title;
        if (this.currentTab === 'want') {
            filteredItems = items.filter(i => i.status === 'want').sort((a, b) => (b.priority === 'high' ? 1 : 0) - (a.priority === 'high' ? 1 : 0));
            title = '想买清单';
        } else if (this.currentTab === 'todo') {
            filteredItems = items.filter(i => i.status === 'todo').sort((a, b) => {
                if (a.remindAt && b.remindAt) return a.remindAt - b.remindAt;
                if (a.remindAt) return -1;
                if (b.remindAt) return 1;
                return b.createdAt - a.createdAt;
            });
            title = '待购清单';
        } else {
            filteredItems = items.filter(i => i.status === 'bought').sort((a, b) => (b.boughtAt || 0) - (a.boughtAt || 0));
            title = '已购买';
        }

        const priorityText = { high: '🔥 高', medium: '中', low: '低' };
        const priorityClass = { high: 'tag-danger', medium: 'tag-warning', low: '' };
        const categories = ['家清', '食品', '衣物', '数码', '美妆', '母婴', '其他'];

        container.innerHTML = `
            <div class="back-btn" onclick="App.navigate('home')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
                返回首页
            </div>
            <div class="tabs">
                <div class="tab-item ${this.currentTab === 'want' ? 'active' : ''}" onclick="ShoppingModule.switchTab('want')">想买</div>
                <div class="tab-item ${this.currentTab === 'todo' ? 'active' : ''}" onclick="ShoppingModule.switchTab('todo')">待购</div>
                <div class="tab-item ${this.currentTab === 'bought' ? 'active' : ''}" onclick="ShoppingModule.switchTab('bought')">已买</div>
            </div>

            ${filteredItems.length === 0 ? `
                <div class="empty-state">
                    <div class="empty-icon">🛒</div>
                    <div class="empty-text">还没有物品</div>
                    <button class="btn btn-primary" onclick="ShoppingModule.openAddModal()">添加物品</button>
                </div>
            ` : `
                <div class="card">
                    ${filteredItems.map(item => {
                        const assignee = members.find(m => m.id === item.assignee);
                        return `
                            <div class="list-item">
                                <div class="list-item-content">
                                    <div class="list-item-title">${App.escapeHtml(item.name)}</div>
                                    <div style="display:flex;gap:var(--spacing-sm);margin-top:var(--spacing-xs);flex-wrap:wrap;align-items:center">
                                        ${item.targetPrice ? `<span class="tag tag-primary">💰 ${item.targetPrice}元</span>` : ''}
                                        ${item.priority !== 'medium' ? `<span class="tag ${priorityClass[item.priority]}">${priorityText[item.priority]}</span>` : ''}
                                        <span class="tag">${App.escapeHtml(item.category || '其他')}</span>
                                        ${item.remindAt && item.status !== 'bought' ? `<span class="tag tag-warning">⏰ ${new Date(item.remindAt).toLocaleDateString('zh-CN', {month:'short',day:'numeric'})}</span>` : ''}
                                    </div>
                                    ${item.note ? `<div class="list-item-desc" style="margin-top:var(--spacing-xs)">${App.escapeHtml(item.note)}</div>` : ''}
                                </div>
                                <div class="list-item-action" style="display:flex;flex-direction:column;gap:var(--spacing-xs)">
                                    ${item.status !== 'bought' ? `
                                        <button class="btn btn-sm btn-primary" onclick="ShoppingModule.markBought('${item.id}')">已买</button>
                                    ` : ''}
                                    <button class="btn btn-sm btn-outline" onclick="ShoppingModule.deleteItem('${item.id}')">删除</button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `}

            <button class="fab" onclick="ShoppingModule.openAddModal()">+</button>
        `;

        App.updateHeader(title);
    },

    switchTab(tab) {
        this.currentTab = tab;
        this.render();
    },

    markBought(id) {
        Storage.updateShoppingItem(id, { status: 'bought' });
        this.render();
        App.showToast('已标记为购买');
    },

    deleteItem(id) {
        if (confirm('确定删除吗？')) {
            Storage.deleteShoppingItem(id);
            this.render();
            App.showToast('已删除');
        }
    },

    openAddModal() {
        const members = Storage.getMembers();
        const currentMember = App.currentMember;
        const categories = ['家清', '食品', '衣物', '数码', '美妆', '母婴', '其他'];

        const html = `
            <div class="modal-header">
                <div class="modal-title">添加物品</div>
                <div class="modal-close" onclick="App.closeModal()">×</div>
            </div>
            <div class="modal-body">
                <div class="input-group">
                    <label class="input-label">物品名称</label>
                    <input class="input" id="shopName" placeholder="例如：洗衣液" autofocus>
                </div>
                <div class="input-group">
                    <label class="input-label">分类</label>
                    <select class="select" id="shopCategory">
                        ${categories.map(c => `<option value="${c}">${c}</option>`).join('')}
                    </select>
                </div>
                <div class="input-group">
                    <label class="input-label">目标价格（选填）</label>
                    <input class="input" id="shopPrice" type="number" placeholder="期望入手价格">
                </div>
                <div class="input-group">
                    <label class="input-label">状态</label>
                    <select class="select" id="shopStatus">
                        <option value="want">想买</option>
                        <option value="todo" selected>待购</option>
                    </select>
                </div>
                <div class="input-group">
                    <label class="input-label">优先级</label>
                    <select class="select" id="shopPriority">
                        <option value="medium">普通</option>
                        <option value="high">🔥 急需</option>
                        <option value="low">不急</option>
                    </select>
                </div>
                <div class="input-group">
                    <label class="input-label">提醒时间（选填）</label>
                    <input class="input" id="shopRemind" type="date">
                </div>
                <div class="input-group">
                    <label class="input-label">备注（选填）</label>
                    <textarea class="textarea" id="shopNote" placeholder="例如：等618活动"></textarea>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary btn-block" onclick="ShoppingModule.saveItem()">保存</button>
            </div>
        `;

        App.showModal(html);

        setTimeout(() => {
            document.getElementById('shopName').focus();
        }, 100);
    },

    saveItem() {
        const name = document.getElementById('shopName').value.trim();
        const category = document.getElementById('shopCategory').value;
        const price = parseFloat(document.getElementById('shopPrice').value) || null;
        const status = document.getElementById('shopStatus').value;
        const priority = document.getElementById('shopPriority').value;
        const remindDate = document.getElementById('shopRemind').value;
        const note = document.getElementById('shopNote').value.trim();
        const currentMember = App.currentMember;

        if (!name) {
            App.showToast('请输入物品名称');
            return;
        }

        Storage.addShoppingItem({
            name,
            category,
            targetPrice: price,
            status,
            priority,
            remindAt: remindDate ? new Date(remindDate).getTime() : null,
            note,
            addedBy: currentMember ? currentMember.id : null,
            assignee: currentMember ? currentMember.id : null
        });

        App.closeModal();
        App.showToast('添加成功');
        this.render();
    }
};

App.registerModule('shopping', ShoppingModule);