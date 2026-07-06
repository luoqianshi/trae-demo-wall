# 食鲜冰箱 —— 应季美食提醒小程序

> 🥇 TRAE AI 创造力大赛参赛作品 | 生活娱乐赛道

一款基于微信小程序云开发的时令美食管理与个性化推荐应用。帮助用户发现应季美食、管理冰箱食材保质期、记录想吃清单，并通过个性化推荐算法让每位用户看到最契合自己口味与家乡的美食。

## ✨ 项目亮点

- **应季美食发现**：跟着季节吃，不错过每一种美食的最佳赏味期
- **拟物冰箱交互**：双开门冰箱 UI，开门/关门动画，冷藏/保鲜分层管理
- **三色保质期预警**：绿色新鲜 / 黄色临期 / 红色过期，一目了然
- **个性化推荐**：基于家乡、口味、品类偏好 + 用户行为的双重加权推荐
- **UGC 投稿系统**：人人都可以推荐家乡美食，共建美食库

## 项目介绍

「食鲜冰箱」围绕「时令、地域、口味」三个维度，为用户提供：

- **个性化美食推荐**：基于静态偏好（家乡 15% + 品类 15% + 口味 10%）与动态行为（想吃 20% + 冰箱 20% + 投票收藏 20%）双重加权的推荐算法。
- **冰箱管理**：拟物化双门冰箱（冷藏层 + 保鲜层），自动计算保质期与临期状态，支持备注、批量清理、容量管控。
- **想吃清单**：收藏想尝鲜的美食，支持拖拽排序、批量移入冰箱。
- **美食投票榜**：人气榜 / 邮购榜每日投票，助力美食上榜。
- **美食投稿**：用户可投稿地方美食，经管理员审核后入库。
- **消息通知**：时令提醒、临期提醒、囤货提醒、系统消息。
- **管理后台**：内容审核、美食库管理、风控、数据看板、消息推送。

## 功能列表

| 模块 | 功能 |
| --- | --- |
| 首页 | 当月应季美食、个性化推荐瀑布流、地区/品类/时间多维筛选、快捷入口 |
| 冰箱 | 双门冰箱拟物交互、冷藏/保鲜分层、临期预警、批量管理、想吃清单拖拽排序 |
| 榜单 | 季节榜单、地区榜单（本地/邮购）、三级地区筛选 |
| 投票榜 | 人气榜、邮购榜、每日投票、实时排名 |
| 美食详情 | 多图浏览、投票、收藏、加入想吃、移入冰箱、分享 |
| 投稿 | 多图上传、地区选择、上市/赏味/下市月份、价格、邮购信息 |
| 消息 | 分类消息列表、未读统计、全部已读、清空 |
| 个人中心 | 用户信息、口味看板、统计数据、消息入口 |
| 新手引导 | 三步引导（家乡地区 → 爱吃品类 → 口味偏好） |
| 偏好设置 | 修改地区、品类、口味偏好 |
| 管理后台 | 内容审核、美食库管理、风控管理、数据看板、消息推送 |

## 技术架构

- **前端**：微信小程序原生开发（WXML + WXSS + JavaScript）
- **后端**：微信云开发（云函数 + 云数据库 + 云存储）
- **推荐算法**：静态偏好（40%）+ 动态行为（60%）双重加权，云端计算 + 本地兜底预览
- **基础库**：2.2.3 及以上（需支持云能力）
- **云开发环境 ID**：`fresh-fridge-env`（部署时需替换为实际环境 ID）

## 目录结构

