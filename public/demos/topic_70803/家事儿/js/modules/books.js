const BooksModule = {
    currentTab: 'all',

    render() {
        const container = document.getElementById('page-books');
        const books = Storage.getBooks();
        const filteredBooks = this.currentTab === 'all' ? books :
            books.filter(b => b.type === this.currentTab);

        container.innerHTML = `
            <div class="back-btn" onclick="App.navigate('home')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
                返回首页
            </div>
            <div class="tabs">
                <div class="tab-item ${this.currentTab === 'all' ? 'active' : ''}" data-tab="all">全部</div>
                <div class="tab-item ${this.currentTab === 'paper' ? 'active' : ''}" data-tab="paper">纸质书</div>
                <div class="tab-item ${this.currentTab === 'ebook' ? 'active' : ''}" data-tab="ebook">电子书</div>
                <div class="tab-item ${this.currentTab === 'link' ? 'active' : ''}" data-tab="link">链接</div>
            </div>
            <div id="booksList">
                ${filteredBooks.length === 0 ? this.renderEmpty() : filteredBooks.map(book => this.renderBookItem(book)).join('')}
            </div>
            <button class="fab" id="addBookBtn">+</button>
        `;

        App.updateHeader('家庭书库');

        container.querySelectorAll('.tab-item').forEach(tab => {
            tab.addEventListener('click', () => {
                this.currentTab = tab.dataset.tab;
                this.render();
            });
        });

        document.getElementById('addBookBtn').addEventListener('click', () => {
            this.showAddBookModal();
        });

        container.querySelectorAll('.book-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.closest('.book-delete') || e.target.closest('.book-action')) return;
                const bookId = item.dataset.id;
                this.showBookDetail(bookId);
            });
        });

        container.querySelectorAll('.book-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const bookId = btn.dataset.id;
                if (confirm('确定删除这本书吗？')) {
                    Storage.deleteBook(bookId);
                    this.render();
                    App.showToast('已删除');
                }
            });
        });
    },

    renderEmpty() {
        return `
            <div class="empty-state">
                <div class="empty-icon">📚</div>
                <div class="empty-text">还没有添加书籍</div>
                <button class="btn btn-primary btn-sm" onclick="BooksModule.showAddBookModal()">添加第一本</button>
            </div>
        `;
    },

    renderBookItem(book) {
        const typeLabels = {
            paper: { text: '纸质书', class: 'tag-primary' },
            ebook: { text: '电子书', class: 'tag-success' },
            link: { text: '链接', class: 'tag-warning' }
        };
        const typeInfo = typeLabels[book.type] || typeLabels.paper;

        return `
            <div class="card book-item" data-id="${book.id}" style="margin-bottom:var(--spacing-md);cursor:pointer;">
                <div class="flex items-center gap-md">
                    <div style="width:60px;height:80px;background:var(--primary-light);border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:center;font-size:28px;flex-shrink:0;">
                        ${book.cover || '📖'}
                    </div>
                    <div class="list-item-content">
                        <div class="list-item-title">${this.escapeHtml(book.title)}</div>
                        <div class="list-item-desc" style="margin-bottom:var(--spacing-sm);">${this.escapeHtml(book.author || '未知作者')}</div>
                        <div class="flex gap-sm">
                            <span class="tag ${typeInfo.class}">${typeInfo.text}</span>
                            ${book.category ? `<span class="tag">${this.escapeHtml(book.category)}</span>` : ''}
                        </div>
                    </div>
                    <div class="list-item-action">
                        <button class="book-delete" data-id="${book.id}" style="background:none;border:none;font-size:var(--font-lg);color:var(--text-hint);cursor:pointer;padding:8px;">×</button>
                    </div>
                </div>
            </div>
        `;
    },

    showAddBookModal() {
        App.showModal(`
            <div class="modal-header">
                <div class="modal-title">添加书籍</div>
                <div class="modal-close" onclick="App.closeModal()">×</div>
            </div>
            <div class="modal-body">
                <div class="input-group">
                    <label class="input-label">书名 *</label>
                    <input type="text" class="input" id="bookTitle" placeholder="请输入书名">
                </div>
                <div class="input-group">
                    <label class="input-label">作者</label>
                    <input type="text" class="input" id="bookAuthor" placeholder="请输入作者">
                </div>
                <div class="input-group">
                    <label class="input-label">类型</label>
                    <select class="select" id="bookType">
                        <option value="paper">纸质书</option>
                        <option value="ebook">电子书</option>
                        <option value="link">链接/网址</option>
                    </select>
                </div>
                <div class="input-group">
                    <label class="input-label">分类</label>
                    <input type="text" class="input" id="bookCategory" placeholder="如：文学、科技、育儿...">
                </div>
                <div class="input-group" id="linkGroup" style="display:none;">
                    <label class="input-label">链接地址</label>
                    <input type="url" class="input" id="bookLink" placeholder="https://...">
                </div>
                <div class="input-group" id="locationGroup">
                    <label class="input-label">存放位置/备注</label>
                    <input type="text" class="input" id="bookLocation" placeholder="如：书架第二层、平板中...">
                </div>
                <div class="input-group">
                    <label class="input-label">简介/笔记</label>
                    <textarea class="textarea" id="bookNotes" placeholder="记录一下这本书的内容或读书心得..."></textarea>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary btn-block" id="saveBookBtn">保存</button>
            </div>
        `);

        const typeSelect = document.getElementById('bookType');
        const linkGroup = document.getElementById('linkGroup');
        const locationGroup = document.getElementById('locationGroup');

        typeSelect.addEventListener('change', () => {
            if (typeSelect.value === 'link') {
                linkGroup.style.display = 'block';
                locationGroup.style.display = 'none';
            } else {
                linkGroup.style.display = 'none';
                locationGroup.style.display = 'block';
            }
        });

        document.getElementById('saveBookBtn').addEventListener('click', () => {
            const title = document.getElementById('bookTitle').value.trim();
            if (!title) {
                App.showToast('请输入书名');
                return;
            }

            const book = {
                title,
                author: document.getElementById('bookAuthor').value.trim(),
                type: typeSelect.value,
                category: document.getElementById('bookCategory').value.trim(),
                location: document.getElementById('bookLocation').value.trim(),
                link: document.getElementById('bookLink').value.trim(),
                notes: document.getElementById('bookNotes').value.trim(),
                addedBy: App.currentMember?.id
            };

            Storage.addBook(book);
            App.closeModal();
            this.render();
            App.showToast('添加成功');
        });
    },

    showBookDetail(bookId) {
        const book = Storage.getBooks().find(b => b.id === bookId);
        if (!book) return;

        const typeLabels = { paper: '纸质书', ebook: '电子书', link: '链接' };

        App.showModal(`
            <div class="modal-header">
                <div class="modal-title">书籍详情</div>
                <div class="modal-close" onclick="App.closeModal()">×</div>
            </div>
            <div class="modal-body">
                <div class="text-center" style="margin-bottom:var(--spacing-lg);">
                    <div style="width:100px;height:140px;background:var(--primary-light);border-radius:var(--radius-md);display:inline-flex;align-items:center;justify-content:center;font-size:48px;margin-bottom:var(--spacing-md);">
                        📖
                    </div>
                    <h3 style="font-size:var(--font-xl);margin-bottom:var(--spacing-xs);">${this.escapeHtml(book.title)}</h3>
                    <div class="text-secondary">${this.escapeHtml(book.author || '未知作者')}</div>
                </div>
                <div class="card" style="margin-bottom:var(--spacing-md);">
                    <div class="flex-between" style="margin-bottom:var(--spacing-sm);">
                        <span class="text-secondary">类型</span>
                        <span>${typeLabels[book.type]}</span>
                    </div>
                    ${book.category ? `
                    <div class="flex-between" style="margin-bottom:var(--spacing-sm);">
                        <span class="text-secondary">分类</span>
                        <span>${this.escapeHtml(book.category)}</span>
                    </div>
                    ` : ''}
                    ${book.location ? `
                    <div class="flex-between" style="margin-bottom:var(--spacing-sm);">
                        <span class="text-secondary">位置</span>
                        <span>${this.escapeHtml(book.location)}</span>
                    </div>
                    ` : ''}
                    ${book.link ? `
                    <div class="flex-between" style="margin-bottom:var(--spacing-sm);">
                        <span class="text-secondary">链接</span>
                        <a href="${this.escapeHtml(book.link)}" target="_blank" style="color:var(--primary-color);word-break:break-all;">打开链接</a>
                    </div>
                    ` : ''}
                </div>
                ${book.notes ? `
                <div class="card">
                    <div class="card-title" style="font-size:var(--font-md);">笔记</div>
                    <div style="line-height:1.8;color:var(--text-secondary);">${this.escapeHtml(book.notes)}</div>
                </div>
                ` : ''}
            </div>
            <div class="modal-footer">
                <button class="btn btn-outline btn-block" onclick="App.closeModal()">关闭</button>
            </div>
        `);
    },

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

App.registerModule('books', BooksModule);