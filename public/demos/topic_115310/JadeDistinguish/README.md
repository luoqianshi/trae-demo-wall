# 玉鉴（JadeLens）

AI 手机闪光灯玉石珠宝智能鉴别 APP

## 项目结构

```
JadeDistinguish/
├── mobile/            # Flutter 移动端 APP
├── backend-api/       # FastAPI 后端 API 服务
├── backend-admin/     # Vue 3 管理后台
└── docs/              # 项目文档
```

## 快速开始

### 1. 后端 API（backend-api）

#### 环境要求
- Python 3.11+
- PostgreSQL 15+
- Redis 7+

#### 安装依赖

```bash
cd backend-api
pip install -r requirements.txt
```

#### 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，配置数据库连接等
```

#### 启动服务

```bash
# 方式一：直接运行
python -m uvicorn app.main:app --reload

# 方式二：Docker Compose（推荐）
docker-compose up -d
```

API 文档访问：http://localhost:8000/docs

### 2. 管理后台（backend-admin）

#### 环境要求
- Node.js 18+
- npm 或 pnpm

#### 安装依赖

```bash
cd backend-admin
npm install
```

#### 启动开发服务器

```bash
npm run dev
```

访问：http://localhost:3000

#### 构建生产版本

```bash
npm run build
```

### 3. 移动端 APP（mobile）

#### 环境要求
- Flutter 3.0+
- Android Studio / Xcode

#### 安装依赖

```bash
cd mobile
flutter pub get
```

#### 运行应用

```bash
# Android
flutter run -d android

# iOS
flutter run -d ios
```

## 开发指南

### 后端 API 开发

1. **数据库迁移**

```bash
# 初始化迁移（仅首次）
alembic init migrations

# 创建迁移
alembic revision --autogenerate -m "Initial migration"

# 应用迁移
alembic upgrade head
```

2. **运行测试**

```bash
pytest tests/
```

### 管理后台开发

1. **代码格式化**

```bash
npm run lint
```

2. **类型检查**

```bash
npm run type-check
```

### 移动端开发

1. **代码格式化**

```bash
flutter format .
```

2. **运行测试**

```bash
flutter test
```

## API 接口说明

### 鉴别接口

**POST /api/v1/identify**

上传玉石图像进行 AI 鉴别

请求参数：
- `file`: 图片文件（multipart/form-data）
- `jade_type`: 玉石品类（默认：和田玉）
- `light_mode`: 打光方式（side_45 / backlight）

响应示例：
```json
{
  "id": 1,
  "image_url": "/uploads/xxx.jpg",
  "jade_type": "和田玉",
  "light_mode": "side_45",
  "is_authentic": true,
  "confidence": 0.85,
  "features": "特征描述...",
  "suggestion": "建议说明...",
  "status": "completed",
  "created_at": "2024-01-01T12:00:00"
}
```

### 历史记录接口

**GET /api/v1/identify**

获取用户的鉴别记录列表

### 统计接口

**GET /api/v1/admin/stats**

获取统计数据（管理端）

## 技术栈

### 后端 API
- **框架**: FastAPI
- **数据库**: PostgreSQL + SQLAlchemy
- **缓存**: Redis
- **AI**: OpenAI GPT-4o / 自定义模型
- **图像**: OpenCV + Pillow

### 管理后台
- **框架**: Vue 3 + TypeScript
- **UI**: Element Plus
- **状态**: Pinia
- **路由**: Vue Router
- **图表**: ECharts

### 移动端
- **框架**: Flutter
- **状态**: Provider
- **相机**: camera 插件
- **网络**: Dio

## 部署

### Docker 部署

```bash
# 后端 API
cd backend-api
docker-compose up -d

# 管理后台
cd backend-admin
docker build -t jade-admin .
docker run -p 3000:80 jade-admin
```

### 环境变量

#### backend-api
- `DATABASE_URL`: PostgreSQL 连接字符串
- `REDIS_URL`: Redis 连接字符串
- `SECRET_KEY`: JWT 密钥
- `AI_PROVIDER`: AI 服务提供者（mock/openai/claude）
- `OPENAI_API_KEY`: OpenAI API 密钥

#### backend-admin
- `VITE_API_BASE_URL`: API 服务地址

## 许可证

MIT License

## 联系方式

如有问题，请提交 Issue 或联系开发团队。
