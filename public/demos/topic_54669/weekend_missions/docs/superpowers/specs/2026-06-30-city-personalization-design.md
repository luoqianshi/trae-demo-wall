# 阶段 3：杭州/上海城市氛围个性化设计文档（Spec）

> **创建日期：** 2026-06-30  
> **范围：** 在阶段 2 三主题路线已跑通的基础上，为 `hangzhou-solo`、`shanghai-friends` 增加城市专属视觉符号、关底装饰变体与轻量行进氛围增强。  
> **状态：** 待实施计划  
> **前置成果：**
> - 阶段 1 主应用集成已完成
> - 阶段 2 杭州/上海多城市路线补全已完成
> - `WM.THEMES` 已包含 `shenzhen-couple`、`hangzhou-solo`、`shanghai-friends`
> - 当前引擎已支持数据驱动的关卡数、路线、地图和关底类型

---

## 一、目标

阶段 2 已完成三条主题线的路线接入与流程闭合，但杭州、上海当前主要复用深圳线的行进风格和关底类型：

```text
walk.style: city / forest / commercial / seaside
ending.type: coffee / bookstore / mall / park
```

阶段 3 的目标是：

```text
保留现有引擎和流程 → 通过城市变体增强关底和行进氛围 → 让杭州/上海具有明显城市辨识度
```

本阶段不是重写关卡系统，而是为既有 `ending.type` 增加 `variant` 装饰层，并为部分 `walk.style` 增加 `variant` 氛围层。

---

## 二、设计原则

### 2.1 保持现有架构稳定

不改主状态机，不新增复杂流程。继续使用当前流程：

```text
intro → walk → transition → ending → clear → next/finale
```

`core.js`、`flow.js`、`map.js` 原则上不需要修改。

### 2.2 个性化优先发生在关底

玩家会在关底停留并执行任务，所以关底是城市记忆点最强的位置。本阶段优先个性化 8 个杭州/上海关底。

### 2.3 行进场景只做轻量增强

行进场景是过渡环节，第一版只做色盘、背景符号和少量动态元素，不做复杂交互。

### 2.4 深圳线不回退

深圳线可继续不配置 `variant`，没有变体时保留当前默认绘制。

---

## 三、总体方案

### 3.1 采用“基础关底类型 + 城市变体”

当前数据结构：

```js
ending: {
  type: "coffee",
  taskPoint: { x: 80, y: 176 },
  path: [...]
}
```

阶段 3 扩展为：

```js
ending: {
  type: "coffee",
  variant: "hangzhou-noodle",
  taskPoint: { x: 80, y: 176 },
  path: [...]
}
```

`type` 决定基础行为与流程，`variant` 决定城市装饰、符号、局部色彩和任务物件。

### 3.2 可选增加 `walk.variant`

当前数据结构：

```js
walk: {
  style: "city",
  skyColor: "#8fbfe8",
  midColor: "#8B7355",
  groundColor: "#6B5333",
  dynamicElements: ["lamp_glow"]
}
```

阶段 3 可扩展为：

```js
walk: {
  style: "city",
  variant: "hangzhou-oldtown",
  skyColor: "#8fbfe8",
  midColor: "#8B7355",
  groundColor: "#6B5333",
  dynamicElements: ["lamp_glow", "steam_rise"]
}
```

`style` 仍决定基础背景类型，`variant` 只叠加城市符号。

---

## 四、杭州线个性化设计

### 4.1 城市关键词与色盘

杭州关键词：

```text
独行、松弛、茶色、湖蓝、老街、展览、日落、慢节奏
```

建议色盘：

| 用途 | 颜色 | Hex |
|---|---|---|
| 湖面 / 天空 | 湖蓝 | `#8FBFE8` |
| 山林 / 茶意 | 茶绿 | `#4A7C3A` |
| 老街 / 木质 | 木色 | `#8B7355` |
| 墙面 / 纸张 | 米白 | `#F5E6C8` |
| 日落 | 日落橙 | `#FF9A5A` |

### 4.2 杭州关底变体

| 关卡 | 当前基础类型 | 新增 variant | 视觉目标 | 必备符号 |
|---|---|---|---|---|
| 河坊街老面馆 | `coffee` | `hangzhou-noodle` | 老街面馆 / 茶馆 | 木招牌、面碗、热气、灯笼 |
| 中国美术学院南山校区 | `bookstore` | `hangzhou-gallery` | 美院展廊 | 白墙、画框、展台、色块海报 |
| 南宋御街 | `mall` | `hangzhou-oldstreet` | 古街小店 | 青砖、红灯笼、木店招、纪念品柜 |
| 宝石山日落 | `park` | `hangzhou-sunset` | 西湖山顶日落 | 山坡剪影、西湖水面、夕阳、小亭/塔影 |

