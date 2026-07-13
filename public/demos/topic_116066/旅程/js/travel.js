/* ============================================ */
/* travel.js - 出行方案模块（Tab 3）            */
/* 作用：多目的地、票务、预订、住宿              */
/* 状态：阶段5 将填充完整功能                    */
/* ============================================ */

window.Travel = {
    stations: ['北京', ''],  // 出发地+第1站
    _planGenerated: false,  // 是否已生成方案（控制推荐区域的提示文字）
    _startDate: '',  // 出发日期
    _dailyPlans: [],  // 按日期分组的出行计划
    _scrollRaf: null,  // 滑动节流的 requestAnimationFrame ID
    _budget: 0,  // 用户设置的预算（0=未设置）

    init() {
        // 先尝试加载已保存的方案
        this.loadSavedPlan();
        this.render();
    },

    /**
     * 渲染出行页面
     * 小白理解：第一次打开时创建完整页面；
     *           之后如果输入区已存在，只更新结果区，绝不重建输入框
     *           这样用户打字时输入框永远不会被替换，不会失焦
     */
    render() {
        const content = document.getElementById('travel-content');

        // 如果输入区已存在，只更新结果区，不碰输入框
        const existingCard = document.getElementById('travel-input-card');
        if (existingCard) {
            const resultArea = document.getElementById('travel-result-area');
            if (resultArea) {
                resultArea.innerHTML = this.renderResultArea();
            }
            return;
        }

        // 第一次渲染，创建完整页面
        const tripCities = this.getTripCities();
        const hasTripCities = tripCities.length > 0;

        // 设置日期默认值为今天（首次渲染时）
        if (!this._startDate) {
            this._startDate = Utils.formatDate(new Date());
        }

        content.innerHTML = `
            <h3 style="font-size: 16px; margin-bottom: 12px;">🚄 出行规划</h3>

            <!-- 输入区：创建后永不重建 -->
            <div class="card" id="travel-input-card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <div style="font-size: 14px; font-weight: 600;">路线规划</div>
                    <div id="travel-import-btn-area">
                        ${hasTripCities ? `
                            <button class="btn btn-primary" style="font-size: 12px; padding: 4px 10px;" onclick="Travel.importFromTrip()">
                                📋 从行程导入目的地
                            </button>
                        ` : ''}
                    </div>
                </div>
                <!-- 日期选择器 -->
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                    <span style="font-size: 13px; color: var(--text-secondary); min-width: 50px;">出发日期</span>
                    <input type="date" id="travel-date-input" value="${this._startDate}"
                        style="flex: 1; padding: 6px 10px; border: 1px solid var(--border-color); border-radius: 6px; background: var(--bg-card); color: var(--text-primary);"
                        onchange="Travel.updateStartDate(this.value)">
                </div>
                <div id="stations-list">
                    ${this.renderStations()}
                </div>
                <div id="travel-add-btn-area">
                    ${this.stations.length < 10 ? `
                        <button class="btn btn-default btn-block" style="margin-top: 8px;" onclick="Travel.addStation()">
                            + 添加站点
                        </button>
                    ` : ''}
                </div>
                <div id="travel-trip-hint">
                    ${hasTripCities ? `
                        <div style="font-size: 12px; color: var(--text-secondary); margin-top: 8px; padding: 8px; background: var(--bg-page); border-radius: 6px;">
                            💡 检测到行程中有 <b>${tripCities.length}</b> 个目的地城市：${tripCities.join('、')}
                        </div>
                    ` : ''}
                </div>
                <button class="btn btn-primary btn-block" style="margin-top: 12px;" onclick="Travel.generatePlan()">
                    🔍 生成出行方案
                </button>
            </div>

            <!-- 结果区（生成方案时只刷新这部分） -->
            <div id="travel-result-area">
                ${this.renderResultArea()}
            </div>
        `;
    },

    /**
     * 只刷新结果区（推荐方案、票务、住宿），不重建输入框
     */
    renderResultArea() {
        if (!this._planGenerated) {
            return `
                <div class="card">
                    <div style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">🌟 智能推荐方案</div>
                    <div style="font-size: 13px; color: var(--text-secondary);">
                        输入出发地和目的地后，点击"生成出行方案"
                    </div>
                </div>
            `;
        }

        return this.renderDailyPlans();
    },

    /**
     * 渲染整体路线图（创新点：可视化多目的地路线）
     * 小白理解：把所有目的地用箭头连起来，一眼看清整体路线
     */
    renderRouteMap() {
        if (this._dailyPlans.length === 0) return '';
        // 提取所有不同目的地（保持顺序）
        const destinations = [];
        let lastFrom = '';
        this._dailyPlans.forEach(plan => {
            if (plan.isArrivalDay && plan.from && !destinations.includes(plan.from)) {
                destinations.push(plan.from);
                lastFrom = plan.from;
            }
            if (plan.to && !destinations.includes(plan.to)) {
                destinations.push(plan.to);
            }
        });
        if (destinations.length === 0) return '';

        return `
            <div class="card" style="padding: 12px; margin-bottom: 12px;">
                <div style="font-size: 14px; font-weight: 600; margin-bottom: 10px;">🗺️ 路线总览</div>
                <div style="display: flex; align-items: center; flex-wrap: wrap; gap: 4px;">
                    ${destinations.map((dest, i) => {
                        const cityData = Data.cities.find(c => c.name === dest);
                        const icon = cityData ? cityData.icon : '📌';
                        const isLast = i === destinations.length - 1;
                        return `
                            <div style="display: flex; align-items: center; gap: 4px;">
                                <div style="padding: 6px 10px; background: ${isLast ? 'var(--primary)' : 'var(--bg-page)'}; color: ${isLast ? '#fff' : 'var(--text-primary)'}; border-radius: var(--radius-full); font-size: 12px; font-weight: 500;">
                                    ${icon} ${dest}
                                </div>
                                ${!isLast ? `<span style="color: var(--text-placeholder); font-size: 12px;">→</span>` : ''}
                            </div>
                        `;
                    }).join('')}
                </div>
                <div style="font-size: 11px; color: var(--text-placeholder); margin-top: 8px;">
                    共 ${destinations.length} 个目的地 · ${this._dailyPlans.length} 天行程
                </div>
            </div>
        `;
    },

    /**
     * 设置预算
     * 小白理解：用户输入预算后，费用超出会红色提醒
     *           空值处理：清空输入框时设为0，不显示NaN
     */
    setBudget(value) {
        if (value === '' || value === null || value === undefined) {
            this._budget = 0;
        } else {
            const num = parseFloat(value);
            this._budget = isNaN(num) ? 0 : Math.max(0, num);
        }
        this.updateCostSummary();
    },

    /**
     * 显示行李清单（创新点：根据目的地天气智能推荐）
     * 小白理解：根据旅程中各城市的天气情况，自动推荐要带的东西
     */
    showPackingList() {
        Utils.vibrate(8);
        // 根据天气生成推荐清单
        const recommendations = this.generatePackingList();
        const saved = AppStorage.get('packingList') || {};

        Utils.showModal(`
            <div style="padding: 20px; max-height: 85vh; overflow-y: auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <h2 style="font-size: 17px;">🧳 行李清单</h2>
                    <button class="icon-btn" onclick="Utils.closeModal()">✕</button>
                </div>
                <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 12px; padding: 8px; background: var(--bg-page); border-radius: 6px;">
                    💡 根据你的目的地天气智能推荐，点击勾选已打包的物品
                </div>
                ${recommendations.map(cat => `
                    <div style="margin-bottom: 16px;">
                        <div style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">${cat.icon} ${cat.title}</div>
                        ${cat.items.map(item => `
                            <label style="display: flex; align-items: center; padding: 8px; background: var(--bg-page); border-radius: 6px; margin-bottom: 4px; cursor: pointer;">
                                <input type="checkbox" ${saved[item.name] ? 'checked' : ''} style="margin-right: 8px;"
                                    onchange="Travel.togglePackingItem('${item.name}', this.checked)">
                                <span style="font-size: 13px; ${saved[item.name] ? 'text-decoration: line-through; color: var(--text-placeholder);' : ''}">${item.icon} ${item.name}</span>
                                ${item.reason ? `<span style="font-size: 11px; color: var(--text-placeholder); margin-left: 6px;">(${item.reason})</span>` : ''}
                            </label>
                        `).join('')}
                    </div>
                `).join('')}
                <button class="btn btn-default btn-block" style="margin-top: 8px;" onclick="Travel.resetPackingList()">重置清单</button>
            </div>
        `);
    },

    /**
     * 生成行李清单（根据天气）
     */
    generatePackingList() {
        const categories = [
            {
                title: '必备物品', icon: '🎒',
                items: [
                    { name: '身份证', icon: '🪪', reason: '' },
                    { name: '手机充电器', icon: '🔌', reason: '' },
                    { name: '充电宝', icon: '🔋', reason: '' },
                    { name: '现金/银行卡', icon: '💳', reason: '' },
                    { name: '口罩', icon: '😷', reason: '' }
                ]
            }
        ];

        // 分析天气
        let hasRain = false, hasCold = false, hasHot = false, hasSun = false;
        this._dailyPlans.forEach(plan => {
            if (!plan.weather) return;
            const desc = plan.weather.current.desc || '';
            const temp = plan.weather.current.temp || 20;
            if (desc.includes('雨') || desc.includes('雪')) hasRain = true;
            if (temp < 10) hasCold = true;
            if (temp > 28) hasHot = true;
            if (desc.includes('晴') || desc.includes('阳')) hasSun = true;
        });

        const clothing = { title: '衣物', icon: '👕', items: [
            { name: '内衣袜子', icon: '🩲', reason: '按天数带' },
            { name: '外套', icon: '🧥', reason: hasCold ? '防寒' : '早晚温差' }
        ]};
        if (hasCold) clothing.items.push({ name: '保暖内衣', icon: '🧶', reason: '低温' });
        if (hasHot) clothing.items.push({ name: '短袖短裤', icon: '👕', reason: '高温' });
        if (hasHot || hasSun) clothing.items.push({ name: '遮阳帽', icon: '👒', reason: '防晒' });
        categories.push(clothing);

        const toiletries = { title: '洗护用品', icon: '🧴', items: [
            { name: '牙刷毛巾', icon: '🪥', reason: '' },
            { name: '护肤品', icon: '🧴', reason: '' },
            { name: '防晒霜', icon: '🧴', reason: hasSun || hasHot ? '防晒' : '' }
        ]};
        if (hasRain) toiletries.items.push({ name: '雨伞/雨衣', icon: '☂️', reason: '有雨' });
        categories.push(toiletries);

        const others = { title: '其他', icon: '📋', items: [
            { name: '水杯', icon: '🥤', reason: '' },
            { name: '零食', icon: '🍪', reason: '' },
            { name: '塑料袋', icon: '🗑️', reason: '装脏衣服' }
        ]};
        categories.push(others);

        return categories;
    },

    /**
     * 勾选行李清单项
     * 小白理解：勾选状态保存到localStorage，重新打开也不会丢
     */
    togglePackingItem(name, checked) {
        const list = AppStorage.get('packingList') || {};
        list[name] = checked;
        AppStorage.set('packingList', list);
        Utils.vibrate(5);
        // 更新当前勾选项的样式
        const checkbox = event && event.target;
        if (checkbox) {
            const span = checkbox.nextElementSibling;
            if (span) {
                span.style.textDecoration = checked ? 'line-through' : '';
                span.style.color = checked ? 'var(--text-placeholder)' : '';
            }
        }
    },

    /**
     * 重置行李清单
     */
    resetPackingList() {
        AppStorage.remove('packingList');
        Utils.toast('清单已重置');
        Utils.closeModal();
        setTimeout(() => this.showPackingList(), 200);
    },

    /**
     * 渲染按日期分组的出行方案
     * 小白理解：所有日期卡片放在一个横向滑动轨道里，
     *           每张卡片占满屏幕宽度，左右滑动切换日期
     */
    renderDailyPlans() {
        if (this._dailyPlans.length === 0) {
            return `
                <div class="card">
                    <div style="font-size: 13px; color: var(--text-secondary);">
                        暂无出行方案，请添加目的地并生成
                    </div>
                </div>
            `;
        }

        const total = this._dailyPlans.length;

        // 计算费用汇总
        const costSummary = this.calculateCost();

        // 检查是否已保存
        const savedPlan = AppStorage.getTravelPlan();
        const isSaved = savedPlan && savedPlan.saveTime && 
            JSON.stringify(savedPlan.dailyPlans) === JSON.stringify(this._dailyPlans);

        let html = `
            <!-- 保存方案按钮行 -->
            <div style="display: flex; gap: 8px; margin-bottom: 12px;">
                <button class="btn btn-primary" style="flex: 1;" onclick="Travel.saveCurrentPlan()">
                    💾 ${isSaved ? '更新保存' : '保存方案'}
                </button>
                <button class="btn btn-default" style="flex: 1;" onclick="Travel.exportPlan()">
                    📤 分享行程
                </button>
            </div>

            <!-- 整体路线图（创新点：可视化多目的地路线） -->
            ${this.renderRouteMap()}

            <!-- 预算设置 -->
            <div class="card" style="padding: 10px 12px; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 13px; color: var(--text-secondary);">🎯 预算</span>
                <input type="number" id="budget-input" placeholder="设置预算（元）" value="${this._budget || ''}"
                    style="flex: 1; padding: 4px 8px; border: 1px solid var(--border-color); border-radius: 6px; background: var(--bg-card); color: var(--text-primary); font-size: 13px;"
                    oninput="Travel.setBudget(this.value)">
                <span style="font-size: 12px; color: var(--text-placeholder);">元</span>
            </div>

            <!-- 费用汇总卡片 -->
            <div class="card" id="cost-summary-card" style="padding: 12px; margin-bottom: 12px; background: var(--bg-page); border: 1px solid var(--divider-color);">
                <div style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">💰 费用估算</div>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                    <div style="flex: 1; min-width: 70px; text-align: center; padding: 8px; background: var(--bg-card); border-radius: 6px;">
                        <div style="font-size: 11px; color: var(--text-secondary);">🚄 交通</div>
                        <div style="font-size: 15px; font-weight: 600; color: var(--primary);">¥${costSummary.transport}</div>
                    </div>
                    <div style="flex: 1; min-width: 70px; text-align: center; padding: 8px; background: var(--bg-card); border-radius: 6px;">
                        <div style="font-size: 11px; color: var(--text-secondary);">🏨 住宿</div>
                        <div style="font-size: 15px; font-weight: 600; color: var(--success);">¥${costSummary.hotel}</div>
                    </div>
                    <div style="flex: 1; min-width: 70px; text-align: center; padding: 8px; background: var(--bg-card); border-radius: 6px;">
                        <div style="font-size: 11px; color: var(--text-secondary);">🎫 门票</div>
                        <div style="font-size: 15px; font-weight: 600; color: var(--warning);">¥${costSummary.ticket}</div>
                    </div>
                    <div style="flex: 1; min-width: 70px; text-align: center; padding: 8px; background: var(--bg-card); border-radius: 6px;">
                        <div style="font-size: 11px; color: var(--text-secondary);">🍽️ 餐饮</div>
                        <div style="font-size: 15px; font-weight: 600; color: var(--danger);">¥${costSummary.food}</div>
                    </div>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px; padding-top: 8px; border-top: 1px solid var(--divider-color);">
                    <div style="font-size: 13px; font-weight: 600;">总计（${total}天）</div>
                    <div style="font-size: 18px; font-weight: 700; color: ${this._budget > 0 && costSummary.total > this._budget ? 'var(--danger)' : 'var(--primary)'};">¥${costSummary.total}</div>
                </div>
                ${this._budget > 0 ? `
                    <div style="margin-top: 8px; padding: 6px 8px; background: ${costSummary.total > this._budget ? 'rgba(245,34,45,0.08)' : 'rgba(82,196,26,0.08)'}; border-radius: 6px; font-size: 12px; color: ${costSummary.total > this._budget ? 'var(--danger)' : 'var(--success)'};">
                        ${costSummary.total > this._budget
                            ? `⚠️ 超出预算 ¥${costSummary.total - this._budget}（预算 ¥${this._budget}）`
                            : `✓ 在预算内（剩余 ¥${this._budget - costSummary.total}）`}
                    </div>
                ` : ''}
                <div style="font-size: 11px; color: var(--text-placeholder); margin-top: 6px; line-height: 1.6;">
                    💡 交通取最便宜票价 · 住宿取最便宜酒店/晚 · 门票为景点票价之和 · 餐饮按每天3顿均价估算
                </div>
            </div>

            <!-- 行李清单入口（创新点：根据天气自动生成） -->
            <div class="card" style="padding: 10px 12px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; cursor: pointer;" onclick="Travel.showPackingList()">
                <div>
                    <span style="font-size: 14px; font-weight: 600;">🧳 行李清单</span>
                    <span style="font-size: 11px; color: var(--text-secondary); margin-left: 6px;">根据目的地天气智能推荐</span>
                </div>
                <span style="font-size: 14px; color: var(--primary);">›</span>
            </div>

            <!-- 日期导航条 -->
            <div style="margin-bottom: 12px;">
                <div style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">📅 行程日期导航</div>
                <div style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 8px;" class="horizontal-scroll">
                    ${this._dailyPlans.map((plan, idx) => `
                        <button class="btn btn-default travel-day-btn"
                            style="flex-shrink: 0; padding: 6px 12px; font-size: 12px;"
                            id="day-btn-${idx}"
                            onclick="Travel.goToDay(${idx})">
                            第${plan.day}天<br>${plan.date.slice(5)}
                        </button>
                    `).join('')}
                </div>
            </div>

            <!-- 日期指示器 + 左右箭头 -->
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                <button class="btn btn-default" style="padding: 6px 12px; font-size: 16px;" onclick="Travel.prevDay()">‹</button>
                <div id="day-indicator" style="font-size: 14px; font-weight: 600; color: var(--primary);">
                    第1天 / 共${total}天
                </div>
                <button class="btn btn-default" style="padding: 6px 12px; font-size: 16px;" onclick="Travel.nextDay()">›</button>
            </div>

            <!-- 横向滑动轨道：每天一张全宽卡片 -->
            <div class="day-slider" id="day-slider" onscroll="Travel.onDayScroll()">
        `;

        html += this._dailyPlans.map((plan, idx) => `
            <div class="day-slide" id="day-${idx}">
                <div class="card" style="padding: 16px; border-top: 4px solid var(--primary);">
                    <!-- 日期头部 + 编辑按钮 -->
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                        <div style="flex: 1;">
                            <div style="font-size: 16px; font-weight: 600; color: var(--primary);">
                                📅 第${plan.day}天 · ${plan.date} (${plan.dayOfWeek})
                            </div>
                            <div style="font-size: 13px; color: var(--text-secondary); margin-top: 2px;">
                                📍 ${plan.to}（第${plan.localDay}天/共${plan.totalStayDays}天）
                                ${plan.isArrivalDay ? ` · 从${plan.from}出发` : ''}
                            </div>
                        </div>
                        <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
                            ${plan.weather ? `
                                <div style="text-align: right;">
                                    <div style="font-size: 18px;">${plan.weather.current.icon}</div>
                                    <div style="font-size: 12px; color: var(--text-secondary);">${plan.weather.dayForecast ? plan.weather.dayForecast.temp + ' ' + plan.weather.dayForecast.desc + ' <span style="font-size:10px;color:var(--text-placeholder);">' + plan.weather.dayForecast.day + '</span>' : plan.weather.current.temp + '° ' + plan.weather.current.desc}</div>
                                </div>
                            ` : ''}
                            <button class="icon-btn travel-edit-day-btn" style="font-size: 13px; padding: 2px 8px; margin-top: 4px;"
                                onclick="Travel.editDayNote(${idx})" title="编辑当天备注">📝</button>
                        </div>
                    </div>

                    <!-- 天气建议 -->
                    ${plan.weather && plan.weather.advice ? `
                        <div style="font-size: 11px; color: var(--text-secondary); padding: 8px; background: var(--bg-page); border-radius: 6px; margin-bottom: 12px;">
                            💡 ${plan.weather.advice}
                        </div>
                    ` : ''}

                    <!-- 当天备注（用户编辑后显示） -->
                    ${plan.note ? `
                        <div style="font-size: 12px; color: var(--warning); padding: 8px; background: rgba(250,173,20,0.08); border-radius: 6px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: start;">
                            <span style="flex: 1; max-height: 36px; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">📝 ${Utils.escapeHtml(plan.note)}</span>
                            <button class="icon-btn" style="font-size: 11px; padding: 0 4px;" onclick="Travel.editDayNote(${idx})">✏️</button>
                        </div>
                    ` : ''}

                    <!-- 旅行日记（用户写后显示，点击查看完整） -->
                    ${plan.diary ? `
                        <div style="font-size: 12px; color: var(--info, #1890ff); padding: 8px; background: rgba(24,144,255,0.06); border-radius: 6px; margin-bottom: 12px; cursor: pointer;" onclick="Travel.editDiary(${idx})">
                            <div style="display: flex; justify-content: space-between; align-items: start;">
                                <span style="flex: 1; max-height: 36px; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">📔 ${Utils.escapeHtml(plan.diary)}</span>
                                <span style="font-size: 11px; color: var(--primary); flex-shrink: 0; margin-left: 6px;">查看全文 ›</span>
                            </div>
                        </div>
                    ` : ''}

                    <!-- 交通方案（只在到达当天显示） -->
                    ${plan.isArrivalDay ? `
                        <div style="margin-bottom: 12px;">
                            <div style="font-size: 13px; font-weight: 600; margin-bottom: 8px; color: var(--primary);">🚄 交通方案（${plan.from} → ${plan.to}）</div>
                            ${plan.tickets.length > 0 ? plan.tickets.slice(0, 3).map((t, ti) => `
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; background: var(--bg-page); border-radius: 6px; margin-bottom: 6px;">
                                    <div style="flex: 1;">
                                        <div style="font-size: 13px; font-weight: 500;">${t.code} <span class="tag tag-info">${t.type}</span></div>
                                        <div style="font-size: 11px; color: var(--text-secondary);">
                                            ${t.depTime} → ${t.arrTime} · ${t.duration}
                                        </div>
                                    </div>
                                    <div style="text-align: right;">
                                        <div style="font-size: 14px; color: var(--primary); font-weight: 600;">¥${t.price}</div>
                                        <span class="tag ${Utils.getTicketStatusClass(t.remain)}" style="font-size: 10px;">${t.remain}</span>
                                    </div>
                                </div>
                            `).join('') : `
                                <div style="font-size: 12px; color: var(--text-placeholder); padding: 8px; background: var(--bg-page); border-radius: 6px;">
                                    暂无该路线交通数据
                                </div>
                            `}
                        </div>
                    ` : `
                        <div style="font-size: 12px; color: var(--text-secondary); padding: 8px; background: var(--bg-page); border-radius: 6px; margin-bottom: 12px;">
                            🏙️ ${plan.to}当地游玩日（第${plan.localDay}天）
                        </div>
                    `}

                    <!-- 住宿推荐（可删除单项） -->
                    <div style="margin-bottom: 12px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <div style="font-size: 13px; font-weight: 600; color: var(--success);">🏨 住宿推荐</div>
                            <button class="icon-btn travel-add-btn" style="font-size: 11px; padding: 2px 8px;" onclick="Travel.addHotelToDay(${idx})">+ 添加</button>
                        </div>
                        ${plan.hotels.length > 0 ? plan.hotels.map((h, hi) => `
                            <div style="display: flex; justify-content: space-between; padding: 8px; background: var(--bg-page); border-radius: 6px; margin-bottom: 6px; align-items: center;">
                                <div style="flex: 1;">
                                    <div style="font-size: 13px;">${h.name}</div>
                                    <div style="font-size: 11px; color: var(--text-secondary);">
                                        ${h.level} · ⭐${h.rating} · ${h.area}
                                    </div>
                                </div>
                                <div style="display: flex; align-items: center; gap: 6px;">
                                    <div style="font-size: 14px; color: var(--primary); font-weight: 500;">¥${h.price}/晚</div>
                                    <button class="icon-btn travel-del-btn" style="font-size: 11px; padding: 0 4px;" onclick="Travel.removeHotelFromDay(${idx}, ${hi})" title="移除">✕</button>
                                </div>
                            </div>
                        `).join('') : `
                            <div style="font-size: 12px; color: var(--text-placeholder); padding: 8px; background: var(--bg-page); border-radius: 6px;">
                                暂无住宿，点"+ 添加"自定义
                            </div>
                        `}
                    </div>

                    <!-- 景点推荐（可删除单项） -->
                    <div style="margin-bottom: 12px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <div style="font-size: 13px; font-weight: 600; color: var(--warning);">📍 景点安排</div>
                            <button class="icon-btn travel-add-btn" style="font-size: 11px; padding: 2px 8px;" onclick="Travel.addScenicToDay(${idx})">+ 添加</button>
                        </div>
                        ${plan.scenics.length > 0 ? plan.scenics.map((s, si) => `
                            <div style="padding: 8px; background: var(--bg-page); border-radius: 6px; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: start;">
                                <div style="flex: 1;">
                                    <div style="font-size: 13px; font-weight: 500;">${s.icon} ${s.name}</div>
                                    <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">
                                        ⭐${s.rating} · 💰${Utils.formatPrice(s.price)} · 🕐${s.openTime || '全天'}
                                    </div>
                                </div>
                                <button class="icon-btn travel-del-btn" style="font-size: 11px; padding: 0 4px;" onclick="Travel.removeScenicFromDay(${idx}, ${si})" title="移除">✕</button>
                            </div>
                        `).join('') : `
                            <div style="font-size: 12px; color: var(--text-placeholder); padding: 8px; background: var(--bg-page); border-radius: 6px;">
                                暂无景点，点"+ 添加"自定义
                            </div>
                        `}
                    </div>

                    <!-- 美食推荐（可删除单项） -->
                    <div style="margin-bottom: 12px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <div style="font-size: 13px; font-weight: 600; color: var(--danger);">🍽️ 美食安排</div>
                            <button class="icon-btn travel-add-btn" style="font-size: 11px; padding: 2px 8px;" onclick="Travel.addFoodToDay(${idx})">+ 添加</button>
                        </div>
                        ${plan.foods.length > 0 ? plan.foods.map((f, fi) => `
                            <div style="padding: 8px; background: var(--bg-page); border-radius: 6px; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: start;">
                                <div style="flex: 1;">
                                    <div style="font-size: 13px; font-weight: 500;">${f.icon} ${f.name}</div>
                                    <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">
                                        ${f.cuisine} · ⭐${f.rating} · 💰${Utils.formatPrice(f.price)}
                                    </div>
                                </div>
                                <button class="icon-btn travel-del-btn" style="font-size: 11px; padding: 0 4px;" onclick="Travel.removeFoodFromDay(${idx}, ${fi})" title="移除">✕</button>
                            </div>
                        `).join('') : `
                            <div style="font-size: 12px; color: var(--text-placeholder); padding: 8px; background: var(--bg-page); border-radius: 6px;">
                                暂无美食，点"+ 添加"自定义
                            </div>
                        `}
                    </div>

                    <!-- 自定义活动（用户添加的额外安排） -->
                    ${plan.activities && plan.activities.length > 0 ? `
                        <div style="margin-bottom: 12px;">
                            <div style="font-size: 13px; font-weight: 600; margin-bottom: 8px; color: var(--info, #1890ff);">🎯 自定义活动</div>
                            ${plan.activities.map((a, ai) => `
                                <div style="padding: 8px; background: rgba(24,144,255,0.06); border-radius: 6px; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: start;">
                                    <div style="flex: 1;">
                                        <div style="font-size: 13px; font-weight: 500;">${a.icon || '🎯'} ${Utils.escapeHtml(a.name)}</div>
                                        ${a.time ? `<div style="font-size: 11px; color: var(--primary); margin-top: 2px;">🕐 ${Utils.escapeHtml(a.time)}</div>` : ''}
                                        ${a.desc ? `<div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">${Utils.escapeHtml(a.desc)}</div>` : ''}
                                    </div>
                                    <button class="icon-btn travel-del-btn" style="font-size: 11px; padding: 0 4px;" onclick="Travel.removeActivity(${idx}, ${ai})" title="移除">✕</button>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}

                    <!-- 底部操作按钮：添加活动 / 编辑备注 / 写日记 -->
                    <div style="display: flex; gap: 6px; padding-top: 8px; border-top: 1px dashed var(--divider-color);">
                        <button class="btn btn-default" style="flex: 1; font-size: 12px; padding: 6px;" onclick="Travel.addActivity(${idx})">
                            ➕ 活动
                        </button>
                        <button class="btn btn-default" style="flex: 1; font-size: 12px; padding: 6px;" onclick="Travel.editDayNote(${idx})">
                            📝 备注
                        </button>
                        <button class="btn btn-default" style="flex: 1; font-size: 12px; padding: 6px;" onclick="Travel.editDiary(${idx})">
                            📔 ${plan.diary ? '日记' : '写日记'}
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        html += `
            </div>
            <!-- 滑动提示 -->
            <div style="text-align: center; font-size: 11px; color: var(--text-placeholder); margin-top: 8px;">
                ← 左右滑动切换日期 →
            </div>
        `;

        return html;
    },

    /**
     * 横向滑动时更新日期指示器
     * 小白理解：用户滑动时，根据滚动位置算出当前是第几天，更新导航高亮
     * 用 requestAnimationFrame 节流，避免高频滚动事件卡顿
     */
    onDayScroll() {
        // 如果已有待执行的帧，不再重复添加
        if (this._scrollRaf) return;

        this._scrollRaf = requestAnimationFrame(() => {
            this._scrollRaf = null;
            const slider = document.getElementById('day-slider');
            if (!slider) return;

            const slideWidth = slider.offsetWidth;
            const currentIndex = Math.round(slider.scrollLeft / slideWidth);

            // 更新指示器文字
            const indicator = document.getElementById('day-indicator');
            if (indicator && this._dailyPlans[currentIndex]) {
                indicator.textContent = `第${currentIndex + 1}天 / 共${this._dailyPlans.length}天`;
            }

            // 更新导航按钮高亮
            this._dailyPlans.forEach((_, idx) => {
                const btn = document.getElementById(`day-btn-${idx}`);
                if (btn) {
                    if (idx === currentIndex) {
                        btn.classList.add('btn-primary');
                        btn.classList.remove('btn-default');
                    } else {
                        btn.classList.add('btn-default');
                        btn.classList.remove('btn-primary');
                    }
                }
            });
        });
    },

    /**
     * 跳转到指定日期（点击导航按钮时调用）
     */
    goToDay(index) {
        const slider = document.getElementById('day-slider');
        if (!slider) return;
        const slideWidth = slider.offsetWidth;
        slider.scrollTo({ left: slideWidth * index, behavior: 'smooth' });
    },

    /**
     * 上一天
     */
    prevDay() {
        const slider = document.getElementById('day-slider');
        if (!slider) return;
        const slideWidth = slider.offsetWidth;
        const currentIndex = Math.round(slider.scrollLeft / slideWidth);
        if (currentIndex > 0) {
            slider.scrollTo({ left: slideWidth * (currentIndex - 1), behavior: 'smooth' });
        }
    },

    /**
     * 下一天
     */
    nextDay() {
        const slider = document.getElementById('day-slider');
        if (!slider) return;
        const slideWidth = slider.offsetWidth;
        const currentIndex = Math.round(slider.scrollLeft / slideWidth);
        if (currentIndex < this._dailyPlans.length - 1) {
            slider.scrollTo({ left: slideWidth * (currentIndex + 1), behavior: 'smooth' });
        }
    },

    /* ======================================== */
    /* 出行方案自由编辑方法                      */
    /* 小白理解：生成方案后，用户可以像编辑文档  */
    /*           一样修改每天的安排：删除不想要  */
    /*           的景点/美食/住宿，添加自定义活动 */
    /* ======================================== */

    /**
     * 局部刷新某一天的卡片（不重建整个滑动轨道，保持滑动位置）
     * 小白理解：改了某天的内容后只更新那张卡片，不影响其他天
     *           同时实时更新费用汇总卡片
     */
    refreshDayCard(dayIdx) {
        const slide = document.getElementById('day-' + dayIdx);
        if (!slide) {
            this.renderResultAreaOnly();
            return;
        }
        const slider = document.getElementById('day-slider');
        const scrollLeft = slider ? slider.scrollLeft : 0;
        const plan = this._dailyPlans[dayIdx];
        slide.innerHTML = this._renderSingleDay(plan, dayIdx);
        if (slider) slider.scrollLeft = scrollLeft;
        // 实时更新费用汇总（创新点：删除/添加后费用自动重算）
        this.updateCostSummary();
    },

    /**
     * 实时更新费用汇总卡片
     * 小白理解：用户删了某个景点，费用马上重新计算并更新显示
     */
    updateCostSummary() {
        const costCard = document.getElementById('cost-summary-card');
        if (!costCard) return;
        const costSummary = this.calculateCost();
        const total = this._dailyPlans.length;
        const budget = this._budget || 0;
        const overBudget = budget > 0 && costSummary.total > budget;

        costCard.innerHTML = `
            <div style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">💰 费用估算</div>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <div style="flex: 1; min-width: 70px; text-align: center; padding: 8px; background: var(--bg-card); border-radius: 6px;">
                    <div style="font-size: 11px; color: var(--text-secondary);">🚄 交通</div>
                    <div style="font-size: 15px; font-weight: 600; color: var(--primary);">¥${costSummary.transport}</div>
                </div>
                <div style="flex: 1; min-width: 70px; text-align: center; padding: 8px; background: var(--bg-card); border-radius: 6px;">
                    <div style="font-size: 11px; color: var(--text-secondary);">🏨 住宿</div>
                    <div style="font-size: 15px; font-weight: 600; color: var(--success);">¥${costSummary.hotel}</div>
                </div>
                <div style="flex: 1; min-width: 70px; text-align: center; padding: 8px; background: var(--bg-card); border-radius: 6px;">
                    <div style="font-size: 11px; color: var(--text-secondary);">🎫 门票</div>
                    <div style="font-size: 15px; font-weight: 600; color: var(--warning);">¥${costSummary.ticket}</div>
                </div>
                <div style="flex: 1; min-width: 70px; text-align: center; padding: 8px; background: var(--bg-card); border-radius: 6px;">
                    <div style="font-size: 11px; color: var(--text-secondary);">🍽️ 餐饮</div>
                    <div style="font-size: 15px; font-weight: 600; color: var(--danger);">¥${costSummary.food}</div>
                </div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px; padding-top: 8px; border-top: 1px solid var(--divider-color);">
                <div style="font-size: 13px; font-weight: 600;">总计（${total}天）</div>
                <div style="font-size: 18px; font-weight: 700; color: ${overBudget ? 'var(--danger)' : 'var(--primary)'};">¥${costSummary.total}</div>
            </div>
            ${budget > 0 ? `
                <div style="margin-top: 8px; padding: 6px 8px; background: ${overBudget ? 'rgba(245,34,45,0.08)' : 'rgba(82,196,26,0.08)'}; border-radius: 6px; font-size: 12px; color: ${overBudget ? 'var(--danger)' : 'var(--success)'};">
                    ${overBudget
                        ? `⚠️ 超出预算 ¥${costSummary.total - budget}（预算 ¥${budget}）`
                        : `✓ 在预算内（预算 ¥${budget}，剩余 ¥${budget - costSummary.total}）`}
                </div>
            ` : ''}
            <div style="font-size: 11px; color: var(--text-placeholder); margin-top: 6px; line-height: 1.6;">
                💡 交通取最便宜票价 · 住宿取最便宜酒店/晚 · 门票为景点票价之和 · 餐饮按每天3顿均价估算
            </div>
        `;
    },

    /**
     * 渲染单天卡片HTML（供 refreshDayCard 使用）
     * 小白理解：和 renderDailyPlans 里的单天模板一样，单独抽出来方便复用
     */
    _renderSingleDay(plan, idx) {
        // 复用主模板逻辑（直接调用内部生成函数）
        // 为了简洁，这里通过临时生成整个列表然后取对应索引
        const total = this._dailyPlans.length;
        let singleHTML = '';
        // 模拟主函数中 map 的单次迭代
        const oldMap = Array.prototype.map;
        const plans = [plan];
        const indices = [idx];
        // 直接拼接，避免重复代码
        return `
            <div class="card" style="padding: 16px; border-top: 4px solid var(--primary);">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                    <div style="flex: 1;">
                        <div style="font-size: 16px; font-weight: 600; color: var(--primary);">
                            📅 第${plan.day}天 · ${plan.date} (${plan.dayOfWeek})
                        </div>
                        <div style="font-size: 13px; color: var(--text-secondary); margin-top: 2px;">
                            📍 ${plan.to}（第${plan.localDay}天/共${plan.totalStayDays}天）
                            ${plan.isArrivalDay ? ` · 从${plan.from}出发` : ''}
                        </div>
                    </div>
                    <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
                        ${plan.weather ? `
                            <div style="text-align: right;">
                                <div style="font-size: 18px;">${plan.weather.current.icon}</div>
                                <div style="font-size: 12px; color: var(--text-secondary);">${plan.weather.dayForecast ? plan.weather.dayForecast.temp + ' ' + plan.weather.dayForecast.desc + ' <span style="font-size:10px;color:var(--text-placeholder);">' + plan.weather.dayForecast.day + '</span>' : plan.weather.current.temp + '° ' + plan.weather.current.desc}</div>
                            </div>
                        ` : ''}
                        <button class="icon-btn travel-edit-day-btn" style="font-size: 13px; padding: 2px 8px; margin-top: 4px;"
                            onclick="Travel.editDayNote(${idx})" title="编辑当天备注">📝</button>
                    </div>
                </div>
                ${plan.weather && plan.weather.advice ? `
                    <div style="font-size: 11px; color: var(--text-secondary); padding: 8px; background: var(--bg-page); border-radius: 6px; margin-bottom: 12px;">
                        💡 ${plan.weather.advice}
                    </div>
                ` : ''}
                ${plan.note ? `
                    <div style="font-size: 12px; color: var(--warning); padding: 8px; background: rgba(250,173,20,0.08); border-radius: 6px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: start;">
                        <span style="flex: 1;">📝 ${Utils.escapeHtml(plan.note)}</span>
                        <button class="icon-btn" style="font-size: 11px; padding: 0 4px;" onclick="Travel.editDayNote(${idx})">✏️</button>
                    </div>
                ` : ''}
                ${plan.isArrivalDay ? `
                    <div style="margin-bottom: 12px;">
                        <div style="font-size: 13px; font-weight: 600; margin-bottom: 8px; color: var(--primary);">🚄 交通方案（${plan.from} → ${plan.to}）</div>
                        ${plan.tickets.length > 0 ? plan.tickets.slice(0, 3).map((t) => `
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; background: var(--bg-page); border-radius: 6px; margin-bottom: 6px;">
                                <div style="flex: 1;">
                                    <div style="font-size: 13px; font-weight: 500;">${t.code} <span class="tag tag-info">${t.type}</span></div>
                                    <div style="font-size: 11px; color: var(--text-secondary);">${t.depTime} → ${t.arrTime} · ${t.duration}</div>
                                </div>
                                <div style="text-align: right;">
                                    <div style="font-size: 14px; color: var(--primary); font-weight: 600;">¥${t.price}</div>
                                    <span class="tag ${Utils.getTicketStatusClass(t.remain)}" style="font-size: 10px;">${t.remain}</span>
                                </div>
                            </div>
                        `).join('') : `<div style="font-size: 12px; color: var(--text-placeholder); padding: 8px; background: var(--bg-page); border-radius: 6px;">暂无该路线交通数据</div>`}
                    </div>
                ` : `
                    <div style="font-size: 12px; color: var(--text-secondary); padding: 8px; background: var(--bg-page); border-radius: 6px; margin-bottom: 12px;">🏙️ ${plan.to}当地游玩日（第${plan.localDay}天）</div>
                `}
                <div style="margin-bottom: 12px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <div style="font-size: 13px; font-weight: 600; color: var(--success);">🏨 住宿推荐</div>
                        <button class="icon-btn travel-add-btn" style="font-size: 11px; padding: 2px 8px;" onclick="Travel.addHotelToDay(${idx})">+ 添加</button>
                    </div>
                    ${plan.hotels.length > 0 ? plan.hotels.map((h, hi) => `
                        <div style="display: flex; justify-content: space-between; padding: 8px; background: var(--bg-page); border-radius: 6px; margin-bottom: 6px; align-items: center;">
                            <div style="flex: 1;">
                                <div style="font-size: 13px;">${h.name}</div>
                                <div style="font-size: 11px; color: var(--text-secondary);">${h.level} · ⭐${h.rating} · ${h.area}</div>
                            </div>
                            <div style="display: flex; align-items: center; gap: 6px;">
                                <div style="font-size: 14px; color: var(--primary); font-weight: 500;">¥${h.price}/晚</div>
                                <button class="icon-btn travel-del-btn" style="font-size: 11px; padding: 0 4px;" onclick="Travel.removeHotelFromDay(${idx}, ${hi})" title="移除">✕</button>
                            </div>
                        </div>
                    `).join('') : `<div style="font-size: 12px; color: var(--text-placeholder); padding: 8px; background: var(--bg-page); border-radius: 6px;">暂无住宿，点"+ 添加"自定义</div>`}
                </div>
                <div style="margin-bottom: 12px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <div style="font-size: 13px; font-weight: 600; color: var(--warning);">📍 景点安排</div>
                        <button class="icon-btn travel-add-btn" style="font-size: 11px; padding: 2px 8px;" onclick="Travel.addScenicToDay(${idx})">+ 添加</button>
                    </div>
                    ${plan.scenics.length > 0 ? plan.scenics.map((s, si) => `
                        <div style="padding: 8px; background: var(--bg-page); border-radius: 6px; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: start;">
                            <div style="flex: 1;">
                                <div style="font-size: 13px; font-weight: 500;">${s.icon} ${s.name}</div>
                                <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">⭐${s.rating} · 💰${Utils.formatPrice(s.price)} · 🕐${s.openTime || '全天'}</div>
                            </div>
                            <button class="icon-btn travel-del-btn" style="font-size: 11px; padding: 0 4px;" onclick="Travel.removeScenicFromDay(${idx}, ${si})" title="移除">✕</button>
                        </div>
                    `).join('') : `<div style="font-size: 12px; color: var(--text-placeholder); padding: 8px; background: var(--bg-page); border-radius: 6px;">暂无景点，点"+ 添加"自定义</div>`}
                </div>
                <div style="margin-bottom: 12px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <div style="font-size: 13px; font-weight: 600; color: var(--danger);">🍽️ 美食安排</div>
                        <button class="icon-btn travel-add-btn" style="font-size: 11px; padding: 2px 8px;" onclick="Travel.addFoodToDay(${idx})">+ 添加</button>
                    </div>
                    ${plan.foods.length > 0 ? plan.foods.map((f, fi) => `
                        <div style="padding: 8px; background: var(--bg-page); border-radius: 6px; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: start;">
                            <div style="flex: 1;">
                                <div style="font-size: 13px; font-weight: 500;">${f.icon} ${f.name}</div>
                                <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">${f.cuisine} · ⭐${f.rating} · 💰${Utils.formatPrice(f.price)}</div>
                            </div>
                            <button class="icon-btn travel-del-btn" style="font-size: 11px; padding: 0 4px;" onclick="Travel.removeFoodFromDay(${idx}, ${fi})" title="移除">✕</button>
                        </div>
                    `).join('') : `<div style="font-size: 12px; color: var(--text-placeholder); padding: 8px; background: var(--bg-page); border-radius: 6px;">暂无美食，点"+ 添加"自定义</div>`}
                </div>
                ${plan.activities && plan.activities.length > 0 ? `
                    <div style="margin-bottom: 12px;">
                        <div style="font-size: 13px; font-weight: 600; margin-bottom: 8px; color: var(--info, #1890ff);">🎯 自定义活动</div>
                        ${plan.activities.map((a, ai) => `
                            <div style="padding: 8px; background: rgba(24,144,255,0.06); border-radius: 6px; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: start;">
                                <div style="flex: 1; cursor: pointer;" onclick="Travel.editActivity(${idx}, ${ai})">
                                    <div style="font-size: 13px; font-weight: 500;">${a.icon || '🎯'} ${Utils.escapeHtml(a.name)}</div>
                                    ${a.time ? `<div style="font-size: 11px; color: var(--primary); margin-top: 2px;">🕐 ${Utils.escapeHtml(a.time)}</div>` : ''}
                                    ${a.desc ? `<div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">${Utils.escapeHtml(a.desc)}</div>` : ''}
                                </div>
                                <button class="icon-btn travel-del-btn" style="font-size: 11px; padding: 0 4px;" onclick="Travel.removeActivity(${idx}, ${ai})" title="移除">✕</button>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}

                <!-- 旅行日记（编辑后也显示，修复：refreshDayCard后日记不消失） -->
                ${plan.diary ? `
                    <div style="font-size: 12px; color: var(--info, #1890ff); padding: 8px; background: rgba(24,144,255,0.06); border-radius: 6px; margin-bottom: 12px; cursor: pointer;" onclick="Travel.editDiary(${idx})">
                        <div style="display: flex; justify-content: space-between; align-items: start;">
                            <span style="flex: 1; max-height: 36px; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">📔 ${Utils.escapeHtml(plan.diary)}</span>
                            <span style="font-size: 11px; color: var(--primary); flex-shrink: 0; margin-left: 6px;">查看全文 ›</span>
                        </div>
                    </div>
                ` : ''}

                <!-- 底部操作按钮：修复添加日记按钮 -->
                <div style="display: flex; gap: 6px; padding-top: 8px; border-top: 1px dashed var(--divider-color);">
                    <button class="btn btn-default" style="flex: 1; font-size: 12px; padding: 6px;" onclick="Travel.addActivity(${idx})">➕ 活动</button>
                    <button class="btn btn-default" style="flex: 1; font-size: 12px; padding: 6px;" onclick="Travel.editDayNote(${idx})">📝 备注</button>
                    <button class="btn btn-default" style="flex: 1; font-size: 12px; padding: 6px;" onclick="Travel.editDiary(${idx})">📔 ${plan.diary ? '日记' : '写日记'}</button>
                </div>
            </div>
        `;
    },

    /**
     * 只刷新结果区（保留输入框，保持滑动位置）
     */
    renderResultAreaOnly() {
        const resultArea = document.getElementById('travel-result-area');
        if (resultArea) {
            resultArea.innerHTML = this.renderResultArea();
        }
    },

    /**
     * 删除某天的某个景点
     * 小白理解：觉得这个景点不想去，点✕删掉
     */
    removeScenicFromDay(dayIdx, scenicIdx) {
        Utils.vibrate(8);
        this._dailyPlans[dayIdx].scenics.splice(scenicIdx, 1);
        this.refreshDayCard(dayIdx);
        Utils.toast('已移除该景点');
    },

    /**
     * 删除某天的某个美食
     */
    removeFoodFromDay(dayIdx, foodIdx) {
        Utils.vibrate(8);
        this._dailyPlans[dayIdx].foods.splice(foodIdx, 1);
        this.refreshDayCard(dayIdx);
        Utils.toast('已移除该美食');
    },

    /**
     * 删除某天的某个住宿
     */
    removeHotelFromDay(dayIdx, hotelIdx) {
        Utils.vibrate(8);
        this._dailyPlans[dayIdx].hotels.splice(hotelIdx, 1);
        this.refreshDayCard(dayIdx);
        Utils.toast('已移除该住宿');
    },

    /**
     * 删除某天的某个自定义活动
     */
    removeActivity(dayIdx, actIdx) {
        Utils.vibrate(8);
        this._dailyPlans[dayIdx].activities.splice(actIdx, 1);
        this.refreshDayCard(dayIdx);
        Utils.toast('已移除该活动');
    },

    /**
     * 编辑自定义活动
     * 小白理解：点活动卡片可以修改内容，不用删除重加
     */
    editActivity(dayIdx, actIdx) {
        const activity = this._dailyPlans[dayIdx].activities[actIdx];
        if (!activity) return;
        Utils.vibrate(8);
        Utils.showModal(`
            <div style="padding: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <h2 style="font-size: 17px;">✏️ 编辑活动</h2>
                    <button class="icon-btn" onclick="Utils.closeModal()">✕</button>
                </div>
                <div style="margin-bottom: 12px;">
                    <label style="font-size: 13px; color: var(--text-secondary); display: block; margin-bottom: 4px;">活动名称 *</label>
                    <input type="text" id="edit-act-name" value="${Utils.escapeHtml(activity.name)}"
                        style="width: 100%; padding: 10px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-card); color: var(--text-primary); font-size: 14px;">
                </div>
                <div style="margin-bottom: 12px;">
                    <label style="font-size: 13px; color: var(--text-secondary); display: block; margin-bottom: 4px;">时间（可选）</label>
                    <input type="text" id="edit-act-time" value="${Utils.escapeHtml(activity.time || '')}"
                        style="width: 100%; padding: 10px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-card); color: var(--text-primary); font-size: 14px;">
                </div>
                <div style="margin-bottom: 16px;">
                    <label style="font-size: 13px; color: var(--text-secondary); display: block; margin-bottom: 4px;">描述（可选）</label>
                    <textarea id="edit-act-desc" rows="2"
                        style="width: 100%; padding: 10px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-card); color: var(--text-primary); font-size: 14px; resize: none;">${Utils.escapeHtml(activity.desc || '')}</textarea>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button class="btn btn-default" style="flex: 1;" onclick="Utils.closeModal()">取消</button>
                    <button class="btn btn-primary" style="flex: 1;" onclick="Travel.saveEditActivity(${dayIdx}, ${actIdx})">保存</button>
                </div>
            </div>
        `);
    },

    /**
     * 保存编辑活动
     */
    saveEditActivity(dayIdx, actIdx) {
        const name = document.getElementById('edit-act-name').value.trim();
        const time = document.getElementById('edit-act-time').value.trim();
        const desc = document.getElementById('edit-act-desc').value.trim();
        if (!name) {
            Utils.toast('请输入活动名称');
            return;
        }
        this._dailyPlans[dayIdx].activities[actIdx] = {
            name: name, time: time, desc: desc,
            icon: this._dailyPlans[dayIdx].activities[actIdx].icon
        };
        Utils.vibrate([10]);
        Utils.toast('✓ 已保存');
        Utils.closeModal();
        this.refreshDayCard(dayIdx);
    },

    /**
     * 添加自定义活动到某天
     * 小白理解：用户可以添加任何自己想做的事，比如"下午去咖啡馆"、"晚上看夜景"
     */
    addActivity(dayIdx) {
        Utils.vibrate(8);
        Utils.showModal(`
            <div style="padding: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <h2 style="font-size: 17px;">➕ 添加自定义活动</h2>
                    <button class="icon-btn" onclick="Utils.closeModal()">✕</button>
                </div>
                <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 12px; padding: 8px; background: var(--bg-page); border-radius: 6px;">
                    💡 添加任何你想做的事：购物、拍照、休息、看夜景等
                </div>
                <div style="margin-bottom: 12px;">
                    <label style="font-size: 13px; color: var(--text-secondary); display: block; margin-bottom: 4px;">活动名称 *</label>
                    <input type="text" id="act-name" placeholder="比如：去春熙路逛街"
                        style="width: 100%; padding: 10px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-card); color: var(--text-primary); font-size: 14px;">
                </div>
                <div style="margin-bottom: 12px;">
                    <label style="font-size: 13px; color: var(--text-secondary); display: block; margin-bottom: 4px;">时间（可选）</label>
                    <input type="text" id="act-time" placeholder="比如：19:00-21:00"
                        style="width: 100%; padding: 10px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-card); color: var(--text-primary); font-size: 14px;">
                </div>
                <div style="margin-bottom: 12px;">
                    <label style="font-size: 13px; color: var(--text-secondary); display: block; margin-bottom: 4px;">图标</label>
                    <div style="display: flex; gap: 6px; flex-wrap: wrap;" id="act-icon-list">
                        ${['🎯', '🛍️', '📸', '☕', '🌙', '🎪', '🎭', '💆', '🏊', '🚶'].map((ic, i) => `
                            <button type="button" class="icon-btn act-icon-btn ${i === 0 ? 'selected' : ''}"
                                style="width: 36px; height: 36px; font-size: 18px; border: 1.5px solid ${i === 0 ? 'var(--primary)' : 'var(--border-color)'}; border-radius: var(--radius-sm);"
                                onclick="Travel.selectActIcon('${ic}')">${ic}</button>
                        `).join('')}
                    </div>
                </div>
                <div style="margin-bottom: 16px;">
                    <label style="font-size: 13px; color: var(--text-secondary); display: block; margin-bottom: 4px;">描述（可选）</label>
                    <textarea id="act-desc" rows="2" placeholder="备注..."
                        style="width: 100%; padding: 10px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-card); color: var(--text-primary); font-size: 14px; resize: none;"></textarea>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button class="btn btn-default" style="flex: 1;" onclick="Utils.closeModal()">取消</button>
                    <button class="btn btn-primary" style="flex: 1;" onclick="Travel.saveActivity(${dayIdx})">添加</button>
                </div>
            </div>
        `);
        this._actIcon = '🎯';
    },

    /**
     * 选择活动图标
     */
    _actIcon: '🎯',
    selectActIcon(icon) {
        this._actIcon = icon;
        Utils.vibrate(5);
        document.querySelectorAll('.act-icon-btn').forEach(btn => {
            const ic = btn.textContent;
            btn.classList.toggle('selected', ic === icon);
            btn.style.borderColor = ic === icon ? 'var(--primary)' : 'var(--border-color)';
        });
    },

    /**
     * 保存添加的活动
     */
    saveActivity(dayIdx) {
        const name = document.getElementById('act-name').value.trim();
        const time = document.getElementById('act-time').value.trim();
        const desc = document.getElementById('act-desc').value.trim();
        if (!name) {
            Utils.toast('请输入活动名称');
            return;
        }
        if (!this._dailyPlans[dayIdx].activities) {
            this._dailyPlans[dayIdx].activities = [];
        }
        this._dailyPlans[dayIdx].activities.push({
            name: name,
            time: time,
            desc: desc,
            icon: this._actIcon
        });
        Utils.vibrate([10]);
        Utils.toast('✓ 已添加活动');
        Utils.closeModal();
        this.refreshDayCard(dayIdx);
    },

    /**
     * 编辑当天备注
     * 小白理解：给某天加个备注，比如"今天要早起"、"记得带雨伞"
     */
    editDayNote(dayIdx) {
        Utils.vibrate(8);
        const plan = this._dailyPlans[dayIdx];
        const oldNote = plan.note || '';
        Utils.showModal(`
            <div style="padding: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <h2 style="font-size: 17px;">📝 第${plan.day}天备注</h2>
                    <button class="icon-btn" onclick="Utils.closeModal()">✕</button>
                </div>
                <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 8px;">
                    ${plan.date} · ${plan.to}
                </div>
                <textarea id="day-note-input" rows="4" placeholder="写下当天的备忘：比如要带什么、注意什么、特别安排..."
                    style="width: 100%; padding: 12px; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-card); color: var(--text-primary); font-size: 14px; resize: none;">${Utils.escapeHtml(oldNote)}</textarea>
                <div style="display: flex; gap: 8px; margin-top: 12px;">
                    <button class="btn btn-default" style="flex: 1;" onclick="Utils.closeModal()">取消</button>
                    ${oldNote ? `<button class="btn btn-default" style="flex: 1; color: var(--danger);" onclick="Travel.clearDayNote(${dayIdx})">清除</button>` : ''}
                    <button class="btn btn-primary" style="flex: 1;" onclick="Travel.saveDayNote(${dayIdx})">保存</button>
                </div>
            </div>
        `);
    },

    /**
     * 保存当天备注
     */
    saveDayNote(dayIdx) {
        const note = document.getElementById('day-note-input').value.trim();
        this._dailyPlans[dayIdx].note = note;
        Utils.vibrate([10]);
        Utils.toast('✓ 备注已保存');
        Utils.closeModal();
        this.refreshDayCard(dayIdx);
    },

    /**
     * 清除当天备注
     */
    clearDayNote(dayIdx) {
        this._dailyPlans[dayIdx].note = '';
        Utils.vibrate(8);
        Utils.toast('备注已清除');
        Utils.closeModal();
        this.refreshDayCard(dayIdx);
    },

    /**
     * 编辑旅行日记
     * 小白理解：每天行程结束后可以写下当天的感受、见闻、趣事
     *           结束旅程后这些日记会保留，成为美好的回忆
     */
    editDiary(dayIdx) {
        Utils.vibrate(8);
        const plan = this._dailyPlans[dayIdx];
        const oldDiary = plan.diary || '';
        Utils.showModal(`
            <div style="padding: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <h2 style="font-size: 17px;">📔 旅行日记</h2>
                    <button class="icon-btn" onclick="Utils.closeModal()">✕</button>
                </div>
                <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 8px;">
                    📅 ${plan.date} · ${plan.to} · 第${plan.day}天
                </div>
                <div style="font-size: 12px; color: var(--text-placeholder); margin-bottom: 12px; padding: 8px; background: var(--bg-page); border-radius: 6px;">
                    💡 写下今天的感受：最开心的瞬间、最难忘的风景、有趣的人事物...
                </div>
                <textarea id="diary-input" rows="8" placeholder="今天发生了什么有趣的事？"
                    style="width: 100%; padding: 12px; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-card); color: var(--text-primary); font-size: 14px; resize: none; line-height: 1.6;">${Utils.escapeHtml(oldDiary)}</textarea>
                <div style="font-size: 11px; color: var(--text-placeholder); margin-top: 6px; text-align: right;">
                    ${oldDiary.length} 字
                </div>
                <div style="display: flex; gap: 8px; margin-top: 12px;">
                    <button class="btn btn-default" style="flex: 1;" onclick="Utils.closeModal()">取消</button>
                    ${oldDiary ? `<button class="btn btn-default" style="flex: 1; color: var(--danger);" onclick="Travel.clearDiary(${dayIdx})">清除</button>` : ''}
                    <button class="btn btn-primary" style="flex: 1;" onclick="Travel.saveDiary(${dayIdx})">保存</button>
                </div>
            </div>
        `);
    },

    /**
     * 保存旅行日记
     */
    saveDiary(dayIdx) {
        const diary = document.getElementById('diary-input').value.trim();
        this._dailyPlans[dayIdx].diary = diary;
        Utils.vibrate([10]);
        Utils.toast('✓ 日记已保存');
        Utils.closeModal();
        this.refreshDayCard(dayIdx);
    },

    /**
     * 清除旅行日记
     */
    clearDiary(dayIdx) {
        this._dailyPlans[dayIdx].diary = '';
        Utils.vibrate(8);
        Utils.toast('日记已清除');
        Utils.closeModal();
        this.refreshDayCard(dayIdx);
    },

    /**
     * 添加自定义景点到某天
     */
    addScenicToDay(dayIdx) {
        this._addCustomItem(dayIdx, 'scenic', '景点');
    },

    /**
     * 添加自定义美食到某天
     */
    addFoodToDay(dayIdx) {
        this._addCustomItem(dayIdx, 'food', '美食');
    },

    /**
     * 添加自定义住宿到某天
     */
    addHotelToDay(dayIdx) {
        this._addCustomItem(dayIdx, 'hotel', '住宿');
    },

    /**
     * 添加自定义项的通用方法
     * 小白理解：景点/美食/住宿的添加表单差不多，用同一个函数处理
     * @param {number} dayIdx - 第几天
     * @param {string} type - 类型：scenic/food/hotel
     * @param {string} label - 显示名称
     */
    _addCustomItem(dayIdx, type, label) {
        Utils.vibrate(8);
        const icons = type === 'scenic' ? ['🏯', '🏔️', '🏖️', '🎡', '🛕', '🏰', '🌳']
            : type === 'food' ? ['🍜', '🍲', '🥘', '🍱', '🍣', '🦐', '🥩']
            : ['🏨', '🏠', '🏡', '🏢'];
        Utils.showModal(`
            <div style="padding: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <h2 style="font-size: 17px;">➕ 添加${label}</h2>
                    <button class="icon-btn" onclick="Utils.closeModal()">✕</button>
                </div>
                <div style="margin-bottom: 12px;">
                    <label style="font-size: 13px; color: var(--text-secondary); display: block; margin-bottom: 4px;">${label}名称 *</label>
                    <input type="text" id="custom-item-name" placeholder="输入${label}名称"
                        style="width: 100%; padding: 10px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-card); color: var(--text-primary); font-size: 14px;">
                </div>
                <div style="margin-bottom: 12px;">
                    <label style="font-size: 13px; color: var(--text-secondary); display: block; margin-bottom: 4px;">图标</label>
                    <div style="display: flex; gap: 6px; flex-wrap: wrap;" id="item-icon-list">
                        ${icons.map((ic, i) => `
                            <button type="button" class="icon-btn item-icon-btn ${i === 0 ? 'selected' : ''}"
                                style="width: 36px; height: 36px; font-size: 18px; border: 1.5px solid ${i === 0 ? 'var(--primary)' : 'var(--border-color)'}; border-radius: var(--radius-sm);"
                                onclick="Travel.selectItemIcon('${ic}')">${ic}</button>
                        `).join('')}
                    </div>
                </div>
                <div style="margin-bottom: 12px;">
                    <label style="font-size: 13px; color: var(--text-secondary); display: block; margin-bottom: 4px;">价格（元，可选）</label>
                    <input type="number" id="custom-item-price" placeholder="0" value="0"
                        style="width: 100%; padding: 10px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-card); color: var(--text-primary); font-size: 14px;">
                </div>
                <div style="margin-bottom: 12px;">
                    <label style="font-size: 13px; color: var(--text-secondary); display: block; margin-bottom: 4px;">${type === 'hotel' ? '等级/位置' : '描述'}（可选）</label>
                    <input type="text" id="custom-item-desc" placeholder="${type === 'hotel' ? '如：五星级/市中心' : '如：特色、营业时间等'}"
                        style="width: 100%; padding: 10px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-card); color: var(--text-primary); font-size: 14px;">
                </div>
                <div style="display: flex; gap: 8px;">
                    <button class="btn btn-default" style="flex: 1;" onclick="Utils.closeModal()">取消</button>
                    <button class="btn btn-primary" style="flex: 1;" onclick="Travel.saveCustomItem(${dayIdx}, '${type}')">添加</button>
                </div>
            </div>
        `);
        this._itemIcon = icons[0];
    },

    /**
     * 选择自定义项图标
     */
    _itemIcon: '📌',
    selectItemIcon(icon) {
        this._itemIcon = icon;
        Utils.vibrate(5);
        document.querySelectorAll('.item-icon-btn').forEach(btn => {
            const ic = btn.textContent;
            btn.classList.toggle('selected', ic === icon);
            btn.style.borderColor = ic === icon ? 'var(--primary)' : 'var(--border-color)';
        });
    },

    /**
     * 保存添加的自定义项（景点/美食/住宿）
     */
    saveCustomItem(dayIdx, type) {
        const name = document.getElementById('custom-item-name').value.trim();
        const price = parseFloat(document.getElementById('custom-item-price').value) || 0;
        const desc = document.getElementById('custom-item-desc').value.trim();
        if (!name) {
            Utils.toast('请输入名称');
            return;
        }
        const plan = this._dailyPlans[dayIdx];
        if (type === 'scenic') {
            plan.scenics.push({
                name: name, icon: this._itemIcon, price: price,
                rating: 0, openTime: desc || '全天', desc: desc
            });
        } else if (type === 'food') {
            plan.foods.push({
                name: name, icon: this._itemIcon, price: price,
                rating: 0, cuisine: desc || '自定义'
            });
        } else if (type === 'hotel') {
            plan.hotels.push({
                name: name, price: price, level: desc || '自定义',
                rating: 0, area: ''
            });
        }
        Utils.vibrate([10]);
        Utils.toast('✓ 已添加');
        Utils.closeModal();
        this.refreshDayCard(dayIdx);
    },

    renderStations() {
        return this.stations.map((station, i) => this.renderStationItem(i, station)).join('');
    },

    /**
     * 渲染单个站点输入项
     * 小白理解：每个输入框都有 autocomplete="off"（禁用浏览器自动填充）
     *           onkeydown 里检查 event.isComposing（中文拼音输入期间不触发回车）
     *           第2站起加上↑↓按钮可以调整顺序
     */
    renderStationItem(i, value) {
        return `
            <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 8px;" id="station-row-${i}">
                <span style="font-size: 13px; color: var(--text-secondary); min-width: 50px;">
                    ${i === 0 ? '出发地' : '第' + i + '站'}
                </span>
                <input type="text" value="${value}" placeholder="输入城市名"
                    autocomplete="off" spellcheck="false"
                    style="flex: 1; padding: 6px 10px; border: 1px solid var(--border-color); border-radius: 6px; background: var(--bg-card); color: var(--text-primary);"
                    oninput="Travel.updateStation(${i}, this.value)"
                    onkeydown="if(!event.isComposing && event.key==='Enter') Travel.generatePlan()">
                ${i > 0 ? `
                    <button class="icon-btn" style="font-size: 12px; opacity: ${i > 1 ? '1' : '0.3'}; ${i > 1 ? '' : 'pointer-events: none;'}" onclick="Travel.moveStation(${i}, -1)" title="上移">↑</button>
                    <button class="icon-btn" style="font-size: 12px; opacity: 0.6;" onclick="Travel.moveStation(${i}, 1)" title="下移">↓</button>
                    <button class="icon-btn" onclick="Travel.removeStation(${i})">✕</button>
                ` : ''}
            </div>
        `;
    },

    /**
     * 添加站点（只往 DOM 里加一个输入框，不重建整个页面）
     */
    addStation() {
        if (this.stations.length >= 10) return;

        this.stations.push('');
        const list = document.getElementById('stations-list');
        if (!list) return;

        const temp = document.createElement('div');
        const i = this.stations.length - 1;
        temp.innerHTML = this.renderStationItem(i, '');
        list.appendChild(temp.firstElementChild);

        // 如果已到上限，隐藏"添加站点"按钮
        if (this.stations.length >= 10) {
            const addBtnArea = document.getElementById('travel-add-btn-area');
            if (addBtnArea) addBtnArea.innerHTML = '';
        }

        setTimeout(() => {
            const inputs = list.querySelectorAll('input[type="text"]');
            if (inputs[i]) inputs[i].focus();
        }, 50);
    },

    /**
     * 删除站点（只删除对应的 DOM 元素，不重建整个页面）
     */
    removeStation(index) {
        this.stations.splice(index, 1);
        const list = document.getElementById('stations-list');
        if (!list) return;

        const items = list.children;
        if (items[index]) {
            items[index].remove();
        }

        // 更新后面站点的序号和事件索引
        for (let i = index; i < this.stations.length; i++) {
            const item = items[i];
            if (!item) continue;
            const label = item.querySelector('span');
            if (label) label.textContent = i === 0 ? '出发地' : '第' + i + '站';
            const input = item.querySelector('input[type="text"]');
            if (input) {
                input.setAttribute('oninput', `Travel.updateStation(${i}, this.value)`);
                input.setAttribute('onkeydown', `if(!event.isComposing && event.key==='Enter') Travel.generatePlan()`);
            }
            // 更新三个按钮的 onclick
            const btns = item.querySelectorAll('.icon-btn');
            btns.forEach((btn, btnIdx) => {
                if (btnIdx === 0) btn.setAttribute('onclick', `Travel.moveStation(${i}, -1)`);
                else if (btnIdx === 1) btn.setAttribute('onclick', `Travel.moveStation(${i}, 1)`);
                else if (btnIdx === 2) btn.setAttribute('onclick', `Travel.removeStation(${i})`);
            });
            // 更新上移按钮的可用状态
            const upBtn = btns[0];
            if (upBtn) {
                if (i > 1) {
                    upBtn.style.opacity = '1';
                    upBtn.style.pointerEvents = '';
                } else {
                    upBtn.style.opacity = '0.3';
                    upBtn.style.pointerEvents = 'none';
                }
            }
        }

        // 如果之前达到上限被隐藏了，恢复"添加站点"按钮
        if (this.stations.length < 10) {
            const addBtnArea = document.getElementById('travel-add-btn-area');
            if (addBtnArea && addBtnArea.innerHTML === '') {
                addBtnArea.innerHTML = `<button class="btn btn-default btn-block" style="margin-top: 8px;" onclick="Travel.addStation()">+ 添加站点</button>`;
            }
        }
    },

    /**
     * 上移/下移站点
     * 小白理解：调换两个站点的顺序，然后重新渲染站点列表
     * @param {number} index - 要移动的站点索引
     * @param {number} direction - -1上移，1下移
     */
    moveStation(index, direction) {
        // 先从DOM读取最新值（防止用户输入了还没同步）
        this.readInputsFromDOM();

        const newIndex = index + direction;
        // 出发地（索引0）不能往下移，最后一个不能往下移
        if (newIndex < 1 || newIndex >= this.stations.length) return;

        // 交换位置
        const temp = this.stations[index];
        this.stations[index] = this.stations[newIndex];
        this.stations[newIndex] = temp;

        // 重新渲染站点列表
        const list = document.getElementById('stations-list');
        if (list) {
            list.innerHTML = this.renderStations();
        }
    },

    /**
     * 更新站点输入（只存数据，不刷新页面，不触发任何 DOM 操作）
     * 小白理解：用户打字时只记住输入的内容，绝对不做任何会影响输入框的事
     */
    updateStation(index, value) {
        this.stations[index] = value;
    },

    /**
     * 更新出发日期
     */
    updateStartDate(value) {
        this._startDate = value;
    },

    /**
     * 生成出行方案（点击确认按钮后调用）
     * 只刷新结果区，不碰输入框
     */
    generatePlan() {
        this.readInputsFromDOM();

        // 从 DOM 读取日期（防止 onchange 未触发的边缘情况）
        const dateInput = document.getElementById('travel-date-input');
        if (dateInput && dateInput.value) {
            this._startDate = dateInput.value;
        }

        const from = this.stations[0];
        const hasDestination = this.stations.some((s, i) => i > 0 && s);

        if (!from) {
            Utils.toast('请输入出发地');
            const firstInput = document.querySelector('#travel-content input[type="text"]');
            if (firstInput) firstInput.focus();
            return;
        }
        if (!hasDestination) {
            Utils.toast('请添加目的地');
            return;
        }

        this._planGenerated = true;
        this._dailyPlans = this.generateDailyPlans();

        const resultArea = document.getElementById('travel-result-area');
        if (resultArea) {
            resultArea.innerHTML = this.renderResultArea();
        }

        // 重置滑动位置到第一天
        setTimeout(() => {
            const slider = document.getElementById('day-slider');
            if (slider) {
                slider.scrollLeft = 0;
            }
            // 初始化第一天导航按钮高亮
            this.onDayScroll();
        }, 50);

        Utils.toast('出行方案已生成');

        setTimeout(() => {
            const ra = document.getElementById('travel-result-area');
            if (ra) ra.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    },

    /**
     * 生成按日期分组的出行计划
     * 小白理解：每个目的地根据景点数量自动算出玩几天（每天2个景点），
     *           到达当天显示交通，后续几天只显示当地游玩内容
     */
    generateDailyPlans() {
        const plans = [];
        let currentFrom = this.stations[0];
        
        // 获取出发日期，如果没选则用今天
        const startDate = this._startDate ? new Date(this._startDate) : new Date();
        
        // 全局天数计数器（第1天、第2天...一直递增）
        let globalDay = 1;

        // 遍历每个目的地站点（从第1站开始）
        for (let i = 1; i < this.stations.length; i++) {
            const to = this.stations[i];
            if (!to) continue;

            // 获取该城市所有景点和美食
            const allScenics = Data.getScenicsByCity(to);
            const allFoods = Data.getFoodsByCity(to);
            const hotels = Data.getHotels(to);
            const weather = Data.getWeather(to);

            // 计算需要玩几天：每2个景点为1天，至少1天
            const stayDays = Math.max(1, Math.ceil(allScenics.length / 2));

            // 获取交通票务（只在到达当天需要）
            const tickets = Data.getTickets(currentFrom, to);

            // 为该目的地的每一天生成行程
            for (let d = 0; d < stayDays; d++) {
                // 计算日期
                const currentDate = new Date(startDate);
                currentDate.setDate(startDate.getDate() + (globalDay - 1));
                const dateStr = Utils.formatDate(currentDate);
                const dayOfWeek = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][currentDate.getDay()];

                // 取出当天的景点（第d天的2个景点）
                const dayScenics = allScenics.slice(d * 2, d * 2 + 2);
                // 每天推荐3个美食，按天数轮换，避免每天一样
                const foodStart = (d * 3) % allFoods.length;
                const dayFoods = [
                    ...allFoods.slice(foodStart, foodStart + 3),
                    ...(foodStart + 3 > allFoods.length ? allFoods.slice(0, (foodStart + 3) - allFoods.length) : [])
                ].slice(0, 3);

                plans.push({
                    day: globalDay,
                    date: dateStr,
                    dayOfWeek: dayOfWeek,
                    from: currentFrom,
                    to: to,
                    // 是否为到达当天（第一天需要显示交通）
                    isArrivalDay: (d === 0),
                    // 在该目的地的第几天
                    localDay: d + 1,
                    // 该目的地总共玩几天
                    totalStayDays: stayDays,
                    tickets: tickets,
                    hotels: hotels,
                    scenics: dayScenics,
                    foods: dayFoods,
                    // 创新点：每天显示对应天的天气预报（而非统一的当前天气）
                    // 小白理解：第1天用"今天"的预报，第2天用"明天"的预报，以此类推
                    // 超过5天的没有预报数据，就退回用当前天气
                    weather: weather ? {
                        current: (weather.forecast && globalDay <= weather.forecast.length)
                            ? {
                                temp: (() => {
                                    // 创新点：用 isNaN 判断而不是 ||，避免 0°C 被当作 falsy 走回退
                                    const t = parseInt(weather.forecast[globalDay - 1].temp);
                                    return isNaN(t) ? weather.current.temp : t;
                                })(),
                                desc: weather.forecast[globalDay - 1].desc,
                                icon: weather.forecast[globalDay - 1].icon,
                                humidity: weather.current.humidity,
                                wind: weather.current.wind
                              }
                            : weather.current,
                        forecast: weather.forecast,
                        advice: weather.advice,
                        // 当天的预报详情（含温度范围如"34/25°"）
                        dayForecast: weather.forecast && globalDay <= weather.forecast.length
                            ? weather.forecast[globalDay - 1]
                            : null
                    } : null,
                    // 自定义活动列表（用户可添加/删除，创新点：自由编辑）
                    activities: [],
                    // 当天备注（用户可编辑）
                    note: '',
                    // 旅行日记（用户可写当天的感受和回忆）
                    diary: ''
                });

                globalDay++;
            }

            // 更新出发地为当前目的地（下一站的出发地）
            currentFrom = to;
        }

        return plans;
    },

    /**
     * 计算整个旅程的费用估算
     * 小白理解：把所有天的交通、住宿、门票、餐饮费用加起来
     * 交通取最便宜的一趟，住宿取最便宜的酒店×住宿天数，门票取景点价格，餐饮按每天3顿×均价
     */
    calculateCost() {
        let transport = 0;
        let hotel = 0;
        let ticket = 0;
        let food = 0;

        this._dailyPlans.forEach(plan => {
            // 交通费：取到达当天最便宜的票
            if (plan.isArrivalDay && plan.tickets.length > 0) {
                const cheapest = plan.tickets.reduce((a, b) => a.price < b.price ? a : b);
                transport += cheapest.price;
            }

            // 住宿费：取最便宜的酒店×1晚
            if (plan.hotels.length > 0) {
                const cheapest = plan.hotels.reduce((a, b) => a.price < b.price ? a : b);
                hotel += cheapest.price;
            }

            // 门票费：当天所有景点票价之和
            plan.scenics.forEach(s => {
                if (typeof s.price === 'number' && s.price > 0) {
                    ticket += s.price;
                }
            });

            // 餐饮费：按每天推荐的美食均价×3顿
            if (plan.foods.length > 0) {
                const avgFoodPrice = plan.foods.reduce((sum, f) => sum + (typeof f.price === 'number' ? f.price : 0), 0) / plan.foods.length;
                food += Math.round(avgFoodPrice * 3);
            }
        });

        return {
            transport: transport,
            hotel: hotel,
            ticket: ticket,
            food: food,
            total: transport + hotel + ticket + food
        };
    },

    /**
     * 保存当前出行方案
     * 小白理解：把当前生成的方案存到本地，下次打开还能看到
     */
    saveCurrentPlan() {
        if (this._dailyPlans.length === 0) {
            Utils.toast('请先生成出行方案');
            return;
        }

        const plan = {
            stations: [...this.stations],
            startDate: this._startDate,
            dailyPlans: [...this._dailyPlans],
            costSummary: this.calculateCost()
        };

        AppStorage.saveTravelPlan(plan);

        // 修复：递增方案生成次数，用于解锁"规划能手"徽章
        const planCount = AppStorage.get('planGeneratedCount') || 0;
        AppStorage.set('planGeneratedCount', planCount + 1);

        Utils.toast('✓ 方案已保存');

        // 刷新按钮文字（保留滑动位置）
        const slider = document.getElementById('day-slider');
        const scrollLeft = slider ? slider.scrollLeft : 0;
        const resultArea = document.getElementById('travel-result-area');
        if (resultArea) {
            resultArea.innerHTML = this.renderResultArea();
            // 恢复滑动位置
            if (slider) slider.scrollLeft = scrollLeft;
        }
    },

    /**
     * 导出/分享行程（复制文字到剪贴板）
     * 小白理解：把行程转成文字复制下来，可以发给朋友
     */
    exportPlan() {
        if (this._dailyPlans.length === 0) {
            Utils.toast('请先生成出行方案');
            return;
        }

        const cost = this.calculateCost();
        let text = `🗺️ 我的旅行行程（${this._dailyPlans.length}天）\n`;
        text += `💰 总预算约 ¥${cost.total}\n\n`;

        this._dailyPlans.forEach(plan => {
            text += `📅 第${plan.day}天 · ${plan.date} (${plan.dayOfWeek})\n`;
            text += `📍 ${plan.to}（第${plan.localDay}天/共${plan.totalStayDays}天）\n`;

            if (plan.isArrivalDay) {
                text += `🚄 从${plan.from}出发\n`;
            }

            if (plan.scenics.length > 0) {
                text += `🏯 景点：${plan.scenics.map(s => s.name).join('、')}\n`;
            }

            if (plan.foods.length > 0) {
                text += `🍽️ 美食：${plan.foods.map(f => f.name).join('、')}\n`;
            }

            text += '\n';
        });

        text += `—— 来自「旅简 TravelEasy」`;

        // 复制到剪贴板
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                Utils.toast('✓ 行程已复制，快去分享吧！');
            }).catch(() => {
                this.fallbackCopy(text);
            });
        } else {
            this.fallbackCopy(text);
        }
    },

    /**
     * 备用复制方案（老浏览器不支持 clipboard API 时用）
     */
    fallbackCopy(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            Utils.toast('✓ 行程已复制，快去分享吧！');
        } catch (e) {
            Utils.toast('复制失败，请手动复制');
        }
        document.body.removeChild(textarea);
    },

    /**
     * 加载已保存的方案
     * 小白理解：页面打开时，如果有保存的方案，自动加载进来
     */
    loadSavedPlan() {
        const saved = AppStorage.getTravelPlan();
        if (!saved) return false;

        this.stations = saved.stations || ['', ''];
        this._startDate = saved.startDate || '';
        this._dailyPlans = saved.dailyPlans || [];
        this._planGenerated = this._dailyPlans.length > 0;

        return true;
    },

    /**
     * 从 DOM 读取最新的输入框值，同步到 this.stations
     */
    readInputsFromDOM() {
        const inputs = document.querySelectorAll('#stations-list input[type="text"]');
        inputs.forEach((input, i) => {
            if (i < this.stations.length) {
                this.stations[i] = input.value.trim();
            }
        });
    },

    /**
     * 从行程中提取所有不重复的目的地城市
     */
    getTripCities() {
        const trips = AppStorage.getTrip();
        if (trips.length === 0) return [];
        return [...new Set(trips.map(t => t.city))];
    },

    /**
     * 一键从行程导入目的地
     * 只更新 stations-list 和结果区，不重建整个输入区
     */
    importFromTrip() {
        const cities = this.getTripCities();
        if (cities.length === 0) {
            Utils.toast('行程中还没有景点，请先添加');
            return;
        }

        const from = this.stations[0] || '';
        this.stations = [from, ...cities];
        this._planGenerated = false;

        // 只更新 stations-list，不重建整个输入区
        const list = document.getElementById('stations-list');
        if (list) {
            list.innerHTML = this.renderStations();
        }

        // 更新结果区
        const resultArea = document.getElementById('travel-result-area');
        if (resultArea) {
            resultArea.innerHTML = this.renderResultArea();
        }

        Utils.toast('已导入 ' + cities.length + ' 个目的地');

        if (!from) {
            setTimeout(() => {
                const firstInput = document.querySelector('#travel-content input[type="text"]');
                if (firstInput) firstInput.focus();
            }, 100);
        }
    },

    /**
     * 设置出发地（供其他模块调用，如行程页的"生成出行方案"按钮）
     */
    setFromAndImport(from) {
        const cities = this.getTripCities();
        if (cities.length === 0) return false;
        this.stations = [from || '', ...cities];
        this._planGenerated = false;

        // 如果输入区已存在，只更新 stations-list
        const list = document.getElementById('stations-list');
        if (list) {
            list.innerHTML = this.renderStations();
        } else {
            this.render();
        }

        const resultArea = document.getElementById('travel-result-area');
        if (resultArea) {
            resultArea.innerHTML = this.renderResultArea();
        }
        return true;
    },

    /**
     * 切换到出行页时自动检测行程
     * 只在输入区不存在时才全量渲染，否则完全不碰输入区
     */
    onShow() {
        const existingCard = document.getElementById('travel-input-card');

        // 如果输入区不存在（第一次打开），全量渲染
        if (!existingCard) {
            this.render();
            return;
        }

        // 输入区已存在，只更新结果区（如果已生成方案的话）
        if (this._planGenerated) {
            const resultArea = document.getElementById('travel-result-area');
            if (resultArea) {
                resultArea.innerHTML = this.renderResultArea();
            }
        }

        // 更新行程提示和导入按钮
        const tripCities = this.getTripCities();
        const hasTripCities = tripCities.length > 0;
        const importBtnArea = document.getElementById('travel-import-btn-area');
        const tripHint = document.getElementById('travel-trip-hint');
        if (importBtnArea) {
            importBtnArea.innerHTML = hasTripCities ? `
                <button class="btn btn-primary" style="font-size: 12px; padding: 4px 10px;" onclick="Travel.importFromTrip()">
                    📋 从行程导入目的地
                </button>
            ` : '';
        }
        if (tripHint) {
            tripHint.innerHTML = hasTripCities ? `
                <div style="font-size: 12px; color: var(--text-secondary); margin-top: 8px; padding: 8px; background: var(--bg-page); border-radius: 6px;">
                    💡 检测到行程中有 <b>${tripCities.length}</b> 个目的地城市：${tripCities.join('、')}
                </div>
            ` : '';
        }

        // 设置日期输入框的默认值（今天，用本地日期避免时区偏差）
        const dateInput = document.getElementById('travel-date-input');
        if (dateInput && !dateInput.value) {
            dateInput.value = Utils.formatDate(new Date());
            this._startDate = dateInput.value;
        }
    }
};
