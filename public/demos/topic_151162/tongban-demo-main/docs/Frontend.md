# 瞳伴 - AI视障出行助手 · 前端开发文档

> 版本：v1.0.0  ·  最后更新：2026-07-05
> 适用文件：`App.js`（约 7200 行）、`tongban-demo.html`、`fence.js`

---

## 目录

1. [项目概述](#1-项目概述)
2. [页面体系](#2-页面体系)
3. [核心机制](#3-核心机制)
4. [功能模块开发指南](#4-功能模块开发指南)
5. [全局变量清单](#5-全局变量清单)
6. [设计规范实现](#6-设计规范实现)
7. [无障碍开发规范](#7-无障碍开发规范)
8. [调试与测试](#8-调试与测试)
9. [开发约定](#9-开发约定)

---

## 1. 项目概述

### 1.1 项目定位

瞳伴（Tongban）是一款面向视障人士及其家属的 AI 出行辅助应用。产品包含两个核心使用角色：

- **视障人士（blind）**：使用者，提供语音唤醒、盲道导航、AI 摄像头环境识别、危险预警、手势操作、紧急求助等核心能力。
- **家人（family）**：守护者，可查看被监护人士位置、设置安全围栏、接收紧急求助通知、浏览社区等。

两种角色共用同一套前端代码，通过 `userRole` 全局变量在运行时进行差异化呈现。

### 1.2 技术选型

| 维度 | 选型 | 说明 |
| --- | --- | --- |
| 架构 | **原生 JavaScript SPA** | 无 Vue/React/Angular 等框架，无构建步骤 |
| 入口 | `tongban-demo.html` | 包含手机模拟器外壳与全部静态 DOM 结构、SVG 图标库 |
| 主逻辑 | `App.js`（约 7200 行） | 单文件 IIFE，承载全部状态、视图、交互逻辑 |
| 围栏模块 | `fence.js` | 独立 IIFE，专门负责围栏详情页（地图绘制、多边形/圆形围栏管理） |
| 样式 | 内联 `<style>` + 行内 `style` | 设计令牌通过 CSS 变量在 `:root` 中集中声明 |
| 字体 | `-apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", "Microsoft YaHei"` | Apple 风格字体栈 |
| 存储 | `localStorage` | 会话、用户表、角色偏好持久化 |
| 语音 | `window.speechSynthesis`（Web Speech API） | 中文语音播报核心 |
| 震动 | `navigator.vibrate` | 触觉反馈 |
| 设备运动 | `devicemotion` 事件 | 摇一摇紧急求助检测 |

> 不引入打包工具，所有 JS 通过 `<script src="app.js"></script>` 与 `<script src="fence.js"></script>` 在 HTML 末尾同步加载。

### 1.3 文件结构说明

```text
e:\APP\tongban\
├── tongban-demo.html      # 主入口：手机模拟器外壳 + 静态页面 DOM + 内联样式
├── App.js                 # 主逻辑（IIFE 单文件，7200 行）
├── fence.js               # 围栏详情页模块（独立 IIFE）
├── server.js              # 本地调试服务器（可选）
├── package.json           # 仅开发依赖（无生产依赖）
├── PRD.md                 # 产品需求文档
├── README.md              # 项目说明
├── docs/
│   └── Frontend.md        # 本文档
├── tongban-prd/           # PRD 附件（字体、原型图等）
├── src/                   # 实验性 React/Vue 拆分尝试（未启用）
└── *.js / *.ps1           # 历史构建/分析脚本（可忽略）
```

> 实际生效的运行时文件仅三个：`tongban-demo.html`、`App.js`、`fence.js`。

---

## 2. 页面体系

瞳伴共有 **32 个屏幕**，分为静态 HTML 页面、覆盖层和动态创建页面三大类。

### 2.1 静态 HTML 页面（7 个主页面 + 5 个覆盖层）

这些页面在 `tongban-demo.html` 中以 `<div class="screen" id="xxxScreen">` 形式直接声明：

| 类型 | 屏幕名 | DOM ID | 用途 |
| --- | --- | --- | --- |
| 主页面 | wakeScreen | `#wakeScreen` | 唤醒页（首页），语音按钮、搜索入口 |
| 主页面 | routeScreen | `#routeScreen` | 路线规划页，选择出行方式与路线 |
| 主页面 | navScreen | `#navScreen` | 导航进行中页，地图、指引、盲道状态 |
| 主页面 | arrivalScreen | `#arrivalScreen` | 到达页，环境描述、入口引导 |
| 主页面 | communityScreen | `#communityScreen` | 社区页，4 Tab 内容流 |
| 主页面 | familyScreen | `#familyScreen` | 家人守护页，被监护人士列表 |
| 主页面 | myScreen | `#myScreen` | 我的页面（设置入口，旧版） |
| 覆盖层 | cameraOverlay | `#cameraOverlay` | AI 摄像头识别全屏覆盖层 |
| 覆盖层 | dangerOverlay | `#dangerOverlay` | 危险预警顶部弹出卡片 |
| 覆盖层 | emergencyOverlay | `#emergencyOverlay` | 紧急求助全屏 SOS 覆盖层 |
| 覆盖层 | gestureTutorialOverlay | `#gestureTutorialOverlay` | 手势操作教程覆盖层 |
| 覆盖层 | floorNavPanel | `#floorNavPanel` | 室内楼层导航面板 |

### 2.2 动态创建页面（20 个）

这些页面不在 HTML 中预声明，而是在 `App.js` 中通过 `ensure*Page()` 函数懒加载创建，首次访问时调用对应 `ensure*Page()`，通过 `document.createElement` + 字符串拼接 `innerHTML` 注入到 `.phone-screen` 容器中。

| 屏幕名 | 创建函数 | 用途 |
| --- | --- | --- |
| loginScreen | `createLoginPage()` | 登录页（角色选择 + 三种登录方式） |
| registerScreen | `createRegisterPage()` | 注册页 |
| accountScreen | `createAccountPage()` | 个人中心（大头像、数据卡片、快捷入口） |
| emergencyContactsScreen | `ensureEmergencyContactsPage()` | 紧急联系人管理 |
| messageScreen | `ensureMessagePage()` | 消息中心（4 类消息过滤） |
| messageDetailScreen | `ensureMessageDetailPage()` | 消息详情 |
| commonAddressesScreen | `ensureCommonAddressesPage()` | 常用地址管理 |
| fenceManagementScreen | `ensureFenceManagementPage()` | 围栏列表管理 |
| guardianSettingsScreen | `ensureGuardianSettingsPage()` | 守护设置 |
| wardListScreen | `ensureWardListPage()` | 被监护人士列表 |
| wardDetailScreen | `ensureWardDetailPage()` | 被监护人士详情 |
| travelHistoryScreen | `ensureTravelHistoryPage()` | 出行历史 |
| myFavoritesScreen | `ensureFavoritesPage()` | 安全守护区域（收藏） |
| postDetailScreen | `ensurePostDetailPage()` | 社区帖子详情 |
| settingsScreen | `ensureSettingsPage()` | 设置页（角色差异化） |
| realNameScreen | `ensureRealNamePage()` | 实名认证 |
| helpFeedbackScreen | `ensureHelpPage()` | 帮助与反馈 |
| changePasswordScreen | `ensureChangePasswordPage()` | 修改密码 |
| dataExportScreen | `ensureDataExportPage()` | 数据导出 |
| userAgreementScreen | `ensureLegalPage('agreement')` | 用户协议 |
| privacyPolicyScreen | `ensureLegalPage('privacy')` | 隐私政策 |
| forgotPasswordScreen | `ensureForgotPasswordPage()` | 忘记密码 |
| fenceDetailScreen | `createFenceDetailPage()`（在 fence.js） | 围栏详情（地图绘制） |
| inviteFamilyScreen | `ensureInviteFamilyPage()` | 邀请家人 |
| familyLocationScreen | `ensureFamilyLocationPage(name)` | 家人位置详情 |

> 共 **20** 个动态创建页面 + **7** 个静态主页面 + **5** 个覆盖层 = **32** 个屏幕，与需求一致。

### 2.3 showScreen() 函数工作原理

`showScreen(screenName)` 是整个 SPA 的核心路由函数（定义于 `App.js` 第 583 行）。其工作流程：

1. **安全收尾**：若切换到 `wake` 且正在导航，先调用 `endNavigation()`。
2. **遍历 screens 数组**：将所有 32 个屏幕 ID 的 DOM 元素 `classList.remove('active')` 并设置 `style.display = 'none'`，确保互斥隐藏。
3. **激活目标屏幕**：将传入 `screenName` 拼接 `'Screen'` 后缀得到目标 ID，添加 `active` 类、设置 `display: flex`，更新 `currentScreen` 全局变量。
4. **TabBar 显隐控制**：仅在 `wake / community / family / my / account` 五个根页面显示底部 Tab 栏，其余页面隐藏。
5. **首次进入懒加载**：进入 `route` 时若 `routeList` 为空，自动调用 `renderRouteList()`。

`screens` 数组完整列表（共 32 项，定义于 `App.js` 第 589 行）：

```js
const screens = [
  'wakeScreen', 'routeScreen', 'navScreen', 'arrivalScreen',
  'communityScreen', 'familyScreen', 'myScreen', 'accountScreen',
  'loginScreen', 'registerScreen', 'messageScreen', 'postDetailScreen',
  'wardDetailScreen', 'wardListScreen', 'messageDetailScreen',
  'fenceManagementScreen', 'guardianSettingsScreen', 'commonAddressesScreen',
  'helpFeedbackScreen', 'favoritesScreen', 'myFavoritesScreen',
  'travelHistoryScreen', 'changePasswordScreen', 'dataExportScreen',
  'userAgreementScreen', 'privacyPolicyScreen', 'forgotPasswordScreen',
  'fenceDetailScreen', 'familyLocationScreen', 'settingsScreen',
  'realNameScreen', 'emergencyContactsScreen', 'inviteFamilyScreen'
];
```

> 新增页面时**必须**在此数组中追加屏幕 ID，否则无法被 `showScreen` 隐藏，会出现多页面重叠。

---

## 3. 核心机制

### 3.1 页面切换：showScreen(screenName)

详见 [2.3](#23-showscreen-函数工作原理)。

调用约定：
- 参数为**屏幕名（不含 `Screen` 后缀）**，如 `showScreen('wake')`、`showScreen('route')`。
- 函数内部自动拼接 `'Screen'` 后缀查找 DOM。
- 已通过 `window.showScreen = showScreen` 暴露到全局，可在 HTML 的 `onclick` 中直接调用。

### 3.2 Tab 切换：switchTab(tab)

定义于 `App.js` 第 620 行。负责底部 Tab 栏切换：

- 入参：`'home' | 'community' | 'family' | 'my'`。
- **家人模式特殊处理**：`userRole === 'family'` 时，`home` Tab 被映射为 `family`（家人模式无首页概念，直接进守护中心）。
- 通过 `document.querySelectorAll('.tab-item')` 清除所有 Tab 的 `active` 类，再为目标 Tab（`#tab` + 首字母大写）添加。
- 根据 Tab 调用 `showScreen`：
  - `home` → `showScreen('wake')`
  - `my` → `showAccountInfo()` + `showScreen('account')`（个人中心，非旧版 myScreen）
  - `community` → `showScreen('community')` + `loadCommunityFeed('feed')`
  - `family` → `showScreen('family')`
- 末尾调用 `triggerHaptic('light')` 提供震动反馈。

### 3.3 函数暴露：window 全局作用域机制

由于项目大量使用 HTML 内联 `onclick="xxx()"` 属性，所有需在 HTML 中被引用的函数**必须**显式挂到 `window` 对象。`App.js` 末尾通过 `window.xxx = xxx;` 形式集中暴露（约 200+ 个函数），分块如下：

- 基础工具：`speak`、`adjustSpeechRate`、`triggerHaptic`、`showFeedback`、`formatTime`
- 页面/Tab：`showScreen`、`switchTab`、`backToHome`
- 唤醒页：`toggleVoiceWake`、`openWakeSearch`、`closeWakeSearch`、`handleSearchInput`、`selectDestination` 等
- 路线/导航：`selectMode`、`renderRouteList`、`startNavigation`、`navTick`、`updateNavProgress`、`enterLastMile` 等
- 摄像头：`openCamera`、`closeCamera`、`updateCameraAI`
- 危险/紧急：`triggerDangerAlert`、`triggerEmergency`、`cancelEmergency`
- 手势：`simulateLongPress`、`simulateSwipeLeft` 等
- 角色/登录：`applyRoleUI`、`completeLogin`、`logout` 等
- 各 ensure*Page 函数对应的进入函数（`openXxx` / `showXxxDetail` 等）

`fence.js` 末尾同样暴露围栏相关函数（`showFenceDetail`、`setDrawMode`、`startDrawFence`、`handleMapClick` 等）。

> **开发约定**：新增任何需在 `onclick` 中调用的函数，必须同时在文件末尾的暴露块添加 `window.functionName = functionName;`，否则会报 `ReferenceError`。

### 3.4 角色差异化：userRole / applyRoleUI / resetRoleSensitivePages

#### userRole 全局变量

- 定义：`var userRole = 'blind';`（默认视障）
- 取值：`'blind'`（视障人士）或 `'family'`（家人）
- 持久化：`localStorage.setItem('tongban_role', userRole)`
- 在 70+ 处条件分支中决定功能可见性。

#### applyRoleUI()

定义于 `App.js` 第 4031 行。在登录成功、角色切换、应用启动恢复会话时调用，负责：

1. **TabBar 调整**：家人模式隐藏 `#tabHome`，剩余 3 个 Tab 平均分配 `flex:1`。
2. **唤醒页调整**：家人模式隐藏 `.wake-voice-container`、`.wake-hint`，仅保留搜索栏。
3. **家人守护页替换**：家人模式调用 `createFamilyDashboard()` 注入守护仪表盘，隐藏默认家人列表。
4. **导航栏标题切换**：家人模式标题为「守护中心」，视障模式为「家人守护」。
5. **设置项过滤**：家人模式隐藏「语音播报 / 震动强度 / 盲道检测 / 危险预警 / 长按播报位置 / 双击重播语音 / 摇一摇紧急求助 / 语音播报速度」等视障专属项，以及「出行设置」「手势操作」整组标题。
6. **危险标记按钮显隐**：仅视障模式在导航页显示「上报危险」浮动按钮。
7. **围栏卡片**：视障模式隐藏家人守护页中的围栏卡片（围栏由家人设置，视障不需要管理）。
8. **同步衍生内容**：调用 `enhanceMyScreenForRole()`、`ensureMessageQuickEntry()`、`refreshMessageData()`。

#### resetRoleSensitivePages()

定义于 `App.js` 第 5430 行。在角色切换（登录/退出）时强制销毁角色相关页面缓存，确保下次进入时按新角色重新渲染：

```js
function resetRoleSensitivePages() {
  var settingsEl = document.getElementById('settingsScreen');
  if (settingsEl) settingsEl.parentNode.removeChild(settingsEl);
  settingsPageCreated = false;
}
```

> 新增任何角色敏感的动态页面，应在此函数中加入对应的 DOM 销毁与 `xxxPageCreated = false` 重置。

### 3.5 登录状态管理

#### 核心变量

- `isLoggedIn`：布尔，当前是否已登录
- `currentUser`：对象或 `null`，当前登录用户对象 `{ name, phone, password, avatarColor, registerDate, totalTrips, emergencyContacts, safeAreas, createdAt }`
- `userInfo`：默认演示用户信息对象（用于未登录场景下的占位）
- `selectedLoginRole`：登录页选中的角色 `'blind' | 'family'`（默认 `'blind'`）

#### localStorage 存储 Key

| Key | 内容 | 读写函数 |
| --- | --- | --- |
| `tongban_users` | 所有注册用户的 JSON 数组 | `getStoredUsers()` / `saveStoredUsers(users)` |
| `tongban_session` | 当前会话 `{ phone, time }` | `getCurrentSession()` / `setCurrentSession(phone)` / `clearCurrentSession()` |
| `tongban_role` | 当前角色 `'blind' \| 'family'` | 直接 `localStorage.setItem` 读写 |

#### 会话恢复流程（`checkLoginStatus()`，第 3718 行）

1. 读取 `tongban_session`。
2. 若存在 `phone`，从 `tongban_users` 中查找匹配用户。
3. 命中则恢复 `isLoggedIn = true`、`currentUser`，并读取 `tongban_role` 恢复 `userRole`。
4. 调用 `applyRoleUI()` 同步 UI。
5. 家人模式则 `setTimeout(switchTab('family'), 100)`。

#### 登录成功流程（`completeLogin(phone)`，第 5435 行）

1. 重置一键登录按钮状态。
2. 从 `tongban_users` 查找用户，未找到则创建临时 demo 用户。
3. 设置 `isLoggedIn = true`、`currentUser = user`、`updateUserInfoFromCurrentUser()`。
4. `setCurrentSession(phone)` 持久化会话。
5. `refreshMyPageUI()` + `resetRoleSensitivePages()`。
6. 非家人模式 `speak('登录成功，欢迎回来')`。
7. 保存角色：`userRole = selectedLoginRole; localStorage.setItem('tongban_role', ...)`。
8. `applyRoleUI()`。
9. 500ms 后按角色跳转：家人→`family` Tab，视障→`wake`。

---

## 4. 功能模块开发指南

每个模块包含：核心函数列表、关键变量、开发注意事项。

### 4.1 语音播报模块

#### 核心函数

| 函数 | 行号 | 用途 |
| --- | --- | --- |
| `speak(text, priority)` | 445 | 主入口，按优先级播报 |
| `doSpeak(text, priority)` | 498 | 实际执行 `speechSynthesis.speak` |
| `addSpeechQueue(text, priority)` | 489 | 入队并按优先级排序 |
| `warmUpSpeech()` | 544 | 预热中文语音引擎，减少首次延迟 |
| `adjustSpeechRate()` | — | 调整语速（0.5/1.0/1.5/2.0） |
| `announce(text)` | — | ARIA live 区域无声音文字提示（辅助读屏） |

#### 关键变量

- `speechRate`：默认 `1.0`
- `currentSpeechPriority`：当前正在播报的优先级
- `speechQueue`：待播报队列数组
- `lastSpeech`：最近一次播报文本，供双击重播
- `speechKeepAliveTimer`：Chrome 长时间播报自动暂停的保活定时器（每 3 秒 `resume()`）

#### 优先级体系（4 级）

| 优先级 | 数值 | 用途 | 打断规则 |
| --- | --- | --- | --- |
| `critical` | 0 | 紧急求助、Critical 危险 | 立即打断，清空队列 |
| `high` | 1 | 导航指引更新、High 危险 | 立即打断，清空队列 |
| `normal` | 2 | 默认（选择目的地、登录提示） | 立即打断，清空队列 |
| `low` | 3 | 摄像头场景识别、手势教程 | 入队，队列长度 ≥ 2 时丢弃；新 `low` 替换旧 `low` |

#### 开发注意事项

- **家人模式跳过**：`speak` 函数首行 `if (userRole === 'family') return;`，家人模式不播报任何语音。
- **必须 `lang='zh-CN'`**：否则部分浏览器会使用英文语音。
- **Chrome 保活 bug**：长时间播报会自动暂停，需每 3 秒 `resume()` 一次（已在 `onstart` 中设置定时器）。
- **预热机制**：首次 `speak` 会有 1-2 秒延迟，已通过 `warmUpSpeech()` 静音预热一次中文语音。
- **队列溢出策略**：`low` 队列长度上限 2，新 `low` 替换旧 `low`；`normal` 队列长度上限 3，溢出替换最旧的 `normal`，避免场景识别堆积。
- 不要直接调用 `window.speechSynthesis.speak()`，必须通过 `speak()` 走优先级队列。

### 4.2 导航模块

#### 核心函数

| 函数 | 行号 | 用途 |
| --- | --- | --- |
| `selectMode(mode)` | — | 选择出行方式（walk/transit/taxi/indoor） |
| `renderRouteList()` | — | 渲染路线列表卡片 |
| `selectRoute(idx)` | — | 选中某条路线 |
| `confirmStartNav()` | — | 点击「开始导航」按钮 |
| `startNavigation()` | 1183 | 进入导航状态、启动 `navTick` 定时器 |
| `navTick()` | 1233 | 每 2 秒推进导航进度 |
| `updateNavProgress()` | 1320 | 更新进度条与剩余距离 |
| `updateGuidanceDisplay()` | 1333 | 更新当前指引文本 |
| `moveMapMarker()` | 1341 | 移动地图当前位置标记 |
| `pauseNavigation()` / `resumeNavigation()` | 1365 | 暂停/继续 |
| `endNavigation(arrived)` | 1375 | 结束导航，进入到达页或回首页 |
| `enterLastMile()` | — | 进入最后一公里模式 |
| `renderLastMileSteps()` / `nextLmStep()` / `goToLmStep(idx)` | — | 最后一公里步骤管理 |
| `simulateTactileDeviation()` | 1526 | 模拟盲道偏离 |
| `correctTactileDeviation()` | — | 纠正盲道偏离 |
| `simulateRouteDeviation()` | 1562 | 模拟路线偏离 |
| `completeReroute()` | — | 完成重新规划 |
| `getGuidanceStepsForMode()` | — | 按当前模式获取对应的指引步骤数据 |

#### 关键变量

- `isNavigating`：是否正在导航
- `isNavPaused`：是否暂停
- `navProgress`：0-100 进度百分比
- `navInterval`：`setInterval` 句柄，2 秒触发 `navTick`
- `currentStepIndex`：当前指引步骤索引
- `guidanceStepsData`：当前导航的指引步骤数组
- `isLastMile`：是否处于最后一公里
- `lmStepIndex`：最后一公里步骤索引
- `selectedMode`：出行方式 `'walk' | 'transit' | 'taxi' | 'indoor'`
- `selectedTransportType`：当 mode 为 transit 时的具体类型 `'metro' | 'bus' | 'brt' | 'tram'`
- `selectedDestination`：目的地名称
- `selectedRouteIndex`：选中的路线索引
- `isOffTrack`：是否盲道偏离
- `offTrackDirection`：偏离方向
- `isRouteOffTrack`：是否路线偏离
- `rerouteCount`：重新规划次数

#### 数据结构

`guidanceSteps` 等多个模式专属步骤数组（`taxiGuidanceSteps`、`busGuidanceSteps`、`metroGuidanceSteps`、`brtGuidanceSteps`、`tramGuidanceSteps`、`mallGuidanceSteps`、`hospitalGuidanceSteps`）每项格式：

```js
{ icon: '🚶', text: '沿当前道路直行200米', sub: '保持在盲道上行走', dist: '1000米', pct: 15 }
```

`getActualMode()`：返回 `selectedMode === 'transit' ? selectedTransportType : selectedMode`，用于根据实际细分模式选择步骤集。

#### 开发注意事项

- **家人模式拦截**：`startNavigation` 首行 `if (userRole === 'family') return`，家人不能导航。
- **进度推进**：`navTick` 每 2 秒推进 2%，约 100 秒完成全程。
- **盲道偏离触发**：仅在 `selectedMode === 'walk'` 且 `cameraOpen` 时随机触发（25% 概率）。
- **路线偏离**：进度 < 80% 时 10% 概率触发。
- **危险预警随机**：8% 概率触发，1.5 秒冷却避免连续打扰。
- **最后一公里触发**：`navProgress >= 85 && selectedMode === 'walk'` 时进入。
- **结束导航路径**：
  - 进度达 100% → `endNavigation(true)` → 进入 arrivalScreen
  - 用户点「结束导航」 → `finishNavigation()`
  - 切换到 `wake` 屏幕但还在导航 → `showScreen('wake')` 内部触发 `endNavigation()`

### 4.3 AI 摄像头模块

#### 核心函数

| 函数 | 行号 | 用途 |
| --- | --- | --- |
| `openCamera(autoOpen = false)` | 1717 | 打开摄像头覆盖层，按场景选择数据集 |
| `closeCamera()` | 1792 | 关闭 |
| `updateCameraAI(text, tags)` | 1806 | 更新 AI 识别结果卡片 |
| `getActualMode()` | 1713 | 获取当前实际出行模式 |

#### 场景模式自动选择

`openCamera` 根据 `isNavigating`、`isLastMile`、`getActualMode()`、`navProgress` 综合判定 `sceneKey`，再从 `aiScenesByMode[sceneKey]` 取数据：

| 场景 Key | 触发条件 |
| --- | --- |
| `environment` | 默认（未导航） |
| `walkNav` | 步行导航中或最后一公里 |
| `taxiFinding` | 打车模式 navProgress < 50 |
| `taxiDriving` | 打车模式 navProgress ≥ 50 |
| `busWaiting / busBoarding / busInside / busAlighting` | 公交模式按 25% 分段 |
| `metroFinding / metroAtGate / metroOnEscalator / metroOnPlatform / metroBoarding / metroInside / metroAlighting` | 地铁按 15% 分段 |
| `brtFinding / brtOnPlatform / brtBoarding / brtInside` | BRT 按 25% 分段 |
| `tramFinding / tramOnPlatform / tramBoarding / tramInside / tramAlighting` | 有轨电车按 20% 分段 |
| `mallEntrance / mallElevator / mallShop` | 商场室内按 35% 分段 |
| `hospitalEntrance / hospitalReception / hospitalClinic` | 医院室内按 35% 分段 |

#### 自动开启策略表

`navTick` 内会根据当前模式与进度，在适当时机自动调用 `openCamera(true)`（且仅触发一次，由 `cameraAutoOpenedForMode` 标记守护）：

| 模式 | 自动开启进度区间 | 播报内容 |
| --- | --- | --- |
| walk | 进入导航即开 | 「摄像头已自动开启，帮您识别盲道和前方障碍」 |
| taxi | 30%–50% | 「帮您识别车辆和车门位置」 |
| bus | 20%–40% | 「帮您确认公交车和上车位置」 |
| metro | 5%–30% | 「帮您识别地铁站入口和闸机」 |
| brt | 10%–30% | 「帮您确认 BRT 站台」 |
| tram | 10%–35% | 「帮您确认有轨电车」 |
| indoor | 0%–30% | 「帮您识别入口位置」 |

#### 关键变量

- `cameraOpen`：是否开启
- `cameraInterval`：场景切换定时器（4 秒一轮）
- `cameraPrompted`：是否已提示过用户
- `cameraAutoOpenedForMode`：当前模式是否已自动开启过（避免重复）

#### 开发注意事项

- **家人模式拦截**：`openCamera` 首行 `if (userRole === 'family') return`。
- **AI 识别结果播报用 `low` 优先级**：避免打断导航指引。
- **场景切换**：每 4 秒在当前数据集中循环切换一条场景识别结果。
- **关闭后清理**：`closeCamera` 必须 `clearInterval(cameraInterval)`。

### 4.4 手势操作模块

#### 6 种手势（视障模式）

| 手势 | 触发函数 | 用途 |
| --- | --- | --- |
| 长按（600ms） | `onLongPress()` | 播报当前位置信息 |
| 双击（300ms 内两次） | `onDoubleTap()` | 重播最近一次语音 |
| 左滑（≥50px） | `onSwipeLeft()` | 打开 AI 摄像头 |
| 右滑（≥50px） | `onSwipeRight()` | 返回上一页/取消操作/关闭摄像头/结束导航 |
| 上滑（≥50px） | `onSwipeUp()` | 确认/下一步（最后一公里推进步骤） |
| 摇一摇 | `onShake()` | 触发紧急求助倒计时 |

家人模式仅保留 2 种手势：右滑返回、上滑确认（其他手势会显示「家人模式不支持」反馈）。

#### 触摸/鼠标事件

通过 `initGestureHandlers()`（第 1996 行）在 `#phoneScreen` 上同时绑定：

- 触摸事件：`touchstart / touchmove / touchend`（`{ passive: true }`）
- 鼠标事件：`mousedown / mousemove / mouseup`（用于桌面端调试）

#### 滑动检测算法

`handleTouchEnd` / `handleMouseUp` 关键阈值：

```js
// 单击/双击判定：移动 < 10px 且时长 < 300ms
if (dt < 300 && Math.abs(dx) < 10 && Math.abs(dy) < 10) {
  // 300ms 内第二次点击 → onDoubleTap
  // 否则 300ms 后无第二次点击 → onSingleTap
}

// 滑动判定：位移 > 50px
if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
  // 横向滑动：dx > 0 右滑，dx < 0 左滑
} else if (Math.abs(dy) > 50 && Math.abs(dy) > Math.abs(dx)) {
  // 纵向：dy < 0 上滑
}
```

长按判定：`touchstart` 后 600ms 未移动且未抬起即触发 `onLongPress`；移动超过 10px 或提前抬起会取消长按定时器。

#### 摇一摇检测

`initShakeDetection()`（第 2266 行）监听 `devicemotion`：

- 间隔 ≥ 100ms 才采样一次
- 三轴加速度差值之和 `dx + dy + dz > 25` 时触发 `onShake()`
- 持续更新 `shakeLastX/Y/Z` 作为基准

#### 关键变量

- `touchStartX/Y/Time`、`mouseStartX/Y/Time`
- `lastTapTime`：上次单击时间戳，用于双击判定
- `longPressTimer` / `mouseLongPressTimer`：长按定时器
- `isLongPress` / `isMouseLongPress`：是否已触发长按

#### 开发注意事项

- **passive listener**：触摸事件使用 `{ passive: true }`，不可调用 `preventDefault()`。
- **家人模式手势反馈**：每个 `on*` 函数开头判断 `userRole === 'family'` 后 `showFeedback('家人模式不支持 xxx')` 并 return。
- 摇一摇在家人模式下不触发紧急求助（家人是接收方）。

### 4.5 家人守护模块

#### 仪表盘

`createFamilyDashboard()`（第 ~3900 行附近）在家人模式下注入 `#familyDashboard` 到 familyScreen，包含：

- 状态概览横幅（在线人数、安全区域数、今日越界数）
- 家人列表卡片（头像、状态、位置、电话快捷按钮）
- 围栏列表卡片

#### 围栏（fence.js）

独立 IIFE 文件，关键函数：

| 函数 | 用途 |
| --- | --- |
| `createFenceDetailPage()` | 创建围栏详情页 DOM |
| `renderAllFences()` | 在 SVG 上绘制所有围栏区域 |
| `renderFenceList()` | 渲染右侧围栏列表 |
| `setDrawMode('polygon' \| 'circle')` | 切换绘制模式 |
| `startDrawFence()` / `cancelDraw()` / `finishDraw()` | 绘制流程控制 |
| `handleMapClick(event)` | 地图点击添加顶点 |
| `toggleFenceAreaEnabled(id, el)` | 启用/禁用单个围栏 |
| `editFenceArea(id)` | 编辑围栏 |
| `toggleFenceMain()` | 总开关 |
| `toggleBoundaryWarning(el)` | 接近边界预警开关 |
| `toggleReminderMethod()` | 切换越界提醒方式 |

#### 围栏数据结构

```js
let fenceAreas = [
  {
    id: 'home',
    name: '家',
    type: 'circle' | 'polygon',
    radius: 500,            // type=circle 时有效
    color: '#34C759',
    address: '朝阳区幸福小区',
    enabled: true,
    center: { x: 120, y: 90 },  // type=circle 时有效
    points: [{ x, y }, ...]     // type=polygon 时有效
  }
];
```

#### 被监护人士 / 邀请

- `ensureWardListPage()` / `ensureWardDetailPage()`：被监护人士列表与详情
- `openInviteFamily()` / `ensureInviteFamilyPage()`：邀请家人加入守护
- `inviteLinkGenerated`：是否已生成邀请链接
- 邀请方式：微信、短信、二维码、复制链接
- `viewFamilyLocation(name)` / `ensureFamilyLocationPage(name)`：家人位置详情页

#### 开发注意事项

- 家人模式不显示「危险标记」浮动按钮、不能调用导航功能。
- 围栏绘制依赖 SVG 坐标系，新增围栏需保证 `points` 至少 3 个顶点。
- `fence.js` 内部也定义了 `speak` / `showFeedback` / `triggerHaptic` 的本地实现（避免依赖 App.js 加载顺序）。

### 4.6 社区模块

#### 4 个 Tab

| Tab Key | 名称 | 数据源 |
| --- | --- | --- |
| `feed` | 推荐 | `communityFeedData.feed` |
| `danger` | 危险标记 | `communityFeedData.danger` |
| `route` | 路线分享 | `communityFeedData.route` |
| `tips` | 出行贴士 | `communityFeedData.tips` |

家人版数据源 `familyCommunityFeedData`（聚焦守护经验、家人关怀、安全提醒）。

#### 核心函数

| 函数 | 行号 | 用途 |
| --- | --- | --- |
| `loadCommunityFeed(tab)` | 2510 | 渲染当前 Tab 内容流 |
| `switchCommunityTab(tab, el)` | 2573 | 切换 Tab |
| `likePost(el)` | 2595 | 点赞 |
| `createPost()` | 3241 | 打开发帖弹窗 |
| `likePostDetail()` | 5193 | 帖子详情点赞 |
| `ensurePostDetailPage()` | 5131 | 创建帖子详情页 |

#### 危险标记上报

- 导航页右下角「上报危险」浮动按钮（仅视障模式，由 `ensureNavDangerButton()` 创建）
- `closeNavDangerPost()` / `submitNavDangerPost()`：提交危险提醒
- 提交后会推送到社区危险标记 Tab 与消息中心

#### 数据结构

```js
{
  avatarColor: '#007AFF', username: '王大哥', time: '10分钟前',
  badge: '' | 'top' | 'danger' | 'route' | 'expert' | 'star',
  text: '今天从家到万达广场走的是盲道...',
  location: '建设路 → 万达广场',
  tags: ['#盲道推荐', '#出行经验'],
  likes: 23, comments: 5, shares: 3,
  isDanger: true,  // 可选
  isRoute: true    // 可选
}
```

#### 开发注意事项

- 社区内容按 `userRole` 选择数据源：`var dataSource = userRole === 'family' ? familyCommunityFeedData : communityFeedData;`
- 危险标记卡片使用红色左边框（`.community-card.danger`）。
- 路线分享卡片使用蓝色左边框（`.community-card.route`）。

### 4.7 登录注册模块

#### 角色选择

登录页顶部提供两个角色卡片：视障人士（默认选中）、家人。点击通过 `selectLoginRole(role)` 切换 `selectedLoginRole`，并同步按钮样式。

#### 3 种登录方式

| 方式 | Tab Key | UI 函数 |
| --- | --- | --- |
| 一键登录（默认） | `quick` | `doQuickLogin()` 模拟运营商一键登录 |
| 验证码登录 | `sms` | `sendSmsCode()` + `doSmsLogin()` |
| 密码登录 | `password` | `doPasswordLogin()` |

通过 `switchLoginMode(mode)` 切换 Tab，控制 `#phoneInputWrap`、`#quickLoginForm` 等区域的显隐。

#### 第三方登录

登录页底部提供微信、QQ、Apple ID 三个第三方登录入口（`loginWithWechat`、`loginWithQQ`、`loginWithApple`，目前为 demo 模拟）。

#### 会话管理

详见 [3.5 登录状态管理](#35-登录状态管理)。

#### 核心函数

| 函数 | 行号 | 用途 |
| --- | --- | --- |
| `selectLoginRole(role)` | — | 选择角色 |
| `switchLoginMode(mode)` | — | 切换登录方式 |
| `doQuickLogin()` | — | 一键登录 |
| `sendSmsCode()` | — | 发送验证码 |
| `doSmsLogin()` | — | 验证码登录 |
| `doPasswordLogin()` | — | 密码登录 |
| `completeLogin(phone)` | 5435 | 登录成功后统一处理 |
| `completeRegister(phone, password)` | ~5777 | 注册成功后统一处理 |
| `logout()` | — | 退出登录，清除会话 |

#### 开发注意事项

- **角色保存**：登录成功后 `userRole = selectedLoginRole`，并写入 `localStorage`。
- **页面缓存重置**：`completeLogin` 调用 `resetRoleSensitivePages()`，确保切换角色后设置页等按新角色重新生成。
- **一键登录按钮状态恢复**：`completeLogin` 开头重置 `quickLoginBtn` 的 `pointerEvents` 和 `opacity`，防止退出后再登录按钮无响应。
- **忘记密码**：`ensureForgotPasswordPage()` 创建独立的忘记密码流程页。

### 4.8 紧急求助模块

#### 触发方式

1. **摇一摇**：`onShake()` → `triggerEmergency()`
2. **控制面板按钮**：`toggleEmergency()`
3. **导航页或其他页面的紧急按钮**

#### 3 秒倒计时

`triggerEmergency()`（第 1864 行）：

1. 显示 `#emergencyOverlay`，先显示倒计时数字 `#emergencyCountdown`，隐藏主内容。
2. `emergencyCountdownValue = 3`，每秒递减。
3. 每秒 `triggerHaptic('medium')` 震动反馈。
4. 倒计时归零 → `confirmEmergency()` 正式触发。
5. 期间可点击「停止呼叫」按钮或上滑 → `cancelEmergency()` 取消。
6. 播报：「紧急求助倒计时，3 秒后自动呼叫，摇动或点击停止可取消」（`critical` 优先级）。

#### SOS 覆盖层

`confirmEmergency()` 后显示：

- 紧急联系人呼叫列表（李女士正在呼叫、张先生等待接通）
- 「停止呼叫」按钮
- 三层环形动画脉冲（`@keyframes sosRing`）

#### 关键变量

- `emergencyCountdownTimer`：倒计时定时器
- `emergencyCountdownValue`：当前倒计时数字
- `emergencyConfirmed`：是否已正式触发（区分倒计时取消与呼叫中取消）

#### 开发注意事项

- **家人模式不触发**：`onShake` 在 `userRole === 'family'` 时直接 return。
- **重复触发防护**：`onShake` 检查 `emergencyOverlay` 是否已显示，避免重复触发。
- **触发后联动**：会推送到家人端消息中心（`type: 'alert'`，`icon: 'sos'`），家人会收到「张先生触发紧急求助」通知。

### 4.9 我的页面模块

#### 数据统计卡片

个人中心（`accountScreen`，通过 `createAccountPage()` 创建）顶部展示：

- 大头像（基于手机号哈希生成颜色）
- 用户名、手机号（脱敏 `138****8888`）
- 注册时间
- 数据卡片：累计出行次数、紧急联系人数、安全区域数

#### 角色差异化

- **视障模式**：显示出行统计、安全区域、紧急联系人快捷入口、出行历史等。
- **家人模式**：显示守护统计、被监护人士数、围栏数、守护设置入口。

通过 `enhanceMyScreenForRole()`（在 `applyRoleUI` 中调用）动态调整。

#### 核心函数

| 函数 | 用途 |
| --- | --- |
| `createAccountPage()` | 创建个人中心页 |
| `showAccountInfo()` | 刷新个人中心数据 |
| `refreshMyPageUI()` | 刷新旧版 myScreen |
| `handleMyHeaderClick()` | 点击头部跳转账号详情 |
| `enhanceMyScreenForRole()` | 按角色调整内容 |

#### 旧版 myScreen

`tongban-demo.html` 中保留了 `#myScreen`（旧版设置入口页），但 `switchTab('my')` 实际跳转到 `accountScreen`。`myScreen` 中的设置项在家人模式下被 `applyRoleUI` 过滤隐藏。

### 4.10 设置模块

#### 角色差异化设置内容

通过 `ensureSettingsPage()`（第 6103 行）创建，根据 `userRole` 渲染不同分组：

| 分组 | 视障模式 | 家人模式 |
| --- | --- | --- |
| 账号与安全 | 修改密码、实名认证、数据导出、账号注销 | 同视障 |
| 出行设置 | 语音播报、震动反馈、震动强度、盲道检测、危险预警 | 隐藏 |
| 手势操作 | 长按播报位置、双击重播语音、摇一摇紧急求助、语音播报速度、手势操作说明 | 隐藏 |
| 守护设置（家人专属） | — | 围栏提醒、位置共享频率、被监护人异常提醒 |
| 通知与消息 | 消息提醒、危险预警推送、社区互动通知 | 同视障 + 围栏越界通知 |
| 关于 | 版本信息、使用帮助、用户协议、隐私政策 | 同视障 |

#### 核心函数

| 函数 | 行号 | 用途 |
| --- | --- | --- |
| `ensureSettingsPage()` | 6103 | 创建设置页 |
| `toggleSwitch(el)` | — | 通用开关切换 |
| `adjustVibrationIntensity()` | — | 震动强度选择 |
| `adjustSpeechRate()` | — | 语速选择 |
| `openGestureTutorial()` | 1942 | 打开手势教程 |

#### 重置机制

`resetRoleSensitivePages()` 在登录/退出时移除 `settingsScreen` DOM 并重置 `settingsPageCreated = false`，确保下次进入按当前角色重新渲染。

---

## 5. 全局变量清单

### 5.1 核心状态变量

| 变量 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `currentTab` | string | `'home'` | 当前激活的底部 Tab |
| `currentScreen` | string | `'wake'` | 当前显示的屏幕名（不含 `Screen` 后缀） |
| `userRole` | string | `'blind'` | 当前角色 `'blind' \| 'family'` |
| `isLoggedIn` | boolean | `false` | 是否已登录 |
| `currentUser` | object \| null | `null` | 当前用户对象 |
| `userInfo` | object | 默认 demo 用户 | 演示用占位用户信息 |
| `selectedLoginRole` | string | `'blind'` | 登录页选中的角色 |

### 5.2 导航相关

| 变量 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `isNavigating` | boolean | `false` | 是否正在导航 |
| `isNavPaused` | boolean | `false` | 导航是否暂停 |
| `navProgress` | number | `0` | 导航进度 0-100 |
| `navInterval` | number \| null | `null` | `setInterval` 句柄 |
| `selectedMode` | string | `'walk'` | 出行方式 `'walk' \| 'transit' \| 'taxi' \| 'indoor'` |
| `selectedTransportType` | string | `'walk'` | 公共交通细分 `'metro' \| 'bus' \| 'brt' \| 'tram'` |
| `selectedDestination` | string | `'星巴克咖啡'` | 目的地名称 |
| `selectedRouteIndex` | number | `0` | 选中路线索引 |
| `selectedTransitIndex` | number | `0` | 选中公共交通方案索引 |
| `selectedRoute` | object \| null | `null` | 选中的路线对象 |
| `isLastMile` | boolean | `false` | 是否处于最后一公里 |
| `lmStepIndex` | number | `0` | 最后一公里步骤索引 |
| `currentStepIndex` | number | `0` | 当前指引步骤索引 |
| `guidanceStepsData` | array | `[]` | 当前导航的指引步骤数组 |
| `isOffTrack` | boolean | `false` | 是否盲道偏离 |
| `offTrackDirection` | string | `''` | 偏离方向 |
| `isRouteOffTrack` | boolean | `false` | 是否路线偏离 |
| `rerouteCount` | number | `0` | 重新规划次数 |

### 5.3 紧急求助相关

| 变量 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `isEmergency` | boolean | `false` | 是否处于紧急求助状态 |
| `emergencyCountdownTimer` | number \| null | `null` | 倒计时定时器 |
| `emergencyCountdownValue` | number | `0` | 当前倒计时数字 |
| `emergencyConfirmed` | boolean | `false` | 是否已正式触发（非倒计时阶段） |

### 5.4 摄像头相关

| 变量 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `cameraOpen` | boolean | `false` | 摄像头是否开启 |
| `cameraAutoOpen` | boolean | `false` | 是否自动开启（区别于用户手动） |
| `cameraInterval` | number \| null | `null` | 场景切换定时器 |
| `cameraPrompted` | boolean | `false` | 是否已提示过用户 |
| `cameraAutoOpenedForMode` | boolean | `false` | 当前模式是否已自动开启过 |

### 5.5 语音相关

| 变量 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `speechRate` | number | `1.0` | 语速 |
| `currentSpeechPriority` | string | `'normal'` | 当前播报优先级 |
| `speechQueue` | array | `[]` | 待播报队列 |
| `lastSpeech` | string | `''` | 最近一次播报文本 |
| `speechKeepAliveTimer` | number \| null | `null` | Chrome 保活定时器 |
| `speechReady` | boolean | `false` | 引擎是否已预热 |

### 5.6 邀请/家人相关

| 变量 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `inviteLinkGenerated` | boolean | `false` | 是否已生成邀请链接 |
| `inviteFamilyPageCreated` | boolean | `false` | 邀请页是否已创建 |
| `familyLocationCreated` | boolean | `false` | 家人位置页是否已创建 |
| `familyDashboardCreated` | boolean | `false` | 家人仪表盘是否已创建 |

### 5.7 消息中心

| 变量 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `currentMessageFilter` | string | `'all'` | 当前消息过滤 `'all' \| 'alert' \| 'family' \| 'community' \| 'system'` |
| `messageCenterCreated` | boolean | `false` | 消息中心是否已创建 |
| `blindMessageData` / `familyMessageData` | array | — | 视障/家人版消息数据 |

### 5.8 危险预警

| 变量 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `lastDangerAlert` | number | `0` | 上次危险预警时间戳 |
| `DANGER_COOLDOWN` | number | `15000` | 危险预警冷却时间（15 秒） |

### 5.9 室内导航

| 变量 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `currentFloor` | number | `1` | 当前楼层 |
| `selectedPOI` | number \| null | `null` | 选中的 POI 索引 |

### 5.10 语音唤醒

| 变量 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `isListening` | boolean | `false` | 是否正在聆听语音 |
| `voiceTimer` | number \| null | `null` | 语音监听超时定时器 |
| `isVoiceSearching` | boolean | `false` | 搜索页是否在语音输入 |
| `voiceSearchTimer` | number \| null | `null` | 搜索语音超时定时器 |

### 5.11 手势相关

| 变量 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `touchStartX/Y/Time` | number | `0` | 触摸起点 |
| `mouseStartX/Y/Time` | number | `0` | 鼠标起点 |
| `lastTapTime` | number | `0` | 上次单击时间戳 |
| `longPressTimer` | number \| null | `null` | 长按定时器 |
| `isLongPress` / `isMouseLongPress` | boolean | `false` | 是否已触发长按 |
| `shakeLastX/Y/Z` | number | `0` | 上次加速度基准 |
| `shakeLastTime` | number | `0` | 上次摇一摇时间戳 |

---

## 6. 设计规范实现

### 6.1 色彩系统（Apple 设计令牌）

所有颜色通过 CSS 变量在 `:root` 中集中声明（`tongban-demo.html` 内联样式开头）：

```css
:root {
  /* 主色 */
  --apple-blue: #007AFF;          /* 主操作色、链接 */
  --apple-blue-deep: #5856D6;     /* 渐变深色端 */
  --apple-system-indigo: #5856D6;
  --apple-system-purple: #AF52DE;
  --apple-system-pink: #FF2D55;

  /* 灰阶（6 级） */
  --apple-gray: #8E8E93;
  --apple-gray-2: #AEAEB2;
  --apple-gray-3: #C7C7CC;
  --apple-gray-4: #D1D1D6;
  --apple-gray-5: #E5E5EA;
  --apple-gray-6: #F2F2F7;        /* 背景灰 */

  /* 基础色 */
  --apple-white: #FFFFFF;
  --apple-black: #1D1D1F;
  --apple-label: #1D1D1F;
  --apple-label-secondary: #86868B;
  --apple-label-tertiary: #C7C7CC;

  /* 系统功能色 */
  --apple-system-green: #34C759;
  --apple-system-orange: #FF9500;
  --apple-system-red: #FF3B30;
  --apple-system-yellow: #FFCC00;
  --apple-system-teal: #30B0C7;
}
```

使用规范：
- **主操作按钮**：`linear-gradient(135deg, #007AFF 0%, #5856D6 100%)`，配 `box-shadow: 0 4px 12px rgba(0,122,255,0.3)`
- **危险按钮**：`--apple-system-red`
- **成功状态**：`--apple-system-green`
- **次要文本**：`--apple-label-secondary`
- **背景**：`--apple-gray-6`（页面）、`--apple-white`（卡片）

### 6.2 字体栈

```css
--font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display',
               'SF Pro Text', 'PingFang SC', 'Helvetica Neue',
               'Microsoft YaHei', sans-serif;
```

字号约定（参考 Apple HIG）：

| 用途 | 字号 | 字重 |
| --- | --- | --- |
| 大标题 | 22-28px | 700 |
| 页面标题 | 17px | 600 |
| 卡片标题 | 15-16px | 600 |
| 正文 | 14-15px | 400-500 |
| 辅助说明 | 12-13px | 400 |
| 标签/角标 | 10-11px | 500-600 |

### 6.3 圆角分级（8 级）

```css
--radius-s: 8px;      /* 小元素：开关、小卡片 */
--radius-m: 10px;     /* 输入框 */
--radius-l: 12px;     /* 卡片、列表项 */
--radius-xl: 16px;    /* 主卡片、按钮 */
--radius-2xl: 20px;   /* 顶部导航卡片、大模块 */
--radius-full: 9999px;/* 圆形头像、胶囊按钮 */
/* 另有 14px（中等卡片）、24px（大头像）行内使用 */
```

### 6.4 阴影分级（4 级）

```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.03);          /* 卡片默认 */
--shadow-md: 0 2px 8px rgba(0, 0, 0, 0.06);           /* 浮起卡片 */
--shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.12);          /* 弹窗 */
--shadow-xl: 0 20px 40px rgba(0, 0, 0, 0.15);         /* 大型模态 */
```

特殊阴影：
- 主按钮：`0 4px 12px rgba(0, 122, 255, 0.3)`（带主色染色）
- 紧急按钮：`0 4px 12px rgba(255, 59, 48, 0.3)`

### 6.5 间距分级（8 级）

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
```

页面通用 padding：`var(--space-4)`（16px），卡片间距 `var(--space-3)`（12px）。

### 6.6 缓动函数

全局统一使用 Apple 风格缓动：

```css
transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
```

- 0.2s：按钮、Tab 切换等即时反馈
- 0.3s：卡片显隐、覆盖层滑入
- 0.4s：摄像头覆盖层、唤醒按钮脉冲

### 6.7 按压反馈

所有可点击元素统一使用 `scale(0.98)` 表示按压：

```css
.btn-primary:active { transform: scale(0.98); }
.route-card:active { transform: scale(0.98); }
.mode-item:active { transform: scale(0.92); }    /* 小图标更夸张 */
.wake-voice-btn:active { transform: scale(0.95); }
```

配合 `box-shadow` 减弱，营造「按下」质感。

### 6.8 毛玻璃效果

顶部导航栏、底部 Tab 栏、覆盖层卡片大量使用：

```css
background: rgba(255, 255, 255, 0.92);
backdrop-filter: blur(20px) saturate(180%);
-webkit-backdrop-filter: blur(20px) saturate(180%);
border-bottom: 0.5px solid rgba(0, 0, 0, 0.06);
```

封装为变量：`--blur-effect: blur(20px) saturate(180%);`

---

## 7. 无障碍开发规范

### 7.1 ARIA 属性使用规范

每个屏幕根 `div` 必须包含 `role` 与 `aria-label`：

```html
<div class="screen" id="wakeScreen" role="main" aria-label="首页 语音唤醒">...</div>
<div class="screen" id="navScreen" role="main" aria-label="导航中">...</div>
```

常用模式：

| 场景 | ARIA 写法 |
| --- | --- |
| 按钮 | `role="button" tabindex="0" aria-label="搜索目的地"` |
| 开关 | `role="switch" aria-checked="true"` |
| Tab 列表 | 父 `role="tablist"`，子 `role="tab" aria-selected="true/false" tabindex="0/-1"` |
| 列表项 | `role="listitem" tabindex="0"` |
| 模态 | `role="dialog" aria-modal="true" aria-label="..."` |
| 进度条 | `aria-valuenow` / `aria-valuemin` / `aria-valuemax` |
| 自动补全 | `aria-autocomplete="list" aria-controls="..." aria-activedescendant="..."` |
| 装饰性 SVG | `aria-hidden="true"` |

### 7.2 键盘导航实现

所有可交互元素必须支持 `Enter` 与 `Space` 键触发：

```js
btn.onkeydown = function(e) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    openMessageCenter();
  }
};
```

搜索框支持方向键导航建议列表：

- `handleWakeSearchKeydown(e)`：处理 ↑/↓ 选择、Enter 确认、Esc 关闭
- `handleSearchKeydown(e)`：路线规划页搜索建议

### 7.3 语音播报集成

每个用户操作都应配合 `speak()` 语音反馈，遵循优先级规范：

| 操作类型 | 优先级 | 示例 |
| --- | --- | --- |
| 选择目的地 | `normal` | `speak('已选择' + name + '，正在规划路线')` |
| 开始/结束导航 | `normal` | `speak('导航开始，' + guidanceStepsData[0].text)` |
| 导航指引更新 | `high` | `speak(guidanceStepsData[i].text, 'high')` |
| 危险预警（critical） | `critical` | `speak(scene.text, 'critical')` |
| 危险预警（high） | `high` | `speak(scene.text, 'high')` |
| 摄像头场景识别 | `low` | `speak(text, 'low')` |
| 手势教程 | `low` | `speak(descriptions[order[idx]], 'low')` |
| 紧急求助倒计时 | `critical` | `speak('紧急求助倒计时，3秒后自动呼叫...', 'critical')` |

辅助 `announce(text)`：写入 ARIA live 区域（`aria-live="polite"`），供读屏软件朗读无声文字提示。

### 7.4 焦点管理（showScreen 增强）

切换屏幕时应将焦点移到新屏幕，便于读屏软件跟踪。推荐实践：

- 新屏幕根 `div` 添加 `tabindex="-1"` 并调用 `.focus()`
- 关闭覆盖层时将焦点返回到触发元素
- 模态打开时阻止焦点离开模态（焦点陷阱）

---

## 8. 调试与测试

### 8.1 控制面板（9 个分区）

`tongban-demo.html` 末尾的 `.control-panel` 是开发者调试用浮动面板，包含 9 个分区：

| 分区 | 包含按钮 |
| --- | --- |
| 登录与角色 | 登录页、视障版登录、家人版登录、退出登录 |
| 页面导航 | 唤醒页、路线规划、开始导航、结束导航、到达页 |
| 我的页面 | 我的、设置、实名认证、紧急联系人、出行历史、安全守护区域、常用地址 |
| 家人版功能 | 家人守护页、被监护人士列表、围栏管理、守护设置、家人位置详情、消息中心 |
| 社区功能 | 社区首页、发布动态 |
| 手势模拟 | 长按、双击、单击、左滑、右滑、上滑、摇一摇 |
| 预警测试 | 低/中/高/紧急 四级危险预警 |
| 导航功能测试 | 盲道偏离、路线偏离、最后一公里、室内楼层导航、紧急求助 |
| 出行模式 | 步行、公共交通、网约车、室内 |

> 小屏幕（≤ 900px）下控制面板自动移到底部，避免遮挡手机模拟器。

### 8.2 测试函数清单（test* 系列）

| 函数 | 行号 | 用途 |
| --- | --- | --- |
| `testMode(mode)` | 2334 | 测试指定出行模式 |
| `testFloorNav()` | 2743 | 测试室内楼层导航 |
| `testCommunity()` | 2749 | 进入社区首页 |
| `testFamily()` | 2754 | 进入家人守护页 |
| `testLogin(role)` | 2759 | 模拟视障/家人登录 |
| `testLogout()` | 2764 | 退出登录 |
| `testMyPage()` | 2768 | 进入我的页面 |
| `testSettings()` | 2772 | 进入设置页面 |
| `testRealName()` | 2777 | 进入实名认证 |
| `testEmergencyContacts()` | 2782 | 进入紧急联系人 |
| `testArrival()` | 2787 | 进入到达页 |
| `testWardList()` | 2791 | 进入被监护人士列表 |
| `testFenceManagement()` | 2796 | 进入围栏管理 |
| `testGuardianSettings()` | 2801 | 进入守护设置 |
| `testFamilyLocation()` | 2806 | 进入家人位置详情 |
| `testMessageCenter()` | 2811 | 进入消息中心 |
| `testTravelHistory()` | 2815 | 进入出行历史 |
| `testFavorites()` | 2820 | 进入安全守护区域 |
| `testCommonAddresses()` | 2825 | 进入常用地址 |
| `testCreatePost()` | 2830 | 打开发帖弹窗 |

### 8.3 模拟函数清单（simulate* 系列）

| 函数 | 行号 | 用途 |
| --- | --- | --- |
| `simulateLongPress()` | 2306 | 模拟长按手势 |
| `simulateDoubleTap()` | 2310 | 模拟双击手势 |
| `simulateSingleTap()` | 2314 | 模拟单击手势 |
| `simulateSwipeLeft()` | 2318 | 模拟左滑手势 |
| `simulateSwipeRight()` | 2322 | 模拟右滑手势 |
| `simulateSwipeUp()` | 2326 | 模拟上滑手势 |
| `simulateShake()` | 2330 | 模拟摇一摇 |
| `simulateTactileDeviation()` | 1526 | 模拟盲道偏离 |
| `simulateRouteDeviation()` | 1562 | 模拟路线偏离 |
| `simulateFenceCheck()` | 7188 | 模拟围栏检测 |

### 8.4 浏览器缓存清理

调试时遇到样式或函数不更新，按以下顺序清理：

1. **硬刷新**：`Ctrl + Shift + R`（Windows）或 `Cmd + Shift + R`（Mac）
2. **DevTools 强制禁用缓存**：F12 → Network → 勾选「Disable cache」
3. **清空 localStorage**：DevTools → Application → Local Storage → 右键 Clear
4. **注销 Service Worker**：DevTools → Application → Service Workers → Unregister
5. **清空 IndexedDB / Cache Storage**：DevTools → Application → 对应项 Clear

> 项目未使用 Service Worker，但若浏览器自动注册了某些 SW，需手动注销。

---

## 9. 开发约定

### 9.1 新增页面步骤

以新增 `xxxScreen` 为例：

1. **创建 `ensureXxxPage` 函数**：

```js
var xxxPageCreated = false;
function ensureXxxPage() {
  if (xxxPageCreated) return;
  var page = document.createElement('div');
  page.id = 'xxxScreen';
  page.className = 'screen';
  page.setAttribute('role', 'main');
  page.setAttribute('aria-label', '页面用途');
  page.style.cssText = 'background:#F2F2F7;padding-top:47px;display:none;flex-direction:column;overflow:hidden;';
  page.innerHTML = '...';  // 字符串拼接
  var phoneScreen = document.querySelector('.phone-screen') || document.body;
  phoneScreen.appendChild(page);
  xxxPageCreated = true;
}
```

2. **加入 screens 数组**：在 `App.js` 第 589 行的 `screens` 数组末尾追加 `'xxxScreen'`，否则 `showScreen` 无法隐藏它。

3. **暴露 window**：在文件末尾的暴露块添加 `window.ensureXxxPage = ensureXxxPage;`，以及任何从 HTML `onclick` 调用的辅助函数 `window.openXxx = openXxx;`。

4. **创建进入函数**（可选）：

```js
function openXxx() {
  ensureXxxPage();
  showScreen('xxx');
  speak('正在进入 xxx', 'normal');
  triggerHaptic('light');
}
window.openXxx = openXxx;
```

5. **若为角色敏感页**：在 `resetRoleSensitivePages()` 中加入销毁逻辑：

```js
var el = document.getElementById('xxxScreen');
if (el) el.parentNode.removeChild(el);
xxxPageCreated = false;
```

### 9.2 新增函数暴露规范

**任何需要在 HTML `onclick="..."` 中调用的函数，必须显式挂到 `window`**：

```js
// 在文件末尾的暴露块
window.myNewFunction = myNewFunction;
```

仅在 JS 内部调用的函数（不通过 `onclick`）无需暴露。

`fence.js` 末尾也需独立暴露（不依赖 App.js 加载顺序）。

### 9.3 代码风格

项目使用 ES5 兼容写法，**不使用** ES6+ 语法（个别 `const`/`let`/箭头函数/模板字符串除外，建议新代码也保持一致）：

| 风格项 | 约定 | 示例 |
| --- | --- | --- |
| 变量声明 | `var`（核心状态变量使用 `let` 也可） | `var isLoggedIn = false;` |
| 函数声明 | `function` 关键字声明（非箭头函数赋值） | `function speak(text) { ... }` |
| 字符串拼接 | `+` 拼接，**不使用模板字符串**（保持一致性） | `'<div>' + name + '</div>'` |
| 对象字面量 | ES5 兼容写法 | `{ id: 1, name: 'foo' }` |
| 比较运算符 | 推荐严格 `===`，但已有大量 `==` | `if (userRole === 'family')` |
| 引号 | 字符串单引号 `'...'`，HTML 内双引号 `"..."` | `'<div class="x">'` |
| 缩进 | 2 空格 | — |

### 9.4 避免重复定义函数

JavaScript 中**后定义的函数会覆盖先定义的**，已踩过的坑：

- `ensureFavoritesPage` 在第 4960 行和第 6334 行各定义一次（后者覆盖前者）
- `ensureTravelHistoryPage` 在第 4915 行和第 6379 行各定义一次

**约定**：
- 新增/修改函数前先用全局搜索确认是否已存在同名函数
- 若需保留多个版本，使用不同函数名（如 `ensureFavoritesPageV2`）
- 角色敏感的页面应在 `resetRoleSensitivePages()` 中彻底销毁 DOM 并重置 `xxxPageCreated`，避免脏状态

### 9.5 其他约定

- **不引入框架/库**：保持纯原生 JS，依赖仅 Font Awesome CDN（图标）。
- **所有 SVG 图标**：使用 `tongban-demo.html` 顶部的 `<symbol>` 定义，通过 `<use href="#icon-xxx">` 复用。
- **localStorage 容错**：所有读写都包裹 `try/catch`，避免隐私模式下崩溃。
- **触觉反馈**：所有用户可点击元素触发后调用 `triggerHaptic('light' | 'medium' | 'heavy' | 'double' | 'triple')`。
- **角色守卫**：每个视障专属功能函数首行检查 `if (userRole === 'family') return;` 或 `showFeedback('家人模式不支持 xxx', 'info');`。
- **不要修改 fence.js 之外的围栏逻辑**：围栏绘制、顶点编辑等全部封装在 fence.js IIFE 内，App.js 仅负责进入入口（`openFenceManagement` / `showFenceDetail`）。

---

## 附录：快速入口

| 入口 | 文件 | 说明 |
| --- | --- | --- |
| 主页面 | `tongban-demo.html` | 浏览器直接打开即可运行 |
| 主逻辑 | `App.js` | 通过 `<script src="app.js">` 加载（HTML 中引用为小写，Windows 不区分大小写） |
| 围栏模块 | `fence.js` | 在 App.js 之后加载 |
| 调试面板 | `tongban-demo.html` 末尾 `.control-panel` | 9 个分区测试按钮 |
| 本地服务器 | `server.js` | `node server.js` 启动（可选） |
| 项目需求 | `PRD.md` | 产品需求文档 |

---

**文档结束**
