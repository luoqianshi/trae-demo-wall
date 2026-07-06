# 轻游 QingYou · 本地运行操作手册

> **版本** v1.0 | **日期** 2026-07-03 | **环境** Windows | **Python** 3.8+ | **技术栈** FastAPI + SQLite

---

## 目录

1. [项目概述](#1-项目概述)
2. [项目结构](#2-项目结构)
3. [环境准备](#3-环境准备)
4. [启动服务](#4-启动服务)
5. [访问前端](#5-访问前端)
6. [API 接口说明](#6-api-接口说明)
7. [功能使用指南](#7-功能使用指南)
8. [常见问题排查](#8-常见问题排查)
9. [数据库管理](#9-数据库管理)

---

## 1. 项目概述

**轻游（QingYou）** 是一个面向中老年用户的 AI 假日活动规划应用。用户输入出发地、人数构成、时间预算（必填三件套），以及兴趣、心情、体力、预算、交通方式（选填增强），系统自动生成包含具体地点、地址、交通衔接的个性化游玩方案。

**技术栈：**

- 后端：FastAPI + SQLAlchemy + SQLite
- 前端：纯 HTML / CSS / JavaScript（无框架依赖）
- 天气：Open-Meteo API（实时天气，失败自动回退模拟数据）

**核心特性：**

- **必填** 出发地 + 人数构成 + 时间预算 → 硬约束过滤
- **选填** 兴趣 + 心情 + 体力 + 预算 + 交通 → 软打分排序
- **具体** 真实地点名称 + 门牌地址 + 地铁站出口
- **衔接** 相邻活动间自动生成交通换乘提示

---

## 2. 项目结构

项目包含两个主要目录：`qingyou-server`（后端服务）和 `qingyou-app`（前端静态资源）。

```
qingyou-server/                # 后端服务根目录
├── run.py                     # 启动入口（uvicorn 监听 5000 端口）
├── requirements.txt           # Python 依赖清单
├── instance/
│   └── qingyou.db             # SQLite 数据库（首次运行自动创建）
└── app/                       # 应用模块
    ├── __init__.py            # 应用工厂 + 数据库迁移检测
    ├── config.py              # 配置（数据库路径、静态资源目录）
    ├── database.py            # SQLAlchemy 引擎与 Session
    ├── models.py              # 数据模型（Activity / Plan / City 等）
    ├── seed.py                # 种子数据（城市、活动库、天气）
    ├── planner.py             # 规则引擎（硬约束过滤 + 软打分）
    ├── routes.py              # API 路由（9 个接口）
    ├── schemas.py             # Pydantic 请求体验证
    └── weather_service.py     # 实时天气服务

qingyou-app/                   # 前端静态资源
├── index.html                 # 主页面（HTML + CSS 内联）
├── app.js                     # 前端逻辑（API 调用 + 渲染）
├── _shared/
│   └── fonts/                 # 字体文件
└── assets/
    └── hero_1280x720.jpg      # Hero 区域背景图
```

> **目录关系：** 后端的 `config.py` 中 `STATIC_FOLDER` 指向 `../qingyou-app`，即后端会自动托管前端文件。只需启动后端服务，前端即可通过同一端口访问。

---

## 3. 环境准备

### 3.1 安装 Python

本项目需要 **Python 3.8 或更高版本**。打开 PowerShell 验证：

```powershell
# 检查 Python 版本
python --version

# 若未安装，前往 https://www.python.org/downloads/ 下载
# 安装时务必勾选 "Add Python to PATH"
```

### 3.2 安装依赖

进入后端目录，安装所需的 Python 包：

```powershell
# 进入项目后端目录
cd '路径\到\qingyou-server'

# 安装依赖
pip install -r requirements.txt

# 或指定 Python 路径安装
D:\WpsHarmony\tools\python\python.exe -m pip install -r requirements.txt
```

| 依赖包 | 最低版本 | 用途 |
|--------|----------|------|
| `fastapi` | 0.100 | Web 框架 |
| `uvicorn[standard]` | 0.20 | ASGI 服务器 |
| `SQLAlchemy` | 2.0 | ORM 数据库操作 |
| `pydantic` | 2.0 | 请求体验证 |

> **验证安装成功：** 执行 `python -c "import fastapi, uvicorn, sqlalchemy, pydantic; print('OK')"`，输出 `OK` 即表示依赖安装完毕。

---

## 4. 启动服务

### 4.1 一键启动

在 PowerShell 中执行以下命令即可启动后端服务：

```powershell
# 进入后端目录
cd '路径\到\qingyou-server'

# 启动服务（监听 0.0.0.0:5000）
python run.py

# 若系统有多个 Python 版本，指定路径启动
D:\WpsHarmony\tools\python\python.exe run.py
```

### 4.2 启动流程说明

1. **应用工厂初始化**：`create_app()` 创建 FastAPI 实例，配置 CORS 中间件和静态文件托管
2. **数据库迁移检测**：自动检查表结构是否完整、种子数据版本是否匹配（`SEED_VERSION=4`）
3. **自动建表**：若数据库不存在或结构变更，`create_all()` 自动创建所有表
4. **种子数据写入**：数据库为空时自动写入 31 个城市 + 46 条活动 + 天气数据
5. **服务启动**：uvicorn 在 `0.0.0.0:5000` 启动，前端可通过同端口访问

### 4.3 启动成功标志

控制台输出以下信息表示启动成功：

```
INFO:     Started server process [XXXX]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:5000 (Press CTRL+C to quit)
```

> **首次启动注意：** 首次运行会自动创建 `instance/qingyou.db` 数据库文件并写入种子数据，可能需要 2-3 秒。后续启动会跳过数据写入，速度更快。

---

## 5. 访问前端

### 5.1 浏览器访问

服务启动后，在浏览器中打开：

```
http://localhost:5000
```

即可看到轻游主页面，包含三步向导式输入流程。

### 5.2 三步操作流程

**步骤 1：基础条件（必填）**

填写出发地（默认北京，支持 31 个城市自动匹配）、人数构成（独行/情侣/带长辈·小孩/朋友结伴）、行程天数（1-3 日）和时间窗口。

**步骤 2：个性偏好（选填）**

选择兴趣标签（自然/人文/美食/休闲/运动/亲子）、心情、体力状态、预算上限和交通方式。全部选填，不填也可生成方案。

**步骤 3：生成方案**

点击"生成方案"后，系统展示 Thinking 动画，随后输出包含具体地点、地址、时间线、交通衔接、避坑提醒的完整方案。

---

## 6. API 接口说明

所有 API 以 `/api` 为前缀，返回 JSON 格式数据。

| 方法 | 路径 | 功能 | 必填参数 |
|------|------|------|----------|
| `GET` | `/api/health` | 健康检查 | — |
| `GET` | `/api/time` | 获取北京时间 | — |
| `GET` | `/api/meta` | 获取元数据（城市/活动/心情/体力等） | — |
| `POST` | `/api/match-city` | 城市名称匹配 | `input` |
| `POST` | `/api/plan/generate` | 生成游玩方案 | `city, group, days` |
| `GET` | `/api/plans` | 获取已保存方案列表 | — |
| `POST` | `/api/plans` | 保存方案到数据库 | `city, group, days, plan_data` |
| `GET` | `/api/plans/{id}` | 获取单个方案详情 | `plan_id` |
| `DELETE` | `/api/plans/{id}` | 删除已保存方案 | `plan_id` |

### 6.1 生成方案接口示例

```json
POST /api/plan/generate

{
  "city": "北京",
  "group": "带长辈/小孩",
  "days": 1,
  "depart_time": "09:00",
  "return_time": "21:00",
  "interests": ["自然", "人文"],
  "mood": "平静",
  "energy": "适中",
  "budget_ceiling": 300,
  "transport": "公交"
}
```

---

## 7. 功能使用指南

### 7.1 历史方案

点击页面顶部"📋 历史方案"按钮，可查看已保存的方案列表。支持查看详情（自动回填输入并渲染方案）和删除操作。

### 7.2 保存方案

方案生成后，点击底部"保存方案"按钮，当前方案及输入参数会存入数据库，可在历史方案中随时回看。

### 7.3 重新生成

点击"换一套"按钮，系统会基于相同输入重新打分排序，生成不同的方案组合（含随机扰动因子）。

### 7.4 城市匹配

输入框支持中文城市名、拼音、简称、别称。例如输入 `bj`、`帝都`、`beijing` 均可匹配到"北京"。

### 7.5 覆盖城市

目前 7 个城市有专属活动数据：北京、上海、成都、西安、杭州、南京、广州。其他 24 个城市使用通用活动模板。

---

## 8. 常见问题排查

### ❓ 启动时报错 "ModuleNotFoundError: No module named 'uvicorn'"

Python 环境中缺少依赖。执行 `pip install -r requirements.txt` 重新安装。若有多个 Python 版本，确保用相同解释器安装和启动：`D:\WpsHarmony\tools\python\python.exe -m pip install -r requirements.txt`，然后用 `D:\WpsHarmony\tools\python\python.exe run.py` 启动。

### ❓ 浏览器打开页面显示"无法连接后端服务"

后端未启动或端口被占用。检查：(1) PowerShell 中是否看到 `Uvicorn running on http://0.0.0.0:5000`；(2) 端口 5000 是否被其他程序占用：执行 `Get-NetTCPConnection -LocalPort 5000` 查看占用进程，必要时 `Stop-Process -Id 进程ID -Force` 结束后重启。

### ❓ 启动时报错 "sqlite3.OperationalError: database is locked"

有另一个服务实例正在运行并锁定数据库。结束所有占用 5000 端口的进程后重启：

```powershell
Get-NetTCPConnection -LocalPort 5000 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

### ❓ 修改了种子数据但页面内容没更新

数据库缓存了旧数据。修改 `seed.py` 后需递增 `__init__.py` 中的 `SEED_VERSION` 值，重启服务即可自动重建数据库。也可手动删除 `instance/qingyou.db` 文件，下次启动时自动重建。

### ❓ 生成的方案中没有具体地点名称

该城市可能只有通用活动数据。目前北京、上海、成都、西安、杭州、南京、广州有专属活动。其他城市会使用通用模板（如"市中心公园""老字号餐饮街"）。如需添加城市专属活动，编辑 `seed.py` 中的 `ACTIVITIES` 列表。

### ❓ PowerShell 中执行命令中文乱码

PowerShell 默认编码可能非 UTF-8。执行 `chcp 65001` 切换为 UTF-8 编码。或使用 Python 脚本测试 API 而非直接在 PowerShell 中传递中文参数。

---

## 9. 数据库管理

### 9.1 数据库位置

SQLite 数据库文件位于 `qingyou-server/instance/qingyou.db`，首次运行自动创建。

### 9.2 重置数据库

如需重置所有数据（包括已保存的方案），删除数据库文件后重启服务即可：

```powershell
# 1. 停止后端服务（Ctrl+C 或结束进程）
# 2. 删除数据库文件
Remove-Item '路径\到\qingyou-server\instance\qingyou.db' -Force

# 3. 重新启动服务，数据库自动重建
python run.py
```

### 9.3 数据表说明

| 表名 | 用途 | 主要字段 |
|------|------|----------|
| `cities` | 城市列表 | `name` |
| `city_aliases` | 城市别称（拼音/简称） | `city_name, alias` |
| `weathers` | 模拟天气数据 | `city, text, temp, icon` |
| `activities` | 活动库 | `name, location, address, tip, groups, transport, intensity` |
| `plans` | 用户保存的方案 | `city, group, days, plan_data, created_at` |
| `_seed_meta` | 种子数据版本号 | `version` |

### 9.4 种子数据版本机制

`__init__.py` 中的 `SEED_VERSION` 用于控制数据版本。每次修改 `seed.py` 内容后，递增此版本号，重启服务时系统会自动检测版本不匹配并重建数据库。

> **当前版本：** `SEED_VERSION = 4`（包含 location/address 字段 + 具体真实地点数据）

---

*轻游 QingYou · AI 驱动的假日活动规划器 · 中老年亲和 · 2026*
