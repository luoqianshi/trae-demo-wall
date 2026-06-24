/* ============================================================
   心径 Demo 逻辑 demo.js
   高考选专业全流程：登录 → 答题 → 生成报告 → 雷达图 → 排行榜 → 解锁 → 分享
   纯前端 mock，无后端依赖
   ============================================================ */
(function () {
  'use strict';

  /* ============================================================
     一、Mock 数据
     ============================================================ */

  // 题库：8 道示例题（3 霍兰德 + 3 MBTI + 2 多元智能）
  // scale: 量表；dim: 该选项计入的维度；value: 计分
  const QUESTIONS = [
    {
      id: 1, scale: '霍兰德职业兴趣', scaleShort: 'Holland',
      q: '面对一个复杂的机械装置，你最想做的事是？',
      options: [
        { text: '拆开看看内部结构和工作原理', dim: 'R', value: 2 },
        { text: '研究它背后的科学原理和设计逻辑', dim: 'I', value: 2 },
        { text: '改造它的外观，让它更有美感', dim: 'A', value: 2 },
        { text: '思考如何把它推广给更多人使用', dim: 'E', value: 2 }
      ]
    },
    {
      id: 2, scale: '霍兰德职业兴趣', scaleShort: 'Holland',
      q: '在团队项目中，你最享受的角色是？',
      options: [
        { text: '动手实现，把想法变成实物', dim: 'R', value: 2 },
        { text: '负责调研分析，提供数据支撑', dim: 'I', value: 2 },
        { text: '主导创意，设计整体方案', dim: 'A', value: 2 },
        { text: '协调团队，推动项目落地', dim: 'S', value: 2 }
      ]
    },
    {
      id: 3, scale: '霍兰德职业兴趣', scaleShort: 'Holland',
      q: '周末空闲时间，你更愿意？',
      options: [
        { text: '整理收纳，让一切井井有条', dim: 'C', value: 2 },
        { text: '阅读科普或专业书籍', dim: 'I', value: 2 },
        { text: '参加社交活动认识新朋友', dim: 'S', value: 2 },
        { text: '策划一次小型聚会或活动', dim: 'E', value: 2 }
      ]
    },
    {
      id: 4, scale: 'MBTI 人格类型', scaleShort: 'MBTI',
      q: '在嘈杂的聚会中待久了，你会？',
      options: [
        { text: '感到精力消耗，想找个安静地方独处', dim: 'I', value: 2 },
        { text: '越聊越有精神，享受其中', dim: 'E', value: 2 }
      ]
    },
    {
      id: 5, scale: 'MBTI 人格类型', scaleShort: 'MBTI',
      q: '面对一个新问题，你更倾向于？',
      options: [
        { text: '关注具体细节和事实，脚踏实地解决', dim: 'S', value: 2 },
        { text: '把握整体规律和可能性，寻找创新解法', dim: 'N', value: 2 }
      ]
    },
    {
      id: 6, scale: 'MBTI 人格类型', scaleShort: 'MBTI',
      q: '做重要决定时，你更看重？',
      options: [
        { text: '客观逻辑与公平原则', dim: 'T', value: 2 },
        { text: '对人的影响与和谐关系', dim: 'F', value: 2 }
      ]
    },
    {
      id: 7, scale: '多元智能', scaleShort: 'MI',
      q: '学习一个新概念时，你最容易理解的方式是？',
      options: [
        { text: '通过公式、逻辑推导和数据分析', dim: 'logic', value: 2 },
        { text: '通过图表、空间想象和可视化', dim: 'space', value: 2 },
        { text: '通过语言文字的精确描述', dim: 'lang', value: 2 }
      ]
    },
    {
      id: 8, scale: '多元智能', scaleShort: 'MI',
      q: '你最擅长处理哪类任务？',
      options: [
        { text: '发现事物之间的内在联系与规律', dim: 'logic', value: 2 },
        { text: '在脑海中构建模型与空间结构', dim: 'space', value: 2 },
        { text: '用语言清晰表达复杂想法', dim: 'lang', value: 2 }
      ]
    }
  ];

  // 霍兰德六维 mock 雷达图数据（R/I/A/S/E/C）
  // I 最高，A 次之，符合"研究型"人格
  const RADAR_DATA = [
    { dim: 'R', label: '现实型', value: 45, desc: '动手操作' },
    { dim: 'I', label: '研究型', value: 92, desc: '探索分析' },
    { dim: 'A', label: '艺术型', value: 78, desc: '创意表达' },
    { dim: 'S', label: '社会型', value: 55, desc: '助人沟通' },
    { dim: 'E', label: '企业型', value: 48, desc: '影响领导' },
    { dim: 'C', label: '常规型', value: 52, desc: '条理执行' }
  ];

  // 人格画像文案
  const PERSONA = {
    type: '研究型 · INTJ',
    summary: '你是一个<strong>善于分析、追求真理的思考者</strong>。霍兰德六维中你的<strong>研究型（I）维度高达 92</strong>，意味着你天生被复杂问题吸引，享受在抽象领域探索本质。结合 MBTI 中 <strong>INTJ「建筑师」人格</strong>——直觉思维让你擅长系统化构建认知框架，你更看重知识的深度与探索的自由，而非短期回报。多元智能中逻辑数学与空间智能突出，适合需要深度思考与抽象建模的领域。'
  };

  // 专业适配度排行榜 Top20（mock）
  const MAJORS = [
    { name: '计算机科学与技术', score: 95, tags: ['高薪', '前景好', '硬核'] },
    { name: '人工智能', score: 93, tags: ['风口', '前沿', '高薪'] },
    { name: '数据科学与大数据技术', score: 91, tags: ['热门', '应用广'] },
    { name: '软件工程', score: 88, tags: ['实用', '就业稳'] },
    { name: '信息安全', score: 86, tags: ['稀缺', '高薪'] },
    { name: '统计学', score: 84, tags: ['基础', '万金油'] },
    { name: '数学与应用数学', score: 82, tags: ['深造优', '基础'] },
    { name: '电子信息工程', score: 80, tags: ['硬核', '前景好'] },
    { name: '通信工程', score: 78, tags: ['稳定', '技术流'] },
    { name: '自动化', score: 76, tags: ['交叉', '实用'] },
    { name: '物理学', score: 74, tags: ['深造优', '基础'] },
    { name: '金融工程', score: 72, tags: ['高薪', '交叉'] },
    { name: '工业设计', score: 70, tags: ['创意', '实用'] },
    { name: '生物信息学', score: 68, tags: ['前沿', '交叉'] },
    { name: '应用心理学', score: 66, tags: ['人文', '有趣'] },
    { name: '哲学', score: 64, tags: ['思辨', '深造优'] },
    { name: '建筑学', score: 62, tags: ['创意', '空间'] },
    { name: '测控技术与仪器', score: 60, tags: ['硬核', '稳定'] },
    { name: '数字媒体技术', score: 58, tags: ['创意', '应用'] },
    { name: '系统科学与工程', score: 56, tags: ['前沿', '交叉'] }
  ];

  // 深度解读文案
  const DEEP_INTERPRETATION = '你的研究型特质（I 维度 92）显著高于平均水平，这意味着你在面对复杂问题时能保持高度专注与好奇心。结合 MBTI 中 INTJ 的直觉思维偏好，你天生擅长在抽象领域构建系统性认知框架。<br/><br/>在专业选择上，你更看重<strong>知识深度与探索自由度</strong>，而非短期回报。计算机科学、人工智能、数据科学之所以位列前三，是因为它们既能满足你对底层逻辑的探索欲，又具备充分的抽象建模空间。建议优先考虑带「实验班」「拔尖计划」标签的培养项目，以获得更大的自主探索空间。<br/><br/>需要注意的是，你的社会型（S）与企业型（E）维度偏低，意味着纯管理或强社交导向的方向可能让你感到能量消耗。在大学中可通过<strong>「技术 + 影响力」</strong>的路径（如开源贡献、技术写作）来平衡，而非强行转向纯管理。';

  // 30 天成长路径（周计划）
  const GROWTH_PATH = [
    { week: '第 1 周', title: '认知奠基', tasks: ['精读目标专业培养方案与核心课程大纲', '在 B 站/Coursera 体验 2 节专业入门课', '加入 1 个相关学习社群'] },
    { week: '第 2 周', title: '能力试探', tasks: ['完成 1 个专业相关的小项目（如写一个简单程序）', '阅读 1 本领域经典入门书籍', '记录自己的兴奋点与卡点'] },
    { week: '第 3 周', title: '深度验证', tasks: ['联系 1 位该专业的学长学姐交流', '了解专业的 3 个细分方向', '评估自己与方向的匹配度'] },
    { week: '第 4 周', title: '决策收敛', tasks: ['列出 Top3 专业的优劣势对比', '与家人沟通你的思考过程', '形成最终志愿填报策略'] }
  ];

  /* ============================================================
     二、状态管理
     ============================================================ */
  const state = {
    currentView: 'view-login',
    viewHistory: ['view-login'],
    quizIndex: 0,
    answers: [],         // {questionId, dim, value}
    unlocked: false,
    loadingTimer: null
  };

  /* ============================================================
     三、视图切换引擎
     ============================================================ */
  function showView(viewId, opts) {
    opts = opts || {};
    const views = document.querySelectorAll('.view');
    const current = document.getElementById(state.currentView);
    const target = document.getElementById(viewId);
    if (!target) return;

    // 切换 active 类（CSS 处理过渡）
    views.forEach(function (v) { v.classList.remove('active'); });
    target.classList.add('active');

    // 记录历史（除非指定 replace）
    if (!opts.replace) {
      state.viewHistory.push(viewId);
    }
    state.currentView = viewId;

    // 滚动到顶部
    const body = target.querySelector('.demo-body') || target;
    if (body) body.scrollTop = 0;

    // 触发视图特定初始化
    if (viewId === 'view-quiz' && opts.initQuiz) {
      renderQuestion();
    }
    if (viewId === 'view-loading') {
      startLoading();
    }
    if (viewId === 'view-report') {
      renderReport();
    }
    if (viewId === 'view-share') {
      renderShareCard();
    }
  }

  function goBack() {
    if (state.viewHistory.length > 1) {
      state.viewHistory.pop();
      const prev = state.viewHistory[state.viewHistory.length - 1];
      showView(prev, { replace: true });
    }
  }

  /* ============================================================
     四、登录
     ============================================================ */
  function initLogin() {
    const btn = document.getElementById('loginBtn');
    const check = document.getElementById('agreeCheck');
    if (!btn) return;
    btn.addEventListener('click', function () {
      if (check && !check.checked) {
        showToast('请先同意用户协议与隐私政策');
        return;
      }
      // 模拟登录，进入测评首页
      showView('view-home');
    });
  }

  /* ============================================================
     五、测评首页 → 开始答题
     ============================================================ */
  function initHome() {
    const btn = document.getElementById('startQuizBtn');
    if (!btn) return;
    btn.addEventListener('click', function () {
      state.quizIndex = 0;
      state.answers = [];
      showView('view-quiz', { initQuiz: true });
    });
  }

  /* ============================================================
     六、答题逻辑
     ============================================================ */
  function renderQuestion() {
    const idx = state.quizIndex;
    const q = QUESTIONS[idx];
    if (!q) return;

    // 进度
    const total = QUESTIONS.length;
    document.getElementById('quizCurrent').textContent = idx + 1;
    document.getElementById('quizTotal').textContent = total;
    const pct = ((idx) / total) * 100;
    document.getElementById('quizProgressFill').style.width = pct + '%';

    // 量表标签
    document.getElementById('quizScaleTag').textContent = q.scale;

    // 题干（带淡入动画）
    const qEl = document.getElementById('quizQuestion');
    qEl.style.opacity = '0';
    qEl.style.transform = 'translateY(10px)';
    qEl.textContent = q.q;
    setTimeout(function () {
      qEl.style.transition = 'opacity 0.4s, transform 0.4s';
      qEl.style.opacity = '1';
      qEl.style.transform = 'translateY(0)';
    }, 50);

    // 选项
    const optsWrap = document.getElementById('quizOptions');
    optsWrap.innerHTML = '';
    const marks = ['A', 'B', 'C', 'D'];
    q.options.forEach(function (opt, i) {
      const btn = document.createElement('button');
      btn.className = 'quiz-option';
      btn.style.opacity = '0';
      btn.style.transform = 'translateX(20px)';
      btn.innerHTML =
        '<span class="opt-mark">' + (marks[i] || (i + 1)) + '</span>' +
        '<span class="opt-text">' + opt.text + '</span>';
      btn.addEventListener('click', function () {
        selectOption(opt, btn);
      });
      optsWrap.appendChild(btn);
      // 错峰入场
      setTimeout(function () {
        btn.style.transition = 'opacity 0.4s, transform 0.4s';
        btn.style.opacity = '1';
        btn.style.transform = 'translateX(0)';
      }, 80 + i * 60);
    });
  }

  function selectOption(opt, btnEl) {
    // 防止重复点击
    if (btnEl.classList.contains('selected')) return;
    // 标记选中
    const allOpts = document.querySelectorAll('.quiz-option');
    allOpts.forEach(function (o) { o.style.pointerEvents = 'none'; });
    btnEl.classList.add('selected');

    // 记录答案
    state.answers.push({
      questionId: QUESTIONS[state.quizIndex].id,
      dim: opt.dim,
      value: opt.value
    });

    // 更新进度条到当前题完成位置
    const total = QUESTIONS.length;
    const pct = ((state.quizIndex + 1) / total) * 100;
    document.getElementById('quizProgressFill').style.width = pct + '%';

    // 延迟后进入下一题
    setTimeout(function () {
      state.quizIndex++;
      if (state.quizIndex >= QUESTIONS.length) {
        // 答题完成，进入生成中
        showView('view-loading');
      } else {
        renderQuestion();
      }
    }, 480);
  }

  /* ============================================================
     七、报告生成中
     ============================================================ */
  function startLoading() {
    const fill = document.getElementById('loadingFill');
    const textWrap = document.getElementById('loadingText');
    const texts = [
      '正在计算你的维度得分...',
      '正在构建人格画像...',
      '正在匹配适配专业...',
      '正在生成你的罗盘报告...'
    ];

    // 进度条
    let progress = 0;
    fill.style.width = '0%';

    // 文案轮播
    let textIdx = 0;
    function showText(idx) {
      textWrap.innerHTML = '<span class="active">' + texts[idx] + '</span>';
    }
    showText(0);

    const textTimers = [];
    const interval = 750; // 每段文案间隔
    texts.forEach(function (_, i) {
      if (i === 0) return;
      textTimers.push(setTimeout(function () { showText(i); }, interval * i));
    });

    // 进度条动画（约 3 秒到 100%）
    const progressTimer = setInterval(function () {
      progress += Math.random() * 8 + 4;
      if (progress >= 100) {
        progress = 100;
        clearInterval(progressTimer);
      }
      fill.style.width = progress + '%';
    }, 120);

    // 3.2 秒后进入报告
    state.loadingTimer = setTimeout(function () {
      showView('view-report');
    }, 3200);
  }

  /* ============================================================
     八、报告渲染
     ============================================================ */
  function renderReport() {
    // 人格类型
    document.getElementById('personaType').textContent = PERSONA.type;

    // 人格画像
    document.getElementById('personaSummary').innerHTML = PERSONA.summary;

    // 雷达图
    drawRadar(document.getElementById('radarSvg'), RADAR_DATA, 130, 90);

    // 雷达图例
    const legend = document.getElementById('radarLegend');
    legend.innerHTML = '';
    RADAR_DATA.forEach(function (d) {
      const item = document.createElement('div');
      item.className = 'radar-legend-item';
      item.innerHTML = '<span class="dot"></span><span>' + d.label + ' ' + d.value + '</span>';
      legend.appendChild(item);
    });

    // 专业排行榜（免费 Top3）
    renderMajorList();

    // 根据解锁状态切换内容
    if (state.unlocked) {
      applyUnlocked();
    } else {
      applyLocked();
    }
  }

  function renderMajorList() {
    const wrap = document.getElementById('majorList');
    wrap.innerHTML = '';
    const count = state.unlocked ? MAJORS.length : 3;
    for (let i = 0; i < count; i++) {
      const m = MAJORS[i];
      const item = document.createElement('div');
      item.className = 'major-item';
      const tagsHtml = m.tags.map(function (t) {
        const cls = (t === '高薪' || t === '风口' || t === '前沿') ? 'major-tag gold' : 'major-tag';
        return '<span class="' + cls + '">' + t + '</span>';
      }).join('');
      item.innerHTML =
        '<div class="major-rank">' + (i + 1) + '</div>' +
        '<div class="major-info">' +
          '<div class="major-name">' + m.name + '<div class="major-tags">' + tagsHtml + '</div></div>' +
          '<div class="major-bar"><div class="major-bar-fill" style="width:0%;"></div></div>' +
        '</div>' +
        '<div class="major-score">' + m.score + '%</div>';
      wrap.appendChild(item);
      // 进度条动画
      setTimeout(function (bar) {
        bar.style.width = m.score + '%';
      }, 100 + i * 80, item.querySelector('.major-bar-fill'));
    }
  }

  /* ============================================================
     九、雷达图绘制（SVG，带展开动画）
     ============================================================ */
  function drawRadar(svg, data, cx, maxR) {
    if (!svg) return;
    svg.innerHTML = '';
    const ns = 'http://www.w3.org/2000/svg';
    const n = data.length;
    const levels = 5;

    // 计算各点坐标
    function pointAt(angleDeg, radius) {
      const rad = (angleDeg - 90) * Math.PI / 180;
      return { x: cx + Math.cos(rad) * radius, y: cy + Math.sin(rad) * radius };
    }
    const cy = cx; // 正方形画布

    // 网格层（多边形）
    for (let l = 1; l <= levels; l++) {
      const r = (maxR / levels) * l;
      const pts = [];
      for (let i = 0; i < n; i++) {
        const angle = (360 / n) * i;
        const p = pointAt(angle, r);
        pts.push(p.x.toFixed(1) + ',' + p.y.toFixed(1));
      }
      const poly = document.createElementNS(ns, 'polygon');
      poly.setAttribute('points', pts.join(' '));
      poly.setAttribute('fill', 'none');
      poly.setAttribute('stroke', l === levels ? 'rgba(200,164,92,0.35)' : 'rgba(200,164,92,0.15)');
      poly.setAttribute('stroke-width', '1');
      svg.appendChild(poly);
    }

    // 轴线
    for (let i = 0; i < n; i++) {
      const angle = (360 / n) * i;
      const p = pointAt(angle, maxR);
      const line = document.createElementNS(ns, 'line');
      line.setAttribute('x1', cx);
      line.setAttribute('y1', cy);
      line.setAttribute('x2', p.x);
      line.setAttribute('y2', p.y);
      line.setAttribute('stroke', 'rgba(200,164,92,0.15)');
      line.setAttribute('stroke-width', '1');
      svg.appendChild(line);
    }

    // 数据多边形（带动画）
    const dataPts = data.map(function (d, i) {
      const angle = (360 / n) * i;
      const r = (d.value / 100) * maxR;
      const p = pointAt(angle, r);
      return p;
    });
    const dataPoly = document.createElementNS(ns, 'polygon');
    dataPoly.setAttribute('points', dataPts.map(function (p) { return p.x.toFixed(1) + ',' + p.y.toFixed(1); }).join(' '));
    dataPoly.setAttribute('fill', 'url(#radarFill)');
    dataPoly.setAttribute('stroke', '#F59F00');
    dataPoly.setAttribute('stroke-width', '2');
    dataPoly.setAttribute('stroke-linejoin', 'round');
    dataPoly.style.transformOrigin = cx + 'px ' + cy + 'px';
    dataPoly.style.transform = 'scale(0)';
    dataPoly.style.opacity = '0';
    dataPoly.style.transition = 'transform 0.9s cubic-bezier(0.34,1.56,0.64,1), opacity 0.6s';

    // 渐变定义
    const defs = document.createElementNS(ns, 'defs');
    const grad = document.createElementNS(ns, 'radialGradient');
    grad.setAttribute('id', 'radarFill');
    grad.setAttribute('cx', '50%');
    grad.setAttribute('cy', '50%');
    grad.setAttribute('r', '50%');
    const s1 = document.createElementNS(ns, 'stop');
    s1.setAttribute('offset', '0%');
    s1.setAttribute('stop-color', '#F59F00');
    s1.setAttribute('stop-opacity', '0.5');
    const s2 = document.createElementNS(ns, 'stop');
    s2.setAttribute('offset', '100%');
    s2.setAttribute('stop-color', '#C8A45C');
    s2.setAttribute('stop-opacity', '0.2');
    grad.appendChild(s1);
    grad.appendChild(s2);
    defs.appendChild(grad);
    svg.appendChild(defs);
    svg.appendChild(dataPoly);

    // 数据点
    const dots = [];
    dataPts.forEach(function (p) {
      const dot = document.createElementNS(ns, 'circle');
      dot.setAttribute('cx', p.x);
      dot.setAttribute('cy', p.y);
      dot.setAttribute('r', '3.5');
      dot.setAttribute('fill', '#F59F00');
      dot.setAttribute('stroke', '#1A1F3A');
      dot.setAttribute('stroke-width', '1.5');
      dot.style.opacity = '0';
      dot.style.transition = 'opacity 0.4s';
      svg.appendChild(dot);
      dots.push(dot);
    });

    // 标签（偏移量与字号按 maxR 等比缩放，避免迷你版溢出）
    const labelOffset = maxR * 0.2;
    const scoreOffset = maxR * 0.36;
    const labelFont = Math.max(8, Math.round(maxR * 0.12));
    const scoreFont = Math.max(7, Math.round(maxR * 0.1));
    data.forEach(function (d, i) {
      const angle = (360 / n) * i;
      const p = pointAt(angle, maxR + labelOffset);
      const text = document.createElementNS(ns, 'text');
      text.setAttribute('x', p.x);
      text.setAttribute('y', p.y);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'middle');
      text.setAttribute('fill', '#E8C77E');
      text.setAttribute('font-size', String(labelFont));
      text.setAttribute('font-weight', '600');
      text.textContent = d.dim;
      svg.appendChild(text);

      // 分值小字
      const p2 = pointAt(angle, maxR + scoreOffset);
      const score = document.createElementNS(ns, 'text');
      score.setAttribute('x', p2.x);
      score.setAttribute('y', p2.y);
      score.setAttribute('text-anchor', 'middle');
      score.setAttribute('dominant-baseline', 'middle');
      score.setAttribute('fill', '#7A7599');
      score.setAttribute('font-size', String(scoreFont));
      score.textContent = d.value;
      svg.appendChild(score);
    });

    // 触发展开动画
    setTimeout(function () {
      dataPoly.style.transform = 'scale(1)';
      dataPoly.style.opacity = '1';
      dots.forEach(function (d, i) {
        setTimeout(function () { d.style.opacity = '1'; }, 400 + i * 80);
      });
    }, 150);
  }

  /* ============================================================
     十、解锁逻辑
     ============================================================ */
  function applyLocked() {
    // 显示锁定块
    const lockedRanking = document.getElementById('lockedRanking');
    const lockedDeep = document.getElementById('lockedDeepSection');
    const lockedPath = document.getElementById('lockedPathSection');
    if (lockedRanking) lockedRanking.style.display = '';
    if (lockedDeep) lockedDeep.style.display = '';
    if (lockedPath) lockedPath.style.display = '';
    // 显示解锁面板
    const panel = document.getElementById('unlockPanel');
    if (panel) panel.classList.add('show');
    // 重置为付费面板
    showPayPanel();
  }

  function applyUnlocked() {
    // 移除锁定块，显示完整内容
    const lockedRanking = document.getElementById('lockedRanking');
    if (lockedRanking) lockedRanking.innerHTML = '';

    // 替换深度解读
    const deepSec = document.getElementById('lockedDeepSection');
    if (deepSec) {
      deepSec.querySelector('.report-section-title').innerHTML = '<span class="icon">📖</span> 深度解读';
      deepSec.querySelector('div[style*="position:relative"]').innerHTML =
        '<div style="font-size:0.88rem; line-height:1.8; color:var(--text-secondary);">' + DEEP_INTERPRETATION + '</div>';
    }

    // 替换成长路径
    const pathSec = document.getElementById('lockedPathSection');
    if (pathSec) {
      pathSec.querySelector('.report-section-title').innerHTML = '<span class="icon">🗺️</span> 30 天成长路径';
      const html = GROWTH_PATH.map(function (g) {
        const tasks = g.tasks.map(function (t) { return '<li>' + t + '</li>'; }).join('');
        return '<div style="margin-bottom:16px; padding:14px; background:rgba(59,91,219,0.08); border-radius:10px; border-left:3px solid var(--compass-gold);">' +
          '<div style="font-weight:700; color:var(--text-gold); margin-bottom:6px; font-size:0.9rem;">' + g.week + ' · ' + g.title + '</div>' +
          '<ul style="font-size:0.82rem; color:var(--text-secondary); line-height:1.8; padding-left:16px;">' + tasks + '</ul>' +
          '</div>';
      }).join('');
      pathSec.querySelector('div[style*="position:relative"]').innerHTML = html;
    }

    // 隐藏解锁面板
    const panel = document.getElementById('unlockPanel');
    if (panel) panel.classList.remove('show');

    // 重新渲染完整排行榜
    renderMajorList();

    // 添加分享按钮（如果还没有）
    ensureShareButton();
  }

  function ensureShareButton() {
    let btn = document.getElementById('goShareBtn');
    if (!btn) {
      const reportBody = document.getElementById('reportBody');
      btn = document.createElement('button');
      btn.id = 'goShareBtn';
      btn.className = 'btn btn-gold btn-block';
      btn.textContent = '生成分享卡片';
      btn.style.margin = '8px 0 24px';
      btn.addEventListener('click', function () {
        showView('view-share');
      });
      reportBody.appendChild(btn);
    }
  }

  function showPayPanel() {
    document.getElementById('unlockMain').style.display = '';
    document.getElementById('unlockInvite').style.display = 'none';
  }

  function showInvitePanel() {
    document.getElementById('unlockMain').style.display = 'none';
    document.getElementById('unlockInvite').style.display = '';
  }

  function initUnlock() {
    // 付费解锁
    const payBtn = document.getElementById('payUnlockBtn');
    if (payBtn) {
      payBtn.addEventListener('click', function () {
        // 弹出支付成功
        document.getElementById('payModal').classList.add('show');
      });
    }

    // 弹窗确认
    const modalBtn = document.getElementById('modalConfirmBtn');
    if (modalBtn) {
      modalBtn.addEventListener('click', function () {
        document.getElementById('payModal').classList.remove('show');
        state.unlocked = true;
        applyUnlocked();
        showToast('🎉 完整报告已解锁');
      });
    }

    // 切换到邀请面板
    const inviteLink = document.getElementById('inviteLink');
    if (inviteLink) {
      inviteLink.addEventListener('click', function (e) {
        e.preventDefault();
        showInvitePanel();
      });
    }

    // 关闭邀请面板
    const closeInvite = document.getElementById('closeInviteBtn');
    if (closeInvite) {
      closeInvite.addEventListener('click', function () {
        showPayPanel();
      });
    }

    // 返回付费
    const backPay = document.getElementById('backToPayLink');
    if (backPay) {
      backPay.addEventListener('click', function (e) {
        e.preventDefault();
        showPayPanel();
      });
    }

    // 模拟邀请解锁
    const mockInvite = document.getElementById('mockInviteBtn');
    if (mockInvite) {
      mockInvite.addEventListener('click', function () {
        state.unlocked = true;
        applyUnlocked();
        showToast('🎉 邀请成功，完整报告已解锁');
      });
    }
  }

  /* ============================================================
     十一、分享卡片
     ============================================================ */
  function renderShareCard() {
    document.getElementById('shareType').textContent = PERSONA.type;
    // 绘制迷你雷达图
    drawRadar(document.getElementById('shareRadar'), RADAR_DATA, 75, 52);
  }

  function initShare() {
    const saveBtn = document.getElementById('saveShareBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        showToast('图片已保存到相册（Demo 模拟）');
      });
    }
    const backBtn = document.getElementById('backHomeBtn');
    if (backBtn) {
      backBtn.addEventListener('click', function () {
        // 回到测评首页，重置状态
        state.viewHistory = ['view-home'];
        showView('view-home', { replace: true });
      });
    }
    const shareBack = document.getElementById('shareBackBtn');
    if (shareBack) {
      shareBack.addEventListener('click', function () {
        goBack();
      });
    }
  }

  /* ============================================================
     十二、报告页返回按钮
     ============================================================ */
  function initBackButtons() {
    const reportBack = document.getElementById('reportBackBtn');
    if (reportBack) {
      reportBack.addEventListener('click', function () {
        // 报告页返回到测评首页
        state.viewHistory = ['view-home'];
        showView('view-home', { replace: true });
      });
    }
  }

  /* ============================================================
     十三、Toast 提示
     ============================================================ */
  function showToast(msg) {
    let toast = document.getElementById('appToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'appToast';
      toast.style.cssText =
        'position:fixed; left:50%; top:50%; transform:translate(-50%,-50%);' +
        'background:rgba(14,18,38,0.95); color:#E8C77E; padding:14px 24px;' +
        'border-radius:12px; border:1px solid rgba(200,164,92,0.4);' +
        'font-size:0.9rem; z-index:9999; opacity:0; transition:opacity 0.3s;' +
        'pointer-events:none; box-shadow:0 8px 30px rgba(0,0,0,0.5); text-align:center; max-width:280px;';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(function () {
      toast.style.opacity = '0';
    }, 2200);
  }

  /* ============================================================
     十四、状态栏时间
     ============================================================ */
  function initStatusTime() {
    const el = document.getElementById('statusTime');
    if (!el) return;
    const update = function () {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      el.textContent = h + ':' + m;
    };
    update();
    setInterval(update, 30000);
  }

  /* ============================================================
     启动
     ============================================================ */
  function init() {
    initStatusTime();
    initLogin();
    initHome();
    initUnlock();
    initShare();
    initBackButtons();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
