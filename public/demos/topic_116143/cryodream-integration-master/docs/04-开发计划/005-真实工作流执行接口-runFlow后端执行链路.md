# 005-真实工作流执行接口 / runFlow 后端执行链路

## 模块目标

将当前工作流调试区从“前端本地模拟执行”升级为“前端调用后端真实执行接口”。前端调试区继续作为用户入口，负责提交输入、展示运行状态和输出结果；后端新增 `runFlow` 执行链路，负责解析工作流节点、按连线顺序执行节点、调用模型配置、聚合输出，并返回可展示的执行结果。

本模块完成后，工作流设计器将从“能画、能配置、能模拟调试”推进到“能真实运行基础流程”。

## 当前状态

- 状态：开发中
- 进度：85%
- 计划开始时间：2026-06-15
- 最近更新时间：2026-06-15
- 负责人：SOLO

## 已具备基础

### 前端基础

- `/flow` 页面已经完成编辑器和右侧调试区分区。
- `WorkflowDebugPanel` 已支持：
  - 对话输入
  - Enter 发送
  - Shift + Enter 换行
  - 运行中状态
  - 用户消息、系统消息、输出消息、错误消息展示
- `useFlowDebugStore` 已管理调试区状态。
- `runFlowAdapter.ts` 当前是本地模拟执行入口，后续需要替换为真实 API 调用。
- 工作流节点数据可通过 `useFlowStore.saveFlow()` 导出。

### 后端基础

- 后端已有标准 Controller / Service / Mapper 分层。
- 模型配置模块已完成 CRUD。
- 模型配置表可提供模型厂商、模型名称、接口地址、API Key、温度、最大令牌数等信息。
- 可复用当前统一返回结构和分页/DTO/VO 组织方式。

## 范围边界

### 本阶段要做

- 新增后端工作流执行接口。
- 定义前后端 `runFlow` 请求和响应结构。
- 后端解析前端提交的节点和连线。
- 后端按基础规则识别并执行关键节点：
  - ChatInput / 聊天输入
  - PromptTemplate / 提示词模板
  - MessageHistory / 消息历史
  - LanguageModel / 语言模型
  - Agent / 智能体
  - ChatOutput / 聊天输出
- 语言模型节点读取模型配置。
- 先支持 OpenAI-compatible Chat Completions 风格请求。
- 前端调试区调用真实接口并展示结果。
- 保留本地模拟执行作为接口失败时的兜底或开发 fallback。

### 本阶段暂不做

- 不做完整 DAG 并发调度。
- 不做流式输出。
- 不做持久化会话历史。
- 不做 ComfyUI 执行。
- 不做复杂工具调用闭环。
- 不做多轮 agent planning。
- 不做公开 Playground 路由。

这些能力放到后续模块迭代。

## 接口设计

### 接口

```txt
POST /api/flow/run
```

### 请求结构

```json
{
  "flowId": "local-flow",
  "inputValue": "用户输入内容",
  "startNodeId": "node-id",
  "sessionId": "debug-session-id",
  "flow": {
    "nodes": [],
    "edges": [],
    "viewport": {}
  }
}
```

字段说明：

- `flowId`：当前流程 ID，没有保存时使用前端本地 ID。
- `inputValue`：调试区输入内容。
- `startNodeId`：优先传 ChatInput 节点 ID，没有则后端自动推断入口节点。
- `sessionId`：调试会话 ID，第一阶段可选。
- `flow`：当前画布完整数据，包括节点、连线和视口。

### 响应结构

```json
{
  "runId": "run-xxx",
  "status": "SUCCESS",
  "outputText": "最终输出内容",
  "messages": [
    {
      "role": "user",
      "content": "用户输入内容"
    },
    {
      "role": "assistant",
      "content": "模型输出内容"
    }
  ],
  "steps": [
    {
      "nodeId": "node-id",
      "nodeName": "语言模型",
      "nodeType": "LanguageModel",
      "status": "SUCCESS",
      "input": {},
      "output": {},
      "elapsedMs": 1200,
      "errorMessage": null
    }
  ],
  "errorMessage": null
}
```

## 后端设计

### 新增包结构

