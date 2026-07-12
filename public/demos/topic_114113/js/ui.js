var UI = {
    currentDate: new Date(),
    jishiExpanded: true,
    currentGiriType: null,
    
    init: function() {
        this.bindEvents();
        this.renderGiriSelector();
        this.updateDisplay();
    },
    
    showToast: function(message, type) {
        var toast = document.createElement('div');
        toast.className = 'toast toast-' + (type || 'info');
        toast.textContent = message;
        toast.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);' +
            'padding:12px 24px;border-radius:8px;color:#fff;font-size:14px;z-index:10000;' +
            'opacity:0;transition:opacity 0.3s;max-width:80%;text-align:center;' +
            'background:' + (type === 'error' ? '#e74c3c' : type === 'success' ? '#2ecc71' : '#3498db');
        document.body.appendChild(toast);
        setTimeout(function() { toast.style.opacity = '1'; }, 10);
        setTimeout(function() {
            toast.style.opacity = '0';
            setTimeout(function() { document.body.removeChild(toast); }, 300);
        }, 3000);
    },
    
    bindEvents: function() {
        var prevDayBtn = document.getElementById('prevDayBtn');
        if (prevDayBtn) prevDayBtn.addEventListener('click', function() { UI.changeDate(-1); });
        
        var nextDayBtn = document.getElementById('nextDayBtn');
        if (nextDayBtn) nextDayBtn.addEventListener('click', function() { UI.changeDate(1); });
        
        var todayBtn = document.getElementById('todayBtn');
        if (todayBtn) todayBtn.addEventListener('click', function() { UI.goToday(); });
        
        var jishiToggle = document.getElementById('jishiToggle');
        if (jishiToggle) jishiToggle.addEventListener('click', function() { UI.toggleJishi(); });
        
        var speakBtn = document.getElementById('speakBtn');
        if (speakBtn) speakBtn.addEventListener('click', function() { Voice.speakToday(); });
        
        var testSpeakBtn = document.getElementById('testSpeakBtn');
        if (testSpeakBtn) testSpeakBtn.addEventListener('click', function() { Voice.testSpeak(); });
        
        var settingsBtn = document.getElementById('settingsBtn');
        if (settingsBtn) settingsBtn.addEventListener('click', function() {
            var settingsOverlay = document.getElementById('settingsOverlay');
            if (settingsOverlay) settingsOverlay.style.display = 'flex';
        });
        
        var closeSettingsBtn = document.getElementById('closeSettingsBtn');
        if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', function() {
            var settingsOverlay = document.getElementById('settingsOverlay');
            if (settingsOverlay) settingsOverlay.style.display = 'none';
        });
        
        var settingsOverlay = document.getElementById('settingsOverlay');
        if (settingsOverlay) settingsOverlay.addEventListener('click', function(e) {
            if (e.target === this) this.style.display = 'none';
        });
        
        var calendarBtn = document.getElementById('calendarBtn');
        if (calendarBtn) calendarBtn.addEventListener('click', function() { UI.openCalendar(); });
        
        var calendarClose = document.getElementById('calendarClose');
        if (calendarClose) calendarClose.addEventListener('click', function() { UI.closeCalendar(); });
        
        var calendarPrevMonth = document.getElementById('calendarPrevMonth');
        if (calendarPrevMonth) calendarPrevMonth.addEventListener('click', function() { UI.changeCalendarMonth(-1); });
        
        var calendarNextMonth = document.getElementById('calendarNextMonth');
        if (calendarNextMonth) calendarNextMonth.addEventListener('click', function() { UI.changeCalendarMonth(1); });
        
        var calendarOverlay = document.getElementById('calendarOverlay');
        if (calendarOverlay) calendarOverlay.addEventListener('click', function(e) {
            if (e.target === this) UI.closeCalendar();
        });
        
        this.bindFontToggle();
        this.bindSettings();
        this.bindSwipe();
    },
    
    bindFontToggle: function() {
        var btns = document.querySelectorAll('.font-toggle-btn');
        btns.forEach(function(btn) {
            btn.addEventListener('click', function() {
                btns.forEach(function(b) { b.classList.remove('active'); });
                this.classList.add('active');
                var font = this.getAttribute('data-font');
                App.setFontSize(font);
            });
        });
    },
    
    bindSettings: function() {
        var rateBtns = document.querySelectorAll('[data-rate]');
        rateBtns.forEach(function(btn) {
            btn.addEventListener('click', function() {
                rateBtns.forEach(function(b) { b.classList.remove('active'); });
                this.classList.add('active');
                var rate = parseFloat(this.getAttribute('data-rate'));
                Voice.setRate(rate);
            });
        });
        
        var genderBtns = document.querySelectorAll('[data-gender]');
        genderBtns.forEach(function(btn) {
            btn.addEventListener('click', function() {
                genderBtns.forEach(function(b) { b.classList.remove('active'); });
                this.classList.add('active');
                var gender = this.getAttribute('data-gender');
                Voice.setGender(gender);
            });
        });
        
        var themeBtns = document.querySelectorAll('[data-theme]');
        themeBtns.forEach(function(btn) {
            btn.addEventListener('click', function() {
                themeBtns.forEach(function(b) { b.classList.remove('active'); });
                this.classList.add('active');
                var theme = this.getAttribute('data-theme');
                App.setTheme(theme);
            });
        });
        
        var reminderBtns = document.querySelectorAll('[data-reminder]');
        reminderBtns.forEach(function(btn) {
            btn.addEventListener('click', function() {
                reminderBtns.forEach(function(b) { b.classList.remove('active'); });
                this.classList.add('active');
                var reminder = this.getAttribute('data-reminder');
                App.setReminder(reminder === 'on');
            });
        });
    },
    
    bindSwipe: function() {
        var startX = 0;
        var startY = 0;
        var threshold = 50;
        
        document.addEventListener('touchstart', function(e) {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        });
        
        document.addEventListener('touchend', function(e) {
            var endX = e.changedTouches[0].clientX;
            var endY = e.changedTouches[0].clientY;
            var diffX = endX - startX;
            var diffY = endY - startY;
            
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > threshold) {
                if (diffX > 0) {
                    UI.changeDate(-1);
                } else {
                    UI.changeDate(1);
                }
            }
        });
    },
    
    changeDate: function(days) {
        var newDate = new Date(this.currentDate.getTime());
        newDate.setDate(newDate.getDate() + days);
        this.currentDate = newDate;
        this.updateDisplay();
    },
    
    goToday: function() {
        this.currentDate = new Date();
        this.updateDisplay();
    },
    
    updateDisplay: function() {
        var almanac = Calendar.getAlmanac(this.currentDate);
        
        this.renderDate(almanac);
        this.renderYiji(almanac);
        this.renderJishi(almanac);
        this.renderCompass(almanac);
        this.renderDetail(almanac);
        this.renderShengxiao(almanac);
        
        App.saveLastDate();
    },
    
    renderDate: function(data) {
        document.getElementById('dateYear').textContent = data.year + '年';
        document.getElementById('dateMonthDay').textContent = 
            String(data.month).padStart(2, '0') + '月' + String(data.day).padStart(2, '0') + '日';
        document.getElementById('dateWeek').textContent = '星期' + data.week;
        document.getElementById('lunarMonthDay').textContent = data.lunarMonthDay;
        document.getElementById('lunarGanzhi').textContent = data.ganzhi;
        
        var jieqiBadge = document.getElementById('jieqiBadge');
        var jieqiTimeBadge = document.getElementById('jieqiTimeBadge');
        var festivalBadge = document.getElementById('festivalBadge');
        
        if (data.jieqi) {
            jieqiBadge.innerHTML = '<span class="jieqi-badge">' + data.jieqi + '</span>';
            this.renderJieqiTime(data);
        } else {
            jieqiBadge.innerHTML = '';
            jieqiTimeBadge.innerHTML = '';
        }
        
        if (data.festival) {
            festivalBadge.innerHTML = '<span class="festival-badge">' + data.festival + '</span>';
        } else {
            festivalBadge.innerHTML = '';
        }
    },
    
    renderJieqiTime: function(data) {
        var year = this.currentDate.getFullYear();
        var month = this.currentDate.getMonth() + 1;
        var day = this.currentDate.getDate();
        
        var jieqiTime = '';
        
        try {
            var solar = Solar.fromYmd(year, month, day);
            var lunar = solar.getLunar();
            var currentJieQi = lunar.getCurrentJieQi();
            
            if (currentJieQi) {
                var termSolar = currentJieQi.getSolar();
                var hour = termSolar.getHour().toString().padStart(2, '0');
                var minute = termSolar.getMinute().toString().padStart(2, '0');
                var second = termSolar.getSecond().toString().padStart(2, '0');
                
                var period = '凌晨';
                var h = parseInt(hour);
                if (h >= 5 && h < 8) period = '清晨';
                else if (h >= 8 && h < 12) period = '上午';
                else if (h >= 12 && h < 14) period = '中午';
                else if (h >= 14 && h < 18) period = '下午';
                else if (h >= 18 && h < 22) period = '晚上';
                else if (h >= 22 || h < 1) period = '深夜';
                else period = '凌晨';
                
                jieqiTime = '具体时辰：' + period + ' ' + hour + ':' + minute + ':' + second;
            }
        } catch(e) {
            console.log('Failed to get jieqi time:', e);
        }
        
        var jieqiTimeBadge = document.getElementById('jieqiTimeBadge');
        if (jieqiTime) {
            jieqiTimeBadge.innerHTML = '<span class="jieqi-time-badge">' + jieqiTime + '</span>';
        } else {
            jieqiTimeBadge.innerHTML = '';
        }
    },
    
    renderYiji: function(data) {
        var yiGrid = document.getElementById('yiGrid');
        var jiGrid = document.getElementById('jiGrid');
        
        yiGrid.innerHTML = this.renderYijiGrid(data.yi, 'yi');
        jiGrid.innerHTML = this.renderYijiGrid(data.ji, 'ji');
    },
    
    renderYijiGrid: function(items, type) {
        if (!items || items.length === 0) {
            return '<div class="yiji-empty">暂无</div>';
        }
        
        var html = '';
        items.forEach(function(item) {
            var info = Calendar.getYijiInfo(item);
            html += '<div class="yiji-card">' +
                '<div class="card-icon">' + info.icon + '</div>' +
                '<div class="card-text">' + item + '</div>' +
                '<div class="card-desc">' + info.desc + '</div>' +
                '</div>';
        });
        
        return html;
    },
    
    renderJishi: function(data) {
        var list = document.getElementById('jishiList');
        var toggle = document.getElementById('jishiToggle');
        
        var items = this.jishiExpanded ? data.shiChen : 
            data.shiChen.filter(function(s) { return s.isJi; });
        
        var html = '';
        items.forEach(function(item) {
            var cls = item.isJi ? 'ji-shi-shen' : 'ji-shi';
            html += '<div class="jishi-item ' + cls + '">' +
                '<div class="jishi-dot"></div>' +
                '<div>' +
                '<div class="jishi-name">' + item.name + '</div>' +
                '<div class="jishi-time">' + item.time + '</div>' +
                '</div>' +
                '<div class="jishi-yi">' + item.yi + '</div>' +
                '</div>';
        });
        
        list.innerHTML = html;
        
        toggle.textContent = this.jishiExpanded ? '收起时辰' : '展开全部时辰';
    },
    
    toggleJishi: function() {
        this.jishiExpanded = !this.jishiExpanded;
        this.updateDisplay();
    },
    
    renderCompass: function(data) {
        document.getElementById('caishenText').textContent = data.caishen;
        document.getElementById('xishenText').textContent = data.xishen;
        document.getElementById('fushenText').textContent = data.fushen;
        
        var caiPos = Calendar.getFangweiPosition(data.caishen);
        var xiPos = Calendar.getFangweiPosition(data.xishen);
        var fuPos = Calendar.getFangweiPosition(data.fushen);
        
        this.setCirclePosition('caishenPos', caiPos.x, caiPos.y);
        this.setCirclePosition('xishenPos', xiPos.x, xiPos.y);
        this.setCirclePosition('fushenPos', fuPos.x, fuPos.y);
    },
    
    setCirclePosition: function(id, x, y) {
        var circle = document.getElementById(id);
        if (circle) {
            circle.setAttribute('cx', x);
            circle.setAttribute('cy', y);
        }
    },
    
    renderDetail: function(data) {
        document.getElementById('chongshaText').textContent = data.chongsha;
        document.getElementById('taishenText').textContent = data.taishen;
        document.getElementById('wuxingText').textContent = data.wuxing;
        document.getElementById('nayinText').textContent = data.nayin;
        document.getElementById('pengzuText').textContent = data.pengzu || '彭祖百忌';
    },
    
    renderShengxiao: function(data) {
        var icons = {
            '鼠': '🐭', '牛': '🐂', '虎': '🐯', '兔': '🐰',
            '龙': '🐲', '蛇': '🐍', '马': '🐴', '羊': '🐑',
            '猴': '🐒', '鸡': '🐔', '狗': '🐕', '猪': '🐷'
        };
        document.getElementById('shengxiaoIcon').textContent = icons[data.shengxiao] || '🐯';
    },
    
    renderGiriSelector: function() {
        var selector = document.getElementById('giriSelector');
        var html = '';
        
        Calendar.GIRI_TYPES.forEach(function(type) {
            html += '<button class="giri-btn" data-type="' + type.key + '">' +
                type.icon + ' ' + type.name + '</button>';
        });
        
        selector.innerHTML = html;
        
        selector.querySelectorAll('.giri-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                selector.querySelectorAll('.giri-btn').forEach(function(b) {
                    b.classList.remove('active');
                });
                this.classList.add('active');
                
                var typeKey = this.getAttribute('data-type');
                UI.currentGiriType = typeKey;
                UI.searchGiri(typeKey);
            });
        });
    },
    
    searchGiri: function(typeKey) {
        var results = Calendar.searchGiri(typeKey, 3);
        var container = document.getElementById('giriResult');
        
        var html = '';
        results.forEach(function(item) {
            var cls = item.isGood ? 'good' : 'bad';
            var dateStr = item.solar;
            var lunarStr = item.lunar;
            var ganzhiStr = item.ganzhi.split('年')[1] || item.ganzhi;
            
            html += '<div class="giri-item ' + cls + '" onclick="UI.selectGiriDate(\'' + item.date.toISOString() + '\')">' +
                '<div class="giri-date">' + dateStr + '</div>' +
                '<div class="giri-lunar">' + lunarStr + ' · ' + ganzhiStr + '</div>' +
                '<div class="giri-info">' +
                '<span style="color:#006600">宜：' + item.yi + '</span> | ' +
                '<span style="color:#990000">忌：' + item.ji + '</span> | ' +
                '<span>' + item.chongsha + '</span>' +
                '</div>' +
                '</div>';
        });
        
        container.innerHTML = html;
    },
    
    selectGiriDate: function(dateStr) {
        var date = new Date(dateStr);
        this.currentDate = date;
        this.updateDisplay();
        
        document.getElementById('giriSelector').scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    
    showSpeakStatus: function(isSpeaking) {
        var btn = document.getElementById('speakBtn');
        if (isSpeaking) {
            btn.classList.add('speaking');
        } else {
            btn.classList.remove('speaking');
        }
    },
    
    updateFontSize: function(fontSize) {
        document.body.classList.remove('font-large', 'font-xlarge');
        if (fontSize === 'large') {
            document.body.classList.add('font-large');
        } else if (fontSize === 'xlarge') {
            document.body.classList.add('font-xlarge');
        }
    },
    
    updateTheme: function(theme) {
        document.body.classList.remove('theme-yellow', 'theme-white');
        document.body.classList.add('theme-' + theme);
    },
    
    calendarDate: null,
    
    openCalendar: function() {
        this.calendarDate = new Date(this.currentDate.getTime());
        this.renderCalendar();
        document.getElementById('calendarOverlay').style.display = 'flex';
    },
    
    closeCalendar: function() {
        document.getElementById('calendarOverlay').style.display = 'none';
    },
    
    changeCalendarMonth: function(months) {
        this.calendarDate.setMonth(this.calendarDate.getMonth() + months);
        this.renderCalendar();
    },
    
    renderCalendar: function() {
        var year = this.calendarDate.getFullYear();
        var month = this.calendarDate.getMonth();
        
        document.getElementById('calendarTitle').textContent = year + '年' + (month + 1) + '月';
        
        var firstDay = new Date(year, month, 1);
        var lastDay = new Date(year, month + 1, 0);
        var startDay = firstDay.getDay();
        
        var today = new Date();
        var selectedYear = this.currentDate.getFullYear();
        var selectedMonth = this.currentDate.getMonth();
        var selectedDay = this.currentDate.getDate();
        
        var html = '';
        
        for (var i = 0; i < startDay; i++) {
            html += '<div class="calendar-day other-month"></div>';
        }
        
        for (var d = 1; d <= lastDay.getDate(); d++) {
            var date = new Date(year, month, d);
            var isToday = date.getDate() === today.getDate() && 
                         date.getMonth() === today.getMonth() && 
                         date.getFullYear() === today.getFullYear();
            var isSelected = date.getDate() === selectedDay && 
                           date.getMonth() === selectedMonth && 
                           date.getFullYear() === selectedYear;
            
            var displayText = '';
            var isJieqi = false;
            var isHoliday = false;
            var isLegalHoliday = false;
            var holidayName = '';
            
            var holidayInfo = this.getHolidayInfo(year, month + 1, d);
            isLegalHoliday = holidayInfo.isLegalHoliday;
            isMakeupWork = holidayInfo.isMakeupWork;
            
            if (holidayInfo.name) {
                displayText = holidayInfo.name;
                isHoliday = true;
            } else {
                try {
                    var solar = Solar.fromYmd(year, month + 1, d);
                    var lunar = solar.getLunar();
                    
                    var lunarDay = lunar.getDay ? lunar.getDay() : 1;
                    var monthStr = lunar.getMonthInChinese ? lunar.getMonthInChinese() : (lunar.getMonth() + '月');
                    if (monthStr && !monthStr.includes('月')) {
                        monthStr += '月';
                    }
                    var dayStr = lunar.getDayInChinese ? lunar.getDayInChinese() : (lunar.getDay() + '日');
                    var lunarDate = lunarDay === 1 ? monthStr : dayStr;
                    
                    var currentJieQi = lunar.getCurrentJieQi();
                    if (currentJieQi) {
                        displayText = currentJieQi.getName();
                        isJieqi = true;
                    } else {
                        var festivals = lunar.getFestivals ? lunar.getFestivals() : [];
                        var jieQiFestivals = lunar.getJieQiFestivals ? lunar.getJieQiFestivals() : [];
                        var allFestivals = festivals.concat(jieQiFestivals);
                        
                        if (allFestivals.length > 0) {
                            displayText = allFestivals[0];
                            isHoliday = true;
                        } else {
                            displayText = lunarDate;
                        }
                    }
                } catch(e) {
                    displayText = '';
                }
            }
            
            var isSaturday = date.getDay() === 6;
            var isSunday = date.getDay() === 0;
            
            var classes = 'calendar-day';
            if (isToday) classes += ' today';
            if (isSelected) classes += ' selected';
            if (isJieqi) classes += ' jieqi';
            if (isHoliday) classes += ' holiday';
            if (isMakeupWork) classes += ' makeup-work';
            if (isSaturday) classes += ' weekend-saturday';
            if (isSunday) classes += ' weekend-sunday';
            
            var badgeHtml = '';
            if (isLegalHoliday) {
                badgeHtml = '<span class="holiday-badge">休</span>';
            } else if (isMakeupWork && (isSaturday || isSunday)) {
                badgeHtml = '<span class="work-badge">班</span>';
            }
            
            html += '<div class="' + classes + '" data-date="' + year + '-' + (month + 1) + '-' + d + '">' +
                '<span class="day-number">' + d + '</span>' +
                badgeHtml +
                '<span class="lunar-day">' + displayText + '</span>' +
                '</div>';
        }
        
        document.getElementById('calendarDays').innerHTML = html;
        
        var self = this;
        document.querySelectorAll('.calendar-day:not(.other-month)').forEach(function(day) {
            day.addEventListener('click', function() {
                var dateStr = this.getAttribute('data-date');
                var parts = dateStr.split('-');
                var newDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                self.currentDate = newDate;
                self.updateDisplay();
                self.closeCalendar();
                App.saveLastDate();
            });
        });
    },
    
    fetchHolidayData: function(year) {
        var urls = [
            'https://cdn.jsdelivr.net/gh/NateScarlet/holiday-cn@master/' + year + '.json',
            'https://raw.githubusercontent.com/NateScarlet/holiday-cn/master/' + year + '.json'
        ];
        
        var self = this;
        urls.forEach(function(url) {
            fetch(url, { method: 'GET' })
                .then(function(response) {
                    if (response.ok) {
                        return response.json();
                    }
                    throw new Error('Network response was not ok');
                })
                .then(function(data) {
                    if (data && data.days) {
                        var holidayMap = {};
                        data.days.forEach(function(day) {
                            holidayMap[day.date] = {
                                name: day.name,
                                isOffDay: day.isOffDay
                            };
                        });
                        self.holidayCache[year] = holidayMap;
                        localStorage.setItem('holidayCache_' + year, JSON.stringify(holidayMap));
                    }
                })
                .catch(function(e) {
                    console.log('Holiday API fetch failed:', e);
                });
        });
    },
    
    getHolidayInfo: function(year, month, day) {
        if (!this.holidayCache) {
            this.holidayCache = {};
        }
        
        var fullDateKey = year + '-' + String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0');
        
        if (!this.holidayCache[year]) {
            var cached = localStorage.getItem('holidayCache_' + year);
            if (cached) {
                try {
                    this.holidayCache[year] = JSON.parse(cached);
                } catch(e) {}
            } else {
                this.fetchHolidayData(year);
            }
        }
        
        if (this.holidayCache[year] && this.holidayCache[year][fullDateKey]) {
            var data = this.holidayCache[year][fullDateKey];
            return {
                name: data.name,
                isLegalHoliday: data.isOffDay,
                isMakeupWork: !data.isOffDay && data.name !== ''
            };
        }
        
        return this.getHolidayInfoFallback(year, month, day);
    },
    
    getHolidayInfoFallback: function(year, month, day) {
        var dateKey = month + '-' + day;
        
        var makeupWorkDays = {
            2026: ['2-15', '2-16', '4-7', '5-4', '9-20', '10-10'],
            2027: ['2-6', '2-7', '4-24', '5-29', '10-9', '10-10'],
            2028: ['2-19', '2-20', '4-15', '5-18', '9-30', '10-8'],
            2029: ['2-10', '2-11', '4-28', '5-20', '9-23', '10-7']
        };
        
        var legalHolidayRanges = {
            '1-1': {name: '元旦', days: 1},
            '5-1': {name: '劳动节', days: 3},
            '10-1': {name: '国庆节', days: 7}
        };
        
        for (var startDate in legalHolidayRanges) {
            var info = legalHolidayRanges[startDate];
            var parts = startDate.split('-');
            var startMonth = parseInt(parts[0]);
            var startDay = parseInt(parts[1]);
            
            if (month === startMonth && day >= startDay && day < startDay + info.days) {
                return {
                    name: info.name,
                    isLegalHoliday: true,
                    isMakeupWork: false
                };
            }
        }
        
        var springFestivalDates = this.getSpringFestivalDates(year);
        if (springFestivalDates.indexOf(dateKey) !== -1) {
            return {
                name: '春节',
                isLegalHoliday: true,
                isMakeupWork: false
            };
        }
        
        if (month === 4) {
            try {
                var qingmingSolar = Solar.fromYmd(year, 4, 4);
                var qingmingLunar = qingmingSolar.getLunar();
                var jieQi = qingmingLunar.getJieQi();
                if (jieQi && jieQi.getName && jieQi.getName() === '清明') {
                    var qingmingDay = parseInt(qingmingSolar.getDay());
                    if (day === qingmingDay) {
                        return {
                            name: '清明节',
                            isLegalHoliday: true,
                            isMakeupWork: false
                        };
                    }
                }
            } catch(e) {}
            
            if (day >= 4 && day <= 6) {
                return {
                    name: '清明节',
                    isLegalHoliday: true,
                    isMakeupWork: false
                };
            }
        }
        
        var dragonBoatDate = this.getDragonBoatFestivalDate(year);
        if (dateKey === dragonBoatDate) {
            return {
                name: '端午节',
                isLegalHoliday: true,
                isMakeupWork: false
            };
        }
        
        var midAutumnDate = this.getMidAutumnFestivalDate(year);
        if (midAutumnDate) {
            var parts = midAutumnDate.split('-');
            var midAutumnMonth = parseInt(parts[0]);
            var midAutumnDay = parseInt(parts[1]);
            
            if (month === midAutumnMonth && day >= midAutumnDay && day <= midAutumnDay + 2) {
                return {
                    name: '中秋节',
                    isLegalHoliday: true,
                    isMakeupWork: false
                };
            }
        }
        
        var yearMakeupDays = makeupWorkDays[year] || [];
        if (yearMakeupDays.indexOf(dateKey) !== -1) {
            return {
                name: '',
                isLegalHoliday: false,
                isMakeupWork: true
            };
        }
        
        return {
            name: '',
            isLegalHoliday: false,
            isMakeupWork: false
        };
    },
    
    getSpringFestivalDates: function(year) {
        try {
            for (var i = 1; i <= 365; i++) {
                var s = Solar.fromYmd(year, 1, 1).next(i - 1);
                var l = s.getLunar();
                if (l.getMonth() === 1 && l.getDay() === 1) {
                    var dates = [];
                    for (var j = 0; j < 5; j++) {
                        dates.push(s.next(j).getMonth() + '-' + s.next(j).getDay());
                    }
                    return dates;
                }
            }
        } catch(e) {}
        return ['1-28', '1-29', '1-30', '1-31', '2-1'];
    },
    
    getDragonBoatFestivalDate: function(year) {
        try {
            for (var i = 1; i <= 365; i++) {
                var s = Solar.fromYmd(year, 1, 1).next(i - 1);
                var l = s.getLunar();
                if (l.getMonth() === 5 && l.getDay() === 5) {
                    return s.getMonth() + '-' + s.getDay();
                }
            }
        } catch(e) {}
        return '6-19';
    },
    
    getMidAutumnFestivalDate: function(year) {
        try {
            for (var i = 1; i <= 365; i++) {
                var s = Solar.fromYmd(year, 1, 1).next(i - 1);
                var l = s.getLunar();
                if (l.getMonth() === 8 && l.getDay() === 15) {
                    return s.getMonth() + '-' + s.getDay();
                }
            }
        } catch(e) {}
        return '9-27';
    },
    
    isWorkDay: function(year, month, day) {
        var dateStr = month + '-' + day;
        
        var holidayInfo = this.getHolidayInfo(year, month, day);
        if (holidayInfo.isLegalHoliday) {
            return false;
        }
        if (holidayInfo.isMakeupWork) {
            return true;
        }
        
        var d = new Date(year, month - 1, day);
        var weekDay = d.getDay();
        
        return weekDay !== 0 && weekDay !== 6;
    }
};