```
fresh-fridge-miniapp/
├── miniprogram/                  # 小程序前端代码
│   ├── app.js                    # 全局逻辑（云开发初始化、登录、引导检查）
│   ├── app.json                  # 全局配置（页面路由、tabBar、window）
│   ├── app.wxss                  # 全局样式
│   ├── sitemap.json              # 搜索索引配置
│   ├── data/                     # 静态数据文件
│   │   ├── categories.js         # 美食分类数据
│   │   ├── foods.js              # 美食数据
│   │   ├── foodsSeed.js          # 种子数据
│   │   ├── regions.js            # 省市区地区数据
│   │   ├── shelfLife.js          # 保质期模板
│   │   └── tastes.js             # 口味数据
│   ├── utils/                    # 工具函数
│   │   ├── cloud.js              # 云开发封装（增删改查、云函数调用、文件上传）
│   │   ├── date.js               # 日期格式化与临期状态
│   │   ├── recommend.js          # 推荐算法（本地计算 + 云函数调用）
│   │   └── storage.js            # 本地存储封装
│   └── pages/                    # 页面目录
│       ├── index/                # 首页（推荐 + 应季）
│       ├── fridge/               # 冰箱管理
│       ├── discovery/            # 榜单页
│       ├── vote/                 # 美食投票榜
│       ├── profile/              # 个人中心
│       ├── foodDetail/           # 美食详情
│       ├── guide/                # 新手引导
│       ├── preferences/          # 偏好设置
│       ├── submit/               # 美食投稿
│       ├── messages/             # 消息通知
│       ├── notificationSettings/ # 通知设置
│       └── admin/                # 管理后台
│           ├── audit/            # 内容审核
│           ├── foodManage/       # 美食库管理
│           ├── riskControl/      # 风控管理
│           ├── dashboard/        # 数据看板
│           └── pushMessage/      # 消息推送
├── cloudfunctions/               # 云函数目录
│   ├── login/                    # 用户登录
│   ├── saveUserPreferences/      # 保存用户偏好
│   ├── recommendation/           # 个性化推荐
│   ├── foodCRUD/                 # 美食增删改查
│   ├── submitFood/               # 美食投稿
│   ├── addToFridge/              # 加入冰箱
│   ├── fridgeManager/            # 冰箱管理
│   ├── addToWant/                # 加入想吃
│   ├── wantManager/              # 想吃清单管理
│   ├── voteFood/                 # 美食投票
│   ├── toggleFavorite/           # 收藏切换
│   ├── messageManager/           # 消息管理
│   ├── adminManager/             # 后台管理
│   ├── initCollections/          # 初始化数据库集合
│   ├── seedFoods/                # 灌入种子数据
│   └── scheduledReminders/       # 定时提醒（定时触发器）
└── project.config.json           # 项目配置
```

## 部署步骤

### 1. 创建云开发环境

1. 使用微信开发者工具打开本项目。
2. 开通云开发，创建环境，记下环境 ID。
3. 将 `miniprogram/app.js` 中 `wx.cloud.init` 的 `env` 替换为你的环境 ID。

### 2. 部署云函数

在微信开发者工具中，右键 `cloudfunctions/` 下每个云函数文件夹，选择「上传并部署：云端安装依赖」。需依次部署以下云函数：

- login、saveUserPreferences、recommendation、foodCRUD、submitFood
- addToFridge、fridgeManager、addToWant、wantManager
- voteFood、toggleFavorite、messageManager、adminManager
- initCollections、seedFoods、scheduledReminders

### 3. 初始化数据库

1. 在云开发控制台手动创建以下集合（或部署 `initCollections` 云函数后调用一次）：
   `foods`、`users`、`fridge`、`wantList`、`favorites`、`voteRecords`、`messages`、`submissions`、`userPreferences`
2. 设置集合权限：建议 `users`、`fridge`、`wantList`、`favorites`、`voteRecords`、`messages` 设为「仅创建者可读写」；`foods`、`submissions` 设为「所有用户可读，仅创建者可写」。

### 4. 灌入种子数据

部署 `seedFoods` 云函数后调用一次，将 `data/foodsSeed.js` 中的种子美食写入 `foods` 集合。

### 5. 配置定时提醒（可选）

`scheduledReminders` 云函数配套 `config.json` 定时触发器，可在云函数配置中启用，用于每日临期/时令消息推送。

### 6. 配置管理员

在 `adminManager` 云函数的管理员名单中加入你的 openid（首次进入管理后台会校验权限）。

### 7. 编译运行

在开发者工具中编译预览，或点击「上传」发布体验版/正式版。

## 云函数列表

