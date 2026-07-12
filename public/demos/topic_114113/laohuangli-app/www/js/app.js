var App = {
    settings: {
        fontSize: 'normal',
        theme: 'yellow',
        voiceRate: 0.85,
        voiceGender: 'female',
        reminderEnabled: true
    },
    
    init: function() {
        this.loadSettings();
        this.applySettings();
        
        if (typeof cordova !== 'undefined') {
            document.addEventListener('deviceready', function() {
                Voice.init();
                App.loadLastDate();
                UI.init();
            }, false);
        } else {
            Voice.init();
            this.loadLastDate();
            UI.init();
        }
        
        this.checkReminders();
        setInterval(function() {
            App.checkReminders();
        }, 60000);
    },
    
    loadSettings: function() {
        try {
            var saved = localStorage.getItem('laohuangli_settings');
            if (saved) {
                var parsed = JSON.parse(saved);
                this.settings = Object.assign(this.settings, parsed);
            }
        } catch (e) {
            console.error('Failed to load settings:', e);
        }
    },
    
    saveSettings: function() {
        try {
            localStorage.setItem('laohuangli_settings', JSON.stringify(this.settings));
        } catch (e) {
            console.error('Failed to save settings:', e);
        }
    },
    
    loadLastDate: function() {
        try {
            var saved = localStorage.getItem('laohuangli_last_date');
            if (saved) {
                var date = new Date(saved);
                if (!isNaN(date.getTime())) {
                    var today = new Date();
                    var diffDays = Math.abs(Calendar.getDayDiff(today, date));
                    if (diffDays <= 365) {
                        UI.currentDate = date;
                    }
                }
            }
        } catch (e) {
            console.error('Failed to load last date:', e);
        }
    },
    
    saveLastDate: function() {
        try {
            localStorage.setItem('laohuangli_last_date', UI.currentDate.toISOString());
        } catch (e) {
            console.error('Failed to save last date:', e);
        }
    },
    
    applySettings: function() {
        UI.updateFontSize(this.settings.fontSize);
        UI.updateTheme(this.settings.theme);
        
        Voice.setRate(this.settings.voiceRate);
        Voice.setGender(this.settings.voiceGender);
        
        this.updateFontButtons();
        this.updateThemeButtons();
    },
    
    updateFontButtons: function() {
        var btns = document.querySelectorAll('.font-toggle-btn');
        btns.forEach(function(btn) {
            if (btn.getAttribute('data-font') === App.settings.fontSize) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    },
    
    updateThemeButtons: function() {
        var btns = document.querySelectorAll('[data-theme]');
        btns.forEach(function(btn) {
            if (btn.getAttribute('data-theme') === App.settings.theme) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    },
    
    setFontSize: function(fontSize) {
        this.settings.fontSize = fontSize;
        UI.updateFontSize(fontSize);
        this.saveSettings();
    },
    
    setTheme: function(theme) {
        this.settings.theme = theme;
        UI.updateTheme(theme);
        this.saveSettings();
    },
    
    setReminder: function(enabled) {
        this.settings.reminderEnabled = enabled;
        this.saveSettings();
        if (enabled) {
            this.checkReminders();
        }
    },
    
    checkReminders: function() {
        if (!this.settings.reminderEnabled) return;
        
        var today = new Date();
        today.setHours(0, 0, 0, 0);
        
        var reminders = this.getReminders();
        var upcoming = [];
        
        reminders.forEach(function(r) {
            var reminderDate = this.getReminderDate(r, today);
            var diff = Calendar.getDayDiff(today, reminderDate);
            
            if (diff >= 0 && diff <= 3) {
                upcoming.push({
                    name: r.name,
                    date: reminderDate,
                    days: diff,
                    type: r.type
                });
            }
        }, this);
        
        if (upcoming.length > 0) {
            this.showReminderAlert(upcoming);
        }
    },
    
    getReminders: function() {
        try {
            var saved = localStorage.getItem('laohuangli_reminders');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    },
    
    saveReminders: function(reminders) {
        try {
            localStorage.setItem('laohuangli_reminders', JSON.stringify(reminders));
        } catch (e) {
            console.error('Failed to save reminders:', e);
        }
    },
    
    getReminderDate: function(reminder, today) {
        var year = today.getFullYear();
        var month = parseInt(reminder.month) - 1;
        var day = parseInt(reminder.day);
        
        if (reminder.type === 'lunar') {
            var solar = Lunar.fromYmd(year, month + 1, day).getSolar();
            return new Date(solar.getYear(), solar.getMonth() - 1, solar.getDay());
        }
        
        var date = new Date(year, month, day);
        if (date < today) {
            date.setFullYear(year + 1);
        }
        
        return date;
    },
    
    showReminderAlert: function(reminders) {
        var msg = '纪念日提醒：';
        reminders.forEach(function(r) {
            var daysText = r.days === 0 ? '今天' : r.days + '天后';
            msg += daysText + '是' + r.name + '，';
        });
        
        if (typeof cordova !== 'undefined' && navigator.notification) {
            navigator.notification.alert(msg, function() {}, '纪念日提醒', '知道了');
            
            if (typeof window.TTS !== 'undefined') {
                window.TTS.speak(msg);
            }
        } else {
            if (!this.reminderShown) {
                alert(msg);
                this.reminderShown = true;
                Voice.speak(msg);
            }
        }
    },
    
    addReminder: function(name, month, day, type) {
        var reminders = this.getReminders();
        reminders.push({ name: name, month: month, day: day, type: type });
        this.saveReminders(reminders);
    },
    
    removeReminder: function(index) {
        var reminders = this.getReminders();
        reminders.splice(index, 1);
        this.saveReminders(reminders);
    }
};

localStorage.removeItem('laohuangli_last_date');

document.addEventListener('DOMContentLoaded', function() {
    App.init();
});