# 衣参谋 - TRAE 作品赛提交说明

## 项目简介

「衣参谋」是一款基于 Flutter + FastAPI 的智能穿搭管理全栈应用，融合中国传统五行色彩理论与 AI 智能搭配算法，帮助用户科学管理衣橱、获取每日穿搭建议。

## 提交形式

交互式可体验 HTML 文件（ZIP 压缩包）

## 体验方式

1. 解压 `yicamou-demo.zip`
2. 用浏览器直接打开 `index.html`
3. 无需安装任何环境，无需联网即可体验全部功能

## 核心功能

| 模块 | 功能说明 |
|------|----------|
| 每日色彩 | 基于天干/五行理论自动计算当日推荐主色、辅色、禁忌色 |
| 衣橱管理 | 拍照录入衣物，按品类/颜色/季节/场景多维筛选管理 |
| AI 搭配 | 根据场景（通勤/约会/休闲/运动）自动推荐穿搭组合 |
| 好物推荐 | 基于衣橱缺口分析，推荐适合的穿搭单品 |
| 用户中心 | 匿名登录、心愿单、每日穿搭打卡 |

## 技术架构

- **前端**：Flutter 3.x + Material 3 设计
- **后端**：FastAPI + Python 3.10+
- **数据库**：SQLite（零配置）+ SQLAlchemy ORM
- **鉴权**：JWT 匿名设备登录
- **特色算法**：天干/五行色彩计算 + AI 穿搭匹配引擎

## 数据库设计

6 张数据表：user、clothes_item、match_record、goods_recommend、wish_list、sys_config

## API 接口

15+ RESTful API，覆盖用户、衣物、搭配、商品、工具五大模块。

## 部署说明

```bash
cd backend
pip install -r requirements.txt
python app.py
# 访问 http://127.0.0.1:8000/docs 查看 API 文档
```

## 项目亮点

- 单文件架构：后端全部逻辑在 `app.py`，前端全部页面在 `main.dart`
- 零配置启动：SQLite 自动建表、自动注入示例数据
- 传统文化数字化：将五行色彩理论转化为可计算的穿搭建议
- 规则驱动 AI：无需外部 LLM API，纯规则引擎实现智能搭配
- 可云端部署：提供一键部署脚本 + systemd 服务配置

## 文件结构

```
yicamou-demo/
├── index.html          # 交互式体验 Demo（核心提交文件）
├── assets/
│   ├── demo-data.js    # 演示数据（衣物、商品、搭配等）
│   └── *.jpg           # AI 生成的主题插画
└── _shared/            # 样式与动画资源
```

## 联系方式

TRAE 作品赛 · 2026
