# 排便健康记录 - 微信小程序版

> Bowel Health Tracker - WeChat Mini Program Edition
> MVP P0 版本 · 微信小程序 · 纯本地数据 · 无需后端

## 一、项目简介

本项目是一款记录排便健康的小工具，基于 Bristol 粪便分类法（Bristol Stool Scale）提供 1-7 型记录、健康洞察、提醒、数据导出等核心功能。所有数据均存储在用户本地（微信小程序 Storage），**不上传任何隐私信息到服务器**。

### P0 核心功能

| 模块 | 功能点 | 状态 |
| --- | --- | --- |
| 引导 | 3 步引导页 + 用户画像收集（性别、年龄段、关注度） | ✅ |
| 记录 | 选 Bristol 类型 + 颜色 + 时间 + 备注，保存到本地 | ✅ |
| 首页 | 月历视图 + 每月统计 + 当日记录列表 | ✅ |
| 详情 | 查看单条记录、Bristol 健康解读、编辑/删除 | ✅ |
| 洞察 | 健康分析、3 项核心指标、Bristol 分布、最近记录 | ✅ |
| 设置 | 用户资料、提醒入口、数据导出、清空数据 | ✅ |
| 提醒 | 启用开关、每日时间、重复日、订阅消息授权 | ✅ |

## 二、项目结构

```
poop_tracker_miniprogram/
├── app.js                       # 小程序入口，全局状态与生命周期
├── app.json                     # 全局配置：页面注册、tabBar、窗口
├── app.wxss                     # 全局样式：CSS 变量、工具类
├── sitemap.json                 # 搜索接入配置
├── project.config.json          # 微信开发者工具项目配置
│
├── utils/                       # 工具层（无副作用纯函数）
│   ├── constants.js             # Bristol 7 型定义、健康判断、颜色
│   ├── date-utils.js            # 日期格式化、起止时间、月份网格
│   ├── health-analyzer.js       # 周频次、分布、健康分析
│   └── export-utils.js          # JSON / CSV 导出
│
├── data/                        # 数据层（仓储模式）
│   ├── storage/
│   │   ├── storage-keys.js      # 存储 key 常量
│   │   └── storage-manager.js   # wx.*Storage 同步 API 封装
│   ├── models/
│   │   ├── record.js            # 单条排便记录模型
│   │   ├── user-profile.js      # 用户画像模型
│   │   └── app-settings.js      # 应用设置模型
│   └── repositories/
│       ├── record-repository.js
│       ├── user-profile-repository.js
│       ├── app-settings-repository.js
│       └── index.js             # 统一导出
│
├── pages/                       # 页面层（8 个页面 × 4 文件 = 32 个）
│   ├── onboarding/              # 引导页
│   ├── profile-setup/           # 用户画像设置
│   ├── home/                    # 首页（首页 tab）
│   ├── record/                  # 新增/编辑记录
│   ├── record-detail/           # 记录详情
│   ├── insights/                # 健康洞察（tab）
│   ├── settings/                # 设置（tab）
│   └── reminder-settings/       # 提醒设置
│
├── tests/                       # 单元测试（Node.js 环境）
│   ├── run-tests.js             # 测试运行器
│   ├── models/
│   │   └── record.test.js
│   ├── repositories/
│   │   └── record-repository.test.js
│   └── utils/
│       ├── constants.test.js
│       ├── date-utils.test.js
│       ├── health-analyzer.test.js
│       └── export-utils.test.js
│
└── docs/                        # 项目文档
    ├── README.md                # 本文件
    ├── 测试清单.md
    ├── 验证报告.md
    └── 部署指南.md
```

## 三、技术栈

| 项 | 选型 |
| --- | --- |
| 目标平台 | 微信小程序（基础库 2.32.0+） |
| 语言 | JavaScript（ES6+ CommonJS 模块） |
| 视图 | WXML + WXSS（原生小程序） |
| 数据 | wx.setStorageSync（本地，无后端） |
| 测试 | Node.js 14+ 原生 assertion |

## 四、运行与调试

### 1. 准备开发者工具

1. 下载 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 使用微信扫码登录（首次使用需 AppID，可点击"测试号"快速开始）

### 2. 导入项目

1. 打开微信开发者工具
2. 选择"导入项目"
3. 项目目录：`poop_tracker_miniprogram/`
4. AppID：选"测试号"或填入自有 AppID
5. 项目名称：自定义

### 3. 真机预览

1. 点击工具栏"预览"按钮
2. 微信扫码，即可在手机上体验完整功能

## 五、运行单元测试

在 `poop_tracker_miniprogram/` 目录下执行：

```bash
node tests/run-tests.js
```

预期输出：

```
========================================
  Poop Tracker Mini Program - 单元测试
========================================
发现 6 个测试文件

>>> models\record.test.js
=== Record 模型测试 ===
  ✓ 空对象应校验失败
  ...
通过 18 / 失败 0
...

========================================
  测试汇总
========================================
通过文件: 6
失败文件: 0
总计:     6

[OK] 全部测试通过
```

> 单元测试使用 Node.js 原生断言运行，**不依赖微信开发者工具**。已在 Node 22.x 验证通过。

## 六、数据存储结构

所有数据存储在微信小程序 Storage 中，键名前缀 `pt_`（poop tracker）：

| 键 | 内容 | 格式 |
| --- | --- | --- |
| `pt_records` | 排便记录数组 | `Record[]` |
| `pt_user_profile` | 用户画像 | `UserProfile` |
| `pt_app_settings` | 应用设置 | `AppSettings` |
| `pt_onboarding_completed` | 是否完成引导 | `boolean` |

### Record 数据结构

```json
{
  "id": "1700000000000_123",
  "bristolType": 4,
  "color": "brown",
  "timestamp": 1700000000000,
  "note": "正常",
  "createdAt": 1700000000000,
  "updatedAt": 1700000000000
}
```

## 七、API 风格约定

所有 Repository 方法采用**同步风格**（基于 `wx.*StorageSync`）：

```js
const { recordRepository } = require('./data/repositories/index.js');
const all = recordRepository.getAllRecords();           // 同步
const rec = recordRepository.insertRecord({...});       // 同步
```

AppSettings 部分方法采用 **Async**（基于 `wx.getStorageInfoSync` 等异步 API）。

## 八、目录约定

- 页面目录命名：小写连字符（`record-detail`）
- 工具函数：`utils/xxx.js`，仅使用 CommonJS `module.exports`
- 仓储方法命名：`getXxx` / `saveXxx` / `insertXxx` / `updateXxx` / `deleteXxx` / `clearAll`

## 九、版本历史

| 版本 | 说明 | 日期 |
| --- | --- | --- |
| 1.0.0 | MVP P0：8 个页面、6 个工具模块、6 个测试文件 | 2026-07 |

## 十、后续规划

- V1.1：云端同步、家庭成员、健康趋势周报
- V1.2：饮食/运动关联分析
- V1.3：医生端分享、PDF 报告
