# 隐私政策 / Privacy Policy

**最后更新日期 / Last Updated**: 2025年1月

---

## 中文版

### 1. 引言

感谢您使用 AI Prompt Manager（以下简称"本扩展"或"我们"）。本隐私政策旨在帮助您了解我们收集、使用和存储数据的方式。

**重要声明**：本扩展是一款浏览器扩展程序，所有数据均存储在您的本地浏览器中，不会上传至我们的服务器。我们不会收集、传输或出售您的任何个人数据。

### 2. 数据收集范围

本扩展收集并存储以下数据，所有数据均保存在您的浏览器本地存储（`chrome.storage.local`）中：

| 数据类型 | 说明 | 存储位置 |
|---------|------|---------|
| **提示词内容** | 您创建的提示词标题、内容和分类 | 本地浏览器 |
| **分类配置** | 自定义分类名称和排序 | 本地浏览器 |
| **网站列表** | 启用悬浮图标的网站域名 | 本地浏览器 |
| **AI 配置** | AI 提供商、模型名称、Base URL、API Key | 本地浏览器 |
| **界面状态** | 悬浮按钮位置、分类筛选状态 | 本地浏览器 |

### 3. 数据存储方式

- **本地存储**：所有数据使用 Chrome/Edge 浏览器提供的 `chrome.storage.local` API 存储，数据仅存在于您的设备上。
- **不加密**：API Key 等敏感信息以明文形式存储在本地。请确保您的设备安全，避免他人访问您的浏览器。
- **不同步**：数据不会同步到云端或其他设备（除非您启用了浏览器自带的同步功能）。

### 4. 数据传输情况

| 传输场景 | 接收方 | 数据内容 |
|---------|--------|---------|
| **AI 生成提示词** | 您配置的 AI 提供商（如 OpenAI、Anthropic 等） | 您输入的需求描述 |
| **API 连通性检测** | 您配置的 AI 提供商 | 最小化测试请求 |

**重要**：
- 上述传输仅在您主动使用"AI 生成提示词"功能时发生
- 请求直接从您的浏览器发送至 AI 提供商的服务器
- 我们不充当中间人，不会拦截、存储或转发您的请求

### 5. 第三方服务

本扩展支持调用以下第三方 AI 服务（需您自行配置 API Key）：

**国际服务**：OpenAI、Anthropic、DeepSeek

**国内服务**：通义千问（阿里云）、豆包（火山引擎）、智谱、Moonshot、零一万物、百川、阶跃星辰、MiniMax

使用这些服务时，您的数据将受各自服务提供商的隐私政策约束。建议您查阅相关服务提供商的隐私政策。

### 6. 数据删除

您可以通过以下方式删除数据：
- 在扩展设置中删除单个提示词或分类
- 在扩展设置中点击"重置所有数据"
- 在浏览器扩展管理页面移除本扩展（将删除所有本地数据）

### 7. 儿童隐私

本扩展不面向 13 岁以下儿童。我们不会故意收集儿童的个人信息。

### 8. 隐私政策更新

我们可能会不时更新本隐私政策。更新后的政策将在本页面发布，届时我们将更新"最后更新日期"。

### 9. 联系我们

如有任何隐私相关问题，请联系：
- **Email**: hetaoist@outlook.com
- **GitHub Issues**: [https://github.com/hetaoist/ai-prompt-manager/issues](https://github.com/hetaoist/ai-prompt-manager/issues)

---

## English Version

### 1. Introduction

Thank you for using AI Prompt Manager (hereinafter referred to as "this extension" or "we"). This privacy policy is designed to help you understand how we collect, use, and store data.

**Important Notice**: This extension is a browser extension. All data is stored locally in your browser and will not be uploaded to our servers. We do not collect, transmit, or sell any of your personal data.

### 2. Data Collection

This extension collects and stores the following data, all saved in your browser's local storage (`chrome.storage.local`):

| Data Type | Description | Storage Location |
|-----------|-------------|------------------|
| **Prompt Content** | Titles, content, and categories of prompts you create | Local browser |
| **Category Config** | Custom category names and order | Local browser |
| **Site List** | Website domains where floating button is enabled | Local browser |
| **AI Config** | AI provider, model name, Base URL, API Key | Local browser |
| **UI State** | Floating button position, category filter state | Local browser |

### 3. Data Storage

- **Local Storage**: All data is stored using the `chrome.storage.local` API provided by Chrome/Edge browser. Data exists only on your device.
- **Not Encrypted**: Sensitive information like API Key is stored in plaintext locally. Please ensure your device is secure.
- **Not Synced**: Data is not synced to cloud or other devices (unless you have enabled browser's built-in sync feature).

### 4. Data Transmission

| Scenario | Recipient | Data Content |
|----------|-----------|--------------|
| **AI Generate Prompt** | AI provider you configured (e.g., OpenAI, Anthropic) | Your input description |
| **API Connectivity Test** | AI provider you configured | Minimal test request |

**Important**:
- The above transmission only occurs when you actively use the "AI Generate Prompt" feature
- Requests are sent directly from your browser to the AI provider's servers
- We do not act as an intermediary and will not intercept, store, or forward your requests

### 5. Third-Party Services

This extension supports calling the following third-party AI services (requires your own API Key):

**International**: OpenAI, Anthropic, DeepSeek

**Chinese**: Qwen (Alibaba), Doubao (Volcengine), Zhipu, Moonshot, Yi, Baichuan, Stepfun, MiniMax

When using these services, your data is subject to the privacy policies of the respective service providers.

### 6. Data Deletion

You can delete data by:
- Deleting individual prompts or categories in extension settings
- Clicking "Reset All Data" in extension settings
- Removing this extension from browser extension management page (will delete all local data)

### 7. Children's Privacy

This extension is not intended for children under 13. We do not knowingly collect personal information from children.

### 8. Policy Updates

We may update this privacy policy from time to time. Updated policies will be published on this page with an updated "Last Updated" date.

### 9. Contact Us

For any privacy-related questions, please contact:
- **Email**: hetaoist@outlook.com
- **GitHub Issues**: [https://github.com/hetaoist/ai-prompt-manager/issues](https://github.com/hetaoist/ai-prompt-manager/issues)
