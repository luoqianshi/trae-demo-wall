/* ============================================ */
/* journey.js - 旅程管理模块                    */
/* 作用：管理用户的"一次旅行"概念                */
/* 小白理解：用户每次想出去玩，就开启一段旅程，  */
/*           填好出发地和想去的城市，App帮你规划  */
/*           旅行结束后可以开启下一次旅程         */
/* ============================================ */

window.Journey = {

    /**
     * 初始化（App启动时调用）
     * 小白理解：App刚打开时检查一下用户有没有正在进行的旅程
     *           - 有 → 直接进首页，显示旅程内容
     *           - 没有 → 弹窗问"准备好开启一段旅行了么？"
     */
    init() {
        // 延迟一下，等首页渲染完成再判断
        setTimeout(() => {
            this.checkOnStartup();
        }, 600);
    },

    /**
     * 启动时检查：是否需要弹窗引导
     * 小白理解：
     *   - 如果有正在进行的旅程 → 不弹窗，直接显示
     *   - 如果没有旅程 + 没跳过 → 弹窗"开启旅行"
     *   - 如果用户之前点了"跳过" → 不弹窗（除非主动开启）
     */
    checkOnStartup() {
        const active = AppStorage.getActiveJourney();

        if (active) {
            // 有进行中的旅程，刷新首页显示
            this.refreshHome();
            return;
        }

        // 没有进行中的旅程，检查是否跳过过引导
        if (AppStorage.getJourneySkipped()) {
            // 用户之前跳过了，不弹窗
            return;
        }

        // 首次或未跳过 → 弹窗引导
        this.showWelcomeDialog();
    },

    /**
     * 显示欢迎弹窗："你准备好开启一段旅行了么？"
     * 小白理解：App刚打开时弹出的引导框，让用户填出发地和想去的城市
     */
    showWelcomeDialog() {
        const journeyCount = AppStorage.getJourneyCount();
        const isFirst = journeyCount === 0;
        // 第一次说"开启一段旅行"，之后说"开启你的第N次旅行"
        const title = isFirst
            ? '✈️ 你准备好开启一段旅行了么？'
            : `✈️ 准备好开启你的第 ${journeyCount + 1} 次旅行了么？`;
        const subtitle = isFirst
            ? '告诉我们你的出发地和想去的城市，我们来帮你规划'
            : '上一次旅行已结束，开启新的旅程吧！';

        // 默认出发地：北京，默认城市列表用于快捷选择
        // 创新点：最近选择过的城市排到前面
        const recentCities = AppStorage.get('recentJourneyCities') || [];
        const recentSet = new Set(recentCities);
        const recentData = recentCities.map(name => Data.cities.find(c => c.name === name)).filter(Boolean);
        const otherData = Data.cities.filter(c => !recentSet.has(c.name));

        const cityOptions = [
            ...recentData.map(c => `<label class="journey-city-checkbox" data-city="${c.name}" style="border-color: var(--primary); background: rgba(24,144,255,0.05);">
                <span>${c.icon} ${c.name} <span style="font-size: 10px; color: var(--primary);">最近</span></span>
            </label>`),
            ...otherData.map(c => `<label class="journey-city-checkbox" data-city="${c.name}">
                <span>${c.icon} ${c.name}</span>
            </label>`)
        ].join('');

        Utils.showModal(`
            <div style="padding: 20px; max-height: 85vh; overflow-y: auto;">
                <!-- 标题 -->
                <div style="text-align: center; margin-bottom: 16px;">
                    <div style="font-size: 42px; margin-bottom: 8px;">🌍</div>
                    <h2 style="font-size: 17px; line-height: 1.4;">${title}</h2>
                    <p style="font-size: 12px; color: var(--text-secondary); margin-top: 6px;">${subtitle}</p>
                </div>

                <!-- 出发地输入 -->
                <div style="margin-bottom: 16px;">
                    <label style="font-size: 13px; color: var(--text-regular); display: block; margin-bottom: 6px;">
                        🏠 你的出发地
                    </label>
                    <input type="text" id="journey-departure" placeholder="比如：北京"
                        value=""
                        style="width: 100%; padding: 10px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-card); color: var(--text-primary); font-size: 14px;">
                </div>

                <!-- 想去的城市（多选） -->
                <div style="margin-bottom: 16px;">
                    <label style="font-size: 13px; color: var(--text-regular); display: block; margin-bottom: 6px;">
                        📍 想去的城市（可多选）
                    </label>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px;" id="journey-city-list">
                        ${cityOptions}
                    </div>
                    <!-- 自定义城市输入 -->
                    <input type="text" id="journey-custom-city" placeholder="或输入其他城市名，回车添加"
                        style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-card); color: var(--text-primary); font-size: 13px; margin-top: 8px;"
                        onkeydown="if(event.key==='Enter'){Journey.addCustomCity();}">
                </div>

                <!-- 已选城市显示区 -->
                <div id="journey-selected-cities" style="margin-bottom: 16px; min-height: 32px; padding: 8px; background: var(--bg-page); border-radius: var(--radius-md);">
                    <div style="font-size: 12px; color: var(--text-placeholder);">未选择城市</div>
                </div>

                <!-- 操作按钮 -->
                <div style="display: flex; gap: 8px;">
                    <button class="btn btn-default" style="flex: 1;" onclick="Journey.skipWelcome()">
                        跳过
                    </button>
                    <button class="btn btn-primary" style="flex: 2;" onclick="Journey.startJourney()">
                        🚀 开启旅程
                    </button>
                </div>
            </div>

            <style>
                /* 城市选项卡片样式（点击切换选中状态） */
                .journey-city-checkbox {
                    display: inline-flex;
                    align-items: center;
                    padding: 8px 14px;
                    border: 1.5px solid var(--border-color);
                    border-radius: var(--radius-full);
                    font-size: 13px;
                    cursor: pointer;
                    transition: all 0.15s ease;
                    user-select: none;
                }
                .journey-city-checkbox.selected {
                    border-color: var(--primary);
                    background: rgba(24,144,255,0.1);
                    color: var(--primary);
                }
                .journey-city-checkbox:active {
                    transform: scale(0.95);
                }
                /* 自定义添加的城市标签 */
                .journey-custom-tag {
                    display: inline-flex;
                    align-items: center;
                    padding: 8px 14px;
                    border: 1.5px solid var(--primary);
                    background: rgba(24,144,255,0.1);
                    color: var(--primary);
                    border-radius: var(--radius-full);
                    font-size: 13px;
                    cursor: pointer;
                }
            </style>
        `);

        // 绑定城市选项点击事件（点击切换选中状态）
        document.querySelectorAll('.journey-city-checkbox').forEach(el => {
            el.addEventListener('click', () => {
                Utils.vibrate(5);
                el.classList.toggle('selected');
                this.updateSelectedCities();
            });
        });
    },

    /**
     * 添加自定义城市（输入框回车时调用）
     */
    addCustomCity() {
        const input = document.getElementById('journey-custom-city');
        const cityName = input.value.trim();
        if (!cityName) return;

        // 检查是否已存在
        const existing = document.querySelector(`.journey-city-checkbox[data-city="${cityName}"]`);
        if (existing && existing.classList.contains('selected')) {
            Utils.toast('已选择该城市');
            return;
        }
        if (existing) {
            // 已存在但未选中，直接选中
            existing.classList.add('selected');
        } else {
            // 不存在，添加新标签
            const list = document.getElementById('journey-city-list');
            const tag = document.createElement('label');
            tag.className = 'journey-city-checkbox selected';
            tag.setAttribute('data-city', cityName);
            tag.innerHTML = `<span>📌 ${cityName}</span>`;
            tag.addEventListener('click', function() {
                this.classList.toggle('selected');
                Journey.updateSelectedCities();
            });
            list.appendChild(tag);
        }

        input.value = '';
        this.updateSelectedCities();
        Utils.vibrate(5);
    },

    /**
     * 更新已选城市显示区
     */
    updateSelectedCities() {
        const selected = document.querySelectorAll('.journey-city-checkbox.selected');
        const display = document.getElementById('journey-selected-cities');
        if (!display) return;

        if (selected.length === 0) {
            display.innerHTML = '<div style="font-size: 12px; color: var(--text-placeholder);">未选择城市</div>';
        } else {
            const cities = Array.from(selected).map(el => el.getAttribute('data-city'));
            display.innerHTML = `
                <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">已选 ${cities.length} 个城市：</div>
                <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                    ${cities.map(c => `<span style="padding: 3px 10px; background: var(--primary); color: #fff; border-radius: var(--radius-full); font-size: 12px;">${c}</span>`).join('')}
                </div>
            `;
        }
    },

    /**
     * 跳过欢迎弹窗
     * 修复：不再永久跳过，下次打开App仍会提示（避免死锁）
     * 只在本次会话内跳过，不写入localStorage
     */
    skipWelcome() {
        Utils.closeModal();
        Utils.toast('已跳过，下次打开会再次提示');
    },

    /**
     * 开启旅程（用户点击"开启旅程"按钮时调用）
     * 小白理解：把用户填的出发地和城市保存下来，标记为"进行中的旅程"
     */
    startJourney() {
        const departure = document.getElementById('journey-departure').value.trim();
        const selected = document.querySelectorAll('.journey-city-checkbox.selected');
        const cities = Array.from(selected).map(el => el.getAttribute('data-city'));

        // 验证
        if (!departure) {
            Utils.toast('请输入出发地');
            Utils.vibrate([10, 30, 10]);
            return;
        }
        if (cities.length === 0) {
            Utils.toast('请至少选择一个想去的城市');
            Utils.vibrate([10, 30, 10]);
            return;
        }

        // 创建旅程对象
        const journeyCount = AppStorage.incrementJourneyCount();
        const journey = {
            id: Utils.generateId(),
            number: journeyCount,           // 第几次旅行
            departure: departure,            // 出发地
            cities: cities,                  // 想去的城市列表
            createTime: Date.now(),          // 创建时间
            status: 'active',                // 状态：进行中
            visitedCities: []                // 已访问的城市（用于进度展示）
        };

        // 保存
        AppStorage.setActiveJourney(journey);
        AppStorage.setJourneySkipped(false);  // 重置跳过状态

        // 记住最近选择过的城市（创新点：下次选城市时排到前面）
        let recent = AppStorage.get('recentJourneyCities') || [];
        cities.forEach(c => {
            recent = recent.filter(r => r !== c);
            recent.unshift(c);
        });
        recent = recent.slice(0, 6);  // 只记住最近6个
        AppStorage.set('recentJourneyCities', recent);

        Utils.closeModal();
        Utils.vibrate([15, 30, 15]);  // 开启旅程的振动反馈
        Utils.toast(`🎉 第${journeyCount}次旅程已开启！`);

        // 刷新首页显示旅程内容
        setTimeout(() => {
            this.refreshHome();
        }, 300);
    },

    /**
     * 刷新首页，显示当前旅程的城市横向滑动卡片
     * 小白理解：把用户选择的城市以卡片形式显示在首页，可以左右滑动切换城市
     */
    refreshHome() {
        if (typeof Home !== 'undefined' && Home.renderJourneyHome) {
            Home.renderJourneyHome();
        }
    },

    /**
     * 获取当前旅程
     */
    getActive() {
        return AppStorage.getActiveJourney();
    },

    /**
     * 添加城市到当前旅程
     * 小白理解：用户在首页点"添加城市"按钮，输入城市名后加到当前旅程
     * @param {string} cityName - 城市名
     */
    addCity(cityName) {
        const journey = AppStorage.getActiveJourney();
        if (!journey) {
            Utils.toast('请先开启一段旅程');
            return;
        }
        if (journey.cities.includes(cityName)) {
            Utils.toast('该城市已在旅程中');
            return;
        }
        journey.cities.push(cityName);
        AppStorage.setActiveJourney(journey);
        Utils.toast(`✓ 已添加 ${cityName}`);
        Utils.vibrate([10]);
        this.refreshHome();
    },

    /**
     * 从当前旅程移除城市
     * @param {string} cityName - 城市名
     */
    removeCity(cityName) {
        const journey = AppStorage.getActiveJourney();
        if (!journey) return;
        journey.cities = journey.cities.filter(c => c !== cityName);
        AppStorage.setActiveJourney(journey);
        Utils.toast(`已移除 ${cityName}`);
        Utils.vibrate(8);
        this.refreshHome();
    },

    /**
     * 修改出发地
     * @param {string} departure - 新的出发地
     */
    updateDeparture(departure) {
        const journey = AppStorage.getActiveJourney();
        if (!journey) return;
        journey.departure = departure;
        AppStorage.setActiveJourney(journey);
        Utils.toast('出发地已更新');
        this.refreshHome();
    },

    /**
     * 结束当前旅程
     * 小白理解：用户旅行回来了，点"结束旅程"，App把这次旅程存到历史记录里
     *           下次打开App又会弹窗"开启你的第N+1次旅行"
     *           结束时询问是否清空行程列表，避免下次旅行混着旧数据
     */
    endJourney() {
        const journey = AppStorage.getActiveJourney();
        if (!journey) {
            Utils.toast('当前没有进行中的旅程');
            return;
        }

        if (!confirm('确定要结束本次旅程吗？结束后可在历史中查看。')) return;

        // 创新点：询问是否清空行程列表
        const tripList = AppStorage.getTrip();
        let clearTrip = false;
        if (tripList.length > 0) {
            clearTrip = confirm(`检测到行程列表中还有 ${tripList.length} 个景点。\n\n是否清空行程列表？（保留的话下次旅行会继续显示）`);
            if (clearTrip) {
                AppStorage.setTrip([]);
                if (typeof App !== 'undefined' && App.updateTabBadge) App.updateTabBadge();
            }
        }

        // 收集旅程回忆数据（日记、打卡记录等）
        const travelPlan = AppStorage.getTravelPlan();
        const memories = {
            tripItems: clearTrip ? tripList : AppStorage.getTrip(),
            travelPlan: travelPlan,
            packingList: AppStorage.get('packingList') || {}
        };
        journey.memories = memories;

        // 标记为已结束
        journey.status = 'ended';
        journey.endTime = Date.now();

        // 保存到历史
        AppStorage.addJourneyHistory(journey);
        // 清除进行中
        AppStorage.clearActiveJourney();

        // 修复：清除旧出行方案，避免污染下一次旅程
        AppStorage.saveTravelPlan(null);
        if (typeof Travel !== 'undefined') {
            Travel._dailyPlans = [];
            Travel._planGenerated = false;
            Travel.stations = ['', ''];
        }

        Utils.vibrate([15, 50, 15]);
        Utils.toast('👋 旅程已结束，期待下一次出发！');
        Utils.closeModal();

        // 创新点：结束旅程后检查新徽章
        if (typeof Badges !== 'undefined' && Badges.checkNewBadges) {
            setTimeout(() => Badges.checkNewBadges(), 800);
        }

        // 刷新首页（回到无旅程状态）
        setTimeout(() => {
            if (typeof Home !== 'undefined' && Home.renderInit) {
                Home.renderInit();
            }
        }, 300);
    },

    /**
     * 显示旅程管理弹窗（在设置中调用）
     * 小白理解：进入App后想修改旅程信息，从设置里打开这个管理界面
     */
    showManage() {
        const active = AppStorage.getActiveJourney();
        const history = AppStorage.getJourneyHistory();
        const count = AppStorage.getJourneyCount();

        Utils.showModal(`
            <div style="padding: 20px; max-height: 85vh; overflow-y: auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 style="font-size: 18px;">🧳 旅程管理</h2>
                    <button class="icon-btn" onclick="Utils.closeModal()">✕</button>
                </div>

                ${active ? `
                    <!-- 当前进行中的旅程 -->
                    <div style="background: linear-gradient(135deg, rgba(24,144,255,0.1), rgba(82,196,26,0.1)); border-radius: var(--radius-md); padding: 14px; margin-bottom: 16px;">
                        <div style="font-size: 14px; font-weight: 600; margin-bottom: 8px; color: var(--primary);">
                            ✈️ 第${active.number}次旅程（进行中）
                        </div>
                        <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 4px;">
                            🏠 出发地：${active.departure}
                        </div>
                        <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 4px;">
                            📍 城市：${active.cities.join(' → ')}
                        </div>
                        <div style="font-size: 11px; color: var(--text-placeholder); margin-top: 6px;">
                            开始于 ${Utils.timeAgo(active.createTime)}
                        </div>

                        <!-- 操作按钮 -->
                        <div style="display: flex; gap: 8px; margin-top: 12px;">
                            <button class="btn btn-default" style="flex: 1; font-size: 12px;" onclick="Journey.editDeparture()">
                                ✏️ 出发地
                            </button>
                            <button class="btn btn-default" style="flex: 1; font-size: 12px;" onclick="Journey.showCityManager()">
                                🏙️ 城市
                            </button>
                            <button class="btn btn-danger" style="flex: 1; font-size: 12px;" onclick="Journey.endJourney()">
                                🏁 结束
                            </button>
                        </div>
                    </div>
                ` : `
                    <!-- 没有进行中的旅程 -->
                    <div style="text-align: center; padding: 20px; background: var(--bg-page); border-radius: var(--radius-md); margin-bottom: 16px;">
                        <div style="font-size: 36px; margin-bottom: 8px;">🗺️</div>
                        <div style="font-size: 14px; color: var(--text-secondary); margin-bottom: 12px;">
                            当前没有进行中的旅程
                        </div>
                        <button class="btn btn-primary" onclick="Utils.closeModal();Journey.showWelcomeDialog()">
                            🚀 开启新旅程
                        </button>
                    </div>
                `}

                <!-- 旅行足迹地图入口（创新点：可视化展示去过的城市） -->
                <button class="btn btn-default" style="width: 100%; margin-bottom: 12px; padding: 12px; font-size: 14px; border: 1.5px dashed var(--primary); color: var(--primary);" onclick="Journey.showFootprintMap()">
                    🧭 旅行足迹
                </button>

                <!-- 历史旅程 -->
                <div style="margin-top: 16px;">
                    <div style="font-size: 14px; font-weight: 600; margin-bottom: 10px;">
                        📚 历史旅程 (${history.length})
                    </div>
                    ${history.length === 0 ? `
                        <div style="font-size: 12px; color: var(--text-placeholder); text-align: center; padding: 16px;">
                            还没有历史旅程记录
                        </div>
                    ` : history.slice().reverse().map((j, ridx) => `
                        <div style="padding: 10px; background: var(--bg-page); border-radius: var(--radius-sm); margin-bottom: 8px;">
                            <div style="font-size: 13px; font-weight: 600;">
                                第${j.number}次旅程
                                <span style="font-size: 11px; color: var(--text-placeholder); font-weight: normal;">
                                    ${Utils.formatDate(new Date(j.createTime))}
                                </span>
                            </div>
                            <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">
                                ${j.departure} → ${j.cities.join(' → ')}
                            </div>
                            ${j.memories ? `
                                <button class="btn btn-primary" style="width: 100%; margin-top: 8px; font-size: 12px; padding: 6px;" onclick="Journey.showMemoryBook(${history.length - 1 - ridx})">
                                    📖 查看回忆册
                                </button>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `);
    },

    /**
     * 显示旅程回忆册（创新点：结束旅程后生成精美回忆页面）
     * 小白理解：把这次旅行的所有记忆整理成一本"电子相册"
     *           包括去过的城市、打卡的景点、实际花费、行李准备情况等
     * @param {number} idx - 历史旅程索引
     */
    showMemoryBook(idx) {
        const history = AppStorage.getJourneyHistory();
        const journey = history[idx];
        if (!journey || !journey.memories) {
            Utils.toast('该旅程没有回忆数据');
            return;
        }

        const m = journey.memories;
        const tripItems = m.tripItems || [];
        const checkedItems = tripItems.filter(t => t.checked);
        const totalCost = tripItems.reduce((sum, t) => sum + (t.actualCost || 0), 0);
        const plannedCost = tripItems.reduce((sum, t) => sum + (t.price || 0), 0);

        // 行李清单统计
        const packing = m.packingList || {};
        const packingNames = Object.keys(packing);
        const packedCount = packingNames.filter(n => packing[n]).length;

        // 出行方案天数
        const plan = m.travelPlan;
        const planDays = plan && plan.dailyPlans ? plan.dailyPlans.length : 0;

        // 计算旅行天数
        const startDay = new Date(journey.createTime);
        const endDay = new Date(journey.endTime);
        const tripDays = Math.max(1, Math.ceil((endDay - startDay) / (1000 * 60 * 60 * 24)));

        Utils.vibrate([10, 30, 10]);
        Utils.showModal(`
            <div style="padding: 0; max-height: 85vh; overflow-y: auto; border-radius: var(--radius-lg);">
                <!-- 回忆册封面 -->
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; padding: 28px 20px; text-align: center; border-radius: var(--radius-lg) var(--radius-lg) 0 0;">
                    <div style="font-size: 40px; margin-bottom: 8px;">📚</div>
                    <div style="font-size: 20px; font-weight: 700;">第${journey.number}次旅程回忆册</div>
                    <div style="font-size: 12px; opacity: 0.85; margin-top: 6px;">
                        ${Utils.formatDate(startDay)} - ${Utils.formatDate(endDay)} · 共${tripDays}天
                    </div>
                </div>

                <div style="padding: 20px;">
                    <!-- 旅程概览 -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 20px;">
                        <div style="background: var(--bg-page); border-radius: var(--radius-sm); padding: 10px; text-align: center;">
                            <div style="font-size: 22px; font-weight: 700; color: var(--primary);">${journey.cities.length}</div>
                            <div style="font-size: 11px; color: var(--text-secondary);">个城市</div>
                        </div>
                        <div style="background: var(--bg-page); border-radius: var(--radius-sm); padding: 10px; text-align: center;">
                            <div style="font-size: 22px; font-weight: 700; color: var(--success);">${checkedItems.length}/${tripItems.length}</div>
                            <div style="font-size: 11px; color: var(--text-secondary);">打卡景点</div>
                        </div>
                        <div style="background: var(--bg-page); border-radius: var(--radius-sm); padding: 10px; text-align: center;">
                            <div style="font-size: 22px; font-weight: 700; color: var(--warning);">¥${totalCost.toFixed(0)}</div>
                            <div style="font-size: 11px; color: var(--text-secondary);">实际花费</div>
                        </div>
                    </div>

                    <!-- 旅行路线 -->
                    <div style="margin-bottom: 20px;">
                        <div style="font-size: 14px; font-weight: 600; margin-bottom: 10px;">🗺️ 旅行路线</div>
                        <div style="background: var(--bg-page); border-radius: var(--radius-sm); padding: 12px;">
                            <div style="font-size: 13px; line-height: 2;">
                                <span style="color: var(--text-secondary);">🏠 ${journey.departure}</span>
                                ${journey.cities.map(c => `
                                    <span style="color: var(--text-placeholder);"> → </span>
                                    <span style="color: var(--primary); font-weight: 600;">📍 ${c}</span>
                                `).join('')}
                            </div>
                        </div>
                    </div>

                    <!-- 打卡景点 -->
                    ${tripItems.length > 0 ? `
                        <div style="margin-bottom: 20px;">
                            <div style="font-size: 14px; font-weight: 600; margin-bottom: 10px;">✅ 打卡记录</div>
                            <div style="background: var(--bg-page); border-radius: var(--radius-sm); padding: 10px;">
                                ${tripItems.map(t => `
                                    <div style="display: flex; align-items: center; padding: 6px 0; border-bottom: 1px solid var(--divider-color); font-size: 13px;">
                                        <span style="font-size: 16px; margin-right: 6px;">${t.checked ? '✅' : '⬜'}</span>
                                        <span style="flex: 1; ${t.checked ? '' : 'color: var(--text-placeholder);'}">${t.icon || '📌'} ${t.name}</span>
                                        <span style="font-size: 11px; color: var(--text-secondary);">${t.city || ''}</span>
                                        ${t.actualCost ? `<span style="font-size: 11px; color: var(--success); margin-left: 6px;">¥${t.actualCost}</span>` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}

                    <!-- 花费对比 -->
                    ${tripItems.length > 0 ? `
                        <div style="margin-bottom: 20px;">
                            <div style="font-size: 14px; font-weight: 600; margin-bottom: 10px;">💰 花费回顾</div>
                            <div style="background: var(--bg-page); border-radius: var(--radius-sm); padding: 12px;">
                                <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px;">
                                    <span style="color: var(--text-secondary);">预算：¥${plannedCost}</span>
                                    <span style="color: var(--text-secondary);">实际：¥${totalCost.toFixed(1)}</span>
                                </div>
                                <div style="height: 8px; background: var(--divider-color); border-radius: 4px; overflow: hidden;">
                                    <div style="height: 100%; width: ${Math.min(100, (totalCost / Math.max(plannedCost, 1)) * 100)}%; background: ${totalCost > plannedCost ? 'var(--danger)' : 'var(--success)'}; border-radius: 4px;"></div>
                                </div>
                                <div style="font-size: 12px; margin-top: 6px; color: ${totalCost > plannedCost ? 'var(--danger)' : 'var(--success)'};">
                                    ${totalCost > plannedCost ? `超出预算 ¥${(totalCost - plannedCost).toFixed(1)}` : `节省 ¥${(plannedCost - totalCost).toFixed(1)}`}
                                </div>
                            </div>
                        </div>
                    ` : ''}

                    <!-- 行李准备 -->
                    ${packingNames.length > 0 ? `
                        <div style="margin-bottom: 20px;">
                            <div style="font-size: 14px; font-weight: 600; margin-bottom: 10px;">🧳 行李准备 (${packedCount}/${packingNames.length})</div>
                            <div style="background: var(--bg-page); border-radius: var(--radius-sm); padding: 10px; display: flex; flex-wrap: wrap; gap: 6px;">
                                ${packingNames.map(n => `
                                    <span style="font-size: 12px; padding: 3px 8px; border-radius: 10px; ${packing[n] ? 'background: var(--success); color: #fff;' : 'background: var(--divider-color); color: var(--text-placeholder);'}">
                                        ${packing[n] ? '✓' : '○'} ${n}
                                    </span>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}

                    <!-- 出行方案 -->
                    ${planDays > 0 ? `
                        <div style="margin-bottom: 20px;">
                            <div style="font-size: 14px; font-weight: 600; margin-bottom: 10px;">📅 出行方案 (${planDays}天)</div>
                            <div style="background: var(--bg-page); border-radius: var(--radius-sm); padding: 10px;">
                                ${plan.dailyPlans.map((d, i) => `
                                    <div style="font-size: 12px; padding: 4px 0; color: var(--text-secondary);">
                                        <span style="color: var(--primary); font-weight: 600;">第${i + 1}天</span> · ${d.from || '?'} → ${d.to || '?'}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}

                    <!-- 底部感言 -->
                    <div style="text-align: center; padding: 16px; background: linear-gradient(135deg, rgba(102,126,234,0.08), rgba(118,75,162,0.08)); border-radius: var(--radius-md);">
                        <div style="font-size: 24px; margin-bottom: 6px;">🌟</div>
                        <div style="font-size: 13px; color: var(--text-secondary);">每一次旅行都是一段珍贵的记忆</div>
                        <div style="font-size: 12px; color: var(--text-placeholder); margin-top: 4px;">期待下一次出发 ✈️</div>
                    </div>
                </div>
            </div>
        `);
    },

    /**
     * 显示旅行足迹地图（创新点：用Canvas画一张中国地图，标记去过的城市）
     * 小白理解：
     *   - 把你每次旅行去过的城市在地图上"点亮"，像游戏里的开图成就
     *   - 去过的城市显示绿色光点+城市名，没去过的显示灰色小点
     *   - 底部统计"已探索 X/15 个城市"，让你有收集欲望
     */
    showFootprintMap() {
        // 第一步：收集所有"去过的城市"
        // 小白理解：从历史旅程 + 当前进行中的旅程里，把所有出现过的城市名汇总去重
        const visitedSet = new Set();  // 用Set自动去重

        // 1. 从历史旅程中收集
        const history = AppStorage.getJourneyHistory();
        history.forEach(j => {
            // 出发地也算去过
            if (j.departure) visitedSet.add(j.departure);
            // 旅程中选过的城市都算去过
            (j.cities || []).forEach(c => visitedSet.add(c));
        });

        // 2. 从当前进行中的旅程中收集
        const active = AppStorage.getActiveJourney();
        if (active) {
            if (active.departure) visitedSet.add(active.departure);
            (active.cities || []).forEach(c => visitedSet.add(c));
        }

        // 第二步：定义15个城市在画布上的坐标（按中国地图大致位置）
        // 小白理解：这就是一张"简化版中国地图"，每个城市用一个坐标点表示
        const cityCoords = [
            { name: '北京', x: 570, y: 130 },
            { name: '上海', x: 640, y: 290 },
            { name: '成都', x: 340, y: 290 },
            { name: '大理', x: 270, y: 380 },
            { name: '厦门', x: 580, y: 400 },
            { name: '西安', x: 430, y: 220 },
            { name: '长沙', x: 500, y: 340 },
            { name: '重庆', x: 400, y: 310 },
            { name: '丽江', x: 230, y: 350 },
            { name: '苏州', x: 620, y: 250 },
            { name: '青岛', x: 610, y: 180 },
            { name: '三亚', x: 450, y: 460 },
            { name: '南京', x: 570, y: 240 },
            { name: '桂林', x: 420, y: 380 },
            { name: '杭州', x: 650, y: 320 }
        ];

        // 第三步：创建Canvas画布
        // 小白理解：Canvas就像一张白纸，我们在上面用代码"画画"
        const canvas = document.createElement('canvas');
        const W = 750;  // 画布宽度
        const H = 500;  // 画布高度
        canvas.width = W;
        canvas.height = H;
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

        // 第四步：画浅色背景（像地图的底色）
        // 小白理解：先给画布铺一层淡淡的蓝色，模拟海洋/天空的感觉
        const bgGradient = ctx.createLinearGradient(0, 0, 0, H);
        bgGradient.addColorStop(0, '#f0f7ff');  // 顶部浅蓝
        bgGradient.addColorStop(1, '#e6f4ff');  // 底部更浅的蓝
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, W, H);

        // 画一个圆角边框，让地图看起来像一张卡片
        ctx.strokeStyle = '#d6e4ff';
        ctx.lineWidth = 2;
        ctx.strokeRect(2, 2, W - 4, H - 4);

        // 第五步：画顶部标题
        // 小白理解：在画布最上方写"🧭 旅行足迹地图"几个大字
        ctx.fillStyle = '#1890ff';  // 主色调蓝色
        ctx.font = 'bold 28px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🧭 旅行足迹地图', W / 2, 40);

        // 副标题：一句鼓励的话
        ctx.fillStyle = '#999';
        ctx.font = '13px sans-serif';
        ctx.fillText('点亮你的足迹，记录每一段旅程', W / 2, 68);

        // 第六步：画城市点
        // 小白理解：遍历15个城市，去过的画大绿点+光晕+城市名，没去过的画灰色小点
        cityCoords.forEach(city => {
            const visited = visitedSet.has(city.name);  // 这个城市去没去过？

            if (visited) {
                // 去过的城市：画带光晕的绿色大圆点
                // 1. 先画外层光晕（半透明绿色大圆）
                const haloGradient = ctx.createRadialGradient(
                    city.x, city.y, 0,
                    city.x, city.y, 20
                );
                haloGradient.addColorStop(0, 'rgba(82, 196, 26, 0.5)');
                haloGradient.addColorStop(1, 'rgba(82, 196, 26, 0)');
                ctx.fillStyle = haloGradient;
                ctx.beginPath();
                ctx.arc(city.x, city.y, 20, 0, Math.PI * 2);
                ctx.fill();

                // 2. 再画实心绿色圆点（半径8）
                ctx.fillStyle = '#52c41a';
                ctx.beginPath();
                ctx.arc(city.x, city.y, 8, 0, Math.PI * 2);
                ctx.fill();

                // 3. 圆点中心画个白色小高光，看起来更立体
                ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.beginPath();
                ctx.arc(city.x - 2, city.y - 2, 2, 0, Math.PI * 2);
                ctx.fill();

                // 4. 城市名（绿色加粗，显示在点的下方）
                ctx.fillStyle = '#389e0d';
                ctx.font = 'bold 13px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                ctx.fillText(city.name, city.x, city.y + 12);
            } else {
                // 没去过的城市：画灰色小点（半径3）
                ctx.fillStyle = '#ccc';
                ctx.beginPath();
                ctx.arc(city.x, city.y, 3, 0, Math.PI * 2);
                ctx.fill();

                // 城市名也用浅灰色，表示"还没解锁"
                ctx.fillStyle = '#bbb';
                ctx.font = '11px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                ctx.fillText(city.name, city.x, city.y + 8);
            }
        });

        // 第七步：画底部统计
        // 小白理解：在画布最下方写"已探索 X/15 个城市"
        const visitedCount = cityCoords.filter(c => visitedSet.has(c.name)).length;
        const totalCount = cityCoords.length;

        // 底部统计背景条
        ctx.fillStyle = 'rgba(24, 144, 255, 0.08)';
        ctx.beginPath();
        ctx.roundRect(40, H - 60, W - 80, 40, 20);
        ctx.fill();

        // 统计文字
        ctx.fillStyle = '#1890ff';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`已探索 ${visitedCount}/${totalCount} 个城市`, W / 2, H - 40);

        // 第八步：把Canvas转成图片，用弹窗展示
        // 小白理解：Canvas画完后不能直接显示，要转成图片放进弹窗里
        const dataUrl = canvas.toDataURL('image/png');

        Utils.vibrate(8);
        Utils.showModal(`
            <div style="padding: 16px;">
                <!-- 顶部标题栏 -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <h2 style="font-size: 17px;">🧭 旅行足迹地图</h2>
                    <button class="icon-btn" onclick="Utils.closeModal()">✕</button>
                </div>

                <!-- 地图图片 -->
                <img src="${dataUrl}" style="width: 100%; border-radius: var(--radius-md); box-shadow: var(--shadow-md);" />

                <!-- 说明文字 -->
                <div style="font-size: 12px; color: var(--text-secondary); margin-top: 10px; text-align: center;">
                    🟢 绿色圆点 = 已去过的城市 · ⚪ 灰色小点 = 还未探索
                </div>

                <!-- 底部按钮 -->
                <div style="display: flex; gap: 8px; margin-top: 12px;">
                    <a href="${dataUrl}" download="旅行足迹地图_${Utils.formatDate(new Date())}.png" class="btn btn-primary" style="flex: 1; text-align: center; text-decoration: none;">
                        💾 保存图片
                    </a>
                    <button class="btn btn-default" style="flex: 1;" onclick="Utils.closeModal()">关闭</button>
                </div>
            </div>
        `);
    },

    /**
     * 修改出发地（弹窗输入）
     */
    editDeparture() {
        const active = AppStorage.getActiveJourney();
        if (!active) return;
        const newDeparture = prompt('请输入新的出发地：', active.departure);
        if (newDeparture && newDeparture.trim()) {
            this.updateDeparture(newDeparture.trim());
            Utils.closeModal();
            setTimeout(() => this.showManage(), 200);
        }
    },

    /**
     * 城市管理弹窗（修复：旅程管理缺少添加/删除城市入口）
     * 小白理解：开启旅程后想增减城市，在这里操作
     */
    showCityManager() {
        const active = AppStorage.getActiveJourney();
        if (!active) return;

        Utils.vibrate(8);
        Utils.showModal(`
            <div style="padding: 20px; max-height: 85vh; overflow-y: auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <h2 style="font-size: 18px;">🏙️ 城市管理</h2>
                    <button class="icon-btn" onclick="Utils.closeModal();setTimeout(()=>Journey.showManage(),200)">✕</button>
                </div>

                <!-- 当前城市列表 -->
                <div style="margin-bottom: 16px;">
                    <div style="font-size: 13px; font-weight: 600; margin-bottom: 8px;">当前旅程城市（点击删除）</div>
                    ${active.cities.map((city, idx) => `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: var(--bg-card); border-radius: var(--radius-sm); margin-bottom: 6px; box-shadow: var(--shadow-sm);">
                            <div>
                                <span style="font-size: 14px; font-weight: 500;">${idx + 1}. ${city}</span>
                                <span style="font-size: 11px; color: var(--text-secondary); margin-left: 6px;">第${idx + 1}站</span>
                            </div>
                            <button class="icon-btn" style="font-size: 14px; color: var(--danger);" onclick="Journey.removeCityFromManager('${city}')">✕</button>
                        </div>
                    `).join('')}
                </div>

                <!-- 添加城市 -->
                <div>
                    <div style="font-size: 13px; font-weight: 600; margin-bottom: 8px;">添加城市</div>
                    <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                        ${Data.cities.filter(c => !active.cities.includes(c.name)).map(c => `
                            <button class="quick-tag" onclick="Journey.addCityFromManager('${c.name}')">${c.icon} ${c.name}</button>
                        `).join('')}
                    </div>
                </div>
            </div>
        `);
    },

    /** 从城市管理弹窗中移除城市 */
    removeCityFromManager(cityName) {
        this.removeCity(cityName);
        // 刷新弹窗
        Utils.closeModal();
        setTimeout(() => this.showCityManager(), 100);
    },

    /** 从城市管理弹窗中添加城市 */
    addCityFromManager(cityName) {
        this.addCity(cityName);
        // 刷新弹窗
        Utils.closeModal();
        setTimeout(() => this.showCityManager(), 100);
    },

    onShow() {}
};
