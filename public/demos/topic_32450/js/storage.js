(function () {
  "use strict";

  var RECORDS_KEY = "moodWeather.records";
  var SETTINGS_KEY = "moodWeather.settings";
  var COLORING_KEY = "moodWeather.coloring";
  var memoryStore = {
    records: [],
    settings: { activePage: "checkin", sound: true, careSeenDate: "" },
    coloring: {}
  };

  function pad(num) {
    return String(num).padStart(2, "0");
  }

  function toDateKey(date) {
    return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate());
  }

  function fromDateKey(key) {
    var parts = key.split("-").map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  function addDays(date, amount) {
    var next = new Date(date);
    next.setDate(next.getDate() + amount);
    return next;
  }

  function safeParse(raw, fallback) {
    try {
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function read(key, fallback) {
    try {
      var raw = window.localStorage.getItem(key);
      return safeParse(raw, fallback);
    } catch (error) {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      return false;
    }
  }

  function sortRecords(records) {
    return records.slice().sort(function (a, b) {
      return a.date.localeCompare(b.date);
    });
  }

  function loadRecords() {
    var records = read(RECORDS_KEY, memoryStore.records);
    if (!Array.isArray(records)) {
      return [];
    }
    return sortRecords(records);
  }

  function saveRecords(records) {
    memoryStore.records = sortRecords(records);
    write(RECORDS_KEY, memoryStore.records);
    return memoryStore.records;
  }

  function loadSettings() {
    var settings = read(SETTINGS_KEY, memoryStore.settings);
    return Object.assign({}, memoryStore.settings, settings || {});
  }

  function saveSettings(settings) {
    memoryStore.settings = Object.assign({}, memoryStore.settings, settings);
    write(SETTINGS_KEY, memoryStore.settings);
    return memoryStore.settings;
  }

  function loadColoring() {
    var data = read(COLORING_KEY, memoryStore.coloring);
    return data && typeof data === "object" ? data : {};
  }

  function saveColoring(data) {
    memoryStore.coloring = data || {};
    write(COLORING_KEY, memoryStore.coloring);
    return memoryStore.coloring;
  }

  function getWeather(key) {
    return window.MoodData.weatherTypes.find(function (item) {
      return item.key === key;
    }) || window.MoodData.weatherTypes[1];
  }

  function seedRecordsIfEmpty() {
    var existing = loadRecords();
    if (existing.length > 0) {
      return existing;
    }

    var today = new Date();
    var pattern = [
      "sunny", "cloudy", "rain", "storm", "rain", "cloudy", "sunny",
      "rainbow", "sunny", "cloudy", "rain", "cloudy", "sunny", "rainbow",
      "cloudy", "rain", "storm", "rain", "cloudy", "sunny", "sunny",
      "cloudy", "rain", "cloudy", "sunny", "rainbow", "cloudy", "rain",
      "storm", "rain"
    ];
    var notes = [
      "今天完成了一个小目标。",
      "有一点累，但也有一点安心。",
      "考试压力有点大。",
      "情绪像雷雨一样乱。",
      "睡得不太好，想慢一点。",
      "和朋友聊了一会儿。",
      "天气很好，心也亮了一点。"
    ];
    var tagSets = [
      ["学习考试"],
      ["睡眠"],
      ["朋友"],
      ["家庭"],
      ["身体"],
      ["其他"],
      ["朋友", "睡眠"]
    ];
    var records = pattern.map(function (weather, index) {
      var date = addDays(today, index - pattern.length + 1);
      var type = getWeather(weather);
      return {
        date: toDateKey(date),
        weather: weather,
        moodScore: type.score,
        note: notes[index % notes.length],
        tags: tagSets[index % tagSets.length],
        createdAt: date.toISOString(),
        updatedAt: date.toISOString()
      };
    });
    return saveRecords(records);
  }

  function upsertRecord(record) {
    var records = loadRecords();
    var index = records.findIndex(function (item) {
      return item.date === record.date;
    });
    var now = new Date().toISOString();
    var nextRecord = Object.assign({}, record, {
      updatedAt: now,
      createdAt: record.createdAt || now
    });

    if (index >= 0) {
      nextRecord.createdAt = records[index].createdAt || now;
      records[index] = nextRecord;
    } else {
      records.push(nextRecord);
    }
    return saveRecords(records);
  }

  function recordMap(records) {
    return records.reduce(function (map, item) {
      map[item.date] = item;
      return map;
    }, {});
  }

  function getRecordsByRange(days) {
    var records = recordMap(loadRecords());
    var today = new Date();
    var result = [];
    for (var i = days - 1; i >= 0; i -= 1) {
      var date = addDays(today, -i);
      var key = toDateKey(date);
      result.push({
        date: key,
        record: records[key] || null
      });
    }
    return result;
  }

  function getCurrentStreak(records) {
    var map = recordMap(records || loadRecords());
    var streak = 0;
    var cursor = new Date();
    while (map[toDateKey(cursor)]) {
      streak += 1;
      cursor = addDays(cursor, -1);
    }
    return streak;
  }

  function getLowMoodStreak(records) {
    var map = recordMap(records || loadRecords());
    var streak = 0;
    var cursor = new Date();
    while (true) {
      var item = map[toDateKey(cursor)];
      if (!item || (item.weather !== "rain" && item.weather !== "storm")) {
        break;
      }
      streak += 1;
      cursor = addDays(cursor, -1);
    }
    return streak;
  }

  window.MoodStorage = {
    toDateKey: toDateKey,
    fromDateKey: fromDateKey,
    addDays: addDays,
    getWeather: getWeather,
    loadRecords: loadRecords,
    saveRecords: saveRecords,
    loadSettings: loadSettings,
    saveSettings: saveSettings,
    loadColoring: loadColoring,
    saveColoring: saveColoring,
    seedRecordsIfEmpty: seedRecordsIfEmpty,
    upsertRecord: upsertRecord,
    getRecordsByRange: getRecordsByRange,
    getCurrentStreak: getCurrentStreak,
    getLowMoodStreak: getLowMoodStreak,
    recordMap: recordMap
  };
})();
