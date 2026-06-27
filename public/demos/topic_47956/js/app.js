const App = {
    currentTab: 'index',
    currentMealType: 'breakfast',
    sleepQuality: 3,
    envLocation: 'home',
    sportIntensity: 1,
    reportType: 'daily',
    selectedFoods: [],
    _currentFoodList: [],
    dietHistoryDate: '',
    dietHistoryMealType: 'breakfast',
    dietHistoryPageDate: '',
    dietHistoryPageMealType: 'all',
    sleepHistoryPageDate: '',
    sleepHistoryPageType: 'all',
    sportHistoryPageDate: '',
    sportHistoryPageType: 'all',

    init() {
        DB.generateMockData();
        if (DB.isLoggedIn()) {
            this.showApp();
        } else {
            this.showPage('login');
        }
    },

    showPage(pageName) {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        const page = document.getElementById('page-' + pageName);
        if (page) {
            page.classList.add('active');
        }
    },

    showApp() {
        this.showPage('index');
        this.currentTab = 'index';
        this.updateTabBar();
        this.renderIndex();
    },

    login() {
        const nickname = document.getElementById('login-nickname').value.trim();
        if (!nickname) {
            alert('请输入昵称');
            return;
        }
        DB.login(nickname);
        this.showApp();
    },

    logout() {
        if (confirm('确定要退出登录吗？')) {
            DB.logout();
            this.showPage('login');
        }
    },

    switchTab(tab) {
        this.currentTab = tab;
        this.showPage(tab);
        this.updateTabBar();
        
        switch (tab) {
            case 'index':
                this.renderIndex();
                break;
            case 'diet':
                this.renderDiet();
                break;
            case 'sleep':
                this.renderSleep();
                break;
            case 'sport':
                this.renderSport();
                break;
            case 'environment':
                this.renderEnvironment();
                break;
            case 'report':
                this.renderReport();
                break;
            case 'profile':
                this.renderProfile();
                break;
        }
    },

    updateTabBar() {
        document.querySelectorAll('.tab-item').forEach(item => {
            const tab = item.dataset.tab;
            if (tab === this.currentTab) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    },

    getGreeting() {
        const hour = new Date().getHours();
        if (hour < 6) return '凌晨好';
        if (hour < 12) return '早上好';
        if (hour < 14) return '中午好';
        if (hour < 18) return '下午好';
        if (hour < 22) return '晚上好';
        return '夜深了';
    },

    renderIndex() {
        const user = DB.getUser();
        const scores = DB.calculateHealthScore();
        const today = DB.formatDate(new Date());

        document.getElementById('greeting-text').textContent = this.getGreeting();
        document.getElementById('user-nickname').textContent = `${user.nickname}，今天也要元气满满哦`;

        const scoreCircle = document.getElementById('score-progress');
        const circumference = 2 * Math.PI * 70;
        const offset = circumference - (scores.total / 100) * circumference;
        scoreCircle.style.strokeDashoffset = offset;

        this.animateNumber('health-score', scores.total, 1000);

        document.getElementById('quick-diet').textContent = scores.diet + '分';
        document.getElementById('quick-sleep').textContent = scores.sleep + '分';
        document.getElementById('quick-sport').textContent = (scores.sport || 0) + '分';
        document.getElementById('quick-env').textContent = scores.environment + '分';

        const dietLogs = DB.getDietLogs(today);
        const totalCalories = dietLogs.reduce((sum, log) => sum + Number(log.calories), 0);
        document.getElementById('stat-calories').textContent = totalCalories;

        const sleepLogs = DB.getSleepLogs(today, today);
        if (sleepLogs.length > 0) {
            const hours = (sleepLogs[0].duration / 60).toFixed(1);
            document.getElementById('stat-sleep').textContent = hours;
        } else {
            document.getElementById('stat-sleep').textContent = '--';
        }

        const sportLogs = DB.getSportLogs(today);
        let totalSteps = 0;
        sportLogs.forEach(log => totalSteps += Number(log.steps) || 0);
        if (totalSteps > 0) {
            document.getElementById('stat-steps').textContent = (totalSteps / 1000).toFixed(1) + 'k步';
        } else {
            document.getElementById('stat-steps').textContent = '0';
        }

        const envLogs = DB.getEnvLogs().filter(l => l.record_date === today);
        if (envLogs.length > 0) {
            const riskNames = ['', '优', '良', '中', '差', '危'];
            document.getElementById('stat-env-risk').textContent = riskNames[envLogs[0].risk_level] || '中';
        } else {
            document.getElementById('stat-env-risk').textContent = '--';
        }

        this.generateDailySuggestion(scores);
    },

    animateNumber(elementId, target, duration) {
        const element = document.getElementById(elementId);
        const start = 0;
        const startTime = performance.now();

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(start + (target - start) * easeOut);
            element.textContent = current;
            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }
        requestAnimationFrame(update);
    },

    generateDailySuggestion(scores) {
        const suggestions = [];
        
        if (scores.diet < 70) {
            suggestions.push('🍎 今日饮食不够均衡，建议增加蔬菜水果摄入，控制高热量食物。');
        } else if (scores.diet >= 90) {
            suggestions.push('🥗 饮食做得很棒！继续保持均衡营养的好习惯。');
        } else {
            suggestions.push('🍽️ 今日饮食整体不错，建议适当增加蛋白质摄入比例。');
        }

        if (scores.sleep < 70) {
            suggestions.push('😴 睡眠质量有待提升，建议早睡早起，保持规律作息。');
        } else if (scores.sleep >= 90) {
            suggestions.push('✨ 睡眠质量优秀！好睡眠是健康的基础。');
        } else {
            suggestions.push('🌙 睡眠还可以更好，试试睡前远离电子设备。');
        }

        if (scores.environment < 70) {
            suggestions.push('🏠 环境需要改善，建议多开窗通风，保持室内空气清新。');
        } else {
            suggestions.push('🌿 环境状况良好，继续保持舒适的生活空间。');
        }

        const suggestionEl = document.getElementById('daily-suggestion');
        suggestionEl.innerHTML = suggestions.map(s => `<p>${s}</p>`).join('');
    },

    renderDiet() {
        const today = DB.formatDate(new Date());
        const logs = DB.getDietLogs(today);

        const mealTypes = {
            breakfast: { name: '早餐', cal: 0, list: [] },
            lunch: { name: '午餐', cal: 0, list: [] },
            dinner: { name: '晚餐', cal: 0, list: [] },
            snack: { name: '加餐', cal: 0, list: [] }
        };

        let totalCalories = 0;
        let totalProtein = 0;
        let totalCarbs = 0;
        let totalFat = 0;

        logs.forEach(log => {
            if (mealTypes[log.meal_type]) {
                mealTypes[log.meal_type].list.push(log);
                mealTypes[log.meal_type].cal += Number(log.calories);
                totalCalories += Number(log.calories);
                totalProtein += Number(log.protein) || 0;
                totalCarbs += Number(log.carbs) || 0;
                totalFat += Number(log.fat) || 0;
            }
        });

        document.getElementById('today-calories').textContent = Math.round(totalCalories);
        document.getElementById('cal-progress-bar').style.width = Math.min(100, totalCalories / 20) + '%';
        document.getElementById('nutri-protein').textContent = Math.round(totalProtein) + 'g';
        document.getElementById('nutri-carbs').textContent = Math.round(totalCarbs) + 'g';
        document.getElementById('nutri-fat').textContent = Math.round(totalFat) + 'g';

        Object.keys(mealTypes).forEach(type => {
            document.getElementById(type + '-cal').textContent = Math.round(mealTypes[type].cal);
            const listEl = document.getElementById(type + '-list');
            
            if (mealTypes[type].list.length === 0) {
                listEl.innerHTML = '<div class="empty-state" style="padding: 16px;"><div class="empty-icon" style="font-size: 24px;">🍽️</div><div class="empty-text" style="font-size: 12px;">暂无记录</div></div>';
            } else {
                listEl.innerHTML = mealTypes[type].list.map(log => `
                    <div class="food-item">
                        <div class="food-info">
                            <div class="food-name">${log.food_name}</div>
                            <div class="food-nutrition">蛋白质 ${log.protein || 0}g · 碳水 ${log.carbs || 0}g</div>
                        </div>
                        <div style="display: flex; align-items: center;">
                            <div class="food-cal">${Math.round(log.calories)} kcal</div>
                            <span class="delete-btn" onclick="App.deleteDietLog(${log.id})">×</span>
                        </div>
                    </div>
                `).join('');
            }
        });

        this.renderDietRecommend();
    },

    renderDietRecommend() {
        const user = DB.getUser();
        const today = DB.formatDate(new Date());
        const logs = DB.getDietLogs(today);
        const totalCalories = logs.reduce((sum, log) => sum + Number(log.calories), 0);
        const remaining = Math.max(0, 2000 - totalCalories);

        let recommend = '';
        
        if (user.health_goal === '减脂塑形') {
            recommend = `
                <p><strong>🥗 减脂饮食建议</strong></p>
                <p>今日还可摄入约 <strong>${Math.round(remaining)} kcal</strong>，建议：</p>
                <p>1. 多吃高纤维蔬菜，增加饱腹感</p>
                <p>2. 选择优质蛋白（鸡胸肉、鱼虾、豆制品）</p>
                <p>3. 减少精制碳水，用粗粮替代</p>
                <p>4. 控制油脂摄入，避免油炸食物</p>
            `;
        } else if (user.health_goal === '增肌增重') {
            recommend = `
                <p><strong>💪 增肌饮食建议</strong></p>
                <p>今日还可摄入约 <strong>${Math.round(remaining)} kcal</strong>，建议：</p>
                <p>1. 保证充足蛋白质摄入（每公斤体重1.6-2.2g）</p>
                <p>2. 碳水化合物是能量主要来源</p>
                <p>3. 少食多餐，每日4-6餐</p>
                <p>4. 训练后及时补充蛋白质和碳水</p>
            `;
        } else {
            recommend = `
                <p><strong>🍱 均衡饮食建议</strong></p>
                <p>今日还可摄入约 <strong>${Math.round(remaining)} kcal</strong>，建议：</p>
                <p>1. 保证蔬菜水果摄入（每天500g以上）</p>
                <p>2. 优质蛋白：鱼、禽、蛋、奶、豆制品</p>
                <p>3. 主食粗细搭配，全谷物占1/3以上</p>
                <p>4. 少油少盐少糖，饮食清淡</p>
            `;
        }

        document.getElementById('diet-recommend').innerHTML = recommend;
    },

    showAddDietModal() {
        this.currentMealType = 'breakfast';
        this.showAddFoodModal('lunch');
        this.closeModal('food-modal');
        this.switchTab('diet');
    },

    showAddFoodModal(mealType) {
        this.currentMealType = mealType;
        this.selectedFoods = [];
        this.updateSelectedFoodsUI();
        document.getElementById('food-search-input').value = '';
        document.getElementById('food-search-list').innerHTML = '';
        this.openModal('food-modal');
        this.searchFood();
    },

    cameraScanFood() {
        let fileInput = document.getElementById('camera-file-input');
        if (!fileInput) {
            fileInput = document.createElement('input');
            fileInput.id = 'camera-file-input';
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            fileInput.capture = 'environment';
            fileInput.style.display = 'none';
            fileInput.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const scanningEl = document.createElement('div');
                scanningEl.id = 'camera-scanning';
                scanningEl.innerHTML = `
                    <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); z-index: 9999; display: flex; flex-direction: column; align-items: center; justify-content: center; color: white;">
                        <div style="font-size: 64px; margin-bottom: 20px;">📷</div>
                        <div style="font-size: 18px; margin-bottom: 10px;">正在识别食物...</div>
                        <div style="font-size: 14px; opacity: 0.8;">请稍候，AI正在分析图片</div>
                        <div style="margin-top: 30px; width: 200px; height: 4px; background: rgba(255,255,255,0.3); border-radius: 2px; overflow: hidden;">
                            <div style="height: 100%; background: var(--primary); animation: scanProgress 2s ease-in-out infinite;"></div>
                        </div>
                    </div>
                `;
                document.body.appendChild(scanningEl);

                setTimeout(() => {
                    scanningEl.remove();
                    
                    const scannedFood = {
                        name: '菠萝 200g',
                        qty: 1,
                        calories: Math.round(200 * 0.5),
                        protein: Math.round(200 * 0.004),
                        carbs: Math.round(200 * 0.108),
                        fat: Math.round(200 * 0.001)
                    };

                    const confirmAdd = confirm(`识别结果：\n\n🍍 菠萝 200g\n热量：${scannedFood.calories} kcal\n蛋白质：${scannedFood.protein}g\n碳水：${scannedFood.carbs}g\n脂肪：${scannedFood.fat}g\n\n是否添加到已选食物？`);

                    if (confirmAdd) {
                        const existingIndex = this.selectedFoods.findIndex(f => f.name === scannedFood.name);
                        if (existingIndex >= 0) {
                            this.selectedFoods[existingIndex].qty += 1;
                        } else {
                            this.selectedFoods.push(scannedFood);
                        }
                        this.updateSelectedFoodsUI();
                    }

                    fileInput.value = '';
                }, 2000);
            };
            document.body.appendChild(fileInput);
        }
        fileInput.click();
    },

    searchFood() {
        const keyword = document.getElementById('food-search-input').value;
        const foods = DB.searchFood(keyword);
        const listEl = document.getElementById('food-search-list');
        
        if (foods.length === 0) {
            listEl.innerHTML = '<div class="empty-state"><div class="empty-icon">🔍</div><div class="empty-text">未找到相关食物</div></div>';
            return;
        }

        listEl.innerHTML = foods.map((food, index) => {
            const selectedFood = this.selectedFoods.find(f => f.name === food.name);
            const isSelected = !!selectedFood;
            const qty = selectedFood ? selectedFood.qty : 1;
            return `
                <div class="food-search-item ${isSelected ? 'selected' : ''}" onclick="App.toggleFoodSelection(${index})">
                    <div class="food-checkbox">${isSelected ? '✓' : ''}</div>
                    <div class="food-name-wrap" style="flex: 1;">
                        <div>
                            <div style="font-weight: 500;">${food.name}</div>
                            <div style="font-size: 12px; color: var(--text-secondary);">${food.unit} · ${food.calories} kcal</div>
                        </div>
                    </div>
                    <div class="food-qty-control" onclick="event.stopPropagation()">
                        <span class="qty-btn" onclick="App.changeFoodQty(${index}, -1)">−</span>
                        <input type="number" class="qty-input" id="qty-${index}" value="${qty}" min="1" max="99" onclick="event.stopPropagation(); this.select();" onchange="App.updateFoodQty(${index}, this.value)">
                        <span class="qty-btn" onclick="App.changeFoodQty(${index}, 1)">+</span>
                    </div>
                </div>
            `;
        }).join('');

        this._currentFoodList = foods;
    },

    toggleFoodSelection(index) {
        const food = this._currentFoodList[index];
        const qtyInput = document.getElementById('qty-' + index);
        const qty = parseInt(qtyInput ? qtyInput.value : 1) || 1;
        const existingIndex = this.selectedFoods.findIndex(f => f.name === food.name);
        
        if (existingIndex > -1) {
            this.selectedFoods.splice(existingIndex, 1);
        } else {
            this.selectedFoods.push({...food, qty: qty});
        }
        
        this.updateSelectedFoodsUI();
        this.searchFood();
    },

    changeFoodQty(index, delta) {
        const qtyInput = document.getElementById('qty-' + index);
        if (!qtyInput) return;
        let val = parseInt(qtyInput.value) || 1;
        val = Math.max(1, Math.min(99, val + delta));
        qtyInput.value = val;
        this.updateFoodQty(index, val);
    },

    updateFoodQty(index, value) {
        const food = this._currentFoodList[index];
        const qty = Math.max(1, Math.min(99, parseInt(value) || 1));
        const existingFood = this.selectedFoods.find(f => f.name === food.name);
        if (existingFood) {
            existingFood.qty = qty;
            this.updateSelectedFoodsUI();
        }
    },

    updateSelectedFoodsUI() {
        const areaEl = document.getElementById('selected-foods-area');
        const listEl = document.getElementById('selected-foods-list');
        const countEl = document.getElementById('selected-count');
        const btnEl = document.getElementById('add-selected-btn');
        
        const totalItems = this.selectedFoods.reduce((sum, f) => sum + f.qty, 0);
        const totalCalories = this.selectedFoods.reduce((sum, f) => sum + f.calories * f.qty, 0);
        
        if (this.selectedFoods.length === 0) {
            areaEl.style.display = 'none';
            btnEl.disabled = true;
            btnEl.textContent = '添加到记录';
        } else {
            areaEl.style.display = 'block';
            countEl.textContent = `${totalItems}项`;
            btnEl.disabled = false;
            btnEl.textContent = `添加到记录 (${totalCalories} kcal)`;
            
            listEl.innerHTML = this.selectedFoods.map((food, index) => `
                <span class="selected-food-tag">
                    ${food.name} ×${food.qty}
                    <span class="remove-tag" onclick="App.removeSelectedFood(${index})">×</span>
                </span>
            `).join('');
        }
    },

    removeSelectedFood(index) {
        this.selectedFoods.splice(index, 1);
        this.updateSelectedFoodsUI();
        this.searchFood();
    },

    addSelectedFoods() {
        if (this.selectedFoods.length === 0) return;
        
        const today = DB.formatDate(new Date());
        
        this.selectedFoods.forEach(food => {
            DB.addDietLog({
                user_id: 1,
                meal_type: this.currentMealType,
                food_name: food.name + (food.qty > 1 ? ` ×${food.qty}` : ''),
                calories: Math.round(food.calories * food.qty),
                protein: Math.round((food.protein || 0) * food.qty * 10) / 10,
                carbs: Math.round((food.carbs || 0) * food.qty * 10) / 10,
                fat: Math.round((food.fat || 0) * food.qty * 10) / 10,
                record_date: today
            });
        });

        const count = this.selectedFoods.reduce((sum, f) => sum + f.qty, 0);
        const totalCal = this.selectedFoods.reduce((sum, f) => sum + f.calories * f.qty, 0);
        this.selectedFoods = [];
        this.updateSelectedFoodsUI();
        
        this.closeModal('food-modal');
        this.renderDiet();
        DB.calculateHealthScore();
        
        alert(`已添加 ${count} 项食物（共 ${totalCal} kcal）到记录`);
    },

    showCustomFoodModal() {
        document.getElementById('custom-food-name').value = '';
        document.getElementById('custom-food-calories').value = '100';
        document.getElementById('custom-food-protein').value = '5';
        document.getElementById('custom-food-carbs').value = '10';
        document.getElementById('custom-food-fat').value = '3';
        this.openModal('custom-food-modal');
    },

    addCustomFood() {
        const name = document.getElementById('custom-food-name').value.trim();
        const calories = parseInt(document.getElementById('custom-food-calories').value) || 100;
        const protein = parseFloat(document.getElementById('custom-food-protein').value) || 5;
        const carbs = parseFloat(document.getElementById('custom-food-carbs').value) || 10;
        const fat = parseFloat(document.getElementById('custom-food-fat').value) || 3;
        
        if (!name) {
            alert('请输入食物名称');
            return;
        }

        const today = DB.formatDate(new Date());
        
        DB.addDietLog({
            user_id: 1,
            meal_type: this.currentMealType,
            food_name: name,
            calories: calories,
            protein: protein,
            carbs: carbs,
            fat: fat,
            record_date: today
        });

        this.closeModal('custom-food-modal');
        this.closeModal('food-modal');
        this.renderDiet();
        DB.calculateHealthScore();
        
        alert('自定义食物已添加');
    },

    showDietHistoryModal() {
        try {
            this.dietHistoryDate = DB.formatDate(new Date());
            this.dietHistoryMealType = 'all';
            const dateInput = document.getElementById('diet-history-date');
            if (dateInput) {
                dateInput.value = this.dietHistoryDate;
            }
            this.updateDietHistoryTabs();
            this.updateDietHistoryStats();
            this.renderDietHistoryDetail();
            this.openModal('diet-history-modal');
        } catch (e) {
            console.error('showDietHistoryModal error:', e);
            alert('打开历史记录失败: ' + e.message);
        }
    },

    switchDietHistoryTab(type) {
        this.dietHistoryMealType = type;
        this.updateDietHistoryTabs();
        this.renderDietHistoryDetail();
    },

    updateDietHistoryTabs() {
        const tabs = document.querySelectorAll('.history-tab');
        tabs.forEach(tab => {
            if (tab.dataset.type === this.dietHistoryMealType) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
    },

    updateDietHistoryStats() {
        const allLogs = DB.getDietLogs();
        const uniqueDates = new Set(allLogs.map(log => log.record_date));
        
        const totalDays = uniqueDates.size;
        const totalLogs = allLogs.length;
        
        let totalCalories = 0;
        allLogs.forEach(log => totalCalories += Number(log.calories));
        const avgCalories = totalDays > 0 ? Math.round(totalCalories / totalDays) : 0;
        
        const totalDaysEl = document.getElementById('history-total-days');
        const totalLogsEl = document.getElementById('history-total-logs');
        const avgCalEl = document.getElementById('history-avg-cal');
        
        if (totalDaysEl) totalDaysEl.textContent = totalDays;
        if (totalLogsEl) totalLogsEl.textContent = totalLogs;
        if (avgCalEl) avgCalEl.textContent = avgCalories;
    },

    renderDietHistoryDetail() {
        const dateInput = document.getElementById('diet-history-date');
        const date = (dateInput && dateInput.value) || DB.formatDate(new Date());
        this.dietHistoryDate = date;
        
        let logs = DB.getDietLogs(date);
        if (this.dietHistoryMealType !== 'all') {
            logs = logs.filter(log => log.meal_type === this.dietHistoryMealType);
        }
        
        const listEl = document.getElementById('diet-history-list');
        if (!listEl) return;
        const mealNames = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack: '加餐', all: '全部' };

        if (logs.length === 0) {
            listEl.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🍽️</div>
                    <div class="empty-text">${date} ${mealNames[this.dietHistoryMealType]}暂无记录</div>
                </div>
            `;
        } else {
            const totalCal = logs.reduce((sum, log) => sum + Number(log.calories), 0);
            
            // 按餐次分组显示（如果是全部）
            if (this.dietHistoryMealType === 'all') {
                const grouped = {
                    breakfast: logs.filter(l => l.meal_type === 'breakfast'),
                    lunch: logs.filter(l => l.meal_type === 'lunch'),
                    dinner: logs.filter(l => l.meal_type === 'dinner'),
                    snack: logs.filter(l => l.meal_type === 'snack')
                };
                
                const mealIcons = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎' };
                
                listEl.innerHTML = `
                    <div style="background: var(--bg-primary); padding: 12px; border-radius: var(--radius-md); margin-bottom: 12px;">
                        <div style="font-size: 14px; color: var(--text-secondary);">${date} 共 ${logs.length} 条记录</div>
                        <div style="font-size: 20px; font-weight: 700; color: var(--primary);">总计 ${totalCal} kcal</div>
                    </div>
                    ${Object.entries(grouped).filter(([_, items]) => items.length > 0).map(([meal, items]) => `
                        <div style="margin-bottom: 16px;">
                            <div style="font-size: 14px; font-weight: 600; color: var(--text-secondary); margin-bottom: 8px;">
                                ${mealIcons[meal]} ${mealNames[meal]} · ${items.reduce((s, l) => s + Number(l.calories), 0)} kcal
                            </div>
                            ${items.map(log => `
                                <div class="history-item">
                                    <div class="history-item-info">
                                        <div class="history-item-name">${log.food_name}</div>
                                        <div class="history-item-meta">蛋白质 ${log.protein || 0}g · 碳水 ${log.carbs || 0}g · 脂肪 ${log.fat || 0}g</div>
                                    </div>
                                    <div class="history-item-cal">${log.calories} kcal</div>
                                    <span class="delete-btn" style="color: var(--danger); cursor: pointer; font-size: 18px;" onclick="App.deleteDietHistoryLog(${log.id})">×</span>
                                </div>
                            `).join('')}
                        </div>
                    `).join('')}
                `;
            } else {
                listEl.innerHTML = `
                    <div style="background: var(--bg-primary); padding: 12px; border-radius: var(--radius-md); margin-bottom: 12px;">
                        <div style="font-size: 14px; color: var(--text-secondary);">${date} ${mealNames[this.dietHistoryMealType]} · ${logs.length}条</div>
                        <div style="font-size: 20px; font-weight: 700; color: var(--primary);">共 ${totalCal} kcal</div>
                    </div>
                    ${logs.map(log => `
                        <div class="history-item">
                            <div class="history-item-info">
                                <div class="history-item-name">${log.food_name}</div>
                                <div class="history-item-meta">蛋白质 ${log.protein || 0}g · 碳水 ${log.carbs || 0}g · 脂肪 ${log.fat || 0}g</div>
                            </div>
                            <div class="history-item-cal">${log.calories} kcal</div>
                            <span class="delete-btn" style="color: var(--danger); cursor: pointer; font-size: 18px;" onclick="App.deleteDietHistoryLog(${log.id})">×</span>
                        </div>
                    `).join('')}
                `;
            }
        }
    },

    deleteDietHistoryLog(id) {
        if (confirm('确定删除这条记录吗？')) {
            DB.deleteDietLog(id);
            this.updateDietHistoryStats();
            this.renderDietHistoryDetail();
            this.updateDietHistoryPageStats();
            this.renderDietHistoryPageDetail();
            this.renderDiet();
            DB.calculateHealthScore();
        }
    },

    showDietHistoryPage() {
        this.dietHistoryPageDate = DB.formatDate(new Date());
        this.dietHistoryPageMealType = 'all';
        const dateInput = document.getElementById('diet-history-date-page');
        if (dateInput) {
            dateInput.value = this.dietHistoryPageDate;
        }
        this.updateDietHistoryPageTabs();
        this.updateDietHistoryPageStats();
        this.renderDietHistoryPageDetail();
        this.showPage('diet-history');
    },

    showDietPage() {
        this.showPage('diet');
        this.renderDiet();
    },

    switchDietHistoryPageTab(type) {
        this.dietHistoryPageMealType = type;
        this.updateDietHistoryPageTabs();
        this.renderDietHistoryPageDetail();
    },

    updateDietHistoryPageTabs() {
        const tabs = document.querySelectorAll('#page-diet-history .history-tab');
        tabs.forEach(tab => {
            if (tab.dataset.type === this.dietHistoryPageMealType) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
    },

    updateDietHistoryPageStats() {
        const allLogs = DB.getDietLogs();
        const uniqueDates = new Set(allLogs.map(log => log.record_date));
        
        const totalDays = uniqueDates.size;
        const totalLogs = allLogs.length;
        
        let totalCalories = 0;
        allLogs.forEach(log => totalCalories += Number(log.calories));
        const avgCalories = totalDays > 0 ? Math.round(totalCalories / totalDays) : 0;
        
        const totalDaysEl = document.getElementById('history-total-days-page');
        const totalLogsEl = document.getElementById('history-total-logs-page');
        const avgCalEl = document.getElementById('history-avg-cal-page');
        
        if (totalDaysEl) totalDaysEl.textContent = totalDays;
        if (totalLogsEl) totalLogsEl.textContent = totalLogs;
        if (avgCalEl) avgCalEl.textContent = avgCalories;
    },

    renderDietHistoryPageDetail() {
        const dateInput = document.getElementById('diet-history-date-page');
        const date = (dateInput && dateInput.value) || DB.formatDate(new Date());
        this.dietHistoryPageDate = date;
        
        let logs = DB.getDietLogs(date);
        if (this.dietHistoryPageMealType !== 'all') {
            logs = logs.filter(log => log.meal_type === this.dietHistoryPageMealType);
        }
        
        const listEl = document.getElementById('diet-history-list-page');
        if (!listEl) return;
        
        const mealNames = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack: '加餐', all: '全部' };

        if (logs.length === 0) {
            listEl.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🍽️</div>
                    <div class="empty-text">${date} ${mealNames[this.dietHistoryPageMealType]}暂无记录</div>
                </div>
            `;
        } else {
            const totalCal = logs.reduce((sum, log) => sum + Number(log.calories), 0);
            
            if (this.dietHistoryPageMealType === 'all') {
                const grouped = {
                    breakfast: logs.filter(l => l.meal_type === 'breakfast'),
                    lunch: logs.filter(l => l.meal_type === 'lunch'),
                    dinner: logs.filter(l => l.meal_type === 'dinner'),
                    snack: logs.filter(l => l.meal_type === 'snack')
                };
                
                const mealIcons = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎' };
                
                listEl.innerHTML = `
                    <div class="card" style="margin-bottom: 16px;">
                        <div style="font-size: 14px; color: var(--text-secondary);">${date} 共 ${logs.length} 条记录</div>
                        <div style="font-size: 20px; font-weight: 700; color: var(--primary);">总计 ${totalCal} kcal</div>
                    </div>
                    ${Object.entries(grouped).filter(([_, items]) => items.length > 0).map(([meal, items]) => `
                        <div style="margin-bottom: 16px;">
                            <div style="font-size: 14px; font-weight: 600; color: var(--text-secondary); margin-bottom: 8px;">
                                ${mealIcons[meal]} ${mealNames[meal]} · ${items.reduce((s, l) => s + Number(l.calories), 0)} kcal
                            </div>
                            ${items.map(log => `
                                <div class="history-item">
                                    <div class="history-item-info">
                                        <div class="history-item-name">${log.food_name}</div>
                                        <div class="history-item-meta">蛋白质 ${log.protein || 0}g · 碳水 ${log.carbs || 0}g · 脂肪 ${log.fat || 0}g</div>
                                    </div>
                                    <div class="history-item-cal">${log.calories} kcal</div>
                                    <span class="delete-btn" style="color: var(--danger); cursor: pointer; font-size: 18px;" onclick="App.deleteDietHistoryLog(${log.id})">×</span>
                                </div>
                            `).join('')}
                        </div>
                    `).join('')}
                `;
            } else {
                listEl.innerHTML = `
                    <div class="card" style="margin-bottom: 16px;">
                        <div style="font-size: 14px; color: var(--text-secondary);">${date} ${mealNames[this.dietHistoryPageMealType]} · ${logs.length}条</div>
                        <div style="font-size: 20px; font-weight: 700; color: var(--primary);">共 ${totalCal} kcal</div>
                    </div>
                    ${logs.map(log => `
                        <div class="history-item">
                            <div class="history-item-info">
                                <div class="history-item-name">${log.food_name}</div>
                                <div class="history-item-meta">蛋白质 ${log.protein || 0}g · 碳水 ${log.carbs || 0}g · 脂肪 ${log.fat || 0}g</div>
                            </div>
                            <div class="history-item-cal">${log.calories} kcal</div>
                            <span class="delete-btn" style="color: var(--danger); cursor: pointer; font-size: 18px;" onclick="App.deleteDietHistoryLog(${log.id})">×</span>
                        </div>
                    `).join('')}
                `;
            }
        }
    },

    showSleepPage() {
        this.showPage('sleep');
        this.renderSleep();
    },

    showSleepHistoryPage() {
        this.sleepHistoryPageDate = DB.formatDate(new Date());
        this.sleepHistoryPageType = 'all';
        const dateInput = document.getElementById('sleep-history-date-page');
        if (dateInput) {
            dateInput.value = this.sleepHistoryPageDate;
        }
        this.updateSleepHistoryPageTabs();
        this.updateSleepHistoryPageStats();
        this.renderSleepHistoryPageDetail();
        this.showPage('sleep-history');
    },

    switchSleepHistoryPageTab(type) {
        this.sleepHistoryPageType = type;
        this.updateSleepHistoryPageTabs();
        this.renderSleepHistoryPageDetail();
    },

    updateSleepHistoryPageTabs() {
        const tabs = document.querySelectorAll('#page-sleep-history .history-tab');
        tabs.forEach(tab => {
            if (tab.dataset.type === this.sleepHistoryPageType) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
    },

    updateSleepHistoryPageStats() {
        const allLogs = DB.getSleepLogs();
        const uniqueDates = new Set(allLogs.map(log => log.record_date));
        const totalDays = uniqueDates.size;
        const totalLogs = allLogs.length;
        let totalDuration = 0;
        allLogs.forEach(log => totalDuration += Number(log.duration));
        const avgDuration = totalLogs > 0 ? (totalDuration / totalLogs).toFixed(1) : 0;

        const totalDaysEl = document.getElementById('sleep-history-total-days');
        const totalLogsEl = document.getElementById('sleep-history-total-logs');
        const avgDurationEl = document.getElementById('sleep-history-avg-duration');
        if (totalDaysEl) totalDaysEl.textContent = totalDays;
        if (totalLogsEl) totalLogsEl.textContent = totalLogs;
        if (avgDurationEl) avgDurationEl.textContent = avgDuration + 'h';
    },

    renderSleepHistoryPageDetail() {
        const dateInput = document.getElementById('sleep-history-date-page');
        const date = (dateInput && dateInput.value) || DB.formatDate(new Date());
        this.sleepHistoryPageDate = date;

        let logs = DB.getSleepLogs(date, date);
        if (this.sleepHistoryPageType !== 'all') {
            logs = logs.filter(log => String(log.quality) === this.sleepHistoryPageType);
        }

        const listEl = document.getElementById('sleep-history-list-page');
        if (!listEl) return;

        const qualityNames = { '5': '优秀', '4': '良好', '3': '一般', '2': '较差', '1': '很差', 'all': '全部' };
        const qualityStars = { '5': '⭐⭐⭐⭐⭐', '4': '⭐⭐⭐⭐', '3': '⭐⭐⭐', '2': '⭐⭐', '1': '⭐' };

        if (logs.length === 0) {
            listEl.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">😴</div>
                    <div class="empty-text">${date} ${qualityNames[this.sleepHistoryPageType] || ''}暂无记录</div>
                </div>
            `;
        } else {
            const totalDuration = logs.reduce((sum, log) => sum + Number(log.duration), 0);
            const avgDuration = (totalDuration / logs.length).toFixed(1);

            listEl.innerHTML = `
                <div class="card" style="margin-bottom: 16px;">
                    <div style="font-size: 14px; color: var(--text-secondary);">${date} 共 ${logs.length} 条记录</div>
                    <div style="font-size: 20px; font-weight: 700; color: var(--secondary);">平均 ${avgDuration} 小时</div>
                </div>
                ${logs.map(log => `
                    <div class="history-item">
                        <div class="history-item-info">
                            <div class="history-item-name">${log.sleep_time} ~ ${log.wake_time}</div>
                            <div class="history-item-meta">时长 ${log.duration} 小时 · ${qualityStars[log.quality] || ''} ${qualityNames[log.quality] || ''}</div>
                        </div>
                        <span class="delete-btn" style="color: var(--danger); cursor: pointer; font-size: 18px;" onclick="App.deleteSleepHistoryLog(${log.id})">×</span>
                    </div>
                `).join('')}
            `;
        }
    },

    deleteSleepHistoryLog(id) {
        if (confirm('确定删除这条记录吗？')) {
            DB.deleteSleepLog(id);
            this.updateSleepHistoryPageStats();
            this.renderSleepHistoryPageDetail();
            this.renderSleep();
            DB.calculateHealthScore();
        }
    },

    showSportPage() {
        this.showPage('sport');
        this.renderSport();
    },

    showSportHistoryPage() {
        this.sportHistoryPageDate = DB.formatDate(new Date());
        this.sportHistoryPageType = 'all';
        const dateInput = document.getElementById('sport-history-date-page');
        if (dateInput) {
            dateInput.value = this.sportHistoryPageDate;
        }
        this.updateSportHistoryPageTabs();
        this.updateSportHistoryPageStats();
        this.renderSportHistoryPageDetail();
        this.showPage('sport-history');
    },

    switchSportHistoryPageTab(type) {
        this.sportHistoryPageType = type;
        this.updateSportHistoryPageTabs();
        this.renderSportHistoryPageDetail();
    },

    updateSportHistoryPageTabs() {
        const tabs = document.querySelectorAll('#page-sport-history .history-tab');
        tabs.forEach(tab => {
            if (tab.dataset.type === this.sportHistoryPageType) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
    },

    updateSportHistoryPageStats() {
        const allLogs = DB.getSportLogs();
        const uniqueDates = new Set(allLogs.map(log => log.record_date));
        const totalDays = uniqueDates.size;
        const totalLogs = allLogs.length;
        let totalCalories = 0;
        allLogs.forEach(log => totalCalories += Number(log.calories));

        const totalDaysEl = document.getElementById('sport-history-total-days');
        const totalLogsEl = document.getElementById('sport-history-total-logs');
        const totalCalEl = document.getElementById('sport-history-total-cal');
        if (totalDaysEl) totalDaysEl.textContent = totalDays;
        if (totalLogsEl) totalLogsEl.textContent = totalLogs;
        if (totalCalEl) totalCalEl.textContent = totalCalories;
    },

    renderSportHistoryPageDetail() {
        const dateInput = document.getElementById('sport-history-date-page');
        const date = (dateInput && dateInput.value) || DB.formatDate(new Date());
        this.sportHistoryPageDate = date;

        let logs = DB.getSportLogs(date);
        if (this.sportHistoryPageType !== 'all') {
            logs = logs.filter(log => log.sport_type === this.sportHistoryPageType);
        }

        const listEl = document.getElementById('sport-history-list-page');
        if (!listEl) return;

        const typeNames = { run: '跑步', walk: '步行', cycle: '骑行', swim: '游泳', fitness: '健身', all: '全部' };

        if (logs.length === 0) {
            listEl.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🏃</div>
                    <div class="empty-text">${date} ${typeNames[this.sportHistoryPageType] || ''}暂无记录</div>
                </div>
            `;
        } else {
            const totalCal = logs.reduce((sum, log) => sum + Number(log.calories), 0);
            const totalDuration = logs.reduce((sum, log) => sum + Number(log.duration), 0);

            listEl.innerHTML = `
                <div class="card" style="margin-bottom: 16px;">
                    <div style="font-size: 14px; color: var(--text-secondary);">${date} 共 ${logs.length} 条记录</div>
                    <div style="font-size: 20px; font-weight: 700; color: var(--accent);">消耗 ${totalCal} kcal · ${totalDuration} 分钟</div>
                </div>
                ${logs.map(log => `
                    <div class="history-item">
                        <div class="history-item-info">
                            <div class="history-item-name">${log.sport_icon} ${log.sport_name}</div>
                            <div class="history-item-meta">${log.duration} 分钟 · ${log.distance || 0} km · 强度${log.intensity || 1}</div>
                        </div>
                        <div class="history-item-cal">${log.calories} kcal</div>
                        <span class="delete-btn" style="color: var(--danger); cursor: pointer; font-size: 18px;" onclick="App.deleteSportHistoryLog(${log.id})">×</span>
                    </div>
                `).join('')}
            `;
        }
    },

    deleteSportHistoryLog(id) {
        if (confirm('确定删除这条记录吗？')) {
            DB.deleteSportLog(id);
            this.updateSportHistoryPageStats();
            this.renderSportHistoryPageDetail();
            this.renderSport();
            DB.calculateHealthScore();
        }
    },

    addFoodLog(index) {
        const food = this._currentFoodList[index];
        const today = DB.formatDate(new Date());
        
        DB.addDietLog({
            user_id: 1,
            meal_type: this.currentMealType,
            food_name: food.name,
            calories: food.calories,
            protein: food.protein,
            carbs: food.carbs,
            fat: food.fat,
            record_date: today
        });

        this.closeModal('food-modal');
        this.renderDiet();
        DB.calculateHealthScore();
    },

    deleteDietLog(id) {
        if (confirm('确定删除这条记录吗？')) {
            DB.deleteDietLog(id);
            this.renderDiet();
            DB.calculateHealthScore();
        }
    },

    generateDietRecommend() {
        this.renderDiet();
    },

    renderSleep() {
        const today = DB.formatDate(new Date());
        const logs = DB.getSleepLogs();

        if (logs.length > 0) {
            const lastLog = logs[0];
            const hours = (lastLog.duration / 60).toFixed(1);
            document.getElementById('last-sleep-duration').textContent = hours;
            document.getElementById('last-sleep-time').textContent = lastLog.sleep_time.split(' ')[1] || '--:--';
            document.getElementById('last-wake-time').textContent = lastLog.wake_time.split(' ')[1] || '--:--';

            const stars = document.querySelectorAll('#sleep-quality-display .star');
            stars.forEach((star, i) => {
                if (i < lastLog.quality) {
                    star.classList.add('active');
                } else {
                    star.classList.remove('active');
                }
            });
            const qualityTexts = ['', '很差', '较差', '一般', '良好', '优秀'];
            document.getElementById('sleep-quality-text').textContent = '睡眠质量：' + (qualityTexts[lastLog.quality] || '一般');
        } else {
            document.getElementById('last-sleep-duration').textContent = '--';
            document.getElementById('last-sleep-time').textContent = '--:--';
            document.getElementById('last-wake-time').textContent = '--:--';
            document.getElementById('sleep-quality-text').textContent = '暂无评分';
            document.querySelectorAll('#sleep-quality-display .star').forEach(s => s.classList.remove('active'));
        }

        const recentLogs = logs.slice(0, 7);
        const listEl = document.getElementById('sleep-list');
        
        if (recentLogs.length === 0) {
            listEl.innerHTML = '<div class="empty-state"><div class="empty-icon">😴</div><div class="empty-text">暂无睡眠记录</div></div>';
        } else {
            listEl.innerHTML = recentLogs.map(log => {
                const hours = (log.duration / 60).toFixed(1);
                const qualityStars = '⭐'.repeat(log.quality);
                return `
                    <div class="sleep-list-item">
                        <div>
                            <div class="sleep-list-date">${log.record_date}</div>
                            <div class="sleep-list-info">
                                ${log.sleep_time.split(' ')[1] || '--:--'} - ${log.wake_time.split(' ')[1] || '--:--'} · ${qualityStars}
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div class="sleep-list-duration">${hours}h</div>
                            <span class="delete-btn" style="color: var(--danger); cursor: pointer;" onclick="App.deleteSleepLog(${log.id})">×</span>
                        </div>
                    </div>
                `;
            }).join('');
        }

        this.renderSleepAnalysis(logs);
    },

    renderSleepAnalysis(logs) {
        const analysisEl = document.getElementById('sleep-analysis');
        
        if (logs.length === 0) {
            analysisEl.innerHTML = '<p>记录睡眠数据后，AI 将为您分析睡眠质量</p>';
            return;
        }

        const avgDuration = logs.reduce((sum, log) => sum + log.duration, 0) / logs.length;
        const avgHours = (avgDuration / 60).toFixed(1);
        const avgQuality = logs.reduce((sum, log) => sum + log.quality, 0) / logs.length;

        let analysis = `<p><strong>📊 近${logs.length}天睡眠分析</strong></p>`;
        
        if (avgHours >= 7 && avgHours <= 9 && avgQuality >= 4) {
            analysis += `<p>✅ 你的睡眠质量很好！继续保持规律作息。</p>`;
        } else if (avgHours < 7) {
            analysis += `<p>⚠️ 平均睡眠时长${avgHours}小时，略低于推荐的7-9小时。</p>`;
            analysis += `<p>建议：</p>`;
            analysis += `<p>1. 提前30分钟上床，建立睡前仪式</p>`;
            analysis += `<p>2. 睡前1小时避免使用电子设备</p>`;
            analysis += `<p>3. 保持卧室温度适宜（18-22°C）</p>`;
        } else if (avgQuality < 3) {
            analysis += `<p>⚠️ 睡眠质量有待提升。</p>`;
            analysis += `<p>建议：</p>`;
            analysis += `<p>1. 保持规律的作息时间</p>`;
            analysis += `<p>2. 适当运动有助于改善睡眠质量</p>`;
            analysis += `<p>3. 避免睡前饮用咖啡、茶等刺激性饮料</p>`;
        } else {
            analysis += `<p>💤 睡眠还不错，还有提升空间。</p>`;
            analysis += `<p>建议保持作息规律，睡前放松身心。</p>`;
        }

        analysisEl.innerHTML = analysis;
    },

    showAddSleepModal() {
        this.sleepQuality = 3;
        this.updateQualityStars();
        this.openModal('sleep-modal');
    },

    setSleepQuality(quality) {
        this.sleepQuality = quality;
        this.updateQualityStars();
    },

    updateQualityStars() {
        const stars = document.querySelectorAll('#quality-stars .star');
        stars.forEach((star, i) => {
            if (i < this.sleepQuality) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    },

    syncSleepDevice() {
        const scanningEl = document.createElement('div');
        scanningEl.id = 'device-scanning';
        scanningEl.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); z-index: 9999; display: flex; flex-direction: column; align-items: center; justify-content: center; color: white;">
                <div style="font-size: 48px; margin-bottom: 20px;">📱</div>
                <div style="font-size: 18px; margin-bottom: 10px;">正在连接设备...</div>
                <div style="font-size: 14px; opacity: 0.8;" id="scan-progress-text">搜索蓝牙设备中...</div>
                <div style="margin-top: 30px; width: 200px; height: 4px; background: rgba(255,255,255,0.3); border-radius: 2px; overflow: hidden;">
                    <div id="scan-progress-bar" style="height: 100%; background: var(--primary); width: 0%;"></div>
                </div>
            </div>
        `;
        document.body.appendChild(scanningEl);

        const progressText = document.getElementById('scan-progress-text');
        const progressBar = document.getElementById('scan-progress-bar');

        setTimeout(() => {
            progressText.innerText = '正在同步睡眠数据...';
            progressBar.style.width = '33%';
        }, 800);

        setTimeout(() => {
            progressText.innerText = '解析睡眠质量...';
            progressBar.style.width = '66%';
        }, 1600);

        setTimeout(() => {
            progressText.innerText = '同步完成!';
            progressBar.style.width = '100%';

            setTimeout(() => {
                scanningEl.remove();

                const mockSleepData = {
                    sleepTime: '23:30',
                    wakeTime: '07:15',
                    quality: 4
                };

                document.getElementById('sleep-time-input').value = mockSleepData.sleepTime;
                document.getElementById('wake-time-input').value = mockSleepData.wakeTime;
                this.setSleepQuality(mockSleepData.quality);

                alert(`设备数据同步成功!\n\n入睡时间: ${mockSleepData.sleepTime}\n起床时间: ${mockSleepData.wakeTime}\n睡眠质量: ${mockSleepData.quality}星`);
            }, 500);
        }, 2400);
    },

    syncSportDevice() {
        const scanningEl = document.createElement('div');
        scanningEl.id = 'device-scanning';
        scanningEl.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); z-index: 9999; display: flex; flex-direction: column; align-items: center; justify-content: center; color: white;">
                <div style="font-size: 48px; margin-bottom: 20px;">📱</div>
                <div style="font-size: 18px; margin-bottom: 10px;">正在连接设备...</div>
                <div style="font-size: 14px; opacity: 0.8;" id="scan-progress-text">搜索蓝牙设备中...</div>
                <div style="margin-top: 30px; width: 200px; height: 4px; background: rgba(255,255,255,0.3); border-radius: 2px; overflow: hidden;">
                    <div id="scan-progress-bar" style="height: 100%; background: var(--primary); width: 0%;"></div>
                </div>
            </div>
        `;
        document.body.appendChild(scanningEl);

        const progressText = document.getElementById('scan-progress-text');
        const progressBar = document.getElementById('scan-progress-bar');

        setTimeout(() => {
            progressText.innerText = '正在同步运动数据...';
            progressBar.style.width = '33%';
        }, 800);

        setTimeout(() => {
            progressText.innerText = '计算消耗热量...';
            progressBar.style.width = '66%';
        }, 1600);

        setTimeout(() => {
            progressText.innerText = '同步完成!';
            progressBar.style.width = '100%';

            setTimeout(() => {
                scanningEl.remove();

                const sportTypes = ['running', 'walking', 'cycling', 'swimming', 'gym'];
                const mockSportData = {
                    duration: Math.floor(Math.random() * 30) + 20,
                    steps: Math.floor(Math.random() * 5000) + 3000,
                    distance: (Math.random() * 5 + 2).toFixed(1),
                    type: sportTypes[Math.floor(Math.random() * sportTypes.length)],
                    intensity: Math.floor(Math.random() * 3) + 1
                };

                document.getElementById('sport-duration-input').value = mockSportData.duration;
                document.getElementById('sport-steps-input').value = mockSportData.steps;
                document.getElementById('sport-distance-input').value = mockSportData.distance;
                document.getElementById('sport-type-input').value = mockSportData.type;
                this.setSportIntensity(mockSportData.intensity);
                this.calculateSportCalories();

                const typeMap = {
                    'running': '跑步',
                    'walking': '步行',
                    'cycling': '骑行',
                    'swimming': '游泳',
                    'gym': '健身'
                };

                alert(`设备数据同步成功!\n\n运动类型: ${typeMap[mockSportData.type]}\n时长: ${mockSportData.duration}分钟\n步数: ${mockSportData.steps}步\n距离: ${mockSportData.distance}km\n强度: ${mockSportData.intensity}级`);
            }, 500);
        }, 2400);
    },

    saveSleep() {
        const sleepTime = document.getElementById('sleep-time-input').value;
        const wakeTime = document.getElementById('wake-time-input').value;

        if (!sleepTime || !wakeTime) {
            alert('请填写完整的睡眠时间');
            return;
        }

        const today = DB.formatDate(new Date());
        const yesterday = DB.formatDate(new Date(Date.now() - 86400000));

        let sleepDateTime, wakeDateTime, recordDate;
        const sleepHour = parseInt(sleepTime.split(':')[0]);
        
        if (sleepHour >= 12) {
            recordDate = yesterday;
            sleepDateTime = `${yesterday} ${sleepTime}`;
            wakeDateTime = `${today} ${wakeTime}`;
        } else {
            recordDate = yesterday;
            sleepDateTime = `${yesterday} ${sleepTime}`;
            wakeDateTime = `${yesterday} ${wakeTime}`;
        }

        let duration = 0;
        const sleepH = parseInt(sleepTime.split(':')[0]);
        const sleepM = parseInt(sleepTime.split(':')[1]);
        const wakeH = parseInt(wakeTime.split(':')[0]);
        const wakeM = parseInt(wakeTime.split(':')[1]);

        let sleepMinutes = sleepH * 60 + sleepM;
        let wakeMinutes = wakeH * 60 + wakeM;
        
        if (wakeMinutes <= sleepMinutes) {
            wakeMinutes += 24 * 60;
        }
        duration = wakeMinutes - sleepMinutes;

        DB.addSleepLog({
            user_id: 1,
            sleep_time: sleepDateTime,
            wake_time: wakeDateTime,
            duration: duration,
            quality: this.sleepQuality,
            record_date: recordDate
        });

        this.closeModal('sleep-modal');
        this.renderSleep();
        DB.calculateHealthScore();
    },

    deleteSleepLog(id) {
        if (confirm('确定删除这条记录吗？')) {
            DB.deleteSleepLog(id);
            this.renderSleep();
            DB.calculateHealthScore();
        }
    },

    renderEnvironment() {
        const logs = DB.getEnvLogs();
        
        if (logs.length > 0) {
            const lastLog = logs[0];
            document.getElementById('env-aqi').textContent = lastLog.air_quality;
            document.getElementById('env-temp').textContent = lastLog.temperature;
            document.getElementById('env-humidity').textContent = lastLog.humidity;
            document.getElementById('env-location').textContent = lastLog.location_type === 'home' ? '居家' : '办公';

            const riskBadge = document.getElementById('risk-badge');
            const riskNames = ['', '优', '良', '轻度风险', '中度风险', '重度风险'];
            riskBadge.textContent = riskNames[lastLog.risk_level] || '一般';
            riskBadge.className = 'risk-badge risk-' + lastLog.risk_level;
        }

        const listEl = document.getElementById('env-list');
        const recentLogs = logs.slice(0, 10);
        
        if (recentLogs.length === 0) {
            listEl.innerHTML = '<div class="empty-state"><div class="empty-icon">🏠</div><div class="empty-text">暂无环境记录</div></div>';
        } else {
            listEl.innerHTML = recentLogs.map(log => {
                const locationName = log.location_type === 'home' ? '🏠 居家' : '💼 办公';
                return `
                    <div class="sleep-list-item">
                        <div>
                            <div class="sleep-list-date">${log.record_date} ${locationName}</div>
                            <div class="sleep-list-info">
                                AQI ${log.air_quality} · ${log.temperature}°C · 湿度${log.humidity}%
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span class="risk-badge risk-${log.risk_level}">${['','优','良','中','差','危'][log.risk_level]}</span>
                            <span class="delete-btn" style="color: var(--danger); cursor: pointer;" onclick="App.deleteEnvLog(${log.id})">×</span>
                        </div>
                    </div>
                `;
            }).join('');
        }

        this.renderEnvAdvice(logs);
    },

    renderEnvAdvice(logs) {
        const adviceEl = document.getElementById('env-advice');
        
        if (logs.length === 0) {
            adviceEl.innerHTML = '<p>记录环境数据后，获取个性化改善建议</p>';
            return;
        }

        const avgRisk = logs.reduce((sum, log) => sum + log.risk_level, 0) / logs.length;

        let advice = '<p><strong>🌿 环境健康建议</strong></p>';
        
        if (avgRisk <= 2) {
            advice += `<p>✅ 你的环境状况良好！</p>`;
            advice += `<p>继续保持：</p>`;
            advice += `<p>1. 每天开窗通风2-3次，每次30分钟</p>`;
            advice += `<p>2. 保持室内适宜的温湿度</p>`;
            advice += `<p>3. 定期清洁，减少尘螨滋生</p>`;
        } else if (avgRisk <= 3) {
            advice += `<p>⚠️ 环境有轻度风险，建议：</p>`;
            advice += `<p>1. 增加通风频次，改善空气质量</p>`;
            advice += `<p>2. 可使用空气净化器</p>`;
            advice += `<p>3. 摆放绿植有助于净化空气</p>`;
            advice += `<p>4. 避免在室内吸烟</p>`;
        } else {
            advice += `<p>🔴 环境风险较高，请注意：</p>`;
            advice += `<p>1. 立即改善通风条件</p>`;
            advice += `<p>2. 考虑使用空气净化设备</p>`;
            advice += `<p>3. 远离污染源</p>`;
            advice += `<p>4. 如身体不适请及时就医</p>`;
        }

        adviceEl.innerHTML = advice;
    },

    renderSport() {
        const today = DB.formatDate(new Date());
        const todayLogs = DB.getSportLogs(today);
        const allLogs = DB.getSportLogs();

        let totalSteps = 0;
        let totalCalories = 0;
        let totalDuration = 0;
        let totalDistance = 0;

        todayLogs.forEach(log => {
            totalSteps += Number(log.steps) || 0;
            totalCalories += Number(log.calories) || 0;
            totalDuration += Number(log.duration) || 0;
            totalDistance += Number(log.distance) || 0;
        });

        document.getElementById('today-steps').textContent = totalSteps.toLocaleString();
        document.getElementById('sport-calories').textContent = Math.round(totalCalories);
        document.getElementById('sport-duration').textContent = Math.round(totalDuration);
        document.getElementById('sport-distance').textContent = totalDistance.toFixed(1);

        const todayListEl = document.getElementById('sport-today-list');
        if (todayLogs.length === 0) {
            todayListEl.innerHTML = '<div class="empty-state"><div class="empty-icon">🏃</div><div class="empty-text">今日暂无运动记录</div></div>';
        } else {
            todayListEl.innerHTML = todayLogs.map(log => this.renderSportItem(log)).join('');
        }

        const weekLogs = allLogs.slice(0, 14);
        const weekListEl = document.getElementById('sport-week-list');
        if (weekLogs.length === 0) {
            weekListEl.innerHTML = '<div class="empty-state"><div class="empty-icon">📅</div><div class="empty-text">暂无运动记录</div></div>';
        } else {
            weekListEl.innerHTML = weekLogs.map(log => this.renderSportItem(log)).join('');
        }

        this.renderSportAdvice(allLogs);
    },

    renderSportItem(log) {
        const icon = log.sport_icon || this.getSportIcon(log.sport_type);
        return `
            <div class="sport-list-item">
                <div class="sport-list-icon">${icon}</div>
                <div class="sport-list-info">
                    <div class="sport-list-type">${log.sport_name || this.getSportName(log.sport_type)}</div>
                    <div class="sport-list-meta">${log.record_date} · ${log.duration}分钟 · ${log.steps || 0}步</div>
                </div>
                <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
                    <div class="sport-list-calories">${log.calories} kcal</div>
                    <span class="delete-btn" style="color: var(--danger); cursor: pointer; font-size: 14px;" onclick="App.deleteSportLog(${log.id})">×</span>
                </div>
            </div>
        `;
    },

    getSportIcon(type) {
        const icons = {
            walking: '🚶',
            running: '🏃',
            cycling: '🚴',
            swimming: '🏊',
            yoga: '🧘',
            gym: '💪',
            basketball: '🏀',
            football: '⚽',
            badminton: '🏸',
            dancing: '💃'
        };
        return icons[type] || '🏃';
    },

    getSportName(type) {
        const names = {
            walking: '步行',
            running: '跑步',
            cycling: '骑行',
            swimming: '游泳',
            yoga: '瑜伽',
            gym: '健身',
            basketball: '篮球',
            football: '足球',
            badminton: '羽毛球',
            dancing: '跳舞'
        };
        return names[type] || '运动';
    },

    renderSportAdvice(logs) {
        const adviceEl = document.getElementById('sport-advice');
        
        if (logs.length === 0) {
            adviceEl.innerHTML = '<p>记录运动数据后，获取个性化运动建议</p>';
            return;
        }

        const avgDuration = logs.reduce((sum, log) => sum + Number(log.duration), 0) / logs.length;
        const avgCalories = logs.reduce((sum, log) => sum + Number(log.calories), 0) / logs.length;

        let advice = '<p><strong>💪 运动健康建议</strong></p>';
        
        if (avgDuration >= 30 && avgDuration <= 60) {
            advice += `<p>✅ 运动时长很合理！</p>`;
            advice += `<p>建议：</p>`;
            advice += `<p>1. 保持每周3-5次运动习惯</p>`;
            advice += `<p>2. 运动前做好热身，运动后记得拉伸</p>`;
            advice += `<p>3. 适当增加力量训练</p>`;
        } else if (avgDuration < 30) {
            advice += `<p>⚠️ 运动时长偏少，建议增加运动量。</p>`;
            advice += `<p>建议：</p>`;
            advice += `<p>1. 从每天快走30分钟开始</p>`;
            advice += `<p>2. 利用碎片时间多站立、少坐</p>`;
            advice += `<p>3. 逐渐增加运动强度和时间</p>`;
        } else {
            advice += `<p>⚠️ 运动量较大，注意休息。</p>`;
            advice += `<p>建议：</p>`;
            advice += `<p>1. 合理安排运动和休息时间</p>`;
            advice += `<p>2. 注意补充水分和电解质</p>`;
            advice += `<p>3. 避免过度疲劳</p>`;
        }

        adviceEl.innerHTML = advice;
    },

    showAddSportModal() {
        this.sportIntensity = 1;
        this.updateSportIntensityTabs();
        document.getElementById('sport-type-input').value = 'walking';
        document.getElementById('sport-duration-input').value = '30';
        document.getElementById('sport-steps-input').value = '0';
        document.getElementById('sport-distance-input').value = '0';
        document.getElementById('sport-note-input').value = '';
        this.calculateSportCalories();
        this.openModal('sport-modal');
    },

    calculateSportCalories() {
        const sportType = document.getElementById('sport-type-input').value;
        const duration = parseInt(document.getElementById('sport-duration-input').value) || 0;
        const steps = parseInt(document.getElementById('sport-steps-input').value) || 0;
        const distance = parseFloat(document.getElementById('sport-distance-input').value) || 0;
        const intensity = this.sportIntensity;

        const user = DB.getUser();
        const weight = user ? user.weight : 65;

        // 基础 MET 值（代谢当量），根据运动类型
        const baseMET = {
            walking: 3.5,
            running: 9.8,
            cycling: 7.5,
            swimming: 8.0,
            yoga: 2.5,
            gym: 5.0,
            basketball: 8.0,
            football: 7.0,
            badminton: 5.5,
            dancing: 4.5
        };

        // 强度系数
        const intensityFactor = {
            1: 0.7,  // 轻松
            2: 1.0,  // 适中
            3: 1.3   // 剧烈
        };

        let calories = 0;

        // 1. 基于时长的基础热量计算
        const met = (baseMET[sportType] || 4.0) * (intensityFactor[intensity] || 1.0);
        const durationCalories = met * weight * (duration / 60);

        // 2. 基于步数的额外热量（步行/跑步时更准确）
        if (steps > 0) {
            // 步行的热量消耗约为 0.04-0.05 kcal/步/kg
            const stepsCalories = steps * weight * 0.045;
            calories += stepsCalories * 0.5; // 步数贡献50%
        }

        // 3. 基于距离的额外热量（骑行/跑步时更准确）
        if (distance > 0) {
            // 根据运动类型调整距离热量估算
            const distanceCalories = distance * met * weight * 0.6;
            calories += distanceCalories * 0.3;
        }

        // 综合计算：主要依据时长，适当参考步数和距离
        calories = durationCalories * 0.8 + calories;

        // 确保最小值
        calories = Math.max(10, Math.round(calories));

        // 更新显示
        document.getElementById('sport-calories-display').textContent = calories;

        return calories;
    },

    setSportIntensity(value) {
        this.sportIntensity = value;
        this.updateSportIntensityTabs();
        this.calculateSportCalories();
    },

    updateSportIntensityTabs() {
        document.querySelectorAll('.intensity-tab').forEach(tab => {
            if (parseInt(tab.dataset.value) === this.sportIntensity) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
    },

    saveSport() {
        const sportType = document.getElementById('sport-type-input').value;
        const duration = parseInt(document.getElementById('sport-duration-input').value) || 30;
        const calories = this.calculateSportCalories();
        const steps = parseInt(document.getElementById('sport-steps-input').value) || 0;
        const distance = parseFloat(document.getElementById('sport-distance-input').value) || 0;
        const note = document.getElementById('sport-note-input').value;
        const today = DB.formatDate(new Date());

        DB.addSportLog({
            user_id: 1,
            sport_type: sportType,
            sport_name: this.getSportName(sportType),
            sport_icon: this.getSportIcon(sportType),
            duration: duration,
            calories: calories,
            steps: steps,
            distance: distance,
            intensity: this.sportIntensity,
            note: note,
            record_date: today
        });

        this.closeModal('sport-modal');
        this.renderSport();
        DB.calculateHealthScore();
        this.renderIndex();
    },

    deleteSportLog(id) {
        if (confirm('确定删除这条记录吗？')) {
            DB.deleteSportLog(id);
            this.renderSport();
            DB.calculateHealthScore();
            this.renderIndex();
        }
    },

    showAddEnvModal() {
        this.envLocation = 'home';
        this.updateEnvLocationTabs();
        this.openModal('env-modal');
    },

    setEnvLocation(loc) {
        this.envLocation = loc;
        this.updateEnvLocationTabs();
    },

    updateEnvLocationTabs() {
        document.querySelectorAll('.location-tab').forEach(tab => {
            if (tab.dataset.type === this.envLocation) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
    },

    saveEnv() {
        const aqi = parseInt(document.getElementById('env-aqi-input').value) || 50;
        const temp = parseFloat(document.getElementById('env-temp-input').value) || 24;
        const humidity = parseInt(document.getElementById('env-humidity-input').value) || 50;
        const risk = parseInt(document.getElementById('env-risk-input').value) || 3;

        const today = DB.formatDate(new Date());

        DB.addEnvLog({
            user_id: 1,
            location_type: this.envLocation,
            air_quality: aqi,
            temperature: temp,
            humidity: humidity,
            risk_level: risk,
            record_date: today
        });

        this.closeModal('env-modal');
        this.renderEnvironment();
        DB.calculateHealthScore();
    },

    deleteEnvLog(id) {
        if (confirm('确定删除这条记录吗？')) {
            DB.deleteEnvLog(id);
            this.renderEnvironment();
            DB.calculateHealthScore();
        }
    },

    switchReportTab(type) {
        this.reportType = type;
        document.querySelectorAll('.report-tab').forEach(tab => {
            if (tab.dataset.type === type) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
        this.renderReport();
    },

    renderReport() {
        const scores = DB.calculateHealthScore();
        
        document.getElementById('report-total-score').textContent = scores.total;
        document.getElementById('report-diet-score').textContent = scores.diet;
        document.getElementById('report-sleep-score').textContent = scores.sleep;
        document.getElementById('report-env-score').textContent = scores.environment;

        this.drawTrendChart();

        let days = 1;
        let label = '今日';
        if (this.reportType === 'weekly') {
            days = 7;
            label = '近7天';
        } else if (this.reportType === 'monthly') {
            days = 30;
            label = '近30天';
        }

        const today = new Date();
        const startDate = new Date(today.getTime() - (days - 1) * 86400000);
        const startStr = DB.formatDate(startDate);
        const endStr = DB.formatDate(today);

        const dietLogs = DB.getDietLogs().filter(l => l.record_date >= startStr && l.record_date <= endStr);
        const sleepLogs = DB.getSleepLogs(startStr, endStr);

        const dateSet = new Set();
        dietLogs.forEach(l => dateSet.add(l.record_date));
        sleepLogs.forEach(l => dateSet.add(l.record_date));
        const recordDays = dateSet.size;

        let totalCal = 0;
        dietLogs.forEach(l => totalCal += Number(l.calories));
        const avgCal = recordDays > 0 ? Math.round(totalCal / recordDays) : 0;

        let totalSleep = 0;
        sleepLogs.forEach(l => totalSleep += l.duration);
        const avgSleep = recordDays > 0 ? (totalSleep / recordDays / 60).toFixed(1) : 0;

        document.getElementById('report-avg-cal').textContent = avgCal;
        document.getElementById('report-avg-sleep').textContent = avgSleep;
        document.getElementById('report-days').textContent = recordDays;

        this.generateReportSuggestion(scores, days);
    },

    drawTrendChart() {
        const canvas = document.getElementById('trend-chart');
        const ctx = canvas.getContext('2d');
        
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        
        const width = rect.width;
        const height = rect.height;
        const padding = { top: 20, right: 20, bottom: 30, left: 40 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;

        let days = 7;
        if (this.reportType === 'monthly') days = 30;
        if (this.reportType === 'daily') days = 7;

        const data = [];
        const labels = [];
        const today = new Date();

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today.getTime() - i * 86400000);
            const dateStr = DB.formatDate(date);
            
            const dietLogs = DB.getDietLogs(dateStr);
            const sleepLogs = DB.getSleepLogs(dateStr, dateStr);
            const envLogs = DB.getEnvLogs().filter(l => l.record_date === dateStr);

            let dietScore = 70;
            let sleepScore = 70;
            let envScore = 70;

            if (dietLogs.length > 0) {
                const totalCalories = dietLogs.reduce((sum, log) => sum + Number(log.calories), 0);
                const diff = Math.abs(totalCalories - 2000) / 2000;
                dietScore = Math.max(50, Math.min(100, 90 - diff * 100));
            }

            if (sleepLogs.length > 0) {
                const durationHours = sleepLogs[0].duration / 60;
                if (durationHours >= 7 && durationHours <= 9) sleepScore = 95;
                else if (durationHours >= 6 && durationHours <= 10) sleepScore = 80;
                else sleepScore = 60;
                if (sleepLogs[0].quality) {
                    sleepScore = (sleepScore + sleepLogs[0].quality * 20) / 2;
                }
            }

            if (envLogs.length > 0) {
                envScore = 100 - (envLogs[0].risk_level - 1) * 12.5;
            }

            const total = Math.round(dietScore * 0.4 + sleepScore * 0.35 + envScore * 0.25);
            data.push(total);
            
            if (days <= 7) {
                labels.push((date.getMonth() + 1) + '/' + date.getDate());
            } else {
                if (i % 5 === 0 || i === 0) {
                    labels.push((date.getMonth() + 1) + '/' + date.getDate());
                } else {
                    labels.push('');
                }
            }
        }

        ctx.clearRect(0, 0, width, height);

        ctx.strokeStyle = '#E2E8F0';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = padding.top + (chartHeight / 4) * i;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(width - padding.right, y);
            ctx.stroke();

            ctx.fillStyle = '#94A3B8';
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(100 - i * 25, padding.left - 8, y + 3);
        }

        const maxVal = 100;
        const minVal = 0;
        const range = maxVal - minVal;

        ctx.fillStyle = '#94A3B8';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        labels.forEach((label, i) => {
            const x = padding.left + (chartWidth / (data.length - 1)) * i;
            ctx.fillText(label, x, height - 10);
        });

        const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
        gradient.addColorStop(0, 'rgba(16, 185, 129, 0.3)');
        gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');

        ctx.beginPath();
        data.forEach((val, i) => {
            const x = padding.left + (chartWidth / (data.length - 1)) * i;
            const y = padding.top + chartHeight - ((val - minVal) / range) * chartHeight;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.lineTo(padding.left + chartWidth, height - padding.bottom);
        ctx.lineTo(padding.left, height - padding.bottom);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.beginPath();
        ctx.strokeStyle = '#10B981';
        ctx.lineWidth = 2;
        data.forEach((val, i) => {
            const x = padding.left + (chartWidth / (data.length - 1)) * i;
            const y = padding.top + chartHeight - ((val - minVal) / range) * chartHeight;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

        data.forEach((val, i) => {
            const x = padding.left + (chartWidth / (data.length - 1)) * i;
            const y = padding.top + chartHeight - ((val - minVal) / range) * chartHeight;
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fillStyle = 'white';
            ctx.fill();
            ctx.strokeStyle = '#10B981';
            ctx.lineWidth = 2;
            ctx.stroke();
        });
    },

    generateReportSuggestion(scores, days) {
        const suggestionEl = document.getElementById('report-suggestion');
        
        let suggestion = `<p><strong>📋 健康报告总结</strong></p>`;
        
        if (scores.total >= 90) {
            suggestion += `<p>🎉 太棒了！你的健康状况非常好！</p>`;
            suggestion += `<p>继续保持当前的健康生活方式，定期关注身体变化。</p>`;
        } else if (scores.total >= 75) {
            suggestion += `<p>👍 健康状况良好，还有提升空间。</p>`;
        } else if (scores.total >= 60) {
            suggestion += `<p>⚠️ 健康状况一般，需要引起重视。</p>`;
        } else {
            suggestion += `<p>🔴 健康状况较差，建议尽快调整生活方式。</p>`;
        }

        const minScore = Math.min(scores.diet, scores.sleep, scores.environment);
        if (minScore === scores.diet) {
            suggestion += `<p><strong>🍽️ 饮食方面需要重点关注：</strong></p>`;
            suggestion += `<p>建议规律三餐，均衡营养，减少高热量食物摄入。</p>`;
        } else if (minScore === scores.sleep) {
            suggestion += `<p><strong>😴 睡眠方面需要重点关注：</strong></p>`;
            suggestion += `<p>建议保持规律作息，每天保证7-9小时睡眠时间。</p>`;
        } else {
            suggestion += `<p><strong>🏠 环境方面需要重点关注：</strong></p>`;
            suggestion += `<p>建议改善生活和工作环境，注意通风和空气质量。</p>`;
        }

        suggestion += `<p>💪 坚持记录，健康生活从每一天开始！</p>`;

        suggestionEl.innerHTML = suggestion;
    },

    renderProfile() {
        const user = DB.getUser();
        document.getElementById('profile-name').textContent = user.nickname;
        document.getElementById('profile-goal').textContent = '健康目标：' + user.health_goal;
    },

    showProfileModal() {
        const user = DB.getUser();
        document.getElementById('profile-nickname-input').value = user.nickname;
        document.getElementById('profile-gender-input').value = user.gender;
        document.getElementById('profile-birthday-input').value = user.birthday;
        document.getElementById('profile-height-input').value = user.height;
        document.getElementById('profile-weight-input').value = user.weight;
        document.getElementById('profile-goal-input').value = user.health_goal;
        this.openModal('profile-modal');
    },

    saveProfile() {
        const nickname = document.getElementById('profile-nickname-input').value.trim();
        const gender = parseInt(document.getElementById('profile-gender-input').value);
        const birthday = document.getElementById('profile-birthday-input').value;
        const height = parseFloat(document.getElementById('profile-height-input').value);
        const weight = parseFloat(document.getElementById('profile-weight-input').value);
        const healthGoal = document.getElementById('profile-goal-input').value;

        if (!nickname) {
            alert('请输入昵称');
            return;
        }

        DB.updateProfile({
            nickname,
            gender,
            birthday,
            height,
            weight,
            health_goal: healthGoal
        });

        this.closeModal('profile-modal');
        this.renderProfile();
        this.renderIndex();
    },

    showAboutModal() {
        this.openModal('about-modal');
    },

    showHelpModal() {
        this.openModal('help-modal');
    },

    clearData() {
        if (confirm('确定要清除所有数据吗？此操作不可恢复！')) {
            localStorage.clear();
            alert('数据已清除，请重新登录');
            this.logout();
        }
    },

    openModal(modalId) {
        document.getElementById(modalId).classList.add('active');
    },

    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
