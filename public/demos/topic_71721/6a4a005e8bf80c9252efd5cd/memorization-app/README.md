# 初中生艾宾浩斯背诵打卡小程序

> 公益小程序 · 基于艾宾浩斯抗遗忘曲线 · 覆盖初中 9 学科 · 贴合人教版教材

## 📖 项目简介

初中学生新增"小四门"(政史地生)后,需背诵内容越来越多。市面上英语类背记软件收费较高且局限于英语。本程序为**公益免费**项目,涵盖语数英、物化生、史地政 9 学科,每天 10-20 分钟,按艾宾浩斯曲线自动推送复习内容,跟着读 3 遍即可,21 天形成长期记忆。

### 核心特色

- ✅ **9 学科全覆盖**:语文、数学、英语、物理、化学、生物、历史、地理、道德与法治
- ✅ **6 学期可选**:初一上/下、初二上/下、初三上/下(贴合人教版)
- ✅ **学新频率可选**:每周 2 次(周二、周五)或 4 次(一、二、四、五)
- ✅ **艾宾浩斯曲线复习**:学新后第 1、2、3、4、5、6、7、9、11、13、15、17、19、21 天共 14 轮推送
- ✅ **跟读 3 遍即打卡**:轻松无压力
- ✅ **学习统计**:连续打卡、复习进度、最近 7 天图表
- ✅ **内容管理后台**:可视化增删改查背诵内容,支持批量导入

## 📁 项目结构

```
memorization-app/
├── server/                  # 后端服务 (Node.js + Express + SQLite)
│   ├── server.js            # 主服务(含全部 API 路由)
│   ├── db.js                # SQLite 数据库初始化
│   ├── ebbinghaus.js        # 艾宾浩斯曲线核心算法
│   ├── seed.js              # 种子数据(学科 + 示例内容)
│   ├── package.json
│   └── data/                # SQLite 数据库文件(运行后自动生成)
│
├── miniprogram/             # 微信原生小程序
│   ├── app.js / app.json / app.wxss
│   ├── pages/
│   │   ├── index/           # 今日打卡(主页)
│   │   ├── review/          # 复习页(跟读 3 遍)
│   │   ├── learn/           # 学新(浏览学科内容)
│   │   ├── content/         # 内容详情
│   │   ├── stats/           # 学习统计
│   │   ├── settings/        # 设置(学期、频率、关于)
│   │   └── login/           # 登录
│   └── utils/
│       ├── api.js           # API 请求封装
│       └── util.js          # 工具函数
│
├── admin/                   # 内容管理后台(Web)
│   ├── index.html
│   ├── admin.js
│   └── admin.css
│
├── project.config.json      # 微信开发者工具项目配置
└── README.md
```

## 🚀 快速开始

### 1. 启动后端服务

**前置要求**:已安装 [Node.js](https://nodejs.org/)(建议 16+)

```bash
cd memorization-app/server
npm install           # 安装依赖
npm run seed          # 初始化学科 + 示例内容(只需执行一次)
npm start             # 启动服务
```

启动成功后会看到:
```
🎓 背诵打卡后端已启动
📡 API:    http://localhost:3000/api
🛠  管理后台:http://localhost:3000/admin
```

- 后端 API 地址:`http://localhost:3000/api`
- 内容管理后台:`http://localhost:3000/admin`(浏览器直接打开)

### 2. 打开内容管理后台

浏览器访问 `http://localhost:3000/admin`,可以:
- 查看现有内容
- 新增/编辑/删除背诵内容
- 批量导入(JSON 格式)
- 查看数据统计

### 3. 运行微信小程序

**前置要求**:已安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)

1. 打开微信开发者工具
2. 导入项目,项目目录选择 `memorization-app/`(`project.config.json` 所在目录)
3. AppID 可选"测试号"或自己的 AppID
4. 修改 `miniprogram/app.js` 中的 `baseUrl`:
   ```js
   globalData: {
     baseUrl: 'http://localhost:3000',  // 改成你的后端地址
   }
   ```
5. 在开发者工具中,点击"详情 → 本地设置",勾选"不校验合法域名"(本地开发时)
6. 编译运行,可使用"测试登录"快速体验(无需微信授权)

## 📐 艾宾浩斯曲线说明

学新当日为第 0 天,之后按以下天数推送复习:

