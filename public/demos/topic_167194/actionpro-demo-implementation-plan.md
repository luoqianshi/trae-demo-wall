# ActionPro 初赛 Demo 实施计划

> 基于 PRD v1.0 + 用户最新需求 + Keep 动作库调研，制定完整开发计划

---

## 一、当前状态

- PRD 已定稿于 `/workspace/actionpro-prd.md`
- 旧版 5 个 HTML 页面位于 `/workspace/actionpro-app/`，功能不对、设计不够，需全部重写
- 可复用资产：3 个字体文件、品牌主视觉图、设计哲学文档
- Seedream 图像生成缺少 API Key，改用内置 GenerateImage 工具生成动作配图

---

## 二、用户最新需求变更（vs PRD v1.0）

| 变更项 | PRD v1.0 | 最新需求 |
|--------|----------|---------|
| 标签体系 | 7 个一级标签 | 增加 5 个二级功能标签（肌肥大/力量/爆发力/功能性/稳定性） |
| 动作数量 | 30-40 个 | 53 个，覆盖所有标签 |
| 个人动作库 vs 组合 | 未明确区分 | 两个独立模块（library.html / combos.html） |
| 组合修改 | 覆盖保存 | 覆盖保存 + 另存为新版本 |
| AI 动作识别 | 完全隐藏 | 在页面上展示入口，点开显示"暂未完成" |

---

## 三、文件结构

```
/workspace/actionpro-app/
├── index.html                 # 首页 - 品牌展示 + 标签选择
├── generate.html              # 生成结果页 - 动作列表 + 勾选 + 按功能分组
├── detail.html                # 动作详情页 - 大图轮播 + 肌肉/功能/模式
├── library.html               # 个人动作库 - 独立模块
├── combos.html                # 个人组合列表 - 独立模块
├── combo-detail.html          # 组合详情/编辑 - 覆盖保存 + 另存新版本
├── upload.html                # AI上传动作入口 - "功能开发中"
├── data/
│   └── exercises.json         # 53 个动作完整数据
├── assets/
│   ├── style.css              # 全局样式（重写）
│   ├── app.js                 # 核心逻辑（重写）
│   ├── storage.js             # localStorage 读写封装
│   ├── router.js              # URL 参数传递工具
│   └── images/
│       ├── exercises/         # 106 张动作图（每动作 2 张）
│       │   ├── leg_001_start.png
│       │   ├── leg_001_end.png
│       │   └── ...（共 106 张）
│       └── brand/              # 品牌图（从旧 assets 移入）
├── fonts/                     # 保留现有 3 个字体文件
└── actionpro_design_philosophy.md  # 保留参考
```

需删除的旧文件：`discover.html`、`analyze.html`

---

## 四、标签体系设计

### 一级标签（部位/器械，单选）

| ID | 名称 | 动作数量 |
|----|------|---------|
| legs | 腿部 | 12 |
| upper | 上半身 | 13 |
| fullbody | 全身核心 | 9 |
| bodyweight | 徒手 | 7 |
| crossfit | CrossFit | 8 |
| landmine | 地雷杆 | 4 |
| random | 随机 | - |

### 二级功能标签（单选，可选）

| ID | 名称 |
|----|------|
| hypertrophy | 肌肥大 |
| strength | 力量 |
| power | 爆发力 |
| functional | 功能性 |
| stability | 稳定性 |

---

## 五、53 个动作列表

### A. 腿部（12 个）

| ID | 名称 | 功能 | 目标肌肉 | 模式 | 难度 |
|----|------|------|----------|------|------|
| leg_001 | 前蹲 | 功能性、力量 | 股四头肌、核心 | 深蹲 | 中级 |
| leg_002 | 杠铃深蹲 | 肌肥大、力量 | 股四头肌、臀大肌 | 深蹲 | 中级 |
| leg_003 | 杯蹲 | 功能性、力量 | 股四头肌、臀大肌 | 深蹲 | 初级 |
| leg_004 | 罗马尼亚硬拉 | 肌肥大、力量 | 腘绳肌、臀大肌 | 髋铰链 | 中级 |
| leg_005 | 保加利亚分腿蹲 | 肌肥大、功能性 | 股四头肌、臀大肌 | 单侧蹲 | 中级 |
| leg_006 | 壶铃摇摆 | 爆发力、功能性 | 臀大肌、腘绳肌 | 髋铰链 | 中级 |
| leg_007 | 箱跳 | 爆发力 | 股四头肌、臀大肌 | 爆发力增强式 | 中级 |
| leg_008 | 单腿硬拉 | 功能性、稳定性 | 腘绳肌、臀大肌 | 髋铰链 | 中级 |
| leg_009 | 交叉弓步蹲起 | 功能性、稳定性 | 股四头肌、臀大肌、核心 | 弓步 | 中级 |
| leg_010 | 腿举 | 肌肥大 | 股四头肌 | 深蹲 | 初级 |
| leg_011 | 坐姿腿弯举 | 肌肥大 | 腘绳肌 | 孤立 | 初级 |
| leg_012 | 提踵 | 肌肥大 | 腓肠肌、比目鱼肌 | 孤立 | 初级 |

