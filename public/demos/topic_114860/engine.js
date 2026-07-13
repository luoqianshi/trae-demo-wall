/**
 * TestPilot · AI测试设计体检官 — 核心引擎
 * 包含: System Prompt + Mock数据 + AI调用 + JSON解析 + 导出功能
 */

// ===== 预置输入文档 =====
const PRESET_DOCUMENT = `Flux 管理界面 — 登录功能需求

1. 用户打开登录页面，输入用户名和密码
2. 用户名：邮箱格式，必填，最大 64 字符
3. 密码：必填，8-20 字符，需包含大小写字母和数字
4. 点击「登录」按钮
5. 验证成功：跳转至 Dashboard 首页
6. 验证失败：页面提示"用户名或密码错误"，不清空密码
7. 提供「记住我」复选框（7天免登录）`;

// ===== System Prompt（完整版） =====
const SYSTEM_PROMPT = `你是 TestPilot，一名拥有 15 年以上经验的测试架构师、自动化测试专家和需求评审专家。

## 迭代处理规则

用户的消息可能包含两种模式，你必须自动识别并分别处理：

### 模式 A：首次生成
用户消息只包含需求文档和配置参数，不含已有用例 JSON。
 执行完整的 Step 1-7 工作流程。

### 模式 B：迭代优化
用户消息包含「上次生成的用例 JSON」+「用户的补充要求」。
 跳过 Step 1-2（需求解析和测试点树已在上次完成），直接执行：
  1. 读取上次的用例 JSON，理解当前已有的用例
  2. 根据用户的补充要求，定位需要修改/新增/删除的用例
  3. 执行修改并生成新的完整 JSON（必须包含所有用例，不仅仅是修改的部分）
  4. 重新执行 Step 4-7（体检、缺陷发现、风险分析、自动化建议需基于新的完整用例集重新计算）
  5. 保持用例编号全局递增不重复，新增用例接续上次的最大编号

你的职责不是简单生成测试用例，而是像资深测试专家一样，帮助测试工程师：
1. 系统性地分析需求文档
2. 拆解出完整的测试点
3. 生成结构化的高质量测试用例
4. 主动发现需求和用例中的遗漏与风险
5. 给出自动化落地建议

## 工作流程

你必须严格按照以下步骤依次执行：

### Step 1: 需求解析
分析用户提供的需求文档，识别：
- 功能模块（按页面/接口/业务场景划分）
- 业务流程（主流程 + 分支流程）
- 数据流转（输入 → 处理 → 输出）
- 约束条件（格式、长度、范围、权限）
- 隐含需求（安全、并发、性能、兼容性、数据恢复）

### Step 2: 测试点树生成
将需求拆解为结构化的测试点树：
- 按功能模块分组
- 每个模块下列出具体测试点
- 标注每个测试点的类型（功能/边界/异常/安全/性能/并发/权限/兼容性）
- 标注来源（需求明确提及 / AI 基于经验补充）
- AI 必须补充需求文档中未提及但隐含存在的测试点

### Step 3: 测试用例生成
为每个测试点生成 1-N 条测试用例。
用例数量取决于用户选择的测试级别：
- 冒烟测试：每个模块 1-2 条核心用例
- 回归测试：每个测试点至少 1 条
- Workflow：按端到端流程生成
- 市场问题：针对已知问题场景
- 复杂业务：高风险链路深度覆盖

每条用例必须包含 8 个字段：
1. purpose（测试目的）：一句话概括
2. requirementSource（需求来源）：引用需求原文位置
3. preconditions（前置条件）：编号列表
4. steps（测试步骤）：编号列表，每步一个动作
5. expectedResults（预期结果）：编号列表，对应每步
6. priority（优先级）：P0/P1/P2/P3
7. testLevel（测试级别）：冒烟/回归/Workflow/市场问题/复杂业务
8. testType（测试类型）：功能/API/UI/性能

优先级定义：
- P0 核心：系统核心功能，阻塞性缺陷，必须 100% 通过
- P1 重要：主要业务流程，高优先级
- P2 一般：次要功能，常规验证
- P3 次要：边界情况，极端场景

优先级与测试级别默认关联：
- P0 → 优先归入「冒烟测试」
- P1 → 优先归入「回归测试」
- P2 → 按测试方法归入「回归」或「Workflow」
- P3 → 按测试方法归入「回归」
- 「复杂业务」和「市场问题」级别不受优先级约束

用例设计方法论（根据用户选择的测试方法应用）：
- 边界值分析：最小值、最大值、略小于最小值、略大于最大值、中间值；字符串：空串、单字符、最大长度、最大长度+1、特殊字符
- 等价类划分：有效等价类和无效等价类各至少一条
- 场景法：基本流(Happy Path) + 备选流(异常分支)
- 状态迁移：覆盖所有状态和转换，关注非法转换
- 决策表：多条件组合穷举，合并矛盾组合
- 错误推测：网络断开、并发冲突、重复提交、超长输入、SQL 注入、XSS

用例质量标准：
- 可独立执行，不依赖其他用例结果
- 步骤明确无歧义，每步只有一个动作
- 预期结果可验证，避免模糊描述
- 一个用例一个主验证点（极其重要）

自动化适用性判定（每条用例必须判定）：

✅ 完全适合自动化 — 必须同时满足：
- UI 元素固定且可定位
- 步骤线性明确，无人工判断
- 预期结果可程序化验证
- 无硬件依赖
- 无复杂主观判断
- 非性能测试类型（性能测试需专用工具）

⚠️ 部分适合自动化 — 满足以下任一条件：
- 含少量人工判断（视觉验证、内容合理性）
- 存在非确定性操作（验证码、等待人工输入）
- 特定测试环境或数据准备成本高

❌ 仅手动测试 — 满足以下任一条件：
- 纯视觉/UI 审美验证
- 硬件交互（打印、刷卡、指纹）
- 探索性测试
- 用户体验/主观评价
- 需专用性能测试工具

### Step 4: AI 用例体检
对生成的用例进行自检：
1. 回溯需求文档，列出所有已覆盖的需求点
2. 列出 AI 补充的隐含测试点
3. 列出可能遗漏的测试点
4. 计算覆盖率百分比

### Step 5: 需求缺陷发现
反向审查需求文档，找出：
- 遗漏：应该定义但未定义的场景
- 矛盾：前后描述不一致的地方
- 模糊：描述不明确、可能有歧义
- 不合理：设计上可能存在问题

### Step 6: 风险分析
识别：
- 高风险测试区域（安全相关、核心流程、复杂逻辑）
- 中风险测试区域（多条件组合、边界密集）
- 给出测试资源分配建议

### Step 7: 自动化建议汇总
统计自动化占比，给出：
- 优先自动化的用例
- 需要改造后才能自动化的用例
- 不建议自动化的用例及原因
- 整体自动化落地建议

## 输出格式与分批策略

你必须且只能输出合法的 JSON 对象，不要输出任何其他内容（不要 Markdown、不要解释、不要代码块标记）。

### 分批生成规则（防止 JSON 截断）
硬规则：当配置参数中测试级别为「回归测试」且测试方法选择了 3 种及以上时，预估用例数可能超过 20 条。此时你必须执行以下策略：
- 优先保证 JSON 结构完整：宁可减少用例数量，也要确保输出的 JSON 是合法的、可被程序解析的
- 如果必须减少：优先保留 P0/P1 用例和每个测试点的代表性用例，P2/P3 边界用例可适当精简
- 绝对禁止：输出一个被截断的 JSON
- 替代方案：在 testCases 中只生成每个测试点的 1 条核心用例（优先 P0/P1），在 reviewReport.possibleGaps 中列出"因输出长度限制暂未生成的用例类型"，提示用户通过迭代补充
- 用户可通过迭代机制补充："补充 P2/P3 边界用例"

JSON 结构如下：

{
  "metadata": {
    "documentTitle": "从需求文档第一行非空文本提取，最大30字符",
    "generatedAt": "ISO 8601 格式时间戳",
    "config": {
      "testLevel": "用户选择的测试级别",
      "testMethods": ["用户选择的测试方法数组"],
      "testType": "用户选择的测试类型",
      "preference": "用户选择的生成偏好"
    }
  },
  "testPointTree": [
    {
      "module": "功能模块名",
      "points": [
        {
          "name": "测试点名称",
          "type": "功能|边界|异常|安全|性能|并发|权限|兼容性",
          "source": "需求明确|AI补充"
        }
      ]
    }
  ],
  "testCases": [
    {
      "id": "001",
      "module": "所属功能模块",
      "purpose": "测试目的详细描述",
      "requirementSource": "需求第X条",
      "preconditions": ["前置条件1", "前置条件2"],
      "steps": ["步骤1", "步骤2", "步骤3"],
      "expectedResults": ["对应步骤1的预期", "对应步骤2的预期", "对应步骤3的预期"],
      "priority": "P0",
      "testLevel": "冒烟",
      "testType": "功能",
      "automation": {
        "suitability": "✅",
        "reason": "判定原因",
        "suggestion": "建议（仅⚠️和❌时输出，✅时为空字符串）"
      }
    }
  ],
  "reviewReport": {
    "totalRequirements": 0,
    "coveredRequirements": 0,
    "coverageRate": "0%",
    "coveredPoints": ["已覆盖的需求点列表"],
    "supplementedPoints": ["AI补充的测试点列表"],
    "possibleGaps": ["可能遗漏的测试点列表"]
  },
  "requirementDefects": [
    {
      "id": "D001",
      "type": "遗漏|矛盾|模糊|不合理",
      "location": "需求中的位置",
      "description": "缺陷详细描述",
      "suggestion": "修改建议"
    }
  ],
  "riskAnalysis": {
    "highRiskAreas": ["高风险区域列表，每项含描述"],
    "mediumRiskAreas": ["中风险区域列表，每项含描述"],
    "suggestions": ["测试建议列表"]
  },
  "automationSummary": {
    "fullyAutomated": 0,
    "partiallyAutomated": 0,
    "manualOnly": 0,
    "totalCases": 0,
    "automationRate": "0%",
    "suggestions": ["自动化落地建议列表"]
  },
  "summary": {
    "totalCases": 0,
    "priorityDistribution": {"P0": 0, "P1": 0, "P2": 0, "P3": 0}
  }
}

## 需求遗漏检查清单

在 Step 4 和 Step 5 中，你必须检查以下维度是否被覆盖：
1. 正常流程（Happy Path）
2. 边界值（输入的最小值、最大值、空值、超长值）
3. 异常输入（非法格式、特殊字符、SQL注入、XSS）
4. 权限控制（未登录、无权限、越权操作）
5. 并发场景（同时操作、数据冲突）
6. 数据持久化（刷新后、重启后数据是否保持）
7. 安全性（密码加密、Token 安全、HTTPS）
8. 兼容性（不同浏览器、不同分辨率）
9. 国际化（多语言、时区、编码）
10. 性能（响应时间、大数据量、并发用户）
11. 错误恢复（网络中断后恢复、操作中断后重试）
12. 状态一致性（多端同步、缓存一致性）`;

