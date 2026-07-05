# Nutritionist AI · 中西医结合版

> 你的AI营养师 —— 像聊天一样管理健康。中西医结合，个性化营养方案。

## 🌟 功能特性

- **零表单建档** - 自然语言对话，AI自动提取健康信息
- **体检报告识别** - 上传PDF/图片，AI分析关键指标
- **AI即引擎** - 营养计算、方案编排全由AI完成
- **中西医结合** - 西医营养素+中医食疗双轨推荐
- **三人设切换** - 专业/闺蜜/硬汉，随心选择
- **安全边界** - 仅限营养建议，异常提示就医

## 🚀 快速开始

### 一键启动（推荐）

双击运行 `start-demo.bat`：
- 自动检测 Ollama 并启动 AI 服务
- 自动启动 Web 服务器（无缓存，支持局域网访问）
- 自动打开浏览器访问应用
- 按任意键关闭所有服务

### 手动启动

```bash
# 使用自带 no-cache 服务器
python server.py

# 或使用标准 HTTP 服务器
python -m http.server 8080
```

访问 http://localhost:8080/nutritionist-ai.html

### 离线模式（真实 AI）

1. 安装 [Ollama](https://ollama.com/)
2. 重新运行 `start-demo.bat`，脚本会自动检测并启动 AI 服务
3. 或手动：`ollama serve`，然后在应用设置中配置 Ollama 地址

## 📁 项目结构

```
nutritionist-ai/
├── nutritionist-ai.html    # 主应用入口
├── manifest.json           # PWA配置
├── service-worker.js       # Service Worker缓存
├── lib/                    # 本地化前端资源
│   ├── vue.global.js       # Vue 3 运行时
│   └── tailwindcss.js      # Tailwind CSS
├── prompts/                # 人设提示词文件
│   ├── professional.txt    # 专业营养师
│   ├── fun.txt             # 闺蜜人设
│   └── coach.txt           # 硬汉教练
├── assets/                 # 静态资源
├── icon-*.png              # PWA图标
└── screenshot-*.png        # PWA截图
```

## 🎯 健康场景

应用支持以下健康场景：

- 💤 **睡眠改善** - 失眠、夜醒、疲劳、腿抽筋
- ⚖️ **体重管理** - 体重增加、腹部肥胖、食欲旺盛
- ❤️ **三高调理** - 血压偏高、血脂异常、血糖问题
- 🩸 **贫血调理** - 头晕、手脚冰凉、面色苍白
- 🍎 **消化健康** - 胃胀、早饱、反酸、大便不规律
- 🌟 **皮肤健康** - 痤疮频发、出油多、痘印难消
- 🛡️ **免疫力提升** - 易感冒、病程长、持续疲劳

## 🛡️ 安全边界

应用严格遵守以下安全原则：

1. ❌ **严禁诊断疾病** - 任何情况下都不能说"你患有XX病"
2. ❌ **严禁替代医疗** - 不能建议用户停止服用处方药
3. ⚠️ **异常指标提醒** - 遇到明显异常必须明确建议就医
4. ⚠️ **用药安全** - 推荐补充剂时提醒咨询医生或药师
5. ❌ **严禁承诺疗效** - 不能说"保证治愈"等绝对化表述

## 🔧 技术栈

- **前端框架**: Vue 3 (Composition API)
- **样式**: Tailwind CSS 3
- **状态管理**: Vue 3 reactive/ref
- **离线存储**: localStorage
- **PWA**: Service Worker + Manifest
- **AI集成**: Ollama API / OpenAI API

## 📱 PWA支持

应用已配置为可安装的PWA：

- 支持离线使用（需配置Ollama）
- 可添加到主屏幕
- 支持快捷方式
- 响应式设计，适配移动端

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交Issue和Pull Request！