| 轮次 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 |
|------|---|---|---|---|---|---|---|---|---|----|----|----|----|----|
| 第N天| 1 | 2 | 3 | 4 | 5 | 6 | 7 | 9 | 11| 13 | 15 | 17 | 19 | 21 |

- 共 14 轮复习,覆盖 21 天
- 每次复习:跟着读 3 遍即可
- 完成全部 14 轮后,该内容进入"已掌握"

## 🎯 使用流程

1. **登录**:小程序首页 → 测试登录(或微信登录)
2. **设置学期**:我的 → 当前学期 → 选择你的学期
3. **设置学新频率**:我的 → 每周学新次数 → 2 次或 4 次
4. **学新**:学新 tab → 选择学科 → 浏览内容 → 点击"+ 学新"
5. **复习**:首页自动列出今日待复习内容 → 点击进入 → 跟读 3 遍 → 完成打卡
6. **统计**:统计 tab 查看连续打卡、复习进度

## 🔌 主要 API

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/test-login` | 测试登录(无需微信) |
| POST | `/api/auth/login` | 微信登录 |
| GET  | `/api/user/info` | 获取当前用户 |
| POST | `/api/user/settings` | 更新学期/学新频率 |
| GET  | `/api/subjects` | 学科列表 |
| GET  | `/api/contents` | 内容列表(?semester=&subject=) |
| GET  | `/api/contents/:id` | 内容详情 |
| POST | `/api/learn` | 标记学新 |
| GET  | `/api/review/today` | 今日复习任务 |
| POST | `/api/review/finish` | 完成复习打卡 |
| GET  | `/api/learn/list` | 已学列表(含进度) |
| GET  | `/api/stats` | 学习统计 |
| POST | `/api/admin/contents` | 新增内容 |
| PUT  | `/api/admin/contents/:id` | 更新内容 |
| DELETE | `/api/admin/contents/:id` | 删除内容 |
| POST | `/api/admin/contents/batch` | 批量导入 |

## 📦 部署到生产

### 后端部署

1. 把 `server/` 目录上传到服务器
2. `npm install --production`
3. `npm run seed`(首次)
4. 用 `pm2` 守护进程:
   ```bash
   npm install -g pm2
   pm2 start server.js --name memorization
   pm2 save
   ```
5. 用 Nginx 反向代理到 3000 端口(可选,配置 HTTPS)

### 小程序发布

1. 在 [微信公众平台](https://mp.weixin.qq.com/) 注册小程序账号,获取 AppID
2. 替换 `project.config.json` 中的 `appid`
3. 把 `miniprogram/app.js` 的 `baseUrl` 改成线上 HTTPS 域名
4. 在微信公众平台 → 开发管理 → 服务器域名,添加你的域名
5. 真正生产环境还需把 `/api/auth/login` 中的 openid 获取改为调用 `code2session` 接口(需配置小程序的 AppID + AppSecret)

## 📝 内容管理

内容字段说明:

| 字段 | 说明 | 示例 |
|------|------|------|
| subject_code | 学科代码 | chinese / math / english / physics / chemistry / biology / history / geography / politics |
| semester | 学期 | grade7_1 / grade7_2 / grade8_1 / grade8_2 / grade9_1 / grade9_2 |
| unit | 单元 | 第一单元 / Unit 1 / 第二章 |
| title | 标题 | 《静夜思》李白 |
| body | 背诵正文 | 床前明月光... |
| tip | 提示/翻译 | 表达思乡之情 |

批量导入 JSON 示例见管理后台 → 批量导入 → "填充示例"。

## ⚠️ 注意事项

- 后端使用 SQLite,数据文件在 `server/data/app.db`,定期备份即可
- 测试登录无需微信,适合开发调试;正式发布请用微信登录并配置 code2session
- 本项目为公益用途,内容来自公开教材,如涉版权请联系处理
- 学科内容需持续录入,可在管理后台批量添加

## 🛠 技术栈

- **后端**:Node.js + Express + better-sqlite3
- **前端**:微信原生小程序(WXML/WXSS/JS)
- **管理后台**:原生 HTML/CSS/JS(无框架,轻量)
- **算法**:艾宾浩斯抗遗忘曲线

## 📄 License

公益项目,MIT License,可自由使用、修改、分发。