#### 4.2.1 `hangzhou-noodle`

复用 `coffee` 的基础移动、任务弹窗和任务完成机制，但装饰层表现为河坊街老面馆。

必备元素：

- 木质柜台
- 暖黄灯笼
- 面碗
- 面碗热气动画
- 墙上小招牌“片儿川”

任务点应落在面碗或桌面附近，玩家触发任务时感知为“吃一碗热乎的片儿川”。

#### 4.2.2 `hangzhou-gallery`

复用 `bookstore` 的室内结构，但装饰层表现为美院展廊。

必备元素：

- 米白墙面
- 多个画框
- 展台
- 彩色色块海报
- 柔和地面光斑

任务点应落在画框或展台附近，玩家触发任务时感知为“在校园里找一幅喜欢的作品”。

#### 4.2.3 `hangzhou-oldstreet`

复用 `mall` 的商业空间结构，但从现代商场改为老街小店。

必备元素：

- 青砖墙
- 红灯笼
- 木质店招
- 小摊 / 柜台
- 纪念品架
- 石板路色块

任务点应落在纪念品柜台附近。

#### 4.2.4 `hangzhou-sunset`

复用 `park` 的 BOSS 结构，但装饰层表现为宝石山日落。

必备元素：

- 日落橙天空
- 山坡剪影
- 西湖水面
- 远处小亭或小塔轮廓
- 夕阳反光

BOSS 倒计时语义可以理解为“赶上日落”。

---

## 五、上海线个性化设计

### 5.1 城市关键词与色盘

上海关键词：

```text
兄弟、小队、热闹、夜色、霓虹、弄堂、老字号、外滩
```

建议色盘：

| 用途 | 颜色 | Hex |
|---|---|---|
| 夜空 | 深夜蓝 | `#1A2A4A` |
| 霓虹 / 灯牌 | 霓虹金 | `#F1C40F` |
| 招牌 / 菜馆 | 招牌红 | `#E74C3C` |
| 商业夜色 | 紫黑 | `#3A1A3A` |
| 江面 | 江面蓝 | `#4A7C9A` |

### 5.2 上海关底变体

| 关卡 | 当前基础类型 | 新增 variant | 视觉目标 | 必备符号 |
|---|---|---|---|---|
| 老上海本帮菜 | `coffee` | `shanghai-restaurant` | 本帮菜小馆 | 圆桌、红烧肉、筷子、暖灯、菜单牌 |
| 田子坊艺术区 | `bookstore` | `shanghai-lilong-art` | 弄堂艺术墙 | 红砖墙、涂鸦、拍照框、小画廊招牌 |
| 南京路步行街 | `mall` | `shanghai-nanjing-road` | 霓虹步行街 | 霓虹招牌、老字号橱窗、人群剪影、金色灯牌 |
| 外滩夜景 | `park` | `shanghai-bund` | 外滩江边夜景 | 黄浦江、江面反光、陆家嘴轮廓、东方明珠剪影 |

#### 5.2.1 `shanghai-restaurant`

复用 `coffee` 的基础结构，但装饰层表现为本帮菜小馆。

必备元素：

- 圆桌
- 红烧肉盘子
- 筷子
- 暖色吊灯
- 墙上菜单牌

任务点应落在圆桌或菜品附近，玩家触发任务时感知为“点一份红烧肉，给兄弟夹第一筷”。

#### 5.2.2 `shanghai-lilong-art`

复用 `bookstore` 的基础结构，但装饰层表现为田子坊弄堂艺术墙。

必备元素：

- 红砖墙
- 涂鸦色块
- 拍照框
- 小画廊招牌
- 窄巷阴影
- 墙面贴纸

任务点应落在合影墙附近。

#### 5.2.3 `shanghai-nanjing-road`

复用 `mall` 的基础结构，但装饰层强化南京路步行街的热闹和霓虹。

必备元素：

- 密集霓虹招牌
- 老字号橱窗
- 人群剪影
- 金色灯牌
- 伴手礼柜台

任务点应落在老字号柜台附近。

#### 5.2.4 `shanghai-bund`

复用 `park` 的 BOSS 结构，但装饰层表现为外滩江边夜景。

必备元素：