// ===== Mock 数据（15 条完整用例） =====
function getMockData(documentTitle) {
  const title = documentTitle || 'Flux 管理界面 — 登录功能需求';
  const now = new Date().toISOString();

  return {
    metadata: {
      documentTitle: title,
      generatedAt: now,
      config: {
        testLevel: '回归测试',
        testMethods: ['边界值分析', '等价类划分', '场景法'],
        testType: '功能测试',
        preference: '混合模式'
      }
    },
    testPointTree: [
      {
        module: '登录功能',
        points: [
          { name: '正常登录流程', type: '功能', source: '需求明确' },
          { name: '用户名格式验证（邮箱格式）', type: '边界', source: '需求明确' },
          { name: '用户名长度验证（最大64字符）', type: '边界', source: '需求明确' },
          { name: '密码复杂度验证（大小写+数字）', type: '边界', source: '需求明确' },
          { name: '密码长度验证（8-20字符）', type: '边界', source: '需求明确' },
          { name: '登录失败提示信息', type: '异常', source: '需求明确' },
          { name: '密码不清空逻辑', type: '功能', source: '需求明确' },
          { name: '记住我功能（7天免登录）', type: '功能', source: '需求明确' },
          { name: 'SQL注入防护测试', type: '安全', source: 'AI补充' },
          { name: 'XSS跨站脚本防护测试', type: '安全', source: 'AI补充' },
          { name: '连续错误登录锁定机制', type: '异常', source: 'AI补充' },
          { name: '网络异常处理', type: '异常', source: 'AI补充' },
          { name: '并发登录场景', type: '并发', source: 'AI补充' }
        ]
      }
    ],
    testCases: [
      {
        id: '001',
        module: '登录功能',
        purpose: '验证用户使用正确邮箱和密码能成功登录系统并跳转至Dashboard首页',
        requirementSource: '需求第1、4、5条',
        preconditions: ['1. 系统已正常启动，登录页面可访问', '2. 已存在有效注册用户（邮箱：test@example.com，密码：Test1234）'],
        steps: ['1. 打开浏览器访问登录页面URL', '2. 在用户名输入框输入 test@example.com', '3. 在密码输入框输入 Test1234', '4. 点击「登录」按钮'],
        expectedResults: ['1. 登录页面正常显示，包含用户名输入框、密码输入框、登录按钮', '2. 用户名输入框显示输入的邮箱地址', '3. 密码输入框显示掩码字符', '4. 页面跳转至 Dashboard 首页（URL 变为 /dashboard），显示用户登录欢迎信息'],
        priority: 'P0',
        testLevel: '冒烟',
        testType: '功能',
        automation: { suitability: '✅', reason: 'UI元素固定可定位，步骤线性明确，预期结果可通过URL和元素存在性验证，无人工判断', suggestion: '' }
      },
      {
        id: '002',
        module: '登录功能',
        purpose: '验证使用错误密码登录时提示"用户名或密码错误"且密码框不被清空',
        requirementSource: '需求第6条',
        preconditions: ['1. 系统已正常启动', '2. 已存在有效注册用户（邮箱：test@example.com，密码：Test1234）'],
        steps: ['1. 打开登录页面', '2. 在用户名输入框输入 test@example.com', '3. 在密码输入框输入 WrongPass1', '4. 点击「登录」按钮'],
        expectedResults: ['1. 登录页面正常显示', '2. 用户名输入框显示输入的邮箱地址', '3. 密码输入框显示掩码字符', '4. 页面显示提示信息"用户名或密码错误"，密码输入框保留已输入的内容不被清空，页面停留在登录页'],
        priority: 'P0',
        testLevel: '冒烟',
        testType: '功能',
        automation: { suitability: '✅', reason: '步骤线性明确，预期结果可通过提示文本和密码框value属性验证', suggestion: '' }
      },
      {
        id: '003',
        module: '登录功能',
        purpose: '验证用户名为空时点击登录按钮系统给出必填提示',
        requirementSource: '需求第2条',
        preconditions: ['1. 系统已正常启动', '2. 登录页面已打开'],
        steps: ['1. 打开登录页面', '2. 不在用户名输入框输入任何内容', '3. 在密码输入框输入 Test1234', '4. 点击「登录」按钮'],
        expectedResults: ['1. 登录页面正常显示', '2. 用户名输入框为空', '3. 密码输入框显示掩码字符', '4. 用户名输入框下方显示必填提示（如"请输入用户名"），不发起登录请求，页面停留在登录页'],
        priority: 'P1',
        testLevel: '回归',
        testType: '功能',
        automation: { suitability: '✅', reason: 'UI元素固定可定位，步骤线性，预期结果可通过提示文本元素验证', suggestion: '' }
      },
      {
        id: '004',
        module: '登录功能',
        purpose: '验证用户名输入65个字符（超过64字符上限）时系统拒绝并提示',
        requirementSource: '需求第2条',
        preconditions: ['1. 系统已正常启动', '2. 登录页面已打开', '3. 准备一个65字符的邮箱格式字符串'],
        steps: ['1. 打开登录页面', '2. 在用户名输入框输入65个字符的邮箱格式字符串（如 a...a@example.com，总长65字符）', '3. 在密码输入框输入 Test1234', '4. 点击「登录」按钮'],
        expectedResults: ['1. 登录页面正常显示', '2. 用户名输入框显示输入的超长字符串', '3. 密码输入框显示掩码字符', '4. 系统提示用户名长度超过限制（如"用户名不能超过64个字符"），不发起登录请求'],
        priority: 'P2',
        testLevel: '回归',
        testType: '功能',
        automation: { suitability: '✅', reason: '输入和操作完全确定，预期结果可通过提示文本验证', suggestion: '' }
      },
      {
        id: '005',
        module: '登录功能',
        purpose: '验证用户名输入恰好64个字符（达到上限）时系统能正常处理登录请求',
        requirementSource: '需求第2条',
        preconditions: ['1. 系统已正常启动', '2. 已注册一个64字符邮箱的用户账号', '3. 登录页面已打开'],
        steps: ['1. 打开登录页面', '2. 在用户名输入框输入恰好64字符的邮箱地址', '3. 在密码输入框输入正确密码 Test1234', '4. 点击「登录」按钮'],
        expectedResults: ['1. 登录页面正常显示', '2. 用户名输入框显示64字符的邮箱地址', '3. 密码输入框显示掩码字符', '4. 系统正常处理登录请求，不提示长度超限（若账号正确则登录成功跳转Dashboard，若账号不存在则提示"用户名或密码错误"）'],
        priority: 'P2',
        testLevel: '回归',
        testType: '功能',
        automation: { suitability: '✅', reason: '边界值测试，输入确定，预期结果可验证', suggestion: '' }
      },
      {
        id: '006',
        module: '登录功能',
        purpose: '验证密码输入7个字符（低于8字符下限）时系统拒绝并提示',
        requirementSource: '需求第3条',
        preconditions: ['1. 系统已正常启动', '2. 登录页面已打开'],
        steps: ['1. 打开登录页面', '2. 在用户名输入框输入 test@example.com', '3. 在密码输入框输入 Pass12（7个字符，含大小写和数字）', '4. 点击「登录」按钮'],
        expectedResults: ['1. 登录页面正常显示', '2. 用户名输入框显示邮箱地址', '3. 密码输入框显示掩码字符', '4. 系统提示密码长度不符合要求（如"密码长度需为8-20个字符"），不发起登录请求'],
        priority: 'P2',
        testLevel: '回归',
        testType: '功能',
        automation: { suitability: '✅', reason: '边界值测试，输入确定，预期可通过提示文本验证', suggestion: '' }
      },
      {
        id: '007',
        module: '登录功能',
        purpose: '验证密码输入21个字符（超过20字符上限）时系统拒绝并提示',
        requirementSource: '需求第3条',
        preconditions: ['1. 系统已正常启动', '2. 登录页面已打开'],
        steps: ['1. 打开登录页面', '2. 在用户名输入框输入 test@example.com', '3. 在密码输入框输入 21个字符的密码（含大小写和数字，如 Test12345678901234567）', '4. 点击「登录」按钮'],
        expectedResults: ['1. 登录页面正常显示', '2. 用户名输入框显示邮箱地址', '3. 密码输入框显示掩码字符', '4. 系统提示密码长度不符合要求（如"密码长度需为8-20个字符"），不发起登录请求'],
        priority: 'P2',
        testLevel: '回归',
        testType: '功能',
        automation: { suitability: '✅', reason: '边界值测试，输入确定，预期可通过提示文本验证', suggestion: '' }
      },
      {
        id: '008',
        module: '登录功能',
        purpose: '验证密码缺少大写字母时系统拒绝并提示密码复杂度要求',
        requirementSource: '需求第3条',
        preconditions: ['1. 系统已正常启动', '2. 登录页面已打开'],
        steps: ['1. 打开登录页面', '2. 在用户名输入框输入 test@example.com', '3. 在密码输入框输入 test1234（仅小写字母和数字，8字符）', '4. 点击「登录」按钮'],
        expectedResults: ['1. 登录页面正常显示', '2. 用户名输入框显示邮箱地址', '3. 密码输入框显示掩码字符', '4. 系统提示密码复杂度不符合要求（如"密码需包含大小写字母和数字"），不发起登录请求'],
        priority: 'P2',
        testLevel: '回归',
        testType: '功能',
        automation: { suitability: '✅', reason: '等价类测试，输入确定，预期可通过提示文本验证', suggestion: '' }
      },
      {
        id: '009',
        module: '登录功能',
        purpose: '验证密码缺少数字时系统拒绝并提示密码复杂度要求',
        requirementSource: '需求第3条',
        preconditions: ['1. 系统已正常启动', '2. 登录页面已打开'],
        steps: ['1. 打开登录页面', '2. 在用户名输入框输入 test@example.com', '3. 在密码输入框输入 TestPass（仅大小写字母，无数字，8字符）', '4. 点击「登录」按钮'],
        expectedResults: ['1. 登录页面正常显示', '2. 用户名输入框显示邮箱地址', '3. 密码输入框显示掩码字符', '4. 系统提示密码复杂度不符合要求（如"密码需包含大小写字母和数字"），不发起登录请求'],
        priority: 'P2',
        testLevel: '回归',
        testType: '功能',
        automation: { suitability: '✅', reason: '等价类测试，输入确定，预期可通过提示文本验证', suggestion: '' }
      },
      {
        id: '010',
        module: '登录功能',
        purpose: '验证勾选「记住我」后关闭浏览器重新打开能免登录直接进入系统',
        requirementSource: '需求第7条',
        preconditions: ['1. 系统已正常启动', '2. 已存在有效注册用户', '3. 浏览器Cookie功能正常开启'],
        steps: ['1. 打开登录页面', '2. 输入正确的用户名和密码', '3. 勾选「记住我」复选框', '4. 点击「登录」按钮，等待跳转至Dashboard', '5. 完全关闭浏览器', '6. 重新打开浏览器，访问系统首页URL'],
        expectedResults: ['1. 登录页面正常显示', '2-3. 输入框和复选框正常响应', '4. 登录成功，跳转至Dashboard首页', '5. 浏览器完全关闭', '6. 页面直接跳转至Dashboard首页（无需重新登录），显示用户登录状态'],
        priority: 'P2',
        testLevel: '回归',
        testType: '功能',
        automation: { suitability: '❌', reason: '需要关闭并重新打开浏览器的操作，自动化框架难以模拟完整的浏览器关闭重开流程', suggestion: '可考虑通过直接验证Cookie过期时间和属性来间接验证，或使用Selenium的deleteAllCookies + 重新get URL模拟' }
      },
      {
        id: '011',
        module: '登录功能',
        purpose: '验证未勾选「记住我」时关闭浏览器后重新访问需要重新登录',
        requirementSource: '需求第7条',
        preconditions: ['1. 系统已正常启动', '2. 已存在有效注册用户', '3. 浏览器Cookie功能正常开启'],
        steps: ['1. 打开登录页面', '2. 输入正确的用户名和密码', '3. 确认「记住我」复选框未被勾选', '4. 点击「登录」按钮，等待跳转至Dashboard', '5. 完全关闭浏览器', '6. 重新打开浏览器，访问系统首页URL'],
        expectedResults: ['1. 登录页面正常显示', '2-3. 输入框正常响应，复选框未勾选', '4. 登录成功，跳转至Dashboard首页', '5. 浏览器完全关闭', '6. 页面跳转至登录页面（要求重新登录），不显示Dashboard内容'],
        priority: 'P2',
        testLevel: '回归',
        testType: '功能',
        automation: { suitability: '❌', reason: '需要关闭并重新打开浏览器，自动化框架难以模拟完整的浏览器关闭重开流程', suggestion: '可考虑通过验证Session Cookie vs Persistent Cookie的属性来间接验证' }
      },
      {
        id: '012',
        module: '登录功能',
        purpose: '验证用户名输入框对SQL注入攻击的防护能力',
        requirementSource: '需求第1-2条（AI补充安全测试）',
        preconditions: ['1. 系统已正常启动', '2. 登录页面已打开', '3. 系统应有SQL注入防护机制'],
        steps: ['1. 打开登录页面', '2. 在用户名输入框输入 SQL注入字符串：\' OR \'1\'=\'1', '3. 在密码输入框输入任意内容如 Test1234', '4. 点击「登录」按钮'],
        expectedResults: ['1. 登录页面正常显示', '2. 用户名输入框显示输入的注入字符串', '3. 密码输入框显示掩码字符', '4. 系统正常处理输入（不执行注入语句），提示"用户名或密码错误"，不跳转至Dashboard，不泄露系统错误信息'],
        priority: 'P1',
        testLevel: '回归',
        testType: '功能',
        automation: { suitability: '✅', reason: '输入固定，预期结果可通过提示文本和页面URL验证', suggestion: '' }
      },
      {
        id: '013',
        module: '登录功能',
        purpose: '验证密码输入框对XSS跨站脚本攻击的防护能力',
        requirementSource: '需求第1条（AI补充安全测试）',
        preconditions: ['1. 系统已正常启动', '2. 登录页面已打开', '3. 系统应有XSS防护机制'],
        steps: ['1. 打开登录页面', '2. 在用户名输入框输入 test@example.com', '3. 在密码输入框输入 XSS脚本：<script>alert("XSS")</script>', '4. 点击「登录」按钮'],
        expectedResults: ['1. 登录页面正常显示', '2. 用户名输入框显示邮箱地址', '3. 密码输入框显示掩码字符', '4. 系统正常处理输入（不执行脚本），提示"用户名或密码错误"，页面不弹出alert弹窗，不执行任何脚本'],
        priority: 'P1',
        testLevel: '回归',
        testType: '功能',
        automation: { suitability: '✅', reason: '输入固定，预期可通过是否出现弹窗和提示文本验证', suggestion: '' }
      },
      {
        id: '014',
        module: '登录功能',
        purpose: '验证连续5次密码错误输入后账号被锁定，防止暴力破解',
        requirementSource: '需求第6条（AI补充异常场景）',
        preconditions: ['1. 系统已正常启动', '2. 已存在有效注册用户（邮箱：test@example.com）', '3. 账号当前处于正常（未锁定）状态'],
        steps: ['1. 打开登录页面', '2. 输入 test@example.com 和错误密码，点击登录', '3. 重复步骤2共5次（连续5次密码错误）', '4. 第6次尝试使用正确密码 Test1234 登录'],
        expectedResults: ['1. 登录页面正常显示', '2-3. 每次都提示"用户名或密码错误"', '4. 账号已被锁定，提示"账号已锁定，请30分钟后再试"（或类似锁定提示），即使密码正确也无法登录'],
        priority: 'P1',
        testLevel: '冒烟',
        testType: '功能',
        automation: { suitability: '✅', reason: '步骤线性重复，预期可通过提示文本验证，但需要注意测试后重置账号锁定状态', suggestion: '' }
      },
      {
        id: '015',
        module: '登录功能',
        purpose: '验证登录过程中网络断开时系统给出友好的错误提示',
        requirementSource: '需求第1条（AI补充异常场景）',
        preconditions: ['1. 系统已正常启动', '2. 登录页面已打开', '3. 可通过开发者工具或网络设置模拟断网'],
        steps: ['1. 打开登录页面', '2. 输入正确的用户名 test@example.com 和密码 Test1234', '3. 通过浏览器开发者工具或系统设置断开网络连接', '4. 点击「登录」按钮'],
        expectedResults: ['1. 登录页面正常显示', '2. 输入框正常显示输入内容', '3. 网络连接已断开', '4. 系统显示网络异常提示（如"网络连接异常，请检查网络后重试"），不出现白屏或未处理错误，页面停留在登录页'],
        priority: 'P2',
        testLevel: '回归',
        testType: '功能',
        automation: { suitability: '❌', reason: '需要模拟网络断开场景，自动化框架需要特殊配置（如代理拦截或DevTools协议），且环境依赖性强', suggestion: '可考虑使用Playwright的route拦截功能模拟网络失败，或使用browserless的离线模式' }
      }
    ],
    reviewReport: {
      totalRequirements: 7,
      coveredRequirements: 6,
      coverageRate: '85.7%',
      coveredPoints: [
        '1. 用户名密码登录流程（需求第1、4、5条）',
        '2. 用户名邮箱格式验证（需求第2条）',
        '3. 用户名最大64字符限制（需求第2条）',
        '4. 密码8-20字符长度限制（需求第3条）',
        '5. 密码需含大小写字母和数字（需求第3条）',
        '6. 登录失败提示且不清空密码（需求第6条）',
        '7. 记住我7天免登录功能（需求第7条）'
      ],
      supplementedPoints: [
        '1. SQL注入安全测试 — 需求未提及但属于登录必备安全测试',
        '2. XSS跨站脚本防护测试 — 需求未提及但属于输入安全必备',
        '3. 连续错误登录锁定机制 — 需求未定义但属于防暴力破解必备',
        '4. 网络异常处理 — 需求未提及但属于用户体验必备',
        '5. 并发登录场景 — 需求未提及但属于高可用必备'
      ],
      possibleGaps: [
        '1. 「记住我」功能的Cookie过期逻辑 — 7天后是自动登出还是跳转登录页，需求未明确',
        '2. 密码框是否支持粘贴操作 — 需求未说明',
        '3. 多浏览器兼容性测试 — 需求未提及目标浏览器范围',
        '4. HTTPS加密传输 — 需求未明确要求密码传输加密',
        '5. 并发登录场景（同一账号多端同时登录）— 需求未定义行为'
      ]
    },
    requirementDefects: [
      {
        id: 'D001',
        type: '遗漏',
        location: '需求第6条',
        description: '未定义连续登录失败的锁定机制（如5次错误后锁定账号多长时间、如何解锁）',
        suggestion: '补充"连续5次密码错误后，账号锁定30分钟，30分钟后自动解锁或需联系管理员解锁"的需求'
      },
      {
        id: 'D002',
        type: '模糊',
        location: '需求第7条',
        description: '"记住我"功能描述为"7天免登录"，但未说明7天后Cookie过期的具体行为（自动登出跳转登录页 vs 静默清除登录状态）',
        suggestion: '明确7天后Cookie过期时，页面应跳转至登录页并提示"登录已过期，请重新登录"'
      },
      {
        id: 'D003',
        type: '遗漏',
        location: '全文',
        description: '未提及密码传输是否加密（HTTPS），也未提及密码存储是否加密（如bcrypt）',
        suggestion: '明确要求密码传输必须使用HTTPS，密码存储必须使用bcrypt或同等强度加密算法'
      }
    ],
    riskAnalysis: {
      highRiskAreas: [
        '1. 登录安全 — 涉及身份认证核心，SQL注入和XSS攻击风险高，若防护不当可导致数据泄露或越权访问',
        '2. 「记住我」Cookie安全 — 若Token可伪造或未加密存储，攻击者可通过窃取Cookie实现免密登录'
      ],
      mediumRiskAreas: [
        '1. 密码复杂度校验 — 多种规则组合（大小写+数字+长度），边界情况多，校验逻辑容易遗漏',
        '2. 登录失败后的状态保持 — 需确认密码框不清空逻辑在各种失败场景下行为一致',
        '3. 账号锁定机制 — 锁定后的解锁流程、并发请求下的锁定计数准确性需要验证'
      ],
      suggestions: [
        '1. 安全相关用例建议由安全测试工程师专项评审，必要时进行渗透测试',
        '2. 「记住我」功能建议进行Cookie安全性测试（HttpOnly、Secure、SameSite属性）',
        '3. 建议补充接口层面的登录安全测试（API层SQL注入、暴力破解防护）',
        '4. 账号锁定机制需验证并发场景下的计数准确性，建议进行并发测试'
      ]
    },
    automationSummary: {
      fullyAutomated: 12,
      partiallyAutomated: 0,
      manualOnly: 3,
      totalCases: 15,
      automationRate: '80.0%',
      suggestions: [
        '1. 优先将P0级别的✅用例（#001、#002）纳入自动化回归套件，每次构建自动执行',
        '2. P1级别的安全测试用例（#012 SQL注入、#013 XSS）建议集成到CI/CD的DAST安全扫描流程',
        '3. #014连续错误锁定用例自动化时需注意测试后重置账号状态，避免影响后续测试',
        '4. ❌用例中#010、#011（记住我功能）建议通过验证Cookie属性间接自动化，#015（网络断开）可使用Playwright route拦截模拟',
        '5. 预估自动化覆盖后，每次回归可节省约2小时人工测试时间'
      ]
    },
    summary: {
      totalCases: 15,
      priorityDistribution: { P0: 2, P1: 4, P2: 9, P3: 0 }
    }
  };
}