| 云函数 | 说明 | 主要 action |
| --- | --- | --- |
| `login` | 用户登录，自动注册并返回用户信息 | — |
| `saveUserPreferences` | 保存新手引导/偏好设置中的用户数据 | — |
| `recommendation` | 个性化推荐算法，返回推荐美食列表 | — |
| `foodCRUD` | 美食库增删改查 | list / detail / create / update / delete |
| `submitFood` | 用户投稿美食，写入待审核记录 | — |
| `addToFridge` | 将美食加入冰箱（自动计算保质期） | — |
| `fridgeManager` | 冰箱管理 | getList / addItem / deleteItem / batchMoveFromWant / clearExpired / updateNote / checkCapacity |
| `addToWant` | 加入/移出想吃清单（toggle） | — |
| `wantManager` | 想吃清单管理 | getList / addItem / deleteItem / batchDelete / batchMoveToFridge / updateSortOrder |
| `voteFood` | 为美食投票（每日每美食一次） | — |
| `toggleFavorite` | 收藏/取消收藏（toggle） | — |
| `messageManager` | 消息管理 | getList / getUnreadCount / markRead / markAllRead / clearAll |
| `adminManager` | 后台权限校验与管理 | checkAdmin 等 |
| `initCollections` | 初始化数据库集合 | — |
| `seedFoods` | 灌入种子美食数据 | — |
| `scheduledReminders` | 定时提醒（定时触发器） | — |

## 数据库集合说明

| 集合 | 说明 | 关键字段 |
| --- | --- | --- |
| `foods` | 美食库 | name、category、subCategory、origin、seasonMonths、images、priceMin/Max、canMail、voteCount、mailVoteCount、favoriteCount、wantCount、hotScore、status(approved/pending)、isOfficial |
| `users` | 用户 | openid、nickname、avatarUrl、region、preferences、tastes、categories、totalSaved、totalExpired、isGuideCompleted |
| `fridge` | 冰箱食材 | userId、foodId、name、category、layer(cold/fresh)、purchaseDate、expireDate、shelfLifeDays、note、status(active/deleted/cleared)、isExpired |
| `wantList` | 想吃清单 | userId、foodId、name、category、origin、bestMonths、sortOrder、status(active/deleted/moved) |
| `favorites` | 收藏记录 | openid、foodId、createTime |
| `voteRecords` | 投票记录 | openid、foodId、voteType(general/mail)、voteDate(YYYY-M-D)、createTime |
| `messages` | 消息通知 | userId、type(seasonal/expiry/overstock/system)、title、content、foodId、isRead、isDeleted |
| `submissions` | 投稿记录 | userId、formData、status(pending/approved/rejected) |
| `userPreferences` | 用户偏好扩展 | userId、tasteTags、favoriteCategories 等 |

## 核心功能链路

1. **登录 → 引导 → 推荐 → 详情 → 入库**：启动登录 → 新手引导（地区/品类/口味）→ 首页个性化推荐 → 美食详情 → 加入想吃 / 移入冰箱 → 冰箱管理
2. **首页 → 榜单 → 详情**：首页快捷入口 → 季节/地区榜单 → 美食详情
3. **首页 → 投稿 → 审核**：首页投稿入口 → 填写投稿信息 → 提交审核 → 管理后台审核入库
4. **消息 → 详情**：消息列表 → 点击消息 → 跳转美食详情
5. **管理后台**：权限校验 → 内容审核 / 美食管理 / 风控 / 数据看板 / 消息推送

## 🛠️ 开发工具

本项目基于 **TRAE IDE** 开发，AI 辅助完成：
- 需求分析与 PRD 生成
- 项目结构搭建与页面代码生成
- 云函数编写与调试
- Bug 定位与修复

## 📸 效果预览

| 首页时令推荐 | 双开门冰箱 | 美食详情页 |
|-------------|-----------|-----------|
| 瀑布流浏览，多维度筛选 | 冷藏层+保鲜层，临期预警 | 投票/收藏/想吃/移入冰箱 |
| 【截图占位】 | 【截图占位】 | 【截图占位】 |

| 投票榜 | 个人中心 | 投稿页 |
|--------|---------|--------|
| 人气榜/邮购榜双榜单 | 统计数据+口味看板 | 多图上传+地区选择 |
| 【截图占位】 | 【截图占位】 | 【截图占位】 |

## 备注

- tabBar 当前为纯文字配置（无图标文件），如需图标请将 PNG 文件放入 `miniprogram/images/tab/` 并在 `app.json` 的 tabBar 中补充 `iconPath` / `selectedIconPath`。
- 云开发环境 ID 需在 `app.js` 中替换为实际值。
- 管理员 openid 需在 `adminManager` 云函数中配置。
- 美食图片使用 AI 生成占位图，实际使用时可替换为真实图片。
