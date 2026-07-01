# 阶段 2：杭州/上海多城市路线补全设计文档（Spec）

> **创建日期：** 2026-06-24
> **范围：** 基于已下载的高德静态地图与步行路线 JSON，补全 `hangzhou-solo`、`shanghai-friends` 两条可玩主题线，并解锁 AI 首页场景入口
> **状态：** 待实施
> **前置成果：**
> - 主应用集成阶段 1 已完成
> - AI 指挥官对话式生成已完成
> - 本地字体已完成
> - 高德地图数据已下载到 `docs/maps/`

---

## 一、目标

把当前只可玩深圳一条线扩展为三条可玩路线：

| 主题 ID | 标题 | 城市 | 场景 | 关卡数 |
|---|---|---|---|---:|
| `shenzhen-couple` | 深圳·情侣甜蜜大作战 | 深圳 | 情侣约会 | 4 |
| `hangzhou-solo` | 杭州·独居时光漫步 | 杭州 | 独行漫游 | 4 |
| `shanghai-friends` | 上海·兄弟聚会闯关 | 上海 | 好友聚会 | 4 |

本阶段目标不是新增引擎能力，而是**用现有引擎的数据自适应能力跑通三套主题**：

```
AI 首页选择场景 → 动态 AI 生成文案 → briefing → 对应城市地图 → 对应路线关卡流程 → finale → result/share
```

---

## 二、已具备的数据

### 2.1 地图图片

| 文件 | 尺寸 | 来源 |
|---|---:|---|
| `docs/maps/shenzhen_full.png` | 800×600 | 现有深圳底图 |
| `docs/maps/hangzhou.png` | 800×600 | 高德静态地图 API 下载 |
| `docs/maps/shanghai.png` | 800×600 | 高德静态地图 API 下载 |

### 2.2 路线 JSON

| 文件 | 内容 |
|---|---|
| `docs/maps/routes.json` | 深圳 5 地点 / 4 路线 |
| `docs/maps/routes-hangzhou.json` | 杭州 5 地点 / 4 路线 |
| `docs/maps/routes-shanghai.json` | 上海 5 地点 / 4 路线 |

杭州路线：

| 段 | from → to | 点数 | 距离 |
|---|---|---:|---:|
| 1 | 西湖边的小茶馆 → 河坊街老面馆 | 81 | 1831m |
| 2 | 河坊街老面馆 → 中国美术学院南山校区 | 53 | 1493m |
| 3 | 中国美术学院南山校区 → 南宋御街 | 55 | 1590m |
| 4 | 南宋御街 → 宝石山日落 | 185 | 5033m |

上海路线：

| 段 | from → to | 点数 | 距离 |
|---|---|---:|---:|
| 1 | 武康路咖啡 → 老上海本帮菜 | 186 | 5708m |
| 2 | 老上海本帮菜 → 田子坊艺术区 | 157 | 4427m |
| 3 | 田子坊艺术区 → 南京路步行街 | 164 | 4408m |
| 4 | 南京路步行街 → 外滩夜景 | 65 | 1721m |

---

## 三、数据模型要求

`generate-stages.js` 需要从单深圳模式改为多主题模式。每个主题必须生成完整结构：

```js
WM.THEMES[themeId] = {
  id,
  title,
  city,
  budget,
  groupSize,
  themeColor,
  scene: { label, city },
  briefing: string[],
  map: {
    centerLng,
    centerLat,
    zoom,
    imgW: 800,
    imgH: 600,
    img,
    places,
  },
  routes,
  stages,
};
```

### 3.1 主题元信息

| 字段 | 深圳 | 杭州 | 上海 |
|---|---|---|---|
| `id` | `shenzhen-couple` | `hangzhou-solo` | `shanghai-friends` |
| `title` | 深圳·情侣甜蜜大作战 | 杭州·独居时光漫步 | 上海·兄弟聚会闯关 |
| `city` | 深圳 | 杭州 | 上海 |
| `budget` | 200 | 150 | 500 |
| `groupSize` | 2 | 1 | 4 |
| `themeColor` | `#FD79A8` | `#00D2D3` | `#F1C40F` |
| `scene.label` | 情侣约会 | 独行漫游 | 好友聚会 |
| `scene.city` | 深圳南山 | 杭州西湖 | 上海黄浦 |
| `map.img` | `docs/maps/shenzhen_full.png` | `docs/maps/hangzhou.png` | `docs/maps/shanghai.png` |

### 3.2 地图投影参数

三张底图均为 800×600。杭州/上海初始参数使用下载静态图时的中心与 zoom：

| 城市 | centerLng | centerLat | zoom |
|---|---:|---:|---:|
| 深圳 | 113.945129 | 22.500940 | 14 |
| 杭州 | 120.150000 | 30.280000 | 13 |
| 上海 | 121.470000 | 31.230000 | 13 |

若实施后地图路线明显偏出底图，允许在实现阶段微调 `centerLng/centerLat/zoom`，但必须保持：
- 所有地点标记可见
- 当前路线在 intro/walk 阶段可见
- finale 的全路线总览不裁切关键路径

---

## 四、关卡设计

### 4.1 关卡数量

本阶段杭州/上海先按 4 关实现，原因：
- 当前下载路线是 5 地点 → 4 相邻路线，结构与深圳一致；
- 可以最大化复用现有引擎和关底配置；
- 避免额外补第 5 段路线；
- 便于三个主题并排验证。