- 黄浦江
- 江面反光
- 陆家嘴建筑剪影
- 东方明珠轮廓
- 金色灯光
- 江边栏杆
- 合照闪光动画

任务点应落在江边拍照点附近。

---

## 六、行进场景个性化设计

### 6.1 第一版范围

行进场景第一版只做 4 个轻量变体：

| variant | 适用城市 | 适用关卡 | 视觉符号 |
|---|---|---|---|
| `hangzhou-oldtown` | 杭州 | 河坊街、南宋御街 | 木招牌、灯笼、青砖建筑 |
| `hangzhou-lake` | 杭州 | 宝石山日落 | 湖面、柳树剪影、远山、暖色天空 |
| `shanghai-neon` | 上海 | 本帮菜、南京路 | 霓虹牌、人群剪影、高对比夜景 |
| `shanghai-river` | 上海 | 外滩夜景 | 江面、建筑轮廓、金色灯光反射 |

中国美术学院和田子坊可以先分别继续使用 `forest` / `city` 基础样式，依靠关底变体完成主要个性化。

### 6.2 行进变体职责

`walk.variant` 不改变玩家行进逻辑，只改变 `walk.drawMidground` 中的附加视觉层。

例如：

- `hangzhou-oldtown` 在 `city` 或 `commercial` 背景上增加灯笼和木招牌
- `hangzhou-lake` 在 `forest` 或 `seaside` 背景上增加湖面和远山
- `shanghai-neon` 在 `commercial` 背景上增加更密集的霓虹和人群剪影
- `shanghai-river` 在 `seaside` 背景上增加江面反光和天际线

---

## 七、动态元素设计

### 7.1 第一版新增动态元素

第一版只新增 3 个动态元素：

| dynamicElement | 用途 | 出现场景 |
|---|---|---|
| `steam_rise` | 面碗热气 / 小馆热气 | 杭州面馆、上海本帮菜 |
| `camera_flash` | 合照闪光 | 上海外滩、田子坊可选 |
| `river_reflection` | 江面 / 湖面反光 | 杭州日落、上海外滩 |

### 7.2 暂不新增的动态元素

以下元素可以后续再做，不进入第一版：

- `lantern_sway`
- `sunset_glow`
- `crowd_shadow`

原因是第一版已有足够视觉收益，继续增加会扩大测试范围。

---

## 八、技术结构建议

### 8.1 新增变体绘制模块

建议新增：

```text
js/scenes/endings/variants.js
```

职责：

- 提供 `WM.endingVariants`
- 按 `variant` 名称绘制城市装饰层
- 不接管关底状态机
- 不处理输入
- 不修改任务完成逻辑

示例结构：

```js
WM.endingVariants = {
  'hangzhou-noodle': {
    drawBack: function (ctx, stage) {},
    drawFront: function (ctx, stage) {},
  },
  'shanghai-bund': {
    drawBack: function (ctx, stage) {},
    drawFront: function (ctx, stage) {},
  },
};
```

`drawBack` 用于背景装饰，`drawFront` 用于前景装饰或任务物件。若某个变体只需要一层，可只实现其中一个方法。

### 8.2 接入现有关底

在现有 `coffee.js`、`bookstore.js`、`mall.js`、`park.js` 中读取：

```js
var variant = stage.ending.variant;
```

如果存在对应变体，则在合适位置调用：

```js
var v = WM.endingVariants && WM.endingVariants[variant];
if (v && v.drawBack) v.drawBack(ctx, stage);
if (v && v.drawFront) v.drawFront(ctx, stage);
```

默认没有 `variant` 时保持原样。

### 8.3 行进变体接入

建议在 `js/scenes/walk.js` 中增加一个轻量入口：

```js
this.drawVariant(ctx, walk.variant, walk.style, groundY);
```

`drawVariant` 只负责叠加城市符号，不改变原有 `drawMidground` 的基础绘制。

### 8.4 数据接入

在 `generate-stages.js` 中为杭州/上海各关增加：

```js
ending: {
  type: "coffee",
  variant: "hangzhou-noodle",
  ...
}
```

并按需要增加：

```js
walk: {
  style: "city",
  variant: "hangzhou-oldtown",
  ...
}
```

重新运行：

```bash
node generate-stages.js
```

生成新的 `js/stages.js`。

---

## 九、文件影响范围

### 9.1 预计修改文件

