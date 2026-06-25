# 🗺️ 川南旅行规划助手

> 自贡、宜宾智能旅行规划工具 - 前后端分离架构

![Version](https://img.shields.io/badge/version-2.0-blue)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-green)
![License](https://img.shields.io/badge/license-MIT-orange)

## ✨ 功能特点

- 🎯 **智能行程规划**：根据目的地、天数和预算生成个性化行程
- 📍 **高德地图集成**：可视化展示景点位置，支持一键导航
- 🏛️ **丰富景点介绍**：包含地址、门票、开放时间、特色亮点等详细信息
- 🍜 **特色美食推荐**：挖掘当地必吃美食，不虚此行
- 💰 **多预算档位**：平价/中档/高端自由选择
- 🔒 **API Key 安全**：后端保护机制，不暴露敏感信息

## 🚀 快速开始

### 本地运行

```bash
# 克隆项目
git clone https://github.com/XiaoZuliang/chuannan-travel.git
cd chuannan-travel

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env，填入你的高德 API Key

# 启动服务
npm start

# 访问 http://localhost:4000
```

### 一键部署

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

> 点击按钮，自动部署到 Render 平台（需配置环境变量）

详细部署说明请查看 [DEPLOY.md](DEPLOY.md)

## 📁 项目结构

```
chuannan-travel/
├── server.js              # Express 后端服务
├── package.json           # Node.js 依赖配置
├── public/                # 前端静态文件
│   └── index.html        # 前端页面
├── .env.example          # 环境变量示例
├── DEPLOY.md             # 部署详细指南
└── images/               # 景点图片
```

## 🛠️ 技术栈

- **后端**: Node.js + Express
- **前端**: HTML5 + CSS3 + Vanilla JavaScript
- **地图**: 高德地图 JavaScript API
- **部署**: Render / Railway / Vercel

## 🎯 支持目的地

### 自贡
- 🦕 自贡恐龙博物馆
- 🏘️ 仙市古镇
- 🏛️ 燊海井
- 🏛️ 自贡盐业历史博物馆
- 🏮 自贡灯会

### 宜宾
- 🎋 蜀南竹海
- 🏘️ 李庄古镇
- 🗿 兴文石海
- 🍶 五粮液酒厂
- 🏛️ 夕佳山民居

## 📝 使用说明

1. 选择目的地（自贡/宜宾）
2. 设置游玩天数（1-7天）
3. 选择预算档位
4. 点击「生成行程」
5. 查看行程清单和景点地图

## 🔑 API Key 配置

### 申请高德地图 API Key

1. 注册 [高德开放平台](https://lbs.amap.com/)
2. 进入「控制台」→「应用管理」→「我的应用」
3. 点击「添加 Key」
4. 平台选择「Web JS API」
5. 填写域名白名单（部署后填写你的网站域名）

### 配置方式

**本地开发**:
```bash
# 编辑 .env 文件
AMAP_KEY=你的API密钥
```

**部署到云平台**:
- Render: Settings → Environment → Variables
- Railway: Variables → New Variable

## 🌐 API 接口

### 获取景点列表
```
GET /api/attractions/:city
```

### 获取美食列表
```
GET /api/foods/:city
```

### 生成行程规划
```
POST /api/generate-itinerary
Body: { city, days, budget }
```

### 获取地图 Key
```
GET /api/map-key
```

### 搜索景点位置
```
GET /api/search-location?name=&city=
```

## 🚀 部署平台推荐

### Render ⭐ 推荐
- 免费额度：750小时/月
- 自动 HTTPS
- 支持 Node.js
- 部署地址：https://render.com

### Railway
- 免费额度：500小时/月
- 自动休眠
- 部署地址：https://railway.app

## ⚠️ 注意事项

1. API Key 安全
   - 不要将真实 Key 提交到代码仓库
   - 使用环境变量存储
   - 设置域名白名单限制使用范围

2. 平台限制
   - 免费平台有休眠机制
   - 首次访问可能需要等待启动

## 📜 License

MIT License - 欢迎 Fork 和 Star！

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📧 联系

如有问题，请通过 GitHub Issues 反馈。
