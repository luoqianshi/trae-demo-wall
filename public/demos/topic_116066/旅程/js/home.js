/* ============================================ */
/* home.js - 首页模块（Tab 1）                  */
/* 作用：搜索、天气、景点列表、行程方案          */
/* 状态：阶段3 将填充完整功能                    */
/* ============================================ */

window.Home = {
    currentCity: null,  // 当前搜索的城市
    _searchTimer: null, // 搜索防抖定时器
    _suggestTimer: null, // 联想防抖定时器

    init() {
        // 启动时检查是否有进行中的旅程，有则显示旅程首页
        const activeJourney = AppStorage.getActiveJourney();
        if (activeJourney) {
            this.renderJourneyHome();
        } else {
            this.renderInit();
        }
        // 绑定下拉刷新（创新点：首页支持下拉刷新重新加载）
        if (typeof App !== 'undefined' && App.bindPullRefresh) {
            App.bindPullRefresh('home', () => {
                const j = AppStorage.getActiveJourney();
                if (j) this.renderJourneyHome();
                else this.renderInit();
            });
        }
    },

    /**
     * 渲染初始状态（未搜索时）
     */
    renderInit() {
        const content = document.getElementById('home-content');
        content.innerHTML = `
            <!-- 搜索框 -->
            <div style="position: relative;">
                <div class="search-box" style="margin-bottom: 8px;">
                    <span>🔍</span>
                    <input type="text" placeholder="搜索城市或景点..." id="home-search-input"
                        oninput="Home.onSearchInput(this.value)"
                        onkeydown="Home.onSearchKeyDown(event)"
                        onfocus="Home.showSuggest()"
                        onblur="setTimeout(()=>Home.hideSuggest(), 200)">
                </div>
                <!-- 搜索联想下拉 -->
                <div class="search-suggest" id="home-search-suggest"></div>
            </div>

            <!-- 快捷标签 -->
            <div class="quick-tags">
                ${Data.cities.map(c => `<button class="quick-tag" onclick="Home.searchCity('${c.name}')">${c.icon} ${c.name}</button>`).join('')}
            </div>

            <!-- 引导卡片 -->
            <div class="card" style="margin-top: 16px; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 12px;">🗺️</div>
                <p style="color: var(--text-secondary); font-size: 14px;">输入城市名或点击快捷标签开始规划</p>
                <p style="color: var(--text-placeholder); font-size: 12px; margin-top: 8px;">支持搜索城市、景点名称</p>
                <button class="btn btn-primary" style="margin-top: 12px;" onclick="Journey.showWelcomeDialog()">
                    ✈️ 开启一段旅程
                </button>
            </div>

            <!-- 热门推荐板块（创新点：灵感发现入口） -->
            <div style="margin-top: 16px;">
                <div style="font-size: 15px; font-weight: 600; margin-bottom: 10px;">🔥 热门推荐</div>
                <div style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 8px;" class="horizontal-scroll">
                    ${this.renderHotRecommendations()}
                </div>
            </div>

            <!-- 季节推荐板块 -->
            <div style="margin-top: 16px;">
                <div style="font-size: 15px; font-weight: 600; margin-bottom: 10px;">${this.getSeasonIcon()} ${this.getSeasonName()}推荐</div>
                <div style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 8px;" class="horizontal-scroll">
                    ${this.renderSeasonRecommendations()}
                </div>
            </div>

            <!-- 主题推荐 -->
            <div style="margin-top: 16px; margin-bottom: 20px;">
                <div style="font-size: 15px; font-weight: 600; margin-bottom: 10px;">🎯 主题旅行</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                    <div class="card" style="padding: 12px; text-align: center; cursor: pointer;" onclick="Home.searchCity('三亚')">
                        <div style="font-size: 28px;">🏝️</div>
                        <div style="font-size: 13px; font-weight: 600; margin-top: 4px;">海岛度假</div>
                        <div style="font-size: 11px; color: var(--text-secondary);">三亚·厦门·青岛</div>
                    </div>
                    <div class="card" style="padding: 12px; text-align: center; cursor: pointer;" onclick="Home.searchCity('西安')">
                        <div style="font-size: 28px;">🏛️</div>
                        <div style="font-size: 13px; font-weight: 600; margin-top: 4px;">历史人文</div>
                        <div style="font-size: 11px; color: var(--text-secondary);">西安·北京·南京</div>
                    </div>
                    <div class="card" style="padding: 12px; text-align: center; cursor: pointer;" onclick="Home.searchCity('成都')">
                        <div style="font-size: 28px;">🍲</div>
                        <div style="font-size: 13px; font-weight: 600; margin-top: 4px;">美食之旅</div>
                        <div style="font-size: 11px; color: var(--text-secondary);">成都·长沙·重庆</div>
                    </div>
                    <div class="card" style="padding: 12px; text-align: center; cursor: pointer;" onclick="Home.searchCity('大理')">
                        <div style="font-size: 28px;">🏔️</div>
                        <div style="font-size: 13px; font-weight: 600; margin-top: 4px;">自然风光</div>
                        <div style="font-size: 11px; color: var(--text-secondary);">大理·丽江·桂林</div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * 获取热门推荐（按评分排序取前8个景点）
     */
    renderHotRecommendations() {
        const hot = [...Data.scenics].sort((a, b) => b.rating - a.rating).slice(0, 8);
        return hot.map(s => `
            <div class="card" style="flex-shrink: 0; width: 140px; padding: 10px; cursor: pointer;" onclick="Home.searchCity('${s.city}')">
                <div style="font-size: 28px; text-align: center;">${s.icon}</div>
                <div style="font-size: 13px; font-weight: 600; margin-top: 6px; text-align: center;">${s.name}</div>
                <div style="font-size: 11px; color: var(--text-secondary); text-align: center; margin-top: 2px;">
                    ${s.city} · ⭐${s.rating}
                </div>
            </div>
        `).join('');
    },

    /**
     * 获取当前季节
     */
    getSeasonName() {
        const month = new Date().getMonth() + 1;
        if (month >= 3 && month <= 5) return '春季';
        if (month >= 6 && month <= 8) return '夏季';
        if (month >= 9 && month <= 11) return '秋季';
        return '冬季';
    },

    getSeasonIcon() {
        const month = new Date().getMonth() + 1;
        if (month >= 3 && month <= 5) return '🌸';
        if (month >= 6 && month <= 8) return '☀️';
        if (month >= 9 && month <= 11) return '🍂';
        return '❄️';
    },

    /**
     * 季节推荐
     */
    renderSeasonRecommendations() {
        const season = this.getSeasonName();
        const seasonMap = {
            '春季': ['大理', '杭州', '苏州', '婺源'],
            '夏季': ['青岛', '三亚', '厦门', '大理'],
            '秋季': ['北京', '西安', '南京', '成都'],
            '冬季': ['三亚', '大理', '丽江', '厦门']
        };
        const cities = seasonMap[season] || [];
        return cities.map(name => {
            const city = Data.cities.find(c => c.name === name);
            if (!city) return '';
            return `
                <div class="card" style="flex-shrink: 0; width: 120px; padding: 10px; cursor: pointer;" onclick="Home.searchCity('${name}')">
                    <div style="font-size: 28px; text-align: center;">${city.icon}</div>
                    <div style="font-size: 13px; font-weight: 600; margin-top: 6px; text-align: center;">${name}</div>
                    <div style="font-size: 11px; color: var(--text-secondary); text-align: center; margin-top: 2px;">${city.desc}</div>
                </div>
            `;
        }).join('');
    },

    /**
     * 渲染旅程首页（有进行中的旅程时显示）
     * 小白理解：把用户选择的城市以横向滑动卡片形式显示，每张卡片是一个城市
     *           用户左右滑动切换城市，点卡片进入该城市的景点列表
     */
    renderJourneyHome() {
        const journey = AppStorage.getActiveJourney();
        if (!journey) {
            this.renderInit();
            return;
        }

        const content = document.getElementById('home-content');

        // 为每个城市生成一张卡片
        const cityCards = journey.cities.map((cityName, idx) => {
            // 查找城市数据（可能在预设城市里，也可能是自定义城市）
            const cityData = Data.cities.find(c => c.name === cityName);
            const icon = cityData ? cityData.icon : '📌';
            const weather = Data.getWeather(cityName);
            const scenics = Data.getScenicsByCity(cityName);
            const foods = Data.getFoodsByCity(cityName);

            // 创新点：统计已加入行程的景点数（让用户知道这个城市加了多少）
            const tripList = AppStorage.getTrip();
            const addedScenics = tripList.filter(t => t.city === cityName).length;
            const checkedScenics = tripList.filter(t => t.city === cityName && t.checked).length;

            return `
                <div class="journey-city-slide" data-city="${cityName}" data-idx="${idx}">
                    <!-- 城市头部 -->
                    <div style="background: linear-gradient(135deg, var(--primary), #69c0ff); color: #fff; padding: 16px; border-radius: var(--radius-md); margin-bottom: 12px;">
                        <div style="display: flex; justify-content: space-between; align-items: start;">
                            <div>
                                <div style="font-size: 22px; font-weight: 700;">${icon} ${cityName}</div>
                                <div style="font-size: 12px; opacity: 0.9; margin-top: 4px;">
                                    第 ${idx + 1} 站 / 共 ${journey.cities.length} 站
                                </div>
                            </div>
                            ${weather ? `
                                <div style="text-align: right;">
                                    <div style="font-size: 24px;">${weather.current.icon}</div>
                                    <div style="font-size: 12px;">${weather.current.temp}° ${weather.current.desc}</div>
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    <!-- 城市概览 -->
                    <div style="display: flex; gap: 8px; margin-bottom: 12px;">
                        <div style="flex: 1; background: var(--bg-card); padding: 10px; border-radius: var(--radius-sm); text-align: center; box-shadow: var(--shadow-sm);">
                            <div style="font-size: 18px; font-weight: 700; color: var(--primary);">${scenics.length}</div>
                            <div style="font-size: 11px; color: var(--text-secondary);">🏯 景点</div>
                        </div>
                        <div style="flex: 1; background: var(--bg-card); padding: 10px; border-radius: var(--radius-sm); text-align: center; box-shadow: var(--shadow-sm);">
                            <div style="font-size: 18px; font-weight: 700; color: var(--warning);">${foods.length}</div>
                            <div style="font-size: 11px; color: var(--text-secondary);">🍽️ 美食</div>
                        </div>
                        <div style="flex: 1; background: var(--bg-card); padding: 10px; border-radius: var(--radius-sm); text-align: center; box-shadow: var(--shadow-sm);">
                            <div style="font-size: 18px; font-weight: 700; color: var(--success);">${Math.ceil(scenics.length / 2)}</div>
                            <div style="font-size: 11px; color: var(--text-secondary);">📅 建议天数</div>
                        </div>
                    </div>

                    <!-- 创新点：已加入行程的进度条 -->
                    ${addedScenics > 0 ? `
                        <div style="background: var(--bg-page); border-radius: var(--radius-sm); padding: 8px 10px; margin-bottom: 12px;">
                            <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-secondary); margin-bottom: 4px;">
                                <span>📌 已加 ${addedScenics} 个到行程</span>
                                <span style="color: var(--success);">✓ 打卡 ${checkedScenics}/${addedScenics}</span>
                            </div>
                            <div style="height: 4px; background: var(--divider-color); border-radius: 2px; overflow: hidden;">
                                <div style="height: 100%; width: ${(checkedScenics / addedScenics * 100)}%; background: var(--success); border-radius: 2px; transition: width 0.3s;"></div>
                            </div>
                        </div>
                    ` : `
                        <div style="font-size: 11px; color: var(--text-placeholder); padding: 8px; background: var(--bg-page); border-radius: 6px; margin-bottom: 12px; text-align: center;">
                            还未添加景点到行程
                        </div>
                    `}

                    ${weather && weather.advice ? `
                        <div style="font-size: 11px; color: var(--text-secondary); padding: 8px; background: var(--bg-page); border-radius: 6px; margin-bottom: 12px;">
                            💡 ${weather.advice}
                        </div>
                    ` : ''}

                    <!-- 操作按钮 -->
                    <div style="display: flex; gap: 8px;">
                        <button class="btn btn-primary" style="flex: 1; font-size: 13px;" onclick="Home.openCityExplore('${cityName}')">
                            🔍 探索 ${cityName}
                        </button>
                        <button class="btn btn-default" style="font-size: 13px;" onclick="Home.moveJourneyCity('${cityName}', -1)" title="前移">↑</button>
                        <button class="btn btn-default" style="font-size: 13px;" onclick="Home.moveJourneyCity('${cityName}', 1)" title="后移">↓</button>
                        <button class="btn btn-default" style="font-size: 13px;" onclick="Home.confirmRemoveJourneyCity('${cityName}')">
                            🗑️
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        content.innerHTML = `
            <!-- 旅程状态条 -->
            <div style="background: linear-gradient(135deg, rgba(24,144,255,0.1), rgba(82,196,26,0.1)); border-radius: var(--radius-md); padding: 12px; margin-bottom: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="flex: 1;" onclick="Journey.showManage()" style="cursor: pointer;">
                        <div style="font-size: 14px; font-weight: 600; color: var(--primary);">
                            ✈️ 第${journey.number}次旅程
                        </div>
                        <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">
                            🏠 ${journey.departure} → ${journey.cities.join(' → ')}
                        </div>
                    </div>
                    <div style="display: flex; gap: 6px;">
                        <button class="btn btn-default" style="font-size: 11px; padding: 4px 10px;" onclick="Journey.showManage()">管理</button>
                        <button class="btn btn-danger" style="font-size: 11px; padding: 4px 10px;" onclick="Home.confirmEndJourney()">🏁 结束</button>
                    </div>
                </div>
            </div>

            <!-- 搜索框（保留搜索功能） -->
            <div style="position: relative;">
                <div class="search-box" style="margin-bottom: 8px;">
                    <span>🔍</span>
                    <input type="text" placeholder="搜索城市或景点..." id="home-search-input"
                        oninput="Home.onSearchInput(this.value)"
                        onkeydown="Home.onSearchKeyDown(event)"
                        onfocus="Home.showSuggest()"
                        onblur="setTimeout(()=>Home.hideSuggest(), 200)">
                </div>
                <div class="search-suggest" id="home-search-suggest"></div>
            </div>

            <!-- 城市横向滑动卡片标题 -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin: 16px 0 8px;">
                <div style="font-size: 15px; font-weight: 600;">📍 你的目的地（左右滑动查看）</div>
                <button class="btn btn-default" style="font-size: 11px; padding: 4px 10px;" onclick="Home.showAddJourneyCity()">
                    + 添加城市
                </button>
            </div>

            <!-- 城市横向滑动卡片轨道 -->
            <div class="journey-city-slider" id="journey-city-slider">
                ${cityCards}
                <!-- 添加城市的占位卡片 -->
                <div class="journey-city-slide journey-add-card" onclick="Home.showAddJourneyCity()">
                    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 30px; border: 2px dashed var(--border-color); border-radius: var(--radius-md); color: var(--text-placeholder);">
                        <div style="font-size: 32px;">+</div>
                        <div style="font-size: 13px; margin-top: 6px;">添加城市</div>
                    </div>
                </div>
            </div>

            <!-- 城市指示器（小圆点） -->
            <div style="display: flex; justify-content: center; gap: 6px; margin: 12px 0;" id="journey-dots">
                ${journey.cities.map((_, i) => `
                    <span class="journey-dot ${i === 0 ? 'active' : ''}" data-idx="${i}"></span>
                `).join('')}
            </div>

            <style>
                /* 旅程城市横向滑动容器 */
                .journey-city-slider {
                    display: flex;
                    gap: 12px;
                    overflow-x: auto;
                    overflow-y: hidden;
                    -webkit-overflow-scrolling: touch;
                    touch-action: pan-x;
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                    scroll-snap-type: x mandatory;
                    padding-bottom: 8px;
                }
                .journey-city-slider::-webkit-scrollbar { display: none; }

                /* 每张城市卡片：占大部分宽度，方便滑动切换 */
                .journey-city-slide {
                    flex: 0 0 85%;
                    scroll-snap-align: start;
                    padding: 12px;
                    background: var(--bg-card);
                    border-radius: var(--radius-md);
                    box-shadow: var(--shadow-sm);
                }

                /* 城市指示器小圆点 */
                .journey-dot {
                    width: 7px;
                    height: 7px;
                    border-radius: 50%;
                    background: var(--divider-color);
                    transition: all 0.2s ease;
                }
                .journey-dot.active {
                    background: var(--primary);
                    width: 18px;
                    border-radius: 4px;
                }
            </style>
        `;

        // 绑定滑动指示器更新
        const slider = document.getElementById('journey-city-slider');
        if (slider) {
            slider.addEventListener('scroll', Utils.debounce(() => {
                const idx = Math.round(slider.scrollLeft / (slider.offsetWidth * 0.85));
                document.querySelectorAll('.journey-dot').forEach((dot, i) => {
                    dot.classList.toggle('active', i === idx);
                });
            }, 100));
        }
    },

    /**
     * 显示添加城市到旅程的弹窗
     */
    showAddJourneyCity() {
        const journey = AppStorage.getActiveJourney();
        if (!journey) {
            Utils.toast('请先开启一段旅程');
            return;
        }

        // 已选城市
        const selected = journey.cities;
        // 可选城市（排除已选）
        const available = Data.cities.filter(c => !selected.includes(c.name));

        Utils.showModal(`
            <div style="padding: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <h2 style="font-size: 17px;">➕ 添加城市到旅程</h2>
                    <button class="icon-btn" onclick="Utils.closeModal()">✕</button>
                </div>

                <!-- 创新点：搜索框（既能筛预设城市，也能输入自定义城市回车添加） -->
                <div class="search-box" style="margin-bottom: 12px;">
                    <span>🔍</span>
                    <input type="text" id="add-city-input" placeholder="搜索或输入城市名，回车添加"
                        oninput="Home.filterAddCityList(this.value)"
                        onkeydown="if(event.key==='Enter'){Home.addCustomJourneyCity()}">
                </div>

                <!-- 预设城市（可被搜索筛选） -->
                ${available.length > 0 ? `
                    <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 8px;">推荐城市</div>
                    <div id="add-city-list" style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px;">
                        ${available.map(c => `
                            <button class="btn btn-default add-city-btn" style="font-size: 13px;" data-city="${c.name}" data-search="${c.name}${c.province}${c.desc}" onclick="Home.addJourneyCity('${c.name}')">
                                ${c.icon} ${c.name}
                            </button>
                        `).join('')}
                    </div>
                ` : ''}

                <!-- 搜索无结果时的提示 -->
                <div id="add-city-no-result" style="display: none; font-size: 12px; color: var(--text-placeholder); text-align: center; padding: 16px;">
                    没有找到匹配的城市，可直接输入回车添加自定义城市
                </div>
            </div>
        `);
    },

    /**
     * 添加预设城市到旅程
     */
    addJourneyCity(cityName) {
        Journey.addCity(cityName);
        Utils.closeModal();
    },

    /**
     * 筛选添加城市列表
     * 小白理解：在搜索框输入文字时，实时筛选下面的城市按钮
     */
    filterAddCityList(keyword) {
        const btns = document.querySelectorAll('.add-city-btn');
        const noResult = document.getElementById('add-city-no-result');
        if (!btns.length) return;
        keyword = (keyword || '').trim().toLowerCase();
        let visibleCount = 0;
        btns.forEach(btn => {
            const searchText = (btn.getAttribute('data-search') || '').toLowerCase();
            const match = !keyword || searchText.includes(keyword);
            btn.style.display = match ? '' : 'none';
            if (match) visibleCount++;
        });
        if (noResult) {
            noResult.style.display = (visibleCount === 0 && keyword) ? 'block' : 'none';
        }
    },

    /**
     * 添加自定义城市到旅程
     */
    addCustomJourneyCity() {
        const input = document.getElementById('add-city-input');
        if (!input) return;
        const cityName = input.value.trim();
        if (!cityName) {
            Utils.toast('请输入城市名');
            return;
        }
        Journey.addCity(cityName);
        Utils.closeModal();
    },

    /**
     * 确认移除旅程中的城市
     */
    confirmRemoveJourneyCity(cityName) {
        if (!confirm(`确定要从旅程中移除 ${cityName} 吗？`)) return;
        Journey.removeCity(cityName);
    },

    /**
     * 移动旅程中城市的顺序
     * 小白理解：点↑前移、点↓后移，调整想去城市的先后顺序
     */
    moveJourneyCity(cityName, direction) {
        Utils.vibrate(8);
        const journey = AppStorage.getActiveJourney();
        if (!journey) return;
        const idx = journey.cities.indexOf(cityName);
        if (idx === -1) return;
        const target = idx + direction;
        if (target < 0 || target >= journey.cities.length) {
            Utils.toast(direction === -1 ? '已经在最前面了' : '已经在最后面了');
            return;
        }
        // 交换位置
        [journey.cities[idx], journey.cities[target]] = [journey.cities[target], journey.cities[idx]];
        AppStorage.setActiveJourney(journey);
        this.renderJourneyHome();
    },

    /**
     * 确认结束旅程（首页快捷入口）
     * 小白理解：用户在首页点"结束"按钮，确认后调用Journey.endJourney
     */
    confirmEndJourney() {
        const journey = AppStorage.getActiveJourney();
        if (!journey) return;
        if (!confirm(`确定要结束第${journey.number}次旅程吗？\n\n出发地：${journey.departure}\n城市：${journey.cities.join(' → ')}\n\n结束后可在历史中查看，下次打开App会引导开启新旅程。`)) return;
        Journey.endJourney();
        // 刷新首页回到初始状态
        setTimeout(() => this.renderInit(), 300);
    },

    /**
     * 打开城市探索全新页面（全屏覆盖层）
     * 小白理解：点"探索城市"后打开一个全屏新页面，像翻开一本城市指南
     *           里面有景点的Tab切换、天气、景点列表、美食、交通等完整信息
     *           点返回按钮回到旅程首页
     * @param {string} cityName - 城市名
     */
    openCityExplore(cityName) {
        Utils.vibrate(10);

        // 查找城市数据
        const cityData = Data.cities.find(c => c.name === cityName);
        const icon = cityData ? cityData.icon : '📌';
        const province = cityData ? cityData.province : '';
        const weather = Data.getWeather(cityName);
        const scenics = Data.getScenicsByCity(cityName);
        const foods = Data.getFoodsByCity(cityName);
        const transport = Data.getCityTransport(cityName);

        // 检查哪些景点已在行程中
        const tripList = AppStorage.getTrip();
        const inTrip = (name) => tripList.some(t => t.name === name);

        // 创建全屏覆盖层
        const overlay = document.createElement('div');
        overlay.className = 'city-explore-page';
        overlay.id = 'city-explore-page';

        overlay.innerHTML = `
            <!-- 顶部栏（固定） -->
            <div class="explore-header">
                <button class="explore-back-btn" onclick="Home.closeCityExplore()">‹ 返回</button>
                <div class="explore-title">${icon} ${cityName}</div>
                <button class="explore-fav-btn" onclick="Home.toggleCityFav('${cityName}')">${AppStorage.isFavorited(cityName, 'city') ? '⭐' : '☆'}</button>
            </div>

            <!-- 内容区（可滚动） -->
            <div class="explore-body" id="explore-body">
                <!-- 城市封面横幅 -->
                <div class="explore-banner" style="background: linear-gradient(135deg, var(--primary), #69c0ff);">
                    <div style="font-size: 56px; margin-bottom: 8px;">${icon}</div>
                    <div style="font-size: 24px; font-weight: 700;">${cityName}</div>
                    ${province ? `<div style="font-size: 13px; opacity: 0.9; margin-top: 4px;">📍 ${province}</div>` : ''}
                    <div style="display: flex; gap: 12px; margin-top: 10px; font-size: 12px; opacity: 0.95;">
                        <span>🏯 ${scenics.length}个景点</span>
                        <span>🍽️ ${foods.length}家美食</span>
                        ${transport.length > 0 ? `<span>🚌 ${transport.length}种交通</span>` : ''}
                    </div>
                </div>

                <!-- 天气卡片 -->
                ${weather ? `
                    <div class="explore-section">
                        <div class="explore-section-title">🌤️ 实时天气</div>
                        <div class="explore-weather-card">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <div style="font-size: 32px; font-weight: 700; color: var(--primary);">${weather.current.temp}°</div>
                                    <div style="font-size: 13px; color: var(--text-secondary);">${weather.current.icon} ${weather.current.desc}</div>
                                </div>
                                <div style="text-align: right; font-size: 12px; color: var(--text-secondary); line-height: 1.8;">
                                    💧 湿度 ${weather.current.humidity}%<br>
                                    🌬️ ${weather.current.wind}
                                </div>
                            </div>
                            <div style="display: flex; gap: 6px; margin-top: 12px; overflow-x: auto;" class="horizontal-scroll">
                                ${weather.forecast.map(f => `
                                    <div style="flex-shrink: 0; text-align: center; padding: 6px 10px; background: var(--bg-page); border-radius: 6px; min-width: 50px;">
                                        <div style="font-size: 11px; color: var(--text-secondary);">${f.day}</div>
                                        <div style="font-size: 20px; margin: 2px 0;">${f.icon}</div>
                                        <div style="font-size: 11px;">${f.temp}</div>
                                    </div>
                                `).join('')}
                            </div>
                            <div style="font-size: 12px; color: var(--text-secondary); margin-top: 10px; padding: 8px; background: var(--bg-page); border-radius: 6px;">
                                💡 ${weather.advice}
                            </div>
                        </div>
                    </div>
                ` : ''}

                <!-- Tab切换栏 -->
                <div class="explore-tabs" id="explore-tabs">
                    <button class="explore-tab active" data-tab="scenics" onclick="Home.switchExploreTab('scenics')">🏯 景点</button>
                    <button class="explore-tab" data-tab="foods" onclick="Home.switchExploreTab('foods')">🍽️ 美食</button>
                    <button class="explore-tab" data-tab="transport" onclick="Home.switchExploreTab('transport')">🚌 交通</button>
                </div>

                <!-- Tab内容区 -->
                <div class="explore-tab-content" id="explore-tab-content">
                    ${this.renderExploreScenics(scenics, inTrip)}
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // 存储当前探索页的城市数据，供Tab切换使用
        this._exploreData = { cityName, scenics, foods, transport, inTrip };
    },

    /**
     * 渲染景点Tab内容
     */
    renderExploreScenics(scenics, inTrip) {
        if (scenics.length === 0) {
            return '<div class="explore-empty">📭 暂无该城市的景点数据</div>';
        }
        return scenics.map(s => `
            <div class="explore-card scenic-card-gradient" style="position: relative;" data-scenic-id="${s.id}">
                <div style="cursor: pointer;" onclick="Home.showScenicDetail('${s.id}')">
                    <div class="scenic-img">${s.icon}</div>
                    <div class="scenic-info">
                        <div class="scenic-name">${s.name}</div>
                        <div class="scenic-meta">
                            <span>⭐${s.rating}</span>
                            <span>${Utils.formatPrice(s.price)}</span>
                            <span>${s.openTime}</span>
                        </div>
                        <div class="scenic-meta">
                            <span>🚇 ${s.transport}</span>
                        </div>
                        <div style="font-size: 12px; color: var(--text-secondary); margin-top: 6px; line-height: 1.5;">
                            ${s.desc}
                        </div>
                    </div>
                </div>
                <button class="icon-btn"
                    style="position: absolute; right: 8px; bottom: 8px; width: 32px; height: 32px; background: ${inTrip(s.name) ? 'var(--success)' : 'var(--primary)'}; color: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.15);"
                    onclick="event.stopPropagation(); Home.quickAddToTrip('${s.id}')">
                    ${inTrip(s.name) ? '✓' : '+'}
                </button>
            </div>
        `).join('');
    },

    /**
     * 渲染美食Tab内容
     */
    renderExploreFoods(foods) {
        if (foods.length === 0) {
            return '<div class="explore-empty">📭 暂无该城市的美食数据</div>';
        }
        return foods.map(f => `
            <div class="explore-card">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                            <span style="font-size: 20px;">${f.icon}</span>
                            <span style="font-size: 15px; font-weight: 600;">${f.name}</span>
                        </div>
                        <div style="font-size: 12px; color: var(--text-secondary);">
                            ${f.cuisine} · ${f.area} · ⭐${f.rating}
                        </div>
                        <div style="font-size: 12px; color: var(--text-regular); margin-top: 6px;">${f.desc}</div>
                        <div style="font-size: 11px; color: var(--warning); margin-top: 4px;">💡 ${f.tip}</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 16px; color: var(--primary); font-weight: 600;">¥${f.price}</div>
                    </div>
                </div>
                <button class="btn btn-default btn-block" style="margin-top: 8px; font-size: 12px;" onclick="Food.addToTrip('${f.name}')">
                    📌 加入行程
                </button>
            </div>
        `).join('');
    },

    /**
     * 渲染交通Tab内容
     */
    renderExploreTransport(transport) {
        if (transport.length === 0) {
            return '<div class="explore-empty">📭 暂无该城市的交通数据</div>';
        }
        return transport.map(t => `
            <div class="explore-card">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-size: 15px; font-weight: 600;">🚌 ${t.type}</div>
                        <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px; line-height: 1.6;">
                            ${t.lines}<br>
                            ⏱️ ${t.time}
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 16px; color: var(--primary); font-weight: 600;">¥${t.price}</div>
                        ${t.eco ? '<span class="tag tag-success" style="font-size: 10px;">🌱 低碳</span>' : ''}
                    </div>
                </div>
            </div>
        `).join('');
    },

    /**
     * 切换探索页的Tab（景点/美食/交通）
     * 小白理解：在城市探索页里切换不同分类的内容
     */
    switchExploreTab(tabName) {
        Utils.vibrate(5);
        // 更新Tab按钮高亮
        document.querySelectorAll('.explore-tab').forEach(t => {
            t.classList.toggle('active', t.getAttribute('data-tab') === tabName);
        });
        // 重置筛选状态
        this._exploreSort = 'default';
        this._exploreFilter = 'all';
        // 渲染对应内容（带筛选/排序栏）
        const content = document.getElementById('explore-tab-content');
        if (!content || !this._exploreData) return;
        const data = this._exploreData;
        let filterHTML = '';
        if (tabName === 'scenics') {
            filterHTML = this.renderExploreFilters(['全部', '自然风光', '历史人文', '现代娱乐'], ['默认', '评分高→低', '价格低→高', '价格高→低']);
        } else if (tabName === 'foods') {
            filterHTML = this.renderExploreFilters(['全部', '川菜', '粤菜', '小吃', '火锅', '湘菜'], ['默认', '评分高→低', '价格低→高', '价格高→低']);
        }
        let listHTML = '';
        if (tabName === 'scenics') {
            listHTML = this.renderExploreScenics(data.scenics, data.inTrip);
        } else if (tabName === 'foods') {
            listHTML = this.renderExploreFoods(data.foods);
        } else if (tabName === 'transport') {
            listHTML = this.renderExploreTransport(data.transport);
        }
        content.innerHTML = filterHTML + listHTML;
    },

    /**
     * 渲染探索页的筛选/排序栏
     * 小白理解：在城市探索页里加筛选和排序，方便找到想去的景点
     */
    renderExploreFilters(categories, sorts) {
        const currentFilter = this._exploreFilter || 'all';
        const currentSort = this._exploreSort || 'default';
        return `
            <div style="display: flex; gap: 6px; overflow-x: auto; padding: 8px 0; border-bottom: 1px solid var(--divider-color);" class="horizontal-scroll">
                ${categories.map(cat => `
                    <button class="filter-btn ${currentFilter === cat ? 'active' : ''}"
                        style="flex-shrink: 0; font-size: 12px; padding: 4px 10px;"
                        onclick="Home.filterExplore('${cat}')">${cat}</button>
                `).join('')}
            </div>
            <div style="display: flex; gap: 6px; overflow-x: auto; padding: 8px 0; border-bottom: 1px solid var(--divider-color);" class="horizontal-scroll">
                ${sorts.map(sort => `
                    <button class="filter-btn ${currentSort === sort ? 'active' : ''}"
                        style="flex-shrink: 0; font-size: 11px; padding: 3px 8px;"
                        onclick="Home.sortExplore('${sort}')">${sort}</button>
                `).join('')}
            </div>
        `;
    },

    /**
     * 筛选探索页内容
     */
    filterExplore(category) {
        Utils.vibrate(5);
        this._exploreFilter = category;
        if (!this._exploreData) return;
        const data = this._exploreData;
        const tab = document.querySelector('.explore-tab.active');
        const tabName = tab ? tab.getAttribute('data-tab') : 'scenics';
        let items, inTrip;
        if (tabName === 'scenics') {
            items = category === '全部' ? data.scenics : data.scenics.filter(s => s.category === category);
            inTrip = data.inTrip;
        } else if (tabName === 'foods') {
            items = category === '全部' ? data.foods : data.foods.filter(f => f.cuisine === category);
        }
        // 应用排序
        items = this._applySort(items);
        // 重新渲染
        const content = document.getElementById('explore-tab-content');
        let filterHTML = '';
        if (tabName === 'scenics') {
            filterHTML = this.renderExploreFilters(['全部', '自然风光', '历史人文', '现代娱乐'], ['默认', '评分高→低', '价格低→高', '价格高→低']);
            content.innerHTML = filterHTML + this.renderExploreScenics(items, inTrip);
        } else if (tabName === 'foods') {
            filterHTML = this.renderExploreFilters(['全部', '川菜', '粤菜', '小吃', '火锅', '湘菜'], ['默认', '评分高→低', '价格低→高', '价格高→低']);
            content.innerHTML = filterHTML + this.renderExploreFoods(items);
        }
    },

    /**
     * 排序探索页内容
     */
    sortExplore(sort) {
        Utils.vibrate(5);
        this._exploreSort = sort;
        this.filterExplore(this._exploreFilter || '全部');
    },

    /**
     * 应用排序
     */
    _applySort(items) {
        const sorted = [...items];
        switch (this._exploreSort) {
            case '评分高→低': sorted.sort((a, b) => b.rating - a.rating); break;
            case '价格低→高': sorted.sort((a, b) => a.price - b.price); break;
            case '价格高→低': sorted.sort((a, b) => b.price - a.price); break;
        }
        return sorted;
    },

    /**
     * 关闭城市探索页
     */
    closeCityExplore() {
        const page = document.getElementById('city-explore-page');
        if (page) {
            page.classList.add('closing');
            setTimeout(() => page.remove(), 250);
        }
        this._exploreData = null;
    },

    /**
     * 收藏/取消收藏城市
     */
    toggleCityFav(cityName) {
        Utils.vibrate(8);
        const cityData = Data.cities.find(c => c.name === cityName);
        const item = cityData ? Utils.deepCopy(cityData) : { name: cityName, icon: '📌' };
        const isFav = AppStorage.toggleFavorite(item, 'city');
        Utils.toast(isFav ? '已收藏该城市 ⭐' : '已取消收藏');
        // 更新按钮显示
        const btn = document.querySelector('.explore-fav-btn');
        if (btn) btn.textContent = isFav ? '⭐' : '☆';
    },

    /**
     * 搜索框输入事件
     */
    onSearchInput(value) {
        // 实时联想
        if (this._suggestTimer) clearTimeout(this._suggestTimer);
        this._suggestTimer = setTimeout(() => {
            this.updateSuggest(value);
        }, 200);
    },

    /**
     * 搜索框回车事件
     */
    onSearchKeyDown(event) {
        if (event.key === 'Enter') {
            const value = event.target.value.trim();
            if (value) {
                this.search(value);
                this.hideSuggest();
                event.target.blur();
            }
        }
    },

    /**
     * 显示联想（聚焦时）
     */
    showSuggest() {
        const value = document.getElementById('home-search-input').value;
        if (value) {
            this.updateSuggest(value);
        }
    },

    /**
     * 隐藏联想
     */
    hideSuggest() {
        const el = document.getElementById('home-search-suggest');
        if (el) el.classList.remove('active');
    },

    /**
     * 更新搜索联想下拉
     */
    updateSuggest(keyword) {
        const el = document.getElementById('home-search-suggest');
        if (!el) return;
        if (!keyword) {
            el.classList.remove('active');
            return;
        }

        // 匹配城市
        const cityMatches = Data.cities.filter(c =>
            c.name.includes(keyword) || c.province.includes(keyword)
        ).slice(0, 5);

        // 匹配景点
        const scenicMatches = Data.scenics.filter(s =>
            s.name.includes(keyword) || s.city.includes(keyword)
        ).slice(0, 5);

        if (cityMatches.length === 0 && scenicMatches.length === 0) {
            el.classList.remove('active');
            return;
        }

        let html = '';
        if (cityMatches.length > 0) {
            html += `<div style="padding: 8px 16px; font-size: 12px; color: var(--text-secondary);">🏙️ 城市</div>`;
            html += cityMatches.map(c => `
                <div class="suggest-item" onclick="Home.searchCity('${c.name}')">
                    ${c.icon} ${c.name} · ${c.province}
                </div>
            `).join('');
        }
        if (scenicMatches.length > 0) {
            html += `<div style="padding: 8px 16px; font-size: 12px; color: var(--text-secondary);">🏯 景点</div>`;
            html += scenicMatches.map(s => `
                <div class="suggest-item" onclick="Home.searchScenic('${s.id}')">
                    ${s.icon} ${s.name} · ${s.city}
                </div>
            `).join('');
        }

        el.innerHTML = html;
        el.classList.add('active');
    },

    /**
     * 通用搜索（根据关键词判断是城市还是景点）
     */
    search(keyword) {
        // 先判断是不是城市名
        const city = Data.cities.find(c => c.name === keyword || keyword.includes(c.name));
        if (city) {
            this.searchCity(city.name);
            return;
        }
        // 再判断是不是景点名
        const scenic = Data.scenics.find(s => s.name === keyword || keyword.includes(s.name));
        if (scenic) {
            this.searchScenic(scenic.id);
            return;
        }
        // 都不是，提示
        Utils.toast('未找到相关内容，试试搜索城市名');
    },

    /**
     * 搜索城市
     * 小白理解：搜索时先显示骨架屏（灰色占位动画），再显示真实内容，更专业
     */
    searchCity(cityName) {
        this.currentCity = cityName;
        AppStorage.addSearchHistory(cityName);
        // 先显示骨架屏（创新点：加载中的占位动画）
        const content = document.getElementById('home-content');
        content.innerHTML = `
            <div class="search-box" style="margin-bottom: 8px;">
                <span>🔍</span>
                <input type="text" placeholder="搜索城市或景点..." value="${cityName}">
            </div>
            <div style="margin-top: 16px;">${Utils.skeletonHTML(4)}</div>
        `;
        // 300ms后渲染真实内容
        setTimeout(() => {
            this.renderCityResult(cityName);
            // 绑定长按事件（创新点）
            this.bindCardLongPress();
        }, 300);
    },

    /**
     * 搜索景点（直接显示景点详情）
     */
    searchScenic(scenicId) {
        const scenic = Data.scenics.find(s => s.id === scenicId);
        if (!scenic) return;
        AppStorage.addSearchHistory(scenic.name);
        // 先定位到该城市
        this.currentCity = scenic.city;
        this.renderCityResult(scenic.city);
        // 然后显示详情
        setTimeout(() => {
            this.showScenicDetail(scenicId);
        }, 100);
    },

    /**
     * 渲染城市搜索结果
     */
    renderCityResult(cityName) {
        const content = document.getElementById('home-content');
        const weather = Data.getWeather(cityName);
        const scenics = Data.getScenicsByCity(cityName);

        content.innerHTML = `
            <!-- 搜索框 -->
            <div style="position: relative;">
                <div class="search-box" style="margin-bottom: 8px;">
                    <span>🔍</span>
                    <input type="text" placeholder="搜索城市或景点..." value="${cityName}" id="home-search-input"
                        oninput="Home.onSearchInput(this.value)"
                        onkeydown="Home.onSearchKeyDown(event)"
                        onfocus="Home.showSuggest()"
                        onblur="setTimeout(()=>Home.hideSuggest(), 200)">
                </div>
                <div class="search-suggest" id="home-search-suggest"></div>
            </div>

            <!-- 快捷标签 -->
            <div class="quick-tags">
                ${Data.cities.map(c => `<button class="quick-tag ${c.name === cityName ? 'active' : ''}" onclick="Home.searchCity('${c.name}')">${c.icon} ${c.name}</button>`).join('')}
            </div>

            <!-- 天气卡片 -->
            ${weather ? this.renderWeatherCard(weather, cityName) : ''}

            <!-- 景点列表标题 -->
            <h3 style="margin: 16px 0 8px; font-size: 16px;">🏯 ${cityName}热门景点 (${scenics.length})</h3>

            <!-- 景点列表 -->
            ${scenics.map(s => this.renderScenicCard(s)).join('')}
        `;
    },

    /**
     * 渲染天气卡片
     */
    renderWeatherCard(weather, cityName) {
        if (!weather) return '';
        const c = weather.current;
        return `
            <div class="weather-card">
                <div class="weather-current">
                    <div>
                        <div style="font-size: 14px; opacity: 0.9;">${cityName} ${c.icon}</div>
                        <div class="weather-temp">${c.temp}°</div>
                        <div style="font-size: 12px; opacity: 0.8;">${c.desc} · 湿度${c.humidity}% · ${c.wind}</div>
                    </div>
                </div>
                <div class="weather-forecast">
                    ${weather.forecast.map(f => `
                        <div class="forecast-item">
                            <div style="font-size: 11px;">${f.day}</div>
                            <div style="font-size: 20px;">${f.icon}</div>
                            <div style="font-size: 11px;">${f.temp}</div>
                        </div>
                    `).join('')}
                </div>
                <div style="margin-top: 12px; font-size: 12px; opacity: 0.9; line-height: 1.5;">💡 ${weather.advice}</div>
            </div>
        `;
    },

    /**
     * 渲染景点卡片
     * 小白理解：每张景点卡片右下角有个小"+"按钮，
     *           点击直接加入行程，不用点进详情页，更方便
     *           顶部有彩色渐变条（创新点：不同类型景点不同颜色）
     */
    renderScenicCard(scenic) {
        // 根据景点分类决定渐变色条类型
        let gradientType = '';
        if (scenic.category && (scenic.category.includes('自然') || scenic.category.includes('公园') || scenic.category.includes('山'))) {
            gradientType = 'type-nature';
        } else if (scenic.category && (scenic.category.includes('历史') || scenic.category.includes('人文') || scenic.category.includes('古'))) {
            gradientType = 'type-history';
        } else if (scenic.category && (scenic.category.includes('娱乐') || scenic.category.includes('现代'))) {
            gradientType = 'type-modern';
        }
        return `
            <div class="scenic-card scenic-card-gradient ${gradientType}" style="position: relative;" data-scenic-id="${scenic.id}">
                <div style="cursor: pointer;" onclick="Home.showScenicDetail('${scenic.id}')">
                    <div class="scenic-img">${scenic.icon}</div>
                    <div class="scenic-info">
                        <div class="scenic-name">${scenic.name}</div>
                        <div class="scenic-meta">
                            <span>⭐${scenic.rating}</span>
                            <span>${Utils.formatPrice(scenic.price)}</span>
                            <span>${scenic.openTime}</span>
                        </div>
                        <div class="scenic-meta">
                            <span>🚇 ${scenic.transport}</span>
                            <span>📍 ${scenic.source}</span>
                        </div>
                    </div>
                </div>
                <!-- 快捷加入按钮（阻止冒泡，不触发卡片点击） -->
                <button class="icon-btn"
                    style="position: absolute; right: 8px; bottom: 8px; width: 32px; height: 32px; background: var(--primary); color: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.15);"
                    onclick="event.stopPropagation(); Home.quickAddToTrip('${scenic.id}')">
                    +
                </button>
            </div>
        `;
    },

    /**
     * 给所有景点卡片绑定长按事件（创新点：长按弹出快捷操作菜单）
     * 小白理解：手指按住景点卡片0.6秒，从底部弹出菜单，可以收藏/加入行程/查看详情
     */
    bindCardLongPress() {
        const cards = document.querySelectorAll('.scenic-card[data-scenic-id]');
        cards.forEach(card => {
            const scenicId = card.getAttribute('data-scenic-id');
            Utils.bindLongPress(card, () => {
                const scenic = Data.scenics.find(s => s.id === scenicId);
                if (!scenic) return;
                const isFav = AppStorage.isFavorited(scenic.name, 'scenic');
                // 弹出底部菜单（Bottom Sheet）
                Utils.showBottomSheet(`${scenic.icon} ${scenic.name}`, [
                    {
                        icon: '📋',
                        label: '查看详情',
                        action: () => this.showScenicDetail(scenicId)
                    },
                    {
                        icon: '📌',
                        label: '加入行程',
                        action: () => this.quickAddToTrip(scenicId)
                    },
                    {
                        icon: isFav ? '❌' : '⭐',
                        label: isFav ? '取消收藏' : '收藏',
                        action: () => this.toggleFavorite(scenic.name)
                    }
                ]);
            });
        });
    },

    /**
     * 快捷加入行程（卡片右下角的+按钮）
     * 小白理解：不弹窗，直接加，加完提示一下，方便快速添加多个景点
     *           加完后振动反馈 + 更新底部行程Tab的角标数字
     */
    quickAddToTrip(scenicId) {
        const scenic = Data.scenics.find(s => s.id === scenicId);
        if (!scenic) return;
        const copy = Utils.deepCopy(scenic);
        const success = AppStorage.addToTrip(copy);
        if (success) {
            Utils.toast('✓ 已加入行程');
            Utils.vibrate([10]);
            if (typeof App !== 'undefined' && App.updateTabBadge) App.updateTabBadge();
            // 创新点：立即更新该卡片的按钮状态（从+变✓），不用刷新整个页面
            const btn = document.querySelector(`[data-scenic-id="${scenicId}"] .icon-btn`);
            if (btn) {
                btn.textContent = '✓';
                btn.style.background = 'var(--success)';
            }
        } else {
            Utils.toast('已在行程中');
            Utils.vibrate(5);
        }
    },

    /**
     * 显示景点详情弹窗
     */
    showScenicDetail(scenicId) {
        const scenic = Data.scenics.find(s => s.id === scenicId);
        if (!scenic) return;

        // 记录浏览历史
        AppStorage.addBrowseHistory({ name: scenic.name, city: scenic.city, icon: scenic.icon }, 'scenic');

        const weather = Data.getWeather(scenic.city);
        const isFav = AppStorage.isFavorited(scenic.name, 'scenic');

        Utils.showModal(`
            <div style="padding: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 16px;">
                    <div>
                        <h2 style="font-size: 20px;">${scenic.icon} ${scenic.name}</h2>
                        <div style="color: var(--text-secondary); font-size: 13px; margin-top: 4px;">
                            ⭐${scenic.rating} · ${Utils.formatPrice(scenic.price)} · ${scenic.openTime}
                        </div>
                    </div>
                    <button class="icon-btn" onclick="Utils.closeModal()">✕</button>
                </div>

                <p style="color: var(--text-regular); line-height: 1.6; margin-bottom: 16px;">${scenic.desc}</p>

                <div style="background: var(--bg-page); border-radius: 8px; padding: 12px; margin-bottom: 16px;">
                    <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 4px;">🌤️ 天气影响</div>
                    <div style="font-size: 13px;">${weather ? weather.advice : '暂无天气数据'}</div>
                </div>

                <h3 style="font-size: 15px; margin-bottom: 8px;">🍽️ 附近餐馆</h3>
                ${scenic.restaurants.map(r => `
                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--divider-color);">
                        <div>
                            <div style="font-size: 14px;">${r.name}</div>
                            <div style="font-size: 12px; color: var(--text-secondary);">${r.cuisine} · ⭐${r.rating} · ${r.distance}</div>
                        </div>
                        <div style="font-size: 13px; color: var(--primary);">¥${r.price}</div>
                    </div>
                `).join('')}

                <div style="display: flex; gap: 8px; margin-top: 16px;">
                    <button class="btn btn-default" style="flex: 1;" onclick="Home.toggleFavorite('${scenic.name}')">
                        ${isFav ? '⭐ 已收藏' : '☆ 收藏'}
                    </button>
                    <button class="btn btn-primary" style="flex: 1;" onclick="Home.addToTrip('${scenicId}')">
                        📌 加入行程
                    </button>
                </div>
            </div>
        `);
    },

    /**
     * 加入行程（详情页里的按钮）
     * 小白理解：把景点加到"想去的清单"里，并给用户引导
     *           加完后振动 + 更新角标
     */
    addToTrip(scenicId) {
        const scenic = Data.scenics.find(s => s.id === scenicId);
        if (!scenic) return;
        const copy = Utils.deepCopy(scenic);
        const success = AppStorage.addToTrip(copy);
        if (success) {
            Utils.toast('✓ 已加入行程，去「行程」页生成完整方案吧');
            Utils.vibrate([10]);
            if (typeof App !== 'undefined' && App.updateTabBadge) App.updateTabBadge();
            // 创新点：关闭弹窗前更新探索页对应卡片状态
            const btn = document.querySelector(`[data-scenic-id="${scenicId}"] .icon-btn`);
            if (btn) {
                btn.textContent = '✓';
                btn.style.background = 'var(--success)';
            }
            Utils.closeModal();
        } else {
            Utils.toast('该景点已在行程中');
            Utils.vibrate(5);
        }
    },

    /**
     * 切换收藏
     */
    toggleFavorite(name) {
        const scenic = Data.scenics.find(s => s.name === name);
        if (!scenic) return;
        const copy = Utils.deepCopy(scenic);
        const isFav = AppStorage.toggleFavorite(copy, 'scenic');
        Utils.toast(isFav ? '已收藏 ⭐' : '已取消收藏');
        // 刷新弹窗
        this.showScenicDetail(scenic.id);
    },

    onShow() {
        // 切换到首页时的回调
    }
};
