# API 模型测速台

对兼容 OpenAI API 格式的大语言模型接口进行并发测速，测量 **TTFT**（首 Token 延迟）、**TPS**（每秒输出 Token 数）、总耗时和成功率等关键性能指标。

## 功能

- **并发测速**：同时发起 N 次流式请求，取中位数统计
- **关键指标**：TTFT、TPS、总耗时、成功率、错误分布
- **实时进度**：进度条 + 逐条结果渲染
- **错误分类**：超时、限流(429)、认证失败(401/403)、其他错误
- **历史记录**：SQLite 持久化，支持筛选、对比图表、批量重测
- **模拟数据**：内置模拟数据生成脚本，用于测试对比图表和筛选功能
- **URL 自动补全**：Base URL 无需手动添加 `/chat/completions`，后端自动拼接

## 使用

### 启动后端

```bash
cd api-speed-test
python app.py
```

默认监听 `http://localhost:8080`，可通过环境变量 `PORT` 修改端口。

### 填写配置

打开浏览器访问 `http://localhost:8080`，填写：

| 字段 | 说明 | 示例 |
|------|------|------|
| **Base URL** | API 地址（无需加 `/chat/completions`） | `https://ark.cn-beijing.volces.com/api/plan/v3` |
| **API Key** | 认证密钥 | `sk-...` |
| **模型名称** | 模型 ID | `gpt-4o`、`ark-code-latest` |
| **测试消息** | 发送给模型的 Prompt | `任意输出100字` |
| **并发次数** | 同时发起的请求数（1-20，默认 5） | `5` |
| **超时** | 单次测试最大等待时间（秒） | `60` |

点击 **开始测速**，等待结果。

### 结果说明

- 汇总卡片展示 TTFT、TPS、总耗时、成功率的中位值
- 详情表格列出每次请求的完整指标
- 错误分布显示超时、限流、认证失败等分类计数
- 历史记录保存在 SQLite 数据库，支持筛选和对比图表

### 模拟数据

项目内置了模拟数据生成脚本，用于填充示例数据以测试对比图表和筛选功能：

```bash
python seed_data.py
```

模拟数据写入 `seed_history` 表，与实际的 `history` 表完全隔离，互不影响。前端"模拟数据"面板可查看、筛选和清空模拟数据。

## 技术

- **后端**：Python Flask，提供静态文件服务和 API 代理转发
- **前端**：纯 HTML + CSS + JavaScript（ES2020+）
- **API 通信**：`fetch` + `ReadableStream` 解析 SSE 流式响应
- **数据持久化**：SQLite（`history.db`），分 `history`（实际数据）和 `seed_history`（模拟数据）两张表
- **兼容性**：OpenAI 流式 API 格式（`stream: true` + `stream_options: { include_usage: true }`）

### 为什么需要后端？

大多数商业 API（如火山引擎、OpenAI 等）不支持浏览器端跨域请求（CORS）。后端作为代理转发请求，解决跨域限制，同时自动补全 URL 路径。

## 指标说明

| 指标 | 说明 |
|------|------|
| **TTFT** | Time To First Token，从请求发出到收到第一个 Token 的时间 |
| **TPS** | Tokens Per Second，生成阶段每秒输出的 Token 数 |
| **总耗时** | 从请求发出到完整响应接收完毕的总时间 |
| **成功率** | 成功请求数 / 总请求数 |
