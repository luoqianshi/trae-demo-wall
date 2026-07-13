/* ============================================ */
/* ai.js - 智小程模块（Tab 5）                  */
/* 作用：AI对话、关键词匹配、模板回复            */
/* 状态：阶段7 将填充完整功能                    */
/* ============================================ */

window.AI = {
    currentCity: null,    // 当前对话上下文城市
    lastScenics: [],      // 上一次返回的景点列表（支持"第1个"等指代）
    lastFoods: [],        // 上一次返回的美食列表

    init() {
        this.render();
        this.loadHistory();
    },

    render() {
        const content = document.getElementById('ai-content');
        // 聊天页面特殊处理：让ai-content本身就是flex容器
        content.style.padding = '0';
        content.style.height = '100%';
        content.style.display = 'flex';
        content.style.flexDirection = 'column';
        content.style.minHeight = '0';

        content.innerHTML = `
            <!-- 顶部操作栏 -->
            <div style="display: flex; justify-content: flex-end; padding: 4px 12px; border-bottom: 1px solid var(--divider-color);">
                <button class="icon-btn" style="font-size: 12px; padding: 4px 8px;" onclick="AI.clearHistory()" title="清空对话">🗑️ 清空对话</button>
            </div>

            <!-- 消息列表（占满剩余空间） -->
            <div class="chat-messages" id="chat-messages">
                <div class="chat-bubble ai">👋 你好！我是智小程，你的旅游小助手 🤖
可以问我景点推荐、美食、天气、交通等问题哦！</div>
            </div>

            <!-- 快捷问题（创新点：根据当前旅程动态生成） -->
            <div class="quick-questions">
                ${this.getDynamicQuickQuestions().map(q => `
                    <button class="quick-question" onclick="AI.sendQuestion('${q.question}')">
                        ${q.icon} ${q.label}
                    </button>
                `).join('')}
            </div>

            <!-- 输入区域 -->
            <div class="chat-input-area">
                <button class="icon-btn" onclick="AI.voiceInput()" title="语音输入">🎤</button>
                <textarea id="chat-input" placeholder="输入你的问题..." rows="1"
                    onkeydown="if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();AI.sendMessage()}"></textarea>
                <button class="btn btn-primary" onclick="AI.sendMessage()">发送</button>
            </div>
        `;
    },

    loadHistory() {
        const history = AppStorage.getChatHistory();
        if (history.length > 0) {
            const container = document.getElementById('chat-messages');
            container.innerHTML = history.map(msg => {
                // AI消息可能是卡片式HTML，用户消息是纯文本
                if (msg.role === 'ai' && typeof msg.content === 'string' && msg.content.startsWith('<')) {
                    return `<div class="chat-bubble ${msg.role}">${msg.content}</div>`;
                }
                return `<div class="chat-bubble ${msg.role}">${Utils.escapeHtml(msg.content)}</div>`;
            }).join('');
            this.scrollToBottom();
        }
    },

    /**
     * 根据当前旅程动态生成快捷问题
     * 小白理解：如果用户已开启旅程，快捷问题就围绕旅程的城市；
     *           如果没有旅程，就用默认的快捷问题
     */
    getDynamicQuickQuestions() {
        const journey = AppStorage.getActiveJourney();
        if (journey && journey.cities.length > 0) {
            // 修复：展示所有旅程城市，不只用第一个
            const questions = [];
            journey.cities.slice(0, 2).forEach(city => {
                questions.push({ icon: '🏯', label: `${city}景点`, question: `${city}有什么景点` });
                questions.push({ icon: '🍽️', label: `${city}美食`, question: `${city}有什么美食` });
            });
            // 第一个城市的天气和交通
            const firstCity = journey.cities[0];
            questions.push({ icon: '🌤️', label: `${firstCity}天气`, question: `${firstCity}天气怎么样` });
            questions.push({ icon: '📋', label: '我的行程', question: '我的行程' });
            return questions;
        }
        return Data.quickQuestions;
    },

    /**
     * 清空对话历史
     * 小白理解：删除所有聊天记录，恢复到刚打开时的样子
     */
    clearHistory() {
        if (!confirm('确定要清空所有对话记录吗？')) return;
        AppStorage.clearChatHistory();
        const container = document.getElementById('chat-messages');
        if (container) {
            container.innerHTML = `<div class="chat-bubble ai">👋 对话已清空，有什么可以帮你的吗？</div>`;
        }
        Utils.toast('对话已清空');
    },

    sendMessage() {
        const input = document.getElementById('chat-input');
        const text = input.value.trim();
        if (!text) return;

        // 显示用户消息
        this.addMessage('user', text);
        input.value = '';

        // 保存到历史
        this.saveHistory('user', text);

        // 生成回复
        setTimeout(() => {
            const reply = this.generateReply(text);
            this.addMessage('ai', reply);
            this.saveHistory('ai', reply);
        }, 500);
    },

    sendQuestion(question) {
        document.getElementById('chat-input').value = question;
        this.sendMessage();
    },

    addMessage(role, content) {
        const container = document.getElementById('chat-messages');
        const bubble = document.createElement('div');
        bubble.className = 'chat-bubble ' + role;
        // 如果content是HTML字符串（卡片式回复），直接用innerHTML
        if (typeof content === 'string' && content.startsWith('<')) {
            bubble.innerHTML = content;
        } else {
            bubble.textContent = content;
        }
        container.appendChild(bubble);
        this.scrollToBottom();
    },

    saveHistory(role, content) {
        let history = AppStorage.getChatHistory();
        history.push({ role, content, time: Date.now() });
        // 只保留最近10轮（20条消息）
        history = history.slice(-20);
        AppStorage.setChatHistory(history);
    },

    generateReply(text) {
        // 阶段7将实现完整的关键词匹配逻辑
        // 这里先实现基础版本

        const keywords = Data.aiKeywords;
        let city = null;
        let intent = null;

        // 检测城市
        for (const c of keywords.cities) {
            if (text.includes(c)) {
                city = c;
                this.currentCity = c;
                break;
            }
        }
        // 如果没有城市，使用上一次的城市
        if (!city && this.currentCity) {
            city = this.currentCity;
        }

        // 检测意图
        if (keywords.scenics.some(k => text.includes(k))) intent = 'scenic';
        else if (keywords.foods.some(k => text.includes(k))) intent = 'food';
        else if (keywords.weather.some(k => text.includes(k))) intent = 'weather';
        else if (keywords.transport.some(k => text.includes(k))) intent = 'transport';
        else if (keywords.trip.some(k => text.includes(k))) intent = 'trip';

        // 生成回复
        if (!city && !intent) {
            return '抱歉，我还不太明白你的问题 😅\n试试问：\n• "成都有什么好玩的？"\n• "大理明天天气怎么样？"\n• "推荐个火锅店"';
        }

        if (intent === 'scenic' || (!intent && city)) {
            return this.replyScenics(city);
        }
        if (intent === 'food') {
            return this.replyFoods(city);
        }
        if (intent === 'weather') {
            return this.replyWeather(city);
        }
        if (intent === 'transport') {
            return this.replyTransport(city);
        }
        if (intent === 'trip') {
            return this.replyTrip();
        }

        return '我可以帮你查询景点、美食、天气、交通等信息，试试问我吧！';
    },

    replyScenics(city) {
        if (!city) return '请告诉我你想了解哪个城市的景点，比如"成都景点"';
        const scenics = Data.getScenicsByCity(city);
        this.lastScenics = scenics;
        // 创新点：卡片式回复，每个景点有"加入行程"按钮，可点击直接添加
        let html = `<div>${city}热门景点有 ${scenics.length} 个推荐 🏯<br><span style="font-size: 11px; color: var(--text-placeholder);">数据来源：携程/马蜂窝</span></div>`;
        html += scenics.map((s, i) => `
            <div style="background: var(--bg-page); border-radius: 8px; padding: 10px; margin: 8px 0;">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div style="flex: 1;">
                        <div style="font-size: 14px; font-weight: 600;">${i + 1}. ${s.icon} ${s.name}</div>
                        <div style="font-size: 11px; color: var(--text-secondary); margin-top: 3px;">
                            ⭐${s.rating} · ${Utils.formatPrice(s.price)} · ${s.type}
                        </div>
                        <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">
                            🚇 ${s.transport}
                        </div>
                    </div>
                </div>
                <button class="btn btn-primary" style="width: 100%; font-size: 12px; padding: 5px; margin-top: 6px;"
                    onclick="AI.quickAddScenic('${s.id}')">📌 加入行程</button>
            </div>
        `).join('');
        html += `<div style="font-size: 12px; color: var(--text-secondary); margin-top: 6px;">需要更多帮助吗？试试问"${city}美食"或"${city}天气"</div>`;
        return html;
    },

    replyFoods(city) {
        if (!city) return '请告诉我你想了解哪个城市的美食，比如"成都美食"';
        const foods = Data.getFoodsByCity(city);
        this.lastFoods = foods;
        // 卡片式回复
        let html = `<div>${city}的美食推荐 🍽️<br><span style="font-size: 11px; color: var(--text-placeholder);">数据来源：大众点评/小红书</span></div>`;
        html += foods.map((f, i) => `
            <div style="background: var(--bg-page); border-radius: 8px; padding: 10px; margin: 8px 0;">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div style="flex: 1;">
                        <div style="font-size: 14px; font-weight: 600;">${i + 1}. ${f.icon} ${f.name}</div>
                        <div style="font-size: 11px; color: var(--text-secondary); margin-top: 3px;">
                            ${f.cuisine} · ⭐${f.rating} · ¥${f.price} · ${f.area}
                        </div>
                        <div style="font-size: 11px; color: var(--warning); margin-top: 2px;">💡 ${f.tip}</div>
                    </div>
                </div>
                <button class="btn btn-primary" style="width: 100%; font-size: 12px; padding: 5px; margin-top: 6px;"
                    onclick="AI.quickAddFood('${f.name}')">📌 加入行程</button>
            </div>
        `).join('');
        return html;
    },

    /**
     * AI回复里快速加入景点到行程
     */
    quickAddScenic(scenicId) {
        const scenic = Data.scenics.find(s => s.id === scenicId);
        if (!scenic) return;
        const copy = Utils.deepCopy(scenic);
        const success = AppStorage.addToTrip(copy);
        Utils.vibrate(success ? [10] : 8);
        Utils.toast(success ? '✓ 已加入行程' : '已在行程中');
        if (typeof App !== 'undefined' && App.updateTabBadge) App.updateTabBadge();
    },

    /**
     * AI回复里快速加入美食到行程
     */
    quickAddFood(foodName) {
        const food = Data.foods.find(f => f.name === foodName);
        if (!food) return;
        const copy = Utils.deepCopy(food);
        copy.scenic = false;
        const success = AppStorage.addToTrip(copy);
        // 修复：同时加入收藏，使"美食猎人"徽章可解锁
        if (success && !AppStorage.isFavorited(foodName, 'food')) {
            AppStorage.toggleFavorite(copy, 'food');
        }
        Utils.vibrate(success ? [10] : 8);
        Utils.toast(success ? '✓ 已加入行程和收藏' : '已在行程中');
        if (typeof App !== 'undefined' && App.updateTabBadge) App.updateTabBadge();
    },

    replyWeather(city) {
        if (!city) return '请告诉我你想查询哪个城市的天气';
        const weather = Data.getWeather(city);
        if (!weather) return `暂无${city}的天气数据`;
        const c = weather.current;
        return `${city}当前 ${c.temp}°C ${c.desc} ${c.icon}\n湿度：${c.humidity}% · 风力：${c.wind}\n💡 ${weather.advice}`;
    },

    replyTransport(city) {
        if (!city) return '请告诉我出发地和目的地，比如"北京到成都怎么去"';
        const transport = Data.getCityTransport(city);
        if (transport.length === 0) return `暂无${city}的市内交通数据`;
        let list = transport.map(t => `• ${t.type}：${t.lines} ¥${t.price}（${t.time}）${t.eco ? ' 🌱低碳' : ''}`).join('\n');
        return `${city}市内交通方案：\n${list}`;
    },

    replyTrip() {
        const trips = AppStorage.getTrip();
        if (trips.length === 0) {
            return '你还没有添加任何景点到行程中。\n去首页搜索城市，点击景点加入行程吧！';
        }
        const totalDays = Math.ceil(trips.length / 2);
        return `你已保存 ${trips.length} 个景点，建议安排 ${totalDays} 天游览\n\n景点列表：\n${trips.map((s, i) => `${i + 1}. ${s.icon} ${s.name}（${s.city}）`).join('\n')}\n\n可以在"我的行程"页面点击"一键生成完整旅游安排"查看详细方案`;
    },

    voiceInput() {
        // 阶段7将实现语音输入
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            recognition.lang = 'zh-CN';
            recognition.onresult = (event) => {
                const text = event.results[0][0].transcript;
                document.getElementById('chat-input').value = text;
                this.sendMessage();
            };
            recognition.onerror = () => Utils.toast('语音识别失败，请重试');
            recognition.start();
            Utils.toast('🎤 请说话...');
        } else {
            Utils.toast('浏览器不支持语音输入');
        }
    },

    scrollToBottom() {
        const container = document.getElementById('chat-messages');
        container.scrollTop = container.scrollHeight;
    },

    /**
     * 主动建议检查（创新点：智小程根据用户情况主动提建议）
     * 小白理解：以前的智小程只会被动回答，现在会主动发现你的情况并给建议
     *           比如明天下雨就提醒你换室内景点，花费超了就提醒你省钱
     * @returns {object|null} 建议对象 {icon, title, content} 或 null
     */
    checkProactiveSuggestion() {
        const plan = AppStorage.getTravelPlan();
        const trips = AppStorage.getTrip();
        const journey = AppStorage.getActiveJourney();

        // 建议1：下雨天提醒换室内景点
        if (plan && plan.dailyPlans && plan.dailyPlans.length > 0) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowStr = Utils.formatDate(tomorrow);

            const tomorrowPlan = plan.dailyPlans.find(d => d.date === tomorrowStr);
            if (tomorrowPlan && tomorrowPlan.weather && tomorrowPlan.weather.current) {
                const desc = tomorrowPlan.weather.current.desc || '';
                const icon = tomorrowPlan.weather.current.icon || '';
                // 检测雨雪天气
                if (desc.includes('雨') || desc.includes('雪') || icon.includes('🌧') || icon.includes('❄')) {
                    // 查找该城市的室内景点
                    const indoorScenics = Data.getScenicsByCity(tomorrowPlan.to)
                        .filter(s => s.type === '室内' || s.category === '人文');
                    if (indoorScenics.length > 0) {
                        return {
                            icon: '🌧️',
                            title: '明天有雨，建议调整行程',
                            content: `明天${tomorrowPlan.to}天气：${desc}${icon}。\n\n建议把户外景点调整为室内景点：\n${indoorScenics.slice(0, 3).map(s => `· ${s.icon} ${s.name}（${s.type}）`).join('\n')}\n\n雨天也有别样风景哦～`
                        };
                    }
                }
            }
        }

        // 建议2：实际花费超预算70%提醒
        if (trips.length > 0) {
            const plannedCost = trips.reduce((sum, t) => sum + (t.price || 0), 0);
            const filledItems = trips.filter(t => t.actualCost !== null && t.actualCost !== undefined);
            if (filledItems.length > 0 && plannedCost > 0) {
                const actualCost = filledItems.reduce((sum, t) => sum + (t.actualCost || 0), 0);
                const ratio = actualCost / plannedCost;
                if (ratio >= 0.7 && ratio < 1) {
                    const overAmount = (plannedCost * (ratio - 0.7)).toFixed(0);
                    return {
                        icon: '💰',
                        title: '花费提醒：已用预算70%',
                        content: `当前实际花费 ¥${actualCost.toFixed(1)}，预算 ¥${plannedCost}。\n\n已花费预算的 ${(ratio * 100).toFixed(0)}%，超预算预警线 ¥${overAmount}。\n\n建议接下来几天控制一下开销，比如：\n· 选择免费景点\n· 尝试当地小吃而非大餐\n· 步行或公交代替打车`
                    };
                }
            }
        }

        // 建议3：今日打卡少，建议多去走走
        if (trips.length > 0 && journey) {
            const today = Utils.formatDate(new Date());
            const todayChecked = trips.filter(t => t.checked && t.checkTime && Utils.formatDate(new Date(t.checkTime)) === today);
            const totalChecked = trips.filter(t => t.checked).length;
            // 有行程且今日打卡少于1个，且总打卡数大于0（已经开始旅行）
            if (todayChecked.length === 0 && totalChecked > 0) {
                const unchecked = trips.filter(t => !t.checked);
                if (unchecked.length > 0) {
                    return {
                        icon: '📍',
                        title: '今天还没打卡哦',
                        content: `你的行程中还有 ${unchecked.length} 个景点待打卡。\n\n今天要去哪里呢？\n${unchecked.slice(0, 3).map(t => `· ${t.icon} ${t.name}（${t.city}）`).join('\n')}\n\n${unchecked.length > 3 ? `还有${unchecked.length - 3}个...` : ''}加油打卡吧！`
                    };
                }
            }
        }

        // 建议4：旅程刚开始，引导生成出行方案
        if (journey && trips.length > 0) {
            const savedPlan = AppStorage.getTravelPlan();
            const hasPlan = savedPlan && savedPlan.dailyPlans && savedPlan.dailyPlans.length > 0;
            if (!hasPlan && trips.length >= 2) {
                return {
                    icon: '🚄',
                    title: '景点已收藏，该规划路线啦',
                    content: `你已经添加了 ${trips.length} 个景点到行程。\n\n建议去"行程"页面点击"生成出行方案"，我会帮你：\n· 自动规划每天去哪些景点\n· 推荐交通方式\n· 预估花费预算\n\n让旅行更有条理～`
                };
            }
        }

        return null;
    },

    /**
     * 显示主动建议（在AI聊天界面顶部插入一条建议消息）
     * 小白理解：切到智小程页面时，如果有建议就在聊天里显示一条"智小程的建议"
     */
    showProactiveSuggestion() {
        const suggestion = this.checkProactiveSuggestion();
        if (!suggestion) return;

        // 修复：用数组记录当天已展示的所有建议标题，避免不同建议互相覆盖
        const today = Utils.formatDate(new Date());
        const lastSuggestionDate = AppStorage.get('lastSuggestionDate');
        let shownTitles = AppStorage.get('lastSuggestionTitles') || [];
        if (lastSuggestionDate !== today) {
            // 新的一天，重置记录
            shownTitles = [];
        }
        if (shownTitles.includes(suggestion.title)) {
            return;  // 今天已显示过相同建议
        }

        // 记录已显示
        AppStorage.set('lastSuggestionDate', today);
        shownTitles.push(suggestion.title);
        AppStorage.set('lastSuggestionTitles', shownTitles);

        // 修复：先清理旧的主动建议，避免累积
        const container = document.getElementById('chat-messages');
        if (!container) return;
        const oldSuggestions = container.querySelectorAll('.proactive-suggestion');
        oldSuggestions.forEach(el => el.remove());

        // 在聊天界面插入建议消息
        const suggestionHTML = `
            <div class="chat-bubble ai proactive-suggestion" style="background: linear-gradient(135deg, rgba(255,215,0,0.08), rgba(255,165,0,0.08)); border: 1px solid rgba(255,165,0,0.3);">
                <div style="font-size: 13px; font-weight: 600; color: var(--warning); margin-bottom: 6px;">
                    ${suggestion.icon} 智小程的建议 · ${suggestion.title}
                </div>
                <div style="font-size: 13px; color: var(--text-primary); white-space: pre-line; line-height: 1.6;">
                    ${Utils.escapeHtml(suggestion.content)}
                </div>
            </div>
        `;
        container.insertAdjacentHTML('afterbegin', suggestionHTML);
        Utils.vibrate([10, 30, 10]);
    },

    onShow() {
        // 切到AI页时检查是否有主动建议（创新点）
        setTimeout(() => this.showProactiveSuggestion(), 500);
    }
};
