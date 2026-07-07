# 食光机 - AI 智能食谱时光相册

> 用镜头记录每一道美味时光，AI 智能识别菜品、分析营养健康属性，分享美食故事，串联你的烹饪成长轨迹。

## 项目简介

食光机是一个前后端分离的美食记录与社区应用，具备 AI 菜品识别（含营养分析）、美食时光轴、智能食谱推荐、美食社区（发帖/评论/点赞/关注）、数据可视化等功能。后端使用 Node.js + Express + SQLite，前端为多页面纯 HTML/CSS/JS 应用，支持用户认证和管理后台。

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | Node.js, Express, better-sqlite3, JWT, bcryptjs, multer, cors, dotenv |
| 前端 | HTML5, CSS3, 原生 JavaScript (IIFE 模块), ECharts |
| 数据库 | SQLite（无需安装外部数据库） |
| AI | OpenAI Vision API（GPT-4o），无 API Key 时自动降级为本地模拟识别（30 道菜品） |

## 快速开始

### 1. 安装依赖

```bash
cd shiguangji/server
npm install
```

### 2. 配置环境变量（可选）

编辑 `server/.env` 文件：

```env
PORT=3000
JWT_SECRET=your_secret_key
OPENAI_API_KEY=          # 留空则使用本地模拟识别
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

### 3. 启动服务器

```bash
cd shiguangji/server
npm start
```

服务器启动后访问 http://localhost:3000 即可使用。

### 4. 默认管理员账号

- 用户名：`admin`
- 密码：`admin123`

## 项目结构

```
shiguangji/
├── server/                     # 后端
│   ├── package.json
│   ├── .env                    # 环境变量
│   ├── src/
│   │   ├── app.js              # Express 应用入口
│   │   ├── database.js         # SQLite 数据库初始化（8 张表）
│   │   ├── middleware/
│   │   │   └── auth.js         # JWT 认证中间件
│   │   ├── routes/
│   │   │   ├── auth.js         # 认证路由（注册/登录）
│   │   │   ├── records.js      # 记录 CRUD 路由
│   │   │   ├── ai.js           # AI 识别/推荐路由
│   │   │   ├── stats.js        # 统计路由
│   │   │   ├── community.js    # 社区路由（帖子/评论/点赞/关注）
│   │   │   └── admin.js        # 管理后台路由
│   │   └── services/
│   │       └── ai-service.js   # AI 服务（OpenAI Vision + 本地降级 + 营养分析）
│   ├── uploads/                # 上传的图片
│   └── data/                   # SQLite 数据库文件
├── public/                     # 前端
│   ├── index.html              # 首页（项目介绍，登录后自动跳转仪表盘）
│   ├── login.html              # 登录/注册页
│   ├── timeline.html           # 美食时光轴（记录管理 + AI 营养分析面板）
│   ├── gallery.html            # 美食相册
│   ├── recommend.html          # AI 智能推荐
│   ├── community.html          # 美食社区（发帖/评论/点赞）
│   ├── dashboard.html          # 个人仪表盘（统计 + 社区动态 + 快捷入口）
│   ├── stats.html              # 数据统计（4 类图表）
│   ├── admin.html              # 管理后台
│   ├── css/                    # 样式文件
│   ├── js/                     # 脚本文件
│   ├── assets/                 # 图片资源
│   └── _shared/                # 共享资源（字体、ECharts）
└── README.md
```

## 功能模块

### 用户系统
- 用户注册/登录（JWT 认证，7 天有效期）
- 密码 bcrypt 哈希存储
- 角色权限：普通用户 / 管理员
- 首页智能跳转：未登录显示项目介绍页，已登录自动跳转仪表盘

### 美食记录
- 添加/查看/编辑/删除记录
- 图片上传（multer，最大 10MB）
- 字段：菜名、图片、日期、餐次、标签、难度、烹饪时间、卡路里、评分、笔记
- 搜索（菜名/笔记）、标签筛选、餐次筛选

### AI 菜品识别与营养分析
- 上传图片后调用 AI 识别菜品
- 配置 `OPENAI_API_KEY` 后使用 GPT-4o Vision API 真实识别
- 未配置 API Key 时使用内置 30 道菜品数据库模拟识别
- 自动填充菜名、标签、难度、烹饪时间、卡路里
- **营养分析**（新增）：
  - 食材清单：自动生成 `{名称, 用量}` 列表
  - 营养成分：蛋白质、碳水化合物、脂肪、纤维、钠
  - 健康标签：如"高蛋白""低脂肪""富含纤维"
  - 健康评分：0-100 分综合评估
  - 烹饪小贴士：基于难度的烹饪建议

### 美食社区（新增）
- 发布帖子：标题、内容、图片、关联美食记录
- 浏览动态：全部动态 / 热门帖子 / 我的帖子
- 互动功能：点赞（toggle）、评论、删除
- 关注系统：关注/取消关注其他用户
- 个人主页：查看用户帖子和资料

### 个人仪表盘（新增）
- 欢迎区域：显示用户名和欢迎语
- 社交数据：帖子数、粉丝数、关注数、获赞数
- 烹饪统计：总记录、标签数、平均评分、本月烹饪
- 快捷入口：记录美食、发帖、查看推荐
- 最近记录：展示最新 3 条美食记录
- 社区动态：展示最新社区帖子
- 热门帖子：按点赞数排序的帖子排行
- 推荐用户：可能感兴趣的用户列表

### 智能推荐
- 分析用户烹饪历史的标签频率、难度偏好
- 从菜品数据库中推荐用户没做过的菜
- 计算匹配分数（60-98 分）并给出推荐理由
- 点击推荐可直接跳转到添加记录页面

### 数据可视化
- 烹饪趋势折线图（按月统计）
- 标签分布饼图（Top 8）
- 餐次分布柱状图
- 难度分布环形图

### 管理后台
- 系统统计概览（用户数、记录数、标签数、平均评分）
- 用户管理（查看/删除用户）
- 所有记录查看（跨用户）
- 管理员账号不可删除

## API 接口

### 认证与记录

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | /api/auth/register | 用户注册 | 否 |
| POST | /api/auth/login | 用户登录 | 否 |
| GET | /api/auth/me | 获取当前用户 | 是 |
| GET | /api/records | 获取记录列表 | 是 |
| GET | /api/records/:id | 获取单条记录 | 是 |
| POST | /api/records | 创建记录 | 是 |
| PUT | /api/records/:id | 更新记录 | 是 |
| DELETE | /api/records/:id | 删除记录 | 是 |

### AI 与统计

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | /api/ai/recognize | AI 识别菜品（含营养分析） | 是 |
| GET | /api/ai/recommend | 获取推荐 | 是 |
| GET | /api/ai/tags | 获取所有标签 | 是 |
| GET | /api/stats | 获取统计数据 | 是 |

### 社区（新增）

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | /api/community/feed | 获取社区动态（分页） | 是 |
| GET | /api/community/hot | 获取热门帖子 | 是 |
| POST | /api/community/posts | 发布帖子 | 是 |
| GET | /api/community/posts/:id | 获取帖子详情 | 是 |
| DELETE | /api/community/posts/:id | 删除帖子 | 是 |
| GET | /api/community/posts/:id/comments | 获取帖子评论 | 是 |
| POST | /api/community/posts/:id/comments | 发表评论 | 是 |
| DELETE | /api/community/comments/:id | 删除评论 | 是 |
| POST | /api/community/posts/:id/like | 点赞/取消点赞 | 是 |
| POST | /api/community/follow/:userId | 关注用户 | 是 |
| DELETE | /api/community/follow/:userId | 取消关注 | 是 |
| GET | /api/community/users/:userId/posts | 获取用户帖子 | 是 |
| GET | /api/community/profile | 获取社区资料 | 是 |

### 管理后台

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | /api/admin/users | 获取所有用户 | 管理员 |
| GET | /api/admin/stats | 获取系统统计 | 管理员 |
| GET | /api/admin/records | 获取所有记录 | 管理员 |
| DELETE | /api/admin/users/:id | 删除用户 | 管理员 |

## 接入真实 AI 识别

1. 获取 OpenAI API Key
2. 编辑 `server/.env`，填入 `OPENAI_API_KEY`
3. 重启服务器
4. 上传图片时会自动调用 GPT-4o Vision API 进行真实菜品识别，返回菜品信息及营养分析数据

也支持其他兼容 OpenAI 接口的大模型，修改 `OPENAI_BASE_URL` 和 `OPENAI_MODEL` 即可。

## 数据库表结构

| 表名 | 说明 |
|------|------|
| users | 用户表（id, username, password, role, created_at） |
| records | 美食记录表（id, user_id, dish_name, image_path, ...） |
| posts | 社区帖子表（id, user_id, title, content, image_path, record_id, ...） |
| comments | 评论表（id, post_id, user_id, content, created_at） |
| likes | 点赞表（id, post_id, user_id, created_at，UNIQUE 约束） |
| follows | 关注表（id, follower_id, following_id, created_at，UNIQUE 约束） |

## 页面导览

| 页面 | 路径 | 说明 |
|------|------|------|
| 首页 | /index.html | 项目介绍页，登录后自动跳转仪表盘 |
| 登录 | /login.html | 登录/注册 |
| 仪表盘 | /dashboard.html | 个人中心（统计 + 社区动态 + 快捷入口） |
| 时光轴 | /timeline.html | 美食记录管理 + AI 营养分析 |
| 相册 | /gallery.html | 美食照片墙 |
| AI推荐 | /recommend.html | 智能食谱推荐 |
| 社区 | /community.html | 美食社区（发帖/评论/点赞） |
| 数据统计 | /stats.html | 烹饪数据可视化 |
| 管理后台 | /admin.html | 系统管理（管理员专用） |