```txt
service/src/main/java/com/ice/template/controller/FlowRunController.java
service/src/main/java/com/ice/template/service/FlowRunService.java
service/src/main/java/com/ice/template/service/impl/FlowRunServiceImpl.java
service/src/main/java/com/ice/template/dto/flow/FlowRunRequest.java
service/src/main/java/com/ice/template/dto/flow/FlowGraphDTO.java
service/src/main/java/com/ice/template/dto/flow/FlowNodeDTO.java
service/src/main/java/com/ice/template/dto/flow/FlowEdgeDTO.java
service/src/main/java/com/ice/template/vo/flow/FlowRunResponse.java
service/src/main/java/com/ice/template/vo/flow/FlowRunStepVO.java
service/src/main/java/com/ice/template/executor/FlowGraphExecutor.java
service/src/main/java/com/ice/template/executor/FlowNodeExecutor.java
service/src/main/java/com/ice/template/executor/node/ChatInputNodeExecutor.java
service/src/main/java/com/ice/template/executor/node/PromptTemplateNodeExecutor.java
service/src/main/java/com/ice/template/executor/node/LanguageModelNodeExecutor.java
service/src/main/java/com/ice/template/executor/node/AgentNodeExecutor.java
service/src/main/java/com/ice/template/executor/node/ChatOutputNodeExecutor.java
service/src/main/java/com/ice/template/integration/llm/OpenAiCompatibleClient.java
```

### 执行链路

1. Controller 接收 `/api/flow/run` 请求。
2. Service 校验 flow、nodes、edges、inputValue。
3. 构建节点索引和连线索引。
4. 推断执行入口：
   - 优先使用 `startNodeId`。
   - 其次查找 `ChatInput`。
   - 再其次查找入度为 0 的节点。
5. 按连线关系生成执行顺序。
6. 逐节点执行：
   - ChatInput：输出用户输入消息。
   - PromptTemplate：输出模板文本。
   - MessageHistory：第一阶段直接透传消息历史占位。
   - LanguageModel：读取模型配置，调用 OpenAI-compatible 接口。
   - Agent：第一阶段按“模型 + 工具占位 + 指令”执行简化模型调用。
   - ChatOutput：选择最终输出。
7. 收集每个节点的 input、output、耗时、状态。
8. 返回最终输出和执行步骤。

### 节点执行上下文

```java
FlowExecutionContext
- runId
- inputValue
- sessionId
- nodeOutputs
- messages
- startTime
```

### 节点执行器接口

```java
public interface FlowNodeExecutor {
    boolean supports(String nodeType);
    FlowNodeExecuteResult execute(FlowNodeDTO node, FlowExecutionContext context);
}
```

### 模型调用策略

第一阶段只支持 OpenAI-compatible Chat Completions：

- 使用模型配置中的 `baseUrl`。
- 使用模型配置中的 `apiKey`。
- 使用模型配置中的 `model`。
- 使用节点里的温度、最大令牌数覆盖配置。
- 使用 `system_message` 作为 system 消息。
- 使用输入内容作为 user 消息。

如果模型配置不存在、未启用或缺少必要字段，返回明确错误。

## 前端设计

### 新增 API 文件

```txt
client/src/features/flow/api/run-flow.ts
```

职责：

- 封装 `POST /api/flow/run`。
- 定义请求和响应 TypeScript 类型。
- 保持与后端 DTO/VO 字段一致。

### 改造 runFlowAdapter

当前：

```txt
runFlowAdapter.ts -> 本地模拟执行
```

改造后：

```txt
runFlowAdapter.ts
- 优先调用 runFlow API
- API 调用成功：返回真实输出
- API 调用失败：展示错误，可选择是否 fallback 到本地模拟
```

### 调试区展示

`WorkflowDebugPanel` 继续使用当前消息列表结构，但输出内容改为后端返回结果：

- `outputText` 显示为流程输出。
- `steps` 以文本或折叠块形式展示。
- 错误时展示 `errorMessage`。

## 数据兼容

前端节点数据来自 React Flow，后端第一阶段只依赖以下字段：

```txt
node.id
node.type
node.data.type
node.data.node.type
node.data.node.display_name
node.data.node.template
node.data.values
edge.source
edge.target
edge.sourceHandle
edge.targetHandle
```

如果某些字段不存在，后端需要兼容 `data.node.template` 的默认值和 `data.values` 的覆盖值。

## 错误处理

需要明确返回以下错误：

