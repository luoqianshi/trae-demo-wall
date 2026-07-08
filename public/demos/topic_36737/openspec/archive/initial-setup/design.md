# Design Document

## 系统架构

```
┌─────────────────────┐
│   微信小程序         │
│  pages/chat/chat    │ ← 聊天式单页交互
│  (WXML/WXSS/JS)    │
└──────────┬──────────┘
           │ HTTP
┌──────────▼──────────┐
│   FastAPI Server     │
│   main.py            │
│   ├── /api/recommend │──▶ llm_service.py ──▶ DeepSeek/Qwen API
│   ├── /api/dishes    │──▶ database.py ──▶ SQLite (dishes)
│   ├── /api/history   │──▶ database.py ──▶ SQLite (order_history)
│   ├── /api/health    │
│   └── /static/images │──▶ 菜品图片（40张占位图）
└─────────────────────┘
```

## LLM Prompt 模板

```python
RECOMMEND_PROMPT = """你是"寻味岭南"粤菜点餐助手。根据用户的用餐需求，从菜品库中推荐最合适的菜品。

## 菜品库
{dishes_json}

## 输出要求
严格输出JSON，不要markdown代码块，不要其他文字：
{{
  "summary": "<一句话总结推荐结果>",
  "recommended_dishes": [
    {{
      "dish_id": <菜品id>,
      "name": "<菜名>",
      "reason": "<推荐理由，20字以内>"
    }}
  ]
}}

## 规则
1. 只从菜品库中选择，禁止编造
2. 推荐菜品总价不超过预算上限
3. 优先匹配口味偏好和类别
4. reason 简短有吸引力，体现岭南饮食文化特色

用户需求：{user_input}"""
```

## Fallback 策略

当 LLM 不可用时，降级为规则匹配：
1. 关键词提取（正则匹配人数/预算/口味）
2. 按 category + tags 过滤菜品
3. 按价格排序取前 N 道

## 目录结构

```
yuecai-assistant/
├── main.py              # FastAPI 入口 + CORS + 静态文件
├── database.py          # SQLite 封装（dishes + order_history）
├── llm_service.py       # LLM 意图解析 + fallback 规则匹配
├── init_db.py           # 数据库初始化 + 导入 dishes.json
├── dishes.json          # 40道经典粤菜数据（含真实价格）
├── requirements.txt     # Python 依赖
├── setup.bat            # 一键安装启动脚本
├── yuecai.db            # SQLite 数据库文件（运行时生成）
├── static/images/       # 40张菜品占位图（渐变底色+菜名）
├── miniprogram/         # 微信小程序源码
│   ├── app.js           # 全局逻辑 + baseUrl 配置
│   ├── app.json         # 页面路由（仅 pages/chat/chat）
│   ├── app.wxss         # 全局样式
│   ├── utils/api.js     # wx.request 封装
│   └── pages/chat/      # 聊天页（唯一页面）
│       ├── chat.js      # 消息管理 + API 调用 + 滚动控制
│       ├── chat.wxml    # 对话布局 + 菜品卡片 + 思考动画
│       ├── chat.wxss    # 完整样式（329行）
│       └── chat.json    # 页面配置
├── scripts/             # 工具脚本
│   ├── generate_images.py    # 生成占位图
│   ├── fix_prices.py         # 校准价格
│   ├── test_stability.py     # 稳定性测试（32项）
│   └── shot_chat.py          # Playwright 截图
├── openspec/            # OpenSpec 全流程文档
│   ├── changes/initial-setup/
│   │   ├── proposal.md
│   │   ├── design.md
│   │   ├── tasks.md
│   │   └── specs/
│   │       ├── api-spec.md
│   │       ├── data-model.md
│   │       └── frontend-spec.md
│   └── archive/         # 归档副本
└── README.md            # 项目使用说明
```

## 前端交互流程

```
用户打开小程序
    ↓
显示欢迎消息（AI气泡）
    ↓
用户输入需求 → 发送按钮/回车
    ↓
显示用户消息（朱红气泡）+ 思考动画
    ↓
POST /api/recommend → LLM 解析意图
    ↓
AI 回复推荐结果（白色气泡 + 内嵌菜品卡片）
    ↓
用户可继续追问（多轮对话）
```
