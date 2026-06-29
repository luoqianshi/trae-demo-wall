const App = {
    data: null,

    DEFAULT_DATA: {
        pets: [
            { id: 1, name: '豆豆', type: 'dog', breed: '柴犬', ageText: '2岁3个月', gender: 'male', weight: 8.5, avatar: '🐕', status: 'active', birthDate: '2024-04-10' },
            { id: 2, name: '咪咪', type: 'cat', breed: '英短', ageText: '1岁6个月', gender: 'female', weight: 4.2, avatar: '🐈', status: 'active', birthDate: '2024-12-20' }
        ],
        records: [
            { id: 1, petId: 1, type: 'vaccine', title: '狂犬疫苗', date: '2026-05-10', note: 'annual vaccination', cost: 80 },
            { id: 2, petId: 1, type: 'vaccine', title: '八联疫苗', date: '2026-05-10', note: '第三针', cost: 120 },
            { id: 3, petId: 1, type: 'deworm', title: '体内驱虫', date: '2026-06-01', note: '口服拜宠清', cost: 45 },
            { id: 4, petId: 1, type: 'deworm', title: '体外驱虫', date: '2026-06-15', note: '大宠爱滴剂', cost: 68 },
            { id: 5, petId: 1, type: 'medical', title: '常规体检', date: '2026-04-20', note: '血常规正常', cost: 200, weight: 8.1 },
            { id: 6, petId: 2, type: 'vaccine', title: '猫三联', date: '2026-06-10', note: '第二针', cost: 90, weight: 4.0 },
            { id: 7, petId: 2, type: 'deworm', title: '体内驱虫', date: '2026-06-20', note: '海乐妙', cost: 35, weight: 4.1 },
            { id: 10, petId: 1, type: 'weight', title: '体重记录', date: '2026-05-10', note: '体重记录', cost: 0, weight: 8.2 },
            { id: 11, petId: 1, type: 'weight', title: '体重记录', date: '2026-06-10', note: '体重记录', cost: 0, weight: 8.3 },
            { id: 12, petId: 1, type: 'weight', title: '体重记录', date: '2026-06-20', note: '体重记录', cost: 0, weight: 8.4 },
            { id: 8, petId: 1, type: 'hygiene', title: '洗澡护理', date: '2026-06-08', note: '宠物店洗护', cost: 80, weight: 8.5 },
            { id: 9, petId: 1, type: 'expense', title: '狗粮', date: '2026-06-05', note: '皇家柴犬粮 2kg', cost: 128 }
        ],
        hygieneRecords: [
            { id: 1, petId: 1, type: 'bath', typeName: '洗澡', name: '洗澡护理', date: new Date('2026-06-08T10:00:00').getTime(), nextDate: new Date('2026-06-22T10:00:00').getTime(), duration: 45, cost: 80, products: '宠物沐浴露', effect: '毛发顺滑', note: '宠物店洗护' },
            { id: 2, petId: 1, type: 'nailTrim', typeName: '剪指甲', name: '剪指甲', date: new Date('2026-06-15T15:30:00').getTime(), nextDate: new Date('2026-06-29T15:30:00').getTime(), duration: 15, cost: 0, products: '宠物指甲剪', effect: '指甲整齐', note: '在家修剪' },
            { id: 3, petId: 1, type: 'teethBrush', typeName: '刷牙', name: '刷牙', date: new Date('2026-06-20T08:00:00').getTime(), nextDate: new Date('2026-06-21T08:00:00').getTime(), duration: 5, cost: 0, products: '宠物牙膏', effect: '口气清新', note: '每天坚持' },
            { id: 4, petId: 2, type: 'grooming', typeName: '美容美毛', name: '梳毛', date: new Date('2026-06-18T09:00:00').getTime(), nextDate: new Date('2026-06-25T09:00:00').getTime(), duration: 20, cost: 0, products: '猫用梳子', effect: '毛发顺滑', note: '清理浮毛' },
            { id: 5, petId: 2, type: 'bath', typeName: '洗澡', name: '洗澡', date: new Date('2026-05-20T14:00:00').getTime(), nextDate: new Date('2026-08-20T14:00:00').getTime(), duration: 30, cost: 120, products: '猫用沐浴露', effect: '干净清爽', note: '宠物店洗护' }
        ],
        reminders: [
            { id: 1, petId: 1, type: 'vaccine', title: '狂犬疫苗加强针', date: '2026-05-10', daysLeft: 299 },
            { id: 2, petId: 1, type: 'deworm', title: '体内驱虫', date: '2025-08-01', daysLeft: 17 },
            { id: 3, petId: 1, type: 'checkup', title: '年度体检', date: '2026-04-20', daysLeft: 279 },
            { id: 4, petId: 2, type: 'vaccine', title: '猫三联第三针', date: '2025-07-25', daysLeft: 11 }
        ],
        weights: [
            { petId: 1, date: '1月', value: 8.1 },
            { petId: 1, date: '2月', value: 8.2 },
            { petId: 1, date: '3月', value: 8.3 },
            { petId: 1, date: '4月', value: 8.4 },
            { petId: 1, date: '5月', value: 8.3 },
            { petId: 1, date: '6月', value: 8.5 }
        ],
        currentPetId: 1,
        settings: {
            notification: true,
            sound: true,
            vibration: false
        }
    },

    init() {
        try {
            const saved = localStorage.getItem('petAppData');
            this.data = saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(this.DEFAULT_DATA));
        } catch (e) {
            this.data = JSON.parse(JSON.stringify(this.DEFAULT_DATA));
        }
        this.save();
    },

    save() {
        try {
            localStorage.setItem('petAppData', JSON.stringify(this.data));
        } catch (e) {}
    },

    reset() {
        this.data = JSON.parse(JSON.stringify(this.DEFAULT_DATA));
        this.save();
    },

    getCurrentPet() {
        return this.data.pets.find(p => p.id === this.data.currentPetId) || this.data.pets[0];
    },

    getPetRecords(petId) {
        return this.data.records.filter(r => r.petId === petId).sort((a, b) => new Date(b.date) - new Date(a.date));
    },

    getPetHygieneRecords(petId) {
        return (this.data.hygieneRecords || []).filter(r => r.petId === petId).sort((a, b) => b.date - a.date);
    },

    getPetReminders(petId) {
        return this.data.reminders.filter(r => r.petId === petId);
    },

    getTypeIcon(type) {
        const icons = { vaccine: '💉', deworm: '💊', medical: '🏥', weight: '⚖️', hygiene: '🛁', expense: '📝', checkup: '🏥' };
        return icons[type] || '📌';
    },

    getTypeColor(type) {
        const colors = { vaccine: '#4CAF50', deworm: '#FF9800', medical: '#F44336', weight: '#2196F3', hygiene: '#00BCD4', expense: '#9C27B0', checkup: '#607D8B' };
        return colors[type] || '#999';
    },

    getTypeName(type) {
        const names = { vaccine: '疫苗', deworm: '驱虫', medical: '就医', weight: '体重', hygiene: '护理', expense: '支出', checkup: '体检' };
        return names[type] || type;
    },

    addPet(pet) {
        pet.id = Date.now();
        pet.status = 'active';
        pet.avatar = pet.type === 'dog' ? '🐕' : pet.type === 'cat' ? '🐈' : '🐾';
        this.data.pets.push(pet);
        this.data.currentPetId = pet.id;
        this.save();
        return pet;
    },

    updatePet(id, updates) {
        const idx = this.data.pets.findIndex(p => p.id === id);
        if (idx >= 0) {
            this.data.pets[idx] = { ...this.data.pets[idx], ...updates };
            this.save();
        }
    },

    addRecord(record) {
        record.id = Date.now();
        this.data.records.push(record);
        this.save();
    },

    addReminder(reminder) {
        reminder.id = Date.now();
        this.data.reminders.push(reminder);
        this.save();
    },

    deleteReminder(id) {
        this.data.reminders = this.data.reminders.filter(r => r.id !== id);
        this.save();
    },

    completeReminder(id) {
        const r = this.data.reminders.find(r => r.id === id);
        if (r) {
            r.completed = true;
            this.save();
        }
    },

    updateSettings(key, value) {
        this.data.settings[key] = value;
        this.save();
    }
};

