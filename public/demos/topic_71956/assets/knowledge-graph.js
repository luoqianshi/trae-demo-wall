// Lightweight Knowledge Graph - Pure SVG Implementation (No D3.js dependency)
(function() {
  var container = document.getElementById('graphContainer');
  var svg = document.getElementById('knowledgeGraph');
  var tooltip = document.getElementById('graphTooltip');
  var width, height;
  var animFrame;

  var typeConfig = {
    'core':    { color: '#FF6B6B', size: 28, glow: 'rgba(255,107,107,0.3)' },
    'tool':    { color: '#4ECDC4', size: 20, glow: 'rgba(78,205,196,0.3)' },
    'concept': { color: '#45B7D1', size: 20, glow: 'rgba(69,183,209,0.3)' },
    'topic':   { color: '#96CEB4', size: 22, glow: 'rgba(150,206,180,0.3)' },
    'person':  { color: '#FECA57', size: 17, glow: 'rgba(254,202,87,0.3)' },
    'method':  { color: '#FF9FF3', size: 18, glow: 'rgba(255,159,243,0.3)' },
    'project': { color: '#54A0FF', size: 24, glow: 'rgba(84,160,255,0.3)' }
  };

  var nodes = [
    { id: 'Smart Second Brain', type: 'core',    tags: ['AI','知识管理','自动化'], category: '系统核心' },
    { id: 'Obsidian',            type: 'tool',    tags: ['知识库','Markdown','双链'], category: '知识库引擎' },
    { id: 'TRAE Work',          type: 'tool',    tags: ['AI','Agent','自动化'], category: 'AI 智能体平台' },
    { id: 'AI Agent',            type: 'concept', tags: ['LLM','自动化','工作流'], category: '智能代理' },
    { id: '知识管理',             type: 'concept', tags: ['PKM','笔记','组织'], category: '核心概念' },
    { id: '费曼学习法',           type: 'method',  tags: ['学习','输出','教学'], category: '学习方法' },
    { id: '投资理财',             type: 'topic',   tags: ['基金','股票','理财'], category: '主题领域' },
    { id: '基金投资入门',         type: 'topic',   tags: ['定投','指数基金','新手'], category: '子主题' },
    { id: 'Karpathy',            type: 'person',  tags: ['AI','深度学习','Tesla'], category: '领域专家' },
    { id: '知识复利',             type: 'concept', tags: ['复利','积累','输出'], category: '核心理念' },
    { id: '抖音笔记',             type: 'topic',   tags: ['短视频','采集','Raw'], category: '数据源' },
    { id: '公众号文章',           type: 'topic',   tags: ['微信','文章','采集'], category: '数据源' },
    { id: 'D3.js',               type: 'tool',    tags: ['可视化','图谱','SVG'], category: '可视化工具' },
    { id: '语音克隆',             type: 'concept', tags: ['TTS','配音','视频'], category: '输出能力' },
    { id: 'Python',              type: 'tool',    tags: ['脚本','自动化','API'], category: '开发工具' },
    { id: '知识图谱',             type: 'concept', tags: ['关联','可视化','网络'], category: '核心功能' },
    { id: '质量验证',             type: 'method',  tags: ['验证','评分','标准'], category: '质量保障' },
    { id: '内容创作项目',         type: 'project', tags: ['博客','视频','输出'], category: '实际项目' }
  ];

  var links = [
    { source: 0, target: 1, label: '知识库引擎' },
    { source: 0, target: 2, label: 'AI 核心' },
    { source: 0, target: 4, label: '核心理念' },
    { source: 0, target: 15, label: '可视化' },
    { source: 0, target: 17, label: '实践项目' },
    { source: 2, target: 3, label: '使用' },
    { source: 3, target: 4, label: '驱动' },
    { source: 4, target: 5, label: '方法论' },
    { source: 4, target: 9, label: '目标' },
    { source: 4, target: 16, label: '保障' },
    { source: 5, target: 9, label: '实践' },
    { source: 5, target: 8, label: '推崇者' },
    { source: 6, target: 7, label: '子领域' },
    { source: 10, target: 0, label: '数据输入' },
    { source: 11, target: 0, label: '数据输入' },
    { source: 1, target: 12, label: '集成' },
    { source: 14, target: 0, label: '脚本引擎' },
    { source: 2, target: 13, label: '能力' },
    { source: 15, target: 12, label: '可视化' },
    { source: 17, target: 5, label: '应用' },
    { source: 3, target: 16, label: '执行' }
  ];

  // Initialize positions in a circle
  function initPositions() {
    var cx = width / 2, cy = height / 2;
    var radius = Math.min(width, height) * 0.3;
    nodes.forEach(function(n, i) {
      var angle = (2 * Math.PI * i) / nodes.length;
      n.x = cx + radius * Math.cos(angle) + (Math.random() - 0.5) * 50;
      n.y = cy + radius * Math.sin(angle) + (Math.random() - 0.5) * 50;
      n.vx = 0;
      n.vy = 0;
      n.fx = null;
      n.fy = null;
    });
  }

  var linkDist = 100;
  var charge = 0.08;
  var damping = 0.85;
  var centerX, centerY;
  var dragging = null;

  function getSize() {
    var rect = container.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    centerX = width / 2;
    centerY = height / 2;
  }

  function simulate() {
    var active = false;

    // Center gravity
    nodes.forEach(function(n) {
      if (n.fx !== null) return;
      n.vx += (centerX - n.x) * 0.001;
      n.vy += (centerY - n.y) * 0.001;
    });

    // Charge (repulsion)
    for (var i = 0; i < nodes.length; i++) {
      for (var j = i + 1; j < nodes.length; j++) {
        var dx = nodes[j].x - nodes[i].x;
        var dy = nodes[j].y - nodes[i].y;
        var dist = Math.sqrt(dx * dx + dy * dy) || 1;
        var force = charge * 10000 / (dist * dist);
        var fx = (dx / dist) * force;
        var fy = (dy / dist) * force;
        if (nodes[i].fx === null) { nodes[i].vx -= fx; nodes[i].vy -= fy; }
        if (nodes[j].fx === null) { nodes[j].vx += fx; nodes[j].vy += fy; }
      }
    }

    // Link force
    links.forEach(function(l) {
      var s = nodes[l.source], t = nodes[l.target];
      var dx = t.x - s.x, dy = t.y - s.y;
      var dist = Math.sqrt(dx * dx + dy * dy) || 1;
      var force = (dist - linkDist) * 0.005;
      var fx = (dx / dist) * force;
      var fy = (dy / dist) * force;
      if (s.fx === null) { s.vx += fx; s.vy += fy; }
      if (t.fx === null) { t.vx -= fx; t.vy -= fy; }
    });

    // Apply velocity
    nodes.forEach(function(n) {
      if (n.fx !== null) { n.x = n.fx; n.y = n.fy; n.vx = 0; n.vy = 0; return; }
      n.vx *= damping;
      n.vy *= damping;
      n.x += n.vx;
      n.y += n.vy;
      n.x = Math.max(30, Math.min(width - 30, n.x));
      n.y = Math.max(30, Math.min(height - 30, n.y));
      if (Math.abs(n.vx) > 0.01 || Math.abs(n.vy) > 0.01) active = true;
    });

    if (active) {
      animFrame = requestAnimationFrame(function() { simulate(); render(); });
    }
  }

  function render() {
    var lines = '';
    links.forEach(function(l) {
      var s = nodes[l.source], t = nodes[l.target];
      var mx = (s.x + t.x) / 2, my = (s.y + t.y) / 2;
      lines += '<line x1="' + s.x + '" y1="' + s.y + '" x2="' + t.x + '" y2="' + t.y + '" stroke="rgba(136,136,170,0.2)" stroke-width="1.5"/>';
      lines += '<text x="' + mx + '" y="' + (my - 4) + '" text-anchor="middle" fill="rgba(136,136,170,0.4)" font-size="8" style="pointer-events:none">' + l.label + '</text>';
    });

    var circles = '';
    nodes.forEach(function(n, i) {
      var cfg = typeConfig[n.type] || { color: '#D1D8E0', size: 15, glow: 'rgba(200,200,200,0.2)' };
      circles += '<circle cx="' + n.x + '" cy="' + n.y + '" r="' + (cfg.size + 6) + '" fill="' + cfg.glow + '" style="pointer-events:none"/>';
      circles += '<circle cx="' + n.x + '" cy="' + n.y + '" r="' + cfg.size + '" fill="' + cfg.color + '" stroke="rgba(255,255,255,0.25)" stroke-width="1.5" data-idx="' + i + '" class="graph-node" style="cursor:grab"/>';
      circles += '<text x="' + n.x + '" y="' + (n.y - cfg.size - 6) + '" text-anchor="middle" fill="#e8e8f0" font-size="10" font-weight="600" style="pointer-events:none">' + n.id + '</text>';
    });

    svg.innerHTML = lines + circles;
  }

  // Drag interaction
  svg.addEventListener('mousedown', function(e) {
    var target = e.target.closest('.graph-node');
    if (!target) return;
    var idx = parseInt(target.getAttribute('data-idx'));
    dragging = nodes[idx];
    dragging.fx = dragging.x;
    dragging.fy = dragging.y;
    target.style.cursor = 'grabbing';
    e.preventDefault();
  });

  svg.addEventListener('mousemove', function(e) {
    // Tooltip
    var target = e.target.closest('.graph-node');
    if (target && !dragging) {
      var idx = parseInt(target.getAttribute('data-idx'));
      var n = nodes[idx];
      var cfg = typeConfig[n.type] || {};
      tooltip.innerHTML = '<strong>' + n.id + '</strong><br><span style="color:#00cec9">' + n.category + '</span><br>' + n.tags.map(function(t) { return '#' + t; }).join(' ');
      tooltip.style.display = 'block';
      tooltip.style.left = (e.offsetX + 15) + 'px';
      tooltip.style.top = (e.offsetY - 10) + 'px';
    } else if (!target) {
      tooltip.style.display = 'none';
    }

    if (dragging) {
      var rect = svg.getBoundingClientRect();
      dragging.fx = e.clientX - rect.left;
      dragging.fy = e.clientY - rect.top;
      if (animFrame) cancelAnimationFrame(animFrame);
      simulate();
      render();
    }
  });

  svg.addEventListener('mouseup', function() {
    if (dragging) {
      dragging.fx = null;
      dragging.fy = null;
      dragging = null;
      simulate();
    }
    tooltip.style.display = 'none';
  });

  svg.addEventListener('mouseleave', function() {
    if (dragging) {
      dragging.fx = null;
      dragging.fy = null;
      dragging = null;
      simulate();
    }
    tooltip.style.display = 'none';
  });

  // Controls
  window.centerGraph = function() {
    nodes.forEach(function(n) {
      if (n.fx !== null) return;
      n.vx += (centerX - n.x) * 0.05;
      n.vy += (centerY - n.y) * 0.05;
    });
    simulate();
    render();
  };

  window.resetGraph = function() {
    linkDist = 100;
    charge = 0.08;
    document.getElementById('linkDist').value = 100;
    document.getElementById('linkDistVal').textContent = '100';
    document.getElementById('chargeStrength').value = 80;
    document.getElementById('chargeVal').textContent = '80';
    initPositions();
    simulate();
    render();
  };

  document.getElementById('linkDist').addEventListener('input', function() {
    linkDist = +this.value;
    document.getElementById('linkDistVal').textContent = linkDist;
    simulate();
    render();
  });

  document.getElementById('chargeStrength').addEventListener('input', function() {
    charge = +this.value / 1000;
    document.getElementById('chargeVal').textContent = this.value;
    simulate();
    render();
  });

  window.addEventListener('resize', function() {
    getSize();
    initPositions();
    simulate();
    render();
  });

  // Build legend
  function buildLegend() {
    var legend = document.getElementById('graphLegend');
    var items = [
      { label: '核心', color: '#FF6B6B' },
      { label: '工具', color: '#4ECDC4' },
      { label: '概念', color: '#45B7D1' },
      { label: '主题', color: '#96CEB4' },
      { label: '人物', color: '#FECA57' },
      { label: '方法', color: '#FF9FF3' },
      { label: '项目', color: '#54A0FF' }
    ];
    legend.innerHTML = items.map(function(i) {
      return '<div class="legend-item"><span class="legend-dot" style="background:' + i.color + '"></span>' + i.label + '</div>';
    }).join('');
  }

  // Init
  function init() {
    getSize();
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    // Update control defaults
    document.getElementById('linkDist').value = 100;
    document.getElementById('linkDistVal').textContent = '100';
    document.getElementById('chargeStrength').value = 80;
    document.getElementById('chargeVal').textContent = '80';
    initPositions();
    buildLegend();
    simulate();
    render();
  }

  init();
})();
