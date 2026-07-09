# 灾害预警与趋势预测平台

## 项目简介

灾害预警与趋势预测平台是一个基于 Vue 3 + Python FastAPI 的实时监测与预警系统。

## 技术栈

- **前端**: Vue 3 + Vite + Chart.js + Leaflet
- **后端**: Python 3.11 + FastAPI + SQLAlchemy
- **数据库**: SQLite (默认) / PostgreSQL (生产环境)
- **部署**: Docker + Docker Compose

## 快速启动

### 使用 Docker Compose (推荐)

```bash
# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

服务启动后：
- 前端: http://localhost:3000
- 后端 API: http://localhost:8000
- API 文档: http://localhost:8000/docs

### 本地开发

**后端：**
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**前端：**
```bash
cd frontend
npm install
npm run dev
```

## 项目结构

```
disaster_warning_platform/
├── backend/
│   ├── app/
│   │   ├── models/      # 数据模型
│   │   ├── routers/     # API 路由
│   │   ├── schemas/     # Pydantic 模型
│   │   ├── services/    # 业务逻辑
│   │   ├── utils/      # 工具函数
│   │   ├── config.py    # 配置
│   │   ├── database.py  # 数据库
│   │   └── main.py      # 主应用
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/         # API 调用
│   │   ├── components/  # 组件
│   │   ├── views/       # 页面视图
│   │   ├── stores/      # Pinia 状态
│   │   ├── router/      # 路由
│   │   └── styles/      # 样式
│   ├── public/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml
└── README.md
```

## API 接口

| 接口 | 方法 | 描述 |
|------|------|------|
| /api/warnings/ | GET | 获取预警列表 |
| /api/warnings/ | POST | 创建预警 |
| /api/warnings/{id} | PUT | 更新预警 |
| /api/warnings/{id} | DELETE | 删除预警 |
| /api/warnings/stats/summary | GET | 预警统计 |
| /api/devices/ | GET | 获取设备列表 |
| /api/sensors/stations | GET | 获取监测站数据 |
| /api/analysis/trend | GET | 预警趋势分析 |
| /api/analysis/region-risk | GET | 区域风险分析 |
| /api/health | GET | 健康检查 |
