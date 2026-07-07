(function () {
  var templates = {
    testpilot: {
      name: 'TestPilot - AI 自动化测试平台',
      requirement: '我想做一个 AI 驱动的 Web 自动化测试平台。测试工程师可以创建测试场景、录制浏览器操作、编写测试用例（支持自然语言描述 + AI 解析为原子操作），然后执行测试任务并查看报告。技术栈用 Vue 3 + Python FastAPI + MySQL。',
      tech: 'vue+python+mysql'
    },
    blog: {
      name: '技术博客系统',
      requirement: '开发一个技术博客系统，支持 Markdown 编辑与渲染、文章分类与标签管理、评论系统、用户认证（JWT）、文章搜索与分页。技术栈用 React + Node.js + PostgreSQL。',
      tech: 'react+node+postgres'
    },
    todo: {
      name: '任务管理应用',
      requirement: '开发一个团队协作任务管理应用，支持项目/看板/列表视图切换、任务分配与优先级管理、实时通知、成员权限控制。技术栈用 Vue 3 + Java Spring Boot + MySQL。',
      tech: 'angular+java+mysql'
    }
  };

  var phaseData = {
    'vue+python+mysql': [
      { phase: 'P1', title: '需求分析', status: 'done', items: [
        '生成 <code>docs/prompts/phase_1_需求_prompt.md</code>',
        '产出 <code>需求规格说明书.md</code>（8 个功能模块、74 个功能单元）',
        '产出 <code>需求可追溯性报告.md</code>',
        '收集技术栈：Vue 3 + FastAPI + MySQL + Playwright'
      ]},
      { phase: 'P2', title: '架构设计', status: 'done', items: [
        '确定分层架构：Router → Service → Repository → Model',
        '前端：Views / Components / Stores / Utils 四层结构',
        '部署方案：Docker Compose（backend + frontend + mysql）',
        '产出 <code>架构设计文档.md</code> + <code>架构可追溯性报告.md</code>'
      ]},
      { phase: 'P3', title: '详细需求', status: 'done', items: [
        '拆分 8 个子模块：认证、场景管理、用例管理、执行引擎、AI 服务、任务调度、报告系统、调试工具',
        '每个模块生成独立需求文档 + 可追溯性报告',
        '产出 <code>需求总览.md</code> + 8 个模块需求文件'
      ]},
      { phase: 'P4', title: '数据库设计', status: 'done', items: [
        '设计 13 张数据表：users, scenarios, test_cases, test_steps, executions, ...',
        '定义索引策略与外键关系',
        '产出 <code>数据库设计文档.md</code> + <code>数据库可追溯性报告.md</code>'
      ]},
      { phase: 'P5', title: 'API 设计', status: 'done', items: [
        '设计 50+ RESTful API 端点',
        '定义请求/响应 Schema、错误码体系',
        'JWT 认证 + RBAC 权限模型',
        '产出 <code>API设计文档.md</code> + <code>API可追溯性报告.md</code>'
      ]},
      { phase: 'P6', title: '开发计划', status: 'done', items: [
        '拆分为 7 个 Sprint，74 个最小功能单元',
        '生成开发进度矩阵（6 状态流转：待开发→开发中→已完成→已审查→已测试→已发布）',
        '确定后端优先、前端并行的开发策略'
      ]},
      { phase: 'P7', title: '编码开发', status: 'done', items: [
        '后端：9 个路由模块 + 8 个 Service + 13 个 Model',
        '前端：7 个 Views + 15 个 Components + 4 个 Stores',
        '每个模块生成详细设计文档 + 开发索引 + 追溯报告',
        '共生成 30+ 文档、60+ 代码文件'
      ]},
      { phase: 'P8', title: '代码审查（闭环）', status: 'done', items: [
        '第 1 轮全量审查：发现 11 个 Critical + 17 个 Major',
        '立即修复 → 第 2 轮增量审查：Critical 清零，剩余 3 Major',
        '第 3 轮终验审查：Critical=0, Major=0 → 通过',
        '产出 <code>代码审查报告.md</code> + <code>修复任务清单.md</code>'
      ]},
      { phase: 'P9', title: '测试交付', status: 'done', items: [
        '生成测试计划：76 个测试用例覆盖 8 个模块',
        '后端测试 9 文件 ~70 用例 + 前端测试 7 文件 ~41 用例',
        '测试报告：111 用例，102 通过，5 失败，4 跳过（91.9%）',
        '全部 74 个功能单元状态更新为"已测试"，建议发布'
      ]}
    ],
    'react+node+postgres': [
      { phase: 'P1', title: '需求分析', status: 'done', items: ['识别 6 个功能模块：用户认证、文章管理、分类标签、评论系统、搜索、管理后台', '产出需求规格说明书 + 追溯报告'] },
      { phase: 'P2', title: '架构设计', status: 'done', items: ['React 18 + Next.js App Router', 'Node.js + Express + Prisma ORM', 'PostgreSQL + Redis 缓存层'] },
      { phase: 'P3', title: '详细需求', status: 'done', items: ['6 个子模块详细需求文档', 'Markdown 渲染引擎需求定义', 'JWT + OAuth2.0 认证方案'] },
      { phase: 'P4', title: '数据库设计', status: 'done', items: ['设计 8 张表：users, posts, categories, tags, comments, ...', '全文搜索索引（tsvector）'] },
      { phase: 'P5', title: 'API 设计', status: 'done', items: ['35+ RESTful + GraphQL 混合端点', 'Markdown 上传与图片存储 API'] },
      { phase: 'P6', title: '开发计划', status: 'done', items: ['5 个 Sprint，48 个功能单元', '前后端并行开发策略'] },
      { phase: 'P7', title: '编码开发', status: 'done', items: ['后端：6 路由 + 6 Service + 8 Model', '前端：6 Pages + 12 Components + 3 Stores'] },
      { phase: 'P8', title: '代码审查', status: 'done', items: ['2 轮闭环：第 1 轮 5 Critical → 修复 → 第 2 轮清零通过'] },
      { phase: 'P9', title: '测试交付', status: 'done', items: ['68 测试用例，94% 通过率', '产出完整测试报告'] }
    ],
    'angular+java+mysql': [
      { phase: 'P1', title: '需求分析', status: 'done', items: ['识别 7 个功能模块：项目管理、看板视图、任务CRUD、成员管理、通知系统、权限控制、数据统计', '产出需求规格说明书'] },
      { phase: 'P2', title: '架构设计', status: 'done', items: ['Angular 17 Standalone Components', 'Java 21 + Spring Boot 3 + MyBatis-Plus', 'WebSocket 实时通知'] },
      { phase: 'P3', title: '详细需求', status: 'done', items: ['7 个子模块详细需求', 'RBAC 权限模型定义'] },
      { phase: 'P4', title: '数据库设计', status: 'done', items: ['10 张表：projects, boards, tasks, members, notifications, ...', '乐观锁并发控制'] },
      { phase: 'P5', title: 'API 设计', status: 'done', items: ['42+ RESTful 端点', 'WebSocket 事件协议定义'] },
      { phase: 'P6', title: '开发计划', status: 'done', items: ['6 个 Sprint，56 个功能单元'] },
      { phase: 'P7', title: '编码开发', status: 'done', items: ['后端：7 Controller + 7 Service + 10 Entity', '前端：7 Components + 5 Services + 3 Guards'] },
      { phase: 'P8', title: '代码审查', status: 'done', items: ['3 轮闭环：Critical 问题在第 2 轮清零'] },
      { phase: 'P9', title: '测试交付', status: 'done', items: ['89 测试用例，93.2% 通过率'] }
    ]
  };

  window.loadTemplate = function () {
    var sel = document.getElementById('simTemplate').value;
    if (sel === 'custom') return;
    var t = templates[sel];
    if (!t) return;
    document.getElementById('simRequirement').value = t.requirement;
    document.getElementById('simTechStack').value = t.tech;
  };

  window.resetSimulator = function () {
    document.getElementById('simOutput').innerHTML =
      '<div style="text-align:center;color:var(--muted);padding:3rem 0;">' +
      '<p style="font-size:2rem;margin-bottom:0.5rem;">\u{1F446}</p>' +
      '<p>配置左侧参数，点击"运行 Skill"开始模拟</p></div>';
    document.getElementById('simRunBtn').disabled = false;
    document.getElementById('simRunBtn').textContent = '\u25B6 运行 Skill';
  };

  window.runSimulator = function () {
    var tech = document.getElementById('simTechStack').value;
    var phases = phaseData[tech] || phaseData['vue+python+mysql'];
    var output = document.getElementById('simOutput');
    output.innerHTML = '';
    var btn = document.getElementById('simRunBtn');
    btn.disabled = true;
    btn.textContent = '运行中...';

    var i = 0;
    function showNext() {
      if (i >= phases.length) {
        btn.disabled = false;
        btn.textContent = '\u25B6 运行完成';
        var summary = document.createElement('div');
        summary.className = 'phase-result';
        summary.style.animationDelay = '0s';
        summary.innerHTML =
          '<div style="background:var(--bg3);border:1px solid var(--success);border-radius:8px;padding:1rem;text-align:center;">' +
          '<p style="color:var(--success);font-size:1.1rem;font-weight:700;margin-bottom:0.3rem;">\u2705 Skill 执行完毕</p>' +
          '<p style="color:var(--muted);font-size:0.85rem;">9 个阶段全部完成，项目已就绪。共生成 30+ 文档、60+ 代码文件。</p></div>';
        output.appendChild(summary);
        output.scrollTop = output.scrollHeight;
        return;
      }
      var p = phases[i];
      var div = document.createElement('div');
      div.className = 'phase-result';
      div.style.animationDelay = '0s';
      var listHtml = p.items.map(function (item) { return '<li>' + item + '</li>'; }).join('');
      div.innerHTML =
        '<div class="phase-result-header">' +
        '<span class="badge">' + p.phase + '</span>' +
        '<h4>' + p.title + '</h4>' +
        '<span class="status">\u2713 完成</span>' +
        '</div>' +
        '<div class="phase-result-body"><ul>' + listHtml + '</ul></div>';
      output.appendChild(div);
      output.scrollTop = output.scrollHeight;
      i++;
      setTimeout(showNext, 400);
    }
    showNext();
  };
})();
