(function() {
    'use strict';

    const STORAGE_KEYS = {
        LUNCHBOX: 'today_eaten_lunchbox',
        TAKEOUT: 'today_eaten_takeout'
    };

    const FOOD_LIBRARY = {
        diet: ['鸡胸肉沙拉', '水煮西兰花', '燕麦粥', '蒸蛋', '凉拌黄瓜'],
        fitness: ['牛肉糙米饭', '鸡胸肉意面', '蛋白煎饼', '三文鱼沙拉', '藜麦碗'],
        spicy: ['麻辣香锅', '水煮鱼', '辣子鸡', '毛血旺', '螺蛳粉'],
        light: ['白粥配小菜', '清蒸鱼', '冬瓜汤', '蔬菜汤面', '莲子银耳羹'],
        quick: ['番茄炒蛋', '蛋炒饭', '泡面', '三明治', '速冻水饺']
    };

    const TAG_NAMES = {
        diet: '减脂餐',
        fitness: '健身餐',
        spicy: '重口味',
        light: '清淡',
        quick: '快手菜'
    };

    const RECOGNITION_RESULTS = [
        [
            { name: '红烧肉', calories: 350 },
            { name: '米饭', calories: 130 },
            { name: '炒青菜', calories: 50 }
        ],
        [
            { name: '番茄炒蛋', calories: 180 },
            { name: '米饭', calories: 130 },
            { name: '紫菜蛋花汤', calories: 40 }
        ],
        [
            { name: '宫保鸡丁', calories: 280 },
            { name: '米饭', calories: 130 },
            { name: '凉拌黄瓜', calories: 30 }
        ]
    ];

    let lunchboxPhotos = [];
    let takeoutPhotos = [];

    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    function getTodayDate() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function getFromStorage(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('读取 localStorage 失败:', e);
            return [];
        }
    }

    function saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('保存 localStorage 失败:', e);
            return false;
        }
    }

    function renderStars(rating) {
        let html = '';
        for (let i = 1; i <= 5; i++) {
            html += `<span class="star ${i <= rating ? 'filled' : ''}">★</span>`;
        }
        return html;
    }

    function getRankClass(index) {
        if (index === 0) return 'rank-1';
        if (index === 1) return 'rank-2';
        if (index === 2) return 'rank-3';
        return 'rank-other';
    }

    function getRankIcon(index) {
        if (index === 0) return '🥇';
        if (index === 1) return '🥈';
        if (index === 2) return '🥉';
        return index + 1;
    }

    function initTabs() {
        const navItems = document.querySelectorAll('.nav-item');
        const tabContents = document.querySelectorAll('.tab-content');

        navItems.forEach(item => {
            item.addEventListener('click', function() {
                const targetTab = this.getAttribute('data-tab');

                navItems.forEach(n => n.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));

                this.classList.add('active');
                document.getElementById(targetTab).classList.add('active');

                if (targetTab === 'ranking') {
                    renderRanking('lunchbox');
                }
            });
        });
    }

    function initStarRating() {
        const starRatings = document.querySelectorAll('.star-rating');

        starRatings.forEach(rating => {
            const stars = rating.querySelectorAll('.star');

            stars.forEach(star => {
                star.addEventListener('click', function() {
                    const value = parseInt(this.getAttribute('data-value'));
                    rating.setAttribute('data-rating', value);
                    stars.forEach(s => {
                        const v = parseInt(s.getAttribute('data-value'));
                        s.classList.toggle('active', v <= value);
                    });
                });
            });
        });
    }

    function filterByDate(records, filterType) {
        if (!filterType) return records;

        const today = new Date();
        const todayStr = getTodayDate();

        if (filterType === 'today') {
            return records.filter(r => r.date === todayStr);
        }

        if (filterType === 'week') {
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay());
            return records.filter(r => {
                const recordDate = new Date(r.date);
                return recordDate >= weekStart;
            });
        }

        if (filterType === 'month') {
            const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
            return records.filter(r => {
                const recordDate = new Date(r.date);
                return recordDate >= monthStart;
            });
        }

        return records;
    }

    function getLunchboxRecords(filterType) {
        const records = getFromStorage(STORAGE_KEYS.LUNCHBOX);
        return filterByDate(records, filterType);
    }

    function saveLunchboxRecord(record) {
        const records = getFromStorage(STORAGE_KEYS.LUNCHBOX);
        records.unshift(record);
        saveToStorage(STORAGE_KEYS.LUNCHBOX, records);
    }

    function deleteLunchboxRecord(id) {
        const records = getFromStorage(STORAGE_KEYS.LUNCHBOX);
        const filtered = records.filter(r => r.id !== id);
        saveToStorage(STORAGE_KEYS.LUNCHBOX, filtered);
    }

    function renderLunchboxList() {
        const listEl = document.getElementById('lunchbox-list');
        const filterType = document.getElementById('lunchbox-date-filter').value;
        const records = getLunchboxRecords(filterType);

        if (records.length === 0) {
            listEl.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🍱</div>
                    <div class="empty-state-text">暂无带饭记录，快去添加吧~</div>
                </div>
            `;
            return;
        }

        let html = '';
        records.forEach(record => {
            let imagesHtml = '';
            if (record.photos && record.photos.length > 0) {
                imagesHtml = `<div class="record-card-images">${record.photos.map(p => `<img src="${p}" alt="照片">`).join('')}</div>`;
            }
            const dishTagHtml = record.dishType === 'veggie'
                ? '<span class="dish-tag veggie">素菜</span>'
                : '<span class="dish-tag meat">荤菜</span>';
            html += `
                <div class="record-card" data-id="${record.id}">
                    <div class="record-card-header">
                        <div class="record-card-title">${record.dishName}${dishTagHtml}</div>
                        <div class="record-card-date">${record.date}</div>
                    </div>
                    <div class="record-card-rating">
                        ${renderStars(record.rating)}
                    </div>
                    ${imagesHtml}
                    <div class="record-card-actions">
                        <button class="btn-delete" data-action="delete-lunchbox" data-id="${record.id}">删除</button>
                    </div>
                </div>
            `;
        });

        listEl.innerHTML = html;

        listEl.querySelectorAll('[data-action="delete-lunchbox"]').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                if (confirm('确定要删除这条带饭记录吗？')) {
                    deleteLunchboxRecord(id);
                    renderLunchboxList();
                }
            });
        });
    }

    function initLunchboxPhotoUpload() {
        const fileInput = document.getElementById('lunchbox-photo');
        const previewEl = document.getElementById('lunchbox-photo-preview');

        fileInput.addEventListener('change', function(e) {
            const files = e.target.files;
            if (!files || files.length === 0) return;

            Array.from(files).forEach(file => {
                const reader = new FileReader();
                reader.onload = function(event) {
                    lunchboxPhotos.push(event.target.result);
                    const img = document.createElement('img');
                    img.src = event.target.result;
                    img.onclick = function() {
                        const index = lunchboxPhotos.indexOf(this.src);
                        if (index !== -1) {
                            lunchboxPhotos.splice(index, 1);
                            this.remove();
                        }
                    };
                    previewEl.appendChild(img);
                };
                reader.readAsDataURL(file);
            });
        });
    }

    function initLunchboxForm() {
        const form = document.getElementById('lunchbox-form');
        const dateInput = document.getElementById('lunchbox-date');
        const previewEl = document.getElementById('lunchbox-photo-preview');
        dateInput.value = getTodayDate();

        form.addEventListener('submit', function(e) {
            e.preventDefault();

            const dishName = document.getElementById('lunchbox-dish').value.trim();
            const date = document.getElementById('lunchbox-date').value;
            const ratingEl = form.querySelector('.star-rating');
            const rating = parseInt(ratingEl.getAttribute('data-rating')) || 0;
            const dishType = form.querySelector('input[name="lunchbox-dish-type"]:checked').value;

            if (!dishName) {
                alert('请输入菜品名称');
                return;
            }

            if (rating === 0) {
                alert('请选择喜欢度评分');
                return;
            }

            const record = {
                id: generateId(),
                dishName: dishName,
                dishType: dishType,
                date: date,
                rating: rating,
                photos: [...lunchboxPhotos]
            };

            saveLunchboxRecord(record);
            form.reset();
            dateInput.value = getTodayDate();
            ratingEl.setAttribute('data-rating', '0');
            ratingEl.querySelectorAll('.star').forEach(s => s.classList.remove('active'));
            form.querySelector('input[name="lunchbox-dish-type"][value="meat"]').checked = true;
            lunchboxPhotos = [];
            previewEl.innerHTML = '';
            renderLunchboxList();
        });
    }

    function initLunchboxDateFilter() {
        const filterEl = document.getElementById('lunchbox-date-filter');
        filterEl.addEventListener('change', renderLunchboxList);
    }

    function getTakeoutRecords(filterType) {
        const records = getFromStorage(STORAGE_KEYS.TAKEOUT);
        return filterByDate(records, filterType);
    }

    function saveTakeoutRecord(record) {
        const records = getFromStorage(STORAGE_KEYS.TAKEOUT);
        records.unshift(record);
        saveToStorage(STORAGE_KEYS.TAKEOUT, records);
    }

    function deleteTakeoutRecord(id) {
        const records = getFromStorage(STORAGE_KEYS.TAKEOUT);
        const filtered = records.filter(r => r.id !== id);
        saveToStorage(STORAGE_KEYS.TAKEOUT, filtered);
    }

    function renderTakeoutList() {
        const listEl = document.getElementById('takeout-list');
        const filterType = document.getElementById('takeout-date-filter').value;
        const records = getTakeoutRecords(filterType);

        if (records.length === 0) {
            listEl.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🥡</div>
                    <div class="empty-state-text">暂无外卖记录，快去添加吧~</div>
                </div>
            `;
            return;
        }

        let html = '';
        records.forEach(record => {
            let imagesHtml = '';
            if (record.photos && record.photos.length > 0) {
                imagesHtml = `<div class="record-card-images">${record.photos.map(p => `<img src="${p}" alt="照片">`).join('')}</div>`;
            }
            html += `
                <div class="record-card" data-id="${record.id}">
                    <div class="record-card-header">
                        <div class="record-card-title">${record.restaurant} - ${record.dishName}</div>
                        <div class="record-card-date">${record.date}</div>
                    </div>
                    <div class="record-card-rating">
                        ${renderStars(record.rating)}
                    </div>
                    ${imagesHtml}
                    <div class="record-card-actions">
                        <button class="btn-delete" data-action="delete-takeout" data-id="${record.id}">删除</button>
                    </div>
                </div>
            `;
        });

        listEl.innerHTML = html;

        listEl.querySelectorAll('[data-action="delete-takeout"]').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                if (confirm('确定要删除这条外卖记录吗？')) {
                    deleteTakeoutRecord(id);
                    renderTakeoutList();
                }
            });
        });
    }

    function initTakeoutPhotoUpload() {
        const fileInput = document.getElementById('takeout-photo');
        const previewEl = document.getElementById('takeout-photo-preview');

        fileInput.addEventListener('change', function(e) {
            const files = e.target.files;
            if (!files || files.length === 0) return;

            Array.from(files).forEach(file => {
                const reader = new FileReader();
                reader.onload = function(event) {
                    takeoutPhotos.push(event.target.result);
                    const img = document.createElement('img');
                    img.src = event.target.result;
                    img.onclick = function() {
                        const index = takeoutPhotos.indexOf(this.src);
                        if (index !== -1) {
                            takeoutPhotos.splice(index, 1);
                            this.remove();
                        }
                    };
                    previewEl.appendChild(img);
                };
                reader.readAsDataURL(file);
            });
        });
    }

    function initTakeoutForm() {
        const form = document.getElementById('takeout-form');
        const dateInput = document.getElementById('takeout-date');
        const previewEl = document.getElementById('takeout-photo-preview');
        dateInput.value = getTodayDate();

        form.addEventListener('submit', function(e) {
            e.preventDefault();

            const restaurant = document.getElementById('takeout-store').value.trim();
            const dishName = document.getElementById('takeout-dish').value.trim();
            const date = document.getElementById('takeout-date').value;
            const ratingEl = form.querySelector('.star-rating');
            const rating = parseInt(ratingEl.getAttribute('data-rating')) || 0;

            if (!restaurant) {
                alert('请输入店家名称');
                return;
            }

            if (!dishName) {
                alert('请输入菜品名称');
                return;
            }

            if (rating === 0) {
                alert('请选择喜欢度评分');
                return;
            }

            const record = {
                id: generateId(),
                restaurant: restaurant,
                dishName: dishName,
                date: date,
                rating: rating,
                photos: [...takeoutPhotos]
            };

            saveTakeoutRecord(record);
            form.reset();
            dateInput.value = getTodayDate();
            ratingEl.setAttribute('data-rating', '0');
            ratingEl.querySelectorAll('.star').forEach(s => s.classList.remove('active'));
            takeoutPhotos = [];
            previewEl.innerHTML = '';
            renderTakeoutList();
        });
    }

    function initTakeoutDateFilter() {
        const filterEl = document.getElementById('takeout-date-filter');
        filterEl.addEventListener('change', renderTakeoutList);
    }

    function calculateRanking(type) {
        let allRecords = [];

        if (type === 'lunchbox' || type === 'all') {
            getFromStorage(STORAGE_KEYS.LUNCHBOX).forEach(r => {
                allRecords.push({ ...r, type: 'lunchbox' });
            });
        }

        if (type === 'takeout' || type === 'all') {
            getFromStorage(STORAGE_KEYS.TAKEOUT).forEach(r => {
                allRecords.push({ ...r, type: 'takeout' });
            });
        }

        const dishMap = {};
        allRecords.forEach(record => {
            const key = record.type === 'lunchbox' ? record.dishName : `${record.restaurant}-${record.dishName}`;
            if (!dishMap[key]) {
                dishMap[key] = {
                    name: record.dishName,
                    restaurant: record.restaurant || '',
                    type: record.type,
                    totalRating: 0,
                    count: 0,
                    avgRating: 0
                };
            }
            dishMap[key].totalRating += record.rating;
            dishMap[key].count++;
        });

        Object.keys(dishMap).forEach(key => {
            dishMap[key].avgRating = Math.round(dishMap[key].totalRating / dishMap[key].count * 10) / 10;
        });

        return Object.values(dishMap).sort((a, b) => {
            if (b.avgRating !== a.avgRating) {
                return b.avgRating - a.avgRating;
            }
            return b.count - a.count;
        });
    }

    function renderRanking(type) {
        const listEl = document.getElementById('ranking-list');
        const rankings = calculateRanking(type);

        if (rankings.length === 0) {
            listEl.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🏆</div>
                    <div class="empty-state-text">还没有足够的记录来生成排行榜~</div>
                </div>
            `;
            return;
        }

        let html = '';
        rankings.slice(0, 10).forEach((item, index) => {
            const typeText = item.type === 'lunchbox' ? '带饭' : '外卖';
            const rankClass = getRankClass(index);
            const rankIcon = getRankIcon(index);
            const title = item.restaurant ? `${item.restaurant} - ${item.name}` : item.name;

            html += `
                <div class="ranking-item">
                    <div class="ranking-rank ${rankClass}">${rankIcon}</div>
                    <div class="ranking-info">
                        <div class="ranking-name">${title}</div>
                        <div class="ranking-details">${typeText} · 吃过 ${item.count} 次 · 平均评分 ${item.avgRating}</div>
                    </div>
                    <div class="ranking-rating">
                        ${renderStars(Math.round(item.avgRating))}
                    </div>
                </div>
            `;
        });

        listEl.innerHTML = html;
    }

    function initRankingTabs() {
        const tabs = document.querySelectorAll('.ranking-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', function() {
                tabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                const type = this.getAttribute('data-type');
                renderRanking(type);
            });
        });
    }

    function initPersonalRecommend() {
        const btn = document.getElementById('btn-personal-recommend');
        const resultEl = document.getElementById('personal-result');

        btn.addEventListener('click', function() {
            const mealType = document.querySelector('input[name="meal-type"]:checked').value;

            const lunchboxRecords = getFromStorage(STORAGE_KEYS.LUNCHBOX);
            const takeoutRecords = getFromStorage(STORAGE_KEYS.TAKEOUT);

            if (mealType === 'lunchbox') {
                const meatDishes = lunchboxRecords.filter(r => r.dishType !== 'veggie');
                const veggieDishes = lunchboxRecords.filter(r => r.dishType === 'veggie');

                if (meatDishes.length === 0 && veggieDishes.length === 0) {
                    resultEl.innerHTML = `
                        <div class="empty-state">
                            <div class="empty-state-icon">🤔</div>
                            <div class="empty-state-text">还没有带饭记录，先去添加一些吧~</div>
                        </div>
                    `;
                    return;
                }

                const meat = meatDishes.length > 0
                    ? meatDishes[Math.floor(Math.random() * meatDishes.length)]
                    : null;
                const veggie = veggieDishes.length > 0
                    ? veggieDishes[Math.floor(Math.random() * veggieDishes.length)]
                    : null;

                let html = '<div class="recommend-card">';
                html += '<div class="recommend-card-label">🍱 带饭推荐</div>';

                if (meat) {
                    html += `
                        <div class="recommend-dish">
                            <span class="dish-tag meat" style="margin-left:0">荤菜</span>
                            <span class="recommend-dish-name">${meat.dishName}</span>
                            <span class="recommend-dish-rating">${renderStars(meat.rating)}</span>
                        </div>
                    `;
                }
                if (veggie) {
                    html += `
                        <div class="recommend-dish">
                            <span class="dish-tag veggie" style="margin-left:0">素菜</span>
                            <span class="recommend-dish-name">${veggie.dishName}</span>
                            <span class="recommend-dish-rating">${renderStars(veggie.rating)}</span>
                        </div>
                    `;
                }
                if (!meat && veggie) {
                    html += '<div class="recommend-card-date" style="margin-top:8px">提示：还没有荤菜记录，快去添加吧~</div>';
                }
                if (!veggie && meat) {
                    html += '<div class="recommend-card-date" style="margin-top:8px">提示：还没有素菜记录，快去添加吧~</div>';
                }

                html += '</div>';
                resultEl.innerHTML = html;
                return;
            }

            const allRecords = [];

            if (mealType === 'takeout') {
                takeoutRecords.forEach(r => {
                    allRecords.push({ ...r, type: 'takeout' });
                });
            } else if (mealType === 'all') {
                lunchboxRecords.forEach(r => {
                    allRecords.push({ ...r, type: 'lunchbox' });
                });
                takeoutRecords.forEach(r => {
                    allRecords.push({ ...r, type: 'takeout' });
                });
            }

            if (allRecords.length === 0) {
                let emptyText = '还没有任何记录，先去添加一些吧~';
                if (mealType === 'takeout') {
                    emptyText = '还没有外卖记录，先去添加一些吧~';
                }
                resultEl.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">🤔</div>
                        <div class="empty-state-text">${emptyText}</div>
                    </div>
                `;
                return;
            }

            const randomIndex = Math.floor(Math.random() * allRecords.length);
            const picked = allRecords[randomIndex];

            if (picked.type === 'lunchbox') {
                const meatDishes = lunchboxRecords.filter(r => r.dishType !== 'veggie');
                const veggieDishes = lunchboxRecords.filter(r => r.dishType === 'veggie');
                const meat = meatDishes.length > 0
                    ? meatDishes[Math.floor(Math.random() * meatDishes.length)]
                    : null;
                const veggie = veggieDishes.length > 0
                    ? veggieDishes[Math.floor(Math.random() * veggieDishes.length)]
                    : null;

                let html = '<div class="recommend-card">';
                html += '<div class="recommend-card-label">🍱 带饭推荐</div>';
                if (meat) {
                    html += `
                        <div class="recommend-dish">
                            <span class="dish-tag meat" style="margin-left:0">荤菜</span>
                            <span class="recommend-dish-name">${meat.dishName}</span>
                            <span class="recommend-dish-rating">${renderStars(meat.rating)}</span>
                        </div>
                    `;
                }
                if (veggie) {
                    html += `
                        <div class="recommend-dish">
                            <span class="dish-tag veggie" style="margin-left:0">素菜</span>
                            <span class="recommend-dish-name">${veggie.dishName}</span>
                            <span class="recommend-dish-rating">${renderStars(veggie.rating)}</span>
                        </div>
                    `;
                }
                if (!meat && veggie) {
                    html += '<div class="recommend-card-date" style="margin-top:8px">提示：还没有荤菜记录，快去添加吧~</div>';
                }
                if (!veggie && meat) {
                    html += '<div class="recommend-card-date" style="margin-top:8px">提示：还没有素菜记录，快去添加吧~</div>';
                }
                html += '</div>';
                resultEl.innerHTML = html;
            } else {
                resultEl.innerHTML = `
                    <div class="recommend-card">
                        <div class="recommend-card-label">🥡 外卖</div>
                        <div class="recommend-card-title">${picked.restaurant} - ${picked.dishName}</div>
                        <div class="recommend-card-rating">
                            ${renderStars(picked.rating)}
                        </div>
                        <div class="recommend-card-date">上次吃：${picked.date}</div>
                    </div>
                `;
            }
        });
    }

    function initCrowdRecommend() {
        const btn = document.getElementById('btn-crowd-recommend');
        const resultEl = document.getElementById('crowd-result');

        btn.addEventListener('click', function() {
            const checkedTags = document.querySelectorAll('input[name="crowd-tag"]:checked');

            if (checkedTags.length === 0) {
                resultEl.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">🏷️</div>
                        <div class="empty-state-text">请先选择至少一个标签哦~</div>
                    </div>
                `;
                return;
            }

            const allFoods = [];
            checkedTags.forEach(tag => {
                const tagValue = tag.value;
                const foods = FOOD_LIBRARY[tagValue] || [];
                foods.forEach(food => {
                    allFoods.push({
                        name: food,
                        tag: tagValue,
                        tagName: TAG_NAMES[tagValue]
                    });
                });
            });

            const count = Math.min(Math.floor(Math.random() * 3) + 1, allFoods.length);
            const shuffled = allFoods.sort(() => Math.random() - 0.5);
            const picked = shuffled.slice(0, count);

            let html = '';
            picked.forEach((food, index) => {
                html += `
                    <div class="recommend-card" style="margin-bottom: 16px; animation-delay: ${index * 0.1}s;">
                        <div class="recommend-card-label">${food.tagName}</div>
                        <div class="recommend-card-title">${food.name}</div>
                    </div>
                `;
            });

            resultEl.innerHTML = html;
        });
    }

    function migrateLunchboxData() {
        const records = getFromStorage(STORAGE_KEYS.LUNCHBOX);
        let changed = false;
        records.forEach(r => {
            if (!r.dishType) {
                r.dishType = 'meat';
                changed = true;
            }
        });
        if (changed) {
            saveToStorage(STORAGE_KEYS.LUNCHBOX, records);
        }
    }

    function initSampleData() {
        const lunchboxRecords = getFromStorage(STORAGE_KEYS.LUNCHBOX);
        const takeoutRecords = getFromStorage(STORAGE_KEYS.TAKEOUT);

        if (lunchboxRecords.length === 0 && takeoutRecords.length === 0) {
            const today = getTodayDate();
            const yesterday = (() => {
                const d = new Date();
                d.setDate(d.getDate() - 1);
                return d.toISOString().split('T')[0];
            })();
            const dayBefore = (() => {
                const d = new Date();
                d.setDate(d.getDate() - 2);
                return d.toISOString().split('T')[0];
            })();

            const sampleLunchbox = [
                { id: generateId(), dishName: '番茄炒蛋', dishType: 'veggie', date: today, rating: 5, photos: [] },
                { id: generateId(), dishName: '红烧肉', dishType: 'meat', date: yesterday, rating: 4, photos: [] },
                { id: generateId(), dishName: '炒青菜', dishType: 'veggie', date: dayBefore, rating: 3, photos: [] },
                { id: generateId(), dishName: '糖醋排骨', dishType: 'meat', date: dayBefore, rating: 5, photos: [] },
                { id: generateId(), dishName: '红烧肉', dishType: 'meat', date: today, rating: 5, photos: [] }
            ];

            const sampleTakeout = [
                { id: generateId(), restaurant: '麦当劳', dishName: '巨无霸套餐', date: today, rating: 4, photos: [] },
                { id: generateId(), restaurant: '沙县小吃', dishName: '飘香拌面', date: yesterday, rating: 3, photos: [] },
                { id: generateId(), restaurant: '黄焖鸡米饭', dishName: '黄焖鸡米饭', date: dayBefore, rating: 5, photos: [] },
                { id: generateId(), restaurant: '黄焖鸡米饭', dishName: '黄焖鸡米饭', date: today, rating: 5, photos: [] },
                { id: generateId(), restaurant: '麦当劳', dishName: '薯条', date: dayBefore, rating: 4, photos: [] }
            ];

            saveToStorage(STORAGE_KEYS.LUNCHBOX, sampleLunchbox);
            saveToStorage(STORAGE_KEYS.TAKEOUT, sampleTakeout);
        }
    }

    function init() {
        migrateLunchboxData();
        initSampleData();
        initTabs();
        initStarRating();
        initLunchboxForm();
        initLunchboxPhotoUpload();
        initLunchboxDateFilter();
        initTakeoutForm();
        initTakeoutPhotoUpload();
        initTakeoutDateFilter();
        initRankingTabs();
        renderLunchboxList();
        renderTakeoutList();
        initPersonalRecommend();
        initCrowdRecommend();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
