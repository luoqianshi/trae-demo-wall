/* ============================================ */
/* settings.js - 设置模块                      */
/* 作用：字体大小、深色模式、清除缓存等          */
/* ============================================ */

window.Settings = {

    init() {
        // 绑定设置按钮事件已在 app.js 中处理
    },

    show() {
        const fontSize = AppStorage.get('fontSize') || 'medium';
        const isDark = AppStorage.get('darkMode') === true;

        Utils.showModal(`
            <div style="padding: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 style="font-size: 18px;">⚙️ 设置</h2>
                    <button class="icon-btn" onclick="Utils.closeModal()">✕</button>
                </div>

                <!-- 字体大小 -->
                <div style="margin-bottom: 20px;">
                    <div style="font-size: 14px; font-weight: 600; margin-bottom: 10px;">字体大小</div>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn ${fontSize === 'small' ? 'btn-primary' : 'btn-default'}" style="flex: 1;" onclick="Settings.setFontSize('small')">小</button>
                        <button class="btn ${fontSize === 'medium' ? 'btn-primary' : 'btn-default'}" style="flex: 1;" onclick="Settings.setFontSize('medium')">中</button>
                        <button class="btn ${fontSize === 'large' ? 'btn-primary' : 'btn-default'}" style="flex: 1;" onclick="Settings.setFontSize('large')">大</button>
                    </div>
                </div>

                <!-- 深色模式 -->
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-top: 1px solid var(--divider-color);">
                    <div>
                        <div style="font-size: 14px; font-weight: 600;">🌙 深色模式</div>
                        <div style="font-size: 12px; color: var(--text-secondary);">夜间使用更护眼</div>
                    </div>
                    <button class="btn ${isDark ? 'btn-primary' : 'btn-default'}" onclick="Settings.toggleDark()">
                        ${isDark ? '已开启' : '已关闭'}
                    </button>
                </div>

                <!-- 出发通知提醒（创新点：浏览器通知） -->
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-top: 1px solid var(--divider-color);">
                    <div>
                        <div style="font-size: 14px; font-weight: 600;">🔔 出发提醒</div>
                        <div style="font-size: 12px; color: var(--text-secondary);">出发前一天浏览器通知提醒</div>
                    </div>
                    <button class="btn btn-default" onclick="App.requestNotifyPermission()">${('Notification' in window && Notification.permission === 'granted') ? '✓ 已开启' : '开启'}</button>
                </div>

                <!-- 清除缓存 -->
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-top: 1px solid var(--divider-color);">
                    <div>
                        <div style="font-size: 14px; font-weight: 600;">🗑️ 清除缓存</div>
                        <div style="font-size: 12px; color: var(--text-secondary);">清除浏览历史（不影响行程和收藏）</div>
                    </div>
                    <button class="btn btn-default" onclick="Settings.clearCache()">清除</button>
                </div>

                <!-- 关于 -->
                <div style="padding: 12px 0; border-top: 1px solid var(--divider-color);">
                    <div style="font-size: 14px; font-weight: 600; margin-bottom: 4px;">📱 关于旅简</div>
                    <div style="font-size: 12px; color: var(--text-secondary);">版本 1.0.0</div>
                    <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">一站式智能旅游规划助手</div>
                </div>

                <!-- 旅程管理入口（创新点：在设置中管理旅程） -->
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-top: 1px solid var(--divider-color);">
                    <div>
                        <div style="font-size: 14px; font-weight: 600;">🧳 旅程管理</div>
                        <div style="font-size: 12px; color: var(--text-secondary);">开启/结束/修改你的旅程</div>
                    </div>
                    <button class="btn btn-default" onclick="Utils.closeModal();setTimeout(()=>Journey.showManage(),200)">打开</button>
                </div>

                <!-- 成就徽章入口（创新点：游戏化成就系统） -->
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-top: 1px solid var(--divider-color);">
                    <div>
                        <div style="font-size: 14px; font-weight: 600;">🏅 成就徽章</div>
                        <div style="font-size: 12px; color: var(--text-secondary);">查看你的旅行成就和风格画像</div>
                    </div>
                    <button class="btn btn-default" onclick="Utils.closeModal();setTimeout(()=>Badges.showBadgeWall(),200)">查看</button>
                </div>
            </div>
        `);
    },

    setFontSize(size) {
        // 移除旧的字体类
        document.body.classList.remove('font-small', 'font-medium', 'font-large');
        // 添加新的字体类
        document.body.classList.add('font-' + size);
        AppStorage.set('fontSize', size);
        Utils.toast('字体大小已设置');
        this.show();  // 刷新弹窗
    },

    toggleDark() {
        const isDark = document.body.classList.toggle('dark');
        AppStorage.set('darkMode', isDark);
        Utils.toast(isDark ? '深色模式已开启' : '深色模式已关闭');
        this.show();
    },

    clearCache() {
        AppStorage.clearSearchHistory();
        AppStorage.clearChatHistory();
        AppStorage.remove('browseHistory');
        AppStorage.clearTravelPlan();

        // 同步清除各模块内存中的数据，保持一致
        Travel._dailyPlans = [];
        Travel._planGenerated = false;
        Travel.stations = ['', ''];

        // 如果AI页已渲染，清空聊天界面
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages) {
            chatMessages.innerHTML = `<div class="chat-bubble ai">👋 你好！我是智小程，你的旅游小助手 🤖
可以问我景点推荐、美食、天气、交通等问题哦！</div>`;
        }

        Utils.toast('缓存已清除');
    },

    showHistory() {
        const searchHistory = AppStorage.getSearchHistory();
        const browseHistory = AppStorage.getBrowseHistory();

        Utils.showModal(`
            <div style="padding: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 style="font-size: 18px;">📜 历史记录</h2>
                    <div style="display: flex; gap: 8px;">
                        ${(searchHistory.length > 0 || browseHistory.length > 0) ? `
                            <button class="btn-text" style="font-size: 13px;" onclick="AppStorage.clearSearchHistory();AppStorage.remove('browseHistory');Utils.toast('已清除');Settings.showHistory();">清除全部</button>
                        ` : ''}
                        <button class="icon-btn" onclick="Utils.closeModal()">✕</button>
                    </div>
                </div>

                <!-- 搜索历史 -->
                <div style="margin-bottom: 20px;">
                    <div style="font-size: 14px; font-weight: 600; margin-bottom: 10px;">🔍 搜索历史</div>
                    ${searchHistory.length === 0 ? `
                        <div style="font-size: 13px; color: var(--text-placeholder);">暂无搜索记录</div>
                    ` : searchHistory.map(k => `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--divider-color);">
                            <span style="font-size: 14px;" onclick="Utils.closeModal();Home.searchCity('${k}');">${k}</span>
                        </div>
                    `).join('')}
                </div>

                <!-- 浏览历史 -->
                <div>
                    <div style="font-size: 14px; font-weight: 600; margin-bottom: 10px;">👁️ 浏览历史</div>
                    ${browseHistory.length === 0 ? `
                        <div style="font-size: 13px; color: var(--text-placeholder);">暂无浏览记录</div>
                    ` : browseHistory.slice(0, 10).map(h => `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--divider-color);">
                            <span style="font-size: 14px;">${h.icon || '📌'} ${h.name}</span>
                            <span style="font-size: 11px; color: var(--text-placeholder);">${Utils.timeAgo(h.browseTime)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `);
    }
};
