#!/usr/bin/env node

/**
 * 智能体文档初始化脚本
 * 用于生成智能体模块的标准文档模板
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const docsDir = path.join(__dirname, '../docs/04-开发计划');

// 智能体模块文档模板
const agentDocTemplate = `# {模块名称}

## 模块目标

{模块目标描述}

## 当前状态

- 状态：待开始
- 进度：0%
- 计划开始时间：{开始时间}
- 计划结束时间：{结束时间}
- 负责人：

## 功能范围

### 前端

- [ ] 功能点 1
- [ ] 功能点 2
- [ ] 功能点 3

### 后端

- [ ] 接口 1
- [ ] 接口 2
- [ ] 接口 3

## 数据结构

### 数据表

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | bigint | 主键 |
| create_time | datetime | 创建时间 |
| update_time | datetime | 更新时间 |
| is_delete | tinyint | 逻辑删除 |

## 开发步骤

1. 创建模块计划文档。
2. 后端数据库初始化脚本。
3. 后端实体、DTO、VO、Mapper、Service、Controller。
4. 前端 API 封装。
5. 前端页面开发。
6. 构建验证。
7. 更新模块进度。

## 验收标准

- [ ] 功能完整实现
- [ ] 前后端构建通过
- [ ] 代码符合规范
- [ ] 文档更新完成

## 完成记录

- 
`;

// 智能体节点模板
const agentNodeTemplate = `# 智能体节点开发指南

## 节点类型

### Agent（智能体）

**分类**: 智能体和模型（models_and_agents）

**功能**: 定义智能体指令、可用工具和输入内容，支持工具调用和多轮对话。

### 节点字段

| 字段名 | 显示名 | 类型 | 输入类型 | 必填 | 说明 |
|--------|--------|------|----------|------|------|
| agent_model_config_id | 选择模型 | model_config | - | 是 | 模型配置 ID |
| tools | 工具 | tools | Tool | 否 | 可用工具列表 |
| input_value | 输入 | str | Message, Text | 是 | 用户输入 |
| system_prompt | 智能体指令 | str | - | 否 | 系统提示词 |
| add_current_date_tool | 添加当前日期工具 | bool | - | 否 | 是否自动添加日期工具 |

### 输出

| 输出名 | 显示名 | 类型 | 说明 |
|--------|--------|------|------|
| response | 响应 | Message | 智能体响应消息 |
| agent | 智能体 | Agent | 智能体对象 |

## 后端执行器

### AgentNodeExecutor

位置: \`service/src/main/java/com/ice/template/executor/node/AgentNodeExecutor.java\`

**职责**:
- 解析智能体节点参数
- 构建 LLM 请求（包含系统提示词、工具定义）
- 调用模型 API
- 处理工具调用（如果有）
- 返回响应消息

### 执行流程

1. 从 \`FlowNodeDataUtils\` 提取节点参数
2. 获取模型配置（通过 model_config_id）
3. 构建 OpenAI 兼容请求
4. 发送请求到 LLM
5. 解析响应（文本 / 工具调用）
6. 如有工具调用，执行工具并继续对话
7. 返回最终响应

## 前端节点模板

位置: \`client/src/features/flow/config/nodeTemplates.ts\`

\`\`\`typescript
component(
  'models_and_agents',
  'Agent',
  '智能体',
  '定义智能体指令、可用工具和输入内容。',
  'Bot',
  ['Agent'],
  {
    agent_model_config_id: field('agent_model_config_id', '选择模型', 'model_config', [], '10001', true),
    tools: field('tools', '工具', 'tools', ['Tool'], [], false, { tool_mode: true }),
    input_value: field('input_value', '输入', 'str', ['Message', 'Text'], '', true),
    system_prompt: field('system_prompt', '智能体指令', 'str', [], '你是一个有帮助的智能体，可以使用工具回答用户问题。'),
    add_current_date_tool: field('add_current_date_tool', '添加当前日期工具', 'bool', [], true),
  },
  [output('response', '响应', ['Message']), output('agent', '智能体', ['Agent'])]
)
\`\`\`

## 模型配置

智能体节点通过 \`agent_model_config_id\` 关联模型配置：

- 模型配置页面: \`/model-settings\`
- 后端接口: \`/modelConfig/list/enabled\`
- 支持厂商: OpenAI、Anthropic、Ollama、自定义

## 工具集成

智能体可以连接工具节点：

- 搜索工具（SearchTool）
- 检索工具（RetrieverTool）
- 自定义工具（PythonFunction）
- MCP 工具（通过 MCP Server）

工具通过 \`tools\` 字段连接，支持多个工具。

## 调试与测试

### 前端调试区

1. 在画布添加智能体节点
2. 配置模型和工具
3. 点击"调试运行"打开调试区
4. 输入测试消息
5. 查看响应和工具调用过程

### 后端测试

使用 Postman 或 Swagger 测试 \`/flow/run\` 接口：

\`\`\`json
{
  "nodes": [...],
  "edges": [...],
  "input": "测试消息"
}
\`\`\`

## 常见问题

### Q: 智能体与语言模型的区别？

A: 智能体支持工具调用和多轮对话，语言模型仅支持单次文本生成。

### Q: 如何添加工具？

A: 在画布添加工具节点，连接到智能体的"工具"输入点。

### Q: 支持哪些模型？

A: 所有 OpenAI 兼容模型（通过模型配置管理）。
`;

// 智能体 API 接口文档
const agentApiTemplate = `# 智能体相关 API 接口

## 工作流执行

### 运行工作流

**接口**: \`POST /flow/run\`

**请求体**:

\`\`\`json
{
  "nodes": [
    {
      "id": "node-1",
      "type": "Agent",
      "data": {
        "node": {
          "template": {
            "agent_model_config_id": { "value": "10001" },
            "tools": { "value": [] },
            "input_value": { "value": "你好" },
            "system_prompt": { "value": "你是一个有帮助的智能体" }
          }
        }
      }
    }
  ],
  "edges": [],
  "input": "用户输入"
}
\`\`\`

**响应**:

\`\`\`json
{
  "code": 0,
  "message": "ok",
  "data": {
    "flowId": "flow-123",
    "status": "success",
    "steps": [
      {
        "nodeId": "node-1",
        "nodeType": "Agent",
        "status": "success",
        "output": "智能体响应",
        "duration": 1500
      }
    ],
    "result": {
      "message": "智能体最终响应"
    }
  }
}
\`\`\`

## 模型配置

### 获取启用模型列表

**接口**: \`GET /modelConfig/list/enabled\`

**响应**:

\`\`\`json
{
  "code": 0,
  "message": "ok",
  "data": [
    {
      "id": 10001,
      "name": "GPT-4",
      "provider": "openai",
      "modelName": "gpt-4",
      "baseUrl": "https://api.openai.com/v1",
      "temperature": 0.7,
      "maxTokens": 2000
    }
  ]
}
\`\`\`

### 新增模型配置

**接口**: \`POST /modelConfig/add\`

**请求体**:

\`\`\`json
{
  "name": "自定义模型",
  "provider": "custom",
  "providerName": "自定义厂商",
  "modelName": "custom-model",
  "baseUrl": "https://api.example.com/v1",
  "apiKey": "sk-xxx",
  "temperature": 0.7,
  "maxTokens": 2000,
  "enabled": true
}
\`\`\`

## 工作流管理

### 保存工作流

**接口**: \`POST /workflow/save\`

**请求体**:

\`\`\`json
{
  "id": 1,
  "name": "智能体工作流",
  "description": "测试智能体功能",
  "graph": {
    "nodes": [...],
    "edges": [...]
  }
}
\`\`\`

### 获取工作流

**接口**: \`GET /workflow/get?id=1\`

**响应**:

\`\`\`json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": 1,
    "name": "智能体工作流",
    "graph": {
      "nodes": [...],
      "edges": [...]
    }
  }
}
\`\`\`
`;

// 智能体测试用例
const agentTestTemplate = `# 智能体测试用例

## 前端测试

### 1. 节点添加测试

- [ ] 从侧边栏拖拽智能体节点到画布
- [ ] 节点正确显示六区域结构
- [ ] 所有字段正确渲染（模型、工具、输入、指令、日期工具）
- [ ] 输出区显示"响应"和"智能体"两个输出

### 2. 模型配置测试

- [ ] 点击"选择模型"下拉框
- [ ] 正确加载已启用模型列表
- [ ] 选择模型后配置正确保存
- [ ] 切换模型后配置正确更新

### 3. 工具连接测试

- [ ] 添加搜索工具节点
- [ ] 连接工具到智能体的"工具"输入点
- [ ] 智能体节点显示"已连接 1 个工具"
- [ ] 断开工具后显示恢复为"连接工具"

### 4. 调试区测试

- [ ] 点击"调试运行"打开调试区
- [ ] 输入测试消息
- [ ] 按 Enter 发送消息
- [ ] 查看用户消息、运行中状态、响应消息
- [ ] 查看工具调用过程（如果有）
- [ ] 清空按钮清空调试消息
- [ ] 关闭按钮回到属性面板

## 后端测试

### 1. 单节点执行测试

**测试场景**: 智能体节点 + 聊天输入 + 聊天输出

**步骤**:
1. 构建包含三个节点的工作流
2. 调用 \`/flow/run\` 接口
3. 验证响应状态为 success
4. 验证输出包含智能体响应

### 2. 工具调用测试

**测试场景**: 智能体 + 搜索工具

**步骤**:
1. 构建包含智能体和搜索工具的工作流
2. 输入需要搜索的问题（如"今天天气"）
3. 验证智能体调用搜索工具
4. 验证最终响应包含搜索结果

### 3. 多轮对话测试

**测试场景**: 智能体 + 消息历史

**步骤**:
1. 构建包含智能体和消息历史的工作流
2. 发送第一条消息
3. 发送第二条消息（引用第一条）
4. 验证智能体记住上下文

### 4. 错误处理测试

**测试场景**: 模型配置无效

**步骤**:
1. 使用不存在的 model_config_id
2. 调用 \`/flow/run\` 接口
3. 验证返回错误信息
4. 验证错误码正确

## 集成测试

### 1. 完整工作流测试

**测试场景**: 用户输入 → 智能体 → 工具 → 输出

**步骤**:
1. 在前端构建完整工作流
2. 保存工作流
3. 在调试区测试
4. 验证端到端流程

### 2. 性能测试

**测试场景**: 大工作流执行

**步骤**:
1. 构建包含 20+ 节点的工作流
2. 执行工作流
3. 验证执行时间 < 30s
4. 验证内存占用正常

## 验收标准

- [ ] 所有前端测试通过
- [ ] 所有后端测试通过
- [ ] 所有集成测试通过
- [ ] 无 TypeScript 错误
- [ ] 无 ESLint 警告
- [ ] 代码覆盖率 > 80%
`;

function createFile(filePath, content) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`✓ 已创建: ${filePath}`);
}

function initAgentDocs() {
  console.log('🚀 开始初始化智能体文档...\n');

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];

  // 1. 智能体模块开发文档
  const agentModuleDoc = agentDocTemplate
    .replace(/{模块名称}/g, '智能体模块')
    .replace(/{模块目标描述}/g, '完成智能体节点的完整开发，包括前端节点模板、后端执行器、工具集成、模型配置等功能。')
    .replace(/{开始时间}/g, dateStr)
    .replace(/{结束时间}/g, dateStr);

  createFile(
    path.join(docsDir, '007-智能体模块.md'),
    agentModuleDoc
  );

  // 2. 智能体节点开发指南
  createFile(
    path.join(docsDir, '智能体节点开发指南.md'),
    agentNodeTemplate
  );

  // 3. 智能体 API 接口文档
  createFile(
    path.join(docsDir, '智能体API接口.md'),
    agentApiTemplate
  );

  // 4. 智能体测试用例
  createFile(
    path.join(docsDir, '智能体测试用例.md'),
    agentTestTemplate
  );

  console.log('\n✅ 智能体文档初始化完成！');
  console.log('\n生成的文档:');
  console.log('  - 007-智能体模块.md (模块开发计划)');
  console.log('  - 智能体节点开发指南.md (节点开发指南)');
  console.log('  - 智能体API接口.md (API 接口文档)');
  console.log('  - 智能体测试用例.md (测试用例)');
  console.log('\n📝 请根据实际需求修改文档内容。');
}

// 执行初始化
initAgentDocs();