### 4.2 杭州关卡

| index | name | task.title | cost | duration | hp | walk.style | ending.type |
|---:|---|---|---|---|---:|---|---|
| 0 | 河坊街老面馆 | 吃一碗热乎的片儿川 | ¥25 | 30min | 12 | city | coffee |
| 1 | 中国美术学院南山校区 | 在校园里找一幅喜欢的作品 | ¥0 | 45min | 12 | forest | bookstore |
| 2 | 南宋御街 | 逛一间小店，挑一个纪念品 | ¥40 | 1h | 15 | commercial | mall |
| 3 | 宝石山日落 | 爬上山顶，看一次西湖日落 | ¥0 | 1.5h | 15 | forest | park |

说明：每关名使用路线终点，起点为上一地点。第 4 关是 BOSS 关，`ending.isBoss = true`。

### 4.3 上海关卡

| index | name | task.title | cost | duration | hp | walk.style | ending.type |
|---:|---|---|---|---|---:|---|---|
| 0 | 老上海本帮菜 | 点一份红烧肉，给兄弟夹第一筷 | ¥150 | 1.5h | 15 | commercial | coffee |
| 1 | 田子坊艺术区 | 找一面最适合合影的墙 | ¥0 | 1h | 12 | city | bookstore |
| 2 | 南京路步行街 | 买一份老字号伴手礼 | ¥100 | 1h | 12 | commercial | mall |
| 3 | 外滩夜景 | 在外滩拍一张通关合照 | ¥0 | 1h | 15 | seaside | park |

说明：第 4 关是 BOSS 关，`ending.isBoss = true`。

---

## 五、入口交互要求

### 5.1 解锁 AI 首页 chip

`js/app.js` 当前三项：

```js
{ label: '情侣约会', value: 'shenzhen-couple', locked: false },
{ label: '独行漫游', value: 'hangzhou-solo', locked: true },
{ label: '好友聚会', value: 'shanghai-friends', locked: true },
```

本阶段改为三项全部可选：

```js
{ label: '情侣约会', value: 'shenzhen-couple', locked: false },
{ label: '独行漫游', value: 'hangzhou-solo', locked: false },
{ label: '好友聚会', value: 'shanghai-friends', locked: false },
```

### 5.2 预算/人数 chip 扩展

预算 chip 从：

```text
¥100 / ¥200 / ¥300
```

扩展为：

```text
¥100 / ¥150 / ¥200 / ¥300 / ¥500
```

人数 chip 保持：

```text
1人 / 2人 / 4人
```

### 5.3 场景默认联动

点击场景 chip 时自动切换默认预算/人数：

| 场景 | themeId | 默认预算 | 默认人数 |
|---|---|---:|---:|
| 情侣约会 | `shenzhen-couple` | 200 | 2 |
| 独行漫游 | `hangzhou-solo` | 150 | 1 |
| 好友聚会 | `shanghai-friends` | 500 | 4 |

AI 生成文案继续读取 `theme.scene.label`、`theme.scene.city`、`chipSelection.budget`、`chipSelection.people`。

---

## 六、实现边界

### 本阶段包含

- 多主题数据生成
- 杭州/上海关卡配置
- 杭州/上海地图数据接入
- 首页 chip 解锁与默认联动
- 三条线冒烟测试

### 本阶段不包含

- 新增餐厅/美术馆/夜景等新关底场景
- 真实定位签到
- 彩蛋系统
- 换一个重新生成
- 存档续玩
- 分享卡片新模板
- 高德 Key 前端实时请求

---

## 七、验证标准

| # | 验收条件 |
|---|---|
| AC-01 | `node generate-stages.js` 成功生成含 3 个 theme 的 `js/stages.js` |
| AC-02 | `WM.THEMES` 包含 `shenzhen-couple`、`hangzhou-solo`、`shanghai-friends` |
| AC-03 | AI 首页三个场景 chip 全部可选 |
| AC-04 | 选择杭州时 AI 文案显示“独行漫游 / 杭州西湖 / ¥150 / 1人” |
| AC-05 | 选择上海时 AI 文案显示“好友聚会 / 上海黄浦 / ¥500 / 4人” |
| AC-06 | 深圳路线保持原 4 关不变 |
| AC-07 | 杭州路线可从 intro 跑到 finale，地图显示 `hangzhou.png` |
| AC-08 | 上海路线可从 intro 跑到 finale，地图显示 `shanghai.png` |
| AC-09 | 三条线 finale 均显示正确关数 `4/4` |
| AC-10 | `node --check` 检查所有修改过的 JS 文件通过 |

---

## 八、风险与处理

### 风险 1：杭州/上海路线偏出底图

处理：微调 `theme.map.centerLng/centerLat/zoom`，或重新下载静态地图。

### 风险 2：POI 搜索结果不够理想

处理：本阶段先接受已落盘数据，后续可手工修正 `routes-hangzhou.json` / `routes-shanghai.json` 的 places。

### 风险 3：上海路线距离较长导致地图缩放过小

处理：现有 `map.computeView()` 会按路线 bbox 自动聚焦；若全览过密，优先保证当前关路线可读。

---

> **文档结束** — 待基于此文档编写实施 plan。
