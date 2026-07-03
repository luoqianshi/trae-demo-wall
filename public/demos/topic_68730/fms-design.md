# 柔性制造系统(FMS)虚拟环境模块设计文档

## 版本信息
- **版本**: v1.0
- **日期**: 2026-06-23
- **作者**: 虚实一体仿真系统开发组
- **状态**: 设计阶段

---

## 目录

1. [项目概述](#1-项目概述)
2. [页面结构设计](#2-页面结构设计)
3. [3D场景设计](#3-3d场景设计)
4. [交互设计](#4-交互设计)
5. [数据模型](#5-数据模型)
6. [技术实现要点](#6-技术实现要点)
7. [附录](#7-附录)

---

## 1. 项目概述

### 1.1 项目背景

基于现有"虚实一体仿真系统"（职业院校工业机器人实训平台），新增柔性制造系统(Flexible Manufacturing System, FMS)虚拟环境模块。该模块旨在帮助学生理解现代智能制造中柔性生产的概念、原理和实际应用，通过3D仿真、对比演示和MES调度界面，提供沉浸式的学习体验。

### 1.2 设计目标

| 目标维度 | 具体描述 |
|---------|---------|
| **教学目标** | 帮助学生理解FMS四大柔性概念，掌握柔性产线的组成和工作原理 |
| **实训目标** | 支持MES调度操作、AGV路径规划、设备换型等实操训练 |
| **演示目标** | 提供刚柔产线对比演示，直观展示柔性制造优势 |
| **扩展目标** | 模块化设计，便于后续扩展更多工位和产品类型 |

### 1.3 目标用户

- **学生**: 职业院校机电、自动化、智能制造专业学生
- **教师**: 需要教学演示和实训指导的教师
- **自学人员**: 对柔性制造系统感兴趣的自学人员

### 1.4 核心场景

1. **完整产线3D仿真** - 包含CNC加工中心、机器人装配、AGV物流、MES调度大屏的完整柔性产线
2. **对比演示模式** - 左侧传统刚性产线 vs 右侧柔性产线，直观对比差异
3. **单工位深度演示** - 聚焦柔性工位换型全过程，展示设备柔性细节
4. **MES调度系统界面** - 数据可视化和调度逻辑，模拟真实生产管理

### 1.5 产品类型（小批量多类型电子产品）

| 产品类型 | 描述 | 工艺特点 |
|---------|------|---------|
| 智能穿戴设备 | 智能手表/手环 | 精密组装、小型化、外观要求高 |
| 智能手机/平板 | 移动终端设备 | 多工序、高精度、质检严格 |
| IoT传感器模块 | 物联网传感设备 | 标准化程度高、批量灵活 |

### 1.6 四大柔性

1. **设备柔性**: CNC、机器人可编程，一台设备可执行多类加工/装配任务
2. **工艺柔性**: 可动态调整工序顺序，不同产品可走不同工艺流程
3. **物流柔性**: AGV/RGV自主导航转运，不受固定输送轨道约束
4. **排产柔性**: 系统支持插单、改单、换型快速响应

### 1.7 交互方式

**混合模式**: 自动演示 + 手动干预，用户可随时暂停并接管控制。
- 自动模式: 系统按预设流程自动运行，适合观摩学习
- 手动模式: 用户可控制各设备，适合实训操作
- 暂停/继续: 随时暂停查看状态，继续恢复运行

---

## 2. 页面结构设计

### 2.1 页面导航关系

```
index.html (教学实训平台首页)
    └── fms-home.html (柔性制造概览)
            ├── fms-simulation.html (3D柔性产线仿真)
            ├── fms-compare.html (刚柔对比分析)
            └── fms-mes.html (MES调度中心)
```

### 2.2 公共样式规范

延续现有系统深色科技风格：

```css
:root {
    --primary: #0ea5e9;
    --primary-dark: #0284c7;
    --secondary: #f59e0b;
    --danger: #ef4444;
    --success: #22c55e;
    --warning: #f97316;
    --bg-dark: #0a0f1a;
    --bg-panel: #111827;
    --bg-card: #1e293b;
    --bg-hover: #334155;
    --text-primary: #f1f5f9;
    --text-secondary: #94a3b8;
    --border: #334155;
    --gradient-1: linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%);
    --gradient-2: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
    --gradient-3: linear-gradient(135deg, #22c55e 0%, #0ea5e9 100%);
    --shadow-glow: 0 0 20px rgba(14, 165, 233, 0.3);
    --scene-bg: #1a2332;
    --scene-fog: #1a2332;
}
```

### 2.3 fms-home.html - 柔性制造概览页

#### 2.3.1 页面布局

```
+----------------------------------------------------------+
|  顶部导航栏 (与现有系统一致)                                |
+----------------------------------------------------------+
|                                                          |
|  英雄区: 柔性制造系统标题 + 简介                            |
|  [主标题] 柔性制造系统 (FMS) 虚拟实训平台                    |
|  [副标题] 探索智能制造的核心理念 - 设备/工艺/物流/排产柔性    |
|                                                          |
+----------------------------------------------------------+
|                                                          |
|  四大柔性卡片区域                                          |
|  +---------------+ +---------------+ +---------------+ +---------------+
|  |   设备柔性     | |   工艺柔性     | |   物流柔性     | |   排产柔性     |
|  |   [图标]       | |   [图标]       | |   [图标]       | |   [图标]       |
|  |   说明文字     | |   说明文字     | |   说明文字     | |   说明文字     |
|  +---------------+ +---------------+ +---------------+ +---------------+
|                                                          |
+----------------------------------------------------------+
|                                                          |
|  产线总览图 (SVG/Canvas 示意图)                            |
|  [立体仓库] → [CNC1] → [机器人1] → [CNC2] → [AGV] → ...   |
|                                                          |
+----------------------------------------------------------+
|                                                          |
|  产品类型展示                                             |
|  +-----------+  +-----------+  +-----------+              |
|  | 智能手表   |  | 智能手机   |  | IoT传感器 |              |
|  |  [图标]    |  |  [图标]    |  |  [图标]   |              |
|  +-----------+  +-----------+  +-----------+              |
|                                                          |
+----------------------------------------------------------+
|  [进入3D仿真] [刚柔对比] [MES调度] 按钮组                   |
+----------------------------------------------------------+
|  底部信息栏                                               |
+----------------------------------------------------------+
```

#### 2.3.2 详细组件说明

**顶部导航栏**
- 左侧: Logo + 系统名称
- 中间: 导航链接（首页、流水线控制、工业机器人实训、3D场景、FMS柔性制造）
- 右侧: 用户状态、系统时间

**英雄区**
- 主标题: "柔性制造系统 (FMS) 虚拟实训平台"
- 副标题: "探索智能制造的核心理念 - 理解设备柔性、工艺柔性、物流柔性、排产柔性"
- 背景: 动态网格 + 渐变光晕动画
- 进入按钮: 大号渐变按钮，引导进入3D仿真

**四大柔性卡片**

| 卡片 | 图标 | 标题 | 说明 |
|------|------|------|------|
| 设备柔性 | CPU/Settings | 设备柔性 | CNC、机器人可编程换型，一台设备适配多类产品加工与装配需求 |
| 工艺柔性 | GitBranch | 工艺柔性 | 动态调整工序顺序，不同产品自动匹配最优工艺流程路径 |
| 物流柔性 | Truck | 物流柔性 | AGV/RGV自主导航，无固定轨道约束，灵活响应物料转运需求 |
| 排产柔性 | CalendarClock | 排产柔性 | 支持紧急插单、订单变更、快速换型，实时优化生产计划 |

**产线总览图**
- 使用SVG绘制俯视图
- 显示主要设备布局和物流路径
- 设备用不同颜色标识状态
- 支持鼠标悬停显示设备信息

**产品类型展示**
- 三个产品卡片横向排列
- 每个卡片包含产品图标、名称、简要描述
- 点击可查看产品工艺路线

### 2.4 fms-simulation.html - 3D柔性产线仿真

#### 2.4.1 页面布局

```
+----------------------------------------------------------+
|  顶部导航栏 (与现有系统一致)                                |
+----------------------------------------------------------+
|                                                          |
|  +--------------------------------+ +------------------+  |
|  |                                | |   控制面板        |  |
|  |     3D 场景视图                 | |                  |  |
|  |                                | |  [产品选择]       |  |
|  |   [CNC] [机器人] [AGV]         | |  [生产模式]       |  |
|  |   [传送带] [立体仓库]           | |  [工序路径]       |  |
|  |                                | |  [设备状态]       |  |
|  |                                | |  [AGV调度]        |  |
|  |                                | |                  |  |
|  +--------------------------------+ +------------------+  |
|                                                          |
|  +----------------------------------------------------+  |
|  |  底部信息栏: 当前订单 | 生产进度 | 设备利用率 | 告警   |  |
|  +----------------------------------------------------+  |
|                                                          |
+----------------------------------------------------------+
```

#### 2.4.2 3D场景内容

**设备清单**

| 设备名称 | 数量 | 3D模型 | 功能描述 | 颜色标识 |
|---------|------|--------|---------|---------|
| CNC加工中心 | 3台 | 长方体+旋转门+主轴 | 精密加工 | #0ea5e9 (蓝) |
| 6轴工业机器人 | 2台 | 关节臂模型 | 装配/搬运 | #f59e0b (橙) |
| AGV小车 | 3台 | 平板车+指示灯 | 自主物流 | #22c55e (绿) |
| 立体仓库 | 1个 | 货架+堆垛机 | 物料存储 | #6366f1 (紫) |
| MES调度大屏 | 1个 | 屏幕模型 | 调度展示 | #ef4444 (红) |
| 传送带 | 2条 | 滚筒线模型 | 产品输送 | #94a3b8 (灰) |
| 物料托盘 | 若干 | 平板模型 | 承载工件 | #f1f5f9 (白) |

**场景布局坐标**（以场景中心为原点，单位: 米）

```
俯视图布局:

     Z
     ^
     |
  15 |    [立体仓库]
     |         |
  10 | [CNC1]--|--[CNC2]--|--[CNC3]
     |    |         |          |
   5 | [机器人1]---[传送带]---[机器人2]
     |         |         |
   0 |-------[AGV路径]-------
     |    |         |          |
  -5 |  [AGV1]   [AGV2]    [AGV3]
     |         |         |
 -10 |      [MES大屏]
     |
     +----------------------------> X
       -15      0        15       25
```

详细坐标:

| 设备 | X坐标 | Z坐标 | Y坐标(高度) | 朝向 |
|------|-------|-------|------------|------|
| CNC1 | -10 | 10 | 0 | 面向-Z |
| CNC2 | 0 | 10 | 0 | 面向-Z |
| CNC3 | 10 | 10 | 0 | 面向-Z |
| 机器人1 | -8 | 5 | 0 | 面向+Z |
| 机器人2 | 8 | 5 | 0 | 面向+Z |
| 立体仓库 | 0 | 15 | 0 | 四面 |
| MES大屏 | 0 | -8 | 0 | 面向+Z |
| 传送带1 | -5~5 | 5 | 0.8 | X轴方向 |
| 传送带2 | -5~5 | 0 | 0.8 | X轴方向 |
| AGV停靠点1 | -12 | 0 | 0 | - |
| AGV停靠点2 | 0 | 0 | 0 | - |
| AGV停靠点3 | 12 | 0 | 0 | - |

#### 2.4.3 右侧控制面板

**标签页设计**（4个标签）:
1. **生产控制** - 产品选择、生产模式、启动/暂停/复位
2. **工序路径** - 当前产品工艺流程图、实时进度
3. **设备监控** - 所有设备状态列表、详细信息
4. **AGV调度** - AGV任务列表、路径显示、手动指派

**生产控制面板内容**:

```
+-- 生产控制 ------------------+
| 产品选择:                     |
| [智能手表 v] [智能手机 v] [IoT传感器 v] |
|                              |
| 生产模式:                     |
| [自动演示] [手动控制]         |
|                              |
| 控制按钮:                     |
| [启动] [暂停] [复位] [急停]   |
|                              |
| 当前状态: 运行中              |
| 当前工序: CNC加工 (2/5)       |
| 完成数量: 12 / 50             |
+------------------------------+
```

**工序路径面板内容**:

```
+-- 工序路径 ------------------+
| 智能手表工艺流程:              |
|                              |
| [原料] → [CNC1:外壳加工]      |
|    ↓                         |
| [CNC2:电路板加工]             |
|    ↓                         |
| [机器人1:装配]                |
|    ↓                         |
| [CNC3:质检]                  |
|    ↓                         |
| [机器人2:包装] → [成品]       |
|                              |
| 当前: [CNC2:电路板加工]       |
| 进度: ████████░░ 80%         |
+------------------------------+
```

#### 2.4.4 底部信息栏

```
+----------------------------------------------------------+
| 当前订单: #WO-20260623-001 | 智能手表 x50 | 交期: 3天      |
| 生产进度: ████████████░░░░░░░░ 45% | 已完成: 22 / 50     |
| 设备利用率: CNC1: 85% | CNC2: 72% | CNC3: 60% | 机器人: 90% |
| [告警: AGV2电量低 15%]                                    |
+----------------------------------------------------------+
```

### 2.5 fms-compare.html - 刚柔对比分析

#### 2.5.1 页面布局

```
+----------------------------------------------------------+
|  顶部导航栏 (与现有系统一致)                                |
+----------------------------------------------------------+
|                                                          |
|  +--------------------+ +--------------------+            |
|  |   传统刚性产线      | |    柔性产线         |            |
|  |   (左侧)           | |    (右侧)          |            |
|  |                    | |                    |            |
|  |  [3D场景/示意图]    | |  [3D场景/示意图]    |            |
|  |                    | |                    |            |
|  |  特点列表:          | |  特点列表:          |            |
|  |  - 单一产品         | |  - 多品种混线       |            |
|  |  - 固定工序         | |  - 动态工序         |            |
|  |  - 专用设备         | |  - 可编程设备       |            |
|  |  - 大批量           | |  - 小批量           |            |
|  |                    | |                    |            |
|  +--------------------+ +--------------------+            |
|                                                          |
|  +----------------------------------------------------+  |
|  |              对比指标数据可视化区域                   |  |
|  |  [换型时间对比] [设备利用率] [库存水平] [响应速度]     |  |
|  |  柱状图/雷达图展示                                    |  |
|  +----------------------------------------------------+  |
|                                                          |
+----------------------------------------------------------+
```

#### 2.5.2 对比内容设计

**传统刚性产线特点**:
- 单一产品专用生产线
- 固定不变的工序流程
- 专用设备，换型困难
- 大批量生产，库存积压
- 人工调度，响应慢
- 设备利用率不均衡

**柔性产线特点**:
- 多品种产品混线生产
- 动态调整的工序流程
- 可编程通用设备，快速换型
- 小批量生产，按需制造
- MES系统自动调度
- 设备利用率均衡优化

**对比指标**:

| 指标 | 刚性产线 | 柔性产线 | 提升幅度 |
|------|---------|---------|---------|
| 换型时间 | 4-8小时 | 10-30分钟 | 90%+ |
| 设备利用率 | 60-70% | 80-90% | 20%+ |
| 在制品库存 | 高 | 低 | 50%- |
| 订单响应时间 | 天级 | 小时级 | 80%+ |
| 产品种类支持 | 1-2种 | 10+种 | 500%+ |
| 生产批量 | 大批量 | 单件/小批 | 灵活 |

### 2.6 fms-mes.html - MES调度中心

#### 2.6.1 页面布局

```
+----------------------------------------------------------+
|  顶部导航栏 (与现有系统一致)                                |
+----------------------------------------------------------+
|                                                          |
|  +----------+ +----------+ +----------+ +----------+     |
|  | 订单管理  | | 设备看板  | | 排产甘特图| | AGV调度  |     |
|  | (标签页)  | | (标签页)  | | (标签页)  | | (标签页)  |     |
|  +----------+ +----------+ +----------+ +----------+     |
|                                                          |
|  +----------------------------------------------------+  |
|  |                                                    |  |
|  |                 主内容区域                          |  |
|  |                                                    |  |
|  |  [根据选中标签页显示不同内容]                         |  |
|  |                                                    |  |
|  +----------------------------------------------------+  |
|                                                          |
|  +----------------------------------------------------+  |
|  |  底部告警栏: [告警信息滚动显示]                       |  |
|  +----------------------------------------------------+  |
|                                                          |
+----------------------------------------------------------+
```

#### 2.6.2 各标签页内容

**订单管理面板**:

```
+-- 订单管理 -----------------------------------------------+
| 筛选: [全部] [待生产] [生产中] [已完成] [紧急]              |
|                                                           |
| +------------+------------+------------+------------+     |
| | 订单号      | 产品类型    | 数量       | 状态       |     |
| +------------+------------+------------+------------+     |
| | WO-001     | 智能手表    | 50         | 生产中     |     |
| | WO-002     | 智能手机    | 30         | 待生产     |     |
| | WO-003     | IoT传感器  | 100        | 已完成     |     |
| | WO-004     | 智能手表    | 20         | 紧急-生产中 |     |
| +------------+------------+------------+------------+     |
|                                                           |
| 操作: [新建订单] [修改] [排产] [删除]                      |
+-----------------------------------------------------------+
```

**设备状态看板**:

```
+-- 设备状态看板 -------------------------------------------+
| +-----------+ +-----------+ +-----------+ +-----------+   |
| |  CNC-01   | |  CNC-02   | |  CNC-03   | |  Robot-01 |   |
| |  [运行中]  | |  [待机]    | |  [运行中]  | |  [运行中]  |   |
| |  利用率85% | |  利用率0%  | |  利用率72% | |  利用率90% |   |
| |  当前:手表 | |  当前:-   | |  当前:手机 | |  当前:手表 |   |
| +-----------+ +-----------+ +-----------+ +-----------+   |
| +-----------+ +-----------+ +-----------+                 |
| |  Robot-02 | |  AGV-01   | |  AGV-02   |                 |
| |  [待机]    | |  [运行中]  | |  [充电]    |                 |
| |  利用率0%  | |  利用率80% | |  利用率0%  |                 |
| +-----------+ +-----------+ +-----------+                 |
+-----------------------------------------------------------+
```

**排产甘特图**:

```
+-- 排产甘特图 ---------------------------------------------+
| 时间 → | 08:00 | 09:00 | 10:00 | 11:00 | 12:00 | 13:00 |  |
|--------+-------+-------+-------+-------+-------+-------+   |
| CNC-01 | [手表外壳]       | [手机外壳]                    |   |
| CNC-02 |       [手表电路]  |      [手机电路]              |   |
| CNC-03 | [质检:手表]      | [质检:手机]                  |   |
| Robot1 |    [装配手表]     |    [装配手机]                |   |
| Robot2 |         [包装手表]|         [包装手机]           |   |
+-----------------------------------------------------------+
```

**AGV调度路径图**:

```
+-- AGV调度 ------------------------------------------------+
| +------------------------+ +---------------------------+  |
| |    AGV路径图 (Canvas)   | |     AGV任务列表           |  |
| |                        | | +------+------+---------+ |  |
| |  [仓库]───[CNC区]       | | | AGV  | 任务 | 状态    | |  |
| |    │        │          | | +------+------+---------+ |  |
| |  [装配]───[质检]       | | | AGV1 | 送料 | 运行中  | |  |
| |                        | | | AGV2 | 取货 | 充电中  | |  |
| |  AGV1: ●──→           | | | AGV3 | 待命 | 待机    | |  |
| |  AGV2: ○ (充电)        | | +------+------+---------+ |  |
| |  AGV3: △              | |                           |  |
| +------------------------+ +---------------------------+  |
| 操作: [指派任务] [路径优化] [紧急召回]                      |
+-----------------------------------------------------------+
```

---

## 3. 3D场景设计

### 3.1 设备3D模型规格

#### 3.1.1 CNC加工中心

```javascript
// CNC模型参数
const cncModel = {
    base: { width: 3, height: 0.5, depth: 2.5, color: 0x2d3748 },
    body: { width: 2.5, height: 2, depth: 2, color: 0x0ea5e9 },
    door: { width: 1.5, height: 1.2, depth: 0.1, color: 0x1e293b },
    spindle: { radius: 0.15, height: 0.8, color: 0x94a3b8 },
    controlPanel: { width: 0.6, height: 0.8, depth: 0.2, color: 0x1a2332 },
    statusLight: { radius: 0.1, colors: { run: 0x22c55e, idle: 0xf59e0b, error: 0xef4444 } }
};
```

#### 3.1.2 6轴工业机器人

```javascript
// 机器人模型参数 (简化关节模型)
const robotModel = {
    base: { radius: 0.4, height: 0.3, color: 0xf59e0b },
    joint1: { radius: 0.25, height: 0.5, color: 0xf59e0b }, // 旋转基座
    arm1: { width: 0.3, height: 1.2, depth: 0.3, color: 0xf59e0b }, // 大臂
    joint2: { radius: 0.2, color: 0xd97706 }, // 肘部
    arm2: { width: 0.25, height: 1.0, depth: 0.25, color: 0xf59e0b }, // 小臂
    joint3: { radius: 0.18, color: 0xd97706 }, // 腕部
    wrist: { width: 0.2, height: 0.3, depth: 0.2, color: 0xf59e0b },
    gripper: { width: 0.3, height: 0.15, depth: 0.2, color: 0x94a3b8 }
};

// 6个关节轴角度范围
const jointLimits = [
    { min: -180, max: 180 }, // J1: 基座旋转
    { min: -90, max: 90 },   // J2: 大臂俯仰
    { min: -180, max: 75 },  // J3: 小臂俯仰
    { min: -400, max: 400 }, // J4: 腕部旋转
    { min: -125, max: 125 }, // J5: 腕部摆动
    { min: -400, max: 400 }  // J6: 工具旋转
];
```

#### 3.1.3 AGV小车

```javascript
// AGV模型参数
const agvModel = {
    body: { width: 1.2, height: 0.4, depth: 0.8, color: 0x22c55e },
    wheel: { radius: 0.15, width: 0.1, color: 0x1e293b },
    light: { radius: 0.08, colors: { run: 0x22c55e, idle: 0xf59e0b, charge: 0x0ea5e9 } },
    screen: { width: 0.4, height: 0.25, color: 0x0a0f1a },
    cargo: { width: 0.8, height: 0.3, depth: 0.6, color: 0xf1f5f9 }
};

// AGV导航路径点
const agvPathPoints = [
    { x: -12, z: 0, name: '停靠点1' },
    { x: -10, z: 10, name: 'CNC1' },
    { x: 0, z: 10, name: 'CNC2' },
    { x: 10, z: 10, name: 'CNC3' },
    { x: -8, z: 5, name: '机器人1' },
    { x: 8, z: 5, name: '机器人2' },
    { x: 0, z: 15, name: '立体仓库' },
    { x: 0, z: 0, name: '中央交汇点' },
    { x: 12, z: 0, name: '停靠点3' }
];
```

#### 3.1.4 立体仓库

```javascript
// 立体仓库模型参数
const warehouseModel = {
    frame: { width: 6, height: 4, depth: 3, color: 0x6366f1 },
    shelf: { width: 5.5, height: 0.1, depth: 2.8, color: 0x4f46e5 },
    shelfCount: 5, // 5层货架
    stacker: { width: 0.8, height: 4.2, depth: 0.8, color: 0x0ea5e9 }, // 堆垛机
    cell: { width: 1.0, height: 0.6, depth: 1.2 }, // 货位尺寸
    cellsPerRow: 5 // 每排货位数
};
```

#### 3.1.5 传送带

```javascript
// 传送带模型参数
const conveyorModel = {
    frame: { width: 10, height: 0.3, depth: 1.2, color: 0x334155 },
    belt: { width: 9.5, height: 0.05, depth: 1.0, color: 0x1e293b },
    roller: { radius: 0.05, length: 1.0, color: 0x64748b },
    rollerCount: 20,
    motor: { width: 0.5, height: 0.5, depth: 0.5, color: 0x0ea5e9 },
    speed: 0.5 // 米/秒
};
```

#### 3.1.6 MES调度大屏

```javascript
// MES大屏模型参数
const mesScreenModel = {
    frame: { width: 4, height: 0.2, depth: 2.5, color: 0x1e293b },
    screen: { width: 3.8, height: 2.2, depth: 0.05, color: 0x0a0f1a },
    stand: { width: 0.3, height: 1.5, depth: 0.3, color: 0x334155 },
    base: { width: 1.5, height: 0.2, depth: 1.0, color: 0x334155 },
    // 屏幕显示内容 (Canvas纹理)
    display: {
        charts: ['订单进度', '设备状态', '产量统计'],
        refreshRate: 1000 // ms
    }
};
```

### 3.2 场景光照设计

```javascript
// 光照配置
const lightingConfig = {
    ambient: { color: 0x404040, intensity: 0.6 }, // 环境光
    directional: {
        color: 0xffffff,
        intensity: 0.8,
        position: { x: 10, y: 20, z: 10 },
        castShadow: true
    },
    pointLights: [
        { color: 0x0ea5e9, intensity: 0.5, position: { x: 0, y: 8, z: 0 }, distance: 30 }, // 中央蓝光
        { color: 0xf59e0b, intensity: 0.3, position: { x: -8, y: 5, z: 5 }, distance: 15 }, // 机器人区域暖光
        { color: 0x22c55e, intensity: 0.3, position: { x: 0, y: 3, z: 0 }, distance: 20 }   // AGV区域绿光
    ],
    spotLights: [
        { color: 0xffffff, intensity: 0.6, position: { x: 0, y: 15, z: 0 }, target: { x: 0, y: 0, z: 0 }, angle: Math.PI / 4 }
    ]
};
```

### 3.3 动画流程设计

#### 3.3.1 智能手表生产流程

```
步骤1: 原料出库
  - 立体仓库堆垛机移动到对应货位
  - 取出原料托盘
  - 放置到AGV1上
  - 动画时长: 3秒

步骤2: AGV运输到CNC1
  - AGV1沿路径行驶到CNC1
  - 路径: 仓库 → 中央交汇点 → CNC1
  - 动画时长: 5秒

步骤3: CNC1加工外壳
  - 机器人1从AGV1取料
  - 放入CNC1夹具
  - CNC1门关闭，主轴旋转，切削动画
  - 加工完成，门打开
  - 机器人1取料放回AGV1
  - 动画时长: 8秒

步骤4: AGV运输到CNC2
  - AGV1行驶到CNC2
  - 动画时长: 4秒

步骤5: CNC2加工电路板
  - 类似步骤3
  - 动画时长: 8秒

步骤6: AGV运输到装配工位
  - AGV1行驶到机器人1装配位置
  - 动画时长: 4秒

步骤7: 机器人1装配
  - 机器人1从AGV1取外壳
  - 从传送带取电路板
  - 装配动作（贴合、按压）
  - 放置到AGV2
  - 动画时长: 10秒

步骤8: AGV运输到质检
  - AGV2行驶到CNC3（质检工位）
  - 动画时长: 4秒

步骤9: CNC3质检
  - 视觉检测动画（扫描光束）
  - 显示检测结果（合格/不合格）
  - 动画时长: 5秒

步骤10: AGV运输到包装
  - AGV2行驶到机器人2
  - 动画时长: 4秒

步骤11: 机器人2包装
  - 取包装盒
  - 放入产品
  - 封装动作
  - 放置到成品传送带
  - 动画时长: 8秒

步骤12: 成品入库
  - 传送带运输到仓库
  - 堆垛机入库
  - 动画时长: 5秒
```

#### 3.3.2 动画时间线总览

| 步骤 | 工序 | 设备 | 时长 | 累计 |
|------|------|------|------|------|
| 1 | 原料出库 | 立体仓库 | 3s | 3s |
| 2 | 运输 | AGV1 | 5s | 8s |
| 3 | 外壳加工 | CNC1+机器人1 | 8s | 16s |
| 4 | 运输 | AGV1 | 4s | 20s |
| 5 | 电路板加工 | CNC2+机器人1 | 8s | 28s |
| 6 | 运输 | AGV1 | 4s | 32s |
| 7 | 装配 | 机器人1 | 10s | 42s |
| 8 | 运输 | AGV2 | 4s | 46s |
| 9 | 质检 | CNC3 | 5s | 51s |
| 10 | 运输 | AGV2 | 4s | 55s |
| 11 | 包装 | 机器人2 | 8s | 63s |
| 12 | 入库 | 立体仓库 | 5s | 68s |

**单件产品总生产周期**: 约68秒（演示加速，实际生产更长）

#### 3.3.3 并行动画设计

为提高演示效率，支持多产品并行生产：

```
时间轴:
T=0s:  产品A开始 (步骤1)
T=15s: 产品B开始 (步骤1) - 产品A在步骤3
T=30s: 产品C开始 (步骤1) - 产品A在步骤5，产品B在步骤3
T=45s: 产品D开始 (步骤1) - 产品A在步骤7，产品B在步骤5，产品C在步骤3
```

各工位独立运行，AGV按任务队列调度。

### 3.4 相机视角预设

```javascript
const cameraPresets = {
    overview: {    // 全景俯瞰
        position: { x: 0, y: 25, z: 20 },
        target: { x: 0, y: 0, z: 5 },
        fov: 60
    },
    cncArea: {     // CNC加工区
        position: { x: 0, y: 8, z: 18 },
        target: { x: 0, y: 2, z: 10 },
        fov: 50
    },
    robotArea: {   // 机器人装配区
        position: { x: 0, y: 6, z: 10 },
        target: { x: 0, y: 2, z: 5 },
        fov: 45
    },
    agvArea: {     // AGV物流区
        position: { x: 0, y: 10, z: 5 },
        target: { x: 0, y: 0, z: 0 },
        fov: 55
    },
    warehouse: {   // 立体仓库
        position: { x: 5, y: 8, z: 20 },
        target: { x: 0, y: 3, z: 15 },
        fov: 50
    },
    mesScreen: {   // MES大屏
        position: { x: 0, y: 5, z: -3 },
        target: { x: 0, y: 2, z: -8 },
        fov: 40
    }
};
```

---

## 4. 交互设计

### 4.1 用户操作流程

#### 4.1.1 首次使用流程

```
1. 从首页导航进入 fms-home.html
   ↓
2. 浏览四大柔性概念卡片
   ↓
3. 查看产线总览图，了解设备布局
   ↓
4. 选择产品类型，了解工艺路线
   ↓
5. 点击"进入3D仿真"进入 fms-simulation.html
   ↓
6. 选择产品和生产模式
   ↓
7. 点击"启动"开始仿真
   ↓
8. 观察3D产线运行，可切换视角
   ↓
9. 暂停后手动控制设备（可选）
   ↓
10. 访问 fms-compare.html 对比刚柔产线
   ↓
11. 访问 fms-mes.html 体验调度系统
```

#### 4.1.2 3D仿真交互操作

| 操作 | 触发方式 | 效果 |
|------|---------|------|
| 旋转视角 | 鼠标左键拖拽 | 环绕场景旋转 |
| 平移视角 | 鼠标右键拖拽 | 平移相机位置 |
| 缩放 | 鼠标滚轮 | 拉近/拉远 |
| 选择设备 | 鼠标左键点击 | 高亮显示，显示信息面板 |
| 切换视角 | 界面按钮/快捷键 | 切换到预设视角 |
| 启动/暂停 | 界面按钮/空格键 | 控制仿真运行状态 |
| 重置 | 界面按钮/R键 | 重置场景到初始状态 |
| 切换产品 | 下拉菜单 | 更换当前生产产品 |
| 切换模式 | 单选按钮 | 自动/手动模式切换 |

#### 4.1.3 手动控制模式

在手动模式下，用户可：

1. **控制AGV**:
   - 点击AGV选择
   - 点击目标位置指派任务
   - 查看当前任务和路径

2. **控制机器人**:
   - 选择机器人
   - 调整各关节角度（滑块控制）
   - 执行预设动作（取料、放料、装配）

3. **控制CNC**:
   - 选择CNC设备
   - 启动/停止加工
   - 查看加工参数

4. **控制传送带**:
   - 启动/停止
   - 调整速度

### 4.2 状态反馈设计

#### 4.2.1 设备状态指示

| 状态 | 颜色 | 指示方式 |
|------|------|---------|
| 运行中 | 绿色 (#22c55e) | 状态灯常亮 + 轻微发光 |
| 待机 | 黄色 (#f59e0b) | 状态灯慢闪 (1Hz) |
| 故障 | 红色 (#ef4444) | 状态灯快闪 (2Hz) + 告警提示 |
| 维护 | 蓝色 (#0ea5e9) | 状态灯呼吸效果 |
| 离线 | 灰色 (#64748b) | 状态灯熄灭 |

#### 4.2.2 AGV状态指示

| 状态 | 颜色 | 指示方式 |
|------|------|---------|
| 运行中 | 绿色 | 顶部灯常亮，运动轨迹线 |
| 待命 | 黄色 | 顶部灯慢闪 |
| 充电 | 蓝色 | 顶部灯呼吸，充电座连接 |
| 故障 | 红色 | 顶部灯快闪 |
| 载货 | 白色 | 载货指示灯亮 |

#### 4.2.3 产品状态指示

产品在传送带/AGV上的状态通过颜色区分：

| 产品类型 | 颜色 | 标识 |
|---------|------|------|
| 智能手表 | 青色 (#06b6d4) | 小方块 |
| 智能手机 | 紫色 (#8b5cf6) | 长方体 |
| IoT传感器 | 橙色 (#f97316) | 小圆柱 |

### 4.3 快捷键设计

| 快捷键 | 功能 |
|--------|------|
| 空格 | 启动/暂停仿真 |
| R | 重置场景 |
| 1-6 | 切换预设视角 (1全景, 2CNC, 3机器人, 4AGV, 5仓库, 6MES) |
| F | 全屏切换 |
| H | 显示/隐藏帮助面板 |
| M | 切换自动/手动模式 |
| P | 截图保存 |
| ESC | 退出全屏/关闭弹窗 |

---

## 5. 数据模型

### 5.1 订单数据模型

```javascript
const orderSchema = {
    id: String,           // 订单编号，如 "WO-20260623-001"
    productType: String,  // 产品类型: 'smartwatch' | 'smartphone' | 'iot_sensor'
    quantity: Number,     // 生产数量
    priority: Number,     // 优先级: 1-5，5最高
    status: String,       // 状态: 'pending' | 'production' | 'completed' | 'cancelled'
    createTime: Date,     // 创建时间
    deadline: Date,       // 交期
    completedQuantity: Number, // 已完成数量
    currentStep: Number,  // 当前工序索引
    assignedDevices: [String], // 分配的设备ID列表
    agvTasks: [String],   // 关联的AGV任务ID
    
    // 计算属性
    progress: Number,     // 完成百分比
    remainingTime: Number // 预计剩余时间(分钟)
};
```

### 5.2 产品数据模型

```javascript
const productSchema = {
    id: String,           // 产品型号
    name: String,         // 产品名称
    type: String,         // 类型: 'smartwatch' | 'smartphone' | 'iot_sensor'
    description: String,  // 产品描述
    icon: String,         // 图标路径
    
    // 工艺流程
    processFlow: [{
        step: Number,         // 工序序号
        name: String,         // 工序名称
        deviceType: String,   // 所需设备类型: 'cnc' | 'robot' | 'inspect'
        deviceId: String,     // 具体设备ID（运行时分配）
        duration: Number,     // 标准工时(秒)
        parameters: Object,   // 工艺参数
        prerequisites: [Number] // 前置工序
    }],
    
    // 物料清单
    bom: [{
        materialId: String,
        name: String,
        quantity: Number,
        unit: String
    }],
    
    // 质量要求
    quality: {
        inspectionPoints: [String],
        tolerance: Number,
        defectRate: Number
    }
};
```

### 5.3 设备数据模型

```javascript
const deviceSchema = {
    id: String,           // 设备编号
    name: String,         // 设备名称
    type: String,         // 类型: 'cnc' | 'robot' | 'agv' | 'warehouse' | 'conveyor'
    status: String,       // 状态: 'running' | 'idle' | 'error' | 'maintenance' | 'offline'
    
    // 位置信息
    position: {
        x: Number,
        y: Number,
        z: Number
    },
    
    // 能力参数
    capabilities: [String], // 支持的操作列表
    
    // 运行数据
    runtime: {
        totalRunningTime: Number,  // 总运行时间(小时)
        currentTask: String,       // 当前任务ID
        currentProduct: String,    // 当前产品
        utilization: Number,       // 利用率 0-100
        oee: Number               // 设备综合效率
    },
    
    // 状态历史
    statusHistory: [{
        status: String,
        startTime: Date,
        endTime: Date,
        duration: Number
    }],
    
    // 告警信息
    alarms: [{
        level: String,      // 'info' | 'warning' | 'error' | 'critical'
        message: String,
        timestamp: Date,
        resolved: Boolean
    }],
    
    // 维护计划
    maintenance: {
        lastMaintenance: Date,
        nextMaintenance: Date,
        maintenanceInterval: Number // 间隔小时
    }
};
```

### 5.4 AGV数据模型

```javascript
const agvSchema = {
    id: String,           // AGV编号
    name: String,         // AGV名称
    status: String,       // 状态: 'running' | 'idle' | 'charging' | 'error'
    
    // 位置信息
    position: {
        x: Number,
        y: Number,
        z: Number
    },
    
    // 电池状态
    battery: {
        level: Number,      // 电量百分比 0-100
        voltage: Number,
        isCharging: Boolean
    },
    
    // 当前任务
    currentTask: {
        taskId: String,
        type: String,       // 'pickup' | 'delivery' | 'transport'
        from: String,       // 起点位置
        to: String,         // 终点位置
        cargo: String,      // 货物信息
        progress: Number    // 任务进度 0-100
    },
    
    // 任务队列
    taskQueue: [{
        taskId: String,
        priority: Number,
        type: String,
        from: String,
        to: String
    }],
    
    // 运行统计
    statistics: {
        totalDistance: Number,     // 总行驶距离(米)
        totalTasks: Number,        // 完成任务数
        averageSpeed: Number       // 平均速度(米/秒)
    }
};
```

### 5.5 MES调度数据模型

```javascript
const mesSchema = {
    // 生产计划
    schedule: {
        date: Date,
        shifts: [{
            name: String,       // 班次名称
            startTime: Date,
            endTime: Date,
            orders: [String]    // 订单ID列表
        }]
    },
    
    // 设备状态汇总
    deviceSummary: {
        total: Number,
        running: Number,
        idle: Number,
        error: Number,
        maintenance: Number
    },
    
    // 生产统计
    productionStats: {
        plannedQuantity: Number,
        completedQuantity: Number,
        defectQuantity: Number,
        oee: Number,
        throughput: Number     // 每小时产量
    },
    
    // 质量数据
    qualityData: {
        inspectionResults: [{
            productId: String,
            orderId: String,
            result: String,     // 'pass' | 'fail'
            defects: [String],
            inspector: String,
            timestamp: Date
        }],
        defectRate: Number,
        topDefects: [{ type: String, count: Number }]
    },
    
    // 告警列表
    alerts: [{
        id: String,
        level: String,
        source: String,     // 告警来源设备
        message: String,
        timestamp: Date,
        acknowledged: Boolean,
        resolved: Boolean
    }]
};
```

### 5.6 仿真状态数据模型

```javascript
const simulationState = {
    isRunning: Boolean,       // 是否运行中
    isPaused: Boolean,        // 是否暂停
    mode: String,             // 'auto' | 'manual'
    speed: Number,            // 仿真速度倍率: 0.5 | 1 | 2 | 5 | 10
    
    currentTime: Date,        // 仿真当前时间
    startTime: Date,          // 仿真开始时间
    
    activeOrders: [String],   // 活跃订单ID
    activeProducts: [{        // 在产产品
        productId: String,
        orderId: String,
        currentStep: Number,
        position: { x: Number, y: Number, z: Number },
        status: String        // 'processing' | 'transporting' | 'waiting'
    }],
    
    // 统计信息
    statistics: {
        totalProduced: Number,
        totalDefects: Number,
        averageCycleTime: Number,
        deviceUtilization: Object // 各设备利用率
    }
};
```

---

## 6. 技术实现要点

### 6.1 技术栈

| 层级 | 技术 | 版本/说明 |
|------|------|----------|
| 3D渲染 | Three.js | r150 (ES Module) |
| 前端框架 | 纯HTML/CSS/JS | 与现有系统保持一致 |
| 数据可视化 | Canvas 2D API | 自定义绘制 |
| 图表库 | Chart.js (可选) | 如需更复杂图表 |
| 字体 | Google Fonts | Noto Sans SC, JetBrains Mono |
| 图标 | Font Awesome / SVG | 内嵌SVG图标 |

### 6.2 Three.js 实现要点

#### 6.2.1 模块导入方式

```html
<!-- ES Module 方式导入 Three.js -->
<script type="importmap">
{
    "imports": {
        "three": "https://unpkg.com/three@0.150.0/build/three.module.js",
        "three/addons/": "https://unpkg.com/three@0.150.0/examples/jsm/"
    }
}
</script>

<script type="module">
    import * as THREE from 'three';
    import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
    import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
    // ... 其他导入
</script>
```

#### 6.2.2 场景初始化

```javascript
class FMSScene {
    constructor(container) {
        this.container = container;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.devices = new Map();
        this.agvs = new Map();
        this.products = new Map();
        this.animationId = null;
        
        this.init();
    }
    
    init() {
        // 创建场景
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a2332);
        this.scene.fog = new THREE.Fog(0x1a2332, 20, 100);
        
        // 创建相机
        this.camera = new THREE.PerspectiveCamera(
            60, 
            this.container.clientWidth / this.container.clientHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 25, 20);
        
        // 创建渲染器
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);
        
        // 创建控制器
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxPolarAngle = Math.PI / 2.2;
        
        // 添加光照
        this.setupLighting();
        
        // 添加地面
        this.setupGround();
        
        // 初始化设备
        this.initDevices();
        
        // 开始渲染循环
        this.animate();
        
        // 监听窗口大小变化
        window.addEventListener('resize', () => this.onResize());
    }
    
    setupLighting() {
        // 环境光
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        // 方向光
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(10, 20, 10);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        this.scene.add(dirLight);
        
        // 点光源
        const pointLight1 = new THREE.PointLight(0x0ea5e9, 0.5, 30);
        pointLight1.position.set(0, 8, 0);
        this.scene.add(pointLight1);
    }
    
    setupGround() {
        // 网格地面
        const gridHelper = new THREE.GridHelper(60, 60, 0x334155, 0x1e293b);
        this.scene.add(gridHelper);
        
        // 地面平面
        const planeGeometry = new THREE.PlaneGeometry(60, 60);
        const planeMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x0f172a,
            transparent: true,
            opacity: 0.8
        });
        const plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.rotation.x = -Math.PI / 2;
        plane.position.y = -0.1;
        plane.receiveShadow = true;
        this.scene.add(plane);
    }
    
    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        
        // 更新控制器
        this.controls.update();
        
        // 更新设备动画
        this.updateDevices();
        
        // 更新AGV动画
        this.updateAGVs();
        
        // 更新产品动画
        this.updateProducts();
        
        // 渲染场景
        this.renderer.render(this.scene, this.camera);
    }
    
    onResize() {
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }
    
    dispose() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.renderer.dispose();
        this.container.removeChild(this.renderer.domElement);
    }
}
```

#### 6.2.3 设备模型创建

```javascript
class DeviceFactory {
    static createCNC(config) {
        const group = new THREE.Group();
        
        // 底座
        const baseGeo = new THREE.BoxGeometry(config.base.width, config.base.height, config.base.depth);
        const baseMat = new THREE.MeshStandardMaterial({ color: config.base.color });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = config.base.height / 2;
        base.castShadow = true;
        group.add(base);
        
        // 主体
        const bodyGeo = new THREE.BoxGeometry(config.body.width, config.body.height, config.body.depth);
        const bodyMat = new THREE.MeshStandardMaterial({ 
            color: config.body.color,
            metalness: 0.6,
            roughness: 0.4
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = config.base.height + config.body.height / 2;
        body.castShadow = true;
        group.add(body);
        
        // 门
        const doorGeo = new THREE.BoxGeometry(config.door.width, config.door.height, config.door.depth);
        const doorMat = new THREE.MeshStandardMaterial({ 
            color: config.door.color,
            transparent: true,
            opacity: 0.7
        });
        const door = new THREE.Mesh(doorGeo, doorMat);
        door.position.set(0, config.base.height + config.body.height / 2, config.body.depth / 2);
        group.add(door);
        
        // 状态灯
        const lightGeo = new THREE.SphereGeometry(config.statusLight.radius, 16, 16);
        const lightMat = new THREE.MeshBasicMaterial({ color: config.statusLight.colors.idle });
        const statusLight = new THREE.Mesh(lightGeo, lightMat);
        statusLight.position.set(0, config.base.height + config.body.height + 0.2, 0);
        statusLight.name = 'statusLight';
        group.add(statusLight);
        
        return group;
    }
    
    static createRobot(config) {
        const group = new THREE.Group();
        // 机器人模型创建逻辑...
        return group;
    }
    
    static createAGV(config) {
        const group = new THREE.Group();
        // AGV模型创建逻辑...
        return group;
    }
}
```

### 6.3 动画系统实现

```javascript
class AnimationSystem {
    constructor(scene) {
        this.scene = scene;
        this.animations = new Map();
        this.tweens = [];
    }
    
    // 创建移动动画
    moveTo(object, targetPosition, duration, onComplete) {
        const startPosition = object.position.clone();
        const startTime = Date.now();
        
        const animation = {
            type: 'move',
            object,
            startPosition,
            targetPosition: new THREE.Vector3(targetPosition.x, targetPosition.y, targetPosition.z),
            startTime,
            duration: duration * 1000,
            onComplete
        };
        
        this.animations.set(object.uuid + '_move', animation);
    }
    
    // 创建旋转动画
    rotateTo(object, targetRotation, duration, onComplete) {
        const startRotation = object.rotation.clone();
        const startTime = Date.now();
        
        const animation = {
            type: 'rotate',
            object,
            startRotation,
            targetRotation,
            startTime,
            duration: duration * 1000,
            onComplete
        };
        
        this.animations.set(object.uuid + '_rotate', animation);
    }
    
    // 更新所有动画
    update() {
        const now = Date.now();
        
        for (const [key, anim] of this.animations) {
            const elapsed = now - anim.startTime;
            const progress = Math.min(elapsed / anim.duration, 1);
            
            // 使用缓动函数
            const eased = this.easeInOutCubic(progress);
            
            if (anim.type === 'move') {
                anim.object.position.lerpVectors(anim.startPosition, anim.targetPosition, eased);
            } else if (anim.type === 'rotate') {
                anim.object.rotation.x = anim.startRotation.x + (anim.targetRotation.x - anim.startRotation.x) * eased;
                anim.object.rotation.y = anim.startRotation.y + (anim.targetRotation.y - anim.startRotation.y) * eased;
                anim.object.rotation.z = anim.startRotation.z + (anim.targetRotation.z - anim.startRotation.z) * eased;
            }
            
            if (progress >= 1) {
                this.animations.delete(key);
                if (anim.onComplete) anim.onComplete();
            }
        }
    }
    
    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
}
```

### 6.4 AGV路径规划

```javascript
class AGVPathPlanner {
    constructor(pathPoints) {
        this.pathPoints = pathPoints;
        this.graph = this.buildGraph();
    }
    
    buildGraph() {
        // 构建路径图，计算各点之间的距离
        const graph = {};
        
        for (let i = 0; i < this.pathPoints.length; i++) {
            const point = this.pathPoints[i];
            graph[point.name] = {};
            
            // 连接到相邻点（简化：所有点互相连接）
            for (let j = 0; j < this.pathPoints.length; j++) {
                if (i !== j) {
                    const other = this.pathPoints[j];
                    const distance = Math.sqrt(
                        Math.pow(point.x - other.x, 2) + 
                        Math.pow(point.z - other.z, 2)
                    );
                    graph[point.name][other.name] = distance;
                }
            }
        }
        
        return graph;
    }
    
    // A*路径规划
    findPath(start, end) {
        // 简化的A*实现
        const openSet = [start];
        const cameFrom = {};
        const gScore = { [start]: 0 };
        const fScore = { [start]: this.heuristic(start, end) };
        
        while (openSet.length > 0) {
            // 找到fScore最小的节点
            let current = openSet.reduce((a, b) => 
                (fScore[a] || Infinity) < (fScore[b] || Infinity) ? a : b
            );
            
            if (current === end) {
                return this.reconstructPath(cameFrom, current);
            }
            
            openSet.splice(openSet.indexOf(current), 1);
            
            for (const neighbor in this.graph[current]) {
                const tentativeGScore = (gScore[current] || Infinity) + this.graph[current][neighbor];
                
                if (tentativeGScore < (gScore[neighbor] || Infinity)) {
                    cameFrom[neighbor] = current;
                    gScore[neighbor] = tentativeGScore;
                    fScore[neighbor] = tentativeGScore + this.heuristic(neighbor, end);
                    
                    if (!openSet.includes(neighbor)) {
                        openSet.push(neighbor);
                    }
                }
            }
        }
        
        return null; // 无路径
    }
    
    heuristic(a, b) {
        const pointA = this.pathPoints.find(p => p.name === a);
        const pointB = this.pathPoints.find(p => p.name === b);
        return Math.sqrt(
            Math.pow(pointA.x - pointB.x, 2) + 
            Math.pow(pointA.z - pointB.z, 2)
        );
    }
    
    reconstructPath(cameFrom, current) {
        const path = [current];
        while (cameFrom[current]) {
            current = cameFrom[current];
            path.unshift(current);
        }
        return path;
    }
}
```

### 6.5 Canvas 2D 数据可视化

```javascript
class DataVisualization {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
    }
    
    // 绘制设备利用率柱状图
    drawUtilizationChart(data) {
        const ctx = this.ctx;
        const barWidth = 60;
        const gap = 40;
        const startX = (this.width - (data.length * (barWidth + gap) - gap)) / 2;
        const maxHeight = this.height * 0.7;
        
        ctx.clearRect(0, 0, this.width, this.height);
        
        data.forEach((item, index) => {
            const x = startX + index * (barWidth + gap);
            const barHeight = (item.value / 100) * maxHeight;
            const y = this.height - barHeight - 40;
            
            // 绘制柱子
            const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
            gradient.addColorStop(0, '#0ea5e9');
            gradient.addColorStop(1, '#0284c7');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(x, y, barWidth, barHeight);
            
            // 绘制数值
            ctx.fillStyle = '#f1f5f9';
            ctx.font = 'bold 14px "Noto Sans SC"';
            ctx.textAlign = 'center';
            ctx.fillText(`${item.value}%`, x + barWidth / 2, y - 10);
            
            // 绘制标签
            ctx.fillStyle = '#94a3b8';
            ctx.font = '12px "Noto Sans SC"';
            ctx.fillText(item.name, x + barWidth / 2, this.height - 15);
        });
    }
    
    // 绘制甘特图
    drawGanttChart(tasks, timeRange) {
        const ctx = this.ctx;
        const rowHeight = 40;
        const timeScale = this.width / (timeRange.end - timeRange.start);
        
        ctx.clearRect(0, 0, this.width, this.height);
        
        tasks.forEach((task, index) => {
            const y = index * rowHeight + 20;
            const x = (task.start - timeRange.start) * timeScale;
            const width = (task.end - task.start) * timeScale;
            
            // 绘制任务条
            ctx.fillStyle = task.color || '#0ea5e9';
            ctx.fillRect(x, y, width, rowHeight - 10);
            
            // 绘制任务名称
            ctx.fillStyle = '#f1f5f9';
            ctx.font = '12px "Noto Sans SC"';
            ctx.fillText(task.name, x + 5, y + 20);
        });
    }
    
    // 绘制AGV路径图
    drawAGVPath(points, agvs, currentPath) {
        const ctx = this.ctx;
        
        ctx.clearRect(0, 0, this.width, this.height);
        
        // 绘制路径线
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.beginPath();
        points.forEach((point, index) => {
            const x = this.mapX(point.x);
            const y = this.mapZ(point.z);
            if (index === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
        
        // 绘制路径点
        points.forEach(point => {
            const x = this.mapX(point.x);
            const y = this.mapZ(point.z);
            
            ctx.fillStyle = '#0ea5e9';
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#94a3b8';
            ctx.font = '10px "Noto Sans SC"';
            ctx.fillText(point.name, x + 10, y);
        });
        
        // 绘制AGV位置
        agvs.forEach(agv => {
            const x = this.mapX(agv.position.x);
            const y = this.mapZ(agv.position.z);
            
            ctx.fillStyle = agv.status === 'running' ? '#22c55e' : '#f59e0b';
            ctx.beginPath();
            ctx.arc(x, y, 8, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#f1f5f9';
            ctx.font = 'bold 11px "Noto Sans SC"';
            ctx.textAlign = 'center';
            ctx.fillText(agv.id, x, y - 12);
        });
    }
    
    mapX(x) {
        // 将世界坐标映射到Canvas坐标
        return (x + 20) * (this.width / 50);
    }
    
    mapZ(z) {
        return (z + 15) * (this.height / 35);
    }
}
```

### 6.6 响应式布局

```css
/* 响应式断点 */
@media (max-width: 1200px) {
    .control-sidebar {
        width: 350px;
    }
}

@media (max-width: 992px) {
    .main-container {
        flex-direction: column;
    }
    .control-sidebar {
        width: 100%;
        height: 300px;
        border-left: none;
        border-top: 1px solid var(--border);
    }
    .viewport-container {
        height: 60vh;
    }
}

@media (max-width: 768px) {
    .four-flex-cards {
        grid-template-columns: 1fr;
    }
    .compare-container {
        flex-direction: column;
    }
    .mes-grid {
        grid-template-columns: 1fr;
    }
}
```

### 6.7 性能优化

1. **LOD (Level of Detail)**: 根据相机距离使用不同精度的模型
2. **实例化渲染**: 相同几何体使用 InstancedMesh
3. **纹理压缩**: 使用压缩纹理减少显存占用
4. **动画节流**: 非可见区域的动画暂停更新
5. **对象池**: AGV、产品对象复用，避免频繁创建销毁
6. **阴影优化**: 使用阴影贴图，限制阴影投射范围

```javascript
// 对象池示例
class ObjectPool {
    constructor(createFn, resetFn, initialSize = 10) {
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.available = [];
        this.inUse = new Set();
        
        for (let i = 0; i < initialSize; i++) {
            this.available.push(this.createFn());
        }
    }
    
    acquire() {
        let obj = this.available.pop();
        if (!obj) {
            obj = this.createFn();
        }
        this.inUse.add(obj);
        return obj;
    }
    
    release(obj) {
        if (this.inUse.has(obj)) {
            this.inUse.delete(obj);
            this.resetFn(obj);
            this.available.push(obj);
        }
    }
}

// 使用对象池管理产品
const productPool = new ObjectPool(
    () => createProductMesh(),
    (mesh) => {
        mesh.position.set(0, 0, 0);
        mesh.visible = false;
    },
    20
);
```

### 6.8 文件结构

```
public/
├── index.html                    # 教学实训平台首页
├── pipeline-control.html         # 流水线控制3D仿真
├── simulation.html               # 工业机器人实训
├── 3d-scene.html                 # 3D场景
├── code-logic.html               # 代码逻辑展示
├── fms-home.html                 # 柔性制造概览（新增）
├── fms-simulation.html           # 3D柔性产线仿真（新增）
├── fms-compare.html              # 刚柔对比分析（新增）
├── fms-mes.html                  # MES调度中心（新增）
├── css/
│   ├── common.css               # 公共样式
│   └── fms.css                  # FMS模块样式（新增）
├── js/
│   ├── fms/
│   │   ├── scene.js             # 3D场景管理
│   │   ├── devices.js           # 设备模型和动画
│   │   ├── agv.js               # AGV控制和路径规划
│   │   ├── animation.js         # 动画系统
│   │   ├── data.js              # 数据模型和状态管理
│   │   ├── visualization.js     # Canvas 2D可视化
│   │   └── mes.js               # MES调度逻辑
│   └── common.js                # 公共工具函数
└── assets/
    └── fms/                     # FMS相关资源
        ├── icons/               # 图标
        └── textures/            # 纹理贴图
```

---

## 7. 附录

### 7.1 术语表

| 术语 | 英文 | 说明 |
|------|------|------|
| 柔性制造系统 | Flexible Manufacturing System (FMS) | 能够灵活适应产品变化的自动化制造系统 |
| CNC | Computer Numerical Control | 计算机数控加工中心 |
| AGV | Automated Guided Vehicle | 自动导引运输车 |
| MES | Manufacturing Execution System | 制造执行系统 |
| OEE | Overall Equipment Effectiveness | 设备综合效率 |
| BOM | Bill of Materials | 物料清单 |
| 换型 | Changeover | 从生产一种产品切换到另一种产品的过程 |
| 插单 | Rush Order Insertion | 在已有生产计划中插入紧急订单 |

### 7.2 参考标准

- GB/T 25485-2010 工业自动化系统与集成
- GB/T 20720-2006 企业控制系统集成
- IEC 62264 企业控制系统集成标准

### 7.3 开发计划建议

| 阶段 | 内容 | 预计工期 |
|------|------|---------|
| 第一阶段 | fms-home.html 页面开发 | 3天 |
| 第二阶段 | fms-simulation.html 3D场景搭建 | 7天 |
| 第三阶段 | 设备动画和交互逻辑 | 5天 |
| 第四阶段 | fms-compare.html 对比页面 | 3天 |
| 第五阶段 | fms-mes.html MES调度界面 | 5天 |
| 第六阶段 | 集成测试和优化 | 3天 |
| **总计** | | **约26天** |

### 7.4 后续扩展方向

1. **更多产品类型**: 扩展支持汽车零件、医疗器械等产品
2. **数字孪生对接**: 与真实设备数据对接，实现虚实同步
3. **VR/AR支持**: 增加VR沉浸式体验模式
4. **多人协作**: 支持多学生同时操作不同工位
5. **AI调度算法**: 引入智能排产算法优化
6. **故障模拟**: 增加设备故障场景，训练应急处理

---

*文档结束*
