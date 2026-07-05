const EventsModule = {
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth(),

    render() {
        const container = document.getElementById('page-events');
        const events = Storage.getEvents();
        const members = Storage.getMembers();
        const upcoming = Lunar.getUpcomingEventsThisYear(events);

        container.innerHTML = `
            <div class="back-btn" onclick="App.navigate('home')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
                返回首页
            </div>

            <div class="card">
                <div class="card-title">
                    <span>📅 ${this.currentYear}年${this.currentMonth + 1}月</span>
                    <div>
                        <span class="more" onclick="EventsModule.prevMonth()" style="margin-right:var(--spacing-md);font-size:var(--font-xl)">‹</span>
                        <span class="more" onclick="EventsModule.nextMonth()" style="font-size:var(--font-xl)">›</span>
                    </div>
                </div>
                ${this.renderCalendar()}
            </div>

            <div class="card">
                <div class="card-title">
                    近期提醒
                    <span class="more" onclick="EventsModule.openAddModal()">+ 添加</span>
                </div>
                ${upcoming.length === 0 ? `
                    <div class="empty-state" style="padding:var(--spacing-lg) 0">
                        <div class="empty-text">还没有添加大事件</div>
                        <button class="btn btn-primary" onclick="EventsModule.openAddModal()">添加大事件</button>
                    </div>
                ` : upcoming.slice(0, 6).map(event => {
                    const relatedMember = event.relatedMember ? members.find(m => m.id === event.relatedMember) : null;
                    let daysText;
                    if (event.diffDays === 0) daysText = '🎉 今天';
                    else if (event.diffDays === 1) daysText = '明天';
                    else if (event.diffDays < 7) daysText = `还有${event.diffDays}天`;
                    else if (event.diffDays < 30) daysText = `${Math.ceil(event.diffDays/7)}周后`;
                    else daysText = `${event.diffDays}天后`;

                    let tagClass = event.diffDays === 0 ? 'tag-danger' : event.diffDays <= 7 ? 'tag-warning' : 'tag-primary';
                    let icon = event.type === 'birthday' ? '🎂' : event.type === 'festival' ? '🎊' : event.type === 'anniversary' ? '💑' : '📌';

                    return `
                        <div class="list-item">
                            <div style="font-size:var(--font-xl);width:40px;text-align:center">${icon}</div>
                            <div class="list-item-content">
                                <div class="list-item-title">${App.escapeHtml(event.title)}</div>
                                <div class="list-item-desc">
                                    ${event.solarDate.getFullYear()}年${event.solarDate.getMonth()+1}月${event.solarDate.getDate()}日
                                    · ${event.isLunar ? '阴历' : '阳历'}
                                    ${event.repeatYearly ? ' · 每年' : ''}
                                    ${relatedMember ? ' · ' + App.escapeHtml(relatedMember.name) : ''}
                                </div>
                            </div>
                            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:var(--spacing-xs)">
                                <span class="tag ${tagClass}">${daysText}</span>
                                <button class="btn btn-sm btn-outline" onclick="EventsModule.deleteEvent('${event.id}')" style="color:var(--danger-color);border-color:var(--danger-color);font-size:var(--font-xs);padding:2px 8px;height:auto">删除</button>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>

            <button class="fab" onclick="EventsModule.openAddModal()">+</button>
        `;

        App.updateHeader('大事件');
    },

    renderCalendar() {
        const events = Storage.getEvents();
        const today = new Date();
        const firstDay = new Date(this.currentYear, this.currentMonth, 1);
        const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
        const startWeekDay = firstDay.getDay();
        const daysInMonth = lastDay.getDate();

        const eventDates = new Set();
        events.forEach(event => {
            for (let d = 1; d <= daysInMonth; d++) {
                const date = new Date(this.currentYear, this.currentMonth, d);
                const lunar = Lunar.toLunar(date);
                if (event.isLunar) {
                    if (lunar.month === event.month && lunar.day === event.day) {
                        eventDates.add(d);
                    }
                } else {
                    if (event.month === this.currentMonth + 1 && event.day === d) {
                        if (event.repeatYearly || date.getFullYear() === (event.year || this.currentYear)) {
                            eventDates.add(d);
                        }
                    }
                }
            }
        });

        const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
        let html = '<div class="calendar-grid">';
        weekdays.forEach(w => {
            html += `<div class="calendar-weekday">${w}</div>`;
        });

        const prevMonth = new Date(this.currentYear, this.currentMonth, 0);
        for (let i = 0; i < startWeekDay; i++) {
            html += `<div class="calendar-day other-month">${prevMonth.getDate() - startWeekDay + i + 1}</div>`;
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const isToday = today.getFullYear() === this.currentYear && today.getMonth() === this.currentMonth && today.getDate() === d;
            const hasEvent = eventDates.has(d);
            html += `<div class="calendar-day ${isToday ? 'today' : ''} ${hasEvent ? 'has-event' : ''}">${d}</div>`;
        }

        const remaining = 42 - (startWeekDay + daysInMonth);
        for (let i = 1; i <= remaining; i++) {
            html += `<div class="calendar-day other-month">${i}</div>`;
        }

        html += '</div>';
        return html;
    },

    prevMonth() {
        this.currentMonth--;
        if (this.currentMonth < 0) {
            this.currentMonth = 11;
            this.currentYear--;
        }
        this.render();
    },

    nextMonth() {
        this.currentMonth++;
        if (this.currentMonth > 11) {
            this.currentMonth = 0;
            this.currentYear++;
        }
        this.render();
    },

    openAddModal() {
        const members = Storage.getMembers();
        const eventTypes = [
            { value: 'birthday', label: '🎂 生日' },
            { value: 'festival', label: '🎊 节日' },
            { value: 'anniversary', label: '💑 纪念日' },
            { value: 'custom', label: '📌 其他' }
        ];

        const html = `
            <div class="modal-header">
                <div class="modal-title">添加大事件</div>
                <div class="modal-close" onclick="App.closeModal()">×</div>
            </div>
            <div class="modal-body">
                <div class="input-group">
                    <label class="input-label">事件名称</label>
                    <input class="input" id="eventTitle" placeholder="例如：妈妈生日" autofocus>
                </div>
                <div class="input-group">
                    <label class="input-label">类型</label>
                    <select class="select" id="eventType">
                        ${eventTypes.map(t => `<option value="${t.value}">${t.label}</option>`).join('')}
                    </select>
                </div>
                <div class="input-group" id="memberSelectGroup">
                    <label class="input-label">关联成员（生日时选择）</label>
                    <select class="select" id="eventMember">
                        <option value="">不关联</option>
                        ${members.map(m => `<option value="${m.id}">${App.escapeHtml(m.name)}（${App.escapeHtml(m.role)}）</option>`).join('')}
                    </select>
                </div>
                <div class="input-group">
                    <label class="input-label">日期类型</label>
                    <div style="display:flex;gap:var(--spacing-sm)">
                        <button class="btn btn-primary" style="flex:1" id="solarBtn" onclick="EventsModule.selectCalType('solar')">阳历</button>
                        <button class="btn btn-outline" style="flex:1" id="lunarBtn" onclick="EventsModule.selectCalType('lunar')">阴历</button>
                    </div>
                    <input type="hidden" id="eventIsLunar" value="false">
                </div>
                <div style="display:flex;gap:var(--spacing-md)">
                    <div class="input-group" style="flex:1">
                        <label class="input-label">月</label>
                        <input class="input" id="eventMonth" type="number" min="1" max="12" value="${new Date().getMonth() + 1}">
                    </div>
                    <div class="input-group" style="flex:1">
                        <label class="input-label">日</label>
                        <input class="input" id="eventDay" type="number" min="1" max="31" value="${new Date().getDate()}">
                    </div>
                </div>
                <div class="input-group">
                    <label class="input-label">
                        <input type="checkbox" id="eventRepeat" checked>
                        每年重复
                    </label>
                </div>
                <div class="input-group">
                    <label class="input-label">提前几天提醒</label>
                    <select class="select" id="eventRemind">
                        <option value="0">当天提醒</option>
                        <option value="1">提前1天</option>
                        <option value="3" selected>提前3天</option>
                        <option value="7">提前7天</option>
                        <option value="14">提前14天</option>
                    </select>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary btn-block" onclick="EventsModule.saveEvent()">保存</button>
            </div>
        `;

        App.showModal(html);

        setTimeout(() => {
            document.getElementById('eventTitle').focus();
        }, 100);
    },

    selectCalType(type) {
        document.getElementById('eventIsLunar').value = type === 'lunar' ? 'true' : 'false';
        const solarBtn = document.getElementById('solarBtn');
        const lunarBtn = document.getElementById('lunarBtn');
        if (type === 'lunar') {
            solarBtn.classList.remove('btn-primary');
            solarBtn.classList.add('btn-outline');
            lunarBtn.classList.remove('btn-outline');
            lunarBtn.classList.add('btn-primary');
        } else {
            lunarBtn.classList.remove('btn-primary');
            lunarBtn.classList.add('btn-outline');
            solarBtn.classList.remove('btn-outline');
            solarBtn.classList.add('btn-primary');
        }
    },

    saveEvent() {
        const title = document.getElementById('eventTitle').value.trim();
        const type = document.getElementById('eventType').value;
        const relatedMember = document.getElementById('eventMember').value;
        const isLunar = document.getElementById('eventIsLunar').value === 'true';
        const month = parseInt(document.getElementById('eventMonth').value);
        const day = parseInt(document.getElementById('eventDay').value);
        const repeatYearly = document.getElementById('eventRepeat').checked;
        const remindDaysBefore = parseInt(document.getElementById('eventRemind').value);

        if (!title) {
            App.showToast('请输入事件名称');
            return;
        }
        if (!month || !day || month < 1 || month > 12 || day < 1 || day > 31) {
            App.showToast('请输入正确的日期');
            return;
        }

        Storage.addEvent({
            title,
            type,
            isLunar,
            month,
            day,
            year: repeatYearly ? null : new Date().getFullYear(),
            repeatYearly,
            remindDaysBefore,
            relatedMember: relatedMember || null
        });

        App.closeModal();
        App.showToast('添加成功');
        this.render();
    },

    deleteEvent(id) {
        if (confirm('确定删除这个事件吗？')) {
            Storage.deleteEvent(id);
            this.render();
            App.showToast('已删除');
        }
    }
};

App.registerModule('events', EventsModule);