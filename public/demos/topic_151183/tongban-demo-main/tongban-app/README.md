# 瞳伴 App - AI视障出行助手

面向视障人士的智能出行导航App，融合AI计算机视觉、语音交互和精准导航技术。
基于 **Cordova** 构建，支持 **Android** 和 **iOS** 双平台。

---

## 项目结构

```
tongban-app/
├── www/                    # Web应用源代码
│   ├── index.html          # 主页面
│   └── js/
│       ├── app.js          # 主应用逻辑（从Demo拷贝）
│       ├── fence.js        # 安全围栏模块（从Demo拷贝）
│       └── cordova-app.js  # Cordova移动端适配层
├── platforms/              # 平台工程（cordova prepare 生成）
│   ├── android/            # Android工程
│   └── ios/                # iOS工程
├── plugins/                # Cordova插件（自动安装）
├── res/                    # 资源文件
│   ├── icon/               # 应用图标
│   └── splash/             # 启动页
├── scripts/                # 构建脚本
│   ├── copy-www.js         # 从父项目同步源码
│   ├── add-plugins.js      # 批量安装插件
│   ├── dev-server.js       # 本地开发服务器
│   └── clean.js            # 清理构建产物
├── config.xml              # Cordova配置文件
├── package.json            # 项目配置
└── README.md               # 本文档
```

---

## 环境要求

### 通用环境
- **Node.js** >= 16.0.0
- **npm** >= 8.0.0
- **Cordova CLI** >= 12.0.0

### Android 构建
- **JDK** >= 17
- **Android SDK** (API Level 34)
- **Gradle** >= 8.0
- 环境变量：`ANDROID_HOME`, `JAVA_HOME`

### iOS 构建
- **macOS** >= 13.0
- **Xcode** >= 15.0
- **CocoaPods** >= 1.12.0
- 配置：Apple Developer 账号

---

## 快速开始

### 1. 安装依赖

```bash
# 全局安装 Cordova CLI
npm install -g cordova

# 进入项目目录
cd tongban-app

# 安装本地依赖
npm install
```

### 2. 同步源码（从父项目）

```bash
npm run copy-www
```

该脚本会从上级目录 `tongban-demo.html`、`App.js`、`fence.js` 同步到 `www/` 目录，
并自动添加移动端适配（viewport、cordova.js引用等）。

### 3. 安装插件

```bash
npm run plugin:add-all
```

### 4. 添加平台

```bash
# 添加Android平台
cordova platform add android

# 添加iOS平台（仅macOS）
cordova platform add ios
```

### 5. 本地浏览器测试

```bash
npm run dev
```

访问 `http://localhost:8080` 查看效果。

### 6. 构建运行

```bash
# Android
npm run android:build    # 构建APK
npm run android:run      # 连接设备运行

# iOS（仅macOS）
npm run ios:build        # 构建
npm run ios:run          # 模拟器运行
```

---

## 功能模块

### 核心功能

| 模块 | 说明 |
|------|------|
| 语音导航 | 实时语音播报、语速调节、TTS引擎 |
| AI视觉识别 | 30种路况识别、危险预警、盲道检测 |
| 出行模式 | 步行、公交、打车、室内四种模式 |
| 紧急求助 | 摇一摇触发、3秒倒计时、联系人呼叫 |
| 家人守护 | 位置共享、安全围栏、预警通知 |
| 社区互动 | 危险标记、路线分享、出行贴士 |
| 手势操作 | 长按/双击/左滑/右滑/上滑/摇一摇 |
| 无障碍 | ARIA属性、键盘导航、三层反馈 |

### 双角色系统

| 角色 | 首页 | 功能差异 |
|------|------|---------|
| 视障用户 | 唤醒页 | 语音唤醒、AI摄像头、盲道导航 |
| 家人用户 | 家人守护页 | 被监护人士管理、围栏、预警 |

---

## 移动端适配

### 全屏显示
- 自动隐藏手机模拟器外壳，页面全屏铺满
- 支持刘海屏/挖孔屏安全区域（safe-area-inset）
- 状态栏透明覆盖，与设计风格一致

### 物理返回键
- Android 返回键自动处理
- 覆盖层优先关闭，底层页面返回
- 首页按返回键退出应用

