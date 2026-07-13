/* ============================================ */
/* trip.js - 我的行程模块（Tab 4）              */
/* 作用：已保存景点、行程生成、编辑、收藏        */
/* 状态：阶段6 将填充完整功能                    */
/* ============================================ */

window.Trip = {
    sortBy: 'time',  // 排序方式
    currentTab: 'trip',  // 当前子标签：trip/favorites
    viewMode: 'list',  // 视图模式：list（列表）/ timeline（时间轴）创新点

    init() {
        this.render();
        // 绑定下拉刷新（创新点）
        if (typeof App !== 'undefined' && App.bindPullRefresh) {
            App.bindPullRefresh('trip', () => {
                this.render();
            });
        }
    },

    render() {
        const content = document.getElementById('trip-content');

        if (this.currentTab === 'favorites') {
            this.renderFavorites(content);
        } else {
            this.renderTrip(content);
        }
    },

    renderTrip(content) {
        const trips = AppStorage.getTrip();

        if (trips.length === 0) {
            content.innerHTML = `
                <!-- 子标签切换 -->
                <div class="filter-bar">
                    <button class="filter-btn active">📋 我的行程</button>
                    <button class="filter-btn" onclick="Trip.switchTab('favorites')">⭐ 我的收藏</button>
                </div>

                <!-- 空状态 -->
                <div class="empty-state">
                    <div class="empty-icon">📋</div>
                    <div class="empty-text">还没有添加任何景点</div>
                    <button class="btn btn-primary" onclick="Utils.switchTab('home')">去首页发现景点</button>
                </div>
            `;
            return;
        }

        // 排序
        const sorted = this.sortTrips([...trips]);

        // 根据视图模式渲染不同内容
        // 任何排序方式下都可以上移下移（通过交换 addTime 实现）
        const canReorder = true;
        const listHTML = this.viewMode === 'timeline'
            ? this.renderTimelineView(sorted)
            : this.viewMode === 'grouped'
                ? this.renderGroupedView(sorted, canReorder)
                : sorted.map((s, idx) => {
                    // 计算是否可以上移/下移
                    const canUp = canReorder && idx > 0;
                    const canDown = canReorder && idx < sorted.length - 1;
                    return `
                    <div class="card trip-item-card" style="padding: 12px;" data-trip-id="${s.id}">
                        <div style="display: flex; justify-content: space-between; align-items: start;">
                            <div style="flex: 1;" onclick="Trip.showItemDetail('${s.id}')">
                                <div style="font-size: 15px; font-weight: 600;">
                                    ${s.icon} ${s.name}
                                    ${s.custom ? '<span class="tag tag-info" style="font-size: 9px; margin-left: 4px;">自定义</span>' : ''}
                                    ${s.checked ? '<span class="tag tag-success" style="font-size: 9px; margin-left: 4px;">✓ 已打卡</span>' : ''}
                                </div>
                                <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">
                                    ${s.city} · ⭐${s.rating} · ${Utils.formatPrice(s.price)}
                                </div>
                                ${s.note ? `<div style="font-size: 12px; color: var(--warning); margin-top: 4px; max-height: 36px; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">📝 ${Utils.escapeHtml(s.note)}</div>` : ''}
                                ${s.visitTime ? `<div style="font-size: 11px; color: var(--primary); margin-top: 2px;">🕐 ${s.visitTime}</div>` : ''}
                                ${s.actualCost !== null && s.actualCost !== undefined ? `<div style="font-size: 11px; color: var(--success); margin-top: 2px;">💰 实际花费 ¥${s.actualCost}</div>` : ''}
                                <div style="font-size: 11px; color: var(--text-placeholder); margin-top: 2px;">
                                    ${Utils.timeAgo(s.addTime)}
                                </div>
                            </div>
                            <!-- 快捷操作按钮组 -->
                            <div style="display: flex; flex-direction: column; gap: 4px; align-items: center;">
                                <button class="icon-btn trip-action-btn ${canUp ? '' : 'disabled'}"
                                    style="width: 28px; height: 24px; font-size: 14px;"
                                    ${canUp ? `onclick="Trip.moveItem('${s.id}', -1)"` : 'disabled'}
                                    title="上移">↑</button>
                                <button class="icon-btn trip-action-btn ${canDown ? '' : 'disabled'}"
                                    style="width: 28px; height: 24px; font-size: 14px;"
                                    ${canDown ? `onclick="Trip.moveItem('${s.id}', 1)"` : 'disabled'}
                                    title="下移">↓</button>
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 4px; align-items: center; margin-left: 4px;">
                                <button class="icon-btn trip-action-btn"
                                    style="width: 28px; height: 24px; font-size: 13px;"
                                    onclick="Trip.toggleCheck('${s.id}')"
                                    title="${s.checked ? '取消打卡' : '打卡'}">${s.checked ? '✓' : '○'}</button>
                                <button class="icon-btn trip-action-btn"
                                    style="width: 28px; height: 24px; font-size: 13px;"
                                    onclick="Trip.editItem('${s.id}')"
                                    title="编辑">✏️</button>
                                <button class="icon-btn trip-action-btn"
                                    style="width: 28px; height: 24px; font-size: 13px;"
                                    onclick="Trip.remove('${s.id}')"
                                    title="删除">🗑️</button>
                            </div>
                        </div>
                    </div>
                    `;
                }).join('');

        content.innerHTML = `
            <!-- 子标签切换 -->
            <div class="filter-bar">
                <button class="filter-btn active">📋 我的行程 (${trips.length})</button>
                <button class="filter-btn" onclick="Trip.switchTab('favorites')">⭐ 我的收藏</button>
            </div>

            <!-- 排序栏 -->
            <div class="filter-bar">
                <button class="filter-btn ${this.sortBy === 'time' ? 'active' : ''}" onclick="Trip.sort('time')">按时间</button>
                <button class="filter-btn ${this.sortBy === 'city' ? 'active' : ''}" onclick="Trip.sort('city')">按城市</button>
                <button class="filter-btn ${this.sortBy === 'rating' ? 'active' : ''}" onclick="Trip.sort('rating')">按评分</button>
                <button class="filter-btn ${this.sortBy === 'price' ? 'active' : ''}" onclick="Trip.sort('price')">按价格</button>
            </div>

            <!-- 视图切换：列表 / 分组 / 时间轴（创新点：三种视图） -->
            <div class="filter-bar">
                <button class="filter-btn ${this.viewMode === 'list' ? 'active' : ''}" onclick="Trip.switchView('list')">📋 列表</button>
                <button class="filter-btn ${this.viewMode === 'grouped' ? 'active' : ''}" onclick="Trip.switchView('grouped')">🗺️ 按城市</button>
                <button class="filter-btn ${this.viewMode === 'timeline' ? 'active' : ''}" onclick="Trip.switchView('timeline')">🕐 时间轴</button>
            </div>

            <!-- 主操作按钮组 -->
            <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                <button class="btn btn-primary" style="flex: 1;" onclick="Trip.generateTravelPlan()">
                    🚄 生成出行方案
                </button>
                <button class="btn btn-default" style="flex: 1;" onclick="Trip.showAddCustom()">
                    ➕ 自定义添加
                </button>
            </div>

            <!-- 快速预览 + 分享图片（创新点：生成精美行程图分享） -->
            <div style="display: flex; gap: 8px; margin-bottom: 16px;">
                <button class="btn btn-default" style="flex: 1;" onclick="Trip.generatePlan()">
                    📋 快速预览
                </button>
                <button class="btn btn-default" style="flex: 1;" onclick="Trip.shareTripImage()">
                    📤 分享行程图
                </button>
            </div>

            <!-- 花费统计（创新点：计划预算 vs 实际花费对比） -->
            ${this.renderCostSummary(trips)}

            <!-- 打卡统计 + 拖动提示 -->
            ${this.viewMode === 'list' ? `
                <div style="font-size: 11px; color: var(--text-secondary); padding: 6px 8px; background: var(--bg-page); border-radius: 6px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
                    <span>✅ 已打卡 ${trips.filter(t => t.checked).length} / ${trips.length} 个</span>
                    <span style="color: var(--primary);">💡 长按卡片可拖动排序</span>
                </div>
            ` : ''}

            <!-- 景点列表 / 分组 / 时间轴 -->
            ${listHTML}
        `;

        // 绑定长按事件（创新点：长按行程卡片弹出操作菜单）
        this.bindTripCardLongPress();
    },

    /**
     * 渲染花费统计卡片（创新点：计划预算 vs 实际花费对比）
     * 小白理解：把每个景点的预估票价加起来=计划花费，把填了的实际花费加起来=实际花费
     *           对比显示，让用户知道预算超了还是省了
     * @param {Array} trips - 行程列表
     * @returns {string} HTML字符串
     */
    renderCostSummary(trips) {
        if (!trips || trips.length === 0) return '';
        // 计划花费 = 所有景点预估票价之和
        const plannedCost = trips.reduce((sum, t) => sum + (t.price || 0), 0);
        // 实际花费 = 已填写的实际花费之和
        const actualItems = trips.filter(t => t.actualCost !== null && t.actualCost !== undefined);
        const actualCost = actualItems.reduce((sum, t) => sum + (t.actualCost || 0), 0);
        const filledCount = actualItems.length;
        // 差额：正数=超支，负数=节省
        const diff = actualCost - plannedCost;
        const diffColor = diff > 0 ? 'var(--danger)' : 'var(--success)';
        const diffText = diff > 0 ? `超支 ¥${diff.toFixed(1)}` : diff < 0 ? `节省 ¥${Math.abs(diff).toFixed(1)}` : '持平';

        return `
            <div style="background: var(--bg-card); border-radius: var(--radius-md); padding: 12px; margin-bottom: 10px; box-shadow: var(--shadow-sm); border-left: 4px solid var(--warning);">
                <div style="font-size: 13px; font-weight: 600; margin-bottom: 8px;">💰 花费统计</div>
                <div style="display: flex; justify-content: space-between; font-size: 12px;">
                    <div>
                        <div style="color: var(--text-secondary);">计划花费</div>
                        <div style="font-size: 16px; font-weight: 700; color: var(--primary);">¥${plannedCost}</div>
                    </div>
                    <div>
                        <div style="color: var(--text-secondary);">实际花费</div>
                        <div style="font-size: 16px; font-weight: 700; color: var(--warning);">¥${actualCost.toFixed(1)}</div>
                        <div style="font-size: 10px; color: var(--text-placeholder);">已填 ${filledCount}/${trips.length} 项</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="color: var(--text-secondary);">差额</div>
                        <div style="font-size: 16px; font-weight: 700; color: ${diffColor};">${filledCount > 0 ? diffText : '—'}</div>
                    </div>
                </div>
                ${filledCount > 0 ? `
                    <div style="height: 4px; background: var(--divider-color); border-radius: 2px; overflow: hidden; margin-top: 8px;">
                        <div style="height: 100%; width: ${Math.min(100, (actualCost / Math.max(plannedCost, 1)) * 100)}%; background: ${diffColor}; border-radius: 2px; transition: width 0.3s;"></div>
                    </div>
                ` : `
                    <div style="font-size: 11px; color: var(--text-placeholder); margin-top: 6px;">💡 编辑行程项可填写实际花费</div>
                `}
            </div>
        `;
    },

    /**
     * 生成精美行程分享图片（创新点：用Canvas画一张漂亮的行程图可保存分享）
     * 小白理解：把你的行程画成一张图片，可以保存到相册或分享给朋友
     *           用Canvas画板一个元素一个元素地画上去，最后转成图片
     */
    shareTripImage() {
        const trips = AppStorage.getTrip();
        if (trips.length === 0) {
            Utils.toast('行程为空，无法生成图片');
            return;
        }

        Utils.vibrate([10, 30, 10]);
        Utils.toast('正在生成行程图片...');

        // 获取旅程信息
        const journey = AppStorage.getActiveJourney();
        const cities = journey ? journey.cities : [...new Set(trips.map(t => t.city).filter(Boolean))];
        const departure = journey ? journey.departure : '我的';

        // 按城市分组
        const groups = {};
        trips.forEach(t => {
            const c = t.city || '其他';
            if (!groups[c]) groups[c] = [];
            groups[c].push(t);
        });

        const totalCost = trips.reduce((sum, t) => sum + (t.price || 0), 0);
        const checkedCount = trips.filter(t => t.checked).length;

        // 创建画布（手机宽度的图片，适合分享）
        const canvas = document.createElement('canvas');
        const W = 750;  // 图片宽度
        const padding = 40;
        const ctx = canvas.getContext('2d');

        // 创新点：roundRect 兼容性补丁（部分老浏览器不支持 ctx.roundRect）
        // 小白理解：有些旧浏览器不认识"画圆角矩形"这个命令，这里手动教它一下
        if (typeof ctx.roundRect !== 'function') {
            ctx.roundRect = function(x, y, w, h, r) {
                this.moveTo(x + r, y);
                this.arcTo(x + w, y, x + w, y + h, r);
                this.arcTo(x + w, y + h, x, y + h, r);
                this.arcTo(x, y + h, x, y, r);
                this.arcTo(x, y, x + w, y, r);
                return this;
            };
        }

        // 先计算高度
        let y = 0;
        const headerHeight = 280;
        const statsHeight = 100;
        let listHeight = 0;
        Object.keys(groups).forEach(city => {
            listHeight += 60;  // 城市标题
            groups[city].forEach(() => { listHeight += 55; });  // 每个景点
        });
        const footerHeight = 100;
        const totalHeight = headerHeight + statsHeight + listHeight + footerHeight + padding * 2;
        canvas.width = W;
        canvas.height = totalHeight;

        // 1. 画背景渐变
        const bgGrad = ctx.createLinearGradient(0, 0, 0, totalHeight);
        bgGrad.addColorStop(0, '#f0f4ff');
        bgGrad.addColorStop(1, '#fff5f5');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, W, totalHeight);

        // 2. 画头部渐变背景
        const headerGrad = ctx.createLinearGradient(0, 0, W, headerHeight);
        headerGrad.addColorStop(0, '#667eea');
        headerGrad.addColorStop(1, '#764ba2');
        ctx.fillStyle = headerGrad;
        ctx.fillRect(0, 0, W, headerHeight);

        // 装饰圆点
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.beginPath(); ctx.arc(80, 60, 40, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(W - 60, 100, 30, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(W - 120, 40, 15, 0, Math.PI * 2); ctx.fill();

        // 3. 画标题
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('✈️ 我的旅行行程', W / 2, 80);

        // 副标题
        ctx.font = '20px sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.fillText(`${departure} → ${cities.join(' → ')}`, W / 2, 120);

        // 日期
        ctx.font = '16px sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fillText(Utils.formatDate(new Date()), W / 2, 155);

        // 4. 画统计卡片
        y = headerHeight + 30;
        const statW = (W - padding * 2 - 20) / 3;
        const stats = [
            { label: '景点', value: trips.length + '个', color: '#1890ff' },
            { label: '已打卡', value: checkedCount + '个', color: '#52c41a' },
            { label: '预算', value: '¥' + totalCost, color: '#faad14' }
        ];
        stats.forEach((s, i) => {
            const x = padding + i * (statW + 10);
            // 卡片背景
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.roundRect(x, y, statW, 70, 12);
            ctx.fill();
            // 数值
            ctx.fillStyle = s.color;
            ctx.font = 'bold 24px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(s.value, x + statW / 2, y + 32);
            // 标签
            ctx.fillStyle = '#999';
            ctx.font = '13px sans-serif';
            ctx.fillText(s.label, x + statW / 2, y + 55);
        });
        y += 100;

        // 5. 画行程列表
        ctx.textAlign = 'left';
        Object.keys(groups).forEach(city => {
            // 城市标题
            ctx.fillStyle = '#667eea';
            ctx.font = 'bold 22px sans-serif';
            ctx.fillText('📍 ' + city, padding, y + 25);
            ctx.fillStyle = '#ccc';
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(groups[city].length + '个景点', W - padding, y + 25);
            ctx.textAlign = 'left';
            y += 50;

            // 景点列表
            groups[city].forEach((t, idx) => {
                // 卡片背景
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.roundRect(padding, y, W - padding * 2, 45, 8);
                ctx.fill();

                // 图标
                ctx.font = '22px sans-serif';
                ctx.fillText(t.icon || '📌', padding + 12, y + 30);

                // 名称
                ctx.fillStyle = '#333';
                ctx.font = '16px sans-serif';
                const name = t.name.length > 12 ? t.name.slice(0, 12) + '...' : t.name;
                ctx.fillText(name, padding + 45, y + 28);

                // 打卡状态
                if (t.checked) {
                    ctx.fillStyle = '#52c41a';
                    ctx.font = '14px sans-serif';
                    ctx.textAlign = 'right';
                    ctx.fillText('✓ 已打卡', W - padding - 12, y + 28);
                    ctx.textAlign = 'left';
                } else {
                    // 价格
                    ctx.fillStyle = '#faad14';
                    ctx.font = '14px sans-serif';
                    ctx.textAlign = 'right';
                    ctx.fillText('¥' + (t.price || 0), W - padding - 12, y + 28);
                    ctx.textAlign = 'left';
                }
                y += 55;
            });
        });

        // 6. 画底部
        y += 20;
        ctx.fillStyle = '#999';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('由「旅简 TravelEasy」生成', W / 2, y + 20);
        ctx.fillStyle = '#ccc';
        ctx.font = '12px sans-serif';
        ctx.fillText('一站式智能旅游规划助手', W / 2, y + 45);

        // 转成图片
        const dataUrl = canvas.toDataURL('image/png');

        // 显示预览弹窗
        Utils.showModal(`
            <div style="padding: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <h2 style="font-size: 17px;">📤 行程分享图</h2>
                    <button class="icon-btn" onclick="Utils.closeModal()">✕</button>
                </div>
                <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 12px;">
                    长按图片可保存到相册，或点击下方按钮下载
                </div>
                <img src="${dataUrl}" style="width: 100%; border-radius: var(--radius-md); box-shadow: var(--shadow-md);" />
                <div style="display: flex; gap: 8px; margin-top: 12px;">
                    <a href="${dataUrl}" download="我的旅行行程_${Utils.formatDate(new Date())}.png" class="btn btn-primary" style="flex: 1; text-align: center; text-decoration: none;">
                        💾 下载图片
                    </a>
                    <button class="btn btn-default" style="flex: 1;" onclick="Utils.closeModal()">关闭</button>
                </div>
            </div>
        `);
    },

    /**
     * 渲染按城市分组视图
     * 小白理解：把行程里的景点按城市归类，每个城市一个折叠组，更清晰
     * @param {Array} sorted - 排序后的行程列表
     * @param {boolean} canReorder - 是否可调整顺序
     */
    renderGroupedView(sorted, canReorder) {
        // 按城市分组
        const groups = {};
        sorted.forEach(s => {
            const city = s.city || '未分类';
            if (!groups[city]) groups[city] = [];
            groups[city].push(s);
        });

        const cityNames = Object.keys(groups);
        if (cityNames.length === 0) {
            return '<div class="empty-state"><div class="empty-icon">📋</div><div class="empty-text">暂无行程</div></div>';
        }

        return cityNames.map(city => {
            const items = groups[city];
            const cityData = Data.cities.find(c => c.name === city);
            const icon = cityData ? cityData.icon : '📌';
            const checkedCount = items.filter(i => i.checked).length;
            return `
                <div class="card" style="padding: 12px; margin-bottom: 12px; border-left: 4px solid var(--primary);">
                    <!-- 城市标题 -->
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid var(--divider-color);">
                        <div>
                            <span style="font-size: 16px; font-weight: 600;">${icon} ${city}</span>
                            <span style="font-size: 12px; color: var(--text-secondary); margin-left: 8px;">${items.length}个</span>
                        </div>
                        <div style="display: flex; gap: 6px; align-items: center;">
                            <span style="font-size: 11px; color: var(--success);">✓ ${checkedCount}/${items.length}</span>
                            <button class="icon-btn" style="font-size: 12px;" onclick="Trip.toggleGroup('${city}')" id="group-toggle-${city}">▼</button>
                        </div>
                    </div>
                    <!-- 城市内的行程项 -->
                    <div id="group-items-${city}">
                        ${items.map(s => `
                            <div class="card trip-item-card" style="padding: 10px; margin-bottom: 6px; ${s.checked ? 'opacity: 0.6;' : ''}" data-trip-id="${s.id}">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <div style="flex: 1;" onclick="Trip.showItemDetail('${s.id}')">
                                        <div style="font-size: 14px; font-weight: 500; ${s.checked ? 'text-decoration: line-through;' : ''}">
                                            ${s.icon} ${s.name}
                                            ${s.custom ? '<span class="tag tag-info" style="font-size: 9px;">自定义</span>' : ''}
                                        </div>
                                        <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">
                                            ⭐${s.rating} · ${Utils.formatPrice(s.price)}
                                            ${s.visitTime ? ` · 🕐 ${s.visitTime}` : ''}
                                        </div>
                                        ${s.note ? `<div style="font-size: 11px; color: var(--warning); margin-top: 2px; max-height: 18px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">📝 ${Utils.escapeHtml(s.note)}</div>` : ''}
                                    </div>
                                    <div style="display: flex; gap: 4px;">
                                        <button class="icon-btn" style="font-size: 13px; width: 24px; height: 24px;" onclick="Trip.toggleCheck('${s.id}')" title="${s.checked ? '取消打卡' : '打卡'}">${s.checked ? '✓' : '○'}</button>
                                        <button class="icon-btn" style="font-size: 12px; width: 24px; height: 24px;" onclick="Trip.editItem('${s.id}')" title="编辑">✏️</button>
                                        <button class="icon-btn" style="font-size: 12px; width: 24px; height: 24px;" onclick="Trip.remove('${s.id}')" title="删除">🗑️</button>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');
    },

    /**
     * 折叠/展开城市分组
     */
    _collapsedGroups: {},
    toggleGroup(city) {
        this._collapsedGroups[city] = !this._collapsedGroups[city];
        const items = document.getElementById('group-items-' + city);
        const toggle = document.getElementById('group-toggle-' + city);
        if (items) {
            items.style.display = this._collapsedGroups[city] ? 'none' : '';
        }
        if (toggle) {
            toggle.textContent = this._collapsedGroups[city] ? '▶' : '▼';
        }
    },

    /**
     * 打卡/取消打卡
     * 小白理解：去过一个地方就点一下打卡，记录实际游览情况
     */
    toggleCheck(id) {
        Utils.vibrate(10);
        const trips = AppStorage.getTrip();
        const item = trips.find(t => t.id === id);
        if (!item) return;
        AppStorage.updateTripItem(id, { checked: !item.checked, checkTime: !item.checked ? Date.now() : null });
        Utils.toast(item.checked ? '已取消打卡' : '✓ 打卡成功！');
        // 创新点：打卡后检查是否解锁新徽章
        if (!item.checked && typeof Badges !== 'undefined' && Badges.checkNewBadges) {
            setTimeout(() => Badges.checkNewBadges(), 500);
        }
        this.render();
    },

    /**
     * 渲染时间轴视图（创新点：上午/下午/晚上三段式时间轴）
     * 小白理解：把景点按时间段（上午/下午/晚上）分组展示，更像真实行程安排
     *           像看进度条一样，知道自己的行程规划进展
     */
    renderTimelineView(sortedTrips) {
        if (sortedTrips.length === 0) {
            return '<div class="empty-state"><div class="empty-icon">📋</div><div class="empty-text">暂无行程</div></div>';
        }
        // 按城市分组，每个城市内按 visitTime 分到上午/下午/晚上
        const cityGroups = {};
        sortedTrips.forEach(s => {
            const city = s.city || '未分类';
            if (!cityGroups[city]) cityGroups[city] = { morning: [], afternoon: [], evening: [], none: [] };
            const time = (s.visitTime || '').toLowerCase();
            if (time.includes('上午') || time.includes('早上') || time.includes('morning')) {
                cityGroups[city].morning.push(s);
            } else if (time.includes('下午') || time.includes('afternoon')) {
                cityGroups[city].afternoon.push(s);
            } else if (time.includes('晚上') || time.includes('evening') || time.includes('夜')) {
                cityGroups[city].evening.push(s);
            } else {
                cityGroups[city].none.push(s);
            }
        });

        const periods = [
            { key: 'morning', label: '🌅 上午', color: '#faad14' },
            { key: 'afternoon', label: '☀️ 下午', color: '#1890ff' },
            { key: 'evening', label: '🌙 晚上', color: '#722ed1' },
            { key: 'none', label: '📋 待安排', color: '#8c8c8c' }
        ];

        let html = '';
        Object.keys(cityGroups).forEach(city => {
            const cityData = Data.cities.find(c => c.name === city);
            const icon = cityData ? cityData.icon : '📌';
            html += `
                <div class="card" style="padding: 12px; margin-bottom: 12px;">
                    <div style="font-size: 16px; font-weight: 600; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid var(--primary);">
                        ${icon} ${city}
                    </div>
            `;
            periods.forEach(period => {
                const items = cityGroups[city][period.key];
                if (items.length === 0) return;
                html += `
                    <div style="margin-bottom: 12px;">
                        <div style="font-size: 13px; font-weight: 600; color: ${period.color}; margin-bottom: 6px; padding-left: 8px; border-left: 3px solid ${period.color};">
                            ${period.label}（${items.length}）
                        </div>
                        ${items.map(s => `
                            <div class="timeline-item ${s.checked ? 'done' : ''}" data-trip-id="${s.id}" style="display: flex; align-items: start; gap: 8px; padding: 8px; margin-bottom: 4px; background: var(--bg-page); border-radius: 6px; ${s.checked ? 'opacity: 0.6;' : ''}">
                                <div style="font-size: 20px;">${s.icon}</div>
                                <div style="flex: 1;" onclick="Trip.showItemDetail('${s.id}')">
                                    <div style="font-size: 14px; font-weight: 500; ${s.checked ? 'text-decoration: line-through;' : ''}">${s.name}</div>
                                    <div style="font-size: 11px; color: var(--text-secondary);">⭐${s.rating} · ${Utils.formatPrice(s.price)}</div>
                                    ${s.note ? `<div style="font-size: 11px; color: var(--warning); margin-top: 2px; max-height: 18px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">📝 ${Utils.escapeHtml(s.note)}</div>` : ''}
                                </div>
                                <button class="icon-btn" style="font-size: 13px;" onclick="Trip.toggleCheck('${s.id}')">${s.checked ? '✓' : '○'}</button>
                            </div>
                        `).join('')}
                    </div>
                `;
            });
            html += '</div>';
        });
        return html;
    },

    /**
     * 切换视图模式（列表/时间轴）
     */
    switchView(mode) {
        this.viewMode = mode;
        Utils.vibrate(8);
        this.render();
    },

    /**
     * 给行程卡片绑定长按拖动 + 短按弹菜单
     * 小白理解：
     *   - 长按0.4秒后进入拖拽模式，可以上下拖动调整顺序（带振动反馈）
     *   - 拖到目标位置松手，自动交换顺序
     *   - 长按0.8秒以上（没拖动）则弹出操作菜单
     *   - 点击卡片左侧内容区也会弹菜单
     */
    bindTripCardLongPress() {
        const cards = document.querySelectorAll('.trip-item-card[data-trip-id]');
        cards.forEach(card => {
            const tripId = card.getAttribute('data-trip-id');
            if (card._dragBound) return;
            card._dragBound = true;

            let timer = null;          // 长按计时器
            let menuTimer = null;      // 菜单计时器（更长）
            let dragging = false;      // 是否进入拖拽模式
            let menuTriggered = false; // 是否已弹菜单
            let startY = 0;            // 触摸起始Y坐标
            let targetCard = null;     // 拖到目标卡片

            const start = (e) => {
                const touch = e.touches ? e.touches[0] : e;
                startY = touch.clientY;
                dragging = false;
                menuTriggered = false;
                // 0.4秒后进入拖拽模式
                timer = setTimeout(() => {
                    dragging = true;
                    Utils.vibrate([15]);
                    card.style.opacity = '0.6';
                    card.style.transform = 'scale(1.03)';
                    card.style.zIndex = '100';
                    card.style.boxShadow = '0 8px 24px rgba(0,0,0,0.25)';
                    card.style.transition = 'box-shadow 0.2s';
                }, 400);
                // 0.8秒后弹菜单（如果还没开始拖）
                menuTimer = setTimeout(() => {
                    if (!dragging) {
                        menuTriggered = true;
                        triggerMenu();
                    }
                }, 800);
            };

            const move = (e) => {
                // 移动就取消菜单计时（避免误触发）
                if (menuTimer) { clearTimeout(menuTimer); menuTimer = null; }
                if (!dragging) {
                    // 移动距离过大也取消长按
                    if (timer) {
                        const touch = e.touches ? e.touches[0] : e;
                        if (Math.abs(touch.clientY - startY) > 10) {
                            clearTimeout(timer);
                            timer = null;
                        }
                    }
                    return;
                }
                e.preventDefault();
                const touch = e.touches ? e.touches[0] : e;
                const y = touch.clientY;
                // 让卡片跟随手指
                card.style.transform = `scale(1.03) translateY(${y - startY}px)`;
                // 检测当前覆盖到哪个其他卡片
                const others = Array.from(document.querySelectorAll('.trip-item-card[data-trip-id]')).filter(c => c !== card);
                targetCard = null;
                others.forEach(c => {
                    const rect = c.getBoundingClientRect();
                    c.style.transition = 'transform 0.15s';
                    if (y >= rect.top && y <= rect.bottom) {
                        targetCard = c;
                        // 让目标卡片向下/向上让位
                        const cardRect = card.getBoundingClientRect();
                        const cardIdx = Array.from(document.querySelectorAll('.trip-item-card[data-trip-id]')).indexOf(card);
                        const targetIdx = Array.from(document.querySelectorAll('.trip-item-card[data-trip-id]')).indexOf(c);
                        if (targetIdx < cardIdx) {
                            c.style.transform = 'translateY(70px)';
                        } else {
                            c.style.transform = 'translateY(-70px)';
                        }
                    } else {
                        c.style.transform = '';
                    }
                });
            };

            const end = (e) => {
                if (timer) { clearTimeout(timer); timer = null; }
                if (menuTimer) { clearTimeout(menuTimer); menuTimer = null; }
                if (!dragging) return;
                // 重置样式
                card.style.opacity = '';
                card.style.transform = '';
                card.style.zIndex = '';
                card.style.boxShadow = '';
                card.style.transition = '';
                document.querySelectorAll('.trip-item-card[data-trip-id]').forEach(c => {
                    c.style.transform = '';
                    c.style.transition = '';
                });
                // 如果有目标卡片，交换顺序
                if (targetCard) {
                    const targetId = targetCard.getAttribute('data-trip-id');
                    this.swapOrder(tripId, targetId);
                }
                dragging = false;
                targetCard = null;
            };

            // 弹菜单
            const triggerMenu = () => {
                const trips = AppStorage.getTrip();
                const item = trips.find(t => t.id === tripId);
                if (!item) return;
                Utils.showBottomSheet(`${item.icon || '📌'} ${item.name}`, [
                    { icon: '✏️', label: '编辑', action: () => this.editItem(tripId) },
                    { icon: '↑', label: '上移', action: () => this.moveItem(tripId, -1) },
                    { icon: '↓', label: '下移', action: () => this.moveItem(tripId, 1) },
                    { icon: AppStorage.isFavorited(item.name, 'scenic') ? '❌' : '⭐',
                      label: AppStorage.isFavorited(item.name, 'scenic') ? '取消收藏' : '加入收藏',
                      action: () => {
                          const copy = Utils.deepCopy(item);
                          AppStorage.toggleFavorite(copy, 'scenic');
                          Utils.toast('操作成功');
                      } },
                    { icon: '🗑️', label: '删除', danger: true, action: () => this.remove(tripId) }
                ]);
            };

            // 触摸事件
            card.addEventListener('touchstart', start, { passive: true });
            card.addEventListener('touchmove', move, { passive: false });
            card.addEventListener('touchend', end);
            card.addEventListener('touchcancel', end);
            // 鼠标事件（电脑端）
            card.addEventListener('mousedown', (e) => {
                if (e.target.tagName === 'BUTTON') return;  // 点按钮不触发
                start(e);
                const moveHandler = (ev) => move(ev);
                const upHandler = (ev) => {
                    end(ev);
                    document.removeEventListener('mousemove', moveHandler);
                    document.removeEventListener('mouseup', upHandler);
                };
                document.addEventListener('mousemove', moveHandler);
                document.addEventListener('mouseup', upHandler);
            });
        });
    },

    /**
     * 交换两个行程项的顺序
     * 小白理解：拖拽排序时，把两个项的 addTime 互换，这样排序后就交换了位置
     */
    swapOrder(id1, id2) {
        const trips = AppStorage.getTrip();
        const item1 = trips.find(t => t.id === id1);
        const item2 = trips.find(t => t.id === id2);
        if (!item1 || !item2) return;
        const tempTime = item1.addTime;
        AppStorage.updateTripItem(id1, { addTime: item2.addTime });
        AppStorage.updateTripItem(id2, { addTime: tempTime });
        Utils.vibrate([10]);
        Utils.toast('✓ 已调整顺序');
        this.render();
    },

    renderFavorites(content) {
        const favorites = AppStorage.getFavorites();

        content.innerHTML = `
            <div class="filter-bar">
                <button class="filter-btn" onclick="Trip.switchTab('trip')">📋 我的行程</button>
                <button class="filter-btn active">⭐ 我的收藏 (${favorites.length})</button>
            </div>

            ${favorites.length === 0 ? `
                <div class="empty-state">
                    <div class="empty-icon">⭐</div>
                    <div class="empty-text">还没有收藏任何内容</div>
                </div>
            ` : favorites.map(f => `
                <div class="card" style="padding: 12px;">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <div style="flex: 1;">
                            <div style="font-size: 15px; font-weight: 600;">${f.icon || '📌'} ${f.name}</div>
                            <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">
                                ${f.city || ''} · ${f.type === 'scenic' ? '景点' : '美食'}
                            </div>
                        </div>
                        <button class="icon-btn" onclick="Trip.removeFavorite('${f.name}')">✕</button>
                    </div>
                </div>
            `).join('')}
        `;
    },

    sortTrips(list) {
        switch (this.sortBy) {
            case 'city': return list.sort((a, b) => a.city.localeCompare(b.city));
            case 'rating': return list.sort((a, b) => b.rating - a.rating);
            case 'price': return list.sort((a, b) => a.price - b.price);
            default: return list.sort((a, b) => b.addTime - a.addTime);
        }
    },

    sort(type) {
        this.sortBy = type;
        this.render();
    },

    switchTab(tab) {
        this.currentTab = tab;
        this.render();
    },

    /**
     * 移除行程景点
     * 小白理解：删掉后振动 + 更新底部行程Tab的角标数字
     */
    remove(id) {
        // 修复：删除前二次确认，避免误删
        if (!confirm('确定要移除这个景点吗？')) return;
        AppStorage.removeFromTrip(id);
        Utils.toast('已移除');
        Utils.vibrate(10);
        if (typeof App !== 'undefined' && App.updateTabBadge) App.updateTabBadge();
        this.render();
    },

    /**
     * 移动行程项顺序（上移/下移）
     * 小白理解：调整景点在行程中的先后顺序，上移=往前排，下移=往后排
     *           关键：要在排序后的列表里操作，交换 addTime 才能真正改变顺序
     * @param {string} id - 行程项ID
     * @param {number} direction - -1上移，1下移
     */
    moveItem(id, direction) {
        Utils.vibrate(8);
        // 修复：非时间排序时移动按钮无效，因为addTime不影响其他排序
        if (this.sortBy !== 'time') {
            Utils.toast('请切换到"按时间"排序才能调整顺序');
            return;
        }
        const trips = AppStorage.getTrip();
        const sorted = this.sortTrips([...trips]);
        const idx = sorted.findIndex(item => item.id === id);
        if (idx === -1) return;
        const target = idx + direction;
        if (target < 0 || target >= sorted.length) {
            Utils.toast(direction === -1 ? '已经在最前面了' : '已经在最后面了');
            return;
        }
        const currentItem = sorted[idx];
        const targetItem = sorted[target];
        const tempTime = currentItem.addTime;
        AppStorage.updateTripItem(id, { addTime: targetItem.addTime });
        AppStorage.updateTripItem(targetItem.id, { addTime: tempTime });
        this.render();
    },

    /**
     * 编辑行程项（弹窗编辑）
     * 小白理解：点✏️按钮后弹出编辑框，可以修改名称、城市、备注、计划游览时间
     * @param {string} id - 行程项ID
     */
    editItem(id) {
        const trips = AppStorage.getTrip();
        const item = trips.find(t => t.id === id);
        if (!item) return;

        Utils.vibrate(8);
        Utils.showModal(`
            <div style="padding: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <h2 style="font-size: 17px;">✏️ 编辑行程项</h2>
                    <button class="icon-btn" onclick="Utils.closeModal()">✕</button>
                </div>

                <!-- 名称 -->
                <div style="margin-bottom: 12px;">
                    <label style="font-size: 13px; color: var(--text-secondary); display: block; margin-bottom: 4px;">名称</label>
                    <input type="text" id="edit-name" value="${Utils.escapeHtml(item.name)}"
                        style="width: 100%; padding: 10px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-card); color: var(--text-primary); font-size: 14px;">
                </div>

                <!-- 城市 -->
                <div style="margin-bottom: 12px;">
                    <label style="font-size: 13px; color: var(--text-secondary); display: block; margin-bottom: 4px;">城市</label>
                    <input type="text" id="edit-city" value="${Utils.escapeHtml(item.city || '')}"
                        style="width: 100%; padding: 10px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-card); color: var(--text-primary); font-size: 14px;">
                </div>

                <!-- 图标 -->
                <div style="margin-bottom: 12px;">
                    <label style="font-size: 13px; color: var(--text-secondary); display: block; margin-bottom: 4px;">图标</label>
                    <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                        ${['📌', '🏯', '🏔️', '🏖️', '🍜', '🎡', '🛕', '🏰', '🌳', '⛺', '🚆', '✈️'].map(ic => `
                            <button type="button" class="icon-btn edit-icon-btn ${ic === item.icon ? 'selected' : ''}"
                                style="width: 36px; height: 36px; font-size: 18px; border: 1.5px solid ${ic === item.icon ? 'var(--primary)' : 'var(--border-color)'}; border-radius: var(--radius-sm);"
                                onclick="Trip.selectEditIcon('${ic}')">${ic}</button>
                        `).join('')}
                    </div>
                </div>

                <!-- 计划游览时间 -->
                <div style="margin-bottom: 12px;">
                    <label style="font-size: 13px; color: var(--text-secondary); display: block; margin-bottom: 4px;">计划游览时间（可选）</label>
                    <input type="text" id="edit-visit-time" value="${Utils.escapeHtml(item.visitTime || '')}" placeholder="比如：第1天上午"
                        style="width: 100%; padding: 10px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-card); color: var(--text-primary); font-size: 14px;">
                </div>

                <!-- 实际花费（创新点：记录真实开销用于统计） -->
                <div style="margin-bottom: 12px;">
                    <label style="font-size: 13px; color: var(--text-secondary); display: block; margin-bottom: 4px;">💰 实际花费（元，可选）</label>
                    <input type="number" id="edit-actual-cost" value="${item.actualCost != null ? item.actualCost : ''}" placeholder="去过之后填实际花了多少"
                        min="0" step="0.01"
                        style="width: 100%; padding: 10px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-card); color: var(--text-primary); font-size: 14px;">
                </div>

                <!-- 备注 -->
                <div style="margin-bottom: 16px;">
                    <label style="font-size: 13px; color: var(--text-secondary); display: block; margin-bottom: 4px;">备注（可选）</label>
                    <textarea id="edit-note" rows="3" placeholder="写下你想记住的..."
                        style="width: 100%; padding: 10px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-card); color: var(--text-primary); font-size: 14px; resize: none;">${Utils.escapeHtml(item.note || '')}</textarea>
                </div>

                <!-- 操作按钮 -->
                <div style="display: flex; gap: 8px;">
                    <button class="btn btn-default" style="flex: 1;" onclick="Utils.closeModal()">取消</button>
                    <button class="btn btn-primary" style="flex: 1;" onclick="Trip.saveEdit('${id}')">保存</button>
                </div>
            </div>
        `);
    },

    /**
     * 选中编辑弹窗中的图标
     */
    _selectedIcon: null,
    selectEditIcon(icon) {
        this._selectedIcon = icon;
        Utils.vibrate(5);
        // 更新选中状态
        document.querySelectorAll('.edit-icon-btn').forEach(btn => {
            const ic = btn.textContent;
            btn.classList.toggle('selected', ic === icon);
            btn.style.borderColor = ic === icon ? 'var(--primary)' : 'var(--border-color)';
        });
    },

    /**
     * 保存编辑
     * 小白理解：把用户修改的内容保存到本地存储，然后刷新列表
     */
    saveEdit(id) {
        const name = document.getElementById('edit-name').value.trim();
        const city = document.getElementById('edit-city').value.trim();
        const visitTime = document.getElementById('edit-visit-time').value.trim();
        const note = document.getElementById('edit-note').value.trim();
        const icon = this._selectedIcon || null;
        // 读取实际花费（创新点：空值不记录，有值才保存）
        const costInput = document.getElementById('edit-actual-cost');
        const actualCost = costInput ? (costInput.value === '' ? null : parseFloat(costInput.value)) : null;

        if (!name) {
            Utils.toast('名称不能为空');
            return;
        }

        const updates = { name, city, visitTime, note };
        if (icon) updates.icon = icon;
        if (actualCost !== null && !isNaN(actualCost)) {
            updates.actualCost = Math.max(0, actualCost);
        } else {
            updates.actualCost = null;  // 清空已填的花费
        }

        AppStorage.updateTripItem(id, updates);
        Utils.vibrate([10]);
        Utils.toast('✓ 已保存');
        Utils.closeModal();
        this._selectedIcon = null;
        this.render();
    },

    /**
     * 显示自定义添加弹窗
     * 小白理解：点"自定义添加"按钮后，弹窗让用户手动输入行程项
     *           可以添加任何自己想去的地方，不局限于App里的景点库
     */
    showAddCustom() {
        Utils.vibrate(8);
        Utils.showModal(`
            <div style="padding: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <h2 style="font-size: 17px;">➕ 自定义添加行程项</h2>
                    <button class="icon-btn" onclick="Utils.closeModal()">✕</button>
                </div>

                <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 12px; padding: 8px; background: var(--bg-page); border-radius: 6px;">
                    💡 可以添加任何你想去的地方：景点、餐厅、商店、打卡点等
                </div>

                <!-- 名称 -->
                <div style="margin-bottom: 12px;">
                    <label style="font-size: 13px; color: var(--text-secondary); display: block; margin-bottom: 4px;">名称 *</label>
                    <input type="text" id="custom-name" placeholder="比如：XX咖啡馆、XX拍照点"
                        style="width: 100%; padding: 10px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-card); color: var(--text-primary); font-size: 14px;">
                </div>

                <!-- 城市 -->
                <div style="margin-bottom: 12px;">
                    <label style="font-size: 13px; color: var(--text-secondary); display: block; margin-bottom: 4px;">城市 *</label>
                    <input type="text" id="custom-city" placeholder="比如：成都"
                        style="width: 100%; padding: 10px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-card); color: var(--text-primary); font-size: 14px;">
                </div>

                <!-- 图标选择 -->
                <div style="margin-bottom: 12px;">
                    <label style="font-size: 13px; color: var(--text-secondary); display: block; margin-bottom: 4px;">图标</label>
                    <div style="display: flex; gap: 6px; flex-wrap: wrap;" id="custom-icon-list">
                        ${['📌', '🏯', '🏔️', '🏖️', '🍜', '🎡', '🛕', '🏰', '🌳', '⛺', '🚆', '✈️'].map((ic, i) => `
                            <button type="button" class="icon-btn custom-icon-btn ${i === 0 ? 'selected' : ''}"
                                style="width: 36px; height: 36px; font-size: 18px; border: 1.5px solid ${i === 0 ? 'var(--primary)' : 'var(--border-color)'}; border-radius: var(--radius-sm);"
                                onclick="Trip.selectCustomIcon('${ic}')">${ic}</button>
                        `).join('')}
                    </div>
                </div>

                <!-- 价格 -->
                <div style="margin-bottom: 12px;">
                    <label style="font-size: 13px; color: var(--text-secondary); display: block; margin-bottom: 4px;">预估花费（元，可选）</label>
                    <input type="number" id="custom-price" placeholder="0" value="0"
                        style="width: 100%; padding: 10px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-card); color: var(--text-primary); font-size: 14px;">
                </div>

                <!-- 计划游览时间 -->
                <div style="margin-bottom: 12px;">
                    <label style="font-size: 13px; color: var(--text-secondary); display: block; margin-bottom: 4px;">计划游览时间（可选）</label>
                    <input type="text" id="custom-visit-time" placeholder="比如：第2天下午"
                        style="width: 100%; padding: 10px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-card); color: var(--text-primary); font-size: 14px;">
                </div>

                <!-- 备注 -->
                <div style="margin-bottom: 16px;">
                    <label style="font-size: 13px; color: var(--text-secondary); display: block; margin-bottom: 4px;">备注（可选）</label>
                    <textarea id="custom-note" rows="2" placeholder="写下你想记住的..."
                        style="width: 100%; padding: 10px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-card); color: var(--text-primary); font-size: 14px; resize: none;"></textarea>
                </div>

                <!-- 操作按钮 -->
                <div style="display: flex; gap: 8px;">
                    <button class="btn btn-default" style="flex: 1;" onclick="Utils.closeModal()">取消</button>
                    <button class="btn btn-primary" style="flex: 1;" onclick="Trip.addCustomItem()">添加</button>
                </div>
            </div>
        `);
        // 默认选中第一个图标
        this._customIcon = '📌';
    },

    /**
     * 选择自定义添加的图标
     */
    _customIcon: '📌',
    selectCustomIcon(icon) {
        this._customIcon = icon;
        Utils.vibrate(5);
        document.querySelectorAll('.custom-icon-btn').forEach(btn => {
            const ic = btn.textContent;
            btn.classList.toggle('selected', ic === icon);
            btn.style.borderColor = ic === icon ? 'var(--primary)' : 'var(--border-color)';
        });
    },

    /**
     * 添加自定义行程项
     * 小白理解：把用户填的信息保存为一个新的行程项
     */
    addCustomItem() {
        const name = document.getElementById('custom-name').value.trim();
        const city = document.getElementById('custom-city').value.trim();
        const price = parseFloat(document.getElementById('custom-price').value) || 0;
        const visitTime = document.getElementById('custom-visit-time').value.trim();
        const note = document.getElementById('custom-note').value.trim();

        if (!name) {
            Utils.toast('请输入名称');
            return;
        }
        if (!city) {
            Utils.toast('请输入城市');
            return;
        }

        const item = {
            name: name,
            city: city,
            icon: this._customIcon,
            price: price,
            rating: 0,  // 自定义项无评分
            visitTime: visitTime,
            note: note,
            scenic: false  // 不一定是景点
        };

        AppStorage.insertTripItem(item);
        Utils.vibrate([10]);
        Utils.toast('✓ 已添加自定义行程项');
        Utils.closeModal();
        if (typeof App !== 'undefined' && App.updateTabBadge) App.updateTabBadge();
        this.render();
    },

    /**
     * 显示行程项详情
     * 小白理解：点击卡片左侧内容区域，弹出详情查看完整信息
     */
    showItemDetail(id) {
        const trips = AppStorage.getTrip();
        const item = trips.find(t => t.id === id);
        if (!item) return;

        Utils.vibrate(5);
        Utils.showBottomSheet(`${item.icon || '📌'} ${item.name}`, [
            {
                icon: '✏️',
                label: '编辑',
                action: () => this.editItem(id)
            },
            {
                icon: '↑',
                label: '上移',
                action: () => this.moveItem(id, -1)
            },
            {
                icon: '↓',
                label: '下移',
                action: () => this.moveItem(id, 1)
            },
            {
                icon: AppStorage.isFavorited(item.name, 'scenic') ? '❌' : '⭐',
                label: AppStorage.isFavorited(item.name, 'scenic') ? '取消收藏' : '加入收藏',
                action: () => {
                    const copy = Utils.deepCopy(item);
                    AppStorage.toggleFavorite(copy, 'scenic');
                    Utils.toast(AppStorage.isFavorited(item.name, 'scenic') ? '已取消收藏' : '✓ 已收藏');
                    // 修复：收藏后重新渲染菜单，更新按钮状态
                    Utils.closeModal();
                    setTimeout(() => this.showItemDetail(id), 100);
                }
            },
            {
                icon: '🗑️',
                label: '删除',
                danger: true,
                action: () => this.remove(id)
            }
        ]);
    },

    removeFavorite(name) {
        const fav = AppStorage.getFavorites().find(f => f.name === name);
        if (fav) {
            AppStorage.toggleFavorite(fav, fav.type);
            Utils.toast('已取消收藏');
            this.render();
        }
    },

    generatePlan() {
        const trips = AppStorage.getTrip();
        if (trips.length === 0) {
            Utils.toast('请先添加景点');
            return;
        }

        // 按城市分组
        const cityGroups = {};
        trips.forEach(t => {
            if (!cityGroups[t.city]) cityGroups[t.city] = [];
            cityGroups[t.city].push(t);
        });

        // 生成行程：每天2个景点，上午9:00出发，下午14:00出发
        let day = 1;
        let html = `
            <div style="padding: 20px; max-height: 80vh; overflow-y: auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <h2 style="font-size: 18px;">✨ 智能行程安排</h2>
                    <button class="icon-btn" onclick="Utils.closeModal()">✕</button>
                </div>
                <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 16px; padding: 8px; background: var(--bg-page); border-radius: 6px;">
                    💡 行程按城市分组，每天安排2个景点（上午+下午），含开放时间、交通方式和附近美食推荐
                </div>
        `;

        Object.keys(cityGroups).forEach(city => {
            const scenics = cityGroups[city];
            const weather = Data.getWeather(city);
            const days = Math.ceil(scenics.length / 2);

            html += `
                <div style="background: var(--bg-page); border-radius: 8px; padding: 12px; margin-bottom: 12px;">
                    <div style="font-size: 15px; font-weight: 600; margin-bottom: 4px;">📍 ${city} (${days}天)</div>
                    ${weather ? `<div style="font-size: 12px; color: var(--text-secondary);">🌤️ ${weather.current.temp}° ${weather.current.desc} - ${weather.advice}</div>` : ''}
                </div>
            `;

            for (let i = 0; i < scenics.length; i += 2) {
                const morning = scenics[i];
                const afternoon = scenics[i + 1];

                html += `
                    <div class="card" style="padding: 12px; margin-bottom: 12px;">
                        <div style="font-size: 14px; font-weight: 600; margin-bottom: 10px; color: var(--primary);">
                            📅 第${day}天 · ${city}
                        </div>

                        <!-- 上午行程 -->
                        <div style="border-left: 3px solid var(--warning); padding-left: 12px; margin-bottom: 12px;">
                            <div style="font-size: 13px; font-weight: 600; margin-bottom: 4px;">
                                🌅 09:00 - 12:00 · 上午
                            </div>
                            <div style="font-size: 15px; font-weight: 600; margin-bottom: 4px;">
                                ${morning.icon} ${morning.name}
                            </div>
                            <div style="font-size: 12px; color: var(--text-secondary); line-height: 1.8;">
                                ⭐ ${morning.rating} · 💰 ${Utils.formatPrice(morning.price)}<br>
                                🕐 开放时间：${morning.openTime || '全天'}<br>
                                🚌 交通：${morning.transport || '待查询'}<br>
                                📝 ${morning.desc || ''}
                            </div>
                            ${morning.restaurants && morning.restaurants.length > 0 ? `
                                <div style="font-size: 11px; color: var(--text-secondary); margin-top: 6px; padding: 6px 8px; background: var(--bg-page); border-radius: 4px;">
                                    🍽️ 午餐推荐：${morning.restaurants[0].name}（${morning.restaurants[0].cuisine}·${Utils.formatPrice(morning.restaurants[0].price)}·${morning.restaurants[0].distance}）
                                </div>
                            ` : ''}
                        </div>

                        <!-- 下午行程 -->
                        ${afternoon ? `
                            <div style="border-left: 3px solid var(--success); padding-left: 12px;">
                                <div style="font-size: 13px; font-weight: 600; margin-bottom: 4px;">
                                    🌇 14:00 - 17:30 · 下午
                                </div>
                                <div style="font-size: 15px; font-weight: 600; margin-bottom: 4px;">
                                    ${afternoon.icon} ${afternoon.name}
                                </div>
                                <div style="font-size: 12px; color: var(--text-secondary); line-height: 1.8;">
                                    ⭐ ${afternoon.rating} · 💰 ${Utils.formatPrice(afternoon.price)}<br>
                                    🕐 开放时间：${afternoon.openTime || '全天'}<br>
                                    🚌 交通：${afternoon.transport || '待查询'}<br>
                                    📝 ${afternoon.desc || ''}
                                </div>
                                ${afternoon.restaurants && afternoon.restaurants.length > 0 ? `
                                    <div style="font-size: 11px; color: var(--text-secondary); margin-top: 6px; padding: 6px 8px; background: var(--bg-page); border-radius: 4px;">
                                        🍽️ 晚餐推荐：${afternoon.restaurants[0].name}（${afternoon.restaurants[0].cuisine}·${Utils.formatPrice(afternoon.restaurants[0].price)}·${afternoon.restaurants[0].distance}）
                                    </div>
                                ` : ''}
                            </div>
                        ` : `
                            <div style="border-left: 3px solid var(--info); padding-left: 12px;">
                                <div style="font-size: 13px; color: var(--text-secondary);">
                                    🌇 下午：自由活动时间，可逛逛周边或休息
                                </div>
                            </div>
                        `}
                    </div>
                `;
                day++;
            }
        });

        html += `
                <div style="display: flex; gap: 8px; margin-top: 16px;">
                    <button class="btn btn-default" style="flex: 1;" onclick="Utils.closeModal()">关闭</button>
                    <button class="btn btn-primary" style="flex: 1;" onclick="Utils.toast('行程已保存')">保存行程</button>
                </div>
            </div>
        `;

        Utils.showModal(html);
    },

    /**
     * 生成出行方案：跳转到出行页，自动从行程导入目的地
     * 小白理解：用户在行程页点这个按钮，自动跳到出行页，
     *           目的地已经填好了（从行程里的景点城市自动提取），
     *           用户只需要输入出发地就行
     */
    generateTravelPlan() {
        const trips = AppStorage.getTrip();
        if (trips.length === 0) {
            Utils.toast('请先添加景点');
            return;
        }

        // 从行程提取目的地城市
        const cities = [...new Set(trips.map(t => t.city))];
        if (cities.length === 0) {
            Utils.toast('未能获取目的地城市');
            return;
        }

        // 创新点：自动填充出发地（从当前旅程获取，不用用户再填一次）
        const journey = AppStorage.getActiveJourney();
        const departure = journey ? journey.departure : '';

        // 把城市填入 Travel 模块的站点（出发地自动填充）
        Travel.stations = [departure, ...cities];
        Travel._planGenerated = false;

        // 切换到出行 Tab
        Utils.switchTab('travel');

        // 关键：切换Tab后手动更新出行页的站点列表和结果区
        // 因为 Utils.switchTab 只切换CSS，不会触发 onShow
        const list = document.getElementById('stations-list');
        if (list) {
            list.innerHTML = Travel.renderStations();
        }
        const resultArea = document.getElementById('travel-result-area');
        if (resultArea) {
            resultArea.innerHTML = Travel.renderResultArea();
        }

        // 手动更新行程提示和导入按钮（模拟 onShow 中的部分逻辑）
        const tripCities = Travel.getTripCities();
        const hasTripCities = tripCities.length > 0;
        const importBtnArea = document.getElementById('travel-import-btn-area');
        if (importBtnArea) {
            importBtnArea.innerHTML = hasTripCities ? `
                <button class="btn btn-primary" style="font-size: 12px; padding: 4px 10px;" onclick="Travel.importFromTrip()">
                    📋 从行程导入目的地
                </button>
            ` : '';
        }

        // 设置日期默认值
        const dateInput = document.getElementById('travel-date-input');
        if (dateInput && !dateInput.value) {
            dateInput.value = Utils.formatDate(new Date());
            Travel._startDate = dateInput.value;
        }

        // 提示用户输入出发地
        Utils.toast('已自动填入目的地，请输入出发地');

        // 自动聚焦到出发地输入框
        setTimeout(() => {
            const firstInput = document.querySelector('#travel-content input[type="text"]');
            if (firstInput) firstInput.focus();
        }, 300);
    },

    onShow() {
        this.render();  // 每次切换到行程页刷新数据
    }
};
