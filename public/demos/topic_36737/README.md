# 寻味岭南 - 粤菜点餐助手

基于自然语言理解的粤菜智能点餐推荐系统。用户以聊天对话方式输入用餐需求（如"2个人吃，预算200元，想吃清淡的粤菜"），系统自动解析意图并从60道经典粤菜中智能推荐菜品组合。

## 功能特性

- **聊天式交互** — 类微信对话界面，支持多轮追问和约束调整
- **AI 智能推荐** — LLM 解析人数/预算/口味/场景，按人数配餐、品类多样、预算控制
- **真实价格数据** — 60道菜价格参考美团/大众点评广州中档粤菜馆
- **点餐历史** — 自动保存历次推荐记录，支持查看详情和一键再次下单
- **本地 Fallback** — API Key 不可用时自动降级为规则匹配
- **分阶段思考提示** — "正在努力执行中..." → "已找到推荐菜品，正在组织回复..."
- **一键安装** — Windows 双击 install.bat 即可完成环境配置

## 技术栈

| 层 | 选型 | 说明 |
|---|------|------|
| 前端 | 微信小程序（原生 WXML/WXSS） | 聊天页 + 历史页 + TabBar 导航 |
| 后端 | FastAPI + Uvicorn | 异步高性能 |
| 数据库 | SQLite | 零配置，单文件部署 |
| LLM | Qwen / DeepSeek API | 意图解析 + 智能配餐 |
| 菜品数据 | 60道经典粤菜 | 含真实价格、9大分类、标签 |

## 快速开始

### 1. 安装

双击运行 `install.bat`，脚本会自动：
- 检测 Python 3.10+ 环境
- 创建虚拟环境 `.venv`
- 安装依赖（fastapi, uvicorn, httpx, openai）
- 初始化菜品数据库（60道菜 + 图片）

### 2. 启动服务

双击运行 `start.bat`，服务地址：`http://localhost:8001`

健康检查：`http://localhost:8001/api/health`

### 3. 小程序预览

1. 打开微信开发者工具
2. 导入 `miniprogram/` 目录
3. 开启「不校验合法域名、web-view、TLS版本以及HTTPS证书」
4. 确认后端已启动（start.bat）
5. 底部 TabBar 切换「聊天」和「历史」页面

## 环境变量

在 `.env` 文件中配置：

| 变量 | 说明 | 默认值 |
| --- | --- | --- |
| `OPENAI_API_KEY` | OpenAI 兼容服务的 API Key | 需自行填写 |
| `OPENAI_BASE_URL` | 兼容接口地址 | 阿里云百炼 |
| `LLM_MODEL` | 模型名称 | `qwen-plus` |

> ⚠️ 不配置 API Key 时，系统自动降级为关键词规则匹配推荐。

## API 文档

### POST /api/recommend
```json
// Request
{"user_input": "2个人吃，预算200元，想吃清淡的"}

// Response
{
  "summary": "2人200元预算，帮你搭了一荤一素一点心，总共¥168",
  "recommended_dishes": [
    {"id": 7, "name": "虾饺皇", "price": 38, "category": "点心", "reason": "清淡经典点心"},
    {"id": 46, "name": "白灼菜心", "price": 28, "category": "凉菜", "reason": "清爽蔬菜搭配"}
  ],
  "total_price": 168
}
```

### GET /api/dishes
返回全部60道菜品列表。

### GET /api/history?limit=20
获取历史推荐记录（默认最近20条）。

### GET /api/health
健康检查：`{"status": "ok"}`

## 项目结构

```
yuecai-assistant/
├── main.py              # FastAPI 入口 + 静态文件挂载
├── database.py          # SQLite 封装（菜品 + 历史记录）
├── llm_service.py       # LLM 意图解析 + 规则 fallback
├── init_db.py           # 数据库初始化脚本
├── dishes.json          # 60道粤菜数据（含价格/分类/标签）
├── requirements.txt     # Python 依赖
├── install.bat          # 一键安装（Windows）
├── start.bat            # 启动服务（Windows）
├── .env                 # 环境变量配置
├── static/images/       # 60张菜品图片
├── miniprogram/         # 微信小程序前端
│   ├── app.js/json/wxss # 全局配置 + TabBar
│   ├── assets/          # TabBar 图标 + 聊天头像
│   ├── utils/api.js     # HTTP 请求封装
│   ├── static/images/   # 菜品图片（小程序本地引用）
│   └── pages/
│       ├── chat/        # 聊天页（自然语言点餐）
│       └── history/     # 历史页（点餐记录回顾）
├── scripts/             # 辅助工具脚本
└── README.md
```

## 菜品分类

| 分类 | 数量 | 代表菜品 |
|------|------|----------|
| 点心 | 10 | 虾饺皇、叉烧包、流沙包 |
| 小炒 | 10 | 咕噜肉、菜心炒牛肉 |
| 主食 | 8 | 干炒牛河、煲仔饭、云吞面 |
| 烧味 | 7 | 白切鸡、烧鹅、蜜汁叉烧 |
| 汤品 | 7 | 老火靓汤、花胶鸡汤 |
| 甜品 | 7 | 双皮奶、杨枝甘露 |
| 海鲜 | 4 | 避风塘炒蟹、清蒸石斑鱼 |
| 凉菜 | 4 | 白灼菜心、凉拌木耳 |
| 煲仔 | 3 | 啫啫鸡煲、枝竹羊腩煲 |