- 画布没有节点。
- 未找到入口节点。
- 节点类型不支持。
- 节点参数缺失。
- 模型配置不存在。
- 模型配置未启用。
- 模型 API Key 为空。
- 模型接口调用失败。
- 工作流连线存在环或无法排序。

错误信息必须能直接展示在调试区。

## 开发步骤

1. 创建模块计划文档。
2. 后端新增 FlowRun DTO / VO。
3. 后端新增 `FlowRunController` 和 `FlowRunService`。
4. 后端实现 `FlowGraphExecutor`，完成节点索引、入口推断、执行顺序和步骤记录。
5. 后端实现基础节点执行器：ChatInput、PromptTemplate、ChatOutput。
6. 后端实现模型配置读取和 LanguageModel 执行器。
7. 后端实现 Agent 简化执行器。
8. 前端新增 `run-flow.ts` API 封装。
9. 前端改造 `runFlowAdapter` 调用真实接口。
10. 前端调试区展示后端 steps 和 outputText。
11. 增加错误展示和本地模拟 fallback。
12. 前端构建验证。
13. 后端编译验证。
14. 更新模块进度。

## 验收标准

- 前端调试区点击运行会请求后端 `/api/flow/run`。
- 后端能接收当前画布 flow 数据。
- 没有节点时返回明确错误。
- 有 ChatInput、LanguageModel、ChatOutput 时能走通真实执行链路。
- LanguageModel 能读取模型配置。
- 模型配置异常时能返回明确错误。
- 调试区能展示最终输出。
- 调试区能展示节点执行步骤。
- 调试区能展示后端错误。
- 前端保留本地模拟 fallback。
- 前端 `npm run build` 通过。
- 后端 Maven 编译通过。

## 风险与处理

### 模型接口兼容风险

不同厂商 OpenAI-compatible 接口字段可能不完全一致。第一阶段先按标准 Chat Completions 实现，后续再按厂商做适配。

### 节点图执行复杂度风险

完整 DAG 调度和并发执行复杂度较高。第一阶段只做顺序执行和基础拓扑排序，先满足调试链路。

### 工具 / Skills 调用风险

语言模型和智能体已经有工具参数，但真实工具调用涉及函数调用协议和工具执行沙箱。第一阶段只保留工具参数解析和步骤展示，不做真实工具调用。

### 会话历史风险

旧项目支持 session 和历史消息。当前第一阶段只返回本次运行消息，不持久化历史；后续再做调试会话模块。

## 本次开发进展

### 已完成

- 后端新增 `/api/flow/run` 执行接口。
- 后端新增 FlowRun 请求 DTO、响应 VO、执行上下文和步骤结构。
- 后端新增 `FlowGraphExecutor`，支持入口推断、连线遍历和节点执行步骤记录。
- 后端新增 ChatInput、PromptTemplate、MessageHistory、LanguageModel、Agent、ChatOutput 基础节点执行器。
- 后端新增 OpenAI-compatible Chat Completions 客户端，语言模型节点和智能体节点可读取模型配置发起调用。
- 前端新增 `client/src/features/flow/api/run-flow.ts`，封装真实 runFlow API。
- 前端改造 `runFlowAdapter.ts`，优先调用真实接口，失败时自动回退本地模拟执行。
- 前端调试区文案已调整为真实执行优先。
- 后端节点字段读取已兼容 `data.values`、`data.node.values` 和 `data.node.template.*.value`。

### 验证记录

- `client`：`npm run build` 通过。
- `service`：`.\\mvnw.cmd -DskipTests package` 通过。
- `service`：`.\\mvnw.cmd test` 未通过，失败点来自既有测试环境，包括 `post` 表缺失和 COS 测试文件问题。
- `client`：`npm run lint` 未通过，失败点来自既有文件中的 `console`、`any` 和 type import 规则问题，本次新增 flow 文件未出现在 lint 错误列表中。

### 剩余事项

- 用真实模型配置和真实画布流程做一次端到端联调。
- 根据真实联调结果决定是否将模块状态更新为 completed。

## 后续扩展

- 流式输出。
- 调试会话历史持久化。
- 节点级运行状态上色。
- 工具 / Skills 真实调用。
- 文件输入和图片输入。
- ComfyUI 节点执行。
- 公开 Playground 页面。
