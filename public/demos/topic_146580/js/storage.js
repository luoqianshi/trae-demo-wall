/* ============================================================
   看见 · 本地存储服务
   - localStorage 封装 + 内存兜底
   - 所有操作 try/catch，绝不白屏
   - 挂到 window.StorageService
   ============================================================ */

(function () {
  // 内存兜底（localStorage 不可用时使用）
  var memoryStore = {
    records: [],
    settings: {},
  };

  // 检测 localStorage 是否可用
  var lsAvailable = (function () {
    try {
      var k = "__kanjian_test__";
      localStorage.setItem(k, "1");
      localStorage.removeItem(k);
      return true;
    } catch (e) {
      console.warn("[Storage] localStorage 不可用，降级为内存存储", e);
      return false;
    }
  })();

  var KEYS = window.Config.storageKeys;

  // ============ 内部工具 ============
  function readJSON(key, fallback) {
    if (!lsAvailable) return fallback;
    try {
      var raw = localStorage.getItem(key);
      if (raw === null || raw === undefined) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      console.warn("[Storage] 读取失败 " + key, e);
      return fallback;
    }
  }

  function writeJSON(key, value) {
    if (!lsAvailable) return false;
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn("[Storage] 写入失败 " + key, e);
      return false;
    }
  }

  function todayStr() {
    var d = new Date();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + m + "-" + day;
  }

  function genId() {
    return "r_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
  }

  // ============ 记录操作 ============

  // 获取全部记录（按日期升序）
  function getAllRecords() {
    if (!lsAvailable) return memoryStore.records.slice();
    var records = readJSON(KEYS.records, []);
    if (!Array.isArray(records)) return [];
    return records;
  }

  // 获取某天记录
  function getRecordByDate(dateStr) {
    var records = getAllRecords();
    for (var i = 0; i < records.length; i++) {
      if (records[i].date === dateStr) return records[i];
    }
    return null;
  }

  // 获取今天的记录
  function getTodayRecord() {
    return getRecordByDate(todayStr());
  }

  // 保存/更新某天记录（同一天去重覆盖）
  function saveRecord(question, answer) {
    var records = getAllRecords();
    var date = todayStr();
    var now = Date.now();
    var existing = null;
    var existingIdx = -1;

    for (var i = 0; i < records.length; i++) {
      if (records[i].date === date) {
        existing = records[i];
        existingIdx = i;
        break;
      }
    }

    if (existing) {
      // 覆盖当天
      existing.question = question;
      existing.answer = answer;
      existing.updatedAt = now;
      // 回答内容变化，清空旧的 AI 回应，需重新生成
      existing.aiReply = "";
      existing.aiReplyAt = null;
      existing.aiReplyStatus = "idle";
      existing.aiReplyError = "";
      records[existingIdx] = existing;
    } else {
      // 新增
      records.push({
        id: genId(),
        date: date,
        question: question,
        answer: answer,
        createdAt: now,
        updatedAt: now,
        aiReply: "",
        aiReplyAt: null,
        aiReplyStatus: "idle",
        aiReplyError: "",
      });
    }

    // 按日期升序排序
    records.sort(function (a, b) {
      return a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
    });

    if (!lsAvailable) {
      memoryStore.records = records;
      return getRecordByDate(date);
    }
    writeJSON(KEYS.records, records);
    return getRecordByDate(date);
  }

  // 删除某条记录（按 id）
  function deleteRecord(id) {
    var records = getAllRecords();
    var filtered = records.filter(function (r) { return r.id !== id; });
    if (!lsAvailable) {
      memoryStore.records = filtered;
      return true;
    }
    return writeJSON(KEYS.records, filtered);
  }

  // 记录数量
  function getRecordCount() {
    return getAllRecords().length;
  }

  // 更新某天记录的 AI 回应
  // replyData: { aiReply, aiReplyAt, aiReplyStatus, aiReplyError }
  function updateRecordAIReply(dateStr, replyData) {
    var records = getAllRecords();
    var updated = false;
    for (var i = 0; i < records.length; i++) {
      if (records[i].date === dateStr) {
        if (replyData.aiReply !== undefined) records[i].aiReply = replyData.aiReply;
        if (replyData.aiReplyAt !== undefined) records[i].aiReplyAt = replyData.aiReplyAt;
        if (replyData.aiReplyStatus !== undefined) records[i].aiReplyStatus = replyData.aiReplyStatus;
        if (replyData.aiReplyError !== undefined) records[i].aiReplyError = replyData.aiReplyError;
        records[i].updatedAt = Date.now();
        updated = true;
        break;
      }
    }
    if (!updated) return false;
    if (!lsAvailable) {
      memoryStore.records = records;
      return true;
    }
    return writeJSON(KEYS.records, records);
  }

  // ============ 设置操作 ============

  function getSettings() {
    if (!lsAvailable) return Object.assign({}, memoryStore.settings);
    var s = readJSON(KEYS.settings, {});
    if (!s || typeof s !== "object") return {};
    return s;
  }

  function saveSettings(partial) {
    var current = getSettings();
    var merged = Object.assign({}, current, partial);
    if (!lsAvailable) {
      memoryStore.settings = merged;
      return merged;
    }
    writeJSON(KEYS.settings, merged);
    return merged;
  }

  // ============ 当天 AI 问题缓存 ============
  // 结构：{ date: "2026-06-24", text: "...", dimension: "..." }
  // 过期规则：date 不等于今天则视为过期，返回 null

  function getTodayAIQuestion() {
    var data = readJSON(KEYS.aiQuestion, null);
    if (!data || data.date !== todayStr()) return null;
    return data;
  }

  function saveTodayAIQuestion(text, dimension) {
    var data = {
      date: todayStr(),
      text: text,
      dimension: dimension || "",
    };
    if (!lsAvailable) return data;
    writeJSON(KEYS.aiQuestion, data);
    return data;
  }

  // ============ 导出 / 导入 ============

  // 获取导出安全的设置（排除 apiKey，避免泄露）
  function getExportSafeSettings() {
    var settings = getSettings();
    return {
      nickname: settings.nickname || "",
      vendor: settings.vendor || "",
      aiMode: settings.aiMode || "local"
    };
  }

  // 导出全部数据为 JSON 对象（不含 apiKey）
  function exportData() {
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      records: getAllRecords(),
      settings: getExportSafeSettings(),
    };
  }

  // 导出并触发下载
  function exportAndDownload() {
    var data = exportData();
    var json = JSON.stringify(data, null, 2);
    var blob = new Blob([json], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    var dateStr = todayStr();
    a.download = "kanjian-backup-" + dateStr + ".json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  // 导入 JSON（字符串），返回 { ok, error, data }
  function importData(jsonStr) {
    if (!jsonStr || typeof jsonStr !== "string") {
      return { ok: false, error: "数据为空" };
    }
    var data;
    try {
      data = JSON.parse(jsonStr);
    } catch (e) {
      return { ok: false, error: "JSON 格式错误，无法解析" };
    }
    if (!data || typeof data !== "object") {
      return { ok: false, error: "数据结构不正确" };
    }
    // 校验 records
    var records = Array.isArray(data.records) ? data.records : [];
    var validRecords = [];
    for (var i = 0; i < records.length; i++) {
      var r = records[i];
      if (r && r.date && r.question !== undefined && r.answer !== undefined) {
        if (!r.id) r.id = genId();
        if (!r.createdAt) r.createdAt = Date.now();
        if (!r.updatedAt) r.updatedAt = r.createdAt;
        validRecords.push(r);
      }
    }
    // 按日期升序
    validRecords.sort(function (a, b) {
      return a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
    });
    // 校验 settings
    var importedSettings = (data.settings && typeof data.settings === "object") ? data.settings : {};

    // 白名单导入：只允许 nickname / vendor / aiMode，禁止 apiKey
    // 同时保留当前本地已有的 apiKey（不被覆盖、不被清空）
    var currentSettings = getSettings();
    var finalSettings = Object.assign({}, currentSettings, {
      nickname: importedSettings.nickname || currentSettings.nickname || "",
      vendor: importedSettings.vendor || currentSettings.vendor || "doubao",
      aiMode: importedSettings.aiMode || currentSettings.aiMode || "local",
      apiKey: currentSettings.apiKey || ""  // 永远保留当前本地 Key，导入文件的 Key 被忽略
    });

    if (!lsAvailable) {
      memoryStore.records = validRecords;
      memoryStore.settings = finalSettings;
      return { ok: true, error: null, data: { records: validRecords.length, settings: Object.keys(finalSettings).length } };
    }
    writeJSON(KEYS.records, validRecords);
    writeJSON(KEYS.settings, finalSettings);
    return { ok: true, error: null, data: { records: validRecords.length, settings: Object.keys(finalSettings).length } };
  }

  // 清除全部数据
  function clearAll() {
    if (!lsAvailable) {
      memoryStore.records = [];
      memoryStore.settings = {};
      return true;
    }
    try {
      localStorage.removeItem(KEYS.records);
      localStorage.removeItem(KEYS.settings);
      return true;
    } catch (e) {
      console.warn("[Storage] 清除失败", e);
      return false;
    }
  }

  // ============ 暴露 API ============
  window.StorageService = {
    isLocalStorageAvailable: lsAvailable,
    // 记录
    getAllRecords: getAllRecords,
    getRecordByDate: getRecordByDate,
    getTodayRecord: getTodayRecord,
    saveRecord: saveRecord,
    deleteRecord: deleteRecord,
    getRecordCount: getRecordCount,
    updateRecordAIReply: updateRecordAIReply,
    // 设置
    getSettings: getSettings,
    saveSettings: saveSettings,
    // 导入导出
    exportData: exportData,
    exportAndDownload: exportAndDownload,
    importData: importData,
    // 清除
    clearAll: clearAll,
    // 当天 AI 问题缓存
    getTodayAIQuestion: getTodayAIQuestion,
    saveTodayAIQuestion: saveTodayAIQuestion,
    // 工具
    todayStr: todayStr,
  };
})();
