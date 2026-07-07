# 智救眼 AI-RescueEye Demo

智救眼是一个 AI 急救指导 Web 应用，让普通人在意外发生时拍照即可获得权威急救指导。

## 文件结构

```
ai-rescue-eye/
├── index.html              # 主应用（拍照识别 + 手动选择）
├── ai-rescue-eye.html      # 展示页面
├── assets/                 # 图片资源
├── data/
│   └── first-aid.json      # 急救知识库（10 种场景）
└── proxy/
    └── api_proxy.py         # API 代理（解决跨域问题）
```

## 快速开始

### 方式一：纯前端体验（无需配置）

直接双击打开 `index.html` 即可使用**手动选择模式**体验完整功能。

AI 识别功能需要配置 API Key（见下文）。

### 方式二：完整功能体验

#### 1. 配置 API Key

**获取通义千问 API Key：**
1. 访问 [阿里云 DashScope](https://dashscope.console.aliyun.com/)
2. 注册/登录后创建 API Key

**设置环境变量：**

```bash
# Windows CMD
set DASHSCOPE_API_KEY=sk-xxxxxxxxxxxxxxxx

# Windows PowerShell
$env:DASHSCOPE_API_KEY="sk-xxxxxxxxxxxxxxxx"

# macOS / Linux
export DASHSCOPE_API_KEY=sk-xxxxxxxxxxxxxxxx
```

#### 2. 安装依赖

```bash
cd ai-rescue-eye/proxy
pip install flask requests
```

#### 3. 启动代理

```bash
cd ai-rescue-eye/proxy
set DASHSCOPE_API_KEY=sk-xxxxxxxxxxxxxxxx
python api_proxy.py
```

代理启动后会显示：
```
启动智救眼 API 代理...
代理地址: http://localhost:5000
识别接口: http://localhost:5000/api/recognize
```

#### 4. 打开应用

在浏览器中打开 `index.html`（或启动一个本地 HTTP 服务器）。

如果看到"API 识别服务未配置"的提示，说明代理未启动或连接失败。

## 功能说明

### 拍照识别
1. 点击上传区域选择图片（或拍照）
2. 点击"开始识别"
3. AI 会分析图片并返回伤情类别和置信度
4. 系统从知识库匹配对应的急救步骤

### 手动选择
如果 AI 识别不可用或结果不准确，可以使用手动选择模式：
1. 切换到"手动选择"标签
2. 点击对应的伤情类别
3. 系统会直接显示对应的急救步骤

### 安全机制
- **高危伤情**（心脏骤停、气道异物、溺水）会显示红色警告
- **低置信度**（<60%）会自动提示就医
- **所有急救指导**都标注了知识来源

## 急救知识库覆盖

| 类别 | 严重程度 | 说明 |
|------|----------|------|
| 出血 | 高 | 割伤、擦伤等 |
| 烧烫伤 | 高 | 火焰、热液、化学灼伤 |
| 骨折/扭伤 | 中 | 跌打损伤 |
| 气道异物 | 危急 | 哽噎窒息 |
| 心脏骤停 | 危急 | 需要心肺复苏 |
| 中暑 | 高 | 高温环境下 |
| 溺水 | 危急 | 水中窒息 |
| 鼻出血 | 低 | 常见止血 |
| 犬咬伤 | 中 | 动物咬伤 |
| 蛇咬伤 | 高 | 毒蛇咬伤 |

## 常见问题

**Q: 提示"API Key 未配置"？**
A: 需要启动 `proxy/api_proxy.py` 并设置 `DASHSCOPE_API_KEY` 环境变量。

**Q: API 调用失败？**
A: 检查网络连接、API Key 是否有效、代理是否正常运行。

**Q: 识别结果不准确？**
A: 可以使用手动选择模式作为备选。AI 识别仅供参考，不作为医疗依据。

## 技术说明

- **前端**：纯 HTML/CSS/JS，无外部依赖
- **AI 模型**：通义千问 VL（qwen-vl-plus）
- **知识库**：JSON 文件，可扩展
- **跨域解决**：Python Flask 代理

## 注意事项

1. 本应用仅供 Demo 展示，识别结果仅供参考
2. 紧急情况请立即拨打 120
3. 所有急救指导来源为中国红十字会、AHA 等权威机构
