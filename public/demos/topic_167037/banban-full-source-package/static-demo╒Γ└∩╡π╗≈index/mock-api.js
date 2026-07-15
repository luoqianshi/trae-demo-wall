/**
 * 伴伴静态Demo启动脚本
 * - 自动修正所有绝对路径为相对路径
 * - 拦截fetch/XHR提供完整mock API
 * - 提供种子数据
 */
(function() {
  'use strict';

  // ========== 路由映射：URL路径 -> HTML文件 ==========
  const ROUTE_MAP = {
    '/': 'index.html',
    '/portal': 'portal.html',
    '/onboarding': 'onboarding.html',
    '/onboarding-new': 'onboarding_new.html',
    '/today': 'today.html',
    '/compass': 'compass.html',
    '/canvas': 'canvas_v4.html',
    '/canvas-v2': 'canvas_v2.html',
    '/canvas-v3': 'canvas_v3.html',
    '/canvas-v4': 'canvas_v4.html',
    '/weekly': 'weekly.html',
    '/today-timeline': 'today_timeline.html',
    '/review-morning': 'review_morning.html',
    '/review-evening': 'review_evening.html',
    '/review-summary': 'review_summary.html',
    '/settings': 'settings.html',
    '/chat': 'chat.html',
    '/cognition': 'cognition.html',
    '/help': 'help.html',
    '/behavior': 'behavior.html',
    '/overview': 'overview.html',
    '/lab': 'lab.html',
    '/app': 'app.html',
    '/demo': 'demo.html'
  };

  // ========== 修正路径：去掉开头的 / 使其成为相对路径 ==========
  function fixPath(path) {
    if (!path) return path;
    if (typeof path !== 'string') return path;
    
    // 跳过数据URI、javascript:、#、http(s)://、file://
    if (path.startsWith('data:') || path.startsWith('javascript:') || 
        path.startsWith('#') || path.startsWith('http://') || 
        path.startsWith('https://') || path.startsWith('file://') ||
        path.startsWith('blob:')) {
      return path;
    }
    
    // 处理API路径 - 不修改
    if (path.startsWith('/api/')) {
      return path;
    }
    
    // 去掉查询参数和哈希来匹配路由
    const base = path.split('?')[0].split('#')[0];
    
    // 检查路由映射
    if (ROUTE_MAP[base]) {
      const rest = path.substring(base.length);
      return ROUTE_MAP[base] + rest;
    }
    
    // 以/开头的路径 -> 去掉开头的/变成相对路径
    if (path.startsWith('/')) {
      return path.substring(1);
    }
    
    return path;
  }

  // ========== 修补DOM中已有元素的路径 ==========
  function patchExistingElements() {
    // 修正 <a href="/xxx">
    document.querySelectorAll('a[href^="/"]').forEach(a => {
      const h = a.getAttribute('href');
      if (h && !h.startsWith('/api/')) {
        a.setAttribute('href', fixPath(h));
      }
    });
    
    // 修正 <form action="/xxx">
    document.querySelectorAll('form[action^="/"]').forEach(f => {
      f.setAttribute('action', fixPath(f.getAttribute('action')));
    });
    
    // 修正 <link href="/xxx">
    document.querySelectorAll('link[href^="/"]').forEach(l => {
      l.href = fixPath(l.getAttribute('href'));
    });
    
    // 修正 <script src="/xxx">
    document.querySelectorAll('script[src^="/"]').forEach(s => {
      s.src = fixPath(s.getAttribute('src'));
    });
    
    // 修正 <img src="/xxx">
    document.querySelectorAll('img[src^="/"]').forEach(img => {
      img.src = fixPath(img.getAttribute('src'));
    });
  }

  // ========== 拦截动态创建的元素 ==========
  const originalCreateElement = document.createElement.bind(document);
  document.createElement = function(tagName, options) {
    const el = originalCreateElement(tagName, options);
    const tag = tagName.toLowerCase();
    
    // 过一小段时间检查并修正属性
    setTimeout(() => {
      if (el.getAttribute && el.getAttribute('href') && el.getAttribute('href').startsWith('/')) {
        const h = el.getAttribute('href');
        if (!h.startsWith('/api/')) el.setAttribute('href', fixPath(h));
      }
      if (el.getAttribute && el.getAttribute('src') && el.getAttribute('src').startsWith('/')) {
        el.setAttribute('src', fixPath(el.getAttribute('src')));
      }
      if (el.getAttribute && el.getAttribute('action') && el.getAttribute('action').startsWith('/')) {
        el.setAttribute('action', fixPath(el.getAttribute('action')));
      }
    }, 0);
    
    return el;
  };

  // ========== MutationObserver监听DOM变化 ==========
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(m => {
      m.addedNodes.forEach(node => {
        if (node.nodeType === 1) { // Element节点
          // 检查元素自身
          if (node.getAttribute) {
            ['href', 'src', 'action'].forEach(attr => {
              const v = node.getAttribute(attr);
              if (v && v.startsWith('/') && !v.startsWith('/api/')) {
                node.setAttribute(attr, fixPath(v));
              }
            });
          }
          // 检查子元素
          if (node.querySelectorAll) {
            node.querySelectorAll('[href^="/"], [src^="/"], [action^="/"]').forEach(el => {
              ['href', 'src', 'action'].forEach(attr => {
                const v = el.getAttribute(attr);
                if (v && v.startsWith('/') && !v.startsWith('/api/')) {
                  el.setAttribute(attr, fixPath(v));
                }
              });
            });
          }
        }
      });
    });
  });

  // 尽快启动监听
  function startObserver() {
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['href', 'src', 'action']
    });
    patchExistingElements();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startObserver);
    // 也尝试立即执行，尽可能早修补
    setTimeout(startObserver, 0);
  } else {
    startObserver();
  }

  // ========== 种子数据 ==========
  const TODAY = new Date();
  const TODAY_STR = TODAY.toISOString().split('T')[0];
  
  function dateOffset(days) {
    const d = new Date(TODAY);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  }

  const SEED_DATA = {
    // 用户画像
    user_profile: {
      name: '小伴',
      wake_time: '07:00',
      sleep_time: '23:30',
      work_start: '09:00',
      work_end: '18:00',
      focus_blocks: ['09:00-11:30', '14:30-17:00'],
      goals: ['完成产品设计稿', '保持每天30分钟运动', '阅读1小时'],
      productivity_peak: 'morning',
      onboarding_completed: true
    },
    
    // 今日任务
    today_tasks: [
      { id: 't1', title: '整理上周会议纪要', category: 'work', priority: 'high', estimated: 30, completed: true, completed_at: '09:20' },
      { id: 't2', title: '产品需求文档评审', category: 'work', priority: 'high', estimated: 60, completed: true, completed_at: '10:45' },
      { id: 't3', title: '回复重要邮件', category: 'work', priority: 'medium', estimated: 20, completed: true, completed_at: '11:20' },
      { id: 't4', title: '午餐 & 休息', category: 'rest', priority: 'low', estimated: 60, completed: true, completed_at: '12:30' },
      { id: 't5', title: '伴伴UI设计优化', category: 'work', priority: 'high', estimated: 120, completed: false, current: true },
      { id: 't6', title: 'Code Review', category: 'work', priority: 'medium', estimated: 45, completed: false },
      { id: 't7', title: '下午运动30分钟', category: 'exercise', priority: 'medium', estimated: 30, completed: false },
      { id: 't8', title: '阅读《深度工作》', category: 'study', priority: 'low', estimated: 60, completed: false },
      { id: 't9', title: '准备明天的演示', category: 'work', priority: 'high', estimated: 90, completed: false },
    ],
    
    // 今日时间线
    today_timeline: [
      { time: '07:00', type: 'routine', title: '起床 & 晨间洗漱', duration: 30, color: 'neutral' },
      { time: '07:30', type: 'routine', title: '早餐', duration: 25, color: 'meal' },
      { time: '08:00', type: 'exercise', title: '晨间拉伸运动', duration: 20, color: 'rest' },
      { time: '08:30', type: 'study', title: '阅读早报', duration: 25, color: 'study' },
      { time: '09:00', type: 'work', title: '整理上周会议纪要', duration: 30, color: 'focus' },
      { time: '09:30', type: 'work', title: '处理消息 & 沟通', duration: 20, color: 'focus' },
      { time: '09:50', type: 'work', title: '产品需求文档评审', duration: 60, color: 'focus' },
      { time: '10:50', type: 'rest', title: '休息 & 喝水', duration: 10, color: 'rest' },
      { time: '11:00', type: 'work', title: '回复重要邮件', duration: 20, color: 'focus' },
      { time: '11:20', type: 'distract', title: '刷社交媒体（分心）', duration: 15, color: 'distract' },
      { time: '11:35', type: 'work', title: '整理待办清单', duration: 25, color: 'focus' },
      { time: '12:00', type: 'meal', title: '午餐', duration: 60, color: 'meal' },
      { time: '13:00', type: 'rest', title: '午休', duration: 30, color: 'rest' },
      { time: '13:30', type: 'work', title: '处理消息', duration: 20, color: 'focus' },
      { time: '13:50', type: 'work', title: '伴伴UI设计优化', duration: 120, color: 'focus', current: true },
    ],
    
    // 每日计划（AI生成）
    daily_plan: {
      summary: '今天是高效工作的一天！上午专注处理核心任务，下午安排创造性工作和运动。记得在11点和15点休息一下眼睛。',
      schedule: [
        { time: '09:00-10:30', task: '深度工作：产品需求评审', energy: 'high' },
        { time: '10:30-10:45', task: '休息', energy: 'low' },
        { time: '10:45-12:00', task: '邮件 & 沟通', energy: 'medium' },
        { time: '12:00-13:30', task: '午餐 & 午休', energy: 'low' },
        { time: '13:30-15:30', task: '创造性工作：UI设计', energy: 'high' },
        { time: '15:30-16:00', task: '运动 & 休息', energy: 'low' },
        { time: '16:00-17:30', task: 'Code Review & 技术讨论', energy: 'medium' },
        { time: '19:30-20:30', task: '阅读时间', energy: 'low' },
      ],
      tips: ['每工作50分钟休息10分钟', '记得多喝水', '下午3点后不建议喝含咖啡因的饮料']
    },
    
    // 周数据
    weekly_data: [
      { date: dateOffset(-6), tasks: 6, focus_min: 280, rate: 0.75, cats: { work: 180, study: 60, exercise: 40 } },
      { date: dateOffset(-5), tasks: 8, focus_min: 340, rate: 0.89, cats: { work: 220, study: 80, exercise: 40 } },
      { date: dateOffset(-4), tasks: 5, focus_min: 220, rate: 0.68, cats: { work: 140, study: 50, exercise: 30 } },
      { date: dateOffset(-3), tasks: 7, focus_min: 310, rate: 0.82, cats: { work: 200, study: 70, exercise: 40 } },
      { date: dateOffset(-2), tasks: 9, focus_min: 380, rate: 0.91, cats: { work: 260, study: 80, exercise: 40 } },
      { date: dateOffset(-1), tasks: 4, focus_min: 180, rate: 0.62, cats: { work: 100, study: 50, exercise: 30 } },
      { date: dateOffset(0), tasks: 5, focus_min: 240, rate: 0.78, cats: { work: 170, study: 40, exercise: 30 } },
    ],
    
    // 罗盘数据
    compass_data: {
      focus_score: 78,
      balance_score: 72,
      energy_score: 65,
      consistency_score: 80,
      total_focus_hours: 28.5,
      avg_daily_focus: 4.1,
      best_focus_day: dateOffset(-2),
      category_dist: { work: 65, study: 20, exercise: 10, rest: 5 },
      insights: [
        '你在上午9-11点专注力最高，建议安排重要工作',
        '本周运动时间达标，继续保持！',
        '下午3点后容易分心，可以安排运动或琐事'
      ]
    },
    
    // 认知洞察
    cognition_insights: [
      { id: 'i1', type: 'pattern', title: '晨间效率模式', content: '你在上午9:00-11:30的专注度比下午高40%，建议将深度工作安排在这个时段。', icon: '🌅', date: dateOffset(-1) },
      { id: 'i2', type: 'warning', title: '分心提醒', content: '过去3天你在社交媒体上花费了平均45分钟/天，主要集中在11:30-12:00。', icon: '⚠️', date: dateOffset(0) },
      { id: 'i3', type: 'praise', title: '习惯养成', content: '你已经连续5天保持了30分钟运动，太棒了！', icon: '🎉', date: dateOffset(0) },
    ],
    
    // 画布数据
    canvas_nodes: [],
    
    // 设置
    settings: {
      demo_mode: true,
      notifications: true,
      sound_enabled: true,
      ai_model: 'deepseek-chat',
      vision_model: 'glm-4v-flash'
    }
  };

  // ========== 聊天回复 ==========
  const CHAT_RESPONSES = {
    '你好': '你好！我是伴伴，你的时间伙伴 😊 有什么我可以帮你的吗？',
    'hello': '你好呀！今天感觉怎么样？我可以帮你规划时间、分析你的效率模式，或者陪你聊聊天~',
    '今天': '让我看看你今天的安排...上午有产品评审，下午要做UI设计，还有运动时间。要不要我帮你调整一下计划？',
    '计划': '好的！基于你的习惯，我建议：上午9-12点做深度工作，下午1-3点做设计，3点后运动和处理琐事。这样安排可以吗？',
    '累': '辛苦了！要不要休息10分钟？我可以给你放一段轻音乐，或者帮你做个简单的呼吸放松练习。',
    '默认': '我理解啦！作为你的时间伙伴，我会一直在这里陪伴你。你可以问我关于今天的安排、效率分析，或者让我帮你规划时间~'
  };

  // ========== 拦截fetch ==========
  const originalFetch = window.fetch;
  window.fetch = function(input, init) {
    let url = typeof input === 'string' ? input : input.url;
    const method = (init && init.method) || (input && input.method) || 'GET';
    
    // 修正URL
    url = fixPath(url);
    
    // 如果是API请求，返回mock数据
    if (url.includes('/api/')) {
      return mockApiResponse(url, method, init);
    }
    
    // 非API请求，使用修正后的URL调用原fetch
    return originalFetch.call(window, url, init);
  };

  // ========== 拦截XMLHttpRequest ==========
  const OriginalXHR = window.XMLHttpRequest;
  window.XMLHttpRequest = function() {
    const xhr = new OriginalXHR();
    const originalOpen = xhr.open;
    const originalSend = xhr.send;
    let _url, _method;
    
    xhr.open = function(method, url, ...args) {
      _url = url;
      _method = method;
      url = fixPath(url);
      
      // 如果是API请求，我们会在send时拦截
      if (url.includes('/api/')) {
        this._isMockApi = true;
        this._mockUrl = url;
        this._mockMethod = method;
        // 仍然调用open但用一个data url避免真实请求
        return originalOpen.call(this, 'GET', 'data:text/plain,', ...args);
      }
      
      return originalOpen.call(this, method, url, ...args);
    };
    
    xhr.send = function(body) {
      if (this._isMockApi) {
        // 模拟API响应
        setTimeout(() => {
          const response = mockApiSync(this._mockUrl, this._mockMethod, body);
          Object.defineProperty(this, 'status', { value: 200 });
          Object.defineProperty(this, 'responseText', { value: JSON.stringify(response) });
          Object.defineProperty(this, 'response', { value: JSON.stringify(response) });
          Object.defineProperty(this, 'readyState', { value: 4 });
          if (this.onreadystatechange) this.onreadystatechange();
          if (this.onload) this.onload();
        }, 50 + Math.random() * 150);
        return;
      }
      return originalSend.call(this, body);
    };
    
    return xhr;
  };

  // ========== Mock API处理 ==========
  function mockApiSync(url, method, body) {
    try {
      const urlObj = new URL(url, window.location.href);
      const pathname = urlObj.pathname;
      let data = {};
      if (body) {
        try { data = typeof body === 'string' ? JSON.parse(body) : body; } catch(e) {}
      }
      
      return handleApiRoute(pathname, method, data, urlObj.searchParams);
    } catch(e) {
      console.error('Mock API error:', e);
      return { ok: false, error: e.message };
    }
  }

  function mockApiResponse(url, method, init) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const response = mockApiSync(url, method, init && init.body);
        resolve(new Response(JSON.stringify(response), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }));
      }, 50 + Math.random() * 200);
    });
  }

  function handleApiRoute(path, method, data, params) {
    // 简化路径
    path = path.replace(/\/api\//, '/');
    
    // ===== 认证与onboarding =====
    if (path === '/onboarding/status' || path === '/cognition/onboarding-completed') {
      return { completed: localStorage.getItem('onboarding_completed') === 'true' };
    }
    if (path === '/onboarding/complete' && method === 'POST') {
      localStorage.setItem('onboarding_completed', 'true');
      // 保存用户画像
      if (data) {
        const profile = { ...SEED_DATA.user_profile, ...data, onboarding_completed: true };
        localStorage.setItem('user_profile', JSON.stringify(profile));
      }
      return { ok: true, redirect: '/portal' };
    }
    
    // ===== 用户与设置 =====
    if (path === '/user/profile') {
      const saved = localStorage.getItem('user_profile');
      return saved ? JSON.parse(saved) : SEED_DATA.user_profile;
    }
    if (path === '/settings' || path === '/api/settings') {
      if (method === 'GET') {
        const saved = localStorage.getItem('settings');
        return saved ? JSON.parse(saved) : SEED_DATA.settings;
      } else {
        const settings = { ...SEED_DATA.settings, ...data };
        localStorage.setItem('settings', JSON.stringify(settings));
        return { ok: true };
      }
    }
    if (path === '/data/demo-mode') {
      if (method === 'GET') return { demo_mode: true };
      return { ok: true, demo_mode: data.enabled };
    }
    
    // ===== 今日任务与时间线 =====
    if (path === '/today/tasks' || path === '/tasks/today') {
      const saved = localStorage.getItem('today_tasks');
      const tasks = saved ? JSON.parse(saved) : SEED_DATA.today_tasks;
      if (method === 'POST') {
        // 添加/更新任务
        if (data.id) {
          const idx = tasks.findIndex(t => t.id === data.id);
          if (idx >= 0) tasks[idx] = { ...tasks[idx], ...data };
          else tasks.push({ id: 't' + Date.now(), ...data });
        } else {
          tasks.push({ id: 't' + Date.now(), ...data, completed: false });
        }
        localStorage.setItem('today_tasks', JSON.stringify(tasks));
        return { ok: true, tasks };
      }
      return { tasks };
    }
    if (path === '/today/timeline' || path === '/timeline/today') {
      return { timeline: SEED_DATA.today_timeline, date: TODAY_STR };
    }
    if (path === '/today/plan' || path === '/plan/today') {
      return SEED_DATA.daily_plan;
    }
    
    // ===== 周数据与统计 =====
    if (path === '/weekly' || path === '/stats/weekly') {
      return { weekly: SEED_DATA.weekly_data };
    }
    
    // ===== 时间罗盘 =====
    if (path === '/compass' || path === '/compass/data') {
      return SEED_DATA.compass_data;
    }
    
    // ===== 认知洞察 =====
    if (path === '/cognition/insights' || path === '/insights') {
      return { insights: SEED_DATA.cognition_insights };
    }
    
    // ===== 画布 =====
    if (path.startsWith('/canvas')) {
      return { nodes: SEED_DATA.canvas_nodes, ok: true };
    }
    
    // ===== 截图/视觉识别 =====
    if (path === '/canvas/extract' || path === '/vision/analyze' || path === '/screenshot/analyze') {
      return {
        ok: true,
        tasks: SEED_DATA.today_tasks.filter(t => !t.completed).slice(0, 3),
        timeline: SEED_DATA.today_timeline.slice(-5),
        message: '已从截图中识别出你的当前工作状态，继续加油！'
      };
    }
    
    // ===== 聊天 =====
    if (path === '/chat' || path === '/chat/send') {
      const msg = (data && data.message) || '';
      let reply = CHAT_RESPONSES['默认'];
      for (const key in CHAT_RESPONSES) {
        if (key !== '默认' && msg.includes(key)) {
          reply = CHAT_RESPONSES[key];
          break;
        }
      }
      return { reply, timestamp: Date.now() };
    }
    
    // ===== 语音 =====
    if (path === '/voice/tts' || path === '/tts') {
      return { ok: true, message: 'TTS功能在静态Demo中暂不可用' };
    }
    if (path === '/voice/asr' || path === '/asr') {
      return { ok: true, text: '', message: 'ASR功能在静态Demo中暂不可用' };
    }
    
    // ===== 计划选项/重新生成 =====
    if (path === '/plan/options' || path === '/plan/generate') {
      return {
        options: [
          { id: 'balanced', name: '平衡模式', desc: '工作休息均衡，适合普通日子' },
          { id: 'focus', name: '专注模式', desc: '大块深度工作时间，适合赶项目' },
          { id: 'relaxed', name: '轻松模式', desc: '较多休息时间，适合状态不佳时' }
        ]
      };
    }
    
    // ===== 早/晚复盘 =====
    if (path === '/review/morning') {
      return {
        ok: true,
        greeting: '早上好！昨天睡得怎么样？',
        yesterday_summary: '昨天你完成了8个任务，专注时长4.2小时，很棒！',
        today_preview: '今天有3个高优先级任务待完成'
      };
    }
    if (path === '/review/evening') {
      return {
        ok: true,
        today_summary: '今天你完成了5个任务，专注时长3.8小时',
        score: 78,
        highlights: ['产品评审顺利完成', '保持了运动习惯'],
        improvements: ['下午有点分心', '可以更早开始准备演示']
      };
    }
    
    // ===== 行为分析 =====
    if (path === '/behavior/data') {
      return { patterns: [], score: 75 };
    }
    
    // ===== 默认响应 =====
    return { ok: true, message: '静态Demo模式' };
  }

  // ========== 拦截点击a标签的默认行为（对于路由链接）==========
  document.addEventListener('click', function(e) {
    const a = e.target.closest && e.target.closest('a[href]');
    if (a) {
      const href = a.getAttribute('href');
      if (href && href.startsWith('/') && !href.startsWith('/api/') && !href.startsWith('//') && !href.startsWith('http')) {
        e.preventDefault();
        window.location.href = fixPath(href);
      }
    }
  }, true);
  
  // 拦截 history.pushState/replaceState
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  history.pushState = function(state, title, url) {
    if (url && typeof url === 'string' && url.startsWith('/') && !url.startsWith('/api/')) {
      url = fixPath(url);
    }
    return originalPushState.call(this, state, title, url);
  };
  history.replaceState = function(state, title, url) {
    if (url && typeof url === 'string' && url.startsWith('/') && !url.startsWith('/api/')) {
      url = fixPath(url);
    }
    return originalReplaceState.call(this, state, title, url);
  };

  // ========== 暴露一些工具函数到全局 ==========
  window.BanbanStatic = {
    fixPath,
    seedData: SEED_DATA,
    resetDemo: function() {
      localStorage.clear();
      location.reload();
    }
  };

  console.log('%c 伴伴 Banban %c 静态Demo模式已启动', 
    'background:#E8927C;color:white;padding:2px 6px;border-radius:4px;font-weight:bold;', 
    'color:#7CB5A8;');

})();
