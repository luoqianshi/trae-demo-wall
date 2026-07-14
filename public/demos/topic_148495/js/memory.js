/**
 * memory.js — AI 记忆系统（v2.1 核心升级）
 *
 * 三层记忆：
 * 1. 对话历史（短期）— 最近 10 轮对话，随 API 调用携带
 * 2. 用户事实（长期）— AI 从对话中提取的关键信息，持久化存储
 * 3. 行为模式（数据驱动）— 从事件数据计算出的用户规律
 */
var Memory = (function() {
  'use strict';

  var _conversationHistory = [];  // [{role: 'user'|'assistant', content: '...'}, ...]
  var _userFacts = [];            // ["用户是学生", "用户偏好短休息", ...]
  var _maxHistoryRounds = 10;
  var _storageKey = 'lt_memory';

  // ===== 持久化 =====

  function load() {
    try {
      var raw = localStorage.getItem(_storageKey);
      if (raw) {
        var data = JSON.parse(raw);
        _userFacts = data.facts || [];
      }
    } catch (e) {
      console.warn('[Memory] 加载失败:', e);
    }
  }

  function save() {
    try {
      localStorage.setItem(_storageKey, JSON.stringify({ facts: _userFacts }));
    } catch (e) {
      console.warn('[Memory] 保存失败:', e);
    }
  }

  // ===== 对话历史 =====

  function addConversation(userMsg, aiMsg) {
    _conversationHistory.push({ role: 'user', content: userMsg });
    _conversationHistory.push({ role: 'assistant', content: aiMsg });

    // 裁剪到最近 N 轮（每轮 2 条）
    var maxMessages = _maxHistoryRounds * 2;
    while (_conversationHistory.length > maxMessages) {
      _conversationHistory.shift();
    }

    // 异步提取事实（不阻塞主流程）
    setTimeout(function() {
      _extractFacts(userMsg, aiMsg);
    }, 500);
  }

  function getConversationMessages() {
    return _conversationHistory.slice();
  }

  // ===== 用户事实 =====

  function _extractFacts(userMsg, aiMsg) {
    // 只在用户消息有意义时提取
    if (!userMsg || userMsg.length < 5) return;

    var prompt = [
      '从以下对话中提取关于用户的关键事实（偏好、习惯、目标、困扰、状态等）。',
      '如果对话中没有新信息，返回空数组。',
      '只返回 JSON 数组，不要其他文字。',
      '',
      '用户：' + userMsg,
      'AI：' + aiMsg,
      '',
      '返回格式：["事实1", "事实2", ...]'
    ].join('\n');

    AIService.simpleChat(prompt, { maxTokens: 200, temperature: 0.3 }).then(function(reply) {
      if (!reply) return;
      try {
        var match = reply.match(/\[[\s\S]*\]/);
        if (match) {
          var facts = JSON.parse(match[0]);
          if (Array.isArray(facts) && facts.length > 0) {
            facts.forEach(function(f) {
              if (f && _userFacts.indexOf(f) === -1) {
                _userFacts.push(f);
              }
            });
            // 最多保留 20 条事实
            if (_userFacts.length > 20) {
              _userFacts = _userFacts.slice(-20);
            }
            save();
          }
        }
      } catch (e) {
        // 解析失败，静默忽略
      }
    });
  }

  function getUserFacts() {
    return _userFacts.slice();
  }

  function getUserFactsString() {
    if (_userFacts.length === 0) return '';
    return '## 你对用户的了解\n' + _userFacts.map(function(f, i) {
      return (i + 1) + '. ' + f;
    }).join('\n') + '\n';
  }

  // ===== 行为模式 =====

  function computePatterns() {
    var events = LTStorage.getEvents();
    if (events.length < 5) return null;

    var patterns = {};

    // 1. 最常休息的时间段
    var restHours = {};
    events.forEach(function(e) {
      if (e.type === 'rest' && e.startHour !== undefined) {
        var hour = e.startHour;
        restHours[hour] = (restHours[hour] || 0) + 1;
      }
    });
    var sortedRestHours = Object.keys(restHours).sort(function(a, b) {
      return restHours[b] - restHours[a];
    });
    patterns.topRestHours = sortedRestHours.slice(0, 3).map(Number);

    // 2. 平均工作段时长
    var workDurations = [];
    events.forEach(function(e) {
      if (e.type === 'work' && e.duration) {
        workDurations.push(e.duration);
      }
    });
    if (workDurations.length > 0) {
      patterns.avgWorkMinutes = Math.round(
        workDurations.reduce(function(a, b) { return a + b; }, 0) / workDurations.length
      );
    }

    // 3. 平均休息时长
    var restDurations = [];
    events.forEach(function(e) {
      if (e.type === 'rest' && e.duration) {
        restDurations.push(e.duration);
      }
    });
    if (restDurations.length > 0) {
      patterns.avgRestMinutes = Math.round(
        restDurations.reduce(function(a, b) { return a + b; }, 0) / restDurations.length
      );
    }

    // 4. 高峰效率时段
    var hourEfficiencies = {};
    var hourCounts = {};
    events.forEach(function(e) {
      if (e.type === 'work' && e.metadata && e.metadata.efficiency) {
        for (var h = e.startHour; h <= e.endHour && h < 24; h++) {
          hourEfficiencies[h] = (hourEfficiencies[h] || 0) + e.metadata.efficiency;
          hourCounts[h] = (hourCounts[h] || 0) + 1;
        }
      }
    });
    var avgHourEff = {};
    Object.keys(hourEfficiencies).forEach(function(h) {
      avgHourEff[h] = Math.round(hourEfficiencies[h] / hourCounts[h] * 10) / 10;
    });
    var sortedHours = Object.keys(avgHourEff).sort(function(a, b) {
      return avgHourEff[b] - avgHourEff[a];
    });
    patterns.peakHours = sortedHours.slice(0, 3).map(Number);

    // 5. 每日平均工作段数
    var dateWorkCounts = {};
    events.forEach(function(e) {
      if (e.type === 'work') {
        dateWorkCounts[e.date] = (dateWorkCounts[e.date] || 0) + 1;
      }
    });
    var dates = Object.keys(dateWorkCounts);
    if (dates.length > 0) {
      patterns.avgDailyWorkSegments = Math.round(
        Object.values(dateWorkCounts).reduce(function(a, b) { return a + b; }, 0) / dates.length * 10
      ) / 10;
    }

    return patterns;
  }

  function getPatternsString() {
    var p = computePatterns();
    if (!p) return '';

    var lines = ['## 用户行为模式（基于历史数据）'];
    if (p.topRestHours && p.topRestHours.length > 0) {
      lines.push('- 最常休息的时间段：' + p.topRestHours.map(function(h) { return h + ':00'; }).join('、'));
    }
    if (p.avgWorkMinutes) {
      lines.push('- 平均工作段时长：' + p.avgWorkMinutes + ' 分钟');
    }
    if (p.avgRestMinutes) {
      lines.push('- 平均休息时长：' + p.avgRestMinutes + ' 分钟');
    }
    if (p.peakHours && p.peakHours.length > 0) {
      lines.push('- 效率最高的时段：' + p.peakHours.map(function(h) { return h + ':00'; }).join('、'));
    }
    if (p.avgDailyWorkSegments) {
      lines.push('- 日均工作段数：' + p.avgDailyWorkSegments);
    }
    lines.push('');
    return lines.join('\n');
  }

  // ===== 清理 =====

  function clear() {
    _conversationHistory = [];
    _userFacts = [];
    localStorage.removeItem(_storageKey);
  }

  // ===== 初始化 =====

  load();

  // ===== 公开 API =====
  return {
    addConversation: addConversation,
    getConversationMessages: getConversationMessages,
    getUserFacts: getUserFacts,
    getUserFactsString: getUserFactsString,
    computePatterns: computePatterns,
    getPatternsString: getPatternsString,
    clear: clear,
    load: load,
    save: save
  };
})();