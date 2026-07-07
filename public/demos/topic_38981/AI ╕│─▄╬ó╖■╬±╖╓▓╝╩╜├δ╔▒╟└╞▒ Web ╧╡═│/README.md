# AI赋能微服务秒杀系统 - 后端服务

## 项目简介
基于 Node.js + Express 构建的轻量级秒杀系统后端，使用 JSON 文件实现持久化存储，无需数据库。

## 技术栈
- Node.js >= 14.0.0
- Express 4.x
- JSON 文件存储
- JWT 身份认证
- bcryptjs 密码加密
- CORS 跨域支持

## 项目结构
```
./
├── server.js           # 主入口文件
├── package.json        # 依赖配置
├── data/
│   └── db.json         # JSON数据库文件
├── utils/
│   └── db.js           # 数据库操作工具
└── routes/
    ├── users.js        # 用户模块接口
    ├── products.js     # 商品管理接口
    ├── orders.js       # 秒杀订单接口
    ├── risk.js         # AI风控接口
    └── stats.js        # 数据统计接口
```

## 启动步骤

### 1. 安装 Node.js
- 下载地址: https://nodejs.org/
- 推荐版本: 16.x LTS 或更高

### 2. 安装依赖
```bash
npm install
```

### 3. 启动服务
```bash
# 开发模式（自动重启）
npm run dev

# 生产模式
npm start
```

### 4. 访问服务
- 服务地址: http://localhost:3000
- 可通过环境变量 PORT 自定义端口

## 默认账号
| 账号 | 密码 | 角色 |
|------|------|------|
| admin | admin123 | 管理员 |

## 接口文档

### 用户模块

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 用户注册 | POST | /api/users/register | 普通用户注册 |
| 用户登录 | POST | /api/users/login | 获取token |
| 获取当前用户 | GET | /api/users/me | 需要登录 |
| 用户列表 | GET | /api/users/list | 管理员权限 |
| 删除用户 | DELETE | /api/users/:id | 管理员权限 |

### 商品模块

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 获取商品列表 | GET | /api/products | 公开访问 |
| 获取商品详情 | GET | /api/products/:id | 公开访问 |
| 新增商品 | POST | /api/products | 管理员权限 |
| 更新商品 | PUT | /api/products/:id | 管理员权限 |
| 删除商品 | DELETE | /api/products/:id | 管理员权限 |
| 上下架商品 | PUT | /api/products/:id/status | 管理员权限 |

### 订单模块

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 秒杀下单 | POST | /api/orders/seckill | 需要登录 |
| 我的订单 | GET | /api/orders/my | 需要登录 |
| 订单详情 | GET | /api/orders/:id | 本人或管理员 |
| 订单列表 | GET | /api/orders | 管理员权限 |

### 风控模块

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 记录操作 | POST | /api/risk/log | 需要登录 |
| 风控状态 | GET | /api/risk/status | 需要登录 |
| 风控日志 | GET | /api/risk/logs | 管理员权限 |
| 操作记录 | GET | /api/risk/actions | 管理员权限 |
| 用户分析 | POST | /api/risk/analyze | 管理员权限 |

### 统计模块

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 数据概览 | GET | /api/stats/overview | 需要登录 |
| 商品统计 | GET | /api/stats/products | 需要登录 |
| 每日订单 | GET | /api/stats/orders/daily | 管理员权限 |
| 小时订单 | GET | /api/stats/orders/hourly | 管理员权限 |
| 风控汇总 | GET | /api/stats/risk/summary | 管理员权限 |

## 数据存储说明

所有数据存储在 `data/db.json` 文件中，包含以下集合：
- **users**: 用户信息（密码已加密）
- **products**: 商品信息（含库存、秒杀时间）
- **orders**: 订单信息（秒杀成功记录）
- **riskLogs**: 风控拦截记录
- **userActions**: 用户操作轨迹

数据会自动持久化，重启服务后数据不丢失。

## 核心特性

1. **用户权限**: 区分普通用户和管理员，管理员可管理商品和用户
2. **库存管理**: 真实库存扣减，严格防超卖
3. **重复下单防护**: 一人一单，10秒冷却期
4. **AI风控**: 基于点击频率、请求间隔自动判定风险用户
5. **实时统计**: 在线人数、库存、订单数、拦截数实时统计
