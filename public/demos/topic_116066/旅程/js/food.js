/* ============================================ */
/* food.js - 美食发现模块（Tab 2）              */
/* 作用：美食搜索、筛选、收藏                    */
/* 状态：阶段4 将填充完整功能                    */
/* ============================================ */

window.Food = {
    currentCity: '全部',
    currentCategory: '全部',
    searchKeyword: '',
    _searchTimer: null,  // 搜索防抖定时器

    init() {
        this.render();
        // 绑定下拉刷新（创新点）
        if (typeof App !== 'undefined' && App.bindPullRefresh) {
            App.bindPullRefresh('food', () => {
                this.render();
            });
        }
    },

    render() {
        const content = document.getElementById('food-content');
        let foods = Data.foods;

        // 筛选城市
        if (this.currentCity !== '全部') {
            foods = foods.filter(f => f.city === this.currentCity);
        }
        // 筛选分类
        if (this.currentCategory !== '全部') {
            foods = foods.filter(f => f.cuisine === this.currentCategory);
        }
        // 搜索
        if (this.searchKeyword) {
            foods = foods.filter(f =>
                f.name.includes(this.searchKeyword) ||
                f.cuisine.includes(this.searchKeyword) ||
                f.desc.includes(this.searchKeyword)
            );
        }

        content.innerHTML = `
            <!-- 搜索框 -->
            <div class="search-box" style="margin-bottom: 12px;">
                <span>🔍</span>
                <input type="text" placeholder="搜索店名、菜系..." value="${this.searchKeyword}"
                    oninput="Food.onSearch(this.value)">
            </div>

            <!-- 城市筛选 -->
            <div class="filter-bar">
                ${['全部', ...Data.cities.map(c => c.name)].map(city => `
                    <button class="filter-btn ${this.currentCity === city ? 'active' : ''}"
                        onclick="Food.filterCity('${city}')">${city}</button>
                `).join('')}
            </div>

            <!-- 分类筛选 -->
            <div class="filter-bar">
                ${Data.foodCategories.map(cat => `
                    <button class="filter-btn ${this.currentCategory === cat ? 'active' : ''}"
                        onclick="Food.filterCategory('${cat}')">${cat}</button>
                `).join('')}
            </div>

            <!-- 美食列表 -->
            <div style="margin-top: 8px;">
                ${foods.length === 0 ? `
                    <div class="empty-state">
                        <div class="empty-icon">🍽️</div>
                        <div class="empty-text">没有找到相关美食</div>
                    </div>
                ` : foods.map(f => this.renderFoodCard(f)).join('')}
            </div>
        `;
    },

    renderFoodCard(food) {
        const isFav = AppStorage.isFavorited(food.name, 'food');
        return `
            <div class="card" style="padding: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                            <span style="font-size: 20px;">${food.icon}</span>
                            <span style="font-size: 15px; font-weight: 600;">${food.name}</span>
                        </div>
                        <div style="font-size: 12px; color: var(--text-secondary);">
                            ${food.city} · ${food.cuisine} · ${food.area}
                        </div>
                        <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">
                            ⭐${food.rating} · ${food.reviews}条评价 · 来源: ${food.source}
                        </div>
                        <div style="font-size: 13px; color: var(--text-regular); margin-top: 6px;">${food.desc}</div>
                        <div style="font-size: 12px; color: var(--warning); margin-top: 4px;">💡 ${food.tip}</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 16px; color: var(--primary); font-weight: 600;">¥${food.price}</div>
                        <button class="icon-btn" onclick="Food.toggleFavorite('${food.name}')" style="margin-top: 4px;">
                            ${isFav ? '⭐' : '☆'}
                        </button>
                    </div>
                </div>
                <!-- 底部操作栏：加入行程 -->
                <div style="display: flex; gap: 8px; margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--divider-color);">
                    <button class="btn btn-default" style="flex: 1; font-size: 12px; padding: 6px;" onclick="Food.addToTrip('${food.name}')">
                        📌 加入行程
                    </button>
                </div>
            </div>
        `;
    },

    /**
     * 把美食加入行程
     * 小白理解：看到好吃的想去的店，直接加到行程清单里
     *           加完后振动 + 更新行程Tab角标
     */
    addToTrip(name) {
        const food = Data.foods.find(f => f.name === name);
        if (!food) return;
        const copy = Utils.deepCopy(food);
        copy.scenic = false;  // 标记这不是景点，是美食店
        const success = AppStorage.addToTrip(copy);
        if (success) {
            Utils.toast('✓ 已加入行程');
            Utils.vibrate([10]);
            if (typeof App !== 'undefined' && App.updateTabBadge) App.updateTabBadge();
        } else {
            Utils.toast('已在行程中');
            Utils.vibrate(5);
        }
    },

    /**
     * 搜索输入变化时触发（带防抖，避免频繁渲染）
     */
    onSearch(value) {
        this.searchKeyword = value;
        // 清除之前的定时器
        if (this._searchTimer) clearTimeout(this._searchTimer);
        // 300ms 后再渲染
        this._searchTimer = setTimeout(() => {
            this.render();
        }, 300);
    },

    filterCity(city) {
        this.currentCity = city;
        this.render();
    },

    filterCategory(cat) {
        this.currentCategory = cat;
        this.render();
    },

    toggleFavorite(name) {
        const food = Data.foods.find(f => f.name === name);
        if (!food) return;
        const copy = Utils.deepCopy(food);
        const isFav = AppStorage.toggleFavorite(copy, 'food');
        Utils.toast(isFav ? '已收藏 ⭐' : '已取消收藏');
        this.render();
    },

    onShow() {}
};
