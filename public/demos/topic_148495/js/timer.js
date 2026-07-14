/**
 * timer.js — 计时器逻辑
 * 核心："以休息为锚点"的时间记录模型
 * 用户只需报告休息开始/结束，工作时段自动计算
 */
var Timer = (function() {
  'use strict';

  var _lastWorkStart = null;
  var _currentRestStart = null;
  var _intervalId = null;

  // ===== 开始工作 =====

  function startWork() {
    if (State.getStatus() === Config.STATUS.WORKING) return;

    var now = TimeService.now();
    var timeStr = TimeService.formatTime(now);
    var dateStr = TimeService.today();

    _lastWorkStart = now;

    // 记录 work_start 事件
    LTStorage.addEvent({
      type: 'work_start',
      date: dateStr,
      startTime: timeStr,
      timestamp: now
    });

    State.setStatus(Config.STATUS.WORKING);
    updateStatusBadge();
  }

  // ===== 开始休息 =====

  function startRest() {
    if (State.getStatus() === Config.STATUS.RESTING) return;

    var now = TimeService.now();
    var timeStr = TimeService.formatTime(now);
    var dateStr = TimeService.today();

    // 如果有进行中的工作，计算工作时段
    if (_lastWorkStart && State.getStatus() === Config.STATUS.WORKING) {
      var workMinutes = TimeService.durationMinutes(_lastWorkStart, now);
      LTStorage.addEvent({
        type: 'work',
        date: dateStr,
        startTime: TimeService.formatTime(_lastWorkStart),
        endTime: timeStr,
        startHour: new Date(_lastWorkStart).getHours(),
        endHour: new Date(now).getHours(),
        duration: workMinutes,
        metadata: {}
      });
    }

    // 记录休息开始
    _currentRestStart = now;
    var restEvent = LTStorage.addEvent({
      type: 'rest_start',
      date: dateStr,
      startTime: timeStr,
      timestamp: now
    });

    State.setStatus(Config.STATUS.RESTING);
    State.setCurrentRestEventId(restEvent.id);
    State.setRestConversationActive(true);
    State.setRestConversationStep(0);

    updateStatusBadge();

    return restEvent;
  }

  // ===== 继续工作（结束休息）=====

  function continueWork() {
    if (State.getStatus() !== Config.STATUS.RESTING) return;

    var now = TimeService.now();
    var timeStr = TimeService.formatTime(now);
    var dateStr = TimeService.today();

    // 更新休息事件
    if (_currentRestStart) {
      var restMinutes = TimeService.durationMinutes(_currentRestStart, now);
      var eventId = State.getCurrentRestEventId();

      LTStorage.updateEvent(eventId, {
        type: 'rest',
        endTime: timeStr,
        startHour: new Date(_currentRestStart).getHours(),
        endHour: new Date(now).getHours(),
        duration: restMinutes
      });
    }

    // 开始新的工作时段
    _lastWorkStart = now;
    LTStorage.addEvent({
      type: 'work_start',
      date: dateStr,
      startTime: timeStr,
      timestamp: now
    });

    State.setStatus(Config.STATUS.WORKING);
    State.setRestConversationActive(false);
    State.setRestConversationStep(0);
    _currentRestStart = null;

    updateStatusBadge();
  }

  // ===== 状态显示 =====

  function updateStatusBadge() {
    var badge = document.getElementById('status-badge');
    if (!badge) return;

    var status = State.getStatus();
    var statusMap = {
      'idle': { text: '待机中', cls: 'status-idle' },
      'working': { text: '工作中', cls: 'status-working' },
      'resting': { text: '休息中', cls: 'status-resting' }
    };

    var info = statusMap[status] || statusMap['idle'];
    badge.textContent = info.text;
    badge.className = 'status-badge ' + info.cls;
  }

  // ===== 重置 =====

  function reset() {
    _lastWorkStart = null;
    _currentRestStart = null;
    if (_intervalId) {
      clearInterval(_intervalId);
      _intervalId = null;
    }
    updateStatusBadge();
  }

  // ===== 公开 API =====
  return {
    startWork: startWork,
    startRest: startRest,
    continueWork: continueWork,
    updateStatusBadge: updateStatusBadge,
    reset: reset,
    getLastWorkStart: function() { return _lastWorkStart; },
    getCurrentRestStart: function() { return _currentRestStart; }
  };
})();