# StarKey - 孤独症儿童社交训练小助手

> 专为孤独症谱系（阿斯伯格）儿童设计的社交情景训练应用，基于孩子的特殊兴趣生成个性化社交故事练习题。

## ✨ 项目特点

- 🎮 **兴趣驱动**：围绕孩子感兴趣的主题（地铁、恐龙、乐高、天文、动物等）生成社交情景
- 🧩 **分级训练**：4大训练主题 × 3个难度等级，循序渐进
- 🎨 **像素风格**：可爱的像素小人 + 地铁图场景，视觉友好
- 🏆 **成长激励**：答题升级、奖章奖励、皮肤收集
- 📚 **本地题库**：73道预置题，演示模式稳定运行，无需网络

## 🎯 训练主题

| 主题 | 说明 |
|------|------|
| 看懂心情 | 识别他人情绪、理解表情和动作 |
| 轮流玩 | 轮流对话、等待、团队配合 |
| 看懂表情和动作 | 主动发起聊天、分享兴趣 |
| 遇到不开心的时候 | 应对冲突、接受变化、处理失误 |

## 🎮 难度等级

- **轻松**：情景直接，社交线索明显
- **中等**：情景稍复杂，人物有情绪变化
- **挑战**：情景复杂，需要读懂微妙的语气和表情

## 🚀 快速开始

### 环境要求

- Node.js >= 18
- npm

### 安装依赖

```bash
npm install
```

### 演示模式（推荐比赛用）

无需 ARK API Key，直接使用本地题库：

```bash
# 设置环境变量（或在 .env.local 中添加）
DEMO_MODE=true

# 构建并启动
npm run build
npm run start
```

打开 http://localhost:3000 即可使用。

### ARK API 模式

需要火山方舟 ARK API Key：

```bash
# 在 .env.local 中配置
ARK_API_KEY=你的_api_key
ARK_MODEL=doubao-seed-2-0-mini-260428

# 启动
npm run dev
```

### 开发模式

```bash
npm run dev
```

## 📚 题库说明

### 题库位置

`app/data/scenarios.json`

### 题库规模

共 **73 道题**，覆盖 14 个兴趣主题：

| 兴趣 | 题数 |
|------|------|
| 地铁 | 12 |
| 恐龙 | 12 |
| 乐高 | 10 |
| 海洋 | 11 |
| 风扇 | 3 |
| 天文 | 3 |
| 篮球 | 3 |
| 绘画 | 3 |
| 动物 | 3 |
| 机器人 | 3 |
| 音乐 | 3 |
| 汽车 | 3 |
| 太空 | 3 |
| 游戏 | 3 |

### 题目字段

```json
{
  "scene": "情景描述",
  "question": "问题",
  "sceneIcon": "😀",
  "options": [
    { "text": "选项A", "icon": "😊", "isRecommended": true, "feedback": "反馈" },
    { "text": "选项B", "icon": "🤔", "isRecommended": false, "feedback": "反馈" },
    { "text": "选项C", "icon": "😟", "isRecommended": false, "feedback": "反馈" }
  ],
  "skillTag": "技能标签",
  "socialRule": "社交规则（8-35字，以句号结尾）",
  "parentTip": "家长指导建议",
  "interest": "兴趣主题",
  "topic": "训练主题",
  "difficulty": "easy / medium / hard"
}
```

## 🏗️ 技术栈

- **框架**：Next.js 15 (App Router)
- **语言**：TypeScript
- **样式**：CSS Modules
- **AI**：火山方舟 ARK API（可选）

## 📁 项目结构

```
starkey-demo/
├── app/
│   ├── api/generate/route.ts   # API 路由
│   ├── data/scenarios.json     # 本地题库
│   ├── page.tsx                 # 主页面
│   ├── globals.css              # 全局样式
│   └── layout.tsx               # 布局
├── components/                   # UI 组件
│   ├── Screen1Interest.tsx      # 兴趣选择
│   ├── Screen2Scenario.tsx      # 答题屏
│   ├── Screen3Feedback.tsx      # 反馈屏
│   ├── SubwayMap.tsx            # 地铁图
│   ├── PixelCharacter.tsx       # 像素小人
│   └── ...
├── types/                        # 类型定义
├── public/                       # 静态资源
└── package.json
```

## 🔧 API 接口

### POST /api/generate

生成一道社交情景练习题。

**请求体：**

```json
{
  "interest": "地铁",
  "topic": "看懂心情",
  "difficulty": "medium",
  "sceneIndex": 0
}
```

**响应：**

```json
{
  "success": true,
  "data": { /* 题目数据 */ },
  "source": "local",
  "usedInterest": "地铁",
  "originalInterest": "地铁",
  "topic": "看懂心情",
  "difficulty": "medium",
  "totalScenarios": 12,
  "sceneIndex": 0
}
```

**source 字段说明：**

| 值 | 说明 |
|----|------|
| `ark` | AI 实时生成 |
| `local` | 本地题库（scenarios.json） |
| `pregen` | 预置题库（EXTENDED_SCENARIOS） |
| `generic-fallback` | 通用兜底 |

## 🎮 使用说明

1. 在首页输入或选择孩子感兴趣的主题
2. 选择训练主题和难度
3. 点击"开始练习"进入答题
4. 阅读情景，选择最合适的做法
5. 查看反馈和社交规则
6. 继续下一题或返回设置

## 📝 版本历史

### v2-competition-demo

- 扩展本地题库至 73 题，覆盖 14 个兴趣
- 新增 DEMO_MODE 演示模式，稳定不依赖网络
- 优化 topic/difficulty 精确匹配逻辑
- 修复像素小人显示问题
- 新增皮肤系统和奖章奖励

### v1-competition-demo

- 基础版，49 题题库
- ARK API 模式 + 本地 fallback

## ⚠️ 注意事项

- 本应用为社交训练辅助工具，**不构成医疗建议**
- 不能替代专业的诊断、治疗或干预
- 建议在家长或老师陪同下使用
- 如有疑问请咨询专业医生或特教老师

## 📄 License

MIT
