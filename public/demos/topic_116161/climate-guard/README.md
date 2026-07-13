# 四季安 ClimateGuard — AI 极端冷热风险守护小程序

> 不是告诉你天气，而是守住你和家人的冷热风险。

## 快速启动

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 打开浏览器访问
# http://localhost:3000
```

## 产品简介

四季安是一个面向个人、家庭和户外工作者的 AI 极端冷热风险守护系统。在高温、寒潮、湿冷、风寒、昼夜温差等极端天气下，帮助用户：

- **3 秒知道今天有没有风险**
- 自动生成**家人关怀提醒**
- 户外工作者一眼看到**什么时候必须休息**
- 出现不适时**不用思考，直接按步骤处理**

## 技术栈

- **React 18** + **TypeScript**
- **Tailwind CSS** — 移动端原生体验
- **Vite** — 快速构建
- **vite-plugin-pwa** — PWA 离线支持
- **Lucide React** — 图标库

## 项目结构

```
src/
├── components/          # 公共组件
│   ├── BottomNav.tsx    # 底部 Tab 导航
│   ├── Card.tsx         # 卡片容器
│   ├── MobileLayout.tsx # 移动端布局框架
│   └── RiskBadge.tsx   # 风险等级徽标
├── pages/               # 页面
│   ├── TodayPage.tsx    # 首页「今日」
│   ├── AssessmentPage.tsx # 风险评估
│   ├── CaredPeoplePage.tsx # 关心的人
│   ├── NearbyPage.tsx   # 附近安全点
│   ├── EmergencyPage.tsx # 应急处理
│   ├── ProfilePage.tsx  # 我的
│   └── StationModePage.tsx # 站点负责人模式
├── services/            # 服务层（接口预留）
│   ├── WeatherService.ts    # 天气服务
│   ├── MapService.ts        # 地图服务
│   ├── NotificationService.ts # 通知服务
│   ├── UserService.ts       # 用户管理
│   └── EmergencyService.ts   # 应急记录
├── utils/               # 工具
│   ├── riskEngine.ts   # ⭐ 核心风险评分算法
│   └── cn.ts           # className 工具
├── data/                # 数据
│   └── mockData.ts     # Mock 数据（6城市+4场景）
├── types/               # TypeScript 类型
│   └── index.ts
├── App.tsx              # 路由配置
├── main.tsx             # 入口
└── index.css            # 全局样式
```

## 核心功能

### 5 个底部 Tab

| Tab | 功能 | 亮点 |
|-----|------|------|
| **今日** | 今日风险卡、天气数据、AI提醒 | 打开3秒知道有没有风险 |
| **关心的人** | 家人风险自动计算、关怀提醒文案 | 一键生成"今天要不要打电话"的建议 |
| **附近** | 安全点搜索、距离、服务、导航 | 清凉驿站/暖心驿站/医院 |
| **应急** | 症状选择→行动步骤→120 | 极简设计，紧张情况下不用思考 |
| **我的** | 个人设置、站点负责人模式入口 | 城市切换、身份设置 |

### 站点负责人模式（从「我的」进入）

- 班组成员风险一览
- 排班建议、休息频率
- 装备检查清单
- 一键生成班组冷热风险提醒

## AI 风险评分引擎

核心函数 `calculateRisk(weather, profile)` 综合以下因子计算 0-100 分：

- **温度评分**：≥35°C / ≤-15°C 加权
- **湿度评分**：高湿在高温/低温下均加权
- **风速评分**：大风+低温 → 风寒效应
- **身份加权**：户外工作者 +15、独居老人 +12
- **年龄加权**：老人 +10、儿童 +8
- **户外时长**：3-6小时 +10、6小时以上 +15
- **时段加权**：中午/下午高温、夜间低温
- **慢病加权**：心脑血管 +12、呼吸系统 +10
- **独居加权**：+8
- **空调/供暖**：缺失时额外加权

## 内置 4 个真实场景

1. **重庆高温热浪** — 39°C 高湿，外卖骑手下午配送
2. **哈尔滨寒潮大风** — -24°C，独居老人供暖未知
3. **上海湿冷** — 5°C 高湿，慢病老人无供暖
4. **西宁昼夜温差** — 白天 22°C / 夜间 6°C

## 如何接入真实服务

### 1. 天气服务

```bash
# .env 文件配置
VITE_WEATHER_API_KEY=your_qweather_key
VITE_WEATHER_API_BASE=https://devapi.qweather.com/v7
```

在 `src/services/WeatherService.ts` 中切换实现：
```ts
// 从 Mock 切换到真实服务
export const weatherService = new OpenMeteoService();
// 或接入和风天气
export const weatherService = new QWeatherService();
```

### 2. 地图服务

```bash
VITE_MAP_API_KEY=your_amap_key
```

可接入：高德地图 / 百度地图，用于定位、附近搜索、一键导航。

### 3. 通知服务

可接入：微信小程序订阅消息 / 企业微信机器人 / 短信。

### 4. 用户数据

当前使用 localStorage。可接入 Supabase / Firebase / 自研后端。

## 如何做试点

### 家庭用户试点

1. 邀请 10-20 组有老人/儿童的家庭
2. 每人添加 2-3 个关怀对象
3. 使用 1 周，收集反馈：
   - 每天打开频率
   - 关怀提醒是否有效
   - 风险评分是否准确
4. 根据反馈调整算法权重

### 骑手站点试点

1. 找 1-2 个外卖站点/环卫班组
2. 站点负责人使用「站点负责人模式」
3. 观察：
   - 排班建议是否实用
   - 休息频率是否合理
   - 异常预警是否及时
4. 收集实际冷热事件数据优化算法

## 后续上线

### 微信小程序版本

项目使用 React + Tailwind，可通过 Taro 或 Remax 框架迁移至微信小程序，组件和逻辑可直接复用。


## API Key 安全

所有 API Key 通过环境变量注入，不写死在代码中。详见 `.env.example`。

## 隐私与安全

- 所有个人信息默认脱敏
- 家属关注需授权
- 不保存敏感病历
- 健康建议只做风险提示
- 严重情况提示联系 120
- 所有 mock 用户使用虚构数据

## 构建部署

```bash
# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

构建产物在 `dist/` 目录，可部署到任何静态服务器（Vercel / Netlify / 阿里云 OSS 等），PWA 支持离线使用。

## License

MIT
