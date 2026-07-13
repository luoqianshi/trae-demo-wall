/* ============================================ */
/* badges.js - 成就徽章 & 旅行风格画像模块       */
/* 作用：根据用户旅行数据自动生成徽章和风格标签   */
/* 小白理解：就像游戏里的成就系统，旅行越多解锁越多 */
/* ============================================ */

window.Badges = {

    /**
     * 所有徽章定义
     * 小白理解：这里定义了所有可能获得的徽章，每个徽章有检查条件
     * condition 函数返回 true 表示已解锁
     */
    definitions: [
        {
            id: 'firstTrip',
            icon: '🗺️',
            name: '初出茅庐',
            desc: '完成第一次旅行',
            condition: (stats) => stats.journeyCount >= 1
        },
        {
            id: 'threeTrips',
            icon: '🎒',
            name: '旅行达人',
            desc: '完成3次旅行',
            condition: (stats) => stats.journeyCount >= 3
        },
        {
            id: 'fiveTrips',
            icon: '👑',
            name: '环球旅行家',
            desc: '完成5次旅行',
            condition: (stats) => stats.journeyCount >= 5
        },
        {
            id: 'firstCheckin',
            icon: '📍',
            name: '首次打卡',
            desc: '打卡第一个景点',
            condition: (stats) => stats.totalChecked >= 1
        },
        {
            id: 'checkin10',
            icon: '✅',
            name: '打卡收集者',
            desc: '累计打卡10个景点',
            condition: (stats) => stats.totalChecked >= 10
        },
        {
            id: 'checkin30',
            icon: '🏆',
            name: '打卡狂魔',
            desc: '累计打卡30个景点',
            condition: (stats) => stats.totalChecked >= 30
        },
        {
            id: 'crossCity3',
            icon: '🚄',
            name: '纵横四海',
            desc: '一次旅程跨越3个城市',
            condition: (stats) => stats.maxCitiesInJourney >= 3
        },
        {
            id: 'budgetSaver',
            icon: '💰',
            name: '精打细算',
            desc: '实际花费比预算节省20%以上',
            condition: (stats) => stats.bestSavingRate >= 0.2
        },
        {
            id: 'foodie',
            icon: '🍜',
            name: '美食猎人',
            desc: '收藏5个以上美食',
            condition: (stats) => stats.foodFavorites >= 5
        },
        {
            id: 'planner',
            icon: '📋',
            name: '规划能手',
            desc: '生成3次出行方案',
            condition: (stats) => stats.planGeneratedCount >= 3
        },
        {
            id: 'spontaneous',
            icon: '⚡',
            name: '洒脱旅人',
            desc: '当天开启旅程当天出发',
            condition: (stats) => stats.hasSpontaneousTrip === true
        },
        {
            id: 'explorer',
            icon: '🧭',
            name: '足迹探索者',
            desc: '去过5个不同的城市',
            condition: (stats) => stats.uniqueCities >= 5
        }
    ],

    /**
     * 风格标签定义
     * 小白理解：根据用户的旅行习惯，给用户打上有趣的"标签"
     */
    styleDefinitions: [
        {
            id: 'culture',
            icon: '🏛️',
            name: '文化探索者',
            desc: '偏爱历史人文景点',
            condition: (stats) => {
                if (stats.totalChecked === 0) return false;
                return stats.cultureRatio >= 0.4;
            }
        },
        {
            id: 'foodie',
            icon: '🍲',
            name: '美食猎人',
            desc: '每城必打卡当地美食',
            condition: (stats) => stats.foodFavorites >= 5
        },
        {
            id: 'budget',
            icon: '💰',
            name: '理性消费派',
            desc: '实际花费常低于预算',
            condition: (stats) => stats.avgSavingRate > 0
        },
        {
            id: 'efficient',
            icon: '⚡',
            name: '高效打卡王',
            desc: '单日打卡超3个景点',
            condition: (stats) => stats.maxDailyCheckin >= 3
        },
        {
            id: 'slowTravel',
            icon: '🍵',
            name: '慢旅行者',
            desc: '偏爱深度游，单城停留2天以上',
            condition: (stats) => stats.avgCityStay >= 2
        },
        {
            id: 'multiCity',
            icon: '🚄',
            name: '纵横驰骋',
            desc: '一次旅程跨越多个城市',
            condition: (stats) => stats.maxCitiesInJourney >= 3
        },
        {
            id: 'island',
            icon: '🏝️',
            name: '海岛度假控',
            desc: '去过三亚、厦门等海滨城市',
            condition: (stats) => stats.hasVisitedBeach === true
        },
        {
            id: 'novice',
            icon: '🌱',
            name: '旅行新手',
            desc: '刚刚开启旅行之路',
            condition: (stats) => stats.journeyCount <= 1 && stats.totalChecked < 5
        }
    ],

    init() {
        // 模块初始化时无需操作，数据按需计算
    },

    /**
     * 收集用户旅行统计数据
     * 小白理解：把用户所有的旅行数据汇总起来，用来判断能解锁哪些徽章
     * @returns {object} 统计数据对象
     */
    collectStats() {
        const history = AppStorage.getJourneyHistory();
        const active = AppStorage.getActiveJourney();
        const trips = AppStorage.getTrip();
        const favorites = AppStorage.getFavorites();
        const plan = AppStorage.getTravelPlan();

        const stats = {
            journeyCount: AppStorage.getJourneyCount(),
            totalChecked: 0,
            maxCitiesInJourney: 0,
            bestSavingRate: 0,
            avgSavingRate: 0,
            foodFavorites: favorites.filter(f => f.type === 'food').length,
            planGeneratedCount: 0,
            hasSpontaneousTrip: false,
            uniqueCities: new Set(),
            cultureRatio: 0,
            maxDailyCheckin: 0,
            avgCityStay: 0,
            hasVisitedBeach: false
        };

        // 海滨城市列表
        const beachCities = ['三亚', '厦门', '青岛', '大连', '北海'];

        // 统计历史旅程
        let totalSavingRate = 0;
        let savingJourneyCount = 0;
        let allCityStays = [];

        history.forEach(journey => {
            // 最大单次旅程城市数
            if (journey.cities && journey.cities.length > stats.maxCitiesInJourney) {
                stats.maxCitiesInJourney = journey.cities.length;
            }

            // 唯一城市数
            if (journey.cities) {
                journey.cities.forEach(c => stats.uniqueCities.add(c));
                // 检查海滨城市
                if (journey.cities.some(c => beachCities.includes(c))) {
                    stats.hasVisitedBeach = true;
                }
            }

            // 是否说走就走（创建时间与出发日期同一天）
            if (journey.memories && journey.memories.travelPlan && journey.memories.travelPlan.startDate) {
                const createDate = Utils.formatDate(new Date(journey.createTime));
                if (createDate === journey.memories.travelPlan.startDate) {
                    stats.hasSpontaneousTrip = true;
                }
            }

            // 从回忆数据统计打卡和花费
            if (journey.memories && journey.memories.tripItems) {
                const items = journey.memories.tripItems;
                const checked = items.filter(t => t.checked);
                stats.totalChecked += checked.length;

                // 花费节省率
                const planned = items.reduce((sum, t) => sum + (t.price || 0), 0);
                const actual = items.reduce((sum, t) => sum + (t.actualCost || 0), 0);
                if (planned > 0 && actual > 0) {
                    const rate = (planned - actual) / planned;
                    if (rate > stats.bestSavingRate) stats.bestSavingRate = rate;
                    totalSavingRate += rate;
                    savingJourneyCount++;
                }

                // 文化景点比例（category为人文）
                const cultureItems = items.filter(t => t.category === '人文' || t.type === '室内');
                if (items.length > 0) {
                    stats.cultureRatio = Math.max(stats.cultureRatio, cultureItems.length / items.length);
                }
            }

            // 平均单城停留天数
            if (journey.memories && journey.memories.travelPlan && journey.memories.travelPlan.dailyPlans) {
                const cityDays = {};
                journey.memories.travelPlan.dailyPlans.forEach(d => {
                    if (d.to) {
                        cityDays[d.to] = (cityDays[d.to] || 0) + 1;
                    }
                });
                Object.values(cityDays).forEach(days => allCityStays.push(days));
            } else if (journey.memories && journey.memories.tripItems) {
                // 修复：未生成出行方案时，从打卡记录按城市聚合天数作为兜底
                const cityDays = {};
                journey.memories.tripItems.filter(t => t.checked && t.checkTime).forEach(t => {
                    if (t.city) {
                        const day = Utils.formatDate(new Date(t.checkTime));
                        const key = t.city + '|' + day;
                        cityDays[key] = true;
                    }
                });
                const cityCount = {};
                Object.keys(cityDays).forEach(key => {
                    const city = key.split('|')[0];
                    cityCount[city] = (cityCount[city] || 0) + 1;
                });
                Object.values(cityCount).forEach(days => allCityStays.push(days));
            }
        });

        // 当前进行中的旅程数据
        if (active && active.cities) {
            if (active.cities.length > stats.maxCitiesInJourney) {
                stats.maxCitiesInJourney = active.cities.length;
            }
            active.cities.forEach(c => {
                stats.uniqueCities.add(c);
                if (beachCities.includes(c)) stats.hasVisitedBeach = true;
            });
        }

        // 当前行程中的打卡数据
        const currentChecked = trips.filter(t => t.checked);
        stats.totalChecked += currentChecked.length;

        // 单日最大打卡数
        const checkinByDay = {};
        currentChecked.forEach(t => {
            if (t.checkTime) {
                const day = Utils.formatDate(new Date(t.checkTime));
                checkinByDay[day] = (checkinByDay[day] || 0) + 1;
            }
        });
        stats.maxDailyCheckin = Math.max(0, ...Object.values(checkinByDay));

        // 平均节省率
        stats.avgSavingRate = savingJourneyCount > 0 ? totalSavingRate / savingJourneyCount : 0;

        // 平均单城停留天数
        stats.avgCityStay = allCityStays.length > 0
            ? allCityStays.reduce((a, b) => a + b, 0) / allCityStays.length
            : 0;

        // 出行方案生成次数
        stats.planGeneratedCount = AppStorage.get('planGeneratedCount') || 0;

        // 转换Set为数量
        stats.uniqueCities = stats.uniqueCities.size;

        return stats;
    },

    /**
     * 获取已解锁的徽章列表
     * @returns {Array} 已解锁徽章数组
     */
    getUnlockedBadges() {
        const stats = this.collectStats();
        return this.definitions.filter(badge => badge.condition(stats));
    },

    /**
     * 获取用户风格标签
     * @returns {Array} 风格标签数组
     */
    getStyleTags() {
        const stats = this.collectStats();
        return this.styleDefinitions.filter(style => style.condition(stats));
    },

    /**
     * 检查是否有新解锁的徽章并提示
     * 小白理解：每次打卡或结束旅程后调用，如果解锁了新徽章就弹通知
     */
    checkNewBadges() {
        const unlocked = this.getUnlockedBadges();
        const unlockedIds = unlocked.map(b => b.id);
        const knownIds = AppStorage.get('knownBadges') || [];

        // 找出新解锁的徽章
        const newBadges = unlockedIds.filter(id => !knownIds.includes(id));

        if (newBadges.length > 0) {
            // 更新已知徽章列表
            AppStorage.set('knownBadges', unlockedIds);

            // 修复：多个徽章同时解锁时全部提示
            const newBadgeObjs = newBadges.map(id => this.definitions.find(b => b.id === id)).filter(Boolean);
            if (newBadgeObjs.length > 0) {
                Utils.vibrate([10, 50, 10, 50, 30]);
                if (newBadgeObjs.length === 1) {
                    Utils.toast(`🏅 解锁新成就：${newBadgeObjs[0].name}！`);
                } else {
                    Utils.toast(`🎉 解锁 ${newBadgeObjs.length} 个新成就：${newBadgeObjs.map(b => b.name).join('、')}！`);
                }
            }
        }
    },

    /**
     * 显示徽章墙弹窗
     * 小白理解：展示用户所有徽章，已解锁的高亮，未解锁的灰色
     */
    showBadgeWall() {
        const stats = this.collectStats();
        const unlocked = this.getUnlockedBadges();
        const unlockedIds = unlocked.map(b => b.id);

        Utils.vibrate(8);
        Utils.showModal(`
            <div style="padding: 20px; max-height: 85vh; overflow-y: auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <h2 style="font-size: 18px;">🏅 成就徽章</h2>
                    <button class="icon-btn" onclick="Utils.closeModal()">✕</button>
                </div>

                <!-- 徽章统计 -->
                <div style="text-align: center; padding: 16px; background: linear-gradient(135deg, rgba(255,215,0,0.1), rgba(255,165,0,0.1)); border-radius: var(--radius-md); margin-bottom: 16px;">
                    <div style="font-size: 28px; font-weight: 700; color: var(--warning);">
                        ${unlocked.length} / ${this.definitions.length}
                    </div>
                    <div style="font-size: 12px; color: var(--text-secondary);">已解锁徽章</div>
                    <div style="height: 6px; background: var(--divider-color); border-radius: 3px; overflow: hidden; margin-top: 10px;">
                        <div style="height: 100%; width: ${(unlocked.length / this.definitions.length * 100)}%; background: linear-gradient(90deg, #ffd700, #ffa500); border-radius: 3px; transition: width 0.5s;"></div>
                    </div>
                </div>

                <!-- 徽章网格 -->
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
                    ${this.definitions.map(badge => {
                        const isUnlocked = unlockedIds.includes(badge.id);
                        return `
                            <div style="text-align: center; padding: 12px 8px; border-radius: var(--radius-sm); ${isUnlocked ? 'background: var(--bg-card); box-shadow: var(--shadow-sm);' : 'background: var(--bg-page); opacity: 0.5;'}">
                                <div style="font-size: 32px; ${isUnlocked ? '' : 'filter: grayscale(1);'}">${isUnlocked ? badge.icon : '🔒'}</div>
                                <div style="font-size: 11px; font-weight: 600; margin-top: 4px;">${badge.name}</div>
                                <div style="font-size: 10px; color: var(--text-secondary); margin-top: 2px;">${badge.desc}</div>
                            </div>
                        `;
                    }).join('')}
                </div>

                <!-- 风格画像 -->
                <div style="margin-top: 20px;">
                    <div style="font-size: 15px; font-weight: 600; margin-bottom: 10px;">🎯 你的旅行风格</div>
                    ${this.renderStyleTags(stats)}
                </div>
            </div>
        `);
    },

    /**
     * 渲染风格标签HTML
     * @param {object} stats - 统计数据
     * @returns {string} HTML
     */
    renderStyleTags(stats) {
        const tags = this.getStyleTags();
        if (tags.length === 0) {
            return '<div style="font-size: 12px; color: var(--text-placeholder); text-align: center; padding: 16px;">完成更多旅行来解锁你的风格标签</div>';
        }
        return `
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                ${tags.map(tag => `
                    <div style="display: flex; align-items: center; gap: 4px; padding: 6px 12px; background: linear-gradient(135deg, rgba(24,144,255,0.1), rgba(82,196,26,0.1)); border-radius: 20px; border: 1px solid var(--primary);">
                        <span style="font-size: 16px;">${tag.icon}</span>
                        <div>
                            <div style="font-size: 12px; font-weight: 600;">${tag.name}</div>
                            <div style="font-size: 10px; color: var(--text-secondary);">${tag.desc}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
};
