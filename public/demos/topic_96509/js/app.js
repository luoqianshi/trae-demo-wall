/**
 * 合规雷达 v3.0 - 具身智能法规导航台
 * 前端主逻辑：级联选择 + 动态加载 JSON 数据并过滤展示
 */

(function () {
    'use strict';

    // State
    let regulationsData = null;
    let selectedRobot = null;
    let selectedMarket = null;
    let selectedCategory = null;

    // DOM elements
    const step1 = document.getElementById('step-1');
    const step2 = document.getElementById('step-2');
    const step3 = document.getElementById('step-3');
    const marketOptions = document.getElementById('market-options');
    const robotOptions = document.getElementById('robot-options');
    const categoryOptions = document.getElementById('category-options');
    const resultsSection = document.getElementById('results-section');
    const welcomeSection = document.getElementById('welcome-section');
    const resultsContainer = document.getElementById('results-container');
    const resultCount = document.getElementById('result-count');
    const restartBtn = document.getElementById('restart-btn');

    // Market display config
    const marketConfig = {
        'CN': { flag: '🇨🇳', label: '中国' },
        'EU': { flag: '🇪🇺', label: '欧盟' },
        'US': { flag: '🇺🇸', label: '美国' },
        'JP': { flag: '🇯🇵', label: '日本' }
    };

    // Category icons
    const categoryIcons = {
        '安全': '🔒',
        '信息安全': '🔐',
        'EMC': '📡',
        '功能安全': '⚙️',
        'AI伦理': '🧠',
        '环保': '🌱',
        '认证': '📋'
    };

    /**
     * 加载法规数据
     */
    async function loadData() {
        try {
            const response = await fetch('data/regulations.json');
            if (!response.ok) throw new Error('数据加载失败');
            regulationsData = await response.json();
            console.log('法规数据加载成功:', regulationsData.statistics);
        } catch (error) {
            console.error('加载数据失败:', error);
        }
    }

    /**
     * 获取符合当前选择的法规子集（按市场+机器人类型筛选）
     */
    function getFilteredByMarketAndRobot() {
        if (!regulationsData) return [];
        return regulationsData.regulations.filter(reg => {
            // Market filter
            const marketMatch = !selectedMarket ||
                (reg.market && reg.market.includes(selectedMarket));
            if (!marketMatch) return false;

            // Robot type filter
            const robotMatch = !selectedRobot ||
                (reg.robot_category && reg.robot_category.includes(selectedRobot)) ||
                (reg.robot_form && reg.robot_form.includes(selectedRobot));
            if (!robotMatch) return false;

            return true;
        });
    }

    /**
     * 级联：根据市场，计算可用机器人类型
     */
    function getAvailableRobots() {
        if (!regulationsData) return [];
        const filtered = regulationsData.regulations.filter(reg => {
            if (!selectedMarket) return true;
            return reg.market && reg.market.includes(selectedMarket);
        });

        const robots = new Set();
        filtered.forEach(reg => {
            (reg.robot_category || []).forEach(r => robots.add(r));
            (reg.robot_form || []).forEach(r => robots.add(r));
        });

        const order = ['humanoid', 'service', 'industrial', 'medical'];
        return order.filter(r => robots.has(r));
    }

    /**
     * 级联：根据市场+机器人类型，计算可用类别
     */
    function getAvailableCategories() {
        const filtered = getFilteredByMarketAndRobot();
        const categories = new Set();
        filtered.forEach(reg => {
            if (reg.category) categories.add(reg.category);
        });

        const order = ['安全', '信息安全', 'EMC', '功能安全', 'AI伦理', '环保', '认证'];
        return order.filter(c => categories.has(c));
    }

    // Robot type icons
    const robotIcons = {
        'humanoid': '🤖',
        'service': '🏠',
        'industrial': '🏭',
        'medical': '🏥'
    };

    const robotLabels = {
        'humanoid': '人形机器人',
        'service': '服务机器人',
        'industrial': '工业机器人',
        'medical': '医疗机器人'
    };

    /**
     * 渲染选项按钮
     */
    function renderOptions(container, items, stepNum, type) {
        container.innerHTML = '';
        items.forEach(item => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.dataset.value = item;
            btn.dataset.step = stepNum;

            let icon = '', label = '';
            if (type === 'market') {
                const cfg = marketConfig[item] || { flag: '🌐', label: item };
                icon = cfg.flag;
                label = cfg.label;
            } else if (type === 'robot') {
                icon = robotIcons[item] || '🤖';
                label = robotLabels[item] || item;
            } else if (type === 'category') {
                icon = categoryIcons[item] || '📄';
                label = item;
            }

            btn.innerHTML = `<span class="option-icon">${icon}</span><span class="option-label">${label}</span>`;
            container.appendChild(btn);
        });

        // Bind click events
        container.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', handleOptionClick);
        });
    }

    /**
     * 处理选项点击
     */
    function handleOptionClick(e) {
        const btn = e.currentTarget;
        const step = parseInt(btn.dataset.step);
        const value = btn.dataset.value;

        if (step === 1) {
            selectedMarket = value;
            step1.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');

            const robots = getAvailableRobots();
            renderOptions(robotOptions, robots, 2, 'robot');

            activateStep(step2);
            deactivateStep(step3);
            hideResults();
        } else if (step === 2) {
            selectedRobot = value;
            step2.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');

            const categories = getAvailableCategories();
            renderOptions(categoryOptions, categories, 3, 'category');

            activateStep(step3);
            hideResults();

            doSearch();
        } else if (step === 3) {
            selectedCategory = value;
            step3.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');

            doSearch();
        }
    }

    /**
     * Step 状态管理
     */
    function activateStep(stepEl) {
        stepEl.classList.remove('disabled');
        stepEl.classList.add('active');
    }

    function deactivateStep(stepEl) {
        stepEl.classList.add('disabled');
        stepEl.classList.remove('active');
        stepEl.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
    }

    function resetFromStep(fromStep) {
        if (fromStep <= 2) {
            selectedRobot = null;
            selectedCategory = null;
            deactivateStep(step2);
            deactivateStep(step3);
            robotOptions.innerHTML = '';
            categoryOptions.innerHTML = '';
        }
        if (fromStep <= 3) {
            selectedCategory = null;
            deactivateStep(step3);
            categoryOptions.innerHTML = '';
        }
        hideResults();
    }

    /**
     * 执行搜索并显示结果
     */
    function doSearch() {
        if (!regulationsData) return;

        welcomeSection.classList.add('hidden');
        resultsSection.classList.remove('hidden');

        const results = regulationsData.regulations.filter(reg => {
            // Robot type
            const robotMatch = !selectedRobot ||
                (reg.robot_category && reg.robot_category.includes(selectedRobot)) ||
                (reg.robot_form && reg.robot_form.includes(selectedRobot));
            if (!robotMatch) return false;

            // Market
            const marketMatch = !selectedMarket ||
                (reg.market && reg.market.includes(selectedMarket));
            if (!marketMatch) return false;

            // Category
            const categoryMatch = !selectedCategory ||
                reg.category === selectedCategory;
            if (!categoryMatch) return false;

            return true;
        });

        renderResults(results);
    }

    function hideResults() {
        resultsSection.classList.add('hidden');
        welcomeSection.classList.remove('hidden');
    }

    /**
     * 获取级别标签
     */
    function getLevelLabel(level) {
        const labels = { 'must': '强制执行', 'should': '推荐执行', 'may': '参考执行' };
        return labels[level] || level;
    }

    function getLevelClass(level) {
        const classes = { 'must': 'must', 'recommended': 'should', 'should': 'should', 'industry': 'may', 'may': 'may' };
        return classes[level] || 'may';
    }

    /**
     * 渲染结果
     */
    function renderResults(results) {
        if (results.length === 0) {
            resultsContainer.innerHTML = `
                <div class="no-results">
                    <p>😅 未找到符合条件的法规标准</p>
                    <p>请尝试调整筛选条件</p>
                </div>
            `;
            resultCount.textContent = '0 条结果';
            return;
        }

        const html = results.map((reg, index) => `
            <div class="regulation-card ${getLevelClass(reg.level)}" style="animation-delay: ${index * 0.1}s">
                <div class="reg-header">
                    <span class="reg-id">${reg.id}</span>
                    <span class="reg-level ${getLevelClass(reg.level)}">${getLevelLabel(reg.level)}</span>
                </div>
                <h3 class="reg-name">${reg.name}</h3>
                <p class="reg-summary">${reg.summary || '暂无摘要'}</p>
                <div class="reg-meta">
                    <span class="meta-tag">📂 ${reg.category}</span>
                    <span class="meta-tag">🌍 ${(reg.market || []).map(m => (marketConfig[m] || {label:m}).label).join(', ')}</span>
                    ${reg.robot_category ? `<span class="meta-tag">🤖 ${reg.robot_category.join(', ')}</span>` : ''}
                    ${reg.scenarios ? `<span class="meta-tag">📍 ${reg.scenarios.join(', ')}</span>` : ''}
                </div>
                <div class="reg-source">
                    ${reg.source_link ? `<a href="${reg.source_link}" target="_blank" rel="noopener">📎 ${reg.source_name || '官方来源'}</a>` : ''}
                    ${reg.verified ? '<span class="verified-badge">✅ 已核实</span>' : ''}
                </div>
            </div>
        `).join('');

        resultsContainer.innerHTML = html;
        resultCount.textContent = `${results.length} 条结果`;
    }

    /**
     * 事件绑定
     */
    // Step 1 options
    step1.querySelectorAll('.option-btn').forEach(btn => {
        btn.addEventListener('click', handleOptionClick);
    });

    // Reset buttons
    document.getElementById('reset-step-2').addEventListener('click', () => resetFromStep(2));
    document.getElementById('reset-step-3').addEventListener('click', () => resetFromStep(3));

    // Restart
    restartBtn.addEventListener('click', () => {
        selectedRobot = null;
        selectedMarket = null;
        selectedCategory = null;
        step1.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
        deactivateStep(step2);
        deactivateStep(step3);
        robotOptions.innerHTML = '';
        categoryOptions.innerHTML = '';
        hideResults();
    });

    // Init
    loadData();
})();