| 文件 | 修改原因 |
|---|---|
| `generate-stages.js` | 为杭州/上海每关增加 `ending.variant`，部分关增加 `walk.variant` 和动态元素 |
| `js/stages.js` | 由 `generate-stages.js` 重新生成 |
| `js/scenes/endings/coffee.js` | 接入 `WM.endingVariants` 装饰层 |
| `js/scenes/endings/bookstore.js` | 接入 `WM.endingVariants` 装饰层 |
| `js/scenes/endings/mall.js` | 接入 `WM.endingVariants` 装饰层 |
| `js/scenes/endings/park.js` | 接入 `WM.endingVariants` 装饰层 |
| `js/scenes/walk.js` | 增加轻量 `walk.variant` 绘制入口和少量动态元素 |

### 9.2 预计新增文件

| 文件 | 作用 |
|---|---|
| `js/scenes/endings/variants.js` | 集中管理杭州/上海关底变体绘制 |

### 9.3 不修改文件

| 文件 | 原因 |
|---|---|
| `js/core.js` | 主状态、输入、启动流程不需要变化 |
| `js/flow.js` | 状态机不需要变化 |
| `js/map.js` | 地图和路线投影不属于本阶段范围 |
| `index.html` | 页面流程和脚本结构原则上不变；仅当新增脚本必须加载时才追加 `variants.js` script |
| `docs/maps/*` | 不重新下载或修改地图/路线数据 |

---

## 十、实施边界

### 10.1 本阶段包含

- 杭州 4 个关底变体
- 上海 4 个关底变体
- 4 个轻量行进变体
- 3 个新增动态元素
- 数据层增加 `ending.variant` / `walk.variant`
- 自动 smoke test 确保三条线仍能跑到 finale

### 10.2 本阶段不包含

- 不新增新玩法机制
- 不新增真实定位
- 不新增 NPC 对话系统
- 不新增 8 个完整独立关底场景文件
- 不重写 `core.js` / `flow.js`
- 不改地图路线数据
- 不重新下载高德地图
- 不改 AI 首页生成流程
- 不新增外部在线依赖

---

## 十一、验收标准

| # | 验收条件 |
|---|---|
| AC-01 | 深圳线在未配置 `variant` 时保持原视觉和流程可用 |
| AC-02 | 杭州 `hangzhou-solo` 4 个关底分别呈现面馆、展廊、老街、日落山顶符号 |
| AC-03 | 上海 `shanghai-friends` 4 个关底分别呈现本帮菜馆、弄堂艺术墙、南京路、外滩符号 |
| AC-04 | `generate-stages.js` 成功生成包含 `ending.variant` / `walk.variant` 的 `js/stages.js` |
| AC-05 | 三主题仍均为 4 stages / 4 routes |
| AC-06 | 三主题 smoke test 均能跑到 `phase=finale` |
| AC-07 | `node --check generate-stages.js`、`node --check js/stages.js` 和所有修改过的 JS 文件通过 |
| AC-08 | 不引入 API Key、远程图片或其他外部在线依赖 |
| AC-09 | 浏览器手动验证中，杭州/上海视觉上不再只是深圳原关底换文案 |

---

## 十二、风险与处理

### 风险 1：变体绘制侵入现有关底过多

处理：将城市装饰集中放到 `variants.js`，现有关底只保留极薄的调用入口。

### 风险 2：新增视觉元素导致画面拥挤

处理：每个关底只保留 3-5 个强识别符号，不追求完整还原真实场景。

### 风险 3：新增动态元素影响性能或可读性

处理：动态元素只使用 Canvas 简单形状，不加载外部资源；第一版只实现 `steam_rise`、`camera_flash`、`river_reflection`。

### 风险 4：`index.html` 忘记加载新增脚本

处理：若新增 `js/scenes/endings/variants.js`，必须在 `index.html` 中先于具体关底或至少先于使用点加载，并纳入 smoke test。

---

## 十三、推荐实施顺序

1. 新增 `js/scenes/endings/variants.js`，定义 8 个关底变体的绘制接口。
2. 在 `coffee.js`、`bookstore.js`、`mall.js`、`park.js` 中接入变体绘制入口。
3. 在 `generate-stages.js` 为杭州/上海每关增加 `ending.variant`。
4. 重新生成 `js/stages.js` 并验证三主题结构。
5. 在 `walk.js` 增加 4 个轻量 `walk.variant` 绘制。
6. 新增 `steam_rise`、`camera_flash`、`river_reflection` 三个动态元素。
7. 运行语法检查和三主题 smoke test。
8. 手动打开 `index.html` 检查杭州/上海视觉差异。

---

> **文档结束** — 待确认后编写实施 plan。
