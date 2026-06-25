var GameTime = (function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════
    //  时段定义 — 一天分为6个时段
    // ═══════════════════════════════════════════════════════════

    var PERIOD = {
        DAWN:      { id: 'dawn',      name: '清晨', hour: 5,  emoji: '🌅', desc: '天刚蒙蒙亮', lightLevel: 0.3 },
        MORNING:   { id: 'morning',   name: '上午', hour: 8,  emoji: '☀️', desc: '阳光正好',   lightLevel: 0.8 },
        NOON:      { id: 'noon',      name: '正午', hour: 12, emoji: '🌞', desc: '日头正盛',   lightLevel: 1.0 },
        AFTERNOON: { id: 'afternoon', name: '下午', hour: 14, emoji: '🌤', desc: '午后时光',   lightLevel: 0.7 },
        EVENING:   { id: 'evening',   name: '傍晚', hour: 17, emoji: '🌇', desc: '夕阳西下',   lightLevel: 0.4 },
        NIGHT:     { id: 'night',     name: '夜晚', hour: 20, emoji: '🌙', desc: '月明星稀',   lightLevel: 0.1 }
    };

    var PERIOD_ORDER = [PERIOD.DAWN, PERIOD.MORNING, PERIOD.NOON, PERIOD.AFTERNOON, PERIOD.EVENING, PERIOD.NIGHT];

    // 每个时段持续的游戏秒数（1时段=90秒真实时间，一天6时段=9分钟）
    var PERIOD_DURATION = 90;

    // ═══════════════════════════════════════════════════════════
    //  天气定义 — 含季节权重
    // ═══════════════════════════════════════════════════════════

    var WEATHER = {
        SUNNY:   { id: 'sunny',   name: '晴天', emoji: '☀️', moodEffect: 5,  customerEffect: 0,  mapTint: null },
        CLOUDY:  { id: 'cloudy',  name: '多云', emoji: '⛅', moodEffect: 0,  customerEffect: 0,  mapTint: 'rgba(150,150,170,0.08)' },
        RAINY:   { id: 'rainy',   name: '下雨', emoji: '🌧', moodEffect: -5, customerEffect: 2,  mapTint: 'rgba(80,100,140,0.12)' },
        WINDY:   { id: 'windy',   name: '起风', emoji: '💨', moodEffect: -2, customerEffect: -1, mapTint: null },
        FOGGY:   { id: 'foggy',   name: '起雾', emoji: '🌫', moodEffect: -3, customerEffect: -1, mapTint: 'rgba(200,200,200,0.15)' },
        STORMY:  { id: 'stormy',  name: '暴风', emoji: '⛈', moodEffect: -10, customerEffect: -3, mapTint: 'rgba(40,40,60,0.18)' },
        SNOWY:   { id: 'snowy',   name: '下雪', emoji: '❄️', moodEffect: -3, customerEffect: -1, mapTint: 'rgba(220,230,255,0.12)' },
        DRIZZLE: { id: 'drizzle', name: '细雨', emoji: '🌦', moodEffect: -1, customerEffect: 1,  mapTint: 'rgba(100,120,160,0.06)' }
    };

    // ═══════════════════════════════════════════════════════════
    //  月份定义 — 12个月，每月30天
    // ═══════════════════════════════════════════════════════════

    var MONTHS = [
        { id: 'm1',  name: '正月', season: 'spring', emoji: '🏮', desc: '新年伊始，万象更新' },
        { id: 'm2',  name: '二月', season: 'spring', emoji: '🌱', desc: '春寒料峭，草木萌发' },
        { id: 'm3',  name: '三月', season: 'spring', emoji: '🌸', desc: '春暖花开，桃李争妍' },
        { id: 'm4',  name: '四月', season: 'summer', emoji: '🌿', desc: '初夏微热，绿荫渐浓' },
        { id: 'm5',  name: '五月', season: 'summer', emoji: '☀️', desc: '盛夏炎炎，蝉鸣不绝' },
        { id: 'm6',  name: '六月', season: 'summer', emoji: '🔥', desc: '酷暑难耐，雷雨频至' },
        { id: 'm7',  name: '七月', season: 'autumn', emoji: '🌾', desc: '初秋微凉，稻穗渐黄' },
        { id: 'm8',  name: '八月', season: 'autumn', emoji: '🍂', desc: '中秋月圆，桂香满路' },
        { id: 'm9',  name: '九月', season: 'autumn', emoji: '🍁', desc: '深秋萧瑟，落叶纷飞' },
        { id: 'm10', name: '十月', season: 'winter', emoji: '🌫', desc: '初冬薄寒，晨霜渐起' },
        { id: 'm11', name: '冬月', season: 'winter', emoji: '❄️', desc: '寒冬凛冽，大雪纷飞' },
        { id: 'm12', name: '腊月', season: 'winter', emoji: '🧨', desc: '岁末将至，年味渐浓' }
    ];

    var DAYS_PER_MONTH = 30;

    // ═══════════════════════════════════════════════════════════
    //  季节定义 — 含完整属性
    // ═══════════════════════════════════════════════════════════

    var SEASON = {
        spring: {
            id: 'spring', name: '春', fullName: '春季', emoji: '🌸',
            teaBonus: { flower: 0.1 },
            moodBase: 5,
            desc: '万物复苏，适合采茶',
            groundColor: '#4a6b3a', treeColor: '#5a8b4a', waterColor: '#4a7a9a',
            weatherWeights: { sunny: 3, cloudy: 2, rainy: 2, drizzle: 1, foggy: 1, windy: 1 },
            events: ['春雨润茶', '花朝节', '清明扫墓', '谷雨采茶', '春社祭祀']
        },
        summer: {
            id: 'summer', name: '夏', fullName: '夏季', emoji: '🌿',
            teaBonus: { green: 0.1 },
            moodBase: 0,
            desc: '炎热多雨，绿茶当令',
            groundColor: '#3a5b2a', treeColor: '#4a7b3a', waterColor: '#3a6a8a',
            weatherWeights: { sunny: 4, cloudy: 1, rainy: 1, stormy: 1, drizzle: 1 },
            events: ['端午龙舟', '夏日雷暴', '伏天纳凉', '七夕乞巧', '晒茶节']
        },
        autumn: {
            id: 'autumn', name: '秋', fullName: '秋季', emoji: '🍂',
            teaBonus: { basic: 0.1 },
            moodBase: -3,
            desc: '秋高气爽，丰收时节',
            groundColor: '#5a5b3a', treeColor: '#7a6b3a', waterColor: '#4a7a9a',
            weatherWeights: { sunny: 2, cloudy: 2, windy: 2, foggy: 1, rainy: 1 },
            events: ['中秋赏月', '重阳登高', '秋收感恩', '桂花飘香', '霜降寒意']
        },
        winter: {
            id: 'winter', name: '冬', fullName: '冬季', emoji: '❄️',
            teaBonus: { spirit: 0.1 },
            moodBase: -5,
            desc: '寒冬腊月，围炉煮茶',
            groundColor: '#5a5a6a', treeColor: '#4a4a5a', waterColor: '#3a5a7a',
            weatherWeights: { cloudy: 2, snowy: 3, windy: 1, foggy: 1, sunny: 1 },
            events: ['冬至团圆', '腊八施粥', '小年祭灶', '除夕守岁', '大雪封山']
        }
    };

    // ═══════════════════════════════════════════════════════════
    //  内部状态
    // ═══════════════════════════════════════════════════════════

    var _state = {
        year: 1,
        month: 0,       // 0-11 对应正月到腊月
        day: 1,          // 1-30
        periodIndex: 0,
        weather: WEATHER.SUNNY,
        isPaused: true,
        timerId: null,
        periodElapsed: 0,
        totalDays: 0     // 总天数计数
    };

    var _listeners = [];

    // ═══════════════════════════════════════════════════════════
    //  核心逻辑
    // ═══════════════════════════════════════════════════════════

    function _getCurrentPeriod() {
        return PERIOD_ORDER[_state.periodIndex] || PERIOD.DAWN;
    }

    function _getCurrentMonth() {
        return MONTHS[_state.month] || MONTHS[0];
    }

    function _getCurrentSeason() {
        var month = _getCurrentMonth();
        return SEASON[month.season] || SEASON.spring;
    }

    function _rollWeather() {
        var season = _getCurrentSeason();
        var weights = season.weatherWeights || { sunny: 3, cloudy: 2, rainy: 1 };
        var pool = [];
        for (var wid in weights) {
            if (weights.hasOwnProperty(wid)) {
                var w = WEATHER[wid.toUpperCase()];
                if (w) {
                    for (var i = 0; i < weights[wid]; i++) {
                        pool.push(w);
                    }
                }
            }
        }
        if (pool.length === 0) pool.push(WEATHER.SUNNY);
        _state.weather = pool[Math.floor(Math.random() * pool.length)];
    }

    function _advancePeriod() {
        _state.periodIndex++;

        if (_state.periodIndex >= PERIOD_ORDER.length) {
            // 新的一天
            _state.periodIndex = 0;
            _state.day++;
            _state.totalDays++;
            _rollWeather();

            // 月份变化
            if (_state.day > DAYS_PER_MONTH) {
                var oldMonth = _state.month;
                _state.day = 1;
                _state.month++;

                // 年份变化
                if (_state.month >= 12) {
                    _state.month = 0;
                    _state.year++;
                }

                var newSeason = _getCurrentSeason();
                var oldSeason = SEASON[MONTHS[oldMonth].season];

                _emit('newMonth', {
                    month: _getCurrentMonth(),
                    season: newSeason,
                    year: _state.year,
                    seasonChanged: oldSeason.id !== newSeason.id
                });
            }

            _emit('newDay', {
                day: _state.day,
                month: _getCurrentMonth(),
                season: _getCurrentSeason(),
                weather: _state.weather,
                year: _state.year
            });
        }

        _state.periodElapsed = 0;
        _emit('periodChange', { period: _getCurrentPeriod(), day: _state.day });
    }

    function _tick() {
        if (_state.isPaused) return;
        _state.periodElapsed++;
        if (_state.periodElapsed >= PERIOD_DURATION) {
            _advancePeriod();
        }
    }

    // ═══════════════════════════════════════════════════════════
    //  事件系统
    // ═══════════════════════════════════════════════════════════

    function _emit(eventName, data) {
        for (var i = 0; i < _listeners.length; i++) {
            try { _listeners[i](eventName, data); }
            catch (e) { if (window.Logger) Logger.warn('GameTime', '事件监听器异常', { event: eventName }); }
        }
    }

    function onTick(callback) {
        if (typeof callback === 'function') _listeners.push(callback);
    }

    // ═══════════════════════════════════════════════════════════
    //  公开接口
    // ═══════════════════════════════════════════════════════════

    function init() {
        _state.year = 1;
        _state.month = 0;
        _state.day = 1;
        _state.periodIndex = 1; // 从早上开始，允许立即营业
        _state.isPaused = true;
        _state.periodElapsed = 0;
        _state.totalDays = 0;
        _rollWeather();
        if (window.Logger) Logger.info('GameTime', '时间系统初始化');
    }

    function start() {
        if (!_state.isPaused) return;
        _state.isPaused = false;
        _state.timerId = setInterval(_tick, 1000);
        if (window.Logger) Logger.info('GameTime', '时间开始流动');
    }

    function pause() {
        _state.isPaused = true;
        if (_state.timerId) { clearInterval(_state.timerId); _state.timerId = null; }
    }

    function resume() {
        if (!_state.isPaused) return;
        _state.isPaused = false;
        _state.timerId = setInterval(_tick, 1000);
    }

    function isPaused() { return _state.isPaused; }

    function getDay() { return _state.day; }
    function getYear() { return _state.year; }
    function getMonth() { return _getCurrentMonth(); }
    function getMonthIndex() { return _state.month; }
    function getPeriod() { return _getCurrentPeriod(); }
    function getPeriodIndex() { return _state.periodIndex; }
    function getWeather() { return _state.weather; }
    function getSeason() { return _getCurrentSeason(); }
    function getPeriodProgress() { return _state.periodElapsed / PERIOD_DURATION; }
    function getTotalDays() { return _state.totalDays; }

    function getTimeString() {
        var p = _getCurrentPeriod();
        var s = _getCurrentSeason();
        var w = _state.weather;
        return s.emoji + s.name + ' ' + w.emoji + w.name + ' ' + p.emoji + p.name;
    }

    function getFullTimeString() {
        var m = _getCurrentMonth();
        return '第' + _state.year + '年 ' + m.emoji + m.name + ' 第' + _state.day + '天 ' + _getCurrentPeriod().name;
    }

    function getDateShort() {
        var m = _getCurrentMonth();
        return m.emoji + m.name + _state.day + '日';
    }

    // 获取当前季节事件
    function getSeasonEvent() {
        var season = _getCurrentSeason();
        if (!season.events || season.events.length === 0) return null;
        // 按月份+日期决定事件
        var idx = (_state.month * DAYS_PER_MONTH + _state.day) % season.events.length;
        return { name: season.events[idx], season: season.name };
    }

    // 获取季节对NPC心情的基础影响
    function getSeasonMoodEffect() {
        var season = _getCurrentSeason();
        return season.moodBase || 0;
    }

    // 强制跳到下一时段
    function advancePeriod() {
        _advancePeriod();
    }

    // 跳过今天：直接进入第二天清晨
    function skipToNextDay() {
        // 如果茶馆营业中，先触发打烊
        _emit('beforeSkipDay', {});

        // 跳到新一天
        _state.periodIndex = 0;
        _state.day++;
        _state.totalDays++;
        _state.periodElapsed = 0;
        _rollWeather();

        // 月份变化
        if (_state.day > DAYS_PER_MONTH) {
            var oldMonth = _state.month;
            _state.day = 1;
            _state.month++;
            if (_state.month >= 12) {
                _state.month = 0;
                _state.year++;
            }
            var newSeason = _getCurrentSeason();
            var oldSeason = SEASON[MONTHS[oldMonth].season];
            _emit('newMonth', {
                month: _getCurrentMonth(),
                season: newSeason,
                year: _state.year,
                seasonChanged: oldSeason.id !== newSeason.id
            });
        }

        _emit('newDay', {
            day: _state.day,
            month: _getCurrentMonth(),
            season: _getCurrentSeason(),
            weather: _state.weather,
            year: _state.year
        });
        _emit('periodChange', { period: _getCurrentPeriod(), day: _state.day });
    }

    return {
        init: init,
        start: start,
        pause: pause,
        resume: resume,
        isPaused: isPaused,
        onTick: onTick,
        getDay: getDay,
        getYear: getYear,
        getMonth: getMonth,
        getMonthIndex: getMonthIndex,
        getPeriod: getPeriod,
        getPeriodIndex: getPeriodIndex,
        getWeather: getWeather,
        getSeason: getSeason,
        getPeriodProgress: getPeriodProgress,
        getTotalDays: getTotalDays,
        getTimeString: getTimeString,
        getFullTimeString: getFullTimeString,
        getDateShort: getDateShort,
        getSeasonEvent: getSeasonEvent,
        getSeasonMoodEffect: getSeasonMoodEffect,
        advancePeriod: advancePeriod,
        skipToNextDay: skipToNextDay,
        PERIOD: PERIOD,
        WEATHER: WEATHER,
        SEASON: SEASON,
        MONTHS: MONTHS,
        PERIOD_DURATION: PERIOD_DURATION,
        DAYS_PER_MONTH: DAYS_PER_MONTH
    };
})();

window.GameTime = GameTime;
