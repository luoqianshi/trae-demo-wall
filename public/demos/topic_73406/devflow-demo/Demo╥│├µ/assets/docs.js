(function () {
  var docs = [
    {
      title: '需求规格说明书.md',
      content:
        '<span class="hl-comment"># TestPilot 需求规格说明书</span>\n\n' +
        '<span class="hl-key">## 1. 项目概述</span>\n' +
        'TestPilot 是一个 AI 驱动的 Web 自动化测试平台，面向测试工程师，\n' +
        '提供从测试场景创建、用例编写、执行调度到报告分析的完整工作流。\n\n' +
        '<span class="hl-key">## 2. 功能模块</span>\n\n' +
        '<span class="hl-key">### 2.1 用户认证模块（AUTH）</span>\n' +
        '| 功能单元 | 优先级 | 描述 |\n' +
        '|----------|--------|------|\n' +
        '| AUTH-001 | P0 | 用户注册（邮箱 + 密码） |\n' +
        '| AUTH-002 | P0 | 用户登录（JWT Token） |\n' +
        '| AUTH-003 | P0 | Token 刷新与失效 |\n' +
        '| AUTH-004 | P1 | 密码修改与重置 |\n\n' +
        '<span class="hl-key">### 2.2 测试场景管理（SCN）</span>\n' +
        '| 功能单元 | 优先级 | 描述 |\n' +
        '|----------|--------|------|\n' +
        '| SCN-001 | P0 | 创建测试场景（名称 + 描述 + 基础URL） |\n' +
        '| SCN-002 | P0 | 场景列表（分页 + 搜索 + 筛选） |\n' +
        '| SCN-003 | P1 | 场景克隆与导入导出 |\n\n' +
        '<span class="hl-key">### 2.3 AI 服务模块（AI）</span>\n' +
        '| 功能单元 | 优先级 | 描述 |\n' +
        '|----------|--------|------|\n' +
        '| AI-001  | P0 | 自然语言 → 原子操作解析 |\n' +
        '| AI-002  | P0 | 多模态元素识别（截图 → 选择器） |\n' +
        '| AI-003  | P1 | 智能断言生成 |\n\n' +
        '<span class="hl-comment"># ... 共 8 个模块、74 个功能单元</span>'
    },
    {
      title: 'API设计文档.md',
      content:
        '<span class="hl-comment"># TestPilot API 设计文档</span>\n\n' +
        '<span class="hl-key">## 3. 认证接口</span>\n\n' +
        '<span class="hl-key">### POST /api/v1/auth/register</span>\n' +
        '请求体:\n' +
        '{\n' +
        '  <span class="hl-val">"email"</span>: "string, required",\n' +
        '  <span class="hl-val">"password"</span>: "string, required, min=8",\n' +
        '  <span class="hl-val">"username"</span>: "string, required, 3-30 chars"\n' +
        '}\n\n' +
        '响应 201:\n' +
        '{\n' +
        '  <span class="hl-val">"code"</span>: 0,\n' +
        '  <span class="hl-val">"data"</span>: { "user_id": 1, "email": "...", "token": "jwt..." }\n' +
        '}\n\n' +
        '<span class="hl-key">### POST /api/v1/auth/login</span>\n' +
        '请求体:\n' +
        '{\n' +
        '  <span class="hl-val">"email"</span>: "string",\n' +
        '  <span class="hl-val">"password"</span>: "string"\n' +
        '}\n\n' +
        '<span class="hl-key">## 5. 测试用例接口</span>\n\n' +
        '<span class="hl-key">### POST /api/v1/cases</span>\n' +
        '请求体:\n' +
        '{\n' +
        '  <span class="hl-val">"scenario_id"</span>: "int, required",\n' +
        '  <span class="hl-val">"name"</span>: "string, required",\n' +
        '  <span class="hl-val">"steps"</span>: [\n' +
        '    { "action": "click", "target": "#btn", "value": "" },\n' +
        '    { "action": "input", "target": "#name", "value": "test" }\n' +
        '  ]\n' +
        '}\n\n' +
        '<span class="hl-key">### POST /api/v1/ai/parse-steps</span>\n' +
        '<span class="hl-comment"># AI 自然语言解析为原子操作</span>\n' +
        '请求体: { <span class="hl-val">"text"</span>: "打开登录页，输入用户名admin，点击登录按钮" }\n' +
        '响应: { <span class="hl-val">"steps"</span>: [ ...3 个原子操作 ] }'
    },
    {
      title: '数据库设计文档.md',
      content:
        '<span class="hl-comment"># TestPilot 数据库设计文档</span>\n\n' +
        '<span class="hl-key">## 表结构</span>\n\n' +
        '<span class="hl-key">### users</span>\n' +
        '| 字段 | 类型 | 约束 | 说明 |\n' +
        '|------|------|------|------|\n' +
        '| id | BIGINT | PK, AUTO_INCREMENT | 主键 |\n' +
        '| email | VARCHAR(255) | UNIQUE, NOT NULL | 邮箱 |\n' +
        '| username | VARCHAR(30) | NOT NULL | 用户名 |\n' +
        '| password_hash | VARCHAR(255) | NOT NULL | bcrypt 哈希 |\n' +
        '| role | ENUM | DEFAULT "tester" | 角色 |\n' +
        '| created_at | DATETIME | DEFAULT NOW() | 创建时间 |\n\n' +
        '<span class="hl-key">### test_cases</span>\n' +
        '| 字段 | 类型 | 约束 | 说明 |\n' +
        '|------|------|------|------|\n' +
        '| id | BIGINT | PK | 主键 |\n' +
        '| scenario_id | BIGINT | FK → scenarios.id | 所属场景 |\n' +
        '| name | VARCHAR(200) | NOT NULL | 用例名称 |\n' +
        '| priority | ENUM(P0,P1,P2) | DEFAULT P1 | 优先级 |\n' +
        '| status | ENUM | DEFAULT "draft" | 状态 |\n\n' +
        '<span class="hl-key">### test_executions</span>\n' +
        '| 字段 | 类型 | 约束 | 说明 |\n' +
        '|------|------|------|------|\n' +
        '| id | BIGINT | PK | 主键 |\n' +
        '| case_id | BIGINT | FK → test_cases.id | 关联用例 |\n' +
        '| status | ENUM | running/passed/failed/error | 执行状态 |\n' +
        '| duration_ms | INT | | 执行耗时 |\n' +
        '| screenshot_path | VARCHAR(500) | | 失败截图路径 |\n\n' +
        '<span class="hl-comment"># 共 13 张表，含完整索引策略</span>'
    },
    {
      title: '开发进度矩阵.md',
      content:
        '<span class="hl-comment"># 开发进度矩阵</span>\n\n' +
        '<span class="hl-key">状态说明</span>: 待开发 → 开发中 → 已完成 → 已审查 → 已测试 → 已发布\n\n' +
        '| 编号 | 功能单元 | Sprint | 开发端 | 状态 |\n' +
        '|------|----------|--------|--------|------|\n' +
        '| AUTH-001 | 用户注册 | S1 | 后端 | <span class="hl-val">已测试</span> |\n' +
        '| AUTH-002 | 用户登录 | S1 | 后端 | <span class="hl-val">已测试</span> |\n' +
        '| AUTH-003 | Token刷新 | S1 | 后端 | <span class="hl-val">已测试</span> |\n' +
        '| AUTH-004 | 密码管理 | S1 | 后端 | <span class="hl-val">已测试</span> |\n' +
        '| AUTH-005 | 登录页面 | S1 | 前端 | <span class="hl-val">已测试</span> |\n' +
        '| SCN-001 | 创建场景 | S2 | 后端 | <span class="hl-val">已测试</span> |\n' +
        '| SCN-002 | 场景列表 | S2 | 后端 | <span class="hl-val">已测试</span> |\n' +
        '| SCN-003 | 场景克隆 | S2 | 后端 | <span class="hl-val">已测试</span> |\n' +
        '| SCN-004 | 场景前端 | S2 | 前端 | <span class="hl-val">已测试</span> |\n' +
        '| CASE-001 | 创建用例 | S3 | 后端 | <span class="hl-val">已测试</span> |\n' +
        '| CASE-002 | 用例列表 | S3 | 后端 | <span class="hl-val">已测试</span> |\n' +
        '| CASE-003 | 步骤编辑器 | S3 | 前端 | <span class="hl-val">已测试</span> |\n' +
        '| AI-001 | NL解析 | S4 | 后端 | <span class="hl-val">已测试</span> |\n' +
        '| AI-002 | 元素识别 | S4 | 后端 | <span class="hl-val">已测试</span> |\n' +
        '| EXEC-001 | 执行引擎 | S5 | 后端 | <span class="hl-val">已测试</span> |\n' +
        '| EXEC-002 | 调度器 | S5 | 后端 | <span class="hl-val">已测试</span> |\n' +
        '| RPT-001 | 报告生成 | S6 | 后端 | <span class="hl-val">已测试</span> |\n' +
        '| RPT-002 | 报告页面 | S6 | 前端 | <span class="hl-val">已测试</span> |\n' +
        '| <span class="hl-comment">...</span> | <span class="hl-comment">共 74 个功能单元</span> | <span class="hl-comment">S1-S7</span> | | |\n\n' +
        '<span class="hl-key">统计</span>: 已完成 74/74 (100%) | 已审查 74 | 已测试 74'
    },
    {
      title: '测试报告.md',
      content:
        '<span class="hl-comment"># TestPilot 测试报告</span>\n\n' +
        '<span class="hl-key">## 测试总览</span>\n' +
        '| 指标 | 数值 |\n' +
        '|------|------|\n' +
        '| 总用例数 | 111 |\n' +
        '| 通过 | 102 (91.9%) |\n' +
        '| 失败 | 5 (4.5%) |\n' +
        '| 跳过 | 4 (3.6%) |\n\n' +
        '<span class="hl-key">## 按模块统计</span>\n' +
        '| 模块 | 用例数 | 通过 | 失败 | 跳过 |\n' +
        '|------|--------|------|------|------|\n' +
        '| 认证模块 | 18 | 18 | 0 | 0 |\n' +
        '| 场景管理 | 16 | 15 | 1 | 0 |\n' +
        '| 用例管理 | 18 | 16 | 1 | 1 |\n' +
        '| 执行引擎 | 15 | 13 | 1 | 1 |\n' +
        '| AI 服务 | 12 | 11 | 1 | 0 |\n' +
        '| 任务调度 | 10 | 9 | 0 | 1 |\n' +
        '| 报告系统 | 12 | 11 | 1 | 0 |\n' +
        '| 调试工具 | 10 | 9 | 0 | 1 |\n\n' +
        '<span class="hl-key">## 失败分析</span>\n' +
        'FAIL-001: 场景导出 - 大数据量超时（已标记为已知风险）\n' +
        'FAIL-002: AI 解析 - 复杂多步指令准确率不足\n' +
        'FAIL-003~005: 并发执行 - 资源竞争偶发问题\n\n' +
        '<span class="hl-key">## 发布建议</span>\n' +
        '<span class="hl-val">建议发布</span>：Critical 问题已全部修复，5 个失败用例均为非核心路径，\n' +
        '可在后续迭代中优化。核心功能测试通过率 100%。'
    }
  ];

  window.switchDoc = function (idx) {
    var tabs = document.querySelectorAll('#docTabs .doc-tab');
    tabs.forEach(function (t, i) { t.classList.toggle('active', i === idx); });
    var container = document.getElementById('docContent');
    var d = docs[idx];
    container.innerHTML = '<pre>' + d.content + '</pre>';
  };

  // init first tab
  switchDoc(0);
})();
