
prd_content = """# Mini Room Designer — 产品需求文档 (PRD)

> **版本**: v1.0 MVP  
> **目标**: 编程比赛作品，1-3天快速开发  
> **技术栈**: Vue 3 + Vite + Three.js (@tresjs/core) + Pinia + Naive UI  

---

## 1. 项目概述

### 1.1 一句话说明
用户在网页中拖拽家具、切换房间风格，实时预览 3D 房间效果——一个极简版在线室内设计工具。

### 1.2 目标用户
- 室内设计爱好者
- 家具选购前的空间规划用户
- 比赛评委（需要快速理解项目价值）

### 1.3 核心价值
- **低门槛**: 无需专业设计知识，拖拽即可
- **即时反馈**: 2D 编辑与 3D 预览实时同步
- **风格化**: 一键切换北欧/日式/工业风，快速出效果

---

## 2. 功能需求

### 2.1 MVP 核心功能（必须完成）

| 功能模块 | 需求描述 | 优先级 |
|---------|---------|--------|
| 2D 平面编辑 | 网格化房间平面，支持家具拖拽摆放 | P0 |
| 3D 实时预览 | 基于 Three.js 的实时 3D 渲染，与 2D 数据同步 | P0 |
| 家具库 | 提供 5 种基础家具：沙发、茶几、双人床、书桌、椅子 | P0 |
| 风格切换 | 3 种预设风格：北欧风、日式风、工业风 | P0 |
| 2D/3D 切换 | 按钮切换视图模式 | P0 |

### 2.2 加分功能（可选）

| 功能模块 | 需求描述 | 优先级 |
|---------|---------|--------|
| 一键生成房间 | 随机算法自动布置家具 | P1 |
| 截图导出 | 导出当前设计为图片 | P1 |
| 家具交互动画 | 点击家具高亮/弹跳反馈 | P1 |

---

## 3. 页面结构

```
┌─────────────────────────────────────────────────────────────┐
│  [Logo]  Mini Room Designer          [北欧] [日式] [工业]   │  ← 顶部导航栏
├──────────┬──────────────────────────┬───────────────────────┤
│          │                          │                       │
│  家具库   │                          │   3D 实时预览         │
│  (拖拽区) │      2D 平面编辑区        │   (Three.js Canvas)   │
│          │      (网格画布)            │                       │
│  🛋 沙发  │                          │                       │
│  🪑 椅子  │                          │                       │
│  🛏 床   │                          │                       │
│  📚 书桌  │                          │                       │
│  ☕ 茶几  │                          │                       │
│          │                          │                       │
├──────────┴──────────────────────────┴───────────────────────┤
│  底部状态栏: 当前家具数: 3 | 房间面积: 20㎡                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. 数据结构

### 4.1 房间数据 (Pinia Store)

```typescript
interface RoomItem {
  id: string;           // 唯一标识
  type: FurnitureType;  // 家具类型
  position: { x: number; y: number; z: number };  // 3D 坐标
  rotation: number;     // 旋转角度 (0, 90, 180, 270)
  style: StyleType;     // 当前应用的风格
}

type FurnitureType = 'sofa' | 'chair' | 'bed' | 'desk' | 'coffee_table';
type StyleType = 'nordic' | 'japanese' | 'industrial';

interface RoomState {
  items: RoomItem[];           // 房间内的家具列表
  currentStyle: StyleType;     // 当前全局风格
  selectedItemId: string | null;  // 当前选中家具
  viewMode: '2d' | '3d';       // 视图模式
}
```

### 4.2 风格配置

```typescript
interface StyleConfig {
  name: string;
  wallColor: string;      // 墙壁颜色
  floorColor: string;       // 地板颜色
  ambientLight: number;     // 环境光强度
  directionalLight: number; // 平行光强度
  furnitureColors: Record<FurnitureType, string>;  // 各家具颜色
}

const styleConfigs: Record<StyleType, StyleConfig> = {
  nordic: {
    name: '北欧风',
    wallColor: '#F5F5F0',
    floorColor: '#D4C4A8',
    ambientLight: 0.6,
    directionalLight: 0.8,
    furnitureColors: {
      sofa: '#8B9A7C',
      chair: '#C4B9AC',
      bed: '#E8E0D5',
      desk: '#A0937D',
      coffee_table: '#C4B9AC'
    }
  },
  japanese: {
    name: '日式风',
    wallColor: '#F0EDE5',
    floorColor: '#C4A882',
    ambientLight: 0.5,
    directionalLight: 0.6,
    furnitureColors: {
      sofa: '#B8A99A',
      chair: '#8B7355',
      bed: '#D4C4B0',
      desk: '#6B5B4F',
      coffee_table: '#A0937D'
    }
  },
  industrial: {
    name: '工业风',
    wallColor: '#C0C0C0',
    floorColor: '#696969',
    ambientLight: 0.4,
    directionalLight: 1.0,
    furnitureColors: {
      sofa: '#4A4A4A',
      chair: '#2F4F4F',
      bed: '#5C5C5C',
      desk: '#3C3C3C',
      coffee_table: '#505050'
    }
  }
};
```

### 4.3 家具尺寸定义

```typescript
interface FurnitureSize {
  width: number;   // x 轴长度
  depth: number;   // z 轴长度
  height: number;  // y 轴高度
}

const furnitureSizes: Record<FurnitureType, FurnitureSize> = {
  sofa:        { width: 2.0, depth: 0.9, height: 0.8 },
  chair:       { width: 0.6, depth: 0.6, height: 0.9 },
  bed:         { width: 1.8, depth: 2.0, height: 0.5 },
  desk:        { width: 1.2, depth: 0.6, height: 0.75 },
  coffee_table:{ width: 1.0, depth: 0.5, height: 0.45 }
};
```

---

## 5. 交互设计

### 5.1 拖拽放置流程

```
1. 用户从左侧家具库拖拽家具图标
2. 拖入 2D 编辑区时，显示半透明家具占位
3. 释放鼠标 → 在释放位置创建家具
4. 家具自动吸附到网格（grid snapping）
5. 3D 预览区同步更新
```

### 5.2 家具操作

| 操作 | 触发方式 | 效果 |
|------|---------|------|
| 选中家具 | 单击 | 家具边框高亮，显示操作手柄 |
| 移动家具 | 拖拽已放置家具 | 在 2D 平面内移动，吸附网格 |
| 旋转家具 | 点击旋转按钮 / R 键 | 顺时针旋转 90° |
| 删除家具 | 点击删除按钮 / Delete 键 | 从房间移除 |
| 切换风格 | 点击顶部风格按钮 | 全局更新材质和光照 |

### 5.3 网格系统

- 房间尺寸: 10m × 10m (100 个网格单元)
- 网格单元: 0.5m × 0.5m
- 吸附精度: 0.5m (家具位置对齐到网格)

---

## 6. 3D 渲染规范

### 6.1 场景设置

| 元素 | 配置 |
|------|------|
| 相机 | PerspectiveCamera, 位置 (5, 8, 10), 看向 (5, 0, 5) |
| 渲染器 | WebGLRenderer, 开启阴影 |
| 控制器 | OrbitControls, 允许旋转/缩放/平移 |
| 地板 | 10×10 平面，接收阴影 |
| 墙壁 | 3 面墙（后、左、右），高度 3m |

### 6.2 家具 3D 模型

> MVP 使用基础几何体组合，无需外部模型文件

| 家具 | 几何体组合 |
|------|-----------|
| 沙发 | BoxGeometry(主体) + 2×BoxGeometry(扶手) + BoxGeometry(靠背) |
| 椅子 | BoxGeometry(座面) + 4×BoxGeometry(椅腿) + BoxGeometry(靠背) |
| 床 | BoxGeometry(床垫) + 4×BoxGeometry(床腿) + BoxGeometry(床头板) |
| 书桌 | BoxGeometry(桌面) + 4×BoxGeometry(桌腿) |
| 茶几 | BoxGeometry(桌面) + 4×CylinderGeometry(桌腿) |

### 6.3 光照设置

```
环境光 (AmbientLight): 颜色 #ffffff, 强度根据风格变化
平行光 (DirectionalLight): 位置 (5, 10, 5), 产生阴影
点光源 (PointLight): 可选，增加氛围
```

---

## 7. 组件拆分

```
src/
├── components/
│   ├── AppHeader.vue          # 顶部导航栏（Logo + 风格切换）
│   ├── FurniturePanel.vue     # 左侧家具库（可拖拽列表）
│   ├── Canvas2D.vue           # 2D 平面编辑画布
│   ├── ThreeScene.vue         # 3D 场景（TresJS）
│   ├── FurnitureItem.vue      # 2D 家具渲染组件
│   ├── Furniture3D.vue        # 3D 家具渲染组件
│   └── StatusBar.vue          # 底部状态栏
├── stores/
│   └── roomStore.ts           # Pinia 状态管理
├── composables/
│   ├── useDragAndDrop.ts      # 拖拽逻辑
│   └── useGridSnap.ts         # 网格吸附
├── constants/
│   ├── furniture.ts           # 家具定义
│   └── styles.ts              # 风格配置
├── types/
│   └── index.ts               # TypeScript 类型定义
├── App.vue                    # 主布局
└── main.ts                    # 入口
```

---

## 8. API 接口（无后端，纯前端）

本项目为纯前端应用，无需后端 API。数据持久化使用 `localStorage`：

```typescript
// 保存房间设计
localStorage.setItem('room_design', JSON.stringify(roomStore.items));

// 读取房间设计
const saved = localStorage.getItem('room_design');
if (saved) roomStore.items = JSON.parse(saved);
```

---

## 9. 性能要求

| 指标 | 目标 |
|------|------|
| 首屏加载 | < 3s |
| 3D 帧率 | > 30fps |
| 家具拖拽响应 | < 100ms |
| 风格切换响应 | < 200ms |
| 支持家具数量 | ≥ 20 个 |

---

## 10. 比赛展示建议

### 10.1 演示流程（3 分钟）

1. **开场** (30s): 展示空房间，说明项目定位
2. **核心功能** (90s): 
   - 拖拽 3-5 个家具布置房间
   - 切换 3 种风格，展示视觉效果差异
   - 旋转/移动家具，展示编辑能力
3. **亮点展示** (60s):
   - 一键随机生成房间布局
   - 导出设计截图
4. **技术总结** (30s): Vue 3 + Three.js 技术栈，数据驱动 3D 渲染

### 10.2 答辩话术要点

- "我们做了一个数据驱动的 3D 房间设计器"
- "2D 编辑和 3D 预览完全同步，所有操作实时响应"
- "风格切换通过配置化实现，易于扩展更多风格"
- "使用 TresJS 简化 Three.js 在 Vue 中的集成"

---

## 11. 开发排期

| 时间 | 任务 | 产出 |
|------|------|------|
| Day 1 上午 | 项目搭建 + 基础布局 | 可运行的空壳页面 |
| Day 1 下午 | Three.js 场景初始化 | 3D 空房间（地板+墙壁+灯光） |
| Day 2 上午 | 2D 画布 + 拖拽系统 | 可拖拽放置家具到 2D 平面 |
| Day 2 下午 | 3D 家具渲染 + 数据同步 | 2D/3D 实时同步 |
| Day 3 上午 | 风格切换 + UI 美化 | 完整的风格切换功能 |
| Day 3 下午 | 加分功能 + 调试优化 | 随机生成 + 截图导出 |

---

## 12. 风险评估

| 风险 | 应对方案 |
|------|---------|
| Three.js 学习成本高 | 使用 TresJS 简化，MVP 用基础几何体 |
| 3D 性能问题 | 控制家具数量，使用简单材质，关闭复杂阴影 |
| 拖拽坐标映射复杂 | 2D 画布与 3D 世界使用统一坐标系（米制） |
| 时间不够 | 优先完成 P0 功能，加分功能视情况取舍 |

---

*文档版本: v1.0*  
*最后更新: 2026-07-04*
"""

with open('/mnt/agents/output/Mini_Room_Designer_PRD.md', 'w', encoding='utf-8') as f:
    f.write(prd_content)

print("PRD 文档已生成！")
print(f"文件大小: {len(prd_content)} 字符")
