# 图片侦探 - 全模态AI图片深度分析系统

基于Node.js的图片深度分析系统，使用OpenAI兼容的多模态AI模型进行分步深度分析。

## 功能特点

### 核心分析维度
- 🌍 **地理位置识别** - 推测图片拍摄地点、地标、坐标
- 🌤️ **天气时间推断** - 根据地理位置推断天气和时间
- 🏠 **场景理解** - 分析场景类型、用途、特征、氛围
- 👤 **人物信息分析** - 识别人数、描述、活动、情绪、关系
- 📦 **物体检测** - 识别主要物体、描述、品牌、类别
- 📝 **文字提取** - OCR识别图片中的文字和标识
- 💭 **情感分析** - 分析氛围、艺术风格、文化背景
- ⚙️ **技术参数** - 推测拍摄设备、分辨率、格式

### 智能分析
- 📊 **全景描述** - 基于所有分析结果生成综合描述
- 🎯 **拍摄意图** - 分析拍摄目的、使用场景、图片故事
- 🔗 **联网获取** - 根据地理位置获取天气等实时信息

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置API

编辑 `config.json` 文件，填写你的API配置：

```json
{
  "server": {
    "port": 3000,
    "host": "localhost"
  },
  "api": {
    "endpoint": "https://api.openai.com/v1/chat/completions",
    "apiKey": "sk-your-api-key-here",
    "model": "gpt-4o",
    "maxTokens": 4096,
    "temperature": 0.7
  }
}
```

**配置说明：**

| 字段 | 说明 | 示例 |
|------|------|------|
| `endpoint` | OpenAI兼容的API地址 | `https://api.openai.com/v1/chat/completions` |
| `apiKey` | API密钥（以sk-开头） | `sk-xxxxxxxxxxxxxxxx` |
| `model` | 模型名称（必须支持图片识别） | `gpt-4o`, `gpt-4o-mini` |
| `maxTokens` | 最大token数 | `4096` |
| `temperature` | 温度参数（0-1） | `0.7` |

### 3. 启动服务器

```bash
npm start
```

或者：

```bash
node server.js
```

### 4. 访问应用

打开浏览器访问：`http://localhost:3000`

## 系统要求

- Node.js 14.0 或更高版本
- npm 或 yarn
- 有效的OpenAI API密钥（或其他兼容API）

## 项目结构

```
img-detective/
├── server.js          # 服务端主文件
├── config.json        # API配置文件
├── package.json       # 项目配置
└── public/            # 前端静态文件
    └── index.html     # 前端页面
```

## 配置验证

启动时系统会自动验证配置：

1. ✅ 检查配置文件是否存在
2. ✅ 验证必要的配置项（endpoint, apiKey, model）
3. ✅ 测试API连接是否正常

如果配置有问题，控制台会显示详细的错误信息。

## 常见问题

### 1. 启动报错：配置文件错误

确保 `config.json` 文件存在且格式正确，所有必要的字段都已填写。

### 2. 启动报错：API连接失败

- 检查API密钥是否正确
- 检查API地址是否正确
- 确保网络可以访问API服务器

### 3. 分析时报错

- 确保使用的模型支持图片识别（如gpt-4o）
- 检查图片大小是否过大

## 支持的模型

以下模型支持图片识别：

- GPT-4o
- GPT-4o Mini
- Claude 3 Opus
- Claude 3 Sonnet
- Claude 3 Haiku
- 其他OpenAI兼容的多模态模型

## 注意事项

1. API密钥会保存在配置文件中，请确保不要泄露
2. 大图片分析可能需要较长时间
3. 建议使用支持图片识别的多模态模型