// Utils
function $(selector) {
    return document.querySelector(selector);
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('active');
    setTimeout(() => toast.classList.remove('active'), 2000);
}

function formatDate(dateStr) {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}月${d.getDate()}日`;
}

function getParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
}

// Tab bar builder
function buildTabBar(activeTab) {
    const tabs = [
        { id: 'home', text: '首页', icon: '🏠', href: 'index.html' },
        { id: 'health', text: '健康', icon: '💉', href: 'health-records.html' },
        { id: 'hygiene', text: '护理', icon: '🛁', href: 'hygiene-list.html' },
        { id: 'analysis', text: '分析', icon: '📊', href: 'analysis.html' },
        { id: 'settings', text: '设置', icon: '⚙️', href: 'settings.html' }
    ];
    return `<div class="tab-bar">${tabs.map(t => `
        <a href="${t.href}" class="tab-item ${t.id === activeTab ? 'active' : ''}">
            <span class="tab-icon">${t.icon}</span>
            <span class="tab-text">${t.text}</span>
        </a>
    `).join('')}</div>`;
}

// Common page wrapper
function initPage(options = {}) {
    App.init();
    document.body.insertAdjacentHTML('beforeend', '<div id="toast" class="toast"></div>');
    if (options.tab) {
        const phone = document.querySelector('.phone-frame');
        if (phone) phone.insertAdjacentHTML('beforeend', buildTabBar(options.tab));
    }
    if (options.title) {
        const navTitle = document.getElementById('navTitle');
        if (navTitle) navTitle.textContent = options.title;
    }
    if (options.back !== false) {
        const navBack = document.getElementById('navBack');
        if (navBack) {
            navBack.style.display = 'flex';
            navBack.href = options.backUrl || 'javascript:history.back()';
        }
    }
}

// Render helpers
function renderPetSelector(containerId, onSelect) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const current = App.getCurrentPet();
    container.innerHTML = `
        <div class="pet-selector" style="background:#fff;padding:12px 16px;margin-bottom:12px;">
            <div class="feature-scroll">
                ${App.data.pets.map(p => `
                    <div class="feature-item" onclick="${onSelect}(${p.id})" style="min-width:60px">
                        <div class="pet-avatar-small">${p.avatar}</div>
                        <span class="feature-name ${p.id === current.id ? 'primary' : ''}" style="color:${p.id === current.id ? 'var(--primary)' : ''};font-weight:${p.id === current.id ? '600' : '400'}">${p.name}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function renderRecordIcon(type) {
    return `<div style="width:44px;height:44px;border-radius:12px;background:${App.getTypeColor(type)}20;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">${App.getTypeIcon(type)}</div>`;
}

// Auto-init common
if (typeof window !== 'undefined') {
    window.App = App;
    window.$ = $;
    window.showToast = showToast;
    window.formatDate = formatDate;
    window.getParam = getParam;
    window.buildTabBar = buildTabBar;
    window.initPage = initPage;
    window.renderPetSelector = renderPetSelector;
    window.renderRecordIcon = renderRecordIcon;
}
