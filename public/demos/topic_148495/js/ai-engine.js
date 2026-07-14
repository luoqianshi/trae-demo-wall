/**
 * ai-engine.js — AI 决策引擎（v2 核心创新）
 *
 * v1 的问题：意图识别靠正则，回复靠模板，按钮靠硬编码。
 * v2 的改进：AI 读取全部上下文，自主决定回复内容、卡片类型、操作建议。
 *
 * 设计原则：
 * 1. AI 是决策者，代码是执行者
 * 2. 上下文越丰富，AI 决策越准确
 * 3. AI 失败时优雅降级，不中断用户体验
 */
var AIEngine = (function() {
  'use strict';

  // ===== 操作描述映射 =====

  var ACTION_DESC = {};
  ACTION_DESC[Config.ACTION.START_WORK] = '开始工作';
  ACTION_DESC[Config.ACTION.REST] = '休息一下';
  ACTION_DESC[Config.ACTION.CONTINUE_WORK] = '继续工作';
  ACTION_DESC[Config.ACTION.TODAY_DATA] = '查看今日数据';
  ACTION_DESC[Config.ACTION.TODAY_PLAN] = '今日规划';
  ACTION_DESC[Config.ACTION.WEEKLY_REPORT] = '查看周报';
  ACTION_DESC[Config.ACTION.HEATMAP] = '查看效率热力图';
  ACTION_DESC[Config.ACTION.CAPABILITY] = '查看能力';

  // ===== 系统提示词（AI 人格定义）=====

  function getSystemPrompt() {
    var phase = State.getPhase();
    var status = State.getStatus();

    var phaseHint = '';
    if (phase === Config.PHASE.COMPANION) {
      phaseHint = '用户处于陪伴期（第1阶段），以观察和鼓励为主，不要主动给过多建议。';
    } else if (phase === Config.PHASE.ADJUSTMENT) {
      phaseHint = '用户处于调整期（第2阶段），可以基于数据给出温和的建议，帮助用户发现规律。';
    } else {
      phaseHint = '用户处于过渡期（第3阶段），可以深度分析数据，主动提出优化方案。';
    }

    var statusHint = '';
    if (status === Config.STATUS.IDLE) {
      statusHint = '用户空闲中，可以建议开始工作或查看数据。';
    } else if (status === Config.STATUS.WORKING) {
      statusHint = '用户工作中。简短的鼓励和支持即可，不要主动建议休息。如果用户问工作相关的事，可以给出建议。';
    } else {
      statusHint = '用户正在休息中。可以陪聊、询问休息情况，帮助放松。如果用户聊到工作相关的话题（如复盘刚才的工作、规划接下来的安排），可以自然回应，但不要催促用户回去工作。';
    }

    // 注入用户记忆
    var factsSection = Memory.getUserFactsString();
    var patternsSection = Memory.getPatternsString();

    return [
      '你是轻时（LightTime），一个AI时间伙伴。你的核心使命是帮助用户建立健康的时间节奏，而不是监控或评判他们。',
      '',
      '## 核心原则',
      '- 以"休息"为锚点：用户只需在休息时点击按钮，你自动计算工作时段。',
      '- 不打卡、不评分、不惩罚：你不是效率工具，你是陪伴者。',
      '- 渐进式引导：根据用户使用阶段调整互动深度。',
      '- 温暖、简洁：回复像朋友聊天，有洞察但不啰嗦。每次回复1-3句话。',
      '- 主动但不打扰：只在用户休息时主动聊天，工作时间不打扰。',
      '- 基于数据说话：回复中引用上下文提供的真实数据，不要编造。',
      '- 个性化回应：如果了解用户的信息，自然地融入回复中，让人感觉你记得他。',
      '',
      '## 当前阶段',
      phaseHint,
      '',
      '## 当前状态',
      statusHint,
      '',
      factsSection,
      patternsSection,
      '',
      '## 回复格式（必须返回严格的JSON，不要有任何额外文本）',
      '{',
      '  "reply": "你的自然语言回复（1-3句话，基于真实数据）",',
      '  "cardType": "timeline|heatmap|report|plan|ring|capability|null",',
      '  "suggestedActions": [',
      '    {"action": "action_name", "label": "显示标签"}',
      '  ]',
      '}',
      '',
      '## 可用操作',
      '- start_work: 开始工作',
      '- rest: 休息一下',
      '- continue_work: 继续工作',
      '- today_data: 查看今日数据',
      '- today_plan: 今日规划',
      '- weekly_report: 查看周报',
      '- heatmap: 查看效率热力图',
      '- ring: 查看24小时节奏环',
      '- capability: 查看能力',
      '',
      '## 卡片类型说明',
      '- timeline: 今日时间线（用户想看今天数据时）',
      '- heatmap: 效率热力图（用户问效率分布时）',
      '- report: 周报（用户问本周总结时）',
      '- plan: AI规划建议（用户问怎么安排时）',
      '- ring: 24小时节奏环（用户想看全天节奏时）',
      '- capability: 能力展示（用户问能做什么时）',
      '- null: 不显示卡片（普通聊天时）',
      '',
      '## 重要规则',
      '1. 回复必须简洁，1-3句话，不要长篇大论。',
      '2. 根据用户操作和上下文，智能选择卡片类型和操作建议。',
      '3. 如果用户只是闲聊，cardType设为null，只回复文字。',
      '4. 如果用户要看数据但没有数据，如实告知并建议开始使用。',
      '5. 操作建议最多3个，按相关性排序。',
      '6. 不要编造数据，只基于上下文中提供的真实数据。',
      '7. 当用户点击"开始工作"时，鼓励并提示可以随时休息。',
      '8. 当用户点击"休息"时，不要催促回去工作，让用户放松。',
      '9. 当有数据时，在回复中自然地引用具体数字（如"今天已经工作了3.5小时"）',
      '10. 如果有用户记忆信息，在合适时自然地提及（如"你上次说想提高效率，今天..."）'
    ].join('\n');
  }

  // ===== 上下文构建 =====

  function buildContext() {
    var profile = State.getProfile();
    var todayEvents = LTStorage.getTodayEvents();
    var settings = State.getSettings();

    var todayStats = computeTodayStats(todayEvents);
    var weekStats = computeWeekStats();
    var sleepTime = profile.sleepTime || Config.DEFAULTS.SLEEP_TIME;
    var wakeUpTime = profile.wakeUpTime || Config.DEFAULTS.WAKE_UP_TIME;

    // 计算当前进行的时段
    var currentSegment = null;
    if (State.getStatus() === Config.STATUS.WORKING) {
      var workEvents = todayEvents.filter(function(e) { return e.type === 'work' && !e.endTime; });
      if (workEvents.length > 0) {
        var w = workEvents[0];
        currentSegment = {
          type: 'work',
          startTime: w.startTime,
          duration: w.duration || 0
        };
      }
    } else if (State.getStatus() === Config.STATUS.RESTING) {
      var restEvents = todayEvents.filter(function(e) { return e.type === 'rest' && !e.endTime; });
      if (restEvents.length > 0) {
        var r = restEvents[0];
        currentSegment = {
          type: 'rest',
          startTime: r.startTime,
          duration: r.duration || 0
        };
      }
    }

    // 今天各小时段的工作分布（用于节奏环）
    var hourlyWork = {};
    for (var h = 0; h < 24; h++) { hourlyWork[h] = 0; }
    todayEvents.forEach(function(e) {
      if (e.type === 'work') {
        for (var h = e.startHour; h <= e.endHour && h < 24; h++) {
          hourlyWork[h] = Math.min((hourlyWork[h] || 0) + 1, 4);
        }
      }
    });

    return {
      user: {
        role: profile.role || '未设置',
        goal: profile.goal || '未设置',
        painPoint: profile.painPoint || '未设置',
        hasSchedule: profile.hasSchedule ? '是' : '否',
        sleepTime: sleepTime,
        wakeUpTime: wakeUpTime,
        workDays: (settings.workDays || Config.DEFAULTS.WORK_DAYS).join(',')
      },
      today: {
        date: TimeService.today(),
        status: State.getStatus(),
        totalWorkMinutes: todayStats.totalWorkMinutes,
        totalWorkHours: Math.round(todayStats.totalWorkMinutes / 60 * 10) / 10,
        totalRestMinutes: todayStats.totalRestMinutes,
        restCount: todayStats.restCount,
        avgEfficiency: todayStats.avgEfficiency,
        workSegments: todayStats.workSegments.slice(0, 10),
        restSegments: todayStats.restSegments.slice(0, 10)
      },
      week: {
        totalWorkHours: weekStats.totalWorkHours,
        totalRestHours: weekStats.totalRestHours,
        avgDailyWorkHours: weekStats.avgDailyWorkHours,
        avgDailyRestCount: weekStats.avgDailyRestCount,
        avgEfficiency: weekStats.avgEfficiency,
        trend: weekStats.trend
      },
      phase: State.getPhase(),
      phaseName: State.getPhase() === 1 ? '陪伴期' : (State.getPhase() === 2 ? '调整期' : '过渡期'),
      demoMode: State.isDemoMode(),
      currentSegment: currentSegment,
      hourlyWork: hourlyWork
    };
  }

  function computeTodayStats(events) {
    var stats = {
      totalWorkMinutes: 0,
      totalRestMinutes: 0,
      restCount: 0,
      avgEfficiency: null,
      workSegments: [],
      restSegments: []
    };

    var efficiencies = [];

    events.forEach(function(e) {
      var duration = e.duration || 0;
      if (e.type === 'work') {
        stats.totalWorkMinutes += duration;
        stats.workSegments.push({
          start: e.startTime,
          end: e.endTime,
          duration: duration,
          efficiency: e.metadata ? e.metadata.efficiency : null
        });
        if (e.metadata && e.metadata.efficiency) {
          efficiencies.push(e.metadata.efficiency);
        }
      } else if (e.type === 'rest') {
        stats.totalRestMinutes += duration;
        stats.restCount++;
        stats.restSegments.push({
          start: e.startTime,
          end: e.endTime,
          duration: duration,
          activity: e.metadata ? e.metadata.activity : null
        });
      }
    });

    if (efficiencies.length > 0) {
      stats.avgEfficiency = Math.round(efficiencies.reduce(function(a, b) { return a + b; }, 0) / efficiencies.length * 10) / 10;
    }

    return stats;
  }

  function computeWeekStats() {
    var events = LTStorage.getWeekEvents(7);
    var days = {};
    var totalWork = 0;
    var totalRest = 0;
    var totalRestCount = 0;
    var allEfficiencies = [];
    var workDays = 0;

    events.forEach(function(e) {
      if (!days[e.date]) {
        days[e.date] = { work: 0, rest: 0, restCount: 0, efficiencies: [] };
      }
      if (e.type === 'work') {
        days[e.date].work += (e.duration || 0);
        if (e.metadata && e.metadata.efficiency) {
          days[e.date].efficiencies.push(e.metadata.efficiency);
        }
      } else if (e.type === 'rest') {
        days[e.date].rest += (e.duration || 0);
        days[e.date].restCount++;
      }
    });

    Object.keys(days).forEach(function(d) {
      totalWork += days[d].work;
      totalRest += days[d].rest;
      totalRestCount += days[d].restCount;
      allEfficiencies = allEfficiencies.concat(days[d].efficiencies);
      if (days[d].work > 0) workDays++;
    });

    var avgEff = allEfficiencies.length > 0
      ? Math.round(allEfficiencies.reduce(function(a, b) { return a + b; }, 0) / allEfficiencies.length * 10) / 10
      : null;

    var trend = 'stable';
    if (workDays > 2) {
      trend = totalWork / workDays > 480 ? 'increasing' : (totalWork / workDays < 180 ? 'decreasing' : 'stable');
    }

    return {
      totalWorkHours: Math.round(totalWork / 60 * 10) / 10,
      totalRestHours: Math.round(totalRest / 60 * 10) / 10,
      avgDailyWorkHours: workDays > 0 ? Math.round(totalWork / workDays / 60 * 10) / 10 : 0,
      avgDailyRestCount: workDays > 0 ? Math.round(totalRestCount / workDays * 10) / 10 : 0,
      avgEfficiency: avgEff,
      trend: trend
    };
  }

  // ===== 核心决策方法 =====

  function buildContextPrompt() {
    var ctx = buildContext();
    return [
      '## 当前用户上下文',
      '```json',
      JSON.stringify(ctx, null, 2),
      '```',
      '',
      '请根据以上上下文和用户的消息，返回JSON格式的回复。'
    ].join('\n');
  }

  /**
   * 处理自由文本消息
   */
  function processMessage(userMessage) {
    var systemPrompt = getSystemPrompt();
    var contextPrompt = buildContextPrompt();
    var fullUserMessage = contextPrompt + '\n\n用户消息：' + userMessage;
    var history = Memory.getConversationMessages();

    return AIService.chatWithHistoryJSON(systemPrompt, history, fullUserMessage).then(function(parsed) {
      if (parsed && parsed.reply) {
        // 记录对话
        Memory.addConversation(userMessage, parsed.reply);
        return {
          reply: parsed.reply,
          cardType: parsed.cardType || null,
          suggestedActions: parsed.suggestedActions || getDefaultActions(),
          raw: parsed
        };
      }
      return fallbackResponse(userMessage);
    });
  }

  /**
   * 处理按钮操作（v2 核心：AI 接管决策）
   * 将操作描述和完整上下文发给 AI，由 AI 决定回复内容、卡片类型、操作建议
   */
  function processAction(action, extraContext) {
    extraContext = extraContext || {};
    var desc = ACTION_DESC[action] || action;
    var systemPrompt = getSystemPrompt();
    var contextPrompt = buildContextPrompt();

    var actionPrompt = [
      '用户执行了操作：' + desc,
      '当前用户状态：' + State.getStatus(),
      '当前阶段：' + State.getPhase(),
      '',
      '请根据上下文，返回合适的回复。',
      '注意：',
      '- 如果状态是"working"且操作是"开始工作"，回复"已经在工作中了哦～"且suggestedActions应为休息/数据/能力。',
      '- 如果状态是"resting"且操作是"休息"，回复"已经在休息了哦～"且suggestedActions应为继续工作。',
      '- 如果状态是"idle"且操作是"继续工作"，回复"还没开始工作呢～"且suggestedActions应为开始工作。',
      '- 如果操作是"开始工作"/"休息"/"继续工作"，给出鼓励或陪伴的话语。',
      '- 如果操作是查看数据类（今日数据/周报/热力图/规划/节奏环），简要描述数据亮点。',
      '- 如果操作是"查看能力"，简要介绍你能做什么。',
      '- 推荐的 cardType 应该和操作类型匹配。',
      '- suggestedActions 应该是当前状态下用户最可能需要的操作，必须包含「能力」按钮。'
    ];

    if (extraContext.restEventId) {
      actionPrompt.push('当前休息事件ID：' + extraContext.restEventId);
    }

    var fullMessage = contextPrompt + '\n\n' + actionPrompt.join('\n');
    var history = Memory.getConversationMessages();

    return AIService.chatWithHistoryJSON(systemPrompt, history, fullMessage, { temperature: 0.8 }).then(function(parsed) {
      if (parsed && parsed.reply) {
        // 记录操作触发的对话
        Memory.addConversation('[' + desc + ']', parsed.reply);
        return {
          reply: parsed.reply,
          cardType: parsed.cardType || null,
          suggestedActions: parsed.suggestedActions || getDefaultActions(),
          raw: parsed
        };
      }
      return fallbackForAction(action);
    });
  }

  function fallbackResponse(userMessage) {
    return {
      reply: '好的，我收到了～',
      cardType: null,
      suggestedActions: getDefaultActions(),
      raw: null
    };
  }

  function fallbackForAction(action) {
    var status = State.getStatus();
    var actions = getDefaultActions();
    var cardType = null;
    var reply = '';

    switch (action) {
      case Config.ACTION.START_WORK:
        reply = '开始工作啦，加油！记得累了就休息～';
        break;
      case Config.ACTION.REST:
        reply = '好好休息一下吧～';
        break;
      case Config.ACTION.CONTINUE_WORK:
        reply = '好的，继续加油！';
        break;
      case Config.ACTION.TODAY_DATA:
        reply = '这是你今天的记录：';
        cardType = Config.CARD_TYPE.TIMELINE;
        break;
      case Config.ACTION.TODAY_PLAN:
        reply = '根据你的作息，这是今天的规划建议：';
        cardType = Config.CARD_TYPE.PLAN;
        break;
      case Config.ACTION.WEEKLY_REPORT:
        reply = '这是本周的总结：';
        cardType = Config.CARD_TYPE.REPORT;
        break;
      case Config.ACTION.HEATMAP:
        reply = '这是你近7天的效率分布：';
        cardType = Config.CARD_TYPE.HEATMAP;
        break;
      case Config.ACTION.CAPABILITY:
        reply = '我能帮你做这些事：';
        cardType = Config.CARD_TYPE.CAPABILITY;
        break;
      default:
        reply = '好的～';
    }

    return {
      reply: reply,
      cardType: cardType,
      suggestedActions: actions,
      raw: null
    };
  }

  function getDefaultActions() {
    var status = State.getStatus();
    if (status === Config.STATUS.IDLE) {
      return [
        { action: Config.ACTION.START_WORK, label: '💼 开始工作' },
        { action: Config.ACTION.CAPABILITY, label: '🌟 能力' }
      ];
    } else if (status === Config.STATUS.WORKING) {
      return [
        { action: Config.ACTION.REST, label: '☕ 休息' },
        { action: Config.ACTION.CAPABILITY, label: '🌟 能力' }
      ];
    } else {
      return [
        { action: Config.ACTION.CONTINUE_WORK, label: '💼 继续工作' },
        { action: Config.ACTION.CAPABILITY, label: '🌟 能力' }
      ];
    }
  }

  /**
   * AI 驱动的按钮建议（v2.1 核心：AI 主导按钮决策）
   * 将当前上下文发给 AI，让其决定最合适的操作按钮
   * AI 失败时降级为 hardcoded getDefaultActions()
   */
  function getSuggestedActions() {
    var status = State.getStatus();
    var contextPrompt = buildContextPrompt();
    var factsSection = Memory.getUserFactsString();
    var patternsSection = Memory.getPatternsString();

    var prompt = [
      contextPrompt,
      factsSection,
      patternsSection,
      '',
      '用户当前状态：' + status,
      '当前时间：' + TimeService.formatTime(TimeService.now()),
      '',
      '请根据以上所有信息，返回 3 个最合适的操作按钮建议。',
      '第一个按钮必须是最核心的操作（开始工作/休息/继续工作），',
      '其余两个按钮根据用户当前可能的需求排序。',
      '必须包含「能力」按钮吗？是的，第三个按钮始终是「🌟 能力」。',
      '',
      '返回 JSON 格式：',
      '{"actions": [{"action": "xxx", "label": "xxx"}, ...]}'
    ].join('\n');

    return AIService.simpleChat(prompt, { maxTokens: 200, temperature: 0.7 }).then(function(reply) {
      if (!reply) return getDefaultActions();
      try {
        var match = reply.match(/\{[\s\S]*\}/);
        if (match) {
          var data = JSON.parse(match[0]);
          if (data.actions && Array.isArray(data.actions) && data.actions.length > 0) {
            // 确保有「能力」按钮
            var hasCap = data.actions.some(function(a) { return a.action === 'capability'; });
            if (!hasCap) {
              data.actions.push({ action: 'capability', label: '🌟 能力' });
            }
            return data.actions.slice(0, 3);
          }
        }
      } catch (e) {
        // 解析失败，降级
      }
      return getDefaultActions();
    }).catch(function() {
      return getDefaultActions();
    });
  }

  // ===== 初识对话 =====

  function getOnboardingQuestion(step) {
    var questions = [
      {
        text: '你好呀～我是轻时，你的 AI 时间伙伴。先问一下，你现在主要是？',
        options: ['学生', '工作中', '自由职业']
      },
      {
        text: '那你近期有什么小目标吗？',
        options: ['提高学习效率', '工作更有条理', '想早睡早起', '只是想试试']
      },
      {
        text: '你觉得自己时间管理最大的困扰是什么？',
        options: ['总是拖延', '容易走神', '作息不规律', '太忙了没时间']
      },
      {
        text: '你平时有比较明确的时间计划吗？',
        options: ['有，我会做详细规划', '有大致的安排', '完全随缘']
      },
      {
        text: '好的～那你通常几点睡、几点起呀？',
        options: ['23点前睡 / 7点前起', '23-24点睡 / 7-8点起', '0点后睡 / 8点后起']
      },
      {
        text: '最后一个问题：你的工作日是周几呀？',
        options: ['周一到周五', '不固定', '每天都差不多']
      }
    ];
    return step < questions.length ? questions[step] : null;
  }

  function processOnboardingAnswer(step, answer) {
    var profile = State.getProfile();
    switch (step) {
      case 0:
        State.updateProfile({ role: answer });
        break;
      case 1:
        State.updateProfile({ goal: answer });
        break;
      case 2:
        State.updateProfile({ painPoint: answer });
        break;
      case 3:
        State.updateProfile({ hasSchedule: answer !== '完全随缘' });
        break;
      case 4:
        var sleepTime = '23:00', wakeUpTime = '07:00';
        if (answer.includes('23点前')) { sleepTime = '22:30'; wakeUpTime = '06:30'; }
        else if (answer.includes('23-24点')) { sleepTime = '23:30'; wakeUpTime = '07:30'; }
        else if (answer.includes('0点后')) { sleepTime = '00:30'; wakeUpTime = '08:30'; }
        State.updateScheduleBaseline({ sleepTime: sleepTime, wakeUpTime: wakeUpTime });
        break;
      case 5:
        var workDays = [1, 2, 3, 4, 5];
        if (answer.includes('不固定')) workDays = [1, 2, 3, 4, 5, 6];
        else if (answer.includes('每天都差不多')) workDays = [0, 1, 2, 3, 4, 5, 6];
        State.setWorkDays(workDays);
        break;
    }
  }

  function getOnboardingSummary() {
    var profile = State.getProfile();
    var prompt = [
      '用户刚完成初识问卷：',
      '身份：' + (profile.role || '未填写'),
      '目标：' + (profile.goal || '未填写'),
      '困扰：' + (profile.painPoint || '未填写'),
      '。',
      '请用2-3句话总结并欢迎用户，告诉用户只需要休息时点按钮记录，不用打卡评分。'
    ].join('');

    return AIService.simpleChat(prompt, { maxTokens: 200, temperature: 0.8 }).then(function(reply) {
      if (reply) return reply;
      return '好啦，认识你很高兴～我不催你打卡，也不给你打分。\n\n想休息的时候点一下「☕ 休息」，我们随便聊聊，我会自动帮你记录这段时间。\n\n慢慢地，你会在「📊 今日数据」里看到时间都去哪儿了，在「📝 周报」里发现自己的节奏规律。现在就开始吧～';
    });
  }

  // ===== 休息对话 =====

  function getRestQuestion(step) {
    var questions = [
      {
        text: '刚刚在忙什么呀？',
        options: ['工作/学习', '摸鱼/刷手机', '开会/沟通', '其他']
      },
      {
        text: '那你觉得刚才的效率怎么样？',
        options: ['5分 — 非常高效', '4分 — 还不错', '3分 — 一般般', '2分 — 有点走神', '1分 — 完全没效率']
      }
    ];
    return step < questions.length ? questions[step] : null;
  }

  function processRestAnswer(step, answer) {
    // 查找最近刚完成的工作段（type === 'work'），而非休息事件
    // 用户回答的是"刚刚做了什么工作"，内容应存入 work 事件的 metadata
    var events = LTStorage.getEvents();
    var workEvent = null;
    for (var i = events.length - 1; i >= 0; i--) {
      if (events[i].type === 'work' && events[i].date === TimeService.today()) {
        workEvent = events[i];
        break;
      }
    }
    if (!workEvent) return;

    if (!workEvent.metadata) workEvent.metadata = {};

    if (step === 0) {
      workEvent.metadata.activity = answer;
    } else if (step === 1) {
      var scoreMatch = answer.match(/(\d)分/);
      if (scoreMatch) {
        workEvent.metadata.efficiency = parseInt(scoreMatch[1]);
      }
    }
    LTStorage.saveEvents(events);
    LTStorage.remove(LTStorage.KEYS.AI_PLAN);
  }

  function getRestEnding() {
    return AIService.simpleChat('用户刚刚结束了一次休息，现在要回去工作了。请给用户一句温暖的结束语（1句话，不超过20字）。', { maxTokens: 100, temperature: 0.9 }).then(function(reply) {
      if (reply) return reply;
      var endings = ['好的，继续加油吧～', '休息好了，继续冲！', '去吧，我在这儿等你～'];
      return endings[Math.floor(Math.random() * endings.length)];
    });
  }

  // ===== 早晨问候 =====

  function getMorningGreeting() {
    var profile = State.getProfile();
    var prompt = '现在是早晨。用户作息：' + (profile.sleepTime || '未知') + '睡觉，' + (profile.wakeUpTime || '未知') + '起床。' +
      '请用1-2句话问候用户，可以问一下昨晚睡得怎么样，但不要催促用户开始工作。';

    return AIService.simpleChat(prompt, { maxTokens: 150, temperature: 0.8 }).then(function(reply) {
      if (reply) return reply;
      return '早上好～昨晚睡得怎么样？';
    });
  }

  // ===== 公开 API =====
  return {
    buildContext: buildContext,
    buildContextPrompt: buildContextPrompt,
    processMessage: processMessage,
    processAction: processAction,
    getDefaultActions: getDefaultActions,
    getSuggestedActions: getSuggestedActions,
    getOnboardingQuestion: getOnboardingQuestion,
    processOnboardingAnswer: processOnboardingAnswer,
    getOnboardingSummary: getOnboardingSummary,
    getRestQuestion: getRestQuestion,
    processRestAnswer: processRestAnswer,
    getRestEnding: getRestEnding,
    getMorningGreeting: getMorningGreeting
  };
})();