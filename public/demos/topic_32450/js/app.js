(function () {
  "use strict";

  var state = {
    selectedWeather: "sunny",
    selectedTags: [],
    currentMonth: new Date(),
    trendDays: 7,
    records: []
  };

  function $(selector) {
    return document.querySelector(selector);
  }

  function $all(selector) {
    return Array.prototype.slice.call(document.querySelectorAll(selector));
  }

  function showToast(message) {
    var toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(function () {
      toast.classList.remove("show");
    }, 2200);
  }

  function initTabs() {
    $all(".tab").forEach(function (tab) {
      tab.addEventListener("click", function () {
        activatePage(tab.dataset.target);
      });
    });
  }

  function activatePage(page) {
    $all(".page").forEach(function (node) {
      node.classList.toggle("active", node.dataset.page === page);
    });
    $all(".tab").forEach(function (node) {
      node.classList.toggle("active", node.dataset.target === page);
    });
    var settings = window.MoodStorage.loadSettings();
    window.MoodStorage.saveSettings(Object.assign({}, settings, { activePage: page }));
    if (page === "trends") {
      renderTrends();
    }
    if (page === "care") {
      renderCare(false);
    }
  }

  function initSoundToggle() {
    var button = $("#soundToggle");
    function sync() {
      var enabled = window.MoodStorage.loadSettings().sound !== false;
      button.setAttribute("aria-pressed", String(enabled));
      button.textContent = enabled ? "🔔 音效" : "🔕 静音";
    }
    button.addEventListener("click", function () {
      var settings = window.MoodStorage.loadSettings();
      window.MoodStorage.saveSettings(Object.assign({}, settings, { sound: settings.sound === false }));
      sync();
      if (window.MoodStorage.loadSettings().sound !== false) {
        window.MoodAudio.success();
      }
    });
    sync();
  }

  function initCheckin() {
    renderWeatherPicker();
    renderTags();
    fillTodayRecord();
    $("#saveCheckin").addEventListener("click", saveCheckin);
    $("#closeFeedback").addEventListener("click", closeFeedback);
    $("#feedbackModal").addEventListener("click", function (event) {
      if (event.target.id === "feedbackModal") {
        closeFeedback();
      }
    });
  }

  function renderWeatherPicker() {
    var picker = $("#weatherPicker");
    picker.innerHTML = "";
    window.MoodData.weatherTypes.forEach(function (item) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "weather-option";
      button.dataset.weather = item.key;
      button.setAttribute("role", "radio");
      button.setAttribute("aria-checked", "false");
      button.innerHTML = '<span class="emoji">' + item.emoji + '</span><span class="label">' + item.label + '</span>';
      button.addEventListener("click", function () {
        state.selectedWeather = item.key;
        syncWeatherPicker();
        window.MoodAudio.pop();
      });
      picker.appendChild(button);
    });
    syncWeatherPicker();
  }

  function syncWeatherPicker() {
    $all(".weather-option").forEach(function (button) {
      var active = button.dataset.weather === state.selectedWeather;
      button.classList.toggle("active", active);
      button.setAttribute("aria-checked", String(active));
    });
  }

  function renderTags() {
    var list = $("#tagList");
    list.innerHTML = "";
    window.MoodData.tags.forEach(function (tag) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "tag-chip";
      button.textContent = tag;
      button.addEventListener("click", function () {
        if (state.selectedTags.indexOf(tag) >= 0) {
          state.selectedTags = state.selectedTags.filter(function (item) {
            return item !== tag;
          });
        } else {
          state.selectedTags.push(tag);
        }
        syncTags();
      });
      list.appendChild(button);
    });
  }

  function syncTags() {
    $all(".tag-chip").forEach(function (button) {
      button.classList.toggle("active", state.selectedTags.indexOf(button.textContent) >= 0);
    });
  }

  function fillTodayRecord() {
    var todayKey = window.MoodStorage.toDateKey(new Date());
    var todayRecord = state.records.find(function (record) {
      return record.date === todayKey;
    });
    if (!todayRecord) {
      $("#checkinStatus").textContent = "今天还没有打卡，选一个天气开始吧。";
      syncWeatherPicker();
      syncTags();
      return;
    }
    state.selectedWeather = todayRecord.weather;
    state.selectedTags = todayRecord.tags || [];
    $("#diaryInput").value = todayRecord.note || "";
    $("#checkinStatus").textContent = "今天已经打卡，可以修改后再次保存。";
    syncWeatherPicker();
    syncTags();
  }

  function saveCheckin() {
    var weather = window.MoodStorage.getWeather(state.selectedWeather);
    var todayKey = window.MoodStorage.toDateKey(new Date());
    var existing = state.records.find(function (record) {
      return record.date === todayKey;
    });
    var record = {
      date: todayKey,
      weather: weather.key,
      moodScore: weather.score,
      note: $("#diaryInput").value.trim(),
      tags: state.selectedTags.slice(),
      createdAt: existing ? existing.createdAt : ""
    };
    state.records = window.MoodStorage.upsertRecord(record);
    $("#checkinStatus").textContent = "今天已经打卡，可以修改后再次保存。";
    renderTrends();
    renderCare(true);
    openFeedback(weather);
    window.MoodAudio.success();
  }

  function openFeedback(weather) {
    $("#feedbackEmoji").textContent = weather.emoji;
    $("#feedbackTitle").textContent = weather.feedbackTitle;
    $("#feedbackText").textContent = weather.feedback;
    $("#feedbackModal").classList.add("show");
    $("#feedbackModal").setAttribute("aria-hidden", "false");
  }

  function closeFeedback() {
    $("#feedbackModal").classList.remove("show");
    $("#feedbackModal").setAttribute("aria-hidden", "true");
  }

  function initTrends() {
    $("#prevMonth").addEventListener("click", function () {
      state.currentMonth.setMonth(state.currentMonth.getMonth() - 1);
      renderCalendar();
    });
    $("#nextMonth").addEventListener("click", function () {
      state.currentMonth.setMonth(state.currentMonth.getMonth() + 1);
      renderCalendar();
    });
    $all(".range-btn").forEach(function (button) {
      button.addEventListener("click", function () {
        state.trendDays = Number(button.dataset.days);
        $all(".range-btn").forEach(function (node) {
          node.classList.toggle("active", node === button);
        });
        renderChart();
      });
    });
  }

  function renderTrends() {
    state.records = window.MoodStorage.loadRecords();
    renderCalendar();
    renderChart();
    renderStats();
  }

  function renderCalendar() {
    var grid = $("#calendarGrid");
    var map = window.MoodStorage.recordMap(state.records);
    var year = state.currentMonth.getFullYear();
    var month = state.currentMonth.getMonth();
    var first = new Date(year, month, 1);
    var days = new Date(year, month + 1, 0).getDate();
    var startOffset = (first.getDay() + 6) % 7;
    var todayKey = window.MoodStorage.toDateKey(new Date());
    $("#monthLabel").textContent = year + " / " + String(month + 1).padStart(2, "0");
    grid.innerHTML = "";

    for (var blank = 0; blank < startOffset; blank += 1) {
      var empty = document.createElement("div");
      empty.className = "day-cell empty";
      grid.appendChild(empty);
    }

    for (var day = 1; day <= days; day += 1) {
      var date = new Date(year, month, day);
      var key = window.MoodStorage.toDateKey(date);
      var record = map[key];
      var weather = record ? window.MoodStorage.getWeather(record.weather) : null;
      var cell = document.createElement("div");
      cell.className = "day-cell" + (key === todayKey ? " today" : "");
      cell.innerHTML = '<span class="day-num">' + day + '</span><span class="day-emoji">' + (weather ? weather.emoji : "·") + '</span>';
      if (record) {
        cell.title = record.note || weather.label;
      }
      grid.appendChild(cell);
    }
  }

  function renderChart() {
    window.MoodCharts.drawTrend($("#trendCanvas"), window.MoodStorage.getRecordsByRange(state.trendDays));
  }

  function renderStats() {
    var year = state.currentMonth.getFullYear();
    var month = state.currentMonth.getMonth();
    var monthRecords = state.records.filter(function (record) {
      var date = window.MoodStorage.fromDateKey(record.date);
      return date.getFullYear() === year && date.getMonth() === month;
    });
    var sunnyCount = monthRecords.filter(function (record) {
      return record.weather === "sunny" || record.weather === "rainbow";
    }).length;
    var rainCount = monthRecords.filter(function (record) {
      return record.weather === "rain" || record.weather === "storm";
    }).length;
    var streak = window.MoodStorage.getCurrentStreak(state.records);
    var stats = [
      { value: sunnyCount, label: "本月晴天" },
      { value: rainCount, label: "本月雨天" },
      { value: streak, label: "连续打卡" }
    ];
    $("#statsGrid").innerHTML = stats.map(function (item) {
      return '<article class="stat-card"><span class="stat-value">' + item.value + '</span><span class="stat-label">' + item.label + '</span></article>';
    }).join("");
  }

  function renderCare(auto) {
    var streak = window.MoodStorage.getLowMoodStreak(state.records);
    var content = $("#careContent");
    if (streak >= 3) {
      var suggestions = window.MoodData.careSuggestions.slice(0).sort(function () {
        return Math.random() - 0.5;
      }).slice(0, 2);
      content.innerHTML = '<div class="care-panel">' +
        '<strong>这几天的雨好像有点久。</strong>' +
        '<p class="soft-note">我看见你连续 ' + streak + ' 天记录了雨天或暴雨。这里不判断、不诊断，只想提醒你：难受的时候，可以先把自己放在更安全、更柔软的位置。</p>' +
        '<ul class="care-list">' + suggestions.map(function (item) {
          return "<li>" + item + "</li>";
        }).join("") + '</ul>' +
        '</div>';
      if (auto) {
        showToast("检测到连续雨天，已为你准备一张温柔关怀卡。");
      }
    } else {
      content.innerHTML = '<div class="care-panel">' +
        '<strong>今天也可以温柔一点。</strong>' +
        '<p class="soft-note">目前没有触发连续低落提醒。无论天气怎样，你都可以随时来这里找一点陪伴和建议。</p>' +
        '<ul class="care-list"><li>给自己倒一杯水，做一次慢呼吸。</li><li>把感受写成一句话，不需要解释得很完美。</li></ul>' +
        '</div>';
    }
  }

  function autoCareNotice() {
    var settings = window.MoodStorage.loadSettings();
    var todayKey = window.MoodStorage.toDateKey(new Date());
    if (window.MoodStorage.getLowMoodStreak(state.records) >= 3 && settings.careSeenDate !== todayKey) {
      window.MoodStorage.saveSettings(Object.assign({}, settings, { careSeenDate: todayKey }));
      setTimeout(function () {
        showToast("这几天雨有点久，关怀页给你留了一张小卡片。");
      }, 900);
    }
  }

  function boot() {
    state.records = window.MoodStorage.seedRecordsIfEmpty();
    initTabs();
    initSoundToggle();
    initCheckin();
    initTrends();
    window.MoodGames.init();
    renderTrends();
    renderCare(false);
    autoCareNotice();
    var settings = window.MoodStorage.loadSettings();
    activatePage(settings.activePage || "checkin");
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