### B. 上半身（13 个）

| ID | 名称 | 功能 | 目标肌肉 | 模式 | 难度 |
|----|------|------|----------|------|------|
| upper_001 | 哑铃上斜卧推 | 肌肥大 | 胸大肌上部、三角肌前束 | 水平推 | 中级 |
| upper_002 | 杠铃划船 | 肌肥大、力量 | 背阔肌、斜方肌、菱形肌 | 水平拉 | 中级 |
| upper_003 | 高位下拉 | 肌肥大 | 背阔肌、肱二头肌 | 垂直拉 | 初级 |
| upper_004 | 哑铃肩推 | 肌肥大、力量 | 三角肌前中束 | 垂直推 | 中级 |
| upper_005 | 倒立俯卧撑 | 力量、功能性 | 三角肌前束、斜方肌 | 垂直推 | 高级 |
| upper_006 | 俯身哑铃飞鸟 | 肌肥大 | 三角肌后束 | 水平拉 | 初级 |
| upper_007 | 双杠臂屈伸 | 肌肥大、力量 | 胸大肌下部、肱三头肌 | 垂直推 | 中级 |
| upper_008 | 哑铃弯举 | 肌肥大 | 肱二头肌 | 孤立 | 初级 |
| upper_009 | 绳索下压 | 肌肥大 | 肱三头肌 | 孤立 | 初级 |
| upper_010 | 面拉 | 功能性、稳定性 | 三角肌后束、菱形肌 | 水平拉 | 初级 |
| upper_011 | 吊环划船 | 功能性、力量 | 背阔肌、核心 | 水平拉 | 高级 |
| upper_012 | 左右引体向上 | 力量、功能性 | 背阔肌、肱二头肌、核心 | 垂直拉 | 高级 |
| upper_013 | TRX悬挂式训练 | 功能性、稳定性 | 背阔肌、核心、肩部 | 水平拉 | 中级 |

### C. 全身核心（9 个）

| ID | 名称 | 功能 | 目标肌肉 | 模式 | 难度 |
|----|------|------|----------|------|------|
| fullbody_001 | 波比跳 | 爆发力、功能性 | 全身 | 复合 | 中级 |
| fullbody_002 | 壶铃翻+推举 | 爆发力、力量 | 全身 | 爆发力复合 | 高级 |
| fullbody_003 | 硬拉 | 力量 | 竖脊肌、臀大肌、腘绳肌 | 髋铰链 | 中级 |
| fullbody_004 | 农夫行走 | 功能性、稳定性 | 斜方肌、核心、前臂 | 搬运 | 中级 |
| fullbody_005 | 平板支撑 | 稳定性 | 腹横肌、竖脊肌 | 核心稳定 | 初级 |
| fullbody_006 | 死虫式 | 稳定性、功能性 | 腹直肌、腹横肌 | 核心稳定 | 初级 |
| fullbody_007 | 鸟狗式 | 稳定性 | 腹横肌、竖脊肌、臀中肌 | 核心稳定 | 初级 |
| fullbody_008 | 药球砸地 | 爆发力、功能性 | 腹直肌、三角肌、背阔肌 | 垂直推+旋转 | 中级 |
| fullbody_009 | 药球侧抛 | 爆发力、功能性 | 腹斜肌、肩部、臀大肌 | 旋转 | 中级 |

### D. 徒手（7 个）

| ID | 名称 | 功能 | 目标肌肉 | 模式 | 难度 |
|----|------|------|----------|------|------|
| bodyweight_001 | 徒手深蹲 | 功能性 | 股四头肌、臀大肌 | 深蹲 | 初级 |
| bodyweight_002 | 交替箭步蹲 | 功能性、肌肥大 | 股四头肌、臀大肌 | 弓步步态 | 初级 |
| bodyweight_003 | 登山者 | 功能性、爆发力 | 腹直肌、髂腰肌、肩部 | 核心步态 | 初级 |
| bodyweight_004 | 悬挂举腿 | 肌肥大、功能性 | 腹直肌下部、髂腰肌 | 核心稳定 | 高级 |
| bodyweight_005 | 熊爬 | 功能性、稳定性 | 肩部、核心、股四头肌 | 步态搬运 | 初级 |
| bodyweight_006 | 冲刺跑 | 爆发力 | 股四头肌、臀大肌、核心 | 步态 | 中级 |
| bodyweight_007 | 钻石俯卧撑 | 肌肥大、功能性 | 胸大肌、肱三头肌、三角肌前束 | 水平推 | 中级 |

