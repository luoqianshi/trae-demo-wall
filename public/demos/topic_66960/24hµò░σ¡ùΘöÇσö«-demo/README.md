# 神山酒店 · 24h 自动数字销售

> TRAE AI 大赛参赛作品 | 一个 24 小时全自动运转的 AI 销售助手

---

## 项目简介

神山酒店是一家位于西藏阿里地区的高原精品酒店。本系统为酒店搭建了一套**全自动 AI 销售引擎**，包括：

- **AI 开发信外发** — 搜索潜在客户 → ICP 评分 → LLM 生成个性化邮件 → 自动发送
- **AI 收信分类** — IMAP 收信 → 意图识别 → 3 路分发
- **AI 自动回复** — Route 1 全自动回复（索要详情/常见问题） · Route 2 人工接管（高意向/投诉）
- **Web 仪表盘** — 实时数据看板、线索管理、审核面板、回信处理

---

## 快速启动（评委看这里）

### 前置条件

- Python 3.10+
- pip

### 3 步启动

```bash
# 1. 安装依赖
pip install -r requirements.txt

# 2. 复制环境变量（默认测试模式，不会真实发邮件）
cp .env.example .env

# 3. 启动
python web/app.py
```

打开浏览器访问 **http://127.0.0.1:5001**

默认测试模式下，系统不会真实发送邮件。如需体验完整功能，在 `.env` 中填入你的 DeepSeek API Key 和邮箱。

---

## 项目结构

```
├── web/                    # Flask Web 应用
│   ├── app.py             # 后端 API（路由 + 业务逻辑）
│   ├── templates/         # Jinja2 模板（6 页面）
│   └── static/            # 背景图、CSS
├── modules/               # 核心业务模块
│   ├── pipeline.py        # 管道编排（外发 + 收信）
│   ├── outreach.py        # LLM 开发信生成
│   ├── sender.py          # SMTP 邮件发送
│   ├── inbox.py           # IMAP 收信
│   ├── classifier.py      # 回信意图分类
│   ├── responder.py       # 自动回复逻辑
│   ├── leads.py           # 线索管理
│   └── notifier.py        # 飞书/微信通知
├── templates/             # LLM Prompt 模板
├── config/                # 酒店信息 + ICP 规则
├── tests/fixtures/        # 测试用 .eml 样本
├── data/                  # SQLite 数据库（演示数据）
├── state/                 # 系统状态
├── assets/                # PDF 附件
└── scripts/               # CLI 工具
    └── run_pipeline.py    # 独立管道运行脚本
```

---

## 核心功能演示

| 页面 | 路由 | 功能 |
|------|------|------|
| 仪表盘 | `/` | 6 KPI + 销售漏斗 + 今日跟进 + 趋势图表 |
| 客户线索 | `/leads` | 搜索新线索 + 列表管理 + 审核面板 |
| AI 销售助手 | `/pipeline` | 管道运行日志 + 最近运行记录 |
| 回信处理 | `/inbox` | Route 1 自动回复 + Route 2 人工接管 |
| 话术模板 | `/templates` | 开发信模板管理 |
| 系统设置 | `/settings` | 配置管理 |

---

## 技术栈

- **后端**: Python 3.11 + Flask
- **AI**: DeepSeek API (OpenAI 兼容)
- **数据库**: SQLite (WAL 模式)
- **前端**: 原生 HTML/CSS/JS + Chart.js
- **邮件**: SMTP (Gmail) + IMAP
- **通知**: 飞书 Webhook

---

## 设计语言

"Plateau Luminance"（高原光感）— 雪线金 + 冷灰蓝 + 玻璃质感，传递高原酒店的空灵、克制与品质感。

---

## 许可

参赛作品，仅供 TRAE AI 大赛评审使用。