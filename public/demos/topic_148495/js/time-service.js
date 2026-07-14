/**
 * time-service.js — 统一时间服务
 * 所有时间相关操作必须通过此服务，确保时间加速与模拟时间一致
 */
var TimeService = (function() {
  'use strict';

  var _acceleration = 1;     // 时间加速倍数（1 = 正常）
  var _simulatedOffset = 0;  // 模拟偏移量（毫秒）

  // ===== 核心时间源 =====

  function now() {
    var real = Date.now();
    if (_acceleration === 1 && _simulatedOffset === 0) {
      return real;
    }
    var elapsed = (real - _baseTime) * _acceleration;
    return _baseTime + elapsed + _simulatedOffset;
  }

  var _baseTime = Date.now();

  function setAcceleration(factor) {
    _baseTime = Date.now();
    _simulatedOffset = 0;
    _acceleration = Math.max(0.1, Math.min(60, factor));
  }

  function getAcceleration() {
    return _acceleration;
  }

  function resetTime() {
    _baseTime = Date.now();
    _simulatedOffset = 0;
    _acceleration = 1;
  }

  // ===== 日期工具 =====

  function today() {
    return formatDate(now());
  }

  function formatDate(timestamp) {
    var d = new Date(timestamp);
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  function formatTime(timestamp) {
    var d = new Date(timestamp);
    var h = String(d.getHours()).padStart(2, '0');
    var m = String(d.getMinutes()).padStart(2, '0');
    return h + ':' + m;
  }

  function formatDateTime(timestamp) {
    return formatDate(timestamp) + ' ' + formatTime(timestamp);
  }

  function daysAgo(n) {
    var d = new Date(now());
    d.setDate(d.getDate() - n);
    return formatDate(d.getTime());
  }

  function dayOfWeek(timestamp) {
    return new Date(timestamp || now()).getDay();
  }

  function dayName(timestamp) {
    var names = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return names[dayOfWeek(timestamp)];
  }

  // ===== 时间计算 =====

  function durationMinutes(startMs, endMs) {
    var diff = endMs - startMs;
    if (diff <= 0) return 0;
    // Bug #6 修复：使用 Math.ceil 确保短时间也记录为至少 1 分钟
    return Math.max(1, Math.ceil(diff / 60000));
  }

  function durationString(minutes) {
    if (minutes < 60) {
      return minutes + '分钟';
    }
    var h = Math.floor(minutes / 60);
    var m = minutes % 60;
    return m > 0 ? h + '小时' + m + '分钟' : h + '小时';
  }

  function parseTimeString(timeStr) {
    var parts = timeStr.split(':');
    return { hours: parseInt(parts[0]), minutes: parseInt(parts[1]) || 0 };
  }

  // ===== 公开 API =====
  return {
    now: now,
    setAcceleration: setAcceleration,
    getAcceleration: getAcceleration,
    resetTime: resetTime,
    today: today,
    formatDate: formatDate,
    formatTime: formatTime,
    formatDateTime: formatDateTime,
    daysAgo: daysAgo,
    dayOfWeek: dayOfWeek,
    dayName: dayName,
    durationMinutes: durationMinutes,
    durationString: durationString,
    parseTimeString: parseTimeString
  };
})();