# 鼓韵声纹 · 梁平癞子锣鼓文创工坊 - 技术架构文档

## 1. 架构设计

```
┌──────────────────────────────────────────────┐
│                   前端层                      │
│  ┌────────────────────────────────────────┐  │
│  │   单页应用 (HTML + CSS + Vanilla JS)    │  │
│  │   - 页面路由（状态切换）                   │  │
│  │   - Canvas 海报合成                      │  │
│  │   - 声纹纹样生成                         │  │
│  │   - 图片上传预览                         │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────┐
│                  资源层                       │
│  - Google Fonts 字体                         │
│  - 预设金句数据                              │
│  - 曲牌信息数据                              │
│  - QRCode.js (CDN)                          │
└──────────────────────────────────────────────┘
```

## 2. 技术选型

| 类别 | 技术 | 说明 |
|------|------|------|
| 页面结构 | HTML5 | 单页应用，多状态切换 |
| 样式 | CSS3 + CSS Variables | 传统中国色变量定义 |
| 交互 | Vanilla JavaScript | 无框架依赖 |
| 图形处理 | Canvas API | 海报合成、声纹绘制 |
| 二维码 | QRCode.js | CDN 引入 |
| 字体 | Google Fonts | Noto Serif SC, ZCOOL XiaoWei |

## 3. 页面路由

本 Demo 为单页应用，通过 JavaScript 状态管理实现页面切换：

| 状态 | 页面 | 对应功能 |
|------|------|----------|
| `home` | 首页 | 品牌展示、入口按钮 |
| `select` | 曲牌选择页 | 选择曲牌 |
| `preview` | 生成预览页 | 海报预览、金句选择 |

## 4. 核心模块

### 4.1 图片上传模块

```javascript
// 功能：处理用户上传图片
// 输入：<input type="file">
// 输出：Base64 编码的图片数据
// 处理：读取文件 → 验证格式 → 转为 DataURL → 存储到状态
```

### 4.2 声纹纹样生成模块

```javascript
// 功能：基于随机波形生成模拟声纹
// 输入：曲牌节奏参数
// 输出：Canvas 绘制的云纹+波形组合纹样
// 算法：
//   1. 生成伪随机波形数据
//   2. 结合传统云纹路径
//   3. 使用金色渐变描边
```

### 4.3 海报合成模块

```javascript
// 功能：将用户照片 + 声纹纹样 + 金句 + 二维码合成一张海报
// 层次顺序（从底到顶）：
//   1. 米白背景层
//   2. 用户照片层（居中，圆形裁切或矩形）
//   3. 声纹纹样层（叠加，透明度 0.3）
//   4. 金句文字层
//   5. 曲牌名称层
//   6. 二维码层
//   7. 品牌水印层
```

### 4.4 金句管理

```javascript
// 预设金句库（5条）
const quotes = [
  "锣鼓一响，黄金万两",
  "梁平有戏，癞子有魂",
  "听见乡音，记住乡愁",
  "非遗传千载，鼓韵振梁平",
  "我家乡的BGM，是国家级非遗"
];
// 支持自定义输入（限20字）
```

## 5. 数据结构

### 5.1 曲牌数据

```javascript
const tracks = [
  { id: 'nIAN', name: '闹年夜', scene: '过年', desc: '喜庆热烈，打出年味' },
  { id: 'YINGQIN', name: '迎亲调', scene: '婚礼', desc: '欢快热闹，送祝福' },
  { id: 'HAOCAO', name: '薅草歌', scene: '劳动', desc: '节奏明快，丰收喜悦' },
  { id: 'CHONGTIAN', name: '冲天炮', scene: '节日', desc: '激情昂扬，锣鼓喧天' }
];
```

### 5.2 应用状态

```javascript
const appState = {
  currentPage: 'home',     // 当前页面
  userImage: null,          // 用户上传的图片 (Base64)
  selectedTrack: null,      // 选中的曲牌
  selectedQuote: '',       // 选中的金句
  customQuote: '',         // 自定义金句
  generatedPoster: null     // 生成的海报 (Base64)
};
```

## 6. 文件结构

```
d:\Trae初赛demo\
├── index.html          # 主页面
├── styles.css          # 样式文件
├── app.js              # 应用逻辑
├── poster.js           # 海报生成模块
└── .trae/
    └── documents/
        ├── PRD.md      # 产品需求文档
        └── ARCHITECTURE.md  # 本文档
```

## 7. 外部依赖

| 依赖 | CDN 地址 | 用途 |
|------|----------|------|
| QRCode.js | https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js | 生成二维码 |
| ZCOOL XiaoWei | Google Fonts | 中文艺术字体 |
| Noto Serif SC | Google Fonts | 中文衬线字体 |

## 8. 浏览器兼容

- Chrome 80+
- Safari 13+
- Firefox 75+
- 微信内置浏览器（WKWebview）
- 移动端 Safari / Android Chrome

## 9. 性能考虑

- 图片上传限制 5MB，超出提示压缩
- Canvas 海报尺寸：750px × 1100px（适合社交平台）
- 使用 CSS 变量减少重复样式
- 动画使用 CSS transform 和 opacity，启用 GPU 加速