### 原生能力适配
| Web API | Cordova 插件 | 降级方案 |
|---------|-------------|---------|
| SpeechSynthesis | cordova-plugin-tts | Web Speech API |
| navigator.vibrate | cordova-plugin-vibration | 无 |
| navigator.geolocation | cordova-plugin-geolocation | Web Geolocation |
| navigator.camera | cordova-plugin-camera | 无 |
| window.sms | cordova-plugin-sms | sms: 链接 |
| CallNumber | call-number | tel: 链接 |

### 生命周期事件
- `pause` - 应用进入后台
- `resume` - 应用返回前台
- `deviceready` - Cordova初始化完成

---

## 插件列表

| 插件 | 用途 |
|------|------|
| cordova-plugin-camera | 摄像头拍照/录像 |
| cordova-plugin-media-capture | 媒体捕获 |
| cordova-plugin-geolocation | GPS定位 |
| cordova-plugin-vibration | 震动反馈 |
| cordova-plugin-statusbar | 状态栏控制 |
| cordova-plugin-device | 设备信息 |
| cordova-plugin-dialogs | 原生对话框 |
| cordova-plugin-network-information | 网络状态 |
| cordova-plugin-tts | 语音合成 |
| cordova-plugin-speechrecognition | 语音识别 |
| cordova-plugin-ble-central | 蓝牙BLE |
| cordova-plugin-background-mode | 后台运行 |
| cordova-plugin-file | 文件系统 |
| cordova-plugin-file-transfer | 文件传输 |
| cordova-plugin-sms | 短信发送 |
| call-number | 电话拨打 |

---

## 配置说明

### config.xml 关键配置

| 配置项 | 值 | 说明 |
|--------|-----|------|
| Fullscreen | false | 非全屏（留状态栏） |
| Orientation | portrait | 竖屏锁定 |
| StatusBarOverlaysWebView | true | 状态栏覆盖WebView |
| WKWebViewOnly | true | iOS使用WKWebView |
| android-minSdkVersion | 24 | Android 7.0+ |
| android-targetSdkVersion | 34 | Android 14 |
| deployment-target | 13.0 | iOS 13+ |

### Android 权限
- 摄像头、录音、定位（精确/粗略）
- 震动、短信、电话
- 前台服务、通知
- 网络、WiFi状态

### iOS 权限说明
- NSCameraUsageDescription - 摄像头
- NSMicrophoneUsageDescription - 麦克风
- NSLocationWhenInUseUsageDescription - 使用时定位
- NSLocationAlwaysAndWhenInUseUsageDescription - 后台定位
- NSContactsUsageDescription - 通讯录
- NSSpeechRecognitionUsageDescription - 语音识别

---

## 开发指南

### 更新源码

修改父目录中的源文件后，执行同步：

```bash
npm run copy-www
```

### 新增页面

1. 在 `app.js` 中新增 `ensure*Page()` 函数
2. 将页面ID加入 `showScreen` 的 `screens` 数组
3. 暴露相关函数到 `window` 全局作用域

### 新增原生能力

1. 安装 Cordova 插件
2. 在 `js/cordova-app.js` 的 `MobileAdapter` 中封装调用
3. 提供 Web API 降级方案
4. 在 `app.js` 中通过 `MobileAdapter.xxx()` 调用

### 调试

```bash
# Android 真机调试
# 1. 手机开启USB调试
# 2. 连接电脑
# 3. 运行
npm run android:run

# Chrome 远程调试
# 地址栏输入: chrome://inspect
```

---

## 常见问题

### Q: 语音播报不生效？
A: 
- Android: 确认已安装系统TTS引擎（如讯飞语记、系统自带）
- iOS: 系统自带TTS，无需额外安装
- 检查权限：麦克风/语音识别权限

### Q: 定位不准确？
A:
- 确保开启GPS定位和网络定位
- 室外环境定位精度更高
- 检查定位权限是否授予"始终允许"

### Q: 摇一摇紧急求助没反应？
A:
- 确认已授予动作传感器权限
- 摇动幅度稍大一些
- 检查"我的-手势操作-摇一摇紧急求助"开关是否开启

### Q: 后台导航掉线？
A:
- Android: 关闭电池优化、添加后台保护
- iOS: 授予"始终允许"定位权限
- 确保前台服务正常运行

---

## 版本信息

- **App版本**: 1.0.0
- **Cordova版本**: 12.x
- **最低支持**: Android 7.0 / iOS 13.0

---

## 相关文档

- [PRD产品需求文档](../docs/PRD.md)
- [系统架构文档](../docs/Architecture.md)
- [前端开发文档](../docs/Frontend.md)
- [后端开发文档](../docs/Backend.md)
