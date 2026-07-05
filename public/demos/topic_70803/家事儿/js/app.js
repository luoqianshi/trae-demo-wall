const App = {
    currentPage: 'home',
    currentMember: null,
    modules: {},
    pageHistory: [],
    titles: {
        'home': '首页',
        'todo': '待办事项',
        'moments': '家庭圈',
        'profile': '我的',
        'album': '家庭相册',
        'album-detail': '相册详情',
        'books': '家庭书库',
        'shopping': '购物清单',
        'events': '大事件'
    },

    init() {
        try {
            console.log('App initializing...');
            this.initDefaultData();
            this.loadCurrentMember();
            this.bindEvents();
            this.renderMemberSwitcher();
            this.navigate('home');
            console.log('App initialized successfully');
        } catch (e) {
            console.error('App init error:', e);
            alert('初始化出错: ' + e.message);
        }
    },

    initDefaultData() {
        let members = Storage.getMembers();
        if (members.length === 0) {
            const defaultMembers = [
                { name: '爸爸', role: '爸爸', avatar: '👨', fontSize: 'normal' },
                { name: '妈妈', role: '妈妈', avatar: '👩', fontSize: 'normal' },
                { name: '爷爷', role: '爷爷', avatar: '👴', fontSize: 'large' },
                { name: '奶奶', role: '奶奶', avatar: '👵', fontSize: 'large' },
                { name: '宝宝', role: '孩子', avatar: '👶', fontSize: 'normal' }
            ];
            defaultMembers.forEach(m => Storage.addMember(m));
            members = Storage.getMembers();
            this.addSampleData(members);
        }

        if (!Storage.getCurrentMemberId()) {
            Storage.setCurrentMemberId(members[0].id);
        }
    },

    addSampleData(members) {
        const today = new Date().toISOString().split('T')[0];

        Storage.addTodo({
            content: '下班买馒头',
            note: '在小区门口那家买',
            assignee: members[0].id,
            addedBy: members[1].id,
            date: today
        });
        Storage.addTodo({
            content: '拿快递',
            note: '菜鸟驿站，取件码1234',
            assignee: members[1].id,
            addedBy: members[0].id,
            date: today
        });

        Storage.addEvent({
            title: '妈妈生日',
            type: 'birthday',
            isLunar: true,
            month: 8,
            day: 15,
            repeatYearly: true,
            remindDaysBefore: 3,
            relatedMember: members[1].id
        });

        Storage.addShoppingItem({
            name: '洗衣液',
            category: '家清',
            targetPrice: 30,
            status: 'todo',
            priority: 'medium',
            note: '等活动买',
            addedBy: members[1].id,
            assignee: members[0].id
        });
        Storage.addShoppingItem({
            name: '牛奶',
            category: '食品',
            status: 'todo',
            priority: 'high',
            addedBy: members[3].id,
            assignee: members[1].id
        });

        Storage.addBook({
            title: '活着',
            author: '余华',
            type: 'paper',
            category: '文学',
            location: '客厅书架第二层',
            notes: '经典作品'
        });

        Storage.addAlbum({ name: '家庭日常', cover: '' });
        Storage.addAlbum({ name: '宝宝成长', cover: '' });

        const now = Date.now();
        Storage.addMoment({
            content: '今天做了红烧肉，大家下班早点回来吃饭呀～🍖',
            images: [],
            authorId: members[1].id,
            likes: [members[0].id, members[3].id, members[2].id],
            comments: [
                { id: Storage.generateId(), memberId: members[0].id, content: '好嘞！马上到家', createdAt: now - 3600000 },
                { id: Storage.generateId(), memberId: members[4].id, content: '妈妈做的红烧肉最好吃了！', createdAt: now - 1800000 }
            ],
            readBy: [members[0].id, members[1].id, members[2].id, members[3].id, members[4].id],
            createdAt: now - 7200000
        });

        Storage.addMoment({
            content: '宝宝今天考试考了100分！奖励一个冰淇淋🍦\n老师说他最近进步特别大，继续加油！',
            images: [],
            authorId: members[1].id,
            likes: [members[0].id, members[2].id, members[3].id],
            comments: [
                { id: Storage.generateId(), memberId: members[0].id, content: '太棒了！晚上带个玩具回去', createdAt: now - 7200000 },
                { id: Storage.generateId(), memberId: members[2].id, content: '大孙子真争气！爷爷给你包红包', createdAt: now - 3600000 }
            ],
            readBy: [members[0].id, members[1].id, members[2].id, members[3].id],
            createdAt: now - 86400000
        });

        Storage.addMoment({
            content: '今天天气真好，和老伴在公园散步，看到好多人在跳广场舞，等我们年纪再大点儿也去凑热闹～',
            images: [],
            authorId: members[3].id,
            likes: [members[0].id, members[1].id, members[2].id],
            comments: [
                { id: Storage.generateId(), memberId: members[1].id, content: '爸妈注意身体，别走太久', createdAt: now - 172800000 }
            ],
            readBy: [members[0].id, members[1].id, members[2].id, members[3].id, members[4].id],
            createdAt: now - 259200000
        });

        Storage.addMoment({
            content: '周末全家一起去公园野餐吧！我负责准备食物，谁负责带垫子？',
            images: [],
            authorId: members[0].id,
            likes: [members[1].id, members[4].id],
            comments: [
                { id: Storage.generateId(), memberId: members[4].id, content: '我要去！我要放风筝！', createdAt: now - 10000 }
            ],
            readBy: [members[0].id, members[1].id, members[4].id],
            createdAt: now - 3600000
        });
    },

    loadCurrentMember() {
        this.currentMember = Storage.getCurrentMember();
        if (!this.currentMember) {
            const members = Storage.getMembers();
            if (members.length > 0) {
                Storage.setCurrentMemberId(members[0].id);
                this.currentMember = members[0];
            }
        }
        this.applyFontSize();
    },

    setCurrentMember(member) {
        this.currentMember = member;
    },

    setCurrentMemberId(id) {
        Storage.setCurrentMemberId(id);
        this.loadCurrentMember();
    },

    applyFontSize() {
        const root = document.documentElement;
        if (this.currentMember && this.currentMember.fontSize === 'large') {
            root.classList.add('font-large');
        } else {
            root.classList.remove('font-large');
        }
    },

    bindEvents() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                this.pageHistory = [];
                this.navigate(page);
            });
        });

        document.getElementById('currentMember').addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleMemberDropdown();
        });

        document.addEventListener('click', () => {
            document.getElementById('memberDropdown').classList.remove('show');
        });

        document.getElementById('modalOverlay').addEventListener('click', (e) => {
            if (e.target.id === 'modalOverlay') {
                this.closeModal();
            }
        });
    },

    toggleMemberDropdown() {
        const dropdown = document.getElementById('memberDropdown');
        dropdown.classList.toggle('show');
    },

    renderMemberSwitcher() {
        const members = Storage.getMembers();
        const headerAvatar = document.getElementById('headerAvatar');
        const headerName = document.getElementById('headerName');
        const dropdown = document.getElementById('memberDropdown');

        if (this.currentMember) {
            if (this.currentMember.avatar && this.currentMember.avatar.startsWith('data:')) {
                headerAvatar.innerHTML = `<img src="${this.currentMember.avatar}">`;
            } else {
                headerAvatar.textContent = this.currentMember.avatar || this.currentMember.name[0];
            }
            headerName.textContent = this.currentMember.name;
        }

        dropdown.innerHTML = members.map(m => `
            <div class="member-dropdown-item ${m.id === this.currentMember?.id ? 'active' : ''}" data-id="${m.id}">
                <div class="dropdown-avatar">${m.avatar && m.avatar.startsWith('data:') ? `<img src="${m.avatar}">` : (m.avatar || m.name[0])}</div>
                <span>${m.name}</span>
                ${m.fontSize === 'large' ? '<span style="font-size:10px;color:#999;margin-left:auto;">大字</span>' : ''}
            </div>
        `).join('');

        dropdown.querySelectorAll('.member-dropdown-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = item.dataset.id;
                this.switchMember(id);
            });
        });
    },

    switchMember(id) {
        Storage.setCurrentMemberId(id);
        this.loadCurrentMember();
        this.renderMemberSwitcher();
        document.getElementById('memberDropdown').classList.remove('show');
        this.navigate(this.currentPage, false);
        this.showToast('已切换到 ' + this.currentMember.name);
    },

    navigate(page, addHistory = true) {
        try {
            if (addHistory && this.currentPage !== page) {
                this.pageHistory.push(this.currentPage);
            }

            this.currentPage = page;
            
            const mainNavPages = ['home', 'todo', 'moments', 'profile'];
            document.querySelectorAll('.nav-item').forEach(item => {
                const isActive = mainNavPages.includes(page) && item.dataset.page === page;
                item.classList.toggle('active', isActive);
            });

            document.querySelectorAll('.page-container').forEach(container => {
                container.style.display = 'none';
            });

            const pageMap = {
                'home': 'page-home',
                'todo': 'page-todo',
                'moments': 'page-moments',
                'profile': 'page-profile',
                'album': 'page-album',
                'album-detail': 'page-album-detail',
                'books': 'page-books',
                'shopping': 'page-shopping',
                'events': 'page-events'
            };

            const pageId = pageMap[page] || 'page-home';
            const pageEl = document.getElementById(pageId);
            if (pageEl) {
                pageEl.style.display = 'block';
            }

            this.setHeaderTitle(page);
            this.renderPage(page);
        } catch (e) {
            console.error('Navigate error:', e);
        }
    },

    setHeaderTitle(titleOrPage) {
        const titleEl = document.getElementById('pageTitle');
        const actionEl = document.getElementById('headerAction');
        if (this.titles[titleOrPage]) {
            titleEl.textContent = this.titles[titleOrPage];
        } else {
            titleEl.textContent = titleOrPage;
        }
        actionEl.innerHTML = '';
    },

    updateHeader(title) {
        this.setHeaderTitle(title);
    },

    back() {
        if (this.pageHistory.length > 0) {
            const prevPage = this.pageHistory.pop();
            this.navigate(prevPage, false);
        } else {
            this.navigate('home', false);
        }
    },

    renderPage(page) {
        try {
            const renderer = this.modules[page];
            if (renderer && typeof renderer.render === 'function') {
                renderer.render();
            } else {
                console.warn('No renderer for page:', page, 'modules:', Object.keys(this.modules));
            }
        } catch (e) {
            console.error('Render page error:', page, e);
            const pageMap = {
                'home': 'page-home',
                'todo': 'page-todo',
                'moments': 'page-moments',
                'profile': 'page-profile',
                'album': 'page-album',
                'books': 'page-books',
                'shopping': 'page-shopping',
                'events': 'page-events'
            };
            const pageId = pageMap[page];
            if (pageId) {
                const el = document.getElementById(pageId);
                if (el) {
                    el.innerHTML = `<div style="padding:40px 20px;text-align:center;color:#999">
                        <div style="font-size:48px;margin-bottom:16px">⚠️</div>
                        <div>页面加载出错</div>
                        <div style="font-size:12px;margin-top:8px">${e.message}</div>
                        <button class="btn btn-primary" style="margin-top:16px" onclick="location.reload()">刷新重试</button>
                    </div>`;
                }
            }
        }
    },

    registerModule(name, module) {
        this.modules[name] = module;
        console.log('Module registered:', name);
    },

    showModal(content, options = {}) {
        const overlay = document.getElementById('modalOverlay');
        const container = document.getElementById('modalContainer');
        container.innerHTML = content;
        overlay.style.display = 'flex';

        if (options.onClose) {
            this._modalOnClose = options.onClose;
        }
    },

    closeModal() {
        document.getElementById('modalOverlay').style.display = 'none';
        document.getElementById('modalContainer').innerHTML = '';
        if (this._modalOnClose) {
            this._modalOnClose();
            this._modalOnClose = null;
        }
    },

    showToast(message, duration = 2000) {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), duration);
    },

    toast(message, duration = 2000) {
        this.showToast(message, duration);
    },

    escapeHtml(text) {
        if (text === null || text === undefined) return '';
        const div = document.createElement('div');
        div.textContent = String(text);
        return div.innerHTML;
    },

    viewImage(src) {
        const viewer = document.createElement('div');
        viewer.className = 'photo-viewer';
        viewer.innerHTML = `
            <div class="photo-viewer-close" onclick="this.parentElement.remove()">×</div>
            <img src="${src}">
        `;
        viewer.addEventListener('click', (e) => {
            if (e.target === viewer) viewer.remove();
        });
        document.body.appendChild(viewer);
    },

    formatDate(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        const oneDay = 86400000;

        if (diff < 60000) return '刚刚';
        if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
        if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
        if (diff < 7 * oneDay) return Math.floor(diff / oneDay) + '天前';

        return `${date.getMonth() + 1}月${date.getDate()}日`;
    },

    formatFullDate(timestamp) {
        const date = new Date(timestamp);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    },

    getTodayString() {
        return new Date().toISOString().split('T')[0];
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

window.addEventListener('error', (e) => {
    console.error('Global error:', e.error || e.message);
});