### E. CrossFit（8 个）

| ID | 名称 | 功能 | 目标肌肉 | 模式 | 难度 |
|----|------|------|----------|------|------|
| crossfit_001 | 抓举 | 爆发力、力量 | 全身 | 爆发力复合 | 高级 |
| crossfit_002 | 挺举 | 爆发力、力量 | 全身 | 爆发力复合 | 高级 |
| crossfit_003 | 借力推 | 爆发力、力量 | 三角肌、肱三头肌、核心 | 垂直推 | 中级 |
| crossfit_004 | 壶铃翻 | 爆发力、功能性 | 背阔肌、臀大肌、核心 | 髋铰链+垂直拉 | 中级 |
| crossfit_005 | 双摇跳绳 | 爆发力、功能性 | 小腿、前臂、核心 | 复合 | 高级 |
| crossfit_006 | Turkish Get-Up | 功能性、稳定性 | 肩部、核心、臀大肌 | 复合 | 中级 |
| crossfit_007 | 壶铃风车 | 功能性、稳定性 | 腹斜肌、肩部稳定肌群 | 旋转 | 中级 |
| crossfit_008 | 单腿跳箱 | 爆发力、功能性 | 股四头肌、臀大肌 | 爆发力增强式 | 高级 |

### F. 地雷杆（4 个）

| ID | 名称 | 功能 | 目标肌肉 | 模式 | 难度 |
|----|------|------|----------|------|------|
| landmine_001 | 地雷杆单臂推举 | 功能性、肌肥大 | 三角肌前中束、胸大肌 | 垂直推弧线 | 初级 |
| landmine_002 | 地雷杆单臂划船 | 肌肥大、功能性 | 背阔肌、斜方肌 | 水平拉弧线 | 初级 |
| landmine_003 | 地雷杆180度旋转推 | 爆发力、功能性 | 腹斜肌、肩部、臀大肌 | 旋转推 | 中级 |
| landmine_004 | 地雷杆前蹲 | 肌肥大、功能性 | 股四头肌、臀大肌、核心 | 深蹲 | 中级 |

---

## 六、数据结构

### exercises.json

```json
{
  "version": "1.0",
  "tags": { "primary": [...], "secondary": [...] },
  "exercises": [
    {
      "id": "leg_001",
      "name": "杠铃深蹲",
      "nameEn": "Barbell Squat",
      "primaryTag": "legs",
      "secondaryTag": "hypertrophy",
      "muscles": ["股四头肌", "臀大肌"],
      "movementPattern": "深蹲",
      "difficulty": "中级",
      "description": "杠铃置于上背，双脚与肩同宽，下蹲至大腿平行地面后站起。",
      "images": {
        "start": "assets/images/exercises/leg_001_start.png",
        "end": "assets/images/exercises/leg_001_end.png"
      }
    }
  ]
}
```

### localStorage

- `actionpro_exercises`：用户单独保存的动作 ID 列表 `[{id, savedAt}]`
- `actionpro_combos`：用户保存的组合 `[{id, name, createdAt, updatedAt, primaryTag, exerciseIds}]`

---

## 七、页面核心交互

### 首页 → 生成页

用户选择一级标签（必选）+ 二级功能标签（可选），点击"生成动作" → `generate.html?primary=legs&secondary=hypertrophy`

### 生成页核心流程

1. 读取 URL 参数，从 exercises.json 筛选匹配动作
2. 随机抽取 6-8 个，按 secondaryTag 分组展示
3. 每动作卡片：2 张图轮播 + 名称 + 肌肉标签 + 勾选按钮
4. 底部浮动栏：已选数量 + "完成选择"按钮
5. 点击"完成选择" → 弹出命名弹窗 → 保存到 localStorage → 跳转组合详情页

### 组合详情页

1. 展示组合内所有动作，可移除
2. "添加更多动作"区域展示全库其他动作，支持标签筛选
3. 两个保存按钮：
   - "覆盖保存"：更新 exerciseIds 和 updatedAt，保持原 ID
   - "另存为新版本"：生成新 ID 和新 createdAt

### 个人动作库 vs 个人组合

- **library.html**：展示用户从详情页"保存到动作库"的单独动作
- **combos.html**：展示用户从生成页"完成选择"保存的动作组合
- 两个页面导航栏独立入口，互不关联

---

## 八、配图生成策略

### 工具

