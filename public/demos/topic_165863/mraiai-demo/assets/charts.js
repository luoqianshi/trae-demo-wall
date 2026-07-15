// Mraiai Interactive Demo - All interactions
(function () {
  'use strict';

  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim() || '#00d4ff';
  var accent2 = style.getPropertyValue('--accent2').trim() || '#b537f2';
  var accent3 = style.getPropertyValue('--accent3').trim() || '#00ff88';
  var ink = style.getPropertyValue('--ink').trim() || '#e8eaf0';
  var muted = style.getPropertyValue('--muted').trim() || '#6b7494';
  var bg2 = style.getPropertyValue('--bg2').trim() || '#0e1320';

  // =============================================
  // 1. Animated Particle Background
  // =============================================
  var canvas = document.getElementById('bg-canvas');
  if (canvas) {
    var ctx = canvas.getContext('2d');
    var particles = [];
    var mouse = { x: -1000, y: -1000 };
    var PARTICLE_COUNT = 60;
    var MAX_DIST = 140;

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    function initParticles() {
      particles = [];
      for (var i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          r: Math.random() * 1.5 + 0.5
        });
      }
    }
    initParticles();

    document.addEventListener('mousemove', function (e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });

    function animateParticles() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        // Mouse repel
        var dx = p.x - mouse.x;
        var dy = p.y - mouse.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100) {
          p.x += dx * 0.02;
          p.y += dy * 0.02;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 212, 255, 0.5)';
        ctx.fill();
      }

      // Draw connections
      for (var a = 0; a < particles.length; a++) {
        for (var b = a + 1; b < particles.length; b++) {
          var dx = particles[a].x - particles[b].x;
          var dy = particles[a].y - particles[b].y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MAX_DIST) {
            var alpha = (1 - dist / MAX_DIST) * 0.15;
            ctx.beginPath();
            ctx.moveTo(particles[a].x, particles[a].y);
            ctx.lineTo(particles[b].x, particles[b].y);
            ctx.strokeStyle = 'rgba(0, 212, 255, ' + alpha + ')';
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(animateParticles);
    }
    animateParticles();
  }

  // =============================================
  // 2. Counter Animation
  // =============================================
  function animateCounter(el) {
    var target = parseInt(el.getAttribute('data-target'), 10);
    var duration = 1500;
    var startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      // Ease out
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target);
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = target + '+';
      }
    }
    requestAnimationFrame(step);
  }

  // =============================================
  // 3. Scroll Reveal
  // =============================================
  var revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        // Trigger counters when hero is visible
        if (entry.target.id === 'hero') {
          var counters = entry.target.querySelectorAll('[data-target]');
          counters.forEach(function (c) {
            if (!c.dataset.animated) {
              c.dataset.animated = 'true';
              animateCounter(c);
            }
          });
        }
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal').forEach(function (el) {
    revealObserver.observe(el);
  });

  // Also trigger hero counters immediately
  var heroCounters = document.querySelectorAll('.hero [data-target]');
  heroCounters.forEach(function (c) {
    if (!c.dataset.animated) {
      c.dataset.animated = 'true';
      setTimeout(function () { animateCounter(c); }, 300);
    }
  });

  // =============================================
  // 4. Navigation Active State
  // =============================================
  var navLinks = document.querySelectorAll('.nav-links a');
  var sections = document.querySelectorAll('section[id]');

  var navObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        navLinks.forEach(function (link) {
          link.classList.toggle('active', link.getAttribute('href') === '#' + entry.target.id);
        });
      }
    });
  }, { threshold: 0.3, rootMargin: '-100px 0px -200px 0px' });

  sections.forEach(function (s) { navObserver.observe(s); });

  // =============================================
  // 5. Cognitive Mode Switcher
  // =============================================
  var cogTabs = document.querySelectorAll('.cog-tab');
  var cogPanels = document.querySelectorAll('.cog-panel');

  cogTabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var mode = tab.getAttribute('data-mode');
      cogTabs.forEach(function (t) { t.classList.remove('active'); });
      cogPanels.forEach(function (p) { p.classList.remove('active'); });
      tab.classList.add('active');
      var panel = document.querySelector('.cog-panel[data-mode="' + mode + '"]');
      if (panel) panel.classList.add('active');
    });
  });

  // =============================================
  // 6. Agent Topology Visualizer
  // =============================================
  var topoSvg = document.getElementById('topo-svg');
  var topoInfo = document.getElementById('topo-info');
  var topoBtns = document.querySelectorAll('.topo-btn');

  var topoData = {
    hierarchical: {
      info: '<strong>Hierarchical（分层拓扑）</strong>：中央调度器（Supervisor）决定下一步交给哪个 Agent，支持 supervisor &harr; subGraph 循环结构，结果回流辅助决策。适合复杂任务的分解与委派。',
      nodes: [
        { x: 300, y: 50, label: 'Supervisor', color: accent, r: 24 },
        { x: 120, y: 160, label: 'Agent A', color: accent2, r: 18 },
        { x: 300, y: 160, label: 'Agent B', color: accent2, r: 18 },
        { x: 480, y: 160, label: 'Agent C', color: accent2, r: 18 },
        { x: 120, y: 270, label: 'Sub-A1', color: accent3, r: 14 },
        { x: 300, y: 270, label: 'Sub-B1', color: accent3, r: 14 },
        { x: 480, y: 270, label: 'Sub-C1', color: accent3, r: 14 }
      ],
      edges: [
        [0, 1], [0, 2], [0, 3],
        [1, 4], [2, 5], [3, 6]
      ]
    },
    mesh: {
      info: '<strong>Mesh（网状拓扑）</strong>：所有 Agent 互相连接，每个 Agent 都可以与其他任意 Agent 直接通信。高容错性，适合需要频繁协作的场景。共识协议：Gossip。',
      nodes: [
        { x: 300, y: 60, label: 'A', color: accent, r: 20 },
        { x: 480, y: 120, label: 'B', color: accent, r: 20 },
        { x: 480, y: 240, label: 'C', color: accent, r: 20 },
        { x: 300, y: 280, label: 'D', color: accent, r: 20 },
        { x: 120, y: 240, label: 'E', color: accent, r: 20 },
        { x: 120, y: 120, label: 'F', color: accent, r: 20 }
      ],
      edges: [
        [0, 1], [0, 2], [0, 3], [0, 4], [0, 5],
        [1, 2], [1, 3], [1, 4], [1, 5],
        [2, 3], [2, 4], [2, 5],
        [3, 4], [3, 5], [4, 5]
      ]
    },
    ring: {
      info: '<strong>Ring（环形拓扑）</strong>：Agent 按顺序排列成环，每个 Agent 只与相邻的两个 Agent 通信。令牌传递式协调，低通信开销，适合顺序处理任务。共识协议：Raft。',
      nodes: [
        { x: 300, y: 50, label: 'A', color: accent, r: 18 },
        { x: 480, y: 110, label: 'B', color: accent, r: 18 },
        { x: 520, y: 210, label: 'C', color: accent, r: 18 },
        { x: 480, y: 290, label: 'D', color: accent, r: 18 },
        { x: 120, y: 290, label: 'E', color: accent, r: 18 },
        { x: 80, y: 210, label: 'F', color: accent, r: 18 },
        { x: 120, y: 110, label: 'G', color: accent, r: 18 }
      ],
      edges: [
        [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 0]
      ]
    },
    star: {
      info: '<strong>Star（星型拓扑）</strong>：中心节点作为协调者，所有 Agent 通过中心节点间接通信。简单高效，单点故障风险，适合轻量级协调场景。',
      nodes: [
        { x: 300, y: 160, label: 'Hub', color: accent2, r: 24 },
        { x: 300, y: 50, label: 'A', color: accent, r: 16 },
        { x: 500, y: 100, label: 'B', color: accent, r: 16 },
        { x: 530, y: 220, label: 'C', color: accent, r: 16 },
        { x: 420, y: 290, label: 'D', color: accent, r: 16 },
        { x: 180, y: 290, label: 'E', color: accent, r: 16 },
        { x: 70, y: 220, label: 'F', color: accent, r: 16 },
        { x: 100, y: 100, label: 'G', color: accent, r: 16 }
      ],
      edges: [
        [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7]
      ]
    },
    adaptive: {
      info: '<strong>Adaptive（自适应拓扑）</strong>：根据任务复杂度、Agent 负载和网络状况动态切换拓扑。系统实时感知并选择最优通信结构。创新点：无需人工干预的自适应协调。',
      nodes: [
        { x: 300, y: 50, label: 'Coord', color: accent2, r: 22 },
        { x: 150, y: 140, label: 'A', color: accent, r: 18 },
        { x: 450, y: 140, label: 'B', color: accent, r: 18 },
        { x: 300, y: 200, label: 'C', color: accent3, r: 18 },
        { x: 100, y: 260, label: 'D', color: accent, r: 16 },
        { x: 300, y: 290, label: 'E', color: accent, r: 16 },
        { x: 500, y: 260, label: 'F', color: accent, r: 16 }
      ],
      edges: [
        [0, 1], [0, 2], [0, 3],
        [1, 3], [2, 3],
        [1, 4], [3, 5], [2, 6],
        [4, 5], [5, 6]
      ]
    }
  };

  function renderTopology(name) {
    if (!topoSvg) return;
    var data = topoData[name];
    if (!data) return;

    var svg = '';
    svg += '<defs>';
    svg += '<filter id="glow-' + name + '"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>';
    svg += '</defs>';

    // Draw edges
    data.edges.forEach(function (e) {
      var n1 = data.nodes[e[0]];
      var n2 = data.nodes[e[1]];
      svg += '<line x1="' + n1.x + '" y1="' + n1.y + '" x2="' + n2.x + '" y2="' + n2.y + '" stroke="rgba(0,212,255,0.2)" stroke-width="1" />';
    });

    // Draw nodes
    data.nodes.forEach(function (n, i) {
      svg += '<g style="cursor:pointer">';
      svg += '<circle cx="' + n.x + '" cy="' + n.y + '" r="' + n.r + '" fill="' + n.color + '" fill-opacity="0.15" stroke="' + n.color + '" stroke-width="1.5" filter="url(#glow-' + name + ')">';
      svg += '<animate attributeName="r" values="' + n.r + ';' + (n.r + 2) + ';' + n.r + '" dur="' + (2 + i * 0.3) + 's" repeatCount="indefinite" />';
      svg += '</circle>';
      svg += '<text x="' + n.x + '" y="' + (n.y + 3) + '" text-anchor="middle" fill="' + ink + '" font-size="10" font-family="monospace">' + n.label + '</text>';
      svg += '</g>';
    });

    topoSvg.innerHTML = svg;

    if (topoInfo) {
      topoInfo.innerHTML = data.info;
    }
  }

  topoBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      topoBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      renderTopology(btn.getAttribute('data-topo'));
    });
  });

  // Initial render
  renderTopology('hierarchical');

  // =============================================
  // 7. ECharts - Module Distribution (Pie)
  // =============================================
  if (typeof echarts !== 'undefined') {
    var chartModules = echarts.init(document.getElementById('chart-modules'), null, { renderer: 'svg' });
    chartModules.setOption({
      tooltip: { trigger: 'item', appendToBody: true, backgroundColor: 'rgba(14,19,32,0.9)', borderColor: 'rgba(0,212,255,0.2)', textStyle: { color: ink } },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '50%'],
        itemStyle: { borderColor: bg2, borderWidth: 2 },
        label: { color: muted, fontSize: 10 },
        labelLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
        data: [
          { value: 18, name: '认知与推理', itemStyle: { color: accent } },
          { value: 15, name: 'Agent 协同', itemStyle: { color: accent2 } },
          { value: 12, name: '知识与检索', itemStyle: { color: accent3 } },
          { value: 10, name: '工具与执行', itemStyle: { color: '#ffb800' } },
          { value: 8, name: '安全与治理', itemStyle: { color: '#ff4466' } },
          { value: 8, name: '通道与通信', itemStyle: { color: '#00d4ff' } },
          { value: 6, name: '企业与运维', itemStyle: { color: '#b537f2' } },
          { value: 3, name: '其他', itemStyle: { color: '#4a526b' } }
        ]
      }]
    });
    window.addEventListener('resize', function () { chartModules.resize(); });

    // =============================================
    // 8. ECharts - Cognitive Mode Distribution (Bar)
    // =============================================
    var chartCognitive = echarts.init(document.getElementById('chart-cognitive'), null, { renderer: 'svg' });
    chartCognitive.setOption({
      tooltip: { trigger: 'axis', appendToBody: true, backgroundColor: 'rgba(14,19,32,0.9)', borderColor: 'rgba(0,212,255,0.2)', textStyle: { color: ink } },
      grid: { left: '8%', right: '8%', bottom: '10%', top: '10%' },
      xAxis: {
        type: 'category',
        data: ['纯推理', '工具执行', '混合推理'],
        axisLabel: { color: muted, fontSize: 11 },
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: muted, fontSize: 10 },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } }
      },
      series: [{
        type: 'bar',
        barWidth: '40%',
        data: [
          { value: 25, itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: accent }, { offset: 1, color: accent + '33' }] } } },
          { value: 45, itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: accent3 }, { offset: 1, color: accent3 + '33' }] } } },
          { value: 30, itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: accent2 }, { offset: 1, color: accent2 + '33' }] } } }
        ],
        label: { show: true, position: 'top', color: ink, fontSize: 11, formatter: '{c}%' }
      }]
    });
    window.addEventListener('resize', function () { chartCognitive.resize(); });

    // =============================================
    // 9. ECharts - Topology Comparison (Radar)
    // =============================================
    var chartTopology = echarts.init(document.getElementById('chart-topology'), null, { renderer: 'svg' });
    chartTopology.setOption({
      tooltip: { appendToBody: true, backgroundColor: 'rgba(14,19,32,0.9)', borderColor: 'rgba(0,212,255,0.2)', textStyle: { color: ink } },
      radar: {
        indicator: [
          { name: '容错性', max: 10 },
          { name: '效率', max: 10 },
          { name: '扩展性', max: 10 },
          { name: '通信开销', max: 10 },
          { name: '复杂度', max: 10 }
        ],
        shape: 'polygon',
        splitNumber: 5,
        name: { textStyle: { color: muted, fontSize: 10 } },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
        splitArea: { areaStyle: { color: ['transparent'] } },
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }
      },
      series: [{
        type: 'radar',
        data: [
          { value: [6, 7, 8, 5, 7], name: 'Hierarchical', itemStyle: { color: accent }, areaStyle: { color: accent + '22' } },
          { value: [9, 5, 7, 2, 8], name: 'Mesh', itemStyle: { color: accent2 }, areaStyle: { color: accent2 + '22' } },
          { value: [7, 8, 6, 4, 5], name: 'Ring', itemStyle: { color: accent3 }, areaStyle: { color: accent3 + '22' } },
          { value: [4, 9, 5, 8, 4], name: 'Star', itemStyle: { color: '#ffb800' }, areaStyle: { color: '#ffb80022' } },
          { value: [8, 8, 9, 6, 9], name: 'Adaptive', itemStyle: { color: '#ff4466' }, areaStyle: { color: '#ff446622' } }
        ]
      }],
      legend: {
        bottom: 0,
        textStyle: { color: muted, fontSize: 9 },
        itemWidth: 10, itemHeight: 10
      }
    });
    window.addEventListener('resize', function () { chartTopology.resize(); });

    // =============================================
    // 10. ECharts - RAG Performance (Bar)
    // =============================================
    var chartRag = echarts.init(document.getElementById('chart-rag'), null, { renderer: 'svg' });
    chartRag.setOption({
      tooltip: { trigger: 'axis', appendToBody: true, backgroundColor: 'rgba(14,19,32,0.9)', borderColor: 'rgba(0,212,255,0.2)', textStyle: { color: ink }, legend: { show: true } },
      legend: { bottom: 0, textStyle: { color: muted, fontSize: 10 } },
      grid: { left: '10%', right: '8%', bottom: '15%', top: '10%' },
      xAxis: {
        type: 'category',
        data: ['FP32', 'FP16', 'INT8'],
        axisLabel: { color: muted, fontSize: 11 },
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }
      },
      yAxis: [
        {
          type: 'value',
          name: '相似度',
          min: 0.9, max: 1.0,
          axisLabel: { color: muted, fontSize: 10 },
          splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
          nameTextStyle: { color: muted, fontSize: 10 }
        },
        {
          type: 'value',
          name: '内存占比',
          min: 0, max: 100,
          axisLabel: { color: muted, fontSize: 10, formatter: '{value}%' },
          splitLine: { show: false },
          nameTextStyle: { color: muted, fontSize: 10 }
        }
      ],
      series: [
        {
          name: '检索相似度',
          type: 'bar',
          barWidth: '25%',
          data: [1.000, 0.999, 0.950],
          itemStyle: { color: accent, borderRadius: [4, 4, 0, 0] }
        },
        {
          name: '内存占用',
          type: 'bar',
          barWidth: '25%',
          yAxisIndex: 1,
          data: [100, 50, 25],
          itemStyle: { color: accent2, borderRadius: [4, 4, 0, 0] }
        }
      ]
    });
    window.addEventListener('resize', function () { chartRag.resize(); });
  }

  // =============================================
  // 11. Smooth Scroll for Nav Links
  // =============================================
  navLinks.forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      var target = document.querySelector(link.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Close mobile nav
        document.querySelector('.nav-side').classList.remove('open');
      }
    });
  });

})();
