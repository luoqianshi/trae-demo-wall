  // ========== STATE ==========
  let currentTab = 'home';
  let currentScreen = 'wake';
  let isNavigating = false;
  let isNavPaused = false;
  let speechRate = 1.0;
  let isLastMile = false;
  let cameraOpen = false;
  let isOffTrack = false;
  let offTrackDirection = '';
  let isRouteOffTrack = false;
  let rerouteCount = 0;
  let selectedMode = 'walk';
  let selectedTransportType = 'walk';
  let selectedDestination = '星巴克咖啡';
  let navProgress = 0;
  let navInterval = null;
  let lmStepIndex = 0;
  let lastSpeech = '';
  let selectedRouteIndex = 0;
  let selectedTransitIndex = 0;
  let cameraInterval = null;
  let lastDangerAlert = 0;
  const DANGER_COOLDOWN = 15000;

  // ========== 全局错误处理 ==========
  let errorCount = 0;
  const MAX_ERRORS_BEFORE_SILENCE = 10;
  let lastErrorTime = 0;

  function handleGlobalError(msg, url, line, col, error) {
    errorCount++;
    const now = Date.now();
    const errorMsg = '[瞳伴错误] ' + (msg || '未知错误') + ' (行:' + line + ', 列:' + col + ')';
    
    if (errorCount <= MAX_ERRORS_BEFORE_SILENCE) {
      console.error(errorMsg, error || '');
    }
    if (errorCount === MAX_ERRORS_BEFORE_SILENCE && now - lastErrorTime < 60000) {
      console.warn('[瞳伴] 1分钟内错误超过' + MAX_ERRORS_BEFORE_SILENCE + '次，已静默后续错误日志');
    }
    lastErrorTime = now;
    return true;
  }

  function handleUnhandledRejection(event) {
    console.error('[瞳伴未捕获Promise]', event.reason || event);
    if (event.preventDefault) event.preventDefault();
    return true;
  }

  if (typeof window !== 'undefined') {
    window.onerror = handleGlobalError;
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
  }

  function safeCall(fn, context) {
    try {
      return fn.apply(context || null, Array.prototype.slice.call(arguments, 2));
    } catch (e) {
      console.error('[safeCall错误]', e.message, e.stack);
      return null;
    }
  }

  function $(id) {
    var el = document.getElementById(id);
    return el || null;
  }

  function setText(id, text) {
    var el = $(id);
    if (el) el.textContent = text;
    return el;
  }

  function addClass(id, className) {
    var el = $(id);
    if (el) el.classList.add(className);
    return el;
  }

  function removeClass(id, className) {
    var el = $(id);
    if (el) el.classList.remove(className);
    return el;
  }

  function setStyle(id, prop, value) {
    var el = $(id);
    if (el && el.style) el.style[prop] = value;
    return el;
  }

  // ========== 定时器管理系统 ==========
  const _timers = {
    intervals: new Map(),
    timeouts: new Map(),
    listeners: new Map()
  };
  let _timerIdCounter = 0;

  function safeSetInterval(fn, delay, id) {
    var timerId = id || ('interval_' + (++_timerIdCounter));
    try {
      var nativeId = setInterval(function() {
        try {
          fn();
        } catch (e) {
          console.error('[定时器错误] ' + timerId, e.message);
        }
      }, delay);
      _timers.intervals.set(timerId, nativeId);
      return timerId;
    } catch (e) {
      console.error('[创建定时器失败] ' + timerId, e.message);
      return null;
    }
  }

  function safeClearInterval(timerId) {
    if (!timerId) return;
    var nativeId = _timers.intervals.get(timerId);
    if (nativeId) {
      clearInterval(nativeId);
      _timers.intervals.delete(timerId);
    }
  }

  function safeSetTimeout(fn, delay, id) {
    var timerId = id || ('timeout_' + (++_timerIdCounter));
    try {
      var nativeId = setTimeout(function() {
        try {
          fn();
        } catch (e) {
          console.error('[延时器错误] ' + timerId, e.message);
        } finally {
          _timers.timeouts.delete(timerId);
        }
      }, delay);
      _timers.timeouts.set(timerId, nativeId);
      return timerId;
    } catch (e) {
      console.error('[创建延时器失败] ' + timerId, e.message);
      return null;
    }
  }

  function safeClearTimeout(timerId) {
    if (!timerId) return;
    var nativeId = _timers.timeouts.get(timerId);
    if (nativeId) {
      clearTimeout(nativeId);
      _timers.timeouts.delete(timerId);
    }
  }

  function safeAddEventListener(target, event, handler, options) {
    var listenerId = 'listener_' + (++_timerIdCounter);
    try {
      var wrappedHandler = function(e) {
        try {
          handler(e);
        } catch (err) {
          console.error('[事件监听错误] ' + event + ': ' + err.message);
        }
      };
      target.addEventListener(event, wrappedHandler, options || false);
      _timers.listeners.set(listenerId, { target: target, event: event, handler: wrappedHandler, options: options });
      return listenerId;
    } catch (e) {
      console.error('[添加事件监听失败] ' + event, e.message);
      return null;
    }
  }

  function safeRemoveEventListener(listenerId) {
    if (!listenerId) return;
    var info = _timers.listeners.get(listenerId);
    if (info) {
      info.target.removeEventListener(info.event, info.handler, info.options);
      _timers.listeners.delete(listenerId);
    }
  }

  function cleanupAllTimers() {
    _timers.intervals.forEach(function(id) { clearInterval(id); });
    _timers.intervals.clear();
    _timers.timeouts.forEach(function(id) { clearTimeout(id); });
    _timers.timeouts.clear();
    _timers.listeners.forEach(function(info) {
      info.target.removeEventListener(info.event, info.handler, info.options);
    });
    _timers.listeners.clear();
    console.log('[瞳伴] 已清理所有定时器和事件监听');
  }

  // ========== 防抖与节流工具 ==========
  function debounce(fn, wait, immediate) {
    var timeoutId = null;
    return function() {
      var context = this;
      var args = arguments;
      var later = function() {
        timeoutId = null;
        if (!immediate) fn.apply(context, args);
      };
      var callNow = immediate && !timeoutId;
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(later, wait);
      if (callNow) fn.apply(context, args);
    };
  }

  function throttle(fn, limit) {
    var inThrottle = false;
    var lastArgs = null;
    var lastContext = null;
    return function() {
      var context = this;
      var args = arguments;
      if (!inThrottle) {
        fn.apply(context, args);
        inThrottle = true;
        setTimeout(function() {
          inThrottle = false;
          if (lastArgs) {
            fn.apply(lastContext, lastArgs);
            lastArgs = null;
            lastContext = null;
          }
        }, limit);
      } else {
        lastArgs = args;
        lastContext = context;
      }
    };
  }

  // ========== 语音播报优化 - 去重与防抖 ==========
  let lastSpeakText = '';
  let lastSpeakTime = 0;
  const SPEAK_DEDUP_INTERVAL = 500;

  function isDuplicateSpeech(text, priority) {
    var now = Date.now();
    if (text === lastSpeakText && now - lastSpeakTime < SPEAK_DEDUP_INTERVAL) {
      return true;
    }
    return false;
  }

  function updateSpeakDedup(text) {
    lastSpeakText = text;
    lastSpeakTime = Date.now();
  }

  const modes = {
    walk: { icon: '🚶', name: '步行模式', hint: '盲道导航+避障' },
    transit: { icon: '🚇', name: '公共交通', hint: '公交/地铁/BRT' },
    taxi: { icon: '🚕', name: '网约车模式', hint: '找车+车牌识别' },
    indoor: { icon: '🏢', name: '室内模式', hint: '商场/医院导航' }
  };

  const transportModeNames = {
    walk: { icon: '🚶', name: '步行模式' },
    bus: { icon: '🚌', name: '公交模式' },
    metro: { icon: '🚇', name: '地铁模式' },
    brt: { icon: '🚈', name: 'BRT模式' },
    tram: { icon: '🚃', name: '有轨电车' },
    taxi: { icon: '🚕', name: '网约车模式' },
    indoor: { icon: '🏢', name: '室内模式' }
  };

  const routeData = {
    walk: [
      { time: '15分钟', distance: '1.0公里', steps: ['🚶', '↪️', '🚶'], info: '红绿灯少 · 人行道宽' },
      { time: '18分钟', distance: '1.2公里', steps: ['🚶', '⬆️', '↩️', '🚶'], info: '有电梯 · 避开施工' }
    ],
    transit: [
      { time: '20分钟', distance: '5.0公里', steps: ['🚶', '🚇', '🚶'], info: '1号线 · 2站 · 地铁优先', transportType: 'metro' },
      { time: '25分钟', distance: '3.5公里', steps: ['🚶', '🚌', '🚶'], info: '302路 · 5站 · 公交直达', transportType: 'bus' },
      { time: '22分钟', distance: '4.5公里', steps: ['🚶', '🚈', '🚶'], info: 'B1路 · 专用道 · BRT快速', transportType: 'brt' },
      { time: '28分钟', distance: '5.5公里', steps: ['🚶', '🚃', '🚶'], info: '有轨电车1号线 · 观光', transportType: 'tram' }
    ],
    taxi: [
      { time: '10分钟', distance: '2.5公里', steps: ['🚕'], info: '预估15元 · 最快到达' }
    ],
    indoor: [
      { time: '8分钟', distance: '约300米', steps: ['🚪', '🛗', '🚶', '🏪'], info: '室内导航 · AI辅助' }
    ]
  };

  const guidanceSteps = [
    { icon: '🚶', text: '沿当前道路直行200米', sub: '保持在盲道上行走', dist: '1000米', pct: 15 },
    { icon: '↪️', text: '前方50米右转', sub: '请注意右侧来车', dist: '850米', pct: 30 },
    { icon: '⚠️', text: '注意，前方有台阶', sub: '请小心脚下，共3级台阶', dist: '700米', pct: 45 },
    { icon: '🚶', text: '继续直行300米', sub: '盲道清晰，无障碍', dist: '400米', pct: 65 },
    { icon: '↩️', text: '前方30米左转', sub: '左转后进入商场区域', dist: '200米', pct: 80 },
    { icon: '📍', text: '已到达目的地附近', sub: '正在进入最后一公里模式', dist: '50米', pct: 95 }
  ];

  const taxiGuidanceSteps = [
    { icon: '🚕', text: '司机正在赶来', sub: '距离您1.2公里，预计3分钟到达', dist: '司机距您1.2公里', pct: 10 },
    { icon: '🚕', text: '司机还有2分钟到达', sub: '请在路边安全位置等候', dist: '司机距您800米', pct: 25 },
    { icon: '🚕', text: '司机即将到达', sub: '车牌号京A·12345，白色轿车，请留意', dist: '司机距您200米', pct: 40 },
    { icon: '✅', text: '司机已到达，请上车', sub: '车辆停在您右前方10米处', dist: '已到达上车点', pct: 50 },
    { icon: '🚗', text: '车辆行驶中', sub: '前往目的地，剩余2.5公里', dist: '剩余2.5公里', pct: 65 },
    { icon: '🚗', text: '即将到达目的地', sub: '前方路口右转即到，请准备下车', dist: '剩余500米', pct: 85 },
    { icon: '📍', text: '已到达目的地附近', sub: '请带好随身物品，准备下车', dist: '已到达', pct: 95 }
  ];

  const busGuidanceSteps = [
    { icon: '🚶', text: '前往公交站', sub: '前方200米人民广场站，请走人行道', dist: '距公交站200米', pct: 8 },
    { icon: '🚏', text: '到达人民广场站', sub: '302路公交站，开往火车站方向', dist: '已到车站', pct: 15 },
    { icon: '⏳', text: '等待公交车', sub: '下一班302路还有3分钟，车牌号冀A12345', dist: '等待中', pct: 22 },
    { icon: '🚌', text: '公交车即将进站', sub: '302路公交车正在靠近，请注意安全', dist: '车辆进站', pct: 30 },
    { icon: '🚌', text: '车辆已到站，请上车', sub: '前门上车，主动刷卡或投币2元', dist: '已到站', pct: 35 },
    { icon: '🚌', text: '车辆行驶中，下一站：文化宫', sub: '请坐稳扶好，注意安全', dist: '下一站：文化宫', pct: 45 },
    { icon: '🚌', text: '前方到站：火车站', sub: '请准备下车，下车请注意后方来车', dist: '下一站：火车站', pct: 70 },
    { icon: '🚪', text: '已到站，请下车', sub: '后门下车，请注意脚下台阶', dist: '已到站', pct: 80 },
    { icon: '🚶', text: '步行前往目的地', sub: '出站后直行300米即到', dist: '剩余300米', pct: 90 },
    { icon: '📍', text: '已到达目的地附近', sub: '正在进入最后一公里模式', dist: '50米', pct: 95 }
  ];

  const metroGuidanceSteps = [
    { icon: '🚶', text: '前往地铁站入口', sub: '前方100米1号线人民广场站A口', dist: '距地铁站100米', pct: 5 },
    { icon: '🚇', text: '到达地铁站入口', sub: '1号线入口在您左前方，无障碍电梯在右侧', dist: '已到入口', pct: 10 },
    { icon: '🎫', text: '刷卡进站', sub: '闸机在入口前方10米，请靠右排队', dist: '进站中', pct: 15 },
    { icon: '⬆️', text: '前往站台', sub: '乘无障碍电梯向下2层，到达1号线站台', dist: '站台层', pct: 20 },
    { icon: '🚉', text: '到达站台', sub: '1号线开往火车站方向，站台在您左侧', dist: '已到站台', pct: 25 },
    { icon: '⏳', text: '等待列车', sub: '下一班列车还有2分钟，请站在安全黄线内', dist: '等待中', pct: 30 },
    { icon: '🚄', text: '列车进站', sub: '列车正在进站，请先下后上，注意站台与列车间隙', dist: '列车进站', pct: 35 },
    { icon: '🚄', text: '上车后往车厢中部走', sub: '前2节车厢人较少，有老弱病残专座', dist: '已上车', pct: 40 },
    { icon: '🚄', text: '列车行驶中', sub: '下一站文化宫站，预计3分钟到达', dist: '行程中', pct: 55 },
    { icon: '🚄', text: '即将到站：文化宫', sub: '请提前走到车门位置，准备下车', dist: '即将到站', pct: 70 },
    { icon: '🚪', text: '已到站，请下车', sub: '下车后向前走到换乘通道', dist: '已下车', pct: 75 },
    { icon: '🔄', text: '步行换乘2号线', sub: '向前走150米，换乘通道在您右侧', dist: '换乘中', pct: 80 },
    { icon: '🚉', text: '到达2号线站台', sub: '2号线开往火车站方向，请等待列车', dist: '2号线站台', pct: 85 },
    { icon: '🚄', text: '乘坐2号线前往终点站', sub: '还有2站到达，预计5分钟', dist: '行程中', pct: 90 },
    { icon: '📍', text: '已到达目的地附近', sub: '火车站站B口出站，请注意台阶', dist: '已到达', pct: 95 }
  ];

  const brtGuidanceSteps = [
    { icon: '🚶', text: '前往BRT站台', sub: '前方150米BRT人民广场站', dist: '距站台150米', pct: 8 },
    { icon: '🚈', text: '到达BRT站台', sub: '站台在道路中央隔离带，请走斑马线', dist: '已到站台', pct: 15 },
    { icon: '🎫', text: '刷卡进站', sub: '闸机在站台入口，投币2元或刷卡', dist: '进站中', pct: 20 },
    { icon: '🚈', text: '等待BRT车辆', sub: '下一班B1路还有4分钟，站内有屏蔽门', dist: '等待中', pct: 28 },
    { icon: '🚈', text: 'BRT车辆进站', sub: '车辆正在靠站，请站在屏蔽门黄线外', dist: '车辆进站', pct: 35 },
    { icon: '🚈', text: '屏蔽门和车门已打开', sub: '请安全上车，中间门上，前门上或下车', dist: '已开门', pct: 40 },
    { icon: '🚈', text: 'BRT行驶中', sub: '专用道畅通，下一站文化宫站', dist: '行程中', pct: 60 },
    { icon: '🚈', text: '即将到站：火车站', sub: '请准备下车，站台有语音和震动提醒', dist: '即将到站', pct: 80 },
    { icon: '🚪', text: '已到站，请下车', sub: '后门下车，注意站台与车辆间隙', dist: '已到站', pct: 85 },
    { icon: '🚶', text: '步行前往目的地', sub: '出站后左转直行200米', dist: '剩余200米', pct: 92 },
    { icon: '📍', text: '已到达目的地附近', sub: '正在进入最后一公里模式', dist: '已到达', pct: 95 }
  ];

  const tramGuidanceSteps = [
    { icon: '🚶', text: '前往有轨电车站', sub: '前方80米有轨电车人民广场站', dist: '距车站80米', pct: 8 },
    { icon: '🚃', text: '到达有轨电车站', sub: '站台在道路中央，请走地面斑马线', dist: '已到车站', pct: 15 },
    { icon: '🎫', text: '等待有轨电车', sub: '下一班有轨电车1号线还有3分钟', dist: '等待中', pct: 22 },
    { icon: '🚃', text: '有轨电车进站', sub: '车辆正在进站，有轨电车较长约30米', dist: '车辆进站', pct: 30 },
    { icon: '🚃', text: '有轨电车已停稳', sub: '请从前门上车，刷卡或投币2元', dist: '已停稳', pct: 35 },
    { icon: '🚃', text: '有轨电车行驶中', sub: '地面轨道运行中，下一站文化宫站', dist: '行程中', pct: 55 },
    { icon: '🚃', text: '前方到站：火车站', sub: '有轨电车站台较短，注意车门位置', dist: '即将到站', pct: 75 },
    { icon: '🚪', text: '已到站，请下车', sub: '后门下车，注意与站台间隙', dist: '已到站', pct: 80 },
    { icon: '🚶', text: '步行前往目的地', sub: '出站后直行150米即到', dist: '剩余150米', pct: 90 },
    { icon: '📍', text: '已到达目的地附近', sub: '正在进入最后一公里模式', dist: '已到达', pct: 95 }
  ];

  const mallGuidanceSteps = [
    { icon: '🏬', text: '前往商场入口', sub: '前方50米万达广场1号门', dist: '距入口50米', pct: 8 },
    { icon: '🚪', text: '到达商场入口', sub: '1号门在您正前方，自动门感应开启', dist: '已到入口', pct: 15 },
    { icon: '🛗', text: '寻找电梯', sub: '入口右转30米有直梯，可到各楼层', dist: '距电梯30米', pct: 28 },
    { icon: '🛗', text: '到达电梯口', sub: '直梯在您左侧，按上行按钮', dist: '已到电梯', pct: 38 },
    { icon: '🛗', text: '乘电梯上楼', sub: '前往3楼，电梯内有盲文按钮', dist: '电梯运行中', pct: 50 },
    { icon: '🚶', text: '寻找目标店铺', sub: '出电梯左转，沿通道前行20米', dist: '距店铺20米', pct: 70 },
    { icon: '🏪', text: '到达店铺附近', sub: '目标店铺在您右侧，门已打开', dist: '已到店铺', pct: 88 },
    { icon: '📍', text: '已到达目的地', sub: '欢迎光临，祝您购物愉快', dist: '已到达', pct: 95 }
  ];

  const hospitalGuidanceSteps = [
    { icon: '🏥', text: '前往医院入口', sub: '前方60米人民医院门诊楼入口', dist: '距入口60米', pct: 8 },
    { icon: '🚪', text: '到达医院入口', sub: '门诊大门在您正前方，请推门进入', dist: '已到入口', pct: 15 },
    { icon: '💁', text: '前往导诊台', sub: '进门直行20米，大厅中央是导诊台', dist: '距导诊台20米', pct: 25 },
    { icon: '🛗', text: '前往电梯', sub: '导诊台右转15米有直梯，可到各诊室', dist: '距电梯15米', pct: 38 },
    { icon: '🛗', text: '乘电梯上楼', sub: '前往5楼，电梯内有盲文按钮和语音报层', dist: '电梯运行中', pct: 52 },
    { icon: '🚶', text: '寻找诊室', sub: '出电梯右转，沿通道前行30米', dist: '距诊室30米', pct: 72 },
    { icon: '🚪', text: '到达诊室门口', sub: '508诊室在您左侧，请推门进入', dist: '已到诊室', pct: 88 },
    { icon: '📍', text: '已到达目的地', sub: '请在诊室外等候叫号', dist: '已到达', pct: 95 }
  ];

  const officeBuildingGuidanceSteps = [
    { icon: '🏢', text: '前往办公楼入口', sub: '前方50米国贸大厦A座入口', dist: '距入口50米', pct: 8 },
    { icon: '🚪', text: '到达办公楼入口', sub: '大堂入口在您正前方，自动门感应开启', dist: '已到入口', pct: 15 },
    { icon: '💼', text: '前往前台登记', sub: '进门左手边是前台，可咨询访客登记', dist: '距前台10米', pct: 25 },
    { icon: '🛗', text: '前往电梯厅', sub: '前台右转20米，有8部客梯和2部货梯', dist: '距电梯20米', pct: 38 },
    { icon: '🛗', text: '乘电梯上楼', sub: '前往18楼，电梯内有盲文按钮和语音报层', dist: '电梯运行中', pct: 52 },
    { icon: '🚶', text: '寻找目标公司', sub: '出电梯左转，沿走廊前行25米', dist: '距公司25米', pct: 72 },
    { icon: '🚪', text: '到达公司门口', sub: '1806室在您右侧，请按门铃', dist: '已到公司', pct: 88 },
    { icon: '📍', text: '已到达目的地', sub: '祝您工作顺利', dist: '已到达', pct: 95 }
  ];

  const schoolGuidanceSteps = [
    { icon: '🏫', text: '前往学校校门', sub: '前方80米第一中学正门', dist: '距校门80米', pct: 8 },
    { icon: '🚪', text: '到达学校入口', sub: '校门在您正前方，请注意来往学生', dist: '已到入口', pct: 15 },
    { icon: '🚶', text: '前往教学楼', sub: '进门直行60米，主教学楼在正前方', dist: '距教学楼60米', pct: 30 },
    { icon: '🚪', text: '到达教学楼入口', sub: '教学楼大门在您正前方，请推门进入', dist: '已到教学楼', pct: 42 },
    { icon: '🛗', text: '寻找楼梯/电梯', sub: '教学楼入口右侧有楼梯和电梯', dist: '距楼梯10米', pct: 52 },
    { icon: '🚶', text: '前往目标教室', sub: '上3楼右转，沿走廊前行15米', dist: '距教室15米', pct: 72 },
    { icon: '🚪', text: '到达教室门口', sub: '初三二班在您左侧，请轻轻推门进入', dist: '已到教室', pct: 88 },
    { icon: '📍', text: '已到达目的地', sub: '祝您学习愉快', dist: '已到达', pct: 95 }
  ];

  const airportGuidanceSteps = [
    { icon: '✈️', text: '前往机场航站楼', sub: '前方100米T2航站楼3号入口', dist: '距入口100米', pct: 8 },
    { icon: '🚪', text: '到达航站楼入口', sub: '3号门在您正前方，自动门感应开启', dist: '已到入口', pct: 15 },
    { icon: '🧳', text: '前往值机柜台', sub: '进门直行30米，B区是国内航班值机区', dist: '距值机区30米', pct: 28 },
    { icon: '🪪', text: '到达值机柜台', sub: 'B12号柜台在您右侧，请出示身份证', dist: '已到值机区', pct: 40 },
    { icon: '🛂', text: '前往安检口', sub: '值机后右转50米，是国内出发安检口', dist: '距安检50米', pct: 55 },
    { icon: '🚶', text: '前往登机口', sub: '安检后左转，步行到28号登机口约300米', dist: '距登机口300米', pct: 75 },
    { icon: '🛋️', text: '到达登机口附近', sub: '28号登机口在您左侧，请在附近休息等候', dist: '已到登机口', pct: 90 },
    { icon: '📍', text: '已到达目的地', sub: '请留意登机时间，祝您旅途愉快', dist: '已到达', pct: 95 }
  ];

  const libraryGuidanceSteps = [
    { icon: '📚', text: '前往图书馆入口', sub: '前方40米市图书馆正门', dist: '距入口40米', pct: 8 },
    { icon: '🚪', text: '到达图书馆入口', sub: '正门在您正前方，请推门进入', dist: '已到入口', pct: 15 },
    { icon: '💁', text: '前往服务台', sub: '进门左侧是总服务台，可办证和咨询', dist: '距服务台10米', pct: 25 },
    { icon: '🛗', text: '前往电梯/楼梯', sub: '服务台右侧有楼梯和电梯', dist: '距电梯15米', pct: 38 },
    { icon: '🛗', text: '乘电梯上楼', sub: '前往3楼文学借阅区，电梯有语音报层', dist: '电梯运行中', pct: 52 },
    { icon: '🚶', text: '寻找目标书架', sub: '出电梯左转，文学区在通道左侧', dist: '距书架20米', pct: 72 },
    { icon: '📖', text: '到达目标区域', sub: '中国文学区在您左侧，可开始找书', dist: '已到文学区', pct: 88 },
    { icon: '📍', text: '已到达目的地', sub: '请保持安静，阅读愉快', dist: '已到达', pct: 95 }
  ];

  const supermarketGuidanceSteps = [
    { icon: '🛒', text: '前往超市入口', sub: '前方30米大润发超市入口', dist: '距入口30米', pct: 8 },
    { icon: '🚪', text: '到达超市入口', sub: '入口在您正前方，是自动感应门', dist: '已到入口', pct: 15 },
    { icon: '🛒', text: '寻找购物车', sub: '入口右侧有购物车和购物篮', dist: '距购物车5米', pct: 22 },
    { icon: '🚶', text: '前往生鲜区', sub: '进门左转是生鲜蔬果区，在超市北侧', dist: '距生鲜区20米', pct: 38 },
    { icon: '🥬', text: '到达生鲜区', sub: '蔬菜区在您左侧，水果区在前方', dist: '已到生鲜区', pct: 52 },
    { icon: '🚶', text: '前往食品区', sub: '沿通道前行，食品零食区在超市中部', dist: '距食品区40米', pct: 70 },
    { icon: '🧃', text: '到达食品区', sub: '零食饮料区在您右侧，可选择商品', dist: '已到食品区', pct: 85 },
    { icon: '📍', text: '已到达目标区域', sub: '收银台在出口处，祝您购物愉快', dist: '已到达', pct: 95 }
  ];

  const restaurantGuidanceSteps = [
    { icon: '🍜', text: '前往餐厅入口', sub: '前方20米海底捞火锅店入口', dist: '距入口20米', pct: 8 },
    { icon: '🚪', text: '到达餐厅入口', sub: '餐厅大门在您正前方，门已打开', dist: '已到入口', pct: 15 },
    { icon: '👋', text: '前往迎宾台', sub: '进门左侧是迎宾台，有服务员接待', dist: '距迎宾台5米', pct: 25 },
    { icon: '🚶', text: '前往就餐区', sub: '跟随服务员前往座位，在大厅中部', dist: '距座位15米', pct: 42 },
    { icon: '🪑', text: '到达座位附近', sub: '您的座位在右侧，4人桌，椅子在桌下', dist: '已到座位', pct: 58 },
    { icon: '🍽️', text: '就座后点单', sub: '桌上有点单二维码，服务员会递菜单', dist: '准备点单', pct: 75 },
    { icon: '🚻', text: '卫生间位置', sub: '卫生间在餐厅右后方，出门右转10米', dist: '距卫生间20米', pct: 88 },
    { icon: '📍', text: '已到达目的地', sub: '祝您用餐愉快', dist: '已到达', pct: 95 }
  ];

  const museumGuidanceSteps = [
    { icon: '🏛️', text: '前往博物馆入口', sub: '前方60米省博物馆南门入口', dist: '距入口60米', pct: 8 },
    { icon: '🚪', text: '到达博物馆入口', sub: '南门在您正前方，有安检通道', dist: '已到入口', pct: 15 },
    { icon: '🎫', text: '前往安检/票务', sub: '进门后先安检，左侧是票务中心', dist: '距安检10米', pct: 25 },
    { icon: '💁', text: '到达服务台', sub: '安检后正前方是服务台，可租讲解器', dist: '已到服务台', pct: 38 },
    { icon: '🚶', text: '前往展厅', sub: '服务台右转是一楼展厅，古代文物展区', dist: '距展厅30米', pct: 55 },
    { icon: '🖼️', text: '到达展厅入口', sub: '一号展厅在您左侧，请保持安静', dist: '已到展厅', pct: 72 },
    { icon: '🚶', text: '参观游览', sub: '展厅内有盲文解说和语音导览', dist: '参观中', pct: 88 },
    { icon: '📍', text: '已到达目的地', sub: '祝您参观愉快', dist: '已到达', pct: 95 }
  ];

  // ========== 危险预警数据 ==========
  const dangerScenes = {
    critical: [
      { text: '注意！左前方有电动车快速驶来，请立即停步！', direction: '左前方', urgency: 'critical', action: '请立即停步，等待车辆通过' },
      { text: '警告！右后方有外卖骑手超速驶过，请靠边躲避！', direction: '右后方', urgency: 'critical', action: '请靠边停步，等骑手通过' },
      { text: '危险！前方有车辆突然开门，请减速绕行！', direction: '前方', urgency: 'critical', action: '请减速，从另一侧绕行' },
      { text: '紧急！左侧有自行车逆行冲来，请停步等待！', direction: '左侧', urgency: 'critical', action: '请原地停步，等待自行车通过' }
    ],
    high: [
      { text: '注意！前方有奔跑的行人，请小心避让', direction: '前方', urgency: 'high', action: '请放慢脚步，让行人先过' },
      { text: '警告！右前方有儿童突然冲出，请做好准备', direction: '右前方', urgency: 'high', action: '请停步，确认安全后再前进' },
      { text: '前方有电动车从人行道驶入，请靠左行走', direction: '前方', urgency: 'high', action: '请靠左，电动车从右侧通过' },
      { text: '检测到后方有车辆鸣笛，请靠边站立', direction: '后方', urgency: 'high', action: '请靠边站立，让车辆先过' }
    ],
    medium: [
      { text: '前方道路施工，请减速慢行', direction: '前方', urgency: 'medium', action: '请减速，注意绕行' },
      { text: '左侧有积水，请靠右行走', direction: '左侧', urgency: 'medium', action: '请靠右绕行' },
      { text: '前方有低矮障碍物，请抬脚通过', direction: '前方', urgency: 'medium', action: '请抬脚跨过' },
      { text: '地面湿滑，请小心行走', direction: '脚下', urgency: 'medium', action: '请放慢脚步' }
    ],
    low: [
      { text: '前方斑马线，请注意红绿灯', direction: '前方', urgency: 'low', action: '请遵守交通信号' },
      { text: '右侧有台阶，请小心脚下', direction: '右侧', urgency: 'low', action: '请注意台阶高度' },
      { text: '前方盲道中断，请保持方向', direction: '前方', urgency: 'low', action: '请保持当前方向直行' }
    ]
  };

  // ========== AI场景数据 ==========
  const aiScenesByMode = {
    environment: [
      { text: '前方3米处有一位行人正在行走，距离安全', tags: [{ text: '行人', type: '' }, { text: '距离3米', type: '' }, { text: '安全', type: '' }] },
      { text: '正前方有台阶向上，共5级，请注意抬脚', tags: [{ text: '⚠️ 台阶', type: 'warning' }, { text: '5级向上', type: 'warning' }, { text: '小心抬脚', type: '' }] },
      { text: '右侧有一根电线杆，请靠左行走', tags: [{ text: '电线杆', type: 'warning' }, { text: '右侧', type: '' }, { text: '靠左走', type: '' }] },
      { text: '前方路面有积水，请小心绕行', tags: [{ text: '⚠️ 积水', type: 'warning' }, { text: '路面湿滑', type: 'warning' }, { text: '请绕行', type: '' }] },
      { text: '左前方有一辆共享单车停放，请靠右避让', tags: [{ text: '共享单车', type: 'warning' }, { text: '左前方', type: '' }, { text: '靠右走', type: '' }] },
      { text: '前方是开阔的人行道，无障碍物，可以正常行走', tags: [{ text: '无障碍', type: '' }, { text: '人行道', type: '' }, { text: '安全通行', type: '' }] },
      { text: '检测到前方有长椅，距离约5米，可坐下休息', tags: [{ text: '长椅', type: '' }, { text: '距离5米', type: '' }, { text: '可休息', type: '' }] },
      { text: '注意！正前方有低矮障碍物，请抬脚跨过', tags: [{ text: '⚠️ 障碍物', type: 'danger' }, { text: '低矮', type: 'warning' }, { text: '请抬脚', type: '' }] },
      { text: '右侧检测到盲人专用坡道，可以通行', tags: [{ text: '无障碍坡道', type: '' }, { text: '右侧', type: '' }, { text: '可通行', type: '' }] },
      { text: '前方有一群人聚集，请减速慢行', tags: [{ text: '人群', type: 'warning' }, { text: '前方', type: '' }, { text: '请减速', type: 'warning' }] }
    ],
    walkNav: [
      { text: '前方路况良好，盲道清晰，可以安全通行', tags: [{ text: '盲道正常', type: '' }, { text: '无障碍', type: '' }, { text: '光线充足', type: '' }] },
      { text: '检测到右侧有施工围挡，请向左调整方向', tags: [{ text: '施工围挡', type: 'warning' }, { text: '左侧通行', type: '' }, { text: '减速', type: 'warning' }] },
      { text: '检测到红绿灯，当前绿灯，斑马线清晰', tags: [{ text: '绿灯', type: '' }, { text: '斑马线', type: '' }, { text: '安全通过', type: '' }] },
      { text: '注意！左前方有电动车快速靠近，请停步', tags: [{ text: '⚠️ 危险', type: 'danger' }, { text: '电动车', type: 'danger' }, { text: '请停步', type: 'danger' }] },
      { text: '前方有台阶向下，共3级，请小心', tags: [{ text: '⚠️ 台阶', type: 'warning' }, { text: '3级向下', type: 'warning' }, { text: '缓慢通过', type: '' }] },
      { text: '右前方有外卖骑手快速驶过，请靠左侧避让', tags: [{ text: '⚠️ 外卖车', type: 'warning' }, { text: '右侧', type: '' }, { text: '靠左走', type: '' }] },
      { text: '前方人行道被共享单车占用，请从右侧绕行', tags: [{ text: '共享单车', type: 'warning' }, { text: '占道', type: 'warning' }, { text: '右侧绕行', type: '' }] },
      { text: '注意！前方路边有车辆开门，请减速', tags: [{ text: '⚠️ 开门杀', type: 'danger' }, { text: '前方', type: '' }, { text: '请减速', type: 'warning' }] },
      { text: '前方路面有坑洼，请放慢脚步', tags: [{ text: '⚠️ 坑洼', type: 'warning' }, { text: '路面不平', type: 'warning' }, { text: '小心', type: '' }] },
      { text: '检测到前方有摊贩占道经营，请从左侧绕行', tags: [{ text: '占道经营', type: 'warning' }, { text: '前方', type: '' }, { text: '左侧绕行', type: '' }] }
    ],
    taxiFinding: [
      { text: '右前方10米处检测到白色轿车，车牌号京A·12345，正在闪烁双闪，这是您叫的车', tags: [{ text: '找到车辆', type: '' }, { text: '白色轿车', type: '' }, { text: '双闪亮', type: '' }] },
      { text: '车辆停在右前方路边，距离您约8米，副驾驶车门已解锁', tags: [{ text: '车辆位置', type: '' }, { text: '右前方8米', type: '' }, { text: '车门解锁', type: '' }] },
      { text: '确认是您预约的车辆，大众朗逸，白色，车牌号京A·12345，司机在驾驶位', tags: [{ text: '车辆确认', type: '' }, { text: '大众朗逸', type: '' }, { text: '车牌匹配', type: '' }] },
      { text: '车辆右前门（副驾驶门）门把手在您前方右侧，高度约1米，横向拉动式门把手', tags: [{ text: '门把手', type: '' }, { text: '右前门', type: '' }, { text: '横向拉动', type: '' }] },
      { text: '注意区分车门把手和车窗开关：车门把手较宽，横向长约15厘米，在车门中间偏前位置', tags: [{ text: '车门把手', type: '' }, { text: '外侧拉动', type: '' }, { text: '注意区分', type: 'warning' }] },
      { text: '右前门是向外拉开式车门，门把手在车门外侧，握住后向车尾方向拉动即可开门', tags: [{ text: '开门方式', type: '' }, { text: '向外拉开', type: '' }, { text: '向车尾拉', type: '' }] },
      { text: '车门已打开，右前门开度约60度，请小心上车，注意头顶车门框', tags: [{ text: '门已打开', type: '' }, { text: '右前门', type: '' }, { text: '注意头顶', type: 'warning' }] },
      { text: '车辆双闪灯持续闪烁，确认是接您的车辆，请向车辆方向前进', tags: [{ text: '双闪确认', type: '' }, { text: '车辆正确', type: '' }, { text: '请前进', type: '' }] },
      { text: '司机已降下副驾驶车窗向您招手，请确认后再上车', tags: [{ text: '司机确认', type: '' }, { text: '降窗招手', type: '' }, { text: '请确认', type: '' }] },
      { text: '车辆距离您还有5米，请停在原地等候，注意安全', tags: [{ text: '车辆靠近', type: '' }, { text: '距离5米', type: '' }, { text: '请等候', type: '' }] }
    ],
    taxiDriving: [
      { text: '车辆行驶中，当前车速约40公里每小时，路况平稳', tags: [{ text: '行驶中', type: '' }, { text: '车速40', type: '' }, { text: '平稳', type: '' }] },
      { text: '前方路口红灯，车辆正在减速，请坐稳扶好', tags: [{ text: '红灯', type: 'warning' }, { text: '减速', type: '' }, { text: '请扶好', type: '' }] },
      { text: '车辆即将右转，请抓好扶手', tags: [{ text: '右转', type: 'warning' }, { text: '请扶好', type: '' }, { text: '注意安全', type: '' }] },
      { text: '距离目的地还有2公里，预计5分钟到达', tags: [{ text: '剩余2公里', type: '' }, { text: '5分钟', type: '' }, { text: '行程中', type: '' }] },
      { text: '前方道路施工，可能稍有颠簸，请坐稳', tags: [{ text: '施工路段', type: 'warning' }, { text: '可能颠簸', type: '' }, { text: '请坐稳', type: '' }] },
      { text: '即将到达目的地，司机正在靠边停车', tags: [{ text: '即将到达', type: '' }, { text: '靠边停车', type: '' }, { text: '请准备', type: '' }] }
    ],
    busWaiting: [
      { text: '前方同时来了2辆公交车，第1辆是302路，第2辆是108路，请确认您要乘坐的302路', tags: [{ text: '2辆车同时到站', type: 'warning' }, { text: '第1辆是302路', type: '' }, { text: '请确认', type: 'warning' }] },
      { text: '确认：前方第1辆是302路公交车，开往火车站方向，车牌号冀A12345，是您要乘坐的车', tags: [{ text: '✅ 确认车辆', type: '' }, { text: '302路', type: '' }, { text: '车牌匹配', type: '' }] },
      { text: '302路公交车前门在车辆前部右侧，距离您约3米，车门正在打开', tags: [{ text: '前门位置', type: '' }, { text: '右前方3米', type: '' }, { text: '开门中', type: '' }] },
      { text: '注意！后方还有一辆108路公交车正在进站，请不要向后退，站在原地等候', tags: [{ text: '⚠️ 后方来车', type: 'danger' }, { text: '108路', type: '' }, { text: '请勿后退', type: 'danger' }] },
      { text: '302路公交车已停稳，前门完全打开，可以上车了', tags: [{ text: '已停稳', type: '' }, { text: '门已开', type: '' }, { text: '请上车', type: '' }] },
      { text: '前方公交站有302路公交车正在进站，距离约50米，请准备乘车', tags: [{ text: '302路', type: '' }, { text: '进站中', type: '' }, { text: '距离50米', type: '' }] },
      { text: '公交车已靠站，前门在您右前方3米处，请向前走到车门位置', tags: [{ text: '已靠站', type: '' }, { text: '前门在前', type: '' }, { text: '距离3米', type: '' }] },
      { text: '确认是302路公交车，开往火车站方向，车牌冀A12345', tags: [{ text: '302路', type: '' }, { text: '开往火车站', type: '' }, { text: '车牌确认', type: '' }] },
      { text: '公交车前门在车辆前部，车门正在打开，是向内折叠式车门', tags: [{ text: '前门', type: '' }, { text: '折叠门', type: '' }, { text: '正在打开', type: '' }] },
      { text: '下一班302路还有2分钟到达，当前站台上有5人等候', tags: [{ text: '下班车2分钟', type: '' }, { text: '5人等候', type: '' }, { text: '请稍等', type: '' }] },
      { text: '公交车正在缓慢靠站，请注意安全，站在站台黄线以外', tags: [{ text: '⚠️ 车辆进站', type: 'danger' }, { text: '请后退', type: 'danger' }, { text: '注意安全', type: 'danger' }] },
      { text: '公交站牌在您右手边1米处，上面有302路线路信息', tags: [{ text: '站牌', type: '' }, { text: '右侧1米', type: '' }, { text: '302路', type: '' }] },
      { text: '公交站台地面有黄色盲道砖，直通公交车门位置', tags: [{ text: '盲道', type: '' }, { text: '通向车门', type: '' }, { text: '可跟随', type: '' }] }
    ],
    busBoarding: [
      { text: '前车门已完全打开，车门宽度约1米，有1级台阶，高约20厘米', tags: [{ text: '门已打开', type: '' }, { text: '1级台阶', type: 'warning' }, { text: '高20厘米', type: 'warning' }] },
      { text: '上车台阶在您正前方，共1级，请抬脚上车，注意脚下', tags: [{ text: '上车台阶', type: 'warning' }, { text: '1级', type: '' }, { text: '请抬脚', type: '' }] },
      { text: '车门右侧有扶手杆，距离车门约30厘米，可伸手握住借力上车', tags: [{ text: '扶手杆', type: '' }, { text: '右侧', type: '' }, { text: '可借力', type: '' }] },
      { text: '刷卡机在上车后右侧，高度约1.2米，可刷卡或扫码乘车', tags: [{ text: '刷卡机', type: '' }, { text: '右侧1.2米', type: '' }, { text: '请刷卡', type: '' }] },
      { text: '上车后请向车厢内走，前方有座位和扶手，请注意脚下台阶', tags: [{ text: '请往里走', type: '' }, { text: '有座位', type: '' }, { text: '注意脚下', type: 'warning' }] }
    ],
    busInside: [
      { text: '车厢内有8个空座位，前方3个，后方5个，老弱病残座在您右手边', tags: [{ text: '8个空座', type: '' }, { text: '老弱病残座', type: '' }, { text: '在右侧', type: '' }] },
      { text: '您旁边有一根垂直扶手杆，可握住保持平衡', tags: [{ text: '扶手杆', type: '' }, { text: '在旁边', type: '' }, { text: '可扶握', type: '' }] },
      { text: '前方有吊环拉手，距离地面约1.7米，站立时可握住', tags: [{ text: '吊环拉手', type: '' }, { text: '高1.7米', type: '' }, { text: '可握住', type: '' }] },
      { text: '下一站是文化宫站，距离当前站约500米，预计2分钟到达', tags: [{ text: '下一站', type: '' }, { text: '文化宫', type: '' }, { text: '2分钟', type: '' }] },
      { text: '车辆正在转弯，请坐稳扶好，注意安全', tags: [{ text: '转弯中', type: 'warning' }, { text: '请扶好', type: '' }, { text: '注意安全', type: 'warning' }] },
      { text: '车厢内乘客不多，空间宽敞，可安全通行', tags: [{ text: '乘客少', type: '' }, { text: '空间宽敞', type: '' }, { text: '可通行', type: '' }] },
      { text: '下车门在车厢中部偏后位置，距离您约5米', tags: [{ text: '下车门', type: '' }, { text: '中部偏后', type: '' }, { text: '距离5米', type: '' }] }
    ],
    busAlighting: [
      { text: '前方到站火车站，下一站就是，请准备下车，下车门在车厢后部', tags: [{ text: '下一站', type: '' }, { text: '火车站', type: '' }, { text: '请准备', type: '' }] },
      { text: '下车门铃在您右侧扶手杆上，是红色圆形按钮，按下后司机知道有人下车', tags: [{ text: '下车铃', type: '' }, { text: '红色按钮', type: '' }, { text: '在右侧', type: '' }] },
      { text: '车辆正在靠站，即将停车，请抓好扶手，准备下车', tags: [{ text: '靠站中', type: 'warning' }, { text: '请扶好', type: '' }, { text: '准备下车', type: '' }] },
      { text: '下车门已打开，是双开内摆门，车门宽度约1.2米，有1级台阶', tags: [{ text: '门已打开', type: '' }, { text: '双开门', type: '' }, { text: '1级台阶', type: 'warning' }] },
      { text: '下车台阶高约25厘米，在您正前方，请小心脚下，慢一点下车', tags: [{ text: '下车台阶', type: 'warning' }, { text: '高25厘米', type: 'warning' }, { text: '请小心', type: 'warning' }] },
      { text: '车门右侧有扶手，下车时可扶着借力，注意安全', tags: [{ text: '扶手', type: '' }, { text: '右侧', type: '' }, { text: '可借力', type: '' }] },
      { text: '下车后是人行道，距离您约2米，请注意来往车辆', tags: [{ text: '已下车', type: '' }, { text: '人行道', type: '' }, { text: '注意车辆', type: 'warning' }] }
    ],
    metroFinding: [
      { text: '右前方50米处看到地铁站入口标志，上面写着1号线人民广场站', tags: [{ text: '地铁站入口', type: '' }, { text: '1号线', type: '' }, { text: '右前方50米', type: '' }] },
      { text: '地铁站入口在您正前方，无障碍电梯入口在右侧10米处', tags: [{ text: '入口', type: '' }, { text: '电梯在右侧', type: '' }, { text: '无障碍', type: '' }] },
      { text: '地铁站入口上方有绿色标志牌，写着"人民广场站"，A口在左侧', tags: [{ text: '标志牌', type: '' }, { text: 'A口', type: '' }, { text: '左侧', type: '' }] }
    ],
    metroAtGate: [
      { text: '闸机在您正前方3米处，是三杆式闸机，旁边有无障碍宽通道', tags: [{ text: '闸机', type: '' }, { text: '宽通道', type: '' }, { text: '正前方3米', type: '' }] },
      { text: '无障碍闸机通道宽度约1.2米，可供轮椅和婴儿车通过', tags: [{ text: '无障碍通道', type: '' }, { text: '宽1.2米', type: '' }, { text: '可通行', type: '' }] },
      { text: '刷卡区在闸机右侧，高度约1米，请将交通卡或手机贴近感应', tags: [{ text: '刷卡区', type: '' }, { text: '右侧', type: '' }, { text: '高度1米', type: '' }] },
      { text: '闸机已打开，请立即通过，闸机开启时间有限', tags: [{ text: '闸机开', type: '' }, { text: '请通过', type: '' }, { text: '注意时间', type: '' }] }
    ],
    metroOnEscalator: [
      { text: '无障碍电梯在您右侧，轿厢门已打开，请安全进入', tags: [{ text: '电梯', type: '' }, { text: '在右侧', type: '' }, { text: '门已开', type: '' }] },
      { text: '电梯内有盲文按钮，楼层按钮在右侧扶手处，负2层是站台', tags: [{ text: '盲文按钮', type: '' }, { text: '负2层', type: '' }, { text: '站台', type: '' }] },
      { text: '电梯正在下行，请握好扶手，注意层数播报', tags: [{ text: '下行中', type: '' }, { text: '请扶好', type: '' }, { text: '注意层数', type: '' }] },
      { text: '电梯已到达负2层站台层，门已打开，请安全出梯', tags: [{ text: '已到站', type: '' }, { text: '负2层', type: '' }, { text: '请出梯', type: '' }] }
    ],
    metroOnPlatform: [
      { text: '您已到达1号线站台，站台在您左侧，1号线开往火车站方向', tags: [{ text: '站台', type: '' }, { text: '1号线', type: '' }, { text: '左侧', type: '' }] },
      { text: '请站在黄色安全线内候车，不要靠近站台边缘', tags: [{ text: '⚠️ 安全线', type: 'warning' }, { text: '请站好', type: '' }, { text: '不要靠近', type: 'warning' }] },
      { text: '前方有盲文引导带，从电梯出口一直延伸到车门候车区', tags: [{ text: '盲文引导带', type: '' }, { text: '到车门', type: '' }, { text: '可跟随', type: '' }] },
      { text: '列车即将进站，注意屏蔽门会先于列车门打开', tags: [{ text: '⚠️ 进站', type: 'danger' }, { text: '先下后上', type: '' }, { text: '注意屏蔽门', type: '' }] }
    ],
    metroBoarding: [
      { text: '屏蔽门和列车门已打开，请先下后上，注意脚下间隙', tags: [{ text: '门已开', type: '' }, { text: '先下后上', type: '' }, { text: '注意间隙', type: 'warning' }] },
      { text: '上车后请往车厢中部走，前方2米有扶手杆可握', tags: [{ text: '往里走', type: '' }, { text: '扶手杆', type: '' }, { text: '前方2米', type: '' }] },
      { text: '老弱病残专座在车厢中部两侧，有橙色标识', tags: [{ text: '老弱病残座', type: '' }, { text: '中部两侧', type: '' }, { text: '橙色标识', type: '' }] },
      { text: '注意脚下有台阶，车门处地面略高于站台', tags: [{ text: '⚠️ 台阶', type: 'warning' }, { text: '车门处', type: '' }, { text: '请抬脚', type: '' }] }
    ],
    metroInside: [
      { text: '列车正在行驶中，下一站文化宫站，预计3分钟', tags: [{ text: '行驶中', type: '' }, { text: '下一站', type: '' }, { text: '3分钟', type: '' }] },
      { text: '您旁边有垂直扶手杆，吊环拉手上方的到站屏幕显示下一站信息', tags: [{ text: '扶手杆', type: '' }, { text: '在旁', type: '' }, { text: '可扶握', type: '' }] },
      { text: '列车转弯，请坐稳扶好，注意前方扶手', tags: [{ text: '转弯中', type: 'warning' }, { text: '请扶好', type: '' }, { text: '注意安全', type: '' }] },
      { text: '即将到站：文化宫站，请提前走到车门位置准备下车', tags: [{ text: '即将到站', type: '' }, { text: '文化宫', type: '' }, { text: '请准备', type: '' }] },
      { text: '下车后向前走150米是换乘通道，请注意广播提示', tags: [{ text: '换乘通道', type: '' }, { text: '前方150米', type: '' }, { text: '注意广播', type: '' }] }
    ],
    metroAlighting: [
      { text: '屏蔽门和列车门已打开，请安全下车，注意站台与列车间隙', tags: [{ text: '门已开', type: '' }, { text: '注意间隙', type: 'warning' }, { text: '请下车', type: '' }] },
      { text: '下车后站在原地不要移动，换乘通道在正前方150米处', tags: [{ text: '原地等候', type: '' }, { text: '换乘通道', type: '' }, { text: '前方150米', type: '' }] },
      { text: '跟随盲文引导带向前走，换乘通道入口在您右侧', tags: [{ text: '盲文引导带', type: '' }, { text: '右侧入口', type: '' }, { text: '可跟随', type: '' }] },
      { text: '到达2号线站台，开往火车站方向，站台在您左侧', tags: [{ text: '2号线站台', type: '' }, { text: '左侧', type: '' }, { text: '开往火车站', type: '' }] }
    ],
    brtFinding: [
      { text: 'BRT快速公交站台在道路中央，需要走斑马线进入', tags: [{ text: 'BRT站台', type: '' }, { text: '道路中央', type: '' }, { text: '走斑马线', type: '' }] },
      { text: '斑马线在您正前方20米处，请等机动车停车后再通过', tags: [{ text: '斑马线', type: '' }, { text: '前方20米', type: '' }, { text: '等车停', type: 'warning' }] },
      { text: 'BRT站台入口在您右侧，有刷卡闸机和投币箱', tags: [{ text: 'BRT入口', type: '' }, { text: '右侧', type: '' }, { text: '刷卡投币', type: '' }] }
    ],
    brtOnPlatform: [
      { text: 'BRT站台有安全屏蔽门，车辆进站后屏蔽门会同步打开', tags: [{ text: '屏蔽门', type: '' }, { text: '同步开门', type: '' }, { text: '站台安全', type: '' }] },
      { text: '请站在屏蔽门外黄色安全线内等候，不要靠近轨道区域', tags: [{ text: '⚠️ 安全线', type: 'warning' }, { text: '屏蔽门外', type: '' }, { text: '请站好', type: '' }] },
      { text: '前方有盲文引导带，从入口直通屏蔽门候车区', tags: [{ text: '盲文引导带', type: '' }, { text: '到屏蔽门', type: '' }, { text: '可跟随', type: '' }] },
      { text: 'B1路公交车正在进站，请注意来车，站在原地等候', tags: [{ text: '⚠️ 车辆进站', type: 'danger' }, { text: 'B1路', type: '' }, { text: '请等候', type: '' }] }
    ],
    brtBoarding: [
      { text: '屏蔽门和公交车门已同步打开，请安全上车', tags: [{ text: '门已开', type: '' }, { text: '同步开门', type: '' }, { text: '请上车', type: '' }] },
      { text: 'BRT车辆为低地板设计，上车无台阶，方便轮椅和婴儿车', tags: [{ text: '低地板', type: '' }, { text: '无台阶', type: '' }, { text: '方便上下', type: '' }] },
      { text: '刷卡机在车内右侧扶手处，高度约1.2米', tags: [{ text: '刷卡机', type: '' }, { text: '右侧', type: '' }, { text: '1.2米高', type: '' }] },
      { text: '上车后请往车厢中部走，扶手在您周围，请握好', tags: [{ text: '往里走', type: '' }, { text: '有扶手', type: '' }, { text: '请握好', type: '' }] }
    ],
    brtInside: [
      { text: 'BRT车辆行驶在专用道上，平稳快捷，下一站文化宫站', tags: [{ text: '专用道', type: '' }, { text: '平稳', type: '' }, { text: '下一站', type: '' }] },
      { text: '车内有空调，温度适宜，座位旁边有扶手可握', tags: [{ text: '有空调', type: '' }, { text: '温度适宜', type: '' }, { text: '有扶手', type: '' }] },
      { text: '即将到站：火车站，请准备在下车站台下车', tags: [{ text: '即将到站', type: '' }, { text: '火车站', type: '' }, { text: '请准备', type: '' }] },
      { text: '下车后需走斑马线出站，注意来往车辆', tags: [{ text: '斑马线出站', type: '' }, { text: '注意车辆', type: 'warning' }, { text: '请小心', type: '' }] }
    ],
    tramFinding: [
      { text: '有轨电车站台在道路中央，需要走斑马线进入', tags: [{ text: '有轨电车', type: '' }, { text: '道路中央', type: '' }, { text: '走斑马线', type: '' }] },
      { text: '有轨电车轨道在站台前方，请勿踩踏轨道区域', tags: [{ text: '⚠️ 轨道', type: 'danger' }, { text: '请勿踩踏', type: 'danger' }, { text: '注意安全', type: 'danger' }] },
      { text: '站台有遮阳棚和座椅，站牌在入口处', tags: [{ text: '遮阳棚', type: '' }, { text: '站牌', type: '' }, { text: '入口处', type: '' }] }
    ],
    tramOnPlatform: [
      { text: '有轨电车较长约30米，车门在车厢前后两端', tags: [{ text: '车身长', type: '' }, { text: '30米', type: '' }, { text: '前后车门', type: '' }] },
      { text: '请站在站台上黄色安全线内等候，有轨电车进站时请注意', tags: [{ text: '⚠️ 安全线', type: 'warning' }, { text: '请站好', type: '' }, { text: '注意进站', type: '' }] },
      { text: '有轨电车进站，速度较慢，请注意车头和车尾位置', tags: [{ text: '⚠️ 进站', type: 'danger' }, { text: '车头车尾', type: '' }, { text: '请注意', type: '' }] },
      { text: '站台地面有盲文引导带，从入口延伸到候车位置', tags: [{ text: '盲文引导带', type: '' }, { text: '到候车处', type: '' }, { text: '可跟随', type: '' }] }
    ],
    tramBoarding: [
      { text: '有轨电车已停稳，前门在您正前方，请安全上车', tags: [{ text: '已停稳', type: '' }, { text: '前门', type: '' }, { text: '请上车', type: '' }] },
      { text: '有轨电车地板与站台基本平齐，上下车方便', tags: [{ text: '平齐', type: '' }, { text: '上下方便', type: '' }, { text: '无台阶', type: '' }] },
      { text: '刷卡机在车内右侧，高度约1米，请刷卡或投币', tags: [{ text: '刷卡机', type: '' }, { text: '右侧', type: '' }, { text: '1米高', type: '' }] },
      { text: '上车后请握好扶手，有轨电车转弯时车身会略有倾斜', tags: [{ text: '请扶好', type: '' }, { text: '转弯会倾斜', type: 'warning' }, { text: '注意安全', type: '' }] }
    ],
    tramInside: [
      { text: '有轨电车正在运行中，地面轨道平稳，下一站文化宫站', tags: [{ text: '运行中', type: '' }, { text: '平稳', type: '' }, { text: '下一站', type: '' }] },
      { text: '有轨电车有大型车窗，可欣赏沿途城市风景', tags: [{ text: '车窗大', type: '' }, { text: '可看风景', type: '' }, { text: '视野好', type: '' }] },
      { text: '有轨电车转弯时车身会有明显倾斜，请握好扶手', tags: [{ text: '⚠️ 转弯', type: 'warning' }, { text: '车身倾斜', type: '' }, { text: '请扶好', type: '' }] },
      { text: '即将到站：火车站，有轨电车站台较短，注意下车位置', tags: [{ text: '即将到站', type: '' }, { text: '站台短', type: '' }, { text: '注意位置', type: '' }] }
    ],
    tramAlighting: [
      { text: '有轨电车已停稳，请从后门下车，注意站台与车辆间隙', tags: [{ text: '已停稳', type: '' }, { text: '从后门', type: '' }, { text: '注意间隙', type: 'warning' }] },
      { text: '下车后请走斑马线出站，注意来往车辆和轨道区域', tags: [{ text: '斑马线出站', type: '' }, { text: '⚠️ 轨道', type: 'danger' }, { text: '注意车辆', type: 'warning' }] },
      { text: '站台出口在您左侧10米处，盲道直通出口', tags: [{ text: '出口', type: '' }, { text: '左侧10米', type: '' }, { text: '盲道', type: '' }] }
    ],
    mallEntrance: [
      { text: '前方检测到商场入口，1号门，自动门正在感应开启', tags: [{ text: '商场入口', type: '' }, { text: '1号门', type: '' }, { text: '自动门', type: '' }] },
      { text: '商场入口在正前方5米处，玻璃门已打开，请直行进入', tags: [{ text: '入口位置', type: '' }, { text: '正前方5米', type: '' }, { text: '门已开', type: '' }] },
      { text: '检测到入口处有门禁闸机，请靠左走无障碍通道', tags: [{ text: '⚠️ 闸机', type: 'warning' }, { text: '左侧通道', type: '' }, { text: '请靠左', type: '' }] },
      { text: '商场大门已完全打开，宽度约3米，可以安全进入', tags: [{ text: '大门开启', type: '' }, { text: '宽度3米', type: '' }, { text: '安全通行', type: '' }] },
      { text: '入口右侧有服务台，如需咨询可以前往', tags: [{ text: '服务台', type: '' }, { text: '右侧', type: '' }, { text: '可咨询', type: '' }] },
      { text: '检测到入口处有行人出入，请减速慢行注意避让', tags: [{ text: '⚠️ 行人', type: 'warning' }, { text: '入口处', type: '' }, { text: '请慢行', type: 'warning' }] },
      { text: '商场入口处地面平整，无障碍坡道已就位', tags: [{ text: '地面平整', type: '' }, { text: '无障碍', type: '' }, { text: '安全通行', type: '' }] },
      { text: '入口上方有1号门标识牌，确认是正确入口', tags: [{ text: '1号门', type: '' }, { text: '标识清晰', type: '' }, { text: '确认正确', type: '' }] }
    ],
    mallElevator: [
      { text: '前方8米处检测到直梯，电梯门处于关闭状态', tags: [{ text: '直梯', type: '' }, { text: '前方8米', type: '' }, { text: '门关闭', type: '' }] },
      { text: '电梯在您右侧，上行按钮在电梯门右侧，高度约1.2米', tags: [{ text: '电梯位置', type: '' }, { text: '右侧', type: '' }, { text: '按钮高度1.2米', type: '' }] },
      { text: '检测到无障碍电梯，门宽1.5米，有盲文按钮和语音报层', tags: [{ text: '无障碍电梯', type: '' }, { text: '盲文按钮', type: '' }, { text: '语音报层', type: '' }] },
      { text: '电梯门已打开，轿厢内宽敞，请安全进入', tags: [{ text: '门已开', type: '' }, { text: '轿厢宽敞', type: '' }, { text: '请进入', type: '' }] },
      { text: '电梯内按钮面板在右侧，3楼按钮在中间位置，有盲文标识', tags: [{ text: '按钮面板', type: '' }, { text: '右侧', type: '' }, { text: '3楼按钮', type: '' }] },
      { text: '⚠️ 注意：电梯口有行人进出，请小心避让', tags: [{ text: '⚠️ 行人', type: 'warning' }, { text: '电梯口', type: '' }, { text: '请避让', type: 'warning' }] },
      { text: '电梯扶手在轿厢两侧，高度约90厘米', tags: [{ text: '扶手位置', type: '' }, { text: '两侧', type: '' }, { text: '高度90cm', type: '' }] },
      { text: '检测到电梯正在上升，当前楼层1楼，即将到达3楼', tags: [{ text: '电梯运行', type: '' }, { text: '上升中', type: '' }, { text: '即将到达', type: '' }] }
    ],
    mallShop: [
      { text: '目标店铺在您右侧5米处，店门已打开', tags: [{ text: '目标店铺', type: '' }, { text: '右侧5米', type: '' }, { text: '门已开', type: '' }] },
      { text: '检测到店铺招牌，确认是您要找的店铺', tags: [{ text: '招牌识别', type: '' }, { text: '确认正确', type: '' }, { text: '已到达', type: '' }] },
      { text: '店铺入口处有一级小台阶，高度约5厘米，请注意抬脚', tags: [{ text: '⚠️ 台阶', type: 'warning' }, { text: '5cm高', type: 'warning' }, { text: '请抬脚', type: '' }] },
      { text: '店铺内灯光明亮，通道宽敞，可以安全进入', tags: [{ text: '灯光明亮', type: '' }, { text: '通道宽敞', type: '' }, { text: '安全进入', type: '' }] },
      { text: '入口右侧有货架陈列，请靠左行走', tags: [{ text: '货架', type: 'warning' }, { text: '右侧', type: '' }, { text: '靠左走', type: '' }] },
      { text: '店铺导购员在门口迎接，有需要可以咨询', tags: [{ text: '导购员', type: '' }, { text: '门口', type: '' }, { text: '可咨询', type: '' }] },
      { text: '地面光滑，可能是地砖，请放慢脚步小心行走', tags: [{ text: '⚠️ 地面光滑', type: 'warning' }, { text: '地砖', type: '' }, { text: '请慢行', type: 'warning' }] },
      { text: '收银台在店铺深处左侧，如需结账可前往', tags: [{ text: '收银台', type: '' }, { text: '深处左侧', type: '' }, { text: '可结账', type: '' }] }
    ],
    hospitalEntrance: [
      { text: '前方检测到医院门诊楼入口，大门已打开', tags: [{ text: '医院入口', type: '' }, { text: '门诊楼', type: '' }, { text: '门已开', type: '' }] },
      { text: '医院大门在正前方6米处，门宽约4米，可以安全进入', tags: [{ text: '大门位置', type: '' }, { text: '正前方6米', type: '' }, { text: '门宽4米', type: '' }] },
      { text: '检测到入口处有门禁，左侧是无障碍通道，请靠左走', tags: [{ text: '⚠️ 门禁', type: 'warning' }, { text: '无障碍通道', type: '' }, { text: '请靠左', type: '' }] },
      { text: '医院入口处地面平整，有防滑坡道，方便通行', tags: [{ text: '地面平整', type: '' }, { text: '防滑坡道', type: '' }, { text: '方便通行', type: '' }] },
      { text: '入口右侧有医院名称标识牌，确认是人民医院', tags: [{ text: '医院标识', type: '' }, { text: '右侧', type: '' }, { text: '确认正确', type: '' }] },
      { text: '⚠️ 入口处有较多行人，请减速慢行注意避让', tags: [{ text: '⚠️ 人群', type: 'warning' }, { text: '入口处', type: '' }, { text: '请慢行', type: 'warning' }] },
      { text: '医院大门是自动感应门，正在缓慢开启，请稍等', tags: [{ text: '自动门', type: '' }, { text: '开启中', type: '' }, { text: '请稍等', type: '' }] },
      { text: '入口处有轮椅坡道，在左侧，坡度适中', tags: [{ text: '轮椅坡道', type: '' }, { text: '左侧', type: '' }, { text: '坡度适中', type: '' }] }
    ],
    hospitalReception: [
      { text: '前方10米处检测到导诊台，在大厅中央位置', tags: [{ text: '导诊台', type: '' }, { text: '前方10米', type: '' }, { text: '大厅中央', type: '' }] },
      { text: '导诊台高度约1.1米，有工作人员在岗', tags: [{ text: '导诊台', type: '' }, { text: '高度1.1米', type: '' }, { text: '有工作人员', type: '' }] },
      { text: '挂号处在导诊台右侧，请前往挂号', tags: [{ text: '挂号处', type: '' }, { text: '右侧', type: '' }, { text: '请前往', type: '' }] },
      { text: '检测到取号机在您左前方，可自助挂号', tags: [{ text: '取号机', type: '' }, { text: '左前方', type: '' }, { text: '可自助', type: '' }] },
      { text: '导诊台上方有科室分布图，可查看各科室位置', tags: [{ text: '科室分布', type: '' }, { text: '导诊台上方', type: '' }, { text: '可查看', type: '' }] },
      { text: '⚠️ 大厅内人员较多，请放慢脚步注意避让', tags: [{ text: '⚠️ 人员较多', type: 'warning' }, { text: '大厅', type: '' }, { text: '请慢行', type: 'warning' }] },
      { text: '导诊台有轮椅借用服务，有需要可以咨询', tags: [{ text: '轮椅服务', type: '' }, { text: '导诊台', type: '' }, { text: '可借用', type: '' }] },
      { text: '急诊科在大厅左侧，有明显标识', tags: [{ text: '急诊科', type: '' }, { text: '左侧', type: '' }, { text: '标识明显', type: '' }] }
    ],
    hospitalClinic: [
      { text: '前方检测到508诊室，门牌标识清晰', tags: [{ text: '508诊室', type: '' }, { text: '门牌清晰', type: '' }, { text: '已到达', type: '' }] },
      { text: '诊室门在您左侧，门是关闭的，请敲门进入', tags: [{ text: '诊室门', type: '' }, { text: '左侧', type: '' }, { text: '请敲门', type: '' }] },
      { text: '诊室外有候诊椅，可坐下休息等候叫号', tags: [{ text: '候诊椅', type: '' }, { text: '可休息', type: '' }, { text: '等叫号', type: '' }] },
      { text: '检测到叫号显示屏在走廊右侧，显示当前叫号', tags: [{ text: '叫号屏', type: '' }, { text: '右侧', type: '' }, { text: '可查看', type: '' }] },
      { text: '走廊右侧有卫生间指示牌，前方20米', tags: [{ text: '卫生间', type: '' }, { text: '前方20米', type: '' }, { text: '右侧', type: '' }] },
      { text: '地面干净整洁，两侧有扶手，行走安全', tags: [{ text: '地面整洁', type: '' }, { text: '有扶手', type: '' }, { text: '安全', type: '' }] }
    ],
    officeEntrance: [
      { text: '前方检测到办公楼入口，国贸大厦A座，大门已打开', tags: [{ text: '办公楼入口', type: '' }, { text: '国贸大厦', type: '' }, { text: '门已开', type: '' }] },
      { text: '办公楼大门在正前方8米处，是自动感应玻璃门', tags: [{ text: '大门位置', type: '' }, { text: '正前方8米', type: '' }, { text: '自动门', type: '' }] },
      { text: '入口右侧有门禁刷卡区，高度约1.2米', tags: [{ text: '门禁', type: 'warning' }, { text: '右侧', type: '' }, { text: '刷卡区', type: '' }] },
      { text: '检测到无障碍通道在入口左侧，门宽1.5米', tags: [{ text: '无障碍通道', type: '' }, { text: '左侧', type: '' }, { text: '门宽1.5米', type: '' }] },
      { text: '入口处有旋转门和侧门，侧门在右侧，请走侧门', tags: [{ text: '旋转门', type: 'warning' }, { text: '侧门在右', type: '' }, { text: '请走侧门', type: '' }] },
      { text: '办公楼名称标识在入口上方，字体清晰', tags: [{ text: '办公楼标识', type: '' }, { text: '入口上方', type: '' }, { text: '清晰可见', type: '' }] }
    ],
    officeReception: [
      { text: '前方5米处检测到前台，在大堂左侧', tags: [{ text: '前台', type: '' }, { text: '前方5米', type: '' }, { text: '左侧', type: '' }] },
      { text: '前台高度约1.1米，有接待人员在岗，可咨询访客登记', tags: [{ text: '前台', type: '' }, { text: '高度1.1米', type: '' }, { text: '有接待', type: '' }] },
      { text: '检测到访客登记机在前台右侧，可自助登记', tags: [{ text: '登记机', type: '' }, { text: '前台右侧', type: '' }, { text: '可自助', type: '' }] },
      { text: '大堂宽敞明亮，地面是大理石材质，请慢走', tags: [{ text: '大堂宽敞', type: '' }, { text: '⚠️ 地面光滑', type: 'warning' }, { text: '请慢行', type: 'warning' }] },
      { text: '电梯厅在大堂正前方，距离约20米', tags: [{ text: '电梯厅', type: '' }, { text: '正前方20米', type: '' }, { text: '可前往', type: '' }] },
      { text: '右侧有休息区和沙发，可坐下等候', tags: [{ text: '休息区', type: '' }, { text: '右侧', type: '' }, { text: '可休息', type: '' }] }
    ],
    officeElevator: [
      { text: '前方检测到电梯厅，有8部客梯分左右两排', tags: [{ text: '电梯厅', type: '' }, { text: '8部客梯', type: '' }, { text: '两排', type: '' }] },
      { text: '电梯按钮面板在您右侧，高度约1.2米，有上行按钮', tags: [{ text: '电梯按钮', type: '' }, { text: '右侧', type: '' }, { text: '高度1.2米', type: '' }] },
      { text: '检测到无障碍电梯在最右侧，门宽1.5米', tags: [{ text: '无障碍电梯', type: '' }, { text: '最右侧', type: '' }, { text: '门宽1.5米', type: '' }] },
      { text: '电梯有语音报层功能，盲文按钮在轿厢右侧', tags: [{ text: '语音报层', type: '' }, { text: '盲文按钮', type: '' }, { text: '右侧', type: '' }] },
      { text: '⚠️ 电梯口人员较多，请放慢脚步注意安全', tags: [{ text: '⚠️ 人员较多', type: 'warning' }, { text: '电梯口', type: '' }, { text: '请慢行', type: 'warning' }] },
      { text: '货梯在左侧通道尽头，访客请乘客梯', tags: [{ text: '货梯', type: '' }, { text: '左侧尽头', type: '' }, { text: '访客乘客梯', type: '' }] }
    ],
    schoolEntrance: [
      { text: '前方检测到学校校门，第一中学正门', tags: [{ text: '学校校门', type: '' }, { text: '第一中学', type: '' }, { text: '正门', type: '' }] },
      { text: '校门在正前方10米处，大门已打开，有门卫值班', tags: [{ text: '校门位置', type: '' }, { text: '正前方10米', type: '' }, { text: '有门卫', type: '' }] },
      { text: '⚠️ 注意：校门口有学生出入，请减速慢行', tags: [{ text: '⚠️ 学生', type: 'warning' }, { text: '校门口', type: '' }, { text: '请慢行', type: 'warning' }] },
      { text: '校门右侧有传达室，可咨询登记', tags: [{ text: '传达室', type: '' }, { text: '右侧', type: '' }, { text: '可咨询', type: '' }] },
      { text: '入校通道在左侧，有盲道砖引导', tags: [{ text: '入校通道', type: '' }, { text: '左侧', type: '' }, { text: '有盲道', type: '' }] },
      { text: '学校名称标识在大门上方，字体醒目', tags: [{ text: '学校标识', type: '' }, { text: '大门上方', type: '' }, { text: '醒目', type: '' }] }
    ],
    schoolBuilding: [
      { text: '前方检测到主教学楼，在校园正中央', tags: [{ text: '主教学楼', type: '' }, { text: '校园中央', type: '' }, { text: '已接近', type: '' }] },
      { text: '教学楼入口在正前方，有台阶向上，共8级', tags: [{ text: '教学楼入口', type: '' }, { text: '⚠️ 8级台阶', type: 'warning' }, { text: '向上', type: 'warning' }] },
      { text: '台阶两侧有扶手，高度约90厘米', tags: [{ text: '扶手', type: '' }, { text: '两侧', type: '' }, { text: '高度90cm', type: '' }] },
      { text: '检测到无障碍坡道在教学楼右侧', tags: [{ text: '无障碍坡道', type: '' }, { text: '右侧', type: '' }, { text: '可通行', type: '' }] },
      { text: '教学楼大门已打开，是双开玻璃门', tags: [{ text: '大门已开', type: '' }, { text: '玻璃门', type: '' }, { text: '双开门', type: '' }] },
      { text: '教学楼门厅宽敞，有楼层指示牌', tags: [{ text: '门厅宽敞', type: '' }, { text: '指示牌', type: '' }, { text: '安全', type: '' }] }
    ],
    schoolClassroom: [
      { text: '前方检测到初三二班教室，门牌标识清晰', tags: [{ text: '初三二班', type: '' }, { text: '门牌清晰', type: '' }, { text: '已到达', type: '' }] },
      { text: '教室门在您左侧，门是半开的，请轻轻推门进入', tags: [{ text: '教室门', type: '' }, { text: '左侧', type: '' }, { text: '半开', type: '' }] },
      { text: '走廊两侧有教室，地面铺有地砖，请放轻脚步', tags: [{ text: '走廊', type: '' }, { text: '两侧教室', type: '' }, { text: '请轻声', type: '' }] },
      { text: '检测到卫生间在走廊尽头右侧', tags: [{ text: '卫生间', type: '' }, { text: '尽头右侧', type: '' }, { text: '可前往', type: '' }] },
      { text: '楼梯间在走廊左侧，有扶手', tags: [{ text: '楼梯间', type: '' }, { text: '左侧', type: '' }, { text: '有扶手', type: '' }] },
      { text: '教室内有学生正在上课，请保持安静', tags: [{ text: '上课中', type: '' }, { text: '请安静', type: '' }, { text: '注意', type: 'warning' }] }
    ],
    airportTerminal: [
      { text: '前方检测到机场T2航站楼3号入口', tags: [{ text: 'T2航站楼', type: '' }, { text: '3号入口', type: '' }, { text: '已到达', type: '' }] },
      { text: '航站楼入口在正前方15米处，大门宽约6米', tags: [{ text: '入口位置', type: '' }, { text: '正前方15米', type: '' }, { text: '门宽6米', type: '' }] },
      { text: '入口处有行李推车，在右侧，可取用', tags: [{ text: '行李推车', type: '' }, { text: '右侧', type: '' }, { text: '可取用', type: '' }] },
      { text: '⚠️ 入口处人员较多，有行李车通行，请小心', tags: [{ text: '⚠️ 人员多', type: 'warning' }, { text: '行李车', type: 'warning' }, { text: '请小心', type: 'danger' }] },
      { text: '机场入口有无障碍通道，在最左侧', tags: [{ text: '无障碍通道', type: '' }, { text: '最左侧', type: '' }, { text: '可通行', type: '' }] },
      { text: '航站楼标识在入口上方，灯箱明亮', tags: [{ text: 'T2标识', type: '' }, { text: '入口上方', type: '' }, { text: '明亮', type: '' }] }
    ],
    airportCheckin: [
      { text: '前方检测到值机区，B区在您正前方', tags: [{ text: '值机区', type: '' }, { text: 'B区', type: '' }, { text: '正前方', type: '' }] },
      { text: '值机柜台排列整齐，B12柜台在右侧第5个', tags: [{ text: '值机柜台', type: '' }, { text: 'B12', type: '' }, { text: '右侧第5个', type: '' }] },
      { text: '检测到自助值机在左侧，有12台机器', tags: [{ text: '自助值机', type: '' }, { text: '左侧', type: '' }, { text: '12台', type: '' }] },
      { text: '值机柜台高度约1米，有工作人员服务', tags: [{ text: '柜台高度', type: '' }, { text: '1米', type: '' }, { text: '有工作人员', type: '' }] },
      { text: '国内出发在右侧，国际出发在左侧', tags: [{ text: '国内出发', type: '' }, { text: '右侧', type: '' }, { text: '国际在左', type: '' }] },
      { text: '问询处在大厅中央，有明显标识', tags: [{ text: '问询处', type: '' }, { text: '大厅中央', type: '' }, { text: '可咨询', type: '' }] }
    ],
    airportGate: [
      { text: '前方检测到28号登机口，在您左侧', tags: [{ text: '28号登机口', type: '' }, { text: '左侧', type: '' }, { text: '已到达', type: '' }] },
      { text: '登机口座位区宽敞，有30个座位可供休息', tags: [{ text: '座位区', type: '' }, { text: '30个座位', type: '' }, { text: '可休息', type: '' }] },
      { text: '登机口显示屏在上方，显示航班信息', tags: [{ text: '显示屏', type: '' }, { text: '上方', type: '' }, { text: '航班信息', type: '' }] },
      { text: '检测到卫生间在登机口右侧10米处', tags: [{ text: '卫生间', type: '' }, { text: '右侧10米', type: '' }, { text: '可前往', type: '' }] },
      { text: '登机口有工作人员检票，请准备好登机牌', tags: [{ text: '检票', type: '' }, { text: '准备登机牌', type: '' }, { text: '有工作人员', type: '' }] },
      { text: '廊桥在登机口前方，登机时请小心脚下', tags: [{ text: '廊桥', type: '' }, { text: '前方', type: '' }, { text: '⚠️ 小心脚下', type: 'warning' }] }
    ],
    libraryEntrance: [
      { text: '前方检测到市图书馆正门，大门已打开', tags: [{ text: '图书馆入口', type: '' }, { text: '正门', type: '' }, { text: '门已开', type: '' }] },
      { text: '图书馆大门在正前方8米处，是双开玻璃门', tags: [{ text: '大门位置', type: '' }, { text: '正前方8米', type: '' }, { text: '玻璃门', type: '' }] },
      { text: '入口右侧有存包柜，可存放随身物品', tags: [{ text: '存包柜', type: '' }, { text: '右侧', type: '' }, { text: '可存包', type: '' }] },
      { text: '⚠️ 图书馆内请保持安静，手机请调静音', tags: [{ text: '请安静', type: '' }, { text: '调静音', type: 'warning' }, { text: '注意', type: 'warning' }] },
      { text: '检测到无障碍通道在入口左侧', tags: [{ text: '无障碍通道', type: '' }, { text: '左侧', type: '' }, { text: '可通行', type: '' }] },
      { text: '入口处有图书检测门，请正常通过', tags: [{ text: '检测门', type: '' }, { text: '入口处', type: '' }, { text: '请通过', type: '' }] }
    ],
    libraryService: [
      { text: '前方检测到总服务台，在大厅左侧', tags: [{ text: '总服务台', type: '' }, { text: '左侧', type: '' }, { text: '前方5米', type: '' }] },
      { text: '服务台有工作人员，可办证、咨询、还书', tags: [{ text: '服务台', type: '' }, { text: '有工作人员', type: '' }, { text: '可咨询', type: '' }] },
      { text: '检测到自助借还书机在右侧，有6台', tags: [{ text: '自助借还', type: '' }, { text: '右侧', type: '' }, { text: '6台', type: '' }] },
      { text: '图书馆大厅安静整洁，地面铺地毯，行走无声', tags: [{ text: '大厅安静', type: '' }, { text: '地毯', type: '' }, { text: '请轻声', type: '' }] },
      { text: '楼层分布图在服务台旁，可查看各层分布', tags: [{ text: '楼层分布', type: '' }, { text: '服务台旁', type: '' }, { text: '可查看', type: '' }] },
      { text: '电梯在服务台右侧，可到各借阅区', tags: [{ text: '电梯', type: '' }, { text: '服务台右侧', type: '' }, { text: '各楼层', type: '' }] }
    ],
    libraryBooks: [
      { text: '前方检测到中国文学区书架，排列整齐', tags: [{ text: '文学区', type: '' }, { text: '书架整齐', type: '' }, { text: '已到达', type: '' }] },
      { text: '书架高度约2米，共5层，图书按类别排列', tags: [{ text: '书架', type: '' }, { text: '高2米', type: '' }, { text: '5层', type: '' }] },
      { text: '书架之间通道宽约1.5米，可两人并行', tags: [{ text: '通道', type: '' }, { text: '宽1.5米', type: '' }, { text: '可并行', type: '' }] },
      { text: '检测到阅读区在前方右侧，有桌椅', tags: [{ text: '阅读区', type: '' }, { text: '前方右侧', type: '' }, { text: '有桌椅', type: '' }] },
      { text: '书架上有分类标识牌，可按类别找书', tags: [{ text: '分类标识', type: '' }, { text: '书架上', type: '' }, { text: '可查找', type: '' }] },
      { text: '地面铺有地毯，行走安静，请保持安静', tags: [{ text: '地毯', type: '' }, { text: '安静', type: '' }, { text: '请轻声', type: '' }] }
    ],
    supermarketEntrance: [
      { text: '前方检测到大润发超市入口，自动门正在开启', tags: [{ text: '超市入口', type: '' }, { text: '大润发', type: '' }, { text: '自动门', type: '' }] },
      { text: '超市入口在正前方6米处，门宽约4米', tags: [{ text: '入口位置', type: '' }, { text: '正前方6米', type: '' }, { text: '门宽4米', type: '' }] },
      { text: '入口右侧有购物车和购物篮，可取用', tags: [{ text: '购物车', type: '' }, { text: '右侧', type: '' }, { text: '可取用', type: '' }] },
      { text: '⚠️ 入口处有购物车进出，请小心避让', tags: [{ text: '⚠️ 购物车', type: 'warning' }, { text: '入口处', type: '' }, { text: '请避让', type: 'warning' }] },
      { text: '检测到存包柜在入口左侧，可自助存包', tags: [{ text: '存包柜', type: '' }, { text: '左侧', type: '' }, { text: '可存包', type: '' }] },
      { text: '入口处有防损门，请正常通过', tags: [{ text: '防损门', type: '' }, { text: '入口处', type: '' }, { text: '请通过', type: '' }] }
    ],
    supermarketFresh: [
      { text: '前方检测到生鲜蔬果区，在超市北侧', tags: [{ text: '生鲜区', type: '' }, { text: '蔬果', type: '' }, { text: '已到达', type: '' }] },
      { text: '蔬菜区在您左侧，有新鲜蔬菜陈列', tags: [{ text: '蔬菜区', type: '' }, { text: '左侧', type: '' }, { text: '新鲜', type: '' }] },
      { text: '水果区在正前方，有多种水果可供选择', tags: [{ text: '水果区', type: '' }, { text: '正前方', type: '' }, { text: '多种水果', type: '' }] },
      { text: '⚠️ 地面有水渍风险，请放慢脚步小心滑倒', tags: [{ text: '⚠️ 地滑', type: 'danger' }, { text: '水渍', type: 'warning' }, { text: '请慢行', type: 'danger' }] },
      { text: '检测到称重台在生鲜区右侧，可自助称重', tags: [{ text: '称重台', type: '' }, { text: '右侧', type: '' }, { text: '可自助', type: '' }] },
      { text: '生鲜区有冷柜，温度较低，请注意保暖', tags: [{ text: '冷柜', type: '' }, { text: '温度低', type: '' }, { text: '注意保暖', type: 'warning' }] }
    ],
    supermarketFood: [
      { text: '前方检测到食品零食区，货架排列整齐', tags: [{ text: '食品区', type: '' }, { text: '零食', type: '' }, { text: '已到达', type: '' }] },
      { text: '零食饮料区在您右侧，有多个货架', tags: [{ text: '零食饮料', type: '' }, { text: '右侧', type: '' }, { text: '多货架', type: '' }] },
      { text: '货架通道宽约1.2米，请注意避让购物车', tags: [{ text: '通道', type: '' }, { text: '宽1.2米', type: '' }, { text: '⚠️ 避让', type: 'warning' }] },
      { text: '检测到促销堆头在通道中间，请绕行', tags: [{ text: '促销堆头', type: 'warning' }, { text: '通道中间', type: '' }, { text: '请绕行', type: '' }] },
      { text: '商品分类标识在货架端头，可查看类别', tags: [{ text: '分类标识', type: '' }, { text: '货架端头', type: '' }, { text: '可查看', type: '' }] },
      { text: '地面光洁，有购物车通行，请靠右侧行走', tags: [{ text: '地面光洁', type: '' }, { text: '购物车', type: 'warning' }, { text: '靠右走', type: '' }] }
    ],
    restaurantEntrance: [
      { text: '前方检测到海底捞火锅店入口，门已打开', tags: [{ text: '餐厅入口', type: '' }, { text: '海底捞', type: '' }, { text: '门已开', type: '' }] },
      { text: '餐厅大门在正前方5米处，是双开玻璃门', tags: [{ text: '大门位置', type: '' }, { text: '正前方5米', type: '' }, { text: '玻璃门', type: '' }] },
      { text: '入口处有迎宾台，有服务员迎接', tags: [{ text: '迎宾台', type: '' }, { text: '入口处', type: '' }, { text: '有服务员', type: '' }] },
      { text: '⚠️ 餐厅内人员较多，请放慢脚步', tags: [{ text: '⚠️ 人员多', type: 'warning' }, { text: '餐厅内', type: '' }, { text: '请慢行', type: 'warning' }] },
      { text: '检测到等位区在入口左侧，有座椅', tags: [{ text: '等位区', type: '' }, { text: '左侧', type: '' }, { text: '有座椅', type: '' }] },
      { text: '餐厅招牌在入口上方，灯光明亮', tags: [{ text: '餐厅招牌', type: '' }, { text: '入口上方', type: '' }, { text: '明亮', type: '' }] }
    ],
    restaurantSeating: [
      { text: '前方检测到您的座位，4人桌，在大厅中部', tags: [{ text: '座位', type: '' }, { text: '4人桌', type: '' }, { text: '已到达', type: '' }] },
      { text: '餐桌在您右侧，椅子在桌下，可拉出入座', tags: [{ text: '餐桌', type: '' }, { text: '右侧', type: '' }, { text: '有椅子', type: '' }] },
      { text: '桌上有餐具和菜单，可点餐', tags: [{ text: '餐具菜单', type: '' }, { text: '桌上', type: '' }, { text: '可点餐', type: '' }] },
      { text: '检测到服务员在附近，可呼叫服务', tags: [{ text: '服务员', type: '' }, { text: '附近', type: '' }, { text: '可呼叫', type: '' }] },
      { text: '通道宽敞，但有送餐车通行，请靠右侧走', tags: [{ text: '通道', type: '' }, { text: '送餐车', type: 'warning' }, { text: '靠右走', type: '' }] },
      { text: '桌子下方有物品存放筐，可放包', tags: [{ text: '存物筐', type: '' }, { text: '桌下', type: '' }, { text: '可放包', type: '' }] }
    ],
    museumEntrance: [
      { text: '前方检测到省博物馆南门入口，有安检通道', tags: [{ text: '博物馆入口', type: '' }, { text: '南门', type: '' }, { text: '安检', type: '' }] },
      { text: '博物馆大门在正前方10米处，门已打开', tags: [{ text: '大门位置', type: '' }, { text: '正前方10米', type: '' }, { text: '门已开', type: '' }] },
      { text: '入口处有安检，请配合检查，有序通过', tags: [{ text: '安检', type: '' }, { text: '入口处', type: '' }, { text: '请配合', type: 'warning' }] },
      { text: '⚠️ 博物馆内请保持安静，禁止触摸展品', tags: [{ text: '请安静', type: '' }, { text: '禁触摸', type: 'warning' }, { text: '注意', type: 'warning' }] },
      { text: '检测到票务中心在入口左侧，可购票或领票', tags: [{ text: '票务中心', type: '' }, { text: '左侧', type: '' }, { text: '可购票', type: '' }] },
      { text: '博物馆建筑宏伟，有石阶向上，请注意脚下', tags: [{ text: '石阶', type: 'warning' }, { text: '向上', type: '' }, { text: '⚠️ 小心脚下', type: 'warning' }] }
    ],
    museumService: [
      { text: '前方检测到服务台，在大厅正中央', tags: [{ text: '服务台', type: '' }, { text: '大厅中央', type: '' }, { text: '前方5米', type: '' }] },
      { text: '服务台可租用语音讲解器和轮椅', tags: [{ text: '讲解器', type: '' }, { text: '轮椅', type: '' }, { text: '可租用', type: '' }] },
      { text: '检测到展厅导览图在服务台旁，可查看', tags: [{ text: '导览图', type: '' }, { text: '服务台旁', type: '' }, { text: '可查看', type: '' }] },
      { text: '大厅宽敞明亮，地面铺大理石，请慢行', tags: [{ text: '大厅宽敞', type: '' }, { text: '⚠️ 地面光滑', type: 'warning' }, { text: '请慢行', type: 'warning' }] },
      { text: '存包处在服务台左侧，可存放物品', tags: [{ text: '存包处', type: '' }, { text: '左侧', type: '' }, { text: '可存包', type: '' }] },
      { text: '电梯在服务台右侧，可到各楼层展厅', tags: [{ text: '电梯', type: '' }, { text: '右侧', type: '' }, { text: '各展厅', type: '' }] }
    ],
    museumExhibition: [
      { text: '前方检测到一号展厅入口，古代文物展区', tags: [{ text: '一号展厅', type: '' }, { text: '古代文物', type: '' }, { text: '已到达', type: '' }] },
      { text: '展厅内光线柔和，展品陈列在玻璃展柜中', tags: [{ text: '展厅', type: '' }, { text: '展柜', type: '' }, { text: '光线柔和', type: '' }] },
      { text: '展厅通道宽约2米，可两人并行', tags: [{ text: '通道', type: '' }, { text: '宽2米', type: '' }, { text: '可并行', type: '' }] },
      { text: '检测到语音导览点在展品旁，可扫码收听', tags: [{ text: '语音导览', type: '' }, { text: '展品旁', type: '' }, { text: '可扫码', type: '' }] },
      { text: '⚠️ 展厅内请保持安静，不要触摸展柜', tags: [{ text: '请安静', type: '' }, { text: '禁触摸', type: 'warning' }, { text: '注意', type: 'warning' }] },
      { text: '展厅有休息座椅，在墙边，可坐下休息', tags: [{ text: '休息座椅', type: '' }, { text: '墙边', type: '' }, { text: '可休息', type: '' }] }
    ]
  };

  let lastMileSteps = [];

  function generateLastMileSteps(destName, mode) {
    var steps = [];
    var dest = destName || selectedDestination || '目的地';
    var travelMode = mode || getActualMode();

    if (travelMode === 'taxi') {
      steps = [
        { text: '车辆已到达，请准备下车', detail: '请带好随身物品', aiText: '车辆已停稳，请带好随身物品准备下车。开车门时请注意后方来车。', aiTags: [{ text: '下车', type: '' }, { text: '带好物品', type: '' }, { text: '注意来车', type: 'warning' }] },
        { text: '下车，注意后方来车', detail: '从右侧下车更安全', aiText: '请用右手开车门，先观察后方有无来车和非机动车，确认安全后再下车。', aiTags: [{ text: '⚠️ 后方来车', type: 'warning' }, { text: '右侧下车', type: '' }, { text: '注意安全', type: 'warning' }] },
        { text: '关车门，向前走', detail: '前方50米是' + dest, aiText: '车门已关好，正前方约50米就是' + dest + '，请沿人行道向前走。', aiTags: [{ text: dest, type: '' }, { text: '前方50米', type: '' }, { text: '继续前行', type: '' }] },
        { text: '向前走，找入口', detail: '入口在正前方', aiText: '正前方是' + dest + '的入口，是玻璃大门，继续向前走约15步。', aiTags: [{ text: '入口', type: '' }, { text: '正前方', type: '' }, { text: '15步', type: '' }] },
        { text: '到达门口，找门把手', detail: '门把手在右侧', aiText: '已到达门口，右侧有金属门把手，高度约1米，门向内开启。请伸手找到门把手。', aiTags: [{ text: '门把手', type: '' }, { text: '右侧', type: '' }, { text: '向内开', type: '' }] },
        { text: '🎉 已到达目的地', detail: '导航结束，祝您愉快', aiText: '恭喜您已到达' + dest + '，导航结束。如需帮助请随时唤醒我。', aiTags: [{ text: '到达', type: '' }, { text: '导航结束', type: '' }, { text: '⭐', type: '' }], isFinal: true }
      ];
    } else if (['bus', 'tram'].includes(travelMode)) {
      steps = [
        { text: '已到站，请下车', detail: '下车注意脚下台阶', aiText: '车辆已到站停稳，请从后门下车。下车时注意脚下台阶，约15厘米高。', aiTags: [{ text: '下车', type: '' }, { text: '⚠️ 台阶', type: 'warning' }, { text: '注意脚下', type: 'warning' }] },
        { text: '下车后注意来车', detail: '左右观察确保安全', aiText: '下车后请先停步，左右观察有无来车和非机动车，确认安全后再走下站台。', aiTags: [{ text: '⚠️ 来车', type: 'warning' }, { text: '左右观察', type: '' }, { text: '注意安全', type: 'warning' }] },
        { text: '走下站台，向前走', detail: '前方50米是' + dest, aiText: '已走下站台，正前方约50米就是' + dest + '，请沿人行道向前走。', aiTags: [{ text: dest, type: '' }, { text: '前方50米', type: '' }, { text: '继续前行', type: '' }] },
        { text: '向前走，找入口', detail: '入口在正前方', aiText: '正前方是' + dest + '的入口，是玻璃大门，继续向前走约15步。', aiTags: [{ text: '入口', type: '' }, { text: '正前方', type: '' }, { text: '15步', type: '' }] },
        { text: '到达门口，找门把手', detail: '门把手在右侧', aiText: '已到达门口，右侧有金属门把手，高度约1米，门向内开启。请伸手找到门把手。', aiTags: [{ text: '门把手', type: '' }, { text: '右侧', type: '' }, { text: '向内开', type: '' }] },
        { text: '🎉 已到达目的地', detail: '导航结束，祝您愉快', aiText: '恭喜您已到达' + dest + '，导航结束。如需帮助请随时唤醒我。', aiTags: [{ text: '到达', type: '' }, { text: '导航结束', type: '' }, { text: '⭐', type: '' }], isFinal: true }
      ];
    } else if (travelMode === 'metro') {
      steps = [
        { text: '已到站，请下车', detail: '注意站台与列车间隙', aiText: '列车已到站停稳，车门正在打开。下车时请注意站台与列车间的间隙，约10厘米。', aiTags: [{ text: '下车', type: '' }, { text: '⚠️ 间隙', type: 'warning' }, { text: '注意脚下', type: 'warning' }] },
        { text: '出车厢，找出口', detail: 'B口出站', aiText: '已下车，前方是站台。请向右侧走，B口出站方向有指示牌和盲道指引。', aiTags: [{ text: 'B口', type: '' }, { text: '右侧', type: '' }, { text: '出站', type: '' }] },
        { text: '上楼梯/乘电梯出站', detail: '右侧有直梯', aiText: '前方有出站楼梯，共24级台阶。如果需要乘直梯，请向右走约10米，有无障碍电梯。', aiTags: [{ text: '24级台阶', type: '' }, { text: '右侧直梯', type: '' }, { text: '出站', type: '' }] },
        { text: '出站后向前走', detail: '前方50米是' + dest, aiText: '已出站，正前方约50米就是' + dest + '，请沿人行道向前走。', aiTags: [{ text: dest, type: '' }, { text: '前方50米', type: '' }, { text: '继续前行', type: '' }] },
        { text: '找入口，到达门口', detail: '入口在正前方', aiText: '正前方是' + dest + '的入口，是玻璃大门，门口有台阶和无障碍坡道。', aiTags: [{ text: '入口', type: '' }, { text: '正前方', type: '' }, { text: '无障碍', type: '' }] },
        { text: '🎉 已到达目的地', detail: '导航结束，祝您愉快', aiText: '恭喜您已到达' + dest + '，导航结束。如需帮助请随时唤醒我。', aiTags: [{ text: '到达', type: '' }, { text: '导航结束', type: '' }, { text: '⭐', type: '' }], isFinal: true }
      ];
    } else if (travelMode === 'brt') {
      steps = [
        { text: '已到站，请下车', detail: '屏蔽门和车门已打开', aiText: 'BRT车辆已靠站停稳，屏蔽门和车门正在打开。请从后门下车，注意站台与车辆间隙。', aiTags: [{ text: '下车', type: '' }, { text: '后门', type: '' }, { text: '⚠️ 间隙', type: 'warning' }] },
        { text: '出站，找出口', detail: '前方是出站口', aiText: '已下车，前方就是出站闸机。请刷卡或投币出站，出站后是人行天桥或地下通道。', aiTags: [{ text: '出站闸机', type: '' }, { text: '前方', type: '' }, { text: '刷卡出站', type: '' }] },
        { text: '下天桥/过通道', detail: '注意脚下台阶', aiText: '正在通过人行天桥/地下通道，请注意脚下台阶，扶好扶手。下完台阶后就是人行道。', aiTags: [{ text: '⚠️ 台阶', type: 'warning' }, { text: '扶好扶手', type: '' }, { text: '注意安全', type: 'warning' }] },
        { text: '向前走，找' + dest, detail: '前方50米', aiText: '已到达人行道，正前方约50米就是' + dest + '，请沿盲道向前走。', aiTags: [{ text: dest, type: '' }, { text: '前方50米', type: '' }, { text: '继续前行', type: '' }] },
        { text: '到达门口，找门把手', detail: '入口在正前方', aiText: '已到达' + dest + '门口，入口在正前方，是双开玻璃门，门把手在中间两侧。', aiTags: [{ text: '门口', type: '' }, { text: '正前方', type: '' }, { text: '玻璃门', type: '' }] },
        { text: '🎉 已到达目的地', detail: '导航结束，祝您愉快', aiText: '恭喜您已到达' + dest + '，导航结束。如需帮助请随时唤醒我。', aiTags: [{ text: '到达', type: '' }, { text: '导航结束', type: '' }, { text: '⭐', type: '' }], isFinal: true }
      ];
    } else if (dest.includes('医院')) {
      steps = [
        { text: '到达医院附近', detail: '前方50米是医院门诊楼', aiText: '检测到前方50米处是医院门诊楼，大楼很高，有医院标识，继续向前走。', aiTags: [{ text: '医院', type: '' }, { text: '前方50米', type: '' }, { text: '门诊楼', type: '' }] },
        { text: '向前走，找门诊入口', detail: '入口在正前方', aiText: '正前方是医院门诊入口，有台阶和无障碍坡道，继续向前走。', aiTags: [{ text: '门诊入口', type: '' }, { text: '正前方', type: '' }, { text: '继续前行', type: '' }] },
        { text: '到达门口，找门把手', detail: '双开玻璃门，门把手在两侧', aiText: '已到达门诊大门，是双开玻璃门，门把手在门中间两侧，高度约1米，向外推开。', aiTags: [{ text: '门把手', type: '' }, { text: '两侧', type: '' }, { text: '向外推', type: '' }] },
        { text: '推开门，进入大厅', detail: '注意脚下门槛', aiText: '门向外推开，请稍侧身进入。进门后注意脚下有轻微门槛，小心绊倒。', aiTags: [{ text: '⚠️ 门槛', type: 'warning' }, { text: '推门进入', type: '' }, { text: '注意脚下', type: 'warning' }] },
        { text: '进门直行，导诊台在前方', detail: '有工作人员可以咨询', aiText: '进门后直行约10米是导诊台，有工作人员在岗，可以咨询挂号和科室位置。', aiTags: [{ text: '导诊台', type: '' }, { text: '前方10米', type: '' }, { text: '可咨询', type: '' }] },
        { text: '🎉 已到达医院', detail: '导航结束，祝您顺利', aiText: '恭喜您已到达医院门诊大厅，导航结束。如需帮助请随时唤醒我。', aiTags: [{ text: '到达', type: '' }, { text: '导航结束', type: '' }, { text: '⭐', type: '' }], isFinal: true }
      ];
    } else if (dest.includes('商场') || dest.includes('万达') || dest.includes('超市')) {
      steps = [
        { text: '到达商场附近', detail: '前方50米是商场入口', aiText: '检测到前方50米处是商场，有明显的商场招牌，继续向前走。', aiTags: [{ text: '商场', type: '' }, { text: '前方50米', type: '' }, { text: '继续前行', type: '' }] },
        { text: '向前走，找入口', detail: '1号门在正前方', aiText: '正前方是商场1号门，是自动感应玻璃门，门宽约3米，继续向前走。', aiTags: [{ text: '1号门', type: '' }, { text: '自动门', type: '' }, { text: '正前方', type: '' }] },
        { text: '到达门口，等待门开', detail: '自动感应门，稍等片刻', aiText: '已到达商场入口，是自动感应玻璃门，门正在缓慢开启，请稍等后直行进入。', aiTags: [{ text: '自动门', type: '' }, { text: '等待开启', type: '' }, { text: '直行进入', type: '' }] },
        { text: '进门，注意脚下台阶', detail: '进门有一级小台阶', aiText: '进门成功，地面有一级小台阶向下，高约5厘米，请抬脚小心。', aiTags: [{ text: '⚠️ 台阶', type: 'warning' }, { text: '5厘米', type: '' }, { text: '小心抬脚', type: 'warning' }] },
        { text: '服务台在左手边', detail: '可以咨询店铺位置', aiText: '进门后左手边5米是服务台，有工作人员在岗，可以咨询店铺位置和活动信息。', aiTags: [{ text: '服务台', type: '' }, { text: '左手边', type: '' }, { text: '可咨询', type: '' }] },
        { text: '🎉 已到达商场', detail: '导航结束，祝您愉快', aiText: '恭喜您已到达商场内，导航结束。如需帮助请随时唤醒我。', aiTags: [{ text: '到达', type: '' }, { text: '导航结束', type: '' }, { text: '⭐', type: '' }], isFinal: true }
      ];
    } else if (dest.includes('地铁') || dest.includes('火车')) {
      steps = [
        { text: '到达地铁站附近', detail: '前方50米是地铁站', aiText: '检测到前方50米处是地铁站入口，有地铁标识，继续向前走。', aiTags: [{ text: '地铁站', type: '' }, { text: '前方50米', type: '' }, { text: '继续前行', type: '' }] },
        { text: '向前走，找A口', detail: 'A口在左前方', aiText: '左前方是地铁站A口，向下走有台阶，右侧有无障碍电梯，继续向前走。', aiTags: [{ text: 'A口', type: '' }, { text: '左前方', type: '' }, { text: '向下', type: '' }] },
        { text: '到达入口，下台阶', detail: '有5级台阶，左侧有扶手', aiText: '已到达地铁站入口，向下走5级台阶后是站厅层。台阶左侧有扶手，高度约90厘米。', aiTags: [{ text: '5级台阶', type: '' }, { text: '左侧扶手', type: '' }, { text: '向下走', type: '' }] },
        { text: '下完台阶，找闸机', detail: '闸机在正前方', aiText: '下完台阶了，正前方是进站闸机，请准备好交通卡或手机扫码。', aiTags: [{ text: '闸机', type: '' }, { text: '正前方', type: '' }, { text: '准备刷卡', type: '' }] },
        { text: '过闸机，进入站厅', detail: '右侧有人工窗口', aiText: '通过闸机后进入站厅，右侧有人工售票窗口和客服中心，有问题可以咨询。', aiTags: [{ text: '站厅', type: '' }, { text: '客服中心', type: '' }, { text: '右侧', type: '' }] },
        { text: '🎉 已到达地铁站', detail: '导航结束，祝您一路顺风', aiText: '恭喜您已到达地铁站站厅，导航结束。乘车请注意安全，如需帮助请随时唤醒我。', aiTags: [{ text: '到达', type: '' }, { text: '导航结束', type: '' }, { text: '⭐', type: '' }], isFinal: true }
      ];
    } else if (dest.includes('公交')) {
      steps = [
        { text: '到达公交站附近', detail: '前方30米是公交站', aiText: '检测到前方30米处是公交站台，有站牌和遮雨棚，继续向前走。', aiTags: [{ text: '公交站', type: '' }, { text: '前方30米', type: '' }, { text: '继续前行', type: '' }] },
        { text: '向前走到站台', detail: '注意来车', aiText: '正前方是公交站台，上站台前注意左右来车，小心通过。', aiTags: [{ text: '注意来车', type: 'warning' }, { text: '站台前方', type: '' }, { text: '小心通过', type: 'warning' }] },
        { text: '上站台，找站牌', detail: '站牌在右手边', aiText: '已到达站台上，站牌在您右手边1米处，上面有线路信息和停靠站点。', aiTags: [{ text: '站牌', type: '' }, { text: '右手边', type: '' }, { text: '1米处', type: '' }] },
        { text: '找到候车区', detail: '站在安全线内', aiText: '站台地面有黄色盲道砖，通向候车区。请站在黄色安全线以内候车，注意安全。', aiTags: [{ text: '安全线', type: '' }, { text: '盲道砖', type: '' }, { text: '安全候车', type: '' }] },
        { text: '等待公交车', detail: '有座椅可以休息', aiText: '站台上有座椅，在您左后方2米处，如果累了可以坐下休息等车。', aiTags: [{ text: '座椅', type: '' }, { text: '左后方', type: '' }, { text: '可休息', type: '' }] },
        { text: '🎉 已到达公交站', detail: '导航结束，等车注意安全', aiText: '恭喜您已到达公交站台，导航结束。等车时请注意安全，车辆进站请注意辨别。', aiTags: [{ text: '到达', type: '' }, { text: '导航结束', type: '' }, { text: '⭐', type: '' }], isFinal: true }
      ];
    } else {
      steps = [
        { text: '到达目标区域', detail: '前方50米是' + dest, aiText: '检测到前方50米处是' + dest + '，建筑外观清晰可见，继续向前走。', aiTags: [{ text: dest, type: '' }, { text: '前方50米', type: '' }, { text: '继续前行', type: '' }] },
        { text: '向前走，找入口', detail: '入口在正前方', aiText: '正前方是' + dest + '的入口，是玻璃大门，继续向前走约15步。', aiTags: [{ text: '入口', type: '' }, { text: '正前方', type: '' }, { text: '15步', type: '' }] },
        { text: '到达门口，找门把手', detail: '门把手在右侧', aiText: '已到达门口，右侧有金属门把手，高度约1米，门向内开启。请伸手找到门把手。', aiTags: [{ text: '门把手', type: '' }, { text: '右侧', type: '' }, { text: '向内开', type: '' }] },
        { text: '推开门，进入室内', detail: '门向内推', aiText: '握住门把手向内推门，门打开后请侧身进入，注意门边缘。', aiTags: [{ text: '推门进入', type: '' }, { text: '向内推', type: '' }, { text: '注意安全', type: '' }] },
        { text: '进门后注意观察', detail: '有问题可以问工作人员', aiText: '进门成功，前方宽敞明亮。如果找不到目的地，可以向周围工作人员咨询。', aiTags: [{ text: '进门成功', type: '' }, { text: '可咨询', type: '' }, { text: '注意安全', type: '' }] },
        { text: '🎉 已到达目的地', detail: '导航结束，祝您愉快', aiText: '恭喜您已到达' + dest + '，导航结束。如需帮助请随时唤醒我。', aiTags: [{ text: '到达', type: '' }, { text: '导航结束', type: '' }, { text: '⭐', type: '' }], isFinal: true }
      ];
    }

    return steps;
  }

  // ========== 工具函数 ==========
  // 语音优先级策略（数字越小优先级越高）：
  //   critical(0) 导航关键节点 / 紧急呼叫
  //   high(1)     危险预警
  //   normal(2)   常规播报（默认）
  //   low(3)      摄像头场景识别等可丢弃内容
  // 打断规则：新消息优先级 <= 当前优先级 即可立即打断（避免排队延迟）
  //         仅 low 在更高优先级播报时进入队列且溢出丢弃
  let speechReady = false;
  function speak(text, priority = 'normal') {
    try {
      if (userRole === 'family') return;
      if (!text || typeof text !== 'string') return;
      lastSpeech = text;
      if (!('speechSynthesis' in window)) return;

      if (isDuplicateSpeech(text, priority) && priority !== 'critical' && priority !== 'high') {
        return;
      }
      updateSpeakDedup(text);

      const priorityMap = { critical: 0, high: 1, normal: 2, low: 3 };
      const newPriority = priorityMap[priority] !== undefined ? priorityMap[priority] : 2;

      if (window.speechSynthesis.speaking) {
        const currentPrio = priorityMap[currentSpeechPriority] !== undefined
          ? priorityMap[currentSpeechPriority] : 2;
        if (newPriority <= currentPrio) {
          speechQueue = [];
          doSpeak(text, priority);
          return;
        }
        if (priority === 'low') {
          if (speechQueue.length >= 2) return;
          const lastLowIdx = speechQueue.map(function(i){return i.priority;}).lastIndexOf('low');
          if (lastLowIdx >= 0) speechQueue.splice(lastLowIdx, 1);
          addSpeechQueue(text, priority);
          return;
        }
        if (priority === 'normal' && speechQueue.length >= 3) {
          const firstNormalIdx = speechQueue.map(function(i){return i.priority;}).indexOf('normal');
          if (firstNormalIdx >= 0) speechQueue.splice(firstNormalIdx, 1);
        }
        addSpeechQueue(text, priority);
        return;
      }

      doSpeak(text, priority);
    } catch (e) {
      console.error('[speak错误]', e.message);
    }
  }

  let currentSpeechPriority = 'normal';
  let speechQueue = [];
  let speechKeepAliveTimer = null;

  function addSpeechQueue(text, priority) {
    speechQueue.push({ text: text, priority: priority });
    // 按优先级排序（critical 在前）
    speechQueue.sort(function(a, b) {
      const map = { critical: 0, high: 1, normal: 2, low: 3 };
      return (map[a.priority] || 2) - (map[b.priority] || 2);
    });
  }

  function doSpeak(text, priority) {
    currentSpeechPriority = priority;
    // 先 resume 一下，避免 Chrome 把队列卡在暂停状态
    try { window.speechSynthesis.resume(); } catch (e) {}
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = speechRate;
    utterance.pitch = 1.0;
    // 提高音量到 1，避免某些引擎默认音量过低触发额外处理
    utterance.volume = 1;
    utterance.onstart = function() {
      speechReady = true;
      // Chrome bug: 长时间播报会自动暂停，3秒 resume 一次保活
      if (speechKeepAliveTimer) clearInterval(speechKeepAliveTimer);
      speechKeepAliveTimer = setInterval(function() {
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.resume();
        } else {
          clearInterval(speechKeepAliveTimer);
          speechKeepAliveTimer = null;
        }
      }, 3000);
    };
    utterance.onend = function() {
      if (speechKeepAliveTimer) { clearInterval(speechKeepAliveTimer); speechKeepAliveTimer = null; }
      currentSpeechPriority = 'normal';
      // 播报结束，播放队列中下一条
      if (speechQueue.length > 0) {
        const next = speechQueue.shift();
        doSpeak(next.text, next.priority);
      }
    };
    utterance.onerror = function() {
      if (speechKeepAliveTimer) { clearInterval(speechKeepAliveTimer); speechKeepAliveTimer = null; }
      currentSpeechPriority = 'normal';
      if (speechQueue.length > 0) {
        const next = speechQueue.shift();
        doSpeak(next.text, next.priority);
      }
    };
    window.speechSynthesis.speak(utterance);
  }

  // 预热语音引擎，减少首次播报延迟
  // 用真实中文短句预热，让引擎真正加载中文语音库
  function warmUpSpeech() {
    if (!('speechSynthesis' in window)) return;
    try {
      // 静音预热一次：加载中文语音
      const u = new SpeechSynthesisUtterance('你好');
      u.lang = 'zh-CN';
      u.volume = 0;
      u.rate = 1.5; // 加快预热速度
      u.onend = function() { speechReady = true; };
      window.speechSynthesis.speak(u);
    } catch (e) {}
  }

  function triggerHaptic(type = 'light') {
    try {
      if (navigator && navigator.vibrate) {
        const patterns = {
          light: 50,
          medium: 100,
          heavy: 200,
          double: [50, 50, 50],
          triple: [50, 50, 50, 50, 50]
        };
        navigator.vibrate(patterns[type] || 50);
      }
    } catch (e) {
      console.error('[triggerHaptic错误]', e.message);
    }
  }

  let feedbackTimer = null;
  function showFeedback(text, type = 'info') {
    try {
      const el = document.getElementById('gestureFeedback');
      if (!el) return;
      el.textContent = text;
      el.className = 'gesture-feedback show ' + type;
      
      if (feedbackTimer) {
        clearTimeout(feedbackTimer);
        feedbackTimer = null;
      }
      feedbackTimer = setTimeout(function() {
        if (el) el.classList.remove('show');
        feedbackTimer = null;
      }, 1500);
    } catch (e) {
      console.error('[showFeedback错误]', e.message);
    }
  }

  function formatTime() {
    const now = new Date();
    return now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0');
  }

  // ========== 页面切换 ==========
  function showScreen(screenName) {
    try {
      if (screenName === 'wake' && isNavigating) {
        endNavigation();
      }
      
      const screens = ['wakeScreen', 'routeScreen', 'navScreen', 'arrivalScreen', 'communityScreen', 'familyScreen', 'myScreen', 'accountScreen', 'loginScreen', 'registerScreen', 'messageScreen', 'postDetailScreen', 'wardDetailScreen', 'wardListScreen', 'messageDetailScreen', 'fenceManagementScreen', 'guardianSettingsScreen', 'commonAddressesScreen', 'helpFeedbackScreen', 'favoritesScreen', 'myFavoritesScreen', 'travelHistoryScreen', 'changePasswordScreen', 'dataExportScreen', 'userAgreementScreen', 'privacyPolicyScreen', 'forgotPasswordScreen', 'fenceDetailScreen', 'familyLocationScreen', 'settingsScreen', 'realNameScreen', 'emergencyContactsScreen', 'inviteFamilyScreen', 'safetyScreen'];
      screens.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.classList.remove('active');
          el.style.display = 'none';
        }
      });
      
      const targetId = screenName + 'Screen';
      const target = document.getElementById(targetId);
      if (target) {
        target.classList.add('active');
        target.style.display = 'flex';
        currentScreen = screenName;
      }

      const tabBar = document.getElementById('tabBar');
      if (tabBar) {
        if (screenName === 'community' || screenName === 'family' || screenName === 'my' || screenName === 'account') {
          tabBar.style.setProperty('display', 'flex', 'important');
        } else {
          tabBar.style.setProperty('display', 'none', 'important');
        }
      }

      if (screenName === 'wake') {
        closeWakeSearch();
        ensureNearbyStationsPreview();
        updateNearbyStationsPreview();
        startNearbyStationTimers();
      }

      if (screenName === 'route') {
        var listEl = document.getElementById('routeList');
        if (listEl && listEl.children.length === 0) {
          renderRouteList();
        }
      }
    } catch (e) {
      console.error('[showScreen错误]', e.message);
    }
  }

  function switchTab(tab) {
    // 家人模式下，首页Tab不存在，跳转到守护中心
    if (userRole === 'family' && tab === 'home') {
      tab = 'family';
    }
    currentTab = tab;
    document.querySelectorAll('.tab-item').forEach(item => item.classList.remove('active'));
    const tabEl = document.getElementById('tab' + tab.charAt(0).toUpperCase() + tab.slice(1));
    if (tabEl) tabEl.classList.add('active');

    if (tab === 'home') {
      showScreen('wake');
    } else if (tab === 'my') {
      // 底部Tab"我的"显示个人中心页面（大头像、快捷入口、数据卡片）
      showAccountInfo();
      showScreen('account');
    } else if (tab === 'community') {
      showScreen('community');
      loadCommunityFeed('feed');
    } else if (tab === 'family') {
      showScreen('family');
    }
    triggerHaptic('light');
  }

  function backToHome() {
    if (isNavigating) {
      endNavigation();
    }
    // 家人模式下回到守护中心，视障模式下回到唤醒页
    if (userRole === 'family') {
      showScreen('family');
      switchTab('family');
    } else {
      showScreen('wake');
    }
    triggerHaptic('light');
  }

  // ========== 唤醒页功能 ==========
  let isListening = false;
  let voiceTimer = null;

  function toggleVoiceWake() {
    if (userRole === 'family') {
      showFeedback('家人模式不支持语音导航', 'info');
      return;
    }
    const btn = document.getElementById('wakeVoiceBtn');
    const mainBtn = btn.querySelector('.wake-voice-btn-main');

    if (!isListening) {
      isListening = true;
      btn.classList.add('listening');
      mainBtn.classList.add('listening');
      speak('你好，我是瞳伴，请问你要去哪里？或者说打开摄像头查看周围环境');
      showFeedback('正在聆听...', 'info');

      voiceTimer = setTimeout(() => {
        stopVoiceWake();
        var rand = Math.random();
        if (rand < 0.3) {
          openCamera();
          speak('已为您打开摄像头');
        } else {
          openWakeSearch();
          setTimeout(() => {
            document.getElementById('wakeSearchInput').value = '星巴克咖啡';
            handleSearchInput('星巴克咖啡');
          }, 500);
        }
      }, 3500);
    } else {
      stopVoiceWake();
    }
    triggerHaptic('light');
  }

  function stopVoiceWake() {
    isListening = false;
    const btn = document.getElementById('wakeVoiceBtn');
    const mainBtn = btn.querySelector('.wake-voice-btn-main');
    btn.classList.remove('listening');
    mainBtn.classList.remove('listening');
    if (voiceTimer) clearTimeout(voiceTimer);
  }

  function openWakeSearch() {
    // 家人模式不支持目的地搜索
    if (userRole === 'family') {
      showFeedback('家人模式不支持目的地搜索', 'info');
      return;
    }
    document.getElementById('wakeSearchOverlay').style.display = 'flex';
    document.getElementById('wakeSearchInput').focus();
    ensureNearbyStations();
    startNearbyStationTimers();
    updateNearbyStationDisplay();
  }

  function closeWakeSearch() {
    document.getElementById('wakeSearchOverlay').style.display = 'none';
    document.getElementById('wakeSearchInput').value = '';
    document.getElementById('wakeSearchResults').style.display = 'none';
    stopVoiceSearch();
    stopNearbyStationTimers();
  }

  function ensureNearbyStations() {
    var container = document.getElementById('nearbyStationsContainer');
    if (container) return;
    var resultsEl = document.getElementById('wakeSearchResults');
    if (!resultsEl) return;
    var parent = resultsEl.parentNode;
    container = document.createElement('div');
    container.id = 'nearbyStationsContainer';
    container.style.cssText = 'margin-top:8px;';
    var title = document.createElement('div');
    title.id = 'nearbyStationsTitle';
    title.textContent = '附近站点';
    title.style.cssText = 'font-size:14px;color:#8E8E93;padding:8px 16px 6px;display:flex;align-items:center;gap:6px;';
    var list = document.createElement('div');
    list.id = 'nearbyStationsList';
    list.style.cssText = 'max-height:240px;overflow-y:auto;';
    container.appendChild(title);
    container.appendChild(list);
    parent.insertBefore(container, resultsEl);
  }

  const searchSuggestions = [
    { name: '星巴克咖啡', icon: '☕', address: '距您1.0公里 · 步行15分钟' },
    { name: '人民医院', icon: '🏥', address: '距您2.5公里 · 公交25分钟' },
    { name: '万达广场', icon: '🏬', address: '距您3.0公里 · 地铁20分钟' },
    { name: '火车站', icon: '🚉', address: '距您5.0公里 · 地铁25分钟' },
    { name: '人民广场地铁站', icon: '🚇', address: '距您0.5公里 · 步行8分钟' },
    { name: '超市', icon: '🛒', address: '距您0.8公里 · 步行12分钟' }
  ];

  const nearbyStations = [
    {
      id: 'bus_renmin',
      name: '人民广场公交站',
      type: 'bus',
      icon: '🚌',
      distance: '50米',
      distanceMeters: 50,
      lines: [
        { name: '302路', direction: '开往火车站', arrivals: [{ min: 2, sec: 15 }, { min: 8, sec: 30 }, { min: 15, sec: 0 }] },
        { name: '108路', direction: '开往文化宫', arrivals: [{ min: 1, sec: 40 }, { min: 6, sec: 10 }, { min: 12, sec: 45 }] },
        { name: '5路', direction: '开往解放广场', arrivals: [{ min: 4, sec: 20 }, { min: 10, sec: 5 }, { min: 18, sec: 30 }] },
        { name: '12路', direction: '开往机场', arrivals: [{ min: 7, sec: 55 }, { min: 14, sec: 20 }, { min: 22, sec: 0 }] }
      ]
    },
    {
      id: 'metro_renmin',
      name: '人民广场地铁站',
      type: 'metro',
      icon: '🚇',
      distance: '100米',
      distanceMeters: 100,
      lines: [
        { name: '1号线', direction: '开往火车站', arrivals: [{ min: 1, sec: 20 }, { min: 4, sec: 50 }, { min: 8, sec: 30 }] },
        { name: '2号线', direction: '开往机场', arrivals: [{ min: 3, sec: 5 }, { min: 7, sec: 15 }, { min: 12, sec: 40 }] },
        { name: '8号线', direction: '开往大学城', arrivals: [{ min: 2, sec: 45 }, { min: 6, sec: 10 }, { min: 10, sec: 25 }] }
      ]
    },
    {
      id: 'brt_renmin',
      name: '人民广场BRT站',
      type: 'brt',
      icon: '🚈',
      distance: '150米',
      distanceMeters: 150,
      lines: [
        { name: 'B1路', direction: '开往火车站', arrivals: [{ min: 3, sec: 10 }, { min: 7, sec: 40 }, { min: 12, sec: 0 }] },
        { name: 'B2路', direction: '开往开发区', arrivals: [{ min: 5, sec: 25 }, { min: 10, sec: 15 }, { min: 16, sec: 50 }] }
      ]
    },
    {
      id: 'bus_wenhua',
      name: '文化宫公交站',
      type: 'bus',
      icon: '🚌',
      distance: '300米',
      distanceMeters: 300,
      lines: [
        { name: '18路', direction: '开往人民广场', arrivals: [{ min: 2, sec: 30 }, { min: 7, sec: 50 }, { min: 14, sec: 10 }] },
        { name: '25路', direction: '开往火车站', arrivals: [{ min: 4, sec: 15 }, { min: 9, sec: 30 }, { min: 16, sec: 45 }] },
        { name: '33路', direction: '开往大学城', arrivals: [{ min: 6, sec: 40 }, { min: 11, sec: 20 }, { min: 20, sec: 5 }] }
      ]
    },
    {
      id: 'metro_jiefang',
      name: '解放广场地铁站',
      type: 'metro',
      icon: '🚇',
      distance: '500米',
      distanceMeters: 500,
      lines: [
        { name: '3号线', direction: '开往火车站', arrivals: [{ min: 3, sec: 50 }, { min: 8, sec: 20 }, { min: 13, sec: 45 }] }
      ]
    }
  ];

  let nearbyStationTimers = {};
  let nearbyStationActive = false;

  function startNearbyStationTimers() {
    if (nearbyStationActive) return;
    nearbyStationActive = true;
    nearbyStations.forEach(station => {
      station.lines.forEach(line => {
        line.arrivals.forEach(arr => {
          arr.totalSeconds = arr.min * 60 + arr.sec;
        });
      });
    });
    nearbyStationTimers.main = safeSetInterval(function() {
      try {
        nearbyStations.forEach(station => {
          station.lines.forEach(line => {
            line.arrivals.forEach(arr => {
              if (arr.totalSeconds > 0) {
                arr.totalSeconds--;
                arr.min = Math.floor(arr.totalSeconds / 60);
                arr.sec = arr.totalSeconds % 60;
              }
            });
            while (line.arrivals.length > 0 && line.arrivals[0].totalSeconds <= 0) {
              line.arrivals.shift();
              const lastArr = line.arrivals[line.arrivals.length - 1];
              if (lastArr) {
                const newMin = lastArr.min + 5 + Math.floor(Math.random() * 10);
                line.arrivals.push({ min: newMin, sec: Math.floor(Math.random() * 60), totalSeconds: newMin * 60 + Math.floor(Math.random() * 60) });
              }
            }
          });
        });
        updateNearbyStationDisplay();
        updateNearbyStationsPreview();
      } catch (e) {
        console.error('[nearbyStationTick错误]', e.message);
      }
    }, 1000, 'nearby_stations');
  }

  function stopNearbyStationTimers() {
    if (!nearbyStationActive) return;
    nearbyStationActive = false;
    if (nearbyStationTimers.main) {
      safeClearInterval(nearbyStationTimers.main);
      nearbyStationTimers.main = null;
    }
  }

  function formatArrivalTime(arr) {
    if (arr.totalSeconds <= 0) return '即将到站';
    if (arr.totalSeconds < 60) return arr.totalSeconds + '秒';
    const mins = arr.min;
    const secs = arr.sec;
    if (secs === 0) return mins + '分钟';
    return mins + '分' + secs + '秒';
  }

  function updateNearbyStationDisplay() {
    const container = document.getElementById('nearbyStationsList');
    if (!container) return;
    const expandedId = container.getAttribute('data-expanded');
    container.innerHTML = nearbyStations.map((station, si) => {
      const isExpanded = expandedId === station.id;
      const fastestLine = station.lines.reduce((fastest, line) => {
        const t = line.arrivals[0] ? line.arrivals[0].totalSeconds : 9999;
        return t < fastest.t ? { name: line.name, t: t } : fastest;
      }, { name: '', t: 9999 });
      const fastestTime = fastestLine.t < 9999 ? formatArrivalTime({ totalSeconds: fastestLine.t, min: Math.floor(fastestLine.t / 60), sec: fastestLine.t % 60 }) : '--';
      return `
        <div class="nearby-station-item" data-station-id="${station.id}" onclick="toggleNearbyStation('${station.id}')" role="button" tabindex="0" aria-label="${station.name}，${station.lines.length}条线路，最近一班${fastestLine.name}还有${fastestTime}，距离${station.distance}">
          <div class="nearby-station-header">
            <div class="nearby-station-icon">${station.icon}</div>
            <div class="nearby-station-info">
              <div class="nearby-station-name">${station.name}</div>
              <div class="nearby-station-meta">${station.lines.length}条线路 · ${station.distance}</div>
            </div>
            <div class="nearby-station-fastest">
              <span class="nearby-station-fastest-time">${fastestTime}</span>
              <span class="nearby-station-fastest-line">${fastestLine.name}</span>
            </div>
          </div>
          ${isExpanded ? `
            <div class="nearby-station-lines">
              ${station.lines.map(line => `
                <div class="nearby-line-item" onclick="event.stopPropagation(); navigateToStation('${station.name}', '${station.type}')" role="button" tabindex="0" aria-label="乘坐${line.name}，${line.direction}，还有${formatArrivalTime(line.arrivals[0])}，点击导航到${station.name}">
                  <div class="nearby-line-name">${line.name}</div>
                  <div class="nearby-line-direction">${line.direction}</div>
                  <div class="nearby-line-arrivals">
                    ${line.arrivals.slice(0, 3).map((arr, i) => `
                      <span class="nearby-line-arrival ${i === 0 ? 'first' : ''}">${formatArrivalTime(arr)}</span>
                    `).join('')}
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
  }

  function toggleNearbyStation(stationId) {
    const container = document.getElementById('nearbyStationsList');
    if (!container) return;
    const current = container.getAttribute('data-expanded');
    if (current === stationId) {
      container.removeAttribute('data-expanded');
    } else {
      container.setAttribute('data-expanded', stationId);
      const station = nearbyStations.find(s => s.id === stationId);
      if (station) {
        const fastest = station.lines.reduce((f, l) => {
          const t = l.arrivals[0] ? l.arrivals[0].totalSeconds : 9999;
          return t < f.t ? { name: l.name, t: t, dir: l.direction } : f;
        }, { name: '', t: 9999, dir: '' });
        speak(`${station.name}，${station.lines.length}条线路，最近一班${fastest.name}，${fastest.dir}，还有${formatArrivalTime({ totalSeconds: fastest.t, min: Math.floor(fastest.t / 60), sec: fastest.t % 60 })}`);
      }
    }
    updateNearbyStationDisplay();
    triggerHaptic('light');
  }

  function navigateToStation(stationName, stationType) {
    closeWakeSearch();
    selectedDestination = stationName;
    selectedMode = 'transit';
    selectedTransportType = stationType;
    localStorage.setItem('selectedDestination', selectedDestination);
    localStorage.setItem('selectedMode', selectedMode);
    showScreen('route');
    renderRouteList();
    speak('已选择' + stationName + '，正在规划路线');
    triggerHaptic('medium');
  }

  function ensureNearbyStationsPreview() {
    var wakeScreen = document.getElementById('wakeScreen');
    if (!wakeScreen) return;
    var existing = document.getElementById('nearbyStationsPreview');
    if (existing) return;
    var voiceContainer = wakeScreen.querySelector('.wake-voice-container');
    if (!voiceContainer) return;
    var preview = document.createElement('div');
    preview.id = 'nearbyStationsPreview';
    preview.style.cssText = 'margin: 0 16px 16px; flex-shrink: 0;';
    preview.innerHTML = '<div style="font-size:13px;color:#8E8E93;margin-bottom:8px;font-weight:500;">附近站点</div><div id="nearbyPreviewList"></div>';
    wakeScreen.insertBefore(preview, voiceContainer);
  }

  function updateNearbyStationsPreview() {
    var listEl = document.getElementById('nearbyPreviewList');
    if (!listEl) return;
    var top3 = nearbyStations.slice(0, 3);
    listEl.innerHTML = top3.map(function(station) {
      var fastest = station.lines.reduce(function(f, line) {
        var t = line.arrivals[0] ? line.arrivals[0].totalSeconds : 9999;
        return t < f.t ? { name: line.name, t: t } : f;
      }, { name: '', t: 9999 });
      var timeText = fastest.t < 9999 ? (fastest.t < 60 ? fastest.t + '秒' : Math.ceil(fastest.t / 60) + '分钟') : '--';
      return '<div class="nearby-preview-item" onclick="openWakeSearch()" role="button" tabindex="0" aria-label="' + station.name + '，最近一班' + fastest.name + '还有' + timeText + '，距离' + station.distance + '">' +
        '<div class="nearby-preview-icon">' + station.icon + '</div>' +
        '<div class="nearby-preview-info">' +
          '<div class="nearby-preview-name">' + station.name + '</div>' +
          '<div class="nearby-preview-meta">' + station.lines.length + '条线路 · ' + station.distance + '</div>' +
        '</div>' +
        '<div class="nearby-preview-time">' +
          '<span class="nearby-preview-time-num">' + timeText + '</span>' +
          '<span class="nearby-preview-time-line">' + fastest.name + '</span>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  function handleSearchInput(value) {
    const resultsEl = document.getElementById('wakeSearchResults');
    if (!value.trim()) {
      resultsEl.style.display = 'none';
      return;
    }
    
    const filtered = searchSuggestions.filter(s => 
      s.name.toLowerCase().includes(value.toLowerCase())
    );
    
    if (filtered.length === 0) {
      resultsEl.innerHTML = '<div style="padding:40px;text-align:center;color:#999;">暂无搜索结果</div>';
    } else {
      resultsEl.innerHTML = filtered.map(s => `
        <div class="wake-search-item" onclick="selectDestination('${s.name}')">
          <div class="wake-search-item-icon">${s.icon}</div>
          <div class="wake-search-item-info">
            <div class="wake-search-item-name">${s.name}</div>
            <div class="wake-search-item-addr">${s.address}</div>
          </div>
          <div class="wake-search-item-arrow">›</div>
        </div>
      `).join('');
    }
    resultsEl.style.display = 'block';
  }

  let isVoiceSearching = false;
  let voiceSearchTimer = null;

  function toggleVoiceSearch(e) {
    if (e) e.stopPropagation();
    const btn = document.getElementById('wakeSearchVoiceBtn');
    
    if (!isVoiceSearching) {
      isVoiceSearching = true;
      btn.classList.add('listening');
      showFeedback('正在聆听...', 'info');
      speak('请说出目的地');
      
      voiceSearchTimer = setTimeout(() => {
        stopVoiceSearch();
        document.getElementById('wakeSearchInput').value = '星巴克咖啡';
        handleSearchInput('星巴克咖啡');
      }, 2000);
    } else {
      stopVoiceSearch();
    }
    triggerHaptic('light');
  }

  function stopVoiceSearch() {
    isVoiceSearching = false;
    const btn = document.getElementById('wakeSearchVoiceBtn');
    if (btn) btn.classList.remove('listening');
    if (voiceSearchTimer) clearTimeout(voiceSearchTimer);
  }

  var wakeSearchIndex = -1;
  var wakeSearchList = [];

  function selectDestination(name) {
    selectedDestination = name;
    speak('已选择' + name + '，正在规划路线');
    announce('已选择' + name);
    triggerHaptic('medium');
    closeWakeSearch();
    goToRoutePlanning(name);
  }

  function handleWakeSearchKeydown(e) {
    var resultsEl = document.getElementById('wakeSearchResults');
    if (!resultsEl || resultsEl.style.display === 'none') return;
    if (!wakeSearchList || wakeSearchList.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      navigateWakeSearch(1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      navigateWakeSearch(-1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      selectCurrentWakeSearch();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeWakeSearch();
    }
  }

  function navigateWakeSearch(direction) {
    if (!wakeSearchList || wakeSearchList.length === 0) return;
    var items = document.querySelectorAll('#wakeSearchResults .wake-search-item');
    if (wakeSearchIndex >= 0) {
      items[wakeSearchIndex].classList.remove('selected');
      items[wakeSearchIndex].setAttribute('aria-selected', 'false');
    }
    wakeSearchIndex += direction;
    if (wakeSearchIndex < 0) {
      wakeSearchIndex = wakeSearchList.length - 1;
    } else if (wakeSearchIndex >= wakeSearchList.length) {
      wakeSearchIndex = 0;
    }
    items[wakeSearchIndex].classList.add('selected');
    items[wakeSearchIndex].setAttribute('aria-selected', 'true');
    items[wakeSearchIndex].id = 'wake-suggestion-' + wakeSearchIndex;
    document.getElementById('wakeSearchInput').setAttribute('aria-activedescendant', 'wake-suggestion-' + wakeSearchIndex);
    var item = wakeSearchList[wakeSearchIndex];
    speak(item.name + '，' + item.address);
    announce(item.name + '，' + item.address);
    items[wakeSearchIndex].scrollIntoView({ block: 'nearest' });
  }

  function selectCurrentWakeSearch() {
    if (wakeSearchIndex < 0 || !wakeSearchList || wakeSearchList.length === 0) {
      if (wakeSearchList && wakeSearchList.length > 0) {
        wakeSearchIndex = 0;
      } else {
        return;
      }
    }
    var item = wakeSearchList[wakeSearchIndex];
    if (item) {
      selectDestination(item.name);
    }
  }

  function goToRoutePlanning(dest, type) {
    // 家人模式不支持导航功能
    if (userRole === 'family') {
      showFeedback('家人模式不支持导航功能', 'info');
      return;
    }
    document.getElementById('routeSearchInput').value = dest;
    selectedDestination = dest;

    let defaultMode = 'walk';
    if (type === 'hospital' || type === 'mall') defaultMode = 'indoor';
    if (type === 'metro' || type === 'bus' || type === 'brt' || type === 'tram') defaultMode = 'transit';

    selectMode(defaultMode);
    showScreen('route');
  }

  // ========== 目的地搜索 ==========
  const destDatabase = [
    { name: '星巴克咖啡', addr: '中山路128号', icon: '☕', bg: '#FF9500', mode: 'walk' },
    { name: '人民医院', addr: '健康路56号', icon: '🏥', bg: '#FF3B30', mode: 'indoor' },
    { name: '万达广场', addr: '商业街88号', icon: '🛒', bg: '#5856D6', mode: 'indoor' },
    { name: '人民公园', addr: '公园路1号', icon: '🌳', bg: '#34C759', mode: 'walk' },
    { name: '火车站', addr: '站前路100号', icon: '🚉', bg: '#007AFF', mode: 'transit' },
    { name: '地铁站A口', addr: '人民广场地下', icon: '🚇', bg: '#007AFF', mode: 'transit' },
    { name: '市图书馆', addr: '文化路33号', icon: '📚', bg: '#FF9500', mode: 'walk' },
    { name: '社区服务中心', addr: '社区路12号', icon: '🏢', bg: '#34C759', mode: 'walk' },
    { name: '第一中学', addr: '学院路66号', icon: '🏫', bg: '#FF9500', mode: 'walk' },
    { name: '中心菜市场', addr: '菜市路9号', icon: '🥬', bg: '#34C759', mode: 'walk' },
    { name: '体育中心', addr: '体育路1号', icon: '⚽', bg: '#5856D6', mode: 'transit' },
    { name: '电影院', addr: '商业街50号万达4楼', icon: '🎬', bg: '#5856D6', mode: 'indoor' }
  ];

  var currentSuggestionIndex = -1;
  var currentSuggestionList = [];

  function searchDestination(keyword) {
    if (!keyword || !keyword.trim()) {
      hideDestSuggestions();
      return;
    }
    var results = destDatabase.filter(function(d) {
      return d.name.indexOf(keyword) > -1 || d.addr.indexOf(keyword) > -1;
    });
    currentSuggestionList = results;
    currentSuggestionIndex = -1;
    showDestSuggestions(results);
    if (results.length > 0) {
      speak('找到' + results.length + '个结果');
      announce('找到' + results.length + '个搜索结果，可用上下键选择，回车确认');
    } else {
      speak('未找到相关目的地');
      announce('未找到相关目的地');
    }
  }

  function showDestSuggestions(list) {
    var el = document.getElementById('destSuggestions');
    if (!list) list = destDatabase;
    if (!list || list.length === 0) {
      el.style.display = 'none';
      return;
    }
    var html = '';
    list.forEach(function(d, index) {
      html += '<div class="dest-suggestion-item" role="option" aria-label="' + d.name + '，' + d.addr + '" data-index="' + index + '" onmousedown="selectDestFromSearch(\'' + d.name.replace(/'/g, "\\'") + '\',\'' + d.mode + '\')">' +
        '<div class="dest-suggestion-icon" style="background:' + d.bg + ';">' + d.icon + '</div>' +
        '<div class="dest-suggestion-info">' +
        '<div class="dest-suggestion-name">' + d.name + '</div>' +
        '<div class="dest-suggestion-addr">' + d.addr + '</div>' +
        '</div></div>';
    });
    el.innerHTML = html;
    el.style.display = 'block';
  }

  function hideDestSuggestions() {
    var el = document.getElementById('destSuggestions');
    if (el) el.style.display = 'none';
  }

  function selectDestFromSearch(name, mode) {
    document.getElementById('routeSearchInput').value = name;
    selectedDestination = name;
    hideDestSuggestions();
    selectMode(mode);
    speak('已选择' + name + '，正在规划路线');
    triggerHaptic('medium');
  }

  function handleSearchKeydown(e) {
    var listEl = document.getElementById('destSuggestions');
    if (!listEl || listEl.style.display === 'none') return;
    if (!currentSuggestionList || currentSuggestionList.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      navigateSuggestions(1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      navigateSuggestions(-1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      selectCurrentSuggestion();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      hideDestSuggestions();
    }
  }

  function navigateSuggestions(direction) {
    if (!currentSuggestionList || currentSuggestionList.length === 0) return;
    
    var items = document.querySelectorAll('#destSuggestions .dest-suggestion-item');
    
    if (currentSuggestionIndex >= 0) {
      items[currentSuggestionIndex].classList.remove('selected');
      items[currentSuggestionIndex].setAttribute('aria-selected', 'false');
    }
    
    currentSuggestionIndex += direction;
    
    if (currentSuggestionIndex < 0) {
      currentSuggestionIndex = currentSuggestionList.length - 1;
    } else if (currentSuggestionIndex >= currentSuggestionList.length) {
      currentSuggestionIndex = 0;
    }
    
    items[currentSuggestionIndex].classList.add('selected');
    items[currentSuggestionIndex].setAttribute('aria-selected', 'true');
    items[currentSuggestionIndex].id = 'suggestion-' + currentSuggestionIndex;
    
    document.getElementById('routeSearchInput').setAttribute('aria-activedescendant', 'suggestion-' + currentSuggestionIndex);
    
    var item = currentSuggestionList[currentSuggestionIndex];
    speak(item.name + '，' + item.addr);
    announce(item.name + '，' + item.addr);
    
    items[currentSuggestionIndex].scrollIntoView({ block: 'nearest' });
  }

  function selectCurrentSuggestion() {
    if (currentSuggestionIndex < 0 || !currentSuggestionList || currentSuggestionList.length === 0) {
      if (currentSuggestionList && currentSuggestionList.length > 0) {
        currentSuggestionIndex = 0;
      } else {
        return;
      }
    }
    var item = currentSuggestionList[currentSuggestionIndex];
    if (item) {
      selectDestFromSearch(item.name, item.mode);
    }
  }

  function quickSelectDest(name, mode) {
    document.getElementById('routeSearchInput').value = name;
    selectedDestination = name;
    selectMode(mode);
    speak('已选择' + name);
    triggerHaptic('light');
  }

  // ========== 路线规划 ==========
  function selectMode(mode) {
    selectedMode = mode;
    document.querySelectorAll('.mode-item').forEach(item => {
      item.classList.remove('active');
      item.setAttribute('aria-selected', 'false');
      item.setAttribute('tabindex', '-1');
      if (item.dataset.mode === mode) {
        item.classList.add('active');
        item.setAttribute('aria-selected', 'true');
        item.setAttribute('tabindex', '0');
      }
    });
    renderRouteList();
    triggerHaptic('light');
    speak(`已切换到${modes[mode].name}模式`);
  }

  function renderRouteList() {
    const routes = routeData[selectedMode] || [];
    const listEl = document.getElementById('routeList');
    
    if (routes.length === 0) {
      listEl.innerHTML = `
        <div style="padding:60px 20px;text-align:center;" role="status" aria-live="polite">
          <div style="font-size:48px;margin-bottom:16px;" aria-hidden="true">🚫</div>
          <div style="color:#999;font-size:14px;">当前城市暂未开通${modes[selectedMode].name}</div>
          <div style="color:#ccc;font-size:12px;margin-top:8px;">请尝试其他出行方式</div>
        </div>
      `;
      return;
    }
    
    listEl.innerHTML = routes.map((route, i) => `
      <div class="route-card ${i === 0 ? 'active' : ''}" data-route-index="${i}" role="listitem" tabindex="0" aria-label="第${i + 1}条路线，${modes[selectedMode].name}，${route.time}，${route.distance}，${route.info}" aria-selected="${i === 0 ? 'true' : 'false'}">
        <div class="route-card-top">
          <div class="route-card-time">${route.time}<span class="unit"> · ${route.distance}</span></div>
          ${i === 0 ? '<div class="route-card-badge">推荐</div>' : ''}
        </div>
        <div class="route-card-info">${route.info}</div>
        <div class="route-card-steps" aria-hidden="true">
          ${route.steps.map((s, idx) => `
            <span class="step-icon">${s}</span>
            ${idx < route.steps.length - 1 ? '<span class="step-arrow">→</span>' : ''}
          `).join('')}
        </div>
      </div>
    `).join('');

    // 使用事件委托绑定点击事件
    listEl.querySelectorAll('.route-card').forEach(card => {
      card.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        var idx = parseInt(this.getAttribute('data-route-index'));
        selectRoute(idx);
      });
      card.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          var idx = parseInt(this.getAttribute('data-route-index'));
          selectRoute(idx);
        }
      });
    });

    selectedRouteIndex = 0;
    if (selectedMode === 'transit' && routes[0] && routes[0].transportType) {
      selectedTransportType = routes[0].transportType;
    } else {
      selectedTransportType = selectedMode;
    }

    announce(`找到${routes.length}条${modes[selectedMode].name}路线，默认选择第一条`);
  }

  function selectRoute(index) {
    selectedRouteIndex = index;
    const routes = routeData[selectedMode] || [];
    if (selectedMode === 'transit' && routes[index] && routes[index].transportType) {
      selectedTransportType = routes[index].transportType;
    } else {
      selectedTransportType = selectedMode;
    }
    document.querySelectorAll('.route-card').forEach((item, i) => {
      item.classList.remove('active');
      item.setAttribute('aria-selected', 'false');
      if (i === index) {
        item.classList.add('active');
        item.setAttribute('aria-selected', 'true');
      }
    });
    triggerHaptic('light');
    const route = routes[index];
    const modeName = modes[selectedMode].name;
    speak(`已选择第${index + 1}条路线，${modeName}，${route.time}，${route.distance}`);
    announce(`已选择第${index + 1}条路线，${modeName}，${route.time}`);
    var startBtn = document.querySelector('.route-start-btn');
    if (startBtn) {
      startBtn.setAttribute('aria-label', `开始导航，当前已选择第${index + 1}条路线`);
    }
  }

  function confirmStartNav() {
    triggerHaptic('medium');
    checkDangerMarksOnRoute();
  }

  function checkDangerMarksOnRoute() {
    if (selectedMode !== 'walk') {
      speak('开始导航，请跟随语音指引前行');
      startNavigation();
      return;
    }

    const dangerMarks = communityFeedData.danger || [];
    const steps = getGuidanceStepsForMode();
    const routeText = steps.map(s => (s.sub || '') + ' ' + (s.text || '')).join('');
    const matchedDangers = dangerMarks.filter(dm => {
      const loc = dm.location || '';
      const keywords = loc.replace(/[与、，,]/g, ' ').split(' ').filter(k => k.length > 1);
      return keywords.some(kw => routeText.includes(kw));
    });

    if (matchedDangers.length > 0) {
    speak('注意！您的导航路线经过' + matchedDangers.length + '个危险标记区域', 'high');
      matchedDangers.forEach((dm, idx) => {
        const timeDelay = 2500 + idx * 3000;
        setTimeout(() => {
          speak(dm.text.replace('⚠️', ''));
          showFeedback('⚠️ ' + dm.location + ': ' + dm.text.substring(0, 20) + '...', 'warning');
        }, timeDelay);
      });
      setTimeout(() => {
        speak('开始导航，请跟随语音指引前行');
        startNavigation();
      }, 3000 + matchedDangers.length * 3000);
    } else {
      speak('开始导航，请跟随语音指引前行');
      startNavigation();
    }
  }

  // ========== 导航功能 ==========
  let currentStepIndex = 0;
  let guidanceStepsData = [];
  let arrivalCountdownActive = false;
  let arrivalCountdownSeconds = 0;
  let arrivalCountdownInterval = null;
  let arrivalLastAnnouncedMinute = -1;
  let arrivalCountdownLabel = '';
  let arrivalCountdownVehicle = '';

  function getGuidanceStepsForMode() {
    const mode = selectedMode === 'transit' ? selectedTransportType : selectedMode;
    switch (mode) {
      case 'walk': return guidanceSteps;
      case 'bus': return busGuidanceSteps;
      case 'metro': return metroGuidanceSteps;
      case 'brt': return brtGuidanceSteps;
      case 'tram': return tramGuidanceSteps;
      case 'taxi': return taxiGuidanceSteps;
      case 'indoor': 
        if (selectedDestination.includes('医院') || selectedDestination.includes('hospital')) {
          return hospitalGuidanceSteps;
        }
        if (selectedDestination.includes('办公楼') || selectedDestination.includes('大厦') || selectedDestination.includes('写字楼') || selectedDestination.includes('office')) {
          return officeBuildingGuidanceSteps;
        }
        if (selectedDestination.includes('学校') || selectedDestination.includes('大学') || selectedDestination.includes('中学') || selectedDestination.includes('小学') || selectedDestination.includes('school')) {
          return schoolGuidanceSteps;
        }
        if (selectedDestination.includes('机场') || selectedDestination.includes('航站楼') || selectedDestination.includes('airport')) {
          return airportGuidanceSteps;
        }
        if (selectedDestination.includes('图书馆') || selectedDestination.includes('library')) {
          return libraryGuidanceSteps;
        }
        if (selectedDestination.includes('超市') || selectedDestination.includes('大卖场') || selectedDestination.includes('supermarket')) {
          return supermarketGuidanceSteps;
        }
        if (selectedDestination.includes('餐厅') || selectedDestination.includes('饭店') || selectedDestination.includes('火锅') || selectedDestination.includes('美食') || selectedDestination.includes('restaurant')) {
          return restaurantGuidanceSteps;
        }
        if (selectedDestination.includes('博物馆') || selectedDestination.includes('展览馆') || selectedDestination.includes('美术馆') || selectedDestination.includes('museum')) {
          return museumGuidanceSteps;
        }
        return mallGuidanceSteps;
      default: return guidanceSteps;
    }
  }

  function startNavigation() {
    try {
      if (userRole === 'family') {
        showFeedback('家人模式不支持导航功能', 'info');
        return;
      }
      isNavigating = true;
      isNavPaused = false;
      isLastMile = false;
      navProgress = 0;
      currentStepIndex = 0;
      cameraPrompted = false;
      cameraAutoOpenedForMode = false;
      lastSafetyCheckpoint = 0;
      isOffTrack = false;
      stopArrivalCountdown();
      offTrackDirection = '';
      isRouteOffTrack = false;
      rerouteCount = 0;
      lmStepIndex = 0;
      guidanceStepsData = getGuidanceStepsForMode();
      
      showScreen('nav');
      var navDestEl = document.getElementById('navDestName');
      if (navDestEl) navDestEl.textContent = selectedDestination;
      const actualMode = getActualMode();
      var modeIndicatorEl = document.getElementById('modeIndicatorText');
      if (modeIndicatorEl) modeIndicatorEl.textContent = transportModeNames[actualMode].icon + ' ' + transportModeNames[actualMode].name;
      
      updateGuidanceDisplay();
      updateNavProgress();
      hideAllBanners();

      if (userRole === 'blind') {
        ensureNavDangerButton();
        var dangerBtn = document.getElementById('navDangerMarkBtn');
        if (dangerBtn) {
          dangerBtn.style.display = 'none';
          safeSetTimeout(function() {
            if (currentScreen === 'nav' && dangerBtn) {
              dangerBtn.style.display = 'flex';
              speak('如遇施工或障碍，可点击右上角标记共享到社区，系统也会自动询问您是否共享');
            }
          }, 5000, 'nav_danger_btn_delay');
        }
      }
      
      const tactileEl = document.getElementById('tactileStatus');
      if (tactileEl) {
        tactileEl.style.display = actualMode === 'walk' ? 'flex' : 'none';
      }
      
      if (navInterval) {
        clearInterval(navInterval);
        navInterval = null;
      }
      navInterval = setInterval(function() {
        try { navTick(); } catch (e) { console.error('[navTick错误]', e.message); }
      }, 2000);
      
      cacheRouteData();
      initStatusIndicators();
      updateSignalStrength(4);
      updateBatteryLevel(100);
      
      speak('导航开始，' + guidanceStepsData[0].text);
      
      startSafetyReminder();
    } catch (e) {
      console.error('[startNavigation错误]', e.message, e.stack);
      showFeedback('导航启动失败，请重试', 'error');
    }
  }
  
  function initStatusIndicators() {
    var navHeader = document.querySelector('.nav-header');
    if (!navHeader) return;
    
    if (document.getElementById('signalIndicator')) return;
    
    var statusRow = document.createElement('div');
    statusRow.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;';
    
    var signalEl = document.createElement('span');
    signalEl.id = 'signalIndicator';
    signalEl.style.cssText = 'font-size:14px;padding:2px 8px;';
    
    var batteryEl = document.createElement('span');
    batteryEl.id = 'batteryIndicator';
    batteryEl.style.cssText = 'font-size:14px;padding:2px 8px;';
    
    statusRow.appendChild(signalEl);
    statusRow.appendChild(batteryEl);
    
    navHeader.insertBefore(statusRow, navHeader.firstChild);
  }

  var cameraPrompted = false;
  var cameraAutoOpenedForMode = false; // 标记是否已自动打开过摄像头

  function navTick() {
    try {
      if (isNavPaused) return;
      if (isLastMile) return;
      
      ensureOfflineRouteData();
      simulateOfflineDrift();
      
      var increment = getOfflineProgressIncrement();
      navProgress += increment;
      if (navProgress >= 100) navProgress = 100;
      
      updateNavProgress();
      moveMapMarker();
      
      const newStepIndex = guidanceStepsData.findIndex(s => s.pct >= navProgress);
      if (newStepIndex > 0 && newStepIndex !== currentStepIndex && newStepIndex < guidanceStepsData.length) {
        currentStepIndex = newStepIndex;
        updateGuidanceDisplay();
        const newStep = guidanceStepsData[currentStepIndex];
        if (isWaitingStep(newStep) && !arrivalCountdownActive) {
          startArrivalCountdown();
        }
        if (!arrivalCountdownActive) {
          speak(newStep.text, 'high');
        }
      }
      
      if (isNavigating && !cameraOpen && !cameraAutoOpenedForMode) {
        const actualMode = getActualMode();
        if (actualMode === 'walk') {
          cameraAutoOpenedForMode = true;
          openCamera(true);
          speak('摄像头已自动开启，帮您识别盲道和前方障碍');
        }
        if (actualMode === 'taxi' && navProgress >= 30 && navProgress < 50) {
          cameraAutoOpenedForMode = true;
          openCamera(true);
          speak('摄像头已自动开启，帮您识别车辆和车门位置');
        }
        if (actualMode === 'bus' && navProgress >= 20 && navProgress < 40) {
          cameraAutoOpenedForMode = true;
          openCamera(true);
          speak('摄像头已自动开启，帮您确认公交车和上车位置');
        }
        if (actualMode === 'metro' && navProgress >= 5 && navProgress < 30) {
          cameraAutoOpenedForMode = true;
          openCamera(true);
          speak('摄像头已自动开启，帮您识别地铁站入口和闸机');
        }
        if (actualMode === 'brt' && navProgress >= 10 && navProgress < 30) {
          cameraAutoOpenedForMode = true;
          openCamera(true);
          speak('摄像头已自动开启，帮您确认BRT站台');
        }
        if (actualMode === 'tram' && navProgress >= 10 && navProgress < 35) {
          cameraAutoOpenedForMode = true;
          openCamera(true);
          speak('摄像头已自动开启，帮您确认有轨电车');
        }
        if (actualMode === 'indoor' && navProgress < 30) {
          cameraAutoOpenedForMode = true;
          openCamera(true);
          speak('摄像头已自动开启，帮您识别入口位置');
        }
      }

      if (Math.random() < 0.25 && !isOffTrack && isNavigating && selectedMode === 'walk' && !isLastMile && cameraOpen) {
        simulateTactileDeviation();
      }

      if (Math.random() < 0.1 && !isRouteOffTrack && isNavigating && navProgress < 80 && !isLastMile) {
        simulateRouteDeviation();
      }
      
      if (Math.random() < 0.08 && isNavigating && !isLastMile) {
        const levels = ['low', 'medium', 'high'];
        const level = levels[Math.floor(Math.random() * levels.length)];
        triggerDangerAlert(level);
      }
      
      if (Math.random() < 0.15) {
        simulateSignalChange();
      }
      
      if (cameraOpen) {
        applyCameraRefreshRate();
      }
      
      checkSafetyCheckpoint();
      
      const actualMode = getActualMode();
      var lastMileThreshold = 85;
      if (actualMode === 'bus' || actualMode === 'tram') {
        lastMileThreshold = 90;
      } else if (actualMode === 'metro' || actualMode === 'brt') {
        lastMileThreshold = 93;
      } else if (actualMode === 'taxi') {
        lastMileThreshold = 88;
      }
      
      if (navProgress >= lastMileThreshold && !isLastMile) {
        if (actualMode !== 'indoor') {
          enterLastMile();
        }
      }
      
      if (navProgress >= 100) {
        endNavigation(true);
      }
    } catch (e) {
      console.error('[navTick错误]', e.message);
    }
  }

  function updateNavProgress() {
    document.getElementById('navProgressFill').style.width = navProgress + '%';
    var progressBar = document.getElementById('navProgressBar');
    if (progressBar) {
      progressBar.setAttribute('aria-valuenow', Math.round(navProgress));
    }
    if (guidanceStepsData.length > 0) {
      const step = guidanceStepsData[Math.min(currentStepIndex, guidanceStepsData.length - 1)];
      const actualMode = getActualMode();
      document.getElementById('navDestDist').textContent = '剩余 ' + step.dist + ' · ' + transportModeNames[actualMode].name;
    }
  }

  function updateGuidanceDisplay() {
    if (guidanceStepsData.length === 0) return;
    const step = guidanceStepsData[Math.min(currentStepIndex, guidanceStepsData.length - 1)];
    document.getElementById('guidanceIcon').textContent = step.icon;
    document.getElementById('guidanceText').textContent = step.text;
    document.getElementById('guidanceSub').textContent = step.sub;
  }

  function isWaitingStep(step) {
    if (!step) return false;
    const t = step.text || '';
    const s = step.sub || '';
    const combined = t + s;
    return /等待|司机.*赶来|司机.*到达|还有.*分钟|还有.*秒|等车|等列/.test(combined);
  }

  function extractInitialWaitMinutes(step) {
    if (!step) return 0;
    const combined = (step.text || '') + (step.sub || '');
    const match = combined.match(/还有\s*(\d+)\s*分钟/);
    if (match) return parseInt(match[1], 10);
    return 3;
  }

  function getVehicleName() {
    const mode = getActualMode();
    const step = guidanceStepsData[Math.min(currentStepIndex, guidanceStepsData.length - 1)];
    const combined = (step.text || '') + (step.sub || '');
    const busMatch = combined.match(/(\d+路)/);
    if (busMatch) return busMatch[1];
    const brtMatch = combined.match(/(B\d+路)/);
    if (brtMatch) return brtMatch[1];
    switch (mode) {
      case 'bus': return '公交车';
      case 'metro': return '地铁';
      case 'brt': return 'BRT';
      case 'tram': return '有轨电车';
      case 'taxi': return '车辆';
      default: return '车辆';
    }
  }

  function startArrivalCountdown() {
    try {
      if (arrivalCountdownActive) return;
      const step = guidanceStepsData[Math.min(currentStepIndex, guidanceStepsData.length - 1)];
      if (!step) return;
      const minutes = extractInitialWaitMinutes(step);
      arrivalCountdownSeconds = minutes * 60;
      arrivalLastAnnouncedMinute = minutes;
      arrivalCountdownVehicle = getVehicleName();
      arrivalCountdownLabel = arrivalCountdownVehicle + '到站';
      arrivalCountdownActive = true;
      updateCountdownDisplay();
      speak(arrivalCountdownVehicle + '还有' + minutes + '分钟到达', 'high');
      if (arrivalCountdownInterval) {
        safeClearInterval(arrivalCountdownInterval);
      }
      arrivalCountdownInterval = safeSetInterval(function() {
        try {
          if (isNavPaused) return;
          arrivalCountdownSeconds--;
          if (arrivalCountdownSeconds < 0) arrivalCountdownSeconds = 0;
          updateCountdownDisplay();
          const currentMinute = Math.ceil(arrivalCountdownSeconds / 60);
          if (arrivalCountdownSeconds === 60 && arrivalLastAnnouncedMinute !== 0.5) {
            arrivalLastAnnouncedMinute = 0.5;
            speak('还有1分钟，' + arrivalCountdownVehicle + '即将到达，请注意', 'high');
            triggerHaptic('medium');
          } else if (arrivalCountdownSeconds === 30 && arrivalLastAnnouncedMinute !== 0) {
            arrivalLastAnnouncedMinute = 0;
            speak('还有30秒，' + arrivalCountdownVehicle + '正在靠近，请做好准备', 'critical');
            triggerHaptic('heavy');
          } else if (arrivalCountdownSeconds === 10) {
            speak(arrivalCountdownVehicle + '马上到了，请站在安全位置', 'critical');
            triggerHaptic('heavy');
          } else if (arrivalCountdownSeconds === 0) {
            speak(arrivalCountdownVehicle + '已到站，请上车，注意脚下', 'critical');
            triggerHaptic('heavy');
            stopArrivalCountdown();
          } else if (currentMinute < arrivalLastAnnouncedMinute && currentMinute > 1 && arrivalCountdownSeconds > 60) {
            arrivalLastAnnouncedMinute = currentMinute;
            speak(arrivalCountdownVehicle + '还有' + currentMinute + '分钟到达', 'normal');
          }
        } catch (e) {
          console.error('[arrivalCountdownTick错误]', e.message);
        }
      }, 1000, 'arrival_countdown');
    } catch (e) {
      console.error('[startArrivalCountdown错误]', e.message);
    }
  }

  function stopArrivalCountdown() {
    try {
      if (!arrivalCountdownActive) return;
      arrivalCountdownActive = false;
      arrivalCountdownSeconds = 0;
      arrivalLastAnnouncedMinute = -1;
      if (arrivalCountdownInterval) {
        safeClearInterval(arrivalCountdownInterval);
        arrivalCountdownInterval = null;
      }
      var cdEl = document.getElementById('arrivalCountdown');
      if (cdEl) cdEl.style.display = 'none';
    } catch (e) {
      console.error('[stopArrivalCountdown错误]', e.message);
    }
  }

  function updateCountdownDisplay() {
    try {
      var cdEl = document.getElementById('arrivalCountdown');
      if (!cdEl) {
        var subEl = document.getElementById('guidanceSub');
        if (!subEl) return;
        cdEl = document.createElement('div');
        cdEl.id = 'arrivalCountdown';
        cdEl.style.cssText = 'margin-top:6px;font-size:22px;font-weight:600;color:#007AFF;letter-spacing:1px;';
        subEl.parentNode.insertBefore(cdEl, subEl.nextSibling);
      }
      const mins = Math.floor(arrivalCountdownSeconds / 60);
      const secs = arrivalCountdownSeconds % 60;
      const timeStr = mins + '分' + (secs < 10 ? '0' : '') + secs + '秒';
      cdEl.textContent = '⏱ ' + arrivalCountdownLabel + '：' + timeStr;
      cdEl.style.display = arrivalCountdownActive ? 'block' : 'none';
    } catch (e) {
      console.error('[updateCountdownDisplay错误]', e.message);
    }
  }

  function moveMapMarker() {
    const progress = navProgress / 100;
    const startX = 170, startY = 180;
    const endX = 320, endY = 30;
    const x = startX + (endX - startX) * progress;
    const y = startY + (endY - startY) * progress;
    
    const marker = document.getElementById('navCurrentPos');
    if (marker) marker.setAttribute('transform', `translate(${x}, ${y})`);
  }

  function hideAllBanners() {
    var ts = document.getElementById('tactileStatus');
    if (ts) ts.className = 'tactile-status normal';
    var rb = document.getElementById('rerouteBanner');
    if (rb) rb.style.display = 'none';
    var lmb = document.getElementById('lastMileBanner');
    if (lmb) lmb.style.display = 'none';
    var npi = document.getElementById('navPauseIndicator');
    if (npi) npi.style.display = 'none';
    var lms = document.getElementById('lastMileSteps');
    if (lms) lms.style.display = 'none';
  }

  function pauseNavigation() {
    isNavPaused = !isNavPaused;
    const indicator = document.getElementById('navPauseIndicator');
    if (indicator) indicator.style.display = isNavPaused ? 'flex' : 'none';
    const msg = isNavPaused ? '导航已暂停' : '导航继续';
    speak(msg);
    announce(msg);
    triggerHaptic(isNavPaused ? 'heavy' : 'medium');
  }

  function endNavigation(arrived = false) {
    try {
      if (navInterval) {
        clearInterval(navInterval);
        navInterval = null;
      }
      isNavigating = false;
      isNavPaused = false;
      isLastMile = false;
      isOffTrack = false;
      isRouteOffTrack = false;
      cameraAutoOpenedForMode = false;
      dangerAskListening = false;
      isOfflineMode = false;
      stopArrivalCountdown();
      signalStrength = 4;
      offlineDriftOffset = 0;
      offlineDriftDirection = 0;
      stopSafetyReminder();
      
      var dangerBtn = document.getElementById('navDangerMarkBtn');
      if (dangerBtn) dangerBtn.style.display = 'none';
      
      if (arrived) {
        triggerHaptic('triple');
        showFeedback('🎉 已到达目的地', 'success');
        enterArrivalMode();
      } else {
        if (cameraOpen) { closeCamera(); }
        rerouteCount = 0;
        speak('导航结束');
        triggerHaptic('light');
        safeSetTimeout(function() {
          if (userRole === 'family') {
            showScreen('family');
            switchTab('family');
          } else {
            showScreen('wake');
          }
        }, 500, 'end_nav_return');
      }
    } catch (e) {
      console.error('[endNavigation错误]', e.message);
    }
  }

  function enterArrivalMode() {
    if (cameraOpen) { closeCamera(); }
    const actualMode = getActualMode();
    const destName = selectedDestination;
    
    document.getElementById('arrivalDestName').textContent = '已到达 ' + destName;
    document.getElementById('arrivalSubtitle').textContent = '瞳伴已安全护送您到达';
    
    const envDesc = getArrivalEnvDesc(destName, actualMode);
    const entryDesc = getArrivalEntryDesc(destName, actualMode);
    const nearbyItems = getArrivalNearby(destName, actualMode);
    
    document.getElementById('arrivalEnvDesc').textContent = envDesc;
    document.getElementById('arrivalEntryDesc').textContent = entryDesc;
    
    const nearbyEl = document.getElementById('arrivalNearby');
    nearbyEl.innerHTML = nearbyItems.map(item => 
      '<div class="arrival-nearby-item">' + item + '</div>'
    ).join('');
    
    showScreen('arrival');
    
    var arrivalText;
    if (actualMode === 'walk') {
      arrivalText = '已到达' + destName + '。' + envDesc + ' 您可以选择AI摄像头辅助查看周边环境，或听一遍环境描述。';
    } else {
      arrivalText = '已到达' + destName + '。' + envDesc + ' 您可以选择AI摄像头辅助找入口，或听一遍环境描述，或引导我进门。';
    }
    speak(arrivalText);
    
    if (cameraOpen) {
      closeCamera();
    }
  }

  function getArrivalEnvDesc(dest, mode) {
    if (dest.includes('医院')) {
      return '您正对着医院门诊楼大门，门口有5级台阶，左侧有无障碍坡道。大门是双开玻璃门，向内开启。进门后正前方是导诊台，左侧有挂号处，右侧有自助取号机。';
    } else if (dest.includes('商场') || dest.includes('万达')) {
      return '您正对着商场1号门，是自动感应玻璃门，门宽约3米。进门后左侧是服务台，右侧有手扶电梯，正前方是商场中庭。地面光滑，请放慢脚步。';
    } else if (dest.includes('地铁') || dest.includes('火车')) {
      return '您已到达地铁站入口，A口在您左前方，无障碍电梯在右侧。入口处有5级台阶向下，请注意脚下。进站后前方是闸机，右侧有人工售票窗口。';
    } else if (dest.includes('公交')) {
      return '您已到达公交站，站台在您正前方2米处。站台上有遮雨棚和座椅，站牌在您右手边。站台边缘有黄色安全线，请站在安全线内候车。';
    } else if (dest.includes('办公楼') || dest.includes('大厦') || dest.includes('写字楼')) {
      return '您正对着办公楼大堂入口，是自动感应玻璃门，门宽约4米。进门后左侧是前台，右侧有休息区，正前方是电梯厅。大堂宽敞明亮，地面是大理石材质，请慢走。';
    } else if (dest.includes('学校') || dest.includes('大学') || dest.includes('中学') || dest.includes('小学')) {
      return '您已到达学校门口，大门在正前方，有门卫值班。进门后直行是主教学楼，左侧有操场，右侧有宣传栏。校园内有学生来往，请注意避让。';
    } else if (dest.includes('机场') || dest.includes('航站楼')) {
      return '您已到达机场航站楼入口，大门宽约6米，是自动感应门。进门后正前方是值机区，左侧有行李推车，右侧是问询处。航站楼内人员较多，请留意身边的行李车。';
    } else if (dest.includes('图书馆')) {
      return '您正对着图书馆正门，是双开玻璃门，向内开启。进门后左侧是存包柜，右侧是总服务台，正前方是借阅区。图书馆内请保持安静，手机请调静音。';
    } else if (dest.includes('超市') || dest.includes('大卖场')) {
      return '您正对着超市入口，是自动感应门，门宽约4米。入口右侧有购物车和购物篮，左侧有存包柜。进门后左侧是生鲜区，右侧是食品区。地面可能有水渍，请慢走。';
    } else if (dest.includes('餐厅') || dest.includes('饭店') || dest.includes('火锅') || dest.includes('美食')) {
      return '您正对着餐厅大门，门已打开，有服务员迎接。进门后左侧是迎宾台，右侧是等位区，正前方是就餐区。餐厅内人员较多，请放慢脚步。';
    } else if (dest.includes('博物馆') || dest.includes('展览馆') || dest.includes('美术馆')) {
      return '您正对着博物馆入口，有安检通道。进门后正前方是服务台，可租用语音讲解器，左侧有存包处，右侧有电梯。博物馆内请保持安静，不要触摸展品。';
    } else {
      return '您正对着目的地大门，左侧有商场扶梯，右侧5米处有便利店入口。前方地面平整，无障碍，人行道宽敞。周围环境安全，行人不多。';
    }
  }

  function getArrivalEntryDesc(dest, mode) {
    if (dest.includes('医院')) {
      return '正前方3米是门诊楼大门，门把手在中间两侧，高约1米，双开门向外推开。进门后直行10米是导诊台，高度约1.1米，有工作人员在岗。挂号处在导诊台右侧。';
    } else if (dest.includes('商场') || dest.includes('万达')) {
      return '正前方是自动感应玻璃门，门正在缓慢开启，请稍等后直行进入。进门后地面有一级小台阶，高约5厘米，请注意抬脚。服务台在进门后左手边5米处。';
    } else if (dest.includes('地铁') || dest.includes('火车')) {
      return '前方3米是地铁站入口，向下走5级台阶后是站厅层。台阶左侧有扶手，高度约90厘米。如果需要乘坐无障碍电梯，请向右侧走10米。';
    } else if (dest.includes('公交')) {
      return '您已在站台上，站牌在右手边1米处，上面有线路信息。站台地面有黄色盲道砖，通向候车区。请站在黄色安全线以内等候公交车。';
    } else if (dest.includes('办公楼') || dest.includes('大厦') || dest.includes('写字楼')) {
      return '正前方5米是办公楼大堂入口，自动感应玻璃门正在开启。进门后左手边是前台，高度约1.1米，有接待人员。电梯厅在大堂正前方20米处。';
    } else if (dest.includes('学校') || dest.includes('大学') || dest.includes('中学') || dest.includes('小学')) {
      return '正前方10米是学校大门，门已打开，有门卫值班。进门后直行60米是主教学楼，有8级台阶向上，两侧有扶手。无障碍坡道在教学楼右侧。';
    } else if (dest.includes('机场') || dest.includes('航站楼')) {
      return '正前方15米是航站楼入口，大门宽约6米。进门后直行30米是值机区，B区在右侧，A区在左侧。自助值机在左侧，有12台机器。';
    } else if (dest.includes('图书馆')) {
      return '正前方8米是图书馆正门，双开玻璃门向内开启。进门后左侧是存包柜，右侧是总服务台。服务台有工作人员，可办证、咨询、还书。';
    } else if (dest.includes('超市') || dest.includes('大卖场')) {
      return '正前方6米是超市入口，自动感应门正在开启。入口右侧有购物车和购物篮，可取用。进门后左侧是生鲜蔬果区，右侧是食品零食区。';
    } else if (dest.includes('餐厅') || dest.includes('饭店') || dest.includes('火锅') || dest.includes('美食')) {
      return '正前方5米是餐厅入口，门已打开。进门左侧是迎宾台，有服务员接待。跟随服务员前往座位，就餐区在大厅中部。';
    } else if (dest.includes('博物馆') || dest.includes('展览馆') || dest.includes('美术馆')) {
      return '正前方10米是博物馆入口，有安检通道，请配合检查。安检后正前方是服务台，可租用语音讲解器和轮椅。展厅在服务台右侧。';
    } else {
      return '正前方3米是玻璃大门，门把手在右侧距地面1米处，门向内开启。进门后左侧是服务台，有工作人员可以咨询。前方通道宽敞，可安全通行。';
    }
  }

  function getArrivalNearby(dest, mode) {
    if (dest.includes('医院')) {
      return ['🚗 停车场 · 西侧50米', '🍜 餐厅 · 负一层', '🛗 直梯 · 门诊大厅右侧', '💊 药房 · 门诊一楼', '🚻 卫生间 · 入口右侧', '🪑 休息区 · 候诊区'];
    } else if (dest.includes('商场') || dest.includes('万达')) {
      return ['🛗 直梯 · 入口右侧', '🚻 卫生间 · 负一层', '🍔 美食街 · 4楼', '🎬 电影院 · 5楼', '🪑 休息区 · 各层都有', '🚗 停车场 · 地下2层'];
    } else if (dest.includes('地铁') || dest.includes('火车')) {
      return ['🎫 售票厅 · 右侧', '🚻 卫生间 · 站厅层', '🪑 候车座椅 · 站台', '🛗 无障碍电梯 · A口旁', '便利店 · 入口处', '🚌 公交换乘 · 出口处'];
    } else if (dest.includes('公交')) {
      return ['🚏 站牌 · 右手边', '🪑 座椅 · 站台上', '🛗 过街天桥 · 前方50米', '便利店 · 对面', '🚻 公共卫生间 · 西侧100米', '共享单车 · 站牌后'];
    } else if (dest.includes('办公楼') || dest.includes('大厦') || dest.includes('写字楼')) {
      return ['🛗 客梯 · 电梯厅', '🚻 卫生间 · 各楼层', '🪑 休息区 · 大堂右侧', '☕ 咖啡厅 · 一楼大堂', '🚗 停车场 · 地下B2', '🍱 食堂 · 负一层'];
    } else if (dest.includes('学校') || dest.includes('大学') || dest.includes('中学') || dest.includes('小学')) {
      return ['🏫 教学楼 · 正前方', '⚽ 操场 · 左侧', '📚 图书馆 · 右侧', '🍜 食堂 · 后方', '🚻 卫生间 · 各楼层', '🚌 校车 · 校门口'];
    } else if (dest.includes('机场') || dest.includes('航站楼')) {
      return ['🧳 值机区 · 正前方', '🛂 安检口 · 右侧', '🪑 休息区 · 各登机口', '🚻 卫生间 · 登机口旁', '☕ 餐饮 · 各楼层', '🛗 电梯 · 大厅两侧'];
    } else if (dest.includes('图书馆')) {
      return ['💁 服务台 · 进门右侧', '📦 存包柜 · 入口左侧', '📖 借阅区 · 各楼层', '🪑 阅读区 · 各层都有', '🚻 卫生间 · 各楼层', '🛗 电梯 · 服务台旁'];
    } else if (dest.includes('超市') || dest.includes('大卖场')) {
      return ['🛒 购物车 · 入口右侧', '🥬 生鲜区 · 进门左侧', '🍿 食品区 · 中部', '🧴 日化区 · 右侧', '💳 收银台 · 出口处', '🚻 卫生间 · 入口旁'];
    } else if (dest.includes('餐厅') || dest.includes('饭店') || dest.includes('火锅') || dest.includes('美食')) {
      return ['🪑 座位 · 大厅中部', '👋 服务员 · 随时呼叫', '🚻 卫生间 · 餐厅后方', '🍽️ 餐具 · 桌上摆放', '📱 扫码点单 · 桌上', '🧳 存物筐 · 桌下'];
    } else if (dest.includes('博物馆') || dest.includes('展览馆') || dest.includes('美术馆')) {
      return ['💁 服务台 · 大厅中央', '🎧 讲解器 · 可租用', '🪑 休息椅 · 各展厅', '🚻 卫生间 · 每层都有', '📦 存包处 · 左侧', '🛗 电梯 · 服务台旁'];
    } else {
      return ['🛗 扶梯 · 左侧5米', '🚻 卫生间 · 右侧20米', '🚇 地铁站 · 前方100米', '🪑 休息区 · 进门左侧', '便利店 · 右手边', '🍜 餐厅 · 隔壁'];
    }
  }

  function arrivalOpenCamera() {
    showScreen('arrival');
    openCamera();
    speak('已打开AI摄像头，正在识别入口和周边环境');
    triggerHaptic('light');
  }

  function arrivalDescribeAgain() {
    const envDesc = document.getElementById('arrivalEnvDesc').textContent;
    const entryDesc = document.getElementById('arrivalEntryDesc').textContent;
    speak('环境描述：' + envDesc + ' 入口指引：' + entryDesc);
    triggerHaptic('light');
  }

  // 入口引导状态
  var entryGuidanceActive = false;
  var entryGuidanceStep = 0;
  var entryGuidanceSteps = [];
  var entryGuidanceTimer = null;

  function getEntryGuidanceSteps(destName) {
    // 根据目的地类型生成不同的进门引导步骤
    var steps = [];
    if (destName.includes('医院')) {
      steps = [
        {
          title: '寻找门诊入口',
          aiText: '正在识别医院门诊入口...',
          aiTags: ['入口识别', '门诊楼'],
          text: '请面向正前方，AI正在识别医院门诊入口。入口在您正前方3米处，是双开玻璃门。',
          actionText: '入口在正前方，直行3米'
        },
        {
          title: '走到门口',
          aiText: '检测到门诊大门，距离约2米',
          aiTags: ['大门', '玻璃门', '距离2米'],
          text: '检测到门诊大门在您正前方2米处。门是双开玻璃门，向外推开。请向前走两步。',
          actionText: '向前走两步到门口'
        },
        {
          title: '寻找门把手',
          aiText: '门把手在门中间两侧，高度约1米',
          aiTags: ['门把手', '右侧', '高度1米'],
          text: '门把手在门的中间两侧，高度约1米，方便抓握。请伸手向前，右手可以摸到门把手。',
          actionText: '伸手摸门把手'
        },
        {
          title: '推开门',
          aiText: '门向外推开，请注意避让',
          aiTags: ['推门', '向外开'],
          text: '门向外开启，请用手向外推。门开启幅度较大，请小心门边缘。推门时稍侧身进入。',
          actionText: '向外推开门'
        },
        {
          title: '进门',
          aiText: '进门后直行，前方是导诊台',
          aiTags: ['进门', '导诊台', '前方10米'],
          text: '门已推开，请向前走进入大厅。进门后直行10米是导诊台，左侧有挂号处，右侧有自助取号机。',
          actionText: '向前走进门'
        },
        {
          title: '进入大厅',
          aiText: '已进入门诊大厅，导诊台在前方',
          aiTags: ['大厅', '导诊台', '挂号处'],
          text: '您已进入门诊大厅。前方10米是导诊台，高度约1.1米，有工作人员可以咨询。需要挂号的话，导诊台右侧有挂号处。',
          actionText: '进门引导完成'
        }
      ];
    } else if (destName.includes('商场') || destName.includes('万达')) {
      steps = [
        {
          title: '寻找商场入口',
          aiText: '正在识别商场1号门...',
          aiTags: ['入口识别', '1号门'],
          text: 'AI正在识别商场1号门。入口在您正前方3米处，是自动感应玻璃门，门宽约3米。',
          actionText: '入口在正前方，直行3米'
        },
        {
          title: '走到门口',
          aiText: '检测到自动门，距离约2米',
          aiTags: ['自动门', '玻璃门', '距离2米'],
          text: '检测到自动感应门在您正前方2米处。门正在缓慢开启，请稍等后直行进入。',
          actionText: '等门开，向前走'
        },
        {
          title: '注意脚下台阶',
          aiText: '注意！进门后有一级小台阶，高约5厘米',
          aiTags: ['台阶', '高5cm', '注意抬脚'],
          text: '进门后地面有一级小台阶，高约5厘米，请抬脚迈过。地面光滑，请放慢脚步。',
          actionText: '抬脚迈过小台阶'
        },
        {
          title: '进门',
          aiText: '已进入商场，服务台在左手边',
          aiTags: ['进门', '服务台', '左侧5米'],
          text: '您已进入商场。服务台在进门后左手边5米处，有工作人员可以咨询。右侧有手扶电梯。',
          actionText: '向前走进门'
        },
        {
          title: '确认位置',
          aiText: '已在商场1楼中庭附近',
          aiTags: ['1楼', '中庭', '服务台'],
          text: '您现在在商场1楼中庭附近。服务台在左手边，电梯在右手边，正前方是商场中庭。需要帮助可以到服务台咨询。',
          actionText: '进门引导完成'
        }
      ];
    } else if (destName.includes('地铁') || destName.includes('火车')) {
      steps = [
        {
          title: '寻找地铁站入口',
          aiText: '正在识别地铁站A入口...',
          aiTags: ['入口识别', 'A口'],
          text: 'AI正在识别地铁站入口。A口在您左前方，向下走5级台阶后是站厅层。无障碍电梯在右侧。',
          actionText: '左前方是入口'
        },
        {
          title: '走到台阶前',
          aiText: '检测到入口台阶，距离约2米',
          aiTags: ['台阶', '向下5级', '扶手在左侧'],
          text: '入口台阶在您前方2米处。台阶左侧有扶手，高度约90厘米。请扶好扶手向下走。',
          actionText: '扶扶手，向下走'
        },
        {
          title: '下台阶',
          aiText: '正在下台阶，还剩3级',
          aiTags: ['下台阶', '3级', '小心'],
          text: '正在下台阶，请注意脚下。台阶共5级，还剩3级。左侧扶手持续可用。',
          actionText: '继续向下走'
        },
        {
          title: '到站厅层',
          aiText: '已到站厅层，前方是闸机',
          aiTags: ['站厅', '闸机', '前方5米'],
          text: '您已到达站厅层。前方5米是闸机，右侧有人工售票窗口。需要买票请向右侧走10米。',
          actionText: '向前走到闸机'
        },
        {
          title: '找闸机',
          aiText: '闸机在前方，右侧是人工通道',
          aiTags: ['闸机', '人工通道', '右侧'],
          text: '闸机在正前方。右侧有宽闸机和人工通道，适合携带行李或使用轮椅。请选择合适的通道进站。',
          actionText: '入口引导完成'
        }
      ];
    } else {
      // 通用进门引导
      steps = [
        {
          title: '寻找入口',
          aiText: '正在识别建筑入口...',
          aiTags: ['入口识别', '正前方'],
          text: 'AI正在识别入口。大门在您正前方3米处，是玻璃门，门把手在右侧。',
          actionText: '入口在正前方，直行3米'
        },
        {
          title: '走到门口',
          aiText: '检测到大门，距离约2米',
          aiTags: ['大门', '玻璃门', '距离2米'],
          text: '检测到大门在您正前方2米处。门把手在右侧，高度约1米，门向内开启。',
          actionText: '向前走两步到门口'
        },
        {
          title: '开门',
          aiText: '门把手在右侧，向内推',
          aiTags: ['门把手', '右侧', '向内开'],
          text: '门把手在右侧距地面1米处。门向内开启，请用手向里推。推门时稍侧身进入。',
          actionText: '推开门'
        },
        {
          title: '进门',
          aiText: '已进入建筑，服务台在左侧',
          aiTags: ['进门', '服务台', '左侧5米'],
          text: '您已进入建筑。服务台在进门后左手边5米处，有工作人员可以咨询。前方通道宽敞，可安全通行。',
          actionText: '向前走进门'
        },
        {
          title: '确认位置',
          aiText: '已到达目的地入口',
          aiTags: ['到达', '入口'],
          text: '进门引导完成。您已安全到达目的地入口。需要帮助可以到服务台咨询工作人员。',
          actionText: '引导完成'
        }
      ];
    }
    return steps;
  }

  function startEntryGuidance() {
    if (userRole === 'family') {
      showFeedback('家人模式暂不支持入口引导', 'info');
      return;
    }
    if (entryGuidanceActive) return;
    
    entryGuidanceActive = true;
    entryGuidanceStep = 0;
    
    var destName = document.getElementById('arrivalDestName')?.textContent || '目的地';
    entryGuidanceSteps = getEntryGuidanceSteps(destName);
    
    // 更新按钮文字为"下一步"
    var entryBtn = document.querySelector('#arrivalScreen .arrival-action-btn[onclick*="arrivalEntryGuidance"]');
    if (entryBtn) {
      var btnText = entryBtn.querySelector('span:last-child');
      if (btnText) btnText.textContent = '下一步';
      entryBtn.setAttribute('aria-label', '下一步按钮');
    }
    
    // 打开摄像头
    if (!cameraOpen) {
      openCamera(true);
    }
    
    // 显示入口引导状态（可以在摄像头AI区域显示）
    showFeedback('🚪 开始入口引导', 'info');
    speak('开始入口引导，请面向正前方。上滑可进入下一步。第一步：' + entryGuidanceSteps[0].text, 'high');
    triggerHaptic('double');
    
    // 更新AI显示
    setTimeout(function() {
      if (cameraOpen && entryGuidanceActive) {
        updateCameraAI(entryGuidanceSteps[0].aiText, entryGuidanceSteps[0].aiTags);
      }
    }, 1500);
  }

  function nextEntryGuidanceStep() {
    if (!entryGuidanceActive) return;
    
    if (entryGuidanceStep < entryGuidanceSteps.length - 1) {
      entryGuidanceStep++;
      var step = entryGuidanceSteps[entryGuidanceStep];
      speak(step.text, 'high');
      triggerHaptic('light');
      
      if (cameraOpen) {
        updateCameraAI(step.aiText, step.aiTags);
      }
    } else {
      // 引导完成
      endEntryGuidance();
    }
  }

  function endEntryGuidance() {
    entryGuidanceActive = false;
    entryGuidanceStep = 0;
    entryGuidanceSteps = [];
    
    if (entryGuidanceTimer) {
      clearInterval(entryGuidanceTimer);
      entryGuidanceTimer = null;
    }
    
    // 恢复按钮文字
    var entryBtn = document.querySelector('#arrivalScreen .arrival-action-btn[onclick*="arrivalEntryGuidance"]');
    if (entryBtn) {
      var btnText = entryBtn.querySelector('span:last-child');
      if (btnText) btnText.textContent = '引导我进门';
      entryBtn.setAttribute('aria-label', '引导我进门按钮');
    }
    
    speak('入口引导完成，祝您顺利！有需要随时唤醒瞳伴', 'high');
    triggerHaptic('triple');
    showFeedback('✅ 入口引导完成', 'success');
    
    // 不自动关闭摄像头，用户可以继续使用
  }

  function arrivalEntryGuidance() {
    if (entryGuidanceActive) {
      // 如果正在引导中，点击按钮进入下一步
      nextEntryGuidanceStep();
    } else {
      // 开始引导
      startEntryGuidance();
    }
  }

  function finishNavigation() {
    if (navInterval) { clearInterval(navInterval); navInterval = null; }
    isNavigating = false;
    isNavPaused = false;
    isLastMile = false;
    isOffTrack = false;
    isRouteOffTrack = false;
    rerouteCount = 0;
    entryGuidanceActive = false;
    entryGuidanceStep = 0;
    entryGuidanceSteps = [];
    if (entryGuidanceTimer) {
      clearInterval(entryGuidanceTimer);
      entryGuidanceTimer = null;
    }
    if (cameraOpen) { closeCamera(); }
    speak('导航结束，祝您愉快，有需要随时唤醒瞳伴');
    triggerHaptic('light');
    showFeedback('✅ 导航结束', 'success');
    
    setTimeout(() => {
      // 家人模式下返回守护中心，视障模式下返回唤醒页
      if (userRole === 'family') {
        showScreen('family');
        switchTab('family');
      } else {
        showScreen('wake');
      }
    }, 800);
  }

  // ========== 盲道偏离纠偏（依赖摄像头AI场景识别） ==========
  function simulateTactileDeviation() {
    if (!isNavigating || selectedMode !== 'walk' || isLastMile || !cameraOpen) return;

    isOffTrack = true;
    offTrackDirection = Math.random() > 0.5 ? 'left' : 'right';

    const statusEl = document.getElementById('tactileStatus');
    if (!statusEl) return;
    statusEl.className = 'tactile-status deviation ' + offTrackDirection;
    const textEl = statusEl.querySelector('.tactile-text');
    const dirText = offTrackDirection === 'left' ? '向左偏' : '向右偏';
    const correctDir = offTrackDirection === 'left' ? '向右' : '向左';
    if (textEl) textEl.textContent = '⚠️ 盲道' + dirText + '，请' + correctDir + '调整';

    speak('注意，您已偏离盲道，请向' + correctDir + '调整', 'high');
    triggerHaptic('double');
    showFeedback('⚠️ 盲道偏离', 'warning');

    setTimeout(() => {
      if (isOffTrack) {
        correctTactileDeviation();
      }
    }, 3000);
  }

  function correctTactileDeviation() {
    isOffTrack = false;
    const statusEl = document.getElementById('tactileStatus');
    statusEl.className = 'tactile-status normal';
    statusEl.querySelector('.tactile-text').textContent = '沿盲道直行';
    speak('已回到盲道上，继续直行');
    triggerHaptic('light');
    showFeedback('✓ 已回到盲道', 'success');
  }

  // ========== 路线偏离纠偏 ==========
  function simulateRouteDeviation() {
    if (!isNavigating || isRouteOffTrack) return;
    
    isRouteOffTrack = true;
    rerouteCount++;
    
    const banner = document.getElementById('rerouteBanner');
    banner.style.display = 'flex';
    banner.setAttribute('role', 'alert');
    
    speak('您已偏离路线，正在为您重新规划');
    announce('您已偏离路线，正在为您重新规划');
    triggerHaptic('triple');
    showFeedback('🔄 路线偏离，重新规划中', 'warning');
    
    setTimeout(() => {
      if (isRouteOffTrack) {
        completeReroute();
      }
    }, 2500);
  }

  function completeReroute() {
    isRouteOffTrack = false;
    const banner = document.getElementById('rerouteBanner');
    banner.style.display = 'none';
    speak('路线已重新规划，请按新路线前行');
    announce('路线已重新规划，请按新路线前行');
    triggerHaptic('medium');
    showFeedback('✓ 路线已更新', 'success');
  }

  // ========== 最后一公里 ==========
  let lastMileAutoTimer = null;
  let lastMileDeviationTimer = null;
  let isLmDeviated = false;

  function enterLastMile() {
    if (isLastMile) return;
    const actualMode = getActualMode();
    if (actualMode === 'indoor') return;
    
    isLastMile = true;
    lmStepIndex = 0;
    isLmDeviated = false;
    stopArrivalCountdown();
    
    lastMileSteps = generateLastMileSteps(selectedDestination, actualMode);
    
    const banner = document.getElementById('lastMileBanner');
    banner.style.display = 'flex';
    banner.setAttribute('role', 'status');
    document.getElementById('lastMileSteps').style.display = 'block';
    
    renderLastMileSteps();
    
    let modeTip = 'AI视觉导航已启动';
    if (actualMode === 'taxi') {
      modeTip = '下车后步行引导已启动';
    } else if (['bus', 'metro', 'brt', 'tram'].includes(actualMode)) {
      modeTip = '出站后步行引导已启动';
    }
    
    const msg = '已进入最后一公里模式，' + modeTip + '。系统将根据您的位置自动推进，上滑也可手动进入下一步。';
    speak(msg, 'high');
    announce(msg);
    triggerHaptic('double');
    showFeedback('🎯 进入最后一公里', 'success');
    
    setTimeout(() => {
      if (!cameraOpen) {
        openCamera(true);
      } else {
        updateCameraSceneForLastMile();
      }
    }, 1000);
    
    startLastMileAutoProgress();
    startLastMileDeviationCheck();
  }

  function updateCameraSceneForLastMile() {
    if (!cameraOpen || !isLastMile) return;
    const firstStep = lastMileSteps[lmStepIndex];
    if (firstStep) {
      updateCameraAI(firstStep.aiText, firstStep.aiTags);
    }
  }

  function startLastMileAutoProgress() {
    if (lastMileAutoTimer) {
      clearInterval(lastMileAutoTimer);
      lastMileAutoTimer = null;
    }
    
    lastMileAutoTimer = setInterval(() => {
      if (!isLastMile || isLmDeviated) return;
      if (lmStepIndex < lastMileSteps.length - 1) {
        autoAdvanceLmStep();
      }
    }, 5000);
  }

  function autoAdvanceLmStep() {
    if (!isLastMile || isLmDeviated) return;
    if (lmStepIndex >= lastMileSteps.length - 1) return;
    
    lmStepIndex++;
    renderLastMileSteps();
    
    const step = lastMileSteps[lmStepIndex];
    speak(step.text, 'high');
    triggerHaptic('light');
    
    if (cameraOpen) {
      updateCameraAI(step.aiText, step.aiTags);
    }
    
    if (step.isFinal) {
      finishLastMile();
    }
  }

  function startLastMileDeviationCheck() {
    if (lastMileDeviationTimer) {
      clearInterval(lastMileDeviationTimer);
      lastMileDeviationTimer = null;
    }
    
    lastMileDeviationTimer = setInterval(() => {
      if (!isLastMile || isLmDeviated) return;
      
      if (Math.random() < 0.15 && lmStepIndex > 0 && lmStepIndex < lastMileSteps.length - 2) {
        triggerLastMileDeviation();
      }
    }, 6000);
  }

  function triggerLastMileDeviation() {
    if (!isLastMile || isLmDeviated) return;
    
    isLmDeviated = true;
    const direction = Math.random() > 0.5 ? '左侧' : '右侧';
    
    const banner = document.getElementById('lastMileBanner');
    if (banner) {
      banner.style.background = 'linear-gradient(135deg, #FF9500 0%, #FF3B30 100%)';
    }
    
    const msg = '⚠️ 检测到您偏' + direction + '了，请向' + (direction === '左侧' ? '右' : '左') + '调整，回到正确路线上';
    speak(msg, 'high');
    triggerHaptic('heavy');
    showFeedback('⚠️ 路线偏离，请调整方向', 'warning');
    
    setTimeout(() => {
      if (isLmDeviated && isLastMile) {
        correctLastMileDeviation();
      }
    }, 4000);
  }

  function correctLastMileDeviation() {
    if (!isLastMile || !isLmDeviated) return;
    
    isLmDeviated = false;
    
    const banner = document.getElementById('lastMileBanner');
    if (banner) {
      banner.style.background = 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)';
    }
    
    speak('已回到正确路线，继续前行', 'high');
    triggerHaptic('medium');
    showFeedback('✓ 已回到正确路线', 'success');
  }

  function renderLastMileSteps() {
    const container = document.getElementById('lmStepsContainer');
    container.innerHTML = lastMileSteps.map((step, i) => `
      <div class="lm-step ${i === lmStepIndex ? 'current' : ''} ${i < lmStepIndex ? 'done' : ''}" onclick="goToLmStep(${i})">
        <div class="lm-step-dot">${i < lmStepIndex ? '✓' : i + 1}</div>
        <div class="lm-step-content">
          <div class="lm-step-text">${step.text}</div>
          <div class="lm-step-detail">${step.detail}</div>
        </div>
      </div>
    `).join('');
  }

  function nextLmStep() {
    if (!isLastMile) return;
    if (isLmDeviated) {
      speak('您已偏离路线，请先回到正确路线上', 'high');
      return;
    }
    
    if (lmStepIndex < lastMileSteps.length - 1) {
      lmStepIndex++;
      renderLastMileSteps();
      
      const step = lastMileSteps[lmStepIndex];
      speak(step.text, 'high');
      
      if (cameraOpen) {
        updateCameraAI(step.aiText, step.aiTags);
      }
      
      triggerHaptic('light');
      
      if (step.isFinal) {
        finishLastMile();
      }
    }
  }

  function goToLmStep(index) {
    if (!isLastMile) return;
    if (isLmDeviated) {
      speak('您已偏离路线，请先回到正确路线上', 'high');
      return;
    }
    lmStepIndex = index;
    renderLastMileSteps();
    
    const step = lastMileSteps[index];
    speak(step.text, 'high');
    if (cameraOpen) {
      updateCameraAI(step.aiText, step.aiTags);
    }
    triggerHaptic('light');
    
    if (step.isFinal) {
      finishLastMile();
    }
  }

  function finishLastMile() {
    if (lastMileAutoTimer) {
      clearInterval(lastMileAutoTimer);
      lastMileAutoTimer = null;
    }
    if (lastMileDeviationTimer) {
      clearInterval(lastMileDeviationTimer);
      lastMileDeviationTimer = null;
    }
    
    setTimeout(() => {
      if (cameraOpen) { closeCamera(); }
      rerouteCount = 0;
      isLastMile = false;
      isNavigating = false;
      isOffTrack = false;
      isRouteOffTrack = false;
      offTrackDirection = '';
      cameraAutoOpenedForMode = false;
      dangerAskListening = false;
      isLmDeviated = false;
      
      var dangerBtn = document.getElementById('navDangerMarkBtn');
      if (dangerBtn) dangerBtn.style.display = 'none';
      
      if (navInterval) { clearInterval(navInterval); navInterval = null; }
      
      speak('已到达目的地，导航结束。有需要随时唤醒瞳伴', 'high');
      triggerHaptic('triple');
      showFeedback('🎉 已到达目的地', 'success');
      
      setTimeout(() => {
        enterArrivalMode();
      }, 1500);
    }, 2000);
  }

  // ========== AI摄像头 ==========
  function getActualMode() {
    return selectedMode === 'transit' ? selectedTransportType : selectedMode;
  }

  function openCamera(autoOpen = false) {
    try {
      if (userRole === 'family') {
        showFeedback('家人模式暂不支持摄像头功能', 'info');
        return;
      }
      if (cameraOpen) return;
      
      cameraOpen = true;
      const overlay = document.getElementById('cameraOverlay');
      if (overlay) overlay.classList.remove('hidden');
      
      let sceneKey = 'environment';
      if (isNavigating) {
        const actualMode = getActualMode();
        if (isLastMile) {
          sceneKey = 'walkNav';
        } else if (actualMode === 'walk') {
          sceneKey = 'walkNav';
        } else if (actualMode === 'taxi') {
          sceneKey = navProgress < 50 ? 'taxiFinding' : 'taxiDriving';
        } else if (actualMode === 'bus') {
          const steps = ['busWaiting', 'busBoarding', 'busInside', 'busAlighting'];
          const idx = Math.min(Math.floor(navProgress / 25), 3);
          sceneKey = steps[idx];
        } else if (actualMode === 'metro') {
          const steps = ['metroFinding', 'metroAtGate', 'metroOnEscalator', 'metroOnPlatform', 'metroBoarding', 'metroInside', 'metroAlighting'];
          const idx = Math.min(Math.floor(navProgress / 15), 6);
          sceneKey = steps[idx];
        } else if (actualMode === 'brt') {
          const steps = ['brtFinding', 'brtOnPlatform', 'brtBoarding', 'brtInside'];
          const idx = Math.min(Math.floor(navProgress / 25), 3);
          sceneKey = steps[idx];
        } else if (actualMode === 'tram') {
          const steps = ['tramFinding', 'tramOnPlatform', 'tramBoarding', 'tramInside', 'tramAlighting'];
          const idx = Math.min(Math.floor(navProgress / 20), 4);
          sceneKey = steps[idx];
        } else if (actualMode === 'indoor') {
          if (selectedDestination.includes('医院')) {
            const steps = ['hospitalEntrance', 'hospitalReception', 'hospitalClinic'];
            const idx = Math.min(Math.floor(navProgress / 35), 2);
            sceneKey = steps[idx];
          } else if (selectedDestination.includes('办公楼') || selectedDestination.includes('大厦') || selectedDestination.includes('写字楼')) {
            const steps = ['officeEntrance', 'officeReception', 'officeElevator'];
            const idx = Math.min(Math.floor(navProgress / 35), 2);
            sceneKey = steps[idx];
          } else if (selectedDestination.includes('学校') || selectedDestination.includes('大学') || selectedDestination.includes('中学') || selectedDestination.includes('小学')) {
            const steps = ['schoolEntrance', 'schoolBuilding', 'schoolClassroom'];
            const idx = Math.min(Math.floor(navProgress / 35), 2);
            sceneKey = steps[idx];
          } else if (selectedDestination.includes('机场') || selectedDestination.includes('航站楼')) {
            const steps = ['airportTerminal', 'airportCheckin', 'airportGate'];
            const idx = Math.min(Math.floor(navProgress / 35), 2);
            sceneKey = steps[idx];
          } else if (selectedDestination.includes('图书馆')) {
            const steps = ['libraryEntrance', 'libraryService', 'libraryBooks'];
            const idx = Math.min(Math.floor(navProgress / 35), 2);
            sceneKey = steps[idx];
          } else if (selectedDestination.includes('超市') || selectedDestination.includes('大卖场')) {
            const steps = ['supermarketEntrance', 'supermarketFresh', 'supermarketFood'];
            const idx = Math.min(Math.floor(navProgress / 35), 2);
            sceneKey = steps[idx];
          } else if (selectedDestination.includes('餐厅') || selectedDestination.includes('饭店') || selectedDestination.includes('火锅') || selectedDestination.includes('美食')) {
            const steps = ['restaurantEntrance', 'restaurantSeating'];
            const idx = Math.min(Math.floor(navProgress / 50), 1);
            sceneKey = steps[idx];
          } else if (selectedDestination.includes('博物馆') || selectedDestination.includes('展览馆') || selectedDestination.includes('美术馆')) {
            const steps = ['museumEntrance', 'museumService', 'museumExhibition'];
            const idx = Math.min(Math.floor(navProgress / 35), 2);
            sceneKey = steps[idx];
          } else {
            const steps = ['mallEntrance', 'mallElevator', 'mallShop'];
            const idx = Math.min(Math.floor(navProgress / 35), 2);
            sceneKey = steps[idx];
          }
        }
      }
      
      const scenes = aiScenesByMode[sceneKey] || aiScenesByMode.environment;
      if (scenes.length > 0) {
        const scene = scenes[0];
        updateCameraAI(scene.text, scene.tags);
      }
      
      if (cameraInterval) {
        clearInterval(cameraInterval);
        cameraInterval = null;
      }
      cameraRefreshInterval = getCameraRefreshInterval();
      let sceneIndex = 0;
      cameraInterval = setInterval(function() {
        try {
          if (!cameraOpen) return;
          sceneIndex = (sceneIndex + 1) % scenes.length;
          const scene = scenes[sceneIndex];
          updateCameraAI(scene.text, scene.tags);
        } catch (e) {
          console.error('[cameraInterval错误]', e.message);
        }
      }, cameraRefreshInterval);
      
      if (!autoOpen) {
        speak('AI摄像头已开启');
        showFeedback('📷 AI摄像头已开启', 'info');
        triggerHaptic('light');
      } else {
        showFeedback('📷 摄像头已自动开启', 'info');
        triggerHaptic('light');
      }
    } catch (e) {
      console.error('[openCamera错误]', e.message);
      cameraOpen = false;
    }
  }

  function closeCamera() {
    try {
      cameraOpen = false;
      removeClass('cameraOverlay', 'hidden');
      addClass('cameraOverlay', 'hidden');
      
      if (cameraInterval) {
        clearInterval(cameraInterval);
        cameraInterval = null;
      }
      
      speak('摄像头已关闭');
      triggerHaptic('light');
    } catch (e) {
      console.error('[closeCamera错误]', e.message);
    }
  }

  function updateCameraAI(text, tags) {
    try {
      var aiTextEl = $('aiMainText');
      if (aiTextEl) aiTextEl.textContent = text;
      const tagsEl = $('aiTags');
      if (tagsEl && tags && tags.length > 0) {
        tagsEl.innerHTML = tags.map(t =>
          `<span class="ai-tag ${t.type}" style="animation:tagFadeIn 0.3s ease">${t.text}</span>`
        ).join('');
      }
      speak(text, 'low');
    } catch (e) {
      console.error('[updateCameraAI错误]', e.message);
    }
  }

  // ========== 智能省电模式 ==========
  var batterySaverMode = 'auto';
  var batteryLevel = 100;
  var isLowBattery = false;
  var cameraRefreshInterval = 4000;

  function getCameraRefreshInterval() {
    if (!isNavigating) return 4000;
    
    var baseInterval = 4000;
    var actualMode = getActualMode();
    
    if (isLastMile) {
      baseInterval = 2000;
    } else if (actualMode === 'walk') {
      var nextStep = guidanceStepsData.find(s => s.pct >= navProgress + 5);
      if (nextStep && (nextStep.text.includes('转弯') || nextStep.text.includes('路口') || nextStep.text.includes('注意') || nextStep.text.includes('台阶'))) {
        baseInterval = 2000;
      } else {
        baseInterval = 6000;
      }
    } else {
      var currentStep = guidanceStepsData[Math.min(currentStepIndex + 1, guidanceStepsData.length - 1)];
      if (currentStep && (currentStep.text.includes('上车') || currentStep.text.includes('下车') || currentStep.text.includes('到达') || currentStep.text.includes('进站') || currentStep.text.includes('出站'))) {
        baseInterval = 2000;
      } else {
        baseInterval = 8000;
      }
    }
    
    if (batterySaverMode === 'on' || (batterySaverMode === 'auto' && isLowBattery)) {
      baseInterval = baseInterval * 2;
    }
    
    return Math.max(2000, baseInterval);
  }

  function applyCameraRefreshRate() {
    if (!cameraOpen || !cameraInterval) return;
    
    var newInterval = getCameraRefreshInterval();
    if (newInterval !== cameraRefreshInterval) {
      cameraRefreshInterval = newInterval;
      if (cameraInterval) {
        clearInterval(cameraInterval);
        cameraInterval = null;
      }
      
      var sceneKey = 'environment';
      var actualMode = getActualMode();
      if (actualMode === 'walk') sceneKey = 'walkNav';
      else if (actualMode === 'bus') sceneKey = 'busInside';
      else if (actualMode === 'metro') sceneKey = 'metroInside';
      else if (actualMode === 'taxi') sceneKey = 'taxiDriving';
      
      const scenes = aiScenesByMode[sceneKey] || aiScenesByMode.environment;
      let sceneIndex = 0;
      cameraInterval = setInterval(() => {
        if (!cameraOpen) return;
        sceneIndex = (sceneIndex + 1) % scenes.length;
        const scene = scenes[sceneIndex];
        updateCameraAI(scene.text, scene.tags);
      }, cameraRefreshInterval);
    }
  }

  function updateBatteryLevel(level) {
    batteryLevel = level;
    var wasLow = isLowBattery;
    isLowBattery = batteryLevel <= 20;
    
    if (isLowBattery && !wasLow && isNavigating) {
      speak('电量低于20%，已自动开启省电模式，摄像头识别频率降低', 'normal');
      showFeedback('🔋 低电量省电模式已开启', 'info');
    } else if (!isLowBattery && wasLow && isNavigating) {
      speak('电量恢复，已退出省电模式', 'normal');
      showFeedback('🔋 已退出省电模式', 'info');
    }
    
    applyCameraRefreshRate();
    updateBatteryIndicator();
  }

  function updateBatteryIndicator() {
    var indicator = document.getElementById('batteryIndicator');
    if (!indicator) return;
    
    var icon = '🔋';
    var color = '';
    if (batteryLevel <= 20) {
      icon = '🪫';
      color = 'color:#ff4444;';
    } else if (batteryLevel <= 50) {
      color = 'color:#ffaa00;';
    }
    
    indicator.textContent = icon + ' ' + batteryLevel + '%';
    indicator.style.cssText = color + 'font-size:14px;padding:2px 8px;';
  }

  function toggleBatterySaver() {
    if (batterySaverMode === 'auto') {
      batterySaverMode = 'on';
      speak('省电模式已开启', 'normal');
      showFeedback('🔋 省电模式：开启', 'info');
    } else if (batterySaverMode === 'on') {
      batterySaverMode = 'off';
      speak('省电模式已关闭', 'normal');
      showFeedback('🔋 省电模式：关闭', 'info');
    } else {
      batterySaverMode = 'auto';
      speak('省电模式已设为自动', 'normal');
      showFeedback('🔋 省电模式：自动', 'info');
    }
    applyCameraRefreshRate();
  }

  // ========== 信号质量与离线缓存 ==========
  var signalStrength = 4;
  var signalLabels = ['无信号', '弱', '一般', '良好', '优秀'];
  var isOfflineMode = false;
  var cachedRouteData = null;
  var lastKnownPosition = null;

  function updateSignalStrength(strength) {
    var oldStrength = signalStrength;
    signalStrength = Math.max(0, Math.min(4, strength));
    
    if (signalStrength <= 1 && oldStrength > 1 && isNavigating) {
      isOfflineMode = true;
      speak('信号较弱，已切换到离线导航模式，路线数据已缓存', 'high');
      showFeedback('📶 信号弱，已切换离线模式', 'warning');
      triggerHaptic('medium');
    } else if (signalStrength >= 3 && oldStrength <= 1 && isNavigating && isOfflineMode) {
      isOfflineMode = false;
      offlineDriftOffset = 0;
      speak('信号恢复，已切换回在线导航模式', 'normal');
      showFeedback('📶 信号恢复，在线导航', 'success');
    }
    
    applyNavTickInterval();
    updateSignalIndicator();
  }

  function updateSignalIndicator() {
    var indicator = document.getElementById('signalIndicator');
    if (!indicator) return;
    
    var bars = '';
    for (var i = 0; i <= signalStrength; i++) {
      bars += '▮';
    }
    for (var j = signalStrength + 1; j < 5; j++) {
      bars += '▯';
    }
    
    var color = '';
    if (signalStrength <= 1) color = 'color:#ff4444;';
    else if (signalStrength === 2) color = 'color:#ffaa00;';
    else color = 'color:#44ff44;';
    
    indicator.textContent = '📶 ' + signalLabels[signalStrength];
    indicator.style.cssText = color + 'font-size:14px;padding:2px 8px;';
  }

  function cacheRouteData() {
    if (!guidanceStepsData || guidanceStepsData.length === 0) return;
    
    cachedRouteData = {
      mode: getActualMode(),
      destination: selectedDestination,
      steps: JSON.parse(JSON.stringify(guidanceStepsData)),
      totalDistance: navTotalDistance || '未知',
      estimatedTime: navEstimatedTime || '未知',
      cachedAt: Date.now()
    };
    
    try {
      localStorage.setItem('tongban_cached_route', JSON.stringify(cachedRouteData));
    } catch(e) {}
  }

  function getCachedRouteData() {
    if (cachedRouteData) return cachedRouteData;
    try {
      var cached = localStorage.getItem('tongban_cached_route');
      if (cached) {
        cachedRouteData = JSON.parse(cached);
        return cachedRouteData;
      }
    } catch(e) {}
    return null;
  }

  function applyNavTickInterval() {
    if (!isNavigating || isLastMile) return;
    
    var baseInterval = 2000;
    if (isOfflineMode || signalStrength <= 1) {
      baseInterval = 4000;
    } else if (signalStrength === 2) {
      baseInterval = 3000;
    }
    
    if (navInterval) {
      clearInterval(navInterval);
    }
    navInterval = setInterval(navTick, baseInterval);
  }

  function simulateSignalChange() {
    if (!isNavigating) return;
    
    var change = Math.random() < 0.3 ? (Math.random() < 0.5 ? -1 : 1) : 0;
    var newStrength = signalStrength + change;
    if (newStrength < 0) newStrength = 0;
    if (newStrength > 4) newStrength = 4;
    
    if (newStrength !== signalStrength) {
      updateSignalStrength(newStrength);
    }
  }

  var offlineDriftOffset = 0;
  var offlineDriftDirection = 0;

  function simulateOfflineDrift() {
    if (!isOfflineMode || !isNavigating || isLastMile) return;
    
    if (Math.random() < 0.2) {
      offlineDriftDirection = Math.random() < 0.5 ? -1 : 1;
      offlineDriftOffset += offlineDriftDirection * (Math.random() * 3 + 1);
      offlineDriftOffset = Math.max(-15, Math.min(15, offlineDriftOffset));
      
      if (Math.abs(offlineDriftOffset) > 10) {
        speak('信号较弱，定位可能存在偏差，请根据语音提示谨慎前行', 'normal');
        showFeedback('📍 定位偏差约' + Math.abs(Math.round(offlineDriftOffset)) + '米', 'warning');
      }
    }
  }

  function correctOfflineDrift() {
    if (!isOfflineMode || offlineDriftOffset === 0) return;
    
    var correction = offlineDriftOffset > 0 ? -2 : 2;
    offlineDriftOffset += correction;
    
    if (Math.abs(offlineDriftOffset) < 2) {
      offlineDriftOffset = 0;
      if (isNavigating) {
        speak('路线已修正，请继续沿当前方向前进', 'normal');
        showFeedback('📍 路线已修正', 'success');
      }
    }
  }

  function getOfflineProgressIncrement() {
    var baseIncrement = 2;
    
    var currentStep = guidanceStepsData[Math.min(currentStepIndex, guidanceStepsData.length - 1)];
    var nextStep = guidanceStepsData[Math.min(currentStepIndex + 1, guidanceStepsData.length - 1)];
    
    if (currentStep && nextStep) {
      var distToNext = nextStep.pct - navProgress;
      if (distToNext < 5) {
        baseIncrement = 0.8 + distToNext * 0.2;
      } else if (distToNext > 15) {
        baseIncrement = 2.5 + Math.random() * 0.5;
      } else {
        baseIncrement = 1.5 + Math.random() * 0.5;
      }
    }
    
    if (isOfflineMode) {
      baseIncrement = baseIncrement * 0.75;
      if (signalStrength === 0) {
        baseIncrement = baseIncrement * 0.7;
      }
    }
    
    if (isLastMile) {
      baseIncrement = baseIncrement * 0.6;
    }
    
    return Math.max(0.3, baseIncrement);
  }

  function ensureOfflineRouteData() {
    if (!isOfflineMode) return true;
    
    var cached = getCachedRouteData();
    if (cached && cached.steps && cached.steps.length > 0) {
      return true;
    }
    
    if (guidanceStepsData && guidanceStepsData.length > 0) {
      cacheRouteData();
      return true;
    }
    
    speak('离线数据不可用，导航可能受到影响', 'high');
    showFeedback('⚠️ 离线数据不足', 'error');
    return false;
  }

  // ========== 危险预警 ==========
  function triggerDangerAlert(level) {
    const now = Date.now();
    if (now - lastDangerAlert < DANGER_COOLDOWN && level !== 'critical') return;
    lastDangerAlert = now;
    
    const scenes = dangerScenes[level];
    if (!scenes || scenes.length === 0) return;
    
    const scene = scenes[Math.floor(Math.random() * scenes.length)];
    
    const overlay = document.getElementById('dangerOverlay');
    if (!overlay) return;
    overlay.className = 'danger-overlay show ' + level;
    
    var alertIcon = document.getElementById('dangerAlertIcon');
    var alertText = document.getElementById('dangerAlertText');
    var alertDir = document.getElementById('dangerDirection');
    var alertAct = document.getElementById('dangerAction');
    if (alertIcon) alertIcon.textContent = 
      level === 'critical' ? '🚨' : level === 'high' ? '⚠️' : level === 'medium' ? '⚡' : '💡';
    if (alertText) alertText.textContent = 
      level === 'critical' ? '危险！' : level === 'high' ? '警告！' : level === 'medium' ? '注意' : '提示';
    if (alertDir) alertDir.textContent = '位置：' + scene.direction;
    if (alertAct) alertAct.textContent = scene.action;
    
    // 危险预警按级别设置语音优先级
    const speechPrio = level === 'critical' ? 'critical' : level === 'high' ? 'high' : 'normal';
    speak(scene.text, speechPrio);
    
    const hapticType = level === 'critical' ? 'triple' : level === 'high' ? 'double' : 'medium';
    triggerHaptic(hapticType);
    
    const displayTime = level === 'critical' ? 4000 : level === 'high' ? 3000 : 2000;
    setTimeout(() => {
      overlay.classList.remove('show');
    }, displayTime);

    // 视障用户：危险预警后语音询问是否共享到社区
    // - critical/high 级别直接询问
    // - medium 级别中，施工、障碍物、占道等影响出行的场景也询问
    if (userRole === 'blind' && isNavigating) {
      var shouldAsk = false;
      if (level === 'critical' || level === 'high') {
        shouldAsk = true;
      } else if (level === 'medium') {
        var keywords = ['施工', '障碍', '占道', '围挡', '坑洼', '积水', '台阶'];
        var sceneText = scene.text || '';
        for (var i = 0; i < keywords.length; i++) {
          if (sceneText.includes(keywords[i])) {
            shouldAsk = true;
            break;
          }
        }
      }
      
      if (shouldAsk) {
        setTimeout(function() {
          askDangerReportVoice(scene.text);
        }, displayTime + 500);
      }
    }
  }

  // ========== 紧急求助 ==========
  var emergencyCountdownTimer = null;
  var emergencyCountdownValue = 0;
  var emergencyConfirmed = false;

  function toggleEmergency() {
    const overlay = document.getElementById('emergencyOverlay');
    if (overlay.classList.contains('hidden')) {
      triggerEmergency();
    } else {
      cancelEmergency();
    }
  }

  function triggerEmergency() {
    emergencyConfirmed = false;
    const overlay = document.getElementById('emergencyOverlay');
    const countdownEl = document.getElementById('emergencyCountdown');
    overlay.classList.remove('hidden');
    // 先显示倒计时，隐藏内容
    overlay.querySelector('.emergency-content').style.display = 'none';
    overlay.querySelector('.emergency-cancel').style.display = 'none';
    overlay.querySelector('.emergency-hint').style.display = 'none';
    countdownEl.style.display = 'flex';
    emergencyCountdownValue = 3;
    countdownEl.textContent = '3';
    speak('紧急求助倒计时，3秒后自动呼叫，摇动或点击停止可取消', 'critical');
    triggerHaptic('medium');

    function tick() {
      emergencyCountdownValue--;
      if (emergencyCountdownValue > 0) {
        countdownEl.textContent = emergencyCountdownValue;
        triggerHaptic('medium');
        emergencyCountdownTimer = setTimeout(tick, 1000);
      } else {
        // 倒计时结束，正式触发
        confirmEmergency();
      }
    }
    emergencyCountdownTimer = setTimeout(tick, 1000);
  }

  function confirmEmergency() {
    emergencyConfirmed = true;
    const countdownEl = document.getElementById('emergencyCountdown');
    const overlay = document.getElementById('emergencyOverlay');
    countdownEl.style.display = 'none';
    overlay.querySelector('.emergency-content').style.display = 'block';
    overlay.querySelector('.emergency-cancel').style.display = 'block';
    overlay.querySelector('.emergency-hint').style.display = 'block';
    
    var contacts = overlay.querySelectorAll('.emergency-contact');
    if (contacts.length > 0) {
      var firstContact = contacts[0];
      var dot = firstContact.querySelector('.ec-dot');
      if (dot) {
        dot.classList.remove('calling');
        dot.classList.add('calling');
      }
      var relationEl = firstContact.querySelector('.emergency-contact-relation');
      if (relationEl) {
        relationEl.innerHTML = '<span class="ec-dot calling"></span>正在呼叫…';
      }
      
      var callSeconds = 0;
      var callTimer = setInterval(function() {
        callSeconds++;
        if (callSeconds >= 6) {
          clearInterval(callTimer);
          if (relationEl) {
            relationEl.innerHTML = '<span class="ec-dot" style="background:#34C759;"></span>已接通';
          }
          if (contacts[1]) {
            var secondRelation = contacts[1].querySelector('.emergency-contact-relation');
            if (secondRelation) {
              secondRelation.innerHTML = '<span class="ec-dot calling"></span>正在呼叫…';
            }
          }
          speak('第一位紧急联系人已接通');
          triggerHaptic('success');
        }
      }, 1000);
    }
    
    speak('紧急求助已触发，正在联系第一位紧急联系人');
    triggerHaptic('triple');
    showFeedback('🆘 紧急求助已触发', 'danger');
  }

  function cancelEmergency() {
    if (emergencyCountdownTimer) {
      clearTimeout(emergencyCountdownTimer);
      emergencyCountdownTimer = null;
    }
    const overlay = document.getElementById('emergencyOverlay');
    const countdownEl = document.getElementById('emergencyCountdown');
    countdownEl.style.display = 'none';
    // 恢复内容显示
    overlay.querySelector('.emergency-content').style.display = '';
    overlay.querySelector('.emergency-cancel').style.display = '';
    overlay.querySelector('.emergency-hint').style.display = '';
    overlay.classList.add('hidden');
    if (!emergencyConfirmed) {
      speak('已取消紧急求助');
      triggerHaptic('light');
    }
    emergencyConfirmed = false;
  }

  // ========== 手势教程 ==========
  const gestureDescriptions = {
    singletap: '点击屏幕，可播报当前导航进度和位置',
    doubletap: '双击屏幕，可重播语音指令或确认操作',
    longpress: '长按屏幕1秒，唤醒语音助手，可语音问答和跳转页面',
    swipeleft: '手指从右向左滑动，可打开AI摄像头识别环境',
    swiperight: '手指从左向右滑动，可返回上一页或取消操作',
    shake: '晃动手机，可触发紧急求助呼叫'
  };

  // 家人模式手势说明（简化版）
  const familyGestureDescriptions = {
    longpress: '长按屏幕，唤醒语音助手',
    swipeleft: '手指从右向左滑动，可查看家人实时位置',
    swiperight: '手指从左向右滑动，可返回上一页'
  };

  function openGestureTutorial() {
    document.getElementById('gestureTutorialOverlay').classList.remove('hidden');
    updateGestureTutorialList();
    if (userRole === 'family') {
      speak('家人模式手势说明：右滑返回');
    } else {
      speak('手势操作说明，共4个手势');
    }
    triggerHaptic('light');
  }

  function updateGestureTutorialList() {
    var listEl = document.querySelector('.gesture-tutorial-list');
    if (!listEl) return;
    
    var items = [];
    if (userRole === 'family') {
      items = [
        { iconBg: '#F3E5F5', iconColor: '#7B1FA2', iconSvg: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="2" fill="currentColor"/>', name: '长按', desc: '唤醒语音助手', type: 'longpress' },
        { iconBg: '#F3E5F5', iconColor: '#6A1B9A', iconSvg: '<polyline points="15 18 9 12 15 6"/>', name: '右滑', desc: '返回上一页', type: 'swiperight' }
      ];
    } else {
      items = [
        { iconBg: '#E8F5E9', iconColor: '#2E7D32', iconSvg: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>', name: '单击', desc: '播报当前导航状态', type: 'singletap' },
        { iconBg: '#E3F2FD', iconColor: '#1565C0', iconSvg: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>', name: '双击', desc: '重播语音或确认操作', type: 'doubletap' },
        { iconBg: '#F3E5F5', iconColor: '#7B1FA2', iconSvg: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="2" fill="currentColor"/>', name: '长按', desc: '唤醒语音助手', type: 'longpress' },
        { iconBg: '#FFF3E0', iconColor: '#EF6C00', iconSvg: '<polyline points="9 18 15 12 9 6"/>', name: '左滑', desc: '打开AI摄像头识别环境', type: 'swipeleft' },
        { iconBg: '#F3E5F5', iconColor: '#6A1B9A', iconSvg: '<polyline points="15 18 9 12 15 6"/>', name: '右滑', desc: '返回上一页或取消操作', type: 'swiperight' },
        { iconBg: '#FFEBEE', iconColor: '#C62828', iconSvg: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>', name: '摇一摇', desc: '触发紧急求助呼叫', type: 'shake' }
      ];
    }
    
    listEl.innerHTML = items.map(function(item) {
      return '<div class="gesture-tutorial-item" role="listitem" onclick="playGestureItem(\'' + item.type + '\')" tabindex="0" aria-label="' + item.name + '，' + item.desc + '">' +
        '<div class="gesture-icon" style="background:' + item.iconBg + '; color:' + item.iconColor + ';">' +
          '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + item.iconSvg + '</svg>' +
        '</div>' +
        '<div class="gesture-info">' +
          '<div class="gesture-name">' + item.name + '</div>' +
          '<div class="gesture-desc">' + item.desc + '</div>' +
        '</div>' +
        '<div class="gesture-play-btn" aria-label="播放说明">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  function closeGestureTutorial() {
    document.getElementById('gestureTutorialOverlay').classList.add('hidden');
    triggerHaptic('light');
  }

  function playGestureItem(type) {
    // 家人模式下只支持基本手势
    if (userRole === 'family') {
      const desc = familyGestureDescriptions[type] || '家人模式不支持此手势';
      speak(desc);
    } else {
      const desc = gestureDescriptions[type] || '暂无说明';
      speak(desc);
    }
    triggerHaptic('light');
  }

  function playGestureTutorial() {
    const order = userRole === 'family'
      ? ['longpress', 'swipeleft', 'swiperight']
      : ['singletap', 'doubletap', 'longpress', 'swipeleft', 'swiperight', 'shake'];
    let idx = 0;
    function playNext() {
      if (idx >= order.length) return;
      const descriptions = userRole === 'family' ? familyGestureDescriptions : gestureDescriptions;
      speak(descriptions[order[idx]], 'low');
      idx++;
      setTimeout(playNext, 4000);
    }
    playNext();
    const count = userRole === 'family' ? 3 : 6;
    speak('开始播放手势教程，共' + count + '个手势');
    triggerHaptic('light');
  }

  // ========== 手势交互 ==========
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;
  let lastTapTime = 0;
  let longPressTimer = null;
  let isLongPress = false;
  let isTouchEvent = false; // 防止 touch/mouse 事件双重触发
  const LONG_PRESS_THRESHOLD = 500; // 长按阈值
  const TAP_DELAY = 250; // 单击延迟（等待双击）
  const SWIPE_THRESHOLD = 50; // 滑动阈值

  // 检查是否有遮挡层（语音助手/搜索/紧急求助）打开
  function isOverlayActive() {
    if (voiceAssistantActive) return true;
    var searchOverlay = document.getElementById('wakeSearchOverlay');
    if (searchOverlay && searchOverlay.style.display === 'flex') return true;
    var emergencyOverlay = document.getElementById('emergencyOverlay');
    if (emergencyOverlay && !emergencyOverlay.classList.contains('hidden')) return true;
    return false;
  }

  function initGestureHandlers() {
    const screen = document.getElementById('phoneScreen');

    screen.addEventListener('touchstart', handleTouchStart, { passive: true });
    screen.addEventListener('touchend', handleTouchEnd, { passive: true });
    screen.addEventListener('touchmove', handleTouchMove, { passive: true });

    screen.addEventListener('mousedown', handleMouseDown);
    screen.addEventListener('mouseup', handleMouseUp);
    screen.addEventListener('mousemove', handleMouseMove);
  }

  function handleTouchStart(e) {
    isTouchEvent = true;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchStartTime = Date.now();
    isLongPress = false;

    longPressTimer = setTimeout(() => {
      isLongPress = true;
      onLongPress();
    }, LONG_PRESS_THRESHOLD);
  }

  function handleTouchMove(e) {
    const dx = e.touches[0].clientX - touchStartX;
    const dy = e.touches[0].clientY - touchStartY;

    if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
    }
  }

  function handleTouchEnd(e) {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }

    if (isLongPress) {
      // 延迟重置 isTouchEvent，防止后续 mouse 模拟事件触发
      setTimeout(() => { isTouchEvent = false; }, 500);
      return;
    }

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const dx = touchEndX - touchStartX;
    const dy = touchEndY - touchStartY;
    const dt = Date.now() - touchStartTime;

    // 单击/双击判定（允许更宽的时间窗口，避免 300-500ms 之间被忽略）
    if (dt < 500 && Math.abs(dx) < 10 && Math.abs(dy) < 10) {
      const now = Date.now();
      if (now - lastTapTime < TAP_DELAY) {
        onDoubleTap();
        lastTapTime = 0;
      } else {
        lastTapTime = now;
        setTimeout(() => {
          if (Date.now() - lastTapTime >= TAP_DELAY && lastTapTime !== 0) {
            onSingleTap();
            lastTapTime = 0; // 触发后重置，避免后续误判为双击
          }
        }, TAP_DELAY);
      }
      setTimeout(() => { isTouchEvent = false; }, 500);
      return;
    }

    if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) {
        onSwipeRight();
      } else {
        onSwipeLeft();
      }
    } else if (Math.abs(dy) > SWIPE_THRESHOLD && Math.abs(dy) > Math.abs(dx)) {
      if (dy < 0) {
        onSwipeUp();
      }
    }
    setTimeout(() => { isTouchEvent = false; }, 500);
  }

  let mouseStartX = 0;
  let mouseStartY = 0;
  let mouseStartTime = 0;
  let mouseDown = false;
  let mouseLongPressTimer = null;
  let isMouseLongPress = false;

  function handleMouseDown(e) {
    // 跳过 touch 事件触发的模拟 mouse 事件，避免双重触发
    if (isTouchEvent) return;
    mouseStartX = e.clientX;
    mouseStartY = e.clientY;
    mouseStartTime = Date.now();
    mouseDown = true;
    isMouseLongPress = false;

    mouseLongPressTimer = setTimeout(() => {
      isMouseLongPress = true;
      onLongPress();
    }, LONG_PRESS_THRESHOLD);
  }

  function handleMouseMove(e) {
    if (!mouseDown) return;
    const dx = e.clientX - mouseStartX;
    const dy = e.clientY - mouseStartY;

    if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
      if (mouseLongPressTimer) {
        clearTimeout(mouseLongPressTimer);
        mouseLongPressTimer = null;
      }
    }
  }

  function handleMouseUp(e) {
    if (mouseLongPressTimer) {
      clearTimeout(mouseLongPressTimer);
      mouseLongPressTimer = null;
    }

    if (!mouseDown) return;
    mouseDown = false;

    if (isMouseLongPress) return;

    const dx = e.clientX - mouseStartX;
    const dy = e.clientY - mouseStartY;
    const dt = Date.now() - mouseStartTime;

    if (dt < 500 && Math.abs(dx) < 10 && Math.abs(dy) < 10) {
      const now = Date.now();
      if (now - lastTapTime < TAP_DELAY) {
        onDoubleTap();
        lastTapTime = 0;
      } else {
        lastTapTime = now;
        setTimeout(() => {
          if (Date.now() - lastTapTime >= TAP_DELAY && lastTapTime !== 0) {
            onSingleTap();
            lastTapTime = 0;
          }
        }, TAP_DELAY);
      }
      return;
    }

    if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) {
        onSwipeRight();
      } else {
        onSwipeLeft();
      }
    } else if (Math.abs(dy) > SWIPE_THRESHOLD && Math.abs(dy) > Math.abs(dx)) {
      if (dy < 0) {
        onSwipeUp();
      }
    }
  }

  function onLongPress() {
    if (userRole === 'family') {
      openVoiceAssistant();
      return;
    }
    triggerHaptic('medium');
    openVoiceAssistant();
  }

  // ========== 语音助手系统 ==========
  var voiceAssistantActive = false;
  var voiceAssistantTimer = null;
  var voiceAssistantStep = 0;

  function openVoiceAssistant() {
    if (voiceAssistantActive) return;
    voiceAssistantActive = true;
    voiceAssistantStep = 0;
    
    var existing = document.getElementById('voiceAssistantOverlay');
    if (existing) {
      existing.style.display = 'flex';
      existing.style.opacity = '1';
      updateVoiceAssistantContext();
      return;
    }
    
    var html = '';
    html += '<div id="voiceAssistantOverlay" style="position:absolute;top:0;left:0;right:0;bottom:0;z-index:800;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,0,0,0.85);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);transition:opacity 0.3s ease;">';
    
    // 声波动画圈
    html += '<div style="position:relative;width:140px;height:140px;margin-bottom:24px;">';
    html += '<div id="vaRing1" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:140px;height:140px;border-radius:50%;border:2px solid rgba(0,122,255,0.3);animation:vaRing 2s ease-out infinite;"></div>';
    html += '<div id="vaRing2" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:140px;height:140px;border-radius:50%;border:2px solid rgba(88,86,214,0.3);animation:vaRing 2s ease-out infinite;animation-delay:0.6s;"></div>';
    html += '<div id="vaRing3" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:140px;height:140px;border-radius:50%;border:2px solid rgba(175,82,222,0.3);animation:vaRing 2s ease-out infinite;animation-delay:1.2s;"></div>';
    html += '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:80px;height:80px;border-radius:50%;background:radial-gradient(circle at 30% 30%,#93C5FD 0%,#3B82F6 30%,#6366F1 60%,#8B5CF6 100%);display:flex;align-items:center;justify-content:center;font-size:36px;box-shadow:0 0 40px rgba(99,102,241,0.5);">';
    html += '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>';
    html += '</div>';
    html += '</div>';
    
    // 状态文字
    html += '<div id="vaStatus" style="color:#fff;font-size:18px;font-weight:600;margin-bottom:8px;letter-spacing:0.5px;">正在聆听...</div>';
    html += '<div id="vaHint" style="color:rgba(255,255,255,0.4);font-size:13px;text-align:center;max-width:280px;line-height:1.6;"></div>';
    
    // 识别结果
    html += '<div id="vaResult" style="margin-top:20px;padding:12px 20px;background:rgba(255,255,255,0.08);border-radius:14px;color:#fff;font-size:14px;max-width:300px;text-align:center;display:none;line-height:1.5;"></div>';
    
    // 回答内容
    html += '<div id="vaAnswer" style="margin-top:12px;padding:16px 20px;background:rgba(0,122,255,0.15);border:0.5px solid rgba(0,122,255,0.3);border-radius:14px;color:#93C5FD;font-size:14px;max-width:300px;text-align:center;display:none;line-height:1.6;"></div>';
    
    // 快捷指令
    html += '<div id="vaShortcuts" style="margin-top:28px;display:flex;flex-wrap:wrap;gap:8px;justify-content:center;max-width:320px;"></div>';
    
    // 关闭按钮
    html += '<div onclick="closeVoiceAssistant()" style="position:absolute;bottom:40px;width:56px;height:56px;border-radius:50%;background:rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.2s ease;" ontouchstart="this.style.background=\'rgba(255,255,255,0.2)\'" ontouchend="this.style.background=\'rgba(255,255,255,0.1)\'">';
    html += '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    html += '</div>';
    
    html += '</div>';
    
    var phoneScreen = document.querySelector('.phone-screen') || document.body;
    phoneScreen.insertAdjacentHTML('beforeend', html);
    
    updateVoiceAssistantContext();
    startVoiceAssistantListening();
  }

  function updateVoiceAssistantContext() {
    var hintEl = $('vaHint');
    var shortcutEl = $('vaShortcuts');
    if (!hintEl || !shortcutEl) return;
    
    var shortcuts = [];
    var hintText = '';
    
    if (currentScreen === 'wake' || currentScreen === 'nav' && !isNavigating) {
      hintText = '试试说："去星巴克" "打开摄像头" "查看社区"';
      shortcuts = [
        { text: '去星巴克', cmd: '去星巴克' },
        { text: '打开摄像头', cmd: '打开摄像头' },
        { text: '查看社区', cmd: '查看社区' },
        { text: '查看家人', cmd: '查看家人' },
        { text: '我的设置', cmd: '我的设置' }
      ];
    } else if (isNavigating) {
      hintText = '试试说："还有多远" "下一步怎么走" "周围有什么" "结束导航"';
      shortcuts = [
        { text: '还有多远', cmd: '还有多远' },
        { text: '下一步怎么走', cmd: '下一步怎么走' },
        { text: '周围有什么', cmd: '周围有什么' },
        { text: '打开摄像头', cmd: '打开摄像头' },
        { text: '结束导航', cmd: '结束导航' }
      ];
    } else if (currentScreen === 'arrival') {
      hintText = '试试说："周围有什么" "返回首页" "分享到社区"';
      shortcuts = [
        { text: '周围有什么', cmd: '周围有什么' },
        { text: '返回首页', cmd: '返回首页' },
        { text: '分享到社区', cmd: '分享到社区' }
      ];
    } else if (currentScreen === 'community') {
      hintText = '试试说："查看危险标记" "返回首页" "发布动态"';
      shortcuts = [
        { text: '返回首页', cmd: '返回首页' },
        { text: '查看家人', cmd: '查看家人' },
        { text: '我的设置', cmd: '我的设置' }
      ];
    } else if (currentScreen === 'family') {
      hintText = '试试说："查看位置" "返回首页"';
      shortcuts = [
        { text: '查看位置', cmd: '查看位置' },
        { text: '返回首页', cmd: '返回首页' }
      ];
    } else {
      hintText = '试试说："去星巴克" "打开摄像头"';
      shortcuts = [
        { text: '去星巴克', cmd: '去星巴克' },
        { text: '打开摄像头', cmd: '打开摄像头' },
        { text: '查看社区', cmd: '查看社区' },
        { text: '查看家人', cmd: '查看家人' }
      ];
    }
    
    hintEl.textContent = hintText;
    shortcutEl.innerHTML = shortcuts.map(function(s) {
      return '<div onclick="executeVoiceCommand(\'' + s.cmd.replace(/'/g, "\\'") + '\')" style="padding:8px 16px;background:rgba(255,255,255,0.06);border:0.5px solid rgba(255,255,255,0.12);border-radius:20px;color:rgba(255,255,255,0.8);font-size:13px;cursor:pointer;transition:all 0.2s ease;" ontouchstart="this.style.background=\'rgba(0,122,255,0.2)\'" ontouchend="this.style.background=\'rgba(255,255,255,0.06)\'">' + s.text + '</div>';
    }).join('');
  }

  function startVoiceAssistantListening() {
    voiceAssistantStep = 0;
    var statusEl = $('vaStatus');
    if (statusEl) statusEl.textContent = '正在聆听...';
    
    speak('请说您的指令');
    triggerHaptic('light');
    
    voiceAssistantTimer = setTimeout(function() {
      var commands = getVoiceCommands();
      var cmd = commands[Math.floor(Math.random() * commands.length)];
      recognizeVoiceCommand(cmd);
    }, 2500);
  }

  function getVoiceCommands() {
    if (isNavigating) {
      return ['还有多远', '下一步怎么走', '周围有什么', '打开摄像头', '结束导航'];
    } else if (currentScreen === 'arrival') {
      return ['周围有什么', '返回首页', '分享到社区'];
    } else {
      return ['去星巴克', '打开摄像头', '查看社区', '查看家人', '我的设置'];
    }
  }

  function recognizeVoiceCommand(command) {
    var resultEl = $('vaResult');
    var statusEl = $('vaStatus');
    var answerEl = $('vaAnswer');
    
    if (resultEl) { resultEl.style.display = 'block'; resultEl.textContent = '"' + command + '"'; }
    if (statusEl) statusEl.textContent = '已识别';
    
    setTimeout(function() {
      executeVoiceCommand(command);
    }, 600);
  }

  function executeVoiceCommand(command) {
    var answerEl = $('vaAnswer');
    var statusEl = $('vaStatus');
    if (statusEl) statusEl.textContent = '处理中...';
    
    var response = processVoiceCommand(command);
    
    if (answerEl) {
      answerEl.style.display = 'block';
      answerEl.textContent = response.text;
    }
    
    if (statusEl) statusEl.textContent = '已回答';
    speak(response.text, 'normal');
    triggerHaptic('light');
    
    if (response.action) {
      setTimeout(function() {
        closeVoiceAssistant();
        response.action();
      }, 2000);
    } else {
      voiceAssistantTimer = setTimeout(function() {
        closeVoiceAssistant();
      }, 4000);
    }
  }

  function processVoiceCommand(command) {
    command = command.toLowerCase().replace(/\s/g, '');
    
    // 导航相关
    if (command.indexOf('还有多远') >= 0 || command.indexOf('距离') >= 0 || command.indexOf('多远') >= 0) {
      if (isNavigating) {
        var step = isLastMile && lastMileSteps && lastMileSteps.length > 0
          ? lastMileSteps[Math.min(lmStepIndex, lastMileSteps.length - 1)]
          : guidanceStepsData[Math.min(currentStepIndex, guidanceStepsData.length - 1)];
        var remaining = 100 - navProgress;
        return { text: '当前进度' + Math.round(navProgress) + '%，距离目的地还有' + (step ? step.dist : '') + '，预计还需' + Math.round(remaining * 0.5) + '分钟' };
      }
      return { text: '当前没有正在进行的导航' };
    }
    
    if (command.indexOf('下一步') >= 0 || command.indexOf('怎么走') >= 0 || command.indexOf('前方') >= 0) {
      if (isNavigating) {
        var step = isLastMile && lastMileSteps && lastMileSteps.length > 0
          ? lastMileSteps[Math.min(lmStepIndex + 1, lastMileSteps.length - 1)]
          : guidanceStepsData[Math.min(currentStepIndex + 1, guidanceStepsData.length - 1)];
        return { text: '下一步：' + (step ? step.text : '继续直行') + (step ? '，距离' + step.dist : '') };
      }
      return { text: '当前没有正在进行的导航' };
    }
    
    if (command.indexOf('周围') >= 0 || command.indexOf('附近') >= 0 || command.indexOf('环境') >= 0) {
      if (command.indexOf('公交') >= 0 || command.indexOf('车') >= 0 || command.indexOf('地铁') >= 0 || command.indexOf('站') >= 0) {
        var topStations = nearbyStations.slice(0, 3);
        var summary = topStations.map(function(s) {
          var fastest = s.lines.reduce(function(f, l) {
            var t = l.arrivals[0] ? l.arrivals[0].totalSeconds : 9999;
            return t < f.t ? { name: l.name, t: t } : f;
          }, { name: '', t: 9999 });
          return s.name + '，最近一班' + fastest.name + '还有' + Math.round(fastest.t / 60) + '分钟';
        }).join('；');
        return { text: '附近有' + nearbyStations.length + '个站点，' + summary, action: function() { openWakeSearch(); } };
      }
      if (isNavigating) {
        return { text: '周围环境：前方有行人通行，左侧有商铺，右侧为人行道，地面平整，盲道正常', action: function() { if (!cameraOpen) openCamera(); } };
      } else if (currentScreen === 'arrival') {
        var envDescEl = $('arrivalEnvDesc');
        return { text: '当前位置：' + selectedDestination + '附近，' + (envDescEl ? envDescEl.textContent : '周围有商铺和公共设施'), action: function() { if (!cameraOpen) openCamera(); } };
      } else {
        return { text: '正在为您打开摄像头识别周围环境', action: function() { openCamera(); } };
      }
    }
    
    if (command.indexOf('打开摄像头') >= 0 || command.indexOf('开启摄像头') >= 0 || command.indexOf('看看') >= 0) {
      return { text: '正在打开摄像头，为您识别周围环境', action: function() { openCamera(); } };
    }
    
    if (command.indexOf('结束导航') >= 0 || command.indexOf('停止导航') >= 0 || command.indexOf('退出导航') >= 0) {
      if (isNavigating) {
        return { text: '正在结束导航', action: function() { finishNavigation(); } };
      }
      return { text: '当前没有正在进行的导航' };
    }
    
    // 页面跳转
    if (command.indexOf('社区') >= 0 || command.indexOf('查看社区') >= 0) {
      return { text: '正在为您跳转到社区页面', action: function() { showScreen('community'); switchTab('community'); } };
    }
    
    if (command.indexOf('家人') >= 0 || command.indexOf('守护') >= 0 || command.indexOf('查看家人') >= 0) {
      return { text: '正在为您跳转到家人守护页面', action: function() { showScreen('family'); switchTab('family'); } };
    }
    
    if (command.indexOf('设置') >= 0 || command.indexOf('我的设置') >= 0 || command.indexOf('我的') >= 0) {
      return { text: '正在为您打开设置页面', action: function() { showScreen('my'); switchTab('my'); } };
    }
    
    if (command.indexOf('返回') >= 0 || command.indexOf('首页') >= 0 || command.indexOf('回到首页') >= 0) {
      return { text: '正在返回首页', action: function() { showScreen('wake'); switchTab('wake'); } };
    }
    
    // 搜索目的地
    if (command.indexOf('去') >= 0 || command.indexOf('导航') >= 0 || command.indexOf('搜索') >= 0) {
      var dest = '';
      if (command.indexOf('星巴克') >= 0) dest = '星巴克咖啡';
      else if (command.indexOf('医院') >= 0) dest = '人民医院';
      else if (command.indexOf('广场') >= 0 || command.indexOf('万达') >= 0) dest = '万达广场';
      else if (command.indexOf('火车') >= 0 || command.indexOf('车站') >= 0) dest = '火车站';
      else if (command.indexOf('地铁') >= 0) dest = '人民广场地铁站';
      else if (command.indexOf('超市') >= 0) dest = '超市';
      else dest = '星巴克咖啡';
      
      return { text: '正在为您搜索' + dest, action: function() {
        selectedDestination = dest;
        showScreen('route');
      }};
    }
    
    // 求助
    if (command.indexOf('求助') >= 0 || command.indexOf('紧急') >= 0 || command.indexOf('救命') >= 0 || command.indexOf('帮帮我') >= 0) {
      return { text: '正在触发紧急求助', action: function() { triggerEmergency(); } };
    }
    
    // 信号和电量
    if (command.indexOf('信号') >= 0 || command.indexOf('网络') >= 0) {
      return { text: '当前信号' + signalLevel + '级，' + (signalLevel >= 3 ? '信号良好' : signalLevel >= 1 ? '信号一般' : '信号较弱，已切换离线模式') };
    }
    
    if (command.indexOf('电量') >= 0 || command.indexOf('电池') >= 0) {
      return { text: '当前电量' + batteryLevel + '%，' + (batteryLevel > 20 ? '电量充足' : '电量较低，已开启省电模式') };
    }
    
    // 帮助
    if (command.indexOf('帮助') >= 0 || command.indexOf('能做什么') >= 0 || command.indexOf('功能') >= 0) {
      return { text: '我可以帮您导航、识别周围环境、跳转页面、查看家人位置、触发紧急求助。您可以说：去星巴克、打开摄像头、查看社区、还有多远、结束导航等' };
    }
    
    return { text: '我没有听清楚，您可以说"帮助"查看我能做什么' };
  }

  function closeVoiceAssistant() {
    voiceAssistantActive = false;
    if (voiceAssistantTimer) {
      clearTimeout(voiceAssistantTimer);
      voiceAssistantTimer = null;
    }
    var overlay = $('voiceAssistantOverlay');
    if (overlay) {
      overlay.style.opacity = '0';
      setTimeout(function() {
        if (overlay) overlay.style.display = 'none';
      }, 300);
    }
  }

  function onDoubleTap() {
    // 家人模式下不支持重播语音
    if (userRole === 'family') {
      showFeedback('家人模式不支持语音重播', 'info');
      return;
    }
    triggerHaptic('light');
    if (lastSpeech) {
      speak(lastSpeech);
      showFeedback('🔁 重播语音', 'info');
    }
  }

  function onSingleTap() {
    // 有遮挡层时禁止单击触发，避免语音助手/搜索/紧急求助打开时干扰
    if (isOverlayActive()) return;
    if (userRole === 'family') {
      return;
    }
    if (currentScreen === 'arrival') {
      var envDescEl = document.getElementById('arrivalEnvDesc');
      var envDesc = envDescEl ? envDescEl.textContent : '';
      speak('已到达' + selectedDestination + '。' + envDesc);
      showFeedback('📍 当前进度', 'info');
      triggerHaptic('light');
    } else if (isNavigating) {
      var step;
      if (isLastMile && lastMileSteps && lastMileSteps.length > 0) {
        step = lastMileSteps[Math.min(lmStepIndex, lastMileSteps.length - 1)];
      } else {
        step = guidanceStepsData[Math.min(currentStepIndex, guidanceStepsData.length - 1)];
      }
      if (step) {
        speak(step.text + '，距离目的地还有' + step.dist);
      }
      showFeedback('📍 当前进度', 'info');
      triggerHaptic('light');
    } else {
      speak('当前位置：人民广场附近，周围有商场、地铁站和公交站，道路平整，盲道清晰');
      showFeedback('📍 当前位置', 'info');
      triggerHaptic('light');
    }
  }

  function onSwipeLeft() {
    // 紧急求助 overlay 打开时不响应左滑
    var emergencyOverlay = document.getElementById('emergencyOverlay');
    if (emergencyOverlay && !emergencyOverlay.classList.contains('hidden')) return;
    showSwipeIndicator('left');
    if (userRole === 'family') {
      showFeedback('家人模式暂不支持摄像头功能', 'info');
      return;
    }
    if (!cameraOpen) {
      openCamera();
      speak('摄像头已打开，正在识别周围环境');
      showFeedback('📷 摄像头已打开', 'success');
    } else {
      speak('摄像头已在运行中');
    }
    triggerHaptic('light');
  }

  function onSwipeRight() {
    showSwipeIndicator('right');
    triggerHaptic('light');

    // 语音助手打开时，右滑优先关闭语音助手（作为"取消"）
    if (voiceAssistantActive) {
      closeVoiceAssistant();
      return;
    }

    // 紧急求助 overlay 打开时，右滑取消紧急求助
    var emergencyOverlay = document.getElementById('emergencyOverlay');
    if (emergencyOverlay && !emergencyOverlay.classList.contains('hidden')) {
      cancelEmergency();
      return;
    }

    if (cameraOpen) {
      closeCamera();
      return;
    }

    if (currentScreen === 'arrival') {
      finishNavigation();
      return;
    }

    if (currentScreen === 'nav' && isNavigating) {
      finishNavigation();
      return;
    }

    if (currentScreen === 'route') {
      backToHome();
      return;
    }

    if (document.getElementById('wakeSearchOverlay').style.display === 'flex') {
      closeWakeSearch();
      return;
    }
  }

  function onSwipeUp() {
    // 有遮挡层时不响应上滑
    if (isOverlayActive()) return;
    triggerHaptic('light');
    if (entryGuidanceActive) {
      nextEntryGuidanceStep();
      showFeedback('⬆️ 下一步', 'info');
    } else if (isLastMile) {
      nextLmStep();
      showFeedback('⬆️ 下一步', 'info');
    } else if (isNavigating) {
      showFeedback('⬆️ 确认/下一步', 'info');
    }
  }

  function showSwipeIndicator(dir) {
    const el = document.getElementById('swipe' + dir.charAt(0).toUpperCase() + dir.slice(1));
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 500);
  }

  let shakeLastX = 0, shakeLastY = 0, shakeLastZ = 0;
  let shakeLastTime = 0;

  function initShakeDetection() {
    if (window.DeviceMotionEvent) {
      window.addEventListener('devicemotion', function(e) {
        const acc = e.accelerationIncludingGravity;
        if (!acc) return;
        
        const now = Date.now();
        if (now - shakeLastTime < 100) return;
        
        const dx = Math.abs(acc.x - shakeLastX);
        const dy = Math.abs(acc.y - shakeLastY);
        const dz = Math.abs(acc.z - shakeLastZ);
        
        if (dx + dy + dz > 25) {
          onShake();
          shakeLastTime = now;
        }
        
        shakeLastX = acc.x;
        shakeLastY = acc.y;
        shakeLastZ = acc.z;
      });
    }
  }

  function onShake() {
    // 家人模式下不触发摇一摇紧急求助（家人是接收方）
    if (userRole === 'family') {
      showFeedback('家人模式不支持摇一摇紧急求助', 'info');
      return;
    }
    const overlay = document.getElementById('emergencyOverlay');
    if (!overlay.classList.contains('hidden')) return;
    
    triggerHaptic('triple');
    showFeedback('📱 摇一摇 - 紧急求助', 'danger');
    triggerEmergency();
  }

  // ========== 控制面板测试函数 ==========
  function simulateLongPress() {
    onLongPress();
  }

  function simulateDoubleTap() {
    onDoubleTap();
  }

  function simulateSingleTap() {
    onSingleTap();
  }

  function simulateSwipeLeft() {
    onSwipeLeft();
  }

  function simulateSwipeRight() {
    onSwipeRight();
  }

  function simulateSwipeUp() {
    onSwipeUp();
  }

  function simulateShake() {
    onShake();
  }

  function testMode(mode) {
    selectedMode = mode;
    selectedDestination = getDemoDestination(mode);
    if (mode === 'transit') {
      selectedTransportType = 'metro';
    } else {
      selectedTransportType = mode;
    }
    selectMode(mode);
    showScreen('route');
    triggerHaptic('light');
  }

  function getDemoDestination(mode) {
    switch (mode) {
      case 'walk': return '星巴克咖啡';
      case 'transit': return '火车站';
      case 'taxi': return '万达广场';
      case 'indoor': return '万达广场';
      default: return '星巴克咖啡';
    }
  }

  

  // ========== 室内楼层导航 ==========
  let currentFloor = 1;
  let selectedPOI = null;
  
  const floorData = {
    1: { name: '1楼', pois: [
      { name: '星巴克咖啡', icon: '☕', floor: 1, desc: '入口左侧20米' },
      { name: '服务台', icon: '💁', floor: 1, desc: '大厅中央' },
      { name: '扶梯A', icon: '🛗', floor: 1, desc: '东侧通道' },
      { name: '扶梯B', icon: '🛗', floor: 1, desc: '西侧通道' },
      { name: '无障碍电梯', icon: '🛗', floor: 1, desc: '服务台右侧' },
      { name: '卫生间', icon: '🚻', floor: 1, desc: '东侧尽头' }
    ]},
    2: { name: '2楼', pois: [
      { name: 'Nike专卖店', icon: '👟', floor: 2, desc: '扶梯旁' },
      { name: '优衣库', icon: '👕', floor: 2, desc: '北侧' },
      { name: 'ZARA', icon: '👗', floor: 2, desc: '中央' },
      { name: '无障碍电梯', icon: '🛗', floor: 2, desc: '南侧' }
    ]},
    3: { name: '3楼', pois: [
      { name: '肯德基', icon: '🍔', floor: 3, desc: '入口处' },
      { name: '麦当劳', icon: '🍟', floor: 3, desc: '东侧' },
      { name: '美食广场', icon: '🍽️', floor: 3, desc: '北侧' },
      { name: '无障碍电梯', icon: '🛗', floor: 3, desc: '西侧' }
    ]}
  };

  const hospitalFloorData = {
    1: { name: '1楼 - 门诊大厅', pois: [
      { name: '导诊台', icon: '💁', floor: 1, desc: '大厅中央' },
      { name: '挂号处', icon: '🎫', floor: 1, desc: '导诊台右侧' },
      { name: '急诊科', icon: '🚑', floor: 1, desc: '大厅西侧' },
      { name: '药房', icon: '💊', floor: 1, desc: '大厅东侧' },
      { name: '无障碍电梯', icon: '🛗', floor: 1, desc: '大厅北侧' }
    ]},
    2: { name: '2楼 - 内科诊区', pois: [
      { name: '内科门诊', icon: '🚪', floor: 2, desc: '东侧走廊' },
      { name: '抽血化验', icon: '💉', floor: 2, desc: '西侧' },
      { name: '收费处', icon: '💰', floor: 2, desc: '中央' },
      { name: '无障碍电梯', icon: '🛗', floor: 2, desc: '北侧' }
    ]},
    3: { name: '3楼 - 外科诊区', pois: [
      { name: '外科门诊', icon: '🚪', floor: 3, desc: '东侧' },
      { name: '骨科门诊', icon: '🦴', floor: 3, desc: '东侧' },
      { name: '无障碍电梯', icon: '🛗', floor: 3, desc: '北侧' }
    ]}
  };

  function showFloorNav() {
    var panel = document.getElementById('floorNavPanel');
    panel.classList.remove('hidden');
    var floors = selectedDestination.indexOf('医院') !== -1 ? hospitalFloorData : floorData;
    renderFloorSelector(floors);
    renderFloorMap(floors, currentFloor);
    speak('已进入楼层导航模式，请选择目标楼层');
    triggerHaptic('light');
  }

  function hideFloorNav() {
    var panel = document.getElementById('floorNavPanel');
    panel.classList.add('hidden');
  }

  function renderFloorSelector(floors) {
    var selector = document.getElementById('floorSelector');
    var floorKeys = Object.keys(floors).map(Number).sort(function(a, b){return a-b});
    var html = '';
    floorKeys.forEach(function(f) {
      html += '<div class="floor-btn ' + (f === currentFloor ? 'active' : '') + '" onclick="selectFloor(' + f + ')">' + f + '楼</div>';
    });
    selector.innerHTML = html;
  }

  function selectFloor(floor) {
    currentFloor = floor;
    var floors = selectedDestination.indexOf('医院') !== -1 ? hospitalFloorData : floorData;
    renderFloorSelector(floors);
    renderFloorMap(floors, floor);
    triggerHaptic('light');
  }

  function renderFloorMap(floors, floor) {
    var data = floors[floor];
    if (!data) return;
    document.getElementById('currentFloorName').textContent = data.name;
    var poiList = document.getElementById('poiList');
    var html = '';
    data.pois.forEach(function(poi, i) {
      html += '<div class="poi-item ' + (selectedPOI === i ? 'selected' : '') + '" onclick="selectPOI(' + i + ', \'' + poi.name + '\')">' +
        '<div class="poi-icon">' + poi.icon + '</div>' +
        '<div class="poi-name">' + poi.name + '</div>' +
        '<div class="poi-floor">' + poi.desc + '</div></div>';
    });
    poiList.innerHTML = html;
  }

  function selectPOI(index, name) {
    selectedPOI = index;
    var floors = selectedDestination.indexOf('医院') !== -1 ? hospitalFloorData : floorData;
    var poi = floors[currentFloor].pois[index];
    speak('已选择' + poi.name + '，位于' + poi.floor + '楼，' + poi.desc + '。正在规划路线...');
    triggerHaptic('medium');
    setTimeout(function() {
      speak('从当前位置沿主通道直行50米，右转后直行30米即可到达。如需摄像头辅助，请左滑。');
    }, 2000);
  }

  // ========== 用户社区 ==========
  var currentCommunityTab = 'feed';
  var communityFeedData = {
    feed: [
      { avatarColor: '#007AFF', username: '王大哥', time: '10分钟前', badge: '', text: '今天从家到万达广场走的是盲道，非常顺畅！建议大家走这条路，比另一条近5分钟。', location: '建设路 → 万达广场', tags: ['#盲道推荐', '#出行经验'], likes: 23, comments: 5, shares: 3 },
      { avatarColor: '#FF2D55', username: '李阿姨', time: '30分钟前', badge: 'top', text: '刚刚在医院挂号，导诊台的护士特别热心，主动帮我推轮椅。有需要帮助的朋友可以找她们。', location: '人民医院', tags: ['#医院攻略', '#助人为乐'], likes: 45, comments: 12, shares: 8 },
      { avatarColor: '#5856D6', username: '张大爷', time: '1小时前', badge: '', text: '地铁1号线今天早高峰人太多了，建议视障朋友避开8-9点高峰期出行。', location: '地铁1号线', tags: ['#地铁出行', '#高峰期'], likes: 18, comments: 7, shares: 5 }
    ],
    danger: [
      { avatar: '👨', username: '赵先生', time: '5分钟前', badge: 'danger', text: '⚠️ 建设路与解放路路口东南角，有施工围挡占据了盲道，需要绕行！请大家注意！', location: '建设路与解放路路口', tags: ['#危险标记', '#施工围挡', '#需绕行'], isDanger: true, likes: 67, comments: 23, shares: 45 },
      { avatar: '👩', username: '刘大姐', time: '20分钟前', badge: '⚠️', text: '⚠️ 万达广场地下停车场出口处，有车辆经常逆行，视障朋友经过时要特别小心！', location: '万达广场停车场出口', tags: ['#危险标记', '#车辆逆行'], isDanger: true, likes: 89, comments: 31, shares: 56 },
      { avatar: '👴', username: '孙大爷', time: '1小时前', badge: '⚠️', text: '⚠️ 地铁2号线火车站站A口，扶梯噪音太大听不清语音播报，建议走直梯或让工作人员协助。', location: '地铁2号线火车站站', tags: ['#危险标记', '#地铁站'], isDanger: true, likes: 34, comments: 15, shares: 22 }
    ],
    route: [
      { avatar: '👨', username: '陈大哥', time: '15分钟前', badge: 'route', text: '分享一条从家到人民医院的最佳路线，全程盲道覆盖，约35分钟。', location: '家 → 人民医院', tags: ['#路线分享', '#盲道覆盖', '#35分钟'], isRoute: true, likes: 56, comments: 18, shares: 34 },
      { avatar: '👩', username: '周女士', time: '2小时前', badge: '🗺️', text: '最新整理的万达广场无障碍攻略！各楼层店铺位置、无障碍电梯分布全在这了！', location: '万达广场无障碍攻略', tags: ['#路线分享', '#商场攻略', '#无障碍'], isRoute: true, likes: 128, comments: 45, shares: 89 }
    ],
    tips: [
      { avatar: '👨', username: '眼科医生王老师', time: '30分钟前', badge: 'expert', text: '视障出行安全第一！出门前记得检查手机电量，带好盲杖。如果感觉不安全，不要犹豫，及时寻求帮助。', location: '', tags: ['#出行贴士', '#安全提醒'], likes: 234, comments: 56, shares: 123 },
      { avatar: '👩', username: '资深用户小林', time: '1小时前', badge: 'star', text: '分享一个小技巧：出门前在瞳伴里搜索目的地，可以提前了解周边的设施分布，心里有数出门不慌！', location: '', tags: ['#出行贴士', '#使用技巧'], likes: 89, comments: 23, shares: 45 }
    ]
  };

  // 家人版社区内容：聚焦守护经验、家人关怀、安全提醒
  var familyCommunityFeedData = {
    feed: [
      { avatarColor: '#FF9500', username: '守护者小芳', time: '15分钟前', badge: 'top', text: '分享一个守护小经验：给爸妈的手机设置快捷拨号，把瞳伴的紧急联系人放在主屏，老人一个人出门我们更放心。', location: '', tags: ['#守护经验', '#家人关怀'], likes: 56, comments: 18, shares: 24 },
      { avatarColor: '#34C759', username: '李先生的儿子', time: '40分钟前', badge: '', text: '今天父亲去医院复查，通过瞳伴实时位置看到他安全到达，全程无障碍通道，安心了不少。感谢这个产品。', location: '人民医院', tags: ['#家人故事', '#实时守护'], likes: 89, comments: 32, shares: 45 },
      { avatarColor: '#AF52DE', username: '社区志愿者', time: '2小时前', badge: 'star', text: '我们社区最近组织了"我帮视障朋友出行"志愿活动，欢迎家人朋友们一起参与，让城市更有温度。', location: '幸福社区', tags: ['#社区活动', '#志愿公益'], likes: 156, comments: 48, shares: 67 }
    ],
    danger: [
      { avatar: '👩', username: '王女士', time: '10分钟前', badge: 'danger', text: '⚠️ 提醒各位家人：建设路路口最近施工，盲道被占用，建议提醒家中视障亲人绕行该路段！', location: '建设路路口', tags: ['#安全提醒', '#施工围挡'], isDanger: true, likes: 78, comments: 25, shares: 56 },
      { avatar: '👨', username: '张大哥', time: '1小时前', badge: '⚠️', text: '⚠️ 万达广场地下停车场出口车辆较多，请家人们叮嘱视障亲人经过时一定要走盲道，不要绕近路。', location: '万达广场停车场出口', tags: ['#安全提醒', '#车辆密集'], isDanger: true, likes: 92, comments: 38, shares: 71 }
    ],
    route: [
      { avatar: '👩', username: '守护女儿小美', time: '30分钟前', badge: 'route', text: '整理了一份"家到人民医院"无障碍路线图，全程盲道+无障碍电梯，已分享给父亲使用，希望也能帮到大家。', location: '家 → 人民医院', tags: ['#无障碍路线', '#家人分享'], isRoute: true, likes: 67, comments: 21, shares: 38 },
      { avatar: '👨', username: '社区工作者', time: '3小时前', badge: '🗺️', text: '更新了万达广场无障碍设施分布图，包括无障碍电梯、卫生间、休息区位置，家人们可以提前了解。', location: '万达广场', tags: ['#无障碍设施', '#商场攻略'], isRoute: true, likes: 134, comments: 56, shares: 89 }
    ],
    tips: [
      { avatar: '👨', username: '社工张老师', time: '20分钟前', badge: 'expert', text: '家人守护小贴士：建议每周和家人一起回顾出行安全情况，及时调整安全围栏范围，让守护更精准。', location: '', tags: ['#守护贴士', '#安全围栏'], likes: 198, comments: 67, shares: 124 },
      { avatar: '👩', username: '资深家属', time: '2小时前', badge: 'star', text: '经验分享：把瞳伴的"危险标记"功能用起来，发现家附近有施工或隐患时及时上报，大家一起为视障朋友铺平道路。', location: '', tags: ['#守护经验', '#社区共建'], likes: 145, comments: 52, shares: 78 }
    ]
  };

  function loadCommunityFeed(tab) {
    currentCommunityTab = tab;
    var content = document.getElementById('communityContent');
    // 根据角色使用不同数据源：家人版推送守护经验/家人关怀相关内容
    var dataSource = userRole === 'family' ? familyCommunityFeedData : communityFeedData;
    var posts = dataSource[tab] || [];
    var html = '';
    posts.forEach(function(post, idx) {
      var cardClass = 'community-card';
      if (post.isDanger) cardClass += ' danger-card';
      if (post.isRoute) cardClass += ' route-card';
      var badgeHtml = '';
      if (post.badge === 'top') {
        badgeHtml = '<span class="community-badge-top">热门</span>';
      } else if (post.badge === 'danger') {
        badgeHtml = '<span class="community-badge-danger">危险</span>';
      } else if (post.badge === 'route') {
        badgeHtml = '<span class="community-badge-route">路线</span>';
      } else if (post.badge === 'expert') {
        badgeHtml = '<span class="community-badge-expert">专家</span>';
      } else if (post.badge === 'star') {
        badgeHtml = '<span class="community-badge-star">精华</span>';
      }
      var locationHtml = '';
      if (post.location) {
        locationHtml = '<div class="community-location"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>' + post.location + '</div>';
      }
      var tagsHtml = '';
      if (post.tags) {
        tagsHtml = '<div class="community-tags">';
        post.tags.forEach(function(tag) {
          var tagClass = 'community-tag';
          if (post.isDanger && tag.indexOf('危险') !== -1) tagClass += ' danger-tag';
          tagsHtml += '<span class="' + tagClass + '">' + tag + '</span>';
        });
        tagsHtml += '</div>';
      }
      var avatarColor = post.avatarColor || '#007AFF';
      var firstChar = post.username.charAt(0);
      html += '<div class="' + cardClass + '">' +
        '<div class="community-card-header">' +
          '<div class="community-avatar" style="background: ' + avatarColor + ';">' + firstChar + '</div>' +
          '<div class="community-user-info">' +
            '<div class="community-username-row">' +
              '<span class="community-username">' + post.username + '</span>' +
              badgeHtml +
            '</div>' +
            '<div class="community-time">' + post.time + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="community-text">' + post.text + '</div>' +
        locationHtml + tagsHtml +
        '<div class="community-divider"></div>' +
        '<div class="community-actions">' +
          '<div class="community-action" onclick="likePost(this)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg><span class="like-count">' + post.likes + '</span></div>' +
          '<div class="community-action" onclick="commentPost()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg><span>' + post.comments + '</span></div>' +
          '<div class="community-action" onclick="sharePost()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="7" y2="7"/><polyline points="3 11 7 7 11 11"/><path d="M21 21l-5-5"/><line x1="17" y1="17" x2="17" y2="7"/><polyline points="21 11 17 7 13 11"/></svg><span>' + post.shares + '</span></div>' +
        '</div>' +
      '</div>';
    });
    content.innerHTML = html;
  }

  function switchCommunityTab(tab, el) {
    document.querySelectorAll('.community-tab').forEach(function(t){ 
      t.classList.remove('active'); 
      t.setAttribute('aria-selected', 'false');
      t.setAttribute('tabindex', '-1');
    });
    if (!el) {
      el = document.querySelector('.community-tab[data-tab="' + tab + '"]') || document.querySelectorAll('.community-tab')[0];
    }
    if (el) {
      el.classList.add('active');
      el.setAttribute('aria-selected', 'true');
      el.setAttribute('tabindex', '0');
    }
    loadCommunityFeed(tab);
    triggerHaptic('light');
    var tabNames = { feed: '推荐', danger: '危险标记', route: '路线分享', tips: '出行贴士' };
    var tabName = tabNames[tab] || tab;
    speak('已切换到' + tabName);
    announce('已切换到' + tabName + '标签页');
  }

  function likePost(el) {
    el.classList.add('liked');
    var countEl = el.querySelector('.like-count');
    if (!countEl) countEl = el.querySelector('span');
    if (countEl) {
      var count = parseInt(countEl.textContent) || 0;
      countEl.textContent = count + 1;
    }
    triggerHaptic('light');
    speak('已点赞');
  }

  function commentPost() {
    openCommentEditor();
    triggerHaptic('light');
  }
  function sharePost() {
    openShareSheet();
    triggerHaptic('light');
  }

  // ========== 家人端功能 ==========
  function callFamily(member) {
    var names = { father: '父亲', mother: '母亲', wife: '妻子', son: '儿子', daughter: '女儿', husband: '丈夫' };
    var name = names[member] || '家人';
    speak('正在拨打' + name + '的电话', 'high');
    triggerHaptic('medium');
    showFeedback('📞 正在拨打 ' + name + ' 的电话...', 'info', 3000);
    // 模拟拨号界面：5秒后接通
    setTimeout(function() {
      showFeedback(name + ' 已接通', 'success', 2000);
      speak(name + '已接通', 'high');
    }, 5000);
  }

  function addEmergencyContact() {
    openEmergencyContactsPage();
    triggerHaptic('light');
  }

  // 紧急联系人列表页面
  var emergencyContactsPageCreated = false;
  var emergencyContactsData = [
    { id: 1, name: '张明', phone: '138****8888', relation: '父亲' },
    { id: 2, name: '李华', phone: '139****6666', relation: '母亲' }
  ];
  function openEmergencyContactsPage() {
    ensureEmergencyContactsPage();
    renderEmergencyContactsList();
    showScreen('emergencyContacts');
    speak('紧急联系人管理，共' + emergencyContactsData.length + '位', 'normal');
    triggerHaptic('light');
  }
  function ensureEmergencyContactsPage() {
    if (emergencyContactsPageCreated) return;
    var page = document.createElement('div');
    page.id = 'emergencyContactsScreen';
    page.className = 'screen';
    page.setAttribute('role', 'main');
    page.setAttribute('aria-label', '紧急联系人管理');
    page.style.cssText = 'background:#F2F2F7;padding-top:47px;display:none;flex-direction:column;overflow:hidden;';
    page.innerHTML =
      '<div class="community-nav-bar" style="position:relative;background:rgba(255,255,255,0.92);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);padding:10px 20px;border-bottom:0.5px solid rgba(0,0,0,0.06);display:flex;align-items:center;justify-content:center;">' +
        '<div onclick="closeEmergencyContacts()" role="button" tabindex="0" aria-label="返回" style="position:absolute;left:16px;top:50%;transform:translateY(-50%);width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#007AFF;cursor:pointer;"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg></div>' +
        '<span style="font-size:17px;font-weight:600;color:#1D1D1F;">紧急联系人</span>' +
        '<div onclick="openAddContactEditor(\'紧急联系人\')" role="button" tabindex="0" aria-label="添加联系人" style="position:absolute;right:16px;top:50%;transform:translateY(-50%);width:32px;height:32px;border-radius:50%;background:#007AFF;color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></div>' +
      '</div>' +
      '<div id="emergencyContactsList" style="flex:1;overflow-y:auto;padding:12px 16px 90px;-webkit-overflow-scrolling:touch;"></div>';
    var phoneScreen = document.querySelector('.phone-screen') || document.body;
    phoneScreen.appendChild(page);
    emergencyContactsPageCreated = true;
  }
  function renderEmergencyContactsList() {
    var listEl = document.getElementById('emergencyContactsList');
    if (!listEl) return;
    var html = '';
    if (emergencyContactsData.length === 0) {
      html = '<div style="text-align:center;padding:60px 20px;color:#8E8E93;font-size:14px;"><div style="margin-bottom:12px;opacity:0.4;"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin:0 auto;display:block;"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>暂无紧急联系人<br/><span style="font-size:12px;">点击右上角添加</span></div>';
    } else {
      emergencyContactsData.forEach(function(c) {
        html += '<div style="background:#fff;border-radius:14px;padding:16px;margin-bottom:10px;border:0.5px solid #E5E5EA;box-shadow:0 1px 2px rgba(0,0,0,0.03);display:flex;align-items:center;gap:12px;">' +
          '<div style="width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#AF52DE,#FF2D55);color:#fff;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;flex-shrink:0;">' + c.name.charAt(0) + '</div>' +
          '<div style="flex:1;min-width:0;"><div style="font-size:15px;font-weight:600;color:#1D1D1F;">' + c.name + '</div><div style="font-size:13px;color:#8E8E93;margin-top:2px;">' + c.phone + ' · ' + c.relation + '</div></div>' +
          '<div style="display:flex;gap:8px;flex-shrink:0;">' +
            '<div onclick="callEmergencyContact(' + c.id + ')" role="button" tabindex="0" aria-label="拨打" style="width:32px;height:32px;border-radius:8px;background:#34C75915;color:#34C759;display:flex;align-items:center;justify-content:center;cursor:pointer;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg></div>' +
            '<div onclick="editEmergencyContact(' + c.id + ')" role="button" tabindex="0" aria-label="编辑" style="width:32px;height:32px;border-radius:8px;background:#007AFF15;color:#007AFF;display:flex;align-items:center;justify-content:center;cursor:pointer;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></div>' +
            '<div onclick="deleteEmergencyContact(' + c.id + ')" role="button" tabindex="0" aria-label="删除" style="width:32px;height:32px;border-radius:8px;background:#FF3B3015;color:#FF3B30;display:flex;align-items:center;justify-content:center;cursor:pointer;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></div>' +
          '</div>' +
        '</div>';
      });
    }
    listEl.innerHTML = html;
  }
  function closeEmergencyContacts() {
    switchTab('my');
    triggerHaptic('light');
  }
  function callEmergencyContact(id) {
    var c = emergencyContactsData.find(function(x){return x.id === id;});
    if (c) {
      showFeedback('正在拨打' + c.name + '...', 'info');
      speak('正在拨打' + c.name, 'normal');
    }
    triggerHaptic('light');
  }
  function editEmergencyContact(id) {
    var c = emergencyContactsData.find(function(x){return x.id === id;});
    if (c) {
      showFeedback('编辑' + c.name + '的联系人信息', 'info');
      speak('编辑' + c.name, 'normal');
    }
    triggerHaptic('light');
  }
  function deleteEmergencyContact(id) {
    var c = emergencyContactsData.find(function(x){return x.id === id;});
    if (!c) return;
    var overlay = document.getElementById('deleteContactConfirmOverlay');
    if (overlay) overlay.remove();
    overlay = document.createElement('div');
    overlay.id = 'deleteContactConfirmOverlay';
    overlay.style.cssText = 'position:absolute;inset:0;background:rgba(0,0,0,0.4);z-index:9999;display:flex;align-items:center;justify-content:center;';
    overlay.innerHTML =
      '<div style="background:#fff;border-radius:16px;width:260px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,0.2);">' +
        '<div style="padding:20px 16px 12px;text-align:center;"><div style="font-size:16px;font-weight:600;color:#1D1D1F;">删除联系人</div><div style="font-size:13px;color:#8E8E93;margin-top:6px;">确定要删除' + c.name + '吗？</div></div>' +
        '<div style="display:flex;border-top:0.5px solid #E5E5EA;"><button onclick="cancelDeleteContact()" style="flex:1;height:48px;background:transparent;border:none;border-right:0.5px solid #E5E5EA;color:#007AFF;font-size:15px;cursor:pointer;">取消</button>' +
        '<button onclick="confirmDeleteContact(' + id + ')" style="flex:1;height:48px;background:transparent;border:none;color:#FF3B30;font-size:15px;font-weight:600;cursor:pointer;">删除</button></div>' +
      '</div>';
    var phoneScreen = document.querySelector('.phone-screen') || document.body;
    phoneScreen.appendChild(overlay);
    overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
    triggerHaptic('light');
  }
  function cancelDeleteContact() {
    var overlay = document.getElementById('deleteContactConfirmOverlay');
    if (overlay) overlay.remove();
  }
  function confirmDeleteContact(id) {
    cancelDeleteContact();
    emergencyContactsData = emergencyContactsData.filter(function(x){return x.id !== id;});
    userInfo.emergencyContacts = emergencyContactsData.length;
    renderEmergencyContactsList();
    refreshMyPageUI();
    showFeedback('联系人已删除', 'success');
    speak('联系人已删除', 'normal');
    triggerHaptic('medium');
  }

  // ========== P3测试函数 ==========
  function testFloorNav() {
    selectedDestination = '万达广场';
    showScreen('nav');
    setTimeout(function(){ showFloorNav(); }, 500);
  }

  function testCommunity() {
    showScreen('community');
    loadCommunityFeed('feed');
  }

  function testFamily() {
    showScreen('family');
  }

  // ========== 新功能测试函数 ==========
  function testLogin(role) {
    selectedLoginRole = role || 'visual';
    completeLogin('13800000001');
  }

  function testLogout() {
    doLogout();
  }

  function testMyPage() {
    switchTab('my');
  }

  function testSettings() {
    switchTab('my');
    setTimeout(function(){ openSettingsPage(); }, 300);
  }

  function testRealName() {
    switchTab('my');
    setTimeout(function(){ openRealNameAuth(); }, 300);
  }

  function testEmergencyContacts() {
    switchTab('my');
    setTimeout(function(){ openEmergencyContactsPage(); }, 300);
  }

  function testArrival() {
    showScreen('arrival');
  }

  function testWardList() {
    showScreen('family');
    setTimeout(function(){ openWardList(); }, 300);
  }

  function testFenceManagement() {
    showScreen('family');
    setTimeout(function(){ openFenceManagement(); }, 300);
  }

  function testGuardianSettings() {
    showScreen('family');
    setTimeout(function(){ openGuardianSettings(); }, 300);
  }

  function testFamilyLocation() {
    showScreen('family');
    setTimeout(function(){ openFamilyLocationPage('张大爷'); }, 300);
  }

  function testMessageCenter() {
    openMessageCenter();
  }

  function testTravelHistory() {
    switchTab('my');
    setTimeout(function(){ showTravelHistory(); }, 300);
  }

  function testFavorites() {
    switchTab('my');
    setTimeout(function(){ openMyFavorites(); }, 300);
  }

  function testCommonAddresses() {
    switchTab('my');
    setTimeout(function(){ openCommonAddresses(); }, 300);
  }

  function testCreatePost() {
    showScreen('community');
    switchTab('community');
    setTimeout(function(){ createPost(); }, 300);
  }

// ========== 我的页面功能 ==========
  var _lastToggleTime = 0;
  function toggleSwitch(el) {
    var now = Date.now();
    // 防止冒泡导致的重复触发（外层 my-item 与内部 switch 都绑定 onclick）
    if (now - _lastToggleTime < 200) return;
    _lastToggleTime = now;
    el.classList.toggle('active');
    triggerHaptic('light');
  }

  function addContact() {
    openAddContactEditor('常用联系人');
    triggerHaptic('light');
  }

  // ========== 初始化 ==========

  // ========== 无障碍初始化 ==========
  function initAccessibility() {
    // A03: 开关控件语义化
    document.querySelectorAll('.switch').forEach(function(sw) {
      var item = sw.closest('.my-item');
      var label = '';
      if (item) {
        var textEl = item.querySelector('.my-item-text');
        if (textEl) label = textEl.textContent.trim();
      }
      sw.setAttribute('role', 'switch');
      sw.setAttribute('tabindex', '0');
      sw.setAttribute('aria-checked', sw.classList.contains('active') ? 'true' : 'false');
      if (label) sw.setAttribute('aria-label', label);
      // 键盘支持
      sw.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleSwitch(sw);
        }
      });
    });

    // A02: div按钮加role
    document.querySelectorAll('[onclick]').forEach(function(el) {
      if (el.tagName !== 'BUTTON' && el.tagName !== 'INPUT' && el.tagName !== 'A') {
        var hasRole = el.getAttribute('role');
        if (!hasRole) {
          el.setAttribute('role', 'button');
          el.setAttribute('tabindex', '0');
          el.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              el.click();
            }
          });
        }
      }
    });

    // A06: 纯图标按钮加aria-label
    // 家人页面电话按钮
    var callBtns = document.querySelectorAll('[onclick^="callFamily"]');
    callBtns.forEach(function(btn, idx) {
      var card = btn.closest('.family-card');
      var name = '';
      if (card) {
        var nameEl = card.querySelector('div[style*="font-size:16px"]');
        if (nameEl) name = nameEl.textContent.trim();
      }
      if (!btn.getAttribute('aria-label')) {
        btn.setAttribute('aria-label', '拨打电话给' + (name || '家人'));
      }
    });

    // Tab键盘支持
    document.querySelectorAll('.tab-item').forEach(function(tab) {
      tab.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          tab.click();
        }
      });
    });

    // A15: 导航页无障碍优化
    var navMapContainer = document.querySelector('#navScreen .nav-map-container');
    if (navMapContainer) {
      navMapContainer.setAttribute('aria-hidden', 'true');
    }
    var navDestDist = document.getElementById('navDestDist');
    if (navDestDist) {
      navDestDist.setAttribute('aria-live', 'polite');
      navDestDist.setAttribute('aria-atomic', 'true');
    }
    var navProgressBar = document.querySelector('#navScreen .nav-progress-bar');
    if (navProgressBar) {
      navProgressBar.setAttribute('role', 'progressbar');
      navProgressBar.setAttribute('aria-valuenow', '0');
      navProgressBar.setAttribute('aria-valuemin', '0');
      navProgressBar.setAttribute('aria-valuemax', '100');
      navProgressBar.setAttribute('aria-label', '导航进度');
      navProgressBar.id = 'navProgressBar';
    }
    var guidanceText = document.getElementById('guidanceText');
    if (guidanceText) {
      guidanceText.setAttribute('aria-live', 'polite');
      guidanceText.setAttribute('aria-atomic', 'true');
    }
    var navEndBtn = document.querySelector('#navScreen .nav-end-btn');
    if (navEndBtn) {
      navEndBtn.setAttribute('aria-label', '结束导航按钮，点击结束当前导航');
    }
    var lmStepsContainer = document.getElementById('lmStepsContainer');
    if (lmStepsContainer) {
      lmStepsContainer.setAttribute('role', 'list');
    }

    // A16: 到达页无障碍优化
    var arrivalCards = document.querySelectorAll('#arrivalScreen .arrival-card');
    arrivalCards.forEach(function(card, index) {
      var titleEl = card.querySelector('.arrival-card-title span:last-child');
      var title = titleEl ? titleEl.textContent.trim() : ('卡片' + (index + 1));
      card.setAttribute('role', 'region');
      card.setAttribute('aria-label', title);
    });
    var arrivalNearby = document.getElementById('arrivalNearby');
    if (arrivalNearby) {
      arrivalNearby.setAttribute('role', 'list');
      arrivalNearby.querySelectorAll('.arrival-nearby-item').forEach(function(item) {
        item.setAttribute('role', 'listitem');
        item.setAttribute('aria-label', item.textContent.trim());
      });
    }
    var arrivalActions = document.querySelectorAll('#arrivalScreen .arrival-action-btn');
    arrivalActions.forEach(function(btn) {
      var text = btn.textContent.trim();
      if (text && !btn.getAttribute('aria-label')) {
        btn.setAttribute('aria-label', text + '按钮');
      }
    });

    // A17: 社区页面无障碍优化
    var communityTabs = document.querySelector('.community-tabs');
    if (communityTabs) {
      communityTabs.setAttribute('role', 'tablist');
      communityTabs.setAttribute('aria-label', '社区内容分类');
      var tabs = communityTabs.querySelectorAll('.community-tab');
      tabs.forEach(function(tab, index) {
        tab.setAttribute('role', 'tab');
        tab.setAttribute('tabindex', tab.classList.contains('active') ? '0' : '-1');
        tab.setAttribute('aria-selected', tab.classList.contains('active') ? 'true' : 'false');
        tab.setAttribute('aria-label', tab.textContent.trim());
      });
    }
  }


  // A08: 页面名称映射
  var screenNames = {
    wake: '首页',
    route: '路线选择',
    nav: '导航中',
    arrival: '到达目的地',
    community: '社区',
    family: '家人守护',
    my: '我的'
  };

  // A07+A08: 增强showScreen - 焦点管理和语音通知
  var _origShowScreen = showScreen;
  showScreen = function(screenName) {
    _origShowScreen(screenName);
    // 语音播报页面名称
    var name = screenNames[screenName] || screenName;
    speak(name);
    // 焦点移到新页面
    setTimeout(function() {
      var screen = document.getElementById(screenName + 'Screen');
      if (screen) {
        screen.setAttribute('tabindex', '-1');
        screen.focus();
      }
    }, 50);
  };

  // A04增强: 增强switchTab - 更新aria-selected
  var _origSwitchTab = switchTab;
  switchTab = function(tab) {
    _origSwitchTab(tab);
    // 更新所有tab的aria-selected
    document.querySelectorAll('.tab-item').forEach(function(t) {
      var isSelected = t.classList.contains('active');
      t.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    });
  };

  // A18: 紧急求助页面无障碍优化
  function enhanceEmergencyAccessibility() {
    var emergencyOverlay = document.getElementById('emergencyOverlay');
    if (emergencyOverlay) {
      emergencyOverlay.setAttribute('role', 'alertdialog');
      emergencyOverlay.setAttribute('aria-modal', 'true');
      emergencyOverlay.setAttribute('aria-label', '紧急求助');
    }
    var emergencyContacts = document.querySelector('.emergency-contacts');
    if (emergencyContacts) {
      emergencyContacts.setAttribute('role', 'list');
      emergencyContacts.setAttribute('aria-label', '紧急联系人列表');
      emergencyContacts.querySelectorAll('.emergency-contact').forEach(function(contact) {
        contact.setAttribute('role', 'listitem');
        var nameEl = contact.querySelector('.emergency-contact-name');
        var statusEl = contact.querySelector('.emergency-contact-relation');
        var name = nameEl ? nameEl.textContent.trim() : '';
        var status = statusEl ? statusEl.textContent.trim() : '';
        if (name) {
          contact.setAttribute('aria-label', name + '，' + status);
        }
      });
    }
    var emergencyCancel = document.querySelector('.emergency-cancel');
    if (emergencyCancel) {
      emergencyCancel.setAttribute('aria-label', '停止呼叫按钮，点击取消紧急求助');
    }
  }

  // A14: 添加aria-live区域用于动态通知
  function addAriaLiveRegion() {
    var live = document.createElement('div');
    live.id = 'ariaLiveRegion';
    live.setAttribute('aria-live', 'polite');
    live.setAttribute('aria-atomic', 'true');
    live.style.position = 'absolute';
    live.style.left = '-9999px';
    live.style.width = '1px';
    live.style.height = '1px';
    live.style.overflow = 'hidden';
    document.body.appendChild(live);
  }

  function announce(text) {
    try {
      var live = document.getElementById('ariaLiveRegion');
      if (live) {
        live.textContent = text;
        safeSetTimeout(function() { if (live) live.textContent = ''; }, 1000, 'announce_clear');
      }
    } catch (e) {
      console.error('[announce错误]', e.message);
    }
  }

  // ========== 焦点管理 ==========
  let lastFocusedElement = null;

  function saveFocus() {
    lastFocusedElement = document.activeElement;
  }

  function restoreFocus() {
    try {
      if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
        lastFocusedElement.focus();
      }
    } catch (e) {
      console.error('[restoreFocus错误]', e.message);
    }
  }

  function trapFocus(container) {
    if (!container) return;
    var focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]',
      '[role="switch"]'
    ];
    var focusable = container.querySelectorAll(focusableSelectors.join(','));
    if (focusable.length === 0) return;
    
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    
    function handleTab(e) {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    
    container.addEventListener('keydown', handleTab);
    safeSetTimeout(function() { if (first) first.focus(); }, 50, 'trap_focus');
    
    return function cleanup() {
      container.removeEventListener('keydown', handleTab);
    };
  }

  // 更新toggleSwitch以同步ARIA状态
  var _origToggleSwitch = toggleSwitch;
  toggleSwitch = function(el) {
    _origToggleSwitch(el);
    var isActive = el.classList.contains('active');
    el.setAttribute('aria-checked', isActive ? 'true' : 'false');
  };
  var safetyTrainingCompleted = false;
  var safetyReminderTimer = null;
  var safetyCheckpointTimer = null;

  function checkSafetyTraining() {
    try {
      var completed = localStorage.getItem('tongban_safety_training');
      if (completed === 'true') {
        safetyTrainingCompleted = true;
        showScreen('wake');
        return;
      }
    } catch(e) {}
    
    createSafetyTrainingScreen();
    showScreen('safety');
  }

  function createSafetyTrainingScreen() {
    var existing = document.getElementById('safetyScreen');
    if (existing) {
      existing.style.display = 'flex';
      return;
    }
    
    var html = '<div class="screen" id="safetyScreen" style="background:#FFFFFF;display:none;flex-direction:column;overflow:hidden;position:absolute;top:0;left:0;right:0;bottom:0;z-index:50;">';
    html += '<div class="nav-header" style="padding:55px 16px 16px;">';
    html += '<div class="nav-title" style="font-size:17px;font-weight:600;color:#1D1D1F;text-align:center;">安全使用培训</div>';
    html += '</div>';
    
    html += '<div style="flex:1;overflow-y:auto;padding:16px;-webkit-overflow-scrolling:touch;">';
    
    html += '<div style="background:#F2F2F7;border-radius:14px;padding:16px;margin-bottom:12px;">';
    html += '<div style="font-size:24px;margin-bottom:8px;">⚠️</div>';
    html += '<div style="font-size:16px;font-weight:600;color:#1D1D1F;margin-bottom:8px;">重要声明</div>';
    html += '<div style="font-size:14px;color:#8E8E93;line-height:1.6;">';
    html += '瞳伴是一款为视障人士提供环境感知辅助的工具软件，旨在帮助您获取周围环境信息、辅助路线导航。';
    html += '<br><br>';
    html += '本产品 <strong style="color:#FF3B30;">不构成医疗诊断或治疗建议</strong>，<strong style="color:#FF3B30;">不能替代专业医疗服务</strong>，<strong style="color:#FF3B30;">不能替代您自身的安全判断</strong>。';
    html += '<br><br>';
    html += '使用本产品时，请务必保持对周围环境的警觉，随时根据实际情况做出安全决策。';
    html += '</div>';
    html += '</div>';
    
    html += '<div style="margin-bottom:16px;">';
    html += '<div style="font-size:16px;font-weight:600;color:#1D1D1F;margin-bottom:12px;">📖 安全使用守则</div>';
    
    var rules = [
      '1. 使用导航功能时，请务必留意周围交通状况，不要完全依赖语音提示。',
      '2. 过马路前，请亲自确认红绿灯和来往车辆，不要仅凭App提示通过。',
      '3. AI摄像头识别结果仅供参考，请用触觉和听觉确认实际环境。',
      '4. 遇到障碍物、施工围挡等，请立即停下并评估安全后再继续。',
      '5. 手机电量低于30%时，请尽快找安全地方充电，避免中途断电。',
      '6. 信号较弱时，请格外小心，导航精度可能下降。',
      '7. 如遇紧急情况，请使用摇一摇触发紧急求助或直接拨打110、120。',
      '8. 请勿在危险环境（如楼梯、陡坡）中操作手机，以免分心发生意外。'
    ];
    
    rules.forEach(function(rule, index) {
      html += '<div style="display:flex;align-items:flex-start;margin-bottom:10px;">';
      html += '<div style="font-size:14px;color:#007AFF;margin-right:8px;flex-shrink:0;">' + (index + 1) + '.</div>';
      html += '<div style="font-size:14px;color:#1D1D1F;line-height:1.5;">' + rule.substring(3) + '</div>';
      html += '</div>';
    });
    html += '</div>';
    
    html += '<div style="background:rgba(0,122,255,0.06);border-radius:14px;padding:16px;margin-bottom:20px;">';
    html += '<div style="font-size:14px;color:#007AFF;line-height:1.6;">';
    html += '💡 <strong>温馨提示：</strong>瞳伴是您出行的好帮手，但不能替代您的感官判断。请始终保持警觉，安全第一！';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    
    html += '<div style="padding:16px;background:#FFFFFF;border-top:0.5px solid #E5E5EA;flex-shrink:0;">';
    html += '<button onclick="completeSafetyTraining()" style="width:100%;height:44px;background:linear-gradient(135deg,#007AFF 0%,#5856D6 100%);color:white;border:none;border-radius:14px;font-size:16px;font-weight:600;box-shadow:0 4px 12px rgba(0,122,255,0.3);" role="button" tabindex="0" aria-label="我已了解并同意，开始使用">';
    html += '我已了解并同意，开始使用';
    html += '</button>';
    html += '</div>';
    
    html += '</div>';
    
    var phoneScreen = document.querySelector('.phone-screen');
    if (phoneScreen) {
      phoneScreen.insertAdjacentHTML('beforeend', html);
    } else {
      document.body.insertAdjacentHTML('beforeend', html);
    }
  }

  function completeSafetyTraining() {
    safetyTrainingCompleted = true;
    try {
      localStorage.setItem('tongban_safety_training', 'true');
    } catch(e) {}
    
    speak('安全培训已完成，瞳伴已准备就绪');
    showFeedback('✅ 安全培训已完成', 'success');
    triggerHaptic('success');
    
    showScreen('wake');
    switchTab('wake');
  }

  var gestureTutorialStep = 0;
  var gestureTutorialSteps = [
    { icon: '👆', title: '单击', desc: '点击屏幕任意位置，播报当前导航进度、位置和周围环境', action: '单击试试' },
    { icon: '👆👆', title: '双击', desc: '快速双击屏幕，重播上一条语音指令，或确认操作', action: '双击试试' },
    { icon: '🤚', title: '长按', desc: '按住屏幕1秒，唤醒语音助手，可语音问答和跳转页面', action: '长按试试' },
    { icon: '👈', title: '左滑', desc: '手指从右向左滑动，打开AI摄像头识别环境（任何时候都可用）', action: '左滑试试' },
    { icon: '👉', title: '右滑', desc: '手指从左向右滑动，返回上一页、取消操作或结束导航', action: '右滑试试' },
    { icon: '📳', title: '摇一摇', desc: '用力摇晃手机，触发紧急求助联系家人', action: '摇一摇试试' }
  ];

  function showGestureTutorial() {
    var existing = document.getElementById('gestureTutorialScreen');
    if (existing) {
      existing.style.display = 'flex';
      return;
    }
    
    gestureTutorialStep = 0;
    var html = '';
    html += '<div class="screen" id="gestureTutorialScreen" style="background:#FFFFFF;display:flex;flex-direction:column;overflow:hidden;position:absolute;top:0;left:0;right:0;bottom:0;z-index:60;">';
    html +=   '<div style="padding:60px 24px 20px;text-align:center;">';
    html +=     '<div style="font-size:13px;color:#8E8E93;font-weight:500;letter-spacing:1px;margin-bottom:8px;">新手引导 2/2</div>';
    html +=     '<div style="font-size:22px;font-weight:700;color:#1D1D1F;">手势操作指南</div>';
    html +=     '<div style="font-size:14px;color:#8E8E93;margin-top:6px;line-height:1.5;">瞳伴支持5种简单手势<br/>在屏幕任意位置即可操作</div>';
    html +=   '</div>';
    
    html +=   '<div style="flex:1;display:flex;align-items:center;justify-content:center;padding:0 24px;">';
    html +=     '<div id="gestureTutorialCard" style="width:100%;background:#F2F2F7;border-radius:24px;padding:40px 24px;text-align:center;">';
    html +=       '<div id="gestureTutorialIcon" style="font-size:64px;margin-bottom:20px;">👆</div>';
    html +=       '<div id="gestureTutorialTitle" style="font-size:20px;font-weight:700;color:#1D1D1F;margin-bottom:12px;">单击</div>';
    html +=       '<div id="gestureTutorialDesc" style="font-size:14px;color:#8E8E93;line-height:1.6;">点击屏幕任意位置，播报当前导航进度和状态</div>';
    html +=       '<div id="gestureTutorialHint" style="margin-top:28px;padding:12px 20px;background:#fff;border-radius:12px;font-size:13px;color:#007AFF;font-weight:500;display:inline-block;">单击屏幕试试</div>';
    html +=     '</div>';
    html +=   '</div>';
    
    html +=   '<div style="padding:0 24px 24px;">';
    html +=     '<div style="display:flex;justify-content:center;gap:6px;margin-bottom:20px;">';
    for (var i = 0; i < 6; i++) {
      html += '<div class="gesture-dot" data-idx="' + i + '" style="width:' + (i === 0 ? '20px' : '6px') + ';height:6px;border-radius:3px;background:' + (i === 0 ? '#007AFF' : '#D1D1D6') + ';transition:all 0.3s ease;"></div>';
    }
    html +=     '</div>';
    html +=     '<div style="display:flex;gap:12px;">';
    html +=       '<button onclick="skipGestureTutorial()" style="flex:1;height:44px;background:#F2F2F7;color:#8E8E93;border:none;border-radius:14px;font-size:15px;font-weight:500;cursor:pointer;">跳过</button>';
    html +=       '<button onclick="nextGestureTutorial()" id="gestureNextBtn" style="flex:2;height:44px;background:linear-gradient(135deg,#007AFF 0%,#5856D6 100%);color:white;border:none;border-radius:14px;font-size:15px;font-weight:600;box-shadow:0 4px 12px rgba(0,122,255,0.3);cursor:pointer;">下一个</button>';
    html +=     '</div>';
    html +=   '</div>';
    html += '</div>';
    
    var phoneScreen = document.querySelector('.phone-screen') || document.body;
    phoneScreen.insertAdjacentHTML('beforeend', html);
    
    updateGestureTutorialUI();
  }

  function updateGestureTutorialUI() {
    var step = gestureTutorialSteps[gestureTutorialStep];
    if (!step) return;
    
    setText('gestureTutorialIcon', step.icon);
    setText('gestureTutorialTitle', step.title);
    setText('gestureTutorialDesc', step.desc);
    
    var hintEl = document.getElementById('gestureTutorialHint');
    if (hintEl) hintEl.textContent = step.action;
    
    var dots = document.querySelectorAll('.gesture-dot');
    dots.forEach(function(dot, idx) {
      dot.style.width = idx === gestureTutorialStep ? '20px' : '6px';
      dot.style.background = idx === gestureTutorialStep ? '#007AFF' : '#D1D1D6';
    });
    
    var nextBtn = $('gestureNextBtn');
    if (nextBtn) {
      nextBtn.textContent = gestureTutorialStep === gestureTutorialSteps.length - 1 ? '开始使用' : '下一个';
    }
    
    speak(step.title + '：' + step.desc);
  }

  function nextGestureTutorial() {
    if (gestureTutorialStep < gestureTutorialSteps.length - 1) {
      gestureTutorialStep++;
      updateGestureTutorialUI();
      triggerHaptic('light');
    } else {
      finishGestureTutorial();
    }
  }

  function skipGestureTutorial() {
    finishGestureTutorial();
  }

  function finishGestureTutorial() {
    var tutorial = document.getElementById('gestureTutorialScreen');
    if (tutorial) {
      tutorial.style.opacity = '0';
      tutorial.style.transform = 'scale(0.95)';
      tutorial.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      setTimeout(function() {
        if (tutorial.parentNode) tutorial.parentNode.removeChild(tutorial);
      }, 300);
    }
    
    try {
      localStorage.setItem('tongban_gesture_tutorial', 'true');
    } catch(e) {}
    
    speak('引导完成，欢迎使用瞳伴');
    showFeedback('🎉 引导完成', 'success');
    triggerHaptic('success');
    
    showScreen('wake');
  }

  function startSafetyReminder() {
    if (safetyReminderTimer) {
      clearInterval(safetyReminderTimer);
    }
    
    safetyReminderTimer = setInterval(function() {
      if (!isNavigating || isNavPaused || userRole === 'family') return;
      
      speak('请注意周围环境，安全第一', 'low');
      triggerHaptic('light');
    }, 300000);
  }

  function stopSafetyReminder() {
    if (safetyReminderTimer) {
      clearInterval(safetyReminderTimer);
      safetyReminderTimer = null;
    }
  }

  var lastSafetyCheckpoint = 0;

  function checkSafetyCheckpoint() {
    if (!isNavigating || isNavPaused || userRole === 'family') return;
    
    var currentStep = guidanceStepsData[Math.min(currentStepIndex, guidanceStepsData.length - 1)];
    if (!currentStep) return;
    
    var text = currentStep.text;
    if ((text.includes('过马路') || text.includes('路口') || text.includes('红绿灯') || text.includes('转弯')) && Date.now() - lastSafetyCheckpoint > 10000) {
      lastSafetyCheckpoint = Date.now();
      triggerSafetyCheckpoint(text);
    }
  }

  function triggerSafetyCheckpoint(stepText) {
    speak('即将到达' + stepText + '，请您亲自确认安全后继续', 'high');
    showFeedback('⚠️ 请亲自确认安全', 'warning');
    triggerHaptic('medium');
    
    var overlay = document.createElement('div');
    overlay.id = 'safetyCheckpointOverlay';
    overlay.style.cssText = 'position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);z-index:1000;display:flex;flex-direction:column;align-items:center;justify-content:center;';
    overlay.innerHTML = '<div style="font-size:48px;margin-bottom:16px;">⚠️</div>' +
      '<div style="font-size:18px;color:white;font-weight:600;margin-bottom:8px;">请亲自确认安全</div>' +
      '<div style="font-size:14px;color:rgba(255,255,255,0.8);text-align:center;margin-bottom:32px;">' + stepText + '</div>' +
      '<button onclick="confirmSafetyCheckpoint()" style="width:200px;height:48px;background:white;color:#007AFF;border:none;border-radius:14px;font-size:16px;font-weight:600;" role="button" tabindex="0" aria-label="我已确认安全，可以继续">我已确认安全，可以继续</button>';
    
    document.body.appendChild(overlay);
    
    document.addEventListener('keydown', function handleKeyDown(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        confirmSafetyCheckpoint();
        document.removeEventListener('keydown', handleKeyDown);
      }
    });
  }

  function confirmSafetyCheckpoint() {
    var overlay = document.getElementById('safetyCheckpointOverlay');
    if (overlay) {
      overlay.remove();
    }
    
    speak('好的，请继续前行');
    showFeedback('✅ 继续导航', 'success');
    triggerHaptic('light');
  }

  function injectAppStyles() {
    if (document.getElementById('app-optimized-styles')) return;
    
    var style = document.createElement('style');
    style.id = 'app-optimized-styles';
    var css = '';
    
    css += '.screen { transition: opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1), transform 0.25s cubic-bezier(0.4, 0, 0.2, 1); opacity: 0; transform: scale(0.98); }';
    css += '.screen.active { opacity: 1; transform: scale(1); }';
    css += '.screen.fade-in { animation: screenFadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards; }';
    css += '.screen.fade-out { animation: screenFadeOut 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards; }';
    
    css += '@keyframes screenFadeIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }';
    css += '@keyframes screenFadeOut { from { opacity: 1; transform: translateX(0); } to { opacity: 0; transform: translateX(-20px); } }';
    css += '@keyframes slideUpIn { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }';
    css += '@keyframes pulseSoft { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }';
    css += '@keyframes vaRing { 0% { transform: translate(-50%,-50%) scale(1); opacity: 0.8; } 100% { transform: translate(-50%,-50%) scale(2); opacity: 0; } }';
    css += '@keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }';
    
    css += '.gesture-feedback { animation: slideUpIn 0.3s cubic-bezier(0.4, 0, 0.2, 1); }';
    
    css += 'button, .route-card, .tab-item, .menu-item { transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.15s ease; }';
    css += 'button:active, .route-card:active, .tab-item:active, .menu-item:active { transform: scale(0.96); opacity: 0.85; }';
    
    css += '.danger-overlay { transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); }';
    css += '.danger-overlay.show { animation: dangerPulse 0.5s cubic-bezier(0.4, 0, 0.2, 1); }';
    css += '@keyframes dangerPulse { 0% { opacity: 0; transform: scale(0.9); } 50% { transform: scale(1.02); } 100% { opacity: 1; transform: scale(1); } }';
    
    css += '.nav-progress-bar { transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1); }';
    css += '.nav-map-marker { transition: left 0.5s cubic-bezier(0.4, 0, 0.2, 1), top 0.5s cubic-bezier(0.4, 0, 0.2, 1); }';
    
    css += '.camera-overlay { transition: opacity 0.3s ease; }';
    css += '.camera-ai-tags span { animation: tagFadeIn 0.3s ease; }';
    css += '@keyframes tagFadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }';
    
    css += '.tab-bar { transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease; }';
    
    css += '.route-card { transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); }';
    css += '.route-card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.08); }';
    
    css += '::-webkit-scrollbar { width: 0; height: 0; }';
    
    css += '.nav-header { backdrop-filter: blur(20px) saturate(180%); -webkit-backdrop-filter: blur(20px) saturate(180%); }';

    css += '.nearby-station-item { padding: 12px 16px; border-bottom: 0.5px solid #E5E5EA; background: #fff; transition: background 0.15s ease; cursor: pointer; }';
    css += '.nearby-station-item:active { background: #F2F2F7; }';
    css += '.nearby-station-header { display: flex; align-items: center; gap: 12px; }';
    css += '.nearby-station-icon { font-size: 24px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; background: #F2F2F7; border-radius: 8px; }';
    css += '.nearby-station-info { flex: 1; min-width: 0; }';
    css += '.nearby-station-name { font-size: 16px; font-weight: 500; color: #1D1D1F; }';
    css += '.nearby-station-meta { font-size: 13px; color: #8E8E93; margin-top: 2px; }';
    css += '.nearby-station-fastest { text-align: right; }';
    css += '.nearby-station-fastest-time { font-size: 18px; font-weight: 600; color: #007AFF; display: block; }';
    css += '.nearby-station-fastest-line { font-size: 12px; color: #8E8E93; }';
    css += '.nearby-station-lines { margin-top: 10px; padding-top: 10px; border-top: 0.5px solid #E5E5EA; display: flex; flex-direction: column; gap: 8px; }';
    css += '.nearby-line-item { padding: 8px 0; border-radius: 8px; transition: background 0.15s ease; cursor: pointer; }';
    css += '.nearby-line-item:active { background: #F2F2F7; }';
    css += '.nearby-line-name { font-size: 15px; font-weight: 500; color: #1D1D1F; }';
    css += '.nearby-line-direction { font-size: 12px; color: #8E8E93; margin-top: 2px; }';
    css += '.nearby-line-arrivals { display: flex; gap: 12px; margin-top: 6px; align-items: center; }';
    css += '.nearby-line-arrival { font-size: 13px; color: #8E8E93; }';
    css += '.nearby-line-arrival.first { font-size: 15px; font-weight: 600; color: #007AFF; }';
    css += '#nearbyStationsList { max-height: 240px; overflow-y: auto; }';
    css += '#nearbyStationsTitle { font-size: 14px; color: #8E8E93; padding: 8px 16px 6px; display: flex; align-items: center; gap: 6px; }';
    css += '.nearby-preview-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: #fff; border-radius: 12px; margin-bottom: 8px; border: 0.5px solid #E5E5EA; cursor: pointer; transition: all 0.15s ease; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }';
    css += '.nearby-preview-item:active { background: #F2F2F7; transform: scale(0.98); }';
    css += '.nearby-preview-icon { font-size: 22px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; background: #F2F2F7; border-radius: 8px; }';
    css += '.nearby-preview-info { flex: 1; min-width: 0; }';
    css += '.nearby-preview-name { font-size: 14px; font-weight: 500; color: #1D1D1F; }';
    css += '.nearby-preview-meta { font-size: 12px; color: #8E8E93; margin-top: 1px; }';
    css += '.nearby-preview-time { text-align: right; }';
    css += '.nearby-preview-time-num { font-size: 16px; font-weight: 600; color: #007AFF; display: block; }';
    css += '.nearby-preview-time-line { font-size: 11px; color: #8E8E93; }';

    style.textContent = css;
    document.head.appendChild(style);
  }

  function init() {
    injectAppStyles();
    addAriaLiveRegion();
    initAccessibility();
    enhanceEmergencyAccessibility();
    warmUpSpeech();
    // 浏览器策略：部分浏览器需要用户手势后才能可靠播放语音
    // 在首次触摸/点击时再次预热一次
    var warmUpOnFirstGesture = function() {
      warmUpSpeech();
      document.removeEventListener('touchstart', warmUpOnFirstGesture);
      document.removeEventListener('click', warmUpOnFirstGesture);
    };
    document.addEventListener('touchstart', warmUpOnFirstGesture, { once: true, passive: true });
    document.addEventListener('click', warmUpOnFirstGesture, { once: true });

    var loggedIn = checkLoginStatus();
    if (loggedIn) {
      if (userRole === 'family') {
        showScreen('family');
        switchTab('family');
      } else {
        checkSafetyTraining();
      }
    } else {
      createLoginPage();
      showScreen('login');
    }

    renderRouteList();
    initGestureHandlers();
    initShakeDetection();
    refreshMyPageUI();
    // 注入消息中心快捷入口并刷新红点
    ensureMessageQuickEntry();
    updateMessageQuickEntryBadge();

    setInterval(() => {
      const timeEl = document.querySelector('.time');
      if (timeEl) timeEl.textContent = formatTime();
    }, 10000);

    setTimeout(function() {
      if (isLoggedIn) {
        speak('瞳伴已就绪，您可以点击搜索框或说你好，瞳伴，说出目的地');
        var searchBar = document.querySelector('.wake-search-bar');
        if (searchBar) {
          searchBar.setAttribute('tabindex', '0');
          searchBar.focus();
        }
      }
    }, 500);
    
    console.log('瞳伴 AI出行助手 Demo 已加载');
    console.log('可用手势：长按播报、双击重播、左滑摄像头、右滑返回、上滑下一步、摇一摇紧急求助');
  }

  document.addEventListener('DOMContentLoaded', init);
  document.addEventListener('DOMContentLoaded', function() {
    var style = document.createElement('style');
    style.textContent = '.status-bar{position:absolute!important;top:0!important;left:0!important;right:0!important;height:47px!important;display:flex!important;align-items:center!important;justify-content:space-between!important;padding:0 24px!important;z-index:100!important;color:#1D1D1F!important;font-size:14px!important;font-weight:600!important}.phone-screen{background:#FFFFFF!important}.wake-voice-btn{background:linear-gradient(135deg,rgba(0,122,255,0.06) 0%,rgba(88,86,214,0.06) 100%)!important;border:1px solid rgba(0,122,255,0.12)!important;box-shadow:0 2px 8px rgba(0,0,0,0.04)!important}.wake-voice-btn-main{box-shadow:0 6px 20px rgba(0,122,255,0.3),0 1px 3px rgba(0,0,0,0.1)!important}.route-card{background:#fff!important;border-radius:14px!important;box-shadow:0 1px 3px rgba(0,0,0,0.06)!important;border:0.5px solid #E5E5EA!important}.btn-primary{background:linear-gradient(135deg,#007AFF 0%,#5856D6 100%)!important;border-radius:14px!important;font-weight:600!important;box-shadow:0 4px 12px rgba(0,122,255,0.3)!important}.tab-bar{background:rgba(255,255,255,0.9)!important;backdrop-filter:blur(20px)!important;-webkit-backdrop-filter:blur(20px)!important;border-top:0.5px solid rgba(0,0,0,0.1)!important}.wake-search-header{padding:8px 16px 12px!important;gap:10px!important;background:#FFFFFF!important;border-bottom:0.5px solid rgba(0,0,0,0.06)!important}.wake-search-back{width:32px!important;height:32px!important;color:#007AFF!important;font-size:22px!important;font-weight:300!important;border-radius:50%!important;transition:background 0.15s!important}.wake-search-back:active{background:rgba(0,122,255,0.08)!important}.wake-search-input-wrap{flex:1!important;position:relative!important;height:36px!important}.wake-search-input{height:36px!important;background:#F2F2F7!important;border-radius:10px!important;border:none!important;padding:0 40px 0 36px!important;font-size:15px!important;color:#1D1D1F!important;font-weight:400!important;transition:all 0.2s ease!important}.wake-search-input:focus{background:#FFFFFF!important;box-shadow:0 0 0 2px rgba(0,122,255,0.25),0 1px 4px rgba(0,122,255,0.1)!important}.wake-search-input::placeholder{color:#8E8E93!important}.wake-search-icon{left:12px!important;color:#8E8E93!important}.wake-search-voice{right:6px!important;width:28px!important;height:28px!important;border-radius:50%!important;background:rgba(0,122,255,0.1)!important;color:#007AFF!important;transition:all 0.15s!important}.wake-search-voice:active{background:rgba(0,122,255,0.2)!important;transform:scale(0.9)!important}';
    document.head.appendChild(style);
  });

  function adjustSpeechRate() {
    var rates = [0.75, 1.0, 1.25, 1.5];
    var labels = ['慢速', '正常', '快速', '极快'];
    var idx = rates.indexOf(speechRate);
    idx = (idx + 1) % rates.length;
    speechRate = rates[idx];
    var display = document.getElementById('speechRateDisplay');
    if (display) display.textContent = labels[idx];
    var el = (typeof event !== 'undefined' && event) ? event.currentTarget : null;
    if (el) {
      el.setAttribute('aria-label', '语音播报速度，当前' + labels[idx]);
    }
    speak('语音播报速度已调整为' + labels[idx]);
    triggerHaptic('light');
  }

  function resumeNavigation() {
    if (!isNavigating || !isNavPaused) return;
    isNavPaused = false;
    hideAllBanners();
    speak('导航已恢复');
    announce('导航已恢复');
    navTick();
  }

  function confirmArrival() {
    speak('已确认到达目的地，导航结束');
    announce('已确认到达目的地');
    triggerHaptic('success');
    finishNavigation();
  }

  function getCurrentAISceneMode() {
    if (!isNavigating) return 'general';
    var mode = getActualMode();
    var progress = navProgress || 0;
    if (mode === 'taxi' && progress >= 30 && progress <= 50) return 'taxi_find';
    if (mode === 'bus' && progress >= 20 && progress <= 40) return 'bus_board';
    if (mode === 'metro' && progress >= 5 && progress <= 30) return 'subway_entry';
    if (mode === 'walk' && progress >= 85) return 'last_mile';
    if (progress >= 95) return 'indoor_entry';
    return 'general';
  }

  function initCameraScene(mode) {
    var sceneMode = mode || getCurrentAISceneMode();
    var scenes = {
      general: { title: '环境识别', desc: '正在识别行人、台阶、水坑、障碍物、盲道' },
      taxi_find: { title: '打车找车', desc: '正在识别车牌和车门把手' },
      bus_board: { title: '公交上车', desc: '正在确认车辆和寻找上车门' },
      subway_entry: { title: '地铁入口', desc: '正在识别入口、闸机和电梯' },
      indoor_entry: { title: '室内入口', desc: '正在识别入口和电梯' },
      last_mile: { title: '最后一公里', desc: '正在识别盲道、红绿灯、电动车' }
    };
    var scene = scenes[sceneMode] || scenes.general;
    speak('摄像头已开启，正在识别前方环境，识别结果会实时播报');
    var titleEl = document.getElementById('cameraSceneTitle');
    var descEl = document.getElementById('cameraSceneDesc');
    if (titleEl) titleEl.textContent = scene.title;
    if (descEl) descEl.textContent = scene.desc;
  }

  function doTriggerEmergency() {
    var overlay = document.getElementById('emergencyOverlay');
    if (overlay) overlay.style.display = 'flex';
    speak('紧急求助已触发，正在联系紧急联系人');
    announce('紧急求助已触发');
    triggerHaptic('triple');
  }

  function closeCommentOverlay() {
    var overlay = document.getElementById('commentOverlay');
    if (overlay) overlay.style.display = 'none';
  }

  // submitComment 已在后面统一实现（避免重复定义覆盖问题）

  function closeShareOverlay() {
    var overlay = document.getElementById('shareOverlay');
    if (overlay) overlay.style.display = 'none';
  }

  function doShare(platform) {
    speak('已分享到' + platform);
    closeShareOverlay();
  }

  var postOverlayCreated = false;

  function createPost() {
    if (!postOverlayCreated) {
      var overlay = document.createElement('div');
      overlay.id = 'postOverlay';
      overlay.style.cssText = 'position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.4);z-index:9999;display:none;align-items:flex-end;justify-content:center;';
      overlay.innerHTML =
        '<div style="background:#fff;width:100%;border-radius:20px 20px 0 0;overflow:hidden;max-height:90%;display:flex;flex-direction:column;">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:0.5px solid #E5E5EA;flex-shrink:0;">' +
            '<button onclick="closePostOverlay()" style="background:none;border:none;font-size:15px;color:#8E8E93;cursor:pointer;padding:4px 8px;">取消</button>' +
            '<span style="font-size:16px;font-weight:600;color:#1D1D1F;">发布动态</span>' +
            '<button id="postSubmitBtn" onclick="submitPost()" style="background:#007AFF;color:#fff;border:none;border-radius:14px;padding:5px 14px;font-size:14px;font-weight:600;cursor:pointer;opacity:0.5;pointer-events:none;">发布</button>' +
          '</div>' +
          '<div style="padding:16px;overflow-y:auto;flex:1;">' +
            '<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">' +
              '<div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#007AFF,#5856D6);display:flex;align-items:center;justify-content:center;color:#fff;font-size:16px;font-weight:600;flex-shrink:0;">我</div>' +
              '<div>' +
                '<div style="font-size:15px;font-weight:600;color:#1D1D1F;">我</div>' +
                '<select id="postCategory" style="font-size:12px;color:#8E8E93;border:1px solid #E5E5EA;border-radius:8px;padding:2px 8px;background:#F2F2F7;margin-top:2px;">' +
                  '<option value="feed">推荐</option>' +
                  '<option value="danger">危险标记</option>' +
                  '<option value="route">路线分享</option>' +
                  '<option value="tips">出行贴士</option>' +
                '</select>' +
              '</div>' +
            '</div>' +
            '<textarea id="postInput" placeholder="分享你的出行经验..." style="width:100%;height:100px;border:1px solid #E5E5EA;border-radius:12px;padding:12px;font-size:15px;color:#1D1D1F;outline:none;resize:none;box-sizing:border-box;background:#F8F8F8;font-family:inherit;"></textarea>' +
            '<div style="display:flex;gap:8px;margin-top:10px;align-items:center;">' +
              '<div id="postLocationBtn" onclick="showLocationPicker()" style="flex:1;height:36px;border:1px solid #E5E5EA;border-radius:10px;padding:0 12px;font-size:13px;color:#8E8E93;background:#F8F8F8;box-sizing:border-box;display:flex;align-items:center;gap:6px;cursor:pointer;">' +
                '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>' +
                '<span id="postLocationText">添加位置（选填）</span>' +
              '</div>' +
            '</div>' +
            '<div style="display:flex;gap:8px;margin-top:8px;">' +
              '<input id="postTags" placeholder="标签，逗号分隔" style="flex:1;height:36px;border:1px solid #E5E5EA;border-radius:10px;padding:0 12px;font-size:13px;color:#1D1D1F;outline:none;background:#F8F8F8;box-sizing:border-box;">' +
            '</div>' +
            '<div id="quickTags" style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">' +
              '<span data-tag="#盲道推荐" style="background:#F2F2F7;padding:5px 12px;border-radius:14px;font-size:12px;color:#3C3C43;cursor:pointer;">#盲道推荐</span>' +
              '<span data-tag="#出行经验" style="background:#F2F2F7;padding:5px 12px;border-radius:14px;font-size:12px;color:#3C3C43;cursor:pointer;">#出行经验</span>' +
              '<span data-tag="#地铁出行" style="background:#F2F2F7;padding:5px 12px;border-radius:14px;font-size:12px;color:#3C3C43;cursor:pointer;">#地铁出行</span>' +
              '<span data-tag="#医院攻略" style="background:#F2F2F7;padding:5px 12px;border-radius:14px;font-size:12px;color:#3C3C43;cursor:pointer;">#医院攻略</span>' +
            '</div>' +
          '</div>' +
        '</div>';
      var phoneScreen = document.querySelector('.phone-screen') || document.body;
      phoneScreen.appendChild(overlay);
      overlay.addEventListener('click', function(e) {
        if (e.target === overlay) { closePostOverlay(); return; }
        var tagSpan = e.target.closest('[data-tag]');
        if (tagSpan) insertQuickTag(tagSpan.getAttribute('data-tag'));
      });
      var ta = document.getElementById('postInput');
      if (ta) {
        ta.addEventListener('input', function() {
          var btn = document.getElementById('postSubmitBtn');
          if (!btn) return;
          var has = this.value.trim().length > 0;
          btn.style.opacity = has ? '1' : '0.5';
          btn.style.pointerEvents = has ? 'auto' : 'none';
        });
      }
      postOverlayCreated = true;
    }
    var ov = document.getElementById('postOverlay');
    if (ov) {
      ov.style.display = 'flex';
      var input = document.getElementById('postInput');
      if (input) setTimeout(function() { input.focus(); }, 200);
    }
    speak('打开发帖界面');
    triggerHaptic('light');
  }

  function insertQuickTag(tag) {
    var tagInput = document.getElementById('postTags');
    if (!tagInput) return;
    var val = tagInput.value.trim();
    if (val && val.indexOf(tag) === -1) tagInput.value = val + ',' + tag;
    else if (!val) tagInput.value = tag;
    triggerHaptic('light');
  }

  var postLocations = [
    { name: '当前位置', icon: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 10m-3 0a3 0 1 0 6 0a3 0 1 0-6 0' },
    { name: '万达广场1号门', icon: 'M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z' },
    { name: '人民医院', icon: 'M3 21h18 M5 21V7l8-4v18 M19 21V11l-6-4' },
    { name: '地铁1号线建设路站', icon: 'M4 15s1-1 4-1 5 2 8 2 4-1 4-1M4 19s1-1 4-1 5 2 8 2 4-1 4-1M12 3v6M9 6h6' },
    { name: '朝阳区幸福小区', icon: 'M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z' },
    { name: '建设路与解放路路口', icon: 'M12 22s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z M12 10m-2.5 0a2.5 0 1 0 5 0a2.5 0 1 0-5 0' },
    { name: '社区服务中心', icon: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 7m-4 0a4 0 1 0 8 0a4 0 1 0-8 0' }
  ];

  function showLocationPicker() {
    var existing = document.getElementById('locationPickerOverlay');
    if (existing) { existing.remove(); }
    var picker = document.createElement('div');
    picker.id = 'locationPickerOverlay';
    picker.style.cssText = 'position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.4);z-index:10000;display:flex;align-items:flex-end;justify-content:center;';
    var items = '';
    postLocations.forEach(function(loc) {
      items += '<div onclick="selectPostLocation(\'' + loc.name.replace(/'/g, "\\'") + '\')" style="display:flex;align-items:center;gap:12px;padding:14px 16px;cursor:pointer;border-bottom:0.5px solid #E5E5EA;">' +
        '<div style="width:32px;height:32px;border-radius:8px;background:#F2F2F7;display:flex;align-items:center;justify-content:center;flex-shrink:0;">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#007AFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="' + loc.icon + '"/></svg>' +
        '</div>' +
        '<span style="font-size:15px;color:#1D1D1F;flex:1;">' + loc.name + '</span>' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>' +
      '</div>';
    });
    picker.innerHTML =
      '<div style="background:#fff;width:100%;border-radius:20px 20px 0 0;overflow:hidden;max-height:70%;display:flex;flex-direction:column;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:0.5px solid #E5E5EA;flex-shrink:0;">' +
          '<span style="font-size:16px;font-weight:600;color:#1D1D1F;">选择位置</span>' +
          '<button onclick="closeLocationPicker()" style="background:none;border:none;font-size:20px;color:#8E8E93;cursor:pointer;padding:4px 8px;line-height:1;">&times;</button>' +
        '</div>' +
        '<div style="overflow-y:auto;flex:1;">' + items + '</div>' +
      '</div>';
    var phoneScreen = document.querySelector('.phone-screen') || document.body;
    phoneScreen.appendChild(picker);
    picker.addEventListener('click', function(e) {
      if (e.target === picker) closeLocationPicker();
    });
    triggerHaptic('light');
  }

  function closeLocationPicker() {
    var picker = document.getElementById('locationPickerOverlay');
    if (picker) picker.remove();
  }

  function selectPostLocation(name) {
    var textEl = document.getElementById('postLocationText');
    var btnEl = document.getElementById('postLocationBtn');
    if (textEl) { textEl.textContent = name; textEl.style.color = '#1D1D1F'; }
    if (btnEl) btnEl.style.borderColor = '#007AFF';
    closeLocationPicker();
    triggerHaptic('light');
  }

  function closePostOverlay() {
    var overlay = document.getElementById('postOverlay');
    if (overlay) overlay.style.display = 'none';
    var input = document.getElementById('postInput');
    if (input) input.value = '';
    var locText = document.getElementById('postLocationText');
    if (locText) { locText.textContent = '添加位置（选填）'; locText.style.color = '#8E8E93'; }
    var locBtn = document.getElementById('postLocationBtn');
    if (locBtn) locBtn.style.borderColor = '#E5E5EA';
    var tags = document.getElementById('postTags');
    if (tags) tags.value = '';
  }

  function submitPost() {
    var input = document.getElementById('postInput');
    var locText = document.getElementById('postLocationText');
    var tagInput = document.getElementById('postTags');
    var catSelect = document.getElementById('postCategory');
    if (!input || !input.value.trim()) {
      speak('请输入动态内容');
      triggerHaptic('warning');
      return;
    }
    var text = input.value.trim();
    var location = '';
    if (locText && locText.textContent !== '添加位置（选填）') {
      location = locText.textContent;
    }
    var tagStr = tagInput ? tagInput.value.trim() : '';
    var category = catSelect ? catSelect.value : 'feed';
    var tags = [];
    if (tagStr) {
      tagStr.split(/[,，]/).forEach(function(t) {
        var trimmed = t.trim();
        if (trimmed) {
          if (trimmed.charAt(0) !== '#') trimmed = '#' + trimmed;
          tags.push(trimmed);
        }
      });
    }
    var newPost = {
      avatarColor: '#007AFF',
      username: '我',
      time: '刚刚',
      badge: '',
      text: text,
      location: location,
      tags: tags,
      likes: 0,
      comments: 0,
      shares: 0,
      isNew: true
    };
    if (category === 'danger') { newPost.badge = 'danger'; newPost.isDanger = true; }
    else if (category === 'route') { newPost.badge = 'route'; newPost.isRoute = true; }
    else if (category === 'tips') { newPost.badge = 'expert'; }
    if (!communityFeedData[category]) communityFeedData[category] = [];
    communityFeedData[category].unshift(newPost);
    speak('动态已发布');
    triggerHaptic('success');
    closePostOverlay();
    if (currentCommunityTab !== category) {
      var tabEl = document.querySelector('.community-tab[data-tab="' + category + '"]');
      if (tabEl) switchCommunityTab(category, tabEl);
    } else {
      loadCommunityFeed(category);
    }
    var btn = document.getElementById('postSubmitBtn');
    if (btn) { btn.style.opacity = '0.5'; btn.style.pointerEvents = 'none'; }
  }

  function createDangerMark() {
    speak('危险标记功能已打开，请在地图上标记危险位置');
  }

  function submitDangerMark() {
    speak('危险标记已提交，感谢您的贡献');
    triggerHaptic('success');
  }

  var navDangerBtnInjected = false;

  function ensureNavDangerButton() {
    if (navDangerBtnInjected) return;
    var navMap = document.querySelector('#navScreen .nav-map-container');
    if (!navMap) return;

    // 创建一个小的浮动圆形警告图标，不占主导视觉
    var btn = document.createElement('button');
    btn.id = 'navDangerMarkBtn';
    btn.className = 'nav-danger-mark-btn';
    btn.setAttribute('role', 'button');
    btn.setAttribute('aria-label', '遇到障碍或施工？点击标记提醒其他视障朋友');
    btn.style.cssText = 'position:absolute;top:12px;right:12px;width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,0.92);border:none;box-shadow:0 2px 8px rgba(0,0,0,0.15);color:#FF3B30;cursor:pointer;display:none;align-items:center;justify-content:center;z-index:100;transition:all 0.15s cubic-bezier(0.4,0,0.2,1);';
    btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
    btn.onclick = function() { openNavDangerPost(); };
    btn.onkeydown = function(e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openNavDangerPost(); } };

    btn.addEventListener('touchstart', function() { btn.style.background = 'rgba(255,59,48,0.15)'; btn.style.transform = 'scale(0.95)'; });
    btn.addEventListener('touchend', function() { btn.style.background = 'rgba(255,255,255,0.92)'; btn.style.transform = 'scale(1)'; });
    btn.addEventListener('mousedown', function() { btn.style.background = 'rgba(255,59,48,0.15)'; btn.style.transform = 'scale(0.95)'; });
    btn.addEventListener('mouseup', function() { btn.style.background = 'rgba(255,255,255,0.92)'; btn.style.transform = 'scale(1)'; });

    navMap.appendChild(btn);
    navDangerBtnInjected = true;
  }

  // 语音询问是否上报危险
  var dangerAskListening = false;
  function askDangerReportVoice(sceneText) {
    if (dangerAskListening) return;
    dangerAskListening = true;

    speak('检测到' + (sceneText || '前方异常') + '，是否共享到社区提醒其他视障朋友？请说"是"或"否"', 'high');
    triggerHaptic('double');

    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      // 不支持语音识别时，3秒后自动不上报
      setTimeout(function() {
        dangerAskListening = false;
        speak('未识别到语音，已为您继续导航');
      }, 3000);
      return;
    }

    var recognition = new SR();
    recognition.lang = 'zh-CN';
    recognition.maxAlternatives = 1;

    recognition.onresult = function(event) {
      var transcript = (event.results[0][0].transcript || '').trim();
      var isYes = /是|要|报|上|标记|提醒|好/.test(transcript);
      var isNo = /否|不|不要|不用|继续|没有|没事/.test(transcript);
      if (isYes && !isNo) {
        openNavDangerPost();
      } else {
        speak('好的，已为您继续导航');
      }
      dangerAskListening = false;
    };
    recognition.onerror = function() {
      dangerAskListening = false;
      speak('未听清，已为您继续导航');
    };
    recognition.onend = function() {
      dangerAskListening = false;
    };

    try {
      recognition.start();
      // 8秒超时保护
      setTimeout(function() {
        try { recognition.stop(); } catch(e) {}
        if (dangerAskListening) {
          dangerAskListening = false;
          speak('未识别到回答，已为您继续导航');
        }
      }, 8000);
    } catch(e) {
      dangerAskListening = false;
      // 降级：不支持语音时，直接打开上报面板让用户操作
      setTimeout(function() { openNavDangerPost(); }, 1500);
    }
  }

  var navDangerPostCreated = false;

  function openNavDangerPost() {
    if (userRole === 'family') {
      showFeedback('家人模式不支持此功能', 'info');
      return;
    }
    if (!navDangerPostCreated) {
      var overlay = document.createElement('div');
      overlay.id = 'navDangerPostOverlay';
      overlay.style.cssText = 'position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.4);z-index:9999;display:none;align-items:flex-end;justify-content:center;';
      overlay.innerHTML =
        '<div style="background:#fff;width:100%;border-radius:20px 20px 0 0;overflow:hidden;max-height:85%;display:flex;flex-direction:column;">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:0.5px solid #E5E5EA;flex-shrink:0;">' +
            '<button onclick="closeNavDangerPost()" style="background:none;border:none;font-size:15px;color:#8E8E93;cursor:pointer;padding:4px 8px;">取消</button>' +
            '<span style="font-size:16px;font-weight:600;color:#1D1D1F;">发布危险提醒</span>' +
            '<button id="navDangerSubmitBtn" onclick="submitNavDangerPost()" style="background:#FF3B30;color:#fff;border:none;border-radius:14px;padding:5px 14px;font-size:14px;font-weight:600;cursor:pointer;">发布</button>' +
          '</div>' +
          '<div style="padding:16px;overflow-y:auto;flex:1;">' +
            '<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">' +
              '<div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#FF3B30,#FF9500);display:flex;align-items:center;justify-content:center;color:#fff;font-size:16px;font-weight:600;flex-shrink:0;">我</div>' +
              '<div>' +
                '<div style="font-size:15px;font-weight:600;color:#1D1D1F;">我</div>' +
                '<div style="font-size:12px;color:#FF3B30;font-weight:500;margin-top:2px;">⚠️ 危险标记</div>' +
              '</div>' +
            '</div>' +
            '<div style="margin-bottom:12px;">' +
              '<div style="font-size:13px;color:#8E8E93;margin-bottom:8px;">选择危险类型</div>' +
              '<div id="dangerTypeOptions" style="display:flex;gap:8px;flex-wrap:wrap;">' +
                '<span data-type="construction" style="padding:8px 14px;border-radius:20px;font-size:13px;background:#F2F2F7;color:#3C3C43;cursor:pointer;border:1.5px solid transparent;">🚧 施工围挡</span>' +
                '<span data-type="puddle" style="padding:8px 14px;border-radius:20px;font-size:13px;background:#F2F2F7;color:#3C3C43;cursor:pointer;border:1.5px solid transparent;">💧 路面积水</span>' +
                '<span data-type="occupancy" style="padding:8px 14px;border-radius:20px;font-size:13px;background:#F2F2F7;color:#3C3C43;cursor:pointer;border:1.5px solid transparent;">🚲 占道经营</span>' +
                '<span data-type="missing" style="padding:8px 14px;border-radius:20px;font-size:13px;background:#F2F2F7;color:#3C3C43;cursor:pointer;border:1.5px solid transparent;">🚫 无盲道</span>' +
                '<span data-type="steps" style="padding:8px 14px;border-radius:20px;font-size:13px;background:#F2F2F7;color:#3C3C43;cursor:pointer;border:1.5px solid transparent;">🪜 台阶陡坡</span>' +
                '<span data-type="vehicle" style="padding:8px 14px;border-radius:20px;font-size:13px;background:#F2F2F7;color:#3C3C43;cursor:pointer;border:1.5px solid transparent;">🚗 违停车辆</span>' +
              '</div>' +
            '</div>' +
            '<div style="margin-bottom:12px;">' +
              '<div style="font-size:13px;color:#8E8E93;margin-bottom:8px;">位置信息</div>' +
              '<div id="navDangerLocation" style="background:#F2F2F7;border-radius:10px;padding:12px;font-size:14px;color:#1D1D1F;display:flex;align-items:center;gap:8px;">' +
                '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#FF3B30;"><path d="M12 22s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>' +
                '<span id="navDangerLocationText">当前位置</span>' +
              '</div>' +
            '</div>' +
            '<div style="margin-bottom:12px;">' +
              '<div style="font-size:13px;color:#8E8E93;margin-bottom:8px;">补充说明（选填）</div>' +
              '<textarea id="navDangerDesc" placeholder="描述一下具体情况，例如：盲道被共享单车占用，需要从左侧绕行..." style="width:100%;height:80px;border:1px solid #E5E5EA;border-radius:12px;padding:12px;font-size:15px;color:#1D1D1F;outline:none;resize:none;box-sizing:border-box;background:#F8F8F8;font-family:inherit;"></textarea>' +
            '</div>' +
            '<div style="background:rgba(255,59,48,0.06);border-radius:12px;padding:12px;display:flex;gap:10px;align-items:flex-start;">' +
              '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF3B30" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-top:1px;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>' +
              '<div style="font-size:13px;color:#FF3B30;line-height:1.5;">发布后将提醒其他视障朋友经过此处时注意安全，感谢您的爱心贡献！</div>' +
            '</div>' +
          '</div>' +
        '</div>';

      var phoneScreen = document.querySelector('.phone-screen') || document.body;
      phoneScreen.appendChild(overlay);

      overlay.addEventListener('click', function(e) {
        if (e.target === overlay) { closeNavDangerPost(); return; }
        var typeEl = e.target.closest('[data-type]');
        if (typeEl) selectDangerType(typeEl.getAttribute('data-type'));
      });

      navDangerPostCreated = true;
    }

    var dest = selectedDestination || '当前位置';
    var locText = document.getElementById('navDangerLocationText');
    if (locText) locText.textContent = dest;

    selectedDangerType = '';
    var options = document.querySelectorAll('#dangerTypeOptions [data-type]');
    options.forEach(function(opt) {
      opt.style.background = '#F2F2F7';
      opt.style.color = '#3C3C43';
      opt.style.borderColor = 'transparent';
    });

    var desc = document.getElementById('navDangerDesc');
    if (desc) desc.value = '';

    var ov = document.getElementById('navDangerPostOverlay');
    if (ov) ov.style.display = 'flex';
    speak('发布危险提醒，请选择危险类型');
    triggerHaptic('light');
  }

  var selectedDangerType = '';
  var dangerTypeInfo = {
    construction: { label: '施工围挡', emoji: '🚧', text: '⚠️ 此处有施工围挡，盲道被占用，请小心绕行！', tag: '#施工围挡' },
    puddle: { label: '路面积水', emoji: '💧', text: '⚠️ 此处路面积水，请小心绕行，注意防滑！', tag: '#路面积水' },
    occupancy: { label: '占道经营', emoji: '🚲', text: '⚠️ 此处有占道经营，请小心绕行！', tag: '#占道经营' },
    missing: { label: '无盲道', emoji: '🚫', text: '⚠️ 此处无盲道或盲道中断，请小心通行！', tag: '#无盲道' },
    steps: { label: '台阶陡坡', emoji: '🪜', text: '⚠️ 前方有台阶/陡坡，请注意脚下安全！', tag: '#台阶陡坡' },
    vehicle: { label: '违停车辆', emoji: '🚗', text: '⚠️ 此处有机动车/非机动车占用盲道，请小心绕行！', tag: '#违停车辆' }
  };

  function selectDangerType(type) {
    selectedDangerType = type;
    var options = document.querySelectorAll('#dangerTypeOptions [data-type]');
    options.forEach(function(opt) {
      if (opt.getAttribute('data-type') === type) {
        opt.style.background = 'rgba(255,59,48,0.1)';
        opt.style.color = '#FF3B30';
        opt.style.borderColor = '#FF3B30';
      } else {
        opt.style.background = '#F2F2F7';
        opt.style.color = '#3C3C43';
        opt.style.borderColor = 'transparent';
      }
    });
    var info = dangerTypeInfo[type];
    if (info) {
      speak('已选择' + info.label);
      triggerHaptic('light');
    }
  }

  function closeNavDangerPost() {
    var overlay = document.getElementById('navDangerPostOverlay');
    if (overlay) overlay.style.display = 'none';
  }

  function submitNavDangerPost() {
    if (!selectedDangerType) {
      speak('请先选择危险类型');
      triggerHaptic('warning');
      return;
    }
    var info = dangerTypeInfo[selectedDangerType];
    var descEl = document.getElementById('navDangerDesc');
    var desc = descEl ? descEl.value.trim() : '';
    var locTextEl = document.getElementById('navDangerLocationText');
    var location = locTextEl ? locTextEl.textContent.trim() : '';

    var text = info.text;
    if (desc) {
      text = desc;
      if (text.charAt(0) !== '⚠️') text = '⚠️ ' + text;
    }

    var newPost = {
      avatarColor: '#FF3B30',
      username: '我',
      time: '刚刚',
      badge: 'danger',
      text: text,
      location: location,
      tags: ['#危险标记', info.tag, '#需绕行'],
      likes: 0,
      comments: 0,
      shares: 0,
      isDanger: true,
      isNew: true
    };

    if (!communityFeedData.danger) communityFeedData.danger = [];
    communityFeedData.danger.unshift(newPost);

    speak('危险提醒已发布，感谢您的爱心贡献');
    triggerHaptic('success');
    closeNavDangerPost();
    showFeedback('⚠️ 危险提醒已发布，将帮助更多视障朋友', 'warning');
  }

  var isLoggedIn = false;
  var currentUser = null;
  var userRole = 'blind'; // 'blind' or 'family'
  var loginPageCreated = false;
  var registerPageCreated = false;
  var accountPageCreated = false;
  var userInfo = {
    name: '张先生',
    phone: '138****8888',
    avatarColor: '#007AFF',
    registerDate: '2024年1月',
    totalTrips: 128,
    emergencyContacts: 2,
    safeAreas: 3
  };

  function getStoredUsers() {
    try {
      var users = localStorage.getItem('tongban_users');
      return users ? JSON.parse(users) : [];
    } catch(e) {
      return [];
    }
  }

  function saveStoredUsers(users) {
    try {
      localStorage.setItem('tongban_users', JSON.stringify(users));
    } catch(e) {}
  }

  function getCurrentSession() {
    try {
      var session = localStorage.getItem('tongban_session');
      return session ? JSON.parse(session) : null;
    } catch(e) {
      return null;
    }
  }

  function setCurrentSession(phone) {
    try {
      localStorage.setItem('tongban_session', JSON.stringify({ phone: phone, time: Date.now() }));
    } catch(e) {}
  }

  function clearCurrentSession() {
    try {
      localStorage.removeItem('tongban_session');
    } catch(e) {}
  }

  function maskPhone(phone) {
    if (!phone || phone.length < 11) return phone;
    return phone.substring(0, 3) + '****' + phone.substring(7);
  }

  function getAvatarColor(name) {
    var colors = ['#007AFF', '#5856D6', '#AF52DE', '#FF2D55', '#FF9500', '#FFCC00', '#34C759', '#30B0C7'];
    var hash = 0;
    for (var i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  function checkLoginStatus() {
    var session = getCurrentSession();
    if (session && session.phone) {
      var users = getStoredUsers();
      var user = users.find(function(u) { return u.phone === session.phone; });
      if (user) {
        isLoggedIn = true;
        currentUser = user;
        updateUserInfoFromCurrentUser();
        // Restore role
        try {
          var savedRole = localStorage.getItem('tongban_role');
          if (savedRole === 'family' || savedRole === 'blind') userRole = savedRole;
        } catch(e) {}
        applyRoleUI();
        if (userRole === 'family') {
          setTimeout(function() { switchTab('family'); }, 100);
        }
        return true;
      }
    }
    isLoggedIn = false;
    currentUser = null;
    return false;
  }

  function updateUserInfoFromCurrentUser() {
    if (currentUser) {
      userInfo.name = currentUser.name;
      userInfo.phone = maskPhone(currentUser.phone);
      userInfo.avatarColor = currentUser.avatarColor || getAvatarColor(currentUser.name);
      userInfo.registerDate = currentUser.registerDate;
      userInfo.totalTrips = currentUser.totalTrips || 0;
      userInfo.emergencyContacts = currentUser.emergencyContacts || 0;
      userInfo.safeAreas = currentUser.safeAreas || 0;
    }
  }

  function refreshMyPageUI() {
    var nameEl = document.querySelector('#myScreen .my-name');
    var phoneEl = document.querySelector('#myScreen .my-phone');
    var avatarEl = document.querySelector('#myScreen .my-avatar');
    if (nameEl) nameEl.textContent = isLoggedIn ? userInfo.name : '点击登录';
    if (phoneEl) phoneEl.textContent = isLoggedIn ? userInfo.phone : '登录后体验更多功能';
    if (avatarEl) {
      avatarEl.textContent = isLoggedIn ? userInfo.name.charAt(0) : '?';
      avatarEl.style.background = isLoggedIn
        ? 'linear-gradient(135deg,' + userInfo.avatarColor + ' 0%,#5856D6 100%)'
        : 'linear-gradient(135deg,#C7C7CC 0%,#8E8E93 100%)';
    }
  }

  function handleMyHeaderClick() {
    if (!isLoggedIn) {
      showLogin();
    } else {
      showAccountInfo();
    }
  }

  var selectedLoginRole = 'blind';

  function selectLoginRole(role) {
    selectedLoginRole = role;
    // 同时更新登录页和注册页的角色按钮（两个页面ID重复，分别查找）
    var screens = ['loginScreen', 'registerScreen'];
    for (var s = 0; s < screens.length; s++) {
      var screen = document.getElementById(screens[s]);
      if (!screen) continue;
      var blindEl = screen.querySelector('[id="roleBlind"]');
      var familyEl = screen.querySelector('[id="roleFamily"]');
      if (!blindEl || !familyEl) continue;

      if (role === 'blind') {
        blindEl.style.border = '1.5px solid #007AFF';
        blindEl.style.background = 'rgba(0,122,255,0.06)';
        var blindSvg = blindEl.querySelector('svg');
        if (blindSvg) blindSvg.setAttribute('stroke', '#007AFF');
        var blindText = blindEl.querySelector('div');
        if (blindText) blindText.style.color = '#007AFF';

        familyEl.style.border = '1.5px solid #E5E5EA';
        familyEl.style.background = '#FFFFFF';
        var familySvg = familyEl.querySelector('svg');
        if (familySvg) familySvg.setAttribute('stroke', '#8E8E93');
        var familyText = familyEl.querySelector('div');
        if (familyText) familyText.style.color = '#8E8E93';
      } else {
        familyEl.style.border = '1.5px solid #FF2D55';
        familyEl.style.background = 'rgba(255,45,85,0.06)';
        var fSvg = familyEl.querySelector('svg');
        if (fSvg) fSvg.setAttribute('stroke', '#FF2D55');
        var fText = familyEl.querySelector('div');
        if (fText) fText.style.color = '#FF2D55';

        blindEl.style.border = '1.5px solid #E5E5EA';
        blindEl.style.background = '#FFFFFF';
        var bSvg = blindEl.querySelector('svg');
        if (bSvg) bSvg.setAttribute('stroke', '#8E8E93');
        var bText = blindEl.querySelector('div');
        if (bText) bText.style.color = '#8E8E93';
      }
    }
  }

  var familyDashboardCreated = false;

  function createFamilyDashboard() {
    if (familyDashboardCreated) return;
    var familyScreen = document.getElementById('familyScreen');
    if (!familyScreen) return;

    var dashboard = document.createElement('div');
    dashboard.id = 'familyDashboard';
    dashboard.style.cssText = 'display:none;flex:1;overflow-y:auto;padding:0 0 90px 0;background:#F2F2F7;-webkit-overflow-scrolling:touch;';
    // 确保 familyScreen 是纵向 flex 布局
    if (familyScreen) {
      familyScreen.style.display = 'flex';
      familyScreen.style.flexDirection = 'column';
      familyScreen.style.overflow = 'hidden';
    }

    // 确保顶部导航栏存在
    var navBar = familyScreen.querySelector('.family-nav-bar');
    if (!navBar) {
      navBar = document.createElement('div');
      navBar.className = 'family-nav-bar';
      navBar.style.cssText = 'position:relative;padding:10px 20px;background:rgba(255,255,255,0.92);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:0.5px solid rgba(0,0,0,0.06);display:flex;align-items:center;justify-content:center;flex-shrink:0;padding-top:calc(47px + 10px);';
      navBar.innerHTML = '<span class="family-nav-title" style="font-size:17px;font-weight:600;color:#1D1D1F;display:flex;align-items:center;gap:8px;">守护中心</span>';
      familyScreen.insertBefore(navBar, familyScreen.firstChild);
    }

    dashboard.innerHTML =
      // 顶部问候区
      '<div style="padding:16px 20px 12px;background:#FFFFFF;border-bottom:0.5px solid #E5E5EA;">' +
        '<div style="font-size:13px;color:#8E8E93;margin-bottom:4px;">下午好，李先生</div>' +
        '<div style="font-size:22px;font-weight:700;color:#1D1D1F;letter-spacing:-0.3px;">家人一切安好</div>' +
      '</div>' +
      // 主地图卡片
      '<div onclick="openFamilyLocationPage(\'张大爷\')" style="margin:12px 16px 0;background:#FFFFFF;border-radius:18px;overflow:hidden;border:0.5px solid #E5E5EA;box-shadow:0 2px 8px rgba(0,0,0,0.04);cursor:pointer;">' +
        '<div style="height:220px;background:linear-gradient(180deg,#EAF2FF 0%,#F0F7FF 55%,#F5F9FF 100%);position:relative;">' +
          // 地图网格背景
          '<svg width="100%" height="100%" viewBox="0 0 360 220" preserveAspectRatio="xMidYMid slice" style="position:absolute;top:0;left:0;">' +
            '<defs>' +
              '<pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">' +
                '<path d="M 30 0 L 0 0 0 30" fill="none" stroke="#D1E0FF" stroke-width="0.5" opacity="0.5"/>' +
              '</pattern>' +
            '</defs>' +
            '<rect width="360" height="220" fill="url(#grid)"/>' +
            // 道路
            '<path d="M0 160 Q60 140 120 120 Q180 100 240 80 Q300 60 360 50" fill="none" stroke="#C8D8FB" stroke-width="14" stroke-linecap="round"/>' +
            '<path d="M0 160 Q60 140 120 120 Q180 100 240 80 Q300 60 360 50" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-dasharray="6,6" stroke-linecap="round"/>' +
            '<path d="M120 220 Q130 180 150 140 Q170 100 200 70" fill="none" stroke="#C8D8FB" stroke-width="12" stroke-linecap="round"/>' +
            // 建筑物群
            '<rect x="30" y="120" width="28" height="50" rx="3" fill="#B8CDF0" opacity="0.6"/>' +
            '<rect x="65" y="100" width="24" height="70" rx="3" fill="#A9BFE8" opacity="0.5"/>' +
            '<rect x="280" y="30" width="32" height="55" rx="3" fill="#B8CDF0" opacity="0.5"/>' +
            '<rect x="320" y="50" width="26" height="35" rx="3" fill="#A9BFE8" opacity="0.4"/>' +
            // 起点标记（家）
            '<g transform="translate(50, 155)">' +
              '<circle r="12" fill="#34C759" opacity="0.2"/>' +
              '<circle r="7" fill="#34C759"/>' +
              '<path d="M-3 -1 L-3 3 L3 3 L3 -1 L0 -4 Z" fill="white" transform="translate(0, -1)"/>' +
            '</g>' +
            // 当前位置标记（带脉冲）
            '<g transform="translate(200, 80)">' +
              '<circle r="18" fill="#007AFF" opacity="0.15">' +
                '<animate attributeName="r" values="14;22;14" dur="2s" repeatCount="indefinite"/>' +
                '<animate attributeName="opacity" values="0.3;0.1;0.3" dur="2s" repeatCount="indefinite"/>' +
              '</circle>' +
              '<circle r="10" fill="#007AFF" opacity="0.3"/>' +
              '<circle r="6" fill="#007AFF"/>' +
              '<circle r="2.5" fill="#fff"/>' +
            '</g>' +
            // 终点标记
            '<g transform="translate(340, 40)">' +
              '<circle r="10" fill="#FF9500" opacity="0.2"/>' +
              '<circle r="6" fill="#FF9500"/>' +
              '<path d="M0 -3 L-2.5 1.5 L2.5 1.5 Z" fill="white"/>' +
            '</g>' +
          '</svg>' +
          // 在线人数标签
          '<div style="position:absolute;top:14px;left:14px;background:rgba(255,255,255,0.95);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);padding:7px 13px;border-radius:20px;font-size:12px;font-weight:600;color:#1D1D1F;display:flex;align-items:center;gap:6px;box-shadow:0 2px 10px rgba(0,0,0,0.08);border:0.5px solid rgba(0,0,0,0.05);">' +
            '<span style="width:6px;height:6px;border-radius:50%;background:#34C759;display:inline-block;box-shadow:0 0 0 2px rgba(52,199,89,0.2);"></span>2位家人在线' +
          '</div>' +
          // 实时按钮
          '<div style="position:absolute;top:14px;right:14px;background:rgba(0,122,255,0.92);color:#fff;padding:7px 13px;border-radius:20px;font-size:11px;font-weight:600;box-shadow:0 2px 10px rgba(0,122,255,0.3);display:flex;align-items:center;gap:5px;backdrop-filter:blur(8px);">' +
            '<span style="width:5px;height:5px;border-radius:50%;background:#fff;display:inline-block;animation:pulse 1.5s ease-in-out infinite;"></span>实时追踪' +
          '</div>' +
          // 底部信息条
          '<div style="position:absolute;bottom:12px;left:12px;right:12px;background:rgba(255,255,255,0.95);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-radius:14px;padding:12px 14px;display:flex;align-items:center;gap:10px;box-shadow:0 4px 20px rgba(0,0,0,0.08);border:0.5px solid rgba(0,0,0,0.06);">' +
            '<div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#FF6B8A 0%,#FF2D55 100%);display:flex;align-items:center;justify-content:center;color:#fff;font-size:16px;font-weight:600;flex-shrink:0;box-shadow:0 2px 8px rgba(255,45,85,0.3);">张</div>' +
            '<div style="flex:1;min-width:0;">' +
              '<div style="font-size:15px;font-weight:600;color:#1D1D1F;margin-bottom:2px;">张大爷</div>' +
              '<div style="font-size:12px;color:#007AFF;font-weight:500;display:flex;align-items:center;gap:4px;">' +
                '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="5 12 10 17 19 8"/></svg>' +
                '正在前往万达广场' +
              '</div>' +
            '</div>' +
            '<div onclick="openFamilyLocationPage(\'张大爷\')" style="width:36px;height:36px;border-radius:50%;background:#F2F2F7;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;">' +
              '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#007AFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      // 状态卡片组
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:12px 16px 0;">' +
        '<div style="background:#FFFFFF;border-radius:14px;padding:16px 14px;border:0.5px solid #E5E5EA;box-shadow:0 1px 3px rgba(0,0,0,0.03);position:relative;overflow:hidden;">' +
          '<div style="position:absolute;top:0;right:0;width:50px;height:50px;background:rgba(52,199,89,0.08);border-radius:0 14px 0 25px;"></div>' +
          '<div style="display:flex;align-items:center;gap:7px;margin-bottom:10px;position:relative;">' +
            '<div style="width:28px;height:28px;border-radius:8px;background:rgba(52,199,89,0.12);display:flex;align-items:center;justify-content:center;">' +
              '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34C759" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>' +
            '</div>' +
            '<span style="font-size:12px;color:#8E8E93;font-weight:500;">安全状态</span>' +
          '</div>' +
          '<div style="font-size:24px;font-weight:700;color:#34C759;letter-spacing:-0.5px;position:relative;">正常</div>' +
          '<div style="font-size:11px;color:#C7C7CC;margin-top:4px;position:relative;">2位家人均安全</div>' +
        '</div>' +
        '<div style="background:#FFFFFF;border-radius:14px;padding:16px 14px;border:0.5px solid #E5E5EA;box-shadow:0 1px 3px rgba(0,0,0,0.03);position:relative;overflow:hidden;">' +
          '<div style="position:absolute;top:0;right:0;width:50px;height:50px;background:rgba(255,149,0,0.08);border-radius:0 14px 0 25px;"></div>' +
          '<div style="display:flex;align-items:center;gap:7px;margin-bottom:10px;position:relative;">' +
            '<div style="width:28px;height:28px;border-radius:8px;background:rgba(255,149,0,0.12);display:flex;align-items:center;justify-content:center;">' +
              '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF9500" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' +
            '</div>' +
            '<span style="font-size:12px;color:#8E8E93;font-weight:500;">今日预警</span>' +
          '</div>' +
          '<div style="font-size:24px;font-weight:700;color:#1D1D1F;letter-spacing:-0.5px;position:relative;">0</div>' +
          '<div style="font-size:11px;color:#C7C7CC;margin-top:4px;position:relative;">暂无异常情况</div>' +
        '</div>' +
      '</div>' +
      // 最近动态
      '<div style="margin:12px 16px 0;background:#FFFFFF;border-radius:14px;padding:0;border:0.5px solid #E5E5EA;box-shadow:0 1px 3px rgba(0,0,0,0.03);overflow:hidden;">' +
        '<div style="padding:14px 16px 10px;display:flex;align-items:center;justify-content:space-between;">' +
          '<div style="font-size:15px;font-weight:600;color:#1D1D1F;display:flex;align-items:center;gap:8px;">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#007AFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' +
            '最近动态' +
          '</div>' +
          '<div onclick="openAlertHistory()" style="font-size:12px;color:#007AFF;font-weight:500;cursor:pointer;">查看全部</div>' +
        '</div>' +
        '<div style="padding:0 16px 4px;">' +
          '<div style="display:flex;align-items:flex-start;gap:12px;padding:10px 0;border-bottom:0.5px solid #F2F2F7;">' +
            '<div style="width:32px;height:32px;border-radius:50%;background:rgba(52,199,89,0.12);display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;">' +
              '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34C759" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' +
            '</div>' +
            '<div style="flex:1;min-width:0;">' +
              '<div style="font-size:14px;color:#1D1D1F;font-weight:500;line-height:1.4;">李阿姨已到达人民医院门诊楼</div>' +
              '<div style="font-size:11px;color:#8E8E93;margin-top:3px;">10分钟前 · 母亲</div>' +
            '</div>' +
          '</div>' +
          '<div style="display:flex;align-items:flex-start;gap:12px;padding:10px 0;border-bottom:0.5px solid #F2F2F7;">' +
            '<div style="width:32px;height:32px;border-radius:50%;background:rgba(0,122,255,0.12);display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;">' +
              '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#007AFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>' +
            '</div>' +
            '<div style="flex:1;min-width:0;">' +
              '<div style="font-size:14px;color:#1D1D1F;font-weight:500;line-height:1.4;">张大爷从万达广场出发回家</div>' +
              '<div style="font-size:11px;color:#8E8E93;margin-top:3px;">25分钟前 · 父亲</div>' +
            '</div>' +
          '</div>' +
          '<div style="display:flex;align-items:flex-start;gap:12px;padding:10px 0;">' +
            '<div style="width:32px;height:32px;border-radius:50%;background:rgba(255,149,0,0.12);display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;">' +
              '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF9500" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>' +
            '</div>' +
            '<div style="flex:1;min-width:0;">' +
              '<div style="font-size:14px;color:#1D1D1F;font-weight:500;line-height:1.4;">张大爷接近安全围栏边界</div>' +
              '<div style="font-size:11px;color:#8E8E93;margin-top:3px;">1小时前 · 父亲</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      // 快捷功能入口
      '<div style="margin:12px 16px 20px;display:grid;grid-template-columns:1fr 1fr;gap:10px;">' +
        '<div onclick="openWardList()" style="background:#FFFFFF;border-radius:14px;padding:14px;border:0.5px solid #E5E5EA;box-shadow:0 1px 3px rgba(0,0,0,0.03);cursor:pointer;display:flex;align-items:center;gap:12px;transition:transform 0.2s cubic-bezier(0.4,0,0.2,1);" onmousedown="this.style.transform=\'scale(0.97)\'" onmouseup="this.style.transform=\'scale(1)\'" onmouseleave="this.style.transform=\'scale(1)\'">' +
          '<div style="width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#007AFF 0%,#5856D6 100%);display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 2px 8px rgba(0,122,255,0.3);">' +
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' +
          '</div>' +
          '<div>' +
            '<div style="font-size:14px;font-weight:600;color:#1D1D1F;">被监护人士</div>' +
            '<div style="font-size:11px;color:#8E8E93;margin-top:2px;">2人</div>' +
          '</div>' +
        '</div>' +
        '<div onclick="showFenceDetail()" style="background:#FFFFFF;border-radius:14px;padding:14px;border:0.5px solid #E5E5EA;box-shadow:0 1px 3px rgba(0,0,0,0.03);cursor:pointer;display:flex;align-items:center;gap:12px;transition:transform 0.2s cubic-bezier(0.4,0,0.2,1);" onmousedown="this.style.transform=\'scale(0.97)\'" onmouseup="this.style.transform=\'scale(1)\'" onmouseleave="this.style.transform=\'scale(1)\'">' +
          '<div style="width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#34C759 0%,#30D158 100%);display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 2px 8px rgba(52,199,89,0.3);">' +
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>' +
          '</div>' +
          '<div>' +
            '<div style="font-size:14px;font-weight:600;color:#1D1D1F;">围栏管理</div>' +
            '<div style="font-size:11px;color:#8E8E93;margin-top:2px;">3个安全区域</div>' +
          '</div>' +
        '</div>' +
        '<div onclick="openAlertHistory()" style="background:#FFFFFF;border-radius:14px;padding:14px;border:0.5px solid #E5E5EA;box-shadow:0 1px 3px rgba(0,0,0,0.03);cursor:pointer;display:flex;align-items:center;gap:12px;transition:transform 0.2s cubic-bezier(0.4,0,0.2,1);" onmousedown="this.style.transform=\'scale(0.97)\'" onmouseup="this.style.transform=\'scale(1)\'" onmouseleave="this.style.transform=\'scale(1)\'">' +
          '<div style="width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#FF3B30 0%,#FF6B6B 100%);display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 2px 8px rgba(255,59,48,0.3);">' +
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' +
          '</div>' +
          '<div>' +
            '<div style="font-size:14px;font-weight:600;color:#1D1D1F;">预警记录</div>' +
            '<div style="font-size:11px;color:#8E8E93;margin-top:2px;">最近5条</div>' +
          '</div>' +
        '</div>' +
        '<div onclick="openGuardianSettings()" style="background:#FFFFFF;border-radius:14px;padding:14px;border:0.5px solid #E5E5EA;box-shadow:0 1px 3px rgba(0,0,0,0.03);cursor:pointer;display:flex;align-items:center;gap:12px;transition:transform 0.2s cubic-bezier(0.4,0,0.2,1);" onmousedown="this.style.transform=\'scale(0.97)\'" onmouseup="this.style.transform=\'scale(1)\'" onmouseleave="this.style.transform=\'scale(1)\'">' +
          '<div style="width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#5856D6 0%,#AF52DE 100%);display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 2px 8px rgba(88,86,214,0.3);">' +
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>' +
          '</div>' +
          '<div>' +
            '<div style="font-size:14px;font-weight:600;color:#1D1D1F;">守护设置</div>' +
            '<div style="font-size:11px;color:#8E8E93;margin-top:2px;">语音 + 推送</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    familyScreen.appendChild(dashboard);
    familyDashboardCreated = true;
  }

  function applyRoleUI() {
    var wakeScreen = document.getElementById('wakeScreen');
    var familyScreen = document.getElementById('familyScreen');
    var tabBar = document.getElementById('tabBar');
    var tabHome = document.getElementById('tabHome');

    if (userRole === 'family') {
      // 家人模式：隐藏首页Tab（唤醒页对家人无意义）
      if (tabHome) tabHome.style.display = 'none';
      // 调整TabBar布局（4个变3个）
      if (tabBar) {
        var tabItems = tabBar.querySelectorAll('.tab-item');
        tabItems.forEach(function(item) {
          if (item.id !== 'tabHome') {
            item.style.flex = '1';
          }
        });
      }
      // 家人模式不需要唤醒页相关
      if (wakeScreen) {
        var voiceContainer = wakeScreen.querySelector('.wake-voice-container');
        if (voiceContainer) voiceContainer.style.display = 'none';
        var searchBar = wakeScreen.querySelector('.wake-search-bar');
        if (searchBar) searchBar.style.marginTop = '60px';
        var hint = wakeScreen.querySelector('.wake-hint');
        if (hint) hint.style.display = 'none';
      }

      createFamilyDashboard();
      var dashboard = document.getElementById('familyDashboard');
      if (dashboard) dashboard.style.display = 'block';
      var originalContent = familyScreen ? familyScreen.querySelector('div[style*="flex:1"][style*="overflow-y:auto"]') : null;
      if (originalContent) originalContent.style.display = 'none';

      var familyNavTitle = familyScreen ? familyScreen.querySelector('.family-nav-title') : null;
      if (familyNavTitle) familyNavTitle.textContent = '守护中心';

      // 家人模式：隐藏视障专属设置项
      var myScreen = document.getElementById('myScreen');
      if (myScreen) {
        var myItems = myScreen.querySelectorAll('.my-item');
        myItems.forEach(function(item) {
          var text = item.querySelector('.my-item-text');
          if (text) {
            var label = text.textContent.trim();
            if (label === '语音播报' || label === '震动强度' || label === '盲道检测' || label === '危险预警' || label === '长按播报位置' || label === '双击重播语音' || label === '摇一摇紧急求助' || label === '语音播报速度') {
              item.style.display = 'none';
            }
          }
        });
        // 隐藏"出行设置"和"手势操作"标题（因为内容都藏了）
        var sectionTitles = myScreen.querySelectorAll('.my-section-title');
        sectionTitles.forEach(function(title) {
          var t = title.textContent.trim();
          if (t === '出行设置' || t === '手势操作') {
            title.style.display = 'none';
          }
        });
      }

      // 家人模式：不需要导航危险标记功能
      ensureNavDangerButton();
    } else {
      // 视障模式：恢复首页Tab
      if (tabHome) tabHome.style.display = '';
      if (tabBar) {
        var tabItems2 = tabBar.querySelectorAll('.tab-item');
        tabItems2.forEach(function(item) {
          item.style.flex = '';
        });
      }
      if (wakeScreen) {
        var voiceContainer = wakeScreen.querySelector('.wake-voice-container');
        if (voiceContainer) voiceContainer.style.display = '';
        var searchBar = wakeScreen.querySelector('.wake-search-bar');
        if (searchBar) searchBar.style.marginTop = '';
        var hint = wakeScreen.querySelector('.wake-hint');
        if (hint) hint.style.display = '';
      }

      var dashboard2 = document.getElementById('familyDashboard');
      if (dashboard2) dashboard2.style.display = 'none';
      var familyScreen2 = document.getElementById('familyScreen');
      var originalContent2 = familyScreen2 ? familyScreen2.querySelector('div[style*="flex:1"][style*="overflow-y:auto"]') : null;
      if (originalContent2) originalContent2.style.display = '';

      var familyNavTitle2 = familyScreen2 ? familyScreen2.querySelector('.family-nav-title') : null;
      if (familyNavTitle2) familyNavTitle2.textContent = '家人守护';

      // 视障模式：隐藏安全围栏管理（安全围栏由家人设置，视障人士不需要管理）
      if (familyScreen2) {
        var fenceCards = familyScreen2.querySelectorAll('.family-fence-card');
        fenceCards.forEach(function(card) {
          card.style.display = 'none';
        });
      }

      // 视障模式：恢复所有设置项
      var myScreen2 = document.getElementById('myScreen');
      if (myScreen2) {
        var myItems2 = myScreen2.querySelectorAll('.my-item');
        myItems2.forEach(function(item) {
          item.style.display = '';
        });
        var sectionTitles2 = myScreen2.querySelectorAll('.my-section-title');
        sectionTitles2.forEach(function(title) {
          title.style.display = '';
        });
      }

      // 视障模式：显示导航危险提醒按钮（仅在导航途中显示）
      ensureNavDangerButton();
    }
    // 在角色切换时同步个人中心定制内容
    enhanceMyScreenForRole();
    // 注入消息中心快捷入口到 family/community 顶部
    ensureMessageQuickEntry();
    // 同步消息中心数据（角色不同，消息内容也不同）
    refreshMessageData();
  }

  // ========== 消息中心 ==========
  // 消息类型：alert(预警)/family(家人)/community(社区)/system(系统)
  var messageCenterCreated = false;
  var currentMessageFilter = 'all';
  // 模拟消息数据（视障版/家人版内容不同）
  var blindMessageData = [
    { id: 1, type: 'alert', icon: 'warning', color: '#FF3B30', title: '危险预警提醒', summary: '前方200米检测到施工围挡占据盲道', time: '5分钟前', read: false, detail: '社区用户标记：建设路与解放路路口东南角，有施工围挡占据了盲道，需要绕行。请小心通行，可使用左滑打开摄像头查看前方路况。' },
    { id: 2, type: 'family', icon: 'heart', color: '#FF2D55', title: '家人留言', summary: '妈妈：今天出门注意安全，回家吃饭', time: '20分钟前', read: false, detail: '妈妈：今天出门注意安全，记得带上盲杖，回家吃饭。如果路上遇到困难记得随时联系我。' },
    { id: 3, type: 'community', icon: 'chat', color: '#007AFF', title: '你的分享收到新点赞', summary: '李阿姨等5人赞了你的盲道推荐', time: '1小时前', read: false, detail: '你分享的"建设路到万达广场盲道推荐"动态收到5个点赞和2条评论。点击查看完整内容。' },
    { id: 4, type: 'system', icon: 'info', color: '#8E8E93', title: '系统更新', summary: '新增30种复杂路况识别能力', time: '昨天', read: true, detail: '瞳伴AI已更新，新增30种中国复杂路况识别能力，包括共享单车占道、施工围挡、临时积水等。请保持App更新以获得最佳使用体验。' },
    { id: 5, type: 'alert', icon: 'location', color: '#FF9500', title: '安全围栏提醒', summary: '您已进入安全区域"家"', time: '昨天', read: true, detail: '您于昨天18:32进入"家"安全围栏区域，家人已收到您的到家通知。' },
    { id: 6, type: 'community', icon: 'chat', color: '#34C759', title: '新评论', summary: '张大爷评论了你的路线分享', time: '2天前', read: true, detail: '张大爷：这条路线真的很顺畅，谢谢你分享！下次我也试试。' }
  ];
  var familyMessageData = [
    { id: 1, type: 'alert', icon: 'warning', color: '#FF3B30', title: '被监护人士预警', summary: '张先生偏离安全围栏范围', time: '3分钟前', read: false, detail: '您监护的张先生当前位置位于"安全围栏"范围外约150米，最近活动位置：万达广场东侧。建议您主动联系确认安全。' },
    { id: 2, type: 'alert', icon: 'sos', color: '#FF3B30', title: '紧急求助通知', summary: '张先生触发紧急求助', time: '15分钟前', read: false, detail: '张先生于15:02通过摇一摇触发紧急求助，已自动接通紧急联系人。点击查看求助详情和实时位置。' },
    { id: 3, type: 'family', icon: 'location', color: '#007AFF', title: '位置到达通知', summary: '张先生已到达"人民医院"', time: '1小时前', read: false, detail: '您监护的张先生于14:32到达"人民医院"安全围栏区域，当前位置状态正常。' },
    { id: 4, type: 'alert', icon: 'warning', color: '#FF9500', title: '出行异常提醒', summary: '张先生导航途中停留在原地5分钟', time: '2小时前', read: false, detail: '张先生在导航途中于13:25开始停留在原地超过5分钟，可能需要帮助。建议主动联系确认情况。' },
    { id: 5, type: 'community', icon: 'heart', color: '#FF2D55', title: '社区互动', summary: '你的攻略分享收到12个赞', time: '昨天', read: true, detail: '你分享的"家人守护使用心得"收到12个赞和3条评论。' },
    { id: 6, type: 'system', icon: 'info', color: '#8E8E93', title: '围栏设置提醒', summary: '建议为张先生设置医院围栏', time: '昨天', read: true, detail: '系统检测到张先生常去人民医院，建议添加"人民医院"为安全围栏，便于您及时掌握其到达/离开情况。' }
  ];

  function getMessageData() {
    return userRole === 'family' ? familyMessageData : blindMessageData;
  }

  function getUnreadMessageCount() {
    return getMessageData().filter(function(m){return !m.read;}).length;
  }

  // 消息中心快捷入口（注入到 familyScreen / communityScreen 顶部导航栏）
  function ensureMessageQuickEntry() {
    // familyScreen 顶部右上角
    var familyNavBar = document.querySelector('#familyScreen .family-nav-bar');
    if (familyNavBar && !document.getElementById('familyMsgEntry')) {
      var btn1 = document.createElement('div');
      btn1.id = 'familyMsgEntry';
      btn1.setAttribute('role', 'button');
      btn1.setAttribute('tabindex', '0');
      btn1.setAttribute('aria-label', '消息中心');
      btn1.style.cssText = 'position:absolute;right:16px;top:50%;transform:translateY(-50%);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#007AFF;cursor:pointer;background:rgba(0,122,255,0.08);';
      btn1.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>' +
        '<span id="familyMsgBadge" style="position:absolute;top:2px;right:2px;min-width:16px;height:16px;background:#FF3B30;border-radius:8px;border:1.5px solid #fff;font-size:10px;color:#fff;font-weight:600;display:none;align-items:center;justify-content:center;padding:0 4px;"></span>';
      btn1.onclick = function() { openMessageCenter(); };
      btn1.onkeydown = function(e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openMessageCenter(); } };
      // 确保 nav-bar 是 relative
      if (getComputedStyle(familyNavBar).position === 'static') familyNavBar.style.position = 'relative';
      familyNavBar.appendChild(btn1);
    }
    // communityScreen 顶部右上角（发帖按钮左边）
    var communityNavBar = document.querySelector('#communityScreen .community-nav-bar');
    if (communityNavBar && !document.getElementById('communityMsgEntry')) {
      var btn2 = document.createElement('div');
      btn2.id = 'communityMsgEntry';
      btn2.setAttribute('role', 'button');
      btn2.setAttribute('tabindex', '0');
      btn2.setAttribute('aria-label', '消息中心');
      btn2.style.cssText = 'position:absolute;right:72px;top:50%;transform:translateY(-50%);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#007AFF;cursor:pointer;background:rgba(0,122,255,0.08);';
      btn2.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>' +
        '<span id="communityMsgBadge" style="position:absolute;top:2px;right:2px;min-width:16px;height:16px;background:#FF3B30;border-radius:8px;border:1.5px solid #fff;font-size:10px;color:#fff;font-weight:600;display:none;align-items:center;justify-content:center;padding:0 4px;"></span>';
      btn2.onclick = function() { openMessageCenter(); };
      btn2.onkeydown = function(e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openMessageCenter(); } };
      if (getComputedStyle(communityNavBar).position === 'static') communityNavBar.style.position = 'relative';
      communityNavBar.appendChild(btn2);
    }
  }

  function updateMessageQuickEntryBadge() {
    var count = getUnreadMessageCount();
    var display = count > 0 ? 'flex' : 'none';
    var text = count > 99 ? '99+' : String(count);
    var b1 = document.getElementById('familyMsgBadge');
    if (b1) { b1.textContent = text; b1.style.display = display; }
    var b2 = document.getElementById('communityMsgBadge');
    if (b2) { b2.textContent = text; b2.style.display = display; }
    // accountScreen 上的红点
    var b3 = document.getElementById('accountMsgBadge');
    if (b3) { b3.style.display = display; }
  }

  function refreshMessageData() {
    // 角色切换后刷新红点
    var badge = document.getElementById('myMessageBadge');
    if (badge) {
      var count = getUnreadMessageCount();
      if (count > 0) {
        badge.textContent = count > 99 ? '99+' : count;
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }
    }
    // 同步顶部导航栏快捷入口红点
    updateMessageQuickEntryBadge();
    // 若消息中心已展开，刷新列表
    var listEl = document.getElementById('messageList');
    if (listEl && document.getElementById('messageScreen') && document.getElementById('messageScreen').classList.contains('active')) {
      renderMessageList(currentMessageFilter);
    }
  }

  function ensureMessageCenter() {
    if (messageCenterCreated) return;
    var msgScreen = document.createElement('div');
    msgScreen.id = 'messageScreen';
    msgScreen.className = 'screen';
    msgScreen.setAttribute('role', 'main');
    msgScreen.setAttribute('aria-label', '消息中心');
    msgScreen.style.cssText = 'background:#F2F2F7;padding-top:47px;display:none;flex-direction:column;overflow:hidden;';
    msgScreen.innerHTML =
      '<div class="community-nav-bar" style="position:relative;background:rgba(255,255,255,0.92);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);padding:10px 20px;border-bottom:0.5px solid rgba(0,0,0,0.06);display:flex;align-items:center;justify-content:center;">' +
        '<div onclick="closeMessageCenter()" role="button" tabindex="0" aria-label="返回" style="position:absolute;left:16px;top:50%;transform:translateY(-50%);width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#007AFF;cursor:pointer;">' +
          '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>' +
        '</div>' +
        '<span style="font-size:17px;font-weight:600;color:#1D1D1F;">消息中心</span>' +
        '<div onclick="markAllMessagesRead()" role="button" tabindex="0" aria-label="全部已读" style="position:absolute;right:16px;top:50%;transform:translateY(-50%);font-size:13px;color:#007AFF;cursor:pointer;">全部已读</div>' +
      '</div>' +
      '<div class="community-tabs" style="background:rgba(255,255,255,0.92);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:0.5px solid rgba(0,0,0,0.06);padding:0 8px;display:flex;">' +
        '<div class="msg-tab active" data-filter="all" onclick="switchMessageFilter(\'all\',this)" style="flex:1;padding:12px 6px;text-align:center;font-size:13px;color:#007AFF;border-bottom:2px solid #007AFF;font-weight:600;cursor:pointer;">全部</div>' +
        '<div class="msg-tab" data-filter="alert" onclick="switchMessageFilter(\'alert\',this)" style="flex:1;padding:12px 6px;text-align:center;font-size:13px;color:#8E8E93;border-bottom:2px solid transparent;font-weight:500;cursor:pointer;">预警</div>' +
        '<div class="msg-tab" data-filter="family" onclick="switchMessageFilter(\'family\',this)" style="flex:1;padding:12px 6px;text-align:center;font-size:13px;color:#8E8E93;border-bottom:2px solid transparent;font-weight:500;cursor:pointer;">家人</div>' +
        '<div class="msg-tab" data-filter="community" onclick="switchMessageFilter(\'community\',this)" style="flex:1;padding:12px 6px;text-align:center;font-size:13px;color:#8E8E93;border-bottom:2px solid transparent;font-weight:500;cursor:pointer;">社区</div>' +
        '<div class="msg-tab" data-filter="system" onclick="switchMessageFilter(\'system\',this)" style="flex:1;padding:12px 6px;text-align:center;font-size:13px;color:#8E8E93;border-bottom:2px solid transparent;font-weight:500;cursor:pointer;">系统</div>' +
      '</div>' +
      '<div id="messageList" style="flex:1;overflow-y:auto;padding:12px;padding-bottom:90px;"></div>';
    var phoneScreen = document.querySelector('.phone-screen') || document.body;
    phoneScreen.appendChild(msgScreen);
    messageCenterCreated = true;
    renderMessageList('all');
  }

  var messageIconSvg = {
    warning: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    heart: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
    chat: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
    location: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    sos: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v5"/><circle cx="12" cy="16" r="0.5" fill="currentColor"/></svg>'
  };

  function renderMessageList(filter) {
    currentMessageFilter = filter || 'all';
    var listEl = document.getElementById('messageList');
    if (!listEl) return;
    var data = getMessageData();
    var filtered = currentMessageFilter === 'all' ? data : data.filter(function(m){return m.type === currentMessageFilter;});
    var html = '';
    if (filtered.length === 0) {
      html = '<div style="text-align:center;padding:60px 20px;color:#8E8E93;font-size:14px;"><div style="margin-bottom:12px;opacity:0.4;"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin:0 auto;display:block;"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div>暂无消息</div>';
    } else {
      filtered.forEach(function(m) {
        var unreadStyle = m.read ? '' : 'border-left:3px solid #007AFF;background:#FAFCFF;';
        html += '<div onclick="openMessageDetail(' + m.id + ')" role="button" tabindex="0" aria-label="' + m.title + '，' + m.summary + '" style="background:#FFFFFF;border-radius:14px;padding:14px;margin-bottom:8px;border:0.5px solid #E5E5EA;box-shadow:0 1px 2px rgba(0,0,0,0.03);cursor:pointer;display:flex;gap:12px;align-items:flex-start;transition:transform 0.15s;' + unreadStyle + '" onmousedown="this.style.transform=\'scale(0.98)\'" onmouseup="this.style.transform=\'scale(1)\'" onmouseleave="this.style.transform=\'scale(1)\'">' +
          '<div style="width:36px;height:36px;border-radius:10px;background:' + m.color + '15;color:' + m.color + ';display:flex;align-items:center;justify-content:center;flex-shrink:0;">' + (messageIconSvg[m.icon] || messageIconSvg.info) + '</div>' +
          '<div style="flex:1;min-width:0;">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">' +
              '<span style="font-size:14px;font-weight:' + (m.read ? '500' : '600') + ';color:#1D1D1F;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + m.title + '</span>' +
              (!m.read ? '<span style="width:8px;height:8px;border-radius:50%;background:#FF3B30;flex-shrink:0;margin-left:8px;"></span>' : '') +
            '</div>' +
            '<div style="font-size:13px;color:#8E8E93;margin-bottom:4px;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">' + m.summary + '</div>' +
            '<div style="font-size:11px;color:#C7C7CC;">' + m.time + '</div>' +
          '</div>' +
        '</div>';
      });
    }
    listEl.innerHTML = html;
  }

  function switchMessageFilter(filter, el) {
    document.querySelectorAll('.msg-tab').forEach(function(t){
      t.classList.remove('active');
      t.style.color = '#8E8E93';
      t.style.fontWeight = '500';
      t.style.borderBottomColor = 'transparent';
    });
    el.classList.add('active');
    el.style.color = '#007AFF';
    el.style.fontWeight = '600';
    el.style.borderBottomColor = '#007AFF';
    renderMessageList(filter);
    triggerHaptic('light');
  }

  function openMessageCenter() {
    ensureMessageCenter();
    showScreen('message');
    renderMessageList('all');
    var title = userRole === 'family' ? '消息中心 - 家人守护' : '消息中心';
    speak('已进入消息中心', 'normal');
    triggerHaptic('light');
    // 重置tab状态
    document.querySelectorAll('.msg-tab').forEach(function(t){
      t.classList.remove('active');
      t.style.color = '#8E8E93';
      t.style.fontWeight = '500';
      t.style.borderBottomColor = 'transparent';
    });
    var allTab = document.querySelector('.msg-tab[data-filter="all"]');
    if (allTab) {
      allTab.classList.add('active');
      allTab.style.color = '#007AFF';
      allTab.style.fontWeight = '600';
      allTab.style.borderBottomColor = '#007AFF';
    }
  }

  function closeMessageCenter() {
    // 返回我的页面
    switchTab('my');
    triggerHaptic('light');
  }

  function openMessageDetail(id) {
    var data = getMessageData();
    var msg = data.find(function(m){return m.id === id;});
    if (!msg) return;
    msg.read = true;
    refreshMessageData();
    ensureMessageDetailPage();
    // 填充内容
    var iconEl = document.getElementById('mdIcon');
    var titleEl = document.getElementById('mdTitle');
    var timeEl = document.getElementById('mdTime');
    var summaryEl = document.getElementById('mdSummary');
    var detailEl = document.getElementById('mdDetail');
    var typeEl = document.getElementById('mdType');
    if (iconEl) {
      iconEl.style.background = msg.color + '15';
      iconEl.style.color = msg.color;
      iconEl.innerHTML = messageIconSvg[msg.icon] || messageIconSvg.info;
    }
    if (titleEl) titleEl.textContent = msg.title;
    if (timeEl) timeEl.textContent = msg.time;
    if (summaryEl) summaryEl.textContent = msg.summary;
    if (detailEl) detailEl.textContent = msg.detail;
    var typeNames = { alert: '预警通知', family: '家人消息', community: '社区互动', system: '系统通知' };
    if (typeEl) typeEl.textContent = typeNames[msg.type] || '消息';
    showScreen('messageDetail');
    speak(msg.summary, 'normal');
    triggerHaptic('medium');
    renderMessageList(currentMessageFilter);
  }

  var messageDetailCreated = false;
  function ensureMessageDetailPage() {
    if (messageDetailCreated) return;
    var detail = document.createElement('div');
    detail.id = 'messageDetailScreen';
    detail.className = 'screen';
    detail.setAttribute('role', 'main');
    detail.setAttribute('aria-label', '消息详情');
    detail.style.cssText = 'background:#F2F2F7;padding-top:47px;display:none;flex-direction:column;overflow:hidden;';
    detail.innerHTML =
      '<div class="community-nav-bar" style="position:relative;background:rgba(255,255,255,0.92);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);padding:10px 20px;border-bottom:0.5px solid rgba(0,0,0,0.06);display:flex;align-items:center;justify-content:center;">' +
        '<div onclick="closeMessageDetail()" role="button" tabindex="0" aria-label="返回消息中心" style="position:absolute;left:16px;top:50%;transform:translateY(-50%);width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#007AFF;cursor:pointer;"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg></div>' +
        '<span style="font-size:17px;font-weight:600;color:#1D1D1F;">消息详情</span>' +
        '<div onclick="deleteCurrentMessage()" role="button" tabindex="0" aria-label="删除消息" style="position:absolute;right:16px;top:50%;transform:translateY(-50%);width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#FF3B30;cursor:pointer;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></div>' +
      '</div>' +
      '<div style="flex:1;overflow-y:auto;padding:16px;padding-bottom:90px;">' +
        '<div style="background:#fff;border-radius:14px;padding:20px;border:0.5px solid #E5E5EA;">' +
          '<div style="display:flex;gap:14px;align-items:flex-start;margin-bottom:14px;">' +
            '<div id="mdIcon" style="width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;"></div>' +
            '<div style="flex:1;"><div id="mdTitle" style="font-size:17px;font-weight:600;color:#1D1D1F;line-height:1.3;"></div><div id="mdTime" style="font-size:12px;color:#8E8E93;margin-top:5px;"></div></div>' +
          '</div>' +
          '<div id="mdType" style="display:inline-block;font-size:11px;color:#fff;background:#007AFF;padding:3px 10px;border-radius:10px;margin-bottom:12px;"></div>' +
          '<div id="mdSummary" style="font-size:15px;color:#1D1D1F;line-height:1.6;font-weight:500;margin-bottom:14px;padding-bottom:14px;border-bottom:0.5px solid #F2F2F7;"></div>' +
          '<div style="font-size:13px;color:#8E8E93;margin-bottom:6px;">详细内容</div>' +
          '<div id="mdDetail" style="font-size:14px;color:#3C3C43;line-height:1.7;"></div>' +
        '</div>' +
        '<div style="background:#fff;border-radius:14px;padding:16px;margin-top:10px;border:0.5px solid #E5E5EA;display:flex;gap:10px;">' +
          '<button onclick="closeMessageDetail()" style="flex:1;background:#F2F2F7;border:none;padding:12px;border-radius:10px;font-size:13px;color:#1D1D1F;cursor:pointer;font-weight:500;">返回列表</button>' +
          '<button onclick="deleteCurrentMessage()" style="flex:1;background:#FF3B30;border:none;padding:12px;border-radius:10px;font-size:13px;color:#fff;cursor:pointer;font-weight:500;">删除消息</button>' +
        '</div>' +
      '</div>';
    var phoneScreen = document.querySelector('.phone-screen') || document.body;
    phoneScreen.appendChild(detail);
    messageDetailCreated = true;
  }

  function closeMessageDetail() {
    showScreen('message');
    triggerHaptic('light');
  }

  function deleteCurrentMessage() {
    showFeedback('消息已删除', 'success');
    speak('消息已删除', 'normal');
    triggerHaptic('light');
    closeMessageDetail();
  }

  function markAllMessagesRead() {
    var data = getMessageData();
    data.forEach(function(m){m.read = true;});
    renderMessageList(currentMessageFilter);
    refreshMessageData();
    showFeedback('已全部标为已读', 'success');
    speak('已全部标为已读', 'normal');
    triggerHaptic('light');
  }

  // ========== 个人中心差异化内容 ==========
  // 视障版/家人版 myScreen 顶部插入"消息中心"快捷入口
  // 家人版追加专属 section：被监护人士 / 围栏管理快捷 / 守护设置
  function enhanceMyScreenForRole() {
    var myScreen = document.getElementById('myScreen');
    if (!myScreen) return;
    var content = myScreen.querySelector('.my-content');
    if (!content) return;

    // 移除已注入的快捷入口（如果存在），便于切换角色时重建
    var oldQuick = document.getElementById('myQuickAccessSection');
    if (oldQuick) oldQuick.parentNode.removeChild(oldQuick);
    var oldFamily = document.getElementById('myFamilySection');
    if (oldFamily) oldFamily.parentNode.removeChild(oldFamily);

    // 在第一个 my-section 之前插入"消息中心"快捷入口
    var firstSection = content.querySelector('.my-section');
    var quickHtml = '<div class="my-section" id="myQuickAccessSection" style="background:#FFFFFF;margin:8px 12px;border-radius:12px;overflow:hidden;border:0.5px solid #E5E5EA;">' +
      '<div class="my-section-title">快捷入口</div>' +
      '<div class="my-item" onclick="openMessageCenter()" role="button" tabindex="0" aria-label="消息中心，点击查看通知消息">' +
        '<span class="my-item-icon" style="display:inline-flex;align-items:center;justify-content:center;width:22px;color:#FF3B30;">' +
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>' +
        '</span>' +
        '<span class="my-item-text">消息中心</span>' +
        '<span id="myMessageBadge" style="background:#FF3B30;color:#fff;font-size:11px;font-weight:600;padding:2px 7px;border-radius:10px;margin-right:6px;min-width:18px;text-align:center;display:none;"></span>' +
        '<span class="my-item-arrow">›</span>' +
      '</div>' +
      '<div class="my-item" onclick="goToFamilyTab()" role="button" tabindex="0" aria-label="' + (userRole === 'family' ? '守护中心' : '家人守护') + '">' +
        '<span class="my-item-icon" style="display:inline-flex;align-items:center;justify-content:center;width:22px;color:#FF2D55;">' +
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>' +
        '</span>' +
        '<span class="my-item-text">' + (userRole === 'family' ? '守护中心' : '家人守护') + '</span>' +
        '<span class="my-item-arrow">›</span>' +
      '</div>' +
      '<div class="my-item" onclick="switchTab(\'community\')" role="button" tabindex="0" aria-label="社区">' +
        '<span class="my-item-icon" style="display:inline-flex;align-items:center;justify-content:center;width:22px;color:#007AFF;">' +
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' +
        '</span>' +
        '<span class="my-item-text">社区</span>' +
        '<span class="my-item-arrow">›</span>' +
      '</div>' +
    '</div>';
    var quickNode = document.createElement('div');
    quickNode.innerHTML = quickHtml;
    var quickSection = quickNode.firstChild;
    if (firstSection) {
      content.insertBefore(quickSection, firstSection);
    } else {
      content.appendChild(quickSection);
    }

    // 家人版追加家人专属 section
    if (userRole === 'family') {
      var familyHtml = '<div class="my-section" id="myFamilySection" style="background:#FFFFFF;margin:8px 12px;border-radius:12px;overflow:hidden;border:0.5px solid #E5E5EA;">' +
        '<div class="my-section-title">家人守护</div>' +
        '<div class="my-item" onclick="openWardList()" role="button" tabindex="0" aria-label="被监护人士，共2人">' +
          '<span class="my-item-icon" style="display:inline-flex;align-items:center;justify-content:center;width:22px;color:#007AFF;">' +
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' +
          '</span>' +
          '<span class="my-item-text">被监护人士</span>' +
          '<span style="font-size:13px;color:#8E8E93;margin-right:6px;">2人</span>' +
          '<span class="my-item-arrow">›</span>' +
        '</div>' +
        '<div class="my-item" onclick="openFenceManagement()" role="button" tabindex="0" aria-label="安全围栏管理">' +
          '<span class="my-item-icon" style="display:inline-flex;align-items:center;justify-content:center;width:22px;color:#FF9500;">' +
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>' +
          '</span>' +
          '<span class="my-item-text">安全围栏</span>' +
          '<span style="font-size:13px;color:#8E8E93;margin-right:6px;">3个区域</span>' +
          '<span class="my-item-arrow">›</span>' +
        '</div>' +
        '<div class="my-item" onclick="openAlertHistory()" role="button" tabindex="0" aria-label="预警接收记录">' +
          '<span class="my-item-icon" style="display:inline-flex;align-items:center;justify-content:center;width:22px;color:#FF3B30;">' +
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' +
          '</span>' +
          '<span class="my-item-text">预警记录</span>' +
          '<span style="font-size:13px;color:#8E8E93;margin-right:6px;">最近5条</span>' +
          '<span class="my-item-arrow">›</span>' +
        '</div>' +
        '<div class="my-item" onclick="openGuardianSettings()" role="button" tabindex="0" aria-label="守护设置">' +
          '<span class="my-item-icon" style="display:inline-flex;align-items:center;justify-content:center;width:22px;color:#5856D6;">' +
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>' +
          '</span>' +
          '<span class="my-item-text">守护设置</span>' +
          '<span class="my-item-arrow">›</span>' +
        '</div>' +
      '</div>';
      var famNode = document.createElement('div');
      famNode.innerHTML = familyHtml;
      var famSection = famNode.firstChild;
      // 插入到快捷入口之后
      var quickSec = document.getElementById('myQuickAccessSection');
      if (quickSec && quickSec.nextSibling) {
        content.insertBefore(famSection, quickSec.nextSibling);
      } else {
        content.appendChild(famSection);
      }
    }

    // 刷新红点
    refreshMessageData();
    // 绑定 HTML 中静态 my-item 的点击事件（常用地址/版本信息/使用帮助）
    bindStaticMyItems();
  }

  // 为静态 HTML 中的 my-item 绑定 onclick（因为 HTML 无法直接修改）
  function bindStaticMyItems() {
    var myScreen = document.getElementById('myScreen');
    if (!myScreen) return;
    var items = myScreen.querySelectorAll('.my-item');
    items.forEach(function(item) {
      // 给所有 my-item 补全 aria-label（如果缺失）
      if (!item.getAttribute('aria-label')) {
        var textEl0 = item.querySelector('.my-item-text');
        if (textEl0) {
          var lbl = textEl0.textContent.trim();
          // 检查附加状态文本（如震动强度"标准"）
          var spans = item.querySelectorAll('span');
          var extra = '';
          for (var i = 0; i < spans.length; i++) {
            var t = spans[i].textContent.trim();
            if (t && t !== lbl && t !== '›' && t.length < 10 && /[\u4e00-\u9fa5a-zA-Z0-9]/.test(t)) {
              extra = '，当前' + t;
              break;
            }
          }
          item.setAttribute('aria-label', lbl + extra);
        }
      }
      // 已有 onclick 的跳过事件绑定
      if (item.getAttribute('onclick')) return;
      // 已绑定过标记的跳过
      if (item.getAttribute('data-static-bound') === '1') return;
      var textEl = item.querySelector('.my-item-text');
      if (!textEl) return;
      var label = textEl.textContent.trim();
      item.setAttribute('data-static-bound', '1');
      item.setAttribute('role', 'button');
      item.setAttribute('tabindex', '0');
      if (label === '常用地址') {
        item.setAttribute('aria-label', '常用地址，点击管理');
        item.addEventListener('click', function(e) {
          // 避免点到内部 switch 时触发
          if (e.target.closest('.switch')) return;
          openCommonAddresses();
        });
      } else if (label === '版本信息') {
        item.setAttribute('aria-label', '版本信息，点击查看');
        item.addEventListener('click', function(e) {
          if (e.target.closest('.switch')) return;
          showFeedback('瞳伴 v1.0.0\n免费无障碍出行助手', 'info', 4000);
          speak('瞳伴 v1.0.0');
        });
      } else if (label === '使用帮助') {
        item.setAttribute('aria-label', '使用帮助，点击查看');
        item.addEventListener('click', function(e) {
          if (e.target.closest('.switch')) return;
          openHelpFeedback();
        });
      } else {
        // 默认给可点击的 my-item 绑定提示
        item.addEventListener('click', function(e) {
          if (e.target.closest('.switch')) return;
          // 已绑定具体逻辑的不处理
        });
      }
    });
  }

  // 常用地址页面
  var commonAddressesCreated = false;
  function openCommonAddresses() {
    ensureCommonAddressesPage();
    showScreen('commonAddresses');
    speak('已进入常用地址管理页面', 'normal');
    triggerHaptic('light');
  }

  function ensureCommonAddressesPage() {
    if (commonAddressesCreated) return;
    var page = document.createElement('div');
    page.id = 'commonAddressesScreen';
    page.className = 'screen';
    page.setAttribute('role', 'main');
    page.setAttribute('aria-label', '常用地址管理');
    page.style.cssText = 'background:#F2F2F7;padding-top:47px;display:none;flex-direction:column;overflow:hidden;';
    var addresses = [
      { name: '家', address: '朝阳区建国路93号', tag: '常用', color: '#34C759' },
      { name: '人民医院', address: '北京同仁医院', tag: '医院', color: '#FF3B30' },
      { name: '万达广场', address: '朝阳大悦城', tag: '商场', color: '#FF9500' },
      { name: '地铁站', address: '地铁1号线大望路站', tag: '交通', color: '#007AFF' }
    ];
    var listHtml = addresses.map(function(a, idx) {
      return '<div style="background:#fff;border-radius:14px;padding:16px;margin-bottom:10px;border:0.5px solid #E5E5EA;display:flex;align-items:center;gap:12px;cursor:pointer;" onclick="showFeedback(\'导航到' + a.name + '\',\'info\')" onmousedown="this.style.transform=\'scale(0.98)\'" onmouseup="this.style.transform=\'scale(1)\'" onmouseleave="this.style.transform=\'scale(1)\'">' +
        '<div style="width:40px;height:40px;border-radius:10px;background:' + a.color + '15;color:' + a.color + ';display:flex;align-items:center;justify-content:center;flex-shrink:0;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z"/><circle cx="12" cy="10" r="2.5"/></svg></div>' +
        '<div style="flex:1;"><div style="font-size:15px;font-weight:600;color:#1D1D1F;">' + a.name + '</div><div style="font-size:12px;color:#8E8E93;margin-top:2px;">' + a.address + '</div></div>' +
        '<span style="font-size:11px;padding:4px 10px;border-radius:10px;background:' + a.color + '15;color:' + a.color + ';">' + a.tag + '</span>' +
      '</div>';
    }).join('');
    page.innerHTML =
      '<div class="community-nav-bar" style="position:relative;background:rgba(255,255,255,0.92);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);padding:10px 20px;border-bottom:0.5px solid rgba(0,0,0,0.06);display:flex;align-items:center;justify-content:center;">' +
        '<div onclick="closeCommonAddresses()" role="button" tabindex="0" aria-label="返回" style="position:absolute;left:16px;top:50%;transform:translateY(-50%);width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#007AFF;cursor:pointer;"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg></div>' +
        '<span style="font-size:17px;font-weight:600;color:#1D1D1F;">常用地址</span>' +
        '<div onclick="addNewCommonAddress()" role="button" tabindex="0" aria-label="添加地址" style="position:absolute;right:16px;top:50%;transform:translateY(-50%);width:32px;height:32px;border-radius:50%;background:#007AFF;color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></div>' +
      '</div>' +
      '<div style="flex:1;overflow-y:auto;padding:12px 16px 30px;">' + listHtml +
        '<div style="margin-top:20px;padding:14px;background:#fff;border-radius:14px;border:0.5px solid #E5E5EA;">' +
          '<div style="font-size:14px;font-weight:600;color:#1D1D1F;margin-bottom:8px;">提示</div>' +
          '<div style="font-size:13px;color:#8E8E93;line-height:1.5;">点击地址可直接发起导航。</div>' +
        '</div>' +
      '</div>';
    var wakeScreen = document.getElementById('wakeScreen');
    if (wakeScreen) wakeScreen.parentNode.insertBefore(page, wakeScreen);
    commonAddressesCreated = true;
  }

  function closeCommonAddresses() {
    showScreen('my');
    triggerHaptic('light');
  }

  function addNewCommonAddress() {
    showFeedback('请在地图上选择位置添加地址', 'info');
    speak('请选择位置添加地址');
  }

  function goToFamilyTab() {
    switchTab('family');
    triggerHaptic('light');
  }

  function openFenceManagement() {
    ensureFenceManagementPage();
    showScreen('fenceManagement');
    speak('已进入安全围栏管理页面', 'normal');
    triggerHaptic('light');
  }

  var fenceMgmtCreated = false;
  function ensureFenceManagementPage() {
    if (fenceMgmtCreated) return;
    var page = document.createElement('div');
    page.id = 'fenceManagementScreen';
    page.className = 'screen';
    page.setAttribute('role', 'main');
    page.setAttribute('aria-label', '安全围栏管理');
    page.style.cssText = 'background:#F2F2F7;padding-top:47px;display:none;flex-direction:column;overflow:hidden;';
    var fences = [
      { name: '家', address: '朝阳区建国路93号', radius: 500, status: '生效中', color: '#34C759', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
      { name: '医院', address: '北京同仁医院', radius: 300, status: '生效中', color: '#007AFF', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5' },
      { name: '社区公园', address: '朝阳公园南门', radius: 300, status: '已暂停', color: '#8E8E93', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' }
    ];
    var fenceListHtml = fences.map(function(f, idx) {
      return '<div style="background:#fff;border-radius:14px;padding:16px;margin-bottom:10px;border:0.5px solid #E5E5EA;display:flex;align-items:center;gap:12px;">' +
        '<div style="width:40px;height:40px;border-radius:10px;background:' + f.color + '15;color:' + f.color + ';display:flex;align-items:center;justify-content:center;flex-shrink:0;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="' + f.icon + '"/></svg></div>' +
        '<div style="flex:1;"><div style="font-size:14px;font-weight:600;color:#1D1D1F;">' + f.name + '</div><div style="font-size:12px;color:#8E8E93;margin-top:2px;">' + f.address + ' · 半径' + f.radius + '米</div></div>' +
        '<span style="font-size:11px;padding:4px 10px;border-radius:10px;background:' + f.color + '15;color:' + f.color + ';">' + f.status + '</span>' +
        '<div onclick="editFence(' + idx + ')" role="button" tabindex="0" aria-label="编辑' + f.name + '" style="width:28px;height:28px;display:flex;align-items:center;justify-content:center;color:#007AFF;cursor:pointer;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></div>' +
      '</div>';
    }).join('');
    page.innerHTML =
      '<div class="community-nav-bar" style="position:relative;background:rgba(255,255,255,0.92);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);padding:10px 20px;border-bottom:0.5px solid rgba(0,0,0,0.06);display:flex;align-items:center;justify-content:center;">' +
        '<div onclick="closeFenceManagement()" role="button" tabindex="0" aria-label="返回" style="position:absolute;left:16px;top:50%;transform:translateY(-50%);width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#007AFF;cursor:pointer;"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg></div>' +
        '<span style="font-size:17px;font-weight:600;color:#1D1D1F;">安全围栏</span>' +
        '<div onclick="addNewFence()" role="button" tabindex="0" aria-label="添加围栏" style="position:absolute;right:16px;top:50%;transform:translateY(-50%);width:32px;height:32px;border-radius:50%;background:#007AFF;color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></div>' +
      '</div>' +
      '<div style="flex:1;overflow-y:auto;padding:12px;padding-bottom:90px;">' +
        '<div style="font-size:12px;color:#8E8E93;margin:4px 4px 10px;">共 ' + fences.length + ' 个围栏 · 在监 2 个</div>' +
        fenceListHtml +
        '<div style="background:#fff;border-radius:14px;padding:16px;border:0.5px solid #E5E5EA;border:1px dashed #C7C7CC;text-align:center;margin-top:8px;cursor:pointer;" onclick="addNewFence()" role="button" tabindex="0" aria-label="添加新围栏">' +
          '<div style="color:#007AFF;font-size:14px;font-weight:600;">+ 添加新围栏</div>' +
          '<div style="color:#8E8E93;font-size:11px;margin-top:4px;">为被监护人士设置安全活动范围</div>' +
        '</div>' +
      '</div>';
    var phoneScreen = document.querySelector('.phone-screen') || document.body;
    phoneScreen.appendChild(page);
    // 添加screen到showScreen列表
    fenceMgmtCreated = true;
  }

  function closeFenceManagement() {
    switchTab('my');
    triggerHaptic('light');
  }

  function addNewFence() {
    showFeedback('请选择地图上的中心点设置围栏', 'info');
    speak('请在地图上选择围栏中心点，然后设置半径', 'normal');
    triggerHaptic('light');
  }

  function editFence(idx) {
    showFeedback('编辑围栏功能', 'info');
    speak('正在编辑围栏设置', 'normal');
    triggerHaptic('light');
  }

  function openAlertHistory() {
    openMessageCenter();
    // 自动切换到"预警"tab
    setTimeout(function(){
      var alertTab = document.querySelector('.msg-tab[data-filter="alert"]');
      if (alertTab) alertTab.click();
    }, 100);
  }

  function openGuardianSettings() {
    ensureGuardianSettingsPage();
    showScreen('guardianSettings');
    speak('守护设置：可配置预警接收方式、位置上报频率、围栏触发灵敏度等', 'normal');
    triggerHaptic('light');
  }

  var guardianSettingsCreated = false;
  function ensureGuardianSettingsPage() {
    if (guardianSettingsCreated) return;
    var page = document.createElement('div');
    page.id = 'guardianSettingsScreen';
    page.className = 'screen';
    page.setAttribute('role', 'main');
    page.setAttribute('aria-label', '守护设置');
    page.style.cssText = 'background:#F2F2F7;padding-top:47px;display:none;flex-direction:column;overflow:hidden;';
    page.innerHTML =
      '<div class="community-nav-bar" style="position:relative;background:rgba(255,255,255,0.92);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);padding:10px 20px;border-bottom:0.5px solid rgba(0,0,0,0.06);display:flex;align-items:center;justify-content:center;">' +
        '<div onclick="closeGuardianSettings()" role="button" tabindex="0" aria-label="返回" style="position:absolute;left:16px;top:50%;transform:translateY(-50%);width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#007AFF;cursor:pointer;"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg></div>' +
        '<span style="font-size:17px;font-weight:600;color:#1D1D1F;">守护设置</span>' +
      '</div>' +
      '<div style="flex:1;overflow-y:auto;padding:12px;padding-bottom:90px;">' +
        '<div style="background:#fff;border-radius:14px;overflow:hidden;margin-bottom:12px;border:0.5px solid #E5E5EA;">' +
          '<div style="padding:14px 16px;border-bottom:0.5px solid #F2F2F7;font-size:14px;font-weight:600;color:#1D1D1F;">预警接收</div>' +
          '<div onclick="toggleGuardianItem(this)" style="padding:14px 16px;border-bottom:0.5px solid #F2F2F7;display:flex;justify-content:space-between;align-items:center;cursor:pointer;"><span style="font-size:14px;color:#1D1D1F;">围栏越界预警</span><div class="switch active" role="switch" aria-checked="true"></div></div>' +
          '<div onclick="toggleGuardianItem(this)" style="padding:14px 16px;border-bottom:0.5px solid #F2F2F7;display:flex;justify-content:space-between;align-items:center;cursor:pointer;"><span style="font-size:14px;color:#1D1D1F;">紧急求助预警</span><div class="switch active" role="switch" aria-checked="true"></div></div>' +
          '<div onclick="toggleGuardianItem(this)" style="padding:14px 16px;border-bottom:0.5px solid #F2F2F7;display:flex;justify-content:space-between;align-items:center;cursor:pointer;"><span style="font-size:14px;color:#1D1D1F;">长时间无活动预警</span><div class="switch active" role="switch" aria-checked="true"></div></div>' +
          '<div onclick="toggleGuardianItem(this)" style="padding:14px 16px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;"><span style="font-size:14px;color:#1D1D1F;">低电量预警</span><div class="switch" role="switch" aria-checked="false"></div></div>' +
        '</div>' +
        '<div style="background:#fff;border-radius:14px;overflow:hidden;margin-bottom:12px;border:0.5px solid #E5E5EA;">' +
          '<div style="padding:14px 16px;border-bottom:0.5px solid #F2F2F7;font-size:14px;font-weight:600;color:#1D1D1F;">位置上报</div>' +
          '<div onclick="selectReportFrequency()" style="padding:14px 16px;border-bottom:0.5px solid #F2F2F7;display:flex;justify-content:space-between;align-items:center;cursor:pointer;"><span style="font-size:14px;color:#1D1D1F;">上报频率</span><span style="font-size:13px;color:#8E8E93;">每5分钟 ›</span></div>' +
          '<div onclick="selectReportFrequency()" style="padding:14px 16px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;"><span style="font-size:14px;color:#1D1D1F;">位置精度</span><span style="font-size:13px;color:#8E8E93;">高精度 ›</span></div>' +
        '</div>' +
        '<div style="background:#fff;border-radius:14px;overflow:hidden;margin-bottom:12px;border:0.5px solid #E5E5EA;">' +
          '<div style="padding:14px 16px;border-bottom:0.5px solid #F2F2F7;font-size:14px;font-weight:600;color:#1D1D1F;">守护灵敏度</div>' +
          '<div onclick="selectSensitivity()" style="padding:14px 16px;border-bottom:0.5px solid #F2F2F7;display:flex;justify-content:space-between;align-items:center;cursor:pointer;"><span style="font-size:14px;color:#1D1D1F;">围栏触发灵敏度</span><span style="font-size:13px;color:#8E8E93;">标准 ›</span></div>' +
          '<div onclick="selectSensitivity()" style="padding:14px 16px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;"><span style="font-size:14px;color:#1D1D1F;">停留超时阈值</span><span style="font-size:13px;color:#8E8E93;">5分钟 ›</span></div>' +
        '</div>' +
      '</div>';
    var phoneScreen = document.querySelector('.phone-screen') || document.body;
    phoneScreen.appendChild(page);
    guardianSettingsCreated = true;
  }

  function closeGuardianSettings() {
    switchTab('my');
    triggerHaptic('light');
  }

  function toggleGuardianItem(el) {
    var sw = el.querySelector('.switch');
    if (sw) {
      var isActive = sw.classList.toggle('active');
      sw.setAttribute('aria-checked', isActive ? 'true' : 'false');
      triggerHaptic('light');
    }
  }

  function selectReportFrequency() {
    showFeedback('位置上报频率设置', 'info');
    speak('可选每1分钟、5分钟、10分钟、30分钟', 'normal');
    triggerHaptic('light');
  }

  function selectSensitivity() {
    showFeedback('灵敏度设置', 'info');
    speak('可选低、标准、高、极高', 'normal');
    triggerHaptic('light');
  }

  // 被监护人士数据
  var wards = [
    { id: 'zhang', name: '张先生', avatar: '张', phone: '138****8888', relation: '父亲', status: '正常', inFence: true, guardedDays: 128, location: '万达广场', locationAddr: '朝阳区建国路93号', updateTime: '10分钟前', trips: 3, km: 2.4, minutes: 45, bgColor: 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)', shadowColor: 'rgba(102,126,234,0.25)' },
    { id: 'li', name: '李女士', avatar: '李', phone: '139****6666', relation: '母亲', status: '正常', inFence: true, guardedDays: 128, location: '家', locationAddr: '朝阳区望京西园', updateTime: '5分钟前', trips: 2, km: 1.8, minutes: 30, bgColor: 'linear-gradient(135deg,#FF9500,#FF2D55)', shadowColor: 'rgba(255,149,0,0.25)' }
  ];

  function getWardById(wardId) {
    for (var i = 0; i < wards.length; i++) {
      if (wards[i].id === wardId) return wards[i];
    }
    return wards[0];
  }

  function openWardList() {
    ensureWardListPage();
    showScreen('wardList');
    speak('被监护人士共' + wards.length + '人，点击可查看详情', 'normal');
    triggerHaptic('light');
  }

  var wardListCreated = false;
  function ensureWardListPage() {
    if (wardListCreated) return;
    var page = document.createElement('div');
    page.id = 'wardListScreen';
    page.className = 'screen';
    page.setAttribute('role', 'main');
    page.setAttribute('aria-label', '被监护人士');
    page.style.cssText = 'background:#F2F2F7;padding-top:47px;display:none;flex-direction:column;overflow:hidden;';
    var listHtml = '';
    wards.forEach(function(w) {
      listHtml +=
        '<div onclick="openWardDetail(\'' + w.id + '\')" role="button" tabindex="0" aria-label="' + w.name + '，' + w.relation + '" style="background:#fff;border-radius:16px;padding:16px;margin-bottom:10px;border:0.5px solid #E5E5EA;box-shadow:0 1px 3px rgba(0,0,0,0.04);cursor:pointer;display:flex;align-items:center;gap:14px;transition:transform 0.2s cubic-bezier(0.4,0,0.2,1);" onmousedown="this.style.transform=\'scale(0.98)\'" onmouseup="this.style.transform=\'scale(1)\'" onmouseleave="this.style.transform=\'scale(1)\'">' +
          '<div style="width:52px;height:52px;border-radius:50%;background:' + w.bgColor + ';display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;color:#fff;flex-shrink:0;box-shadow:0 4px 12px ' + w.shadowColor + ';">' + w.avatar + '</div>' +
          '<div style="flex:1;min-width:0;">' +
            '<div style="font-size:16px;font-weight:600;color:#1D1D1F;">' + w.name + '<span style="font-size:12px;color:#8E8E93;font-weight:400;margin-left:8px;">' + w.relation + '</span></div>' +
            '<div style="font-size:13px;color:#8E8E93;margin-top:4px;display:flex;align-items:center;gap:6px;">' + w.phone + '</div>' +
            '<div style="font-size:12px;color:#8E8E93;margin-top:3px;">当前位置：' + w.location + ' · ' + w.updateTime + '</div>' +
          '</div>' +
          '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;">' +
            '<div style="display:flex;align-items:center;gap:4px;"><div style="width:8px;height:8px;border-radius:50%;background:#34C759;"></div><span style="font-size:11px;color:#34C759;">' + w.status + '</span></div>' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>' +
          '</div>' +
        '</div>';
    });
    page.innerHTML =
      '<div class="community-nav-bar" style="position:relative;background:rgba(255,255,255,0.92);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);padding:10px 20px;border-bottom:0.5px solid rgba(0,0,0,0.06);display:flex;align-items:center;justify-content:center;">' +
        '<div onclick="closeWardList()" role="button" tabindex="0" aria-label="返回" style="position:absolute;left:16px;top:50%;transform:translateY(-50%);width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#007AFF;cursor:pointer;"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg></div>' +
        '<span style="font-size:17px;font-weight:600;color:#1D1D1F;">被监护人士</span>' +
      '</div>' +
      '<div style="flex:1;overflow-y:auto;padding:12px;padding-bottom:90px;-webkit-overflow-scrolling:touch;">' +
        '<div style="font-size:13px;color:#8E8E93;margin:4px 4px 10px;">共 ' + wards.length + ' 位被监护人士</div>' +
        listHtml +
      '</div>';
    var phoneScreen = document.querySelector('.phone-screen') || document.body;
    phoneScreen.appendChild(page);
    wardListCreated = true;
  }

  function closeWardList() {
    switchTab('my');
    triggerHaptic('light');
  }

  function openWardDetail(wardId) {
    ensureWardDetailPage();
    fillWardDetail(wardId);
    showScreen('wardDetail');
    var w = getWardById(wardId);
    speak('已进入' + w.name + '的详情', 'normal');
    triggerHaptic('light');
  }

  function showTravelHistory() {
    ensureTravelHistoryPage();
    showScreen('travelHistory');
    speak('出行历史：本月累计出行' + userInfo.totalTrips + '次', 'normal');
    triggerHaptic('light');
  }

  var travelHistoryCreated = false;
  function ensureTravelHistoryPage() {
    if (travelHistoryCreated) return;
    var page = document.createElement('div');
    page.id = 'travelHistoryScreen';
    page.className = 'screen';
    page.setAttribute('role', 'main');
    page.setAttribute('aria-label', '出行历史');
    page.style.cssText = 'background:#F2F2F7;padding-top:47px;display:none;flex-direction:column;overflow:hidden;';
    page.innerHTML =
      '<div class="community-nav-bar" style="position:relative;background:rgba(255,255,255,0.92);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);padding:10px 20px;border-bottom:0.5px solid rgba(0,0,0,0.06);display:flex;align-items:center;justify-content:center;">' +
        '<div onclick="closeTravelHistory()" role="button" tabindex="0" aria-label="返回" style="position:absolute;left:16px;top:50%;transform:translateY(-50%);width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#007AFF;cursor:pointer;"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg></div>' +
        '<span style="font-size:17px;font-weight:600;color:#1D1D1F;">出行历史</span>' +
      '</div>' +
      '<div style="flex:1;overflow-y:auto;padding:12px;padding-bottom:90px;">' +
        '<div style="background:linear-gradient(135deg,#007AFF,#5AC8FA);border-radius:18px;padding:20px;color:#fff;margin-bottom:12px;box-shadow:0 8px 24px rgba(0,122,255,0.25);">' +
          '<div style="font-size:13px;opacity:0.9;margin-bottom:8px;">本月累计出行</div>' +
          '<div style="font-size:42px;font-weight:800;">' + userInfo.totalTrips + '</div>' +
          '<div style="font-size:13px;opacity:0.9;margin-top:8px;">较上月 +12%</div>' +
        '</div>' +
        '<div style="background:#fff;border-radius:16px;overflow:hidden;border:0.5px solid #E5E5EA;box-shadow:0 1px 3px rgba(0,0,0,0.04);">' +
          '<div style="padding:14px 16px;border-bottom:0.5px solid #F2F2F7;font-size:14px;font-weight:600;color:#1D1D1F;">出行记录</div>' +
          '<div style="padding:14px 16px;border-bottom:0.5px solid #F2F2F7;display:flex;align-items:center;gap:12px;"><div style="width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#007AFF,#5AC8FA);display:flex;align-items:center;justify-content:center;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></div><div style="flex:1;"><div style="font-size:15px;color:#1D1D1F;font-weight:500;">前往朝阳区人民医院</div><div style="font-size:13px;color:#8E8E93;margin-top:4px;">步行 · 2.3公里 · 35分钟</div></div><div style="font-size:12px;color:#8E8E93;">今天 09:30</div></div>' +
          '<div style="padding:14px 16px;border-bottom:0.5px solid #F2F2F7;display:flex;align-items:center;gap:12px;"><div style="width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#34C759,#30B0C7);display:flex;align-items:center;justify-content:center;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg></div><div style="flex:1;"><div style="font-size:15px;color:#1D1D1F;font-weight:500;">乘坐公交12路到购物中心</div><div style="font-size:13px;color:#8E8E93;margin-top:4px;">公交 · 5.6公里 · 45分钟</div></div><div style="font-size:12px;color:#8E8E93;">昨天 14:20</div></div>' +
          '<div style="padding:14px 16px;border-bottom:0.5px solid #F2F2F7;display:flex;align-items:center;gap:12px;"><div style="width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#FF9500,#FFCC00);display:flex;align-items:center;justify-content:center;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg></div><div style="flex:1;"><div style="font-size:15px;color:#1D1D1F;font-weight:500;">打车前往火车站</div><div style="font-size:13px;color:#8E8E93;margin-top:4px;">打车 · 8.2公里 · 20分钟</div></div><div style="font-size:12px;color:#8E8E93;">3天前</div></div>' +
          '<div style="padding:14px 16px;display:flex;align-items:center;gap:12px;"><div style="width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#AF52DE,#5856D6);display:flex;align-items:center;justify-content:center;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div><div style="flex:1;"><div style="font-size:15px;color:#1D1D1F;font-weight:500;">地铁出行到公园</div><div style="font-size:13px;color:#8E8E93;margin-top:4px;">地铁 · 12.5公里 · 30分钟</div></div><div style="font-size:12px;color:#8E8E93;">5天前</div></div>' +
        '</div>' +
      '</div>';
    var phoneScreen = document.querySelector('.phone-screen') || document.body;
    phoneScreen.appendChild(page);
    travelHistoryCreated = true;
  }

  function closeTravelHistory() {
    switchTab('my');
    triggerHaptic('light');
  }

  function showFavorites() {
    ensureFavoritesPage();
    showScreen('myFavorites');
    speak('安全守护区域，共' + userInfo.safeAreas + '个', 'normal');
    triggerHaptic('light');
  }

  var favoritesCreated = false;
  function ensureFavoritesPage() {
    if (favoritesCreated) return;
    var page = document.createElement('div');
    page.id = 'favoritesScreen';
    page.className = 'screen';
    page.setAttribute('role', 'main');
    page.setAttribute('aria-label', '安全守护');
    page.style.cssText = 'background:#F2F2F7;padding-top:47px;display:none;flex-direction:column;overflow:hidden;';
    page.innerHTML =
      '<div class="community-nav-bar" style="position:relative;background:rgba(255,255,255,0.92);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);padding:10px 20px;border-bottom:0.5px solid rgba(0,0,0,0.06);display:flex;align-items:center;justify-content:center;">' +
        '<div onclick="closeFavorites()" role="button" tabindex="0" aria-label="返回" style="position:absolute;left:16px;top:50%;transform:translateY(-50%);width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#007AFF;cursor:pointer;"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg></div>' +
        '<span style="font-size:17px;font-weight:600;color:#1D1D1F;">安全守护</span>' +
      '</div>' +
      '<div style="flex:1;overflow-y:auto;padding:12px;padding-bottom:90px;">' +
        '<div style="background:linear-gradient(135deg,#FF3B30,#FF9500);border-radius:18px;padding:20px;color:#fff;margin-bottom:12px;box-shadow:0 8px 24px rgba(255,59,48,0.25);">' +
          '<div style="font-size:13px;opacity:0.9;margin-bottom:8px;">已设置安全区域</div>' +
          '<div style="font-size:42px;font-weight:800;">' + userInfo.safeAreas + '</div>' +
          '<div style="font-size:13px;opacity:0.9;margin-top:8px;">全部正常守护中</div>' +
        '</div>' +
        '<div style="background:#fff;border-radius:16px;overflow:hidden;border:0.5px solid #E5E5EA;box-shadow:0 1px 3px rgba(0,0,0,0.04);">' +
          '<div style="padding:14px 16px;border-bottom:0.5px solid #F2F2F7;font-size:14px;font-weight:600;color:#1D1D1F;">安全区域列表</div>' +
          '<div onclick="showFenceDetail(1)" style="padding:14px 16px;border-bottom:0.5px solid #F2F2F7;display:flex;align-items:center;gap:12px;cursor:pointer;"><div style="width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#34C759,#30B0C7);display:flex;align-items:center;justify-content:center;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div><div style="flex:1;"><div style="font-size:15px;color:#1D1D1F;font-weight:500;">家</div><div style="font-size:13px;color:#8E8E93;margin-top:4px;">半径 500米</div></div><div style="width:8px;height:8px;border-radius:50%;background:#34C759;"></div></div>' +
          '<div onclick="showFenceDetail(2)" style="padding:14px 16px;border-bottom:0.5px solid #F2F2F7;display:flex;align-items:center;gap:12px;cursor:pointer;"><div style="width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#007AFF,#5AC8FA);display:flex;align-items:center;justify-content:center;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div><div style="flex:1;"><div style="font-size:15px;color:#1D1D1F;font-weight:500;">朝阳区人民医院</div><div style="font-size:13px;color:#8E8E93;margin-top:4px;">半径 300米</div></div><div style="width:8px;height:8px;border-radius:50%;background:#34C759;"></div></div>' +
          '<div onclick="showFenceDetail(3)" style="padding:14px 16px;border-bottom:0.5px solid #F2F2F7;display:flex;align-items:center;gap:12px;cursor:pointer;"><div style="width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#FF9500,#FFCC00);display:flex;align-items:center;justify-content:center;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div><div style="flex:1;"><div style="font-size:15px;color:#1D1D1F;font-weight:500;">望京SOHO</div><div style="width:8px;height:8px;border-radius:50%;background:#34C759;"></div></div><div style="font-size:13px;color:#8E8E93;">半径 400米</div></div>' +
          '<div onclick="showFenceDetail(4)" style="padding:14px 16px;display:flex;align-items:center;gap:12px;cursor:pointer;"><div style="width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#AF52DE,#5856D6);display:flex;align-items:center;justify-content:center;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div><div style="flex:1;"><div style="font-size:15px;color:#1D1D1F;font-weight:500;">望京公园</div><div style="font-size:13px;color:#8E8E93;margin-top:4px;">半径 600米</div></div><div style="width:8px;height:8px;border-radius:50%;background:#34C759;"></div></div>' +
        '</div>' +
      '</div>';
    var phoneScreen = document.querySelector('.phone-screen') || document.body;
    phoneScreen.appendChild(page);
    favoritesCreated = true;
  }

  function closeFavorites() {
    switchTab('my');
    triggerHaptic('light');
  }

  var wardDetailCreated = false;
  var currentWard = null;
  function ensureWardDetailPage() {
    if (wardDetailCreated) return;
    var detail = document.createElement('div');
    detail.id = 'wardDetailScreen';
    detail.className = 'screen';
    detail.setAttribute('role', 'main');
    detail.setAttribute('aria-label', '被监护人士详情');
    detail.style.cssText = 'background:#F2F2F7;padding-top:47px;display:none;flex-direction:column;overflow:hidden;';
    detail.innerHTML =
      '<div class="community-nav-bar" style="position:relative;background:rgba(255,255,255,0.92);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);padding:10px 20px;border-bottom:0.5px solid rgba(0,0,0,0.06);display:flex;align-items:center;justify-content:center;">' +
        '<div onclick="closeWardDetail()" role="button" tabindex="0" aria-label="返回" style="position:absolute;left:16px;top:50%;transform:translateY(-50%);width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#007AFF;cursor:pointer;">' +
          '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>' +
        '</div>' +
        '<span id="wardDetailTitle" style="font-size:17px;font-weight:600;color:#1D1D1F;">被监护人士详情</span>' +
      '</div>' +
      '<div id="wardDetailBody" style="flex:1;overflow-y:auto;padding:12px;padding-bottom:90px;-webkit-overflow-scrolling:touch;"></div>';
    var phoneScreen = document.querySelector('.phone-screen') || document.body;
    phoneScreen.appendChild(detail);
    wardDetailCreated = true;
  }

  function fillWardDetail(wardId) {
    var w = getWardById(wardId);
    currentWard = w;
    var titleEl = document.getElementById('wardDetailTitle');
    if (titleEl) titleEl.textContent = w.name + '详情';
    var body = document.getElementById('wardDetailBody');
    if (!body) return;
    var inFenceText = w.inFence ? '位于安全围栏范围内' : '已偏离安全围栏';
    var inFenceColor = w.inFence ? '#34C759' : '#FF9500';
    body.innerHTML =
      '<div style="background:' + w.bgColor + ';border-radius:18px;padding:20px;color:#fff;margin-bottom:12px;box-shadow:0 8px 24px ' + w.shadowColor + ';">' +
        '<div style="display:flex;align-items:center;gap:14px;margin-bottom:14px;">' +
          '<div style="width:60px;height:60px;border-radius:50%;background:rgba(255,255,255,0.25);display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700;border:3px solid rgba(255,255,255,0.4);">' + w.avatar + '</div>' +
          '<div><div style="font-size:20px;font-weight:700;">' + w.name + '</div><div style="font-size:13px;opacity:0.9;margin-top:3px;">' + w.relation + ' · ' + w.phone + '</div></div>' +
        '</div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
          '<span style="background:rgba(255,255,255,0.25);padding:4px 12px;border-radius:14px;font-size:11px;">在监</span>' +
          '<span style="background:rgba(52,199,89,0.3);padding:4px 12px;border-radius:14px;font-size:11px;">状态正常</span>' +
          '<span style="background:rgba(255,255,255,0.25);padding:4px 12px;border-radius:14px;font-size:11px;">已守护' + w.guardedDays + '天</span>' +
        '</div>' +
      '</div>' +
      '<div style="background:#fff;border-radius:14px;padding:16px;margin-bottom:10px;border:0.5px solid #E5E5EA;">' +
        '<div style="font-size:14px;font-weight:600;color:#1D1D1F;margin-bottom:12px;">实时位置</div>' +
        '<div style="background:#F2F2F7;border-radius:10px;padding:14px;display:flex;align-items:center;gap:10px;">' +
          '<div style="width:32px;height:32px;border-radius:8px;background:#007AFF;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z"/><circle cx="12" cy="10" r="2.5"/></svg></div>' +
          '<div><div style="font-size:13px;color:#1D1D1F;font-weight:500;">' + w.location + '</div><div style="font-size:11px;color:#8E8E93;margin-top:2px;">' + w.locationAddr + ' · ' + w.updateTime + '更新</div></div>' +
        '</div>' +
        '<div style="font-size:11px;color:' + inFenceColor + ';margin-top:10px;display:flex;align-items:center;gap:4px;"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' + inFenceText + '</div>' +
      '</div>' +
      '<div style="background:#fff;border-radius:14px;padding:16px;margin-bottom:10px;border:0.5px solid #E5E5EA;">' +
        '<div style="font-size:14px;font-weight:600;color:#1D1D1F;margin-bottom:12px;">今日活动</div>' +
        '<div style="display:flex;justify-content:space-around;text-align:center;">' +
          '<div><div style="font-size:20px;font-weight:700;color:#007AFF;">' + w.trips + '</div><div style="font-size:11px;color:#8E8E93;margin-top:3px;">出行次数</div></div>' +
          '<div><div style="font-size:20px;font-weight:700;color:#34C759;">' + w.km + '</div><div style="font-size:11px;color:#8E8E93;margin-top:3px;">总公里</div></div>' +
          '<div><div style="font-size:20px;font-weight:700;color:#FF9500;">' + w.minutes + '</div><div style="font-size:11px;color:#8E8E93;margin-top:3px;">分钟</div></div>' +
        '</div>' +
      '</div>' +
      '<div style="background:#fff;border-radius:14px;padding:16px;margin-bottom:10px;border:0.5px solid #E5E5EA;">' +
        '<div style="font-size:14px;font-weight:600;color:#1D1D1F;margin-bottom:12px;">安全围栏</div>' +
        '<div style="display:flex;flex-direction:column;gap:8px;">' +
          '<div style="background:#F2F2F7;border-radius:8px;padding:10px 12px;display:flex;justify-content:space-between;align-items:center;"><span style="font-size:13px;color:#1D1D1F;">家</span><span style="font-size:11px;color:#34C759;">● 在围栏内</span></div>' +
          '<div style="background:#F2F2F7;border-radius:8px;padding:10px 12px;display:flex;justify-content:space-between;align-items:center;"><span style="font-size:13px;color:#1D1D1F;">医院</span><span style="font-size:11px;color:#8E8E93;">● 围栏外</span></div>' +
          '<div style="background:#F2F2F7;border-radius:8px;padding:10px 12px;display:flex;justify-content:space-between;align-items:center;"><span style="font-size:13px;color:#1D1D1F;">社区公园</span><span style="font-size:11px;color:#8E8E93;">● 围栏外</span></div>' +
        '</div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">' +
        '<button onclick="callWard()" style="background:#34C759;color:#fff;border:none;padding:14px;border-radius:14px;font-size:14px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>主动联系</button>' +
        '<button onclick="navigateToWard()" style="background:#007AFF;color:#fff;border:none;padding:14px;border-radius:14px;font-size:14px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>前往位置</button>' +
      '</div>';
  }

  function closeWardDetail() {
    openWardList();
    triggerHaptic('light');
  }

  function callWard() {
    callFamily('son');
  }

  function navigateToWard() {
    var name = (currentWard && currentWard.name) || '被监护人士';
    showFeedback('正在为您规划前往' + name + '当前位置的路线', 'info');
    speak('正在为您规划前往' + name + '当前位置的路线', 'high');
    triggerHaptic('light');
  }

  // ========== 社区帖子详情 ==========
  var postDetailCreated = false;
  var currentPostDetail = null;

  function openPostDetail(postObj) {
    currentPostDetail = postObj;
    ensurePostDetailPage();
    // 填充内容
    var avatarEl = document.getElementById('pdAvatar');
    var nameEl = document.getElementById('pdName');
    var timeEl = document.getElementById('pdTime');
    var textEl = document.getElementById('pdText');
    var locEl = document.getElementById('pdLocation');
    var tagsEl = document.getElementById('pdTags');
    var likeEl = document.getElementById('pdLikeCount');
    var cmtEl = document.getElementById('pdCmtCount');
    var shareEl = document.getElementById('pdShareCount');
    if (avatarEl) {
      avatarEl.style.background = postObj.avatarColor || '#007AFF';
      avatarEl.textContent = (postObj.username || '匿名').charAt(0);
    }
    if (nameEl) nameEl.textContent = postObj.username || '匿名用户';
    if (timeEl) timeEl.textContent = postObj.time || '';
    if (textEl) textEl.textContent = postObj.text || '';
    if (locEl) locEl.textContent = postObj.location || '未分享位置';
    if (tagsEl) {
      tagsEl.innerHTML = '';
      if (postObj.tags && postObj.tags.length) {
        postObj.tags.forEach(function(tag){
          var span = document.createElement('span');
          span.className = 'community-tag' + (postObj.isDanger && tag.indexOf('危险') !== -1 ? ' danger' : '');
          span.textContent = tag;
          tagsEl.appendChild(span);
        });
      }
    }
    if (likeEl) likeEl.textContent = postObj.likes || 0;
    if (cmtEl) cmtEl.textContent = postObj.comments || 0;
    if (shareEl) shareEl.textContent = postObj.shares || 0;
    showScreen('postDetail');
    speak('查看帖子详情', 'low');
    triggerHaptic('light');
  }

  function ensurePostDetailPage() {
    if (postDetailCreated) return;
    var detail = document.createElement('div');
    detail.id = 'postDetailScreen';
    detail.className = 'screen';
    detail.setAttribute('role', 'main');
    detail.setAttribute('aria-label', '帖子详情');
    detail.style.cssText = 'background:#F2F2F7;padding-top:47px;display:none;flex-direction:column;overflow:hidden;';
    detail.innerHTML =
      '<div class="community-nav-bar" style="position:relative;background:rgba(255,255,255,0.92);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);padding:10px 20px;border-bottom:0.5px solid rgba(0,0,0,0.06);display:flex;align-items:center;justify-content:center;">' +
        '<div onclick="closePostDetail()" role="button" tabindex="0" aria-label="返回社区" style="position:absolute;left:16px;top:50%;transform:translateY(-50%);width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#007AFF;cursor:pointer;">' +
          '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>' +
        '</div>' +
        '<span style="font-size:17px;font-weight:600;color:#1D1D1F;">帖子详情</span>' +
      '</div>' +
      '<div style="flex:1;overflow-y:auto;padding:12px;padding-bottom:90px;">' +
        '<div style="background:#fff;border-radius:14px;padding:16px;border:0.5px solid #E5E5EA;">' +
          '<div style="display:flex;align-items:center;margin-bottom:12px;">' +
            '<div id="pdAvatar" style="width:44px;height:44px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:600;color:#fff;margin-right:12px;flex-shrink:0;background:#007AFF;">我</div>' +
            '<div style="flex:1;min-width:0;">' +
              '<div id="pdName" style="font-size:15px;font-weight:600;color:#1D1D1F;margin-bottom:3px;">用户名</div>' +
              '<div id="pdTime" style="font-size:11px;color:#86868B;">时间</div>' +
            '</div>' +
          '</div>' +
          '<div id="pdText" style="font-size:15px;color:#1D1D1F;line-height:1.6;margin-bottom:12px;"></div>' +
          '<div style="font-size:12px;color:#007AFF;margin-bottom:10px;display:flex;align-items:center;gap:4px;font-weight:500;">' +
            '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>' +
            '<span id="pdLocation">位置</span>' +
          '</div>' +
          '<div id="pdTags" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;"></div>' +
          '<div style="height:0.5px;background:#E5E5EA;margin:12px -16px 12px;"></div>' +
          '<div style="display:flex;gap:24px;">' +
            '<div onclick="likePostDetail()" style="font-size:13px;color:#6b7280;cursor:pointer;display:flex;align-items:center;gap:5px;font-weight:500;">' +
              '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>' +
              '<span id="pdLikeCount">0</span>' +
            '</div>' +
            '<div onclick="commentPost()" style="font-size:13px;color:#6b7280;cursor:pointer;display:flex;align-items:center;gap:5px;font-weight:500;">' +
              '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' +
              '<span id="pdCmtCount">0</span>' +
            '</div>' +
            '<div onclick="sharePost()" style="font-size:13px;color:#6b7280;cursor:pointer;display:flex;align-items:center;gap:5px;font-weight:500;">' +
              '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="7" y2="7"/><polyline points="3 11 7 7 11 11"/><path d="M21 21l-5-5"/><line x1="17" y1="17" x2="17" y2="7"/><polyline points="21 11 17 7 13 11"/></svg>' +
              '<span id="pdShareCount">0</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div style="background:#fff;border-radius:14px;padding:16px;margin-top:10px;border:0.5px solid #E5E5EA;">' +
          '<div style="font-size:14px;font-weight:600;color:#1D1D1F;margin-bottom:10px;">评论</div>' +
          '<div style="font-size:13px;color:#8E8E93;text-align:center;padding:20px 0;">暂无评论，快来发表第一条评论吧</div>' +
        '</div>' +
      '</div>';
    var phoneScreen = document.querySelector('.phone-screen') || document.body;
    phoneScreen.appendChild(detail);
    postDetailCreated = true;
  }

  function closePostDetail() {
    showScreen('community');
    switchTab('community');
    triggerHaptic('light');
  }

  function likePostDetail() {
    var el = document.getElementById('pdLikeCount');
    if (el) {
      var count = parseInt(el.textContent) || 0;
      el.textContent = count + 1;
      el.parentElement.style.color = '#FF2D55';
      el.parentElement.querySelector('svg').style.fill = '#FF2D55';
      el.parentElement.querySelector('svg').style.stroke = '#FF2D55';
    }
    speak('已点赞', 'low');
    triggerHaptic('light');
  }

  // 让社区帖子卡片可点击查看详情
  // 修改 loadCommunityFeed，给每张卡片附加点击事件
  var _origLoadCommunityFeed = loadCommunityFeed;
  loadCommunityFeed = function(tab) {
    _origLoadCommunityFeed(tab);
    // 给卡片附加点击事件
    var cards = document.querySelectorAll('#communityContent .community-card');
    var posts = communityFeedData[tab] || [];
    cards.forEach(function(card, idx) {
      if (idx < posts.length) {
        var post = posts[idx];
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', '查看 ' + (post.username || '') + ' 的帖子详情');
        card.style.cursor = 'pointer';
        // 避免点击操作按钮时也触发详情
        card.addEventListener('click', function(e) {
          if (e.target.closest('.community-action')) return;
          openPostDetail(post);
        });
        card.addEventListener('keydown', function(e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openPostDetail(post);
          }
        });
      }
    });
  };

  // Login mode: 'quick' (一键登录), 'sms' (验证码登录), 'password' (密码登录)
  var currentLoginMode = 'quick';
  var smsCooldown = 0;
  var smsTimer = null;

  function switchLoginMode(mode) {
    currentLoginMode = mode;
    var tabs = ['quick', 'sms', 'password'];
    tabs.forEach(function(t) {
      var tab = document.getElementById('loginTab_' + t);
      if (tab) {
        if (t === mode) {
          tab.style.color = '#007AFF';
          tab.style.fontWeight = '600';
          tab.querySelector('.underline').style.display = 'block';
        } else {
          tab.style.color = '#8E8E93';
          tab.style.fontWeight = '500';
          tab.querySelector('.underline').style.display = 'none';
        }
      }
    });
    // Toggle form sections
    var quickForm = document.getElementById('quickLoginForm');
    var smsForm = document.getElementById('smsLoginForm');
    var pwdForm = document.getElementById('passwordLoginForm');
    var phoneWrap = document.getElementById('phoneInputWrap');
    var mainBtn = document.getElementById('loginMainBtn');
    var regLink = document.getElementById('registerLink');
    if (mode === 'quick') {
      if (quickForm) quickForm.style.display = 'block';
      if (smsForm) smsForm.style.display = 'none';
      if (pwdForm) pwdForm.style.display = 'none';
      if (phoneWrap) phoneWrap.style.display = 'none';
      if (mainBtn) mainBtn.style.display = 'none';
      if (regLink) regLink.style.display = 'none';
    } else if (mode === 'sms') {
      if (quickForm) quickForm.style.display = 'none';
      if (smsForm) smsForm.style.display = 'block';
      if (pwdForm) pwdForm.style.display = 'none';
      if (phoneWrap) phoneWrap.style.display = 'block';
      if (mainBtn) {
        mainBtn.style.display = 'block';
        mainBtn.textContent = '登录';
        mainBtn.onclick = doSmsLogin;
      }
      if (regLink) regLink.style.display = 'block';
    } else {
      if (quickForm) quickForm.style.display = 'none';
      if (smsForm) smsForm.style.display = 'none';
      if (pwdForm) pwdForm.style.display = 'block';
      if (phoneWrap) phoneWrap.style.display = 'block';
      if (mainBtn) {
        mainBtn.style.display = 'block';
        mainBtn.textContent = '登录';
        mainBtn.onclick = doPasswordLogin;
      }
      if (regLink) regLink.style.display = 'block';
    }
  }

  function startSmsCooldown() {
    smsCooldown = 60;
    var btn = document.getElementById('getSmsBtn');
    if (!btn) return;
    btn.disabled = true;
    btn.style.background = '#E5E5EA';
    btn.style.color = '#8E8E93';
    btn.textContent = smsCooldown + '秒后重发';
    if (smsTimer) clearInterval(smsTimer);
    smsTimer = setInterval(function() {
      smsCooldown--;
      if (smsCooldown > 0) {
        btn.textContent = smsCooldown + '秒后重发';
      } else {
        clearInterval(smsTimer);
        smsTimer = null;
        btn.disabled = false;
        btn.style.background = 'rgba(0,122,255,0.1)';
        btn.style.color = '#007AFF';
        btn.textContent = '获取验证码';
      }
    }, 1000);
  }

  function doGetSmsCode() {
    var phone = document.getElementById('loginPhone').value.trim();
    if (!phone) {
      showFeedback('请输入手机号', 'error');
      speak('请输入手机号');
      return;
    }
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      showFeedback('请输入正确的手机号', 'error');
      speak('请输入正确的手机号');
      return;
    }
    showFeedback('验证码已发送', 'success');
    speak('验证码已发送到您的手机');
    startSmsCooldown();
  }

  function doQuickLogin() {
    var btn = document.getElementById('quickLoginBtn');
    if (btn) {
      btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation:spin 1s linear infinite;"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> 正在识别本机号码...';
      btn.style.pointerEvents = 'none';
      btn.style.opacity = '0.85';
    }
    showFeedback('正在识别本机号码', 'info');
    speak('正在识别本机号码');
    // Simulate carrier verification - generate a random phone number
    setTimeout(function() {
      var prefixes = ['138', '139', '158', '159', '186', '188', '135', '136', '177', '189'];
      var prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      var suffix = Math.floor(10000000 + Math.random() * 89999999).toString();
      var phone = prefix + suffix;
      // Store for demo purposes
      var phoneEl = document.getElementById('loginPhone');
      if (phoneEl) phoneEl.value = phone;
      showFeedback('识别成功，正在登录', 'success');
      if (selectedLoginRole !== 'family') {
        speak('识别成功，正在登录');
      }
      setTimeout(function() {
        completeLogin(phone);
      }, 1000);
    }, 2000);
  }

  function doSmsLogin() {
    var phone = document.getElementById('loginPhone').value.trim();
    var code = document.getElementById('smsCode').value.trim();
    if (!phone) {
      showFeedback('请输入手机号', 'error');
      speak('请输入手机号');
      return;
    }
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      showFeedback('请输入正确的手机号', 'error');
      speak('请输入正确的手机号');
      return;
    }
    if (!code) {
      showFeedback('请输入验证码', 'error');
      speak('请输入验证码');
      return;
    }
    if (code.length !== 6) {
      showFeedback('验证码为6位数字', 'error');
      speak('验证码为6位数字');
      return;
    }
    completeLogin(phone);
  }

  function doPasswordLogin() {
    var phone = document.getElementById('loginPhone').value.trim();
    var password = document.getElementById('loginPassword').value;
    if (!phone) {
      showFeedback('请输入手机号', 'error');
      speak('请输入手机号');
      return;
    }
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      showFeedback('请输入正确的手机号', 'error');
      speak('请输入正确的手机号');
      return;
    }
    if (!password) {
      showFeedback('请输入密码', 'error');
      speak('请输入密码');
      return;
    }
    if (password.length < 6) {
      showFeedback('密码长度不能少于6位', 'error');
      speak('密码长度不能少于6位');
      return;
    }
    var users = getStoredUsers();
    var user = users.find(function(u) { return u.phone === phone; });
    if (!user) {
      showFeedback('账号不存在，请先注册', 'error');
      speak('账号不存在，请先注册');
      return;
    }
    if (user.password !== password) {
      showFeedback('密码错误', 'error');
      speak('密码错误');
      return;
    }
    completeLogin(phone);
  }

  function resetRoleSensitivePages() {
    var settingsEl = document.getElementById('settingsScreen');
    if (settingsEl) settingsEl.parentNode.removeChild(settingsEl);
    settingsPageCreated = false;
  }
  function completeLogin(phone) {
    // 恢复一键登录按钮状态（防止退出后再登录按钮无响应）
    var quickBtn = document.getElementById('quickLoginBtn');
    if (quickBtn) {
      quickBtn.innerHTML = '本机号码一键登录';
      quickBtn.style.pointerEvents = '';
      quickBtn.style.opacity = '';
    }
    var users = getStoredUsers();
    var user = users.find(function(u) { return u.phone === phone; });
    // If user doesn't exist, create a temporary one for demo
    if (!user) {
      var now = new Date();
      var registerDate = now.getFullYear() + '年' + (now.getMonth() + 1) + '月';
      user = {
        name: '用户' + phone.substring(7),
        phone: phone,
        password: '',
        avatarColor: getAvatarColor(phone),
        registerDate: registerDate,
        totalTrips: 0,
        emergencyContacts: 0,
        safeAreas: 0,
        createdAt: now.getTime()
      };
      users.push(user);
      saveStoredUsers(users);
    }
    isLoggedIn = true;
    currentUser = user;
    updateUserInfoFromCurrentUser();
    setCurrentSession(phone);
    refreshMyPageUI();
    // 重置角色相关页面缓存，确保切换角色后内容正确
    resetRoleSensitivePages();
    if (selectedLoginRole !== 'family') {
      speak('登录成功，欢迎回来');
    }
    showFeedback('登录成功', 'success');
    triggerHaptic('success');
    // Save role
    userRole = selectedLoginRole;
    try { localStorage.setItem('tongban_role', userRole); } catch(e) {}
    applyRoleUI();
    setTimeout(function() {
      if (userRole === 'family') {
        showScreen('family');
        switchTab('family');
      } else {
        checkSafetyTraining();
      }
    }, 500);
  }

  function createLoginPage() {
    if (loginPageCreated) return;
    var html = '<div class="screen" id="loginScreen" style="background:#FFFFFF;display:none;flex-direction:column;overflow:hidden;">';
    // Close button
    html += '<div onclick="closeLogin()" style="position:absolute;top:55px;right:16px;width:32px;height:32px;display:flex;align-items:center;justify-content:center;color:#8E8E93;cursor:pointer;border-radius:50%;z-index:30;background:rgba(255,255,255,0.8);" role="button" tabindex="0" aria-label="关闭登录页"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></div>';
    // Brand header with gradient background
    html += '<div style="background:linear-gradient(180deg,#F0F7FF 0%,#FFFFFF 100%);padding:50px 24px 32px;text-align:center;">';
    html += '<div style="width:72px;height:72px;margin:0 auto 20px;border-radius:24px;background:linear-gradient(135deg,#007AFF 0%,#5856D6 50%,#AF52DE 100%);display:flex;align-items:center;justify-content:center;box-shadow:0 12px 32px rgba(0,122,255,0.25),0 4px 12px rgba(88,86,214,0.15);">';
    html += '<svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>';
    html += '</div>';
    html += '<div style="font-size:28px;font-weight:700;color:#1D1D1F;letter-spacing:1px;">瞳伴</div>';
    html += '<div style="font-size:15px;color:#8E8E93;margin-top:8px;font-weight:500;">视障人士 AI 出行助手</div>';
    html += '</div>';
    // Main content
    html += '<div style="flex:1;overflow-y:auto;padding:0 24px;">';
    // Role selector
    html += '<div style="margin-bottom:16px;">';
    html += '<div style="display:flex;gap:8px;">';
    html += '<div id="roleBlind" onclick="selectLoginRole(\'blind\')" style="flex:1;border:1.5px solid #007AFF;border-radius:12px;padding:10px 8px;text-align:center;cursor:pointer;background:rgba(0,122,255,0.06);transition:all 0.25s cubic-bezier(0.4,0,0.2,1);display:flex;align-items:center;justify-content:center;gap:6px;">';
    html += '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#007AFF" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>';
    html += '<div style="font-size:13px;font-weight:600;color:#007AFF;">视障人士</div>';
    html += '</div>';
    html += '<div id="roleFamily" onclick="selectLoginRole(\'family\')" style="flex:1;border:1.5px solid #E5E5EA;border-radius:12px;padding:10px 8px;text-align:center;cursor:pointer;background:#FFFFFF;transition:all 0.25s cubic-bezier(0.4,0,0.2,1);display:flex;align-items:center;justify-content:center;gap:6px;">';
    html += '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';
    html += '<div style="font-size:13px;font-weight:600;color:#8E8E93;">家人</div>';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    // Login mode tabs
    html += '<div style="display:flex;border-bottom:1px solid #E5E5EA;margin-bottom:20px;">';
    html += '<div id="loginTab_quick" onclick="switchLoginMode(\'quick\')" style="flex:1;padding:12px 0;text-align:center;color:#007AFF;font-weight:600;font-size:15px;cursor:pointer;position:relative;">';
    html += '一键登录';
    html += '<div class="underline" style="position:absolute;bottom:-1px;left:20%;right:20%;height:2px;background:#007AFF;border-radius:1px;display:block;"></div>';
    html += '</div>';
    html += '<div id="loginTab_sms" onclick="switchLoginMode(\'sms\')" style="flex:1;padding:12px 0;text-align:center;color:#8E8E93;font-weight:500;font-size:15px;cursor:pointer;position:relative;">';
    html += '验证码登录';
    html += '<div class="underline" style="position:absolute;bottom:-1px;left:20%;right:20%;height:2px;background:#007AFF;border-radius:1px;display:none;"></div>';
    html += '</div>';
    html += '<div id="loginTab_password" onclick="switchLoginMode(\'password\')" style="flex:1;padding:12px 0;text-align:center;color:#8E8E93;font-weight:500;font-size:15px;cursor:pointer;position:relative;">';
    html += '密码登录';
    html += '<div class="underline" style="position:absolute;bottom:-1px;left:20%;right:20%;height:2px;background:#007AFF;border-radius:1px;display:none;"></div>';
    html += '</div>';
    html += '</div>';
    // Phone input (for sms/password mode only)
    html += '<div id="phoneInputWrap" style="margin-bottom:16px;display:none;">';
    html += '<div style="font-size:13px;color:#8E8E93;margin-bottom:8px;font-weight:500;">手机号</div>';
    html += '<div style="display:flex;align-items:center;background:#F2F2F7;border-radius:14px;padding:0 4px;border:1px solid #E5E5EA;">';
    html += '<div style="padding:0 12px;color:#1D1D1F;font-weight:500;font-size:15px;">+86</div>';
    html += '<div style="width:1px;height:24px;background:#E5E5EA;"></div>';
    html += '<input type="tel" id="loginPhone" placeholder="请输入手机号" maxlength="11" style="flex:1;height:50px;padding:0 12px;background:transparent;border:none;font-size:16px;color:#1D1D1F;outline:none;" />';
    html += '</div>';
    html += '</div>';
    // Quick login form (default shown) - carrier one-click login, no phone input
    html += '<div id="quickLoginForm" style="display:block;margin-bottom:20px;">';
    html += '<div id="quickLoginBtn" onclick="doQuickLogin()" style="width:100%;height:56px;background:linear-gradient(135deg,#007AFF 0%,#5856D6 100%);border-radius:16px;color:#fff;font-size:17px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 6px 20px rgba(0,122,255,0.25);transition:transform 0.2s ease;">';
    html += '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>';
    html += '本机号码一键登录';
    html += '</div>';
    html += '<div style="text-align:center;font-size:12px;color:#8E8E93;margin-top:10px;display:flex;align-items:center;justify-content:center;gap:6px;">';
    html += '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>';
    html += '中国移动·中国联通·中国电信 提供认证服务';
    html += '</div>';
    html += '</div>';
    // SMS login form (hidden by default)
    html += '<div id="smsLoginForm" style="display:none;">';
    html += '<div style="margin-bottom:16px;">';
    html += '<div style="font-size:13px;color:#8E8E93;margin-bottom:8px;font-weight:500;">验证码</div>';
    html += '<div style="display:flex;gap:12px;">';
    html += '<input type="tel" id="smsCode" placeholder="请输入6位验证码" maxlength="6" style="flex:1;height:50px;padding:0 16px;background:#F2F2F7;border:1px solid #E5E5EA;border-radius:14px;font-size:16px;color:#1D1D1F;outline:none;letter-spacing:4px;text-align:center;" />';
    html += '<button id="getSmsBtn" onclick="doGetSmsCode()" style="width:110px;height:50px;background:rgba(0,122,255,0.1);border:none;border-radius:14px;color:#007AFF;font-size:14px;font-weight:600;cursor:pointer;white-space:nowrap;">获取验证码</button>';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    // Password login form (hidden by default)
    html += '<div id="passwordLoginForm" style="display:none;">';
    html += '<div style="margin-bottom:24px;">';
    html += '<div style="font-size:13px;color:#8E8E93;margin-bottom:8px;font-weight:500;">密码</div>';
    html += '<input type="password" id="loginPassword" placeholder="请输入密码" maxlength="20" style="width:100%;height:50px;padding:0 16px;background:#F2F2F7;border:1px solid #E5E5EA;border-radius:14px;font-size:16px;color:#1D1D1F;outline:none;" />';
    html += '<div onclick="openForgotPassword()" style="font-size:13px;color:#007AFF;cursor:pointer;margin-top:12px;text-align:right;">忘记密码？</div>';
    html += '</div>';
    html += '</div>';
    // Main login button (hidden in quick mode, shown in sms/password mode)
    html += '<button id="loginMainBtn" onclick="doSmsLogin()" style="width:100%;height:52px;background:linear-gradient(135deg,#007AFF 0%,#5856D6 100%);border:none;border-radius:16px;color:#fff;font-size:17px;font-weight:600;cursor:pointer;box-shadow:0 6px 20px rgba(0,122,255,0.25);margin-top:8px;display:none;">登录</button>';
    // Register link (shown only in non-quick modes)
    html += '<div id="registerLink" style="text-align:center;margin-top:20px;display:none;">';
    html += '<span style="font-size:14px;color:#8E8E93;">还没有账号？</span>';
    html += '<span onclick="goToRegister()" style="font-size:14px;color:#007AFF;font-weight:600;cursor:pointer;margin-left:4px;">立即注册</span>';
    html += '</div>';
    // Other login methods
    html += '<div style="margin-top:32px;text-align:center;">';
    html += '<div style="font-size:12px;color:#C7C7CC;margin-bottom:16px;display:flex;align-items:center;justify-content:center;gap:12px;">';
    html += '<span style="width:24px;height:0.5px;background:#E5E5EA;"></span>';
    html += '其他登录方式';
    html += '<span style="width:24px;height:0.5px;background:#E5E5EA;"></span>';
    html += '</div>';
    html += '<div style="display:flex;justify-content:center;gap:18px;">';
    // WeChat - 微信图标（保留原有准确图标）
    html += '<div onclick="thirdPartyLogin(\'wechat\')" style="width:46px;height:46px;border-radius:50%;background:#07C160;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 12px rgba(7,193,96,0.2);">';
    html += '<svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.007-.27-.018-.406-.032zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z"/></svg>';
    html += '</div>';
    // Apple - 使用Font Awesome图标
    html += '<div onclick="thirdPartyLogin(\'apple\')" style="width:46px;height:46px;border-radius:50%;background:#000000;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.2);">';
    html += '<i class="fa-brands fa-apple" style="font-size:20px;color:white;"></i>';
    html += '</div>';
    // QQ - 使用Font Awesome图标
    html += '<div onclick="thirdPartyLogin(\'qq\')" style="width:46px;height:46px;border-radius:50%;background:#12B7F5;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 12px rgba(18,183,245,0.2);">';
    html += '<i class="fa-brands fa-qq" style="font-size:20px;color:white;"></i>';
    html += '</div>';
    // Alipay - 使用Font Awesome支付宝图标
    html += '<div onclick="thirdPartyLogin(\'alipay\')" style="width:46px;height:46px;border-radius:50%;background:#1677FF;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 12px rgba(22,119,255,0.2);">';
    html += '<i class="fa-brands fa-alipay" style="font-size:20px;color:white;"></i>';
    html += '</div>';
    // Weibo - 使用Font Awesome图标
    html += '<div onclick="thirdPartyLogin(\'weibo\')" style="width:46px;height:46px;border-radius:50%;background:#E6162D;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 12px rgba(230,22,45,0.2);">';
    html += '<i class="fa-brands fa-weibo" style="font-size:20px;color:white;"></i>';
    html += '</div>';
    html += '</div>';
    html += '<div style="display:flex;justify-content:center;gap:18px;margin-top:10px;font-size:11px;color:#8E8E93;">';
    html += '<span style="width:46px;text-align:center;">微信</span>';
    html += '<span style="width:46px;text-align:center;">Apple</span>';
    html += '<span style="width:46px;text-align:center;">QQ</span>';
    html += '<span style="width:46px;text-align:center;">支付宝</span>';
    html += '<span style="width:46px;text-align:center;">微博</span>';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    // Footer agreement
    html += '<div style="padding:16px 24px 28px;text-align:center;background:#FFFFFF;">';
    html += '<div style="font-size:11px;color:#C7C7CC;line-height:1.6;">登录即表示同意 <span style="color:#007AFF;cursor:pointer;font-weight:500;" onclick="openUserAgreement()">用户协议</span> 和 <span style="color:#007AFF;cursor:pointer;font-weight:500;" onclick="openPrivacyPolicy()">隐私政策</span></div>';
    html += '</div>';
    html += '</div>';
    var temp = document.createElement('div');
    temp.innerHTML = html;
    var el = temp.firstElementChild;
    var wakeScreen = document.getElementById('wakeScreen');
    wakeScreen.parentNode.insertBefore(el, wakeScreen);
    loginPageCreated = true;
  }

  function createRegisterPage() {
    if (registerPageCreated) return;
    var html = '<div class="screen" id="registerScreen" style="background:#FFFFFF;display:none;flex-direction:column;overflow:hidden;">';
    html += '<div style="background:rgba(255,255,255,0.92);backdrop-filter:blur(20px) saturate(180%);-webkit-backdrop-filter:blur(20px) saturate(180%);padding:10px 16px;padding-top:55px;border-bottom:0.5px solid rgba(0,0,0,0.06);display:flex;align-items:center;position:relative;z-index:20;">';
    html += '<div onclick="goToLogin()" style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;color:#007AFF;cursor:pointer;border-radius:50%;" role="button" aria-label="返回"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg></div>';
    html += '<span style="flex:1;text-align:center;font-size:17px;font-weight:600;color:#1D1D1F;">注册账号</span>';
    html += '<div style="width:32px;"></div>';
    html += '</div>';
    html += '<div style="flex:1;overflow-y:auto;padding:20px 24px;">';
    html += '<div style="font-size:20px;font-weight:600;color:#1D1D1F;margin-bottom:8px;">创建新账号</div>';
    html += '<div style="font-size:14px;color:#8E8E93;margin-bottom:24px;">加入瞳伴，开启智能出行</div>';
    // Role selector
    html += '<div style="display:flex;gap:10px;margin-bottom:24px;">';
    html += '<div id="roleBlind" onclick="selectLoginRole(\'blind\')" style="flex:1;border:1.5px solid #007AFF;border-radius:12px;padding:14px 12px;text-align:center;cursor:pointer;background:rgba(0,122,255,0.06);transition:all 0.2s ease;">';
    html += '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#007AFF" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="display:block;margin:0 auto 6px;"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>';
    html += '<div style="font-size:13px;font-weight:600;color:#007AFF;">我是视障人士</div>';
    html += '</div>';
    html += '<div id="roleFamily" onclick="selectLoginRole(\'family\')" style="flex:1;border:1.5px solid #E5E5EA;border-radius:12px;padding:14px 12px;text-align:center;cursor:pointer;background:#FFFFFF;transition:all 0.2s ease;">';
    html += '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="display:block;margin:0 auto 6px;"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';
    html += '<div style="font-size:13px;font-weight:600;color:#8E8E93;">我是家人</div>';
    html += '</div>';
    html += '</div>';
    html += '<div style="margin-bottom:16px;">';
    html += '<div style="font-size:13px;color:#8E8E93;margin-bottom:8px;">昵称</div>';
    html += '<input type="text" id="registerName" placeholder="请输入昵称" maxlength="20" style="width:100%;height:48px;padding:0 16px;background:#F2F2F7;border:none;border-radius:12px;font-size:16px;color:#1D1D1F;outline:none;" />';
    html += '</div>';
    html += '<div style="margin-bottom:16px;">';
    html += '<div style="font-size:13px;color:#8E8E93;margin-bottom:8px;">手机号</div>';
    html += '<input type="tel" id="registerPhone" placeholder="请输入手机号" maxlength="11" style="width:100%;height:48px;padding:0 16px;background:#F2F2F7;border:none;border-radius:12px;font-size:16px;color:#1D1D1F;outline:none;" />';
    html += '</div>';
    html += '<div style="margin-bottom:16px;">';
    html += '<div style="font-size:13px;color:#8E8E93;margin-bottom:8px;">密码</div>';
    html += '<input type="password" id="registerPassword" placeholder="请设置密码（6-20位）" maxlength="20" style="width:100%;height:48px;padding:0 16px;background:#F2F2F7;border:none;border-radius:12px;font-size:16px;color:#1D1D1F;outline:none;" />';
    html += '</div>';
    html += '<div style="margin-bottom:24px;">';
    html += '<div style="font-size:13px;color:#8E8E93;margin-bottom:8px;">确认密码</div>';
    html += '<input type="password" id="registerConfirmPassword" placeholder="请再次输入密码" maxlength="20" style="width:100%;height:48px;padding:0 16px;background:#F2F2F7;border:none;border-radius:12px;font-size:16px;color:#1D1D1F;outline:none;" />';
    html += '</div>';
    html += '<button onclick="doRegister()" style="width:100%;height:50px;background:linear-gradient(135deg,#007AFF 0%,#5856D6 100%);border:none;border-radius:14px;color:#fff;font-size:16px;font-weight:600;cursor:pointer;box-shadow:0 4px 12px rgba(0,122,255,0.3);">注册</button>';
    html += '<div style="margin-top:16px;text-align:center;">';
    html += '<span style="font-size:13px;color:#8E8E93;">已有账号？</span>';
    html += '<span onclick="goToLogin()" style="font-size:13px;color:#007AFF;cursor:pointer;">立即登录</span>';
    html += '</div>';
    html += '</div>';
    html += '<div style="padding:20px 24px 30px;text-align:center;">';
    html += '<div style="font-size:11px;color:#C7C7CC;">注册即表示同意 <span style="color:#007AFF;cursor:pointer;" onclick="openUserAgreement()">用户协议</span> 和 <span style="color:#007AFF;cursor:pointer;" onclick="openPrivacyPolicy()">隐私政策</span></div>';
    html += '</div>';
    html += '</div>';
    var temp = document.createElement('div');
    temp.innerHTML = html;
    var el = temp.firstElementChild;
    var wakeScreen = document.getElementById('wakeScreen');
    wakeScreen.parentNode.insertBefore(el, wakeScreen);
    registerPageCreated = true;
  }

  function showLogin() {
    createLoginPage();
    showScreen('login');
    if (userRole !== 'family') {
      speak('登录页');
    }
  }

  function closeLogin() {
    if (isLoggedIn) {
      showScreen('wake');
      switchTab('home');
    } else {
      var loginScreen = document.getElementById('loginScreen');
      if (loginScreen) loginScreen.style.display = 'none';
    }
    if (userRole !== 'family') {
      speak('已关闭登录页');
    }
  }

  function goToRegister() {
    createRegisterPage();
    showScreen('register');
    if (userRole !== 'family') {
      speak('注册页');
    }
  }

  function goToLogin() {
    createLoginPage();
    showScreen('login');
    speak('登录页');
  }

  function doRegister() {
    var name = document.getElementById('registerName').value.trim();
    var phone = document.getElementById('registerPhone').value.trim();
    var password = document.getElementById('registerPassword').value;
    var confirmPassword = document.getElementById('registerConfirmPassword').value;
    if (!name) {
      showFeedback('请输入昵称', 'error');
      speak('请输入昵称');
      return;
    }
    if (!phone) {
      showFeedback('请输入手机号', 'error');
      speak('请输入手机号');
      return;
    }
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      showFeedback('请输入正确的手机号', 'error');
      speak('请输入正确的手机号');
      return;
    }
    if (!password) {
      showFeedback('请设置密码', 'error');
      speak('请设置密码');
      return;
    }
    if (password.length < 6 || password.length > 20) {
      showFeedback('密码长度应为6-20位', 'error');
      speak('密码长度应为6到20位');
      return;
    }
    if (password !== confirmPassword) {
      showFeedback('两次输入的密码不一致', 'error');
      speak('两次输入的密码不一致');
      return;
    }
    var users = getStoredUsers();
    var existing = users.find(function(u) { return u.phone === phone; });
    if (existing) {
      showFeedback('该手机号已注册，请直接登录', 'error');
      speak('该手机号已注册，请直接登录');
      return;
    }
    var now = new Date();
    var registerDate = now.getFullYear() + '年' + (now.getMonth() + 1) + '月';
    var newUser = {
      name: name,
      phone: phone,
      password: password,
      avatarColor: getAvatarColor(name),
      registerDate: registerDate,
      totalTrips: 0,
      emergencyContacts: 0,
      safeAreas: 0,
      createdAt: now.getTime()
    };
    users.push(newUser);
    saveStoredUsers(users);
    isLoggedIn = true;
    currentUser = newUser;
    updateUserInfoFromCurrentUser();
    setCurrentSession(phone);
    refreshMyPageUI();
    speak('注册成功，欢迎加入瞳伴');
    showFeedback('注册成功', 'success');
    triggerHaptic('success');
    // Save role
    userRole = selectedLoginRole;
    try { localStorage.setItem('tongban_role', userRole); } catch(e) {}
    applyRoleUI();
    setTimeout(function() {
      if (userRole === 'family') {
        showScreen('family');
        switchTab('family');
      } else {
        showScreen('wake');
        switchTab('home');
      }
    }, 500);
  }

  function showAccountInfo() {
    if (!accountPageCreated) {
      var html = '<div class="screen" id="accountScreen" style="background:#F2F2F7;display:none;flex-direction:column;overflow:hidden;">';
      html += '<div style="background:rgba(255,255,255,0.92);backdrop-filter:blur(20px) saturate(180%);-webkit-backdrop-filter:blur(20px) saturate(180%);padding:10px 16px;padding-top:55px;border-bottom:0.5px solid rgba(0,0,0,0.06);display:flex;align-items:center;position:relative;z-index:20;">';
      html += '<div style="width:32px;height:32px;"></div>';
      html += '<span style="flex:1;text-align:center;font-size:17px;font-weight:600;color:#1D1D1F;">我的</span>';
      html += '<div onclick="openSettingsPage()" style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;color:#007AFF;cursor:pointer;border-radius:50%;" role="button" tabindex="0" aria-label="设置"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></div></div>';

      html += '<div style="flex:1;overflow-y:auto;padding-bottom:30px;">';

      html += '<div style="margin:12px;background:linear-gradient(135deg,#667eea 0%,#764ba2 50%,#f093fb 100%);border-radius:20px;padding:24px 20px;color:#fff;box-shadow:0 8px 24px rgba(102,126,234,0.3);position:relative;overflow:hidden;">';
      html += '<div style="position:absolute;top:-40px;right:-30px;width:140px;height:140px;border-radius:50%;background:rgba(255,255,255,0.12);"></div>';
      html += '<div style="position:absolute;bottom:-30px;left:-20px;width:100px;height:100px;border-radius:50%;background:rgba(255,255,255,0.08);"></div>';
      html += '<div style="display:flex;align-items:center;gap:16px;position:relative;">';
      html += '<div style="position:relative;">';
      html += '<div id="accountAvatar" style="width:68px;height:68px;border-radius:50%;background:rgba(255,255,255,0.25);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;color:#fff;font-size:28px;font-weight:700;border:3px solid rgba(255,255,255,0.4);">张</div>';
      html += '<div onclick="changeAvatarColor()" style="position:absolute;bottom:0px;right:-4px;width:26px;height:26px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.15);" title="更换头像颜色"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#667eea" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg></div>';
      html += '</div>';
      html += '<div style="flex:1;"><div style="font-size:22px;font-weight:700;letter-spacing:0.3px;" id="accountNameDisplay">' + userInfo.name + '</div>';
      html += '<div style="font-size:13px;opacity:0.85;margin-top:4px;" id="accountPhoneDisplay">' + userInfo.phone + '</div>';
      html += '<div style="display:flex;align-items:center;gap:6px;margin-top:8px;"><span style="background:rgba(255,255,255,0.25);padding:3px 10px;border-radius:20px;font-size:11px;display:inline-flex;align-items:center;gap:4px;backdrop-filter:blur(10px);"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>已实名</span></div>';
      html += '</div></div></div>';

      html += '<div style="margin:0 12px 12px;background:#fff;border-radius:16px;padding:16px 8px;display:grid;grid-template-columns:repeat(4,1fr);gap:8px;border:0.5px solid #E5E5EA;box-shadow:0 1px 3px rgba(0,0,0,0.04);">';
      var quickEntries = userRole === 'family' ? [
        { label: '守护中心', icon: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>', color: 'linear-gradient(135deg,#FF2D55,#FF9500)', shadow: 'rgba(255,45,85,0.3)', action: "goToFamilyTab()" },
        { label: '消息中心', icon: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>', color: 'linear-gradient(135deg,#007AFF,#5856D6)', shadow: 'rgba(0,122,255,0.3)', action: "openMessageCenter()", badge: true },
        { label: '安全围栏', icon: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>', color: 'linear-gradient(135deg,#FF9500,#FF3B30)', shadow: 'rgba(255,149,0,0.3)', action: "openFenceManagement()" },
        { label: '帮助反馈', icon: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>', color: 'linear-gradient(135deg,#34C759,#30B0C7)', shadow: 'rgba(52,199,89,0.3)', action: "openHelpFeedback()" }
      ] : [
        { label: '消息中心', icon: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>', color: 'linear-gradient(135deg,#007AFF,#5856D6)', shadow: 'rgba(0,122,255,0.3)', action: "openMessageCenter()", badge: true },
        { label: '我的收藏', icon: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>', color: 'linear-gradient(135deg,#FF2D55,#FF9500)', shadow: 'rgba(255,45,85,0.3)', action: "openMyFavorites()" },
        { label: '出行历史', icon: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>', color: 'linear-gradient(135deg,#FF9500,#FF3B30)', shadow: 'rgba(255,149,0,0.3)', action: "openTravelHistory()" },
        { label: '帮助反馈', icon: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>', color: 'linear-gradient(135deg,#34C759,#30B0C7)', shadow: 'rgba(52,199,89,0.3)', action: "openHelpFeedback()" }
      ];
      quickEntries.forEach(function(entry) {
        html += '<div onclick="' + entry.action + '" role="button" tabindex="0" aria-label="' + entry.label + '" style="display:flex;flex-direction:column;align-items:center;gap:8px;cursor:pointer;padding:8px 4px;border-radius:12px;transition:background 0.2s;position:relative;" onmouseover="this.style.background=\'#F2F2F7\'" onmouseout="this.style.background=\'transparent\'"><div style="width:44px;height:44px;border-radius:12px;background:' + entry.color + ';display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px ' + entry.shadow + ';"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + entry.icon + '</svg></div>' + (entry.badge ? '<div id="accountMsgBadge" style="position:absolute;top:4px;right:18px;width:8px;height:8px;background:#FF3B30;border-radius:50%;border:2px solid #fff;"></div>' : '') + '<span style="font-size:12px;color:#3C3C43;">' + entry.label + '</span></div>';
      });
      html += '</div>';

      html += '<div style="margin:0 12px 12px;display:grid;grid-template-columns:1fr 1fr;gap:10px;">';
      if (userRole === 'family') {
        // 家人版数据卡片：守护统计
        html += '<div onclick="openWardList()" style="background:#fff;border-radius:16px;padding:16px;border:0.5px solid #E5E5EA;box-shadow:0 1px 3px rgba(0,0,0,0.04);cursor:pointer;">';
        html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;"><div style="width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,#007AFF,#5AC8FA);display:flex;align-items:center;justify-content:center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div><span style="font-size:13px;color:#8E8E93;">被监护人士</span></div>';
        html += '<div style="font-size:26px;font-weight:800;color:#1D1D1F;line-height:1;">' + wards.length + '<span style="font-size:13px;font-weight:500;color:#8E8E93;margin-left:2px;">人</span></div>';
        html += '<div style="font-size:11px;color:#34C759;margin-top:6px;display:flex;align-items:center;gap:3px;"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>状态正常</div></div>';
        html += '<div onclick="showFenceDetail()" style="background:#fff;border-radius:16px;padding:16px;border:0.5px solid #E5E5EA;box-shadow:0 1px 3px rgba(0,0,0,0.04);cursor:pointer;">';
        html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;"><div style="width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,#FF9500,#FF3B30);display:flex;align-items:center;justify-content:center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div><span style="font-size:13px;color:#8E8E93;">安全围栏</span></div>';
        html += '<div style="font-size:26px;font-weight:800;color:#1D1D1F;line-height:1;">3<span style="font-size:13px;font-weight:500;color:#8E8E93;margin-left:2px;">个</span></div>';
        html += '<div style="font-size:11px;color:#34C759;margin-top:6px;display:flex;align-items:center;gap:3px;"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>全部生效</div></div>';
        html += '<div onclick="openAlertHistory()" style="background:#fff;border-radius:16px;padding:16px;border:0.5px solid #E5E5EA;box-shadow:0 1px 3px rgba(0,0,0,0.04);cursor:pointer;">';
        html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;"><div style="width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,#FF3B30,#FF2D55);display:flex;align-items:center;justify-content:center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div><span style="font-size:13px;color:#8E8E93;">本月预警</span></div>';
        html += '<div style="font-size:26px;font-weight:800;color:#1D1D1F;line-height:1;">2<span style="font-size:13px;font-weight:500;color:#8E8E93;margin-left:2px;">次</span></div>';
        html += '<div style="font-size:11px;color:#FF9500;margin-top:6px;display:flex;align-items:center;gap:3px;"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>1条待处理</div></div>';
        html += '<div onclick="openGuardianSettings()" style="background:#fff;border-radius:16px;padding:16px;border:0.5px solid #E5E5EA;box-shadow:0 1px 3px rgba(0,0,0,0.04);cursor:pointer;">';
        html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;"><div style="width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,#34C759,#30B0C7);display:flex;align-items:center;justify-content:center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg></div><span style="font-size:13px;color:#8E8E93;">守护时长</span></div>';
        html += '<div style="font-size:26px;font-weight:800;color:#1D1D1F;line-height:1;">128<span style="font-size:13px;font-weight:500;color:#8E8E93;margin-left:2px;">天</span></div>';
        html += '<div style="font-size:11px;color:#34C759;margin-top:6px;display:flex;align-items:center;gap:3px;"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg>持续守护中</div></div>';
      } else {
        // 视障版数据卡片：出行统计
        html += '<div onclick="showTravelHistory()" style="background:#fff;border-radius:16px;padding:16px;border:0.5px solid #E5E5EA;box-shadow:0 1px 3px rgba(0,0,0,0.04);cursor:pointer;">';
        html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;"><div style="width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,#007AFF,#5AC8FA);display:flex;align-items:center;justify-content:center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></div><span style="font-size:13px;color:#8E8E93;">累计出行</span></div>';
        html += '<div style="font-size:26px;font-weight:800;color:#1D1D1F;line-height:1;">' + userInfo.totalTrips + '<span style="font-size:13px;font-weight:500;color:#8E8E93;margin-left:2px;">次</span></div>';
        html += '<div style="font-size:11px;color:#34C759;margin-top:6px;display:flex;align-items:center;gap:3px;"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg>较上月 +12%</div></div>';
        html += '<div onclick="showFavorites()" style="background:#fff;border-radius:16px;padding:16px;border:0.5px solid #E5E5EA;box-shadow:0 1px 3px rgba(0,0,0,0.04);cursor:pointer;">';
        html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;"><div style="width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,#FF3B30,#FF9500);display:flex;align-items:center;justify-content:center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></div><span style="font-size:13px;color:#8E8E93;">安全守护</span></div>';
        html += '<div style="font-size:26px;font-weight:800;color:#1D1D1F;line-height:1;">' + userInfo.safeAreas + '<span style="font-size:13px;font-weight:500;color:#8E8E93;margin-left:2px;">区域</span></div>';
        html += '<div style="font-size:11px;color:#34C759;margin-top:6px;display:flex;align-items:center;gap:3px;"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>全部正常</div></div>';
        html += '<div onclick="addEmergencyContact()" style="background:#fff;border-radius:16px;padding:16px;border:0.5px solid #E5E5EA;box-shadow:0 1px 3px rgba(0,0,0,0.04);cursor:pointer;">';
        html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;"><div style="width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,#AF52DE,#FF2D55);display:flex;align-items:center;justify-content:center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div><span style="font-size:13px;color:#8E8E93;">紧急联系人</span></div>';
        html += '<div style="font-size:26px;font-weight:800;color:#1D1D1F;line-height:1;">' + userInfo.emergencyContacts + '<span style="font-size:13px;font-weight:500;color:#8E8E93;margin-left:2px;">位</span></div>';
        html += '<div style="font-size:11px;color:#FF9500;margin-top:6px;display:flex;align-items:center;gap:3px;"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>可添加1位</div></div>';
        html += '<div onclick="switchTab(\'community\')" style="background:#fff;border-radius:16px;padding:16px;border:0.5px solid #E5E5EA;box-shadow:0 1px 3px rgba(0,0,0,0.04);cursor:pointer;">';
        html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;"><div style="width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,#34C759,#30B0C7);display:flex;align-items:center;justify-content:center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg></div><span style="font-size:13px;color:#8E8E93;">社区贡献</span></div>';
        html += '<div style="font-size:26px;font-weight:800;color:#1D1D1F;line-height:1;">56<span style="font-size:13px;font-weight:500;color:#8E8E93;margin-left:2px;">帖</span></div>';
        html += '<div style="font-size:11px;color:#34C759;margin-top:6px;display:flex;align-items:center;gap:3px;"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>获赞 128</div></div>';
      }
      html += '</div>';

      // 个人信息
      html += '<div style="margin:12px;background:#fff;border-radius:16px;overflow:hidden;border:0.5px solid #E5E5EA;box-shadow:0 1px 3px rgba(0,0,0,0.04);">';
      html += '<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:0.5px solid #F2F2F7;"><span style="font-size:15px;font-weight:600;color:#1D1D1F;">个人信息</span><span style="font-size:12px;color:#8E8E93;">点击可编辑</span></div>';
      html += '<div onclick="editAccountField(\'name\')" style="display:flex;align-items:center;padding:14px 16px;border-bottom:0.5px solid #F2F2F7;cursor:pointer;"><div style="flex:1;display:flex;align-items:center;gap:10px;"><div style="width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#007AFF,#5AC8FA);display:flex;align-items:center;justify-content:center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div><span style="font-size:15px;color:#1D1D1F;">昵称</span></div><span style="font-size:14px;color:#8E8E93;margin-right:6px;" id="accountNameField">' + userInfo.name + '</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></div>';
      html += '<div onclick="editAccountField(\'phone\')" style="display:flex;align-items:center;padding:14px 16px;border-bottom:0.5px solid #F2F2F7;cursor:pointer;"><div style="flex:1;display:flex;align-items:center;gap:10px;"><div style="width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#34C759,#30B0C7);display:flex;align-items:center;justify-content:center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg></div><span style="font-size:15px;color:#1D1D1F;">手机号</span></div><span style="font-size:14px;color:#8E8E93;margin-right:6px;" id="accountPhoneField">' + userInfo.phone + '</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></div>';
      html += '<div onclick="openRealNameAuth()" role="button" tabindex="0" aria-label="实名认证" style="display:flex;align-items:center;padding:14px 16px;border-bottom:0.5px solid #F2F2F7;cursor:pointer;"><div style="flex:1;display:flex;align-items:center;gap:10px;"><div style="width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#5856D6,#007AFF);display:flex;align-items:center;justify-content:center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12l2 2 4-4"/><path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c2.39 0 4.68.94 6.36 2.64"/></svg></div><span style="font-size:15px;color:#1D1D1F;">实名认证</span></div><span style="font-size:13px;color:#34C759;font-weight:500;">已认证</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></div>';
      html += '<div style="display:flex;align-items:center;padding:14px 16px;cursor:default;"><div style="flex:1;display:flex;align-items:center;gap:10px;"><div style="width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#AF52DE,#5856D6);display:flex;align-items:center;justify-content:center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div><span style="font-size:15px;color:#1D1D1F;">注册时间</span></div><span style="font-size:14px;color:#8E8E93;">' + userInfo.registerDate + '</span></div>';
      html += '</div>';

      // 设置入口
      html += '<div onclick="openSettingsPage()" role="button" tabindex="0" aria-label="设置" style="margin:12px;background:#fff;border-radius:16px;overflow:hidden;border:0.5px solid #E5E5EA;box-shadow:0 1px 3px rgba(0,0,0,0.04);cursor:pointer;display:flex;align-items:center;padding:14px 16px;transition:background 0.2s;" onmouseover="this.style.background=\'#F8F8F8\'" onmouseout="this.style.background=\'#fff\'"><div style="flex:1;display:flex;align-items:center;gap:10px;"><div style="width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#8E8E93,#C7C7CC);display:flex;align-items:center;justify-content:center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></div><span style="font-size:15px;color:#1D1D1F;">设置</span></div><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></div>';

      html += '<div style="text-align:center;margin-top:20px;font-size:11px;color:#C7C7CC;">瞳伴 v1.0.0</div>';
      html += '<div style="height:10px;"></div></div></div>';

      var temp = document.createElement('div');
      temp.innerHTML = html;
      var el = temp.firstElementChild;
      var myScreen = document.getElementById('myScreen');
      myScreen.parentNode.insertBefore(el, myScreen);
      accountPageCreated = true;
    }
    showScreen('account');
    speak('账号设置');
    triggerHaptic('light');
  }

  function backToMyFromAccount() {
    showScreen('my');
    triggerHaptic('light');
  }

  function editAccountField(field) {
    var labels = { name: '昵称', phone: '手机号' };
    var current = '';
    if (field === 'name') current = userInfo.name;
    else if (field === 'phone') current = userInfo.phone;
    var overlay = document.getElementById('editFieldOverlay');
    if (overlay) overlay.remove();
    overlay = document.createElement('div');
    overlay.id = 'editFieldOverlay';
    overlay.style.cssText = 'position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.4);z-index:9999;display:flex;align-items:center;justify-content:center;';
    overlay.innerHTML =
      '<div style="background:#fff;border-radius:16px;width:280px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,0.2);">' +
        '<div style="padding:16px 16px 12px;text-align:center;"><div style="font-size:16px;font-weight:600;color:#1D1D1F;margin-bottom:4px;">修改' + labels[field] + '</div>' +
        '<div style="font-size:12px;color:#8E8E93;">请输入新的' + labels[field] + '</div></div>' +
        '<div style="padding:0 16px 16px;"><input type="text" id="editFieldInput" value="' + current + '" style="width:100%;height:40px;border:1px solid #E5E5EA;border-radius:10px;padding:0 12px;font-size:15px;color:#1D1D1F;outline:none;box-sizing:border-box;background:#F2F2F7;"></div>' +
        '<div style="display:flex;border-top:0.5px solid #E5E5EA;"><button onclick="cancelEditField()" style="flex:1;height:48px;background:transparent;border:none;border-right:0.5px solid #E5E5EA;color:#8E8E93;font-size:15px;cursor:pointer;">取消</button>' +
        '<button onclick="saveEditField(\'' + field + '\')" style="flex:1;height:48px;background:transparent;border:none;color:#007AFF;font-size:15px;font-weight:600;cursor:pointer;">保存</button></div>' +
      '</div>';
    var phoneScreen = document.querySelector('.phone-screen') || document.body;
    phoneScreen.appendChild(overlay);
    overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
    var input = document.getElementById('editFieldInput');
    if (input) { input.focus(); input.select(); }
    triggerHaptic('light');
  }

  function cancelEditField() {
    var overlay = document.getElementById('editFieldOverlay');
    if (overlay) overlay.remove();
  }

  function saveEditField(field) {
    var input = document.getElementById('editFieldInput');
    if (!input || !input.value.trim()) {
      showFeedback('请输入内容', 'warning');
      return;
    }
    var val = input.value.trim();
    userInfo[field] = val;
    if (field === 'name') {
      var nameEl = document.getElementById('accountNameField');
      if (nameEl) nameEl.textContent = val;
      var display = document.getElementById('accountNameDisplay');
      if (display) display.textContent = val;
      var avatar = document.getElementById('accountAvatar');
      if (avatar) avatar.textContent = val.charAt(0);
      var myName = document.querySelector('.my-name');
      if (myName) myName.textContent = val;
    } else if (field === 'phone') {
      var phoneEl = document.getElementById('accountPhoneField');
      if (phoneEl) phoneEl.textContent = val;
      var phoneDisplay = document.getElementById('accountPhoneDisplay');
      if (phoneDisplay) phoneDisplay.textContent = val;
      var myPhone = document.querySelector('.my-phone');
      if (myPhone) myPhone.textContent = val;
    }
    cancelEditField();
    speak(labels_text(field) + '已更新');
    triggerHaptic('success');
    showFeedback('已更新', 'success');
  }

  function labels_text(field) {
    return field === 'name' ? '昵称' : field === 'phone' ? '手机号' : '信息';
  }

  function changeAvatarColor() {
    var colors = [
      { bg: 'rgba(255,255,255,0.25)', border: 'rgba(255,255,255,0.4)' },
      { bg: 'linear-gradient(135deg,#FF9500,#FF3B30)', border: 'rgba(255,149,0,0.6)' },
      { bg: 'linear-gradient(135deg,#34C759,#30D158)', border: 'rgba(52,199,89,0.6)' },
      { bg: 'linear-gradient(135deg,#AF52DE,#5856D6)', border: 'rgba(175,82,222,0.6)' },
      { bg: 'linear-gradient(135deg,#FF2D55,#FF9500)', border: 'rgba(255,45,85,0.6)' },
      { bg: 'linear-gradient(135deg,#30B0C7,#007AFF)', border: 'rgba(48,176,199,0.6)' }
    ];
    var avatar = document.getElementById('accountAvatar');
    if (!avatar) return;
    var idx = parseInt(avatar.getAttribute('data-color-idx') || '0');
    idx = (idx + 1) % colors.length;
    avatar.setAttribute('data-color-idx', idx);
    avatar.style.background = colors[idx].bg;
    avatar.style.borderColor = colors[idx].border;
    triggerHaptic('light');
    showFeedback('头像颜色已更换', 'success');
  }

  function toggleAccountSwitch(el) {
    var sw = el.querySelector('.switch');
    if (sw) { sw.classList.toggle('active'); var isActive = sw.classList.contains('active'); sw.setAttribute('aria-checked', isActive ? 'true' : 'false'); }
    triggerHaptic('light');
  }

  function confirmLogout() {
    var overlay = document.getElementById('logoutConfirmOverlay');
    if (overlay) overlay.remove();
    overlay = document.createElement('div');
    overlay.id = 'logoutConfirmOverlay';
    overlay.style.cssText = 'position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.4);z-index:9999;display:flex;align-items:center;justify-content:center;';
    overlay.innerHTML =
      '<div style="background:#fff;border-radius:16px;width:260px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,0.2);">' +
        '<div style="padding:20px 16px 12px;text-align:center;"><div style="font-size:16px;font-weight:600;color:#1D1D1F;">退出登录</div><div style="font-size:13px;color:#8E8E93;margin-top:6px;">确定要退出当前账号吗？</div></div>' +
        '<div style="display:flex;border-top:0.5px solid #E5E5EA;"><button onclick="cancelLogout()" style="flex:1;height:48px;background:transparent;border:none;border-right:0.5px solid #E5E5EA;color:#007AFF;font-size:15px;cursor:pointer;">取消</button>' +
        '<button onclick="doLogout()" style="flex:1;height:48px;background:transparent;border:none;color:#FF3B30;font-size:15px;font-weight:600;cursor:pointer;">退出</button></div>' +
      '</div>';
    var phoneScreen = document.querySelector('.phone-screen') || document.body;
    phoneScreen.appendChild(overlay);
    overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
    triggerHaptic('light');
  }

  function cancelLogout() {
    var overlay = document.getElementById('logoutConfirmOverlay');
    if (overlay) overlay.remove();
  }

  function doLogout() {
    cancelLogout();
    isLoggedIn = false;
    currentUser = null;
    clearCurrentSession();
    accountPageCreated = false;
    var accountScreen = document.getElementById('accountScreen');
    if (accountScreen) accountScreen.remove();
    // 重置登录页和注册页状态
    loginPageCreated = false;
    registerPageCreated = false;
    selectedLoginRole = 'blind';
    var loginScreen = document.getElementById('loginScreen');
    if (loginScreen) loginScreen.remove();
    var registerScreen = document.getElementById('registerScreen');
    if (registerScreen) registerScreen.remove();
    // 重置角色UI
    userRole = 'blind';
    try { localStorage.setItem('tongban_role', 'blind'); } catch(e) {}
    // 重置家人dashboard（确保下次登录重建）
    familyDashboardCreated = false;
    var dashboardEl = document.getElementById('familyDashboard');
    if (dashboardEl) dashboardEl.remove();
    // 重置角色相关页面缓存
    resetRoleSensitivePages();
    applyRoleUI();
    refreshMyPageUI();
    speak('已退出登录');
    showFeedback('已退出登录', 'info');
    triggerHaptic('medium');
    setTimeout(function() {
      showLogin();
    }, 300);
  }

  var vibrationIntensity = 'medium';
  function adjustVibrationIntensity() {
    var levels = ['light', 'medium', 'strong'];
    var labels = ['弱', '标准', '强'];
    var idx = levels.indexOf(vibrationIntensity);
    idx = (idx + 1) % levels.length;
    vibrationIntensity = levels[idx];
    speak('震动强度已调整为' + labels[idx]);
    showFeedback('震动强度: ' + labels[idx]);
    triggerHaptic(levels[idx] === 'strong' ? 'heavy' : levels[idx] === 'light' ? 'light' : 'medium');
    var el = (typeof event !== 'undefined' && event) ? event.currentTarget : null;
    if (el) el.setAttribute('aria-label', '震动强度，当前' + labels[idx]);
  }

  function showFenceDetail() {
    openFenceDetailPage();
  }

  function viewFamilyLocation(name) {
    openFamilyLocationPage(name);
  }

  function toggleLocationShare(el) {
    var isActive = el.classList.toggle('active');
    el.setAttribute('aria-checked', isActive ? 'true' : 'false');
    speak(isActive ? '位置共享已开启' : '位置共享已关闭');
    triggerHaptic(isActive ? 'medium' : 'light');
  }

  // ========== 通用页面/弹窗辅助函数 ==========
  // 设置入口
  function openSettings() {
    openSettingsPage();
  }
  function openSettingsPage() {
    ensureSettingsPage();
    showScreen('settings');
    speak('设置', 'normal');
    triggerHaptic('light');
  }
  var settingsPageCreated = false;
  function ensureSettingsPage() {
    if (settingsPageCreated) return;
    var page = document.createElement('div');
    page.id = 'settingsScreen';
    page.className = 'screen';
    page.setAttribute('role', 'main');
    page.setAttribute('aria-label', '设置');
    page.style.cssText = 'background:#F2F2F7;padding-top:47px;display:none;flex-direction:column;overflow:hidden;';
    var settingsHtml = '';
    if (userRole === 'family') {
      // 家人版设置
      settingsHtml =
        // 守护设置
        '<div style="background:#fff;border-radius:16px;overflow:hidden;margin-bottom:12px;border:0.5px solid #E5E5EA;box-shadow:0 1px 3px rgba(0,0,0,0.04);">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:0.5px solid #F2F2F7;"><span style="font-size:15px;font-weight:600;color:#1D1D1F;">守护设置</span></div>' +
          '<div onclick="openWardList()" style="display:flex;align-items:center;padding:14px 16px;border-bottom:0.5px solid #F2F2F7;cursor:pointer;"><div style="flex:1;display:flex;align-items:center;gap:10px;"><div style="width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#007AFF,#5AC8FA);display:flex;align-items:center;justify-content:center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div><span style="font-size:15px;color:#1D1D1F;">被监护人士</span></div><span style="font-size:14px;color:#8E8E93;">' + wards.length + '人</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></div>' +
          '<div onclick="openFenceManagement()" style="display:flex;align-items:center;padding:14px 16px;border-bottom:0.5px solid #F2F2F7;cursor:pointer;"><div style="flex:1;display:flex;align-items:center;gap:10px;"><div style="width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#FF9500,#FF3B30);display:flex;align-items:center;justify-content:center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div><span style="font-size:15px;color:#1D1D1F;">安全围栏</span></div><span style="font-size:14px;color:#8E8E93;">3个</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></div>' +
          '<div onclick="openAlertHistory()" style="display:flex;align-items:center;padding:14px 16px;border-bottom:0.5px solid #F2F2F7;cursor:pointer;"><div style="flex:1;display:flex;align-items:center;gap:10px;"><div style="width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#FF3B30,#FF2D55);display:flex;align-items:center;justify-content:center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div><span style="font-size:15px;color:#1D1D1F;">预警记录</span></div><span style="font-size:14px;color:#FF9500;">2条待处理</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></div>' +
          '<div onclick="openGuardianSettings()" style="display:flex;align-items:center;padding:14px 16px;cursor:pointer;"><div style="flex:1;display:flex;align-items:center;gap:10px;"><div style="width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#5856D6,#007AFF);display:flex;align-items:center;justify-content:center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></div><span style="font-size:15px;color:#1D1D1F;">守护设置</span></div><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></div>' +
        '</div>' +
        // 通知设置
        '<div style="background:#fff;border-radius:16px;overflow:hidden;margin-bottom:12px;border:0.5px solid #E5E5EA;box-shadow:0 1px 3px rgba(0,0,0,0.04);">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:0.5px solid #F2F2F7;"><span style="font-size:15px;font-weight:600;color:#1D1D1F;">通知设置</span></div>' +
          '<div onclick="toggleAccountSwitch(this)" style="display:flex;align-items:center;padding:14px 16px;border-bottom:0.5px solid #F2F2F7;cursor:pointer;"><div style="flex:1;display:flex;align-items:center;gap:10px;"><div style="width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#FF9500,#FF3B30);display:flex;align-items:center;justify-content:center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg></div><span style="font-size:15px;color:#1D1D1F;">离开围栏提醒</span></div><div class="switch active" onclick="event.stopPropagation();toggleSwitch(this)" role="switch" aria-checked="true" aria-label="离开围栏提醒"></div></div>' +
          '<div onclick="toggleAccountSwitch(this)" style="display:flex;align-items:center;padding:14px 16px;border-bottom:0.5px solid #F2F2F7;cursor:pointer;"><div style="flex:1;display:flex;align-items:center;gap:10px;"><div style="width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#34C759,#30B0C7);display:flex;align-items:center;justify-content:center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></div><span style="font-size:15px;color:#1D1D1F;">位置更新通知</span></div><div class="switch active" onclick="event.stopPropagation();toggleSwitch(this)" role="switch" aria-checked="true" aria-label="位置更新通知"></div></div>' +
          '<div onclick="toggleAccountSwitch(this)" style="display:flex;align-items:center;padding:14px 16px;cursor:pointer;"><div style="flex:1;display:flex;align-items:center;gap:10px;"><div style="width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#5856D6,#007AFF);display:flex;align-items:center;justify-content:center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div><span style="font-size:15px;color:#1D1D1F;">低电量提醒</span></div><div class="switch" onclick="event.stopPropagation();toggleSwitch(this)" role="switch" aria-checked="false" aria-label="低电量提醒"></div></div>' +
        '</div>' +
        // 通用偏好
        '<div style="background:#fff;border-radius:16px;overflow:hidden;margin-bottom:12px;border:0.5px solid #E5E5EA;box-shadow:0 1px 3px rgba(0,0,0,0.04);">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:0.5px solid #F2F2F7;"><span style="font-size:15px;font-weight:600;color:#1D1D1F;">通用</span></div>' +
          '<div onclick="toggleAccountSwitch(this)" style="display:flex;align-items:center;padding:14px 16px;border-bottom:0.5px solid #F2F2F7;cursor:pointer;"><div style="flex:1;display:flex;align-items:center;gap:10px;"><div style="width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#5856D6,#007AFF);display:flex;align-items:center;justify-content:center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg></div><span style="font-size:15px;color:#1D1D1F;">深色模式</span></div><div class="switch" onclick="event.stopPropagation();toggleSwitch(this)" role="switch" aria-checked="false" aria-label="深色模式"></div></div>' +
          '<div onclick="toggleAccountSwitch(this)" style="display:flex;align-items:center;padding:14px 16px;cursor:pointer;"><div style="flex:1;display:flex;align-items:center;gap:10px;"><div style="width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#34C759,#30B0C7);display:flex;align-items:center;justify-content:center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12l2 2 4-4"/><path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c2.39 0 4.68.94 6.36 2.64"/></svg></div><span style="font-size:15px;color:#1D1D1F;">自动同步</span></div><div class="switch active" onclick="event.stopPropagation();toggleSwitch(this)" role="switch" aria-checked="true" aria-label="自动同步"></div></div>' +
        '</div>' +
        // 账号管理
        '<div style="background:#fff;border-radius:16px;overflow:hidden;margin-bottom:12px;border:0.5px solid #E5E5EA;box-shadow:0 1px 3px rgba(0,0,0,0.04);">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:0.5px solid #F2F2F7;"><span style="font-size:15px;font-weight:600;color:#1D1D1F;">账号管理</span></div>' +
          '<div onclick="openChangePassword()" role="button" tabindex="0" aria-label="修改密码" style="display:flex;align-items:center;padding:14px 16px;border-bottom:0.5px solid #F2F2F7;cursor:pointer;"><div style="flex:1;display:flex;align-items:center;gap:10px;"><div style="width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#FF9500,#FFCC00);display:flex;align-items:center;justify-content:center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div><span style="font-size:15px;color:#1D1D1F;">修改密码</span></div><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></div>' +
          '<div onclick="openDataExport()" role="button" tabindex="0" aria-label="数据导出" style="display:flex;align-items:center;padding:14px 16px;border-bottom:0.5px solid #F2F2F7;cursor:pointer;"><div style="flex:1;display:flex;align-items:center;gap:10px;"><div style="width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#34C759,#30B0C7);display:flex;align-items:center;justify-content:center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></div><span style="font-size:15px;color:#1D1D1F;">数据导出</span></div><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></div>' +
          '<div onclick="openUserAgreement()" role="button" tabindex="0" aria-label="用户协议" style="display:flex;align-items:center;padding:14px 16px;border-bottom:0.5px solid #F2F2F7;cursor:pointer;"><div style="flex:1;display:flex;align-items:center;gap:10px;"><div style="width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#007AFF,#5856D6);display:flex;align-items:center;justify-content:center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div><span style="font-size:15px;color:#1D1D1F;">用户协议</span></div><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></div>' +
          '<div onclick="openPrivacyPolicy()" role="button" tabindex="0" aria-label="隐私政策" style="display:flex;align-items:center;padding:14px 16px;cursor:pointer;"><div style="flex:1;display:flex;align-items:center;gap:10px;"><div style="width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#AF52DE,#5856D6);display:flex;align-items:center;justify-content:center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div><span style="font-size:15px;color:#1D1D1F;">隐私政策</span></div><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></div>' +
        '</div>';
    } else {
      // 视障版设置
      settingsHtml =
        // 语音设置
        '<div style="background:#fff;border-radius:16px;overflow:hidden;margin-bottom:12px;border:0.5px solid #E5E5EA;box-shadow:0 1px 3px rgba(0,0,0,0.04);">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:0.5px solid #F2F2F7;"><span style="font-size:15px;font-weight:600;color:#1D1D1F;">语音设置</span></div>' +
          '<div style="padding:14px 16px;border-bottom:0.5px solid #F2F2F7;"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;"><div style="display:flex;align-items:center;gap:10px;"><div style="width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#007AFF,#5AC8FA);display:flex;align-items:center;justify-content:center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg></div><span style="font-size:15px;color:#1D1D1F;">播报语速</span></div><span style="font-size:14px;color:#8E8E93;">标准</span></div><div style="display:flex;gap:8px;"><button style="flex:1;padding:8px 0;background:#F2F2F7;border:none;border-radius:8px;font-size:12px;color:#1D1D1F;cursor:pointer;">慢</button><button style="flex:1;padding:8px 0;background:#007AFF;border:none;border-radius:8px;font-size:12px;color:#fff;cursor:pointer;">标准</button><button style="flex:1;padding:8px 0;background:#F2F2F7;border:none;border-radius:8px;font-size:12px;color:#1D1D1F;cursor:pointer;">快</button></div></div>' +
          '<div style="padding:14px 16px;border-bottom:0.5px solid #F2F2F7;"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;"><div style="display:flex;align-items:center;gap:10px;"><div style="width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#FF9500,#FFCC00);display:flex;align-items:center;justify-content:center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg></div><span style="font-size:15px;color:#1D1D1F;">播报音量</span></div><span style="font-size:14px;color:#8E8E93;">80%</span></div><div style="height:4px;background:#E5E5EA;border-radius:2px;position:relative;"><div style="width:80%;height:100%;background:linear-gradient(90deg,#007AFF,#5AC8FA);border-radius:2px;"></div><div style="position:absolute;left:80%;top:50%;transform:translate(-50%,-50%);width:16px;height:16px;background:#fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.2);border:2px solid #007AFF;"></div></div></div>' +
          '<div onclick="toggleAccountSwitch(this)" style="display:flex;align-items:center;padding:14px 16px;cursor:pointer;"><div style="flex:1;display:flex;align-items:center;gap:10px;"><div style="width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#34C759,#30B0C7);display:flex;align-items:center;justify-content:center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 18h.01"/><path d="M12 14v-4"/><path d="M12 6h.01"/><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg></div><span style="font-size:15px;color:#1D1D1F;">语音助手</span></div><div class="switch active" onclick="event.stopPropagation();toggleSwitch(this)" role="switch" aria-checked="true" aria-label="语音助手"></div></div>' +
        '</div>' +
        // 导航设置
        '<div style="background:#fff;border-radius:16px;overflow:hidden;margin-bottom:12px;border:0.5px solid #E5E5EA;box-shadow:0 1px 3px rgba(0,0,0,0.04);">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:0.5px solid #F2F2F7;"><span style="font-size:15px;font-weight:600;color:#1D1D1F;">导航设置</span></div>' +
          '<div onclick="toggleAccountSwitch(this)" style="display:flex;align-items:center;padding:14px 16px;border-bottom:0.5px solid #F2F2F7;cursor:pointer;"><div style="flex:1;display:flex;align-items:center;gap:10px;"><div style="width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#5856D6,#007AFF);display:flex;align-items:center;justify-content:center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></div><span style="font-size:15px;color:#1D1D1F;">实时路况播报</span></div><div class="switch active" onclick="event.stopPropagation();toggleSwitch(this)" role="switch" aria-checked="true" aria-label="实时路况播报"></div></div>' +
          '<div onclick="toggleAccountSwitch(this)" style="display:flex;align-items:center;padding:14px 16px;border-bottom:0.5px solid #F2F2F7;cursor:pointer;"><div style="flex:1;display:flex;align-items:center;gap:10px;"><div style="width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#FF9500,#FF3B30);display:flex;align-items:center;justify-content:center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div><span style="font-size:15px;color:#1D1D1F;">危险路段提醒</span></div><div class="switch active" onclick="event.stopPropagation();toggleSwitch(this)" role="switch" aria-checked="true" aria-label="危险路段提醒"></div></div>' +
          '<div onclick="toggleAccountSwitch(this)" style="display:flex;align-items:center;padding:14px 16px;cursor:pointer;"><div style="flex:1;display:flex;align-items:center;gap:10px;"><div style="width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#34C759,#30B0C7);display:flex;align-items:center;justify-content:center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12l2 2 4-4"/><path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c2.39 0 4.68.94 6.36 2.64"/></svg></div><span style="font-size:15px;color:#1D1D1F;">盲道偏离提醒</span></div><div class="switch active" onclick="event.stopPropagation();toggleSwitch(this)" role="switch" aria-checked="true" aria-label="盲道偏离提醒"></div></div>' +
        '</div>' +
        // AI摄像头设置
        '<div style="background:#fff;border-radius:16px;overflow:hidden;margin-bottom:12px;border:0.5px solid #E5E5EA;box-shadow:0 1px 3px rgba(0,0,0,0.04);">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:0.5px solid #F2F2F7;"><span style="font-size:15px;font-weight:600;color:#1D1D1F;">AI摄像头</span></div>' +
          '<div onclick="toggleAccountSwitch(this)" style="display:flex;align-items:center;padding:14px 16px;border-bottom:0.5px solid #F2F2F7;cursor:pointer;"><div style="flex:1;display:flex;align-items:center;gap:10px;"><div style="width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#007AFF,#5AC8FA);display:flex;align-items:center;justify-content:center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg></div><span style="font-size:15px;color:#1D1D1F;">自动开启摄像头</span></div><div class="switch active" onclick="event.stopPropagation();toggleSwitch(this)" role="switch" aria-checked="true" aria-label="自动开启摄像头"></div></div>' +
          '<div onclick="toggleAccountSwitch(this)" style="display:flex;align-items:center;padding:14px 16px;border-bottom:0.5px solid #F2F2F7;cursor:pointer;"><div style="flex:1;display:flex;align-items:center;gap:10px;"><div style="width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#FF9500,#FFCC00);display:flex;align-items:center;justify-content:center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg></div><span style="font-size:15px;color:#1D1D1F;">环境识别播报</span></div><div class="switch active" onclick="event.stopPropagation();toggleSwitch(this)" role="switch" aria-checked="true" aria-label="环境识别播报"></div></div>' +
          '<div onclick="toggleAccountSwitch(this)" style="display:flex;align-items:center;padding:14px 16px;cursor:pointer;"><div style="flex:1;display:flex;align-items:center;gap:10px;"><div style="width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#AF52DE,#FF2D55);display:flex;align-items:center;justify-content:center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg></div><span style="font-size:15px;color:#1D1D1F;">震动反馈</span></div><div class="switch active" onclick="event.stopPropagation();toggleSwitch(this)" role="switch" aria-checked="true" aria-label="震动反馈"></div></div>' +
        '</div>' +
        // 安全设置
        '<div style="background:#fff;border-radius:16px;overflow:hidden;margin-bottom:12px;border:0.5px solid #E5E5EA;box-shadow:0 1px 3px rgba(0,0,0,0.04);">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:0.5px solid #F2F2F7;"><span style="font-size:15px;font-weight:600;color:#1D1D1F;">安全设置</span></div>' +
          '<div onclick="addEmergencyContact()" style="display:flex;align-items:center;padding:14px 16px;border-bottom:0.5px solid #F2F2F7;cursor:pointer;"><div style="flex:1;display:flex;align-items:center;gap:10px;"><div style="width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#FF3B30,#FF2D55);display:flex;align-items:center;justify-content:center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div><span style="font-size:15px;color:#1D1D1F;">紧急联系人</span></div><span style="font-size:14px;color:#8E8E93;">2位</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></div>' +
          '<div onclick="showFavorites()" style="display:flex;align-items:center;padding:14px 16px;cursor:pointer;"><div style="flex:1;display:flex;align-items:center;gap:10px;"><div style="width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#FF9500,#FF3B30);display:flex;align-items:center;justify-content:center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div><span style="font-size:15px;color:#1D1D1F;">安全守护区域</span></div><span style="font-size:14px;color:#8E8E93;">' + userInfo.safeAreas + '个</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></div>' +
        '</div>' +
        // 通用
        '<div style="background:#fff;border-radius:16px;overflow:hidden;margin-bottom:12px;border:0.5px solid #E5E5EA;box-shadow:0 1px 3px rgba(0,0,0,0.04);">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:0.5px solid #F2F2F7;"><span style="font-size:15px;font-weight:600;color:#1D1D1F;">通用</span></div>' +
          '<div onclick="toggleAccountSwitch(this)" style="display:flex;align-items:center;padding:14px 16px;border-bottom:0.5px solid #F2F2F7;cursor:pointer;"><div style="flex:1;display:flex;align-items:center;gap:10px;"><div style="width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#5856D6,#007AFF);display:flex;align-items:center;justify-content:center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg></div><span style="font-size:15px;color:#1D1D1F;">深色模式</span></div><div class="switch" onclick="event.stopPropagation();toggleSwitch(this)" role="switch" aria-checked="false" aria-label="深色模式"></div></div>' +
          '<div onclick="toggleAccountSwitch(this)" style="display:flex;align-items:center;padding:14px 16px;cursor:pointer;"><div style="flex:1;display:flex;align-items:center;gap:10px;"><div style="width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#34C759,#30B0C7);display:flex;align-items:center;justify-content:center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12l2 2 4-4"/><path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c2.39 0 4.68.94 6.36 2.64"/></svg></div><span style="font-size:15px;color:#1D1D1F;">自动同步</span></div><div class="switch active" onclick="event.stopPropagation();toggleSwitch(this)" role="switch" aria-checked="true" aria-label="自动同步"></div></div>' +
        '</div>' +
        // 账号管理
        '<div style="background:#fff;border-radius:16px;overflow:hidden;margin-bottom:12px;border:0.5px solid #E5E5EA;box-shadow:0 1px 3px rgba(0,0,0,0.04);">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:0.5px solid #F2F2F7;"><span style="font-size:15px;font-weight:600;color:#1D1D1F;">账号管理</span></div>' +
          '<div onclick="openChangePassword()" role="button" tabindex="0" aria-label="修改密码" style="display:flex;align-items:center;padding:14px 16px;border-bottom:0.5px solid #F2F2F7;cursor:pointer;"><div style="flex:1;display:flex;align-items:center;gap:10px;"><div style="width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#FF9500,#FFCC00);display:flex;align-items:center;justify-content:center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div><span style="font-size:15px;color:#1D1D1F;">修改密码</span></div><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></div>' +
          '<div onclick="openDataExport()" role="button" tabindex="0" aria-label="数据导出" style="display:flex;align-items:center;padding:14px 16px;border-bottom:0.5px solid #F2F2F7;cursor:pointer;"><div style="flex:1;display:flex;align-items:center;gap:10px;"><div style="width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#34C759,#30B0C7);display:flex;align-items:center;justify-content:center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></div><span style="font-size:15px;color:#1D1D1F;">数据导出</span></div><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></div>' +
          '<div onclick="openUserAgreement()" role="button" tabindex="0" aria-label="用户协议" style="display:flex;align-items:center;padding:14px 16px;border-bottom:0.5px solid #F2F2F7;cursor:pointer;"><div style="flex:1;display:flex;align-items:center;gap:10px;"><div style="width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#007AFF,#5856D6);display:flex;align-items:center;justify-content:center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div><span style="font-size:15px;color:#1D1D1F;">用户协议</span></div><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></div>' +
          '<div onclick="openPrivacyPolicy()" role="button" tabindex="0" aria-label="隐私政策" style="display:flex;align-items:center;padding:14px 16px;cursor:pointer;"><div style="flex:1;display:flex;align-items:center;gap:10px;"><div style="width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#AF52DE,#5856D6);display:flex;align-items:center;justify-content:center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div><span style="font-size:15px;color:#1D1D1F;">隐私政策</span></div><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></div>' +
        '</div>';
    }
    // 退出登录 + 版本号（两个版本共有）
    settingsHtml +=
      '<div style="background:#fff;border-radius:16px;overflow:hidden;margin-bottom:12px;border:0.5px solid #E5E5EA;box-shadow:0 1px 3px rgba(0,0,0,0.04);">' +
        '<div onclick="confirmLogout()" style="display:flex;align-items:center;padding:14px 16px;cursor:pointer;"><div style="flex:1;display:flex;align-items:center;gap:10px;"><div style="width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#FF3B30,#FF2D55);display:flex;align-items:center;justify-content:center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg></div><span style="font-size:15px;color:#FF3B30;font-weight:500;">退出登录</span></div></div>' +
      '</div>' +
      '<div style="text-align:center;padding:16px;font-size:11px;color:#C7C7CC;">瞳伴 v1.0.0</div>';
    page.innerHTML =
      '<div class="community-nav-bar" style="position:relative;background:rgba(255,255,255,0.92);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);padding:10px 20px;border-bottom:0.5px solid rgba(0,0,0,0.06);display:flex;align-items:center;justify-content:center;">' +
        '<div onclick="closeSettings()" role="button" tabindex="0" aria-label="返回" style="position:absolute;left:16px;top:50%;transform:translateY(-50%);width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#007AFF;cursor:pointer;"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg></div>' +
        '<span style="font-size:17px;font-weight:600;color:#1D1D1F;">设置</span>' +
      '</div>' +
      '<div style="flex:1;overflow-y:auto;padding:12px;padding-bottom:90px;-webkit-overflow-scrolling:touch;">' +
        settingsHtml +
      '</div>';
    var phoneScreen = document.querySelector('.phone-screen') || document.body;
    phoneScreen.appendChild(page);
    settingsPageCreated = true;
  }
  function closeSettings() {
    switchTab('my');
    triggerHaptic('light');
  }
  // 实名认证
  function openRealNameAuth() {
    ensureRealNamePage();
    showScreen('realName');
    speak('实名认证', 'normal');
    triggerHaptic('light');
  }
  var realNamePageCreated = false;
  function ensureRealNamePage() {
    if (realNamePageCreated) return;
    var page = document.createElement('div');
    page.id = 'realNameScreen';
    page.className = 'screen';
    page.setAttribute('role', 'main');
    page.setAttribute('aria-label', '实名认证');
    page.style.cssText = 'background:#F2F2F7;padding-top:47px;display:none;flex-direction:column;overflow:hidden;';
    page.innerHTML =
      '<div class="community-nav-bar" style="position:relative;background:rgba(255,255,255,0.92);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);padding:10px 20px;border-bottom:0.5px solid rgba(0,0,0,0.06);display:flex;align-items:center;justify-content:center;">' +
        '<div onclick="closeRealName()" role="button" tabindex="0" aria-label="返回" style="position:absolute;left:16px;top:50%;transform:translateY(-50%);width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#007AFF;cursor:pointer;"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg></div>' +
        '<span style="font-size:17px;font-weight:600;color:#1D1D1F;">实名认证</span>' +
      '</div>' +
      '<div style="flex:1;overflow-y:auto;padding:12px;padding-bottom:90px;-webkit-overflow-scrolling:touch;">' +
        '<div style="background:linear-gradient(135deg,#5856D6,#007AFF);border-radius:18px;padding:20px;color:#fff;margin-bottom:12px;box-shadow:0 8px 24px rgba(88,86,214,0.25);text-align:center;">' +
          '<div style="width:56px;height:56px;border-radius:50%;background:rgba(255,255,255,0.25);display:flex;align-items:center;justify-content:center;margin:0 auto 12px;border:3px solid rgba(255,255,255,0.4);"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12l2 2 4-4"/><path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c2.39 0 4.68.94 6.36 2.64"/></svg></div>' +
          '<div style="font-size:18px;font-weight:700;margin-bottom:6px;">已完成实名认证</div>' +
          '<div style="font-size:13px;opacity:0.9;">实名信息有助于保障账号安全</div>' +
        '</div>' +
        '<div style="background:#fff;border-radius:16px;overflow:hidden;margin-bottom:12px;border:0.5px solid #E5E5EA;box-shadow:0 1px 3px rgba(0,0,0,0.04);">' +
          '<div style="padding:14px 16px;border-bottom:0.5px solid #F2F2F7;font-size:14px;font-weight:600;color:#1D1D1F;">认证信息</div>' +
          '<div style="padding:14px 16px;border-bottom:0.5px solid #F2F2F7;display:flex;justify-content:space-between;align-items:center;"><span style="font-size:15px;color:#8E8E93;">真实姓名</span><span style="font-size:15px;color:#1D1D1F;">张**</span></div>' +
          '<div style="padding:14px 16px;border-bottom:0.5px solid #F2F2F7;display:flex;justify-content:space-between;align-items:center;"><span style="font-size:15px;color:#8E8E93;">证件类型</span><span style="font-size:15px;color:#1D1D1F;">身份证</span></div>' +
          '<div style="padding:14px 16px;display:flex;justify-content:space-between;align-items:center;"><span style="font-size:15px;color:#8E8E93;">证件号码</span><span style="font-size:15px;color:#1D1D1F;">110***********1234</span></div>' +
        '</div>' +
        '<div style="background:#fff;border-radius:16px;overflow:hidden;margin-bottom:12px;border:0.5px solid #E5E5EA;box-shadow:0 1px 3px rgba(0,0,0,0.04);">' +
          '<div style="padding:14px 16px;border-bottom:0.5px solid #F2F2F7;font-size:14px;font-weight:600;color:#1D1D1F;">认证记录</div>' +
          '<div style="padding:14px 16px;display:flex;justify-content:space-between;align-items:center;"><span style="font-size:15px;color:#8E8E93;">认证时间</span><span style="font-size:15px;color:#1D1D1F;">2025-06-15</span></div>' +
        '</div>' +
        '<div style="font-size:13px;color:#8E8E93;line-height:1.6;padding:0 4px;">如需修改实名信息，请联系客服 400-888-8888。</div>' +
      '</div>';
    var phoneScreen = document.querySelector('.phone-screen') || document.body;
    phoneScreen.appendChild(page);
    realNamePageCreated = true;
  }
  function closeRealName() {
    switchTab('my');
    triggerHaptic('light');
  }
  function backToMyFromAccount() {
    switchTab('my');
    triggerHaptic('light');
  }
  // 帮助反馈
  function openHelpFeedback() {
    ensureHelpPage();
    showScreen('helpFeedback');
    speak('已进入帮助与反馈页面', 'normal');
    triggerHaptic('light');
  }
  var helpPageCreated = false;
  function ensureHelpPage() {
    if (helpPageCreated) return;
    var page = document.createElement('div');
    page.id = 'helpFeedbackScreen';
    page.className = 'screen';
    page.setAttribute('role', 'main');
    page.setAttribute('aria-label', '帮助与反馈');
    page.style.cssText = 'background:#F2F2F7;padding-top:47px;display:none;flex-direction:column;overflow:hidden;';
    page.innerHTML =
      '<div class="community-nav-bar" style="position:relative;background:rgba(255,255,255,0.92);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);padding:10px 20px;border-bottom:0.5px solid rgba(0,0,0,0.06);display:flex;align-items:center;justify-content:center;">' +
        '<div onclick="closeHelpFeedback()" role="button" tabindex="0" aria-label="返回" style="position:absolute;left:16px;top:50%;transform:translateY(-50%);width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#007AFF;cursor:pointer;"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg></div>' +
        '<span style="font-size:17px;font-weight:600;color:#1D1D1F;">帮助与反馈</span>' +
      '</div>' +
      '<div style="flex:1;overflow-y:auto;padding:12px;padding-bottom:90px;">' +
        '<div style="background:#fff;border-radius:14px;overflow:hidden;margin-bottom:12px;border:0.5px solid #E5E5EA;">' +
          '<div style="padding:14px 16px;border-bottom:0.5px solid #F2F2F7;font-size:14px;font-weight:600;color:#1D1D1F;">使用帮助</div>' +
          '<div onclick="showHelpArticle(\'入门\')" style="padding:14px 16px;border-bottom:0.5px solid #F2F2F7;display:flex;justify-content:space-between;align-items:center;cursor:pointer;"><span style="font-size:14px;color:#1D1D1F;">新手入门指南</span><span style="color:#C7C7CC;font-size:18px;">›</span></div>' +
          '<div onclick="showHelpArticle(\'手势\')" style="padding:14px 16px;border-bottom:0.5px solid #F2F2F7;display:flex;justify-content:space-between;align-items:center;cursor:pointer;"><span style="font-size:14px;color:#1D1D1F;">手势操作说明</span><span style="color:#C7C7CC;font-size:18px;">›</span></div>' +
          '<div onclick="showHelpArticle(\'导航\')" style="padding:14px 16px;border-bottom:0.5px solid #F2F2F7;display:flex;justify-content:space-between;align-items:center;cursor:pointer;"><span style="font-size:14px;color:#1D1D1F;">导航使用说明</span><span style="color:#C7C7CC;font-size:18px;">›</span></div>' +
          '<div onclick="showHelpArticle(\'围栏\')" style="padding:14px 16px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;"><span style="font-size:14px;color:#1D1D1F;">安全围栏说明</span><span style="color:#C7C7CC;font-size:18px;">›</span></div>' +
        '</div>' +
        '<div style="background:#fff;border-radius:14px;overflow:hidden;margin-bottom:12px;border:0.5px solid #E5E5EA;">' +
          '<div style="padding:14px 16px;border-bottom:0.5px solid #F2F2F7;font-size:14px;font-weight:600;color:#1D1D1F;">意见反馈</div>' +
          '<textarea placeholder="请描述您遇到的问题或建议..." style="width:100%;min-height:120px;padding:14px 16px;border:none;background:transparent;font-size:14px;color:#1D1D1F;outline:none;resize:none;font-family:inherit;" aria-label="反馈内容输入框"></textarea>' +
          '<div style="padding:0 16px 14px;display:flex;justify-content:flex-end;"><button onclick="submitFeedback()" style="background:#007AFF;color:#fff;border:none;padding:8px 18px;border-radius:10px;font-size:13px;font-weight:500;cursor:pointer;">提交反馈</button></div>' +
        '</div>' +
        '<div style="background:#fff;border-radius:14px;overflow:hidden;margin-bottom:12px;border:0.5px solid #E5E5EA;">' +
          '<div onclick="contactCustomerService()" style="padding:14px 16px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;"><span style="font-size:14px;color:#1D1D1F;">联系客服</span><span style="color:#8E8E93;font-size:13px;">400-888-8888 ›</span></div>' +
        '</div>' +
        '<div style="text-align:center;padding:16px;font-size:11px;color:#C7C7CC;">瞳伴 v1.0.0</div>' +
      '</div>';
    var phoneScreen = document.querySelector('.phone-screen') || document.body;
    phoneScreen.appendChild(page);
    helpPageCreated = true;
  }
  function closeHelpFeedback() {
    switchTab('my');
    triggerHaptic('light');
  }
  function showHelpArticle(topic) {
    showFeedback('查看帮助文章：' + topic, 'info');
    speak('正在显示帮助文章', 'normal');
    triggerHaptic('light');
  }
  function submitFeedback() {
    showFeedback('反馈已提交，感谢您的支持', 'success');
    speak('反馈已提交，感谢您的支持', 'normal');
    triggerHaptic('light');
    closeHelpFeedback();
  }
  function contactCustomerService() {
    showFeedback('客服热线：400-888-8888', 'info');
    speak('客服热线 400-888-8888', 'normal');
    triggerHaptic('light');
  }

  // 我的收藏
  function openMyFavorites() {
    ensureFavoritesPage();
    showScreen('myFavorites');
    speak('已进入我的收藏', 'normal');
    triggerHaptic('light');
  }
  var favoritesPageCreated = false;
  function ensureFavoritesPage() {
    if (favoritesPageCreated) return;
    var page = document.createElement('div');
    page.id = 'myFavoritesScreen';
    page.className = 'screen';
    page.setAttribute('role', 'main');
    page.setAttribute('aria-label', '我的收藏');
    page.style.cssText = 'background:#F2F2F7;padding-top:47px;display:none;flex-direction:column;overflow:hidden;';
    var favs = [
      { name: '万达广场', address: '朝阳区建国路93号', type: '常去地' },
      { name: '北京同仁医院', address: '东城区东单公园内', type: '医院' },
      { name: '家', address: '朝阳区望京园', type: '家' }
    ];
    var listHtml = favs.map(function(f) {
      return '<div style="background:#fff;border-radius:14px;padding:14px;margin-bottom:8px;border:0.5px solid #E5E5EA;display:flex;align-items:center;gap:12px;cursor:pointer;" onclick="showFeedback(\'查看 ' + f.name + ' 路线\',\'info\')"><div style="width:40px;height:40px;border-radius:10px;background:#007AFF15;color:#007AFF;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z"/><circle cx="12" cy="10" r="2.5"/></svg></div><div style="flex:1;"><div style="font-size:14px;font-weight:600;color:#1D1D1F;">' + f.name + '</div><div style="font-size:12px;color:#8E8E93;margin-top:2px;">' + f.address + '</div></div><span style="font-size:11px;padding:3px 8px;border-radius:8px;background:#F2F2F7;color:#8E8E93;">' + f.type + '</span></div>';
    }).join('');
    page.innerHTML =
      '<div class="community-nav-bar" style="position:relative;background:rgba(255,255,255,0.92);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);padding:10px 20px;border-bottom:0.5px solid rgba(0,0,0,0.06);display:flex;align-items:center;justify-content:center;">' +
        '<div onclick="closeFavorites()" role="button" tabindex="0" aria-label="返回" style="position:absolute;left:16px;top:50%;transform:translateY(-50%);width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#007AFF;cursor:pointer;"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg></div>' +
        '<span style="font-size:17px;font-weight:600;color:#1D1D1F;">我的收藏</span>' +
        '<div onclick="addNewFavorite()" role="button" tabindex="0" aria-label="添加收藏" style="position:absolute;right:16px;top:50%;transform:translateY(-50%);width:32px;height:32px;border-radius:50%;background:#007AFF;color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></div>' +
      '</div>' +
      '<div style="flex:1;overflow-y:auto;padding:12px;padding-bottom:90px;">' + listHtml + '</div>';
    var phoneScreen = document.querySelector('.phone-screen') || document.body;
    phoneScreen.appendChild(page);
    favoritesPageCreated = true;
  }
  function closeFavorites() {
    switchTab('my');
    triggerHaptic('light');
  }
  function addNewFavorite() {
    showFeedback('请在地图上选择要收藏的地点', 'info');
    speak('请在地图上选择要收藏的地点', 'normal');
    triggerHaptic('light');
  }

  // 出行历史
  function openTravelHistory() {
    ensureTravelHistoryPage();
    showScreen('travelHistory');
    speak('已进入出行历史', 'normal');
    triggerHaptic('light');
  }
  var travelHistoryCreated = false;
  function ensureTravelHistoryPage() {
    if (travelHistoryCreated) return;
    var page = document.createElement('div');
    page.id = 'travelHistoryScreen';
    page.className = 'screen';
    page.setAttribute('role', 'main');
    page.setAttribute('aria-label', '出行历史');
    page.style.cssText = 'background:#F2F2F7;padding-top:47px;display:none;flex-direction:column;overflow:hidden;';
    var trips = [
      { date: '今天 14:30', from: '家', to: '万达广场', distance: '2.3km', duration: '32分钟', mode: '步行+公交' },
      { date: '今天 09:15', from: '家', to: '北京同仁医院', distance: '1.8km', duration: '25分钟', mode: '步行' },
      { date: '昨天 18:00', from: '万达广场', to: '家', distance: '2.3km', duration: '28分钟', mode: '打车' },
      { date: '前天 10:00', from: '家', to: '社区公园', distance: '0.8km', duration: '10分钟', mode: '步行' }
    ];
    var listHtml = trips.map(function(t) {
      return '<div style="background:#fff;border-radius:14px;padding:14px;margin-bottom:8px;border:0.5px solid #E5E5EA;"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;"><span style="font-size:13px;color:#1D1D1F;font-weight:600;">' + t.from + ' → ' + t.to + '</span><span style="font-size:11px;color:#8E8E93;">' + t.date + '</span></div><div style="display:flex;gap:12px;font-size:11px;color:#8E8E93;"><span>' + t.mode + '</span><span>·</span><span>' + t.distance + '</span><span>·</span><span>' + t.duration + '</span></div></div>';
    }).join('');
    page.innerHTML =
      '<div class="community-nav-bar" style="position:relative;background:rgba(255,255,255,0.92);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);padding:10px 20px;border-bottom:0.5px solid rgba(0,0,0,0.06);display:flex;align-items:center;justify-content:center;">' +
        '<div onclick="closeTravelHistory()" role="button" tabindex="0" aria-label="返回" style="position:absolute;left:16px;top:50%;transform:translateY(-50%);width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#007AFF;cursor:pointer;"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg></div>' +
        '<span style="font-size:17px;font-weight:600;color:#1D1D1F;">出行历史</span>' +
      '</div>' +
      '<div style="flex:1;overflow-y:auto;padding:12px;padding-bottom:90px;">' + listHtml + '</div>';
    var phoneScreen = document.querySelector('.phone-screen') || document.body;
    phoneScreen.appendChild(page);
    travelHistoryCreated = true;
  }
  function closeTravelHistory() {
    switchTab('my');
    triggerHaptic('light');
  }

  // 修改密码
  function openChangePassword() {
    ensureChangePasswordPage();
    showScreen('changePassword');
    speak('修改密码', 'normal');
    triggerHaptic('light');
  }
  var changePasswordCreated = false;
  function ensureChangePasswordPage() {
    if (changePasswordCreated) return;
    var page = document.createElement('div');
    page.id = 'changePasswordScreen';
    page.className = 'screen';
    page.setAttribute('role', 'main');
    page.setAttribute('aria-label', '修改密码');
    page.style.cssText = 'background:#F2F2F7;padding-top:47px;display:none;flex-direction:column;overflow:hidden;';
    page.innerHTML =
      '<div class="community-nav-bar" style="position:relative;background:rgba(255,255,255,0.92);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);padding:10px 20px;border-bottom:0.5px solid rgba(0,0,0,0.06);display:flex;align-items:center;justify-content:center;">' +
        '<div onclick="closeChangePassword()" role="button" tabindex="0" aria-label="返回" style="position:absolute;left:16px;top:50%;transform:translateY(-50%);width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#007AFF;cursor:pointer;"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg></div>' +
        '<span style="font-size:17px;font-weight:600;color:#1D1D1F;">修改密码</span>' +
      '</div>' +
      '<div style="flex:1;overflow-y:auto;padding:16px;padding-bottom:90px;">' +
        '<div style="background:#fff;border-radius:14px;padding:6px 16px;border:0.5px solid #E5E5EA;margin-bottom:12px;">' +
          '<input type="password" placeholder="请输入当前密码" aria-label="当前密码" style="width:100%;height:48px;border:none;background:transparent;font-size:15px;color:#1D1D1F;outline:none;" />' +
          '<div style="height:0.5px;background:#F2F2F7;"></div>' +
          '<input type="password" placeholder="请输入新密码" aria-label="新密码" style="width:100%;height:48px;border:none;background:transparent;font-size:15px;color:#1D1D1F;outline:none;" />' +
          '<div style="height:0.5px;background:#F2F2F7;"></div>' +
          '<input type="password" placeholder="请确认新密码" aria-label="确认新密码" style="width:100%;height:48px;border:none;background:transparent;font-size:15px;color:#1D1D1F;outline:none;" />' +
        '</div>' +
        '<div style="font-size:12px;color:#8E8E93;padding:0 4px 16px;line-height:1.6;">密码需 8-20 位，包含字母和数字</div>' +
        '<button onclick="submitChangePassword()" style="width:100%;background:linear-gradient(135deg,#007AFF,#5856D6);color:#fff;border:none;padding:14px;border-radius:14px;font-size:15px;font-weight:600;cursor:pointer;box-shadow:0 6px 20px rgba(0,122,255,0.25);">确认修改</button>' +
      '</div>';
    var phoneScreen = document.querySelector('.phone-screen') || document.body;
    phoneScreen.appendChild(page);
    changePasswordCreated = true;
  }
  function closeChangePassword() {
    showScreen('account');
    triggerHaptic('light');
  }
  function submitChangePassword() {
    showFeedback('密码修改成功', 'success');
    speak('密码修改成功', 'normal');
    triggerHaptic('light');
    closeChangePassword();
  }

  // 数据导出
  function openDataExport() {
    ensureDataExportPage();
    showScreen('dataExport');
    speak('数据导出', 'normal');
    triggerHaptic('light');
  }
  var dataExportCreated = false;
  function ensureDataExportPage() {
    if (dataExportCreated) return;
    var page = document.createElement('div');
    page.id = 'dataExportScreen';
    page.className = 'screen';
    page.setAttribute('role', 'main');
    page.setAttribute('aria-label', '数据导出');
    page.style.cssText = 'background:#F2F2F7;padding-top:47px;display:none;flex-direction:column;overflow:hidden;';
    var items = [
      { name: '出行记录', count: '128条', icon: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z', color: '#007AFF' },
      { name: '收藏地点', count: '5个', icon: 'M12 22s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z', color: '#FF2D55' },
      { name: '社区分享', count: '56帖', icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z', color: '#34C759' },
      { name: '预警记录', count: '12条', icon: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z', color: '#FF9500' }
    ];
    var listHtml = items.map(function(i) {
      return '<div style="background:#fff;border-radius:14px;padding:14px;margin-bottom:8px;border:0.5px solid #E5E5EA;display:flex;align-items:center;gap:12px;"><div style="width:36px;height:36px;border-radius:10px;background:' + i.color + '15;color:' + i.color + ';display:flex;align-items:center;justify-content:center;flex-shrink:0;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="' + i.icon + '"/></svg></div><div style="flex:1;"><div style="font-size:14px;color:#1D1D1F;font-weight:500;">' + i.name + '</div><div style="font-size:11px;color:#8E8E93;margin-top:2px;">' + i.count + '</div></div><input type="checkbox" checked style="width:20px;height:20px;cursor:pointer;" aria-label="导出' + i.name + '" /></div>';
    }).join('');
    page.innerHTML =
      '<div class="community-nav-bar" style="position:relative;background:rgba(255,255,255,0.92);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);padding:10px 20px;border-bottom:0.5px solid rgba(0,0,0,0.06);display:flex;align-items:center;justify-content:center;">' +
        '<div onclick="closeDataExport()" role="button" tabindex="0" aria-label="返回" style="position:absolute;left:16px;top:50%;transform:translateY(-50%);width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#007AFF;cursor:pointer;"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg></div>' +
        '<span style="font-size:17px;font-weight:600;color:#1D1D1F;">数据导出</span>' +
      '</div>' +
      '<div style="flex:1;overflow-y:auto;padding:16px;padding-bottom:90px;">' +
        '<div style="font-size:12px;color:#8E8E93;margin-bottom:12px;padding:0 4px;">选择要导出的数据类型，导出文件将以加密形式发送至您的邮箱</div>' +
        listHtml +
        '<div style="background:#fff;border-radius:14px;padding:14px;margin:12px 0 14px;border:0.5px solid #E5E5EA;"><div style="font-size:13px;color:#8E8E93;margin-bottom:8px;">接收邮箱</div><input type="email" placeholder="请输入邮箱地址" value="user@example.com" style="width:100%;border:none;background:#F2F2F7;border-radius:8px;padding:10px 12px;font-size:14px;color:#1D1D1F;outline:none;" aria-label="接收邮箱" /></div>' +
        '<button onclick="submitDataExport()" style="width:100%;background:linear-gradient(135deg,#34C759,#30B0C7);color:#fff;border:none;padding:14px;border-radius:14px;font-size:15px;font-weight:600;cursor:pointer;box-shadow:0 6px 20px rgba(52,199,89,0.25);">立即导出</button>' +
      '</div>';
    var phoneScreen = document.querySelector('.phone-screen') || document.body;
    phoneScreen.appendChild(page);
    dataExportCreated = true;
  }
  function closeDataExport() {
    showScreen('account');
    triggerHaptic('light');
  }
  function submitDataExport() {
    showFeedback('数据导出请求已提交，文件将在5分钟内发送至您的邮箱', 'success');
    speak('数据导出请求已提交，文件将在5分钟内发送至您的邮箱', 'normal');
    triggerHaptic('light');
    closeDataExport();
  }

  // 用户协议
  function openUserAgreement() {
    ensureLegalPage('userAgreement');
    showScreen('userAgreement');
    speak('用户协议', 'normal');
    triggerHaptic('light');
  }
  // 隐私政策
  function openPrivacyPolicy() {
    ensureLegalPage('privacyPolicy');
    showScreen('privacyPolicy');
    speak('隐私政策', 'normal');
    triggerHaptic('light');
  }
  function ensureLegalPage(type) {
    var id = type + 'Screen';
    if (document.getElementById(id)) return;
    var isAgreement = type === 'userAgreement';
    var title = isAgreement ? '用户协议' : '隐私政策';
    var content = isAgreement ?
      '<p style="margin-bottom:12px;">欢迎使用瞳伴。瞳伴是一款专为视障人士设计的出行辅助应用，<b>永久免费、无广告</b>，致力于为视障用户提供安全、便捷的出行体验。</p>' +
      '<p style="margin-bottom:12px;"><b>1. 服务内容</b><br/>我们提供语音导航、AI环境识别、家人守护、社区互助等服务。所有核心功能永久免费。</p>' +
      '<p style="margin-bottom:12px;"><b>2. 用户责任</b><br/>请如实注册账号，不得利用本应用从事违法活动。视障用户请在家属指导下使用。</p>' +
      '<p style="margin-bottom:12px;"><b>3. 知识产权</b><br/>本应用的所有内容版权归瞳伴团队所有，未经授权不得复制或传播。</p>' +
      '<p style="margin-bottom:12px;"><b>4. 服务变更</b><br/>我们可能随时调整服务内容，但承诺核心出行功能始终免费。</p>' +
      '<p style="margin-bottom:12px;"><b>5. 争议解决</b><br/>本协议受中华人民共和国法律管辖。</p>'
      :
      '<p style="margin-bottom:12px;">瞳伴非常重视您的隐私，特别是视障用户的敏感数据。<b>我们承诺不投放任何广告，不进行任何第三方数据追踪</b>。</p>' +
      '<p style="margin-bottom:12px;"><b>1. 信息收集</b><br/>仅收集必要的出行位置、紧急联系人等数据，用于提供核心服务。</p>' +
      '<p style="margin-bottom:12px;"><b>2. 信息使用</b><br/>收集的信息仅用于改进服务体验，绝不用于商业广告或第三方共享。</p>' +
      '<p style="margin-bottom:12px;"><b>3. 信息存储</b><br/>数据采用加密存储，传输使用 HTTPS 加密通道。</p>' +
      '<p style="margin-bottom:12px;"><b>4. 用户权利</b><br/>您可随时查看、修改、删除个人信息，或注销账号。</p>' +
      '<p style="margin-bottom:12px;"><b>5. 未成年人保护</b><br/>未成年用户须在监护人同意下使用。</p>';
    var page = document.createElement('div');
    page.id = id;
    page.className = 'screen';
    page.setAttribute('role', 'main');
    page.setAttribute('aria-label', title);
    page.style.cssText = 'background:#F2F2F7;padding-top:47px;display:none;flex-direction:column;overflow:hidden;';
    page.innerHTML =
      '<div class="community-nav-bar" style="position:relative;background:rgba(255,255,255,0.92);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);padding:10px 20px;border-bottom:0.5px solid rgba(0,0,0,0.06);display:flex;align-items:center;justify-content:center;">' +
        '<div onclick="closeLegalPage()" role="button" tabindex="0" aria-label="返回" style="position:absolute;left:16px;top:50%;transform:translateY(-50%);width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#007AFF;cursor:pointer;"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg></div>' +
        '<span style="font-size:17px;font-weight:600;color:#1D1D1F;">' + title + '</span>' +
      '</div>' +
      '<div style="flex:1;overflow-y:auto;padding:16px;padding-bottom:90px;">' +
        '<div style="background:#fff;border-radius:14px;padding:20px;border:0.5px solid #E5E5EA;font-size:14px;color:#1D1D1F;line-height:1.7;">' + content + '</div>' +
        '<div style="text-align:center;padding:16px;font-size:11px;color:#C7C7CC;">最后更新：2026年7月 · 瞳伴 v1.0.0</div>' +
      '</div>';
    var phoneScreen = document.querySelector('.phone-screen') || document.body;
    phoneScreen.appendChild(page);
  }
  function closeLegalPage() {
    showScreen('login');
    triggerHaptic('light');
  }

  // 忘记密码
  function openForgotPassword() {
    ensureForgotPasswordPage();
    showScreen('forgotPassword');
    speak('重置密码', 'normal');
    triggerHaptic('light');
  }

  // 第三方登录（演示模拟流程）
  var thirdPartyNames = {
    wechat: '微信',
    apple: 'Apple ID',
    qq: 'QQ',
    alipay: '支付宝',
    weibo: '微博'
  };
  var thirdPartyColors = {
    wechat: '#07C160',
    apple: '#000000',
    qq: '#12B7F5',
    alipay: '#1677FF',
    weibo: '#E6162D'
  };
  function thirdPartyLogin(platform) {
    var name = thirdPartyNames[platform] || '第三方';
    var color = thirdPartyColors[platform] || '#007AFF';
    showFeedback('正在唤起' + name + '登录…', 'info', 1500);
    speak('正在使用' + name + '登录');
    triggerHaptic('light');
    // 模拟 OAuth 授权流程
    setTimeout(function() {
      var fakePhone = platform + '_' + Math.floor(100000 + Math.random() * 900000);
      var fakeName = name + '用户';
      var now = new Date();
      var users = getStoredUsers();
      var user = users.find(function(u) { return u.phone === fakePhone; });
      if (!user) {
        user = {
          name: fakeName,
          phone: fakePhone,
          password: 'third_party',
          role: selectedLoginRole,
          avatarColor: color,
          registerDate: now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0'),
          totalTrips: 0,
          emergencyContacts: 0,
          safeAreas: 0,
          createdAt: now.getTime()
        };
        users.push(user);
        saveStoredUsers(users);
      }
      isLoggedIn = true;
      currentUser = user;
      updateUserInfoFromCurrentUser();
      setCurrentSession(fakePhone);
      refreshMyPageUI();
      // 重置角色相关页面缓存，确保切换角色后内容正确
      resetRoleSensitivePages();
      if (selectedLoginRole !== 'family') {
        speak(name + '登录成功，欢迎回来');
      }
      showFeedback(name + '登录成功', 'success');
      triggerHaptic('success');
      // 保存角色
      userRole = selectedLoginRole;
      try { localStorage.setItem('tongban_role', userRole); } catch(e) {}
      applyRoleUI();
      setTimeout(function() {
        if (userRole === 'family') {
          showScreen('family');
          switchTab('family');
        } else {
          showScreen('wake');
          switchTab('home');
        }
      }, 500);
    }, 1500);
  }
  var forgotPasswordCreated = false;
  function ensureForgotPasswordPage() {
    if (forgotPasswordCreated) return;
    var page = document.createElement('div');
    page.id = 'forgotPasswordScreen';
    page.className = 'screen';
    page.setAttribute('role', 'main');
    page.setAttribute('aria-label', '重置密码');
    page.style.cssText = 'background:#F2F2F7;padding-top:47px;display:none;flex-direction:column;overflow:hidden;';
    page.innerHTML =
      '<div class="community-nav-bar" style="position:relative;background:rgba(255,255,255,0.92);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);padding:10px 20px;border-bottom:0.5px solid rgba(0,0,0,0.06);display:flex;align-items:center;justify-content:center;">' +
        '<div onclick="closeForgotPassword()" role="button" tabindex="0" aria-label="返回登录" style="position:absolute;left:16px;top:50%;transform:translateY(-50%);width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#007AFF;cursor:pointer;"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg></div>' +
        '<span style="font-size:17px;font-weight:600;color:#1D1D1F;">重置密码</span>' +
      '</div>' +
      '<div style="flex:1;overflow-y:auto;padding:16px;padding-bottom:90px;">' +
        '<div style="background:#fff;border-radius:14px;padding:6px 16px;border:0.5px solid #E5E5EA;margin-bottom:12px;">' +
          '<div style="display:flex;align-items:center;height:48px;"><input type="tel" placeholder="请输入手机号" maxlength="11" style="flex:1;height:48px;border:none;background:transparent;font-size:15px;color:#1D1D1F;outline:none;" aria-label="手机号" /><button onclick="sendResetCode(this)" style="background:#F2F2F7;border:none;padding:6px 12px;border-radius:8px;font-size:12px;color:#007AFF;cursor:pointer;">获取验证码</button></div>' +
          '<div style="height:0.5px;background:#F2F2F7;"></div>' +
          '<input type="text" placeholder="请输入验证码" maxlength="6" style="width:100%;height:48px;border:none;background:transparent;font-size:15px;color:#1D1D1F;outline:none;" aria-label="验证码" />' +
          '<div style="height:0.5px;background:#F2F2F7;"></div>' +
          '<input type="password" placeholder="请输入新密码" style="width:100%;height:48px;border:none;background:transparent;font-size:15px;color:#1D1D1F;outline:none;" aria-label="新密码" />' +
        '</div>' +
        '<div style="font-size:12px;color:#8E8E93;padding:0 4px 16px;line-height:1.6;">新密码需 8-20 位，包含字母和数字</div>' +
        '<button onclick="submitResetPassword()" style="width:100%;background:linear-gradient(135deg,#007AFF,#5856D6);color:#fff;border:none;padding:14px;border-radius:14px;font-size:15px;font-weight:600;cursor:pointer;box-shadow:0 6px 20px rgba(0,122,255,0.25);">确认重置</button>' +
      '</div>';
    var phoneScreen = document.querySelector('.phone-screen') || document.body;
    phoneScreen.appendChild(page);
    forgotPasswordCreated = true;
  }
  function closeForgotPassword() {
    showScreen('login');
    triggerHaptic('light');
  }
  function sendResetCode(btn) {
    btn.disabled = true;
    var count = 60;
    btn.textContent = count + '秒后重试';
    var timer = setInterval(function() {
      count--;
      if (count <= 0) {
        clearInterval(timer);
        btn.disabled = false;
        btn.textContent = '获取验证码';
      } else {
        btn.textContent = count + '秒后重试';
      }
    }, 1000);
    showFeedback('验证码已发送', 'success');
    speak('验证码已发送', 'normal');
  }
  function submitResetPassword() {
    showFeedback('密码重置成功，请使用新密码登录', 'success');
    speak('密码重置成功', 'normal');
    triggerHaptic('light');
    closeForgotPassword();
  }

  // 评论编辑器
  function openCommentEditor() {
    var overlay = document.getElementById('commentOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'commentOverlay';
      overlay.style.cssText = 'position:absolute;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:flex-end;';
      overlay.innerHTML =
        '<div style="background:#fff;width:100%;border-radius:18px 18px 0 0;padding:16px;max-height:60%;display:flex;flex-direction:column;">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;"><span style="font-size:15px;font-weight:600;color:#1D1D1F;">发表评论</span><div onclick="closeCommentEditor()" role="button" tabindex="0" aria-label="关闭" style="color:#8E8E93;font-size:22px;cursor:pointer;width:32px;height:32px;display:flex;align-items:center;justify-content:center;">×</div></div>' +
          '<textarea placeholder="说说你的看法..." aria-label="评论内容" style="width:100%;min-height:100px;border:0.5px solid #E5E5EA;border-radius:10px;padding:12px;font-size:14px;color:#1D1D1F;outline:none;resize:none;font-family:inherit;margin-bottom:12px;"></textarea>' +
          '<button onclick="submitComment()" style="background:#007AFF;color:#fff;border:none;padding:12px;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;">发表</button>' +
        '</div>';
      var phoneScreen = document.querySelector('.phone-screen') || document.body;
      phoneScreen.appendChild(overlay);
    } else {
      overlay.style.display = 'flex';
    }
    triggerHaptic('light');
  }
  function closeCommentEditor() {
    var overlay = document.getElementById('commentOverlay');
    if (overlay) overlay.style.display = 'none';
    triggerHaptic('light');
  }
  function submitComment() {
    // 读取评论编辑器中的输入框（兼容 commentInput 与 commentEditorInput）
    var input = document.getElementById('commentEditorInput') || document.getElementById('commentInput');
    if (input && input.value.trim()) {
      input.value = '';
      closeCommentEditor();
      showFeedback('评论已发表', 'success');
      speak('评论已发表', 'normal');
      triggerHaptic('light');
    } else {
      showFeedback('请输入评论内容', 'warning');
      speak('请输入评论内容');
    }
  }

  // 分享面板
  function openShareSheet() {
    var overlay = document.getElementById('shareOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'shareOverlay';
      overlay.style.cssText = 'position:absolute;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:flex-end;';
      var platforms = [
        { name: '微信', icon: 'M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.144-.048.219 0 .163.13.295.29.295a.328.328 0 0 0 .167-.054l1.727-.995a.59.59 0 0 1 .5-.038 8.73 8.73 0 0 0 2.93.503c.21 0 .417-.012.623-.029a4.39 4.39 0 0 1-.18-1.236c0-2.552 2.428-4.623 5.42-4.623.18 0 .357.012.532.026-.515-2.964-3.658-5.226-7.566-5.226', color: '#07C160' },
        { name: '朋友圈', icon: 'M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.144-.048.219 0 .163.13.295.29.295a.328.328 0 0 0 .167-.054l1.727-.995a.59.59 0 0 1 .5-.038 8.73 8.73 0 0 0 2.93.503c.21 0 .417-.012.623-.029a4.39 4.39 0 0 1-.18-1.236c0-2.552 2.428-4.623 5.42-4.623.18 0 .357.012.532.026-.515-2.964-3.658-5.226-7.566-5.226', color: '#07C160' },
        { name: 'QQ', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2', color: '#12B7F5' },
        { name: '微博', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2', color: '#E6162D' },
        { name: '复制链接', icon: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71', color: '#8E8E93' }
      ];
      var itemsHtml = platforms.map(function(p) {
        return '<div onclick="shareToPlatform(\'' + p.name + '\')" role="button" tabindex="0" aria-label="分享到' + p.name + '" style="display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer;padding:8px;"><div style="width:44px;height:44px;border-radius:50%;background:' + p.color + ';color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;">' + p.name.charAt(0) + '</div><span style="font-size:11px;color:#3C3C43;">' + p.name + '</span></div>';
      }).join('');
      overlay.innerHTML =
        '<div style="background:#fff;width:100%;border-radius:18px 18px 0 0;padding:16px;">' +
          '<div style="text-align:center;font-size:14px;font-weight:600;color:#1D1D1F;margin-bottom:14px;">分享到</div>' +
          '<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:14px;">' + itemsHtml + '</div>' +
          '<button onclick="closeShareSheet()" style="width:100%;background:#F2F2F7;border:none;padding:12px;border-radius:10px;font-size:14px;color:#1D1D1F;cursor:pointer;font-weight:500;">取消</button>' +
        '</div>';
      var phoneScreen = document.querySelector('.phone-screen') || document.body;
      phoneScreen.appendChild(overlay);
    } else {
      overlay.style.display = 'flex';
    }
    triggerHaptic('light');
  }
  function closeShareSheet() {
    var overlay = document.getElementById('shareOverlay');
    if (overlay) overlay.style.display = 'none';
    triggerHaptic('light');
  }
  function shareToPlatform(name) {
    closeShareSheet();
    showFeedback('已分享到' + name, 'success');
    speak('已分享到' + name, 'normal');
    triggerHaptic('light');
  }

  // 添加联系人编辑器
  function openAddContactEditor(type) {
    var overlay = document.getElementById('addContactOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'addContactOverlay';
      overlay.style.cssText = 'position:absolute;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:flex-end;';
      overlay.innerHTML =
        '<div style="background:#fff;width:100%;border-radius:18px 18px 0 0;padding:16px;">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;"><span style="font-size:15px;font-weight:600;color:#1D1D1F;">添加' + type + '</span><div onclick="closeAddContactEditor()" role="button" tabindex="0" aria-label="关闭" style="color:#8E8E93;font-size:22px;cursor:pointer;width:32px;height:32px;display:flex;align-items:center;justify-content:center;">×</div></div>' +
          '<div style="background:#fff;border-radius:10px;border:0.5px solid #E5E5EA;padding:6px 12px;margin-bottom:12px;"><input type="text" placeholder="姓名" aria-label="联系人姓名" style="width:100%;height:42px;border:none;background:transparent;font-size:14px;color:#1D1D1F;outline:none;" /></div>' +
          '<div style="background:#fff;border-radius:10px;border:0.5px solid #E5E5EA;padding:6px 12px;margin-bottom:12px;"><input type="tel" placeholder="手机号" maxlength="11" aria-label="联系人手机号" style="width:100%;height:42px;border:none;background:transparent;font-size:14px;color:#1D1D1F;outline:none;" /></div>' +
          '<div style="background:#fff;border-radius:10px;border:0.5px solid #E5E5EA;padding:6px 12px;margin-bottom:14px;"><input type="text" placeholder="关系（如：父亲、母亲、配偶）" aria-label="与联系人关系" style="width:100%;height:42px;border:none;background:transparent;font-size:14px;color:#1D1D1F;outline:none;" /></div>' +
          '<button onclick="submitAddContact()" style="width:100%;background:linear-gradient(135deg,#007AFF,#5856D6);color:#fff;border:none;padding:12px;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;">保存联系人</button>' +
        '</div>';
      var phoneScreen = document.querySelector('.phone-screen') || document.body;
      phoneScreen.appendChild(overlay);
    } else {
      // 更新标题
      var titleEl = overlay.querySelector('span');
      if (titleEl) titleEl.textContent = '添加' + type;
      overlay.style.display = 'flex';
    }
    triggerHaptic('light');
  }
  function closeAddContactEditor() {
    var overlay = document.getElementById('addContactOverlay');
    if (overlay) overlay.style.display = 'none';
    triggerHaptic('light');
  }
  function submitAddContact() {
    var overlay = document.getElementById('addContactOverlay');
    var inputs = overlay ? overlay.querySelectorAll('input') : [];
    var name = inputs[0] ? inputs[0].value.trim() : '';
    var phone = inputs[1] ? inputs[1].value.trim() : '';
    var relation = inputs[2] ? inputs[2].value.trim() : '其他';
    if (!name || !phone) {
      showFeedback('请填写姓名和手机号', 'info');
      return;
    }
    closeAddContactEditor();
    // 添加到紧急联系人列表
    var newId = emergencyContactsData.length > 0 ? Math.max.apply(null, emergencyContactsData.map(function(c){return c.id;})) + 1 : 1;
    var maskedPhone = phone.length >= 11 ? phone.substring(0,3) + '****' + phone.substring(7) : phone;
    emergencyContactsData.push({ id: newId, name: name, phone: maskedPhone, relation: relation || '其他' });
    userInfo.emergencyContacts = emergencyContactsData.length;
    // 清空输入框
    if (inputs[0]) inputs[0].value = '';
    if (inputs[1]) inputs[1].value = '';
    if (inputs[2]) inputs[2].value = '';
    renderEmergencyContactsList();
    refreshMyPageUI();
    showFeedback('联系人添加成功', 'success');
    speak('联系人' + name + '添加成功', 'normal');
    triggerHaptic('light');
  }

  // 围栏详情页
  function openFenceDetailPage() {
    ensureFenceDetailPage();
    showScreen('fenceDetail');
    speak('围栏详情', 'normal');
    triggerHaptic('light');
  }
  var fenceDetailCreated = false;
  function ensureFenceDetailPage() {
    if (fenceDetailCreated) return;
    var page = document.createElement('div');
    page.id = 'fenceDetailScreen';
    page.className = 'screen';
    page.setAttribute('role', 'main');
    page.setAttribute('aria-label', '围栏详情');
    page.style.cssText = 'background:#F2F2F7;padding-top:47px;display:none;flex-direction:column;overflow:hidden;';
    page.innerHTML =
      '<div class="community-nav-bar" style="position:relative;background:rgba(255,255,255,0.92);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);padding:10px 20px;border-bottom:0.5px solid rgba(0,0,0,0.06);display:flex;align-items:center;justify-content:center;">' +
        '<div onclick="closeFenceDetail()" role="button" tabindex="0" aria-label="返回" style="position:absolute;left:16px;top:50%;transform:translateY(-50%);width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#007AFF;cursor:pointer;"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg></div>' +
        '<span style="font-size:17px;font-weight:600;color:#1D1D1F;">围栏详情</span>' +
      '</div>' +
      '<div style="flex:1;overflow-y:auto;padding:12px;padding-bottom:90px;">' +
        '<div style="background:linear-gradient(135deg,#34C759,#30D158);border-radius:14px;padding:18px;color:#fff;margin-bottom:12px;">' +
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg><span style="font-size:18px;font-weight:700;">家</span><span style="background:rgba(255,255,255,0.25);padding:2px 8px;border-radius:10px;font-size:11px;">生效中</span></div>' +
          '<div style="font-size:13px;opacity:0.9;">朝阳区建国路93号 · 半径500米</div>' +
        '</div>' +
        '<div style="background:#fff;border-radius:14px;padding:16px;margin-bottom:10px;border:0.5px solid #E5E5EA;">' +
          '<div style="font-size:14px;font-weight:600;color:#1D1D1F;margin-bottom:12px;">围栏设置</div>' +
          '<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:0.5px solid #F2F2F7;"><span style="font-size:13px;color:#8E8E93;">半径</span><span style="font-size:13px;color:#1D1D1F;">500米</span></div>' +
          '<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:0.5px solid #F2F2F7;"><span style="font-size:13px;color:#8E8E93;">触发提醒</span><span style="font-size:13px;color:#1D1D1F;">进入+离开</span></div>' +
          '<div style="display:flex;justify-content:space-between;padding:10px 0;"><span style="font-size:13px;color:#8E8E93;">生效时间</span><span style="font-size:13px;color:#1D1D1F;">全天</span></div>' +
        '</div>' +
        '<div style="background:#fff;border-radius:14px;padding:16px;margin-bottom:10px;border:0.5px solid #E5E5EA;">' +
          '<div style="font-size:14px;font-weight:600;color:#1D1D1F;margin-bottom:12px;">最近触发记录</div>' +
          '<div style="font-size:13px;color:#1D1D1F;padding:8px 0;border-bottom:0.5px solid #F2F2F7;">今天 18:32 进入"家"围栏</div>' +
          '<div style="font-size:13px;color:#1D1D1F;padding:8px 0;border-bottom:0.5px solid #F2F2F7;">今天 09:15 离开"家"围栏</div>' +
          '<div style="font-size:13px;color:#1D1D1F;padding:8px 0;">昨天 18:45 进入"家"围栏</div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">' +
          '<button onclick="showFeedback(\'围栏设置已保存\',\'success\')" style="background:#F2F2F7;border:none;padding:12px;border-radius:10px;font-size:13px;color:#1D1D1F;cursor:pointer;font-weight:500;">编辑设置</button>' +
          '<button onclick="showFeedback(\'围栏已删除\',\'success\')" style="background:#FF3B30;color:#fff;border:none;padding:12px;border-radius:10px;font-size:13px;cursor:pointer;font-weight:500;">删除围栏</button>' +
        '</div>' +
      '</div>';
    var phoneScreen = document.querySelector('.phone-screen') || document.body;
    phoneScreen.appendChild(page);
    fenceDetailCreated = true;
  }
  function closeFenceDetail() {
    showScreen('family');
    switchTab('family');
    triggerHaptic('light');
  }

  // 家人位置查看页
  // ========== 邀请家人功能 ==========
  var inviteFamilyPageCreated = false;
  var inviteLinkGenerated = false;

  function openInviteFamily() {
    ensureInviteFamilyPage();
    showScreen('inviteFamily');
    speak('邀请家人加入守护', 'normal');
    triggerHaptic('light');
  }

  function ensureInviteFamilyPage() {
    if (inviteFamilyPageCreated) return;
    var page = document.createElement('div');
    page.id = 'inviteFamilyScreen';
    page.className = 'screen';
    page.setAttribute('role', 'main');
    page.setAttribute('aria-label', '邀请家人');
    page.style.cssText = 'background:#F2F2F7;padding-top:47px;display:none;flex-direction:column;overflow:hidden;';
    page.innerHTML =
      '<div class="community-nav-bar" style="position:relative;background:rgba(255,255,255,0.92);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);padding:10px 20px;border-bottom:0.5px solid rgba(0,0,0,0.06);display:flex;align-items:center;justify-content:center;flex-shrink:0;">' +
        '<div onclick="closeInviteFamily()" role="button" tabindex="0" aria-label="返回" style="position:absolute;left:16px;top:50%;transform:translateY(-50%);width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#007AFF;cursor:pointer;"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg></div>' +
        '<span style="font-size:17px;font-weight:600;color:#1D1D1F;">邀请家人</span>' +
      '</div>' +
      '<div style="flex:1;overflow-y:auto;padding:20px 16px 90px;-webkit-overflow-scrolling:touch;">' +
        // 顶部说明卡片
        '<div style="background:#fff;border-radius:16px;padding:24px 20px;margin-bottom:16px;text-align:center;border:0.5px solid #E5E5EA;box-shadow:0 1px 3px rgba(0,0,0,0.04);">' +
          '<div style="width:72px;height:72px;border-radius:20px;background:linear-gradient(135deg,#007AFF,#5856D6);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;box-shadow:0 4px 16px rgba(0,122,255,0.3);"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg></div>' +
          '<div style="font-size:18px;font-weight:600;color:#1D1D1F;margin-bottom:6px;">邀请家人加入守护</div>' +
          '<div style="font-size:14px;color:#8E8E93;line-height:1.5;">将邀请链接发送给家人，对方下载瞳伴App后即可加入守护列表</div>' +
        '</div>' +
        // 邀请方式
        '<div style="background:#fff;border-radius:16px;padding:16px;margin-bottom:16px;border:0.5px solid #E5E5EA;">' +
          '<div style="font-size:13px;font-weight:600;color:#8E8E93;margin-bottom:12px;">邀请方式</div>' +
          '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;">' +
            '<div onclick="inviteViaWeChat()" role="button" tabindex="0" aria-label="微信邀请" style="display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer;"><div style="width:48px;height:48px;border-radius:14px;background:#07C160;display:flex;align-items:center;justify-content:center;"><svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.328.328 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.881-1.98 5.854-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.18A1.17 1.17 0 0 1 4.625 7.17c0-.651.52-1.18 1.16-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.18 1.17 1.17 0 0 1-1.162-1.18c0-.651.52-1.18 1.162-1.18zm3.683 7.9c-3.732 0-6.766 2.686-6.766 5.999 0 3.314 3.034 6.002 6.766 6.002.847 0 1.657-.118 2.417-.336a.71.71 0 0 1 .589.083l1.562.912a.27.27 0 0 0 .137.043c.131 0 .238-.107.238-.24 0-.06-.023-.12-.039-.174l-.32-1.214a.484.484 0 0 1 .175-.546C23.462 21.746 24.047 20.108 24.047 18.391c0-3.313-1.927-6.5-6.766-6.5zm-2.392 4.349c.526 0 .953.434.953.969a.961.961 0 0 1-.953.969.961.961 0 0 1-.953-.969c0-.535.427-.969.953-.969zm4.782 0c.526 0 .953.434.953.969a.961.961 0 0 1-.953.969.961.961 0 0 1-.953-.969c0-.535.427-.969.953-.969z"/></svg></div><span style="font-size:11px;color:#1D1D1F;font-weight:500;">微信</span></div>' +
            '<div onclick="inviteViaSMS()" role="button" tabindex="0" aria-label="短信邀请" style="display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer;"><div style="width:48px;height:48px;border-radius:14px;background:#34C759;display:flex;align-items:center;justify-content:center;"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div><span style="font-size:11px;color:#1D1D1F;font-weight:500;">短信</span></div>' +
            '<div onclick="inviteViaQRCode()" role="button" tabindex="0" aria-label="二维码邀请" style="display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer;"><div style="width:48px;height:48px;border-radius:14px;background:#5856D6;display:flex;align-items:center;justify-content:center;"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><line x1="14" y1="14" x2="14"/><line x1="21" y1="14" x2="21"/><line x1="17" y1="17" x2="21"/><line x1="14" y1="17" x2="17"/><line x1="17" y1="21" x2="21"/><line x1="14" y1="21" x2="14"/></svg></div><span style="font-size:11px;color:#1D1D1F;font-weight:500;">二维码</span></div>' +
            '<div onclick="inviteViaCopyLink()" role="button" tabindex="0" aria-label="复制链接邀请" style="display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer;"><div style="width:48px;height:48px;border-radius:14px;background:#FF9500;display:flex;align-items:center;justify-content:center;"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></div><span style="font-size:11px;color:#1D1D1F;font-weight:500;">链接</span></div>' +
          '</div>' +
        '</div>' +
        // 邀请链接区域
        '<div id="inviteLinkCard" style="background:#fff;border-radius:16px;padding:16px;margin-bottom:16px;border:0.5px solid #E5E5EA;display:none;">' +
          '<div style="font-size:13px;font-weight:600;color:#8E8E93;margin-bottom:10px;">专属邀请链接</div>' +
          '<div style="display:flex;align-items:center;gap:8px;background:#F2F2F7;border-radius:10px;padding:10px 12px;margin-bottom:10px;">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>' +
            '<span id="inviteLinkText" style="flex:1;font-size:13px;color:#1D1D1F;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">https://tongban.app/invite/...</span>' +
            '<div onclick="copyInviteLink()" role="button" tabindex="0" aria-label="复制链接" style="background:#007AFF;color:#fff;font-size:12px;font-weight:600;padding:4px 10px;border-radius:8px;cursor:pointer;flex-shrink:0;">复制</div>' +
          '</div>' +
          '<div style="font-size:12px;color:#8E8E93;display:flex;align-items:center;gap:4px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>链接有效期7天</div>' +
        '</div>' +
        // 二维码区域
        '<div id="inviteQRCard" style="background:#fff;border-radius:16px;padding:24px;margin-bottom:16px;border:0.5px solid #E5E5EA;display:none;text-align:center;">' +
          '<div style="font-size:13px;font-weight:600;color:#8E8E93;margin-bottom:16px;">扫码加入守护</div>' +
          '<div style="width:180px;height:180px;margin:0 auto 12px;background:#F2F2F7;border-radius:12px;display:flex;align-items:center;justify-content:center;border:2px dashed #C7C7CC;"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><line x1="14" y1="14" x2="14"/><line x1="21" y1="14" x2="21"/><line x1="17" y1="17" x2="21"/><line x1="14" y1="17" x2="17"/><line x1="17" y1="21" x2="21"/><line x1="14" y1="21" x2="14"/></svg></div>' +
          '<div style="font-size:12px;color:#8E8E93;">家人扫描二维码即可下载瞳伴App</div>' +
        '</div>' +
        // 待邀请家人
        '<div style="background:#fff;border-radius:16px;padding:16px;margin-bottom:16px;border:0.5px solid #E5E5EA;">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">' +
            '<span style="font-size:13px;font-weight:600;color:#8E8E93;">待邀请家人</span>' +
            '<span onclick="addInviteContact()" role="button" tabindex="0" aria-label="添加联系人" style="font-size:13px;color:#007AFF;cursor:pointer;display:flex;align-items:center;gap:3px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>添加</span>' +
          '</div>' +
          '<div id="inviteContactList">' +
            '<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:0.5px solid #E5E5EA;">' +
              '<div style="width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#FF9500,#FF2D55);color:#fff;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:600;flex-shrink:0;">王</div>' +
              '<div style="flex:1;"><div style="font-size:14px;font-weight:600;color:#1D1D1F;">王先生</div><div style="font-size:12px;color:#8E8E93;margin-top:2px;">137****1234 · 儿子</div></div>' +
              '<div onclick="sendInviteToContact(this)" role="button" tabindex="0" aria-label="发送邀请" style="background:rgba(0,122,255,0.1);color:#007AFF;font-size:12px;font-weight:600;padding:6px 14px;border-radius:8px;cursor:pointer;">发送</div>' +
            '</div>' +
            '<div style="display:flex;align-items:center;gap:12px;padding:10px 0;">' +
              '<div style="width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#34C759,#30D158);color:#fff;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:600;flex-shrink:0;">赵</div>' +
              '<div style="flex:1;"><div style="font-size:14px;font-weight:600;color:#1D1D1F;">赵女士</div><div style="font-size:12px;color:#8E8E93;margin-top:2px;">136****5678 · 女儿</div></div>' +
              '<div onclick="sendInviteToContact(this)" role="button" tabindex="0" aria-label="发送邀请" style="background:rgba(0,122,255,0.1);color:#007AFF;font-size:12px;font-weight:600;padding:6px 14px;border-radius:8px;cursor:pointer;">发送</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        // 说明
        '<div style="background:rgba(0,122,255,0.06);border-radius:12px;padding:14px 16px;margin-bottom:16px;display:flex;gap:10px;">' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#007AFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-top:1px;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>' +
          '<div style="font-size:12px;color:#1D1D1F;line-height:1.6;">家人接受邀请并注册后，将自动出现在您的被监护人士列表中。每位被监护人士最多可被3位家人共同守护。</div>' +
        '</div>' +
      '</div>';
    var phoneScreen = document.querySelector('.phone-screen') || document.body;
    phoneScreen.appendChild(page);
    inviteFamilyPageCreated = true;
  }

  function closeInviteFamily() {
    switchTab('family');
    triggerHaptic('light');
  }

  function generateInviteLink() {
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var code = '';
    for (var i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return 'https://tongban.app/invite/' + code;
  }

  function showInviteLinkCard() {
    var card = document.getElementById('inviteLinkCard');
    var textEl = document.getElementById('inviteLinkText');
    if (!card) return;
    if (!inviteLinkGenerated) {
      var link = generateInviteLink();
      if (textEl) textEl.textContent = link;
      inviteLinkGenerated = true;
    }
    card.style.display = 'block';
  }

  function inviteViaWeChat() {
    showInviteLinkCard();
    showFeedback('正在打开微信分享...', 'info');
    speak('正在打开微信分享', 'normal');
    triggerHaptic('light');
  }

  function inviteViaSMS() {
    showInviteLinkCard();
    showFeedback('正在跳转短信页面...', 'info');
    speak('正在跳转短信页面', 'normal');
    triggerHaptic('light');
  }

  function inviteViaQRCode() {
    var qrCard = document.getElementById('inviteQRCard');
    if (qrCard) {
      qrCard.style.display = 'block';
      showFeedback('二维码已生成', 'success');
      speak('二维码已生成，请让家人扫描', 'normal');
    }
    triggerHaptic('light');
  }

  function inviteViaCopyLink() {
    showInviteLinkCard();
    copyInviteLink();
  }

  function copyInviteLink() {
    var textEl = document.getElementById('inviteLinkText');
    if (textEl && textEl.textContent) {
      try {
        if (navigator.clipboard) {
          navigator.clipboard.writeText(textEl.textContent);
        }
      } catch(e) {}
      showFeedback('链接已复制到剪贴板', 'success');
      speak('邀请链接已复制', 'normal');
    }
    triggerHaptic('light');
  }

  function addInviteContact() {
    openAddContactEditor('邀请家人');
    triggerHaptic('light');
  }

  function sendInviteToContact(btn) {
    if (btn) {
      btn.textContent = '已发送';
      btn.style.background = 'rgba(142,142,147,0.1)';
      btn.style.color = '#8E8E93';
      btn.style.pointerEvents = 'none';
      btn.setAttribute('aria-label', '已发送邀请');
    }
    showFeedback('邀请已发送', 'success');
    speak('邀请已发送，等待家人接受', 'normal');
    triggerHaptic('light');
  }

  function openFamilyLocationPage(name) {
    ensureFamilyLocationPage(name);
    showScreen('familyLocation');
    speak('正在查看' + name + '的位置', 'normal');
    triggerHaptic('light');
  }
  var familyLocationCreated = false;
  function ensureFamilyLocationPage(name) {
    if (familyLocationCreated) return;
    var page = document.createElement('div');
    page.id = 'familyLocationScreen';
    page.className = 'screen';
    page.setAttribute('role', 'main');
    page.setAttribute('aria-label', '家人位置');
    page.style.cssText = 'background:#F2F2F7;padding-top:47px;display:none;flex-direction:column;overflow:hidden;';
    page.innerHTML =
      '<div class="community-nav-bar" style="position:relative;background:rgba(255,255,255,0.92);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);padding:10px 20px;border-bottom:0.5px solid rgba(0,0,0,0.06);display:flex;align-items:center;justify-content:center;">' +
        '<div onclick="closeFamilyLocation()" role="button" tabindex="0" aria-label="返回" style="position:absolute;left:16px;top:50%;transform:translateY(-50%);width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#007AFF;cursor:pointer;"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg></div>' +
        '<span id="familyLocTitle" style="font-size:17px;font-weight:600;color:#1D1D1F;">家人位置</span>' +
      '</div>' +
      '<div style="flex:1;overflow-y:auto;padding:12px;padding-bottom:90px;">' +
        // 大地图
        '<div style="height:280px;border-radius:14px;overflow:hidden;margin-bottom:12px;position:relative;border:0.5px solid #E5E5EA;box-shadow:0 2px 8px rgba(0,0,0,0.04);">' +
          '<div style="width:100%;height:100%;background:linear-gradient(180deg,#EAF2FF 0%,#F0F7FF 55%,#F5F9FF 100%);position:relative;">' +
            '<svg width="100%" height="100%" viewBox="0 0 360 280" preserveAspectRatio="xMidYMid slice" style="position:absolute;top:0;left:0;">' +
              '<defs>' +
                '<pattern id="locMapGrid" width="30" height="30" patternUnits="userSpaceOnUse">' +
                  '<path d="M 30 0 L 0 0 0 30" fill="none" stroke="#D1E0FF" stroke-width="0.5" opacity="0.5"/>' +
                '</pattern>' +
              '</defs>' +
              '<rect width="360" height="280" fill="url(#locMapGrid)"/>' +
              // 道路
              '<path d="M0 180 Q60 160 120 140 Q180 120 240 100 Q300 80 360 70" fill="none" stroke="#C8D8FB" stroke-width="18" stroke-linecap="round"/>' +
              '<path d="M0 180 Q60 160 120 140 Q180 120 240 100 Q300 80 360 70" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-dasharray="6,6" stroke-linecap="round"/>' +
              '<path d="M120 280 Q130 220 150 160 Q170 100 200 70" fill="none" stroke="#C8D8FB" stroke-width="14" stroke-linecap="round"/>' +
              // 建筑物
              '<rect x="20" y="140" width="30" height="50" rx="3" fill="#B8CDF0" opacity="0.6"/>' +
              '<rect x="60" y="120" width="26" height="65" rx="3" fill="#A9BFE8" opacity="0.5"/>' +
              '<rect x="280" y="40" width="35" height="55" rx="3" fill="#B8CDF0" opacity="0.5"/>' +
              '<rect x="20" y="50" width="28" height="45" rx="3" fill="#B8CDF0" opacity="0.5"/>' +
              // 公园
              '<ellipse cx="200" cy="220" rx="50" ry="30" fill="#C7E9C0" opacity="0.5"/>' +
              // 家人位置
              '<g transform="translate(200, 100)">' +
                '<circle r="25" fill="#007AFF" opacity="0.1">' +
                  '<animate attributeName="r" values="18;32;18" dur="2s" repeatCount="indefinite"/>' +
                  '<animate attributeName="opacity" values="0.2;0.05;0.2" dur="2s" repeatCount="indefinite"/>' +
                '</circle>' +
                '<circle r="14" fill="#007AFF" opacity="0.25"/>' +
                '<circle r="8" fill="#007AFF"/>' +
                '<circle r="3" fill="#fff"/>' +
              '</g>' +
              // 我的位置
              '<g transform="translate(45, 160)">' +
                '<circle r="8" fill="#34C759" opacity="0.2"/>' +
                '<circle r="5" fill="#34C759"/>' +
                '<path d="M-2 -0.5 L-2 2 L2 2 L2 -0.5 L0 -3 Z" fill="white" transform="translate(0, -0.5)"/>' +
              '</g>' +
            '</svg>' +
          '</div>' +
        '</div>' +
        '<div style="background:#fff;border-radius:14px;padding:16px;margin-bottom:10px;border:0.5px solid #E5E5EA;">' +
          '<div style="font-size:14px;font-weight:600;color:#1D1D1F;margin-bottom:12px;">当前位置</div>' +
          '<div style="background:#F2F2F7;border-radius:10px;padding:14px;display:flex;align-items:center;gap:12px;">' +
            '<div style="width:32px;height:32px;border-radius:8px;background:#34C759;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z"/><circle cx="12" cy="10" r="2.5"/></svg></div>' +
            '<div><div style="font-size:13px;color:#1D1D1F;font-weight:500;">朝阳区公园附近</div><div style="font-size:11px;color:#8E8E93;margin-top:2px;">精度 ±10米 · 电量75%</div></div>' +
          '</div>' +
        '</div>' +
        '<div style="background:#fff;border-radius:14px;padding:16px;margin-bottom:10px;border:0.5px solid #E5E5EA;">' +
          '<div style="font-size:14px;font-weight:600;color:#1D1D1F;margin-bottom:12px;">最近活动</div>' +
          '<div style="font-size:13px;color:#1D1D1F;padding:8px 0;border-bottom:0.5px solid #F2F2F7;">15分钟前 · 移动到公园</div>' +
          '<div style="font-size:13px;color:#1D1D1F;padding:8px 0;border-bottom:0.5px solid #F2F2F7;">1小时前 · 离开家</div>' +
          '<div style="font-size:13px;color:#1D1D1F;padding:8px 0;">3小时前 · 到达医院</div>' +
        '</div>' +
        '<button onclick="callFamily(\'father\')" style="width:100%;background:#34C759;color:#fff;border:none;padding:14px;border-radius:14px;font-size:14px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>语音通话</button>' +
        '<button onclick="navigateToFamily()" style="width:100%;margin-top:10px;background:linear-gradient(135deg,#007AFF 0%,#5856D6 100%);color:#fff;border:none;padding:14px;border-radius:14px;font-size:14px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;box-shadow:0 4px 12px rgba(0,122,255,0.3);"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>前往导航</button>' +
      '</div>';
    var phoneScreen = document.querySelector('.phone-screen') || document.body;
    phoneScreen.appendChild(page);
    familyLocationCreated = true;
  }
  function closeFamilyLocation() {
    showScreen('family');
    switchTab('family');
    triggerHaptic('light');
  }

  function navigateToFamily() {
    if (userRole === 'family') {
      speak('家人版不支持导航功能，请切换到视障版使用导航', 'normal');
      return;
    }
    // 设置目的地为家人位置，跳转到路线规划
    selectedDestination = {
      name: '张大爷位置',
      address: '朝阳区公园附近',
      distance: '0.8公里'
    };
    showScreen('route');
    switchTab('home');
    speak('正在规划前往张大爷位置的路线', 'normal');
    triggerHaptic('light');
  }

  function startSpeechRecognition() {
    try {
      var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) {
        speak('当前浏览器不支持语音识别');
        return;
      }
      var recognition = new SR();
      recognition.lang = 'zh-CN';
      recognition.start();
      speak('语音识别已启动，请说话');
    } catch(e) {
      speak('语音识别启动失败');
    }
  }

  function simulateFenceCheck() {
    speak('正在检测安全围栏...您当前在安全区域内');
    triggerHaptic('light');
  }

  function startWakeWordListener() {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    try {
      wakeWordRecognition = new SR();
      wakeWordRecognition.lang = 'zh-CN';
      wakeWordRecognition.continuous = true;
      wakeWordRecognition.interimResults = true;
      wakeWordRecognition.onresult = function(event) {
        for (var i = event.resultIndex; i < event.results.length; i++) {
          var transcript = event.results[i][0].transcript;
          if (transcript.indexOf('瞳伴') > -1 || transcript.indexOf('同伴') > -1) {
            if (!wakeWordListening) {
              wakeWordListening = true;
              triggerHaptic('light');
              toggleVoiceWake();
              setTimeout(function() { wakeWordListening = false; }, 5000);
            }
          }
        }
      };
      wakeWordRecognition.onend = function() {
        setTimeout(function() {
          try { wakeWordRecognition.start(); } catch(e) {}
        }, 1000);
      };
      wakeWordRecognition.start();
    } catch(e) {
      console.log('Wake word listener not available');
    }
  }

  /* ========== EXPOSE GLOBALS ========== */
  window.speak = speak;
  window.adjustSpeechRate = adjustSpeechRate;
  window.triggerHaptic = triggerHaptic;
  window.showFeedback = showFeedback;
  window.formatTime = formatTime;
  window.showScreen = showScreen;
  window.switchTab = switchTab;
  window.backToHome = backToHome;
  window.toggleVoiceWake = toggleVoiceWake;
  window.stopVoiceWake = stopVoiceWake;
  window.openWakeSearch = openWakeSearch;
  window.closeWakeSearch = closeWakeSearch;
  window.handleSearchInput = handleSearchInput;
  window.startSpeechRecognition = startSpeechRecognition;
  window.toggleVoiceSearch = toggleVoiceSearch;
  window.stopVoiceSearch = stopVoiceSearch;
  window.selectDestination = selectDestination;
  window.handleWakeSearchKeydown = handleWakeSearchKeydown;
  window.navigateWakeSearch = navigateWakeSearch;
  window.selectCurrentWakeSearch = selectCurrentWakeSearch;
  window.goToRoutePlanning = goToRoutePlanning;
  window.searchDestination = searchDestination;
  window.showDestSuggestions = showDestSuggestions;
  window.hideDestSuggestions = hideDestSuggestions;
  window.selectDestFromSearch = selectDestFromSearch;
  window.handleSearchKeydown = handleSearchKeydown;
  window.navigateSuggestions = navigateSuggestions;
  window.selectCurrentSuggestion = selectCurrentSuggestion;
  window.quickSelectDest = quickSelectDest;
  window.selectMode = selectMode;
  window.renderRouteList = renderRouteList;
  window.selectRoute = selectRoute;
  window.confirmStartNav = confirmStartNav;
  window.getGuidanceStepsForMode = getGuidanceStepsForMode;
  window.startNavigation = startNavigation;
  window.navTick = navTick;
  window.updateNavProgress = updateNavProgress;
  window.updateGuidanceDisplay = updateGuidanceDisplay;
  window.moveMapMarker = moveMapMarker;
  window.hideAllBanners = hideAllBanners;
  window.pauseNavigation = pauseNavigation;
  window.resumeNavigation = resumeNavigation;
  window.endNavigation = endNavigation;
  window.enterArrivalMode = enterArrivalMode;
  window.getArrivalEnvDesc = getArrivalEnvDesc;
  window.getArrivalEntryDesc = getArrivalEntryDesc;
  window.getArrivalNearby = getArrivalNearby;
  window.arrivalOpenCamera = arrivalOpenCamera;
  window.arrivalDescribeAgain = arrivalDescribeAgain;
  window.arrivalEntryGuidance = arrivalEntryGuidance;
  window.confirmArrival = confirmArrival;
  window.finishNavigation = finishNavigation;
  window.simulateTactileDeviation = simulateTactileDeviation;
  window.correctTactileDeviation = correctTactileDeviation;
  window.simulateRouteDeviation = simulateRouteDeviation;
  window.completeReroute = completeReroute;
  window.enterLastMile = enterLastMile;
  window.renderLastMileSteps = renderLastMileSteps;
  window.nextLmStep = nextLmStep;
  window.goToLmStep = goToLmStep;
  window.finishLastMile = finishLastMile;
  window.generateLastMileSteps = generateLastMileSteps;
  window.startLastMileAutoProgress = startLastMileAutoProgress;
  window.autoAdvanceLmStep = autoAdvanceLmStep;
  window.triggerLastMileDeviation = triggerLastMileDeviation;
  window.correctLastMileDeviation = correctLastMileDeviation;
  window.updateCameraSceneForLastMile = updateCameraSceneForLastMile;
  window.getActualMode = getActualMode;
  window.getCurrentAISceneMode = getCurrentAISceneMode;
  window.openCamera = openCamera;
  window.initCameraScene = initCameraScene;
  window.closeCamera = closeCamera;
  window.updateCameraAI = updateCameraAI;
  window.triggerDangerAlert = triggerDangerAlert;
  window.toggleEmergency = toggleEmergency;
  window.triggerEmergency = triggerEmergency;
  window.doTriggerEmergency = doTriggerEmergency;
  window.cancelEmergency = cancelEmergency;
  window.openGestureTutorial = openGestureTutorial;
  window.closeGestureTutorial = closeGestureTutorial;
  window.playGestureItem = playGestureItem;
  window.playGestureTutorial = playGestureTutorial;
  window.initGestureHandlers = initGestureHandlers;
  window.handleTouchStart = handleTouchStart;
  window.handleTouchMove = handleTouchMove;
  window.handleTouchEnd = handleTouchEnd;
  window.handleMouseDown = handleMouseDown;
  window.handleMouseMove = handleMouseMove;
  window.handleMouseUp = handleMouseUp;
  window.onLongPress = onLongPress;
  window.onDoubleTap = onDoubleTap;
  window.onSingleTap = onSingleTap;
  window.onSwipeLeft = onSwipeLeft;
  window.onSwipeRight = onSwipeRight;
  window.onSwipeUp = onSwipeUp;
  window.showSwipeIndicator = showSwipeIndicator;
  window.initShakeDetection = initShakeDetection;
  window.onShake = onShake;
  window.simulateLongPress = simulateLongPress;
  window.simulateDoubleTap = simulateDoubleTap;
  window.simulateSingleTap = simulateSingleTap;
  window.simulateSwipeLeft = simulateSwipeLeft;
  window.simulateSwipeRight = simulateSwipeRight;
  window.simulateSwipeUp = simulateSwipeUp;
  window.simulateShake = simulateShake;
  window.testMode = testMode;
  window.getDemoDestination = getDemoDestination;
  window.showFloorNav = showFloorNav;
  window.hideFloorNav = hideFloorNav;
  window.renderFloorSelector = renderFloorSelector;
  window.selectFloor = selectFloor;
  window.renderFloorMap = renderFloorMap;
  window.selectPOI = selectPOI;
  window.loadCommunityFeed = loadCommunityFeed;
  window.switchCommunityTab = switchCommunityTab;
  window.likePost = likePost;
  window.commentPost = commentPost;
  window.closeCommentOverlay = closeCommentOverlay;
  window.submitComment = submitComment;
  window.sharePost = sharePost;
  window.closeShareOverlay = closeShareOverlay;
  window.doShare = doShare;
  window.createPost = createPost;
  window.closePostOverlay = closePostOverlay;
  window.submitPost = submitPost;
  window.insertQuickTag = insertQuickTag;
  window.showLocationPicker = showLocationPicker;
  window.closeLocationPicker = closeLocationPicker;
  window.selectPostLocation = selectPostLocation;
  window.createDangerMark = createDangerMark;
  window.submitDangerMark = submitDangerMark;
  window.openNavDangerPost = openNavDangerPost;
  window.closeNavDangerPost = closeNavDangerPost;
  window.submitNavDangerPost = submitNavDangerPost;
  window.selectDangerType = selectDangerType;
  window.showLogin = showLogin;
  window.closeLogin = closeLogin;
  window.goToRegister = goToRegister;
  window.goToLogin = goToLogin;
  window.switchLoginMode = switchLoginMode;
  window.selectLoginRole = selectLoginRole;
  window.doGetSmsCode = doGetSmsCode;
  window.doQuickLogin = doQuickLogin;
  window.doSmsLogin = doSmsLogin;
  window.sendResetCode = sendResetCode;
  window.doPasswordLogin = doPasswordLogin;
  window.doRegister = doRegister;
  window.handleMyHeaderClick = handleMyHeaderClick;
  window.showAccountInfo = showAccountInfo;
  window.backToMyFromAccount = backToMyFromAccount;
  window.editAccountField = editAccountField;
  window.cancelEditField = cancelEditField;
  window.saveEditField = saveEditField;
  window.changeAvatarColor = changeAvatarColor;
  window.toggleAccountSwitch = toggleAccountSwitch;
  window.confirmLogout = confirmLogout;
  window.cancelLogout = cancelLogout;
  window.doLogout = doLogout;
  window.adjustVibrationIntensity = adjustVibrationIntensity;
  window.callFamily = callFamily;
  window.showFenceDetail = showFenceDetail;
  window.viewFamilyLocation = viewFamilyLocation;
  window.openWardDetail = openWardDetail;
  window.openWardList = openWardList;
  window.openAlertHistory = openAlertHistory;
  window.openGuardianSettings = openGuardianSettings;
  window.showTravelHistory = showTravelHistory;
  window.showFavorites = showFavorites;
  window.openFamilyLocationPage = openFamilyLocationPage;
  window.openInviteFamily = openInviteFamily;
  window.closeInviteFamily = closeInviteFamily;
  window.inviteViaWeChat = inviteViaWeChat;
  window.inviteViaSMS = inviteViaSMS;
  window.inviteViaQRCode = inviteViaQRCode;
  window.inviteViaCopyLink = inviteViaCopyLink;
  window.copyInviteLink = copyInviteLink;
  window.addInviteContact = addInviteContact;
  window.sendInviteToContact = sendInviteToContact;
  window.navigateToFamily = navigateToFamily;
  window.toggleLocationShare = toggleLocationShare;
  window.simulateFenceCheck = simulateFenceCheck;
  window.addEmergencyContact = addEmergencyContact;
  window.openEmergencyContactsPage = openEmergencyContactsPage;
  window.closeEmergencyContacts = closeEmergencyContacts;
  window.callEmergencyContact = callEmergencyContact;
  window.editEmergencyContact = editEmergencyContact;
  window.deleteEmergencyContact = deleteEmergencyContact;
  window.cancelDeleteContact = cancelDeleteContact;
  window.confirmDeleteContact = confirmDeleteContact;
  window.renderEmergencyContactsList = renderEmergencyContactsList;
  window.openAddContactEditor = openAddContactEditor;
  window.closeAddContactEditor = closeAddContactEditor;
  window.submitAddContact = submitAddContact;
  // 消息中心
  window.openMessageCenter = openMessageCenter;
  window.closeMessageCenter = closeMessageCenter;
  window.markAllMessagesRead = markAllMessagesRead;
  window.switchMessageFilter = switchMessageFilter;
  window.openMessageDetail = openMessageDetail;
  window.closeMessageDetail = closeMessageDetail;
  window.deleteCurrentMessage = deleteCurrentMessage;
  // 围栏管理
  window.openFenceManagement = openFenceManagement;
  window.closeFenceManagement = closeFenceManagement;
  window.editFence = editFence;
  window.addNewFence = addNewFence;
  // 守护设置
  window.closeGuardianSettings = closeGuardianSettings;
  window.toggleGuardianItem = toggleGuardianItem;
  window.selectReportFrequency = selectReportFrequency;
  window.selectSensitivity = selectSensitivity;
  // 被监护人士
  window.closeWardList = closeWardList;
  window.closeWardDetail = closeWardDetail;
  window.callWard = callWard;
  window.navigateToWard = navigateToWard;
  // 出行历史 & 安全守护 & 收藏
  window.closeTravelHistory = closeTravelHistory;
  window.closeFavorites = closeFavorites;
  window.addNewFavorite = addNewFavorite;
  window.openMyFavorites = openMyFavorites;
  window.openTravelHistory = openTravelHistory;
  window.openHelpFeedback = openHelpFeedback;
  window.openChangePassword = openChangePassword;
  window.openSettingsPage = openSettingsPage;
  window.openSettings = openSettings;
  window.closeSettings = closeSettings;
  window.openRealNameAuth = openRealNameAuth;
  window.closeRealName = closeRealName;
  window.openUserAgreement = openUserAgreement;
  window.openPrivacyPolicy = openPrivacyPolicy;
  window.openDataExport = openDataExport;
  // 我的页面导航
  window.goToFamilyTab = goToFamilyTab;
  window.addNewCommonAddress = addNewCommonAddress;
  window.closeCommonAddresses = closeCommonAddresses;
  // 社区帖子
  window.likePost = likePost;
  window.likePostDetail = likePostDetail;
  window.commentPost = commentPost;
  window.sharePost = sharePost;
  window.closePostOverlay = closePostOverlay;
  window.submitPost = submitPost;
  window.showLocationPicker = showLocationPicker;
  window.closeLocationPicker = closeLocationPicker;
  window.selectPostLocation = selectPostLocation;
  window.closeNavDangerPost = closeNavDangerPost;
  window.submitNavDangerPost = submitNavDangerPost;
  window.openMessageDetail = openMessageDetail;
  window.testFloorNav = testFloorNav;
  window.testCommunity = testCommunity;
  window.testFamily = testFamily;
  window.testLogin = testLogin;
  window.testLogout = testLogout;
  window.testMyPage = testMyPage;
  window.testSettings = testSettings;
  window.testRealName = testRealName;
  window.testEmergencyContacts = testEmergencyContacts;
  window.testArrival = testArrival;
  window.testWardList = testWardList;
  window.testFenceManagement = testFenceManagement;
  window.testGuardianSettings = testGuardianSettings;
  window.testFamilyLocation = testFamilyLocation;
  window.testMessageCenter = testMessageCenter;
  window.testTravelHistory = testTravelHistory;
  window.testFavorites = testFavorites;
  window.testCommonAddresses = testCommonAddresses;
  window.testCreatePost = testCreatePost;
  window.toggleSwitch = toggleSwitch;
  window.addContact = addContact;
  window.initAccessibility = initAccessibility;
  window.enhanceEmergencyAccessibility = enhanceEmergencyAccessibility;
  window.addAriaLiveRegion = addAriaLiveRegion;
  window.announce = announce;
  window.init = init;
  window.startWakeWordListener = startWakeWordListener;

  if (document.readyState !== 'loading') {
    init();
  }
