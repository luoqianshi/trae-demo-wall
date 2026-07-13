# 智能体相关 API 接口

## 工作流执行

### 运行工作流

**接口**: `POST /flow/run`

**请求体**:

```json
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
```

**响应**:

```json
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
```

## 模型配置

### 获取启用模型列表

**接口**: `GET /modelConfig/list/enabled`

**响应**:

```json
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
```

### 新增模型配置

**接口**: `POST /modelConfig/add`

**请求体**:

```json
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
```

## 工作流管理

### 保存工作流

**接口**: `POST /workflow/save`

**请求体**:

```json
{
  "id": 1,
  "name": "智能体工作流",
  "description": "测试智能体功能",
  "graph": {
    "nodes": [...],
    "edges": [...]
  }
}
```

### 获取工作流

**接口**: `GET /workflow/get?id=1`

**响应**:

```json
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
```
