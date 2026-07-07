(function () {
  var steps = [
    { type: 'prompt', text: 'Use Skill: fullstack-dev-workflow 开发一个AI自动化测试平台' },
    { type: 'output', text: '✓ Skill 已加载，进入 AUTO_ADVANCE 模式' },
    { type: 'phase', text: '━━━ Phase 1: 需求分析 ━━━' },
    { type: 'output', text: '  生成 docs/prompts/phase_1_需求_prompt.md' },
    { type: 'output', text: '  产出 需求规格说明书.md（8模块 / 74功能单元）' },
    { type: 'ok', text: '  ✓ Phase 1 完成' },
    { type: 'phase', text: '━━━ Phase 2: 架构设计 ━━━' },
    { type: 'output', text: '  确定分层架构: Router → Service → Repository → Model' },
    { type: 'output', text: '  部署方案: Docker Compose (backend + frontend + mysql)' },
    { type: 'ok', text: '  ✓ Phase 2 完成' },
    { type: 'phase', text: '━━━ Phase 3: 详细需求 ━━━' },
    { type: 'output', text: '  拆分 8 个子模块，生成模块级需求文档 + 追溯报告' },
    { type: 'ok', text: '  ✓ Phase 3 完成' },
    { type: 'phase', text: '━━━ Phase 4: 数据库设计 ━━━' },
    { type: 'output', text: '  设计 13 张数据表，定义索引策略与外键关系' },
    { type: 'ok', text: '  ✓ Phase 4 完成' },
    { type: 'phase', text: '━━━ Phase 5: API 设计 ━━━' },
    { type: 'output', text: '  设计 50+ RESTful API 端点，定义 JWT + RBAC 权限模型' },
    { type: 'ok', text: '  ✓ Phase 5 完成' },
    { type: 'phase', text: '━━━ Phase 6: 开发计划 ━━━' },
    { type: 'output', text: '  生成开发进度矩阵: 74 功能单元 × 7 Sprint' },
    { type: 'output', text: '  策略: 后端优先启动，API 定义完成后前端并行' },
    { type: 'ok', text: '  ✓ Phase 6 完成' },
    { type: 'phase', text: '━━━ Phase 7: 编码开发 ━━━' },
    { type: 'output', text: '  后端: 9 路由 + 8 Service + 13 Model → 60+ 代码文件' },
    { type: 'output', text: '  前端: 7 Views + 15 Components + 4 Stores' },
    { type: 'output', text: '  每模块生成详细设计文档 + 开发索引 + 追溯报告' },
    { type: 'ok', text: '  ✓ Phase 7 完成（30+ 文档，60+ 代码文件）' },
    { type: 'phase', text: '━━━ Phase 8: 代码审查（闭环）━━━' },
    { type: 'output', text: '  第 1 轮全量审查: 发现 11 Critical + 17 Major' },
    { type: 'output', text: '  执行修复 → 第 2 轮增量审查: Critical 清零' },
    { type: 'output', text: '  第 3 轮终验: Critical=0, Major=0 → 审查通过' },
    { type: 'ok', text: '  ✓ Phase 8 完成（3轮闭环，问题全部清零）' },
    { type: 'phase', text: '━━━ Phase 9: 测试交付 ━━━' },
    { type: 'output', text: '  测试计划: 76 用例覆盖 8 模块' },
    { type: 'output', text: '  后端测试 9 文件 + 前端测试 7 文件' },
    { type: 'output', text: '  测试报告: 111 用例, 102 通过, 91.9% 通过率' },
    { type: 'ok', text: '  ✓ Phase 9 完成' },
    { type: 'final', text: '═══════════════════════════════════════' },
    { type: 'final', text: '  ✅ Skill 执行完毕' },
    { type: 'final', text: '  产出: 30+ 文档 | 60+ 代码文件 | 74 功能单元已测试' },
    { type: 'final', text: '═══════════════════════════════════════' }
  ];

  var timer = null;

  window.runDemo = function () {
    var body = document.getElementById('demoBody');
    body.innerHTML = '';
    var btn = document.getElementById('demoBtn');
    btn.disabled = true;
    btn.textContent = '演示中...';

    var i = 0;
    function showNext() {
      if (i >= steps.length) {
        btn.disabled = false;
        btn.textContent = '▶ 重新演示';
        return;
      }
      var s = steps[i];
      var div = document.createElement('div');
      div.className = 'demo-line';
      div.style.animationDelay = '0s';

      if (s.type === 'prompt') {
        div.innerHTML = '<span class="prompt">TRAE &gt; </span><span class="cmd">' + s.text + '</span>';
      } else if (s.type === 'phase') {
        div.innerHTML = '<span class="phase">' + s.text + '</span>';
      } else if (s.type === 'ok') {
        div.innerHTML = '<span class="ok">' + s.text + '</span>';
      } else if (s.type === 'final') {
        div.innerHTML = '<span class="ok" style="font-weight:700">' + s.text + '</span>';
      } else {
        div.innerHTML = '<span class="output">' + s.text + '</span>';
      }

      body.appendChild(div);
      body.scrollTop = body.scrollHeight;
      i++;
      var delay = s.type === 'phase' ? 600 : s.type === 'final' ? 400 : 250;
      timer = setTimeout(showNext, delay);
    }
    showNext();
  };

  window.resetDemo = function () {
    if (timer) { clearTimeout(timer); timer = null; }
    var body = document.getElementById('demoBody');
    body.innerHTML = '<div class="demo-line" style="opacity:1"><span class="prompt">TRAE &gt; </span><span class="cmd">等待用户输入需求...</span></div>';
    var btn = document.getElementById('demoBtn');
    btn.disabled = false;
    btn.textContent = '▶ 开始演示';
  };
})();
