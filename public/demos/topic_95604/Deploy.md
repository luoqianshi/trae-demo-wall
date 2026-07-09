# 灾害预警与趋势预测平台 - 部署文档

## 📋 目录

- [项目概述](#项目概述)
- [技术架构](#技术架构)
- [项目结构](#项目结构)
- [快速部署](#快速部署)
- [手动部署](#手动部署)
- [API 文档](#api-文档)
- [配置说明](#配置说明)
- [运维指南](#运维指南)
- [常见问题](#常见问题)

---

## 🏠 项目概述

### 项目简介

灾害预警与趋势预测平台是一个综合性的灾害监测和预警管理系统，采用前后端分离架构，支持实时监控、数据分析、预警管理和设备管理等功能。

### 核心功能

- **实时监控**：地图展示监测点、预警信息、设备状态
- **预警管理**：四级预警系统（红/橙/黄/蓝），支持 CRUD 操作
- **设备管理**：传感器、摄像头等设备的状态监控
- **数据分析**：趋势分析、风险评估、预测预警
- **历史记录**：历史数据查询和导出
- **系统设置**：配置管理、用户管理、安全设置

---

## 🏗️ 技术架构

### 前端技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| Vue 3 | 3.4+ | 前端框架，使用 Composition API |
| Vite | 5.0+ | 构建工具 |
| Vue Router | 4.2+ | 路由管理 |
| Axios | 1.6+ | HTTP 客户端 |
| Chart.js | 4.4+ | 数据可视化 |
| Leaflet | 1.9+ | 交互式地图 |

### 后端技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| Python | 3.11+ | 编程语言 |
| FastAPI | 0.109+ | Web 框架 |
| SQLAlchemy | 2.0+ | ORM |
| Pydantic | 2.5+ | 数据验证 |
| Uvicorn | 0.27+ | ASGI 服务器 |
| SQLite | - | 默认数据库 |

### 部署技术栈

| 技术 | 说明 |
|------|------|
| Docker | 容器化 |
| Docker Compose | 多容器编排 |
| Nginx | 反向代理和静态文件服务 |

---

## 📁 项目结构

```
disaster_warning_platform/
├── backend/                    # 后端应用
│   ├── app/
│   │   ├── __init__.py       # 模块初始化
│   │   ├── main.py           # FastAPI 主应用
│   │   ├── config.py         # 配置管理
│   │   ├── database.py        # 数据库配置
│   │   ├── models/           # 数据模型
│   │   │   ├── warning.py    # 预警模型
│   │   │   └── device.py     # 设备模型
│   │   ├── schemas/          # Pydantic 模型
│   │   │   ├── warning.py
│   │   │   ├── device.py
│   │   │   └── sensor.py
│   │   └── routers/          # API 路由
│   │       ├── warnings.py   # 预警接口
│   │       ├── devices.py    # 设备接口
│   │       ├── sensors.py    # 传感器接口
│   │       └── analysis.py   # 分析接口
│   ├── Dockerfile            # 后端容器配置
│   └── requirements.txt      # Python 依赖
│
├── frontend/                  # 前端应用
│   ├── src/
│   │   ├── main.js           # 应用入口
│   │   ├── App.vue           # 根组件
│   │   ├── router/           # 路由配置
│   │   │   └── index.js
│   │   ├── views/            # 页面组件
│   │   │   ├── Dashboard.vue
│   │   │   ├── Warnings.vue
│   │   │   ├── Devices.vue
│   │   │   ├── Analysis.vue
│   │   │   ├── History.vue
│   │   │   └── Settings.vue
│   │   └── styles/           # 样式文件
│   │       └── main.css
│   ├── public/               # 静态资源
│   ├── Dockerfile            # 前端容器配置
│   ├── nginx.conf            # Nginx 配置
│   ├── vite.config.js        # Vite 配置
│   └── package.json          # 前端依赖
│
├── docker-compose.yml         # Docker Compose 配置
├── .env.example              # 环境变量示例
└── Deploy.md                 # 部署文档
```

---

## 🚀 快速部署

### 前置要求

- Docker >= 20.10
- Docker Compose >= 2.0
- Git

### 部署步骤

#### 1. 克隆项目

```bash
git clone <repository-url>
cd disaster_warning_platform
```

#### 2. 配置环境变量

```bash
cp .env.example .env
```

根据需要修改 `.env` 文件中的配置：

```env
APP_NAME=灾害预警与趋势预测平台
APP_VERSION=1.0.0
DEBUG=false
DATABASE_URL=sqlite:///./disaster_warning.db
API_PREFIX=/api/v1
SECRET_KEY=your-secret-key-change-in-production
```

#### 3. 一键启动

```bash
docker-compose up -d --build
```

#### 4. 验证部署

访问以下地址确认服务运行正常：

- 前端应用：http://localhost
- 后端 API：http://localhost:8000
- API 文档：http://localhost:8000/docs
- ReDoc 文档：http://localhost:8000/redoc

---

## 🔧 手动部署

### 后端部署

#### 1. 创建虚拟环境

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# 或 venv\Scripts\activate  # Windows
```

#### 2. 安装依赖

```bash
pip install -r requirements.txt
```

#### 3. 初始化数据库

```bash
python -c "from app.database import init_db; init_db()"
```

#### 4. 启动服务

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 前端部署

#### 1. 安装依赖

```bash
cd frontend
npm install
```

#### 2. 开发模式

```bash
npm run dev
```

#### 3. 生产构建

```bash
npm run build
```

构建产物将在 `frontend/dist` 目录生成。

#### 4. 使用 Nginx 部署

```bash
# 复制构建产物到 Nginx 目录
cp -r dist/* /usr/share/nginx/html/

# 复制 Nginx 配置
cp nginx.conf /etc/nginx/conf.d/default.conf

# 重启 Nginx
nginx -s reload
```

---

## 📚 API 文档

### 预警管理接口

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/v1/warnings/` | 获取预警列表（支持分页、筛选） |
| GET | `/api/v1/warnings/{id}` | 获取单个预警详情 |
| POST | `/api/v1/warnings/` | 创建新预警 |
| PUT | `/api/v1/warnings/{id}` | 更新预警信息 |
| DELETE | `/api/v1/warnings/{id}` | 删除预警 |
| GET | `/api/v1/warnings/statistics` | 获取预警统计 |
| POST | `/api/v1/warnings/{id}/handle` | 处理预警 |
| POST | `/api/v1/warnings/{id}/resolve` | 解决预警 |

**查询参数**：
- `page`: 页码（默认 1）
- `page_size`: 每页数量（默认 10）
- `level`: 预警等级（red/orange/yellow/blue）
- `warning_type`: 预警类型（fire/flood/earthquake 等）
- `status`: 状态（active/handled/resolved）
- `search`: 搜索关键词

### 设备管理接口

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/v1/devices/` | 获取设备列表 |
| GET | `/api/v1/devices/{id}` | 获取设备详情 |
| POST | `/api/v1/devices/` | 添加新设备 |
| PUT | `/api/v1/devices/{id}` | 更新设备信息 |
| DELETE | `/api/v1/devices/{id}` | 删除设备 |
| GET | `/api/v1/devices/statistics` | 获取设备统计 |
| GET | `/api/v1/devices/stations` | 获取监测站及摄像头 |
| GET | `/api/v1/devices/cameras/{id}` | 获取摄像头视频流 |

### 传感器数据接口

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/v1/sensors/realtime` | 获取实时数据 |
| GET | `/api/v1/sensors/history` | 获取历史数据 |
| GET | `/api/v1/sensors/latest/{code}` | 获取设备最新数据 |
| POST | `/api/v1/sensors/data` | 提交传感器数据 |

### 数据分析接口

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/v1/analysis/trends` | 预警趋势分析 |
| GET | `/api/v1/analysis/risk-assessment` | 风险评估 |
| GET | `/api/v1/analysis/statistics/overview` | 统计概览 |
| GET | `/api/v1/analysis/statistics/device-performance` | 设备性能统计 |
| GET | `/api/v1/analysis/predictions` | 灾害预测 |
| GET | `/api/v1/analysis/warnings/by-region` | 按区域统计 |

---

## ⚙️ 配置说明

### 环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `APP_NAME` | 灾害预警与趋势预测平台 | 应用名称 |
| `APP_VERSION` | 1.0.0 | 应用版本 |
| `DEBUG` | true | 调试模式 |
| `DATABASE_URL` | sqlite:///./disaster_warning.db | 数据库连接 |
| `API_PREFIX` | /api/v1 | API 前缀 |
| `SECRET_KEY` | your-secret-key | JWT 密钥 |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | 30 | Token 过期时间 |

### 数据库配置

项目默认使用 SQLite，适合开发和小型部署。

生产环境建议使用 PostgreSQL：

```env
DATABASE_URL=postgresql://user:password@localhost:5432/disaster_warning
```

### CORS 配置

默认允许所有来源。如需限制，修改 `backend/app/config.py`：

```python
CORS_ORIGINS = [
    "http://localhost:3000",
    "https://your-domain.com"
]
```

---

## 🛠️ 运维指南

### 日志管理

后端日志会输出到控制台。生产环境建议使用日志文件：

```bash
uvicorn app.main:app --log-level info --access-log
```

或配置日志文件：

```python
# backend/app/main.py
import logging

logging.basicConfig(
    filename='app.log',
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
```

### 数据备份

SQLite 数据库备份：

```bash
# 备份
cp disaster_warning.db disaster_warning.db.backup

# 恢复
cp disaster_warning.db.backup disaster_warning.db
```

### 监控

可以使用 Prometheus + Grafana 监控应用：

```yaml
# docker-compose.yml 中添加
prometheus:
  image: prom/prometheus
  ports:
    - "9090:9090"

grafana:
  image: grafana/grafana
  ports:
    - "3001:3000"
  depends_on:
    - prometheus
```

### 扩容

水平扩容后端：

```bash
docker-compose up -d --scale backend=3
```

Nginx 负载均衡已配置在 `frontend/nginx.conf`。

---

## ❓ 常见问题

### 1. Docker 构建失败

**问题**：镜像构建失败

**解决**：

```bash
# 清理 Docker 缓存
docker system prune -a

# 重新构建
docker-compose build --no-cache
```

### 2. 数据库连接错误

**问题**：无法连接数据库

**解决**：
- 检查 `DATABASE_URL` 配置
- 确认数据库文件权限
- 验证数据库文件存在

### 3. 前端 API 请求失败

**问题**：跨域或代理问题

**解决**：
- 检查 Nginx 代理配置
- 确认后端 CORS 配置
- 查看浏览器控制台错误信息

### 4. 端口冲突

**问题**：端口已被占用

**解决**：

```bash
# 查找占用端口的进程
netstat -tulnp | grep 8000  # Linux
netstat -ano | findstr 8000  # Windows

# 修改 docker-compose.yml 中的端口映射
ports:
  - "8001:8000"  # 使用 8001 端口
```

### 5. 性能问题

**解决**：
- 启用数据库索引
- 使用 Redis 缓存
- 优化 SQL 查询
- 前端资源压缩

---

## 📞 技术支持

如有问题，请通过以下方式联系：

- 邮箱：support@disaster-warning.com
- 电话：400-xxx-xxxx
- 在线文档：https://docs.disaster-warning.com

---

## 📄 许可证

本项目采用 MIT 许可证。详见 LICENSE 文件。

---

**版本**: 1.0.0  
**更新日期**: 2024-01-15  
**作者**: 灾害预警平台开发团队
