const App = {
    schedules: [],
    goals: [],
    meals: {},
    nutritionTargets: { calorie: 2200, protein: 140, carbs: 250, fat: 70 },
    shoppingList: {},
    currentPage: 'today',
    currentMonth: new Date(),
    selectedDate: new Date(),
    mealDate: new Date(),
    editingScheduleId: null,
    editingGoalId: null,
    selectedCategory: 'study',
    selectedCategoryColor: '#4ECDC4',
    reminderTimeouts: {},
    currentMealType: null,
    selectedFood: null,
    foodCategoryFilter: 'all',

    categoryMap: {
        study: { name: '学习', color: '#4ECDC4' },
        exercise: { name: '运动', color: '#FF6B6B' },
        entertainment: { name: '娱乐', color: '#FFE66D' },
        life: { name: '生活', color: '#95E1D3' },
        other: { name: '其他', color: '#C9B1FF' }
    },

    foodLibrary: [
        { name: '米饭', cat: 'staple', unit: 100, calorie: 130, protein: 2.7, carbs: 28.2, fat: 0.3 },
        { name: '全麦面包', cat: 'staple', unit: 100, calorie: 247, protein: 9.0, carbs: 46.0, fat: 3.4 },
        { name: '面条(煮)', cat: 'staple', unit: 100, calorie: 110, protein: 3.5, carbs: 22.0, fat: 0.6 },
        { name: '燕麦片', cat: 'staple', unit: 100, calorie: 367, protein: 15.0, carbs: 61.0, fat: 7.0 },
        { name: '红薯', cat: 'staple', unit: 100, calorie: 86, protein: 1.6, carbs: 20.0, fat: 0.1 },
        { name: '玉米', cat: 'staple', unit: 100, calorie: 112, protein: 4.0, carbs: 22.8, fat: 1.2 },
        { name: '鸡胸肉', cat: 'meat', unit: 100, calorie: 133, protein: 31.0, carbs: 0, fat: 1.2 },
        { name: '鸡蛋', cat: 'meat', unit: 50, calorie: 78, protein: 6.3, carbs: 0.6, fat: 5.3 },
        { name: '瘦牛肉', cat: 'meat', unit: 100, calorie: 106, protein: 20.2, carbs: 1.2, fat: 2.3 },
        { name: '猪里脊', cat: 'meat', unit: 100, calorie: 155, protein: 20.2, carbs: 1.5, fat: 7.9 },
        { name: '虾仁', cat: 'meat', unit: 100, calorie: 48, protein: 10.4, carbs: 0.1, fat: 0.7 },
        { name: '鸡腿(去皮)', cat: 'meat', unit: 100, calorie: 181, protein: 19.0, carbs: 0, fat: 12.0 },
        { name: '西兰花', cat: 'vegetable', unit: 100, calorie: 36, protein: 4.1, carbs: 4.3, fat: 0.6 },
        { name: '番茄', cat: 'vegetable', unit: 100, calorie: 18, protein: 0.9, carbs: 4.0, fat: 0.2 },
        { name: '黄瓜', cat: 'vegetable', unit: 100, calorie: 16, protein: 0.8, carbs: 2.9, fat: 0.2 },
        { name: '菠菜', cat: 'vegetable', unit: 100, calorie: 28, protein: 2.6, carbs: 4.5, fat: 0.3 },
        { name: '生菜', cat: 'vegetable', unit: 100, calorie: 16, protein: 1.4, carbs: 2.9, fat: 0.4 },
        { name: '胡萝卜', cat: 'vegetable', unit: 100, calorie: 41, protein: 1.0, carbs: 9.6, fat: 0.2 },
        { name: '土豆', cat: 'vegetable', unit: 100, calorie: 81, protein: 2.6, carbs: 17.8, fat: 0.2 },
        { name: '香蕉', cat: 'fruit', unit: 100, calorie: 93, protein: 1.4, carbs: 22.2, fat: 0.2 },
        { name: '苹果', cat: 'fruit', unit: 100, calorie: 54, protein: 0.2, carbs: 13.5, fat: 0.2 },
        { name: '橙子', cat: 'fruit', unit: 100, calorie: 48, protein: 0.8, carbs: 11.1, fat: 0.2 },
        { name: '牛奶', cat: 'dairy', unit: 250, calorie: 163, protein: 8.5, carbs: 12.5, fat: 9.0 },
        { name: '酸奶', cat: 'dairy', unit: 100, calorie: 72, protein: 2.5, carbs: 9.3, fat: 2.7 },
        { name: '豆腐', cat: 'other', unit: 100, calorie: 81, protein: 8.1, carbs: 3.8, fat: 4.2 },
        { name: '坚果(混合)', cat: 'other', unit: 30, calorie: 180, protein: 5.0, carbs: 6.0, fat: 16.0 }
    ],

    foodCatNames: {
        staple: '主食', meat: '肉蛋类', vegetable: '蔬菜',
        fruit: '水果', dairy: '奶制品', other: '其他'
    },

    init() {
        this.loadData();
        this.bindEvents();
        this.renderToday();
        this.renderCalendar();
        this.renderGoals();
        this.renderStats();
        this.renderMealPage();
        this.updateHeaderDate();
        this.startReminderCheck();
        this.registerServiceWorker();
        this.requestNotificationPermission();
    },

    loadData() {
        const savedSchedules = localStorage.getItem('schedules');
        const savedGoals = localStorage.getItem('goals');
        const savedMeals = localStorage.getItem('meals');
        const savedTargets = localStorage.getItem('nutritionTargets');
        const savedShopping = localStorage.getItem('shoppingList');
        if (savedSchedules) this.schedules = JSON.parse(savedSchedules);
        if (savedGoals) this.goals = JSON.parse(savedGoals);
        if (savedMeals) this.meals = JSON.parse(savedMeals);
        if (savedTargets) this.nutritionTargets = JSON.parse(savedTargets);
        if (savedShopping) this.shoppingList = JSON.parse(savedShopping);
    },

    saveMeals() {
        localStorage.setItem('meals', JSON.stringify(this.meals));
    },

    saveNutritionTargets() {
        localStorage.setItem('nutritionTargets', JSON.stringify(this.nutritionTargets));
    },

    saveShoppingList() {
        localStorage.setItem('shoppingList', JSON.stringify(this.shoppingList));
    },

    saveSchedules() {
        localStorage.setItem('schedules', JSON.stringify(this.schedules));
    },

    saveGoals() {
        localStorage.setItem('goals', JSON.stringify(this.goals));
    },

    bindEvents() {
        document.querySelectorAll('.nav-item[data-page]').forEach(item => {
            item.addEventListener('click', () => this.switchPage(item.dataset.page));
        });

        document.getElementById('fab-add').addEventListener('click', () => this.openScheduleModal());

        document.getElementById('modal-close').addEventListener('click', () => this.closeScheduleModal());
        document.getElementById('modal-save').addEventListener('click', () => this.saveSchedule());
        document.getElementById('modal-delete').addEventListener('click', () => this.deleteSchedule());

        document.getElementById('goal-modal-close').addEventListener('click', () => this.closeGoalModal());
        document.getElementById('goal-modal-save').addEventListener('click', () => this.saveGoal());
        document.getElementById('goal-modal-delete').addEventListener('click', () => this.deleteGoal());
        document.getElementById('add-goal-btn').addEventListener('click', () => this.openGoalModal());

        document.getElementById('batch-add-btn').addEventListener('click', () => this.openBatchModal());
        document.getElementById('batch-modal-close').addEventListener('click', () => this.closeBatchModal());
        document.getElementById('batch-cancel').addEventListener('click', () => this.closeBatchModal());
        document.getElementById('batch-generate').addEventListener('click', () => this.generateBatchSchedules());
        document.getElementById('add-slot-btn').addEventListener('click', () => this.addSlot());

        document.getElementById('ai-generate-btn').addEventListener('click', () => this.openAIModal());
        document.getElementById('ai-modal-close').addEventListener('click', () => this.closeAIModal());
        document.getElementById('ai-modal-cancel').addEventListener('click', () => this.closeAIModal());
        document.getElementById('ai-copy-btn').addEventListener('click', () => this.copyAIPrompt());
        document.getElementById('ai-import-btn').addEventListener('click', () => this.parseAIResult());
        document.getElementById('ai-confirm-btn').addEventListener('click', () => this.confirmAIImport());

        document.getElementById('meal-ai-btn').addEventListener('click', () => this.openMealAIModal());
        document.getElementById('meal-ai-modal-close').addEventListener('click', () => this.closeMealAIModal());
        document.getElementById('meal-ai-modal-cancel').addEventListener('click', () => this.closeMealAIModal());
        document.getElementById('meal-ai-copy-btn').addEventListener('click', () => this.copyMealAIPrompt());
        document.getElementById('meal-ai-parse-btn').addEventListener('click', () => this.parseMealAIResult());
        document.getElementById('meal-ai-confirm-btn').addEventListener('click', () => this.confirmMealAIImport());

        document.getElementById('nutrition-settings-btn').addEventListener('click', () => this.openNutritionSettings());
        document.getElementById('nutrition-settings-close').addEventListener('click', () => this.closeNutritionSettings());
        document.getElementById('nutrition-settings-cancel').addEventListener('click', () => this.closeNutritionSettings());
        document.getElementById('nutrition-settings-save').addEventListener('click', () => this.saveNutritionSettings());

        document.querySelectorAll('#weekday-picker .weekday-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                btn.classList.toggle('active');
                this.updateBatchSummary();
            });
        });

        document.getElementById('batch-start-date').addEventListener('change', () => this.updateBatchSummary());
        document.getElementById('batch-end-date').addEventListener('change', () => this.updateBatchSummary());

        document.getElementById('batch-delete-btn').addEventListener('click', () => this.openBatchDeleteModal());
        document.getElementById('batch-delete-modal-close').addEventListener('click', () => this.closeBatchDeleteModal());
        document.getElementById('batch-delete-cancel').addEventListener('click', () => this.closeBatchDeleteModal());
        document.getElementById('batch-delete-confirm').addEventListener('click', () => this.confirmBatchDelete());

        document.querySelectorAll('#delete-weekday-picker .weekday-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                btn.classList.toggle('active');
                this.updateDeleteSummary();
            });
        });

        document.getElementById('delete-start-date').addEventListener('change', () => this.updateDeleteSummary());
        document.getElementById('delete-end-date').addEventListener('change', () => this.updateDeleteSummary());

        document.querySelectorAll('#delete-category-picker .category-option').forEach(opt => {
            opt.addEventListener('click', () => {
                document.querySelectorAll('#delete-category-picker .category-option').forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
                this.updateDeleteSummary();
            });
        });

        document.querySelectorAll('#category-picker .category-option').forEach(opt => {
            opt.addEventListener('click', () => {
                document.querySelectorAll('#category-picker .category-option').forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
                this.selectedCategory = opt.dataset.category;
                this.selectedCategoryColor = opt.dataset.color;
            });
        });

        document.getElementById('meal-prev-day').addEventListener('click', () => {
            this.mealDate.setDate(this.mealDate.getDate() - 1);
            this.renderMealPage();
        });
        document.getElementById('meal-next-day').addEventListener('click', () => {
            this.mealDate.setDate(this.mealDate.getDate() + 1);
            this.renderMealPage();
        });

        document.getElementById('food-modal-close').addEventListener('click', () => this.closeFoodModal());
        document.getElementById('food-modal-cancel').addEventListener('click', () => this.closeFoodModal());
        document.getElementById('food-modal-confirm').addEventListener('click', () => this.confirmAddFood());

        document.querySelectorAll('.food-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.food-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.food-tab-content').forEach(c => c.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById('food-' + tab.dataset.tab + '-tab').classList.add('active');
            });
        });

        document.querySelectorAll('.food-cat-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.food-cat-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.foodCategoryFilter = tab.dataset.cat;
                this.renderFoodList();
            });
        });

        document.getElementById('food-search').addEventListener('input', (e) => {
            this.renderFoodList(e.target.value);
        });

        document.getElementById('amount-minus').addEventListener('click', () => {
            const input = document.getElementById('food-amount');
            const val = Math.max(1, parseInt(input.value) - 10);
            input.value = val;
            this.updateFoodPreview();
        });

        document.getElementById('amount-plus').addEventListener('click', () => {
            const input = document.getElementById('food-amount');
            input.value = parseInt(input.value) + 10;
            this.updateFoodPreview();
        });

        document.getElementById('food-amount').addEventListener('input', () => this.updateFoodPreview());

        document.getElementById('shopping-toggle').addEventListener('click', () => {
            const list = document.getElementById('shopping-list');
            const btn = document.getElementById('shopping-toggle');
            if (list.style.display === 'none') {
                list.style.display = 'block';
                btn.textContent = '收起';
                this.renderShoppingList();
            } else {
                list.style.display = 'none';
                btn.textContent = '展开';
            }
        });

        document.getElementById('prev-month').addEventListener('click', () => {
            this.currentMonth.setMonth(this.currentMonth.getMonth() - 1);
            this.renderCalendar();
        });

        document.getElementById('next-month').addEventListener('click', () => {
            this.currentMonth.setMonth(this.currentMonth.getMonth() + 1);
            this.renderCalendar();
        });

        document.getElementById('goal-progress').addEventListener('input', (e) => {
            document.getElementById('goal-progress-value').textContent = e.target.value + '%';
        });

        document.querySelectorAll('.period-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.period-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.renderStats(tab.dataset.period);
            });
        });

        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('show');
                }
            });
        });

        document.getElementById('data-export-btn').addEventListener('click', () => this.exportData());
        document.getElementById('data-import-btn').addEventListener('click', () => document.getElementById('data-import-file').click());
        document.getElementById('data-import-file').addEventListener('change', (e) => this.importData(e));
    },

    switchPage(page) {
        this.currentPage = page;
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById('page-' + page).classList.add('active');

        document.querySelectorAll('.nav-item[data-page]').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });

        const titles = {
            today: '今日',
            calendar: '日历',
            meal: '食谱',
            goals: '目标',
            stats: '统计'
        };
        document.getElementById('page-title').textContent = titles[page];

        if (page === 'stats') this.renderStats();
        if (page === 'today') this.renderToday();
        if (page === 'goals') this.renderGoals();
        if (page === 'meal') this.renderMealPage();
    },

    updateHeaderDate() {
        const now = new Date();
        const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
        document.getElementById('header-date').textContent = now.toLocaleDateString('zh-CN', options);

        const hour = now.getHours();
        let greeting = '早上好 ☀️';
        if (hour >= 12 && hour < 18) greeting = '下午好 🌤️';
        else if (hour >= 18) greeting = '晚上好 🌙';
        document.getElementById('greeting-text').textContent = greeting;

        const dateOptions = { month: 'long', day: 'numeric' };
        document.getElementById('today-date-text').textContent = now.toLocaleDateString('zh-CN', dateOptions) + ' · 今天也要元气满满哦～';
    },

    formatDate(date) {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    isToday(dateStr) {
        return dateStr === this.formatDate(new Date());
    },

    renderToday() {
        const today = this.formatDate(new Date());
        const todaySchedules = this.schedules
            .filter(s => s.date === today)
            .sort((a, b) => a.time.localeCompare(b.time));

        const completed = todaySchedules.filter(s => s.completed).length;
        const activeGoals = this.goals.filter(g => {
            const now = new Date();
            return new Date(g.startDate) <= now && new Date(g.endDate) >= now && g.progress < 100;
        }).length;

        document.getElementById('today-total').textContent = todaySchedules.length;
        document.getElementById('today-completed').textContent = completed;
        document.getElementById('today-goals').textContent = activeGoals;

        this.renderScheduleList(todaySchedules, 'today-schedule-list');
    },

    renderScheduleList(schedules, containerId) {
        const container = document.getElementById(containerId);
        
        if (schedules.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📝</div>
                    <p>还没有日程安排</p>
                    <p class="empty-hint">点击右下角 + 添加一个吧</p>
                </div>
            `;
            return;
        }

        container.innerHTML = schedules.map(s => {
            const cat = this.categoryMap[s.category] || this.categoryMap.other;
            return `
                <div class="schedule-item ${s.completed ? 'completed' : ''}" data-id="${s.id}" style="--cat-color: ${cat.color}">
                    <div class="schedule-checkbox ${s.completed ? 'checked' : ''}" onclick="App.toggleSchedule('${s.id}')"></div>
                    <div class="schedule-info" onclick="App.editSchedule('${s.id}')">
                        <div class="schedule-title">${this.escapeHtml(s.title)}</div>
                        <div class="schedule-time">
                            <span>🕐 ${s.time || '全天'}</span>
                        </div>
                        <span class="schedule-category" style="background: ${cat.color}20; color: ${cat.color}">
                            ${cat.name}
                        </span>
                        ${s.reminder ? '<div class="reminder-badge">🔔 已设提醒</div>' : ''}
                        ${s.note ? `<div class="schedule-note">${this.escapeHtml(s.note)}</div>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        container.querySelectorAll('.schedule-item').forEach(item => {
            const color = item.style.getPropertyValue('--cat-color').trim();
            if (color) {
                item.style.setProperty('--cat-color', color);
                item.querySelector('.schedule-item::before')?.style.setProperty('background', color);
            }
        });

        const style = document.createElement('style');
        style.textContent = schedules.map(s => {
            const cat = this.categoryMap[s.category] || this.categoryMap.other;
            return `.schedule-item[data-id="${s.id}"]::before { background: ${cat.color} !important; }`;
        }).join('\n');
        if (!document.getElementById('dynamic-styles')) {
            style.id = 'dynamic-styles';
            document.head.appendChild(style);
        } else {
            document.getElementById('dynamic-styles').textContent = style.textContent;
        }
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    toggleSchedule(id) {
        const schedule = this.schedules.find(s => s.id === id);
        if (schedule) {
            schedule.completed = !schedule.completed;
            this.saveSchedules();
            this.renderToday();
            this.renderCalendar();
            this.renderStats();
        }
    },

    openScheduleModal(scheduleId = null) {
        const modal = document.getElementById('schedule-modal');
        const titleEl = document.getElementById('modal-title');
        const deleteBtn = document.getElementById('modal-delete');

        this.editingScheduleId = scheduleId;

        if (scheduleId) {
            const schedule = this.schedules.find(s => s.id === scheduleId);
            if (schedule) {
                titleEl.textContent = '编辑日程';
                deleteBtn.style.display = 'block';
                document.getElementById('schedule-title').value = schedule.title;
                document.getElementById('schedule-date').value = schedule.date;
                document.getElementById('schedule-time').value = schedule.time || '';
                document.getElementById('schedule-note').value = schedule.note || '';
                document.getElementById('schedule-reminder').checked = schedule.reminder || false;

                document.querySelectorAll('.category-option').forEach(opt => {
                    opt.classList.toggle('active', opt.dataset.category === schedule.category);
                    if (opt.dataset.category === schedule.category) {
                        this.selectedCategory = schedule.category;
                        this.selectedCategoryColor = opt.dataset.color;
                    }
                });
            }
        } else {
            titleEl.textContent = '添加日程';
            deleteBtn.style.display = 'none';
            document.getElementById('schedule-title').value = '';
            document.getElementById('schedule-date').value = this.formatDate(this.selectedDate);
            document.getElementById('schedule-time').value = '';
            document.getElementById('schedule-note').value = '';
            document.getElementById('schedule-reminder').checked = false;

            document.querySelectorAll('.category-option').forEach((opt, i) => {
                opt.classList.toggle('active', i === 0);
            });
            this.selectedCategory = 'study';
            this.selectedCategoryColor = '#4ECDC4';
        }

        modal.classList.add('show');
    },

    closeScheduleModal() {
        document.getElementById('schedule-modal').classList.remove('show');
        this.editingScheduleId = null;
    },

    saveSchedule() {
        const title = document.getElementById('schedule-title').value.trim();
        const date = document.getElementById('schedule-date').value;
        const time = document.getElementById('schedule-time').value;
        const note = document.getElementById('schedule-note').value.trim();
        const reminder = document.getElementById('schedule-reminder').checked;

        if (!title) {
            alert('请输入日程标题');
            return;
        }
        if (!date) {
            alert('请选择日期');
            return;
        }

        if (this.editingScheduleId) {
            const schedule = this.schedules.find(s => s.id === this.editingScheduleId);
            if (schedule) {
                schedule.title = title;
                schedule.date = date;
                schedule.time = time;
                schedule.category = this.selectedCategory;
                schedule.note = note;
                schedule.reminder = reminder;
            }
        } else {
            this.schedules.push({
                id: Date.now().toString(),
                title,
                date,
                time,
                category: this.selectedCategory,
                note,
                reminder,
                completed: false,
                createdAt: new Date().toISOString()
            });
        }

        this.saveSchedules();
        this.closeScheduleModal();
        this.renderToday();
        this.renderCalendar();
        this.renderStats();
        this.scheduleReminders();
    },

    editSchedule(id) {
        this.openScheduleModal(id);
    },

    deleteSchedule() {
        if (!this.editingScheduleId) return;
        if (!confirm('确定要删除这个日程吗？')) return;

        this.schedules = this.schedules.filter(s => s.id !== this.editingScheduleId);
        this.saveSchedules();
        this.closeScheduleModal();
        this.renderToday();
        this.renderCalendar();
        this.renderStats();
    },

    renderCalendar() {
        const year = this.currentMonth.getFullYear();
        const month = this.currentMonth.getMonth();

        document.getElementById('calendar-title').textContent = `${year}年${month + 1}月`;

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDay = firstDay.getDay();
        const daysInMonth = lastDay.getDate();

        const prevMonthLastDay = new Date(year, month, 0).getDate();

        const grid = document.getElementById('calendar-grid');
        let html = '';

        for (let i = startDay - 1; i >= 0; i--) {
            const day = prevMonthLastDay - i;
            const dateStr = this.formatDate(new Date(year, month - 1, day));
            const hasSchedule = this.schedules.some(s => s.date === dateStr);
            html += `<div class="calendar-day other-month ${hasSchedule ? 'has-schedule' : ''}" data-date="${dateStr}">${day}</div>`;
        }

        const todayStr = this.formatDate(new Date());
        const selectedStr = this.formatDate(this.selectedDate);

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = this.formatDate(new Date(year, month, day));
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedStr;
            const hasSchedule = this.schedules.some(s => s.date === dateStr);

            let classes = 'calendar-day';
            if (isToday) classes += ' today';
            if (isSelected) classes += ' selected';
            if (hasSchedule) classes += ' has-schedule';

            html += `<div class="${classes}" data-date="${dateStr}">${day}</div>`;
        }

        const totalCells = Math.ceil((startDay + daysInMonth) / 7) * 7;
        const remaining = totalCells - (startDay + daysInMonth);
        for (let day = 1; day <= remaining; day++) {
            const dateStr = this.formatDate(new Date(year, month + 1, day));
            const hasSchedule = this.schedules.some(s => s.date === dateStr);
            html += `<div class="calendar-day other-month ${hasSchedule ? 'has-schedule' : ''}" data-date="${dateStr}">${day}</div>`;
        }

        grid.innerHTML = html;

        grid.querySelectorAll('.calendar-day').forEach(day => {
            day.addEventListener('click', () => {
                this.selectedDate = new Date(day.dataset.date);
                this.renderCalendar();
                this.renderDaySchedule();
            });
        });

        this.renderDaySchedule();
    },

    renderDaySchedule() {
        const dateStr = this.formatDate(this.selectedDate);
        const daySchedules = this.schedules
            .filter(s => s.date === dateStr)
            .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

        const dateOptions = { month: 'long', day: 'numeric', weekday: 'long' };
        document.getElementById('selected-day-title').textContent = 
            this.selectedDate.toLocaleDateString('zh-CN', dateOptions);

        this.renderScheduleList(daySchedules, 'day-schedule-list');
    },

    renderGoals() {
        const container = document.getElementById('goals-list');

        if (this.goals.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🎯</div>
                    <p>还没有设定目标</p>
                    <p class="empty-hint">给自己定个小目标吧</p>
                </div>
            `;
            return;
        }

        const now = new Date();
        const sortedGoals = [...this.goals].sort((a, b) => {
            const aEnd = new Date(a.endDate);
            const bEnd = new Date(b.endDate);
            return aEnd - bEnd;
        });

        container.innerHTML = sortedGoals.map(g => {
            const isCompleted = g.progress >= 100;
            const start = new Date(g.startDate);
            const end = new Date(g.endDate);
            const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
            const daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24));

            let statusText = '进行中';
            let statusClass = '';
            if (isCompleted) {
                statusText = '已完成';
                statusClass = 'completed';
            } else if (daysLeft < 0) {
                statusText = '已过期';
            } else if (daysLeft <= 7) {
                statusText = `剩${daysLeft}天`;
            }

            return `
                <div class="goal-card" onclick="App.editGoal('${g.id}')">
                    <div class="goal-header">
                        <div class="goal-title">${this.escapeHtml(g.title)}</div>
                        <span class="goal-status ${statusClass}">${statusText}</span>
                    </div>
                    ${g.description ? `<div class="goal-desc">${this.escapeHtml(g.description)}</div>` : ''}
                    <div class="goal-progress-bar">
                        <div class="goal-progress-fill" style="width: ${g.progress}%"></div>
                    </div>
                    <div class="goal-meta">
                        <span>进度 ${g.progress}%</span>
                        <span>${start.getMonth() + 1}/${start.getDate()} - ${end.getMonth() + 1}/${end.getDate()}</span>
                    </div>
                </div>
            `;
        }).join('');
    },

    openGoalModal(goalId = null) {
        const modal = document.getElementById('goal-modal');
        const titleEl = document.getElementById('goal-modal-title');
        const deleteBtn = document.getElementById('goal-modal-delete');

        this.editingGoalId = goalId;

        if (goalId) {
            const goal = this.goals.find(g => g.id === goalId);
            if (goal) {
                titleEl.textContent = '编辑目标';
                deleteBtn.style.display = 'block';
                document.getElementById('goal-title').value = goal.title;
                document.getElementById('goal-start-date').value = goal.startDate;
                document.getElementById('goal-end-date').value = goal.endDate;
                document.getElementById('goal-desc').value = goal.description || '';
                document.getElementById('goal-progress').value = goal.progress;
                document.getElementById('goal-progress-value').textContent = goal.progress + '%';
            }
        } else {
            titleEl.textContent = '添加目标';
            deleteBtn.style.display = 'none';
            document.getElementById('goal-title').value = '';
            document.getElementById('goal-start-date').value = this.formatDate(new Date());
            const nextMonth = new Date();
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            document.getElementById('goal-end-date').value = this.formatDate(nextMonth);
            document.getElementById('goal-desc').value = '';
            document.getElementById('goal-progress').value = 0;
            document.getElementById('goal-progress-value').textContent = '0%';
        }

        modal.classList.add('show');
    },

    closeGoalModal() {
        document.getElementById('goal-modal').classList.remove('show');
        this.editingGoalId = null;
    },

    saveGoal() {
        const title = document.getElementById('goal-title').value.trim();
        const startDate = document.getElementById('goal-start-date').value;
        const endDate = document.getElementById('goal-end-date').value;
        const description = document.getElementById('goal-desc').value.trim();
        const progress = parseInt(document.getElementById('goal-progress').value);

        if (!title) {
            alert('请输入目标名称');
            return;
        }
        if (!startDate || !endDate) {
            alert('请选择开始和截止日期');
            return;
        }
        if (new Date(endDate) < new Date(startDate)) {
            alert('截止日期不能早于开始日期');
            return;
        }

        if (this.editingGoalId) {
            const goal = this.goals.find(g => g.id === this.editingGoalId);
            if (goal) {
                goal.title = title;
                goal.startDate = startDate;
                goal.endDate = endDate;
                goal.description = description;
                goal.progress = progress;
            }
        } else {
            this.goals.push({
                id: Date.now().toString(),
                title,
                startDate,
                endDate,
                description,
                progress,
                createdAt: new Date().toISOString()
            });
        }

        this.saveGoals();
        this.closeGoalModal();
        this.renderGoals();
        this.renderToday();
    },

    editGoal(id) {
        this.openGoalModal(id);
    },

    deleteGoal() {
        if (!this.editingGoalId) return;
        if (!confirm('确定要删除这个目标吗？')) return;

        this.goals = this.goals.filter(g => g.id !== this.editingGoalId);
        this.saveGoals();
        this.closeGoalModal();
        this.renderGoals();
        this.renderToday();
    },

    renderStats(period = 'week') {
        const now = new Date();
        let startDate;

        if (period === 'week') {
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 6);
        } else if (period === 'month') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        } else {
            startDate = new Date(0);
        }

        const filteredSchedules = this.schedules.filter(s => {
            const scheduleDate = new Date(s.date);
            return scheduleDate >= startDate && scheduleDate <= now;
        });

        const total = filteredSchedules.length;
        const completed = filteredSchedules.filter(s => s.completed).length;
        const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

        document.getElementById('stats-total').textContent = total;
        document.getElementById('stats-completed').textContent = completed;
        document.getElementById('stats-rate').textContent = rate + '%';

        const categoryCounts = {};
        Object.keys(this.categoryMap).forEach(cat => {
            categoryCounts[cat] = 0;
        });

        filteredSchedules.forEach(s => {
            if (categoryCounts[s.category] !== undefined) {
                categoryCounts[s.category]++;
            }
        });

        const categoryStatsEl = document.getElementById('category-stats');
        const maxCount = Math.max(...Object.values(categoryCounts), 1);

        categoryStatsEl.innerHTML = Object.entries(this.categoryMap).map(([key, cat]) => {
            const count = categoryCounts[key] || 0;
            const percent = (count / maxCount) * 100;
            return `
                <div class="category-stat-item">
                    <div class="category-stat-header">
                        <span class="category-stat-name">
                            <span class="cat-dot" style="background: ${cat.color}"></span>
                            ${cat.name}
                        </span>
                        <span>${count}个</span>
                    </div>
                    <div class="category-stat-bar">
                        <div class="category-stat-fill" style="width: ${percent}%; background: ${cat.color}"></div>
                    </div>
                </div>
            `;
        }).join('');

        this.renderTrendChart(startDate, now);
    },

    renderTrendChart(startDate, endDate) {
        const chart = document.getElementById('trend-chart');
        const days = [];
        let current = new Date(startDate);

        while (current <= endDate) {
            days.push(this.formatDate(current));
            current.setDate(current.getDate() + 1);
        }

        if (days.length > 7) {
            const step = Math.ceil(days.length / 7);
            const sampled = [];
            for (let i = 0; i < days.length; i += step) {
                sampled.push(days[i]);
            }
            days.length = 0;
            days.push(...sampled);
        }

        const counts = days.map(date => {
            return this.schedules.filter(s => s.date === date && s.completed).length;
        });

        const maxCount = Math.max(...counts, 1);

        chart.innerHTML = days.map((date, i) => {
            const height = (counts[i] / maxCount) * 100;
            const d = new Date(date);
            const label = `${d.getMonth() + 1}/${d.getDate()}`;
            return `
                <div class="trend-bar">
                    <div class="trend-bar-fill" style="height: ${Math.max(height, 4)}%"></div>
                    <span class="trend-bar-label">${label}</span>
                </div>
            `;
        }).join('');
    },

    requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    },

    startReminderCheck() {
        this.scheduleReminders();
        setInterval(() => this.scheduleReminders(), 60000);
    },

    scheduleReminders() {
        Object.values(this.reminderTimeouts).forEach(timeout => clearTimeout(timeout));
        this.reminderTimeouts = {};

        const now = new Date();
        const today = this.formatDate(now);

        this.schedules.forEach(schedule => {
            if (!schedule.reminder || !schedule.time || schedule.completed) return;
            if (schedule.date !== today) return;

            const [hours, minutes] = schedule.time.split(':').map(Number);
            const reminderTime = new Date();
            reminderTime.setHours(hours, minutes, 0, 0);

            const diff = reminderTime - now;
            if (diff > 0 && diff < 24 * 60 * 60 * 1000) {
                this.reminderTimeouts[schedule.id] = setTimeout(() => {
                    this.showReminder(schedule);
                }, diff);
            }
        });
    },

    showReminder(schedule) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('日程提醒 🔔', {
                body: schedule.title,
                icon: 'icons/icon-192.png'
            });
        }

        if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
        }
    },

    openBatchModal() {
        const modal = document.getElementById('batch-modal');
        const today = this.formatDate(new Date());
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        document.getElementById('batch-start-date').value = today;
        document.getElementById('batch-end-date').value = this.formatDate(nextMonth);

        this.resetSlots();
        this.updateBatchSummary();
        modal.classList.add('show');
    },

    closeBatchModal() {
        document.getElementById('batch-modal').classList.remove('show');
    },

    resetSlots() {
        const container = document.getElementById('time-slots');
        container.innerHTML = `
            <div class="time-slot-item" data-slot="0">
                <div class="slot-time-row">
                    <input type="time" class="slot-time" value="08:00">
                    <span class="slot-arrow">→</span>
                    <input type="time" class="slot-time-end" value="09:00">
                </div>
                <div class="slot-info-row">
                    <input type="text" class="slot-title" placeholder="日程标题" value="早读">
                    <select class="slot-category">
                        <option value="study">学习</option>
                        <option value="exercise">运动</option>
                        <option value="entertainment">娱乐</option>
                        <option value="life">生活</option>
                        <option value="other">其他</option>
                    </select>
                    <button class="slot-delete" onclick="App.removeSlot(0)">×</button>
                </div>
            </div>
        `;
        this.bindSlotEvents();
    },

    addSlot() {
        const container = document.getElementById('time-slots');
        const slotCount = container.querySelectorAll('.time-slot-item').length;
        const slotHtml = `
            <div class="time-slot-item" data-slot="${slotCount}">
                <div class="slot-time-row">
                    <input type="time" class="slot-time" value="09:00">
                    <span class="slot-arrow">→</span>
                    <input type="time" class="slot-time-end" value="10:00">
                </div>
                <div class="slot-info-row">
                    <input type="text" class="slot-title" placeholder="日程标题" value="">
                    <select class="slot-category">
                        <option value="study">学习</option>
                        <option value="exercise">运动</option>
                        <option value="entertainment">娱乐</option>
                        <option value="life">生活</option>
                        <option value="other">其他</option>
                    </select>
                    <button class="slot-delete" onclick="App.removeSlot(${slotCount})">×</button>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', slotHtml);
        this.bindSlotEvents();
        this.updateBatchSummary();
    },

    removeSlot(index) {
        const container = document.getElementById('time-slots');
        const slots = container.querySelectorAll('.time-slot-item');
        if (slots.length <= 1) {
            alert('至少保留一个时间段哦');
            return;
        }
        slots[index].remove();
        this.updateBatchSummary();
    },

    bindSlotEvents() {
        document.querySelectorAll('.time-slot-item').forEach(slot => {
            slot.querySelectorAll('input').forEach(input => {
                input.addEventListener('change', () => this.updateBatchSummary());
            });
            slot.querySelector('select').addEventListener('change', () => this.updateBatchSummary());
        });
    },

    getSelectedWeekdays() {
        const days = [];
        document.querySelectorAll('.weekday-btn.active').forEach(btn => {
            days.push(parseInt(btn.dataset.day));
        });
        return days;
    },

    getSlots() {
        const slots = [];
        document.querySelectorAll('.time-slot-item').forEach(slot => {
            const title = slot.querySelector('.slot-title').value.trim();
            const time = slot.querySelector('.slot-time').value;
            const category = slot.querySelector('.slot-category').value;
            if (title && time) {
                slots.push({ title, time, category });
            }
        });
        return slots.sort((a, b) => a.time.localeCompare(b.time));
    },

    updateBatchSummary() {
        const startDate = document.getElementById('batch-start-date').value;
        const endDate = document.getElementById('batch-end-date').value;
        const weekdays = this.getSelectedWeekdays();
        const slots = this.getSlots();

        if (!startDate || !endDate || weekdays.length === 0 || slots.length === 0) {
            document.getElementById('batch-count').textContent = '0';
            return;
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        if (end < start) {
            document.getElementById('batch-count').textContent = '0';
            return;
        }

        let dayCount = 0;
        const current = new Date(start);
        while (current <= end) {
            if (weekdays.includes(current.getDay())) {
                dayCount++;
            }
            current.setDate(current.getDate() + 1);
        }

        const total = dayCount * slots.length;
        document.getElementById('batch-count').textContent = total;
    },

    generateBatchSchedules() {
        const startDate = document.getElementById('batch-start-date').value;
        const endDate = document.getElementById('batch-end-date').value;
        const weekdays = this.getSelectedWeekdays();
        const slots = this.getSlots();

        if (!startDate || !endDate) {
            alert('请选择开始和结束日期');
            return;
        }
        if (weekdays.length === 0) {
            alert('请至少选择一个星期');
            return;
        }
        if (slots.length === 0) {
            alert('请至少添加一个日程');
            return;
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        if (end < start) {
            alert('结束日期不能早于开始日期');
            return;
        }

        let count = 0;
        const current = new Date(start);
        while (current <= end) {
            if (weekdays.includes(current.getDay())) {
                const dateStr = this.formatDate(current);
                slots.forEach(slot => {
                    const exists = this.schedules.some(s => 
                        s.date === dateStr && s.time === slot.time && s.title === slot.title
                    );
                    if (!exists) {
                        this.schedules.push({
                            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                            title: slot.title,
                            date: dateStr,
                            time: slot.time,
                            category: slot.category,
                            note: '',
                            reminder: false,
                            completed: false,
                            createdAt: new Date().toISOString()
                        });
                        count++;
                    }
                });
            }
            current.setDate(current.getDate() + 1);
        }

        this.saveSchedules();
        this.closeBatchModal();
        this.renderToday();
        this.renderCalendar();
        this.renderStats();
        this.scheduleReminders();

        alert(`成功生成 ${count} 个日程！`);
    },

    openBatchDeleteModal() {
        const modal = document.getElementById('batch-delete-modal');
        const today = this.formatDate(new Date());
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        document.getElementById('delete-start-date').value = today;
        document.getElementById('delete-end-date').value = this.formatDate(nextMonth);

        document.querySelectorAll('#delete-weekday-picker .weekday-btn').forEach(btn => btn.classList.add('active'));
        document.querySelectorAll('#delete-category-picker .category-option').forEach((opt, i) => {
            opt.classList.toggle('active', i === 0);
        });

        this.updateDeleteSummary();
        modal.classList.add('show');
    },

    closeBatchDeleteModal() {
        document.getElementById('batch-delete-modal').classList.remove('show');
    },

    getDeleteWeekdays() {
        const days = [];
        document.querySelectorAll('#delete-weekday-picker .weekday-btn.active').forEach(btn => {
            days.push(parseInt(btn.dataset.day));
        });
        return days;
    },

    getDeleteCategory() {
        const active = document.querySelector('#delete-category-picker .category-option.active');
        return active ? active.dataset.category : 'all';
    },

    findSchedulesToDelete() {
        const startDate = document.getElementById('delete-start-date').value;
        const endDate = document.getElementById('delete-end-date').value;
        const weekdays = this.getDeleteWeekdays();
        const category = this.getDeleteCategory();

        if (!startDate || !endDate || weekdays.length === 0) return [];

        const start = new Date(startDate);
        const end = new Date(endDate);
        if (end < start) return [];

        return this.schedules.filter(s => {
            const scheduleDate = new Date(s.date);
            if (scheduleDate < start || scheduleDate > end) return false;
            if (!weekdays.includes(scheduleDate.getDay())) return false;
            if (category !== 'all' && s.category !== category) return false;
            return true;
        });
    },

    updateDeleteSummary() {
        const count = this.findSchedulesToDelete().length;
        document.getElementById('delete-count').textContent = count;
    },

    confirmBatchDelete() {
        const toDelete = this.findSchedulesToDelete();
        if (toDelete.length === 0) {
            alert('没有找到匹配的日程');
            return;
        }

        if (!confirm(`确定要删除 ${toDelete.length} 个日程吗？此操作不可撤销。`)) return;

        const deleteIds = new Set(toDelete.map(s => s.id));
        this.schedules = this.schedules.filter(s => !deleteIds.has(s.id));

        this.saveSchedules();
        this.closeBatchDeleteModal();
        this.renderToday();
        this.renderCalendar();
        this.renderStats();
        this.scheduleReminders();

        alert(`成功删除 ${toDelete.length} 个日程！`);
    },

    // === AI导入日程 ===

    aiParsedSlots: [],

    buildAIPrompt() {
        return `你是一个日程规划助手。请根据用户的需求，生成一天的时间表。

输出格式要求（严格遵守，每行一个日程，用逗号分隔）：
时间,标题,分类

时间格式：HH:MM
分类只能是以下5个之一：学习,运动,娱乐,生活,其他

示例输出：
07:00,起床洗漱,生活
07:30,晨跑,运动
08:30,学习数学,学习
11:30,午餐,生活
12:30,午休,生活
14:00,学习英语,学习
16:00,健身,运动
17:30,洗澡休息,生活
18:00,晚餐,生活
19:00,看书,学习
21:00,自由时间,娱乐
22:30,准备睡觉,生活

规则：
1. 只输出日程列表，不要输出任何其他内容
2. 不要输出markdown代码块
3. 每行格式严格为：时间,标题,分类
4. 时间用24小时制
5. 分类必须从"学习,运动,娱乐,生活,其他"中选择
6. 合理安排休息和吃饭时间
7. 根据用户的具体需求来安排，不要完全照抄示例

请根据以下需求生成一天的时间表：`;
    },

    openAIModal() {
        document.getElementById('ai-prompt-text').textContent = this.buildAIPrompt();
        document.getElementById('ai-result-input').value = '';
        document.getElementById('ai-preview-section').style.display = 'none';
        document.getElementById('ai-confirm-btn').disabled = true;
        this.aiParsedSlots = [];
        document.getElementById('ai-modal').classList.add('show');
    },

    closeAIModal() {
        document.getElementById('ai-modal').classList.remove('show');
    },

    copyAIPrompt() {
        const prompt = this.buildAIPrompt();
        const textArea = document.createElement('textarea');
        textArea.value = prompt;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            const btn = document.getElementById('ai-copy-btn');
            const originalText = btn.textContent;
            btn.textContent = '✅ 已复制！去发给AI吧';
            btn.style.background = 'var(--success)';
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '';
            }, 2000);
        } catch (e) {
            alert('复制失败，请手动长按选中提示词复制');
        }
        document.body.removeChild(textArea);
    },

    parseAIResult() {
        const text = document.getElementById('ai-result-input').value.trim();
        if (!text) {
            alert('请先粘贴AI生成的日程');
            return;
        }

        const categoryMap = {
            '学习': 'study', '运动': 'exercise', '娱乐': 'entertainment',
            '生活': 'life', '其他': 'other'
        };

        const slots = [];
        const lines = text.split('\n');

        lines.forEach(line => {
            line = line.trim();
            if (!line) return;
            // 去掉markdown代码块标记
            if (line.startsWith('```')) return;

            const parts = line.split(/[,，]/).map(p => p.trim());
            if (parts.length < 2) return;

            const time = parts[0];
            const title = parts[1];
            let category = 'other';

            if (parts[2]) {
                category = categoryMap[parts[2]] || 'other';
            }

            // 验证时间格式
            if (!/^\d{1,2}:\d{2}$/.test(time)) return;

            slots.push({ time, title, category });
        });

        if (slots.length === 0) {
            alert('没有解析到有效日程，请检查格式：每行一个，格式为 时间,标题,分类');
            return;
        }

        // 按时间排序
        slots.sort((a, b) => a.time.localeCompare(b.time));
        this.aiParsedSlots = slots;

        // 渲染预览
        const catNames = { study: '学习', exercise: '运动', entertainment: '娱乐', life: '生活', other: '其他' };
        const catColors = { study: '#4ECDC4', exercise: '#FF6B6B', entertainment: '#FFE66D', life: '#95E1D3', other: '#C9B1FF' };

        document.getElementById('ai-preview-list').innerHTML = slots.map(s => `
            <div class="ai-preview-item">
                <span class="ai-preview-time">${s.time}</span>
                <span class="ai-preview-title">${this.escapeHtml(s.title)}</span>
                <span class="ai-preview-cat" style="background:${catColors[s.category]}20;color:${catColors[s.category]}">${catNames[s.category]}</span>
            </div>
        `).join('');

        document.getElementById('ai-preview-count').textContent = slots.length;
        document.getElementById('ai-preview-section').style.display = 'block';
        document.getElementById('ai-confirm-btn').disabled = false;
    },

    confirmAIImport() {
        if (this.aiParsedSlots.length === 0) return;

        const container = document.getElementById('time-slots');
        container.innerHTML = '';

        this.aiParsedSlots.forEach((slot, i) => {
            const slotHtml = `
                <div class="time-slot-item" data-slot="${i}">
                    <div class="slot-time-row">
                        <input type="time" class="slot-time" value="${slot.time}">
                        <span class="slot-arrow">→</span>
                        <input type="time" class="slot-time-end" value="${this.nextHour(slot.time)}">
                    </div>
                    <div class="slot-info-row">
                        <input type="text" class="slot-title" placeholder="日程标题" value="${this.escapeHtml(slot.title)}">
                        <select class="slot-category">
                            <option value="study" ${slot.category === 'study' ? 'selected' : ''}>学习</option>
                            <option value="exercise" ${slot.category === 'exercise' ? 'selected' : ''}>运动</option>
                            <option value="entertainment" ${slot.category === 'entertainment' ? 'selected' : ''}>娱乐</option>
                            <option value="life" ${slot.category === 'life' ? 'selected' : ''}>生活</option>
                            <option value="other" ${slot.category === 'other' ? 'selected' : ''}>其他</option>
                        </select>
                        <button class="slot-delete" onclick="App.removeSlot(${i})">×</button>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', slotHtml);
        });

        this.bindSlotEvents();
        this.updateBatchSummary();
        this.closeAIModal();

        // 滚动到模板区域
        document.getElementById('time-slots').scrollIntoView({ behavior: 'smooth' });
    },

    nextHour(time) {
        const [h, m] = time.split(':').map(Number);
        const nextH = (h + 1) % 24;
        return String(nextH).padStart(2, '0') + ':' + String(m).padStart(2, '0');
    },

    // === 食谱功能 ===

    getMealKey(date) {
        return this.formatDate(date || this.mealDate);
    },

    getDayMeals(date) {
        const key = this.getMealKey(date);
        if (!this.meals[key]) {
            this.meals[key] = { breakfast: [], lunch: [], dinner: [], snack: [] };
        }
        return this.meals[key];
    },

    renderMealPage() {
        const dateStr = this.getMealKey();
        const today = this.formatDate(new Date());
        let displayText;
        if (dateStr === today) {
            displayText = '今天';
        } else {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            if (dateStr === this.formatDate(tomorrow)) displayText = '明天';
            else if (dateStr === this.formatDate(yesterday)) displayText = '昨天';
            else {
                const d = new Date(this.mealDate);
                displayText = `${d.getMonth() + 1}月${d.getDate()}日`;
            }
        }
        document.getElementById('meal-date-display').textContent = displayText;

        document.getElementById('calorie-target').textContent = this.nutritionTargets.calorie;
        document.getElementById('protein-target').textContent = this.nutritionTargets.protein;
        document.getElementById('carbs-target').textContent = this.nutritionTargets.carbs;
        document.getElementById('fat-target').textContent = this.nutritionTargets.fat;

        const dayMeals = this.getDayMeals();
        const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];

        let totals = { calorie: 0, protein: 0, carbs: 0, fat: 0 };

        mealTypes.forEach(type => {
            const items = dayMeals[type] || [];
            let mealCal = 0;
            const container = document.getElementById(type + '-items');

            if (items.length === 0) {
                const labels = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack: '加餐' };
                container.innerHTML = `<div class="empty-meal" onclick="App.openFoodModal('${type}')">+ 添加${labels[type]}</div>`;
            } else {
                const dishGroups = {};
                const dishOrder = [];
                items.forEach(item => {
                    const key = item.dishName || '__solo__';
                    if (!dishGroups[key]) {
                        dishGroups[key] = [];
                        dishOrder.push(key);
                    }
                    dishGroups[key].push(item);
                });

                const html = dishOrder.map(key => {
                    const dishItems = dishGroups[key];
                    const dishName = key === '__solo__' ? null : key;

                    const itemsHtml = dishItems.map(item => {
                        const ratio = item.amount / item.food.unit;
                        const cal = Math.round(item.food.calorie * ratio);
                        mealCal += cal;
                        totals.calorie += cal;
                        totals.protein += Math.round(item.food.protein * ratio * 10) / 10;
                        totals.carbs += Math.round(item.food.carbs * ratio * 10) / 10;
                        totals.fat += Math.round(item.food.fat * ratio * 10) / 10;

                        return `
                            <div class="meal-item ${item.eaten ? 'eaten' : ''}" data-id="${item.id}">
                                <div class="meal-item-check ${item.eaten ? 'checked' : ''}" onclick="App.toggleMealItem('${type}','${item.id}')">${item.eaten ? '✓' : ''}</div>
                                <div class="meal-item-info" onclick="App.toggleMealItem('${type}','${item.id}')">
                                    <div class="meal-item-name">${this.escapeHtml(item.food.name)}</div>
                                    <div class="meal-item-detail">${item.amount}g · 蛋白${Math.round(item.food.protein * ratio * 10) / 10}g 碳水${Math.round(item.food.carbs * ratio * 10) / 10}g</div>
                                </div>
                                <span class="meal-item-cal">${cal} kcal</span>
                                <button class="meal-item-delete" onclick="App.removeMealItem('${type}','${item.id}')">×</button>
                            </div>
                        `;
                    }).join('');

                    if (dishName) {
                        const dishCal = dishItems.reduce((sum, item) => {
                            const ratio = item.amount / item.food.unit;
                            return sum + Math.round(item.food.calorie * ratio);
                        }, 0);
                        return `
                            <div class="meal-dish">
                                <div class="meal-dish-header">
                                    <span class="meal-dish-name">🍽 ${this.escapeHtml(dishName)}</span>
                                    <span class="meal-dish-cal">${dishCal} kcal</span>
                                </div>
                                <div class="meal-dish-items">${itemsHtml}</div>
                            </div>
                        `;
                    } else {
                        return itemsHtml;
                    }
                }).join('');

                container.innerHTML = html;
            }
            document.getElementById(type + '-cal').textContent = mealCal + ' kcal';

            const clearBtn = document.getElementById(type + '-clear');
            if (clearBtn) {
                clearBtn.style.display = items.length > 0 ? '' : 'none';
            }
        });

        const hasAnyMeal = mealTypes.some(type => (dayMeals[type] || []).length > 0);
        const clearDayBtn = document.getElementById('meal-clear-day');
        if (clearDayBtn) {
            clearDayBtn.style.display = hasAnyMeal ? '' : 'none';
        }

        this.updateNutritionDisplay(totals);
    },

    updateNutritionDisplay(totals) {
        const t = this.nutritionTargets;
        document.getElementById('calorie-current').textContent = totals.calorie;
        document.getElementById('protein-current').textContent = Math.round(totals.protein);
        document.getElementById('carbs-current').textContent = Math.round(totals.carbs);
        document.getElementById('fat-current').textContent = Math.round(totals.fat);

        const calRatio = Math.min(totals.calorie / t.calorie, 1);
        const circumference = 327;
        document.getElementById('calorie-ring-fill').style.strokeDashoffset = circumference * (1 - calRatio);

        document.getElementById('protein-fill').style.width = Math.min(totals.protein / t.protein * 100, 100) + '%';
        document.getElementById('carbs-fill').style.width = Math.min(totals.carbs / t.carbs * 100, 100) + '%';
        document.getElementById('fat-fill').style.width = Math.min(totals.fat / t.fat * 100, 100) + '%';
    },

    toggleMealItem(mealType, itemId) {
        const dayMeals = this.getDayMeals();
        const item = dayMeals[mealType].find(i => i.id === itemId);
        if (item) {
            item.eaten = !item.eaten;
            this.saveMeals();
            this.renderMealPage();
        }
    },

    removeMealItem(mealType, itemId) {
        const dayMeals = this.getDayMeals();
        dayMeals[mealType] = dayMeals[mealType].filter(i => i.id !== itemId);
        this.saveMeals();
        this.renderMealPage();
    },

    clearMeal(mealType) {
        const labels = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack: '加餐' };
        if (!confirm(`确定要清空${labels[mealType]}吗？`)) return;

        const dayMeals = this.getDayMeals();
        dayMeals[mealType] = [];
        this.saveMeals();
        this.renderMealPage();
    },

    clearDayMeals() {
        if (!confirm('确定要清空今天所有的食谱吗？（早午晚加餐都会被删除）')) return;

        const key = this.getMealKey();
        this.meals[key] = { breakfast: [], lunch: [], dinner: [], snack: [] };
        this.saveMeals();
        this.renderMealPage();
    },

    openNutritionSettings() {
        document.getElementById('target-calorie').value = this.nutritionTargets.calorie;
        document.getElementById('target-protein').value = this.nutritionTargets.protein;
        document.getElementById('target-carbs').value = this.nutritionTargets.carbs;
        document.getElementById('target-fat').value = this.nutritionTargets.fat;
        document.getElementById('nutrition-settings-modal').classList.add('show');
    },

    closeNutritionSettings() {
        document.getElementById('nutrition-settings-modal').classList.remove('show');
    },

    saveNutritionSettings() {
        this.nutritionTargets.calorie = parseInt(document.getElementById('target-calorie').value) || 0;
        this.nutritionTargets.protein = parseInt(document.getElementById('target-protein').value) || 0;
        this.nutritionTargets.carbs = parseInt(document.getElementById('target-carbs').value) || 0;
        this.nutritionTargets.fat = parseInt(document.getElementById('target-fat').value) || 0;
        this.saveNutritionTargets();
        this.renderMealPage();
        this.closeNutritionSettings();
    },

    applyNutritionPreset(type) {
        const presets = {
            cutting: { calorie: 1800, protein: 150, carbs: 150, fat: 60 },
            bulking: { calorie: 2800, protein: 160, carbs: 350, fat: 90 },
            maintain: { calorie: 2200, protein: 140, carbs: 250, fat: 70 }
        };
        const preset = presets[type];
        if (!preset) return;

        document.getElementById('target-calorie').value = preset.calorie;
        document.getElementById('target-protein').value = preset.protein;
        document.getElementById('target-carbs').value = preset.carbs;
        document.getElementById('target-fat').value = preset.fat;
    },

    openFoodModal(mealType) {
        this.currentMealType = mealType;
        this.selectedFood = null;
        const labels = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack: '加餐' };
        document.getElementById('food-modal-title').textContent = '添加' + labels[mealType];

        document.getElementById('food-search').value = '';
        document.querySelectorAll('.food-tab').forEach((t, i) => t.classList.toggle('active', i === 0));
        document.querySelectorAll('.food-tab-content').forEach((c, i) => c.classList.toggle('active', i === 0));
        document.querySelectorAll('.food-cat-tab').forEach((t, i) => t.classList.toggle('active', i === 0));
        this.foodCategoryFilter = 'all';

        document.getElementById('custom-food-name').value = '';
        document.getElementById('custom-food-grams').value = '100';
        document.getElementById('custom-food-calorie').value = '';
        document.getElementById('custom-food-protein').value = '';
        document.getElementById('custom-food-carbs').value = '';
        document.getElementById('custom-food-fat').value = '';

        document.getElementById('food-amount-section').style.display = 'none';
        document.getElementById('food-amount').value = '100';

        this.renderFoodList();
        document.getElementById('food-modal').classList.add('show');
    },

    closeFoodModal() {
        document.getElementById('food-modal').classList.remove('show');
    },

    renderFoodList(searchTerm = '') {
        const list = document.getElementById('food-list');
        let foods = this.foodLibrary;

        if (this.foodCategoryFilter !== 'all') {
            foods = foods.filter(f => f.cat === this.foodCategoryFilter);
        }
        if (searchTerm) {
            foods = foods.filter(f => f.name.includes(searchTerm));
        }

        if (foods.length === 0) {
            list.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-lighter)">没有找到，试试自定义添加</div>';
            return;
        }

        list.innerHTML = foods.map((f, i) => `
            <div class="food-card" data-idx="${i}" onclick="App.selectFood(${i})">
                <div class="food-card-info">
                    <div class="food-card-name">${f.name}</div>
                    <div class="food-card-nutri">蛋白${f.protein}g · 碳水${f.carbs}g · 脂肪${f.fat}g</div>
                </div>
                <div class="food-card-cal">${f.calorie}kcal/${f.unit}g</div>
            </div>
        `).join('');
    },

    selectFood(idx) {
        let foods = this.foodLibrary;
        if (this.foodCategoryFilter !== 'all') {
            foods = foods.filter(f => f.cat === this.foodCategoryFilter);
        }
        this.selectedFood = foods[idx];

        document.querySelectorAll('.food-card').forEach(c => c.classList.remove('selected'));
        document.querySelector(`.food-card[data-idx="${idx}"]`).classList.add('selected');

        document.getElementById('food-amount-section').style.display = 'block';
        document.getElementById('food-amount').value = this.selectedFood.unit;
        this.updateFoodPreview();
    },

    updateFoodPreview() {
        if (!this.selectedFood) return;
        const amount = parseInt(document.getElementById('food-amount').value) || 0;
        const ratio = amount / this.selectedFood.unit;
        const cal = Math.round(this.selectedFood.calorie * ratio);
        const protein = Math.round(this.selectedFood.protein * ratio * 10) / 10;
        const carbs = Math.round(this.selectedFood.carbs * ratio * 10) / 10;
        const fat = Math.round(this.selectedFood.fat * ratio * 10) / 10;

        document.getElementById('food-preview').innerHTML = `
            <div class="food-preview-row"><span class="label">${this.selectedFood.name} ${amount}g</span><span class="value">${cal} kcal</span></div>
            <div class="food-preview-row"><span class="label">蛋白质</span><span class="value">${protein}g</span></div>
            <div class="food-preview-row"><span class="label">碳水</span><span class="value">${carbs}g</span></div>
            <div class="food-preview-row"><span class="label">脂肪</span><span class="value">${fat}g</span></div>
        `;
    },

    confirmAddFood() {
        const activeTab = document.querySelector('.food-tab.active').dataset.tab;
        let food, amount;

        if (activeTab === 'library') {
            if (!this.selectedFood) {
                alert('请先选择一个食物');
                return;
            }
            food = { ...this.selectedFood };
            amount = parseInt(document.getElementById('food-amount').value) || food.unit;
        } else {
            const name = document.getElementById('custom-food-name').value.trim();
            const grams = parseInt(document.getElementById('custom-food-grams').value) || 100;
            const calorie = parseInt(document.getElementById('custom-food-calorie').value) || 0;
            const protein = parseFloat(document.getElementById('custom-food-protein').value) || 0;
            const carbs = parseFloat(document.getElementById('custom-food-carbs').value) || 0;
            const fat = parseFloat(document.getElementById('custom-food-fat').value) || 0;

            if (!name) {
                alert('请输入食物名称');
                return;
            }
            food = { name, cat: 'other', unit: grams, calorie, protein, carbs, fat };
            amount = grams;
        }

        const dayMeals = this.getDayMeals();
        dayMeals[this.currentMealType].push({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            food,
            amount,
            eaten: false
        });

        this.saveMeals();
        this.closeFoodModal();
        this.renderMealPage();
    },

    renderShoppingList() {
        const container = document.getElementById('shopping-list');
        const today = new Date();
        const weekEnd = new Date();
        weekEnd.setDate(weekEnd.getDate() + 7);

        const foodMap = {};
        Object.keys(this.meals).forEach(dateStr => {
            const date = new Date(dateStr);
            if (date < today || date > weekEnd) return;

            const dayMeals = this.meals[dateStr];
            ['breakfast', 'lunch', 'dinner', 'snack'].forEach(type => {
                (dayMeals[type] || []).forEach(item => {
                    if (!foodMap[item.food.name]) {
                        foodMap[item.food.name] = 0;
                    }
                    foodMap[item.food.name] += item.amount;
                });
            });
        });

        const items = Object.entries(foodMap);
        if (items.length === 0) {
            container.innerHTML = '<div class="shopping-empty">规划好食谱后会自动生成买菜清单</div>';
            return;
        }

        container.innerHTML = items.map(([name, amount]) => {
            const checked = this.shoppingList[name];
            return `
                <div class="shopping-item ${checked ? 'checked' : ''}" onclick="App.toggleShopping('${name}')">
                    <div class="shopping-check ${checked ? 'checked' : ''}"></div>
                    <span class="shopping-name">${name}</span>
                    <span class="shopping-amount">${amount}g</span>
                </div>
            `;
        }).join('');
    },

    toggleShopping(name) {
        if (this.shoppingList[name]) {
            delete this.shoppingList[name];
        } else {
            this.shoppingList[name] = true;
        }
        this.saveShoppingList();
        this.renderShoppingList();
    },

    buildMealAIPrompt() {
        return `你是一个专业的营养师和美食博主。请根据用户的需求，生成一周（7天）的食谱计划。

【重要】输出格式：每行一道菜的一个食材，格式为：第N天,餐次,菜名,食材名称,重量(克),热量(kcal),蛋白质(g),碳水(g),脂肪(g)

餐次只能是以下4个之一：早餐,午餐,晚餐,加餐

同一道菜有多个食材的话，每个食材一行，菜名相同。

示例：
第1天,早餐,燕麦牛奶,燕麦片,50,184,7.5,30.5,3.5
第1天,早餐,燕麦牛奶,牛奶,250,163,8.5,12.5,9
第1天,早餐,水煮鸡蛋,鸡蛋,50,78,6.3,0.6,5.3
第1天,午餐,鸡胸肉西兰花饭,米饭,150,195,4.1,42.3,0.5
第1天,午餐,鸡胸肉西兰花饭,鸡胸肉,120,160,37.2,0,1.4
第1天,午餐,鸡胸肉西兰花饭,西兰花,100,36,4.1,4.3,0.6
第1天,午餐,鸡胸肉西兰花饭,食用油,10,90,0,0,10
第1天,晚餐,番茄鸡蛋面,面条(煮),200,220,7,44,1.2
第1天,晚餐,番茄鸡蛋面,鸡蛋,50,78,6.3,0.6,5.3
第1天,晚餐,番茄鸡蛋面,番茄,100,18,0.9,4,0.2
第1天,加餐,香蕉,香蕉,100,93,1.4,22.2,0.2
第2天,早餐,全麦三明治,全麦面包,80,198,7.2,36.8,2.7
...

食谱规则：
1. 每餐有1-3道菜，每道菜包含2-5种食材
2. 菜名要好听、有食欲（比如：香煎鸡胸肉、蒜蓉西兰花、番茄鸡蛋汤等）
3. 食材必须是具体的、容易买到的食材名称（不能是菜名）
4. 不要输出markdown代码块
5. 每行格式严格为：第N天,餐次,菜名,食材名称,重量,热量,蛋白质,碳水,脂肪
6. 每天必须有早餐、午餐、晚餐，加餐可选
7. 营养数据尽量准确（每100g的营养数据 * 重量/100）
8. 每天总热量控制在2000-2500大卡左右
9. 一周尽量不重样，多样化搭配
10. 食用油、盐、酱油等调料也要算进去（食用油每天10-20g）

========== 第二部分：一周采购清单 ==========
用 "---采购清单---" 分隔。
格式：食材名称,总重量(克),备注

示例：
鸡胸肉,840,每天120g
鸡蛋,350,每天1个
西兰花,700,每天100g
番茄,700,每天100g
米饭,1050,每天150g
...

采购清单规则：
1. 把一周所有食材汇总，相同食材重量相加
2. 只需要输出食材名称和总重量，不需要营养数据
3. 重量可以适当取整，方便购买

完整输出示例结构：
第1天,早餐,燕麦牛奶,燕麦片,50,184,7.5,30.5,3.5
第1天,早餐,燕麦牛奶,牛奶,250,163,8.5,12.5,9
...
第7天,加餐,香蕉,香蕉,100,93,1.4,22.2,0.2
---采购清单---
鸡胸肉,800g
鸡蛋,7个
西兰花,700g
...

请根据以下需求生成一周的食谱：`;
    },

    openMealAIModal() {
        document.getElementById('meal-ai-prompt-text').textContent = this.buildMealAIPrompt();
        document.getElementById('meal-ai-result-input').value = '';
        document.getElementById('meal-ai-preview-section').style.display = 'none';
        document.getElementById('meal-ai-confirm-btn').disabled = true;
        this.mealAIParsedDays = [];

        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];
        document.getElementById('meal-ai-start-date').value = dateStr;

        document.getElementById('meal-ai-modal').classList.add('show');
    },

    closeMealAIModal() {
        document.getElementById('meal-ai-modal').classList.remove('show');
    },

    copyMealAIPrompt() {
        const prompt = this.buildMealAIPrompt();
        const textArea = document.createElement('textarea');
        textArea.value = prompt;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            const btn = document.getElementById('meal-ai-copy-btn');
            const originalText = btn.textContent;
            btn.textContent = '✅ 已复制！去发给AI吧';
            btn.style.background = 'var(--success)';
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '';
            }, 2000);
        } catch (e) {
            alert('复制失败，请手动长按选中提示词复制');
        }
        document.body.removeChild(textArea);
    },

    parseMealAIResult() {
        const text = document.getElementById('meal-ai-result-input').value.trim();
        if (!text) {
            alert('请先粘贴AI生成的食谱');
            return;
        }

        const mealTypeMap = {
            '早餐': 'breakfast',
            '午餐': 'lunch',
            '晚餐': 'dinner',
            '加餐': 'snack'
        };

        const days = {};
        const lines = text.split('\n');

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();
            if (!line) continue;
            if (line.startsWith('```')) continue;

            if (line.includes('采购清单')) {
                break;
            }

            const parts = line.split(/[,，]/).map(p => p.trim());
            if (parts.length < 5) continue;

            const dayMatch = parts[0].match(/第(\d+)天/);
            if (!dayMatch) continue;

            const dayNum = parseInt(dayMatch[1]);
            const mealTypeName = parts[1];
            let dishName, foodName, amount, calorie, protein, carbs, fat;

            if (parts.length >= 9) {
                dishName = parts[2];
                foodName = parts[3];
                amount = parseInt(parts[4]) || 100;
                calorie = parseFloat(parts[5]) || 0;
                protein = parseFloat(parts[6]) || 0;
                carbs = parseFloat(parts[7]) || 0;
                fat = parseFloat(parts[8]) || 0;
            } else {
                dishName = null;
                foodName = parts[2];
                amount = parseInt(parts[3]) || 100;
                calorie = parseFloat(parts[4]) || 0;
                protein = parseFloat(parts[5]) || 0;
                carbs = parseFloat(parts[6]) || 0;
                fat = parseFloat(parts[7]) || 0;
            }

            const mealType = mealTypeMap[mealTypeName];
            if (!mealType) continue;

            if (!days[dayNum]) {
                days[dayNum] = { breakfast: [], lunch: [], dinner: [], snack: [] };
            }

            const matchedFood = this.foodLibrary.find(f => f.name === foodName);
            let food;
            if (matchedFood) {
                food = { ...matchedFood };
            } else {
                food = {
                    name: foodName,
                    cat: 'other',
                    unit: amount,
                    calorie: calorie,
                    protein: protein,
                    carbs: carbs,
                    fat: fat
                };
            }

            days[dayNum][mealType].push({
                food: food,
                amount: amount,
                dishName: dishName
            });
        }

        const dayKeys = Object.keys(days).map(Number).sort((a, b) => a - b);
        if (dayKeys.length === 0) {
            alert('没有解析到有效食谱，请检查格式：每行一个，格式为 第N天,餐次,菜名,食材名称,重量,热量,蛋白质,碳水,脂肪');
            return;
        }

        this.mealAIParsedDays = days;
        this.mealAIDayKeys = dayKeys;

        this.renderMealAIPreview();
        document.getElementById('meal-ai-preview-section').style.display = 'block';
        document.getElementById('meal-ai-confirm-btn').disabled = false;
    },

    renderMealAIPreview() {
        const container = document.getElementById('meal-ai-preview-list');
        const mealLabels = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack: '加餐' };
        const startDate = new Date(document.getElementById('meal-ai-start-date').value || new Date());

        const html = this.mealAIDayKeys.map(dayNum => {
            const dayMeals = this.mealAIParsedDays[dayNum];
            const date = new Date(startDate);
            date.setDate(date.getDate() + dayNum - 1);
            const dateStr = `${date.getMonth() + 1}月${date.getDate()}日`;

            let totalCal = 0;
            ['breakfast', 'lunch', 'dinner', 'snack'].forEach(type => {
                (dayMeals[type] || []).forEach(item => {
                    const ratio = item.amount / item.food.unit;
                    totalCal += Math.round(item.food.calorie * ratio);
                });
            });

            const mealsHtml = ['breakfast', 'lunch', 'dinner', 'snack'].map(type => {
                const items = dayMeals[type] || [];
                if (items.length === 0) return '';

                const dishGroups = {};
                items.forEach(item => {
                    const key = item.dishName || '__no_dish__';
                    if (!dishGroups[key]) dishGroups[key] = [];
                    dishGroups[key].push(item);
                });

                const dishesHtml = Object.entries(dishGroups).map(([dishName, dishItems]) => {
                    const dishCal = dishItems.reduce((sum, item) => {
                        const ratio = item.amount / item.food.unit;
                        return sum + Math.round(item.food.calorie * ratio);
                    }, 0);

                    const itemsHtml = dishItems.map(item => {
                        const ratio = item.amount / item.food.unit;
                        const cal = Math.round(item.food.calorie * ratio);
                        return `
                            <div class="meal-ai-food-item">
                                <span class="meal-ai-food-name">${this.escapeHtml(item.food.name)} · ${item.amount}g</span>
                                <span class="meal-ai-food-detail">${cal} kcal</span>
                            </div>
                        `;
                    }).join('');

                    if (dishName && dishName !== '__no_dish__') {
                        return `
                            <div class="meal-ai-dish">
                                <div class="meal-ai-dish-header">
                                    <span class="meal-ai-dish-name">🍽 ${this.escapeHtml(dishName)}</span>
                                    <span class="meal-ai-dish-cal">${dishCal} kcal</span>
                                </div>
                                <div class="meal-ai-dish-items">${itemsHtml}</div>
                            </div>
                        `;
                    } else {
                        return itemsHtml;
                    }
                }).join('');

                return `
                    <div class="meal-ai-meal-type">${mealLabels[type]}</div>
                    ${dishesHtml}
                `;
            }).join('');

            return `
                <div class="meal-ai-day">
                    <div class="meal-ai-day-header">
                        <span>第${dayNum}天 · ${dateStr}</span>
                        <span class="meal-ai-day-cal">${totalCal} kcal</span>
                    </div>
                    ${mealsHtml}
                </div>
            `;
        }).join('');

        container.innerHTML = html;
        document.getElementById('meal-ai-preview-count').textContent = this.mealAIDayKeys.length;
    },

    confirmMealAIImport() {
        if (this.mealAIDayKeys.length === 0) return;

        const startDateStr = document.getElementById('meal-ai-start-date').value;
        const startDate = new Date(startDateStr);

        let importedDays = 0;
        this.mealAIDayKeys.forEach(dayNum => {
            const date = new Date(startDate);
            date.setDate(date.getDate() + dayNum - 1);
            const key = this.formatDate(date);

            if (!this.meals[key]) {
                this.meals[key] = { breakfast: [], lunch: [], dinner: [], snack: [] };
            }

            const dayMeals = this.mealAIParsedDays[dayNum];
            ['breakfast', 'lunch', 'dinner', 'snack'].forEach(type => {
                (dayMeals[type] || []).forEach(item => {
                    this.meals[key][type].push({
                        id: Date.now() + Math.random(),
                        food: { ...item.food },
                        amount: item.amount,
                        eaten: false,
                        dishName: item.dishName || null
                    });
                });
            });

            importedDays++;
        });

        this.saveMeals();
        this.closeMealAIModal();

        const startDate2 = new Date(startDateStr);
        this.mealDate = new Date(startDate2);
        this.renderMealPage();

        alert(`成功导入 ${importedDays} 天的食谱！`);
    },

    exportData() {
        const data = {
            schedules: this.schedules,
            goals: this.goals,
            meals: this.meals,
            nutritionTargets: this.nutritionTargets,
            shoppingList: this.shoppingList,
            exportTime: new Date().toISOString(),
            version: '1.0'
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const dateStr = new Date().toLocaleDateString('zh-CN').replace(/\//g, '-');
        a.href = url;
        a.download = `single-backup-${dateStr}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    importData(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (!data || typeof data !== 'object') {
                    throw new Error('文件格式不正确');
                }
                if (confirm('导入数据将覆盖当前所有数据，确定继续吗？')) {
                    if (data.schedules) {
                        this.schedules = data.schedules;
                        this.saveSchedules();
                    }
                    if (data.goals) {
                        this.goals = data.goals;
                        this.saveGoals();
                    }
                    if (data.meals) {
                        this.meals = data.meals;
                        this.saveMeals();
                    }
                    if (data.nutritionTargets) {
                        this.nutritionTargets = data.nutritionTargets;
                        this.saveNutritionTargets();
                    }
                    if (data.shoppingList) {
                        this.shoppingList = data.shoppingList;
                        this.saveShoppingList();
                    }
                    this.renderToday();
                    this.renderCalendar();
                    this.renderGoals();
                    this.renderStats();
                    this.renderMealPage();
                    alert('数据导入成功！');
                }
            } catch (err) {
                alert('导入失败：' + err.message);
            }
            event.target.value = '';
        };
        reader.readAsText(file);
    },

    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js').catch(err => {
                console.log('Service Worker 注册失败:', err);
            });
        }
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());