// ===== AI 调用封装 =====
async function callAI(systemPrompt, userMessage) {
  // 1. 尝试 TRAE 内置 API（window.ai）
  if (typeof window !== 'undefined' && window.ai && typeof window.ai.chat === 'function') {
    try {
      const response = await window.ai.chat({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ]
      });
      if (response && response.content) {
        return response.content;
      }
    } catch (e) {
      console.warn('window.ai 调用失败，降级为 Mock 模式:', e.message);
    }
  }

  // 2. 降级 Mock 模式
  console.warn('AI API 不可用，使用 Mock 模式');
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 1500));
  // 从用户消息中提取文档标题
  const titleMatch = userMessage.match(/## 用户输入的需求文档\s*\n(.+)/);
  const docTitle = titleMatch ? titleMatch[1].trim().substring(0, 30) : null;
  return JSON.stringify(getMockData(docTitle));
}

// ===== JSON 解析容错 =====
function parseAIResponse(raw) {
  if (!raw || typeof raw !== 'string') {
    throw new Error('AI 返回内容为空');
  }

  // 1. 直接解析
  try { return JSON.parse(raw); } catch (e) { /* 继续尝试 */ }

  // 2. 提取 ```json ... ``` 包裹的内容
  const codeBlockMatch = raw.match(/```json\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try { return JSON.parse(codeBlockMatch[1]); } catch (e) { /* 继续尝试 */ }
  }

  // 3. 提取第一个 { 到最后一个 } 之间的内容
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    const jsonStr = raw.substring(start, end + 1);
    try { return JSON.parse(jsonStr); } catch (e) { /* 继续尝试 */ }
  }

  // 4. 解析失败
  throw new Error('无法解析 AI 返回的 JSON，请重试');
}

// ===== 输入校验 =====
function validateInput(text) {
  if (!text || text.trim().length === 0) {
    return { valid: false, message: '请输入需求文档内容' };
  }
  const charCount = text.replace(/\s/g, '').length;
  if (charCount < 50) {
    return { valid: false, message: `请输入至少 50 字的需求文档（当前 ${charCount} 字）` };
  }
  return { valid: true, message: '' };
}

// ===== 字数统计 =====
function countWords(text) {
  if (!text) return 0;
  return text.replace(/\s/g, '').length;
}

// ===== 输入预处理 =====
function preprocessInput(text) {
  if (!text) return '';
  let cleaned = text;
  // 去除不可见特殊字符（保留换行、制表符）
  cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  // 合并连续2个以上空行为1个
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  // 截取前8000字
  if (cleaned.length > 8000) {
    cleaned = cleaned.substring(0, 8000);
  }
  return cleaned.trim();
}

// ===== 拼接用户消息 =====
function buildUserMessage(document, config) {
  return `## 用户输入的需求文档
${document}

## 配置参数
- 测试级别: ${config.testLevel}
- 测试方法: ${config.testMethods.join('、')}
- 测试类型: ${config.testType}
- 生成偏好: ${config.preference}`;
}

// ===== 拼接迭代消息 =====
function buildIterateMessage(document, config, lastJSON, userRequest) {
  return `## 用户输入的需求文档
${document}

## 配置参数
- 测试级别: ${config.testLevel}
- 测试方法: ${config.testMethods.join('、')}
- 测试类型: ${config.testType}
- 生成偏好: ${config.preference}

## 上次生成的用例 JSON
${lastJSON}

## 用户的补充要求
${userRequest}`;
}

// ===== Markdown 生成 =====
function generateMarkdown(data) {
  let md = `# TestPilot 测试用例报告\n\n`;
  md += `**文档标题**: ${data.metadata.documentTitle}\n`;
  md += `**生成时间**: ${new Date(data.metadata.generatedAt).toLocaleString('zh-CN')}\n`;
  md += `**测试级别**: ${data.metadata.config.testLevel} | **测试类型**: ${data.metadata.config.testType}\n\n`;
  md += `---\n\n`;

  // 统计汇总
  md += `## 统计汇总\n\n`;
  md += `| 指标 | 数值 |\n|------|------|\n`;
  md += `| 用例总数 | ${data.summary.totalCases} |\n`;
  md += `| P0 | ${data.summary.priorityDistribution.P0} |\n`;
  md += `| P1 | ${data.summary.priorityDistribution.P1} |\n`;
  md += `| P2 | ${data.summary.priorityDistribution.P2} |\n`;
  md += `| P3 | ${data.summary.priorityDistribution.P3} |\n`;
  md += `| 自动化率 | ${data.automationSummary.automationRate} |\n\n`;
  md += `---\n\n`;

  // 测试用例
  md += `## 测试用例\n\n`;
  data.testCases.forEach(tc => {
    md += `### #${tc.id} ${tc.purpose}\n\n`;
    md += `| 字段 | 内容 |\n|------|------|\n`;
    md += `| 所属模块 | ${tc.module} |\n`;
    md += `| 需求来源 | ${tc.requirementSource} |\n`;
    md += `| 优先级 | ${tc.priority} |\n`;
    md += `| 测试级别 | ${tc.testLevel} |\n`;
    md += `| 测试类型 | ${tc.testType} |\n`;
    md += `| 自动化 | ${tc.automation.suitability} ${tc.automation.reason} |\n\n`;
    md += `**前置条件:**\n${tc.preconditions.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\n`;
    md += `**测试步骤:**\n${tc.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\n`;
    md += `**预期结果:**\n${tc.expectedResults.map((e, i) => `${i + 1}. ${e}`).join('\n')}\n\n`;
    if (tc.automation.suggestion) {
      md += `**自动化建议:** ${tc.automation.suggestion}\n\n`;
    }
    md += `---\n\n`;
  });

  // 体检报告
  if (data.reviewReport) {
    md += `## AI 用例体检报告\n\n`;
    md += `**覆盖率**: ${data.reviewReport.coverageRate}（${data.reviewReport.coveredRequirements}/${data.reviewReport.totalRequirements}）\n\n`;
    md += `**已覆盖的需求点:**\n${data.reviewReport.coveredPoints.map(p => `- ${p}`).join('\n')}\n\n`;
    md += `**AI 补充的测试点:**\n${data.reviewReport.supplementedPoints.map(p => `- ${p}`).join('\n')}\n\n`;
    md += `**可能遗漏的测试点:**\n${data.reviewReport.possibleGaps.map(p => `- ${p}`).join('\n')}\n\n`;
    md += `---\n\n`;
  }

  // 需求缺陷
  if (data.requirementDefects && data.requirementDefects.length > 0) {
    md += `## 需求缺陷发现\n\n`;
    data.requirementDefects.forEach(d => {
      md += `### ${d.id} [${d.type}]\n`;
      md += `- **位置**: ${d.location}\n`;
      md += `- **描述**: ${d.description}\n`;
      md += `- **建议**: ${d.suggestion}\n\n`;
    });
    md += `---\n\n`;
  }

  // 风险分析
  if (data.riskAnalysis) {
    md += `## 风险分析\n\n`;
    md += `### 高风险区域\n${data.riskAnalysis.highRiskAreas.map(r => `- ${r}`).join('\n')}\n\n`;
    md += `### 中风险区域\n${data.riskAnalysis.mediumRiskAreas.map(r => `- ${r}`).join('\n')}\n\n`;
    md += `### 建议\n${data.riskAnalysis.suggestions.map(s => `- ${s}`).join('\n')}\n\n`;
    md += `---\n\n`;
  }

  // 自动化建议
  if (data.automationSummary) {
    md += `## 自动化建议汇总\n\n`;
    md += `| 类别 | 数量 | 占比 |\n|------|------|------|\n`;
    md += `| ✅ 完全适合 | ${data.automationSummary.fullyAutomated} | ${(data.automationSummary.fullyAutomated / data.automationSummary.totalCases * 100).toFixed(1)}% |\n`;
    md += `| ⚠️ 部分适合 | ${data.automationSummary.partiallyAutomated} | ${(data.automationSummary.partiallyAutomated / data.automationSummary.totalCases * 100).toFixed(1)}% |\n`;
    md += `| ❌ 仅手动 | ${data.automationSummary.manualOnly} | ${(data.automationSummary.manualOnly / data.automationSummary.totalCases * 100).toFixed(1)}% |\n\n`;
    md += `**落地建议:**\n${data.automationSummary.suggestions.map(s => `- ${s}`).join('\n')}\n`;
  }

  return md;
}

// ===== Excel 导出 =====
function generateExcel(data) {
  if (typeof XLSX === 'undefined') {
    alert('SheetJS 库未加载，无法导出 Excel');
    return;
  }

  const headers = ['编号', '所属模块', '测试目的', '需求来源', '前置条件', '测试步骤', '预期结果', '优先级', '测试级别', '测试类型', '自动化适用性', '自动化原因', '自动化建议'];

  const rows = data.testCases.map(tc => [
    tc.id,
    tc.module,
    tc.purpose,
    tc.requirementSource,
    tc.preconditions.join('\n'),
    tc.steps.join('\n'),
    tc.expectedResults.join('\n'),
    tc.priority,
    tc.testLevel,
    tc.testType,
    tc.automation.suitability,
    tc.automation.reason,
    tc.automation.suggestion || ''
  ]);

  const aoa = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // 列宽设置
  ws['!cols'] = [
    { wch: 6 }, { wch: 12 }, { wch: 40 }, { wch: 16 }, { wch: 30 },
    { wch: 40 }, { wch: 40 }, { wch: 6 }, { wch: 8 }, { wch: 8 },
    { wch: 10 }, { wch: 30 }, { wch: 30 }
  ];

  // 表头样式
  const range = XLSX.utils.decode_range(ws['!ref']);
  for (let c = range.s.c; c <= range.e.c; c++) {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c });
    if (ws[cellRef]) {
      ws[cellRef].s = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '2563EB' } },
        alignment: { horizontal: 'center', vertical: 'center' }
      };
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '测试用例');

  // 文件名
  const title = data.metadata.documentTitle || '未命名文档';
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const fileName = `TestPilot_${title}_${dateStr}.xlsx`;

  XLSX.writeFile(wb, fileName);
}

// ===== 文件下载辅助 =====
function downloadFile(content, fileName, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ===== 导出全局对象 =====
window.TestPilotEngine = {
  SYSTEM_PROMPT,
  PRESET_DOCUMENT,
  getMockData,
  callAI,
  parseAIResponse,
  validateInput,
  countWords,
  preprocessInput,
  buildUserMessage,
  buildIterateMessage,
  generateMarkdown,
  generateExcel,
  downloadFile
};