使用 GenerateImage（内置工具），每动作生成 2 张图，共 106 张。

### Prompt 模板（统一风格）

起始位置：
> Fitness exercise starting position illustration: [动作名+姿态描述]. Minimalist anatomical diagram style, single athletic figure on plain light background, clean lines, no text, no watermark, side view, educational reference, technical drawing aesthetic.

结束位置：
> Fitness exercise end position illustration: [动作名+姿态描述], motion trail arrows. Minimalist anatomical diagram style, single athletic figure on plain light background, clean lines, no text, no watermark, side view, educational reference.

### 降级方案

如果 AI 生成质量不理想，用 JS 动态生成简笔人体姿态 SVG 作为占位图。

---

## 九、实施步骤

### Step 1：清理与搭建

- 删除 `discover.html`、`analyze.html`
- 创建目录：`data/`、`assets/images/exercises/`、`assets/images/brand/`
- 移动品牌图到 `assets/images/brand/`
- 创建 7 个 HTML 文件骨架 + CSS + 3 个 JS 空文件

### Step 2：设计系统

- 编写 `style.css`：CSS 变量、Reset、导航栏、按钮系统、标签系统、卡片系统、轮播、浮动栏、弹窗、响应式
- 导航栏包含 4 个入口：首页 / 动作库 / 组合 / 上传动作

### Step 3：数据层

- 编写 `data/exercises.json`：53 个动作完整数据
- 编写 `storage.js`：localStorage CRUD 封装
- 编写 `router.js`：URL 参数工具

### Step 4：配图生成

- 为 53 个动作编写起始/结束姿态描述
- 按批次调用 GenerateImage 生成 106 张图
- 保存到 `assets/images/exercises/`

### Step 5：首页开发

- 品牌展示区 + 7 个一级标签卡片 + 5 个二级功能 pill + 生成按钮
- 安全提示："尝试新动作要从小重量慢慢开始"（醒目位置展示）
- 底部快速入口

### Step 6：生成结果页开发

- 数据加载 → 筛选 → 随机抽取 → 按功能分组 → 卡片渲染 → 图片轮播 → 勾选 → 浮动栏 → 命名弹窗 → 保存

### Step 7：动作详情页开发

- 大图轮播 + 信息展示 + "保存到动作库"按钮

### Step 8：个人动作库开发

- 从 localStorage 读取 → 渲染卡片 → 删除功能 → 空状态

### Step 9：个人组合页开发

- 组合列表 → 查看按钮 → 删除功能 → 空状态

### Step 10：组合详情页开发

- 动作列表 → 移除 → 添加更多动作（含标签筛选）→ 覆盖保存 + 另存新版本

### Step 11：上传动作入口页开发

- "功能开发中"占位页面

### Step 12：app.js 主逻辑集成

- ExerciseData 数据加载、Carousel 轮播组件、各页面初始化

### Step 13：联调

- 完整流程测试：选标签 → 生成 → 勾选 → 保存组合 → 编辑组合 → 另存新版本
- 独立保存动作流程测试
- localStorage 持久化验证
- 随机标签逻辑验证
- 移动端适配验证

---

## 十、关键设计决策

| 决策 | 选择 | 理由 |
|------|------|------|
| 个人动作库/组合 | 两个独立模块 | 用户需求明确要求 |
| 组合修改 | 覆盖 + 另存新版本 | 用户需求明确要求 |
| AI 识别入口 | 展示但不可用 | 用户需求明确要求 |
| 二级标签行为 | 单选可选（不选=不过滤） | 简单直观，避免结果为空 |
| 页面传参 | URL Query String | 无后端最简方案，刷新后状态保持 |
| 数据引用方式 | ID 引用 exercises.json | 避免冗余和不一致 |
| 配图工具 | GenerateImage | Seedream 缺少 API Key |
| 浮动栏 | 有选中时才显示 | 未选中时不干扰浏览 |

---

## 十一、验证清单

- [ ] 首页 7 个一级标签均可点击，5 个二级标签可切换
- [ ] 生成页按标签筛选后随机生成 6-8 个动作，按功能分组
- [ ] 每动作 2 张图自动轮播
- [ ] 勾选后浮动栏出现，计数正确
- [ ] "完成选择"弹窗可输入名称，保存后跳转组合详情
- [ ] 详情页"保存到动作库"后，library.html 出现该动作
- [ ] 组合详情页可移除动作、添加动作
- [ ] 覆盖保存更新原组合，另存生成新组合
- [ ] 删除组合/动作后列表刷新
- [ ] 随机标签跨所有标签抽取
- [ ] 刷新页面后 localStorage 数据不丢失
- [ ] 移动端布局正常
- [ ] upload.html 显示"功能开发中"
